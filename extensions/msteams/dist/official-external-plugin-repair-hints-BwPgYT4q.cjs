const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
//#region src/plugins/official-external-plugin-repair-hints.ts
/** Resolves install/doctor commands for an official external plugin or channel id. */
function resolveOfficialExternalPluginRepairHint(pluginIdOrChannelId) {
	const entry = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogEntry(pluginIdOrChannelId);
	if (!entry) return null;
	const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry);
	const npmSpec = install?.npmSpec?.trim();
	const clawhubSpec = install?.clawhubSpec?.trim();
	const installSpec = install?.defaultChoice === "clawhub" ? clawhubSpec ?? npmSpec : npmSpec ?? clawhubSpec;
	if (!installSpec) return null;
	const manifest = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(entry);
	const pluginId = require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry) ?? pluginIdOrChannelId.trim();
	const channelId = manifest?.channel?.id?.trim();
	const label = require_official_external_plugin_catalog.resolveOfficialExternalPluginLabel(entry);
	const installCommand = `operator plugins install ${installSpec}`;
	const doctorFixCommand = "operator doctor --fix";
	return {
		pluginId,
		...channelId ? { channelId } : {},
		label,
		installSpec,
		installCommand,
		doctorFixCommand,
		repairHint: `Install the official external plugin with: ${installCommand}, or run: ${doctorFixCommand}.`
	};
}
/** Resolves a repair hint only when a missing configured channel is blocked by no plugin owner. */
function resolveMissingOfficialExternalChannelPluginRepairHint(params) {
	const hint = resolveOfficialExternalPluginRepairHint(params.channelId);
	if (!hint?.channelId || hint.channelId !== params.channelId) return null;
	const policy = require_channel_presence_policy.resolveConfiguredChannelPresencePolicy({
		config: params.config,
		activationSourceConfig: params.activationSourceConfig,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includePersistedAuthState: false
	}).find((entry) => entry.channelId === hint.channelId);
	if (!policy || policy.effective) return null;
	return policy.blockedReasons.length === 1 && policy.blockedReasons[0] === "no-channel-owner" ? hint : null;
}
//#endregion
Object.defineProperty(exports, "resolveMissingOfficialExternalChannelPluginRepairHint", {
	enumerable: true,
	get: function() {
		return resolveMissingOfficialExternalChannelPluginRepairHint;
	}
});
Object.defineProperty(exports, "resolveOfficialExternalPluginRepairHint", {
	enumerable: true,
	get: function() {
		return resolveOfficialExternalPluginRepairHint;
	}
});
