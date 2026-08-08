let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/plugins/setup-descriptors.ts
/** Lists setup provider ids and auth aliases owned by one plugin manifest. */
function listSetupProviderIds(record) {
	const providerIds = record.setup?.providers?.map((entry) => entry.id) ?? record.providers;
	const normalizedProviderIds = new Set(providerIds.map(_gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId));
	const aliases = Object.entries(record.providerAuthAliases ?? {}).filter(([, target]) => normalizedProviderIds.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(target))).map(([alias]) => alias);
	return [...providerIds, ...aliases];
}
/** Lists setup CLI backend ids from setup metadata or manifest contribution ids. */
function listSetupCliBackendIds(record) {
	return record.setup?.cliBackends ?? record.cliBackends;
}
//#endregion
Object.defineProperty(exports, "listSetupCliBackendIds", {
	enumerable: true,
	get: function() {
		return listSetupCliBackendIds;
	}
});
Object.defineProperty(exports, "listSetupProviderIds", {
	enumerable: true,
	get: function() {
		return listSetupProviderIds;
	}
});
