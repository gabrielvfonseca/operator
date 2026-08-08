const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_control_ui_assets = require("./control-ui-assets-CAB0clox.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/commands/doctor-ui.ts
/** Doctor checks and repairs for Control UI assets after gateway protocol changes. */
/** Detects missing or stale Control UI build artifacts relative to protocol schema changes. */
async function detectUiProtocolFreshnessIssues(opts = {}) {
	const root = opts.root ?? await require_openclaw_root.resolveOperatorPackageRoot({
		moduleUrl: require("url").pathToFileURL(__filename).href,
		argv1: opts.argv1 ?? process.argv[1],
		cwd: opts.cwd ?? process.cwd()
	});
	if (!root) return [];
	const schemaPath = node_path.default.join(root, "packages/gateway-protocol/src/schema.ts");
	const uiIndexPath = (await require_control_ui_assets.resolveControlUiDistIndexHealth({
		root,
		argv1: opts.argv1 ?? process.argv[1]
	})).indexPath ?? require_control_ui_assets.resolveControlUiDistIndexPathForRoot(root);
	const uiSourcesPath = node_path.default.join(root, "ui/package.json");
	try {
		const [schemaStats, uiStats, uiSourcesStats] = await Promise.all([
			node_fs_promises.default.stat(schemaPath).catch(() => null),
			node_fs_promises.default.stat(uiIndexPath).catch(() => null),
			node_fs_promises.default.stat(uiSourcesPath).catch(() => null)
		]);
		if (!schemaStats) return [];
		const canBuild = uiSourcesStats !== null;
		if (!uiStats) return [{
			kind: "missing-assets",
			root,
			uiIndexPath,
			canBuild
		}];
		if (schemaStats.mtime <= uiStats.mtime) return [];
		const changesSinceBuild = await (opts.collectChangesSinceBuild ?? collectProtocolSchemaChangesSince)(root, uiStats.mtime);
		if (changesSinceBuild === null || changesSinceBuild.length === 0) return [];
		return [{
			kind: "stale-assets",
			root,
			uiIndexPath,
			changesSinceBuild,
			canBuild
		}];
	} catch {
		return [];
	}
}
async function collectProtocolSchemaChangesSince(root, uiMtime) {
	const gitLog = await require_exec.runCommandWithTimeout([
		"git",
		"-C",
		root,
		"log",
		`--since=${uiMtime.toISOString()}`,
		"--format=%h %s",
		"packages/gateway-protocol/src/schema.ts"
	], { timeoutMs: 5e3 }).catch(() => null);
	if (gitLog?.code !== 0) return null;
	if (!gitLog.stdout.trim()) return [];
	return gitLog.stdout.trim().split("\n");
}
/** Converts a UI protocol freshness issue into a doctor lint health finding. */
function uiProtocolFreshnessIssueToHealthFinding(issue) {
	return {
		checkId: "core/doctor/ui-protocol-freshness",
		severity: "warning",
		message: formatUiProtocolFreshnessIssue(issue),
		path: issue.uiIndexPath,
		fixHint: issue.canBuild ? issue.kind === "missing-assets" ? "Run `openclaw doctor --fix` to build Control UI assets." : "Run `openclaw doctor --fix --force` to rebuild Control UI assets, or run `pnpm ui:build`." : "Install from a source checkout with ui/ sources, then run `pnpm ui:build`."
	};
}
/** Converts a UI freshness issue into the process repair effect used by lint dry runs. */
function uiProtocolFreshnessIssueToRepairEffects(issue) {
	if (!issue.canBuild) return [];
	return [{
		kind: "process",
		action: issue.kind === "missing-assets" ? "would-build-control-ui" : "would-rebuild-control-ui",
		target: issue.root,
		dryRunSafe: false
	}];
}
function formatUiProtocolFreshnessIssue(issue) {
	if (issue.kind === "missing-assets") return ["- Control UI assets are missing.", "- Run: pnpm ui:build"].join("\n");
	if (issue.changesSinceBuild.length === 0) return "UI assets are older than the protocol schema.";
	return `UI assets are older than the protocol schema.\nFunctional changes since last build:\n${issue.changesSinceBuild.map((line) => `- ${line}`).join("\n")}`;
}
/** Prompts to build or rebuild Control UI assets when doctor detects missing or stale output. */
async function maybeRepairUiProtocolFreshness(_runtime, prompter) {
	for (const issue of await detectUiProtocolFreshnessIssues()) {
		if (issue.kind === "missing-assets") {
			require_note.note(formatUiProtocolFreshnessIssue(issue), "UI");
			if (!issue.canBuild) {
				require_note.note("Skipping UI build: ui/ sources not present.", "UI");
				continue;
			}
			if (await prompter.confirmAutoFix({
				message: "Build Control UI assets now?",
				initialValue: true
			})) {
				require_note.note("Building Control UI assets... (this may take a moment)", "UI");
				const uiScriptPath = node_path.default.join(issue.root, "scripts/ui.js");
				const buildResult = await require_exec.runCommandWithTimeout([
					process.execPath,
					uiScriptPath,
					"build"
				], {
					cwd: issue.root,
					timeoutMs: 12e4,
					env: {
						...process.env,
						FORCE_COLOR: "1"
					}
				});
				if (buildResult.code === 0) require_note.note("UI build complete.", "UI");
				else require_note.note([`UI build failed (exit ${buildResult.code ?? "unknown"}).`, buildResult.stderr.trim() ? buildResult.stderr.trim() : null].filter(Boolean).join("\n"), "UI");
			}
			continue;
		}
		require_note.note(formatUiProtocolFreshnessIssue(issue), "UI Freshness");
		if (!issue.canBuild) {
			require_note.note("Skipping UI rebuild: ui/ sources not present.", "UI");
			continue;
		}
		if (await prompter.confirmAggressiveAutoFix({
			message: "Rebuild UI now? (Detected protocol mismatch requiring update)",
			initialValue: true
		})) {
			require_note.note("Rebuilding stale UI assets... (this may take a moment)", "UI");
			const uiScriptPath = node_path.default.join(issue.root, "scripts/ui.js");
			const buildResult = await require_exec.runCommandWithTimeout([
				process.execPath,
				uiScriptPath,
				"build"
			], {
				cwd: issue.root,
				timeoutMs: 12e4,
				env: {
					...process.env,
					FORCE_COLOR: "1"
				}
			});
			if (buildResult.code === 0) require_note.note("UI rebuild complete.", "UI");
			else require_note.note([`UI rebuild failed (exit ${buildResult.code ?? "unknown"}).`, buildResult.stderr.trim() ? buildResult.stderr.trim() : null].filter(Boolean).join("\n"), "UI");
		}
	}
}
//#endregion
exports.detectUiProtocolFreshnessIssues = detectUiProtocolFreshnessIssues;
exports.maybeRepairUiProtocolFreshness = maybeRepairUiProtocolFreshness;
exports.uiProtocolFreshnessIssueToHealthFinding = uiProtocolFreshnessIssueToHealthFinding;
exports.uiProtocolFreshnessIssueToRepairEffects = uiProtocolFreshnessIssueToRepairEffects;
