require("./number-coercion-C9Yx-dRY.cjs");
require("./account-lookup-Bt7ehEAK.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
require("./errors-BqS4bzom.cjs");
const require_runtime = require("./runtime-CIO0BRex.cjs");
require("./deliver-1KcHW32R.cjs");
require("./dispatch-DMC5F8fZ.cjs");
require("./chunk-qjERm7HU.cjs");
require("./reply-payload-DomDFObW.cjs");
require("./payloads-MFaWqn01.cjs");
require("./session-context-ByjQL-XR.cjs");
require("./identity--FwhyfUk.cjs");
require("./progress-draft-compositor-v_djqUZx.cjs");
const require_qr_image = require("./qr-image-Ba8a2wH9.cjs");
//#region src/channels/message/outbound-bridge.ts
/**
* Legacy outbound bridge adapter.
*
* Wraps old channel send functions in the newer channel message adapter contract.
*/
const defaultManualReceiveAdapter = {
	defaultAckPolicy: "manual",
	supportedAckPolicies: ["manual"]
};
function resolveResultMessageId(result) {
	return result.messageId ?? result.receipt?.primaryPlatformMessageId ?? result.receipt?.platformMessageIds[0] ?? result.chatId ?? result.channelId ?? result.roomId ?? result.conversationId ?? result.toJid ?? result.pollId;
}
function toMessageSendResult(result, params) {
	const receipt = result.receipt ? params.normalizeReceiptKind ? {
		...result.receipt,
		parts: result.receipt.parts.map((part) => ({
			...part,
			kind: params.kind
		}))
	} : result.receipt : require_runtime.createMessageReceiptFromOutboundResults({
		results: [result],
		kind: params.kind,
		threadId: params.threadId == null ? void 0 : String(params.threadId),
		replyToId: params.replyToId ?? void 0
	});
	return {
		receipt,
		...resolveResultMessageId({
			...result,
			receipt
		}) ? { messageId: resolveResultMessageId({
			...result,
			receipt
		}) } : {}
	};
}
function adaptOutboundBridgeContext(ctx, resultParams) {
	const { onDeliveryResult, ...outboundCtx } = ctx;
	return {
		...outboundCtx,
		...onDeliveryResult ? { onDeliveryResult: async (result) => {
			await onDeliveryResult(toMessageSendResult(result, resultParams));
		} } : {}
	};
}
function hasRenderedPresentationBlocks(channelData) {
	return Object.values(channelData ?? {}).some((value) => {
		if (!value || typeof value !== "object" || Array.isArray(value)) return false;
		const blocks = value.presentationBlocks;
		return Array.isArray(blocks) && blocks.length > 0;
	});
}
function resolvePayloadReceiptKind(ctx) {
	if (ctx.payload.audioAsVoice && (ctx.mediaUrl || ctx.payload.mediaUrl || ctx.payload.mediaUrls?.length)) return "voice";
	if (ctx.mediaUrl || ctx.payload.mediaUrl || ctx.payload.mediaUrls?.length) return "media";
	if (Boolean(ctx.payload.presentation?.title || ctx.payload.presentation?.blocks?.length) || hasRenderedPresentationBlocks(ctx.payload.channelData)) return "card";
	if (ctx.payload.interactive) return "card";
	if (ctx.payload.location) return "card";
	if (ctx.payload.text?.trim() || ctx.text.trim()) return "text";
	return "unknown";
}
/** Converts legacy outbound send methods into a typed channel message adapter. */
function createChannelMessageAdapterFromOutbound(params) {
	const send = {};
	if (params.outbound.sendText) send.text = async (ctx) => {
		const resultParams = {
			kind: "text",
			threadId: ctx.threadId,
			replyToId: ctx.replyToId
		};
		return toMessageSendResult(await params.outbound.sendText(adaptOutboundBridgeContext(ctx, resultParams)), resultParams);
	};
	if (params.outbound.sendMedia) send.media = async (ctx) => {
		const resultParams = {
			kind: ctx.audioAsVoice ? "voice" : "media",
			threadId: ctx.threadId,
			replyToId: ctx.replyToId
		};
		return toMessageSendResult(await params.outbound.sendMedia(adaptOutboundBridgeContext(ctx, resultParams)), resultParams);
	};
	if (params.outbound.sendPayload) send.payload = async (ctx) => {
		const resultParams = {
			kind: resolvePayloadReceiptKind(ctx),
			threadId: ctx.threadId,
			replyToId: ctx.replyToId
		};
		return toMessageSendResult(await params.outbound.sendPayload(adaptOutboundBridgeContext(ctx, resultParams)), resultParams);
	};
	if (params.outbound.sendPoll) send.poll = async (ctx) => {
		const resultParams = {
			kind: "poll",
			normalizeReceiptKind: true,
			threadId: ctx.threadId,
			replyToId: ctx.replyToId
		};
		return toMessageSendResult(await params.outbound.sendPoll(adaptOutboundBridgeContext(ctx, resultParams)), resultParams);
	};
	return {
		...params.id ? { id: params.id } : {},
		durableFinal: { capabilities: params.capabilities ?? params.outbound.deliveryCapabilities?.durableFinal },
		send,
		...params.live ? { live: params.live } : {},
		receive: params.receive ?? defaultManualReceiveAdapter
	};
}
new AbortController().signal;
require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./runtime-CIO0BRex.cjs")).then((n) => n.runtime_exports));
//#endregion
//#region src/media/qr-terminal.ts
const COMPACT_MARGIN_MODULES = 1;
const TERMINAL_BLACK_ON_WHITE = "\x1B[47m\x1B[30m";
const TERMINAL_RESET = "\x1B[0m";
const FULL_BLOCK = "█";
const UPPER_HALF_BLOCK = "▀";
const LOWER_HALF_BLOCK = "▄";
function readModule(modules, x, y) {
	if (x < 0 || y < 0 || x >= modules.size || y >= modules.size) return false;
	return Boolean(modules.data[y * modules.size + x]);
}
function compactBlock(top, bottom) {
	if (top && bottom) return FULL_BLOCK;
	if (top) return UPPER_HALF_BLOCK;
	if (bottom) return LOWER_HALF_BLOCK;
	return " ";
}
function renderCompactTerminalQr(modules) {
	const lines = [];
	for (let y = -1; y < modules.size + COMPACT_MARGIN_MODULES; y += 2) {
		let line = TERMINAL_BLACK_ON_WHITE;
		for (let x = -1; x < modules.size + COMPACT_MARGIN_MODULES; x += 1) line += compactBlock(readModule(modules, x, y), readModule(modules, x, y + 1));
		lines.push(`${line}${TERMINAL_RESET}`);
	}
	return lines.join("\n");
}
/** Renders QR text for terminal display, with an optional compact half-block mode. */
async function renderQrTerminal(input, opts = {}) {
	const qrCode = await require_qr_image.loadQrCodeRuntime();
	if (opts.small === true) return renderCompactTerminalQr(qrCode.create(input).modules);
	return await qrCode.toString(input, {
		small: false,
		type: "terminal"
	});
}
//#endregion
Object.defineProperty(exports, "createChannelMessageAdapterFromOutbound", {
	enumerable: true,
	get: function() {
		return createChannelMessageAdapterFromOutbound;
	}
});
Object.defineProperty(exports, "renderQrTerminal", {
	enumerable: true,
	get: function() {
		return renderQrTerminal;
	}
});
