require("./session-key-BQFkCTNx.cjs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/system-agent/agent-id.ts
const SYSTEM_AGENT_ID = "@gabrielvfonseca/operator";
const RESERVED_SYSTEM_AGENT_IDS = /* @__PURE__ */ new Set([(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(SYSTEM_AGENT_ID), (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)("crestodian")]);
function isReservedSystemAgentId(agentId) {
	return RESERVED_SYSTEM_AGENT_IDS.has((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId));
}
//#endregion
Object.defineProperty(exports, "SYSTEM_AGENT_ID", {
	enumerable: true,
	get: function() {
		return SYSTEM_AGENT_ID;
	}
});
Object.defineProperty(exports, "isReservedSystemAgentId", {
	enumerable: true,
	get: function() {
		return isReservedSystemAgentId;
	}
});
