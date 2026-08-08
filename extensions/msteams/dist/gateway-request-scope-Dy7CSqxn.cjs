const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
let node_async_hooks = require("node:async_hooks");
//#region src/plugins/runtime/gateway-request-scope.ts
const pluginRuntimeGatewayRequestScope = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.pluginRuntimeGatewayRequestScope"), () => new node_async_hooks.AsyncLocalStorage());
/**
* Runs plugin gateway handlers with request-scoped context that runtime helpers can read.
*/
function withPluginRuntimeGatewayRequestScope(scope, run) {
	return pluginRuntimeGatewayRequestScope.run(scope, run);
}
/**
* Runs work under the current gateway request scope while attaching plugin identity.
*/
function withPluginRuntimePluginScope(scope, run) {
	const current = pluginRuntimeGatewayRequestScope.getStore();
	const scoped = current ? {
		...current,
		pluginId: scope.pluginId
	} : {
		pluginId: scope.pluginId,
		isWebchatConnect: () => false
	};
	if (scope.pluginSource !== void 0) scoped.pluginSource = scope.pluginSource;
	else delete scoped.pluginSource;
	if (scope.pluginOrigin !== void 0) scoped.pluginOrigin = scope.pluginOrigin;
	else delete scoped.pluginOrigin;
	if (scope.pluginTrustedOfficialInstall !== void 0) scoped.pluginTrustedOfficialInstall = scope.pluginTrustedOfficialInstall;
	else delete scoped.pluginTrustedOfficialInstall;
	return pluginRuntimeGatewayRequestScope.run(scoped, run);
}
/**
* Runs work under the current gateway request scope while attaching plugin identity.
*/
function withPluginRuntimePluginIdScope(pluginId, run) {
	return withPluginRuntimePluginScope({ pluginId }, run);
}
/**
* Returns the current plugin gateway request scope when called from a plugin request handler.
*/
function getPluginRuntimeGatewayRequestScope() {
	return pluginRuntimeGatewayRequestScope.getStore();
}
//#endregion
Object.defineProperty(exports, "getPluginRuntimeGatewayRequestScope", {
	enumerable: true,
	get: function() {
		return getPluginRuntimeGatewayRequestScope;
	}
});
Object.defineProperty(exports, "withPluginRuntimeGatewayRequestScope", {
	enumerable: true,
	get: function() {
		return withPluginRuntimeGatewayRequestScope;
	}
});
Object.defineProperty(exports, "withPluginRuntimePluginIdScope", {
	enumerable: true,
	get: function() {
		return withPluginRuntimePluginIdScope;
	}
});
Object.defineProperty(exports, "withPluginRuntimePluginScope", {
	enumerable: true,
	get: function() {
		return withPluginRuntimePluginScope;
	}
});
