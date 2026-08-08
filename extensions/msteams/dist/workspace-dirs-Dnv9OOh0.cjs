const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
//#region src/agents/workspace-dirs.ts
var workspace_dirs_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ listAgentWorkspaceDirs: () => listAgentWorkspaceDirs });
/** Lists unique workspace directories for configured agents and the default agent. */
function listAgentWorkspaceDirs(cfg) {
	const dirs = /* @__PURE__ */ new Set();
	const list = cfg.agents?.list;
	if (Array.isArray(list)) {
		for (const entry of list) if (entry && typeof entry === "object" && typeof entry.id === "string") dirs.add(require_agent_scope_config.resolveAgentWorkspaceDir(cfg, entry.id));
	}
	dirs.add(require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg)));
	return [...dirs];
}
//#endregion
Object.defineProperty(exports, "listAgentWorkspaceDirs", {
	enumerable: true,
	get: function() {
		return listAgentWorkspaceDirs;
	}
});
Object.defineProperty(exports, "workspace_dirs_exports", {
	enumerable: true,
	get: function() {
		return workspace_dirs_exports;
	}
});
