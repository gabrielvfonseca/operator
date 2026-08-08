const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
require("./http-utils-C_86u7P2.cjs");
//#region src/gateway/http-endpoint-helpers.ts
/** Handles a gateway POST JSON endpoint and returns the parsed body when authorized. */
async function handleGatewayPostJsonEndpoint(req, res, opts) {
	if (new URL(req.url ?? "/", "http://localhost").pathname !== opts.pathname) return false;
	if (req.method !== "POST") {
		require_http_common.sendMethodNotAllowed(res);
		return;
	}
	const requestAuth = await require_http_auth_utils.authorizeGatewayHttpRequestOrReply({
		req,
		res,
		auth: opts.auth,
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: opts.rateLimiter
	});
	if (!requestAuth) return;
	if (opts.requiredOperatorMethod) {
		const requestedScopes = opts.resolveOperatorScopes?.(req, requestAuth) ?? require_http_auth_utils.resolveTrustedHttpOperatorScopes(req, requestAuth);
		const scopeAuth = require_method_scopes.authorizeOperatorScopesForMethod(opts.requiredOperatorMethod, requestedScopes);
		if (!scopeAuth.allowed) {
			require_http_common.sendMissingScopeForbidden(res, scopeAuth.missingScope);
			return;
		}
	}
	const body = await require_http_common.readJsonBodyOrError(req, res, opts.maxBodyBytes);
	if (body === void 0) return;
	return {
		body,
		requestAuth
	};
}
//#endregion
Object.defineProperty(exports, "handleGatewayPostJsonEndpoint", {
	enumerable: true,
	get: function() {
		return handleGatewayPostJsonEndpoint;
	}
});
