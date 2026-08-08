let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/config/sensitive-paths.ts
const NORMALIZED_SENSITIVE_KEY_WHITELIST_SUFFIXES = [
	"maxtokens",
	"maxoutputtokens",
	"maxinputtokens",
	"maxcompletiontokens",
	"contexttokens",
	"totaltokens",
	"tokencount",
	"tokenlimit",
	"tokenbudget",
	"passwordFile"
].map((suffix) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(suffix));
const SENSITIVE_PATTERNS = [
	/token$/i,
	/password/i,
	/secret/i,
	/api.?key/i,
	/encrypt.?key/i,
	/private.?key/i,
	/serviceaccount(?:ref)?$/i
];
function isWhitelistedSensitivePath(path) {
	const lowerPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(path);
	return NORMALIZED_SENSITIVE_KEY_WHITELIST_SUFFIXES.some((suffix) => lowerPath.endsWith(suffix));
}
function matchesSensitivePattern(path) {
	return SENSITIVE_PATTERNS.some((pattern) => pattern.test(path));
}
function isLocalServiceEnvValuePath(path) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(path).includes("localservice.env.");
}
/**
* Classifies config paths whose values should be redacted from UI/API output.
*
* This intentionally works from path labels, not schema nodes, so plugin-owned
* fields and raw local-service env vars get the same conservative treatment.
*/
function isSensitiveConfigPath(path) {
	return isLocalServiceEnvValuePath(path) || !isWhitelistedSensitivePath(path) && matchesSensitivePattern(path);
}
//#endregion
Object.defineProperty(exports, "isSensitiveConfigPath", {
	enumerable: true,
	get: function() {
		return isSensitiveConfigPath;
	}
});
