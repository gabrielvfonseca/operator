const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_docs_path = require("./docs-path-BiZHk9Qh.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/system-agent/probes.ts
const LOCAL_COMMAND_PROBE_OUTPUT_MAX_CHARS = 16 * 1024;
/** Probe a command by running a small version command with bounded output and timeout. */
async function probeLocalCommand(command, args = ["--version"], opts = {}) {
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(opts.timeoutMs, 1500);
	const outputLimit = opts.outputLimit ?? LOCAL_COMMAND_PROBE_OUTPUT_MAX_CHARS;
	try {
		const result = await require_exec.runCommandWithTimeout([command, ...args], {
			killProcessTree: true,
			maxOutputBytes: outputLimit,
			timeoutMs
		});
		if (result.termination === "timeout") return {
			command,
			found: true,
			error: `timed out after ${timeoutMs}ms`
		};
		const text = `${result.stdout}\n${result.stderr}`.trim().split(/\r?\n/)[0]?.trim();
		return {
			command,
			found: result.code === 0 || Boolean(text),
			version: text || void 0,
			error: result.code === 0 ? void 0 : `exited ${String(result.code)}`
		};
	} catch (error) {
		const spawnError = error;
		return {
			command,
			found: spawnError.code !== "ENOENT",
			error: spawnError.code === "ENOENT" ? "not found" : spawnError.message
		};
	}
}
/** Probe a Gateway URL by translating it to its HTTP /healthz endpoint. */
async function probeGatewayUrl(url, opts = {}) {
	const httpUrl = url.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
	const healthUrl = new URL("/healthz", httpUrl).toString();
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(opts.timeoutMs, 900);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	let response;
	try {
		response = await fetch(healthUrl, {
			method: "GET",
			signal: controller.signal
		});
		return {
			reachable: response.ok,
			url,
			error: response.ok ? void 0 : response.statusText
		};
	} catch (err) {
		return {
			reachable: false,
			url,
			error: err instanceof Error ? err.message : String(err)
		};
	} finally {
		clearTimeout(timeout);
		await response?.body?.cancel().catch(() => void 0);
	}
}
//#endregion
//#region src/system-agent/overview.ts
var overview_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	formatSystemAgentOnboardingWelcome: () => formatSystemAgentOnboardingWelcome,
	formatSystemAgentOverview: () => formatSystemAgentOverview,
	formatSystemAgentStartupMessage: () => formatSystemAgentStartupMessage,
	loadSystemAgentOverview: () => loadSystemAgentOverview
});
function issueMessages(snapshot) {
	return snapshot.issues.map((issue) => {
		return `${issue.path ? `${issue.path}: ` : ""}${issue.message}`;
	});
}
function buildAgentSummaries(cfg) {
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const entries = require_agent_scope_config.listAgentEntries(cfg);
	if (entries.length === 0) return [{
		id: defaultAgentId,
		isDefault: true,
		model: require_agent_scope.resolveAgentEffectiveModelPrimary(cfg, defaultAgentId)
	}];
	const seen = /* @__PURE__ */ new Set();
	const summaries = [];
	for (const entry of entries) {
		const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id);
		if (seen.has(id)) continue;
		seen.add(id);
		const summary = {
			id,
			isDefault: id === defaultAgentId
		};
		if (typeof entry.name === "string") summary.name = entry.name;
		const model = require_agent_scope.resolveAgentEffectiveModelPrimary(cfg, id);
		if (model) summary.model = model;
		if (typeof entry.workspace === "string") summary.workspace = entry.workspace;
		summaries.push(summary);
	}
	return summaries;
}
function resolveFastTestReferences(env) {
	if (env.OPERATOR_TEST_FAST !== "1") return;
	const sourcePath = process.cwd();
	return {
		sourcePath,
		docsPath: `${sourcePath}/docs`
	};
}
async function loadSystemAgentOverview(opts = {}) {
	const env = opts.env ?? process.env;
	const deps = opts.deps ?? {};
	const snapshot = await (deps.readConfigFileSnapshot ?? require_io.readConfigFileSnapshot)();
	const cfg = snapshot.runtimeConfig ?? snapshot.sourceConfig ?? {};
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const defaultModel = require_agent_scope.resolveAgentEffectiveModelPrimary(cfg, defaultAgentId) ?? require_model_input.resolveAgentModelPrimaryValue(cfg.agents?.defaults?.model);
	const configPath = snapshot.path || (deps.resolveConfigPath ?? require_paths.resolveConfigPath)(env);
	let gatewayUrl = `ws://127.0.0.1:${(deps.resolveGatewayPort ?? require_paths.resolveGatewayPort)(cfg, env)}`;
	let gatewaySource = "local loopback";
	let gatewayError;
	try {
		const details = (deps.buildGatewayConnectionDetails ?? (await Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports)).buildGatewayConnectionDetails)({
			config: cfg,
			configPath
		});
		gatewayUrl = details.url;
		gatewaySource = details.urlSource;
		gatewayError = details.remoteFallbackNote;
	} catch (err) {
		gatewayError = err instanceof Error ? err.message : String(err);
	}
	const resolveReferences = deps.resolveOperatorReferencePaths ?? require_docs_path.resolveOperatorReferencePaths;
	const commandProbe = deps.probeLocalCommand ?? probeLocalCommand;
	const [codex, claude, gemini, gateway, references] = await Promise.all([
		commandProbe("codex"),
		commandProbe("claude"),
		commandProbe("gemini"),
		(deps.probeGatewayUrl ?? probeGatewayUrl)(gatewayUrl),
		resolveFastTestReferences(env) ?? resolveReferences({
			argv1: process.argv[1],
			cwd: process.cwd(),
			moduleUrl: require("url").pathToFileURL(__filename).href
		})
	]);
	return {
		config: {
			path: configPath,
			exists: snapshot.exists,
			valid: snapshot.valid,
			issues: issueMessages(snapshot),
			hash: snapshot.hash ?? null
		},
		agents: buildAgentSummaries(cfg),
		defaultAgentId,
		defaultModel,
		tools: {
			codex,
			claude,
			gemini,
			apiKeys: {
				openai: Boolean(env.OPENAI_API_KEY?.trim()),
				anthropic: Boolean(env.ANTHROPIC_API_KEY?.trim())
			}
		},
		gateway: {
			url: gateway.url,
			source: gatewaySource,
			reachable: gateway.reachable,
			error: gateway.error ?? gatewayError
		},
		references: {
			docsPath: references.docsPath ?? void 0,
			docsUrl: require_docs_path.OPERATOR_DOCS_URL,
			sourcePath: references.sourcePath ?? void 0,
			sourceUrl: require_docs_path.OPERATOR_SOURCE_URL
		}
	};
}
function formatCommandProbe(probe) {
	if (!probe.found) return "not found";
	if (probe.version) return probe.version;
	return probe.error ? `found (${probe.error})` : "found";
}
function formatSystemAgentOverview(overview) {
	const agentLines = overview.agents.map((agent) => {
		return `  - ${[
			agent.id,
			agent.isDefault ? "default" : void 0,
			agent.name ? `name=${agent.name}` : void 0,
			agent.model ? `model=${agent.model}` : void 0,
			agent.workspace ? `workspace=${agent.workspace}` : void 0
		].filter(Boolean).join(" | ")}`;
	});
	const configStatus = overview.config.valid ? overview.config.exists ? "valid" : "missing" : "invalid";
	const issueLines = overview.config.issues.length > 0 ? ["Config issues:", ...overview.config.issues.map((issue) => `  - ${issue}`)] : [];
	return [
		"Operator online. Little claws, typed tools.",
		"",
		`Config: ${configStatus}`,
		`Path: ${overview.config.path}`,
		`Default agent: ${overview.defaultAgentId}`,
		`Default model: ${overview.defaultModel ?? "not configured"}`,
		"Agents:",
		...agentLines,
		`Codex: ${formatCommandProbe(overview.tools.codex)}`,
		`Claude Code: ${formatCommandProbe(overview.tools.claude)}`,
		`Gemini CLI: ${formatCommandProbe(overview.tools.gemini)}`,
		`API keys: OpenAI ${overview.tools.apiKeys.openai ? "found" : "not found"}, Anthropic ${overview.tools.apiKeys.anthropic ? "found" : "not found"}`,
		`AI: ${overview.defaultModel ? `conversation runs on ${overview.defaultModel}` : "inference unavailable; run openclaw onboard before starting Operator"}`,
		`Docs: ${overview.references.docsPath ?? overview.references.docsUrl}`,
		overview.references.sourcePath ? `Source: ${overview.references.sourcePath}` : `Source: ${overview.references.sourceUrl}`,
		`Gateway: ${overview.gateway.reachable ? "reachable" : "not reachable"} (${overview.gateway.url}, ${overview.gateway.source})`,
		overview.gateway.error ? `Gateway note: ${overview.gateway.error}` : void 0,
		`Next: ${recommendSystemAgentNextStep(overview)}`,
		...issueLines
	].filter((line) => line !== void 0).join("\n");
}
function recommendSystemAgentNextStep(overview) {
	if (!overview.config.exists) return "run \"openclaw onboard\" to establish inference";
	if (!overview.config.valid) return "run \"validate config\" or \"doctor\" to inspect the config";
	if (!overview.defaultModel) return "run \"openclaw onboard\" to establish inference";
	if (!overview.gateway.reachable) return "run \"gateway status\" or \"restart gateway\"";
	return "run \"talk to agent\" to enter your default agent";
}
function formatStartupConfigStatus(overview) {
	if (!overview.config.exists) return "missing";
	return overview.config.valid ? "valid" : "invalid";
}
function formatStartupUse(overview) {
	if (overview.defaultModel) return `Using: ${overview.defaultModel} — just tell me what you want.`;
	return "Inference unavailable: run `openclaw onboard` and complete a live model check first.";
}
function formatStartupGatewayStatus(overview) {
	if (overview.gateway.reachable) return `Gateway: reachable at ${overview.gateway.url}.`;
	return `Gateway: not reachable at ${overview.gateway.url}; I already did the first probe.`;
}
function formatStartupAction(overview) {
	if (!overview.config.valid) return "I can start debugging with `validate config` or `doctor`.";
	if (!overview.defaultModel) return "Operator needs working inference before it can help with the rest of setup.";
	if (!overview.config.exists) return "Run `openclaw onboard` to establish inference before starting Operator.";
	if (!overview.gateway.reachable) return "I can start debugging with `gateway status`, or queue `restart gateway` for approval.";
	return "Everything basic is reachable. Use `talk to agent` when you want the normal agent.";
}
/**
* Welcome shown right after inference activation. Operator owns the
* remaining workspace, Gateway, channel, and agent setup.
*/
function formatSystemAgentOnboardingWelcome(overview) {
	return [
		"## Inference is ready.",
		"",
		`- Verified model: ${overview.defaultModel ?? "not configured"}.`,
		`- ${overview.gateway.reachable ? `Gateway: running at ${overview.gateway.url}.` : "Gateway: not configured or reachable yet."}`,
		"- I can now finish your workspace, Gateway, channels, agents, plugins, and other optional setup.",
		"- Connect how you want to talk: say `connect whatsapp`, `connect telegram`, `connect slack`, `connect discord` — or `channels` for the full list.",
		"",
		"Say `talk to agent` to meet your agent right here, or `help` for everything I can do."
	].join("\n");
}
function formatSystemAgentStartupMessage(overview) {
	const agent = overview.agents.find((entry) => entry.id === overview.defaultAgentId);
	const agentLabel = agent?.name ? `${overview.defaultAgentId} (${agent.name})` : overview.defaultAgentId;
	return [
		"## Hi, I'm Operator.",
		"",
		"- Start me when setup, config, Gateway, model choice, or agent routing feels off.",
		`- ${formatStartupUse(overview)}`,
		`- Config: ${formatStartupConfigStatus(overview)}. Default agent: ${agentLabel}.`,
		`- ${formatStartupGatewayStatus(overview)}`,
		"",
		formatStartupAction(overview)
	].join("\n");
}
//#endregion
Object.defineProperty(exports, "formatSystemAgentOnboardingWelcome", {
	enumerable: true,
	get: function() {
		return formatSystemAgentOnboardingWelcome;
	}
});
Object.defineProperty(exports, "formatSystemAgentStartupMessage", {
	enumerable: true,
	get: function() {
		return formatSystemAgentStartupMessage;
	}
});
Object.defineProperty(exports, "loadSystemAgentOverview", {
	enumerable: true,
	get: function() {
		return loadSystemAgentOverview;
	}
});
Object.defineProperty(exports, "overview_exports", {
	enumerable: true,
	get: function() {
		return overview_exports;
	}
});
Object.defineProperty(exports, "probeLocalCommand", {
	enumerable: true,
	get: function() {
		return probeLocalCommand;
	}
});
