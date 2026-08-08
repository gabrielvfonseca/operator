const require_ids = require("./ids-BOvGIu4A.cjs");
const require_registry = require("./registry-BWWaGAnQ.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/utils/message-channel-normalize.ts
/** Normalizes built-in, plugin, and alias channel names to their canonical id. */
function normalizeMessageChannel(raw) {
	return require_message_channel_core.normalizeMessageChannel(raw);
}
const listPluginChannelIds = () => {
	return require_registry.listRegisteredChannelPluginIds();
};
/** Lists built-in and registered plugin channel ids that can receive delivery. */
const listDeliverableMessageChannels = () => (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...require_ids.CHANNEL_IDS, ...listPluginChannelIds()]);
const listGatewayMessageChannels = () => [...listDeliverableMessageChannels(), require_message_channel_core.INTERNAL_MESSAGE_CHANNEL];
/** Returns whether a normalized id is valid for Gateway routing. */
function isGatewayMessageChannel(value) {
	return listGatewayMessageChannels().includes(value);
}
/** Returns whether a normalized id is a deliverable non-internal channel. */
function isDeliverableMessageChannel(value) {
	return listDeliverableMessageChannels().includes(value);
}
/** Normalizes and validates a raw channel value for Gateway routing. */
function resolveGatewayMessageChannel(raw) {
	const normalized = normalizeMessageChannel(raw);
	if (!normalized) return;
	return isGatewayMessageChannel(normalized) ? normalized : void 0;
}
/** Normalizes the primary channel or falls back to a secondary channel value. */
function resolveMessageChannel(primary, fallback) {
	return normalizeMessageChannel(primary) ?? normalizeMessageChannel(fallback);
}
//#endregion
//#region src/utils/message-channel.ts
/** Return whether a Gateway client is the CLI transport. */
function isGatewayCliClient(client) {
	return require_client_info.normalizeGatewayClientMode(client?.mode) === require_client_info.GATEWAY_CLIENT_MODES.CLI;
}
/**
* Return whether a Gateway client is an ephemeral control-plane connection.
* Test-mode clients stay excluded from this list: suites use them as stand-ins
* for real clients and assert presence propagation through the full pipeline.
*/
function isEphemeralGatewayClient(client) {
	const mode = require_client_info.normalizeGatewayClientMode(client?.mode);
	return mode === require_client_info.GATEWAY_CLIENT_MODES.CLI || mode === require_client_info.GATEWAY_CLIENT_MODES.BACKEND || mode === require_client_info.GATEWAY_CLIENT_MODES.PROBE;
}
/** Return whether a client is one of the operator UI clients. */
function isOperatorUiClient(client) {
	const clientId = require_client_info.normalizeGatewayClientName(client?.id);
	return clientId === require_client_info.GATEWAY_CLIENT_NAMES.CONTROL_UI || clientId === require_client_info.GATEWAY_CLIENT_NAMES.TUI;
}
/** Return whether a client is the browser Control UI. */
function isBrowserOperatorUiClient(client) {
	return require_client_info.normalizeGatewayClientName(client?.id) === require_client_info.GATEWAY_CLIENT_NAMES.CONTROL_UI;
}
/** Return whether a raw channel id resolves to Operator's internal channel. */
function isInternalMessageChannel(raw) {
	return normalizeMessageChannel(raw) === require_message_channel_core.INTERNAL_MESSAGE_CHANNEL;
}
/** Return whether a Gateway client is the public webchat surface. */
function isWebchatClient(client) {
	if (require_client_info.normalizeGatewayClientMode(client?.mode) === require_client_info.GATEWAY_CLIENT_MODES.WEBCHAT) return true;
	return require_client_info.normalizeGatewayClientName(client?.id) === require_client_info.GATEWAY_CLIENT_NAMES.WEBCHAT_UI;
}
/** Resolve whether a channel can receive markdown without plain-text downgrade. */
function isMarkdownCapableMessageChannel(raw) {
	const channel = normalizeMessageChannel(raw);
	if (!channel) return false;
	if (channel === "webchat" || channel === "tui") return true;
	const builtInChannel = require_ids.normalizeChatChannelId(channel);
	if (builtInChannel) {
		const builtInMeta = require_registry.findChatChannelMeta(builtInChannel);
		if (builtInMeta) return builtInMeta.markdownCapable === true;
		const catalogMeta = require_ids.listBundledChannelCatalogEntries().find((entry) => entry.id === builtInChannel);
		if (catalogMeta) return catalogMeta.channel.markdownCapable === true;
	}
	return require_registry.getRegisteredChannelPluginMeta(channel)?.markdownCapable === true;
}
//#endregion
Object.defineProperty(exports, "isBrowserOperatorUiClient", {
	enumerable: true,
	get: function() {
		return isBrowserOperatorUiClient;
	}
});
Object.defineProperty(exports, "isDeliverableMessageChannel", {
	enumerable: true,
	get: function() {
		return isDeliverableMessageChannel;
	}
});
Object.defineProperty(exports, "isEphemeralGatewayClient", {
	enumerable: true,
	get: function() {
		return isEphemeralGatewayClient;
	}
});
Object.defineProperty(exports, "isGatewayCliClient", {
	enumerable: true,
	get: function() {
		return isGatewayCliClient;
	}
});
Object.defineProperty(exports, "isGatewayMessageChannel", {
	enumerable: true,
	get: function() {
		return isGatewayMessageChannel;
	}
});
Object.defineProperty(exports, "isInternalMessageChannel", {
	enumerable: true,
	get: function() {
		return isInternalMessageChannel;
	}
});
Object.defineProperty(exports, "isMarkdownCapableMessageChannel", {
	enumerable: true,
	get: function() {
		return isMarkdownCapableMessageChannel;
	}
});
Object.defineProperty(exports, "isOperatorUiClient", {
	enumerable: true,
	get: function() {
		return isOperatorUiClient;
	}
});
Object.defineProperty(exports, "isWebchatClient", {
	enumerable: true,
	get: function() {
		return isWebchatClient;
	}
});
Object.defineProperty(exports, "listDeliverableMessageChannels", {
	enumerable: true,
	get: function() {
		return listDeliverableMessageChannels;
	}
});
Object.defineProperty(exports, "normalizeMessageChannel", {
	enumerable: true,
	get: function() {
		return normalizeMessageChannel;
	}
});
Object.defineProperty(exports, "resolveGatewayMessageChannel", {
	enumerable: true,
	get: function() {
		return resolveGatewayMessageChannel;
	}
});
Object.defineProperty(exports, "resolveMessageChannel", {
	enumerable: true,
	get: function() {
		return resolveMessageChannel;
	}
});
