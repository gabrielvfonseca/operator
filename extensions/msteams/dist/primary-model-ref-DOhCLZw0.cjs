const require_model_input = require("./model-input-DO-er-Kk.cjs");
require("./defaults-BplP0QgT.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
//#region src/commands/doctor/shared/primary-model-ref.ts
function resolveDoctorPrimaryModelRef(cfg, agentModel) {
	return require_model_selection_normalize.parseModelRef(require_model_input.resolveAgentModelPrimaryValue(agentModel) ?? require_model_input.resolveAgentModelPrimaryValue(cfg.agents?.defaults?.model) ?? "openrouter/auto", "openrouter", { allowPluginNormalization: false }) ?? {
		provider: "openrouter",
		model: "openrouter/auto"
	};
}
//#endregion
Object.defineProperty(exports, "resolveDoctorPrimaryModelRef", {
	enumerable: true,
	get: function() {
		return resolveDoctorPrimaryModelRef;
	}
});
