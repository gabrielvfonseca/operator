let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/security/secret-mask.ts
/** Masks credential-like values without splitting UTF-16 surrogate pairs at the edges. */
function maskApiKey(value) {
	const trimmed = stripControlCharacters(value).trim();
	if (!trimmed) return "missing";
	if (trimmed.length <= 6) return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, 0, 1)}...${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, -1)}`;
	if (trimmed.length <= 16) return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, 0, 2)}...${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, -2)}`;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, 0, 8)}...${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, -8)}`;
}
function stripControlCharacters(value) {
	let result = "";
	for (const character of value) {
		const code = character.charCodeAt(0);
		if (!(code >= 0 && code <= 31 || code >= 127 && code <= 159)) result += character;
	}
	return result;
}
//#endregion
Object.defineProperty(exports, "maskApiKey", {
	enumerable: true,
	get: function() {
		return maskApiKey;
	}
});
