require("./utils-CXqBhRFw.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/agents/harness-runtimes.ts
/**
* Collects configured native harness runtime ids from model provider config.
*/
function normalizeConfiguredRuntimeId(value) {
	return require_openai_routing.normalizeOptionalAgentRuntimeId(value);
}
function isSelectablePluginRuntime(runtime) {
	return Boolean(runtime) && !require_openai_routing.isDefaultAgentRuntimeId(runtime) && require_openai_routing.normalizeOptionalAgentRuntimeId(runtime) !== "@gabrielvfonseca/operator";
}
function listAgentModelRefs(value) {
	if (typeof value === "string") return [value];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return [];
	const refs = [];
	if (typeof value.primary === "string") refs.push(value.primary);
	if (Array.isArray(value.fallbacks)) {
		for (const fallback of value.fallbacks) if (typeof fallback === "string") refs.push(fallback);
	}
	return refs;
}
function pushAgentModelRefs(refs, value) {
	for (const ref of listAgentModelRefs(value)) refs.push(ref);
}
function parseConfiguredModelRef(value) {
	if (typeof value !== "string") return;
	return (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.parseModelCatalogRef)(value) ?? void 0;
}
function resolveConfiguredModelHarnessRuntime(params) {
	const parsed = parseConfiguredModelRef(params.modelRef);
	if (!parsed) return;
	const policy = require_policy.resolveAgentHarnessPolicy({
		config: params.config,
		provider: parsed.provider,
		modelId: parsed.modelId,
		agentId: params.agentId
	});
	if (!params.includeImplicitRuntimePreferences && policy.runtimeSource === "implicit") return;
	const runtime = normalizeConfiguredRuntimeId(policy.runtime);
	return isSelectablePluginRuntime(runtime) ? runtime : void 0;
}
function pushConfiguredModelRuntimeIds(config, runtimes) {
	for (const providerConfig of Object.values(config.models?.providers ?? {})) {
		const providerRuntime = normalizeConfiguredRuntimeId(providerConfig?.agentRuntime?.id);
		if (isSelectablePluginRuntime(providerRuntime)) runtimes.add(providerRuntime);
		for (const modelConfig of providerConfig?.models ?? []) {
			const modelRuntime = normalizeConfiguredRuntimeId(modelConfig?.agentRuntime?.id);
			if (isSelectablePluginRuntime(modelRuntime)) runtimes.add(modelRuntime);
		}
	}
	const pushModelMapRuntimeIds = (models) => {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(models)) return;
		for (const entry of Object.values(models)) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) continue;
			const runtime = normalizeConfiguredRuntimeId((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.agentRuntime) ? entry.agentRuntime.id : void 0);
			if (isSelectablePluginRuntime(runtime)) runtimes.add(runtime);
		}
	};
	pushModelMapRuntimeIds(config.agents?.defaults?.models);
	const agents = Array.isArray(config.agents?.list) ? config.agents.list : [];
	for (const agent of agents) pushModelMapRuntimeIds((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent) ? agent.models : void 0);
}
function pushConfiguredAgentModelRuntimeIds(config, runtimes, includeImplicitRuntimePreferences) {
	const pushModelRefs = (modelRefs, agentId) => {
		for (const modelRef of modelRefs) {
			const runtime = resolveConfiguredModelHarnessRuntime({
				config,
				includeImplicitRuntimePreferences,
				modelRef,
				agentId
			});
			if (runtime) runtimes.add(runtime);
		}
	};
	const pushModelMapRefs = (models, agentId) => {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(models)) return;
		pushModelRefs(Object.keys(models), agentId);
	};
	const defaultsModel = config.agents?.defaults?.model;
	const defaultsModelRefs = [];
	pushAgentModelRefs(defaultsModelRefs, defaultsModel);
	pushModelRefs(defaultsModelRefs);
	pushModelMapRefs(config.agents?.defaults?.models);
	if (!Array.isArray(config.agents?.list)) return;
	for (const agent of config.agents.list) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent)) continue;
		const agentId = typeof agent.id === "string" ? agent.id : void 0;
		const selectedModelRefs = [];
		pushAgentModelRefs(selectedModelRefs, agent.model ?? defaultsModel);
		pushModelRefs(selectedModelRefs, agentId);
		pushModelMapRefs(agent.models, agentId);
	}
}
/** Lists configured plugin harness runtime ids referenced by agent/model config. */
function collectConfiguredAgentHarnessRuntimes(config, options = {}) {
	const runtimes = /* @__PURE__ */ new Set();
	const includeImplicitRuntimePreferences = options.includeImplicitRuntimePreferences ?? true;
	pushConfiguredModelRuntimeIds(config, runtimes);
	pushConfiguredAgentModelRuntimeIds(config, runtimes, includeImplicitRuntimePreferences);
	return [...runtimes].toSorted((left, right) => left.localeCompare(right));
}
//#endregion
Object.defineProperty(exports, "collectConfiguredAgentHarnessRuntimes", {
	enumerable: true,
	get: function() {
		return collectConfiguredAgentHarnessRuntimes;
	}
});
