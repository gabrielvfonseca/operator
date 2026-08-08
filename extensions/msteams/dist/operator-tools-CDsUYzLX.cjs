const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_hook_helpers = require("./hook-helpers-B7eHTW1w.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
require("./config-DT0qiglW.cjs");
require("./model-selection-normalize-BrB-lt0o.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_workspace_dir = require("./workspace-dir-b3xUIeYD.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_conversation_read_origin = require("./conversation-read-origin-C-xn-esF.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_oauth = require("./oauth-D9-_YxyQ.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_exec_policy = require("./exec-policy-BFFO-cIX.cjs");
const require_bash_tools_descriptions = require("./bash-tools.descriptions-D_tiUDlt.cjs");
const require_bash_tools_schemas = require("./bash-tools.schemas-DAU-eSdE.cjs");
const require_exec_command_highlighting = require("./exec-command-highlighting-z7b1V51Q.cjs");
const require_exec_safe_bin_runtime_policy = require("./exec-safe-bin-runtime-policy-D6AnTOUD.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
require("./delivery-context-ywYGmcjO.cjs");
const require_runtime_web_tools_state = require("./runtime-web-tools-state-DbJISCDm.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
const require_transcripts_tool = require("./transcripts-tool-CLY1XDWH.cjs");
const require_tool_loop_detection_config = require("./tool-loop-detection-config-c-3qUtKe.cjs");
require("./agent-id-nux9kTGp.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let typebox = require("typebox");
//#region src/agents/agent-tools.message-provider-policy.ts
/**
* Message-provider tool filtering.
* Channels can restrict tool names after runtime assembly when the active
* transport cannot safely render or execute a class of tools.
*/
const TOOL_DENY_BY_MESSAGE_PROVIDER = {
	"discord-voice": ["tts"],
	voice: ["tts"]
};
const TOOL_ALLOW_BY_MESSAGE_PROVIDER = { node: [
	"canvas",
	"image",
	"pdf",
	"tts",
	"web_fetch",
	"web_search"
] };
/** Applies message-provider filtering while preserving duplicate tool entries. */
function filterToolsByMessageProvider(tools, messageProvider) {
	const normalizedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(messageProvider);
	if (!normalizedProvider) return [...tools];
	const allowedTools = TOOL_ALLOW_BY_MESSAGE_PROVIDER[normalizedProvider];
	if (allowedTools && allowedTools.length > 0) {
		const allowedSet = new Set(allowedTools);
		return tools.filter((tool) => allowedSet.has(tool.name));
	}
	const deniedTools = TOOL_DENY_BY_MESSAGE_PROVIDER[normalizedProvider];
	if (!deniedTools || deniedTools.length === 0) return [...tools];
	const deniedSet = new Set(deniedTools);
	return tools.filter((tool) => !deniedSet.has(tool.name));
}
//#endregion
//#region src/agents/lazy-exec-tool.ts
const bashToolsModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./bash-tools-C75sROer.cjs")).then((n) => n.bash_tools_exports));
/** Build the exec tool lazily so non-shell agent surfaces avoid loading bash runtime code. */
function createLazyExecTool(defaults, presentation) {
	let loadedTool;
	const loadTool = async () => {
		if (!loadedTool) {
			const { createExecTool } = await bashToolsModuleLoader.load();
			loadedTool = createExecTool(defaults);
		}
		return loadedTool;
	};
	return {
		name: "exec",
		label: "exec",
		displaySummary: presentation?.displaySummary ?? "Run shell now.",
		get description() {
			return presentation?.description ?? require_bash_tools_descriptions.describeExecTool({
				agentId: defaults?.agentId,
				hasCronTool: defaults?.hasCronTool === true
			});
		},
		parameters: presentation?.parameters ?? require_bash_tools_schemas.execSchema,
		prepareBeforeToolCallParams: async (...args) => (await loadTool()).prepareBeforeToolCallParams?.(...args) ?? args[0],
		finalizeBeforeToolCallParams: (params, preparedParams) => loadedTool?.finalizeBeforeToolCallParams?.(params, preparedParams) ?? params,
		execute: async (...args) => (await loadTool()).execute(...args)
	};
}
/** Resolve global and per-agent exec defaults before runtime-only overrides. */
function resolveExecToolConfig(params) {
	const cfg = params.cfg;
	const globalExec = cfg?.tools?.exec;
	const agentExec = cfg && params.agentId ? require_agent_scope_config.resolveAgentConfig(cfg, params.agentId)?.tools?.exec : void 0;
	const layeredPolicy = require_exec_policy.applyExecPolicyLayer(require_exec_policy.applyExecPolicyLayer({}, globalExec), agentExec);
	return {
		host: agentExec?.host ?? globalExec?.host,
		mode: layeredPolicy.mode,
		security: layeredPolicy.security,
		ask: layeredPolicy.ask,
		node: agentExec?.node ?? globalExec?.node,
		pathPrepend: agentExec?.pathPrepend ?? globalExec?.pathPrepend,
		safeBins: agentExec?.safeBins ?? globalExec?.safeBins,
		strictInlineEval: agentExec?.strictInlineEval ?? globalExec?.strictInlineEval,
		commandHighlighting: require_exec_command_highlighting.resolveExecCommandHighlighting({
			config: cfg,
			agentId: params.agentId
		}),
		safeBinTrustedDirs: agentExec?.safeBinTrustedDirs ?? globalExec?.safeBinTrustedDirs,
		safeBinProfiles: require_exec_safe_bin_runtime_policy.resolveMergedSafeBinProfileFixtures({
			global: globalExec,
			local: agentExec
		}),
		reviewer: agentExec?.reviewer ?? globalExec?.reviewer,
		backgroundMs: agentExec?.backgroundMs ?? globalExec?.backgroundMs,
		timeoutSec: agentExec?.timeoutSec ?? globalExec?.timeoutSec,
		approvalRunningNoticeMs: agentExec?.approvalRunningNoticeMs ?? globalExec?.approvalRunningNoticeMs,
		cleanupMs: agentExec?.cleanupMs ?? globalExec?.cleanupMs,
		notifyOnExit: agentExec?.notifyOnExit ?? globalExec?.notifyOnExit,
		notifyOnExitEmptySuccess: agentExec?.notifyOnExitEmptySuccess ?? globalExec?.notifyOnExitEmptySuccess,
		applyPatch: agentExec?.applyPatch ?? globalExec?.applyPatch
	};
}
//#endregion
//#region src/agents/openclaw-tools.plugin-context.ts
/** Resolves plugin-tool context inputs from runtime options and config state. */
function resolveOperatorPluginToolInputs(params) {
	const { options, resolvedConfig, runtimeConfig, getRuntimeConfig } = params;
	const { sessionAgentId } = require_agent_scope.resolveSessionAgentIds({
		sessionKey: options?.agentSessionKey,
		config: resolvedConfig,
		agentId: options?.requesterAgentIdOverride
	});
	const inferredWorkspaceDir = options?.workspaceDir || !resolvedConfig ? void 0 : require_agent_scope_config.resolveAgentWorkspaceDir(resolvedConfig, sessionAgentId);
	const workspaceDir = require_workspace_dir.resolveWorkspaceRoot(options?.workspaceDir ?? inferredWorkspaceDir);
	const modelProvider = options?.modelProvider?.trim();
	const modelId = options?.modelId?.trim();
	const activeModel = modelProvider || modelId ? {
		...modelProvider ? { provider: modelProvider } : {},
		...modelId ? { modelId } : {},
		...modelProvider && modelId ? { modelRef: require_model_input.modelKey(modelProvider, modelId) } : {}
	} : void 0;
	const deliveryContext = require_delivery_context_shared.normalizeDeliveryContext({
		channel: options?.agentChannel,
		to: options?.agentTo ?? options?.currentMessagingTarget ?? options?.currentChannelId,
		accountId: options?.agentAccountId,
		threadId: options?.agentThreadId
	});
	return {
		context: {
			config: options?.config,
			runtimeConfig,
			getRuntimeConfig,
			fsPolicy: options?.fsPolicy,
			workspaceDir,
			agentDir: options?.agentDir,
			agentId: sessionAgentId,
			sessionKey: options?.agentSessionKey,
			sessionId: options?.sessionId,
			activeModel,
			browser: {
				sandboxBridgeUrl: options?.sandboxBrowserBridgeUrl,
				allowHostControl: options?.allowHostBrowserControl
			},
			messageChannel: options?.agentChannel,
			agentAccountId: options?.agentAccountId,
			deliveryContext,
			nativeChannelId: options?.nativeChannelId,
			requesterSenderId: options?.requesterSenderId ?? void 0,
			senderIsOwner: options?.senderIsOwner,
			conversationReadOrigin: require_conversation_read_origin.normalizeConversationReadInvocationOrigin(options?.conversationReadOrigin),
			sandboxed: options?.sandboxed,
			oneShotCliRun: options?.oneShotCliRun
		},
		allowGatewaySubagentBinding: options?.allowGatewaySubagentBinding
	};
}
//#endregion
//#region src/agents/openclaw-plugin-tools.ts
/** Resolves plugin tools for an agent run and applies delivery-context defaults. */
function resolveOperatorPluginToolsForOptions(params) {
	if (params.options?.disablePluginTools) return [];
	const resolveCurrentRuntimeConfig = () => {
		return require_web_tools.resolveAgentRuntimeToolConfig(params.resolvedConfig ?? params.options?.config);
	};
	const authProfileStore = params.options?.authProfileStore;
	const resolveAuthProfileIdsForProvider = authProfileStore ? (providerId) => require_order.resolveAuthProfileOrder({
		cfg: resolveCurrentRuntimeConfig(),
		store: authProfileStore,
		provider: providerId
	}) : void 0;
	const hasAuthForProvider = authProfileStore ? (providerId) => (resolveAuthProfileIdsForProvider?.(providerId) ?? []).length > 0 : void 0;
	const resolveApiKeyForProvider = authProfileStore ? async (providerId) => {
		for (const profileId of resolveAuthProfileIdsForProvider?.(providerId) ?? []) {
			const resolved = await require_oauth.resolveApiKeyForProfile({
				cfg: resolveCurrentRuntimeConfig(),
				store: authProfileStore,
				profileId,
				agentDir: params.options?.agentDir
			});
			if (resolved?.apiKey) return resolved.apiKey;
		}
	} : void 0;
	const pluginToolInputs = resolveOperatorPluginToolInputs({
		options: params.options,
		resolvedConfig: params.resolvedConfig,
		runtimeConfig: resolveCurrentRuntimeConfig(),
		getRuntimeConfig: resolveCurrentRuntimeConfig
	});
	const existingToolNames = new Set(params.existingToolNames ?? []);
	const pluginTools = require_tools.resolvePluginTools({
		...pluginToolInputs,
		context: {
			...pluginToolInputs.context,
			...hasAuthForProvider ? { hasAuthForProvider } : {},
			...resolveApiKeyForProvider ? { resolveApiKeyForProvider } : {}
		},
		existingToolNames,
		toolAllowlist: params.options?.pluginToolAllowlist,
		toolDenylist: params.options?.pluginToolDenylist,
		allowGatewaySubagentBinding: params.options?.allowGatewaySubagentBinding,
		...hasAuthForProvider ? { hasAuthForProvider } : {}
	});
	for (const tool of pluginTools) existingToolNames.add(tool.name);
	pluginTools.push(...require_web_tools.createNodePluginTools({
		existingToolNames,
		toolAllowlist: params.options?.pluginToolAllowlist,
		toolDenylist: params.options?.pluginToolDenylist,
		agentSessionKey: params.options?.agentSessionKey
	}));
	return require_web_tools.applyPluginToolDeliveryDefaults({
		tools: pluginTools,
		deliveryContext: pluginToolInputs.context.deliveryContext
	});
}
//#endregion
//#region src/agents/openclaw-tools.media-factory-plan.ts
/**
* Optional media tool factory planner.
*
* Combines config, tool policy, plugin capability metadata, and auth-profile availability before tool construction.
*/
function coerceFactoryToolModelConfig(model) {
	const primary = require_model_input.resolveAgentModelPrimaryValue(model);
	const fallbacks = require_model_input.resolveAgentModelFallbackValues(model);
	return {
		...primary?.trim() ? { primary: primary.trim() } : {},
		...fallbacks.length > 0 ? { fallbacks } : {}
	};
}
function hasToolModelConfig(model) {
	return Boolean(model?.primary?.trim() || (model?.fallbacks ?? []).some((entry) => entry.trim().length > 0));
}
function hasExplicitToolModelConfig(modelConfig) {
	return hasToolModelConfig(coerceFactoryToolModelConfig(modelConfig));
}
function hasExplicitImageModelConfig(config) {
	return hasExplicitToolModelConfig(config?.agents?.defaults?.imageModel);
}
function hasExplicitPdfModelConfig(config) {
	return hasExplicitToolModelConfig(config?.agents?.defaults?.pdfModel) || hasExplicitImageModelConfig(config);
}
function isToolAllowedByFactoryPolicy(params) {
	return require_tool_policy_match.isToolAllowedByPolicyName(params.toolName, {
		allow: params.allowlist,
		deny: params.denylist
	});
}
/** Returns true only when an allowlist explicitly enables the requested tool. */
function isToolExplicitlyAllowedByFactoryPolicy(params) {
	if (!params.allowlist?.some((entry) => typeof entry === "string" && entry.trim().length > 0)) return false;
	return isToolAllowedByFactoryPolicy(params);
}
/** Merges factory policy lists while preserving stable unique entries. */
function mergeFactoryPolicyList(...lists) {
	const merged = lists.flatMap((list) => Array.isArray(list) ? list : []);
	return merged.length > 0 ? (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(merged) : void 0;
}
function mergeBuiltInFactoryAllowlist(...lists) {
	const allowlist = mergeFactoryPolicyList(...lists);
	if (!allowlist?.some((entry) => typeof entry === "string" && entry.trim() === "__operator_default_plugin_tools__")) return allowlist;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(["*", ...allowlist.filter((entry) => typeof entry !== "string" || entry.trim() !== "__operator_default_plugin_tools__")]);
}
/** Returns whether the image understanding tool can be constructed for this agent context. */
function resolveImageToolFactoryAvailable(params) {
	if (!params.agentDir?.trim()) return false;
	if (params.modelHasVision || hasExplicitImageModelConfig(params.config)) return true;
	const snapshot = require_web_tools.loadCapabilityMetadataSnapshot({
		config: params.config,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	});
	return require_web_tools.hasSnapshotCapabilityAvailability({
		snapshot,
		authStore: params.authStore,
		key: "mediaUnderstandingProviders",
		config: params.config
	}) || hasConfiguredVisionModelAuthSignal({
		config: params.config,
		snapshot,
		authStore: params.authStore
	});
}
function hasConfiguredVisionModelAuthSignal(params) {
	const providers = params.config?.models?.providers;
	if (!providers || typeof providers !== "object") return false;
	for (const [providerId, providerConfig] of Object.entries(providers)) {
		if (!providerConfig?.models?.some((model) => Array.isArray(model?.input) && model.input.includes("image"))) continue;
		if (params.authStore && require_profile_list.listProfilesForProvider(params.authStore, providerId).length > 0) return true;
		if (require_web_tools.hasSnapshotProviderEnvAvailability({
			snapshot: params.snapshot,
			providerId,
			config: params.config
		})) return true;
	}
	return false;
}
/** Resolves which optional media tools should be created for the current tool factory call. */
function resolveOptionalMediaToolFactoryPlan(params) {
	const defaults = params.config?.agents?.defaults;
	const toolAllowlist = mergeBuiltInFactoryAllowlist(params.config?.tools?.allow, params.toolAllowlist);
	const toolDenylist = mergeFactoryPolicyList(params.config?.tools?.deny, params.toolDenylist);
	const allowImageGenerate = isToolAllowedByFactoryPolicy({
		toolName: "image_generate",
		allowlist: toolAllowlist,
		denylist: toolDenylist
	});
	const allowVideoGenerate = isToolAllowedByFactoryPolicy({
		toolName: "video_generate",
		allowlist: toolAllowlist,
		denylist: toolDenylist
	});
	const allowMusicGenerate = isToolAllowedByFactoryPolicy({
		toolName: "music_generate",
		allowlist: toolAllowlist,
		denylist: toolDenylist
	});
	const allowPdf = isToolAllowedByFactoryPolicy({
		toolName: "pdf",
		allowlist: toolAllowlist,
		denylist: toolDenylist
	});
	const explicitImageGeneration = hasExplicitToolModelConfig(defaults?.imageGenerationModel);
	const explicitVideoGeneration = hasExplicitToolModelConfig(defaults?.videoGenerationModel);
	const explicitMusicGeneration = hasExplicitToolModelConfig(defaults?.musicGenerationModel);
	const explicitPdf = hasExplicitPdfModelConfig(params.config);
	if (params.config?.plugins?.enabled === false) return {
		imageGenerate: false,
		videoGenerate: false,
		musicGenerate: false,
		pdf: false
	};
	const snapshot = require_web_tools.loadCapabilityMetadataSnapshot({
		config: params.config,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	});
	return {
		imageGenerate: allowImageGenerate && (explicitImageGeneration || require_web_tools.hasSnapshotCapabilityAvailability({
			snapshot,
			authStore: params.authStore,
			key: "imageGenerationProviders",
			config: params.config
		})),
		videoGenerate: allowVideoGenerate && (explicitVideoGeneration || require_web_tools.hasSnapshotCapabilityAvailability({
			snapshot,
			authStore: params.authStore,
			key: "videoGenerationProviders",
			config: params.config
		})),
		musicGenerate: allowMusicGenerate && (explicitMusicGeneration || require_web_tools.hasSnapshotCapabilityAvailability({
			snapshot,
			authStore: params.authStore,
			key: "musicGenerationProviders",
			config: params.config
		})),
		pdf: allowPdf && (explicitPdf || require_web_tools.hasSnapshotCapabilityAvailability({
			snapshot,
			authStore: params.authStore,
			key: "mediaUnderstandingProviders",
			config: params.config
		}) || hasConfiguredVisionModelAuthSignal({
			config: params.config,
			snapshot,
			authStore: params.authStore
		}))
	};
}
//#endregion
//#region src/agents/openclaw-tools.nodes-workspace-guard.ts
/**
* Workspace guard adapter for the nodes tool.
*
* Applies the shared output-path guard only when filesystem policy requires workspace-only writes.
*/
/** Wraps the nodes tool with a workspace-only output-path guard when policy requires it. */
function applyNodesToolWorkspaceGuard(nodesToolBase, options) {
	if (options.fsPolicy?.workspaceOnly !== true) return nodesToolBase;
	return require_web_tools.wrapToolWorkspaceRootGuardWithOptions(nodesToolBase, options.sandboxRoot ?? options.workspaceDir, {
		containerWorkdir: options.sandboxContainerWorkdir,
		normalizeGuardedPathParams: true,
		pathParamKeys: ["outPath"]
	});
}
//#endregion
//#region src/agents/openclaw-tools.registration.ts
/**
* Operator-owned tool registration filters.
*
* Keeps optional tool gating separate from tool construction so config and execution contracts decide exposure.
*/
/**
* Registration helpers for optional Operator-owned tools.
*
* This keeps model/runtime gating separate from tool construction so callers can
* assemble candidate tools first, then filter by config and execution contract.
*/
/** Drops disabled optional tools while preserving candidate order. */
function collectPresentOperatorTools(candidates) {
	return candidates.filter((tool) => tool !== null && tool !== void 0);
}
/** Resolves the default-on update_plan switch with an explicit kill switch. */
function isUpdatePlanToolEnabledForOperatorTools(params) {
	return params.config?.tools?.experimental?.planTool !== false;
}
/** Decides whether update_plan should be included in the assembled Operator tool set. */
function shouldIncludeUpdatePlanToolForOperatorTools(params) {
	const deny = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...params.config?.tools?.deny ?? [], ...params.pluginToolDenylist ?? []]);
	return isUpdatePlanToolEnabledForOperatorTools(params) && require_tool_policy_match.isToolAllowedByPolicyName("update_plan", { deny });
}
//#endregion
//#region src/agents/tools/openclaw-delegate-tool.ts
/** Thin regular-agent client for the Operator system agent. */
const OperatorDelegateSchema = typebox.Type.Object({
	message: typebox.Type.String({ description: "What system must do." }),
	sessionId: typebox.Type.Optional(typebox.Type.String({ description: "Continue prior Operator talk." }))
});
function stableDelegationSessionId(sessionKey) {
	return sessionKey?.trim() ? `delegate-${(0, node_crypto.createHash)("sha256").update(sessionKey.trim()).digest("hex").slice(0, 32)}` : `delegate-${(0, node_crypto.randomUUID)()}`;
}
function createOperatorDelegateTool(options) {
	const defaultSessionId = stableDelegationSessionId(options?.agentSessionKey);
	return {
		name: "@gabrielvfonseca/operator",
		label: "Operator",
		description: "Ask system expert. Config, channels, plugins, agents, models/providers, updates. Writes need human approval.",
		parameters: OperatorDelegateSchema,
		execute: async (_toolCallId, args) => {
			const params = args ?? {};
			const message = require_common.readStringParam(params, "message", { required: true });
			const sessionId = require_common.readStringParam(params, "sessionId") ?? defaultSessionId;
			const result = await (options?.callGateway ?? require_web_tools.callInProcessGatewayTool)("operator.chat", {
				sessionId,
				message,
				delegation: {
					...options?.requesterAgentId ? { agentId: options.requesterAgentId } : {},
					...options?.agentSessionKey ? { sessionKey: options.agentSessionKey } : {},
					...options?.turnSourceChannel ? { turnSourceChannel: options.turnSourceChannel } : {},
					...options?.turnSourceTo ? { turnSourceTo: options.turnSourceTo } : {},
					...options?.turnSourceAccountId ? { turnSourceAccountId: options.turnSourceAccountId } : {},
					...options?.turnSourceThreadId !== void 0 ? { turnSourceThreadId: options.turnSourceThreadId } : {}
				}
			});
			return require_common.jsonResult({
				reply: result.reply,
				...result.action && result.action !== "none" ? { action: result.action } : {},
				...result.needsApproval ? { needsApproval: true } : {},
				...result.proposalId ? { proposalId: result.proposalId } : {}
			});
		}
	};
}
function createOperatorDelegateToolsForRun(options) {
	if (options.sandboxed || options.sessionAgentId === "@gabrielvfonseca/operator") return [];
	return [createOperatorDelegateTool({
		requesterAgentId: options.sessionAgentId,
		agentSessionKey: options.runSessionKey ?? options.agentSessionKey,
		turnSourceChannel: options.agentChannel,
		turnSourceTo: options.currentMessagingTarget ?? options.currentChannelId ?? options.agentTo,
		turnSourceAccountId: options.agentAccountId,
		turnSourceThreadId: options.currentThreadTs ?? options.agentThreadId
	})];
}
//#endregion
//#region src/memory/tools.ts
function asToolResult(details) {
	return {
		content: [],
		details
	};
}
function createMemorySearchTool(ctx) {
	return {
		name: "memory_search",
		label: "Memory Search",
		description: "Search episodic and semantic memory for relevant context.",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description: "Natural language search query"
				},
				limit: {
					type: "number",
					description: "Maximum results to return",
					default: 10
				}
			},
			required: ["query"]
		},
		async execute(_toolCallId, _params, _signal, _onUpdate) {
			const params = _params;
			const query = String(params.query ?? "");
			const limit = Number(params.limit ?? 10);
			const episodic = await ctx.orchestrator.episodic.queryEvents({
				agentId: ctx.agentId,
				sessionId: ctx.sessionId,
				limit
			});
			const semantic = await ctx.orchestrator.semantic.query({
				agentId: ctx.agentId,
				queryText: query,
				limit
			});
			return asToolResult({
				episodic: episodic.map((e) => ({
					id: `${e.sessionId}:${e.occurredAt.getTime()}`,
					type: e.eventType,
					occurredAt: e.occurredAt,
					payload: e.payload
				})),
				semantic: semantic.map((s) => ({
					id: s.id,
					score: s.score,
					text: s.text,
					metadata: s.metadata
				}))
			});
		}
	};
}
function createMemoryGetTool(_ctx) {
	return {
		name: "memory_get",
		label: "Memory Get",
		description: "Fetch a specific memory chunk or event by id.",
		parameters: {
			type: "object",
			properties: { id: {
				type: "string",
				description: "Memory chunk or event id"
			} },
			required: ["id"]
		},
		async execute(_toolCallId, _params, _signal, _onUpdate) {
			return asToolResult({
				id: String(_params.id ?? ""),
				source: "memory",
				content: null
			});
		}
	};
}
function createProcedureRecallTool(ctx) {
	return {
		name: "procedure_recall",
		label: "Procedure Recall",
		description: "Find reusable procedures from procedural memory by tags or description.",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description: "Search query or tag list"
				},
				tags: {
					type: "array",
					items: { type: "string" },
					description: "Filter by tags"
				},
				limit: {
					type: "number",
					description: "Maximum results",
					default: 10
				}
			},
			required: ["query"]
		},
		async execute(_toolCallId, _params, _signal, _onUpdate) {
			const params = _params;
			const query = String(params.query ?? "");
			const tags = Array.isArray(params.tags) ? params.tags.map(String) : [];
			const limit = Number(params.limit ?? 10);
			return asToolResult({ procedures: (await ctx.orchestrator.procedural.queryProcedures({
				agentId: ctx.agentId,
				tags: tags.length ? tags : void 0,
				queryText: query,
				limit
			})).map((p) => ({
				id: p.id,
				name: p.name,
				description: p.description,
				version: p.version,
				tags: p.tags,
				workflowId: p.workflowId
			})) });
		}
	};
}
function createProcedureExecuteTool(ctx) {
	return {
		name: "procedure_execute",
		label: "Procedure Execute",
		description: "Execute a stored procedural workflow by id.",
		parameters: {
			type: "object",
			properties: {
				procedureId: {
					type: "string",
					description: "Procedure id to execute"
				},
				input: {
					type: "object",
					description: "Workflow input payload"
				}
			},
			required: ["procedureId", "input"]
		},
		async execute(_toolCallId, _params, _signal, _onUpdate) {
			const params = _params;
			const procedureId = String(params.procedureId ?? "");
			const input = params.input ?? {};
			return asToolResult(await ctx.orchestrator.procedural.executeProcedure({
				procedureId,
				input,
				agentId: ctx.agentId,
				sessionId: ctx.sessionId
			}));
		}
	};
}
function buildMemoryTools(orchestrator, agentId, sessionId) {
	const ctx = {
		orchestrator,
		agentId,
		sessionId
	};
	return [
		createMemorySearchTool(ctx),
		createMemoryGetTool(ctx),
		createProcedureRecallTool(ctx),
		createProcedureExecuteTool(ctx)
	];
}
//#endregion
//#region src/memory/episodic.ts
function createEpisodicClient(config) {
	let pg = null;
	async function ensurePg() {
		if (pg) return pg;
		try {
			const { Client } = await import("pg");
			const client = new Client({ connectionString: config.postgresUrl });
			await client.connect();
			pg = client;
			return pg;
		} catch {
			return null;
		}
	}
	async function emitLokiLog(line) {
		if (!config.lokiUrl) return;
		try {
			await fetch(`${config.lokiUrl}/loki/api/v1/push`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ streams: [{
					stream: { subsystem: "episodic" },
					values: [[String(Date.now()), line]]
				}] })
			});
		} catch {}
	}
	return {
		async appendEvent(event) {
			const db = await ensurePg();
			if (!db) throw new Error("episodic store unavailable");
			const res = await db.query(`INSERT INTO episodic_events (agent_id, session_id, event_type, payload_jsonb, occurred_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [
				event.agentId,
				event.sessionId,
				event.eventType,
				JSON.stringify(event.payload),
				event.occurredAt.toISOString()
			]);
			const id = String(res.rows[0]?.id ?? "");
			await emitLokiLog(`event ${id} type=${event.eventType} agent=${event.agentId} session=${event.sessionId}`);
			return id;
		},
		async appendChunk(chunk) {
			const db = await ensurePg();
			if (!db) throw new Error("episodic store unavailable");
			const eventId = chunk.eventId ?? "";
			const res = await db.query(`INSERT INTO episodic_chunks (event_id, chunk_text, embedding_model, chunk_meta_jsonb) VALUES ($1, $2, $3, $4) RETURNING id`, [
				eventId || null,
				chunk.chunkText,
				chunk.embeddingModel ?? null,
				JSON.stringify(chunk.metadata ?? {})
			]);
			return String(res.rows[0]?.id ?? "");
		},
		async queryEvents(q) {
			const db = await ensurePg();
			if (!db) return [];
			const clauses = [];
			const params = [];
			if (q.agentId) {
				clauses.push(`agent_id = $${params.length + 1}`);
				params.push(q.agentId);
			}
			if (q.sessionId) {
				clauses.push(`session_id = $${params.length + 1}`);
				params.push(q.sessionId);
			}
			if (q.eventType) {
				clauses.push(`event_type = $${params.length + 1}`);
				params.push(q.eventType);
			}
			if (q.occurredAfter) {
				clauses.push(`occurred_at >= $${params.length + 1}`);
				params.push(q.occurredAfter.toISOString());
			}
			if (q.occurredBefore) {
				clauses.push(`occurred_at <= $${params.length + 1}`);
				params.push(q.occurredBefore.toISOString());
			}
			const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
			const limit = q.limit ?? 100;
			return (await db.query(`SELECT * FROM episodic_events ${where} ORDER BY occurred_at DESC LIMIT ${limit}`, params)).rows.map((row) => ({
				agentId: String(row.agent_id),
				sessionId: String(row.session_id),
				eventType: String(row.event_type),
				payload: row.payload_jsonb,
				occurredAt: new Date(String(row.occurred_at))
			}));
		},
		async queryChunks(q) {
			const db = await ensurePg();
			if (!db) return [];
			const clauses = [];
			const params = [];
			if (q.agentId) {
				clauses.push(`e.agent_id = $${params.length + 1}`);
				params.push(q.agentId);
			}
			if (q.sessionId) {
				clauses.push(`e.session_id = $${params.length + 1}`);
				params.push(q.sessionId);
			}
			if (q.eventType) {
				clauses.push(`e.event_type = $${params.length + 1}`);
				params.push(q.eventType);
			}
			if (q.occurredAfter) {
				clauses.push(`e.occurred_at >= $${params.length + 1}`);
				params.push(q.occurredAfter.toISOString());
			}
			if (q.occurredBefore) {
				clauses.push(`e.occurred_at <= $${params.length + 1}`);
				params.push(q.occurredBefore.toISOString());
			}
			const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
			const limit = q.limit ?? 100;
			return (await db.query(`SELECT c.*, e.agent_id, e.session_id FROM episodic_chunks c JOIN episodic_events e ON e.id = c.event_id ${where} ORDER BY e.occurred_at DESC LIMIT ${limit}`, params)).rows.map((row) => ({
				eventId: String(row.event_id),
				chunkText: String(row.chunk_text),
				embeddingModel: row.embedding_model ? String(row.embedding_model) : void 0,
				metadata: row.chunk_meta_jsonb
			}));
		}
	};
}
//#endregion
//#region src/memory/procedural.ts
function createProceduralClient(config) {
	let neo4j = null;
	let temporal = null;
	async function ensureNeo4j() {
		if (neo4j) return neo4j;
		try {
			const mod = await Promise.resolve().then(() => /* @__PURE__ */ require_rolldown_runtime.__toESM(require("./lib-DAD6VJ3i.cjs").default, 1));
			const session = mod.driver(config.neo4jUrl ?? "bolt://localhost:7687", mod.auth.basic("neo4j", "neo4j")).session();
			await session.run("RETURN 1");
			neo4j = { run: (cypher, params) => session.run(cypher, params) };
			return neo4j;
		} catch {
			return null;
		}
	}
	async function ensureTemporal() {
		if (temporal) return temporal;
		try {
			const { TemporalClient } = await Promise.resolve().then(() => /* @__PURE__ */ require_rolldown_runtime.__toESM(require("./lib-Bc19EmND.cjs").default, 1));
			const client = new TemporalClient({
				address: `${config.temporalHost ?? "localhost"}:${config.temporalPort ?? 7233}`,
				namespace: config.temporalNamespace ?? "default"
			});
			await client.connect();
			temporal = client;
			return temporal;
		} catch {
			return null;
		}
	}
	return {
		async registerProcedure(procedure) {
			const db = await ensureNeo4j();
			if (!db) throw new Error("procedural store unavailable");
			const id = procedure.workflowId ?? `proc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
			const now = (/* @__PURE__ */ new Date()).toISOString();
			await db.run(`MERGE (p:Procedure {id: $id}) SET p.name = $name, p.description = $description, p.tags = $tags, p.inputSchema = $inputSchema, p.outputSchema = $outputSchema, p.version = $version, p.workflowId = $workflowId, p.updatedAt = $updatedAt, p.createdAt = coalesce(p.createdAt, $updatedAt)`, {
				id,
				name: procedure.name,
				description: procedure.description,
				tags: procedure.tags,
				inputSchema: procedure.inputSchema ?? {},
				outputSchema: procedure.outputSchema ?? {},
				version: procedure.version,
				workflowId: procedure.workflowId ?? null,
				updatedAt: now,
				createdAt: now
			});
			for (const tag of procedure.tags) await db.run(`MERGE (t:Tag {name: $tag}) MERGE (p)-[:TAGGED]->(t) WHERE p.id = $id`, {
				tag,
				id
			});
			return id;
		},
		async getProcedure(id) {
			const db = await ensureNeo4j();
			if (!db) return null;
			const record = (await db.run(`MATCH (p:Procedure {id: $id}) RETURN p`, { id })).records[0];
			if (!record) return null;
			const p = record.toObject().p;
			return {
				id: String(p.id),
				name: String(p.name),
				description: String(p.description),
				tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
				inputSchema: p.inputSchema,
				outputSchema: p.outputSchema,
				version: String(p.version),
				workflowId: p.workflowId ? String(p.workflowId) : void 0,
				createdAt: new Date(String(p.createdAt)),
				updatedAt: new Date(String(p.updatedAt))
			};
		},
		async queryProcedures(q) {
			const db = await ensureNeo4j();
			if (!db) return [];
			const clauses = [];
			const params = {};
			if (q.agentId) {
				clauses.push(`p.agentId = $agentId`);
				params.agentId = q.agentId;
			}
			if (q.tags?.length) {
				clauses.push(`ANY(tag IN $tags WHERE tag IN p.tags)`);
				params.tags = q.tags;
			}
			const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
			const limit = q.limit ?? 50;
			return (await db.run(`MATCH (p:Procedure) ${where} RETURN p ORDER BY p.updatedAt DESC LIMIT ${limit}`, params)).records.map((record) => {
				const p = record.toObject().p;
				return {
					id: String(p.id),
					name: String(p.name),
					description: String(p.description),
					tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
					inputSchema: p.inputSchema,
					outputSchema: p.outputSchema,
					version: String(p.version),
					workflowId: p.workflowId ? String(p.workflowId) : void 0,
					createdAt: new Date(String(p.createdAt)),
					updatedAt: new Date(String(p.updatedAt))
				};
			});
		},
		async executeProcedure(params) {
			const t = await ensureTemporal();
			if (!t) return {
				workflowRunId: "",
				status: "unavailable"
			};
			const proc = await this.getProcedure(params.procedureId);
			if (!proc) return {
				workflowRunId: "",
				status: "unavailable"
			};
			if (!proc.workflowId) return {
				workflowRunId: "",
				status: "unavailable"
			};
			try {
				return {
					workflowRunId: (await t.start({
						workflowId: `${proc.workflowId}:${params.sessionId ?? params.agentId}`,
						taskQueue: "memory-procedural",
						args: [params.input]
					})).runId,
					status: "started"
				};
			} catch (err) {
				if (String(err).includes("already running")) return {
					workflowRunId: "",
					status: "already_running"
				};
				return {
					workflowRunId: "",
					status: "unavailable"
				};
			}
		}
	};
}
//#endregion
//#region src/memory/semantic.ts
function createSemanticClient(config) {
	let client = null;
	async function ensureQdrant() {
		if (client) return client;
		try {
			const httpClient = new (await (Promise.resolve().then(() => require("./dist-B5QFiqCp.cjs")))).Api({ baseUrl: config.qdrantUrl });
			await httpClient.collections.getCollections();
			client = {
				getCollections: () => httpClient.collections.getCollections(),
				upsertPoints: (collectionName, data) => httpClient.points.upsertPoints(collectionName, { points: data.points }),
				searchPoints: (collectionName, data) => httpClient.points.searchPoints(collectionName, data),
				deletePoints: (collectionName, data) => httpClient.points.deletePoints(collectionName, { points: data.points })
			};
			return client;
		} catch {
			return null;
		}
	}
	return {
		async upsertChunk(chunk) {
			const q = await ensureQdrant();
			if (!q) throw new Error("semantic store unavailable");
			const id = `${chunk.agentId}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
			await q.upsertPoints(config.collection ?? "semantic_memory", { points: [{
				id,
				vector: chunk.embedding,
				payload: {
					agentId: chunk.agentId,
					sourceType: chunk.sourceType,
					sourcePath: chunk.sourcePath ?? null,
					text: chunk.text,
					metadata: chunk.metadata ?? {},
					createdAt: (/* @__PURE__ */ new Date()).toISOString()
				}
			}] });
			return String(id);
		},
		async deleteChunk(id) {
			const q = await ensureQdrant();
			if (!q) return;
			await q.deletePoints(config.collection ?? "semantic_memory", { points: [id] });
		},
		async query(qParams) {
			const q = await ensureQdrant();
			if (!q) return [];
			if (!qParams.queryEmbedding && qParams.queryText) throw new Error("semantic query requires queryEmbedding (embed the query text before calling query)");
			const filter = qParams.agentId ? { must: [{
				key: "agentId",
				match: { value: qParams.agentId }
			}] } : void 0;
			return ((await q.searchPoints(config.collection ?? "semantic_memory", {
				vector: qParams.queryEmbedding ?? [],
				limit: qParams.limit ?? 20,
				scoreThreshold: qParams.scoreThreshold,
				filter
			})).result ?? []).map((r) => ({
				id: String(r.id),
				score: r.score,
				text: r.payload?.text ?? "",
				metadata: r.payload?.metadata ?? {}
			}));
		}
	};
}
//#endregion
//#region src/memory/working-memory.ts
function createWorkingMemoryClient(config) {
	const keyPrefix = config.keyPrefix ?? "memory:working:";
	const defaultTtl = config.defaultTtlSeconds ?? 3600;
	let client = null;
	async function ensureClient() {
		if (client) return client;
		try {
			const redisClient = (await Promise.resolve().then(() => /* @__PURE__ */ require_rolldown_runtime.__toESM(require("./dist-BxSgz8IM.cjs").default, 1))).createClient({ url: config.redisUrl });
			await redisClient.connect();
			client = {
				get: (k) => redisClient.get(k),
				set: (k, v, ex) => redisClient.setEx(k, ex, v),
				del: (k) => redisClient.del(k),
				keys: (p) => redisClient.keys(p),
				exists: (k) => redisClient.exists(k),
				ttl: (k) => redisClient.ttl(k)
			};
			return client;
		} catch {
			return null;
		}
	}
	return {
		async set(params) {
			const c = await ensureClient();
			if (!c) return;
			const fullKey = `${keyPrefix}${params.key}`;
			const ttl = params.ttlSeconds ?? defaultTtl;
			await c.set(fullKey, JSON.stringify(params.value), ttl);
		},
		async get(key) {
			const c = await ensureClient();
			if (!c) return null;
			const raw = await c.get(`${keyPrefix}${key}`);
			if (!raw) return null;
			try {
				return JSON.parse(raw);
			} catch {
				return raw;
			}
		},
		async del(key) {
			const c = await ensureClient();
			if (!c) return;
			await c.del(`${keyPrefix}${key}`);
		},
		async delByPrefix(prefix) {
			const c = await ensureClient();
			if (!c) return;
			const pattern = `${keyPrefix}${prefix}*`;
			const keys = await c.keys(pattern);
			if (keys.length === 0) return;
			await Promise.all(keys.map((k) => c.del(k)));
		},
		async ttl(key) {
			const c = await ensureClient();
			if (!c) return -1;
			return c.ttl(`${keyPrefix}${key}`);
		},
		async exists(key) {
			const c = await ensureClient();
			if (!c) return false;
			return await c.exists(`${keyPrefix}${key}`) === 1;
		}
	};
}
//#endregion
//#region src/memory/orchestrator.ts
function createMemoryOrchestrator(config) {
	if (!config.enabled) return {
		working: createNoopWorkingClient(),
		episodic: createNoopEpisodicClient(),
		semantic: createNoopSemanticClient(),
		procedural: createNoopProceduralClient()
	};
	return {
		working: createWorkingMemoryClient(config.working),
		episodic: createEpisodicClient(config.episodic),
		semantic: createSemanticClient(config.semantic),
		procedural: createProceduralClient(config.procedural)
	};
}
function createNoopWorkingClient() {
	return {
		async set() {},
		async get() {
			return null;
		},
		async del() {},
		async delByPrefix() {},
		async ttl() {
			return -1;
		},
		async exists() {
			return false;
		}
	};
}
function createNoopEpisodicClient() {
	return {
		async appendEvent() {
			return "";
		},
		async appendChunk() {
			return "";
		},
		async queryEvents() {
			return [];
		},
		async queryChunks() {
			return [];
		}
	};
}
function createNoopSemanticClient() {
	return {
		async upsertChunk() {
			return "";
		},
		async deleteChunk() {},
		async query() {
			return [];
		}
	};
}
function createNoopProceduralClient() {
	return {
		async registerProcedure() {
			return "";
		},
		async getProcedure() {
			return null;
		},
		async queryProcedures() {
			return [];
		},
		async executeProcedure() {
			return {
				workflowRunId: "",
				status: "unavailable"
			};
		}
	};
}
//#endregion
//#region src/memory/config.ts
const DEFAULT_MEMORY_SUBSYSTEM_CONFIG = {
	enabled: true,
	working: {
		redisUrl: "redis://localhost:6379",
		keyPrefix: "memory:working:",
		defaultTtlSeconds: 3600
	},
	episodic: {
		postgresUrl: "postgres://localhost:5432/operator",
		lokiUrl: "http://localhost:3100"
	},
	semantic: {
		qdrantUrl: "http://localhost:6333",
		collection: "semantic_memory",
		embeddingProvider: "openai",
		embeddingModel: "text-embedding-3-small"
	},
	procedural: {
		neo4jUrl: "bolt://localhost:7687",
		temporalNamespace: "default",
		temporalHost: "localhost",
		temporalPort: 7233
	},
	observability: {
		prometheusPushUrl: "http://localhost:9091",
		lokiUrl: "http://localhost:3100",
		grafanaDashboardDir: "./observability/grafana"
	},
	nats: {
		url: "nats://localhost:4222",
		jetStreamPrefix: "MEMORY"
	}
};
//#endregion
//#region src/agents/openclaw-tools.ts
/** Builds the per-run built-in and plugin tool inventory. */
/**
* Drops tools whose requiredClientCaps the originating gateway client did not
* declare. Capability availability is a hard fact, not policy: every tool
* assembly path (core, plugin-only plans) must apply it or gated tools leak
* onto surfaces that cannot render them.
*/
function filterToolsByClientCaps(tools, declaredClientCaps) {
	const clientCaps = new Set(declaredClientCaps ?? []);
	return tools.filter((tool) => !tool.requiredClientCaps?.some((requiredCap) => !clientCaps.has(requiredCap)));
}
function createOperatorTools(options) {
	const resolvedConfig = options?.config;
	const runtimeSnapshot = require_runtime_state.getActiveSecretsRuntimeConfigSnapshot();
	const availabilityConfig = require_runtime_snapshot.selectApplicableRuntimeConfig({
		inputConfig: resolvedConfig,
		runtimeConfig: runtimeSnapshot?.config,
		runtimeSourceConfig: runtimeSnapshot?.sourceConfig
	});
	const { sessionAgentId } = require_agent_scope.resolveSessionAgentIds({
		sessionKey: options?.agentSessionKey,
		config: resolvedConfig,
		agentId: options?.requesterAgentIdOverride
	});
	const inferredWorkspaceDir = options?.workspaceDir || !resolvedConfig ? void 0 : require_agent_scope_config.resolveAgentWorkspaceDir(resolvedConfig, sessionAgentId);
	const workspaceDir = require_workspace_dir.resolveWorkspaceRoot(options?.workspaceDir ?? inferredWorkspaceDir);
	const spawnWorkspaceDir = require_workspace_dir.resolveWorkspaceRoot(options?.spawnWorkspaceDir ?? options?.workspaceDir ?? inferredWorkspaceDir);
	const runtimeCwd = require_workspace_dir.resolveWorkspaceRoot(options?.cwd ?? options?.workspaceDir ?? inferredWorkspaceDir);
	options?.recordToolPrepStage?.("openclaw-tools:session-workspace");
	const deliveryContext = require_delivery_context_shared.normalizeDeliveryContext({
		channel: options?.agentChannel,
		to: options?.agentTo,
		accountId: options?.agentAccountId,
		threadId: options?.agentThreadId
	});
	const runtimeWebTools = require_runtime_web_tools_state.getActiveRuntimeWebToolsMetadata();
	const sandbox = options?.sandboxRoot && options?.sandboxFsBridge ? {
		root: options.sandboxRoot,
		bridge: options.sandboxFsBridge
	} : void 0;
	const optionalMediaTools = resolveOptionalMediaToolFactoryPlan({
		config: availabilityConfig ?? resolvedConfig,
		workspaceDir,
		authStore: options?.authProfileStore,
		toolAllowlist: options?.pluginToolAllowlist,
		toolDenylist: options?.pluginToolDenylist
	});
	const trimmedRunSessionKey = options?.runSessionKey?.trim();
	const mediaGenerationAgentSessionKey = trimmedRunSessionKey && require_session_key.isCronRunSessionKey(trimmedRunSessionKey) ? trimmedRunSessionKey : options?.agentSessionKey;
	const mediaGenerationAsyncStartCallback = mediaGenerationAgentSessionKey ? require_session_key.isCronRunSessionKey(mediaGenerationAgentSessionKey) ? void 0 : options?.onYield : options?.onYield;
	const taskSuggestionSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(options?.runSessionKey ?? options?.agentSessionKey);
	const imageToolAgentDir = options?.agentDir;
	const imageTool = resolveImageToolFactoryAvailable({
		config: availabilityConfig ?? resolvedConfig,
		agentDir: imageToolAgentDir,
		workspaceDir,
		modelHasVision: options?.modelHasVision,
		authStore: options?.authProfileStore
	}) ? require_web_tools.createImageTool({
		config: availabilityConfig ?? options?.config,
		agentDir: imageToolAgentDir,
		authProfileStore: options?.authProfileStore,
		workspaceDir,
		sandbox,
		fsPolicy: options?.fsPolicy,
		agentChannel: options?.agentChannel,
		agentAccountId: options?.agentAccountId,
		currentChannelId: options?.currentChannelId,
		modelHasVision: options?.modelHasVision,
		deferAutoModelResolution: true
	}) : null;
	options?.recordToolPrepStage?.("openclaw-tools:image-tool");
	const imageGenerateTool = optionalMediaTools.imageGenerate ? require_web_tools.createImageGenerateTool({
		config: options?.config,
		agentDir: options?.agentDir,
		authProfileStore: options?.authProfileStore,
		agentSessionKey: mediaGenerationAgentSessionKey,
		requesterOrigin: deliveryContext ?? void 0,
		workspaceDir,
		sandbox,
		fsPolicy: options?.fsPolicy,
		onAsyncTaskStarted: mediaGenerationAsyncStartCallback
	}) : null;
	options?.recordToolPrepStage?.("openclaw-tools:image-generate-tool");
	const videoGenerateTool = optionalMediaTools.videoGenerate ? require_web_tools.createVideoGenerateTool({
		config: options?.config,
		agentDir: options?.agentDir,
		authProfileStore: options?.authProfileStore,
		agentSessionKey: mediaGenerationAgentSessionKey,
		requesterOrigin: deliveryContext ?? void 0,
		workspaceDir,
		sandbox,
		fsPolicy: options?.fsPolicy,
		onAsyncTaskStarted: mediaGenerationAsyncStartCallback
	}) : null;
	options?.recordToolPrepStage?.("openclaw-tools:video-generate-tool");
	const musicGenerateTool = optionalMediaTools.musicGenerate ? require_web_tools.createMusicGenerateTool({
		config: options?.config,
		agentDir: options?.agentDir,
		authProfileStore: options?.authProfileStore,
		agentSessionKey: mediaGenerationAgentSessionKey,
		requesterOrigin: deliveryContext ?? void 0,
		workspaceDir,
		sandbox,
		fsPolicy: options?.fsPolicy,
		onAsyncTaskStarted: mediaGenerationAsyncStartCallback
	}) : null;
	options?.recordToolPrepStage?.("openclaw-tools:music-generate-tool");
	const pdfTool = optionalMediaTools.pdf && options?.agentDir?.trim() ? require_web_tools.createPdfTool({
		config: options?.config,
		agentDir: options.agentDir,
		authProfileStore: options?.authProfileStore,
		workspaceDir,
		sandbox,
		fsPolicy: options?.fsPolicy,
		deferAutoModelResolution: true
	}) : null;
	options?.recordToolPrepStage?.("openclaw-tools:pdf-tool");
	const webSearchTool = require_web_tools.createWebSearchTool({
		config: options?.config,
		agentDir: options?.agentDir,
		sandboxed: options?.sandboxed,
		runtimeWebSearch: runtimeWebTools?.search,
		lateBindRuntimeConfig: true
	});
	options?.recordToolPrepStage?.("openclaw-tools:web-search-tool");
	const webFetchTool = require_web_tools.createWebFetchTool({
		config: options?.config,
		sandboxed: options?.sandboxed,
		runtimeWebFetch: runtimeWebTools?.fetch,
		lateBindRuntimeConfig: true
	});
	options?.recordToolPrepStage?.("openclaw-tools:web-fetch-tool");
	const messageTool = options?.disableMessageTool ? null : require_web_tools.createMessageTool({
		agentAccountId: options?.agentAccountId,
		agentSessionKey: options?.agentSessionKey,
		runId: options?.runId,
		agentId: sessionAgentId,
		sessionId: options?.sessionId,
		messageActionTurnCapability: options?.messageActionTurnCapability,
		config: options?.config,
		currentChannelId: options?.currentChannelId,
		currentChatType: options?.currentChatType,
		currentMessagingTarget: options?.currentMessagingTarget,
		currentChannelProvider: options?.agentChannel,
		currentThreadTs: options?.currentThreadTs,
		currentInboundAudio: options?.currentInboundAudio,
		hasCurrentInboundAudio: options?.hasCurrentInboundAudio,
		agentThreadId: options?.agentThreadId,
		currentMessageId: options?.currentMessageId,
		replyToMode: options?.replyToMode,
		hasRepliedRef: options?.hasRepliedRef,
		sameChannelThreadRequired: options?.sameChannelThreadRequired,
		sandboxRoot: options?.sandboxRoot,
		requireExplicitTarget: options?.requireExplicitMessageTarget,
		sourceReplyDeliveryMode: options?.sourceReplyDeliveryMode,
		inboundEventKind: options?.inboundEventKind,
		requesterSenderId: options?.requesterSenderId ?? void 0,
		senderIsOwner: options?.senderIsOwner,
		conversationReadOrigin: options?.conversationReadOrigin
	});
	const heartbeatTool = options?.enableHeartbeatTool ? require_web_tools.createHeartbeatResponseTool() : null;
	options?.recordToolPrepStage?.("openclaw-tools:message-tool");
	const nodesTool = applyNodesToolWorkspaceGuard(require_web_tools.createNodesTool({
		agentSessionKey: options?.agentSessionKey,
		agentChannel: options?.agentChannel,
		agentAccountId: options?.agentAccountId,
		currentChannelId: options?.currentChannelId,
		currentThreadTs: options?.currentThreadTs,
		config: options?.config,
		modelHasVision: options?.modelHasVision,
		allowMediaInvokeCommands: options?.allowMediaInvokeCommands
	}), {
		fsPolicy: options?.fsPolicy,
		sandboxContainerWorkdir: options?.sandboxContainerWorkdir,
		sandboxRoot: options?.sandboxRoot,
		workspaceDir
	});
	options?.recordToolPrepStage?.("openclaw-tools:nodes-tool");
	const embedded = require_hook_helpers.isEmbeddedMode();
	const messageExplicitlyAllowed = isToolExplicitlyAllowedByFactoryPolicy({
		toolName: "message",
		allowlist: mergeFactoryPolicyList(resolvedConfig?.tools?.allow, resolvedConfig?.tools?.alsoAllow, options?.pluginToolAllowlist),
		denylist: mergeFactoryPolicyList(resolvedConfig?.tools?.deny, options?.pluginToolDenylist)
	});
	const includeMessageTool = !embedded || options?.sourceReplyDeliveryMode === "message_tool_only" || messageExplicitlyAllowed;
	const includeSubagentSpawnTool = !embedded || options?.allowGatewaySubagentBinding === true;
	const effectiveCallGateway = embedded ? require_web_tools.createEmbeddedCallGateway() : require_call.callGateway;
	const includeUpdatePlanTool = shouldIncludeUpdatePlanToolForOperatorTools({
		config: resolvedConfig,
		agentSessionKey: options?.agentSessionKey,
		agentId: options?.requesterAgentIdOverride,
		modelProvider: options?.modelProvider,
		modelId: options?.modelId,
		pluginToolAllowlist: options?.pluginToolAllowlist,
		pluginToolDenylist: options?.pluginToolDenylist
	});
	const includeTranscriptsTool = require_transcripts_tool.resolveTranscriptsConfig(resolvedConfig?.transcripts).enabled;
	const tools = [
		...embedded ? [] : [
			nodesTool,
			...options?.modelHasVision === false ? [] : [require_web_tools.createComputerTool({
				config: options?.config,
				modelHasVision: options?.modelHasVision,
				idempotencyScope: options?.runId,
				contextEpoch: options?.computerContextEpoch
			})],
			require_web_tools.createCronTool({
				agentSessionKey: options?.agentSessionKey,
				currentDeliveryContext: {
					channel: options?.agentChannel,
					to: options?.currentChannelId ?? options?.agentTo,
					accountId: options?.agentAccountId,
					threadId: options?.currentThreadTs ?? options?.agentThreadId
				},
				creatorToolAllowlist: options?.cronCreatorToolAllowlist,
				...options?.cronSelfRemoveOnlyJobId ? { selfRemoveOnlyJobId: options.cronSelfRemoveOnlyJobId } : {}
			}),
			require_web_tools.createSessionsTool({
				agentSessionKey: options?.runSessionKey ?? options?.agentSessionKey,
				sandboxed: options?.sandboxed,
				config: resolvedConfig
			})
		],
		...!embedded && taskSuggestionSessionKey && options?.taskSuggestionDeliveryMode === "gateway" ? require_web_tools.createTaskSuggestionTools({
			sessionKey: taskSuggestionSessionKey,
			agentId: sessionAgentId,
			cwd: runtimeCwd
		}) : [],
		...messageTool && includeMessageTool ? [messageTool] : [],
		...collectPresentOperatorTools([heartbeatTool]),
		require_web_tools.createTtsTool({
			agentChannel: options?.agentChannel,
			config: resolvedConfig,
			agentId: sessionAgentId,
			agentAccountId: options?.agentAccountId
		}),
		...includeTranscriptsTool ? [require_transcripts_tool.createTranscriptsTool({ config: resolvedConfig })] : [],
		...collectPresentOperatorTools([
			imageGenerateTool,
			musicGenerateTool,
			videoGenerateTool
		]),
		...embedded ? [] : [require_web_tools.createGatewayTool(), ...createOperatorDelegateToolsForRun({
			...options,
			sessionAgentId
		})],
		require_web_tools.createAgentsListTool({
			agentSessionKey: options?.agentSessionKey,
			requesterAgentIdOverride: options?.requesterAgentIdOverride
		}),
		require_web_tools.createGetGoalTool({
			agentSessionKey: options?.agentSessionKey,
			runSessionKey: options?.runSessionKey,
			sessionAgentId,
			config: resolvedConfig
		}),
		require_web_tools.createCreateGoalTool({
			agentSessionKey: options?.agentSessionKey,
			runSessionKey: options?.runSessionKey,
			sessionAgentId,
			config: resolvedConfig
		}),
		require_web_tools.createUpdateGoalTool({
			agentSessionKey: options?.agentSessionKey,
			runSessionKey: options?.runSessionKey,
			sessionAgentId,
			config: resolvedConfig
		}),
		...includeUpdatePlanTool ? [require_web_tools.createUpdatePlanTool()] : [],
		require_web_tools.createSessionsListTool({
			agentSessionKey: options?.agentSessionKey,
			sandboxed: options?.sandboxed,
			config: resolvedConfig,
			callGateway: effectiveCallGateway
		}),
		require_web_tools.createSessionsHistoryTool({
			agentSessionKey: options?.agentSessionKey,
			sandboxed: options?.sandboxed,
			config: resolvedConfig,
			callGateway: effectiveCallGateway
		}),
		require_web_tools.createSessionsSearchTool({
			agentId: sessionAgentId,
			agentSessionKey: options?.agentSessionKey,
			sandboxed: options?.sandboxed,
			config: resolvedConfig,
			callGateway: effectiveCallGateway
		}),
		...embedded ? [] : [require_web_tools.createSessionsSendTool({
			agentSessionKey: options?.agentSessionKey,
			agentChannel: options?.agentChannel,
			sandboxed: options?.sandboxed,
			config: resolvedConfig,
			callGateway: require_call.callGateway
		})],
		...includeSubagentSpawnTool ? [require_web_tools.createSessionsSpawnTool({
			agentSessionKey: options?.agentSessionKey,
			completionOwnerKey: options?.runSessionKey,
			agentChannel: options?.agentChannel,
			agentAccountId: options?.agentAccountId,
			agentTo: options?.agentTo,
			agentThreadId: options?.agentThreadId,
			currentMessagingTarget: options?.currentMessagingTarget,
			currentChannelId: options?.currentChannelId,
			currentThreadTs: options?.currentThreadTs,
			agentGroupId: options?.agentGroupId,
			agentGroupChannel: options?.agentGroupChannel,
			agentGroupSpace: options?.agentGroupSpace,
			agentMemberRoleIds: options?.agentMemberRoleIds,
			sandboxed: options?.sandboxed,
			config: resolvedConfig,
			requesterAgentIdOverride: options?.requesterAgentIdOverride,
			workspaceDir: spawnWorkspaceDir,
			inheritedToolAllowlist: options?.inheritedToolAllowlist,
			inheritedToolDenylist: options?.inheritedToolDenylist
		})] : [],
		require_web_tools.createSessionsYieldTool({
			sessionId: options?.sessionId,
			onYield: options?.onYield
		}),
		require_web_tools.createSubagentsTool({
			agentSessionKey: options?.agentSessionKey,
			config: resolvedConfig
		}),
		...buildMemoryTools(createMemoryOrchestrator(DEFAULT_MEMORY_SUBSYSTEM_CONFIG), sessionAgentId, options?.sessionId ?? options?.runSessionKey),
		require_web_tools.createSessionStatusTool({
			agentSessionKey: options?.agentSessionKey,
			runSessionKey: options?.runSessionKey,
			config: resolvedConfig,
			sandboxed: options?.sandboxed,
			activeModelProvider: options?.modelProvider,
			activeModelId: options?.modelId,
			activeDeliveryContext: {
				channel: options?.agentChannel,
				to: options?.currentChannelId ?? options?.agentTo,
				accountId: options?.agentAccountId,
				threadId: options?.currentThreadTs ?? options?.agentThreadId
			}
		}),
		...collectPresentOperatorTools([
			webSearchTool,
			webFetchTool,
			imageTool,
			pdfTool
		])
	];
	options?.recordToolPrepStage?.("openclaw-tools:core-tool-list");
	let allTools = tools;
	if (!options?.disablePluginTools) {
		const existingToolNames = /* @__PURE__ */ new Set();
		for (const tool of tools) existingToolNames.add(tool.name);
		allTools = [...tools, ...resolveOperatorPluginToolsForOptions({
			options,
			resolvedConfig,
			existingToolNames
		})];
		options?.recordToolPrepStage?.("openclaw-tools:plugin-tools");
	}
	allTools = filterToolsByClientCaps(allTools, options?.clientCaps);
	options?.recordToolPrepStage?.("openclaw-tools:client-capabilities");
	const hookAgentId = options?.requesterAgentIdOverride ?? sessionAgentId;
	const wrapGatewayCallerIdentity = require_gateway.createGatewayToolCallerWrapper(hookAgentId, options);
	if (options?.wrapBeforeToolCallHook === false) return allTools.map(wrapGatewayCallerIdentity);
	const hookContext = {
		...hookAgentId ? { agentId: hookAgentId } : {},
		...resolvedConfig ? { config: resolvedConfig } : {},
		...options?.agentSessionKey ? { sessionKey: options.agentSessionKey } : {},
		...options?.sessionId ? { sessionId: options.sessionId } : {},
		...options?.currentChannelId ? { channelId: options.currentChannelId } : {},
		loopDetection: require_tool_loop_detection_config.resolveToolLoopDetectionConfig({
			cfg: resolvedConfig,
			agentId: hookAgentId
		}),
		...options?.beforeToolCallHookContext
	};
	options?.recordToolPrepStage?.("openclaw-tools:tool-hooks");
	return allTools.map((tool) => require_gateway.isToolWrappedWithBeforeToolCallHook(tool) ? tool : require_hook_helpers.wrapToolWithBeforeToolCallHook(tool, hookContext)).map(wrapGatewayCallerIdentity);
}
//#endregion
Object.defineProperty(exports, "createLazyExecTool", {
	enumerable: true,
	get: function() {
		return createLazyExecTool;
	}
});
Object.defineProperty(exports, "createOperatorTools", {
	enumerable: true,
	get: function() {
		return createOperatorTools;
	}
});
Object.defineProperty(exports, "filterToolsByClientCaps", {
	enumerable: true,
	get: function() {
		return filterToolsByClientCaps;
	}
});
Object.defineProperty(exports, "filterToolsByMessageProvider", {
	enumerable: true,
	get: function() {
		return filterToolsByMessageProvider;
	}
});
Object.defineProperty(exports, "resolveExecToolConfig", {
	enumerable: true,
	get: function() {
		return resolveExecToolConfig;
	}
});
Object.defineProperty(exports, "resolveOperatorPluginToolsForOptions", {
	enumerable: true,
	get: function() {
		return resolveOperatorPluginToolsForOptions;
	}
});
