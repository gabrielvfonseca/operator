const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_windows_port_pids = require("./windows-port-pids-FzMQAPMX.cjs");
const require_paths = require("./paths-amwIgX1d.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/daemon/restart-logs.ts
/** Resolves daemon log paths and shell snippets for restart handoff diagnostics. */
const GATEWAY_RESTART_LOG_FILENAME = "gateway-restart.log";
function resolveGatewayLogPrefix(env) {
	return env.OPERATOR_LOG_PREFIX?.trim() || "gateway";
}
function resolveMacLaunchAgentLogPrefix(env) {
	return env.OPERATOR_LOG_PREFIX?.trim() || `gateway${require_paths.resolveGatewayProfileSuffix(env.OPERATOR_PROFILE)}`;
}
function resolveGatewayLogPaths(env) {
	const stateDir = require_paths.resolveGatewayStateDir(env);
	const logDir = node_path.default.join(stateDir, "logs");
	const prefix = resolveGatewayLogPrefix(env);
	return {
		logDir,
		stdoutPath: node_path.default.join(logDir, `${prefix}.log`),
		stderrPath: node_path.default.join(logDir, `${prefix}.err.log`)
	};
}
function resolveMacLaunchAgentLogPaths(env) {
	const home = require_paths.resolveHomeDir(env).replaceAll("\\", "/");
	const logDir = node_path.default.posix.join(home, "Library", "Logs", "@gabrielvfonseca/operator");
	const prefix = resolveMacLaunchAgentLogPrefix(env);
	return {
		logDir,
		stdoutPath: node_path.default.posix.join(logDir, `${prefix}.log`),
		stderrPath: node_path.default.posix.join(logDir, `${prefix}.err.log`)
	};
}
function resolveGatewaySupervisorLogPaths(env, options) {
	return (options?.platform ?? process.platform) === "darwin" ? resolveMacLaunchAgentLogPaths(env) : resolveGatewayLogPaths(env);
}
function resolveGatewayRestartLogPath(env) {
	return node_path.default.join(resolveGatewayLogPaths(env).logDir, GATEWAY_RESTART_LOG_FILENAME);
}
function shellEscapeRestartLogValue(value) {
	return value.replace(/'/g, "'\\''");
}
function renderPosixRestartLogSetup(env) {
	const logDir = node_path.default.dirname(resolveGatewayRestartLogPath(env));
	const logPath = resolveGatewayRestartLogPath(env);
	const escapedLogDir = shellEscapeRestartLogValue(logDir);
	const escapedLogPath = shellEscapeRestartLogValue(logPath);
	return `if mkdir -p '${escapedLogDir}' 2>/dev/null && : >>'${escapedLogPath}' 2>/dev/null; then
  exec >>'${escapedLogPath}' 2>&1
fi`;
}
function renderCmdRestartLogSetup(env) {
	const logPath = resolveGatewayRestartLogPath(env);
	const quotedLogDir = require_windows_port_pids.quoteCmdScriptArg(node_path.default.dirname(logPath));
	const quotedLogPath = require_windows_port_pids.quoteCmdScriptArg(logPath);
	return {
		quotedLogPath,
		lines: [`if not exist ${quotedLogDir} mkdir ${quotedLogDir} >nul 2>&1`, `>> ${quotedLogPath} 2>&1 echo [%DATE% %TIME%] openclaw restart log initialized`]
	};
}
//#endregion
Object.defineProperty(exports, "renderCmdRestartLogSetup", {
	enumerable: true,
	get: function() {
		return renderCmdRestartLogSetup;
	}
});
Object.defineProperty(exports, "renderPosixRestartLogSetup", {
	enumerable: true,
	get: function() {
		return renderPosixRestartLogSetup;
	}
});
Object.defineProperty(exports, "resolveGatewayLogPaths", {
	enumerable: true,
	get: function() {
		return resolveGatewayLogPaths;
	}
});
Object.defineProperty(exports, "resolveGatewayRestartLogPath", {
	enumerable: true,
	get: function() {
		return resolveGatewayRestartLogPath;
	}
});
Object.defineProperty(exports, "resolveGatewaySupervisorLogPaths", {
	enumerable: true,
	get: function() {
		return resolveGatewaySupervisorLogPaths;
	}
});
