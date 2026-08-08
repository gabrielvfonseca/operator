const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./runtime-DUfj3X7c.cjs");
require("./http-route-overlap-JQrpGIgZ.cjs");
let node_async_hooks = require("node:async_hooks");
//#region src/plugins/http-registry.ts
var http_registry_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ withPluginHttpRouteRegistry: () => withPluginHttpRouteRegistry });
const pluginHttpRouteRegistryScope = new node_async_hooks.AsyncLocalStorage();
function withPluginHttpRouteRegistry(registry, run) {
	return pluginHttpRouteRegistryScope.run(registry, run);
}
//#endregion
Object.defineProperty(exports, "http_registry_exports", {
	enumerable: true,
	get: function() {
		return http_registry_exports;
	}
});
Object.defineProperty(exports, "withPluginHttpRouteRegistry", {
	enumerable: true,
	get: function() {
		return withPluginHttpRouteRegistry;
	}
});
