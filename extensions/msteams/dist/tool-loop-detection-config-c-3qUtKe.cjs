require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
//#region src/agents/tool-loop-detection-config.ts
/** Resolves effective tool loop-detection config by overlaying agent settings on globals. */
function resolveToolLoopDetectionConfig(params) {
	const global = params.cfg?.tools?.loopDetection;
	const agent = params.agentId && params.cfg ? require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId)?.tools?.loopDetection : void 0;
	if (!agent) return global;
	if (!global) return agent;
	return {
		...global,
		...agent,
		detectors: {
			...global.detectors,
			...agent.detectors
		},
		postCompactionGuard: {
			...global.postCompactionGuard,
			...agent.postCompactionGuard
		}
	};
}
//#endregion
Object.defineProperty(exports, "resolveToolLoopDetectionConfig", {
	enumerable: true,
	get: function() {
		return resolveToolLoopDetectionConfig;
	}
});
