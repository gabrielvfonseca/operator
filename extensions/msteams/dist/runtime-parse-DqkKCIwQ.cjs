const require_theme = require("./theme-DwRpEiJc.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/daemon/output.ts
/** Shared terminal output formatting helpers for daemon install/control commands. */
/** Normalizes Windows separators for command output paths. */
const toPosixPath = (value) => value.replace(/\\/g, "/");
/** Formats a labeled daemon output line with terminal-aware styling. */
function formatLine(label, value) {
	const rich = require_theme.isRich();
	return `${require_theme.colorize(rich, require_theme.theme.muted, `${label}:`)} ${require_theme.colorize(rich, require_theme.theme.command, value)}`;
}
function writeFormattedLines(stdout, lines, opts) {
	if (opts?.leadingBlankLine) stdout.write("\n");
	for (const line of lines) stdout.write(`${formatLine(line.label, line.value)}\n`);
}
//#endregion
//#region src/daemon/runtime-parse.ts
/** Parses daemon runtime command output into normalized key-value maps. */
/** Parses command output key-value lines using a caller-supplied separator. */
function parseKeyValueOutput(output, separator) {
	const entries = {};
	for (const rawLine of output.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) continue;
		const idx = line.indexOf(separator);
		if (idx <= 0) continue;
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(line.slice(0, idx));
		if (!key) continue;
		entries[key] = line.slice(idx + separator.length).trim();
	}
	return entries;
}
//#endregion
Object.defineProperty(exports, "formatLine", {
	enumerable: true,
	get: function() {
		return formatLine;
	}
});
Object.defineProperty(exports, "parseKeyValueOutput", {
	enumerable: true,
	get: function() {
		return parseKeyValueOutput;
	}
});
Object.defineProperty(exports, "toPosixPath", {
	enumerable: true,
	get: function() {
		return toPosixPath;
	}
});
Object.defineProperty(exports, "writeFormattedLines", {
	enumerable: true,
	get: function() {
		return writeFormattedLines;
	}
});
