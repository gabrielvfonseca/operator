const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/session-context.ts
/** Builds the outbound delivery session context, omitting empty policy fields. */
function buildOutboundSessionContext(params) {
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	const policyKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.policySessionKey);
	const deliveryRoute = require_session_key.parseSessionDeliveryRoute(policyKey ?? key);
	const declaredChatType = require_chat_type.normalizeChatType(params.conversationType ?? void 0);
	const normalizedChatType = declaredChatType ?? require_chat_type.normalizeChatType(deliveryRoute?.peerKind);
	const conversationKind = declaredChatType ?? (params.isGroup === true ? "group" : params.isGroup === false ? "direct" : void 0);
	const conversationType = normalizedChatType === "group" || normalizedChatType === "channel" ? "group" : normalizedChatType === "direct" ? "direct" : params.isGroup === true ? "group" : params.isGroup === false ? "direct" : void 0;
	const explicitAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId);
	const requesterAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterAccountId);
	const requesterSenderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderId);
	const requesterSenderName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderName);
	const requesterSenderUsername = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderUsername);
	const requesterSenderE164 = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderE164);
	const derivedAgentId = key ? require_agent_scope.resolveSessionAgentId({
		sessionKey: key,
		config: params.cfg
	}) : void 0;
	const agentId = explicitAgentId ?? derivedAgentId;
	if (!key && !policyKey && !conversationType && !conversationKind && !agentId && !requesterAccountId && !requesterSenderId && !requesterSenderName && !requesterSenderUsername && !requesterSenderE164) return;
	return {
		...key ? { key } : {},
		...policyKey ? { policyKey } : {},
		...conversationType ? { conversationType } : {},
		...conversationKind ? { conversationKind } : {},
		...agentId ? { agentId } : {},
		...requesterAccountId ? { requesterAccountId } : {},
		...requesterSenderId ? { requesterSenderId } : {},
		...requesterSenderName ? { requesterSenderName } : {},
		...requesterSenderUsername ? { requesterSenderUsername } : {},
		...requesterSenderE164 ? { requesterSenderE164 } : {}
	};
}
//#endregion
Object.defineProperty(exports, "buildOutboundSessionContext", {
	enumerable: true,
	get: function() {
		return buildOutboundSessionContext;
	}
});
