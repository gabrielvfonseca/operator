require("./session-key-BQFkCTNx.cjs");
const require_cli_execution_auth = require("./cli-execution-auth-CzWAogeM.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let node_util = require("node:util");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/system-agent/inference-route.ts
const SYSTEM_AGENT_EXECUTION_AGENT_ID = "@gabrielvfonseca/operator";
function projectSystemAgentExecutionConfig(config, routeAgentId) {
	const agents = config.agents?.list;
	if (!agents) return config;
	const routeAgent = routeAgentId === SYSTEM_AGENT_EXECUTION_AGENT_ID ? void 0 : agents.find((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id) === routeAgentId);
	const retainedAgents = agents.filter((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id) !== SYSTEM_AGENT_EXECUTION_AGENT_ID);
	const hasProjectedSettings = routeAgent?.params !== void 0 || routeAgent?.tools !== void 0;
	if (retainedAgents.length === agents.length && !hasProjectedSettings) return config;
	return {
		...config,
		agents: {
			...config.agents,
			list: [...retainedAgents, ...hasProjectedSettings ? [{
				id: SYSTEM_AGENT_EXECUTION_AGENT_ID,
				...routeAgent?.params !== void 0 ? { params: structuredClone(routeAgent.params) } : {},
				...routeAgent?.tools !== void 0 ? { tools: structuredClone(routeAgent.tools) } : {}
			}] : []]
		}
	};
}
async function resolveSystemAgentConfiguredRouteFromConfig(runConfig, requestedAgentId) {
	const [agentScope, modelSelection, modelRuntimeAliases, simpleCompletion, harnessPolicy] = await Promise.all([
		Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports),
		Promise.resolve().then(() => require("./model-selection-BvFurMxy.cjs")).then((n) => n.model_selection_exports),
		Promise.resolve().then(() => require("./model-runtime-aliases-Cfo8sBOf.cjs")).then((n) => n.model_runtime_aliases_exports),
		Promise.resolve().then(() => require("./simple-completion-runtime-BCVCP_Ps.cjs")).then((n) => n.simple_completion_runtime_exports),
		Promise.resolve().then(() => require("./policy-DHgMAqLv.cjs")).then((n) => n.policy_exports)
	]);
	const modelOwnerAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(requestedAgentId ?? agentScope.resolveDefaultAgentId(runConfig));
	if (!agentScope.resolveAgentEffectiveModelPrimary(runConfig, modelOwnerAgentId)) return null;
	const selection = simpleCompletion.resolveSimpleCompletionSelectionForAgent({
		cfg: runConfig,
		agentId: modelOwnerAgentId
	});
	if (!selection) return null;
	const executionProvider = modelRuntimeAliases.resolveCliRuntimeExecutionProvider({
		provider: selection.provider,
		cfg: runConfig,
		agentId: modelOwnerAgentId,
		modelId: selection.modelId,
		...selection.profileId ? { authProfileId: selection.profileId } : {}
	}) ?? selection.runtimeProvider ?? selection.provider;
	const isCliRoute = modelSelection.isCliProvider(executionProvider, runConfig);
	const allowCliAuthProfileForwarding = isCliRoute && require_cli_execution_auth.cliBackendAcceptsAuthProfileForwarding({
		provider: executionProvider,
		config: runConfig,
		agentId: modelOwnerAgentId
	});
	const cliAuthProfileId = allowCliAuthProfileForwarding ? require_cli_execution_auth.resolveCliExecutionAuthProfileId({
		cliExecutionProvider: executionProvider,
		authProfileProvider: selection.provider,
		config: runConfig,
		agentDir: selection.agentDir,
		...selection.profileId ? { selected: {
			authProfileId: selection.profileId,
			authProfileIdSource: "user"
		} } : {}
	}) : void 0;
	const authProfileId = allowCliAuthProfileForwarding ? cliAuthProfileId : selection.profileId;
	const base = {
		runConfig: projectSystemAgentExecutionConfig(runConfig, modelOwnerAgentId),
		modelLabel: `${selection.provider}/${selection.modelId}`,
		provider: executionProvider,
		model: selection.modelId,
		agentDir: selection.agentDir,
		agentId: modelOwnerAgentId,
		...authProfileId ? { authProfileId } : {}
	};
	if (isCliRoute) return {
		runner: "cli",
		...base
	};
	return {
		runner: "embedded",
		agentHarnessRuntimeOverride: harnessPolicy.resolveAgentHarnessPolicy({
			config: runConfig,
			agentId: modelOwnerAgentId,
			provider: selection.provider,
			modelId: selection.modelId
		}).runtime,
		...base
	};
}
function projectRelevantModelMap(params) {
	if (!params.models) return;
	const relevant = Object.fromEntries(Object.entries(params.models).filter(([key, entry]) => {
		const slash = key.indexOf("/");
		const provider = slash > 0 ? (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(key.slice(0, slash)) : "";
		const model = slash > 0 ? key.slice(slash + 1) : key;
		return params.providerIds.has(provider) && (model === params.modelId || model === "*" || key === params.rawModel) || entry.alias?.trim() === params.rawModel;
	}));
	return Object.keys(relevant).length > 0 ? relevant : void 0;
}
/** Project every config input that can change the configured default-agent route. */
async function projectDefaultInferenceRoute(config) {
	return await projectInferenceRoute(config);
}
/** Project every config input that can change one configured agent route. */
async function projectInferenceRoute(config, requestedAgentId) {
	const [{ resolveDefaultAgentId }, { resolveProviderIdForAuth }] = await Promise.all([Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports), Promise.resolve().then(() => require("./provider-auth-aliases-B21BttFc.cjs")).then((n) => n.provider_auth_aliases_exports)]);
	const defaultAgentId = resolveDefaultAgentId(config);
	const routeAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(requestedAgentId ?? defaultAgentId);
	const route = await resolveSystemAgentConfiguredRouteFromConfig(config, routeAgentId);
	const list = config.agents?.list ?? [];
	const agent = list.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === routeAgentId);
	const executionAgent = route?.runConfig.agents?.list?.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === SYSTEM_AGENT_EXECUTION_AGENT_ID);
	const defaults = config.agents?.defaults;
	const logicalProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(route?.modelLabel.split("/", 1)[0] ?? "");
	const providerIds = new Set([logicalProvider, (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(route?.provider ?? "")].filter(Boolean));
	const authProviderIds = new Set([...providerIds].map((provider) => resolveProviderIdForAuth(provider, { config })));
	const authProfiles = Object.fromEntries(Object.entries(config.auth?.profiles ?? {}).filter(([, profile]) => authProviderIds.has(resolveProviderIdForAuth(profile.provider, { config }))));
	const authOrder = Object.fromEntries(Object.entries(config.auth?.order ?? {}).filter(([provider]) => authProviderIds.has(resolveProviderIdForAuth(provider, { config }))));
	const modelProviders = Object.fromEntries(Object.entries(config.models?.providers ?? {}).filter(([provider]) => providerIds.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider))).map(([provider, providerConfig]) => [provider, structuredClone(providerConfig)]));
	const rawModel = typeof agent?.model === "string" ? agent.model : agent?.model?.primary || (typeof defaults?.model === "string" ? defaults.model : defaults?.model?.primary);
	let projectedRoute = null;
	if (route) {
		const { runConfig: _runConfig, ...routeWithoutConfig } = route;
		projectedRoute = routeWithoutConfig;
	}
	const explicitDefaultIds = requestedAgentId ? [routeAgentId] : list.filter((entry) => entry.default).map((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id));
	return {
		route: projectedRoute,
		defaultSelection: {
			explicitIds: explicitDefaultIds,
			...!requestedAgentId && explicitDefaultIds.length === 0 && list[0]?.id ? { fallbackId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(list[0].id) } : {}
		},
		auth: {
			profiles: authProfiles,
			order: authOrder,
			cooldowns: structuredClone(config.auth?.cooldowns)
		},
		models: {
			mode: config.models?.mode,
			providers: modelProviders
		},
		defaults: {
			model: structuredClone(defaults?.model),
			params: structuredClone(defaults?.params),
			models: projectRelevantModelMap({
				models: defaults?.models,
				providerIds,
				modelId: route?.model,
				rawModel
			}),
			agentRuntime: structuredClone(defaults?.agentRuntime),
			cliBackends: Object.fromEntries(Object.entries(defaults?.cliBackends ?? {}).filter(([provider]) => providerIds.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider))))
		},
		...agent ? { agent: {
			id: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id),
			agentDir: agent.agentDir,
			model: structuredClone(agent.model),
			params: structuredClone(agent.params),
			tools: structuredClone(agent.tools),
			models: projectRelevantModelMap({
				models: agent.models,
				providerIds,
				modelId: route?.model,
				rawModel
			}),
			agentRuntime: structuredClone(agent.agentRuntime)
		} } : {},
		...executionAgent ? { executionAgent: {
			id: SYSTEM_AGENT_EXECUTION_AGENT_ID,
			params: structuredClone(executionAgent.params),
			tools: structuredClone(executionAgent.tools)
		} } : {},
		env: structuredClone(config.env),
		secrets: structuredClone(config.secrets),
		plugins: structuredClone(config.plugins),
		tools: structuredClone(config.tools)
	};
}
function sameDefaultInferenceRoute(left, right) {
	return (0, node_util.isDeepStrictEqual)(left, right);
}
//#endregion
Object.defineProperty(exports, "projectDefaultInferenceRoute", {
	enumerable: true,
	get: function() {
		return projectDefaultInferenceRoute;
	}
});
Object.defineProperty(exports, "projectInferenceRoute", {
	enumerable: true,
	get: function() {
		return projectInferenceRoute;
	}
});
Object.defineProperty(exports, "resolveSystemAgentConfiguredRouteFromConfig", {
	enumerable: true,
	get: function() {
		return resolveSystemAgentConfiguredRouteFromConfig;
	}
});
Object.defineProperty(exports, "sameDefaultInferenceRoute", {
	enumerable: true,
	get: function() {
		return sameDefaultInferenceRoute;
	}
});
