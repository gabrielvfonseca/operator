const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_route_match = require("./route-match-BIgMHY40.cjs");
//#region src/gateway/server/http-work-admission.ts
async function runWithGatewayBoundaryWorkAdmission(reject, run) {
	const admission = require_gateway_work_admission.tryBeginGatewayRootWorkAdmission();
	if (!admission) {
		reject();
		return true;
	}
	try {
		return await admission.run(async () => await run());
	} finally {
		admission.release();
	}
}
/** Runs one HTTP user-work route under the same root fence as Gateway RPCs. */
async function runWithGatewayHttpWorkAdmission(res, run) {
	return await runWithGatewayBoundaryWorkAdmission(() => {
		res.statusCode = 503;
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.setHeader("Cache-Control", "no-store");
		res.setHeader("Retry-After", "1");
		res.end(JSON.stringify({ error: {
			message: "Gateway is temporarily unavailable while suspending or restarting",
			type: "service_unavailable",
			code: "gateway_unavailable"
		} }));
	}, run);
}
function writeGatewayUpgradeServiceUnavailable(socket, body) {
	socket.write(`HTTP/1.1 503 Service Unavailable\r
Connection: close\r
Content-Type: text/plain; charset=utf-8\r
Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r
` + body);
}
/** Holds upgrade admission until one plugin handler owns or declines the socket. */
async function runWithGatewayUpgradeWorkAdmission(socket, run) {
	return await runWithGatewayBoundaryWorkAdmission(() => {
		writeGatewayUpgradeServiceUnavailable(socket, "Gateway websocket admission closed");
		socket.destroy();
	}, run);
}
//#endregion
//#region src/gateway/server/plugins-http/route-auth.ts
/**
* Gateway-auth decisions for plugin HTTP routes.
*/
function matchedPluginRoutesRequireGatewayAuth(routes) {
	return routes.some((route) => route.auth === "gateway");
}
/** Returns true when a plugin path must pass gateway auth before routing. */
function shouldEnforceGatewayAuthForPluginPath(registry, pathnameOrContext) {
	const pathContext = typeof pathnameOrContext === "string" ? require_route_match.resolvePluginRoutePathContext(pathnameOrContext) : pathnameOrContext;
	if (pathContext.malformedEncoding || pathContext.decodePassLimitReached) return true;
	if (require_route_match.isProtectedPluginRoutePathFromContext(pathContext)) return true;
	return matchedPluginRoutesRequireGatewayAuth(require_route_match.findMatchingPluginHttpRoutes(registry, pathContext));
}
//#endregion
Object.defineProperty(exports, "matchedPluginRoutesRequireGatewayAuth", {
	enumerable: true,
	get: function() {
		return matchedPluginRoutesRequireGatewayAuth;
	}
});
Object.defineProperty(exports, "runWithGatewayHttpWorkAdmission", {
	enumerable: true,
	get: function() {
		return runWithGatewayHttpWorkAdmission;
	}
});
Object.defineProperty(exports, "runWithGatewayUpgradeWorkAdmission", {
	enumerable: true,
	get: function() {
		return runWithGatewayUpgradeWorkAdmission;
	}
});
Object.defineProperty(exports, "shouldEnforceGatewayAuthForPluginPath", {
	enumerable: true,
	get: function() {
		return shouldEnforceGatewayAuthForPluginPath;
	}
});
Object.defineProperty(exports, "writeGatewayUpgradeServiceUnavailable", {
	enumerable: true,
	get: function() {
		return writeGatewayUpgradeServiceUnavailable;
	}
});
