const require_bootstrap_registry = require("./bootstrap-registry-C2aRGF1a.cjs");
const require_config_presence = require("./config-presence-iIICLITG.cjs");
const require_channel_configured_shared = require("./channel-configured-shared-BK0nEQGb.cjs");
//#region src/channels/plugins/configured-state.ts
/**
* Lists bundled channel ids that expose configured-state detectors.
*/
function listBundledChannelIdsWithConfiguredState(discovery) {
	return require_config_presence.listBundledChannelIdsForPackageState("configuredState", discovery);
}
/**
* Checks whether a bundled channel reports configured state for the current config.
*/
function hasBundledChannelConfiguredState(params) {
	return require_config_presence.hasBundledChannelPackageState({
		metadataKey: "configuredState",
		channelId: params.channelId,
		cfg: params.cfg,
		env: params.env,
		discovery: params.discovery
	});
}
//#endregion
//#region src/config/channel-configured.ts
/** Resolves whether a channel has enough config, env, or plugin state to be considered setup. */
function isChannelConfigured(cfg, channelId, env = process.env) {
	if (require_channel_configured_shared.hasMeaningfulChannelConfigShallow(require_channel_configured_shared.resolveChannelConfigRecord(cfg, channelId))) return true;
	if (hasBundledChannelConfiguredState({
		channelId,
		cfg,
		env
	})) return true;
	const plugin = require_bootstrap_registry.getBootstrapChannelPlugin(channelId);
	return Boolean(plugin?.config?.hasConfiguredState?.({
		cfg,
		env
	}));
}
//#endregion
Object.defineProperty(exports, "hasBundledChannelConfiguredState", {
	enumerable: true,
	get: function() {
		return hasBundledChannelConfiguredState;
	}
});
Object.defineProperty(exports, "isChannelConfigured", {
	enumerable: true,
	get: function() {
		return isChannelConfigured;
	}
});
Object.defineProperty(exports, "listBundledChannelIdsWithConfiguredState", {
	enumerable: true,
	get: function() {
		return listBundledChannelIdsWithConfiguredState;
	}
});
