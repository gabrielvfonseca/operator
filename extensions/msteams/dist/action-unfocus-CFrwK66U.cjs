require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_binding_normalization = require("./session-binding-normalization-DSoe9GtS.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_conversation_binding_input = require("./conversation-binding-input-CJRXIfwl.cjs");
const require_shared = require("./shared-DZ6zsntB.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/commands-subagents/action-unfocus.ts
async function handleSubagentsUnfocusAction(ctx) {
	const { params } = ctx;
	const bindingService = require_session_binding_service.getSessionBindingService();
	const bindingContext = require_conversation_binding_input.resolveConversationBindingContextFromAcpCommand(params);
	if (!bindingContext) return require_shared.stopWithText("⚠️ /unfocus must be run inside a focused conversation.");
	const binding = bindingService.resolveByConversation(require_session_binding_normalization.normalizeConversationRef({
		channel: bindingContext.channel,
		accountId: bindingContext.accountId,
		conversationId: bindingContext.conversationId,
		parentConversationId: bindingContext.parentConversationId
	}));
	if (!binding) return require_shared.stopWithText("ℹ️ This conversation is not currently focused.");
	const senderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.command.senderId) ?? "";
	const boundBy = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binding.metadata?.boundBy) ?? "";
	if (boundBy && boundBy !== "system" && senderId && senderId !== boundBy) return require_shared.stopWithText(`⚠️ Only ${boundBy} can unfocus this conversation.`);
	await bindingService.unbind({
		bindingId: binding.bindingId,
		reason: "manual"
	});
	return require_shared.stopWithText("✅ Conversation unfocused.");
}
//#endregion
exports.handleSubagentsUnfocusAction = handleSubagentsUnfocusAction;
