const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
//#region src/globals.ts
var globals_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	danger: () => danger,
	info: () => info,
	logVerbose: () => logVerbose,
	shouldLogVerbose: () => shouldLogVerbose
});
function shouldLogVerbose() {
	return require_logger.isVerbose() || require_logger.isFileLogLevelEnabled("debug");
}
function logVerbose(message) {
	if (!shouldLogVerbose()) return;
	try {
		require_logger.getLogger().debug({ message }, "verbose");
	} catch {}
	if (!require_logger.isVerbose()) return;
	console.log(require_theme.theme.muted(message));
}
require_theme.theme.success;
require_theme.theme.warn;
const info = require_theme.theme.info;
const danger = require_theme.theme.error;
//#endregion
Object.defineProperty(exports, "danger", {
	enumerable: true,
	get: function() {
		return danger;
	}
});
Object.defineProperty(exports, "globals_exports", {
	enumerable: true,
	get: function() {
		return globals_exports;
	}
});
Object.defineProperty(exports, "info", {
	enumerable: true,
	get: function() {
		return info;
	}
});
Object.defineProperty(exports, "logVerbose", {
	enumerable: true,
	get: function() {
		return logVerbose;
	}
});
Object.defineProperty(exports, "shouldLogVerbose", {
	enumerable: true,
	get: function() {
		return shouldLogVerbose;
	}
});
