const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
//#region src/plugins/runtime/standalone-runtime-registry-loader.ts
function resolveRuntimeSubagentMode(loadOptions) {
	if (loadOptions.runtimeOptions?.allowGatewaySubagentBinding === true) return "gateway-bindable";
	if (loadOptions.runtimeOptions?.subagent) return "explicit";
	return "default";
}
function installStandaloneRuntimePluginRegistry(registry, params) {
	require_runtime.setActivePluginRegistry(registry, require_loader.resolvePluginRegistryLoadCacheKey(params.loadOptions), resolveRuntimeSubagentMode(params.loadOptions), params.loadOptions.workspaceDir);
	switch (params.surface) {
		case "active": break;
		case "channel":
			require_runtime.pinActivePluginChannelRegistry(registry);
			break;
		case "http-route":
			require_runtime.pinActivePluginHttpRouteRegistry(registry);
			break;
	}
}
function ensureStandaloneRuntimePluginRegistryLoaded(params) {
	const requiredPluginIds = params.requiredPluginIds ?? params.loadOptions.onlyPluginIds;
	const surface = params.surface ?? "active";
	if (!params.forceLoad) {
		const existing = require_active_runtime_registry.getLoadedRuntimePluginRegistry({
			env: params.loadOptions.env,
			loadOptions: params.loadOptions,
			workspaceDir: params.loadOptions.workspaceDir,
			requiredPluginIds,
			surface
		});
		if (existing) return existing;
	}
	const registry = require_loader.loadOperatorPlugins(params.forceLoad ? {
		...params.loadOptions,
		cache: false
	} : params.loadOptions);
	if (params.loadOptions.activate !== false) {
		switch (surface) {
			case "active": break;
			case "channel":
				require_runtime.pinActivePluginChannelRegistry(registry);
				break;
			case "http-route":
				require_runtime.pinActivePluginHttpRouteRegistry(registry);
				break;
		}
		return registry;
	}
	if (params.installRegistry === false) return registry;
	if (params.loadOptions.toolDiscovery === true) return registry;
	installStandaloneRuntimePluginRegistry(registry, {
		loadOptions: params.loadOptions,
		surface
	});
	return registry;
}
//#endregion
Object.defineProperty(exports, "ensureStandaloneRuntimePluginRegistryLoaded", {
	enumerable: true,
	get: function() {
		return ensureStandaloneRuntimePluginRegistryLoaded;
	}
});
