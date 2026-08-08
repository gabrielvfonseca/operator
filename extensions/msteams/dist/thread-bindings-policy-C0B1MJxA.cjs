const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_conversation_binding_context = require("./conversation-binding-context-XssjEZBB.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/thread-bindings-policy.ts
const DEFAULT_THREAD_BINDING_IDLE_HOURS = 24;
const DEFAULT_THREAD_BINDING_MAX_AGE_HOURS = 0;
function normalizeChannelId(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
}
/** Returns true when top-level commands should spawn in a child thread by default. */
function supportsAutomaticThreadBindingSpawn(channel) {
	return resolveDefaultTopLevelPlacement(channel) === "child";
}
/** Returns true when /thread here needs a native channel thread to exist first. */
function requiresNativeThreadContextForThreadHere(channel) {
	return resolveDefaultTopLevelPlacement(channel) === "child";
}
/** Resolves whether a thread binding should attach to the current thread or create a child. */
function resolveThreadBindingPlacementForCurrentContext(params) {
	if (resolveDefaultTopLevelPlacement(params.channel) !== "child") return "current";
	return params.threadId ? "current" : "child";
}
function resolveDefaultTopLevelPlacement(channel) {
	const normalized = normalizeChannelId(channel);
	if (!normalized) return "current";
	return require_registry.getLoadedChannelPlugin(normalized)?.conversationBindings?.defaultTopLevelPlacement ?? require_conversation_binding_context.resolveBundledChannelThreadBindingDefaultPlacement(normalized) ?? "current";
}
function normalizeBoolean(value) {
	if (typeof value !== "boolean") return;
	return value;
}
function normalizeThreadBindingHours(raw) {
	if (typeof raw !== "number" || !Number.isFinite(raw)) return;
	if (raw < 0) return;
	return raw;
}
function resolveThreadBindingHoursMs(raw, fallbackHours) {
	const hours = normalizeThreadBindingHours(raw) ?? fallbackHours;
	const durationMs = Math.floor(hours * 60 * 60 * 1e3);
	if (!Number.isFinite(durationMs) || durationMs < 0) return 0;
	return Math.min(durationMs, _gabrielvfonseca_normalization_core_number_coercion.MAX_DATE_TIMESTAMP_MS);
}
/** Resolves thread-binding idle timeout with channel/account override before session default. */
function resolveThreadBindingIdleTimeoutMs(params) {
	return resolveThreadBindingHoursMs(params.channelIdleHoursRaw, normalizeThreadBindingHours(params.sessionIdleHoursRaw) ?? DEFAULT_THREAD_BINDING_IDLE_HOURS);
}
/** Resolves thread-binding max age with channel/account override before session default. */
function resolveThreadBindingMaxAgeMs(params) {
	return resolveThreadBindingHoursMs(params.channelMaxAgeHoursRaw, normalizeThreadBindingHours(params.sessionMaxAgeHoursRaw) ?? DEFAULT_THREAD_BINDING_MAX_AGE_HOURS);
}
function resolveChannelThreadBindings(params) {
	const channelConfig = params.cfg.channels?.[params.channel];
	const accountConfig = channelConfig?.accounts?.[params.accountId];
	return {
		root: channelConfig?.threadBindings,
		account: accountConfig?.threadBindings
	};
}
function resolveSpawnFlagKey(kind) {
	return kind === "subagent" ? "spawnSubagentSessions" : "spawnAcpSessions";
}
function normalizeSpawnContext(value) {
	return value === "isolated" || value === "fork" ? value : void 0;
}
/** Resolves effective spawn policy from account, channel, then global thread-binding config. */
function resolveThreadBindingSpawnPolicy(params) {
	const channel = normalizeChannelId(params.channel);
	const accountId = require_account_id.normalizeAccountId(params.accountId);
	const { root, account } = resolveChannelThreadBindings({
		cfg: params.cfg,
		channel,
		accountId
	});
	const enabled = normalizeBoolean(account?.enabled) ?? normalizeBoolean(root?.enabled) ?? normalizeBoolean(params.cfg.session?.threadBindings?.enabled) ?? true;
	const spawnFlagKey = resolveSpawnFlagKey(params.kind);
	return {
		channel,
		accountId,
		enabled,
		spawnEnabled: normalizeBoolean(account?.[spawnFlagKey]) ?? normalizeBoolean(account?.spawnSessions) ?? normalizeBoolean(root?.[spawnFlagKey]) ?? normalizeBoolean(root?.spawnSessions) ?? normalizeBoolean(params.cfg.session?.threadBindings?.spawnSessions) ?? true,
		defaultSpawnContext: normalizeSpawnContext(account?.defaultSpawnContext) ?? normalizeSpawnContext(root?.defaultSpawnContext) ?? normalizeSpawnContext(params.cfg.session?.threadBindings?.defaultSpawnContext) ?? "fork"
	};
}
/** Resolves idle timeout for a concrete channel/account config scope. */
function resolveThreadBindingIdleTimeoutMsForChannel(params) {
	const { root, account } = resolveThreadBindingChannelScope(params);
	return resolveThreadBindingIdleTimeoutMs({
		channelIdleHoursRaw: account?.idleHours ?? root?.idleHours,
		sessionIdleHoursRaw: params.cfg.session?.threadBindings?.idleHours
	});
}
/** Resolves max age for a concrete channel/account config scope. */
function resolveThreadBindingMaxAgeMsForChannel(params) {
	const { root, account } = resolveThreadBindingChannelScope(params);
	return resolveThreadBindingMaxAgeMs({
		channelMaxAgeHoursRaw: account?.maxAgeHours ?? root?.maxAgeHours,
		sessionMaxAgeHoursRaw: params.cfg.session?.threadBindings?.maxAgeHours
	});
}
function resolveThreadBindingChannelScope(params) {
	const channel = normalizeChannelId(params.channel);
	const accountId = require_account_id.normalizeAccountId(params.accountId);
	return resolveChannelThreadBindings({
		cfg: params.cfg,
		channel,
		accountId
	});
}
/** Formats the user-facing error for disabled thread bindings. */
function formatThreadBindingDisabledError(params) {
	return `Thread bindings are disabled for ${params.channel} (set channels.${params.channel}.threadBindings.enabled=true to override for this account, or session.threadBindings.enabled=true globally).`;
}
/** Formats the user-facing error for disabled thread-bound session spawning. */
function formatThreadBindingSpawnDisabledError(params) {
	return `Thread-bound session spawns are disabled for ${params.channel} (set channels.${params.channel}.threadBindings.spawnSessions=true to enable).`;
}
//#endregion
Object.defineProperty(exports, "formatThreadBindingDisabledError", {
	enumerable: true,
	get: function() {
		return formatThreadBindingDisabledError;
	}
});
Object.defineProperty(exports, "formatThreadBindingSpawnDisabledError", {
	enumerable: true,
	get: function() {
		return formatThreadBindingSpawnDisabledError;
	}
});
Object.defineProperty(exports, "requiresNativeThreadContextForThreadHere", {
	enumerable: true,
	get: function() {
		return requiresNativeThreadContextForThreadHere;
	}
});
Object.defineProperty(exports, "resolveThreadBindingIdleTimeoutMsForChannel", {
	enumerable: true,
	get: function() {
		return resolveThreadBindingIdleTimeoutMsForChannel;
	}
});
Object.defineProperty(exports, "resolveThreadBindingMaxAgeMsForChannel", {
	enumerable: true,
	get: function() {
		return resolveThreadBindingMaxAgeMsForChannel;
	}
});
Object.defineProperty(exports, "resolveThreadBindingPlacementForCurrentContext", {
	enumerable: true,
	get: function() {
		return resolveThreadBindingPlacementForCurrentContext;
	}
});
Object.defineProperty(exports, "resolveThreadBindingSpawnPolicy", {
	enumerable: true,
	get: function() {
		return resolveThreadBindingSpawnPolicy;
	}
});
Object.defineProperty(exports, "supportsAutomaticThreadBindingSpawn", {
	enumerable: true,
	get: function() {
		return supportsAutomaticThreadBindingSpawn;
	}
});
