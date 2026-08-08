const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/agent-dir-registry.ts
/** Process-local reverse registry from prepared agent directories to agent ids. */
const agentIdByDir = /* @__PURE__ */ new Map();
function normalizeAgentDirKey(agentDir, env = process.env) {
	return node_path.default.resolve(require_home_dir.resolveUserPath(agentDir, env));
}
/** Register a resolved agent directory for later reverse lookup. */
function registerResolvedAgentDir(params) {
	agentIdByDir.set(normalizeAgentDirKey(params.agentDir, params.env), (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId));
}
/** Resolve the agent id previously registered for an agent directory. */
function resolveRegisteredAgentIdForDir(agentDir, env) {
	return agentIdByDir.get(normalizeAgentDirKey(agentDir, env));
}
//#endregion
//#region src/agents/workspace-default.ts
/**
* Default agent workspace resolver.
*
* Derives the process workspace directory from env, profile, and home-directory state.
*/
/** Resolve the default agent workspace directory from env/profile/home state. */
function resolveDefaultAgentWorkspaceDir(env = process.env, homedir = node_os.default.homedir) {
	const workspaceDir = env.OPERATOR_WORKSPACE_DIR?.trim();
	if (workspaceDir) return node_path.default.resolve(workspaceDir);
	const home = require_home_dir.resolveRequiredHomeDir(env, homedir);
	const profile = env.OPERATOR_PROFILE?.trim();
	if (profile && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(profile) !== "default") return node_path.default.join(home, ".operator", `workspace-${profile}`);
	return node_path.default.join(home, ".operator", "workspace");
}
/** Default agent workspace directory for the current process environment. */
const DEFAULT_AGENT_WORKSPACE_DIR = resolveDefaultAgentWorkspaceDir();
//#endregion
//#region src/agents/agent-scope-config.ts
/** Resolves configured agent ids, directories, workspaces, and merged agent defaults. */
let defaultAgentWarned = false;
function warnMultipleDefaultAgents() {
	Promise.resolve().then(() => require("./subsystem-DVRgVNGQ.cjs")).then((n) => n.subsystem_exports).then(({ createSubsystemLogger }) => {
		createSubsystemLogger("agent-scope").warn("Multiple agents marked default=true; using the first entry as default.");
	}).catch(() => void 0);
}
/** Strip null bytes from paths to prevent ENOTDIR errors. */
function stripNullBytes(s) {
	return s.replaceAll("\0", "");
}
/** Lists valid configured agent entries from config. */
function listAgentEntries(cfg) {
	const list = cfg.agents?.list;
	if (!Array.isArray(list)) return [];
	return list.filter((entry) => entry !== null && typeof entry === "object");
}
/** Lists unique configured agent ids, falling back to the default agent id. */
function listAgentIds(cfg) {
	const agents = listAgentEntries(cfg);
	if (agents.length === 0) return [require_session_key.DEFAULT_AGENT_ID];
	const seen = /* @__PURE__ */ new Set();
	const ids = [];
	for (const entry of agents) {
		const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry?.id);
		if (seen.has(id)) continue;
		seen.add(id);
		ids.push(id);
	}
	return ids.length > 0 ? ids : [require_session_key.DEFAULT_AGENT_ID];
}
/** Resolves the default agent id, warning once when multiple defaults exist. */
function resolveDefaultAgentId(cfg) {
	const agents = listAgentEntries(cfg);
	if (agents.length === 0) return require_session_key.DEFAULT_AGENT_ID;
	const defaults = agents.filter((agent) => agent?.default);
	if (defaults.length > 1 && !defaultAgentWarned) {
		defaultAgentWarned = true;
		warnMultipleDefaultAgents();
	}
	const chosen = (defaults[0] ?? agents[0])?.id?.trim();
	return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(chosen || "main");
}
function resolveAgentEntry(cfg, agentId) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	return listAgentEntries(cfg).find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === id);
}
/** Resolves merged config for one agent id. */
function resolveAgentConfig(cfg, agentId) {
	const entry = resolveAgentEntry(cfg, (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId));
	if (!entry) return;
	const agentDefaults = cfg.agents?.defaults;
	return {
		name: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(entry.name),
		workspace: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(entry.workspace),
		agentDir: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(entry.agentDir),
		model: typeof entry.model === "string" || entry.model && typeof entry.model === "object" ? entry.model : void 0,
		...entry.models ? { models: entry.models } : {},
		utilityModel: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(entry.utilityModel),
		thinkingDefault: entry.thinkingDefault,
		verboseDefault: entry.verboseDefault ?? agentDefaults?.verboseDefault,
		reasoningDefault: entry.reasoningDefault,
		fastModeDefault: entry.fastModeDefault,
		contextTokens: entry.contextTokens ?? agentDefaults?.contextTokens,
		contextInjection: entry.contextInjection,
		bootstrapMaxChars: entry.bootstrapMaxChars,
		bootstrapTotalMaxChars: entry.bootstrapTotalMaxChars,
		experimental: typeof entry.experimental === "object" && entry.experimental ? {
			...agentDefaults?.experimental,
			...entry.experimental
		} : agentDefaults?.experimental,
		skills: Array.isArray(entry.skills) ? entry.skills : void 0,
		memorySearch: entry.memorySearch,
		humanDelay: entry.humanDelay,
		tts: entry.tts,
		contextLimits: typeof entry.contextLimits === "object" && entry.contextLimits ? {
			...agentDefaults?.contextLimits,
			...entry.contextLimits
		} : agentDefaults?.contextLimits,
		heartbeat: entry.heartbeat,
		identity: entry.identity,
		groupChat: entry.groupChat,
		subagents: typeof entry.subagents === "object" && entry.subagents ? entry.subagents : void 0,
		runRetries: typeof entry.runRetries === "object" && entry.runRetries ? {
			...agentDefaults?.runRetries,
			...entry.runRetries
		} : agentDefaults?.runRetries,
		embeddedAgent: typeof entry.embeddedAgent === "object" && entry.embeddedAgent ? entry.embeddedAgent : void 0,
		sandbox: entry.sandbox,
		tools: entry.tools
	};
}
function resolveAgentContextLimits(cfg, agentId) {
	const defaults = cfg?.agents?.defaults?.contextLimits;
	if (!cfg || !agentId) return defaults;
	return resolveAgentConfig(cfg, agentId)?.contextLimits ?? defaults;
}
function resolveAgentWorkspaceDir(cfg, agentId, env = process.env) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const configured = resolveAgentConfig(cfg, id)?.workspace?.trim();
	if (configured) return stripNullBytes(require_home_dir.resolveUserPath(configured, env));
	const defaultAgentId = resolveDefaultAgentId(cfg);
	const fallback = cfg.agents?.defaults?.workspace?.trim();
	if (id === defaultAgentId) {
		if (fallback) return stripNullBytes(require_home_dir.resolveUserPath(fallback, env));
		return stripNullBytes(resolveDefaultAgentWorkspaceDir(env));
	}
	if (fallback) return stripNullBytes(node_path.default.join(require_home_dir.resolveUserPath(fallback, env), id));
	const stateDir = require_paths.resolveStateDir(env);
	return stripNullBytes(node_path.default.join(stateDir, `workspace-${id}`));
}
function resolveAgentDir(cfg, agentId, env = process.env) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const configured = resolveAgentConfig(cfg, id)?.agentDir?.trim();
	if (configured) {
		const agentDir = require_home_dir.resolveUserPath(configured, env);
		registerResolvedAgentDir({
			agentId: id,
			agentDir,
			env
		});
		return agentDir;
	}
	const root = require_paths.resolveStateDir(env);
	const agentDir = node_path.default.join(root, "agents", id, "agent");
	registerResolvedAgentDir({
		agentId: id,
		agentDir,
		env
	});
	return agentDir;
}
function resolveDefaultAgentDir(cfg, env = process.env) {
	return resolveAgentDir(cfg, resolveDefaultAgentId(cfg), env);
}
//#endregion
Object.defineProperty(exports, "DEFAULT_AGENT_WORKSPACE_DIR", {
	enumerable: true,
	get: function() {
		return DEFAULT_AGENT_WORKSPACE_DIR;
	}
});
Object.defineProperty(exports, "listAgentEntries", {
	enumerable: true,
	get: function() {
		return listAgentEntries;
	}
});
Object.defineProperty(exports, "listAgentIds", {
	enumerable: true,
	get: function() {
		return listAgentIds;
	}
});
Object.defineProperty(exports, "resolveAgentConfig", {
	enumerable: true,
	get: function() {
		return resolveAgentConfig;
	}
});
Object.defineProperty(exports, "resolveAgentContextLimits", {
	enumerable: true,
	get: function() {
		return resolveAgentContextLimits;
	}
});
Object.defineProperty(exports, "resolveAgentDir", {
	enumerable: true,
	get: function() {
		return resolveAgentDir;
	}
});
Object.defineProperty(exports, "resolveAgentWorkspaceDir", {
	enumerable: true,
	get: function() {
		return resolveAgentWorkspaceDir;
	}
});
Object.defineProperty(exports, "resolveDefaultAgentDir", {
	enumerable: true,
	get: function() {
		return resolveDefaultAgentDir;
	}
});
Object.defineProperty(exports, "resolveDefaultAgentId", {
	enumerable: true,
	get: function() {
		return resolveDefaultAgentId;
	}
});
Object.defineProperty(exports, "resolveDefaultAgentWorkspaceDir", {
	enumerable: true,
	get: function() {
		return resolveDefaultAgentWorkspaceDir;
	}
});
Object.defineProperty(exports, "resolveRegisteredAgentIdForDir", {
	enumerable: true,
	get: function() {
		return resolveRegisteredAgentIdForDir;
	}
});
