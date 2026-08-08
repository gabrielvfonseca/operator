const require_registry = require("./registry-B6IZcEYI.cjs");
const require_embedding_provider_config = require("./embedding-provider-config-DNHxXwXH.cjs");
const require_capability_provider_runtime = require("./capability-provider-runtime-BgXXVc3C.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/plugins/embedding-provider-runtime-shared.ts
/** Shared runtime helpers for embedding provider lookup across core and plugin capabilities. */
/** Builds lookup ids for embedding providers, including configured API aliases. */
function resolveRuntimeEmbeddingProviderLookupIds(params) {
	const ids = [params.id];
	const configuredProviderId = params.resolveConfiguredProviderId(params.id, params.cfg);
	if (configuredProviderId && !ids.some((candidate) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(candidate) === configuredProviderId)) ids.push(configuredProviderId);
	return ids;
}
/** Resolves one embedding provider adapter from registered providers before plugin capabilities. */
function getRuntimeEmbeddingProviderAdapter(params) {
	for (const candidateId of params.lookupIds) {
		const registered = params.getRegisteredProvider(candidateId);
		if (registered) return registered.adapter;
	}
	for (const candidateId of params.lookupIds) {
		const provider = require_capability_provider_runtime.resolvePluginCapabilityProvider({
			key: params.key,
			providerId: candidateId,
			cfg: params.cfg
		});
		if (provider) return provider;
	}
}
//#endregion
//#region src/plugins/memory-embedding-provider-runtime.ts
function resolveConfiguredMemoryEmbeddingProviderId(providerId, cfg) {
	return require_embedding_provider_config.readConfiguredProviderApiId({
		providerId,
		cfg
	});
}
function resolveMemoryEmbeddingProviderLookupIds(id, cfg) {
	return resolveRuntimeEmbeddingProviderLookupIds({
		id,
		cfg,
		resolveConfiguredProviderId: resolveConfiguredMemoryEmbeddingProviderId
	});
}
/** Resolves one memory embedding provider by id, alias, or configured API owner. */
function getMemoryEmbeddingProvider(id, cfg) {
	return getRuntimeEmbeddingProviderAdapter({
		key: "memoryEmbeddingProviders",
		cfg,
		lookupIds: resolveMemoryEmbeddingProviderLookupIds(id, cfg),
		getRegisteredProvider: require_registry.getRegisteredMemoryEmbeddingProvider
	});
}
//#endregion
Object.defineProperty(exports, "getMemoryEmbeddingProvider", {
	enumerable: true,
	get: function() {
		return getMemoryEmbeddingProvider;
	}
});
Object.defineProperty(exports, "getRuntimeEmbeddingProviderAdapter", {
	enumerable: true,
	get: function() {
		return getRuntimeEmbeddingProviderAdapter;
	}
});
Object.defineProperty(exports, "resolveRuntimeEmbeddingProviderLookupIds", {
	enumerable: true,
	get: function() {
		return resolveRuntimeEmbeddingProviderLookupIds;
	}
});
