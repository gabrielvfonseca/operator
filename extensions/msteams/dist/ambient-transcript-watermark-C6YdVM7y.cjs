const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
//#region src/config/sessions/ambient-transcript-watermark.ts
function numericMessageId(value) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : void 0;
}
function isAmbientTranscriptWatermarkAfter(next, current) {
	if (!current) return true;
	if (next.timestampMs !== void 0 && current.timestampMs !== void 0) {
		if (next.timestampMs !== current.timestampMs) return next.timestampMs > current.timestampMs;
		const nextMessageId = numericMessageId(next.messageId);
		const currentMessageId = numericMessageId(current.messageId);
		return nextMessageId !== void 0 && currentMessageId !== void 0 && nextMessageId > currentMessageId;
	}
	const nextMessageId = numericMessageId(next.messageId);
	const currentMessageId = numericMessageId(current.messageId);
	if (nextMessageId !== void 0 && currentMessageId !== void 0) return nextMessageId > currentMessageId;
	return next.messageId !== current.messageId;
}
function readAmbientTranscriptWatermark(entry, key) {
	const watermark = entry?.ambientTranscriptWatermarks?.[key];
	return watermark?.sessionId === entry?.sessionId ? watermark : void 0;
}
async function updateAmbientTranscriptWatermark(params) {
	return await require_session_accessor.updateSessionEntry({
		storePath: params.storePath,
		sessionKey: params.sessionKey
	}, (entry) => {
		if (!entry.sessionId) return null;
		if (params.expectedSessionId !== void 0 && entry.sessionId !== params.expectedSessionId) return null;
		const current = readAmbientTranscriptWatermark(entry, params.key);
		if (!isAmbientTranscriptWatermarkAfter({
			messageId: params.messageId,
			timestampMs: params.timestampMs
		}, current)) return null;
		return { ambientTranscriptWatermarks: {
			...entry.ambientTranscriptWatermarks,
			[params.key]: {
				sessionId: entry.sessionId,
				messageId: params.messageId,
				...params.timestampMs !== void 0 ? { timestampMs: params.timestampMs } : {},
				updatedAt: Date.now()
			}
		} };
	}, {
		skipMaintenance: true,
		takeCacheOwnership: true
	});
}
//#endregion
Object.defineProperty(exports, "updateAmbientTranscriptWatermark", {
	enumerable: true,
	get: function() {
		return updateAmbientTranscriptWatermark;
	}
});
