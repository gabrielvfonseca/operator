const require_redact = require("./redact-Bg-yc44I.cjs");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/infra/errors.ts
function extractErrorCode(err) {
	if (!err || typeof err !== "object") return;
	const code = err.code;
	if (typeof code === "string") return code;
	if (typeof code === "number") return String(code);
}
function readErrorName(err) {
	if (!err || typeof err !== "object") return "";
	const name = err.name;
	return typeof name === "string" ? name : "";
}
function collectErrorGraphCandidates(err, resolveNested) {
	const queue = [err];
	const seen = /* @__PURE__ */ new Set();
	const candidates = [];
	while (queue.length > 0) {
		const current = queue.shift();
		if (current == null || seen.has(current)) continue;
		seen.add(current);
		candidates.push(current);
		if (!current || typeof current !== "object" || !resolveNested) continue;
		for (const nested of resolveNested(current)) if (nested != null && !seen.has(nested)) queue.push(nested);
	}
	return candidates;
}
/**
* Type guard for NodeJS.ErrnoException (any error with a `code` property).
*/
function isErrno(err) {
	return Boolean(err && typeof err === "object" && "code" in err);
}
/**
* Check if an error has a specific errno code.
*/
function hasErrnoCode(err, code) {
	return isErrno(err) && err.code === code;
}
function formatErrorMessage(err) {
	return (0, _gabrielvfonseca_normalization_core_error_coercion.formatErrorMessage)(err, { redact: require_redact.redactSensitiveText });
}
function formatUncaughtError(err) {
	if (extractErrorCode(err) === "INVALID_CONFIG") return formatErrorMessage(err);
	if (err instanceof Error) return require_redact.redactSensitiveText(err.stack ?? err.message ?? err.name);
	return formatErrorMessage(err);
}
//#endregion
Object.defineProperty(exports, "collectErrorGraphCandidates", {
	enumerable: true,
	get: function() {
		return collectErrorGraphCandidates;
	}
});
Object.defineProperty(exports, "extractErrorCode", {
	enumerable: true,
	get: function() {
		return extractErrorCode;
	}
});
Object.defineProperty(exports, "formatErrorMessage", {
	enumerable: true,
	get: function() {
		return formatErrorMessage;
	}
});
Object.defineProperty(exports, "formatUncaughtError", {
	enumerable: true,
	get: function() {
		return formatUncaughtError;
	}
});
Object.defineProperty(exports, "hasErrnoCode", {
	enumerable: true,
	get: function() {
		return hasErrnoCode;
	}
});
Object.defineProperty(exports, "isErrno", {
	enumerable: true,
	get: function() {
		return isErrno;
	}
});
Object.defineProperty(exports, "readErrorName", {
	enumerable: true,
	get: function() {
		return readErrorName;
	}
});
