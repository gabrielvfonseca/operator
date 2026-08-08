let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/skills/workshop/config.ts
const DEFAULT_CONFIG = {
	autonomous: { enabled: false },
	allowSymlinkTargetWrites: false,
	approvalPolicy: "auto",
	maxPending: 50,
	maxSkillBytes: 4e4
};
function readBoolean(value, fallback) {
	return typeof value === "boolean" ? value : fallback;
}
function readInteger(value, fallback, min, max) {
	return typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), min), max) : fallback;
}
function readApprovalPolicy(value, fallback) {
	return value === "pending" || value === "auto" ? value : fallback;
}
function resolveSkillWorkshopConfig(config) {
	const raw = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(config?.skills?.workshop) ?? {};
	return {
		autonomous: { enabled: readBoolean(((0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(raw.autonomous) ?? {}).enabled, DEFAULT_CONFIG.autonomous.enabled) },
		allowSymlinkTargetWrites: readBoolean(raw.allowSymlinkTargetWrites, DEFAULT_CONFIG.allowSymlinkTargetWrites),
		approvalPolicy: readApprovalPolicy(raw.approvalPolicy, DEFAULT_CONFIG.approvalPolicy),
		maxPending: readInteger(raw.maxPending, DEFAULT_CONFIG.maxPending, 1, 200),
		maxSkillBytes: readInteger(raw.maxSkillBytes, DEFAULT_CONFIG.maxSkillBytes, 1024, 2e5)
	};
}
//#endregion
Object.defineProperty(exports, "resolveSkillWorkshopConfig", {
	enumerable: true,
	get: function() {
		return resolveSkillWorkshopConfig;
	}
});
