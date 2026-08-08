const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_activation_context = require("./activation-context-BlXZi9Mx.cjs");
//#region src/plugins/web-provider-resolution-shared.ts
function comparePluginProvidersAlphabetically(left, right) {
	return left.id.localeCompare(right.id) || left.pluginId.localeCompare(right.pluginId);
}
function sortPluginProviders(providers) {
	return providers.toSorted(comparePluginProvidersAlphabetically);
}
/** Sorts provider candidates for auto-detect while keeping equal priorities deterministic. */
function sortPluginProvidersForAutoDetect(providers) {
	return providers.toSorted((left, right) => {
		const leftOrder = left.autoDetectOrder ?? Number.MAX_SAFE_INTEGER;
		const rightOrder = right.autoDetectOrder ?? Number.MAX_SAFE_INTEGER;
		if (leftOrder !== rightOrder) return leftOrder - rightOrder;
		return comparePluginProvidersAlphabetically(left, right);
	});
}
function pluginManifestDeclaresProviderConfig(record, configKey, contract) {
	if ((record.contracts?.[contract]?.length ?? 0) > 0) return true;
	if (Object.keys(record.configUiHints ?? {}).some((key) => key === configKey || key.startsWith(`${configKey}.`))) return true;
	const properties = record.configSchema?.properties;
	return typeof properties === "object" && properties !== null && configKey in properties;
}
function loadInstalledWebProviderManifestRecords(params) {
	const records = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.config ?? {},
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env
	}).plugins;
	const pluginIdSet = require_current_plugin_metadata_snapshot.createPluginIdScopeSet(params.pluginIds);
	return pluginIdSet ? records.filter((plugin) => pluginIdSet.has(plugin.id)) : records;
}
/** Returns only plugin ids for manifest-declared web provider candidates. */
function resolveManifestDeclaredWebProviderCandidatePluginIds(params) {
	return resolveManifestDeclaredWebProviderCandidates(params).pluginIds;
}
/** Resolves manifest-declared web provider candidates without importing plugin runtime code. */
function resolveManifestDeclaredWebProviderCandidates(params) {
	const scopedPluginIds = require_current_plugin_metadata_snapshot.normalizePluginIdScope(params.onlyPluginIds);
	if (scopedPluginIds?.length === 0) return { pluginIds: [] };
	const onlyPluginIdSet = require_current_plugin_metadata_snapshot.createPluginIdScopeSet(scopedPluginIds);
	const manifestRecords = params.manifestRecords ?? loadInstalledWebProviderManifestRecords({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		pluginIds: scopedPluginIds
	});
	const ids = manifestRecords.filter((plugin) => (!params.origin || plugin.origin === params.origin) && (!params.sandboxed || plugin.origin === "bundled" || plugin.trustedOfficialInstall === true) && (!onlyPluginIdSet || onlyPluginIdSet.has(plugin.id)) && pluginManifestDeclaresProviderConfig(plugin, params.configKey, params.contract)).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
	if (ids.length > 0) return {
		pluginIds: ids,
		manifestRecords
	};
	if (params.origin || params.sandboxed || scopedPluginIds !== void 0) return {
		pluginIds: [],
		manifestRecords
	};
	return {
		pluginIds: void 0,
		manifestRecords
	};
}
function resolveBundledWebProviderCompatPluginIds(params) {
	return loadInstalledWebProviderManifestRecords(params).filter((plugin) => plugin.origin === "bundled" && (plugin.contracts?.[params.contract]?.length ?? 0) > 0).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
/** Builds bundled-plugin activation config for provider families with legacy enablement defaults. */
function resolveBundledWebProviderResolutionConfig(params) {
	const activation = require_activation_context.resolveBundledPluginCompatibleLoadValues({
		rawConfig: params.config,
		env: params.env,
		workspaceDir: params.workspaceDir,
		applyAutoEnable: true,
		compatMode: {
			enablement: "always",
			vitest: params.config !== void 0
		},
		resolveCompatPluginIds: (compatParams) => resolveBundledWebProviderCompatPluginIds({
			contract: params.contract,
			...compatParams
		})
	});
	return {
		config: activation.config,
		activationSourceConfig: activation.activationSourceConfig,
		autoEnabledReasons: activation.autoEnabledReasons
	};
}
/** Adds plugin ids to registry provider records, applies an optional plugin scope, then sorts. */
function mapRegistryProviders(params) {
	const onlyPluginIdSet = require_current_plugin_metadata_snapshot.createPluginIdScopeSet(require_current_plugin_metadata_snapshot.normalizePluginIdScope(params.onlyPluginIds));
	return params.sortProviders(params.entries.filter((entry) => !onlyPluginIdSet || onlyPluginIdSet.has(entry.pluginId)).map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId })));
}
//#endregion
//#region src/plugins/web-fetch-providers.shared.ts
function sortWebFetchProviders(providers) {
	return sortPluginProviders(providers);
}
function sortWebFetchProvidersForAutoDetect(providers) {
	return sortPluginProvidersForAutoDetect(providers);
}
function resolveBundledWebFetchResolutionConfig(params) {
	return resolveBundledWebProviderResolutionConfig({
		contract: "webFetchProviders",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
}
//#endregion
//#region src/plugins/web-search-providers.shared.ts
function sortWebSearchProviders(providers) {
	return sortPluginProviders(providers);
}
function sortWebSearchProvidersForAutoDetect(providers) {
	return sortPluginProvidersForAutoDetect(providers);
}
function resolveBundledWebSearchResolutionConfig(params) {
	return resolveBundledWebProviderResolutionConfig({
		contract: "webSearchProviders",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
}
//#endregion
Object.defineProperty(exports, "mapRegistryProviders", {
	enumerable: true,
	get: function() {
		return mapRegistryProviders;
	}
});
Object.defineProperty(exports, "resolveBundledWebFetchResolutionConfig", {
	enumerable: true,
	get: function() {
		return resolveBundledWebFetchResolutionConfig;
	}
});
Object.defineProperty(exports, "resolveBundledWebSearchResolutionConfig", {
	enumerable: true,
	get: function() {
		return resolveBundledWebSearchResolutionConfig;
	}
});
Object.defineProperty(exports, "resolveManifestDeclaredWebProviderCandidatePluginIds", {
	enumerable: true,
	get: function() {
		return resolveManifestDeclaredWebProviderCandidatePluginIds;
	}
});
Object.defineProperty(exports, "resolveManifestDeclaredWebProviderCandidates", {
	enumerable: true,
	get: function() {
		return resolveManifestDeclaredWebProviderCandidates;
	}
});
Object.defineProperty(exports, "sortWebFetchProviders", {
	enumerable: true,
	get: function() {
		return sortWebFetchProviders;
	}
});
Object.defineProperty(exports, "sortWebFetchProvidersForAutoDetect", {
	enumerable: true,
	get: function() {
		return sortWebFetchProvidersForAutoDetect;
	}
});
Object.defineProperty(exports, "sortWebSearchProviders", {
	enumerable: true,
	get: function() {
		return sortWebSearchProviders;
	}
});
Object.defineProperty(exports, "sortWebSearchProvidersForAutoDetect", {
	enumerable: true,
	get: function() {
		return sortWebSearchProvidersForAutoDetect;
	}
});
