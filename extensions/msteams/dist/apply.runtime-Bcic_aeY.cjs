require("./rolldown-runtime-u92d-OFm.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_defaults_constants = require("./defaults.constants-BV5EBB5p.cjs");
const require_resolve = require("./resolve-DZ2KQVXJ.cjs");
const require_templating = require("./templating-CINnKoW9.cjs");
require("./defaults-B9T6G8PZ.cjs");
const require_inbound_context = require("./inbound-context-DRXGR9Cr.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/link-understanding/format.ts
/** Appends normalized link-understanding outputs to the agent-visible body. */
function formatLinkUnderstandingBody(params) {
	const outputs = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(params.outputs);
	if (outputs.length === 0) return params.body ?? "";
	const base = (params.body ?? "").trim();
	if (!base) return outputs.join("\n");
	return `${base}\n\n${outputs.join("\n")}`;
}
//#endregion
//#region src/link-understanding/detect.ts
const MARKDOWN_LINK_RE = /\[(?:[^\]]|](?!\())*]\((https?:\/\/\S+?)\)/gi;
const BARE_LINK_RE = /https?:\/\/\S+/gi;
function stripMarkdownLinks(message) {
	return message.replace(MARKDOWN_LINK_RE, " ");
}
function resolveMaxLinks(value) {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
	return 3;
}
function isAllowedUrl(raw) {
	try {
		const parsed = new URL(raw);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
		if (require_fetch_guard.isBlockedHostnameOrIp(parsed.hostname)) return false;
		return true;
	} catch {
		return false;
	}
}
/**
* Extracts unique, SSRF-filtered bare HTTP(S) links from inbound text.
* Markdown links are ignored so display-only citations do not trigger fetches.
*/
function extractLinksFromMessage(message, opts) {
	const source = message?.trim();
	if (!source) return [];
	const maxLinks = resolveMaxLinks(opts?.maxLinks);
	const sanitized = stripMarkdownLinks(source);
	const seen = /* @__PURE__ */ new Set();
	const results = [];
	for (const match of sanitized.matchAll(BARE_LINK_RE)) {
		const raw = match[0]?.trim();
		if (!raw) continue;
		if (!isAllowedUrl(raw)) continue;
		if (seen.has(raw)) continue;
		seen.add(raw);
		results.push(raw);
		if (results.length >= maxLinks) break;
	}
	return results;
}
//#endregion
//#region src/link-understanding/runner.ts
function resolveScopeDecision(params) {
	return require_resolve.resolveMediaUnderstandingScope({
		scope: params.config?.scope,
		sessionKey: params.ctx.SessionKey,
		channel: params.ctx.Surface ?? params.ctx.Provider,
		chatType: require_resolve.normalizeMediaUnderstandingChatType(params.ctx.ChatType)
	});
}
function resolveTimeoutMsFromConfig(params) {
	return require_resolve.resolveTimeoutMs(params.entry.timeoutSeconds ?? params.config?.timeoutSeconds, 30);
}
function resolveFetchTimeoutMsFromConfig(params) {
	if (params.config?.timeoutSeconds != null) return require_resolve.resolveTimeoutMs(params.config.timeoutSeconds, 30);
	return Math.max(...params.entries.map((entry) => resolveTimeoutMsFromConfig({
		config: params.config,
		entry
	})));
}
function isLinkUrlTemplate(value) {
	return value.includes("LinkUrl") || value.includes("LinkFinalUrl");
}
function commandName(command) {
	return (command.split(/[\\/]/).pop() ?? command).toLowerCase();
}
function isUrlFetcherCommand(command) {
	return commandName(command) === "curl" || commandName(command) === "wget";
}
function buildLinkCliArgs(params) {
	const templCtx = {
		...params.ctx,
		LinkFinalUrl: params.finalUrl,
		LinkUrl: params.url
	};
	return params.args.filter((arg) => !isLinkUrlTemplate(arg)).map((arg) => require_templating.applyTemplate(arg, templCtx));
}
async function fetchLinkContent(params) {
	const { response, finalUrl, release } = await require_fetch_guard.fetchWithSsrFGuard({
		url: params.url,
		timeoutMs: params.timeoutMs,
		mode: require_fetch_guard.GUARDED_FETCH_MODE.STRICT,
		auditContext: "link-understanding",
		init: { headers: {
			Accept: "text/*,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"User-Agent": "Operator-LinkUnderstanding/1.0"
		} }
	});
	try {
		if (!response.ok) throw new Error(`Link fetch failed with HTTP ${response.status}`);
		const buffer = await require_http_body.readResponseWithLimit(response, require_defaults_constants.CLI_OUTPUT_MAX_BUFFER);
		const content = new TextDecoder().decode(buffer).trim();
		if (!content) return null;
		return {
			content,
			finalUrl
		};
	} finally {
		await release();
	}
}
async function runCliEntry(params) {
	if ((params.entry.type ?? "cli") !== "cli") return null;
	const command = params.entry.command.trim();
	if (!command) return null;
	const args = params.entry.args ?? [];
	const timeoutMs = resolveTimeoutMsFromConfig({
		config: params.config,
		entry: params.entry
	});
	if (isUrlFetcherCommand(command) && args.some(isLinkUrlTemplate)) return params.content;
	const argv = [command, ...buildLinkCliArgs({
		args,
		ctx: params.ctx,
		finalUrl: params.finalUrl,
		url: params.url
	})];
	if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Link understanding via CLI: ${argv.join(" ")}`);
	const result = await require_exec.runCommandWithTimeout(argv, {
		timeoutMs,
		input: params.content,
		env: {
			OPERATOR_LINK_FINAL_URL: params.finalUrl,
			OPERATOR_LINK_URL: params.url
		}
	});
	if (result.code !== 0) throw new Error(`Link understanding command exited with code ${result.code ?? "unknown"}`);
	return result.stdout.trim() || null;
}
async function runLinkEntries(params) {
	let lastError;
	for (const entry of params.entries) try {
		const output = await runCliEntry({
			content: params.content,
			entry,
			finalUrl: params.finalUrl,
			ctx: params.ctx,
			url: params.url,
			config: params.config
		});
		if (output) return output;
	} catch (err) {
		lastError = err;
		if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Link understanding failed for ${params.url}: ${String(err)}`);
	}
	if (lastError && require_globals.shouldLogVerbose()) require_globals.logVerbose(`Link understanding exhausted for ${params.url}`);
	return null;
}
/**
* Fetches detected links through the SSRF guard and runs configured CLI processors.
* Returns detected URLs even when processors are absent so callers can report discovery.
*/
async function runLinkUnderstanding(params) {
	const config = params.cfg.tools?.links;
	if (!config || config.enabled === false) return {
		urls: [],
		outputs: []
	};
	if (resolveScopeDecision({
		config,
		ctx: params.ctx
	}) === "deny") {
		if (require_globals.shouldLogVerbose()) require_globals.logVerbose("Link understanding disabled by scope policy.");
		return {
			urls: [],
			outputs: []
		};
	}
	const links = extractLinksFromMessage(params.message ?? params.ctx.CommandBody ?? params.ctx.RawBody ?? params.ctx.Body ?? "", { maxLinks: config?.maxLinks });
	if (links.length === 0) return {
		urls: [],
		outputs: []
	};
	const entries = config?.models ?? [];
	if (entries.length === 0) return {
		urls: links,
		outputs: []
	};
	const outputs = [];
	const timeoutMs = resolveFetchTimeoutMsFromConfig({
		config,
		entries
	});
	for (const url of links) {
		let fetched;
		try {
			fetched = await fetchLinkContent({
				url,
				timeoutMs
			});
		} catch (err) {
			if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Link understanding fetch blocked or failed for ${url}: ${String(err)}`);
			continue;
		}
		if (!fetched) continue;
		const output = await runLinkEntries({
			content: fetched.content,
			entries,
			finalUrl: fetched.finalUrl,
			ctx: params.ctx,
			url,
			config
		}) ?? fetched.content;
		if (output) outputs.push(output);
	}
	return {
		urls: links,
		outputs
	};
}
//#endregion
//#region src/link-understanding/apply.ts
/** Runs link understanding and folds successful outputs into the inbound context. */
async function applyLinkUnderstanding(params) {
	const result = await runLinkUnderstanding({
		cfg: params.cfg,
		ctx: params.ctx
	});
	if (result.outputs.length === 0) return result;
	params.ctx.LinkUnderstanding = [...params.ctx.LinkUnderstanding ?? [], ...result.outputs];
	params.ctx.Body = formatLinkUnderstandingBody({
		body: params.ctx.Body,
		outputs: result.outputs
	});
	require_inbound_context.finalizeInboundContext(params.ctx, {
		forceBodyForAgent: true,
		forceBodyForCommands: true
	});
	return result;
}
//#endregion
exports.applyLinkUnderstanding = applyLinkUnderstanding;
