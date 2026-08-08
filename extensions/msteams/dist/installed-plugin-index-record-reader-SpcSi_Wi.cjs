const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./json-files-Bp0Z4DKb.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_semver = require("./semver-CcnjzT8W.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_openclaw_state_db_readonly = require("./openclaw-state-db-readonly-tU1PH4QL.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_managed_npm_retention = require("./managed-npm-retention-edlbaFsN.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/installed-plugin-index-record-cache.ts
const installRecordsCache = /* @__PURE__ */ new Map();
let installRecordsCacheGeneration = 0;
/** Returns cached installed plugin records for a store/recovery key. */
function getInstalledPluginIndexInstallRecordsCache(key) {
	return installRecordsCache.get(key);
}
/** Stores cached installed plugin records for a store/recovery key. */
function setInstalledPluginIndexInstallRecordsCache(key, entry) {
	installRecordsCache.set(key, entry);
}
/** Current cache generation used to detect concurrent clears during async loads. */
function getInstalledPluginIndexInstallRecordsCacheGeneration() {
	return installRecordsCacheGeneration;
}
/** Clears cached installed plugin records and advances the cache generation. */
function clearLoadInstalledPluginIndexInstallRecordsCache() {
	installRecordsCacheGeneration += 1;
	installRecordsCache.clear();
}
//#endregion
//#region src/plugins/installed-plugin-index-store-path.ts
const LEGACY_INSTALLED_PLUGIN_INDEX_STORE_PATH = node_path.default.join("plugins", "installs.json");
function resolveStoreEnv(options) {
	return options.stateDir ? {
		...options.env ?? process.env,
		OPERATOR_STATE_DIR: options.stateDir
	} : options.env ?? process.env;
}
/** Resolves the canonical SQLite-backed installed plugin index path. */
function resolveInstalledPluginIndexStorePath(options = {}) {
	if (options.filePath) return options.filePath;
	return require_openclaw_state_db.resolveOperatorStateSqlitePath(resolveStoreEnv(options));
}
/** Resolves state database options for the installed plugin index store. */
function resolveInstalledPluginIndexStateDatabaseOptions(options = {}) {
	if (options.filePath) return {
		...options.env ? { env: options.env } : {},
		path: options.filePath
	};
	if (options.stateDir) return { env: resolveStoreEnv(options) };
	return options.env ? { env: options.env } : {};
}
/** Resolves the legacy JSON installed plugin index path for migration/doctor use. */
function resolveLegacyInstalledPluginIndexStorePath(options = {}) {
	if (options.filePath) return options.filePath;
	const env = options.env ?? process.env;
	const stateDir = options.stateDir ?? require_paths.resolveStateDir(env);
	return node_path.default.join(stateDir, LEGACY_INSTALLED_PLUGIN_INDEX_STORE_PATH);
}
//#endregion
//#region src/plugins/installed-plugin-index-record-reader.ts
/** Reads installed-index records back into manifest registry records. */
function cloneInstallRecords(records) {
	return readRecordMap(records) ?? {};
}
const BLOCKED_RECORD_KEYS = /* @__PURE__ */ new Set([
	"__proto__",
	"constructor",
	"prototype"
]);
function isSafeRecordKey(key) {
	return !BLOCKED_RECORD_KEYS.has(key);
}
function readRecordMap(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return null;
	const records = {};
	for (const [pluginId, record] of Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right))) {
		if (!isSafeRecordKey(pluginId)) continue;
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(record) && typeof record.source === "string") records[pluginId] = structuredClone(record);
	}
	return records;
}
function readJsonObjectFileSync(filePath) {
	const parsed = (0, _openclaw_fs_safe_json.tryReadJsonSync)(filePath);
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? parsed : null;
}
function readStringRecord(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return {};
	const record = {};
	for (const [key, raw] of Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right))) {
		if (!isSafeRecordKey(key)) continue;
		if (typeof raw === "string" && raw.trim()) record[key] = raw.trim();
	}
	return record;
}
function hasPackagePluginMetadata(manifest) {
	const operator = manifest.operator;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(operator)) return false;
	const extensions = operator.extensions;
	return Array.isArray(extensions) && extensions.some((entry) => typeof entry === "string");
}
function readManifestPluginId(packageDir) {
	const manifest = readJsonObjectFileSync(node_path.default.join(packageDir, "operator.plugin.json"));
	return (typeof manifest?.id === "string" ? manifest.id.trim() : "") || void 0;
}
function resolveRecoveredManagedNpmRoot(options = {}) {
	return node_path.default.resolve(options.stateDir ? node_path.default.join(options.stateDir, "npm") : require_install_paths.resolveDefaultPluginNpmDir(options.env));
}
function resolveRecoveredManagedNpmPluginId(params) {
	const packageManifest = readJsonObjectFileSync(node_path.default.join(params.packageDir, "package.json"));
	if (!packageManifest || !hasPackagePluginMetadata(packageManifest)) return;
	const packageName = typeof packageManifest.name === "string" && packageManifest.name.trim() ? packageManifest.name.trim() : params.packageName;
	const pluginId = readManifestPluginId(params.packageDir) ?? packageName;
	return require_install_paths.validatePluginId(pluginId) ? void 0 : pluginId;
}
function buildRecoveredManagedNpmInstallRecordsForRoot(npmRoot) {
	const dependencies = readStringRecord(readJsonObjectFileSync(node_path.default.join(npmRoot, "package.json"))?.dependencies);
	const records = {};
	for (const [packageName, dependencySpec] of Object.entries(dependencies)) {
		const packageDir = node_path.default.join(npmRoot, "node_modules", ...packageName.split("/"));
		let stat;
		try {
			stat = node_fs.default.statSync(packageDir);
		} catch {
			continue;
		}
		if (!stat.isDirectory()) continue;
		if (require_managed_npm_retention.hasRetainedManagedNpmInstallMarker(packageDir)) continue;
		const pluginId = resolveRecoveredManagedNpmPluginId({
			packageName,
			packageDir
		});
		if (!pluginId) continue;
		const packageManifest = readJsonObjectFileSync(node_path.default.join(packageDir, "package.json"));
		const version = typeof packageManifest?.version === "string" && packageManifest.version.trim() ? packageManifest.version.trim() : void 0;
		records[pluginId] = {
			source: "npm",
			spec: `${packageName}@${dependencySpec}`,
			installPath: packageDir,
			...version ? {
				version,
				resolvedName: packageName,
				resolvedVersion: version
			} : {},
			...version ? { resolvedSpec: `${packageName}@${version}` } : {}
		};
	}
	return records;
}
function buildRecoveredManagedNpmInstallRecords(options = {}) {
	const npmRoot = resolveRecoveredManagedNpmRoot(options);
	const legacyRecords = buildRecoveredManagedNpmInstallRecordsForRoot(npmRoot);
	const projectRecords = {};
	for (const projectRoot of require_managed_npm_retention.listManagedPluginNpmProjectRootsSync(npmRoot)) Object.assign(projectRecords, buildRecoveredManagedNpmInstallRecordsForRoot(projectRoot));
	return {
		...legacyRecords,
		...projectRecords
	};
}
function recordsShareInstallPath(left, right) {
	if (!left?.installPath || !right.installPath) return false;
	return node_path.default.resolve(left.installPath) === node_path.default.resolve(right.installPath);
}
function readInstallRecordVersion(record) {
	return record?.resolvedVersion ?? record?.version;
}
function isUnavailableManagedNpmInstallRecord(params) {
	const installPath = params.persisted?.installPath;
	if (params.persisted?.source !== "npm" || !installPath) return false;
	try {
		if (node_fs.default.statSync(installPath).isDirectory()) return false;
	} catch (error) {
		if (!(0, _openclaw_fs_safe_path.isNotFoundPathError)(error)) return false;
	}
	const packageInfo = require_managed_npm_retention.resolveRetainedManagedNpmInstallPackageInfo(installPath);
	if (!packageInfo || packageInfo.packageName !== params.recovered.resolvedName) return false;
	const normalizeForComparison = (value) => {
		const resolved = node_path.default.resolve(value);
		return process.platform === "win32" ? (0, _openclaw_fs_safe_path.normalizeWindowsPathForComparison)(resolved) : resolved;
	};
	const npmRoot = normalizeForComparison(params.npmRoot);
	return normalizeForComparison(packageInfo.projectRoot) === npmRoot || normalizeForComparison(node_path.default.dirname(packageInfo.projectRoot)) === normalizeForComparison(require_install_paths.resolvePluginNpmProjectsDir(params.npmRoot));
}
function mergeRecoveredManagedNpmMetadata(persisted, recovered, options = {}) {
	const next = {
		...persisted,
		...recovered
	};
	if (options.preservePersistedSpec) {
		const persistedSpec = persisted.spec ? require_npm_registry_spec.parseRegistryNpmSpec(persisted.spec) : null;
		const selectorIsCompatible = persistedSpec !== null && require_npm_registry_spec.isPrereleaseResolutionAllowed({
			spec: persistedSpec,
			resolvedVersion: recovered.resolvedVersion
		}) && (persistedSpec.selectorKind !== "exact-version" || persistedSpec.selector !== void 0 && recovered.resolvedVersion !== void 0 && require_semver.compareValidSemver(persistedSpec.selector, recovered.resolvedVersion) === 0);
		if (persistedSpec?.name === recovered.resolvedName && selectorIsCompatible) next.spec = persisted.spec;
	}
	delete next.integrity;
	delete next.shasum;
	delete next.resolvedAt;
	delete next.installedAt;
	return next;
}
function mergeRecoveredManagedNpmRecord(params) {
	if (params.persisted && isUnavailableManagedNpmInstallRecord(params)) return mergeRecoveredManagedNpmMetadata(params.persisted, params.recovered, { preservePersistedSpec: true });
	const persistedVersion = readInstallRecordVersion(params.persisted);
	const recoveredVersion = readInstallRecordVersion(params.recovered);
	if (params.persisted?.source === "npm" && recordsShareInstallPath(params.persisted, params.recovered) && recoveredVersion && persistedVersion !== recoveredVersion) return mergeRecoveredManagedNpmMetadata(params.persisted, params.recovered);
	return params.persisted ?? params.recovered;
}
function mergeRecoveredManagedNpmInstallRecords(persisted, options) {
	const npmRoot = resolveRecoveredManagedNpmRoot(options);
	const recovered = buildRecoveredManagedNpmInstallRecords(options);
	const merged = { ...persisted };
	for (const [pluginId, record] of Object.entries(recovered)) merged[pluginId] = mergeRecoveredManagedNpmRecord({
		npmRoot,
		persisted: merged[pluginId],
		recovered: record
	});
	return merged;
}
function extractPluginInstallRecordsFromPersistedInstalledPluginIndex(index) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(index)) return null;
	if (Object.hasOwn(index, "installRecords")) return readRecordMap(index.installRecords) ?? {};
	if (Object.hasOwn(index, "records")) return readRecordMap(index.records) ?? {};
	if (!Array.isArray(index.plugins)) return null;
	const records = {};
	for (const entry of index.plugins) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || typeof entry.pluginId !== "string" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.installRecord)) continue;
		if (!isSafeRecordKey(entry.pluginId)) continue;
		records[entry.pluginId] = structuredClone(entry.installRecord);
	}
	return records;
}
function parseJsonColumn(value) {
	try {
		return JSON.parse(value);
	} catch {
		return;
	}
}
function readPersistedInstalledPluginIndexForRecords(options = {}) {
	const storePath = resolveInstalledPluginIndexStorePath(options);
	if (!node_fs.default.existsSync(storePath)) return null;
	if (options.filePath?.endsWith(".json")) return (0, _openclaw_fs_safe_json.tryReadJsonSync)(options.filePath);
	try {
		return require_openclaw_state_db_readonly.withOperatorStateDatabaseReadOnly(({ db }) => {
			const row = db.prepare(`
            SELECT install_records_json, plugins_json
              FROM installed_plugin_index
             WHERE index_key = ?
          `).get("installed-plugin-index");
			if (!row) return null;
			return {
				installRecords: parseJsonColumn(row.install_records_json),
				plugins: parseJsonColumn(row.plugins_json)
			};
		}, resolveInstalledPluginIndexStateDatabaseOptions(options));
	} catch {
		return null;
	}
}
/** Reads install records from the persisted installed plugin index. */
async function readPersistedInstalledPluginIndexInstallRecords(options = {}) {
	return extractPluginInstallRecordsFromPersistedInstalledPluginIndex(readPersistedInstalledPluginIndexForRecords(options));
}
/** Synchronously reads install records from the persisted installed plugin index. */
function readPersistedInstalledPluginIndexInstallRecordsSync(options = {}) {
	return extractPluginInstallRecordsFromPersistedInstalledPluginIndex(readPersistedInstalledPluginIndexForRecords(options));
}
function resolveInstallRecordsCacheKey(options) {
	return [node_path.default.resolve(resolveInstalledPluginIndexStorePath(options)), resolveRecoveredManagedNpmRoot(options)].join("\0");
}
/** Loads installed plugin records, recovering managed npm installs and caching the result. */
async function loadInstalledPluginIndexInstallRecords(params = {}) {
	const cacheKey = resolveInstallRecordsCacheKey(params);
	const cached = getInstalledPluginIndexInstallRecordsCache(cacheKey);
	if (cached) return cloneInstallRecords(cached.records);
	const cacheGeneration = getInstalledPluginIndexInstallRecordsCacheGeneration();
	const records = cloneInstallRecords(mergeRecoveredManagedNpmInstallRecords(await readPersistedInstalledPluginIndexInstallRecords(params), params));
	if (cacheGeneration !== getInstalledPluginIndexInstallRecordsCacheGeneration()) return await loadInstalledPluginIndexInstallRecords(params);
	setInstalledPluginIndexInstallRecordsCache(cacheKey, { records });
	return cloneInstallRecords(records);
}
/** Synchronously loads installed plugin records, recovering managed npm installs and caching them. */
function loadInstalledPluginIndexInstallRecordsSync(params = {}) {
	const cacheKey = resolveInstallRecordsCacheKey(params);
	const cached = getInstalledPluginIndexInstallRecordsCache(cacheKey);
	if (cached) return cloneInstallRecords(cached.records);
	const records = cloneInstallRecords(mergeRecoveredManagedNpmInstallRecords(readPersistedInstalledPluginIndexInstallRecordsSync(params), params));
	setInstalledPluginIndexInstallRecordsCache(cacheKey, { records });
	return cloneInstallRecords(records);
}
//#endregion
Object.defineProperty(exports, "clearLoadInstalledPluginIndexInstallRecordsCache", {
	enumerable: true,
	get: function() {
		return clearLoadInstalledPluginIndexInstallRecordsCache;
	}
});
Object.defineProperty(exports, "loadInstalledPluginIndexInstallRecords", {
	enumerable: true,
	get: function() {
		return loadInstalledPluginIndexInstallRecords;
	}
});
Object.defineProperty(exports, "loadInstalledPluginIndexInstallRecordsSync", {
	enumerable: true,
	get: function() {
		return loadInstalledPluginIndexInstallRecordsSync;
	}
});
Object.defineProperty(exports, "readPersistedInstalledPluginIndexInstallRecords", {
	enumerable: true,
	get: function() {
		return readPersistedInstalledPluginIndexInstallRecords;
	}
});
Object.defineProperty(exports, "resolveInstalledPluginIndexStateDatabaseOptions", {
	enumerable: true,
	get: function() {
		return resolveInstalledPluginIndexStateDatabaseOptions;
	}
});
Object.defineProperty(exports, "resolveInstalledPluginIndexStorePath", {
	enumerable: true,
	get: function() {
		return resolveInstalledPluginIndexStorePath;
	}
});
Object.defineProperty(exports, "resolveLegacyInstalledPluginIndexStorePath", {
	enumerable: true,
	get: function() {
		return resolveLegacyInstalledPluginIndexStorePath;
	}
});
