require("./path-safety-D8QlW0vG.cjs");
//#region src/security/scan-paths.ts
/** Return true for extension paths intentionally skipped by source scanners. */
function extensionUsesSkippedScannerPath(entry) {
	return entry.split(/[\\/]+/).filter(Boolean).some((segment) => segment === "node_modules" || segment.startsWith(".") && segment !== "." && segment !== "..");
}
//#endregion
Object.defineProperty(exports, "extensionUsesSkippedScannerPath", {
	enumerable: true,
	get: function() {
		return extensionUsesSkippedScannerPath;
	}
});
