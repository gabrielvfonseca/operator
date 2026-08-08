const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
//#region src/plugins/provider-runtime.runtime.ts
/** Runtime-side provider discovery and provider registration resolution helpers. */
var provider_runtime_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	augmentModelCatalogWithProviderPlugins: () => augmentModelCatalogWithProviderPlugins,
	buildProviderAuthDoctorHintWithPlugin: () => buildProviderAuthDoctorHintWithPlugin,
	formatProviderAuthProfileApiKeyWithPlugin: () => formatProviderAuthProfileApiKeyWithPlugin,
	prepareProviderRuntimeAuth: () => prepareProviderRuntimeAuth,
	refreshProviderOAuthCredentialWithPlugin: () => refreshProviderOAuthCredentialWithPlugin
});
const providerRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./provider-runtime-Blezec6-.cjs")).then((n) => n.provider_runtime_exports));
async function loadProviderRuntime() {
	return await providerRuntimeLoader.load();
}
/** Lazily augments the model catalog with provider plugin metadata. */
async function augmentModelCatalogWithProviderPlugins(...args) {
	return (await loadProviderRuntime()).augmentModelCatalogWithProviderPlugins(...args);
}
/** Lazily builds doctor hint text for provider auth problems. */
async function buildProviderAuthDoctorHintWithPlugin(...args) {
	return (await loadProviderRuntime()).buildProviderAuthDoctorHintWithPlugin(...args);
}
/** Lazily formats API-key auth profile display text with provider plugin rules. */
async function formatProviderAuthProfileApiKeyWithPlugin(...args) {
	return (await loadProviderRuntime()).formatProviderAuthProfileApiKeyWithPlugin(...args);
}
/** Lazily prepares provider runtime auth for model execution. */
async function prepareProviderRuntimeAuth(...args) {
	return (await loadProviderRuntime()).prepareProviderRuntimeAuth(...args);
}
/** Lazily refreshes OAuth credentials through provider plugin runtime hooks. */
async function refreshProviderOAuthCredentialWithPlugin(...args) {
	return (await loadProviderRuntime()).refreshProviderOAuthCredentialWithPlugin(...args);
}
//#endregion
Object.defineProperty(exports, "augmentModelCatalogWithProviderPlugins", {
	enumerable: true,
	get: function() {
		return augmentModelCatalogWithProviderPlugins;
	}
});
Object.defineProperty(exports, "buildProviderAuthDoctorHintWithPlugin", {
	enumerable: true,
	get: function() {
		return buildProviderAuthDoctorHintWithPlugin;
	}
});
Object.defineProperty(exports, "formatProviderAuthProfileApiKeyWithPlugin", {
	enumerable: true,
	get: function() {
		return formatProviderAuthProfileApiKeyWithPlugin;
	}
});
Object.defineProperty(exports, "prepareProviderRuntimeAuth", {
	enumerable: true,
	get: function() {
		return prepareProviderRuntimeAuth;
	}
});
Object.defineProperty(exports, "provider_runtime_runtime_exports", {
	enumerable: true,
	get: function() {
		return provider_runtime_runtime_exports;
	}
});
Object.defineProperty(exports, "refreshProviderOAuthCredentialWithPlugin", {
	enumerable: true,
	get: function() {
		return refreshProviderOAuthCredentialWithPlugin;
	}
});
