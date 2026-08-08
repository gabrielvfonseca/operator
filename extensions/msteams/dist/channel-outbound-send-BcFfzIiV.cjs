require("./rolldown-runtime-u92d-OFm.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_load = require("./load-8Ay4FLnH.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cli/send-runtime/channel-outbound-send.ts
function resolveRuntimeThreadId(opts) {
	return opts.messageThreadId ?? opts.threadId ?? opts.threadTs ?? void 0;
}
function resolveRuntimeReplyToId(opts) {
	const raw = opts.replyToMessageId ?? opts.replyToId;
	return raw == null ? void 0 : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(String(raw));
}
/** Create a send runtime that dispatches text, media, or rich blocks through a channel plugin. */
function createChannelOutboundRuntimeSend(params) {
	return { sendMessage: async (to, text, opts = {}) => {
		const outbound = await require_load.loadChannelOutboundAdapter(params.channelId);
		const threadId = resolveRuntimeThreadId(opts);
		const replyToId = resolveRuntimeReplyToId(opts);
		const buildContext = () => ({
			cfg: opts.cfg ?? require_io.getRuntimeConfig(),
			to,
			text,
			mediaUrl: opts.mediaUrl,
			mediaAccess: opts.mediaAccess,
			mediaLocalRoots: opts.mediaLocalRoots,
			mediaReadFile: opts.mediaReadFile,
			accountId: opts.accountId,
			threadId,
			replyToId,
			silent: opts.silent,
			forceDocument: opts.forceDocument,
			formatting: opts.formatting ?? (opts.textMode === "html" ? { parseMode: "HTML" } : void 0),
			gifPlayback: opts.gifPlayback,
			gatewayClientScopes: opts.gatewayClientScopes,
			deliveryQueueId: opts.deliveryQueueId,
			onPlatformSendDispatch: opts.onPlatformSendDispatch
		});
		const hasMedia = Boolean(opts.mediaUrl);
		if (opts.blocks && outbound?.sendPayload) return await outbound.sendPayload({
			...buildContext(),
			payload: {
				text,
				channelData: { [params.channelId]: { blocks: opts.blocks } }
			}
		});
		if (hasMedia && outbound?.sendMedia) return await outbound.sendMedia(buildContext());
		if (!outbound?.sendText) throw new Error(params.unavailableMessage);
		return await outbound.sendText(buildContext());
	} };
}
//#endregion
exports.createChannelOutboundRuntimeSend = createChannelOutboundRuntimeSend;
