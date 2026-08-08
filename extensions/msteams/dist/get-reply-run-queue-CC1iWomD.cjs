const require_globals = require("./globals-D7PiAd5y.cjs");
//#region src/auto-reply/reply/get-reply-run-queue.ts
/** Active-run queue admission for prepared reply turns. */
const REPLY_RUN_STILL_SHUTTING_DOWN_TEXT = "⚠️ Previous run is still shutting down. Please try again in a moment.";
/** Resolves whether a new reply may continue after active-run queue handling. */
async function resolvePreparedReplyQueueState(params) {
	if (params.activeRunQueueAction !== "run-now" || !params.activeSessionId) return {
		kind: "continue",
		busyState: params.resolveBusyState()
	};
	if (params.queueMode === "interrupt") {
		const aborted = params.abortActiveRun(params.activeSessionId);
		require_globals.logVerbose(`Interrupting active run for ${params.sessionKey ?? params.sessionId} (aborted=${aborted})`);
	}
	await params.waitForActiveRunEnd(params.activeSessionId);
	await params.refreshPreparedState();
	const refreshedBusyState = params.resolveBusyState();
	if (refreshedBusyState.isActive) return {
		kind: "reply",
		reply: { text: REPLY_RUN_STILL_SHUTTING_DOWN_TEXT }
	};
	return {
		kind: "continue",
		busyState: refreshedBusyState
	};
}
//#endregion
Object.defineProperty(exports, "REPLY_RUN_STILL_SHUTTING_DOWN_TEXT", {
	enumerable: true,
	get: function() {
		return REPLY_RUN_STILL_SHUTTING_DOWN_TEXT;
	}
});
Object.defineProperty(exports, "resolvePreparedReplyQueueState", {
	enumerable: true,
	get: function() {
		return resolvePreparedReplyQueueState;
	}
});
