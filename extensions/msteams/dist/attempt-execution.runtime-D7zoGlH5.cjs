require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_hook_helpers = require("./hook-helpers-B7eHTW1w.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_normalize_reply = require("./normalize-reply-DKfUboQ9.cjs");
require("./message-channel-jMzaqV09.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_selection = require("./selection-BpqUSi0C.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_model_selection_cli = require("./model-selection-cli-PCHB2Ve6.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_transcript = require("./transcript-BHT2QzlI.cjs");
const require_cli_backends = require("./cli-backends-CxeCBxgS.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_errors$1 = require("./errors-rYeQaZRQ.cjs");
const require_failover_error = require("./failover-error-voHYvp7k.cjs");
const require_run_termination = require("./run-termination-CDRVMWOn.cjs");
const require_bootstrap_budget = require("./bootstrap-budget-B73ETWvB.cjs");
const require_task_status_access = require("./task-status-access-B4LbHuEr.cjs");
const require_stream_message_shared = require("./stream-message-shared-DbVY20ZH.cjs");
const require_input_provenance = require("./input-provenance-h9in5xc9.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_cli_session_binding = require("./cli-session-binding-BLYmlDx8.cjs");
const require_user_turn_transcript = require("./user-turn-transcript-Dn526zAI.cjs");
require("./cli-session-CX50GYdw.cjs");
const require_auth = require("./auth-Bk8NmCMz.cjs");
const require_source_turn_id = require("./source-turn-id-ZBegxv5M.cjs");
require("./manager.turn-timeout-B9btqP_E.cjs");
const require_claude_live_session = require("./claude-live-session-CRdHSCWt.cjs");
const require_session_history = require("./session-history-C9PqIPGl.cjs");
const require_cli_runner = require("./cli-runner-ZSZWExo3.cjs");
const require_cli_execution_auth = require("./cli-execution-auth-CzWAogeM.cjs");
const require_tool_policy = require("./tool-policy-BvleZNRk.cjs");
const require_embedded_agent = require("./embedded-agent-C44j1_Yh.cjs");
const require_session_placement_admission = require("./session-placement-admission-DVqcuHQn.cjs");
require("./run-context-p_c3H4kz.cjs");
const require_session_store = require("./session-store-L9CKbvBx.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/acp/tool-status.ts
const ACP_TOOL_TERMINAL_OUTCOMES = {
	completed: "completed",
	done: "completed",
	failed: "failed",
	error: "failed",
	cancelled: "cancelled"
};
function resolveAcpToolTerminalOutcome(status) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(status);
	if (!normalized || !Object.hasOwn(ACP_TOOL_TERMINAL_OUTCOMES, normalized)) return;
	return ACP_TOOL_TERMINAL_OUTCOMES[normalized];
}
//#endregion
//#region src/agents/command/attempt-execution.ts
const log = require_subsystem.createSubsystemLogger("agents/agent-command");
function shouldClearReusedCliSessionAfterError(err) {
	if (require_errors.readErrorName(err) === "AbortError") return true;
	return err instanceof require_failover_error.FailoverError;
}
function resolveClearedCliSessionReason(err) {
	if (err instanceof require_failover_error.FailoverError) return err.reason;
	return require_errors.readErrorName(err) || "error";
}
function normalizeTranscriptMirrorText(value) {
	return value.trim().replace(/\s+/gu, " ");
}
const ACP_TRANSCRIPT_USAGE = {
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0,
	totalTokens: 0,
	cost: {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		total: 0
	}
};
function shouldSuppressEmbeddedLiveStreamOutput(params) {
	return params.opts.sessionEffects === "internal" && params.opts.deliver !== true;
}
function resolveProfileAuthFromStore(params) {
	const profileId = params.profileId?.trim();
	if (!profileId) return {};
	const credential = require_store.ensureAuthProfileStore(params.agentDir, {
		allowKeychainPrompt: false,
		externalCliProfileIds: [profileId]
	}).profiles[profileId];
	return {
		provider: credential?.provider,
		mode: credential?.type
	};
}
function resolveHarnessAuthProfileSelection(params) {
	const sessionAuthProfileId = params.sessionAuthProfileId?.trim();
	if (sessionAuthProfileId) {
		const profileAuth = resolveProfileAuthFromStore({
			agentDir: params.agentDir,
			profileId: sessionAuthProfileId
		});
		return {
			authProfileId: sessionAuthProfileId,
			authProfileIdSource: params.sessionAuthProfileSource,
			authProfileProvider: profileAuth.provider ?? params.authProfileProvider,
			authProfileMode: profileAuth.mode
		};
	}
	if (!params.allowHarnessAuthProfileForwarding) return { authProfileProvider: params.authProfileProvider };
	const harnessAuthProvider = require_auth.buildAgentRuntimeAuthPlan({
		provider: params.provider,
		authProfileProvider: params.authProfileProvider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		...params.metadataSnapshot ? { metadataSnapshot: params.metadataSnapshot } : {},
		providerAuthAliasesEnabled: params.providerAuthAliasesEnabled,
		harnessId: params.harnessId,
		harnessRuntime: params.harnessRuntime,
		allowHarnessAuthProfileForwarding: params.allowHarnessAuthProfileForwarding
	}).harnessAuthProvider;
	if (!harnessAuthProvider) return { authProfileProvider: params.authProfileProvider };
	const store = require_store.ensureAuthProfileStore(params.agentDir, {
		allowKeychainPrompt: false,
		externalCliProviderIds: [harnessAuthProvider]
	});
	const authProfileId = require_order.resolveAuthProfileOrder({
		cfg: params.config,
		store,
		provider: harnessAuthProvider
	})[0];
	return authProfileId ? {
		authProfileId,
		authProfileIdSource: "auto",
		authProfileProvider: harnessAuthProvider
	} : { authProfileProvider: params.authProfileProvider };
}
function resolveTranscriptUsage(usage) {
	if (!usage) return ACP_TRANSCRIPT_USAGE;
	return require_stream_message_shared.buildUsageWithNoCost({
		input: usage.input,
		output: usage.output,
		cacheRead: usage.cacheRead,
		cacheWrite: usage.cacheWrite,
		totalTokens: usage.total
	});
}
async function persistTextTurnTranscript(params) {
	const promptText = params.transcriptBody ?? params.body;
	const replyText = params.finalText;
	const userMessage = params.userMessage ?? (promptText ? {
		role: "user",
		content: promptText,
		timestamp: Date.now()
	} : void 0);
	if (!userMessage && !replyText) return {
		kind: "persisted",
		sessionEntry: params.sessionEntry
	};
	const messages = [];
	if (userMessage) messages.push({
		message: userMessage,
		idempotencyLookup: "scan",
		prepareMessageAfterIdempotencyCheck: (message) => require_user_turn_transcript.preparePersistedUserTurnMessageForTranscriptWrite(message, {
			agentId: params.sessionAgentId,
			sessionKey: params.sessionKey,
			beforeMessageWrite: require_hook_helpers.runAgentHarnessBeforeMessageWriteHook
		})
	});
	if (replyText) messages.push({
		message: {
			role: "assistant",
			content: [{
				type: "text",
				text: replyText
			}],
			api: params.assistant.api,
			provider: params.assistant.provider,
			model: params.assistant.model,
			usage: resolveTranscriptUsage(params.assistant.usage),
			stopReason: "stop",
			timestamp: Date.now()
		},
		shouldAppend: async ({ sessionFile }) => {
			if (!params.embeddedAssistantGapFill) return true;
			const latest = await require_transcript.readTailAssistantTextFromSessionTranscript(sessionFile, { excludeTranscriptOnlyOperatorAssistant: true });
			const normalizedReply = normalizeTranscriptMirrorText(replyText);
			const normalizedLatest = latest?.text ? normalizeTranscriptMirrorText(latest.text) : "";
			return !normalizedLatest || normalizedLatest !== normalizedReply;
		}
	});
	const turn = await require_session_accessor.persistSessionTranscriptTurn({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sessionFile: params.sessionFile,
		sessionEntry: params.sessionEntry,
		sessionStore: params.sessionStore,
		storePath: params.storePath,
		agentId: params.sessionAgentId,
		threadId: params.threadId
	}, {
		config: params.config,
		cwd: params.sessionCwd,
		messages,
		publishWhen: "always",
		touchSessionEntry: true,
		updateMode: "file-only",
		...params.sessionStore && params.storePath ? { expectedSessionId: params.sessionId } : {}
	});
	if (turn.rejectedReason === "session-rebound") return {
		kind: "session-rebound",
		sessionEntry: void 0
	};
	return {
		kind: "persisted",
		sessionEntry: turn.sessionEntry
	};
}
function resolveCliTranscriptReplyText(result) {
	const visibleText = result.meta.finalAssistantVisibleText?.trim();
	if (visibleText) return visibleText;
	return (result.payloads ?? []).filter((payload) => !payload.isError && !payload.isReasoning).map((payload) => payload.text?.trim() ?? "").filter(Boolean).join("\n\n");
}
function isClaudeCliProvider(provider) {
	return provider.trim().toLowerCase() === "claude-cli";
}
async function persistAcpTurnTranscript(params) {
	return await persistTextTurnTranscript({
		...params,
		...params.userInput ? { userMessage: require_user_turn_transcript.buildPersistedUserTurnMessage(params.userInput) } : {},
		assistant: {
			api: "openai-responses",
			provider: "@gabrielvfonseca/operator",
			model: "acp-runtime"
		}
	});
}
async function persistCliTurnTranscript(params) {
	const replyText = resolveCliTranscriptReplyText(params.result);
	const provider = params.result.meta.agentMeta?.provider?.trim() ?? "cli";
	const model = params.result.meta.agentMeta?.model?.trim() ?? "default";
	const gapFill = params.embeddedAssistantGapFill ?? false;
	const skipUserTurn = gapFill || params.skipUserTurn === true;
	return await persistTextTurnTranscript({
		body: skipUserTurn ? "" : params.body,
		transcriptBody: skipUserTurn ? void 0 : params.transcriptBody,
		...!skipUserTurn && params.userMessage ? { userMessage: params.userMessage } : {},
		finalText: replyText,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sessionFile: params.sessionFile,
		sessionEntry: params.sessionEntry,
		sessionStore: params.sessionStore,
		storePath: params.storePath,
		sessionAgentId: params.sessionAgentId,
		threadId: params.threadId,
		sessionCwd: params.sessionCwd,
		config: params.config,
		embeddedAssistantGapFill: gapFill,
		assistant: {
			api: "cli",
			provider,
			model,
			usage: params.result.meta.agentMeta?.usage
		}
	});
}
function runAgentAttempt(params) {
	const sessionAuthProfileId = params.sessionEntry?.authProfileOverride?.trim();
	const sessionAuthProfileSource = params.sessionEntry?.authProfileOverrideSource;
	const selectedAuthProfile = sessionAuthProfileId && sessionAuthProfileSource !== "auto" ? {
		id: sessionAuthProfileId,
		source: sessionAuthProfileSource
	} : params.configuredAuthProfileId?.trim() ? {
		id: params.configuredAuthProfileId.trim(),
		source: "user"
	} : sessionAuthProfileId ? {
		id: sessionAuthProfileId,
		source: sessionAuthProfileSource
	} : void 0;
	const isRawModelRun = params.opts.modelRun === true || params.opts.promptMode === "none";
	const claudeCliFallbackPrelude = !isRawModelRun && params.isFallbackRetry && isClaudeCliProvider(params.originalProvider) && !isClaudeCliProvider(params.providerOverride) ? require_session_history.buildClaudeCliFallbackContextPrelude({ cliSessionId: require_cli_session_binding.getCliSessionBinding(params.sessionEntry, "claude-cli")?.sessionId }) : "";
	const resolvedPrompt = require_session_history.resolveFallbackRetryPrompt({
		body: params.body,
		isFallbackRetry: params.isFallbackRetry,
		sessionHasHistory: params.sessionHasHistory,
		priorContextPrelude: claudeCliFallbackPrelude
	});
	const effectivePrompt = isRawModelRun ? resolvedPrompt : require_input_provenance.annotateInterSessionPromptText(resolvedPrompt, params.opts.inputProvenance);
	const bootstrapPromptWarningSignaturesSeen = require_bootstrap_budget.resolveBootstrapWarningSignaturesSeen(params.sessionEntry?.systemPromptReport);
	const bootstrapPromptWarningSignature = bootstrapPromptWarningSignaturesSeen[bootstrapPromptWarningSignaturesSeen.length - 1];
	const requestedAgentHarnessId = isRawModelRun ? "@gabrielvfonseca/operator" : void 0;
	const sessionRuntimeOverride = isRawModelRun ? void 0 : params.agentHarnessRuntimeOverride;
	const locksSessionRuntimeOverride = sessionRuntimeOverride !== void 0 && params.sessionEntry?.modelSelectionLocked === true;
	const sessionCliRuntime = sessionRuntimeOverride && !locksSessionRuntimeOverride && require_model_selection_cli.isCliProvider(sessionRuntimeOverride, params.cfg) ? sessionRuntimeOverride : void 0;
	const configuredCliRuntime = !isRawModelRun && !sessionRuntimeOverride ? require_model_runtime_aliases.resolveCliRuntimeExecutionProvider({
		provider: params.providerOverride,
		cfg: params.cfg,
		agentId: params.sessionAgentId,
		modelId: params.modelOverride,
		authProfileId: selectedAuthProfile?.id
	}) : void 0;
	const cliExecutionProvider = isRawModelRun ? params.providerOverride : sessionCliRuntime ?? configuredCliRuntime ?? params.providerOverride;
	const isCliExecutionProvider = sessionRuntimeOverride ? sessionCliRuntime !== void 0 : require_model_selection_cli.isCliProvider(cliExecutionProvider, params.cfg);
	if (params.fallbackRuntimeState && params.fallbackRuntimeState.originRuntime === void 0) params.fallbackRuntimeState.originRuntime = !isRawModelRun && isCliExecutionProvider ? "cli" : "embedded";
	const shouldForwardImagesToEmbedded = !params.isFallbackRetry || params.fallbackRuntimeState?.originRuntime === "cli";
	const allowCliAuthProfileForwarding = isCliExecutionProvider && require_cli_execution_auth.cliBackendAcceptsAuthProfileForwarding({
		provider: cliExecutionProvider,
		config: params.cfg,
		agentId: params.sessionAgentId
	});
	const agentHarnessPolicy = isRawModelRun ? {
		runtime: "@gabrielvfonseca/operator",
		runtimeSource: "model"
	} : sessionRuntimeOverride ? {
		runtime: sessionRuntimeOverride,
		runtimeSource: "model"
	} : require_selection.resolveAvailableAgentHarnessPolicy({
		provider: params.providerOverride,
		modelId: params.modelOverride,
		config: params.cfg,
		agentId: params.sessionAgentId,
		sessionKey: params.sessionKey ?? params.sessionId
	});
	const harnessAuthSelection = resolveHarnessAuthProfileSelection({
		config: params.cfg,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		provider: params.providerOverride,
		authProfileProvider: params.authProfileProvider,
		sessionAuthProfileId: selectedAuthProfile?.id,
		sessionAuthProfileSource: selectedAuthProfile?.source,
		harnessId: requestedAgentHarnessId,
		harnessRuntime: agentHarnessPolicy.runtime,
		...params.metadataSnapshot ? { metadataSnapshot: params.metadataSnapshot } : {},
		providerAuthAliasesEnabled: params.pluginsEnabled,
		allowHarnessAuthProfileForwarding: !isCliExecutionProvider
	});
	const runtimeAuthPlan = require_auth.buildAgentRuntimeAuthPlan({
		provider: params.providerOverride,
		authProfileProvider: harnessAuthSelection.authProfileProvider,
		authProfileMode: harnessAuthSelection.authProfileMode,
		sessionAuthProfileId: harnessAuthSelection.authProfileId,
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		...params.metadataSnapshot ? { metadataSnapshot: params.metadataSnapshot } : {},
		providerAuthAliasesEnabled: params.pluginsEnabled,
		harnessId: requestedAgentHarnessId,
		harnessRuntime: agentHarnessPolicy.runtime,
		allowHarnessAuthProfileForwarding: !isCliExecutionProvider
	});
	const cliAuthProfileId = allowCliAuthProfileForwarding ? require_cli_execution_auth.resolveCliExecutionAuthProfileId({
		cliExecutionProvider,
		authProfileProvider: params.authProfileProvider,
		config: params.cfg,
		agentDir: params.agentDir,
		selected: harnessAuthSelection
	}) : void 0;
	const authProfileId = allowCliAuthProfileForwarding ? cliAuthProfileId : runtimeAuthPlan.forwardedAuthProfileId;
	const embeddedAgentProvider = require_openai_routing.resolveOpenAIRuntimeProvider({
		provider: params.providerOverride,
		harnessRuntime: agentHarnessPolicy.runtime,
		agentHarnessId: requestedAgentHarnessId,
		authProfileProvider: runtimeAuthPlan.authProfileProviderForAuth,
		authProfileId,
		config: params.cfg,
		workspaceDir: params.workspaceDir
	});
	const embeddedAgentHarnessOverride = requestedAgentHarnessId ?? sessionRuntimeOverride ?? (agentHarnessPolicy.runtime === "@gabrielvfonseca/operator" && agentHarnessPolicy.runtimeSource !== "implicit" ? "@gabrielvfonseca/operator" : void 0);
	if (!isRawModelRun && isCliExecutionProvider) {
		const cliSessionBinding = require_cli_session_binding.getCliSessionBinding(params.sessionEntry, cliExecutionProvider);
		const cliProcessCwd = params.cwd ? require_home_dir.resolveUserPath(params.cwd) : params.workspaceDir;
		const cliPrompt = params.opts.inputProvenance?.kind === "inter_session" ? effectivePrompt : require_selection.injectTimestamp(effectivePrompt, require_selection.timestampOptsFromConfig(params.cfg));
		const mutableCliSessionStore = params.sessionKey && params.sessionStore && params.storePath ? {
			sessionKey: params.sessionKey,
			sessionStore: params.sessionStore,
			storePath: params.storePath
		} : void 0;
		const resolveReusableCliSessionBinding = async () => {
			const hasManagedClaudeLiveSession = Boolean(isClaudeCliProvider(cliExecutionProvider) && cliSessionBinding?.sessionId && require_claude_live_session.hasClaudeLiveSessionForOwner({
				backendId: cliExecutionProvider,
				agentAccountId: params.runContext.accountId,
				agentId: params.sessionAgentId,
				authProfileId: cliSessionBinding.authProfileId,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey
			}));
			if (!isClaudeCliProvider(cliExecutionProvider) || !cliSessionBinding?.sessionId || hasManagedClaudeLiveSession || await require_session_history.claudeCliSessionTranscriptHasContent({
				sessionId: cliSessionBinding.sessionId,
				workspaceDir: cliProcessCwd
			})) return cliSessionBinding;
			log.warn(`cli session reset: provider=${require_ansi.sanitizeForLog(cliExecutionProvider)} reason=transcript-missing sessionKey=${params.sessionKey ?? params.sessionId}`);
			if (mutableCliSessionStore) params.sessionEntry = await require_session_store.clearCliSessionInStore({
				provider: cliExecutionProvider,
				...mutableCliSessionStore
			}) ?? params.sessionEntry;
			return cliSessionBinding;
		};
		const mediaTaskIdsBefore = require_task_status_access.getGeneratedMediaTaskIdsForSessionKey(params.sessionKey);
		const runCliWithSession = async (nextCliSessionId, activeCliSessionBinding = cliSessionBinding) => {
			const forkCliSessionOnResume = activeCliSessionBinding?.forkNextResume === true;
			if (forkCliSessionOnResume && !require_cli_backends.resolveCliBackendConfig(cliExecutionProvider, params.cfg, { agentId: params.sessionAgentId })?.config.forkArg) throw new Error(`CLI backend "${cliExecutionProvider}" does not support session forks`);
			const forkStoreParams = forkCliSessionOnResume && nextCliSessionId && mutableCliSessionStore ? {
				provider: cliExecutionProvider,
				expectedCliSessionId: nextCliSessionId,
				...mutableCliSessionStore
			} : void 0;
			return require_session_placement_admission.withLocalSessionPlacementTurnAdmission({
				sessionId: params.sessionId,
				sessionKey: params.sessionKey ?? params.sessionId,
				agentId: params.sessionAgentId,
				runId: params.runId
			}, () => require_cli_runner.runCliAgent({
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				sessionEntry: params.sessionEntry,
				agentId: params.sessionAgentId,
				trigger: "user",
				sessionFile: params.sessionFile,
				storePath: params.storePath,
				workspaceDir: params.workspaceDir,
				cwd: params.cwd,
				config: params.cfg,
				prompt: cliPrompt,
				transcriptPrompt: params.transcriptBody,
				modelProvider: params.providerOverride,
				provider: cliExecutionProvider,
				model: params.modelOverride,
				thinkLevel: params.resolvedThinkLevel,
				timeoutMs: params.timeoutMs,
				runTimeoutOverrideMs: params.runTimeoutOverrideMs,
				runId: params.runId,
				lifecycleGeneration: params.lifecycleGeneration,
				lane: params.opts.lane,
				extraSystemPrompt: params.opts.extraSystemPrompt,
				inputProvenance: params.opts.inputProvenance,
				sourceReplyDeliveryMode: params.opts.sourceReplyDeliveryMode,
				requireExplicitMessageTarget: params.opts.requireExplicitMessageTarget ?? require_session_key.isSubagentSessionKey(params.sessionKey),
				cliSessionBindingFacts: params.opts.cliSessionBindingFacts,
				cliSessionId: nextCliSessionId,
				cliSessionBinding: nextCliSessionId === activeCliSessionBinding?.sessionId ? activeCliSessionBinding : void 0,
				forkCliSessionOnResume,
				...forkStoreParams ? {
					claimCliSessionFork: async () => {
						const claimed = await require_session_store.consumeCliSessionForkInStore(forkStoreParams);
						if (claimed) params.sessionEntry = claimed;
						return Boolean(claimed);
					},
					restoreCliSessionFork: async () => {
						const restored = await require_session_store.restoreCliSessionForkInStore(forkStoreParams);
						if (restored) params.sessionEntry = restored;
					},
					persistCliSessionForkSuccessor: async (successorCliSessionId) => {
						const persisted = await require_session_store.persistCliSessionForkSuccessorInStore({
							...forkStoreParams,
							successorCliSessionId
						});
						if (!persisted) throw new Error("CLI session fork successor could not be persisted");
						params.sessionEntry = persisted;
					}
				} : {},
				authProfileId,
				bootstrapPromptWarningSignaturesSeen,
				bootstrapPromptWarningSignature,
				imagePrompt: params.body,
				images: params.opts.images,
				imageOrder: params.opts.imageOrder,
				messageChannel: params.messageChannel,
				streamParams: params.opts.streamParams,
				messageProvider: params.opts.messageProvider ?? params.messageChannel,
				currentChannelId: params.runContext.currentChannelId,
				chatId: params.runContext.chatId,
				channelContext: params.runContext.channelContext,
				currentThreadTs: params.runContext.currentThreadTs,
				currentInboundAudio: params.runContext.currentInboundAudio,
				approvalReviewerDeviceId: params.opts.approvalReviewerDeviceId,
				agentAccountId: params.runContext.accountId,
				senderId: params.runContext.senderId,
				senderIsOwner: params.opts.senderIsOwner,
				bashElevated: params.opts.bashElevated,
				groupId: params.runContext.groupId,
				groupChannel: params.runContext.groupChannel,
				groupSpace: params.runContext.groupSpace,
				spawnedBy: params.spawnedBy,
				toolsAllow: require_tool_policy.resolveCliRuntimeToolsAllow(params.opts.toolsAllow, params.opts.toolsAllowIsDefault),
				cleanupBundleMcpOnRunEnd: params.opts.cleanupBundleMcpOnRunEnd,
				cleanupCliLiveSessionOnRunEnd: params.opts.cleanupCliLiveSessionOnRunEnd,
				oneShotCliRun: params.opts.oneShotCliRun,
				userTurnTranscriptRecorder: params.userTurnTranscriptRecorder,
				suppressNextUserMessagePersistence: params.suppressPromptPersistenceOnRetry === true,
				...mutableCliSessionStore && !forkCliSessionOnResume ? { onBeforeFreshCliSessionRetry: async (retry) => {
					if (require_task_status_access.hasNewGeneratedMediaTaskForSessionKey(params.sessionKey, mediaTaskIdsBefore) || retry.sessionId !== activeCliSessionBinding?.sessionId) return false;
					log.warn(`CLI session failed, clearing before fresh retry: provider=${require_ansi.sanitizeForLog(cliExecutionProvider)} sessionKey=${mutableCliSessionStore.sessionKey} reason=${require_ansi.sanitizeForLog(retry.reason)}`);
					params.sessionEntry = await require_session_store.clearCliSessionInStore({
						provider: cliExecutionProvider,
						...mutableCliSessionStore
					}) ?? params.sessionEntry;
					return true;
				} } : {}
			}));
		};
		return resolveReusableCliSessionBinding().then(async (activeCliSessionBinding) => {
			try {
				return await runCliWithSession(activeCliSessionBinding?.sessionId, activeCliSessionBinding);
			} catch (err) {
				if (isClaudeCliProvider(cliExecutionProvider) && !activeCliSessionBinding?.forkNextResume && shouldClearReusedCliSessionAfterError(err) && !require_task_status_access.hasNewGeneratedMediaTaskForSessionKey(params.sessionKey, mediaTaskIdsBefore) && activeCliSessionBinding?.sessionId && mutableCliSessionStore) {
					log.warn(`CLI session cleared after failed reused turn: provider=${require_ansi.sanitizeForLog(cliExecutionProvider)} sessionKey=${mutableCliSessionStore.sessionKey} reason=${require_ansi.sanitizeForLog(resolveClearedCliSessionReason(err))}`);
					params.sessionEntry = await require_session_store.clearCliSessionInStore({
						provider: cliExecutionProvider,
						...mutableCliSessionStore
					}) ?? params.sessionEntry;
				}
				throw err;
			}
		});
	}
	const embeddedRunParams = {
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sessionTarget: params.sessionTarget,
		sandboxSessionKey: params.sessionKey,
		agentId: params.sessionAgentId,
		trigger: "user",
		messageChannel: params.messageChannel,
		messageProvider: params.opts.messageProvider ?? params.messageChannel,
		agentAccountId: params.runContext.accountId,
		messageTo: params.opts.replyTo ?? params.opts.to,
		messageThreadId: params.opts.threadId,
		groupId: params.runContext.groupId,
		groupChannel: params.runContext.groupChannel,
		groupSpace: params.runContext.groupSpace,
		spawnedBy: params.spawnedBy,
		currentChannelId: params.runContext.currentChannelId,
		chatId: params.runContext.chatId,
		channelContext: params.runContext.channelContext,
		currentThreadTs: params.runContext.currentThreadTs,
		currentInboundAudio: params.runContext.currentInboundAudio,
		replyToMode: params.runContext.replyToMode,
		hasRepliedRef: params.runContext.hasRepliedRef,
		senderId: params.runContext.senderId,
		senderIsOwner: params.opts.senderIsOwner,
		sessionFile: params.sessionFile,
		workspaceDir: params.workspaceDir,
		cwd: params.cwd,
		config: params.cfg,
		agentHarnessId: embeddedAgentHarnessOverride,
		modelSelectionLocked: !isRawModelRun && params.sessionEntry?.modelSelectionLocked === true,
		agentHarnessRuntimeOverride: embeddedAgentHarnessOverride,
		skillsSnapshot: params.skillsSnapshot,
		prompt: effectivePrompt,
		transcriptPrompt: params.transcriptBody,
		images: shouldForwardImagesToEmbedded ? params.opts.images : void 0,
		imageOrder: shouldForwardImagesToEmbedded ? params.opts.imageOrder : void 0,
		clientTools: params.opts.clientTools,
		provider: embeddedAgentProvider,
		model: params.modelOverride,
		modelFallbacksOverride: params.modelFallbacksOverride,
		authProfileId,
		authProfileIdSource: authProfileId ? harnessAuthSelection.authProfileIdSource : void 0,
		thinkLevel: params.resolvedThinkLevel,
		fastMode: params.fastMode,
		fastModeStartedAtMs: params.fastModeStartedAtMs,
		fastModeAutoOnSeconds: params.fastModeAutoOnSeconds,
		isFinalFallbackAttempt: params.isFinalFallbackAttempt,
		verboseLevel: params.resolvedVerboseLevel,
		bashElevated: params.opts.bashElevated,
		approvalReviewerDeviceId: params.opts.approvalReviewerDeviceId,
		timeoutMs: params.timeoutMs,
		runId: params.runId,
		lifecycleGeneration: params.lifecycleGeneration,
		lane: params.opts.lane,
		suppressLiveStreamOutput: shouldSuppressEmbeddedLiveStreamOutput(params),
		abortSignal: params.opts.abortSignal,
		extraSystemPrompt: params.opts.extraSystemPrompt,
		bootstrapContextMode: params.opts.bootstrapContextMode,
		bootstrapContextRunKind: params.opts.bootstrapContextRunKind,
		toolsAllow: params.opts.toolsAllow,
		runtimePluginToolGrant: params.opts.runtimePluginToolGrant,
		internalEvents: params.opts.internalEvents,
		inputProvenance: params.opts.inputProvenance,
		sourceReplyDeliveryMode: params.opts.sourceReplyDeliveryMode,
		disableMessageTool: params.opts.disableMessageTool,
		forceRestartSafeTools: params.opts.forceRestartSafeTools,
		streamParams: params.opts.streamParams,
		agentDir: params.agentDir,
		allowGatewaySubagentBinding: params.opts.allowGatewaySubagentBinding,
		allowTransientCooldownProbe: params.allowTransientCooldownProbe,
		cleanupBundleMcpOnRunEnd: params.opts.cleanupBundleMcpOnRunEnd,
		oneShotCliRun: params.opts.oneShotCliRun,
		modelRun: params.opts.modelRun,
		promptMode: params.opts.promptMode,
		disableTools: params.opts.modelRun === true,
		onAgentEvent: params.onAgentEvent,
		deferTerminalLifecycle: params.deferTerminalLifecycle,
		suppressNextUserMessagePersistence: params.suppressPromptPersistenceOnRetry === true,
		userTurnTranscriptRecorder: params.userTurnTranscriptRecorder,
		onUserMessagePersisted: params.onUserMessagePersisted,
		onExecutionStarted: (info) => {
			if (info?.lifecycleGeneration) params.onLifecycleGenerationChanged?.(info.lifecycleGeneration);
		},
		onSessionIdChanged: params.opts.onSessionIdChanged,
		bootstrapPromptWarningSignaturesSeen,
		bootstrapPromptWarningSignature
	};
	require_source_turn_id.setChannelSourceTurnId(embeddedRunParams, require_source_turn_id.readChannelSourceTurnId(params.runContext));
	require_source_turn_id.setChannelSourceTurnSameThreadRequired(embeddedRunParams, require_source_turn_id.readChannelSourceTurnSameThreadRequired(params.runContext));
	return require_embedded_agent.runEmbeddedAgent(embeddedRunParams);
}
function buildAcpResult(params) {
	const normalizedFinalPayload = require_normalize_reply.normalizeReplyPayload({ text: params.payloadText });
	const payloads = normalizedFinalPayload ? [normalizedFinalPayload] : [];
	const abortFields = require_run_termination.resolveAgentRunAbortLifecycleFields(params.abortSignal);
	const resultCancelled = params.resultStatus === "cancelled";
	return {
		payloads,
		meta: {
			durationMs: Date.now() - params.startedAt,
			aborted: abortFields.aborted ?? resultCancelled,
			stopReason: abortFields.stopReason ?? (resultCancelled ? "stop" : params.stopReason)
		}
	};
}
function emitAcpLifecycleStart(params) {
	(params.auditOnly ? require_agent_events.emitAgentAuditEvent : require_agent_events.emitAgentEvent)({
		runId: params.runId,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		...params.agentId ? { agentId: params.agentId } : {},
		...params.lifecycleGeneration ? { lifecycleGeneration: params.lifecycleGeneration } : {},
		stream: "lifecycle",
		data: {
			phase: "start",
			startedAt: params.startedAt
		}
	});
}
const ACP_PROXY_ENV_KEYS = [
	"HTTP_PROXY",
	"HTTPS_PROXY",
	"ALL_PROXY",
	"http_proxy",
	"https_proxy",
	"all_proxy"
];
const MAX_TRACKED_ACP_TOOLS = 4096;
function createAcpToolLifecycleTracker() {
	return {
		active: /* @__PURE__ */ new Map(),
		terminalToolCallIds: /* @__PURE__ */ new Set(),
		saturated: false
	};
}
function acpAuditToolName(kind) {
	switch (kind) {
		case "read":
		case "edit":
		case "delete":
		case "move":
		case "search":
		case "execute":
		case "fetch":
		case "switch_mode":
		case "think":
		case "other": return `acp_${kind}`;
		default: return "acp_tool";
	}
}
function resolveAcpToolTerminalReason(signal, stopReason, error, resultStatus) {
	const abortFields = require_run_termination.resolveAgentRunAbortLifecycleFields(signal);
	if (abortFields.aborted) return abortFields.stopReason === "timeout" ? "timed_out" : "cancelled";
	const normalizedStopReason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(stopReason);
	if (normalizedStopReason === "timeout") return "timed_out";
	if (resultStatus === "cancelled") return "cancelled";
	if (error instanceof Error && error.detailCode === "TURN_TIMEOUT") return "timed_out";
	if (normalizedStopReason === "cancel" || normalizedStopReason === "cancelled" || normalizedStopReason === "manual-cancel") return "cancelled";
	return "failed";
}
function resolveAcpLifecycleEndFields(signal, stopReason, resultStatus) {
	const abortFields = require_run_termination.resolveAgentRunAbortLifecycleFields(signal);
	if (abortFields.aborted) return abortFields;
	const terminalReason = resolveAcpToolTerminalReason(void 0, stopReason, void 0, resultStatus);
	if (terminalReason === "timed_out") return {
		aborted: true,
		stopReason: "timeout",
		status: "timed_out"
	};
	if (terminalReason === "cancelled") return {
		aborted: true,
		stopReason: "stop",
		status: "cancelled"
	};
	return {};
}
function emitAcpToolExecutionEvent(params) {
	const { event } = params;
	const now = Date.now();
	const toolCallId = event.toolCallId?.trim() ? event.toolCallId : void 0;
	const activeTool = toolCallId ? params.toolTracker.active.get(toolCallId) : void 0;
	const terminalOutcome = resolveAcpToolTerminalOutcome(event.status);
	const toolName = acpAuditToolName(event.kind);
	if (toolCallId && !activeTool) {
		if (params.toolTracker.terminalToolCallIds.has(toolCallId)) return;
		const trackedIdentities = params.toolTracker.active.size + params.toolTracker.terminalToolCallIds.size;
		if (params.toolTracker.saturated || trackedIdentities >= MAX_TRACKED_ACP_TOOLS) {
			params.toolTracker.saturated = true;
			return;
		}
	}
	if (!activeTool && (toolCallId !== void 0 || toolCallId === void 0 && terminalOutcome !== void 0)) {
		require_diagnostic_events.emitTrustedDiagnosticEvent({
			type: "tool.execution.started",
			runId: params.runId,
			...params.sessionKey ? { sessionKey: params.sessionKey } : {},
			...params.agentId ? { agentId: params.agentId } : {},
			...toolCallId ? { toolCallId } : {},
			toolName,
			toolSource: "core",
			toolOwner: "acp"
		});
		if (toolCallId) params.toolTracker.active.set(toolCallId, {
			runId: params.runId,
			...params.sessionKey ? { sessionKey: params.sessionKey } : {},
			...params.agentId ? { agentId: params.agentId } : {},
			toolCallId,
			toolName,
			startedAt: now
		});
	}
	if (!terminalOutcome) return;
	const terminalReason = resolveAcpToolTerminalReason(params.abortSignal, void 0, void 0, terminalOutcome === "cancelled" ? "cancelled" : void 0);
	const durationMs = Math.max(0, now - (activeTool?.startedAt ?? now));
	require_diagnostic_events.emitTrustedDiagnosticEvent(terminalOutcome === "completed" ? {
		type: "tool.execution.completed",
		runId: params.runId,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		...params.agentId ? { agentId: params.agentId } : {},
		...toolCallId ? { toolCallId } : {},
		toolName: activeTool?.toolName ?? toolName,
		toolSource: "core",
		toolOwner: "acp",
		durationMs
	} : {
		type: "tool.execution.error",
		runId: params.runId,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		...params.agentId ? { agentId: params.agentId } : {},
		...toolCallId ? { toolCallId } : {},
		toolName: activeTool?.toolName ?? toolName,
		toolSource: "core",
		toolOwner: "acp",
		durationMs,
		errorCategory: terminalReason === "cancelled" ? "aborted" : "acp_tool",
		terminalReason
	});
	if (toolCallId) {
		params.toolTracker.active.delete(toolCallId);
		params.toolTracker.terminalToolCallIds.add(toolCallId);
	}
}
function finalizeAcpToolsForRun(toolTracker, runId, terminalReason) {
	const now = Date.now();
	for (const activeTool of toolTracker.active.values()) require_diagnostic_events.emitTrustedDiagnosticEvent({
		type: "tool.execution.error",
		runId,
		...activeTool.sessionKey ? { sessionKey: activeTool.sessionKey } : {},
		...activeTool.agentId ? { agentId: activeTool.agentId } : {},
		toolName: activeTool.toolName,
		toolSource: "core",
		toolOwner: "acp",
		toolCallId: activeTool.toolCallId,
		durationMs: Math.max(0, now - activeTool.startedAt),
		errorCategory: terminalReason === "cancelled" ? "aborted" : "acp_tool_incomplete",
		terminalReason
	});
	toolTracker.active.clear();
	toolTracker.terminalToolCallIds.clear();
	toolTracker.saturated = false;
}
function resolvePresentProxyEnvKeys(env = process.env) {
	return ACP_PROXY_ENV_KEYS.filter((key) => {
		const value = env[key];
		return typeof value === "string" && value.trim().length > 0;
	});
}
function sanitizeAcpDiagnosticText(value) {
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(require_redact.redactSensitiveText(value).replace(/\s+/g, " ").trim(), 240);
}
function acpRuntimeEventDiagnostics(event) {
	if (event.type === "status") return {
		eventType: event.type,
		text: sanitizeAcpDiagnosticText(event.text),
		...event.tag ? { tag: event.tag } : {}
	};
	if (event.type === "tool_call") return {
		eventType: event.type,
		text: sanitizeAcpDiagnosticText(event.text),
		...event.tag ? { tag: event.tag } : {},
		...event.status ? { status: sanitizeAcpDiagnosticText(event.status) } : {},
		...event.title ? { title: sanitizeAcpDiagnosticText(event.title) } : {},
		...event.toolCallId ? { toolCallId: sanitizeAcpDiagnosticText(event.toolCallId) } : {}
	};
	if (event.type === "error") return {
		eventType: event.type,
		message: sanitizeAcpDiagnosticText(event.message),
		...event.code ? { code: sanitizeAcpDiagnosticText(event.code) } : {},
		...typeof event.retryable === "boolean" ? { retryable: event.retryable } : {}
	};
	if (event.type === "done") return {
		eventType: event.type,
		...event.status ? { status: event.status } : {},
		...event.stopReason ? { stopReason: sanitizeAcpDiagnosticText(event.stopReason) } : {}
	};
	return {
		eventType: event.type,
		stream: event.stream ?? "output"
	};
}
function emitAcpPromptSubmitted(params) {
	require_agent_events.emitAgentEvent({
		runId: params.runId,
		stream: "acp",
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		data: {
			phase: "prompt_submitted",
			at: params.at,
			proxyEnvKeys: resolvePresentProxyEnvKeys()
		}
	});
}
function emitAcpRuntimeEvent(params) {
	if (params.event.type === "tool_call") emitAcpToolExecutionEvent({
		runId: params.runId,
		toolTracker: params.toolTracker,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		...params.agentId ? { agentId: params.agentId } : {},
		...params.abortSignal ? { abortSignal: params.abortSignal } : {},
		event: params.event
	});
	if (!params.auditOnly) require_agent_events.emitAgentEvent({
		runId: params.runId,
		stream: "acp",
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		...params.agentId ? { agentId: params.agentId } : {},
		data: {
			phase: "runtime_event",
			...acpRuntimeEventDiagnostics(params.event)
		}
	});
}
function emitAcpLifecycleEnd(params) {
	finalizeAcpToolsForRun(params.toolTracker, params.runId, resolveAcpToolTerminalReason(params.abortSignal, params.stopReason, void 0, params.resultStatus));
	(params.auditOnly ? require_agent_events.emitAgentAuditEvent : require_agent_events.emitAgentEvent)({
		runId: params.runId,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		...params.agentId ? { agentId: params.agentId } : {},
		...params.lifecycleGeneration ? { lifecycleGeneration: params.lifecycleGeneration } : {},
		stream: "lifecycle",
		data: {
			phase: "end",
			endedAt: Date.now(),
			...resolveAcpLifecycleEndFields(params.abortSignal, params.stopReason, params.resultStatus)
		}
	});
}
function emitAcpLifecycleError(params) {
	const terminalReason = resolveAcpToolTerminalReason(params.abortSignal, void 0, params.error);
	finalizeAcpToolsForRun(params.toolTracker, params.runId, terminalReason);
	const lifecycleFields = params.terminalOutcome === "blocked" ? { livenessState: "blocked" } : terminalReason === "timed_out" ? {
		aborted: true,
		stopReason: "timeout",
		status: "timed_out"
	} : require_run_termination.resolveAgentRunAbortLifecycleFields(params.abortSignal);
	(params.auditOnly ? require_agent_events.emitAgentAuditEvent : require_agent_events.emitAgentEvent)({
		runId: params.runId,
		...params.agentId ? { agentId: params.agentId } : {},
		...params.lifecycleGeneration ? { lifecycleGeneration: params.lifecycleGeneration } : {},
		stream: "lifecycle",
		...params.sessionKey ? { sessionKey: params.sessionKey } : {},
		data: {
			phase: "error",
			...!params.auditOnly ? { error: (0, require_errors$1.errors_exports.formatAcpErrorChain)(params.error) } : {},
			endedAt: Date.now(),
			...lifecycleFields
		}
	});
}
function emitAcpAssistantDelta(params) {
	require_agent_events.emitAgentEvent({
		runId: params.runId,
		stream: "assistant",
		data: {
			text: params.text,
			delta: params.delta
		}
	});
}
//#endregion
exports.buildAcpResult = buildAcpResult;
exports.createAcpToolLifecycleTracker = createAcpToolLifecycleTracker;
exports.createAcpVisibleTextAccumulator = require_session_history.createAcpVisibleTextAccumulator;
exports.emitAcpAssistantDelta = emitAcpAssistantDelta;
exports.emitAcpLifecycleEnd = emitAcpLifecycleEnd;
exports.emitAcpLifecycleError = emitAcpLifecycleError;
exports.emitAcpLifecycleStart = emitAcpLifecycleStart;
exports.emitAcpPromptSubmitted = emitAcpPromptSubmitted;
exports.emitAcpRuntimeEvent = emitAcpRuntimeEvent;
exports.persistAcpTurnTranscript = persistAcpTurnTranscript;
exports.persistCliTurnTranscript = persistCliTurnTranscript;
exports.runAgentAttempt = runAgentAttempt;
exports.sessionFileHasContent = require_session_history.sessionFileHasContent;
