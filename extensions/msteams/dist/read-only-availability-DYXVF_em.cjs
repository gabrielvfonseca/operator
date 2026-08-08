const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_credential_state = require("./credential-state-C5phrsSu.cjs");
//#region src/agents/auth-profiles/read-only-availability.ts
function hasSecret(value) {
	return typeof value === "string" && value.trim().length > 0;
}
function hasMalformedSecretInputSyntax(value) {
	if (typeof value !== "string") return false;
	const trimmed = value.trim();
	return trimmed.startsWith("secretref-env:") || trimmed.startsWith("__env__:") || trimmed.startsWith("$");
}
function resolveSecretRefReadOnlyAvailability(value, cfg, env) {
	if (!require_types_secrets.isSecretRef(value) || !require_ref_contract.isValidSecretRef(value)) return false;
	const source = cfg.secrets?.providers?.[value.provider];
	if (!source && (value.source !== "env" || value.provider !== require_ref_contract.resolveDefaultSecretProviderAlias(cfg, "env")) || source && source.source !== value.source) return false;
	if (value.source === "env") return source?.source === "env" && source.allowlist && !source.allowlist.includes(value.id) ? false : hasSecret(env[value.id]) ? true : void 0;
	if (value.source === "file" && source?.source === "file" && source.mode === "singleValue" !== (value.id === "value")) return false;
}
function resolveSecretInputReadOnlyAvailability(value, refValue, cfg, env) {
	const { ref } = require_types_secrets.resolveSecretInputRef({
		value,
		refValue,
		defaults: cfg.secrets?.defaults
	});
	if (ref) return resolveSecretRefReadOnlyAvailability(ref, cfg, env);
	if (!hasSecret(value)) return false;
	if (hasMalformedSecretInputSyntax(value)) return false;
	return require_model_auth_markers.isKnownEnvApiKeyMarker(value) ? hasSecret(env[value.trim()]) : require_model_auth_markers.isNonSecretApiKeyMarker(value) ? void 0 : true;
}
function resolveStoredCredentialReadOnlyAvailability(params) {
	const { credential, cfg, env } = params;
	const now = params.now ?? Date.now();
	if (credential.type === "api_key") return resolveSecretInputReadOnlyAvailability(credential.key, credential.keyRef, cfg, env);
	if (credential.type === "token") {
		const expiryState = require_credential_state.resolveTokenExpiryState(credential.expires, now);
		if (expiryState === "expired" || expiryState === "invalid_expires") return false;
		return resolveSecretInputReadOnlyAvailability(credential.token, credential.tokenRef, cfg, env);
	}
	if (require_credential_state.hasUsableOAuthCredential(credential, { now })) return true;
	if (hasSecret(credential.refresh)) return params.canRefreshOAuth ? true : void 0;
	return credential.oauthRef && !hasSecret(credential.access) ? void 0 : false;
}
//#endregion
Object.defineProperty(exports, "hasMalformedSecretInputSyntax", {
	enumerable: true,
	get: function() {
		return hasMalformedSecretInputSyntax;
	}
});
Object.defineProperty(exports, "resolveSecretRefReadOnlyAvailability", {
	enumerable: true,
	get: function() {
		return resolveSecretRefReadOnlyAvailability;
	}
});
Object.defineProperty(exports, "resolveStoredCredentialReadOnlyAvailability", {
	enumerable: true,
	get: function() {
		return resolveStoredCredentialReadOnlyAvailability;
	}
});
