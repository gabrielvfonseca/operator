const require_store = require("./store-BW6t6tIi.cjs");
const require_load_options = require("./load-options-28l5_jW7.cjs");
const require_web_media = require("./web-media-CQULBkBb.cjs");
//#region src/media/outbound-attachment.ts
/** Loads a remote/local media URL and stages it into the outbound media store. */
async function resolveOutboundAttachmentFromUrl(mediaUrl, maxBytes, options) {
	const media = await require_web_media.loadWebMedia(mediaUrl, require_load_options.buildOutboundMediaLoadOptions({
		maxBytes,
		mediaAccess: options?.mediaAccess,
		mediaLocalRoots: options?.localRoots,
		mediaReadFile: options?.readFile
	}));
	const saved = await require_store.saveMediaBuffer(media.buffer, media.contentType ?? void 0, "outbound", maxBytes, media.fileName);
	return {
		path: saved.path,
		contentType: saved.contentType
	};
}
/** Stages an in-memory attachment buffer into the outbound media store. */
async function resolveOutboundAttachmentFromBuffer(buffer, maxBytes, options) {
	const saved = await require_store.saveMediaBuffer(buffer, options?.contentType, "outbound", maxBytes, options?.filename);
	return {
		path: saved.path,
		contentType: saved.contentType
	};
}
//#endregion
Object.defineProperty(exports, "resolveOutboundAttachmentFromBuffer", {
	enumerable: true,
	get: function() {
		return resolveOutboundAttachmentFromBuffer;
	}
});
Object.defineProperty(exports, "resolveOutboundAttachmentFromUrl", {
	enumerable: true,
	get: function() {
		return resolveOutboundAttachmentFromUrl;
	}
});
