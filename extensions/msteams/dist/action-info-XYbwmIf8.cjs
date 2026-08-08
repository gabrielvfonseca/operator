require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_format_relative = require("./format-relative-DEaTzxP-.cjs");
const require_task_status = require("./task-status-CjWQHsl4.cjs");
const require_task_owner_access = require("./task-owner-access-C26i741X.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_subagent_registry_state = require("./subagent-registry-state-Cb8uurME.cjs");
const require_subagents_utils = require("./subagents-utils-DU8qD7dC.cjs");
require("./subagents-format-CR10Nst3.cjs");
const require_shared = require("./shared-DZ6zsntB.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/auto-reply/reply/commands-subagents/action-info.ts
function formatTimestampWithAge(valueMs) {
	if (!valueMs || !Number.isFinite(valueMs) || valueMs <= 0) return "n/a";
	const timestamp = (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoString)(valueMs);
	if (!timestamp) return "n/a";
	return `${timestamp} (${require_format_relative.formatTimeAgo(Date.now() - valueMs, { fallback: "n/a" })})`;
}
function resolveDisplayStatus(entry, options) {
	const pendingDescendants = Math.max(0, options?.pendingDescendants ?? 0);
	if (pendingDescendants > 0) return `active (waiting on ${pendingDescendants} ${pendingDescendants === 1 ? "child" : "children"})`;
	const status = require_subagents_utils.formatRunStatus(entry);
	return status === "error" ? "failed" : status;
}
function loadSubagentSessionEntry(params, childKey) {
	const parsed = require_session_key.parseAgentSessionKey(childKey);
	return { entry: require_session_accessor.loadSessionEntry({
		storePath: require_paths.resolveStorePath(params.cfg.session?.store, { agentId: parsed?.agentId }),
		sessionKey: childKey,
		clone: false
	}) };
}
function handleSubagentsInfoAction(ctx) {
	const { params, requesterKey, runs, restTokens } = ctx;
	const target = restTokens[0];
	if (!target) return require_shared.stopWithText("ℹ️ Usage: /subagents info <id|#>");
	const targetResolution = require_shared.resolveSubagentEntryForToken(runs, target);
	if ("reply" in targetResolution) return targetResolution.reply;
	const run = targetResolution.entry;
	const { entry: sessionEntry } = loadSubagentSessionEntry(params, run.childSessionKey);
	const runtime = run.startedAt && Number.isFinite(run.startedAt) ? require_format_duration.formatDurationCompact((run.endedAt ?? Date.now()) - run.startedAt) ?? "n/a" : "n/a";
	const outcomeError = require_task_status.sanitizeTaskStatusText(run.outcome?.error, { errorContext: true });
	const outcome = run.outcome ? `${run.outcome.status}${outcomeError ? ` (${outcomeError})` : ""}` : "n/a";
	const linkedTask = require_task_owner_access.findTaskByRunIdForOwner({
		runId: run.runId,
		callerOwnerKey: requesterKey
	});
	const taskText = require_task_status.sanitizeTaskStatusText(run.task) || "n/a";
	const progressText = require_task_status.sanitizeTaskStatusText(linkedTask?.progressSummary);
	const taskSummaryText = require_task_status.sanitizeTaskStatusText(linkedTask?.terminalSummary, { errorContext: true });
	const taskErrorText = require_task_status.sanitizeTaskStatusText(linkedTask?.error, { errorContext: true });
	return require_shared.stopWithText([
		"ℹ️ Subagent info",
		`Status: ${resolveDisplayStatus(run, { pendingDescendants: require_subagent_registry_state.countPendingDescendantRunsFromRuns(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns), run.childSessionKey) })}`,
		`Label: ${require_subagents_utils.formatRunLabel(run)}`,
		`Task: ${taskText}`,
		`Run: ${run.runId}`,
		linkedTask ? `TaskId: ${linkedTask.taskId}` : void 0,
		linkedTask ? `TaskStatus: ${linkedTask.status}` : void 0,
		`Session: ${run.childSessionKey}`,
		`SessionId: ${sessionEntry?.sessionId ?? "n/a"}`,
		`Transcript: ${sessionEntry?.sessionFile ?? "n/a"}`,
		`Runtime: ${runtime}`,
		`Created: ${formatTimestampWithAge(run.createdAt)}`,
		`Started: ${formatTimestampWithAge(run.startedAt)}`,
		`Ended: ${formatTimestampWithAge(run.endedAt)}`,
		`Cleanup: ${run.cleanup}`,
		run.archiveAtMs ? `Archive: ${formatTimestampWithAge(run.archiveAtMs)}` : void 0,
		run.cleanupHandled ? "Cleanup handled: yes" : void 0,
		`Outcome: ${outcome}`,
		progressText ? `Progress: ${progressText}` : void 0,
		taskSummaryText ? `Task summary: ${taskSummaryText}` : void 0,
		taskErrorText ? `Task error: ${taskErrorText}` : void 0,
		linkedTask ? `Delivery: ${linkedTask.deliveryStatus}` : void 0
	].filter(Boolean).join("\n"));
}
//#endregion
exports.handleSubagentsInfoAction = handleSubagentsInfoAction;
