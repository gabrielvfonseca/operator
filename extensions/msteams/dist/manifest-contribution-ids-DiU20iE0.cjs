const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
//#region src/plugins/manifest-contribution-ids.ts
/** Lists manifest contribution ids from installed plugin registry snapshots. */
/** Lists ids contributed by plugin manifests for one contribution kind. */
function listManifestContributionIds(params) {
	const env = params.env ?? process.env;
	return require_plugin_registry.listPluginContributionIds({
		index: params.index ?? require_plugin_registry.loadPluginRegistrySnapshot({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env,
			candidates: params.candidates,
			preferPersisted: params.preferPersisted
		}),
		contribution: params.contribution,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env,
		includeDisabled: params.includeDisabled
	});
}
/** Lists channel ids contributed by plugin manifests. */
function listManifestChannelContributionIds(params = {}) {
	return listManifestContributionIds({
		...params,
		contribution: "channels"
	});
}
//#endregion
Object.defineProperty(exports, "listManifestChannelContributionIds", {
	enumerable: true,
	get: function() {
		return listManifestChannelContributionIds;
	}
});
