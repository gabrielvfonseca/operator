let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/net/hostname.ts
/** Normalize a hostname for policy comparisons. */
function normalizeHostname(hostname) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(hostname).replace(/\.+$/, "");
	if (normalized.startsWith("[") && normalized.endsWith("]")) return normalized.slice(1, -1);
	return normalized;
}
//#endregion
Object.defineProperty(exports, "normalizeHostname", {
	enumerable: true,
	get: function() {
		return normalizeHostname;
	}
});
