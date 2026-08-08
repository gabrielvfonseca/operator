require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
require("./runtime-internal-CNKl6hEH.cjs");
const require_task_executor = require("./task-executor-C0XruiLS.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_task_summary = require("./task-summary-DF5_WpVN.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-methods/tasks.ts
const DEFAULT_TASKS_LIST_LIMIT = 100;
const MAX_TASKS_LIST_LIMIT = 500;
const LEDGER_STATUS_TO_TASK_STATUSES = {
	queued: ["queued"],
	running: ["running"],
	completed: ["succeeded"],
	failed: ["failed", "lost"],
	timed_out: ["timed_out"],
	cancelled: ["cancelled"]
};
function normalizeTaskStatusFilter(status) {
	if (!status) return null;
	return new Set((Array.isArray(status) ? status : [status]).flatMap((value) => LEDGER_STATUS_TO_TASK_STATUSES[value] ?? []));
}
function taskMatchesSession(task, sessionKey) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey);
	if (!normalized) return true;
	return [
		task.requesterSessionKey,
		task.childSessionKey,
		task.ownerKey
	].some((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate) === normalized);
}
function taskMatchesAgent(task, agentId) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentId);
	if (!normalized) return true;
	const explicitAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task.agentId);
	if (explicitAgentId) return explicitAgentId === normalized;
	return [
		task.requesterSessionKey,
		task.childSessionKey,
		task.ownerKey
	].some((candidate) => require_session_key.parseAgentSessionKey(candidate)?.agentId === normalized);
}
function parseCursor(cursor) {
	if (!cursor) return 0;
	if (!/^\d+$/.test(cursor.trim())) return null;
	const parsed = Number(cursor);
	return Number.isSafeInteger(parsed) ? parsed : null;
}
const tasksHandlers = {
	"tasks.list": ({ params, respond }) => {
		if (!require_src.validateTasksListParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid tasks.list params: ${require_validation_errors.formatValidationErrors(require_src.validateTasksListParams.errors)}`));
			return;
		}
		const cursor = parseCursor(params.cursor);
		if (cursor === null) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid tasks.list cursor"));
			return;
		}
		const statusFilter = normalizeTaskStatusFilter(params.status);
		const limit = Math.min(params.limit ?? DEFAULT_TASKS_LIST_LIMIT, MAX_TASKS_LIST_LIMIT);
		const filtered = require_task_registry.listTaskRecordsUnsorted().filter((task) => {
			if (statusFilter && !statusFilter.has(task.status)) return false;
			return taskMatchesAgent(task, params.agentId) && taskMatchesSession(task, params.sessionKey);
		}).toSorted((left, right) => {
			const updatedDiff = require_task_summary.taskUpdatedAt(right) - require_task_summary.taskUpdatedAt(left);
			if (updatedDiff !== 0) return updatedDiff;
			return left.taskId < right.taskId ? -1 : left.taskId > right.taskId ? 1 : 0;
		});
		const page = filtered.slice(cursor, cursor + limit);
		const nextOffset = cursor + page.length;
		respond(true, {
			tasks: page.map((task) => require_task_summary.mapTaskSummary(task)),
			...nextOffset < filtered.length ? { nextCursor: String(nextOffset) } : {}
		});
	},
	"tasks.get": ({ params, respond }) => {
		if (!require_src.validateTasksGetParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid tasks.get params: ${require_validation_errors.formatValidationErrors(require_src.validateTasksGetParams.errors)}`));
			return;
		}
		const taskId = params.taskId;
		const task = require_task_registry.getTaskById(taskId);
		if (!task) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `task not found: ${taskId}`));
			return;
		}
		respond(true, { task: require_task_summary.mapTaskSummary(task) });
	},
	"tasks.cancel": async ({ params, respond, context }) => {
		if (!require_src.validateTasksCancelParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid tasks.cancel params: ${require_validation_errors.formatValidationErrors(require_src.validateTasksCancelParams.errors)}`));
			return;
		}
		const taskId = params.taskId;
		const reason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.reason);
		const result = await require_task_executor.cancelDetachedTaskRunById({
			cfg: context.getRuntimeConfig(),
			taskId,
			...reason ? { reason } : {}
		});
		respond(true, {
			found: result.found,
			cancelled: result.cancelled,
			...result.reason ? { reason: result.reason } : {},
			...result.task ? { task: require_task_summary.mapTaskSummary(result.task) } : {}
		});
	}
};
const testApi = { mapTaskSummary: require_task_summary.mapTaskSummary };
//#endregion
exports.__test = testApi;
exports.testApi = testApi;
exports.tasksHandlers = tasksHandlers;
