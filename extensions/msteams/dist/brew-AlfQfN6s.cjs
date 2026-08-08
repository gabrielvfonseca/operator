const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
//#region src/infra/brew.ts
function isExecutable(filePath) {
	try {
		node_fs.default.accessSync(filePath, node_fs.default.constants.X_OK);
		return true;
	} catch {
		return false;
	}
}
function resolveBrewFromPath(pathEnv = process.env.PATH) {
	for (const dir of (pathEnv ?? "").split(node_path.default.delimiter)) {
		const trimmed = dir.trim();
		if (!trimmed || !node_path.default.isAbsolute(trimmed)) continue;
		const candidate = node_path.default.join(trimmed, "brew");
		if (isExecutable(candidate)) return candidate;
	}
}
/** Returns standard Homebrew bin directories suitable for PATH augmentation. */
function resolveBrewPathDirs(opts) {
	const homeDir = opts?.homeDir ?? node_os.default.homedir();
	const dirs = [];
	dirs.push(node_path.default.join(homeDir, ".linuxbrew", "bin"));
	dirs.push(node_path.default.join(homeDir, ".linuxbrew", "sbin"));
	dirs.push("/home/linuxbrew/.linuxbrew/bin", "/home/linuxbrew/.linuxbrew/sbin");
	dirs.push("/opt/homebrew/bin", "/usr/local/bin");
	return dirs;
}
/** Resolves an executable `brew` path from trusted PATH entries or standard install roots. */
function resolveBrewExecutable(opts) {
	const homeDir = opts?.homeDir ?? node_os.default.homedir();
	const pathBrew = resolveBrewFromPath();
	if (pathBrew) return pathBrew;
	const candidates = [];
	candidates.push(node_path.default.join(homeDir, ".linuxbrew", "bin", "brew"));
	candidates.push("/home/linuxbrew/.linuxbrew/bin/brew");
	candidates.push("/opt/homebrew/bin/brew", "/usr/local/bin/brew");
	for (const candidate of candidates) if (isExecutable(candidate)) return candidate;
}
//#endregion
Object.defineProperty(exports, "resolveBrewExecutable", {
	enumerable: true,
	get: function() {
		return resolveBrewExecutable;
	}
});
Object.defineProperty(exports, "resolveBrewPathDirs", {
	enumerable: true,
	get: function() {
		return resolveBrewPathDirs;
	}
});
