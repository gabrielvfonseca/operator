const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_diagnostic = require("./diagnostic-Blh06VbF.cjs");
const require_diagnostic_run_activity = require("./diagnostic-run-activity-DjuaoKPQ.cjs");
const require_diagnostic_runtime = require("./diagnostic-runtime-DOIuSHus.cjs");
const require_reply_run_registry = require("./reply-run-registry-BN03YRe9.cjs");
const require_run_state = require("./run-state-lPLPf1ME.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/embedded-agent-runner/session-file-key.ts
/**
* Resolves stable keys for embedded session transcript files.
*/
function resolveEmbeddedSessionFileKey(sessionFile) {
	const resolvedSessionFile = node_path.default.resolve(sessionFile);
	const realpathSync = node_fs.default.realpathSync.native ?? node_fs.default.realpathSync;
	try {
		return realpathSync(resolvedSessionFile);
	} catch {}
	const sessionDir = node_path.default.dirname(resolvedSessionFile);
	try {
		return node_path.default.join(realpathSync(sessionDir), node_path.default.basename(resolvedSessionFile));
	} catch {
		return resolvedSessionFile;
	}
}
//#endregion
//#region src/agents/embedded-agent-runner/runs.ts
/**
* Manages active embedded-agent run handles, queues, aborts, and waiters.
*/
var runs_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	abortAndDrainEmbeddedAgentRun: () => abortAndDrainEmbeddedAgentRun,
	abortEmbeddedAgentRun: () => abortEmbeddedAgentRun,
	clearActiveEmbeddedRun: () => clearActiveEmbeddedRun,
	clearEmbeddedAgentRunAbortabilityForRunId: () => clearEmbeddedAgentRunAbortabilityForRunId,
	formatEmbeddedAgentQueueFailureSummary: () => formatEmbeddedAgentQueueFailureSummary,
	getActiveEmbeddedRunCount: () => require_run_state.getActiveEmbeddedRunCount,
	getActiveEmbeddedRunSnapshot: () => getActiveEmbeddedRunSnapshot,
	isEmbeddedAgentRunAbortableForCompaction: () => isEmbeddedAgentRunAbortableForCompaction,
	isEmbeddedAgentRunAbortableForRunId: () => isEmbeddedAgentRunAbortableForRunId,
	isEmbeddedAgentRunActive: () => isEmbeddedAgentRunActive,
	isEmbeddedAgentRunHandleActive: () => isEmbeddedAgentRunHandleActive,
	isEmbeddedAgentRunStreaming: () => isEmbeddedAgentRunStreaming,
	isEmbeddedRunAbandoned: () => isEmbeddedRunAbandoned,
	listActiveEmbeddedRunSessionIds: () => require_run_state.listActiveEmbeddedRunSessionIds,
	listActiveEmbeddedRunSessionKeys: () => require_run_state.listActiveEmbeddedRunSessionKeys,
	markActiveEmbeddedRunAbandoned: () => markActiveEmbeddedRunAbandoned,
	queueEmbeddedAgentMessage: () => queueEmbeddedAgentMessage,
	queueEmbeddedAgentMessageWithOutcome: () => queueEmbeddedAgentMessageWithOutcome,
	queueEmbeddedAgentMessageWithOutcomeAsync: () => queueEmbeddedAgentMessageWithOutcomeAsync,
	resolveActiveEmbeddedRunHandleSessionId: () => resolveActiveEmbeddedRunHandleSessionId,
	resolveActiveEmbeddedRunHandleSessionIdBySessionFile: () => resolveActiveEmbeddedRunHandleSessionIdBySessionFile,
	resolveActiveEmbeddedRunSessionId: () => require_run_state.resolveActiveEmbeddedRunSessionId,
	resolveActiveEmbeddedRunSessionIdBySessionFile: () => resolveActiveEmbeddedRunSessionIdBySessionFile,
	resolveEmbeddedAgentReplyRunPhase: () => resolveEmbeddedAgentReplyRunPhase,
	retainEmbeddedAgentRunAbortabilityForRunId: () => retainEmbeddedAgentRunAbortabilityForRunId,
	setActiveEmbeddedRun: () => setActiveEmbeddedRun,
	updateActiveEmbeddedRunSessionFile: () => updateActiveEmbeddedRunSessionFile,
	updateActiveEmbeddedRunSnapshot: () => updateActiveEmbeddedRunSnapshot,
	waitForActiveEmbeddedRuns: () => waitForActiveEmbeddedRuns,
	waitForEmbeddedAgentRunEnd: () => waitForEmbeddedAgentRunEnd
});
function createQueueFailureOutcome(sessionId, reason, errorMessage) {
	return {
		queued: false,
		sessionId,
		reason,
		gatewayHealth: "live",
		...errorMessage ? { errorMessage } : {}
	};
}
function formatEmbeddedAgentQueueFailureSummary(outcome) {
	if (outcome.queued) return;
	const errorPart = outcome.errorMessage ? ` error=${outcome.errorMessage}` : "";
	return `queue_message_failed reason=${outcome.reason} sessionId=${outcome.sessionId} gatewayHealth=${outcome.gatewayHealth}${errorPart}`;
}
function setActiveRunSessionKey(sessionKey, sessionId) {
	const normalizedSessionKey = sessionKey?.trim();
	if (!normalizedSessionKey) return;
	require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.set(normalizedSessionKey, sessionId);
}
function clearActiveRunSessionKeys(sessionId, sessionKey) {
	const normalizedSessionKey = sessionKey?.trim();
	if (normalizedSessionKey) {
		if (require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.get(normalizedSessionKey) === sessionId) require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.delete(normalizedSessionKey);
		return;
	}
	for (const [key, activeSessionId] of require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY) if (activeSessionId === sessionId) require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.delete(key);
}
function setActiveRunSessionFile(sessionFile, sessionId) {
	if (!sessionFile?.trim()) return;
	require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.set(resolveEmbeddedSessionFileKey(sessionFile), sessionId);
}
function clearEmbeddedRunAbandonmentBySessionId(sessionId) {
	const abandonedRun = require_run_state.ABANDONED_EMBEDDED_RUNS_BY_SESSION_ID.get(sessionId);
	if (!abandonedRun) return;
	require_run_state.ABANDONED_EMBEDDED_RUNS_BY_SESSION_ID.delete(sessionId);
	const normalizedSessionKey = abandonedRun.sessionKey?.trim();
	if (normalizedSessionKey && require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY.get(normalizedSessionKey) === sessionId) require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY.delete(normalizedSessionKey);
	const normalizedSessionFile = abandonedRun.sessionFile?.trim();
	if (normalizedSessionFile) {
		const sessionFileKey = resolveEmbeddedSessionFileKey(normalizedSessionFile);
		if (require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE.get(sessionFileKey) === sessionId) require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE.delete(sessionFileKey);
	}
}
function clearEmbeddedRunAbandonmentBySessionKey(sessionKey) {
	const normalizedSessionKey = sessionKey?.trim();
	if (!normalizedSessionKey) return;
	const sessionId = require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY.get(normalizedSessionKey);
	if (sessionId) clearEmbeddedRunAbandonmentBySessionId(sessionId);
}
function clearEmbeddedRunAbandonmentBySessionFile(sessionFile) {
	const normalizedSessionFile = sessionFile?.trim();
	if (!normalizedSessionFile) return;
	const sessionFileKey = resolveEmbeddedSessionFileKey(normalizedSessionFile);
	const sessionId = require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE.get(sessionFileKey);
	if (sessionId) clearEmbeddedRunAbandonmentBySessionId(sessionId);
}
function clearEmbeddedRunAbandonment(params) {
	const normalizedSessionId = params.sessionId?.trim();
	if (normalizedSessionId) clearEmbeddedRunAbandonmentBySessionId(normalizedSessionId);
	clearEmbeddedRunAbandonmentBySessionKey(params.sessionKey);
	clearEmbeddedRunAbandonmentBySessionFile(params.sessionFile);
}
function markEmbeddedRunAbandoned(params) {
	const sessionId = params.sessionId.trim();
	if (!sessionId) return;
	clearEmbeddedRunAbandonment({
		sessionId,
		sessionKey: params.sessionKey,
		sessionFile: params.sessionFile
	});
	const abandonedRun = {
		sessionId,
		abandonedAtMs: Date.now(),
		reason: params.reason,
		...params.sessionKey?.trim() ? { sessionKey: params.sessionKey.trim() } : {},
		...params.sessionFile?.trim() ? { sessionFile: params.sessionFile.trim() } : {}
	};
	require_run_state.ABANDONED_EMBEDDED_RUNS_BY_SESSION_ID.set(sessionId, abandonedRun);
	if (abandonedRun.sessionKey) require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY.set(abandonedRun.sessionKey, sessionId);
	if (abandonedRun.sessionFile) require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE.set(resolveEmbeddedSessionFileKey(abandonedRun.sessionFile), sessionId);
}
function markActiveEmbeddedRunAbandoned(params) {
	const sessionId = params.sessionId.trim();
	if (!sessionId || require_run_state.ACTIVE_EMBEDDED_RUNS.get(sessionId) !== params.handle) return false;
	markEmbeddedRunAbandoned(params);
	return true;
}
function isEmbeddedRunAbandoned(params) {
	const normalizedSessionId = params.sessionId?.trim();
	if (normalizedSessionId && require_run_state.ABANDONED_EMBEDDED_RUNS_BY_SESSION_ID.has(normalizedSessionId)) return true;
	const normalizedSessionKey = params.sessionKey?.trim();
	if (normalizedSessionKey && require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY.has(normalizedSessionKey)) return true;
	const normalizedSessionFile = params.sessionFile?.trim();
	return Boolean(normalizedSessionFile && require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE.has(resolveEmbeddedSessionFileKey(normalizedSessionFile)));
}
function clearActiveRunSessionFiles(sessionId, sessionFile) {
	const normalizedSessionFile = sessionFile?.trim();
	if (normalizedSessionFile) {
		const sessionFileKey = resolveEmbeddedSessionFileKey(normalizedSessionFile);
		if (require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.get(sessionFileKey) === sessionId) require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.delete(sessionFileKey);
	}
	for (const [sessionFileKey, activeSessionId] of require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE) if (activeSessionId === sessionId) require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.delete(sessionFileKey);
}
/**
* @deprecated Use queueEmbeddedAgentMessageWithOutcomeAsync for delivery decisions.
* This boolean helper only reports immediate queue eligibility; it cannot surface
* async runtime rejection from the active run.
*/
function queueEmbeddedAgentMessage(sessionId, text, options) {
	return queueEmbeddedAgentMessageWithOutcome(sessionId, text, options).queued;
}
/**
* @deprecated Prefer queueEmbeddedAgentMessageWithOutcomeAsync when callers need to
* know whether steering was accepted. This sync helper is fire-and-forget after
* initial eligibility and only logs later runtime rejection.
*/
function queueEmbeddedAgentMessageWithOutcome(sessionId, text, options) {
	const prepared = prepareEmbeddedAgentQueueMessage(sessionId, text, options);
	if (prepared.kind === "complete") return prepared.outcome;
	require_diagnostic.logMessageQueued({
		sessionId,
		source: "embedded-agent-runner"
	});
	prepared.handle.queueMessage(text, options ?? { steeringMode: "all" }).catch((err) => {
		require_diagnostic_runtime.diagnosticLogger.debug(`queue message rejected after enqueue: sessionId=${sessionId} err=${formatQueueError(err)}`);
	});
	return {
		queued: true,
		sessionId,
		target: "embedded_run",
		gatewayHealth: "live",
		enqueuedAtMs: Date.now()
	};
}
function formatQueueError(err) {
	return err instanceof Error ? err.message : String(err);
}
function isEmbeddedQueueHandleMessageInjectable(sessionId, handle) {
	try {
		return handle.isStopped === void 0 ? handle.isStreaming() : !handle.isStopped();
	} catch (err) {
		require_diagnostic_runtime.diagnosticLogger.warn(`queue message failed: sessionId=${sessionId} reason=injectable_check_failed err=${String(err)}`);
		return false;
	}
}
function isEmbeddedRunHandleAbortable(sessionId, handle) {
	try {
		return handle.isAbortable?.() !== false;
	} catch (err) {
		require_diagnostic_runtime.diagnosticLogger.warn(`abort failed: sessionId=${sessionId} reason=abortable_check_failed err=${String(err)}`);
		return false;
	}
}
function isEmbeddedAgentRunAbortableForRunId(runId) {
	const normalizedRunId = runId.trim();
	if (!normalizedRunId) return true;
	const handle = require_run_state.ACTIVE_EMBEDDED_RUNS_BY_RUN_ID.get(normalizedRunId);
	return handle ? isEmbeddedRunHandleAbortable(normalizedRunId, handle) : true;
}
function clearEmbeddedAgentRunAbortabilityForRunId(runId) {
	const normalizedRunId = runId.trim();
	if (normalizedRunId) {
		require_run_state.ACTIVE_EMBEDDED_RUNS_BY_RUN_ID.delete(normalizedRunId);
		require_run_state.RETAINED_EMBEDDED_RUN_ABORTABILITY_RUN_IDS.delete(normalizedRunId);
	}
}
function retainEmbeddedAgentRunAbortabilityForRunId(runId) {
	const normalizedRunId = runId.trim();
	if (normalizedRunId) require_run_state.RETAINED_EMBEDDED_RUN_ABORTABILITY_RUN_IDS.add(normalizedRunId);
}
function clearEmbeddedRunAbortability(handle, opts) {
	if (!handle.runId || require_run_state.ACTIVE_EMBEDDED_RUNS_BY_RUN_ID.get(handle.runId) !== handle) return;
	if (opts?.retainFinalizing && require_run_state.RETAINED_EMBEDDED_RUN_ABORTABILITY_RUN_IDS.has(handle.runId) && !isEmbeddedRunHandleAbortable(handle.runId, handle)) return;
	require_run_state.ACTIVE_EMBEDDED_RUNS_BY_RUN_ID.delete(handle.runId);
}
async function queueEmbeddedAgentMessageWithOutcomeAsync(sessionId, text, options) {
	const prepared = prepareEmbeddedAgentQueueMessage(sessionId, text, options);
	if (prepared.kind === "complete") return prepared.outcome;
	try {
		const enqueuedAtMs = Date.now();
		await prepared.handle.queueMessage(text, options ?? { steeringMode: "all" });
		const deliveredAtMs = options?.waitForTranscriptCommit ? Date.now() : void 0;
		require_diagnostic.logMessageQueued({
			sessionId,
			source: "embedded-agent-runner"
		});
		return {
			queued: true,
			sessionId,
			target: "embedded_run",
			gatewayHealth: "live",
			...deliveredAtMs !== void 0 ? { deliveredAtMs } : {},
			enqueuedAtMs
		};
	} catch (err) {
		const errorMessage = formatQueueError(err);
		require_diagnostic_runtime.diagnosticLogger.debug(`queue message rejected: sessionId=${sessionId} err=${errorMessage}`);
		return createQueueFailureOutcome(sessionId, "runtime_rejected", errorMessage);
	}
}
function prepareEmbeddedAgentQueueMessage(sessionId, text, options) {
	const handle = require_run_state.ACTIVE_EMBEDDED_RUNS.get(sessionId);
	if (!handle) {
		if (require_reply_run_registry.isReplyRunEvidenceStaleBySessionId(sessionId)) {
			require_diagnostic_runtime.diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=stale_run`);
			return {
				kind: "complete",
				outcome: createQueueFailureOutcome(sessionId, "stale_run")
			};
		}
		if (options?.waitForTranscriptCommit === true) {
			require_diagnostic_runtime.diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=transcript_commit_wait_unsupported`);
			return {
				kind: "complete",
				outcome: createQueueFailureOutcome(sessionId, "transcript_commit_wait_unsupported")
			};
		}
		if (require_reply_run_registry.queueReplyRunMessage(sessionId, text, options)) {
			require_diagnostic.logMessageQueued({
				sessionId,
				source: "embedded-agent-runner"
			});
			return {
				kind: "complete",
				outcome: {
					queued: true,
					sessionId,
					target: "reply_run",
					gatewayHealth: "live",
					enqueuedAtMs: Date.now()
				}
			};
		}
		require_diagnostic_runtime.diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=no_active_run`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "no_active_run")
		};
	}
	if (!isEmbeddedQueueHandleMessageInjectable(sessionId, handle)) {
		require_diagnostic_runtime.diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=not_streaming`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "not_streaming")
		};
	}
	const activity = require_diagnostic_run_activity.getDiagnosticSessionActivitySnapshot({ sessionId });
	if (typeof activity.lastProgressAgeMs === "number" && activity.lastProgressAgeMs > require_diagnostic_run_activity.resolveRunStaleThresholdMs(activity)) {
		require_diagnostic_runtime.diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=stale_run`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "stale_run")
		};
	}
	if (handle.isCompacting()) {
		require_diagnostic_runtime.diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=compacting`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "compacting")
		};
	}
	if (options?.waitForTranscriptCommit === true && handle.supportsTranscriptCommitWait !== true) {
		require_diagnostic_runtime.diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=transcript_commit_wait_unsupported`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "transcript_commit_wait_unsupported")
		};
	}
	const deliveryModeMismatch = require_reply_run_registry.resolveReplyBackendQueueMessageMismatch(handle, options);
	if (deliveryModeMismatch) {
		require_diagnostic_runtime.diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=${deliveryModeMismatch}`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, deliveryModeMismatch)
		};
	}
	return {
		kind: "embedded_run",
		handle
	};
}
function abortEmbeddedAgentRun(sessionId, opts) {
	if (typeof sessionId === "string" && sessionId.length > 0) {
		const handle = require_run_state.ACTIVE_EMBEDDED_RUNS.get(sessionId);
		if (!handle) {
			if (require_reply_run_registry.abortReplyRunBySessionId(sessionId)) return true;
			require_diagnostic_runtime.diagnosticLogger.debug(`abort failed: sessionId=${sessionId} reason=no_active_run`);
			return false;
		}
		if (!isEmbeddedRunHandleAbortable(sessionId, handle)) {
			require_diagnostic_runtime.diagnosticLogger.debug(`abort failed: sessionId=${sessionId} reason=not_abortable`);
			return false;
		}
		require_diagnostic_runtime.diagnosticLogger.debug(`aborting run: sessionId=${sessionId}`);
		try {
			handle.abort(opts?.reason);
		} catch (err) {
			require_diagnostic_runtime.diagnosticLogger.warn(`abort failed: sessionId=${sessionId} err=${String(err)}`);
			return false;
		}
		return true;
	}
	const abortActiveEmbeddedRunHandles = (params) => {
		let aborted = false;
		for (const [id, handle] of require_run_state.ACTIVE_EMBEDDED_RUNS) {
			if (params.skipSessionIds?.has(id)) continue;
			if (!params.shouldAbort(handle)) continue;
			if (!isEmbeddedRunHandleAbortable(id, handle)) continue;
			require_diagnostic_runtime.diagnosticLogger.debug(params.formatDebugMessage(id));
			try {
				handle.abort(opts?.reason);
				aborted = true;
			} catch (err) {
				require_diagnostic_runtime.diagnosticLogger.warn(`abort failed: sessionId=${id} err=${String(err)}`);
			}
		}
		return aborted;
	};
	const mode = opts?.mode;
	if (mode === "compacting") {
		const replyOwnedSessionIds = new Set(require_reply_run_registry.listActiveReplyRunSessionIds());
		const replyAborted = require_reply_run_registry.abortActiveReplyRuns({
			mode,
			onAbortError: (id, err) => require_diagnostic_runtime.diagnosticLogger.warn(`abort failed: sessionId=${id} owner=reply_run err=${String(err)}`)
		});
		const aborted = abortActiveEmbeddedRunHandles({
			shouldAbort: (handle) => handle.isCompacting(),
			formatDebugMessage: (id) => `aborting compacting run: sessionId=${id}`,
			skipSessionIds: replyOwnedSessionIds
		});
		return replyAborted || aborted;
	}
	if (mode === "all") {
		const replyOwnedSessionIds = new Set(require_reply_run_registry.listActiveReplyRunSessionIds());
		const replyAborted = require_reply_run_registry.abortActiveReplyRuns({
			mode,
			onAbortError: (id, err) => require_diagnostic_runtime.diagnosticLogger.warn(`abort failed: sessionId=${id} owner=reply_run err=${String(err)}`)
		});
		const aborted = abortActiveEmbeddedRunHandles({
			shouldAbort: () => true,
			formatDebugMessage: (id) => `aborting run: sessionId=${id}`,
			skipSessionIds: replyOwnedSessionIds
		});
		return replyAborted || aborted;
	}
	return false;
}
function isEmbeddedAgentRunActive(sessionId) {
	const active = require_run_state.ACTIVE_EMBEDDED_RUNS.has(sessionId) || require_reply_run_registry.isReplyRunActiveForSessionId(sessionId);
	if (active) require_diagnostic_runtime.diagnosticLogger.debug(`run active check: sessionId=${sessionId} active=true`);
	return active;
}
function resolveEmbeddedAgentReplyRunPhase(sessionId) {
	return require_reply_run_registry.resolveReplyRunPhaseForSessionId(sessionId);
}
function isEmbeddedAgentRunHandleActive(sessionId) {
	const active = require_run_state.ACTIVE_EMBEDDED_RUNS.has(sessionId);
	if (active) require_diagnostic_runtime.diagnosticLogger.debug(`run handle active check: sessionId=${sessionId} active=true`);
	return active;
}
function isEmbeddedAgentRunAbortableForCompaction(sessionId) {
	const active = require_run_state.ACTIVE_EMBEDDED_RUNS.get(sessionId) ? true : require_reply_run_registry.isReplyRunAbortableForCompaction(sessionId);
	if (active) require_diagnostic_runtime.diagnosticLogger.debug(`run compact coordination check: sessionId=${sessionId} active=true`);
	return active;
}
function isEmbeddedAgentRunStreaming(sessionId) {
	const handle = require_run_state.ACTIVE_EMBEDDED_RUNS.get(sessionId);
	if (!handle) return require_reply_run_registry.isReplyRunStreamingForSessionId(sessionId);
	return handle.isStreaming();
}
function resolveActiveEmbeddedRunHandleSessionId(sessionKey) {
	const normalizedSessionKey = sessionKey.trim();
	if (!normalizedSessionKey) return;
	return require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.get(normalizedSessionKey);
}
function resolveActiveEmbeddedRunHandleSessionIdBySessionFile(sessionFile) {
	const normalizedSessionFile = sessionFile.trim();
	if (!normalizedSessionFile) return;
	return require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.get(resolveEmbeddedSessionFileKey(normalizedSessionFile));
}
function resolveActiveEmbeddedRunSessionIdBySessionFile(sessionFile) {
	return resolveActiveEmbeddedRunHandleSessionIdBySessionFile(sessionFile);
}
function getActiveEmbeddedRunSnapshot(sessionId) {
	return require_run_state.ACTIVE_EMBEDDED_RUN_SNAPSHOTS.get(sessionId);
}
/**
* Wait for active embedded runs to drain.
*
* Used during restarts so in-flight runs can release session write locks before
* the next lifecycle starts. If no timeout is passed, waits indefinitely.
*/
async function waitForActiveEmbeddedRuns(timeoutMs, opts) {
	const pollMs = (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(opts?.pollMs ?? 250, 250, 10);
	if (timeoutMs !== void 0 && timeoutMs <= 0) return { drained: require_run_state.getActiveEmbeddedRunCount() === 0 };
	const maxWaitMs = typeof timeoutMs === "number" && Number.isFinite(timeoutMs) ? Math.max(pollMs, Math.floor(timeoutMs)) : void 0;
	const startedAt = Date.now();
	while (true) {
		if (require_run_state.getActiveEmbeddedRunCount() === 0) return { drained: true };
		const elapsedMs = Date.now() - startedAt;
		if (maxWaitMs !== void 0 && elapsedMs >= maxWaitMs) {
			require_diagnostic_runtime.diagnosticLogger.warn(`wait for active embedded runs timed out: activeRuns=${require_run_state.getActiveEmbeddedRunCount()} timeoutMs=${maxWaitMs}`);
			return { drained: false };
		}
		await new Promise((resolve) => {
			setTimeout(resolve, pollMs);
		});
	}
}
function waitForEmbeddedAgentRunEnd(sessionId, timeoutMs = 15e3) {
	if (!sessionId) return Promise.resolve(true);
	if (!require_run_state.ACTIVE_EMBEDDED_RUNS.has(sessionId)) return require_reply_run_registry.waitForReplyRunEndBySessionId(sessionId, timeoutMs);
	require_diagnostic_runtime.diagnosticLogger.debug(`waiting for run end: sessionId=${sessionId} timeoutMs=${timeoutMs}`);
	return new Promise((resolve) => {
		const waiters = require_run_state.EMBEDDED_RUN_WAITERS.get(sessionId) ?? /* @__PURE__ */ new Set();
		const waiter = {
			resolve,
			timer: setTimeout(() => {
				waiters.delete(waiter);
				if (waiters.size === 0) require_run_state.EMBEDDED_RUN_WAITERS.delete(sessionId);
				require_diagnostic_runtime.diagnosticLogger.warn(`wait timeout: sessionId=${sessionId} timeoutMs=${timeoutMs}`);
				resolve(false);
			}, (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(timeoutMs, 100, 100))
		};
		waiters.add(waiter);
		require_run_state.EMBEDDED_RUN_WAITERS.set(sessionId, waiters);
		if (!require_run_state.ACTIVE_EMBEDDED_RUNS.has(sessionId)) {
			waiters.delete(waiter);
			if (waiters.size === 0) require_run_state.EMBEDDED_RUN_WAITERS.delete(sessionId);
			clearTimeout(waiter.timer);
			resolve(true);
		}
	});
}
async function abortAndDrainEmbeddedAgentRun(params) {
	const settleMs = params.settleMs ?? 15e3;
	const expiredReplyRun = params.reason === "stuck_recovery" && require_reply_run_registry.expireStaleReplyRunBySessionId(params.sessionId, "stuck_recovery");
	if (expiredReplyRun && !require_run_state.ACTIVE_EMBEDDED_RUNS.has(params.sessionId)) {
		await new Promise((resolve) => {
			setImmediate(resolve);
		});
		return {
			aborted: true,
			drained: await waitForEmbeddedAgentRunEnd(params.sessionId, settleMs),
			forceCleared: false
		};
	}
	const aborted = abortEmbeddedAgentRun(params.sessionId) || expiredReplyRun;
	const drained = aborted ? await waitForEmbeddedAgentRunEnd(params.sessionId, settleMs) : false;
	return {
		aborted,
		drained,
		forceCleared: params.forceClear === true && (!aborted || !drained) ? forceClearEmbeddedAgentRun(params.sessionId, params.sessionKey, params.reason) : false
	};
}
function notifyEmbeddedRunEnded(sessionId) {
	const waiters = require_run_state.EMBEDDED_RUN_WAITERS.get(sessionId);
	if (!waiters || waiters.size === 0) return;
	require_run_state.EMBEDDED_RUN_WAITERS.delete(sessionId);
	require_diagnostic_runtime.diagnosticLogger.debug(`notifying waiters: sessionId=${sessionId} waiterCount=${waiters.size}`);
	for (const waiter of waiters) {
		clearTimeout(waiter.timer);
		waiter.resolve(true);
	}
}
function setActiveEmbeddedRun(sessionId, handle, sessionKey, sessionFile) {
	const previousHandle = require_run_state.ACTIVE_EMBEDDED_RUNS.get(sessionId);
	const wasActive = previousHandle !== void 0;
	if (previousHandle) clearEmbeddedRunAbortability(previousHandle, { retainFinalizing: true });
	clearEmbeddedRunAbandonment({
		sessionId,
		sessionKey,
		sessionFile
	});
	require_run_state.ACTIVE_EMBEDDED_RUNS.set(sessionId, handle);
	if (handle.runId) require_run_state.ACTIVE_EMBEDDED_RUNS_BY_RUN_ID.set(handle.runId, handle);
	setActiveRunSessionKey(sessionKey, sessionId);
	clearActiveRunSessionFiles(sessionId);
	setActiveRunSessionFile(sessionFile, sessionId);
	require_diagnostic.logSessionStateChange({
		sessionId,
		sessionKey,
		sessionFile,
		state: "processing",
		reason: wasActive ? "run_replaced" : "run_started"
	});
	require_diagnostic_run_activity.markDiagnosticEmbeddedRunStarted({
		sessionId,
		sessionKey
	});
	if (!sessionId.startsWith("probe-")) require_diagnostic_runtime.diagnosticLogger.debug(`run registered: sessionId=${sessionId} totalActive=${require_run_state.ACTIVE_EMBEDDED_RUNS.size}`);
}
function updateActiveEmbeddedRunSnapshot(sessionId, snapshot) {
	if (!require_run_state.ACTIVE_EMBEDDED_RUNS.has(sessionId)) return;
	require_run_state.ACTIVE_EMBEDDED_RUN_SNAPSHOTS.set(sessionId, snapshot);
}
function updateActiveEmbeddedRunSessionFile(sessionId, sessionFile) {
	if (!require_run_state.ACTIVE_EMBEDDED_RUNS.has(sessionId)) return;
	clearActiveRunSessionFiles(sessionId);
	setActiveRunSessionFile(sessionFile, sessionId);
	require_diagnostic.updateDiagnosticSessionFile({
		sessionId,
		sessionFile
	});
}
function clearActiveEmbeddedRun(sessionId, handle, sessionKey, sessionFile, reason = "run_completed") {
	const activeHandle = require_run_state.ACTIVE_EMBEDDED_RUNS.get(sessionId);
	if (activeHandle === void 0) return;
	if (activeHandle === handle) {
		require_run_state.ACTIVE_EMBEDDED_RUNS.delete(sessionId);
		clearEmbeddedRunAbortability(handle, { retainFinalizing: true });
		require_run_state.ACTIVE_EMBEDDED_RUN_SNAPSHOTS.delete(sessionId);
		clearActiveRunSessionKeys(sessionId, sessionKey);
		clearActiveRunSessionFiles(sessionId, sessionFile);
		require_diagnostic.logSessionStateChange({
			sessionId,
			sessionKey,
			sessionFile,
			state: "idle",
			reason
		});
		require_diagnostic_run_activity.markDiagnosticEmbeddedRunEnded({
			sessionId,
			sessionKey
		});
		if (!sessionId.startsWith("probe-")) require_diagnostic_runtime.diagnosticLogger.debug(`run cleared: sessionId=${sessionId} totalActive=${require_run_state.ACTIVE_EMBEDDED_RUNS.size}`);
		notifyEmbeddedRunEnded(sessionId);
	} else require_diagnostic_runtime.diagnosticLogger.debug(`run clear skipped: sessionId=${sessionId} reason=handle_mismatch`);
}
function forceClearEmbeddedAgentRun(sessionId, sessionKey, reason = "stuck_recovery") {
	let cleared = false;
	const handle = require_run_state.ACTIVE_EMBEDDED_RUNS.get(sessionId);
	if (handle) {
		require_run_state.ACTIVE_EMBEDDED_RUNS.delete(sessionId);
		clearEmbeddedRunAbortability(handle);
		require_run_state.ACTIVE_EMBEDDED_RUN_SNAPSHOTS.delete(sessionId);
		clearActiveRunSessionKeys(sessionId, sessionKey);
		clearActiveRunSessionFiles(sessionId);
		require_diagnostic.logSessionStateChange({
			sessionId,
			sessionKey,
			state: "idle",
			reason
		});
		require_diagnostic_run_activity.markDiagnosticEmbeddedRunEnded({
			sessionId,
			sessionKey
		});
		notifyEmbeddedRunEnded(sessionId);
		cleared = true;
	}
	return require_reply_run_registry.forceClearReplyRunBySessionId(sessionId, /* @__PURE__ */ new Error(`Embedded run force-cleared by ${reason}`)) || cleared;
}
const testing = { resetActiveEmbeddedRuns() {
	for (const waiters of require_run_state.EMBEDDED_RUN_WAITERS.values()) for (const waiter of waiters) {
		clearTimeout(waiter.timer);
		waiter.resolve(true);
	}
	require_run_state.EMBEDDED_RUN_WAITERS.clear();
	require_run_state.ACTIVE_EMBEDDED_RUNS.clear();
	require_run_state.ACTIVE_EMBEDDED_RUNS_BY_RUN_ID.clear();
	require_run_state.RETAINED_EMBEDDED_RUN_ABORTABILITY_RUN_IDS.clear();
	require_run_state.ACTIVE_EMBEDDED_RUN_SNAPSHOTS.clear();
	require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.clear();
	require_run_state.ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.clear();
	require_run_state.ABANDONED_EMBEDDED_RUNS_BY_SESSION_ID.clear();
	require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_KEY.clear();
	require_run_state.ABANDONED_EMBEDDED_RUN_SESSION_IDS_BY_FILE.clear();
} };
if (process.env.VITEST || false) globalThis[Symbol.for("operator.embeddedRunsTestApi")] = testing;
//#endregion
Object.defineProperty(exports, "abortAndDrainEmbeddedAgentRun", {
	enumerable: true,
	get: function() {
		return abortAndDrainEmbeddedAgentRun;
	}
});
Object.defineProperty(exports, "abortEmbeddedAgentRun", {
	enumerable: true,
	get: function() {
		return abortEmbeddedAgentRun;
	}
});
Object.defineProperty(exports, "clearActiveEmbeddedRun", {
	enumerable: true,
	get: function() {
		return clearActiveEmbeddedRun;
	}
});
Object.defineProperty(exports, "clearEmbeddedAgentRunAbortabilityForRunId", {
	enumerable: true,
	get: function() {
		return clearEmbeddedAgentRunAbortabilityForRunId;
	}
});
Object.defineProperty(exports, "formatEmbeddedAgentQueueFailureSummary", {
	enumerable: true,
	get: function() {
		return formatEmbeddedAgentQueueFailureSummary;
	}
});
Object.defineProperty(exports, "getActiveEmbeddedRunSnapshot", {
	enumerable: true,
	get: function() {
		return getActiveEmbeddedRunSnapshot;
	}
});
Object.defineProperty(exports, "isEmbeddedAgentRunAbortableForCompaction", {
	enumerable: true,
	get: function() {
		return isEmbeddedAgentRunAbortableForCompaction;
	}
});
Object.defineProperty(exports, "isEmbeddedAgentRunAbortableForRunId", {
	enumerable: true,
	get: function() {
		return isEmbeddedAgentRunAbortableForRunId;
	}
});
Object.defineProperty(exports, "isEmbeddedAgentRunActive", {
	enumerable: true,
	get: function() {
		return isEmbeddedAgentRunActive;
	}
});
Object.defineProperty(exports, "isEmbeddedAgentRunHandleActive", {
	enumerable: true,
	get: function() {
		return isEmbeddedAgentRunHandleActive;
	}
});
Object.defineProperty(exports, "isEmbeddedAgentRunStreaming", {
	enumerable: true,
	get: function() {
		return isEmbeddedAgentRunStreaming;
	}
});
Object.defineProperty(exports, "isEmbeddedRunAbandoned", {
	enumerable: true,
	get: function() {
		return isEmbeddedRunAbandoned;
	}
});
Object.defineProperty(exports, "markActiveEmbeddedRunAbandoned", {
	enumerable: true,
	get: function() {
		return markActiveEmbeddedRunAbandoned;
	}
});
Object.defineProperty(exports, "queueEmbeddedAgentMessage", {
	enumerable: true,
	get: function() {
		return queueEmbeddedAgentMessage;
	}
});
Object.defineProperty(exports, "queueEmbeddedAgentMessageWithOutcome", {
	enumerable: true,
	get: function() {
		return queueEmbeddedAgentMessageWithOutcome;
	}
});
Object.defineProperty(exports, "queueEmbeddedAgentMessageWithOutcomeAsync", {
	enumerable: true,
	get: function() {
		return queueEmbeddedAgentMessageWithOutcomeAsync;
	}
});
Object.defineProperty(exports, "resolveActiveEmbeddedRunHandleSessionId", {
	enumerable: true,
	get: function() {
		return resolveActiveEmbeddedRunHandleSessionId;
	}
});
Object.defineProperty(exports, "resolveActiveEmbeddedRunHandleSessionIdBySessionFile", {
	enumerable: true,
	get: function() {
		return resolveActiveEmbeddedRunHandleSessionIdBySessionFile;
	}
});
Object.defineProperty(exports, "resolveActiveEmbeddedRunSessionIdBySessionFile", {
	enumerable: true,
	get: function() {
		return resolveActiveEmbeddedRunSessionIdBySessionFile;
	}
});
Object.defineProperty(exports, "resolveEmbeddedAgentReplyRunPhase", {
	enumerable: true,
	get: function() {
		return resolveEmbeddedAgentReplyRunPhase;
	}
});
Object.defineProperty(exports, "resolveEmbeddedSessionFileKey", {
	enumerable: true,
	get: function() {
		return resolveEmbeddedSessionFileKey;
	}
});
Object.defineProperty(exports, "retainEmbeddedAgentRunAbortabilityForRunId", {
	enumerable: true,
	get: function() {
		return retainEmbeddedAgentRunAbortabilityForRunId;
	}
});
Object.defineProperty(exports, "runs_exports", {
	enumerable: true,
	get: function() {
		return runs_exports;
	}
});
Object.defineProperty(exports, "setActiveEmbeddedRun", {
	enumerable: true,
	get: function() {
		return setActiveEmbeddedRun;
	}
});
Object.defineProperty(exports, "updateActiveEmbeddedRunSessionFile", {
	enumerable: true,
	get: function() {
		return updateActiveEmbeddedRunSessionFile;
	}
});
Object.defineProperty(exports, "updateActiveEmbeddedRunSnapshot", {
	enumerable: true,
	get: function() {
		return updateActiveEmbeddedRunSnapshot;
	}
});
Object.defineProperty(exports, "waitForEmbeddedAgentRunEnd", {
	enumerable: true,
	get: function() {
		return waitForEmbeddedAgentRunEnd;
	}
});
