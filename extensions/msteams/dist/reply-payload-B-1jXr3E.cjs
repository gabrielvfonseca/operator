//#region src/auto-reply/reply-payload.ts
const PAIRING_QR_REPLY_CHANNEL_DATA_KEY = "operatorPairingQr";
function normalizePairingQrSetupCode(value) {
	return typeof value === "string" && value.trim() ? value : void 0;
}
function normalizePairingQrExpiresAtMs(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
}
function readPairingQrReplyChannelData(payload) {
	const raw = payload.channelData?.[PAIRING_QR_REPLY_CHANNEL_DATA_KEY];
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
	const record = raw;
	const setupCode = normalizePairingQrSetupCode(record.setupCode);
	const expiresAtMs = normalizePairingQrExpiresAtMs(record.expiresAtMs);
	return setupCode && expiresAtMs ? {
		setupCode,
		expiresAtMs
	} : void 0;
}
/** Metadata for fast-auto progress notices. */
const FAST_MODE_AUTO_PROGRESS_KIND = "fast-mode-auto";
function isFastModeAutoProgressPayload(payload) {
	return payload.channelData?.operatorProgressKind === FAST_MODE_AUTO_PROGRESS_KIND;
}
const REPLY_MEDIA_FAILURE_WARNING = "⚠️ Media failed.";
/** Appends the standard media failure warning without duplicating it. */
function appendReplyMediaFailureWarning(text) {
	if (!text?.trim()) return REPLY_MEDIA_FAILURE_WARNING;
	if (text.includes(REPLY_MEDIA_FAILURE_WARNING)) return text;
	return `${text}\n${REPLY_MEDIA_FAILURE_WARNING}`;
}
function normalizeTtsSupplementSpokenText(value) {
	return typeof value === "string" && value.trim() ? value : void 0;
}
function hasReplyPayloadMedia(payload) {
	return Boolean(payload.mediaUrl?.trim() || payload.mediaUrls?.some((url) => url.trim()));
}
/** Returns normalized TTS supplement metadata only when the payload has media to carry it. */
function getReplyPayloadTtsSupplement(payload) {
	const spokenText = normalizeTtsSupplementSpokenText(payload.ttsSupplement?.spokenText);
	if (!spokenText || !hasReplyPayloadMedia(payload)) return;
	return {
		spokenText,
		...payload.ttsSupplement?.visibleTextAlreadyDelivered === true ? { visibleTextAlreadyDelivered: true } : {}
	};
}
/** Returns true when the payload is a valid TTS supplement media payload. */
function isReplyPayloadTtsSupplement(payload) {
	return Boolean(getReplyPayloadTtsSupplement(payload));
}
/** Marks a reply payload as supplemental TTS media while preserving the original shape. */
function markReplyPayloadAsTtsSupplement(payload, spokenText = payload.spokenText ?? payload.text ?? "", options) {
	const normalizedSpokenText = normalizeTtsSupplementSpokenText(spokenText);
	if (!normalizedSpokenText) return payload;
	return {
		...payload,
		spokenText: normalizedSpokenText,
		ttsSupplement: {
			spokenText: normalizedSpokenText,
			...options?.visibleTextAlreadyDelivered === true ? { visibleTextAlreadyDelivered: true } : {}
		}
	};
}
/** Removes visible-only fields from a payload that should be delivered as TTS supplement media. */
function buildTtsSupplementMediaPayload(payload) {
	const supplement = getReplyPayloadTtsSupplement(payload);
	if (!supplement) return payload;
	const { text: _text, presentation: _presentation, interactive: _interactive, btw: _btw, ...mediaPayload } = payload;
	return {
		...mediaPayload,
		spokenText: supplement.spokenText,
		ttsSupplement: supplement
	};
}
const replyPayloadMetadata = /* @__PURE__ */ new WeakMap();
/** Adds internal metadata to a reply payload object. */
function setReplyPayloadMetadata(payload, metadata) {
	const previous = replyPayloadMetadata.get(payload);
	replyPayloadMetadata.set(payload, {
		...previous,
		...metadata
	});
	return payload;
}
/** Reads internal metadata attached to a reply payload object. */
function getReplyPayloadMetadata(payload) {
	return replyPayloadMetadata.get(payload);
}
/** Copies internal payload metadata when cloning or transforming payload objects. */
function copyReplyPayloadMetadata(source, payload) {
	const metadata = getReplyPayloadMetadata(source);
	return metadata ? setReplyPayloadMetadata(payload, metadata) : payload;
}
/** Marks a notice payload as deliverable even when normal source replies are suppressed. */
function markReplyPayloadForSourceSuppressionDelivery(payload) {
	return setReplyPayloadMetadata(payload, { deliverDespiteSourceReplySuppression: true });
}
function markCommandReplyForDelivery(reply) {
	if (!reply) return reply;
	if (Array.isArray(reply)) return reply.map((payload) => markReplyPayloadForSourceSuppressionDelivery(payload));
	return markReplyPayloadForSourceSuppressionDelivery(reply);
}
/** Returns true for internal status/notice payloads, not assistant answer content. */
function isReplyPayloadStatusNotice(payload) {
	return Boolean(payload.isCompactionNotice || payload.isFallbackNotice || payload.isStatusNotice);
}
//#endregion
Object.defineProperty(exports, "FAST_MODE_AUTO_PROGRESS_KIND", {
	enumerable: true,
	get: function() {
		return FAST_MODE_AUTO_PROGRESS_KIND;
	}
});
Object.defineProperty(exports, "appendReplyMediaFailureWarning", {
	enumerable: true,
	get: function() {
		return appendReplyMediaFailureWarning;
	}
});
Object.defineProperty(exports, "buildTtsSupplementMediaPayload", {
	enumerable: true,
	get: function() {
		return buildTtsSupplementMediaPayload;
	}
});
Object.defineProperty(exports, "copyReplyPayloadMetadata", {
	enumerable: true,
	get: function() {
		return copyReplyPayloadMetadata;
	}
});
Object.defineProperty(exports, "getReplyPayloadMetadata", {
	enumerable: true,
	get: function() {
		return getReplyPayloadMetadata;
	}
});
Object.defineProperty(exports, "getReplyPayloadTtsSupplement", {
	enumerable: true,
	get: function() {
		return getReplyPayloadTtsSupplement;
	}
});
Object.defineProperty(exports, "isFastModeAutoProgressPayload", {
	enumerable: true,
	get: function() {
		return isFastModeAutoProgressPayload;
	}
});
Object.defineProperty(exports, "isReplyPayloadStatusNotice", {
	enumerable: true,
	get: function() {
		return isReplyPayloadStatusNotice;
	}
});
Object.defineProperty(exports, "isReplyPayloadTtsSupplement", {
	enumerable: true,
	get: function() {
		return isReplyPayloadTtsSupplement;
	}
});
Object.defineProperty(exports, "markCommandReplyForDelivery", {
	enumerable: true,
	get: function() {
		return markCommandReplyForDelivery;
	}
});
Object.defineProperty(exports, "markReplyPayloadAsTtsSupplement", {
	enumerable: true,
	get: function() {
		return markReplyPayloadAsTtsSupplement;
	}
});
Object.defineProperty(exports, "markReplyPayloadForSourceSuppressionDelivery", {
	enumerable: true,
	get: function() {
		return markReplyPayloadForSourceSuppressionDelivery;
	}
});
Object.defineProperty(exports, "readPairingQrReplyChannelData", {
	enumerable: true,
	get: function() {
		return readPairingQrReplyChannelData;
	}
});
Object.defineProperty(exports, "setReplyPayloadMetadata", {
	enumerable: true,
	get: function() {
		return setReplyPayloadMetadata;
	}
});
