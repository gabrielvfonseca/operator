const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
let node_url = require("node:url");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
//#region src/agents/sessions/tools/path-utils.ts
/**
* Session tool path normalization helpers.
*
* Expands user/file URL inputs and resolves read/write paths against the active cwd with macOS filename variants.
*/
const UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;
const NARROW_NO_BREAK_SPACE = " ";
function normalizeUnicodeSpaces(str) {
	return str.replace(UNICODE_SPACES, " ");
}
function tryMacOSScreenshotPath(filePath) {
	return filePath.replace(/ (AM|PM)\./gi, `${NARROW_NO_BREAK_SPACE}$1.`);
}
function tryNFDVariant(filePath) {
	return filePath.normalize("NFD");
}
function tryCurlyQuoteVariant(filePath) {
	return filePath.replace(/'/g, "’");
}
function fileExists(filePath) {
	try {
		(0, node_fs.accessSync)(filePath, node_fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
}
function normalizeAtPrefix(filePath) {
	return filePath.startsWith("@") ? filePath.slice(1) : filePath;
}
function expandPath(filePath) {
	const normalized = normalizeUnicodeSpaces(normalizeAtPrefix(filePath));
	if (normalized.startsWith("file://")) try {
		return (0, node_url.fileURLToPath)(normalized);
	} catch {
		return normalized;
	}
	if (normalized === "~") return node_os.homedir();
	if (normalized.startsWith("~/")) return node_os.homedir() + normalized.slice(1);
	return normalized;
}
/**
* Resolve a path relative to the given cwd.
* Handles ~ expansion and absolute paths.
*/
function resolveToCwd(filePath, cwd) {
	const expanded = expandPath(filePath);
	if ((0, node_path.isAbsolute)(expanded)) return expanded;
	return (0, node_path.resolve)(cwd, expanded);
}
function resolveReadPath(filePath, cwd) {
	const resolved = resolveToCwd(filePath, cwd);
	if (fileExists(resolved)) return resolved;
	const amPmVariant = tryMacOSScreenshotPath(resolved);
	if (amPmVariant !== resolved && fileExists(amPmVariant)) return amPmVariant;
	const nfdVariant = tryNFDVariant(resolved);
	if (nfdVariant !== resolved && fileExists(nfdVariant)) return nfdVariant;
	const curlyVariant = tryCurlyQuoteVariant(resolved);
	if (curlyVariant !== resolved && fileExists(curlyVariant)) return curlyVariant;
	const nfdCurlyVariant = tryCurlyQuoteVariant(nfdVariant);
	if (nfdCurlyVariant !== resolved && fileExists(nfdCurlyVariant)) return nfdCurlyVariant;
	return resolved;
}
//#endregion
Object.defineProperty(exports, "resolveReadPath", {
	enumerable: true,
	get: function() {
		return resolveReadPath;
	}
});
Object.defineProperty(exports, "resolveToCwd", {
	enumerable: true,
	get: function() {
		return resolveToCwd;
	}
});
