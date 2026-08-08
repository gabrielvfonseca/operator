const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_config_schema = require("./config-schema-DHVbD0xQ.cjs");
require("./boundary-file-read-r6xSCXfB.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
const require_plugin_load_profile = require("./plugin-load-profile-BsUJCmTX.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugin-sdk/channel-entry-contract.ts
const moduleLoaders = /* @__PURE__ */ new Map();
const entryBoundaryInfoCache = /* @__PURE__ */ new Map();
const resolvedModulePaths = /* @__PURE__ */ new Map();
const loadedModuleExports = /* @__PURE__ */ new Map();
const disableBundledEntrySourceFallbackEnv = "OPERATOR_DISABLE_BUNDLED_ENTRY_SOURCE_FALLBACK";
function isTruthyEnvFlag(value) {
	return value !== void 0 && !/^(?:0|false)$/iu.test(value.trim());
}
function resolveSpecifierCandidates(modulePath) {
	const ext = require_string_coerce.normalizeLowercaseStringOrEmpty(node_path.default.extname(modulePath));
	if (ext === ".js") return [modulePath, `${modulePath.slice(0, -3)}.ts`];
	if (ext === ".mjs") return [modulePath, `${modulePath.slice(0, -4)}.mts`];
	if (ext === ".cjs") return [modulePath, `${modulePath.slice(0, -4)}.cts`];
	return [modulePath];
}
function resolveEntryBoundaryRoot(importMetaUrl) {
	return node_path.default.dirname((0, node_url.fileURLToPath)(importMetaUrl));
}
function resolveBundledEntryBoundaryInfo(importMetaUrl) {
	const cacheKey = `${process.argv[1] ?? ""}\0${importMetaUrl}`;
	const cached = entryBoundaryInfoCache.get(cacheKey);
	if (cached) return cached;
	const importerPath = (0, node_url.fileURLToPath)(importMetaUrl);
	const importerDir = node_path.default.dirname(importerPath);
	const info = {
		importerPath,
		importerDir,
		boundaryRoot: node_path.default.dirname(importerPath),
		packageRoot: require_plugin_module_loader_cache.resolveLoaderPackageRoot({
			modulePath: importerPath,
			moduleUrl: importMetaUrl,
			cwd: importerDir,
			argv1: process.argv[1]
		}) ?? null
	};
	entryBoundaryInfoCache.set(cacheKey, info);
	return info;
}
function addBundledEntryCandidates(candidates, basePath, boundaryRoot) {
	for (const candidate of resolveSpecifierCandidates(basePath)) {
		if (candidates.some((entry) => entry.path === candidate && entry.boundaryRoot === boundaryRoot)) continue;
		candidates.push({
			path: candidate,
			boundaryRoot
		});
	}
}
function resolveBundledEntryModuleCandidates(importMetaUrl, specifier) {
	const { importerPath, importerDir, boundaryRoot, packageRoot } = resolveBundledEntryBoundaryInfo(importMetaUrl);
	const candidates = [];
	addBundledEntryCandidates(candidates, node_path.default.resolve(importerDir, specifier), boundaryRoot);
	const sourceRelativeSpecifier = specifier.replace(/^\.\/src\//u, "./");
	if (sourceRelativeSpecifier !== specifier) addBundledEntryCandidates(candidates, node_path.default.resolve(importerDir, sourceRelativeSpecifier), boundaryRoot);
	if (!packageRoot) return candidates;
	const distExtensionsRoot = node_path.default.join(packageRoot, "dist", "extensions") + node_path.default.sep;
	if (!importerPath.startsWith(distExtensionsRoot)) return candidates;
	if (isTruthyEnvFlag(process.env[disableBundledEntrySourceFallbackEnv])) return candidates;
	const pluginDirName = node_path.default.basename(importerDir);
	const sourcePluginRoot = node_path.default.join(packageRoot, "extensions", pluginDirName);
	if (sourcePluginRoot === boundaryRoot) return candidates;
	addBundledEntryCandidates(candidates, node_path.default.resolve(sourcePluginRoot, specifier), sourcePluginRoot);
	if (sourceRelativeSpecifier !== specifier) addBundledEntryCandidates(candidates, node_path.default.resolve(sourcePluginRoot, sourceRelativeSpecifier), sourcePluginRoot);
	return candidates;
}
function formatBundledEntryUnknownError(error) {
	if (typeof error === "string") return error;
	if (error === void 0) return "boundary validation failed";
	try {
		return JSON.stringify(error);
	} catch {
		return "non-serializable error";
	}
}
function formatBundledEntryModuleOpenFailure(params) {
	const importerPath = (0, node_url.fileURLToPath)(params.importMetaUrl);
	const errorDetail = params.failure.error instanceof Error ? params.failure.error.message : formatBundledEntryUnknownError(params.failure.error);
	return [
		`bundled plugin entry "${params.specifier}" failed to open`,
		`from "${importerPath}"`,
		`(resolved "${params.resolvedPath}", plugin root "${params.boundaryRoot}",`,
		`reason "${params.failure.reason}"): ${errorDetail}`
	].join(" ");
}
function createBundledEntryModulePathCacheKey(importMetaUrl, specifier) {
	return `${isTruthyEnvFlag(process.env[disableBundledEntrySourceFallbackEnv]) ? "1" : "0"}\0${importMetaUrl}\0${specifier}`;
}
function resolveBundledEntryModulePath(importMetaUrl, specifier) {
	const cacheKey = createBundledEntryModulePathCacheKey(importMetaUrl, specifier);
	const cached = resolvedModulePaths.get(cacheKey);
	if (cached) return cached;
	const candidates = resolveBundledEntryModuleCandidates(importMetaUrl, specifier);
	const fallbackCandidate = candidates[0] ?? {
		path: node_path.default.resolve(node_path.default.dirname((0, node_url.fileURLToPath)(importMetaUrl)), specifier),
		boundaryRoot: resolveEntryBoundaryRoot(importMetaUrl)
	};
	let firstFailure = null;
	for (const candidate of candidates) {
		const opened = (0, _openclaw_fs_safe_advanced.openRootFileSync)({
			absolutePath: candidate.path,
			rootPath: candidate.boundaryRoot,
			boundaryLabel: "plugin root",
			rejectHardlinks: false,
			skipLexicalRootCheck: true
		});
		if (opened.ok) {
			node_fs.default.closeSync(opened.fd);
			resolvedModulePaths.set(cacheKey, opened.path);
			return opened.path;
		}
		firstFailure ??= {
			candidate,
			failure: opened
		};
	}
	const failure = firstFailure;
	if (!failure) throw new Error(formatBundledEntryModuleOpenFailure({
		importMetaUrl,
		specifier,
		resolvedPath: fallbackCandidate.path,
		boundaryRoot: fallbackCandidate.boundaryRoot,
		failure: {
			ok: false,
			reason: "path",
			error: /* @__PURE__ */ new Error(`ENOENT: no such file or directory, lstat '${fallbackCandidate.path}'`)
		}
	}));
	throw new Error(formatBundledEntryModuleOpenFailure({
		importMetaUrl,
		specifier,
		resolvedPath: failure.candidate.path,
		boundaryRoot: failure.candidate.boundaryRoot,
		failure: failure.failure
	}));
}
function getSourceModuleLoader(modulePath, options, transformOperatorDependencies = false) {
	return require_plugin_module_loader_cache.getCachedPluginSourceModuleLoader({
		cache: moduleLoaders,
		modulePath,
		importerUrl: require("url").pathToFileURL(__filename).href,
		preferBuiltDist: true,
		loaderFilename: require("url").pathToFileURL(__filename).href,
		transformOperatorDependencies,
		...options.createLoaderForTest ? { createLoader: options.createLoaderForTest } : {}
	});
}
function canTryNodeRequireBuiltModule(modulePath) {
	return (modulePath.includes(`${node_path.default.sep}dist${node_path.default.sep}`) || modulePath.includes(`${node_path.default.sep}dist-runtime${node_path.default.sep}`)) && [
		".js",
		".mjs",
		".cjs"
	].includes(require_string_coerce.normalizeLowercaseStringOrEmpty(node_path.default.extname(modulePath)));
}
function loadBundledEntryModuleSync(importMetaUrl, specifier, options = {}) {
	const modulePath = resolveBundledEntryModulePath(importMetaUrl, specifier);
	const cached = loadedModuleExports.get(modulePath);
	if (cached !== void 0) return cached;
	let loaded;
	const profile = require_plugin_load_profile.shouldProfilePluginLoader();
	const loadStartMs = profile ? performance.now() : 0;
	let sourceLoaderReadyMs = 0;
	if (canTryNodeRequireBuiltModule(modulePath)) {
		const native = require_plugin_module_loader_cache.tryNativeRequireJavaScriptModule(modulePath, {
			allowWindows: true,
			aliasMap: require_plugin_module_loader_cache.buildPluginLoaderAliasMap(modulePath, process.argv[1], require("url").pathToFileURL(__filename).href, "dist"),
			fallbackOnMissingDependency: true,
			fallbackOnNativeError: true
		});
		if (native.ok) loaded = native.moduleExport;
		else {
			const moduleLoader = getSourceModuleLoader(modulePath, options, true);
			sourceLoaderReadyMs = profile ? performance.now() : 0;
			loaded = moduleLoader(require_plugin_module_loader_cache.toSafeImportPath(modulePath));
		}
	} else {
		const moduleLoader = getSourceModuleLoader(modulePath, options);
		sourceLoaderReadyMs = profile ? performance.now() : 0;
		loaded = moduleLoader(require_plugin_module_loader_cache.toSafeImportPath(modulePath));
	}
	if (profile) {
		const endMs = performance.now();
		console.error(require_plugin_load_profile.formatPluginLoadProfileLine({
			phase: "bundled-entry-module-load",
			pluginId: "(bundled-entry)",
			source: modulePath,
			elapsedMs: endMs - loadStartMs,
			extras: [["sourceLoaderCreateMs", sourceLoaderReadyMs ? sourceLoaderReadyMs - loadStartMs : 0], ["sourceLoaderCallMs", sourceLoaderReadyMs ? endMs - sourceLoaderReadyMs : 0]]
		}));
	}
	loadedModuleExports.set(modulePath, loaded);
	return loaded;
}
/** Loads one export from a bundled channel sidecar module through the guarded entry boundary. */
function loadBundledEntryExportSync(importMetaUrl, reference, options) {
	const loaded = loadBundledEntryModuleSync(importMetaUrl, reference.specifier, options);
	const resolved = loaded && typeof loaded === "object" && "default" in loaded ? loaded.default : loaded;
	if (!reference.exportName) return resolved;
	const record = resolved ?? loaded;
	if (!record || !(reference.exportName in record)) throw new Error(`missing export "${reference.exportName}" from bundled entry module ${reference.specifier}`);
	return record[reference.exportName];
}
/** Defines the full bundled channel entry contract used by core plugin registration. */
function defineBundledChannelEntry({ id, name, description, importMetaUrl, plugin, outbound, secrets, configSchema, runtime, accountInspect, features, registerCliMetadata, registerFull }) {
	const resolvedConfigSchema = typeof configSchema === "function" ? configSchema() : configSchema ?? require_config_schema.emptyChannelConfigSchema();
	const loadChannelPlugin = (options) => loadBundledEntryExportSync(importMetaUrl, plugin, options);
	const loadChannelOutbound = outbound ? (options) => loadBundledEntryExportSync(importMetaUrl, outbound, options) : void 0;
	const loadChannelSecrets = secrets ? (options) => loadBundledEntryExportSync(importMetaUrl, secrets, options) : void 0;
	const loadChannelAccountInspector = accountInspect ? (options) => loadBundledEntryExportSync(importMetaUrl, accountInspect, options) : void 0;
	const setChannelRuntime = runtime ? (pluginRuntime) => {
		loadBundledEntryExportSync(importMetaUrl, runtime)(pluginRuntime);
	} : void 0;
	return {
		kind: "bundled-channel-entry",
		id,
		name,
		description,
		configSchema: resolvedConfigSchema,
		...features || accountInspect ? { features: {
			...features,
			...accountInspect ? { accountInspect: true } : {}
		} } : {},
		register(api) {
			if (api.registrationMode === "cli-metadata") {
				registerCliMetadata?.(api);
				return;
			}
			if (api.registrationMode === "tool-discovery") {
				require_plugin_load_profile.createProfiler({
					pluginId: id,
					source: importMetaUrl
				})("bundled-register:registerFull", () => registerFull?.(api));
				return;
			}
			const profile = require_plugin_load_profile.createProfiler({
				pluginId: id,
				source: importMetaUrl
			});
			const channelPlugin = profile("bundled-register:loadChannelPlugin", loadChannelPlugin);
			profile("bundled-register:registerChannel", () => api.registerChannel({ plugin: channelPlugin }));
			profile("bundled-register:setChannelRuntime", () => setChannelRuntime?.(api.runtime));
			if (api.registrationMode === "discovery") {
				profile("bundled-register:registerCliMetadata", () => registerCliMetadata?.(api));
				return;
			}
			if (api.registrationMode !== "full") return;
			profile("bundled-register:registerCliMetadata", () => registerCliMetadata?.(api));
			profile("bundled-register:registerFull", () => registerFull?.(api));
		},
		loadChannelPlugin,
		...loadChannelOutbound ? { loadChannelOutbound } : {},
		...loadChannelSecrets ? { loadChannelSecrets } : {},
		...loadChannelAccountInspector ? { loadChannelAccountInspector } : {},
		...setChannelRuntime ? { setChannelRuntime } : {}
	};
}
/** Defines the setup-only bundled channel entry contract for onboarding and migration surfaces. */
function defineBundledChannelSetupEntry({ importMetaUrl, plugin, secrets, runtime, legacyStateMigrations, legacySessionSurface, registerSetupRuntime, features }) {
	const setChannelRuntime = runtime ? (pluginRuntime) => {
		loadBundledEntryExportSync(importMetaUrl, runtime)(pluginRuntime);
	} : void 0;
	const loadLegacyStateMigrationDetector = legacyStateMigrations ? (options) => loadBundledEntryExportSync(importMetaUrl, legacyStateMigrations, options) : void 0;
	const loadLegacySessionSurface = legacySessionSurface ? (options) => loadBundledEntryExportSync(importMetaUrl, legacySessionSurface, options) : void 0;
	return {
		kind: "bundled-channel-setup-entry",
		loadSetupPlugin: (options) => loadBundledEntryExportSync(importMetaUrl, plugin, options),
		...secrets ? { loadSetupSecrets: (options) => loadBundledEntryExportSync(importMetaUrl, secrets, options) } : {},
		...loadLegacyStateMigrationDetector ? { loadLegacyStateMigrationDetector } : {},
		...loadLegacySessionSurface ? { loadLegacySessionSurface } : {},
		...setChannelRuntime ? { setChannelRuntime } : {},
		...registerSetupRuntime ? { registerSetupRuntime } : {},
		...features ? { features } : {}
	};
}
//#endregion
Object.defineProperty(exports, "defineBundledChannelEntry", {
	enumerable: true,
	get: function() {
		return defineBundledChannelEntry;
	}
});
Object.defineProperty(exports, "defineBundledChannelSetupEntry", {
	enumerable: true,
	get: function() {
		return defineBundledChannelSetupEntry;
	}
});
