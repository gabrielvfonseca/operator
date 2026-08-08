const require_exec_safe_bin_trust = require("./exec-safe-bin-trust-CoGK22qG.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/exec-safe-bin-config.ts
function normalizeConfiguredSafeBins(entries) {
	if (!Array.isArray(entries)) return [];
	return Array.from(new Set(entries.map((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry) ?? "").filter((entry) => entry.length > 0))).toSorted();
}
function normalizeConfiguredTrustedSafeBinDirs(entries) {
	if (!Array.isArray(entries)) return [];
	return require_exec_safe_bin_trust.normalizeTrustedSafeBinDirs(entries.filter((entry) => typeof entry === "string"));
}
//#endregion
Object.defineProperty(exports, "normalizeConfiguredSafeBins", {
	enumerable: true,
	get: function() {
		return normalizeConfiguredSafeBins;
	}
});
Object.defineProperty(exports, "normalizeConfiguredTrustedSafeBinDirs", {
	enumerable: true,
	get: function() {
		return normalizeConfiguredTrustedSafeBinDirs;
	}
});
