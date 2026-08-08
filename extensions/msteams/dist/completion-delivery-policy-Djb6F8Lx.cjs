const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_command_registration = require("./command-registration-COcka0py.cjs");
require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_command_turn_context = require("./command-turn-context-DgIVffox.cjs");
const require_conversation_binding_context = require("./conversation-binding-context-XssjEZBB.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_conversation_binding = require("./conversation-binding-CgjA96ja.cjs");
const require_commands_registry_list = require("./commands-registry-list-CKPjpslh.cjs");
const require_commands_registry_normalize = require("./commands-registry-normalize-Bo5SeH8X.cjs");
const require_abort_primitives = require("./abort-primitives-CPS0AKDl.cjs");
const require_strip_inbound_meta = require("./strip-inbound-meta-CE5-_osk.cjs");
const require_session_chat_type_shared = require("./session-chat-type-shared-ayqPRiTg.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/session-agent-binding.ts
/**
* Session-to-agent binding resolver.
*
* Derives the trusted active agent from explicit agent ids, agent session keys, or configured main-session aliases.
*/
/**
* Resolve the trusted active agent bound to a host-owned session reference.
*/
function resolveBoundAgentIdForSession(params) {
	const explicitAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId);
	if (explicitAgentId) return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(explicitAgentId);
	const normalizedSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	if (!normalizedSessionKey) return;
	const parsed = require_session_key.parseAgentSessionKey(normalizedSessionKey);
	if (parsed?.agentId) return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId);
	const loweredSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizedSessionKey);
	const mainKey = require_session_key.normalizeMainKey(params.config?.session?.mainKey);
	if (loweredSessionKey === "main" || loweredSessionKey === mainKey) return require_agent_scope_config.resolveDefaultAgentId(params.config ?? {});
}
//#endregion
//#region src/plugins/commands.ts
/**
* Plugin Command Registry
*
* Manages commands registered by plugins that bypass the LLM agent.
* These commands are processed before built-in commands and before agent invocation.
*/
const MAX_ARGS_LENGTH = 4096;
/**
* Check if a command body matches a registered plugin command.
* Returns the command definition and parsed args if matched.
*
* Note: If a command has `acceptsArgs: false` and the user provides arguments,
* the command will not match. This allows the message to fall through to
* built-in handlers or the agent. Document this behavior to plugin authors.
*/
function matchPluginCommand(commandBody, options = {}) {
	const trimmed = commandBody.trim();
	if (!trimmed.startsWith("/")) return null;
	const commandMatch = trimmed.match(/^\/\s*([^\s]+)(?:\s+([\s\S]*))?$/);
	if (!commandMatch) return null;
	const commandName = `/${commandMatch[1]}`;
	const args = commandMatch[2]?.trim();
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(commandName);
	const alternateKeys = [key];
	if (key.includes("_")) alternateKeys.push(key.replace(/_/g, "-"));
	if (key.includes("-")) alternateKeys.push(key.replace(/-/g, "_"));
	const command = alternateKeys.map((candidateKey) => require_command_registration.pluginCommands.get(candidateKey) ?? Array.from(require_command_registration.pluginCommands.values()).find((candidate) => listPluginInvocationNames(candidate).includes(candidateKey))).filter((candidate) => candidate && require_command_registration.pluginCommandSupportsChannel(candidate, options.channel)).find(Boolean) ?? null;
	if (!command) return null;
	if (args && !command.acceptsArgs) return null;
	return {
		command,
		args: args || void 0
	};
}
/**
* Sanitize command arguments to prevent injection attacks.
* Removes control characters and enforces length limits.
*/
function sanitizeArgs(args) {
	if (!args) return;
	let sanitized = "";
	for (const char of (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(args, MAX_ARGS_LENGTH)) {
		const code = char.charCodeAt(0);
		if (!(code <= 31 && code !== 9 && code !== 10 || code === 127)) sanitized += char;
	}
	return sanitized;
}
function resolveBindingConversationFromCommand(params) {
	if (!(require_runtime.getActivePluginChannelRegistry()?.channels.find((entry) => entry.plugin.id === params.channel)?.plugin)?.bindings?.resolveCommandConversation) return null;
	return require_conversation_binding_context.resolveConversationBindingContext({
		cfg: params.config ?? {},
		channel: params.channel,
		accountId: params.accountId,
		threadId: params.messageThreadId,
		threadParentId: params.threadParentId,
		senderId: params.senderId,
		originatingTo: params.from,
		commandTo: params.to,
		fallbackTo: params.to ?? params.from
	});
}
function buildPluginCommandRuntimeContext(params) {
	const sessionKey = params.sessionKey?.trim();
	const agentId = resolveBoundAgentIdForSession({
		config: params.config,
		agentId: params.agentId,
		sessionKey
	});
	if (!sessionKey && !agentId) return;
	return { llm: { complete: async (request) => {
		const { createRuntimeLlm } = await Promise.resolve().then(() => require("./runtime-llm.runtime-BdZaOBQS.cjs"));
		return await createRuntimeLlm({
			getConfig: () => params.config,
			authority: {
				caller: {
					kind: "plugin",
					id: params.command.pluginId,
					name: params.command.pluginName
				},
				pluginIdForPolicy: params.command.pluginId,
				requiresBoundAgent: true,
				...sessionKey ? { sessionKey } : {},
				...agentId ? { agentId } : {},
				...params.authProfileId ? { preferredProfile: params.authProfileId } : {},
				allowAgentIdOverride: false,
				allowModelOverride: false,
				allowComplete: true
			}
		}).complete(request);
	} } };
}
/**
* Execute a plugin command handler.
*
* Note: Plugin authors should still validate and sanitize ctx.args for their
* specific use case. This function provides basic defense-in-depth sanitization.
*/
async function executePluginCommand(params) {
	const { command, args, senderId, channel, isAuthorizedSender, commandBody, config } = params;
	if (!require_command_registration.pluginCommandSupportsChannel(command, channel)) {
		require_globals.logVerbose(`Plugin command /${command.name} skipped on unsupported channel ${channel}`);
		return { continueAgent: true };
	}
	if (command.requireAuth !== false && !isAuthorizedSender) {
		require_globals.logVerbose(`Plugin command /${command.name} blocked: unauthorized sender ${senderId || "<unknown>"}`);
		return { text: "⚠️ This command requires authorization." };
	}
	if (command.requiredScopes !== void 0 && !Array.isArray(command.requiredScopes)) {
		require_globals.logVerbose(`Plugin command /${command.name} blocked: invalid requiredScopes configuration`);
		return { text: "⚠️ This command has invalid gateway scope configuration." };
	}
	const requiredScopes = command.requiredScopes ?? [];
	if (requiredScopes.find((scope) => !require_operator_scopes.isOperatorScope(scope))) {
		require_globals.logVerbose(`Plugin command /${command.name} blocked: unknown gateway scope`);
		return { text: "⚠️ This command has invalid gateway scope configuration." };
	}
	if (requiredScopes.length > 0) {
		const senderIsOwner = params.senderIsOwner === true;
		const scopes = Array.isArray(params.gatewayClientScopes) ? new Set(params.gatewayClientScopes) : void 0;
		const hasGatewayScopeContext = scopes !== void 0;
		const hasAdmin = scopes?.has(require_operator_scopes.ADMIN_SCOPE) === true;
		const missingScope = scopes ? requiredScopes.find((scope) => !hasAdmin && !scopes.has(scope)) : requiredScopes[0];
		if (missingScope && (hasGatewayScopeContext || !senderIsOwner)) {
			require_globals.logVerbose(`Plugin command /${command.name} blocked: missing gateway scope ${missingScope}`);
			return { text: `⚠️ This command requires gateway scope: ${missingScope}.` };
		}
	}
	const sanitizedArgs = sanitizeArgs(args);
	const bindingConversation = resolveBindingConversationFromCommand({
		config,
		channel,
		senderId,
		from: params.from,
		to: params.to,
		accountId: params.accountId,
		messageThreadId: params.messageThreadId,
		threadParentId: params.threadParentId
	});
	const effectiveAccountId = bindingConversation?.accountId ?? params.accountId;
	const senderIsOwnerForCommand = require_command_registration.canExposeSenderIsOwner(command) || require_command_registration.isTrustedReservedCommandOwner(command) && command.ownership === "reserved" && require_command_registration.isReservedCommandName(command.name) && command.pluginId === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(command.name) ? params.senderIsOwner : void 0;
	const diagnosticsPrivateRoutedForCommand = require_command_registration.isTrustedReservedCommandOwner(command) && command.ownership === "reserved" && require_command_registration.isReservedCommandName(command.name) && command.pluginId === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(command.name) ? params.diagnosticsPrivateRouted : void 0;
	const diagnosticsUploadApprovedForCommand = require_command_registration.isTrustedReservedCommandOwner(command) && command.ownership === "reserved" && require_command_registration.isReservedCommandName(command.name) && command.pluginId === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(command.name) ? params.diagnosticsUploadApproved : void 0;
	const diagnosticsPreviewOnlyForCommand = require_command_registration.isTrustedReservedCommandOwner(command) && command.ownership === "reserved" && require_command_registration.isReservedCommandName(command.name) && command.pluginId === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(command.name) ? params.diagnosticsPreviewOnly : void 0;
	const ctx = {
		senderId,
		channel,
		channelId: params.channelId,
		isAuthorizedSender,
		...senderIsOwnerForCommand === void 0 ? {} : { senderIsOwner: senderIsOwnerForCommand },
		gatewayClientScopes: params.gatewayClientScopes,
		agentId: params.agentId,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		sessionFile: params.sessionFile,
		args: sanitizedArgs,
		commandBody,
		config,
		from: params.from,
		to: params.to,
		accountId: effectiveAccountId,
		messageThreadId: params.messageThreadId,
		threadParentId: params.threadParentId,
		diagnosticsSessions: params.diagnosticsSessions,
		runtimeContext: buildPluginCommandRuntimeContext({
			command,
			config,
			agentId: params.agentId,
			sessionKey: params.sessionKey,
			authProfileId: params.authProfileId
		}),
		...diagnosticsUploadApprovedForCommand === void 0 ? {} : { diagnosticsUploadApproved: diagnosticsUploadApprovedForCommand },
		...diagnosticsPreviewOnlyForCommand === void 0 ? {} : { diagnosticsPreviewOnly: diagnosticsPreviewOnlyForCommand },
		...diagnosticsPrivateRoutedForCommand === void 0 ? {} : { diagnosticsPrivateRouted: diagnosticsPrivateRoutedForCommand },
		requestConversationBinding: async (bindingParams) => {
			if (!command.pluginRoot || !bindingConversation) return {
				status: "error",
				message: "This command cannot bind the current conversation."
			};
			return require_conversation_binding.requestPluginConversationBinding({
				pluginId: command.pluginId,
				pluginName: command.pluginName,
				pluginRoot: command.pluginRoot,
				requestedBySenderId: senderId,
				conversation: bindingConversation,
				binding: bindingParams
			});
		},
		detachConversationBinding: async () => {
			if (!command.pluginRoot || !bindingConversation) return { removed: false };
			return require_conversation_binding.detachPluginConversationBinding({
				pluginRoot: command.pluginRoot,
				conversation: bindingConversation
			});
		},
		getCurrentConversationBinding: async () => {
			if (!command.pluginRoot || !bindingConversation) return null;
			return require_conversation_binding.getCurrentPluginConversationBinding({
				pluginRoot: command.pluginRoot,
				conversation: bindingConversation
			});
		}
	};
	require_command_registration.setPluginCommandRegistryLocked(true);
	try {
		const result = await command.handler(ctx);
		require_globals.logVerbose(`Plugin command /${command.name} executed successfully for ${senderId || "unknown"}`);
		if (!result || typeof result !== "object") {
			require_globals.logVerbose(`Plugin command /${command.name} returned no reply payload`);
			return {};
		}
		return result;
	} catch (err) {
		const error = err;
		require_globals.logVerbose(`Plugin command /${command.name} error: ${error.message}`);
		return { text: "⚠️ Command failed. Please try again later." };
	} finally {
		require_command_registration.setPluginCommandRegistryLocked(false);
	}
}
/**
* List all registered plugin commands.
* Used for /help and /commands output.
*/
function listPluginCommands() {
	return Array.from(require_command_registration.pluginCommands.values()).map((cmd) => ({
		name: cmd.name,
		description: cmd.description,
		pluginId: cmd.pluginId,
		acceptsArgs: cmd.acceptsArgs ?? false
	}));
}
function listPluginInvocationNames(command) {
	return require_command_registration.listPluginInvocationKeys(command);
}
//#endregion
//#region src/auto-reply/command-detection.ts
/** Command detectors used by inbound authorization and control-command routing. */
/** Returns true when text starts with a configured control command alias. */
function hasControlCommand(text, cfg, options) {
	if (!text) return false;
	const trimmed = text.trim();
	if (!trimmed) return false;
	const stripped = require_strip_inbound_meta.stripInboundMetadata(trimmed);
	if (!stripped) return false;
	const normalizedBody = require_commands_registry_normalize.normalizeCommandBody(stripped, options);
	if (!normalizedBody) return false;
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizedBody);
	const commands = cfg ? require_commands_registry_list.listChatCommandsForConfig(cfg) : require_commands_registry_list.listChatCommands();
	for (const command of commands) for (const alias of command.textAliases) {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(alias);
		if (!normalized) continue;
		if (lowered === normalized) return true;
		if (command.acceptsArgs && lowered.startsWith(normalized)) {
			const nextChar = normalizedBody.charAt(normalized.length);
			if (nextChar && /\s/.test(nextChar)) return true;
		}
	}
	return false;
}
/** Returns true for exact control commands or abort triggers after metadata stripping. */
function isControlCommandMessage(text, cfg, options) {
	if (!text) return false;
	const trimmed = text.trim();
	if (!trimmed) return false;
	if (hasControlCommand(trimmed, cfg, options)) return true;
	return require_abort_primitives.isAbortTrigger((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(require_commands_registry_normalize.normalizeCommandBody(require_strip_inbound_meta.stripInboundMetadata(trimmed), options)) ?? "");
}
/**
* Coarse detection for inline directives/shortcuts (e.g. "hey /status") so channel monitors
* can decide whether to compute CommandAuthorized for a message.
*
* This intentionally errs on the side of false positives; CommandAuthorized only gates
* command/directive execution, not normal chat replies.
*/
function hasInlineCommandTokens(text) {
	const body = text ?? "";
	if (!body.trim()) return false;
	return /(?:^|\s)[/!][a-z]/i.test(body);
}
function hasSpacedPluginCommand(text) {
	const commandBody = text?.match(/(?:^|\s)(\/\s+[a-z][\s\S]*)/i)?.[1];
	return commandBody ? matchPluginCommand(commandBody) !== null : false;
}
/** Returns true when a message may need command authorization metadata. */
function shouldComputeCommandAuthorized(text, cfg, options) {
	return isControlCommandMessage(text, cfg, options) || hasInlineCommandTokens(text) || hasSpacedPluginCommand(text);
}
//#endregion
//#region src/auto-reply/command-turn-detection.ts
/** Fallback command-turn detection for mixed native/text channel metadata. */
function resolveCommandBody(input) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.CommandBody) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.BodyForCommands) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.RawBody) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.Body);
}
function resolveVisibleMessageBody(input) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.RawBody) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.Body);
}
function resolveStructuredNormalFallbackBody(input) {
	const visibleBody = resolveVisibleMessageBody(input);
	if (!/^[!/]/.test(visibleBody ?? "")) return;
	return resolveCommandBody(input) ?? visibleBody;
}
function hasCommandSourceMetadata(input) {
	return input.CommandSource === "native" || input.CommandSource === "text" || input.CommandSource === "message";
}
/** Returns true when inbound metadata or command text identifies an explicit command turn. */
function isExplicitCommandTurnContext(input, cfg) {
	if (require_command_turn_context.isExplicitCommandTurn(require_command_turn_context.resolveCommandTurnContext(input))) return true;
	if (input.CommandSource === "native" || input.CommandSource === "text") return false;
	const fallbackBody = input.CommandTurn !== void 0 || hasCommandSourceMetadata(input) ? resolveStructuredNormalFallbackBody(input) : resolveCommandBody(input);
	return input.CommandAuthorized === true && isControlCommandMessage(fallbackBody, cfg, { botUsername: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.BotUsername) });
}
//#endregion
//#region src/auto-reply/reply/source-reply-delivery-mode.ts
/** Source-reply visibility and suppression policy for auto-reply delivery. */
function toSessionStableDeliveryModeContext(ctx) {
	return {
		ChatType: ctx.ChatType,
		Provider: ctx.Provider,
		Surface: ctx.Surface,
		ExplicitDeliverRoute: ctx.ExplicitDeliverRoute
	};
}
/** Returns true when the turn explicitly invoked a source-visible command. */
function isExplicitSourceReplyCommand(ctx, cfg) {
	return isExplicitCommandTurnContext(ctx, cfg);
}
/** Returns true for text slash commands that lack authorization metadata. */
function isUnauthorizedTextSlashCommand(ctx) {
	const commandTurn = require_command_turn_context.resolveCommandTurnContext(ctx);
	return commandTurn.kind === "text-slash" && !commandTurn.authorized && (commandTurn.commandName !== void 0 || commandTurn.body?.trim().startsWith("/") === true);
}
function isInternalRoomEvent(ctx) {
	return ctx.InboundEventKind === "room_event" && isInternalSourceReplyChannel(ctx);
}
/** Returns true for internal message-channel turns that should remain local. */
function isInternalSourceReplyChannel(ctx) {
	const providerChannel = require_message_channel.normalizeMessageChannel(ctx.Provider);
	const surfaceChannel = require_message_channel.normalizeMessageChannel(ctx.Surface);
	return (providerChannel ?? surfaceChannel) === "webchat" && (surfaceChannel === "webchat" || !surfaceChannel) && ctx.ExplicitDeliverRoute !== true;
}
/** Resolves whether normal final text should auto-deliver or require the message tool. */
function resolveSourceReplyDeliveryMode(params) {
	if (params.strictMessageToolOnly === true) return "message_tool_only";
	if (params.ctx.InboundEventKind === "room_event" && !isInternalRoomEvent(params.ctx)) return "message_tool_only";
	if (params.requested && (params.requested !== "message_tool_only" || params.messageToolAvailable !== false)) return params.requested;
	if (isExplicitSourceReplyCommand(params.ctx, params.cfg)) return "automatic";
	const chatType = require_chat_type.normalizeChatType(params.ctx.ChatType);
	if ((chatType === "group" || chatType === "channel") && isUnauthorizedTextSlashCommand(params.ctx)) return "message_tool_only";
	let mode;
	if (chatType === "group" || chatType === "channel") mode = (params.cfg.messages?.groupChat?.visibleReplies ?? params.cfg.messages?.visibleReplies) === "message_tool" ? "message_tool_only" : "automatic";
	else mode = (params.cfg.messages?.visibleReplies ?? (isInternalSourceReplyChannel(params.ctx) ? "automatic" : params.defaultVisibleReplies)) === "message_tool" ? "message_tool_only" : "automatic";
	if (mode === "message_tool_only" && params.messageToolAvailable === false) return "automatic";
	return mode;
}
/** Resolves source delivery, hooks, lifecycle, and typing suppression flags. */
function resolveSourceReplyVisibilityPolicy(params) {
	const sourceReplyDeliveryMode = resolveSourceReplyDeliveryMode({
		cfg: params.cfg,
		ctx: params.ctx,
		requested: params.requested,
		strictMessageToolOnly: params.strictMessageToolOnly,
		messageToolAvailable: params.messageToolAvailable,
		defaultVisibleReplies: params.defaultVisibleReplies
	});
	const sessionStableSourceReplyDeliveryMode = params.requested !== void 0 || isExplicitSourceReplyCommand(params.ctx, params.cfg) ? sourceReplyDeliveryMode : resolveSourceReplyDeliveryMode({
		cfg: params.cfg,
		ctx: toSessionStableDeliveryModeContext(params.ctx),
		messageToolAvailable: params.messageToolAvailable,
		defaultVisibleReplies: params.defaultVisibleReplies
	});
	const sendPolicyDenied = params.sendPolicy === "deny";
	const suppressAutomaticSourceDelivery = sourceReplyDeliveryMode === "message_tool_only";
	const suppressDelivery = sendPolicyDenied || suppressAutomaticSourceDelivery;
	const deliverySuppressionReason = sendPolicyDenied ? "sendPolicy: deny" : suppressAutomaticSourceDelivery ? "sourceReplyDeliveryMode: message_tool_only" : "";
	return {
		sourceReplyDeliveryMode,
		sessionStableSourceReplyDeliveryMode,
		sendPolicyDenied,
		suppressAutomaticSourceDelivery,
		suppressDelivery,
		suppressHookUserDelivery: params.suppressAcpChildUserDelivery === true || suppressDelivery,
		suppressHookReplyLifecycle: sendPolicyDenied || params.suppressAcpChildUserDelivery === true || params.explicitSuppressTyping === true || params.shouldSuppressTyping === true,
		suppressTyping: sendPolicyDenied || params.explicitSuppressTyping === true || params.shouldSuppressTyping === true,
		deliverySuppressionReason
	};
}
//#endregion
//#region src/auto-reply/reply/completion-delivery-policy.ts
function resolveCompletionChatType(params) {
	const explicit = require_chat_type.normalizeChatType(params.requesterEntry?.chatType ?? params.requesterEntry?.origin?.chatType ?? void 0);
	if (explicit) return explicit;
	for (const key of [params.targetRequesterSessionKey, params.requesterSessionKey]) {
		const derived = require_session_chat_type_shared.deriveSessionChatTypeFromKey(key);
		if (derived !== "unknown") return derived;
	}
	return inferCompletionChatTypeFromTarget(params.directOrigin?.to ?? params.requesterSessionOrigin?.to);
}
function completionRequiresMessageToolDelivery(params) {
	return resolveSourceReplyDeliveryMode({
		cfg: params.cfg,
		ctx: { ChatType: resolveCompletionChatType(params) },
		messageToolAvailable: params.messageToolAvailable
	}) === "message_tool_only";
}
/** Resolve transport authority for a durable, fixed-route agent completion. */
function resolveDurableCompletionDeliveryMode(sourceReplyDeliveryMode) {
	return sourceReplyDeliveryMode === "message_tool_only" ? "host_owned" : "automatic";
}
function shouldRouteCompletionThroughRequesterSession(sessionKey) {
	const chatType = require_session_chat_type_shared.deriveSessionChatTypeFromKey(sessionKey);
	return chatType === "group" || chatType === "channel";
}
function inferCompletionChatTypeFromTarget(to) {
	const normalized = to?.trim().toLowerCase();
	if (!normalized) return "unknown";
	if (normalized.startsWith("group:")) return "group";
	if (normalized.startsWith("channel:") || normalized.startsWith("thread:")) return "channel";
	if (normalized.startsWith("dm:") || normalized.startsWith("direct:") || normalized.startsWith("user:")) return "direct";
	return "unknown";
}
//#endregion
Object.defineProperty(exports, "completionRequiresMessageToolDelivery", {
	enumerable: true,
	get: function() {
		return completionRequiresMessageToolDelivery;
	}
});
Object.defineProperty(exports, "executePluginCommand", {
	enumerable: true,
	get: function() {
		return executePluginCommand;
	}
});
Object.defineProperty(exports, "hasControlCommand", {
	enumerable: true,
	get: function() {
		return hasControlCommand;
	}
});
Object.defineProperty(exports, "isControlCommandMessage", {
	enumerable: true,
	get: function() {
		return isControlCommandMessage;
	}
});
Object.defineProperty(exports, "isExplicitSourceReplyCommand", {
	enumerable: true,
	get: function() {
		return isExplicitSourceReplyCommand;
	}
});
Object.defineProperty(exports, "isInternalSourceReplyChannel", {
	enumerable: true,
	get: function() {
		return isInternalSourceReplyChannel;
	}
});
Object.defineProperty(exports, "isUnauthorizedTextSlashCommand", {
	enumerable: true,
	get: function() {
		return isUnauthorizedTextSlashCommand;
	}
});
Object.defineProperty(exports, "listPluginCommands", {
	enumerable: true,
	get: function() {
		return listPluginCommands;
	}
});
Object.defineProperty(exports, "matchPluginCommand", {
	enumerable: true,
	get: function() {
		return matchPluginCommand;
	}
});
Object.defineProperty(exports, "resolveBoundAgentIdForSession", {
	enumerable: true,
	get: function() {
		return resolveBoundAgentIdForSession;
	}
});
Object.defineProperty(exports, "resolveDurableCompletionDeliveryMode", {
	enumerable: true,
	get: function() {
		return resolveDurableCompletionDeliveryMode;
	}
});
Object.defineProperty(exports, "resolveSourceReplyVisibilityPolicy", {
	enumerable: true,
	get: function() {
		return resolveSourceReplyVisibilityPolicy;
	}
});
Object.defineProperty(exports, "shouldComputeCommandAuthorized", {
	enumerable: true,
	get: function() {
		return shouldComputeCommandAuthorized;
	}
});
Object.defineProperty(exports, "shouldRouteCompletionThroughRequesterSession", {
	enumerable: true,
	get: function() {
		return shouldRouteCompletionThroughRequesterSession;
	}
});
