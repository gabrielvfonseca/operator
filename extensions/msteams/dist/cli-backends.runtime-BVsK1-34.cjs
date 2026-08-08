const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
//#region src/plugins/cli-backends.runtime.ts
/** Resolves CLI backends from the active runtime plugin registry. */
function resolveRuntimeCliBackends() {
	return (require_active_runtime_registry.getActiveRuntimePluginRegistry()?.cliBackends ?? []).map((entry) => Object.assign({}, entry.backend, { pluginId: entry.pluginId }));
}
//#endregion
Object.defineProperty(exports, "resolveRuntimeCliBackends", {
	enumerable: true,
	get: function() {
		return resolveRuntimeCliBackends;
	}
});
