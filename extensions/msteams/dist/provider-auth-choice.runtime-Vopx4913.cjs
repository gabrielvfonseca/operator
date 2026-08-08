require("./rolldown-runtime-u92d-OFm.cjs");
const require_setup_registry = require("./setup-registry-bM3fH6vu.cjs");
const require_providers_runtime = require("./providers.runtime-C5KyGi_O.cjs");
const require_provider_wizard = require("./provider-wizard-LcwoCz2X.cjs");
//#region src/plugins/provider-auth-choice.runtime.ts
/** Runtime wrapper for provider plugin wizard choice resolution. */
function resolveProviderPluginChoice(...args) {
	return require_provider_wizard.resolveProviderPluginChoice(...args);
}
/** Runtime wrapper for provider model-selected hook dispatch. */
function runProviderModelSelectedHook(...args) {
	return require_provider_wizard.runProviderModelSelectedHook(...args);
}
/** Runtime wrapper for registered model provider discovery. */
function resolvePluginProviders(...args) {
	return require_providers_runtime.resolvePluginProviders(...args);
}
/** Runtime wrapper for plugin setup-provider discovery. */
function resolvePluginSetupProvider(...args) {
	return require_setup_registry.resolvePluginSetupProvider(...args);
}
//#endregion
exports.resolvePluginProviders = resolvePluginProviders;
exports.resolvePluginSetupProvider = resolvePluginSetupProvider;
exports.resolveProviderPluginChoice = resolveProviderPluginChoice;
exports.runProviderModelSelectedHook = runProviderModelSelectedHook;
