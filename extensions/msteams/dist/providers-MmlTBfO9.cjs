const require_redact = require("./redact-Bg-yc44I.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_manifest_owner_policy = require("./manifest-owner-policy-BI1K0z-h.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_bundled_compat = require("./bundled-compat-CE2H4H2e.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/providers.ts
function loadProviderRegistrySnapshot(params) {
	if (params.registry) return params.registry;
	return require_plugin_registry.loadPluginRegistrySnapshot({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
}
function loadScopedProviderRegistry(params) {
	return {
		registry: loadProviderRegistrySnapshot(params),
		onlyPluginIdSet: require_current_plugin_metadata_snapshot.createPluginIdScopeSet(params.onlyPluginIds)
	};
}
function listRegistryPluginIds(registry, predicate) {
	return registry.plugins.filter(predicate).map((plugin) => plugin.pluginId).toSorted((left, right) => left.localeCompare(right));
}
function resolveProviderSurfacePluginIdSet(params) {
	return new Set(resolveManifestRegistry({
		...params,
		includeDisabled: true
	}).plugins.flatMap((plugin) => plugin.providers.length > 0 ? [plugin.id] : []));
}
function pluginOwnsProviderRef(plugin, normalizedProvider) {
	if (plugin.providers.some((providerId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId) === normalizedProvider)) return true;
	for (const [rawAlias, target] of Object.entries(plugin.providerAuthAliases ?? {})) {
		const alias = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(rawAlias);
		const targetProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(target);
		if (alias === normalizedProvider && targetProvider && plugin.providers.some((providerId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId) === targetProvider)) return true;
	}
	for (const [rawAlias, target] of Object.entries(plugin.modelCatalog?.aliases ?? {})) {
		const alias = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(rawAlias);
		const targetProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(target.provider);
		if (alias === normalizedProvider && targetProvider && plugin.providers.some((providerId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId) === targetProvider)) return true;
	}
	return false;
}
function resolvesRuntimeModelCatalogAugment(plugin) {
	return plugin.modelCatalog?.runtimeAugment === true || plugin.origin !== "bundled" && plugin.providers.length > 0;
}
function resolveProviderOwnerPluginIds(params) {
	if (params.pluginIds.length === 0) return [];
	const pluginIdSet = new Set(params.pluginIds);
	const registry = loadProviderRegistrySnapshot(params);
	const normalizedConfig = require_plugin_registry.normalizePluginsConfigWithRegistry(params.config?.plugins, registry, { manifestRegistry: params.manifestRegistry });
	return listRegistryPluginIds(registry, (plugin) => pluginIdSet.has(plugin.pluginId) && params.isEligible(plugin, normalizedConfig));
}
function resolveEffectiveRegistryPluginActivation(params) {
	return require_config_state.resolveEffectivePluginActivationState({
		id: params.plugin.pluginId,
		origin: params.plugin.origin,
		config: params.normalizedConfig,
		rootConfig: params.rootConfig,
		enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(params.plugin)
	});
}
function toManifestOwnerRecord(plugin) {
	return {
		id: plugin.pluginId,
		origin: plugin.origin,
		enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(plugin)
	};
}
function withBundledProviderVitestCompat(params) {
	return require_bundled_compat.withBundledPluginVitestCompat(params);
}
function resolveBundledProviderCompatPluginIds(params) {
	if (params.manifestRegistry) {
		const onlyPluginIdSet = require_current_plugin_metadata_snapshot.createPluginIdScopeSet(params.onlyPluginIds);
		return params.manifestRegistry.plugins.filter((plugin) => plugin.origin === "bundled" && plugin.providers.length > 0 && (!onlyPluginIdSet || onlyPluginIdSet.has(plugin.id))).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
	}
	const { registry, onlyPluginIdSet } = loadScopedProviderRegistry(params);
	const providerSurfacePluginIds = resolveProviderSurfacePluginIdSet({
		...params,
		registry
	});
	return listRegistryPluginIds(registry, (plugin) => plugin.origin === "bundled" && providerSurfacePluginIds.has(plugin.pluginId) && (!onlyPluginIdSet || onlyPluginIdSet.has(plugin.pluginId)));
}
function resolveEnabledProviderPluginIds(params) {
	const { registry, onlyPluginIdSet } = loadScopedProviderRegistry(params);
	const providerSurfacePluginIds = resolveProviderSurfacePluginIdSet({
		...params,
		registry
	});
	const normalizedConfig = require_plugin_registry.normalizePluginsConfigWithRegistry(params.config?.plugins, registry, { manifestRegistry: params.manifestRegistry });
	return listRegistryPluginIds(registry, (plugin) => providerSurfacePluginIds.has(plugin.pluginId) && (!onlyPluginIdSet || onlyPluginIdSet.has(plugin.pluginId)) && resolveEffectiveRegistryPluginActivation({
		plugin,
		normalizedConfig,
		rootConfig: params.config
	}).activated);
}
function resolveExternalAuthProfileProviderPluginIds(params) {
	return resolveRegistryManifestContractPluginIds({
		...params,
		contract: "externalAuthProviders"
	});
}
function resolveRegistryManifestContractPluginIds(params) {
	const { registry, onlyPluginIdSet } = loadScopedProviderRegistry(params);
	return resolveManifestRegistry({
		...params,
		registry,
		includeDisabled: true
	}).plugins.filter((plugin) => {
		if (params.origin && plugin.origin !== params.origin) return false;
		if (onlyPluginIdSet && !onlyPluginIdSet.has(plugin.id)) return false;
		return (plugin.contracts?.[params.contract] ?? []).length > 0;
	}).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
function resolveExternalAuthProfileCompatFallbackPluginIds(params) {
	const declaredPluginIds = params.declaredPluginIds ?? new Set(resolveExternalAuthProfileProviderPluginIds(params));
	const registry = loadProviderRegistrySnapshot(params);
	const providerSurfacePluginIds = resolveProviderSurfacePluginIdSet({
		...params,
		registry
	});
	const normalizedConfig = require_plugin_registry.normalizePluginsConfigWithRegistry(params.config?.plugins, registry, { manifestRegistry: params.manifestRegistry });
	return listRegistryPluginIds(registry, (plugin) => plugin.origin !== "bundled" && providerSurfacePluginIds.has(plugin.pluginId) && !declaredPluginIds.has(plugin.pluginId) && isProviderPluginEligibleForRuntimeOwnerActivation({
		plugin,
		normalizedConfig,
		rootConfig: params.config
	}));
}
function resolveDiscoveredProviderPluginIds(params) {
	const { registry, onlyPluginIdSet } = loadScopedProviderRegistry(params);
	const providerSurfacePluginIds = resolveProviderSurfacePluginIdSet({
		...params,
		registry
	});
	const shouldFilterUntrustedWorkspacePlugins = params.includeUntrustedWorkspacePlugins !== true;
	const normalizedConfig = require_plugin_registry.normalizePluginsConfigWithRegistry(params.config?.plugins, registry, { manifestRegistry: params.manifestRegistry });
	return listRegistryPluginIds(registry, (plugin) => {
		if (!(providerSurfacePluginIds.has(plugin.pluginId) && (!onlyPluginIdSet || onlyPluginIdSet.has(plugin.pluginId)))) return false;
		return isProviderPluginEligibleForSetupDiscovery({
			plugin,
			shouldFilterUntrustedWorkspacePlugins,
			normalizedConfig,
			rootConfig: params.config
		});
	});
}
function isProviderPluginEligibleForSetupDiscovery(params) {
	if (params.plugin.origin === "workspace") {
		if (!params.shouldFilterUntrustedWorkspacePlugins) return true;
	}
	if (!require_manifest_owner_policy.passesManifestOwnerBasePolicy({
		plugin: toManifestOwnerRecord(params.plugin),
		normalizedConfig: params.normalizedConfig
	})) return false;
	if (params.plugin.origin === "bundled") return true;
	return require_manifest_owner_policy.isActivatedManifestOwner({
		plugin: toManifestOwnerRecord(params.plugin),
		normalizedConfig: params.normalizedConfig,
		rootConfig: params.rootConfig
	});
}
function resolveDiscoverableProviderOwnerPluginIds(params) {
	const shouldFilterUntrustedWorkspacePlugins = params.includeUntrustedWorkspacePlugins !== true;
	return resolveProviderOwnerPluginIds({
		...params,
		isEligible: (plugin, normalizedConfig) => isProviderPluginEligibleForSetupDiscovery({
			plugin,
			shouldFilterUntrustedWorkspacePlugins,
			normalizedConfig,
			rootConfig: params.config
		})
	});
}
function isProviderPluginEligibleForRuntimeOwnerActivation(params) {
	if (!require_manifest_owner_policy.passesManifestOwnerBasePolicy({
		plugin: toManifestOwnerRecord(params.plugin),
		normalizedConfig: params.normalizedConfig
	})) return false;
	if (params.plugin.origin !== "workspace") return true;
	return require_manifest_owner_policy.isActivatedManifestOwner({
		plugin: toManifestOwnerRecord(params.plugin),
		normalizedConfig: params.normalizedConfig,
		rootConfig: params.rootConfig
	});
}
function resolveActivatableProviderOwnerPluginIds(params) {
	return resolveProviderOwnerPluginIds({
		...params,
		isEligible: (plugin, normalizedConfig) => isProviderPluginEligibleForRuntimeOwnerActivation({
			plugin,
			normalizedConfig,
			rootConfig: params.config
		})
	});
}
function resolveManifestRegistry(params) {
	if (params.manifestRegistry) return params.manifestRegistry;
	if (params.metadataSnapshot) return params.metadataSnapshot.manifestRegistry;
	if (!params.registry) {
		const currentSnapshot = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
			config: params.config,
			env: params.env,
			...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
			allowWorkspaceScopedSnapshot: true
		});
		if (currentSnapshot) return currentSnapshot.manifestRegistry;
	}
	return require_current_plugin_metadata_snapshot.loadPluginManifestRegistryForInstalledIndex({
		index: params.registry ?? loadProviderRegistrySnapshot(params),
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeDisabled: params.includeDisabled
	});
}
function stripModelProfileSuffix(value) {
	return require_model_ref_profile.splitTrailingAuthProfile(value).model;
}
function splitExplicitModelRef(rawModel) {
	const trimmed = rawModel.trim();
	if (!trimmed) return null;
	const slash = trimmed.indexOf("/");
	if (slash === -1) {
		const modelId = stripModelProfileSuffix(trimmed);
		return modelId ? { modelId } : null;
	}
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(trimmed.slice(0, slash));
	const modelId = stripModelProfileSuffix(trimmed.slice(slash + 1));
	if (!provider || !modelId) return null;
	return {
		provider,
		modelId
	};
}
function resolveModelSupportMatchKind(plugin, modelId) {
	const patterns = plugin.modelSupport?.modelPatterns ?? [];
	for (const patternSource of patterns) if (require_redact.compileSafeRegex(patternSource, "u")?.test(modelId)) return "pattern";
	const prefixes = plugin.modelSupport?.modelPrefixes ?? [];
	for (const prefix of prefixes) if (modelId.startsWith(prefix)) return "prefix";
}
function classifyProviderRefOwnership(pluginIds) {
	if (!pluginIds || pluginIds.length === 0) return { status: "unowned" };
	if (pluginIds.length === 1) return {
		status: "owned",
		pluginIds
	};
	return {
		status: "ambiguous",
		pluginIds
	};
}
function listNormalizedOwnerMapPluginIds(owners, normalizedId) {
	const matched = [];
	for (const [ownedId, pluginIds] of owners) if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(ownedId) === normalizedId) matched.push(...pluginIds);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(matched);
}
function resolveOwningPluginIdsForProviderFromSnapshot(snapshot, normalizedProvider) {
	const directOwners = listNormalizedOwnerMapPluginIds(snapshot.owners.providers, normalizedProvider);
	const aliasOwners = listNormalizedOwnerMapPluginIds(snapshot.owners.modelCatalogProviders, normalizedProvider).filter((pluginId) => {
		const plugin = snapshot.byPluginId.get(pluginId);
		return plugin ? pluginOwnsProviderRef(plugin, normalizedProvider) : false;
	});
	const pluginIds = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([...directOwners, ...aliasOwners]);
	return pluginIds.length > 0 ? pluginIds : void 0;
}
function resolvePreferredManifestPluginIds(registry, matchedPluginIds) {
	if (matchedPluginIds.length === 0) return;
	const uniquePluginIds = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(matchedPluginIds);
	if (uniquePluginIds.length <= 1) return uniquePluginIds;
	const nonBundledPluginIds = uniquePluginIds.filter((pluginId) => {
		return registry.plugins.find((entry) => entry.id === pluginId)?.origin !== "bundled";
	});
	if (nonBundledPluginIds.length === 1) return nonBundledPluginIds;
	if (nonBundledPluginIds.length > 1) return;
}
function resolveOwningPluginIdsForProvider(params) {
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	if (!normalizedProvider) return;
	const metadataSnapshot = params.metadataSnapshot ?? (params.manifestRegistry ? void 0 : require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.config,
		env: params.env,
		...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
		allowWorkspaceScopedSnapshot: true
	}));
	if (metadataSnapshot) {
		const ownerIds = resolveOwningPluginIdsForProviderFromSnapshot(metadataSnapshot, normalizedProvider);
		if (ownerIds) return ownerIds;
	}
	const pluginIds = (params.manifestRegistry ?? metadataSnapshot?.manifestRegistry ?? require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: params.config ?? {},
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env
	}).manifestRegistry).plugins.filter((plugin) => pluginOwnsProviderRef(plugin, normalizedProvider)).map((plugin) => plugin.id);
	return pluginIds.length > 0 ? pluginIds : void 0;
}
function resolveOwningPluginIdsForCliBackend(params) {
	const normalizedBackend = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.backend);
	if (!normalizedBackend) return;
	const metadataSnapshot = params.metadataSnapshot ?? (params.manifestRegistry ? void 0 : require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.config,
		env: params.env,
		...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
		allowWorkspaceScopedSnapshot: true
	}));
	if (metadataSnapshot) {
		const ownerIds = listNormalizedOwnerMapPluginIds(metadataSnapshot.owners.cliBackends, normalizedBackend);
		if (ownerIds.length > 0) return ownerIds;
	}
	const deduped = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)((params.manifestRegistry ?? metadataSnapshot?.manifestRegistry ?? require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: params.config ?? {},
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env
	}).manifestRegistry).plugins.filter((plugin) => plugin.cliBackends.some((backendId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(backendId) === normalizedBackend) || (plugin.setup?.cliBackends ?? []).some((backendId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(backendId) === normalizedBackend)).map((plugin) => plugin.id));
	return deduped.length > 0 ? deduped : void 0;
}
function resolveOwningPluginIdsForProviderRef(params) {
	return resolveOwningPluginIdsForProvider(params) ?? resolveOwningPluginIdsForCliBackend({
		backend: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		manifestRegistry: params.manifestRegistry,
		metadataSnapshot: params.metadataSnapshot
	});
}
function resolveProviderRefOwnership(params) {
	const providerOwnership = classifyProviderRefOwnership(resolveOwningPluginIdsForProvider(params));
	if (providerOwnership.status !== "unowned") return providerOwnership;
	return classifyProviderRefOwnership(resolveOwningPluginIdsForCliBackend({
		backend: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		manifestRegistry: params.manifestRegistry,
		metadataSnapshot: params.metadataSnapshot
	}));
}
function resolveOwningPluginIdsForModelRef(params) {
	const parsed = splitExplicitModelRef(params.model);
	if (!parsed) return;
	if (parsed.provider) return resolveOwningPluginIdsForProvider({
		provider: parsed.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		manifestRegistry: params.manifestRegistry
	}) ?? resolveOwningPluginIdsForCliBackend({
		backend: parsed.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		manifestRegistry: params.manifestRegistry
	});
	const manifestRegistry = resolveManifestRegistry({
		...params,
		includeDisabled: true
	});
	const preferredPatternPluginIds = resolvePreferredManifestPluginIds(manifestRegistry, manifestRegistry.plugins.filter((plugin) => resolveModelSupportMatchKind(plugin, parsed.modelId) === "pattern").map((plugin) => plugin.id));
	if (preferredPatternPluginIds) return preferredPatternPluginIds;
	return resolvePreferredManifestPluginIds(manifestRegistry, manifestRegistry.plugins.filter((plugin) => resolveModelSupportMatchKind(plugin, parsed.modelId) === "prefix").map((plugin) => plugin.id));
}
function resolveOwningPluginIdsForModelRefs(params) {
	const registry = params.manifestRegistry ? void 0 : loadProviderRegistrySnapshot(params);
	const manifestRegistry = params.manifestRegistry;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(params.models.flatMap((model) => resolveOwningPluginIdsForModelRef({
		model,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		...manifestRegistry ? { manifestRegistry } : {},
		...registry ? { registry } : {}
	}) ?? []));
}
function resolveCatalogHookProviderPluginIds(params) {
	const registry = loadProviderRegistrySnapshot(params);
	const manifestRegistry = resolveManifestRegistry({
		...params,
		registry,
		includeDisabled: true
	});
	const providerSurfacePluginIds = new Set(manifestRegistry.plugins.flatMap((plugin) => plugin.providers.length > 0 ? [plugin.id] : []));
	const runtimeAugmentPluginIds = new Set(manifestRegistry.plugins.flatMap((plugin) => resolvesRuntimeModelCatalogAugment(plugin) ? [plugin.id] : []));
	const normalizedConfig = require_plugin_registry.normalizePluginsConfigWithRegistry(params.config?.plugins, registry);
	const enabledProviderPluginIds = listRegistryPluginIds(registry, (plugin) => providerSurfacePluginIds.has(plugin.pluginId) && runtimeAugmentPluginIds.has(plugin.pluginId) && resolveEffectiveRegistryPluginActivation({
		plugin,
		normalizedConfig,
		rootConfig: params.config
	}).activated);
	const bundledCompatPluginIds = resolveBundledProviderCompatPluginIds({
		...params,
		manifestRegistry
	}).filter((pluginId) => runtimeAugmentPluginIds.has(pluginId));
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([...enabledProviderPluginIds, ...bundledCompatPluginIds]);
}
function resolveUsageHookProviderPluginContracts(params) {
	const registry = loadProviderRegistrySnapshot(params);
	const manifestRegistry = resolveManifestRegistry({
		...params,
		registry,
		includeDisabled: true
	});
	const usagePluginIds = new Set(manifestRegistry.plugins.flatMap((plugin) => plugin.contracts?.usageProviders?.length ? [plugin.id] : []));
	const normalizedConfig = require_plugin_registry.normalizePluginsConfigWithRegistry(params.config?.plugins, registry);
	const enabledPluginIds = listRegistryPluginIds(registry, (plugin) => usagePluginIds.has(plugin.pluginId) && resolveEffectiveRegistryPluginActivation({
		plugin,
		normalizedConfig,
		rootConfig: params.config
	}).activated);
	const bundledCompatPluginIds = resolveBundledProviderCompatPluginIds({
		...params,
		manifestRegistry
	}).filter((pluginId) => usagePluginIds.has(pluginId));
	const pluginIds = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([...enabledPluginIds, ...bundledCompatPluginIds]);
	const manifestsById = new Map(manifestRegistry.plugins.map((plugin) => [plugin.id, plugin]));
	return pluginIds.flatMap((pluginId) => {
		const providerIds = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)((manifestsById.get(pluginId)?.contracts?.usageProviders ?? []).map(_gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId).filter(Boolean));
		return providerIds.length > 0 ? [{
			pluginId,
			providerIds
		}] : [];
	});
}
//#endregion
Object.defineProperty(exports, "resolveActivatableProviderOwnerPluginIds", {
	enumerable: true,
	get: function() {
		return resolveActivatableProviderOwnerPluginIds;
	}
});
Object.defineProperty(exports, "resolveBundledProviderCompatPluginIds", {
	enumerable: true,
	get: function() {
		return resolveBundledProviderCompatPluginIds;
	}
});
Object.defineProperty(exports, "resolveCatalogHookProviderPluginIds", {
	enumerable: true,
	get: function() {
		return resolveCatalogHookProviderPluginIds;
	}
});
Object.defineProperty(exports, "resolveDiscoverableProviderOwnerPluginIds", {
	enumerable: true,
	get: function() {
		return resolveDiscoverableProviderOwnerPluginIds;
	}
});
Object.defineProperty(exports, "resolveDiscoveredProviderPluginIds", {
	enumerable: true,
	get: function() {
		return resolveDiscoveredProviderPluginIds;
	}
});
Object.defineProperty(exports, "resolveEnabledProviderPluginIds", {
	enumerable: true,
	get: function() {
		return resolveEnabledProviderPluginIds;
	}
});
Object.defineProperty(exports, "resolveExternalAuthProfileCompatFallbackPluginIds", {
	enumerable: true,
	get: function() {
		return resolveExternalAuthProfileCompatFallbackPluginIds;
	}
});
Object.defineProperty(exports, "resolveExternalAuthProfileProviderPluginIds", {
	enumerable: true,
	get: function() {
		return resolveExternalAuthProfileProviderPluginIds;
	}
});
Object.defineProperty(exports, "resolveOwningPluginIdsForModelRef", {
	enumerable: true,
	get: function() {
		return resolveOwningPluginIdsForModelRef;
	}
});
Object.defineProperty(exports, "resolveOwningPluginIdsForModelRefs", {
	enumerable: true,
	get: function() {
		return resolveOwningPluginIdsForModelRefs;
	}
});
Object.defineProperty(exports, "resolveOwningPluginIdsForProvider", {
	enumerable: true,
	get: function() {
		return resolveOwningPluginIdsForProvider;
	}
});
Object.defineProperty(exports, "resolveOwningPluginIdsForProviderRef", {
	enumerable: true,
	get: function() {
		return resolveOwningPluginIdsForProviderRef;
	}
});
Object.defineProperty(exports, "resolveProviderRefOwnership", {
	enumerable: true,
	get: function() {
		return resolveProviderRefOwnership;
	}
});
Object.defineProperty(exports, "resolveUsageHookProviderPluginContracts", {
	enumerable: true,
	get: function() {
		return resolveUsageHookProviderPluginContracts;
	}
});
Object.defineProperty(exports, "withBundledProviderVitestCompat", {
	enumerable: true,
	get: function() {
		return withBundledProviderVitestCompat;
	}
});
