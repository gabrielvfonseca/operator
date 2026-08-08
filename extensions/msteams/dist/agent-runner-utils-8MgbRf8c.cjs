require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-BWWaGAnQ.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
require("./config-DT0qiglW.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_command_secret_gateway = require("./command-secret-gateway-bUpj2U36.cjs");
const require_command_secret_targets = require("./command-secret-targets-CcsWgblx.cjs");
const require_fast_mode = require("./fast-mode-0YvHCt-K.cjs");
const require_provider_utils = require("./provider-utils-ivH7d8vm.cjs");
const require_inbound_media = require("./inbound-media-BBtmPEwr.cjs");
const require_origin_routing = require("./origin-routing-D98hAxhC.cjs");
const require_source_turn_id = require("./source-turn-id-ZBegxv5M.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/agent-runner-auth-profile.ts
/** Keeps an auth profile only when the current provider shares the primary auth scope. */
function resolveProviderScopedAuthProfile(params) {
	const aliasParams = {
		config: params.config,
		workspaceDir: params.workspaceDir
	};
	const authProfileId = require_provider_auth_aliases.resolveProviderIdForAuth(params.provider, aliasParams) === require_provider_auth_aliases.resolveProviderIdForAuth(params.primaryProvider, aliasParams) ? params.authProfileId : void 0;
	return {
		authProfileId,
		authProfileIdSource: authProfileId ? params.authProfileIdSource : void 0
	};
}
/** Resolves the auth profile override for a queued follow-up run. */
function resolveRunAuthProfile(run, provider, params) {
	return resolveProviderScopedAuthProfile({
		provider,
		primaryProvider: run.provider,
		authProfileId: run.authProfileId,
		authProfileIdSource: run.authProfileIdSource,
		config: params?.config ?? run.config,
		workspaceDir: run.workspaceDir
	});
}
/** Applies an auto-fallback probe's pinned auth to its fallback candidate. */
function resolveFallbackCandidateRun(run, provider, model) {
	const probe = run.autoFallbackPrimaryProbe;
	const isPrimaryProbeCandidate = probe && provider === probe.provider && model === probe.model;
	if (!probe || provider !== probe.fallbackProvider || isPrimaryProbeCandidate || !probe.fallbackAuthProfileId) return run;
	const candidateRun = {
		...run,
		provider,
		model,
		authProfileId: probe.fallbackAuthProfileId
	};
	if (probe.fallbackAuthProfileIdSource) candidateRun.authProfileIdSource = probe.fallbackAuthProfileIdSource;
	else delete candidateRun.authProfileIdSource;
	return candidateRun;
}
//#endregion
//#region src/auto-reply/reply/agent-runner-run-params.ts
/** Builds embedded-agent run parameters from queued follow-up run state. */
/** Builds model fallback options for an embedded follow-up run. */
function resolveModelFallbackOptions(run, configOverride = run.config) {
	const config = configOverride;
	const fallbacksOverride = run.modelSelectionLocked ? [] : require_agent_scope.resolveEffectiveModelFallbacks({
		cfg: config,
		agentId: run.agentId,
		sessionKey: run.sessionKey,
		hasSessionModelOverride: run.hasSessionModelOverride === true,
		modelOverrideSource: run.modelOverrideSource,
		hasAutoFallbackProvenance: run.hasAutoFallbackProvenance === true
	});
	return {
		cfg: config,
		provider: run.provider,
		model: run.model,
		agentDir: run.agentDir,
		agentId: run.agentId,
		sessionKey: run.runtimePolicySessionKey ?? run.sessionKey,
		fallbacksOverride
	};
}
/** Resolves whether final-answer tags should be enforced for an embedded follow-up run. */
function resolveEnforceFinalTagWithResolver(run, provider, model, isReasoningTagProvider) {
	return (run.skipProviderRuntimeHints ? false : void 0) ?? (run.enforceFinalTag || isReasoningTagProvider?.(provider, {
		config: run.config,
		workspaceDir: run.workspaceDir,
		modelId: model
	}) || false);
}
/** Builds the shared embedded-agent run params from a queued follow-up run. */
function buildEmbeddedRunBaseParams$1(params) {
	const config = params.run.config;
	const modelFallbacksOverride = params.run.modelSelectionLocked ? [] : require_agent_scope.resolveEffectiveModelFallbacks({
		cfg: config,
		agentId: params.run.agentId,
		sessionKey: params.run.sessionKey,
		hasSessionModelOverride: params.run.hasSessionModelOverride === true,
		modelOverrideSource: params.run.modelOverrideSource,
		hasAutoFallbackProvenance: params.run.hasAutoFallbackProvenance === true
	});
	const enforceFinalTag = resolveEnforceFinalTagWithResolver(params.run, params.provider, params.model, params.isReasoningTagProvider);
	return {
		sessionFile: params.run.sessionFile,
		workspaceDir: params.run.workspaceDir,
		cwd: params.run.cwd,
		agentDir: params.run.agentDir,
		config,
		skillsSnapshot: params.run.skillsSnapshot,
		ownerNumbers: params.run.ownerNumbers,
		inputProvenance: params.run.inputProvenance,
		senderIsOwner: params.run.senderIsOwner,
		channelContext: params.run.channelContext,
		approvalReviewerDeviceId: params.run.approvalReviewerDeviceId,
		enforceFinalTag,
		silentExpected: params.run.silentExpected,
		allowEmptyAssistantReplyAsSilent: params.run.allowEmptyAssistantReplyAsSilent,
		silentReplyPromptMode: params.run.silentReplyPromptMode,
		sourceReplyDeliveryMode: params.run.sourceReplyDeliveryMode,
		clientCaps: params.run.clientCaps,
		taskSuggestionDeliveryMode: params.run.taskSuggestionDeliveryMode,
		provider: params.provider,
		model: params.model,
		modelSelectionLocked: params.run.modelSelectionLocked,
		modelFallbacksOverride,
		...params.authProfile,
		thinkLevel: params.run.thinkLevel,
		fastMode: params.run.fastMode,
		fastModeAutoOnSeconds: params.run.fastModeAutoOnSeconds,
		verboseLevel: params.run.verboseLevel,
		reasoningLevel: params.run.reasoningLevel,
		execOverrides: params.run.execOverrides,
		bashElevated: params.run.bashElevated,
		timeoutMs: params.run.timeoutMs,
		runId: params.runId,
		promptCacheKey: params.promptCacheKey,
		allowTransientCooldownProbe: params.allowTransientCooldownProbe
	};
}
//#endregion
//#region src/auto-reply/reply/agent-runner-utils.ts
/** Utilities for queued reply runtime config, auth, threading, and embedded run params. */
const BUN_FETCH_SOCKET_ERROR_RE = /socket connection was closed unexpectedly/i;
/** Selects the freshest runtime config usable by queued reply execution. */
function resolveQueuedReplyRuntimeConfig(config) {
	return require_runtime_snapshot.selectApplicableRuntimeConfig({
		inputConfig: config,
		runtimeConfig: typeof require_runtime_snapshot.getRuntimeConfigSnapshot === "function" ? require_runtime_snapshot.getRuntimeConfigSnapshot() : null,
		runtimeSourceConfig: typeof require_runtime_snapshot.getRuntimeConfigSourceSnapshot === "function" ? require_runtime_snapshot.getRuntimeConfigSourceSnapshot() : null
	}) ?? config;
}
/** Resolves command secrets for queued reply execution, scoped to the origin route. */
async function resolveQueuedReplyExecutionConfig(config, params) {
	const runtimeConfig = resolveQueuedReplyRuntimeConfig(config);
	const { resolvedConfig } = await require_command_secret_gateway.resolveCommandSecretRefsViaGateway({
		config: runtimeConfig,
		commandName: "reply",
		targetIds: require_command_secret_targets.getAgentRuntimeCommandSecretTargetIds()
	});
	const baseResolvedConfig = resolvedConfig ?? runtimeConfig;
	const scope = require_web_tools.resolveMessageSecretScope({
		channel: params?.originatingChannel,
		fallbackChannel: params?.messageProvider,
		accountId: params?.originatingAccountId,
		fallbackAccountId: params?.agentAccountId
	});
	if (!scope.channel) return baseResolvedConfig;
	const scopedTargets = require_command_secret_targets.getScopedChannelsCommandSecretTargets({
		config: baseResolvedConfig,
		channel: scope.channel,
		accountId: scope.accountId
	});
	if (scopedTargets.targetIds.size === 0) return baseResolvedConfig;
	return (await require_command_secret_gateway.resolveCommandSecretRefsViaGateway({
		config: baseResolvedConfig,
		commandName: "reply",
		targetIds: scopedTargets.targetIds,
		...scopedTargets.allowedPaths ? { allowedPaths: scopedTargets.allowedPaths } : {}
	})).resolvedConfig ?? baseResolvedConfig;
}
/**
* Build provider-specific threading context for tool auto-injection.
*/
/** Builds channel threading context for message-tool replies. */
function buildThreadingToolContext(params) {
	const { sessionCtx, config, hasRepliedRef } = params;
	const currentMessageId = sessionCtx.InputProvenance?.kind === "internal_system" && sessionCtx.InputProvenance.sourceTool === "restart-sentinel" ? sessionCtx.ReplyToId : sessionCtx.MessageSidFull ?? sessionCtx.MessageSid;
	const currentSourceTurnId = require_source_turn_id.readChannelSourceTurnId(sessionCtx);
	const originProvider = require_origin_routing.resolveOriginMessageProvider({
		originatingChannel: sessionCtx.OriginatingChannel,
		provider: sessionCtx.Provider
	});
	const originTo = require_origin_routing.resolveOriginMessageTo({
		originatingTo: sessionCtx.OriginatingTo,
		to: sessionCtx.To
	});
	if (!config) return {
		currentMessageId,
		currentSourceTurnId
	};
	const rawProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(originProvider);
	if (!rawProvider) return {
		currentMessageId,
		currentSourceTurnId
	};
	const provider = require_registry.normalizeChannelId(rawProvider) ?? require_registry_normalize.normalizeAnyChannelId(rawProvider);
	const threading = provider ? require_registry$1.getChannelPlugin(provider)?.threading : void 0;
	if (!threading?.buildToolContext) return {
		currentChannelId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(originTo),
		currentChannelProvider: provider ?? rawProvider,
		currentMessageId,
		currentSourceTurnId,
		hasRepliedRef
	};
	const context = threading.buildToolContext({
		cfg: config,
		accountId: sessionCtx.AccountId,
		context: {
			Channel: originProvider,
			From: sessionCtx.From,
			To: originTo,
			ChatType: sessionCtx.ChatType,
			CurrentMessageId: currentMessageId,
			ReplyToMode: sessionCtx.ReplyToMode,
			ReplyToId: sessionCtx.ReplyToId,
			ReplyToIdFull: sessionCtx.ReplyToIdFull,
			ThreadLabel: sessionCtx.ThreadLabel,
			MessageThreadId: sessionCtx.MessageThreadId,
			TransportThreadId: sessionCtx.TransportThreadId,
			NativeChannelId: sessionCtx.NativeChannelId
		},
		hasRepliedRef
	}) ?? {};
	const hasAdapterCurrentMessageId = Object.hasOwn(context, "currentMessageId");
	return {
		...context,
		currentChannelProvider: provider,
		currentMessageId: hasAdapterCurrentMessageId ? context.currentMessageId : currentMessageId,
		currentSourceTurnId
	};
}
/** Detects Bun socket-close errors that should be formatted more clearly. */
const isBunFetchSocketError = (message) => message ? BUN_FETCH_SOCKET_ERROR_RE.test(message) : false;
/** Formats Bun socket-close errors for user-facing reply output. */
const formatBunFetchSocketError = (message) => {
	return [
		"⚠️ LLM connection failed. This could be due to server issues, network problems, or context length exceeded (e.g., with local LLMs like LM Studio). Original error:",
		"```",
		message.trim() || "Unknown error",
		"```"
	].join("\n");
};
/** Resolves candidate-scoped fast mode after model fallback changes provider/model. */
function resolveRunFastModeForFallbackCandidate(params) {
	const state = require_fast_mode.resolveFastModeState({
		cfg: params.config,
		provider: params.provider,
		model: params.model,
		agentId: params.run.agentId,
		sessionEntry: params.sessionEntry
	});
	if (params.run.fastModeOverride) return {
		fastMode: params.run.fastMode,
		fastModeAutoOnSeconds: params.run.fastModeAutoOnSecondsOverride ? params.run.fastModeAutoOnSeconds : state.fastAutoOnSeconds
	};
	return {
		fastMode: state.mode,
		fastModeAutoOnSeconds: params.run.fastModeAutoOnSecondsOverride ? params.run.fastModeAutoOnSeconds : state.fastAutoOnSeconds
	};
}
/** Builds base embedded run params with auth and provider runtime hints. */
function buildEmbeddedRunBaseParams(params) {
	return buildEmbeddedRunBaseParams$1({
		...params,
		isReasoningTagProvider: require_provider_utils.isReasoningTagProvider
	});
}
function buildEmbeddedContextFromTemplate(params) {
	const config = params.run.config;
	const sessionCtx = {
		...params.sessionCtx,
		OriginatingChannel: params.replyRoute?.originatingChannel ?? params.sessionCtx.OriginatingChannel,
		OriginatingTo: params.replyRoute?.originatingTo ?? params.sessionCtx.OriginatingTo,
		AccountId: params.replyRoute?.originatingAccountId ?? params.sessionCtx.AccountId ?? params.run.agentAccountId,
		ChatType: require_chat_type.normalizeChatType(params.replyRoute?.originatingChatType) ?? require_chat_type.normalizeChatType(params.sessionCtx.ChatType) ?? params.run.chatType,
		MessageThreadId: params.replyRoute?.originatingThreadId ?? params.sessionCtx.MessageThreadId,
		ReplyToId: params.replyRoute?.originatingReplyToId ?? params.sessionCtx.ReplyToId
	};
	return {
		sessionId: params.run.sessionId,
		sessionKey: params.run.sessionKey,
		sandboxSessionKey: params.run.runtimePolicySessionKey,
		agentId: params.run.agentId,
		messageProvider: require_origin_routing.resolveOriginMessageProvider({
			originatingChannel: sessionCtx.OriginatingChannel,
			provider: sessionCtx.Provider
		}),
		...sessionCtx.ChatType ? { chatType: sessionCtx.ChatType } : {},
		agentAccountId: sessionCtx.AccountId,
		messageTo: require_origin_routing.resolveOriginMessageTo({
			originatingTo: sessionCtx.OriginatingTo,
			to: sessionCtx.To
		}),
		messageThreadId: sessionCtx.MessageThreadId ?? void 0,
		chatId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionCtx.NativeChannelId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionCtx.ChatId),
		memberRoleIds: normalizeMemberRoleIds(sessionCtx.MemberRoleIds),
		...buildThreadingToolContext({
			sessionCtx,
			config,
			hasRepliedRef: params.hasRepliedRef
		}),
		currentInboundAudio: require_inbound_media.hasInboundAudio(sessionCtx)
	};
}
function normalizeMemberRoleIds(value) {
	const roles = Array.isArray(value) ? value.map((roleId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(roleId)).filter((roleId) => Boolean(roleId)) : [];
	return roles.length > 0 ? roles : void 0;
}
function buildTemplateSenderContext(sessionCtx) {
	return {
		senderId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionCtx.SenderId),
		channelContext: sessionCtx.ChannelContext,
		senderName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionCtx.SenderName),
		senderUsername: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionCtx.SenderUsername),
		senderE164: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionCtx.SenderE164)
	};
}
/** Builds execution-specific embedded run params for queued reply dispatch. */
function buildEmbeddedRunExecutionParams(params) {
	const authProfile = resolveRunAuthProfile(params.run, params.provider);
	return {
		embeddedContext: buildEmbeddedContextFromTemplate({
			run: params.run,
			replyRoute: params.replyRoute,
			sessionCtx: params.sessionCtx,
			hasRepliedRef: params.hasRepliedRef
		}),
		senderContext: buildTemplateSenderContext(params.sessionCtx),
		runBaseParams: buildEmbeddedRunBaseParams({
			run: params.run,
			provider: params.provider,
			model: params.model,
			runId: params.runId,
			promptCacheKey: params.promptCacheKey,
			authProfile,
			allowTransientCooldownProbe: params.allowTransientCooldownProbe
		})
	};
}
//#endregion
Object.defineProperty(exports, "buildEmbeddedRunExecutionParams", {
	enumerable: true,
	get: function() {
		return buildEmbeddedRunExecutionParams;
	}
});
Object.defineProperty(exports, "buildThreadingToolContext", {
	enumerable: true,
	get: function() {
		return buildThreadingToolContext;
	}
});
Object.defineProperty(exports, "formatBunFetchSocketError", {
	enumerable: true,
	get: function() {
		return formatBunFetchSocketError;
	}
});
Object.defineProperty(exports, "isBunFetchSocketError", {
	enumerable: true,
	get: function() {
		return isBunFetchSocketError;
	}
});
Object.defineProperty(exports, "resolveFallbackCandidateRun", {
	enumerable: true,
	get: function() {
		return resolveFallbackCandidateRun;
	}
});
Object.defineProperty(exports, "resolveModelFallbackOptions", {
	enumerable: true,
	get: function() {
		return resolveModelFallbackOptions;
	}
});
Object.defineProperty(exports, "resolveQueuedReplyExecutionConfig", {
	enumerable: true,
	get: function() {
		return resolveQueuedReplyExecutionConfig;
	}
});
Object.defineProperty(exports, "resolveQueuedReplyRuntimeConfig", {
	enumerable: true,
	get: function() {
		return resolveQueuedReplyRuntimeConfig;
	}
});
Object.defineProperty(exports, "resolveRunAuthProfile", {
	enumerable: true,
	get: function() {
		return resolveRunAuthProfile;
	}
});
Object.defineProperty(exports, "resolveRunFastModeForFallbackCandidate", {
	enumerable: true,
	get: function() {
		return resolveRunFastModeForFallbackCandidate;
	}
});
