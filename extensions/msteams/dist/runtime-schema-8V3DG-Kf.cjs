require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_schema = require("./schema-DYOb_hMY.cjs");
//#region src/config/runtime-schema.ts
function loadManifestRegistry(config, env) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(config, require_agent_scope_config.resolveDefaultAgentId(config));
	return require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config,
		env: env ?? process.env,
		workspaceDir,
		allowWorkspaceScopedCurrent: true
	}).manifestRegistry;
}
/** Builds the config schema from the active runtime config and plugin metadata. */
function loadGatewayRuntimeConfigSchema() {
	const registry = loadManifestRegistry(require_io.getRuntimeConfig());
	return require_schema.buildConfigSchema({
		plugins: require_io.collectPluginSchemaMetadata(registry),
		channels: require_io.collectChannelSchemaMetadata(registry)
	});
}
async function readBestEffortRuntimeConfigSchema() {
	const snapshot = await require_io.readConfigFileSnapshot();
	const registry = loadManifestRegistry(snapshot.valid ? snapshot.config : { plugins: { enabled: true } });
	return require_schema.buildConfigSchema({
		plugins: snapshot.valid ? require_io.collectPluginSchemaMetadata(registry) : [],
		channels: require_io.collectChannelSchemaMetadata(registry)
	});
}
//#endregion
Object.defineProperty(exports, "loadGatewayRuntimeConfigSchema", {
	enumerable: true,
	get: function() {
		return loadGatewayRuntimeConfigSchema;
	}
});
Object.defineProperty(exports, "readBestEffortRuntimeConfigSchema", {
	enumerable: true,
	get: function() {
		return readBestEffortRuntimeConfigSchema;
	}
});
