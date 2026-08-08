const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_plugin_state_store = require("./plugin-state-store-BnlgUGbF.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_session_chat_type_shared = require("./session-chat-type-shared-ayqPRiTg.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
const require_task_registry_store_sqlite = require("./task-registry.store.sqlite-CCfs-gtZ.cjs");
const require_task_retention = require("./task-retention-CpOj8YGB.cjs");
require("./runtime-internal-CNKl6hEH.cjs");
const require_task_registry_summary = require("./task-registry.summary-Cb3XtY1w.cjs");
const require_task_completion_contract = require("./task-completion-contract-BuZl36IV.cjs");
const require_manager = require("./manager-B5L0WDCm.cjs");
const require_subagent_recovery_state = require("./subagent-recovery-state-cp-2XAVz.cjs");
const require_task_registry_audit = require("./task-registry.audit-XhxIvYHV.cjs");
const require_active_jobs = require("./active-jobs-B43nN2RN.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/tasks/codex-native-subagent-task.ts
const CODEX_NATIVE_SUBAGENT_STALE_ERROR = "Codex native subagent stopped reporting progress";
//#endregion
//#region src/tasks/cron-history-retention.ts
const CRON_HISTORY_KEEP_PER_JOB = 2e3;
function isTerminalTask$1(task) {
	return task.status !== "queued" && task.status !== "running";
}
function collectCronHistoryOverflowTaskIds(tasks) {
	const bySource = /* @__PURE__ */ new Map();
	for (const task of tasks) {
		if (task.runtime !== "cron" || !task.sourceId || !isTerminalTask$1(task) || task.status === "lost") continue;
		const rows = bySource.get(task.sourceId) ?? [];
		rows.push(task);
		bySource.set(task.sourceId, rows);
	}
	const overflow = /* @__PURE__ */ new Set();
	for (const rows of bySource.values()) {
		rows.sort((left, right) => {
			const leftAt = left.endedAt ?? left.lastEventAt ?? left.createdAt;
			return (right.endedAt ?? right.lastEventAt ?? right.createdAt) - leftAt || right.taskId.localeCompare(left.taskId);
		});
		for (const task of rows.slice(CRON_HISTORY_KEEP_PER_JOB)) overflow.add(task.taskId);
	}
	return overflow;
}
function shouldPruneTerminalTask(task, now, cronHistoryOverflowTaskIds) {
	if (!isTerminalTask$1(task)) return false;
	if (cronHistoryOverflowTaskIds.has(task.taskId)) return true;
	const cleanupAfter = require_task_retention.resolveEffectiveTaskCleanupAfter(task);
	return cleanupAfter !== void 0 && now >= cleanupAfter;
}
//#endregion
//#region src/tasks/task-registry.maintenance.ts
var task_registry_maintenance_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	CRON_HISTORY_KEEP_PER_JOB: () => CRON_HISTORY_KEEP_PER_JOB,
	configureTaskRegistryMaintenance: () => configureTaskRegistryMaintenance,
	getInspectableActiveTaskRestartBlockers: () => getInspectableActiveTaskRestartBlockers,
	getInspectableTaskAuditFindings: () => getInspectableTaskAuditFindings,
	getInspectableTaskAuditSummary: () => getInspectableTaskAuditSummary,
	getInspectableTaskRegistrySummary: () => getInspectableTaskRegistrySummary,
	getTaskRegistryMaintenanceDiagnostics: () => getTaskRegistryMaintenanceDiagnostics,
	previewTaskRegistryMaintenance: () => previewTaskRegistryMaintenance,
	reconcileInspectableTasks: () => reconcileInspectableTasks,
	reconcileTaskLookupToken: () => reconcileTaskLookupToken,
	resetTaskRegistryMaintenanceRuntimeForTests: () => resetTaskRegistryMaintenanceRuntimeForTests,
	runTaskRegistryMaintenance: () => runTaskRegistryMaintenance,
	setTaskRegistryMaintenanceRuntimeForTests: () => setTaskRegistryMaintenanceRuntimeForTests,
	startTaskRegistryMaintenance: () => startTaskRegistryMaintenance,
	stopTaskRegistryMaintenance: () => stopTaskRegistryMaintenance,
	sweepTaskRegistry: () => sweepTaskRegistry
});
const log = require_subsystem.createSubsystemLogger("tasks/task-registry-maintenance");
const TASK_RECONCILE_GRACE_MS = 5 * 6e4;
const CHILDLESS_NATIVE_SUBAGENT_RECONCILE_GRACE_MS = 30 * 6e4;
const TASK_STALE_RUNNING_MS = 30 * 6e4;
const TASK_SWEEP_INTERVAL_MS = 6e4;
/**
* Number of tasks to process before yielding to the event loop.
* Keeps the main thread responsive during large sweeps.
*/
const SWEEP_YIELD_BATCH_SIZE = 25;
let sweeper = null;
let deferredSweep = null;
let sweepInProgress = false;
let configuredRuntimeAuthoritative = false;
const defaultTaskRegistryMaintenanceRuntime = {
	listAcpSessionEntries: require_session_meta.listAcpSessionEntries,
	readAcpSessionEntry: require_session_meta.readAcpSessionEntry,
	closeAcpSession: async ({ cfg, sessionKey, reason }) => {
		await require_manager.getAcpSessionManager().closeSession({
			cfg,
			sessionKey,
			reason,
			discardPersistentState: true,
			clearMeta: true,
			allowBackendUnavailable: true,
			requireAcpSession: false
		});
	},
	listSessionBindingsBySession: (sessionKey) => require_session_binding_service.getSessionBindingService().listBySession(sessionKey),
	unbindSessionBindings: (input) => require_session_binding_service.getSessionBindingService().unbind(input),
	listSessionEntries: require_session_accessor.listSessionEntries,
	resolveStorePath: require_paths.resolveStorePath,
	deriveSessionChatTypeFromKey: require_session_chat_type_shared.deriveSessionChatTypeFromKey,
	isCronJobActive: require_active_jobs.isCronJobActive,
	getAgentRunContext: require_agent_events.getAgentRunContext,
	hasActiveAcpTurn: require_manager.isAcpTurnActive,
	parseAgentSessionKey: require_session_key.parseAgentSessionKey,
	hasActiveTaskForChildSessionKey: require_task_registry.hasActiveTaskForChildSessionKey,
	deleteTaskRecordById: require_task_registry.deleteTaskRecordById,
	ensureTaskRegistryReady: require_task_registry.ensureTaskRegistryReady,
	getTaskById: require_task_registry.getTaskById,
	listTaskRecords: require_task_registry.listTaskRecords,
	markTaskLostById: require_task_registry.markTaskLostById,
	markTaskTerminalById: require_task_registry.markTaskTerminalById,
	maybeDeliverTaskTerminalUpdate: require_task_registry.maybeDeliverTaskTerminalUpdate,
	resolveTaskForLookupToken: require_task_registry.resolveTaskForLookupToken,
	setTaskCleanupAfterById: require_task_registry.setTaskCleanupAfterById,
	isRuntimeAuthoritative: () => configuredRuntimeAuthoritative,
	listTaskRegistryRecordsByRuntimeSourceIdFromSqlite: require_task_registry_store_sqlite.listTaskRegistryRecordsByRuntimeSourceIdFromSqlite
};
let taskRegistryMaintenanceRuntime = defaultTaskRegistryMaintenanceRuntime;
function createCronRecoveryContext() {
	return { taskRowsByJobId: /* @__PURE__ */ new Map() };
}
function createBackingSessionLookupContext() {
	return {
		sessionEntriesByPath: /* @__PURE__ */ new Map(),
		sessionChatTypesByKey: /* @__PURE__ */ new Map()
	};
}
function buildSessionEntryLookup(entries) {
	return { entriesByKey: new Map(entries.map(({ sessionKey, entry }) => [sessionKey, entry])) };
}
function getSessionEntryLookup(storePath, context) {
	if (!context) return buildSessionEntryLookup(taskRegistryMaintenanceRuntime.listSessionEntries({ storePath }));
	const cached = context.sessionEntriesByPath.get(storePath);
	if (cached) return cached;
	const lookup = buildSessionEntryLookup(taskRegistryMaintenanceRuntime.listSessionEntries({ storePath }));
	context.sessionEntriesByPath.set(storePath, lookup);
	return lookup;
}
function findSessionEntryByKey(lookup, sessionKey) {
	return lookup.entriesByKey.get(sessionKey);
}
function resolveSessionChatType(sessionKey, context) {
	const derive = taskRegistryMaintenanceRuntime.deriveSessionChatTypeFromKey ?? require_session_chat_type_shared.deriveSessionChatTypeFromKey;
	if (!context) return derive(sessionKey);
	const cached = context.sessionChatTypesByKey.get(sessionKey);
	if (cached) return cached;
	const chatType = derive(sessionKey);
	context.sessionChatTypesByKey.set(sessionKey, chatType);
	return chatType;
}
function findTaskSessionEntry(task, context) {
	const childSessionKey = task.childSessionKey?.trim();
	if (!childSessionKey) return;
	const agentId = taskRegistryMaintenanceRuntime.parseAgentSessionKey(childSessionKey)?.agentId;
	return findSessionEntryByKey(getSessionEntryLookup(taskRegistryMaintenanceRuntime.resolveStorePath(void 0, { agentId }), context), childSessionKey);
}
function isActiveTask(task) {
	return task.status === "queued" || task.status === "running";
}
function isTerminalTask(task) {
	return !isActiveTask(task);
}
function hasLostGraceExpired(task, now) {
	const referenceAt = task.lastEventAt ?? task.startedAt ?? task.createdAt;
	const graceMs = require_task_registry.isChildlessNativeSubagentTask(task) ? CHILDLESS_NATIVE_SUBAGENT_RECONCILE_GRACE_MS : TASK_RECONCILE_GRACE_MS;
	return now - referenceAt >= graceMs;
}
function isRecoverableLostCronTask(task) {
	if (task.status !== "lost") return false;
	const error = task.error?.trim().toLowerCase();
	return Boolean(error?.includes("backing session missing"));
}
function isCronTerminalTaskStatus(status) {
	return status === "succeeded" || status === "failed" || status === "timed_out" || status === "cancelled";
}
function getCronTaskRows(context, jobId) {
	const cached = context.taskRowsByJobId.get(jobId);
	if (cached) return cached;
	let rows;
	try {
		rows = taskRegistryMaintenanceRuntime.listTaskRegistryRecordsByRuntimeSourceIdFromSqlite({
			runtime: "cron",
			sourceId: jobId
		});
	} catch {
		rows = [];
	}
	context.taskRowsByJobId.set(jobId, rows);
	return rows;
}
function resolveDurableCronTaskRecovery(task, context) {
	if (task.runtime !== "cron" || !isActiveTask(task) && !isRecoverableLostCronTask(task)) return;
	const jobId = task.sourceId?.trim();
	if (!jobId) return;
	if (taskRegistryMaintenanceRuntime.isRuntimeAuthoritative() && taskRegistryMaintenanceRuntime.isCronJobActive(jobId)) return;
	const row = getCronTaskRows(context, jobId).find((candidate) => candidate.taskId === task.taskId || Boolean(task.runId?.trim()) && candidate.runId === task.runId);
	if (!row || !isCronTerminalTaskStatus(row.status)) return;
	const endedAt = row.endedAt ?? row.lastEventAt ?? row.createdAt;
	return {
		status: row.status,
		endedAt,
		lastEventAt: row.lastEventAt ?? endedAt,
		...row.error !== void 0 ? { error: row.error } : {},
		...row.terminalSummary !== void 0 ? { terminalSummary: row.terminalSummary } : {},
		...row.detail !== void 0 ? { detail: row.detail } : {}
	};
}
function hasActiveCliRun(task) {
	const candidateRunIds = [task.sourceId, task.runId];
	for (const candidate of candidateRunIds) {
		const runId = candidate?.trim();
		if (runId && taskRegistryMaintenanceRuntime.getAgentRunContext(runId)) return true;
	}
	return false;
}
function hasCliRunIdentity(task) {
	return [task.sourceId, task.runId].some((candidate) => Boolean(candidate?.trim()));
}
function hasBackingSession(task, context) {
	if (task.runtime === "cron") {
		if (!taskRegistryMaintenanceRuntime.isRuntimeAuthoritative()) return true;
		const jobId = task.sourceId?.trim();
		return jobId ? taskRegistryMaintenanceRuntime.isCronJobActive(jobId) : false;
	}
	if (task.runtime === "cli" && hasActiveCliRun(task)) return true;
	if (task.runtime === "cli" && hasCliRunIdentity(task)) return false;
	const childSessionKey = task.childSessionKey?.trim();
	if (!childSessionKey) return !require_task_registry.isChildlessNativeSubagentTask(task);
	if (task.runtime === "acp") {
		if (!taskRegistryMaintenanceRuntime.isRuntimeAuthoritative()) return true;
		return taskRegistryMaintenanceRuntime.hasActiveAcpTurn(childSessionKey);
	}
	if (task.runtime === "subagent" || task.runtime === "cli") {
		if (task.runtime === "cli") {
			const chatType = resolveSessionChatType(childSessionKey, context);
			if (chatType === "channel" || chatType === "group" || chatType === "direct") return false;
		}
		const entry = findTaskSessionEntry(task, context);
		if (task.runtime === "subagent" && require_subagent_recovery_state.isSubagentRecoveryWedgedEntry(entry)) return false;
		return Boolean(entry);
	}
	return true;
}
function resolveTaskLostError(task, context) {
	const nativeDefinition = require_task_registry.resolveChildlessNativeSubagentTaskDefinition(task);
	if (nativeDefinition) return nativeDefinition.taskKind === "codex-native" ? CODEX_NATIVE_SUBAGENT_STALE_ERROR : "Native subagent stopped reporting progress";
	if (task.runtime === "subagent") {
		const entry = findTaskSessionEntry(task, context);
		if (entry && require_subagent_recovery_state.isSubagentRecoveryWedgedEntry(entry)) return require_subagent_recovery_state.formatSubagentRecoveryWedgedReason(entry);
	}
	return "backing session missing";
}
function shouldMarkLost(task, now, context) {
	if (!isActiveTask(task)) return false;
	if (!hasLostGraceExpired(task, now)) return false;
	return !hasBackingSession(task, context);
}
function hasTaskLostDecisionInputChanged(before, after) {
	return before.status !== after.status || before.runtime !== after.runtime || before.childSessionKey !== after.childSessionKey || before.sourceId !== after.sourceId || before.runId !== after.runId || before.createdAt !== after.createdAt || before.startedAt !== after.startedAt || before.lastEventAt !== after.lastEventAt;
}
function hasDetachedTaskRecoveryHook() {
	return Boolean(require_task_completion_contract.getDetachedTaskLifecycleRuntime().tryRecoverTaskBeforeMarkLost);
}
function shouldStampCleanupAfter(task) {
	return isTerminalTask(task) && typeof task.cleanupAfter !== "number" && require_task_retention.resolveTaskCleanupAfter(task) !== void 0;
}
function resolveCleanupAfter(task) {
	return require_task_retention.resolveTaskCleanupAfter(task);
}
function taskReferenceAt(task) {
	return task.lastEventAt ?? task.startedAt ?? task.createdAt;
}
function getNormalizedTaskChildSessionKey(task) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task.childSessionKey);
}
function getAcpSessionParentKeys(acpEntry) {
	return [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(acpEntry.entry?.spawnedBy), (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(acpEntry.entry?.parentSessionKey)].filter((value) => Boolean(value));
}
function isParentOwnedAcpSessionTask(task, acpEntry) {
	const entry = acpEntry?.entry;
	if (!entry) return false;
	const ownerKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task.ownerKey);
	const requesterKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(task.requesterSessionKey);
	return getAcpSessionParentKeys({ entry }).some((parentKey) => parentKey === ownerKey || parentKey === requesterKey);
}
function isParentOwnedAcpSessionEntry(acpEntry) {
	return getAcpSessionParentKeys(acpEntry).length > 0;
}
function hasActiveSessionBinding(sessionKey) {
	const listBindings = taskRegistryMaintenanceRuntime.listSessionBindingsBySession;
	if (!listBindings) return true;
	try {
		return listBindings(sessionKey).some((binding) => binding.status !== "ended");
	} catch {
		return true;
	}
}
function shouldCloseTerminalAcpSession(task) {
	if (task.runtime !== "acp" || isActiveTask(task)) return false;
	const sessionKey = getNormalizedTaskChildSessionKey(task);
	if (!sessionKey || taskRegistryMaintenanceRuntime.hasActiveTaskForChildSessionKey({
		sessionKey,
		excludeTaskId: task.taskId
	})) return false;
	const acpEntry = taskRegistryMaintenanceRuntime.readAcpSessionEntry({
		sessionKey,
		clone: false
	});
	if (!acpEntry || acpEntry.storeReadFailed || !acpEntry.acp) return false;
	if (!isParentOwnedAcpSessionTask(task, acpEntry)) return false;
	if (acpEntry.acp.mode === "oneshot") return true;
	return !hasActiveSessionBinding(sessionKey);
}
function shouldCloseOrphanedParentOwnedAcpSession(acpEntry) {
	if (!acpEntry.entry || !acpEntry.acp || !isParentOwnedAcpSessionEntry(acpEntry)) return false;
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(acpEntry.sessionKey);
	if (!sessionKey || taskRegistryMaintenanceRuntime.hasActiveTaskForChildSessionKey({ sessionKey })) return false;
	if (acpEntry.acp.mode === "oneshot") return true;
	return !hasActiveSessionBinding(sessionKey);
}
async function cleanupTerminalAcpSession(task) {
	if (!shouldCloseTerminalAcpSession(task)) return;
	const sessionKey = getNormalizedTaskChildSessionKey(task);
	if (!sessionKey) return;
	const acpEntry = taskRegistryMaintenanceRuntime.readAcpSessionEntry({
		sessionKey,
		clone: false
	});
	const closeAcpSession = taskRegistryMaintenanceRuntime.closeAcpSession;
	if (!acpEntry || !closeAcpSession) return;
	try {
		await closeAcpSession({
			cfg: acpEntry.cfg,
			sessionKey,
			reason: "terminal-task-cleanup"
		});
	} catch (error) {
		log.warn("Failed to close terminal ACP session during task maintenance", {
			sessionKey,
			taskId: task.taskId,
			error
		});
		return;
	}
	try {
		await taskRegistryMaintenanceRuntime.unbindSessionBindings?.({
			targetSessionKey: sessionKey,
			reason: "terminal-task-cleanup"
		});
	} catch (error) {
		log.warn("Failed to unbind terminal ACP session during task maintenance", {
			sessionKey,
			taskId: task.taskId,
			error
		});
	}
}
async function cleanupOrphanedParentOwnedAcpSessions() {
	let acpSessions;
	try {
		acpSessions = await taskRegistryMaintenanceRuntime.listAcpSessionEntries({ clone: false });
	} catch (error) {
		log.warn("Failed to list ACP sessions during task maintenance", { error });
		return;
	}
	const seenSessionKeys = /* @__PURE__ */ new Set();
	for (const acpEntry of acpSessions) {
		const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(acpEntry.sessionKey);
		if (!sessionKey || seenSessionKeys.has(sessionKey)) continue;
		seenSessionKeys.add(sessionKey);
		if (!shouldCloseOrphanedParentOwnedAcpSession(acpEntry)) continue;
		const closeAcpSession = taskRegistryMaintenanceRuntime.closeAcpSession;
		if (!closeAcpSession) continue;
		try {
			await closeAcpSession({
				cfg: acpEntry.cfg,
				sessionKey,
				reason: "orphaned-parent-task-cleanup"
			});
		} catch (error) {
			log.warn("Failed to close orphaned parent-owned ACP session during task maintenance", {
				sessionKey,
				error
			});
			continue;
		}
		try {
			await taskRegistryMaintenanceRuntime.unbindSessionBindings?.({
				targetSessionKey: sessionKey,
				reason: "orphaned-parent-task-cleanup"
			});
		} catch (error) {
			log.warn("Failed to unbind orphaned parent-owned ACP session during task maintenance", {
				sessionKey,
				error
			});
		}
	}
}
function markTaskLost(task, now, context) {
	const lostAt = task.endedAt ?? now;
	const cleanupAfter = require_task_retention.resolveEffectiveTaskCleanupAfter({
		...task,
		status: "lost",
		endedAt: lostAt
	});
	const updated = taskRegistryMaintenanceRuntime.markTaskLostById({
		taskId: task.taskId,
		endedAt: lostAt,
		lastEventAt: now,
		error: task.error ?? resolveTaskLostError(task, context),
		cleanupAfter
	}) ?? task;
	taskRegistryMaintenanceRuntime.maybeDeliverTaskTerminalUpdate(updated.taskId);
	return updated;
}
function markTaskRecovered(task, recovery) {
	const updated = taskRegistryMaintenanceRuntime.markTaskTerminalById({
		taskId: task.taskId,
		status: recovery.status,
		endedAt: recovery.endedAt,
		lastEventAt: recovery.lastEventAt,
		error: recovery.error,
		...recovery.terminalSummary !== void 0 ? {
			terminalSummary: recovery.terminalSummary,
			preserveTerminalSummary: true
		} : {},
		...recovery.detail !== void 0 ? { detail: recovery.detail } : {}
	}) ?? projectTaskRecovered(task, recovery);
	taskRegistryMaintenanceRuntime.maybeDeliverTaskTerminalUpdate(updated.taskId);
	return updated;
}
function projectTaskRecovered(task, recovery) {
	const projected = {
		...task,
		status: recovery.status,
		endedAt: recovery.endedAt,
		lastEventAt: recovery.lastEventAt,
		error: recovery.error,
		...recovery.terminalSummary !== void 0 ? { terminalSummary: recovery.terminalSummary } : {},
		...recovery.detail !== void 0 ? { detail: recovery.detail } : {}
	};
	if (recovery.error === void 0) delete projected.error;
	return {
		...projected,
		...typeof projected.cleanupAfter === "number" ? {} : { cleanupAfter: resolveCleanupAfter(projected) }
	};
}
function projectTaskLost(task, now, context) {
	const projected = {
		...task,
		status: "lost",
		endedAt: task.endedAt ?? now,
		lastEventAt: now,
		error: task.error ?? resolveTaskLostError(task, context)
	};
	return {
		...projected,
		...typeof projected.cleanupAfter === "number" ? {} : { cleanupAfter: resolveCleanupAfter(projected) }
	};
}
function reconcileTaskRecordForOperatorInspectionWithContexts(task, context, backingSessionContext) {
	const cronRecovery = resolveDurableCronTaskRecovery(task, context);
	if (cronRecovery) return projectTaskRecovered(task, cronRecovery);
	const now = Date.now();
	if (!shouldMarkLost(task, now, backingSessionContext)) return task;
	return projectTaskLost(task, now, backingSessionContext);
}
function reconcileTaskRecordForOperatorInspection(task, context = createCronRecoveryContext()) {
	return reconcileTaskRecordForOperatorInspectionWithContexts(task, context, createBackingSessionLookupContext());
}
function reconcileInspectableTasks() {
	taskRegistryMaintenanceRuntime.ensureTaskRegistryReady();
	const cronRecoveryContext = createCronRecoveryContext();
	const backingSessionContext = createBackingSessionLookupContext();
	return taskRegistryMaintenanceRuntime.listTaskRecords().map((task) => reconcileTaskRecordForOperatorInspectionWithContexts(task, cronRecoveryContext, backingSessionContext));
}
require_task_registry_audit.configureTaskAuditTaskProvider(reconcileInspectableTasks);
function isActiveTaskRestartBlockerStatus(status) {
	return status === "running";
}
function isTaskRestartBlocker(task) {
	return isActiveTaskRestartBlockerStatus(task.status) && !task.endedAt;
}
function getInspectableActiveTaskRestartBlockers() {
	const blockers = [];
	for (const task of reconcileInspectableTasks()) {
		if (!isTaskRestartBlocker(task)) continue;
		const blocker = {
			taskId: task.taskId,
			status: task.status,
			runtime: task.runtime
		};
		if (task.runId) blocker.runId = task.runId;
		if (task.label) blocker.label = task.label;
		if (task.task) blocker.title = task.task;
		blockers.push(blocker);
	}
	return blockers;
}
function getInspectableTaskRegistrySummary(tasks = reconcileInspectableTasks()) {
	return require_task_registry_summary.summarizeTaskRecords(tasks);
}
function getInspectableTaskAuditSummary() {
	return require_task_registry_audit.summarizeTaskAuditFindings(getInspectableTaskAuditFindings());
}
function getInspectableTaskAuditFindings(tasks = reconcileInspectableTasks()) {
	return require_task_registry_audit.listTaskAuditFindings({ tasks });
}
function reconcileTaskLookupToken(token) {
	taskRegistryMaintenanceRuntime.ensureTaskRegistryReady();
	const task = taskRegistryMaintenanceRuntime.resolveTaskForLookupToken(token);
	return task ? reconcileTaskRecordForOperatorInspection(task) : void 0;
}
function previewTaskRegistryMaintenance() {
	taskRegistryMaintenanceRuntime.ensureTaskRegistryReady();
	const now = Date.now();
	let reconciled = 0;
	let recovered = 0;
	let cleanupStamped = 0;
	let pruned = 0;
	const cronRecoveryContext = createCronRecoveryContext();
	const backingSessionContext = createBackingSessionLookupContext();
	const tasks = taskRegistryMaintenanceRuntime.listTaskRecords();
	const cronHistoryOverflowTaskIds = collectCronHistoryOverflowTaskIds(tasks);
	for (const task of tasks) {
		if (resolveDurableCronTaskRecovery(task, cronRecoveryContext)) {
			recovered += 1;
			continue;
		}
		if (shouldMarkLost(task, now, backingSessionContext)) {
			reconciled += 1;
			continue;
		}
		if (shouldPruneTerminalTask(task, now, cronHistoryOverflowTaskIds)) {
			pruned += 1;
			continue;
		}
		if (shouldStampCleanupAfter(task)) cleanupStamped += 1;
	}
	return {
		reconciled,
		recovered,
		cleanupStamped,
		pruned
	};
}
function explainActiveTaskRetention(params) {
	if (!hasLostGraceExpired(params.task, params.now)) return {
		decision: "retained",
		reason: "lost_grace_pending"
	};
	if (params.task.runtime === "subagent") {
		const entry = findTaskSessionEntry(params.task, params.context);
		if (entry && require_subagent_recovery_state.isSubagentRecoveryWedgedEntry(entry)) return {
			decision: "would_reconcile",
			reason: "subagent_recovery_wedged",
			detail: require_subagent_recovery_state.formatSubagentRecoveryWedgedReason(entry)
		};
	}
	if (!hasBackingSession(params.task, params.context)) return {
		decision: "would_reconcile",
		reason: "backing_session_missing"
	};
	if (params.task.runtime === "cron" && !taskRegistryMaintenanceRuntime.isRuntimeAuthoritative()) return {
		decision: "retained",
		reason: "cron_runtime_not_authoritative"
	};
	if (params.task.runtime === "acp" && !taskRegistryMaintenanceRuntime.isRuntimeAuthoritative()) return {
		decision: "retained",
		reason: "acp_runtime_not_authoritative"
	};
	if (params.task.runtime === "cli" && hasActiveCliRun(params.task)) return {
		decision: "retained",
		reason: "active_cli_run"
	};
	return {
		decision: "retained",
		reason: "backing_session_present"
	};
}
function getTaskRegistryMaintenanceDiagnostics() {
	taskRegistryMaintenanceRuntime.ensureTaskRegistryReady();
	const now = Date.now();
	const cronRecoveryContext = createCronRecoveryContext();
	const backingSessionContext = createBackingSessionLookupContext();
	const staleRunningTasks = [];
	for (const task of taskRegistryMaintenanceRuntime.listTaskRecords()) {
		if (task.status !== "running") continue;
		const ageMs = Math.max(0, now - taskReferenceAt(task));
		if (ageMs < TASK_STALE_RUNNING_MS) continue;
		if (resolveDurableCronTaskRecovery(task, cronRecoveryContext)) continue;
		const decision = explainActiveTaskRetention({
			task,
			now,
			context: backingSessionContext
		});
		staleRunningTasks.push({
			taskId: task.taskId,
			runtime: task.runtime,
			status: task.status,
			decision: decision.decision,
			reason: decision.reason,
			ageMs,
			...decision.detail ? { detail: decision.detail } : {},
			...task.childSessionKey ? { childSessionKey: task.childSessionKey } : {},
			...task.runId ? { runId: task.runId } : {}
		});
	}
	return { staleRunningTasks };
}
/**
* Yield control back to the event loop so that pending I/O callbacks,
* timers, and incoming requests can be processed between batches of
* synchronous task-registry maintenance work.
*/
function yieldToEventLoop() {
	return new Promise((resolve) => {
		setImmediate(resolve);
	});
}
function startScheduledSweep() {
	if (sweepInProgress) return;
	sweepInProgress = true;
	const clearSweepInProgress = () => {
		sweepInProgress = false;
	};
	require_gateway_work_admission.runWithGatewayIndependentRootWorkAdmission(async () => {
		await sweepTaskRegistry();
	}).then(clearSweepInProgress, clearSweepInProgress);
}
async function runTaskRegistryMaintenance() {
	taskRegistryMaintenanceRuntime.ensureTaskRegistryReady();
	const now = Date.now();
	let reconciled = 0;
	let recovered = 0;
	let cleanupStamped = 0;
	let pruned = 0;
	const tasks = taskRegistryMaintenanceRuntime.listTaskRecords();
	const cronHistoryOverflowTaskIds = collectCronHistoryOverflowTaskIds(tasks);
	const cronRecoveryContext = createCronRecoveryContext();
	const backingSessionContext = createBackingSessionLookupContext();
	const recoveryHookRegistered = hasDetachedTaskRecoveryHook();
	let processed = 0;
	for (const task of tasks) {
		const current = taskRegistryMaintenanceRuntime.getTaskById(task.taskId);
		if (!current) continue;
		const cronRecovery = resolveDurableCronTaskRecovery(current, cronRecoveryContext);
		if (cronRecovery) {
			if (markTaskRecovered(current, cronRecovery).status !== current.status) recovered += 1;
			processed += 1;
			if (processed % SWEEP_YIELD_BATCH_SIZE === 0) await yieldToEventLoop();
			continue;
		}
		if (shouldMarkLost(current, now, backingSessionContext)) {
			const recovery = await require_task_completion_contract.tryRecoverTaskBeforeMarkLost({
				taskId: current.taskId,
				runtime: current.runtime,
				task: current,
				now
			});
			const freshAfterHook = taskRegistryMaintenanceRuntime.getTaskById(current.taskId);
			if (!freshAfterHook) {
				processed += 1;
				if (processed % SWEEP_YIELD_BATCH_SIZE === 0) await yieldToEventLoop();
				continue;
			}
			const shouldRecheckFreshTask = recoveryHookRegistered || hasTaskLostDecisionInputChanged(current, freshAfterHook);
			let lostContext = backingSessionContext;
			if (shouldRecheckFreshTask) {
				lostContext = createBackingSessionLookupContext();
				if (!shouldMarkLost(freshAfterHook, now, lostContext)) {
					processed += 1;
					if (processed % SWEEP_YIELD_BATCH_SIZE === 0) await yieldToEventLoop();
					continue;
				}
			}
			if (recovery.recovered) {
				recovered += 1;
				processed += 1;
				if (processed % SWEEP_YIELD_BATCH_SIZE === 0) await yieldToEventLoop();
				continue;
			}
			if (markTaskLost(freshAfterHook, now, lostContext).status === "lost") reconciled += 1;
			processed += 1;
			if (processed % SWEEP_YIELD_BATCH_SIZE === 0) await yieldToEventLoop();
			continue;
		}
		await cleanupTerminalAcpSession(current);
		if (shouldPruneTerminalTask(current, now, cronHistoryOverflowTaskIds) && taskRegistryMaintenanceRuntime.deleteTaskRecordById(current.taskId)) {
			pruned += 1;
			processed += 1;
			if (processed % SWEEP_YIELD_BATCH_SIZE === 0) await yieldToEventLoop();
			continue;
		}
		if (shouldStampCleanupAfter(current)) {
			const cleanupAfter = resolveCleanupAfter(current);
			if (cleanupAfter !== void 0 && taskRegistryMaintenanceRuntime.setTaskCleanupAfterById({
				taskId: current.taskId,
				cleanupAfter
			})) cleanupStamped += 1;
		}
		processed += 1;
		if (processed % SWEEP_YIELD_BATCH_SIZE === 0) await yieldToEventLoop();
	}
	await cleanupOrphanedParentOwnedAcpSessions();
	if (require_plugin_state_store.isPluginStateDatabaseOpen()) try {
		require_plugin_state_store.sweepExpiredPluginStateEntries();
	} catch (error) {
		log.warn("Failed to sweep expired plugin state entries", { error });
	}
	return {
		reconciled,
		recovered,
		cleanupStamped,
		pruned
	};
}
async function sweepTaskRegistry() {
	return runTaskRegistryMaintenance();
}
function startTaskRegistryMaintenance() {
	taskRegistryMaintenanceRuntime.ensureTaskRegistryReady();
	deferredSweep = setTimeout(() => {
		deferredSweep = null;
		startScheduledSweep();
	}, 5e3);
	deferredSweep.unref?.();
	if (sweeper) return;
	sweeper = setInterval(startScheduledSweep, TASK_SWEEP_INTERVAL_MS);
	sweeper.unref?.();
}
function stopTaskRegistryMaintenance() {
	if (deferredSweep) {
		clearTimeout(deferredSweep);
		deferredSweep = null;
	}
	if (sweeper) {
		clearInterval(sweeper);
		sweeper = null;
	}
	sweepInProgress = false;
}
function setTaskRegistryMaintenanceRuntimeForTests(runtime) {
	taskRegistryMaintenanceRuntime = runtime;
}
function resetTaskRegistryMaintenanceRuntimeForTests() {
	taskRegistryMaintenanceRuntime = defaultTaskRegistryMaintenanceRuntime;
	configuredRuntimeAuthoritative = false;
}
function configureTaskRegistryMaintenance(options) {
	if (options?.runtimeAuthoritative !== void 0) configuredRuntimeAuthoritative = options.runtimeAuthoritative;
}
//#endregion
Object.defineProperty(exports, "getInspectableActiveTaskRestartBlockers", {
	enumerable: true,
	get: function() {
		return getInspectableActiveTaskRestartBlockers;
	}
});
Object.defineProperty(exports, "task_registry_maintenance_exports", {
	enumerable: true,
	get: function() {
		return task_registry_maintenance_exports;
	}
});
