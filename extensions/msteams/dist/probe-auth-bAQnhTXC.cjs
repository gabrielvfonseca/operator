const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_credentials = require("./credentials-CNHX5M4G.cjs");
const require_credentials_secret_inputs = require("./credentials-secret-inputs-WHVXyyR_.cjs");
const require_probe_target = require("./probe-target-COL7xGKv.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/probe-auth.ts
var probe_auth_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveGatewayProbeAuth: () => resolveGatewayProbeAuth,
	resolveGatewayProbeAuthSafe: () => resolveGatewayProbeAuthSafe,
	resolveGatewayProbeAuthSafeWithSecretInputs: () => resolveGatewayProbeAuthSafeWithSecretInputs,
	resolveGatewayProbeAuthWithSecretInputs: () => resolveGatewayProbeAuthWithSecretInputs,
	resolveGatewayProbeCredentialConfig: () => resolveGatewayProbeCredentialConfig,
	resolveGatewayProbeTarget: () => require_probe_target.resolveGatewayProbeTarget
});
function buildGatewayProbeCredentialPolicy(params) {
	const cfg = resolveGatewayProbeCredentialConfig(params);
	return {
		config: cfg,
		cfg,
		env: params.env,
		explicitAuth: params.explicitAuth,
		modeOverride: params.mode,
		mode: params.mode,
		remoteTokenFallback: "remote-only"
	};
}
function resolveGatewayProbeCredentialConfig(params) {
	if (params.mode !== "local") return params.cfg;
	const remote = params.cfg.gateway?.remote;
	if (!remote || remote.token === void 0 && remote.password === void 0) return params.cfg;
	const remoteWithoutAuth = { ...remote };
	delete remoteWithoutAuth.token;
	delete remoteWithoutAuth.password;
	return {
		...params.cfg,
		gateway: {
			...params.cfg.gateway,
			remote: remoteWithoutAuth
		}
	};
}
function resolveExplicitProbeAuth(explicitAuth) {
	return {
		token: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(explicitAuth?.token),
		password: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(explicitAuth?.password)
	};
}
function hasExplicitProbeAuth(auth) {
	return Boolean(auth.token || auth.password);
}
function buildUnresolvedProbeAuthWarning(path) {
	return `${path} SecretRef is unresolved in this command path; probing without configured auth credentials.`;
}
function resolveGatewayProbeWarning(error) {
	if (!require_credentials.isGatewaySecretRefUnavailableError(error)) throw error;
	return buildUnresolvedProbeAuthWarning(error.path);
}
/** Resolves synchronous probe auth, throwing when configured secrets cannot be read. */
function resolveGatewayProbeAuth(params) {
	return require_credentials.resolveGatewayProbeCredentialsFromConfig(buildGatewayProbeCredentialPolicy(params));
}
/** Resolves probe auth with async SecretRef support. */
async function resolveGatewayProbeAuthWithSecretInputs(params) {
	const policy = buildGatewayProbeCredentialPolicy(params);
	return await require_credentials_secret_inputs.resolveGatewayCredentialsWithSecretInputs({
		config: policy.config,
		env: policy.env,
		explicitAuth: policy.explicitAuth,
		modeOverride: policy.modeOverride,
		remoteTokenFallback: policy.remoteTokenFallback
	});
}
/** Resolves probe auth without throwing for unavailable SecretRefs, returning a warning. */
async function resolveGatewayProbeAuthSafeWithSecretInputs(params) {
	const explicitAuth = resolveExplicitProbeAuth(params.explicitAuth);
	if (hasExplicitProbeAuth(explicitAuth)) return { auth: explicitAuth };
	try {
		return { auth: await resolveGatewayProbeAuthWithSecretInputs(params) };
	} catch (error) {
		return {
			auth: {},
			warning: resolveGatewayProbeWarning(error)
		};
	}
}
/** Synchronous safe probe auth wrapper for config-only credential paths. */
function resolveGatewayProbeAuthSafe(params) {
	const explicitAuth = resolveExplicitProbeAuth(params.explicitAuth);
	if (hasExplicitProbeAuth(explicitAuth)) return { auth: explicitAuth };
	try {
		return { auth: resolveGatewayProbeAuth(params) };
	} catch (error) {
		return {
			auth: {},
			warning: resolveGatewayProbeWarning(error)
		};
	}
}
//#endregion
Object.defineProperty(exports, "probe_auth_exports", {
	enumerable: true,
	get: function() {
		return probe_auth_exports;
	}
});
Object.defineProperty(exports, "resolveGatewayProbeAuthSafeWithSecretInputs", {
	enumerable: true,
	get: function() {
		return resolveGatewayProbeAuthSafeWithSecretInputs;
	}
});
Object.defineProperty(exports, "resolveGatewayProbeCredentialConfig", {
	enumerable: true,
	get: function() {
		return resolveGatewayProbeCredentialConfig;
	}
});
