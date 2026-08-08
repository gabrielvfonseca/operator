const require_task_registry = require("./task-registry-VcVsRI11.cjs");
const require_task_status = require("./task-status-CjWQHsl4.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/tasks/task-owner-access.ts
function canOwnerAccessTask(task, callerOwnerKey) {
	return task.scopeKind === "session" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task.ownerKey) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(callerOwnerKey);
}
function getTaskByIdForOwner(params) {
	const task = require_task_registry.getTaskById(params.taskId);
	return task && canOwnerAccessTask(task, params.callerOwnerKey) ? task : void 0;
}
function findTaskByRunIdForOwner(params) {
	const task = require_task_registry.findTaskByRunId(params.runId);
	return task && canOwnerAccessTask(task, params.callerOwnerKey) ? task : void 0;
}
/** Update an owner-visible task's notification policy. */
function updateTaskNotifyPolicyForOwner(params) {
	const task = getTaskByIdForOwner({
		taskId: params.taskId,
		callerOwnerKey: params.callerOwnerKey
	});
	if (!task) return null;
	return require_task_registry.updateTaskNotifyPolicyById({
		taskId: task.taskId,
		notifyPolicy: params.notifyPolicy
	});
}
/** Mark an owner-visible task as cancelled with a caller-provided summary. */
function cancelTaskByIdForOwner(params) {
	const task = getTaskByIdForOwner({
		taskId: params.taskId,
		callerOwnerKey: params.callerOwnerKey
	});
	if (!task) return null;
	return require_task_registry.markTaskTerminalById({
		taskId: task.taskId,
		status: "cancelled",
		endedAt: params.endedAt,
		terminalSummary: params.terminalSummary
	});
}
function listTasksForRelatedSessionKeyForOwner(params) {
	return require_task_registry.listTasksForRelatedSessionKey(params.relatedSessionKey).filter((task) => canOwnerAccessTask(task, params.callerOwnerKey));
}
function buildTaskStatusSnapshotForRelatedSessionKeyForOwner(params) {
	return require_task_status.buildTaskStatusSnapshot(listTasksForRelatedSessionKeyForOwner({
		relatedSessionKey: params.relatedSessionKey,
		callerOwnerKey: params.callerOwnerKey
	}));
}
function findLatestTaskForRelatedSessionKeyForOwner(params) {
	return listTasksForRelatedSessionKeyForOwner(params)[0];
}
//#endregion
Object.defineProperty(exports, "buildTaskStatusSnapshotForRelatedSessionKeyForOwner", {
	enumerable: true,
	get: function() {
		return buildTaskStatusSnapshotForRelatedSessionKeyForOwner;
	}
});
Object.defineProperty(exports, "cancelTaskByIdForOwner", {
	enumerable: true,
	get: function() {
		return cancelTaskByIdForOwner;
	}
});
Object.defineProperty(exports, "findLatestTaskForRelatedSessionKeyForOwner", {
	enumerable: true,
	get: function() {
		return findLatestTaskForRelatedSessionKeyForOwner;
	}
});
Object.defineProperty(exports, "findTaskByRunIdForOwner", {
	enumerable: true,
	get: function() {
		return findTaskByRunIdForOwner;
	}
});
Object.defineProperty(exports, "updateTaskNotifyPolicyForOwner", {
	enumerable: true,
	get: function() {
		return updateTaskNotifyPolicyForOwner;
	}
});
