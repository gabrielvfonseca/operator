//#region src/shared/device-auth.ts
/** Normalize a device-auth role id without changing its case or namespace. */
function normalizeDeviceAuthRole(role) {
	return role.trim();
}
/** Normalize device-auth scopes, dedupe/sort them, and include implied operator scopes. */
function normalizeDeviceAuthScopes(scopes) {
	if (!Array.isArray(scopes)) return [];
	const out = /* @__PURE__ */ new Set();
	for (const scope of scopes) {
		if (typeof scope !== "string") continue;
		const trimmed = scope.trim();
		if (trimmed) out.add(trimmed);
	}
	if (out.has("operator.admin")) {
		out.add("operator.read");
		out.add("operator.write");
	} else if (out.has("operator.write")) out.add("operator.read");
	return [...out].toSorted();
}
//#endregion
Object.defineProperty(exports, "normalizeDeviceAuthRole", {
	enumerable: true,
	get: function() {
		return normalizeDeviceAuthRole;
	}
});
Object.defineProperty(exports, "normalizeDeviceAuthScopes", {
	enumerable: true,
	get: function() {
		return normalizeDeviceAuthScopes;
	}
});
