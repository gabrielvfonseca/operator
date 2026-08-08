const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_resolve_configured_secret_input_string = require("./resolve-configured-secret-input-string-BR1lk9x1.cjs");
const require_credential_planner = require("./credential-planner-DkEqYEWZ.cjs");
require("./credentials-CNHX5M4G.cjs");
//#region src/gateway/auth-token-resolution.ts
var auth_token_resolution_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolveGatewayAuthToken: () => resolveGatewayAuthToken });
/** Resolves gateway.auth.token with configurable env fallback and SecretRef diagnostics. */
async function resolveGatewayAuthToken(params) {
	const explicitToken = require_credential_planner.trimToUndefined(params.explicitToken);
	if (explicitToken) return {
		token: explicitToken,
		source: "explicit",
		secretRefConfigured: false
	};
	const tokenInput = params.cfg.gateway?.auth?.token;
	const tokenRef = require_types_secrets.resolveSecretInputRef({
		value: tokenInput,
		defaults: params.cfg.secrets?.defaults
	}).ref;
	const envFallback = params.envFallback ?? "always";
	const envToken = require_credential_planner.trimToUndefined(params.env.OPERATOR_GATEWAY_TOKEN);
	if (!tokenRef) {
		const configToken = require_credential_planner.trimToUndefined(tokenInput);
		if (configToken) return {
			token: configToken,
			source: "config",
			secretRefConfigured: false
		};
		if (envFallback !== "never" && envToken) return {
			token: envToken,
			source: "env",
			secretRefConfigured: false
		};
		return { secretRefConfigured: false };
	}
	const resolved = await require_resolve_configured_secret_input_string.resolveConfiguredSecretInputString({
		config: params.cfg,
		env: params.env,
		value: tokenInput,
		path: "gateway.auth.token",
		unresolvedReasonStyle: params.unresolvedReasonStyle
	});
	if (resolved.value) return {
		token: resolved.value,
		source: "secretRef",
		secretRefConfigured: true
	};
	if (envFallback === "always" && envToken) return {
		token: envToken,
		source: "env",
		secretRefConfigured: true
	};
	return {
		secretRefConfigured: true,
		unresolvedRefReason: resolved.unresolvedRefReason
	};
}
//#endregion
Object.defineProperty(exports, "auth_token_resolution_exports", {
	enumerable: true,
	get: function() {
		return auth_token_resolution_exports;
	}
});
Object.defineProperty(exports, "resolveGatewayAuthToken", {
	enumerable: true,
	get: function() {
		return resolveGatewayAuthToken;
	}
});
