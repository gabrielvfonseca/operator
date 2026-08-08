const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_credential_state = require("./credential-state-C5phrsSu.cjs");
const require_external_auth = require("./external-auth-CPpcflX7.cjs");
const require_source_check = require("./source-check-bi20wzmV.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_model_auth_env = require("./model-auth-env-C9t8YSK1.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
//#region src/agents/tools/model-config.helpers.ts
/**
* Tool model config and auth helpers.
*
* Model-backed tools use this module to choose provider/model refs and check
* whether candidate providers have usable auth before exposing defaults.
*/
const OPENAI_PROVIDER_ID = "openai";
const CODEX_MEDIA_PROVIDER_ID = "codex";
const OPENAI_RESPONSES_MODEL_API = "openai-responses";
/** Returns whether a tool model config contains a primary or fallback model ref. */
function hasToolModelConfig(model) {
	return Boolean(model?.primary?.trim() || (model?.fallbacks ?? []).some((entry) => entry.trim().length > 0));
}
/** Resolves the configured default model ref, falling back to Operator defaults. */
function resolveDefaultModelRef(cfg) {
	if (cfg) {
		const resolved = require_model_selection_shared.resolveConfiguredModelRef({
			cfg,
			defaultProvider: require_defaults.DEFAULT_PROVIDER,
			defaultModel: require_defaults.DEFAULT_MODEL
		});
		return {
			provider: resolved.provider,
			model: resolved.model
		};
	}
	return {
		provider: require_defaults.DEFAULT_PROVIDER,
		model: require_defaults.DEFAULT_MODEL
	};
}
/** Returns whether a provider has env, profile, or external CLI auth available. */
function hasAuthForProvider(params) {
	if (require_model_auth_env.resolveEnvApiKey(params.provider, void 0, {
		config: params.cfg,
		workspaceDir: params.workspaceDir
	})?.apiKey) return true;
	return hasAuthProfileForProvider({
		provider: params.provider,
		agentDir: params.agentDir,
		authStore: params.authStore,
		includeExternalCli: true
	});
}
/** Returns whether an auth profile exists for a provider, optionally filtered by type. */
function hasAuthProfileForProvider(params) {
	let store = params.authStore;
	if (!store) {
		const agentDir = params.agentDir?.trim();
		if (!agentDir) return false;
		if (!require_source_check.hasAnyAuthProfileStoreSource(agentDir)) return false;
		store = params.includeExternalCli ? require_store.ensureAuthProfileStore(agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForProviderAuth({ provider: params.provider }) }) : require_store.ensureAuthProfileStoreWithoutExternalProfiles(agentDir, { allowKeychainPrompt: false });
	}
	const profileIds = require_profile_list.listProfilesForProvider(store, params.provider);
	if (!params.type) return profileIds.length > 0;
	return profileIds.some((profileId) => store.profiles[profileId]?.type === params.type);
}
/** Returns whether a provider can be used by a model-backed tool. */
function hasProviderAuthForTool(params) {
	if (require_model_auth.hasRuntimeAvailableProviderAuth({
		provider: params.provider,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		allowPluginSyntheticAuth: false
	})) return true;
	if (hasAuthForProvider({
		provider: params.provider,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		agentDir: params.agentDir,
		authStore: params.authStore
	})) return true;
	return false;
}
function formatProviderModelRef(provider, model) {
	return `${provider}/${model}`;
}
function loadAuthStoreForProvider(params) {
	if (params.authStore) return params.authStore;
	const agentDir = params.agentDir?.trim();
	if (!agentDir) return;
	return params.includeExternalCli ? require_store.ensureAuthProfileStore(agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForProviderAuth({
		provider: params.provider,
		cfg: params.cfg
	}) }) : require_store.ensureAuthProfileStoreWithoutExternalProfiles(agentDir, { allowKeychainPrompt: false });
}
function overlayExternalCliAuthStoreForProvider(params) {
	const profiles = require_external_auth.resolveExternalCliAuthProfiles(params.authStore, {
		allowKeychainPrompt: false,
		providerIds: [params.provider]
	});
	if (profiles.length === 0) return params.authStore;
	return require_persisted.overlayRuntimeExternalOAuthProfiles(params.authStore, profiles);
}
function hasAuthProfileTypeInStore(params) {
	const types = Array.isArray(params.type) ? params.type : [params.type];
	return require_order.resolveAuthProfileOrder({
		cfg: params.cfg,
		store: params.store,
		provider: params.provider
	}).some((profileId) => types.includes(params.store.profiles[profileId]?.type));
}
function hasAuthProfileTypeForProvider(params) {
	const store = loadAuthStoreForProvider(params);
	if (store && hasAuthProfileTypeInStore({
		...params,
		store
	})) return true;
	if (params.includeExternalCli && params.authStore) {
		const externalStore = overlayExternalCliAuthStoreForProvider({
			provider: params.provider,
			authStore: params.authStore
		});
		return hasAuthProfileTypeInStore({
			...params,
			store: externalStore
		});
	}
	return false;
}
/** Returns whether a provider has direct API-key-capable auth for model-backed tools. */
function hasDirectProviderApiKeyAuthForTool(params) {
	const providerEntryProfileAuth = resolveDirectProviderEntryAuthFromProfileReference(params);
	if (providerEntryProfileAuth !== void 0) return providerEntryProfileAuth;
	if (require_model_auth.hasRuntimeAvailableProviderAuth({
		provider: params.provider,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		modelApi: params.modelApi,
		allowPluginSyntheticAuth: false
	})) return true;
	return hasAuthProfileTypeForProvider({
		provider: params.provider,
		cfg: params.cfg,
		agentDir: params.agentDir,
		authStore: params.authStore,
		type: "api_key"
	});
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.modelConfigHelpersTestApi")] = { hasDirectProviderApiKeyAuthForTool };
function hasCanonicalOpenAiCodexAuthSignal(params) {
	return hasAuthProfileTypeForProvider({
		provider: OPENAI_PROVIDER_ID,
		cfg: params.cfg,
		agentDir: params.agentDir,
		authStore: params.authStore,
		includeExternalCli: true,
		type: ["oauth", "token"]
	});
}
function resolveDirectProviderEntryAuthFromProfileReference(params) {
	const resolveFromStore = (store) => {
		const reference = require_model_auth.resolveProviderEntryApiKeyProfileReference({
			cfg: params.cfg,
			provider: params.provider,
			store
		});
		if (reference.kind === "profile") return reference.credential.type === "api_key" && require_credential_state.evaluateStoredCredentialEligibility({ credential: reference.credential }).eligible;
		if (reference.kind === "profile-incompatible") return false;
	};
	const store = loadAuthStoreForProvider({
		provider: params.provider,
		cfg: params.cfg,
		agentDir: params.agentDir,
		authStore: params.authStore,
		includeExternalCli: true
	});
	const storeResult = store ? resolveFromStore(store) : void 0;
	if (storeResult !== void 0) return storeResult;
	if (params.authStore) return resolveFromStore(overlayExternalCliAuthStoreForProvider({
		provider: params.provider,
		authStore: params.authStore
	}));
}
/** Resolves the implicit OpenAI image slot without letting OAuth-only auth pick direct OpenAI. */
function resolveOpenAiImageMediaCandidate(params) {
	const openAiModel = params.openAiModel.trim();
	if (!openAiModel) return { kind: "drop" };
	if (hasDirectProviderApiKeyAuthForTool({
		provider: OPENAI_PROVIDER_ID,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		agentDir: params.agentDir,
		authStore: params.authStore,
		modelApi: OPENAI_RESPONSES_MODEL_API
	})) return {
		kind: "keep",
		ref: formatProviderModelRef(OPENAI_PROVIDER_ID, openAiModel)
	};
	if (!hasCanonicalOpenAiCodexAuthSignal(params)) return { kind: "drop" };
	const codexModel = params.resolveCodexMediaRoute?.()?.model.trim();
	if (codexModel) return {
		kind: "substitute",
		provider: CODEX_MEDIA_PROVIDER_ID,
		ref: formatProviderModelRef(CODEX_MEDIA_PROVIDER_ID, codexModel)
	};
	return { kind: "drop" };
}
/** Normalizes agent tool model config into a compact runtime shape. */
function coerceToolModelConfig(model) {
	const primary = require_model_input.resolveAgentModelPrimaryValue(model);
	const fallbacks = require_model_input.resolveAgentModelFallbackValues(model);
	const timeoutMs = require_model_input.resolveAgentModelTimeoutMsValue(model);
	return {
		...primary?.trim() ? { primary: primary.trim() } : {},
		...fallbacks.length > 0 ? { fallbacks } : {},
		...timeoutMs !== void 0 ? { timeoutMs } : {}
	};
}
/** Builds a tool model config from configured auth-aware candidate model refs. */
function buildToolModelConfigFromCandidates(params) {
	if (hasToolModelConfig(params.explicit)) return params.explicit;
	const deduped = [];
	for (const candidate of params.candidates) {
		const trimmed = candidate?.trim();
		if (!trimmed?.includes("/")) continue;
		const provider = trimmed.slice(0, trimmed.indexOf("/")).trim();
		const providerConfigured = params.isProviderConfigured?.(provider) ?? hasProviderAuthForTool({
			provider,
			cfg: params.cfg,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			authStore: params.authStore
		});
		if (!provider || !providerConfigured) continue;
		if (!deduped.includes(trimmed)) deduped.push(trimmed);
	}
	if (deduped.length === 0) return null;
	return {
		primary: deduped[0],
		...deduped.length > 1 ? { fallbacks: deduped.slice(1) } : {},
		...params.explicit.timeoutMs !== void 0 ? { timeoutMs: params.explicit.timeoutMs } : {}
	};
}
//#endregion
Object.defineProperty(exports, "buildToolModelConfigFromCandidates", {
	enumerable: true,
	get: function() {
		return buildToolModelConfigFromCandidates;
	}
});
Object.defineProperty(exports, "coerceToolModelConfig", {
	enumerable: true,
	get: function() {
		return coerceToolModelConfig;
	}
});
Object.defineProperty(exports, "hasAuthForProvider", {
	enumerable: true,
	get: function() {
		return hasAuthForProvider;
	}
});
Object.defineProperty(exports, "hasAuthProfileForProvider", {
	enumerable: true,
	get: function() {
		return hasAuthProfileForProvider;
	}
});
Object.defineProperty(exports, "hasProviderAuthForTool", {
	enumerable: true,
	get: function() {
		return hasProviderAuthForTool;
	}
});
Object.defineProperty(exports, "hasToolModelConfig", {
	enumerable: true,
	get: function() {
		return hasToolModelConfig;
	}
});
Object.defineProperty(exports, "resolveDefaultModelRef", {
	enumerable: true,
	get: function() {
		return resolveDefaultModelRef;
	}
});
Object.defineProperty(exports, "resolveOpenAiImageMediaCandidate", {
	enumerable: true,
	get: function() {
		return resolveOpenAiImageMediaCandidate;
	}
});
