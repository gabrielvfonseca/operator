const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
require("./paths-C5Qy0ueD.cjs");
require("./agent-scope-config-DpWhyljG.cjs");
const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_provider_env_vars = require("./provider-env-vars-D_wXMNA1.cjs");
require("./profiles-m8TkqupR.cjs");
require("./identity-ByVfsnmK.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/provider-auth-helpers.ts
function buildEnvSecretRef(id) {
	return {
		source: "env",
		provider: require_types_secrets.DEFAULT_SECRET_PROVIDER_ALIAS,
		id
	};
}
function resolveProviderDefaultEnvSecretRef(provider, config) {
	const envVar = require_provider_env_vars.getProviderEnvVars(provider, {
		...config ? { config } : {},
		includeUntrustedWorkspacePlugins: false
	})?.find((candidate) => candidate.trim().length > 0);
	if (!envVar) throw new Error(`Provider "${provider}" does not have a default env var mapping for secret-input-mode=ref.`);
	return buildEnvSecretRef(envVar);
}
function resolveApiKeySecretInput(provider, input, options) {
	if (input !== null && typeof input === "object") {
		const coercedRef = require_types_secrets.coerceSecretRef(input);
		if (!coercedRef || !require_ref_contract.isValidSecretRef(coercedRef)) throw new Error("API key SecretRef is invalid.");
		return coercedRef;
	}
	if (options?.secretInputMode === "plaintext") return require_normalize_secret_input.normalizeSecretInput(input);
	const coercedRef = require_types_secrets.coerceSecretRef(input);
	if (coercedRef) {
		if (!require_ref_contract.isValidSecretRef(coercedRef)) throw new Error("API key SecretRef is invalid.");
		return coercedRef;
	}
	const normalized = require_normalize_secret_input.normalizeSecretInput(input);
	const inlineEnvRef = require_types_secrets.parseEnvTemplateSecretRef(normalized, require_types_secrets.DEFAULT_SECRET_PROVIDER_ALIAS);
	if (inlineEnvRef) return inlineEnvRef;
	if (options?.secretInputMode === "ref") return resolveProviderDefaultEnvSecretRef(provider, options.config);
	return normalized;
}
function buildApiKeyCredential(provider, input, metadata, options) {
	const secretInput = resolveApiKeySecretInput(provider, input, options);
	if (typeof secretInput === "string") return {
		type: "api_key",
		provider,
		key: secretInput,
		...metadata ? { metadata } : {}
	};
	return {
		type: "api_key",
		provider,
		keyRef: secretInput,
		...metadata ? { metadata } : {}
	};
}
function applyAuthProfileConfig(cfg, params) {
	const normalizedProvider = require_provider_auth_aliases.resolveProviderIdForAuth(params.provider, { config: cfg });
	const profiles = {
		...cfg.auth?.profiles,
		[params.profileId]: {
			provider: params.provider,
			mode: params.mode,
			...params.email ? { email: params.email } : {},
			...params.displayName ? { displayName: params.displayName } : {}
		}
	};
	const configuredProviderProfiles = Object.entries(cfg.auth?.profiles ?? {}).filter(([, profile]) => require_provider_auth_aliases.resolveProviderIdForAuth(profile.provider, { config: cfg }) === normalizedProvider).map(([profileId, profile]) => ({
		profileId,
		mode: profile.mode
	}));
	const matchingProviderOrderEntries = Object.entries(cfg.auth?.order ?? {}).filter(([providerId]) => require_provider_auth_aliases.resolveProviderIdForAuth(providerId, { config: cfg }) === normalizedProvider);
	const existingProviderOrder = matchingProviderOrderEntries.length > 0 ? (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(matchingProviderOrderEntries.flatMap(([, order]) => order)) : void 0;
	const preferProfileFirst = params.preferProfileFirst ?? true;
	const reorderedProviderOrder = existingProviderOrder && preferProfileFirst ? [params.profileId, ...existingProviderOrder.filter((profileId) => profileId !== params.profileId)] : existingProviderOrder;
	const hasMixedConfiguredModes = configuredProviderProfiles.some(({ profileId, mode }) => profileId !== params.profileId && mode !== params.mode);
	const derivedProviderOrder = existingProviderOrder === void 0 && preferProfileFirst && hasMixedConfiguredModes ? [params.profileId, ...configuredProviderProfiles.map(({ profileId }) => profileId).filter((profileId) => profileId !== params.profileId)] : void 0;
	const baseOrder = matchingProviderOrderEntries.length > 0 ? Object.fromEntries(Object.entries(cfg.auth?.order ?? {}).filter(([providerId]) => require_provider_auth_aliases.resolveProviderIdForAuth(providerId, { config: cfg }) !== normalizedProvider)) : cfg.auth?.order;
	const order = existingProviderOrder !== void 0 ? {
		...baseOrder,
		[normalizedProvider]: reorderedProviderOrder?.includes(params.profileId) ? reorderedProviderOrder : [...reorderedProviderOrder ?? [], params.profileId]
	} : derivedProviderOrder ? {
		...baseOrder,
		[normalizedProvider]: derivedProviderOrder
	} : baseOrder;
	return {
		...cfg,
		auth: {
			...cfg.auth,
			profiles,
			...order ? { order } : {}
		}
	};
}
//#endregion
Object.defineProperty(exports, "applyAuthProfileConfig", {
	enumerable: true,
	get: function() {
		return applyAuthProfileConfig;
	}
});
Object.defineProperty(exports, "buildApiKeyCredential", {
	enumerable: true,
	get: function() {
		return buildApiKeyCredential;
	}
});
