//#region src/channels/plugins/conversation-read-origin.ts
function normalizeConversationReadInvocationOrigin(value) {
	return value === "direct-operator" ? "direct-operator" : "delegated";
}
//#endregion
Object.defineProperty(exports, "normalizeConversationReadInvocationOrigin", {
	enumerable: true,
	get: function() {
		return normalizeConversationReadInvocationOrigin;
	}
});
