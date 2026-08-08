const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-BvFurMxy.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/model-pricing-cache-state.ts
let cachedPricing = /* @__PURE__ */ new Map();
let cachedAt = 0;
const sourceFailures = /* @__PURE__ */ new Map();
function modelPricingCacheKey(provider, model) {
	const providerId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	const modelId = model.trim();
	if (!providerId || !modelId) return "";
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId).startsWith(`${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerId)}/`) ? modelId : `${providerId}/${modelId}`;
}
function replaceGatewayModelPricingCache(nextPricing, nextCachedAt = Date.now()) {
	cachedPricing = nextPricing;
	cachedAt = nextCachedAt;
}
function recordGatewayModelPricingSourceFailure(source, detail, failedAt = Date.now()) {
	sourceFailures.set(source, {
		lastFailureAt: failedAt,
		detail
	});
}
function clearGatewayModelPricingSourceFailure(source) {
	sourceFailures.delete(source);
}
function clearGatewayModelPricingFailures() {
	sourceFailures.clear();
}
function getGatewayModelPricingHealth(params) {
	if (params?.enabled === false) return {
		state: "disabled",
		sources: []
	};
	const sources = Array.from(sourceFailures.entries()).map(([source, failure]) => ({
		source,
		state: "degraded",
		lastFailureAt: failure.lastFailureAt,
		detail: failure.detail
	})).toSorted((left, right) => left.source.localeCompare(right.source));
	const latest = sources.reduce((current, source) => {
		if (!current || (source.lastFailureAt ?? 0) > (current.lastFailureAt ?? 0)) return source;
		return current;
	}, void 0);
	return {
		state: sources.length > 0 ? "degraded" : "ok",
		sources,
		...latest?.lastFailureAt ? { lastFailureAt: latest.lastFailureAt } : {},
		...latest?.detail ? { detail: latest.detail } : {}
	};
}
function getCachedGatewayModelPricing(params) {
	const provider = params.provider?.trim();
	const model = params.model?.trim();
	if (!provider || !model) return;
	const key = modelPricingCacheKey(provider, model);
	const direct = key ? cachedPricing.get(key) : void 0;
	if (direct) return direct;
	const normalized = require_model_selection_normalize.normalizeModelRef(provider, model);
	const normalizedKey = modelPricingCacheKey(normalized.provider, normalized.model);
	if (normalizedKey === key) return;
	return normalizedKey ? cachedPricing.get(normalizedKey) : void 0;
}
function getGatewayModelPricingCacheMeta() {
	return {
		cachedAt,
		ttlMs: 0,
		size: cachedPricing.size
	};
}
function stablePricingValue(value) {
	if (typeof value === "number") return Number.isFinite(value) ? JSON.stringify(value) : JSON.stringify(String(value));
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map((entry) => stablePricingValue(entry)).join(",")}]`;
	const record = value;
	return `{${Object.keys(record).filter((key) => record[key] !== void 0).toSorted().map((key) => `${JSON.stringify(key)}:${stablePricingValue(record[key])}`).join(",")}}`;
}
function getGatewayModelPricingCacheFingerprint() {
	return stablePricingValue(Array.from(cachedPricing.entries()).toSorted(([a], [b]) => a.localeCompare(b)));
}
//#endregion
//#region src/gateway/model-pricing-config.ts
/** Returns whether gateway model pricing/cost metadata should be shown. */
function isGatewayModelPricingEnabled(config) {
	return config.models?.pricing?.enabled !== false;
}
//#endregion
Object.defineProperty(exports, "clearGatewayModelPricingFailures", {
	enumerable: true,
	get: function() {
		return clearGatewayModelPricingFailures;
	}
});
Object.defineProperty(exports, "clearGatewayModelPricingSourceFailure", {
	enumerable: true,
	get: function() {
		return clearGatewayModelPricingSourceFailure;
	}
});
Object.defineProperty(exports, "getCachedGatewayModelPricing", {
	enumerable: true,
	get: function() {
		return getCachedGatewayModelPricing;
	}
});
Object.defineProperty(exports, "getGatewayModelPricingCacheFingerprint", {
	enumerable: true,
	get: function() {
		return getGatewayModelPricingCacheFingerprint;
	}
});
Object.defineProperty(exports, "getGatewayModelPricingCacheMeta", {
	enumerable: true,
	get: function() {
		return getGatewayModelPricingCacheMeta;
	}
});
Object.defineProperty(exports, "getGatewayModelPricingHealth", {
	enumerable: true,
	get: function() {
		return getGatewayModelPricingHealth;
	}
});
Object.defineProperty(exports, "isGatewayModelPricingEnabled", {
	enumerable: true,
	get: function() {
		return isGatewayModelPricingEnabled;
	}
});
Object.defineProperty(exports, "recordGatewayModelPricingSourceFailure", {
	enumerable: true,
	get: function() {
		return recordGatewayModelPricingSourceFailure;
	}
});
Object.defineProperty(exports, "replaceGatewayModelPricingCache", {
	enumerable: true,
	get: function() {
		return replaceGatewayModelPricingCache;
	}
});
