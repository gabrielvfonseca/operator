const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_credential_planner = require("./credential-planner-DkEqYEWZ.cjs");
require("./credentials-CNHX5M4G.cjs");
const require_auth_resolve = require("./auth-resolve-DoTr3pVp.cjs");
require("./auth-DnGY7_cY.cjs");
const require_auth_mode_policy = require("./auth-mode-policy-DbgAYq72.cjs");
const require_auth_config_utils = require("./auth-config-utils-CaQ3nKUU.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/gateway/known-weak-gateway-secrets.ts
const KNOWN_WEAK_GATEWAY_TOKEN_PLACEHOLDERS = ["change-me-to-a-long-random-token", "change-me-now"];
const KNOWN_WEAK_GATEWAY_PASSWORD_PLACEHOLDERS = ["change-me-to-a-strong-password"];
/**
* Placeholder credentials that have ever shipped in `.env.example` or been
* used as copy-paste examples in onboarding docs. If any of these ever
* becomes the resolved gateway credential, reject it. The operator almost
* certainly copied an example file verbatim without replacing the sentinel,
* which would otherwise leave the gateway protected by a publicly-known
* credential.
*/
const KNOWN_WEAK_GATEWAY_TOKENS = new Set(KNOWN_WEAK_GATEWAY_TOKEN_PLACEHOLDERS);
const KNOWN_WEAK_GATEWAY_PASSWORDS = new Set(KNOWN_WEAK_GATEWAY_PASSWORD_PLACEHOLDERS);
function assertGatewayAuthNotKnownWeak(auth) {
	if (auth.mode === "token") {
		const token = auth.token?.trim() ?? "";
		if (token && KNOWN_WEAK_GATEWAY_TOKENS.has(token)) throw new Error("Invalid config: gateway auth token is set to a published example placeholder from docs or .env.example. Generate a real secret (e.g. `openssl rand -hex 32`) and set OPERATOR_GATEWAY_TOKEN or gateway.auth.token before starting the gateway.");
		return;
	}
	if (auth.mode === "password") {
		const password = auth.password?.trim() ?? "";
		if (password && KNOWN_WEAK_GATEWAY_PASSWORDS.has(password)) throw new Error("Invalid config: gateway auth password is set to the example placeholder from .env.example. Choose a real password and set OPERATOR_GATEWAY_PASSWORD or gateway.auth.password before starting the gateway.");
	}
}
//#endregion
//#region src/gateway/startup-auth.ts
const HOOKS_GATEWAY_AUTH_REUSE_WARNING = "Security warning: hooks.token matches active Gateway shared-secret auth. Startup continues for compatibility; rotate hooks.token or Gateway auth. Run openclaw security audit for a full report, and run openclaw doctor --fix when the reused hooks.token is persisted in config.";
/** Merge sparse runtime auth overrides into persisted Gateway auth config. */
function mergeGatewayAuthConfig(base, override) {
	const merged = { ...base };
	if (!override) return merged;
	if (override.mode !== void 0) merged.mode = override.mode;
	if (override.token !== void 0) merged.token = override.token;
	if (override.password !== void 0) merged.password = override.password;
	if (override.allowTailscale !== void 0) merged.allowTailscale = override.allowTailscale;
	if (override.rateLimit !== void 0) merged.rateLimit = override.rateLimit;
	if (override.trustedProxy !== void 0) merged.trustedProxy = override.trustedProxy;
	return merged;
}
/** Merge sparse runtime Tailscale overrides into persisted Gateway Tailscale config. */
function mergeGatewayTailscaleConfig(base, override) {
	const merged = { ...base };
	if (!override) return merged;
	if (override.mode !== void 0) merged.mode = override.mode;
	if (override.resetOnExit !== void 0) merged.resetOnExit = override.resetOnExit;
	if (override.serviceName !== void 0) merged.serviceName = override.serviceName;
	if (override.preserveFunnel !== void 0) merged.preserveFunnel = override.preserveFunnel;
	return merged;
}
function resolveGatewayAuthFromConfig(params) {
	const tailscaleConfig = mergeGatewayTailscaleConfig(params.cfg.gateway?.tailscale, params.tailscaleOverride);
	return require_auth_resolve.resolveGatewayAuth({
		authConfig: params.cfg.gateway?.auth,
		authOverride: params.authOverride,
		env: params.env,
		tailscaleMode: tailscaleConfig.mode ?? "off"
	});
}
function findActiveGatewaySharedSecret(auth) {
	if (auth.mode === "token") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(auth.token) ?? "";
	if (auth.mode === "password" || auth.mode === "trusted-proxy") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(auth.password) ?? "";
	return "";
}
function warnHooksTokenReuseGatewayAuth(params) {
	if (params.cfg.hooks?.enabled !== true || !params.warn) return;
	const hooksToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cfg.hooks.token) ?? "";
	if (!hooksToken || hooksToken !== findActiveGatewaySharedSecret(params.auth)) return;
	params.warn(HOOKS_GATEWAY_AUTH_REUSE_WARNING);
}
/** Check every source that can satisfy token auth before startup generates one. */
function hasGatewayTokenCandidate(params) {
	if (require_credential_planner.trimToUndefined(params.env.OPERATOR_GATEWAY_TOKEN)) return true;
	if (typeof params.authOverride?.token === "string" && params.authOverride.token.trim().length > 0) return true;
	return require_auth_config_utils.hasConfiguredGatewayAuthSecretInput(params.cfg, "gateway.auth.token");
}
function hasGatewayTokenOverrideCandidate(params) {
	return typeof params.authOverride?.token === "string" && params.authOverride.token.trim().length > 0;
}
function hasGatewayPasswordOverrideCandidate(params) {
	if (require_credential_planner.hasGatewayPasswordEnvCandidate(params.env)) return true;
	return typeof params.authOverride?.password === "string" && params.authOverride.password.trim().length > 0;
}
/** Ensure startup has effective Gateway auth, generating only an ephemeral token if needed. */
async function ensureGatewayStartupAuth(params) {
	require_auth_mode_policy.assertExplicitGatewayAuthModeWhenBothConfigured(params.cfg);
	const env = params.env ?? process.env;
	const explicitMode = params.authOverride?.mode ?? params.cfg.gateway?.auth?.mode;
	const [resolvedTokenRefValue, resolvedPasswordRefValue] = await Promise.all([require_auth_config_utils.resolveGatewayTokenSecretRefValue({
		cfg: params.cfg,
		env,
		mode: explicitMode,
		hasTokenCandidate: hasGatewayTokenOverrideCandidate({ authOverride: params.authOverride }) || require_credential_planner.hasGatewayTokenEnvCandidate(env),
		hasPasswordCandidate: hasGatewayPasswordOverrideCandidate({
			env,
			authOverride: params.authOverride
		}) || require_auth_config_utils.hasConfiguredGatewayAuthSecretInput(params.cfg, "gateway.auth.password")
	}), require_auth_config_utils.resolveGatewayPasswordSecretRefValue({
		cfg: params.cfg,
		env,
		mode: explicitMode,
		hasPasswordCandidate: hasGatewayPasswordOverrideCandidate({
			env,
			authOverride: params.authOverride
		}),
		hasTokenCandidate: hasGatewayTokenCandidate({
			cfg: params.cfg,
			env,
			authOverride: params.authOverride
		})
	})]);
	const authOverride = params.authOverride || resolvedTokenRefValue || resolvedPasswordRefValue ? {
		...params.authOverride,
		...resolvedTokenRefValue ? { token: resolvedTokenRefValue } : {},
		...resolvedPasswordRefValue ? { password: resolvedPasswordRefValue } : {}
	} : void 0;
	const resolved = resolveGatewayAuthFromConfig({
		cfg: params.cfg,
		env,
		authOverride,
		tailscaleOverride: params.tailscaleOverride
	});
	if (resolved.mode !== "token" || (resolved.token?.trim().length ?? 0) > 0) {
		assertGatewayAuthNotKnownWeak(resolved);
		warnHooksTokenReuseGatewayAuth({
			cfg: params.cfg,
			auth: resolved,
			warn: params.warn
		});
		return {
			cfg: params.cfg,
			auth: resolved,
			persistedGeneratedToken: false
		};
	}
	const generatedToken = node_crypto.default.randomBytes(24).toString("hex");
	const nextCfg = {
		...params.cfg,
		gateway: {
			...params.cfg.gateway,
			auth: {
				...params.cfg.gateway?.auth,
				mode: "token",
				token: generatedToken
			}
		}
	};
	const nextAuth = resolveGatewayAuthFromConfig({
		cfg: nextCfg,
		env,
		authOverride: params.authOverride,
		tailscaleOverride: params.tailscaleOverride
	});
	assertGatewayAuthNotKnownWeak(nextAuth);
	warnHooksTokenReuseGatewayAuth({
		cfg: nextCfg,
		auth: nextAuth,
		warn: params.warn
	});
	return {
		cfg: nextCfg,
		auth: nextAuth,
		generatedToken,
		persistedGeneratedToken: false
	};
}
//#endregion
Object.defineProperty(exports, "assertGatewayAuthNotKnownWeak", {
	enumerable: true,
	get: function() {
		return assertGatewayAuthNotKnownWeak;
	}
});
Object.defineProperty(exports, "ensureGatewayStartupAuth", {
	enumerable: true,
	get: function() {
		return ensureGatewayStartupAuth;
	}
});
Object.defineProperty(exports, "mergeGatewayAuthConfig", {
	enumerable: true,
	get: function() {
		return mergeGatewayAuthConfig;
	}
});
Object.defineProperty(exports, "mergeGatewayTailscaleConfig", {
	enumerable: true,
	get: function() {
		return mergeGatewayTailscaleConfig;
	}
});
