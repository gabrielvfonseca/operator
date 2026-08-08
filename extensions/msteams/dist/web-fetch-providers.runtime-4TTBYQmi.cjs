require("./loader-BXYDwRk1.cjs");
const require_web_search_providers_shared = require("./web-search-providers.shared-C1hrTfhU.cjs");
const require_web_provider_public_artifacts = require("./web-provider-public-artifacts-B2zorOn0.cjs");
const require_web_provider_runtime_shared = require("./web-provider-runtime-shared-5EeJkowX.cjs");
//#region src/plugins/web-fetch-providers.runtime.ts
function resolveWebFetchCandidatePluginIds(params) {
	return require_web_search_providers_shared.resolveManifestDeclaredWebProviderCandidatePluginIds({
		contract: "webFetchProviders",
		configKey: "webFetch",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds,
		origin: params.origin,
		sandboxed: params.sandboxed
	});
}
function mapRegistryWebFetchProviders(params) {
	return require_web_search_providers_shared.mapRegistryProviders({
		entries: params.registry.webFetchProviders,
		onlyPluginIds: params.onlyPluginIds,
		sortProviders: require_web_search_providers_shared.sortWebFetchProviders
	});
}
/** Resolves web fetch providers, activating plugin runtimes when requested. */
function resolvePluginWebFetchProviders(params) {
	return require_web_provider_runtime_shared.resolvePluginWebProviders(params, {
		resolveBundledResolutionConfig: require_web_search_providers_shared.resolveBundledWebFetchResolutionConfig,
		resolveCandidatePluginIds: resolveWebFetchCandidatePluginIds,
		mapRegistryProviders: mapRegistryWebFetchProviders,
		resolveBundledPublicArtifactProviders: require_web_provider_public_artifacts.resolveBundledWebFetchProvidersFromPublicArtifacts,
		resolveBundledRuntimeArtifactProviders: require_web_provider_public_artifacts.resolveBundledRuntimeWebFetchProvidersFromPublicArtifacts
	});
}
/** Resolves already-eligible runtime web fetch providers without setup-mode activation. */
function resolveRuntimeWebFetchProviders(params) {
	return require_web_provider_runtime_shared.resolveRuntimeWebProviders(params, {
		resolveBundledResolutionConfig: require_web_search_providers_shared.resolveBundledWebFetchResolutionConfig,
		resolveCandidatePluginIds: resolveWebFetchCandidatePluginIds,
		mapRegistryProviders: mapRegistryWebFetchProviders,
		resolveBundledRuntimeArtifactProviders: require_web_provider_public_artifacts.resolveBundledRuntimeWebFetchProvidersFromPublicArtifacts
	});
}
//#endregion
Object.defineProperty(exports, "resolvePluginWebFetchProviders", {
	enumerable: true,
	get: function() {
		return resolvePluginWebFetchProviders;
	}
});
Object.defineProperty(exports, "resolveRuntimeWebFetchProviders", {
	enumerable: true,
	get: function() {
		return resolveRuntimeWebFetchProviders;
	}
});
