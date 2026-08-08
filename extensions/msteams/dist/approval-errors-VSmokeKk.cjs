let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/approval-errors.ts
const INVALID_REQUEST = "INVALID_REQUEST";
const APPROVAL_NOT_FOUND = "APPROVAL_NOT_FOUND";
const APPROVAL_ALREADY_RESOLVED = "APPROVAL_ALREADY_RESOLVED";
function readErrorCode(value) {
	return typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? null : null;
}
function readApprovalErrorDetailsReason(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const reason = value.reason;
	return typeof reason === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(reason) ?? null : null;
}
/**
* Detects approval-not-found failures across gateway error shapes.
* Kept broad enough for legacy message-only errors emitted before structured codes.
*/
function isApprovalNotFoundError(err) {
	if (!(err instanceof Error)) return false;
	const gatewayCode = readErrorCode(err.gatewayCode);
	if (gatewayCode === APPROVAL_NOT_FOUND) return true;
	const detailsReason = readApprovalErrorDetailsReason(err.details);
	if (gatewayCode === INVALID_REQUEST && detailsReason === APPROVAL_NOT_FOUND) return true;
	return /unknown or expired approval id/i.test(err.message);
}
/** Detects approval failures that mean a pending prompt is no longer actionable. */
function isApprovalStaleError(err) {
	if (isApprovalNotFoundError(err)) return true;
	if (!(err instanceof Error)) return false;
	const gatewayCode = readErrorCode(err.gatewayCode);
	const detailsReason = readApprovalErrorDetailsReason(err.details);
	return gatewayCode === INVALID_REQUEST && detailsReason === APPROVAL_ALREADY_RESOLVED || /approval already resolved/i.test(err.message);
}
//#endregion
Object.defineProperty(exports, "isApprovalNotFoundError", {
	enumerable: true,
	get: function() {
		return isApprovalNotFoundError;
	}
});
Object.defineProperty(exports, "isApprovalStaleError", {
	enumerable: true,
	get: function() {
		return isApprovalStaleError;
	}
});
