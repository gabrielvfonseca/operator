const require_security_path = require("./security-path-BgU1baP7.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/http-path.ts
/** Normalizes plugin HTTP paths to leading-slash form with optional fallback. */
function normalizePluginHttpPath(path, fallback) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(path);
	if (!trimmed) {
		const fallbackTrimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fallback);
		if (!fallbackTrimmed) return null;
		return fallbackTrimmed.startsWith("/") ? fallbackTrimmed : `/${fallbackTrimmed}`;
	}
	return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
//#endregion
//#region src/plugins/http-route-overlap.ts
/** Detects conflicting plugin HTTP routes before Gateway registration accepts them. */
function prefixMatchPath(pathname, prefix) {
	return pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}%`);
}
function doPluginHttpRoutesOverlap(a, b) {
	const aPath = require_security_path.canonicalizePathVariant(a.path);
	const bPath = require_security_path.canonicalizePathVariant(b.path);
	if (a.match === "exact" && b.match === "exact") return aPath === bPath;
	if (a.match === "prefix" && b.match === "prefix") return prefixMatchPath(aPath, bPath) || prefixMatchPath(bPath, aPath);
	const prefixRoute = a.match === "prefix" ? a : b;
	return prefixMatchPath(require_security_path.canonicalizePathVariant((a.match === "exact" ? a : b).path), require_security_path.canonicalizePathVariant(prefixRoute.path));
}
/** Finds the first existing route whose exact/prefix match space overlaps a candidate. */
function findOverlappingPluginHttpRoute(routes, candidate) {
	return routes.find((route) => doPluginHttpRoutesOverlap(route, candidate));
}
//#endregion
Object.defineProperty(exports, "findOverlappingPluginHttpRoute", {
	enumerable: true,
	get: function() {
		return findOverlappingPluginHttpRoute;
	}
});
Object.defineProperty(exports, "normalizePluginHttpPath", {
	enumerable: true,
	get: function() {
		return normalizePluginHttpPath;
	}
});
