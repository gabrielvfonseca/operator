require("./rolldown-runtime-u92d-OFm.cjs");
const require_auth_resolve = require("./auth-resolve-DoTr3pVp.cjs");
require("./auth-DnGY7_cY.cjs");
const require_random_token = require("./random-token-BjnIqlbc.cjs");
const require_auth_config_utils = require("./auth-config-utils-CaQ3nKUU.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor/shared/hooks-token-reuse-repair.ts
function activeGatewaySharedSecret(auth) {
	if (auth.mode === "token") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(auth.token) ?? "";
	if (auth.mode === "password" || auth.mode === "trusted-proxy") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(auth.password) ?? "";
	return "";
}
/** Rotate hooks.token when it matches the active Gateway token/password shared secret. */
function repairHooksTokenReuseGatewayAuth(cfg, env = process.env, createToken = require_random_token.randomToken) {
	return repairHooksTokenReuseGatewayAuthAfterMaterializingRefs(cfg, env, createToken);
}
async function materializeDoctorGatewayAuthRefs(cfg, env) {
	const materializeParams = {
		cfg,
		env,
		mode: cfg.gateway?.auth?.mode,
		hasTokenCandidate: Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_GATEWAY_TOKEN)),
		hasPasswordCandidate: Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_GATEWAY_PASSWORD))
	};
	if (!require_auth_config_utils.canMaterializeGatewayAuthSecretRefsWithoutExec(materializeParams)) return cfg;
	try {
		return await require_auth_config_utils.materializeGatewayAuthSecretRefs(materializeParams);
	} catch {
		return cfg;
	}
}
async function repairHooksTokenReuseGatewayAuthAfterMaterializingRefs(cfg, env, createToken) {
	const hooksToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cfg.hooks?.token) ?? "";
	if (cfg.hooks?.enabled !== true || !hooksToken) return {
		config: cfg,
		changes: []
	};
	const materializedCfg = await materializeDoctorGatewayAuthRefs(cfg, env);
	if (hooksToken !== activeGatewaySharedSecret(require_auth_resolve.resolveGatewayAuth({
		authConfig: materializedCfg.gateway?.auth,
		tailscaleMode: materializedCfg.gateway?.tailscale?.mode ?? "off",
		env
	}))) return {
		config: cfg,
		changes: []
	};
	const nextHooksToken = createToken();
	return {
		config: {
			...cfg,
			hooks: {
				...cfg.hooks,
				token: nextHooksToken
			}
		},
		changes: ["Rotated hooks.token because it reused active Gateway shared-secret auth. Update external hook senders to use the new hooks.token."]
	};
}
//#endregion
exports.repairHooksTokenReuseGatewayAuth = repairHooksTokenReuseGatewayAuth;
