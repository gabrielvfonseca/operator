const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/plugins/public-surface-runtime.ts
const PUBLIC_SURFACE_SOURCE_EXTENSIONS = [
	".ts",
	".mts",
	".js",
	".mjs",
	".cts",
	".cjs"
];
/** Normalizes a bundled public artifact subpath and rejects traversal/absolute paths. */
function normalizeBundledPluginArtifactSubpath(artifactBasename) {
	if (node_path.default.posix.isAbsolute(artifactBasename) || node_path.default.win32.isAbsolute(artifactBasename) || artifactBasename.includes("\\")) throw new Error(`Bundled plugin artifact path must stay plugin-local: ${artifactBasename}`);
	const normalized = artifactBasename.replace(/^\.\//u, "");
	if (!normalized) throw new Error("Bundled plugin artifact path must not be empty");
	if (normalized.split("/").some((segment) => segment.length === 0 || segment === "." || segment === ".." || segment.includes(":"))) throw new Error(`Bundled plugin artifact path must stay plugin-local: ${artifactBasename}`);
	return normalized;
}
/** Normalizes a bundled plugin directory name and rejects path-like values. */
function normalizeBundledPluginDirName(dirName) {
	const normalized = dirName.trim();
	if (!normalized || normalized === "." || normalized === ".." || normalized.includes("/") || normalized.includes("\\") || normalized.includes(":")) throw new Error(`Bundled plugin dirName must be a single directory: ${dirName}`);
	return normalized;
}
/** Resolves a source-tree public surface artifact path for bundled plugin development. */
function resolveBundledPluginSourcePublicSurfacePath(params) {
	const artifactBasename = normalizeBundledPluginArtifactSubpath(params.artifactBasename);
	const dirName = normalizeBundledPluginDirName(params.dirName);
	const sourceBaseName = artifactBasename.replace(/\.js$/u, "");
	for (const ext of PUBLIC_SURFACE_SOURCE_EXTENSIONS) {
		const sourceCandidate = node_path.default.resolve(params.sourceRoot, dirName, `${sourceBaseName}${ext}`);
		if (node_fs.default.existsSync(sourceCandidate)) return sourceCandidate;
	}
	return null;
}
/** Resolves a public surface artifact within one installed plugin root. */
function resolvePluginRootPublicSurfacePath(params) {
	const artifactBasename = normalizeBundledPluginArtifactSubpath(params.artifactBasename);
	const pluginRoot = node_path.default.resolve(params.pluginRoot);
	for (const candidate of [node_path.default.join(pluginRoot, artifactBasename), node_path.default.join(pluginRoot, "dist", artifactBasename)]) if (node_fs.default.existsSync(candidate)) return candidate;
	const sourceBaseName = artifactBasename.replace(/\.js$/u, "");
	for (const ext of PUBLIC_SURFACE_SOURCE_EXTENSIONS) {
		const candidate = node_path.default.join(pluginRoot, `${sourceBaseName}${ext}`);
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	return null;
}
function resolvePackageFallbackForBundledDir(params) {
	const normalizedBundledDir = node_path.default.resolve(params.bundledPluginsDir);
	const normalizedRootDir = node_path.default.resolve(params.rootDir);
	const packageBundledDirs = [node_path.default.join(normalizedRootDir, "dist", "extensions"), node_path.default.join(normalizedRootDir, "dist-runtime", "extensions")];
	if (!packageBundledDirs.includes(normalizedBundledDir)) return null;
	for (const packageBundledDir of packageBundledDirs) {
		if (packageBundledDir === normalizedBundledDir) continue;
		const builtCandidate = node_path.default.join(packageBundledDir, params.dirName, params.artifactBasename);
		if (node_fs.default.existsSync(builtCandidate)) return builtCandidate;
	}
	return resolveBundledPluginSourcePublicSurfacePath({
		sourceRoot: node_path.default.join(normalizedRootDir, "extensions"),
		dirName: params.dirName,
		artifactBasename: params.artifactBasename
	});
}
function sameExistingPath(left, right) {
	try {
		return node_fs.default.realpathSync.native(left) === node_fs.default.realpathSync.native(right);
	} catch {
		return false;
	}
}
function resolveExplicitEnvBundledPluginsDir(env) {
	const envOverride = env.OPERATOR_BUNDLED_PLUGINS_DIR?.trim();
	if (!envOverride) return;
	const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir(env);
	if (!bundledPluginsDir) return;
	return sameExistingPath(require_home_dir.resolveUserPath(envOverride, env), bundledPluginsDir) ? bundledPluginsDir : void 0;
}
function resolvePublicSurfaceFromBundledDir(params) {
	const pluginDir = node_path.default.resolve(params.bundledPluginsDir, params.dirName);
	const builtCandidate = node_path.default.join(pluginDir, params.artifactBasename);
	if (node_fs.default.existsSync(builtCandidate)) return builtCandidate;
	const packageLocalBuiltCandidate = node_path.default.join(pluginDir, "dist", params.artifactBasename);
	if (node_fs.default.existsSync(packageLocalBuiltCandidate)) return packageLocalBuiltCandidate;
	return resolveBundledPluginSourcePublicSurfacePath({
		sourceRoot: params.bundledPluginsDir,
		dirName: params.dirName,
		artifactBasename: params.artifactBasename
	}) ?? resolvePackageFallbackForBundledDir({
		rootDir: params.rootDir,
		bundledPluginsDir: params.bundledPluginsDir,
		dirName: params.dirName,
		artifactBasename: params.artifactBasename
	});
}
/** Resolves a bundled plugin public surface artifact across source, dist, and package layouts. */
function resolveBundledPluginPublicSurfacePath(params) {
	const artifactBasename = normalizeBundledPluginArtifactSubpath(params.artifactBasename);
	const dirName = normalizeBundledPluginDirName(params.dirName);
	const env = params.env ?? process.env;
	const explicitBundledPluginsDir = params.bundledPluginsDirMode === "auto" ? resolveExplicitEnvBundledPluginsDir(env) : params.bundledPluginsDir ?? resolveExplicitEnvBundledPluginsDir(env);
	if (explicitBundledPluginsDir) return resolvePublicSurfaceFromBundledDir({
		rootDir: params.rootDir,
		bundledPluginsDir: explicitBundledPluginsDir,
		dirName,
		artifactBasename
	});
	if (require_bundled_dir.areBundledPluginsDisabled(env)) return null;
	const sourceCandidate = resolveBundledPluginSourcePublicSurfacePath({
		sourceRoot: node_path.default.resolve(params.rootDir, "extensions"),
		dirName,
		artifactBasename
	});
	if (sourceCandidate) return sourceCandidate;
	const bundledPluginsDir = params.bundledPluginsDirMode === "auto" ? params.bundledPluginsDir : require_bundled_dir.resolveBundledPluginsDir(env);
	if (bundledPluginsDir) {
		const bundledCandidate = resolvePublicSurfaceFromBundledDir({
			rootDir: params.rootDir,
			bundledPluginsDir,
			dirName,
			artifactBasename
		});
		if (bundledCandidate) return bundledCandidate;
	}
	for (const candidate of [node_path.default.resolve(params.rootDir, "dist", "extensions", dirName, artifactBasename), node_path.default.resolve(params.rootDir, "dist-runtime", "extensions", dirName, artifactBasename)]) if (node_fs.default.existsSync(candidate)) return candidate;
	return null;
}
//#endregion
Object.defineProperty(exports, "PUBLIC_SURFACE_SOURCE_EXTENSIONS", {
	enumerable: true,
	get: function() {
		return PUBLIC_SURFACE_SOURCE_EXTENSIONS;
	}
});
Object.defineProperty(exports, "normalizeBundledPluginArtifactSubpath", {
	enumerable: true,
	get: function() {
		return normalizeBundledPluginArtifactSubpath;
	}
});
Object.defineProperty(exports, "resolveBundledPluginPublicSurfacePath", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginPublicSurfacePath;
	}
});
Object.defineProperty(exports, "resolveBundledPluginSourcePublicSurfacePath", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginSourcePublicSurfacePath;
	}
});
Object.defineProperty(exports, "resolvePluginRootPublicSurfacePath", {
	enumerable: true,
	get: function() {
		return resolvePluginRootPublicSurfacePath;
	}
});
