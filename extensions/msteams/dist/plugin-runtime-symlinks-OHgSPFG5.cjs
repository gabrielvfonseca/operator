const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/commands/doctor/shared/plugin-runtime-symlinks.ts
var plugin_runtime_symlinks_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	collectStalePluginRuntimeSymlinkHealthFindings: () => collectStalePluginRuntimeSymlinkHealthFindings,
	noteStalePluginRuntimeSymlinks: () => noteStalePluginRuntimeSymlinks,
	removeStalePluginRuntimeSymlinks: () => removeStalePluginRuntimeSymlinks
});
const PLUGIN_RUNTIME_DEPS_MARKER = "plugin-runtime-deps";
const MAX_REPORTED = 6;
const DEFAULT_FS = {
	readdir: (dir, options) => node_fs_promises.default.readdir(dir, options),
	lstat: (file) => node_fs_promises.default.lstat(file),
	readlink: (file) => node_fs_promises.default.readlink(file),
	stat: (file) => node_fs_promises.default.stat(file),
	rm: (file, options) => node_fs_promises.default.rm(file, options),
	unlink: (file) => node_fs_promises.default.unlink(file)
};
/** Find global node_modules symlinks that still point at stale plugin-runtime deps. */
async function collectStalePluginRuntimeSymlinks(packageRoot, options = {}) {
	if (!packageRoot) return [];
	const containingNodeModules = node_path.default.dirname(packageRoot);
	if (node_path.default.basename(containingNodeModules) !== "node_modules") return [];
	const fsApi = options.fs ?? DEFAULT_FS;
	const staleRoots = uniqueResolvedRoots(options.staleRoots ?? []);
	const stale = [];
	const entries = await fsApi.readdir(containingNodeModules, { withFileTypes: true }).catch(() => []);
	for (const entry of entries) {
		if (entry.isDirectory() && entry.name.startsWith("@")) {
			const scopeDir = node_path.default.join(containingNodeModules, entry.name);
			const scopeEntries = await fsApi.readdir(scopeDir, { withFileTypes: true }).catch(() => []);
			for (const scopeEntry of scopeEntries) {
				const fullPath = node_path.default.join(scopeDir, scopeEntry.name);
				const target = await inspectCandidate(fullPath, fsApi, staleRoots);
				if (target) stale.push({
					name: `${entry.name}/${scopeEntry.name}`,
					path: fullPath,
					target
				});
			}
			continue;
		}
		if (!entry.isSymbolicLink()) continue;
		const fullPath = node_path.default.join(containingNodeModules, entry.name);
		const target = await inspectCandidate(fullPath, fsApi, staleRoots);
		if (target) stale.push({
			name: entry.name,
			path: fullPath,
			target
		});
	}
	return stale.toSorted((left, right) => left.name.localeCompare(right.name));
}
function stalePluginRuntimeSymlinkToHealthFinding(item) {
	return {
		checkId: "core/doctor/stale-plugin-runtime-symlinks",
		severity: "warning",
		message: `Stale plugin-runtime symlink ${item.name} points at ${item.target}.`,
		path: item.path,
		target: item.path,
		requirement: "stale-plugin-runtime-symlink-removed",
		fixHint: "Run `openclaw doctor --fix` to remove stale plugin-runtime symlinks."
	};
}
async function collectStalePluginRuntimeSymlinkHealthFindings(params = {}) {
	return (await collectStalePluginRuntimeSymlinks(params.packageRoot ?? require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	}), params)).map(stalePluginRuntimeSymlinkToHealthFinding);
}
/** Emit a doctor note describing stale plugin-runtime symlinks, if any exist. */
async function noteStalePluginRuntimeSymlinks(packageRoot, options = {}) {
	const stale = await collectStalePluginRuntimeSymlinks(packageRoot, options);
	if (stale.length === 0) return;
	const shortenPath = options.shortenPath ?? require_utils.shortenHomePath;
	const lines = [
		"- Plugin-runtime symlinks under the global Node prefix point at pruned",
		`  ${PLUGIN_RUNTIME_DEPS_MARKER} directories from a previous Operator install.`,
		"- Bundled plugin ESM imports can fail with ERR_MODULE_NOT_FOUND until repaired."
	];
	for (const item of stale.slice(0, MAX_REPORTED)) lines.push(`  - ${item.name} -> ${shortenPath(item.target)}`);
	if (stale.length > MAX_REPORTED) lines.push(`  - ...and ${stale.length - MAX_REPORTED} more`);
	lines.push("- Repair: run `openclaw doctor --fix` to remove the dangling symlinks.");
	(options.noteFn ?? require_note.note)(lines.join("\n"), "Plugin-runtime symlinks");
}
/** Remove stale plugin-runtime symlinks and report changes/warnings. */
async function removeStalePluginRuntimeSymlinks(packageRoot, options = {}) {
	const fsApi = options.fs ?? DEFAULT_FS;
	const changes = [];
	const warnings = [];
	for (const item of await collectStalePluginRuntimeSymlinks(packageRoot, options)) try {
		if (fsApi.unlink) await fsApi.unlink(item.path);
		else await fsApi.rm(item.path, { force: true });
		changes.push(`Removed stale plugin-runtime symlink: ${item.path}`);
	} catch (error) {
		warnings.push(`Failed to remove stale plugin-runtime symlink ${item.path}: ${String(error)}`);
	}
	return {
		changes,
		warnings
	};
}
function uniqueResolvedRoots(values) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(values.map((value) => node_path.default.resolve(value)));
}
function isPathInsideRoot(candidate, root) {
	const relativePath = node_path.default.relative(root, candidate);
	return relativePath === "" || !relativePath.startsWith("..") && !node_path.default.isAbsolute(relativePath);
}
async function inspectCandidate(fullPath, fsApi, staleRoots) {
	if (!(await fsApi.lstat(fullPath).catch(() => null))?.isSymbolicLink()) return null;
	const target = await fsApi.readlink(fullPath).catch(() => null);
	if (!target?.includes(PLUGIN_RUNTIME_DEPS_MARKER)) return null;
	const resolvedTarget = node_path.default.isAbsolute(target) ? target : node_path.default.resolve(node_path.default.dirname(fullPath), target);
	if (staleRoots.some((root) => isPathInsideRoot(resolvedTarget, root))) return resolvedTarget;
	try {
		await fsApi.stat(resolvedTarget);
		return null;
	} catch (error) {
		const code = error?.code;
		return code === "ENOENT" || code === "ENOTDIR" ? resolvedTarget : null;
	}
}
//#endregion
Object.defineProperty(exports, "plugin_runtime_symlinks_exports", {
	enumerable: true,
	get: function() {
		return plugin_runtime_symlinks_exports;
	}
});
Object.defineProperty(exports, "removeStalePluginRuntimeSymlinks", {
	enumerable: true,
	get: function() {
		return removeStalePluginRuntimeSymlinks;
	}
});
