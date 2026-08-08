let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/model-selection-display.ts
/**
* Formats selected model references for UI/session display.
*/
/** Resolves the most specific provider/model ref for display. */
function resolveModelDisplayRef(params) {
	const runtimeModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.runtimeModel);
	const runtimeProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.runtimeProvider);
	if (runtimeModel) {
		if (runtimeModel.includes("/")) return runtimeModel;
		if (runtimeProvider) return `${runtimeProvider}/${runtimeModel}`;
		return runtimeModel;
	}
	if (runtimeProvider) return runtimeProvider;
	const overrideModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.overrideModel);
	const overrideProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.overrideProvider);
	if (overrideModel) {
		if (overrideModel.includes("/")) return overrideModel;
		if (overrideProvider) return `${overrideProvider}/${overrideModel}`;
		return overrideModel;
	}
	if (overrideProvider) return overrideProvider;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.fallbackModel) || void 0;
}
/** Resolves the model name shown in compact status output. */
function resolveModelDisplayName(params) {
	const modelRef = resolveModelDisplayRef(params);
	if (!modelRef) return "model n/a";
	const slash = modelRef.lastIndexOf("/");
	if (slash >= 0 && slash < modelRef.length - 1) return modelRef.slice(slash + 1);
	return modelRef;
}
/** Resolves session-info model selection from entry, override, and fallback data. */
function resolveSessionInfoModelSelection(params) {
	const fallbackProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.currentProvider) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.defaultProvider) ?? void 0;
	const fallbackModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.currentModel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.defaultModel) ?? void 0;
	if (params.entryProvider !== void 0 || params.entryModel !== void 0) return {
		modelProvider: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entryProvider) ?? fallbackProvider,
		model: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entryModel) ?? fallbackModel
	};
	const overrideModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.overrideModel);
	if (overrideModel) return {
		modelProvider: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.overrideProvider) || fallbackProvider,
		model: overrideModel
	};
	return {
		modelProvider: fallbackProvider,
		model: fallbackModel
	};
}
//#endregion
Object.defineProperty(exports, "resolveModelDisplayName", {
	enumerable: true,
	get: function() {
		return resolveModelDisplayName;
	}
});
Object.defineProperty(exports, "resolveModelDisplayRef", {
	enumerable: true,
	get: function() {
		return resolveModelDisplayRef;
	}
});
Object.defineProperty(exports, "resolveSessionInfoModelSelection", {
	enumerable: true,
	get: function() {
		return resolveSessionInfoModelSelection;
	}
});
