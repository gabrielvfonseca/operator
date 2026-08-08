const require_errors = require("./errors-BqS4bzom.cjs");
const require_boolean = require("./boolean-DrgQ-UMw.cjs");
const require_transcript_only_openclaw_assistant = require("./transcript-only-openclaw-assistant-MDSebHVo.cjs");
const require_retryable_network_errors = require("./retryable-network-errors-DWrtBuON.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_agent_run_terminal_outcome = require("./agent-run-terminal-outcome-BNehmvQh.cjs");
const require_chat_history_text = require("./chat-history-text-D9KfJyJC.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/agents/run-wait.ts
/**
* Gateway-backed agent run wait helpers.
* Normalizes run wait responses, reads the latest assistant reply, and drains
* pending run sets for tools that need synchronous completion semantics.
*/
function resolveRunWaitTimeoutMs(value) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.clampTimerTimeoutMs)((0, _gabrielvfonseca_normalization_core_number_coercion.parseFiniteNumber)(value) ?? 1) ?? 1;
}
function resolveRunWaitDeadlineAtMs(params) {
	if (params.deadlineAtMs !== void 0) return (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(params.deadlineAtMs) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(Date.now());
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(resolveRunWaitTimeoutMs(params.timeoutMs)) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(Date.now());
}
function normalizeAgentWaitResult(status, wait) {
	const stopReason = typeof wait?.stopReason === "string" ? wait.stopReason : void 0;
	const normalized = normalizeTerminalOutcomeForWait(require_agent_run_terminal_outcome.buildAgentRunTerminalOutcomeFromWaitResult({
		...wait,
		status
	}), status, wait?.livenessState);
	return {
		status: normalized.status,
		error: normalized.error,
		startedAt: typeof wait?.startedAt === "number" ? wait.startedAt : void 0,
		endedAt: typeof wait?.endedAt === "number" ? wait.endedAt : void 0,
		stopReason,
		livenessState: typeof wait?.livenessState === "string" ? wait.livenessState : void 0,
		yielded: wait?.yielded === true ? true : void 0,
		pendingError: wait?.pendingError === true ? true : void 0,
		timeoutPhase: require_agent_run_terminal_outcome.normalizeAgentRunTimeoutPhase(wait?.timeoutPhase),
		providerStarted: require_boolean.asBoolean(wait?.providerStarted)
	};
}
function normalizeTerminalOutcomeForWait(outcome, fallbackStatus, livenessState) {
	if (outcome?.reason === "hard_timeout") return {
		status: outcome.status,
		error: outcome.error
	};
	return require_agent_run_terminal_outcome.normalizeBlockedLivenessWaitStatus({
		status: outcome?.status ?? fallbackStatus,
		livenessState,
		error: outcome?.error
	});
}
const RECOVERABLE_AGENT_WAIT_ERROR_PATTERNS = [
	/gateway closed \(1006/i,
	/transport close/i,
	/connection loss/i,
	/connection closed/i,
	/gateway not connected/i,
	/no active .* listener/i,
	/socket hang up/i
];
/** Return true for transient gateway/transport failures that callers may retry. */
function isRecoverableAgentWaitError(error) {
	const message = error?.trim();
	if (!message) return false;
	if (message.includes("gateway timeout")) return false;
	return require_retryable_network_errors.hasRetryableConnectionErrorCode(message) || RECOVERABLE_AGENT_WAIT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}
function normalizePendingRunIds(runIds) {
	const seen = /* @__PURE__ */ new Set();
	for (const runId of runIds) {
		const normalized = runId.trim();
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
	}
	return [...seen];
}
function isWaitedReplyTranscriptArtifact(message) {
	return require_transcript_only_openclaw_assistant.isTranscriptOnlyOperatorAssistantMessage(message) || require_transcript_only_openclaw_assistant.isOperatorMessageToolMirrorAssistantMessage(message) || isInterSessionInputMessage(message);
}
function isInterSessionInputMessage(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return false;
	const provenance = message.provenance;
	return Boolean(provenance) && typeof provenance === "object" && !Array.isArray(provenance) && provenance.kind === "inter_session";
}
function isWaitedReplyTurnBoundary(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return false;
	return message.role === "user" || isInterSessionInputMessage(message);
}
function snapshotAssistantReply(message) {
	const text = require_chat_history_text.extractAssistantText(message);
	if (!text?.trim()) return;
	let fingerprint;
	try {
		fingerprint = JSON.stringify(message);
	} catch {
		fingerprint = text;
	}
	return {
		text,
		fingerprint
	};
}
function readTranscriptMessageSeq(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return;
	const meta = message["__openclaw"];
	if (!meta || typeof meta !== "object" || Array.isArray(meta)) return;
	return (0, _gabrielvfonseca_normalization_core_number_coercion.asPositiveSafeInteger)(meta.seq);
}
function readInternalSourceReplyMessageSeq(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return;
	const marker = message.operatorMessageToolMirror;
	if (!marker || typeof marker !== "object" || Array.isArray(marker)) return;
	return (0, _gabrielvfonseca_normalization_core_number_coercion.asPositiveSafeInteger)(marker.sourceMessageSeq);
}
function resolveLatestAssistantReplySnapshot(messages, opts) {
	let latestReply = {};
	const internalSourceReplies = [];
	let sawTranscriptArtifact = false;
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const candidate = messages[i];
		if (!candidate || typeof candidate !== "object") continue;
		if (opts?.stopAtTranscriptArtifact === true && isWaitedReplyTurnBoundary(candidate)) {
			const boundarySeq = readTranscriptMessageSeq(candidate);
			const currentInternalSourceReply = boundarySeq ? internalSourceReplies.find((reply) => reply.sourceMessageSeq !== void 0 && reply.sourceMessageSeq > boundarySeq) : void 0;
			if (currentInternalSourceReply) return currentInternalSourceReply.snapshot;
			if (!boundarySeq && internalSourceReplies.length > 0) sawTranscriptArtifact = true;
			internalSourceReplies.length = 0;
			break;
		}
		if (candidate.role !== "assistant") continue;
		if (opts?.stopAtTranscriptArtifact === true && require_transcript_only_openclaw_assistant.isOperatorInternalSourceReplyMirrorAssistantMessage(candidate)) {
			const snapshot = snapshotAssistantReply(candidate);
			const sourceMessageSeq = readInternalSourceReplyMessageSeq(candidate);
			if (snapshot) internalSourceReplies.push({
				snapshot,
				sourceMessageSeq
			});
			if (!sourceMessageSeq) sawTranscriptArtifact = true;
			continue;
		}
		if (isWaitedReplyTranscriptArtifact(candidate)) {
			if (opts?.stopAtTranscriptArtifact === true) sawTranscriptArtifact = true;
			continue;
		}
		const snapshot = snapshotAssistantReply(candidate);
		if (!snapshot) continue;
		if (opts?.stopAtTranscriptArtifact !== true) return snapshot;
		if (!latestReply.text) latestReply = snapshot;
	}
	if (opts?.stopAtTranscriptArtifact === true) {
		if (internalSourceReplies.length > 0) sawTranscriptArtifact = true;
		if (sawTranscriptArtifact) return {};
	}
	return latestReply;
}
function hasUpdatedAssistantReplySnapshot(latestReply, baseline) {
	if (!latestReply.text) return false;
	if (!baseline) return true;
	if (baseline.fingerprint !== void 0) return latestReply.fingerprint !== baseline.fingerprint;
	if (baseline.text !== void 0) return latestReply.text !== baseline.text;
	return true;
}
/** Read the latest non-tool assistant message for a session. */
async function readLatestAssistantReplySnapshot(params) {
	const history = await (params.callGateway ?? require_call.callGateway)({
		method: "chat.history",
		params: {
			sessionKey: params.sessionKey,
			limit: params.limit ?? 50
		}
	});
	return resolveLatestAssistantReplySnapshot(require_chat_history_text.stripToolMessages(Array.isArray(history?.messages) ? history.messages : []), { stopAtTranscriptArtifact: params.stopAtTranscriptArtifact });
}
/** Read only the latest assistant text for call sites that do not need fingerprints. */
async function readLatestAssistantReply(params) {
	return (await readLatestAssistantReplySnapshot({
		sessionKey: params.sessionKey,
		limit: params.limit,
		callGateway: params.callGateway
	})).text;
}
/** Wait for one agent run through the gateway and normalize timeout/error states. */
async function waitForAgentRun(params) {
	const timeoutMs = resolveRunWaitTimeoutMs(params.timeoutMs);
	try {
		const wait = await (params.callGateway ?? require_call.callGateway)({
			method: "agent.wait",
			params: {
				runId: params.runId,
				timeoutMs
			},
			timeoutMs: (0, _gabrielvfonseca_normalization_core_number_coercion.addTimerTimeoutGraceMs)(timeoutMs, 2e3)
		});
		if (wait?.status === "timeout") return normalizeAgentWaitResult("timeout", wait);
		if (wait?.status === "pending") return normalizeAgentWaitResult("pending", wait);
		if (wait?.status === "error") return normalizeAgentWaitResult("error", wait);
		return normalizeAgentWaitResult("ok", wait);
	} catch (err) {
		const error = require_errors.formatErrorMessage(err);
		return {
			status: error.includes("gateway timeout") ? "timeout" : "error",
			error
		};
	}
}
/** Wait for a run and return a reply only when it differs from the supplied baseline. */
async function waitForAgentRunAndReadUpdatedAssistantReply(params) {
	const wait = await waitForAgentRun({
		runId: params.runId,
		timeoutMs: params.timeoutMs,
		callGateway: params.callGateway
	});
	if (wait.status !== "ok") return wait;
	const latestReply = await readLatestAssistantReplySnapshot({
		sessionKey: params.sessionKey,
		limit: params.limit,
		stopAtTranscriptArtifact: true,
		callGateway: params.callGateway
	});
	const replyText = hasUpdatedAssistantReplySnapshot(latestReply, params.baseline) ? latestReply.text : void 0;
	return {
		...wait,
		replyText
	};
}
/** Wait until the current and newly spawned pending run IDs are drained or timed out. */
async function waitForAgentRunsToDrain(params) {
	const deadlineAtMs = resolveRunWaitDeadlineAtMs(params);
	let pendingRunIds = new Set(normalizePendingRunIds(params.initialPendingRunIds ?? params.getPendingRunIds()));
	while (pendingRunIds.size > 0 && Date.now() < deadlineAtMs) {
		const remainingMs = Math.max(1, deadlineAtMs - Date.now());
		await Promise.allSettled([...pendingRunIds].map((runId) => waitForAgentRun({
			runId,
			timeoutMs: remainingMs,
			callGateway: params.callGateway
		})));
		pendingRunIds = new Set(normalizePendingRunIds(params.getPendingRunIds()));
	}
	return {
		timedOut: pendingRunIds.size > 0,
		pendingRunIds: [...pendingRunIds],
		deadlineAtMs
	};
}
//#endregion
Object.defineProperty(exports, "hasUpdatedAssistantReplySnapshot", {
	enumerable: true,
	get: function() {
		return hasUpdatedAssistantReplySnapshot;
	}
});
Object.defineProperty(exports, "isRecoverableAgentWaitError", {
	enumerable: true,
	get: function() {
		return isRecoverableAgentWaitError;
	}
});
Object.defineProperty(exports, "readLatestAssistantReply", {
	enumerable: true,
	get: function() {
		return readLatestAssistantReply;
	}
});
Object.defineProperty(exports, "readLatestAssistantReplySnapshot", {
	enumerable: true,
	get: function() {
		return readLatestAssistantReplySnapshot;
	}
});
Object.defineProperty(exports, "waitForAgentRun", {
	enumerable: true,
	get: function() {
		return waitForAgentRun;
	}
});
Object.defineProperty(exports, "waitForAgentRunAndReadUpdatedAssistantReply", {
	enumerable: true,
	get: function() {
		return waitForAgentRunAndReadUpdatedAssistantReply;
	}
});
Object.defineProperty(exports, "waitForAgentRunsToDrain", {
	enumerable: true,
	get: function() {
		return waitForAgentRunsToDrain;
	}
});
