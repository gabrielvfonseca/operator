const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./json-files-Bp0Z4DKb.cjs");
require("./path-safety-m1VY3jod.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_plugin_metadata_lifecycle = require("./plugin-metadata-lifecycle-L5oN3AE5.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_roots = require("./roots-5HJCnp4q.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_provider_model_id_normalization = require("@gabrielvfonseca/model-catalog-core/provider-model-id-normalization");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/plugins/manifest-registry-installed.ts
/** Builds manifest registry records from installed plugin index snapshots. */
const installedManifestRegistryIndexFingerprintCache = /* @__PURE__ */ new WeakMap();
const installedPackageJsonPathCache = /* @__PURE__ */ new Map();
const installedPackageMetadataCache = /* @__PURE__ */ new Map();
const installedManifestRegistryRealpathCache = /* @__PURE__ */ new Map();
const MAX_INSTALLED_PACKAGE_JSON_PATH_CACHE_ENTRIES = 256;
const MAX_INSTALLED_PACKAGE_METADATA_CACHE_ENTRIES = 256;
const MAX_INSTALLED_MANIFEST_REGISTRY_REALPATH_CACHE_ENTRIES = 512;
function clearInstalledManifestRegistryProcessCaches() {
	installedPackageJsonPathCache.clear();
	installedPackageMetadataCache.clear();
	installedManifestRegistryRealpathCache.clear();
}
require_plugin_metadata_lifecycle.registerPluginMetadataProcessMemoLifecycleClear(clearInstalledManifestRegistryProcessCaches);
function isDeepFrozenJsonLike(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (!value || typeof value !== "object") return true;
	const object = value;
	if (seen.has(object)) return true;
	if (!Object.isFrozen(object)) return false;
	seen.add(object);
	return Object.values(value).every((entry) => isDeepFrozenJsonLike(entry, seen));
}
function hasPersistedFileSignatures(index) {
	return index.plugins.every((record) => record.manifestFile !== void 0 && (record.packageJson === void 0 || record.packageJson.fileSignature !== void 0));
}
function isInstalledManifestRegistryIndexFingerprintCacheable(index) {
	return hasPersistedFileSignatures(index) && isDeepFrozenJsonLike(index);
}
function isRelativePathInsideOrEqual(relativePath) {
	return relativePath === "" || relativePath !== ".." && !relativePath.startsWith(`..${node_path.default.sep}`) && !node_path.default.isAbsolute(relativePath);
}
function resolvePackageJsonPath(record, realpathCache) {
	if (!record.packageJson?.path) return;
	const cacheKey = buildInstalledPackageJsonPathCacheKey(record);
	if (cacheKey) {
		const cached = installedPackageJsonPathCache.get(cacheKey);
		if (cached !== void 0) return cached ?? void 0;
	}
	const rootDir = resolveInstalledPluginRootDir(record);
	const realRootDir = (0, _openclaw_fs_safe_path.safeRealpathSync)(rootDir, realpathCache) ?? node_path.default.resolve(rootDir);
	const packageJsonPath = node_path.default.resolve(realRootDir, record.packageJson.path);
	if (!isRelativePathInsideOrEqual(node_path.default.relative(realRootDir, packageJsonPath))) return rememberInstalledPackageJsonPath(cacheKey, void 0);
	const packageJsonRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(packageJsonPath, realpathCache);
	if (!packageJsonRealPath || !(0, _openclaw_fs_safe_path.isPathInside)(realRootDir, packageJsonRealPath)) return rememberInstalledPackageJsonPath(cacheKey, void 0);
	return rememberInstalledPackageJsonPath(cacheKey, packageJsonPath);
}
function safeFileSignature(filePath) {
	if (!filePath) return;
	try {
		return formatFileSignature(filePath, node_fs.default.statSync(filePath));
	} catch {
		return `${filePath}:missing`;
	}
}
function formatFileSignature(filePath, signature) {
	return `${filePath}:${signature.size}:${signature.mtimeMs}`;
}
function rememberInstalledPackageMetadata(key, metadata) {
	if (!key) return metadata;
	installedPackageMetadataCache.set(key, metadata);
	while (installedPackageMetadataCache.size > MAX_INSTALLED_PACKAGE_METADATA_CACHE_ENTRIES) {
		const oldest = installedPackageMetadataCache.keys().next().value;
		if (oldest === void 0) break;
		installedPackageMetadataCache.delete(oldest);
	}
	return metadata;
}
function rememberInstalledPackageJsonPath(key, packageJsonPath) {
	if (!key) return packageJsonPath;
	installedPackageJsonPathCache.set(key, packageJsonPath ?? null);
	while (installedPackageJsonPathCache.size > MAX_INSTALLED_PACKAGE_JSON_PATH_CACHE_ENTRIES) {
		const oldest = installedPackageJsonPathCache.keys().next().value;
		if (oldest === void 0) break;
		installedPackageJsonPathCache.delete(oldest);
	}
	return packageJsonPath;
}
function trimInstalledManifestRegistryRealpathCache() {
	while (installedManifestRegistryRealpathCache.size > MAX_INSTALLED_MANIFEST_REGISTRY_REALPATH_CACHE_ENTRIES) {
		const oldest = installedManifestRegistryRealpathCache.keys().next().value;
		if (oldest === void 0) break;
		installedManifestRegistryRealpathCache.delete(oldest);
	}
}
function buildInstalledPackageJsonPathCacheKey(record) {
	if (!record.packageJson?.path || !record.packageJson.hash) return;
	return require_installed_plugin_index.hashJson({
		rootDir: node_path.default.resolve(resolveInstalledPluginRootDir(record)),
		packageJson: record.packageJson
	});
}
function buildInstalledPackageMetadataCacheKey(params) {
	if (!params.packageJsonPath || !params.record.packageJson?.hash) return;
	return require_installed_plugin_index.hashJson({
		packageJsonPath: node_path.default.resolve(params.packageJsonPath),
		packageJson: params.record.packageJson,
		packageChannel: params.record.packageChannel ?? null
	});
}
function buildInstalledManifestRegistryIndexKey(index) {
	return {
		version: index.version,
		hostContractVersion: index.hostContractVersion,
		compatRegistryVersion: index.compatRegistryVersion,
		migrationVersion: index.migrationVersion,
		policyHash: index.policyHash,
		installRecords: index.installRecords,
		diagnostics: index.diagnostics,
		plugins: index.plugins.map((record) => {
			const packageJsonPath = resolvePackageJsonPath(record, installedManifestRegistryRealpathCache);
			trimInstalledManifestRegistryRealpathCache();
			const packageJsonFile = record.packageJson?.fileSignature ? packageJsonPath ? formatFileSignature(packageJsonPath, record.packageJson.fileSignature) : void 0 : safeFileSignature(packageJsonPath);
			return {
				pluginId: record.pluginId,
				packageName: record.packageName,
				packageVersion: record.packageVersion,
				installRecord: record.installRecord,
				installRecordHash: record.installRecordHash,
				packageInstall: record.packageInstall,
				packageChannel: record.packageChannel,
				manifestPath: record.manifestPath,
				manifestHash: record.manifestHash,
				manifestFile: record.manifestFile ? formatFileSignature(record.manifestPath, record.manifestFile) : safeFileSignature(record.manifestPath),
				format: record.format,
				bundleFormat: record.bundleFormat,
				source: record.source,
				setupSource: record.setupSource,
				packageJson: record.packageJson,
				packageJsonFile,
				rootDir: record.rootDir,
				origin: record.origin,
				enabled: record.enabled,
				enabledByDefault: record.enabledByDefault,
				enabledByDefaultOnPlatforms: record.enabledByDefaultOnPlatforms ? [...record.enabledByDefaultOnPlatforms] : void 0,
				syntheticAuthRefs: record.syntheticAuthRefs,
				startup: record.startup,
				compat: record.compat
			};
		})
	};
}
function resolveInstalledManifestRegistryIndexFingerprint(index) {
	const cached = installedManifestRegistryIndexFingerprintCache.get(index);
	if (cached) return cached;
	const fingerprint = require_installed_plugin_index.hashJson(buildInstalledManifestRegistryIndexKey(index));
	if (isInstalledManifestRegistryIndexFingerprintCacheable(index)) installedManifestRegistryIndexFingerprintCache.set(index, fingerprint);
	return fingerprint;
}
function resolveInstalledPluginRootDir(record) {
	return record.rootDir || node_path.default.dirname(record.manifestPath || process.cwd());
}
function resolveFallbackPluginSource(record) {
	const rootDir = resolveInstalledPluginRootDir(record);
	for (const entry of require_manifest.DEFAULT_PLUGIN_ENTRY_CANDIDATES) {
		const candidate = node_path.default.join(rootDir, entry);
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	return node_path.default.join(rootDir, require_manifest.DEFAULT_PLUGIN_ENTRY_CANDIDATES[0]);
}
function normalizePackageChannelExposure(exposure) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(exposure)) return;
	const configured = typeof exposure.configured === "boolean" ? exposure.configured : void 0;
	const setup = typeof exposure.setup === "boolean" ? exposure.setup : void 0;
	const docs = typeof exposure.docs === "boolean" ? exposure.docs : void 0;
	return configured !== void 0 || setup !== void 0 || docs !== void 0 ? {
		...configured !== void 0 ? { configured } : {},
		...setup !== void 0 ? { setup } : {},
		...docs !== void 0 ? { docs } : {}
	} : void 0;
}
function normalizePackageChannelConfiguredState(configuredState) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(configuredState)) return;
	const env = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(configuredState.env) ? {
		...(0, _gabrielvfonseca_normalization_core_string_normalization.normalizeOptionalTrimmedStringList)(configuredState.env.allOf)?.length ? { allOf: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeOptionalTrimmedStringList)(configuredState.env.allOf) } : {},
		...(0, _gabrielvfonseca_normalization_core_string_normalization.normalizeOptionalTrimmedStringList)(configuredState.env.anyOf)?.length ? { anyOf: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeOptionalTrimmedStringList)(configuredState.env.anyOf) } : {}
	} : void 0;
	const specifier = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configuredState.specifier);
	const exportName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configuredState.exportName);
	return specifier || exportName || env && Object.keys(env).length > 0 ? {
		...specifier ? { specifier } : {},
		...exportName ? { exportName } : {},
		...env && Object.keys(env).length > 0 ? { env } : {}
	} : void 0;
}
function normalizePackageChannelPersistedAuthState(persistedAuthState) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(persistedAuthState)) return;
	const specifier = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(persistedAuthState.specifier);
	const exportName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(persistedAuthState.exportName);
	return specifier || exportName ? {
		...specifier ? { specifier } : {},
		...exportName ? { exportName } : {}
	} : void 0;
}
function normalizePackageChannelDoctorCapabilities(doctorCapabilities) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(doctorCapabilities)) return;
	const dmAllowFromMode = doctorCapabilities.dmAllowFromMode === "topOnly" || doctorCapabilities.dmAllowFromMode === "topOrNested" || doctorCapabilities.dmAllowFromMode === "nestedOnly" ? doctorCapabilities.dmAllowFromMode : void 0;
	const groupModel = doctorCapabilities.groupModel === "sender" || doctorCapabilities.groupModel === "route" || doctorCapabilities.groupModel === "hybrid" ? doctorCapabilities.groupModel : void 0;
	const groupAllowFromFallbackToAllowFrom = typeof doctorCapabilities.groupAllowFromFallbackToAllowFrom === "boolean" ? doctorCapabilities.groupAllowFromFallbackToAllowFrom : void 0;
	const warnOnEmptyGroupSenderAllowlist = typeof doctorCapabilities.warnOnEmptyGroupSenderAllowlist === "boolean" ? doctorCapabilities.warnOnEmptyGroupSenderAllowlist : void 0;
	return dmAllowFromMode || groupModel || groupAllowFromFallbackToAllowFrom !== void 0 || warnOnEmptyGroupSenderAllowlist !== void 0 ? {
		...dmAllowFromMode ? { dmAllowFromMode } : {},
		...groupModel ? { groupModel } : {},
		...groupAllowFromFallbackToAllowFrom !== void 0 ? { groupAllowFromFallbackToAllowFrom } : {},
		...warnOnEmptyGroupSenderAllowlist !== void 0 ? { warnOnEmptyGroupSenderAllowlist } : {}
	} : void 0;
}
function normalizePackageChannelCliOptions(cliAddOptions) {
	if (!Array.isArray(cliAddOptions)) return;
	const normalized = cliAddOptions.flatMap((option) => {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(option)) return [];
		const flags = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(option.flags);
		const description = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(option.description);
		if (!flags || !description) return [];
		const defaultValue = typeof option.defaultValue === "boolean" || typeof option.defaultValue === "string" ? option.defaultValue : void 0;
		return [{
			flags,
			description,
			...defaultValue !== void 0 ? { defaultValue } : {}
		}];
	});
	return normalized.length > 0 ? normalized : void 0;
}
function normalizePersistedPackageChannel(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.id);
	if (!id) return;
	const channel = { id };
	for (const key of [
		"label",
		"selectionLabel",
		"detailLabel",
		"docsPath",
		"docsLabel",
		"blurb",
		"systemImage",
		"selectionDocsPrefix"
	]) {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value[key]);
		if (normalized) channel[key] = normalized;
	}
	if (typeof value.order === "number" && Number.isFinite(value.order)) channel.order = value.order;
	for (const key of [
		"aliases",
		"preferOver",
		"selectionExtras"
	]) {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeOptionalTrimmedStringList)(value[key]);
		if (normalized?.length) channel[key] = normalized;
	}
	for (const key of [
		"selectionDocsOmitLabel",
		"markdownCapable",
		"showConfigured",
		"showInSetup",
		"quickstartAllowFrom",
		"forceAccountBinding",
		"preferSessionLookupForAnnounceTarget"
	]) if (typeof value[key] === "boolean") channel[key] = value[key];
	const exposure = normalizePackageChannelExposure(value.exposure);
	if (exposure) channel.exposure = exposure;
	const commands = require_manifest.normalizeManifestChannelCommandDefaults(value.commands);
	if (commands) channel.commands = commands;
	const configuredState = normalizePackageChannelConfiguredState(value.configuredState);
	if (configuredState) channel.configuredState = configuredState;
	const persistedAuthState = normalizePackageChannelPersistedAuthState(value.persistedAuthState);
	if (persistedAuthState) channel.persistedAuthState = persistedAuthState;
	const doctorCapabilities = normalizePackageChannelDoctorCapabilities(value.doctorCapabilities);
	if (doctorCapabilities) channel.doctorCapabilities = doctorCapabilities;
	const cliAddOptions = normalizePackageChannelCliOptions(value.cliAddOptions);
	if (cliAddOptions) channel.cliAddOptions = cliAddOptions;
	return channel;
}
function resolveInstalledPackageMetadata(record, realpathCache) {
	const recordPackageChannel = normalizePersistedPackageChannel(record.packageChannel);
	const fallbackPackageManifest = recordPackageChannel ? { channel: recordPackageChannel } : void 0;
	const packageJsonPath = record.packageJson?.path ? resolvePackageJsonPath(record, realpathCache) : void 0;
	const cacheKey = buildInstalledPackageMetadataCacheKey({
		packageJsonPath,
		record
	});
	const cached = cacheKey ? installedPackageMetadataCache.get(cacheKey) : void 0;
	if (cached) return cached;
	if (!packageJsonPath) return rememberInstalledPackageMetadata(cacheKey, fallbackPackageManifest ? { packageManifest: fallbackPackageManifest } : {});
	const packageJson = (0, _openclaw_fs_safe_json.tryReadJsonSync)(packageJsonPath);
	if (packageJson) {
		const packageManifest = require_manifest.getPackageManifestMetadata(packageJson);
		const dependencies = require_discovery.normalizePluginDependencySpecs({
			dependencies: packageJson.dependencies,
			optionalDependencies: packageJson.optionalDependencies
		});
		if (!packageManifest) return rememberInstalledPackageMetadata(cacheKey, {
			...fallbackPackageManifest ? { packageManifest: fallbackPackageManifest } : {},
			packageDependencies: dependencies.dependencies,
			packageOptionalDependencies: dependencies.optionalDependencies
		});
		const packageChannel = normalizePersistedPackageChannel(packageManifest.channel);
		const channel = recordPackageChannel || packageChannel ? {
			...recordPackageChannel,
			...packageChannel
		} : void 0;
		const { channel: _ignoredChannel, ...packageManifestWithoutChannel } = packageManifest;
		return rememberInstalledPackageMetadata(cacheKey, {
			packageManifest: {
				...packageManifestWithoutChannel,
				...channel ? { channel } : {}
			},
			packageDependencies: dependencies.dependencies,
			packageOptionalDependencies: dependencies.optionalDependencies
		});
	}
	return rememberInstalledPackageMetadata(cacheKey, fallbackPackageManifest ? { packageManifest: fallbackPackageManifest } : {});
}
function toPluginCandidate(record, realpathCache) {
	const rootDir = resolveInstalledPluginRootDir(record);
	const packageMetadata = resolveInstalledPackageMetadata(record, realpathCache);
	return {
		idHint: record.pluginId,
		source: record.source ?? resolveFallbackPluginSource(record),
		...record.setupSource ? { setupSource: record.setupSource } : {},
		rootDir,
		origin: record.origin,
		...record.format ? { format: record.format } : {},
		...record.bundleFormat ? { bundleFormat: record.bundleFormat } : {},
		...record.packageName ? { packageName: record.packageName } : {},
		...record.packageVersion ? { packageVersion: record.packageVersion } : {},
		...packageMetadata.packageManifest ? { packageManifest: packageMetadata.packageManifest } : {},
		...packageMetadata.packageDependencies ? { packageDependencies: packageMetadata.packageDependencies } : {},
		...packageMetadata.packageOptionalDependencies ? { packageOptionalDependencies: packageMetadata.packageOptionalDependencies } : {},
		packageDir: rootDir
	};
}
function loadPluginManifestRegistryForInstalledIndex(params) {
	return require_discovery.tracePluginLifecyclePhase("manifest registry", () => {
		if (params.pluginIds && params.pluginIds.length === 0) return {
			plugins: [],
			diagnostics: []
		};
		const env = params.env ?? process.env;
		const pluginIdSet = params.pluginIds?.length ? new Set(params.pluginIds) : null;
		const realpathCache = /* @__PURE__ */ new Map();
		const diagnostics = pluginIdSet ? params.index.diagnostics.filter((diagnostic) => {
			const pluginId = diagnostic.pluginId;
			return !pluginId || pluginIdSet.has(pluginId);
		}) : params.index.diagnostics;
		const candidates = params.index.plugins.filter((plugin) => params.includeDisabled || plugin.enabled).filter((plugin) => !pluginIdSet || pluginIdSet.has(plugin.pluginId)).map((plugin) => toPluginCandidate(plugin, realpathCache));
		return require_manifest_registry.loadPluginManifestRegistry({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env,
			candidates,
			diagnostics: [...diagnostics],
			installRecords: require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(params.index),
			...params.bundledChannelConfigCollector ? { bundledChannelConfigCollector: params.bundledChannelConfigCollector } : {}
		});
	}, {
		includeDisabled: params.includeDisabled === true,
		pluginIdCount: params.pluginIds?.length,
		indexPluginCount: params.index.plugins.length
	});
}
//#endregion
//#region src/plugins/plugin-control-plane-context.ts
function resolveConfiguredPluginLoadPaths(config) {
	const paths = config?.plugins?.load?.paths;
	return Array.isArray(paths) ? paths : void 0;
}
/** Resolves plugin discovery roots and load paths for cache/fingerprint callers. */
function resolvePluginDiscoveryContext(params = {}) {
	return require_roots.resolvePluginCacheInputs({
		env: params.env ?? process.env,
		workspaceDir: params.workspaceDir,
		loadPaths: [...params.loadPaths ?? resolveConfiguredPluginLoadPaths(params.config) ?? []]
	});
}
/** Hashes an already resolved plugin discovery context. */
function fingerprintPluginDiscoveryContext(context) {
	return require_installed_plugin_index.hashJson(context);
}
/** Resolves all inputs that determine plugin control-plane activation state. */
function resolvePluginControlPlaneContext(params = {}) {
	const inventoryFingerprint = params.inventoryFingerprint ?? (params.index ? resolveInstalledManifestRegistryIndexFingerprint(params.index) : void 0);
	return {
		discovery: resolvePluginDiscoveryContext(params),
		policyFingerprint: params.policyHash ?? require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(params.config),
		...inventoryFingerprint ? { inventoryFingerprint } : {},
		...params.activationFingerprint ? { activationFingerprint: params.activationFingerprint } : {}
	};
}
/** Resolves a stable fingerprint for plugin control-plane activation state. */
function resolvePluginControlPlaneFingerprint(params = {}) {
	return fingerprintPluginControlPlaneContext(resolvePluginControlPlaneContext(params));
}
function fingerprintPluginControlPlaneContext(context) {
	return require_installed_plugin_index.hashJson(context);
}
//#endregion
//#region src/plugins/plugin-scope.ts
/** Normalizes plugin id scope input into a sorted unique string list. */
function normalizePluginIdScope(ids) {
	if (ids === void 0) return;
	return Array.from(new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(ids.filter((id) => typeof id === "string")))).toSorted();
}
/** True when plugin scope was explicitly provided, including an empty scope. */
function hasExplicitPluginIdScope(ids) {
	return ids !== void 0;
}
/** True when plugin scope was explicitly provided with at least one id. */
function hasNonEmptyPluginIdScope(ids) {
	return ids !== void 0 && ids.length > 0;
}
/** Creates a lookup set for explicit plugin scope, or null when unscoped. */
function createPluginIdScopeSet(ids) {
	if (ids === void 0) return null;
	return new Set(ids);
}
/** Serializes plugin scope for cache keys. */
function serializePluginIdScope(ids) {
	return ids === void 0 ? "__unscoped__" : JSON.stringify(ids);
}
//#endregion
//#region src/plugins/current-plugin-metadata-snapshot.ts
/** Tracks the current plugin metadata snapshot for control-plane lookups. */
let currentPluginMetadataConfigIdentityCache = /* @__PURE__ */ new WeakSet();
require_plugin_metadata_lifecycle.registerPluginMetadataProcessMemoLifecycleClear(() => {
	(0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.setCurrentManifestModelIdNormalizationRecords)(void 0);
});
function resolvePluginMetadataControlPlaneFingerprint(config, options = {}) {
	return resolvePluginControlPlaneFingerprint({
		config,
		...options
	});
}
function isReusableCurrentPluginMetadataSnapshot(_snapshot) {
	return true;
}
function setCurrentPluginMetadataSnapshot(snapshot, options = {}) {
	currentPluginMetadataConfigIdentityCache = /* @__PURE__ */ new WeakSet();
	const compatiblePolicyHashes = snapshot ? options.compatibleConfigs?.map((config) => require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(config)) : void 0;
	const compatibleConfigFingerprints = snapshot ? options.compatibleConfigs?.map((config, index) => resolvePluginMetadataControlPlaneFingerprint(config, {
		env: options.env,
		index: snapshot.index,
		policyHash: compatiblePolicyHashes?.[index],
		workspaceDir: options.workspaceDir ?? snapshot.workspaceDir
	})) : void 0;
	const configFingerprint = snapshot ? resolvePluginMetadataControlPlaneFingerprint(options.config, {
		env: options.env,
		index: snapshot.index,
		policyHash: snapshot.policyHash,
		workspaceDir: options.workspaceDir ?? snapshot.workspaceDir
	}) : void 0;
	const defaultDiscoveryConfigFingerprint = snapshot ? resolvePluginMetadataControlPlaneFingerprint({}, {
		env: options.env,
		index: snapshot.index,
		policyHash: snapshot.policyHash,
		workspaceDir: options.workspaceDir ?? snapshot.workspaceDir
	}) : void 0;
	(0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.setCurrentManifestModelIdNormalizationRecords)(snapshot && defaultDiscoveryConfigFingerprint && (configFingerprint === defaultDiscoveryConfigFingerprint || snapshot.configFingerprint === defaultDiscoveryConfigFingerprint || Boolean(compatibleConfigFingerprints?.includes(defaultDiscoveryConfigFingerprint))) ? snapshot.plugins : void 0);
	require_plugin_metadata_lifecycle.setCurrentPluginMetadataSnapshotState(snapshot, configFingerprint, compatiblePolicyHashes, compatibleConfigFingerprints);
	if (!snapshot) return;
	if (options.config) {
		const policyHash = require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(options.config);
		if (policyHash === snapshot.policyHash || compatiblePolicyHashes?.includes(policyHash)) currentPluginMetadataConfigIdentityCache.add(options.config);
	}
	for (const config of options.compatibleConfigs ?? []) currentPluginMetadataConfigIdentityCache.add(config);
}
function clearCurrentPluginMetadataSnapshot() {
	currentPluginMetadataConfigIdentityCache = /* @__PURE__ */ new WeakSet();
	(0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.setCurrentManifestModelIdNormalizationRecords)(void 0);
	require_plugin_metadata_lifecycle.clearCurrentPluginMetadataSnapshotState();
}
function getCurrentPluginMetadataSnapshot(params = {}) {
	const { snapshot: rawSnapshot, configFingerprint, compatiblePolicyHashes, compatibleConfigFingerprints } = require_plugin_metadata_lifecycle.getCurrentPluginMetadataSnapshotState();
	const snapshot = rawSnapshot;
	if (!snapshot) return;
	const env = params.env ?? process.env;
	const requestedPluginIds = normalizePluginIdScope(params.pluginIds ?? params.pluginIdScope?.resolve({ index: snapshot.index }));
	const snapshotPluginIds = normalizePluginIdScope(snapshot.pluginIds);
	if (requestedPluginIds !== void 0 && serializePluginIdScope(snapshotPluginIds) !== serializePluginIdScope(requestedPluginIds)) return;
	if (snapshotPluginIds !== void 0 && requestedPluginIds === void 0 && params.allowScopedSnapshot !== true) return;
	const requestedWorkspaceDir = params.workspaceDir ?? (params.allowWorkspaceScopedSnapshot === true ? snapshot.workspaceDir : void 0);
	if (snapshot.workspaceDir !== void 0 && requestedWorkspaceDir === void 0) return;
	if (requestedWorkspaceDir !== void 0 && (snapshot.workspaceDir ?? "") !== (requestedWorkspaceDir ?? "")) return;
	const canReuseCachedConfig = Boolean(params.config && currentPluginMetadataConfigIdentityCache.has(params.config));
	if (canReuseCachedConfig && params.requireDefaultDiscoveryContext !== true) return snapshot;
	const requestedPolicyHash = params.config && !canReuseCachedConfig ? require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(params.config) : void 0;
	if (requestedPolicyHash && snapshot.policyHash !== requestedPolicyHash) {
		if (!compatiblePolicyHashes?.includes(requestedPolicyHash)) return;
	}
	if (params.config && !canReuseCachedConfig) {
		const requestedConfigFingerprint = resolvePluginMetadataControlPlaneFingerprint(params.config, {
			env,
			index: snapshot.index,
			policyHash: requestedPolicyHash,
			workspaceDir: requestedWorkspaceDir
		});
		if (!(configFingerprint === requestedConfigFingerprint || snapshot.configFingerprint === requestedConfigFingerprint || Boolean(compatibleConfigFingerprints?.includes(requestedConfigFingerprint)))) return;
	}
	if (params.requireDefaultDiscoveryContext === true) {
		const defaultDiscoveryConfigFingerprint = resolvePluginMetadataControlPlaneFingerprint({}, {
			env: params.env,
			index: snapshot.index,
			policyHash: snapshot.policyHash,
			workspaceDir: requestedWorkspaceDir
		});
		if (!(configFingerprint === defaultDiscoveryConfigFingerprint || snapshot.configFingerprint === defaultDiscoveryConfigFingerprint || Boolean(compatibleConfigFingerprints?.includes(defaultDiscoveryConfigFingerprint)))) return;
	}
	return snapshot;
}
//#endregion
Object.defineProperty(exports, "clearCurrentPluginMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return clearCurrentPluginMetadataSnapshot;
	}
});
Object.defineProperty(exports, "createPluginIdScopeSet", {
	enumerable: true,
	get: function() {
		return createPluginIdScopeSet;
	}
});
Object.defineProperty(exports, "fingerprintPluginDiscoveryContext", {
	enumerable: true,
	get: function() {
		return fingerprintPluginDiscoveryContext;
	}
});
Object.defineProperty(exports, "getCurrentPluginMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return getCurrentPluginMetadataSnapshot;
	}
});
Object.defineProperty(exports, "hasExplicitPluginIdScope", {
	enumerable: true,
	get: function() {
		return hasExplicitPluginIdScope;
	}
});
Object.defineProperty(exports, "hasNonEmptyPluginIdScope", {
	enumerable: true,
	get: function() {
		return hasNonEmptyPluginIdScope;
	}
});
Object.defineProperty(exports, "isReusableCurrentPluginMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return isReusableCurrentPluginMetadataSnapshot;
	}
});
Object.defineProperty(exports, "loadPluginManifestRegistryForInstalledIndex", {
	enumerable: true,
	get: function() {
		return loadPluginManifestRegistryForInstalledIndex;
	}
});
Object.defineProperty(exports, "normalizePluginIdScope", {
	enumerable: true,
	get: function() {
		return normalizePluginIdScope;
	}
});
Object.defineProperty(exports, "resolveInstalledManifestRegistryIndexFingerprint", {
	enumerable: true,
	get: function() {
		return resolveInstalledManifestRegistryIndexFingerprint;
	}
});
Object.defineProperty(exports, "resolvePluginControlPlaneFingerprint", {
	enumerable: true,
	get: function() {
		return resolvePluginControlPlaneFingerprint;
	}
});
Object.defineProperty(exports, "resolvePluginDiscoveryContext", {
	enumerable: true,
	get: function() {
		return resolvePluginDiscoveryContext;
	}
});
Object.defineProperty(exports, "serializePluginIdScope", {
	enumerable: true,
	get: function() {
		return serializePluginIdScope;
	}
});
Object.defineProperty(exports, "setCurrentPluginMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return setCurrentPluginMetadataSnapshot;
	}
});
