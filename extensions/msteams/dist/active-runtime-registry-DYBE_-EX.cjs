const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/active-runtime-registry.ts
function getActiveRuntimePluginRegistry() {
	return require_runtime.getActivePluginRegistry();
}
function isRuntimePluginRecordLoaded(plugin) {
	return plugin.status === "loaded" && (plugin.format === "bundle" || plugin.imported !== false);
}
function listLoadedRuntimePluginIdsAcrossSurfaces() {
	const loaded = [];
	for (const registry of require_runtime.collectLivePluginRegistries()) for (const plugin of registry.plugins ?? []) if (isRuntimePluginRecordLoaded(plugin)) loaded.push(plugin.id);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(loaded);
}
function normalizeRequiredPluginIds(ids) {
	if (ids === void 0) return;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(ids);
}
function registryContainsRuntimePluginIds(registry, pluginIds) {
	if (pluginIds === void 0) return true;
	const present = /* @__PURE__ */ new Set();
	const loaded = /* @__PURE__ */ new Set();
	const pluginStatusById = /* @__PURE__ */ new Map();
	const pluginRuntimeLoadedById = /* @__PURE__ */ new Map();
	for (const plugin of registry.plugins ?? []) {
		present.add(plugin.id);
		pluginStatusById.set(plugin.id, plugin.status);
		pluginRuntimeLoadedById.set(plugin.id, isRuntimePluginRecordLoaded(plugin));
		if (plugin.status === void 0 || isRuntimePluginRecordLoaded(plugin)) loaded.add(plugin.id);
	}
	for (const [key, value] of Object.entries(registry)) {
		if (key === "diagnostics" || key === "channelSetups") continue;
		if (!Array.isArray(value)) continue;
		for (const entry of value) if (entry && typeof entry === "object" && "pluginId" in entry) {
			const pluginId = entry.pluginId;
			if (typeof pluginId === "string" && pluginId.length > 0) {
				present.add(pluginId);
				if (pluginStatusById.get(pluginId) === void 0 || pluginRuntimeLoadedById.get(pluginId) === true) loaded.add(pluginId);
			}
		}
	}
	if (pluginIds.length === 0) return present.size === 0;
	return pluginIds.every((pluginId) => loaded.has(pluginId));
}
function resolveSurfaceRegistry(surface) {
	switch (surface) {
		case "active": return require_runtime.getActivePluginRegistry();
		case "channel": return require_runtime.getActivePluginChannelRegistry();
		case "http-route": return require_runtime.getActivePluginHttpRouteRegistry();
	}
	return null;
}
function getLoadedRuntimePluginRegistry(params = {}) {
	const surface = params.surface ?? "active";
	const requiredPluginIds = normalizeRequiredPluginIds(params.requiredPluginIds ?? params.loadOptions?.onlyPluginIds);
	if (surface === "active" && params.loadOptions && requiredPluginIds?.length !== 0) {
		const compatible = require_loader.resolveCompatibleRuntimePluginRegistry(params.loadOptions);
		if (!compatible || !registryContainsRuntimePluginIds(compatible, requiredPluginIds)) return;
		return compatible;
	}
	const activeWorkspaceDir = require_runtime.getActivePluginRegistryWorkspaceDir();
	const requestedWorkspaceDir = params.workspaceDir ?? params.loadOptions?.workspaceDir;
	if (requestedWorkspaceDir !== void 0 && activeWorkspaceDir !== requestedWorkspaceDir) return;
	const registry = resolveSurfaceRegistry(surface);
	if (!registry) return;
	if (!registryContainsRuntimePluginIds(registry, requiredPluginIds)) return;
	return registry;
}
//#endregion
Object.defineProperty(exports, "getActiveRuntimePluginRegistry", {
	enumerable: true,
	get: function() {
		return getActiveRuntimePluginRegistry;
	}
});
Object.defineProperty(exports, "getLoadedRuntimePluginRegistry", {
	enumerable: true,
	get: function() {
		return getLoadedRuntimePluginRegistry;
	}
});
Object.defineProperty(exports, "listLoadedRuntimePluginIdsAcrossSurfaces", {
	enumerable: true,
	get: function() {
		return listLoadedRuntimePluginIdsAcrossSurfaces;
	}
});
Object.defineProperty(exports, "registryContainsRuntimePluginIds", {
	enumerable: true,
	get: function() {
		return registryContainsRuntimePluginIds;
	}
});
