const require_plugin_cache_primitives = require("./plugin-cache-primitives-DGHa8Ph9.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
const require_providers_runtime = require("./providers.runtime-C5KyGi_O.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/model-catalog-scope.ts
/**
* Resolves model catalog scope from config and discovery options.
*/
function providerConfigDeclaresModel(providerConfig, model) {
	const trimmedModel = model.trim();
	return Boolean(trimmedModel && providerConfig?.models?.some((candidate) => candidate.id?.trim() === trimmedModel));
}
/** Resolves provider/model refs used to scope model catalog discovery. */
function resolveModelCatalogScope(params) {
	const provider = params.provider.trim();
	const model = params.model.trim();
	const providerConfig = (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.cfg?.models?.providers, provider);
	const modelRefs = providerConfigDeclaresModel(providerConfig, model) ? [provider && model ? `${provider}/${model}` : model] : [provider && model ? `${provider}/${model}` : model, model];
	return {
		providerRefs: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)([provider, providerConfig?.api]),
		modelRefs: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)(modelRefs)
	};
}
//#endregion
//#region src/plugins/provider-hook-runtime.ts
let providerRuntimePluginCache = /* @__PURE__ */ new WeakMap();
const defaultProviderRuntimePluginCache = new require_plugin_cache_primitives.PluginLruCache(128);
const PREPARED_PROVIDER_RUNTIME_SURFACES = ["channel"];
function clearProviderRuntimePluginCacheForTest() {
	providerRuntimePluginCache = /* @__PURE__ */ new WeakMap();
	defaultProviderRuntimePluginCache.clear();
}
function matchesProviderId(provider, providerId) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	if (!normalized) return false;
	if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider.id) === normalized) return true;
	return [...provider.aliases ?? [], ...provider.hookAliases ?? []].some((alias) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(alias) === normalized);
}
function resolveProviderRuntimePluginCacheKey(params, registryState = require_runtime_state.getPluginRegistryState()) {
	return JSON.stringify({
		provider: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.provider),
		modelId: resolveProviderRuntimeLookupModelId(params) ?? null,
		pluginControlPlane: require_current_plugin_metadata_snapshot.resolvePluginControlPlaneFingerprint({
			config: params.config,
			env: params.env,
			workspaceDir: params.workspaceDir
		}),
		plugins: params.config?.plugins,
		models: params.config?.models?.providers,
		workspaceDir: params.workspaceDir ?? "",
		applyAutoEnable: params.applyAutoEnable ?? null,
		bundledProviderVitestCompat: params.bundledProviderVitestCompat ?? null,
		pluginMetadata: params.pluginMetadataSnapshot?.manifestRegistry.plugins.map((plugin) => plugin.id).join(",") ?? null,
		pluginRegistryKey: registryState?.key ?? null,
		pluginRegistryVersion: registryState?.activeVersion ?? null
	});
}
function matchesProviderLiteralId(provider, providerId) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerId);
	return Boolean(normalized) && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(provider.id) === normalized;
}
function resolveProviderRuntimeLookupModelId(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.modelId ?? (typeof params.context?.modelId === "string" ? params.context.modelId : void 0));
}
function resolveProviderRuntimeLookupScope(params, apiOwnerHint) {
	const providerRefs = apiOwnerHint ? [params.provider, apiOwnerHint] : [params.provider];
	const modelId = resolveProviderRuntimeLookupModelId(params);
	if (!modelId) return { providerRefs };
	return {
		providerRefs,
		modelRefs: resolveModelCatalogScope({
			cfg: params.config,
			provider: params.provider,
			model: modelId
		}).modelRefs
	};
}
function findProviderRuntimePluginInLoadedRegistries(params) {
	const activeRegistry = require_active_runtime_registry.getLoadedRuntimePluginRegistry({
		env: params.lookup.env,
		workspaceDir: params.lookup.workspaceDir
	});
	const activePlugin = activeRegistry ? findProviderRuntimePluginInRegistry({
		registry: activeRegistry,
		provider: params.lookup.provider,
		apiOwnerHint: params.apiOwnerHint
	}) : void 0;
	if (activePlugin) return activePlugin;
	for (const surface of PREPARED_PROVIDER_RUNTIME_SURFACES) {
		const registry = require_active_runtime_registry.getLoadedRuntimePluginRegistry({
			env: params.lookup.env,
			workspaceDir: params.lookup.workspaceDir,
			surface
		});
		const plugin = registry ? findProviderRuntimePluginInRegistry({
			registry,
			provider: params.lookup.provider,
			apiOwnerHint: params.apiOwnerHint
		}) : void 0;
		if (plugin) return plugin;
	}
}
function findProviderRuntimePluginInRegistry(params) {
	return params.registry.providers.map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId })).find((plugin) => {
		if (params.apiOwnerHint) return matchesProviderLiteralId(plugin, params.provider) || matchesProviderId(plugin, params.apiOwnerHint);
		return matchesProviderId(plugin, params.provider);
	});
}
function hasConfiguredModelProvider(params) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.config?.models?.providers, params.provider) !== void 0;
}
function resolveProviderPluginsForHooks(params) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	return require_providers_runtime.resolvePluginProviders({
		...params,
		workspaceDir,
		env,
		activate: false,
		applyAutoEnable: params.applyAutoEnable,
		bundledProviderVitestCompat: params.bundledProviderVitestCompat ?? true,
		skipIfLoadInFlight: true
	});
}
function resolveProviderRuntimePlugin(params) {
	const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	const env = params.env ?? process.env;
	const lookup = {
		...params,
		workspaceDir,
		env
	};
	const apiOwnerHint = require_gateway_startup_plugin_ids.resolveProviderConfigApiOwnerHint({
		provider: params.provider,
		config: params.config
	});
	const providerRefs = apiOwnerHint ? [params.provider, apiOwnerHint] : [params.provider];
	const loadedPlugin = findProviderRuntimePluginInLoadedRegistries({
		lookup,
		apiOwnerHint
	});
	if (loadedPlugin) return loadedPlugin;
	if (require_providers_runtime.isPluginProvidersLoadInFlight({
		...params,
		workspaceDir,
		env,
		providerRefs,
		activate: false,
		applyAutoEnable: params.applyAutoEnable,
		bundledProviderVitestCompat: params.bundledProviderVitestCompat ?? true
	})) return;
	const cacheConfig = params.env && params.env !== process.env ? void 0 : params.config;
	const registryState = require_runtime_state.getPluginRegistryState();
	const cacheKey = resolveProviderRuntimePluginCacheKey(lookup, registryState);
	const load = () => {
		const lookupScope = resolveProviderRuntimeLookupScope(params, apiOwnerHint);
		return resolveProviderPluginsForHooks({
			config: params.config,
			workspaceDir,
			env,
			providerRefs: lookupScope.providerRefs,
			modelRefs: lookupScope.modelRefs,
			applyAutoEnable: params.applyAutoEnable,
			bundledProviderVitestCompat: params.bundledProviderVitestCompat,
			pluginMetadataSnapshot: params.pluginMetadataSnapshot
		}).find((plugin) => {
			if (apiOwnerHint) return matchesProviderLiteralId(plugin, params.provider) || matchesProviderId(plugin, apiOwnerHint);
			return matchesProviderId(plugin, params.provider);
		}) ?? null;
	};
	return (cacheConfig ? require_plugin_cache_primitives.resolveConfigScopedRuntimeCacheValue({
		cache: providerRuntimePluginCache,
		config: cacheConfig,
		key: cacheKey,
		load
	}) : !registryState?.key ? load() : (() => {
		const cached = defaultProviderRuntimePluginCache.getResult(cacheKey);
		if (cached.hit) return cached.value;
		const loaded = load();
		defaultProviderRuntimePluginCache.set(cacheKey, loaded);
		return loaded;
	})()) ?? void 0;
}
function resolveLoadedProviderRuntimePlugin(params) {
	return findProviderRuntimePluginInLoadedRegistries({
		lookup: params,
		apiOwnerHint: require_gateway_startup_plugin_ids.resolveProviderConfigApiOwnerHint({
			provider: params.provider,
			config: params.config
		})
	});
}
function resolveProviderHookPlugin(params) {
	const runtimePlugin = resolveProviderRuntimePlugin(params);
	if (runtimePlugin) return runtimePlugin;
	if (hasConfiguredModelProvider(params)) return;
	return resolveProviderPluginsForHooks({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}).find((candidate) => matchesProviderId(candidate, params.provider));
}
function resolveProviderRuntimePluginHandle(params) {
	const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	const env = params.env;
	const runtimePlugin = resolveProviderRuntimePlugin({
		...params,
		workspaceDir,
		env
	});
	return {
		...params,
		workspaceDir,
		env,
		plugin: runtimePlugin
	};
}
function ensureProviderRuntimePluginHandle(params) {
	const modelId = resolveProviderRuntimeLookupModelId(params);
	if (!params.runtimeHandle || modelId && !params.runtimeHandle.plugin && params.runtimeHandle.modelId !== modelId) return resolveProviderRuntimePluginHandle({
		provider: params.provider,
		modelId,
		config: params.config ?? params.runtimeHandle?.config,
		workspaceDir: params.workspaceDir ?? params.runtimeHandle?.workspaceDir,
		env: params.env ?? params.runtimeHandle?.env,
		applyAutoEnable: params.runtimeHandle?.applyAutoEnable,
		bundledProviderVitestCompat: params.runtimeHandle?.bundledProviderVitestCompat,
		pluginMetadataSnapshot: params.pluginMetadataSnapshot ?? params.runtimeHandle?.pluginMetadataSnapshot
	});
	return params.runtimeHandle;
}
function prepareProviderExtraParams(params) {
	return ensureProviderRuntimePluginHandle(params).plugin?.prepareExtraParams?.(params.context) ?? void 0;
}
function resolveProviderExtraParamsForTransport(params) {
	return ensureProviderRuntimePluginHandle(params).plugin?.extraParamsForTransport?.(params.context) ?? void 0;
}
function resolveProviderAuthProfileId(params) {
	const resolved = ensureProviderRuntimePluginHandle(params).plugin?.resolveAuthProfileId?.(params.context);
	return typeof resolved === "string" && resolved.trim() ? resolved.trim() : void 0;
}
function resolveProviderFollowupFallbackRoute(params) {
	return ensureProviderRuntimePluginHandle(params).plugin?.followupFallbackRoute?.(params.context) ?? void 0;
}
function wrapProviderStreamFn(params) {
	return ensureProviderRuntimePluginHandle(params).plugin?.wrapStreamFn?.(params.context) ?? void 0;
}
function wrapProviderSimpleCompletionStreamFn(params) {
	return ensureProviderRuntimePluginHandle(params).plugin?.wrapSimpleCompletionStreamFn?.(params.context) ?? void 0;
}
//#endregion
Object.defineProperty(exports, "clearProviderRuntimePluginCacheForTest", {
	enumerable: true,
	get: function() {
		return clearProviderRuntimePluginCacheForTest;
	}
});
Object.defineProperty(exports, "ensureProviderRuntimePluginHandle", {
	enumerable: true,
	get: function() {
		return ensureProviderRuntimePluginHandle;
	}
});
Object.defineProperty(exports, "prepareProviderExtraParams", {
	enumerable: true,
	get: function() {
		return prepareProviderExtraParams;
	}
});
Object.defineProperty(exports, "resolveLoadedProviderRuntimePlugin", {
	enumerable: true,
	get: function() {
		return resolveLoadedProviderRuntimePlugin;
	}
});
Object.defineProperty(exports, "resolveProviderAuthProfileId", {
	enumerable: true,
	get: function() {
		return resolveProviderAuthProfileId;
	}
});
Object.defineProperty(exports, "resolveProviderExtraParamsForTransport", {
	enumerable: true,
	get: function() {
		return resolveProviderExtraParamsForTransport;
	}
});
Object.defineProperty(exports, "resolveProviderFollowupFallbackRoute", {
	enumerable: true,
	get: function() {
		return resolveProviderFollowupFallbackRoute;
	}
});
Object.defineProperty(exports, "resolveProviderHookPlugin", {
	enumerable: true,
	get: function() {
		return resolveProviderHookPlugin;
	}
});
Object.defineProperty(exports, "resolveProviderPluginsForHooks", {
	enumerable: true,
	get: function() {
		return resolveProviderPluginsForHooks;
	}
});
Object.defineProperty(exports, "resolveProviderRuntimePlugin", {
	enumerable: true,
	get: function() {
		return resolveProviderRuntimePlugin;
	}
});
Object.defineProperty(exports, "resolveProviderRuntimePluginHandle", {
	enumerable: true,
	get: function() {
		return resolveProviderRuntimePluginHandle;
	}
});
Object.defineProperty(exports, "wrapProviderSimpleCompletionStreamFn", {
	enumerable: true,
	get: function() {
		return wrapProviderSimpleCompletionStreamFn;
	}
});
Object.defineProperty(exports, "wrapProviderStreamFn", {
	enumerable: true,
	get: function() {
		return wrapProviderStreamFn;
	}
});
