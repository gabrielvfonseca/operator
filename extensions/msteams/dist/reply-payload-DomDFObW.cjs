const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
const require_reply_reference = require("./reply-reference-C8sqwH21.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/reply-policy.ts
/** Builds per-payload reply routing policy for outbound delivery batches. */
function createReplyToDeliveryPolicy(params) {
	const singleUseReplyTo = params.replyToMode ? require_reply_reference.isSingleUseReplyToMode(params.replyToMode) : false;
	let replyToConsumed = false;
	const resolveCurrentReplyTo = (payload) => {
		if (payload.replyToId != null) return payload.replyToId ? {
			replyToId: payload.replyToId,
			source: "explicit"
		} : {};
		const replyToId = (params.replyToMode === "off" ? void 0 : params.replyToId) ?? void 0;
		if (!replyToId) return {};
		if (!singleUseReplyTo) return {
			replyToId,
			source: "implicit"
		};
		return replyToConsumed ? {} : {
			replyToId,
			source: "implicit"
		};
	};
	const applyReplyToConsumption = (overrides, options) => {
		if (!options?.consumeImplicitReply || !overrides.replyToId || !singleUseReplyTo) return overrides;
		if (replyToConsumed) return {
			...overrides,
			replyToId: void 0
		};
		replyToConsumed = true;
		return overrides;
	};
	return {
		resolveCurrentReplyTo,
		applyReplyToConsumption
	};
}
//#endregion
//#region src/plugin-sdk/reply-payload.ts
const REASONING_PREFIX_RE = /^(?:reasoning:|thinking\.{0,3}(?=\s*(?:>\s*)?_))/u;
function trimLeadingMarkdownQuoteMarkers(text) {
	let candidate = text.trimStart();
	while (candidate.startsWith(">")) candidate = candidate.replace(/^(?:>[ \t]?)+/, "").trimStart();
	return candidate;
}
/** Detect reasoning replies from explicit flags or common reasoning text prefixes. */
function isReasoningReplyPayload(payload) {
	if (payload.isReasoning === true) return true;
	const text = payload.text;
	if (typeof text !== "string") return false;
	const normalized = require_string_coerce.normalizeLowercaseStringOrEmpty(text.trimStart());
	if (REASONING_PREFIX_RE.test(normalized)) return true;
	const unquoted = require_string_coerce.normalizeLowercaseStringOrEmpty(trimLeadingMarkdownQuoteMarkers(text));
	return REASONING_PREFIX_RE.test(unquoted);
}
/** Prefer multi-attachment payloads, then fall back to the legacy single-media field. */
function resolveOutboundMediaUrls(payload) {
	if (payload.mediaUrls?.length) return payload.mediaUrls;
	if (payload.mediaUrl) return [payload.mediaUrl];
	return [];
}
/** Resolve media URLs from a channel sendPayload context after legacy fallback normalization. */
function resolvePayloadMediaUrls(payload) {
	return resolveOutboundMediaUrls(payload);
}
/** Check whether an outbound payload includes any sendable text, media, or rich reply content. */
function hasOutboundReplyContent(payload, options) {
	return require_payload.hasReplyPayloadContent(payload, { trimText: options?.trimText });
}
/** Normalize reply payload text/media into a trimmed, sendable shape for delivery paths. */
function resolveSendableOutboundReplyParts(payload, options) {
	const text = options?.text ?? payload.text ?? "";
	const trimmedText = text.trim();
	const mediaUrls = require_string_normalization.normalizeStringEntries(resolveOutboundMediaUrls(payload));
	const mediaCount = mediaUrls.length;
	const hasText = Boolean(trimmedText);
	const hasMedia = mediaCount > 0;
	return {
		text,
		trimmedText,
		mediaUrls,
		mediaCount,
		hasText,
		hasMedia,
		hasContent: hasText || hasMedia
	};
}
/** Preserve caller-provided chunking, but fall back to the full text when chunkers return nothing. */
function resolveTextChunksWithFallback(text, chunks) {
	if (chunks.length > 0) return [...chunks];
	if (!text) return [];
	return [text];
}
/** Sends a media sequence with caption text on the first item and returns the last send result. */
async function sendPayloadMediaSequence(params) {
	let lastResult;
	for (let i = 0; i < params.mediaUrls.length; i += 1) {
		const mediaUrl = params.mediaUrls[i];
		if (!mediaUrl) continue;
		lastResult = await params.send({
			text: i === 0 ? params.text : "",
			mediaUrl,
			index: i,
			isFirst: i === 0
		});
		await params.onResult?.(lastResult);
	}
	return lastResult;
}
//#endregion
Object.defineProperty(exports, "createReplyToDeliveryPolicy", {
	enumerable: true,
	get: function() {
		return createReplyToDeliveryPolicy;
	}
});
Object.defineProperty(exports, "hasOutboundReplyContent", {
	enumerable: true,
	get: function() {
		return hasOutboundReplyContent;
	}
});
Object.defineProperty(exports, "isReasoningReplyPayload", {
	enumerable: true,
	get: function() {
		return isReasoningReplyPayload;
	}
});
Object.defineProperty(exports, "resolvePayloadMediaUrls", {
	enumerable: true,
	get: function() {
		return resolvePayloadMediaUrls;
	}
});
Object.defineProperty(exports, "resolveSendableOutboundReplyParts", {
	enumerable: true,
	get: function() {
		return resolveSendableOutboundReplyParts;
	}
});
Object.defineProperty(exports, "resolveTextChunksWithFallback", {
	enumerable: true,
	get: function() {
		return resolveTextChunksWithFallback;
	}
});
Object.defineProperty(exports, "sendPayloadMediaSequence", {
	enumerable: true,
	get: function() {
		return sendPayloadMediaSequence;
	}
});
