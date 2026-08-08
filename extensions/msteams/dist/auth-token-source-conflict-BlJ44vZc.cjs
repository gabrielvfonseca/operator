const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/auth-token-source-conflict.ts
const GATEWAY_ENV_TOKEN = "OPERATOR_GATEWAY_TOKEN";
const GATEWAY_SERVICE_KIND = "gateway";
/** Returns a warning when env token precedence can diverge from configured gateway auth. */
function resolveGatewayAuthTokenSourceConflict(params) {
	const envToken = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.env.OPERATOR_GATEWAY_TOKEN);
	if (!envToken) return null;
	if (params.env.OPERATOR_SERVICE_KIND?.trim() === GATEWAY_SERVICE_KIND) return null;
	if (params.cfg.gateway?.mode === "remote") return null;
	const authMode = params.cfg.gateway?.auth?.mode;
	if (authMode === "password" || authMode === "none" || authMode === "trusted-proxy") return null;
	const tokenInput = params.cfg.gateway?.auth?.token;
	const { ref } = require_types_secrets.resolveSecretInputRef({
		value: tokenInput,
		defaults: params.cfg.secrets?.defaults
	});
	if (ref?.source === "env" && ref.id === GATEWAY_ENV_TOKEN) return null;
	const configToken = ref ? void 0 : require_types_secrets.normalizeSecretInputString(tokenInput);
	if (!ref && !configToken) return null;
	if (configToken === envToken) return null;
	const title = `${GATEWAY_ENV_TOKEN} conflicts with gateway.auth.token`;
	const detail = `${GATEWAY_ENV_TOKEN} is set while gateway.auth.token uses a different configured source. Direct local Gateway clients commonly prefer the env token, while the managed gateway service prefers gateway.auth.token. If the values differ, CLI/RPC calls can fail to authenticate with the running gateway.`;
	const remediation = `Remove ${GATEWAY_ENV_TOKEN} from the shell, ~/.operator/.env, or launchctl env if gateway.auth.token is intended, or point gateway.auth.token at \${${GATEWAY_ENV_TOKEN}} if the env var should be canonical.`;
	return {
		checkId: "gateway.env_token_overrides_config",
		title,
		detail,
		remediation,
		warningLines: [
			`- WARNING: ${title}.`,
			`  ${detail}`,
			`  Fix: ${remediation}`
		],
		diagnostic: `${title}: ${remediation}`
	};
}
//#endregion
Object.defineProperty(exports, "resolveGatewayAuthTokenSourceConflict", {
	enumerable: true,
	get: function() {
		return resolveGatewayAuthTokenSourceConflict;
	}
});
