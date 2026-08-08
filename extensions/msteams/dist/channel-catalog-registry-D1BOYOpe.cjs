const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/channel-catalog-registry.ts
function listChannelCatalogEntries(params = {}) {
	const installRecords = resolveInstallRecords(params);
	return (params.discovery ?? require_discovery.discoverOperatorPlugins({
		workspaceDir: params.workspaceDir,
		env: params.env,
		extraPaths: params.extraPaths,
		...installRecords && Object.keys(installRecords).length > 0 ? { installRecords } : {}
	})).candidates.flatMap((candidate) => {
		if (params.origin && candidate.origin !== params.origin) return [];
		const channel = candidate.packageManifest?.channel;
		if (!channel?.id) return [];
		const pluginId = resolveChannelCatalogPluginId(candidate);
		if (!pluginId) return [];
		return [{
			pluginId,
			origin: candidate.origin,
			packageName: candidate.packageName,
			workspaceDir: candidate.workspaceDir,
			rootDir: candidate.rootDir,
			channel,
			...candidate.packageManifest?.install ? { install: candidate.packageManifest.install } : {}
		}];
	});
}
function resolveChannelCatalogPluginId(candidate) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.bundledManifest?.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.bundledManifestId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.packageManifest?.plugin?.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.idHint);
}
function resolveInstallRecords(params) {
	if (params.installRecords) return params.installRecords;
	if (params.origin === "bundled") return;
	try {
		return require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecordsSync(params.env ? { env: params.env } : {});
	} catch {
		return;
	}
}
//#endregion
Object.defineProperty(exports, "listChannelCatalogEntries", {
	enumerable: true,
	get: function() {
		return listChannelCatalogEntries;
	}
});
