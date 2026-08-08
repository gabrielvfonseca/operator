const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./json-files-Bp0Z4DKb.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/infra/package-json.ts
/** Reads package.json as a loose object, returning null for missing or invalid manifests. */
async function readPackageJson(root) {
	const parsed = await (0, _openclaw_fs_safe_json.tryReadJson)(node_path.default.join(root, "package.json"));
	return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
}
/** Reads and trims the package version string, returning null for blank or non-string values. */
async function readPackageVersion(root) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)((await readPackageJson(root))?.version);
}
/** Reads and trims the package name string, returning null for blank or non-string values. */
async function readPackageName(root) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)((await readPackageJson(root))?.name);
}
/** Reads and trims the packageManager spec, returning null for blank or non-string values. */
async function readPackageManagerSpec(root) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)((await readPackageJson(root))?.packageManager);
}
//#endregion
Object.defineProperty(exports, "readPackageManagerSpec", {
	enumerable: true,
	get: function() {
		return readPackageManagerSpec;
	}
});
Object.defineProperty(exports, "readPackageName", {
	enumerable: true,
	get: function() {
		return readPackageName;
	}
});
Object.defineProperty(exports, "readPackageVersion", {
	enumerable: true,
	get: function() {
		return readPackageVersion;
	}
});
