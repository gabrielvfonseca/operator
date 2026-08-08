const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_runtime_state_key = require("./runtime-state-key-DcNuimnV.cjs");
let node_async_hooks = require("node:async_hooks");
//#region src/plugins/runtime-workspace-state.ts
const pinnedWorkspaceDirStorage = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.pinnedPluginRegistryWorkspaceDir"), () => new node_async_hooks.AsyncLocalStorage());
/** Reads the active plugin registry workspace directory from global runtime state,
*  respecting any pinned workspace from the current async context. */
function getActivePluginRegistryWorkspaceDirFromState() {
	const pinned = pinnedWorkspaceDirStorage.getStore();
	if (pinned) return pinned.workspaceDir;
	return globalThis[require_runtime_state_key.PLUGIN_REGISTRY_STATE]?.workspaceDir ?? void 0;
}
/**
* Pin the active plugin-registry workspace dir for the duration of `fn`.
* While pinned, calls to `getActivePluginRegistryWorkspaceDirFromState()` return
* the snapshot taken at pin time, ignoring concurrent mutations from other
* agent turns or crons. This prevents per-row memo-busting in operations that
* iterate over many rows (e.g. sessions.list).
*/
function withPinnedActivePluginRegistryWorkspaceDir(fn) {
	if (pinnedWorkspaceDirStorage.getStore()) return fn();
	const workspaceDir = globalThis[require_runtime_state_key.PLUGIN_REGISTRY_STATE]?.workspaceDir ?? void 0;
	return pinnedWorkspaceDirStorage.run({ workspaceDir }, fn);
}
//#endregion
Object.defineProperty(exports, "getActivePluginRegistryWorkspaceDirFromState", {
	enumerable: true,
	get: function() {
		return getActivePluginRegistryWorkspaceDirFromState;
	}
});
Object.defineProperty(exports, "withPinnedActivePluginRegistryWorkspaceDir", {
	enumerable: true,
	get: function() {
		return withPinnedActivePluginRegistryWorkspaceDir;
	}
});
