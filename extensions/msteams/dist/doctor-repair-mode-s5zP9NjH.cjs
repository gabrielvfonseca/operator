const require_env = require("./env-C7Oxn-fY.cjs");
//#region src/commands/doctor-repair-mode.ts
/** Resolves doctor repair mode from CLI flags, TTY state, and update environment. */
/** Resolves the effective repair/prompting mode for a doctor invocation. */
function resolveDoctorRepairMode(options) {
	const yes = options.yes === true;
	const requestedNonInteractive = options.nonInteractive === true;
	const shouldRepair = options.repair === true || yes;
	const shouldForce = options.force === true;
	const isTty = process.stdin.isTTY;
	const nonInteractive = requestedNonInteractive || !isTty && !yes;
	const updateInProgress = require_env.isTruthyEnvValue(process.env.OPERATOR_UPDATE_IN_PROGRESS);
	return {
		shouldRepair,
		shouldForce,
		nonInteractive,
		canPrompt: isTty && !yes && !nonInteractive,
		updateInProgress
	};
}
/** Returns true for noninteractive updater-driven doctor repair runs. */
function isDoctorUpdateRepairMode(mode) {
	return mode.updateInProgress && mode.nonInteractive;
}
/** Returns whether a doctor repair prompt should be auto-approved under the current mode. */
function shouldAutoApproveDoctorFix(mode, params = {}) {
	if (!mode.shouldRepair) return false;
	if (params.requiresForce && !mode.shouldForce) return false;
	if (params.blockDuringUpdate && isDoctorUpdateRepairMode(mode)) return false;
	return true;
}
//#endregion
Object.defineProperty(exports, "isDoctorUpdateRepairMode", {
	enumerable: true,
	get: function() {
		return isDoctorUpdateRepairMode;
	}
});
Object.defineProperty(exports, "resolveDoctorRepairMode", {
	enumerable: true,
	get: function() {
		return resolveDoctorRepairMode;
	}
});
Object.defineProperty(exports, "shouldAutoApproveDoctorFix", {
	enumerable: true,
	get: function() {
		return shouldAutoApproveDoctorFix;
	}
});
