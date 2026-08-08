require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/best-effort-delivery.ts
/** Normalizes an optional best-effort destination into a deliver/no-deliver decision. */
function resolveExternalBestEffortDeliveryTarget(params) {
	const normalizedChannel = require_message_channel.normalizeMessageChannel(params.channel);
	const channel = normalizedChannel && require_message_channel.isDeliverableMessageChannel(normalizedChannel) ? normalizedChannel : void 0;
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.to);
	const deliver = Boolean(channel && to);
	return {
		deliver,
		channel: deliver ? channel : void 0,
		to: deliver ? to : void 0,
		accountId: deliver ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.accountId) : void 0,
		threadId: deliver && params.threadId != null && params.threadId !== "" ? require_channel_route.stringifyRouteThreadId(params.threadId) : void 0
	};
}
/** Detects best-effort sends that should stay session-only on the internal channel. */
function shouldDowngradeDeliveryToSessionOnly(params) {
	return params.wantsDelivery && params.bestEffortDeliver && params.resolvedChannel === "webchat";
}
//#endregion
Object.defineProperty(exports, "resolveExternalBestEffortDeliveryTarget", {
	enumerable: true,
	get: function() {
		return resolveExternalBestEffortDeliveryTarget;
	}
});
Object.defineProperty(exports, "shouldDowngradeDeliveryToSessionOnly", {
	enumerable: true,
	get: function() {
		return shouldDowngradeDeliveryToSessionOnly;
	}
});
