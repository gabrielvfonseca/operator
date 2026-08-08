const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_zod_parse = require("./zod-parse-D5uufcMS.cjs");
const require_plugin_metadata_lifecycle = require("./plugin-metadata-lifecycle-L5oN3AE5.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_openclaw_state_db_readonly = require("./openclaw-state-db-readonly-tU1PH4QL.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
let node_fs = require("node:fs");
let zod = require("zod");
//#region src/plugins/installed-plugin-index-config-path-scope.ts
/** Compat code marking install records that need config-path activation metadata. */
const CONFIG_PATH_ACTIVATION_COMPAT_CODE = "activation-config-path-hint";
function recordUsesConfigPathActivation(plugin) {
	return plugin.compat.includes(CONFIG_PATH_ACTIVATION_COMPAT_CODE);
}
/** True when an index still has config-path activation records missing startup metadata. */
function hasMissingConfigPathActivationMetadata(index) {
	return index.plugins.some((plugin) => recordUsesConfigPathActivation(plugin) && plugin.startup.configPaths === void 0);
}
/** True when a record migrated config-path activation startup metadata. */
function hasConfigPathActivationMetadataMigration(params) {
	return recordUsesConfigPathActivation(params.previous) && params.previous.startup.configPaths === void 0 && params.current.startup.configPaths !== void 0;
}
//#endregion
//#region src/plugins/installed-plugin-index-invalidation.ts
function diffInstalledPluginIndexInvalidationReasons(previous, current) {
	const reasons = /* @__PURE__ */ new Set();
	if (previous.version !== current.version) reasons.add("missing");
	if (previous.hostContractVersion !== current.hostContractVersion) reasons.add("host-contract-changed");
	if (previous.compatRegistryVersion !== current.compatRegistryVersion) reasons.add("compat-registry-changed");
	if (previous.migrationVersion !== current.migrationVersion) reasons.add("migration");
	if (previous.policyHash !== current.policyHash) reasons.add("policy-changed");
	if (require_installed_plugin_index.hashJson(previous.installRecords ?? {}) !== require_installed_plugin_index.hashJson(current.installRecords ?? {})) reasons.add("source-changed");
	const previousByPluginId = new Map(previous.plugins.map((plugin) => [plugin.pluginId, plugin]));
	const currentByPluginId = new Map(current.plugins.map((plugin) => [plugin.pluginId, plugin]));
	for (const [pluginId, previousPlugin] of previousByPluginId) {
		const currentPlugin = currentByPluginId.get(pluginId);
		if (!currentPlugin) {
			reasons.add("source-changed");
			continue;
		}
		if (previousPlugin.rootDir !== currentPlugin.rootDir || previousPlugin.manifestPath !== currentPlugin.manifestPath || previousPlugin.installRecordHash !== currentPlugin.installRecordHash) reasons.add("source-changed");
		if (previousPlugin.enabled !== currentPlugin.enabled) reasons.add("policy-changed");
		if (hasConfigPathActivationMetadataMigration({
			previous: previousPlugin,
			current: currentPlugin
		})) reasons.add("migration");
		if (previousPlugin.manifestHash !== currentPlugin.manifestHash) reasons.add("stale-manifest");
		if (previousPlugin.packageVersion !== currentPlugin.packageVersion || previousPlugin.packageJson?.path !== currentPlugin.packageJson?.path || previousPlugin.packageJson?.hash !== currentPlugin.packageJson?.hash) reasons.add("stale-package");
	}
	for (const pluginId of currentByPluginId.keys()) if (!previousByPluginId.has(pluginId)) {
		if (currentByPluginId.get(pluginId)?.enabled === false) continue;
		reasons.add("source-changed");
	}
	return Array.from(reasons).toSorted((left, right) => left.localeCompare(right));
}
//#endregion
//#region src/plugins/installed-plugin-index-store.ts
/** Persists, inspects, and refreshes the installed plugin index in the state database. */
const StringArraySchema = zod.z.array(zod.z.string());
const INSTALLED_PLUGIN_INDEX_SQLITE_KEY = "installed-plugin-index";
const InstalledPluginIndexStartupSchema = zod.z.object({
	sidecar: zod.z.boolean(),
	memory: zod.z.boolean(),
	deferConfiguredChannelFullLoadUntilAfterListen: zod.z.boolean(),
	agentHarnesses: StringArraySchema,
	configPaths: StringArraySchema.optional()
});
const InstalledPluginIndexContributionSchema = zod.z.object({
	channels: StringArraySchema,
	channelConfigs: StringArraySchema,
	providers: StringArraySchema,
	modelCatalogProviders: StringArraySchema,
	modelSupportPrefixes: StringArraySchema,
	modelSupportPatterns: StringArraySchema,
	autoEnableProviderIds: StringArraySchema,
	commandAliases: StringArraySchema,
	contracts: zod.z.record(zod.z.string(), StringArraySchema)
});
const InstalledPluginFileSignatureSchema = zod.z.object({
	size: zod.z.number(),
	mtimeMs: zod.z.number(),
	ctimeMs: zod.z.number().optional()
});
const InstalledPluginIndexRecordSchema = zod.z.object({
	pluginId: zod.z.string(),
	packageName: zod.z.string().optional(),
	packageVersion: zod.z.string().optional(),
	installRecord: zod.z.record(zod.z.string(), zod.z.unknown()).optional(),
	installRecordHash: zod.z.string().optional(),
	packageInstall: zod.z.unknown().optional(),
	packageChannel: zod.z.unknown().optional(),
	packageBuild: zod.z.object({ bundledDist: zod.z.boolean().optional() }).optional(),
	manifestPath: zod.z.string(),
	manifestHash: zod.z.string(),
	manifestFile: InstalledPluginFileSignatureSchema.optional(),
	format: zod.z.string().optional(),
	bundleFormat: zod.z.string().optional(),
	source: zod.z.string().optional(),
	setupSource: zod.z.string().optional(),
	packageJson: zod.z.object({
		path: zod.z.string(),
		hash: zod.z.string(),
		fileSignature: InstalledPluginFileSignatureSchema.optional()
	}).optional(),
	rootDir: zod.z.string(),
	origin: zod.z.string(),
	enabled: zod.z.boolean(),
	enabledByDefault: zod.z.boolean().optional(),
	enabledByDefaultOnPlatforms: StringArraySchema.optional(),
	syntheticAuthRefs: StringArraySchema.optional(),
	startup: InstalledPluginIndexStartupSchema,
	contributions: InstalledPluginIndexContributionSchema.optional(),
	compat: zod.z.array(zod.z.string())
});
const InstalledPluginInstallRecordSchema = zod.z.record(zod.z.string(), zod.z.unknown());
const PluginDiagnosticSchema = zod.z.object({
	level: zod.z.union([zod.z.literal("warn"), zod.z.literal("error")]),
	message: zod.z.string(),
	pluginId: zod.z.string().optional(),
	source: zod.z.string().optional()
});
const InstalledPluginIndexSchema = zod.z.object({
	version: zod.z.literal(1),
	warning: zod.z.string().optional(),
	hostContractVersion: zod.z.string(),
	compatRegistryVersion: zod.z.string(),
	migrationVersion: zod.z.literal(1),
	policyHash: zod.z.string(),
	generatedAtMs: zod.z.number(),
	refreshReason: zod.z.string().optional(),
	installRecords: zod.z.record(zod.z.string(), InstalledPluginInstallRecordSchema).optional(),
	plugins: zod.z.array(InstalledPluginIndexRecordSchema),
	diagnostics: zod.z.array(PluginDiagnosticSchema)
});
function copySafeInstallRecords(records) {
	if (!records) return;
	const safeRecords = {};
	for (const [pluginId, record] of Object.entries(records)) {
		if (require_prototype_keys.isBlockedObjectKey(pluginId)) continue;
		safeRecords[pluginId] = record;
	}
	return safeRecords;
}
function parseInstalledPluginIndex(value) {
	const parsed = require_zod_parse.safeParseWithSchema(InstalledPluginIndexSchema, value);
	if (!parsed) return null;
	const installRecords = copySafeInstallRecords(parsed.installRecords) ?? copySafeInstallRecords(require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(parsed)) ?? {};
	return {
		version: parsed.version,
		...parsed.warning ? { warning: parsed.warning } : {},
		hostContractVersion: parsed.hostContractVersion,
		compatRegistryVersion: parsed.compatRegistryVersion,
		migrationVersion: parsed.migrationVersion,
		policyHash: parsed.policyHash,
		generatedAtMs: parsed.generatedAtMs,
		...parsed.refreshReason ? { refreshReason: parsed.refreshReason } : {},
		installRecords,
		plugins: parsed.plugins,
		diagnostics: parsed.diagnostics
	};
}
function isExplicitLegacyJsonStorePath(options) {
	return Boolean(options.filePath?.endsWith(".json"));
}
function readLegacyRecordContainer(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return;
	const legacy = value;
	return legacy.installRecords ?? legacy.records;
}
function readPersistedInstalledPluginIndexFromLegacyJson(options) {
	if (!options.filePath || !(0, node_fs.existsSync)(options.filePath)) return null;
	try {
		const parsed = JSON.parse((0, node_fs.readFileSync)(options.filePath, "utf8"));
		const current = parseInstalledPluginIndex(parsed);
		if (current) return current;
		const installRecords = readLegacyRecordContainer(parsed);
		if (!installRecords) return null;
		return parseInstalledPluginIndex({
			version: 1,
			hostContractVersion: "legacy-file",
			compatRegistryVersion: "legacy-file",
			migrationVersion: 1,
			policyHash: "legacy-file",
			generatedAtMs: 0,
			installRecords,
			plugins: [],
			diagnostics: []
		});
	} catch {
		return null;
	}
}
function assertWritableInstalledPluginIndexStoreOptions(options) {
	if (isExplicitLegacyJsonStorePath(options)) throw new Error("Explicit JSON installed plugin index paths are retired. Use the shared SQLite state DB or run openclaw doctor --fix to migrate legacy plugins/installs.json.");
}
function parseJsonColumn(value) {
	try {
		return JSON.parse(value);
	} catch {
		return;
	}
}
function parseInstalledPluginIndexSqliteRow(row) {
	if (!row) return null;
	return parseInstalledPluginIndex({
		version: Number(row.version),
		...row.warning ? { warning: row.warning } : {},
		hostContractVersion: row.host_contract_version,
		compatRegistryVersion: row.compat_registry_version,
		migrationVersion: Number(row.migration_version),
		policyHash: row.policy_hash,
		generatedAtMs: Number(row.generated_at_ms),
		...row.refresh_reason ? { refreshReason: row.refresh_reason } : {},
		installRecords: parseJsonColumn(row.install_records_json),
		plugins: parseJsonColumn(row.plugins_json),
		diagnostics: parseJsonColumn(row.diagnostics_json)
	});
}
function readPersistedInstalledPluginIndexFromSqlite(options = {}) {
	if (isExplicitLegacyJsonStorePath(options)) return readPersistedInstalledPluginIndexFromLegacyJson(options);
	if (!(0, node_fs.existsSync)(require_installed_plugin_index_record_reader.resolveInstalledPluginIndexStorePath(options))) return null;
	try {
		return require_openclaw_state_db_readonly.withOperatorStateDatabaseReadOnly(({ db }) => {
			return parseInstalledPluginIndexSqliteRow(db.prepare(`
            SELECT version, warning, host_contract_version, compat_registry_version,
                   migration_version, policy_hash, generated_at_ms, refresh_reason,
                   install_records_json, plugins_json, diagnostics_json
              FROM installed_plugin_index
             WHERE index_key = ?
          `).get(INSTALLED_PLUGIN_INDEX_SQLITE_KEY));
		}, require_installed_plugin_index_record_reader.resolveInstalledPluginIndexStateDatabaseOptions(options));
	} catch {
		return null;
	}
}
function writePersistedInstalledPluginIndexToSqlite(index, options = {}) {
	assertWritableInstalledPluginIndexStoreOptions(options);
	const persisted = {
		...index,
		warning: require_installed_plugin_index.INSTALLED_PLUGIN_INDEX_WARNING,
		installRecords: copySafeInstallRecords(index.installRecords) ?? {}
	};
	const now = Date.now();
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		db.prepare(`
        INSERT INTO installed_plugin_index (
          index_key, version, host_contract_version, compat_registry_version,
          migration_version, policy_hash, generated_at_ms, refresh_reason,
          install_records_json, plugins_json, diagnostics_json, warning, updated_at_ms
        ) VALUES (
          @index_key, @version, @host_contract_version, @compat_registry_version,
          @migration_version, @policy_hash, @generated_at_ms, @refresh_reason,
          @install_records_json, @plugins_json, @diagnostics_json, @warning, @updated_at_ms
        )
        ON CONFLICT(index_key) DO UPDATE SET
          version = excluded.version,
          host_contract_version = excluded.host_contract_version,
          compat_registry_version = excluded.compat_registry_version,
          migration_version = excluded.migration_version,
          policy_hash = excluded.policy_hash,
          generated_at_ms = excluded.generated_at_ms,
          refresh_reason = excluded.refresh_reason,
          install_records_json = excluded.install_records_json,
          plugins_json = excluded.plugins_json,
          diagnostics_json = excluded.diagnostics_json,
          warning = excluded.warning,
          updated_at_ms = excluded.updated_at_ms
      `).run({
			index_key: INSTALLED_PLUGIN_INDEX_SQLITE_KEY,
			version: persisted.version,
			host_contract_version: persisted.hostContractVersion,
			compat_registry_version: persisted.compatRegistryVersion,
			migration_version: persisted.migrationVersion,
			policy_hash: persisted.policyHash,
			generated_at_ms: persisted.generatedAtMs,
			refresh_reason: persisted.refreshReason ?? null,
			install_records_json: JSON.stringify(persisted.installRecords),
			plugins_json: JSON.stringify(persisted.plugins),
			diagnostics_json: JSON.stringify(persisted.diagnostics),
			warning: persisted.warning,
			updated_at_ms: now
		});
	}, require_installed_plugin_index_record_reader.resolveInstalledPluginIndexStateDatabaseOptions(options));
}
async function readPersistedInstalledPluginIndex(options = {}) {
	return readPersistedInstalledPluginIndexFromSqlite(options);
}
function readPersistedInstalledPluginIndexSync(options = {}) {
	return readPersistedInstalledPluginIndexFromSqlite(options);
}
async function writePersistedInstalledPluginIndex(index, options = {}) {
	const filePath = require_installed_plugin_index_record_reader.resolveInstalledPluginIndexStorePath(options);
	writePersistedInstalledPluginIndexToSqlite(index, options);
	require_plugin_metadata_lifecycle.clearPluginMetadataLifecycleCaches();
	require_installed_plugin_index_record_reader.clearLoadInstalledPluginIndexInstallRecordsCache();
	return filePath;
}
function writePersistedInstalledPluginIndexSync(index, options = {}) {
	const filePath = require_installed_plugin_index_record_reader.resolveInstalledPluginIndexStorePath(options);
	writePersistedInstalledPluginIndexToSqlite(index, options);
	require_plugin_metadata_lifecycle.clearPluginMetadataLifecycleCaches();
	require_installed_plugin_index_record_reader.clearLoadInstalledPluginIndexInstallRecordsCache();
	return filePath;
}
function hasPolicyRefreshTargets(persisted, policyPluginIds) {
	if (!policyPluginIds || policyPluginIds.length === 0) return true;
	const pluginIds = new Set(persisted.plugins.map((plugin) => plugin.pluginId));
	return policyPluginIds.every((pluginId) => pluginIds.has(pluginId));
}
function canRefreshPersistedPolicyState(persisted, params) {
	if (!persisted || params.reason !== "policy-changed") return false;
	const env = params.env ?? process.env;
	if (persisted.version !== 1 || persisted.hostContractVersion !== require_version.resolveCompatibilityHostVersion(env) || persisted.compatRegistryVersion !== require_installed_plugin_index.resolveCompatRegistryVersion() || persisted.migrationVersion !== 1 || hasMissingConfigPathActivationMetadata(persisted)) return false;
	if (params.installRecords && require_installed_plugin_index.hashJson(params.installRecords) !== require_installed_plugin_index.hashJson(persisted.installRecords ?? {})) return false;
	return hasPolicyRefreshTargets(persisted, params.policyPluginIds);
}
function refreshPersistedPolicyState(persisted, params) {
	const normalizedConfig = require_config_state.normalizePluginsConfig(params.config?.plugins);
	return {
		...persisted,
		policyHash: require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(params.config),
		generatedAtMs: (params.now?.() ?? /* @__PURE__ */ new Date()).getTime(),
		refreshReason: params.reason,
		plugins: persisted.plugins.map((plugin) => ({
			...plugin,
			enabled: require_config_state.resolveEffectiveEnableState({
				id: plugin.pluginId,
				origin: plugin.origin,
				config: normalizedConfig,
				rootConfig: params.config,
				enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(plugin)
			}).enabled
		}))
	};
}
async function inspectPersistedInstalledPluginIndex(params = {}) {
	const persisted = await readPersistedInstalledPluginIndex(params);
	const current = require_installed_plugin_index.loadInstalledPluginIndex({
		...params,
		installRecords: params.installRecords ?? require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(persisted)
	});
	if (!persisted) return {
		state: "missing",
		refreshReasons: ["missing"],
		persisted: null,
		current
	};
	const refreshReasons = diffInstalledPluginIndexInvalidationReasons(persisted, current);
	return {
		state: refreshReasons.length > 0 ? "stale" : "fresh",
		refreshReasons,
		persisted,
		current
	};
}
async function refreshPersistedInstalledPluginIndex(params) {
	const persisted = params.reason === "policy-changed" || !params.installRecords ? await readPersistedInstalledPluginIndex(params) : null;
	if (canRefreshPersistedPolicyState(persisted, params)) {
		const index = refreshPersistedPolicyState(persisted, params);
		await writePersistedInstalledPluginIndex(index, params);
		return index;
	}
	const index = require_installed_plugin_index.refreshInstalledPluginIndex({
		...params,
		installRecords: params.installRecords ?? require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(persisted)
	});
	await writePersistedInstalledPluginIndex(index, params);
	return index;
}
function refreshPersistedInstalledPluginIndexSync(params) {
	const persisted = params.reason === "policy-changed" || !params.installRecords ? readPersistedInstalledPluginIndexSync(params) : null;
	if (canRefreshPersistedPolicyState(persisted, params)) {
		const index = refreshPersistedPolicyState(persisted, params);
		writePersistedInstalledPluginIndexSync(index, params);
		return index;
	}
	const index = require_installed_plugin_index.refreshInstalledPluginIndex({
		...params,
		installRecords: params.installRecords ?? require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(persisted)
	});
	writePersistedInstalledPluginIndexSync(index, params);
	return index;
}
//#endregion
Object.defineProperty(exports, "CONFIG_PATH_ACTIVATION_COMPAT_CODE", {
	enumerable: true,
	get: function() {
		return CONFIG_PATH_ACTIVATION_COMPAT_CODE;
	}
});
Object.defineProperty(exports, "hasMissingConfigPathActivationMetadata", {
	enumerable: true,
	get: function() {
		return hasMissingConfigPathActivationMetadata;
	}
});
Object.defineProperty(exports, "inspectPersistedInstalledPluginIndex", {
	enumerable: true,
	get: function() {
		return inspectPersistedInstalledPluginIndex;
	}
});
Object.defineProperty(exports, "parseInstalledPluginIndex", {
	enumerable: true,
	get: function() {
		return parseInstalledPluginIndex;
	}
});
Object.defineProperty(exports, "readPersistedInstalledPluginIndex", {
	enumerable: true,
	get: function() {
		return readPersistedInstalledPluginIndex;
	}
});
Object.defineProperty(exports, "readPersistedInstalledPluginIndexSync", {
	enumerable: true,
	get: function() {
		return readPersistedInstalledPluginIndexSync;
	}
});
Object.defineProperty(exports, "refreshPersistedInstalledPluginIndex", {
	enumerable: true,
	get: function() {
		return refreshPersistedInstalledPluginIndex;
	}
});
Object.defineProperty(exports, "refreshPersistedInstalledPluginIndexSync", {
	enumerable: true,
	get: function() {
		return refreshPersistedInstalledPluginIndexSync;
	}
});
Object.defineProperty(exports, "writePersistedInstalledPluginIndex", {
	enumerable: true,
	get: function() {
		return writePersistedInstalledPluginIndex;
	}
});
Object.defineProperty(exports, "writePersistedInstalledPluginIndexSync", {
	enumerable: true,
	get: function() {
		return writePersistedInstalledPluginIndexSync;
	}
});
