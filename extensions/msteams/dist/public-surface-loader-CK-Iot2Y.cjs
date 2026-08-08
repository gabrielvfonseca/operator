const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_public_surface_runtime = require("./public-surface-runtime-Qm3W2rVW.cjs");
require("./fs-safe-advanced-r6xSCXfB.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let node_module = require("node:module");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/public-surface-loader.ts
const OPERATOR_PACKAGE_ROOT = require_plugin_module_loader_cache.resolveLoaderPackageRoot({
	modulePath: (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href),
	moduleUrl: require("url").pathToFileURL(__filename).href
}) ?? (0, node_url.fileURLToPath)(new URL("../..", require("url").pathToFileURL(__filename).href));
const publicSurfaceModuleCache = /* @__PURE__ */ new Map();
const sourceArtifactRequire = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
const publicSurfaceLocationCache = /* @__PURE__ */ new Map();
const moduleLoaders = require_plugin_module_loader_cache.createPluginModuleLoaderCache();
function isSourceArtifactPath(modulePath) {
	switch (node_path.default.extname(modulePath).toLowerCase()) {
		case ".ts":
		case ".tsx":
		case ".mts":
		case ".cts":
		case ".mtsx":
		case ".ctsx": return true;
		default: return false;
	}
}
function canUseSourceArtifactRequire(params) {
	return !params.tryNative && isSourceArtifactPath(params.modulePath) && typeof sourceArtifactRequire.extensions?.[".ts"] === "function";
}
function createResolutionKey(params) {
	const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir();
	return `${params.dirName}::${params.artifactBasename}::${bundledPluginsDir ? node_path.default.resolve(bundledPluginsDir) : "<default>"}`;
}
function resolvePublicSurfaceLocationUncached(params) {
	const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir();
	const modulePath = require_public_surface_runtime.resolveBundledPluginPublicSurfacePath({
		rootDir: OPERATOR_PACKAGE_ROOT,
		...bundledPluginsDir ? {
			bundledPluginsDir,
			bundledPluginsDirMode: "explicit"
		} : {},
		dirName: params.dirName,
		artifactBasename: params.artifactBasename
	});
	if (!modulePath) return null;
	return {
		modulePath,
		boundaryRoot: bundledPluginsDir && modulePath.startsWith(node_path.default.resolve(bundledPluginsDir) + node_path.default.sep) ? node_path.default.resolve(bundledPluginsDir) : OPERATOR_PACKAGE_ROOT
	};
}
function resolvePublicSurfaceLocation(params) {
	const key = createResolutionKey(params);
	const cached = publicSurfaceLocationCache.get(key);
	if (cached) return cached;
	const resolved = resolvePublicSurfaceLocationUncached(params);
	if (resolved) publicSurfaceLocationCache.set(key, resolved);
	return resolved;
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
function loadPublicSurfaceModule(modulePath) {
	if (canUseSourceArtifactRequire({
		modulePath,
		tryNative: require_plugin_module_loader_cache.resolvePluginLoaderTryNative(modulePath, { preferBuiltDist: true })
	})) return sourceArtifactRequire(modulePath);
	return getModuleLoader(modulePath)(modulePath);
}
function loadValidatedPublicSurfaceModule(params) {
	const cached = publicSurfaceModuleCache.get(params.modulePath);
	if (cached) return cached;
	const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
		absolutePath: params.modulePath,
		rootPath: params.boundaryRoot,
		boundaryLabel: params.boundaryLabel,
		rejectHardlinks: false
	});
	if (!opened.ok) throw new Error(`Unable to open ${params.surfaceLabel}`, { cause: opened.error });
	const validatedPath = opened.path;
	const validatedStat = opened.stat;
	node_fs.default.closeSync(opened.fd);
	if (!(0, _openclaw_fs_safe_advanced.sameFileIdentity)(validatedStat, node_fs.default.statSync(validatedPath))) throw new Error(`${params.surfaceLabel} changed after validation`);
	const sentinel = {};
	publicSurfaceModuleCache.set(params.modulePath, sentinel);
	publicSurfaceModuleCache.set(validatedPath, sentinel);
	try {
		const loaded = loadPublicSurfaceModule(validatedPath);
		Object.assign(sentinel, loaded);
		return sentinel;
	} catch (error) {
		publicSurfaceModuleCache.delete(params.modulePath);
		publicSurfaceModuleCache.delete(validatedPath);
		throw error;
	}
}
function loadBundledPluginPublicArtifactModuleSync(params) {
	const location = resolvePublicSurfaceLocation(params);
	if (!location) throw new Error(`Unable to resolve bundled plugin public surface ${params.dirName}/${params.artifactBasename}`);
	return loadValidatedPublicSurfaceModule({
		modulePath: location.modulePath,
		boundaryRoot: location.boundaryRoot,
		boundaryLabel: location.boundaryRoot === OPERATOR_PACKAGE_ROOT ? "Operator package root" : "plugin root",
		surfaceLabel: `bundled plugin public surface ${params.dirName}/${params.artifactBasename}`
	});
}
function loadPluginPublicArtifactModuleSync(params) {
	const modulePath = require_public_surface_runtime.resolvePluginRootPublicSurfacePath(params);
	if (!modulePath) throw new Error(`Unable to resolve plugin public surface ${params.pluginRoot}/${params.artifactBasename}`);
	return loadValidatedPublicSurfaceModule({
		modulePath,
		boundaryRoot: node_path.default.resolve(params.pluginRoot),
		boundaryLabel: "plugin root",
		surfaceLabel: `plugin public surface ${params.artifactBasename}`
	});
}
/** Loads the first resolvable bundled public artifact from an ordered candidate list. */
function loadBundledPluginPublicArtifactModuleFromCandidatesSync(params) {
	for (const artifactBasename of params.artifactCandidates) try {
		return loadBundledPluginPublicArtifactModuleSync({
			dirName: params.dirName,
			artifactBasename
		});
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("Unable to resolve bundled plugin public surface ")) continue;
		throw error;
	}
	return null;
}
//#endregion
Object.defineProperty(exports, "loadBundledPluginPublicArtifactModuleFromCandidatesSync", {
	enumerable: true,
	get: function() {
		return loadBundledPluginPublicArtifactModuleFromCandidatesSync;
	}
});
Object.defineProperty(exports, "loadBundledPluginPublicArtifactModuleSync", {
	enumerable: true,
	get: function() {
		return loadBundledPluginPublicArtifactModuleSync;
	}
});
Object.defineProperty(exports, "loadPluginPublicArtifactModuleSync", {
	enumerable: true,
	get: function() {
		return loadPluginPublicArtifactModuleSync;
	}
});
