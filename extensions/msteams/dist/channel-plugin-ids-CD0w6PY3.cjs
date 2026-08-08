const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
//#region src/plugins/channel-plugin-ids.ts
var channel_plugin_ids_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	collectConfiguredMemoryEmbeddingProviderIds: () => require_gateway_startup_plugin_ids.collectConfiguredMemoryEmbeddingProviderIds,
	collectConfiguredMemoryEmbeddingStartupProviderOwners: () => require_gateway_startup_plugin_ids.collectConfiguredMemoryEmbeddingStartupProviderOwners,
	collectRegisteredEmbeddingProviderIds: () => require_gateway_startup_plugin_ids.collectRegisteredEmbeddingProviderIds,
	collectUnregisteredConfiguredMemoryEmbeddingProviders: () => require_gateway_startup_plugin_ids.collectUnregisteredConfiguredMemoryEmbeddingProviders,
	createConfigValidationMetadataPluginIdScope: () => require_gateway_startup_plugin_ids.createConfigValidationMetadataPluginIdScope,
	createGatewayStartupMetadataPluginIdScope: () => require_gateway_startup_plugin_ids.createGatewayStartupMetadataPluginIdScope,
	hasConfiguredChannelsForReadOnlyScope: () => require_channel_presence_policy.hasConfiguredChannelsForReadOnlyScope,
	hasExplicitChannelConfig: () => require_channel_presence_policy.hasExplicitChannelConfig,
	isMetadataSnapshotScopedForGatewayStartup: () => require_gateway_startup_plugin_ids.isMetadataSnapshotScopedForGatewayStartup,
	listConfiguredAnnounceChannelIdsForConfig: () => require_channel_presence_policy.listConfiguredAnnounceChannelIdsForConfig,
	listConfiguredChannelIdsForReadOnlyScope: () => require_channel_presence_policy.listConfiguredChannelIdsForReadOnlyScope,
	listExplicitConfiguredChannelIdsForConfig: () => require_channel_presence_policy.listExplicitConfiguredChannelIdsForConfig,
	loadGatewayStartupPluginPlan: () => require_gateway_startup_plugin_ids.loadGatewayStartupPluginPlan,
	resolveChannelPluginIds: () => require_gateway_startup_plugin_ids.resolveChannelPluginIds,
	resolveChannelPluginIdsFromRegistry: () => require_gateway_startup_plugin_ids.resolveChannelPluginIdsFromRegistry,
	resolveConfigValidationMetadataPluginIds: () => require_gateway_startup_plugin_ids.resolveConfigValidationMetadataPluginIds,
	resolveConfiguredChannelPluginIds: () => require_channel_presence_policy.resolveConfiguredChannelPluginIds,
	resolveConfiguredChannelPresencePolicy: () => require_channel_presence_policy.resolveConfiguredChannelPresencePolicy,
	resolveConfiguredDeferredChannelPluginIds: () => require_gateway_startup_plugin_ids.resolveConfiguredDeferredChannelPluginIds,
	resolveConfiguredDeferredChannelPluginIdsFromRegistry: () => require_gateway_startup_plugin_ids.resolveConfiguredDeferredChannelPluginIdsFromRegistry,
	resolveDiscoverableScopedChannelPluginIds: () => require_channel_presence_policy.resolveDiscoverableScopedChannelPluginIds,
	resolveGatewayStartupMetadataPluginIds: () => require_gateway_startup_plugin_ids.resolveGatewayStartupMetadataPluginIds,
	resolveGatewayStartupPluginIds: () => require_gateway_startup_plugin_ids.resolveGatewayStartupPluginIds,
	resolveGatewayStartupPluginIdsFromRegistry: () => require_gateway_startup_plugin_ids.resolveGatewayStartupPluginIdsFromRegistry,
	resolveGatewayStartupPluginPlanFromRegistry: () => require_gateway_startup_plugin_ids.resolveGatewayStartupPluginPlanFromRegistry
});
//#endregion
Object.defineProperty(exports, "channel_plugin_ids_exports", {
	enumerable: true,
	get: function() {
		return channel_plugin_ids_exports;
	}
});
