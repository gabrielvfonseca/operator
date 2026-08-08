const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_semver = require("./semver-CcnjzT8W.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_fetch_timeout = require("./fetch-timeout-C6HLIptD.cjs");
const require_provider_http_errors = require("./provider-http-errors-BAaO_toA.cjs");
const require_update_channels = require("./update-channels-BEYweYMB.cjs");
const require_package_json = require("./package-json-B6KtcVRf.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/infra/detect-package-manager.ts
async function exists$1(p) {
	try {
		await node_fs_promises.default.access(p);
		return true;
	} catch {
		return false;
	}
}
function resolveBunGlobalNodeModules() {
	return node_path.default.join(process.env.BUN_INSTALL || node_path.default.join(node_os.default.homedir(), ".bun"), "install", "global", "node_modules");
}
function resolvePnpmNodeModulesRoot(root) {
	const resolved = node_path.default.resolve(root);
	const parts = resolved.split(node_path.default.sep);
	const pnpmIndex = parts.lastIndexOf(".pnpm");
	if (pnpmIndex > 0) {
		const layoutRoot = parts.slice(0, pnpmIndex).join(node_path.default.sep) || node_path.default.sep;
		return node_path.default.basename(layoutRoot) === "node_modules" ? layoutRoot : node_path.default.join(layoutRoot, "node_modules");
	}
	const parent = node_path.default.dirname(resolved);
	return node_path.default.basename(parent) === "node_modules" ? parent : null;
}
async function isBunOwnedPackageRoot(root) {
	return node_path.default.resolve(node_path.default.dirname(root)) === node_path.default.resolve(resolveBunGlobalNodeModules());
}
async function isPnpmOwnedPackageRoot(root) {
	const nodeModulesRoot = resolvePnpmNodeModulesRoot(root);
	if (!nodeModulesRoot || !await exists$1(node_path.default.join(nodeModulesRoot, ".modules.yaml"))) return false;
	return true;
}
/** Detects the package manager that owns a package root from manifests, locks, and install layout. */
async function detectPackageManager$1(root) {
	const pm = (await require_package_json.readPackageManagerSpec(root))?.split("@")[0]?.trim();
	const files = await node_fs_promises.default.readdir(root).catch(() => []);
	const hasNpmShrinkwrap = files.includes("npm-shrinkwrap.json");
	const hasPnpmLock = files.includes("pnpm-lock.yaml");
	const hasBunLock = files.includes("bun.lock") || files.includes("bun.lockb");
	if (hasNpmShrinkwrap) {
		if (await isBunOwnedPackageRoot(root)) return "bun";
		if (pm === "pnpm" && (hasPnpmLock || await isPnpmOwnedPackageRoot(root))) return "pnpm";
		if (pm === "bun" && hasBunLock) return "bun";
		return "npm";
	}
	if (pm === "pnpm" || pm === "bun" || pm === "npm") return pm;
	if (hasPnpmLock) return "pnpm";
	if (hasBunLock) return "bun";
	if (files.includes("package-lock.json") || hasNpmShrinkwrap) return "npm";
	return null;
}
//#endregion
//#region src/infra/update-check.ts
function toOptionalTrimmedString(value) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}
function parseNpmPackageTargetMetadata(raw) {
	let parsed;
	try {
		parsed = JSON.parse(raw.trim());
	} catch (err) {
		throw new Error(`npm view returned invalid JSON: ${String(err)}`, { cause: err });
	}
	const entry = Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed;
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) return {
		version: null,
		nodeEngine: null
	};
	const rec = entry;
	const engines = rec.engines && typeof rec.engines === "object" ? rec.engines : null;
	const nodeEngine = toOptionalTrimmedString(rec["engines.node"]) ?? (engines ? toOptionalTrimmedString(engines.node) : null);
	return {
		version: toOptionalTrimmedString(rec.version),
		nodeEngine
	};
}
function formatNpmViewError(res) {
	const raw = (res.stderr.trim() || res.stdout.trim()).split("\n").slice(-3).join("\n");
	return raw ? `npm view failed: ${raw}` : "npm view failed";
}
function packageTargetSpec(params) {
	return params.spec?.trim() || `openclaw@${params.target.trim() || "latest"}`;
}
const PUBLIC_NPM_REGISTRY_URL = "https://registry.npmjs.org/";
const PUBLIC_NPM_PACKAGE_NAME = "@gabrielvfonseca/operator";
function isLoopbackNpmRegistry(raw) {
	try {
		const url = new URL(raw);
		return (url.protocol === "http:" || url.protocol === "https:") && (url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "[::1]");
	} catch {
		return false;
	}
}
function resolveExtendedStableRegistryTarget(params) {
	const env = params.env ?? process.env;
	const packageName = params.packageName?.trim() || PUBLIC_NPM_PACKAGE_NAME;
	const packageSpecOverride = env.OPERATOR_UPDATE_PACKAGE_SPEC?.trim();
	const registryOverride = env.NPM_CONFIG_REGISTRY?.trim() || env.npm_config_registry?.trim() || "";
	if (packageSpecOverride === packageName && isLoopbackNpmRegistry(registryOverride)) return {
		registryUrl: registryOverride,
		packageName
	};
	return {
		registryUrl: PUBLIC_NPM_REGISTRY_URL,
		packageName: PUBLIC_NPM_PACKAGE_NAME
	};
}
function npmRegistryTargetUrl(params) {
	const baseUrl = params.registryUrl.endsWith("/") ? params.registryUrl : `${params.registryUrl}/`;
	return new URL(`${encodeURIComponent(params.packageName)}/${encodeURIComponent(params.target)}`, baseUrl).toString();
}
async function fetchNpmPackageTargetStatusFromRegistry(params) {
	const url = npmRegistryTargetUrl({
		registryUrl: params.registryUrl ?? PUBLIC_NPM_REGISTRY_URL,
		packageName: params.packageName ?? PUBLIC_NPM_PACKAGE_NAME,
		target: params.target
	});
	const { signal, cleanup } = require_fetch_timeout.buildTimeoutAbortSignal({
		timeoutMs: Math.max(250, params.timeoutMs),
		operation: "npm-registry-update-check",
		url
	});
	let res;
	try {
		res = await fetch(url, { signal });
		if (!res.ok) return {
			target: params.target,
			version: null,
			nodeEngine: null,
			error: `HTTP ${res.status}`
		};
		const json = await require_provider_http_errors.readProviderJsonResponse(res, "npm package target status");
		return {
			target: params.target,
			version: toOptionalTrimmedString(json.version),
			nodeEngine: toOptionalTrimmedString(json.engines?.node)
		};
	} catch (err) {
		return {
			target: params.target,
			version: null,
			nodeEngine: null,
			error: String(err)
		};
	} finally {
		if (res?.bodyUsed !== true) await res?.body?.cancel().catch(() => void 0);
		cleanup();
	}
}
/** Resolves the extended-stable selector and verifies its exact package manifest. */
async function resolveExtendedStablePackage(params) {
	if (params.installKind === "git") return {
		status: "failed",
		reason: "unsupported_git_channel"
	};
	const timeoutMs = params.timeoutMs ?? 3500;
	const registryTarget = resolveExtendedStableRegistryTarget(params);
	const selector = await fetchNpmPackageTargetStatusFromRegistry({
		target: "extended-stable",
		timeoutMs,
		...registryTarget
	});
	if (!selector.version) return {
		status: "failed",
		reason: selector.error === "HTTP 404" ? "selector_missing" : "selector_query_failed"
	};
	if ((await fetchNpmPackageTargetStatusFromRegistry({
		target: selector.version,
		timeoutMs,
		...registryTarget
	})).version !== selector.version) return {
		status: "failed",
		reason: "exact_package_mismatch"
	};
	return {
		status: "resolved",
		selector: "extended-stable",
		version: selector.version,
		packageSpec: `${registryTarget.packageName}@${selector.version}`
	};
}
function formatGitInstallLabel(update) {
	if (update.installKind !== "git") return null;
	const shortSha = update.git?.sha ? update.git.sha.slice(0, 8) : null;
	const branch = update.git?.branch && update.git.branch !== "HEAD" ? update.git.branch : null;
	const tag = update.git?.tag ?? null;
	return [
		branch ?? (tag ? "detached" : "git"),
		tag ? `tag ${tag}` : null,
		shortSha ? `@ ${shortSha}` : null
	].filter(Boolean).join(" · ");
}
async function exists(p) {
	try {
		await node_fs_promises.default.access(p);
		return true;
	} catch {
		return false;
	}
}
async function detectPackageManager(root) {
	return await detectPackageManager$1(root) ?? "unknown";
}
async function detectGitRoot(root) {
	const res = await require_exec.runCommandWithTimeout([
		"git",
		"-C",
		root,
		"rev-parse",
		"--show-toplevel"
	], { timeoutMs: 4e3 }).catch(() => null);
	if (res?.code !== 0) return null;
	const top = res.stdout.trim();
	return top ? node_path.default.resolve(top) : null;
}
async function checkGitUpdateStatus(params) {
	const timeoutMs = params.timeoutMs ?? 6e3;
	const root = node_path.default.resolve(params.root);
	const base = {
		root,
		sha: null,
		tag: null,
		branch: null,
		upstream: null,
		dirty: null,
		ahead: null,
		behind: null,
		fetchOk: null
	};
	const [branchRes, shaRes, tagRes, upstreamRes, dirtyRes] = await Promise.all([
		require_exec.runCommandWithTimeout([
			"git",
			"-C",
			root,
			"rev-parse",
			"--abbrev-ref",
			"HEAD"
		], { timeoutMs }).catch(() => null),
		require_exec.runCommandWithTimeout([
			"git",
			"-C",
			root,
			"rev-parse",
			"HEAD"
		], { timeoutMs }).catch(() => null),
		require_exec.runCommandWithTimeout([
			"git",
			"-C",
			root,
			"describe",
			"--tags",
			"--exact-match"
		], { timeoutMs }).catch(() => null),
		require_exec.runCommandWithTimeout([
			"git",
			"-C",
			root,
			"rev-parse",
			"--abbrev-ref",
			"@{upstream}"
		], { timeoutMs }).catch(() => null),
		require_exec.runCommandWithTimeout([
			"git",
			"-C",
			root,
			"status",
			"--porcelain",
			"--",
			":!dist/control-ui/"
		], { timeoutMs }).catch(() => null)
	]);
	if (branchRes?.code !== 0) return {
		...base,
		error: branchRes?.stderr?.trim() || "git unavailable"
	};
	const branch = branchRes.stdout.trim() || null;
	const sha = shaRes && shaRes.code === 0 ? shaRes.stdout.trim() : null;
	const tag = tagRes && tagRes.code === 0 ? tagRes.stdout.trim() : null;
	const upstream = upstreamRes && upstreamRes.code === 0 ? upstreamRes.stdout.trim() : null;
	const dirty = dirtyRes && dirtyRes.code === 0 ? dirtyRes.stdout.trim().length > 0 : null;
	const fetchOk = params.fetch ? await require_exec.runCommandWithTimeout([
		"git",
		"-C",
		root,
		"fetch",
		"--quiet",
		"--prune"
	], { timeoutMs }).then((r) => r.code === 0).catch(() => false) : null;
	const counts = upstream && upstream.length > 0 ? await require_exec.runCommandWithTimeout([
		"git",
		"-C",
		root,
		"rev-list",
		"--left-right",
		"--count",
		`HEAD...${upstream}`
	], { timeoutMs }).catch(() => null) : null;
	const parseCounts = (raw) => {
		const parts = raw.trim().split(/\s+/);
		if (parts.length < 2) return null;
		const ahead = Number.parseInt(parts[0] ?? "", 10);
		const behind = Number.parseInt(parts[1] ?? "", 10);
		if (!Number.isFinite(ahead) || !Number.isFinite(behind)) return null;
		return {
			ahead,
			behind
		};
	};
	const parsed = counts && counts.code === 0 ? parseCounts(counts.stdout) : null;
	return {
		root,
		sha,
		tag,
		branch,
		upstream,
		dirty,
		ahead: parsed?.ahead ?? null,
		behind: parsed?.behind ?? null,
		fetchOk
	};
}
async function statMtimeMs(p) {
	try {
		return (await node_fs_promises.default.stat(p)).mtimeMs;
	} catch {
		return null;
	}
}
async function resolveDepsMarker(params) {
	const root = params.root;
	if (params.manager === "pnpm") return {
		lockfilePath: node_path.default.join(root, "pnpm-lock.yaml"),
		markerPath: node_path.default.join(root, "node_modules", ".modules.yaml")
	};
	if (params.manager === "bun") return {
		lockfilePath: node_path.default.join(root, "bun.lockb"),
		markerPath: node_path.default.join(root, "node_modules")
	};
	if (params.manager === "npm") {
		const shrinkwrapPath = node_path.default.join(root, "npm-shrinkwrap.json");
		return {
			lockfilePath: await exists(shrinkwrapPath) ? shrinkwrapPath : node_path.default.join(root, "package-lock.json"),
			markerPath: node_path.default.join(root, "node_modules")
		};
	}
	return {
		lockfilePath: null,
		markerPath: null
	};
}
async function checkDepsStatus(params) {
	const { lockfilePath, markerPath } = await resolveDepsMarker({
		root: node_path.default.resolve(params.root),
		manager: params.manager
	});
	if (!lockfilePath || !markerPath) return {
		manager: params.manager,
		status: "unknown",
		lockfilePath,
		markerPath,
		reason: "unknown package manager"
	};
	const lockExists = await exists(lockfilePath);
	const markerExists = await exists(markerPath);
	if (!lockExists) return {
		manager: params.manager,
		status: "unknown",
		lockfilePath,
		markerPath,
		reason: "lockfile missing"
	};
	if (!markerExists) return {
		manager: params.manager,
		status: "missing",
		lockfilePath,
		markerPath,
		reason: "node_modules marker missing"
	};
	const lockMtime = await statMtimeMs(lockfilePath);
	const markerMtime = await statMtimeMs(markerPath);
	if (!lockMtime || !markerMtime) return {
		manager: params.manager,
		status: "unknown",
		lockfilePath,
		markerPath
	};
	if (lockMtime > markerMtime + 1e3) return {
		manager: params.manager,
		status: "stale",
		lockfilePath,
		markerPath,
		reason: "lockfile newer than install marker"
	};
	return {
		manager: params.manager,
		status: "ok",
		lockfilePath,
		markerPath
	};
}
async function fetchNpmLatestVersion(params) {
	const res = await fetchNpmTagVersion({
		tag: "latest",
		timeoutMs: params?.timeoutMs,
		cwd: params?.cwd,
		env: params?.env,
		runCommand: params?.runCommand
	});
	return {
		latestVersion: res.version,
		error: res.error
	};
}
async function fetchNpmRegistryVersionForChannel(params) {
	const res = await resolveNpmChannelTag({
		channel: params.channel,
		timeoutMs: params.timeoutMs,
		cwd: params.cwd,
		env: params.env,
		runCommand: params.runCommand
	});
	return {
		latestVersion: res.version,
		tag: res.tag,
		...res.reason ? {
			error: res.reason,
			reason: res.reason
		} : {}
	};
}
async function fetchNpmPackageTargetStatus(params) {
	const timeoutMs = params.timeoutMs ?? 3500;
	const target = params.target;
	if (!params.command && !params.runCommand) return await fetchNpmPackageTargetStatusFromRegistry({
		target,
		timeoutMs
	});
	const runCommand = params.runCommand ?? require_exec.runCommandWithTimeout;
	try {
		const res = await runCommand([
			params.command ?? "npm",
			"view",
			packageTargetSpec({
				target,
				spec: params.spec
			}),
			"version",
			"engines.node",
			"--json",
			"--global"
		], {
			timeoutMs: Math.max(250, timeoutMs),
			cwd: params.cwd,
			env: params.env,
			maxOutputBytes: 1024 * 1024
		});
		if (res.code !== 0) return {
			target,
			version: null,
			nodeEngine: null,
			error: formatNpmViewError(res)
		};
		const { version, nodeEngine } = parseNpmPackageTargetMetadata(res.stdout);
		return {
			target,
			version,
			nodeEngine
		};
	} catch (err) {
		return {
			target,
			version: null,
			nodeEngine: null,
			error: String(err)
		};
	}
}
async function fetchNpmTagVersion(params) {
	const res = await fetchNpmPackageTargetStatus({
		target: params.tag,
		timeoutMs: params.timeoutMs,
		spec: params.spec,
		command: params.command,
		cwd: params.cwd,
		env: params.env,
		runCommand: params.runCommand
	});
	return {
		tag: params.tag,
		version: res.version,
		error: res.error
	};
}
async function resolveNpmChannelTag(params) {
	const channelTag = require_update_channels.channelToNpmTag(params.channel);
	if (params.channel === "extended-stable") {
		const resolved = await resolveExtendedStablePackage({
			installKind: "package",
			timeoutMs: params.timeoutMs
		});
		return resolved.status === "resolved" ? {
			tag: resolved.selector,
			version: resolved.version
		} : {
			tag: channelTag,
			version: null,
			reason: resolved.reason
		};
	}
	const channelStatus = await fetchNpmTagVersion({
		tag: channelTag,
		timeoutMs: params.timeoutMs,
		command: params.command,
		cwd: params.cwd,
		env: params.env,
		runCommand: params.runCommand
	});
	if (params.channel !== "beta") return {
		tag: channelTag,
		version: channelStatus.version
	};
	const latestStatus = await fetchNpmTagVersion({
		tag: "latest",
		timeoutMs: params.timeoutMs,
		command: params.command,
		cwd: params.cwd,
		env: params.env,
		runCommand: params.runCommand
	});
	if (!latestStatus.version) return {
		tag: channelTag,
		version: channelStatus.version
	};
	if (!channelStatus.version) return {
		tag: "latest",
		version: latestStatus.version
	};
	const cmp = compareSemverStrings(channelStatus.version, latestStatus.version);
	if (cmp != null && cmp < 0) return {
		tag: "latest",
		version: latestStatus.version
	};
	return {
		tag: channelTag,
		version: channelStatus.version
	};
}
function compareSemverStrings(a, b) {
	if (a && b) {
		const openClawReleaseCmp = require_npm_registry_spec.compareOperatorReleaseVersions(a, b);
		if (openClawReleaseCmp != null) return openClawReleaseCmp;
	}
	const normalizedA = a ? require_semver.normalizeLegacyDotBetaVersion(a) : null;
	const normalizedB = b ? require_semver.normalizeLegacyDotBetaVersion(b) : null;
	return normalizedA && normalizedB ? require_semver.compareValidSemver(normalizedA, normalizedB) : null;
}
async function checkUpdateStatus(params) {
	const timeoutMs = params.timeoutMs ?? 6e3;
	const fetchRegistry = () => params.registryChannel ? fetchNpmRegistryVersionForChannel({
		channel: params.registryChannel,
		timeoutMs
	}) : fetchNpmLatestVersion({ timeoutMs });
	const root = params.root ? node_path.default.resolve(params.root) : null;
	if (!root) return {
		root: null,
		installKind: "unknown",
		packageManager: "unknown",
		registry: params.includeRegistry ? await fetchRegistry() : void 0
	};
	const rootRealpath = await node_fs_promises.default.realpath(root).catch(() => root);
	const [pm, gitRoot] = await Promise.all([detectPackageManager(root), detectGitRoot(root)]);
	const isGit = gitRoot && node_path.default.resolve(gitRoot) === node_path.default.resolve(rootRealpath);
	const registry = params.includeRegistry ? params.registryChannel === "extended-stable" && isGit ? {
		latestVersion: null,
		tag: "extended-stable",
		error: "unsupported_git_channel",
		reason: "unsupported_git_channel"
	} : await fetchRegistry() : void 0;
	const installKind = isGit ? "git" : "package";
	const [git, deps] = await Promise.all([isGit ? checkGitUpdateStatus({
		root,
		timeoutMs,
		fetch: Boolean(params.fetchGit)
	}) : Promise.resolve(void 0), checkDepsStatus({
		root,
		manager: pm
	})]);
	return {
		root,
		installKind,
		packageManager: pm,
		git,
		deps,
		registry
	};
}
//#endregion
Object.defineProperty(exports, "checkUpdateStatus", {
	enumerable: true,
	get: function() {
		return checkUpdateStatus;
	}
});
Object.defineProperty(exports, "compareSemverStrings", {
	enumerable: true,
	get: function() {
		return compareSemverStrings;
	}
});
Object.defineProperty(exports, "detectPackageManager", {
	enumerable: true,
	get: function() {
		return detectPackageManager$1;
	}
});
Object.defineProperty(exports, "formatGitInstallLabel", {
	enumerable: true,
	get: function() {
		return formatGitInstallLabel;
	}
});
Object.defineProperty(exports, "resolveExtendedStablePackage", {
	enumerable: true,
	get: function() {
		return resolveExtendedStablePackage;
	}
});
Object.defineProperty(exports, "resolveNpmChannelTag", {
	enumerable: true,
	get: function() {
		return resolveNpmChannelTag;
	}
});
