const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
//#region src/agents/command/run-context.ts
/**
* Resolves channel/account/thread run context for agent command execution.
*/
/** Merges explicit run context with command routing options. */
function resolveAgentRunContext(opts) {
	const merged = opts.runContext ? { ...opts.runContext } : {};
	const normalizedChannel = require_message_channel.resolveMessageChannel(merged.messageChannel ?? opts.messageChannel, opts.replyChannel ?? opts.channel);
	if (normalizedChannel) merged.messageChannel = normalizedChannel;
	const normalizedAccountId = require_delivery_context_shared.normalizeAccountId(merged.accountId ?? opts.accountId);
	if (normalizedAccountId) merged.accountId = normalizedAccountId;
	const groupId = (merged.groupId ?? opts.groupId)?.toString().trim();
	if (groupId) merged.groupId = groupId;
	const groupChannel = (merged.groupChannel ?? opts.groupChannel)?.toString().trim();
	if (groupChannel) merged.groupChannel = groupChannel;
	const groupSpace = (merged.groupSpace ?? opts.groupSpace)?.toString().trim();
	if (groupSpace) merged.groupSpace = groupSpace;
	if (merged.currentThreadTs == null && opts.threadId != null && opts.threadId !== "" && opts.threadId !== null) {
		const threadId = require_channel_route.stringifyRouteThreadId(opts.threadId);
		if (threadId) merged.currentThreadTs = threadId;
	}
	if (!merged.currentChannelId && opts.to) {
		const trimmedTo = opts.to.trim();
		if (trimmedTo) merged.currentChannelId = trimmedTo;
	}
	return merged;
}
//#endregion
Object.defineProperty(exports, "resolveAgentRunContext", {
	enumerable: true,
	get: function() {
		return resolveAgentRunContext;
	}
});
