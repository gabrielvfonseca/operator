const require_store = require("./store-DCwJguwr.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_run_state = require("./run-state-lPLPf1ME.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_bash_process_registry = require("./bash-process-registry-CmxCXwAs.cjs");
const require_dispatcher_registry = require("./dispatcher-registry-oozhjSwY.cjs");
const require_active_jobs = require("./active-jobs-B43nN2RN.cjs");
const require_active_run_cancellation = require("./active-run-cancellation-MXFyFXl_.cjs");
const require_task_registry_maintenance = require("./task-registry.maintenance-CxAm7DpZ.cjs");
const require_task_restart_blocker = require("./task-restart-blocker-CeiTA6uB.cjs");
//#region src/infra/gateway-active-work.ts
const defaultInspectors = {
	getQueueSize: require_command_queue.getTotalQueueSize,
	getPendingReplies: require_dispatcher_registry.getTotalPendingReplies,
	getEmbeddedRuns: require_run_state.getActiveEmbeddedRunCount,
	getBackgroundExecSessions: require_bash_process_registry.getActiveBackgroundExecSessionCount,
	getCronRuns: () => Math.max(require_active_jobs.getActiveCronJobCount(), require_active_run_cancellation.getSuspensionVisibleCronTaskRunCount()),
	getActiveTasks: () => require_task_registry_maintenance.getInspectableActiveTaskRestartBlockers().length,
	getTaskBlockers: require_task_registry_maintenance.getInspectableActiveTaskRestartBlockers,
	getRootRequests: () => require_gateway_work_admission.getActiveGatewayRootWorkCount({ excludeCurrent: true }),
	getSessionAdmissions: require_store.getActiveSessionWorkAdmissionCount,
	getSessionMutations: require_store.getActiveSessionLifecycleMutationCount,
	getChatRuns: () => 0,
	getQueuedTurns: () => 0,
	getTerminalPersistence: () => 0,
	getTerminalSessions: () => 0
};
function normalizeCount(value) {
	return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
function createGatewayActiveWorkSnapshot(inspectors = {}) {
	const resolved = {
		...defaultInspectors,
		...inspectors
	};
	const counts = {
		queueSize: normalizeCount(resolved.getQueueSize()),
		pendingReplies: normalizeCount(resolved.getPendingReplies()),
		embeddedRuns: normalizeCount(resolved.getEmbeddedRuns()),
		backgroundExecSessions: normalizeCount(resolved.getBackgroundExecSessions()),
		cronRuns: normalizeCount(resolved.getCronRuns()),
		activeTasks: normalizeCount(resolved.getActiveTasks()),
		rootRequests: normalizeCount(resolved.getRootRequests()),
		sessionAdmissions: normalizeCount(resolved.getSessionAdmissions()),
		sessionMutations: normalizeCount(resolved.getSessionMutations()),
		chatRuns: normalizeCount(resolved.getChatRuns()),
		queuedTurns: normalizeCount(resolved.getQueuedTurns()),
		terminalPersistence: normalizeCount(resolved.getTerminalPersistence()),
		terminalSessions: normalizeCount(resolved.getTerminalSessions()),
		totalActive: 0
	};
	counts.totalActive = Object.entries(counts).reduce((total, [key, count]) => key === "totalActive" ? total : total + count, 0);
	const blockers = [];
	const add = (count, kind, message) => {
		if (count > 0) blockers.push({
			kind,
			count,
			message
		});
	};
	add(counts.queueSize, "queue", `${counts.queueSize} queued or active operation(s)`);
	add(counts.pendingReplies, "reply", `${counts.pendingReplies} pending reply delivery operation(s)`);
	add(counts.embeddedRuns, "embedded-run", `${counts.embeddedRuns} active embedded run(s)`);
	add(counts.backgroundExecSessions, "background-exec", `${counts.backgroundExecSessions} active background exec session(s)`);
	add(counts.cronRuns, "cron-run", `${counts.cronRuns} active cron run(s)`);
	add(counts.rootRequests, "root-request", `${counts.rootRequests} active gateway request(s)`);
	add(counts.sessionAdmissions, "session-admission", `${counts.sessionAdmissions} admitted session turn(s)`);
	add(counts.sessionMutations, "session-mutation", `${counts.sessionMutations} active session lifecycle mutation(s)`);
	add(counts.chatRuns, "chat-run", `${counts.chatRuns} active chat run(s)`);
	add(counts.queuedTurns, "queued-turn", `${counts.queuedTurns} queued chat turn(s)`);
	add(counts.terminalPersistence, "terminal-persistence", `${counts.terminalPersistence} pending terminal session write(s)`);
	add(counts.terminalSessions, "terminal-session", `${counts.terminalSessions} open terminal session(s)`);
	if (counts.activeTasks > 0) {
		const taskBlockers = resolved.getTaskBlockers();
		if (taskBlockers.length === 0) blockers.push({
			kind: "task",
			count: counts.activeTasks,
			message: `${counts.activeTasks} active background task run(s)`
		});
		else {
			const shownTaskBlockers = taskBlockers.slice(0, 8);
			for (const task of shownTaskBlockers) blockers.push({
				kind: "task",
				count: 1,
				message: require_task_restart_blocker.formatActiveTaskRestartBlocker(task),
				task
			});
			const omitted = counts.activeTasks - shownTaskBlockers.length;
			if (omitted > 0) blockers.push({
				kind: "task",
				count: omitted,
				message: `${omitted} additional active background task run(s)`
			});
		}
	}
	return {
		idle: counts.totalActive === 0,
		counts,
		blockers
	};
}
//#endregion
Object.defineProperty(exports, "createGatewayActiveWorkSnapshot", {
	enumerable: true,
	get: function() {
		return createGatewayActiveWorkSnapshot;
	}
});
