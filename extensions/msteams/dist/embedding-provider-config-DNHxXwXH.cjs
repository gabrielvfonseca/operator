let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/plugins/embedding-provider-config.ts
const OPENAI_COMPATIBLE_EMBEDDING_PROVIDER_ID = "openai-compatible";
const OPENAI_COMPATIBLE_MODEL_APIS = /* @__PURE__ */ new Set(["openai-completions", "openai-responses"]);
function resolveConfiguredProviderConfig(providerId, cfg) {
	const providers = cfg?.models?.providers;
	if (!providers) return;
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	return providers[providerId] ?? Object.entries(providers).find(([candidateId]) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(candidateId) === normalized)?.[1];
}
/** Reads a configured provider's backing API id when runtime lookup should follow an alias. */
function readConfiguredProviderApiId(params) {
	const providerConfig = resolveConfiguredProviderConfig(params.providerId, params.cfg);
	if (!providerConfig) return;
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.providerId);
	const api = providerConfig.api?.trim();
	const resolvedProviderId = api ? params.resolveApiProviderId?.((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(api)) ?? (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(api) : params.resolveMissingApiProviderId?.(providerConfig);
	return resolvedProviderId && resolvedProviderId !== normalized ? resolvedProviderId : void 0;
}
function resolveConfiguredGenericEmbeddingProviderId(providerId, cfg) {
	return readConfiguredProviderApiId({
		providerId,
		cfg,
		resolveApiProviderId: (normalizedApiId) => OPENAI_COMPATIBLE_MODEL_APIS.has(normalizedApiId) ? OPENAI_COMPATIBLE_EMBEDDING_PROVIDER_ID : normalizedApiId,
		resolveMissingApiProviderId: (providerConfig) => providerConfig.baseUrl?.trim() ? OPENAI_COMPATIBLE_EMBEDDING_PROVIDER_ID : void 0
	});
}
//#endregion
Object.defineProperty(exports, "readConfiguredProviderApiId", {
	enumerable: true,
	get: function() {
		return readConfiguredProviderApiId;
	}
});
Object.defineProperty(exports, "resolveConfiguredGenericEmbeddingProviderId", {
	enumerable: true,
	get: function() {
		return resolveConfiguredGenericEmbeddingProviderId;
	}
});
