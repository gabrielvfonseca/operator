require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_identity = require("./identity-Dv2mhJl0.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_agents_config = require("./agents.config-BC-3Ve88.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/assistant-identity.ts
const ASSISTANT_IDENTITY_LIMITS = {
	name: 50,
	emoji: 16
};
const DEFAULT_ASSISTANT_IDENTITY = {
	agentId: "main",
	name: "Assistant",
	avatar: "A"
};
function normalizeIdentityValue(field, value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	return trimmed ? (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, ASSISTANT_IDENTITY_LIMITS[field]) : void 0;
}
function isAvatarUrl(value) {
	return require_io.isAvatarHttpUrl(value) || require_io.isRenderableAvatarImageDataUrl(value);
}
function normalizeAvatarValue(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed || trimmed.length > require_io.AVATAR_MAX_DATA_URL_CHARS) return;
	if (isAvatarUrl(trimmed)) return trimmed;
	if (require_io.hasAvatarUriScheme(trimmed) && !require_io.isWindowsAbsolutePath(trimmed)) return;
	if (require_io.looksLikeAvatarPath(trimmed)) return trimmed;
	if (!/\s/.test(trimmed) && trimmed.length <= 4) return trimmed;
}
function normalizeEmojiValue(value) {
	if (!value) return;
	let hasNonAscii = false;
	for (let i = 0; i < value.length; i += 1) if (value.charCodeAt(i) > 127) {
		hasNonAscii = true;
		break;
	}
	if (!hasNonAscii) return;
	if (isAvatarUrl(value) || require_io.hasAvatarUriScheme(value) && !require_io.isWindowsAbsolutePath(value) || require_io.looksLikeAvatarPath(value)) return;
	return value;
}
/** Resolve the display name/avatar/emoji for an agent-facing assistant identity. */
function resolveAssistantIdentity(params) {
	const defaultAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId ?? defaultAgentId);
	const isDefaultAgent = agentId === defaultAgentId;
	const workspaceDir = params.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId);
	const configAssistant = params.cfg.ui?.assistant;
	const agentIdentity = require_identity.resolveAgentIdentity(params.cfg, agentId);
	const fileIdentity = workspaceDir ? require_agents_config.loadAgentIdentity(workspaceDir) : null;
	const uiName = normalizeIdentityValue("name", configAssistant?.name);
	const agentName = normalizeIdentityValue("name", agentIdentity?.name);
	const fileName = normalizeIdentityValue("name", fileIdentity?.name);
	const name = (isDefaultAgent ? uiName ?? agentName ?? fileName : agentName ?? fileName ?? uiName) ?? DEFAULT_ASSISTANT_IDENTITY.name;
	const uiAvatar = normalizeAvatarValue(configAssistant?.avatar);
	const agentAvatarCandidates = [
		normalizeAvatarValue(agentIdentity?.avatar),
		normalizeAvatarValue(agentIdentity?.emoji),
		normalizeAvatarValue(fileIdentity?.avatar),
		normalizeAvatarValue(fileIdentity?.emoji)
	];
	return {
		agentId,
		name,
		avatar: (isDefaultAgent ? [uiAvatar, ...agentAvatarCandidates] : [...agentAvatarCandidates, uiAvatar]).find(Boolean) ?? DEFAULT_ASSISTANT_IDENTITY.avatar,
		emoji: [
			normalizeIdentityValue("emoji", agentIdentity?.emoji),
			normalizeIdentityValue("emoji", fileIdentity?.emoji),
			normalizeIdentityValue("emoji", agentIdentity?.avatar),
			normalizeIdentityValue("emoji", fileIdentity?.avatar)
		].map((candidate) => normalizeEmojiValue(candidate)).find(Boolean)
	};
}
//#endregion
Object.defineProperty(exports, "DEFAULT_ASSISTANT_IDENTITY", {
	enumerable: true,
	get: function() {
		return DEFAULT_ASSISTANT_IDENTITY;
	}
});
Object.defineProperty(exports, "resolveAssistantIdentity", {
	enumerable: true,
	get: function() {
		return resolveAssistantIdentity;
	}
});
