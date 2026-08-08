const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_subagent_registry_state = require("./subagent-registry-state-Cb8uurME.cjs");
const require_subagent_run_generation = require("./subagent-run-generation-Ds6deSIQ.cjs");
//#region src/agents/subagent-registry-read.ts
/**
* Read-only subagent registry accessors.
*
* Combines persisted snapshots with in-memory live runs for UI, announce, control, and recovery paths.
*/
/** Builds a reusable read index from the current persisted and in-memory run state. */
function buildSubagentRunReadIndex(now = Date.now()) {
	return require_subagent_registry_state.buildSubagentRunReadIndexFromRuns({
		runs: require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns),
		inMemoryRuns: require_subagent_registry_state.subagentRuns.values(),
		now
	});
}
/** Builds an O(1) latest-run lookup from one persisted and in-memory snapshot. */
function buildLatestSubagentRunReadIndex() {
	return require_subagent_registry_state.buildLatestSubagentRunReadIndexFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns));
}
/** Lists runs controlled by a session key. */
function listSubagentRunsForController(controllerSessionKey) {
	return require_subagent_registry_state.listRunsForControllerFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), controllerSessionKey);
}
/** Counts active descendant runs for a requester/session tree. */
function countActiveDescendantRuns(rootSessionKey) {
	return require_subagent_registry_state.countActiveDescendantRunsFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), rootSessionKey);
}
/** Lists descendant runs under a requester/session tree. */
function listDescendantRunsForRequester(rootSessionKey) {
	return require_subagent_registry_state.listDescendantRunsForRequesterFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), rootSessionKey);
}
/** Returns the preferred run for a child session, favoring active over ended runs. */
function getSubagentRunByChildSessionKey(childSessionKey) {
	return require_subagent_registry_state.getSubagentRunByChildSessionKeyFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), childSessionKey);
}
/** Returns whether a registry entry still has a live agent run context. */
function isSubagentRunLive(entry) {
	if (!entry || typeof entry.endedAt === "number") return false;
	return Boolean(require_agent_events.getAgentRunContext(entry.runId));
}
/** Returns the run to display for a child session, using live memory before snapshot state. */
function getSessionDisplaySubagentRunByChildSessionKey(childSessionKey) {
	const key = childSessionKey.trim();
	if (!key) return null;
	let latestInMemoryActive = null;
	let latestInMemoryEnded = null;
	for (const entry of require_subagent_registry_state.subagentRuns.values()) {
		if (entry.childSessionKey !== key) continue;
		if (typeof entry.endedAt === "number") {
			if (!latestInMemoryEnded || require_subagent_run_generation.compareSubagentRunGeneration(entry, latestInMemoryEnded) > 0) latestInMemoryEnded = entry;
			continue;
		}
		if (!latestInMemoryActive || require_subagent_run_generation.compareSubagentRunGeneration(entry, latestInMemoryActive) > 0) latestInMemoryActive = entry;
	}
	if (latestInMemoryEnded || latestInMemoryActive) {
		if (latestInMemoryEnded && (!latestInMemoryActive || require_subagent_run_generation.compareSubagentRunGeneration(latestInMemoryEnded, latestInMemoryActive) > 0)) return latestInMemoryEnded;
		return latestInMemoryActive ?? latestInMemoryEnded;
	}
	return getSubagentRunByChildSessionKey(key);
}
/** Returns the most recently created run for a child session from readable registry state. */
function getLatestSubagentRunByChildSessionKey(childSessionKey) {
	const key = childSessionKey.trim();
	if (!key) return null;
	let latest = null;
	for (const entry of require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns).values()) {
		if (entry.childSessionKey !== key) continue;
		if (!latest || require_subagent_run_generation.compareSubagentRunGeneration(entry, latest) > 0) latest = entry;
	}
	return latest;
}
//#endregion
Object.defineProperty(exports, "buildLatestSubagentRunReadIndex", {
	enumerable: true,
	get: function() {
		return buildLatestSubagentRunReadIndex;
	}
});
Object.defineProperty(exports, "buildSubagentRunReadIndex", {
	enumerable: true,
	get: function() {
		return buildSubagentRunReadIndex;
	}
});
Object.defineProperty(exports, "countActiveDescendantRuns", {
	enumerable: true,
	get: function() {
		return countActiveDescendantRuns;
	}
});
Object.defineProperty(exports, "getLatestSubagentRunByChildSessionKey", {
	enumerable: true,
	get: function() {
		return getLatestSubagentRunByChildSessionKey;
	}
});
Object.defineProperty(exports, "getSessionDisplaySubagentRunByChildSessionKey", {
	enumerable: true,
	get: function() {
		return getSessionDisplaySubagentRunByChildSessionKey;
	}
});
Object.defineProperty(exports, "isSubagentRunLive", {
	enumerable: true,
	get: function() {
		return isSubagentRunLive;
	}
});
Object.defineProperty(exports, "listDescendantRunsForRequester", {
	enumerable: true,
	get: function() {
		return listDescendantRunsForRequester;
	}
});
Object.defineProperty(exports, "listSubagentRunsForController", {
	enumerable: true,
	get: function() {
		return listSubagentRunsForController;
	}
});
