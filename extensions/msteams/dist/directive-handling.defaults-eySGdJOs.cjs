const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
require("./model-selection-BvFurMxy.cjs");
//#region src/auto-reply/reply/directive-handling.defaults.ts
/** Resolve default provider/model plus alias index for directive parsing. */
function resolveDefaultModel(params) {
	const mainModel = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId,
		allowPluginNormalization: false
	});
	const defaultProvider = mainModel.provider;
	return {
		defaultProvider,
		defaultModel: mainModel.model,
		aliasIndex: require_model_selection_shared.buildModelAliasIndex({
			cfg: params.cfg,
			defaultProvider,
			allowPluginNormalization: false
		})
	};
}
//#endregion
Object.defineProperty(exports, "resolveDefaultModel", {
	enumerable: true,
	get: function() {
		return resolveDefaultModel;
	}
});
