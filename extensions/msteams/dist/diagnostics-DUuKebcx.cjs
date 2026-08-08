const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_errors = require("./errors-rYeQaZRQ.cjs");
const require_registry = require("./registry-DPQgylfd.cjs");
const require_manager = require("./manager-B5L0WDCm.cjs");
const require_bundled_sources = require("./bundled-sources-xMGcgjbI.cjs");
const require_context = require("./context-V4D9UcfJ.cjs");
const require_shared = require("./shared-C-iBBXn5.cjs");
const require_targets = require("./targets-CAV0R_ib.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_acp_core_runtime_error_text = require("@gabrielvfonseca/acp-core/runtime/error-text");
//#region src/auto-reply/reply/commands-acp/install-hints.ts
/** Resolves the install command hint shown when the configured ACP backend is missing. */
function resolveAcpInstallCommandHint(cfg) {
	const configured = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cfg.acp?.runtime?.installCommand);
	if (configured) return configured;
	const workspaceDir = process.cwd();
	const backendId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(cfg.acp?.backend) ?? "acpx";
	if (backendId === "acpx") {
		const workspaceLocalPath = node_path.default.join(workspaceDir, "extensions", "acpx");
		if ((0, node_fs.existsSync)(workspaceLocalPath)) return `openclaw plugins install ${workspaceLocalPath}`;
		const bundledInstallHint = require_bundled_sources.resolveBundledPluginInstallCommandHint({
			pluginId: backendId,
			workspaceDir
		});
		if (bundledInstallHint) {
			const localPath = bundledInstallHint.replace(/^openclaw plugins install /u, "");
			const resolvedLocalPath = node_path.default.resolve(localPath);
			const relativeToWorkspace = node_path.default.relative(workspaceDir, resolvedLocalPath);
			if ((relativeToWorkspace.length === 0 || !relativeToWorkspace.startsWith("..") && !node_path.default.isAbsolute(relativeToWorkspace)) && (0, node_fs.existsSync)(resolvedLocalPath)) return bundledInstallHint;
		}
		return "openclaw plugins install acpx";
	}
	return `Install and enable the plugin that provides ACP backend "${backendId}".`;
}
//#endregion
//#region src/auto-reply/reply/commands-acp/diagnostics.ts
function isBackendPluginBlockedByAllowlist(params) {
	const allow = params.cfg.plugins?.allow;
	if (!Array.isArray(allow) || allow.length === 0) return false;
	const normalizedBackendId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.backendId);
	if (!normalizedBackendId) return false;
	return !allow.some((pluginId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(pluginId) === normalizedBackendId);
}
async function handleAcpDoctorAction(params, restTokens) {
	if (restTokens.length > 0) return require_shared.stopWithText(`⚠️ ${require_shared.ACP_DOCTOR_USAGE}`);
	const backendId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cfg.acp?.backend) ?? "acpx";
	const installHint = resolveAcpInstallCommandHint(params.cfg);
	const registeredBackend = require_registry.getAcpRuntimeBackend(backendId);
	const managerSnapshot = require_manager.getAcpSessionManager().getObservabilitySnapshot(params.cfg);
	const lines = [
		"ACP doctor:",
		"-----",
		`configuredBackend: ${backendId}`
	];
	lines.push(`activeRuntimeSessions: ${managerSnapshot.runtimeCache.activeSessions}`);
	lines.push(`runtimeIdleTtlMs: ${managerSnapshot.runtimeCache.idleTtlMs}`);
	lines.push(`evictedIdleRuntimes: ${managerSnapshot.runtimeCache.evictedTotal}`);
	lines.push(`activeTurns: ${managerSnapshot.turns.active}`);
	lines.push(`queueDepth: ${managerSnapshot.turns.queueDepth}`);
	lines.push(`turnLatencyMs: avg=${managerSnapshot.turns.averageLatencyMs}, max=${managerSnapshot.turns.maxLatencyMs}`);
	lines.push(`turnCounts: completed=${managerSnapshot.turns.completed}, failed=${managerSnapshot.turns.failed}`);
	const errorStatsText = Object.entries(managerSnapshot.errorsByCode).map(([code, count]) => `${code}=${count}`).join(", ") || "(none)";
	lines.push(`errorCodes: ${errorStatsText}`);
	if (registeredBackend) lines.push(`registeredBackend: ${registeredBackend.id}`);
	else lines.push("registeredBackend: (none)");
	const backendBlockedByAllowlist = isBackendPluginBlockedByAllowlist({
		cfg: params.cfg,
		backendId
	});
	if (backendBlockedByAllowlist) lines.push(`pluginActivation: blocked (${backendId} is missing from plugins.allow)`);
	if (registeredBackend?.runtime.doctor) try {
		const report = await registeredBackend.runtime.doctor();
		lines.push(`runtimeDoctor: ${report.ok ? "ok" : "error"} (${report.message})`);
		if (report.code) lines.push(`runtimeDoctorCode: ${report.code}`);
		if (report.installCommand) lines.push(`runtimeDoctorInstall: ${report.installCommand}`);
		for (const detail of report.details ?? []) lines.push(`runtimeDoctorDetail: ${detail}`);
	} catch (error) {
		lines.push(`runtimeDoctor: error (${(0, require_errors.errors_exports.toAcpRuntimeError)({
			error,
			fallbackCode: "ACP_TURN_FAILED",
			fallbackMessage: "Runtime doctor failed."
		}).message})`);
	}
	try {
		const backend = require_registry.requireAcpRuntimeBackend(backendId);
		const capabilities = backend.runtime.getCapabilities ? await backend.runtime.getCapabilities({}) : {
			controls: [],
			configOptionKeys: []
		};
		lines.push("healthy: yes");
		lines.push(`capabilities: ${require_shared.formatAcpCapabilitiesText(capabilities.controls ?? [])}`);
		if ((capabilities.configOptionKeys?.length ?? 0) > 0) lines.push(`configKeys: ${capabilities.configOptionKeys?.join(", ")}`);
		return require_shared.stopWithText(lines.join("\n"));
	} catch (error) {
		const acpError = (0, require_errors.errors_exports.toAcpRuntimeError)({
			error,
			fallbackCode: "ACP_TURN_FAILED",
			fallbackMessage: "ACP backend doctor failed."
		});
		lines.push("healthy: no");
		lines.push((0, _gabrielvfonseca_acp_core_runtime_error_text.formatAcpRuntimeErrorText)(acpError));
		if (backendBlockedByAllowlist) lines.push(`next: add "${backendId}" to plugins.allow or unset plugins.allow.`);
		lines.push(`next: ${installHint}`);
		lines.push(`next: openclaw config set plugins.entries.${backendId}.enabled true`);
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(backendId) === "acpx") lines.push("next: verify acpx is installed (`acpx --help`).");
		return require_shared.stopWithText(lines.join("\n"));
	}
}
function handleAcpInstallAction(params, restTokens) {
	if (restTokens.length > 0) return require_shared.stopWithText(`⚠️ ${require_shared.ACP_INSTALL_USAGE}`);
	const backendId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cfg.acp?.backend) ?? "acpx";
	const installHint = resolveAcpInstallCommandHint(params.cfg);
	return require_shared.stopWithText([
		"ACP install:",
		"-----",
		`configuredBackend: ${backendId}`,
		`run: ${installHint}`,
		`then: openclaw config set plugins.entries.${backendId}.enabled true`,
		"then: /acp doctor"
	].join("\n"));
}
function formatAcpSessionLine(params) {
	const acp = params.acp;
	const marker = params.currentSessionKey === params.key ? "*" : " ";
	const label = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.label) || acp.agent;
	const threadText = params.threadId ? `, thread:${params.threadId}` : "";
	return `${marker} ${label} (${acp.mode}, ${acp.state}, backend:${acp.backend}${threadText}) -> ${params.key}`;
}
async function handleAcpSessionsAction(params, restTokens) {
	if (restTokens.length > 0) return require_shared.stopWithText(require_shared.ACP_SESSIONS_USAGE);
	const currentSessionKey = require_targets.resolveBoundAcpThreadSessionKey(params) || params.sessionKey;
	if (!currentSessionKey) return require_shared.stopWithText("⚠️ Missing session key.");
	const bindingContext = require_context.resolveAcpCommandBindingContext(params);
	const normalizedChannel = bindingContext.channel;
	const normalizedAccountId = bindingContext.accountId || void 0;
	const bindingService = require_session_binding_service.getSessionBindingService();
	const rows = (await require_session_meta.listAcpSessionEntries({ cfg: params.cfg })).toSorted((a, b) => (b.entry?.updatedAt ?? 0) - (a.entry?.updatedAt ?? 0)).slice(0, 20).map(({ storeSessionKey, entry, acp }) => {
		if (!entry || !acp) return "";
		const bindingThreadId = bindingService.listBySession(storeSessionKey).find((binding) => (!normalizedChannel || binding.conversation.channel === normalizedChannel) && (!normalizedAccountId || binding.conversation.accountId === normalizedAccountId))?.conversation.conversationId;
		return formatAcpSessionLine({
			key: storeSessionKey,
			entry,
			acp,
			currentSessionKey,
			threadId: bindingThreadId
		});
	}).filter(Boolean);
	if (rows.length === 0) return require_shared.stopWithText("ACP sessions:\n-----\n(none)");
	return require_shared.stopWithText([
		"ACP sessions:",
		"-----",
		...rows
	].join("\n"));
}
//#endregion
exports.handleAcpDoctorAction = handleAcpDoctorAction;
exports.handleAcpInstallAction = handleAcpInstallAction;
exports.handleAcpSessionsAction = handleAcpSessionsAction;
