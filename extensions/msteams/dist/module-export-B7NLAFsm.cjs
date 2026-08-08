//#region src/plugins/module-export.ts
/** Unwraps nested default exports produced by mixed ESM/CJS plugin bundles. */
function unwrapDefaultModuleExport(moduleExport) {
	let resolved = moduleExport;
	const seen = /* @__PURE__ */ new Set();
	while (resolved && typeof resolved === "object" && "default" in resolved && !seen.has(resolved)) {
		seen.add(resolved);
		resolved = resolved.default;
	}
	return resolved;
}
//#endregion
Object.defineProperty(exports, "unwrapDefaultModuleExport", {
	enumerable: true,
	get: function() {
		return unwrapDefaultModuleExport;
	}
});
