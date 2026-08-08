const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
const require_local_roots = require("./local-roots-w2A4ItE4.cjs");
const require_path_policy = require("./path-policy-CP90OpIp.cjs");
const require_workspace_dir = require("./workspace-dir-b3xUIeYD.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_media_core_constants = require("@gabrielvfonseca/media-core/constants");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
//#region src/media/configured-max-bytes.ts
const MB = 1024 * 1024;
/** Resolves the global generated-media byte cap from the user-facing MB config value. */
function resolveConfiguredMediaMaxBytes(cfg) {
	const configured = cfg?.agents?.defaults?.mediaMaxMb;
	if (typeof configured === "number" && Number.isFinite(configured) && configured > 0) return Math.floor(configured * MB);
}
/** Returns the configured media cap, falling back to the media-core per-kind default. */
function resolveGeneratedMediaMaxBytes(cfg, kind) {
	return resolveConfiguredMediaMaxBytes(cfg) ?? (0, _gabrielvfonseca_media_core_constants.maxBytesForKind)(kind);
}
/** Reads channel/account media caps from raw channel config without requiring typed account schemas. */
function resolveChannelAccountMediaMaxMb(params) {
	const channelId = params.channel?.trim();
	const accountId = params.accountId?.trim();
	const channelCfg = channelId ? params.cfg.channels?.[channelId] : void 0;
	const channelObj = channelCfg && typeof channelCfg === "object" ? channelCfg : void 0;
	const channelMediaMax = typeof channelObj?.mediaMaxMb === "number" ? channelObj.mediaMaxMb : void 0;
	const accountsObj = channelObj?.accounts && typeof channelObj.accounts === "object" ? channelObj.accounts : void 0;
	const accountCfg = accountId && accountsObj ? accountsObj[accountId] : void 0;
	const accountMediaMax = accountCfg && typeof accountCfg === "object" ? accountCfg.mediaMaxMb : void 0;
	return (typeof accountMediaMax === "number" ? accountMediaMax : void 0) ?? channelMediaMax;
}
/** Resolves the byte cap for staging an outbound reply's media: channel/account, then agent default. */
function resolveOutboundMediaMaxBytes(params) {
	const limitMb = resolveChannelAccountMediaMaxMb(params) ?? params.cfg.agents?.defaults?.mediaMaxMb;
	return typeof limitMb === "number" && Number.isFinite(limitMb) && limitMb > 0 ? Math.floor(limitMb * MB) : require_store.MEDIA_MAX_BYTES;
}
//#endregion
//#region src/media/read-capability.ts
function isAgentScopedHostMediaReadAllowed(params) {
	if (!require_local_roots.resolveEffectiveToolFsRootExpansionAllowed({
		cfg: params.cfg,
		agentId: params.agentId
	})) return false;
	const groupPolicy = require_agent_tools_policy.resolveGroupToolPolicy({
		config: params.cfg,
		sessionKey: params.sessionKey,
		messageProvider: params.messageProvider,
		groupId: params.groupId,
		groupChannel: params.groupChannel,
		groupSpace: params.groupSpace,
		accountId: params.accountId,
		senderId: params.requesterSenderId,
		senderName: params.requesterSenderName,
		senderUsername: params.requesterSenderUsername,
		senderE164: params.requesterSenderE164
	});
	if (groupPolicy && !require_tool_policy_match.isToolAllowedByPolicies("read", [groupPolicy])) return false;
	return true;
}
/** Creates a host reader bound to the agent workspace and configured local-file safety checks. */
function createAgentScopedHostMediaReadFile(params) {
	if (!isAgentScopedHostMediaReadAllowed(params)) return;
	const workspaceRoot = require_workspace_dir.resolveWorkspaceRoot(params.workspaceDir ?? (params.agentId ? require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, params.agentId) : void 0));
	return async (filePath) => {
		return (await (0, _openclaw_fs_safe_root.readLocalFileSafely)({ filePath: require_path_policy.resolvePathFromInput(filePath, workspaceRoot) })).buffer;
	};
}
function appendWorkspaceDirToLocalRoots(roots, workspaceDir) {
	if (!workspaceDir) return roots;
	const resolvedWorkspaceDir = node_path.default.resolve(workspaceDir);
	if (!roots?.length) return [resolvedWorkspaceDir];
	if (roots.some((root) => node_path.default.resolve(root) === resolvedWorkspaceDir)) return roots;
	return [...roots, resolvedWorkspaceDir];
}
/** Resolves roots and optional host read capability for outbound media in an agent context. */
function resolveAgentScopedOutboundMediaAccess(params) {
	const resolvedWorkspaceDir = params.workspaceDir ?? params.mediaAccess?.workspaceDir ?? (params.agentId ? require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, params.agentId) : void 0);
	const hostMediaReadAllowed = isAgentScopedHostMediaReadAllowed(params);
	const localRoots = appendWorkspaceDirToLocalRoots(params.mediaAccess?.localRoots ?? (hostMediaReadAllowed ? require_local_roots.getAgentScopedMediaLocalRootsForSources({
		cfg: params.cfg,
		agentId: params.agentId,
		mediaSources: params.mediaSources
	}) : require_local_roots.getAgentScopedMediaLocalRoots(params.cfg, params.agentId)), resolvedWorkspaceDir);
	const readFile = params.mediaAccess?.readFile ?? params.mediaReadFile ?? (hostMediaReadAllowed ? createAgentScopedHostMediaReadFile({
		cfg: params.cfg,
		agentId: params.agentId,
		workspaceDir: resolvedWorkspaceDir,
		sessionKey: params.sessionKey,
		messageProvider: params.messageProvider,
		groupId: params.groupId,
		groupChannel: params.groupChannel,
		groupSpace: params.groupSpace,
		accountId: params.accountId,
		requesterSenderId: params.requesterSenderId,
		requesterSenderName: params.requesterSenderName,
		requesterSenderUsername: params.requesterSenderUsername,
		requesterSenderE164: params.requesterSenderE164
	}) : void 0);
	return {
		...localRoots?.length ? { localRoots } : {},
		...readFile ? { readFile } : {},
		...resolvedWorkspaceDir ? { workspaceDir: resolvedWorkspaceDir } : {}
	};
}
//#endregion
Object.defineProperty(exports, "resolveAgentScopedOutboundMediaAccess", {
	enumerable: true,
	get: function() {
		return resolveAgentScopedOutboundMediaAccess;
	}
});
Object.defineProperty(exports, "resolveChannelAccountMediaMaxMb", {
	enumerable: true,
	get: function() {
		return resolveChannelAccountMediaMaxMb;
	}
});
Object.defineProperty(exports, "resolveConfiguredMediaMaxBytes", {
	enumerable: true,
	get: function() {
		return resolveConfiguredMediaMaxBytes;
	}
});
Object.defineProperty(exports, "resolveGeneratedMediaMaxBytes", {
	enumerable: true,
	get: function() {
		return resolveGeneratedMediaMaxBytes;
	}
});
Object.defineProperty(exports, "resolveOutboundMediaMaxBytes", {
	enumerable: true,
	get: function() {
		return resolveOutboundMediaMaxBytes;
	}
});
