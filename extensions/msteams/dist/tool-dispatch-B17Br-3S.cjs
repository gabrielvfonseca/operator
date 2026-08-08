require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_hook_helpers = require("./hook-helpers-B7eHTW1w.cjs");
const require_typebox = require("./typebox-Cmpdg63i.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
const require_runtime_status = require("./runtime-status-BGIjp9Ys.cjs");
require("./config-DT0qiglW.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
require("./model-selection-normalize-BrB-lt0o.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_workspace_dir = require("./workspace-dir-b3xUIeYD.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_sender_tool_policy = require("./sender-tool-policy-BpwQcnDR.cjs");
const require_conversation_read_origin = require("./conversation-read-origin-C-xn-esF.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_oauth = require("./oauth-D9-_YxyQ.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_service = require("./service-BJOB1VMb.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_call = require("./call-CphTnsHC.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
require("./delivery-context-ywYGmcjO.cjs");
const require_runtime_web_tools_state = require("./runtime-web-tools-state-DbJISCDm.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
const require_transcripts_tool = require("./transcripts-tool-CLY1XDWH.cjs");
const require_tool_loop_detection_config = require("./tool-loop-detection-config-c-3qUtKe.cjs");
require("./agent-id-nux9kTGp.cjs");
const require_tool_policy_pipeline = require("./tool-policy-pipeline-JYa4zOwK.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let typebox = require("typebox");
//#region src/agents/operator-tools.plugin-context.ts
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
//#region src/agents/operator-plugin-tools.ts
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
//#region src/agents/operator-tools.media-factory-plan.ts
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
//#region src/agents/operator-tools.nodes-workspace-guard.ts
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
//#region src/agents/operator-tools.registration.ts
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
//#region src/agents/tools/operator-delegate-tool.ts
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
		name: "operator",
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
//#region src/agents/tools/skill-workshop-tool-helpers.ts
function proposalReviewPhase(completion) {
	return completion.phase ?? (completion.completed ? "completed" : "open");
}
function beginProposalReviewMutation(completion) {
	if (!completion) return;
	if (proposalReviewPhase(completion) !== "open") throw new require_common.ToolInputError("this Skill Workshop review is already completing or complete");
	let release;
	const done = new Promise((resolve) => {
		release = resolve;
	});
	const activeMutations = completion.activeMutations ?? /* @__PURE__ */ new Set();
	completion.activeMutations = activeMutations;
	activeMutations.add(done);
	return () => {
		activeMutations.delete(done);
		release();
	};
}
async function completeProposalReview(completion) {
	const phase = proposalReviewPhase(completion);
	if (phase === "completed") return completionResult();
	if (phase === "completing") throw new require_common.ToolInputError("this Skill Workshop review is already completing");
	completion.phase = "completing";
	try {
		await Promise.all(Array.from(completion.activeMutations ?? []));
		await completion.complete();
		completion.completed = true;
		completion.phase = "completed";
		return completionResult();
	} catch (error) {
		completion.phase = "open";
		throw error;
	}
}
function completionResult() {
	return {
		content: [{
			type: "text",
			text: "Completed Skill Workshop review."
		}],
		details: { completed: true }
	};
}
function proposalMutationText(action, record) {
	return `${action} ${record.id} (${record.status}) for ${record.target.skillKey}.`;
}
function actionResult(record, options) {
	return {
		content: [{
			type: "text",
			text: options.contentText
		}],
		details: {
			id: record.id,
			status: record.status,
			kind: record.kind,
			skillName: record.target.skillName,
			skillKey: record.target.skillKey,
			targetSkillFile: options.targetSkillFile ?? record.target.skillFile,
			scanState: record.scan.state,
			proposedVersion: record.proposedVersion
		}
	};
}
function proposalResult(proposal, options = {}) {
	return {
		content: options.contentText ? [{
			type: "text",
			text: options.contentText
		}] : [],
		details: {
			id: proposal.record.id,
			status: proposal.record.status,
			kind: proposal.record.kind,
			skillName: proposal.record.target.skillName,
			skillKey: proposal.record.target.skillKey,
			proposalFile: proposal.record.draftFile,
			supportFileCount: proposal.record.supportFiles?.length ?? 0,
			targetSkillFile: proposal.record.target.skillFile,
			scanState: proposal.record.scan.state,
			proposedVersion: proposal.record.proposedVersion,
			...options.includeContent ? { proposalContent: proposal.content } : {},
			...options.includeContent && proposal.supportFiles ? { supportFiles: proposal.supportFiles } : {}
		}
	};
}
function readLifecycleProposalIdParam(params) {
	return require_common.readStringParam(params, "proposal_id", {
		required: true,
		label: "proposal_id"
	});
}
async function readProposalForInspect(params, workspaceDir, env) {
	const proposalId = require_common.readStringParam(params, "proposal_id", { label: "proposal_id" });
	if (proposalId) {
		const proposal = await require_service.inspectSkillProposal(proposalId, {
			workspaceDir,
			env
		});
		if (!proposal) throw new require_common.ToolInputError(`Skill proposal not found: ${proposalId}`);
		return proposal;
	}
	const resolved = await require_service.resolvePendingSkillProposal({
		name: require_common.readStringParam(params, "name", { required: true }),
		workspaceDir,
		env
	});
	const proposal = await require_service.inspectSkillProposal(resolved.record.id, {
		workspaceDir,
		env
	});
	if (!proposal) throw new require_common.ToolInputError(`Skill proposal not found: ${resolved.record.id}`);
	return proposal;
}
function readProposalStatusParam(params, statuses) {
	const status = require_common.readStringParam(params, "status");
	if (!status) return;
	if (!statuses.includes(status)) throw new require_common.ToolInputError(`status must be one of ${statuses.join(", ")}`);
	return status;
}
function readListLimitParam(params) {
	return require_common.readPositiveIntegerParam(params, "limit") ?? 20;
}
function readSupportFilesParam(params) {
	const raw = params.support_files;
	if (raw === void 0) return;
	if (!Array.isArray(raw)) throw new require_common.ToolInputError("support_files must be an array");
	return raw.map((item, index) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) throw new require_common.ToolInputError(`support_files[${index}] must be an object`);
		const file = item;
		if (typeof file.path !== "string" || !file.path.trim()) throw new require_common.ToolInputError(`support_files[${index}].path required`);
		if (typeof file.content !== "string") throw new require_common.ToolInputError(`support_files[${index}].content required`);
		return {
			path: file.path,
			content: file.content
		};
	});
}
//#endregion
//#region src/agents/tools/skill-workshop-tool-presentation.ts
function listProposalEntries(params) {
	const query = params.query?.trim().toLowerCase();
	const normalizedQuery = query ? normalizeProposalSearchText(query) : void 0;
	const limit = Math.min(Math.max(params.limit, 1), 50);
	return params.proposals.filter((proposal) => !params.status || proposal.status === params.status).filter((proposal) => {
		if (!query) return true;
		return [
			proposal.id,
			proposal.title,
			proposal.description,
			proposal.skillName,
			proposal.skillKey
		].some((value) => {
			const lower = value.toLowerCase();
			return lower.includes(query) || normalizedQuery !== void 0 && normalizedQuery.length > 0 && normalizeProposalSearchText(lower).includes(normalizedQuery);
		});
	}).toSorted((a, b) => {
		if (a.status === "pending" && b.status !== "pending") return -1;
		if (a.status !== "pending" && b.status === "pending") return 1;
		return b.updatedAt.localeCompare(a.updatedAt);
	}).slice(0, limit);
}
function normalizeProposalSearchText(value) {
	return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");
}
function formatProposalList(proposals) {
	if (proposals.length === 0) return "No skill proposals matched.";
	return proposals.map((proposal) => `- ${proposal.id} [${proposal.status}, ${proposal.kind}, ${proposal.scanState}] ${proposal.skillKey}: ${proposal.title}`).join("\n");
}
function formatProposalInspect(proposal) {
	const supportFiles = proposal.supportFiles && proposal.supportFiles.length > 0 ? [
		"",
		"Support files:",
		...proposal.supportFiles.flatMap((file) => [
			"",
			`--- ${file.path} ---`,
			file.content
		])
	] : [];
	return [
		`Proposal: ${proposal.record.id}`,
		`Status: ${proposal.record.status}`,
		`Kind: ${proposal.record.kind}`,
		`Skill: ${proposal.record.target.skillKey}`,
		`Version: ${proposal.record.proposedVersion}`,
		`Scan: ${proposal.record.scan.state}`,
		"",
		proposal.content,
		...supportFiles
	].join("\n");
}
//#endregion
//#region src/agents/tools/skill-workshop-tool.ts
/**
* Skill Workshop built-in tool.
*
* Exposes proposal create/update/review/apply actions while the workshop service owns persistence.
*/
const SKILL_WORKSHOP_ACTIONS = [
	"create",
	"update",
	"revise",
	"list",
	"inspect",
	"apply",
	"reject",
	"quarantine"
];
const SKILL_WORKSHOP_PROPOSAL_ACTIONS = [
	"create",
	"revise",
	"list",
	"inspect"
];
const SKILL_WORKSHOP_PROPOSAL_COMPLETION_ACTIONS = [...SKILL_WORKSHOP_PROPOSAL_ACTIONS, "complete"];
const SKILL_WORKSHOP_MUTATION_ACTIONS = /* @__PURE__ */ new Set([
	"create",
	"update",
	"revise"
]);
const SKILL_PROPOSAL_STATUSES = [
	"pending",
	"applied",
	"rejected",
	"quarantined",
	"stale"
];
function buildSkillWorkshopToolSchema(proposalOnly, supportsCompletion) {
	const proposalActions = supportsCompletion ? SKILL_WORKSHOP_PROPOSAL_COMPLETION_ACTIONS : SKILL_WORKSHOP_PROPOSAL_ACTIONS;
	return typebox.Type.Object({
		action: require_typebox.stringEnum(proposalOnly ? proposalActions : SKILL_WORKSHOP_ACTIONS, { description: proposalOnly ? `create = new skill; revise = existing pending proposal; list/inspect discover pending proposals (not filesystem search).${supportsCompletion ? " complete = durably finish this review after all proposal work." : ""} Live-skill updates and lifecycle actions are unavailable.` : "create = new skill; update = existing live skill; revise = existing pending proposal; list/inspect discover pending proposals (not filesystem search); apply/reject/quarantine are explicit lifecycle actions." }),
		proposal_id: typebox.Type.Optional(typebox.Type.String({ description: "Existing proposal id for action=inspect, action=revise, action=apply, action=reject, or action=quarantine." })),
		name: typebox.Type.Optional(typebox.Type.String({ description: "Skill/proposal name. Required for create; for inspect/revise when proposal_id is unknown, resolves a pending proposal or returns candidates." })),
		query: typebox.Type.Optional(typebox.Type.String({ description: "Optional query for action=list." })),
		status: typebox.Type.Optional(require_typebox.stringEnum(SKILL_PROPOSAL_STATUSES, { description: "Optional proposal status filter for action=list." })),
		limit: typebox.Type.Optional(typebox.Type.Integer({
			minimum: 1,
			maximum: 50,
			description: "Maximum proposals to return for action=list. Defaults to 20."
		})),
		description: typebox.Type.Optional(typebox.Type.String({
			maxLength: 160,
			description: proposalOnly ? "Skill description for create/revise; max 160 bytes." : "Skill description for create/update/revise; max 160 bytes. On update, concise text shortens the proposal listing entry."
		})),
		skill_name: typebox.Type.Optional(typebox.Type.String({ description: "Existing skill name or key for action=update." })),
		proposal_content: typebox.Type.Optional(typebox.Type.String({ description: proposalOnly ? "Full proposed procedure markdown for action=create or action=revise. It will be stored as PROPOSAL.md. Keep under configured skills.workshop.maxSkillBytes; default max is 40000 bytes." : "Full proposed procedure markdown for action=create, action=update, or action=revise. It will be stored as PROPOSAL.md. Keep under configured skills.workshop.maxSkillBytes; default max is 40000 bytes." })),
		support_files: typebox.Type.Optional(typebox.Type.Array(typebox.Type.Object({
			path: typebox.Type.String({ description: "Relative support file path under assets/, examples/, references/, scripts/, or templates/." }),
			content: typebox.Type.String({ description: "Support file text content." })
		}, { additionalProperties: false }), { description: "Optional support files to store with the proposal." })),
		goal: typebox.Type.Optional(typebox.Type.String({ description: "Proposal or improvement goal." })),
		evidence: typebox.Type.Optional(typebox.Type.String({ description: "Short evidence or notes." })),
		reason: typebox.Type.Optional(typebox.Type.String({ description: "Optional reason for action=apply, action=reject, or action=quarantine." }))
	}, { additionalProperties: false });
}
function buildSkillWorkshopToolDescription(proposalOnly) {
	return proposalOnly ? "Inspect reusable-procedure proposals and create or revise pending proposals. Live-skill updates and lifecycle actions are unavailable." : "Create/update/revise/list/inspect/apply/reject/quarantine reusable-procedure proposals.";
}
/** Create the Skill Workshop tool for proposal discovery and lifecycle actions. */
function createSkillWorkshopTool(options) {
	return {
		label: "Skill Workshop",
		name: "skill_workshop",
		displaySummary: "Propose a reusable skill",
		description: buildSkillWorkshopToolDescription(options.proposalOnly === true),
		parameters: buildSkillWorkshopToolSchema(options.proposalOnly === true, options.proposalReviewCompletion !== void 0),
		execute: async (_toolCallId, args) => {
			const params = require_common.asToolParamsRecord(args);
			const action = require_common.readStringParam(params, "action", { required: true });
			const proposalActions = options.proposalReviewCompletion ? SKILL_WORKSHOP_PROPOSAL_COMPLETION_ACTIONS : SKILL_WORKSHOP_PROPOSAL_ACTIONS;
			if (options.proposalOnly === true && !proposalActions.includes(action)) throw new require_common.ToolInputError("this Skill Workshop session can only inspect or draft proposals");
			if (action === "complete") {
				if (!options.proposalReviewCompletion) throw new require_common.ToolInputError("this Skill Workshop session cannot complete a review");
				return await completeProposalReview(options.proposalReviewCompletion);
			}
			if (options.proposalReviewCompletion && proposalReviewPhase(options.proposalReviewCompletion) !== "open") throw new require_common.ToolInputError("this Skill Workshop review is already completing or complete");
			if (action === "list") {
				const status = readProposalStatusParam(params, SKILL_PROPOSAL_STATUSES);
				const query = require_common.readStringParam(params, "query");
				const limit = readListLimitParam(params);
				const proposals = listProposalEntries({
					proposals: (await require_service.listSkillProposals({
						workspaceDir: options.workspaceDir,
						env: options.env
					})).proposals,
					status,
					query,
					limit
				});
				return {
					content: [{
						type: "text",
						text: formatProposalList(proposals)
					}],
					details: { proposals }
				};
			}
			if (action === "inspect") {
				const proposal = await readProposalForInspect(params, options.workspaceDir, options.env);
				return proposalResult(proposal, {
					contentText: formatProposalInspect(proposal),
					includeContent: true
				});
			}
			if (action === "apply") {
				const applied = await require_service.applySkillProposal({
					workspaceDir: options.workspaceDir,
					config: options.config,
					env: options.env,
					proposalId: readLifecycleProposalIdParam(params),
					reason: require_common.readStringParam(params, "reason")
				});
				return actionResult(applied.record, {
					contentText: `Applied skill proposal ${applied.record.id}.`,
					targetSkillFile: applied.targetSkillFile
				});
			}
			if (action === "reject") {
				const rejected = await require_service.rejectSkillProposal({
					workspaceDir: options.workspaceDir,
					env: options.env,
					proposalId: readLifecycleProposalIdParam(params),
					reason: require_common.readStringParam(params, "reason")
				});
				return actionResult(rejected, { contentText: `Rejected skill proposal ${rejected.id}.` });
			}
			if (action === "quarantine") {
				const quarantined = await require_service.quarantineSkillProposal({
					workspaceDir: options.workspaceDir,
					env: options.env,
					proposalId: readLifecycleProposalIdParam(params),
					reason: require_common.readStringParam(params, "reason")
				});
				return actionResult(quarantined, { contentText: `Quarantined skill proposal ${quarantined.id}.` });
			}
			const proposalContent = require_common.readStringParam(params, "proposal_content", {
				required: true,
				label: "proposal_content",
				trim: false
			});
			if (proposalContent.trim().length === 0) throw new require_common.ToolInputError("proposal_content required");
			const supportFiles = readSupportFilesParam(params);
			const goal = require_common.readStringParam(params, "goal");
			const evidence = require_common.readStringParam(params, "evidence");
			const reservesMutation = SKILL_WORKSHOP_MUTATION_ACTIONS.has(action);
			if (reservesMutation && options.proposalMutationBudget !== void 0 && options.proposalMutationBudget.remaining <= 0) throw new require_common.ToolInputError("this Skill Workshop session has reached its proposal mutation limit");
			const releaseMutation = reservesMutation ? beginProposalReviewMutation(options.proposalReviewCompletion) : void 0;
			try {
				if (reservesMutation && options.proposalMutationBudget) options.proposalMutationBudget.remaining -= 1;
				let proposal;
				let contentText;
				if (action === "create") {
					proposal = await require_service.proposeCreateSkill({
						workspaceDir: options.workspaceDir,
						config: options.config,
						env: options.env,
						name: require_common.readStringParam(params, "name", { required: true }),
						description: require_common.readStringParam(params, "description", { required: true }),
						content: proposalContent,
						supportFiles,
						createdBy: "skill-workshop",
						...options.origin ? { origin: options.origin } : {},
						goal,
						evidence
					});
					contentText = proposalMutationText("Created skill proposal", proposal.record);
				} else if (action === "update") {
					proposal = await require_service.proposeUpdateSkill({
						workspaceDir: options.workspaceDir,
						config: options.config,
						env: options.env,
						agentId: options.agentId,
						skillName: require_common.readStringParam(params, "skill_name", {
							required: true,
							label: "skill_name"
						}),
						description: require_common.readStringParam(params, "description"),
						content: proposalContent,
						supportFiles,
						createdBy: "skill-workshop",
						...options.origin ? { origin: options.origin } : {},
						goal,
						evidence
					});
					contentText = proposalMutationText("Created skill update proposal", proposal.record);
				} else if (action === "revise") {
					const pendingProposal = await require_service.resolvePendingSkillProposal({
						proposalId: require_common.readStringParam(params, "proposal_id", { label: "proposal_id" }),
						name: require_common.readStringParam(params, "name"),
						workspaceDir: options.workspaceDir,
						env: options.env
					});
					proposal = await require_service.reviseSkillProposal({
						workspaceDir: options.workspaceDir,
						config: options.config,
						env: options.env,
						proposalId: pendingProposal.record.id,
						content: proposalContent,
						supportFiles,
						description: require_common.readStringParam(params, "description"),
						...options.origin ? { origin: options.origin } : {},
						goal,
						evidence
					});
					contentText = proposalMutationText("Revised skill proposal", proposal.record);
				} else throw new require_common.ToolInputError(`action must be one of ${SKILL_WORKSHOP_ACTIONS.join(", ")}`);
				if (reservesMutation && options.proposalMutationBudget) {
					const mutatedProposalIds = options.proposalMutationBudget.mutatedProposalIds ?? /* @__PURE__ */ new Set();
					mutatedProposalIds.add(proposal.record.id);
					options.proposalMutationBudget.mutatedProposalIds = mutatedProposalIds;
					options.proposalMutationBudget.completed = mutatedProposalIds.size;
					options.proposalMutationBudget.successfulMutations = (options.proposalMutationBudget.successfulMutations ?? 0) + 1;
					await options.proposalReviewCompletion?.recordProgress?.({
						proposalIds: [...mutatedProposalIds],
						remaining: options.proposalMutationBudget.remaining,
						successfulMutations: options.proposalMutationBudget.successfulMutations
					});
				}
				return proposalResult(proposal, { contentText });
			} catch (error) {
				if (reservesMutation && options.proposalMutationBudget) options.proposalMutationBudget.failedMutations = (options.proposalMutationBudget.failedMutations ?? 0) + 1;
				throw error;
			} finally {
				releaseMutation?.();
			}
		}
	};
}
//#endregion
//#region src/agents/tools/skill-workshop-tool-factory.ts
function createConfiguredSkillWorkshopTool(params) {
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.runId);
	const messageId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageId === void 0 ? void 0 : String(params.messageId));
	return createSkillWorkshopTool({
		workspaceDir: params.workspaceDir,
		config: params.config,
		env: params.run?.env,
		agentId: params.agentId,
		origin: params.run?.origin ?? {
			agentId: params.agentId,
			...sessionKey ? { sessionKey } : {},
			...runId ? { runId } : {},
			...messageId ? { messageId } : {}
		},
		proposalOnly: params.run?.proposalOnly,
		proposalMutationBudget: params.run?.proposalMutationBudget ?? (params.run?.proposalOnly ? { remaining: 1 } : void 0),
		proposalReviewCompletion: params.run?.proposalReviewCompletion
	});
}
//#endregion
//#region src/agents/operator-tools.ts
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
	options?.recordToolPrepStage?.("operator-tools:session-workspace");
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
	options?.recordToolPrepStage?.("operator-tools:image-tool");
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
	options?.recordToolPrepStage?.("operator-tools:image-generate-tool");
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
	options?.recordToolPrepStage?.("operator-tools:video-generate-tool");
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
	options?.recordToolPrepStage?.("operator-tools:music-generate-tool");
	const pdfTool = optionalMediaTools.pdf && options?.agentDir?.trim() ? require_web_tools.createPdfTool({
		config: options?.config,
		agentDir: options.agentDir,
		authProfileStore: options?.authProfileStore,
		workspaceDir,
		sandbox,
		fsPolicy: options?.fsPolicy,
		deferAutoModelResolution: true
	}) : null;
	options?.recordToolPrepStage?.("operator-tools:pdf-tool");
	const webSearchTool = require_web_tools.createWebSearchTool({
		config: options?.config,
		agentDir: options?.agentDir,
		sandboxed: options?.sandboxed,
		runtimeWebSearch: runtimeWebTools?.search,
		lateBindRuntimeConfig: true
	});
	options?.recordToolPrepStage?.("operator-tools:web-search-tool");
	const webFetchTool = require_web_tools.createWebFetchTool({
		config: options?.config,
		sandboxed: options?.sandboxed,
		runtimeWebFetch: runtimeWebTools?.fetch,
		lateBindRuntimeConfig: true
	});
	options?.recordToolPrepStage?.("operator-tools:web-fetch-tool");
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
	options?.recordToolPrepStage?.("operator-tools:message-tool");
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
	options?.recordToolPrepStage?.("operator-tools:nodes-tool");
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
		...options?.sandboxed ? [] : [createConfiguredSkillWorkshopTool({
			workspaceDir,
			config: resolvedConfig,
			agentId: sessionAgentId,
			sessionKey: options?.runSessionKey ?? options?.agentSessionKey,
			runId: options?.runId,
			messageId: options?.currentMessageId,
			run: options?.skillWorkshop
		})],
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
	options?.recordToolPrepStage?.("operator-tools:core-tool-list");
	let allTools = tools;
	if (!options?.disablePluginTools) {
		const existingToolNames = /* @__PURE__ */ new Set();
		for (const tool of tools) existingToolNames.add(tool.name);
		allTools = [...tools, ...resolveOperatorPluginToolsForOptions({
			options,
			resolvedConfig,
			existingToolNames
		})];
		options?.recordToolPrepStage?.("operator-tools:plugin-tools");
	}
	allTools = filterToolsByClientCaps(allTools, options?.clientCaps);
	options?.recordToolPrepStage?.("operator-tools:client-capabilities");
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
	options?.recordToolPrepStage?.("operator-tools:tool-hooks");
	return allTools.map((tool) => require_gateway.isToolWrappedWithBeforeToolCallHook(tool) ? tool : require_hook_helpers.wrapToolWithBeforeToolCallHook(tool, hookContext)).map(wrapGatewayCallerIdentity);
}
//#endregion
//#region src/skills/runtime/tool-dispatch.ts
/**
* Policy-enforcement seam for skill `command-dispatch: tool` invocations.
* Keep this aligned with the normal tool surfaces so GHSA-mhm4-93fw-4qr2
* stays closed across allow/deny, group, sandbox, and subagent policy layers.
*/
function resolveSkillDispatchTools(params) {
	const channel = require_message_channel.resolveGatewayMessageChannel(params.message.surface) ?? require_message_channel.resolveGatewayMessageChannel(params.message.provider) ?? void 0;
	const { agentId: resolvedAgentId, globalPolicy, globalProviderPolicy, agentPolicy, agentProviderPolicy, profile, providerProfile, profileAlsoAllow, providerProfileAlsoAllow } = require_agent_tools_policy.resolveEffectiveToolPolicy({
		config: params.cfg,
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		modelProvider: params.provider,
		modelId: params.model
	});
	const profilePolicy = require_tool_policy.resolveToolProfilePolicy(profile);
	const providerProfilePolicy = require_tool_policy.resolveToolProfilePolicy(providerProfile);
	const profilePolicyWithAlsoAllow = require_tool_policy.mergeAlsoAllowPolicy(profilePolicy, profileAlsoAllow);
	const providerProfilePolicyWithAlsoAllow = require_tool_policy.mergeAlsoAllowPolicy(providerProfilePolicy, providerProfileAlsoAllow);
	const groupId = params.sessionEntry?.groupId ?? params.groupId;
	const groupPolicy = require_agent_tools_policy.resolveGroupToolPolicy({
		config: params.cfg,
		sessionKey: params.sessionKey,
		spawnedBy: params.sessionEntry?.spawnedBy,
		messageProvider: channel,
		groupId,
		groupChannel: params.sessionEntry?.groupChannel,
		groupSpace: params.sessionEntry?.space,
		accountId: params.message.accountId,
		senderId: params.message.senderId ?? params.senderId,
		senderName: params.message.senderName,
		senderUsername: params.message.senderUsername,
		senderE164: params.message.senderE164
	});
	const senderPolicy = require_sender_tool_policy.resolveSenderToolPolicy({
		config: params.cfg,
		agentId: resolvedAgentId,
		messageProvider: channel,
		senderId: params.message.senderId ?? params.senderId,
		senderName: params.message.senderName,
		senderUsername: params.message.senderUsername,
		senderE164: params.message.senderE164
	});
	const sandboxRuntime = require_runtime_status.resolveSandboxRuntimeStatus({
		cfg: params.cfg,
		sessionKey: params.sessionKey
	});
	const sandboxPolicy = sandboxRuntime.sandboxed ? sandboxRuntime.toolPolicy : void 0;
	const subagentStore = require_subagent_capabilities.resolveSubagentCapabilityStore(params.sessionKey, { cfg: params.cfg });
	const subagentPolicy = require_subagent_capabilities.isSubagentEnvelopeSession(params.sessionKey, {
		cfg: params.cfg,
		store: subagentStore
	}) ? require_agent_tools_policy.resolveSubagentToolPolicyForSession(params.cfg, params.sessionKey, { store: subagentStore }) : void 0;
	const inheritedToolPolicy = require_agent_tools_policy.resolveInheritedToolPolicyForSession(params.cfg, params.sessionKey, { store: subagentStore });
	const explicitPolicyList = [
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
		inheritedToolPolicy
	];
	const explicitDenylist = require_tool_policy.collectExplicitDenylist(explicitPolicyList);
	const inheritedToolAllowlist = [];
	const cronCreatorToolAllowlist = [];
	const shouldCaptureCronCreatorToolAllowlist = explicitPolicyList.some(require_tool_policy.hasRestrictiveAllowPolicy) || explicitDenylist.length > 0;
	const beforeToolCallHookContext = params.skillCommand ? {
		cwd: params.workspaceDir,
		workspaceDir: params.workspaceDir,
		...params.sessionEntry?.skillsSnapshot ? { skillsSnapshot: params.sessionEntry.skillsSnapshot } : {},
		skillCommand: {
			commandName: params.skillCommand.name,
			...params.skillCommand.skillFile ? { skillFile: params.skillCommand.skillFile } : {},
			skillName: params.skillCommand.skillName,
			skillSource: params.skillCommand.skillSource ?? "unknown",
			...params.skillCommand.toolName ? { toolName: params.skillCommand.toolName } : {}
		}
	} : void 0;
	const policyFiltered = require_tool_policy_pipeline.applyToolPolicyPipeline({
		tools: createOperatorTools({
			agentSessionKey: params.sessionKey,
			agentChannel: channel,
			agentAccountId: params.message.accountId,
			agentTo: params.message.originatingTo ?? params.message.to,
			agentThreadId: params.message.messageThreadId ?? void 0,
			nativeChannelId: params.message.nativeChannelId,
			agentGroupId: groupId,
			agentGroupChannel: params.sessionEntry?.groupChannel,
			agentGroupSpace: params.sessionEntry?.space,
			agentMemberRoleIds: params.message.memberRoleIds,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			config: params.cfg,
			allowGatewaySubagentBinding: true,
			sandboxed: sandboxRuntime.sandboxed,
			requesterAgentIdOverride: params.agentId,
			requesterSenderId: params.senderId,
			sessionId: params.sessionEntry?.sessionId,
			currentChannelId: params.currentChannelId,
			...beforeToolCallHookContext ? { beforeToolCallHookContext } : {},
			modelProvider: params.provider,
			modelId: params.model,
			pluginToolAllowlist: require_tool_policy.collectExplicitAllowlist(explicitPolicyList),
			pluginToolDenylist: explicitDenylist,
			cronCreatorToolAllowlist: shouldCaptureCronCreatorToolAllowlist ? cronCreatorToolAllowlist : void 0,
			inheritedToolAllowlist,
			inheritedToolDenylist: explicitDenylist
		}),
		toolMeta: (tool) => require_tools.getPluginToolMeta(tool),
		warn: require_globals.logVerbose,
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
				agentId: resolvedAgentId
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
			workspaceDir: params.workspaceDir,
			toolDenylist: explicitDenylist
		})
	});
	if (explicitPolicyList.some(require_tool_policy.hasRestrictiveAllowPolicy)) require_tool_policy.replaceWithEffectiveToolAllowlist(inheritedToolAllowlist, policyFiltered);
	if (shouldCaptureCronCreatorToolAllowlist) require_web_tools.replaceWithEffectiveCronCreatorToolAllowlist(cronCreatorToolAllowlist, policyFiltered, (tool) => require_tools.getPluginToolMeta(tool));
	return policyFiltered;
}
//#endregion
exports.resolveSkillDispatchTools = resolveSkillDispatchTools;
