const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
require("./lifecycle-D3m53H2V.cjs");
const require_agent_bundle_mcp_runtime = require("./agent-bundle-mcp-runtime-bT8ElU5D.cjs");
require("./agent-bundle-mcp-tools-e1AmWJ1L.cjs");
//#region src/cron/isolated-agent/session-cleanup.ts
const gatewayCallRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./call.runtime-B6Wq57Um.cjs")));
async function loadGatewayCallRuntime() {
	return await gatewayCallRuntimeLoader.load();
}
async function cleanupCronRunSessionAfterRun(params) {
	if (!shouldDeleteCronRunSessionAfterRun(params)) return "not-requested";
	params.beforeDelete?.();
	try {
		const { callGateway } = await loadGatewayCallRuntime();
		return (await callGateway({
			method: "sessions.delete",
			params: {
				key: params.agentSessionKey,
				deleteTranscript: true,
				emitLifecycleHooks: false,
				expectedSessionId: params.sessionId,
				expectedLifecycleRevision: params.lifecycleRevision,
				expectedSessionUpdatedAt: params.sessionUpdatedAt
			},
			timeoutMs: 1e4
		})).deleted === true ? "deleted" : "changed";
	} catch (error) {
		if (isSessionChangedGatewayError(error)) return "changed";
		if (params.job.sessionTarget === "isolated") {
			await require_agent_bundle_mcp_runtime.retireSessionMcpRuntime({
				sessionId: params.sessionId,
				reason: params.reason
			});
			return "retired";
		}
		return "survived";
	}
}
function shouldDeleteCronRunSessionAfterRun(params) {
	return params.job.deleteAfterRun === true && require_session_key.isCronSessionKey(params.agentSessionKey);
}
function isSessionChangedGatewayError(error) {
	if (!(error instanceof Error) || error.name !== "GatewayClientRequestError") return false;
	const requestError = error;
	const details = requestError.details;
	return requestError.gatewayCode === "INVALID_REQUEST" && typeof details === "object" && details !== null && details.reason === "session-changed";
}
//#endregion
Object.defineProperty(exports, "cleanupCronRunSessionAfterRun", {
	enumerable: true,
	get: function() {
		return cleanupCronRunSessionAfterRun;
	}
});
