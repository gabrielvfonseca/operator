require("./rolldown-runtime-u92d-OFm.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_runtime_web_tools_state = require("./runtime-web-tools-state-DbJISCDm.cjs");
const require_web_search_providers_shared = require("./web-search-providers.shared-C1hrTfhU.cjs");
const require_web_fetch_providers_runtime = require("./web-fetch-providers.runtime-4TTBYQmi.cjs");
const require_provider_runtime_shared = require("./provider-runtime-shared-BwM9S6Pg.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/web-fetch/runtime.ts
/** Runtime provider selection and tool construction for the `web_fetch` tool. */
let webFetchProviderCache = /* @__PURE__ */ new WeakMap();
/** Resolves whether web_fetch is enabled for the current config/sandbox. */
function resolveWebFetchEnabled(params) {
	if (typeof params.fetch?.enabled === "boolean") return params.fetch.enabled;
	return true;
}
function resolveFetchConfig(config) {
	return require_provider_runtime_shared.resolveWebProviderConfig(config, "fetch");
}
function hasEntryCredential(provider, config, fetch) {
	return require_provider_runtime_shared.hasWebProviderEntryCredential({
		provider,
		config,
		toolConfig: fetch,
		resolveRawValue: ({ provider: currentProvider, config: currentConfig, toolConfig }) => currentProvider.getConfiguredCredentialValue?.(currentConfig) ?? currentProvider.getCredentialValue(toolConfig),
		resolveFallbackRawValue: ({ provider: currentProvider, config: currentConfig }) => currentProvider.getConfiguredCredentialFallback?.(currentConfig)?.value,
		resolveEnvValue: ({ provider: currentProvider }) => require_provider_runtime_shared.readWebProviderEnvValue(currentProvider.envVars)
	});
}
function hasAutoDetectCredential(provider, config, fetch) {
	return hasEntryCredential({
		...provider,
		requiresCredential: true
	}, config, fetch);
}
/** Reports whether a web_fetch provider has usable credentials. */
function isWebFetchProviderConfigured(params) {
	return hasEntryCredential(params.provider, params.config, resolveFetchConfig(params.config));
}
/** Lists web_fetch providers available to runtime selection. */
function listWebFetchProviders(params) {
	return require_web_fetch_providers_runtime.resolvePluginWebFetchProviders({ config: params?.config });
}
/** Resolves the configured or auto-detected web_fetch provider id. */
function resolveWebFetchProviderId(params) {
	const providers = require_web_search_providers_shared.sortWebFetchProvidersForAutoDetect(params.providers ?? require_web_fetch_providers_runtime.resolvePluginWebFetchProviders({ config: params.config }));
	const raw = params.fetch && "provider" in params.fetch ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.fetch.provider) : "";
	if (raw) {
		const explicit = providers.find((provider) => provider.id === raw);
		if (explicit) return explicit.id;
	}
	for (const provider of providers) {
		if (!require_provider_runtime_shared.providerRequiresCredential(provider)) {
			if (!hasAutoDetectCredential(provider, params.config, params.fetch)) continue;
			require_globals.logVerbose(`web_fetch: ${raw ? `invalid configured provider "${raw}", ` : ""}auto-detected keyless provider "${provider.id}"`);
			return provider.id;
		}
		if (!hasEntryCredential(provider, params.config, params.fetch)) continue;
		require_globals.logVerbose(`web_fetch: ${raw ? `invalid configured provider "${raw}", ` : ""}auto-detected "${provider.id}" from available API keys`);
		return provider.id;
	}
	return "";
}
function resolveConfiguredWebFetchProviderId(params) {
	const raw = params.fetch && "provider" in params.fetch ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.fetch.provider) : "";
	if (!raw) return;
	return params.providers.find((provider) => provider.id === raw)?.id;
}
function resolveWebFetchProviderCacheKey(options) {
	return JSON.stringify([
		require_runtime.getActivePluginRegistryVersion(),
		options?.sandboxed === true,
		options?.preferRuntimeProviders === true
	]);
}
function createWebFetchProviderConfigFingerprint(config) {
	return (0, node_crypto.createHash)("sha256").update(JSON.stringify(config)).digest("hex");
}
function resolveCachedWebFetchProviders(params) {
	const cached = webFetchProviderCache.get(params.config);
	if (cached?.cacheKey === params.cacheKey && cached.configFingerprint === params.configFingerprint) return cached.providers;
	const loaded = params.load();
	if (loaded.length > 0) webFetchProviderCache.set(params.config, {
		cacheKey: params.cacheKey,
		configFingerprint: params.configFingerprint,
		providers: loaded
	});
	return loaded;
}
function clearWebFetchRuntimeCachesForTest() {
	webFetchProviderCache = /* @__PURE__ */ new WeakMap();
}
/** Resolves the executable web_fetch provider tool definition. */
function resolveWebFetchDefinition(options) {
	return resolveWebFetchDefinitionUncached(options);
}
function resolveWebFetchProvidersForOptions(options) {
	const load = () => require_web_search_providers_shared.sortWebFetchProvidersForAutoDetect(options?.sandboxed ? require_web_fetch_providers_runtime.resolvePluginWebFetchProviders({
		config: options?.config,
		sandboxed: true
	}) : options?.preferRuntimeProviders ? require_web_fetch_providers_runtime.resolveRuntimeWebFetchProviders({ config: options?.config }) : require_web_fetch_providers_runtime.resolvePluginWebFetchProviders({ config: options?.config }));
	if (options?.config) return resolveCachedWebFetchProviders({
		config: options.config,
		cacheKey: resolveWebFetchProviderCacheKey(options),
		configFingerprint: createWebFetchProviderConfigFingerprint(options.config),
		load
	});
	return load();
}
function resolveWebFetchDefinitionUncached(options) {
	const fetch = require_provider_runtime_shared.resolveWebProviderConfig(options?.config, "fetch");
	if (!resolveWebFetchEnabled({
		fetch,
		sandboxed: options?.sandboxed
	})) return null;
	const runtimeWebFetch = options?.runtimeWebFetch ?? require_runtime_web_tools_state.getActiveRuntimeWebToolsMetadata()?.fetch;
	const providers = resolveWebFetchProvidersForOptions(options);
	return require_provider_runtime_shared.resolveWebProviderDefinition({
		config: options?.config,
		toolConfig: fetch,
		runtimeMetadata: runtimeWebFetch,
		sandboxed: options?.sandboxed,
		providerId: options?.providerId ?? resolveConfiguredWebFetchProviderId({
			fetch,
			providers
		}),
		providers,
		resolveEnabled: ({ toolConfig, sandboxed }) => resolveWebFetchEnabled({
			fetch: toolConfig,
			sandboxed
		}),
		resolveAutoProviderId: ({ config, toolConfig, providers: providersLocal }) => resolveWebFetchProviderId({
			config,
			fetch: toolConfig,
			providers: providersLocal
		}),
		createTool: ({ provider, config, toolConfig, runtimeMetadata }) => provider.createTool({
			config,
			fetchConfig: toolConfig,
			runtimeMetadata
		})
	});
}
//#endregion
exports.clearWebFetchRuntimeCachesForTest = clearWebFetchRuntimeCachesForTest;
exports.isWebFetchProviderConfigured = isWebFetchProviderConfigured;
exports.listWebFetchProviders = listWebFetchProviders;
exports.resolveWebFetchDefinition = resolveWebFetchDefinition;
