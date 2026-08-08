const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
require("./embedded-agent-helpers-DJEcJifp.cjs");
const require_errors$1 = require("./errors-DsTBGN_q.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_record_coerce = require("./record-coerce-B82bFbwe.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_diagnostic_run_activity = require("./diagnostic-run-activity-DjuaoKPQ.cjs");
require("./mcp-config-normalize-BK5qrIxl.cjs");
const require_mcp_auth_profile = require("./mcp-auth-profile-B7BJ2g-9.cjs");
const require_operator_root = require("./operator-root-D_zS4PlX.cjs");
const require_failover_error = require("./failover-error-voHYvp7k.cjs");
const require_run_termination = require("./run-termination-CDRVMWOn.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
require("./attempt-tool-construction-plan-DVDzj8wc.cjs");
const require_balanced_json = require("./balanced-json-4zffEv32.cjs");
const require_helpers = require("./helpers-D33_rP9K.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_module = require("node:module");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/agents/cli-output.ts
/**
* Parses output from CLI-backed model providers. It supports plain text, JSON,
* JSONL streaming, Claude stream-json dialects, usage metadata, and tool event
* reconstruction.
*/
function normalizeCliContextValue(value) {
	const normalized = value?.trim().replace(/\s+/g, " ");
	return normalized ? normalized.slice(0, 200) : void 0;
}
function formatCliOutputError(output, attribution = {}) {
	if (output.terminalFailure?.reason !== "max_turns") return output.errorText || "CLI failed.";
	const runId = normalizeCliContextValue(attribution.runId);
	const sessionId = normalizeCliContextValue(attribution.sessionId);
	const cliSessionId = normalizeCliContextValue(output.sessionId);
	const context = [
		runId ? `Operator run: ${runId}.` : void 0,
		sessionId ? `Operator session: ${sessionId}.` : void 0,
		cliSessionId ? `Claude session: ${cliSessionId}.` : void 0
	].filter((entry) => Boolean(entry));
	const limit = output.terminalFailure.limit;
	return [
		`Claude CLI stopped after reaching the maximum number of turns${limit ? ` (limit: ${limit})` : ""}.`,
		...context,
		"Tool actions may already have run; verify their effects before retrying.",
		"Retry with a higher --max-turns value or a narrower task."
	].join(" ");
}
const CLI_STREAM_JSON_DEFAULT_MAX_TURN_RAW_CHARS = 8 * 1024 * 1024;
const CLI_STREAM_JSON_MIN_TURN_RAW_CHARS = 1024;
const CLI_STREAM_JSON_MAX_CONFIGURABLE_TURN_RAW_CHARS = 64 * 1024 * 1024;
const CLI_STREAM_JSON_DEFAULT_MAX_TURN_LINES = 2e4;
const CLI_STREAM_JSON_MIN_TURN_LINES = 100;
const CLI_STREAM_JSON_MAX_CONFIGURABLE_TURN_LINES = 1e5;
const CLI_STREAM_JSON_MISSING_RESULT_ERROR = "CLI stream-json output ended without a result event.";
function isClaudeCliProvider(providerId) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerId) === "claude-cli";
}
function isGeminiCliProvider(providerId) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerId) === "google-gemini-cli";
}
function isGeminiStreamJsonDialect(params) {
	return params.backend.jsonlDialect === "gemini-stream-json" || isGeminiCliProvider(params.providerId);
}
function isClaudeStreamJsonDialect(params) {
	if (params.backend.jsonlDialect) return params.backend.jsonlDialect === "claude-stream-json";
	return isClaudeCliProvider(params.providerId);
}
function isStreamJsonDialect(params) {
	return supportsCliJsonlToolEvents(params);
}
/** Returns whether JSONL output carries correlated provider tool events. */
function supportsCliJsonlToolEvents(params) {
	return params.backend.jsonlDialect === "claude-stream-json" || isClaudeCliProvider(params.providerId) || isGeminiStreamJsonDialect(params);
}
function isClaudeStreamJsonResult(params) {
	return supportsCliJsonlToolEvents(params) && params.parsed.type === "result";
}
function extractJsonObjectCandidates(raw) {
	return require_balanced_json.extractBalancedJsonFragments(raw, { openers: ["{"] }).map((fragment) => fragment.json);
}
function parseJsonRecordCandidates(raw) {
	const parsedRecords = [];
	const trimmed = raw.trim();
	if (!trimmed) return parsedRecords;
	try {
		const parsed = JSON.parse(trimmed);
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) {
			parsedRecords.push(parsed);
			return parsedRecords;
		}
	} catch {}
	for (const candidate of extractJsonObjectCandidates(trimmed)) try {
		const parsed = JSON.parse(candidate);
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) parsedRecords.push(parsed);
	} catch {}
	return parsedRecords;
}
function readNestedErrorMessage(parsed) {
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.error)) {
		const errorMessage = readNestedErrorMessage(parsed.error);
		if (errorMessage) return errorMessage;
	}
	if (typeof parsed.message === "string") {
		const trimmed = parsed.message.trim();
		if (trimmed) return trimmed;
	}
	if (typeof parsed.error === "string") {
		const trimmed = parsed.error.trim();
		if (trimmed) return trimmed;
	}
}
function unwrapCliErrorText(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return "";
	for (const parsed of parseJsonRecordCandidates(trimmed)) {
		const nested = readNestedErrorMessage(parsed);
		if (nested) return nested;
	}
	return trimmed;
}
function toCliUsage(raw) {
	const readNestedCached = (key) => {
		const nested = raw[key];
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(nested)) return;
		return typeof nested.cached_tokens === "number" && nested.cached_tokens > 0 ? nested.cached_tokens : void 0;
	};
	const pick = (key) => typeof raw[key] === "number" && raw[key] > 0 ? raw[key] : void 0;
	const totalInput = pick("input_tokens") ?? pick("inputTokens");
	const output = pick("output_tokens") ?? pick("outputTokens");
	const nestedCached = readNestedCached("input_tokens_details") ?? readNestedCached("prompt_tokens_details");
	const cacheRead = pick("cache_read_input_tokens") ?? pick("cached_input_tokens") ?? pick("cacheRead") ?? pick("cached") ?? nestedCached;
	const input = pick("input") ?? ((Object.hasOwn(raw, "cached") || nestedCached !== void 0) && typeof totalInput === "number" ? Math.max(0, totalInput - (cacheRead ?? 0)) : totalInput);
	const cacheWrite = pick("cache_creation_input_tokens") ?? pick("cache_write_input_tokens") ?? pick("cacheWrite");
	const total = pick("total_tokens") ?? pick("total");
	if (!input && !output && !cacheRead && !cacheWrite && !total) return;
	return {
		input,
		output,
		cacheRead,
		cacheWrite,
		total
	};
}
function readCliUsage(parsed) {
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.message) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.message.usage)) {
		const usage = toCliUsage(parsed.message.usage);
		if (usage) return usage;
	}
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.usage)) {
		const usage = toCliUsage(parsed.usage);
		if (usage) return usage;
	}
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.stats)) return toCliUsage(parsed.stats);
}
function collectCliText(value) {
	if (!value) return "";
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value.map((entry) => collectCliText(entry)).join("");
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return "";
	if (typeof value.response === "string") return value.response;
	if (typeof value.text === "string") return value.text;
	if (typeof value.result === "string") return value.result;
	if (typeof value.content === "string") return value.content;
	if (Array.isArray(value.content)) return value.content.map((entry) => collectCliText(entry)).join("");
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.message)) return collectCliText(value.message);
	return "";
}
function unwrapNestedCliResultText(raw) {
	let text = raw;
	for (let depth = 0; depth < 8; depth += 1) {
		const trimmed = text.trim();
		if (!trimmed.startsWith("{")) return text;
		try {
			const parsed = JSON.parse(trimmed);
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || typeof parsed.type !== "string" || parsed.type !== "result" || typeof parsed.result !== "string") return text;
			text = parsed.result;
		} catch {
			return text;
		}
	}
	return text;
}
function collectExplicitCliErrorText(parsed) {
	const subtype = typeof parsed.subtype === "string" ? parsed.subtype.trim() : "";
	if (parsed.is_error === true || parsed.type === "result" && (subtype.startsWith("error_") || parsed.status === "error")) {
		const text = collectCliText(parsed.result) || collectCliText(parsed.message) || collectCliText(parsed.content);
		if (text) return unwrapCliErrorText(text);
		const nested = readNestedErrorMessage(parsed);
		if (nested) return unwrapCliErrorText(nested);
		if (subtype) return `Claude CLI result subtype ${subtype}.`;
		return "CLI result was marked as an error.";
	}
	const nested = readNestedErrorMessage(parsed);
	if (nested) return unwrapCliErrorText(nested);
	if (parsed.type === "assistant") {
		const text = collectCliText(parsed.message);
		if (/^\s*API Error:/i.test(text)) return unwrapCliErrorText(text);
	}
	if (parsed.type === "error") return unwrapCliErrorText(collectCliText(parsed.message) || collectCliText(parsed.content) || collectCliText(parsed.result) || collectCliText(parsed));
	return "";
}
function readClaudeMaxTurnsFailure(parsed) {
	const subtype = typeof parsed.subtype === "string" ? parsed.subtype.trim() : "";
	const terminalReason = typeof parsed.terminal_reason === "string" ? parsed.terminal_reason.trim() : "";
	if (subtype !== "error_max_turns" && terminalReason !== "max_turns") return;
	const errors = Array.isArray(parsed.errors) ? parsed.errors : [];
	for (const error of errors) {
		if (typeof error !== "string") continue;
		const match = error.match(/maximum number of turns\s*\((\d+)\)/i);
		if (match) {
			const limit = Number.parseInt(match[1] ?? "", 10);
			if (Number.isSafeInteger(limit) && limit > 0) return {
				reason: "max_turns",
				limit
			};
		}
	}
	return { reason: "max_turns" };
}
function readClaudeMaxTurnsErrorText(parsed) {
	if (!Array.isArray(parsed.errors)) return;
	for (const error of parsed.errors) if (typeof error === "string" && error.trim()) return error.trim();
}
function resolveCliTerminalErrorText(parsed, terminalFailure) {
	const explicitErrorText = collectExplicitCliErrorText(parsed);
	return ((terminalFailure ? readClaudeMaxTurnsErrorText(parsed) : void 0) ?? explicitErrorText) || (terminalFailure ? "Reached maximum number of turns." : "");
}
function pickCliSessionId(parsed, backend) {
	const fields = backend.sessionIdFields ?? [
		"session_id",
		"sessionId",
		"conversation_id",
		"conversationId"
	];
	for (const field of fields) {
		const value = parsed[field];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
}
function shouldUnwrapNestedCliResultText(params) {
	if (!params.providerId || !isClaudeCliProvider(params.providerId)) return false;
	return !Object.hasOwn(params.parsed, "type") || params.parsed.type === "result";
}
function normalizePositiveInt(value, fallback, min, max) {
	if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
	return Math.min(Math.max(value, min), max);
}
function resolveCliStreamJsonOutputLimits(backend) {
	const configured = backend.reliability?.outputLimits;
	const maxTurnRawChars = normalizePositiveInt(configured?.maxTurnRawChars, CLI_STREAM_JSON_DEFAULT_MAX_TURN_RAW_CHARS, CLI_STREAM_JSON_MIN_TURN_RAW_CHARS, CLI_STREAM_JSON_MAX_CONFIGURABLE_TURN_RAW_CHARS);
	return {
		maxTurnRawChars,
		maxPendingLineChars: maxTurnRawChars,
		maxTurnLines: normalizePositiveInt(configured?.maxTurnLines, CLI_STREAM_JSON_DEFAULT_MAX_TURN_LINES, CLI_STREAM_JSON_MIN_TURN_LINES, CLI_STREAM_JSON_MAX_CONFIGURABLE_TURN_LINES)
	};
}
function streamJsonOutputLimitErrorText(kind, limit) {
	if (kind === "line") return `CLI JSONL line exceeded ${limit} characters; refusing to parse output.`;
	if (kind === "lines") return `CLI JSONL output exceeded ${limit} lines; refusing to parse output.`;
	return `CLI JSONL output exceeded ${limit} characters; refusing to parse output.`;
}
function hasExplicitCliErrorPayload(parsed) {
	if (typeof parsed.error === "string") return Boolean(parsed.error.trim());
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.error)) return Boolean(readNestedErrorMessage(parsed.error));
	return false;
}
/** Parses JSON CLI output, including mixed stdout that contains embedded JSON objects. */
/** Parses a single JSON payload emitted by a CLI backend. */
function parseCliJson(raw, backend, providerId) {
	const parsedRecords = parseJsonRecordCandidates(raw);
	if (parsedRecords.length === 0) return null;
	let sessionId;
	let usage;
	let text = "";
	let sawStructuredOutput = false;
	for (const parsed of parsedRecords) {
		sessionId = pickCliSessionId(parsed, backend) ?? sessionId;
		usage = readCliUsage(parsed) ?? usage;
		const terminalFailure = isClaudeStreamJsonDialect({
			backend,
			providerId: providerId ?? ""
		}) ? readClaudeMaxTurnsFailure(parsed) : void 0;
		if (terminalFailure) return {
			text: "",
			sessionId,
			usage,
			errorText: resolveCliTerminalErrorText(parsed, terminalFailure),
			terminalFailure
		};
		const subtype = typeof parsed.subtype === "string" ? parsed.subtype.trim() : "";
		const errorText = parsed.is_error === true || parsed.type === "error" || parsed.type === "result" && (subtype.startsWith("error_") || parsed.status === "error" || hasExplicitCliErrorPayload(parsed)) ? collectExplicitCliErrorText(parsed) : "";
		if (errorText) return {
			text: "",
			sessionId,
			usage,
			errorText
		};
		const nextText = collectCliText(parsed.message) || collectCliText(parsed.content) || collectCliText(parsed.result) || collectCliText(parsed.response) || collectCliText(parsed);
		const trimmedText = (shouldUnwrapNestedCliResultText({
			providerId,
			parsed
		}) ? unwrapNestedCliResultText(nextText) : nextText).trim();
		if (trimmedText) {
			text = trimmedText;
			sawStructuredOutput = true;
			continue;
		}
		if (sessionId || usage) sawStructuredOutput = true;
	}
	if (!text && !sawStructuredOutput) return null;
	return {
		text,
		sessionId,
		usage
	};
}
function parseClaudeCliJsonlResult(params) {
	if (!supportsCliJsonlToolEvents(params)) return null;
	if (typeof params.parsed.type === "string" && params.parsed.type === "result") {
		const terminalFailure = isClaudeStreamJsonDialect(params) ? readClaudeMaxTurnsFailure(params.parsed) : void 0;
		const errorText = resolveCliTerminalErrorText(params.parsed, terminalFailure);
		if (errorText) return {
			text: "",
			sessionId: params.sessionId,
			usage: params.usage,
			errorText,
			...terminalFailure ? { terminalFailure } : {}
		};
		if (typeof params.parsed.result !== "string") return null;
		const resultText = unwrapNestedCliResultText(params.parsed.result).trim();
		if (resultText) return {
			text: resultText,
			sessionId: params.sessionId,
			usage: params.usage
		};
		return {
			text: "",
			sessionId: params.sessionId,
			usage: params.usage
		};
	}
	return null;
}
function parseClaudeCliStreamingDelta(params) {
	if (!supportsCliJsonlToolEvents(params)) return null;
	if (params.parsed.type !== "stream_event" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.parsed.event)) return null;
	const event = params.parsed.event;
	if (event.type !== "content_block_delta" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(event.delta)) return null;
	const delta = event.delta;
	if (delta.type !== "text_delta" || typeof delta.text !== "string") return null;
	if (!delta.text) return null;
	return {
		text: `${params.textSoFar}${delta.text}`,
		delta: delta.text,
		sessionId: params.sessionId,
		usage: params.usage
	};
}
function createToolUseTracker() {
	return {
		pendingByIndex: /* @__PURE__ */ new Map(),
		nameById: /* @__PURE__ */ new Map(),
		startedIds: /* @__PURE__ */ new Set(),
		resultDeliveredIds: /* @__PURE__ */ new Set()
	};
}
function emitToolStartOnce(tracker, toolCallId, name, kind, args, onToolUseStart) {
	if (tracker.startedIds.has(toolCallId)) return;
	tracker.startedIds.add(toolCallId);
	tracker.nameById.set(toolCallId, name);
	onToolUseStart?.({
		toolCallId,
		name,
		kind,
		args
	});
}
function emitToolResultOnce(tracker, toolCallId, isError, result, onToolResult) {
	if (tracker.resultDeliveredIds.has(toolCallId)) return;
	tracker.resultDeliveredIds.add(toolCallId);
	onToolResult?.({
		toolCallId,
		name: tracker.nameById.get(toolCallId) ?? "",
		isError,
		result
	});
}
function isClaudeToolUseBlockType(type) {
	return type === "tool_use" || type === "server_tool_use" || type === "mcp_tool_use";
}
function isClaudeAssistantToolResultBlockType(type) {
	return typeof type === "string" && type.endsWith("_tool_result") && type !== "tool_result";
}
function isClaudeToolResultError(content) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(content) && typeof content.type === "string" && content.type.endsWith("_error");
}
function parseToolInputJson(parts) {
	if (parts.length === 0) return {};
	try {
		const parsed = JSON.parse(parts.join(""));
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
function dispatchClaudeCliStreamingToolEvent(params) {
	if (!supportsCliJsonlToolEvents(params)) return;
	const tracker = params.tracker;
	if (params.parsed.type === "stream_event" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.parsed.event)) {
		const event = params.parsed.event;
		if (event.type === "content_block_start" && typeof event.index === "number" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(event.content_block)) {
			const block = event.content_block;
			if (isClaudeToolUseBlockType(block.type)) {
				const toolCallId = typeof block.id === "string" ? block.id.trim() : "";
				const name = typeof block.name === "string" ? block.name.trim() : "";
				if (toolCallId && name) tracker.pendingByIndex.set(event.index, {
					toolCallId,
					name,
					kind: block.type,
					inputJsonParts: []
				});
			} else if (isClaudeAssistantToolResultBlockType(block.type)) {
				const toolCallId = typeof block.tool_use_id === "string" ? block.tool_use_id.trim() : "";
				if (toolCallId) emitToolResultOnce(tracker, toolCallId, block.is_error === true || isClaudeToolResultError(block.content), block.content, params.onToolResult);
			}
			return;
		}
		if (event.type === "content_block_delta" && typeof event.index === "number" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(event.delta)) {
			if (event.delta.type === "input_json_delta" && typeof event.delta.partial_json === "string") tracker.pendingByIndex.get(event.index)?.inputJsonParts.push(event.delta.partial_json);
			return;
		}
		if (event.type === "content_block_stop" && typeof event.index === "number") {
			const pending = tracker.pendingByIndex.get(event.index);
			tracker.pendingByIndex.delete(event.index);
			if (pending) emitToolStartOnce(tracker, pending.toolCallId, pending.name, pending.kind, parseToolInputJson(pending.inputJsonParts), params.onToolUseStart);
			return;
		}
		return;
	}
	if (params.parsed.type === "assistant" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.parsed.message)) {
		const message = params.parsed.message;
		const content = Array.isArray(message.content) ? message.content : [];
		for (const block of content) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(block)) continue;
			if (isClaudeToolUseBlockType(block.type)) {
				const toolCallId = typeof block.id === "string" ? block.id.trim() : "";
				const name = typeof block.name === "string" ? block.name.trim() : "";
				if (!toolCallId || !name) continue;
				const args = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(block.input) ? block.input : {};
				emitToolStartOnce(tracker, toolCallId, name, block.type, args, params.onToolUseStart);
			} else if (isClaudeAssistantToolResultBlockType(block.type)) {
				const toolCallId = typeof block.tool_use_id === "string" ? block.tool_use_id.trim() : "";
				if (!toolCallId) continue;
				emitToolResultOnce(tracker, toolCallId, block.is_error === true || isClaudeToolResultError(block.content), block.content, params.onToolResult);
			}
		}
		return;
	}
	if (params.parsed.type === "user" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.parsed.message)) {
		const message = params.parsed.message;
		const content = Array.isArray(message.content) ? message.content : [];
		for (const block of content) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(block) || block.type !== "tool_result") continue;
			const toolCallId = typeof block.tool_use_id === "string" ? block.tool_use_id.trim() : "";
			if (!toolCallId) continue;
			emitToolResultOnce(tracker, toolCallId, block.is_error === true, block.content, params.onToolResult);
		}
	}
}
function createThinkingTracker() {
	return {
		streamedByIndex: /* @__PURE__ */ new Map(),
		emittedText: "",
		nextSyntheticBlockIndex: 0,
		progressTokens: 0
	};
}
function resetThinkingBlockState(tracker) {
	tracker.streamedByIndex.clear();
	tracker.emittedText = "";
	tracker.currentSyntheticBlockIndex = void 0;
	tracker.nextSyntheticBlockIndex = 0;
	tracker.progressTokens = 0;
}
function resetThinkingTrackerForMessage(tracker, messageId) {
	if (messageId && messageId === tracker.currentMessageId) return;
	if (messageId && tracker.currentMessageId === void 0) {
		tracker.currentMessageId = messageId;
		return;
	}
	resetThinkingBlockState(tracker);
	tracker.currentMessageId = messageId;
}
function beginClaudeContentBlock(tracker, index) {
	if (typeof index === "number") {
		tracker.currentSyntheticBlockIndex = index;
		tracker.nextSyntheticBlockIndex = Math.max(tracker.nextSyntheticBlockIndex, index + 1);
		return;
	}
	if (index !== void 0) {
		tracker.currentSyntheticBlockIndex = void 0;
		return;
	}
	tracker.currentSyntheticBlockIndex = tracker.nextSyntheticBlockIndex;
	tracker.nextSyntheticBlockIndex += 1;
}
function stopClaudeContentBlock(tracker) {
	tracker.currentSyntheticBlockIndex = void 0;
}
function resolveClaudeContentBlockIndex(tracker, index) {
	if (typeof index === "number") {
		tracker.nextSyntheticBlockIndex = Math.max(tracker.nextSyntheticBlockIndex, index + 1);
		return index;
	}
	if (index !== void 0) return null;
	return tracker.currentSyntheticBlockIndex ?? null;
}
function assembleThinkingTextByIndex(streamedByIndex) {
	return [...streamedByIndex.entries()].toSorted(([left], [right]) => left - right).map(([, text]) => text).join("");
}
function emitClaudeThinking(tracker, index, streamed, delta, onThinkingDelta) {
	tracker.streamedByIndex.set(index, `${streamed}${delta}`);
	tracker.emittedText = assembleThinkingTextByIndex(tracker.streamedByIndex);
	onThinkingDelta({
		text: tracker.emittedText,
		delta,
		isReasoningSnapshot: true
	});
}
function readThinkingProgressTokens(delta) {
	if (delta.type !== "thinking_delta" || delta.thinking !== "") return;
	const estimatedTokens = delta.estimated_tokens;
	if (typeof estimatedTokens !== "number" || !Number.isFinite(estimatedTokens)) return;
	return estimatedTokens > 0 ? estimatedTokens : void 0;
}
function emitClaudeThinkingProgress(tracker, progressTokensDelta, onThinkingProgress) {
	tracker.progressTokens += progressTokensDelta;
	onThinkingProgress({ progressTokens: tracker.progressTokens });
}
function dispatchClaudeCliThinking(params) {
	if (!supportsCliJsonlToolEvents(params)) return;
	const tracker = params.tracker;
	if (params.parsed.type === "stream_event" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.parsed.event)) {
		const event = params.parsed.event;
		if (event.type === "message_start") {
			const message = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(event.message) ? event.message : void 0;
			resetThinkingTrackerForMessage(tracker, typeof message?.id === "string" ? message.id : void 0);
			return;
		}
		if (event.type === "content_block_start") {
			beginClaudeContentBlock(tracker, event.index);
			return;
		}
		if (event.type === "content_block_stop") {
			stopClaudeContentBlock(tracker);
			return;
		}
		if (event.type !== "content_block_delta" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(event.delta)) return;
		const blockIndex = resolveClaudeContentBlockIndex(tracker, event.index);
		if (blockIndex === null) return;
		const progressTokensDelta = readThinkingProgressTokens(event.delta);
		if (progressTokensDelta !== void 0 && params.onThinkingProgress) {
			emitClaudeThinkingProgress(tracker, progressTokensDelta, params.onThinkingProgress);
			return;
		}
		if (event.delta.type !== "thinking_delta" || typeof event.delta.thinking !== "string") return;
		if (!event.delta.thinking) return;
		if (!params.onThinkingDelta) return;
		emitClaudeThinking(tracker, blockIndex, tracker.streamedByIndex.get(blockIndex) ?? "", event.delta.thinking, params.onThinkingDelta);
		return;
	}
	if (params.parsed.type === "assistant" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.parsed.message)) {
		resetThinkingTrackerForMessage(tracker, typeof params.parsed.message.id === "string" ? params.parsed.message.id : void 0);
		const content = Array.isArray(params.parsed.message.content) ? params.parsed.message.content : [];
		for (const [index, block] of content.entries()) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(block) || block.type !== "thinking" || typeof block.thinking !== "string") continue;
			if (!params.onThinkingDelta) continue;
			tracker.streamedByIndex.set(index, block.thinking);
			const text = assembleThinkingTextByIndex(tracker.streamedByIndex);
			if (text === tracker.emittedText) continue;
			tracker.emittedText = text;
			params.onThinkingDelta({
				text,
				delta: block.thinking,
				isReasoningSnapshot: true
			});
		}
	}
}
function dispatchGeminiCliStreamingToolEvent(params) {
	if (!isGeminiStreamJsonDialect(params)) return;
	if (params.parsed.type === "tool_use") {
		const toolCallId = typeof params.parsed.tool_id === "string" ? params.parsed.tool_id.trim() : "";
		const name = typeof params.parsed.tool_name === "string" ? params.parsed.tool_name.trim() : "";
		if (!toolCallId || !name) return;
		const args = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.parsed.parameters) ? params.parsed.parameters : {};
		emitToolStartOnce(params.tracker, toolCallId, name, "tool_use", args, params.onToolUseStart);
		return;
	}
	if (params.parsed.type === "tool_result") {
		const toolCallId = typeof params.parsed.tool_id === "string" ? params.parsed.tool_id.trim() : "";
		if (!toolCallId) return;
		const result = params.parsed.status === "error" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.parsed.error) ? params.parsed.error : params.parsed.output;
		emitToolResultOnce(params.tracker, toolCallId, params.parsed.status === "error", result, params.onToolResult);
	}
}
const GEMINI_CLI_ERROR_EVENT_FALLBACK = "Gemini CLI emitted an error event.";
const GEMINI_CLI_RESULT_ERROR_FALLBACK = "Gemini CLI result status was error.";
function isFallbackGeminiCliStreamJsonError(errorText) {
	return errorText === GEMINI_CLI_ERROR_EVENT_FALLBACK || errorText === GEMINI_CLI_RESULT_ERROR_FALLBACK;
}
function preferGeminiCliStreamJsonError(current, next) {
	if (!current) return next;
	if (isFallbackGeminiCliStreamJsonError(current) && !isFallbackGeminiCliStreamJsonError(next)) return next;
	return current;
}
function readGeminiCliStreamJsonError(parsed) {
	if (parsed.type === "error" && parsed.severity === "error") return collectExplicitCliErrorText(parsed) || GEMINI_CLI_ERROR_EVENT_FALLBACK;
	if (parsed.type === "result" && parsed.status === "error") return collectExplicitCliErrorText(parsed) || GEMINI_CLI_RESULT_ERROR_FALLBACK;
}
/** Creates a stateful parser for streaming JSONL CLI backend output. */
function createCliJsonlStreamingParser(params) {
	let lineBuffer = "";
	let assistantText = "";
	let pendingClaudeText = "";
	let sessionId;
	let usage;
	let output = null;
	let parseErrorText = "";
	let rawChars = 0;
	let rawLines = 0;
	const texts = [];
	const toolTracker = createToolUseTracker();
	const outputLimits = resolveCliStreamJsonOutputLimits(params.backend);
	const classifyClaudeCommentary = Boolean(params.onCommentaryText) && supportsCliJsonlToolEvents(params);
	const thinkingTracker = createThinkingTracker();
	const flushPendingClaudeAssistantText = () => {
		if (!pendingClaudeText) return;
		const delta = pendingClaudeText;
		pendingClaudeText = "";
		assistantText = `${assistantText}${delta}`;
		params.onAssistantDelta({
			text: assistantText,
			delta,
			sessionId,
			usage
		});
	};
	const flushPendingClaudeCommentaryText = () => {
		if (!pendingClaudeText) return;
		const text = pendingClaudeText.trim();
		pendingClaudeText = "";
		if (text) params.onCommentaryText?.(text);
	};
	const handleParsedRecord = (parsed) => {
		if (parseErrorText) return;
		const parsedSessionId = pickCliSessionId(parsed, params.backend) ?? (!sessionId && typeof parsed.thread_id === "string" ? parsed.thread_id.trim() : void 0);
		if (parsedSessionId && parsedSessionId !== sessionId) {
			sessionId = parsedSessionId;
			params.onSessionId?.(parsedSessionId);
		}
		const nextUsage = readCliUsage(parsed);
		if (!isClaudeStreamJsonResult({
			backend: params.backend,
			providerId: params.providerId,
			parsed
		}) || !usage) usage = nextUsage ?? usage;
		const geminiErrorText = isGeminiStreamJsonDialect(params) ? readGeminiCliStreamJsonError(parsed) : void 0;
		if (geminiErrorText) {
			output = {
				text: "",
				sessionId,
				usage,
				errorText: preferGeminiCliStreamJsonError(output?.errorText, geminiErrorText)
			};
			return;
		}
		if (classifyClaudeCommentary && parsed.type === "result") flushPendingClaudeAssistantText();
		const result = parseClaudeCliJsonlResult({
			backend: params.backend,
			providerId: params.providerId,
			parsed,
			sessionId,
			usage
		});
		if (result) {
			if (result.errorText) {
				output = result;
				return;
			}
			const nextText = (result.text || assistantText.trim() || texts.join("\n").trim()).trim();
			const previousText = output?.text?.trim() ?? "";
			let text = nextText;
			if (previousText && nextText && previousText !== nextText && !nextText.startsWith(previousText)) text = `${previousText}\n${nextText}`;
			else if (!nextText) text = previousText;
			output = {
				...result,
				text
			};
			return;
		}
		const item = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.item) ? parsed.item : null;
		if (item?.type === "todo_list" && Array.isArray(item.items)) {
			const steps = item.items.flatMap((entry) => {
				if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || typeof entry.text !== "string") return [];
				return [{
					step: entry.text,
					status: entry.completed === true ? "completed" : "pending"
				}];
			});
			if (steps.length > 0) params.onPlanUpdate?.({ steps });
		}
		if (item && typeof item.text === "string") {
			const type = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(item.type);
			if (!type || type.includes("message")) texts.push(item.text);
		}
		if (classifyClaudeCommentary && parsed.type === "stream_event" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.event)) {
			const evt = parsed.event;
			if (evt.type === "content_block_start" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(evt.content_block) && isClaudeToolUseBlockType(evt.content_block.type)) flushPendingClaudeCommentaryText();
			else if (evt.type === "content_block_start" || evt.type === "message_stop") flushPendingClaudeAssistantText();
		}
		if (params.onThinkingDelta || params.onThinkingProgress) dispatchClaudeCliThinking({
			backend: params.backend,
			providerId: params.providerId,
			parsed,
			tracker: thinkingTracker,
			onThinkingDelta: params.onThinkingDelta,
			onThinkingProgress: params.onThinkingProgress
		});
		if (params.onToolUseStart || params.onToolResult) {
			dispatchGeminiCliStreamingToolEvent({
				backend: params.backend,
				providerId: params.providerId,
				parsed,
				tracker: toolTracker,
				onToolUseStart: params.onToolUseStart,
				onToolResult: params.onToolResult
			});
			dispatchClaudeCliStreamingToolEvent({
				backend: params.backend,
				providerId: params.providerId,
				parsed,
				tracker: toolTracker,
				onToolUseStart: params.onToolUseStart,
				onToolResult: params.onToolResult
			});
		}
		const delta = parseClaudeCliStreamingDelta({
			backend: params.backend,
			providerId: params.providerId,
			parsed,
			textSoFar: assistantText,
			sessionId,
			usage
		});
		if (!delta) {
			if (isGeminiStreamJsonDialect(params) && parsed.type === "message" && parsed.role === "assistant" && typeof parsed.content === "string") {
				const deltaText = parsed.content;
				if (deltaText) {
					assistantText = `${assistantText}${deltaText}`;
					params.onAssistantDelta({
						text: assistantText,
						delta: deltaText,
						sessionId,
						usage
					});
				}
			} else if (isGeminiStreamJsonDialect(params) && parsed.type === "result" && parsed.status === "success") output = {
				text: assistantText.trim(),
				sessionId,
				usage
			};
			return;
		}
		if (classifyClaudeCommentary) {
			pendingClaudeText = `${pendingClaudeText}${delta.delta}`;
			return;
		}
		assistantText = delta.text;
		params.onAssistantDelta(delta);
	};
	const flushLines = (flushPartial) => {
		while (true) {
			if (parseErrorText) return;
			const newlineIndex = lineBuffer.indexOf("\n");
			if (newlineIndex < 0) break;
			const line = lineBuffer.slice(0, newlineIndex).trim();
			lineBuffer = lineBuffer.slice(newlineIndex + 1);
			if (!line) continue;
			rawLines += 1;
			if (rawLines > outputLimits.maxTurnLines) {
				parseErrorText = streamJsonOutputLimitErrorText("lines", outputLimits.maxTurnLines);
				lineBuffer = "";
				return;
			}
			for (const parsed of parseJsonRecordCandidates(line)) handleParsedRecord(parsed);
		}
		if (!flushPartial) return;
		const tail = lineBuffer.trim();
		lineBuffer = "";
		if (!tail) return;
		for (const parsed of parseJsonRecordCandidates(tail)) handleParsedRecord(parsed);
	};
	return {
		push(chunk) {
			if (!chunk || parseErrorText) return;
			rawChars += chunk.length;
			if (rawChars > outputLimits.maxTurnRawChars) {
				parseErrorText = streamJsonOutputLimitErrorText("raw", outputLimits.maxTurnRawChars);
				lineBuffer = "";
				return;
			}
			if (lineBuffer.length + chunk.length > outputLimits.maxPendingLineChars) {
				parseErrorText = streamJsonOutputLimitErrorText("line", outputLimits.maxPendingLineChars);
				lineBuffer = "";
				return;
			}
			lineBuffer += chunk;
			flushLines(false);
		},
		finish() {
			if (parseErrorText) return;
			flushLines(true);
			if (classifyClaudeCommentary) flushPendingClaudeAssistantText();
		},
		getErrorText() {
			return parseErrorText || null;
		},
		getOutput() {
			if (parseErrorText) return {
				text: "",
				sessionId,
				usage,
				errorText: parseErrorText
			};
			if (output) return output;
			if (isStreamJsonDialect(params) && assistantText.trim()) return {
				text: assistantText.trim(),
				sessionId,
				usage
			};
			const text = texts.join("\n").trim();
			return text ? {
				text,
				sessionId,
				usage
			} : null;
		}
	};
}
/** Parses complete JSONL CLI output into the final assistant result and metadata. */
/** Parses complete JSONL output from a CLI backend into normalized text and metadata. */
function parseCliJsonl(raw, backend, providerId) {
	const lines = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(raw.split(/\r?\n/g));
	if (lines.length === 0) return null;
	let sessionId;
	let usage;
	const texts = [];
	let streamJsonText = "";
	let geminiErrorText;
	let sawGeminiStructuredOutput = false;
	const streamJsonDialect = isStreamJsonDialect({
		backend,
		providerId
	});
	for (const line of lines) for (const parsed of parseJsonRecordCandidates(line)) {
		sessionId = pickCliSessionId(parsed, backend) ?? sessionId;
		if (!sessionId && typeof parsed.thread_id === "string") sessionId = parsed.thread_id.trim();
		const nextUsage = readCliUsage(parsed);
		if (!isClaudeStreamJsonResult({
			backend,
			providerId,
			parsed
		}) || !usage) usage = nextUsage ?? usage;
		if (isGeminiStreamJsonDialect({
			backend,
			providerId
		})) {
			const nextGeminiErrorText = readGeminiCliStreamJsonError(parsed);
			if (nextGeminiErrorText) {
				geminiErrorText = preferGeminiCliStreamJsonError(geminiErrorText, nextGeminiErrorText);
				sawGeminiStructuredOutput = true;
				continue;
			}
			if (parsed.type === "message" && parsed.role === "assistant" && typeof parsed.content === "string") {
				streamJsonText = `${streamJsonText}${parsed.content}`;
				sawGeminiStructuredOutput = true;
				continue;
			}
			if (parsed.type === "tool_use" || parsed.type === "tool_result" || parsed.type === "result") sawGeminiStructuredOutput = true;
		}
		const claudeResult = parseClaudeCliJsonlResult({
			backend,
			providerId,
			parsed,
			sessionId,
			usage
		});
		if (claudeResult) {
			if (claudeResult.text || claudeResult.errorText) return claudeResult;
			return {
				...claudeResult,
				text: streamJsonText.trim() || texts.join("\n").trim()
			};
		}
		const claudeDelta = parseClaudeCliStreamingDelta({
			backend,
			providerId,
			parsed,
			textSoFar: streamJsonText,
			sessionId,
			usage
		});
		if (claudeDelta) {
			streamJsonText = claudeDelta.text;
			continue;
		}
		const item = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.item) ? parsed.item : null;
		if (item && typeof item.text === "string") {
			const type = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(item.type);
			if (!type || type.includes("message")) texts.push(item.text);
		}
	}
	if (isGeminiStreamJsonDialect({
		backend,
		providerId
	}) && geminiErrorText) return {
		text: "",
		sessionId,
		usage,
		errorText: geminiErrorText
	};
	if (streamJsonDialect && (streamJsonText.trim() || sawGeminiStructuredOutput)) return {
		text: streamJsonText.trim(),
		sessionId,
		usage
	};
	if (streamJsonDialect) return {
		text: "",
		sessionId,
		usage,
		errorText: CLI_STREAM_JSON_MISSING_RESULT_ERROR
	};
	const text = texts.join("\n").trim();
	if (!text) return null;
	return {
		text,
		sessionId,
		usage
	};
}
/** Parses CLI output according to the backend output mode with text fallback. */
/** Parses CLI backend output using the configured JSON/JSONL/plain-text mode. */
function parseCliOutput(params) {
	const outputMode = params.outputMode ?? "text";
	if (outputMode === "text") return {
		text: params.raw.trim(),
		sessionId: params.fallbackSessionId
	};
	if (outputMode === "jsonl") {
		const parsed = parseCliJsonl(params.raw, params.backend, params.providerId);
		if (parsed) return parsed;
		if (isStreamJsonDialect(params)) return {
			text: "",
			sessionId: params.fallbackSessionId,
			errorText: CLI_STREAM_JSON_MISSING_RESULT_ERROR
		};
		return {
			text: params.raw.trim(),
			sessionId: params.fallbackSessionId
		};
	}
	return parseCliJson(params.raw, params.backend, params.providerId) ?? {
		text: params.raw.trim(),
		sessionId: params.fallbackSessionId
	};
}
/** Extracts the most specific structured CLI error message from mixed or JSON output. */
/** Extracts a human-readable error message from mixed CLI stderr/stdout text. */
function extractCliErrorMessage(raw) {
	const parsedRecords = parseJsonRecordCandidates(raw);
	if (parsedRecords.length === 0) return null;
	let errorText = "";
	for (const parsed of parsedRecords) {
		const next = collectExplicitCliErrorText(parsed);
		if (next) errorText = next;
	}
	return errorText || null;
}
//#endregion
//#region src/mcp/operator-tools-serve-config.ts
/**
* Shared contract between the operator-tools MCP stdio entry and the callers
* that inject it into CLI harness runs. Keep this module free of MCP SDK and
* tool-runtime imports so CLI-runner prepare paths can build server configs
* without loading the server.
*/
const OPERATOR_TOOLS_MCP_TOOLS_ENV = "OPERATOR_TOOLS_MCP_TOOLS";
const OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV = "OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE";
const OPERATOR_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV = "OPERATOR_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED";
const OPERATOR_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV = "OPERATOR_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL";
function resolveTsxImportSpecifier() {
	try {
		return (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href).resolve("tsx");
	} catch {
		return "tsx";
	}
}
function resolveOperatorToolsServeCommand() {
	const packageRoot = require_operator_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	});
	if (!packageRoot) throw new Error("operator-tools MCP: could not resolve the Operator package root");
	const distEntry = node_path.default.join(packageRoot, "dist", "mcp", "operator-tools-serve.js");
	if (node_fs.default.existsSync(distEntry)) return {
		command: process.execPath,
		args: [distEntry]
	};
	const sourceEntry = node_path.default.join(packageRoot, "src", "mcp", "operator-tools-serve.ts");
	if (!node_fs.default.existsSync(sourceEntry)) throw new Error(`operator-tools MCP: no serve entry under ${packageRoot}`);
	if (process.versions.bun) return {
		command: process.execPath,
		args: [sourceEntry]
	};
	return {
		command: process.execPath,
		args: [
			"--import",
			resolveTsxImportSpecifier(),
			sourceEntry
		]
	};
}
/**
* Operator CLI-harness runs get exactly one MCP server: this stdio entry
* serving the ring-zero operator tool. The server keeps the "@gabrielvfonseca/operator" name
* so backend tool pre-approvals (e.g. Claude's --allowedTools mcp__operator__*)
* apply without per-backend argument surgery.
*/
function buildSystemAgentToolsMcpServerConfig(options) {
	const entry = resolveOperatorToolsServeCommand();
	const pendingProposal = options.proposalRef?.current;
	return { mcpServers: { operator: {
		command: entry.command,
		args: entry.args,
		env: {
			[OPERATOR_TOOLS_MCP_TOOLS_ENV]: "@gabrielvfonseca/operator",
			[OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: options.surface,
			...options.approvalArmed === true ? { [OPERATOR_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV]: "1" } : {},
			...pendingProposal ? { [OPERATOR_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV]: pendingProposal } : {}
		}
	} } };
}
//#endregion
//#region src/agents/cli-runner/bundle-mcp-adapter-shared.ts
/**
* Shared normalization helpers for CLI-specific bundle MCP adapters.
*/
function normalizeStringArray(value) {
	return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? [...value] : void 0;
}
/** Normalize a string-valued record, dropping non-string entries. */
function normalizeStringRecord(value) {
	if (!require_record_coerce.isRecord(value)) return;
	const entries = Object.entries(value).filter((entry) => {
		return typeof entry[1] === "string";
	});
	return entries.length > 0 ? Object.fromEntries(entries) : void 0;
}
/** Decode supported `${ENV}` and `Bearer ${ENV}` header placeholders. */
function decodeHeaderEnvPlaceholder(value) {
	const bearerEnvVar = /^Bearer \${([A-Z0-9_]+)}$/.exec(value)?.at(1);
	if (bearerEnvVar) return {
		envVar: bearerEnvVar,
		bearer: true
	};
	const envVar = /^\${([A-Z0-9_]+)}$/.exec(value)?.at(1);
	if (envVar) return {
		envVar,
		bearer: false
	};
	return null;
}
/** Copy common MCP server config fields into a CLI adapter config object. */
function applyCommonServerConfig(next, server) {
	if (typeof server.command === "string") next.command = server.command;
	const args = normalizeStringArray(server.args);
	if (args) next.args = args;
	const env = normalizeStringRecord(server.env);
	if (env) next.env = env;
	if (typeof server.cwd === "string") next.cwd = server.cwd;
	if (typeof server.url === "string") next.url = server.url;
}
//#endregion
//#region src/agents/cli-runner/bundle-mcp-claude.ts
/**
* Claude CLI argument helpers for Operator-managed bundle MCP config.
*/
/** Find existing Claude `--mcp-config` argument values. */
function findClaudeMcpConfigPaths(args) {
	const paths = [];
	if (!args?.length) return paths;
	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i] ?? "";
		if (arg === "--mcp-config") {
			while (typeof args[i + 1] === "string" && !args[i + 1]?.startsWith("-")) {
				i += 1;
				const path = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args[i]);
				if (path) paths.push(path);
			}
			continue;
		}
		if (arg.startsWith("--mcp-config=")) {
			const path = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(arg.slice(13));
			if (path) paths.push(path);
		}
	}
	return paths;
}
/** Find an existing Claude `--mcp-config` argument value. */
function findClaudeMcpConfigPath(args) {
	return findClaudeMcpConfigPaths(args)[0];
}
/** Return Claude args with Operator's strict MCP config path injected. */
function injectClaudeMcpConfigArgs(args, mcpConfigPath) {
	const next = [];
	for (let i = 0; i < (args?.length ?? 0); i += 1) {
		const arg = args?.[i] ?? "";
		if (arg === "--strict-mcp-config") continue;
		if (arg === "--mcp-config") {
			while (typeof args?.[i + 1] === "string" && !args[i + 1]?.startsWith("-")) i += 1;
			continue;
		}
		if (arg.startsWith("--mcp-config=")) continue;
		next.push(arg);
	}
	next.push("--strict-mcp-config", "--mcp-config", mcpConfigPath);
	return next;
}
/** Writes the active per-attempt capture token into Operator's generated Claude MCP config. */
async function writeClaudeMcpCaptureConfig(params) {
	const raw = JSON.parse(await node_fs_promises.default.readFile(params.mcpConfigPath, "utf-8"));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) throw new Error("Claude MCP capture requires an object config");
	const mcpServers = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.mcpServers) ? raw.mcpServers : {};
	const operator = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(mcpServers.operator) ? mcpServers.operator : void 0;
	if (!operator) throw new Error("Claude MCP capture requires an openclaw server config");
	const headers = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(operator.headers) ? operator.headers : {};
	await node_fs_promises.default.writeFile(params.mcpConfigPath, `${JSON.stringify({
		...raw,
		mcpServers: {
			...mcpServers,
			operator: {
				...operator,
				headers: {
					...headers,
					"x-operator-cli-capture-key": params.captureKey
				}
			}
		}
	}, null, 2)}\n`, "utf-8");
}
//#endregion
//#region src/agents/codex-mcp-config.ts
/**
* Projects enabled bundle MCP servers into Codex app-server thread config.
* The projection keeps loopback approval defaults and header env placeholders
* compatible with Codex's MCP config shape.
*/
function isOperatorLoopbackMcpServer(name, server) {
	return name === "@gabrielvfonseca/operator" && typeof server.url === "string" && /^https?:\/\/(?:127\.0\.0\.1|localhost):\d+\/mcp(?:[?#].*)?$/.test(server.url);
}
const CODEX_MCP_TOOL_APPROVAL_MODES = /* @__PURE__ */ new Set([
	"auto",
	"prompt",
	"approve"
]);
function readCodexProjectionConfig(server) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(server.codex) ? server.codex : {};
}
function normalizeCodexToolApprovalMode(value) {
	return typeof value === "string" && CODEX_MCP_TOOL_APPROVAL_MODES.has(value) ? value : void 0;
}
function resolveCodexDefaultToolsApprovalMode(server) {
	const codex = readCodexProjectionConfig(server);
	return normalizeCodexToolApprovalMode(codex.defaultToolsApprovalMode) ?? normalizeCodexToolApprovalMode(codex.default_tools_approval_mode);
}
function normalizeToolFilterList(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((entry) => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean);
}
function assertCodexExactToolFilters(serverName, fieldName, patterns) {
	const wildcard = patterns.find((pattern) => pattern.includes("*"));
	if (!wildcard) return;
	throw new Error(`Cannot project mcp.servers.${serverName}.toolFilter.${fieldName} pattern "${wildcard}" into Codex ${fieldName === "include" ? "enabled_tools" : "disabled_tools"}: Codex MCP projection only supports exact tool names.`);
}
function applyCodexToolFilter(next, name, server) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(server.toolFilter)) return;
	const include = normalizeToolFilterList(server.toolFilter.include);
	const exclude = normalizeToolFilterList(server.toolFilter.exclude);
	assertCodexExactToolFilters(name, "include", include);
	assertCodexExactToolFilters(name, "exclude", exclude);
	if (include.length > 0) next.enabled_tools = include;
	if (exclude.length > 0) next.disabled_tools = exclude;
}
/** Normalizes one bundle MCP server into Codex's mcp_servers shape. */
function normalizeCodexMcpServerConfig(name, server) {
	const next = {};
	applyCommonServerConfig(next, server);
	applyCodexToolFilter(next, name, server);
	const defaultToolsApprovalMode = resolveCodexDefaultToolsApprovalMode(server);
	if (defaultToolsApprovalMode) next.default_tools_approval_mode = defaultToolsApprovalMode;
	else if (isOperatorLoopbackMcpServer(name, server)) next.default_tools_approval_mode = "approve";
	const httpHeaders = normalizeStringRecord(server.headers);
	if (httpHeaders) {
		const staticHeaders = {};
		const envHeaders = {};
		for (const [nameLocal, value] of Object.entries(httpHeaders)) {
			const decoded = decodeHeaderEnvPlaceholder(value);
			if (!decoded) {
				staticHeaders[nameLocal] = value;
				continue;
			}
			if (decoded.bearer && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(nameLocal) === "authorization") {
				next.bearer_token_env_var = decoded.envVar;
				continue;
			}
			envHeaders[nameLocal] = decoded.envVar;
		}
		if (Object.keys(staticHeaders).length > 0) next.http_headers = staticHeaders;
		if (Object.keys(envHeaders).length > 0) next.env_http_headers = envHeaders;
	}
	return next;
}
/**
* Build Codex `mcp_servers` config from normalized bundle MCP config.
* Requester-scoped servers are excluded: harness-native MCP clients are
* session-shared and must never dial placeholder or requester-bound URLs.
*/
function buildCodexMcpServersConfig(config) {
	const { staticServers } = require_mcp_auth_profile.partitionMcpServersByConnectionScope(config.mcpServers);
	return Object.fromEntries(Object.entries(staticServers).map(([name, server]) => [name, normalizeCodexMcpServerConfig(name, server)]));
}
//#endregion
//#region src/agents/cli-runner/bundle-mcp-codex.ts
/** Returns Codex CLI args with TOML MCP server overrides injected. */
function injectCodexMcpConfigArgs(args, config) {
	const overrides = require_helpers.serializeTomlInlineValue(buildCodexMcpServersConfig(config));
	return [
		...args ?? [],
		"-c",
		`mcp_servers=${overrides}`
	];
}
//#endregion
//#region src/agents/cli-runner/bundle-mcp-gemini.ts
/**
* Gemini CLI bundle MCP adapter that writes temporary system settings files.
*/
async function readJsonObject(filePath) {
	const raw = await (0, _openclaw_fs_safe_json.tryReadJson)(filePath);
	return raw && typeof raw === "object" && !Array.isArray(raw) ? { ...raw } : {};
}
function resolveEnvPlaceholder(value, inheritedEnv) {
	const decoded = decodeHeaderEnvPlaceholder(value);
	if (!decoded) return value;
	const resolved = inheritedEnv?.[decoded.envVar] ?? process.env[decoded.envVar] ?? "";
	return decoded.bearer ? `Bearer ${resolved}` : resolved;
}
function normalizeGeminiServerConfig(server, inheritedEnv) {
	const next = {};
	applyCommonServerConfig(next, server);
	if (typeof server.type === "string") next.type = server.type;
	const headers = normalizeStringRecord(server.headers);
	if (headers) next.headers = Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, resolveEnvPlaceholder(value, inheritedEnv)]));
	if (typeof server.trust === "boolean") next.trust = server.trust;
	return next;
}
/** Writes merged Gemini system settings and returns env plus cleanup hook. */
async function writeGeminiSystemSettings(mergedConfig, inheritedEnv) {
	const tempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-gemini-mcp-"));
	const settingsPath = node_path.default.join(tempDir, "settings.json");
	const existingSettingsPath = inheritedEnv?.GEMINI_CLI_SYSTEM_SETTINGS_PATH ?? process.env.GEMINI_CLI_SYSTEM_SETTINGS_PATH;
	const base = typeof existingSettingsPath === "string" && existingSettingsPath.trim() ? await readJsonObject(existingSettingsPath) : {};
	const normalizedConfig = { mcpServers: Object.fromEntries(Object.entries(mergedConfig.mcpServers).map(([name, server]) => [name, normalizeGeminiServerConfig(server, inheritedEnv)])) };
	const settings = require_io.applyMergePatch(base, {
		mcp: { allowed: Object.keys(normalizedConfig.mcpServers) },
		mcpServers: normalizedConfig.mcpServers
	});
	if (!require_record_coerce.isRecord(settings.mcp) || !require_record_coerce.isRecord(settings.mcpServers)) throw new Error("Gemini MCP settings merge produced an invalid object");
	await (0, _openclaw_fs_safe_json.writeJson)(settingsPath, settings, { trailingNewline: true });
	return {
		env: {
			...inheritedEnv,
			GEMINI_CLI_SYSTEM_SETTINGS_PATH: settingsPath
		},
		cleanup: async () => {
			await node_fs_promises.default.rm(tempDir, {
				recursive: true,
				force: true
			});
		}
	};
}
/** Writes per-attempt Gemini settings with the active loopback capture token. */
async function writeGeminiMcpCaptureSettings(params) {
	const existingSettingsPath = params.inheritedEnv?.GEMINI_CLI_SYSTEM_SETTINGS_PATH;
	if (!existingSettingsPath) throw new Error("Gemini MCP capture requires prepared system settings");
	const settings = await readJsonObject(existingSettingsPath);
	const mcpServers = require_record_coerce.isRecord(settings.mcpServers) ? settings.mcpServers : {};
	const operator = require_record_coerce.isRecord(mcpServers.operator) ? mcpServers.operator : {};
	const headers = normalizeStringRecord(operator.headers) ?? {};
	const tempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-gemini-mcp-attempt-"));
	const settingsPath = node_path.default.join(tempDir, "settings.json");
	await (0, _openclaw_fs_safe_json.writeJson)(settingsPath, {
		...settings,
		mcpServers: {
			...mcpServers,
			operator: {
				...operator,
				headers: {
					...headers,
					"x-operator-cli-capture-key": params.captureKey
				}
			}
		}
	}, { trailingNewline: true });
	return {
		env: {
			...params.inheritedEnv,
			GEMINI_CLI_SYSTEM_SETTINGS_PATH: settingsPath
		},
		cleanup: async () => {
			await node_fs_promises.default.rm(tempDir, {
				recursive: true,
				force: true
			});
		}
	};
}
//#endregion
//#region src/agents/cli-runner/bundle-mcp.ts
/**
* Prepares bundled MCP configuration for CLI runner backends.
*/
function resolveBundleMcpMode(mode) {
	return mode ?? "claude-config-file";
}
async function readExternalMcpConfig(configPath) {
	return { mcpServers: require_loader.extractMcpServerMap(await (0, _openclaw_fs_safe_json.tryReadJson)(configPath)) };
}
function sortJsonValue(value) {
	if (Array.isArray(value)) return value.map((entry) => sortJsonValue(entry));
	if (!require_record_coerce.isRecord(value)) return value;
	return Object.fromEntries(Object.keys(value).toSorted().map((key) => [key, sortJsonValue(value[key])]));
}
function normalizeOperatorLoopbackUrl(value) {
	const match = /^(http:\/\/(?:127\.0\.0\.1|localhost|\[::1\])):\d+(\/mcp)$/.exec(value.trim()) ?? void 0;
	if (!match) return value;
	return `${match[1]}:<operator-loopback>${match[2]}`;
}
function canonicalizeSystemAgentTurnStateForResume(server) {
	if (!require_record_coerce.isRecord(server.env) || server.env["OPERATOR_TOOLS_MCP_TOOLS"] !== "@gabrielvfonseca/operator") return server;
	return {
		...server,
		env: {
			...server.env,
			[OPERATOR_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV]: "<operator-turn-state>",
			[OPERATOR_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV]: "<operator-turn-state>"
		}
	};
}
function canonicalizeBundleMcpConfigForResume(config) {
	return { mcpServers: sortJsonValue(Object.fromEntries(Object.entries(config.mcpServers).map(([name, server]) => {
		const canonicalServer = canonicalizeSystemAgentTurnStateForResume(server);
		if (name !== "@gabrielvfonseca/operator" || typeof canonicalServer.url !== "string") return [name, sortJsonValue(canonicalServer)];
		return [name, sortJsonValue({
			...canonicalServer,
			url: normalizeOperatorLoopbackUrl(canonicalServer.url)
		})];
	}))) };
}
const OPERATOR_MCP_ENV_TEMPLATE_PATTERN = /\$\{(OPERATOR_MCP_[A-Z0-9_]+)\}/g;
function resolveOperatorMcpEnvTemplates(value, env) {
	if (!env) return value;
	if (typeof value === "string") return value.replace(OPERATOR_MCP_ENV_TEMPLATE_PATTERN, (match, name) => {
		const replacement = env[name];
		return Object.hasOwn(env, name) && replacement !== void 0 ? replacement : match;
	});
	if (Array.isArray(value)) return value.map((entry) => resolveOperatorMcpEnvTemplates(entry, env));
	if (!require_record_coerce.isRecord(value)) return value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveOperatorMcpEnvTemplates(entry, env)]));
}
async function prepareModeSpecificBundleMcpConfig(params) {
	const serializedConfig = `${JSON.stringify(params.mergedConfig, null, 2)}\n`;
	const mcpConfigHash = node_crypto.default.createHash("sha256").update(serializedConfig).digest("hex");
	const serializedResumeConfig = `${JSON.stringify(canonicalizeBundleMcpConfigForResume(params.mergedConfig), null, 2)}\n`;
	const mcpResumeHash = node_crypto.default.createHash("sha256").update(serializedResumeConfig).digest("hex");
	if (params.mode === "codex-config-overrides") return {
		backend: {
			...params.backend,
			args: injectCodexMcpConfigArgs(params.backend.args, params.mergedConfig),
			resumeArgs: injectCodexMcpConfigArgs(params.backend.resumeArgs ?? params.backend.args ?? [], params.mergedConfig)
		},
		mcpConfigHash,
		mcpResumeHash,
		env: params.env
	};
	if (params.mode === "gemini-system-settings") {
		const settings = await writeGeminiSystemSettings(params.mergedConfig, params.env);
		return {
			backend: params.backend,
			mcpConfigHash,
			mcpResumeHash,
			env: settings.env,
			cleanup: settings.cleanup
		};
	}
	const tempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-cli-mcp-"));
	const mcpConfigPath = node_path.default.join(tempDir, "mcp.json");
	const runtimeConfig = resolveOperatorMcpEnvTemplates(params.mergedConfig, params.env);
	await node_fs_promises.default.writeFile(mcpConfigPath, `${JSON.stringify(runtimeConfig, null, 2)}\n`, "utf-8");
	return {
		backend: {
			...params.backend,
			args: injectClaudeMcpConfigArgs(params.backend.args, mcpConfigPath),
			resumeArgs: injectClaudeMcpConfigArgs(params.backend.resumeArgs ?? params.backend.args ?? [], mcpConfigPath)
		},
		mcpConfigHash,
		mcpResumeHash,
		env: params.env,
		cleanup: async () => {
			await node_fs_promises.default.rm(tempDir, {
				recursive: true,
				force: true
			});
		}
	};
}
/** Prepare backend args/env/cleanup for bundle MCP injection into a CLI run. */
async function prepareCliBundleMcpConfig(params) {
	if (!params.enabled) return {
		backend: params.backend,
		env: params.env
	};
	const mode = resolveBundleMcpMode(params.mode);
	if (params.exclusiveConfig) return await prepareModeSpecificBundleMcpConfig({
		mode,
		backend: params.backend,
		mergedConfig: params.exclusiveConfig,
		env: params.env
	});
	const resumeMcpConfigPaths = mode === "claude-config-file" ? findClaudeMcpConfigPaths(params.backend.resumeArgs) : [];
	const existingMcpConfigPaths = mode === "claude-config-file" && resumeMcpConfigPaths.length > 0 ? resumeMcpConfigPaths : mode === "claude-config-file" ? findClaudeMcpConfigPaths(params.backend.args) : [];
	let mergedConfig = { mcpServers: {} };
	for (const existingMcpConfigPath of existingMcpConfigPaths) {
		const resolvedExistingPath = node_path.default.isAbsolute(existingMcpConfigPath) ? existingMcpConfigPath : node_path.default.resolve(params.workspaceDir, existingMcpConfigPath);
		mergedConfig = require_io.applyMergePatch(mergedConfig, await readExternalMcpConfig(resolvedExistingPath));
	}
	const bundleConfig = require_mcp_auth_profile.loadMergedBundleMcpConfig({
		workspaceDir: params.workspaceDir,
		cfg: params.config,
		mapConfiguredServer: require_mcp_auth_profile.toCliBundleMcpServerConfig
	});
	for (const diagnostic of bundleConfig.diagnostics) params.warn?.(`bundle MCP skipped for ${diagnostic.pluginId}: ${diagnostic.message}`);
	mergedConfig = require_io.applyMergePatch(mergedConfig, bundleConfig.config);
	if (params.additionalConfig) mergedConfig = require_io.applyMergePatch(mergedConfig, params.additionalConfig);
	const resolvedBearerConfig = await require_mcp_auth_profile.resolveMcpBearerBundleConfig({
		config: mergedConfig,
		cfg: params.config,
		agentDir: params.agentDir,
		env: params.env,
		omitUnavailableOAuthServers: true,
		onServerUnavailable: (serverName, error) => params.warn?.(`bundle MCP skipped unavailable OAuth server ${serverName}: ${require_errors.formatErrorMessage(error)}`)
	});
	return await prepareModeSpecificBundleMcpConfig({
		mode,
		backend: params.backend,
		mergedConfig: resolvedBearerConfig.config,
		env: resolvedBearerConfig.env
	});
}
/** Prepares a per-attempt capture token without changing resume compatibility hashes. */
async function prepareCliBundleMcpCaptureAttempt(params) {
	if (!params.captureKey) return { env: params.env };
	if (resolveBundleMcpMode(params.mode) === "gemini-system-settings") return await writeGeminiMcpCaptureSettings({
		inheritedEnv: params.env,
		captureKey: params.captureKey
	});
	if (resolveBundleMcpMode(params.mode) === "claude-config-file") {
		const mcpConfigPath = findClaudeMcpConfigPath(params.backend?.args) ?? findClaudeMcpConfigPath(params.backend?.resumeArgs);
		if (mcpConfigPath) await writeClaudeMcpCaptureConfig({
			mcpConfigPath,
			captureKey: params.captureKey
		});
	}
	return { env: {
		...params.env,
		OPERATOR_MCP_CLI_CAPTURE_KEY: params.captureKey
	} };
}
//#endregion
//#region src/agents/cli-runner/claude-live-session-policy.ts
const LIVE_SESSION_LIMITS = {
	maxSessions: 16,
	maxStderrChars: 64 * 1024
};
/** Resolve Claude's live permission mode without asking root to use an unsupported bypass. */
function resolveClaudeLiveMode(security, ask, uid) {
	return security === "full" && ask === "off" && uid !== 0 ? "bypassPermissions" : "default";
}
//#endregion
//#region src/agents/cli-runner/output-error.ts
function createCliOutputFailoverError(params) {
	if (!params.output.errorText) return;
	const message = formatCliOutputError(params.output, {
		runId: params.runId,
		sessionId: params.sessionId
	});
	const reason = require_errors$1.classifyFailoverReason(message, { provider: params.provider }) ?? "unknown";
	const code = params.output.terminalFailure?.reason === "max_turns" ? "cli_max_turns" : reason === "context_overflow" ? "cli_context_overflow" : void 0;
	return new require_failover_error.FailoverError(message, {
		reason,
		provider: params.provider,
		model: params.model,
		sessionId: params.sessionId,
		lane: params.lane,
		status: require_failover_error.resolveFailoverStatus(reason),
		code,
		rawError: params.output.errorText
	});
}
//#endregion
//#region src/agents/cli-runner/claude-live-session.ts
/**
* Manages reusable Claude CLI stdio sessions for CLI-backed agent turns.
*/
var claude_live_session_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	closeClaudeLiveSessionForContext: () => closeClaudeLiveSessionForContext,
	getClaudeLiveSessionGenerationForOwner: () => getClaudeLiveSessionGenerationForOwner,
	hasClaudeLiveSessionForOwner: () => hasClaudeLiveSessionForOwner,
	rotateClaudeLiveMcpCaptureKeyForContext: () => rotateClaudeLiveMcpCaptureKeyForContext,
	runClaudeLiveSessionTurn: () => runClaudeLiveSessionTurn,
	shouldUseClaudeLiveSession: () => shouldUseClaudeLiveSession
});
const CLAUDE_LIVE_IDLE_TIMEOUT_MS = 600 * 1e3;
const CLAUDE_LIVE_CLOSE_WAIT_TIMEOUT_MS = 5e3;
const liveSessions = /* @__PURE__ */ new Map();
const liveSessionCreates = /* @__PURE__ */ new Map();
function sha256(value) {
	return node_crypto.default.createHash("sha256").update(value).digest("hex");
}
/** Closes all live Claude CLI sessions and clears creation promises for tests. */
function resetClaudeLiveSessionsForTest() {
	for (const session of liveSessions.values()) closeLiveSession(session, "restart");
	liveSessions.clear();
	liveSessionCreates.clear();
}
/** Returns whether this owner still has an in-process Claude stdio session. */
function hasClaudeLiveSessionForOwner(owner) {
	return getClaudeLiveSessionGenerationForOwner(owner) !== void 0;
}
/** Returns the opaque generation of this owner's current or pending Claude stdio session. */
function getClaudeLiveSessionGenerationForOwner(owner) {
	const key = buildClaudeLiveOwnerKey(owner);
	return liveSessions.get(key)?.generation ?? liveSessionCreates.get(key)?.generation;
}
async function waitForManagedRunExit(managedRun) {
	let timeout = null;
	try {
		await Promise.race([managedRun.wait().then(() => void 0, () => void 0), new Promise((resolve) => {
			timeout = setTimeout(resolve, CLAUDE_LIVE_CLOSE_WAIT_TIMEOUT_MS);
			timeout.unref?.();
		})]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
/** Closes the live Claude session associated with a prepared run context, if one exists. */
async function closeClaudeLiveSessionForContext(context) {
	const key = buildClaudeLiveKey(context);
	const session = liveSessions.get(key);
	if (session) {
		closeLiveSession(session, "restart");
		await waitForManagedRunExit(session.managedRun);
	}
	liveSessionCreates.delete(key);
}
/** Close a tainted live process so its replacement gets a fresh MCP capture key. */
async function rotateClaudeLiveMcpCaptureKeyForContext(context) {
	await closeClaudeLiveSessionForContext(context);
}
/** Returns whether a prepared backend context is eligible for Claude live stdio reuse. */
function shouldUseClaudeLiveSession(context) {
	return context.params.sessionEntry?.execHost !== "node" && context.backendResolved.id === "claude-cli" && context.preparedBackend.backend.liveSession === "claude-stdio" && context.preparedBackend.backend.output === "jsonl" && context.preparedBackend.backend.input === "stdin";
}
function upsertArgValue(args, flag, value) {
	const normalized = [];
	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i] ?? "";
		if (arg === flag) {
			i += 1;
			continue;
		}
		if (arg.startsWith(`${flag}=`)) continue;
		normalized.push(arg);
	}
	normalized.push(flag, value);
	return normalized;
}
function appendArg(args, flag) {
	return args.includes(flag) ? args : [...args, flag];
}
function stripLiveProcessArgs(args, backend, stripSystemPrompt) {
	const liveProcessFlags = new Set([
		backend.sessionArg,
		"--session-id",
		stripSystemPrompt ? backend.systemPromptArg : void 0,
		stripSystemPrompt ? backend.systemPromptFileArg : void 0
	].filter((entry) => typeof entry === "string" && entry.length > 0));
	const stripped = [];
	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i] ?? "";
		if (liveProcessFlags.has(arg)) {
			i += 1;
			continue;
		}
		if ([...liveProcessFlags].some((flag) => arg.startsWith(`${flag}=`))) continue;
		stripped.push(arg);
	}
	return stripped;
}
/** Builds Claude CLI args for stream-json live sessions, stripping one-shot session flags. */
function buildClaudeLiveArgs(params) {
	const liveArgs = appendArg(upsertArgValue(upsertArgValue(upsertArgValue(stripLiveProcessArgs(params.args, params.backend, params.useResume && params.backend.systemPromptWhen !== "always"), "--input-format", "stream-json"), "--output-format", "stream-json"), "--permission-prompt-tool", "stdio"), "--replay-user-messages");
	return params.permissionMode ? upsertArgValue(liveArgs, "--permission-mode", params.permissionMode) : liveArgs;
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.claudeLiveSessionTestApi")] = {
	buildClaudeLiveArgs,
	resetClaudeLiveSessionsForTest
};
function buildClaudeLiveOwnerKey(owner) {
	return `${owner.backendId}:${require_helpers.buildClaudeOwnerKey(owner)}`;
}
function buildClaudeLiveKey(context) {
	return buildClaudeLiveOwnerKey({
		backendId: context.backendResolved.id,
		agentAccountId: context.params.agentAccountId,
		agentId: context.params.agentId,
		authProfileId: context.effectiveAuthProfileId,
		sessionId: context.params.sessionId,
		sessionKey: context.params.sessionKey
	});
}
function buildClaudeLiveFingerprint(params) {
	const normalizeMcpConfigPath = Boolean(params.context.preparedBackend.mcpConfigHash);
	const skillSnapshot = params.context.params.skillsSnapshot;
	const skillsFingerprint = skillSnapshot ? sha256(JSON.stringify({
		promptHash: sha256(skillSnapshot.prompt),
		skillFilter: skillSnapshot.skillFilter,
		skills: skillSnapshot.skills,
		resolvedSkills: (skillSnapshot.resolvedSkills ?? []).map((skill) => ({
			name: skill.name,
			description: skill.description,
			filePath: skill.filePath,
			sourceInfo: skill.sourceInfo
		})),
		version: skillSnapshot.version
	})) : void 0;
	const normalizePluginDir = Boolean(skillsFingerprint);
	const omittedValueFlags = new Set([
		params.context.preparedBackend.backend.systemPromptArg,
		params.context.preparedBackend.backend.systemPromptFileArg,
		"--resume",
		"-r"
	].filter((entry) => typeof entry === "string" && entry.length > 0));
	const unstableValueFlags = new Set([
		params.context.preparedBackend.backend.sessionArg,
		"--session-id",
		normalizeMcpConfigPath ? "--mcp-config" : void 0,
		normalizePluginDir ? "--plugin-dir" : void 0
	].filter((entry) => typeof entry === "string" && entry.length > 0));
	const stableArgv = [];
	for (let i = 0; i < params.argv.length; i += 1) {
		const entry = params.argv[i] ?? "";
		if (omittedValueFlags.has(entry)) {
			i += 1;
			continue;
		}
		if ([...omittedValueFlags].some((flag) => entry.startsWith(`${flag}=`))) continue;
		if (unstableValueFlags.has(entry)) {
			stableArgv.push("<unstable>");
			i += 1;
			continue;
		}
		if ([...unstableValueFlags].some((flag) => entry.startsWith(`${flag}=`))) {
			stableArgv.push("<unstable>");
			continue;
		}
		stableArgv.push(entry);
	}
	return JSON.stringify({
		command: params.argv[0],
		workspaceDirHash: sha256(params.context.workspaceDir),
		cwdHash: params.context.cwdHash ?? sha256(params.context.cwd ?? params.context.workspaceDir),
		provider: params.context.params.provider,
		model: params.context.normalizedModel,
		systemPromptHash: sha256(params.context.systemPrompt),
		authProfileIdHash: params.context.effectiveAuthProfileId ? sha256(params.context.effectiveAuthProfileId) : void 0,
		authEpochHash: params.context.authEpoch ? sha256(params.context.authEpoch) : void 0,
		extraSystemPromptHash: params.context.extraSystemPromptHash,
		promptToolNamesHash: params.context.promptToolNamesHash,
		mcpConfigHash: params.context.preparedBackend.mcpConfigHash,
		skillsFingerprint,
		argv: stableArgv,
		env: Object.keys(params.env).toSorted().map((key) => [key, params.env[key] ? sha256(params.env[key]) : ""])
	});
}
function createAbortError(reason) {
	if (reason instanceof Error && require_failover_error.isTimeoutError(reason)) return reason;
	if (reason === void 0) return require_abort_signal.createAbortError("CLI run aborted");
	const error = new Error(reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "CLI run aborted", reason instanceof Error ? { cause: reason } : void 0);
	error.name = "AbortError";
	return error;
}
function clearTurnTimers(turn) {
	if (turn.noOutputTimer) {
		clearTimeout(turn.noOutputTimer);
		turn.noOutputTimer = null;
	}
	if (turn.timeoutTimer) {
		clearTimeout(turn.timeoutTimer);
		turn.timeoutTimer = null;
	}
}
function clearOutstandingBackgroundTasks(session) {
	session.outstandingBackgroundTaskIds.clear();
}
function finishTurn(session, output) {
	const turn = session.currentTurn;
	if (!turn) return;
	require_helpers.cliBackendLog.info(`claude live session turn: provider=${session.providerId} model=${session.modelId} durationMs=${Date.now() - turn.startedAtMs} rawLines=${turn.rawLines.length} ${require_helpers.formatCliBackendOutputDigest(output.text)}`);
	turn.streamingParser.finish();
	failActiveClaudeLiveTools(turn, /* @__PURE__ */ new Error("Tool result missing before turn completed"));
	clearTurnTimers(turn);
	clearOutstandingBackgroundTasks(session);
	session.currentTurn = null;
	turn.resolve(output);
	scheduleIdleClose(session);
}
function failTurn(session, error) {
	const turn = session.currentTurn;
	if (!turn) return;
	const errorKind = error instanceof Error ? error.name : typeof error;
	require_helpers.cliBackendLog.warn(`claude live session turn failed: provider=${session.providerId} model=${session.modelId} durationMs=${Date.now() - turn.startedAtMs} error=${errorKind}`);
	turn.streamingParser.finish();
	failActiveClaudeLiveTools(turn, error);
	clearTurnTimers(turn);
	clearOutstandingBackgroundTasks(session);
	session.currentTurn = null;
	turn.reject(error);
}
function abortTurn(session, error) {
	if (!session.currentTurn) return;
	closeLiveSession(session, "abort", error);
}
function cleanupLiveSession(session) {
	if (!session.cleanupPromise) session.cleanupPromise = session.cleanup().catch((error) => {
		require_helpers.cliBackendLog.warn(`Claude live session cleanup failed: ${require_errors.formatErrorMessage(error)}`);
	});
	return session.cleanupPromise;
}
function closeLiveSession(session, reason, error) {
	if (session.closing) return;
	require_helpers.cliBackendLog.info(`claude live session close: provider=${session.providerId} model=${session.modelId} reason=${reason}`);
	session.closing = true;
	if (session.idleTimer) {
		clearTimeout(session.idleTimer);
		session.idleTimer = null;
	}
	if (liveSessions.get(session.key) === session) liveSessions.delete(session.key);
	if (error) failTurn(session, error);
	else clearOutstandingBackgroundTasks(session);
	session.managedRun.cancel("manual-cancel");
	cleanupLiveSession(session);
}
function scheduleIdleClose(session) {
	if (session.idleTimer) clearTimeout(session.idleTimer);
	session.idleTimer = setTimeout(() => {
		if (!session.currentTurn) closeLiveSession(session, "idle");
	}, CLAUDE_LIVE_IDLE_TIMEOUT_MS);
}
function createTimeoutError(session, message, code) {
	return new require_failover_error.FailoverError(message, {
		reason: "timeout",
		provider: session.providerId,
		model: session.modelId,
		status: require_failover_error.resolveFailoverStatus("timeout"),
		code
	});
}
function createOutputLimitError(session, message) {
	return new require_failover_error.FailoverError(message, {
		reason: "format",
		provider: session.providerId,
		model: session.modelId,
		status: require_failover_error.resolveFailoverStatus("format")
	});
}
function diagnosticToolSourceForClaudeLiveTool(toolName) {
	return toolName.startsWith("mcp__") ? "mcp" : "core";
}
function claudeLiveDiagnosticBase(turn) {
	return {
		runId: turn.diagnosticRefs.runId,
		sessionId: turn.diagnosticRefs.sessionId,
		...turn.diagnosticRefs.sessionKey ? { sessionKey: turn.diagnosticRefs.sessionKey } : {},
		...turn.diagnosticRefs.agentId ? { agentId: turn.diagnosticRefs.agentId } : {}
	};
}
function emitClaudeLiveProgress(turn, reason) {
	require_diagnostic_events.emitTrustedDiagnosticEvent({
		type: "run.progress",
		...claudeLiveDiagnosticBase(turn),
		reason
	});
}
function summarizeClaudeLiveToolInput(input) {
	if (input === void 0) return;
	if (input === null) return { kind: "null" };
	if (Array.isArray(input)) return {
		kind: "array",
		length: input.length
	};
	switch (typeof input) {
		case "object": return { kind: "object" };
		case "string": return {
			kind: "string",
			length: input.length
		};
		case "number": return { kind: "number" };
		case "boolean": return { kind: "boolean" };
		case "undefined": return { kind: "undefined" };
		default: return { kind: "other" };
	}
}
function markClaudeLiveToolStarted(turn, tool) {
	if (turn.completedToolCallIds.has(tool.toolCallId) || turn.activeTools.has(tool.toolCallId)) return;
	const now = Date.now();
	turn.activeTools.set(tool.toolCallId, {
		toolName: tool.name,
		toolCallId: tool.toolCallId,
		kind: tool.kind,
		startedAt: now
	});
	turn.toolEventCount += 1;
	require_diagnostic_events.emitTrustedDiagnosticEvent({
		type: "tool.execution.started",
		...claudeLiveDiagnosticBase(turn),
		toolName: tool.name,
		toolSource: diagnosticToolSourceForClaudeLiveTool(tool.name),
		toolOwner: "claude-cli",
		toolCallId: tool.toolCallId,
		paramsSummary: summarizeClaudeLiveToolInput(tool.args)
	});
	emitClaudeLiveProgress(turn, "cli_live:tool_started");
}
function markClaudeLiveToolCompleted(turn, result, terminalOutcome) {
	if (turn.completedToolCallIds.has(result.toolCallId)) return;
	turn.toolEventCount += 1;
	const activeTool = turn.activeTools.get(result.toolCallId);
	if (!activeTool) {
		emitClaudeLiveProgress(turn, "cli_live:tool_result");
		return;
	}
	turn.activeTools.delete(result.toolCallId);
	turn.completedToolCallIds.add(result.toolCallId);
	const event = {
		...claudeLiveDiagnosticBase(turn),
		toolName: activeTool.toolName,
		toolSource: diagnosticToolSourceForClaudeLiveTool(activeTool.toolName),
		toolOwner: "claude-cli",
		toolCallId: activeTool.toolCallId,
		durationMs: Math.max(0, Date.now() - activeTool.startedAt)
	};
	if (terminalOutcome?.outcome === "blocked") require_diagnostic_events.emitTrustedDiagnosticEvent({
		type: "tool.execution.blocked",
		...event,
		deniedReason: terminalOutcome.deniedReason,
		reason: terminalOutcome.reason ?? "blocked by before-tool policy"
	});
	else if (terminalOutcome?.outcome === "unknown") require_diagnostic_events.emitTrustedDiagnosticEvent({
		type: "tool.execution.error",
		...event,
		errorCategory: "cli_tool_ambiguous",
		errorCode: "tool_outcome_unknown"
	});
	else if (terminalOutcome || result.isError) {
		const terminalReason = terminalOutcome?.outcome ?? "failed";
		require_diagnostic_events.emitTrustedDiagnosticEvent({
			type: "tool.execution.error",
			...event,
			errorCategory: terminalReason === "cancelled" ? "aborted" : "tool_failed",
			terminalReason
		});
	} else require_diagnostic_events.emitTrustedDiagnosticEvent({
		type: "tool.execution.completed",
		...event
	});
	emitClaudeLiveProgress(turn, "cli_live:tool_result");
}
function markClaudeLiveToolDenied(turn, tool) {
	markClaudeLiveToolStarted(turn, tool);
	markClaudeLiveToolCompleted(turn, {
		toolCallId: tool.toolCallId,
		name: tool.name,
		isError: true
	}, {
		outcome: "blocked",
		deniedReason: "cli_live_exec_policy",
		reason: "blocked by CLI live execution policy"
	});
}
function failActiveClaudeLiveTools(turn, error) {
	const terminalReason = require_run_termination.resolveCliToolTerminalReason({
		error,
		abortSignal: turn.abortSignal
	});
	const errorCategory = terminalReason === "timed_out" ? "timeout" : terminalReason === "cancelled" ? "aborted" : "error";
	for (const activeTool of turn.activeTools.values()) {
		const event = {
			...claudeLiveDiagnosticBase(turn),
			toolName: activeTool.toolName,
			toolSource: diagnosticToolSourceForClaudeLiveTool(activeTool.toolName),
			toolOwner: "claude-cli",
			toolCallId: activeTool.toolCallId,
			durationMs: Math.max(0, Date.now() - activeTool.startedAt)
		};
		if (activeTool.kind === "server_tool_use") {
			require_diagnostic_events.emitTrustedDiagnosticEvent({
				type: "tool.execution.error",
				...event,
				errorCategory: "cli_tool_ambiguous",
				errorCode: "tool_outcome_unknown"
			});
			continue;
		}
		require_diagnostic_events.emitTrustedDiagnosticEvent({
			type: "tool.execution.error",
			...event,
			errorCategory,
			terminalReason
		});
	}
	turn.activeTools.clear();
}
function noteClaudeLiveProgress(turn, parsed, sawToolEvent) {
	if (parsed.type === "result") {
		emitClaudeLiveProgress(turn, "cli_live:result");
		return;
	}
	if (sawToolEvent) return;
	emitClaudeLiveProgress(turn, "cli_live:stream_progress");
}
function armNoOutputTimer(session, turn, delayMs) {
	if (turn.noOutputTimer) clearTimeout(turn.noOutputTimer);
	turn.noOutputTimer = setTimeout(() => {
		const quietSinceMs = turn.lastOutputAtMs ?? turn.startedAtMs;
		if (turn.activeTools.size > 0 || session.outstandingBackgroundTaskIds.size > 0) {
			const remainingMs = quietSinceMs + Math.max(session.noOutputTimeoutMs, require_diagnostic_run_activity.BLOCKED_TOOL_CALL_ABORT_FLOOR_MS) - Date.now();
			if (remainingMs > 0) {
				armNoOutputTimer(session, turn, remainingMs);
				return;
			}
		}
		closeLiveSession(session, "abort", createTimeoutError(session, `CLI produced no output for ${Math.round((Date.now() - quietSinceMs) / 1e3)}s and was terminated.`, turn.lastOutputAtMs === null ? "cli_no_output_timeout" : void 0));
	}, delayMs);
}
const CLAUDE_LIVE_RESULT_HOLDING_BACKGROUND_TASK_TYPES = /* @__PURE__ */ new Set(["local_agent", "local_workflow"]);
/** Replace outstanding subagent/workflow task ids from background_tasks_changed. */
function applyBackgroundTasksChanged(session, parsed) {
	if (parsed.type !== "system" || parsed.subtype !== "background_tasks_changed") return;
	const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
	session.outstandingBackgroundTaskIds.clear();
	for (const task of tasks) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(task)) continue;
		const taskType = typeof task.task_type === "string" ? task.task_type.trim() : "";
		if (!CLAUDE_LIVE_RESULT_HOLDING_BACKGROUND_TASK_TYPES.has(taskType)) continue;
		const taskId = typeof task.task_id === "string" ? task.task_id.trim() : "";
		if (taskId) session.outstandingBackgroundTaskIds.add(taskId);
	}
}
function resetNoOutputTimer(session) {
	const turn = session.currentTurn;
	if (!turn) return;
	turn.lastOutputAtMs = Date.now();
	armNoOutputTimer(session, turn, session.noOutputTimeoutMs);
}
function parseSessionId(parsed) {
	return (typeof parsed.session_id === "string" ? parsed.session_id.trim() : typeof parsed.sessionId === "string" ? parsed.sessionId.trim() : "") || void 0;
}
function readConfiguredExecPolicy(context) {
	const agentId = context.params.agentId ?? require_session_key.resolveAgentIdFromSessionKey(context.params.sessionKey);
	const exec = context.params.config?.agents?.list?.find((agent) => agent.id === agentId)?.tools?.exec ?? context.params.config?.tools?.exec;
	const security = exec?.security ?? "full";
	const configuredAsk = exec?.ask ?? "off";
	const sessionAsk = require_exec_approvals.normalizeExecAsk(context.params.sessionEntry?.execAsk);
	return {
		agentId,
		security,
		ask: sessionAsk ? require_exec_approvals.maxAsk(configuredAsk, sessionAsk) : configuredAsk
	};
}
function resolveClaudeLiveExecPermission(context) {
	const configured = readConfiguredExecPolicy(context);
	const approvals = require_exec_approvals.resolveExecApprovalsFromFile({
		file: require_exec_approvals.loadExecApprovals(),
		agentId: configured.agentId,
		overrides: {
			security: configured.security,
			ask: configured.ask
		}
	});
	const security = require_exec_approvals.minSecurity(configured.security, approvals.agent.security);
	const ask = require_exec_approvals.maxAsk(configured.ask, approvals.agent.ask);
	return {
		security,
		ask,
		permissionMode: resolveClaudeLiveMode(security, ask, process.getuid?.())
	};
}
function parseClaudeLiveJsonLine(session, trimmed) {
	const maxPendingLineChars = session.currentTurn?.outputLimits.maxPendingLineChars ?? 8388608;
	if (trimmed.length > maxPendingLineChars) {
		closeLiveSession(session, "abort", createOutputLimitError(session, "Claude CLI JSONL line exceeded output limit."));
		return null;
	}
	let parsed;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		return null;
	}
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? parsed : null;
}
function writeClaudeLiveControlResponse(session, response) {
	const stdin = session.managedRun.stdin;
	if (!stdin) throw new Error("Claude CLI live session stdin is unavailable");
	stdin.write(`${JSON.stringify(response)}\n`);
}
function handleClaudeLiveControlRequest(session, turn, parsed) {
	if (parsed.type !== "control_request" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.request)) return;
	const request = parsed.request;
	if (request.subtype !== "can_use_tool") return;
	const requestId = typeof parsed.request_id === "string" ? parsed.request_id : "";
	if (!requestId) return;
	const toolUseId = typeof request.tool_use_id === "string" ? request.tool_use_id : void 0;
	const toolName = typeof request.tool_name === "string" ? request.tool_name.trim() : "";
	const toolInput = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(request.input) ? request.input : {};
	const allowed = turn.execPermission.security === "full" && turn.execPermission.ask === "off";
	if (!allowed && toolUseId && toolName) markClaudeLiveToolDenied(turn, {
		toolCallId: toolUseId,
		name: toolName,
		kind: "tool_use",
		args: toolInput
	});
	writeClaudeLiveControlResponse(session, {
		type: "control_response",
		response: {
			subtype: "success",
			request_id: requestId,
			response: allowed ? {
				behavior: "allow",
				updatedInput: toolInput,
				...toolUseId ? { toolUseID: toolUseId } : {}
			} : {
				behavior: "deny",
				decisionClassification: "user_reject",
				message: `Operator exec policy denied Claude native tool use (security=${turn.execPermission.security}, ask=${turn.execPermission.ask}).`
			}
		}
	});
}
function handleClaudeLiveLine(session, line) {
	const turn = session.currentTurn;
	const trimmed = line.trim();
	if (!trimmed) return;
	const parsed = parseClaudeLiveJsonLine(session, trimmed);
	if (turn) turn.observedStdout = true;
	if (!parsed) return;
	const parsedSessionId = parseSessionId(parsed);
	if (parsedSessionId) session.sessionId = parsedSessionId;
	if (!turn) return;
	turn.rawChars += trimmed.length + 1;
	if (turn.rawChars > turn.outputLimits.maxTurnRawChars || turn.rawLines.length >= turn.outputLimits.maxTurnLines) {
		closeLiveSession(session, "abort", createOutputLimitError(session, "Claude CLI turn output exceeded limit."));
		return;
	}
	turn.rawLines.push(trimmed);
	applyBackgroundTasksChanged(session, parsed);
	const toolEventCountBefore = turn.toolEventCount;
	turn.streamingParser.push(`${trimmed}\n`);
	turn.sessionId = parsedSessionId ?? turn.sessionId;
	noteClaudeLiveProgress(turn, parsed, turn.toolEventCount !== toolEventCountBefore);
	handleClaudeLiveControlRequest(session, turn, parsed);
	if (parsed.type !== "result") return;
	const raw = turn.rawLines.join("\n");
	const output = turn.streamingParser.getOutput() ?? parseCliOutput({
		raw,
		backend: turn.backend,
		providerId: session.providerId,
		outputMode: "jsonl",
		fallbackSessionId: turn.sessionId
	});
	if (output.errorText) {
		const error = createCliOutputFailoverError({
			output,
			provider: session.providerId,
			model: session.modelId,
			runId: turn.diagnosticRefs.runId,
			sessionId: turn.diagnosticRefs.sessionId
		});
		if (error) failTurn(session, error);
		scheduleIdleClose(session);
		return;
	}
	if (session.outstandingBackgroundTaskIds.size > 0) {
		emitClaudeLiveProgress(turn, "cli_live:result_deferred_background_tasks");
		return;
	}
	finishTurn(session, output);
}
function handleClaudeStdout(session, chunk) {
	resetNoOutputTimer(session);
	session.stdoutBuffer += chunk;
	const maxPendingLineChars = session.currentTurn?.outputLimits.maxPendingLineChars ?? 8388608;
	if (session.stdoutBuffer.length > maxPendingLineChars) {
		closeLiveSession(session, "abort", createOutputLimitError(session, "Claude CLI JSONL line exceeded output limit."));
		return;
	}
	const lines = session.stdoutBuffer.split(/\r?\n/g);
	session.stdoutBuffer = lines.pop() ?? "";
	try {
		for (const line of lines) handleClaudeLiveLine(session, line);
	} catch (error) {
		closeLiveSession(session, "abort", error);
	}
}
function handleClaudeExit(session, exitCode) {
	session.closing = true;
	if (session.idleTimer) {
		clearTimeout(session.idleTimer);
		session.idleTimer = null;
	}
	if (liveSessions.get(session.key) === session) liveSessions.delete(session.key);
	cleanupLiveSession(session);
	if (!session.currentTurn) return;
	if (session.stdoutBuffer.trim()) {
		try {
			handleClaudeLiveLine(session, session.stdoutBuffer);
		} catch (error) {
			session.stdoutBuffer = "";
			failTurn(session, error);
			return;
		}
		session.stdoutBuffer = "";
	}
	if (!session.currentTurn) return;
	const stderr = session.stderr.trim();
	const fallbackMessage = exitCode === 0 ? "Claude CLI exited before completing the turn." : "Claude CLI failed.";
	const message = extractCliErrorMessage(stderr) ?? (stderr || fallbackMessage);
	if (exitCode === 0 && !stderr) {
		const turn = session.currentTurn;
		const retryCode = turn && !turn.observedStdout && turn.rawLines.length === 0 ? "cli_unknown_empty_failure" : void 0;
		failTurn(session, new require_failover_error.FailoverError(message, {
			reason: "empty_response",
			provider: session.providerId,
			model: session.modelId,
			status: require_failover_error.resolveFailoverStatus("empty_response"),
			code: retryCode
		}));
		return;
	}
	const reason = require_errors$1.classifyFailoverReason(message, { provider: session.providerId }) ?? "unknown";
	const code = reason === "context_overflow" ? "cli_context_overflow" : void 0;
	failTurn(session, new require_failover_error.FailoverError(message, {
		reason,
		provider: session.providerId,
		model: session.modelId,
		status: require_failover_error.resolveFailoverStatus(reason),
		code
	}));
}
function createClaudeUserInputMessage(content) {
	return `${JSON.stringify({
		type: "user",
		session_id: "",
		parent_tool_use_id: null,
		message: {
			role: "user",
			content
		}
	})}\n`;
}
async function writeTurnInput(session, prompt) {
	const stdin = session.managedRun.stdin;
	if (!stdin) throw new Error("Claude CLI live session stdin is unavailable");
	await new Promise((resolve, reject) => {
		stdin.write(createClaudeUserInputMessage(prompt), (error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}
async function createClaudeLiveSession(params) {
	let session = null;
	const mcpCaptureAttempt = await prepareCliBundleMcpCaptureAttempt({
		mode: params.context.backendResolved.bundleMcpMode,
		backend: params.context.preparedBackend.backend,
		env: params.env,
		captureKey: params.mcpCaptureKey
	});
	let managedRun;
	try {
		managedRun = await params.supervisor.spawn({
			sessionId: params.context.params.sessionId,
			backendId: params.context.backendResolved.id,
			scopeKey: `claude-live:${params.key}`,
			replaceExistingScope: true,
			mode: "child",
			argv: params.argv,
			cwd: params.context.cwd ?? params.context.workspaceDir,
			env: mcpCaptureAttempt.env ?? params.env,
			stdinMode: "pipe-open",
			captureOutput: false,
			onStdout: (chunk) => {
				if (session) handleClaudeStdout(session, chunk);
			},
			onStderr: (chunk) => {
				if (session) {
					session.stderr += chunk;
					if (session.stderr.length > LIVE_SESSION_LIMITS.maxStderrChars) {
						closeLiveSession(session, "abort", createOutputLimitError(session, "Claude CLI stderr exceeded limit."));
						return;
					}
					resetNoOutputTimer(session);
				}
			}
		});
	} catch (error) {
		await mcpCaptureAttempt.cleanup?.();
		throw error;
	}
	session = {
		key: params.key,
		generation: params.generation,
		fingerprint: params.fingerprint,
		managedRun,
		providerId: params.context.params.provider,
		modelId: params.context.modelId,
		noOutputTimeoutMs: params.noOutputTimeoutMs,
		stderr: "",
		stdoutBuffer: "",
		currentTurn: null,
		idleTimer: null,
		cleanup: async () => {
			await mcpCaptureAttempt.cleanup?.();
			await params.cleanup();
		},
		cleanupPromise: null,
		closing: false,
		mcpCaptureKey: params.mcpCaptureKey,
		outstandingBackgroundTaskIds: /* @__PURE__ */ new Set()
	};
	managedRun.wait().then((exit) => handleClaudeExit(session, exit.exitCode), (error) => {
		if (session) closeLiveSession(session, "abort", error);
	});
	liveSessions.set(params.key, session);
	require_helpers.cliBackendLog.info(`claude live session start: provider=${session.providerId} model=${session.modelId} activeSessions=${liveSessions.size}`);
	return session;
}
function createTurn(params) {
	const turn = {
		backend: params.context.preparedBackend.backend,
		diagnosticRefs: {
			runId: params.context.params.runId,
			sessionId: params.context.params.sessionId,
			...params.context.params.sessionKey ? { sessionKey: params.context.params.sessionKey } : {},
			...params.context.params.agentId ? { agentId: params.context.params.agentId } : {}
		},
		abortSignal: params.context.params.abortSignal,
		outputLimits: resolveCliStreamJsonOutputLimits(params.context.preparedBackend.backend),
		startedAtMs: Date.now(),
		rawLines: [],
		rawChars: 0,
		noOutputTimer: null,
		lastOutputAtMs: null,
		timeoutTimer: null,
		activeTools: /* @__PURE__ */ new Map(),
		observedStdout: false,
		completedToolCallIds: /* @__PURE__ */ new Set(),
		toolEventCount: 0,
		streamingParser: createCliJsonlStreamingParser({
			backend: params.context.preparedBackend.backend,
			providerId: params.context.backendResolved.id,
			onAssistantDelta: params.onAssistantDelta,
			onThinkingDelta: params.onThinkingDelta,
			onThinkingProgress: params.onThinkingProgress,
			onToolUseStart: (delta) => {
				markClaudeLiveToolStarted(turn, delta);
				params.onToolUseStart?.(delta);
			},
			onToolResult: (delta) => {
				markClaudeLiveToolCompleted(turn, delta, params.resolveToolResultTerminalOutcome?.(delta));
				params.onToolResult?.(delta);
			},
			onCommentaryText: params.onCommentaryText,
			onSessionId: params.onSessionId
		}),
		execPermission: params.execPermission,
		resolve: params.resolve,
		reject: params.reject
	};
	armNoOutputTimer(params.session, turn, params.noOutputTimeoutMs);
	turn.timeoutTimer = setTimeout(() => {
		closeLiveSession(params.session, "abort", createTimeoutError(params.session, `CLI exceeded timeout (${Math.round(params.context.params.timeoutMs / 1e3)}s) and was terminated.`));
	}, params.context.params.timeoutMs);
	return turn;
}
function closeOldestIdleSession() {
	for (const session of liveSessions.values()) if (!session.currentTurn) {
		closeLiveSession(session, "idle");
		return true;
	}
	return false;
}
function ensureLiveSessionCapacity(key, context) {
	if (liveSessions.has(key) || liveSessionCreates.has(key) || liveSessions.size + liveSessionCreates.size < LIVE_SESSION_LIMITS.maxSessions) return;
	if (closeOldestIdleSession()) return;
	throw new require_failover_error.FailoverError("Too many Claude CLI live sessions are active.", {
		reason: "rate_limit",
		provider: context.params.provider,
		model: context.modelId,
		status: require_failover_error.resolveFailoverStatus("rate_limit")
	});
}
function createRequiredLiveSessionError(params) {
	return new require_failover_error.FailoverError("Managed Claude live session is no longer reusable.", {
		reason: "session_expired",
		provider: params.context.params.provider,
		model: params.context.modelId,
		status: require_failover_error.resolveFailoverStatus("session_expired"),
		code: params.code,
		cause: params.cause
	});
}
/** Runs one prompt through a reusable Claude CLI live session. */
async function runClaudeLiveSessionTurn(params) {
	const key = buildClaudeLiveKey(params.context);
	const resumeCapable = Boolean(params.context.preparedBackend.backend.resumeArgs?.length);
	const execPermission = resolveClaudeLiveExecPermission(params.context);
	const argv = [
		params.executableCommand ?? params.context.preparedBackend.backend.command,
		...params.executableLeadingArgv ?? [],
		...buildClaudeLiveArgs({
			args: params.args,
			backend: params.context.preparedBackend.backend,
			systemPrompt: params.context.systemPrompt,
			useResume: params.useResume,
			permissionMode: execPermission.permissionMode
		})
	];
	const fingerprint = buildClaudeLiveFingerprint({
		context: params.context,
		argv,
		env: params.env
	});
	let cleanupDone = false;
	const cleanup = async () => {
		if (cleanupDone) return;
		cleanupDone = true;
		await params.cleanup();
	};
	let session = liveSessions.get(key) ?? null;
	if (session && params.requiredSessionGeneration && session.generation !== params.requiredSessionGeneration) {
		await cleanup();
		throw createRequiredLiveSessionError({
			context: params.context,
			code: "cli_live_session_changed"
		});
	}
	if (session && params.forceNewSession) {
		closeLiveSession(session, "restart");
		session = null;
	}
	if (session && resumeCapable && !params.useResume) {
		closeLiveSession(session, "restart");
		session = null;
	}
	if (session && session.fingerprint !== fingerprint) {
		if (params.requiredSessionGeneration) {
			await cleanup();
			throw createRequiredLiveSessionError({
				context: params.context,
				code: "cli_live_session_changed"
			});
		}
		closeLiveSession(session, "restart");
		session = null;
	}
	if (!session && params.requiredSessionGeneration) {
		const pendingGeneration = liveSessionCreates.get(key)?.generation;
		if (pendingGeneration !== params.requiredSessionGeneration) {
			await cleanup();
			throw createRequiredLiveSessionError({
				context: params.context,
				code: pendingGeneration ? "cli_live_session_changed" : "cli_live_session_missing"
			});
		}
	}
	let cleanupTurnArtifacts = Boolean(session);
	let notifiedMcpCaptureKey;
	const notifyMcpCaptureReady = (captureKey) => {
		if (!captureKey || notifiedMcpCaptureKey === captureKey) return;
		params.onMcpCaptureReady?.(captureKey);
		notifiedMcpCaptureKey = captureKey;
	};
	try {
		ensureLiveSessionCapacity(key, params.context);
	} catch (error) {
		await cleanup();
		throw error;
	}
	if (!session) {
		const pendingSession = liveSessionCreates.get(key);
		if (pendingSession) {
			try {
				session = await pendingSession.promise;
			} catch (error) {
				await cleanup();
				if (params.requiredSessionGeneration) throw createRequiredLiveSessionError({
					context: params.context,
					code: "cli_live_session_missing",
					cause: error
				});
				throw error;
			}
			if (params.requiredSessionGeneration && session.generation !== params.requiredSessionGeneration) {
				await cleanup();
				throw createRequiredLiveSessionError({
					context: params.context,
					code: "cli_live_session_changed"
				});
			}
			if (params.forceNewSession) {
				closeLiveSession(session, "restart");
				session = null;
			} else if (session.fingerprint !== fingerprint) {
				if (params.requiredSessionGeneration) {
					await cleanup();
					throw createRequiredLiveSessionError({
						context: params.context,
						code: "cli_live_session_changed"
					});
				}
				closeLiveSession(session, "restart");
				session = null;
			} else if (resumeCapable && !params.useResume) {
				closeLiveSession(session, "restart");
				session = null;
			} else cleanupTurnArtifacts = true;
		}
		if (!session) {
			if (params.requiredSessionGeneration) {
				await cleanup();
				throw createRequiredLiveSessionError({
					context: params.context,
					code: "cli_live_session_missing"
				});
			}
			const generation = node_crypto.default.randomUUID();
			const mcpCaptureKey = params.context.mcpDeliveryCapture ? node_crypto.default.randomUUID() : void 0;
			if (mcpCaptureKey) try {
				notifyMcpCaptureReady(mcpCaptureKey);
			} catch (error) {
				await cleanup();
				throw error;
			}
			const createSession = createClaudeLiveSession({
				context: params.context,
				argv,
				env: params.env,
				generation,
				fingerprint,
				key,
				mcpCaptureKey,
				noOutputTimeoutMs: params.noOutputTimeoutMs,
				supervisor: params.getProcessSupervisor(),
				cleanup
			}).finally(() => {
				if (liveSessionCreates.get(key)?.promise === createSession) liveSessionCreates.delete(key);
			});
			liveSessionCreates.set(key, {
				generation,
				promise: createSession
			});
			try {
				session = await createSession;
			} catch (error) {
				await cleanup();
				throw error;
			}
		}
	}
	if (cleanupTurnArtifacts && session) {
		if (session.idleTimer) {
			clearTimeout(session.idleTimer);
			session.idleTimer = null;
		}
		await cleanup();
		require_helpers.cliBackendLog.info(`claude live session reuse: provider=${session.providerId} model=${session.modelId}`);
	}
	if (session.closing || liveSessions.get(key) !== session) {
		await cleanup();
		if (params.requiredSessionGeneration) throw createRequiredLiveSessionError({
			context: params.context,
			code: "cli_live_session_missing"
		});
		throw new Error("Claude CLI live session closed before handling the turn");
	}
	if (session.currentTurn) throw new Error("Claude CLI live session is already handling a turn");
	const liveSession = session;
	if (liveSession.sessionId) params.onSessionId?.(liveSession.sessionId);
	notifyMcpCaptureReady(liveSession.mcpCaptureKey);
	liveSession.noOutputTimeoutMs = params.noOutputTimeoutMs;
	liveSession.stderr = "";
	const outputPromise = new Promise((resolve, reject) => {
		liveSession.currentTurn = createTurn({
			context: params.context,
			noOutputTimeoutMs: params.noOutputTimeoutMs,
			onAssistantDelta: params.onAssistantDelta,
			onThinkingDelta: params.onThinkingDelta,
			onThinkingProgress: params.onThinkingProgress,
			onToolUseStart: params.onToolUseStart,
			onToolResult: params.onToolResult,
			resolveToolResultTerminalOutcome: params.resolveToolResultTerminalOutcome,
			onCommentaryText: params.onCommentaryText,
			onSessionId: params.onSessionId,
			session: liveSession,
			execPermission,
			resolve,
			reject
		});
	});
	outputPromise.catch(() => void 0);
	const abort = () => abortTurn(liveSession, createAbortError(params.context.params.abortSignal?.reason));
	let replyBackendCompleted = false;
	const replyBackendHandle = params.context.params.replyOperation ? {
		kind: "cli",
		cancel: abort,
		isStreaming: () => !replyBackendCompleted
	} : void 0;
	params.context.params.abortSignal?.addEventListener("abort", abort, { once: true });
	if (replyBackendHandle) params.context.params.replyOperation?.attachBackend(replyBackendHandle);
	try {
		if (params.context.params.abortSignal?.aborted) abort();
		else try {
			await Promise.race([writeTurnInput(liveSession, params.prompt), outputPromise]);
		} catch (error) {
			closeLiveSession(liveSession, "abort", error);
		}
		return { output: await outputPromise };
	} finally {
		replyBackendCompleted = true;
		params.context.params.abortSignal?.removeEventListener("abort", abort);
		try {
			if (replyBackendHandle) params.context.params.replyOperation?.detachBackend(replyBackendHandle);
		} finally {
			if (liveSession.mcpCaptureKey) {
				closeLiveSession(liveSession, "restart");
				await waitForManagedRunExit(liveSession.managedRun);
				await cleanupLiveSession(liveSession);
			}
		}
	}
}
//#endregion
Object.defineProperty(exports, "buildSystemAgentToolsMcpServerConfig", {
	enumerable: true,
	get: function() {
		return buildSystemAgentToolsMcpServerConfig;
	}
});
Object.defineProperty(exports, "claude_live_session_exports", {
	enumerable: true,
	get: function() {
		return claude_live_session_exports;
	}
});
Object.defineProperty(exports, "closeClaudeLiveSessionForContext", {
	enumerable: true,
	get: function() {
		return closeClaudeLiveSessionForContext;
	}
});
Object.defineProperty(exports, "createCliJsonlStreamingParser", {
	enumerable: true,
	get: function() {
		return createCliJsonlStreamingParser;
	}
});
Object.defineProperty(exports, "createCliOutputFailoverError", {
	enumerable: true,
	get: function() {
		return createCliOutputFailoverError;
	}
});
Object.defineProperty(exports, "extractCliErrorMessage", {
	enumerable: true,
	get: function() {
		return extractCliErrorMessage;
	}
});
Object.defineProperty(exports, "getClaudeLiveSessionGenerationForOwner", {
	enumerable: true,
	get: function() {
		return getClaudeLiveSessionGenerationForOwner;
	}
});
Object.defineProperty(exports, "hasClaudeLiveSessionForOwner", {
	enumerable: true,
	get: function() {
		return hasClaudeLiveSessionForOwner;
	}
});
Object.defineProperty(exports, "parseCliOutput", {
	enumerable: true,
	get: function() {
		return parseCliOutput;
	}
});
Object.defineProperty(exports, "prepareCliBundleMcpCaptureAttempt", {
	enumerable: true,
	get: function() {
		return prepareCliBundleMcpCaptureAttempt;
	}
});
Object.defineProperty(exports, "prepareCliBundleMcpConfig", {
	enumerable: true,
	get: function() {
		return prepareCliBundleMcpConfig;
	}
});
Object.defineProperty(exports, "rotateClaudeLiveMcpCaptureKeyForContext", {
	enumerable: true,
	get: function() {
		return rotateClaudeLiveMcpCaptureKeyForContext;
	}
});
Object.defineProperty(exports, "runClaudeLiveSessionTurn", {
	enumerable: true,
	get: function() {
		return runClaudeLiveSessionTurn;
	}
});
Object.defineProperty(exports, "shouldUseClaudeLiveSession", {
	enumerable: true,
	get: function() {
		return shouldUseClaudeLiveSession;
	}
});
