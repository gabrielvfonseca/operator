let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/runtime-status.ts
/** Formats runtime health/status text with optional pid, state, and extra diagnostic details. */
function formatRuntimeStatusWithDetails({ status, pid, state, details = [] }) {
	const runtimeStatus = status?.trim() || "unknown";
	const fullDetails = [];
	if (pid) fullDetails.push(`pid ${pid}`);
	const normalizedState = state?.trim();
	if (normalizedState && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizedState) !== (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(runtimeStatus)) fullDetails.push(`state ${normalizedState}`);
	for (const detail of details) {
		const normalizedDetail = detail.trim();
		if (normalizedDetail) fullDetails.push(normalizedDetail);
	}
	return fullDetails.length > 0 ? `${runtimeStatus} (${fullDetails.join(", ")})` : runtimeStatus;
}
//#endregion
Object.defineProperty(exports, "formatRuntimeStatusWithDetails", {
	enumerable: true,
	get: function() {
		return formatRuntimeStatusWithDetails;
	}
});
