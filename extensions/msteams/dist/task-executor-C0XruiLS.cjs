const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_detached_task_runtime_state = require("./detached-task-runtime-state-DhlAs-Lg.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
require("./runtime-internal-CNKl6hEH.cjs");
require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/tasks/task-executor.ts
const log = require_subsystem.createSubsystemLogger("tasks/executor");
function isOneTaskFlowEligible(task) {
	if (task.parentFlowId?.trim() || task.scopeKind !== "session") return false;
	if (task.deliveryStatus === "not_applicable") return false;
	return task.runtime === "acp" || task.runtime === "subagent";
}
function ensureSingleTaskFlow(params) {
	if (!isOneTaskFlowEligible(params.task)) return params.task;
	try {
		const flow = require_task_registry.createTaskFlowForTask({
			task: params.task,
			requesterOrigin: params.requesterOrigin
		});
		if (!flow) return params.task;
		const linked = require_task_registry.linkTaskToFlowById({
			taskId: params.task.taskId,
			flowId: flow.flowId
		});
		if (!linked) {
			require_task_registry.deleteTaskFlowRecordById(flow.flowId);
			return params.task;
		}
		if (linked.parentFlowId !== flow.flowId) {
			require_task_registry.deleteTaskFlowRecordById(flow.flowId);
			return linked;
		}
		return linked;
	} catch (error) {
		log.warn("Failed to create one-task flow for detached run", {
			taskId: params.task.taskId,
			runId: params.task.runId,
			error
		});
		return params.task;
	}
}
function createQueuedTaskRun(params) {
	const task = require_task_registry.createTaskRecord({
		...params,
		status: "queued"
	});
	if (!task) return null;
	return ensureSingleTaskFlow({
		task,
		requesterOrigin: params.requesterOrigin
	});
}
function createRunningTaskRun(params) {
	const task = require_task_registry.createTaskRecord({
		...params,
		status: "running"
	});
	if (!task) return null;
	return ensureSingleTaskFlow({
		task,
		requesterOrigin: params.requesterOrigin
	});
}
function findTaskByRunId(runId) {
	return require_task_registry.findTaskByRunId(runId);
}
function listTaskRecordsUnsorted() {
	return require_task_registry.listTaskRecordsUnsorted();
}
function startTaskRunByRunId(params) {
	return require_task_registry.markTaskRunningByRunId(params);
}
function recordTaskRunProgressByRunId(params) {
	return require_task_registry.recordTaskProgressByRunId(params);
}
function completeTaskRunByRunId(params) {
	return finalizeTaskRunByRunId({
		...params,
		status: "succeeded"
	});
}
function finalizeTaskRunByRunId(params) {
	return require_task_registry.finalizeTaskRunByRunId(params);
}
function finalizeTaskRunById(params) {
	return require_task_registry.markTaskTerminalById(params);
}
function failTaskRunByRunId(params) {
	return finalizeTaskRunByRunId({
		...params,
		status: params.status ?? "failed"
	});
}
function setDetachedTaskDeliveryStatusByRunId(params) {
	return require_task_registry.setTaskRunDeliveryStatusByRunId(params);
}
async function cancelDetachedTaskRunById(params) {
	const task = require_task_registry.getTaskById(params.taskId);
	const registeredRuntime = require_detached_task_runtime_state.getRegisteredDetachedTaskLifecycleRuntime();
	if (!task) {
		if (registeredRuntime) {
			const cancelled = await registeredRuntime.cancelDetachedTaskRunById(params);
			if (cancelled.found) return cancelled;
		}
		return require_task_registry.cancelTaskById(params);
	}
	try {
		require_task_registry.assertTaskCancellationReadyById(task.taskId);
	} catch (error) {
		return {
			found: true,
			cancelled: false,
			reason: require_errors.formatErrorMessage(error),
			task
		};
	}
	if (registeredRuntime) {
		const cancelled = await registeredRuntime.cancelDetachedTaskRunById(params);
		if (cancelled.found) return cancelled;
	}
	return require_task_registry.cancelTaskById(params);
}
//#endregion
Object.defineProperty(exports, "cancelDetachedTaskRunById", {
	enumerable: true,
	get: function() {
		return cancelDetachedTaskRunById;
	}
});
Object.defineProperty(exports, "completeTaskRunByRunId", {
	enumerable: true,
	get: function() {
		return completeTaskRunByRunId;
	}
});
Object.defineProperty(exports, "createQueuedTaskRun", {
	enumerable: true,
	get: function() {
		return createQueuedTaskRun;
	}
});
Object.defineProperty(exports, "createRunningTaskRun", {
	enumerable: true,
	get: function() {
		return createRunningTaskRun;
	}
});
Object.defineProperty(exports, "failTaskRunByRunId", {
	enumerable: true,
	get: function() {
		return failTaskRunByRunId;
	}
});
Object.defineProperty(exports, "finalizeTaskRunById", {
	enumerable: true,
	get: function() {
		return finalizeTaskRunById;
	}
});
Object.defineProperty(exports, "finalizeTaskRunByRunId", {
	enumerable: true,
	get: function() {
		return finalizeTaskRunByRunId;
	}
});
Object.defineProperty(exports, "findTaskByRunId", {
	enumerable: true,
	get: function() {
		return findTaskByRunId;
	}
});
Object.defineProperty(exports, "listTaskRecordsUnsorted", {
	enumerable: true,
	get: function() {
		return listTaskRecordsUnsorted;
	}
});
Object.defineProperty(exports, "recordTaskRunProgressByRunId", {
	enumerable: true,
	get: function() {
		return recordTaskRunProgressByRunId;
	}
});
Object.defineProperty(exports, "setDetachedTaskDeliveryStatusByRunId", {
	enumerable: true,
	get: function() {
		return setDetachedTaskDeliveryStatusByRunId;
	}
});
Object.defineProperty(exports, "startTaskRunByRunId", {
	enumerable: true,
	get: function() {
		return startTaskRunByRunId;
	}
});
