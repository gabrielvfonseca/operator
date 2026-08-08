const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_standalone_runtime_registry_loader = require("./standalone-runtime-registry-loader-2s9-FIR1.cjs");
//#region src/agents/runtime-plugins.ts
var runtime_plugins_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ ensureRuntimePluginsLoaded: () => ensureRuntimePluginsLoaded });
function resolveStartupPluginIdsFromCurrentSnapshot(params) {
	const pluginIds = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.config,
		workspaceDir: params.workspaceDir
	})?.startup?.pluginIds;
	if (!Array.isArray(pluginIds)) return;
	return pluginIds.filter((pluginId) => typeof pluginId === "string");
}
/** Ensure standalone runtime plugins are loaded for the current agent context. */
function ensureRuntimePluginsLoaded(params) {
	if (params.config && !require_config_state.normalizePluginsConfig(params.config.plugins).enabled) return;
	const workspaceDir = typeof params.workspaceDir === "string" && params.workspaceDir.trim() ? require_home_dir.resolveUserPath(params.workspaceDir) : void 0;
	const startupPluginIds = resolveStartupPluginIdsFromCurrentSnapshot({
		config: params.config,
		workspaceDir
	});
	const allowGatewaySubagentBinding = params.allowGatewaySubagentBinding === true || require_runtime.getActivePluginRuntimeSubagentMode() === "gateway-bindable";
	require_standalone_runtime_registry_loader.ensureStandaloneRuntimePluginRegistryLoaded({
		requiredPluginIds: startupPluginIds,
		loadOptions: {
			config: params.config,
			workspaceDir,
			...startupPluginIds === void 0 ? {} : { onlyPluginIds: startupPluginIds },
			...startupPluginIds === void 0 ? {} : { forceFullRuntimeForChannelPlugins: true },
			runtimeOptions: allowGatewaySubagentBinding ? { allowGatewaySubagentBinding: true } : void 0
		}
	});
}
//#endregion
Object.defineProperty(exports, "ensureRuntimePluginsLoaded", {
	enumerable: true,
	get: function() {
		return ensureRuntimePluginsLoaded;
	}
});
Object.defineProperty(exports, "runtime_plugins_exports", {
	enumerable: true,
	get: function() {
		return runtime_plugins_exports;
	}
});
