const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_boolean_coercion = require("@gabrielvfonseca/normalization-core/boolean-coercion");
//#region src/memory-host-sdk/dreaming.ts
const DEFAULT_MEMORY_DREAMING_ENABLED = false;
const DEFAULT_MEMORY_DREAMING_TIMEZONE = void 0;
const DEFAULT_MEMORY_DREAMING_VERBOSE_LOGGING = false;
const DEFAULT_MEMORY_DREAMING_STORAGE_MODE = "separate";
const DEFAULT_MEMORY_DREAMING_SEPARATE_REPORTS = false;
const DEFAULT_MEMORY_DREAMING_PLUGIN_ID = "memory-core";
const MANAGED_MEMORY_DREAMING_CRON_NAME = "Memory Dreaming Promotion";
const MANAGED_MEMORY_DREAMING_CRON_TAG = "[managed-by=memory-core.short-term-promotion]";
const MEMORY_DREAMING_SYSTEM_EVENT_TEXT = "__operator_memory_core_short_term_promotion_dream__";
const DEFAULT_MEMORY_LIGHT_DREAMING_LOOKBACK_DAYS = 2;
const DEFAULT_MEMORY_LIGHT_DREAMING_LIMIT = 100;
const DEFAULT_MEMORY_LIGHT_DREAMING_DEDUPE_SIMILARITY = .9;
const DEFAULT_MEMORY_DEEP_DREAMING_MIN_SCORE = .8;
const DEFAULT_MEMORY_DEEP_DREAMING_MAX_AGE_DAYS = 30;
const DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_ENABLED = true;
const DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_TRIGGER_BELOW_HEALTH = .35;
const DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_LOOKBACK_DAYS = 30;
const DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_MAX_CANDIDATES = 20;
const DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_MIN_CONFIDENCE = .9;
const DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_AUTO_WRITE_MIN_CONFIDENCE = .97;
const DEFAULT_MEMORY_REM_DREAMING_LOOKBACK_DAYS = 7;
const DEFAULT_MEMORY_REM_DREAMING_LIMIT = 10;
const DEFAULT_MEMORY_REM_DREAMING_MIN_PATTERN_STRENGTH = .75;
const DEFAULT_MEMORY_DREAMING_SPEED = "balanced";
const DEFAULT_MEMORY_DREAMING_THINKING = "medium";
const DEFAULT_MEMORY_DREAMING_BUDGET = "medium";
const DEFAULT_MEMORY_LIGHT_DREAMING_SOURCES = [
	"daily",
	"sessions",
	"recall"
];
const DEFAULT_MEMORY_DEEP_DREAMING_SOURCES = [
	"daily",
	"memory",
	"sessions",
	"logs",
	"recall"
];
const DEFAULT_MEMORY_REM_DREAMING_SOURCES = [
	"memory",
	"daily",
	"deep"
];
function normalizeTrimmedString(value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : void 0;
}
function normalizeNonNegativeInt(value, fallback) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictNonNegativeInteger)(value) ?? fallback;
}
function normalizeOptionalPositiveInt(value) {
	if (value === void 0 || value === null) return;
	return (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictPositiveInteger)(value);
}
function normalizeBoolean(value, fallback) {
	return (0, _gabrielvfonseca_normalization_core_boolean_coercion.parseBoolean)(value) ?? fallback;
}
function normalizeScore(value, fallback) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(value);
	if (typeof value === "string" && !normalized) return fallback;
	const num = typeof value === "string" ? Number(normalized) : Number(value);
	if (!Number.isFinite(num) || num < 0 || num > 1) return fallback;
	return num;
}
function normalizeSimilarity(value, fallback) {
	return normalizeScore(value, fallback);
}
function normalizeStringArray(value, allowed, fallback) {
	if (!Array.isArray(value)) return [...fallback];
	const allowedSet = new Set(allowed);
	const normalized = [];
	for (const entry of value) {
		const normalizedEntry = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry);
		if (!normalizedEntry || !allowedSet.has(normalizedEntry)) continue;
		if (!normalized.includes(normalizedEntry)) normalized.push(normalizedEntry);
	}
	return normalized.length > 0 ? normalized : [...fallback];
}
function normalizeStorageMode(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (normalized === "inline" || normalized === "separate" || normalized === "both") return normalized;
	return DEFAULT_MEMORY_DREAMING_STORAGE_MODE;
}
function normalizeSpeed(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (normalized === "fast" || normalized === "balanced" || normalized === "slow") return normalized;
}
function normalizeThinking(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (normalized === "low" || normalized === "medium" || normalized === "high") return normalized;
}
function normalizeBudget(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (normalized === "cheap" || normalized === "medium" || normalized === "expensive") return normalized;
}
function resolveExecutionConfig(value, fallback) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(value);
	const maxOutputTokens = normalizeOptionalPositiveInt(record?.maxOutputTokens);
	const timeoutMs = normalizeOptionalPositiveInt(record?.timeoutMs);
	const temperatureRaw = record?.temperature;
	const temperature = typeof temperatureRaw === "number" && Number.isFinite(temperatureRaw) && temperatureRaw >= 0 ? Math.min(2, temperatureRaw) : void 0;
	const model = normalizeTrimmedString(record?.model) ?? fallback.model;
	return {
		speed: normalizeSpeed(record?.speed) ?? fallback.speed,
		thinking: normalizeThinking(record?.thinking) ?? fallback.thinking,
		budget: normalizeBudget(record?.budget) ?? fallback.budget,
		...model ? { model } : {},
		...typeof maxOutputTokens === "number" ? { maxOutputTokens } : {},
		...typeof temperature === "number" ? { temperature } : {},
		...typeof timeoutMs === "number" ? { timeoutMs } : {}
	};
}
function normalizePathForComparison(input) {
	const normalized = node_path.default.resolve(input);
	return process.platform === "win32" ? (0, _gabrielvfonseca_normalization_core_string_coerce.lowercasePreservingWhitespace)(normalized) : normalized;
}
function resolveMemoryDreamingPluginId(cfg) {
	const configuredSlot = normalizeTrimmedString((0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)((0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)((0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(cfg)?.plugins)?.slots)?.memory);
	if (configuredSlot && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(configuredSlot) !== "none") return configuredSlot;
	return DEFAULT_MEMORY_DREAMING_PLUGIN_ID;
}
function resolveMemoryDreamingPluginConfig(cfg) {
	const entries = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)((0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)((0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(cfg)?.plugins)?.entries);
	const pluginId = resolveMemoryDreamingPluginId(cfg);
	return (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)((0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(entries?.[pluginId])?.config) ?? void 0;
}
function resolveMemoryDreamingConfig(params) {
	const dreaming = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(params.pluginConfig?.dreaming);
	const frequency = normalizeTrimmedString(dreaming?.frequency) ?? "0 3 * * *";
	const timezone = normalizeTrimmedString(dreaming?.timezone) ?? normalizeTrimmedString(params.cfg?.agents?.defaults?.userTimezone) ?? DEFAULT_MEMORY_DREAMING_TIMEZONE;
	const storage = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(dreaming?.storage);
	const execution = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(dreaming?.execution);
	const phases = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(dreaming?.phases);
	const topLevelModel = normalizeTrimmedString(dreaming?.model);
	const defaultExecution = resolveExecutionConfig(execution?.defaults, {
		speed: DEFAULT_MEMORY_DREAMING_SPEED,
		thinking: DEFAULT_MEMORY_DREAMING_THINKING,
		budget: DEFAULT_MEMORY_DREAMING_BUDGET,
		...topLevelModel ? { model: topLevelModel } : {}
	});
	const light = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(phases?.light);
	const deep = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(phases?.deep);
	const rem = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(phases?.rem);
	const deepRecovery = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(deep?.recovery);
	const maxAgeDays = normalizeOptionalPositiveInt(deep?.maxAgeDays);
	const maxPromotedSnippetTokens = normalizeOptionalPositiveInt(deep?.maxPromotedSnippetTokens);
	return {
		enabled: normalizeBoolean(dreaming?.enabled, DEFAULT_MEMORY_DREAMING_ENABLED),
		frequency,
		...timezone ? { timezone } : {},
		verboseLogging: normalizeBoolean(dreaming?.verboseLogging, DEFAULT_MEMORY_DREAMING_VERBOSE_LOGGING),
		storage: {
			mode: normalizeStorageMode(storage?.mode),
			separateReports: normalizeBoolean(storage?.separateReports, DEFAULT_MEMORY_DREAMING_SEPARATE_REPORTS)
		},
		execution: { defaults: defaultExecution },
		phases: {
			light: {
				enabled: normalizeBoolean(light?.enabled, true),
				cron: frequency,
				lookbackDays: normalizeNonNegativeInt(light?.lookbackDays, DEFAULT_MEMORY_LIGHT_DREAMING_LOOKBACK_DAYS),
				limit: normalizeNonNegativeInt(light?.limit, DEFAULT_MEMORY_LIGHT_DREAMING_LIMIT),
				dedupeSimilarity: normalizeSimilarity(light?.dedupeSimilarity, DEFAULT_MEMORY_LIGHT_DREAMING_DEDUPE_SIMILARITY),
				sources: normalizeStringArray(light?.sources, [
					"daily",
					"sessions",
					"recall"
				], DEFAULT_MEMORY_LIGHT_DREAMING_SOURCES),
				execution: resolveExecutionConfig(light?.execution, {
					...defaultExecution,
					speed: "fast",
					thinking: "low",
					budget: "cheap"
				})
			},
			deep: {
				enabled: normalizeBoolean(deep?.enabled, true),
				cron: frequency,
				limit: normalizeNonNegativeInt(deep?.limit, 10),
				minScore: normalizeScore(deep?.minScore, DEFAULT_MEMORY_DEEP_DREAMING_MIN_SCORE),
				minRecallCount: normalizeNonNegativeInt(deep?.minRecallCount, 3),
				minUniqueQueries: normalizeNonNegativeInt(deep?.minUniqueQueries, 3),
				recencyHalfLifeDays: normalizeNonNegativeInt(deep?.recencyHalfLifeDays, 14),
				...typeof maxAgeDays === "number" ? { maxAgeDays } : { maxAgeDays: DEFAULT_MEMORY_DEEP_DREAMING_MAX_AGE_DAYS },
				maxPromotedSnippetTokens: maxPromotedSnippetTokens ?? 160,
				sources: normalizeStringArray(deep?.sources, [
					"daily",
					"memory",
					"sessions",
					"logs",
					"recall"
				], DEFAULT_MEMORY_DEEP_DREAMING_SOURCES),
				recovery: {
					enabled: normalizeBoolean(deepRecovery?.enabled, DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_ENABLED),
					triggerBelowHealth: normalizeScore(deepRecovery?.triggerBelowHealth, DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_TRIGGER_BELOW_HEALTH),
					lookbackDays: normalizeNonNegativeInt(deepRecovery?.lookbackDays, DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_LOOKBACK_DAYS),
					maxRecoveredCandidates: normalizeNonNegativeInt(deepRecovery?.maxRecoveredCandidates, DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_MAX_CANDIDATES),
					minRecoveryConfidence: normalizeScore(deepRecovery?.minRecoveryConfidence, DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_MIN_CONFIDENCE),
					autoWriteMinConfidence: normalizeScore(deepRecovery?.autoWriteMinConfidence, DEFAULT_MEMORY_DEEP_DREAMING_RECOVERY_AUTO_WRITE_MIN_CONFIDENCE)
				},
				execution: resolveExecutionConfig(deep?.execution, {
					...defaultExecution,
					speed: "balanced",
					thinking: "high",
					budget: "medium"
				})
			},
			rem: {
				enabled: normalizeBoolean(rem?.enabled, true),
				cron: frequency,
				lookbackDays: normalizeNonNegativeInt(rem?.lookbackDays, DEFAULT_MEMORY_REM_DREAMING_LOOKBACK_DAYS),
				limit: normalizeNonNegativeInt(rem?.limit, DEFAULT_MEMORY_REM_DREAMING_LIMIT),
				minPatternStrength: normalizeScore(rem?.minPatternStrength, DEFAULT_MEMORY_REM_DREAMING_MIN_PATTERN_STRENGTH),
				sources: normalizeStringArray(rem?.sources, [
					"memory",
					"daily",
					"deep"
				], DEFAULT_MEMORY_REM_DREAMING_SOURCES),
				execution: resolveExecutionConfig(rem?.execution, {
					...defaultExecution,
					speed: "slow",
					thinking: "high",
					budget: "expensive"
				})
			}
		}
	};
}
function resolveMemoryDeepDreamingConfig(params) {
	const resolved = resolveMemoryDreamingConfig(params);
	return {
		...resolved.phases.deep,
		enabled: resolved.enabled && resolved.phases.deep.enabled,
		...resolved.timezone ? { timezone: resolved.timezone } : {},
		verboseLogging: resolved.verboseLogging,
		storage: resolved.storage
	};
}
function resolveMemoryLightDreamingConfig(params) {
	const resolved = resolveMemoryDreamingConfig(params);
	return {
		...resolved.phases.light,
		enabled: resolved.enabled && resolved.phases.light.enabled,
		...resolved.timezone ? { timezone: resolved.timezone } : {},
		verboseLogging: resolved.verboseLogging,
		storage: resolved.storage
	};
}
function resolveMemoryRemDreamingConfig(params) {
	const resolved = resolveMemoryDreamingConfig(params);
	return {
		...resolved.phases.rem,
		enabled: resolved.enabled && resolved.phases.rem.enabled,
		...resolved.timezone ? { timezone: resolved.timezone } : {},
		verboseLogging: resolved.verboseLogging,
		storage: resolved.storage
	};
}
function resolveMemoryDreamingWorkspaces(cfg, options = {}) {
	const configured = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	const agentIds = [];
	const seenAgents = /* @__PURE__ */ new Set();
	for (const entry of configured) {
		if (!entry || typeof entry !== "object" || typeof entry.id !== "string") continue;
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.id);
		if (!id || seenAgents.has(id)) continue;
		seenAgents.add(id);
		agentIds.push(id);
	}
	if (agentIds.length === 0) agentIds.push(require_agent_scope_config.resolveDefaultAgentId(cfg));
	const byWorkspace = /* @__PURE__ */ new Map();
	const addWorkspace = (workspaceDirRaw, agentIdRaw) => {
		const workspaceDir = workspaceDirRaw?.trim();
		if (!workspaceDir) return;
		const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(agentIdRaw) || require_agent_scope_config.resolveDefaultAgentId(cfg);
		const key = normalizePathForComparison(workspaceDir);
		const existing = byWorkspace.get(key);
		if (existing) {
			if (!existing.agentIds.includes(agentId)) existing.agentIds.push(agentId);
			return;
		}
		byWorkspace.set(key, {
			workspaceDir,
			agentIds: [agentId]
		});
	};
	for (const agentId of agentIds) addWorkspace(require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId, options.env), agentId);
	addWorkspace(options.primaryWorkspaceDir ?? void 0, options.primaryAgentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg));
	return [...byWorkspace.values()];
}
//#endregion
Object.defineProperty(exports, "DEFAULT_MEMORY_DREAMING_PLUGIN_ID", {
	enumerable: true,
	get: function() {
		return DEFAULT_MEMORY_DREAMING_PLUGIN_ID;
	}
});
Object.defineProperty(exports, "MANAGED_MEMORY_DREAMING_CRON_NAME", {
	enumerable: true,
	get: function() {
		return MANAGED_MEMORY_DREAMING_CRON_NAME;
	}
});
Object.defineProperty(exports, "MANAGED_MEMORY_DREAMING_CRON_TAG", {
	enumerable: true,
	get: function() {
		return MANAGED_MEMORY_DREAMING_CRON_TAG;
	}
});
Object.defineProperty(exports, "MEMORY_DREAMING_SYSTEM_EVENT_TEXT", {
	enumerable: true,
	get: function() {
		return MEMORY_DREAMING_SYSTEM_EVENT_TEXT;
	}
});
Object.defineProperty(exports, "resolveMemoryDeepDreamingConfig", {
	enumerable: true,
	get: function() {
		return resolveMemoryDeepDreamingConfig;
	}
});
Object.defineProperty(exports, "resolveMemoryDreamingConfig", {
	enumerable: true,
	get: function() {
		return resolveMemoryDreamingConfig;
	}
});
Object.defineProperty(exports, "resolveMemoryDreamingPluginConfig", {
	enumerable: true,
	get: function() {
		return resolveMemoryDreamingPluginConfig;
	}
});
Object.defineProperty(exports, "resolveMemoryDreamingPluginId", {
	enumerable: true,
	get: function() {
		return resolveMemoryDreamingPluginId;
	}
});
Object.defineProperty(exports, "resolveMemoryDreamingWorkspaces", {
	enumerable: true,
	get: function() {
		return resolveMemoryDreamingWorkspaces;
	}
});
Object.defineProperty(exports, "resolveMemoryLightDreamingConfig", {
	enumerable: true,
	get: function() {
		return resolveMemoryLightDreamingConfig;
	}
});
Object.defineProperty(exports, "resolveMemoryRemDreamingConfig", {
	enumerable: true,
	get: function() {
		return resolveMemoryRemDreamingConfig;
	}
});
