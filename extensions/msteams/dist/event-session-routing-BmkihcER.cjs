const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_dm_policy_shared = require("./dm-policy-shared-Cznamk_3.cjs");
const require_resolve_route = require("./resolve-route-DQGFdHA5.cjs");
const require_session_chat_type_shared = require("./session-chat-type-shared-ayqPRiTg.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/infra/event-session-routing.ts
function readAllowFrom(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const allowFrom = value.allowFrom;
	return Array.isArray(allowFrom) ? allowFrom : void 0;
}
function readDmAllowFrom(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	return readAllowFrom(value.dm);
}
function readAccountConfig(value) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.config) ? value.config : void 0;
}
function firstConfiguredAllowFrom(...candidates) {
	return candidates.find((candidate) => candidate !== void 0);
}
function normalizeEntry(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value) || void 0;
}
/** Parse an agent direct-session key into channel/account/peer routing parts. */
function parseDirectAgentSessionTarget(sessionKey) {
	const { baseSessionKey } = require_session_key.parseThreadSessionSuffix(sessionKey);
	const directSessionKey = baseSessionKey ?? sessionKey;
	const parsed = require_session_key.parseAgentSessionKey(directSessionKey);
	if (!parsed || require_session_chat_type_shared.deriveSessionChatTypeFromKey(directSessionKey) !== "direct") return null;
	const parts = parsed.rest.split(":");
	const directIndex = parts.findIndex((part) => part === "direct" || part === "dm");
	if (directIndex < 0 || directIndex > 2 || directIndex >= parts.length - 1) return null;
	const peerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parts.slice(directIndex + 1).join(":"));
	if (!peerId) return null;
	return {
		agentId: parsed.agentId,
		...directIndex >= 1 ? { channel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parts[0]) } : {},
		...directIndex >= 2 ? { accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parts[1]) } : {},
		peerId
	};
}
/** Resolve the configured DM allowlist that applies to an event session. */
function resolveEventSessionAllowFrom(params) {
	const cfg = params.cfg;
	if (!cfg?.channels) return;
	const target = parseDirectAgentSessionTarget(params.sessionKey);
	const channelKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.channel ?? target?.channel);
	if (!channelKey) return;
	const channelConfig = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.channels) ? cfg.channels[channelKey] : void 0;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channelConfig)) return;
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.accountId ?? target?.accountId);
	const accountConfig = accountId && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channelConfig.accounts) ? channelConfig.accounts[accountId] : void 0;
	const accountNestedConfig = readAccountConfig(accountConfig);
	return firstConfiguredAllowFrom(readDmAllowFrom(accountConfig), readDmAllowFrom(accountNestedConfig), readAllowFrom(accountConfig), readAllowFrom(accountNestedConfig), readDmAllowFrom(channelConfig), readAllowFrom(channelConfig));
}
function shouldPreserveDirectSessionKeyFromRoute(params) {
	if (!params.cfg || !params.target?.channel) return false;
	try {
		const route = require_resolve_route.resolveAgentRoute({
			cfg: params.cfg,
			channel: params.target.channel,
			accountId: params.target.accountId,
			peer: {
				kind: "direct",
				id: params.target.peerId
			}
		});
		const { baseSessionKey } = require_session_key.parseThreadSessionSuffix(params.sessionKey);
		const normalizedRouteSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(route.sessionKey);
		return route.lastRoutePolicy === "session" && (normalizedRouteSessionKey === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.sessionKey) || baseSessionKey !== void 0 && normalizedRouteSessionKey === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(baseSessionKey));
	} catch {
		return false;
	}
}
/** Build the routing policy used by event wakeups and scoped heartbeat options. */
function resolveEventSessionRoutingPolicy(params) {
	const target = parseDirectAgentSessionTarget(params.sessionKey);
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.channel ?? target?.channel) || void 0;
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.accountId ?? target?.accountId) || void 0;
	const allowFrom = params.allowFrom ?? resolveEventSessionAllowFrom({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		channel,
		accountId
	});
	return {
		mainKey: params.cfg?.session?.mainKey,
		sessionScope: params.cfg?.session?.scope,
		dmScope: params.dmScope ?? params.cfg?.session?.dmScope,
		allowFrom,
		channel,
		accountId,
		preserveSessionKey: params.sessionKey ? shouldPreserveDirectSessionKeyFromRoute({
			cfg: params.cfg,
			sessionKey: params.sessionKey,
			target
		}) : false
	};
}
/** Resolve a direct DM event session to the configured main session when allowed. */
function resolveMainScopedEventSessionKey(params) {
	const sessionKey = params.sessionKey.trim();
	if (!sessionKey || params.policy?.preserveSessionKey === true) return null;
	const parsed = require_session_key.parseAgentSessionKey(sessionKey);
	const target = parseDirectAgentSessionTarget(sessionKey);
	if (!parsed || !target) return null;
	const resolvedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId ?? target.agentId);
	if ((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId) !== resolvedAgentId) return null;
	const policy = params.policy ?? resolveEventSessionRoutingPolicy({
		cfg: params.cfg,
		sessionKey
	});
	const allowFrom = Array.from(policy.allowFrom ?? []);
	const pinnedOwner = require_dm_policy_shared.resolvePinnedMainDmOwnerFromAllowlist({
		dmScope: policy.dmScope ?? params.cfg?.session?.dmScope,
		allowFrom,
		normalizeEntry
	});
	if (!pinnedOwner || normalizeEntry(target.peerId) !== pinnedOwner) return null;
	if (shouldPreserveDirectSessionKeyFromRoute({
		cfg: params.cfg,
		sessionKey,
		target
	})) return null;
	if (policy.sessionScope === "global") return "global";
	return require_session_key.buildAgentMainSessionKey({
		agentId: resolvedAgentId,
		mainKey: policy.mainKey ?? params.cfg?.session?.mainKey
	});
}
/** Apply event routing policy to a raw session key. */
function resolveEventSessionKeyForPolicy(sessionKey, policy) {
	const cronScoped = require_session_key.resolveEventSessionKey(sessionKey, policy?.mainKey, policy?.sessionScope);
	if (cronScoped !== sessionKey) return cronScoped;
	return resolveMainScopedEventSessionKey({
		sessionKey,
		policy
	}) ?? sessionKey;
}
/** Apply event routing policy while preserving wake option typing. */
function scopedHeartbeatWakeOptionsForPolicy(sessionKey, wakeOptions, policy) {
	if (require_session_key.resolveEventSessionKey(sessionKey, policy?.mainKey, policy?.sessionScope) !== sessionKey) return require_session_key.scopedHeartbeatWakeOptions(sessionKey, wakeOptions, policy?.mainKey, policy?.sessionScope);
	const mainScoped = resolveMainScopedEventSessionKey({
		sessionKey,
		policy
	});
	if (mainScoped) {
		if (mainScoped === "global") {
			const agentId = require_session_key.parseAgentSessionKey(sessionKey)?.agentId;
			return agentId ? {
				...wakeOptions,
				agentId
			} : wakeOptions;
		}
		return {
			...wakeOptions,
			sessionKey: mainScoped
		};
	}
	return require_session_key.scopedHeartbeatWakeOptions(sessionKey, wakeOptions, policy?.mainKey, policy?.sessionScope);
}
//#endregion
Object.defineProperty(exports, "resolveEventSessionKeyForPolicy", {
	enumerable: true,
	get: function() {
		return resolveEventSessionKeyForPolicy;
	}
});
Object.defineProperty(exports, "resolveEventSessionRoutingPolicy", {
	enumerable: true,
	get: function() {
		return resolveEventSessionRoutingPolicy;
	}
});
Object.defineProperty(exports, "resolveMainScopedEventSessionKey", {
	enumerable: true,
	get: function() {
		return resolveMainScopedEventSessionKey;
	}
});
Object.defineProperty(exports, "scopedHeartbeatWakeOptionsForPolicy", {
	enumerable: true,
	get: function() {
		return scopedHeartbeatWakeOptionsForPolicy;
	}
});
