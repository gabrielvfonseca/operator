const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
//#region src/logging/diagnostic-runtime.ts
const diag = require("./subsystem-DVRgVNGQ.cjs").createSubsystemLogger("diagnostic");
let lastActivityAt = 0;
/** Root diagnostic subsystem logger. */
const diagnosticLogger = diag;
/** Marks that diagnostics emitted useful activity. */
function markDiagnosticActivity() {
	lastActivityAt = Date.now();
}
/** Returns the last diagnostic activity timestamp for watchdog-style checks. */
function getLastDiagnosticActivityAt() {
	return lastActivityAt;
}
/** Logs and emits a diagnostic event when work enters a serialized lane. */
function logLaneEnqueue(lane, queueSize) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	diag.debug(`lane enqueue: lane=${lane} queueSize=${queueSize}`);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "queue.lane.enqueue",
		lane,
		queueSize
	});
	markDiagnosticActivity();
}
/** Logs and emits a diagnostic event when work leaves a serialized lane. */
function logLaneDequeue(lane, waitMs, queueSize) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	diag.debug(`lane dequeue: lane=${lane} waitMs=${waitMs} queueSize=${queueSize}`);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "queue.lane.dequeue",
		lane,
		queueSize,
		waitMs
	});
	markDiagnosticActivity();
}
//#endregion
Object.defineProperty(exports, "diagnosticLogger", {
	enumerable: true,
	get: function() {
		return diagnosticLogger;
	}
});
Object.defineProperty(exports, "getLastDiagnosticActivityAt", {
	enumerable: true,
	get: function() {
		return getLastDiagnosticActivityAt;
	}
});
Object.defineProperty(exports, "logLaneDequeue", {
	enumerable: true,
	get: function() {
		return logLaneDequeue;
	}
});
Object.defineProperty(exports, "logLaneEnqueue", {
	enumerable: true,
	get: function() {
		return logLaneEnqueue;
	}
});
Object.defineProperty(exports, "markDiagnosticActivity", {
	enumerable: true,
	get: function() {
		return markDiagnosticActivity;
	}
});
