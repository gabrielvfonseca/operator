const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
const require_git_root = require("./git-root-BGq87LF_.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_module = require("node:module");
//#region src/infra/git-commit.ts
const formatCommit = (value) => {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	const match = trimmed.match(/[0-9a-fA-F]{7,40}/);
	if (!match) return null;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(match[0].slice(0, 7));
};
const cachedGitCommitBySearchDir = /* @__PURE__ */ new Map();
function isMissingPathError(error) {
	if (!(error instanceof Error)) return false;
	const code = error.code;
	return code === "ENOENT" || code === "ENOTDIR";
}
const resolveCommitSearchDir = (options) => {
	if (options.cwd) return node_path.default.resolve(options.cwd);
	if (options.moduleUrl) try {
		return node_path.default.dirname((0, node_url.fileURLToPath)(options.moduleUrl));
	} catch {}
	return process.cwd();
};
/** Read at most `limit` bytes from a file to avoid unbounded reads. */
const safeReadFilePrefix = (filePath, limit = 256) => {
	const fd = node_fs.default.openSync(filePath, "r");
	try {
		const buf = Buffer.alloc(limit);
		const bytesRead = node_fs.default.readSync(fd, buf, 0, limit, 0);
		return buf.subarray(0, bytesRead).toString("utf-8");
	} finally {
		node_fs.default.closeSync(fd);
	}
};
const cacheGitCommit = (searchDir, commit) => {
	cachedGitCommitBySearchDir.set(searchDir, commit);
	return commit;
};
const resolveGitLookupDepth = (searchDir, packageRoot) => {
	if (!packageRoot) return;
	const relative = node_path.default.relative(packageRoot, searchDir);
	if (relative.startsWith("..") || node_path.default.isAbsolute(relative)) return;
	return (relative ? relative.split(node_path.default.sep).filter(Boolean).length : 0) + 1;
};
const readCommitFromGit = (searchDir, packageRoot) => {
	const headPath = require_git_root.resolveGitHeadPath(searchDir, { maxDepth: resolveGitLookupDepth(searchDir, packageRoot) });
	if (!headPath) return;
	const head = node_fs.default.readFileSync(headPath, "utf-8").trim();
	if (!head) return null;
	if (head.startsWith("ref:")) {
		const ref = head.replace(/^ref:\s*/i, "").trim();
		const refsBase = resolveGitRefsBase(headPath);
		const refPath = resolveRefPath(refsBase, ref);
		if (!refPath) return null;
		try {
			const refHash = safeReadFilePrefix(refPath).trim();
			return formatCommit(refHash);
		} catch (error) {
			if (!isMissingPathError(error)) throw error;
		}
		return readCommitFromPackedRefs(refsBase, ref);
	}
	return formatCommit(head);
};
const resolveGitRefsBase = (headPath) => {
	const gitDir = node_path.default.dirname(headPath);
	try {
		const commonDir = safeReadFilePrefix(node_path.default.join(gitDir, "commondir")).trim();
		if (commonDir) return node_path.default.resolve(gitDir, commonDir);
	} catch (error) {
		if (!isMissingPathError(error)) throw error;
	}
	return gitDir;
};
const readCommitFromPackedRefs = (refsBase, ref) => {
	try {
		const packedRefs = node_fs.default.readFileSync(node_path.default.join(refsBase, "packed-refs"), "utf-8");
		for (const line of packedRefs.split("\n")) {
			if (!line || line.startsWith("#") || line.startsWith("^")) continue;
			const [commit, packedRef] = line.trim().split(/\s+/, 2);
			if (packedRef === ref) return formatCommit(commit);
		}
		return null;
	} catch (error) {
		if (!isMissingPathError(error)) throw error;
		return null;
	}
};
/** Safely resolve a git ref path, rejecting traversal attacks from a crafted HEAD file. */
const resolveRefPath = (refsBase, ref) => {
	if (!ref.startsWith("refs/")) return null;
	if (node_path.default.isAbsolute(ref)) return null;
	if (ref.split(/[/]/).includes("..")) return null;
	const resolved = node_path.default.resolve(refsBase, ref);
	const rel = node_path.default.relative(refsBase, resolved);
	if (!rel || rel.startsWith("..") || node_path.default.isAbsolute(rel)) return null;
	return resolved;
};
const readCommitFromPackageJson = () => {
	try {
		const pkg = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href)("../../package.json");
		return formatCommit(pkg.gitHead ?? pkg.githead ?? null);
	} catch {
		return null;
	}
};
const readCommitFromBuildInfo = () => {
	try {
		const require = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
		for (const candidate of ["../build-info.json", "./build-info.json"]) try {
			const info = require(candidate);
			const formatted = formatCommit(info.commit ?? null);
			if (formatted) return formatted;
		} catch {}
		return null;
	} catch {
		return null;
	}
};
const resolveCommitHash = (options = {}) => {
	const env = options.env ?? process.env;
	const readers = options.readers ?? {};
	const readGitCommit = readers.readGitCommit ?? readCommitFromGit;
	const envCommit = env.GIT_COMMIT?.trim() || env.GIT_SHA?.trim();
	const normalized = formatCommit(envCommit);
	if (normalized) return normalized;
	const searchDir = resolveCommitSearchDir(options);
	if (cachedGitCommitBySearchDir.has(searchDir)) return cachedGitCommitBySearchDir.get(searchDir) ?? null;
	const packageRoot = require_openclaw_root.resolveOperatorPackageRootSync({
		cwd: options.cwd,
		moduleUrl: options.moduleUrl
	});
	try {
		const gitCommit = readGitCommit(searchDir, packageRoot);
		if (gitCommit !== void 0) return cacheGitCommit(searchDir, gitCommit);
	} catch {}
	const buildInfoCommit = readers.readBuildInfoCommit?.() ?? readCommitFromBuildInfo();
	if (buildInfoCommit) return cacheGitCommit(searchDir, buildInfoCommit);
	const pkgCommit = readers.readPackageJsonCommit?.() ?? readCommitFromPackageJson();
	if (pkgCommit) return cacheGitCommit(searchDir, pkgCommit);
	try {
		return cacheGitCommit(searchDir, readGitCommit(searchDir, packageRoot) ?? null);
	} catch {
		return cacheGitCommit(searchDir, null);
	}
};
//#endregion
Object.defineProperty(exports, "resolveCommitHash", {
	enumerable: true,
	get: function() {
		return resolveCommitHash;
	}
});
