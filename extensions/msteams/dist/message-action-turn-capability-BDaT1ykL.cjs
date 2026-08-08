require("./session-key-BQFkCTNx.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/message-action-turn-capability.ts
const DEFAULT_TTL_MS = 15 * 6e4;
const MAX_TTL_MS = 1440 * 6e4;
const MAX_ACTIVE_CAPABILITIES = 4096;
const RUN_LIFETIME_EXPIRES_AT_MS = Number.MAX_SAFE_INTEGER;
const CAPABILITY_COMPLETION_GRACE_MS = 6e4;
const capabilitiesByToken = /* @__PURE__ */ new Map();
function isTrustedMessageActionTurnIngress(provider) {
	const normalized = require_message_channel.normalizeMessageChannel(provider);
	return normalized !== void 0 && require_message_channel.isDeliverableMessageChannel(normalized);
}
function resolveTtlMs(value) {
	if (!Number.isFinite(value) || value === void 0 || value <= 0) return DEFAULT_TTL_MS;
	return Math.min(Math.trunc(value), MAX_TTL_MS);
}
/** Mirrors agent timeout semantics while leaving unlimited runs to explicit revocation. */
function resolveMessageActionTurnCapabilityLifetime(timeoutMs) {
	return Number.isFinite(timeoutMs) && timeoutMs > 0 ? { ttlMs: timeoutMs + CAPABILITY_COMPLETION_GRACE_MS } : { expiresWithRun: true };
}
function copyToolContext(context) {
	if (!context) return;
	return {
		currentChannelId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(context.currentChannelId),
		currentChatType: context.currentChatType,
		currentMessagingTarget: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(context.currentMessagingTarget),
		currentGraphChannelId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(context.currentGraphChannelId),
		currentChannelProvider: context.currentChannelProvider,
		currentThreadTs: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(context.currentThreadTs),
		currentMessageId: context.currentMessageId,
		currentSourceTurnId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(context.currentSourceTurnId),
		replyToMode: context.replyToMode,
		hasRepliedRef: context.hasRepliedRef,
		sameChannelThreadRequired: context.sameChannelThreadRequired,
		skipCrossContextDecoration: context.skipCrossContextDecoration
	};
}
function evictOldestCapability() {
	const oldest = capabilitiesByToken.keys().next().value;
	if (typeof oldest === "string") capabilitiesByToken.delete(oldest);
}
function sweepExpiredMessageActionTurnCapabilities(nowMs = Date.now()) {
	let removed = 0;
	for (const [token, capability] of capabilitiesByToken) if (nowMs >= capability.expiresAtMs) {
		capabilitiesByToken.delete(token);
		removed += 1;
	}
	return removed;
}
/**
* Mint an opaque current-turn capability from trusted channel ingress.
* Public Gateway agent requests never receive this token.
*/
function mintMessageActionTurnCapability(params) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	const runId = params.runId.trim();
	const sessionKey = params.sessionKey.trim();
	if (!agentId || !runId || !sessionKey) throw new Error("message action turn capability requires agent, run, and session identity");
	const nowMs = params.nowMs ?? Date.now();
	sweepExpiredMessageActionTurnCapabilities(nowMs);
	while (capabilitiesByToken.size >= MAX_ACTIVE_CAPABILITIES) evictOldestCapability();
	const token = (0, node_crypto.randomBytes)(32).toString("base64url");
	capabilitiesByToken.set(token, {
		agentId,
		runId,
		sessionKey,
		expiresAtMs: params.expiresWithRun ? RUN_LIFETIME_EXPIRES_AT_MS : nowMs + resolveTtlMs(params.ttlMs),
		sessionId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionId),
		requesterAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterAccountId),
		requesterSenderId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requesterSenderId),
		toolContext: copyToolContext(params.toolContext)
	});
	return token;
}
function resolveMessageActionTurnCapability(params) {
	const token = params.token?.trim();
	if (!token) return;
	const capability = capabilitiesByToken.get(token);
	if (!capability) return;
	if ((params.nowMs ?? Date.now()) >= capability.expiresAtMs) {
		capabilitiesByToken.delete(token);
		return;
	}
	if (capability.agentId !== (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) || capability.runId !== params.runId?.trim() || capability.sessionKey !== params.sessionKey.trim() || capability.sessionId && capability.sessionId !== (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionId)) return;
	return {
		expiresAtMs: capability.expiresAtMs,
		sessionId: capability.sessionId,
		requesterAccountId: capability.requesterAccountId,
		requesterSenderId: capability.requesterSenderId,
		toolContext: copyToolContext(capability.toolContext)
	};
}
function revokeMessageActionTurnCapability(token) {
	return token ? capabilitiesByToken.delete(token) : false;
}
//#endregion
Object.defineProperty(exports, "isTrustedMessageActionTurnIngress", {
	enumerable: true,
	get: function() {
		return isTrustedMessageActionTurnIngress;
	}
});
Object.defineProperty(exports, "mintMessageActionTurnCapability", {
	enumerable: true,
	get: function() {
		return mintMessageActionTurnCapability;
	}
});
Object.defineProperty(exports, "resolveMessageActionTurnCapability", {
	enumerable: true,
	get: function() {
		return resolveMessageActionTurnCapability;
	}
});
Object.defineProperty(exports, "resolveMessageActionTurnCapabilityLifetime", {
	enumerable: true,
	get: function() {
		return resolveMessageActionTurnCapabilityLifetime;
	}
});
Object.defineProperty(exports, "revokeMessageActionTurnCapability", {
	enumerable: true,
	get: function() {
		return revokeMessageActionTurnCapability;
	}
});
