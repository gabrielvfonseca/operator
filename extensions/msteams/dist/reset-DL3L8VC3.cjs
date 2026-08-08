const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_store = require("./store-DCwJguwr.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/config/sessions/reset-policy.ts
const DEFAULT_RESET_MODE = "daily";
const DEFAULT_RESET_AT_HOUR = 4;
/** Returns the most recent daily reset boundary for the supplied wall-clock time. */
function resolveDailyResetAtMs(now, atHour) {
	const normalizedAtHour = normalizeResetAtHour(atHour);
	const resetAt = new Date(now);
	resetAt.setHours(normalizedAtHour, 0, 0, 0);
	if (now < resetAt.getTime()) resetAt.setDate(resetAt.getDate() - 1);
	return resetAt.getTime();
}
/** Resolves the effective reset policy for direct, group, or thread sessions. */
function resolveSessionResetPolicy(params) {
	const sessionCfg = params.sessionCfg;
	const baseReset = params.resetOverride ?? sessionCfg?.reset;
	const typeReset = params.resetOverride ? void 0 : sessionCfg?.resetByType?.[params.resetType] ?? (params.resetType === "direct" ? (sessionCfg?.resetByType)?.dm : void 0);
	const hasExplicitReset = Boolean(baseReset || sessionCfg?.resetByType);
	const legacyIdleMinutes = params.resetOverride ? void 0 : sessionCfg?.idleMinutes;
	const configured = Boolean(baseReset || typeReset || legacyIdleMinutes != null);
	const mode = typeReset?.mode ?? baseReset?.mode ?? (!hasExplicitReset && legacyIdleMinutes != null ? "idle" : DEFAULT_RESET_MODE);
	const atHour = normalizeResetAtHour(typeReset?.atHour ?? baseReset?.atHour ?? DEFAULT_RESET_AT_HOUR);
	const idleMinutesRaw = typeReset?.idleMinutes ?? baseReset?.idleMinutes ?? legacyIdleMinutes;
	let idleMinutes;
	if (idleMinutesRaw != null) {
		const normalized = Math.floor(idleMinutesRaw);
		if (Number.isFinite(normalized)) idleMinutes = Math.max(normalized, 0);
	} else if (mode === "idle") idleMinutes = 0;
	return {
		mode,
		atHour,
		idleMinutes,
		configured
	};
}
/** Evaluates whether a persisted session is still fresh under the resolved reset policy. */
function evaluateSessionFreshness(params) {
	const updatedAt = resolveTimestamp(params.updatedAt, params.now) ?? 0;
	const sessionStartedAt = resolveTimestamp(params.sessionStartedAt, params.now) ?? updatedAt;
	const lastInteractionAt = resolveTimestamp(params.lastInteractionAt, params.now) ?? sessionStartedAt;
	const dailyResetAt = params.policy.mode === "daily" ? resolveDailyResetAtMs(params.now, params.policy.atHour) : void 0;
	const idleExpiresAt = params.policy.idleMinutes != null && params.policy.idleMinutes > 0 ? lastInteractionAt + params.policy.idleMinutes * 6e4 : void 0;
	const staleDaily = dailyResetAt != null && sessionStartedAt < dailyResetAt;
	const staleIdle = idleExpiresAt != null && params.now > idleExpiresAt;
	const staleReason = staleDaily && staleIdle ? (dailyResetAt ?? Number.POSITIVE_INFINITY) <= (idleExpiresAt ?? Number.POSITIVE_INFINITY) ? "daily" : "idle" : staleIdle ? "idle" : staleDaily ? "daily" : void 0;
	return {
		fresh: !(staleDaily || staleIdle),
		dailyResetAt,
		idleExpiresAt,
		...staleReason ? { staleReason } : {}
	};
}
function resolveTimestamp(value, now) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return;
	if (typeof now === "number" && Number.isFinite(now) && value > now) return;
	return value;
}
function normalizeResetAtHour(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_RESET_AT_HOUR;
	const normalized = Math.floor(value);
	if (!Number.isFinite(normalized)) return DEFAULT_RESET_AT_HOUR;
	if (normalized < 0) return 0;
	if (normalized > 23) return 23;
	return normalized;
}
//#endregion
//#region src/config/sessions/reset.ts
const GROUP_SESSION_MARKERS = [":group:", ":channel:"];
/** Returns true when a session key is known to represent a thread. */
function isThreadSessionKey(sessionKey) {
	return Boolean(require_store.resolveLoadedSessionThreadInfo(sessionKey).threadId);
}
function resolveSessionResetType(params) {
	if (params.isThread || isThreadSessionKey(params.sessionKey)) return "thread";
	if (params.isGroup) return "group";
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.sessionKey);
	if (GROUP_SESSION_MARKERS.some((marker) => normalized.includes(marker))) return "group";
	return "direct";
}
function resolveThreadFlag(params) {
	if (params.messageThreadId != null) return true;
	if (params.threadLabel?.trim()) return true;
	if (params.threadStarterBody?.trim()) return true;
	if (params.parentSessionKey?.trim()) return true;
	return isThreadSessionKey(params.sessionKey);
}
function resolveChannelResetConfig(params) {
	const resetByChannel = params.sessionCfg?.resetByChannel;
	if (!resetByChannel) return;
	const normalized = require_message_channel.normalizeMessageChannel(params.channel);
	const fallback = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	const key = normalized ?? fallback;
	if (!key) return;
	return resetByChannel[key];
}
//#endregion
Object.defineProperty(exports, "evaluateSessionFreshness", {
	enumerable: true,
	get: function() {
		return evaluateSessionFreshness;
	}
});
Object.defineProperty(exports, "resolveChannelResetConfig", {
	enumerable: true,
	get: function() {
		return resolveChannelResetConfig;
	}
});
Object.defineProperty(exports, "resolveSessionResetPolicy", {
	enumerable: true,
	get: function() {
		return resolveSessionResetPolicy;
	}
});
Object.defineProperty(exports, "resolveSessionResetType", {
	enumerable: true,
	get: function() {
		return resolveSessionResetType;
	}
});
Object.defineProperty(exports, "resolveThreadFlag", {
	enumerable: true,
	get: function() {
		return resolveThreadFlag;
	}
});
