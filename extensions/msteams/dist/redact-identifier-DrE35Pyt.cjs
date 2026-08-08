const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/logging/redact-identifier.ts
/** Returns a stable sha256 hex prefix for non-secret identifier correlation. */
function sha256HexPrefix(value, len = 12) {
	return require_crypto_digest.sha256HexPrefix(value, Number.isFinite(len) ? Math.max(1, Math.floor(len)) : 12);
}
/** Redacts an identifier to a stable hash label, or "-" for missing values. */
function redactIdentifier(value, opts) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return "-";
	return `sha256:${sha256HexPrefix(trimmed, opts?.len ?? 12)}`;
}
//#endregion
Object.defineProperty(exports, "redactIdentifier", {
	enumerable: true,
	get: function() {
		return redactIdentifier;
	}
});
Object.defineProperty(exports, "sha256HexPrefix", {
	enumerable: true,
	get: function() {
		return sha256HexPrefix;
	}
});
