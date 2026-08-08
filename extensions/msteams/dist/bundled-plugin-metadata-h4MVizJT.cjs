const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_config_schema = require("./config-schema-DHVbD0xQ.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
const require_public_surface_runtime = require("./public-surface-runtime-Qm3W2rVW.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/plugins/bundled-plugin-scan.ts
/** Scans bundled plugin source/build roots and derives public/runtime artifacts from manifests. */
const RUNTIME_SIDECAR_ARTIFACTS = /* @__PURE__ */ new Set([
	"helper-api.js",
	"light-runtime-api.js",
	"runtime-api.js",
	"runtime-setter-api.js",
	"thread-bindings-runtime.js"
]);
/** Normalizes string-list manifest fields found while scanning bundled plugin files. */
function normalizeBundledPluginStringList(value) {
	return require_string_normalization.normalizeTrimmedStringList(value);
}
/** Converts a source entry path to its built JavaScript artifact path. */
function rewriteBundledPluginEntryToBuiltPath(entry) {
	if (!entry) return;
	return entry.replace(/^\.\//u, "").replace(/\.[^.]+$/u, ".js");
}
function isTopLevelPublicSurfaceSource(name) {
	if (!require_public_surface_runtime.PUBLIC_SURFACE_SOURCE_EXTENSIONS.includes(node_path.default.extname(name))) return false;
	if (name.startsWith(".") || name.startsWith("test-") || name.includes(".test-")) return false;
	if (name.endsWith(".d.ts")) return false;
	if (/^config-api(\.[cm]?[jt]s)$/u.test(name)) return false;
	return !/(\.test|\.spec)(\.[cm]?[jt]s)$/u.test(name);
}
/** Derives a stable id hint for bundled plugins with one or more extension entrypoints. */
function deriveBundledPluginIdHint(params) {
	const base = node_path.default.basename(params.entryPath, node_path.default.extname(params.entryPath));
	if (!params.hasMultipleExtensions) return params.manifestId;
	const packageName = require_string_coerce.normalizeOptionalString(params.packageName);
	if (!packageName) return `${params.manifestId}/${base}`;
	return `${packageName.includes("/") ? packageName.split("/").pop() ?? packageName : packageName}/${base}`;
}
/** Lists top-level public surface artifacts that should be copied with bundled plugin runtime. */
function collectBundledPluginPublicSurfaceArtifacts(params) {
	const excluded = new Set(require_string_normalization.normalizeTrimmedStringList([params.sourceEntry, params.setupEntry]).map((entry) => node_path.default.basename(entry)));
	const artifacts = node_fs.default.readdirSync(params.pluginDir, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name).filter(isTopLevelPublicSurfaceSource).filter((entry) => !excluded.has(entry)).map((entry) => rewriteBundledPluginEntryToBuiltPath(entry)).filter((entry) => typeof entry === "string" && entry.length > 0).toSorted((left, right) => left.localeCompare(right));
	return artifacts.length > 0 ? artifacts : void 0;
}
/** Filters public artifacts down to runtime sidecars needed by bundled plugin execution. */
function collectBundledPluginRuntimeSidecarArtifacts(publicSurfaceArtifacts) {
	if (!publicSurfaceArtifacts) return;
	const artifacts = publicSurfaceArtifacts.filter((artifact) => RUNTIME_SIDECAR_ARTIFACTS.has(artifact));
	return artifacts.length > 0 ? artifacts : void 0;
}
/** Chooses the source or built extension directory appropriate for the current package layout. */
function resolveBundledPluginScanDir(params) {
	const sourceDir = node_path.default.join(params.packageRoot, "extensions");
	const runtimeDir = node_path.default.join(params.packageRoot, "dist-runtime", "extensions");
	const builtDir = node_path.default.join(params.packageRoot, "dist", "extensions");
	if (params.runningFromBuiltArtifact) {
		if (node_fs.default.existsSync(builtDir)) return builtDir;
		if (node_fs.default.existsSync(runtimeDir)) return runtimeDir;
	}
	if (node_fs.default.existsSync(sourceDir)) return sourceDir;
	if (node_fs.default.existsSync(runtimeDir) && node_fs.default.existsSync(builtDir)) return runtimeDir;
	if (node_fs.default.existsSync(builtDir)) return builtDir;
}
//#endregion
//#region src/plugins/bundled-channel-config-metadata.ts
/** Loads bundled channel config schema metadata from source or public surface modules. */
const SOURCE_CONFIG_SCHEMA_CANDIDATES = [
	node_path.default.join("src", "config-schema.ts"),
	node_path.default.join("src", "config-schema.js"),
	node_path.default.join("src", "config-schema.mts"),
	node_path.default.join("src", "config-schema.mjs"),
	node_path.default.join("src", "config-schema.cts"),
	node_path.default.join("src", "config-schema.cjs")
];
const PUBLIC_CONFIG_SURFACE_BASENAMES = ["channel-config-api"];
const moduleLoaders = require_plugin_module_loader_cache.createPluginModuleLoaderCache();
function isBuiltChannelConfigSchema(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	return Boolean(candidate.schema && typeof candidate.schema === "object");
}
function isJsonSchemaConfigSurface(value) {
	if (!value || typeof value !== "object") return false;
	const candidate = value;
	if (typeof candidate.safeParse === "function" || typeof candidate.toJSONSchema === "function") return false;
	return typeof candidate.type === "string" || Array.isArray(candidate.anyOf) || Array.isArray(candidate.oneOf) || Array.isArray(candidate.allOf) || Array.isArray(candidate.enum) || Object.hasOwn(candidate, "const");
}
function resolveConfigSchemaExport(imported) {
	for (const [name, value] of Object.entries(imported)) if (name.endsWith("ChannelConfigSchema") && isBuiltChannelConfigSchema(value)) return value;
	for (const [name, value] of Object.entries(imported)) {
		if (!name.endsWith("ConfigSchema") || name.endsWith("AccountConfigSchema")) continue;
		if (isBuiltChannelConfigSchema(value)) return value;
		if (isJsonSchemaConfigSurface(value)) return require_config_schema.buildJsonChannelConfigSchema(value);
		if (value && typeof value === "object") return require_config_schema.buildChannelConfigSchema(value);
	}
	for (const value of Object.values(imported)) if (isBuiltChannelConfigSchema(value)) return value;
	return null;
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
function resolveChannelConfigSchemaModulePath(pluginDir) {
	for (const relativePath of SOURCE_CONFIG_SCHEMA_CANDIDATES) {
		const candidate = node_path.default.join(pluginDir, relativePath);
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	for (const basename of PUBLIC_CONFIG_SURFACE_BASENAMES) for (const extension of require_public_surface_runtime.PUBLIC_SURFACE_SOURCE_EXTENSIONS) {
		const candidate = node_path.default.join(pluginDir, `${basename}${extension}`);
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
}
function loadChannelConfigSurfaceModuleSync(modulePath) {
	try {
		return resolveConfigSchemaExport(getModuleLoader(modulePath)(modulePath));
	} catch {
		return null;
	}
}
function resolvePackageChannelMeta(packageManifest, channelId) {
	const channelMeta = packageManifest?.channel;
	return channelMeta?.id?.trim() === channelId ? channelMeta : void 0;
}
function collectBundledChannelConfigs(params) {
	const channelIds = normalizeBundledPluginStringList(params.manifest.channels);
	const existingChannelConfigs = params.manifest.channelConfigs && Object.keys(params.manifest.channelConfigs).length > 0 ? { ...params.manifest.channelConfigs } : {};
	if (channelIds.length === 0) return Object.keys(existingChannelConfigs).length > 0 ? existingChannelConfigs : void 0;
	const surfaceModulePath = resolveChannelConfigSchemaModulePath(params.pluginDir);
	const surface = surfaceModulePath ? loadChannelConfigSurfaceModuleSync(surfaceModulePath) : null;
	for (const channelId of channelIds) {
		const existing = existingChannelConfigs[channelId];
		const channelMeta = resolvePackageChannelMeta(params.packageManifest, channelId);
		const preferOver = normalizeBundledPluginStringList(channelMeta?.preferOver);
		const uiHints = surface?.uiHints || existing?.uiHints ? {
			...surface?.uiHints && Object.keys(surface.uiHints).length > 0 ? surface.uiHints : {},
			...existing?.uiHints && Object.keys(existing.uiHints).length > 0 ? existing.uiHints : {}
		} : void 0;
		if (!surface?.schema && !existing?.schema) continue;
		existingChannelConfigs[channelId] = {
			schema: surface?.schema ?? existing?.schema ?? {},
			...uiHints && Object.keys(uiHints).length > 0 ? { uiHints } : {},
			...surface?.runtime ?? existing?.runtime ? { runtime: surface?.runtime ?? existing?.runtime } : {},
			...require_string_coerce.normalizeOptionalString(existing?.label) ?? require_string_coerce.normalizeOptionalString(channelMeta?.label) ? { label: require_string_coerce.normalizeOptionalString(existing?.label) ?? require_string_coerce.normalizeOptionalString(channelMeta?.label) } : {},
			...require_string_coerce.normalizeOptionalString(existing?.description) ?? require_string_coerce.normalizeOptionalString(channelMeta?.blurb) ? { description: require_string_coerce.normalizeOptionalString(existing?.description) ?? require_string_coerce.normalizeOptionalString(channelMeta?.blurb) } : {},
			...existing?.preferOver?.length ? { preferOver: existing.preferOver } : preferOver.length > 0 ? { preferOver } : {},
			...existing?.commands ?? channelMeta?.commands ? { commands: existing?.commands ?? channelMeta?.commands } : {}
		};
	}
	return Object.keys(existingChannelConfigs).length > 0 ? existingChannelConfigs : void 0;
}
//#endregion
//#region src/plugins/bundled-plugin-metadata.ts
const OPERATOR_PACKAGE_ROOT = require_plugin_module_loader_cache.resolveLoaderPackageRoot({
	modulePath: (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href),
	moduleUrl: require("url").pathToFileURL(__filename).href
}) ?? (0, node_url.fileURLToPath)(new URL("../..", require("url").pathToFileURL(__filename).href));
const CURRENT_MODULE_PATH = (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href);
const RUNNING_FROM_BUILT_ARTIFACT = CURRENT_MODULE_PATH.includes(`${node_path.default.sep}dist${node_path.default.sep}`) || CURRENT_MODULE_PATH.includes(`${node_path.default.sep}dist-runtime${node_path.default.sep}`);
function readPackageManifest(pluginDir) {
	return (0, _openclaw_fs_safe_json.tryReadJsonSync)(node_path.default.join(pluginDir, "package.json")) ?? void 0;
}
function resolveBundledPluginMetadataScanDir(packageRoot, scanDir) {
	if (scanDir) return node_path.default.resolve(scanDir);
	return resolveBundledPluginScanDir({
		packageRoot,
		runningFromBuiltArtifact: RUNNING_FROM_BUILT_ARTIFACT
	});
}
function resolveBundledPluginLookupParams(params) {
	return params.scanDir ? params : { rootDir: params.rootDir };
}
function collectBundledPluginMetadata(resolvedScanDir, includeChannelConfigs, includeSyntheticChannelConfigs) {
	if (!resolvedScanDir || !node_fs.default.existsSync(resolvedScanDir)) return [];
	const entries = [];
	for (const dirName of node_fs.default.readdirSync(resolvedScanDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).toSorted((left, right) => left.localeCompare(right))) {
		const pluginDir = node_path.default.join(resolvedScanDir, dirName);
		const manifestResult = require_manifest.loadPluginManifest(pluginDir, false);
		if (!manifestResult.ok) continue;
		const packageJson = readPackageManifest(pluginDir);
		const packageManifest = require_manifest.getPackageManifestMetadata(packageJson);
		const extensions = normalizeBundledPluginStringList(packageManifest?.extensions);
		if (extensions.length === 0) continue;
		const sourceEntry = require_string_coerce.normalizeOptionalString(extensions[0]);
		const builtEntry = rewriteBundledPluginEntryToBuiltPath(sourceEntry);
		if (!sourceEntry || !builtEntry) continue;
		const setupSourcePath = require_string_coerce.normalizeOptionalString(packageManifest?.setupEntry);
		const setupSource = setupSourcePath && rewriteBundledPluginEntryToBuiltPath(setupSourcePath) ? {
			source: setupSourcePath,
			built: rewriteBundledPluginEntryToBuiltPath(setupSourcePath)
		} : void 0;
		const publicSurfaceArtifacts = collectBundledPluginPublicSurfaceArtifacts({
			pluginDir,
			sourceEntry,
			...setupSourcePath ? { setupEntry: setupSourcePath } : {}
		});
		const runtimeSidecarArtifacts = collectBundledPluginRuntimeSidecarArtifacts(publicSurfaceArtifacts);
		const channelConfigs = includeChannelConfigs && includeSyntheticChannelConfigs ? collectBundledChannelConfigs({
			pluginDir,
			manifest: manifestResult.manifest,
			packageManifest
		}) : manifestResult.manifest.channelConfigs;
		entries.push({
			dirName,
			idHint: deriveBundledPluginIdHint({
				entryPath: sourceEntry,
				manifestId: manifestResult.manifest.id,
				packageName: require_string_coerce.normalizeOptionalString(packageJson?.name),
				hasMultipleExtensions: extensions.length > 1
			}),
			source: {
				source: sourceEntry,
				built: builtEntry
			},
			...setupSource ? { setupSource } : {},
			...publicSurfaceArtifacts ? { publicSurfaceArtifacts } : {},
			...runtimeSidecarArtifacts ? { runtimeSidecarArtifacts } : {},
			...require_string_coerce.normalizeOptionalString(packageJson?.name) ? { packageName: require_string_coerce.normalizeOptionalString(packageJson?.name) } : {},
			...require_string_coerce.normalizeOptionalString(packageJson?.version) ? { packageVersion: require_string_coerce.normalizeOptionalString(packageJson?.version) } : {},
			...require_string_coerce.normalizeOptionalString(packageJson?.description) ? { packageDescription: require_string_coerce.normalizeOptionalString(packageJson?.description) } : {},
			...packageManifest ? { packageManifest } : {},
			manifest: {
				...manifestResult.manifest,
				...channelConfigs ? { channelConfigs } : {}
			}
		});
	}
	return entries;
}
/** Lists bundled plugin metadata from source or built package layouts. */
function listBundledPluginMetadata(params) {
	const resolvedScanDir = resolveBundledPluginMetadataScanDir(node_path.default.resolve(params?.rootDir ?? OPERATOR_PACKAGE_ROOT), params?.scanDir ? node_path.default.resolve(params.scanDir) : void 0);
	const includeChannelConfigs = params?.includeChannelConfigs ?? !RUNNING_FROM_BUILT_ARTIFACT;
	const includeSyntheticChannelConfigs = params?.includeSyntheticChannelConfigs ?? includeChannelConfigs;
	return Object.freeze(collectBundledPluginMetadata(resolvedScanDir, includeChannelConfigs, includeSyntheticChannelConfigs));
}
/** Finds bundled plugin metadata by manifest id. */
function findBundledPluginMetadataById(pluginId, params) {
	return listBundledPluginMetadata(params).find((entry) => entry.manifest.id === pluginId);
}
function listBundledPluginEntryBaseDirs(params) {
	const scanPluginRoot = params.scanDir ? node_path.default.resolve(params.scanDir, params.pluginDirName ?? "") : void 0;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([
		...scanPluginRoot ? [node_path.default.resolve(scanPluginRoot, "dist")] : [],
		...scanPluginRoot ? [scanPluginRoot] : [],
		node_path.default.resolve(params.rootDir, "dist", "extensions", params.pluginDirName ?? ""),
		node_path.default.resolve(params.rootDir, "dist-runtime", "extensions", params.pluginDirName ?? ""),
		node_path.default.resolve(params.rootDir, "extensions", params.pluginDirName ?? "", "dist"),
		node_path.default.resolve(params.rootDir, "extensions", params.pluginDirName ?? "")
	]);
}
function isPathInsideRoot(rootDir, targetPath) {
	const relative = node_path.default.relative(rootDir, targetPath);
	return relative !== ".." && !relative.startsWith(`..${node_path.default.sep}`) && !node_path.default.isAbsolute(relative);
}
function listBundledPluginEntryRoots(params) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([
		...params.scanDir ? [node_path.default.resolve(params.scanDir, params.pluginDirName ?? "")] : [],
		node_path.default.resolve(params.rootDir, "extensions", params.pluginDirName ?? ""),
		node_path.default.resolve(params.rootDir, "dist", "extensions", params.pluginDirName ?? ""),
		node_path.default.resolve(params.rootDir, "dist-runtime", "extensions", params.pluginDirName ?? "")
	]);
}
function listBundledPluginEntrySearchPaths(entry, params) {
	const paths = [];
	const roots = listBundledPluginEntryRoots(params);
	for (const rawEntry of [entry.built, entry.source]) {
		if (typeof rawEntry !== "string" || rawEntry.length === 0) continue;
		if (!node_path.default.isAbsolute(rawEntry)) {
			paths.push(rawEntry);
			continue;
		}
		const normalizedEntry = node_path.default.normalize(rawEntry);
		for (const root of roots) {
			if (!isPathInsideRoot(root, normalizedEntry)) continue;
			const relativeEntry = node_path.default.relative(root, normalizedEntry);
			const builtEntry = rewriteBundledPluginEntryToBuiltPath(relativeEntry);
			if (builtEntry) paths.push(builtEntry);
			paths.push(relativeEntry);
		}
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(paths);
}
/** Resolves a generated runtime path for a bundled plugin entry. */
function resolveBundledPluginGeneratedPath(rootDir, entry, pluginDirName, scanDir) {
	if (!entry) return null;
	const entryOrder = listBundledPluginEntrySearchPaths(entry, {
		rootDir,
		pluginDirName,
		...scanDir ? { scanDir } : {}
	});
	const baseDirs = listBundledPluginEntryBaseDirs({
		rootDir,
		pluginDirName,
		...scanDir ? { scanDir } : {}
	});
	for (const baseDir of baseDirs) for (const entryPath of entryOrder) {
		const candidate = resolveBundledPluginEntryCandidate(baseDir, entryPath);
		if (!candidate) continue;
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	return null;
}
function normalizeRelativePluginEntryPath(entryPath) {
	return entryPath.replace(/^\.\//u, "");
}
function resolveBundledPluginEntryCandidate(baseDir, entryPath) {
	const normalizedEntryPath = normalizeRelativePluginEntryPath(entryPath);
	const candidate = node_path.default.isAbsolute(normalizedEntryPath) ? node_path.default.normalize(normalizedEntryPath) : node_path.default.resolve(baseDir, normalizedEntryPath);
	const relative = node_path.default.relative(baseDir, candidate);
	if (relative === ".." || relative.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relative)) return null;
	return candidate;
}
/** Resolves the repo entry path for a bundled plugin, preferring source unless requested. */
function resolveBundledPluginRepoEntryPath(params) {
	const metadata = findBundledPluginMetadataById(params.pluginId, {
		...resolveBundledPluginLookupParams({
			rootDir: params.rootDir,
			scanDir: params.scanDir
		}),
		includeChannelConfigs: false,
		includeSyntheticChannelConfigs: false
	});
	if (!metadata) return null;
	const entryOrder = params.preferBuilt ? [metadata.source.built, metadata.source.source] : [metadata.source.source, metadata.source.built];
	const baseDirs = listBundledPluginEntryBaseDirs({
		rootDir: params.rootDir,
		pluginDirName: metadata.dirName,
		...params.scanDir ? { scanDir: params.scanDir } : {}
	});
	for (const baseDir of baseDirs) for (const entryPath of entryOrder) {
		const candidate = resolveBundledPluginEntryCandidate(baseDir, entryPath);
		if (!candidate) continue;
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	return null;
}
//#endregion
Object.defineProperty(exports, "findBundledPluginMetadataById", {
	enumerable: true,
	get: function() {
		return findBundledPluginMetadataById;
	}
});
Object.defineProperty(exports, "listBundledPluginMetadata", {
	enumerable: true,
	get: function() {
		return listBundledPluginMetadata;
	}
});
Object.defineProperty(exports, "normalizeBundledPluginStringList", {
	enumerable: true,
	get: function() {
		return normalizeBundledPluginStringList;
	}
});
Object.defineProperty(exports, "resolveBundledPluginGeneratedPath", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginGeneratedPath;
	}
});
Object.defineProperty(exports, "resolveBundledPluginRepoEntryPath", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginRepoEntryPath;
	}
});
Object.defineProperty(exports, "resolveBundledPluginScanDir", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginScanDir;
	}
});
