require("@gabrielvfonseca/model-catalog-core/provider-id");
require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/provider-auth-token.ts
const ANTHROPIC_SETUP_TOKEN_PREFIX = "sk-ant-oat01-";
const ANTHROPIC_SETUP_TOKEN_MIN_LENGTH = 80;
/** @deprecated Anthropic provider-owned setup helper; do not use from third-party plugins. */
function validateAnthropicSetupToken(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return "Required";
	if (!trimmed.startsWith(ANTHROPIC_SETUP_TOKEN_PREFIX)) return `Expected token starting with ${ANTHROPIC_SETUP_TOKEN_PREFIX}`;
	if (trimmed.length < ANTHROPIC_SETUP_TOKEN_MIN_LENGTH) return "Token looks too short; paste the full setup-token";
}
//#endregion
Object.defineProperty(exports, "validateAnthropicSetupToken", {
	enumerable: true,
	get: function() {
		return validateAnthropicSetupToken;
	}
});
