const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
const require_workspace_dir = require("./workspace-dir-b3xUIeYD.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_sender_tool_policy = require("./sender-tool-policy-BpwQcnDR.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/agents/conversation-capability-profile.ts
/**
* Resolves the conversation-scoped runtime facts that tool and harness policy
* hot paths share. Keep this internal: it prepares existing config/state, not a
* new public access-profile config surface.
*/
var conversation_capability_profile_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolveConversationCapabilityProfile: () => resolveConversationCapabilityProfile });
function resolveConversationCapabilityProfile(params) {
	const messageProvider = params.messageProvider;
	const effective = require_agent_tools_policy.resolveEffectiveToolPolicy({
		config: params.config,
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	const trustedGroup = require_agent_tools_policy.resolveTrustedGroupId({
		sessionKey: params.sessionKey,
		spawnedBy: params.spawnedBy,
		groupId: params.groupId
	});
	const trustedGroupChannel = trustedGroup.dropped ? null : params.groupChannel;
	const trustedGroupSpace = trustedGroup.dropped ? null : params.groupSpace;
	const groupPolicy = require_agent_tools_policy.resolveGroupToolPolicy({
		config: params.config,
		sessionKey: params.sessionKey,
		spawnedBy: params.spawnedBy,
		messageProvider: messageProvider ?? void 0,
		groupId: trustedGroup.groupId,
		groupChannel: trustedGroupChannel,
		groupSpace: trustedGroupSpace,
		accountId: params.agentAccountId,
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	});
	const senderPolicy = params.senderIsOwner === true && require_message_channel_core.normalizeMessageChannel(messageProvider ?? params.messageChannel) === "webchat" ? void 0 : require_sender_tool_policy.resolveSenderToolPolicy({
		config: params.config,
		agentId: effective.agentId,
		messageProvider,
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	});
	const profilePolicy = require_tool_policy.resolveToolProfilePolicy(effective.profile);
	const providerProfilePolicy = require_tool_policy.resolveToolProfilePolicy(effective.providerProfile);
	const subagentSessionKey = params.sandboxSessionKey ?? params.sessionKey;
	const subagentStore = require_subagent_capabilities.resolveSubagentCapabilityStore(subagentSessionKey, { cfg: params.config });
	const subagentPolicy = subagentSessionKey && require_subagent_capabilities.isSubagentEnvelopeSession(subagentSessionKey, {
		cfg: params.config,
		store: subagentStore
	}) ? require_agent_tools_policy.resolveSubagentToolPolicyForSession(params.config, subagentSessionKey, { store: subagentStore }) : void 0;
	const inheritedToolPolicy = require_agent_tools_policy.resolveInheritedToolPolicyForSession(params.config, subagentSessionKey, { store: subagentStore });
	const configuredOverridePolicies = [
		effective.globalPolicy,
		effective.globalProviderPolicy,
		effective.agentPolicy,
		effective.agentProviderPolicy,
		groupPolicy,
		senderPolicy,
		params.sandboxToolPolicy,
		subagentPolicy
	];
	const runtimeToolPolicy = params.runtimeToolAllowlist ? { allow: params.runtimeToolAllowlist } : void 0;
	const runtimeToolAlsoAllowlist = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((params.runtimePluginToolGrant?.toolNames ?? []).map((entry) => entry.trim()).filter(Boolean));
	const mergeRuntimeToolAlsoAllowlist = (configured) => {
		const merged = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...configured ?? [], ...runtimeToolAlsoAllowlist]);
		return merged.length > 0 ? merged : void 0;
	};
	const explicitOverridePolicies = [...configuredOverridePolicies, runtimeToolPolicy];
	const inheritancePolicies = [
		profilePolicy,
		providerProfilePolicy,
		...configuredOverridePolicies,
		inheritedToolPolicy,
		runtimeToolPolicy
	];
	return {
		agentId: effective.agentId,
		serviceIdentity: {
			agentId: effective.agentId,
			agentDir: params.agentDir,
			accountId: params.agentAccountId,
			runId: params.runId,
			sessionId: params.sessionId
		},
		model: {
			provider: params.modelProvider,
			id: params.modelId,
			api: params.modelApi,
			contextWindowTokens: params.modelContextWindowTokens,
			hasVision: params.modelHasVision
		},
		conversation: {
			scope: resolveConversationScope({
				chatType: params.chatType,
				sessionKey: params.sessionKey,
				runSessionKey: params.runSessionKey,
				trustedGroup,
				groupChannel: trustedGroupChannel,
				groupSpace: trustedGroupSpace
			}),
			chatType: require_chat_type.normalizeChatType(params.chatType),
			sessionKey: params.runSessionKey ?? params.sessionKey,
			policySessionKey: params.sessionKey,
			runSessionKey: params.runSessionKey,
			sessionId: params.sessionId,
			messageProvider,
			messageChannel: params.messageChannel,
			messageTo: params.messageTo,
			messageThreadId: params.messageThreadId,
			currentChannelId: params.currentChannelId,
			currentMessagingTarget: params.currentMessagingTarget,
			currentThreadTs: params.currentThreadTs,
			currentMessageId: params.currentMessageId,
			groupId: trustedGroup.groupId,
			groupChannel: trustedGroupChannel,
			groupSpace: trustedGroupSpace,
			memberRoleIds: params.memberRoleIds,
			spawnedBy: params.spawnedBy
		},
		sender: {
			id: params.senderId,
			name: params.senderName,
			username: params.senderUsername,
			e164: params.senderE164,
			isOwner: params.senderIsOwner
		},
		workspace: {
			workspaceDir: params.workspaceDir,
			cwd: params.cwd,
			spawnWorkspaceDir: params.spawnWorkspaceDir,
			workspaceRoot: require_workspace_dir.resolveWorkspaceRoot(params.workspaceDir),
			runtimeRoot: require_workspace_dir.resolveWorkspaceRoot(params.cwd ?? params.workspaceDir),
			spawnWorkspaceRoot: params.spawnWorkspaceDir ? require_workspace_dir.resolveWorkspaceRoot(params.spawnWorkspaceDir) : void 0,
			instructionRoot: params.agentDir ?? params.workspaceDir,
			isCanonicalWorkspace: params.isCanonicalWorkspace
		},
		instructions: {
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			promptMode: params.promptMode,
			isCanonicalWorkspace: params.isCanonicalWorkspace
		},
		skills: { snapshot: params.skillsSnapshot },
		policy: {
			agentId: effective.agentId,
			sessionKey: params.sessionKey,
			subagentSessionKey,
			trustedGroup,
			profile: effective.profile,
			providerProfile: effective.providerProfile,
			profilePolicy,
			providerProfilePolicy,
			profileAlsoAllow: mergeRuntimeToolAlsoAllowlist(effective.profileAlsoAllow),
			providerProfileAlsoAllow: mergeRuntimeToolAlsoAllowlist(effective.providerProfileAlsoAllow),
			globalPolicy: effective.globalPolicy,
			globalProviderPolicy: effective.globalProviderPolicy,
			agentPolicy: effective.agentPolicy,
			agentProviderPolicy: effective.agentProviderPolicy,
			groupPolicy,
			senderPolicy,
			sandboxPolicy: params.sandboxToolPolicy,
			subagentPolicy,
			inheritedToolPolicy,
			inheritancePolicies,
			explicitToolAllowlist: require_tool_policy.collectExplicitAllowlist(inheritancePolicies),
			explicitToolOverrideAllowlist: require_tool_policy.collectExplicitAllowlist(explicitOverridePolicies),
			explicitToolDenylist: require_tool_policy.collectExplicitDenylist(inheritancePolicies),
			runtimePluginToolGrant: params.runtimePluginToolGrant
		}
	};
}
function resolveConversationScope(params) {
	const chatType = require_chat_type.normalizeChatType(params.chatType);
	if (chatType === "direct") return "direct";
	if (chatType === "group" || chatType === "channel") return "shared";
	if (require_agent_tools_policy.sessionKeyNamesGroupConversation(params.runSessionKey) || require_agent_tools_policy.sessionKeyNamesGroupConversation(params.sessionKey)) return "shared";
	if (params.trustedGroup.dropped) return "unknown";
	return params.trustedGroup.groupId?.trim() || params.groupChannel?.trim() || params.groupSpace?.trim() ? "shared" : "unknown";
}
//#endregion
Object.defineProperty(exports, "conversation_capability_profile_exports", {
	enumerable: true,
	get: function() {
		return conversation_capability_profile_exports;
	}
});
Object.defineProperty(exports, "resolveConversationCapabilityProfile", {
	enumerable: true,
	get: function() {
		return resolveConversationCapabilityProfile;
	}
});
