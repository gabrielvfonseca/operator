require("./session-key-BQFkCTNx.cjs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/hooks-policy.ts
/** Resolves configured hook agent ids, or undefined when all agents are allowed. */
function resolveAllowedAgentIds(raw) {
	if (!Array.isArray(raw)) return;
	const allowed = /* @__PURE__ */ new Set();
	let hasWildcard = false;
	for (const entry of raw) {
		const trimmed = entry.trim();
		if (!trimmed) continue;
		if (trimmed === "*") {
			hasWildcard = true;
			break;
		}
		allowed.add((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(trimmed));
	}
	if (hasWildcard) return;
	return allowed;
}
//#endregion
Object.defineProperty(exports, "resolveAllowedAgentIds", {
	enumerable: true,
	get: function() {
		return resolveAllowedAgentIds;
	}
});
