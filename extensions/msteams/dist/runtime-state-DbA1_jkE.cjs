const require_runtime_state_key = require("./runtime-state-key-DcNuimnV.cjs");
const require_runtime_workspace_state = require("./runtime-workspace-state-C4MmR84x.cjs");
//#region src/plugins/runtime-state.ts
function getPluginRegistryState() {
	return globalThis[require_runtime_state_key.PLUGIN_REGISTRY_STATE];
}
function getActivePluginRegistryWorkspaceDirFromState() {
	return require_runtime_workspace_state.getActivePluginRegistryWorkspaceDirFromState();
}
//#endregion
Object.defineProperty(exports, "getActivePluginRegistryWorkspaceDirFromState", {
	enumerable: true,
	get: function() {
		return getActivePluginRegistryWorkspaceDirFromState;
	}
});
Object.defineProperty(exports, "getPluginRegistryState", {
	enumerable: true,
	get: function() {
		return getPluginRegistryState;
	}
});
