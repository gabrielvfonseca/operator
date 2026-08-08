const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_env_var_candidates = require("./env-var-candidates-_B3Nq1E6.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/secrets/channel-env-vars.ts
/** Discovers plugin-declared environment variable names for channel credential setup. */
/**
* Resolves plugin-declared channel environment variable names keyed by channel id.
* The result is deterministic so env-shell docs and prompt snapshots stay stable.
*/
function resolveChannelEnvVars(params) {
	const snapshot = require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: params?.config ?? {},
		workspaceDir: params?.workspaceDir,
		env: params?.env ?? process.env
	});
	const candidates = {};
	for (const plugin of snapshot.plugins) {
		if (!plugin.channelEnvVars) continue;
		for (const [channelId, keys] of Object.entries(plugin.channelEnvVars).toSorted(([left], [right]) => left.localeCompare(right))) require_env_var_candidates.appendUniqueEnvVarCandidates(candidates, channelId, keys);
	}
	return candidates;
}
/**
* Returns the declared env var names for one channel id.
*/
function getChannelEnvVars(channelId, params) {
	const channelEnvVars = resolveChannelEnvVars(params);
	const envVars = Object.hasOwn(channelEnvVars, channelId) ? channelEnvVars[channelId] : void 0;
	return Array.isArray(envVars) ? [...envVars] : [];
}
/**
* Lists every known channel env var name across installed plugin metadata.
*/
function listKnownChannelEnvVarNames(params) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(Object.values(resolveChannelEnvVars(params)).flat());
}
//#endregion
Object.defineProperty(exports, "getChannelEnvVars", {
	enumerable: true,
	get: function() {
		return getChannelEnvVars;
	}
});
Object.defineProperty(exports, "listKnownChannelEnvVarNames", {
	enumerable: true,
	get: function() {
		return listKnownChannelEnvVarNames;
	}
});
