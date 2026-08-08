const require_credential_planner = require("./credential-planner-DkEqYEWZ.cjs");
//#region src/gateway/credentials.ts
const GATEWAY_SECRET_REF_UNAVAILABLE_ERROR_CODE = "GATEWAY_SECRET_REF_UNAVAILABLE";
/** Raised when a command path needs Gateway credentials before secret refs were resolved. */
var GatewaySecretRefUnavailableError = class extends Error {
	constructor(path) {
		super([
			`${path} is configured as a secret reference but is unavailable in this command path.`,
			"Fix: set OPERATOR_GATEWAY_TOKEN/OPERATOR_GATEWAY_PASSWORD, pass explicit --token/--password,",
			"or run a gateway command path that resolves secret references before credential selection."
		].join("\n"));
		this.code = GATEWAY_SECRET_REF_UNAVAILABLE_ERROR_CODE;
		this.name = "GatewaySecretRefUnavailableError";
		this.path = path;
	}
};
/** Type guard for unresolved Gateway secret-ref errors, optionally scoped to a config path. */
function isGatewaySecretRefUnavailableError(error, expectedPath) {
	if (!(error instanceof GatewaySecretRefUnavailableError)) return false;
	if (!expectedPath) return true;
	return error.path === expectedPath;
}
function firstDefined(values) {
	for (const value of values) if (value) return value;
}
function throwUnresolvedGatewaySecretInput(path) {
	throw new GatewaySecretRefUnavailableError(path);
}
/** Resolve direct token/password values with caller-selected env-vs-config precedence. */
function resolveGatewayCredentialsFromValues(params) {
	const env = params.env ?? process.env;
	const envToken = require_credential_planner.trimToUndefined(env.OPERATOR_GATEWAY_TOKEN);
	const envPassword = require_credential_planner.trimToUndefined(env.OPERATOR_GATEWAY_PASSWORD);
	const configToken = require_credential_planner.trimCredentialToUndefined(params.configToken);
	const configPassword = require_credential_planner.trimCredentialToUndefined(params.configPassword);
	const tokenPrecedence = params.tokenPrecedence ?? "env-first";
	const passwordPrecedence = params.passwordPrecedence ?? "env-first";
	return {
		token: tokenPrecedence === "config-first" ? firstDefined([configToken, envToken]) : firstDefined([envToken, configToken]),
		password: passwordPrecedence === "config-first" ? firstDefined([configPassword, envPassword]) : firstDefined([envPassword, configPassword])
	};
}
function resolveLocalGatewayCredentials(params) {
	const localResolved = resolveGatewayCredentialsFromValues({
		configToken: params.plan.localToken.configured ? params.plan.localToken.value : params.plan.remoteToken.value,
		configPassword: params.plan.localPassword.configured ? params.plan.localPassword.value : params.plan.authMode === "trusted-proxy" ? void 0 : params.plan.remotePassword.value,
		env: params.env,
		tokenPrecedence: params.localTokenPrecedence,
		passwordPrecedence: params.localPasswordPrecedence
	});
	const localPasswordCanWin = params.plan.authMode === "password" || params.plan.authMode === "trusted-proxy" || params.plan.authMode !== "token" && params.plan.authMode !== "none" && !localResolved.token;
	const localTokenCanWin = params.plan.authMode === "token" || params.plan.authMode !== "password" && params.plan.authMode !== "none" && params.plan.authMode !== "trusted-proxy" && !localResolved.password;
	if (params.plan.localToken.refPath && params.localTokenPrecedence === "config-first" && !params.plan.localToken.value && params.plan.envToken && localTokenCanWin) throwUnresolvedGatewaySecretInput(params.plan.localToken.refPath);
	if (params.plan.localPassword.refPath && params.localPasswordPrecedence === "config-first" && !params.plan.localPassword.value && params.plan.envPassword && localPasswordCanWin) throwUnresolvedGatewaySecretInput(params.plan.localPassword.refPath);
	if (params.plan.localToken.refPath && !localResolved.token && !params.plan.envToken && localTokenCanWin) throwUnresolvedGatewaySecretInput(params.plan.localToken.refPath);
	if (params.plan.localPassword.refPath && !localResolved.password && !params.plan.envPassword && localPasswordCanWin) throwUnresolvedGatewaySecretInput(params.plan.localPassword.refPath);
	return localResolved;
}
function resolveRemoteGatewayCredentials(params) {
	const token = params.remoteTokenFallback === "remote-only" ? params.plan.remoteToken.value : params.remoteTokenPrecedence === "env-first" ? firstDefined([
		params.plan.envToken,
		params.plan.remoteToken.value,
		params.plan.localToken.value
	]) : firstDefined([
		params.plan.remoteToken.value,
		params.plan.envToken,
		params.plan.localToken.value
	]);
	const password = params.remotePasswordFallback === "remote-only" ? params.plan.remotePassword.value : params.remotePasswordPrecedence === "env-first" ? firstDefined([
		params.plan.envPassword,
		params.plan.remotePassword.value,
		params.plan.localPassword.value
	]) : firstDefined([
		params.plan.remotePassword.value,
		params.plan.envPassword,
		params.plan.localPassword.value
	]);
	const localTokenFallbackEnabled = params.remoteTokenFallback !== "remote-only";
	const localTokenFallback = params.remoteTokenFallback === "remote-only" ? void 0 : params.plan.localToken.value;
	const localPasswordFallback = params.remotePasswordFallback === "remote-only" ? void 0 : params.plan.localPassword.value;
	if (params.plan.remoteToken.refPath && !token && !params.plan.envToken && !localTokenFallback && !password) throwUnresolvedGatewaySecretInput(params.plan.remoteToken.refPath);
	if (params.plan.remotePassword.refPath && !password && !params.plan.envPassword && !localPasswordFallback && !token) throwUnresolvedGatewaySecretInput(params.plan.remotePassword.refPath);
	if (params.plan.localToken.refPath && localTokenFallbackEnabled && !token && !password && !params.plan.envToken && !params.plan.remoteToken.value && params.plan.localTokenCanWin) throwUnresolvedGatewaySecretInput(params.plan.localToken.refPath);
	return {
		token,
		password
	};
}
/** Resolve Gateway credentials from config, explicit auth, URL overrides, and mode policy. */
function resolveGatewayCredentialsFromConfig(params) {
	const env = params.env ?? process.env;
	const explicitToken = require_credential_planner.trimToUndefined(params.explicitAuth?.token);
	const explicitPassword = require_credential_planner.trimToUndefined(params.explicitAuth?.password);
	if (explicitToken || explicitPassword) return {
		token: explicitToken,
		password: explicitPassword
	};
	if (require_credential_planner.trimToUndefined(params.urlOverride) && params.urlOverrideSource !== "env") return {};
	if (require_credential_planner.trimToUndefined(params.urlOverride) && params.urlOverrideSource === "env") return resolveGatewayCredentialsFromValues({
		configToken: void 0,
		configPassword: void 0,
		env,
		tokenPrecedence: "env-first",
		passwordPrecedence: "env-first"
	});
	const plan = require_credential_planner.createGatewayCredentialPlan({
		config: params.cfg,
		env
	});
	const mode = params.modeOverride ?? plan.configuredMode;
	const localTokenPrecedence = params.localTokenPrecedence ?? (env.OPERATOR_SERVICE_KIND === "gateway" ? "config-first" : "env-first");
	const localPasswordPrecedence = params.localPasswordPrecedence ?? "env-first";
	if (mode === "local") return resolveLocalGatewayCredentials({
		plan,
		env,
		localTokenPrecedence,
		localPasswordPrecedence
	});
	const remoteTokenFallback = params.remoteTokenFallback ?? "remote-env-local";
	const remotePasswordFallback = params.remotePasswordFallback ?? "remote-env-local";
	return resolveRemoteGatewayCredentials({
		plan,
		remoteTokenPrecedence: params.remoteTokenPrecedence ?? "remote-first",
		remotePasswordPrecedence: params.remotePasswordPrecedence ?? "env-first",
		remoteTokenFallback,
		remotePasswordFallback
	});
}
/** Resolve the stricter credential view used by Gateway probe paths. */
function resolveGatewayProbeCredentialsFromConfig(params) {
	return resolveGatewayCredentialsFromConfig({
		cfg: params.cfg,
		env: params.env,
		explicitAuth: params.explicitAuth,
		modeOverride: params.mode,
		remoteTokenFallback: "remote-only"
	});
}
//#endregion
Object.defineProperty(exports, "GatewaySecretRefUnavailableError", {
	enumerable: true,
	get: function() {
		return GatewaySecretRefUnavailableError;
	}
});
Object.defineProperty(exports, "isGatewaySecretRefUnavailableError", {
	enumerable: true,
	get: function() {
		return isGatewaySecretRefUnavailableError;
	}
});
Object.defineProperty(exports, "resolveGatewayCredentialsFromConfig", {
	enumerable: true,
	get: function() {
		return resolveGatewayCredentialsFromConfig;
	}
});
Object.defineProperty(exports, "resolveGatewayCredentialsFromValues", {
	enumerable: true,
	get: function() {
		return resolveGatewayCredentialsFromValues;
	}
});
Object.defineProperty(exports, "resolveGatewayProbeCredentialsFromConfig", {
	enumerable: true,
	get: function() {
		return resolveGatewayProbeCredentialsFromConfig;
	}
});
