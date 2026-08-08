const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_io_audit = require("./io.audit-BX6CvmiH.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/commands/doctor-config-audit-scrub.ts
/** Doctor repair for redacting historical config audit log argv records. */
const NOTE_TITLE = "Config audit";
const CONFIG_AUDIT_SCRUB_CHECK_ID = "core/doctor/config-audit-scrub";
function formatEntryCount(count) {
	return `${count} ${count === 1 ? "entry" : "entries"}`;
}
async function detectConfigAuditScrubIssue(params) {
	const env = params?.env ?? process.env;
	const homedir = params?.homedir ?? node_os.default.homedir;
	return {
		...await require_io_audit.scrubConfigAuditLog({
			fs: { promises: node_fs_promises.default },
			env,
			homedir,
			dryRun: true
		}),
		auditPath: require_io_audit.resolveConfigAuditLogPath(env, homedir)
	};
}
function configAuditScrubToHealthFinding(result) {
	return {
		checkId: CONFIG_AUDIT_SCRUB_CHECK_ID,
		severity: "warning",
		message: `${formatEntryCount(result.rewritten)} in config-audit.jsonl still contain pre-redactor argv values.`,
		path: result.auditPath,
		fixHint: "Run `operator doctor --fix` to rewrite argv/execArgv fields through the current redactor."
	};
}
function configAuditScrubToRepairEffect(result) {
	return {
		kind: "file",
		action: "would-scrub-config-audit-log",
		target: result.auditPath,
		dryRunSafe: false
	};
}
/**
* Scrubs pre-redactor config audit records or previews the number of affected entries.
*
* The rewrite aborts if new records are appended while doctor is processing the JSONL file, so
* live gateways do not lose audit entries during cleanup.
*/
async function maybeScrubConfigAuditLog(params) {
	const env = params.env ?? process.env;
	const homedir = params.homedir ?? node_os.default.homedir;
	const scrubFs = { promises: node_fs_promises.default };
	try {
		if (params.shouldRepair) {
			const result = await require_io_audit.scrubConfigAuditLog({
				fs: scrubFs,
				env,
				homedir
			});
			if (result.aborted) {
				require_note.note("Config audit scrub was aborted because new entries were appended to config-audit.jsonl during the rewrite. No records were modified. Stop the gateway (or wait until it is idle) and rerun `operator doctor --fix`.", NOTE_TITLE);
				return;
			}
			if (result.rewritten > 0) require_note.note(`Scrubbed ${formatEntryCount(result.rewritten)} in config-audit.jsonl that still contained pre-redactor argv values. Rotate any credentials that may have been written to the log before the forward redactor shipped.`, NOTE_TITLE);
			return;
		}
		const preview = await require_io_audit.scrubConfigAuditLog({
			fs: scrubFs,
			env,
			homedir,
			dryRun: true
		});
		if (preview.rewritten > 0) {
			const fixCommand = params.doctorFixCommand ?? "operator doctor --fix";
			require_note.note(`${formatEntryCount(preview.rewritten)} in config-audit.jsonl still contain pre-redactor argv values (likely plaintext credentials at rest). Run \`${fixCommand}\` to rewrite the argv/execArgv fields through the same redactor used for new entries.`, NOTE_TITLE);
		}
	} catch (err) {
		require_note.note(`Config audit scrub failed: ${err instanceof Error ? err.message : String(err)}`, NOTE_TITLE);
	}
}
//#endregion
exports.configAuditScrubToHealthFinding = configAuditScrubToHealthFinding;
exports.configAuditScrubToRepairEffect = configAuditScrubToRepairEffect;
exports.detectConfigAuditScrubIssue = detectConfigAuditScrubIssue;
exports.maybeScrubConfigAuditLog = maybeScrubConfigAuditLog;
