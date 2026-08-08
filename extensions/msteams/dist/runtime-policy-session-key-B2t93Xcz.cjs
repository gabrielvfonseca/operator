const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/auto-reply/reply/runtime-policy-session-key.ts
/** Resolves runtime policy session keys distinct from transcript session keys. */
function resolvePolicyChannel(ctx) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx?.OriginatingChannel ?? ctx?.Provider ?? ctx?.Surface);
	if (!raw) return;
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	return channel && channel !== "webchat" ? channel : void 0;
}
function resolvePolicyDirectPeerId(ctx) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx?.NativeDirectUserId ?? ctx?.SenderId ?? ctx?.SenderE164 ?? ctx?.SenderUsername ?? ctx?.OriginatingTo ?? ctx?.From ?? ctx?.To);
}
function isMainSessionAlias(params) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.sessionKey);
	if (!raw) return false;
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	const mainKey = require_session_key.normalizeMainKey(params.cfg?.session?.mainKey);
	const agentMainSessionKey = require_session_key.buildAgentMainSessionKey({
		agentId,
		mainKey
	});
	const agentMainAliasKey = require_session_key.buildAgentMainSessionKey({
		agentId,
		mainKey: "main"
	});
	return raw === "main" || raw === mainKey || raw === agentMainSessionKey || raw === agentMainAliasKey || raw === require_session_key.buildAgentMainSessionKey({
		agentId: "main",
		mainKey
	}) || raw === require_session_key.buildAgentMainSessionKey({
		agentId: "main",
		mainKey: "main"
	}) || params.cfg?.session?.scope === "global" && raw === "global";
}
/** Resolves the session key used for runtime policy checks and direct-message scoping. */
/** Resolves the session key used for sandbox/tool/runtime policy lookups. */
function resolveRuntimePolicySessionKey(params) {
	const explicitPolicySessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ctx?.RuntimePolicySessionKey);
	if (explicitPolicySessionKey) return explicitPolicySessionKey;
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey ?? params.ctx?.CommandTargetSessionKey ?? params.ctx?.SessionKey);
	if (!sessionKey) return;
	const agentId = require_session_key.resolveAgentIdFromSessionKey(sessionKey);
	if (!isMainSessionAlias({
		cfg: params.cfg,
		agentId,
		sessionKey
	})) return sessionKey;
	if (require_chat_type.normalizeChatType(params.ctx?.ChatType) !== "direct") return sessionKey;
	const channel = resolvePolicyChannel(params.ctx);
	const peerId = resolvePolicyDirectPeerId(params.ctx);
	if (!channel || !peerId) return sessionKey;
	return require_session_key.buildAgentPeerSessionKey({
		agentId,
		channel,
		accountId: params.ctx?.AccountId,
		peerKind: "direct",
		peerId,
		dmScope: "per-account-channel-peer",
		identityLinks: params.cfg?.session?.identityLinks
	});
}
//#endregion
Object.defineProperty(exports, "resolveRuntimePolicySessionKey", {
	enumerable: true,
	get: function() {
		return resolveRuntimePolicySessionKey;
	}
});
