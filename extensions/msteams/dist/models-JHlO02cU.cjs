require("./rolldown-runtime-u92d-OFm.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_models_list_result = require("./models-list-result-CcPWamtI.cjs");
//#region src/gateway/server-methods/models.ts
const modelsHandlers = { "models.list": async ({ params, respond, context }) => {
	if (!require_src.validateModelsListParams(params)) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid models.list params: ${require_validation_errors.formatValidationErrors(require_src.validateModelsListParams.errors)}`));
		return;
	}
	try {
		respond(true, await require_models_list_result.buildModelsListResult({
			context,
			params
		}), void 0);
	} catch (err) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, String(err)));
	}
} };
//#endregion
exports.buildModelsListResult = require_models_list_result.buildModelsListResult;
exports.modelsHandlers = modelsHandlers;
