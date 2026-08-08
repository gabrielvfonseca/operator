const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/skills/loading/source.ts
var source_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveSkillSource: () => resolveSkillSource,
	resolveSkillTelemetrySource: () => resolveSkillTelemetrySource,
	resolveSkillTelemetrySourceValue: () => resolveSkillTelemetrySourceValue
});
/** Returns the stable source label attached to a loaded skill. */
function resolveSkillSource(skill) {
	const compatSkill = skill;
	const canonical = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(compatSkill.source) ?? "";
	if (canonical) return canonical;
	return ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(compatSkill.sourceInfo?.source) ?? "") || "unknown";
}
function resolveSkillTelemetrySourceValue(value) {
	const source = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
	if (source === "bundled" || source === "operator-bundled") return "bundled";
	if (source === "workspace" || source === "operator-workspace" || source === "operator-managed" || source === "operator-extra" || source === "agents-skills-personal" || source === "agents-skills-project") return "workspace";
	return "unknown";
}
function resolveSkillTelemetrySource(skill) {
	return resolveSkillTelemetrySourceValue(resolveSkillSource(skill));
}
//#endregion
Object.defineProperty(exports, "resolveSkillSource", {
	enumerable: true,
	get: function() {
		return resolveSkillSource;
	}
});
Object.defineProperty(exports, "resolveSkillTelemetrySource", {
	enumerable: true,
	get: function() {
		return resolveSkillTelemetrySource;
	}
});
Object.defineProperty(exports, "resolveSkillTelemetrySourceValue", {
	enumerable: true,
	get: function() {
		return resolveSkillTelemetrySourceValue;
	}
});
Object.defineProperty(exports, "source_exports", {
	enumerable: true,
	get: function() {
		return source_exports;
	}
});
