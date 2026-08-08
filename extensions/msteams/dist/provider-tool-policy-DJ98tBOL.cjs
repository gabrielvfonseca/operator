let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/provider-tool-policy.ts
function normalizeToolProviderPolicyKey(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
	const slashIndex = normalized.indexOf("/");
	if (slashIndex <= 0) return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(normalized);
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(normalized.slice(0, slashIndex));
	const modelId = normalized.slice(slashIndex + 1);
	return modelId ? `${provider}/${modelId}` : provider;
}
function isCanonicalToolProviderPolicyKey(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value) === normalizeToolProviderPolicyKey(value);
}
function resolveProviderToolPolicyEntry(params) {
	const provider = params.modelProvider?.trim();
	if (!provider || !params.byProvider) return;
	const lookup = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(params.byProvider)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) continue;
		const normalized = normalizeToolProviderPolicyKey(key);
		if (!normalized) continue;
		const canonical = isCanonicalToolProviderPolicyKey(key);
		const existing = lookup.get(normalized);
		if (!existing || canonical && !existing.canonical) lookup.set(normalized, {
			key,
			policy: value,
			canonical
		});
	}
	const normalizedProvider = normalizeToolProviderPolicyKey(provider);
	const rawModelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.modelId);
	const fullModelId = rawModelId ? `${normalizedProvider}/${rawModelId}` : void 0;
	const candidates = [...fullModelId ? [fullModelId] : [], normalizedProvider];
	for (const key of candidates) {
		const match = lookup.get(key);
		if (match) return {
			key: match.key,
			policy: match.policy
		};
	}
}
function resolveProviderToolPolicy(params) {
	return resolveProviderToolPolicyEntry(params)?.policy;
}
//#endregion
Object.defineProperty(exports, "isCanonicalToolProviderPolicyKey", {
	enumerable: true,
	get: function() {
		return isCanonicalToolProviderPolicyKey;
	}
});
Object.defineProperty(exports, "normalizeToolProviderPolicyKey", {
	enumerable: true,
	get: function() {
		return normalizeToolProviderPolicyKey;
	}
});
Object.defineProperty(exports, "resolveProviderToolPolicy", {
	enumerable: true,
	get: function() {
		return resolveProviderToolPolicy;
	}
});
Object.defineProperty(exports, "resolveProviderToolPolicyEntry", {
	enumerable: true,
	get: function() {
		return resolveProviderToolPolicyEntry;
	}
});
