//#region src/commands/doctor-service-repair-policy.ts
const SERVICE_REPAIR_POLICY_ENV = "OPERATOR_SERVICE_REPAIR_POLICY";
const EXTERNAL_SERVICE_REPAIR_NOTE = "Gateway service is managed externally; skipped service install/start repair. Start or repair the gateway through your supervisor.";
/** Resolves whether doctor may repair managed services or must defer to an external supervisor. */
function resolveServiceRepairPolicy(env = process.env) {
	const value = env[SERVICE_REPAIR_POLICY_ENV]?.trim().toLowerCase();
	switch (value) {
		case "auto":
		case "external": return value;
		default: return "auto";
	}
}
/** Returns true when service repairs should only emit external-supervisor guidance. */
function isServiceRepairExternallyManaged(policy = resolveServiceRepairPolicy()) {
	return policy === "external";
}
/** Confirms a service repair unless the service repair policy is external. */
async function confirmDoctorServiceRepair(prompter, params, policy = resolveServiceRepairPolicy()) {
	if (isServiceRepairExternallyManaged(policy)) return false;
	return await prompter.confirmRuntimeRepair(params);
}
//#endregion
Object.defineProperty(exports, "EXTERNAL_SERVICE_REPAIR_NOTE", {
	enumerable: true,
	get: function() {
		return EXTERNAL_SERVICE_REPAIR_NOTE;
	}
});
Object.defineProperty(exports, "SERVICE_REPAIR_POLICY_ENV", {
	enumerable: true,
	get: function() {
		return SERVICE_REPAIR_POLICY_ENV;
	}
});
Object.defineProperty(exports, "confirmDoctorServiceRepair", {
	enumerable: true,
	get: function() {
		return confirmDoctorServiceRepair;
	}
});
Object.defineProperty(exports, "isServiceRepairExternallyManaged", {
	enumerable: true,
	get: function() {
		return isServiceRepairExternallyManaged;
	}
});
Object.defineProperty(exports, "resolveServiceRepairPolicy", {
	enumerable: true,
	get: function() {
		return resolveServiceRepairPolicy;
	}
});
