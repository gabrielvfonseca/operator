const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/status/fallback-notice-state.ts
function resolveActiveFallbackState(params) {
	const selected = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.state?.fallbackNoticeSelectedModel);
	const active = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.state?.fallbackNoticeActiveModel);
	const reason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.state?.fallbackNoticeReason);
	const fallbackActive = !require_model_runtime_aliases.areRuntimeModelRefsEquivalent(params.selectedModelRef, params.activeModelRef, { config: params.config }) && selected === params.selectedModelRef && active === params.activeModelRef;
	return {
		active: fallbackActive,
		reason: fallbackActive ? reason : void 0
	};
}
//#endregion
Object.defineProperty(exports, "resolveActiveFallbackState", {
	enumerable: true,
	get: function() {
		return resolveActiveFallbackState;
	}
});
