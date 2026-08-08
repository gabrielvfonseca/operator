const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
//#region src/gateway/server-methods/validation.ts
/** Validate params and emit the standard INVALID_REQUEST response on failure. */
function assertValidParams(params, validate, method, respond) {
	if (validate(params)) return true;
	respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid ${method} params: ${require_validation_errors.formatValidationErrors(validate.errors)}`));
	return false;
}
//#endregion
Object.defineProperty(exports, "assertValidParams", {
	enumerable: true,
	get: function() {
		return assertValidParams;
	}
});
