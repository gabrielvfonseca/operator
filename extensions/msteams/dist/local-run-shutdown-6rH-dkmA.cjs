const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
//#region src/tui/local-run-shutdown.ts
const LOCAL_RUN_SHUTDOWN_GRACE_MS = 12e4;
/** Resolves the hard-exit grace period for local TUI shutdown. */
function resolveLocalRunShutdownGraceMs() {
	const raw = process.env.OPERATOR_TUI_LOCAL_RUN_SHUTDOWN_GRACE_MS?.trim();
	const parsed = require_parse_finite_number.parseStrictNonNegativeInteger(raw);
	if (parsed !== void 0) return Math.min(parsed, require_parse_finite_number.MAX_TIMER_TIMEOUT_MS);
	return LOCAL_RUN_SHUTDOWN_GRACE_MS;
}
//#endregion
Object.defineProperty(exports, "resolveLocalRunShutdownGraceMs", {
	enumerable: true,
	get: function() {
		return resolveLocalRunShutdownGraceMs;
	}
});
