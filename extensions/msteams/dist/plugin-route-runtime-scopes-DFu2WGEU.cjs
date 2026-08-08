require("./rolldown-runtime-u92d-OFm.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
//#region src/gateway/server/plugin-route-runtime-scopes.ts
/** Resolves the scopes a plugin route receives after gateway HTTP authentication. */
function resolvePluginRouteRuntimeOperatorScopes(req, requestAuth, surface = "write-default") {
	if (surface === "trusted-operator") {
		if (!requestAuth.trustDeclaredOperatorScopes) return [...require_method_scopes.CLI_DEFAULT_OPERATOR_SCOPES];
		return require_http_auth_utils.resolveTrustedHttpOperatorScopes(req, requestAuth);
	}
	if (requestAuth.authMethod !== "trusted-proxy") return [require_operator_scopes.WRITE_SCOPE];
	if (require_http_auth_utils.getHeader(req, "x-operator-scopes") === void 0) return [require_operator_scopes.WRITE_SCOPE];
	return require_http_auth_utils.resolveTrustedHttpOperatorScopes(req, requestAuth);
}
//#endregion
exports.resolvePluginRouteRuntimeOperatorScopes = resolvePluginRouteRuntimeOperatorScopes;
