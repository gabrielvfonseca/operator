const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
//#region src/logging/diagnostic-payload.ts
/** Emits a normalized diagnostic event for rejected, truncated, or chunked payloads. */
function logLargePayload(params) {
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "payload.large",
		...params
	});
}
/** Convenience wrapper for payloads rejected before downstream processing. */
function logRejectedLargePayload(params) {
	logLargePayload({
		action: "rejected",
		...params
	});
}
/** Parses an HTTP Content-Length header without accepting malformed numeric input. */
function parseContentLengthHeader(raw) {
	const value = Array.isArray(raw) ? raw[0] : raw;
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	if (trimmed.length === 0 || !/^\d+$/.test(trimmed)) return;
	return require_parse_finite_number.parseStrictNonNegativeInteger(trimmed);
}
//#endregion
Object.defineProperty(exports, "logLargePayload", {
	enumerable: true,
	get: function() {
		return logLargePayload;
	}
});
Object.defineProperty(exports, "logRejectedLargePayload", {
	enumerable: true,
	get: function() {
		return logRejectedLargePayload;
	}
});
Object.defineProperty(exports, "parseContentLengthHeader", {
	enumerable: true,
	get: function() {
		return parseContentLengthHeader;
	}
});
