const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
//#region src/config/logging.ts
/** Formats a config path for operator-facing log output. */
function formatConfigPath(path = require_io.createConfigIO().configPath) {
	return require_utils.displayPath(path);
}
/** Builds the config-updated log message, including backup detail only when it exists. */
function formatConfigUpdatedMessage(path, opts = {}) {
	const displayConfigPath = require_theme.theme.muted(formatConfigPath(path));
	const suffix = opts.suffix ? ` ${opts.suffix}` : "";
	const backupPath = opts.backupPath === void 0 ? `${path}.bak` : opts.backupPath;
	const lines = [`Updated config: ${displayConfigPath}${suffix}`];
	if (backupPath && node_fs.default.existsSync(backupPath)) lines.push(`  Backup: ${require_theme.theme.muted(formatConfigPath(backupPath))}`);
	return lines.join("\n");
}
/** Emits the standard config-updated message through the active runtime logger. */
function logConfigUpdated(runtime, opts = {}) {
	runtime.log(formatConfigUpdatedMessage(opts.path ?? require_io.createConfigIO().configPath, opts));
}
//#endregion
exports.formatConfigPath = formatConfigPath;
exports.formatConfigUpdatedMessage = formatConfigUpdatedMessage;
exports.logConfigUpdated = logConfigUpdated;
