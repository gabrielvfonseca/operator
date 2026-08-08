const require_plain_object = require("./plain-object-CITRo0uW.cjs");
require("./utils-CXqBhRFw.cjs");
let node_util = require("node:util");
//#region src/gateway/config-diff.ts
/** Return dotted config paths whose values differ between two config snapshots. */
function diffConfigPaths(prev, next, prefix = "") {
	if (prev === next) return [];
	if (require_plain_object.isPlainObject(prev) && require_plain_object.isPlainObject(next)) {
		const keys = /* @__PURE__ */ new Set([...Object.keys(prev), ...Object.keys(next)]);
		const paths = [];
		for (const key of keys) {
			const prevValue = prev[key];
			const nextValue = next[key];
			if (prevValue === void 0 && nextValue === void 0) continue;
			const childPaths = diffConfigPaths(prevValue, nextValue, prefix ? `${prefix}.${key}` : key);
			if (childPaths.length > 0) paths.push(...childPaths);
		}
		return paths;
	}
	if (Array.isArray(prev) && Array.isArray(next)) {
		if ((0, node_util.isDeepStrictEqual)(prev, next)) return [];
	}
	return [prefix || "<root>"];
}
/** Preserve startup-only restart boundaries hidden by whole-object config changes. */
function diffGatewayReloadPaths(prevConfig, nextConfig) {
	const changedPaths = diffConfigPaths(prevConfig, nextConfig);
	if (!changedPaths.includes("mcp")) return changedPaths;
	return [...changedPaths, ...diffConfigPaths({ mcp: { apps: prevConfig.mcp?.apps } }, { mcp: { apps: nextConfig.mcp?.apps } })];
}
//#endregion
Object.defineProperty(exports, "diffConfigPaths", {
	enumerable: true,
	get: function() {
		return diffConfigPaths;
	}
});
Object.defineProperty(exports, "diffGatewayReloadPaths", {
	enumerable: true,
	get: function() {
		return diffGatewayReloadPaths;
	}
});
