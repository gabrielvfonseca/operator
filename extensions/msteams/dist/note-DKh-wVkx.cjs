const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_prompt_style = require("./prompt-style-DDurS--q.cjs");
require("./string-BE2jlabG.cjs");
let node_async_hooks = require("node:async_hooks");
let _clack_prompts = require("@clack/prompts");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region packages/terminal-core/src/note.ts
var note_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	note: () => note,
	resolveNoteColumns: () => resolveNoteColumns,
	resolveNoteOutputColumns: () => resolveNoteOutputColumns,
	withSuppressedNotes: () => withSuppressedNotes,
	wrapNoteMessage: () => wrapNoteMessage
});
const MIN_NOTE_COLUMNS = 80;
const URL_PREFIX_RE = /^(https?:\/\/|file:\/\/)/i;
const WINDOWS_DRIVE_RE = /^[a-zA-Z]:[\\/]/;
const FILE_LIKE_RE = /^[a-zA-Z0-9._-]+$/;
const suppressNotesStorage = new node_async_hooks.AsyncLocalStorage();
function isSuppressedByEnv(value) {
	if (!value) return false;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
	if (!normalized) return false;
	return normalized !== "0" && normalized !== "false" && normalized !== "off";
}
function splitLongWord(word, maxLen) {
	if (maxLen <= 0) return [word];
	const parts = [];
	let current = "";
	let currentWidth = 0;
	for (const grapheme of require_ansi.splitGraphemes(word)) {
		const width = require_ansi.visibleWidth(grapheme);
		if (current && currentWidth + width > maxLen) {
			parts.push(current);
			current = "";
			currentWidth = 0;
		}
		current += grapheme;
		currentWidth += width;
	}
	if (current) parts.push(current);
	return parts.length > 0 ? parts : [word];
}
function isCopySensitiveToken(word) {
	if (!word) return false;
	if (URL_PREFIX_RE.test(word)) return true;
	if (word.startsWith("/") || word.startsWith("~/") || word.startsWith("./") || word.startsWith("../")) return true;
	if (WINDOWS_DRIVE_RE.test(word) || word.startsWith("\\\\")) return true;
	if (word.includes("/") || word.includes("\\")) return true;
	return word.includes("_") && FILE_LIKE_RE.test(word);
}
function pushWrappedWordSegments(params) {
	const parts = splitLongWord(params.word, params.available);
	const first = parts.shift() ?? "";
	params.lines.push(params.firstPrefix + first);
	for (const part of parts) params.lines.push(params.continuationPrefix + part);
}
function wrapLine(line, maxWidth) {
	if (line.trim().length === 0) return [line];
	const match = line.match(/^(\s*)([-*\u2022]\s+)?(.*)$/);
	const indent = match?.[1] ?? "";
	const bullet = match?.[2] ?? "";
	const content = match?.[3] ?? "";
	const firstPrefix = `${indent}${bullet}`;
	const nextPrefix = `${indent}${bullet ? " ".repeat(bullet.length) : ""}`;
	const firstWidth = Math.max(10, maxWidth - require_ansi.visibleWidth(firstPrefix));
	const nextWidth = Math.max(10, maxWidth - require_ansi.visibleWidth(nextPrefix));
	const words = content.split(/\s+/).filter(Boolean);
	const lines = [];
	let current = "";
	let prefix = firstPrefix;
	let available = firstWidth;
	for (const word of words) {
		if (!current) {
			if (require_ansi.visibleWidth(word) > available) {
				if (isCopySensitiveToken(word)) {
					current = word;
					continue;
				}
				pushWrappedWordSegments({
					word,
					available,
					firstPrefix: prefix,
					continuationPrefix: nextPrefix,
					lines
				});
				prefix = nextPrefix;
				available = nextWidth;
				continue;
			}
			current = word;
			continue;
		}
		const candidate = `${current} ${word}`;
		if (require_ansi.visibleWidth(candidate) <= available) {
			current = candidate;
			continue;
		}
		lines.push(prefix + current);
		prefix = nextPrefix;
		available = nextWidth;
		if (require_ansi.visibleWidth(word) > available) {
			if (isCopySensitiveToken(word)) {
				current = word;
				continue;
			}
			pushWrappedWordSegments({
				word,
				available,
				firstPrefix: prefix,
				continuationPrefix: prefix,
				lines
			});
			current = "";
			continue;
		}
		current = word;
	}
	if (current || words.length === 0) lines.push(prefix + current);
	return lines;
}
function coerceNoteMessage(message) {
	if (typeof message === "string") return message;
	if (message == null) return "";
	if (typeof message === "number" || typeof message === "boolean" || typeof message === "bigint") return String(message);
	if (message instanceof Error) return message.message ? `${message.name}: ${message.message}` : message.name;
	return "";
}
function wrapNoteMessage(message, options = {}) {
	const text = coerceNoteMessage(message);
	const columns = options.columns ?? resolveNoteColumns(process.stdout.columns);
	const maxWidth = options.maxWidth ?? Math.max(40, Math.min(88, columns - 10));
	return text.split("\n").flatMap((line) => wrapLine(line, maxWidth)).join("\n");
}
function resolveNoteColumns(columns) {
	if (!Number.isFinite(columns) || !columns || columns < MIN_NOTE_COLUMNS) return MIN_NOTE_COLUMNS;
	return columns;
}
function resolveNoteOutputColumns(message, columns) {
	const widestLine = message.split("\n").reduce((max, line) => Math.max(max, require_ansi.visibleWidth(line)), 0);
	return Math.max(columns, widestLine + 6);
}
function createNoteOutput(columns) {
	if (process.stdout.columns === columns) return process.stdout;
	const output = Object.create(process.stdout);
	Object.defineProperty(output, "columns", {
		value: columns,
		configurable: true
	});
	output.write = process.stdout.write.bind(process.stdout);
	return output;
}
function note(message, title) {
	if (suppressNotesStorage.getStore() === true || isSuppressedByEnv(process.env.OPERATOR_SUPPRESS_NOTES)) return;
	const columns = resolveNoteColumns(process.stdout.columns);
	const wrappedMessage = wrapNoteMessage(message, { columns });
	(0, _clack_prompts.note)(wrappedMessage, require_prompt_style.stylePromptTitle(title), { output: createNoteOutput(resolveNoteOutputColumns(wrappedMessage, columns)) });
}
function withSuppressedNotes(callback) {
	return suppressNotesStorage.run(true, callback);
}
//#endregion
Object.defineProperty(exports, "note", {
	enumerable: true,
	get: function() {
		return note;
	}
});
Object.defineProperty(exports, "note_exports", {
	enumerable: true,
	get: function() {
		return note_exports;
	}
});
