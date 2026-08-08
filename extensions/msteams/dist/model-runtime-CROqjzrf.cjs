let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/model-runtime.ts
/** Format a provider/model pair without duplicating provider prefixes already in the model id. */
function formatProviderModelRef(providerRaw, modelRaw) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerRaw) ?? "";
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(modelRaw) ?? "";
	if (!provider) return model;
	if (!model) return provider;
	const prefix = `${provider}/`;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(model).startsWith((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(prefix))) {
		const normalizedModel = model.slice(prefix.length).trim();
		if (normalizedModel) return `${provider}/${normalizedModel}`;
	}
	return `${provider}/${model}`;
}
function normalizeModelWithinProvider(provider, modelRaw) {
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(modelRaw) ?? "";
	if (!provider || !model) return model;
	const prefix = `${provider}/`;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(model).startsWith((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(prefix))) {
		const withoutPrefix = model.slice(prefix.length).trim();
		if (withoutPrefix) return withoutPrefix;
	}
	return model;
}
function normalizeModelRef(rawModel, fallbackProvider, parseEmbeddedProvider = false) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawModel) ?? "";
	const slashIndex = parseEmbeddedProvider ? trimmed.indexOf("/") : -1;
	if (slashIndex > 0) {
		const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(trimmed.slice(0, slashIndex)) ?? "";
		const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(trimmed.slice(slashIndex + 1)) ?? "";
		if (provider && model) return {
			provider,
			model,
			label: `${provider}/${model}`
		};
	}
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fallbackProvider) ?? "";
	const dedupedModel = normalizeModelWithinProvider(provider, trimmed);
	return {
		provider,
		model: dedupedModel || trimmed,
		label: provider ? formatProviderModelRef(provider, dedupedModel || trimmed) : trimmed
	};
}
/** Compare configured selected model with the active model stored on a session. */
function resolveSelectedAndActiveModel(params) {
	const selected = normalizeModelRef(params.selectedModel, params.selectedProvider, params.parseSelectedProvider);
	const runtimeModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionEntry?.model);
	const runtimeProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionEntry?.modelProvider);
	const active = runtimeModel ? normalizeModelRef(runtimeModel, runtimeProvider || selected.provider, !runtimeProvider) : selected;
	return {
		selected,
		active,
		activeDiffers: active.provider !== selected.provider || active.model !== selected.model
	};
}
//#endregion
Object.defineProperty(exports, "formatProviderModelRef", {
	enumerable: true,
	get: function() {
		return formatProviderModelRef;
	}
});
Object.defineProperty(exports, "resolveSelectedAndActiveModel", {
	enumerable: true,
	get: function() {
		return resolveSelectedAndActiveModel;
	}
});
