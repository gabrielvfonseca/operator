const require_worker_provider_registry = require("./worker-provider-registry-CsuKJchR.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
const require_capability_provider_runtime = require("./capability-provider-runtime-BgXXVc3C.cjs");
//#region src/tts/provider-registry-core.ts
/** Normalize user/provider IDs into the canonical speech provider ID shape. */
function normalizeSpeechProviderId(providerId) {
	return require_worker_provider_registry.normalizeCapabilityProviderId(providerId);
}
/** Create a registry facade with canonical listing, alias lookup, and ID canonicalization. */
function createSpeechProviderRegistry(resolver) {
	const buildResolvedProviderMaps = (cfg) => require_worker_provider_registry.buildCapabilityProviderMaps(resolver.listProviders(cfg));
	const listProviders = (cfg) => [...buildResolvedProviderMaps(cfg).canonical.values()];
	const getProvider = (providerId, cfg) => {
		const normalized = normalizeSpeechProviderId(providerId);
		if (!normalized) return;
		return resolver.getProvider(normalized, cfg) ?? buildResolvedProviderMaps(cfg).aliases.get(normalized);
	};
	const canonicalizeProviderId = (providerId, cfg) => {
		const normalized = normalizeSpeechProviderId(providerId);
		if (!normalized) return;
		return getProvider(normalized, cfg)?.id ?? normalized;
	};
	return {
		canonicalizeSpeechProviderId: canonicalizeProviderId,
		getSpeechProvider: getProvider,
		listSpeechProviders: listProviders
	};
}
//#endregion
//#region src/tts/provider-registry.ts
/** Resolve speech providers from configured plugin capabilities. */
function resolveSpeechProviderPluginEntries(cfg) {
	return require_capability_provider_runtime.resolvePluginCapabilityProviders({
		key: "speechProviders",
		cfg
	});
}
function resolveLoadedSpeechProviderPluginEntries() {
	return (require_active_runtime_registry.getActiveRuntimePluginRegistry()?.speechProviders ?? []).map((entry) => entry.provider);
}
/** Config-aware registry used by setup/status/runtime paths before plugins are loaded. */
const defaultSpeechProviderRegistry = createSpeechProviderRegistry({
	getProvider: (providerId, cfg) => require_capability_provider_runtime.resolvePluginCapabilityProvider({
		key: "speechProviders",
		providerId,
		cfg
	}),
	listProviders: resolveSpeechProviderPluginEntries
});
/** Loaded-only registry for runtime paths that must not rediscover plugin manifests. */
const loadedSpeechProviderRegistry = createSpeechProviderRegistry({
	getProvider: (providerId) => resolveLoadedSpeechProviderPluginEntries().find((provider) => {
		if (provider.id === providerId) return true;
		return provider.aliases?.includes(providerId) ?? false;
	}),
	listProviders: () => resolveLoadedSpeechProviderPluginEntries()
});
/** List configured speech providers using manifest/capability discovery. */
const listSpeechProviders = defaultSpeechProviderRegistry.listSpeechProviders;
loadedSpeechProviderRegistry.listSpeechProviders;
/** Resolve a configured speech provider by canonical ID or alias. */
const getSpeechProvider = defaultSpeechProviderRegistry.getSpeechProvider;
/** Resolve an input provider ID or alias to the provider's canonical ID. */
const canonicalizeSpeechProviderId = defaultSpeechProviderRegistry.canonicalizeSpeechProviderId;
//#endregion
Object.defineProperty(exports, "canonicalizeSpeechProviderId", {
	enumerable: true,
	get: function() {
		return canonicalizeSpeechProviderId;
	}
});
Object.defineProperty(exports, "getSpeechProvider", {
	enumerable: true,
	get: function() {
		return getSpeechProvider;
	}
});
Object.defineProperty(exports, "listSpeechProviders", {
	enumerable: true,
	get: function() {
		return listSpeechProviders;
	}
});
