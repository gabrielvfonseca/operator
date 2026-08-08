const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_channel_target = require("./channel-target-Djs5HcPj.cjs");
const require_channel_catalog_registry = require("./channel-catalog-registry-D1BOYOpe.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/channels/plugins/package-state-probes.ts
/**
* Bundled channel package-state probes.
*
* Resolves lightweight configured/auth state checkers from package metadata and source overlays.
*/
const log = require_subsystem.createSubsystemLogger("channels");
const sourcePackageStateLoaderCache = /* @__PURE__ */ new Map();
function isSourceModulePath(modulePath) {
	return /\.(?:c|m)?tsx?$/iu.test(modulePath);
}
function loadChannelPackageStateModule(params) {
	try {
		return require_bundled.loadChannelPluginModule(params);
	} catch (error) {
		if (!isSourceModulePath(params.modulePath)) throw error;
		return require_plugin_module_loader_cache.getCachedPluginModuleLoader({
			cache: sourcePackageStateLoaderCache,
			modulePath: params.modulePath,
			importerUrl: require("url").pathToFileURL(__filename).href,
			tryNative: true,
			cacheScopeKey: "channel-package-state"
		})(params.modulePath);
	}
}
function hasNonEmptyEnvValue(env, key) {
	return typeof env?.[key] === "string" && env[key].trim().length > 0;
}
function resolveSourceBundledPluginRoot(rootDir) {
	const pluginRoot = node_path.default.resolve(rootDir);
	const extensionsDir = node_path.default.dirname(pluginRoot);
	if (node_path.default.basename(extensionsDir) !== "extensions") return null;
	const packageRoot = node_path.default.dirname(extensionsDir);
	if (node_path.default.basename(packageRoot) === "dist" || node_path.default.basename(packageRoot) === "dist-runtime") return null;
	return {
		packageRoot,
		dirName: node_path.default.basename(pluginRoot)
	};
}
function isBundledSourceOverlayPluginRoot(rootDir) {
	const pluginRoot = node_path.default.resolve(rootDir);
	return require_discovery.isBundledSourceOverlayPath({ sourcePath: pluginRoot }) || node_path.default.basename(node_path.default.dirname(pluginRoot)) === "extensions" && require_discovery.isBundledSourceOverlayPath({ sourcePath: node_path.default.dirname(pluginRoot) });
}
function listBuiltBundledPackageStateModules(params) {
	if (isBundledSourceOverlayPluginRoot(params.rootDir)) return [];
	const sourceRoot = resolveSourceBundledPluginRoot(params.rootDir);
	if (!sourceRoot) return [];
	const locations = [];
	for (const rootDir of [node_path.default.join(sourceRoot.packageRoot, "dist", "extensions", sourceRoot.dirName), node_path.default.join(sourceRoot.packageRoot, "dist-runtime", "extensions", sourceRoot.dirName)]) {
		const modulePath = require_bundled.resolveExistingPluginModulePath(rootDir, params.specifier);
		if (node_fs.default.existsSync(modulePath) && !isSourceModulePath(modulePath)) locations.push({
			modulePath,
			rootDir
		});
	}
	return locations;
}
function resolveChannelPackageStateModuleLocation(params) {
	return {
		modulePath: require_bundled.resolveExistingPluginModulePath(params.entry.rootDir, params.specifier),
		rootDir: params.entry.rootDir
	};
}
function listChannelPackageStateModuleLocations(params) {
	const source = resolveChannelPackageStateModuleLocation(params);
	return [...listBuiltBundledPackageStateModules({
		rootDir: params.entry.rootDir,
		specifier: params.specifier
	}).filter((location) => location.modulePath !== source.modulePath), source];
}
function resolveChannelPackageStateMetadata(entry, metadataKey) {
	const metadata = entry.channel[metadataKey];
	if (!metadata || typeof metadata !== "object") return null;
	const specifier = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(metadata.specifier) ?? "";
	const exportName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(metadata.exportName) ?? "";
	const envMetadata = "env" in metadata ? metadata.env : void 0;
	const allOf = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(envMetadata?.allOf);
	const anyOf = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(envMetadata?.anyOf);
	const env = allOf.length > 0 || anyOf.length > 0 ? {
		allOf,
		anyOf
	} : void 0;
	if ((!specifier || !exportName) && !env) return null;
	return {
		...specifier ? { specifier } : {},
		...exportName ? { exportName } : {},
		...env ? { env } : {}
	};
}
function listChannelPackageStateCatalog(metadataKey, discovery) {
	return require_channel_catalog_registry.listChannelCatalogEntries({
		origin: "bundled",
		discovery
	}).filter((entry) => Boolean(resolveChannelPackageStateMetadata(entry, metadataKey)));
}
function resolveChannelPackageStateChecker(params) {
	const metadata = resolveChannelPackageStateMetadata(params.entry, params.metadataKey);
	if (!metadata) return null;
	if (metadata.env) return ({ env }) => {
		const allOf = metadata.env?.allOf ?? [];
		const anyOf = metadata.env?.anyOf ?? [];
		return allOf.every((key) => hasNonEmptyEnvValue(env, key)) && (anyOf.length === 0 || anyOf.some((key) => hasNonEmptyEnvValue(env, key)));
	};
	let loadError;
	for (const location of listChannelPackageStateModuleLocations({
		entry: params.entry,
		specifier: metadata.specifier
	})) try {
		const checker = loadChannelPackageStateModule({
			modulePath: location.modulePath,
			rootDir: location.rootDir
		})[metadata.exportName];
		if (typeof checker !== "function") throw new Error(`missing ${params.metadataKey} export ${metadata.exportName}`);
		return checker;
	} catch (error) {
		loadError = error;
	}
	if (loadError) {
		const detail = require_errors.formatErrorMessage(loadError);
		log.warn(`[channels] failed to load ${params.metadataKey} checker for ${params.entry.pluginId}: ${detail}`);
	}
	return null;
}
function resolvePackageStateChannelId(entry) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.channel.id);
}
/**
* Lists bundled channel ids that declare the requested package-state metadata.
*/
function listBundledChannelIdsForPackageState(metadataKey, discovery) {
	return listChannelPackageStateCatalog(metadataKey, discovery).map((entry) => resolvePackageStateChannelId(entry)).filter((channelId) => Boolean(channelId)).toSorted((left, right) => left.localeCompare(right));
}
/**
* Returns whether a bundled channel reports configured/auth package state.
*/
function hasBundledChannelPackageState(params) {
	const requestedChannelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channelId);
	const entry = listChannelPackageStateCatalog(params.metadataKey, params.discovery).find((candidate) => resolvePackageStateChannelId(candidate) === requestedChannelId);
	if (!entry) return false;
	const checker = resolveChannelPackageStateChecker({
		entry,
		metadataKey: params.metadataKey
	});
	return checker ? checker({
		cfg: params.cfg,
		env: params.env
	}) : false;
}
//#endregion
//#region src/channels/plugins/persisted-auth-state.ts
/**
* Lists bundled channels that declare persisted-auth state metadata.
*/
function listBundledChannelIdsWithPersistedAuthState(discovery) {
	return listBundledChannelIdsForPackageState("persistedAuthState", discovery);
}
/**
* Returns whether a bundled channel reports persisted auth state.
*/
function hasBundledChannelPersistedAuthState(params) {
	return hasBundledChannelPackageState({
		metadataKey: "persistedAuthState",
		channelId: params.channelId,
		cfg: params.cfg,
		env: params.env,
		discovery: params.discovery
	});
}
//#endregion
//#region src/channels/plugins/bundled-ids.ts
/**
* Bundled channel id listing helpers.
*
* Reads generated channel catalog entries for current package/cache scope.
*/
/**
* Lists bundled channel ids for a package root/cache scope.
*/
function listBundledChannelIdsForRoot(_packageRoot, env = process.env, discovery) {
	return require_channel_catalog_registry.listChannelCatalogEntries({
		origin: "bundled",
		env,
		discovery
	}).map((entry) => entry.channel.id).filter((channelId) => Boolean(channelId)).toSorted((left, right) => left.localeCompare(right));
}
/**
* Lists bundled channel ids for the current runtime root scope.
*/
function listBundledChannelIds(env = process.env, discovery) {
	return listBundledChannelIdsForRoot(require_bundled.resolveBundledChannelRootScope(env).cacheKey, env, discovery);
}
//#endregion
//#region src/channels/config-presence.ts
/**
* Channel configuration presence detection.
*
* Finds channels made available by config, env, persisted auth, or plugin discovery signals.
*/
const IGNORED_CHANNEL_CONFIG_KEYS = /* @__PURE__ */ new Set(["defaults", "modelByChannel"]);
/** Returns true when a channel config entry contains settings beyond enabled/disabled state. */
function hasMeaningfulChannelConfig(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	return Object.keys(value).some((key) => key !== "enabled");
}
/** Lists channels explicitly disabled in config so activation logic can suppress auto-detection. */
function listExplicitlyDisabledChannelIdsForConfig(cfg) {
	const channels = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.channels) ? cfg.channels : null;
	if (!channels) return [];
	return Object.entries(channels).filter(([, value]) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && value.enabled === false).map(([channelId]) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId)).filter((channelId) => Boolean(channelId));
}
function listChannelEnvPrefixes(channelIds) {
	return channelIds.map((channelId) => [`${channelId.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}_`, channelId]);
}
function hasPersistedChannelState(env) {
	return node_fs.default.existsSync(require_paths.resolveStateDir(env, node_os.default.homedir));
}
let persistedAuthStateChannelIds = null;
function listPersistedAuthStateChannelIds(options) {
	const override = options.persistedAuthStateProbe?.listChannelIds();
	if (override) return override;
	if (options.discovery) return listBundledChannelIdsWithPersistedAuthState(options.discovery);
	if (persistedAuthStateChannelIds) return persistedAuthStateChannelIds;
	persistedAuthStateChannelIds = listBundledChannelIdsWithPersistedAuthState();
	return persistedAuthStateChannelIds;
}
function hasPersistedAuthState(params) {
	const override = params.options.persistedAuthStateProbe;
	if (override) return override.hasState(params);
	return hasBundledChannelPersistedAuthState({
		channelId: params.channelId,
		cfg: params.cfg,
		env: params.env,
		discovery: params.options.discovery
	});
}
/** Lists channel ids detected from config, env vars, or persisted auth state. */
function listPotentialConfiguredChannelIds(cfg, env = process.env, options = {}) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(listPotentialConfiguredChannelPresenceSignals(cfg, env, options).map((signal) => signal.channelId));
}
/** Lists deduplicated channel presence signals with their detection source. */
function listPotentialConfiguredChannelPresenceSignals(cfg, env = process.env, options = {}) {
	const signals = [];
	const seenSignals = /* @__PURE__ */ new Set();
	const addSignal = (channelId, source) => {
		const key = `${source}:${channelId}`;
		if (seenSignals.has(key)) return;
		seenSignals.add(key);
		signals.push({
			channelId,
			source
		});
	};
	const configuredChannelIds = /* @__PURE__ */ new Set();
	const channelEnvPrefixes = listChannelEnvPrefixes(options.channelIds ?? listBundledChannelIds(env, options.discovery));
	const scopedChannelIds = options.channelIds ? new Set(options.channelIds.map((channelId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId)).filter((channelId) => Boolean(channelId))) : void 0;
	const officialExternalChannelEnvVars = require_official_external_plugin_catalog.listOfficialExternalChannelEnvVars().filter(({ channelId }) => !scopedChannelIds || scopedChannelIds.has(channelId));
	const channels = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.channels) ? cfg.channels : null;
	if (channels) for (const [key, value] of Object.entries(channels)) {
		if (IGNORED_CHANNEL_CONFIG_KEYS.has(key)) continue;
		if (hasMeaningfulChannelConfig(value)) {
			configuredChannelIds.add(key);
			addSignal(key, "config");
		}
	}
	for (const [key, value] of Object.entries(env)) {
		if (!require_channel_target.hasNonEmptyString(value)) continue;
		for (const [prefix, channelId] of channelEnvPrefixes) if (key.startsWith(prefix)) {
			configuredChannelIds.add(channelId);
			addSignal(channelId, "env");
		}
		for (const { channelId, envVars } of officialExternalChannelEnvVars) if (envVars.includes(key)) {
			configuredChannelIds.add(channelId);
			addSignal(channelId, "env");
		}
	}
	if (options.includePersistedAuthState !== false && hasPersistedChannelState(env)) {
		for (const channelId of listPersistedAuthStateChannelIds(options)) if (hasPersistedAuthState({
			channelId,
			cfg,
			env,
			options
		})) {
			configuredChannelIds.add(channelId);
			addSignal(channelId, "persisted-auth");
		}
	}
	return signals.filter((signal) => configuredChannelIds.has(signal.channelId));
}
//#endregion
Object.defineProperty(exports, "hasBundledChannelPackageState", {
	enumerable: true,
	get: function() {
		return hasBundledChannelPackageState;
	}
});
Object.defineProperty(exports, "hasMeaningfulChannelConfig", {
	enumerable: true,
	get: function() {
		return hasMeaningfulChannelConfig;
	}
});
Object.defineProperty(exports, "listBundledChannelIdsForPackageState", {
	enumerable: true,
	get: function() {
		return listBundledChannelIdsForPackageState;
	}
});
Object.defineProperty(exports, "listExplicitlyDisabledChannelIdsForConfig", {
	enumerable: true,
	get: function() {
		return listExplicitlyDisabledChannelIdsForConfig;
	}
});
Object.defineProperty(exports, "listPotentialConfiguredChannelIds", {
	enumerable: true,
	get: function() {
		return listPotentialConfiguredChannelIds;
	}
});
Object.defineProperty(exports, "listPotentialConfiguredChannelPresenceSignals", {
	enumerable: true,
	get: function() {
		return listPotentialConfiguredChannelPresenceSignals;
	}
});
