const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_command_gates = require("./command-gates-DksUxtOK.cjs");
const require_status_plugin_health = require("./status-plugin-health-Drs1HGs2.cjs");
const require_status_text = require("./status-text-DHcdmd-H.cjs");
//#region src/auto-reply/reply/commands-status.ts
/** Builds /status replies using the command's authorized channel context. */
var commands_status_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildStatusPluginsReply: () => buildStatusPluginsReply,
	buildStatusReply: () => buildStatusReply,
	buildStatusText: () => require_status_text.buildStatusText
});
/** Builds a status reply or suppresses unauthorized status requests. */
async function buildStatusReply(params) {
	const { command } = params;
	if (!command.isAuthorizedSender) {
		require_globals.logVerbose(`Ignoring /status from unauthorized sender: ${command.senderId || "<unknown>"}`);
		return;
	}
	return { text: await require_status_text.buildStatusText({
		...params,
		statusChannel: command.channel,
		statusAccountId: command.accountId
	}) };
}
async function buildStatusPluginsReply(params) {
	const { command } = params;
	if (!command.isAuthorizedSender) {
		require_globals.logVerbose(`Ignoring /status plugins from unauthorized sender: ${command.senderId || "<unknown>"}`);
		return;
	}
	const disabled = require_command_gates.requireCommandFlagEnabled(params.cfg, {
		label: "/status plugins",
		configKey: "plugins"
	});
	if (disabled) return disabled.reply;
	try {
		const { collectInstalledPluginHealthSnapshot } = await Promise.resolve().then(() => require("./status-plugin-health.runtime-CBO6eNyq.cjs"));
		return { text: require_status_plugin_health.formatDetailedPluginHealth(await collectInstalledPluginHealthSnapshot({
			config: params.cfg,
			workspaceDir: params.workspaceDir
		})) };
	} catch (error) {
		return { text: `⚠️ Plugins: health unavailable (${error instanceof Error ? error.message : String(error)})` };
	}
}
//#endregion
Object.defineProperty(exports, "buildStatusPluginsReply", {
	enumerable: true,
	get: function() {
		return buildStatusPluginsReply;
	}
});
Object.defineProperty(exports, "buildStatusReply", {
	enumerable: true,
	get: function() {
		return buildStatusReply;
	}
});
Object.defineProperty(exports, "commands_status_exports", {
	enumerable: true,
	get: function() {
		return commands_status_exports;
	}
});
