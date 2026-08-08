require("./rolldown-runtime-u92d-OFm.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_session_binding_normalization = require("./session-binding-normalization-DSoe9GtS.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_conversation_binding_input = require("./conversation-binding-input-CJRXIfwl.cjs");
const require_thread_bindings_policy = require("./thread-bindings-policy-C0B1MJxA.cjs");
const require_thread_bindings_messages = require("./thread-bindings-messages-DajtqEC-.cjs");
const require_shared = require("./shared-DZ6zsntB.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_acp_core_runtime_session_identifiers = require("@gabrielvfonseca/acp-core/runtime/session-identifiers");
//#region src/auto-reply/reply/commands-subagents/action-focus.ts
function resolveFocusBindingContext(params) {
	const bindingContext = require_conversation_binding_input.resolveConversationBindingContextFromAcpCommand(params);
	if (!bindingContext) return null;
	const chatType = require_chat_type.normalizeChatType(params.ctx.ChatType);
	const conversation = require_session_binding_normalization.normalizeConversationRef({
		channel: bindingContext.channel,
		accountId: bindingContext.accountId,
		conversationId: bindingContext.conversationId,
		parentConversationId: bindingContext.parentConversationId
	});
	return {
		channel: conversation.channel,
		accountId: conversation.accountId,
		conversationId: conversation.conversationId,
		...conversation.parentConversationId ? { parentConversationId: conversation.parentConversationId } : {},
		placement: chatType === "direct" ? "current" : require_thread_bindings_policy.resolveThreadBindingPlacementForCurrentContext({
			channel: bindingContext.channel,
			threadId: bindingContext.threadId || void 0
		})
	};
}
async function handleSubagentsFocusAction(ctx) {
	const { params, runs, restTokens } = ctx;
	const token = restTokens.join(" ").trim();
	if (!token) return require_shared.stopWithText("Usage: /focus <subagent-label|session-key|session-id|session-label>");
	const controller = require_shared.resolveCommandSubagentController(params, ctx.requesterKey);
	if (controller.controlScope !== "children") return require_shared.stopWithText("⚠️ Leaf subagents cannot control other sessions.");
	const bindingContext = resolveFocusBindingContext(params);
	if (!bindingContext) return require_shared.stopWithText("⚠️ /focus must be run inside a bindable conversation.");
	const bindingService = require_session_binding_service.getSessionBindingService();
	const capabilities = bindingService.getCapabilities({
		channel: bindingContext.channel,
		accountId: bindingContext.accountId
	});
	if (!capabilities.adapterAvailable || !capabilities.bindSupported) return require_shared.stopWithText("⚠️ Conversation bindings are unavailable for this account.");
	const focusTarget = await require_shared.resolveFocusTargetSession({
		runs,
		token,
		requesterKey: controller.controllerSessionKey
	});
	if (!focusTarget) return require_shared.stopWithText(`⚠️ Unable to resolve focus target: ${token}`);
	if (bindingContext.placement === "child") {
		const spawnPolicy = require_thread_bindings_policy.resolveThreadBindingSpawnPolicy({
			cfg: params.cfg,
			channel: bindingContext.channel,
			accountId: bindingContext.accountId,
			kind: "subagent"
		});
		if (!spawnPolicy.enabled) return require_shared.stopWithText(`⚠️ ${require_thread_bindings_policy.formatThreadBindingDisabledError({
			channel: spawnPolicy.channel,
			accountId: spawnPolicy.accountId,
			kind: "subagent"
		})}`);
		if (bindingContext.placement === "child" && !spawnPolicy.spawnEnabled) return require_shared.stopWithText(`⚠️ ${require_thread_bindings_policy.formatThreadBindingSpawnDisabledError({
			channel: spawnPolicy.channel,
			accountId: spawnPolicy.accountId,
			kind: "subagent"
		})}`);
	}
	const senderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.command.senderId) ?? "";
	const conversationRef = require_session_binding_normalization.normalizeConversationRef({
		channel: bindingContext.channel,
		accountId: bindingContext.accountId,
		conversationId: bindingContext.conversationId,
		parentConversationId: bindingContext.parentConversationId
	});
	const existingBinding = bindingService.resolveByConversation(conversationRef);
	const boundBy = typeof existingBinding?.metadata?.boundBy === "string" ? existingBinding.metadata.boundBy.trim() : "";
	if (existingBinding && boundBy && boundBy !== "system" && senderId && senderId !== boundBy) return require_shared.stopWithText(`⚠️ Only ${boundBy} can refocus this conversation.`);
	const label = focusTarget.label || token;
	const accountId = bindingContext.accountId;
	const acpMeta = focusTarget.targetKind === "acp" ? require_session_meta.readAcpSessionEntry({
		cfg: params.cfg,
		sessionKey: focusTarget.targetSessionKey
	})?.acp : void 0;
	if (!capabilities.placements.includes(bindingContext.placement)) return require_shared.stopWithText("⚠️ Conversation bindings are unavailable for this account.");
	let binding;
	try {
		binding = await bindingService.bind({
			targetSessionKey: focusTarget.targetSessionKey,
			targetKind: focusTarget.targetKind === "acp" ? "session" : "subagent",
			conversation: require_session_binding_normalization.normalizeConversationRef({
				channel: bindingContext.channel,
				accountId: bindingContext.accountId,
				conversationId: bindingContext.conversationId,
				parentConversationId: bindingContext.parentConversationId
			}),
			placement: bindingContext.placement,
			metadata: {
				threadName: require_thread_bindings_messages.resolveThreadBindingThreadName({
					agentId: focusTarget.agentId,
					label
				}),
				agentId: focusTarget.agentId,
				label,
				boundBy: senderId || "unknown",
				introText: require_thread_bindings_messages.resolveThreadBindingIntroText({
					agentId: focusTarget.agentId,
					label,
					idleTimeoutMs: require_thread_bindings_policy.resolveThreadBindingIdleTimeoutMsForChannel({
						cfg: params.cfg,
						channel: bindingContext.channel,
						accountId
					}),
					maxAgeMs: require_thread_bindings_policy.resolveThreadBindingMaxAgeMsForChannel({
						cfg: params.cfg,
						channel: bindingContext.channel,
						accountId
					}),
					sessionCwd: focusTarget.targetKind === "acp" ? (0, _gabrielvfonseca_acp_core_runtime_session_identifiers.resolveAcpSessionCwd)(acpMeta) : void 0,
					sessionDetails: focusTarget.targetKind === "acp" ? (0, _gabrielvfonseca_acp_core_runtime_session_identifiers.resolveAcpThreadSessionDetailLines)({
						sessionKey: focusTarget.targetSessionKey,
						meta: acpMeta
					}) : []
				})
			}
		});
	} catch {
		return require_shared.stopWithText("⚠️ Failed to bind this conversation to the target session.");
	}
	return require_shared.stopWithText(`✅ ${bindingContext.placement === "child" ? `created child conversation ${binding.conversation.conversationId} and bound it to ${binding.targetSessionKey}` : `bound this conversation to ${binding.targetSessionKey}`} (${focusTarget.targetKind}).`);
}
//#endregion
exports.handleSubagentsFocusAction = handleSubagentsFocusAction;
