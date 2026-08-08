const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/infra/git-root.ts
const DEFAULT_GIT_DISCOVERY_MAX_DEPTH = 12;
function walkUpFrom(startDir, opts, resolveAtDir) {
	let current = node_path.default.resolve(startDir);
	const maxDepth = opts.maxDepth ?? DEFAULT_GIT_DISCOVERY_MAX_DEPTH;
	for (let i = 0; i < maxDepth; i += 1) {
		const resolved = resolveAtDir(current);
		if (resolved !== null && resolved !== void 0) return resolved;
		const parent = node_path.default.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	return null;
}
function hasGitMarker(repoRoot) {
	const gitPath = node_path.default.join(repoRoot, ".git");
	try {
		const stat = node_fs.default.statSync(gitPath);
		return stat.isDirectory() || stat.isFile();
	} catch {
		return false;
	}
}
function findGitRoot(startDir, opts = {}) {
	return walkUpFrom(startDir, opts, (repoRoot) => hasGitMarker(repoRoot) ? repoRoot : null);
}
function resolveGitDirFromMarker(repoRoot) {
	const gitPath = node_path.default.join(repoRoot, ".git");
	try {
		const stat = node_fs.default.statSync(gitPath);
		if (stat.isDirectory()) return gitPath;
		if (!stat.isFile()) return null;
		const match = node_fs.default.readFileSync(gitPath, "utf-8").match(/gitdir:\s*(.+)/i);
		if (!match?.[1]) return null;
		return node_path.default.resolve(repoRoot, match[1].trim());
	} catch {
		return null;
	}
}
function resolveGitHeadPath(startDir, opts = {}) {
	return walkUpFrom(startDir, opts, (repoRoot) => {
		const gitDir = resolveGitDirFromMarker(repoRoot);
		return gitDir ? node_path.default.join(gitDir, "HEAD") : null;
	});
}
//#endregion
Object.defineProperty(exports, "findGitRoot", {
	enumerable: true,
	get: function() {
		return findGitRoot;
	}
});
Object.defineProperty(exports, "resolveGitHeadPath", {
	enumerable: true,
	get: function() {
		return resolveGitHeadPath;
	}
});
