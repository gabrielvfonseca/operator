require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_runtime_status = require("./runtime-status-BGIjp9Ys.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_sender_tool_policy = require("./sender-tool-policy-BpwQcnDR.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_event_session_routing = require("./event-session-routing-BmkihcER.cjs");
const require_dangerous_tools = require("./dangerous-tools-DGtnzszS.cjs");
const require_openclaw_tools = require("./openclaw-tools-CDsUYzLX.cjs");
const require_bash_tools_schemas = require("./bash-tools.schemas-DAU-eSdE.cjs");
const require_tool_policy_pipeline = require("./tool-policy-pipeline-JYa4zOwK.cjs");
const require_exec_defaults = require("./exec-defaults-DvQXwpzS.cjs");
//#region src/gateway/tool-resolution.ts
/** Resolve the tools visible to a gateway caller after agent, channel, and surface policy. */
function resolveGatewayScopedTools(params) {
	const runtimePolicySessionKey = params.runtimePolicySessionKey?.trim() || params.sessionKey;
	const { agentId, globalPolicy, globalProviderPolicy, agentPolicy, agentProviderPolicy, profile, providerProfile, profileAlsoAllow, providerProfileAlsoAllow } = require_agent_tools_policy.resolveEffectiveToolPolicy({
		config: params.cfg,
		sessionKey: runtimePolicySessionKey,
		agentId: params.agentId,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	const profilePolicy = require_tool_policy.resolveToolProfilePolicy(profile);
	const providerProfilePolicy = require_tool_policy.resolveToolProfilePolicy(providerProfile);
	const surface = params.surface ?? "http";
	const nodeExecSurface = surface === "loopback" && params.includeNodeExecTool === true;
	const gatewayRequestedTools = params.gatewayRequestedTools ?? [];
	const messageProvider = params.messageProvider?.trim().toLowerCase();
	const sourceReplyDeliveryMode = params.sourceReplyDeliveryMode ?? (params.inboundEventKind === "room_event" && messageProvider !== "webchat" ? "message_tool_only" : void 0);
	const runtimeAlsoAllow = sourceReplyDeliveryMode === "message_tool_only" ? ["message"] : [];
	const profilePolicyWithAlsoAllow = require_tool_policy.mergeAlsoAllowPolicy(profilePolicy, [
		...profileAlsoAllow ?? [],
		...gatewayRequestedTools,
		...runtimeAlsoAllow
	]);
	const providerProfilePolicyWithAlsoAllow = require_tool_policy.mergeAlsoAllowPolicy(providerProfilePolicy, [
		...providerProfileAlsoAllow ?? [],
		...gatewayRequestedTools,
		...runtimeAlsoAllow
	]);
	const senderId = params.channelContext?.sender?.id;
	const groupPolicy = require_agent_tools_policy.resolveGroupToolPolicy({
		config: params.cfg,
		sessionKey: runtimePolicySessionKey,
		spawnedBy: params.spawnedBy,
		messageProvider: params.messageProvider,
		groupId: params.groupId,
		groupChannel: params.groupChannel,
		groupSpace: params.groupSpace,
		accountId: params.accountId ?? null,
		senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	});
	const isOwnerInternalSession = nodeExecSurface && params.senderIsOwner === true && require_message_channel_core.normalizeMessageChannel(params.messageProvider) === "webchat";
	const senderPolicy = (nodeExecSurface ? !isOwnerInternalSession : Boolean(senderId)) ? require_sender_tool_policy.resolveSenderToolPolicy({
		config: params.cfg,
		agentId,
		messageProvider: params.messageProvider,
		senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	}) : void 0;
	const sandboxRuntime = require_runtime_status.resolveSandboxRuntimeStatus({
		cfg: params.cfg,
		sessionKey: runtimePolicySessionKey,
		agentId
	});
	const sandboxPolicy = sandboxRuntime.sandboxed ? sandboxRuntime.toolPolicy : void 0;
	const subagentStore = require_subagent_capabilities.resolveSubagentCapabilityStore(runtimePolicySessionKey, { cfg: params.cfg });
	const subagentPolicy = require_subagent_capabilities.isSubagentEnvelopeSession(runtimePolicySessionKey, {
		cfg: params.cfg,
		store: subagentStore
	}) ? require_agent_tools_policy.resolveSubagentToolPolicyForSession(params.cfg, runtimePolicySessionKey, { store: subagentStore }) : void 0;
	const inheritedToolPolicy = require_agent_tools_policy.resolveInheritedToolPolicyForSession(params.cfg, runtimePolicySessionKey, { store: subagentStore });
	const excludedToolNames = params.excludeToolNames ? Array.from(params.excludeToolNames) : [];
	const gatewayToolsCfg = params.cfg.gateway?.tools;
	const defaultGatewayDeny = surface === "http" ? require_dangerous_tools.DEFAULT_GATEWAY_HTTP_TOOL_DENY.filter((name) => !gatewayToolsCfg?.allow?.includes(name)) : [];
	const ownerOnlyGatewayDeny = params.senderIsOwner === false || surface === "http" && params.senderIsOwner !== true ? [...require_dangerous_tools.GATEWAY_OWNER_ONLY_CORE_TOOLS] : [];
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId ?? require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const explicitDenylist = require_tool_policy.collectExplicitDenylist([
		profilePolicy,
		providerProfilePolicy,
		globalPolicy,
		globalProviderPolicy,
		agentPolicy,
		agentProviderPolicy,
		groupPolicy,
		senderPolicy,
		sandboxPolicy,
		subagentPolicy,
		inheritedToolPolicy,
		defaultGatewayDeny.length > 0 ? { deny: defaultGatewayDeny } : void 0,
		ownerOnlyGatewayDeny.length > 0 ? { deny: ownerOnlyGatewayDeny } : void 0,
		Array.isArray(gatewayToolsCfg?.deny) ? { deny: gatewayToolsCfg.deny } : void 0
	]);
	const inheritedToolDenylist = [...explicitDenylist];
	const inheritedToolAllowlist = [];
	const cronCreatorToolAllowlist = [];
	const shouldInheritEffectiveToolAllowlist = [
		profilePolicy,
		providerProfilePolicy,
		globalPolicy,
		globalProviderPolicy,
		agentPolicy,
		agentProviderPolicy,
		groupPolicy,
		senderPolicy,
		sandboxPolicy,
		subagentPolicy,
		inheritedToolPolicy,
		gatewayRequestedTools.length > 0 ? { allow: gatewayRequestedTools } : void 0
	].some(require_tool_policy.hasRestrictiveAllowPolicy);
	const shouldCaptureCronCreatorToolAllowlist = shouldInheritEffectiveToolAllowlist || explicitDenylist.length > 0 || excludedToolNames.length > 0;
	const openClawTools = require_openclaw_tools.createOperatorTools({
		agentSessionKey: params.sessionKey,
		requesterAgentIdOverride: agentId,
		agentChannel: params.messageProvider ?? void 0,
		agentAccountId: params.accountId,
		inboundEventKind: params.inboundEventKind,
		sourceReplyDeliveryMode,
		taskSuggestionDeliveryMode: params.taskSuggestionDeliveryMode,
		agentTo: params.agentTo,
		agentThreadId: params.agentThreadId,
		currentChannelId: params.currentChannelId ?? params.agentTo,
		currentThreadTs: params.currentThreadTs ?? params.agentThreadId,
		currentMessageId: params.currentMessageId,
		currentInboundAudio: params.currentInboundAudio,
		sessionId: params.sessionId,
		onYield: params.onYield,
		requireExplicitMessageTarget: params.requireExplicitMessageTarget,
		senderIsOwner: params.senderIsOwner,
		conversationReadOrigin: params.conversationReadOrigin,
		allowGatewaySubagentBinding: params.allowGatewaySubagentBinding,
		allowMediaInvokeCommands: params.allowMediaInvokeCommands,
		disablePluginTools: params.disablePluginTools,
		wrapBeforeToolCallHook: false,
		config: params.cfg,
		clientCaps: params.clientCaps,
		workspaceDir,
		sandboxed: sandboxRuntime.sandboxed,
		pluginToolAllowlist: require_tool_policy.collectExplicitAllowlist([
			profilePolicy,
			providerProfilePolicy,
			globalPolicy,
			globalProviderPolicy,
			agentPolicy,
			agentProviderPolicy,
			groupPolicy,
			senderPolicy,
			sandboxPolicy,
			subagentPolicy,
			inheritedToolPolicy,
			gatewayRequestedTools.length > 0 ? { allow: gatewayRequestedTools } : void 0
		]),
		pluginToolDenylist: explicitDenylist,
		cronCreatorToolAllowlist: shouldCaptureCronCreatorToolAllowlist ? cronCreatorToolAllowlist : void 0,
		inheritedToolAllowlist,
		inheritedToolDenylist
	});
	const nodeExecCandidate = nodeExecSurface ? require_exec_defaults.resolveExecDefaults({
		cfg: params.cfg,
		sessionEntry: params.execSession,
		execOverrides: params.execOverrides,
		agentId,
		sessionKey: runtimePolicySessionKey,
		sandboxAvailable: sandboxRuntime.sandboxed
	}) : void 0;
	const includeNodeExecTool = nodeExecCandidate?.canRequestNode === true;
	const execConfig = includeNodeExecTool ? require_openclaw_tools.resolveExecToolConfig({
		cfg: params.cfg,
		agentId
	}) : void 0;
	const baseTools = nodeExecSurface ? openClawTools.filter((tool) => tool.name.trim().toLowerCase() !== "exec") : openClawTools;
	const policyFiltered = require_tool_policy_pipeline.applyToolPolicyPipeline({
		tools: require_openclaw_tools.filterToolsByMessageProvider(includeNodeExecTool ? [...baseTools, require_openclaw_tools.createLazyExecTool({
			host: "node",
			mode: nodeExecCandidate.mode,
			security: nodeExecCandidate.security,
			ask: nodeExecCandidate.ask,
			trigger: params.trigger,
			node: nodeExecCandidate.node,
			pathPrepend: execConfig?.pathPrepend,
			safeBins: execConfig?.safeBins,
			strictInlineEval: execConfig?.strictInlineEval,
			commandHighlighting: execConfig?.commandHighlighting,
			safeBinTrustedDirs: execConfig?.safeBinTrustedDirs,
			safeBinProfiles: execConfig?.safeBinProfiles,
			reviewer: execConfig?.reviewer,
			config: params.cfg,
			agentId,
			elevated: params.bashElevated,
			cwd: workspaceDir,
			allowBackground: false,
			scopeKey: params.sessionKey,
			sessionKey: params.sessionKey,
			sessionId: params.sessionId,
			sessionStore: params.cfg.session?.store,
			mainKey: params.cfg.session?.mainKey,
			sessionScope: params.cfg.session?.scope,
			eventRouting: require_event_session_routing.resolveEventSessionRoutingPolicy({
				cfg: params.cfg,
				sessionKey: params.sessionKey,
				channel: params.messageProvider,
				accountId: params.accountId
			}),
			messageProvider: params.messageProvider,
			currentChannelId: params.currentChannelId ?? params.agentTo,
			currentThreadTs: params.currentThreadTs ?? params.agentThreadId,
			channelContext: params.channelContext,
			accountId: params.accountId,
			approvalReviewerDeviceId: params.approvalReviewerDeviceId,
			backgroundMs: execConfig?.backgroundMs,
			timeoutSec: execConfig?.timeoutSec,
			approvalRunningNoticeMs: execConfig?.approvalRunningNoticeMs,
			notifyOnExit: execConfig?.notifyOnExit,
			notifyOnExitEmptySuccess: execConfig?.notifyOnExitEmptySuccess
		}, {
			description: "Execute a shell command on a connected Operator node. This tool is node-only; use the CLI native shell for Gateway-local commands. Commands run synchronously. Set node when multiple nodes are available.",
			displaySummary: "Run commands on a connected node",
			parameters: require_bash_tools_schemas.nodeExecSchema
		})] : baseTools, params.messageProvider),
		toolMeta: (tool) => require_tools.getPluginToolMeta(tool),
		warn: require_logger.logWarn,
		steps: [
			...require_tool_policy_pipeline.buildDefaultToolPolicyPipelineSteps({
				profilePolicy: profilePolicyWithAlsoAllow,
				profile,
				profileUnavailableCoreWarningAllowlist: profilePolicy?.allow,
				providerProfilePolicy: providerProfilePolicyWithAlsoAllow,
				providerProfile,
				providerProfileUnavailableCoreWarningAllowlist: providerProfilePolicy?.allow,
				globalPolicy,
				globalProviderPolicy,
				agentPolicy,
				agentProviderPolicy,
				groupPolicy,
				senderPolicy,
				agentId
			}),
			{
				policy: sandboxPolicy,
				label: "sandbox tools.allow"
			},
			{
				policy: subagentPolicy,
				label: "subagent tools.allow"
			},
			{
				policy: inheritedToolPolicy,
				label: "inherited tools"
			}
		],
		declaredToolAllowlist: require_tool_policy_pipeline.buildDeclaredToolAllowlistContext({
			config: params.cfg,
			workspaceDir,
			toolDenylist: explicitDenylist
		})
	});
	const gatewayDenySet = /* @__PURE__ */ new Set([
		...defaultGatewayDeny,
		...ownerOnlyGatewayDeny,
		...Array.isArray(gatewayToolsCfg?.deny) ? gatewayToolsCfg.deny : [],
		...excludedToolNames
	]);
	const tools = policyFiltered.filter((tool) => !gatewayDenySet.has(tool.name));
	const inheritableTools = includeNodeExecTool ? tools.filter((tool) => tool.name.trim().toLowerCase() !== "exec") : tools;
	if (shouldInheritEffectiveToolAllowlist) require_tool_policy.replaceWithEffectiveToolAllowlist(inheritedToolAllowlist, inheritableTools);
	if (shouldCaptureCronCreatorToolAllowlist) require_web_tools.replaceWithEffectiveCronCreatorToolAllowlist(cronCreatorToolAllowlist, inheritableTools, (tool) => require_tools.getPluginToolMeta(tool));
	return {
		agentId,
		tools,
		workspaceDir
	};
}
//#endregion
Object.defineProperty(exports, "resolveGatewayScopedTools", {
	enumerable: true,
	get: function() {
		return resolveGatewayScopedTools;
	}
});
