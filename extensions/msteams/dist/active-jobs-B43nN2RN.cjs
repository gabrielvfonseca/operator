const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
//#region src/cron/active-jobs.ts
/** Tracks in-process cron executions so schedulers and wake paths avoid duplicate runs. */
const CRON_ACTIVE_JOB_STATE_KEY = Symbol.for("operator.cron.activeJobs");
function getCronActiveJobState() {
	const state = require_global_singleton.resolveGlobalSingleton(CRON_ACTIVE_JOB_STATE_KEY, () => ({
		activeJobs: /* @__PURE__ */ new Map(),
		generation: 0,
		nextToken: 1,
		emptyWaiters: /* @__PURE__ */ new Set(),
		activeJobIds: /* @__PURE__ */ new Set()
	}));
	state.generation ??= 0;
	state.nextToken ??= 1;
	state.activeJobs ??= /* @__PURE__ */ new Map();
	state.emptyWaiters ??= /* @__PURE__ */ new Set();
	state.activeJobIds ??= /* @__PURE__ */ new Set();
	if (state.activeJobIds) {
		for (const [jobId, marker] of state.activeJobs) if (marker.legacy === true && !state.activeJobIds.has(jobId)) state.activeJobs.delete(jobId);
		for (const jobId of state.activeJobIds) if (!state.activeJobs.has(jobId)) {
			state.activeJobs.set(jobId, {
				jobId,
				generation: state.generation,
				token: state.nextToken,
				legacy: true
			});
			state.nextToken += 1;
		}
	}
	return state;
}
function getActiveCronJobCountForGeneration(state) {
	let active = 0;
	for (const marker of state.activeJobs.values()) if (isMarkerActiveInGeneration(marker, state.generation)) active += 1;
	return active;
}
function isMarkerActiveInGeneration(marker, generation) {
	return marker.generation === generation || marker.preserveAcrossGenerationAdvance === true;
}
function notifyActiveCronJobWaitersIfEmpty(state) {
	if (getActiveCronJobCountForGeneration(state) > 0) return;
	for (const resolve of state.emptyWaiters) resolve();
	state.emptyWaiters.clear();
}
/** Marks a cron job id as currently executing for duplicate-run suppression. */
function markCronJobActive(jobId, opts) {
	if (!jobId) return;
	const state = getCronActiveJobState();
	const token = state.nextToken;
	state.nextToken += 1;
	const marker = {
		jobId,
		generation: state.generation,
		token,
		...opts?.preserveAcrossGenerationAdvance ? { preserveAcrossGenerationAdvance: true } : {}
	};
	state.activeJobs.set(jobId, marker);
	state.activeJobIds?.add(jobId);
	return marker;
}
/** Clears the active marker when a cron run exits or is abandoned. */
function clearCronJobActive(jobId, marker) {
	if (!jobId) return;
	const state = getCronActiveJobState();
	const activeMarker = state.activeJobs.get(jobId);
	if (activeMarker && (!marker || marker.jobId === jobId && marker.token === activeMarker.token)) {
		state.activeJobs.delete(jobId);
		state.activeJobIds?.delete(jobId);
	}
	notifyActiveCronJobWaitersIfEmpty(state);
}
/** Returns whether the given cron job id is currently executing in this process. */
function isCronJobActive(jobId) {
	if (!jobId) return false;
	const state = getCronActiveJobState();
	const marker = state.activeJobs.get(jobId);
	return marker ? isMarkerActiveInGeneration(marker, state.generation) : false;
}
function isCronActiveJobMarkerCurrent(marker) {
	if (!marker) return true;
	const state = getCronActiveJobState();
	return state.activeJobs.get(marker.jobId)?.token === marker.token && isMarkerActiveInGeneration(marker, state.generation);
}
/** Returns whether any cron run is active in this process. */
function hasActiveCronJobs() {
	return getActiveCronJobCountForGeneration(getCronActiveJobState()) > 0;
}
/** Returns the number of active cron runs in this process. */
function getActiveCronJobCount() {
	return getActiveCronJobCountForGeneration(getCronActiveJobState());
}
//#endregion
Object.defineProperty(exports, "clearCronJobActive", {
	enumerable: true,
	get: function() {
		return clearCronJobActive;
	}
});
Object.defineProperty(exports, "getActiveCronJobCount", {
	enumerable: true,
	get: function() {
		return getActiveCronJobCount;
	}
});
Object.defineProperty(exports, "hasActiveCronJobs", {
	enumerable: true,
	get: function() {
		return hasActiveCronJobs;
	}
});
Object.defineProperty(exports, "isCronActiveJobMarkerCurrent", {
	enumerable: true,
	get: function() {
		return isCronActiveJobMarkerCurrent;
	}
});
Object.defineProperty(exports, "isCronJobActive", {
	enumerable: true,
	get: function() {
		return isCronJobActive;
	}
});
Object.defineProperty(exports, "markCronJobActive", {
	enumerable: true,
	get: function() {
		return markCronJobActive;
	}
});
