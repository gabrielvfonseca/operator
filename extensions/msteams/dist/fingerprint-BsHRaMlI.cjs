let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/tls/fingerprint.ts
function normalizeFingerprint(input) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(input.trim().replace(/^sha-?256\s*:?\s*/i, "").replace(/[^a-fA-F0-9]/g, ""));
}
//#endregion
Object.defineProperty(exports, "normalizeFingerprint", {
	enumerable: true,
	get: function() {
		return normalizeFingerprint;
	}
});
