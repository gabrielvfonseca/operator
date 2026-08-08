const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_oauth_refresh_failure = require("./oauth-refresh-failure-DoD44a9z.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_provider_secret_egress = require("./provider-secret-egress-NB6SfEEF.cjs");
const require_oauth = require("./oauth-D9-_YxyQ.cjs");
const require_external_auth = require("./external-auth-CPpcflX7.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_synthetic_auth_runtime = require("./synthetic-auth.runtime-DB9g0UmZ.cjs");
const require_model_auth_runtime_shared = require("./model-auth-runtime-shared-UOjMKX1E.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/model-auth.ts
/**
* Resolves model-provider credentials from config, env, auth profiles, and
* provider synthetic auth hooks. This module is the shared auth boundary for
* runtime dispatch, setup checks, and model metadata reporting.
*/
var model_auth_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	MissingProviderAuthError: () => require_model_auth_runtime_shared.MissingProviderAuthError,
	ProviderAuthError: () => require_model_auth_runtime_shared.ProviderAuthError,
	applyAuthHeaderOverride: () => applyAuthHeaderOverride,
	applyLocalNoAuthHeaderOverride: () => applyLocalNoAuthHeaderOverride,
	applySecretRefHeaderSentinels: () => applySecretRefHeaderSentinels,
	canUseProfileAsProviderEntryApiKey: () => canUseProfileAsProviderEntryApiKey,
	createRuntimeProviderAuthLookup: () => createRuntimeProviderAuthLookup,
	ensureAuthProfileStore: () => require_store.ensureAuthProfileStore,
	ensureAuthProfileStoreWithoutExternalProfiles: () => require_store.ensureAuthProfileStoreWithoutExternalProfiles,
	formatMissingAuthError: () => require_model_auth_runtime_shared.formatMissingAuthError,
	getApiKeyForModel: () => getApiKeyForModel,
	getCustomProviderApiKey: () => getCustomProviderApiKey,
	hasAvailableAuthForProvider: () => hasAvailableAuthForProvider,
	hasRuntimeAvailableProviderAuth: () => hasRuntimeAvailableProviderAuth,
	hasSyntheticLocalProviderAuthConfig: () => hasSyntheticLocalProviderAuthConfig,
	hasUsableCustomProviderApiKey: () => hasUsableCustomProviderApiKey,
	isMissingProviderAuthError: () => require_model_auth_runtime_shared.isMissingProviderAuthError,
	isProviderAuthError: () => require_model_auth_runtime_shared.isProviderAuthError,
	requireApiKey: () => require_model_auth_runtime_shared.requireApiKey,
	resolveApiKeyForProvider: () => resolveApiKeyForProvider,
	resolveAuthProfileOrder: () => require_order.resolveAuthProfileOrder,
	resolveAuthProfileOrderWithMetadata: () => require_order.resolveAuthProfileOrderWithMetadata,
	resolveAwsSdkEnvVarName: () => require_model_auth_runtime_shared.resolveAwsSdkEnvVarName,
	resolveEnvApiKey: () => require_model_auth_env.resolveEnvApiKey,
	resolveModelAuthMode: () => resolveModelAuthMode,
	resolveProviderEntryApiKeyBinding: () => resolveProviderEntryApiKeyBinding,
	resolveProviderEntryApiKeyProfileReference: () => resolveProviderEntryApiKeyProfileReference,
	resolveUsableCustomProviderApiKey: () => resolveUsableCustomProviderApiKey,
	shouldPreferExplicitConfigApiKeyAuth: () => shouldPreferExplicitConfigApiKeyAuth
});
function sentinelizeSecretRefProfileApiKey(params) {
	const credential = params.store.profiles[params.profileId];
	return (credential?.type === "api_key" ? require_types_secrets.coerceSecretRef(credential.keyRef) : credential?.type === "token" ? require_types_secrets.coerceSecretRef(credential.tokenRef) : null) && params.enabled ? require_provider_secret_egress.mintSecretSentinel(params.apiKey, { label: `model-auth:${params.provider}` }) : params.apiKey;
}
const log = require_subsystem.createSubsystemLogger("model-auth");
const OPENAI_PROVIDER_ID = "openai";
const OPENAI_CODEX_RESPONSES_API = "openai-chatgpt-responses";
function directOpenAIPlatformModelRequiresApiKey(params) {
	return require_model_selection_normalize.normalizeProviderId(params.provider) === OPENAI_PROVIDER_ID && params.modelApi !== void 0 && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.modelApi) !== OPENAI_CODEX_RESPONSES_API;
}
function isAuthModeAllowedForModel(params) {
	return !directOpenAIPlatformModelRequiresApiKey(params) || params.mode === "api-key";
}
function assertAuthModeAllowedForModel(params) {
	if (isAuthModeAllowedForModel(params)) return;
	throw new Error(`Auth profile "${params.profileId}" uses ${params.mode} auth, but ${params.provider}/${params.modelApi} requires an OpenAI API key profile.`);
}
function resolveConfigAwareEnvApiKey(cfg, provider, workspaceDir, skipSetupProviderFallback) {
	return require_model_auth_env.resolveEnvApiKey(provider, process.env, {
		config: cfg,
		workspaceDir,
		...skipSetupProviderFallback ? { skipSetupProviderFallback: true } : {}
	});
}
function resolveProviderConfig(cfg, provider) {
	return require_openai_routing.resolveMergedModelProviderConfig(cfg, provider);
}
/** Builds stable env/synthetic auth lookup data for repeated provider checks. */
function createRuntimeProviderAuthLookup(params) {
	const env = params.env ?? process.env;
	const lookupParams = {
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env
	};
	const syntheticAuthProviderRefs = params.includePluginSyntheticAuth === false ? void 0 : require_synthetic_auth_runtime.resolveRuntimeSyntheticAuthProviderRefState(lookupParams);
	const authLookupMaps = require_model_auth_markers.resolveProviderEnvAuthLookupMaps(lookupParams);
	return {
		envApiKey: {
			aliasMap: authLookupMaps.aliasMap,
			candidateMap: authLookupMaps.envCandidateMap,
			authEvidenceMap: authLookupMaps.authEvidenceMap,
			skipSetupProviderFallback: true
		},
		setupProviderFallbackRefs: authLookupMaps.setupProviderFallbackRefs,
		syntheticAuthProviderRefs: syntheticAuthProviderRefs?.complete ? syntheticAuthProviderRefs.refs : void 0,
		syntheticAuthProviderRefsComplete: syntheticAuthProviderRefs?.complete
	};
}
function runtimeLookupAllowsSetupProviderFallback(params) {
	const refs = params.runtimeLookup?.setupProviderFallbackRefs;
	if (!refs?.length) return false;
	const normalizedProvider = require_model_selection_normalize.normalizeProviderId(params.provider);
	const aliasTarget = params.runtimeLookup?.envApiKey.aliasMap?.[normalizedProvider];
	return refs.includes(normalizedProvider) || (aliasTarget ? refs.includes(aliasTarget) : false);
}
function resolveRuntimeEnvApiKeyLookupOptions(params) {
	const envApiKey = params.runtimeLookup?.envApiKey;
	if (!envApiKey) return;
	const skipSetupProviderFallback = envApiKey.skipSetupProviderFallback === true ? !runtimeLookupAllowsSetupProviderFallback(params) : envApiKey.skipSetupProviderFallback;
	return {
		...envApiKey,
		...skipSetupProviderFallback !== void 0 ? { skipSetupProviderFallback } : {}
	};
}
/** Reads a literal or env-secret marker for a custom provider entry. */
function getCustomProviderApiKey(cfg, provider) {
	const entry = resolveProviderConfig(cfg, provider);
	const literal = require_normalize_secret_input.normalizeOptionalSecretInput(entry?.apiKey);
	if (literal) return literal;
	const ref = require_types_secrets.coerceSecretRef(entry?.apiKey);
	if (!ref) return;
	if (ref.source === "env") return ref.id.trim() || "secretref-managed";
	return require_model_auth_markers.NON_ENV_SECRETREF_MARKER;
}
function canResolveEnvSecretRefInReadOnlyPath(params) {
	const providerConfig = params.cfg?.secrets?.providers?.[params.provider];
	if (!providerConfig) return params.provider === require_ref_contract.resolveDefaultSecretProviderAlias(params.cfg ?? {}, "env");
	if (providerConfig.source !== "env") return false;
	const allowlist = providerConfig.allowlist;
	return !allowlist || allowlist.includes(params.id);
}
/** Resolves custom provider API keys that are usable without mutating secret stores. */
function resolveUsableCustomProviderApiKey(params) {
	const customProviderConfig = resolveProviderConfig(params.cfg, params.provider);
	const apiKeyRef = require_types_secrets.coerceSecretRef(customProviderConfig?.apiKey);
	if (apiKeyRef) {
		if (apiKeyRef.source !== "env") return null;
		const envVarName = apiKeyRef.id.trim();
		if (!envVarName) return null;
		if (!canResolveEnvSecretRefInReadOnlyPath({
			cfg: params.cfg,
			provider: apiKeyRef.provider,
			id: envVarName
		})) return null;
		const envValue = require_normalize_secret_input.normalizeOptionalSecretInput((params.env ?? process.env)[envVarName]);
		if (!envValue) return null;
		const applied = new Set(require_io.getShellEnvAppliedKeys());
		return {
			apiKey: params.secretSentinels ? require_provider_secret_egress.mintSecretSentinel(envValue, { label: `model-auth:${params.provider}` }) : envValue,
			source: resolveEnvSourceLabel({
				applied,
				envVars: [envVarName],
				label: `${envVarName} (models.json secretref)`
			})
		};
	}
	const customKey = getCustomProviderApiKey(params.cfg, params.provider);
	if (!customKey) return null;
	if (!require_model_auth_markers.isNonSecretApiKeyMarker(customKey)) return {
		apiKey: customKey,
		source: "models.json"
	};
	if (require_model_auth_markers.isKnownEnvApiKeyMarker(customKey)) {
		const envValue = require_normalize_secret_input.normalizeOptionalSecretInput((params.env ?? process.env)[customKey]);
		if (!envValue) return null;
		return {
			apiKey: envValue,
			source: resolveEnvSourceLabel({
				applied: new Set(require_io.getShellEnvAppliedKeys()),
				envVars: [customKey],
				label: `${customKey} (models.json marker)`
			})
		};
	}
	if (customProviderConfig && isCustomLocalProviderConfig(customProviderConfig) && (customProviderConfig.api === "openai-completions" || customProviderConfig.api === "ollama") && customProviderConfig.baseUrl && isLocalBaseUrl(customProviderConfig.baseUrl)) return {
		apiKey: customProviderConfig.api === "ollama" ? customKey : require_model_auth_markers.CUSTOM_LOCAL_AUTH_MARKER,
		source: "models.json (local marker)"
	};
	return null;
}
/** True when a custom provider has a literal/env/local key available now. */
function hasUsableCustomProviderApiKey(cfg, provider, env) {
	return Boolean(resolveUsableCustomProviderApiKey({
		cfg,
		provider,
		env
	}));
}
/** True when explicit provider config should outrank profile/environment auth. */
function shouldPreferExplicitConfigApiKeyAuth(cfg, provider) {
	const providerConfig = resolveProviderConfig(cfg, provider);
	return resolveProviderAuthOverride(cfg, provider) === "api-key" && providerConfig !== void 0 && hasExplicitProviderApiKeyConfig(providerConfig);
}
function resolveProviderAuthOverride(cfg, provider) {
	const auth = resolveProviderConfig(cfg, provider)?.auth;
	if (auth === "api-key" || auth === "aws-sdk" || auth === "oauth" || auth === "token") return auth;
}
function resolveDirectProviderCredentialMode(params) {
	const configuredMode = resolveProviderAuthOverride(params.cfg, params.provider);
	return configuredMode === "oauth" || configuredMode === "token" ? configuredMode : params.inferredMode;
}
function shouldUseImplicitAwsSdkAuth(params) {
	if (params.modelApi !== "bedrock-converse-stream") return false;
	if (require_model_selection_normalize.normalizeProviderId(params.provider) !== "amazon-bedrock") return false;
	const providerConfig = resolveProviderConfig(params.cfg, params.provider);
	return resolveProviderAuthOverride(params.cfg, params.provider) === void 0 && (providerConfig === void 0 || !hasExplicitProviderApiKeyConfig(providerConfig));
}
function profileTypeToAuthMode(type) {
	return type === "oauth" ? "oauth" : type === "token" ? "token" : "api-key";
}
function normalizeProviderEntryBaseUrlForBinding(baseUrl) {
	const trimmed = baseUrl?.trim();
	if (!trimmed) return;
	try {
		const parsed = new URL(trimmed);
		parsed.hash = "";
		parsed.search = "";
		parsed.pathname = parsed.pathname.replace(/\/+$/, "");
		return parsed.toString().replace(/\/+$/, "");
	} catch {
		return trimmed.toLowerCase().replace(/\/+$/, "");
	}
}
function providerEntriesShareBaseUrl(params) {
	const providerBaseUrl = normalizeProviderEntryBaseUrlForBinding(resolveProviderConfig(params.cfg, params.provider)?.baseUrl);
	const credentialProviderBaseUrl = normalizeProviderEntryBaseUrlForBinding(resolveProviderConfig(params.cfg, params.credentialProvider)?.baseUrl);
	return Boolean(providerBaseUrl && credentialProviderBaseUrl && providerBaseUrl === credentialProviderBaseUrl);
}
function isBearerProfileCredential(credential) {
	return credential.type === "api_key" || credential.type === "token";
}
/** True when a bearer auth profile can safely satisfy a provider-entry apiKey reference. */
function canUseProfileAsProviderEntryApiKey(params) {
	if (!isBearerProfileCredential(params.credential)) return false;
	if (require_order.isStoredCredentialCompatibleWithAuthProvider({
		cfg: params.cfg,
		provider: params.provider,
		credential: params.credential
	})) return true;
	return providerEntriesShareBaseUrl({
		cfg: params.cfg,
		provider: params.provider,
		credentialProvider: params.credential.provider
	});
}
/** Classifies a provider entry apiKey as literal/profile/marker before resolving secrets. */
function resolveProviderEntryApiKeyProfileReference(params) {
	const providerConfig = resolveProviderConfig(params.cfg, params.provider);
	if (require_types_secrets.coerceSecretRef(providerConfig?.apiKey)) return { kind: "none" };
	const perEntryRawKey = require_normalize_secret_input.normalizeOptionalSecretInput(providerConfig?.apiKey);
	if (!perEntryRawKey) return { kind: "none" };
	if (require_model_auth_markers.isNonSecretApiKeyMarker(perEntryRawKey)) return { kind: "marker" };
	const credential = params.store.profiles[perEntryRawKey];
	if (!credential) return {
		kind: "literal",
		apiKey: perEntryRawKey,
		source: "models.json"
	};
	if (!isBearerProfileCredential(credential)) return {
		kind: "profile-incompatible",
		profileId: perEntryRawKey,
		credentialProvider: credential.provider,
		credentialType: credential.type,
		reason: "credential-class"
	};
	if (!canUseProfileAsProviderEntryApiKey({
		cfg: params.cfg,
		provider: params.provider,
		credential
	})) return {
		kind: "profile-incompatible",
		profileId: perEntryRawKey,
		credentialProvider: credential.provider,
		credentialType: credential.type,
		reason: "provider-binding"
	};
	return {
		kind: "profile",
		profileId: perEntryRawKey,
		credential,
		mode: profileTypeToAuthMode(credential.type)
	};
}
/** Resolves a provider-entry apiKey profile reference into runtime auth when possible. */
async function resolveProviderEntryApiKeyBinding(params) {
	const reference = resolveProviderEntryApiKeyProfileReference(params);
	if (reference.kind === "none" || reference.kind === "marker") return { kind: "none" };
	if (reference.kind === "literal") return reference;
	if (reference.kind === "profile-incompatible") return reference;
	try {
		const resolved = await require_oauth.resolveApiKeyForProfile({
			cfg: params.cfg,
			store: params.store,
			profileId: reference.profileId,
			agentDir: params.agentDir
		});
		if (!resolved) return {
			kind: "profile-unresolved",
			profileId: reference.profileId
		};
		const resolvedProfileId = resolved.profileId ?? reference.profileId;
		return {
			kind: "profile-resolved",
			auth: {
				apiKey: sentinelizeSecretRefProfileApiKey({
					apiKey: resolved.apiKey,
					enabled: params.secretSentinels,
					profileId: resolvedProfileId,
					provider: params.provider,
					store: params.store
				}),
				profileId: resolvedProfileId,
				source: `profile:${resolvedProfileId}`,
				mode: resolved.profileType ? profileTypeToAuthMode(resolved.profileType) : reference.mode
			}
		};
	} catch (err) {
		return {
			kind: "profile-unresolved",
			profileId: reference.profileId,
			error: err
		};
	}
}
function resolveConfiguredAwsSdkProfileAuth(params) {
	if (!require_order.isConfiguredAwsSdkAuthProfileForProvider(params)) return null;
	return {
		...resolveAwsSdkAuthInfo(),
		profileId: params.profileId,
		source: `profile:${params.profileId}`
	};
}
function isLocalBaseUrl(baseUrl) {
	try {
		let host = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(new URL(baseUrl).hostname);
		if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);
		return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1" || host === "::ffff:7f00:1" || host === "::ffff:127.0.0.1" || host === "docker.orb.internal" || host === "host.docker.internal" || host === "host.orb.internal" || host.endsWith(".local") || isPrivateIpv4Host(host);
	} catch {
		return false;
	}
}
function isPrivateIpv4Host(host) {
	if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
	const octets = host.split(".").map((part) => Number.parseInt(part, 10));
	if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
	const [a, b] = octets;
	return a === 10 || a === 172 && b !== void 0 && b >= 16 && b <= 31 || a === 192 && b === 168;
}
function hasExplicitProviderApiKeyConfig(providerConfig) {
	return require_normalize_secret_input.normalizeOptionalSecretInput(providerConfig.apiKey) !== void 0 || require_types_secrets.coerceSecretRef(providerConfig.apiKey) !== null;
}
function isCustomLocalProviderConfig(providerConfig) {
	return typeof providerConfig.baseUrl === "string" && providerConfig.baseUrl.trim().length > 0 && typeof providerConfig.api === "string" && providerConfig.api.trim().length > 0 && Array.isArray(providerConfig.models) && providerConfig.models.length > 0;
}
function isManagedSecretRefApiKeyMarker(apiKey) {
	return apiKey?.trim() === require_model_auth_markers.NON_ENV_SECRETREF_MARKER;
}
function hasSecretRefProviderApiKey(cfg, provider) {
	const apiKey = resolveProviderConfig(cfg, provider)?.apiKey;
	if (require_types_secrets.coerceSecretRef(apiKey)) return true;
	return typeof apiKey === "string" && (isManagedSecretRefApiKeyMarker(apiKey) || apiKey.trim().startsWith("secretref-env:"));
}
function providerConfigMatchesRuntimeSnapshot(params) {
	const inputProvider = resolveProviderConfig(params.inputConfig, params.provider);
	const runtimeProvider = resolveProviderConfig(params.runtimeConfig ?? void 0, params.provider);
	if (!inputProvider || !runtimeProvider) return false;
	const toComparableConfig = (providerConfig) => ({ models: { providers: { [params.provider]: providerConfig } } });
	return require_runtime_snapshot.hashRuntimeConfigValue(toComparableConfig(inputProvider)) === require_runtime_snapshot.hashRuntimeConfigValue(toComparableConfig(runtimeProvider));
}
function sentinelizeConfigSecretRefEnvApiKey(params) {
	if (!params.enabled) return params.apiKey;
	const runtimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
	const runtimeSourceConfig = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
	const configured = resolveProviderConfig(providerConfigMatchesRuntimeSnapshot({
		inputConfig: params.cfg,
		runtimeConfig,
		provider: params.provider
	}) ? runtimeSourceConfig ?? params.cfg : params.cfg, params.provider)?.apiKey;
	const ref = require_types_secrets.coerceSecretRef(configured);
	const envId = ref?.source === "env" ? ref.id : typeof configured === "string" && configured.trim().startsWith("secretref-env:") ? configured.trim().slice(require_model_auth_markers.SECRETREF_ENV_HEADER_MARKER_PREFIX.length) : void 0;
	return envId && params.source.includes(envId) ? require_provider_secret_egress.mintSecretSentinel(params.apiKey, { label: `model-auth:${params.provider}` }) : params.apiKey;
}
function resolveLiteralProviderConfigApiKeyAuth(params) {
	const apiKey = require_normalize_secret_input.normalizeOptionalSecretInput(resolveProviderConfig(params.cfg, params.provider)?.apiKey);
	if (!apiKey || require_model_auth_markers.isNonSecretApiKeyMarker(apiKey)) return;
	return {
		apiKey,
		source: `models.providers.${params.provider}`,
		mode: resolveDirectProviderCredentialMode({
			cfg: params.cfg,
			provider: params.provider,
			inferredMode: "api-key"
		})
	};
}
function resolveManagedSecretRefRuntimeProviderAuth(params) {
	const runtimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
	const runtimeSourceConfig = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
	if (params.cfg && params.cfg !== runtimeConfig && !runtimeSourceConfig) return;
	const usesRuntimeProvider = require_runtime_snapshot.selectApplicableRuntimeConfig({
		inputConfig: params.cfg,
		runtimeConfig,
		runtimeSourceConfig
	}) === runtimeConfig || providerConfigMatchesRuntimeSnapshot({
		inputConfig: params.cfg,
		runtimeConfig,
		provider: params.provider
	});
	if (!hasSecretRefProviderApiKey(usesRuntimeProvider ? runtimeSourceConfig ?? void 0 : params.cfg, params.provider)) return;
	if (!runtimeConfig || !usesRuntimeProvider) return;
	const resolved = resolveLiteralProviderConfigApiKeyAuth({
		cfg: runtimeConfig,
		provider: params.provider
	});
	if (!resolved?.apiKey) return;
	return {
		...resolved,
		apiKey: params.secretSentinels ? require_provider_secret_egress.mintSecretSentinel(resolved.apiKey, { label: `model-auth:${params.provider}` }) : resolved.apiKey
	};
}
/** True when a custom local provider can use a synthetic no-auth placeholder. */
function hasSyntheticLocalProviderAuthConfig(params) {
	const providerConfig = resolveProviderConfig(params.cfg, params.provider);
	if (!providerConfig) return false;
	if (!(Boolean(providerConfig.api?.trim()) || Boolean(providerConfig.baseUrl?.trim()) || Array.isArray(providerConfig.models) && providerConfig.models.length > 0)) return false;
	const authOverride = resolveProviderAuthOverride(params.cfg, params.provider);
	if (authOverride && authOverride !== "api-key") return false;
	if (!isCustomLocalProviderConfig(providerConfig)) return false;
	if (hasExplicitProviderApiKeyConfig(providerConfig)) return false;
	return Boolean(providerConfig.baseUrl && isLocalBaseUrl(providerConfig.baseUrl));
}
function listProviderSyntheticAuthRefs(params) {
	const refs = [params.provider];
	const providerConfig = resolveProviderConfig(params.cfg, params.provider);
	if (params.modelApi) refs.push(params.modelApi);
	if (providerConfig?.api) refs.push(providerConfig.api);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(refs.map((ref) => require_model_selection_normalize.normalizeProviderId(ref)));
}
function shouldResolvePluginSyntheticAuth(params) {
	const syntheticAuthProviderRefs = params.runtimeLookup?.syntheticAuthProviderRefs;
	if (!syntheticAuthProviderRefs) return true;
	const eligibleRefs = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(syntheticAuthProviderRefs.map((ref) => require_model_selection_normalize.normalizeProviderId(ref))));
	if (eligibleRefs.size === 0) return false;
	return listProviderSyntheticAuthRefs(params).some((ref) => eligibleRefs.has(ref));
}
/** Fast auth-availability check for runtime provider/model selection. */
function hasRuntimeAvailableProviderAuth(params) {
	const provider = require_model_selection_normalize.normalizeProviderId(params.provider);
	if (resolveProviderAuthOverride(params.cfg, provider) === "aws-sdk") return true;
	const envAuth = require_model_auth_env.resolveEnvApiKey(provider, params.env, {
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		...resolveRuntimeEnvApiKeyLookupOptions({
			provider,
			runtimeLookup: params.runtimeLookup
		})
	});
	if (envAuth && isAuthModeAllowedForModel({
		provider,
		modelApi: params.modelApi,
		mode: envAuth.source.includes("OAUTH_TOKEN") ? "oauth" : "api-key"
	})) return true;
	if (resolveUsableCustomProviderApiKey({
		cfg: params.cfg,
		provider,
		env: params.env
	})) return true;
	if (resolveManagedSecretRefRuntimeProviderAuth({
		cfg: params.cfg,
		provider
	})) return true;
	if (hasSyntheticLocalProviderAuthConfig({
		cfg: params.cfg,
		provider
	})) return true;
	if (params.allowPluginSyntheticAuth !== false && shouldResolvePluginSyntheticAuth({
		cfg: params.cfg,
		provider,
		runtimeLookup: params.runtimeLookup
	}) && resolveSyntheticLocalProviderAuth({
		cfg: params.cfg,
		provider
	})) return true;
	return false;
}
function resolveProviderSyntheticRuntimeAuth(params) {
	const runtimeAuth = resolveManagedSecretRefRuntimeProviderAuth(params);
	if (runtimeAuth) return { auth: runtimeAuth };
	if (hasSecretRefProviderApiKey(params.cfg, params.provider)) return { blockedOnManagedSecretRef: true };
	const resolveFromConfig = (config) => {
		const providerConfig = resolveProviderConfig(config, params.provider);
		return require_provider_runtime.resolveProviderSyntheticAuthWithPlugin({
			provider: params.provider,
			config,
			context: {
				config,
				provider: params.provider,
				providerConfig
			},
			modelApi: params.modelApi
		}) ?? void 0;
	};
	const directAuth = resolveFromConfig(params.cfg);
	if (!directAuth) return {};
	if (!isManagedSecretRefApiKeyMarker(directAuth.apiKey)) return { auth: directAuth };
	const runtimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
	if (!runtimeConfig || runtimeConfig === params.cfg) return { blockedOnManagedSecretRef: true };
	const runtimePluginAuth = resolveFromConfig(runtimeConfig);
	const runtimeApiKey = runtimePluginAuth?.apiKey;
	if (!runtimePluginAuth || !runtimeApiKey || require_model_auth_markers.isNonSecretApiKeyMarker(runtimeApiKey)) return { blockedOnManagedSecretRef: true };
	return { auth: {
		...runtimePluginAuth,
		apiKey: params.secretSentinels ? require_provider_secret_egress.mintSecretSentinel(runtimeApiKey, { label: `model-auth:${params.provider}` }) : runtimeApiKey
	} };
}
function resolveSyntheticLocalProviderAuth(params) {
	const syntheticProviderAuth = params.allowPluginSyntheticAuth === false ? {} : resolveProviderSyntheticRuntimeAuth(params);
	if (syntheticProviderAuth.auth) return syntheticProviderAuth.auth;
	if (syntheticProviderAuth.blockedOnManagedSecretRef) return null;
	if (!resolveProviderConfig(params.cfg, params.provider)) return null;
	if (hasSyntheticLocalProviderAuthConfig(params)) return {
		apiKey: require_model_auth_markers.CUSTOM_LOCAL_AUTH_MARKER,
		source: `models.providers.${params.provider} (synthetic local key)`,
		mode: "api-key"
	};
	return null;
}
function resolveEnvSourceLabel(params) {
	return `${params.envVars.some((envVar) => params.applied.has(envVar)) ? "shell env: " : "env: "}${params.label}`;
}
function resolveAwsSdkAuthInfo() {
	const applied = new Set(require_io.getShellEnvAppliedKeys());
	if (process.env.AWS_BEARER_TOKEN_BEDROCK?.trim()) return {
		mode: "aws-sdk",
		source: resolveEnvSourceLabel({
			applied,
			envVars: ["AWS_BEARER_TOKEN_BEDROCK"],
			label: "AWS_BEARER_TOKEN_BEDROCK"
		})
	};
	if (process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim()) return {
		mode: "aws-sdk",
		source: resolveEnvSourceLabel({
			applied,
			envVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
			label: "AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY"
		})
	};
	if (process.env.AWS_PROFILE?.trim()) return {
		mode: "aws-sdk",
		source: resolveEnvSourceLabel({
			applied,
			envVars: ["AWS_PROFILE"],
			label: "AWS_PROFILE"
		})
	};
	return {
		mode: "aws-sdk",
		source: "aws-sdk default chain"
	};
}
function shouldDeferSyntheticProfileAuth(params) {
	const providerConfig = resolveProviderConfig(params.cfg, params.provider);
	return require_provider_runtime.shouldDeferProviderSyntheticProfileAuthWithPlugin({
		provider: params.provider,
		config: params.cfg,
		modelApi: params.modelApi,
		context: {
			config: params.cfg,
			provider: params.provider,
			providerConfig,
			resolvedApiKey: params.resolvedApiKey
		}
	}) === true;
}
function resolveScopedAuthProfileStore(params) {
	return require_store.ensureAuthProfileStore(params.agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForProviderAuth(params) });
}
/** Resolves the credential that should be used for one provider request. */
async function resolveApiKeyForProvider(params) {
	const { provider, cfg, profileId, preferredProfile } = params;
	const agentDir = params.agentDir?.trim() || (cfg ? require_agent_scope_config.resolveDefaultAgentDir(cfg) : void 0);
	let scopedStore = params.store;
	if (profileId) {
		const awsSdkProfileAuth = resolveConfiguredAwsSdkProfileAuth({
			cfg,
			provider,
			profileId
		});
		if (awsSdkProfileAuth) return awsSdkProfileAuth;
		const store = params.store ?? resolveScopedAuthProfileStore({
			agentDir,
			cfg,
			provider,
			profileId,
			preferredProfile
		});
		const configuredProfileType = store.profiles[profileId]?.type;
		if (configuredProfileType) assertAuthModeAllowedForModel({
			provider,
			modelApi: params.modelApi,
			profileId,
			mode: profileTypeToAuthMode(configuredProfileType)
		});
		const resolved = await require_oauth.resolveApiKeyForProfile({
			cfg,
			store,
			profileId,
			agentDir,
			forceRefresh: params.forceRefresh
		});
		if (!resolved) throw new Error(`No credentials found for profile "${profileId}".`);
		const resolvedProfileId = resolved.profileId ?? profileId;
		const mode = resolved.profileType ?? store.profiles[resolvedProfileId]?.type;
		const result = {
			apiKey: sentinelizeSecretRefProfileApiKey({
				apiKey: resolved.apiKey,
				enabled: params.secretSentinels,
				profileId: resolvedProfileId,
				provider,
				store
			}),
			profileId: resolvedProfileId,
			source: `profile:${resolvedProfileId}`,
			mode: mode ? profileTypeToAuthMode(mode) : "api-key"
		};
		assertAuthModeAllowedForModel({
			provider,
			modelApi: params.modelApi,
			profileId: resolvedProfileId,
			mode: result.mode
		});
		if (!params.lockedProfile && shouldDeferSyntheticProfileAuth({
			cfg,
			provider,
			resolvedApiKey: resolved.apiKey,
			modelApi: params.modelApi
		})) return resolveApiKeyForProvider({
			...params,
			store,
			profileId: void 0,
			lockedProfile: true
		}).catch(() => result);
		return result;
	}
	if (params.allowAuthProfileFallback !== false && (cfg?.auth?.profiles || cfg?.auth?.order)) {
		scopedStore ??= resolveScopedAuthProfileStore({
			agentDir,
			cfg,
			provider,
			preferredProfile
		});
		const configuredProfileOrder = require_order.resolveAuthProfileOrder({
			cfg,
			store: scopedStore,
			provider,
			preferredProfile,
			forModel: params.modelId
		});
		for (const candidate of configuredProfileOrder) {
			const awsSdkProfileAuth = resolveConfiguredAwsSdkProfileAuth({
				cfg,
				provider,
				profileId: candidate
			});
			if (awsSdkProfileAuth) return awsSdkProfileAuth;
		}
	}
	if (resolveProviderAuthOverride(cfg, provider) === "aws-sdk") return resolveAwsSdkAuthInfo();
	if (shouldUseImplicitAwsSdkAuth({
		cfg,
		provider,
		modelApi: params.modelApi
	})) return resolveAwsSdkAuthInfo();
	if (params.credentialPrecedence === "env-first") {
		const envResolved = resolveConfigAwareEnvApiKey(cfg, provider, params.workspaceDir, params.skipSetupProviderFallback);
		if (envResolved) {
			const resolvedMode = resolveDirectProviderCredentialMode({
				cfg,
				provider,
				inferredMode: envResolved.source.includes("OAUTH_TOKEN") ? "oauth" : "api-key"
			});
			if (!isAuthModeAllowedForModel({
				provider,
				modelApi: params.modelApi,
				mode: resolvedMode
			})) return resolveApiKeyForProvider({
				...params,
				credentialPrecedence: "profile-first"
			});
			return {
				apiKey: sentinelizeConfigSecretRefEnvApiKey({
					apiKey: envResolved.apiKey,
					source: envResolved.source,
					cfg,
					provider,
					enabled: params.secretSentinels
				}),
				source: envResolved.source,
				mode: resolvedMode
			};
		}
	}
	scopedStore ??= resolveScopedAuthProfileStore({
		agentDir,
		cfg,
		provider,
		preferredProfile
	});
	const providerEntryBinding = await resolveProviderEntryApiKeyBinding({
		cfg,
		provider,
		store: scopedStore,
		agentDir,
		secretSentinels: params.secretSentinels
	});
	if (providerEntryBinding.kind === "profile-resolved") {
		assertAuthModeAllowedForModel({
			provider,
			modelApi: params.modelApi,
			profileId: providerEntryBinding.auth.profileId ?? provider,
			mode: providerEntryBinding.auth.mode
		});
		return providerEntryBinding.auth;
	}
	if (providerEntryBinding.kind === "profile-incompatible") {
		const reason = providerEntryBinding.reason === "credential-class" ? "which is not a bearer-style auth class" : "which is not compatible with this provider entry's auth binding";
		const action = providerEntryBinding.reason === "credential-class" ? "Use an api-key or token profile, or set apiKey to a literal bearer token." : "Use a compatible provider auth alias, configure the referenced provider entry with the same baseUrl, or set apiKey to a literal bearer token.";
		throw new Error(`Per-entry apiKey "${providerEntryBinding.profileId}" for provider "${provider}" references a "${providerEntryBinding.credentialType}" credential for provider "${providerEntryBinding.credentialProvider}", ${reason}. ${action}`);
	}
	if (providerEntryBinding.kind === "profile-unresolved") {
		const cause = providerEntryBinding.error ? require_errors.formatErrorMessage(providerEntryBinding.error) : "credential resolution returned no key";
		throw new Error(`Per-entry apiKey "${providerEntryBinding.profileId}" for provider "${provider}" matched a stored profile but failed to resolve: ${cause}. Fix the referenced profile or set apiKey to a literal bearer token.`);
	}
	if (shouldPreferExplicitConfigApiKeyAuth(cfg, provider)) {
		const runtimeCustomKey = resolveManagedSecretRefRuntimeProviderAuth({
			cfg,
			provider,
			secretSentinels: params.secretSentinels
		});
		if (runtimeCustomKey) return runtimeCustomKey;
		const customKey = resolveUsableCustomProviderApiKey({
			cfg,
			provider,
			secretSentinels: params.secretSentinels
		});
		if (customKey) return {
			apiKey: customKey.apiKey,
			source: customKey.source,
			mode: "api-key"
		};
	}
	const providerConfig = resolveProviderConfig(cfg, provider);
	const configuredLocalKey = resolveUsableCustomProviderApiKey({
		cfg,
		provider,
		secretSentinels: params.secretSentinels
	});
	if (configuredLocalKey && require_model_auth_markers.isNonSecretApiKeyMarker(configuredLocalKey.apiKey)) return {
		apiKey: configuredLocalKey.apiKey,
		source: configuredLocalKey.source,
		mode: "api-key"
	};
	const localMarkerEnv = resolveConfigAwareEnvApiKey(cfg, provider, params.workspaceDir, params.skipSetupProviderFallback);
	if (localMarkerEnv && require_model_auth_markers.isNonSecretApiKeyMarker(localMarkerEnv.apiKey)) return {
		apiKey: localMarkerEnv.apiKey,
		source: localMarkerEnv.source,
		mode: "api-key"
	};
	const store = scopedStore ?? resolveScopedAuthProfileStore({
		agentDir,
		cfg,
		provider,
		preferredProfile
	});
	const order = params.allowAuthProfileFallback === false ? [] : require_order.resolveAuthProfileOrder({
		cfg,
		store,
		provider,
		preferredProfile,
		forModel: params.modelId
	});
	let deferredAuthProfileResult = null;
	let refreshFailure;
	for (const candidate of order) {
		let candidateMode;
		try {
			const awsSdkProfileAuth = resolveConfiguredAwsSdkProfileAuth({
				cfg,
				provider,
				profileId: candidate
			});
			if (awsSdkProfileAuth) return awsSdkProfileAuth;
			const candidateType = store.profiles[candidate]?.type;
			candidateMode = candidateType ? profileTypeToAuthMode(candidateType) : void 0;
			if (candidateMode && !isAuthModeAllowedForModel({
				provider,
				modelApi: params.modelApi,
				mode: candidateMode
			})) continue;
			const resolved = await require_oauth.resolveApiKeyForProfile({
				cfg,
				store,
				profileId: candidate,
				agentDir,
				forceRefresh: params.forceRefresh
			});
			if (resolved) {
				const resolvedProfileId = resolved.profileId ?? candidate;
				const mode = resolved.profileType ?? store.profiles[resolvedProfileId]?.type;
				const resolvedMode = mode ? profileTypeToAuthMode(mode) : "api-key";
				const result = {
					apiKey: sentinelizeSecretRefProfileApiKey({
						apiKey: resolved.apiKey,
						enabled: params.secretSentinels,
						profileId: resolvedProfileId,
						provider,
						store
					}),
					profileId: resolvedProfileId,
					source: `profile:${resolvedProfileId}`,
					mode: resolvedMode
				};
				if (!isAuthModeAllowedForModel({
					provider,
					modelApi: params.modelApi,
					mode: result.mode
				})) continue;
				if (shouldDeferSyntheticProfileAuth({
					cfg,
					provider,
					resolvedApiKey: resolved.apiKey,
					modelApi: params.modelApi
				})) {
					deferredAuthProfileResult ??= result;
					continue;
				}
				return result;
			}
		} catch (err) {
			if (!refreshFailure && err instanceof require_oauth_refresh_failure.OAuthRefreshFailureError && (!candidateMode || isAuthModeAllowedForModel({
				provider,
				modelApi: params.modelApi,
				mode: candidateMode
			}))) refreshFailure = err;
			log.debug?.(`auth profile "${candidate}" failed for provider "${provider}": ${String(err)}`);
		}
	}
	const envResolved = resolveConfigAwareEnvApiKey(cfg, provider, params.workspaceDir, params.skipSetupProviderFallback);
	if (envResolved) {
		const resolvedMode = resolveDirectProviderCredentialMode({
			cfg,
			provider,
			inferredMode: envResolved.source.includes("OAUTH_TOKEN") ? "oauth" : "api-key"
		});
		if (isAuthModeAllowedForModel({
			provider,
			modelApi: params.modelApi,
			mode: resolvedMode
		})) return {
			apiKey: sentinelizeConfigSecretRefEnvApiKey({
				apiKey: envResolved.apiKey,
				source: envResolved.source,
				cfg,
				provider,
				enabled: params.secretSentinels
			}),
			source: envResolved.source,
			mode: resolvedMode
		};
	}
	const managedRuntimeAuth = resolveManagedSecretRefRuntimeProviderAuth({
		cfg,
		provider,
		secretSentinels: params.secretSentinels
	});
	if (managedRuntimeAuth && isAuthModeAllowedForModel({
		provider,
		modelApi: params.modelApi,
		mode: managedRuntimeAuth.mode
	})) return managedRuntimeAuth;
	const customKey = resolveUsableCustomProviderApiKey({
		cfg,
		provider,
		secretSentinels: params.secretSentinels
	});
	if (customKey) {
		const mode = resolveDirectProviderCredentialMode({
			cfg,
			provider,
			inferredMode: "api-key"
		});
		if (isAuthModeAllowedForModel({
			provider,
			modelApi: params.modelApi,
			mode
		})) return {
			apiKey: customKey.apiKey,
			source: customKey.source,
			mode
		};
	}
	if (deferredAuthProfileResult) return deferredAuthProfileResult;
	const syntheticLocalAuth = resolveSyntheticLocalProviderAuth({
		cfg,
		provider,
		modelApi: params.modelApi,
		secretSentinels: params.secretSentinels,
		allowPluginSyntheticAuth: params.allowAuthProfileFallback !== false
	});
	if (syntheticLocalAuth) return syntheticLocalAuth;
	if (refreshFailure) throw refreshFailure;
	const hasInlineConfiguredModels = Array.isArray(providerConfig?.models) && providerConfig.models.length > 0;
	if ((params.allowAuthProfileFallback !== false && !hasInlineConfiguredModels ? require_providers.resolveOwningPluginIdsForProviderRef({
		provider,
		config: cfg
	}) : void 0)?.length) {
		const pluginMissingAuthMessage = require_provider_runtime.buildProviderMissingAuthMessageWithPlugin({
			provider,
			config: cfg,
			context: {
				config: cfg,
				agentDir,
				env: process.env,
				provider,
				listProfileIds: (providerId) => require_profile_list.listProfilesForProvider(store, providerId)
			}
		});
		if (pluginMissingAuthMessage) throw new require_model_auth_runtime_shared.ProviderAuthError("missing-provider-auth", provider, pluginMissingAuthMessage);
	}
	const authStorePath = require_path_resolve.resolveAuthStorePathForDisplay(agentDir);
	const resolvedAgentDir = node_path.default.dirname(authStorePath);
	throw new require_model_auth_runtime_shared.ProviderAuthError("missing-provider-auth", provider, [
		`No API key found for provider "${provider}".`,
		`Auth store: ${authStorePath} (agentDir: ${resolvedAgentDir}).`,
		`Configure auth for this agent (${require_command_format.formatCliCommand("openclaw agents add <id>")}) or copy only portable static auth profiles from the main agentDir.`
	].join(" "));
}
/** Reports the strongest configured auth mode for provider-list UI and diagnostics. */
function resolveModelAuthMode(provider, cfg, store, options) {
	const resolved = provider?.trim();
	if (!resolved) return;
	if (resolveProviderAuthOverride(cfg, resolved) === "aws-sdk") return "aws-sdk";
	const authStore = store ?? resolveScopedAuthProfileStore({
		cfg,
		provider: resolved
	});
	const profiles = require_profile_list.listProfilesForProvider(authStore, resolved);
	if (profiles.length > 0) {
		const modes = new Set(profiles.map((id) => authStore.profiles[id]?.type).filter((mode) => Boolean(mode)));
		if ([
			"oauth",
			"token",
			"api_key"
		].filter((k) => modes.has(k)).length >= 2) return "mixed";
		if (modes.has("oauth")) return "oauth";
		if (modes.has("token")) return "token";
		if (modes.has("api_key")) return "api-key";
	}
	const envKey = resolveConfigAwareEnvApiKey(cfg, resolved, options?.workspaceDir);
	if (envKey?.apiKey) return envKey.source.includes("OAUTH_TOKEN") ? "oauth" : "api-key";
	if (require_model_selection_normalize.normalizeProviderId(resolved) === "codex" && require_external_auth.readCodexCliCredentialsCached({
		ttlMs: 5e3,
		allowKeychainPrompt: false
	})) return "oauth";
	if (hasUsableCustomProviderApiKey(cfg, resolved)) return "api-key";
	return "unknown";
}
/** Checks provider auth availability, including profile fallback order. */
async function hasAvailableAuthForProvider(params) {
	const { provider, cfg, preferredProfile } = params;
	if (resolveProviderAuthOverride(cfg, provider) === "aws-sdk") return true;
	const envAuth = resolveConfigAwareEnvApiKey(cfg, provider, params.workspaceDir);
	if (envAuth && isAuthModeAllowedForModel({
		provider,
		modelApi: params.modelApi,
		mode: envAuth.source.includes("OAUTH_TOKEN") ? "oauth" : "api-key"
	})) return true;
	if (resolveUsableCustomProviderApiKey({
		cfg,
		provider
	})) return true;
	if (resolveSyntheticLocalProviderAuth({
		cfg,
		provider
	})) return true;
	const store = params.store ?? resolveScopedAuthProfileStore({
		agentDir: params.agentDir,
		cfg,
		provider,
		preferredProfile
	});
	const order = require_order.resolveAuthProfileOrder({
		cfg,
		store,
		provider,
		preferredProfile,
		forModel: params.modelId
	});
	for (const candidate of order) try {
		if (resolveConfiguredAwsSdkProfileAuth({
			cfg,
			provider,
			profileId: candidate
		})) return true;
		const candidateType = store.profiles[candidate]?.type;
		if (candidateType && !isAuthModeAllowedForModel({
			provider,
			modelApi: params.modelApi,
			mode: profileTypeToAuthMode(candidateType)
		})) continue;
		const resolved = await require_oauth.resolveApiKeyForProfile({
			cfg,
			store,
			profileId: candidate,
			agentDir: params.agentDir
		});
		const mode = resolved?.profileType ?? store.profiles[candidate]?.type;
		if (resolved && isAuthModeAllowedForModel({
			provider,
			modelApi: params.modelApi,
			mode: mode ? profileTypeToAuthMode(mode) : "api-key"
		})) return true;
	} catch (err) {
		log.debug?.(`auth profile "${candidate}" failed for provider "${provider}": ${String(err)}`);
	}
	return false;
}
/** Resolves request credentials from the provider attached to a model descriptor. */
async function getApiKeyForModel(params) {
	return resolveApiKeyForProvider({
		provider: params.model.provider,
		cfg: params.cfg,
		profileId: params.profileId,
		preferredProfile: params.preferredProfile,
		store: params.store,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		lockedProfile: params.lockedProfile,
		credentialPrecedence: params.credentialPrecedence,
		allowAuthProfileFallback: params.allowAuthProfileFallback,
		skipSetupProviderFallback: params.skipSetupProviderFallback,
		modelId: params.model.id,
		modelApi: params.model.api,
		secretSentinels: params.secretSentinels
	});
}
/** Clears auth for local OpenAI-compatible servers that explicitly use no auth. */
function applyLocalNoAuthHeaderOverride(model, auth) {
	if (auth?.apiKey !== "custom-local" || model.api !== "openai-completions") return model;
	const headers = {
		...model.headers,
		Authorization: null
	};
	return {
		...model,
		headers
	};
}
function applySecretRefHeaderSentinels(model, cfg) {
	if (!model.headers) return model;
	const runtimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
	const runtimeSourceConfig = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
	const usesRuntimeProvider = require_runtime_snapshot.selectApplicableRuntimeConfig({
		inputConfig: cfg,
		runtimeConfig,
		runtimeSourceConfig
	}) === runtimeConfig || providerConfigMatchesRuntimeSnapshot({
		inputConfig: cfg,
		runtimeConfig,
		provider: model.provider
	});
	if (!runtimeConfig || !runtimeSourceConfig || !usesRuntimeProvider) return model;
	const sourceProvider = resolveProviderConfig(runtimeSourceConfig, model.provider);
	const runtimeProvider = resolveProviderConfig(runtimeConfig, model.provider);
	const replacements = /* @__PURE__ */ new Map();
	const isManagedSecret = (value) => require_types_secrets.coerceSecretRef(value) !== null || typeof value === "string" && require_model_auth_markers.isSecretRefHeaderValueMarker(value);
	const addReplacement = (name, value, replacement) => {
		replacements.set(name.trim().toLowerCase(), {
			value,
			replacement: replacement ?? require_provider_secret_egress.mintSecretSentinel(value, { label: `model-auth:${model.provider}` })
		});
	};
	for (const [name, sourceValue] of Object.entries(sourceProvider?.headers ?? {})) {
		if (!isManagedSecret(sourceValue)) continue;
		const value = require_normalize_secret_input.normalizeOptionalSecretInput(runtimeProvider?.headers?.[name]);
		if (value) addReplacement(name, value);
	}
	for (const [name, sourceValue] of Object.entries(sourceProvider?.request?.headers ?? {})) {
		if (!isManagedSecret(sourceValue)) continue;
		const value = require_normalize_secret_input.normalizeOptionalSecretInput(runtimeProvider?.request?.headers?.[name]);
		if (value) addReplacement(name, value);
	}
	const sourceAuth = sourceProvider?.request?.auth;
	const runtimeAuth = runtimeProvider?.request?.auth;
	const attachedRequest = require_provider_request_config.getModelProviderRequestTransport(model);
	let protectedRequest = attachedRequest;
	let protectedRequestHeaders;
	for (const [name, sourceValue] of Object.entries(sourceProvider?.request?.headers ?? {})) {
		if (!isManagedSecret(sourceValue)) continue;
		const value = require_normalize_secret_input.normalizeOptionalSecretInput(runtimeProvider?.request?.headers?.[name]);
		if (!value || attachedRequest?.headers?.[name] !== value) continue;
		protectedRequestHeaders ??= { ...attachedRequest.headers };
		protectedRequestHeaders[name] = require_provider_secret_egress.mintSecretSentinel(value, { label: `model-auth:${model.provider}` });
	}
	if (protectedRequestHeaders && attachedRequest) protectedRequest = {
		...attachedRequest,
		headers: protectedRequestHeaders
	};
	if (sourceAuth?.mode === "authorization-bearer" && runtimeAuth?.mode === "authorization-bearer" && isManagedSecret(sourceAuth.token)) {
		const token = require_normalize_secret_input.normalizeOptionalSecretInput(runtimeAuth.token)?.trim();
		if (token) {
			if (attachedRequest?.auth?.mode === "authorization-bearer") protectedRequest = {
				...protectedRequest,
				auth: {
					...attachedRequest.auth,
					token: require_provider_secret_egress.mintSecretSentinel(token, { label: `model-auth:${model.provider}` })
				}
			};
			addReplacement("Authorization", `Bearer ${token}`, `Bearer ${require_provider_secret_egress.mintSecretSentinel(token, { label: `model-auth:${model.provider}` })}`);
		}
	} else if (sourceAuth?.mode === "header" && runtimeAuth?.mode === "header" && isManagedSecret(sourceAuth.value)) {
		const value = require_normalize_secret_input.normalizeOptionalSecretInput(runtimeAuth.value)?.trim();
		const headerName = runtimeAuth.headerName.trim();
		const prefix = runtimeAuth.prefix?.trim() ?? "";
		if (headerName && value) {
			if (attachedRequest?.auth?.mode === "header") protectedRequest = {
				...protectedRequest,
				auth: {
					...attachedRequest.auth,
					value: require_provider_secret_egress.mintSecretSentinel(value, { label: `model-auth:${model.provider}` })
				}
			};
			addReplacement(headerName, `${prefix}${value}`, `${prefix}${require_provider_secret_egress.mintSecretSentinel(value, { label: `model-auth:${model.provider}` })}`);
		}
	}
	let headers;
	for (const [name, value] of Object.entries(model.headers)) {
		const replacement = replacements.get(name.trim().toLowerCase());
		if (replacement?.value !== value) continue;
		headers ??= { ...model.headers };
		headers[name] = replacement.replacement;
	}
	const protectedModel = headers ? {
		...model,
		headers
	} : model;
	return protectedRequest && protectedRequest !== attachedRequest ? require_provider_request_config.attachModelProviderRequestTransport(protectedModel, protectedRequest) : protectedModel;
}
/**
* When the provider config sets `authHeader: true`, inject an explicit
* `Authorization: Bearer <apiKey>` header into the model so downstream SDKs
* (e.g. `@google/genai`) send credentials via the standard HTTP Authorization
* header instead of vendor-specific headers like `x-goog-api-key`.
*
* This is a no-op when `authHeader` is not `true`, when no API key is
* available, or when the API key is a synthetic marker (e.g. local-server
* placeholders) rather than a real credential.
*/
function applyAuthHeaderOverride(model, auth, cfg) {
	const sentinelModel = applySecretRefHeaderSentinels(model, cfg);
	if (!auth?.apiKey) return sentinelModel;
	if (require_model_auth_markers.isNonSecretApiKeyMarker(auth.apiKey)) return sentinelModel;
	if (!resolveProviderConfig(cfg, sentinelModel.provider)?.authHeader) return sentinelModel;
	const headers = {};
	if (sentinelModel.headers) {
		for (const [key, value] of Object.entries(sentinelModel.headers)) if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(key) !== "authorization") headers[key] = value;
	}
	headers.Authorization = `Bearer ${auth.apiKey}`;
	return {
		...sentinelModel,
		headers
	};
}
//#endregion
Object.defineProperty(exports, "applyAuthHeaderOverride", {
	enumerable: true,
	get: function() {
		return applyAuthHeaderOverride;
	}
});
Object.defineProperty(exports, "applyLocalNoAuthHeaderOverride", {
	enumerable: true,
	get: function() {
		return applyLocalNoAuthHeaderOverride;
	}
});
Object.defineProperty(exports, "applySecretRefHeaderSentinels", {
	enumerable: true,
	get: function() {
		return applySecretRefHeaderSentinels;
	}
});
Object.defineProperty(exports, "createRuntimeProviderAuthLookup", {
	enumerable: true,
	get: function() {
		return createRuntimeProviderAuthLookup;
	}
});
Object.defineProperty(exports, "getApiKeyForModel", {
	enumerable: true,
	get: function() {
		return getApiKeyForModel;
	}
});
Object.defineProperty(exports, "getCustomProviderApiKey", {
	enumerable: true,
	get: function() {
		return getCustomProviderApiKey;
	}
});
Object.defineProperty(exports, "hasAvailableAuthForProvider", {
	enumerable: true,
	get: function() {
		return hasAvailableAuthForProvider;
	}
});
Object.defineProperty(exports, "hasRuntimeAvailableProviderAuth", {
	enumerable: true,
	get: function() {
		return hasRuntimeAvailableProviderAuth;
	}
});
Object.defineProperty(exports, "hasSyntheticLocalProviderAuthConfig", {
	enumerable: true,
	get: function() {
		return hasSyntheticLocalProviderAuthConfig;
	}
});
Object.defineProperty(exports, "hasUsableCustomProviderApiKey", {
	enumerable: true,
	get: function() {
		return hasUsableCustomProviderApiKey;
	}
});
Object.defineProperty(exports, "model_auth_exports", {
	enumerable: true,
	get: function() {
		return model_auth_exports;
	}
});
Object.defineProperty(exports, "resolveApiKeyForProvider", {
	enumerable: true,
	get: function() {
		return resolveApiKeyForProvider;
	}
});
Object.defineProperty(exports, "resolveModelAuthMode", {
	enumerable: true,
	get: function() {
		return resolveModelAuthMode;
	}
});
Object.defineProperty(exports, "resolveProviderEntryApiKeyBinding", {
	enumerable: true,
	get: function() {
		return resolveProviderEntryApiKeyBinding;
	}
});
Object.defineProperty(exports, "resolveProviderEntryApiKeyProfileReference", {
	enumerable: true,
	get: function() {
		return resolveProviderEntryApiKeyProfileReference;
	}
});
Object.defineProperty(exports, "resolveUsableCustomProviderApiKey", {
	enumerable: true,
	get: function() {
		return resolveUsableCustomProviderApiKey;
	}
});
Object.defineProperty(exports, "shouldPreferExplicitConfigApiKeyAuth", {
	enumerable: true,
	get: function() {
		return shouldPreferExplicitConfigApiKeyAuth;
	}
});
