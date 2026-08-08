const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-json.ts
/** Safely parses an optional JSON string, returning a payloadJSON wrapper on parse failure. */
function safeParseJson(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return;
	try {
		return JSON.parse(trimmed);
	} catch {
		return { payloadJSON: value };
	}
}
//#endregion
//#region src/gateway/server-methods/nodes.helpers.ts
/** Responds with the protocol validation error for invalid method params. */
function respondInvalidParams(params) {
	params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid ${params.method} params: ${require_validation_errors.formatValidationErrors(params.validator.errors)}`));
}
/** Converts thrown node-handler failures into `UNAVAILABLE` protocol errors. */
async function respondUnavailableOnThrow(respond, fn) {
	try {
		await fn();
	} catch (err) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
	}
}
/** Narrows successful node invoke results or responds with the node error details. */
function respondUnavailableOnNodeInvokeError(respond, res) {
	if (res.ok) return true;
	const nodeError = res.error && typeof res.error === "object" ? res.error : null;
	const nodeCode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(nodeError?.code) ?? "";
	const nodeMessage = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(nodeError?.message) ?? "node invoke failed";
	const message = nodeCode ? `${nodeCode}: ${nodeMessage}` : nodeMessage;
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, message, { details: { nodeError: res.error ?? null } }));
	return false;
}
//#endregion
Object.defineProperty(exports, "respondInvalidParams", {
	enumerable: true,
	get: function() {
		return respondInvalidParams;
	}
});
Object.defineProperty(exports, "respondUnavailableOnNodeInvokeError", {
	enumerable: true,
	get: function() {
		return respondUnavailableOnNodeInvokeError;
	}
});
Object.defineProperty(exports, "respondUnavailableOnThrow", {
	enumerable: true,
	get: function() {
		return respondUnavailableOnThrow;
	}
});
Object.defineProperty(exports, "safeParseJson", {
	enumerable: true,
	get: function() {
		return safeParseJson;
	}
});
