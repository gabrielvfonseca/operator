const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_facade_resolution_shared = require("./facade-resolution-shared-1HkdxhGD.cjs");
const require_facade_loader = require("./facade-loader-CNps1O4t.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let node_module = require("node:module");
//#region src/plugin-sdk/facade-runtime.ts
const OPERATOR_PACKAGE_ROOT = require_plugin_module_loader_cache.resolveLoaderPackageRoot({
	modulePath: (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href),
	moduleUrl: require("url").pathToFileURL(__filename).href
}) ?? (0, node_url.fileURLToPath)(new URL("../..", require("url").pathToFileURL(__filename).href));
const CURRENT_MODULE_PATH = (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href);
const OPERATOR_SOURCE_EXTENSIONS_ROOT = node_path.default.resolve(OPERATOR_PACKAGE_ROOT, "extensions");
function createFacadeResolutionKey(params) {
	const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir(params.env ?? process.env);
	return require_facade_resolution_shared.createFacadeResolutionKey({
		...params,
		bundledPluginsDir,
		...params.env ? { env: params.env } : {}
	});
}
function resolveRegistryPluginModuleLocation(params) {
	return loadFacadeActivationCheckRuntime().resolveRegistryPluginModuleLocation({
		...params,
		resolutionKey: createFacadeResolutionKey(params)
	});
}
function resolveFacadeModuleLocationUncached(params) {
	const env = params.env ?? process.env;
	if (!require_bundled_dir.areBundledPluginsDisabled(env)) {
		const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir(env);
		const bundledLocation = require_facade_resolution_shared.resolveBundledFacadeModuleLocation({
			...params,
			currentModulePath: CURRENT_MODULE_PATH,
			packageRoot: OPERATOR_PACKAGE_ROOT,
			bundledPluginsDir
		});
		if (bundledLocation) return bundledLocation;
	}
	return resolveRegistryPluginModuleLocation(params);
}
function resolveFacadeModuleLocation(params) {
	return resolveFacadeModuleLocationUncached(params);
}
const nodeRequire = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
const FACADE_ACTIVATION_CHECK_RUNTIME_CANDIDATES = ["./facade-activation-check.runtime.js", "./facade-activation-check.runtime.ts"];
let facadeActivationCheckRuntimeModule;
const facadeActivationCheckRuntimeLoaders = /* @__PURE__ */ new Map();
function getFacadeActivationCheckRuntimeSourceLoader(modulePath) {
	return require_plugin_module_loader_cache.getCachedPluginSourceModuleLoader({
		cache: facadeActivationCheckRuntimeLoaders,
		modulePath,
		importerUrl: require("url").pathToFileURL(__filename).href,
		loaderFilename: require("url").pathToFileURL(__filename).href,
		aliasMap: {}
	});
}
function loadFacadeActivationCheckRuntimeFromCandidates(loadCandidate) {
	for (const candidate of FACADE_ACTIVATION_CHECK_RUNTIME_CANDIDATES) try {
		return loadCandidate(candidate);
	} catch {}
}
function loadFacadeActivationCheckRuntime() {
	if (facadeActivationCheckRuntimeModule) return facadeActivationCheckRuntimeModule;
	facadeActivationCheckRuntimeModule = loadFacadeActivationCheckRuntimeFromCandidates((candidate) => nodeRequire(candidate));
	if (facadeActivationCheckRuntimeModule) return facadeActivationCheckRuntimeModule;
	facadeActivationCheckRuntimeModule = loadFacadeActivationCheckRuntimeFromCandidates((candidate) => getFacadeActivationCheckRuntimeSourceLoader(candidate)(candidate));
	if (facadeActivationCheckRuntimeModule) return facadeActivationCheckRuntimeModule;
	throw new Error("Unable to load facade activation check runtime");
}
async function loadFacadeActivationCheckRuntimeAsync() {
	facadeActivationCheckRuntimeModule ??= await Promise.resolve().then(() => require("./facade-activation-check.runtime-B8aTA7ul.cjs"));
	return facadeActivationCheckRuntimeModule;
}
function loadFacadeModuleAtLocationSync(params) {
	return require_facade_loader.loadFacadeModuleAtLocationSync(params);
}
function buildFacadeActivationCheckParams(params, location = resolveFacadeModuleLocation(params)) {
	return {
		...params,
		location,
		sourceExtensionsRoot: OPERATOR_SOURCE_EXTENSIONS_ROOT,
		resolutionKey: createFacadeResolutionKey(params)
	};
}
/** Load a bundled or registry-backed plugin public surface, tracking activation ownership. */
function loadBundledPluginPublicSurfaceModuleSync(params) {
	const location = resolveFacadeModuleLocation(params);
	const trackedPluginId = () => loadFacadeActivationCheckRuntime().resolveTrackedFacadePluginId(buildFacadeActivationCheckParams(params, location));
	if (!location) return require_facade_loader.loadBundledPluginPublicSurfaceModuleSync({
		...params,
		trackedPluginId
	});
	return loadFacadeModuleAtLocationSync({
		location,
		trackedPluginId,
		runtimeDeps: {
			pluginId: params.dirName,
			...params.env ? { env: params.env } : {}
		}
	});
}
/** Check whether an activated bundled plugin public surface may be loaded. */
function canLoadActivatedBundledPluginPublicSurface(params) {
	return loadFacadeActivationCheckRuntime().resolveBundledPluginPublicSurfaceAccess(buildFacadeActivationCheckParams(params)).allowed;
}
/** Load an activated plugin public surface or throw when activation policy blocks access. */
function loadActivatedBundledPluginPublicSurfaceModuleSync(params) {
	loadFacadeActivationCheckRuntime().resolveActivatedBundledPluginPublicSurfaceAccessOrThrow(buildFacadeActivationCheckParams(params));
	return loadBundledPluginPublicSurfaceModuleSync(params);
}
/** Load an activated plugin public surface, returning null when activation policy blocks access. */
function tryLoadActivatedBundledPluginPublicSurfaceModuleSync(params) {
	if (!loadFacadeActivationCheckRuntime().resolveBundledPluginPublicSurfaceAccess(buildFacadeActivationCheckParams(params)).allowed) return null;
	return loadBundledPluginPublicSurfaceModuleSync(params);
}
/** Async variant of tryLoadActivatedBundledPluginPublicSurfaceModuleSync for async call sites. */
async function tryLoadActivatedBundledPluginPublicSurfaceModule(params) {
	if (!(await loadFacadeActivationCheckRuntimeAsync()).resolveBundledPluginPublicSurfaceAccess(buildFacadeActivationCheckParams(params)).allowed) return null;
	return loadBundledPluginPublicSurfaceModuleSync(params);
}
//#endregion
Object.defineProperty(exports, "canLoadActivatedBundledPluginPublicSurface", {
	enumerable: true,
	get: function() {
		return canLoadActivatedBundledPluginPublicSurface;
	}
});
Object.defineProperty(exports, "loadActivatedBundledPluginPublicSurfaceModuleSync", {
	enumerable: true,
	get: function() {
		return loadActivatedBundledPluginPublicSurfaceModuleSync;
	}
});
Object.defineProperty(exports, "loadBundledPluginPublicSurfaceModuleSync", {
	enumerable: true,
	get: function() {
		return loadBundledPluginPublicSurfaceModuleSync;
	}
});
Object.defineProperty(exports, "tryLoadActivatedBundledPluginPublicSurfaceModule", {
	enumerable: true,
	get: function() {
		return tryLoadActivatedBundledPluginPublicSurfaceModule;
	}
});
Object.defineProperty(exports, "tryLoadActivatedBundledPluginPublicSurfaceModuleSync", {
	enumerable: true,
	get: function() {
		return tryLoadActivatedBundledPluginPublicSurfaceModuleSync;
	}
});
