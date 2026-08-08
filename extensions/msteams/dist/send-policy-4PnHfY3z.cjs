const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_bootstrap_registry = require("./bootstrap-registry-C2aRGF1a.cjs");
const require_session_chat_type_shared = require("./session-chat-type-shared-ayqPRiTg.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/sessions/session-chat-type.ts
function resolveScopedSessionKey(sessionKey) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionKey);
	if (!raw) return "";
	return require_session_key.parseAgentSessionKey(raw)?.rest ?? raw;
}
function collectLegacyChatTypeCandidatePluginIds(scopedSessionKey) {
	const ids = /* @__PURE__ */ new Set();
	const firstToken = scopedSessionKey.split(":").find(Boolean);
	if (firstToken) ids.add(firstToken);
	if (scopedSessionKey.includes("@g.us")) ids.add("whatsapp");
	return Array.from(ids);
}
function derivePluginLegacySessionChatType(scopedSessionKey, deriveLegacySessionChatType) {
	if (!deriveLegacySessionChatType) return;
	return deriveLegacySessionChatType(scopedSessionKey);
}
function deriveSessionChatType(sessionKey) {
	const builtInType = require_session_chat_type_shared.deriveSessionChatTypeFromKey(sessionKey);
	if (builtInType !== "unknown") return builtInType;
	const scopedSessionKey = resolveScopedSessionKey(sessionKey);
	for (const pluginId of collectLegacyChatTypeCandidatePluginIds(scopedSessionKey)) {
		const derived = derivePluginLegacySessionChatType(scopedSessionKey, require_bootstrap_registry.getBootstrapChannelPlugin(pluginId)?.messaging?.deriveLegacySessionChatType);
		if (derived) return derived;
	}
	return "unknown";
}
//#endregion
//#region src/sessions/send-policy.ts
/** Normalizes raw send-policy text into a decision. */
function normalizeSendPolicy(raw) {
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (value === "allow") return "allow";
	if (value === "deny") return "deny";
}
function normalizeMatchValue(raw) {
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	return value ? value : void 0;
}
function stripAgentSessionKeyPrefix(key) {
	if (!key) return;
	const parts = key.split(":");
	if (parts[0] === "agent") {
		if (parts.length < 3 || !parts[1] || !parts[2]) return;
		return parts.slice(2).join(":");
	}
	return key;
}
function deriveChannelFromKey(key) {
	const normalizedKey = stripAgentSessionKeyPrefix(key);
	if (!normalizedKey) return;
	return normalizeMatchValue(require_session_chat_type_shared.parseCanonicalSessionPeerShape(normalizedKey)?.channel);
}
function deriveChatTypeFromKey(key) {
	const normalizedKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(stripAgentSessionKeyPrefix(key));
	if (!normalizedKey || normalizedKey.startsWith("agent:")) return;
	const derived = deriveSessionChatType(normalizedKey);
	if (derived !== "unknown") return derived;
}
function hasAmbiguousPeerShape(key) {
	const normalizedKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(stripAgentSessionKeyPrefix(key));
	return normalizedKey ? require_session_chat_type_shared.hasAmbiguousCanonicalSessionPeerShape(normalizedKey) : false;
}
/** Resolves whether a session send is allowed by entry override and config rules. */
function resolveSendPolicy(params) {
	const override = normalizeSendPolicy(params.entry?.sendPolicy);
	if (override) return override;
	const policy = params.cfg.session?.sendPolicy;
	if (!policy) return "allow";
	if (hasAmbiguousPeerShape(params.sessionKey)) return "deny";
	const rawSessionKey = params.sessionKey ?? "";
	const strippedSessionKey = stripAgentSessionKeyPrefix(rawSessionKey) ?? "";
	const rawSessionKeyNorm = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rawSessionKey);
	const strippedSessionKeyNorm = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(strippedSessionKey);
	let channel;
	let chatType;
	const getChannel = () => {
		channel ??= normalizeMatchValue(params.channel) ?? normalizeMatchValue(params.entry?.channel) ?? normalizeMatchValue(params.entry?.lastChannel) ?? deriveChannelFromKey(params.sessionKey);
		return channel;
	};
	const getChatType = () => {
		chatType ??= require_chat_type.normalizeChatType(params.chatType ?? params.entry?.chatType) ?? require_chat_type.normalizeChatType(deriveChatTypeFromKey(params.sessionKey));
		return chatType;
	};
	let allowedMatch = false;
	for (const rule of policy.rules ?? []) {
		if (!rule) continue;
		const action = normalizeSendPolicy(rule.action) ?? "allow";
		const match = rule.match ?? {};
		const matchChannel = normalizeMatchValue(match.channel);
		const matchChatType = require_chat_type.normalizeChatType(match.chatType);
		const matchPrefix = normalizeMatchValue(match.keyPrefix);
		const matchRawPrefix = normalizeMatchValue(match.rawKeyPrefix);
		if (matchChannel && matchChannel !== getChannel()) continue;
		if (matchChatType && matchChatType !== getChatType()) continue;
		if (matchRawPrefix && !rawSessionKeyNorm.startsWith(matchRawPrefix)) continue;
		if (matchPrefix && !rawSessionKeyNorm.startsWith(matchPrefix) && !strippedSessionKeyNorm.startsWith(matchPrefix)) continue;
		if (action === "deny") return "deny";
		allowedMatch = true;
	}
	if (allowedMatch) return "allow";
	return normalizeSendPolicy(policy.default) ?? "allow";
}
//#endregion
Object.defineProperty(exports, "normalizeSendPolicy", {
	enumerable: true,
	get: function() {
		return normalizeSendPolicy;
	}
});
Object.defineProperty(exports, "resolveSendPolicy", {
	enumerable: true,
	get: function() {
		return resolveSendPolicy;
	}
});
