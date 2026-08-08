let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/utils/transcript-tools.ts
/**
* Transcript inspection helpers shared by session filesystem views and usage metrics.
* Keep provider-specific block aliases centralized so both surfaces classify tools consistently.
*/
const TOOL_CALL_TYPES = /* @__PURE__ */ new Set([
	"tool_use",
	"toolcall",
	"tool_call"
]);
const TOOL_RESULT_TYPES = /* @__PURE__ */ new Set(["tool_result", "tool_result_error"]);
const normalizeType = (value) => {
	return typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) ?? "" : "";
};
/** Extracts de-duplicated tool names from direct fields and structured content blocks. */
const extractToolCallNames = (message) => {
	const names = /* @__PURE__ */ new Set();
	const toolNameRaw = message.toolName ?? message.tool_name;
	const toolName = typeof toolNameRaw === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(toolNameRaw) : void 0;
	if (toolName) names.add(toolName);
	const content = message.content;
	if (!Array.isArray(content)) return Array.from(names);
	for (const entry of content) {
		if (!entry || typeof entry !== "object") continue;
		const block = entry;
		const type = normalizeType(block.type);
		if (!TOOL_CALL_TYPES.has(type)) continue;
		const name = typeof block.name === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.name) : void 0;
		if (name) names.add(name);
	}
	return Array.from(names);
};
/** Returns whether a transcript message contains any recognized tool-call marker. */
const hasToolCall = (message) => extractToolCallNames(message).length > 0;
/** Counts recognized tool-result blocks and the subset explicitly marked as errors. */
const countToolResults = (message) => {
	const content = message.content;
	if (!Array.isArray(content)) return {
		total: 0,
		errors: 0
	};
	let total = 0;
	let errors = 0;
	for (const entry of content) {
		if (!entry || typeof entry !== "object") continue;
		const block = entry;
		const type = normalizeType(block.type);
		if (!TOOL_RESULT_TYPES.has(type)) continue;
		total += 1;
		if (block.is_error === true) errors += 1;
	}
	return {
		total,
		errors
	};
};
//#endregion
//#region src/shared/chat-envelope.ts
const ENVELOPE_PREFIX = /^\[([^\]]+)\]\s*/;
const ENVELOPE_CHANNELS = [
	"WebChat",
	"WhatsApp",
	"Telegram",
	"Signal",
	"Slack",
	"Discord",
	"Google Chat",
	"iMessage",
	"Teams",
	"Matrix",
	"Zalo",
	"Zalo Personal",
	"iMessage"
];
const MESSAGE_ID_LINE = /^\s*\[message_id:\s*[^\]]+\]\s*$/i;
function looksLikeEnvelopeHeader(header) {
	if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z\b/.test(header)) return true;
	if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}\b/.test(header)) return true;
	return ENVELOPE_CHANNELS.some((label) => header.startsWith(`${label} `));
}
/** Removes recognized channel/timestamp prefixes while preserving user-authored bracket text. */
function stripEnvelope(text) {
	const match = text.match(ENVELOPE_PREFIX);
	if (!match) return text;
	if (!looksLikeEnvelopeHeader(match[1] ?? "")) return text;
	return text.slice(match[0].length);
}
/** Removes standalone message-id hint lines without touching inline user mentions. */
function stripMessageIdHints(text) {
	if (!/\[message_id:/i.test(text)) return text;
	const lines = text.split(/\r?\n/);
	const filtered = lines.filter((line) => !MESSAGE_ID_LINE.test(line));
	return filtered.length === lines.length ? text : filtered.join("\n");
}
//#endregion
Object.defineProperty(exports, "countToolResults", {
	enumerable: true,
	get: function() {
		return countToolResults;
	}
});
Object.defineProperty(exports, "extractToolCallNames", {
	enumerable: true,
	get: function() {
		return extractToolCallNames;
	}
});
Object.defineProperty(exports, "hasToolCall", {
	enumerable: true,
	get: function() {
		return hasToolCall;
	}
});
Object.defineProperty(exports, "stripEnvelope", {
	enumerable: true,
	get: function() {
		return stripEnvelope;
	}
});
Object.defineProperty(exports, "stripMessageIdHints", {
	enumerable: true,
	get: function() {
		return stripMessageIdHints;
	}
});
