const require_utils = require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/config/sessions/explicit-session-key-normalization.ts
function resolveExplicitSessionKeyNormalizerCandidates(sessionKey, ctx) {
	const normalizedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.Provider);
	const normalizedSurface = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.Surface);
	const normalizedFrom = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(ctx.From);
	const candidates = /* @__PURE__ */ new Set();
	const maybeAdd = (value) => {
		const normalized = require_message_channel.normalizeMessageChannel(value);
		if (normalized) candidates.add(normalized);
	};
	maybeAdd(normalizedSurface);
	maybeAdd(normalizedProvider);
	maybeAdd(normalizedFrom.split(":", 1)[0]);
	for (const plugin of require_registry.listChannelPlugins()) {
		const pluginId = require_message_channel.normalizeMessageChannel(plugin.id);
		if (!pluginId) continue;
		if (sessionKey.startsWith(`${pluginId}:`) || sessionKey.includes(`:${pluginId}:`)) candidates.add(pluginId);
	}
	return [...candidates];
}
/** Normalizes caller-supplied session keys through the matching channel plugin when available. */
function normalizeExplicitSessionKey(sessionKey, ctx) {
	const normalized = require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(sessionKey);
	for (const channelId of resolveExplicitSessionKeyNormalizerCandidates(normalized, ctx)) {
		const normalize = require_registry.getLoadedChannelPlugin(channelId)?.messaging?.normalizeExplicitSessionKey;
		const next = normalize?.({
			sessionKey: normalized,
			ctx
		});
		if (typeof next === "string" && next.trim()) return require_session_key.normalizeSessionKeyPreservingOpaquePeerIds(next);
	}
	return normalized;
}
//#endregion
//#region src/config/sessions/session-key.ts
/**
* Derives the raw session bucket from message context before agent/main-key normalization.
*
* Direct chats use sender identity, groups use channel-owned group keys, and global scope bypasses
* sender routing entirely.
*/
function deriveSessionKey(scope, ctx) {
	if (scope === "global") return "global";
	const resolvedGroup = require_session_accessor.resolveGroupSessionKey(ctx);
	if (resolvedGroup) return resolvedGroup.key;
	return (ctx.From ? require_utils.normalizeE164(ctx.From) : "") || "unknown";
}
/**
* Resolves the persisted session-store key for an inbound message.
*
* Explicit session keys pass through the compatibility normalizer, direct chats collapse to the
* agent's canonical main bucket, and group/channel sessions stay isolated under the same agent.
*/
function resolveSessionKey(scope, ctx, mainKey, agentId = require_session_key.DEFAULT_AGENT_ID) {
	const explicit = ctx.SessionKey?.trim();
	if (explicit) return normalizeExplicitSessionKey(explicit, ctx);
	const raw = deriveSessionKey(scope, ctx);
	if (scope === "global") return raw;
	const canonicalAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const canonical = require_session_key.buildAgentMainSessionKey({
		agentId: canonicalAgentId,
		mainKey: require_session_key.normalizeMainKey(mainKey)
	});
	if (!(raw.includes(":group:") || raw.includes(":channel:"))) return canonical;
	return `agent:${canonicalAgentId}:${raw}`;
}
//#endregion
Object.defineProperty(exports, "normalizeExplicitSessionKey", {
	enumerable: true,
	get: function() {
		return normalizeExplicitSessionKey;
	}
});
Object.defineProperty(exports, "resolveSessionKey", {
	enumerable: true,
	get: function() {
		return resolveSessionKey;
	}
});
