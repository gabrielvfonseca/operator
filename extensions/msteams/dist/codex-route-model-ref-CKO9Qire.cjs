require("./session-key-BQFkCTNx.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/doctor/shared/codex-route-model-ref.ts
function normalizeRuntimeString(value) {
	return require_openai_routing.normalizeOptionalAgentRuntimeId(value);
}
function asAgentRuntimePolicyConfig(value) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(value);
	return record ? { id: typeof record.id === "string" ? record.id : void 0 } : void 0;
}
function readLegacyDefaultsRuntime(defaults) {
	return asAgentRuntimePolicyConfig((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(defaults)?.agentRuntime);
}
const LEGACY_CODEX_PROVIDER_IDS = /* @__PURE__ */ new Set(["codex", "openai-codex"]);
function legacyCodexProviderIdentityKey(providerId) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId);
	return normalized && LEGACY_CODEX_PROVIDER_IDS.has(normalized) ? `${normalized}\u0000` : void 0;
}
function legacyCodexModelIdentityKey(params) {
	const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.providerId);
	if (!providerId || !LEGACY_CODEX_PROVIDER_IDS.has(providerId) || typeof params.modelId !== "string") return;
	const modelId = require_model_ref_profile.splitTrailingAuthProfile(params.modelId).model.trim();
	if (!modelId) return;
	const slash = modelId.indexOf("/");
	const unscopedModelId = slash > 0 && LEGACY_CODEX_PROVIDER_IDS.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(modelId.slice(0, slash)) ?? "") ? modelId.slice(slash + 1).trim() : modelId;
	return unscopedModelId ? `${providerId}\u0000${unscopedModelId}` : void 0;
}
function legacyCodexModelRefIdentityKey(modelRef) {
	if (typeof modelRef !== "string") return;
	const model = require_model_ref_profile.splitTrailingAuthProfile(modelRef).model.trim();
	const slash = model.indexOf("/");
	if (slash <= 0) return;
	return legacyCodexModelIdentityKey({
		providerId: model.slice(0, slash),
		modelId: model.slice(slash + 1)
	});
}
function isBlockedLegacyCodexModelRef(params) {
	const identity = legacyCodexModelRefIdentityKey(params.modelRef);
	if (!identity || !params.blockedModelIdentities) return false;
	const separator = identity.indexOf("\0");
	const providerIdentity = separator >= 0 ? identity.slice(0, separator + 1) : void 0;
	return params.blockedModelIdentities.has(identity) || Boolean(providerIdentity && params.blockedModelIdentities.has(providerIdentity));
}
function isBlockedLegacyCodexModelPair(params) {
	if (!params.blockedModelIdentities) return false;
	const providerIdentity = legacyCodexProviderIdentityKey(params.providerId);
	const modelIdentity = legacyCodexModelIdentityKey(params);
	return Boolean(providerIdentity && params.blockedModelIdentities.has(providerIdentity)) || Boolean(modelIdentity && params.blockedModelIdentities.has(modelIdentity));
}
function isLegacyCodexProviderId(provider) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider);
	return normalized ? LEGACY_CODEX_PROVIDER_IDS.has(normalized) : false;
}
function readLegacyCodexModelId(model) {
	if (typeof model !== "string") return;
	const trimmed = model.trim();
	const slash = trimmed.indexOf("/");
	if (slash <= 0 || !LEGACY_CODEX_PROVIDER_IDS.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(trimmed.slice(0, slash)) ?? "")) return;
	return trimmed.slice(slash + 1).trim() || void 0;
}
function isOpenAICodexModelRef(model) {
	return readLegacyCodexModelId(model) !== void 0;
}
function isOpenAICodexAuthProfileRef(profile) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(profile);
	const separator = normalized?.indexOf(":") ?? -1;
	return separator > 0 && LEGACY_CODEX_PROVIDER_IDS.has(normalized?.slice(0, separator) ?? "");
}
function isProviderlessModelRef(model) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(model);
	return Boolean(normalized && !normalized.includes("/"));
}
function toCanonicalOpenAIModelRef(model) {
	const modelId = readLegacyCodexModelId(model);
	return modelId ? `openai/${modelId}` : void 0;
}
function toOpenAIModelId(model) {
	return readLegacyCodexModelId(model);
}
function resolveRuntime(params) {
	return normalizeRuntimeString(params.agentRuntime?.id) ?? normalizeRuntimeString(params.defaultsRuntime?.id);
}
function readModelConfigPrimaryRef(value) {
	if (typeof value === "string") return value.trim() || void 0;
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(value);
	if (typeof record?.primary === "string") return record.primary.trim() || void 0;
}
function readAgentPrimaryModelRef(agent, fallback) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(agent);
	if (!record) return fallback;
	return readModelConfigPrimaryRef(record.model) ?? fallback;
}
function modelRefUsesCodexRuntime(params) {
	const effectiveModelRef = params.modelRef?.trim() || `openrouter/openrouter/auto`;
	if (isOpenAICodexModelRef(effectiveModelRef)) return true;
	return canonicalOpenAIModelUsesCodexRuntime({
		cfg: params.cfg,
		modelRef: resolveRuntimeModelRef({
			cfg: params.cfg,
			modelRef: effectiveModelRef,
			agentId: params.agentId
		}),
		agentId: params.agentId,
		env: params.env
	});
}
function resolveRuntimeModelRef(params) {
	const effectiveModelRef = normalizeProviderModelRefAuthProfile(params.modelRef) ?? `openrouter/openrouter/auto`;
	const legacyCodexModel = toCanonicalOpenAIModelRef(effectiveModelRef);
	if (legacyCodexModel) return legacyCodexModel;
	return resolveKnownCompatModelAliasRef(effectiveModelRef) ?? resolveConfiguredModelAliasRef({
		cfg: params.cfg,
		modelRef: effectiveModelRef,
		agentId: params.agentId
	}) ?? resolveConfiguredBareModelRef({
		cfg: params.cfg,
		modelRef: effectiveModelRef,
		agentId: params.agentId
	}) ?? normalizeDefaultProviderModelRef(effectiveModelRef, resolveDefaultProviderForAliasContext({
		cfg: params.cfg,
		agentId: params.agentId
	}));
}
function normalizeProviderModelRefAuthProfile(modelRef) {
	const trimmed = modelRef.trim();
	if (!trimmed) return;
	return require_model_ref_profile.splitTrailingAuthProfile(trimmed).model || trimmed;
}
function resolveKnownCompatModelAliasRef(modelRef) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(modelRef);
	if (!normalized?.startsWith("openrouter:")) return;
	const modelId = normalized.slice(11).trim();
	return modelId ? `openrouter/openrouter/${modelId}` : void 0;
}
function resolveConfiguredModelAliasRef(params) {
	const aliasKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.modelRef);
	if (!aliasKey) return;
	const defaultProvider = resolveDefaultProviderForAliasContext({
		cfg: params.cfg,
		agentId: params.agentId
	});
	return resolveAliasFromModelsMap((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(params.cfg.agents?.defaults?.models), aliasKey, defaultProvider);
}
function resolveDefaultProviderForAliasContext(params) {
	const primaryModelRef = readModelConfigPrimaryRef(findAgentById(params.cfg, params.agentId)?.model) ?? readModelConfigPrimaryRef(params.cfg.agents?.defaults?.model);
	if (primaryModelRef) {
		const effectivePrimaryModelRef = normalizeProviderModelRefAuthProfile(primaryModelRef) ?? primaryModelRef;
		const legacyCodexModel = toCanonicalOpenAIModelRef(effectivePrimaryModelRef);
		const compatModelRef = resolveKnownCompatModelAliasRef(effectivePrimaryModelRef);
		return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)((parseModelRef(resolveAliasFromModelsMap((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(params.cfg.agents?.defaults?.models), (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(effectivePrimaryModelRef) ?? "", "openrouter") ?? compatModelRef ?? legacyCodexModel ?? effectivePrimaryModelRef) ?? parseModelRef(resolveConfiguredBareModelRef({
			cfg: params.cfg,
			modelRef: effectivePrimaryModelRef,
			agentId: params.agentId
		}) ?? ""))?.provider ?? "openrouter") || "openrouter";
	}
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(parseModelRef(resolveImplicitDefaultAgentModelRef(params.cfg))?.provider ?? "openrouter") || "openrouter";
}
function findAgentById(cfg, agentId) {
	if (!agentId) return;
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	return (Array.isArray(cfg.agents?.list) ? cfg.agents.list : []).map((agent) => (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(agent)).find((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(typeof agent?.id === "string" ? agent.id : void 0) === normalizedAgentId);
}
function resolveAliasFromModelsMap(models, aliasKey, defaultProvider) {
	for (const [modelRef, entry] of Object.entries(models ?? {})) {
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(entry)?.alias) !== aliasKey) continue;
		const compatRef = resolveKnownCompatModelAliasRef(modelRef);
		if (compatRef) return compatRef;
		return modelRef.includes("/") ? normalizeDefaultProviderModelRef(modelRef) : `${defaultProvider}/${modelRef}`;
	}
}
function resolveConfiguredBareModelRef(params) {
	const modelId = params.modelRef.trim();
	if (!modelId || modelId.includes("/")) return;
	const matches = /* @__PURE__ */ new Set();
	const pushModelMapMatches = (models) => {
		for (const key of Object.keys(models ?? {})) {
			const parsed = parseModelRef(key);
			if (parsed?.modelId === modelId) matches.add(`${parsed.provider}/${parsed.modelId}`);
		}
	};
	pushModelMapMatches((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(params.cfg.agents?.defaults?.models));
	for (const [provider, providerConfig] of Object.entries(params.cfg.models?.providers ?? {})) for (const model of providerConfig?.models ?? []) if (providerCatalogModelMatches(provider, model?.id, modelId)) matches.add(`${(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider)}/${modelId}`);
	return matches.size === 1 ? [...matches][0] : void 0;
}
function providerCatalogModelMatches(provider, catalogModelId, modelId) {
	const rawId = catalogModelId?.trim();
	if (!rawId) return false;
	const normalizedId = require_model_selection_normalize.normalizeConfiguredProviderCatalogModelId(provider, rawId);
	if (normalizedId === modelId) return true;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(normalizedId) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(modelId);
}
function normalizeDefaultProviderModelRef(modelRef, defaultProvider = require_defaults.DEFAULT_PROVIDER) {
	return modelRef.includes("/") ? modelRef : `${defaultProvider}/${modelRef}`;
}
function normalizeProviderModelRef(provider, modelId) {
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	const normalizedModelId = require_model_selection_normalize.normalizeConfiguredProviderCatalogModelId(normalizedProvider, modelId);
	const slash = normalizedModelId.indexOf("/");
	if (slash > 0 && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(normalizedModelId.slice(0, slash)) === normalizedProvider && slash < normalizedModelId.length - 1) return `${normalizedProvider}/${normalizedModelId.slice(slash + 1)}`;
	return `${normalizedProvider}/${normalizedModelId}`;
}
function resolveImplicitDefaultAgentModelRef(cfg) {
	const fallbackProvider = require_model_selection_shared.resolveConfiguredProviderFallback({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER
	});
	return fallbackProvider ? normalizeProviderModelRef(fallbackProvider.provider, fallbackProvider.model) : `${require_defaults.DEFAULT_PROVIDER}/${require_defaults.DEFAULT_MODEL}`;
}
function agentUsesCodexRuntimeForCompaction(params) {
	const runtime = concreteRuntimeId((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.currentRuntime));
	if (runtime) return runtime === "codex";
	return modelRefUsesCodexRuntime({
		cfg: params.cfg,
		modelRef: readAgentPrimaryModelRef(params.agent, params.inheritedModelRef),
		agentId: params.agentId,
		env: params.env
	});
}
function concreteRuntimeId(runtime) {
	return runtime && runtime !== "auto" && runtime !== "default" ? runtime : void 0;
}
function parseModelRef(modelRef) {
	const slash = modelRef.indexOf("/");
	if (slash <= 0 || slash >= modelRef.length - 1) return;
	return {
		provider: modelRef.slice(0, slash),
		modelId: modelRef.slice(slash + 1)
	};
}
function canonicalOpenAIModelUsesCodexRuntime(params) {
	const parsed = parseModelRef(params.modelRef);
	if (!parsed) return false;
	return require_codex_plugin_diagnostics.configuredModelRouteNeedsCodex({
		cfg: params.cfg,
		env: params.env ?? process.env,
		...params.agentId ? { agentId: params.agentId } : {},
		route: {
			provider: parsed.provider,
			modelId: parsed.modelId
		}
	});
}
//#endregion
Object.defineProperty(exports, "agentUsesCodexRuntimeForCompaction", {
	enumerable: true,
	get: function() {
		return agentUsesCodexRuntimeForCompaction;
	}
});
Object.defineProperty(exports, "asAgentRuntimePolicyConfig", {
	enumerable: true,
	get: function() {
		return asAgentRuntimePolicyConfig;
	}
});
Object.defineProperty(exports, "canonicalOpenAIModelUsesCodexRuntime", {
	enumerable: true,
	get: function() {
		return canonicalOpenAIModelUsesCodexRuntime;
	}
});
Object.defineProperty(exports, "isBlockedLegacyCodexModelPair", {
	enumerable: true,
	get: function() {
		return isBlockedLegacyCodexModelPair;
	}
});
Object.defineProperty(exports, "isBlockedLegacyCodexModelRef", {
	enumerable: true,
	get: function() {
		return isBlockedLegacyCodexModelRef;
	}
});
Object.defineProperty(exports, "isLegacyCodexProviderId", {
	enumerable: true,
	get: function() {
		return isLegacyCodexProviderId;
	}
});
Object.defineProperty(exports, "isOpenAICodexAuthProfileRef", {
	enumerable: true,
	get: function() {
		return isOpenAICodexAuthProfileRef;
	}
});
Object.defineProperty(exports, "isOpenAICodexModelRef", {
	enumerable: true,
	get: function() {
		return isOpenAICodexModelRef;
	}
});
Object.defineProperty(exports, "isProviderlessModelRef", {
	enumerable: true,
	get: function() {
		return isProviderlessModelRef;
	}
});
Object.defineProperty(exports, "legacyCodexProviderIdentityKey", {
	enumerable: true,
	get: function() {
		return legacyCodexProviderIdentityKey;
	}
});
Object.defineProperty(exports, "modelRefUsesCodexRuntime", {
	enumerable: true,
	get: function() {
		return modelRefUsesCodexRuntime;
	}
});
Object.defineProperty(exports, "normalizeDefaultProviderModelRef", {
	enumerable: true,
	get: function() {
		return normalizeDefaultProviderModelRef;
	}
});
Object.defineProperty(exports, "normalizeRuntimeString", {
	enumerable: true,
	get: function() {
		return normalizeRuntimeString;
	}
});
Object.defineProperty(exports, "parseModelRef", {
	enumerable: true,
	get: function() {
		return parseModelRef;
	}
});
Object.defineProperty(exports, "readAgentPrimaryModelRef", {
	enumerable: true,
	get: function() {
		return readAgentPrimaryModelRef;
	}
});
Object.defineProperty(exports, "readLegacyDefaultsRuntime", {
	enumerable: true,
	get: function() {
		return readLegacyDefaultsRuntime;
	}
});
Object.defineProperty(exports, "readModelConfigPrimaryRef", {
	enumerable: true,
	get: function() {
		return readModelConfigPrimaryRef;
	}
});
Object.defineProperty(exports, "resolveImplicitDefaultAgentModelRef", {
	enumerable: true,
	get: function() {
		return resolveImplicitDefaultAgentModelRef;
	}
});
Object.defineProperty(exports, "resolveRuntime", {
	enumerable: true,
	get: function() {
		return resolveRuntime;
	}
});
Object.defineProperty(exports, "resolveRuntimeModelRef", {
	enumerable: true,
	get: function() {
		return resolveRuntimeModelRef;
	}
});
Object.defineProperty(exports, "toCanonicalOpenAIModelRef", {
	enumerable: true,
	get: function() {
		return toCanonicalOpenAIModelRef;
	}
});
Object.defineProperty(exports, "toOpenAIModelId", {
	enumerable: true,
	get: function() {
		return toOpenAIModelId;
	}
});
