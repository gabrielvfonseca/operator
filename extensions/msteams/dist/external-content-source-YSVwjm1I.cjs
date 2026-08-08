let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/security/external-content-source.ts
/**
* Resolve a hook session key into its external content source.
* Unknown `hook:*` sessions are treated as webhooks so legacy/custom hooks stay wrapped.
*/
function resolveHookExternalContentSource(sessionKey) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionKey);
	if (normalized.startsWith("hook:gmail:")) return "gmail";
	if (normalized.startsWith("hook:webhook:") || normalized.startsWith("hook:")) return "webhook";
}
/** Map hook session provenance to the prompt-facing external content source label. */
function mapHookExternalContentSource(source) {
	return source === "gmail" ? "email" : "webhook";
}
/** Return true when a session key should receive external-content prompt wrapping. */
function isExternalHookSession(sessionKey) {
	return resolveHookExternalContentSource(sessionKey) !== void 0;
}
//#endregion
Object.defineProperty(exports, "isExternalHookSession", {
	enumerable: true,
	get: function() {
		return isExternalHookSession;
	}
});
Object.defineProperty(exports, "mapHookExternalContentSource", {
	enumerable: true,
	get: function() {
		return mapHookExternalContentSource;
	}
});
Object.defineProperty(exports, "resolveHookExternalContentSource", {
	enumerable: true,
	get: function() {
		return resolveHookExternalContentSource;
	}
});
