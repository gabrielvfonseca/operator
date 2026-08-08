const require_ansi = require("./ansi-DY9p-M6m.cjs");
//#region packages/terminal-core/src/safe-text.ts
/**
* Normalize untrusted text for single-line terminal/log rendering.
*/
function sanitizeTerminalText(input) {
	const normalized = require_ansi.stripAnsi(input).replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
	let sanitized = "";
	for (const char of normalized) {
		const code = char.charCodeAt(0);
		if (!(code >= 0 && code <= 31 || code >= 127 && code <= 159)) sanitized += char;
	}
	return sanitized;
}
//#endregion
Object.defineProperty(exports, "sanitizeTerminalText", {
	enumerable: true,
	get: function() {
		return sanitizeTerminalText;
	}
});
