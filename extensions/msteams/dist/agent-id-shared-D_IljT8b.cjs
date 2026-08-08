require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./src-Bh1Dm1hT.cjs");
//#region src/gateway/server-methods/agent-id-shared.ts
/**
* Shared agent-id resolver for request handlers that accept optional agent ids.
*/
function resolveAgentIdOrRespondError(params) {
	const knownAgents = require_agent_scope_config.listAgentIds(params.cfg);
	const requestedAgentId = params.normalize(params.rawAgentId) ?? "";
	const agentId = requestedAgentId || require_agent_scope_config.resolveDefaultAgentId(params.cfg);
	if (requestedAgentId && !knownAgents.includes(agentId)) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown agent id "${requestedAgentId}"`));
		return null;
	}
	return {
		cfg: params.cfg,
		agentId
	};
}
//#endregion
Object.defineProperty(exports, "resolveAgentIdOrRespondError", {
	enumerable: true,
	get: function() {
		return resolveAgentIdOrRespondError;
	}
});
