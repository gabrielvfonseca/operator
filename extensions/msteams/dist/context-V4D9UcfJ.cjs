const require_session_binding_normalization = require("./session-binding-normalization-DSoe9GtS.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_conversation_binding_input = require("./conversation-binding-input-CJRXIfwl.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/commands-acp/context.ts
function resolveAcpCommandChannel(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_session_binding_service.normalizeConversationText(require_conversation_binding_input.resolveConversationBindingChannelFromMessage(params.ctx, params.command.channel)));
}
function resolveAcpCommandAccountId(params) {
	return require_conversation_binding_input.resolveConversationBindingAccountIdFromMessage({
		ctx: params.ctx,
		cfg: params.cfg,
		commandChannel: params.command.channel
	});
}
function resolveAcpCommandThreadId(params) {
	return require_conversation_binding_input.resolveConversationBindingThreadIdFromMessage(params.ctx);
}
function resolveAcpCommandConversationRef(params) {
	const resolved = require_conversation_binding_input.resolveConversationBindingContextFromAcpCommand(params);
	if (!resolved) return null;
	return require_session_binding_normalization.normalizeConversationTargetRef({
		conversationId: resolved.conversationId,
		parentConversationId: resolved.parentConversationId
	});
}
function resolveAcpCommandConversationId(params) {
	return resolveAcpCommandConversationRef(params)?.conversationId;
}
function resolveAcpCommandBindingContext(params) {
	const conversationRef = resolveAcpCommandConversationRef(params);
	if (!conversationRef) return {
		channel: resolveAcpCommandChannel(params),
		accountId: resolveAcpCommandAccountId(params),
		threadId: resolveAcpCommandThreadId(params)
	};
	return {
		channel: resolveAcpCommandChannel(params),
		accountId: resolveAcpCommandAccountId(params),
		threadId: resolveAcpCommandThreadId(params),
		conversationId: conversationRef.conversationId,
		...conversationRef.parentConversationId ? { parentConversationId: conversationRef.parentConversationId } : {}
	};
}
//#endregion
Object.defineProperty(exports, "resolveAcpCommandAccountId", {
	enumerable: true,
	get: function() {
		return resolveAcpCommandAccountId;
	}
});
Object.defineProperty(exports, "resolveAcpCommandBindingContext", {
	enumerable: true,
	get: function() {
		return resolveAcpCommandBindingContext;
	}
});
Object.defineProperty(exports, "resolveAcpCommandChannel", {
	enumerable: true,
	get: function() {
		return resolveAcpCommandChannel;
	}
});
Object.defineProperty(exports, "resolveAcpCommandConversationId", {
	enumerable: true,
	get: function() {
		return resolveAcpCommandConversationId;
	}
});
Object.defineProperty(exports, "resolveAcpCommandThreadId", {
	enumerable: true,
	get: function() {
		return resolveAcpCommandThreadId;
	}
});
