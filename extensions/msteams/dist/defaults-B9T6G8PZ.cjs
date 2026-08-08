const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_provider_supports = require("./provider-supports-R_TuI02P.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_provider_id = require("./provider-id-DSr5QyVH.cjs");
require("./defaults.constants-BV5EBB5p.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/media-understanding/manifest-metadata.ts
/** Builds a media provider registry from trusted manifest metadata without loading plugin code. */
function buildMediaUnderstandingManifestMetadataRegistry(cfg, workspaceDir) {
	const registry = /* @__PURE__ */ new Map();
	const snapshot = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: cfg,
		env: process.env,
		...workspaceDir ? { workspaceDir } : {}
	});
	for (const plugin of snapshot.plugins) {
		const declaredProviders = new Set((plugin.contracts?.mediaUnderstandingProviders ?? []).map((providerId) => require_provider_id.normalizeMediaProviderId(providerId)));
		for (const [providerId, metadata] of Object.entries(plugin.mediaUnderstandingProviderMetadata ?? {})) {
			const normalizedProviderId = require_provider_id.normalizeMediaProviderId(providerId);
			if (!normalizedProviderId || !declaredProviders.has(normalizedProviderId)) continue;
			registry.set(normalizedProviderId, {
				id: normalizedProviderId,
				capabilities: metadata.capabilities,
				defaultModels: metadata.defaultModels,
				autoPriority: metadata.autoPriority,
				nativeDocumentInputs: metadata.nativeDocumentInputs,
				documentModels: metadata.documentModels
			});
		}
	}
	return registry;
}
//#endregion
//#region src/media-understanding/defaults.ts
var defaults_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	CLI_OUTPUT_MAX_BUFFER: () => require_defaults_constants.CLI_OUTPUT_MAX_BUFFER,
	DEFAULT_MAX_CHARS: () => 500,
	DEFAULT_MEDIA_CONCURRENCY: () => 2,
	DEFAULT_VIDEO_MAX_BASE64_BYTES: () => require_defaults_constants.DEFAULT_VIDEO_MAX_BASE64_BYTES,
	MIN_AUDIO_FILE_BYTES: () => require_defaults_constants.MIN_AUDIO_FILE_BYTES,
	providerSupportsNativePdfDocument: () => providerSupportsNativePdfDocument,
	resolveAutoMediaKeyProviders: () => resolveAutoMediaKeyProviders,
	resolveDefaultMediaModel: () => resolveDefaultMediaModel,
	resolveDocumentMediaModel: () => resolveDocumentMediaModel
});
let defaultRegistryCache = null;
const configRegistryCache = /* @__PURE__ */ new Map();
const MAX_CONFIG_REGISTRY_CACHE_ENTRIES = 32;
function cacheConfigRegistry(key, registry) {
	if (!configRegistryCache.has(key) && configRegistryCache.size >= MAX_CONFIG_REGISTRY_CACHE_ENTRIES) {
		const oldestKey = configRegistryCache.keys().next().value;
		if (oldestKey) configRegistryCache.delete(oldestKey);
	}
	configRegistryCache.set(key, registry);
	return registry;
}
function resolveDefaultRegistry(cfg, workspaceDir) {
	if (!cfg) {
		defaultRegistryCache ??= buildMediaUnderstandingManifestMetadataRegistry();
		return defaultRegistryCache;
	}
	const cacheKey = `${require_runtime_snapshot.resolveRuntimeConfigCacheKey(cfg)}:${workspaceDir ?? ""}`;
	const cached = configRegistryCache.get(cacheKey);
	if (cached) return cached;
	return cacheConfigRegistry(cacheKey, buildMediaUnderstandingManifestMetadataRegistry(cfg, workspaceDir));
}
function providerHasDeclaredCapability(provider, capability) {
	return provider?.capabilities?.includes(capability) ?? require_provider_supports.providerSupportsCapability(provider, capability);
}
function resolveConfiguredImageProviderModel(params) {
	const normalizedProviderId = require_provider_id.normalizeMediaProviderId(params.providerId);
	const providers = params.cfg?.models?.providers;
	if (!providers || typeof providers !== "object") return;
	for (const [providerKey, providerCfg] of Object.entries(providers)) {
		if (require_provider_id.normalizeMediaProviderId(providerKey) !== normalizedProviderId) continue;
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((providerCfg?.models ?? []).find((model) => Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(model?.id)) && Array.isArray(model?.input) && model.input.includes("image"))?.id);
	}
}
function resolveConfiguredImageProviderIds(cfg) {
	const providers = cfg?.models?.providers;
	if (!providers || typeof providers !== "object") return [];
	const configured = [];
	for (const [providerKey, providerCfg] of Object.entries(providers)) {
		const normalizedProviderId = require_provider_id.normalizeMediaExecutionProviderId(providerKey);
		if (!normalizedProviderId || configured.includes(normalizedProviderId)) continue;
		if ((providerCfg?.models ?? []).some((model) => Array.isArray(model?.input) && model.input.includes("image"))) configured.push(normalizedProviderId);
	}
	return configured;
}
function isExecutionAliasProvider(providerId) {
	return require_provider_id.normalizeMediaProviderId(providerId) !== providerId;
}
function insertConfiguredImageProviders(params) {
	const merged = [...params.prioritized];
	for (const providerId of params.configured.filter(isExecutionAliasProvider)) {
		const canonicalProviderId = require_provider_id.normalizeMediaProviderId(providerId);
		const canonicalIndex = merged.indexOf(canonicalProviderId);
		if (canonicalIndex >= 0) merged.splice(canonicalIndex, 0, providerId);
		else merged.unshift(providerId);
	}
	for (const providerId of params.configured.filter((id) => !isExecutionAliasProvider(id))) merged.push(providerId);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(merged);
}
/** Resolves the default provider model for a media capability from config or manifest metadata. */
function resolveDefaultMediaModel(params) {
	if (!params.providerRegistry && params.includeConfiguredImageModels !== false) {
		const configuredImageModel = params.capability === "image" ? resolveConfiguredImageProviderModel({
			cfg: params.cfg,
			providerId: params.providerId
		}) : void 0;
		if (configuredImageModel) return configuredImageModel;
	}
	const manifestDefaultModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((params.providerRegistry ?? resolveDefaultRegistry(params.cfg, params.workspaceDir)).get(require_provider_id.normalizeMediaProviderId(params.providerId))?.defaultModels?.[params.capability]);
	if (manifestDefaultModel) return manifestDefaultModel;
}
/** Resolves auto-discovery provider order for a media capability using manifest priorities. */
function resolveAutoMediaKeyProviders(params) {
	const prioritized = [...(params.providerRegistry ?? resolveDefaultRegistry(params.cfg, params.workspaceDir)).values()].filter((provider) => providerHasDeclaredCapability(provider, params.capability)).map((provider) => {
		const priority = provider.autoPriority?.[params.capability];
		return typeof priority === "number" && Number.isFinite(priority) ? {
			provider,
			priority
		} : null;
	}).filter((entry) => entry !== null).toSorted((left, right) => {
		if (left.priority !== right.priority) return left.priority - right.priority;
		return left.provider.id.localeCompare(right.provider.id);
	}).map((entry) => require_provider_id.normalizeMediaProviderId(entry.provider.id)).filter(Boolean);
	if (params.providerRegistry || params.capability !== "image") return prioritized;
	return insertConfiguredImageProviders({
		prioritized,
		configured: resolveConfiguredImageProviderIds(params.cfg)
	});
}
/** Returns whether provider metadata declares native PDF document input support. */
function providerSupportsNativePdfDocument(params) {
	return (params.providerRegistry ?? resolveDefaultRegistry(params.cfg, params.workspaceDir)).get(require_provider_id.normalizeMediaProviderId(params.providerId))?.nativeDocumentInputs?.includes("pdf") ?? false;
}
/** Resolves provider-specific document model hints, preserving explicit unsupported markers. */
function resolveDocumentMediaModel(params) {
	const value = (params.providerRegistry ?? resolveDefaultRegistry(params.cfg, params.workspaceDir)).get(require_provider_id.normalizeMediaProviderId(params.providerId))?.documentModels?.[params.document]?.[params.mode];
	if (value === false) return false;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
}
//#endregion
Object.defineProperty(exports, "defaults_exports", {
	enumerable: true,
	get: function() {
		return defaults_exports;
	}
});
Object.defineProperty(exports, "providerSupportsNativePdfDocument", {
	enumerable: true,
	get: function() {
		return providerSupportsNativePdfDocument;
	}
});
Object.defineProperty(exports, "resolveAutoMediaKeyProviders", {
	enumerable: true,
	get: function() {
		return resolveAutoMediaKeyProviders;
	}
});
Object.defineProperty(exports, "resolveDefaultMediaModel", {
	enumerable: true,
	get: function() {
		return resolveDefaultMediaModel;
	}
});
Object.defineProperty(exports, "resolveDocumentMediaModel", {
	enumerable: true,
	get: function() {
		return resolveDocumentMediaModel;
	}
});
