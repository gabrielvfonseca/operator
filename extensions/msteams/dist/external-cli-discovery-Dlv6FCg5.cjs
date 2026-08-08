const require_model_input = require("./model-input-DO-er-Kk.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/agents/auth-profiles/external-cli-scope.ts
/**
* External CLI auth discovery scope extraction from config.
* Collects provider/profile ids from configured models, runtimes, auth order,
* and agent defaults to limit CLI credential probing.
*/
function addProviderScopeId(out, value) {
	const raw = value?.trim();
	if (!raw) return;
	out.add(raw);
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(raw);
	if (normalized) out.add(normalized);
}
function addProviderScopeFromModelRef(out, value) {
	const raw = value?.trim();
	if (!raw) return;
	const slash = raw.indexOf("/");
	if (slash <= 0) return;
	addProviderScopeId(out, raw.slice(0, slash));
}
function addProviderScopeFromModelConfig(out, model) {
	addProviderScopeFromModelRef(out, require_model_input.resolveAgentModelPrimaryValue(model));
	for (const fallback of require_model_input.resolveAgentModelFallbackValues(model)) addProviderScopeFromModelRef(out, fallback);
}
function addExternalCliRuntimeScope(out, value) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(value?.trim() ?? "");
	if (normalized === "claude-cli" || normalized === "codex" || normalized === "codex-cli" || normalized === "codex-app-server" || normalized === "google-gemini-cli" || normalized === "openai" || normalized === "minimax" || normalized === "minimax-cli" || normalized === "minimax-portal") addProviderScopeId(out, normalized);
}
function addExternalCliRuntimeScopeFromModelMap(out, models) {
	for (const entry of Object.values(models ?? {})) addExternalCliRuntimeScope(out, entry?.agentRuntime?.id);
}
/** Resolves external CLI auth discovery scope from configured auth/model surfaces. */
function resolveExternalCliAuthScopeFromConfig(cfg) {
	const providerIds = /* @__PURE__ */ new Set();
	const profileIds = /* @__PURE__ */ new Set();
	for (const id of Object.keys(cfg.models?.providers ?? {})) addProviderScopeId(providerIds, id);
	for (const [profileId, profile] of Object.entries(cfg.auth?.profiles ?? {})) {
		const normalizedProfileId = profileId.trim();
		if (normalizedProfileId) profileIds.add(normalizedProfileId);
		addProviderScopeId(providerIds, profile?.provider);
	}
	for (const [provider, orderedProfileIds] of Object.entries(cfg.auth?.order ?? {})) {
		addProviderScopeId(providerIds, provider);
		for (const profileId of orderedProfileIds ?? []) {
			const normalizedProfileId = profileId.trim();
			if (normalizedProfileId) profileIds.add(normalizedProfileId);
		}
	}
	const defaults = cfg.agents?.defaults;
	addProviderScopeFromModelConfig(providerIds, defaults?.model);
	addProviderScopeFromModelConfig(providerIds, defaults?.imageModel);
	addProviderScopeFromModelConfig(providerIds, defaults?.imageGenerationModel);
	addProviderScopeFromModelConfig(providerIds, defaults?.videoGenerationModel);
	addProviderScopeFromModelConfig(providerIds, defaults?.musicGenerationModel);
	addProviderScopeFromModelConfig(providerIds, defaults?.voiceModel);
	addProviderScopeFromModelConfig(providerIds, defaults?.pdfModel);
	addExternalCliRuntimeScopeFromModelMap(providerIds, defaults?.models);
	for (const provider of Object.values(cfg.models?.providers ?? {})) {
		addExternalCliRuntimeScope(providerIds, provider?.agentRuntime?.id);
		for (const model of provider?.models ?? []) addExternalCliRuntimeScope(providerIds, model?.agentRuntime?.id);
	}
	const agents = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	for (const agent of agents) {
		addProviderScopeFromModelConfig(providerIds, agent.model);
		addProviderScopeFromModelConfig(providerIds, agent.subagents?.model);
		addExternalCliRuntimeScopeFromModelMap(providerIds, agent.models);
	}
	if (providerIds.size === 0 && profileIds.size === 0) return;
	return {
		providerIds: [...providerIds].toSorted((left, right) => left.localeCompare(right)),
		profileIds: [...profileIds].toSorted((left, right) => left.localeCompare(right))
	};
}
//#endregion
//#region src/agents/auth-profiles/external-cli-discovery.ts
/**
* External CLI auth discovery mode helpers.
* Converts provider/config lookup contexts into scoped discovery options for
* auth profile store loading.
*/
function normalizeStringList(values) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)([...values]);
}
/** Disables external CLI auth discovery. */
function externalCliDiscoveryNone(params) {
	return {
		mode: "none",
		allowKeychainPrompt: false,
		...params?.config ? { config: params.config } : {}
	};
}
/** Allows external CLI auth discovery for specific providers and/or profiles. */
function externalCliDiscoveryScoped(params) {
	return {
		mode: "scoped",
		...params.allowKeychainPrompt !== void 0 ? { allowKeychainPrompt: params.allowKeychainPrompt } : {},
		...params.config ? { config: params.config } : {},
		...params.providerIds ? { providerIds: params.providerIds } : {},
		...params.profileIds ? { profileIds: params.profileIds } : {}
	};
}
/** Builds external CLI discovery options for a provider auth lookup. */
function externalCliDiscoveryForProviderAuth(params) {
	const profileIds = normalizeStringList([params.profileId, params.preferredProfile]);
	return externalCliDiscoveryScoped({
		config: params.cfg,
		allowKeychainPrompt: params.allowKeychainPrompt ?? false,
		providerIds: [params.provider],
		...profileIds.length > 0 ? { profileIds } : {}
	});
}
/** Builds external CLI discovery options for config status checks. */
function externalCliDiscoveryForConfigStatus(params) {
	const scope = resolveExternalCliAuthScopeFromConfig(params.cfg);
	return externalCliDiscoveryFromScope({
		cfg: params.cfg,
		scope,
		allowKeychainPrompt: params.allowKeychainPrompt ?? false
	});
}
/** Builds external CLI discovery options for a provider set. */
function externalCliDiscoveryForProviders(params) {
	const providers = normalizeStringList(params.providers);
	if (providers.length === 0) return externalCliDiscoveryNone({ config: params.cfg });
	return externalCliDiscoveryScoped({
		config: params.cfg,
		allowKeychainPrompt: params.allowKeychainPrompt ?? false,
		providerIds: providers
	});
}
function externalCliDiscoveryFromScope(params) {
	if (!params.scope) return externalCliDiscoveryNone({ config: params.cfg });
	return externalCliDiscoveryScoped({
		config: params.cfg,
		allowKeychainPrompt: params.allowKeychainPrompt,
		providerIds: params.scope.providerIds,
		profileIds: params.scope.profileIds
	});
}
//#endregion
Object.defineProperty(exports, "externalCliDiscoveryForConfigStatus", {
	enumerable: true,
	get: function() {
		return externalCliDiscoveryForConfigStatus;
	}
});
Object.defineProperty(exports, "externalCliDiscoveryForProviderAuth", {
	enumerable: true,
	get: function() {
		return externalCliDiscoveryForProviderAuth;
	}
});
Object.defineProperty(exports, "externalCliDiscoveryForProviders", {
	enumerable: true,
	get: function() {
		return externalCliDiscoveryForProviders;
	}
});
Object.defineProperty(exports, "externalCliDiscoveryScoped", {
	enumerable: true,
	get: function() {
		return externalCliDiscoveryScoped;
	}
});
