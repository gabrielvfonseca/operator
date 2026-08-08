const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_detached_task_runtime_state = require("./detached-task-runtime-state-DhlAs-Lg.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
require("./runtime-internal-CNKl6hEH.cjs");
const require_task_executor = require("./task-executor-C0XruiLS.cjs");
const require_task_status_access = require("./task-status-access-B4LbHuEr.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/tasks/detached-task-runtime.ts
const log = require_subsystem.createSubsystemLogger("tasks/detached-runtime");
const DETACHED_TASK_RECOVERY_WARN_MS = 5e3;
function taskMatchesFindScope(task, params) {
	return task.runtime === params.runtime && task.childSessionKey === params.sessionKey && task.createdAt >= params.createdAtOrAfter && (params.createdBefore === void 0 || task.createdAt < params.createdBefore);
}
function taskMatchesFindIdentity(task, params) {
	return task.runtime === params.runtime && task.childSessionKey === params.sessionKey;
}
function findCoreTaskRun(params) {
	const direct = require_task_status_access.findTaskByRunIdForStatus(params.runId);
	if (direct && taskMatchesFindIdentity(direct, params)) return direct;
	if (params.allowSessionFallback !== true) return;
	return require_task_status_access.listTasksForSessionKeyForStatus(params.sessionKey).find((task) => taskMatchesFindScope(task, params));
}
const DEFAULT_DETACHED_TASK_LIFECYCLE_RUNTIME = {
	createQueuedTaskRun: require_task_executor.createQueuedTaskRun,
	createRunningTaskRun: require_task_executor.createRunningTaskRun,
	startTaskRunByRunId: require_task_executor.startTaskRunByRunId,
	recordTaskRunProgressByRunId: require_task_executor.recordTaskRunProgressByRunId,
	finalizeTaskRunByRunId: require_task_executor.finalizeTaskRunByRunId,
	completeTaskRunByRunId: require_task_executor.completeTaskRunByRunId,
	failTaskRunByRunId: require_task_executor.failTaskRunByRunId,
	setDetachedTaskDeliveryStatusByRunId: require_task_executor.setDetachedTaskDeliveryStatusByRunId,
	findTaskRun: findCoreTaskRun,
	cancelDetachedTaskRunById: require_task_registry.cancelTaskById
};
function getDetachedTaskLifecycleRuntime() {
	return require_detached_task_runtime_state.getRegisteredDetachedTaskLifecycleRuntime() ?? DEFAULT_DETACHED_TASK_LIFECYCLE_RUNTIME;
}
function createQueuedTaskRun(...args) {
	return getDetachedTaskLifecycleRuntime().createQueuedTaskRun(...args);
}
function createRunningTaskRun(...args) {
	return getDetachedTaskLifecycleRuntime().createRunningTaskRun(...args);
}
function startTaskRunByRunId(...args) {
	return getDetachedTaskLifecycleRuntime().startTaskRunByRunId(...args);
}
function recordTaskRunProgressByRunId(...args) {
	return getDetachedTaskLifecycleRuntime().recordTaskRunProgressByRunId(...args);
}
function finalizeTaskRunByRunId(params) {
	const runtime = getDetachedTaskLifecycleRuntime();
	if (runtime.finalizeTaskRunByRunId) return runtime.finalizeTaskRunByRunId(params);
	if (params.status === "succeeded") return runtime.completeTaskRunByRunId(params);
	return runtime.failTaskRunByRunId({
		...params,
		status: params.status
	});
}
function completeTaskRunByRunId(...args) {
	return getDetachedTaskLifecycleRuntime().completeTaskRunByRunId(...args);
}
function failTaskRunByRunId(...args) {
	return getDetachedTaskLifecycleRuntime().failTaskRunByRunId(...args);
}
function setDetachedTaskDeliveryStatusByRunId(...args) {
	return getDetachedTaskLifecycleRuntime().setDetachedTaskDeliveryStatusByRunId(...args);
}
function findDetachedTaskRun(params) {
	const runtime = getDetachedTaskLifecycleRuntime();
	if (runtime.findTaskRun) try {
		return {
			lookup: "available",
			task: runtime.findTaskRun(params)
		};
	} catch (error) {
		log.warn("Detached task lookup failed", {
			runtime: params.runtime,
			runId: params.runId,
			error
		});
		return { lookup: "unavailable" };
	}
	const coreTask = findCoreTaskRun(params);
	return coreTask ? {
		lookup: "available",
		task: coreTask
	} : { lookup: "unavailable" };
}
async function tryRecoverTaskBeforeMarkLost(params) {
	const hook = getDetachedTaskLifecycleRuntime().tryRecoverTaskBeforeMarkLost;
	if (!hook) return { recovered: false };
	const startedAt = Date.now();
	try {
		const result = await hook(params);
		const elapsedMs = Date.now() - startedAt;
		if (elapsedMs >= DETACHED_TASK_RECOVERY_WARN_MS) log.warn("Detached task recovery hook was slow", {
			taskId: params.taskId,
			runtime: params.runtime,
			elapsedMs
		});
		if (result && typeof result.recovered === "boolean") return result;
		log.warn("Detached task recovery hook returned invalid result, proceeding with markTaskLost", {
			taskId: params.taskId,
			runtime: params.runtime,
			result
		});
		return { recovered: false };
	} catch (err) {
		log.warn("Detached task recovery hook threw, proceeding with markTaskLost", {
			taskId: params.taskId,
			runtime: params.runtime,
			elapsedMs: Date.now() - startedAt,
			error: err
		});
		return { recovered: false };
	}
}
//#endregion
//#region src/tasks/task-completion-contract.ts
const PROGRESS_ONLY_PATTERN = /^(?:i(?:'|\u2019)ll|i will|i(?:'|\u2019)m|i am|i(?:'|\u2019)m going to|i am going to|let me|i need to)\s+(?:now\s+)?(?:analyz(?:e|ing)|apply|check(?:ing)?|continue|debug(?:ging)?|follow(?:ing)?\s+up|inspect(?:ing)?|investigat(?:e|ing)|look(?:ing)?(?:\s+into)?|map(?:ping)?|open(?:ing)?|read(?:ing)?|report(?:ing)?(?:\s+back)?|review(?:ing)?|run(?:ning)?|start(?:ing)?|test(?:ing)?|trace|trac(?:e|ing)|try(?:ing)?|update|verify(?:ing)?|work(?:ing)?)/i;
const BARE_PROGRESS_ONLY_PATTERN = /^(?:analyz(?:e|ing)|check(?:ing)?|debug(?:ging)?|inspect(?:ing)?|investigat(?:e|ing)|look(?:ing)?\s+into|map(?:ping)?|read(?:ing)?|report(?:ing)?\s+back|review(?:ing)?|run(?:ning)?|test(?:ing)?|trac(?:e|ing)|verify(?:ing)?|work(?:ing)?\s+on)\b/i;
const FOLLOW_UP_PLANNING_PREFIX_PATTERN = /^(?:after(?:wards|\s+that)?|from\s+there|next|once\s+(?:done|that(?:'|\u2019)?s\s+done|that\s+is\s+done)|then)[,.\s]+/i;
function normalizeCompletionText(value) {
	return value?.replace(/\s+/g, " ").trim() ?? "";
}
function normalizeCompletionFailureReason(value) {
	const normalized = normalizeCompletionText(value);
	if (!normalized) return "";
	return normalized.length <= 160 ? normalized : `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, 159)}...`;
}
function matchesProgressOnlyPrefix(value) {
	if (PROGRESS_ONLY_PATTERN.test(value) || BARE_PROGRESS_ONLY_PATTERN.test(value)) return true;
	const followup = value.replace(FOLLOW_UP_PLANNING_PREFIX_PATTERN, "").trim();
	return followup !== value && (PROGRESS_ONLY_PATTERN.test(followup) || BARE_PROGRESS_ONLY_PATTERN.test(followup));
}
function hasNonProgressFollowupSentence(value) {
	const boundary = /(?:[.!?:]|\s[-\u2013\u2014])\s+\S/.exec(value);
	if (!boundary) return false;
	const separatorEnd = boundary.index + boundary[0].length - 1;
	const firstSentence = value.slice(0, separatorEnd).trim();
	const rest = value.slice(separatorEnd).trim();
	return matchesProgressOnlyPrefix(firstSentence) && !isProgressOnlyCompletionText(rest);
}
function isProgressOnlyCompletionText(value) {
	const normalized = normalizeCompletionText(value);
	if (!normalized) return false;
	if (hasNonProgressFollowupSentence(normalized)) return false;
	return matchesProgressOnlyPrefix(normalized);
}
function resolveRequiredCompletionTerminalResult(resultText) {
	const normalized = normalizeCompletionText(resultText);
	if (!normalized) return {
		terminalOutcome: "blocked",
		terminalSummary: "Required completion did not produce a final deliverable."
	};
	if (isProgressOnlyCompletionText(normalized)) return {
		terminalOutcome: "blocked",
		terminalSummary: "Required completion ended with progress-only text, not a final deliverable."
	};
	return {};
}
function resolveRequiredCompletionDeliveryFailureTerminalResult(reason) {
	const normalizedReason = normalizeCompletionFailureReason(reason);
	return {
		terminalOutcome: "blocked",
		terminalSummary: normalizedReason ? `Required completion delivery failed before reaching the requester: ${normalizedReason}.` : "Required completion delivery failed before reaching the requester."
	};
}
//#endregion
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
Object.defineProperty(exports, "finalizeTaskRunByRunId", {
	enumerable: true,
	get: function() {
		return finalizeTaskRunByRunId;
	}
});
Object.defineProperty(exports, "findDetachedTaskRun", {
	enumerable: true,
	get: function() {
		return findDetachedTaskRun;
	}
});
Object.defineProperty(exports, "getDetachedTaskLifecycleRuntime", {
	enumerable: true,
	get: function() {
		return getDetachedTaskLifecycleRuntime;
	}
});
Object.defineProperty(exports, "recordTaskRunProgressByRunId", {
	enumerable: true,
	get: function() {
		return recordTaskRunProgressByRunId;
	}
});
Object.defineProperty(exports, "resolveRequiredCompletionDeliveryFailureTerminalResult", {
	enumerable: true,
	get: function() {
		return resolveRequiredCompletionDeliveryFailureTerminalResult;
	}
});
Object.defineProperty(exports, "resolveRequiredCompletionTerminalResult", {
	enumerable: true,
	get: function() {
		return resolveRequiredCompletionTerminalResult;
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
Object.defineProperty(exports, "tryRecoverTaskBeforeMarkLost", {
	enumerable: true,
	get: function() {
		return tryRecoverTaskBeforeMarkLost;
	}
});
