const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_public_surface_loader = require("./public-surface-loader-CK-Iot2Y.cjs");
//#region src/plugins/provider-policy-surface.ts
const PROVIDER_POLICY_ARTIFACT_CANDIDATES = ["provider-policy-api.js"];
const providerPolicySurfaceByPluginId = /* @__PURE__ */ new Map();
function hasProviderPolicyHook(mod) {
	return typeof mod.normalizeConfig === "function" || typeof mod.applyConfigDefaults === "function" || typeof mod.resolveConfigApiKey === "function" || typeof mod.resolveThinkingProfile === "function" || typeof mod.resolveModelRoutes === "function" || typeof mod.normalizeModelCatalogId === "function";
}
function resolveCachedProviderPolicySurface(params) {
	const cached = providerPolicySurfaceByPluginId.get(params.cacheKey);
	if (cached !== void 0) return cached;
	for (const artifactBasename of PROVIDER_POLICY_ARTIFACT_CANDIDATES) try {
		const mod = params.loadModule(artifactBasename);
		if (hasProviderPolicyHook(mod)) {
			providerPolicySurfaceByPluginId.set(params.cacheKey, mod);
			return mod;
		}
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(params.missingSurfacePrefix)) continue;
		throw error;
	}
	providerPolicySurfaceByPluginId.set(params.cacheKey, null);
	return null;
}
/** Loads policy hooks directly by canonical bundled plugin id. */
function resolveDirectBundledProviderPolicySurface(pluginId) {
	return resolveCachedProviderPolicySurface({
		cacheKey: `${require_bundled_dir.resolveBundledPluginsDir() ?? ""}\0${pluginId}`,
		loadModule: (artifactBasename) => require_public_surface_loader.loadBundledPluginPublicArtifactModuleSync({
			dirName: pluginId,
			artifactBasename
		}),
		missingSurfacePrefix: "Unable to resolve bundled plugin public surface "
	});
}
/** Loads policy hooks from a host-verified official external plugin install. */
function resolveTrustedExternalProviderPolicySurface(params) {
	if (params.trustedOfficialInstall !== true) return null;
	return resolveCachedProviderPolicySurface({
		cacheKey: `${params.pluginRoot}\0${params.pluginId}`,
		loadModule: (artifactBasename) => require_public_surface_loader.loadPluginPublicArtifactModuleSync({
			pluginRoot: params.pluginRoot,
			artifactBasename
		}),
		missingSurfacePrefix: "Unable to resolve plugin public surface "
	});
}
//#endregion
Object.defineProperty(exports, "resolveDirectBundledProviderPolicySurface", {
	enumerable: true,
	get: function() {
		return resolveDirectBundledProviderPolicySurface;
	}
});
Object.defineProperty(exports, "resolveTrustedExternalProviderPolicySurface", {
	enumerable: true,
	get: function() {
		return resolveTrustedExternalProviderPolicySurface;
	}
});
