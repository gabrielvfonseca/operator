const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/plugins/plugin-peer-link.ts
function readStringRecord(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
	const record = {};
	for (const [key, raw] of Object.entries(value)) if (typeof raw === "string") record[key] = raw;
	return record;
}
async function readPackagePeerDependencies(packageDir) {
	try {
		const raw = await node_fs_promises.default.readFile(node_path.default.join(packageDir, "package.json"), "utf8");
		return readStringRecord(JSON.parse(raw).peerDependencies);
	} catch (error) {
		if (error.code === "ENOENT") return {};
		throw error;
	}
}
async function listManagedNpmRootPackageDirs(npmRoot) {
	const nodeModulesDir = node_path.default.join(npmRoot, "node_modules");
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(nodeModulesDir, { withFileTypes: true });
	} catch (error) {
		if (error.code === "ENOENT") return [];
		throw error;
	}
	const packageDirs = [];
	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name === ".bin") continue;
		const entryPath = node_path.default.join(nodeModulesDir, entry.name);
		if (entry.name.startsWith("@")) {
			const scopedEntries = await node_fs_promises.default.readdir(entryPath, { withFileTypes: true }).catch((error) => {
				if (error.code === "ENOENT") return [];
				throw error;
			});
			for (const scopedEntry of scopedEntries) if (scopedEntry.isDirectory()) packageDirs.push(node_path.default.join(entryPath, scopedEntry.name));
			continue;
		}
		if (!entry.name.startsWith(".")) packageDirs.push(entryPath);
	}
	return packageDirs.toSorted((a, b) => a.localeCompare(b));
}
async function safeRealpath(filePath) {
	try {
		return await node_fs_promises.default.realpath(filePath);
	} catch {
		return null;
	}
}
function managedPackageNameFromDir(params) {
	return node_path.default.relative(node_path.default.join(params.npmRoot, "node_modules"), params.packageDir).split(node_path.default.sep).join("/");
}
async function auditOperatorPeerDependency(params) {
	const packageName = params.packageName ?? (params.npmRoot ? managedPackageNameFromDir({
		npmRoot: params.npmRoot,
		packageDir: params.packageDir
	}) : node_path.default.basename(params.packageDir));
	const nodeModulesDir = node_path.default.join(params.packageDir, "node_modules");
	try {
		const existing = await node_fs_promises.default.lstat(nodeModulesDir);
		if (!existing.isDirectory() || existing.isSymbolicLink()) return {
			packageName,
			packageDir: params.packageDir,
			reason: `${nodeModulesDir} is not a real directory`
		};
	} catch (error) {
		if (error.code === "ENOENT") return {
			packageName,
			packageDir: params.packageDir,
			reason: `missing ${node_path.default.join(nodeModulesDir, "@gabrielvfonseca/operator")}`
		};
		throw error;
	}
	const linkPath = node_path.default.join(nodeModulesDir, "@gabrielvfonseca/operator");
	const currentTarget = await safeRealpath(linkPath);
	if (!currentTarget) return {
		packageName,
		packageDir: params.packageDir,
		reason: `missing ${linkPath}`
	};
	const expectedTarget = await safeRealpath(params.hostRoot) ?? params.hostRoot;
	if (currentTarget !== expectedTarget) return {
		packageName,
		packageDir: params.packageDir,
		reason: `${linkPath} points to ${currentTarget} instead of ${expectedTarget}`
	};
	return null;
}
async function auditOperatorPeerDependencyLink(params) {
	const packageName = params.packageName ?? node_path.default.basename(params.packageDir);
	const hostRoot = require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	});
	if (!hostRoot) return {
		packageName,
		packageDir: params.packageDir,
		reason: "could not locate openclaw package root"
	};
	return await auditOperatorPeerDependency({
		hostRoot,
		packageDir: params.packageDir,
		packageName
	});
}
async function ensureRealNodeModulesDir(params) {
	const nodeModulesDir = node_path.default.join(params.installedDir, "node_modules");
	try {
		const existing = await node_fs_promises.default.lstat(nodeModulesDir);
		if (!existing.isDirectory() || existing.isSymbolicLink()) {
			params.logger.warn?.(`Skipping openclaw peerDependency link because ${nodeModulesDir} is not a real directory.`);
			return null;
		}
		return nodeModulesDir;
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	await node_fs_promises.default.mkdir(nodeModulesDir, { recursive: true });
	const created = await node_fs_promises.default.lstat(nodeModulesDir);
	if (!created.isDirectory() || created.isSymbolicLink()) {
		params.logger.warn?.(`Skipping openclaw peerDependency link because ${nodeModulesDir} is not a real directory.`);
		return null;
	}
	return nodeModulesDir;
}
async function linkOperatorPeerDependency(params) {
	const nodeModulesDir = await ensureRealNodeModulesDir({
		installedDir: params.installedDir,
		logger: params.logger
	});
	if (!nodeModulesDir) return "skipped";
	const linkPath = node_path.default.join(nodeModulesDir, params.peerName);
	const expectedTarget = await safeRealpath(params.hostRoot) ?? params.hostRoot;
	if (await safeRealpath(linkPath) === expectedTarget) return "unchanged";
	try {
		const existing = await node_fs_promises.default.lstat(linkPath).catch((err) => {
			if (require_errors.hasErrnoCode(err, "ENOENT")) return null;
			throw err;
		});
		if (existing) {
			if (!existing.isSymbolicLink()) {
				if (params.peerName === "@gabrielvfonseca/operator" && existing.isDirectory()) {
					if (await readPackageName(linkPath) === "@gabrielvfonseca/operator") {
						await node_fs_promises.default.rm(linkPath, {
							recursive: true,
							force: true
						});
						await node_fs_promises.default.symlink(params.hostRoot, linkPath, "junction");
						params.logger.info?.(`Linked peerDependency "${params.peerName}" -> ${params.hostRoot}`);
						return "linked";
					}
				}
				params.logger.warn?.(`Skipping openclaw peerDependency link because ${linkPath} already exists and is not a symlink.`);
				return "skipped";
			}
			await node_fs_promises.default.unlink(linkPath);
		}
		await node_fs_promises.default.symlink(params.hostRoot, linkPath, "junction");
		params.logger.info?.(`Linked peerDependency "${params.peerName}" -> ${params.hostRoot}`);
		return "linked";
	} catch (err) {
		params.logger.warn?.(`Failed to symlink peerDependency "${params.peerName}": ${String(err)}`);
		return "skipped";
	}
}
async function readPackageName(packageDir) {
	try {
		const raw = await node_fs_promises.default.readFile(node_path.default.join(packageDir, "package.json"), "utf8");
		const parsed = JSON.parse(raw);
		return typeof parsed.name === "string" ? parsed.name : void 0;
	} catch (error) {
		if (error.code === "ENOENT") return;
		throw error;
	}
}
/**
* Symlink the host openclaw package for plugins that declare it as a peer.
* Plugin package managers still own third-party dependencies; this only wires
* the host SDK package into the plugin-local Node graph.
*/
async function linkOperatorPeerDependencies(params) {
	const peers = Object.keys(params.peerDependencies).filter((name) => name === "@gabrielvfonseca/operator");
	if (peers.length === 0) return {
		repaired: 0,
		skipped: 0
	};
	const hostRoot = require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	});
	if (!hostRoot) {
		params.logger.warn?.("Could not locate openclaw package root to symlink peerDependencies; plugin may fail to resolve openclaw at runtime.");
		return {
			repaired: 0,
			skipped: peers.length
		};
	}
	let repaired = 0;
	let skipped = 0;
	for (const peerName of peers) {
		const result = await linkOperatorPeerDependency({
			hostRoot,
			installedDir: params.installedDir,
			peerName,
			logger: params.logger
		});
		if (result === "linked") repaired += 1;
		else if (result === "skipped") skipped += 1;
	}
	return {
		repaired,
		skipped
	};
}
async function relinkOperatorPeerDependenciesInManagedNpmRoot(params) {
	let checked = 0;
	let attempted = 0;
	let repaired = 0;
	let skipped = 0;
	for (const packageDir of await listManagedNpmRootPackageDirs(params.npmRoot)) {
		const peerDependencies = await readPackagePeerDependencies(packageDir);
		if (!Object.hasOwn(peerDependencies, "@gabrielvfonseca/operator")) continue;
		checked += 1;
		const result = await linkOperatorPeerDependencies({
			installedDir: packageDir,
			peerDependencies,
			logger: params.logger
		});
		attempted += 1;
		repaired += result.repaired;
		skipped += result.skipped;
	}
	return {
		checked,
		attempted,
		repaired,
		skipped
	};
}
async function auditOperatorPeerDependenciesInManagedNpmRoot(params) {
	const hostRoot = require_openclaw_root.resolveOperatorPackageRootSync({
		argv1: process.argv[1],
		moduleUrl: require("url").pathToFileURL(__filename).href,
		cwd: process.cwd()
	});
	if (!hostRoot) return {
		checked: 0,
		broken: 0,
		issues: []
	};
	let checked = 0;
	const issues = [];
	for (const packageDir of await listManagedNpmRootPackageDirs(params.npmRoot)) {
		const peerDependencies = await readPackagePeerDependencies(packageDir);
		if (!Object.hasOwn(peerDependencies, "@gabrielvfonseca/operator")) continue;
		checked += 1;
		const issue = await auditOperatorPeerDependency({
			hostRoot,
			npmRoot: params.npmRoot,
			packageDir
		});
		if (issue) issues.push(issue);
	}
	return {
		checked,
		broken: issues.length,
		issues
	};
}
//#endregion
Object.defineProperty(exports, "auditOperatorPeerDependenciesInManagedNpmRoot", {
	enumerable: true,
	get: function() {
		return auditOperatorPeerDependenciesInManagedNpmRoot;
	}
});
Object.defineProperty(exports, "auditOperatorPeerDependencyLink", {
	enumerable: true,
	get: function() {
		return auditOperatorPeerDependencyLink;
	}
});
Object.defineProperty(exports, "linkOperatorPeerDependencies", {
	enumerable: true,
	get: function() {
		return linkOperatorPeerDependencies;
	}
});
Object.defineProperty(exports, "relinkOperatorPeerDependenciesInManagedNpmRoot", {
	enumerable: true,
	get: function() {
		return relinkOperatorPeerDependenciesInManagedNpmRoot;
	}
});
