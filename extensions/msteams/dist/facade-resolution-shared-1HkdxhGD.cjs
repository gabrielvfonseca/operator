const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_public_surface_runtime = require("./public-surface-runtime-Qm3W2rVW.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/plugin-sdk/facade-resolution-shared.ts
/**
* Shared resolver for bundled plugin facade module paths and registry fallbacks.
*/
/** Builds the cache key for one facade lookup under the current bundled-plugin mode. */
function createFacadeResolutionKey(params) {
	const disabledKey = require_bundled_dir.areBundledPluginsDisabled(params.env ?? process.env) ? "disabled" : "enabled";
	return `${params.dirName}::${params.artifactBasename}::${params.bundledPluginsDir ? node_path.default.resolve(params.bundledPluginsDir) : "<default>"}::${disabledKey}`;
}
/** Chooses the boundary root that should constrain a resolved facade module. */
function resolveFacadeBoundaryRoot(params) {
	if (!params.bundledPluginsDir) return params.packageRoot;
	const resolvedBundledPluginsDir = node_path.default.resolve(params.bundledPluginsDir);
	return params.modulePath.startsWith(`${resolvedBundledPluginsDir}${node_path.default.sep}`) ? resolvedBundledPluginsDir : params.packageRoot;
}
/** Resolves a bundled facade from source in dev and built artifacts in dist installs. */
function resolveBundledFacadeModuleLocation(params) {
	const env = params.env ?? process.env;
	if (require_bundled_dir.areBundledPluginsDisabled(env)) return null;
	const preferSource = !params.currentModulePath.includes(`${node_path.default.sep}dist${node_path.default.sep}`);
	const packageSourceRoot = node_path.default.resolve(params.packageRoot, "extensions");
	const publicSurfaceParams = {
		rootDir: params.packageRoot,
		env: params.env,
		...params.bundledPluginsDir ? { bundledPluginsDir: params.bundledPluginsDir } : {},
		dirName: params.dirName,
		artifactBasename: params.artifactBasename
	};
	const modulePath = preferSource ? require_public_surface_runtime.resolveBundledPluginSourcePublicSurfacePath({
		dirName: params.dirName,
		artifactBasename: params.artifactBasename,
		sourceRoot: params.bundledPluginsDir ?? packageSourceRoot
	}) ?? (params.bundledPluginsDir && !require_bundled_dir.areBundledPluginsDisabled(env) ? require_public_surface_runtime.resolveBundledPluginSourcePublicSurfacePath({
		dirName: params.dirName,
		artifactBasename: params.artifactBasename,
		sourceRoot: packageSourceRoot
	}) : null) ?? require_public_surface_runtime.resolveBundledPluginPublicSurfacePath(publicSurfaceParams) : require_public_surface_runtime.resolveBundledPluginPublicSurfacePath(publicSurfaceParams);
	return modulePath ? {
		modulePath,
		boundaryRoot: resolveFacadeBoundaryRoot({
			modulePath,
			bundledPluginsDir: params.bundledPluginsDir,
			packageRoot: params.packageRoot
		})
	} : null;
}
/** Resolves a facade path from manifest registry records using id, folder, then channel matches. */
function resolveRegistryPluginModuleLocationFromRecords(params) {
	const tiers = [
		(plugin) => plugin.id === params.dirName,
		(plugin) => node_path.default.basename(plugin.rootDir) === params.dirName,
		(plugin) => plugin.channels.includes(params.dirName)
	];
	const artifactBasename = require_public_surface_runtime.normalizeBundledPluginArtifactSubpath(params.artifactBasename);
	const sourceBaseName = artifactBasename.replace(/\.js$/u, "");
	for (const matchFn of tiers) for (const record of params.registry.filter(matchFn)) {
		const rootDir = node_path.default.resolve(record.rootDir);
		for (const builtCandidate of [node_path.default.join(rootDir, artifactBasename), node_path.default.join(rootDir, "dist", artifactBasename)]) if (node_fs.default.existsSync(builtCandidate)) return {
			modulePath: builtCandidate,
			boundaryRoot: rootDir
		};
		for (const ext of require_public_surface_runtime.PUBLIC_SURFACE_SOURCE_EXTENSIONS) {
			const sourceCandidate = node_path.default.join(rootDir, `${sourceBaseName}${ext}`);
			if (node_fs.default.existsSync(sourceCandidate)) return {
				modulePath: sourceCandidate,
				boundaryRoot: rootDir
			};
		}
	}
	return null;
}
//#endregion
Object.defineProperty(exports, "createFacadeResolutionKey", {
	enumerable: true,
	get: function() {
		return createFacadeResolutionKey;
	}
});
Object.defineProperty(exports, "resolveBundledFacadeModuleLocation", {
	enumerable: true,
	get: function() {
		return resolveBundledFacadeModuleLocation;
	}
});
Object.defineProperty(exports, "resolveRegistryPluginModuleLocationFromRecords", {
	enumerable: true,
	get: function() {
		return resolveRegistryPluginModuleLocationFromRecords;
	}
});
