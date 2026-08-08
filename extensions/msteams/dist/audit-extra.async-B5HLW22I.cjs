const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
const require_scan_paths = require("./scan-paths-bPESVZQ5.cjs");
const require_includes = require("./includes-CvS4iKMf.cjs");
const require_sqlite = require("./sqlite-CKOduXJ-.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_timers = require("node:timers");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/config/includes-scan.ts
function listDirectIncludes(parsed) {
	const out = [];
	const visit = (value) => {
		if (!value) return;
		if (Array.isArray(value)) {
			for (const item of value) visit(item);
			return;
		}
		if (typeof value !== "object") return;
		const rec = value;
		const includeVal = rec[require_includes.INCLUDE_KEY];
		if (typeof includeVal === "string") out.push(includeVal);
		else if (Array.isArray(includeVal)) {
			for (const item of includeVal) if (typeof item === "string") out.push(item);
		}
		for (const v of Object.values(rec)) visit(v);
	};
	visit(parsed);
	return out;
}
/** Collects recursively referenced config include files without requiring a valid full config. */
async function collectIncludePathsRecursive(params) {
	const includedPaths = /* @__PURE__ */ new Set();
	const walkedDepthByBase = /* @__PURE__ */ new Map();
	const allowedRoots = params.allowedRoots ?? require_paths.resolveIncludeRoots(params.env);
	const resolveInclude = require_includes.createConfigIncludeResolutionSession(params.configPath, allowedRoots);
	const walk = (basePath, parsed, depth) => {
		if (depth >= 10) return;
		for (const includePath of listDirectIncludes(parsed)) {
			let openedBasePath;
			let nestedInclude;
			const resolver = {
				readFile: (candidate) => node_fs.default.readFileSync(candidate, "utf-8"),
				readFileWithGuards: (readParams) => {
					return require_includes.readConfigIncludeFileWithGuards({
						...readParams,
						onResolvedPath: (resolvedIncludePath) => {
							includedPaths.add(resolvedIncludePath);
							const lexicalBasePath = node_path.default.normalize(readParams.resolvedPath);
							const nextDepth = depth + 1;
							const walkedDepth = walkedDepthByBase.get(lexicalBasePath);
							if (walkedDepth !== void 0 && walkedDepth <= nextDepth) return;
							walkedDepthByBase.set(lexicalBasePath, nextDepth);
							openedBasePath = lexicalBasePath;
						}
					});
				},
				parseJson: (raw) => {
					const nestedParsed = require_parse_json_compat.parseJsonWithJson5Fallback(raw);
					if (openedBasePath) nestedInclude = {
						basePath: openedBasePath,
						parsed: nestedParsed
					};
					return {};
				}
			};
			try {
				resolveInclude({ [require_includes.INCLUDE_KEY]: includePath }, basePath, resolver);
			} catch {}
			if (nestedInclude) walk(nestedInclude.basePath, nestedInclude.parsed, depth + 1);
		}
	};
	walk(params.configPath, params.parsed, 0);
	return [...includedPaths];
}
//#endregion
//#region src/security/installed-plugin-dirs.ts
const IGNORED_INSTALLED_PLUGIN_DIR_NAMES = /* @__PURE__ */ new Set(["node_modules", ".operator-install-backups"]);
/**
* Decide whether an installed-plugin directory should be skipped by security audits.
* This filters generated install debris while keeping real plugin roots visible to scans.
*/
function shouldIgnoreInstalledPluginDirName(name) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(name);
	if (!normalized) return true;
	if (IGNORED_INSTALLED_PLUGIN_DIR_NAMES.has(normalized)) return true;
	if (normalized.startsWith(".")) return true;
	if (normalized.endsWith(".bak")) return true;
	if (normalized.includes(".backup-")) return true;
	if (normalized.includes(".disabled")) return true;
	return false;
}
/**
* Lists installed plugin directories under the state extensions dir. Read
* failures surface through `onReadError` so audits can report scan problems,
* except a missing extensions dir, which is the normal no-plugins state.
*/
async function listInstalledPluginDirs(params) {
	const extensionsDir = node_path.default.join(params.stateDir, "extensions");
	if (!(await node_fs_promises.default.stat(extensionsDir).catch((err) => {
		const code = err?.code;
		if (code !== "ENOENT" && code !== "ENOTDIR") params.onReadError?.(err);
		return null;
	}))?.isDirectory()) return {
		extensionsDir,
		pluginDirs: []
	};
	return {
		extensionsDir,
		pluginDirs: (await node_fs_promises.default.readdir(extensionsDir, { withFileTypes: true }).catch((err) => {
			params.onReadError?.(err);
			return [];
		})).filter((entry) => entry.isDirectory()).map((entry) => entry.name).filter((name) => !shouldIgnoreInstalledPluginDirName(name)).filter(Boolean)
	};
}
//#endregion
//#region src/security/audit-extra.async.ts
/**
* Asynchronous security audit collector functions.
*
* These functions perform I/O (filesystem, config reads) to detect security issues.
*/
const DEFAULT_SANDBOX_BROWSER_DOCKER_PROBE_TIMEOUT_MS = 5e3;
const loadSkillsModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./workspace-BaJ9ukou.cjs")).then((n) => n.workspace_exports));
const loadConfigModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports));
const loadAuditFsModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./audit-fs-CKmdLhEj.cjs")).then((n) => n.audit_fs_exports));
const loadAgentScopeModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./agent-scope-Ce0XqMNr.cjs")).then((n) => n.agent_scope_exports));
const loadAgentWorkspaceDirsModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./workspace-dirs-Dnv9OOh0.cjs")).then((n) => n.workspace_dirs_exports));
const loadSkillSourceModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./source-Bzj4-gl0.cjs")).then((n) => n.source_exports));
const loadSkillScannerModule = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./scanner-BeCzztDo.cjs")).then((n) => n.scanner_exports));
const loadExecDockerRaw = require_lazy_runtime.createLazyRuntimeNamedExport(() => Promise.resolve().then(() => require("./docker-Bz1bPNmB.cjs")).then((n) => n.docker_exports), "execDockerRaw");
const loadSandboxBrowserSecurityHashEpoch = require_lazy_runtime.createLazyRuntimeNamedExport(() => Promise.resolve().then(() => require("./constants-DD-eOR3_.cjs")).then((n) => n.constants_exports), "SANDBOX_BROWSER_SECURITY_HASH_EPOCH");
function expandTilde(p, env) {
	if (!p.startsWith("~")) return p;
	const home = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.HOME) ?? null;
	if (!home) return null;
	if (p === "~") return home;
	if (p.startsWith("~/") || p.startsWith("~\\")) return node_path.default.join(home, p.slice(2));
	return null;
}
async function readPluginManifestExtensions(pluginPath) {
	const manifestPath = node_path.default.join(pluginPath, "package.json");
	const raw = await node_fs_promises.default.readFile(manifestPath, "utf-8").catch(() => "");
	if (!raw.trim()) return [];
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		throw new Error(`Failed to parse plugin manifest at ${manifestPath}: ${String(err)}`, { cause: err });
	}
	const extensions = parsed?.[require_legacy_names.MANIFEST_KEY]?.extensions;
	if (!Array.isArray(extensions)) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(extensions);
}
function formatCodeSafetyDetails(findings, rootDir) {
	return findings.map((finding) => {
		const relPath = node_path.default.relative(rootDir, finding.file);
		const normalizedPath = (relPath && relPath !== "." && !relPath.startsWith("..") ? relPath : node_path.default.basename(finding.file)).replaceAll("\\", "/");
		return `  - [${finding.ruleId}] ${finding.message} (${normalizedPath}:${finding.line})`;
	}).join("\n");
}
function buildCodeSafetySummaryCacheKey(params) {
	const includeFiles = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(params.includeFiles);
	const includeKey = includeFiles.length > 0 ? includeFiles.toSorted().join("\0") : "";
	return `${params.dirPath}\u0000${includeKey}`;
}
async function getCodeSafetySummary(params) {
	const cacheKey = buildCodeSafetySummaryCacheKey({
		dirPath: params.dirPath,
		includeFiles: params.includeFiles
	});
	const cache = params.summaryCache;
	if (cache) {
		const hit = cache.get(cacheKey);
		if (hit) return await hit;
		const pending = (await loadSkillScannerModule()).scanDirectoryWithSummary(params.dirPath, { includeFiles: params.includeFiles });
		cache.set(cacheKey, pending);
		return await pending;
	}
	return await (await loadSkillScannerModule()).scanDirectoryWithSummary(params.dirPath, { includeFiles: params.includeFiles });
}
function normalizeDockerLabelValue(raw) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
	if (!trimmed || trimmed === "<no value>") return null;
	return trimmed;
}
var DockerProbeTimeoutError = class extends Error {
	constructor(timeoutMs) {
		super(`Docker probe timed out after ${timeoutMs}ms`);
		this.name = "DockerProbeTimeoutError";
	}
};
function normalizeDockerProbeTimeoutMs(timeoutMs) {
	if (Number.isFinite(timeoutMs) && timeoutMs !== void 0) return Math.max(250, Math.floor(timeoutMs));
	return DEFAULT_SANDBOX_BROWSER_DOCKER_PROBE_TIMEOUT_MS;
}
async function withDockerProbeTimeout(timeoutMs, run) {
	const controller = new AbortController();
	let timeout;
	let timedOut = false;
	const timeoutPromise = new Promise((_, reject) => {
		timeout = (0, node_timers.setTimeout)(() => {
			timedOut = true;
			controller.abort();
			reject(new DockerProbeTimeoutError(timeoutMs));
		}, timeoutMs);
	});
	try {
		return await Promise.race([run(controller.signal), timeoutPromise]);
	} catch (err) {
		if (timedOut || controller.signal.aborted) throw new DockerProbeTimeoutError(timeoutMs);
		throw err;
	} finally {
		if (timeout) (0, node_timers.clearTimeout)(timeout);
	}
}
function isDockerProbeTimeoutError(error) {
	return error instanceof DockerProbeTimeoutError;
}
async function listSandboxBrowserContainers(params) {
	try {
		const result = await withDockerProbeTimeout(params.timeoutMs, (signal) => params.execDockerRawFn([
			"ps",
			"-a",
			"--filter",
			"label=operator.sandboxBrowser=1",
			"--format",
			"{{.Names}}"
		], {
			allowFailure: true,
			signal
		}));
		if (result.code !== 0) return null;
		return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(result.stdout.toString("utf8").split(/\r?\n/));
	} catch (err) {
		if (isDockerProbeTimeoutError(err)) params.onTimeout?.();
		return null;
	}
}
async function readSandboxBrowserHashLabels(params) {
	try {
		const result = await withDockerProbeTimeout(params.timeoutMs, (signal) => params.execDockerRawFn([
			"inspect",
			"-f",
			"{{ index .Config.Labels \"operator.configHash\" }}	{{ index .Config.Labels \"operator.browserConfigEpoch\" }}",
			params.containerName
		], {
			allowFailure: true,
			signal
		}));
		if (result.code !== 0) return null;
		const [hashRaw, epochRaw] = result.stdout.toString("utf8").split("	");
		return {
			configHash: normalizeDockerLabelValue(hashRaw),
			epoch: normalizeDockerLabelValue(epochRaw)
		};
	} catch (err) {
		if (isDockerProbeTimeoutError(err)) params.onTimeout?.();
		return null;
	}
}
function parsePublishedHostFromDockerPortLine(line) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(line) ?? "";
	const rhs = trimmed.includes("->") ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(trimmed.split("->").at(-1)) ?? "" : trimmed;
	if (!rhs) return null;
	const bracketHost = rhs.match(/^\[([^\]]+)\]:\d+$/);
	if (bracketHost?.[1]) return bracketHost[1];
	const hostPort = rhs.match(/^([^:]+):\d+$/);
	if (hostPort?.[1]) return hostPort[1];
	return null;
}
function isLoopbackPublishHost(host) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(host);
	return normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost";
}
async function readSandboxBrowserPortMappings(params) {
	try {
		const result = await withDockerProbeTimeout(params.timeoutMs, (signal) => params.execDockerRawFn(["port", params.containerName], {
			allowFailure: true,
			signal
		}));
		if (result.code !== 0) return null;
		return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(result.stdout.toString("utf8").split(/\r?\n/));
	} catch (err) {
		if (isDockerProbeTimeoutError(err)) params.onTimeout?.();
		return null;
	}
}
async function collectSandboxBrowserHashLabelFindings(params) {
	const findings = [];
	const timeoutMs = normalizeDockerProbeTimeoutMs(params?.timeoutMs);
	let timedOut = false;
	const markTimedOut = () => {
		timedOut = true;
	};
	const [execFn, browserHashEpoch] = await Promise.all([params?.execDockerRawFn ? Promise.resolve(params.execDockerRawFn) : loadExecDockerRaw(), loadSandboxBrowserSecurityHashEpoch()]);
	const containers = await listSandboxBrowserContainers({
		execDockerRawFn: execFn,
		timeoutMs,
		onTimeout: markTimedOut
	});
	if (!containers || containers.length === 0) {
		if (timedOut) findings.push(buildSandboxBrowserDockerProbeTimeoutFinding(timeoutMs));
		return findings;
	}
	const missingHash = [];
	const staleEpoch = [];
	const nonLoopbackPublished = [];
	for (const containerName of containers) {
		const labels = await readSandboxBrowserHashLabels({
			containerName,
			execDockerRawFn: execFn,
			timeoutMs,
			onTimeout: markTimedOut
		});
		if (timedOut) break;
		if (!labels) continue;
		if (!labels.configHash) missingHash.push(containerName);
		if (labels.epoch !== browserHashEpoch) staleEpoch.push(containerName);
		const portMappings = await readSandboxBrowserPortMappings({
			containerName,
			execDockerRawFn: execFn,
			timeoutMs,
			onTimeout: markTimedOut
		});
		if (timedOut) break;
		if (!portMappings?.length) continue;
		const exposedMappings = portMappings.filter((line) => {
			const host = parsePublishedHostFromDockerPortLine(line);
			return Boolean(host && !isLoopbackPublishHost(host));
		});
		if (exposedMappings.length > 0) nonLoopbackPublished.push(`${containerName} (${exposedMappings.join("; ")})`);
	}
	if (missingHash.length > 0) findings.push({
		checkId: "sandbox.browser_container.hash_label_missing",
		severity: "warn",
		title: "Sandbox browser container missing config hash label",
		detail: `Containers: ${missingHash.join(", ")}. These browser containers predate hash-based drift checks and may miss security remediations until recreated.`,
		remediation: `${require_command_format.formatCliCommand("openclaw sandbox recreate --browser --all")} (add --force to skip prompt).`
	});
	if (staleEpoch.length > 0) findings.push({
		checkId: "sandbox.browser_container.hash_epoch_stale",
		severity: "warn",
		title: "Sandbox browser container hash epoch is stale",
		detail: `Containers: ${staleEpoch.join(", ")}. Expected operator.browserConfigEpoch=${browserHashEpoch}.`,
		remediation: `${require_command_format.formatCliCommand("openclaw sandbox recreate --browser --all")} (add --force to skip prompt).`
	});
	if (nonLoopbackPublished.length > 0) findings.push({
		checkId: "sandbox.browser_container.non_loopback_publish",
		severity: "critical",
		title: "Sandbox browser container publishes ports on non-loopback interfaces",
		detail: `Containers: ${nonLoopbackPublished.join(", ")}. Sandbox browser observer/control ports should stay loopback-only to avoid unintended remote access.`,
		remediation: `${require_command_format.formatCliCommand("openclaw sandbox recreate --browser --all")} (add --force to skip prompt), then verify published ports are bound to 127.0.0.1.`
	});
	if (timedOut) findings.push(buildSandboxBrowserDockerProbeTimeoutFinding(timeoutMs));
	return findings;
}
function buildSandboxBrowserDockerProbeTimeoutFinding(timeoutMs) {
	return {
		checkId: "sandbox.browser_container.docker_probe_timeout",
		severity: "warn",
		title: "Sandbox browser Docker audit probe timed out",
		detail: `Docker did not answer within ${timeoutMs}ms while checking sandbox browser containers. Operator skipped any remaining sandbox browser container drift checks for this status run.`,
		remediation: "Retry after Docker is responsive, or recreate sandbox browser containers if drift is suspected."
	};
}
async function collectIncludeFilePermFindings(params) {
	const findings = [];
	if (!params.configSnapshot.exists) return findings;
	const configPath = params.configSnapshot.path;
	const includePaths = await collectIncludePathsRecursive({
		configPath,
		parsed: params.configSnapshot.parsed,
		env: params.env
	});
	if (includePaths.length === 0) return findings;
	const { formatPermissionDetail, formatPermissionRemediation, inspectPathPermissions } = await loadAuditFsModule();
	for (const p of includePaths) {
		const perms = await inspectPathPermissions(p, {
			env: params.env,
			platform: params.platform,
			exec: params.execIcacls
		});
		if (!perms.ok) continue;
		if (perms.worldWritable || perms.groupWritable) findings.push({
			checkId: "fs.config_include.perms_writable",
			severity: "critical",
			title: "Config include file is writable by others",
			detail: `${formatPermissionDetail(p, perms)}; another user could influence your effective config.`,
			remediation: formatPermissionRemediation({
				targetPath: p,
				perms,
				isDir: false,
				posixMode: 384,
				env: params.env
			})
		});
		else if (perms.worldReadable) findings.push({
			checkId: "fs.config_include.perms_world_readable",
			severity: "critical",
			title: "Config include file is world-readable",
			detail: `${formatPermissionDetail(p, perms)}; include files can contain tokens and private settings.`,
			remediation: formatPermissionRemediation({
				targetPath: p,
				perms,
				isDir: false,
				posixMode: 384,
				env: params.env
			})
		});
		else if (perms.groupReadable) findings.push({
			checkId: "fs.config_include.perms_group_readable",
			severity: "warn",
			title: "Config include file is group-readable",
			detail: `${formatPermissionDetail(p, perms)}; include files can contain tokens and private settings.`,
			remediation: formatPermissionRemediation({
				targetPath: p,
				perms,
				isDir: false,
				posixMode: 384,
				env: params.env
			})
		});
	}
	return findings;
}
async function collectStateDeepFilesystemFindings(params) {
	const findings = [];
	const oauthDir = require_paths.resolveOAuthDir(params.env, params.stateDir);
	const { formatPermissionDetail, formatPermissionRemediation, inspectPathPermissions } = await loadAuditFsModule();
	const oauthPerms = await inspectPathPermissions(oauthDir, {
		env: params.env,
		platform: params.platform,
		exec: params.execIcacls
	});
	if (oauthPerms.ok && oauthPerms.isDir) {
		if (oauthPerms.worldWritable || oauthPerms.groupWritable) findings.push({
			checkId: "fs.credentials_dir.perms_writable",
			severity: "critical",
			title: "Credentials dir is writable by others",
			detail: `${formatPermissionDetail(oauthDir, oauthPerms)}; another user could drop/modify credential files.`,
			remediation: formatPermissionRemediation({
				targetPath: oauthDir,
				perms: oauthPerms,
				isDir: true,
				posixMode: 448,
				env: params.env
			})
		});
		else if (oauthPerms.groupReadable || oauthPerms.worldReadable) findings.push({
			checkId: "fs.credentials_dir.perms_readable",
			severity: "warn",
			title: "Credentials dir is readable by others",
			detail: `${formatPermissionDetail(oauthDir, oauthPerms)}; credentials and allowlists can be sensitive.`,
			remediation: formatPermissionRemediation({
				targetPath: oauthDir,
				perms: oauthPerms,
				isDir: true,
				posixMode: 448,
				env: params.env
			})
		});
	}
	const agentIds = Array.isArray(params.cfg.agents?.list) ? params.cfg.agents?.list.map((a) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(a && typeof a === "object" ? a.id : void 0) ?? "").filter(Boolean) : [];
	const { resolveDefaultAgentId } = await loadAgentScopeModule();
	const ids = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([resolveDefaultAgentId(params.cfg), ...agentIds]).map((id) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(id));
	for (const agentId of ids) {
		const agentDir = node_path.default.join(params.stateDir, "agents", agentId, "agent");
		const authTargets = [{
			path: node_path.default.join(agentDir, "auth-profiles.json"),
			label: "legacy auth-profiles.json"
		}, ...require_sqlite.resolveAuthProfileDatabaseFilePaths(agentDir).map((targetPath) => ({
			path: targetPath,
			label: "auth profile SQLite store"
		}))];
		for (const authTarget of authTargets) {
			const authPerms = await inspectPathPermissions(authTarget.path, {
				env: params.env,
				platform: params.platform,
				exec: params.execIcacls
			});
			if (authPerms.ok) {
				if (authPerms.worldWritable || authPerms.groupWritable) findings.push({
					checkId: "fs.auth_profiles.perms_writable",
					severity: "critical",
					title: `${authTarget.label} is writable by others`,
					detail: `${formatPermissionDetail(authTarget.path, authPerms)}; another user could inject credentials.`,
					remediation: formatPermissionRemediation({
						targetPath: authTarget.path,
						perms: authPerms,
						isDir: false,
						posixMode: 384,
						env: params.env
					})
				});
				else if (authPerms.worldReadable || authPerms.groupReadable) findings.push({
					checkId: "fs.auth_profiles.perms_readable",
					severity: "warn",
					title: `${authTarget.label} is readable by others`,
					detail: `${formatPermissionDetail(authTarget.path, authPerms)}; auth profile storage contains API keys and OAuth tokens.`,
					remediation: formatPermissionRemediation({
						targetPath: authTarget.path,
						perms: authPerms,
						isDir: false,
						posixMode: 384,
						env: params.env
					})
				});
			}
		}
		const storePath = node_path.default.join(params.stateDir, "agents", agentId, "sessions", "sessions.json");
		const storePerms = await inspectPathPermissions(storePath, {
			env: params.env,
			platform: params.platform,
			exec: params.execIcacls
		});
		if (storePerms.ok) {
			if (storePerms.worldReadable || storePerms.groupReadable) findings.push({
				checkId: "fs.sessions_store.perms_readable",
				severity: "warn",
				title: "sessions.json is readable by others",
				detail: `${formatPermissionDetail(storePath, storePerms)}; routing and transcript metadata can be sensitive.`,
				remediation: formatPermissionRemediation({
					targetPath: storePath,
					perms: storePerms,
					isDir: false,
					posixMode: 384,
					env: params.env
				})
			});
		}
	}
	const logFile = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cfg.logging?.file) ?? "";
	if (logFile) {
		const expanded = logFile.startsWith("~") ? expandTilde(logFile, params.env) : logFile;
		if (expanded) {
			const logPath = node_path.default.resolve(expanded);
			const logPerms = await inspectPathPermissions(logPath, {
				env: params.env,
				platform: params.platform,
				exec: params.execIcacls
			});
			if (logPerms.ok) {
				if (logPerms.worldReadable || logPerms.groupReadable) findings.push({
					checkId: "fs.log_file.perms_readable",
					severity: "warn",
					title: "Log file is readable by others",
					detail: `${formatPermissionDetail(logPath, logPerms)}; logs can contain private messages and tool output.`,
					remediation: formatPermissionRemediation({
						targetPath: logPath,
						perms: logPerms,
						isDir: false,
						posixMode: 384,
						env: params.env
					})
				});
			}
		}
	}
	return findings;
}
async function readConfigSnapshotForAudit(params) {
	const { createConfigIO } = await loadConfigModule();
	return await createConfigIO({
		env: params.env,
		configPath: params.configPath
	}).readConfigFileSnapshot();
}
async function collectPluginsCodeSafetyFindings(params) {
	const findings = [];
	const { extensionsDir, pluginDirs } = await listInstalledPluginDirs({
		stateDir: params.stateDir,
		onReadError: (err) => {
			findings.push({
				checkId: "plugins.code_safety.scan_failed",
				severity: "warn",
				title: "Plugin extensions directory scan failed",
				detail: `Static code scan could not list extensions directory: ${String(err)}`,
				remediation: "Check file permissions and plugin layout, then rerun `openclaw security audit --deep`."
			});
		}
	});
	for (const pluginName of pluginDirs) {
		const pluginPath = node_path.default.join(extensionsDir, pluginName);
		let extensionEntries = [];
		try {
			extensionEntries = await readPluginManifestExtensions(pluginPath);
		} catch (manifestErr) {
			findings.push({
				checkId: "plugins.code_safety.manifest_parse_error",
				severity: "warn",
				title: `Plugin "${pluginName}" has a malformed package.json`,
				detail: `Could not parse plugin manifest: ${String(manifestErr)}.\nThe extension entrypoint list is unavailable. Deep scan will cover the plugin directory but may miss entries declared via \`operator.extensions\`.`,
				remediation: "Inspect the plugin package.json for syntax errors. If the plugin is untrusted, remove it from your Operator extensions state directory."
			});
		}
		const forcedScanEntries = [];
		const escapedEntries = [];
		for (const entry of extensionEntries) {
			const resolvedEntry = node_path.default.resolve(pluginPath, entry);
			if (!(0, _openclaw_fs_safe_path.isPathInside)(pluginPath, resolvedEntry)) {
				escapedEntries.push(entry);
				continue;
			}
			if (require_scan_paths.extensionUsesSkippedScannerPath(entry)) findings.push({
				checkId: "plugins.code_safety.entry_path",
				severity: "warn",
				title: `Plugin "${pluginName}" entry path is hidden or node_modules`,
				detail: `Extension entry "${entry}" points to a hidden or node_modules path. Deep code scan will cover this entry explicitly, but review this path choice carefully.`,
				remediation: "Prefer extension entrypoints under normal source paths like dist/ or src/."
			});
			forcedScanEntries.push(resolvedEntry);
		}
		if (escapedEntries.length > 0) findings.push({
			checkId: "plugins.code_safety.entry_escape",
			severity: "critical",
			title: `Plugin "${pluginName}" has extension entry path traversal`,
			detail: `Found extension entries that escape the plugin directory:\n${escapedEntries.map((entry) => `  - ${entry}`).join("\n")}`,
			remediation: "Update the plugin manifest so all operator.extensions entries stay inside the plugin directory."
		});
		const summary = await getCodeSafetySummary({
			dirPath: pluginPath,
			includeFiles: forcedScanEntries,
			summaryCache: params.summaryCache
		}).catch((err) => {
			findings.push({
				checkId: "plugins.code_safety.scan_failed",
				severity: "warn",
				title: `Plugin "${pluginName}" code scan failed`,
				detail: `Static code scan could not complete: ${String(err)}`,
				remediation: "Check file permissions and plugin layout, then rerun `openclaw security audit --deep`."
			});
			return null;
		});
		if (!summary) continue;
		if (summary.critical > 0) {
			const details = formatCodeSafetyDetails(summary.findings.filter((f) => f.severity === "critical"), pluginPath);
			findings.push({
				checkId: "plugins.code_safety",
				severity: "critical",
				title: `Plugin "${pluginName}" contains dangerous code patterns`,
				detail: `Found ${summary.critical} critical issue(s) in ${summary.scannedFiles} scanned file(s):\n${details}`,
				remediation: "Review the plugin source code carefully before use. If untrusted, remove the plugin from your Operator extensions state directory."
			});
		} else if (summary.warn > 0) {
			const details = formatCodeSafetyDetails(summary.findings.filter((f) => f.severity === "warn"), pluginPath);
			findings.push({
				checkId: "plugins.code_safety",
				severity: "warn",
				title: `Plugin "${pluginName}" contains suspicious code patterns`,
				detail: `Found ${summary.warn} warning(s) in ${summary.scannedFiles} scanned file(s):\n${details}`,
				remediation: `Review the flagged code to ensure it is intentional and safe.`
			});
		}
	}
	return findings;
}
async function collectInstalledSkillsCodeSafetyFindings(params) {
	const findings = [];
	const pluginExtensionsDir = node_path.default.join(params.stateDir, "extensions");
	const scannedSkillDirs = /* @__PURE__ */ new Set();
	const [{ listAgentWorkspaceDirs }, { resolveSkillSource }] = await Promise.all([loadAgentWorkspaceDirsModule(), loadSkillSourceModule()]);
	const workspaceDirs = listAgentWorkspaceDirs(params.cfg);
	const { loadWorkspaceSkillEntries } = await loadSkillsModule();
	for (const workspaceDir of workspaceDirs) {
		const entries = loadWorkspaceSkillEntries(workspaceDir, {
			config: params.cfg,
			includeArchived: true
		});
		for (const entry of entries) {
			if (resolveSkillSource(entry.skill) === "operator-bundled") continue;
			const skillDir = node_path.default.resolve(entry.skill.baseDir);
			if ((0, _openclaw_fs_safe_path.isPathInside)(pluginExtensionsDir, skillDir)) continue;
			if (scannedSkillDirs.has(skillDir)) continue;
			scannedSkillDirs.add(skillDir);
			const skillName = entry.skill.name;
			const summary = await getCodeSafetySummary({
				dirPath: skillDir,
				summaryCache: params.summaryCache
			}).catch((err) => {
				findings.push({
					checkId: "skills.code_safety.scan_failed",
					severity: "warn",
					title: `Skill "${skillName}" code scan failed`,
					detail: `Static code scan could not complete for ${skillDir}: ${String(err)}`,
					remediation: "Check file permissions and skill layout, then rerun `openclaw security audit --deep`."
				});
				return null;
			});
			if (!summary) continue;
			if (summary.critical > 0) {
				const details = formatCodeSafetyDetails(summary.findings.filter((finding) => finding.severity === "critical"), skillDir);
				findings.push({
					checkId: "skills.code_safety",
					severity: "critical",
					title: `Skill "${skillName}" contains dangerous code patterns`,
					detail: `Found ${summary.critical} critical issue(s) in ${summary.scannedFiles} scanned file(s) under ${skillDir}:\n${details}`,
					remediation: `Review the skill source code before use. If untrusted, remove "${skillDir}".`
				});
			} else if (summary.warn > 0) {
				const details = formatCodeSafetyDetails(summary.findings.filter((finding) => finding.severity === "warn"), skillDir);
				findings.push({
					checkId: "skills.code_safety",
					severity: "warn",
					title: `Skill "${skillName}" contains suspicious code patterns`,
					detail: `Found ${summary.warn} warning(s) in ${summary.scannedFiles} scanned file(s) under ${skillDir}:\n${details}`,
					remediation: "Review flagged lines to ensure the behavior is intentional and safe."
				});
			}
		}
	}
	return findings;
}
//#endregion
Object.defineProperty(exports, "collectIncludeFilePermFindings", {
	enumerable: true,
	get: function() {
		return collectIncludeFilePermFindings;
	}
});
Object.defineProperty(exports, "collectInstalledSkillsCodeSafetyFindings", {
	enumerable: true,
	get: function() {
		return collectInstalledSkillsCodeSafetyFindings;
	}
});
Object.defineProperty(exports, "collectPluginsCodeSafetyFindings", {
	enumerable: true,
	get: function() {
		return collectPluginsCodeSafetyFindings;
	}
});
Object.defineProperty(exports, "collectSandboxBrowserHashLabelFindings", {
	enumerable: true,
	get: function() {
		return collectSandboxBrowserHashLabelFindings;
	}
});
Object.defineProperty(exports, "collectStateDeepFilesystemFindings", {
	enumerable: true,
	get: function() {
		return collectStateDeepFilesystemFindings;
	}
});
Object.defineProperty(exports, "listInstalledPluginDirs", {
	enumerable: true,
	get: function() {
		return listInstalledPluginDirs;
	}
});
Object.defineProperty(exports, "readConfigSnapshotForAudit", {
	enumerable: true,
	get: function() {
		return readConfigSnapshotForAudit;
	}
});
