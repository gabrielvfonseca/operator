require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
//#region src/agents/model-discovery-context.ts
/**
* Shared context resolvers for model discovery.
* Keeps callers from reaching into runtime config or plugin metadata snapshot
* plumbing directly.
*/
/** Resolve the workspace directory model discovery should use for agent scope. */
function resolveModelWorkspaceDir(cfg, explicitWorkspaceDir) {
	if (explicitWorkspaceDir !== void 0 || !cfg) return explicitWorkspaceDir;
	return require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg));
}
/**
* Resolve the plugin metadata snapshot for model discovery.
*
* Explicit snapshots win for tests and prepared runtimes. Otherwise we prefer
* the current process snapshot, then fall back to resolving from config/env.
*/
function resolveModelPluginMetadataSnapshot(params) {
	if (params.pluginMetadataSnapshot) return params.pluginMetadataSnapshot;
	const env = params.env ?? process.env;
	try {
		const config = params.config ?? (params.useRuntimeConfig ? require_io.getRuntimeConfig() : void 0);
		return require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
			allowWorkspaceScopedSnapshot: true,
			env,
			...config ? { config } : {},
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
		}) ?? require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
			config: config ?? {},
			env,
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
			...params.allowWorkspaceScopedCurrent !== void 0 ? { allowWorkspaceScopedCurrent: params.allowWorkspaceScopedCurrent } : {}
		});
	} catch {
		return;
	}
}
//#endregion
Object.defineProperty(exports, "resolveModelPluginMetadataSnapshot", {
	enumerable: true,
	get: function() {
		return resolveModelPluginMetadataSnapshot;
	}
});
Object.defineProperty(exports, "resolveModelWorkspaceDir", {
	enumerable: true,
	get: function() {
		return resolveModelWorkspaceDir;
	}
});
