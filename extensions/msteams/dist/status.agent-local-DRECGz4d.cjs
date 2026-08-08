const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_agent_list = require("./agent-list-C2uJTQ1H.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/commands/status.agent-local.ts
/** Returns per-agent local workspace, bootstrap, session count, and last activity status. */
async function getAgentLocalStatuses(cfg) {
	const agentList = require_agent_list.listGatewayAgentsBasic(cfg);
	const now = Date.now();
	const statuses = [];
	for (const agent of agentList.agents) {
		const agentId = agent.id;
		const workspaceDir = (() => {
			try {
				return require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId);
			} catch {
				return null;
			}
		})();
		const bootstrapPath = workspaceDir != null ? node_path.default.join(workspaceDir, "BOOTSTRAP.md") : null;
		const bootstrapPending = bootstrapPath != null ? await (0, _openclaw_fs_safe_advanced.pathExists)(bootstrapPath) : null;
		const sessionsPath = require_paths.resolveStorePath(cfg.session?.store, { agentId });
		const sessions = require_session_accessor.listSessionEntries({
			agentId,
			storePath: sessionsPath
		}).filter(({ sessionKey }) => sessionKey !== "global" && sessionKey !== "unknown").map(({ entry }) => entry);
		const sessionsCount = sessions.length;
		const lastUpdatedAt = sessions.reduce((max, e) => Math.max(max, e?.updatedAt ?? 0), 0);
		const resolvedLastUpdatedAt = lastUpdatedAt > 0 ? lastUpdatedAt : null;
		const lastActiveAgeMs = resolvedLastUpdatedAt ? now - resolvedLastUpdatedAt : null;
		statuses.push({
			id: agentId,
			name: agent.name,
			workspaceDir,
			bootstrapPending,
			sessionsPath,
			sessionsCount,
			lastUpdatedAt: resolvedLastUpdatedAt,
			lastActiveAgeMs
		});
	}
	const totalSessions = statuses.reduce((sum, s) => sum + s.sessionsCount, 0);
	const bootstrapPendingCount = statuses.reduce((sum, s) => sum + (s.bootstrapPending ? 1 : 0), 0);
	return {
		defaultId: agentList.defaultId,
		agents: statuses,
		totalSessions,
		bootstrapPendingCount
	};
}
//#endregion
exports.getAgentLocalStatuses = getAgentLocalStatuses;
