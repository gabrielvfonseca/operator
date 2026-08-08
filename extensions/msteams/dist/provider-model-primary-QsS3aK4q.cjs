const require_model_input = require("./model-input-DO-er-Kk.cjs");
//#region src/plugins/provider-model-primary.ts
/** Applies a primary model to agent defaults while preserving model fallback metadata. */
function applyPrimaryModel(cfg, model) {
	const normalizedModel = require_model_input.normalizeAgentModelRefForConfig(model);
	const defaults = cfg.agents?.defaults;
	const existingModel = defaults?.model;
	const existingModels = require_model_input.normalizeAgentModelMapForConfig(defaults?.models ?? {});
	const fallbacks = typeof existingModel === "object" && existingModel !== null && "fallbacks" in existingModel ? existingModel.fallbacks?.map((fallback) => require_model_input.normalizeAgentModelRefForConfig(fallback)) : void 0;
	return {
		...cfg,
		agents: {
			...cfg.agents,
			defaults: {
				...defaults,
				model: {
					...fallbacks ? { fallbacks } : void 0,
					primary: normalizedModel
				},
				models: {
					...existingModels,
					[normalizedModel]: existingModels?.[normalizedModel] ?? {}
				}
			}
		}
	};
}
//#endregion
Object.defineProperty(exports, "applyPrimaryModel", {
	enumerable: true,
	get: function() {
		return applyPrimaryModel;
	}
});
