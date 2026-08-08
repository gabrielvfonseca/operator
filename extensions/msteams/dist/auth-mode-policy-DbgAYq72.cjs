const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
//#region src/gateway/auth-mode-policy.ts
var auth_mode_policy_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	assertExplicitGatewayAuthModeWhenBothConfigured: () => assertExplicitGatewayAuthModeWhenBothConfigured,
	hasAmbiguousGatewayAuthModeConfig: () => hasAmbiguousGatewayAuthModeConfig
});
const EXPLICIT_GATEWAY_AUTH_MODE_REQUIRED_ERROR = "Invalid config: gateway.auth.token and gateway.auth.password are both configured, but gateway.auth.mode is unset. Set gateway.auth.mode to token or password.";
/** Returns true when local gateway auth config needs an explicit token/password mode. */
function hasAmbiguousGatewayAuthModeConfig(cfg) {
	const auth = cfg.gateway?.auth;
	if (!auth) return false;
	if (typeof auth.mode === "string" && auth.mode.trim().length > 0) return false;
	const defaults = cfg.secrets?.defaults;
	const tokenConfigured = require_types_secrets.hasConfiguredSecretInput(auth.token, defaults);
	const passwordConfigured = require_types_secrets.hasConfiguredSecretInput(auth.password, defaults);
	return tokenConfigured && passwordConfigured;
}
/** Throws the public config error used by setup, doctor, and gateway startup validation. */
function assertExplicitGatewayAuthModeWhenBothConfigured(cfg) {
	if (!hasAmbiguousGatewayAuthModeConfig(cfg)) return;
	throw new Error(EXPLICIT_GATEWAY_AUTH_MODE_REQUIRED_ERROR);
}
//#endregion
Object.defineProperty(exports, "assertExplicitGatewayAuthModeWhenBothConfigured", {
	enumerable: true,
	get: function() {
		return assertExplicitGatewayAuthModeWhenBothConfigured;
	}
});
Object.defineProperty(exports, "auth_mode_policy_exports", {
	enumerable: true,
	get: function() {
		return auth_mode_policy_exports;
	}
});
Object.defineProperty(exports, "hasAmbiguousGatewayAuthModeConfig", {
	enumerable: true,
	get: function() {
		return hasAmbiguousGatewayAuthModeConfig;
	}
});
