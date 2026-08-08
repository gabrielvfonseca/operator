const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_sqlite_runtime_version = require("./sqlite-runtime-version-BDF92yOP.cjs");
const require_runtime_guard = require("./runtime-guard-DYLYBrMu.cjs");
const require_windows_install_roots = require("./windows-install-roots-pUuZWNtA.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_paths = require("./paths-amwIgX1d.cjs");
const require_stable_node_path = require("./stable-node-path-CycXK8Qa.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/daemon/runtime-paths.ts
/** Selects stable Node runtime paths for daemon installs across platforms. */
const VERSION_MANAGER_MARKERS = [
	"/.nvm/",
	"/.fnm/",
	"/.local/share/fnm/",
	"/library/application support/fnm/",
	"/.volta/",
	"/.asdf/",
	"/.local/share/mise/",
	"/.n/",
	"/.nodenv/",
	"/.nodebrew/",
	"/nvs/"
];
function getPathModule$1(platform) {
	return platform === "win32" ? node_path.default.win32 : node_path.default.posix;
}
function isNodeExecPath(execPath, platform) {
	const base = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(getPathModule$1(platform).basename(execPath));
	return base === "node" || base === "node.exe";
}
function normalizeForCompare(input, platform) {
	const normalized = getPathModule$1(platform).normalize(input).replaceAll("\\", "/");
	if (platform === "win32") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalized);
	return normalized;
}
function buildSystemNodeCandidates(env, platform) {
	if (platform === "darwin") return [
		"/opt/homebrew/bin/node",
		"/opt/homebrew/opt/node/bin/node",
		"/opt/homebrew/opt/node@24/bin/node",
		"/opt/homebrew/opt/node@22/bin/node",
		"/usr/local/bin/node",
		"/usr/local/opt/node/bin/node",
		"/usr/local/opt/node@24/bin/node",
		"/usr/local/opt/node@22/bin/node",
		"/usr/bin/node"
	];
	if (platform === "linux") return ["/usr/local/bin/node", "/usr/bin/node"];
	if (platform === "win32") {
		const pathModule = getPathModule$1(platform);
		return require_windows_install_roots.getWindowsProgramFilesRoots(env).map((root) => pathModule.join(root, "nodejs", "node.exe"));
	}
	return [];
}
const execFileAsync = async (file, args) => await require_exec.runExec(file, [...args], { logOutput: false });
const NODE_RUNTIME_PROBE = String.raw`
let sqliteVersion = null;
try {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(":memory:");
  try {
    sqliteVersion = db.prepare("SELECT sqlite_version() AS version").get()?.version ?? null;
  } finally {
    db.close();
  }
} catch {}
process.stdout.write(JSON.stringify({ nodeVersion: process.versions.node, sqliteVersion }));
`;
async function resolveNodeRuntimeInfo(nodePath, execFileImpl) {
	try {
		const { stdout } = await execFileImpl(nodePath, ["-e", NODE_RUNTIME_PROBE], { encoding: "utf8" });
		const parsed = JSON.parse(stdout);
		const nodeVersion = typeof parsed.nodeVersion === "string" ? parsed.nodeVersion : null;
		const sqliteVersion = typeof parsed.sqliteVersion === "string" ? parsed.sqliteVersion : null;
		return {
			nodeVersion,
			sqliteVersion,
			supported: require_runtime_guard.isSupportedNodeVersion(nodeVersion) && sqliteVersion !== null && require_sqlite_runtime_version.isSqliteWalResetSafeVersion(sqliteVersion)
		};
	} catch {
		return {
			nodeVersion: null,
			sqliteVersion: null,
			supported: false
		};
	}
}
async function isVersionManagedRealNodePath(nodePath, platform) {
	try {
		return isVersionManagedNodePath(await node_fs_promises.default.realpath(nodePath), platform);
	} catch {
		return false;
	}
}
/** True when a Node path lives under a known user version-manager root. */
function isVersionManagedNodePath(nodePath, platform = process.platform) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizeForCompare(nodePath, platform));
	return VERSION_MANAGER_MARKERS.some((marker) => normalized.includes(marker));
}
/** True when a Node path matches known system install candidates for the platform. */
function isSystemNodePath(nodePath, env = process.env, platform = process.platform) {
	const normalized = normalizeForCompare(nodePath, platform);
	return buildSystemNodeCandidates(env, platform).some((candidate) => {
		const normalizedCandidate = normalizeForCompare(candidate, platform);
		return normalized === normalizedCandidate;
	});
}
/** Resolves the first available system Node candidate for the platform. */
async function resolveSystemNodePath(env = process.env, platform = process.platform) {
	const candidates = buildSystemNodeCandidates(env, platform);
	for (const candidate of candidates) try {
		await node_fs_promises.default.access(candidate);
		return candidate;
	} catch {}
	return null;
}
/** Resolves system Node info, preferring a supported non-version-managed install. */
async function resolveSystemNodeInfo(params) {
	const env = params.env ?? process.env;
	const platform = params.platform ?? process.platform;
	const execFileImpl = params.execFile ?? execFileAsync;
	let firstAvailable = null;
	for (const systemNode of buildSystemNodeCandidates(env, platform)) {
		try {
			await node_fs_promises.default.access(systemNode);
		} catch {
			continue;
		}
		if (await isVersionManagedRealNodePath(systemNode, platform)) continue;
		const runtime = await resolveNodeRuntimeInfo(systemNode, execFileImpl);
		const info = {
			path: systemNode,
			sqliteVersion: runtime.sqliteVersion,
			version: runtime.nodeVersion,
			supported: runtime.supported
		};
		if (info.supported) return info;
		firstAvailable ??= info;
	}
	return firstAvailable;
}
/** Renders a warning when the system Node exists but is outside the supported range. */
function renderSystemNodeWarning(systemNode, selectedNodePath) {
	if (!systemNode || systemNode.supported) return null;
	const versionLabel = systemNode.version ?? "unknown";
	const selectedLabel = selectedNodePath ? ` Using ${selectedNodePath} for the daemon.` : "";
	if (require_runtime_guard.isSupportedNodeVersion(systemNode.version)) {
		const sqliteLabel = systemNode.sqliteVersion ?? "unknown";
		return `System Node ${versionLabel} at ${systemNode.path} uses SQLite ${sqliteLabel}, which is not WAL-reset-safe.${selectedLabel} Install Node 24.15+ (recommended) or Node 22.22.3+ from nodejs.org or Homebrew.`;
	}
	return `System Node ${versionLabel} at ${systemNode.path} is outside the supported range.${selectedLabel} Install Node 24.15+ (recommended) or Node 22.22.3+ from nodejs.org or Homebrew.`;
}
/** Resolves the Node binary the daemon should use for a node runtime. */
async function resolvePreferredNodePath(params) {
	if (params.runtime !== "node") return;
	const platform = params.platform ?? process.platform;
	const currentExecPath = params.execPath ?? process.execPath;
	const execFileImpl = params.execFile ?? execFileAsync;
	if (currentExecPath && isNodeExecPath(currentExecPath, platform)) {
		if ((await resolveNodeRuntimeInfo(currentExecPath, execFileImpl)).supported) {
			const stableCurrentPath = await require_stable_node_path.resolveStableNodePath(currentExecPath);
			if (!isVersionManagedNodePath(currentExecPath, platform)) return stableCurrentPath;
			const systemNode = await resolveSystemNodeInfo({
				env: params.env,
				platform,
				execFile: execFileImpl
			});
			if (systemNode?.supported) return systemNode.path;
			return stableCurrentPath;
		}
	}
	const systemNode = await resolveSystemNodeInfo(params);
	if (!systemNode?.supported) return;
	return systemNode.path;
}
//#endregion
//#region src/bootstrap/node-extra-ca-certs.ts
const LINUX_CA_BUNDLE_PATHS = [
	"/etc/ssl/certs/ca-certificates.crt",
	"/etc/pki/tls/certs/ca-bundle.crt",
	"/etc/ssl/ca-bundle.pem"
];
function resolveLinuxSystemCaBundle(params = {}) {
	if ((params.platform ?? process.platform) !== "linux") return;
	const accessSync = params.accessSync ?? node_fs.default.accessSync.bind(node_fs.default);
	for (const candidate of LINUX_CA_BUNDLE_PATHS) try {
		accessSync(candidate, node_fs.default.constants.R_OK);
		return candidate;
	} catch {}
}
/**
* Version manager path markers (Linux subset), mirroring VERSION_MANAGER_MARKERS
* in src/daemon/runtime-paths.ts. Not imported directly because bootstrap code
* must avoid daemon-layer dependencies at startup.
* Version-manager-installed Node does not inherit system CA certificates,
* so we detect this to auto-inject NODE_EXTRA_CA_CERTS.
*/
const VERSION_MANAGER_PATH_MARKERS = [
	"/.nvm/",
	"/.fnm/",
	"/.local/share/fnm/",
	"/.volta/",
	"/.asdf/",
	"/.local/share/mise/",
	"/.n/",
	"/.nodenv/",
	"/.nodebrew/",
	"/nvs/",
	"/.nvs/"
];
function isNodeVersionManagerRuntime(env = process.env, execPath = process.execPath) {
	if (env.NVM_DIR?.trim()) return true;
	return VERSION_MANAGER_PATH_MARKERS.some((marker) => execPath.includes(marker));
}
function resolveAutoNodeExtraCaCerts(params = {}) {
	const env = params.env ?? process.env;
	if (env.NODE_EXTRA_CA_CERTS?.trim()) return;
	const platform = params.platform ?? process.platform;
	const execPath = params.execPath ?? process.execPath;
	if (platform !== "linux" || !isNodeVersionManagerRuntime(env, execPath)) return;
	return resolveLinuxSystemCaBundle({
		platform,
		accessSync: params.accessSync
	});
}
//#endregion
//#region src/bootstrap/node-startup-env.ts
/** Resolves NODE_* TLS env values without overwriting user-provided settings. */
function resolveNodeStartupTlsEnvironment(params = {}) {
	const env = params.env ?? process.env;
	const platform = params.platform ?? process.platform;
	const includeDarwinDefaults = params.includeDarwinDefaults ?? true;
	return {
		NODE_EXTRA_CA_CERTS: env.NODE_EXTRA_CA_CERTS ?? (platform === "darwin" && includeDarwinDefaults ? "/etc/ssl/cert.pem" : resolveAutoNodeExtraCaCerts({
			env,
			platform,
			execPath: params.execPath,
			accessSync: params.accessSync
		})),
		NODE_USE_SYSTEM_CA: env.NODE_USE_SYSTEM_CA ?? (platform === "darwin" && includeDarwinDefaults ? "1" : void 0)
	};
}
//#endregion
//#region src/daemon/service-env.ts
/** Builds minimal, portable environment blocks for managed daemon services. */
const SERVICE_PROXY_ENV_KEYS = [
	"OPERATOR_PROXY_URL",
	"HTTP_PROXY",
	"HTTPS_PROXY",
	"NO_PROXY",
	"ALL_PROXY",
	"http_proxy",
	"https_proxy",
	"no_proxy",
	"all_proxy"
];
function readServiceProxyEnvironment(env) {
	const proxyUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_PROXY_URL);
	return proxyUrl ? { OPERATOR_PROXY_URL: proxyUrl } : {};
}
function normalizeServicePathDir(dir) {
	const trimmed = dir?.trim();
	if (!trimmed || !node_path.default.posix.isAbsolute(trimmed)) return;
	return node_path.default.posix.normalize(trimmed);
}
function realpathServicePathDir(dir) {
	try {
		return node_path.default.posix.normalize(node_fs.default.realpathSync.native(dir));
	} catch {
		return;
	}
}
function realpathExistingServicePathDir(dir) {
	const parts = [];
	let current = dir;
	while (current && current !== node_path.default.posix.dirname(current)) {
		const realCurrent = realpathServicePathDir(current);
		if (realCurrent) return node_path.default.posix.normalize(node_path.default.posix.join(realCurrent, ...parts.toReversed()));
		parts.push(node_path.default.posix.basename(current));
		current = node_path.default.posix.dirname(current);
	}
	const realRoot = realpathServicePathDir(current);
	return realRoot ? node_path.default.posix.normalize(node_path.default.posix.join(realRoot, ...parts.toReversed())) : void 0;
}
function isSameOrChildPath(candidate, parent) {
	return candidate === parent || candidate.startsWith(`${parent}/`);
}
function isUnsafeProcPath(candidate) {
	return candidate === "/proc" || candidate.startsWith("/proc/");
}
function isWorkspaceDerivedPath(dir, options) {
	if (isUnsafeProcPath(dir)) return true;
	const cwd = normalizeServicePathDir(options.cwd ?? process.cwd());
	if (!cwd) return false;
	const home = normalizeServicePathDir(options.home);
	if (home && cwd === home) return false;
	if (isSameOrChildPath(dir, cwd)) return true;
	const realDir = realpathExistingServicePathDir(dir);
	const realCwd = realpathServicePathDir(cwd);
	const realHome = home ? realpathServicePathDir(home) : void 0;
	return Boolean(realDir && realCwd && realHome !== realCwd && isSameOrChildPath(realDir, realCwd));
}
function addEnvConfiguredBinDir(dirs, dir, options) {
	const normalized = normalizeServicePathDir(dir);
	if (!normalized || isWorkspaceDerivedPath(normalized, options)) return;
	dirs.push(normalized);
}
function appendSubdir(base, subdir) {
	if (!base) return;
	return base.endsWith(`/${subdir}`) ? base : node_path.default.posix.join(base, subdir);
}
function addExistingDir(dirs, candidate, existsSync) {
	if (existsSync(candidate)) dirs.push(candidate);
}
function addCommonUserBinDirs(dirs, home, existsSync, includeMissingDefaults) {
	const addDefault = includeMissingDefaults ? (candidate) => dirs.push(candidate) : (candidate) => addExistingDir(dirs, candidate, existsSync);
	addDefault(`${home}/.local/bin`);
	addDefault(`${home}/.npm-global/bin`);
	addDefault(`${home}/bin`);
	addExistingDir(dirs, `${home}/.volta/bin`, existsSync);
	addExistingDir(dirs, `${home}/.asdf/shims`, existsSync);
	addExistingDir(dirs, `${home}/.bun/bin`, existsSync);
}
function addCommonEnvConfiguredBinDirs(dirs, env, options) {
	addEnvConfiguredBinDir(dirs, env?.PNPM_HOME, options);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.PNPM_HOME, "bin"), options);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.NPM_CONFIG_PREFIX, "bin"), options);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.BUN_INSTALL, "bin"), options);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.VOLTA_HOME, "bin"), options);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.ASDF_DATA_DIR, "shims"), options);
}
function addNixProfileBinDirs(dirs, home, env, options, includeMissingDefault, existsSync) {
	const nixProfiles = env?.NIX_PROFILES?.trim();
	if (nixProfiles) for (const profile of nixProfiles.split(/\s+/).toReversed()) addEnvConfiguredBinDir(dirs, appendSubdir(profile, "bin"), options);
	else {
		const defaultProfileBin = `${home}/.nix-profile/bin`;
		if (includeMissingDefault) dirs.push(defaultProfileBin);
		else addExistingDir(dirs, defaultProfileBin, existsSync);
	}
}
function resolveSystemPathDirs(platform) {
	if (platform === "darwin") return [
		"/opt/homebrew/bin",
		"/opt/homebrew/sbin",
		"/usr/local/bin",
		"/usr/bin",
		"/bin",
		"/usr/sbin",
		"/sbin"
	];
	if (platform === "linux") return [
		"/usr/local/bin",
		"/usr/bin",
		"/bin"
	];
	return [];
}
/**
* Resolve common user bin directories for macOS.
* These are paths where npm global installs and node version managers typically place binaries.
*
* Key differences from Linux:
* - fnm: macOS uses ~/Library/Application Support/fnm (not ~/.local/share/fnm)
* - pnpm: macOS uses ~/Library/pnpm (not ~/.local/share/pnpm)
*/
function resolveDarwinUserBinDirs(home, env, existsSync = node_fs.default.existsSync, options = {}) {
	if (!home) return [];
	const dirs = [];
	const pathOptions = {
		...options,
		home
	};
	const includeMissingUserBinDefaults = options.includeMissingUserBinDefaults ?? true;
	addCommonEnvConfiguredBinDirs(dirs, env, pathOptions);
	addEnvConfiguredBinDir(dirs, env?.NVM_DIR, pathOptions);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.FNM_DIR, "aliases/default/bin"), pathOptions);
	addCommonUserBinDirs(dirs, home, existsSync, includeMissingUserBinDefaults);
	addNixProfileBinDirs(dirs, home, env, pathOptions, includeMissingUserBinDefaults, existsSync);
	addExistingDir(dirs, `${home}/Library/Application Support/fnm/aliases/default/bin`, existsSync);
	addExistingDir(dirs, `${home}/.fnm/aliases/default/bin`, existsSync);
	addExistingDir(dirs, `${home}/Library/pnpm/bin`, existsSync);
	addExistingDir(dirs, `${home}/Library/pnpm`, existsSync);
	addExistingDir(dirs, `${home}/.local/share/pnpm/bin`, existsSync);
	addExistingDir(dirs, `${home}/.local/share/pnpm`, existsSync);
	return dirs;
}
/**
* Resolve common user bin directories for Linux.
* These are paths where npm global installs and node version managers typically place binaries.
*/
function resolveLinuxUserBinDirs(home, env, existsSync = node_fs.default.existsSync, options = {}) {
	if (!home) return [];
	const dirs = [];
	const pathOptions = {
		...options,
		home
	};
	const includeMissingUserBinDefaults = options.includeMissingUserBinDefaults ?? true;
	addCommonEnvConfiguredBinDirs(dirs, env, pathOptions);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.NVM_DIR, "current/bin"), pathOptions);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.FNM_DIR, "aliases/default/bin"), pathOptions);
	addEnvConfiguredBinDir(dirs, appendSubdir(env?.FNM_DIR, "current/bin"), pathOptions);
	addCommonUserBinDirs(dirs, home, existsSync, includeMissingUserBinDefaults);
	addNixProfileBinDirs(dirs, home, env, pathOptions, includeMissingUserBinDefaults, existsSync);
	addExistingDir(dirs, `${home}/.nvm/current/bin`, existsSync);
	addExistingDir(dirs, `${home}/.local/share/fnm/aliases/default/bin`, existsSync);
	addExistingDir(dirs, `${home}/.local/share/fnm/current/bin`, existsSync);
	addExistingDir(dirs, `${home}/.fnm/aliases/default/bin`, existsSync);
	addExistingDir(dirs, `${home}/.fnm/current/bin`, existsSync);
	addExistingDir(dirs, `${home}/.local/share/pnpm/bin`, existsSync);
	addExistingDir(dirs, `${home}/.local/share/pnpm`, existsSync);
	return dirs;
}
function getMinimalServicePathParts(options = {}) {
	const platform = options.platform ?? process.platform;
	if (platform === "win32") return [];
	const parts = [];
	const extraDirs = options.extraDirs ?? [];
	const systemDirs = resolveSystemPathDirs(platform);
	const includeUserDirs = options.includeUserDirs ?? platform !== "darwin";
	const existsSync = options.existsSync ?? node_fs.default.existsSync;
	const userDirs = includeUserDirs ? platform === "linux" ? resolveLinuxUserBinDirs(options.home, options.env, existsSync, options) : platform === "darwin" ? resolveDarwinUserBinDirs(options.home, options.env, existsSync, options) : [] : [];
	const add = (dir) => {
		if (!dir) return;
		if (!parts.includes(dir)) parts.push(dir);
	};
	for (const dir of extraDirs) add(dir);
	for (const dir of systemDirs) add(dir);
	for (const dir of userDirs) add(dir);
	return parts;
}
function getMinimalServicePathPartsFromEnv(options = {}) {
	const env = options.env ?? process.env;
	return getMinimalServicePathParts({
		...options,
		home: options.home ?? env.HOME,
		env
	});
}
function buildMinimalServicePath(options = {}) {
	const env = options.env ?? process.env;
	if ((options.platform ?? process.platform) === "win32") return env.PATH ?? "";
	return getMinimalServicePathPartsFromEnv({
		...options,
		env
	}).join(node_path.default.posix.delimiter);
}
function resolveGatewaySystemdUnitEnv(env) {
	const override = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_SYSTEMD_UNIT);
	if (override) return override.endsWith(".service") ? override : `${override}.service`;
	return `${require_paths.resolveGatewaySystemdServiceName(env.OPERATOR_PROFILE)}.service`;
}
function buildServiceEnvironment(params) {
	const { env, port, launchdLabel, extraPathDirs } = params;
	const platform = params.platform ?? process.platform;
	const sharedEnv = resolveSharedServiceEnvironmentFields(env, platform, extraPathDirs, params.execPath);
	const profile = env.OPERATOR_PROFILE;
	const wrapperPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.OPERATOR_WRAPPER);
	const resolvedLaunchdLabel = launchdLabel || (platform === "darwin" ? require_paths.resolveGatewayLaunchAgentLabel(profile) : void 0);
	const systemdUnit = resolveGatewaySystemdUnitEnv(env);
	return {
		...buildCommonServiceEnvironment(env, sharedEnv),
		OPERATOR_PROFILE: profile,
		OPERATOR_WRAPPER: wrapperPath,
		OPERATOR_GATEWAY_PORT: String(port),
		OPERATOR_LAUNCHD_LABEL: resolvedLaunchdLabel,
		OPERATOR_SYSTEMD_UNIT: systemdUnit,
		OPERATOR_WINDOWS_TASK_NAME: require_paths.resolveGatewayWindowsTaskName(profile),
		OPERATOR_WINDOWS_TASK_HIDDEN_LAUNCHER: "1",
		OPERATOR_SERVICE_MARKER: require_paths.GATEWAY_SERVICE_MARKER,
		OPERATOR_SERVICE_KIND: require_paths.GATEWAY_SERVICE_KIND,
		OPERATOR_SERVICE_VERSION: require_version.VERSION
	};
}
function buildCommonServiceEnvironment(env, sharedEnv) {
	const serviceEnv = {
		HOME: env.HOME,
		TMPDIR: sharedEnv.tmpDir,
		NODE_EXTRA_CA_CERTS: sharedEnv.nodeCaCerts,
		NODE_USE_SYSTEM_CA: sharedEnv.nodeUseSystemCa,
		OPERATOR_STATE_DIR: sharedEnv.stateDir,
		OPERATOR_CONFIG_PATH: sharedEnv.configPath,
		...sharedEnv.proxyEnv
	};
	if (sharedEnv.minimalPath) serviceEnv.PATH = sharedEnv.minimalPath;
	return serviceEnv;
}
function resolveServiceTmpDir(env, platform) {
	if (platform === "darwin") try {
		return node_path.default.join(require_paths.resolveGatewayStateDir(env), "tmp");
	} catch {
		return env.TMPDIR?.trim() || node_os.default.tmpdir();
	}
	return env.TMPDIR?.trim() || node_os.default.tmpdir();
}
function resolveSharedServiceEnvironmentFields(env, platform, extraPathDirs, execPath) {
	const stateDir = env.OPERATOR_STATE_DIR;
	const configPath = env.OPERATOR_CONFIG_PATH;
	const tmpDir = resolveServiceTmpDir(env, platform);
	const startupTlsEnv = resolveNodeStartupTlsEnvironment({
		env,
		platform,
		execPath
	});
	return {
		stateDir,
		configPath,
		tmpDir,
		minimalPath: platform === "win32" ? void 0 : buildMinimalServicePath({
			env,
			platform,
			extraDirs: extraPathDirs
		}),
		proxyEnv: readServiceProxyEnvironment(env),
		nodeCaCerts: startupTlsEnv.NODE_EXTRA_CA_CERTS,
		nodeUseSystemCa: startupTlsEnv.NODE_USE_SYSTEM_CA
	};
}
//#endregion
//#region src/daemon/service-path-policy.ts
/** Classifies service PATH entries that should not be frozen into daemons. */
function getPathModule(platform) {
	return platform === "win32" ? node_path.default.win32 : node_path.default.posix;
}
function normalizeServicePathEntry(entry, platform) {
	const normalized = getPathModule(platform).normalize(entry).replaceAll("\\", "/");
	if (platform === "win32") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalized);
	return normalized;
}
function isNonMinimalServicePathEntry(entry, platform) {
	if (platform === "win32") return false;
	const normalized = normalizeServicePathEntry(entry, platform);
	return normalized.includes("/.nvm/") || normalized.includes("/.fnm/") || normalized.includes("/.local/share/fnm/") || normalized.includes("/.volta/") || normalized.includes("/.asdf/") || normalized.includes("/.n/") || normalized.includes("/.nodenv/") || normalized.includes("/.nodebrew/") || normalized.includes("/nvs/") || normalized.includes("/.local/share/pnpm/") || normalized.includes("/pnpm/") || normalized.endsWith("/pnpm");
}
//#endregion
Object.defineProperty(exports, "SERVICE_PROXY_ENV_KEYS", {
	enumerable: true,
	get: function() {
		return SERVICE_PROXY_ENV_KEYS;
	}
});
Object.defineProperty(exports, "buildServiceEnvironment", {
	enumerable: true,
	get: function() {
		return buildServiceEnvironment;
	}
});
Object.defineProperty(exports, "getMinimalServicePathPartsFromEnv", {
	enumerable: true,
	get: function() {
		return getMinimalServicePathPartsFromEnv;
	}
});
Object.defineProperty(exports, "isNonMinimalServicePathEntry", {
	enumerable: true,
	get: function() {
		return isNonMinimalServicePathEntry;
	}
});
Object.defineProperty(exports, "isSystemNodePath", {
	enumerable: true,
	get: function() {
		return isSystemNodePath;
	}
});
Object.defineProperty(exports, "isVersionManagedNodePath", {
	enumerable: true,
	get: function() {
		return isVersionManagedNodePath;
	}
});
Object.defineProperty(exports, "normalizeServicePathEntry", {
	enumerable: true,
	get: function() {
		return normalizeServicePathEntry;
	}
});
Object.defineProperty(exports, "renderSystemNodeWarning", {
	enumerable: true,
	get: function() {
		return renderSystemNodeWarning;
	}
});
Object.defineProperty(exports, "resolvePreferredNodePath", {
	enumerable: true,
	get: function() {
		return resolvePreferredNodePath;
	}
});
Object.defineProperty(exports, "resolveSystemNodeInfo", {
	enumerable: true,
	get: function() {
		return resolveSystemNodeInfo;
	}
});
Object.defineProperty(exports, "resolveSystemNodePath", {
	enumerable: true,
	get: function() {
		return resolveSystemNodePath;
	}
});
