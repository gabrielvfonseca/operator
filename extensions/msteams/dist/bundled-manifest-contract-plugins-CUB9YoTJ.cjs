const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_activation_context = require("./activation-context-BlXZi9Mx.cjs");
//#region src/plugins/bundled-manifest-contract-plugins.ts
/** Lists bundled plugin ids with a non-empty contract contribution in a manifest snapshot. */
function listBundledManifestContractPluginIds(params) {
	const onlyPluginIdSet = require_current_plugin_metadata_snapshot.createPluginIdScopeSet(params.onlyPluginIds);
	return params.plugins.filter((plugin) => plugin.origin === "bundled" && (!onlyPluginIdSet || onlyPluginIdSet.has(plugin.id)) && (plugin.contracts?.[params.contract]?.length ?? 0) > 0).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
/** Applies config activation and compatibility rules before returning bundled contract owners. */
function resolveEnabledBundledManifestContractPlugins(params) {
	if (params.config?.plugins?.enabled === false) return [];
	let manifestRecords;
	const loadManifestRecords = (config) => {
		manifestRecords ??= require_manifest_contract_eligibility.loadManifestContractSnapshot({
			config,
			workspaceDir: params.workspaceDir,
			env: params.env
		}).plugins;
		return manifestRecords;
	};
	const activation = require_activation_context.resolveBundledPluginCompatibleLoadValues({
		rawConfig: params.config,
		env: params.env,
		workspaceDir: params.workspaceDir,
		onlyPluginIds: params.onlyPluginIds,
		applyAutoEnable: true,
		compatMode: params.compatMode,
		resolveCompatPluginIds: (compatParams) => listBundledManifestContractPluginIds({
			plugins: loadManifestRecords(compatParams.config),
			contract: params.contract,
			onlyPluginIds: compatParams.onlyPluginIds
		})
	});
	const normalizedPlugins = require_config_state.normalizePluginsConfig(activation.config?.plugins);
	const activationSource = require_config_state.createPluginActivationSource({ config: activation.activationSourceConfig });
	const onlyPluginIdSet = require_current_plugin_metadata_snapshot.createPluginIdScopeSet(params.onlyPluginIds);
	return loadManifestRecords(activation.config).filter((plugin) => {
		if (plugin.origin !== "bundled" || onlyPluginIdSet && !onlyPluginIdSet.has(plugin.id) || (plugin.contracts?.[params.contract]?.length ?? 0) === 0) return false;
		return require_config_state.resolveEffectivePluginActivationState({
			id: plugin.id,
			origin: plugin.origin,
			config: normalizedPlugins,
			rootConfig: activation.config,
			enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(plugin),
			activationSource
		}).enabled;
	});
}
//#endregion
Object.defineProperty(exports, "resolveEnabledBundledManifestContractPlugins", {
	enumerable: true,
	get: function() {
		return resolveEnabledBundledManifestContractPlugins;
	}
});
