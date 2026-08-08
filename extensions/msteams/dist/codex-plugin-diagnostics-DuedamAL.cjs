require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_model_runtime_policy = require("./model-runtime-policy-CHKLCuJi.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_model_catalog_core_configured_model_refs = require("@gabrielvfonseca/model-catalog-core/configured-model-refs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/model-selection-config.ts
/** Pure configured-model selection helpers safe for config validation. */
function resolveDefaultModelForAgent(params) {
	const agentModelOverride = params.agentId ? require_agent_scope.resolveAgentEffectiveModelPrimary(params.cfg, params.agentId) : void 0;
	return require_model_selection_shared.resolveConfiguredModelRef({
		cfg: agentModelOverride && agentModelOverride.length > 0 ? {
			...params.cfg,
			agents: {
				...params.cfg.agents,
				defaults: {
					...params.cfg.agents?.defaults,
					model: {
						...require_model_input.toAgentModelListLike(params.cfg.agents?.defaults?.model),
						primary: agentModelOverride
					}
				}
			}
		} : params.cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
}
function resolveSubagentConfiguredModelSelection(params) {
	const agentConfig = require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId);
	return require_model_selection_shared.normalizeModelSelection(agentConfig?.subagents?.model) ?? require_model_selection_shared.normalizeModelSelection(params.cfg.agents?.defaults?.subagents?.model) ?? (params.includeAgentPrimary === false ? void 0 : require_model_selection_shared.normalizeModelSelection(agentConfig?.model));
}
//#endregion
//#region src/config/codex-plugin-diagnostics.ts
const CODEX_PLUGIN_ID = "codex";
const OPENAI_PROVIDER_ID = "openai";
function codexPluginEntryEnabled(cfg) {
	for (const [pluginId, entry] of Object.entries(cfg.plugins?.entries ?? {})) if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(pluginId) === CODEX_PLUGIN_ID) return entry?.enabled;
}
function configuredRuntimeNeedsCodex(params) {
	const runtimeId = require_openai_routing.normalizeOptionalAgentRuntimeId(params.runtimeId);
	if (runtimeId === CODEX_PLUGIN_ID) return true;
	if (!require_openai_routing.isDefaultAgentRuntimeId(runtimeId)) return false;
	return require_openai_routing.resolveOpenAIImplicitAgentRuntime({
		provider: OPENAI_PROVIDER_ID,
		modelId: params.modelId,
		config: params.cfg,
		env: params.env
	}) === CODEX_PLUGIN_ID;
}
/** Resolves effective runtime policy for one canonical provider/model route. */
function configuredModelRouteNeedsCodex(params) {
	if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.route.provider) !== OPENAI_PROVIDER_ID) return false;
	const runtime = require_model_runtime_policy.resolveModelRuntimePolicy({
		config: params.cfg,
		provider: OPENAI_PROVIDER_ID,
		modelId: params.route.modelId,
		agentId: params.agentId
	}).policy?.id;
	return configuredRuntimeNeedsCodex({
		cfg: params.cfg,
		env: params.env,
		modelId: params.route.modelId,
		runtimeId: runtime
	});
}
function resolveEffectiveSelectedModelRefs(params) {
	const { cfg, agentId } = params;
	const mainPrimaryRaw = require_agent_scope.resolveAgentEffectiveModelPrimary(cfg, agentId);
	const mainFallbacks = require_agent_scope.resolveAgentModelFallbacksOverride(cfg, agentId) ?? require_model_input.resolveAgentModelFallbackValues(cfg.agents?.defaults?.model);
	const subagentPrimaryRaw = resolveSubagentConfiguredModelSelection({
		cfg,
		agentId
	}) ?? mainPrimaryRaw;
	const subagentFallbacks = require_agent_scope.resolveEffectiveModelFallbacks({
		cfg,
		agentId,
		sessionKey: `agent:${agentId}:subagent:codex-diagnostic`,
		hasSessionModelOverride: true,
		modelOverrideSource: "auto"
	}) ?? [];
	const values = /* @__PURE__ */ new Set();
	for (const raw of [
		mainPrimaryRaw,
		...mainFallbacks,
		subagentPrimaryRaw,
		...subagentFallbacks
	]) {
		const value = raw?.trim();
		if (value) values.add(value);
	}
	return {
		complete: Boolean(mainPrimaryRaw?.trim() && subagentPrimaryRaw?.trim()),
		values
	};
}
function configuredRefTargetsAgent(params) {
	const match = /^agents\.list\.(\d+)\./.exec(params.path);
	if (!match) return true;
	const entry = params.cfg.agents?.list?.[Number(match[1])];
	return Boolean(entry && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === params.agentId);
}
function configuredRefIsEffectiveForAgent(params) {
	if (!configuredRefTargetsAgent(params)) return false;
	if (/^agents\.(?:defaults|list\.\d+)\.(?:model|subagents\.model)(?:\.|$)/.test(params.path)) return params.selectedModelRefs.has(params.value);
	const agent = require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId);
	if (params.path.endsWith(".heartbeat.model")) return (agent?.heartbeat?.model?.trim() || params.cfg.agents?.defaults?.heartbeat?.model?.trim()) === params.value;
	if (params.path.endsWith(".utilityModel")) return (agent?.utilityModel ?? params.cfg.agents?.defaults?.utilityModel)?.trim() === params.value;
	return true;
}
function configuredProviderPoliciesNeedCodex(cfg, env, agentIds) {
	for (const agentId of agentIds) {
		const genericPolicy = require_model_runtime_policy.resolveModelRuntimePolicy({
			config: cfg,
			provider: OPENAI_PROVIDER_ID,
			agentId
		}).policy;
		if (genericPolicy?.id?.trim() && configuredRuntimeNeedsCodex({
			cfg,
			env,
			runtimeId: genericPolicy.id
		})) return true;
	}
	for (const [providerId, providerConfig] of Object.entries(cfg.models?.providers ?? {})) {
		if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId) !== OPENAI_PROVIDER_ID) continue;
		for (const model of providerConfig.models ?? []) {
			if (!model.agentRuntime?.id?.trim()) continue;
			const parsed = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(model.id);
			const modelId = parsed?.provider === OPENAI_PROVIDER_ID ? parsed.modelId : model.id.trim();
			if (modelId && modelId !== "*" && agentIds.some((agentId) => configuredModelRouteNeedsCodex({
				cfg,
				env,
				agentId,
				route: {
					provider: OPENAI_PROVIDER_ID,
					modelId
				}
			}))) return true;
		}
	}
	return false;
}
function configuredModelRefsNeedCodex(params) {
	const refs = (0, _gabrielvfonseca_model_catalog_core_configured_model_refs.collectConfiguredModelRefs)(params.cfg);
	let complete = true;
	for (const agentId of params.agentIds) {
		const selected = resolveEffectiveSelectedModelRefs({
			cfg: params.cfg,
			agentId
		});
		complete &&= selected.complete;
		const primary = resolveDefaultModelForAgent({
			cfg: params.cfg,
			agentId,
			manifestPlugins: []
		});
		const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
			cfg: params.cfg,
			defaultProvider: primary.provider,
			manifestPlugins: []
		});
		for (const ref of refs) {
			if (!configuredRefIsEffectiveForAgent({
				cfg: params.cfg,
				path: ref.path,
				value: ref.value,
				agentId,
				selectedModelRefs: selected.values
			})) continue;
			const resolved = require_model_selection_shared.resolveModelRefFromString({
				cfg: params.cfg,
				raw: ref.value,
				defaultProvider: primary.provider,
				aliasIndex,
				allowManifestNormalization: false
			});
			const route = resolved ? {
				provider: resolved.ref.provider,
				modelId: resolved.ref.model
			} : void 0;
			if (route && configuredModelRouteNeedsCodex({
				cfg: params.cfg,
				env: params.env,
				agentId,
				route
			})) return {
				complete,
				needsCodex: true
			};
		}
	}
	return {
		complete,
		needsCodex: false
	};
}
function defaultOpenAiRouteNeedsCodex(cfg, env, agentIds) {
	return agentIds.some((agentId) => {
		const runtimeId = require_model_runtime_policy.resolveModelRuntimePolicy({
			config: cfg,
			provider: OPENAI_PROVIDER_ID,
			agentId
		}).policy?.id;
		return configuredRuntimeNeedsCodex({
			cfg,
			env,
			runtimeId
		});
	});
}
function configNeedsCodexForOpenAi(cfg, env) {
	const agentIds = require_agent_scope_config.listAgentIds(cfg);
	const configuredRefs = configuredModelRefsNeedCodex({
		cfg,
		env,
		agentIds
	});
	if (configuredRefs.needsCodex) return true;
	if (configuredProviderPoliciesNeedCodex(cfg, env, agentIds)) return true;
	return configuredRefs.complete ? false : defaultOpenAiRouteNeedsCodex(cfg, env, agentIds);
}
/** Suppresses missing Codex diagnostics when no effective OpenAI route selects it. */
function shouldSuppressMissingCodexPluginDiagnostics(cfg, env = process.env) {
	const entryEnabled = codexPluginEntryEnabled(cfg);
	if (entryEnabled === true) return false;
	return entryEnabled === false || !configNeedsCodexForOpenAi(cfg, env);
}
//#endregion
Object.defineProperty(exports, "configuredModelRouteNeedsCodex", {
	enumerable: true,
	get: function() {
		return configuredModelRouteNeedsCodex;
	}
});
Object.defineProperty(exports, "resolveDefaultModelForAgent", {
	enumerable: true,
	get: function() {
		return resolveDefaultModelForAgent;
	}
});
Object.defineProperty(exports, "resolveSubagentConfiguredModelSelection", {
	enumerable: true,
	get: function() {
		return resolveSubagentConfiguredModelSelection;
	}
});
Object.defineProperty(exports, "shouldSuppressMissingCodexPluginDiagnostics", {
	enumerable: true,
	get: function() {
		return shouldSuppressMissingCodexPluginDiagnostics;
	}
});
