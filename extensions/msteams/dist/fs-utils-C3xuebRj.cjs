const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./utils-CXqBhRFw.cjs");
require("./types.secrets-2BFwbY6H.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
require("./paths-C5Qy0ueD.cjs");
require("./theme-DwRpEiJc.cjs");
require("./redact-Bg-yc44I.cjs");
require("./globals-D7PiAd5y.cjs");
require("./runtime-BOSfFY3R.cjs");
require("./subsystem-DVRgVNGQ.cjs");
require("./config-schema-G1HIsf87.cjs");
require("./registry-B6IZcEYI.cjs");
require("./errors-BqS4bzom.cjs");
require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
require("./common-lfuK3YJR.cjs");
require("./strip-inbound-meta-CE5-_osk.cjs");
require("./main-session-x7hRR6eC.cjs");
require("./internal-runtime-context-C0HOZ5eF.cjs");
require("./config-DT0qiglW.cjs");
require("./resolve-B9vhODuI.cjs");
require("./parse-duration-Csu-f48Z.cjs");
require("./zod-schema-88BPc5CZ.cjs");
require("./paths-DsfW3Lup.cjs");
require("./transcript-events-C9OOwQkF.cjs");
require("./heartbeat-B6M3DHWg.cjs");
require("./input-provenance-h9in5xc9.cjs");
require("./command-secret-gateway-bUpj2U36.cjs");
require("./heartbeat-filter-vwmv_UEH.cjs");
require("./agent-settings-CmUtgA2I.cjs");
require("./current-time-oRtkR6fH.cjs");
require("./session-store-runtime-r4TbOUjU.cjs");
require("./memory-search-CB0O7FbP.cjs");
require("./heartbeat-events-filter-trMK3LC9.cjs");
require("./progress-JkW4pQSo.cjs");
require("./memory-embedding-provider-runtime-PB1-qNoK.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _openclaw_fs_safe_config = require("@openclaw/fs-safe/config");
require("@openclaw/fs-safe/advanced");
require("@openclaw/fs-safe/root");
require("@openclaw/fs-safe/path");
require("@openclaw/fs-safe/walk");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
require("@gabrielvfonseca/media-core/mime");
//#region packages/memory-host-sdk/src/host/config-utils.ts
/** Root memory filename used in agent workspaces. */
const MEMORY_HOST_ROOT_FILENAME = "MEMORY.md";
const DEFAULT_AGENT_ID = "main";
const LEGACY_STATE_DIRNAMES = [".clawdbot"];
const NEW_STATE_DIRNAME = ".openclaw";
/** Treat shell-placeholder home values as absent. */
function normalizeHomeValue(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed || trimmed === "undefined" || trimmed === "null") return;
	return trimmed;
}
/** Resolve the underlying OS home before applying OpenClaw-specific overrides. */
function resolveRawOsHomeDir(env, homedir) {
	return normalizeHomeValue(env.HOME) ?? normalizeHomeValue(env.USERPROFILE) ?? normalizeHomeValue(homedir());
}
/** Resolve OPENCLAW_HOME or the OS home, falling back to cwd for hermetic tests. */
function resolveRequiredHomeDir(env = process.env, homedir = node_os.default.homedir) {
	const explicitHome = normalizeHomeValue(env.OPENCLAW_HOME);
	const rawHome = explicitHome ? explicitHome.replace(/^~(?=$|[\\/])/, resolveRawOsHomeDir(env, homedir) ?? "") : resolveRawOsHomeDir(env, homedir);
	return rawHome ? node_path.default.resolve(rawHome) : node_path.default.resolve(process.cwd());
}
/** Resolve standalone memory-host paths without importing core home-directory policy. */
function resolveMemoryHostUserPath(input, env = process.env, homedir = node_os.default.homedir) {
	const trimmed = input.trim();
	if (!trimmed) return trimmed;
	if (trimmed.startsWith("~")) return node_path.default.resolve(trimmed.replace(/^~(?=$|[\\/])/, resolveRequiredHomeDir(env, homedir)));
	return node_path.default.resolve(trimmed);
}
/** Return legacy state roots in priority order. */
function legacyStateDirs(homedir) {
	return LEGACY_STATE_DIRNAMES.map((dir) => node_path.default.join(homedir(), dir));
}
/** Resolve the current state root while preserving shipped legacy installs when present. */
function resolveStateDir(env = process.env, homedir = node_os.default.homedir) {
	const override = env.OPENCLAW_STATE_DIR?.trim();
	if (override) return resolveMemoryHostUserPath(override, env, homedir);
	const effectiveHome = () => resolveRequiredHomeDir(env, homedir);
	const nextDir = node_path.default.join(effectiveHome(), NEW_STATE_DIRNAME);
	if (env.OPENCLAW_TEST_FAST === "1" || node_fs.default.existsSync(nextDir)) return nextDir;
	return legacyStateDirs(effectiveHome).find((dir) => {
		try {
			return node_fs.default.existsSync(dir);
		} catch {
			return false;
		}
	}) ?? nextDir;
}
/** Resolve the default agent workspace, partitioned by OPENCLAW_PROFILE when set. */
function resolveDefaultAgentWorkspaceDir(env = process.env) {
	const home = resolveRequiredHomeDir(env, node_os.default.homedir);
	const profile = env.OPENCLAW_PROFILE?.trim();
	if (profile && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(profile) !== "default") return node_path.default.join(home, ".openclaw", `workspace-${profile}`);
	return node_path.default.join(home, ".openclaw", "workspace");
}
/** Return configured agent entries after dropping nullish placeholders. */
function listAgentEntries(cfg) {
	return Array.isArray(cfg.agents?.list) ? cfg.agents.list.filter((entry) => Boolean(entry)) : [];
}
/** Resolve the default agent id from explicit default marker or first agent entry. */
function resolveDefaultAgentId(cfg) {
	const agents = listAgentEntries(cfg);
	if (agents.length === 0) return DEFAULT_AGENT_ID;
	const chosen = (agents.find((agent) => agent.default) ?? agents[0])?.id;
	return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(chosen || DEFAULT_AGENT_ID);
}
/** Find one agent config by canonical id. */
function resolveAgentConfig(cfg, agentId) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	return listAgentEntries(cfg).find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === id);
}
/** Remove null bytes before paths are handed to filesystem APIs. */
function stripNullBytes(value) {
	return value.replaceAll("\0", "");
}
/** Resolve the workspace directory for an agent id and config defaults. */
function resolveMemoryHostAgentWorkspaceDir(cfg, agentId, env = process.env) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const configured = resolveAgentConfig(cfg, id)?.workspace?.trim();
	if (configured) return stripNullBytes(resolveMemoryHostUserPath(configured, env));
	const fallback = cfg.agents?.defaults?.workspace?.trim();
	if (id === resolveDefaultAgentId(cfg)) return stripNullBytes(fallback ? resolveMemoryHostUserPath(fallback, env) : resolveDefaultAgentWorkspaceDir(env));
	if (fallback) return stripNullBytes(node_path.default.join(resolveMemoryHostUserPath(fallback, env), id));
	return stripNullBytes(node_path.default.join(resolveStateDir(env), `workspace-${id}`));
}
//#endregion
//#region packages/memory-host-sdk/src/host/fs-utils.ts
if (!(process.env.FS_SAFE_PYTHON_MODE != null || process.env.OPERATOR_FS_SAFE_PYTHON_MODE != null)) (0, _openclaw_fs_safe_config.configureFsSafePython)({ mode: "off" });
//#endregion
Object.defineProperty(exports, "MEMORY_HOST_ROOT_FILENAME", {
	enumerable: true,
	get: function() {
		return MEMORY_HOST_ROOT_FILENAME;
	}
});
Object.defineProperty(exports, "resolveMemoryHostAgentWorkspaceDir", {
	enumerable: true,
	get: function() {
		return resolveMemoryHostAgentWorkspaceDir;
	}
});
Object.defineProperty(exports, "resolveMemoryHostUserPath", {
	enumerable: true,
	get: function() {
		return resolveMemoryHostUserPath;
	}
});
