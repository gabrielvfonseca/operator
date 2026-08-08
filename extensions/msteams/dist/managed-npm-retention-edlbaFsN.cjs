const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-guards-CMMkJCy0.cjs");
require("./install-safe-path-delEgqLr.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/npm-project-roots.ts
function isMissing(error) {
	return (0, _openclaw_fs_safe_path.isNotFoundPathError)(error);
}
function sortPaths(paths) {
	return paths.toSorted((left, right) => left.localeCompare(right));
}
/** Lists project-level npm roots managed below the plugin npm root. */
function listManagedPluginNpmProjectRootsSync(npmRoot) {
	const projectsDir = require_install_paths.resolvePluginNpmProjectsDir(npmRoot);
	try {
		return sortPaths(node_fs.default.readdirSync(projectsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => node_path.default.join(projectsDir, entry.name)));
	} catch (error) {
		if (isMissing(error)) return [];
		throw error;
	}
}
/** Async variant of project-level managed npm root discovery. */
async function listManagedPluginNpmProjectRoots(npmRoot) {
	const projectsDir = require_install_paths.resolvePluginNpmProjectsDir(npmRoot);
	try {
		return sortPaths((await node_fs_promises.default.readdir(projectsDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => node_path.default.join(projectsDir, entry.name)));
	} catch (error) {
		if (isMissing(error)) return [];
		throw error;
	}
}
/** Returns the root npm install plus all managed project npm roots. */
function listManagedPluginNpmRootsSync(npmRoot) {
	return [npmRoot, ...listManagedPluginNpmProjectRootsSync(npmRoot)];
}
/** Async variant of managed npm root discovery. */
async function listManagedPluginNpmRoots(npmRoot) {
	return [npmRoot, ...await listManagedPluginNpmProjectRoots(npmRoot)];
}
//#endregion
//#region src/plugins/managed-npm-retention.ts
var managed_npm_retention_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	cleanupRetainedManagedNpmInstallGenerations: () => cleanupRetainedManagedNpmInstallGenerations,
	clearRetainedManagedNpmInstallMarker: () => clearRetainedManagedNpmInstallMarker,
	hasRetainedManagedNpmInstallMarker: () => hasRetainedManagedNpmInstallMarker,
	markRetainedManagedNpmInstall: () => markRetainedManagedNpmInstall,
	resolveRetainedManagedNpmInstallMarkerPath: () => resolveRetainedManagedNpmInstallMarkerPath,
	resolveRetainedManagedNpmInstallPackageInfo: () => resolveRetainedManagedNpmInstallPackageInfo
});
const RETAINED_MANAGED_NPM_INSTALL_MARKER_DIR = ".operator-retained-npm-installs";
function resolveRetainedManagedNpmInstallPackageInfo(packageDir) {
	const resolvedPackageDir = node_path.default.resolve(packageDir);
	const packageBase = node_path.default.basename(resolvedPackageDir);
	const parentDir = node_path.default.dirname(resolvedPackageDir);
	const parentBase = node_path.default.basename(parentDir);
	const scopedPackage = parentBase.startsWith("@");
	const nodeModulesRoot = scopedPackage ? node_path.default.dirname(parentDir) : parentDir;
	if (node_path.default.basename(nodeModulesRoot) !== "node_modules") return null;
	const packageName = scopedPackage ? `${parentBase}/${packageBase}` : packageBase;
	if (!packageBase || packageBase === "." || !packageName.trim()) return null;
	const projectRoot = node_path.default.dirname(nodeModulesRoot);
	return {
		packageName,
		projectRoot,
		markerPath: node_path.default.join(projectRoot, RETAINED_MANAGED_NPM_INSTALL_MARKER_DIR, `${(0, _openclaw_fs_safe_advanced.safePathSegmentHashed)(packageName)}.json`)
	};
}
function resolveRetainedManagedNpmInstallMarkerPath(packageDir) {
	const info = resolveRetainedManagedNpmInstallPackageInfo(packageDir);
	if (!info) throw new Error("retained npm install marker requires a node_modules package directory");
	return info.markerPath;
}
function hasRetainedManagedNpmInstallMarker(packageDir) {
	const info = resolveRetainedManagedNpmInstallPackageInfo(packageDir);
	return info ? node_fs.default.existsSync(info.markerPath) : false;
}
async function clearRetainedManagedNpmInstallMarker(packageDir) {
	const info = resolveRetainedManagedNpmInstallPackageInfo(packageDir);
	if (!info) return false;
	try {
		await node_fs.default.promises.rm(info.markerPath, { force: true });
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
	try {
		await node_fs.default.promises.rmdir(node_path.default.dirname(info.markerPath));
	} catch {}
	return true;
}
async function markRetainedManagedNpmInstall(params) {
	const info = resolveRetainedManagedNpmInstallPackageInfo(params.packageDir);
	if (!info) return false;
	let stat;
	try {
		stat = await node_fs.default.promises.stat(params.packageDir);
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
	if (!stat.isDirectory()) return false;
	await node_fs.default.promises.mkdir(node_path.default.dirname(info.markerPath), { recursive: true });
	await node_fs.default.promises.writeFile(info.markerPath, `${JSON.stringify({
		version: 1,
		pluginId: params.pluginId,
		retainedAt: params.retainedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
		reason: params.reason
	}, null, 2)}\n`, "utf8");
	return true;
}
function isPathEqualOrInside(parentPath, childPath) {
	const relative = node_path.default.relative(node_path.default.resolve(parentPath), node_path.default.resolve(childPath));
	return relative === "" || relative !== ".." && !relative.startsWith(`..${node_path.default.sep}`);
}
function listManagedNpmPackageDirs(npmRoot) {
	const nodeModulesDir = node_path.default.join(npmRoot, "node_modules");
	let entries;
	try {
		entries = node_fs.default.readdirSync(nodeModulesDir, { withFileTypes: true });
	} catch (error) {
		if (error.code === "ENOENT") return [];
		throw error;
	}
	return entries.flatMap((entry) => {
		if (!entry.isDirectory()) return [];
		if (!entry.name.startsWith("@")) return [node_path.default.join(nodeModulesDir, entry.name)];
		return node_fs.default.readdirSync(node_path.default.join(nodeModulesDir, entry.name), { withFileTypes: true }).filter((scopedEntry) => scopedEntry.isDirectory()).map((scopedEntry) => node_path.default.join(nodeModulesDir, entry.name, scopedEntry.name));
	});
}
async function cleanupRetainedLegacyNpmPackages(params) {
	let removed = 0;
	for (const packageDir of listManagedNpmPackageDirs(params.npmRoot)) {
		if (!hasRetainedManagedNpmInstallMarker(packageDir) || params.activeInstallPaths.some((installPath) => isPathEqualOrInside(packageDir, installPath))) continue;
		try {
			await node_fs.default.promises.rm(packageDir, {
				recursive: true,
				force: true
			});
			await clearRetainedManagedNpmInstallMarker(packageDir);
			removed += 1;
		} catch (error) {
			params.onError?.(error, packageDir);
		}
	}
	return removed;
}
async function cleanupRetainedManagedNpmInstallGenerations(params = {}) {
	const npmDir = params.npmDir ?? require_install_paths.resolveDefaultPluginNpmDir(params.env);
	const projectsDir = require_install_paths.resolvePluginNpmProjectsDir(npmDir);
	const activeInstallPaths = Array.from(params.activeInstallPaths ?? [], (installPath) => node_path.default.resolve(installPath));
	let removed = 0;
	for (const projectRoot of listManagedPluginNpmRootsSync(npmDir)) {
		if (node_path.default.resolve(projectRoot) === node_path.default.resolve(npmDir)) {
			removed += await cleanupRetainedLegacyNpmPackages({
				npmRoot: projectRoot,
				activeInstallPaths,
				onError: params.onError
			});
			continue;
		}
		const markerDir = node_path.default.join(projectRoot, RETAINED_MANAGED_NPM_INSTALL_MARKER_DIR);
		let markerEntries;
		try {
			markerEntries = node_fs.default.readdirSync(markerDir, { withFileTypes: true }).filter((entry) => entry.isFile());
		} catch (error) {
			if (error.code === "ENOENT") continue;
			params.onError?.(error, projectRoot);
			continue;
		}
		if (markerEntries.length === 0 || !isPathEqualOrInside(projectsDir, projectRoot) || activeInstallPaths.some((installPath) => isPathEqualOrInside(projectRoot, installPath))) continue;
		try {
			await node_fs.default.promises.rm(projectRoot, {
				recursive: true,
				force: true
			});
			removed += 1;
		} catch (error) {
			params.onError?.(error, projectRoot);
		}
	}
	return removed;
}
//#endregion
Object.defineProperty(exports, "clearRetainedManagedNpmInstallMarker", {
	enumerable: true,
	get: function() {
		return clearRetainedManagedNpmInstallMarker;
	}
});
Object.defineProperty(exports, "hasRetainedManagedNpmInstallMarker", {
	enumerable: true,
	get: function() {
		return hasRetainedManagedNpmInstallMarker;
	}
});
Object.defineProperty(exports, "listManagedPluginNpmProjectRootsSync", {
	enumerable: true,
	get: function() {
		return listManagedPluginNpmProjectRootsSync;
	}
});
Object.defineProperty(exports, "listManagedPluginNpmRoots", {
	enumerable: true,
	get: function() {
		return listManagedPluginNpmRoots;
	}
});
Object.defineProperty(exports, "listManagedPluginNpmRootsSync", {
	enumerable: true,
	get: function() {
		return listManagedPluginNpmRootsSync;
	}
});
Object.defineProperty(exports, "managed_npm_retention_exports", {
	enumerable: true,
	get: function() {
		return managed_npm_retention_exports;
	}
});
Object.defineProperty(exports, "markRetainedManagedNpmInstall", {
	enumerable: true,
	get: function() {
		return markRetainedManagedNpmInstall;
	}
});
Object.defineProperty(exports, "resolveRetainedManagedNpmInstallMarkerPath", {
	enumerable: true,
	get: function() {
		return resolveRetainedManagedNpmInstallMarkerPath;
	}
});
Object.defineProperty(exports, "resolveRetainedManagedNpmInstallPackageInfo", {
	enumerable: true,
	get: function() {
		return resolveRetainedManagedNpmInstallPackageInfo;
	}
});
