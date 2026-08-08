require("./rolldown-runtime-u92d-OFm.cjs");
const require_providers_runtime = require("./providers.runtime-C5KyGi_O.cjs");
const require_types = require("./types-UmTODxd_.cjs");
const require_provider_auth_choice = require("./provider-auth-choice-BDZeLIQ8.cjs");
const require_provider_wizard = require("./provider-wizard-LcwoCz2X.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/flows/provider-flow.runtime.ts
function resolveProviderDocsById(params) {
	return new Map(require_providers_runtime.resolvePluginProviders({
		config: params?.config,
		workspaceDir: params?.workspaceDir,
		env: params?.env,
		mode: "setup"
	}).filter((provider) => Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(provider.docsPath))).map((provider) => [provider.id, (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(provider.docsPath)]));
}
/** Resolves provider model-picker options without exposing contribution metadata. */
function resolveProviderModelPickerFlowEntries(params) {
	return resolveProviderModelPickerFlowContributions(params).map((contribution) => contribution.option);
}
/** Resolves provider model-picker contributions with docs metadata for setup UIs. */
function resolveProviderModelPickerFlowContributions(params) {
	const docsByProvider = resolveProviderDocsById(params ?? {});
	return require_types.sortFlowContributionsByLabel(require_provider_wizard.resolveProviderModelPickerEntries(params ?? {}).map((entry) => {
		const providerId = entry.value.startsWith("provider-plugin:") ? (0, _gabrielvfonseca_normalization_core.expectDefined)(entry.value.slice(16).split(":").at(0), "provider id") : entry.value;
		const docsPath = docsByProvider.get(providerId);
		return {
			id: `provider:model-picker:${entry.value}`,
			kind: "provider",
			surface: "model-picker",
			providerId,
			option: {
				value: entry.value,
				label: entry.label,
				...entry.hint ? { hint: entry.hint } : {},
				...docsPath ? { docs: { path: docsPath } } : {}
			},
			source: "runtime"
		};
	}));
}
//#endregion
//#region src/commands/model-picker.runtime.ts
/** Runtime dependency bundle for provider/model picker flows. */
/** Lazy runtime methods consumed by model picker command flows. */
const modelPickerRuntime = {
	resolveProviderModelPickerContributions: resolveProviderModelPickerFlowContributions,
	resolveProviderModelPickerEntries: resolveProviderModelPickerFlowEntries,
	resolveProviderPluginChoice: require_provider_wizard.resolveProviderPluginChoice,
	runProviderModelSelectedHook: require_provider_wizard.runProviderModelSelectedHook,
	resolvePluginProviders: require_providers_runtime.resolvePluginProviders,
	runProviderPluginAuthMethod: require_provider_auth_choice.runProviderPluginAuthMethod
};
//#endregion
exports.modelPickerRuntime = modelPickerRuntime;
