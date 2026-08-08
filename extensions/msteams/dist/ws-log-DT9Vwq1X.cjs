const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
require("./globals-D7PiAd5y.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
require("./errors-BqS4bzom.cjs");
const require_reply_payload = require("./reply-payload-DomDFObW.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let chalk = require("chalk");
chalk = require_rolldown_runtime.__toESM(chalk, 1);
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/gateway/ws-logging.ts
let gatewayWsLogStyle = "auto";
/** Returns the active gateway WebSocket log style. */
function getGatewayWsLogStyle() {
	return gatewayWsLogStyle;
}
//#endregion
//#region src/gateway/ws-log.ts
/**
* WebSocket logging helpers for gateway request, response, and event traffic.
*/
const LOG_VALUE_LIMIT = 240;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WS_LOG_REDACT_OPTIONS = {
	mode: "tools",
	patterns: require_redact.getDefaultRedactPatterns()
};
const wsInflightCompact = /* @__PURE__ */ new Map();
let wsLastCompactConnId;
const wsInflightOptimized = /* @__PURE__ */ new Map();
const wsInflightSince = /* @__PURE__ */ new Map();
const wsLog = require_subsystem.createSubsystemLogger("gateway/ws");
const WS_META_SKIP_KEYS = /* @__PURE__ */ new Set([
	"connId",
	"id",
	"method",
	"ok",
	"event"
]);
function collectWsRestMeta(meta) {
	const restMeta = [];
	if (!meta) return restMeta;
	for (const [key, value] of Object.entries(meta)) {
		if (value === void 0) continue;
		if (WS_META_SKIP_KEYS.has(key)) continue;
		restMeta.push(`${chalk.default.dim(key)}=${formatForLog(value)}`);
	}
	return restMeta;
}
function buildWsHeadline(params) {
	if ((params.kind === "req" || params.kind === "res") && params.method) return chalk.default.bold(params.method);
	if (params.kind === "event" && params.event) return chalk.default.bold(params.event);
}
function buildWsStatusToken(kind, ok) {
	if (kind !== "res" || ok === void 0) return;
	return ok ? chalk.default.greenBright("✓") : chalk.default.redBright("✗");
}
function logWsInfoLine(params) {
	const tokens = [
		params.prefix,
		params.statusToken,
		params.headline,
		params.durationToken,
		...params.restMeta,
		...params.trailing
	].filter((t) => Boolean(t));
	wsLog.info(tokens.join(" "));
}
/** Returns true when gateway WebSocket logging is enabled for the current console. */
function shouldLogWs() {
	return require_subsystem.shouldLogSubsystemToConsole("gateway/ws");
}
/** Compacts long ids while keeping enough entropy for log correlation. */
function shortId(value) {
	const s = value.trim();
	if (UUID_RE.test(s)) return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(s, 0, 8)}…${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(s, -4)}`;
	if (s.length <= 24) return s;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(s, 0, 12)}…${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(s, -4)}`;
}
/** Formats and redacts arbitrary values before they are written to gateway logs. */
function formatForLog(value) {
	try {
		if (value instanceof Error) {
			const combined = renderErrorChainForLog(value);
			if (combined) {
				const redacted = require_redact.redactSensitiveText(combined, WS_LOG_REDACT_OPTIONS);
				return redacted.length > LOG_VALUE_LIMIT ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(redacted, LOG_VALUE_LIMIT)}...` : redacted;
			}
		}
		if (value && typeof value === "object") {
			const rec = value;
			if (typeof rec.message === "string" && rec.message.trim()) {
				const name = typeof rec.name === "string" ? rec.name.trim() : "";
				const code = typeof rec.code === "string" || typeof rec.code === "number" ? String(rec.code) : "";
				const parts = [name, rec.message.trim()].filter(Boolean);
				if (code) parts.push(`code=${code}`);
				const combined = require_redact.redactSensitiveText(parts.join(": ").trim(), WS_LOG_REDACT_OPTIONS);
				return combined.length > LOG_VALUE_LIMIT ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(combined, LOG_VALUE_LIMIT)}...` : combined;
			}
		}
		const str = typeof value === "string" || typeof value === "number" ? String(value) : JSON.stringify(value);
		if (!str) return "";
		const redacted = require_redact.redactSensitiveText(str, WS_LOG_REDACT_OPTIONS);
		return redacted.length > LOG_VALUE_LIMIT ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(redacted, LOG_VALUE_LIMIT)}...` : redacted;
	} catch {
		return String(value);
	}
}
function renderSingleErrorForLog(error) {
	const parts = [];
	if (error.name) parts.push(error.name);
	if (error.message) parts.push(error.message);
	const codeValue = error.code;
	const code = typeof codeValue === "string" || typeof codeValue === "number" ? String(codeValue) : "";
	if (code) parts.push(`code=${code}`);
	return parts.filter(Boolean).join(": ").trim();
}
function renderErrorChainForLog(error) {
	const segments = [renderSingleErrorForLog(error)];
	let current = error.cause;
	let depth = 0;
	while (current !== void 0 && current !== null && depth < 8) {
		if (current instanceof Error) {
			segments.push(renderSingleErrorForLog(current));
			current = current.cause;
		} else {
			segments.push((0, _gabrielvfonseca_normalization_core_error_coercion.stringifyNonErrorCause)(current));
			current = void 0;
		}
		depth += 1;
	}
	return segments.filter(Boolean).join(" <- ");
}
function compactPreview(input, maxLen = 160) {
	const oneLine = input.replace(/\s+/g, " ").trim();
	if (oneLine.length <= maxLen) return oneLine;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(oneLine, Math.max(0, maxLen - 1))}…`;
}
/** Extracts small, non-sensitive fields from agent event payloads for WS logs. */
function summarizeAgentEventForWsLog(payload) {
	if (!payload || typeof payload !== "object") return {};
	const rec = payload;
	const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(rec.runId);
	const stream = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(rec.stream);
	const seq = typeof rec.seq === "number" ? rec.seq : void 0;
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(rec.sessionKey);
	const data = rec.data && typeof rec.data === "object" ? rec.data : void 0;
	const extra = {};
	if (runId) extra.run = shortId(runId);
	if (sessionKey) {
		const parsed = require_session_key.parseAgentSessionKey(sessionKey);
		if (parsed) {
			extra.agent = parsed.agentId;
			extra.session = parsed.rest;
		} else extra.session = sessionKey;
	}
	if (stream) extra.stream = stream;
	if (seq !== void 0) extra.aseq = seq;
	if (!data) return extra;
	if (stream === "assistant") {
		const text = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(data.text);
		if (text?.trim()) extra.text = compactPreview(text);
		const mediaCount = require_reply_payload.resolveSendableOutboundReplyParts({ mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : void 0 }).mediaCount;
		if (mediaCount > 0) extra.media = mediaCount;
		return extra;
	}
	if (stream === "tool") {
		const phase = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(data.phase);
		const name = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(data.name);
		if (phase || name) extra.tool = `${phase ?? "?"}:${name ?? "?"}`;
		const toolCallId = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(data.toolCallId);
		if (toolCallId) extra.call = shortId(toolCallId);
		const meta = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(data.meta);
		if (meta?.trim()) extra.meta = meta;
		if (typeof data.isError === "boolean") extra.err = data.isError;
		return extra;
	}
	if (stream === "lifecycle") {
		const phase = typeof data.phase === "string" ? data.phase : void 0;
		if (phase) extra.phase = phase;
		if (typeof data.aborted === "boolean") extra.aborted = data.aborted;
		const error = typeof data.error === "string" ? data.error : void 0;
		if (error?.trim()) extra.error = compactPreview(error, 120);
		return extra;
	}
	const reason = typeof data.reason === "string" ? data.reason : void 0;
	if (reason?.trim()) extra.reason = reason;
	return extra;
}
function logWs(direction, kind, meta) {
	if (!require_subsystem.shouldLogSubsystemToConsole("gateway/ws")) return;
	const style = getGatewayWsLogStyle();
	if (!require_logger.isVerbose()) {
		logWsOptimized(direction, kind, meta);
		return;
	}
	if (style === "compact" || style === "auto") {
		logWsCompact(direction, kind, meta);
		return;
	}
	const now = Date.now();
	const connId = typeof meta?.connId === "string" ? meta.connId : void 0;
	const id = typeof meta?.id === "string" ? meta.id : void 0;
	const method = typeof meta?.method === "string" ? meta.method : void 0;
	const ok = typeof meta?.ok === "boolean" ? meta.ok : void 0;
	const event = typeof meta?.event === "string" ? meta.event : void 0;
	const inflightKey = connId && id ? `${connId}:${id}` : void 0;
	if (direction === "in" && kind === "req" && inflightKey) wsInflightSince.set(inflightKey, now);
	const durationMs = direction === "out" && kind === "res" && inflightKey ? (() => {
		const startedAt = wsInflightSince.get(inflightKey);
		if (startedAt === void 0) return;
		wsInflightSince.delete(inflightKey);
		return now - startedAt;
	})() : void 0;
	const dirArrow = direction === "in" ? "←" : "→";
	const prefix = `${(direction === "in" ? chalk.default.greenBright : chalk.default.cyanBright)(dirArrow)} ${chalk.default.bold(kind)}`;
	const headline = buildWsHeadline({
		kind,
		method,
		event
	});
	const statusToken = buildWsStatusToken(kind, ok);
	const durationToken = typeof durationMs === "number" ? chalk.default.dim(`${durationMs}ms`) : void 0;
	const restMeta = collectWsRestMeta(meta);
	const trailing = [];
	if (connId) trailing.push(`${chalk.default.dim("conn")}=${chalk.default.gray(shortId(connId))}`);
	if (id) trailing.push(`${chalk.default.dim("id")}=${chalk.default.gray(shortId(id))}`);
	logWsInfoLine({
		prefix,
		statusToken,
		headline,
		durationToken,
		restMeta,
		trailing
	});
}
function logWsOptimized(direction, kind, meta) {
	const connId = typeof meta?.connId === "string" ? meta.connId : void 0;
	const id = typeof meta?.id === "string" ? meta.id : void 0;
	const ok = typeof meta?.ok === "boolean" ? meta.ok : void 0;
	const method = typeof meta?.method === "string" ? meta.method : void 0;
	const inflightKey = connId && id ? `${connId}:${id}` : void 0;
	if (direction === "in" && kind === "req" && inflightKey) {
		wsInflightOptimized.set(inflightKey, Date.now());
		if (wsInflightOptimized.size > 2e3) wsInflightOptimized.clear();
		return;
	}
	if (kind === "parse-error") {
		const errorMsg = typeof meta?.error === "string" ? formatForLog(meta.error) : void 0;
		wsLog.warn([
			`${chalk.default.redBright("✗")} ${chalk.default.bold("parse-error")}`,
			errorMsg ? `${chalk.default.dim("error")}=${errorMsg}` : void 0,
			`${chalk.default.dim("conn")}=${chalk.default.gray(shortId(connId ?? "?"))}`
		].filter((t) => Boolean(t)).join(" "));
		return;
	}
	if (direction !== "out" || kind !== "res") return;
	const startedAt = inflightKey ? wsInflightOptimized.get(inflightKey) : void 0;
	if (inflightKey) wsInflightOptimized.delete(inflightKey);
	const durationMs = typeof startedAt === "number" ? Date.now() - startedAt : void 0;
	if (!(ok === false || typeof durationMs === "number" && durationMs >= 50)) return;
	const statusToken = buildWsStatusToken("res", ok);
	const durationToken = typeof durationMs === "number" ? chalk.default.dim(`${durationMs}ms`) : void 0;
	const restMeta = collectWsRestMeta(meta);
	logWsInfoLine({
		prefix: `${chalk.default.yellowBright("⇄")} ${chalk.default.bold("res")}`,
		statusToken,
		headline: method ? chalk.default.bold(method) : void 0,
		durationToken,
		restMeta,
		trailing: [connId ? `${chalk.default.dim("conn")}=${chalk.default.gray(shortId(connId))}` : "", id ? `${chalk.default.dim("id")}=${chalk.default.gray(shortId(id))}` : ""].filter(Boolean)
	});
}
function logWsCompact(direction, kind, meta) {
	const now = Date.now();
	const connId = typeof meta?.connId === "string" ? meta.connId : void 0;
	const id = typeof meta?.id === "string" ? meta.id : void 0;
	const method = typeof meta?.method === "string" ? meta.method : void 0;
	const ok = typeof meta?.ok === "boolean" ? meta.ok : void 0;
	const inflightKey = connId && id ? `${connId}:${id}` : void 0;
	if (kind === "req" && direction === "in" && inflightKey) {
		wsInflightCompact.set(inflightKey, {
			ts: now,
			method,
			meta
		});
		return;
	}
	const compactArrow = (() => {
		if (kind === "req" || kind === "res") return "⇄";
		return direction === "in" ? "←" : "→";
	})();
	const prefix = `${(kind === "req" || kind === "res" ? chalk.default.yellowBright : direction === "in" ? chalk.default.greenBright : chalk.default.cyanBright)(compactArrow)} ${chalk.default.bold(kind)}`;
	const statusToken = buildWsStatusToken(kind, ok);
	const startedAt = kind === "res" && direction === "out" && inflightKey ? wsInflightCompact.get(inflightKey)?.ts : void 0;
	if (kind === "res" && direction === "out" && inflightKey) wsInflightCompact.delete(inflightKey);
	const durationToken = typeof startedAt === "number" ? chalk.default.dim(`${now - startedAt}ms`) : void 0;
	const headline = buildWsHeadline({
		kind,
		method,
		event: typeof meta?.event === "string" ? meta.event : void 0
	});
	const restMeta = collectWsRestMeta(meta);
	const trailing = [];
	if (connId && connId !== wsLastCompactConnId) {
		trailing.push(`${chalk.default.dim("conn")}=${chalk.default.gray(shortId(connId))}`);
		wsLastCompactConnId = connId;
	}
	if (id) trailing.push(`${chalk.default.dim("id")}=${chalk.default.gray(shortId(id))}`);
	logWsInfoLine({
		prefix,
		statusToken,
		headline,
		durationToken,
		restMeta,
		trailing
	});
}
//#endregion
Object.defineProperty(exports, "formatForLog", {
	enumerable: true,
	get: function() {
		return formatForLog;
	}
});
Object.defineProperty(exports, "logWs", {
	enumerable: true,
	get: function() {
		return logWs;
	}
});
Object.defineProperty(exports, "shouldLogWs", {
	enumerable: true,
	get: function() {
		return shouldLogWs;
	}
});
Object.defineProperty(exports, "summarizeAgentEventForWsLog", {
	enumerable: true,
	get: function() {
		return summarizeAgentEventForWsLog;
	}
});
