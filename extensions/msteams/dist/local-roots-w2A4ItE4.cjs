const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_sandbox_tool_policy = require("./sandbox-tool-policy-DDU5nVeg.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
require("./local-file-access-r6xSCXfB.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_media_source_url = require("@gabrielvfonseca/media-core/media-source-url");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/agents/tool-fs-policy.ts
function createToolFsPolicy(params) {
	return { workspaceOnly: params.workspaceOnly === true };
}
function resolveToolFsConfig(params) {
	const cfg = params.cfg;
	const globalFs = cfg?.tools?.fs;
	return { workspaceOnly: (cfg && params.agentId ? require_agent_scope_config.resolveAgentConfig(cfg, params.agentId)?.tools?.fs : void 0)?.workspaceOnly ?? globalFs?.workspaceOnly };
}
function resolveEffectiveToolFsWorkspaceOnly(params) {
	return resolveToolFsConfig(params).workspaceOnly === true;
}
function resolveEffectiveToolFsRootExpansionAllowed(params) {
	const cfg = params.cfg;
	if (!cfg) return true;
	const agentTools = params.agentId ? require_agent_scope_config.resolveAgentConfig(cfg, params.agentId)?.tools : void 0;
	const globalTools = cfg.tools;
	const profile = agentTools?.profile ?? globalTools?.profile;
	const profileAlsoAllow = new Set(agentTools?.alsoAllow ?? globalTools?.alsoAllow ?? []);
	if (resolveToolFsConfig(params).workspaceOnly === true) return false;
	return require_tool_policy_match.isToolAllowedByPolicies("read", [
		require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(profile), profileAlsoAllow.size > 0 ? Array.from(profileAlsoAllow) : void 0),
		require_sandbox_tool_policy.pickSandboxToolPolicy(globalTools),
		require_sandbox_tool_policy.pickSandboxToolPolicy(agentTools)
	]);
}
//#endregion
//#region src/media/local-media-path.ts
const DATA_URL_RE = /^data:/i;
const WINDOWS_DRIVE_RE = /^[A-Za-z]:[\\/]/;
/** Resolves a media source to a local path when it is not a remote or data URL. */
function resolveLocalMediaPath(source) {
	const trimmed = source.trim();
	if (!trimmed || (0, _gabrielvfonseca_media_core_media_source_url.isPassThroughRemoteMediaSource)(trimmed) || DATA_URL_RE.test(trimmed)) return;
	if (trimmed.startsWith("file://")) try {
		return (0, _openclaw_fs_safe_advanced.safeFileURLToPath)(trimmed);
	} catch {
		return;
	}
	if (trimmed.startsWith("~")) return require_home_dir.resolveUserPath(trimmed);
	if (node_path.default.isAbsolute(trimmed) || WINDOWS_DRIVE_RE.test(trimmed)) return node_path.default.resolve(trimmed);
}
//#endregion
//#region src/media/local-roots.ts
let cachedPreferredTmpDir;
function resolveCachedPreferredTmpDir() {
	if (!cachedPreferredTmpDir) cachedPreferredTmpDir = require_tmp_operator_dir.resolvePreferredOperatorTmpDir();
	return cachedPreferredTmpDir;
}
/** Builds the baseline local media root allowlist from state/config directories. */
function buildMediaLocalRoots(stateDir, configDir, options = {}) {
	const resolvedStateDir = node_path.default.resolve(stateDir);
	const resolvedConfigDir = node_path.default.resolve(configDir);
	const preferredTmpDir = options.preferredTmpDir ?? resolveCachedPreferredTmpDir();
	return Array.from(/* @__PURE__ */ new Set([
		preferredTmpDir,
		node_path.default.join(resolvedConfigDir, "media"),
		node_path.default.join(resolvedStateDir, "media"),
		require_paths.resolveDeliveryQueueMediaDir(resolvedStateDir),
		node_path.default.join(resolvedStateDir, "canvas"),
		node_path.default.join(resolvedStateDir, "workspace"),
		node_path.default.join(resolvedStateDir, "sandboxes")
	]));
}
/** Returns the process default roots where local media reads may resolve generated/cache files. */
function getDefaultMediaLocalRoots() {
	return buildMediaLocalRoots(require_paths.resolveStateDir(), require_utils.resolveConfigDir());
}
/** Adds the active agent workspace to the default media roots without exposing all agent state. */
function getAgentScopedMediaLocalRoots(cfg, agentId) {
	const roots = buildMediaLocalRoots(require_paths.resolveStateDir(), require_utils.resolveConfigDir());
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentId);
	if (!normalizedAgentId) return roots;
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, normalizedAgentId);
	if (!workspaceDir) return roots;
	const normalizedWorkspaceDir = node_path.default.resolve(workspaceDir);
	if (!roots.includes(normalizedWorkspaceDir)) roots.push(normalizedWorkspaceDir);
	return roots;
}
/** Adds only concrete local source parent directories to an existing root allowlist. */
function appendLocalMediaParentRoots(roots, mediaSources) {
	const appended = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(roots.map((root) => node_path.default.resolve(root)));
	for (const source of mediaSources ?? []) {
		const localPath = resolveLocalMediaPath(source);
		if (!localPath) continue;
		const parentDir = node_path.default.dirname(localPath);
		if (parentDir === node_path.default.parse(parentDir).root) continue;
		const normalizedParent = node_path.default.resolve(parentDir);
		if (!appended.includes(normalizedParent)) appended.push(normalizedParent);
	}
	return appended;
}
/** Resolves outbound media roots, expanding for local sources only when filesystem policy allows it. */
function getAgentScopedMediaLocalRootsForSources(params) {
	const roots = getAgentScopedMediaLocalRoots(params.cfg, params.agentId);
	if (resolveEffectiveToolFsWorkspaceOnly({
		cfg: params.cfg,
		agentId: params.agentId
	})) return roots;
	if (!resolveEffectiveToolFsRootExpansionAllowed({
		cfg: params.cfg,
		agentId: params.agentId
	})) return roots;
	return appendLocalMediaParentRoots(roots, params.mediaSources);
}
//#endregion
Object.defineProperty(exports, "appendLocalMediaParentRoots", {
	enumerable: true,
	get: function() {
		return appendLocalMediaParentRoots;
	}
});
Object.defineProperty(exports, "createToolFsPolicy", {
	enumerable: true,
	get: function() {
		return createToolFsPolicy;
	}
});
Object.defineProperty(exports, "getAgentScopedMediaLocalRoots", {
	enumerable: true,
	get: function() {
		return getAgentScopedMediaLocalRoots;
	}
});
Object.defineProperty(exports, "getAgentScopedMediaLocalRootsForSources", {
	enumerable: true,
	get: function() {
		return getAgentScopedMediaLocalRootsForSources;
	}
});
Object.defineProperty(exports, "getDefaultMediaLocalRoots", {
	enumerable: true,
	get: function() {
		return getDefaultMediaLocalRoots;
	}
});
Object.defineProperty(exports, "resolveEffectiveToolFsRootExpansionAllowed", {
	enumerable: true,
	get: function() {
		return resolveEffectiveToolFsRootExpansionAllowed;
	}
});
Object.defineProperty(exports, "resolveEffectiveToolFsWorkspaceOnly", {
	enumerable: true,
	get: function() {
		return resolveEffectiveToolFsWorkspaceOnly;
	}
});
Object.defineProperty(exports, "resolveLocalMediaPath", {
	enumerable: true,
	get: function() {
		return resolveLocalMediaPath;
	}
});
Object.defineProperty(exports, "resolveToolFsConfig", {
	enumerable: true,
	get: function() {
		return resolveToolFsConfig;
	}
});
