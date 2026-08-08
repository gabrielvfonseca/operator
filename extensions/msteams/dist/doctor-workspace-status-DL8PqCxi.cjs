require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
require("./runtime-internal-CNKl6hEH.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_status = require("./status-pSULYkKm.cjs");
const require_status_snapshot = require("./status-snapshot-Bz-edBxw.cjs");
const require_plugin_version_drift = require("./plugin-version-drift-BspGrHBn.cjs");
//#region src/commands/doctor-workspace-status.ts
/** Doctor status summary for workspace skills, plugins, and task-flow recovery hints. */
const WORKSPACE_STATUS_CHECK_ID = "core/doctor/workspace-status";
function collectTaskFlowRecoveryFindings() {
	return require_task_registry.listTaskFlowRecords().flatMap((flow) => {
		const tasks = require_task_registry.listTasksForFlowId(flow.flowId);
		const findings = [];
		if (flow.syncMode === "managed" && flow.status === "running" && tasks.length === 0 && flow.waitJson === void 0) findings.push({
			flowId: flow.flowId,
			message: `${flow.flowId}: running managed TaskFlow has no linked tasks or wait state; inspect or cancel it manually.`
		});
		if (flow.endedAt == null && flow.status === "blocked" && flow.blockedTaskId && !tasks.some((task) => task.taskId === flow.blockedTaskId)) findings.push({
			flowId: flow.flowId,
			message: `${flow.flowId}: blocked TaskFlow points at missing task ${flow.blockedTaskId}; inspect before retrying.`
		});
		return findings;
	});
}
function noteFlowRecoveryHints() {
	const suspicious = collectTaskFlowRecoveryFindings();
	if (suspicious.length === 0) return;
	require_note.note([
		...suspicious.slice(0, 5).map((finding) => finding.message),
		suspicious.length > 5 ? `...and ${suspicious.length - 5} more.` : null,
		`Inspect: ${require_command_format.formatCliCommand("operator tasks flow show <flow-id>")}`,
		`Cancel: ${require_command_format.formatCliCommand("operator tasks flow cancel <flow-id>")}`
	].filter((line) => Boolean(line)).join("\n"), "TaskFlow recovery");
}
function pluginVersionDriftToHealthFindings(drift) {
	if (!drift || drift.drifts.length === 0) return [];
	return drift.drifts.map((entry) => {
		const updateCommand = require_command_format.formatCliCommand(require_plugin_version_drift.resolvePluginVersionDriftUpdateCommand(entry));
		return {
			checkId: WORKSPACE_STATUS_CHECK_ID,
			severity: "warning",
			message: `Plugin ${entry.pluginId} is ${entry.installedVersion}, but the Gateway is ${drift.gatewayVersion}.`,
			path: `plugins.entries.${entry.pluginId}`,
			target: entry.pluginId,
			requirement: "plugin-version-drift",
			fixHint: `${updateCommand} && ${require_command_format.formatCliCommand("operator gateway restart")}`
		};
	});
}
function pluginCompatibilityWarningToHealthFinding(message) {
	return {
		checkId: WORKSPACE_STATUS_CHECK_ID,
		severity: "warning",
		message,
		path: "plugins",
		requirement: "plugin-compatibility",
		fixHint: "Update or replace the plugin so it no longer depends on legacy compatibility paths."
	};
}
function pluginDiagnosticToHealthFinding(diagnostic) {
	return {
		checkId: WORKSPACE_STATUS_CHECK_ID,
		severity: diagnostic.level === "error" ? "error" : "warning",
		message: diagnostic.message,
		...diagnostic.pluginId ? { path: `plugins.entries.${diagnostic.pluginId}` } : {},
		...diagnostic.pluginId ? { target: diagnostic.pluginId } : {},
		...diagnostic.source ? { source: diagnostic.source } : {},
		...diagnostic.code ? { requirement: diagnostic.code } : { requirement: "plugin-diagnostic" }
	};
}
function taskFlowRecoveryToHealthFinding(finding) {
	return {
		checkId: WORKSPACE_STATUS_CHECK_ID,
		severity: "warning",
		message: finding.message,
		path: "tasks.flows",
		target: finding.flowId,
		requirement: "taskflow-recovery",
		fixHint: [require_command_format.formatCliCommand(`operator tasks flow show ${finding.flowId}`), require_command_format.formatCliCommand(`operator tasks flow cancel ${finding.flowId}`)].join(" or ")
	};
}
function collectWorkspaceStatusHealthFindings(cfg, options = {}) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg));
	const pluginRegistry = require_status_snapshot.buildPluginRegistrySnapshotReport({
		config: cfg,
		workspaceDir
	});
	const compatibilityWarnings = require_status.buildPluginCompatibilityWarnings({
		config: cfg,
		workspaceDir,
		report: pluginRegistry
	});
	return [
		...pluginVersionDriftToHealthFindings(options.pluginVersionDrift),
		...compatibilityWarnings.map(pluginCompatibilityWarningToHealthFinding),
		...pluginRegistry.diagnostics.map(pluginDiagnosticToHealthFinding),
		...collectTaskFlowRecoveryFindings().map(taskFlowRecoveryToHealthFinding)
	];
}
function notePluginVersionDrift(drift) {
	if (!drift || drift.drifts.length === 0) return;
	const singleDrift = drift.drifts.length === 1 ? drift.drifts[0] : void 0;
	const updateCommands = drift.drifts.map((entry) => require_command_format.formatCliCommand(require_plugin_version_drift.resolvePluginVersionDriftUpdateCommand(entry)));
	require_note.note([
		`${drift.drifts.length} active official plugin${drift.drifts.length === 1 ? "" : "s"} not on Operator ${drift.gatewayVersion}`,
		...drift.drifts.map((entry) => {
			const sourceLabel = entry.source === "clawhub" ? "clawhub" : "npm";
			return `- ${entry.pluginId}: ${entry.installedVersion} (${sourceLabel}) -> expected ${drift.gatewayVersion}`;
		}),
		singleDrift ? `Fix: ${updateCommands[0]} && ${require_command_format.formatCliCommand("operator gateway restart")}.` : [
			"Fix each drifted plugin:",
			...updateCommands.map((command) => `- ${command}`),
			`Then run ${require_command_format.formatCliCommand("operator gateway restart")}.`
		].join("\n")
	].join("\n"), "Plugin version drift");
}
/** Emits plugin and TaskFlow recovery problem notes for doctor. */
function noteWorkspaceStatus(cfg, options = {}) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg));
	const pluginRegistry = require_status_snapshot.buildPluginRegistrySnapshotReport({
		config: cfg,
		workspaceDir
	});
	const errored = pluginRegistry.plugins.filter((plugin) => plugin.status === "error").toSorted((a, b) => a.id.localeCompare(b.id));
	if (errored.length > 0) require_note.note([`Errors: ${errored.length}`, `- ${errored.slice(0, 10).map((plugin) => plugin.id).join("\n- ")}${errored.length > 10 ? "\n- ..." : ""}`].join("\n"), "Plugins");
	notePluginVersionDrift(options.pluginVersionDrift);
	const compatibilityWarnings = require_status.buildPluginCompatibilityWarnings({
		config: cfg,
		workspaceDir,
		report: pluginRegistry
	});
	if (compatibilityWarnings.length > 0) require_note.note(compatibilityWarnings.map((line) => `- ${line}`).join("\n"), "Plugin compatibility");
	if (pluginRegistry.diagnostics.length > 0) require_note.note(pluginRegistry.diagnostics.map((diag) => {
		const prefix = diag.level.toUpperCase();
		const plugin = diag.pluginId ? ` ${diag.pluginId}` : "";
		const source = diag.source ? ` (${diag.source})` : "";
		return `- ${prefix}${plugin}: ${diag.message}${source}`;
	}).join("\n"), "Plugin diagnostics");
	noteFlowRecoveryHints();
	return { workspaceDir };
}
//#endregion
exports.collectWorkspaceStatusHealthFindings = collectWorkspaceStatusHealthFindings;
exports.noteWorkspaceStatus = noteWorkspaceStatus;
