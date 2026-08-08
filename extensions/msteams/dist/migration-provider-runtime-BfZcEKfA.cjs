const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_bundled_plugin_metadata = require("./bundled-plugin-metadata-h4MVizJT.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
const require_bundled_compat = require("./bundled-compat-CE2H4H2e.cjs");
const require_standalone_runtime_registry_loader = require("./standalone-runtime-registry-loader-2s9-FIR1.cjs");
const require_manifest_contract_runtime = require("./manifest-contract-runtime-x2ZEDLx5.cjs");
//#region src/plugins/migration-provider-runtime.ts
var migration_provider_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	ensureStandaloneMigrationProviderRegistryLoaded: () => ensureStandaloneMigrationProviderRegistryLoaded,
	resolvePluginMigrationProvider: () => resolvePluginMigrationProvider,
	resolvePluginMigrationProviders: () => resolvePluginMigrationProviders
});
function findMigrationProviderById(entries, providerId) {
	return entries.find((entry) => entry.provider.id === providerId)?.provider;
}
function resolveMigrationProviderConfig(params) {
	return require_bundled_compat.withBundledPluginVitestCompat({
		config: require_bundled_compat.withBundledPluginEnablementCompat({
			config: params.cfg,
			pluginIds: [...params.bundledCompatPluginIds]
		}),
		pluginIds: [...params.bundledCompatPluginIds],
		env: process.env
	});
}
function resolveMigrationProviderRegistry(params) {
	return require_active_runtime_registry.getLoadedRuntimePluginRegistry({ requiredPluginIds: params.pluginIds });
}
function resolveMigrationProviderPluginResolution(params) {
	const resolution = require_manifest_contract_runtime.resolveManifestContractRuntimePluginResolution({
		cfg: params.cfg,
		contract: "migrationProviders",
		...params.providerId ? { value: params.providerId } : {}
	});
	const pluginIds = new Set(resolution.pluginIds);
	const bundledCompatPluginIds = new Set(resolution.bundledCompatPluginIds);
	for (const plugin of require_bundled_plugin_metadata.listBundledPluginMetadata({ includeChannelConfigs: false })) {
		const providerIds = plugin.manifest.contracts?.migrationProviders ?? [];
		if (providerIds.length === 0 || params.providerId && !providerIds.includes(params.providerId)) continue;
		pluginIds.add(plugin.manifest.id);
		bundledCompatPluginIds.add(plugin.manifest.id);
	}
	return {
		pluginIds: [...pluginIds].toSorted((left, right) => left.localeCompare(right)),
		bundledCompatPluginIds: [...bundledCompatPluginIds].toSorted((left, right) => left.localeCompare(right))
	};
}
function mergeMigrationProviders(left, right) {
	const merged = /* @__PURE__ */ new Map();
	for (const entry of [...left, ...right]) if (!merged.has(entry.provider.id)) merged.set(entry.provider.id, entry.provider);
	return [...merged.values()].toSorted((a, b) => a.id.localeCompare(b.id));
}
function ensureStandaloneMigrationProviderRegistryLoaded(params = {}) {
	const resolution = resolveMigrationProviderPluginResolution(params);
	if (resolution.pluginIds.length === 0) return;
	const compatConfig = resolveMigrationProviderConfig({
		cfg: params.cfg,
		bundledCompatPluginIds: resolution.bundledCompatPluginIds
	});
	require_standalone_runtime_registry_loader.ensureStandaloneRuntimePluginRegistryLoaded({
		surface: "active",
		requiredPluginIds: resolution.pluginIds,
		loadOptions: {
			...compatConfig === void 0 ? {} : { config: compatConfig },
			onlyPluginIds: resolution.pluginIds,
			activate: false
		}
	});
}
function resolvePluginMigrationProvider(params) {
	const activeProvider = findMigrationProviderById(require_active_runtime_registry.getLoadedRuntimePluginRegistry()?.migrationProviders ?? [], params.providerId);
	if (activeProvider) return activeProvider;
	const pluginIds = resolveMigrationProviderPluginResolution({
		cfg: params.cfg,
		providerId: params.providerId
	}).pluginIds;
	if (pluginIds.length === 0) return;
	return findMigrationProviderById(resolveMigrationProviderRegistry({ pluginIds })?.migrationProviders ?? [], params.providerId);
}
function resolvePluginMigrationProviders(params = {}) {
	const activeProviders = require_active_runtime_registry.getLoadedRuntimePluginRegistry()?.migrationProviders ?? [];
	const pluginIds = resolveMigrationProviderPluginResolution({ cfg: params.cfg }).pluginIds;
	if (pluginIds.length === 0) return mergeMigrationProviders(activeProviders, []);
	return mergeMigrationProviders(activeProviders, resolveMigrationProviderRegistry({ pluginIds })?.migrationProviders ?? []);
}
//#endregion
Object.defineProperty(exports, "ensureStandaloneMigrationProviderRegistryLoaded", {
	enumerable: true,
	get: function() {
		return ensureStandaloneMigrationProviderRegistryLoaded;
	}
});
Object.defineProperty(exports, "migration_provider_runtime_exports", {
	enumerable: true,
	get: function() {
		return migration_provider_runtime_exports;
	}
});
Object.defineProperty(exports, "resolvePluginMigrationProvider", {
	enumerable: true,
	get: function() {
		return resolvePluginMigrationProvider;
	}
});
Object.defineProperty(exports, "resolvePluginMigrationProviders", {
	enumerable: true,
	get: function() {
		return resolvePluginMigrationProviders;
	}
});
