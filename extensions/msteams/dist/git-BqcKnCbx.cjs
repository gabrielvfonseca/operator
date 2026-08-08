const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/agents/worktrees/git.ts
const GIT_TIMEOUT_MS = 12e4;
async function runGit(cwd, args, options = {}) {
	return await require_exec.runCommandWithTimeout([
		"git",
		"-C",
		cwd,
		...args
	], {
		timeoutMs: GIT_TIMEOUT_MS,
		env: options.env,
		input: options.input
	});
}
function commandError(command, result) {
	const detail = (result.stderr || result.stdout).trim().split("\n").slice(-12).join("\n");
	return /* @__PURE__ */ new Error(`${command} failed${detail ? `:\n${detail}` : ""}`);
}
async function requireGit(cwd, args, options = {}) {
	const result = await runGit(cwd, args, options);
	if (result.code !== 0) throw commandError(`git ${args.join(" ")}`, result);
	return result.stdout.trim();
}
async function requireGitRaw(cwd, args) {
	const result = await runGit(cwd, args);
	if (result.code !== 0) throw commandError(`git ${args.join(" ")}`, result);
	return result.stdout;
}
function parseWorktreeList(output) {
	const entries = [];
	let current;
	for (const field of output.split("\0")) {
		if (!field) {
			if (current) {
				entries.push(current);
				current = void 0;
			}
			continue;
		}
		if (field.startsWith("worktree ")) {
			if (current) entries.push(current);
			current = { path: field.slice(9) };
		} else if (current && field === "locked") current.lockedReason = "";
		else if (current && field.startsWith("locked ")) current.lockedReason = field.slice(7);
	}
	if (current) entries.push(current);
	return entries;
}
async function listGitWorktrees(repoRoot) {
	return parseWorktreeList(await requireGitRaw(repoRoot, [
		"worktree",
		"list",
		"--porcelain",
		"-z"
	]));
}
/**
* True when dir sits inside a git checkout: a .git entry on itself or any ancestor.
* Existence, not directory-ness, is the signal — linked worktrees keep a .git file.
* Mirrors `git rev-parse --show-toplevel` discovery without spawning git, so UI
* capability checks and create-preflights cannot diverge from the worktree service.
*/
function findGitCheckoutRoot(start) {
	let current = node_path.default.resolve(start);
	for (;;) {
		if ((0, node_fs.existsSync)(node_path.default.join(current, ".git"))) return current;
		const parent = node_path.default.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}
function insideGitCheckout(start) {
	return findGitCheckoutRoot(start) !== null;
}
async function pathExists(target) {
	try {
		await node_fs_promises.default.lstat(target);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
async function removeEmptyParents(start, stop) {
	let current = start;
	while (current.startsWith(`${stop}${node_path.default.sep}`)) {
		try {
			await node_fs_promises.default.rmdir(current);
		} catch {
			return;
		}
		current = node_path.default.dirname(current);
	}
}
//#endregion
Object.defineProperty(exports, "commandError", {
	enumerable: true,
	get: function() {
		return commandError;
	}
});
Object.defineProperty(exports, "insideGitCheckout", {
	enumerable: true,
	get: function() {
		return insideGitCheckout;
	}
});
Object.defineProperty(exports, "listGitWorktrees", {
	enumerable: true,
	get: function() {
		return listGitWorktrees;
	}
});
Object.defineProperty(exports, "pathExists", {
	enumerable: true,
	get: function() {
		return pathExists;
	}
});
Object.defineProperty(exports, "removeEmptyParents", {
	enumerable: true,
	get: function() {
		return removeEmptyParents;
	}
});
Object.defineProperty(exports, "requireGit", {
	enumerable: true,
	get: function() {
		return requireGit;
	}
});
Object.defineProperty(exports, "requireGitRaw", {
	enumerable: true,
	get: function() {
		return requireGitRaw;
	}
});
Object.defineProperty(exports, "runGit", {
	enumerable: true,
	get: function() {
		return runGit;
	}
});
