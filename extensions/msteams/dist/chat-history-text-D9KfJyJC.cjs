const require_sanitize_user_facing_text = require("./sanitize-user-facing-text-B2i4WcAm.cjs");
const require_chat_message_content = require("./chat-message-content-B4NfuhB-.cjs");
//#region src/agents/tools/chat-history-text.ts
/**
* Chat-history text helpers for session tools.
*
* Removes tool messages and extracts sanitized assistant-visible text from stored messages.
*/
function stripToolMessages(messages) {
	return messages.filter((msg) => {
		if (!msg || typeof msg !== "object") return true;
		const role = msg.role;
		return role !== "toolResult" && role !== "tool";
	});
}
/**
* Sanitize text content to strip tool call markers and thinking tags.
* This ensures user-facing text doesn't leak internal tool representations.
*/
function sanitizeTextContent(text) {
	return require_sanitize_user_facing_text.sanitizeAssistantVisibleTextWithProfile(text, "history");
}
function extractAssistantText(message) {
	if (!message || typeof message !== "object") return;
	if (message.role !== "assistant") return;
	const joined = require_chat_message_content.extractAssistantTextForPhase(message, {
		phase: "final_answer",
		sanitizeText: sanitizeTextContent,
		joinWith: ""
	}) ?? require_chat_message_content.extractAssistantTextForPhase(message, {
		sanitizeText: sanitizeTextContent,
		joinWith: ""
	});
	const errorContext = message.stopReason === "error";
	return joined ? require_sanitize_user_facing_text.sanitizeUserFacingText(joined, { errorContext }) : void 0;
}
//#endregion
Object.defineProperty(exports, "extractAssistantText", {
	enumerable: true,
	get: function() {
		return extractAssistantText;
	}
});
Object.defineProperty(exports, "sanitizeTextContent", {
	enumerable: true,
	get: function() {
		return sanitizeTextContent;
	}
});
Object.defineProperty(exports, "stripToolMessages", {
	enumerable: true,
	get: function() {
		return stripToolMessages;
	}
});
