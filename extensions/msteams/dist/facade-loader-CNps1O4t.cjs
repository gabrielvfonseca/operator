const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_hardlink_policy = require("./hardlink-policy-6OYvPgP1.cjs");
const require_facade_resolution_shared = require("./facade-resolution-shared-1HkdxhGD.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugin-sdk/facade-loader.ts
const CURRENT_MODULE_PATH = (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href);
const moduleLoaders = /* @__PURE__ */ new Map();
const loadedFacadeModules = /* @__PURE__ */ new Map();
const loadedFacadePluginIds = /* @__PURE__ */ new Set();
let cachedOperatorPackageRoot;
function getOperatorPackageRoot() {
	if (cachedOperatorPackageRoot) return cachedOperatorPackageRoot;
	cachedOperatorPackageRoot = require_plugin_module_loader_cache.resolveLoaderPackageRoot({
		modulePath: (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href),
		moduleUrl: require("url").pathToFileURL(__filename).href
	}) ?? (0, node_url.fileURLToPath)(new URL("../..", require("url").pathToFileURL(__filename).href));
	return cachedOperatorPackageRoot;
}
function resolveFacadeModuleLocation(params) {
	const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir(params.env ?? process.env);
	return require_facade_resolution_shared.resolveBundledFacadeModuleLocation({
		...params,
		currentModulePath: CURRENT_MODULE_PATH,
		packageRoot: getOperatorPackageRoot(),
		bundledPluginsDir
	});
}
function getModuleLoader(modulePath) {
	return require_plugin_module_loader_cache.getCachedPluginModuleLoader({
		cache: moduleLoaders,
		modulePath,
		importerUrl: require("url").pathToFileURL(__filename).href,
		preferBuiltDist: true,
		loaderFilename: require("url").pathToFileURL(__filename).href
	});
}
function isPathAtOrInside(target, root) {
	const resolvedRoot = node_path.default.resolve(root);
	const resolvedTarget = node_path.default.resolve(target);
	return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(resolvedRoot + node_path.default.sep);
}
function resolveFacadeBoundaryOpenParams(boundaryRoot) {
	if (isPathAtOrInside(boundaryRoot, getOperatorPackageRoot())) return {
		boundaryLabel: "Operator package root",
		rejectHardlinks: false
	};
	const bundledDir = require_bundled_dir.resolveBundledPluginsDir();
	if (bundledDir && isPathAtOrInside(boundaryRoot, bundledDir)) return {
		boundaryLabel: "bundled plugin directory",
		rejectHardlinks: false
	};
	return {
		boundaryLabel: "plugin root",
		rejectHardlinks: require_hardlink_policy.shouldRejectHardlinkedPluginFiles({
			origin: "global",
			rootDir: boundaryRoot
		})
	};
}
/** Load and cache a facade module after verifying it is inside its declared boundary root. */
function loadFacadeModuleAtLocationSync(params) {
	const location = params.location;
	const cached = loadedFacadeModules.get(location.modulePath);
	if (cached) return cached;
	const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
		absolutePath: location.modulePath,
		rootPath: location.boundaryRoot,
		...resolveFacadeBoundaryOpenParams(location.boundaryRoot)
	});
	if (!opened.ok) throw new Error(`Unable to open bundled plugin public surface ${location.modulePath}`, { cause: opened.error });
	node_fs.default.closeSync(opened.fd);
	const sentinel = {};
	loadedFacadeModules.set(location.modulePath, sentinel);
	let loaded;
	try {
		loaded = params.loadModule?.(location.modulePath) ?? getModuleLoader(location.modulePath)(location.modulePath);
		Object.assign(sentinel, loaded);
		loadedFacadePluginIds.add(typeof params.trackedPluginId === "function" ? params.trackedPluginId() : params.trackedPluginId);
	} catch (err) {
		loadedFacadeModules.delete(location.modulePath);
		throw err;
	}
	return sentinel;
}
/** Resolve and synchronously load a bundled plugin public surface by plugin dir and artifact name. */
function loadBundledPluginPublicSurfaceModuleSync(params) {
	const location = resolveFacadeModuleLocation(params);
	if (!location) throw new Error(`Unable to resolve bundled plugin public surface ${params.dirName}/${params.artifactBasename}`);
	return loadFacadeModuleAtLocationSync({
		location,
		trackedPluginId: params.trackedPluginId ?? params.dirName
	});
}
/** List plugin ids whose public facades have been loaded in this process. */
function listImportedBundledPluginFacadeIds() {
	return [...loadedFacadePluginIds].toSorted((left, right) => left.localeCompare(right));
}
//#endregion
Object.defineProperty(exports, "listImportedBundledPluginFacadeIds", {
	enumerable: true,
	get: function() {
		return listImportedBundledPluginFacadeIds;
	}
});
Object.defineProperty(exports, "loadBundledPluginPublicSurfaceModuleSync", {
	enumerable: true,
	get: function() {
		return loadBundledPluginPublicSurfaceModuleSync;
	}
});
Object.defineProperty(exports, "loadFacadeModuleAtLocationSync", {
	enumerable: true,
	get: function() {
		return loadFacadeModuleAtLocationSync;
	}
});
