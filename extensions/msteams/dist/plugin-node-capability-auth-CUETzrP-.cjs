require("./rolldown-runtime-u92d-OFm.cjs");
const require_auth = require("./auth-DnGY7_cY.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
const require_plugin_node_capability = require("./plugin-node-capability-BqUNVkTg.cjs");
//#region src/gateway/server/plugin-node-capability-auth.ts
/**
* Authorizes plugin HTTP routes that can be reached by node-issued capabilities.
*/
async function authorizePluginNodeCapabilityRequest(params) {
	const { req, auth, trustedProxies, allowRealIpFallback, clients, nodeCapability, capability, malformedScopedPath, rateLimiter } = params;
	if (malformedScopedPath) return {
		ok: false,
		reason: "unauthorized"
	};
	let lastAuthFailure = null;
	const token = require_http_auth_utils.getBearerToken(req);
	if (token) {
		const authResult = await require_auth.authorizeHttpGatewayConnect({
			auth: {
				...auth,
				allowTailscale: false
			},
			connectAuth: {
				token,
				password: token
			},
			req,
			trustedProxies,
			allowRealIpFallback,
			rateLimiter,
			browserOriginPolicy: require_http_auth_utils.resolveHttpBrowserOriginPolicy(req)
		});
		if (authResult.ok) return authResult;
		lastAuthFailure = authResult;
	}
	if (capability && require_plugin_node_capability.hasAuthorizedPluginNodeCapability({
		clients,
		surface: nodeCapability,
		capability
	})) return { ok: true };
	return lastAuthFailure ?? {
		ok: false,
		reason: "unauthorized"
	};
}
//#endregion
exports.authorizePluginNodeCapabilityRequest = authorizePluginNodeCapabilityRequest;
