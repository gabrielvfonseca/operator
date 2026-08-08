require("./session-key-BQFkCTNx.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/skills/discovery/filter.ts
/** Normalizes an optional skill filter while preserving undefined as "not configured". */
function normalizeSkillFilter(skillFilter) {
	if (skillFilter === void 0) return;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(skillFilter);
}
function normalizeSkillFilterForComparison(skillFilter) {
	const normalized = normalizeSkillFilter(skillFilter);
	if (normalized === void 0) return;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(normalized);
}
function matchesSkillFilter(cached, next) {
	const cachedNormalized = normalizeSkillFilterForComparison(cached);
	const nextNormalized = normalizeSkillFilterForComparison(next);
	if (cachedNormalized === void 0 || nextNormalized === void 0) return cachedNormalized === nextNormalized;
	if (cachedNormalized.length !== nextNormalized.length) return false;
	return cachedNormalized.every((entry, index) => entry === nextNormalized[index]);
}
//#endregion
//#region src/skills/discovery/agent-filter.ts
function resolveAgentEntry(cfg, agentId) {
	if (!cfg) return;
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	return cfg.agents?.list?.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === normalizedAgentId);
}
/**
* Explicit per-agent skills win when present; otherwise fall back to shared defaults.
* Unknown agent ids also fall back to defaults so legacy/unresolved callers do not widen access.
*/
function resolveEffectiveAgentSkillFilter(cfg, agentId) {
	if (!cfg) return;
	const agentEntry = resolveAgentEntry(cfg, agentId);
	if (agentEntry && Object.hasOwn(agentEntry, "skills")) return normalizeSkillFilter(agentEntry.skills);
	return normalizeSkillFilter(cfg.agents?.defaults?.skills);
}
function resolveEffectiveAgentSkillsLimits(cfg, agentId) {
	if (!agentId) return;
	const agentEntry = resolveAgentEntry(cfg, agentId);
	if (!agentEntry || !Object.hasOwn(agentEntry, "skillsLimits")) return;
	const { maxSkillsPromptChars } = agentEntry.skillsLimits ?? {};
	return typeof maxSkillsPromptChars === "number" ? { maxSkillsPromptChars } : void 0;
}
//#endregion
Object.defineProperty(exports, "matchesSkillFilter", {
	enumerable: true,
	get: function() {
		return matchesSkillFilter;
	}
});
Object.defineProperty(exports, "normalizeSkillFilter", {
	enumerable: true,
	get: function() {
		return normalizeSkillFilter;
	}
});
Object.defineProperty(exports, "resolveEffectiveAgentSkillFilter", {
	enumerable: true,
	get: function() {
		return resolveEffectiveAgentSkillFilter;
	}
});
Object.defineProperty(exports, "resolveEffectiveAgentSkillsLimits", {
	enumerable: true,
	get: function() {
		return resolveEffectiveAgentSkillsLimits;
	}
});
