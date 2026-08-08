require("./session-key-BQFkCTNx.cjs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/config/exec-command-highlighting.ts
/** Resolves whether exec command highlighting is enabled for the current agent scope. */
function resolveExecCommandHighlighting(params) {
	const config = params.config ?? {};
	const globalValue = config.tools?.exec?.commandHighlighting;
	const agentId = params.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) : null;
	return (agentId ? config.agents?.list?.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === agentId)?.tools?.exec?.commandHighlighting : void 0) ?? globalValue ?? false;
}
//#endregion
Object.defineProperty(exports, "resolveExecCommandHighlighting", {
	enumerable: true,
	get: function() {
		return resolveExecCommandHighlighting;
	}
});
