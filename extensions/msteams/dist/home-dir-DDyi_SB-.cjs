const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
//#region src/infra/safe-cwd.ts
function tryProcessCwd() {
	try {
		return process.cwd();
	} catch {
		return;
	}
}
//#endregion
//#region src/infra/home-dir.ts
function normalize(value) {
	const trimmed = value?.trim();
	if (!trimmed || trimmed === "undefined" || trimmed === "null") return;
	return trimmed;
}
function normalizeSafe(homedir) {
	try {
		return normalize(homedir());
	} catch {
		return;
	}
}
function resolveTermuxHome(env) {
	const prefix = normalize(env.PREFIX);
	if (!prefix || !normalize(env.ANDROID_DATA)) return;
	if (!/(?:^|\/)com\.termux\/files\/usr\/?$/u.test(prefix.replace(/\\/gu, "/"))) return;
	return node_path.default.resolve(prefix, "..", "home");
}
function resolveRawOsHomeDir(env, homedir) {
	return normalize(env.HOME) ?? normalize(env.USERPROFILE) ?? resolveTermuxHome(env) ?? normalizeSafe(homedir);
}
function resolveRawHomeDir(env, homedir) {
	const explicitHome = normalize(env.OPERATOR_HOME);
	if (!explicitHome) return resolveRawOsHomeDir(env, homedir);
	if (explicitHome === "~" || explicitHome.startsWith("~/") || explicitHome.startsWith("~\\")) {
		const fallbackHome = resolveRawOsHomeDir(env, homedir);
		return fallbackHome ? explicitHome.replace(/^~(?=$|[\\/])/, fallbackHome) : void 0;
	}
	return explicitHome;
}
/** Resolves Operator's effective home, honoring OPERATOR_HOME before OS homes. */
function resolveEffectiveHomeDir(env = process.env, homedir = node_os.default.homedir) {
	const raw = resolveRawHomeDir(env, homedir);
	return raw ? node_path.default.resolve(raw) : void 0;
}
/** Resolves the underlying OS user home, ignoring OPERATOR_HOME overrides. */
function resolveOsHomeDir(env = process.env, homedir = node_os.default.homedir) {
	const raw = resolveRawOsHomeDir(env, homedir);
	return raw ? node_path.default.resolve(raw) : void 0;
}
/** Resolves the effective home or falls back to cwd when no home source exists. */
function resolveRequiredHomeDir(env = process.env, homedir = node_os.default.homedir) {
	const resolved = resolveEffectiveHomeDir(env, homedir) ?? tryProcessCwd();
	if (resolved) return node_path.default.resolve(resolved);
	throw new Error("Unable to resolve an Operator home: set OPERATOR_HOME, HOME, or USERPROFILE, or run from an existing directory.");
}
/** Resolves the OS home or falls back to cwd when no OS home source exists. */
function resolveRequiredOsHomeDir(env = process.env, homedir = node_os.default.homedir) {
	const resolved = resolveOsHomeDir(env, homedir) ?? tryProcessCwd();
	if (resolved) return node_path.default.resolve(resolved);
	throw new Error("Unable to resolve an OS home: set HOME or USERPROFILE, or run from an existing directory.");
}
/** Expands leading `~`, `~/`, or `~\` with the effective home when one is known. */
function expandHomePrefix(input, opts) {
	if (!input.startsWith("~")) return input;
	const home = normalize(opts?.home) ?? resolveEffectiveHomeDir(opts?.env ?? process.env, opts?.homedir ?? node_os.default.homedir);
	if (!home) return input;
	return input.replace(/^~(?=$|[\\/])/, home);
}
/** Resolves a user-supplied path after trimming and expanding against the effective home. */
function resolveHomeRelativePath(input, opts) {
	const trimmed = input.trim();
	if (!trimmed) return trimmed;
	if (trimmed.startsWith("~")) {
		const expanded = expandHomePrefix(trimmed, {
			home: resolveRequiredHomeDir(opts?.env ?? process.env, opts?.homedir ?? node_os.default.homedir),
			env: opts?.env,
			homedir: opts?.homedir
		});
		return node_path.default.resolve(expanded);
	}
	return node_path.default.resolve(trimmed);
}
/** Resolves a user path against the effective home, preserving an empty input. */
function resolveUserPath(input, env = process.env, homedir = node_os.default.homedir) {
	if (!input) return "";
	return resolveHomeRelativePath(input, {
		env,
		homedir
	});
}
/** Resolves a user-supplied path against the OS home, ignoring OPERATOR_HOME. */
function resolveOsHomeRelativePath(input, opts) {
	const trimmed = input.trim();
	if (!trimmed) return trimmed;
	if (trimmed.startsWith("~")) {
		const expanded = expandHomePrefix(trimmed, {
			home: resolveRequiredOsHomeDir(opts?.env ?? process.env, opts?.homedir ?? node_os.default.homedir),
			env: opts?.env,
			homedir: opts?.homedir
		});
		return node_path.default.resolve(expanded);
	}
	return node_path.default.resolve(trimmed);
}
//#endregion
Object.defineProperty(exports, "expandHomePrefix", {
	enumerable: true,
	get: function() {
		return expandHomePrefix;
	}
});
Object.defineProperty(exports, "resolveEffectiveHomeDir", {
	enumerable: true,
	get: function() {
		return resolveEffectiveHomeDir;
	}
});
Object.defineProperty(exports, "resolveHomeRelativePath", {
	enumerable: true,
	get: function() {
		return resolveHomeRelativePath;
	}
});
Object.defineProperty(exports, "resolveOsHomeDir", {
	enumerable: true,
	get: function() {
		return resolveOsHomeDir;
	}
});
Object.defineProperty(exports, "resolveOsHomeRelativePath", {
	enumerable: true,
	get: function() {
		return resolveOsHomeRelativePath;
	}
});
Object.defineProperty(exports, "resolveRequiredHomeDir", {
	enumerable: true,
	get: function() {
		return resolveRequiredHomeDir;
	}
});
Object.defineProperty(exports, "resolveRequiredOsHomeDir", {
	enumerable: true,
	get: function() {
		return resolveRequiredOsHomeDir;
	}
});
Object.defineProperty(exports, "resolveUserPath", {
	enumerable: true,
	get: function() {
		return resolveUserPath;
	}
});
Object.defineProperty(exports, "tryProcessCwd", {
	enumerable: true,
	get: function() {
		return tryProcessCwd;
	}
});
