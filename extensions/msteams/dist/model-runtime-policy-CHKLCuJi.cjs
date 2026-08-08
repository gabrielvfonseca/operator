const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/model-runtime-policy.ts
/**
* Model runtime policy resolution.
*
* Agent execution uses this to choose a model/provider-specific runtime policy
* from agent entries, model catalog config, provider config, or QA overrides.
*/
var model_runtime_policy_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolveModelRuntimePolicy: () => resolveModelRuntimePolicy });
function hasRuntimePolicy(value) {
	return Boolean(value?.id?.trim());
}
function resolveProviderConfig(config, provider) {
	if (!config?.models?.providers || !provider?.trim()) return;
	const providers = config.models.providers;
	const direct = providers[provider];
	if (direct) return direct;
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	for (const [candidateProvider, providerConfig] of Object.entries(providers)) if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(candidateProvider) === normalizedProvider) return providerConfig;
}
function normalizeModelIdForProvider(provider, modelId) {
	const trimmed = modelId?.trim();
	if (!trimmed) return;
	const slash = trimmed.indexOf("/");
	if (slash <= 0) return trimmed;
	const modelProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(trimmed.slice(0, slash));
	const expectedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider ?? "");
	if (expectedProvider && modelProvider !== expectedProvider) return;
	return trimmed.slice(slash + 1).trim() || void 0;
}
function parseProviderModelKey(key) {
	return (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(key) ?? void 0;
}
function resolveEffectiveProvider(provider, modelId) {
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider ?? "");
	if (normalizedProvider) return normalizedProvider;
	return parseProviderModelKey(modelId?.trim() ?? "")?.provider;
}
function providerMatchesCaller(provider, callerProvider) {
	return !callerProvider || provider === callerProvider;
}
function resolvePolicyMatch(matches, callerProvider) {
	const providerMatches = callerProvider ? matches.filter((match) => match.provider === callerProvider) : [];
	const candidates = providerMatches.length > 0 ? providerMatches : matches;
	const [first] = candidates;
	if (!first) return {};
	if (!callerProvider && candidates.some((match) => match.provider !== first.provider)) return { ambiguous: true };
	return {
		policy: first.policy,
		source: "model",
		matchedProvider: first.provider || callerProvider
	};
}
function modelEntryMatches(params) {
	return modelEntryMatchKind(params) === "exact";
}
function modelEntryMatchKind(params) {
	const entryId = params.entry.id.trim();
	if (entryId === params.modelId) return "exact";
	const parsed = parseProviderModelKey(entryId);
	if (!parsed) return "none";
	const callerProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider ?? "");
	if (!providerMatchesCaller(parsed.provider, callerProvider)) return "none";
	if (parsed.modelId === params.modelId) return "exact";
	if (parsed.modelId === "*") return "provider-wildcard";
	return "none";
}
function modelKeyMatchKind(params) {
	return modelEntryMatchKind({
		entry: { id: params.key },
		provider: params.provider,
		modelId: params.modelId
	});
}
function modelKeyIsProviderWildcard(params) {
	const parsed = parseProviderModelKey(params.key);
	if (!parsed) return false;
	const callerProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider ?? "");
	return parsed.modelId === "*" && providerMatchesCaller(parsed.provider, callerProvider);
}
function resolveAgentModelEntryRuntimePolicy(params) {
	const modelId = normalizeModelIdForProvider(params.provider, params.modelId);
	if (!params.config || !modelId && params.matchKind !== "provider-wildcard") return {};
	const { sessionAgentId } = require_agent_scope.resolveSessionAgentIds({
		config: params.config,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
	const modelMaps = [require_agent_scope_config.listAgentEntries(params.config).find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === sessionAgentId)?.models, params.config.agents?.defaults?.models];
	const callerProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider ?? "");
	for (const models of modelMaps) {
		const scopeMatches = [];
		for (const [key, entry] of Object.entries(models ?? {})) {
			const matches = modelId ? modelKeyMatchKind({
				key,
				provider: params.provider,
				modelId
			}) === params.matchKind : modelKeyIsProviderWildcard({
				key,
				provider: params.provider
			});
			const policy = entry?.agentRuntime;
			if (!matches || !policy || !hasRuntimePolicy(policy)) continue;
			scopeMatches.push({
				provider: parseProviderModelKey(key)?.provider ?? "",
				policy
			});
		}
		const resolved = resolvePolicyMatch(scopeMatches, callerProvider);
		if (resolved.policy || resolved.ambiguous) return resolved;
	}
	return {};
}
function resolveModelConfig(params) {
	const modelId = normalizeModelIdForProvider(params.provider, params.modelId);
	if (!modelId || !Array.isArray(params.providerConfig?.models)) return;
	return params.providerConfig.models.find((entry) => modelEntryMatches({
		entry,
		provider: params.provider,
		modelId
	}));
}
/** Resolves the effective runtime policy for an agent/model/provider selection. */
function resolveModelRuntimePolicy(params) {
	const callerProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider ?? "");
	const effectiveProvider = resolveEffectiveProvider(params.provider, params.modelId);
	const inferredMatchedProvider = callerProvider ? void 0 : effectiveProvider;
	if (process.env.OPERATOR_BUILD_PRIVATE_QA === "1") {
		const forcedRuntime = process.env.OPERATOR_QA_FORCE_RUNTIME?.trim().toLowerCase();
		if (forcedRuntime === "@gabrielvfonseca/operator" || forcedRuntime === "codex") return {
			policy: { id: forcedRuntime },
			source: "model"
		};
	}
	const agentModelPolicy = resolveAgentModelEntryRuntimePolicy({
		...params,
		provider: effectiveProvider,
		matchKind: "exact"
	});
	if (agentModelPolicy.ambiguous) return {};
	if (agentModelPolicy.policy) return agentModelPolicy;
	const providerConfig = resolveProviderConfig(params.config, effectiveProvider);
	const modelConfig = resolveModelConfig({
		providerConfig,
		provider: effectiveProvider,
		modelId: params.modelId
	});
	if (hasRuntimePolicy(modelConfig?.agentRuntime)) return {
		policy: modelConfig?.agentRuntime,
		source: "model",
		...inferredMatchedProvider ? { matchedProvider: inferredMatchedProvider } : {}
	};
	const agentWildcardModelPolicy = resolveAgentModelEntryRuntimePolicy({
		...params,
		provider: effectiveProvider,
		matchKind: "provider-wildcard"
	});
	if (agentWildcardModelPolicy.policy) return agentWildcardModelPolicy;
	if (hasRuntimePolicy(providerConfig?.agentRuntime)) return {
		policy: providerConfig?.agentRuntime,
		source: "provider",
		...inferredMatchedProvider ? { matchedProvider: inferredMatchedProvider } : {}
	};
	return {};
}
//#endregion
Object.defineProperty(exports, "model_runtime_policy_exports", {
	enumerable: true,
	get: function() {
		return model_runtime_policy_exports;
	}
});
Object.defineProperty(exports, "resolveModelRuntimePolicy", {
	enumerable: true,
	get: function() {
		return resolveModelRuntimePolicy;
	}
});
