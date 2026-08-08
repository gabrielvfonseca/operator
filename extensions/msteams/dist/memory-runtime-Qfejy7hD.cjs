const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
const require_standalone_runtime_registry_loader = require("./standalone-runtime-registry-loader-2s9-FIR1.cjs");
//#region src/plugins/memory-runtime.ts
/** Resolves the configured memory slot to the single runtime plugin that may load memory. */
function resolveMemoryRuntimePluginIds(config) {
	const plugins = require_config_state.normalizePluginsConfig(config.plugins);
	const memorySlot = plugins.slots.memory;
	if (!plugins.enabled || typeof memorySlot !== "string" || memorySlot.trim().length === 0) return [];
	const pluginId = memorySlot.trim();
	if (plugins.deny.includes(pluginId) || plugins.entries[pluginId]?.enabled === false) return [];
	return [pluginId];
}
function resolveMemoryRuntimeWorkspaceDir(cfg) {
	const dir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg));
	if (typeof dir !== "string" || !dir.trim()) return;
	return require_home_dir.resolveUserPath(dir);
}
function ensureMemoryRuntime(cfg) {
	const current = require_registry.getMemoryRuntime();
	if (current || !cfg) return current;
	const onlyPluginIds = resolveMemoryRuntimePluginIds(cfg);
	if (onlyPluginIds.length === 0) return require_registry.getMemoryRuntime();
	require_active_runtime_registry.getLoadedRuntimePluginRegistry({ requiredPluginIds: onlyPluginIds });
	if (require_registry.getMemoryRuntime()) return require_registry.getMemoryRuntime();
	require_standalone_runtime_registry_loader.ensureStandaloneRuntimePluginRegistryLoaded({
		requiredPluginIds: onlyPluginIds,
		loadOptions: {
			config: cfg,
			onlyPluginIds,
			workspaceDir: resolveMemoryRuntimeWorkspaceDir(cfg)
		}
	});
	return require_registry.getMemoryRuntime();
}
/** Returns the active plugin-backed memory search manager for an agent. */
async function getActiveMemorySearchManager(params) {
	const runtime = ensureMemoryRuntime(params.cfg);
	if (!runtime) return {
		manager: null,
		error: "memory plugin unavailable"
	};
	return await runtime.getMemorySearchManager(params);
}
/** Resolves current memory backend config without constructing a manager. */
function resolveActiveMemoryBackendConfig(params) {
	return ensureMemoryRuntime(params.cfg)?.resolveMemoryBackendConfig(params) ?? null;
}
//#endregion
Object.defineProperty(exports, "getActiveMemorySearchManager", {
	enumerable: true,
	get: function() {
		return getActiveMemorySearchManager;
	}
});
Object.defineProperty(exports, "resolveActiveMemoryBackendConfig", {
	enumerable: true,
	get: function() {
		return resolveActiveMemoryBackendConfig;
	}
});
