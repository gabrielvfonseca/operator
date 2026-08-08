const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_identity = require("./identity-Dv2mhJl0.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_identity_avatar_file = require("./identity-avatar-file-Cw3zle5k.cjs");
const require_identity_file = require("./identity-file-BqNnk9aW.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/identity-avatar.ts
/**
* Resolves public avatar sources for configured agent identities.
*/
const PUBLIC_AVATAR_SOURCE_MAX_CHARS = 256;
const PUBLIC_DATA_AVATAR_HEADER_MAX_CHARS = 64;
function resolveAvatarSource(cfg, agentId, opts) {
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const defaultAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
	const fromUiConfig = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cfg.ui?.assistant?.avatar) ?? null;
	if (opts?.includeUiOverride) {
		if (normalizedAgentId === defaultAgentId && fromUiConfig) return fromUiConfig;
	}
	const fromConfig = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_identity.resolveAgentIdentity(cfg, normalizedAgentId)?.avatar) ?? null;
	if (fromConfig) return fromConfig;
	const fromIdentity = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_identity_file.loadAgentIdentityFromWorkspace(require_agent_scope_config.resolveAgentWorkspaceDir(cfg, normalizedAgentId))?.avatar) ?? null;
	if (fromIdentity) return fromIdentity;
	return opts?.includeUiOverride ? fromUiConfig : null;
}
function isSafeRelativeAvatarSource(source) {
	if (source.length > PUBLIC_AVATAR_SOURCE_MAX_CHARS || source.startsWith("~") || node_path.default.isAbsolute(source) || require_io.isWindowsAbsolutePath(source) || require_io.hasAvatarUriScheme(source) && !require_io.isWindowsAbsolutePath(source) || source.includes("\0")) return false;
	return source.replace(/\\/g, "/").split("/").every((part) => part !== "..");
}
/** Return a safe public description of the configured avatar source. */
function resolvePublicAgentAvatarSource(resolved) {
	const source = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolved.source) ?? null;
	if (!source) return;
	if (require_io.isAvatarDataUrl(source)) {
		const commaIndex = source.indexOf(",");
		return `${commaIndex > 0 ? source.slice(0, Math.min(commaIndex, PUBLIC_DATA_AVATAR_HEADER_MAX_CHARS)) : source.slice(0, PUBLIC_DATA_AVATAR_HEADER_MAX_CHARS)},...`;
	}
	if (require_io.isAvatarHttpUrl(source)) return "remote URL";
	return isSafeRelativeAvatarSource(source) ? source : void 0;
}
/** Resolve the effective avatar for an agent, including config and IDENTITY.md. */
function resolveAgentAvatar(cfg, agentId, opts) {
	const source = resolveAvatarSource(cfg, agentId, opts);
	if (!source) return {
		kind: "none",
		reason: "missing"
	};
	if (require_io.isAvatarHttpUrl(source)) return {
		kind: "remote",
		url: source,
		source
	};
	if (require_io.isAvatarDataUrl(source)) return {
		kind: "data",
		url: source,
		source
	};
	const resolved = require_identity_avatar_file.resolveLocalAgentAvatarPath({
		raw: source,
		workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId)
	});
	if (!resolved.ok) return {
		kind: "none",
		reason: resolved.reason,
		source
	};
	return {
		kind: "local",
		filePath: resolved.value.filePath,
		source
	};
}
//#endregion
Object.defineProperty(exports, "resolveAgentAvatar", {
	enumerable: true,
	get: function() {
		return resolveAgentAvatar;
	}
});
Object.defineProperty(exports, "resolvePublicAgentAvatarSource", {
	enumerable: true,
	get: function() {
		return resolvePublicAgentAvatarSource;
	}
});
