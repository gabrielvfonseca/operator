const require_source = require("./source-Bzj4-gl0.cjs");
const require_frontmatter = require("./frontmatter-Bd84I4zB.cjs");
const require_config_eval = require("./config-eval-fz8eE8a4.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/skills/loading/config.ts
const DEFAULT_CONFIG_VALUES = {
	"browser.enabled": true,
	"browser.evaluateEnabled": true
};
function resolveSkillsInstallPreferences(config) {
	const raw = config?.skills?.install;
	const preferBrew = raw?.preferBrew ?? true;
	const manager = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw?.nodeManager));
	return {
		preferBrew,
		nodeManager: manager === "pnpm" || manager === "yarn" || manager === "bun" || manager === "npm" ? manager : "npm"
	};
}
function isSkillConfigPathTruthy(config, pathStr) {
	return require_config_eval.isConfigPathTruthyWithDefaults(config, pathStr, DEFAULT_CONFIG_VALUES);
}
function resolveSkillConfig(config, skillKey) {
	const skills = config?.skills?.entries;
	if (!skills || typeof skills !== "object") return;
	const entry = skills[skillKey];
	if (!entry || typeof entry !== "object") return;
	return entry;
}
function normalizeAllowlist(input) {
	if (!input) return;
	if (!Array.isArray(input)) return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(input);
	return normalized.length > 0 ? new Set(normalized) : void 0;
}
const BUNDLED_SOURCES = /* @__PURE__ */ new Set(["operator-bundled"]);
function isBundledSkill(entry) {
	return BUNDLED_SOURCES.has(require_source.resolveSkillSource(entry.skill));
}
function resolveBundledAllowlist(config) {
	return normalizeAllowlist(config?.skills?.allowBundled);
}
function isBundledSkillAllowed(entry, allowlist) {
	if (!allowlist || allowlist.size === 0) return true;
	if (!isBundledSkill(entry)) return true;
	const key = require_frontmatter.resolveSkillKey(entry.skill, entry);
	return allowlist.has(key) || allowlist.has(entry.skill.name);
}
function shouldIncludeSkill(params) {
	const { entry, config, bundledAllowlist, eligibility } = params;
	const skillConfig = resolveSkillConfig(config, require_frontmatter.resolveSkillKey(entry.skill, entry));
	if (skillConfig?.enabled === false) return false;
	if (!isBundledSkillAllowed(entry, bundledAllowlist)) return false;
	return require_config_eval.evaluateRuntimeEligibility({
		os: entry.metadata?.os,
		remotePlatforms: eligibility?.remote?.platforms,
		always: entry.metadata?.always,
		requires: entry.metadata?.requires,
		hasBin: require_config_eval.hasBinary,
		hasRemoteBin: eligibility?.remote?.hasBin,
		hasAnyRemoteBin: eligibility?.remote?.hasAnyBin,
		hasEnv: (envName) => Boolean(process.env[envName] || skillConfig?.env?.[envName] || skillConfig?.apiKey && entry.metadata?.primaryEnv === envName),
		isConfigPathTruthy: (configPath) => isSkillConfigPathTruthy(config, configPath)
	});
}
//#endregion
Object.defineProperty(exports, "isBundledSkillAllowed", {
	enumerable: true,
	get: function() {
		return isBundledSkillAllowed;
	}
});
Object.defineProperty(exports, "isSkillConfigPathTruthy", {
	enumerable: true,
	get: function() {
		return isSkillConfigPathTruthy;
	}
});
Object.defineProperty(exports, "resolveBundledAllowlist", {
	enumerable: true,
	get: function() {
		return resolveBundledAllowlist;
	}
});
Object.defineProperty(exports, "resolveSkillConfig", {
	enumerable: true,
	get: function() {
		return resolveSkillConfig;
	}
});
Object.defineProperty(exports, "resolveSkillsInstallPreferences", {
	enumerable: true,
	get: function() {
		return resolveSkillsInstallPreferences;
	}
});
Object.defineProperty(exports, "shouldIncludeSkill", {
	enumerable: true,
	get: function() {
		return shouldIncludeSkill;
	}
});
