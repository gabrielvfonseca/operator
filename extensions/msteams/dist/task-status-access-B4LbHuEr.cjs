const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_map_size = require("./map-size-Ddkr6xII.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
//#region src/tasks/generated-media-task-activity.ts
const GENERATED_MEDIA_TASK_ACTIVITY_KEY = Symbol.for("operator.generatedMediaTaskActivity");
const GENERATED_MEDIA_TASK_ADMISSIONS_KEY = Symbol.for("operator.generatedMediaTaskAdmissions");
const GENERATED_MEDIA_TASK_ADMISSIONS_MAX_ENTRIES = 2048;
function getActiveGeneratedMediaTasks() {
	return require_global_singleton.resolveGlobalSingleton(GENERATED_MEDIA_TASK_ACTIVITY_KEY, () => /* @__PURE__ */ new Map());
}
function getLatestGeneratedMediaTaskAdmissions() {
	return require_global_singleton.resolveGlobalSingleton(GENERATED_MEDIA_TASK_ADMISSIONS_KEY, () => /* @__PURE__ */ new Map());
}
/** Tracks in-process generated-media work even when a plugin owns task persistence. */
function registerGeneratedMediaTaskActivity(runId, sessionKey) {
	if (!runId || !sessionKey) return;
	const active = getActiveGeneratedMediaTasks();
	if (!active.has(runId)) {
		const admissions = getLatestGeneratedMediaTaskAdmissions();
		admissions.delete(sessionKey);
		admissions.set(sessionKey, runId);
		require_map_size.pruneMapToMaxSize(admissions, GENERATED_MEDIA_TASK_ADMISSIONS_MAX_ENTRIES);
	}
	active.set(runId, sessionKey);
}
/** Clears in-process generated-media activity after terminal task bookkeeping. */
function clearGeneratedMediaTaskActivity(runId) {
	getActiveGeneratedMediaTasks().delete(runId);
}
/** Lists active generated-media run ids for one exact requester session. */
function listActiveGeneratedMediaTaskIdsForSessionKey(sessionKey) {
	const runIds = [];
	for (const [runId, requesterSessionKey] of getActiveGeneratedMediaTasks()) if (requesterSessionKey === sessionKey) runIds.push(runId);
	return runIds;
}
/** Returns the latest admitted run id even after that task became terminal. */
function getLatestGeneratedMediaTaskAdmissionIdForSessionKey(sessionKey) {
	return getLatestGeneratedMediaTaskAdmissions().get(sessionKey);
}
function resetGeneratedMediaTaskActivityForTests() {
	getActiveGeneratedMediaTasks().clear();
	getLatestGeneratedMediaTaskAdmissions().clear();
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.generatedMediaTaskActivityTestApi")] = { resetGeneratedMediaTaskActivityForTests };
//#endregion
//#region src/tasks/task-status-access.ts
const GENERATED_MEDIA_TASK_KINDS = /* @__PURE__ */ new Set([
	"image_generation",
	"music_generation",
	"video_generation"
]);
/** Returns only the session lookup fields needed by task status commands. */
function getTaskSessionLookupByIdForStatus(taskId) {
	const task = require_task_registry.getTaskById(taskId);
	return task ? {
		requesterSessionKey: task.requesterSessionKey,
		ownerKey: task.ownerKey,
		...task.runId ? { runId: task.runId } : {},
		...task.agentId ? { agentId: task.agentId } : {},
		...task.requesterAgentId ? { requesterAgentId: task.requesterAgentId } : {}
	} : void 0;
}
function listTasksForSessionKeyForStatus(sessionKey) {
	return require_task_registry.listTasksForSessionKey(sessionKey);
}
function listTasksForOwnerOrRequesterSessionKeyForStatus(sessionKey) {
	return require_task_registry.listTaskRecords().filter((task) => task.requesterSessionKey === sessionKey || task.ownerKey === sessionKey);
}
function listTasksForAgentIdForStatus(agentId) {
	return require_task_registry.listTasksForAgentId(agentId);
}
function findTaskByRunIdForStatus(runId) {
	return require_task_registry.findTaskByRunId(runId);
}
/** Snapshots generated-media task ids so replay guards stay attempt-local. */
function getGeneratedMediaTaskIdsForSessionKey(sessionKey) {
	if (!sessionKey || !require_session_key.parseCronRunScopeSuffix(sessionKey).runId) return /* @__PURE__ */ new Set();
	const taskIds = listTasksForOwnerOrRequesterSessionKeyForStatus(sessionKey).filter((task) => GENERATED_MEDIA_TASK_KINDS.has(task.taskKind ?? "")).map((task) => task.taskId);
	const latestAdmission = getLatestGeneratedMediaTaskAdmissionIdForSessionKey(sessionKey);
	return /* @__PURE__ */ new Set([...taskIds, ...latestAdmission ? [`run:${latestAdmission}`] : []]);
}
/** Returns whether one attempt admitted generated-media work after its snapshot. */
function hasNewGeneratedMediaTaskForSessionKey(sessionKey, before) {
	for (const taskId of getGeneratedMediaTaskIdsForSessionKey(sessionKey)) if (!before.has(taskId)) return true;
	return false;
}
/** Returns whether generated-media work still needs this run's continuation row. */
function hasPendingGeneratedMediaTaskForSessionKey(sessionKey) {
	if (!require_session_key.parseCronRunScopeSuffix(sessionKey).runId) return false;
	if (listActiveGeneratedMediaTaskIdsForSessionKey(sessionKey).length > 0) return true;
	return listTasksForOwnerOrRequesterSessionKeyForStatus(sessionKey).some((task) => GENERATED_MEDIA_TASK_KINDS.has(task.taskKind ?? "") && !require_task_registry.isTerminalTaskStatus(task.status));
}
//#endregion
Object.defineProperty(exports, "clearGeneratedMediaTaskActivity", {
	enumerable: true,
	get: function() {
		return clearGeneratedMediaTaskActivity;
	}
});
Object.defineProperty(exports, "findTaskByRunIdForStatus", {
	enumerable: true,
	get: function() {
		return findTaskByRunIdForStatus;
	}
});
Object.defineProperty(exports, "getGeneratedMediaTaskIdsForSessionKey", {
	enumerable: true,
	get: function() {
		return getGeneratedMediaTaskIdsForSessionKey;
	}
});
Object.defineProperty(exports, "getTaskSessionLookupByIdForStatus", {
	enumerable: true,
	get: function() {
		return getTaskSessionLookupByIdForStatus;
	}
});
Object.defineProperty(exports, "hasNewGeneratedMediaTaskForSessionKey", {
	enumerable: true,
	get: function() {
		return hasNewGeneratedMediaTaskForSessionKey;
	}
});
Object.defineProperty(exports, "hasPendingGeneratedMediaTaskForSessionKey", {
	enumerable: true,
	get: function() {
		return hasPendingGeneratedMediaTaskForSessionKey;
	}
});
Object.defineProperty(exports, "listTasksForAgentIdForStatus", {
	enumerable: true,
	get: function() {
		return listTasksForAgentIdForStatus;
	}
});
Object.defineProperty(exports, "listTasksForOwnerOrRequesterSessionKeyForStatus", {
	enumerable: true,
	get: function() {
		return listTasksForOwnerOrRequesterSessionKeyForStatus;
	}
});
Object.defineProperty(exports, "listTasksForSessionKeyForStatus", {
	enumerable: true,
	get: function() {
		return listTasksForSessionKeyForStatus;
	}
});
Object.defineProperty(exports, "registerGeneratedMediaTaskActivity", {
	enumerable: true,
	get: function() {
		return registerGeneratedMediaTaskActivity;
	}
});
