const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
const require_session_model_ref = require("./session-model-ref-DUZbU68I.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
//#region src/gateway/worker-environments/placement-session-runtime.ts
var placement_session_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	isWorkerPlacementSessionRuntimeSupported: () => isWorkerPlacementSessionRuntimeSupported,
	resolveWorkerPlacementSessionRuntime: () => resolveWorkerPlacementSessionRuntime
});
function resolveWorkerPlacementSessionRuntime(params) {
	const persistedRuntime = require_session_runtime_compat.resolvePersistedSessionRuntimeId(params.entry);
	if (persistedRuntime && !require_openai_routing.isDefaultAgentRuntimeId(persistedRuntime)) return persistedRuntime;
	const selectedModel = require_session_model_ref.resolveSessionModelRef(params.cfg, params.entry, params.agentId);
	return require_thinking_runtime.resolveEffectiveAgentRuntime({
		cfg: params.cfg,
		provider: selectedModel.provider,
		modelId: selectedModel.model,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
}
function isWorkerPlacementSessionRuntimeSupported(runtime) {
	return runtime === require_openai_routing.OPERATOR_AGENT_RUNTIME_ID;
}
//#endregion
Object.defineProperty(exports, "isWorkerPlacementSessionRuntimeSupported", {
	enumerable: true,
	get: function() {
		return isWorkerPlacementSessionRuntimeSupported;
	}
});
Object.defineProperty(exports, "placement_session_runtime_exports", {
	enumerable: true,
	get: function() {
		return placement_session_runtime_exports;
	}
});
Object.defineProperty(exports, "resolveWorkerPlacementSessionRuntime", {
	enumerable: true,
	get: function() {
		return resolveWorkerPlacementSessionRuntime;
	}
});
