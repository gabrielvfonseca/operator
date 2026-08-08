require("./fs-safe-defaults-bWM6YSZm.cjs");
require("@openclaw/fs-safe/advanced");
//#region src/infra/install-safe-path.ts
/** Returns the package basename for scoped npm names while preserving plain ids. */
function unscopedPackageName(name) {
	const trimmed = name.trim();
	if (!trimmed) return trimmed;
	return trimmed.includes("/") ? trimmed.split("/").pop() ?? trimmed : trimmed;
}
/** Matches a requested install id against either the full package name or unscoped basename. */
function packageNameMatchesId(packageName, id) {
	const trimmedId = id.trim();
	if (!trimmedId) return false;
	const trimmedPackageName = packageName.trim();
	if (!trimmedPackageName) return false;
	return trimmedId === trimmedPackageName || trimmedId === unscopedPackageName(trimmedPackageName);
}
//#endregion
Object.defineProperty(exports, "packageNameMatchesId", {
	enumerable: true,
	get: function() {
		return packageNameMatchesId;
	}
});
Object.defineProperty(exports, "unscopedPackageName", {
	enumerable: true,
	get: function() {
		return unscopedPackageName;
	}
});
