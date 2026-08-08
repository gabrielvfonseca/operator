let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/tool-error-summary.ts
/**
* Compact tool error summary types.
*
* Stores failure metadata used by transcripts, retry behavior, and mutation recovery logic.
*/
const EXEC_LIKE_TOOL_NAMES = /* @__PURE__ */ new Set(["exec", "bash"]);
/** Detects shell-execution tools that share retry and mutation semantics. */
function isExecLikeToolName(toolName) {
	return EXEC_LIKE_TOOL_NAMES.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(toolName) ?? "");
}
const MAX_ABORT_SUMMARY_LENGTH = 160;
function hasUnsafeSummaryCharacter(value) {
	for (const char of value) {
		const code = char.charCodeAt(0);
		if (code <= 31 || code >= 127 && code <= 159) return true;
	}
	return false;
}
/** Accepts only the compact single-line diagnostic produced below. */
function readToolValidationErrorSummary(value) {
	if (typeof value !== "string") return;
	const summary = value.trim();
	if (!summary || summary.length > MAX_ABORT_SUMMARY_LENGTH || hasUnsafeSummaryCharacter(summary)) return;
	return summary;
}
/** Builds a static diagnostic from typed pre-execution validation provenance. */
function createToolValidationErrorSummary(toolName) {
	if (hasUnsafeSummaryCharacter(toolName)) return;
	const normalizedToolName = toolName.replace(/\s+/g, " ").trim();
	if (!normalizedToolName) return;
	return readToolValidationErrorSummary(`${normalizedToolName} tool validation failed: invalid arguments`);
}
/**
* Returns only a boundary-prepared validation summary. Raw validator messages
* stay private because paths and custom messages can contain model input.
*/
function summarizeToolValidationError(summary) {
	return readToolValidationErrorSummary(summary.validationErrorSummary);
}
//#endregion
Object.defineProperty(exports, "createToolValidationErrorSummary", {
	enumerable: true,
	get: function() {
		return createToolValidationErrorSummary;
	}
});
Object.defineProperty(exports, "isExecLikeToolName", {
	enumerable: true,
	get: function() {
		return isExecLikeToolName;
	}
});
Object.defineProperty(exports, "readToolValidationErrorSummary", {
	enumerable: true,
	get: function() {
		return readToolValidationErrorSummary;
	}
});
Object.defineProperty(exports, "summarizeToolValidationError", {
	enumerable: true,
	get: function() {
		return summarizeToolValidationError;
	}
});
