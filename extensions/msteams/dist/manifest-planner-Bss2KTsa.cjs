const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_model_catalog_core_model_catalog_normalize = require("@gabrielvfonseca/model-catalog-core/model-catalog-normalize");
//#region src/model-catalog/manifest-planner.ts
function planManifestModelCatalogRows(params) {
	const providerFilter = params.providerFilter ? (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(params.providerFilter) : void 0;
	const entries = [];
	for (const plugin of params.registry.plugins) for (const entry of planManifestModelCatalogPluginEntries({
		plugin,
		providerFilter
	})) entries.push(entry);
	const rowCandidates = [];
	const seenRows = /* @__PURE__ */ new Map();
	const conflicts = /* @__PURE__ */ new Map();
	for (const entry of entries) for (const row of entry.rows) {
		const seen = seenRows.get(row.mergeKey);
		if (seen) {
			if (!conflicts.has(row.mergeKey)) conflicts.set(row.mergeKey, {
				mergeKey: row.mergeKey,
				ref: seen.row.ref,
				provider: seen.row.provider,
				modelId: seen.row.id,
				firstPluginId: seen.pluginId,
				secondPluginId: entry.pluginId
			});
			continue;
		}
		seenRows.set(row.mergeKey, {
			pluginId: entry.pluginId,
			row
		});
		rowCandidates.push(row);
	}
	const conflictedMergeKeys = new Set(conflicts.keys());
	const rows = rowCandidates.filter((row) => !conflictedMergeKeys.has(row.mergeKey));
	return {
		entries,
		conflicts: [...conflicts.values()],
		rows: rows.toSorted((left, right) => left.provider.localeCompare(right.provider) || left.id.localeCompare(right.id))
	};
}
function planManifestModelCatalogPluginEntries(params) {
	const providers = params.plugin.modelCatalog?.providers;
	if (!providers) return [];
	const aliasesByTargetProvider = buildModelCatalogProviderAliasTargets(params.plugin);
	return Object.entries(providers).flatMap(([provider, providerCatalog]) => {
		const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(provider);
		if (!normalizedProvider) return [];
		const providerAliases = aliasesByTargetProvider.get(normalizedProvider) ?? [];
		const plannedProviders = params.providerFilter ? providerAliases.includes(params.providerFilter) || normalizedProvider === params.providerFilter ? [params.providerFilter] : [] : [normalizedProvider];
		if (plannedProviders.length === 0) return [];
		return plannedProviders.flatMap((plannedProvider) => {
			const rows = (0, _gabrielvfonseca_model_catalog_core_model_catalog_normalize.normalizeModelCatalogProviderRows)({
				provider: plannedProvider,
				providerCatalog,
				source: "manifest"
			});
			if (rows.length === 0) return [];
			return [{
				pluginId: params.plugin.id,
				provider: plannedProvider,
				discovery: params.plugin.modelCatalog?.discovery?.[normalizedProvider],
				rows: applyModelCatalogAliasOverrides({
					rows,
					alias: params.plugin.modelCatalog?.aliases?.[plannedProvider]
				})
			}];
		});
	});
}
function buildOwnedProviderSet(plugin) {
	return new Set(require_string_normalization.normalizeUniqueStringEntries((plugin.providers ?? []).map(_gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)));
}
function buildModelCatalogProviderAliasTargets(plugin) {
	const ownedProviders = buildOwnedProviderSet(plugin);
	const aliasesByTargetProvider = /* @__PURE__ */ new Map();
	for (const [rawAlias, alias] of Object.entries(plugin.modelCatalog?.aliases ?? {})) {
		const aliasProvider = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(rawAlias);
		const targetProvider = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(alias.provider);
		if (!aliasProvider || !targetProvider || !ownedProviders.has(targetProvider)) continue;
		const aliases = aliasesByTargetProvider.get(targetProvider) ?? [];
		aliases.push(aliasProvider);
		aliasesByTargetProvider.set(targetProvider, aliases);
	}
	return aliasesByTargetProvider;
}
function buildModelCatalogProviderRefs(plugin) {
	const ownedProviders = buildOwnedProviderSet(plugin);
	const refs = new Set(ownedProviders);
	for (const [rawAlias, alias] of Object.entries(plugin.modelCatalog?.aliases ?? {})) {
		const aliasProvider = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(rawAlias);
		const targetProvider = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(alias.provider);
		if (aliasProvider && targetProvider && ownedProviders.has(targetProvider)) refs.add(aliasProvider);
	}
	return refs;
}
function applyModelCatalogAliasOverrides(params) {
	const alias = params.alias;
	if (!alias) return params.rows;
	return params.rows.map((row) => ({
		...row,
		...alias.api ? { api: alias.api } : {},
		...alias.baseUrl ? { baseUrl: alias.baseUrl } : {}
	}));
}
function planManifestModelCatalogSuppressions(params) {
	const providerFilter = params.providerFilter ? (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(params.providerFilter) : void 0;
	const modelFilter = params.modelFilter ? require_string_coerce.normalizeLowercaseStringOrEmpty(params.modelFilter) : void 0;
	const suppressions = [];
	for (const plugin of params.registry.plugins) {
		const providerRefs = buildModelCatalogProviderRefs(plugin);
		for (const suppression of plugin.modelCatalog?.suppressions ?? []) {
			const provider = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(suppression.provider);
			const model = require_string_coerce.normalizeLowercaseStringOrEmpty(suppression.model);
			if (!provider || !model) continue;
			if (providerFilter && provider !== providerFilter) continue;
			if (modelFilter && model !== modelFilter) continue;
			if (!providerRefs.has(provider)) continue;
			suppressions.push({
				pluginId: plugin.id,
				provider,
				model,
				mergeKey: (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.buildModelCatalogMergeKey)(provider, model),
				...suppression.reason ? { reason: suppression.reason } : {},
				...suppression.when ? { when: suppression.when } : {}
			});
		}
	}
	return { suppressions: suppressions.toSorted((left, right) => left.provider.localeCompare(right.provider) || left.model.localeCompare(right.model) || left.pluginId.localeCompare(right.pluginId)) };
}
//#endregion
Object.defineProperty(exports, "planManifestModelCatalogRows", {
	enumerable: true,
	get: function() {
		return planManifestModelCatalogRows;
	}
});
Object.defineProperty(exports, "planManifestModelCatalogSuppressions", {
	enumerable: true,
	get: function() {
		return planManifestModelCatalogSuppressions;
	}
});
