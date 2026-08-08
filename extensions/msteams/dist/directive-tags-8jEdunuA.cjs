let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/utils/directive-tags.ts
const AUDIO_TAG_RE = /\[\[\s*audio_as_voice\s*\]\]/gi;
const REPLY_TAG_RE = /\[\[\s*(?:reply_to_current|reply_to\s*:\s*([^\]\n]+))\s*\]\]/gi;
const INLINE_DIRECTIVE_TAG_WITH_PADDING_RE = /\s*(?:\[\[\s*audio_as_voice\s*\]\]|\[\[\s*(?:reply_to_current|reply_to\s*:\s*[^\]\n]+)\s*\]\])\s*/gi;
const MAX_REPLY_DIRECTIVE_ID_LENGTH = 256;
function replacementPreservesWordBoundary(source, offset, length) {
	const before = source[offset - 1];
	const after = source[offset + length];
	return before && after && !/\s/u.test(before) && !/\s/u.test(after) ? " " : "";
}
const BLOCK_SENTINEL_SEED = "";
function createBlockSentinel(text) {
	let sentinel = BLOCK_SENTINEL_SEED;
	while (text.includes(sentinel)) sentinel += BLOCK_SENTINEL_SEED;
	return sentinel;
}
function normalizeDirectiveWhitespace(text) {
	const blockSentinel = createBlockSentinel(text);
	const blockPlaceholderRe = new RegExp(`${blockSentinel}(\\d+)${blockSentinel}`, "g");
	const blocks = [];
	return text.replace(/(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1[^\n]*|(?:(?:^|\n)(?: {4}|\t)[^\n]*)+/gm, (block) => {
		blocks.push(block);
		return `${blockSentinel}${blocks.length - 1}${blockSentinel}`;
	}).replace(/\r\n/g, "\n").replace(/([^\s])[ \t]{2,}([^\s])/g, "$1 $2").replace(/^\n+/, "").replace(/^[ \t](?=\S)/, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trimEnd().replace(blockPlaceholderRe, (_, i) => (0, _gabrielvfonseca_normalization_core.expectDefined)(blocks[Number(i)], "blocks entry at number(i)"));
}
function stripInlineDirectiveTagsForDisplay(text) {
	if (!text) return {
		text,
		changed: false
	};
	const stripped = text.replace(AUDIO_TAG_RE, "").replace(REPLY_TAG_RE, "");
	return {
		text: stripped,
		changed: stripped !== text
	};
}
function stripUnsafeReplyDirectiveChars(value) {
	const chars = [];
	for (const ch of value) {
		const code = ch.charCodeAt(0);
		if (code >= 0 && code <= 31 || code === 127 || code >= 128 && code <= 159 || ch === "[" || ch === "]") continue;
		chars.push(ch);
	}
	return chars.join("");
}
function sanitizeReplyDirectiveId(rawReplyToId) {
	const trimmed = rawReplyToId?.trim();
	if (!trimmed) return;
	const sanitized = stripUnsafeReplyDirectiveChars(trimmed).trim();
	if (!sanitized) return;
	const chars = Array.from(sanitized);
	if (chars.length > MAX_REPLY_DIRECTIVE_ID_LENGTH) return chars.slice(0, MAX_REPLY_DIRECTIVE_ID_LENGTH).join("");
	return sanitized;
}
function stripInlineDirectiveTagsForDelivery(text) {
	if (!text) return {
		text,
		changed: false
	};
	const stripped = text.replace(INLINE_DIRECTIVE_TAG_WITH_PADDING_RE, " ");
	const changed = stripped !== text;
	return {
		text: changed ? stripped.trim() : text,
		changed
	};
}
function parseInlineDirectives(text, options = {}) {
	const { currentMessageId, stripAudioTag = true, stripReplyTags = true } = options;
	if (!text) return {
		text: "",
		audioAsVoice: false,
		replyToCurrent: false,
		hasAudioTag: false,
		hasReplyTag: false
	};
	if (!text.includes("[[")) return {
		text: normalizeDirectiveWhitespace(text),
		audioAsVoice: false,
		replyToCurrent: false,
		hasAudioTag: false,
		hasReplyTag: false
	};
	let cleaned = text;
	let audioAsVoice = false;
	let hasAudioTag = false;
	let hasReplyTag = false;
	let sawCurrent = false;
	let lastExplicitId;
	cleaned = cleaned.replace(AUDIO_TAG_RE, (match, offset, source) => {
		audioAsVoice = true;
		hasAudioTag = true;
		return stripAudioTag ? replacementPreservesWordBoundary(source, offset, match.length) : match;
	});
	cleaned = cleaned.replace(REPLY_TAG_RE, (match, idRaw, offset, source) => {
		hasReplyTag = true;
		if (idRaw === void 0) sawCurrent = true;
		else {
			const id = sanitizeReplyDirectiveId(idRaw);
			if (id) lastExplicitId = id;
		}
		return stripReplyTags ? replacementPreservesWordBoundary(source, offset, match.length) : match;
	});
	cleaned = normalizeDirectiveWhitespace(cleaned);
	const replyToId = lastExplicitId ?? (sawCurrent ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(currentMessageId) : void 0);
	return {
		text: cleaned,
		audioAsVoice,
		replyToId,
		replyToExplicitId: lastExplicitId,
		replyToCurrent: sawCurrent,
		hasAudioTag,
		hasReplyTag
	};
}
//#endregion
Object.defineProperty(exports, "parseInlineDirectives", {
	enumerable: true,
	get: function() {
		return parseInlineDirectives;
	}
});
Object.defineProperty(exports, "sanitizeReplyDirectiveId", {
	enumerable: true,
	get: function() {
		return sanitizeReplyDirectiveId;
	}
});
Object.defineProperty(exports, "stripInlineDirectiveTagsForDelivery", {
	enumerable: true,
	get: function() {
		return stripInlineDirectiveTagsForDelivery;
	}
});
Object.defineProperty(exports, "stripInlineDirectiveTagsForDisplay", {
	enumerable: true,
	get: function() {
		return stripInlineDirectiveTagsForDisplay;
	}
});
