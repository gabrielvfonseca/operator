require("./rolldown-runtime-u92d-OFm.cjs");
const require_web_fetch_providers_runtime = require("./web-fetch-providers.runtime-4TTBYQmi.cjs");
const require_web_search_providers_runtime = require("./web-search-providers.runtime-BI5GXbuE.cjs");
//#region src/secrets/runtime-web-tools-fallback.runtime.ts
/** Lazy fallback provider discovery for web-tool secret metadata. */
/** Lazy-loaded provider discovery fallback used when public artifacts cannot prove the surface. */
const runtimeWebToolsFallbackProviders = {
	resolvePluginWebFetchProviders: require_web_fetch_providers_runtime.resolvePluginWebFetchProviders,
	resolvePluginWebSearchProviders: require_web_search_providers_runtime.resolvePluginWebSearchProviders
};
//#endregion
exports.runtimeWebToolsFallbackProviders = runtimeWebToolsFallbackProviders;
