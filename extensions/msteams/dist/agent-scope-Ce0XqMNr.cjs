const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_filter = require("./agent-filter-D9eRLjzT.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/config/sessions/model-override-provenance.ts
/** Detects model overrides created by automatic fallback provenance. */
function hasSessionAutoModelFallbackProvenance(entry) {
	const hasActiveOverride = Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.providerOverride) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.modelOverride));
	return Boolean(hasActiveOverride && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.modelOverrideFallbackOriginProvider) && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.modelOverrideFallbackOriginModel));
}
/** Detects an active automatic fallback rather than a self-origin configured selection. */
function hasSessionActiveAutoModelFallback(entry) {
	if (!entry) return false;
	if (!hasSessionAutoModelFallbackProvenance(entry) || entry.modelOverrideSource !== void 0 && entry.modelOverrideSource !== "auto") return false;
	const originProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverrideFallbackOriginProvider);
	const originModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverrideFallbackOriginModel);
	const overrideProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.providerOverride) ?? originProvider;
	const overrideModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverride) ?? originModel;
	return overrideProvider !== originProvider || overrideModel !== originModel;
}
//#endregion
//#region src/agents/agent-scope.ts
/** Higher-level agent scope helpers for model selection, fallbacks, skills, and workspaces. */
var agent_scope_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	clearAutoFallbackPrimaryProbeSelection: () => clearAutoFallbackPrimaryProbeSelection,
	entryMatchesAutoFallbackPrimaryProbe: () => entryMatchesAutoFallbackPrimaryProbe,
	hasConfiguredModelFallbacks: () => hasConfiguredModelFallbacks,
	hasLegacyAutoFallbackWithoutOrigin: () => hasLegacyAutoFallbackWithoutOrigin,
	hasSessionAutoModelFallbackProvenance: () => hasSessionAutoModelFallbackProvenance,
	listAgentEntries: () => require_agent_scope_config.listAgentEntries,
	listAgentIds: () => require_agent_scope_config.listAgentIds,
	markAutoFallbackPrimaryProbe: () => markAutoFallbackPrimaryProbe,
	resolveAgentConfig: () => require_agent_scope_config.resolveAgentConfig,
	resolveAgentContextLimits: () => require_agent_scope_config.resolveAgentContextLimits,
	resolveAgentDir: () => require_agent_scope_config.resolveAgentDir,
	resolveAgentEffectiveModelPrimary: () => resolveAgentEffectiveModelPrimary,
	resolveAgentExecutionContract: () => resolveAgentExecutionContract,
	resolveAgentExplicitModelPrimary: () => resolveAgentExplicitModelPrimary,
	resolveAgentIdByWorkspacePath: () => resolveAgentIdByWorkspacePath,
	resolveAgentIdFromSessionKey: () => require_session_key.resolveAgentIdFromSessionKey,
	resolveAgentIdsByWorkspacePath: () => resolveAgentIdsByWorkspacePath,
	resolveAgentModelFallbacksOverride: () => resolveAgentModelFallbacksOverride,
	resolveAgentModelPrimary: () => resolveAgentModelPrimary,
	resolveAgentSkillsFilter: () => resolveAgentSkillsFilter,
	resolveAgentWorkspaceDir: () => require_agent_scope_config.resolveAgentWorkspaceDir,
	resolveAutoFallbackPrimaryProbe: () => resolveAutoFallbackPrimaryProbe,
	resolveDefaultAgentDir: () => require_agent_scope_config.resolveDefaultAgentDir,
	resolveDefaultAgentId: () => require_agent_scope_config.resolveDefaultAgentId,
	resolveEffectiveModelFallbacks: () => resolveEffectiveModelFallbacks,
	resolveFallbackAgentId: () => resolveFallbackAgentId,
	resolveRunModelFallbacksOverride: () => resolveRunModelFallbacksOverride,
	resolveSessionAgentId: () => resolveSessionAgentId,
	resolveSessionAgentIds: () => resolveSessionAgentIds,
	resolveSubagentModelConfigSelection: () => resolveSubagentModelConfigSelection,
	resolveSubagentModelConfigSelectionResult: () => resolveSubagentModelConfigSelectionResult,
	resolveSubagentModelFallbacksOverride: () => resolveSubagentModelFallbacksOverride,
	setAgentEffectiveModelPrimary: () => setAgentEffectiveModelPrimary
});
/** Strip null bytes from paths to prevent ENOTDIR errors. */
function stripNullBytes(s) {
	return s.split("\0").join("");
}
const AUTO_FALLBACK_PRIMARY_PROBE_INTERVAL_MS = 300 * 1e3;
const AUTO_FALLBACK_PRIMARY_PROBE_MAX_KEYS = 4096;
const autoFallbackPrimaryProbeState = /* @__PURE__ */ new Map();
function autoFallbackPrimaryProbeStateKey(params) {
	return [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey) ?? "", `${params.primaryProvider}/${params.primaryModel}`].join("\0");
}
function pruneAutoFallbackPrimaryProbeState(params) {
	const maxKeys = Math.max(1, Math.trunc(params.maxKeys ?? AUTO_FALLBACK_PRIMARY_PROBE_MAX_KEYS));
	const staleBefore = params.now - params.minIntervalMs;
	for (const [key, lastProbeAt] of params.state) if (!Number.isFinite(lastProbeAt) || lastProbeAt < staleBefore) params.state.delete(key);
	if (params.state.size <= maxKeys) return;
	const removeCount = params.state.size - maxKeys;
	let removed = 0;
	for (const key of params.state.keys()) {
		params.state.delete(key);
		removed += 1;
		if (removed >= removeCount) break;
	}
}
/** Detects old auto-fallback session entries that lack primary-origin metadata. */
function hasLegacyAutoFallbackWithoutOrigin(entry) {
	return entry?.modelOverrideSource === "auto" && (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverrideFallbackOriginProvider) || !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverrideFallbackOriginModel));
}
function resolveAutoFallbackPrimaryProbe(params) {
	const entry = params.entry;
	if (!entry) return;
	const recoveredAutoFallbackOverride = entry.modelOverrideSource === void 0 && hasSessionAutoModelFallbackProvenance(entry);
	if (entry.modelOverrideSource !== "auto" && !recoveredAutoFallbackOverride) return;
	const originProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverrideFallbackOriginProvider);
	const originModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverrideFallbackOriginModel);
	const overrideProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.providerOverride);
	const overrideModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverride);
	const primaryProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.primaryProvider);
	const primaryModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.primaryModel);
	if (!originProvider || !originModel || !overrideProvider || !overrideModel) return;
	if (!primaryProvider || !primaryModel) return;
	if (originProvider !== primaryProvider || originModel !== primaryModel) return;
	if (overrideProvider === originProvider && overrideModel === originModel) return;
	const now = params.now ?? Date.now();
	const minIntervalMs = params.minIntervalMs ?? AUTO_FALLBACK_PRIMARY_PROBE_INTERVAL_MS;
	const state = params.probeState ?? autoFallbackPrimaryProbeState;
	pruneAutoFallbackPrimaryProbeState({
		state,
		now,
		minIntervalMs,
		maxKeys: params.maxTrackedProbeKeys
	});
	const key = autoFallbackPrimaryProbeStateKey({
		sessionKey: params.sessionKey,
		primaryProvider: originProvider,
		primaryModel: originModel
	});
	const lastProbeAt = state.get(key);
	if (typeof lastProbeAt === "number" && Number.isFinite(lastProbeAt) && now - lastProbeAt < minIntervalMs) return;
	const fallbackAuthProfileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.authProfileOverride);
	const fallbackAuthProfileIdSource = entry.authProfileOverrideSource ?? (entry.authProfileOverrideCompactionCount !== void 0 ? "auto" : void 0);
	return {
		provider: originProvider,
		model: originModel,
		fallbackProvider: overrideProvider,
		fallbackModel: overrideModel,
		...fallbackAuthProfileId ? {
			fallbackAuthProfileId,
			...fallbackAuthProfileIdSource ? { fallbackAuthProfileIdSource } : {}
		} : {}
	};
}
function markAutoFallbackPrimaryProbe(params) {
	const now = params.now ?? Date.now();
	const minIntervalMs = params.minIntervalMs ?? AUTO_FALLBACK_PRIMARY_PROBE_INTERVAL_MS;
	const state = params.probeState ?? autoFallbackPrimaryProbeState;
	pruneAutoFallbackPrimaryProbeState({
		state,
		now,
		minIntervalMs,
		maxKeys: params.maxTrackedProbeKeys
	});
	const key = autoFallbackPrimaryProbeStateKey({
		sessionKey: params.sessionKey,
		primaryProvider: params.probe.provider,
		primaryModel: params.probe.model
	});
	state.set(key, now);
	pruneAutoFallbackPrimaryProbeState({
		state,
		now,
		minIntervalMs,
		maxKeys: params.maxTrackedProbeKeys
	});
}
function entryMatchesAutoFallbackPrimaryProbe(entry, probe) {
	if (!entry) return false;
	const recoveredAutoFallbackOverride = entry.modelOverrideSource === void 0 && hasSessionAutoModelFallbackProvenance(entry);
	if (entry.modelOverrideSource !== "auto" && !recoveredAutoFallbackOverride) return false;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.providerOverride) === probe.fallbackProvider && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverride) === probe.fallbackModel && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverrideFallbackOriginProvider) === probe.provider && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.modelOverrideFallbackOriginModel) === probe.model;
}
function clearAutoFallbackPrimaryProbeSelection(entry, now = Date.now()) {
	delete entry.providerOverride;
	delete entry.modelOverride;
	delete entry.modelOverrideSource;
	delete entry.modelOverrideFallbackOriginProvider;
	delete entry.modelOverrideFallbackOriginModel;
	if (entry.authProfileOverrideSource === "auto" || entry.authProfileOverrideSource === void 0 && entry.authProfileOverrideCompactionCount !== void 0) {
		delete entry.authProfileOverride;
		delete entry.authProfileOverrideSource;
		delete entry.authProfileOverrideCompactionCount;
	}
	delete entry.fallbackNoticeSelectedModel;
	delete entry.fallbackNoticeActiveModel;
	delete entry.fallbackNoticeReason;
	entry.updatedAt = now;
}
function resolveSessionAgentIds(params) {
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(params.config ?? {});
	const explicitAgentIdRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.agentId);
	const explicitAgentId = explicitAgentIdRaw ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(explicitAgentIdRaw) : null;
	const fallbackAgentIdRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.fallbackAgentId);
	const fallbackAgentId = fallbackAgentIdRaw ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(fallbackAgentIdRaw) : null;
	const sessionKey = params.sessionKey?.trim();
	const normalizedSessionKey = sessionKey ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(sessionKey) : void 0;
	const parsed = normalizedSessionKey ? require_session_key.parseAgentSessionKey(normalizedSessionKey) : null;
	return {
		defaultAgentId,
		sessionAgentId: explicitAgentId ?? (parsed?.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) : fallbackAgentId ?? defaultAgentId)
	};
}
function resolveSessionAgentId(params) {
	return resolveSessionAgentIds(params).sessionAgentId;
}
function resolveAgentExecutionContract(cfg, agentId) {
	const defaultContract = cfg?.agents?.defaults?.embeddedAgent?.executionContract;
	if (!cfg || !agentId) return defaultContract;
	return require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.embeddedAgent?.executionContract ?? defaultContract;
}
function resolveAgentSkillsFilter(cfg, agentId) {
	return require_agent_filter.resolveEffectiveAgentSkillFilter(cfg, agentId);
}
function resolveAgentExplicitModelPrimary(cfg, agentId) {
	const raw = require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.model;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(raw);
}
function resolveAgentEffectiveModelPrimary(cfg, agentId) {
	return resolveAgentExplicitModelPrimary(cfg, agentId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(cfg.agents?.defaults?.model);
}
function findMutableAgentEntry(cfg, agentId) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	return cfg.agents?.list?.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry?.id) === id);
}
function updateAgentModelPrimary(existing, primary) {
	if (existing && typeof existing === "object" && !Array.isArray(existing)) return {
		...existing,
		primary
	};
	return primary;
}
function setAgentEffectiveModelPrimary(cfg, agentId, primary) {
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	if (resolveAgentExplicitModelPrimary(cfg, id)) {
		const entry = findMutableAgentEntry(cfg, id);
		if (entry) {
			entry.model = updateAgentModelPrimary(entry.model, primary);
			return "agent";
		}
	}
	cfg.agents ??= {};
	cfg.agents.defaults ??= {};
	cfg.agents.defaults.model = updateAgentModelPrimary(cfg.agents.defaults.model, primary);
	return "defaults";
}
/** @deprecated Prefer explicit/effective helpers at new call sites. */
function resolveAgentModelPrimary(cfg, agentId) {
	return resolveAgentExplicitModelPrimary(cfg, agentId);
}
function resolveAgentModelFallbacksOverride(cfg, agentId) {
	return resolveSelectedModelFallbacksOverride(require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.model);
}
function resolveSelectedModelFallbacksOverride(raw) {
	if (!raw) return;
	if (typeof raw === "string") return (0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(raw) ? [] : void 0;
	if (!Object.hasOwn(raw, "fallbacks")) return Object.hasOwn(raw, "primary") && (0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(raw) ? [] : void 0;
	return Array.isArray(raw.fallbacks) ? raw.fallbacks : void 0;
}
function resolveFirstModelFallbacksOverride(candidates) {
	for (const candidate of candidates) {
		const fallbackOverride = resolveSelectedModelFallbacksOverride(candidate);
		if (fallbackOverride !== void 0) return fallbackOverride;
	}
}
function resolveSubagentModelConfigSelectionResult(params) {
	const agentConfig = params.agentConfigOverride ?? (params.agentId ? require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId) : void 0);
	return [
		...agentConfig?.subagents?.model ? [{
			raw: agentConfig.subagents.model,
			source: "subagent"
		}] : [],
		...agentConfig?.model ? [{
			raw: agentConfig.model,
			source: "agent"
		}] : [],
		...params.cfg.agents?.defaults?.subagents?.model ? [{
			raw: params.cfg.agents.defaults.subagents.model,
			source: "default-subagent"
		}] : []
	].find((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(candidate.raw));
}
function resolveSubagentModelConfigSelection(params) {
	return resolveSubagentModelConfigSelectionResult(params)?.raw;
}
function resolveSubagentModelFallbacksOverride(cfg, agentId) {
	const agentConfig = require_agent_scope_config.resolveAgentConfig(cfg, agentId);
	const subagentFallbacks = resolveSelectedModelFallbacksOverride(agentConfig?.subagents?.model);
	if (subagentFallbacks !== void 0) return subagentFallbacks;
	const selection = resolveSubagentModelConfigSelectionResult({
		cfg,
		agentId
	});
	if (selection?.source === "agent") return resolveSelectedModelFallbacksOverride(agentConfig?.model);
	if (selection?.source === "default-subagent") return resolveSelectedModelFallbacksOverride(cfg.agents?.defaults?.subagents?.model);
}
function resolveSubagentSpawnModelFallbacksOverride(cfg, agentId) {
	const agentConfig = require_agent_scope_config.resolveAgentConfig(cfg, agentId);
	return resolveFirstModelFallbacksOverride([
		agentConfig?.subagents?.model,
		cfg.agents?.defaults?.subagents?.model,
		agentConfig?.model
	]);
}
function resolveFallbackAgentId(params) {
	const explicitAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId) ?? "";
	if (explicitAgentId) return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(explicitAgentId);
	return require_session_key.resolveAgentIdFromSessionKey(params.sessionKey);
}
function resolveRunModelFallbacksOverride(params) {
	if (!params.cfg) return;
	return resolveAgentModelFallbacksOverride(params.cfg, resolveFallbackAgentId({
		agentId: params.agentId,
		sessionKey: params.sessionKey
	}));
}
function hasConfiguredModelFallbacks(params) {
	const fallbacksOverride = resolveRunModelFallbacksOverride(params);
	const defaultFallbacks = require_model_input.resolveAgentModelFallbackValues(params.cfg?.agents?.defaults?.model);
	return (fallbacksOverride ?? defaultFallbacks).length > 0;
}
function resolveEffectiveModelFallbacks(params) {
	const agentFallbacksOverride = resolveAgentModelFallbacksOverride(params.cfg, params.agentId);
	if (!params.hasSessionModelOverride) return agentFallbacksOverride;
	if (!(params.modelOverrideSource === "auto" || params.modelOverrideSource === void 0 && params.hasAutoFallbackProvenance === true)) return [];
	const subagentFallbacksOverride = require_session_key.isSubagentSessionKey(params.sessionKey) ? resolveSubagentSpawnModelFallbacksOverride(params.cfg, params.agentId) : void 0;
	if (subagentFallbacksOverride !== void 0) return subagentFallbacksOverride;
	const defaultFallbacks = require_model_input.resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.model);
	return agentFallbacksOverride ?? defaultFallbacks;
}
function normalizePathForComparison(input) {
	const resolved = node_path.default.resolve(stripNullBytes(require_home_dir.resolveUserPath(input)));
	let normalized = resolved;
	try {
		normalized = node_fs.default.realpathSync.native(resolved);
	} catch {}
	if (process.platform === "win32") return (0, _gabrielvfonseca_normalization_core_string_coerce.lowercasePreservingWhitespace)(normalized);
	return normalized;
}
function resolveAgentIdsByWorkspacePath(cfg, workspacePath) {
	const normalizedWorkspacePath = normalizePathForComparison(workspacePath);
	const ids = require_agent_scope_config.listAgentIds(cfg);
	const matches = [];
	for (const [index, id] of ids.entries()) {
		const workspaceDir = normalizePathForComparison(require_agent_scope_config.resolveAgentWorkspaceDir(cfg, id));
		if (!(0, _openclaw_fs_safe_path.isPathInside)(workspaceDir, normalizedWorkspacePath)) continue;
		matches.push({
			id,
			workspaceDir,
			order: index
		});
	}
	matches.sort((left, right) => {
		const workspaceLengthDelta = right.workspaceDir.length - left.workspaceDir.length;
		if (workspaceLengthDelta !== 0) return workspaceLengthDelta;
		return left.order - right.order;
	});
	return matches.map((entry) => entry.id);
}
function resolveAgentIdByWorkspacePath(cfg, workspacePath) {
	return resolveAgentIdsByWorkspacePath(cfg, workspacePath)[0];
}
//#endregion
Object.defineProperty(exports, "agent_scope_exports", {
	enumerable: true,
	get: function() {
		return agent_scope_exports;
	}
});
Object.defineProperty(exports, "clearAutoFallbackPrimaryProbeSelection", {
	enumerable: true,
	get: function() {
		return clearAutoFallbackPrimaryProbeSelection;
	}
});
Object.defineProperty(exports, "entryMatchesAutoFallbackPrimaryProbe", {
	enumerable: true,
	get: function() {
		return entryMatchesAutoFallbackPrimaryProbe;
	}
});
Object.defineProperty(exports, "hasConfiguredModelFallbacks", {
	enumerable: true,
	get: function() {
		return hasConfiguredModelFallbacks;
	}
});
Object.defineProperty(exports, "hasLegacyAutoFallbackWithoutOrigin", {
	enumerable: true,
	get: function() {
		return hasLegacyAutoFallbackWithoutOrigin;
	}
});
Object.defineProperty(exports, "hasSessionActiveAutoModelFallback", {
	enumerable: true,
	get: function() {
		return hasSessionActiveAutoModelFallback;
	}
});
Object.defineProperty(exports, "hasSessionAutoModelFallbackProvenance", {
	enumerable: true,
	get: function() {
		return hasSessionAutoModelFallbackProvenance;
	}
});
Object.defineProperty(exports, "markAutoFallbackPrimaryProbe", {
	enumerable: true,
	get: function() {
		return markAutoFallbackPrimaryProbe;
	}
});
Object.defineProperty(exports, "resolveAgentEffectiveModelPrimary", {
	enumerable: true,
	get: function() {
		return resolveAgentEffectiveModelPrimary;
	}
});
Object.defineProperty(exports, "resolveAgentExecutionContract", {
	enumerable: true,
	get: function() {
		return resolveAgentExecutionContract;
	}
});
Object.defineProperty(exports, "resolveAgentIdByWorkspacePath", {
	enumerable: true,
	get: function() {
		return resolveAgentIdByWorkspacePath;
	}
});
Object.defineProperty(exports, "resolveAgentModelFallbacksOverride", {
	enumerable: true,
	get: function() {
		return resolveAgentModelFallbacksOverride;
	}
});
Object.defineProperty(exports, "resolveAgentSkillsFilter", {
	enumerable: true,
	get: function() {
		return resolveAgentSkillsFilter;
	}
});
Object.defineProperty(exports, "resolveAutoFallbackPrimaryProbe", {
	enumerable: true,
	get: function() {
		return resolveAutoFallbackPrimaryProbe;
	}
});
Object.defineProperty(exports, "resolveEffectiveModelFallbacks", {
	enumerable: true,
	get: function() {
		return resolveEffectiveModelFallbacks;
	}
});
Object.defineProperty(exports, "resolveRunModelFallbacksOverride", {
	enumerable: true,
	get: function() {
		return resolveRunModelFallbacksOverride;
	}
});
Object.defineProperty(exports, "resolveSessionAgentId", {
	enumerable: true,
	get: function() {
		return resolveSessionAgentId;
	}
});
Object.defineProperty(exports, "resolveSessionAgentIds", {
	enumerable: true,
	get: function() {
		return resolveSessionAgentIds;
	}
});
Object.defineProperty(exports, "resolveSubagentModelConfigSelectionResult", {
	enumerable: true,
	get: function() {
		return resolveSubagentModelConfigSelectionResult;
	}
});
Object.defineProperty(exports, "resolveSubagentModelFallbacksOverride", {
	enumerable: true,
	get: function() {
		return resolveSubagentModelFallbacksOverride;
	}
});
