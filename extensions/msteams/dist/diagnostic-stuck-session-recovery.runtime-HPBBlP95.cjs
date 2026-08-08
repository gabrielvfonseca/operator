require("./rolldown-runtime-u92d-OFm.cjs");
const require_diagnostic = require("./diagnostic-Blh06VbF.cjs");
const require_diagnostic_run_activity = require("./diagnostic-run-activity-DjuaoKPQ.cjs");
const require_diagnostic_runtime = require("./diagnostic-runtime-DOIuSHus.cjs");
const require_diagnostic_session_state = require("./diagnostic-session-state-C4bkHap8.cjs");
const require_run_state = require("./run-state-lPLPf1ME.cjs");
const require_runs = require("./runs-BxiWZCUY.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_lanes = require("./lanes-Bdd4iV5N.cjs");
//#region src/logging/diagnostic-stuck-session-recovery.runtime.ts
const STUCK_SESSION_ABORT_SETTLE_MS = 15e3;
const STUCK_SESSION_PROGRESS_STALE_MS = 5 * 6e4;
const STALE_ACTIVE_LANE_TASK_RELEASE_MS = STUCK_SESSION_PROGRESS_STALE_MS;
const recoveriesInFlight = /* @__PURE__ */ new Set();
function resolveStaleActiveProgressAbortMs(params) {
	const configured = params.staleActiveProgressAbortMs;
	return typeof configured === "number" && configured > 0 ? configured : STUCK_SESSION_PROGRESS_STALE_MS;
}
function resolveStaleActiveLaneTaskReleaseMs(params) {
	const compactionSafetyTimeoutMs = params.compactionSafetyTimeoutMs;
	const compactionReleaseMs = typeof compactionSafetyTimeoutMs === "number" && compactionSafetyTimeoutMs > 0 ? compactionSafetyTimeoutMs + STUCK_SESSION_ABORT_SETTLE_MS : 0;
	return Math.max(STALE_ACTIVE_LANE_TASK_RELEASE_MS, compactionReleaseMs);
}
function isActiveRunProgressStale(params) {
	if ((params.queueDepth ?? 0) <= 0) return false;
	const lastProgressAgeMs = require_diagnostic_run_activity.getDiagnosticSessionActivitySnapshot({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey
	}).lastProgressAgeMs;
	return typeof lastProgressAgeMs === "number" && lastProgressAgeMs >= params.staleAbortMs;
}
function formatRecoveryContext(params, extra) {
	const fields = [
		`sessionId=${params.sessionId ?? extra?.activeSessionId ?? "unknown"}`,
		`sessionKey=${params.sessionKey ?? "unknown"}`,
		`age=${Math.round(params.ageMs / 1e3)}s`,
		`queueDepth=${params.queueDepth ?? 0}`
	];
	if (extra?.activeSessionId) fields.push(`activeSessionId=${extra.activeSessionId}`);
	if (extra?.lane) fields.push(`lane=${extra.lane}`);
	if (extra?.activeCount !== void 0) fields.push(`laneActive=${extra.activeCount}`);
	if (extra?.queuedCount !== void 0) fields.push(`laneQueued=${extra.queuedCount}`);
	return fields.join(" ");
}
async function recoverStuckDiagnosticSession(params) {
	const key = require_diagnostic.resolveStuckSessionRecoveryRef(params);
	if (!key || recoveriesInFlight.has(key)) return {
		status: "skipped",
		action: "observe_only",
		reason: key ? "already_in_flight" : "missing_session_ref",
		sessionId: params.sessionId,
		sessionKey: params.sessionKey
	};
	recoveriesInFlight.add(key);
	try {
		if (!require_diagnostic_session_state.isDiagnosticSessionStateCurrent({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			generation: params.stateGeneration,
			state: params.expectedState ?? "processing"
		})) return {
			status: "skipped",
			action: "observe_only",
			reason: "stale_session_state",
			sessionId: params.sessionId,
			sessionKey: params.sessionKey
		};
		const fallbackActiveSessionId = params.sessionId && require_runs.isEmbeddedAgentRunHandleActive(params.sessionId) ? params.sessionId : void 0;
		const fileActiveSessionId = params.sessionFile ? require_runs.resolveActiveEmbeddedRunHandleSessionIdBySessionFile(params.sessionFile) : void 0;
		let activeSessionId = params.sessionKey ? require_runs.resolveActiveEmbeddedRunHandleSessionId(params.sessionKey) ?? fileActiveSessionId ?? fallbackActiveSessionId : fileActiveSessionId ?? fallbackActiveSessionId;
		const fileActiveWorkSessionId = params.sessionFile ? require_runs.resolveActiveEmbeddedRunSessionIdBySessionFile(params.sessionFile) : void 0;
		const activeWorkSessionId = params.sessionKey ? require_run_state.resolveActiveEmbeddedRunSessionId(params.sessionKey) ?? fileActiveWorkSessionId ?? params.sessionId : fileActiveWorkSessionId ?? params.sessionId;
		const sessionLane = key ? require_lanes.resolveEmbeddedSessionLane(key) : null;
		const preAbortActiveTaskIds = new Set(sessionLane ? require_command_queue.getCommandLaneActiveTaskIds(sessionLane) : []);
		let aborted = false;
		let drained = true;
		let forceCleared = false;
		const staleActiveProgressAbortMs = resolveStaleActiveProgressAbortMs(params);
		const staleActiveLaneTaskReleaseMs = resolveStaleActiveLaneTaskReleaseMs(params);
		if (activeSessionId) {
			const reclaimStaleActiveRun = params.allowActiveAbort !== true && isActiveRunProgressStale({
				sessionId: activeSessionId,
				sessionKey: params.sessionKey,
				queueDepth: params.queueDepth,
				staleAbortMs: staleActiveProgressAbortMs
			});
			if (params.allowActiveAbort !== true && !reclaimStaleActiveRun) {
				const outcome = {
					status: "skipped",
					action: "observe_only",
					reason: "active_embedded_run",
					sessionId: params.sessionId,
					sessionKey: params.sessionKey,
					activeSessionId,
					activeWorkKind: "embedded_run"
				};
				require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery skipped: ${formatRecoveryContext(params, { activeSessionId })}`);
				require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery outcome: ${require_diagnostic.formatRecoveryOutcome(outcome)}`);
				return outcome;
			}
			if (reclaimStaleActiveRun) require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery reclaiming stale active run: ${formatRecoveryContext(params, { activeSessionId })}`);
			const result = await require_runs.abortAndDrainEmbeddedAgentRun({
				sessionId: activeSessionId,
				sessionKey: params.sessionKey,
				settleMs: STUCK_SESSION_ABORT_SETTLE_MS,
				forceClear: true,
				reason: "stuck_recovery"
			});
			aborted = result.aborted;
			drained = result.drained;
			forceCleared = result.forceCleared;
		}
		if (!activeSessionId && activeWorkSessionId && require_runs.isEmbeddedAgentRunActive(activeWorkSessionId)) {
			if (require_runs.resolveEmbeddedAgentReplyRunPhase(activeWorkSessionId) === "waiting_for_deferred_maintenance") {
				const outcome = {
					status: "skipped",
					action: "keep_lane",
					reason: "deferred_maintenance_wait",
					sessionId: params.sessionId,
					sessionKey: params.sessionKey,
					activeSessionId: activeWorkSessionId
				};
				require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery outcome: ${require_diagnostic.formatRecoveryOutcome(outcome)}`);
				return outcome;
			}
			const reclaimStaleReplyWork = params.allowActiveAbort !== true && isActiveRunProgressStale({
				sessionId: activeWorkSessionId,
				sessionKey: params.sessionKey,
				queueDepth: params.queueDepth,
				staleAbortMs: staleActiveProgressAbortMs
			});
			if (params.allowActiveAbort === true || reclaimStaleReplyWork) {
				if (reclaimStaleReplyWork) require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery reclaiming stale active reply work: ${formatRecoveryContext(params, { activeSessionId: activeWorkSessionId })}`);
				const result = await require_runs.abortAndDrainEmbeddedAgentRun({
					sessionId: activeWorkSessionId,
					sessionKey: params.sessionKey,
					settleMs: STUCK_SESSION_ABORT_SETTLE_MS,
					forceClear: true,
					reason: "stuck_recovery"
				});
				aborted = result.aborted;
				drained = result.drained;
				forceCleared = result.forceCleared;
				activeSessionId = activeWorkSessionId;
			} else {
				const outcome = {
					status: "skipped",
					action: "keep_lane",
					reason: "active_reply_work",
					sessionId: params.sessionId,
					sessionKey: params.sessionKey,
					activeSessionId: activeWorkSessionId,
					activeWorkKind: "embedded_run"
				};
				require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery outcome: ${require_diagnostic.formatRecoveryOutcome(outcome)}`);
				return outcome;
			}
		}
		if (!activeSessionId && sessionLane) {
			const laneSnapshot = require_command_queue.getCommandLaneSnapshot(sessionLane);
			if (laneSnapshot.activeCount > 0) {
				if (!require_command_queue.getCommandLaneActiveTaskIds(sessionLane).some((id) => !preAbortActiveTaskIds.has(id)) && params.ageMs >= staleActiveLaneTaskReleaseMs) {
					const released = require_command_queue.resetCommandLane(sessionLane);
					const outcome = {
						status: "released",
						action: "release_lane",
						reason: "stale_lane_task",
						sessionId: params.sessionId,
						sessionKey: params.sessionKey,
						lane: sessionLane,
						released,
						queuedCount: laneSnapshot.queuedCount
					};
					require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery outcome: ${require_diagnostic.formatRecoveryOutcome(outcome)}`);
					return outcome;
				}
				const outcome = {
					status: "skipped",
					action: "keep_lane",
					reason: "active_lane_task",
					sessionId: params.sessionId,
					sessionKey: params.sessionKey,
					lane: sessionLane,
					activeCount: laneSnapshot.activeCount,
					queuedCount: laneSnapshot.queuedCount
				};
				require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery outcome: ${require_diagnostic.formatRecoveryOutcome(outcome)}`);
				return outcome;
			}
		}
		const queuedCount = sessionLane ? require_command_queue.getCommandLaneSnapshot(sessionLane).queuedCount : 0;
		const laneStartedFreshTask = sessionLane !== null && require_command_queue.getCommandLaneActiveTaskIds(sessionLane).some((id) => !preAbortActiveTaskIds.has(id));
		const hasQueuedSessionWork = (params.queueDepth ?? 0) > 0;
		const released = sessionLane && !laneStartedFreshTask && (queuedCount > 0 || hasQueuedSessionWork || !activeSessionId || !aborted || !drained) ? require_command_queue.resetCommandLane(sessionLane) : 0;
		const clearStaleQueuedSession = !aborted && released === 0 && (params.queueDepth ?? 0) > 0;
		if (aborted || forceCleared || released > 0 || clearStaleQueuedSession) {
			const action = aborted || forceCleared ? "abort_embedded_run" : "release_lane";
			const stoppedFields = require_diagnostic.formatStoppedCronSessionDiagnosticFields(require_diagnostic.resolveCronSessionDiagnosticContext({
				sessionKey: params.sessionKey,
				activeSessionId
			}));
			require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery: sessionId=${params.sessionId ?? activeSessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} age=${Math.round(params.ageMs / 1e3)}s action=${action} aborted=${aborted} drained=${drained} released=${released}${stoppedFields ? ` ${stoppedFields}` : ""}`);
			const outcome = aborted || forceCleared ? {
				status: "aborted",
				action: "abort_embedded_run",
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				activeSessionId,
				activeWorkKind: "embedded_run",
				aborted,
				drained,
				forceCleared,
				released,
				lane: sessionLane ?? void 0,
				...queuedCount > 0 ? { queuedCount } : {}
			} : {
				status: "released",
				action: "release_lane",
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				released,
				lane: sessionLane ?? void 0
			};
			require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery outcome: ${require_diagnostic.formatRecoveryOutcome(outcome)}`);
			return outcome;
		}
		const outcome = {
			status: "noop",
			action: "none",
			reason: "no_active_work",
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			lane: sessionLane ?? void 0
		};
		require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery outcome: ${require_diagnostic.formatRecoveryOutcome(outcome)}`);
		return outcome;
	} catch (err) {
		const outcome = {
			status: "failed",
			action: "none",
			reason: "exception",
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			error: String(err)
		};
		require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery failed: sessionId=${params.sessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} err=${String(err)}`);
		return outcome;
	} finally {
		recoveriesInFlight.delete(key);
	}
}
/** Test hooks for clearing in-flight recovery guards. */
const testing = { resetRecoveriesInFlight() {
	recoveriesInFlight.clear();
} };
//#endregion
exports.__testing = testing;
exports.testing = testing;
exports.recoverStuckDiagnosticSession = recoverStuckDiagnosticSession;
