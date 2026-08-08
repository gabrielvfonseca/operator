require("./chunk-qjERm7HU.cjs");
const require_directive_tags = require("./directive-tags-8jEdunuA.cjs");
require("./sanitize-user-facing-text-B2i4WcAm.cjs");
require("./embedded-agent-utils-OVBmZgZz.cjs");
[
	"think",
	"thinking",
	"thought",
	"antthinking",
	"antml:think",
	"antml:thinking",
	"antml:thought",
	"mm:think",
	"mm:thinking",
	"mm:thought"
].flatMap((name) => [`<${name}`, `</${name}`]);
function sanitizeProgressStatusText(text) {
	const cleaned = require_directive_tags.stripInlineDirectiveTagsForDelivery(text).text.trim();
	if (!cleaned || isSilentCommentaryProgressText(cleaned)) return "";
	return cleaned;
}
function isSilentCommentaryProgressText(text) {
	const normalized = text.replace(/^[\s*_`~]+|[\s*_`~]+$/gu, "").trim();
	return /^NO_REPLY$/iu.test(normalized);
}
//#endregion
//#region src/channels/progress-draft-compositor.ts
const PROGRESS_STATUS_PREAMBLE_FRESH_MS = 2e4;
//#endregion
Object.defineProperty(exports, "PROGRESS_STATUS_PREAMBLE_FRESH_MS", {
	enumerable: true,
	get: function() {
		return PROGRESS_STATUS_PREAMBLE_FRESH_MS;
	}
});
Object.defineProperty(exports, "sanitizeProgressStatusText", {
	enumerable: true,
	get: function() {
		return sanitizeProgressStatusText;
	}
});
