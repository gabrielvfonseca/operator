require("./rolldown-runtime-u92d-OFm.cjs");
const require_diagnostic = require("./diagnostic-Blh06VbF.cjs");
const require_diagnostic_session_state = require("./diagnostic-session-state-C4bkHap8.cjs");
const require_tool_loop_detection = require("./tool-loop-detection-CMabbCnJ.cjs");
//#region src/agents/agent-tools.before-tool-call.runtime.ts
/**
* Lazy runtime dependencies for before_tool_call handling.
* Keeps diagnostics and loop-detection imports behind a seam that tests can
* replace without loading the full runtime graph.
*/
/** Runtime seam for before_tool_call diagnostics and loop detection. */
const beforeToolCallRuntime = {
	getDiagnosticSessionState: require_diagnostic_session_state.getDiagnosticSessionState,
	logToolLoopAction: require_diagnostic.logToolLoopAction,
	detectToolCallLoop: require_tool_loop_detection.detectToolCallLoop,
	recordToolCall: require_tool_loop_detection.recordToolCall,
	recordToolCallOutcome: require_tool_loop_detection.recordToolCallOutcome
};
//#endregion
exports.beforeToolCallRuntime = beforeToolCallRuntime;
