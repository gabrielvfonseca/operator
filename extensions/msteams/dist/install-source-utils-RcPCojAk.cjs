const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
require("./private-temp-workspace-CZ5HRjLT.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
require("./archive-HshK6KD3.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let semver = require("semver");
let node_child_process = require("node:child_process");
let _openclaw_fs_safe_temp = require("@openclaw/fs-safe/temp");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_archive = require("@openclaw/fs-safe/archive");
//#region src/infra/npm-install-env.ts
const NPM_CONFIG_SCRIPT_SHELL_KEYS = ["NPM_CONFIG_SCRIPT_SHELL", "npm_config_script_shell"];
const NPM_CONFIG_KEYS_TO_RESET = /* @__PURE__ */ new Set([
	"npm_config_cache",
	"npm_config_dry_run",
	"npm_config_global",
	"npm_config_include_workspace_root",
	"npm_config_ignore_scripts",
	"npm_config_location",
	"npm_config_legacy_peer_deps",
	"npm_config_prefix",
	"npm_config_strict_peer_deps",
	"npm_config_workspace",
	"npm_config_workspaces"
]);
const NPM_FRESHNESS_BYPASS_KEYS = [
	"NPM_CONFIG_BEFORE",
	"npm_config_before",
	"NPM_CONFIG_MIN_RELEASE_AGE",
	"npm_config_min_release_age",
	"NPM_CONFIG_MIN-RELEASE-AGE",
	"npm_config_min-release-age"
];
const NPM_CONFIG_PATH_PROBE_PARENT_ENV_KEYS = [
	"PATH",
	"Path",
	"PATHEXT",
	"SystemRoot",
	"ComSpec"
];
const NPM_GLOBAL_CONFIG_PATH_CACHE = /* @__PURE__ */ new Map();
const NPM_GLOBAL_CONFIG_PATH_CACHE_ENV_KEYS = [
	...NPM_CONFIG_PATH_PROBE_PARENT_ENV_KEYS,
	"NPM_CONFIG_GLOBALCONFIG",
	"npm_config_globalconfig",
	"NPM_CONFIG_PREFIX",
	"npm_config_prefix",
	"NPM_CONFIG_USERCONFIG",
	"npm_config_userconfig",
	"HOME",
	"PREFIX",
	"USERPROFILE"
];
function resolveEnvPath(env, upperKey, lowerKey) {
	const raw = env[upperKey]?.trim() || env[lowerKey]?.trim();
	return raw ? resolveNpmConfigPath(raw, env) : null;
}
function resolveHomeNpmrc(env) {
	const home = env.HOME?.trim() || env.USERPROFILE?.trim() || node_os.default.homedir();
	return node_path.default.join(home, ".npmrc");
}
function replaceNpmEnvRefs(value, env) {
	return value.replace(/(?<!\\)(\\*)\$\{([^${}?]+)(\?)?\}/gu, (original, escapes, name, modifier) => {
		const fallback = modifier === "?" ? "" : `\${${name}}`;
		const resolved = env[name] !== void 0 ? env[name] : fallback;
		if (escapes.length % 2) return original.slice((escapes.length + 1) / 2);
		return `${escapes.slice(escapes.length / 2)}${resolved}`;
	});
}
function resolveNpmConfigPath(rawPath, env) {
	const expanded = replaceNpmEnvRefs(rawPath, env);
	const home = env.HOME?.trim() || env.USERPROFILE?.trim() || node_os.default.homedir();
	return (process.platform === "win32" ? /^~(\/|\\)/u : /^~\//u).test(expanded) && home ? node_path.default.resolve(home, expanded.slice(2)) : node_path.default.resolve(expanded);
}
function createNpmConfigPathProbeEnv(env) {
	const probeEnv = { ...env };
	for (const key of NPM_FRESHNESS_BYPASS_KEYS) delete probeEnv[key];
	for (const key of NPM_CONFIG_PATH_PROBE_PARENT_ENV_KEYS) if (probeEnv[key] == null && process.env[key] != null) probeEnv[key] = process.env[key];
	return probeEnv;
}
function readNpmGlobalConfigPath(env, scope) {
	const scopedGlobalConfig = resolveScopedGlobalNpmrc(scope);
	if (scopedGlobalConfig) return scopedGlobalConfig;
	const configuredGlobalConfig = resolveEnvPath(env, "NPM_CONFIG_GLOBALCONFIG", "npm_config_globalconfig");
	if (configuredGlobalConfig) return configuredGlobalConfig;
	const configuredPrefix = resolveEnvPath(env, "NPM_CONFIG_PREFIX", "npm_config_prefix");
	if (configuredPrefix) return node_path.default.join(configuredPrefix, "etc", "npmrc");
	const cacheKey = buildNpmGlobalConfigPathCacheKey(env, scope);
	if (NPM_GLOBAL_CONFIG_PATH_CACHE.has(cacheKey)) return NPM_GLOBAL_CONFIG_PATH_CACHE.get(cacheKey) ?? null;
	try {
		const raw = (0, node_child_process.execFileSync)("npm", [
			"config",
			"get",
			"globalconfig"
		], {
			encoding: "utf-8",
			env: {
				...createNpmConfigPathProbeEnv(env),
				...scope.npmConfigPrefix ? { npm_config_prefix: scope.npmConfigPrefix } : {}
			},
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			],
			timeout: 2e3
		}).trim();
		const resolved = raw && raw !== "null" && raw !== "undefined" ? raw : null;
		NPM_GLOBAL_CONFIG_PATH_CACHE.set(cacheKey, resolved);
		return resolved;
	} catch {
		NPM_GLOBAL_CONFIG_PATH_CACHE.set(cacheKey, null);
		return null;
	}
}
function buildNpmGlobalConfigPathCacheKey(env, scope) {
	const configFiles = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([
		resolveScopedProjectNpmrc(scope),
		resolveEnvPath(env, "NPM_CONFIG_USERCONFIG", "npm_config_userconfig") ?? resolveHomeNpmrc(env),
		resolveEnvPath(env, "NPM_CONFIG_GLOBALCONFIG", "npm_config_globalconfig"),
		resolveScopedGlobalNpmrc(scope)
	].filter((file) => Boolean(file)));
	return JSON.stringify({
		cwd: scope.npmConfigCwd?.trim() || safeCwd(),
		prefix: scope.npmConfigPrefix?.trim() ?? "",
		env: Object.fromEntries(NPM_GLOBAL_CONFIG_PATH_CACHE_ENV_KEYS.map((key) => [key, env[key] ?? process.env[key] ?? ""])),
		configFiles: configFiles.map((filePath) => ({
			path: filePath,
			signature: readFileSignature(filePath)
		}))
	});
}
function readFileSignature(filePath) {
	try {
		const stat = node_fs.default.statSync(filePath);
		return `${stat.mtimeMs}:${stat.size}`;
	} catch {
		return "missing";
	}
}
function safeCwd() {
	try {
		return process.cwd();
	} catch {
		return "";
	}
}
function resolveScopedProjectNpmrc(scope) {
	const scopedCwd = scope.npmConfigCwd?.trim();
	if (scopedCwd) return node_path.default.join(scopedCwd, ".npmrc");
	try {
		const cwd = process.cwd();
		return cwd ? node_path.default.join(cwd, ".npmrc") : null;
	} catch {
		return null;
	}
}
function resolveScopedGlobalNpmrc(scope) {
	const prefix = scope.npmConfigPrefix?.trim();
	return prefix ? node_path.default.join(prefix, "etc", "npmrc") : null;
}
function resolveNpmConfigFiles(env, scope = {}) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([
		resolveScopedProjectNpmrc(scope),
		resolveEnvPath(env, "NPM_CONFIG_USERCONFIG", "npm_config_userconfig") ?? resolveHomeNpmrc(env),
		resolveEnvPath(env, "NPM_CONFIG_GLOBALCONFIG", "npm_config_globalconfig"),
		resolveScopedGlobalNpmrc(scope),
		readNpmGlobalConfigPath(env, scope)
	].filter((file) => Boolean(file)));
}
function hasNpmrcConfigKey(filePath, key) {
	try {
		const raw = node_fs.default.readFileSync(filePath, "utf-8");
		const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
		return new RegExp(`^\\s*${escapedKey}\\s*=`, "imu").test(raw);
	} catch {
		return false;
	}
}
function hasRawNpmConfigKey(env, key, scope) {
	return resolveNpmConfigFiles(env, scope).some((file) => hasNpmrcConfigKey(file, key));
}
function resolveNpmFreshnessBypassMode(env, scope) {
	if (process.platform === "win32") return "before";
	if (hasRawNpmConfigKey(env, "min-release-age", scope)) return "min-release-age";
	return hasRawNpmConfigKey(env, "before", scope) ? "before" : "min-release-age";
}
/**
* Builds npm args that bypass host freshness policies for Operator-managed installs.
* Existing npmrc policy decides whether `before` or `min-release-age` is safer.
*/
function createNpmFreshnessBypassArgs(env = process.env, now = /* @__PURE__ */ new Date(), scope = {}) {
	if (resolveNpmFreshnessBypassMode(env, scope) === "min-release-age") return ["--min-release-age=0"];
	return [`--before=${now.toISOString()}`];
}
/** Applies the same npm freshness bypass policy through environment variables. */
function applyNpmFreshnessBypassEnv(env, now = /* @__PURE__ */ new Date(), scope = {}) {
	const [arg] = createNpmFreshnessBypassArgs(env, now, scope);
	for (const key of NPM_FRESHNESS_BYPASS_KEYS) {
		if (process.platform === "win32" && key.includes("-")) {
			delete env[key];
			continue;
		}
		env[key] = "";
	}
	if (arg?.startsWith("--before=")) env.npm_config_before = arg.slice(9);
	else if (arg === "--min-release-age=0") env.npm_config_min_release_age = "0";
}
/**
* Creates npm env for project-local installs, clearing global/workspace config
* and adding fetch, freshness, cache, and POSIX script-shell defaults.
*/
function createNpmProjectInstallEnv(env, options = {}, now = /* @__PURE__ */ new Date()) {
	const nextEnv = { ...env };
	for (const key of Object.keys(nextEnv)) if (NPM_CONFIG_KEYS_TO_RESET.has(key.toLowerCase())) delete nextEnv[key];
	const installEnv = {
		...nextEnv,
		npm_config_dry_run: "false",
		npm_config_fetch_retries: nextEnv.npm_config_fetch_retries ?? "5",
		npm_config_fetch_retry_maxtimeout: nextEnv.npm_config_fetch_retry_maxtimeout ?? "120000",
		npm_config_fetch_retry_mintimeout: nextEnv.npm_config_fetch_retry_mintimeout ?? "10000",
		npm_config_fetch_timeout: nextEnv.npm_config_fetch_timeout ?? "300000",
		npm_config_global: "false",
		npm_config_location: "project",
		npm_config_package_lock: "false",
		npm_config_save: "false",
		...options.cacheDir ? { npm_config_cache: options.cacheDir } : {}
	};
	applyNpmFreshnessBypassEnv(installEnv, now, options);
	applyPosixNpmScriptShellEnv(installEnv);
	return installEnv;
}
/** Returns true when caller env already pins npm's lifecycle script shell. */
function hasNpmScriptShellSetting(env) {
	return NPM_CONFIG_SCRIPT_SHELL_KEYS.some((key) => Boolean(env[key]?.trim()));
}
/** Resolves an absolute POSIX shell for npm lifecycle scripts when one is available. */
function resolvePosixNpmScriptShell(env) {
	if (process.platform === "win32") return null;
	if (node_fs.default.existsSync("/bin/sh")) return "/bin/sh";
	const shell = env.SHELL?.trim();
	return shell && node_path.default.isAbsolute(shell) && node_fs.default.existsSync(shell) ? shell : null;
}
/** Sets npm's script-shell env only when the caller has not configured one. */
function applyPosixNpmScriptShellEnv(env) {
	if (hasNpmScriptShellSetting(env)) return;
	const scriptShell = resolvePosixNpmScriptShell(env);
	if (scriptShell) env.NPM_CONFIG_SCRIPT_SHELL = scriptShell;
}
//#endregion
//#region src/infra/install-source-utils.ts
/** Converts npm resolution metadata into stable result field names. */
function buildNpmResolutionFields(resolution) {
	return {
		resolvedName: resolution?.name,
		resolvedVersion: resolution?.version,
		resolvedSpec: resolution?.resolvedSpec,
		integrity: resolution?.integrity,
		shasum: resolution?.shasum,
		resolvedAt: resolution?.resolvedAt
	};
}
/** Creates a script-free npm environment for metadata and pack commands. */
function createNpmMetadataEnv(scope = {}) {
	const env = {
		COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
		NPM_CONFIG_IGNORE_SCRIPTS: "true"
	};
	applyNpmFreshnessBypassEnv(env, /* @__PURE__ */ new Date(), scope);
	return env;
}
function resolveNpmSpecVersionSelector(spec) {
	const separator = spec.lastIndexOf("@");
	return separator > 0 ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(spec.slice(separator + 1)) : void 0;
}
function selectNpmViewMetadataEntry(value, spec) {
	if (!Array.isArray(value)) return value;
	const entries = value.filter((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && !Array.isArray(entry));
	const selector = resolveNpmSpecVersionSelector(spec);
	const range = selector ? (0, semver.validRange)(selector) : null;
	if (range) {
		let best;
		for (const entry of entries) {
			const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.version);
			if (!version || !(0, semver.satisfies)(version, range)) continue;
			if (!best || (0, semver.gt)(version, best.version)) best = {
				entry,
				version
			};
		}
		return best?.entry;
	}
	return entries.at(-1);
}
function normalizeNpmViewMetadata(value, spec) {
	const entry = selectNpmViewMetadataEntry(value, spec);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || Array.isArray(entry)) return null;
	const rec = entry;
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.name);
	const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.version);
	const resolvedSpec = name && version ? `${name}@${version}` : void 0;
	const dist = rec.dist && typeof rec.dist === "object" ? rec.dist : {};
	return {
		name,
		version,
		resolvedSpec,
		integrity: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec["dist.integrity"]) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(dist.integrity),
		shasum: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec["dist.shasum"]) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(dist.shasum),
		...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rec.operator) ? { packageOperator: rec.operator } : {}
	};
}
async function resolveNpmSpecMetadata(params) {
	const res = await require_exec.runCommandWithTimeout([
		"npm",
		"view",
		params.spec,
		"name",
		"version",
		"dist.integrity",
		"dist.shasum",
		"@gabrielvfonseca/operator",
		"--json"
	], {
		timeoutMs: Math.max(params.timeoutMs ?? 6e4, 6e4),
		env: createNpmMetadataEnv()
	});
	if (res.code !== 0) {
		const raw = res.stderr.trim() || res.stdout.trim();
		if (/E404|is not in this registry/i.test(raw)) return {
			ok: false,
			error: `Package not found on npm: ${params.spec}. See https://docs.operator.ai/tools/plugin for installable plugins.`
		};
		return {
			ok: false,
			error: `npm view failed: ${raw}`,
			category: "metadata-env"
		};
	}
	try {
		const metadata = normalizeNpmViewMetadata(JSON.parse(res.stdout.trim()), params.spec);
		if (!metadata?.name || !metadata.version) return {
			ok: false,
			error: `npm view produced incomplete package metadata (missing: ${[!metadata?.name ? "name" : null, !metadata?.version ? "version" : null].filter((field) => field !== null).join(", ")})`,
			category: "metadata-env"
		};
		return {
			ok: true,
			metadata
		};
	} catch (err) {
		return {
			ok: false,
			error: `npm view produced invalid JSON: ${String(err)}`,
			category: "metadata-env"
		};
	}
}
/** Runs a callback in a private temp directory and removes it afterward. */
async function withTempDir(prefix, fn, options) {
	return await (0, _openclaw_fs_safe_temp.withTempWorkspace)({
		rootDir: options?.rootDir ?? require_tmp_operator_dir.resolvePreferredOperatorTmpDir(),
		prefix
	}, async (tmp) => fn(tmp.dir));
}
/** Resolves and validates a user-supplied archive path before extraction. */
async function resolveArchiveSourcePath(archivePath) {
	const resolved = require_home_dir.resolveUserPath(archivePath);
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(resolved)) return {
		ok: false,
		error: `archive not found: ${resolved}`
	};
	if (!(0, _openclaw_fs_safe_archive.resolveArchiveKind)(resolved)) return {
		ok: false,
		error: `unsupported archive: ${resolved}`
	};
	return {
		ok: true,
		path: resolved
	};
}
function parseResolvedSpecFromId(id) {
	const at = id.lastIndexOf("@");
	if (at <= 0 || at >= id.length - 1) return;
	const name = id.slice(0, at).trim();
	const version = id.slice(at + 1).trim();
	if (!name || !version) return;
	return `${name}@${version}`;
}
function normalizeNpmPackEntry(entry) {
	if (!entry || typeof entry !== "object") return null;
	const rec = entry;
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.name);
	const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.version);
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.id);
	const resolvedSpec = (name && version ? `${name}@${version}` : void 0) ?? (id ? parseResolvedSpecFromId(id) : void 0);
	return {
		filename: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.filename),
		metadata: {
			name,
			version,
			resolvedSpec,
			integrity: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.integrity),
			shasum: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rec.shasum)
		}
	};
}
function parseNpmPackJsonOutput(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const candidates = [trimmed];
	const arrayStart = trimmed.indexOf("[");
	if (arrayStart > 0) candidates.push(trimmed.slice(arrayStart));
	for (const candidate of candidates) {
		let parsed;
		try {
			parsed = JSON.parse(candidate);
		} catch {
			continue;
		}
		const entries = Array.isArray(parsed) ? parsed : [parsed];
		let fallback = null;
		for (let i = entries.length - 1; i >= 0; i -= 1) {
			const normalized = normalizeNpmPackEntry(entries[i]);
			if (!normalized) continue;
			if (!fallback) fallback = normalized;
			if (normalized.filename) return normalized;
		}
		if (fallback) return fallback;
	}
	return null;
}
function parsePackedArchiveFromStdout(stdout) {
	const lines = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(stdout.split(/\r?\n/));
	for (let index = lines.length - 1; index >= 0; index -= 1) {
		const match = lines[index]?.match(/([^\s"']+\.tgz)/);
		if (match?.[1]) return match[1];
	}
}
async function findPackedArchiveInDir(cwd) {
	const archives = (await node_fs_promises.default.readdir(cwd, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile() && entry.name.endsWith(".tgz"));
	if (archives.length === 0) return;
	if (archives.length === 1) return archives[0]?.name;
	const sortedByMtime = await Promise.all(archives.map(async (entry) => ({
		name: entry.name,
		mtimeMs: (await node_fs_promises.default.stat(node_path.default.join(cwd, entry.name))).mtimeMs
	})));
	sortedByMtime.sort((a, b) => b.mtimeMs - a.mtimeMs);
	return sortedByMtime[0]?.name;
}
/** Packs an npm spec into a tarball in `cwd` and returns archive metadata. */
async function packNpmSpecToArchive(params) {
	const res = await require_exec.runCommandWithTimeout([
		"npm",
		"pack",
		params.spec,
		"--ignore-scripts",
		"--json"
	], {
		timeoutMs: Math.max(params.timeoutMs, 3e5),
		cwd: params.cwd,
		env: createNpmMetadataEnv({ npmConfigCwd: params.cwd })
	});
	if (res.code !== 0) {
		const raw = res.stderr.trim() || res.stdout.trim();
		if (/E404|is not in this registry/i.test(raw)) return {
			ok: false,
			error: `Package not found on npm: ${params.spec}. See https://docs.operator.ai/tools/plugin for installable plugins.`
		};
		return {
			ok: false,
			error: `npm pack failed: ${raw}`
		};
	}
	const parsedJson = parseNpmPackJsonOutput(res.stdout || "");
	let packed = parsedJson?.filename ?? parsePackedArchiveFromStdout(res.stdout || "");
	if (!packed) packed = await findPackedArchiveInDir(params.cwd);
	if (!packed) return {
		ok: false,
		error: "npm pack produced no archive"
	};
	let archivePath = node_path.default.isAbsolute(packed) ? packed : node_path.default.join(params.cwd, packed);
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(archivePath)) {
		const fallbackPacked = await findPackedArchiveInDir(params.cwd);
		if (!fallbackPacked) return {
			ok: false,
			error: "npm pack produced no archive"
		};
		archivePath = node_path.default.join(params.cwd, fallbackPacked);
	}
	return {
		ok: true,
		archivePath,
		metadata: parsedJson?.metadata ?? {}
	};
}
/**
* Reads package metadata from an existing npm archive using `npm pack --dry-run`.
* The archive path is validated first so callers get path errors before npm errors.
*/
async function resolveNpmPackArchiveMetadata(params) {
	const archivePathResult = await resolveArchiveSourcePath(params.archivePath);
	if (!archivePathResult.ok) return archivePathResult;
	const archivePath = archivePathResult.path;
	const archiveStat = await node_fs_promises.default.stat(archivePath).catch(() => null);
	const archiveMetadataTimeoutMs = archiveStat && archiveStat.size > 100 * 1024 * 1024 ? 3e5 : 6e4;
	const res = await require_exec.runCommandWithTimeout([
		"npm",
		"pack",
		archivePath,
		"--ignore-scripts",
		"--dry-run",
		"--json"
	], {
		timeoutMs: Math.max(params.timeoutMs ?? archiveMetadataTimeoutMs, archiveMetadataTimeoutMs),
		env: createNpmMetadataEnv()
	});
	if (res.code !== 0) return {
		ok: false,
		error: `npm pack metadata read failed: ${res.stderr.trim() || res.stdout.trim()}`
	};
	const parsedJson = parseNpmPackJsonOutput(res.stdout || "");
	if (!parsedJson?.metadata.name || !parsedJson.metadata.version) return {
		ok: false,
		error: "npm pack metadata read produced incomplete package metadata"
	};
	return {
		ok: true,
		archivePath,
		tarballName: parsedJson.filename ?? node_path.default.basename(archivePath),
		metadata: parsedJson.metadata
	};
}
//#endregion
Object.defineProperty(exports, "applyNpmFreshnessBypassEnv", {
	enumerable: true,
	get: function() {
		return applyNpmFreshnessBypassEnv;
	}
});
Object.defineProperty(exports, "applyPosixNpmScriptShellEnv", {
	enumerable: true,
	get: function() {
		return applyPosixNpmScriptShellEnv;
	}
});
Object.defineProperty(exports, "buildNpmResolutionFields", {
	enumerable: true,
	get: function() {
		return buildNpmResolutionFields;
	}
});
Object.defineProperty(exports, "createNpmFreshnessBypassArgs", {
	enumerable: true,
	get: function() {
		return createNpmFreshnessBypassArgs;
	}
});
Object.defineProperty(exports, "createNpmMetadataEnv", {
	enumerable: true,
	get: function() {
		return createNpmMetadataEnv;
	}
});
Object.defineProperty(exports, "createNpmProjectInstallEnv", {
	enumerable: true,
	get: function() {
		return createNpmProjectInstallEnv;
	}
});
Object.defineProperty(exports, "packNpmSpecToArchive", {
	enumerable: true,
	get: function() {
		return packNpmSpecToArchive;
	}
});
Object.defineProperty(exports, "resolveArchiveSourcePath", {
	enumerable: true,
	get: function() {
		return resolveArchiveSourcePath;
	}
});
Object.defineProperty(exports, "resolveNpmPackArchiveMetadata", {
	enumerable: true,
	get: function() {
		return resolveNpmPackArchiveMetadata;
	}
});
Object.defineProperty(exports, "resolveNpmSpecMetadata", {
	enumerable: true,
	get: function() {
		return resolveNpmSpecMetadata;
	}
});
Object.defineProperty(exports, "withTempDir", {
	enumerable: true,
	get: function() {
		return withTempDir;
	}
});
