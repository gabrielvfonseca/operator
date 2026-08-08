const require_registry = require("./registry-raOBfWNF.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/utils/conversation-target.ts
function normalizeConversationId(value) {
	return typeof value === "number" && Number.isFinite(value) ? String(Math.trunc(value)) : typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) : void 0;
}
function normalizeConversationTargetParams(params) {
	return {
		channel: typeof params.channel === "string" ? require_message_channel.normalizeMessageChannel(params.channel) ?? params.channel.trim() : void 0,
		conversationId: normalizeConversationId(params.conversationId),
		parentConversationId: normalizeConversationId(params.parentConversationId)
	};
}
//#endregion
//#region src/channels/route-projection.ts
/** Formats a conversation id into a deliverable target, using channel hooks before generic fallback. */
function formatConversationTarget(params) {
	const { channel, conversationId, parentConversationId } = normalizeConversationTargetParams(params);
	if (!channel || !conversationId) return;
	const normalizedChannel = require_registry.normalizeChannelId(channel);
	const pluginTarget = normalizedChannel ? require_registry.getChannelPlugin(normalizedChannel)?.messaging?.resolveDeliveryTarget?.({
		conversationId,
		parentConversationId
	}) : null;
	if (pluginTarget?.to?.trim()) return pluginTarget.to.trim();
	return `channel:${conversationId}`;
}
/** Resolves a channel conversation into target/thread fields for delivery routing. */
function resolveConversationDeliveryTarget(params) {
	const { channel, conversationId, parentConversationId } = normalizeConversationTargetParams(params);
	const pluginTarget = channel && conversationId ? require_registry.getChannelPlugin(require_registry.normalizeChannelId(channel) ?? channel)?.messaging?.resolveDeliveryTarget?.({
		conversationId,
		parentConversationId
	}) : null;
	if (pluginTarget) return {
		...pluginTarget.to?.trim() ? { to: pluginTarget.to.trim() } : {},
		...pluginTarget.threadId?.trim() ? { threadId: pluginTarget.threadId.trim() } : {}
	};
	return { to: formatConversationTarget(params) };
}
/** Converts a persisted conversation reference into a channel route. */
function routeFromConversationRef(conversation) {
	if (!conversation) return;
	const target = resolveConversationDeliveryTarget({
		channel: conversation.channel,
		conversationId: conversation.conversationId,
		parentConversationId: conversation.parentConversationId
	});
	return require_channel_route.normalizeChannelRouteRef({
		channel: conversation.channel,
		accountId: conversation.accountId,
		to: target.to,
		threadId: target.threadId,
		threadSource: target.threadId ? "target" : void 0
	});
}
/** Extracts a channel route from a session binding record. */
function routeFromBindingRecord(binding) {
	return routeFromConversationRef(binding?.conversation);
}
/** Projects route fields used by older session and delivery callers. */
function routeToDeliveryFields(route) {
	const deliveryContext = require_delivery_context_shared.deliveryContextFromChannelRoute(route);
	return {
		...deliveryContext ? { deliveryContext } : {},
		...deliveryContext?.channel ? { channel: deliveryContext.channel } : {},
		...deliveryContext?.to ? { to: deliveryContext.to } : {},
		...deliveryContext?.accountId ? { accountId: deliveryContext.accountId } : {},
		...deliveryContext?.threadId != null ? { threadId: deliveryContext.threadId } : {}
	};
}
//#endregion
Object.defineProperty(exports, "formatConversationTarget", {
	enumerable: true,
	get: function() {
		return formatConversationTarget;
	}
});
Object.defineProperty(exports, "routeFromBindingRecord", {
	enumerable: true,
	get: function() {
		return routeFromBindingRecord;
	}
});
Object.defineProperty(exports, "routeFromConversationRef", {
	enumerable: true,
	get: function() {
		return routeFromConversationRef;
	}
});
Object.defineProperty(exports, "routeToDeliveryFields", {
	enumerable: true,
	get: function() {
		return routeToDeliveryFields;
	}
});
