const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_runtime_web_tools_state = require("./runtime-web-tools-state-DbJISCDm.cjs");
const require_model_config_helpers = require("./model-config.helpers-BA8b3n7P.cjs");
const require_web_search_providers_shared = require("./web-search-providers.shared-C1hrTfhU.cjs");
const require_web_search_providers_runtime = require("./web-search-providers.runtime-BI5GXbuE.cjs");
const require_provider_runtime_shared = require("./provider-runtime-shared-BwM9S6Pg.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/web-search/runtime-execution.ts
function isStructuredAvailabilityError(result) {
	if (!result || typeof result !== "object" || !("error" in result)) return false;
	const error = result.error;
	return typeof error === "string" && /^missing_[a-z0-9_]*api_key$/i.test(error);
}
async function executeWebSearchCandidates(params) {
	let lastError;
	let sawUnavailableProvider = false;
	for (const candidate of params.candidates) {
		params.signal?.throwIfAborted();
		try {
			const definition = candidate.createTool({
				config: params.config,
				agentDir: params.agentDir,
				searchConfig: params.searchConfig,
				runtimeMetadata: params.runtimeMetadata
			});
			if (!definition) {
				if (!params.allowFallback) throw new Error(`web_search provider "${candidate.id}" is not available.`);
				sawUnavailableProvider = true;
				continue;
			}
			const executed = await definition.execute(params.args, { signal: params.signal });
			params.signal?.throwIfAborted();
			if (params.allowFallback && isStructuredAvailabilityError(executed)) {
				lastError = /* @__PURE__ */ new Error(`web_search provider "${candidate.id}" returned ${executed.error}`);
				continue;
			}
			return {
				provider: candidate.id,
				result: executed
			};
		} catch (error) {
			params.signal?.throwIfAborted();
			lastError = error;
			if (!params.allowFallback) throw error;
		}
	}
	if (sawUnavailableProvider && lastError === void 0) throw new Error("web_search is enabled but no provider is currently available.");
	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
//#endregion
//#region src/web-search/runtime.ts
var runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	hasUsableWebSearchProvider: () => hasUsableWebSearchProvider,
	isWebSearchProviderConfigured: () => isWebSearchProviderConfigured,
	listConfiguredWebSearchProviders: () => listConfiguredWebSearchProviders,
	listWebSearchProviders: () => listWebSearchProviders,
	resolveWebSearchProviderId: () => resolveWebSearchProviderId,
	runWebSearch: () => runWebSearch
});
function resolveSearchConfig(cfg) {
	return require_provider_runtime_shared.resolveWebProviderConfig(cfg, "search");
}
function resolveWebSearchRuntimeConfig(params) {
	if (params?.preferInputConfig && params.config) return params.config;
	return require_runtime_snapshot.selectApplicableRuntimeConfig({
		inputConfig: params?.config,
		runtimeConfig: require_runtime_snapshot.getRuntimeConfigSnapshot(),
		runtimeSourceConfig: require_runtime_snapshot.getRuntimeConfigSourceSnapshot()
	});
}
/** Resolves whether web_search is enabled for the current config/sandbox. */
function resolveWebSearchEnabled(params) {
	if (typeof params.search?.enabled === "boolean") return params.search.enabled;
	if (params.sandboxed) return true;
	return true;
}
function hasEntryCredential(provider, config, search, agentDir) {
	return require_provider_runtime_shared.hasWebProviderEntryCredential({
		provider,
		config,
		toolConfig: search,
		resolveRawValue: ({ provider: currentProvider, config: currentConfig }) => currentProvider.getConfiguredCredentialValue?.(currentConfig),
		resolveFallbackRawValue: ({ provider: currentProvider, config: currentConfig }) => currentProvider.getConfiguredCredentialFallback?.(currentConfig)?.value,
		resolveEnvValue: ({ provider: currentProvider, configuredEnvVarId }) => (configuredEnvVarId ? require_provider_runtime_shared.readWebProviderEnvValue([configuredEnvVarId]) : void 0) ?? require_provider_runtime_shared.readWebProviderEnvValue(currentProvider.envVars),
		resolveProviderAuthValue: (providerId) => require_model_config_helpers.hasAuthProfileForProvider({
			provider: providerId,
			agentDir: agentDir?.trim() || require_agent_scope_config.resolveDefaultAgentDir(config ?? {})
		})
	});
}
function hasImplicitProviderSelectionSignal(provider, config, search, agentDir) {
	if (!require_provider_runtime_shared.providerRequiresCredential(provider)) return false;
	return hasEntryCredential(provider, config, search, agentDir);
}
/** Reports whether a web_search provider has usable configured credentials. */
function isWebSearchProviderConfigured(params) {
	const config = resolveWebSearchRuntimeConfig({ config: params.config });
	return hasEntryCredential(params.provider, config, resolveSearchConfig(config));
}
/** Lists runtime web_search providers after applying runtime config snapshots. */
function listWebSearchProviders(params) {
	return require_web_search_providers_runtime.resolveRuntimeWebSearchProviders({ config: resolveWebSearchRuntimeConfig({ config: params?.config }) });
}
/** Lists plugin-configured web_search providers without runtime-only providers. */
function listConfiguredWebSearchProviders(params) {
	return require_web_search_providers_runtime.resolvePluginWebSearchProviders({ config: resolveWebSearchRuntimeConfig({ config: params?.config }) });
}
/** Resolves configured or auto-detected web_search provider id. */
function resolveWebSearchProviderId(params) {
	const config = resolveWebSearchRuntimeConfig({ config: params.config });
	const search = params.search ?? resolveSearchConfig(config);
	const providers = require_web_search_providers_shared.sortWebSearchProvidersForAutoDetect(params.providers ?? require_web_search_providers_runtime.resolvePluginWebSearchProviders({ config }));
	const raw = search && "provider" in search ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(search.provider) : "";
	if (raw) {
		const explicit = providers.find((provider) => provider.id === raw);
		if (explicit) return explicit.id;
	}
	if (!raw) {
		for (const provider of providers) {
			if (!hasImplicitProviderSelectionSignal(provider, config, search, params.agentDir)) continue;
			require_globals.logVerbose(`web_search: no provider configured, auto-detected "${provider.id}" from available credentials`);
			return provider.id;
		}
		return "";
	}
	return "";
}
function resolveRuntimePreferredWebSearchProviderId(params) {
	const runtimeProviderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.runtimeWebSearch?.selectedProvider ?? params.runtimeWebSearch?.providerConfigured);
	if (!runtimeProviderId) return;
	const configuredProviderId = params.search && "provider" in params.search ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.search.provider) : void 0;
	if (configuredProviderId) return (params.providers?.find((entry) => entry.id === configuredProviderId))?.id === runtimeProviderId ? runtimeProviderId : void 0;
	if (params.runtimeWebSearch?.providerSource === "configured") return runtimeProviderId;
	const provider = params.providers?.find((entry) => entry.id === runtimeProviderId);
	return provider && hasImplicitProviderSelectionSignal(provider, params.config, params.search, params.agentDir) ? provider.id : void 0;
}
function resolveExplicitWebSearchProviderId(params) {
	const callerProviderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.providerId);
	if (callerProviderId) return callerProviderId;
	if (params.includeRuntimeSelection && params.runtimeWebSearch?.providerSource === "configured") {
		const runtimeProviderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.runtimeWebSearch.selectedProvider ?? params.runtimeWebSearch.providerConfigured);
		if (runtimeProviderId) return runtimeProviderId;
	}
	const configuredProviderId = params.search && "provider" in params.search ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.search.provider) : void 0;
	if (configuredProviderId) return configuredProviderId;
}
function resolveExplicitWebSearchProviderPluginIds(params) {
	const providerId = resolveExplicitWebSearchProviderId(params);
	if (!providerId) return;
	const ownerPluginId = require_plugin_registry.resolveManifestContractOwnerPluginId({
		config: params.config,
		contract: "webSearchProviders",
		value: providerId
	});
	return ownerPluginId ? [ownerPluginId] : void 0;
}
function resolveWebSearchProviderLoadScope(params) {
	const onlyPluginIds = resolveExplicitWebSearchProviderPluginIds(params);
	return onlyPluginIds ? { onlyPluginIds } : {};
}
function resolveWebSearchRequestContext(options) {
	const config = resolveWebSearchRuntimeConfig({
		config: options?.config,
		preferInputConfig: options?.preferInputConfig
	});
	return {
		config,
		search: resolveSearchConfig(config),
		runtimeWebSearch: options?.runtimeWebSearch ?? require_runtime_web_tools_state.getActiveRuntimeWebToolsMetadata()?.search
	};
}
function loadSortedWebSearchProviders(params) {
	const loadScope = resolveWebSearchProviderLoadScope({
		config: params.config,
		search: params.search,
		runtimeWebSearch: params.runtimeWebSearch,
		providerId: params.providerId,
		includeRuntimeSelection: Boolean(params.preferRuntimeProviders)
	});
	return require_web_search_providers_shared.sortWebSearchProvidersForAutoDetect(params.preferRuntimeProviders ? require_web_search_providers_runtime.resolveRuntimeWebSearchProviders({
		config: params.config,
		...loadScope
	}) : require_web_search_providers_runtime.resolvePluginWebSearchProviders({
		config: params.config,
		...loadScope
	}));
}
function resolveWebSearchCandidates(options) {
	const { config, search, runtimeWebSearch } = resolveWebSearchRequestContext(options);
	if (!resolveWebSearchEnabled({
		search,
		sandboxed: options?.sandboxed
	})) return [];
	const providers = loadSortedWebSearchProviders({
		config,
		search,
		runtimeWebSearch,
		providerId: options?.providerId,
		preferRuntimeProviders: options?.preferRuntimeProviders
	}).filter(Boolean);
	if (providers.length === 0) return [];
	const preferredIds = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([
		options?.providerId,
		resolveRuntimePreferredWebSearchProviderId({
			config,
			search,
			runtimeWebSearch,
			providers,
			agentDir: options?.agentDir
		}),
		resolveWebSearchProviderId({
			config,
			agentDir: options?.agentDir,
			search,
			providers
		})
	].filter((value) => Boolean(value)));
	const explicitProviderId = options?.providerId?.trim();
	if (explicitProviderId && !providers.some((entry) => entry.id === explicitProviderId)) throw new Error(`Unknown web_search provider "${explicitProviderId}".`);
	const explicitSelection = hasExplicitWebSearchSelection({
		search,
		runtimeWebSearch,
		providerId: options?.providerId,
		providers
	});
	if (preferredIds.length === 0 && !explicitSelection) return [];
	const fallbackProviders = explicitSelection ? providers : providers.filter((provider) => hasImplicitProviderSelectionSignal(provider, config, search, options?.agentDir));
	return [...preferredIds.map((id) => providers.find((entry) => entry.id === id)).filter((entry) => Boolean(entry)), ...fallbackProviders.filter((entry) => !preferredIds.includes(entry.id))];
}
/** Reports whether web_search can use the prepared selection or resolve an agent-scoped provider. */
function hasUsableWebSearchProvider(options) {
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(options?.runtimeWebSearch?.selectedProvider)) return true;
	return resolveWebSearchCandidates(options).length > 0;
}
function hasExplicitWebSearchSelection(params) {
	if (params.providerId?.trim()) return true;
	const availableProviderIds = new Set((params.providers ?? []).map((provider) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(provider.id)));
	const configuredProviderId = params.search && "provider" in params.search && typeof params.search.provider === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.search.provider) : "";
	if (configuredProviderId && availableProviderIds.has(configuredProviderId)) return true;
	const runtimeConfiguredId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.runtimeWebSearch?.selectedProvider ?? params.runtimeWebSearch?.providerConfigured);
	if (params.runtimeWebSearch?.providerSource === "configured" && runtimeConfiguredId && availableProviderIds.has(runtimeConfiguredId)) return true;
	return false;
}
/** Executes web_search with fallback when selection was not explicit. */
async function runWebSearch(params) {
	const config = resolveWebSearchRuntimeConfig({
		config: params.config,
		preferInputConfig: params.preferInputConfig
	});
	const search = resolveSearchConfig(config);
	const runtimeWebSearch = params.runtimeWebSearch ?? require_runtime_web_tools_state.getActiveRuntimeWebToolsMetadata()?.search;
	const candidates = resolveWebSearchCandidates({
		...params,
		config,
		runtimeWebSearch,
		preferRuntimeProviders: params.preferRuntimeProviders ?? true
	});
	if (candidates.length === 0) throw new Error("web_search is disabled or no provider is available.");
	const allowFallback = !hasExplicitWebSearchSelection({
		search,
		runtimeWebSearch,
		providerId: params.providerId,
		providers: candidates
	});
	return await executeWebSearchCandidates({
		candidates,
		config,
		searchConfig: search,
		runtimeMetadata: runtimeWebSearch,
		agentDir: params.agentDir,
		args: params.args,
		signal: params.signal,
		allowFallback
	});
}
//#endregion
Object.defineProperty(exports, "listConfiguredWebSearchProviders", {
	enumerable: true,
	get: function() {
		return listConfiguredWebSearchProviders;
	}
});
Object.defineProperty(exports, "resolveWebSearchProviderId", {
	enumerable: true,
	get: function() {
		return resolveWebSearchProviderId;
	}
});
Object.defineProperty(exports, "runWebSearch", {
	enumerable: true,
	get: function() {
		return runWebSearch;
	}
});
Object.defineProperty(exports, "runtime_exports", {
	enumerable: true,
	get: function() {
		return runtime_exports;
	}
});
