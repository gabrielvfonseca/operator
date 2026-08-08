require("./rolldown-runtime-u92d-OFm.cjs");
const require_diagnostic_stability = require("./diagnostic-stability-BM7LOjsk.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./src-Bh1Dm1hT.cjs");
//#region src/gateway/server-methods/diagnostics.ts
/** Gateway handler for payload-free stability diagnostics. */
const diagnosticsHandlers = { "diagnostics.stability": async ({ params, respond }) => {
	try {
		respond(true, require_diagnostic_stability.getDiagnosticStabilitySnapshot(require_diagnostic_stability.normalizeDiagnosticStabilityQuery(params)), void 0);
	} catch (err) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, err instanceof Error ? err.message : "invalid diagnostics.stability params"));
	}
} };
//#endregion
exports.diagnosticsHandlers = diagnosticsHandlers;
