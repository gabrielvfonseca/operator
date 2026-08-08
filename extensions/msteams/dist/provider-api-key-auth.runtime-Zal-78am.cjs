require("./rolldown-runtime-u92d-OFm.cjs");
const require_provider_auth_input = require("./provider-auth-input-BdWiVgmd.cjs");
const require_provider_auth_helpers = require("./provider-auth-helpers-BccqssEk.cjs");
const require_provider_model_primary = require("./provider-model-primary-QsS3aK4q.cjs");
//#region src/plugins/provider-api-key-auth.runtime.ts
/** Runtime API-key auth helper bundle exposed to provider setup code. */
const providerApiKeyAuthRuntime = {
	applyAuthProfileConfig: require_provider_auth_helpers.applyAuthProfileConfig,
	applyPrimaryModel: require_provider_model_primary.applyPrimaryModel,
	buildApiKeyCredential: require_provider_auth_helpers.buildApiKeyCredential,
	ensureApiKeyFromOptionEnvOrPrompt: require_provider_auth_input.ensureApiKeyFromOptionEnvOrPrompt,
	normalizeApiKeyInput: require_provider_auth_input.normalizeApiKeyInput,
	validateApiKeyInput: require_provider_auth_input.validateApiKeyInput
};
//#endregion
exports.providerApiKeyAuthRuntime = providerApiKeyAuthRuntime;
