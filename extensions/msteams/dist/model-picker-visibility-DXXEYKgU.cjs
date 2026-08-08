const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/agents/model-picker-visibility.ts
/**
* Filters provider/model refs for model picker visibility.
*/
const RETIRED_MODEL_PICKER_PROVIDERS = /* @__PURE__ */ new Set(["codex", "codex-cli"]);
/** True for retired provider ids that should stay out of model selection surfaces. */
function isRetiredModelPickerProvider(provider) {
	return RETIRED_MODEL_PICKER_PROVIDERS.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider));
}
/** Creates a provider visibility predicate for model picker rendering. */
function createModelPickerVisibleProviderPredicate(params = {}) {
	const cliRuntimeProviders = new Set(require_cli_backends.listCliRuntimeProviderIds({
		config: params.config,
		env: params.env,
		includeSetupRegistry: params.includeSetupRegistry ?? false
	}));
	return (provider) => {
		const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
		return !isRetiredModelPickerProvider(normalized) && !cliRuntimeProviders.has(normalized);
	};
}
//#endregion
Object.defineProperty(exports, "createModelPickerVisibleProviderPredicate", {
	enumerable: true,
	get: function() {
		return createModelPickerVisibleProviderPredicate;
	}
});
Object.defineProperty(exports, "isRetiredModelPickerProvider", {
	enumerable: true,
	get: function() {
		return isRetiredModelPickerProvider;
	}
});
