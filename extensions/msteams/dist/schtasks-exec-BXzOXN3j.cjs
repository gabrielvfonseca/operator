const require_exec = require("./exec-CMb2J-j8.cjs");
//#region src/daemon/schtasks-exec.ts
/** Executes Windows Task Scheduler commands with daemon-friendly timeouts. */
const SCHTASKS_TIMEOUT_MS = 15e3;
const SCHTASKS_NO_OUTPUT_TIMEOUT_MS = 3e4;
/** Runs Windows schtasks with bounded timeouts and normalized process results. */
async function execSchtasks(args) {
	const result = await require_exec.runCommandWithTimeout(["schtasks", ...args], {
		timeoutMs: SCHTASKS_TIMEOUT_MS,
		noOutputTimeoutMs: SCHTASKS_NO_OUTPUT_TIMEOUT_MS
	});
	const timeoutDetail = result.termination === "timeout" ? `schtasks timed out after ${SCHTASKS_TIMEOUT_MS}ms` : result.termination === "no-output-timeout" ? `schtasks produced no output for ${SCHTASKS_NO_OUTPUT_TIMEOUT_MS}ms` : "";
	return {
		stdout: result.stdout,
		stderr: result.stderr || timeoutDetail,
		code: typeof result.code === "number" ? result.code : result.killed ? 124 : 1
	};
}
//#endregion
Object.defineProperty(exports, "execSchtasks", {
	enumerable: true,
	get: function() {
		return execSchtasks;
	}
});
