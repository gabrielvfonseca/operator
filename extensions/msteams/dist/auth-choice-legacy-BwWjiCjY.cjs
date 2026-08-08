const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_provider_auth_choices = require("./provider-auth-choices-Dr0zOwrP.cjs");
//#region src/commands/auth-choice-legacy.ts
var auth_choice_legacy_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ normalizeLegacyOnboardAuthChoice: () => normalizeLegacyOnboardAuthChoice });
const LEGACY_REPLACEMENT_AUTH_CHOICES = /* @__PURE__ */ new Set(["claude-cli"]);
function resolveLegacyCliBackendChoice(choice, params) {
	if (!LEGACY_REPLACEMENT_AUTH_CHOICES.has(choice)) return;
	return require_provider_auth_choices.resolveManifestDeprecatedProviderAuthChoice(choice, params);
}
/** Map old onboard auth choices to their current provider-backed choices. */
function normalizeLegacyOnboardAuthChoice(authChoice, params) {
	if (authChoice === "oauth") return "setup-token";
	if (typeof authChoice === "string") {
		const deprecatedChoice = resolveLegacyCliBackendChoice(authChoice, params);
		if (deprecatedChoice) return deprecatedChoice.choiceId;
	}
	return authChoice;
}
//#endregion
Object.defineProperty(exports, "auth_choice_legacy_exports", {
	enumerable: true,
	get: function() {
		return auth_choice_legacy_exports;
	}
});
Object.defineProperty(exports, "normalizeLegacyOnboardAuthChoice", {
	enumerable: true,
	get: function() {
		return normalizeLegacyOnboardAuthChoice;
	}
});
