const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
//#region src/agents/model-selection-resolve.ts
/**
* Model selection resolution facade.
*
* This module exposes model-selection helpers that need default fallback model
* handling before checking aliases, allowlists, catalogs, and plugin manifests.
*/
function resolveDefaultFallbackModels(cfg) {
	return require_model_input.resolveAgentModelFallbackValues(cfg.agents?.defaults?.model);
}
/** Returns whether a normalized model ref is available, allowed, or fallback-backed. */
function getModelRefStatus(params) {
	const { cfg, catalog, ref, defaultProvider, defaultModel, manifestPlugins } = params;
	return require_model_selection_shared.getModelRefStatusWithFallbackModels({
		cfg,
		catalog,
		ref,
		defaultProvider,
		defaultModel,
		fallbackModels: resolveDefaultFallbackModels(cfg),
		manifestPlugins
	});
}
/** Resolves a raw model string into an allowed model ref or an explanatory error. */
function resolveAllowedModelRef(params) {
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		manifestPlugins: params.manifestPlugins
	});
	return require_model_selection_shared.resolveAllowedModelRefFromAliasIndex({
		cfg: params.cfg,
		raw: params.raw,
		defaultProvider: params.defaultProvider,
		aliasIndex,
		manifestPlugins: params.manifestPlugins,
		getStatus: (ref) => getModelRefStatus({
			cfg: params.cfg,
			catalog: params.catalog,
			ref,
			defaultProvider: params.defaultProvider,
			defaultModel: params.defaultModel,
			manifestPlugins: params.manifestPlugins
		})
	});
}
//#endregion
Object.defineProperty(exports, "getModelRefStatus", {
	enumerable: true,
	get: function() {
		return getModelRefStatus;
	}
});
Object.defineProperty(exports, "resolveAllowedModelRef", {
	enumerable: true,
	get: function() {
		return resolveAllowedModelRef;
	}
});
