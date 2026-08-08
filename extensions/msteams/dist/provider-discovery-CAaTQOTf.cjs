const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-BvFurMxy.cjs");
//#region src/plugins/provider-discovery.ts
/** Control-plane provider discovery helpers that keep runtime imports lazy until catalog hooks run. */
var provider_discovery_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	groupPluginDiscoveryProvidersByOrder: () => groupPluginDiscoveryProvidersByOrder,
	normalizePluginDiscoveryResult: () => normalizePluginDiscoveryResult,
	providerMatchesFilter: () => providerMatchesFilter,
	resolveRuntimePluginDiscoveryProviders: () => resolveRuntimePluginDiscoveryProviders,
	runProviderCatalog: () => runProviderCatalog,
	runProviderStaticCatalog: () => runProviderStaticCatalog
});
const DISCOVERY_ORDER = [
	"simple",
	"profile",
	"paired",
	"late"
];
const DANGEROUS_PROVIDER_KEYS = /* @__PURE__ */ new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
const providerRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./provider-discovery.runtime-Dnt-tftf.cjs")).then((n) => n.provider_discovery_runtime_exports));
function loadProviderRuntime() {
	return providerRuntimeLoader.load();
}
function resolveProviderCatalogHook(provider) {
	return provider.catalog ?? provider.discovery;
}
function resolveProviderCatalogOrderHook(provider) {
	return resolveProviderCatalogHook(provider) ?? provider.staticCatalog;
}
function createProviderConfigRecord() {
	return Object.create(null);
}
function isSafeProviderConfigKey(value) {
	return value !== "" && !DANGEROUS_PROVIDER_KEYS.has(value);
}
/** Loads provider runtime discovery and filters to providers that can produce catalog order entries. */
async function resolveRuntimePluginDiscoveryProviders(params) {
	return (await loadProviderRuntime()).resolvePluginDiscoveryProvidersRuntime(params).filter((provider) => resolveProviderCatalogOrderHook(provider));
}
/** Groups plugin providers into stable discovery phases for catalog probing. */
function groupPluginDiscoveryProvidersByOrder(providers) {
	const grouped = {
		simple: [],
		profile: [],
		paired: [],
		late: []
	};
	for (const provider of providers) grouped[resolveProviderCatalogOrderHook(provider)?.order ?? "late"].push(provider);
	for (const order of DISCOVERY_ORDER) grouped[order].sort((a, b) => a.label.localeCompare(b.label));
	return grouped;
}
/** Matches a normalized provider filter against all provider-owned identifiers. */
function providerMatchesFilter(params) {
	return [
		params.provider.id,
		...params.provider.aliases ?? [],
		...params.provider.hookAliases ?? []
	].some((providerId) => require_model_selection_normalize.normalizeProviderId(providerId) === params.providerFilter);
}
/** Normalizes a plugin discovery response into safe provider-config keys. */
function normalizePluginDiscoveryResult(params) {
	const result = params.result;
	if (!result) return {};
	const projection = require_registry.copyProviderCatalogResultProjection(result);
	if (projection.kind === "provider") {
		const normalized = createProviderConfigRecord();
		for (const providerId of [
			params.provider.id,
			...params.provider.aliases ?? [],
			...params.provider.hookAliases ?? []
		]) {
			const normalizedKey = require_model_selection_normalize.normalizeProviderId(providerId);
			if (!isSafeProviderConfigKey(normalizedKey)) continue;
			normalized[normalizedKey] = projection.provider;
		}
		return normalized;
	}
	const normalized = createProviderConfigRecord();
	if (projection.kind !== "providers") return normalized;
	for (const [key, value] of projection.providers) {
		const normalizedKey = require_model_selection_normalize.normalizeProviderId(key);
		if (!isSafeProviderConfigKey(normalizedKey) || !value) continue;
		normalized[normalizedKey] = value;
	}
	return normalized;
}
function runProviderCatalog(params) {
	return resolveProviderCatalogHook(params.provider)?.run({
		config: params.config,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		env: params.env,
		resolveProviderApiKey: params.resolveProviderApiKey,
		resolveProviderAuth: params.resolveProviderAuth
	});
}
function runProviderStaticCatalog(params) {
	return params.provider.staticCatalog?.run({
		config: {},
		env: {},
		resolveProviderApiKey: () => ({ apiKey: void 0 }),
		resolveProviderAuth: () => ({
			apiKey: void 0,
			mode: "none",
			source: "none"
		})
	});
}
//#endregion
Object.defineProperty(exports, "groupPluginDiscoveryProvidersByOrder", {
	enumerable: true,
	get: function() {
		return groupPluginDiscoveryProvidersByOrder;
	}
});
Object.defineProperty(exports, "normalizePluginDiscoveryResult", {
	enumerable: true,
	get: function() {
		return normalizePluginDiscoveryResult;
	}
});
Object.defineProperty(exports, "providerMatchesFilter", {
	enumerable: true,
	get: function() {
		return providerMatchesFilter;
	}
});
Object.defineProperty(exports, "provider_discovery_exports", {
	enumerable: true,
	get: function() {
		return provider_discovery_exports;
	}
});
Object.defineProperty(exports, "resolveRuntimePluginDiscoveryProviders", {
	enumerable: true,
	get: function() {
		return resolveRuntimePluginDiscoveryProviders;
	}
});
Object.defineProperty(exports, "runProviderCatalog", {
	enumerable: true,
	get: function() {
		return runProviderCatalog;
	}
});
Object.defineProperty(exports, "runProviderStaticCatalog", {
	enumerable: true,
	get: function() {
		return runProviderStaticCatalog;
	}
});
