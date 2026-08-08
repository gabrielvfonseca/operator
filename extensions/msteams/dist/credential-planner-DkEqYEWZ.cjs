const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_env_substitution = require("./env-substitution-CP7V8_Ov.cjs");
//#region src/gateway/credential-planner.ts
/** Normalize optional Gateway credential strings to nonempty values. */
const trimToUndefined = require_string_coerce.normalizeOptionalString;
/**
* Like trimToUndefined but also rejects unresolved env var placeholders (e.g. `${VAR}`).
* This prevents literal placeholder strings like `${OPERATOR_GATEWAY_TOKEN}` from being
* accepted as valid credentials when the referenced env var is missing.
* Note: legitimate credential values containing literal `${UPPER_CASE}` patterns will
* also be rejected, but this is an extremely unlikely edge case.
*/
function trimCredentialToUndefined(value) {
	const trimmed = trimToUndefined(value);
	if (trimmed && require_env_substitution.containsEnvVarReference(trimmed)) return;
	return trimmed;
}
/** True when the process env supplies a nonempty Gateway token candidate. */
function hasGatewayTokenEnvCandidate(env = process.env) {
	return Boolean(trimToUndefined(env.OPERATOR_GATEWAY_TOKEN));
}
/** True when the process env supplies a nonempty Gateway password candidate. */
function hasGatewayPasswordEnvCandidate(env = process.env) {
	return Boolean(trimToUndefined(env.OPERATOR_GATEWAY_PASSWORD));
}
/** Classify one configured credential input without resolving secret refs. */
function resolveConfiguredGatewayCredentialInput(params) {
	const ref = require_types_secrets.resolveSecretInputRef({
		value: params.value,
		defaults: params.defaults
	}).ref;
	return {
		path: params.path,
		configured: require_types_secrets.hasConfiguredSecretInput(params.value, params.defaults),
		value: ref ? void 0 : trimToUndefined(params.value),
		refPath: ref ? params.path : void 0,
		hasSecretRef: ref !== null
	};
}
/** Build the shared credential plan for Gateway startup, local auth, and remote client auth. */
function createGatewayCredentialPlan(params) {
	const env = params.env ?? process.env;
	const gateway = params.config.gateway;
	const remote = gateway?.remote;
	const defaults = params.defaults ?? params.config.secrets?.defaults;
	const authMode = gateway?.auth?.mode;
	const envToken = trimToUndefined(env.OPERATOR_GATEWAY_TOKEN);
	const envPassword = trimToUndefined(env.OPERATOR_GATEWAY_PASSWORD);
	const localToken = resolveConfiguredGatewayCredentialInput({
		value: gateway?.auth?.token,
		defaults,
		path: "gateway.auth.token"
	});
	const localPassword = resolveConfiguredGatewayCredentialInput({
		value: gateway?.auth?.password,
		defaults,
		path: "gateway.auth.password"
	});
	const remoteToken = resolveConfiguredGatewayCredentialInput({
		value: remote?.token,
		defaults,
		path: "gateway.remote.token"
	});
	const remotePassword = resolveConfiguredGatewayCredentialInput({
		value: remote?.password,
		defaults,
		path: "gateway.remote.password"
	});
	const localTokenCanWin = authMode !== "password" && authMode !== "none" && authMode !== "trusted-proxy";
	const tokenCanWin = Boolean(envToken || localToken.configured || remoteToken.configured);
	const passwordCanWin = authMode === "password" || authMode === "trusted-proxy" || authMode !== "token" && authMode !== "none" && !tokenCanWin;
	const localTokenSurfaceActive = localTokenCanWin && !envToken && (authMode === "token" || authMode === void 0 && !(envPassword || localPassword.configured));
	const remoteMode = gateway?.mode === "remote";
	const remoteUrlConfigured = Boolean(trimToUndefined(remote?.url));
	const tailscaleRemoteExposure = gateway?.tailscale?.mode === "serve" || gateway?.tailscale?.mode === "funnel";
	const remoteConfiguredSurface = remoteMode || remoteUrlConfigured || tailscaleRemoteExposure;
	const remoteTokenFallbackActive = localTokenCanWin && !envToken && !localToken.configured;
	const remotePasswordFallbackActive = authMode !== "trusted-proxy" && !envPassword && !localPassword.configured && passwordCanWin;
	return {
		configuredMode: gateway?.mode === "remote" ? "remote" : "local",
		authMode,
		envToken,
		envPassword,
		localToken,
		localPassword,
		remoteToken,
		remotePassword,
		localTokenCanWin,
		localPasswordCanWin: passwordCanWin,
		localTokenSurfaceActive,
		tokenCanWin,
		passwordCanWin,
		remoteMode,
		remoteUrlConfigured,
		tailscaleRemoteExposure,
		remoteConfiguredSurface,
		remoteTokenFallbackActive,
		remoteTokenActive: remoteConfiguredSurface || remoteTokenFallbackActive,
		remotePasswordFallbackActive,
		remotePasswordActive: remoteConfiguredSurface || remotePasswordFallbackActive
	};
}
//#endregion
Object.defineProperty(exports, "createGatewayCredentialPlan", {
	enumerable: true,
	get: function() {
		return createGatewayCredentialPlan;
	}
});
Object.defineProperty(exports, "hasGatewayPasswordEnvCandidate", {
	enumerable: true,
	get: function() {
		return hasGatewayPasswordEnvCandidate;
	}
});
Object.defineProperty(exports, "hasGatewayTokenEnvCandidate", {
	enumerable: true,
	get: function() {
		return hasGatewayTokenEnvCandidate;
	}
});
Object.defineProperty(exports, "trimCredentialToUndefined", {
	enumerable: true,
	get: function() {
		return trimCredentialToUndefined;
	}
});
Object.defineProperty(exports, "trimToUndefined", {
	enumerable: true,
	get: function() {
		return trimToUndefined;
	}
});
