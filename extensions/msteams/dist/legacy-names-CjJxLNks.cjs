//#region src/compat/legacy-names.ts
const PROJECT_NAME = "@gabrielvfonseca/operator";
const LEGACY_PROJECT_NAMES = ["clawdbot"];
const MANIFEST_KEY = PROJECT_NAME;
/** Manifest keys accepted only for legacy compatibility. */
const LEGACY_MANIFEST_KEYS = LEGACY_PROJECT_NAMES;
//#endregion
Object.defineProperty(exports, "LEGACY_MANIFEST_KEYS", {
	enumerable: true,
	get: function() {
		return LEGACY_MANIFEST_KEYS;
	}
});
Object.defineProperty(exports, "MANIFEST_KEY", {
	enumerable: true,
	get: function() {
		return MANIFEST_KEY;
	}
});
