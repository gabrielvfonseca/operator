const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
//#region src/agents/model-visibility-policy.ts
/**
* Builds model visibility policies with configured fallbacks included.
*/
const RUNTIME_MODEL_VISIBILITY_NORMALIZATION = {
	allowManifestNormalization: true,
	allowPluginNormalization: true
};
function resolveAllowedFallbacks(params) {
	if (params.agentId) {
		const override = require_agent_scope.resolveAgentModelFallbacksOverride(params.cfg, params.agentId);
		if (override !== void 0) return override;
	}
	return require_model_input.resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.model);
}
function createModelVisibilityPolicy(params) {
	return require_model_selection_shared.createModelVisibilityPolicyWithFallbacks({
		cfg: params.cfg,
		catalog: params.catalog,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		fallbackModels: resolveAllowedFallbacks({
			cfg: params.cfg,
			agentId: params.agentId
		}),
		additionalConfiguredModelRefs: params.agentId ? Object.keys(require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId)?.models ?? {}) : [],
		allowManifestNormalization: params.allowManifestNormalization ?? false,
		allowPluginNormalization: params.allowPluginNormalization ?? false,
		manifestPlugins: params.manifestPlugins
	});
}
//#endregion
Object.defineProperty(exports, "RUNTIME_MODEL_VISIBILITY_NORMALIZATION", {
	enumerable: true,
	get: function() {
		return RUNTIME_MODEL_VISIBILITY_NORMALIZATION;
	}
});
Object.defineProperty(exports, "createModelVisibilityPolicy", {
	enumerable: true,
	get: function() {
		return createModelVisibilityPolicy;
	}
});
