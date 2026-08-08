const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_service = require("./service-BJLcDrM4.cjs");
const require_doctor_service_repair_policy = require("./doctor-service-repair-policy-DCMyHa1V.cjs");
const require_service_layout = require("./service-layout-snfAPMhx.cjs");
const require_update_runner = require("./update-runner-Cw_EEBKY.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _clack_prompts = require("@clack/prompts");
//#region src/cli/update-cli/progress.ts
const STEP_LABELS = {
	"clean check": "Working directory is clean",
	"upstream check": "Upstream branch exists",
	"git fetch": "Fetching latest changes",
	"git rebase": "Rebasing onto target commit",
	"git rev-parse @{upstream}": "Resolving upstream commit",
	"git rev-list": "Enumerating candidate commits",
	"git clone": "Cloning git checkout",
	"preflight worktree": "Preparing preflight worktree",
	"preflight cleanup": "Cleaning preflight worktree",
	"deps install": "Installing dependencies",
	build: "Building",
	"ui:build": "Building UI assets",
	"ui:build (post-doctor repair)": "Restoring missing UI assets",
	"ui assets verify": "Validating UI assets",
	"openclaw doctor entry": "Checking doctor entrypoint",
	"openclaw doctor": "Running doctor checks",
	"git rev-parse HEAD (after)": "Verifying update",
	"global update": "Updating via package manager",
	"global update (omit optional)": "Retrying update without optional deps",
	"global install stage": "Preparing staged package install",
	"global install verify": "Verifying global package",
	"global install swap": "Activating global package",
	"global install": "Installing global package"
};
function getStepLabel(step) {
	return STEP_LABELS[step.name] ?? step.name;
}
function isAdvisoryStep(step) {
	return step.advisory !== void 0;
}
/** Create a progress adapter for the updater runner without coupling runner code to terminal UI. */
function createUpdateProgress(enabled) {
	if (!enabled) return {
		progress: {},
		stop: () => {}
	};
	let currentSpinner = null;
	return {
		progress: {
			onStepStart: (step) => {
				currentSpinner = (0, _clack_prompts.spinner)();
				currentSpinner.start(require_theme.theme.accent(getStepLabel(step)));
			},
			onStepComplete: (step) => {
				if (!currentSpinner) return;
				const label = getStepLabel(step);
				const duration = require_theme.theme.muted(`(${require_format_duration.formatDurationPrecise(step.durationMs)})`);
				const icon = formatStepStatus(step);
				currentSpinner.stop(`${icon} ${label} ${duration}`);
				currentSpinner = null;
				if (isAdvisoryStep(step) && step.stderrTail) {
					const lines = step.stderrTail.split("\n").slice(-10);
					for (const line of lines) if (line.trim()) require_runtime.defaultRuntime.log(`    ${require_theme.theme.warn(line)}`);
				} else if (step.exitCode !== 0 && step.stderrTail) {
					const lines = step.stderrTail.split("\n").slice(-10);
					for (const line of lines) if (line.trim()) require_runtime.defaultRuntime.log(`    ${require_theme.theme.error(line)}`);
				}
			}
		},
		stop: () => {
			if (currentSpinner) {
				currentSpinner.stop();
				currentSpinner = null;
			}
		}
	};
}
function formatStepStatus(step) {
	if (isAdvisoryStep(step)) return require_theme.theme.warn("!");
	if (step.exitCode === 0) return require_theme.theme.success("✓");
	if (step.exitCode === null) return require_theme.theme.warn("?");
	return require_theme.theme.error("✗");
}
//#endregion
//#region src/commands/doctor-update.ts
/** Optional pre-doctor update prompt for source checkouts and package installs. */
async function resolveComparablePath(target) {
	return await node_fs_promises.default.realpath(target).catch(() => node_path.default.resolve(target));
}
async function detectOperatorGitCheckout(root) {
	const res = await require_exec.runCommandWithTimeout([
		"git",
		"-C",
		root,
		"rev-parse",
		"--show-toplevel"
	], { timeoutMs: 5e3 }).catch(() => null);
	if (!res) return "unknown";
	if (res.code !== 0) {
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(res.stderr).includes("not a git repository")) return "not-git";
		return "unknown";
	}
	return await resolveComparablePath(res.stdout.trim()) === await resolveComparablePath(root) ? "git" : "not-git";
}
const NO_GATEWAY_SERVICE_UPDATE = {
	allowGatewayServiceRepair: false,
	allowGatewayActivation: false
};
async function inspectGatewayServiceForUpdate(root) {
	if (require_doctor_service_repair_policy.isServiceRepairExternallyManaged()) return NO_GATEWAY_SERVICE_UPDATE;
	try {
		const service = require_service.resolveGatewayService();
		const state = await require_service.readGatewayServiceState(service, { env: process.env });
		if (!state.installed) return NO_GATEWAY_SERVICE_UPDATE;
		const layout = await require_service_layout.summarizeGatewayServiceLayout(state.command);
		const serviceRoot = layout?.packageRootReal ?? layout?.packageRoot;
		const serviceEntrypoint = layout?.entrypoint;
		if (!serviceRoot || !serviceEntrypoint || !node_path.default.isAbsolute(serviceEntrypoint) && !node_path.default.win32.isAbsolute(serviceEntrypoint)) return NO_GATEWAY_SERVICE_UPDATE;
		const [serviceRootReal, updateRootReal] = await Promise.all([resolveComparablePath(serviceRoot), resolveComparablePath(root)]);
		if (serviceRootReal !== updateRootReal) return NO_GATEWAY_SERVICE_UPDATE;
		return {
			allowGatewayServiceRepair: true,
			allowGatewayActivation: state.running,
			service,
			state
		};
	} catch {
		return NO_GATEWAY_SERVICE_UPDATE;
	}
}
async function restartRunningGatewayServiceAfterUpdate(runtime, root, wasOwnedAndRunning) {
	if (require_doctor_service_repair_policy.isServiceRepairExternallyManaged()) {
		require_note.note(require_doctor_service_repair_policy.EXTERNAL_SERVICE_REPAIR_NOTE, "Update");
		return true;
	}
	if (!wasOwnedAndRunning) return true;
	const inspection = await inspectGatewayServiceForUpdate(root);
	if (!inspection.allowGatewayServiceRepair || !inspection.service || !inspection.state) return true;
	try {
		await inspection.service.restart({
			env: inspection.state.env,
			stdout: process.stdout
		});
		require_note.note("Restarted the running gateway service after updating Operator.", "Update");
		return true;
	} catch (err) {
		runtime.error(`Update completed, but gateway service restart failed: ${String(err)}`);
		return false;
	}
}
/** Offers to update Operator before doctor when running interactively from an updatable install. */
async function maybeOfferUpdateBeforeDoctor(params) {
	if (!(!require_env.isTruthyEnvValue(process.env.OPERATOR_UPDATE_IN_PROGRESS) && params.options.nonInteractive !== true && params.options.yes !== true && params.options.repair !== true && process.stdin.isTTY) || !params.root) return { updated: false };
	const git = await detectOperatorGitCheckout(params.root);
	if (git === "git") {
		if (!await params.confirm({
			message: "Update Operator from git before running doctor?",
			initialValue: true
		})) return { updated: false };
		require_note.note("Running update…", "Update");
		const serviceInspection = await inspectGatewayServiceForUpdate(params.root);
		const serviceUpdatePolicy = {
			allowGatewayServiceRepair: serviceInspection.allowGatewayServiceRepair,
			allowGatewayActivation: serviceInspection.allowGatewayActivation
		};
		const { progress, stop } = createUpdateProgress(process.stdout.isTTY);
		let result;
		try {
			result = await require_update_runner.runGatewayUpdate({
				cwd: params.root,
				argv1: process.argv[1],
				progress,
				...serviceUpdatePolicy
			});
		} finally {
			stop();
		}
		require_note.note([
			`Status: ${result.status}`,
			`Mode: ${result.mode}`,
			result.root ? `Root: ${result.root}` : null,
			result.reason ? `Reason: ${result.reason}` : null
		].filter(Boolean).join("\n"), "Update result");
		if (result.status === "ok") {
			if (!await restartRunningGatewayServiceAfterUpdate(params.runtime, params.root, serviceUpdatePolicy.allowGatewayActivation)) {
				params.outro("Update completed, but gateway service restart failed.");
				params.runtime.exit(1);
				return {
					updated: true,
					handled: true
				};
			}
			params.outro("Update completed (doctor already ran as part of the update).");
			return {
				updated: true,
				handled: true
			};
		}
		return {
			updated: true,
			handled: false
		};
	}
	if (git === "not-git") require_note.note(["This install is not a git checkout.", `Run \`${require_command_format.formatCliCommand("openclaw update")}\` to update via your package manager (npm/pnpm), then rerun doctor.`].join("\n"), "Update");
	return { updated: false };
}
//#endregion
exports.maybeOfferUpdateBeforeDoctor = maybeOfferUpdateBeforeDoctor;
