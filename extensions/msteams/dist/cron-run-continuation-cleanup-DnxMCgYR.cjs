const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_task_status_access = require("./task-status-access-B4LbHuEr.cjs");
const require_session_delivery_queue = require("./session-delivery-queue-BY_SdQdo.cjs");
//#region src/tasks/cron-run-continuation-cleanup.ts
/** Removes an idle exact-run continuation through the session lifecycle owner. */
function canRemoveCronRunContinuation(marker) {
	if (marker?.basePersisted !== true) return false;
	if (marker.phase === "ready") return !marker.ownerRunId;
	if (marker.phase !== "continuing" || !marker.ownerRunId) return false;
	const ownerLifecycleGeneration = marker.ownerLifecycleGeneration?.trim();
	return Boolean(ownerLifecycleGeneration && ownerLifecycleGeneration !== require_agent_events.getAgentEventLifecycleGeneration());
}
async function removeCronRunContinuationSessionIfIdle(sessionKey, settledDeliveryId) {
	if (!require_session_key.parseCronRunScopeSuffix(sessionKey).runId || require_task_status_access.hasPendingGeneratedMediaTaskForSessionKey(sessionKey)) return;
	if ((await require_session_delivery_queue.loadPendingSessionDeliveries()).some((entry) => entry.sessionKey === sessionKey && entry.id !== settledDeliveryId && entry.settlementOutcome === void 0 && entry.acknowledgedAt === void 0)) return;
	const agentId = require_session_key.resolveAgentIdFromSessionKey(sessionKey);
	const storePath = require_paths.resolveStorePath(require_io.getRuntimeConfig().session?.store, { agentId });
	const entry = require_session_accessor.loadSessionEntry({
		agentId,
		sessionKey,
		storePath,
		readConsistency: "latest",
		hydrateSkillPromptRefs: false
	});
	const marker = entry?.cronRunContinuation;
	if (!entry || !canRemoveCronRunContinuation(marker)) return;
	await require_session_accessor.deleteSessionEntryLifecycle({
		agentId,
		archiveTranscript: false,
		expectedEntry: entry,
		expectedLifecycleRevision: entry.lifecycleRevision,
		expectedSessionId: entry.sessionId,
		expectedUpdatedAt: entry.updatedAt,
		requireWriteSuccess: true,
		storePath,
		target: {
			canonicalKey: sessionKey,
			storeKeys: [sessionKey]
		}
	});
}
//#endregion
Object.defineProperty(exports, "removeCronRunContinuationSessionIfIdle", {
	enumerable: true,
	get: function() {
		return removeCronRunContinuationSessionIfIdle;
	}
});
