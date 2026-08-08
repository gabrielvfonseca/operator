const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_channel_resolution = require("./channel-resolution-BHNgrqI2.cjs");
const require_channel_selection = require("./channel-selection-SjphkB8p.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/internal-source-reply.ts
function hasExternalSessionDeliveryRoute(sessionKey) {
	const route = require_session_key.parseSessionDeliveryRoute(sessionKey);
	if (!route) return false;
	const channel = require_message_channel.normalizeMessageChannel(route.channel);
	return Boolean(channel && channel !== "webchat");
}
function hasExplicitRouteParam(params) {
	for (const key of [
		"channel",
		"target",
		"to",
		"channelId"
	]) if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params[key])) return true;
	return Array.isArray(params.targets) && params.targets.some((value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value));
}
function hasCurrentSourceReplyContext(input) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(input.toolContext?.currentChannelProvider);
	if (!provider) return false;
	if (provider === "webchat") return !hasExternalSessionDeliveryRoute(input.sessionKey);
	const currentMessageId = input.toolContext?.currentMessageId;
	return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.toolContext?.currentChannelId) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.toolContext?.currentMessagingTarget) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.toolContext?.currentThreadTs) || typeof currentMessageId === "number" && Number.isFinite(currentMessageId) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(currentMessageId));
}
async function hasConfiguredCurrentSourceChannel(input) {
	const provider = require_message_channel.normalizeMessageChannel(input.toolContext?.currentChannelProvider) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(input.toolContext?.currentChannelProvider);
	if (!provider || provider === "webchat") return false;
	if (!require_channel_selection.isConfiguredChannel(input.cfg, provider)) return false;
	if (!require_channel_resolution.resolveOutboundChannelPlugin({
		channel: provider,
		cfg: input.cfg,
		allowBootstrap: true
	})) return false;
	return (await require_channel_selection.listConfiguredMessageChannels(input.cfg)).some((channel) => channel === provider);
}
/** Return whether this send resolves to the private current-run source-reply sink. */
async function shouldUseInternalSourceReplySink(input, params) {
	if (!(input.action === "send" && input.sourceReplyDeliveryMode === "message_tool_only" && hasCurrentSourceReplyContext(input) && Boolean(input.sessionKey?.trim()) && !hasExplicitRouteParam(params))) return false;
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.toolContext?.currentChannelId) && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.toolContext?.currentMessagingTarget)) return true;
	return !await hasConfiguredCurrentSourceChannel(input);
}
//#endregion
Object.defineProperty(exports, "shouldUseInternalSourceReplySink", {
	enumerable: true,
	get: function() {
		return shouldUseInternalSourceReplySink;
	}
});
