const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
//#region src/plugins/activation-source-config.ts
/** Resolves the source config snapshot used for plugin activation policy decisions. */
var activation_source_config_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolvePluginActivationSourceConfig: () => resolvePluginActivationSourceConfig });
/** Resolves the source config used for plugin activation policy decisions. */
function resolvePluginActivationSourceConfig(params) {
	if (params.activationSourceConfig !== void 0) return params.activationSourceConfig;
	const sourceSnapshot = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
	if (sourceSnapshot && params.config === require_runtime_snapshot.getRuntimeConfigSnapshot()) return sourceSnapshot;
	return params.config ?? {};
}
//#endregion
Object.defineProperty(exports, "activation_source_config_exports", {
	enumerable: true,
	get: function() {
		return activation_source_config_exports;
	}
});
Object.defineProperty(exports, "resolvePluginActivationSourceConfig", {
	enumerable: true,
	get: function() {
		return resolvePluginActivationSourceConfig;
	}
});
