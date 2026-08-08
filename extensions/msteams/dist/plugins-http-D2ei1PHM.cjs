require("./rolldown-runtime-u92d-OFm.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_gateway_request_scope = require("./gateway-request-scope-Dy7CSqxn.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_route_auth = require("./route-auth-JDdfCBmE.cjs");
const require_route_match = require("./route-match-BIgMHY40.cjs");
const require_plugin_route_runtime_scopes = require("./plugin-route-runtime-scopes-DFu2WGEU.cjs");
//#region src/gateway/server/plugins-http.ts
function resolvePluginRoutePathContextForRequest(req, providedPathContext) {
	if (providedPathContext) return providedPathContext;
	return require_route_match.resolvePluginRoutePathContext(new URL(req.url ?? "/", "http://localhost").pathname);
}
function createPluginRouteRuntimeClient(scopes, clientIp) {
	return {
		connId: `plugin-http:${clientIp ?? "unknown"}`,
		...clientIp ? { clientIp } : {},
		connect: {
			minProtocol: 4,
			maxProtocol: 4,
			client: {
				id: require_client_info.GATEWAY_CLIENT_IDS.GATEWAY_CLIENT,
				version: "internal",
				platform: "node",
				mode: require_client_info.GATEWAY_CLIENT_MODES.BACKEND
			},
			role: "operator",
			scopes: [...scopes]
		}
	};
}
function writeUpgradeUnauthorized(socket) {
	socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
	socket.destroy();
}
function getMissingPluginRouteRuntimeContext(route, context) {
	if (route.auth !== "gateway") return;
	if (route.gatewayRuntimeScopeSurface === "trusted-operator") return context.gatewayRequestAuth ? void 0 : "caller auth context";
	return context.gatewayRequestOperatorScopes === void 0 ? "caller scope context" : void 0;
}
function canRunPluginHttpRouteWithoutAdmission(route) {
	return route.auth === "gateway" && route.gatewayRuntimeScopeSurface === "trusted-operator" && route.gatewayMethodDispatchAllowed === true;
}
function createPluginRouteRuntimeScope(params) {
	const runtimeClient = createPluginRouteRuntimeClient(params.route.auth !== "gateway" ? [] : params.route.gatewayRuntimeScopeSurface === "trusted-operator" ? require_plugin_route_runtime_scopes.resolvePluginRouteRuntimeOperatorScopes(params.req, params.gatewayRequestAuth, "trusted-operator") : params.gatewayRequestOperatorScopes, params.gatewayRequestClientIp);
	return {
		...params.gatewayRequestContext ? { context: params.gatewayRequestContext } : {},
		client: runtimeClient,
		isWebchatConnect: () => false,
		...params.route.pluginId ? { pluginId: params.route.pluginId } : {},
		...params.route.source ? { pluginSource: params.route.source } : {},
		...params.route.gatewayMethodDispatchAllowed === true ? { gatewayMethodDispatchAllowed: true } : {}
	};
}
function createGatewayPluginRequestHandler(params) {
	const { log } = params;
	return async (req, res, providedPathContext, dispatchContext) => {
		const registry = params.getRouteRegistry?.() ?? params.registry;
		const gatewayRequestContext = params.getGatewayRequestContext?.();
		if ((registry.httpRoutes ?? []).length === 0) return false;
		const pathContext = resolvePluginRoutePathContextForRequest(req, providedPathContext);
		const matchedRoutes = require_route_match.findMatchingPluginHttpRoutes(registry, pathContext);
		if (matchedRoutes.length === 0) return false;
		if (require_route_auth.matchedPluginRoutesRequireGatewayAuth(matchedRoutes) && dispatchContext?.gatewayAuthSatisfied !== true) {
			log.warn(`plugin http route blocked without gateway auth (${pathContext.canonicalPath})`);
			return false;
		}
		const gatewayRequestAuth = dispatchContext?.gatewayRequestAuth;
		const gatewayRequestOperatorScopes = dispatchContext?.gatewayRequestOperatorScopes;
		for (const route of matchedRoutes) {
			const missingRuntimeContext = getMissingPluginRouteRuntimeContext(route, {
				gatewayRequestAuth,
				gatewayRequestOperatorScopes
			});
			if (missingRuntimeContext) {
				log.warn(`plugin http route blocked without ${missingRuntimeContext} (${pathContext.canonicalPath})`);
				return false;
			}
		}
		for (const route of matchedRoutes) try {
			const runRoute = async () => await require_gateway_request_scope.withPluginRuntimeGatewayRequestScope(createPluginRouteRuntimeScope({
				route,
				req,
				gatewayRequestContext,
				gatewayRequestAuth,
				gatewayRequestOperatorScopes,
				gatewayRequestClientIp: dispatchContext?.gatewayRequestClientIp
			}), async () => route.handler(req, res)) !== false;
			if (canRunPluginHttpRouteWithoutAdmission(route) ? await runRoute() : await require_route_auth.runWithGatewayHttpWorkAdmission(res, runRoute)) return true;
		} catch (err) {
			log.warn(`plugin http route failed (${route.pluginId ?? "unknown"}): ${String(err)}`);
			if (!res.headersSent) {
				res.statusCode = 500;
				res.setHeader("Content-Type", "text/plain; charset=utf-8");
				res.end("Internal Server Error");
			} else if (!res.writableEnded && !res.destroyed) res.end();
			return true;
		}
		return false;
	};
}
function createGatewayPluginUpgradeHandler(params) {
	const { log } = params;
	return async (req, socket, head, providedPathContext, dispatchContext) => {
		const registry = params.getRouteRegistry?.() ?? params.registry;
		const gatewayRequestContext = params.getGatewayRequestContext?.();
		if ((registry.httpRoutes ?? []).length === 0) return false;
		const pathContext = resolvePluginRoutePathContextForRequest(req, providedPathContext);
		const matchedRoutes = require_route_match.findMatchingPluginHttpRoutes(registry, pathContext).filter((route) => typeof route.handleUpgrade === "function");
		if (matchedRoutes.length === 0) return false;
		if (require_route_auth.matchedPluginRoutesRequireGatewayAuth(matchedRoutes) && dispatchContext?.gatewayAuthSatisfied !== true) {
			log.warn(`plugin http upgrade blocked without gateway auth (${pathContext.canonicalPath})`);
			writeUpgradeUnauthorized(socket);
			return true;
		}
		const gatewayRequestAuth = dispatchContext?.gatewayRequestAuth;
		const gatewayRequestOperatorScopes = dispatchContext?.gatewayRequestOperatorScopes;
		for (const route of matchedRoutes) {
			const missingRuntimeContext = getMissingPluginRouteRuntimeContext(route, {
				gatewayRequestAuth,
				gatewayRequestOperatorScopes
			});
			if (missingRuntimeContext) {
				log.warn(`plugin http upgrade blocked without ${missingRuntimeContext} (${pathContext.canonicalPath})`);
				writeUpgradeUnauthorized(socket);
				return true;
			}
		}
		for (const route of matchedRoutes) try {
			if (await require_route_auth.runWithGatewayUpgradeWorkAdmission(socket, async () => await require_gateway_request_scope.withPluginRuntimeGatewayRequestScope(createPluginRouteRuntimeScope({
				route,
				req,
				gatewayRequestContext,
				gatewayRequestAuth,
				gatewayRequestOperatorScopes,
				gatewayRequestClientIp: dispatchContext?.gatewayRequestClientIp
			}), async () => route.handleUpgrade?.(req, socket, head)) !== false)) return true;
		} catch (err) {
			log.warn(`plugin http upgrade failed (${route.pluginId ?? "unknown"}): ${String(err)}`);
			socket.destroy();
			return true;
		}
		return false;
	};
}
//#endregion
exports.createGatewayPluginRequestHandler = createGatewayPluginRequestHandler;
exports.createGatewayPluginUpgradeHandler = createGatewayPluginUpgradeHandler;
exports.findRegisteredPluginHttpRoute = require_route_match.findRegisteredPluginHttpRoute;
exports.isProtectedPluginRoutePathFromContext = require_route_match.isProtectedPluginRoutePathFromContext;
exports.isRegisteredPluginHttpRoutePath = require_route_match.isRegisteredPluginHttpRoutePath;
exports.resolvePluginRoutePathContext = require_route_match.resolvePluginRoutePathContext;
exports.shouldEnforceGatewayAuthForPluginPath = require_route_auth.shouldEnforceGatewayAuthForPluginPath;
