const require_conversation_read_origin = require("./conversation-read-origin-C-xn-esF.cjs");
//#region src/gateway/conversation-read-origin.ts
/**
* Resolves one RPC's requested operator origin. Connection metadata is not an
* authority signal, and a server-attested agent runtime always stays delegated.
*/
function resolveGatewayConversationReadOrigin(params) {
	if (params.client?.internal?.agentRuntimeIdentity) return "delegated";
	return require_conversation_read_origin.normalizeConversationReadInvocationOrigin(params.requestedOrigin);
}
//#endregion
Object.defineProperty(exports, "resolveGatewayConversationReadOrigin", {
	enumerable: true,
	get: function() {
		return resolveGatewayConversationReadOrigin;
	}
});
