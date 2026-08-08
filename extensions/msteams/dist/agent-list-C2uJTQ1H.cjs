const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/agent-list.ts
function listExistingAgentIdsFromDisk() {
	const root = require_paths.resolveStateDir();
	const agentsDir = node_path.default.join(root, "agents");
	try {
		return node_fs.default.readdirSync(agentsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.name)).filter(Boolean);
	} catch {
		return [];
	}
}
function listGatewayAgentIds(cfg) {
	const ids = /* @__PURE__ */ new Set();
	const defaultId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
	ids.add(defaultId);
	for (const entry of cfg.agents?.list ?? []) if (entry?.id) ids.add((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id));
	for (const id of listExistingAgentIdsFromDisk()) ids.add(id);
	const sorted = Array.from(ids).filter(Boolean);
	sorted.sort((a, b) => a.localeCompare(b));
	return sorted.includes(defaultId) ? [defaultId, ...sorted.filter((id) => id !== defaultId)] : sorted;
}
/** Lists gateway-visible agent ids with default/main session metadata. */
function listGatewayAgentsBasic(cfg) {
	const defaultId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
	const mainKey = require_session_key.normalizeMainKey(cfg.session?.mainKey);
	const scope = cfg.session?.scope ?? "per-sender";
	const configuredById = /* @__PURE__ */ new Map();
	for (const entry of cfg.agents?.list ?? []) {
		if (!entry?.id) continue;
		const configuredName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.name);
		const identityName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.identity?.name);
		configuredById.set((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id), { name: configuredName ?? identityName });
	}
	const explicitIds = new Set((cfg.agents?.list ?? []).map((entry) => entry?.id ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) : "").filter(Boolean));
	const allowedIds = explicitIds.size > 0 ? /* @__PURE__ */ new Set([...explicitIds, defaultId]) : null;
	let agentIds = listGatewayAgentIds(cfg).filter((id) => allowedIds ? allowedIds.has(id) : true);
	if (mainKey && !agentIds.includes(mainKey) && (!allowedIds || allowedIds.has(mainKey))) agentIds = [...agentIds, mainKey];
	return {
		defaultId,
		mainKey,
		scope,
		agents: agentIds.map((id) => {
			return {
				id,
				name: configuredById.get(id)?.name
			};
		})
	};
}
//#endregion
Object.defineProperty(exports, "listGatewayAgentIds", {
	enumerable: true,
	get: function() {
		return listGatewayAgentIds;
	}
});
Object.defineProperty(exports, "listGatewayAgentsBasic", {
	enumerable: true,
	get: function() {
		return listGatewayAgentsBasic;
	}
});
