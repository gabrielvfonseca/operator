let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
//#region src/auto-reply/reply/inbound-media.ts
/** Detects inbound media and audio markers in channel message context. */
function hasNormalizedStringEntry(values) {
	return Array.isArray(values) && values.some((value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value));
}
/** Returns true when the context carries current-turn media or sticker data. */
function hasInboundMedia(ctx) {
	return Boolean(ctx.StickerMediaIncluded || ctx.Sticker || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.MediaPath) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.MediaUrl) || hasNormalizedStringEntry(ctx.MediaPaths) || hasNormalizedStringEntry(ctx.MediaUrls) || Array.isArray(ctx.MediaTypes) && ctx.MediaTypes.length > 0);
}
/** Returns true when current-turn media still needs automatic understanding. */
function hasInboundMediaForUnderstanding(ctx) {
	if (!ctx.SkipStickerMediaUnderstanding) return hasInboundMedia(ctx);
	return [
		ctx.MediaPaths,
		ctx.MediaUrls,
		ctx.MediaTypes
	].some((values) => Array.isArray(values) && values.length > 1);
}
const AUDIO_PLACEHOLDER_RE = /^<media:audio>(\s*\([^)]*\))?$/i;
const AUDIO_HEADER_RE = /^\[Audio\b/i;
function normalizeMediaType(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value)?.split(";", 1)[0]?.toLowerCase();
}
/** Returns true when media fields or body placeholders indicate inbound audio. */
function hasInboundAudio(ctx) {
	if ([normalizeMediaType(ctx.MediaType), ...Array.isArray(ctx.MediaTypes) ? ctx.MediaTypes.map((type) => normalizeMediaType(type)) : []].filter((type) => Boolean(type)).some((type) => type === "audio" || type.startsWith("audio/"))) return true;
	if ([
		ctx.MediaPath,
		ctx.MediaUrl,
		...Array.isArray(ctx.MediaPaths) ? ctx.MediaPaths : [],
		...Array.isArray(ctx.MediaUrls) ? ctx.MediaUrls : []
	].some((value) => (0, _gabrielvfonseca_media_core_mime.isAudioFileName)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value)))) return true;
	const trimmed = ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.BodyForCommands) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.CommandBody) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.RawBody) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.Body) ?? "").trim();
	if (!trimmed) return false;
	return AUDIO_PLACEHOLDER_RE.test(trimmed) || AUDIO_HEADER_RE.test(trimmed);
}
//#endregion
Object.defineProperty(exports, "hasInboundAudio", {
	enumerable: true,
	get: function() {
		return hasInboundAudio;
	}
});
Object.defineProperty(exports, "hasInboundMedia", {
	enumerable: true,
	get: function() {
		return hasInboundMedia;
	}
});
Object.defineProperty(exports, "hasInboundMediaForUnderstanding", {
	enumerable: true,
	get: function() {
		return hasInboundMediaForUnderstanding;
	}
});
