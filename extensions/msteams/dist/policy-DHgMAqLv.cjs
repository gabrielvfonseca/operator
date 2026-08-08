const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_model_runtime_policy = require("./model-runtime-policy-CHKLCuJi.cjs");
//#region src/agents/harness/policy.ts
var policy_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolveAgentHarnessPolicy: () => resolveAgentHarnessPolicy });
/** Resolves model/provider/runtime config into the canonical harness runtime id. */
function resolveAgentHarnessPolicy(params) {
	const configured = require_model_runtime_policy.resolveModelRuntimePolicy({
		config: params.config,
		provider: params.provider,
		modelId: params.modelId,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
	const configuredRuntime = require_openai_routing.normalizeOptionalAgentRuntimeId(configured.policy?.id);
	const runtime = configuredRuntime && configuredRuntime !== "default" ? configuredRuntime : require_openai_routing.AUTO_AGENT_RUNTIME_ID;
	const runtimeSource = runtime === "auto" ? "implicit" : configured.source ?? "implicit";
	if (runtime !== "auto") return {
		runtime,
		runtimeSource
	};
	const openAIImplicitRuntime = require_openai_routing.resolveOpenAIImplicitAgentRuntime({
		provider: params.provider,
		modelId: params.modelId,
		api: params.modelApi,
		baseUrl: params.modelBaseUrl,
		config: params.config,
		agentId: params.agentId,
		sessionKey: params.sessionKey,
		env: params.env,
		requestTransportOverrides: params.requestTransportOverrides
	});
	if (openAIImplicitRuntime) return {
		runtime: openAIImplicitRuntime,
		runtimeSource
	};
	return {
		runtime,
		runtimeSource
	};
}
//#endregion
Object.defineProperty(exports, "policy_exports", {
	enumerable: true,
	get: function() {
		return policy_exports;
	}
});
Object.defineProperty(exports, "resolveAgentHarnessPolicy", {
	enumerable: true,
	get: function() {
		return resolveAgentHarnessPolicy;
	}
});
