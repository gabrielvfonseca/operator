const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_plugin_runtime_symlinks = require("./plugin-runtime-symlinks-OHgSPFG5.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/commands/doctor/shared/plugin-dependency-cleanup.ts
const LEGACY_DIRECT_CHILD_NAMES = /* @__PURE__ */ new Set(["plugin-runtime-deps", "bundled-plugin-runtime-deps"]);
function uniqueSorted(values) {
	return [...new Set([...values].filter((value) => typeof value === "string" && value.length > 0).map((value) => node_path.default.resolve(value)))].toSorted((left, right) => left.localeCompare(right));
}
function splitPathList(value) {
	return value ? value.split(node_path.default.delimiter).map((entry) => entry.trim()).filter(Boolean) : [];
}
function hasParentPathSegment(value) {
	return value.split(/[\\/]+/u).includes("..");
}
async function pathExists(targetPath) {
	try {
		await node_fs_promises.default.lstat(targetPath);
		return true;
	} catch {
		return false;
	}
}
function isRuntimeDependencyMarkerName(name) {
	return name === ".operator-runtime-deps.json" || name === ".operator-runtime-deps-stamp.json" || name.startsWith(".operator-runtime-deps-");
}
function isInstallStageDebrisName(name) {
	return /^\.operator-install-stage(?:-.+)?$/u.test(name);
}
function isLegacyDependencyDebrisName(name) {
	return isRuntimeDependencyMarkerName(name) || name === ".operator-pnpm-store" || name === ".operator-install-backups" || isInstallStageDebrisName(name);
}
function isExpectedLegacyCleanupTargetName(name) {
	return name === "node_modules" || LEGACY_DIRECT_CHILD_NAMES.has(name) || isLegacyDependencyDebrisName(name);
}
async function isFile(targetPath) {
	return (await node_fs_promises.default.lstat(targetPath).catch(() => null))?.isFile() === true;
}
function isPathInsideRoot(candidate, root) {
	const relativePath = node_path.default.relative(root, candidate);
	return relativePath === "" || !relativePath.startsWith("..") && !node_path.default.isAbsolute(relativePath);
}
async function collectDirectChildren(root) {
	return (await node_fs_promises.default.readdir(root, { withFileTypes: true }).catch(() => [])).map((entry) => node_path.default.join(root, entry.name));
}
async function isDirectoryInCleanupRoot(candidate, cleanupRootRealPath) {
	const stat = await node_fs_promises.default.lstat(candidate).catch(() => null);
	if (!stat?.isDirectory() && !stat?.isSymbolicLink()) return false;
	const realPath = await node_fs_promises.default.realpath(candidate).catch(() => null);
	return realPath !== null && isPathInsideRoot(realPath, cleanupRootRealPath);
}
async function collectLegacyExtensionDebris(extensionsRoot, cleanupRootRealPath) {
	if (!await isDirectoryInCleanupRoot(extensionsRoot, cleanupRootRealPath)) return [];
	const pluginDirs = await node_fs_promises.default.readdir(extensionsRoot, { withFileTypes: true }).catch(() => []);
	const targets = [];
	for (const entry of pluginDirs) {
		if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
		const pluginRoot = node_path.default.join(extensionsRoot, entry.name);
		if (!await isDirectoryInCleanupRoot(pluginRoot, cleanupRootRealPath)) continue;
		const children = await collectDirectChildren(pluginRoot);
		const hasRuntimeDepsMarker = children.some((childPath) => isRuntimeDependencyMarkerName(node_path.default.basename(childPath)));
		for (const childPath of children) {
			const basename = node_path.default.basename(childPath);
			if (basename === "node_modules" && hasRuntimeDepsMarker) {
				targets.push(childPath);
				continue;
			}
			if (isLegacyDependencyDebrisName(basename)) targets.push(childPath);
		}
	}
	return targets;
}
function collectCleanupRootPaths(env, packageRoot) {
	const stateDirectoryRoots = splitPathList(env.STATE_DIRECTORY).map((entry) => require_home_dir.resolveUserPath(entry, env));
	return uniqueSorted([
		require_paths.resolveStateDir(env),
		require_utils.resolveConfigDir(env),
		packageRoot,
		...stateDirectoryRoots
	]);
}
async function collectExistingCleanupRoots(cleanupRootPaths) {
	const roots = [];
	for (const rootPath of cleanupRootPaths) {
		if (!(await node_fs_promises.default.stat(rootPath).catch(() => null))?.isDirectory()) continue;
		const realPath = await node_fs_promises.default.realpath(rootPath).catch(() => null);
		if (realPath === null) continue;
		roots.push({ realPath });
	}
	return roots;
}
function collectExplicitStageTargets(env) {
	return splitPathList(env.OPERATOR_PLUGIN_STAGE_DIR).map((entry) => ({
		kind: "explicit-stage",
		path: require_home_dir.resolveUserPath(entry, env),
		rawPath: entry
	}));
}
async function hasOperatorRenameResidue(root) {
	const nodeModulesRoot = node_path.default.join(root, "node_modules");
	if (await isFile(node_path.default.join(nodeModulesRoot, ".operator-rename-tmp"))) return true;
	const entries = await node_fs_promises.default.readdir(nodeModulesRoot, { withFileTypes: true }).catch(() => []);
	for (const entry of entries) {
		if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
		const entryPath = node_path.default.join(nodeModulesRoot, entry.name);
		if (await isFile(node_path.default.join(entryPath, ".operator-rename-tmp"))) return true;
		if (!entry.name.startsWith("@")) continue;
		const scopedEntries = await node_fs_promises.default.readdir(entryPath, { withFileTypes: true }).catch(() => []);
		for (const scopedEntry of scopedEntries) {
			if (!scopedEntry.isDirectory() || scopedEntry.isSymbolicLink()) continue;
			if (await isFile(node_path.default.join(entryPath, scopedEntry.name, ".operator-rename-tmp"))) return true;
		}
	}
	return false;
}
async function hasExplicitStageDebrisProof(root) {
	if ((await collectDirectChildren(root)).some((childPath) => isRuntimeDependencyMarkerName(node_path.default.basename(childPath)))) return true;
	return await hasOperatorRenameResidue(root);
}
function filterLegacyStaleRootCandidates(targets, cleanupRootPaths) {
	const safeTargets = [];
	const warnings = [];
	const seen = /* @__PURE__ */ new Set();
	for (const target of targets) {
		const targetPath = node_path.default.resolve(target.path);
		if (seen.has(targetPath)) continue;
		seen.add(targetPath);
		if (target.kind === "explicit-stage") {
			if (target.rawPath && hasParentPathSegment(target.rawPath)) {
				warnings.push(`Skipped legacy plugin dependency state ${targetPath}: parent path segments are not allowed`);
				continue;
			}
			safeTargets.push({
				...target,
				path: targetPath
			});
			continue;
		}
		if (!isExpectedLegacyCleanupTargetName(node_path.default.basename(targetPath))) {
			warnings.push(`Skipped legacy plugin dependency state ${targetPath}: unexpected path name`);
			continue;
		}
		if (!cleanupRootPaths.some((rootPath) => isPathInsideRoot(targetPath, rootPath))) {
			warnings.push(`Skipped legacy plugin dependency state ${targetPath}: outside Operator cleanup roots`);
			continue;
		}
		safeTargets.push({
			...target,
			path: targetPath
		});
	}
	return {
		targets: safeTargets.toSorted((left, right) => left.path.localeCompare(right.path)),
		warnings
	};
}
async function resolveSafeRemovalTarget(target, cleanupRoots) {
	const targetPath = node_path.default.resolve(target.path);
	const stat = await node_fs_promises.default.lstat(targetPath).catch(() => null);
	if (target.kind === "explicit-stage" && stat?.isSymbolicLink()) return { warning: `Skipped legacy plugin dependency state ${targetPath}: symbolic link roots are not removed` };
	const realPath = await node_fs_promises.default.realpath(targetPath).catch(() => null);
	if (realPath === null) return { warning: `Skipped legacy plugin dependency state ${targetPath}: could not resolve path` };
	if (target.kind === "explicit-stage") {
		if (!isInstallStageDebrisName(node_path.default.basename(targetPath)) && !await hasExplicitStageDebrisProof(targetPath)) return { warning: `Skipped legacy plugin dependency state ${targetPath}: unexpected path name` };
		return { target: targetPath };
	}
	if (!cleanupRoots.some((root) => isPathInsideRoot(realPath, root.realPath))) return { warning: `Skipped legacy plugin dependency state ${targetPath}: resolved outside Operator cleanup roots` };
	return { target: targetPath };
}
async function prepareCleanupTargets(targets, cleanupRoots) {
	const removalTargets = [];
	const staleRoots = [];
	const warnings = [];
	for (const target of targets) {
		if (!await pathExists(target.path)) continue;
		const safeTarget = await resolveSafeRemovalTarget(target, cleanupRoots);
		if ("warning" in safeTarget) {
			warnings.push(safeTarget.warning);
			continue;
		}
		removalTargets.push(safeTarget.target);
		staleRoots.push(safeTarget.target);
	}
	return {
		removalTargets: uniqueSorted(removalTargets),
		staleRoots: uniqueSorted(staleRoots),
		warnings
	};
}
async function collectLegacyPluginDependencyTargetEntries(env = process.env, options = {}) {
	const packageRoot = options.packageRoot ?? require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	});
	const roots = uniqueSorted([
		require_paths.resolveStateDir(env),
		require_utils.resolveConfigDir(env),
		packageRoot
	]);
	const stateDirectoryRoots = splitPathList(env.STATE_DIRECTORY).map((entry) => ({
		kind: "legacy",
		path: node_path.default.join(require_home_dir.resolveUserPath(entry, env), "plugin-runtime-deps")
	}));
	const targets = [
		...collectExplicitStageTargets(env),
		...stateDirectoryRoots,
		...roots.flatMap((root) => [...[...LEGACY_DIRECT_CHILD_NAMES].map((name) => ({
			kind: "legacy",
			path: node_path.default.join(root, name)
		})), {
			kind: "legacy",
			path: node_path.default.join(root, ".local", "bundled-plugin-runtime-deps")
		}])
	];
	for (const root of roots) {
		const rootRealPath = await node_fs_promises.default.realpath(root).catch(() => null);
		if (rootRealPath === null) continue;
		targets.push(...(await collectLegacyExtensionDebris(node_path.default.join(root, "extensions"), rootRealPath)).map((targetPath) => ({
			kind: "legacy",
			path: targetPath
		})));
		targets.push(...(await collectLegacyExtensionDebris(node_path.default.join(root, "dist", "extensions"), rootRealPath)).map((targetPath) => ({
			kind: "legacy",
			path: targetPath
		})));
	}
	return targets.toSorted((left, right) => left.path.localeCompare(right.path));
}
async function collectLegacyPluginDependencyTargets(env = process.env, options = {}) {
	return uniqueSorted((await collectLegacyPluginDependencyTargetEntries(env, options)).map((target) => target.path));
}
/** Find stale legacy plugin dependency state that doctor --fix can remove. */
async function detectLegacyPluginDependencyStateIssues(params = {}) {
	const env = params.env ?? process.env;
	const packageRoot = params.packageRoot ?? require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	});
	const targets = await collectLegacyPluginDependencyTargetEntries(env, { packageRoot });
	const cleanupRootPaths = collectCleanupRootPaths(env, packageRoot);
	const cleanupRoots = await collectExistingCleanupRoots(cleanupRootPaths);
	return (await prepareCleanupTargets(filterLegacyStaleRootCandidates(targets, cleanupRootPaths).targets, cleanupRoots)).removalTargets.map((target) => ({
		kind: "legacy-plugin-dependency-state",
		path: target
	}));
}
function legacyPluginDependencyStateIssueToHealthFinding(issue) {
	return {
		checkId: "core/doctor/legacy-plugin-dependencies",
		severity: "warning",
		message: `Legacy plugin dependency state remains at ${issue.path}.`,
		target: issue.path,
		path: issue.path,
		requirement: "legacy-plugin-dependency-state-removed",
		fixHint: "Run `openclaw doctor --fix` to remove legacy plugin dependency state."
	};
}
/** Remove legacy plugin dependency state under trusted Operator cleanup roots. */
async function cleanupLegacyPluginDependencyState(params) {
	const env = params.env ?? process.env;
	const changes = [];
	const warnings = [];
	const packageRoot = params.packageRoot ?? require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	});
	const targets = await collectLegacyPluginDependencyTargetEntries(env, { packageRoot });
	const cleanupRootPaths = collectCleanupRootPaths(env, packageRoot);
	const cleanupRoots = await collectExistingCleanupRoots(cleanupRootPaths);
	const staleRootCandidates = filterLegacyStaleRootCandidates(targets, cleanupRootPaths);
	warnings.push(...staleRootCandidates.warnings);
	const preparedTargets = await prepareCleanupTargets(staleRootCandidates.targets, cleanupRoots);
	warnings.push(...preparedTargets.warnings);
	const staleSymlinks = await require_plugin_runtime_symlinks.removeStalePluginRuntimeSymlinks(packageRoot, { staleRoots: preparedTargets.staleRoots });
	changes.push(...staleSymlinks.changes);
	warnings.push(...staleSymlinks.warnings);
	for (const target of preparedTargets.removalTargets) try {
		await node_fs_promises.default.rm(target, {
			recursive: true,
			force: true
		});
		changes.push(`Removed legacy plugin dependency state: ${target}`);
	} catch (error) {
		warnings.push(`Failed to remove legacy plugin dependency state ${target}: ${String(error)}`);
	}
	return {
		changes,
		warnings
	};
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.pluginDependencyCleanupTestApi")] = { collectLegacyPluginDependencyTargets };
//#endregion
exports.cleanupLegacyPluginDependencyState = cleanupLegacyPluginDependencyState;
exports.detectLegacyPluginDependencyStateIssues = detectLegacyPluginDependencyStateIssues;
exports.legacyPluginDependencyStateIssueToHealthFinding = legacyPluginDependencyStateIssueToHealthFinding;
