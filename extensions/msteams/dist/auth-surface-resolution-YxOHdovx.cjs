const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_resolve_configured_secret_input_string = require("./resolve-configured-secret-input-string-BR1lk9x1.cjs");
const require_credential_planner = require("./credential-planner-DkEqYEWZ.cjs");
require("./credentials-CNHX5M4G.cjs");
//#region src/gateway/auth-surface-resolution.ts
async function resolveGatewayCredential(params) {
	const resolved = await require_resolve_configured_secret_input_string.resolveConfiguredSecretInputString({
		config: params.config,
		env: params.env,
		value: params.value,
		path: params.path,
		unresolvedReasonStyle: "detailed"
	});
	if (resolved.unresolvedRefReason) params.diagnostics.push(resolved.unresolvedRefReason);
	return resolved;
}
/** Resolves credentials for client paths that must either authenticate or explain the failure. */
async function resolveGatewayInteractiveSurfaceAuth(params) {
	const env = params.env ?? process.env;
	const diagnostics = [];
	const explicitToken = require_credential_planner.trimToUndefined(params.explicitAuth?.token);
	const explicitPassword = require_credential_planner.trimToUndefined(params.explicitAuth?.password);
	const envToken = params.suppressEnvAuthFallback ? void 0 : require_credential_planner.trimToUndefined(env.OPERATOR_GATEWAY_TOKEN);
	const envPassword = params.suppressEnvAuthFallback ? void 0 : require_credential_planner.trimToUndefined(env.OPERATOR_GATEWAY_PASSWORD);
	if (params.surface === "remote") {
		const remoteToken = explicitToken ? { value: explicitToken } : await resolveGatewayCredential({
			config: params.config,
			env,
			diagnostics,
			path: "gateway.remote.token",
			value: params.config.gateway?.remote?.token
		});
		const remotePassword = explicitPassword || envPassword ? { value: explicitPassword ?? envPassword } : await resolveGatewayCredential({
			config: params.config,
			env,
			diagnostics,
			path: "gateway.remote.password",
			value: params.config.gateway?.remote?.password
		});
		const token = explicitToken ?? remoteToken.value ?? envToken;
		const password = explicitPassword ?? envPassword ?? remotePassword.value;
		return token || password ? {
			token,
			password
		} : { failureReason: remoteToken.unresolvedRefReason ?? remotePassword.unresolvedRefReason ?? "Missing gateway auth credentials." };
	}
	const authMode = params.config.gateway?.auth?.mode;
	if (authMode === "none" || authMode === "trusted-proxy") return {
		token: explicitToken ?? envToken,
		password: explicitPassword ?? envPassword
	};
	const hasConfiguredToken = require_types_secrets.hasConfiguredSecretInput(params.config.gateway?.auth?.token, params.config.secrets?.defaults);
	const hasConfiguredPassword = require_types_secrets.hasConfiguredSecretInput(params.config.gateway?.auth?.password, params.config.secrets?.defaults);
	const resolveToken = async () => {
		const localToken = explicitToken ? { value: explicitToken } : await resolveGatewayCredential({
			config: params.config,
			env,
			diagnostics,
			path: "gateway.auth.token",
			value: params.config.gateway?.auth?.token
		});
		const token = explicitToken ?? localToken.value ?? envToken;
		return {
			token,
			failureReason: token ? void 0 : localToken.unresolvedRefReason ?? "Missing gateway auth token."
		};
	};
	const resolvePassword = async () => {
		const localPassword = explicitPassword || envPassword ? { value: explicitPassword ?? envPassword } : await resolveGatewayCredential({
			config: params.config,
			env,
			diagnostics,
			path: "gateway.auth.password",
			value: params.config.gateway?.auth?.password
		});
		const password = explicitPassword ?? envPassword ?? localPassword.value;
		return {
			password,
			failureReason: password ? void 0 : localPassword.unresolvedRefReason ?? "Missing gateway auth password."
		};
	};
	if (authMode === "password") {
		const password = await resolvePassword();
		return {
			token: explicitToken ?? envToken,
			password: password.password,
			failureReason: password.failureReason
		};
	}
	if (authMode === "token") {
		const token = await resolveToken();
		return {
			token: token.token,
			password: explicitPassword ?? envPassword,
			failureReason: token.failureReason
		};
	}
	if (Boolean(explicitPassword ?? envPassword) || hasConfiguredPassword && !hasConfiguredToken) {
		const password = await resolvePassword();
		return {
			token: explicitToken ?? envToken,
			password: password.password,
			failureReason: password.failureReason
		};
	}
	const token = await resolveToken();
	return {
		token: token.token,
		password: explicitPassword ?? envPassword,
		failureReason: token.failureReason
	};
}
//#endregion
Object.defineProperty(exports, "resolveGatewayInteractiveSurfaceAuth", {
	enumerable: true,
	get: function() {
		return resolveGatewayInteractiveSurfaceAuth;
	}
});
