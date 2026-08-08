require("./rolldown-runtime-u92d-OFm.cjs");
const require_provider_auth_input = require("./provider-auth-input-BdWiVgmd.cjs");
const require_provider_auth_choice_helpers = require("./provider-auth-choice-helpers-uTSu1Fwu.cjs");
const require_provider_auth_choice_runtime = require("./provider-auth-choice.runtime-Vopx4913.cjs");
//#region src/commands/auth-choice.apply.api-providers.ts
function resolveProviderAuthChoiceByKind(params) {
	return require_provider_auth_choice_helpers.resolveProviderMatch(require_provider_auth_choice_runtime.resolvePluginProviders({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		mode: "setup"
	}), params.providerId)?.auth.find((method) => method.kind === params.kind)?.wizard?.choiceId;
}
/** Translate generic api-key/token choices to provider-specific auth choices when possible. */
function normalizeApiKeyTokenProviderAuthChoice(params) {
	if (!params.tokenProvider) return params.authChoice;
	const normalizedTokenProvider = require_provider_auth_input.normalizeTokenProviderInput(params.tokenProvider);
	if (!normalizedTokenProvider) return params.authChoice;
	if (params.authChoice === "token" || params.authChoice === "setup-token") return resolveProviderAuthChoiceByKind({
		providerId: normalizedTokenProvider,
		kind: "token",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) ?? params.authChoice;
	if (params.authChoice !== "apiKey") return params.authChoice;
	return resolveProviderAuthChoiceByKind({
		providerId: normalizedTokenProvider,
		kind: "api_key",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) ?? params.authChoice;
}
//#endregion
exports.normalizeApiKeyTokenProviderAuthChoice = normalizeApiKeyTokenProviderAuthChoice;
