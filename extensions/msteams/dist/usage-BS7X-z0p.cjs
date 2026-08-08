const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_provider_http_errors = require("./provider-http-errors-BAaO_toA.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_usage_state = require("./usage-state-CfaEuTkC.cjs");
const require_failure_hook = require("./failure-hook-Otwiooy3.cjs");
const require_redact_identifier = require("./redact-identifier-DrE35Pyt.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/agents/console-sanitize.ts
/** Sanitize optional text for compact console output. */
function sanitizeForConsole(text, maxChars = 200) {
	const trimmed = text?.trim();
	if (!trimmed) return;
	const sanitized = Array.from(trimmed).filter((char) => {
		const code = char.charCodeAt(0);
		return !(code <= 8 || code === 11 || code === 12 || code >= 14 && code <= 31 || code === 127);
	}).join("").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
	const codePoints = Array.from(sanitized);
	if (codePoints.length <= maxChars) return sanitized;
	return `${codePoints.slice(0, maxChars).join("")}…`;
}
//#endregion
//#region src/agents/auth-profiles/state-observation.ts
/**
* Structured logging for auth profile failure state changes.
* Log payloads keep machine-readable fields while redacting console-facing ids.
*/
const observationLog = require_subsystem.createSubsystemLogger("agent/embedded");
/** Logs an auth profile failure/cooldown/disable state transition. */
function logAuthProfileFailureStateChange(params) {
	const windowType = params.reason === "billing" || params.reason === "auth_permanent" ? "disabled" : "cooldown";
	const previousCooldownUntil = params.previous?.cooldownUntil;
	const previousDisabledUntil = params.previous?.disabledUntil;
	const windowReused = windowType === "disabled" ? typeof previousDisabledUntil === "number" && Number.isFinite(previousDisabledUntil) && previousDisabledUntil > params.now && previousDisabledUntil === params.next.disabledUntil : typeof previousCooldownUntil === "number" && Number.isFinite(previousCooldownUntil) && previousCooldownUntil > params.now && previousCooldownUntil === params.next.cooldownUntil;
	const safeProfileId = require_redact_identifier.redactIdentifier(params.profileId, { len: 12 });
	const safeRunId = sanitizeForConsole(params.runId) ?? "-";
	const safeProvider = sanitizeForConsole(params.provider) ?? "-";
	observationLog.warn("auth profile failure state updated", {
		event: "auth_profile_failure_state_updated",
		tags: [
			"error_handling",
			"auth_profiles",
			windowType
		],
		runId: params.runId,
		profileId: safeProfileId,
		provider: params.provider,
		reason: params.reason,
		windowType,
		windowReused,
		previousErrorCount: params.previous?.errorCount,
		errorCount: params.next.errorCount,
		previousCooldownUntil,
		cooldownUntil: params.next.cooldownUntil,
		previousDisabledUntil,
		disabledUntil: params.next.disabledUntil,
		previousDisabledReason: params.previous?.disabledReason,
		disabledReason: params.next.disabledReason,
		failureCounts: params.next.failureCounts,
		consoleMessage: `auth profile failure state updated: runId=${safeRunId} profile=${safeProfileId} provider=${safeProvider} reason=${params.reason} window=${windowType} reused=${String(windowReused)}`
	});
}
//#endregion
//#region src/agents/auth-profiles/usage.ts
/**
* Auth profile usage accounting and cooldown mutation.
* Records failures under the store lock, applies WHAM usage probes for OpenAI
* OAuth profiles, and exposes display helpers for unavailable profiles.
*/
const authProfileUsageLog = require_subsystem.createSubsystemLogger("agent/embedded");
const authProfileUsageDeps = { updateAuthProfileStoreWithLock: require_store.updateAuthProfileStoreWithLock };
/** Test-only dependency injection for usage persistence hooks. */
const testing = {
	setDepsForTest(overrides) {
		authProfileUsageDeps.updateAuthProfileStoreWithLock = overrides?.updateAuthProfileStoreWithLock ?? require_store.updateAuthProfileStoreWithLock;
	},
	resetWhamReprobeStateForTest() {
		whamReprobesInFlight.clear();
	}
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.authProfileUsageTestApi")] = testing;
function logDroppedAuthProfileBookkeeping(kind, profileId) {
	authProfileUsageLog.warn("dropped auth profile bookkeeping after locked store update failed", {
		event: "auth_profile_bookkeeping_dropped",
		kind,
		profileId,
		tags: ["auth_profiles", "persistence"]
	});
}
const FAILURE_REASON_PRIORITY = [
	"auth_permanent",
	"auth",
	"billing",
	"format",
	"model_not_found",
	"overloaded",
	"timeout",
	"rate_limit",
	"empty_response",
	"no_error_details",
	"unclassified",
	"unknown"
];
const FAILURE_REASON_SET = new Set(FAILURE_REASON_PRIORITY);
const FAILURE_REASON_ORDER = new Map(FAILURE_REASON_PRIORITY.map((reason, index) => [reason, index]));
const WHAM_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";
const WHAM_TIMEOUT_MS = 3e3;
const WHAM_BURST_COOLDOWN_MS = 15e3;
const WHAM_PROBE_FAILURE_COOLDOWN_MS = 3e4;
const WHAM_HTTP_ERROR_COOLDOWN_MS = 300 * 1e3;
const WHAM_TOKEN_EXPIRED_COOLDOWN_MS = 720 * 60 * 1e3;
const WHAM_DEAD_ACCOUNT_COOLDOWN_MS = 1440 * 60 * 1e3;
const WHAM_HALF_OPEN_REPROBE_INTERVAL_MS = 2700 * 1e3;
const whamReprobesInFlight = /* @__PURE__ */ new Map();
function shouldProbeWhamForFailure(profile, reason) {
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(profile?.provider ?? "");
	return profile?.type === "oauth" && Boolean(profile.access) && (0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(profile.expires) && normalizedProvider === "openai" && (reason === "rate_limit" || reason === "empty_response" || reason === "no_error_details" || reason === "unclassified" || reason === "unknown");
}
function isSameWhamCredential(expected, current) {
	return expected.type === "oauth" && current?.type === "oauth" && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(expected.provider) === (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(current.provider) && expected.access === current.access && expected.accountId === current.accountId;
}
function resolveActiveWindowUntil(value, now) {
	const timestampMs = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(value);
	return timestampMs !== void 0 && timestampMs > now ? timestampMs : 0;
}
function resolveUsageWindowUntil(now, durationMs) {
	if (!Number.isFinite(durationMs) || durationMs <= 0) return now;
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(Math.max(1, Math.floor(durationMs)), { nowMs: now }) ?? now;
}
function resolveWhamResetMs(window, now) {
	if (!window) return null;
	if (typeof window.reset_after_seconds === "number" && Number.isFinite(window.reset_after_seconds) && window.reset_after_seconds > 0) return (0, _gabrielvfonseca_normalization_core_number_coercion.positiveSecondsToSafeMilliseconds)(window.reset_after_seconds) ?? null;
	if (typeof window.reset_at === "number" && Number.isFinite(window.reset_at) && window.reset_at > 0) {
		const resetAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromEpochSeconds)(window.reset_at);
		return resetAtMs === void 0 ? null : Math.max(0, resetAtMs - now);
	}
	return null;
}
function isWhamWindowExhausted(window) {
	return Boolean(window && typeof window.used_percent === "number" && Number.isFinite(window.used_percent) && window.used_percent >= 100);
}
function applyWhamCooldownResult(params) {
	const existingCooldownUntil = params.existing.cooldownUntil;
	const existingBlockedUntil = params.existing.blockedUntil;
	const existingActiveCooldownUntil = typeof existingCooldownUntil === "number" && Number.isFinite(existingCooldownUntil) && existingCooldownUntil > params.now ? existingCooldownUntil : 0;
	const existingActiveBlockedUntil = typeof existingBlockedUntil === "number" && Number.isFinite(existingBlockedUntil) && existingBlockedUntil > params.now ? existingBlockedUntil : 0;
	if (params.whamResult.blockedUntil) return {
		...params.computed,
		lastProbeAt: params.now,
		blockedUntil: Math.max(existingActiveBlockedUntil, params.whamResult.blockedUntil),
		blockedReason: "subscription_limit",
		blockedSource: params.whamResult.blockedSource ?? "wham",
		blockedModel: void 0,
		blockedScope: void 0,
		cooldownUntil: void 0,
		cooldownReason: void 0,
		cooldownModel: void 0
	};
	return {
		...params.computed,
		lastProbeAt: params.now,
		cooldownUntil: Math.max(existingActiveCooldownUntil, resolveUsageWindowUntil(params.now, params.whamResult.cooldownMs))
	};
}
async function cancelUnreadResponseBody(response) {
	if (!response.bodyUsed) await response.body?.cancel().catch(() => void 0);
}
async function probeWhamForCooldown(store, profileId) {
	const profile = store.profiles[profileId];
	if (profile?.type !== "oauth" || !profile.access) return null;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), WHAM_TIMEOUT_MS);
	try {
		const version = process.env.OPERATOR_VERSION?.trim();
		const defaultHeaders = {
			Authorization: `Bearer ${profile.access}`,
			Accept: "application/json",
			originator: "@gabrielvfonseca/operator",
			...version ? { version } : {},
			"User-Agent": `openclaw/${version || "dev"}`
		};
		if (profile.accountId) defaultHeaders["ChatGPT-Account-Id"] = profile.accountId;
		const headers = require_provider_request_config.resolveProviderRequestHeaders({
			provider: "openai",
			baseUrl: WHAM_USAGE_URL,
			capability: "other",
			transport: "http",
			defaultHeaders
		}) ?? defaultHeaders;
		const res = await fetch(WHAM_USAGE_URL, {
			method: "GET",
			headers,
			signal: controller.signal
		});
		if (!res.ok) {
			await cancelUnreadResponseBody(res);
			if (res.status === 401) return {
				cooldownMs: WHAM_TOKEN_EXPIRED_COOLDOWN_MS,
				reason: "wham_token_expired"
			};
			if (res.status === 403) return {
				cooldownMs: WHAM_DEAD_ACCOUNT_COOLDOWN_MS,
				reason: "wham_account_dead"
			};
			return {
				cooldownMs: WHAM_HTTP_ERROR_COOLDOWN_MS,
				reason: "wham_http_error"
			};
		}
		const data = await require_provider_http_errors.readProviderJsonResponse(res, "WHAM usage probe");
		if (!data.rate_limit) return {
			cooldownMs: WHAM_PROBE_FAILURE_COOLDOWN_MS,
			reason: "wham_probe_failed"
		};
		if (data.rate_limit.limit_reached === false) return {
			available: true,
			cooldownMs: WHAM_BURST_COOLDOWN_MS,
			reason: "wham_burst_contention"
		};
		const now = Date.now();
		const primaryResetMs = resolveWhamResetMs(data.rate_limit.primary_window, now);
		const secondaryResetMs = resolveWhamResetMs(data.rate_limit.secondary_window, now);
		if (!data.rate_limit.secondary_window) {
			if (primaryResetMs === null) return {
				cooldownMs: WHAM_PROBE_FAILURE_COOLDOWN_MS,
				reason: "wham_probe_failed"
			};
			return {
				cooldownMs: WHAM_BURST_COOLDOWN_MS,
				blockedUntil: resolveUsageWindowUntil(now, primaryResetMs),
				blockedSource: "wham",
				reason: "wham_personal_rolling"
			};
		}
		if (isWhamWindowExhausted(data.rate_limit.secondary_window)) {
			if (secondaryResetMs === null) return {
				cooldownMs: WHAM_PROBE_FAILURE_COOLDOWN_MS,
				reason: "wham_probe_failed"
			};
			return {
				cooldownMs: WHAM_BURST_COOLDOWN_MS,
				blockedUntil: resolveUsageWindowUntil(now, secondaryResetMs),
				blockedSource: "wham",
				reason: "wham_team_weekly"
			};
		}
		if (isWhamWindowExhausted(data.rate_limit.primary_window)) {
			if (primaryResetMs === null) return {
				cooldownMs: WHAM_PROBE_FAILURE_COOLDOWN_MS,
				reason: "wham_probe_failed"
			};
			return {
				cooldownMs: WHAM_BURST_COOLDOWN_MS,
				blockedUntil: resolveUsageWindowUntil(now, primaryResetMs),
				blockedSource: "wham",
				reason: "wham_team_rolling"
			};
		}
		return {
			cooldownMs: WHAM_PROBE_FAILURE_COOLDOWN_MS,
			reason: "wham_probe_failed"
		};
	} catch {
		return {
			cooldownMs: WHAM_PROBE_FAILURE_COOLDOWN_MS,
			reason: "wham_probe_failed"
		};
	} finally {
		clearTimeout(timeout);
	}
}
function shouldHalfOpenProbeWhamBlock(params) {
	const profile = params.store.profiles[params.profileId];
	const stats = params.store.usageStats?.[params.profileId];
	if (stats?.blockedSource !== "wham" || stats.blockedReason !== "subscription_limit" || !require_usage_state.isActiveUnusableWindow(stats.blockedUntil, params.now) || require_usage_state.isActiveUnusableWindow(stats.cooldownUntil, params.now) || require_usage_state.isActiveUnusableWindow(stats.disabledUntil, params.now) || !shouldProbeWhamForFailure(profile, "rate_limit")) return false;
	if (params.forModel && stats.blockedScope === "model" && stats.blockedModel && stats.blockedModel !== params.forModel) return false;
	const remainingMs = (stats.blockedUntil ?? 0) - params.now;
	const sinceLastProbeMs = params.now - (stats.lastProbeAt ?? 0);
	return remainingMs > WHAM_HALF_OPEN_REPROBE_INTERVAL_MS && sinceLastProbeMs >= WHAM_HALF_OPEN_REPROBE_INTERVAL_MS;
}
function matchesWhamBlockGeneration(stats, generation) {
	return stats.blockedUntil === generation.blockedUntil && stats.blockedModel === generation.blockedModel && stats.blockedScope === generation.blockedScope && stats.lastFailureAt === generation.lastFailureAt && stats.failureCounts?.rate_limit === generation.rateLimitFailureCount;
}
async function claimWhamHalfOpenReprobe(params) {
	let generation;
	const updated = await authProfileUsageDeps.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		updater: (freshStore) => {
			const currentProfile = freshStore.profiles[params.profileId];
			if (!isSameWhamCredential(params.expectedProfile, currentProfile) || !shouldHalfOpenProbeWhamBlock({
				store: freshStore,
				profileId: params.profileId,
				forModel: params.forModel,
				now: params.startedAt
			})) return false;
			const currentStats = freshStore.usageStats?.[params.profileId];
			if (!currentStats) return false;
			generation = {
				blockedUntil: currentStats.blockedUntil,
				blockedModel: currentStats.blockedModel,
				blockedScope: currentStats.blockedScope,
				lastFailureAt: currentStats.lastFailureAt,
				rateLimitFailureCount: currentStats.failureCounts?.rate_limit
			};
			updateUsageStatsEntry(freshStore, params.profileId, (existing) => ({
				...existing,
				lastProbeAt: params.startedAt
			}));
			return true;
		}
	});
	if (updated && generation) {
		params.store.usageStats = updated.usageStats;
		return generation;
	}
	if (updated === null) logDroppedAuthProfileBookkeeping("wham_half_open_claim", params.profileId);
	return null;
}
async function runWhamHalfOpenReprobe(params) {
	const generation = await claimWhamHalfOpenReprobe(params);
	if (!generation) return;
	const result = await probeWhamForCooldown(params.store, params.profileId);
	if (!result || !result.available && !result.blockedUntil) return;
	let applied = false;
	const updated = await authProfileUsageDeps.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		updater: (freshStore) => {
			const currentProfile = freshStore.profiles[params.profileId];
			const currentStats = freshStore.usageStats?.[params.profileId];
			if (currentStats?.blockedSource !== "wham" || currentStats.blockedReason !== "subscription_limit" || currentStats.lastProbeAt !== params.startedAt || !matchesWhamBlockGeneration(currentStats, generation) || !isSameWhamCredential(params.expectedProfile, currentProfile)) return false;
			updateUsageStatsEntry(freshStore, params.profileId, (existing) => {
				if (result.available) return {
					...existing,
					blockedUntil: void 0,
					blockedReason: void 0,
					blockedSource: void 0,
					blockedModel: void 0,
					blockedScope: void 0
				};
				if (result.blockedUntil) return {
					...existing,
					blockedUntil: result.blockedUntil,
					blockedReason: "subscription_limit",
					blockedSource: "wham",
					blockedModel: generation.blockedModel,
					blockedScope: generation.blockedScope
				};
				return existing ?? {};
			});
			applied = true;
			return true;
		}
	});
	if (updated && applied) params.store.usageStats = updated.usageStats;
	else if (updated === null) logDroppedAuthProfileBookkeeping("wham_half_open_reprobe", params.profileId);
}
/** Starts bounded background refreshes for long WHAM-only profile blocks. */
function maybeReprobeWhamBlockedProfiles(params) {
	const now = params.now ?? Date.now();
	for (const profileId of params.profileIds) {
		if (!shouldHalfOpenProbeWhamBlock({
			...params,
			profileId,
			now
		})) continue;
		const profile = params.store.profiles[profileId];
		if (!profile) continue;
		const probeKey = `${params.agentDir ?? "default"}\u0000${profileId}`;
		if (whamReprobesInFlight.has(probeKey)) continue;
		const task = runWhamHalfOpenReprobe({
			store: params.store,
			profileId,
			agentDir: params.agentDir,
			forModel: params.forModel,
			expectedProfile: structuredClone(profile),
			startedAt: now
		}).catch((error) => {
			authProfileUsageLog.warn("WHAM half-open reprobe failed", {
				event: "auth_profile_wham_reprobe_error",
				profileId,
				error: error instanceof Error ? error.message : String(error)
			});
		}).finally(() => {
			whamReprobesInFlight.delete(probeKey);
		});
		whamReprobesInFlight.set(probeKey, task);
	}
}
/**
* Infer the most likely reason all candidate profiles are currently unavailable.
*
* We prefer explicit active `disabledReason` values (for example billing/auth)
* over generic cooldown buckets, then fall back to failure-count signals.
*/
function resolveProfilesUnavailableReason(params) {
	const now = params.now ?? Date.now();
	const scores = /* @__PURE__ */ new Map();
	const addScore = (reason, value) => {
		if (!FAILURE_REASON_SET.has(reason) || value <= 0 || !Number.isFinite(value)) return;
		scores.set(reason, (scores.get(reason) ?? 0) + value);
	};
	for (const profileId of params.profileIds) {
		const stats = params.store.usageStats?.[profileId];
		if (!stats) continue;
		if (require_usage_state.isActiveUnusableWindow(stats.disabledUntil, now) && stats.disabledReason && FAILURE_REASON_SET.has(stats.disabledReason)) {
			addScore(stats.disabledReason, 1e3);
			continue;
		}
		if (require_usage_state.isActiveUnusableWindow(stats.blockedUntil, now)) {
			addScore("rate_limit", 1e3);
			continue;
		}
		if (!require_usage_state.isActiveUnusableWindow(stats.cooldownUntil, now)) continue;
		let recordedReason = false;
		for (const [rawReason, rawCount] of Object.entries(stats.failureCounts ?? {})) {
			const reason = rawReason;
			const count = typeof rawCount === "number" ? rawCount : 0;
			if (!FAILURE_REASON_SET.has(reason) || count <= 0) continue;
			addScore(reason, count);
			recordedReason = true;
		}
		if (!recordedReason) addScore("unknown", 1);
	}
	if (scores.size === 0) return null;
	let best = null;
	let bestScore = -1;
	let bestPriority = Number.MAX_SAFE_INTEGER;
	for (const reason of FAILURE_REASON_PRIORITY) {
		const score = scores.get(reason);
		if (typeof score !== "number") continue;
		const priority = FAILURE_REASON_ORDER.get(reason) ?? Number.MAX_SAFE_INTEGER;
		if (score > bestScore || score === bestScore && priority < bestPriority) {
			best = reason;
			bestScore = score;
			bestPriority = priority;
		}
	}
	return best;
}
/** Returns the regular transient-failure cooldown duration for an error count. */
function calculateAuthProfileCooldownMs(errorCount) {
	const normalized = Math.max(1, errorCount);
	if (normalized <= 1) return 3e4;
	if (normalized <= 2) return 6e4;
	return 5 * 6e4;
}
const DISABLED_FAILURE_BACKOFF_POLICIES = {
	billing: {
		baseMs: (cfg) => cfg.billingBackoffMs,
		maxMs: (cfg) => cfg.billingMaxMs
	},
	auth_permanent: {
		baseMs: (cfg) => cfg.authPermanentBackoffMs,
		maxMs: (cfg) => cfg.authPermanentMaxMs
	}
};
function resolveAuthCooldownConfig(params) {
	const defaults = {
		billingBackoffHours: 5,
		billingMaxHours: 24,
		authPermanentBackoffMinutes: 10,
		authPermanentMaxMinutes: 60,
		failureWindowHours: 24
	};
	const resolvePositiveNumber = (value, fallback) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
	const cooldowns = params.cfg?.auth?.cooldowns;
	const billingBackoffHours = resolvePositiveNumber((() => {
		const map = cooldowns?.billingBackoffHoursByProvider;
		if (!map) return;
		for (const [key, value] of Object.entries(map)) if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(key) === params.providerId) return value;
	})() ?? cooldowns?.billingBackoffHours, defaults.billingBackoffHours);
	const billingMaxHours = resolvePositiveNumber(cooldowns?.billingMaxHours, defaults.billingMaxHours);
	const authPermanentBackoffMinutes = resolvePositiveNumber(cooldowns?.authPermanentBackoffMinutes, defaults.authPermanentBackoffMinutes);
	const authPermanentMaxMinutes = resolvePositiveNumber(cooldowns?.authPermanentMaxMinutes, defaults.authPermanentMaxMinutes);
	const failureWindowHours = resolvePositiveNumber(cooldowns?.failureWindowHours, defaults.failureWindowHours);
	return {
		billingBackoffMs: billingBackoffHours * 60 * 60 * 1e3,
		billingMaxMs: billingMaxHours * 60 * 60 * 1e3,
		authPermanentBackoffMs: authPermanentBackoffMinutes * 60 * 1e3,
		authPermanentMaxMs: authPermanentMaxMinutes * 60 * 1e3,
		failureWindowMs: failureWindowHours * 60 * 60 * 1e3
	};
}
function calculateDisabledLaneBackoffMs(params) {
	const normalized = Math.max(1, params.errorCount);
	const baseMs = Math.max(6e4, params.baseMs);
	const maxMs = Math.max(baseMs, params.maxMs);
	const raw = baseMs * 2 ** Math.min(normalized - 1, 10);
	return Math.min(maxMs, raw);
}
function resolveDisabledFailureBackoffMs(params) {
	const policy = DISABLED_FAILURE_BACKOFF_POLICIES[params.reason];
	return calculateDisabledLaneBackoffMs({
		errorCount: params.errorCount,
		baseMs: policy.baseMs(params.cfgResolved),
		maxMs: policy.maxMs(params.cfgResolved)
	});
}
/** Resolves the display-facing unusable timestamp, honoring provider bypasses. */
function resolveProfileUnusableUntilForDisplay(store, profileId) {
	if (require_usage_state.isAuthCooldownBypassedForProvider(store.profiles[profileId]?.provider)) return null;
	const stats = store.usageStats?.[profileId];
	if (!stats) return null;
	return require_usage_state.resolveProfileUnusableUntil(stats);
}
function resetUsageStats(existing, overrides) {
	return {
		...existing,
		errorCount: 0,
		blockedUntil: void 0,
		blockedReason: void 0,
		blockedSource: void 0,
		blockedModel: void 0,
		blockedScope: void 0,
		cooldownUntil: void 0,
		cooldownReason: void 0,
		cooldownModel: void 0,
		disabledUntil: void 0,
		disabledReason: void 0,
		failureCounts: void 0,
		...overrides
	};
}
function updateUsageStatsEntry(store, profileId, updater) {
	store.usageStats = store.usageStats ?? {};
	store.usageStats[profileId] = updater(store.usageStats[profileId]);
}
function keepActiveWindowOrRecompute(params) {
	const { existingUntil, now, recomputedUntil } = params;
	return typeof existingUntil === "number" && Number.isFinite(existingUntil) && existingUntil > now ? existingUntil : recomputedUntil;
}
function computeNextProfileUsageStats(params) {
	const windowMs = params.cfgResolved.failureWindowMs;
	const windowExpired = typeof params.existing.lastFailureAt === "number" && params.existing.lastFailureAt > 0 && params.now - params.existing.lastFailureAt > windowMs;
	const unusableUntil = require_usage_state.resolveProfileUnusableUntil(params.existing);
	const previousCooldownExpired = typeof unusableUntil === "number" && params.now >= unusableUntil;
	const shouldResetCounters = windowExpired || previousCooldownExpired;
	const nextErrorCount = (shouldResetCounters ? 0 : params.existing.errorCount ?? 0) + 1;
	const failureCounts = shouldResetCounters ? {} : { ...params.existing.failureCounts };
	failureCounts[params.reason] = (failureCounts[params.reason] ?? 0) + 1;
	const updatedStats = {
		...params.existing,
		errorCount: nextErrorCount,
		failureCounts,
		lastFailureAt: params.now
	};
	const disabledFailureReason = params.reason === "billing" || params.reason === "auth_permanent" ? params.reason : null;
	if (disabledFailureReason) {
		const backoffMs = resolveDisabledFailureBackoffMs({
			reason: disabledFailureReason,
			errorCount: failureCounts[disabledFailureReason] ?? 1,
			cfgResolved: params.cfgResolved
		});
		updatedStats.disabledUntil = keepActiveWindowOrRecompute({
			existingUntil: params.existing.disabledUntil,
			now: params.now,
			recomputedUntil: resolveUsageWindowUntil(params.now, backoffMs)
		});
		updatedStats.disabledReason = disabledFailureReason;
	} else {
		const backoffMs = calculateAuthProfileCooldownMs(nextErrorCount);
		updatedStats.cooldownUntil = keepActiveWindowOrRecompute({
			existingUntil: params.existing.cooldownUntil,
			now: params.now,
			recomputedUntil: resolveUsageWindowUntil(params.now, backoffMs)
		});
		if (typeof params.existing.cooldownUntil === "number" && params.existing.cooldownUntil > params.now) {
			updatedStats.cooldownReason = params.reason;
			if (params.existing.cooldownModel && params.modelId && params.existing.cooldownModel !== params.modelId) updatedStats.cooldownModel = void 0;
			else if (require_usage_state.isModelScopedCooldownReason(params.reason) && !params.modelId && params.existing.cooldownModel) updatedStats.cooldownModel = void 0;
			else if (!require_usage_state.isModelScopedCooldownReason(params.reason)) updatedStats.cooldownModel = void 0;
			else updatedStats.cooldownModel = params.existing.cooldownModel;
		} else {
			updatedStats.cooldownReason = params.reason;
			updatedStats.cooldownModel = require_usage_state.isModelScopedCooldownReason(params.reason) ? params.modelId : void 0;
		}
	}
	return updatedStats;
}
/**
* Mark a profile as failed for a specific reason. Billing and permanent-auth
* failures are treated as "disabled" (longer backoff) vs the regular cooldown
* window.
*/
async function markAuthProfileFailure(params) {
	const { store, profileId, reason, agentDir, cfg, runId, modelId } = params;
	const profile = store.profiles[profileId];
	if (!profile || require_usage_state.isAuthCooldownBypassedForProvider(profile.provider)) return;
	const shouldProbeWham = shouldProbeWhamForFailure(profile, reason);
	if (reason === "no_error_details" && !shouldProbeWham) return;
	const whamResult = shouldProbeWham ? await probeWhamForCooldown(store, profileId) : null;
	let nextStats;
	let previousStats;
	let updateTime = 0;
	const updated = await authProfileUsageDeps.updateAuthProfileStoreWithLock({
		agentDir,
		updater: (freshStore) => {
			const profileValue = freshStore.profiles[profileId];
			if (!profileValue || require_usage_state.isAuthCooldownBypassedForProvider(profileValue.provider)) return false;
			const currentWhamResult = whamResult && shouldProbeWhamForFailure(profileValue, reason) && isSameWhamCredential(profile, profileValue) ? whamResult : null;
			if (reason === "no_error_details" && !currentWhamResult) return false;
			const now = Date.now();
			const providerKey = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(profileValue.provider);
			const cfgResolved = resolveAuthCooldownConfig({
				cfg,
				providerId: providerKey
			});
			previousStats = freshStore.usageStats?.[profileId];
			updateTime = now;
			const computed = computeNextProfileUsageStats({
				existing: previousStats ?? {},
				now,
				reason,
				cfgResolved,
				modelId
			});
			nextStats = currentWhamResult ? applyWhamCooldownResult({
				existing: previousStats ?? {},
				computed,
				now,
				whamResult: currentWhamResult
			}) : computed;
			updateUsageStatsEntry(freshStore, profileId, () => nextStats ?? computed);
			return true;
		}
	});
	if (updated) {
		store.usageStats = updated.usageStats;
		if (nextStats) logAuthProfileFailureStateChange({
			runId,
			profileId,
			provider: profile.provider,
			reason,
			previous: previousStats,
			next: nextStats,
			now: updateTime
		});
		try {
			require_failure_hook.notifyAuthProfileFailureHook();
		} catch (err) {
			authProfileUsageLog.warn("auth profile failure hook threw", {
				event: "auth_profile_failure_hook_error",
				tags: ["error_handling", "auth_profiles"],
				error: err instanceof Error ? err.message : String(err)
			});
		}
		return;
	}
	if (updated === null) logDroppedAuthProfileBookkeeping("failure", profileId);
}
function buildBlockedProfileUsageStats(params) {
	const activeBlockedUntil = resolveActiveWindowUntil(params.previousStats?.blockedUntil, params.now);
	const blockedModel = activeBlockedUntil === 0 ? params.modelId : params.previousStats?.blockedScope === "model" && params.previousStats.blockedModel === params.modelId && params.modelId ? params.modelId : void 0;
	return {
		...params.previousStats,
		blockedUntil: Math.max(activeBlockedUntil, params.blockedUntil),
		blockedReason: "subscription_limit",
		blockedSource: params.source,
		blockedModel,
		blockedScope: blockedModel ? "model" : void 0,
		cooldownUntil: void 0,
		cooldownReason: void 0,
		cooldownModel: void 0,
		lastFailureAt: params.now,
		failureCounts: {
			...params.previousStats?.failureCounts,
			rate_limit: (params.previousStats?.failureCounts?.rate_limit ?? 0) + 1
		}
	};
}
/** Marks a profile blocked until a provider-reported reset timestamp. */
async function markAuthProfileBlockedUntil(params) {
	const { store, profileId, blockedUntil, agentDir, runId, modelId, source } = params;
	const profile = store.profiles[profileId];
	if (!profile || require_usage_state.isAuthCooldownBypassedForProvider(profile.provider) || !(0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(blockedUntil)) return;
	let nextStats;
	let previousStats;
	let updateTime = 0;
	const updated = await authProfileUsageDeps.updateAuthProfileStoreWithLock({
		agentDir,
		updater: (freshStore) => {
			const profileLocal = freshStore.profiles[profileId];
			if (!profileLocal || require_usage_state.isAuthCooldownBypassedForProvider(profileLocal.provider)) return false;
			const now = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(Date.now());
			if (now === void 0) return false;
			previousStats = freshStore.usageStats?.[profileId];
			updateTime = now;
			nextStats = buildBlockedProfileUsageStats({
				previousStats,
				blockedUntil,
				source,
				modelId,
				now
			});
			updateUsageStatsEntry(freshStore, profileId, () => nextStats);
			return true;
		}
	});
	if (updated) {
		store.usageStats = updated.usageStats;
		if (nextStats) logAuthProfileFailureStateChange({
			runId,
			profileId,
			provider: profile.provider,
			reason: "rate_limit",
			previous: previousStats,
			next: nextStats,
			now: updateTime
		});
		return;
	}
	if (updated === null) logDroppedAuthProfileBookkeeping("blocked_until", profileId);
}
/**
* Mark a profile as transiently failed. Applies stepped backoff cooldown.
* Cooldown times: 30s, 1min, 5min (capped).
* Uses store lock to avoid overwriting concurrent usage updates.
*/
async function markAuthProfileCooldown(params) {
	await markAuthProfileFailure({
		store: params.store,
		profileId: params.profileId,
		reason: "unknown",
		agentDir: params.agentDir,
		runId: params.runId
	});
}
/**
* Clear cooldown for a profile (e.g., manual reset).
* Uses store lock to avoid overwriting concurrent usage updates.
*/
async function clearAuthProfileCooldown(params) {
	const { store, profileId, agentDir } = params;
	const updated = await authProfileUsageDeps.updateAuthProfileStoreWithLock({
		agentDir,
		updater: (freshStore) => {
			if (!freshStore.usageStats?.[profileId]) return false;
			updateUsageStatsEntry(freshStore, profileId, (existing) => resetUsageStats(existing));
			return true;
		}
	});
	if (updated) {
		store.usageStats = updated.usageStats;
		return;
	}
	if (updated === null) logDroppedAuthProfileBookkeeping("clear_cooldown", profileId);
}
//#endregion
Object.defineProperty(exports, "calculateAuthProfileCooldownMs", {
	enumerable: true,
	get: function() {
		return calculateAuthProfileCooldownMs;
	}
});
Object.defineProperty(exports, "clearAuthProfileCooldown", {
	enumerable: true,
	get: function() {
		return clearAuthProfileCooldown;
	}
});
Object.defineProperty(exports, "markAuthProfileBlockedUntil", {
	enumerable: true,
	get: function() {
		return markAuthProfileBlockedUntil;
	}
});
Object.defineProperty(exports, "markAuthProfileCooldown", {
	enumerable: true,
	get: function() {
		return markAuthProfileCooldown;
	}
});
Object.defineProperty(exports, "markAuthProfileFailure", {
	enumerable: true,
	get: function() {
		return markAuthProfileFailure;
	}
});
Object.defineProperty(exports, "maybeReprobeWhamBlockedProfiles", {
	enumerable: true,
	get: function() {
		return maybeReprobeWhamBlockedProfiles;
	}
});
Object.defineProperty(exports, "resolveProfileUnusableUntilForDisplay", {
	enumerable: true,
	get: function() {
		return resolveProfileUnusableUntilForDisplay;
	}
});
Object.defineProperty(exports, "resolveProfilesUnavailableReason", {
	enumerable: true,
	get: function() {
		return resolveProfilesUnavailableReason;
	}
});
Object.defineProperty(exports, "sanitizeForConsole", {
	enumerable: true,
	get: function() {
		return sanitizeForConsole;
	}
});
