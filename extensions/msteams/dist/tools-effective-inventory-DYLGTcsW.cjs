const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_agent_tools = require("./agent-tools-C4N0fa5t.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
const require_agent_model_discovery = require("./agent-model-discovery-k4IOdehL.cjs");
const require_model_static_catalog = require("./model.static-catalog-CFNIavpF.cjs");
const require_model = require("./model-Don1-Go6.cjs");
const require_tools_effective_inventory_build = require("./tools-effective-inventory-build-DoIwuwqv.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/tools-effective-inventory-groups.ts
function groupLabel(source) {
	switch (source) {
		case "plugin": return "Connected tools";
		case "channel": return "Channel tools";
		case "mcp": return "MCP server tools";
		default: return "Built-in tools";
	}
}
/** Groups effective tool inventory entries by source in UI/report order. */
function buildEffectiveToolInventoryGroups(entries) {
	const groupsBySource = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		const tools = groupsBySource.get(entry.source) ?? [];
		tools.push(entry);
		groupsBySource.set(entry.source, tools);
	}
	return [
		"core",
		"plugin",
		"channel",
		"mcp"
	].map((source) => {
		const tools = groupsBySource.get(source);
		if (!tools || tools.length === 0) return null;
		return {
			id: source,
			label: groupLabel(source),
			source,
			tools
		};
	}).filter((group) => group !== null);
}
//#endregion
//#region src/agents/tools-effective-inventory.ts
/**
* Effective tool inventory resolver.
*
* Builds model-visible tool lists after profile, provider, plugin, policy, and compatibility filters.
*/
function listIncludesTool(list, toolName) {
	if (!Array.isArray(list)) return false;
	const normalizedToolName = require_tool_policy.normalizeToolName(toolName);
	return list.some((entry) => require_tool_policy.normalizeToolName(entry) === normalizedToolName);
}
function policyDeniesTool(policy, toolName) {
	return listIncludesTool(policy?.deny, toolName) || listIncludesTool(policy?.deny, "group:ui") || listIncludesTool(policy?.deny, "group:openclaw");
}
function hasExplicitBrowserIntent(cfg) {
	return cfg.browser?.enabled !== false && Boolean(cfg.browser || cfg.plugins?.entries?.browser);
}
function buildToolInventoryNotices(params) {
	if (params.entries.some((entry) => require_tool_policy.normalizeToolName(entry.id) === "browser") || !hasExplicitBrowserIntent(params.cfg)) return;
	if ([
		params.effectivePolicy.globalPolicy,
		params.effectivePolicy.globalProviderPolicy,
		params.effectivePolicy.agentPolicy,
		params.effectivePolicy.agentProviderPolicy
	].some((policy) => policyDeniesTool(policy, "browser"))) return [{
		id: "browser-denied-by-policy",
		severity: "info",
		message: "Browser is configured, but this session does not expose the browser tool because tool policy denies it. Remove the browser deny entry to use browser automation."
	}];
	if (params.profile !== "full") return [{
		id: "browser-filtered-by-profile",
		severity: "info",
		message: "Browser is configured, but the current tool profile does not include the browser tool. Add tools.alsoAllow: [\"browser\"] or agents.list[].tools.alsoAllow: [\"browser\"]; tools.subagents.tools.allow alone cannot add it back after profile filtering."
	}];
	if (Array.isArray(params.cfg.plugins?.allow) && !listIncludesTool(params.cfg.plugins.allow, "browser")) return [{
		id: "browser-plugin-not-allowed",
		severity: "warning",
		message: "Browser is configured, but plugins.allow does not include browser. Add \"browser\" to plugins.allow or remove the restrictive plugin allowlist."
	}];
}
function applyProviderTransportNormalization(params) {
	const normalized = require_provider_runtime.normalizeProviderTransportWithPlugin({
		provider: params.provider,
		modelId: params.runtimeModel.id,
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		context: {
			config: params.cfg,
			workspaceDir: params.workspaceDir,
			provider: params.provider,
			modelId: params.runtimeModel.id,
			api: params.runtimeModel.api,
			baseUrl: params.runtimeModel.baseUrl
		}
	});
	if (!normalized) return params.runtimeModel;
	return {
		...params.runtimeModel,
		api: normalized.api ?? params.runtimeModel.api,
		baseUrl: normalized.baseUrl ?? params.runtimeModel.baseUrl
	};
}
function resolveConfiguredFallbackApi(providerConfig) {
	const explicitApi = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerConfig?.api);
	if (explicitApi) return explicitApi;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerConfig?.baseUrl) ? "openai-completions" : "openai-responses";
}
function resolveDynamicRuntimeModelContext(params) {
	const runtimeModel = require_model.resolveModel(params.provider, params.modelId, params.agentDir, params.cfg, { workspaceDir: params.workspaceDir }).model;
	if (!runtimeModel) return {};
	return {
		modelApi: runtimeModel.api,
		runtimeModel
	};
}
/** Resolves the runtime model metadata needed to filter model-compatible tools. */
function resolveEffectiveToolInventoryRuntimeModelContext(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.modelProvider ?? "");
	const modelId = params.modelId?.trim() ?? "";
	if (!provider || !modelId) return {};
	const agentId = params.agentId?.trim() || require_agent_scope.resolveSessionAgentId({ config: params.cfg });
	const workspaceDir = params.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId);
	const providerConfig = (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.cfg.models?.providers, provider);
	const configuredModels = Array.isArray(providerConfig?.models) ? providerConfig.models : [];
	const normalizedModelId = require_model_selection_normalize.normalizeStaticProviderModelId(provider, modelId);
	const normalizedModelKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizedModelId);
	const providerPrefixedModelKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(`${provider}/${normalizedModelId}`);
	const configuredModel = configuredModels.find((model) => {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_model_selection_normalize.normalizeStaticProviderModelId(provider, model.id));
		return key === normalizedModelKey || key === providerPrefixedModelKey;
	});
	const bundledStaticModel = require_model_static_catalog.resolveBundledStaticCatalogModel({
		provider,
		modelId,
		cfg: params.cfg,
		workspaceDir
	});
	if (configuredModel) {
		const configuredApi = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configuredModel.api) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerConfig?.api) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bundledStaticModel?.api) ?? resolveConfiguredFallbackApi(providerConfig);
		const runtimeModel = applyProviderTransportNormalization({
			cfg: params.cfg,
			provider,
			workspaceDir,
			runtimeModel: {
				...bundledStaticModel,
				...configuredModel,
				id: configuredModel.id,
				name: configuredModel.name ?? bundledStaticModel?.name ?? configuredModel.id,
				provider,
				api: configuredApi,
				baseUrl: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configuredModel.baseUrl) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerConfig?.baseUrl) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bundledStaticModel?.baseUrl)
			}
		});
		return {
			modelApi: runtimeModel.api,
			runtimeModel
		};
	}
	if (!bundledStaticModel) return resolveDynamicRuntimeModelContext({
		cfg: params.cfg,
		agentDir: params.agentDir,
		workspaceDir,
		provider,
		modelId
	});
	const runtimeModel = applyProviderTransportNormalization({
		cfg: params.cfg,
		provider,
		workspaceDir,
		runtimeModel: {
			...bundledStaticModel,
			api: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerConfig?.api) ?? bundledStaticModel.api,
			baseUrl: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerConfig?.baseUrl) ?? bundledStaticModel.baseUrl
		}
	});
	return {
		modelApi: runtimeModel.api,
		runtimeModel
	};
}
/** Resolves compatibility metadata explicitly configured for a provider/model pair. */
function resolveConfiguredModelCompat(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.modelProvider ?? "");
	const modelId = params.modelId?.trim() ?? "";
	if (!provider || !modelId) return;
	const providerConfig = (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.cfg.models?.providers, provider);
	const models = Array.isArray(providerConfig?.models) ? providerConfig.models : [];
	if (models.length === 0) return;
	const normalizedModelId = require_model_selection_normalize.normalizeStaticProviderModelId(provider, modelId);
	const normalizedModelKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizedModelId);
	const providerPrefixedModelKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(`${provider}/${normalizedModelId}`);
	return require_agent_model_discovery.extractModelCompat(models.find((model) => {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_model_selection_normalize.normalizeStaticProviderModelId(provider, model.id));
		return key === normalizedModelKey || key === providerPrefixedModelKey;
	}));
}
/** Resolves the grouped effective tool inventory and user-visible filtering notices. */
function resolveEffectiveToolInventory(params) {
	const agentId = params.agentId?.trim() || require_agent_scope.resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: params.cfg
	});
	const workspaceDir = params.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId);
	const agentDir = params.agentDir ?? require_agent_scope_config.resolveAgentDir(params.cfg, agentId);
	const runtimeModelContext = params.modelApi || params.runtimeModel ? {
		modelApi: params.modelApi ?? params.runtimeModel?.api,
		runtimeModel: params.runtimeModel
	} : resolveEffectiveToolInventoryRuntimeModelContext({
		cfg: params.cfg,
		agentId,
		agentDir,
		workspaceDir,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	const modelCompat = resolveConfiguredModelCompat({
		cfg: params.cfg,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	const projectedInventory = require_tools_effective_inventory_build.buildRuntimeCompatibleToolInventory({
		tools: require_agent_tools.createOperatorCodingTools({
			agentId,
			sessionKey: params.sessionKey,
			workspaceDir,
			agentDir,
			config: params.cfg,
			modelProvider: params.modelProvider,
			modelId: params.modelId,
			modelApi: runtimeModelContext.modelApi,
			modelCompat,
			messageProvider: params.messageProvider,
			senderId: params.senderId,
			senderName: params.senderName ?? void 0,
			senderUsername: params.senderUsername ?? void 0,
			senderE164: params.senderE164 ?? void 0,
			agentAccountId: params.accountId ?? void 0,
			currentChannelId: params.currentChannelId,
			currentThreadTs: params.currentThreadTs,
			currentMessageId: params.currentMessageId,
			groupId: params.groupId ?? void 0,
			groupChannel: params.groupChannel ?? void 0,
			groupSpace: params.groupSpace ?? void 0,
			replyToMode: params.replyToMode,
			allowGatewaySubagentBinding: true,
			modelHasVision: params.modelHasVision,
			requireExplicitMessageTarget: params.requireExplicitMessageTarget,
			disableMessageTool: params.disableMessageTool
		}),
		cfg: params.cfg,
		workspaceDir,
		modelProvider: params.modelProvider,
		modelId: params.modelId,
		modelApi: runtimeModelContext.modelApi,
		runtimeModel: runtimeModelContext.runtimeModel
	});
	const effectivePolicy = require_agent_tools_policy.resolveEffectiveToolPolicy({
		config: params.cfg,
		agentId,
		sessionKey: params.sessionKey,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	const profile = effectivePolicy.providerProfile ?? effectivePolicy.profile ?? "full";
	const entries = projectedInventory.entries;
	const notices = [...projectedInventory.notices, ...buildToolInventoryNotices({
		cfg: params.cfg,
		profile,
		entries,
		effectivePolicy
	}) ?? []];
	return {
		agentId,
		profile,
		groups: buildEffectiveToolInventoryGroups(entries),
		...notices.length > 0 ? { notices } : {}
	};
}
//#endregion
Object.defineProperty(exports, "buildEffectiveToolInventoryGroups", {
	enumerable: true,
	get: function() {
		return buildEffectiveToolInventoryGroups;
	}
});
Object.defineProperty(exports, "resolveConfiguredModelCompat", {
	enumerable: true,
	get: function() {
		return resolveConfiguredModelCompat;
	}
});
Object.defineProperty(exports, "resolveEffectiveToolInventory", {
	enumerable: true,
	get: function() {
		return resolveEffectiveToolInventory;
	}
});
Object.defineProperty(exports, "resolveEffectiveToolInventoryRuntimeModelContext", {
	enumerable: true,
	get: function() {
		return resolveEffectiveToolInventoryRuntimeModelContext;
	}
});
