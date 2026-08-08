const require_string_readers = require("./string-readers-DjRuUveR.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/utils/message-channel-constants.ts
const INTERNAL_MESSAGE_CHANNEL = "webchat";
function internalSessionConversationId(channelId, sessionKey) {
	return channelId === "webchat" ? sessionKey : void 0;
}
const INTERNAL_NON_DELIVERY_CHANNELS = [
	"heartbeat",
	"cron",
	"webhook",
	"voice",
	"sessions_send"
];
function isInternalNonDeliveryChannel(value) {
	return require_string_readers.isStringOption(value, INTERNAL_NON_DELIVERY_CHANNELS);
}
const NATIVE_APPROVAL_CHANNELS = [
	"webchat",
	"discord",
	"googlechat",
	"imessage",
	"matrix",
	"qqbot",
	"signal",
	"slack",
	"telegram",
	"whatsapp"
];
function isNativeApprovalChannel(value) {
	return require_string_readers.isStringOption(value, NATIVE_APPROVAL_CHANNELS);
}
//#endregion
//#region src/utils/message-channel-core.ts
/**
* Shared message-channel normalization for delivery, routing, config, and gateway headers.
*
* Built-in aliases normalize through channel ids, while plugin-owned channel ids
* stay accepted even when core has no bundled alias for them.
*/
/** Normalizes raw channel names, aliases, and internal webchat into canonical ids. */
function normalizeMessageChannel(raw) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (!normalized) return;
	if (normalized === "webchat") return INTERNAL_MESSAGE_CHANNEL;
	const builtIn = require_ids.normalizeChatChannelId(normalized);
	if (builtIn) return builtIn;
	return require_registry_normalize.normalizeAnyChannelId(normalized) ?? normalized;
}
/** Returns true only when a value is already a normalized, non-internal delivery channel id. */
function isDeliverableMessageChannel(value) {
	const normalized = normalizeMessageChannel(value);
	return normalized !== void 0 && normalized !== "webchat" && normalized === value;
}
//#endregion
Object.defineProperty(exports, "INTERNAL_MESSAGE_CHANNEL", {
	enumerable: true,
	get: function() {
		return INTERNAL_MESSAGE_CHANNEL;
	}
});
Object.defineProperty(exports, "internalSessionConversationId", {
	enumerable: true,
	get: function() {
		return internalSessionConversationId;
	}
});
Object.defineProperty(exports, "isDeliverableMessageChannel", {
	enumerable: true,
	get: function() {
		return isDeliverableMessageChannel;
	}
});
Object.defineProperty(exports, "isInternalNonDeliveryChannel", {
	enumerable: true,
	get: function() {
		return isInternalNonDeliveryChannel;
	}
});
Object.defineProperty(exports, "isNativeApprovalChannel", {
	enumerable: true,
	get: function() {
		return isNativeApprovalChannel;
	}
});
Object.defineProperty(exports, "normalizeMessageChannel", {
	enumerable: true,
	get: function() {
		return normalizeMessageChannel;
	}
});
