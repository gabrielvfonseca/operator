const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_init = require("./init-PqhbtEQA.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_embedded_agent_helpers = require("./embedded-agent-helpers-DJEcJifp.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_workspace = require("./workspace-oX0zfOZq.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
require("./config-DT0qiglW.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_facade_loader = require("./facade-loader-CNps1O4t.cjs");
const require_text_transforms_runtime = require("./text-transforms.runtime-B0pRaBUe.cjs");
const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
const require_host_compat = require("./host-compat-Dv3sKwAS.cjs");
const require_oauth = require("./oauth-D9-_YxyQ.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_workspace$1 = require("./workspace-BaJ9ukou.cjs");
const require_bootstrap_budget = require("./bootstrap-budget-B73ETWvB.cjs");
const require_bootstrap_files = require("./bootstrap-files-DNCXmTWO.cjs");
const require_heartbeat_system_prompt = require("./heartbeat-system-prompt-BKoDGXAZ.cjs");
const require_system_prompt_report = require("./system-prompt-report-B1gQuzkf.cjs");
const require_attempt_prompt_helpers = require("./attempt.prompt-helpers-Dk0zUrmw.cjs");
const require_input_provenance = require("./input-provenance-h9in5xc9.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_cli_session = require("./cli-session-CX50GYdw.cjs");
const require_context = require("./context-Ddgh80NW.cjs");
const require_hook_agent_context = require("./hook-agent-context-BIJTw8B_.cjs");
const require_system_prompt_params = require("./system-prompt-params-Bvd3P1G7.cjs");
const require_context_window_guard = require("./context-window-guard-1fyXlp_c.cjs");
const require_sandbox = require("./sandbox-CjshBxRn.cjs");
const require_sandbox_skills = require("./sandbox-skills-P4Y-NAVT.cjs");
const require_mcp_http_loopback_runtime = require("./mcp-http.loopback-runtime-CtJBYKwk.cjs");
const require_cli_auth_epoch = require("./cli-auth-epoch-BktnfdBu.cjs");
const require_claude_live_session = require("./claude-live-session-CRdHSCWt.cjs");
const require_helpers = require("./helpers-D33_rP9K.cjs");
const require_claude_skills_plugin = require("./claude-skills-plugin-D_URs_L7.cjs");
const require_mcp_grant_store = require("./mcp-grant-store-DElX7XIk.cjs");
const require_mcp_http = require("./mcp-http-BGcBda9b.cjs");
const require_session_history = require("./session-history-C9PqIPGl.cjs");
const require_workspace_run = require("./workspace-run-ChATJDr-.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_ai_internal_shared = require("@gabrielvfonseca/ai/internal/shared");
//#region src/plugin-sdk/anthropic-cli.ts
function loadFacadeModule() {
	return require_facade_loader.loadBundledPluginPublicSurfaceModuleSync({
		dirName: "anthropic",
		artifactBasename: "api.js"
	});
}
loadFacadeModule()["CLAUDE_CLI_BACKEND_ID"];
/** Returns whether a provider id belongs to the Claude CLI backend family. */
const isClaudeCliProvider = ((...args) => loadFacadeModule()["isClaudeCliProvider"](...args));
//#endregion
//#region src/agents/cli-runner/prepare-claude.ts
const CLAUDE_CLI_CONTEXT_MODEL_ALIASES = {
	opus: "claude-opus-4-8",
	"opus-4.8": "claude-opus-4-8",
	"opus-4-8": "claude-opus-4-8",
	"opus-4.7": "claude-opus-4-7",
	"opus-4-7": "claude-opus-4-7",
	"opus-4.6": "claude-opus-4-6",
	"opus-4-6": "claude-opus-4-6",
	sonnet: "claude-sonnet-5",
	"sonnet-5": "claude-sonnet-5",
	"sonnet-4.6": "claude-sonnet-4-6",
	"sonnet-4-6": "claude-sonnet-4-6"
};
function resolveNodeClaudePlacement(params) {
	if (params.backendId === "claude-cli" && params.execHost === "node" && !params.execNode?.trim()) throw new Error("node-placed Claude CLI session is missing execNode");
	return params.backendId === "claude-cli" && params.execHost === "node" && Boolean(params.execNode?.trim());
}
//#endregion
//#region src/agents/cli-runner/prepare.ts
/**
* Prepares CLI backend run context: backend config, prompts, bootstrap context,
* MCP, auth epoch, and reusable session metadata.
*/
function resolveClaudeCliContextModelId(modelId) {
	const trimmed = modelId.trim();
	return CLAUDE_CLI_CONTEXT_MODEL_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
const prepareDeps = {
	isWorkspaceBootstrapPending: require_workspace.isWorkspaceBootstrapPending,
	makeBootstrapWarn: require_bootstrap_files.makeBootstrapWarn,
	resolveBootstrapContextForRun: require_bootstrap_files.resolveBootstrapContextForRun,
	getActiveMcpLoopbackRuntime: require_mcp_http_loopback_runtime.getActiveMcpLoopbackRuntime,
	ensureMcpLoopbackServer: require_mcp_http.ensureMcpLoopbackServer,
	createMcpLoopbackServerConfig: require_mcp_http_loopback_runtime.createMcpLoopbackServerConfig,
	activateMcpLoopbackClientGrantCapture: require_mcp_grant_store.activateMcpLoopbackClientGrantCapture,
	deactivateMcpLoopbackClientGrantCapture: require_mcp_grant_store.deactivateMcpLoopbackClientGrantCapture,
	mintMcpLoopbackClientGrant: require_mcp_grant_store.mintMcpLoopbackClientGrant,
	revokeMcpLoopbackClientGrant: require_mcp_grant_store.revokeMcpLoopbackClientGrant,
	resolveMcpLoopbackScopedTools: require_mcp_http.resolveMcpLoopbackScopedTools,
	resolveOperatorReferencePaths: async (params) => (await Promise.resolve().then(() => require("./docs-path-BiZHk9Qh.cjs")).then((n) => n.docs_path_exports)).resolveOperatorReferencePaths(params),
	prepareClaudeCliSkillsPlugin: require_claude_skills_plugin.prepareClaudeCliSkillsPlugin,
	claudeCliSessionTranscriptHasContent: require_session_history.claudeCliSessionTranscriptHasContent,
	claudeCliSessionTranscriptHasOrphanedToolUse: require_session_history.claudeCliSessionTranscriptHasOrphanedToolUse,
	getClaudeLiveSessionGenerationForOwner: require_claude_live_session.getClaudeLiveSessionGenerationForOwner,
	resolveApiKeyForProfile: require_oauth.resolveApiKeyForProfile
};
function resolveReusableCliSessionId(reusableCliSession) {
	return reusableCliSession.mode === "reuse" || reusableCliSession.mode === "reuse-with-drift" ? reusableCliSession.sessionId : void 0;
}
function resolveCliSessionInvalidatedReason(reusableCliSession) {
	return reusableCliSession.mode === "invalidate" ? reusableCliSession.invalidatedReason : void 0;
}
function canTransportSystemPrompt(backend) {
	return backend.systemPromptWhen !== "never" && Boolean(backend.systemPromptArg || backend.systemPromptFileArg || backend.systemPromptFileConfigKey);
}
function normalizeOptionalMcpContextValue(value) {
	return value?.trim() || void 0;
}
function buildCliMcpExecSession(sessionEntry) {
	const execSession = {
		execHost: normalizeOptionalMcpContextValue(sessionEntry?.execHost),
		execSecurity: normalizeOptionalMcpContextValue(sessionEntry?.execSecurity),
		execAsk: normalizeOptionalMcpContextValue(sessionEntry?.execAsk),
		execNode: normalizeOptionalMcpContextValue(sessionEntry?.execNode)
	};
	return Object.values(execSession).some(Boolean) ? execSession : void 0;
}
function buildCliMcpExecOverrides(execOverrides) {
	if (!execOverrides) return;
	const scopedOverrides = {
		...execOverrides.host !== void 0 ? { host: execOverrides.host } : {},
		...execOverrides.security !== void 0 ? { security: execOverrides.security } : {},
		...execOverrides.ask !== void 0 ? { ask: execOverrides.ask } : {},
		...execOverrides.node !== void 0 ? { node: execOverrides.node } : {}
	};
	return Object.keys(scopedOverrides).length > 0 ? scopedOverrides : void 0;
}
function buildCliMcpBashElevated(bashElevated) {
	if (!bashElevated) return;
	return {
		enabled: bashElevated.enabled,
		allowed: bashElevated.allowed,
		defaultLevel: bashElevated.defaultLevel,
		...bashElevated.fullAccessAvailable !== void 0 ? { fullAccessAvailable: bashElevated.fullAccessAvailable } : {},
		...bashElevated.fullAccessBlockedReason !== void 0 ? { fullAccessBlockedReason: bashElevated.fullAccessBlockedReason } : {}
	};
}
function buildCliMcpChannelContext(channelContext, senderId) {
	const resolvedSenderId = normalizeOptionalMcpContextValue(senderId ?? void 0) ?? normalizeOptionalMcpContextValue(channelContext?.sender?.id);
	const chatId = normalizeOptionalMcpContextValue(channelContext?.chat?.id);
	if (!resolvedSenderId && !chatId) return;
	return {
		...resolvedSenderId ? { sender: { id: resolvedSenderId } } : {},
		...chatId ? { chat: { id: chatId } } : {}
	};
}
function resolveCliMcpMessageProvider(run) {
	return require_message_channel.normalizeMessageChannel(run.messageProvider ?? run.messageChannel) ?? void 0;
}
function resolveCliMcpSessionKey(run, config, agentId) {
	return require_main_session.canonicalizeMainSessionAlias({
		cfg: config,
		agentId,
		sessionKey: run.sessionKey?.trim() || "main"
	});
}
function buildCliMcpGrantContext(params) {
	const sessionKey = resolveCliMcpSessionKey(params.run, params.config, params.agentId);
	const clientCaps = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((params.run.clientCaps ?? []).map((cap) => cap.trim()).filter(Boolean));
	const execSession = buildCliMcpExecSession(params.run.sessionEntry);
	const execOverrides = buildCliMcpExecOverrides(params.run.execOverrides);
	const bashElevated = buildCliMcpBashElevated(params.run.bashElevated);
	const channelContext = buildCliMcpChannelContext(params.run.channelContext, params.run.senderId);
	const senderName = normalizeOptionalMcpContextValue(params.run.senderName ?? void 0);
	const senderUsername = normalizeOptionalMcpContextValue(params.run.senderUsername ?? void 0);
	const senderE164 = normalizeOptionalMcpContextValue(params.run.senderE164 ?? void 0);
	const groupId = normalizeOptionalMcpContextValue(params.run.groupId ?? void 0);
	const groupChannel = normalizeOptionalMcpContextValue(params.run.groupChannel ?? void 0);
	const groupSpace = normalizeOptionalMcpContextValue(params.run.groupSpace ?? void 0);
	const spawnedBy = normalizeOptionalMcpContextValue(params.run.spawnedBy ?? void 0);
	return {
		sessionKey,
		runtimePolicySessionKey: normalizeOptionalMcpContextValue(params.run.runtimePolicySessionKey),
		agentId: params.agentId,
		sessionId: normalizeOptionalMcpContextValue(params.run.sessionId),
		runId: normalizeOptionalMcpContextValue(params.run.runId),
		modelProvider: params.modelProvider,
		modelId: params.modelId,
		messageProvider: resolveCliMcpMessageProvider(params.run),
		clientCaps: clientCaps.length > 0 ? clientCaps : void 0,
		currentChannelId: normalizeOptionalMcpContextValue(params.run.currentChannelId),
		currentThreadTs: normalizeOptionalMcpContextValue(params.run.currentThreadTs),
		currentMessageId: params.run.currentMessageId == null ? void 0 : normalizeOptionalMcpContextValue(String(params.run.currentMessageId)),
		currentInboundAudio: params.run.currentInboundAudio === true ? true : void 0,
		accountId: normalizeOptionalMcpContextValue(params.run.agentAccountId),
		inboundEventKind: params.run.currentInboundEventKind,
		sourceReplyDeliveryMode: params.run.sourceReplyDeliveryMode,
		taskSuggestionDeliveryMode: params.run.taskSuggestionDeliveryMode,
		requireExplicitMessageTarget: params.requireExplicitMessageTarget ? true : void 0,
		senderIsOwner: params.run.senderIsOwner === true,
		nodeExecAllowed: true,
		...execSession ? { execSession } : {},
		...execOverrides ? { execOverrides } : {},
		...bashElevated ? { bashElevated } : {},
		...params.run.trigger ? { trigger: params.run.trigger } : {},
		...normalizeOptionalMcpContextValue(params.run.approvalReviewerDeviceId) ? { approvalReviewerDeviceId: params.run.approvalReviewerDeviceId?.trim() } : {},
		...channelContext ? { channelContext } : {},
		...senderName ? { senderName } : {},
		...senderUsername ? { senderUsername } : {},
		...senderE164 ? { senderE164 } : {},
		...groupId ? { groupId } : {},
		...groupChannel ? { groupChannel } : {},
		...groupSpace ? { groupSpace } : {},
		...spawnedBy ? { spawnedBy } : {}
	};
}
function buildCliSessionDriftUserContext(reusableCliSession) {
	if (reusableCliSession.mode !== "reuse-with-drift") return;
	return `Operator resumed this CLI session after prompt content changed. Follow the current turn's instructions; changed=${reusableCliSession.drift.reasons.join(",")}.`;
}
function prependCliSessionDriftUserContext(context, reusableCliSession) {
	const note = buildCliSessionDriftUserContext(reusableCliSession);
	if (!note) return context;
	if (!context) return { text: note };
	return {
		...context,
		text: [note, context.text].join("\n\n"),
		...context.resumableText ? { resumableText: [note, context.resumableText].join("\n\n") } : {}
	};
}
async function resolveCliSkillsPrompt(params) {
	const sandboxWorkspace = await require_sandbox.ensureSandboxWorkspaceForSession({
		config: params.config,
		sessionKey: params.sessionKey,
		workspaceDir: params.workspaceDir
	});
	if (!sandboxWorkspace) return require_workspace$1.resolveSkillsPromptForRun({
		skillsSnapshot: params.skillsSnapshot,
		workspaceDir: params.workspaceDir,
		config: params.config,
		agentId: params.agentId
	});
	const { skillsEligibility, skillsPromptWorkspaceDir, skillsSnapshot: skillsSnapshotForRun, skillsWorkspaceDir, workspaceOnly } = require_sandbox_skills.resolveSandboxSkillRuntimeInputs({
		sandbox: {
			enabled: true,
			...sandboxWorkspace.containerWorkdir ? { containerWorkdir: sandboxWorkspace.containerWorkdir } : {},
			...sandboxWorkspace.skillsEligibility ? { skillsEligibility: sandboxWorkspace.skillsEligibility } : {},
			...sandboxWorkspace.skillsWorkspaceDir ? { skillsWorkspaceDir: sandboxWorkspace.skillsWorkspaceDir } : {},
			...sandboxWorkspace.workspaceAccess ? { workspaceAccess: sandboxWorkspace.workspaceAccess } : {}
		},
		effectiveWorkspace: sandboxWorkspace.workspaceDir,
		skillsSnapshot: params.skillsSnapshot
	});
	const { shouldLoadSkillEntries, skillEntries } = require_sandbox_skills.resolveEmbeddedRunSkillEntries({
		workspaceDir: skillsWorkspaceDir,
		config: params.config,
		agentId: params.agentId,
		eligibility: skillsEligibility,
		skillsSnapshot: skillsSnapshotForRun,
		workspaceOnly
	});
	return require_workspace$1.resolveSkillsPromptForRun({
		skillsSnapshot: skillsSnapshotForRun,
		entries: require_sandbox_skills.mapSandboxSkillEntriesForPrompt({
			entries: shouldLoadSkillEntries ? skillEntries : void 0,
			skillsWorkspaceDir,
			skillsPromptWorkspaceDir
		}),
		workspaceDir: skillsPromptWorkspaceDir,
		config: params.config,
		agentId: params.agentId,
		eligibility: skillsEligibility
	});
}
/** Overrides preparation dependencies for CLI runner tests. */
function setCliRunnerPrepareTestDeps(overrides) {
	Object.assign(prepareDeps, overrides);
}
/** Returns whether profile-owned prepared execution should skip local CLI epoch hashing. */
function shouldSkipLocalCliCredentialEpoch(params) {
	return Boolean(params.authEpochMode === "profile-only" && params.authProfileId && params.authCredential && params.preparedExecution);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.cliRunnerPrepareTestApi")] = { setCliRunnerPrepareTestDeps: (overrides) => {
	setCliRunnerPrepareTestDeps(overrides);
} };
function shouldRefreshAuthProfileForExecution(params) {
	return Boolean(params.backendId === "google-gemini-cli" && params.authProfileId && (params.authCredential?.type === "oauth" || params.authCredential?.type === "api_key" || params.authCredential?.type === "token"));
}
/** Builds the complete context required to execute a CLI-backed agent run. */
async function prepareCliRunContext(params) {
	const internalParams = params;
	const started = Date.now();
	const executionMode = params.executionMode ?? "agent";
	const isSideQuestion = executionMode === "side-question";
	const workspaceResolution = require_workspace_run.resolveRunWorkspaceDir({
		workspaceDir: params.workspaceDir,
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		config: params.config
	});
	const resolvedWorkspace = workspaceResolution.workspaceDir;
	const redactedSessionId = require_workspace_run.redactRunIdentifier(params.sessionId);
	const redactedSessionKey = require_workspace_run.redactRunIdentifier(params.sessionKey);
	const redactedWorkspace = require_workspace_run.redactRunIdentifier(resolvedWorkspace);
	if (workspaceResolution.usedFallback) require_helpers.cliBackendLog.warn(`[workspace-fallback] caller=runCliAgent reason=${workspaceResolution.fallbackReason} run=${params.runId} session=${redactedSessionId} sessionKey=${redactedSessionKey} agent=${workspaceResolution.agentId} workspace=${redactedWorkspace}`);
	const workspaceDir = resolvedWorkspace;
	const cwd = params.cwd ? require_home_dir.resolveUserPath(params.cwd) : workspaceDir;
	const cwdHash = require_cli_session.hashCliSessionText(cwd);
	const backendResolved = require_cli_backends.resolveCliBackendConfig(params.provider, params.config, { agentId: params.agentId });
	if (!backendResolved) throw new Error(`Unknown CLI backend: ${params.provider}`);
	const nodeClaudePlacement = resolveNodeClaudePlacement({
		backendId: backendResolved.id,
		execHost: params.sessionEntry?.execHost,
		execNode: params.sessionEntry?.execNode
	});
	if (params.cliToolAvailability !== void 0 && (backendResolved.nativeToolMode !== "selectable" || !backendResolved.resolveExecutionArgs)) throw new Error(`CLI backend ${backendResolved.id} cannot enforce exact per-run tool availability`);
	if (params.toolsAllow !== void 0) throw new Error(`CLI backend ${backendResolved.id} cannot enforce runtime toolsAllow; use an embedded runtime for restricted tool policy`);
	const sideQuestionDisablesNativeTools = isSideQuestion && backendResolved.sideQuestionToolMode === "disabled";
	const requestedNoNativeTools = params.cliToolAvailability?.native.length === 0;
	if (params.disableTools === true && (backendResolved.nativeToolMode === "always-on" || backendResolved.nativeToolMode === "selectable" && !requestedNoNativeTools) && !sideQuestionDisablesNativeTools) throw new Error(`CLI backend ${backendResolved.id} cannot run with tools disabled because it exposes native tools`);
	const { defaultAgentId, sessionAgentId } = require_agent_scope.resolveSessionAgentIds({
		sessionKey: params.sessionKey,
		config: params.config,
		agentId: params.agentId
	});
	const agentContextTokens = require_agent_scope_config.resolveAgentConfig(params.config ?? {}, sessionAgentId)?.contextTokens;
	const agentDir = params.agentDir ?? require_agent_scope_config.resolveAgentDir(params.config ?? {}, sessionAgentId);
	let effectiveAuthProfileId = (params.authProfileId?.trim() || void 0) ?? backendResolved.defaultAuthProfileId?.trim() ?? void 0;
	let authStore;
	let authCredential;
	let resolvedProfileAuth;
	const loadScopedAuthStore = (options = {}) => require_store.loadAuthProfileStoreForRuntime(agentDir, {
		readOnly: options.readOnly ?? true,
		externalCli: require_external_cli_discovery.externalCliDiscoveryForProviderAuth({
			cfg: params.config,
			provider: params.provider,
			...options.profileId ? { profileId: options.profileId } : {}
		})
	});
	if (effectiveAuthProfileId) {
		authStore = loadScopedAuthStore({ profileId: effectiveAuthProfileId });
		authCredential = authStore.profiles[effectiveAuthProfileId];
	} else if (backendResolved.authEpochMode === "profile-only" || backendResolved.prepareExecution && backendResolved.autoSelectAuthProfile !== false) {
		authStore = loadScopedAuthStore();
		effectiveAuthProfileId = require_order.resolveAuthProfileOrder({
			cfg: params.config,
			store: authStore,
			provider: params.provider
		})[0]?.trim() || void 0;
		if (effectiveAuthProfileId) authCredential = authStore.profiles[effectiveAuthProfileId];
	}
	if (effectiveAuthProfileId && shouldRefreshAuthProfileForExecution({
		backendId: backendResolved.id,
		authProfileId: effectiveAuthProfileId,
		authCredential
	})) {
		const authProfileId = effectiveAuthProfileId;
		const writableAuthStore = loadScopedAuthStore({
			profileId: authProfileId,
			readOnly: false
		});
		const resolvedAuth = await prepareDeps.resolveApiKeyForProfile({
			cfg: params.config,
			store: writableAuthStore,
			profileId: authProfileId,
			agentDir
		});
		const resolvedAuthProfileId = resolvedAuth?.profileId ?? authProfileId;
		const resolvedAuthCredential = resolvedAuth?.credential;
		authStore = loadScopedAuthStore({ profileId: resolvedAuthProfileId });
		authCredential = resolvedAuthCredential ?? authStore.profiles[resolvedAuthProfileId];
		if (resolvedAuth && authCredential) {
			effectiveAuthProfileId = resolvedAuthProfileId;
			resolvedProfileAuth = {
				apiKey: resolvedAuth.apiKey,
				profileId: resolvedAuthProfileId,
				source: `profile:${resolvedAuthProfileId}`,
				mode: resolvedAuth.profileType === "api_key" ? "api-key" : resolvedAuth.profileType
			};
			if (authCredential.type === "api_key") authCredential = {
				...authCredential,
				key: resolvedAuth.apiKey
			};
			else if (authCredential.type === "token") authCredential = {
				...authCredential,
				token: resolvedAuth.apiKey
			};
		}
	}
	const extraSystemPrompt = params.extraSystemPrompt?.trim() ?? "";
	const bindingFacts = params.cliSessionBindingFacts;
	const bindingExtraSystemPromptStatic = bindingFacts?.extraSystemPromptStatic ?? params.extraSystemPromptStatic;
	const baseExtraSystemPromptHash = bindingExtraSystemPromptStatic !== void 0 ? require_cli_session.hashCliSessionText(bindingExtraSystemPromptStatic.trim() || void 0) : require_cli_session.hashCliSessionText(extraSystemPrompt);
	const toolBoundExtraSystemPromptHash = params.cliToolAvailability ? require_cli_session.hashCliSessionText(JSON.stringify([
		baseExtraSystemPromptHash ?? null,
		params.cliToolAvailability.native.toSorted(),
		params.cliToolAvailability.mcp.toSorted()
	])) : baseExtraSystemPromptHash;
	const requireExplicitMessageTarget = params.requireExplicitMessageTarget ?? require_session_key.isSubagentSessionKey(params.sessionKey);
	const hasCliSessionBindingFacts = bindingFacts !== void 0;
	const bindingRequireExplicitMessageTarget = bindingFacts?.requireExplicitMessageTarget ?? requireExplicitMessageTarget;
	const bindingSourceReplyDeliveryMode = hasCliSessionBindingFacts ? bindingFacts.sourceReplyDeliveryMode : params.sourceReplyDeliveryMode;
	const messageToolPolicyHash = bindingSourceReplyDeliveryMode !== void 0 || (hasCliSessionBindingFacts ? bindingFacts.requireExplicitMessageTarget !== void 0 || bindingRequireExplicitMessageTarget : params.requireExplicitMessageTarget !== void 0 || bindingRequireExplicitMessageTarget) ? require_cli_session.hashCliSessionText(JSON.stringify({
		sourceReplyDeliveryMode: bindingSourceReplyDeliveryMode,
		requireExplicitMessageTarget: bindingRequireExplicitMessageTarget
	})) : void 0;
	const modelId = (params.model ?? "default").trim() || "default";
	const modelProvider = normalizeOptionalMcpContextValue(params.modelProvider) ?? normalizeOptionalMcpContextValue(params.provider) ?? params.provider;
	const normalizedModel = require_helpers.normalizeCliModel(modelId, backendResolved.config);
	const modelDisplay = `${params.provider}/${modelId}`;
	const isClaudeCli = isClaudeCliProvider(params.provider);
	const requestedContextModelId = isClaudeCli ? resolveClaudeCliContextModelId(modelId) : modelId;
	const normalizedContextModelId = isClaudeCli ? resolveClaudeCliContextModelId(normalizedModel) : normalizedModel;
	const contextModelIds = [requestedContextModelId, ...normalizedContextModelId !== requestedContextModelId ? [normalizedContextModelId] : []];
	const resolveContextModelTokens = (contextModelId, allowUnscopedModelLookup) => require_context.resolveContextTokensForModel({
		cfg: params.config,
		provider: params.provider,
		modelProvider: backendResolved.modelProvider,
		model: contextModelId,
		allowAsyncLoad: false,
		allowUnscopedModelLookup
	});
	let modelContextTokens;
	for (const contextModelId of contextModelIds) {
		const candidateContextTokens = resolveContextModelTokens(contextModelId, false);
		if (candidateContextTokens !== void 0) modelContextTokens = modelContextTokens === void 0 ? candidateContextTokens : Math.min(modelContextTokens, candidateContextTokens);
	}
	if (modelContextTokens === void 0) for (const contextModelId of contextModelIds.toReversed()) {
		modelContextTokens = resolveContextModelTokens(contextModelId, true);
		if (modelContextTokens !== void 0) break;
	}
	modelContextTokens ??= require_defaults.DEFAULT_CONTEXT_TOKENS;
	const resolvedContextWindowInfo = require_context_window_guard.resolveContextWindowInfo({
		cfg: params.config,
		provider: params.provider,
		modelId,
		modelContextTokens,
		agentContextTokens,
		defaultTokens: require_defaults.DEFAULT_CONTEXT_TOKENS
	});
	const contextWindowInfo = resolvedContextWindowInfo.tokens > modelContextTokens ? {
		tokens: modelContextTokens,
		source: "model"
	} : resolvedContextWindowInfo;
	const autoReseedHistoryChars = isClaudeCli ? require_session_history.resolveAutoCliSessionReseedHistoryChars(contextWindowInfo.tokens) : void 0;
	const sessionLabel = params.sessionKey ?? params.sessionId;
	const { bootstrapFiles, contextFiles: resolvedContextFiles } = isSideQuestion ? {
		bootstrapFiles: [],
		contextFiles: []
	} : await prepareDeps.resolveBootstrapContextForRun({
		workspaceDir,
		config: params.config,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		agentId: sessionAgentId,
		contextMode: params.bootstrapContextMode,
		runKind: params.bootstrapContextRunKind,
		warn: prepareDeps.makeBootstrapWarn({
			sessionLabel,
			workspaceDir,
			warn: (message) => require_helpers.cliBackendLog.warn(message)
		})
	});
	const canonicalWorkspace = require_home_dir.resolveUserPath(require_agent_scope_config.resolveAgentWorkspaceDir(params.config ?? {}, workspaceResolution.agentId));
	const selectedNativeToolsProvideFileAccess = params.cliToolAvailability === void 0 || params.cliToolAvailability.native.length > 0;
	const hasBootstrapFileAccess = (backendResolved.nativeToolMode === "always-on" || backendResolved.nativeToolMode === "selectable") && selectedNativeToolsProvideFileAccess && params.disableTools !== true;
	const bootstrapRouting = isSideQuestion || !canTransportSystemPrompt(backendResolved.config) ? void 0 : await require_system_prompt_report.resolveWorkspaceBootstrapRouting({
		isWorkspaceBootstrapPending: prepareDeps.isWorkspaceBootstrapPending,
		bootstrapFiles,
		bootstrapFilesProvideAccess: false,
		bootstrapContextRunKind: params.bootstrapContextRunKind,
		trigger: params.trigger,
		sessionKey: params.sessionKey,
		isPrimaryRun: require_system_prompt_report.isPrimaryBootstrapRun(params.sessionKey),
		isCanonicalWorkspace: canonicalWorkspace === resolvedWorkspace,
		effectiveWorkspace: workspaceDir,
		resolvedWorkspace,
		hasBootstrapFileAccess
	});
	const bootstrapMode = bootstrapRouting?.bootstrapMode ?? "none";
	const includeBootstrapInSystemContext = bootstrapRouting?.includeBootstrapInSystemContext ?? true;
	const contextFiles = includeBootstrapInSystemContext ? resolvedContextFiles : resolvedContextFiles.filter((file) => !/(^|[\\/])BOOTSTRAP\.md$/iu.test(file.path.trim()));
	const bootstrapFilesForInjectionStats = includeBootstrapInSystemContext ? bootstrapFiles : bootstrapFiles.filter((file) => file.name !== require_workspace.DEFAULT_BOOTSTRAP_FILENAME);
	const bootstrapMaxChars = require_embedded_agent_helpers.resolveBootstrapMaxChars(params.config, sessionAgentId);
	const bootstrapTotalMaxChars = require_embedded_agent_helpers.resolveBootstrapTotalMaxChars(params.config, sessionAgentId);
	const bootstrapAnalysis = require_bootstrap_budget.analyzeBootstrapBudget({
		files: require_bootstrap_budget.buildBootstrapInjectionStats({
			bootstrapFiles: bootstrapFilesForInjectionStats,
			injectedFiles: contextFiles
		}),
		bootstrapMaxChars,
		bootstrapTotalMaxChars
	});
	const bootstrapPromptWarningMode = require_embedded_agent_helpers.resolveBootstrapPromptTruncationWarningMode(params.config);
	const bootstrapPromptWarning = require_bootstrap_budget.buildBootstrapPromptWarning({
		analysis: bootstrapAnalysis,
		mode: bootstrapPromptWarningMode,
		seenSignatures: params.bootstrapPromptWarningSignaturesSeen,
		previousSignature: params.bootstrapPromptWarningSignature
	});
	const extraSystemPromptHash = bootstrapMode === "none" ? toolBoundExtraSystemPromptHash : require_cli_session.hashCliSessionText(JSON.stringify([toolBoundExtraSystemPromptHash ?? null, bootstrapMode]));
	const systemAgentMcpConfig = internalParams.systemAgentTool ? require_claude_live_session.buildSystemAgentToolsMcpServerConfig(internalParams.systemAgentTool) : void 0;
	const bundleMcpEnabled = !nodeClaudePlacement && !isSideQuestion && !systemAgentMcpConfig && backendResolved.bundleMcp && params.disableTools !== true;
	let mcpLoopbackRuntime = bundleMcpEnabled ? prepareDeps.getActiveMcpLoopbackRuntime() : void 0;
	if (bundleMcpEnabled && !mcpLoopbackRuntime) {
		try {
			await prepareDeps.ensureMcpLoopbackServer();
		} catch (error) {
			throw new Error(`Bundled MCP is enabled, but the Operator MCP loopback server failed to start: ${String(error)}`, { cause: error });
		}
		mcpLoopbackRuntime = prepareDeps.getActiveMcpLoopbackRuntime();
	}
	if (bundleMcpEnabled && !mcpLoopbackRuntime) throw new Error("Bundled MCP is enabled, but the Operator MCP loopback server did not publish a runtime after startup.");
	const mcpDeliveryCaptureEnabled = bundleMcpEnabled && Boolean(mcpLoopbackRuntime);
	let cleanupPreparedResources;
	let preparedExecution;
	try {
		const mcpClientGrant = mcpLoopbackRuntime ? prepareDeps.mintMcpLoopbackClientGrant({
			context: buildCliMcpGrantContext({
				run: params,
				config: params.config ?? require_io.getRuntimeConfig(),
				requireExplicitMessageTarget,
				agentId: sessionAgentId,
				modelProvider,
				modelId
			}),
			runtimeOwnerToken: mcpLoopbackRuntime.ownerToken
		}) : void 0;
		const mcpClientGrantCapture = mcpClientGrant && mcpLoopbackRuntime ? {
			activate: (captureKey) => {
				if (!prepareDeps.activateMcpLoopbackClientGrantCapture({
					token: mcpClientGrant.token,
					runtimeOwnerToken: mcpLoopbackRuntime.ownerToken,
					captureKey
				})) throw new Error("CLI MCP client grant is no longer valid for this Gateway runtime");
			},
			deactivate: (captureKey) => {
				prepareDeps.deactivateMcpLoopbackClientGrantCapture({
					token: mcpClientGrant.token,
					runtimeOwnerToken: mcpLoopbackRuntime.ownerToken,
					captureKey
				});
			}
		} : void 0;
		let mcpClientGrantRevoked = false;
		const cleanupMcpClientGrant = mcpClientGrant ? async () => {
			if (mcpClientGrantRevoked) return;
			mcpClientGrantRevoked = true;
			prepareDeps.revokeMcpLoopbackClientGrant(mcpClientGrant.token);
		} : void 0;
		cleanupPreparedResources = cleanupMcpClientGrant;
		const preparedBackend = await require_claude_live_session.prepareCliBundleMcpConfig({
			enabled: bundleMcpEnabled || systemAgentMcpConfig !== void 0,
			mode: backendResolved.bundleMcpMode,
			backend: backendResolved.config,
			workspaceDir,
			config: params.config,
			agentDir,
			...systemAgentMcpConfig ? { exclusiveConfig: systemAgentMcpConfig } : {},
			additionalConfig: mcpLoopbackRuntime ? prepareDeps.createMcpLoopbackServerConfig(mcpLoopbackRuntime.port) : void 0,
			env: mcpLoopbackRuntime && mcpClientGrant ? {
				OPERATOR_MCP_TOKEN: mcpClientGrant.token,
				OPERATOR_MCP_CLI_CAPTURE_KEY: ""
			} : void 0,
			warn: (message) => require_helpers.cliBackendLog.warn(message)
		});
		const cleanupPreparedBackend = preparedBackend.cleanup || cleanupMcpClientGrant ? async () => {
			try {
				await preparedBackend.cleanup?.();
			} finally {
				await cleanupMcpClientGrant?.();
			}
		} : void 0;
		cleanupPreparedResources = cleanupPreparedBackend;
		const prepareExecutionContext = {
			config: params.config,
			workspaceDir,
			agentDir,
			provider: params.provider,
			modelId,
			contextTokenBudget: contextWindowInfo.tokens,
			authProfileId: effectiveAuthProfileId,
			executionMode,
			env: preparedBackend.env
		};
		preparedExecution = nodeClaudePlacement ? void 0 : await backendResolved.prepareExecution?.(backendResolved.id === "google-gemini-cli" ? {
			...prepareExecutionContext,
			authCredential
		} : prepareExecutionContext);
		const preparedBackendCleanup = cleanupPreparedBackend || preparedExecution?.cleanup ? async () => {
			try {
				await preparedExecution?.cleanup?.();
			} finally {
				await cleanupPreparedBackend?.();
			}
		} : void 0;
		cleanupPreparedResources = preparedBackendCleanup;
		const skipLocalCredentialEpoch = shouldSkipLocalCliCredentialEpoch({
			authEpochMode: backendResolved.authEpochMode,
			authProfileId: effectiveAuthProfileId,
			authCredential,
			preparedExecution
		});
		const authEpoch = await require_cli_auth_epoch.resolveCliAuthEpoch({
			provider: params.provider,
			agentDir,
			authProfileId: effectiveAuthProfileId,
			skipLocalCredential: skipLocalCredentialEpoch
		});
		const authBindingFingerprint = params.onSuccessfulAuthBinding ? require_cli_auth_epoch.resolveCliAuthBindingFingerprint({
			provider: params.provider,
			config: params.config ?? require_io.getRuntimeConfig(),
			agentDir,
			...effectiveAuthProfileId ? { authProfileId: effectiveAuthProfileId } : {},
			...resolvedProfileAuth ? { resolvedAuth: resolvedProfileAuth } : {},
			...skipLocalCredentialEpoch ? { skipLocalCredential: true } : {}
		}) : void 0;
		const preparedBackendEnv = preparedExecution?.env && Object.keys(preparedExecution.env).length > 0 ? {
			...preparedBackend.env,
			...preparedExecution.env
		} : preparedBackend.env;
		const preparedBackendBeforeExecution = preparedBackend.beforeExecution || preparedExecution?.beforeExecution ? async () => {
			await preparedBackend.beforeExecution?.();
			await preparedExecution?.beforeExecution?.();
		} : void 0;
		const claudeSkillsPlugin = isSideQuestion || nodeClaudePlacement ? {
			args: [],
			cleanup: async () => {}
		} : await prepareDeps.prepareClaudeCliSkillsPlugin({
			backendId: backendResolved.id,
			skillsSnapshot: params.skillsSnapshot
		});
		const preparedCleanup = preparedBackendCleanup || claudeSkillsPlugin.args.length > 0 ? async () => {
			try {
				await claudeSkillsPlugin.cleanup();
			} finally {
				await preparedBackendCleanup?.();
			}
		} : void 0;
		cleanupPreparedResources = preparedCleanup ?? preparedBackendCleanup;
		const preparedBackendClearEnv = [...preparedBackend.backend.clearEnv ?? [], ...preparedExecution?.clearEnv ?? []];
		const sideQuestionBackend = (() => {
			const { liveSession: _liveSession, ...backend } = preparedBackend.backend;
			return {
				...backend,
				sessionMode: "none"
			};
		})();
		const processPerTurnBackend = (() => {
			const { liveSession: _liveSession, ...backend } = preparedBackend.backend;
			return backend;
		})();
		const preparedBackendFinal = {
			...preparedBackend,
			backend: {
				...isSideQuestion ? sideQuestionBackend : params.disableCliLiveSession ? processPerTurnBackend : preparedBackend.backend,
				...preparedBackendClearEnv.length > 0 ? { clearEnv: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(preparedBackendClearEnv) } : {}
			},
			...preparedBackendEnv ? { env: preparedBackendEnv } : {},
			...preparedBackendBeforeExecution ? { beforeExecution: preparedBackendBeforeExecution } : {},
			...mcpClientGrantCapture ? { mcpClientGrantCapture } : {},
			...preparedCleanup ? { cleanup: preparedCleanup } : {}
		};
		const promptTools = bundleMcpEnabled && mcpLoopbackRuntime ? prepareDeps.resolveMcpLoopbackScopedTools({
			cfg: params.config ?? require_io.getRuntimeConfig(),
			sessionKey: resolveCliMcpSessionKey(params, params.config ?? require_io.getRuntimeConfig(), sessionAgentId),
			runtimePolicySessionKey: normalizeOptionalMcpContextValue(params.runtimePolicySessionKey),
			agentId: sessionAgentId,
			messageProvider: resolveCliMcpMessageProvider(params),
			clientCaps: params.clientCaps,
			currentChannelId: params.currentChannelId,
			currentThreadTs: void 0,
			currentMessageId: void 0,
			currentInboundAudio: void 0,
			accountId: params.agentAccountId,
			inboundEventKind: void 0,
			sourceReplyDeliveryMode: bindingSourceReplyDeliveryMode,
			taskSuggestionDeliveryMode: params.taskSuggestionDeliveryMode,
			requireExplicitMessageTarget: bindingRequireExplicitMessageTarget,
			senderIsOwner: params.senderIsOwner === true,
			nodeExecAllowed: true,
			modelProvider,
			modelId,
			execSession: buildCliMcpExecSession(params.sessionEntry),
			execOverrides: buildCliMcpExecOverrides(params.execOverrides),
			bashElevated: buildCliMcpBashElevated(params.bashElevated),
			trigger: params.trigger,
			approvalReviewerDeviceId: normalizeOptionalMcpContextValue(params.approvalReviewerDeviceId),
			channelContext: buildCliMcpChannelContext(params.channelContext, params.senderId),
			senderName: normalizeOptionalMcpContextValue(params.senderName ?? void 0),
			senderUsername: normalizeOptionalMcpContextValue(params.senderUsername ?? void 0),
			senderE164: normalizeOptionalMcpContextValue(params.senderE164 ?? void 0),
			groupId: normalizeOptionalMcpContextValue(params.groupId ?? void 0),
			groupChannel: normalizeOptionalMcpContextValue(params.groupChannel ?? void 0),
			groupSpace: normalizeOptionalMcpContextValue(params.groupSpace ?? void 0),
			spawnedBy: normalizeOptionalMcpContextValue(params.spawnedBy ?? void 0)
		}).tools : [];
		const promptToolNamesHash = bundleMcpEnabled && mcpLoopbackRuntime ? require_cli_session.hashCliSessionText(JSON.stringify(promptTools.map((tool) => tool.name).toSorted())) : void 0;
		const reusableCliSessionCandidate = isSideQuestion || preparedBackendFinal.backend.sessionMode === "none" ? { mode: "none" } : params.cliSessionBinding ? require_cli_session.resolveCliSessionReuse({
			binding: params.cliSessionBinding,
			authProfileId: effectiveAuthProfileId,
			authEpoch,
			authEpochVersion: 6,
			extraSystemPromptHash,
			messageToolPolicyHash,
			promptToolNamesHash,
			cwdHash,
			mcpConfigHash: preparedBackendFinal.mcpConfigHash,
			mcpResumeHash: preparedBackendFinal.mcpResumeHash
		}) : params.cliSessionId ? {
			mode: "reuse",
			sessionId: params.cliSessionId
		} : { mode: "none" };
		const backendReusableCliSession = reusableCliSessionCandidate.mode === "reuse-with-drift" && !canTransportSystemPrompt(preparedBackendFinal.backend) ? {
			mode: "invalidate",
			invalidatedReason: "system-prompt"
		} : reusableCliSessionCandidate;
		const candidateClaudeCliSessionId = resolveReusableCliSessionId(backendReusableCliSession)?.trim() || void 0;
		const hasClaudeCliCandidate = !nodeClaudePlacement && candidateClaudeCliSessionId !== void 0 && isClaudeCliProvider(params.provider);
		const claudeCliTranscriptMissing = hasClaudeCliCandidate && !await prepareDeps.claudeCliSessionTranscriptHasContent({
			sessionId: candidateClaudeCliSessionId,
			workspaceDir: cwd
		});
		const managedClaudeLiveSessionGeneration = claudeCliTranscriptMissing && backendResolved.id === "claude-cli" && "liveSession" in preparedBackendFinal.backend && preparedBackendFinal.backend.liveSession === "claude-stdio" && preparedBackendFinal.backend.output === "jsonl" && preparedBackendFinal.backend.input === "stdin" && prepareDeps.getClaudeLiveSessionGenerationForOwner({
			backendId: backendResolved.id,
			agentAccountId: params.agentAccountId,
			agentId: params.agentId,
			authProfileId: effectiveAuthProfileId,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey
		});
		const hasManagedClaudeLiveSession = Boolean(managedClaudeLiveSessionGeneration);
		const claudeCliTranscriptOrphanedToolUse = hasClaudeCliCandidate && !claudeCliTranscriptMissing && await prepareDeps.claudeCliSessionTranscriptHasOrphanedToolUse({
			sessionId: candidateClaudeCliSessionId,
			workspaceDir: cwd
		});
		const claudeCliInvalidatedReason = claudeCliTranscriptMissing && !hasManagedClaudeLiveSession ? "missing-transcript" : claudeCliTranscriptOrphanedToolUse ? "orphaned-tool-use" : void 0;
		const reusableCliSession = claudeCliInvalidatedReason ? {
			mode: "invalidate",
			invalidatedReason: claudeCliInvalidatedReason
		} : backendReusableCliSession;
		const reusableCliSessionId = resolveReusableCliSessionId(reusableCliSession);
		const invalidatedReason = resolveCliSessionInvalidatedReason(reusableCliSession);
		if (invalidatedReason) require_helpers.cliBackendLog.info(`cli session reset: provider=${params.provider} reason=${invalidatedReason}`);
		let openClawHistoryMessages;
		const loadOperatorHistoryMessages = async () => {
			openClawHistoryMessages ??= await require_session_history.loadCliSessionHistoryMessages({
				sessionId: params.sessionId,
				sessionFile: params.sessionFile,
				sessionKey: params.sessionKey,
				agentId: params.agentId,
				config: params.config
			});
			return openClawHistoryMessages;
		};
		const heartbeatPrompt = isSideQuestion || params.bootstrapContextRunKind === "commitment-only" ? void 0 : require_heartbeat_system_prompt.resolveHeartbeatPromptForSystemPrompt({
			config: params.config,
			agentId: sessionAgentId,
			defaultAgentId
		});
		const openClawReferences = isSideQuestion ? {
			docsPath: null,
			sourcePath: null
		} : await prepareDeps.resolveOperatorReferencePaths({
			workspaceDir,
			argv1: process.argv[1],
			cwd,
			moduleUrl: require("url").pathToFileURL(__filename).href
		});
		const systemPromptSkillsPrompt = isSideQuestion || nodeClaudePlacement || claudeSkillsPlugin.args.length > 0 ? "" : await resolveCliSkillsPrompt({
			skillsSnapshot: params.skillsSnapshot,
			workspaceDir,
			config: params.config,
			agentId: sessionAgentId,
			sessionKey: params.sessionKey?.trim() || params.sessionId
		});
		const runtimeChannel = isSideQuestion ? void 0 : require_message_channel.normalizeMessageChannel(params.messageChannel ?? params.messageProvider);
		const runtimeCapabilities = isSideQuestion ? void 0 : require_system_prompt_report.collectRuntimeChannelCapabilities({
			cfg: params.config,
			channel: runtimeChannel,
			accountId: params.agentAccountId
		});
		const builtSystemPrompt = isSideQuestion ? extraSystemPrompt : require_helpers.buildCliAgentSystemPrompt({
			workspaceDir,
			cwd,
			config: params.config,
			defaultThinkLevel: params.thinkLevel,
			extraSystemPrompt,
			sourceReplyDeliveryMode: bindingSourceReplyDeliveryMode,
			requireExplicitMessageTarget: bindingRequireExplicitMessageTarget,
			silentReplyPromptMode: params.silentReplyPromptMode,
			runtimeChannel,
			runtimeChatType: params.sessionEntry?.chatType,
			runtimeCapabilities,
			ownerNumbers: params.ownerNumbers,
			heartbeatPrompt,
			docsPath: openClawReferences.docsPath ?? void 0,
			sourcePath: openClawReferences.sourcePath ?? void 0,
			skillsPrompt: systemPromptSkillsPrompt,
			tools: promptTools,
			contextFiles,
			bootstrapMode,
			modelDisplay,
			agentId: sessionAgentId,
			sessionKey: params.sessionKey,
			sessionId: params.sessionId
		});
		let systemPrompt = !isSideQuestion ? backendResolved.transformSystemPrompt?.({
			config: params.config,
			workspaceDir,
			provider: params.provider,
			modelId,
			modelDisplay,
			agentId: sessionAgentId,
			systemPrompt: builtSystemPrompt
		}) ?? builtSystemPrompt : builtSystemPrompt;
		let preparedPrompt = params.prompt;
		if (!isSideQuestion) {
			const hookRunner = require_hook_runner_global.getGlobalHookRunner();
			try {
				const hookResult = await require_attempt_prompt_helpers.resolvePromptBuildHookResult({
					config: params.config ?? require_io.getRuntimeConfig(),
					prompt: params.prompt,
					messages: await loadOperatorHistoryMessages(),
					hookCtx: {
						runId: params.runId,
						agentId: sessionAgentId,
						sessionKey: params.sessionKey,
						sessionId: params.sessionId,
						workspaceDir,
						modelProviderId: params.provider,
						modelId,
						trigger: params.trigger,
						...require_hook_agent_context.buildAgentHookContextChannelFields(params)
					},
					hookRunner,
					bootstrapContextRunKind: params.bootstrapContextRunKind
				});
				if (hookResult.prependContext) preparedPrompt = `${hookResult.prependContext}\n\n${preparedPrompt}`;
				if (hookResult.appendContext) preparedPrompt = `${preparedPrompt}\n\n${hookResult.appendContext}`;
				const hookSystemPrompt = hookResult.systemPrompt?.trim();
				if (hookSystemPrompt) systemPrompt = hookSystemPrompt;
				systemPrompt = require_system_prompt_report.composeSystemPromptWithHookContext({
					baseSystemPrompt: systemPrompt,
					prependSystemContext: hookResult.prependSystemContext,
					appendSystemContext: hookResult.appendSystemContext
				}) ?? systemPrompt;
				const mediaTaskSystemPromptAddition = require_attempt_prompt_helpers.resolveAttemptMediaTaskSystemPromptAddition({
					sessionKey: params.sessionKey,
					trigger: params.trigger
				});
				if (mediaTaskSystemPromptAddition) systemPrompt = require_attempt_prompt_helpers.prependSystemPromptAddition({
					systemPrompt: (0, _gabrielvfonseca_ai_internal_shared.ensureSystemPromptCacheBoundary)(systemPrompt),
					systemPromptAddition: mediaTaskSystemPromptAddition
				});
			} catch (error) {
				require_helpers.cliBackendLog.warn(`cli prompt-build hook preparation failed: ${String(error)}`);
			}
		}
		let historyPromptCurrentTurn = preparedPrompt;
		if (!isSideQuestion) {
			const currentInboundContext = prependCliSessionDriftUserContext(params.currentInboundContext, reusableCliSession);
			const fullCurrentInboundPrompt = require_system_prompt_report.buildCurrentInboundPrompt({
				context: currentInboundContext,
				prompt: preparedPrompt
			});
			const runCurrentInboundPrompt = require_system_prompt_report.buildCurrentInboundPrompt({
				context: currentInboundContext,
				prompt: preparedPrompt,
				preferResumableText: params.currentInboundEventKind === "room_event" && Boolean(reusableCliSessionId)
			});
			historyPromptCurrentTurn = require_input_provenance.annotateInterSessionPromptText(fullCurrentInboundPrompt, params.inputProvenance);
			preparedPrompt = require_input_provenance.annotateInterSessionPromptText(runCurrentInboundPrompt, params.inputProvenance);
		}
		const allowRawTranscriptReseed = backendResolved.config.reseedFromRawTranscriptWhenUncompacted === true;
		const rawTranscriptReseedReason = reusableCliSessionId ? "session-expired" : invalidatedReason;
		const openClawHistoryPrompt = !isSideQuestion && (!reusableCliSessionId || allowRawTranscriptReseed) ? require_session_history.buildCliSessionHistoryPrompt({
			messages: await require_session_history.loadCliSessionReseedMessages({
				sessionId: params.sessionId,
				sessionFile: params.sessionFile,
				sessionKey: params.sessionKey,
				agentId: params.agentId,
				config: params.config,
				allowRawTranscriptReseed,
				rawTranscriptReseedReason
			}),
			prompt: historyPromptCurrentTurn,
			maxHistoryChars: autoReseedHistoryChars
		}) : void 0;
		const systemPromptWithReplacements = require_text_transforms_runtime.applyPluginTextReplacements(systemPrompt, backendResolved.textTransforms?.input);
		systemPrompt = isSideQuestion ? systemPromptWithReplacements : require_system_prompt_params.appendModelIdentitySystemPrompt({
			systemPrompt: require_system_prompt_params.buildModelIdentityPromptLine(modelDisplay) && systemPromptWithReplacements.trim().length > 0 ? (0, _gabrielvfonseca_ai_internal_shared.ensureSystemPromptCacheBoundary)(systemPromptWithReplacements) : systemPromptWithReplacements,
			model: modelDisplay
		});
		const systemPromptReport = require_system_prompt_report.buildSystemPromptReport({
			source: "run",
			generatedAt: Date.now(),
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			provider: params.provider,
			model: modelId,
			workspaceDir,
			bootstrapMaxChars,
			bootstrapTotalMaxChars,
			bootstrapTruncation: require_bootstrap_budget.buildBootstrapTruncationReportMeta({
				analysis: bootstrapAnalysis,
				warningMode: bootstrapPromptWarningMode,
				warning: bootstrapPromptWarning
			}),
			sandbox: {
				mode: "off",
				sandboxed: false
			},
			systemPrompt,
			bootstrapFiles: bootstrapFilesForInjectionStats,
			injectedFiles: contextFiles,
			skillsPrompt: systemPromptSkillsPrompt,
			tools: promptTools,
			currentTurn: {
				...params.currentInboundEventKind ? { kind: params.currentInboundEventKind } : {},
				promptChars: preparedPrompt.length,
				runtimeContextChars: 0
			}
		});
		const contextEngineConfig = params.config ?? require_io.getRuntimeConfig();
		if (isSideQuestion) return {
			params: {
				...params,
				config: contextEngineConfig,
				prompt: preparedPrompt,
				...requireExplicitMessageTarget ? { requireExplicitMessageTarget: true } : {}
			},
			effectiveAuthProfileId,
			agentDir,
			started,
			workspaceDir,
			cwd,
			backendResolved,
			preparedBackend: preparedBackendFinal,
			reusableCliSession,
			hadSessionFile: false,
			contextEngineConfig,
			modelId,
			normalizedModel,
			contextWindowInfo,
			systemPrompt,
			systemPromptReport,
			claudeSkillsPluginArgs: claudeSkillsPlugin.args,
			bootstrapPromptWarningLines: bootstrapPromptWarning.lines,
			authEpoch,
			authBindingFingerprint,
			...skipLocalCredentialEpoch ? { authBindingSkipsLocalCredential: true } : {},
			authEpochVersion: 6,
			extraSystemPromptHash,
			messageToolPolicyHash,
			promptToolNamesHash,
			cwdHash,
			...mcpDeliveryCaptureEnabled ? { mcpDeliveryCapture: true } : {}
		};
		require_init.ensureContextEnginesInitialized();
		const { sessionAgentId: contextEngineSessionAgentId } = require_agent_scope.resolveSessionAgentIds({
			sessionKey: params.sessionKey,
			config: contextEngineConfig,
			agentId: params.agentId
		});
		const resolvedContextEngine = await require_registry.resolveContextEngine(contextEngineConfig, {
			agentDir: require_agent_scope_config.resolveAgentDir(contextEngineConfig, contextEngineSessionAgentId),
			workspaceDir
		});
		const contextEngine = resolvedContextEngine.info.id !== "legacy" ? resolvedContextEngine : void 0;
		if (contextEngine) require_host_compat.assertContextEngineHostSupport({
			contextEngine,
			operation: "agent-run",
			host: require_host_compat.buildGenericCliContextEngineHostSupport({
				backendId: backendResolved.id,
				capabilities: backendResolved.contextEngineHostCapabilities
			})
		});
		const hadSessionFile = await require_session_history.hasCliSessionTranscript({
			sessionId: params.sessionId,
			sessionFile: params.sessionFile,
			sessionKey: params.sessionKey,
			agentId: params.agentId,
			config: contextEngineConfig
		});
		const contextEngineTurnPrompt = params.transcriptPrompt ?? params.prompt;
		return {
			params: {
				...params,
				config: contextEngineConfig,
				prompt: preparedPrompt,
				...requireExplicitMessageTarget ? { requireExplicitMessageTarget: true } : {}
			},
			effectiveAuthProfileId,
			agentDir,
			started,
			workspaceDir,
			cwd,
			backendResolved,
			preparedBackend: preparedBackendFinal,
			reusableCliSession,
			...managedClaudeLiveSessionGeneration ? { requiredClaudeLiveSessionGeneration: managedClaudeLiveSessionGeneration } : {},
			hadSessionFile,
			contextEngineConfig,
			contextEngine,
			contextEngineTurnPrompt,
			modelId,
			normalizedModel,
			contextWindowInfo,
			systemPrompt,
			systemPromptReport,
			claudeSkillsPluginArgs: claudeSkillsPlugin.args,
			bootstrapPromptWarningLines: bootstrapPromptWarning.lines,
			...openClawHistoryPrompt ? { openClawHistoryPrompt } : {},
			heartbeatPrompt,
			authEpoch,
			authBindingFingerprint,
			...skipLocalCredentialEpoch ? { authBindingSkipsLocalCredential: true } : {},
			authEpochVersion: 6,
			extraSystemPromptHash,
			messageToolPolicyHash,
			promptToolNamesHash,
			cwdHash,
			...mcpDeliveryCaptureEnabled ? { mcpDeliveryCapture: true } : {}
		};
	} catch (err) {
		try {
			await cleanupPreparedResources?.();
		} catch (cleanupErr) {
			require_helpers.cliBackendLog.warn(`cli backend cleanup after prepare failure failed: ${String(cleanupErr)}`);
		}
		throw err;
	}
}
//#endregion
//#region src/agents/cli-runner/prepare.runtime.ts
var prepare_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ prepareCliRunContext: () => prepareCliRunContext });
//#endregion
Object.defineProperty(exports, "prepareCliRunContext", {
	enumerable: true,
	get: function() {
		return prepareCliRunContext;
	}
});
Object.defineProperty(exports, "prepare_runtime_exports", {
	enumerable: true,
	get: function() {
		return prepare_runtime_exports;
	}
});
