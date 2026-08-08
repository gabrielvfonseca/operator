const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/commands/doctor-install.ts
/** Doctor warnings for source checkout installs with missing pnpm runtime state. */
/** Emits install warnings when a source checkout looks npm-installed or lacks source-run deps. */
function noteSourceInstallIssues(root) {
	if (!root) return;
	const srcEntry = node_path.default.join(root, "src", "entry.ts");
	const workspaceMarker = node_path.default.join(root, "pnpm-workspace.yaml");
	if (!node_fs.default.existsSync(workspaceMarker) || !node_fs.default.existsSync(srcEntry)) return;
	const warnings = [];
	const nodeModules = node_path.default.join(root, "node_modules");
	const pnpmStore = node_path.default.join(nodeModules, ".pnpm");
	const tsxBin = node_path.default.join(nodeModules, ".bin", "tsx");
	if (node_fs.default.existsSync(nodeModules) && !node_fs.default.existsSync(pnpmStore)) warnings.push("- node_modules was not installed by pnpm (missing node_modules/.pnpm). Run: pnpm install so bundled plugins can load package-local dependencies.");
	if (node_fs.default.existsSync(node_path.default.join(root, "package-lock.json"))) warnings.push("- package-lock.json present in a pnpm workspace. If you ran npm install, remove it and reinstall with pnpm.");
	if (node_fs.default.existsSync(srcEntry) && !node_fs.default.existsSync(tsxBin)) warnings.push("- tsx binary is missing for source runs. Run: pnpm install.");
	if (warnings.length > 0) require_note.note(warnings.join("\n"), "Install");
}
//#endregion
exports.noteSourceInstallIssues = noteSourceInstallIssues;
