const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_restart_logs = require("./restart-logs-D6dsuNEi.cjs");
const require_runtime_parse = require("./runtime-parse-DqkKCIwQ.cjs");
const require_systemd = require("./systemd-BxVKNLOg.cjs");
const require_runtime_status = require("./runtime-status-C-qXaf3z.cjs");
const require_service_runtime = require("./service-runtime-BkEjx9FW.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/daemon/systemd-hints.ts
/** Renders Linux systemd availability hints for gateway service commands. */
/** Detects details that should get systemd availability repair hints. */
function isSystemdUnavailableDetail(detail) {
	return require_systemd.classifySystemdUnavailableDetail(detail) !== null;
}
function renderSystemdHeadlessServerHints() {
	return ["On a headless server (SSH/no desktop session): run `sudo loginctl enable-linger $(whoami)` to persist your systemd user session across logins.", "Also ensure XDG_RUNTIME_DIR is set: `export XDG_RUNTIME_DIR=/run/user/$(id -u)`, then retry."];
}
function renderSystemdUnavailableHints(options = {}) {
	if (options.wsl) return [
		"WSL2 needs systemd enabled: edit /etc/wsl.conf with [boot]\\nsystemd=true",
		"Then run: wsl --shutdown (from PowerShell) and reopen your distro.",
		"Verify: systemctl --user status"
	];
	return [
		"systemd user services are unavailable; install/enable systemd or run the gateway under your supervisor.",
		...options.container || options.kind !== "user_bus_unavailable" ? [] : renderSystemdHeadlessServerHints(),
		`If you're in a container, run the gateway in the foreground instead of \`${require_command_format.formatCliCommand("operator gateway")}\`.`
	];
}
//#endregion
//#region src/daemon/container-context.ts
/** Detects whether a daemon was launched by Operator's container-aware service wrapper. */
/** Resolves the daemon container hint exposed by managed service environments. */
function resolveDaemonContainerContext(env = process.env) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_CONTAINER_HINT) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_CONTAINER) || null;
}
//#endregion
//#region src/daemon/runtime-format.ts
/** Formats daemon runtime state into compact status lines for CLI output. */
const SIGNAL_NAMES_BY_STATUS = /* @__PURE__ */ new Map([
	[129, "SIGHUP"],
	[130, "SIGINT"],
	[131, "SIGQUIT"],
	[134, "SIGABRT/abort"],
	[137, "SIGKILL"],
	[143, "SIGTERM"]
]);
function formatLastExitStatus(status) {
	const signalName = SIGNAL_NAMES_BY_STATUS.get(status);
	return signalName ? `last exit ${status} (${signalName})` : `last exit ${status}`;
}
function formatRuntimeStatus(runtime) {
	if (!runtime) return null;
	const details = [];
	if (runtime.subState) details.push(`sub ${runtime.subState}`);
	if (runtime.lastExitStatus !== void 0) details.push(formatLastExitStatus(runtime.lastExitStatus));
	if (runtime.lastExitReason) details.push(`reason ${runtime.lastExitReason}`);
	if (runtime.lastRunResult) details.push(`last run ${runtime.lastRunResult}`);
	if (runtime.lastRunTime) details.push(`last run time ${runtime.lastRunTime}`);
	const cgroupSummary = require_service_runtime.getSystemdCgroupHygieneSummary(runtime.systemd);
	if (cgroupSummary) details.push(cgroupSummary);
	if (runtime.detail) details.push(runtime.detail);
	return require_runtime_status.formatRuntimeStatusWithDetails({
		status: runtime.status,
		pid: runtime.pid,
		state: runtime.state,
		details
	});
}
//#endregion
//#region src/daemon/runtime-hints.ts
/** Builds platform-specific log and start hints for daemon status output. */
function toDarwinDisplayPath(value) {
	return require_runtime_parse.toPosixPath(value).replace(/^[A-Za-z]:/, "");
}
function buildPlatformRuntimeLogHints(params) {
	const platform = params.platform ?? process.platform;
	const env = {
		...process.env,
		...params.env
	};
	if (platform === "darwin") return [
		`Launchd stdout (if installed): ${toDarwinDisplayPath(require_restart_logs.resolveGatewaySupervisorLogPaths(env, { platform }).stdoutPath)}`,
		"Launchd stderr (if installed): suppressed",
		`Restart attempts: ${toDarwinDisplayPath(require_restart_logs.resolveGatewayRestartLogPath(env))}`
	];
	if (platform === "linux") return [`Logs: journalctl --user -u ${params.systemdServiceName}.service -n 200 --no-pager`, `Restart attempts: ${require_restart_logs.resolveGatewayRestartLogPath(env)}`];
	if (platform === "win32") return [`Logs: schtasks /Query /TN "${params.windowsTaskName}" /V /FO LIST`, `Restart attempts: ${require_restart_logs.resolveGatewayRestartLogPath(env)}`];
	return [];
}
function buildPlatformServiceStartHints(params) {
	const platform = params.platform ?? process.platform;
	const base = [params.installCommand, params.startCommand];
	switch (platform) {
		case "darwin": return [...base, `launchctl bootstrap gui/$UID ${params.launchAgentPlistPath}`];
		case "linux": return [...base, `systemctl --user start ${params.systemdServiceName}.service`];
		case "win32": return [...base, `schtasks /Run /TN "${params.windowsTaskName}"`];
		default: return base;
	}
}
//#endregion
Object.defineProperty(exports, "buildPlatformRuntimeLogHints", {
	enumerable: true,
	get: function() {
		return buildPlatformRuntimeLogHints;
	}
});
Object.defineProperty(exports, "buildPlatformServiceStartHints", {
	enumerable: true,
	get: function() {
		return buildPlatformServiceStartHints;
	}
});
Object.defineProperty(exports, "formatRuntimeStatus", {
	enumerable: true,
	get: function() {
		return formatRuntimeStatus;
	}
});
Object.defineProperty(exports, "isSystemdUnavailableDetail", {
	enumerable: true,
	get: function() {
		return isSystemdUnavailableDetail;
	}
});
Object.defineProperty(exports, "renderSystemdUnavailableHints", {
	enumerable: true,
	get: function() {
		return renderSystemdUnavailableHints;
	}
});
Object.defineProperty(exports, "resolveDaemonContainerContext", {
	enumerable: true,
	get: function() {
		return resolveDaemonContainerContext;
	}
});
