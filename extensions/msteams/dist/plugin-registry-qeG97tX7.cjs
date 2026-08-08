const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_plugin_metadata_lifecycle = require("./plugin-metadata-lifecycle-L5oN3AE5.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_roots = require("./roots-5HJCnp4q.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_installed_plugin_index_store = require("./installed-plugin-index-store-vrROJGFd.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/plugins/plugin-registry-id-normalizer.ts
function normalizePluginRegistryAlias(value) {
	return value.trim();
}
function normalizePluginRegistryAliasKey(value) {
	return normalizePluginRegistryAlias(value).toLowerCase();
}
function collectObjectKeys$1(value) {
	return value ? Object.keys(value) : [];
}
function listPluginRegistryNormalizerAliases(plugin) {
	return [
		plugin.id,
		...plugin.providers ?? [],
		...plugin.channels ?? [],
		...plugin.setup?.providers?.map((provider) => provider.id) ?? [],
		...plugin.cliBackends ?? [],
		...plugin.setup?.cliBackends ?? [],
		...collectObjectKeys$1(plugin.modelCatalog?.providers),
		...collectObjectKeys$1(plugin.modelCatalog?.aliases),
		...collectObjectKeys$1(plugin.providerAuthAliases),
		...plugin.legacyPluginIds ?? []
	];
}
/** Creates a normalizer that maps provider/channel/catalog aliases back to plugin ids. */
function createPluginRegistryIdNormalizer(index, options = {}) {
	const aliases = /* @__PURE__ */ new Map();
	for (const plugin of index.plugins) {
		if (!plugin.pluginId) continue;
		const pluginId = normalizePluginRegistryAlias(plugin.pluginId);
		if (pluginId) aliases.set(normalizePluginRegistryAliasKey(pluginId), plugin.pluginId);
	}
	const registry = options.lookUpTable?.manifestRegistry ?? options.manifestRegistry ?? require_current_plugin_metadata_snapshot.loadPluginManifestRegistryForInstalledIndex({
		index,
		includeDisabled: true
	});
	for (const plugin of [...registry.plugins].toSorted((left, right) => left.id.localeCompare(right.id))) {
		const pluginId = normalizePluginRegistryAlias(plugin.id);
		if (!pluginId) continue;
		aliases.set(normalizePluginRegistryAliasKey(pluginId), plugin.id);
		for (const alias of listPluginRegistryNormalizerAliases(plugin)) {
			const normalizedAlias = normalizePluginRegistryAlias(alias);
			const normalizedAliasKey = normalizePluginRegistryAliasKey(alias);
			if (normalizedAlias && !aliases.has(normalizedAliasKey)) aliases.set(normalizedAliasKey, pluginId);
		}
	}
	return (pluginId) => {
		const trimmed = normalizePluginRegistryAlias(pluginId);
		return aliases.get(normalizePluginRegistryAliasKey(trimmed)) ?? trimmed;
	};
}
//#endregion
//#region src/plugins/plugin-snapshot-fingerprint.ts
function fileFingerprint(filePath) {
	try {
		const stat = node_fs.default.statSync(filePath, { bigint: true });
		return [
			filePath,
			stat.isFile() ? "file" : stat.isDirectory() ? "dir" : "other",
			stat.size.toString(),
			stat.mtimeNs.toString(),
			stat.ctimeNs.toString()
		];
	} catch {
		return [filePath, "missing"];
	}
}
//#endregion
//#region src/plugins/plugin-registry-snapshot.ts
const DISABLE_PERSISTED_PLUGIN_REGISTRY_ENV = "OPERATOR_DISABLE_PERSISTED_PLUGIN_REGISTRY";
const MAX_PLUGIN_REGISTRY_SNAPSHOT_MEMOS = 8;
const REGISTRY_SNAPSHOT_MEMO_ENV_KEYS = [
	"APPDATA",
	"HOME",
	"OPERATOR_BUNDLED_PLUGINS_DIR",
	"OPERATOR_COMPATIBILITY_HOST_VERSION",
	"OPERATOR_CONFIG_PATH",
	"OPERATOR_DISABLE_BUNDLED_PLUGINS",
	"OPERATOR_DISABLE_BUNDLED_SOURCE_OVERLAYS",
	DISABLE_PERSISTED_PLUGIN_REGISTRY_ENV,
	"OPERATOR_HOME",
	"OPERATOR_NIX_MODE",
	"OPERATOR_STATE_DIR",
	"USERPROFILE",
	"XDG_CONFIG_HOME"
];
let pluginRegistrySnapshotMemos = [];
function clearLoadPluginRegistrySnapshotMemo() {
	pluginRegistrySnapshotMemos = [];
}
require_plugin_metadata_lifecycle.registerPluginMetadataProcessMemoLifecycleClear(clearLoadPluginRegistrySnapshotMemo);
function formatDeprecatedPersistedRegistryDisableWarning() {
	return `${DISABLE_PERSISTED_PLUGIN_REGISTRY_ENV} is a deprecated break-glass compatibility switch; use \`openclaw plugins registry --refresh\` or \`openclaw doctor --fix\` to repair registry state.`;
}
function hasEnvFlag(env, name) {
	const value = env[name]?.trim().toLowerCase();
	return Boolean(value && value !== "0" && value !== "false" && value !== "no");
}
function pickRegistrySnapshotMemoEnv(env) {
	return Object.fromEntries(REGISTRY_SNAPSHOT_MEMO_ENV_KEYS.flatMap((key) => {
		const value = env[key];
		return value === void 0 ? [] : [[key, value]];
	}));
}
function canMemoizePluginRegistrySnapshot(params) {
	return params.index === void 0 && params.candidates === void 0 && params.diagnostics === void 0 && params.discovery === void 0 && params.installRecords === void 0 && params.now === void 0 && params.filePath === void 0 && params.pluginIndexFilePath === void 0;
}
function resolvePluginRegistrySnapshotMemoKey(params, env) {
	if (!canMemoizePluginRegistrySnapshot(params)) return;
	const persistedRegistryFingerprint = params.preferPersisted !== false && !hasEnvFlag(env, DISABLE_PERSISTED_PLUGIN_REGISTRY_ENV) ? require_installed_plugin_index.hashJson(require_installed_plugin_index_store.readPersistedInstalledPluginIndexSync({
		env,
		...params.stateDir ? { stateDir: params.stateDir } : {}
	})) : "disabled";
	return require_installed_plugin_index.hashJson({
		config: params.config ?? null,
		cwd: process.cwd(),
		env: pickRegistrySnapshotMemoEnv(env),
		hostContractVersion: require_version.resolveCompatibilityHostVersion(env),
		preferPersisted: params.preferPersisted ?? null,
		registry: persistedRegistryFingerprint,
		pluginRoots: fingerprintPluginSourceRoots(params, env),
		stateDir: params.stateDir ? require_home_dir.resolveUserPath(params.stateDir, env) : null,
		workspaceDir: params.workspaceDir ? require_home_dir.resolveUserPath(params.workspaceDir, env) : null
	});
}
function fingerprintPluginSourceRoots(params, env) {
	const cacheInputs = require_roots.resolvePluginCacheInputs({
		workspaceDir: params.workspaceDir ? require_home_dir.resolveUserPath(params.workspaceDir, env) : void 0,
		loadPaths: require_config_state.normalizePluginsConfig(params.config?.plugins).loadPaths,
		env
	});
	return {
		global: sourceRootFingerprint(cacheInputs.roots.global),
		loadPaths: cacheInputs.loadPaths.map((entry) => sourceRootFingerprint(entry)),
		stock: cacheInputs.roots.stock ? sourceRootFingerprint(cacheInputs.roots.stock) : null,
		workspace: cacheInputs.roots.workspace ? sourceRootFingerprint(cacheInputs.roots.workspace) : null
	};
}
function sourceRootFingerprint(rootPath) {
	return {
		root: fileFingerprint(rootPath),
		children: directoryChildFingerprint(rootPath)
	};
}
function directoryChildFingerprint(directoryPath) {
	try {
		return node_fs.default.readdirSync(directoryPath, { withFileTypes: true }).map((entry) => [entry.name, entry.isDirectory() ? "dir" : entry.isFile() ? "file" : "other"]).toSorted(([left], [right]) => (0, _gabrielvfonseca_normalization_core.expectDefined)(left, "plugin registry snapshot left").localeCompare((0, _gabrielvfonseca_normalization_core.expectDefined)(right, "plugin registry snapshot right")));
	} catch {
		return "unreadable";
	}
}
function findPluginRegistrySnapshotMemo(key) {
	if (!key) return;
	const index = pluginRegistrySnapshotMemos.findIndex((memo) => memo.key === key);
	if (index === -1) return;
	const [memo] = pluginRegistrySnapshotMemos.splice(index, 1);
	if (!memo) return;
	pluginRegistrySnapshotMemos.unshift(memo);
	return memo.result;
}
function rememberPluginRegistrySnapshotMemo(key, result) {
	if (!key) return result;
	pluginRegistrySnapshotMemos = [{
		key,
		result
	}, ...pluginRegistrySnapshotMemos.filter((memo) => memo.key !== key)].slice(0, MAX_PLUGIN_REGISTRY_SNAPSHOT_MEMOS);
	return result;
}
function canReuseCurrentPluginMetadataSnapshot(params) {
	return params.preferPersisted !== false && params.stateDir === void 0 && params.filePath === void 0 && params.pluginIndexFilePath === void 0 && params.installRecords === void 0 && params.candidates === void 0 && params.diagnostics === void 0 && params.now === void 0;
}
function loadCurrentPluginRegistrySnapshotResult(params) {
	if (!canReuseCurrentPluginMetadataSnapshot(params)) return;
	const env = params.env ?? process.env;
	const current = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.config,
		env,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		...params.workspaceDir === void 0 ? { allowWorkspaceScopedSnapshot: true } : {}
	});
	if (!current || current.registryDiagnostics.length > 0) return;
	return {
		snapshot: current.index,
		source: "provided",
		diagnostics: current.registryDiagnostics
	};
}
function hasMissingPersistedPluginSource(index) {
	return index.plugins.some((plugin) => {
		if (!plugin.enabled) return false;
		return !node_fs.default.existsSync(plugin.rootDir) || !require_installed_plugin_index.hasOptionalMissingPluginManifestFile(plugin) && !node_fs.default.existsSync(plugin.manifestPath) || (plugin.source ? !node_fs.default.existsSync(plugin.source) : false) || (plugin.setupSource ? !node_fs.default.existsSync(plugin.setupSource) : false);
	});
}
function hasMismatchedPersistedConfigPathPlugins(index, params, env) {
	const loadPaths = require_config_state.normalizePluginsConfig(params.config?.plugins).loadPaths;
	const discovery = require_discovery.discoverConfiguredPluginLoadPaths({
		loadPaths,
		workspaceDir: params.workspaceDir,
		env
	});
	const configuredRoots = require_manifest_registry.loadPluginManifestRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env,
		candidates: discovery.candidates,
		diagnostics: discovery.diagnostics,
		installRecords: require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(index)
	}).plugins.map((plugin) => resolveComparablePath(plugin.rootDir));
	const persistedRoots = index.plugins.filter((plugin) => plugin.origin === "config").map((plugin) => resolveComparablePath(plugin.rootDir));
	if (configuredRoots.length !== persistedRoots.length) return true;
	return configuredRoots.some((rootDir, position) => rootDir !== persistedRoots[position]);
}
function resolveComparablePath(filePath) {
	try {
		return node_fs.default.realpathSync(filePath);
	} catch {
		return node_path.default.resolve(filePath);
	}
}
function isRelativePathInsideOrEqual(relativePath) {
	return relativePath === "" || relativePath !== ".." && !relativePath.startsWith(`..${node_path.default.sep}`) && !node_path.default.isAbsolute(relativePath);
}
function isPathInsideOrEqual(childPath, parentPath) {
	return isRelativePathInsideOrEqual(node_path.default.relative(resolveComparablePath(parentPath), resolveComparablePath(childPath)));
}
function hasMismatchedPersistedBundledPluginRoot(index, env) {
	const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir(env);
	if (!bundledPluginsDir) return false;
	let sourceOverlayDirs;
	return index.plugins.some((plugin) => {
		if (plugin.origin !== "bundled") return false;
		sourceOverlayDirs ??= require_discovery.listBundledSourceOverlayDirs({
			bundledRoot: bundledPluginsDir,
			env
		});
		return !isAllowedPersistedBundledPluginRoot(plugin, bundledPluginsDir, sourceOverlayDirs);
	});
}
function isAllowedPersistedBundledPluginRoot(plugin, bundledPluginsDir, sourceOverlayDirs) {
	const pluginRootDir = plugin.rootDir;
	const legacyRoot = require_discovery.buildLegacyBundledRootPath(bundledPluginsDir);
	if (isPathInsideOrEqual(pluginRootDir, bundledPluginsDir)) {
		if (!legacyRoot || !isSourceCheckoutBundledPluginRoot(legacyRoot)) return true;
		const relativePluginRoot = node_path.default.relative(resolveComparablePath(bundledPluginsDir), resolveComparablePath(pluginRootDir));
		return !sourcePluginOptsOutOfBundledDist(node_path.default.join(legacyRoot, relativePluginRoot));
	}
	if (sourceOverlayDirs.some((overlayDir) => isPathInsideOrEqual(pluginRootDir, overlayDir))) return true;
	if (!legacyRoot || !isSourceCheckoutBundledPluginRoot(legacyRoot)) return false;
	const relativePluginRoot = node_path.default.relative(resolveComparablePath(legacyRoot), resolveComparablePath(pluginRootDir));
	if (!isRelativePathInsideOrEqual(relativePluginRoot)) return false;
	if (plugin.packageBuild?.bundledDist === false) return true;
	if (sourcePluginOptsOutOfBundledDist(node_path.default.join(legacyRoot, relativePluginRoot))) return false;
	return !node_fs.default.existsSync(node_path.default.join(bundledPluginsDir, relativePluginRoot));
}
function sourcePluginOptsOutOfBundledDist(pluginRootDir) {
	return require_manifest.getPackageManifestMetadata((0, _openclaw_fs_safe_json.tryReadJsonSync)(node_path.default.join(pluginRootDir, "package.json")) ?? void 0)?.build?.bundledDist === false;
}
function isSourceCheckoutBundledPluginRoot(extensionsDir) {
	const packageRoot = node_path.default.dirname(extensionsDir);
	return node_fs.default.existsSync(extensionsDir) && node_fs.default.existsSync(node_path.default.join(packageRoot, ".git")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "pnpm-workspace.yaml")) && node_fs.default.existsSync(node_path.default.join(packageRoot, "src"));
}
function hashExistingFile(filePath) {
	try {
		return node_crypto.default.createHash("sha256").update(node_fs.default.readFileSync(filePath)).digest("hex");
	} catch {
		return null;
	}
}
function resolveRecordPackageJsonPath(plugin) {
	const packageJsonPath = plugin.packageJson?.path;
	if (!packageJsonPath) return null;
	const rootDir = plugin.rootDir || node_path.default.dirname(plugin.manifestPath);
	const resolved = node_path.default.resolve(rootDir, packageJsonPath);
	if (!isRelativePathInsideOrEqual(node_path.default.relative(rootDir, resolved))) return null;
	return isRelativePathInsideOrEqual(node_path.default.relative(resolveComparablePath(rootDir), resolveComparablePath(resolved))) ? resolved : null;
}
function hasStalePersistedPluginDiagnostics(index) {
	return index.diagnostics.some((diag) => {
		const source = diag.source;
		return typeof diag.pluginId === "string" && diag.pluginId.trim().length > 0 && typeof source === "string" && node_path.default.isAbsolute(source) && !node_fs.default.existsSync(source);
	});
}
function hasStalePersistedPluginMetadata(index) {
	return index.plugins.some((plugin) => {
		if (!require_installed_plugin_index.hasOptionalMissingPluginManifestFile(plugin)) {
			if (require_installed_plugin_index.fileSignatureMatches(plugin.manifestPath, plugin.manifestFile) !== true) {
				const manifestHash = hashExistingFile(plugin.manifestPath);
				if (manifestHash && manifestHash !== plugin.manifestHash) return true;
			}
		}
		const packageJsonPath = resolveRecordPackageJsonPath(plugin);
		if (!plugin.packageJson?.hash) return false;
		if (!packageJsonPath) return true;
		const packageJsonSignatureMatches = require_installed_plugin_index.fileSignatureMatches(packageJsonPath, plugin.packageJson.fileSignature);
		if (packageJsonSignatureMatches === true && plugin.origin === "bundled") return false;
		if (packageJsonSignatureMatches === false) return hashExistingFile(packageJsonPath) !== plugin.packageJson.hash;
		return hashExistingFile(packageJsonPath) !== plugin.packageJson.hash;
	});
}
function loadSnapshotInstallRecords(params, env) {
	return require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecordsSync({
		env,
		...params.stateDir ? { stateDir: params.stateDir } : {},
		...params.filePath ? { filePath: params.filePath } : params.pluginIndexFilePath ? { filePath: params.pluginIndexFilePath } : {}
	});
}
function hasRecoveredInstallRecordsMissingFromPersistedIndex(index, installRecords, env) {
	const persistedRecords = require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(index);
	const persistedPluginIds = new Set(index.plugins.map((plugin) => plugin.pluginId));
	return Object.entries(installRecords).some(([pluginId, record]) => {
		if (persistedRecords[pluginId] && persistedPluginIds.has(pluginId)) return false;
		const installPaths = [record.installPath, record.sourcePath].filter((candidate) => typeof candidate === "string" && candidate.trim().length > 0);
		if (installPaths.length === 0) return true;
		return installPaths.some((installPath) => node_fs.default.existsSync(require_home_dir.resolveUserPath(installPath, env)));
	});
}
function loadPluginRegistrySnapshotWithMetadata(params = {}) {
	if (params.index) return {
		snapshot: params.index,
		source: "provided",
		diagnostics: []
	};
	const current = loadCurrentPluginRegistrySnapshotResult(params);
	if (current) return current;
	const env = params.env ?? process.env;
	const memoKey = resolvePluginRegistrySnapshotMemoKey(params, env);
	const memo = findPluginRegistrySnapshotMemo(memoKey);
	if (memo) return memo;
	const diagnostics = [];
	const disabledByCaller = params.preferPersisted === false;
	const disabledByEnv = hasEnvFlag(env, DISABLE_PERSISTED_PLUGIN_REGISTRY_ENV);
	const persistedReadsEnabled = !disabledByCaller && !disabledByEnv;
	const persistedInstallRecordReadsEnabled = persistedReadsEnabled;
	let persistedIndex;
	if (persistedInstallRecordReadsEnabled) {
		persistedIndex = require_installed_plugin_index_store.readPersistedInstalledPluginIndexSync(params);
		if (persistedReadsEnabled && persistedIndex) if (params.config && persistedIndex.policyHash !== require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(params.config)) diagnostics.push({
			level: "warn",
			code: "persisted-registry-stale-policy",
			message: "Persisted plugin registry policy does not match current config; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
		});
		else if (hasMissingPersistedPluginSource(persistedIndex)) diagnostics.push({
			level: "warn",
			code: "persisted-registry-stale-source",
			message: "Persisted plugin registry points at missing plugin files; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
		});
		else if (hasMismatchedPersistedBundledPluginRoot(persistedIndex, env)) diagnostics.push({
			level: "warn",
			code: "persisted-registry-stale-source",
			message: "Persisted plugin registry points at a different bundled plugin tree; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
		});
		else if (hasMismatchedPersistedConfigPathPlugins(persistedIndex, params, env)) diagnostics.push({
			level: "warn",
			code: "persisted-registry-stale-source",
			message: "Persisted plugin registry does not match configured load-path plugins; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
		});
		else if (hasStalePersistedPluginDiagnostics(persistedIndex)) diagnostics.push({
			level: "warn",
			code: "persisted-registry-stale-source",
			message: "Persisted plugin registry contains diagnostics referencing missing paths; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
		});
		else if (require_installed_plugin_index_store.hasMissingConfigPathActivationMetadata(persistedIndex)) diagnostics.push({
			level: "warn",
			code: "persisted-registry-stale-source",
			message: "Persisted plugin registry is missing config-path startup metadata; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
		});
		else if (hasStalePersistedPluginMetadata(persistedIndex)) diagnostics.push({
			level: "warn",
			code: "persisted-registry-stale-source",
			message: "Persisted plugin registry metadata no longer matches plugin manifest or package files; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
		});
		else if (hasRecoveredInstallRecordsMissingFromPersistedIndex(persistedIndex, loadSnapshotInstallRecords(params, env), env)) diagnostics.push({
			level: "warn",
			code: "persisted-registry-stale-source",
			message: "Persisted plugin registry is missing recoverable managed npm plugins; using derived plugin index. Run `openclaw plugins registry --refresh` to update the persisted registry."
		});
		else return rememberPluginRegistrySnapshotMemo(memoKey, {
			snapshot: persistedIndex,
			source: "persisted",
			diagnostics
		});
		else if (persistedReadsEnabled) diagnostics.push({
			level: "info",
			code: "persisted-registry-missing",
			message: "Persisted plugin registry is missing or invalid; using derived plugin index."
		});
	} else diagnostics.push({
		level: "warn",
		code: "persisted-registry-disabled",
		message: disabledByEnv ? `${formatDeprecatedPersistedRegistryDisableWarning()} Using legacy derived plugin index.` : "Persisted plugin registry reads are disabled by the caller; using derived plugin index."
	});
	const derived = require_installed_plugin_index.loadInstalledPluginIndexWithDiscovery({
		...params,
		installRecords: persistedInstallRecordReadsEnabled ? params.installRecords : params.installRecords ?? {}
	});
	return rememberPluginRegistrySnapshotMemo(memoKey, {
		snapshot: derived.index,
		source: "derived",
		diagnostics,
		discovery: derived.discovery
	});
}
function resolveSnapshot(params = {}) {
	return loadPluginRegistrySnapshotWithMetadata(params).snapshot;
}
function loadPluginRegistrySnapshot(params = {}) {
	return resolveSnapshot(params);
}
function getPluginRecord(params) {
	return require_installed_plugin_index.getInstalledPluginRecord(resolveSnapshot(params), params.pluginId);
}
function isPluginEnabled(params) {
	return require_installed_plugin_index.isInstalledPluginEnabled(resolveSnapshot(params), params.pluginId, params.config);
}
function inspectPluginRegistry(params = {}) {
	return require_installed_plugin_index_store.inspectPersistedInstalledPluginIndex(params);
}
function refreshPluginRegistry(params) {
	return require_installed_plugin_index_store.refreshPersistedInstalledPluginIndex(params);
}
//#endregion
//#region src/plugins/plugin-registry-contributions.ts
/** Loads manifest and installed-index contributions used to build plugin registry snapshots. */
function normalizeContributionId(value) {
	return value.trim();
}
function collectObjectKeys(value) {
	return value ? Object.keys(value) : [];
}
function collectContractKeys(plugin) {
	const contracts = plugin.contracts;
	if (!contracts) return [];
	return Object.entries(contracts).flatMap(([key, value]) => Array.isArray(value) && value.length > 0 ? [key] : []);
}
function listManifestContractValues(plugin, contract) {
	return plugin.contracts?.[contract] ?? [];
}
function loadManifestContractRegistry(params) {
	return loadPluginManifestRegistryForPluginRegistry({
		...params,
		pluginIds: params.onlyPluginIds,
		includeDisabled: true
	});
}
function listManifestContributionIds(plugin, contribution) {
	switch (contribution) {
		case "providers": return plugin.providers;
		case "channels": return plugin.channels;
		case "channelConfigs": return collectObjectKeys(plugin.channelConfigs);
		case "setupProviders": return plugin.setup?.providers?.map((provider) => provider.id) ?? [];
		case "cliBackends": return [...plugin.cliBackends, ...plugin.setup?.cliBackends ?? []];
		case "modelCatalogProviders": return [...collectObjectKeys(plugin.modelCatalog?.providers), ...collectObjectKeys(plugin.modelCatalog?.aliases)];
		case "commandAliases": return plugin.commandAliases?.map((alias) => alias.name) ?? [];
		case "contracts": return collectContractKeys(plugin);
	}
	return [];
}
function resolveContributionPluginIds(params) {
	if (params.includeDisabled) return params.index.plugins.map((plugin) => plugin.pluginId);
	return params.index.plugins.filter((plugin) => require_installed_plugin_index.isInstalledPluginEnabled(params.index, plugin.pluginId, params.config)).map((plugin) => plugin.pluginId);
}
function loadContributionManifestRegistry(params) {
	return require_current_plugin_metadata_snapshot.loadPluginManifestRegistryForInstalledIndex({
		index: params.index,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		pluginIds: resolveContributionPluginIds({
			index: params.index,
			includeDisabled: params.includeDisabled,
			config: params.config
		}),
		includeDisabled: true
	});
}
function listContributionManifestPlugins(params) {
	const plugins = params.lookUpTable?.plugins;
	if (plugins) {
		const enabledPluginIds = new Set(resolveContributionPluginIds({
			index: params.index,
			includeDisabled: params.includeDisabled,
			config: params.config
		}));
		return plugins.filter((plugin) => enabledPluginIds.has(plugin.id));
	}
	return loadContributionManifestRegistry({
		...params,
		index: params.index
	}).plugins;
}
function resolveContributionOwnerMap(table, contribution) {
	switch (contribution) {
		case "channels": return table.owners.channels;
		case "channelConfigs": return table.owners.channelConfigs;
		case "providers": return table.owners.providers;
		case "modelCatalogProviders": return table.owners.modelCatalogProviders;
		case "cliBackends": return table.owners.cliBackends;
		case "setupProviders": return table.owners.setupProviders;
		case "commandAliases": return table.owners.commandAliases;
		case "contracts": return table.owners.contracts;
	}
}
function filterContributionOwnerIds(params) {
	const enabledPluginIds = new Set(resolveContributionPluginIds({
		index: params.index,
		includeDisabled: params.includeDisabled,
		config: params.config
	}));
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(params.owners.filter((owner) => enabledPluginIds.has(owner)));
}
function canReuseCurrentManifestRegistry(params) {
	return params.bundledChannelConfigCollector === void 0 && params.index === void 0 && params.preferPersisted !== false && params.stateDir === void 0 && params.filePath === void 0 && params.pluginIndexFilePath === void 0 && params.installRecords === void 0 && params.candidates === void 0 && params.diagnostics === void 0;
}
function loadCurrentManifestRegistryForPluginRegistry(params) {
	if (!canReuseCurrentManifestRegistry(params)) return;
	const env = params.env ?? process.env;
	const current = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.config,
		env,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		...params.workspaceDir === void 0 ? { allowWorkspaceScopedSnapshot: true } : {}
	});
	if (!current || current.registryDiagnostics.length > 0) return;
	const pluginIdSet = params.pluginIds === void 0 ? void 0 : new Set(params.pluginIds);
	const enabledPluginIds = new Set(current.index.plugins.filter((plugin) => params.includeDisabled || plugin.enabled).map((plugin) => plugin.pluginId));
	return {
		plugins: current.manifestRegistry.plugins.filter((plugin) => (!pluginIdSet || pluginIdSet.has(plugin.id)) && (params.includeDisabled || enabledPluginIds.has(plugin.id))),
		diagnostics: pluginIdSet ? current.manifestRegistry.diagnostics.filter((diagnostic) => !diagnostic.pluginId || pluginIdSet.has(diagnostic.pluginId)) : current.manifestRegistry.diagnostics
	};
}
function loadPluginManifestRegistryForPluginRegistry(params = {}) {
	const current = loadCurrentManifestRegistryForPluginRegistry(params);
	if (current) return current;
	return require_current_plugin_metadata_snapshot.loadPluginManifestRegistryForInstalledIndex({
		index: loadPluginRegistrySnapshot(params),
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		pluginIds: params.pluginIds,
		includeDisabled: params.includeDisabled,
		...params.bundledChannelConfigCollector ? { bundledChannelConfigCollector: params.bundledChannelConfigCollector } : {}
	});
}
function normalizePluginsConfigWithRegistry(config, index, options = {}) {
	return require_config_activation_shared.normalizePluginsConfigWithResolver(config, createPluginRegistryIdNormalizer(index, options));
}
function listPluginContributionIds(params) {
	const index = params.lookUpTable?.index ?? loadPluginRegistrySnapshot(params);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(listContributionManifestPlugins({
		...params,
		index
	}).flatMap((plugin) => listManifestContributionIds(plugin, params.contribution)));
}
function resolvePluginContributionOwners(params) {
	const index = params.lookUpTable?.index ?? loadPluginRegistrySnapshot(params);
	if (params.lookUpTable && typeof params.matches === "string") {
		const owners = resolveContributionOwnerMap(params.lookUpTable, params.contribution)?.get(params.matches);
		if (owners) return filterContributionOwnerIds({
			owners,
			index,
			includeDisabled: params.includeDisabled,
			config: params.config
		});
		return [];
	}
	const matcher = typeof params.matches === "string" ? (contributionId) => contributionId === params.matches : params.matches;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(listContributionManifestPlugins({
		...params,
		index
	}).flatMap((plugin) => listManifestContributionIds(plugin, params.contribution).some(matcher) ? [plugin.id] : []));
}
function resolveProviderOwners(params) {
	const providerId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.providerId);
	if (!providerId) return [];
	if (params.lookUpTable) {
		const index = params.lookUpTable.index;
		const owners = [];
		for (const [contributionId, ownerIds] of params.lookUpTable.owners.providers.entries()) if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(contributionId) === providerId) owners.push(...ownerIds);
		return filterContributionOwnerIds({
			owners,
			index,
			includeDisabled: params.includeDisabled,
			config: params.config
		});
	}
	return resolvePluginContributionOwners({
		...params,
		contribution: "providers",
		matches: (contributionId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(contributionId) === providerId
	});
}
function resolveManifestContractPluginIds(params) {
	return loadManifestContractRegistry(params).plugins.filter((plugin) => (!params.origin || plugin.origin === params.origin) && listManifestContractValues(plugin, params.contract).length > 0).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
function resolveManifestContractPluginIdsByCompatibilityRuntimePath(params) {
	const normalizedPath = params.path?.trim();
	if (!normalizedPath) return [];
	return loadManifestContractRegistry(params).plugins.filter((plugin) => (!params.origin || plugin.origin === params.origin) && listManifestContractValues(plugin, params.contract).length > 0 && (plugin.configContracts?.compatibilityRuntimePaths ?? []).includes(normalizedPath)).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
function resolveManifestContractOwnerPluginId(params) {
	const normalizedValue = normalizeContributionId(params.value ?? "").toLowerCase();
	if (!normalizedValue) return;
	return loadManifestContractRegistry(params).plugins.find((plugin) => (!params.origin || plugin.origin === params.origin) && listManifestContractValues(plugin, params.contract).some((candidate) => normalizeContributionId(candidate).toLowerCase() === normalizedValue))?.id;
}
//#endregion
//#region src/plugins/plugin-registry.ts
var plugin_registry_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	createPluginRegistryIdNormalizer: () => createPluginRegistryIdNormalizer,
	getPluginRecord: () => getPluginRecord,
	inspectPluginRegistry: () => inspectPluginRegistry,
	isPluginEnabled: () => isPluginEnabled,
	listPluginContributionIds: () => listPluginContributionIds,
	loadPluginManifestRegistryForPluginRegistry: () => loadPluginManifestRegistryForPluginRegistry,
	loadPluginRegistrySnapshot: () => loadPluginRegistrySnapshot,
	loadPluginRegistrySnapshotWithMetadata: () => loadPluginRegistrySnapshotWithMetadata,
	normalizePluginsConfigWithRegistry: () => normalizePluginsConfigWithRegistry,
	refreshPluginRegistry: () => refreshPluginRegistry,
	resolveManifestContractOwnerPluginId: () => resolveManifestContractOwnerPluginId,
	resolveManifestContractPluginIds: () => resolveManifestContractPluginIds,
	resolveManifestContractPluginIdsByCompatibilityRuntimePath: () => resolveManifestContractPluginIdsByCompatibilityRuntimePath,
	resolvePluginContributionOwners: () => resolvePluginContributionOwners,
	resolveProviderOwners: () => resolveProviderOwners
});
//#endregion
Object.defineProperty(exports, "createPluginRegistryIdNormalizer", {
	enumerable: true,
	get: function() {
		return createPluginRegistryIdNormalizer;
	}
});
Object.defineProperty(exports, "fileFingerprint", {
	enumerable: true,
	get: function() {
		return fileFingerprint;
	}
});
Object.defineProperty(exports, "getPluginRecord", {
	enumerable: true,
	get: function() {
		return getPluginRecord;
	}
});
Object.defineProperty(exports, "isPluginEnabled", {
	enumerable: true,
	get: function() {
		return isPluginEnabled;
	}
});
Object.defineProperty(exports, "listPluginContributionIds", {
	enumerable: true,
	get: function() {
		return listPluginContributionIds;
	}
});
Object.defineProperty(exports, "loadPluginManifestRegistryForPluginRegistry", {
	enumerable: true,
	get: function() {
		return loadPluginManifestRegistryForPluginRegistry;
	}
});
Object.defineProperty(exports, "loadPluginRegistrySnapshot", {
	enumerable: true,
	get: function() {
		return loadPluginRegistrySnapshot;
	}
});
Object.defineProperty(exports, "loadPluginRegistrySnapshotWithMetadata", {
	enumerable: true,
	get: function() {
		return loadPluginRegistrySnapshotWithMetadata;
	}
});
Object.defineProperty(exports, "normalizePluginsConfigWithRegistry", {
	enumerable: true,
	get: function() {
		return normalizePluginsConfigWithRegistry;
	}
});
Object.defineProperty(exports, "plugin_registry_exports", {
	enumerable: true,
	get: function() {
		return plugin_registry_exports;
	}
});
Object.defineProperty(exports, "refreshPluginRegistry", {
	enumerable: true,
	get: function() {
		return refreshPluginRegistry;
	}
});
Object.defineProperty(exports, "resolveManifestContractOwnerPluginId", {
	enumerable: true,
	get: function() {
		return resolveManifestContractOwnerPluginId;
	}
});
Object.defineProperty(exports, "resolveManifestContractPluginIds", {
	enumerable: true,
	get: function() {
		return resolveManifestContractPluginIds;
	}
});
Object.defineProperty(exports, "resolveManifestContractPluginIdsByCompatibilityRuntimePath", {
	enumerable: true,
	get: function() {
		return resolveManifestContractPluginIdsByCompatibilityRuntimePath;
	}
});
Object.defineProperty(exports, "resolvePluginContributionOwners", {
	enumerable: true,
	get: function() {
		return resolvePluginContributionOwners;
	}
});
Object.defineProperty(exports, "resolveProviderOwners", {
	enumerable: true,
	get: function() {
		return resolveProviderOwners;
	}
});
