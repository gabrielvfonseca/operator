require("./rolldown-runtime-u92d-OFm.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_subagent_registry_state = require("./subagent-registry-state-Cb8uurME.cjs");
const require_subagent_registry_read = require("./subagent-registry-read-LeoF2Gsl.cjs");
const require_subagent_registry_steer_runtime = require("./subagent-registry-steer-runtime-BFFOYbbq.cjs");
//#region src/agents/subagent-registry-announce-read.ts
/**
* Read-side helpers for subagent completion announcements. These wrappers keep
* announce delivery code on normalized registry snapshots instead of reaching
* into persistence or mutation paths.
*/
/** Resolves the requester session and origin for a child subagent session. */
function resolveRequesterForChildSession(childSessionKey) {
	const resolved = require_subagent_registry_state.resolveRequesterForChildSessionFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), childSessionKey);
	if (!resolved) return null;
	return {
		requesterSessionKey: resolved.requesterSessionKey,
		requesterOrigin: require_delivery_context_shared.normalizeDeliveryContext(resolved.requesterOrigin)
	};
}
/** True when a subagent session still has an active run record. */
function isSubagentSessionRunActive(childSessionKey) {
	return require_subagent_registry_state.isSubagentSessionRunActiveFromRuns(require_subagent_registry_state.subagentRuns, childSessionKey);
}
/** True when post-completion announce should be skipped for a child session. */
function shouldIgnorePostCompletionAnnounceForSession(childSessionKey) {
	return require_subagent_registry_state.shouldIgnorePostCompletionAnnounceForSessionFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), childSessionKey);
}
/** Lists subagent runs requested by one session key. */
function listSubagentRunsForRequester(requesterSessionKey, options) {
	return require_subagent_registry_state.listRunsForRequesterFromRuns(require_subagent_registry_state.subagentRuns, requesterSessionKey, options);
}
/** Counts pending descendant subagent runs below a root session. */
function countPendingDescendantRuns(rootSessionKey) {
	return require_subagent_registry_state.countPendingDescendantRunsFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), rootSessionKey);
}
/** Counts pending descendant runs while excluding one run id. */
function countPendingDescendantRunsExcludingRun(rootSessionKey, excludeRunId) {
	return require_subagent_registry_state.countPendingDescendantRunsExcludingRunFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), rootSessionKey, excludeRunId);
}
//#endregion
exports.countActiveDescendantRuns = require_subagent_registry_read.countActiveDescendantRuns;
exports.countPendingDescendantRuns = countPendingDescendantRuns;
exports.countPendingDescendantRunsExcludingRun = countPendingDescendantRunsExcludingRun;
exports.getLatestSubagentRunByChildSessionKey = require_subagent_registry_read.getLatestSubagentRunByChildSessionKey;
exports.isSubagentSessionRunActive = isSubagentSessionRunActive;
exports.listSubagentRunsForRequester = listSubagentRunsForRequester;
exports.replaceSubagentRunAfterSteer = require_subagent_registry_steer_runtime.replaceSubagentRunAfterSteer;
exports.resolveRequesterForChildSession = resolveRequesterForChildSession;
exports.shouldIgnorePostCompletionAnnounceForSession = shouldIgnorePostCompletionAnnounceForSession;
