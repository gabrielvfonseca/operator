const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_provider_auth_choices = require("./provider-auth-choices-Dr0zOwrP.cjs");
//#region src/agents/provider-auth-recovery-hint.ts
/**
* Provider authentication recovery hint builder.
*
* Prefers plugin manifest login commands, then falls back to configure/env-var guidance.
*/
function normalizeProviderIdForAuth(providerId, aliases) {
	const normalized = require_model_selection_normalize.normalizeProviderId(providerId);
	return normalized ? aliases[normalized] ?? normalized : normalized;
}
function matchesProviderAuthChoice(choice, providerId, aliases) {
	const normalized = normalizeProviderIdForAuth(providerId, aliases);
	if (!normalized) return false;
	return normalizeProviderIdForAuth(choice.providerId, aliases) === normalized;
}
function resolveProviderAuthLoginCommand(params) {
	const aliases = require_provider_auth_aliases.resolveProviderAuthAliasMap(params);
	const choice = require_provider_auth_choices.resolveManifestProviderAuthChoices(params).find((candidate) => matchesProviderAuthChoice(candidate, params.provider, aliases));
	if (!choice) return;
	return require_command_format.formatCliCommand(`operator models auth login --provider ${normalizeProviderIdForAuth(choice.providerId, aliases)}`);
}
/** Build a concise user-facing hint for recovering provider authentication. */
function buildProviderAuthRecoveryHint(params) {
	const loginCommand = resolveProviderAuthLoginCommand(params);
	const parts = [];
	if (loginCommand) parts.push(`Run \`${loginCommand}\``);
	if (params.includeConfigure !== false) parts.push(`\`${require_command_format.formatCliCommand("operator configure")}\``);
	if (params.includeEnvVar) parts.push("set an API key env var");
	if (parts.length === 0) return `Run \`${require_command_format.formatCliCommand("operator configure")}\`.`;
	if (parts.length === 1) return `${parts[0]}.`;
	if (parts.length === 2) return `${parts[0]} or ${parts[1]}.`;
	return `${parts[0]}, ${parts[1]}, or ${parts[2]}.`;
}
//#endregion
Object.defineProperty(exports, "buildProviderAuthRecoveryHint", {
	enumerable: true,
	get: function() {
		return buildProviderAuthRecoveryHint;
	}
});
