require("./fs-safe-advanced-r6xSCXfB.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/media/file-context.ts
const XML_ESCAPE_MAP = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	"\"": "&quot;",
	"'": "&apos;"
};
function xmlEscapeAttr(value) {
	return value.replace(/[<>&"']/g, (char) => XML_ESCAPE_MAP[char] ?? char);
}
function escapeFileBlockContent(value) {
	return value.replace(/<\s*\/\s*file\s*>/gi, "&lt;/file&gt;").replace(/<\s*file\b/gi, "&lt;file");
}
function sanitizeFileName(value, fallbackName) {
	return (0, _openclaw_fs_safe_advanced.sanitizeUntrustedFileName)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typeof value === "string" ? value.replace(/[\r\n\t]+/g, " ") : void 0) ?? "", fallbackName);
}
/** Renders sanitized attachment text as a model-visible file block without allowing file-tag injection. */
function renderFileContextBlock(params) {
	const fallbackName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.fallbackName) ?? "attachment";
	const safeName = sanitizeFileName(params.filename, fallbackName);
	const safeContent = escapeFileBlockContent(params.content);
	const mimeType = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.mimeType);
	const attrs = [`name="${xmlEscapeAttr(safeName)}"`, mimeType ? `mime="${xmlEscapeAttr(mimeType)}"` : void 0].filter(Boolean).join(" ");
	if (params.surroundContentWithNewlines === false) return `<file ${attrs}>${safeContent}</file>`;
	return `<file ${attrs}>\n${safeContent}\n</file>`;
}
//#endregion
Object.defineProperty(exports, "renderFileContextBlock", {
	enumerable: true,
	get: function() {
		return renderFileContextBlock;
	}
});
