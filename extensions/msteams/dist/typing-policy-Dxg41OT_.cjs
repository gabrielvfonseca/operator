const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
require("./message-channel-core-CeN5z1gK.cjs");
require("./message-channel-jMzaqV09.cjs");
const require_command_turn_context = require("./command-turn-context-DgIVffox.cjs");
const require_commands_registry_normalize = require("./commands-registry-normalize-Bo5SeH8X.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_mentions = require("./mentions-xs5giNxG.cjs");
const require_session_key = require("./session-key-DBTOYACI.cjs");
const require_commands_goal = require("./commands-goal-DIz7DN-c.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
require("./commands-registry-BvZ3TCTG.cjs");
const require_commands_reset_mode = require("./commands-reset-mode-DndD8dZI.cjs");
const require_inbound_media = require("./inbound-media-BBtmPEwr.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/auto-reply/reply/reply-config-runtime-mode.ts
const replyConfigRuntimeModes = /* @__PURE__ */ new WeakMap();
function markReplyConfigRuntimeMode(config, runtimeMode) {
	replyConfigRuntimeModes.set(config, runtimeMode);
	return config;
}
function isCompleteReplyConfig(config) {
	return Boolean(config && typeof config === "object" && replyConfigRuntimeModes.has(config));
}
function usesFullReplyRuntime(config) {
	return Boolean(config && typeof config === "object" && replyConfigRuntimeModes.get(config) === "full");
}
//#endregion
//#region src/auto-reply/reply/session-entry-handle.ts
function createReplySessionEntryHandle(params) {
	const entries = params.sessionStore ?? { [params.sessionKey]: params.sessionEntry };
	let currentEntry = params.sessionEntry;
	entries[params.sessionKey] = currentEntry;
	return {
		clearCurrent: () => {
			currentEntry = void 0;
			delete entries[params.sessionKey];
		},
		get: (sessionKey) => entries[sessionKey],
		getCurrent: () => currentEntry,
		patchCurrent: (patch) => {
			if (!currentEntry) return;
			currentEntry = {
				...currentEntry,
				...patch
			};
			entries[params.sessionKey] = currentEntry;
			return currentEntry;
		},
		replaceCurrent: (entry) => {
			currentEntry = entry;
			entries[params.sessionKey] = entry;
		},
		set: (sessionKey, entry) => {
			entries[sessionKey] = entry;
			if (sessionKey === params.sessionKey) currentEntry = entry;
		},
		toCompatSessionStore: () => entries
	};
}
//#endregion
//#region src/auto-reply/reply/get-reply-fast-path.ts
function isSlowReplyTestAllowed(env = process.env) {
	return env.OPERATOR_ALLOW_SLOW_REPLY_TESTS === "1" || env.OPERATOR_STRICT_FAST_REPLY_CONFIG === "0";
}
function resolveFastSessionKey(params) {
	const { ctx } = params;
	const nativeCommandTarget = require_command_turn_context.resolveCommandTurnTargetSessionKey(ctx) ?? "";
	if (nativeCommandTarget) return nativeCommandTarget;
	return require_session_key.resolveSessionKey(params.sessionScope, ctx, params.mainKey);
}
function withFullRuntimeReplyConfig(config) {
	return markReplyConfigRuntimeMode(config, "full");
}
function resolveGetReplyConfig(params) {
	const { configOverride } = params;
	if (configOverride == null) return params.getRuntimeConfig();
	if (params.isFastTestEnv && !isCompleteReplyConfig(configOverride) && !isSlowReplyTestAllowed()) throw new Error("Fast reply tests must pass with withFastReplyConfig()/markCompleteReplyConfig(); set OPERATOR_ALLOW_SLOW_REPLY_TESTS=1 to opt out.");
	if (params.isFastTestEnv && isCompleteReplyConfig(configOverride)) return configOverride;
	if (isCompleteReplyConfig(configOverride)) return configOverride;
	return require_io.applyMergePatch(params.getRuntimeConfig(), configOverride);
}
function shouldUseReplyFastTestBootstrap(params) {
	return params.isFastTestEnv && isCompleteReplyConfig(params.configOverride) && !usesFullReplyRuntime(params.configOverride);
}
function shouldUseReplyFastTestRuntime(params) {
	return params.isFastTestEnv && isCompleteReplyConfig(params.cfg) && !usesFullReplyRuntime(params.cfg);
}
function shouldUseReplyFastDirectiveExecution(params) {
	if (!params.isFastTestBootstrap || params.isGroup || params.isHeartbeat || params.resetTriggered) return false;
	return !params.triggerBodyNormalized.includes("/");
}
function buildFastReplyCommandContext(params) {
	const { ctx, cfg, agentId, sessionKey, isGroup, triggerBodyNormalized, commandAuthorized } = params;
	const originatingChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.OriginatingChannel);
	const surface = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.Surface ?? ctx.Provider) ?? "";
	const channel = originatingChannel ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.Provider ?? surface) ?? "";
	const from = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.From ?? ctx.SenderId);
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.To ?? ctx.OriginatingTo);
	return {
		surface,
		channel,
		channelId: require_registry_normalize.normalizeAnyChannelId(channel) ?? require_registry_normalize.normalizeAnyChannelId(surface) ?? void 0,
		accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.AccountId),
		ownerList: [],
		senderIsOwner: false,
		isAuthorizedSender: commandAuthorized,
		senderId: from,
		abortKey: sessionKey ?? from ?? to,
		rawBodyNormalized: triggerBodyNormalized,
		commandBodyNormalized: require_commands_registry_normalize.normalizeCommandBody(isGroup ? require_mentions.stripMentions(triggerBodyNormalized, ctx, cfg, agentId) : triggerBodyNormalized, { botUsername: ctx.BotUsername }),
		from,
		to
	};
}
function shouldHandleFastReplyTextCommands(params) {
	return params.commandSource === "native" || params.cfg.commands?.text !== false;
}
function initFastReplySessionState(params) {
	const { ctx, cfg, agentId, commandAuthorized } = params;
	const sessionScope = cfg.session?.scope ?? "per-sender";
	const sessionKey = resolveFastSessionKey({
		ctx,
		sessionScope,
		mainKey: cfg.session?.mainKey
	});
	const storePath = require_paths.resolveStorePath(cfg.session?.store, { agentId });
	const sessionStore = Object.fromEntries(require_session_accessor.listSessionEntries({ storePath }).map(({ sessionKey: entryKey, entry }) => [entryKey, entry]));
	const existingEntry = require_session_accessor.loadSessionEntry({
		storePath,
		sessionKey
	});
	const commandSource = ctx.BodyForCommands ?? ctx.CommandBody ?? ctx.RawBody ?? ctx.Body ?? "";
	const triggerBodyNormalized = require_commands_goal.isFormattedGoalContinuationPrompt(commandSource) ? commandSource.trim() : require_mentions.stripStructuralPrefixes(commandSource).trim();
	const normalizedChatType = require_chat_type.normalizeChatType(ctx.ChatType);
	const isGroup = normalizedChatType != null && normalizedChatType !== "direct";
	const normalizedResetBody = require_commands_registry_normalize.normalizeCommandBody(isGroup ? require_mentions.stripMentions(triggerBodyNormalized, ctx, cfg, agentId) : triggerBodyNormalized, { botUsername: ctx.BotUsername });
	const softReset = require_commands_reset_mode.parseSoftResetCommand(normalizedResetBody);
	const resetMatch = normalizedResetBody.match(/^\/(new|reset)(?:\s|$)/i);
	const resetTriggered = Boolean(resetMatch) && !softReset.matched;
	if (resetTriggered && require_model_overrides.isModelSelectionLocked(existingEntry)) throw new require_model_overrides.ModelSelectionLockedError(require_model_overrides.MODEL_SELECTION_LOCKED_RESET_MESSAGE);
	const previousSessionEntry = resetTriggered && existingEntry ? { ...existingEntry } : void 0;
	const sessionId = !resetTriggered && existingEntry ? existingEntry.sessionId : node_crypto.default.randomUUID();
	const bodyStripped = resetTriggered ? normalizedResetBody.slice(resetMatch?.[0].length ?? 0).trimStart() : ctx.BodyForAgent ?? ctx.Body ?? "";
	const now = Date.now();
	const sessionFile = !resetTriggered && existingEntry?.sessionFile ? existingEntry.sessionFile : require_sqlite_marker.formatSqliteSessionFileMarker({
		agentId,
		sessionId,
		storePath
	});
	const sessionEntry = {
		...!resetTriggered ? existingEntry : void 0,
		sessionId,
		sessionFile,
		updatedAt: now,
		sessionStartedAt: resetTriggered ? now : existingEntry?.sessionStartedAt ?? now,
		lastInteractionAt: now,
		thinkingLevel: resetTriggered ? existingEntry?.thinkingLevel : existingEntry?.thinkingLevel,
		verboseLevel: resetTriggered ? existingEntry?.verboseLevel : existingEntry?.verboseLevel,
		reasoningLevel: resetTriggered ? existingEntry?.reasoningLevel : existingEntry?.reasoningLevel,
		ttsAuto: resetTriggered ? existingEntry?.ttsAuto : existingEntry?.ttsAuto,
		responseUsage: existingEntry?.responseUsage,
		modelOverride: resetTriggered ? existingEntry?.modelOverride : existingEntry?.modelOverride,
		providerOverride: resetTriggered ? existingEntry?.providerOverride : existingEntry?.providerOverride,
		authProfileOverride: resetTriggered ? existingEntry?.authProfileOverride : existingEntry?.authProfileOverride,
		authProfileOverrideSource: resetTriggered ? existingEntry?.authProfileOverrideSource : existingEntry?.authProfileOverrideSource,
		authProfileOverrideCompactionCount: resetTriggered ? existingEntry?.authProfileOverrideCompactionCount : existingEntry?.authProfileOverrideCompactionCount,
		...normalizedChatType ? { chatType: normalizedChatType } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.Provider) ? { channel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.Provider) } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.GroupSubject) ? { subject: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.GroupSubject) } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.GroupChannel) ? { groupChannel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.GroupChannel) } : {}
	};
	sessionStore[sessionKey] = sessionEntry;
	const sessionEntryHandle = createReplySessionEntryHandle({
		sessionEntry,
		sessionKey,
		sessionStore
	});
	return {
		sessionCtx: {
			...ctx,
			SessionKey: sessionKey,
			CommandAuthorized: commandAuthorized,
			BodyStripped: bodyStripped,
			...normalizedChatType ? { ChatType: normalizedChatType } : {}
		},
		sessionEntry,
		initialSessionEntry: existingEntry ? { ...existingEntry } : void 0,
		sessionEntryHandle,
		sessionStore,
		sessionKey,
		sessionId,
		isNewSession: resetTriggered || !existingEntry,
		resetTriggered,
		systemSent: false,
		abortedLastRun: false,
		storePath,
		sessionScope,
		groupResolution: void 0,
		isGroup,
		bodyStripped,
		triggerBodyNormalized,
		previousSessionEntry
	};
}
//#endregion
//#region src/auto-reply/reply/stage-remote-inbound-media.ts
/** Shared guard for staging remote inbound media into the local cache. */
const stageSandboxMediaRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./stage-sandbox-media.runtime-C7rCdRzb.cjs")));
/**
* Stage remote (SCP) inbound media before downstream consumers read the media
* paths off ctx, then mark MediaStaged so the single-stage contract holds for
* later staging sites. Both the dispatch plugin-claim path and get-reply's
* media-understanding path rely on this rewrite to expose the local cache path
* instead of the unreachable remote host path; returns whether staging ran.
*/
async function stageRemoteInboundMediaIfNeeded(params) {
	if (!params.sessionKey || params.ctx.MediaStaged || !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ctx.MediaRemoteHost) || !require_inbound_media.hasInboundMedia(params.ctx)) return false;
	const { stageSandboxMedia } = await stageSandboxMediaRuntimeLoader.load();
	if ((await stageSandboxMedia({
		ctx: params.ctx,
		sessionCtx: params.ctx,
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		workspaceDir: params.workspaceDir,
		remoteMediaMode: params.remoteMediaMode
	})).staged.size === 0) return false;
	params.ctx.MediaStaged = true;
	return true;
}
//#endregion
//#region src/auto-reply/reply/typing-policy.ts
/** Resolves typing policy and suppresses typing for non-user-visible turns. */
function resolveRunTypingPolicy(params) {
	const typingPolicy = params.isHeartbeat ? "heartbeat" : params.originatingChannel === "webchat" ? "internal_webchat" : params.systemEvent ? "system_event" : params.requestedPolicy ?? "auto";
	return {
		typingPolicy,
		suppressTyping: params.suppressTyping === true || typingPolicy === "heartbeat" || typingPolicy === "system_event" || typingPolicy === "internal_webchat"
	};
}
//#endregion
Object.defineProperty(exports, "buildFastReplyCommandContext", {
	enumerable: true,
	get: function() {
		return buildFastReplyCommandContext;
	}
});
Object.defineProperty(exports, "createReplySessionEntryHandle", {
	enumerable: true,
	get: function() {
		return createReplySessionEntryHandle;
	}
});
Object.defineProperty(exports, "initFastReplySessionState", {
	enumerable: true,
	get: function() {
		return initFastReplySessionState;
	}
});
Object.defineProperty(exports, "resolveGetReplyConfig", {
	enumerable: true,
	get: function() {
		return resolveGetReplyConfig;
	}
});
Object.defineProperty(exports, "resolveRunTypingPolicy", {
	enumerable: true,
	get: function() {
		return resolveRunTypingPolicy;
	}
});
Object.defineProperty(exports, "shouldHandleFastReplyTextCommands", {
	enumerable: true,
	get: function() {
		return shouldHandleFastReplyTextCommands;
	}
});
Object.defineProperty(exports, "shouldUseReplyFastDirectiveExecution", {
	enumerable: true,
	get: function() {
		return shouldUseReplyFastDirectiveExecution;
	}
});
Object.defineProperty(exports, "shouldUseReplyFastTestBootstrap", {
	enumerable: true,
	get: function() {
		return shouldUseReplyFastTestBootstrap;
	}
});
Object.defineProperty(exports, "shouldUseReplyFastTestRuntime", {
	enumerable: true,
	get: function() {
		return shouldUseReplyFastTestRuntime;
	}
});
Object.defineProperty(exports, "stageRemoteInboundMediaIfNeeded", {
	enumerable: true,
	get: function() {
		return stageRemoteInboundMediaIfNeeded;
	}
});
Object.defineProperty(exports, "withFullRuntimeReplyConfig", {
	enumerable: true,
	get: function() {
		return withFullRuntimeReplyConfig;
	}
});
