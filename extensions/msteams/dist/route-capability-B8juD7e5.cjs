const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plugin_node_capability = require("./plugin-node-capability-BqUNVkTg.cjs");
const require_route_match = require("./route-match-BIgMHY40.cjs");
//#region src/gateway/server/plugins-http/route-capability.ts
var route_capability_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	findMatchingPluginNodeCapabilityRoute: () => findMatchingPluginNodeCapabilityRoute,
	listPluginNodeCapabilities: () => listPluginNodeCapabilities
});
function hasNodeCapabilityRoute(route) {
	return Boolean(route.nodeCapability?.surface?.trim());
}
function resolvePluginNodeCapabilityRouteSurface(route) {
	const surface = route.nodeCapability.surface.trim();
	const owner = route.pluginId?.trim() || route.source?.trim();
	return {
		...route.nodeCapability,
		surface,
		...owner ? { scopeKey: `${owner}:${surface}` } : {}
	};
}
/** Lists all node-capability routes matching the already canonicalized path context. */
function findMatchingPluginNodeCapabilityRoutes(registry, context) {
	return require_route_match.findMatchingPluginHttpRoutes(registry, context).filter(hasNodeCapabilityRoute).map((route) => Object.assign({}, route, { nodeCapability: resolvePluginNodeCapabilityRouteSurface(route) }));
}
/** Returns the highest-priority node-capability route for a plugin HTTP path. */
function findMatchingPluginNodeCapabilityRoute(registry, context) {
	return findMatchingPluginNodeCapabilityRoutes(registry, context)[0];
}
/** Lists unique node-capability surfaces, preferring the shortest TTL per surface. */
function listPluginNodeCapabilities(registry) {
	const surfaces = /* @__PURE__ */ new Map();
	for (const route of registry.httpRoutes ?? []) {
		const surface = route.nodeCapability?.surface?.trim();
		if (surface) {
			const next = resolvePluginNodeCapabilityRouteSurface(route);
			const existing = surfaces.get(surface);
			if (!existing || resolveTtlMs(next) < resolveTtlMs(existing)) surfaces.set(surface, next);
		}
	}
	return [...surfaces.values()].toSorted((a, b) => a.surface.localeCompare(b.surface));
}
function resolveTtlMs(surface) {
	return require_plugin_node_capability.resolvePluginNodeCapabilityTtlMs(surface);
}
//#endregion
Object.defineProperty(exports, "findMatchingPluginNodeCapabilityRoute", {
	enumerable: true,
	get: function() {
		return findMatchingPluginNodeCapabilityRoute;
	}
});
Object.defineProperty(exports, "route_capability_exports", {
	enumerable: true,
	get: function() {
		return route_capability_exports;
	}
});
