require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
require("./errors-BqS4bzom.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_reply_payloads = require("./reply-payloads-Bn46m3tA.cjs");
require("./config-DT0qiglW.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_conversation_capability_profile = require("./conversation-capability-profile-Cn8o5WHy.cjs");
const require_agent_bundle_mcp_runtime = require("./agent-bundle-mcp-runtime-bT8ElU5D.cjs");
const require_agent_bundle_mcp_tools = require("./agent-bundle-mcp-tools-e1AmWJ1L.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_node_plugin_tool_snapshot = require("./node-plugin-tool-snapshot-BlGFui81.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_session_model_ref = require("./session-model-ref-DUZbU68I.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_tools = require("./tools-cldx6uki.cjs");
const require_effective_tool_policy = require("./effective-tool-policy-Cfe5Df2e.cjs");
const require_tools_effective_inventory_build = require("./tools-effective-inventory-build-DoIwuwqv.cjs");
const require_tools_effective_inventory = require("./tools-effective-inventory-DYLGTcsW.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/agents/tools-effective-mcp-inventory.ts
const BUNDLE_MCP_PLUGIN_ID = "bundle-mcp";
function buildMcpUnsupportedToolSchemaNotice(diagnostic) {
	return {
		id: `unsupported-tool-schema:${diagnostic.toolName}`,
		severity: "warning",
		message: `Tool "${diagnostic.toolName}" from plugin "${BUNDLE_MCP_PLUGIN_ID}" has an unsupported runtime input schema (${diagnostic.violations.join(", ")}) and was quarantined before model projection. Fix or disable the owner, or remove the tool from active allowlists.`
	};
}
function buildMcpToolInventoryEntries(tools) {
	return require_tools_effective_inventory_build.disambiguateEffectiveToolLabels(tools.map((tool) => ({
		id: tool.name,
		label: require_tools_effective_inventory_build.resolveEffectiveToolLabel(tool),
		description: require_tools_effective_inventory_build.summarizeEffectiveToolDescription(tool),
		rawDescription: require_tools_effective_inventory_build.resolveEffectiveToolRawDescription(tool) || require_tools_effective_inventory_build.summarizeEffectiveToolDescription(tool),
		source: "mcp",
		pluginId: BUNDLE_MCP_PLUGIN_ID
	})).toSorted((a, b) => a.label.localeCompare(b.label)), (entry) => entry.pluginId ?? entry.id);
}
/** Builds the runtime-compatible MCP tool inventory and quarantine notices. */
function buildRuntimeCompatibleMcpToolInventory(params) {
	const preNormalizationProjection = require_tools.filterProviderNormalizableTools(params.tools);
	const preNormalizationDiagnostics = [...preNormalizationProjection.diagnostics];
	const projection = require_tools.filterRuntimeCompatibleTools(require_tools.normalizeAgentRuntimeTools({
		tools: [...preNormalizationProjection.tools],
		provider: params.modelProvider ?? "",
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		modelId: params.modelId,
		modelApi: params.modelApi ?? void 0,
		model: params.runtimeModel,
		allowProviderRuntimePluginLoad: false,
		onPreNormalizationSchemaDiagnostics: (diagnostics) => preNormalizationDiagnostics.push(...diagnostics)
	}));
	const diagnostics = [...preNormalizationDiagnostics, ...projection.diagnostics];
	return {
		entries: buildMcpToolInventoryEntries(projection.tools),
		notices: diagnostics.map(buildMcpUnsupportedToolSchemaNotice)
	};
}
//#endregion
//#region src/gateway/server-methods/tools-effective.ts
const TOOLS_EFFECTIVE_FRESH_TTL_MS = 1e4;
const TOOLS_EFFECTIVE_STALE_TTL_MS = 12e4;
const TOOLS_EFFECTIVE_SLOW_LOG_MS = 250;
const TOOLS_EFFECTIVE_CACHE_LIMIT = 128;
const MCP_CONFIG_SUMMARY_CACHE_LIMIT = 128;
let nowForToolsEffectiveCache = () => Date.now();
const toolsEffectiveCache = /* @__PURE__ */ new Map();
const toolsEffectiveInflight = /* @__PURE__ */ new Map();
const mcpConfigSummaryCache = /* @__PURE__ */ new Map();
function optionalCacheString(value) {
	return value?.trim() ?? "";
}
function buildToolsEffectiveCacheKey(params) {
	const context = params.context;
	return JSON.stringify({
		v: 1,
		config: context.runtimeConfigCacheKey,
		pluginRegistry: context.pluginRegistryVersion,
		channelRegistry: context.channelRegistryVersion,
		nodePluginTools: context.nodePluginToolsVersion,
		sessionKey: params.sessionKey,
		workspaceDir: optionalCacheString(context.workspaceDir),
		agentId: context.agentId,
		modelProvider: optionalCacheString(context.modelProvider),
		modelId: optionalCacheString(context.modelId),
		messageProvider: optionalCacheString(context.messageProvider),
		accountId: optionalCacheString(context.accountId),
		currentChannelId: optionalCacheString(context.currentChannelId),
		currentThreadTs: optionalCacheString(context.currentThreadTs),
		groupId: optionalCacheString(context.groupId),
		groupChannel: optionalCacheString(context.groupChannel),
		groupSpace: optionalCacheString(context.groupSpace),
		replyToMode: optionalCacheString(context.replyToMode)
	});
}
function trimToolsEffectiveCache() {
	while (toolsEffectiveCache.size > TOOLS_EFFECTIVE_CACHE_LIMIT) {
		const oldest = toolsEffectiveCache.keys().next().value;
		if (typeof oldest !== "string") return;
		toolsEffectiveCache.delete(oldest);
	}
}
function buildMcpConfigSummaryCacheKey(params) {
	return JSON.stringify({
		v: 1,
		config: params.context.runtimeConfigCacheKey,
		pluginRegistry: params.context.pluginRegistryVersion,
		workspaceDir: params.workspaceDir
	});
}
function trimMcpConfigSummaryCache() {
	while (mcpConfigSummaryCache.size > MCP_CONFIG_SUMMARY_CACHE_LIMIT) {
		const oldest = mcpConfigSummaryCache.keys().next().value;
		if (typeof oldest !== "string") return;
		mcpConfigSummaryCache.delete(oldest);
	}
}
function resolveCachedSessionMcpConfigSummary(params) {
	const key = buildMcpConfigSummaryCacheKey(params);
	const cached = mcpConfigSummaryCache.get(key);
	if (cached) return cached;
	const summary = require_agent_bundle_mcp_runtime.resolveSessionMcpConfigSummary({
		workspaceDir: params.workspaceDir,
		cfg: params.context.cfg
	});
	mcpConfigSummaryCache.set(key, summary);
	trimMcpConfigSummaryCache();
	return summary;
}
function cacheToolsEffectiveResult(key, value) {
	toolsEffectiveCache.delete(key);
	toolsEffectiveCache.set(key, {
		value,
		createdAtMs: nowForToolsEffectiveCache()
	});
	trimToolsEffectiveCache();
}
function scheduleBaseToolsEffectiveRefresh(key, context) {
	const existing = toolsEffectiveInflight.get(key);
	if (existing) return existing;
	const startedAt = nowForToolsEffectiveCache();
	const task = new Promise((resolve, reject) => {
		setImmediate(() => {
			try {
				const value = resolveBaseToolsEffectiveInventory(context);
				cacheToolsEffectiveResult(key, value);
				const durationMs = nowForToolsEffectiveCache() - startedAt;
				if (durationMs >= TOOLS_EFFECTIVE_SLOW_LOG_MS) require_logger.logDebug(`tools-effective: refresh durationMs=${durationMs} agent=${context.agentId} session=${context.sessionKey} tools=${value.groups.reduce((sum, group) => sum + group.tools.length, 0)}`);
				resolve(value);
			} catch (err) {
				reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(err, "Non-Error rejection"));
			} finally {
				toolsEffectiveInflight.delete(key);
			}
		});
	});
	toolsEffectiveInflight.set(key, task);
	return task;
}
function refreshBaseToolsEffectiveInBackground(key, context) {
	scheduleBaseToolsEffectiveRefresh(key, context).catch((err) => {
		require_logger.logWarn(`tools-effective: background refresh failed: ${String(err)}`);
	});
}
async function resolveCachedBaseToolsEffective(params) {
	const key = buildToolsEffectiveCacheKey(params);
	const now = nowForToolsEffectiveCache();
	const cached = toolsEffectiveCache.get(key);
	if (cached) {
		const ageMs = now - cached.createdAtMs;
		if (ageMs < TOOLS_EFFECTIVE_FRESH_TTL_MS) return cached.value;
		if (ageMs < TOOLS_EFFECTIVE_STALE_TTL_MS) {
			refreshBaseToolsEffectiveInBackground(key, params.context);
			return cached.value;
		}
	}
	return scheduleBaseToolsEffectiveRefresh(key, params.context);
}
function resolveRequestedAgentIdOrRespondError(params) {
	const knownAgents = require_agent_scope_config.listAgentIds(params.cfg);
	const requestedAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.rawAgentId) ?? "";
	if (!requestedAgentId) return;
	if (!knownAgents.includes(requestedAgentId)) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown agent id "${requestedAgentId}"`));
		return null;
	}
	return requestedAgentId;
}
function appendMcpInventoryGroups(params) {
	const mcpEntries = params.mcpInventory.entries.filter((entry) => entry.source === "mcp");
	const notices = [...params.base.notices ?? [], ...params.mcpInventory.notices];
	const base = notices.length > 0 ? {
		...params.base,
		notices
	} : params.base;
	if (mcpEntries.length === 0) return base;
	const mcpGroups = require_tools_effective_inventory.buildEffectiveToolInventoryGroups(mcpEntries);
	return {
		...base,
		groups: [...base.groups, ...mcpGroups]
	};
}
function appendToolInventoryNotice(base, notice) {
	return {
		...base,
		notices: [...base.notices ?? [], notice]
	};
}
function formatMcpServerNames(names) {
	if (names.length === 0) return "configured MCP servers";
	const visible = names.slice(0, 3).map((name) => `"${name}"`).join(", ");
	return names.length > 3 ? `${visible}, and ${names.length - 3} more MCP servers` : visible;
}
function mcpDiscoveryNotice(mcpServerNames, reason) {
	if (mcpServerNames.length === 0) return;
	const servers = formatMcpServerNames(mcpServerNames);
	switch (reason) {
		case "stale-config": return {
			id: "mcp-stale-catalog",
			severity: "info",
			message: `MCP servers ${servers} changed since the current runtime catalog was discovered. MCP tools will appear here after the next agent run discovers them.`
		};
		case "not-listed": return {
			id: "mcp-not-yet-listed",
			severity: "info",
			message: `MCP servers ${servers} are connected but have not finished listing tools yet. MCP tools will appear here after the session discovers them.`
		};
		case "not-connected": return {
			id: "mcp-not-yet-connected",
			severity: "info",
			message: `MCP servers ${servers} are configured but not connected for this session yet. MCP tools will appear here after an agent run discovers them.`
		};
		default: return;
	}
}
function maybeAppendMcpNotice(base, mcpServerNames, reason) {
	const notice = mcpDiscoveryNotice(mcpServerNames, reason);
	return notice ? appendToolInventoryNotice(base, notice) : base;
}
function resolveBaseToolsEffectiveInventory(context) {
	const agentDir = require_agent_scope_config.resolveAgentDir(context.cfg, context.agentId);
	const runtimeModelContext = require_tools_effective_inventory.resolveEffectiveToolInventoryRuntimeModelContext({
		cfg: context.cfg,
		agentId: context.agentId,
		agentDir,
		workspaceDir: context.workspaceDir,
		modelProvider: context.modelProvider,
		modelId: context.modelId
	});
	return require_tools_effective_inventory.resolveEffectiveToolInventory({
		cfg: context.cfg,
		agentId: context.agentId,
		agentDir,
		sessionKey: context.sessionKey,
		workspaceDir: context.workspaceDir,
		messageProvider: context.messageProvider,
		modelProvider: context.modelProvider,
		modelId: context.modelId,
		modelApi: runtimeModelContext.modelApi,
		runtimeModel: runtimeModelContext.runtimeModel,
		currentChannelId: context.currentChannelId,
		currentThreadTs: context.currentThreadTs,
		accountId: context.accountId,
		groupId: context.groupId,
		groupChannel: context.groupChannel,
		groupSpace: context.groupSpace,
		replyToMode: context.replyToMode
	});
}
function filterMcpTools(params) {
	return require_effective_tool_policy.applyFinalEffectiveToolPolicy({
		bundledTools: params.mcpTools,
		config: params.context.cfg,
		conversationCapabilityProfile: require_conversation_capability_profile.resolveConversationCapabilityProfile({
			config: params.context.cfg,
			sessionKey: params.context.sessionKey,
			agentId: params.context.agentId,
			modelProvider: params.context.modelProvider,
			modelId: params.context.modelId,
			messageProvider: params.context.messageProvider,
			agentAccountId: params.context.accountId,
			groupId: params.context.groupId,
			groupChannel: params.context.groupChannel,
			groupSpace: params.context.groupSpace,
			spawnedBy: params.context.spawnedBy
		}),
		warn: require_logger.logWarn
	});
}
async function resolveReadOnlyToolsEffectiveInventory(context) {
	const base = await resolveCachedBaseToolsEffective({
		sessionKey: context.sessionKey,
		context
	});
	const runtime = require_agent_bundle_mcp_runtime.peekSessionMcpRuntime({
		sessionId: context.sessionId,
		sessionKey: context.sessionKey
	});
	const mcpConfig = resolveCachedSessionMcpConfigSummary({
		context,
		workspaceDir: runtime?.workspaceDir ?? context.workspaceDir
	});
	if (mcpConfig.serverNames.length === 0) return base;
	if (!runtime) return maybeAppendMcpNotice(base, mcpConfig.serverNames, "not-connected");
	if (runtime.configFingerprint !== mcpConfig.fingerprint) return maybeAppendMcpNotice(base, mcpConfig.serverNames, "stale-config");
	const catalog = runtime.peekCatalog();
	if (!catalog) return maybeAppendMcpNotice(base, mcpConfig.serverNames, "not-listed");
	const filteredMcpTools = filterMcpTools({
		context,
		mcpTools: require_agent_bundle_mcp_tools.buildBundleMcpToolsFromCatalog({
			catalog,
			reservedToolNames: base.groups.flatMap((group) => group.tools.map((tool) => tool.id))
		})
	});
	const agentDir = require_agent_scope_config.resolveAgentDir(context.cfg, context.agentId);
	const runtimeModelContext = require_tools_effective_inventory.resolveEffectiveToolInventoryRuntimeModelContext({
		cfg: context.cfg,
		agentId: context.agentId,
		agentDir,
		workspaceDir: runtime.workspaceDir,
		modelProvider: context.modelProvider,
		modelId: context.modelId
	});
	return appendMcpInventoryGroups({
		base,
		mcpInventory: buildRuntimeCompatibleMcpToolInventory({
			tools: filteredMcpTools,
			cfg: context.cfg,
			workspaceDir: runtime.workspaceDir,
			modelProvider: context.modelProvider,
			modelId: context.modelId,
			modelApi: runtimeModelContext.modelApi,
			runtimeModel: runtimeModelContext.runtimeModel
		})
	});
}
function resolveTrustedToolsEffectiveContext(params) {
	const loaded = require_session_utils.loadSessionEntry(params.sessionKey, params.requestedAgentId ? { agentId: params.requestedAgentId } : void 0);
	if (!loaded.entry) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown session key "${params.sessionKey}"`));
		return null;
	}
	const canonicalKey = loaded.canonicalKey ?? params.sessionKey;
	const allowRequestedAgentOverride = canonicalKey === "global" && Boolean(params.requestedAgentId);
	const sessionAgentId = require_agent_scope.resolveSessionAgentId({
		sessionKey: canonicalKey,
		config: loaded.cfg,
		...allowRequestedAgentOverride ? { agentId: params.requestedAgentId } : {}
	});
	if (params.requestedAgentId && params.requestedAgentId !== sessionAgentId) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `agent id "${params.requestedAgentId}" does not match session agent "${sessionAgentId}"`));
		return null;
	}
	const delivery = require_delivery_context_shared.deliveryContextFromSession(loaded.entry);
	const resolvedModel = require_session_model_ref.resolveSessionModelRef(loaded.cfg, loaded.entry, sessionAgentId);
	const workspaceDir = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(loaded.entry.spawnedWorkspaceDir) ?? require_agent_scope_config.resolveAgentWorkspaceDir(loaded.cfg, sessionAgentId);
	const runtimeConfigCacheKey = require_runtime_snapshot.resolveRuntimeConfigCacheKey(loaded.cfg);
	const pluginRegistryVersion = require_runtime.getActivePluginRegistryVersion();
	const channelRegistryVersion = require_runtime.getActivePluginChannelRegistryVersion();
	const nodePluginToolsVersion = require_node_plugin_tool_snapshot.getConnectedNodePluginToolsVersion();
	return {
		cfg: loaded.cfg,
		agentId: sessionAgentId,
		sessionKey: params.sessionKey,
		sessionId: loaded.entry.sessionId,
		workspaceDir,
		runtimeConfigCacheKey,
		pluginRegistryVersion,
		channelRegistryVersion,
		nodePluginToolsVersion,
		modelProvider: resolvedModel.provider,
		modelId: resolvedModel.model,
		messageProvider: delivery?.channel ?? loaded.entry.lastChannel ?? loaded.entry.channel ?? loaded.entry.origin?.provider,
		accountId: delivery?.accountId ?? loaded.entry.lastAccountId ?? loaded.entry.origin?.accountId,
		currentChannelId: delivery?.to,
		currentThreadTs: delivery?.threadId != null ? require_channel_route.stringifyRouteThreadId(delivery.threadId) : loaded.entry.lastThreadId != null ? require_channel_route.stringifyRouteThreadId(loaded.entry.lastThreadId) : loaded.entry.origin?.threadId != null ? require_channel_route.stringifyRouteThreadId(loaded.entry.origin.threadId) : void 0,
		groupId: loaded.entry.groupId,
		groupChannel: loaded.entry.groupChannel,
		groupSpace: loaded.entry.space,
		spawnedBy: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(loaded.entry.spawnedBy),
		replyToMode: require_reply_payloads.resolveReplyToMode(loaded.cfg, delivery?.channel ?? loaded.entry.lastChannel ?? loaded.entry.channel ?? loaded.entry.origin?.provider, delivery?.accountId ?? loaded.entry.lastAccountId ?? loaded.entry.origin?.accountId, loaded.entry.chatType ?? loaded.entry.origin?.chatType)
	};
}
async function handleToolsEffectiveRequest(params) {
	if (!require_src.validateToolsEffectiveParams(params.rawParams)) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid tools.effective params: ${require_validation_errors.formatValidationErrors(require_src.validateToolsEffectiveParams.errors)}`));
		return;
	}
	const cfg = params.context.getRuntimeConfig();
	const requestedAgentId = resolveRequestedAgentIdOrRespondError({
		rawAgentId: params.rawParams.agentId,
		cfg,
		respond: params.respond
	});
	if (requestedAgentId === null) return;
	const trustedContext = resolveTrustedToolsEffectiveContext({
		sessionKey: params.rawParams.sessionKey,
		requestedAgentId,
		respond: params.respond
	});
	if (!trustedContext) return;
	try {
		params.respond(true, await resolveReadOnlyToolsEffectiveInventory(trustedContext), void 0);
	} catch (err) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `tools.effective failed: ${String(err)}`));
	}
}
const toolsEffectiveHandlers = { "tools.effective": async ({ params, respond, context }) => {
	await handleToolsEffectiveRequest({
		rawParams: params,
		respond,
		context
	});
} };
const testing = {
	resetToolsEffectiveCacheForTest() {
		toolsEffectiveCache.clear();
		toolsEffectiveInflight.clear();
		mcpConfigSummaryCache.clear();
	},
	setToolsEffectiveNowForTest(now) {
		nowForToolsEffectiveCache = now;
	},
	resetToolsEffectiveNowForTest() {
		nowForToolsEffectiveCache = () => Date.now();
	}
};
//#endregion
exports.__testing = testing;
exports.testing = testing;
exports.toolsEffectiveHandlers = toolsEffectiveHandlers;
