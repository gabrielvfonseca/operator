const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_bundled_manifest_contract_plugins = require("./bundled-manifest-contract-plugins-CUB9YoTJ.cjs");
const require_web_search_providers_shared = require("./web-search-providers.shared-C1hrTfhU.cjs");
const require_web_provider_public_artifacts_explicit = require("./web-provider-public-artifacts.explicit-BBLa7tXl.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/web-provider-public-artifacts.ts
function filterAllowlistedBundledPluginIds(config, pluginIds) {
	if (config?.plugins?.bundledDiscovery === "compat") return [...pluginIds];
	const allow = config?.plugins?.allow;
	if (!Array.isArray(allow) || allow.length === 0) return [...pluginIds];
	const allowedPluginIds = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(allow.map((pluginId) => require_config_state.normalizePluginId(pluginId))));
	return pluginIds.filter((pluginId) => allowedPluginIds.has(pluginId));
}
function resolveBundledCandidatePluginIds(params) {
	if (params.onlyPluginIds !== void 0) return { pluginIds: filterAllowlistedBundledPluginIds(params.config, [...new Set(params.onlyPluginIds)]).toSorted((left, right) => left.localeCompare(right)) };
	const resolvedConfig = params.contract === "webSearchProviders" ? require_web_search_providers_shared.resolveBundledWebSearchResolutionConfig(params).config : require_web_search_providers_shared.resolveBundledWebFetchResolutionConfig(params).config;
	const candidates = require_web_search_providers_shared.resolveManifestDeclaredWebProviderCandidates({
		contract: params.contract,
		configKey: params.configKey,
		config: resolvedConfig,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds,
		origin: "bundled"
	});
	return {
		pluginIds: filterAllowlistedBundledPluginIds(resolvedConfig, candidates.pluginIds ?? []),
		...candidates.manifestRecords ? { manifestRecords: candidates.manifestRecords } : {}
	};
}
function resolveBundledManifestRecordsByPluginId(params) {
	const allowedPluginIds = new Set(params.onlyPluginIds);
	const manifestRecords = params.manifestRecords ?? require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}).plugins;
	return new Map(manifestRecords.filter((record) => record.origin === "bundled" && allowedPluginIds.has(record.id)).map((record) => [record.id, record]));
}
function resolveBundledRuntimeCandidatePluginIds(params) {
	const resolvedConfig = require_web_search_providers_shared.resolveBundledWebFetchResolutionConfig(params).config;
	const candidates = require_web_search_providers_shared.resolveManifestDeclaredWebProviderCandidates({
		contract: params.contract,
		configKey: params.configKey,
		config: resolvedConfig,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds
	});
	const pluginIds = filterAllowlistedBundledPluginIds(resolvedConfig, candidates.pluginIds ?? []);
	const recordsByPluginId = new Map((candidates.manifestRecords ?? []).filter((record) => pluginIds.includes(record.id)).map((record) => [record.id, record]));
	if (pluginIds.some((pluginId) => recordsByPluginId.get(pluginId)?.origin !== "bundled")) return null;
	const enabledPluginIds = new Set(require_bundled_manifest_contract_plugins.resolveEnabledBundledManifestContractPlugins({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: pluginIds,
		contract: params.contract,
		compatMode: {
			enablement: "always",
			vitest: params.config !== void 0
		}
	}).map((plugin) => plugin.id));
	return pluginIds.filter((pluginId) => enabledPluginIds.has(pluginId));
}
function resolveBundledWebSearchProvidersFromPublicArtifacts(params) {
	const pluginIds = resolveBundledCandidatePluginIds({
		contract: "webSearchProviders",
		configKey: "webSearch",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds
	});
	if (pluginIds.pluginIds.length === 0) return [];
	const directProviders = require_web_provider_public_artifacts_explicit.resolveBundledExplicitWebSearchProvidersFromPublicArtifacts({ onlyPluginIds: pluginIds.pluginIds });
	if (directProviders) return directProviders;
	const recordsByPluginId = resolveBundledManifestRecordsByPluginId({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: pluginIds.pluginIds,
		manifestRecords: pluginIds.manifestRecords
	});
	const providers = [];
	for (const pluginId of pluginIds.pluginIds) {
		const record = recordsByPluginId.get(pluginId);
		if (!record) return null;
		const loadedProviders = require_web_provider_public_artifacts_explicit.loadBundledWebSearchProviderEntriesFromDir({
			dirName: node_path.default.basename(record.rootDir),
			pluginId
		});
		if (!loadedProviders) return null;
		providers.push(...loadedProviders);
	}
	return providers;
}
function resolveBundledWebFetchProvidersFromPublicArtifacts(params) {
	const pluginIds = resolveBundledCandidatePluginIds({
		contract: "webFetchProviders",
		configKey: "webFetch",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds
	});
	if (pluginIds.pluginIds.length === 0) return [];
	const directProviders = require_web_provider_public_artifacts_explicit.resolveBundledExplicitWebFetchProvidersFromPublicArtifacts({ onlyPluginIds: pluginIds.pluginIds });
	if (directProviders) return directProviders;
	const recordsByPluginId = resolveBundledManifestRecordsByPluginId({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: pluginIds.pluginIds,
		manifestRecords: pluginIds.manifestRecords
	});
	const providers = [];
	for (const pluginId of pluginIds.pluginIds) {
		const record = recordsByPluginId.get(pluginId);
		if (!record) return null;
		const loadedProviders = require_web_provider_public_artifacts_explicit.loadBundledWebFetchProviderEntriesFromDir({
			dirName: node_path.default.basename(record.rootDir),
			pluginId
		});
		if (!loadedProviders) return null;
		providers.push(...loadedProviders);
	}
	return providers;
}
function resolveBundledRuntimeWebFetchProvidersFromPublicArtifacts(params) {
	const pluginIds = resolveBundledRuntimeCandidatePluginIds({
		contract: "webFetchProviders",
		configKey: "webFetch",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds
	});
	if (!pluginIds) return null;
	if (pluginIds.length === 0) return [];
	return require_web_provider_public_artifacts_explicit.resolveBundledExplicitRuntimeWebFetchProvidersFromPublicArtifacts({ onlyPluginIds: pluginIds });
}
//#endregion
Object.defineProperty(exports, "resolveBundledRuntimeWebFetchProvidersFromPublicArtifacts", {
	enumerable: true,
	get: function() {
		return resolveBundledRuntimeWebFetchProvidersFromPublicArtifacts;
	}
});
Object.defineProperty(exports, "resolveBundledWebFetchProvidersFromPublicArtifacts", {
	enumerable: true,
	get: function() {
		return resolveBundledWebFetchProvidersFromPublicArtifacts;
	}
});
Object.defineProperty(exports, "resolveBundledWebSearchProvidersFromPublicArtifacts", {
	enumerable: true,
	get: function() {
		return resolveBundledWebSearchProvidersFromPublicArtifacts;
	}
});
