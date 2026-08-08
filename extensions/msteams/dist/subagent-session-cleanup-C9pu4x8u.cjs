const require_string_readers = require("./string-readers-DjRuUveR.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_store = require("./store-DCwJguwr.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_call = require("./call-CphTnsHC.cjs");
require("./runs-BxiWZCUY.cjs");
const require_agent_run_terminal_outcome = require("./agent-run-terminal-outcome-BNehmvQh.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_sanitize_for_prompt = require("./sanitize-for-prompt-C114FURC.cjs");
require("./server-plugins-Dy_TV4O_.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_chat_history_text = require("./chat-history-text-D9KfJyJC.cjs");
const require_subagent_run_generation = require("./subagent-run-generation-Ds6deSIQ.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/agents/tools/sessions-send-tokens.ts
/**
* sessions_send sentinel tokens.
*
* Defines non-deliverable reply markers used by sessions_send and subagent completion delivery.
*/
/** Suppresses a subagent completion announcement. */
const ANNOUNCE_SKIP_TOKEN = "ANNOUNCE_SKIP";
/** Suppresses a direct reply delivery. */
const REPLY_SKIP_TOKEN = "REPLY_SKIP";
const NON_DELIVERABLE_REPLY_TOKENS = [
	ANNOUNCE_SKIP_TOKEN,
	REPLY_SKIP_TOKEN,
	require_tokens.SILENT_REPLY_TOKEN,
	require_tokens.HEARTBEAT_TOKEN
];
/** Returns true when text is exactly the announce-skip sentinel. */
function isAnnounceSkip(text) {
	return (text ?? "").trim() === ANNOUNCE_SKIP_TOKEN;
}
/** Returns true when text is exactly the reply-skip sentinel. */
function isReplySkip(text) {
	return (text ?? "").trim() === REPLY_SKIP_TOKEN;
}
/** Returns true when text is any non-deliverable sessions reply sentinel. */
function isNonDeliverableSessionsReply(text) {
	return NON_DELIVERABLE_REPLY_TOKENS.some((token) => require_tokens.isSilentReplyText(text, token));
}
//#endregion
//#region src/agents/subagent-announce-capture.ts
/**
* Helpers for capturing the latest subagent completion reply after a run ends.
*
* Completion output can lag behind lifecycle state, so callers can retry briefly
* before sending an empty or stale announcement.
*/
/** Reads subagent output repeatedly until non-empty text appears or the bounded wait expires. */
async function readLatestSubagentOutputWithRetryUsing(params) {
	const maxWaitMs = Math.max(0, Math.min(params.maxWaitMs, 15e3));
	let waitedMs = 0;
	let result;
	while (waitedMs < maxWaitMs) {
		result = await params.readSubagentOutput(params.sessionKey, params.outcome);
		if (result?.trim()) return result;
		const remainingMs = maxWaitMs - waitedMs;
		if (remainingMs <= 0) break;
		const sleepMs = Math.min(params.retryIntervalMs, remainingMs);
		await new Promise((resolve) => {
			setTimeout(resolve, sleepMs);
		});
		waitedMs += sleepMs;
	}
	return result;
}
/** Captures immediate output first, then optionally waits for a delayed completion reply. */
async function captureSubagentCompletionReplyUsing(params) {
	const immediate = await params.readSubagentOutput(params.sessionKey);
	if (immediate?.trim()) return immediate;
	if (params.waitForReply === false) return;
	return await readLatestSubagentOutputWithRetryUsing({
		sessionKey: params.sessionKey,
		maxWaitMs: params.maxWaitMs,
		retryIntervalMs: params.retryIntervalMs,
		readSubagentOutput: params.readSubagentOutput
	});
}
//#endregion
//#region src/agents/subagent-yield-output.ts
/**
* sessions_yield transcript detectors.
*
* Accepts provider-specific tool-call and tool-result shapes used by transcript repair and announce capture.
*/
function readToolName(value) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(value);
	if (!record) return;
	return require_string_readers.readTrimmedStringAlias(record, [
		"name",
		"toolName",
		"tool_name",
		"functionName",
		"function_name"
	]);
}
function isToolCallBlock(value) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(value);
	if (!record) return false;
	return record.type === "toolCall" || record.type === "tool_use" || record.type === "toolUse" || record.type === "functionCall" || record.type === "function_call";
}
/** Returns true when an assistant message requested the sessions_yield tool. */
function assistantCallsSessionsYield(message) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(message);
	if (record?.role !== "assistant" || !Array.isArray(record.content)) return false;
	return record.content.some((block) => isToolCallBlock(block) && readToolName(block) === "sessions_yield");
}
function parseJsonObject(text) {
	const trimmed = text.trim();
	if (!trimmed.startsWith("{")) return;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)((0, _gabrielvfonseca_normalization_core.safeParseJson)(trimmed));
}
function readStructuredToolPayload(content) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(content);
	if (record) return record;
	if (typeof content === "string") return parseJsonObject(content);
	if (!Array.isArray(content)) return;
	for (const block of content) {
		const blockRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(block);
		if (!blockRecord) continue;
		const text = blockRecord.text;
		if (typeof text !== "string") continue;
		const parsed = parseJsonObject(text);
		if (parsed) return parsed;
	}
}
/** Returns true when a tool result represents a completed sessions_yield handoff. */
function isSessionsYieldToolResult(message, previousAssistantCalledYield) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(message);
	if (!record || record.role !== "toolResult" && record.role !== "tool") return false;
	if (readToolName(record) === "sessions_yield") return true;
	if (!previousAssistantCalledYield) return false;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(record.details)?.status === "yielded") return true;
	return readStructuredToolPayload(record.content)?.status === "yielded";
}
//#endregion
//#region src/agents/subagent-announce-output.ts
/**
* Subagent completion output capture.
*
* Reads child session output, detects waiting states, and formats completion findings for announcements.
*/
const FAST_TEST_RETRY_INTERVAL_MS = 8;
const defaultSubagentAnnounceOutputDeps = {
	callGateway: require_call.callGateway,
	getRuntimeConfig: require_io.getRuntimeConfig,
	readSessionEntry: require_store.readSessionEntry,
	readSessionMessagesAsync: require_session_transcript_readers.readSessionMessagesAsync,
	resolveAgentIdFromSessionKey: require_session_key.resolveAgentIdFromSessionKey,
	resolveStorePath: require_paths.resolveStorePath
};
let subagentAnnounceOutputDeps = defaultSubagentAnnounceOutputDeps;
function isFastTestMode() {
	return process.env.OPERATOR_TEST_FAST === "1";
}
function withSubagentOutcomeTiming(outcome, timing) {
	const startedAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(timing.startedAt) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(outcome.startedAt);
	const endedAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(timing.endedAt) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumber)(outcome.endedAt);
	const nextTiming = {};
	if (typeof startedAt === "number") nextTiming.startedAt = startedAt;
	if (typeof endedAt === "number") nextTiming.endedAt = endedAt;
	if (typeof startedAt === "number" && typeof endedAt === "number") nextTiming.elapsedMs = Math.max(0, endedAt - startedAt);
	return {
		...outcome,
		...nextTiming
	};
}
function extractSubagentAssistantText(message) {
	if (!message || typeof message !== "object") return "";
	if (message.role !== "assistant") return "";
	const content = message.content;
	if (typeof content === "string") return require_chat_history_text.sanitizeTextContent(content);
	return require_chat_history_text.extractAssistantText(message) ?? "";
}
function countAssistantToolCalls(message) {
	if (!message || typeof message !== "object") return 0;
	const content = message.content;
	const contentToolCalls = Array.isArray(content) ? content.filter((block) => block && typeof block === "object" && (block.type === "toolCall" || block.type === "tool_use")).length : 0;
	const toolCalls = message.toolCalls ?? message.tool_calls;
	return contentToolCalls + (Array.isArray(toolCalls) ? toolCalls.length : 0);
}
function summarizeSubagentOutputHistory(messages) {
	const snapshot = {};
	let previousAssistantCalledYield = false;
	for (const message of messages) {
		if (!message || typeof message !== "object") continue;
		if (message.role === "assistant") {
			if (assistantCallsSessionsYield(message)) {
				snapshot.latestAssistantText = void 0;
				snapshot.latestSilentText = void 0;
				snapshot.waitingForContinuation = true;
				previousAssistantCalledYield = true;
				continue;
			}
			const text = extractSubagentAssistantText(message).trim();
			if (!text) {
				snapshot.latestToolCallCount = (snapshot.latestToolCallCount ?? 0) + countAssistantToolCalls(message);
				snapshot.waitingForContinuation = false;
				previousAssistantCalledYield = false;
				continue;
			}
			if (isAnnounceSkip(text) || require_tokens.isSilentReplyText(text, "NO_REPLY")) {
				snapshot.latestSilentText = text;
				snapshot.latestAssistantText = void 0;
				snapshot.waitingForContinuation = false;
				previousAssistantCalledYield = false;
				continue;
			}
			snapshot.latestSilentText = void 0;
			snapshot.latestAssistantText = text;
			snapshot.waitingForContinuation = false;
			previousAssistantCalledYield = false;
			continue;
		}
		if (isSessionsYieldToolResult(message, previousAssistantCalledYield)) {
			snapshot.latestAssistantText = void 0;
			snapshot.latestSilentText = void 0;
			snapshot.waitingForContinuation = true;
			previousAssistantCalledYield = false;
			continue;
		}
		previousAssistantCalledYield = false;
	}
	return snapshot;
}
function selectSubagentOutputText(snapshot) {
	if (snapshot.waitingForContinuation) return;
	if (snapshot.latestSilentText) return snapshot.latestSilentText;
	if (snapshot.latestAssistantText) return snapshot.latestAssistantText;
	if (snapshot.latestToolCallCount && snapshot.latestToolCallCount > 0) return `${snapshot.latestToolCallCount} tool call(s) made without visible output.`;
}
async function readSubagentOutput(sessionKey, _outcome, options) {
	let messages;
	if (options?.sessionFile) messages = await subagentAnnounceOutputDeps.readSessionMessagesAsync({
		sessionFile: options.sessionFile,
		sessionId: sessionKey
	}, {
		mode: "recent",
		maxMessages: 100,
		maxBytes: 1024 * 1024
	});
	const history = messages === void 0 ? await subagentAnnounceOutputDeps.callGateway({
		method: "chat.history",
		params: {
			sessionKey,
			limit: 100
		}
	}) : void 0;
	const selected = selectSubagentOutputText(summarizeSubagentOutputHistory(messages ?? (Array.isArray(history?.messages) ? history.messages : [])));
	if (selected?.trim()) return selected;
}
async function readLatestSubagentOutputWithRetry(params) {
	return await readLatestSubagentOutputWithRetryUsing({
		sessionKey: params.sessionKey,
		maxWaitMs: params.maxWaitMs,
		outcome: params.outcome,
		retryIntervalMs: isFastTestMode() ? FAST_TEST_RETRY_INTERVAL_MS : 100,
		readSubagentOutput
	});
}
async function waitForSubagentRunOutcome(runId, timeoutMs) {
	const waitMs = Math.max(0, Math.floor(timeoutMs));
	return await subagentAnnounceOutputDeps.callGateway({
		method: "agent.wait",
		params: {
			runId,
			timeoutMs: waitMs
		},
		timeoutMs: waitMs + 2e3
	});
}
function applySubagentWaitOutcome(params) {
	const next = {
		outcome: params.outcome,
		startedAt: params.startedAt,
		endedAt: params.endedAt
	};
	if (typeof params.wait?.startedAt === "number" && typeof next.startedAt !== "number") next.startedAt = params.wait.startedAt;
	if (typeof params.wait?.endedAt === "number" && typeof next.endedAt !== "number") next.endedAt = params.wait.endedAt;
	const waitError = typeof params.wait?.error === "string" ? params.wait.error : void 0;
	const terminalOutcome = require_agent_run_terminal_outcome.buildAgentRunTerminalOutcomeFromWaitResult(params.wait);
	let outcome = next.outcome;
	if (terminalOutcome?.status === "timeout") outcome = { status: "timeout" };
	else if (terminalOutcome?.reason === "aborted" || terminalOutcome?.reason === "cancelled") outcome = {
		status: "error",
		error: "subagent run terminated"
	};
	else if (terminalOutcome?.reason === "blocked" || terminalOutcome?.reason === "abandoned" || terminalOutcome?.reason === "failed") outcome = {
		status: "error",
		error: terminalOutcome.error ?? waitError
	};
	else if (terminalOutcome?.reason === "completed") outcome = { status: "ok" };
	next.outcome = outcome ? withSubagentOutcomeTiming(outcome, next) : void 0;
	return next;
}
async function captureSubagentCompletionReply(sessionKey, options) {
	return await captureSubagentCompletionReplyUsing({
		sessionKey,
		waitForReply: options?.waitForReply,
		maxWaitMs: isFastTestMode() ? 50 : 1500,
		retryIntervalMs: isFastTestMode() ? FAST_TEST_RETRY_INTERVAL_MS : 100,
		readSubagentOutput: async (nextSessionKey) => await readSubagentOutput(nextSessionKey, options?.outcome, { sessionFile: options?.sessionFile })
	});
}
function describeSubagentOutcome(outcome) {
	if (!outcome) return "unknown";
	if (outcome.status === "ok") return "ok";
	if (outcome.status === "timeout") return "timeout";
	if (outcome.status === "error") return outcome.error?.trim() ? `error: ${outcome.error.trim()}` : "error";
	return "unknown";
}
function formatChildResultData(resultText) {
	return require_sanitize_for_prompt.wrapPromptDataBlock({
		label: "Child result",
		text: resultText?.trim() || "(no output)"
	}) || "Child result: (no output)";
}
function selectChildCompletionResultText(child) {
	return (child.completion?.resultText ?? child.delivery?.payload?.frozenResultText ?? child.completion?.fallbackResultText ?? child.delivery?.payload?.fallbackFrozenResultText ?? child.frozenResultText ?? void 0)?.trim();
}
function buildChildCompletionFindings(children) {
	const sorted = [...children].toSorted((a, b) => {
		if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
		return (typeof a.endedAt === "number" ? a.endedAt : Number.MAX_SAFE_INTEGER) - (typeof b.endedAt === "number" ? b.endedAt : Number.MAX_SAFE_INTEGER);
	});
	const sections = [];
	for (const [index, child] of sorted.entries()) {
		const resultText = selectChildCompletionResultText(child);
		const outcome = describeSubagentOutcome(child.outcome);
		if (child.outcome?.status === "ok" && resultText && (isAnnounceSkip(resultText) || require_tokens.isSilentReplyText(resultText, "NO_REPLY"))) continue;
		const title = child.label?.trim() || child.task.trim() || child.childSessionKey.trim() || `child ${index + 1}`;
		const displayIndex = sections.length + 1;
		sections.push([
			`${displayIndex}. ${title}`,
			`status: ${outcome}`,
			formatChildResultData(resultText)
		].join("\n"));
	}
	if (sections.length === 0) return;
	return [
		"Child completion results:",
		"",
		...sections
	].join("\n\n");
}
function dedupeLatestChildCompletionRows(children) {
	const latestByChildSessionKey = /* @__PURE__ */ new Map();
	for (const child of children) {
		const existing = latestByChildSessionKey.get(child.childSessionKey);
		if (!existing || require_subagent_run_generation.compareSubagentRunGeneration(child, existing) > 0) latestByChildSessionKey.set(child.childSessionKey, child);
	}
	return [...latestByChildSessionKey.values()];
}
function filterCurrentDirectChildCompletionRows(children, params) {
	if (typeof params.getLatestSubagentRunByChildSessionKey !== "function") return children;
	return children.filter((child) => {
		const latest = params.getLatestSubagentRunByChildSessionKey?.(child.childSessionKey);
		if (!latest) return true;
		return latest.runId === child.runId && latest.requesterSessionKey === params.requesterSessionKey;
	});
}
function formatTokenCount(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "0";
	if (value >= 1e6) return `${(value / 1e6).toFixed(1)}m`;
	if (value >= 1e3) {
		const formattedThousands = (value / 1e3).toFixed(1);
		if (Number(formattedThousands) >= 1e3) return `${(value / 1e6).toFixed(1)}m`;
		return `${formattedThousands}k`;
	}
	return String(Math.round(value));
}
async function buildCompactAnnounceStatsLine(params) {
	const cfg = subagentAnnounceOutputDeps.getRuntimeConfig();
	const agentId = subagentAnnounceOutputDeps.resolveAgentIdFromSessionKey(params.sessionKey);
	const storePath = subagentAnnounceOutputDeps.resolveStorePath(cfg.session?.store, { agentId });
	let entry = subagentAnnounceOutputDeps.readSessionEntry(storePath, params.sessionKey);
	const tokenWaitAttempts = isFastTestMode() ? 1 : 3;
	for (let attempt = 0; attempt < tokenWaitAttempts; attempt += 1) {
		if (typeof entry?.inputTokens === "number" || typeof entry?.outputTokens === "number" || typeof entry?.totalTokens === "number") break;
		if (!isFastTestMode()) await new Promise((resolve) => {
			setTimeout(resolve, 150);
		});
		entry = subagentAnnounceOutputDeps.readSessionEntry(storePath, params.sessionKey);
	}
	const input = typeof entry?.inputTokens === "number" ? entry.inputTokens : 0;
	const output = typeof entry?.outputTokens === "number" ? entry.outputTokens : 0;
	const ioTotal = input + output;
	const promptCache = typeof entry?.totalTokens === "number" ? entry.totalTokens : void 0;
	const parts = [`runtime ${require_format_duration.formatDurationCompact(typeof params.startedAt === "number" && typeof params.endedAt === "number" ? Math.max(0, params.endedAt - params.startedAt) : void 0) ?? "n/a"}`, `tokens ${formatTokenCount(ioTotal)} (in ${formatTokenCount(input)} / out ${formatTokenCount(output)})`];
	if (typeof promptCache === "number" && promptCache > ioTotal) parts.push(`prompt/cache ${formatTokenCount(promptCache)}`);
	return `Stats: ${parts.join(" • ")}`;
}
const testing = { setDepsForTest(overrides) {
	subagentAnnounceOutputDeps = overrides ? {
		...defaultSubagentAnnounceOutputDeps,
		...overrides
	} : defaultSubagentAnnounceOutputDeps;
} };
if (process.env.VITEST || false) globalThis[Symbol.for("operator.subagentAnnounceOutputTestApi")] = testing;
//#endregion
//#region src/agents/announce-idempotency.ts
/** Build the persisted announce id for a child session/run pair. */
function buildAnnounceIdFromChildRun(params) {
	return `v1:${params.childSessionKey}:${params.childRunId}`;
}
/** Build the idempotency key used by announce delivery storage. */
function buildAnnounceIdempotencyKey(announceId) {
	return `announce:${announceId}`;
}
//#endregion
//#region src/agents/subagent-session-cleanup.ts
/** Deletes a child subagent session and optionally emits session-mode lifecycle hooks. */
async function deleteSubagentSessionForCleanup(params) {
	try {
		await params.callGateway({
			method: "sessions.delete",
			params: {
				key: params.childSessionKey,
				deleteTranscript: true,
				emitLifecycleHooks: params.spawnMode === "session"
			},
			timeoutMs: 1e4
		});
	} catch (error) {
		params.onError?.(error);
	}
}
//#endregion
Object.defineProperty(exports, "ANNOUNCE_SKIP_TOKEN", {
	enumerable: true,
	get: function() {
		return ANNOUNCE_SKIP_TOKEN;
	}
});
Object.defineProperty(exports, "REPLY_SKIP_TOKEN", {
	enumerable: true,
	get: function() {
		return REPLY_SKIP_TOKEN;
	}
});
Object.defineProperty(exports, "applySubagentWaitOutcome", {
	enumerable: true,
	get: function() {
		return applySubagentWaitOutcome;
	}
});
Object.defineProperty(exports, "buildAnnounceIdFromChildRun", {
	enumerable: true,
	get: function() {
		return buildAnnounceIdFromChildRun;
	}
});
Object.defineProperty(exports, "buildAnnounceIdempotencyKey", {
	enumerable: true,
	get: function() {
		return buildAnnounceIdempotencyKey;
	}
});
Object.defineProperty(exports, "buildChildCompletionFindings", {
	enumerable: true,
	get: function() {
		return buildChildCompletionFindings;
	}
});
Object.defineProperty(exports, "buildCompactAnnounceStatsLine", {
	enumerable: true,
	get: function() {
		return buildCompactAnnounceStatsLine;
	}
});
Object.defineProperty(exports, "captureSubagentCompletionReply", {
	enumerable: true,
	get: function() {
		return captureSubagentCompletionReply;
	}
});
Object.defineProperty(exports, "dedupeLatestChildCompletionRows", {
	enumerable: true,
	get: function() {
		return dedupeLatestChildCompletionRows;
	}
});
Object.defineProperty(exports, "deleteSubagentSessionForCleanup", {
	enumerable: true,
	get: function() {
		return deleteSubagentSessionForCleanup;
	}
});
Object.defineProperty(exports, "filterCurrentDirectChildCompletionRows", {
	enumerable: true,
	get: function() {
		return filterCurrentDirectChildCompletionRows;
	}
});
Object.defineProperty(exports, "isAnnounceSkip", {
	enumerable: true,
	get: function() {
		return isAnnounceSkip;
	}
});
Object.defineProperty(exports, "isNonDeliverableSessionsReply", {
	enumerable: true,
	get: function() {
		return isNonDeliverableSessionsReply;
	}
});
Object.defineProperty(exports, "isReplySkip", {
	enumerable: true,
	get: function() {
		return isReplySkip;
	}
});
Object.defineProperty(exports, "readLatestSubagentOutputWithRetry", {
	enumerable: true,
	get: function() {
		return readLatestSubagentOutputWithRetry;
	}
});
Object.defineProperty(exports, "readSubagentOutput", {
	enumerable: true,
	get: function() {
		return readSubagentOutput;
	}
});
Object.defineProperty(exports, "waitForSubagentRunOutcome", {
	enumerable: true,
	get: function() {
		return waitForSubagentRunOutcome;
	}
});
Object.defineProperty(exports, "withSubagentOutcomeTiming", {
	enumerable: true,
	get: function() {
		return withSubagentOutcomeTiming;
	}
});
