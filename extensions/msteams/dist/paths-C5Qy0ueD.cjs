const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
/** Parse a positive TCP port or return null for absent/invalid input. */
function parseTcpPort(raw) {
	if (raw === void 0 || raw === null) return null;
	const parsed = require_parse_finite_number.parseStrictPositiveInteger(raw);
	if (parsed === void 0 || parsed > 65535) return null;
	return parsed;
}
/** Extract the effective `--port` value from command arguments. */
function parseTcpPortFromArgs(programArguments) {
	if (!programArguments?.length) return null;
	for (let index = 0; index < programArguments.length; index += 1) {
		const argument = programArguments[index];
		if (argument === "--port") {
			const parsed = parseTcpPort(programArguments[index + 1]);
			if (parsed !== null) return parsed;
		}
		if (argument?.startsWith("--port=")) {
			const parsed = parseTcpPort(argument.slice(7));
			if (parsed !== null) return parsed;
		}
	}
	return null;
}
//#endregion
//#region src/config/paths.ts
var paths_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	CONFIG_PATH: () => CONFIG_PATH,
	DEFAULT_GATEWAY_PORT: () => DEFAULT_GATEWAY_PORT,
	STATE_DIR: () => STATE_DIR,
	isNamedProfile: () => isNamedProfile,
	isNixMode: () => isNixMode,
	normalizeStateDirEnv: () => normalizeStateDirEnv,
	pinRuntimePaths: () => pinRuntimePaths,
	resolveConfigPath: () => resolveConfigPath,
	resolveConfigPathCandidate: () => resolveConfigPathCandidate,
	resolveDefaultConfigCandidates: () => resolveDefaultConfigCandidates,
	resolveDeliveryQueueMediaDir: () => resolveDeliveryQueueMediaDir,
	resolveGatewayLockDir: () => resolveGatewayLockDir,
	resolveGatewayPort: () => resolveGatewayPort,
	resolveIncludeRoots: () => resolveIncludeRoots,
	resolveIsNixMode: () => resolveIsNixMode,
	resolveLegacyStateDirs: () => resolveLegacyStateDirs,
	resolveNewStateDir: () => resolveNewStateDir,
	resolveOAuthDir: () => resolveOAuthDir,
	resolveOAuthPath: () => resolveOAuthPath,
	resolveStateDir: () => resolveStateDir
});
/**
* Nix mode detection: When OPERATOR_NIX_MODE=1, the gateway is running under Nix.
* In this mode:
* - No auto-install flows should be attempted
* - Missing dependencies should produce actionable Nix-specific error messages
* - Config is managed externally (read-only from Nix perspective)
*/
function resolveIsNixMode(env = process.env) {
	return env.OPERATOR_NIX_MODE === "1";
}
let isNixMode = resolveIsNixMode();
const LEGACY_STATE_DIRNAMES = [".clawdbot"];
const NEW_STATE_DIRNAME = ".operator";
const CONFIG_FILENAME = "operator.json";
const LEGACY_CONFIG_FILENAMES = ["clawdbot.json"];
/** True when the root CLI selected a non-default isolated profile. */
function isNamedProfile(env = process.env) {
	const profile = env.OPERATOR_PROFILE?.trim();
	return Boolean(profile && profile.toLowerCase() !== "default");
}
function resolveDefaultHomeDir() {
	return require_home_dir.resolveRequiredHomeDir(process.env, node_os.default.homedir);
}
/** Build a homedir thunk that respects OPERATOR_HOME for the given env. */
function envHomedir(env) {
	return () => require_home_dir.resolveRequiredHomeDir(env, node_os.default.homedir);
}
function legacyStateDirs(homedir = resolveDefaultHomeDir) {
	return LEGACY_STATE_DIRNAMES.map((dir) => node_path.default.join(homedir(), dir));
}
function newStateDir(homedir = resolveDefaultHomeDir) {
	return node_path.default.join(homedir(), NEW_STATE_DIRNAME);
}
function resolveLegacyStateDirs(homedir = resolveDefaultHomeDir) {
	return legacyStateDirs(homedir);
}
function resolveNewStateDir(homedir = resolveDefaultHomeDir) {
	return newStateDir(homedir);
}
/**
* State directory for mutable data (sessions, logs, caches).
* Can be overridden via OPERATOR_STATE_DIR.
* Default: ~/.operator
*/
function resolveStateDir(env = process.env, homedir = envHomedir(env)) {
	const effectiveHomedir = () => require_home_dir.resolveRequiredHomeDir(env, homedir);
	const override = env.OPERATOR_STATE_DIR?.trim();
	if (override) return resolveUserPath(override, env, effectiveHomedir);
	const newDir = newStateDir(effectiveHomedir);
	if (env.OPERATOR_TEST_FAST === "1") return newDir;
	const legacyDirs = legacyStateDirs(effectiveHomedir);
	if (node_fs.default.existsSync(newDir)) return newDir;
	const existingLegacy = legacyDirs.find((dir) => {
		try {
			return node_fs.default.existsSync(dir);
		} catch {
			return false;
		}
	});
	if (existingLegacy) return existingLegacy;
	return newDir;
}
function normalizeStateDirEnv(env = process.env) {
	const effectiveHomedir = () => require_home_dir.resolveRequiredHomeDir(env, envHomedir(env));
	const openclawOverride = env.OPERATOR_STATE_DIR?.trim();
	if (openclawOverride) env.OPERATOR_STATE_DIR = resolveUserPath(openclawOverride, env, effectiveHomedir);
}
function resolveUserPath(input, env = process.env, homedir = envHomedir(env)) {
	return require_home_dir.resolveHomeRelativePath(input, {
		env,
		homedir
	});
}
/**
* Optional allowlist of directories that `$include` directives may resolve
* outside the config directory. Set via `OPERATOR_INCLUDE_ROOTS` as a
* platform-delimited path list (`:` on POSIX, `;` on Windows).
*
* Each entry is tilde-expanded and resolved to an absolute path. Entries that
* cannot be resolved or that are not absolute after expansion are dropped.
*
* Returns an empty array when the var is unset or contains no usable entries,
* preserving the historical behavior where `$include` is confined to the
* directory containing `operator.json`.
*/
function resolveIncludeRoots(env = process.env, homedir = envHomedir(env)) {
	const raw = env.OPERATOR_INCLUDE_ROOTS?.trim();
	if (!raw) return [];
	const effectiveHomedir = () => require_home_dir.resolveRequiredHomeDir(env, homedir);
	const seen = /* @__PURE__ */ new Set();
	const roots = [];
	for (const entry of raw.split(node_path.default.delimiter)) {
		const trimmed = entry.trim();
		if (!trimmed) continue;
		const resolved = node_path.default.resolve(require_home_dir.resolveHomeRelativePath(trimmed, {
			env,
			homedir: effectiveHomedir
		}));
		if (!node_path.default.isAbsolute(resolved) || seen.has(resolved)) continue;
		seen.add(resolved);
		roots.push(resolved);
	}
	return roots;
}
let STATE_DIR = resolveStateDir();
/**
* Config file path (JSON or JSON5).
* Can be overridden via OPERATOR_CONFIG_PATH.
* Default: ~/.operator/operator.json (or $OPERATOR_STATE_DIR/operator.json)
*/
function resolveCanonicalConfigPath(env = process.env, stateDir = resolveStateDir(env, envHomedir(env))) {
	const override = env.OPERATOR_CONFIG_PATH?.trim();
	if (override) return resolveUserPath(override, env, envHomedir(env));
	return node_path.default.join(stateDir, CONFIG_FILENAME);
}
/**
* Resolve the active config path by preferring existing config candidates
* before falling back to the canonical path.
*/
function resolveConfigPathCandidate(env = process.env, homedir = envHomedir(env)) {
	if (env.OPERATOR_TEST_FAST === "1") return resolveCanonicalConfigPath(env, resolveStateDir(env, homedir));
	const existing = resolveDefaultConfigCandidates(env, homedir).find((candidate) => {
		try {
			return node_fs.default.existsSync(candidate);
		} catch {
			return false;
		}
	});
	if (existing) return existing;
	return resolveCanonicalConfigPath(env, resolveStateDir(env, homedir));
}
/**
* Active config path (prefers existing config files).
*/
function resolveConfigPath(env = process.env, stateDir = resolveStateDir(env, envHomedir(env)), homedir = envHomedir(env)) {
	const override = env.OPERATOR_CONFIG_PATH?.trim();
	if (override) return resolveUserPath(override, env, homedir);
	if (env.OPERATOR_TEST_FAST === "1") return node_path.default.join(stateDir, CONFIG_FILENAME);
	const stateOverride = env.OPERATOR_STATE_DIR?.trim();
	const existing = [node_path.default.join(stateDir, CONFIG_FILENAME), ...LEGACY_CONFIG_FILENAMES.map((name) => node_path.default.join(stateDir, name))].find((candidate) => {
		try {
			return node_fs.default.existsSync(candidate);
		} catch {
			return false;
		}
	});
	if (existing) return existing;
	if (stateOverride) return node_path.default.join(stateDir, CONFIG_FILENAME);
	const defaultStateDir = resolveStateDir(env, homedir);
	if (node_path.default.resolve(stateDir) === node_path.default.resolve(defaultStateDir)) return resolveConfigPathCandidate(env, homedir);
	return node_path.default.join(stateDir, CONFIG_FILENAME);
}
let CONFIG_PATH = resolveConfigPathCandidate();
/**
* Re-pins process-stable runtime paths after an early startup selector changes the environment.
*
* Gateway startup must call this before importing runtime modules that derive their own constants
* from these live bindings, otherwise one process can split reads and writes across two targets.
*/
function pinRuntimePaths(env = process.env) {
	normalizeStateDirEnv(env);
	isNixMode = resolveIsNixMode(env);
	STATE_DIR = resolveStateDir(env);
	CONFIG_PATH = resolveConfigPathCandidate(env);
	return {
		configPath: CONFIG_PATH,
		stateDir: STATE_DIR
	};
}
/**
* Resolve default config path candidates across default locations.
* Order: explicit config path → state-dir-derived paths → new default.
*/
function resolveDefaultConfigCandidates(env = process.env, homedir = envHomedir(env)) {
	const effectiveHomedir = () => require_home_dir.resolveRequiredHomeDir(env, homedir);
	const explicit = env.OPERATOR_CONFIG_PATH?.trim();
	if (explicit) return [resolveUserPath(explicit, env, effectiveHomedir)];
	const candidates = [];
	const openclawStateDir = env.OPERATOR_STATE_DIR?.trim();
	if (openclawStateDir) {
		const resolved = resolveUserPath(openclawStateDir, env, effectiveHomedir);
		candidates.push(node_path.default.join(resolved, CONFIG_FILENAME));
		candidates.push(...LEGACY_CONFIG_FILENAMES.map((name) => node_path.default.join(resolved, name)));
	}
	const defaultDirs = [newStateDir(effectiveHomedir), ...legacyStateDirs(effectiveHomedir)];
	for (const dir of defaultDirs) {
		candidates.push(node_path.default.join(dir, CONFIG_FILENAME));
		candidates.push(...LEGACY_CONFIG_FILENAMES.map((name) => node_path.default.join(dir, name)));
	}
	return candidates;
}
const DEFAULT_GATEWAY_PORT = 18789;
/**
* Gateway lock directory (ephemeral).
* Default: os.tmpdir()/operator-<uid> (uid suffix when available).
*/
function resolveGatewayLockDir(tmpdir = node_os.default.tmpdir) {
	const base = tmpdir();
	const uid = typeof process.getuid === "function" ? process.getuid() : void 0;
	const suffix = uid != null ? `operator-${uid}` : "@gabrielvfonseca/operator";
	return node_path.default.join(base, suffix);
}
/**
* Queue-owned copies of outbound attachments that have not been delivered yet,
* held outside the media store so its TTL sweep cannot reclaim an attachment a
* durable row still has to send.
*/
function resolveDeliveryQueueMediaDir(stateDir) {
	return node_path.default.join(stateDir ?? resolveStateDir(), "delivery-queue-media");
}
const OAUTH_FILENAME = "oauth.json";
/**
* OAuth credentials storage directory.
*
* Precedence:
* - `OPERATOR_OAUTH_DIR` (explicit override)
* - `$*_STATE_DIR/credentials` (canonical server/default)
*/
function resolveOAuthDir(env = process.env, stateDir = resolveStateDir(env, envHomedir(env))) {
	const override = env.OPERATOR_OAUTH_DIR?.trim();
	if (override) return resolveUserPath(override, env, envHomedir(env));
	return node_path.default.join(stateDir, "credentials");
}
function resolveOAuthPath(env = process.env, stateDir = resolveStateDir(env, envHomedir(env))) {
	return node_path.default.join(resolveOAuthDir(env, stateDir), OAUTH_FILENAME);
}
function parseGatewayPortEnvValue(raw) {
	const trimmed = raw?.trim();
	if (!trimmed) return null;
	if (/^\d+$/.test(trimmed)) return parseTcpPort(trimmed);
	const bracketedIpv6Match = trimmed.match(/^\[[^\]]+\]:(\d+)$/);
	if (bracketedIpv6Match?.[1]) return parseTcpPort(bracketedIpv6Match[1]);
	const firstColon = trimmed.indexOf(":");
	const lastColon = trimmed.lastIndexOf(":");
	if (firstColon <= 0 || firstColon !== lastColon) return null;
	const suffix = trimmed.slice(firstColon + 1);
	if (!/^\d+$/.test(suffix)) return null;
	return parseTcpPort(suffix);
}
function resolveGatewayPort(cfg, env = process.env) {
	const envRaw = env.OPERATOR_GATEWAY_PORT?.trim();
	const envPort = parseGatewayPortEnvValue(envRaw);
	if (envPort !== null) return envPort;
	const configPort = cfg?.gateway?.port;
	if (typeof configPort === "number" && Number.isFinite(configPort)) {
		if (configPort > 0) return configPort;
	}
	return DEFAULT_GATEWAY_PORT;
}
//#endregion
Object.defineProperty(exports, "CONFIG_PATH", {
	enumerable: true,
	get: function() {
		return CONFIG_PATH;
	}
});
Object.defineProperty(exports, "DEFAULT_GATEWAY_PORT", {
	enumerable: true,
	get: function() {
		return DEFAULT_GATEWAY_PORT;
	}
});
Object.defineProperty(exports, "STATE_DIR", {
	enumerable: true,
	get: function() {
		return STATE_DIR;
	}
});
Object.defineProperty(exports, "isNamedProfile", {
	enumerable: true,
	get: function() {
		return isNamedProfile;
	}
});
Object.defineProperty(exports, "isNixMode", {
	enumerable: true,
	get: function() {
		return isNixMode;
	}
});
Object.defineProperty(exports, "normalizeStateDirEnv", {
	enumerable: true,
	get: function() {
		return normalizeStateDirEnv;
	}
});
Object.defineProperty(exports, "parseTcpPort", {
	enumerable: true,
	get: function() {
		return parseTcpPort;
	}
});
Object.defineProperty(exports, "parseTcpPortFromArgs", {
	enumerable: true,
	get: function() {
		return parseTcpPortFromArgs;
	}
});
Object.defineProperty(exports, "paths_exports", {
	enumerable: true,
	get: function() {
		return paths_exports;
	}
});
Object.defineProperty(exports, "pinRuntimePaths", {
	enumerable: true,
	get: function() {
		return pinRuntimePaths;
	}
});
Object.defineProperty(exports, "resolveConfigPath", {
	enumerable: true,
	get: function() {
		return resolveConfigPath;
	}
});
Object.defineProperty(exports, "resolveConfigPathCandidate", {
	enumerable: true,
	get: function() {
		return resolveConfigPathCandidate;
	}
});
Object.defineProperty(exports, "resolveDefaultConfigCandidates", {
	enumerable: true,
	get: function() {
		return resolveDefaultConfigCandidates;
	}
});
Object.defineProperty(exports, "resolveDeliveryQueueMediaDir", {
	enumerable: true,
	get: function() {
		return resolveDeliveryQueueMediaDir;
	}
});
Object.defineProperty(exports, "resolveGatewayLockDir", {
	enumerable: true,
	get: function() {
		return resolveGatewayLockDir;
	}
});
Object.defineProperty(exports, "resolveGatewayPort", {
	enumerable: true,
	get: function() {
		return resolveGatewayPort;
	}
});
Object.defineProperty(exports, "resolveIncludeRoots", {
	enumerable: true,
	get: function() {
		return resolveIncludeRoots;
	}
});
Object.defineProperty(exports, "resolveIsNixMode", {
	enumerable: true,
	get: function() {
		return resolveIsNixMode;
	}
});
Object.defineProperty(exports, "resolveLegacyStateDirs", {
	enumerable: true,
	get: function() {
		return resolveLegacyStateDirs;
	}
});
Object.defineProperty(exports, "resolveNewStateDir", {
	enumerable: true,
	get: function() {
		return resolveNewStateDir;
	}
});
Object.defineProperty(exports, "resolveOAuthDir", {
	enumerable: true,
	get: function() {
		return resolveOAuthDir;
	}
});
Object.defineProperty(exports, "resolveOAuthPath", {
	enumerable: true,
	get: function() {
		return resolveOAuthPath;
	}
});
Object.defineProperty(exports, "resolveStateDir", {
	enumerable: true,
	get: function() {
		return resolveStateDir;
	}
});
