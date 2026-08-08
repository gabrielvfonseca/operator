const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
//#region src/gateway/runtime-plugin-config.ts
const gatewayPluginConfigCache = /* @__PURE__ */ new WeakMap();
/** Resolves runtime config with plugin auto-enable applied for gateway startup/reload paths. */
function resolveGatewayPluginConfig(params) {
	const currentSnapshot = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.config,
		allowWorkspaceScopedSnapshot: true
	});
	if (!currentSnapshot) return require_plugin_auto_enable.applyPluginAutoEnable({ config: params.config }).config;
	const cached = gatewayPluginConfigCache.get(params.config);
	if (cached?.snapshot === currentSnapshot) return cached.config;
	const config = require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.config,
		manifestRegistry: currentSnapshot.manifestRegistry,
		discovery: currentSnapshot.discovery
	}).config;
	gatewayPluginConfigCache.set(params.config, {
		snapshot: currentSnapshot,
		config
	});
	return config;
}
//#endregion
Object.defineProperty(exports, "resolveGatewayPluginConfig", {
	enumerable: true,
	get: function() {
		return resolveGatewayPluginConfig;
	}
});
