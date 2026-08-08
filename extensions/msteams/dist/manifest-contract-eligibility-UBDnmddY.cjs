const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/manifest-contract-eligibility.ts
function isManifestPluginAvailableForControlPlane(params) {
	if (params.plugin.origin === "bundled") return true;
	return require_installed_plugin_index.isInstalledPluginEnabled(params.snapshot.index, params.plugin.id, params.config);
}
function hasManifestContractValue(params) {
	const values = params.plugin.contracts?.[params.contract] ?? [];
	return values.length > 0 && (!params.value || values.includes(params.value));
}
function listAvailableManifestContractPlugins(params) {
	return params.snapshot.plugins.filter((plugin) => hasManifestContractValue({
		plugin,
		contract: params.contract,
		value: params.value
	}) && isManifestPluginAvailableForControlPlane({
		snapshot: params.snapshot,
		plugin,
		config: params.config
	}));
}
function listAvailableManifestContractValues(params) {
	const values = /* @__PURE__ */ new Set();
	for (const plugin of listAvailableManifestContractPlugins(params)) for (const value of plugin.contracts?.[params.contract] ?? []) values.add(value);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(values);
}
function loadManifestContractSnapshot(params) {
	const snapshot = loadManifestMetadataSnapshot(params);
	return {
		index: snapshot.index,
		plugins: snapshot.plugins
	};
}
function loadManifestMetadataSnapshot(params) {
	return require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: params.config ?? {},
		env: params.env ?? process.env,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		allowWorkspaceScopedCurrent: params.workspaceDir === void 0
	});
}
//#endregion
Object.defineProperty(exports, "hasManifestContractValue", {
	enumerable: true,
	get: function() {
		return hasManifestContractValue;
	}
});
Object.defineProperty(exports, "isManifestPluginAvailableForControlPlane", {
	enumerable: true,
	get: function() {
		return isManifestPluginAvailableForControlPlane;
	}
});
Object.defineProperty(exports, "listAvailableManifestContractPlugins", {
	enumerable: true,
	get: function() {
		return listAvailableManifestContractPlugins;
	}
});
Object.defineProperty(exports, "listAvailableManifestContractValues", {
	enumerable: true,
	get: function() {
		return listAvailableManifestContractValues;
	}
});
Object.defineProperty(exports, "loadManifestContractSnapshot", {
	enumerable: true,
	get: function() {
		return loadManifestContractSnapshot;
	}
});
Object.defineProperty(exports, "loadManifestMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return loadManifestMetadataSnapshot;
	}
});
