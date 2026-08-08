//#region src/plugins/runtime-state-key.ts
/** Process-global symbol shared by every plugin registry runtime projection. */
const PLUGIN_REGISTRY_STATE = Symbol.for("operator.pluginRegistryState");
//#endregion
Object.defineProperty(exports, "PLUGIN_REGISTRY_STATE", {
	enumerable: true,
	get: function() {
		return PLUGIN_REGISTRY_STATE;
	}
});
