const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_setup_registry = require("./setup-registry-bM3fH6vu.cjs");
const require_providers_runtime = require("./providers.runtime-C5KyGi_O.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/provider-wizard.ts
/** Provider setup wizard helpers shared by provider plugins and CLI setup flows. */
const PROVIDER_PLUGIN_CHOICE_PREFIX = "provider-plugin:";
function resolveWizardSetupChoiceId(provider, wizard) {
	const explicit = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(wizard.choiceId);
	if (explicit) return explicit;
	const explicitMethodId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(wizard.methodId);
	if (explicitMethodId) return buildProviderPluginMethodChoice(provider.id, explicitMethodId);
	if (provider.auth.length === 1) return provider.id;
	return buildProviderPluginMethodChoice(provider.id, provider.auth[0]?.id ?? "default");
}
function resolveMethodById(provider, methodId) {
	const normalizedMethodId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(methodId);
	if (!normalizedMethodId) return provider.auth[0];
	return provider.auth.find((method) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(method.id) === normalizedMethodId);
}
function listMethodWizardSetups(provider) {
	return provider.auth.map((method) => method.wizard ? {
		method,
		wizard: method.wizard
	} : null).filter((entry) => Boolean(entry));
}
function buildProviderPluginMethodChoice(providerId, methodId) {
	return `${PROVIDER_PLUGIN_CHOICE_PREFIX}${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerId) ?? ""}:${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(methodId) ?? ""}`;
}
function resolveProviderWizardProviders(params) {
	return require_providers_runtime.resolvePluginProviders({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		mode: "setup"
	});
}
function resolveModelPickerChoiceValue(provider, modelPicker) {
	const explicitMethodId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(modelPicker.methodId);
	if (explicitMethodId) return buildProviderPluginMethodChoice(provider.id, explicitMethodId);
	if (provider.auth.length === 1) return provider.id;
	return buildProviderPluginMethodChoice(provider.id, provider.auth[0]?.id ?? "default");
}
function resolveProviderModelPickerEntries(params) {
	const providers = resolveProviderWizardProviders(params);
	const entries = [];
	for (const provider of providers) {
		const modelPicker = provider.wizard?.modelPicker;
		if (!modelPicker) continue;
		entries.push({
			value: resolveModelPickerChoiceValue(provider, modelPicker),
			label: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(modelPicker.label) || `${provider.label} (custom)`,
			hint: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(modelPicker.hint)
		});
	}
	return entries;
}
function resolveProviderPluginChoice(params) {
	const choice = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.choice) ?? "";
	if (!choice) return null;
	if (choice.startsWith(PROVIDER_PLUGIN_CHOICE_PREFIX)) {
		const payload = choice.slice(16);
		const separator = payload.indexOf(":");
		const providerId = separator >= 0 ? payload.slice(0, separator) : payload;
		const methodId = separator >= 0 ? payload.slice(separator + 1) : void 0;
		const provider = params.providers.find((entry) => require_model_selection_normalize.normalizeProviderId(entry.id) === require_model_selection_normalize.normalizeProviderId(providerId));
		if (!provider) return null;
		const method = resolveMethodById(provider, methodId);
		return method ? {
			provider,
			method
		} : null;
	}
	for (const provider of params.providers) {
		for (const { method, wizard } of listMethodWizardSetups(provider)) if (((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(wizard.choiceId) || buildProviderPluginMethodChoice(provider.id, method.id)) ?? "") === choice) return {
			provider,
			method,
			wizard
		};
		const setup = provider.wizard?.setup;
		if (setup) {
			if (((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolveWizardSetupChoiceId(provider, setup)) ?? "") === choice) {
				const method = resolveMethodById(provider, setup.methodId);
				if (method) return {
					provider,
					method,
					wizard: setup
				};
			}
		}
		if (require_model_selection_normalize.normalizeProviderId(provider.id) === require_model_selection_normalize.normalizeProviderId(choice) && provider.auth.length > 0) return {
			provider,
			method: (0, _gabrielvfonseca_normalization_core.expectDefined)(provider.auth[0], "auth entry at 0")
		};
	}
	return null;
}
async function runProviderModelSelectedHook(params) {
	const rawModel = params.model.trim();
	if (!rawModel) return;
	const slashIndex = rawModel.indexOf("/");
	const selectedProviderId = slashIndex === -1 ? require_defaults.DEFAULT_PROVIDER : require_model_selection_normalize.normalizeProviderId(rawModel.slice(0, slashIndex).trim());
	if (!selectedProviderId || slashIndex !== -1 && !rawModel.slice(slashIndex + 1).trim()) return;
	const provider = require_setup_registry.resolvePluginSetupProvider({
		provider: selectedProviderId,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) ?? resolveProviderWizardProviders({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}).find((entry) => require_model_selection_normalize.normalizeProviderId(entry.id) === selectedProviderId);
	if (!provider?.onModelSelected) return;
	await provider.onModelSelected({
		config: params.config,
		model: params.model,
		prompter: params.prompter,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	});
}
//#endregion
Object.defineProperty(exports, "resolveProviderModelPickerEntries", {
	enumerable: true,
	get: function() {
		return resolveProviderModelPickerEntries;
	}
});
Object.defineProperty(exports, "resolveProviderPluginChoice", {
	enumerable: true,
	get: function() {
		return resolveProviderPluginChoice;
	}
});
Object.defineProperty(exports, "runProviderModelSelectedHook", {
	enumerable: true,
	get: function() {
		return runProviderModelSelectedHook;
	}
});
