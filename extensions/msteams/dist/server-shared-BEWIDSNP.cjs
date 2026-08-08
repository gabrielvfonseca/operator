//#region src/gateway/server-shared.ts
const PENDING_CHAT_SEND_DEDUPE_PREFIX = "pending-chat:";
function pendingChatSendDedupeKey(runId) {
	return `${PENDING_CHAT_SEND_DEDUPE_PREFIX}${runId}`;
}
//#endregion
Object.defineProperty(exports, "PENDING_CHAT_SEND_DEDUPE_PREFIX", {
	enumerable: true,
	get: function() {
		return PENDING_CHAT_SEND_DEDUPE_PREFIX;
	}
});
Object.defineProperty(exports, "pendingChatSendDedupeKey", {
	enumerable: true,
	get: function() {
		return pendingChatSendDedupeKey;
	}
});
