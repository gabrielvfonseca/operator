const require_bundled_plugin_metadata = require("./bundled-plugin-metadata-h4MVizJT.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
require("./config-contract-matches-BOy7ZHza.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/config-contracts.ts
/** Resolves plugin config contract metadata for scanners and secret/config policy checks. */
/** Resolve config contract metadata for plugin ids through the runtime registry and bundled fallback. */
function resolvePluginConfigContractsById(params) {
	const matches = /* @__PURE__ */ new Map();
	const pluginIds = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(params.pluginIds);
	if (pluginIds.length === 0) return matches;
	const fallbackBundledPluginIds = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeSortedUniqueStringEntries)(params.fallbackBundledPluginIds));
	const bundledContractFallbacks = /* @__PURE__ */ new Map();
	const findBundledConfigContracts = (pluginId) => {
		if (bundledContractFallbacks.has(pluginId)) return bundledContractFallbacks.get(pluginId);
		const discovery = params.discovery ?? require_discovery.discoverOperatorPlugins({
			workspaceDir: params.workspaceDir,
			env: params.env
		});
		const registry = require_manifest_registry.loadPluginManifestRegistry({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			candidates: discovery.candidates.filter((candidate) => candidate.origin === "bundled"),
			diagnostics: discovery.diagnostics
		});
		for (const plugin of registry.plugins) bundledContractFallbacks.set(plugin.id, plugin.configContracts);
		if (bundledContractFallbacks.get(pluginId) === void 0) {
			const bundledMetadata = require_bundled_plugin_metadata.findBundledPluginMetadataById(pluginId, {
				includeChannelConfigs: false,
				includeSyntheticChannelConfigs: false
			});
			if (bundledMetadata?.manifest.configContracts) bundledContractFallbacks.set(pluginId, bundledMetadata.manifest.configContracts);
		}
		if (!bundledContractFallbacks.has(pluginId)) bundledContractFallbacks.set(pluginId, void 0);
		return bundledContractFallbacks.get(pluginId);
	};
	const resolvedPluginOrigins = /* @__PURE__ */ new Map();
	const registry = require_plugin_registry.loadPluginManifestRegistryForPluginRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeDisabled: true
	});
	for (const plugin of registry.plugins) {
		if (!pluginIds.includes(plugin.id)) continue;
		resolvedPluginOrigins.set(plugin.id, plugin.origin);
		if (!plugin.configContracts) continue;
		matches.set(plugin.id, {
			origin: plugin.origin,
			configContracts: plugin.configContracts
		});
	}
	if (params.fallbackToBundledMetadata ?? true) for (const pluginId of pluginIds) {
		const existing = matches.get(pluginId);
		if (existing && (params.fallbackToBundledMetadataForResolvedBundled && existing.origin === "bundled" || fallbackBundledPluginIds.has(pluginId))) {
			const bundledConfigContracts = findBundledConfigContracts(pluginId);
			if (bundledConfigContracts) matches.set(pluginId, {
				origin: fallbackBundledPluginIds.has(pluginId) ? "bundled" : existing.origin,
				configContracts: {
					...bundledConfigContracts,
					...existing.configContracts,
					...bundledConfigContracts.secretInputs ? { secretInputs: bundledConfigContracts.secretInputs } : {}
				}
			});
			continue;
		}
		if (matches.has(pluginId)) continue;
		const resolvedOrigin = resolvedPluginOrigins.get(pluginId);
		if (resolvedOrigin && !(params.fallbackToBundledMetadataForResolvedBundled && resolvedOrigin === "bundled") && !fallbackBundledPluginIds.has(pluginId)) continue;
		const bundledConfigContracts = findBundledConfigContracts(pluginId);
		if (!bundledConfigContracts) continue;
		matches.set(pluginId, {
			origin: "bundled",
			configContracts: bundledConfigContracts
		});
	}
	return matches;
}
//#endregion
Object.defineProperty(exports, "resolvePluginConfigContractsById", {
	enumerable: true,
	get: function() {
		return resolvePluginConfigContractsById;
	}
});
