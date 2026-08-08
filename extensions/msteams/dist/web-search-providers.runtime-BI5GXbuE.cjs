require("./loader-BXYDwRk1.cjs");
const require_web_search_providers_shared = require("./web-search-providers.shared-C1hrTfhU.cjs");
const require_web_provider_public_artifacts = require("./web-provider-public-artifacts-B2zorOn0.cjs");
const require_web_provider_runtime_shared = require("./web-provider-runtime-shared-5EeJkowX.cjs");
//#region src/plugins/web-search-providers.runtime.ts
function resolveWebSearchCandidatePluginIds(params) {
	return require_web_search_providers_shared.resolveManifestDeclaredWebProviderCandidatePluginIds({
		contract: "webSearchProviders",
		configKey: "webSearch",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds,
		origin: params.origin
	});
}
function mapRegistryWebSearchProviders(params) {
	return require_web_search_providers_shared.mapRegistryProviders({
		entries: params.registry.webSearchProviders,
		onlyPluginIds: params.onlyPluginIds,
		sortProviders: require_web_search_providers_shared.sortWebSearchProviders
	});
}
function resolvePluginWebSearchProviders(params) {
	return require_web_provider_runtime_shared.resolvePluginWebProviders(params, {
		resolveBundledResolutionConfig: require_web_search_providers_shared.resolveBundledWebSearchResolutionConfig,
		resolveCandidatePluginIds: resolveWebSearchCandidatePluginIds,
		mapRegistryProviders: mapRegistryWebSearchProviders,
		resolveBundledPublicArtifactProviders: require_web_provider_public_artifacts.resolveBundledWebSearchProvidersFromPublicArtifacts
	});
}
function resolveRuntimeWebSearchProviders(params) {
	return require_web_provider_runtime_shared.resolveRuntimeWebProviders(params, {
		resolveBundledResolutionConfig: require_web_search_providers_shared.resolveBundledWebSearchResolutionConfig,
		resolveCandidatePluginIds: resolveWebSearchCandidatePluginIds,
		mapRegistryProviders: mapRegistryWebSearchProviders
	});
}
//#endregion
Object.defineProperty(exports, "resolvePluginWebSearchProviders", {
	enumerable: true,
	get: function() {
		return resolvePluginWebSearchProviders;
	}
});
Object.defineProperty(exports, "resolveRuntimeWebSearchProviders", {
	enumerable: true,
	get: function() {
		return resolveRuntimeWebSearchProviders;
	}
});
