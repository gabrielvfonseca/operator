const require_directive_tags = require("./directive-tags-8jEdunuA.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
const require_internal_runtime_context = require("./internal-runtime-context-C0HOZ5eF.cjs");
const require_chat_message_content = require("./chat-message-content-B4NfuhB-.cjs");
const require_control_reply_text = require("./control-reply-text-Czbwitig.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/gateway/live-chat-projector.ts
const MAX_LIVE_CHAT_BUFFER_CHARS = 5e5;
/** Normalizes assistant event payloads that contain a snapshot, a delta, or both. */
function resolveAssistantLiveChatInput(data) {
	if (!data || typeof data !== "object") return;
	const record = data;
	if (typeof record.text !== "string" && typeof record.delta !== "string") return;
	return {
		text: typeof record.text === "string" ? record.text : "",
		delta: typeof record.delta === "string" ? record.delta : ""
	};
}
function capLiveAssistantBuffer(text) {
	if (text.length <= MAX_LIVE_CHAT_BUFFER_CHARS) return text;
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(text, -5e5);
}
/** Merges assistant full-text and delta events into a capped live buffer. */
function resolveMergedAssistantText(params) {
	const { previousText, nextText, nextDelta } = params;
	if (nextText && previousText) {
		if (nextText.startsWith(previousText) && nextText.length > previousText.length) return capLiveAssistantBuffer(nextText);
		if (previousText.startsWith(nextText) && !nextDelta) return capLiveAssistantBuffer(previousText);
	}
	if (nextDelta) return capLiveAssistantBuffer(previousText + nextDelta);
	if (nextText) return capLiveAssistantBuffer(nextText);
	return capLiveAssistantBuffer(previousText);
}
/** Removes runtime-only context/directive tags from the merged live assistant buffer. */
function normalizeLiveAssistantBufferedText(text) {
	return require_internal_runtime_context.stripInternalRuntimeContext(require_directive_tags.stripInlineDirectiveTagsForDisplay(text).text);
}
/** Projects buffered assistant text into display text or a suppressed/pending state. */
function projectLiveAssistantBufferedText(rawText, options) {
	if (!rawText) return {
		text: "",
		suppress: true,
		pendingLeadFragment: false
	};
	if (require_control_reply_text.isSuppressedControlReplyText(rawText)) return {
		text: "",
		suppress: true,
		pendingLeadFragment: false
	};
	if (options?.suppressLeadFragments !== false && require_control_reply_text.isSuppressedControlReplyLeadFragment(rawText)) return {
		text: rawText,
		suppress: true,
		pendingLeadFragment: true
	};
	const text = require_tokens.startsWithSilentToken(rawText, "NO_REPLY") ? require_tokens.stripLeadingSilentToken(rawText, require_tokens.SILENT_REPLY_TOKEN) : rawText;
	if (!text || require_control_reply_text.isSuppressedControlReplyText(text)) return {
		text: "",
		suppress: true,
		pendingLeadFragment: false
	};
	if (options?.suppressLeadFragments !== false && require_control_reply_text.isSuppressedControlReplyLeadFragment(text)) return {
		text,
		suppress: true,
		pendingLeadFragment: true
	};
	return {
		text,
		suppress: false,
		pendingLeadFragment: false
	};
}
/** Returns true when an assistant event phase should not appear in live chat. */
function shouldSuppressAssistantEventForLiveChat(data) {
	return require_chat_message_content.resolveAssistantEventPhase(data) === "commentary";
}
//#endregion
Object.defineProperty(exports, "normalizeLiveAssistantBufferedText", {
	enumerable: true,
	get: function() {
		return normalizeLiveAssistantBufferedText;
	}
});
Object.defineProperty(exports, "projectLiveAssistantBufferedText", {
	enumerable: true,
	get: function() {
		return projectLiveAssistantBufferedText;
	}
});
Object.defineProperty(exports, "resolveAssistantLiveChatInput", {
	enumerable: true,
	get: function() {
		return resolveAssistantLiveChatInput;
	}
});
Object.defineProperty(exports, "resolveMergedAssistantText", {
	enumerable: true,
	get: function() {
		return resolveMergedAssistantText;
	}
});
Object.defineProperty(exports, "shouldSuppressAssistantEventForLiveChat", {
	enumerable: true,
	get: function() {
		return shouldSuppressAssistantEventForLiveChat;
	}
});
