const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_installed_plugin_index_store = require("./installed-plugin-index-store-vrROJGFd.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
//#region src/plugins/installs.ts
const CLAWHUB_TRUST_INSTALL_RECORD_FIELDS = [
	"clawhubTrustDisposition",
	"clawhubTrustScanStatus",
	"clawhubTrustModerationState",
	"clawhubTrustReasons",
	"clawhubTrustPending",
	"clawhubTrustStale",
	"clawhubTrustCheckedAt",
	"clawhubTrustAcknowledgedAt"
];
/** Builds install record fields from resolved npm package metadata. */
function buildNpmResolutionInstallFields(resolution) {
	return require_install_source_utils.buildNpmResolutionFields(resolution);
}
function isExactRegistryNpmSpec(spec) {
	return (spec ? require_npm_registry_spec.parseRegistryNpmSpec(spec) : null)?.selectorKind === "exact-version";
}
function resolveNpmInstallRecordSpec(params) {
	const resolvedSpec = params.resolution?.resolvedSpec;
	if (!params.pinResolvedRegistrySpec || !isExactRegistryNpmSpec(resolvedSpec)) return params.requestedSpec;
	return resolvedSpec;
}
/** Records or updates a plugin install record in Operator config. */
function recordPluginInstall(cfg, update) {
	const { pluginId, ...record } = update;
	const nextRecord = {
		...clearStaleInstallRecordFields(cfg.plugins?.installs?.[pluginId]),
		...record,
		installedAt: record.installedAt ?? (/* @__PURE__ */ new Date()).toISOString()
	};
	return {
		...cfg,
		plugins: {
			...cfg.plugins,
			installs: {
				...cfg.plugins?.installs,
				[pluginId]: nextRecord
			}
		}
	};
}
function clearStaleInstallRecordFields(record) {
	if (!record) return;
	const next = { ...record };
	for (const field of CLAWHUB_TRUST_INSTALL_RECORD_FIELDS) delete next[field];
	return next;
}
//#endregion
//#region src/plugins/installed-plugin-index-records.ts
var installed_plugin_index_records_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	PLUGIN_INSTALLS_CONFIG_PATH: () => PLUGIN_INSTALLS_CONFIG_PATH,
	clearLoadInstalledPluginIndexInstallRecordsCache: () => require_installed_plugin_index_record_reader.clearLoadInstalledPluginIndexInstallRecordsCache,
	loadInstalledPluginIndexInstallRecordsSync: () => require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecordsSync,
	readPersistedInstalledPluginIndexInstallRecords: () => require_installed_plugin_index_record_reader.readPersistedInstalledPluginIndexInstallRecords,
	recordPluginInstallInRecords: () => recordPluginInstallInRecords,
	removePluginInstallRecordFromRecords: () => removePluginInstallRecordFromRecords,
	resolveInstalledPluginIndexRecordsStorePath: () => resolveInstalledPluginIndexRecordsStorePath,
	withPluginInstallRecords: () => withPluginInstallRecords,
	withoutPluginInstallRecords: () => withoutPluginInstallRecords,
	writePersistedInstalledPluginIndexInstallRecords: () => writePersistedInstalledPluginIndexInstallRecords,
	writePersistedInstalledPluginIndexInstallRecordsSync: () => writePersistedInstalledPluginIndexInstallRecordsSync
});
/** Config path for legacy plugin install records kept for migration/doctor flows. */
const PLUGIN_INSTALLS_CONFIG_PATH = ["plugins", "installs"];
/** Resolves the installed plugin index record store path. */
function resolveInstalledPluginIndexRecordsStorePath(options = {}) {
	return require_installed_plugin_index_record_reader.resolveInstalledPluginIndexStorePath(options);
}
/** Refreshes persisted installed plugin index records asynchronously. */
async function writePersistedInstalledPluginIndexInstallRecords(records, options = {}) {
	await require_installed_plugin_index_store.refreshPersistedInstalledPluginIndex({
		...options,
		reason: "source-changed",
		installRecords: records
	});
	return resolveInstalledPluginIndexRecordsStorePath(options);
}
/** Refreshes persisted installed plugin index records synchronously. */
function writePersistedInstalledPluginIndexInstallRecordsSync(records, options = {}) {
	require_installed_plugin_index_store.refreshPersistedInstalledPluginIndexSync({
		...options,
		reason: "source-changed",
		installRecords: records
	});
	return resolveInstalledPluginIndexRecordsStorePath(options);
}
/** Returns config with plugin install records attached at the canonical config path. */
function withPluginInstallRecords(config, records) {
	return {
		...config,
		plugins: {
			...config.plugins,
			installs: records
		}
	};
}
/** Returns config with legacy plugin install records removed. */
function withoutPluginInstallRecords(config, options = {}) {
	if (!config.plugins?.installs) return config;
	const { installs: _installs, ...plugins } = config.plugins;
	if (Object.keys(plugins).length === 0) {
		if (options.preserveEmptyPlugins) return {
			...config,
			plugins: {}
		};
		const { plugins: _plugins, ...rest } = config;
		return rest;
	}
	return {
		...config,
		plugins
	};
}
/** Applies one install update to an in-memory install record map. */
function recordPluginInstallInRecords(records, update) {
	return recordPluginInstall({ plugins: { installs: records } }, update).plugins?.installs ?? {};
}
/** Removes one plugin install record from an in-memory record map. */
function removePluginInstallRecordFromRecords(records, pluginId) {
	const { [pluginId]: _removed, ...rest } = records;
	return rest;
}
//#endregion
Object.defineProperty(exports, "PLUGIN_INSTALLS_CONFIG_PATH", {
	enumerable: true,
	get: function() {
		return PLUGIN_INSTALLS_CONFIG_PATH;
	}
});
Object.defineProperty(exports, "buildNpmResolutionInstallFields", {
	enumerable: true,
	get: function() {
		return buildNpmResolutionInstallFields;
	}
});
Object.defineProperty(exports, "installed_plugin_index_records_exports", {
	enumerable: true,
	get: function() {
		return installed_plugin_index_records_exports;
	}
});
Object.defineProperty(exports, "recordPluginInstall", {
	enumerable: true,
	get: function() {
		return recordPluginInstall;
	}
});
Object.defineProperty(exports, "recordPluginInstallInRecords", {
	enumerable: true,
	get: function() {
		return recordPluginInstallInRecords;
	}
});
Object.defineProperty(exports, "removePluginInstallRecordFromRecords", {
	enumerable: true,
	get: function() {
		return removePluginInstallRecordFromRecords;
	}
});
Object.defineProperty(exports, "resolveNpmInstallRecordSpec", {
	enumerable: true,
	get: function() {
		return resolveNpmInstallRecordSpec;
	}
});
Object.defineProperty(exports, "withPluginInstallRecords", {
	enumerable: true,
	get: function() {
		return withPluginInstallRecords;
	}
});
Object.defineProperty(exports, "withoutPluginInstallRecords", {
	enumerable: true,
	get: function() {
		return withoutPluginInstallRecords;
	}
});
Object.defineProperty(exports, "writePersistedInstalledPluginIndexInstallRecords", {
	enumerable: true,
	get: function() {
		return writePersistedInstalledPluginIndexInstallRecords;
	}
});
Object.defineProperty(exports, "writePersistedInstalledPluginIndexInstallRecordsSync", {
	enumerable: true,
	get: function() {
		return writePersistedInstalledPluginIndexInstallRecordsSync;
	}
});
