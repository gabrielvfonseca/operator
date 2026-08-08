require("./rolldown-runtime-u92d-OFm.cjs");
const require_lifecycle_startup = require("./lifecycle-startup-Cv61BB1N.cjs");
const require_preview_warnings = require("./preview-warnings-LDLX1SjN.cjs");
//#region src/flows/doctor-startup-channel-maintenance.ts
const CHANNEL_PREVIEW_WARNINGS_CHECK_ID = "core/doctor/channel-preview-warnings";
function normalizeWarningMessage(warning) {
	return warning.replace(/^-\s*/, "").trim();
}
function warningPath(warning) {
	return warning.match(/^\s*-?\s*(channels\.[^\s:]+)/)?.[1];
}
/** Collect read-only channel doctor preview warnings as structured findings. */
async function collectChannelPreviewWarningHealthFindings(params) {
	const { collectChannelDoctorPreviewWarnings } = await Promise.resolve().then(() => require("./channel-doctor-BmUKQKvS.cjs")).then((n) => n.channel_doctor_exports);
	const doctorFixCommand = params.doctorFixCommand ?? "operator doctor --fix";
	return (await collectChannelDoctorPreviewWarnings({
		cfg: (await require_preview_warnings.resolveDoctorChannelPreviewConfig({
			cfg: params.cfg,
			env: params.env ?? process.env,
			allowExec: params.allowExec
		})).cfg,
		doctorFixCommand,
		env: params.env ?? process.env
	})).map((warning) => {
		const path = warningPath(warning);
		const baseFinding = {
			checkId: CHANNEL_PREVIEW_WARNINGS_CHECK_ID,
			severity: "warning",
			message: normalizeWarningMessage(warning),
			requirement: "Configured channels should not emit doctor preview warnings.",
			fixHint: `Run \`${doctorFixCommand}\` if the channel warning recommends repair, or update the affected channel config manually.`
		};
		if (path) return {
			checkId: baseFinding.checkId,
			severity: baseFinding.severity,
			message: baseFinding.message,
			path,
			requirement: baseFinding.requirement,
			fixHint: baseFinding.fixHint
		};
		return baseFinding;
	});
}
/** Runs channel plugin startup maintenance when doctor fix mode explicitly permits repairs. */
async function maybeRunDoctorStartupChannelMaintenance(params) {
	if (!params.shouldRepair) return;
	await (params.runChannelPluginStartupMaintenance ?? require_lifecycle_startup.runChannelPluginStartupMaintenance)({
		cfg: params.cfg,
		env: params.env ?? process.env,
		log: {
			info: (message) => params.runtime.log(message),
			warn: (message) => params.runtime.error(message)
		},
		trigger: "doctor-fix",
		logPrefix: "doctor"
	});
}
//#endregion
exports.collectChannelPreviewWarningHealthFindings = collectChannelPreviewWarningHealthFindings;
exports.maybeRunDoctorStartupChannelMaintenance = maybeRunDoctorStartupChannelMaintenance;
