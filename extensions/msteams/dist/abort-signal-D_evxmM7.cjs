//#region src/infra/abort-signal.ts
function createAbortError(message, options) {
	const error = new Error(message, options);
	error.name = "AbortError";
	return error;
}
function isAbortError(error) {
	if (!error || typeof error !== "object") return false;
	if (("name" in error ? String(error.name) : "") === "AbortError") return true;
	return ("message" in error && typeof error.message === "string" ? error.message : "") === "This operation was aborted";
}
//#endregion
Object.defineProperty(exports, "createAbortError", {
	enumerable: true,
	get: function() {
		return createAbortError;
	}
});
Object.defineProperty(exports, "isAbortError", {
	enumerable: true,
	get: function() {
		return isAbortError;
	}
});
