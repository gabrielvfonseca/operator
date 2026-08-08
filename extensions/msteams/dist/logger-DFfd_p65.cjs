const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
//#region src/logger.ts
const subsystemPrefixRe = /^([a-z][a-z0-9-]{1,20}):\s+(.*)$/i;
function splitSubsystem(message) {
	const match = message.match(subsystemPrefixRe);
	if (!match) return null;
	const subsystem = match.at(1);
	const rest = match.at(2);
	if (subsystem === void 0 || rest === void 0) return null;
	return {
		subsystem,
		rest
	};
}
function logWithSubsystem(params) {
	const parsed = params.runtime === require_runtime.defaultRuntime ? splitSubsystem(params.message) : null;
	if (parsed) {
		(0, _gabrielvfonseca_normalization_core.expectDefined)(require_subsystem.createSubsystemLogger(parsed.subsystem)[params.subsystemMethod], "subsystem logger method")(parsed.rest);
		return;
	}
	params.runtime[params.runtimeMethod](params.runtimeFormatter(params.message));
	require_logger.getLogger()[params.loggerMethod](params.message);
}
const info = require_theme.theme.info;
const warn = require_theme.theme.warn;
require_theme.theme.success;
const danger = require_theme.theme.error;
function logInfo(message, runtime = require_runtime.defaultRuntime) {
	logWithSubsystem({
		message,
		runtime,
		runtimeMethod: "log",
		runtimeFormatter: info,
		loggerMethod: "info",
		subsystemMethod: "info"
	});
}
function logWarn(message, runtime = require_runtime.defaultRuntime) {
	logWithSubsystem({
		message,
		runtime,
		runtimeMethod: "log",
		runtimeFormatter: warn,
		loggerMethod: "warn",
		subsystemMethod: "warn"
	});
}
function logError(message, runtime = require_runtime.defaultRuntime) {
	logWithSubsystem({
		message,
		runtime,
		runtimeMethod: "error",
		runtimeFormatter: danger,
		loggerMethod: "error",
		subsystemMethod: "error"
	});
}
function logDebug(message) {
	require_logger.getLogger().debug(message);
	if (require_logger.isVerbose()) console.log(require_theme.theme.muted(message));
}
//#endregion
Object.defineProperty(exports, "logDebug", {
	enumerable: true,
	get: function() {
		return logDebug;
	}
});
Object.defineProperty(exports, "logError", {
	enumerable: true,
	get: function() {
		return logError;
	}
});
Object.defineProperty(exports, "logInfo", {
	enumerable: true,
	get: function() {
		return logInfo;
	}
});
Object.defineProperty(exports, "logWarn", {
	enumerable: true,
	get: function() {
		return logWarn;
	}
});
