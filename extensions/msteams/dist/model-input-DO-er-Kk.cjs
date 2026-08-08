const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_model_catalog_core_provider_model_id_normalize = require("@gabrielvfonseca/model-catalog-core/provider-model-id-normalize");
//#region src/shared/model-key.ts
/** Join provider and model into the canonical provider/model key. */
function modelKey(provider, model) {
	const providerId = provider.trim();
	const modelId = model.trim();
	if (!providerId) return modelId;
	if (!modelId) return providerId;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId).startsWith(`${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerId)}/`) ? modelId : `${providerId}/${modelId}`;
}
//#endregion
//#region src/config/model-input.ts
var model_input_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	normalizeAgentModelMapForConfig: () => normalizeAgentModelMapForConfig,
	normalizeAgentModelRefForConfig: () => normalizeAgentModelRefForConfig,
	resolveAgentModelFallbackValues: () => resolveAgentModelFallbackValues,
	resolveAgentModelPrimaryValue: () => resolveAgentModelPrimaryValue,
	resolveAgentModelTimeoutMsValue: () => resolveAgentModelTimeoutMsValue,
	toAgentModelListLike: () => toAgentModelListLike
});
/** Returns the primary model ref from either string or object-style agent model config. */
function resolveAgentModelPrimaryValue(model) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(model);
}
/** Returns configured fallback model refs, preserving their configured order. */
function resolveAgentModelFallbackValues(model) {
	if (!model || typeof model !== "object") return [];
	return Array.isArray(model.fallbacks) ? model.fallbacks : [];
}
/** Returns a positive finite tool timeout rounded down to whole milliseconds. */
function resolveAgentModelTimeoutMsValue(model) {
	if (!model || typeof model !== "object") return;
	return typeof model.timeoutMs === "number" && Number.isFinite(model.timeoutMs) && model.timeoutMs > 0 ? Math.floor(model.timeoutMs) : void 0;
}
/** Converts legacy string model config into the object shape used by model patch helpers. */
function toAgentModelListLike(model) {
	if (typeof model === "string") {
		const primary = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(model);
		return primary ? { primary } : void 0;
	}
	if (!model || typeof model !== "object") return;
	return model;
}
const GOOGLE_PROVIDER_IDS = /* @__PURE__ */ new Set([
	"google",
	"google-gemini-cli",
	"google-vertex"
]);
/** Canonicalizes provider/model refs before they are persisted to config. */
function normalizeAgentModelRefForConfig(model) {
	const trimmed = model.trim();
	const parsed = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(trimmed);
	if (!parsed) return trimmed;
	const { provider, modelId: modelSuffix } = parsed;
	return modelKey(provider, GOOGLE_PROVIDER_IDS.has(provider) || modelSuffix.startsWith("google/") ? (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalize.normalizeGooglePreviewModelId)(modelSuffix) : provider === "together" ? (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalize.normalizeTogetherModelId)(modelSuffix) : modelSuffix);
}
function mergeAgentModelEntryForConfig(existing, incoming) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(incoming)) return incoming;
	const existingParams = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing.params) ? existing.params : void 0;
	const incomingParams = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(incoming.params) ? incoming.params : void 0;
	return {
		...existing,
		...incoming,
		...existingParams || incomingParams ? { params: {
			...existingParams,
			...incomingParams
		} } : void 0
	};
}
/** Normalizes model map keys and merges entries that collapse to the same canonical ref. */
function normalizeAgentModelMapForConfig(models) {
	let mutated = false;
	const next = {};
	for (const [key, entry] of Object.entries(models)) {
		const normalizedKey = normalizeAgentModelRefForConfig(key);
		if (normalizedKey !== key || Object.hasOwn(next, normalizedKey)) mutated = true;
		next[normalizedKey] = mergeAgentModelEntryForConfig(next[normalizedKey], entry);
	}
	return mutated ? next : models;
}
//#endregion
Object.defineProperty(exports, "modelKey", {
	enumerable: true,
	get: function() {
		return modelKey;
	}
});
Object.defineProperty(exports, "model_input_exports", {
	enumerable: true,
	get: function() {
		return model_input_exports;
	}
});
Object.defineProperty(exports, "normalizeAgentModelMapForConfig", {
	enumerable: true,
	get: function() {
		return normalizeAgentModelMapForConfig;
	}
});
Object.defineProperty(exports, "normalizeAgentModelRefForConfig", {
	enumerable: true,
	get: function() {
		return normalizeAgentModelRefForConfig;
	}
});
Object.defineProperty(exports, "resolveAgentModelFallbackValues", {
	enumerable: true,
	get: function() {
		return resolveAgentModelFallbackValues;
	}
});
Object.defineProperty(exports, "resolveAgentModelPrimaryValue", {
	enumerable: true,
	get: function() {
		return resolveAgentModelPrimaryValue;
	}
});
Object.defineProperty(exports, "resolveAgentModelTimeoutMsValue", {
	enumerable: true,
	get: function() {
		return resolveAgentModelTimeoutMsValue;
	}
});
Object.defineProperty(exports, "toAgentModelListLike", {
	enumerable: true,
	get: function() {
		return toAgentModelListLike;
	}
});
