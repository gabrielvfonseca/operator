const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/manifest-contract-runtime.ts
var manifest_contract_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolveManifestContractRuntimePluginResolution: () => resolveManifestContractRuntimePluginResolution });
function resolveManifestContractRuntimePluginResolution(params) {
	const snapshot = require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: params.cfg ?? {},
		env: process.env
	});
	const allContractPlugins = snapshot.plugins.filter((plugin) => require_manifest_contract_eligibility.hasManifestContractValue({
		plugin,
		contract: params.contract,
		value: params.value
	}));
	const bundledCompatPluginIds = allContractPlugins.filter((plugin) => plugin.origin === "bundled").map((plugin) => plugin.id);
	return {
		pluginIds: (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(require_manifest_contract_eligibility.listAvailableManifestContractPlugins({
			snapshot: {
				index: snapshot.index,
				plugins: allContractPlugins
			},
			contract: params.contract,
			value: params.value,
			config: params.cfg
		}).map((plugin) => plugin.id)),
		bundledCompatPluginIds: (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(bundledCompatPluginIds)
	};
}
//#endregion
Object.defineProperty(exports, "manifest_contract_runtime_exports", {
	enumerable: true,
	get: function() {
		return manifest_contract_runtime_exports;
	}
});
Object.defineProperty(exports, "resolveManifestContractRuntimePluginResolution", {
	enumerable: true,
	get: function() {
		return resolveManifestContractRuntimePluginResolution;
	}
});
