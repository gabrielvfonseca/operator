const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_install_policy = require("./install-policy-Dnj8EhuT.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/commands/doctor-install-policy.ts
/** Doctor checks for install/update security policy configuration and synthetic probes. */
function formatTargets(validation) {
	return validation.targets.length > 0 ? validation.targets.join(", ") : "none";
}
/** Builds doctor note lines for static install policy validation and optional deep probing. */
async function collectInstallPolicyHealthLines(cfg, options = {}) {
	const validation = await require_install_policy.validateInstallPolicyStatic(cfg);
	if (!validation.enabled) return [];
	const lines = [`- Install policy enabled for: ${formatTargets(validation)}`];
	for (const issue of validation.issues) lines.push(`- ${issue.severity.toUpperCase()}: ${issue.message}`);
	if (validation.issues.some((issue) => issue.severity === "error")) {
		lines.push("- Installs and updates for covered targets will fail closed until this is fixed.");
		return lines;
	}
	if (!options.deep) {
		lines.push(`- Static checks passed. Run ${require_command_format.formatCliCommand("operator doctor --deep")} to execute a synthetic policy probe.`);
		return lines;
	}
	const probeDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-install-policy-probe-"));
	try {
		const result = await require_install_policy.probeInstallPolicy({
			config: cfg,
			env: options.env,
			logger: {},
			sourcePath: probeDir
		});
		if (!result?.blocked) {
			lines.push("- Deep probe allowed the synthetic install request.");
			return lines;
		}
		if (result.blocked.code === "security_scan_blocked") {
			lines.push(`- Deep probe reached the policy command and the policy blocked the synthetic request: ${result.blocked.reason}`);
			return lines;
		}
		lines.push(`- ERROR: Deep probe failed closed: ${result.blocked.reason}`);
		lines.push("- Installs and updates for covered targets will fail closed until this is fixed.");
		return lines;
	} catch (err) {
		lines.push(`- ERROR: Deep probe could not run: ${require_errors.formatErrorMessage(err)}`);
		lines.push("- Installs and updates for covered targets will fail closed until this is fixed.");
		return lines;
	} finally {
		await node_fs_promises.default.rm(probeDir, {
			recursive: true,
			force: true
		});
	}
}
/** Emits install policy health notes when policy validation finds configured coverage or errors. */
async function noteInstallPolicyHealth(cfg, options = {}) {
	const lines = await collectInstallPolicyHealthLines(cfg, options);
	if (lines.length === 0) return;
	require_note.note(lines.join("\n"), "Install policy");
}
//#endregion
exports.noteInstallPolicyHealth = noteInstallPolicyHealth;
