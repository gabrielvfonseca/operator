const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
require("./local-file-access-r6xSCXfB.cjs");
require("./path-alias-guards-r6xSCXfB.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_media_core_media_source_url = require("@gabrielvfonseca/media-core/media-source-url");
let _openclaw_fs_safe_archive = require("@openclaw/fs-safe/archive");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/agents/sandbox-paths.ts
/**
* Sandbox input path normalization and boundary checks.
*
* Handles host paths, file URLs, temporary media paths, and workspace root assertions.
*/
const UNICODE_SPACES = /[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g;
const DATA_URL_RE = /^data:/i;
const SANDBOX_CONTAINER_WORKDIR = "/workspace";
const MANAGED_MEDIA_SUBDIRS = /* @__PURE__ */ new Set(["outbound"]);
function normalizeUnicodeSpaces(str) {
	return str.replace(UNICODE_SPACES, " ");
}
function normalizeAtPrefix(filePath) {
	return filePath.startsWith("@") ? filePath.slice(1) : filePath;
}
function expandPath(filePath) {
	const normalized = normalizeUnicodeSpaces(normalizeAtPrefix(filePath));
	if (normalized === "~") return node_os.default.homedir();
	if (normalized.startsWith("~/")) return node_os.default.homedir() + normalized.slice(1);
	return normalized;
}
/** True when the path is absolute for the current platform or a Windows drive path (e.g. C:\\...), even if path.isAbsolute is false under POSIX rules. */
function hostPathLooksAbsolute(expanded) {
	return node_path.default.isAbsolute(expanded) || (0, _openclaw_fs_safe_archive.isWindowsDrivePath)(expanded);
}
function resolveToCwd(filePath, cwd) {
	const expanded = expandPath(filePath);
	if ((0, _openclaw_fs_safe_archive.isWindowsDrivePath)(expanded)) return node_path.default.win32.normalize(expanded);
	if (node_path.default.isAbsolute(expanded)) return expanded;
	return node_path.default.resolve(cwd, expanded);
}
function resolveSandboxInputPath(filePath, cwd) {
	return resolveToCwd(filePath, cwd);
}
function resolveSandboxPath(params) {
	const resolved = resolveSandboxInputPath(params.filePath, params.cwd);
	const rootResolved = node_path.default.resolve(params.root);
	const relative = node_path.default.relative(rootResolved, resolved);
	if (!relative || relative === "") return {
		resolved,
		relative: ""
	};
	if (relative === ".." || relative.startsWith("../") || relative.startsWith("..\\") || node_path.default.isAbsolute(relative) || (0, _openclaw_fs_safe_archive.isWindowsDrivePath)(relative)) throw new Error(`Path escapes sandbox root (${require_utils.shortenHomePath(rootResolved)}): ${params.filePath}`);
	return {
		resolved,
		relative
	};
}
async function assertSandboxPath(params) {
	const resolved = resolveSandboxPath(params);
	const policy = {
		allowFinalSymlinkForUnlink: params.allowFinalSymlinkForUnlink,
		allowFinalHardlinkForUnlink: params.allowFinalHardlinkForUnlink
	};
	await (0, _openclaw_fs_safe_advanced.assertNoPathAliasEscape)({
		absolutePath: resolved.resolved,
		rootPath: params.root,
		boundaryLabel: "sandbox root",
		policy
	});
	return resolved;
}
function assertMediaNotDataUrl(media) {
	const raw = media.trim();
	if (DATA_URL_RE.test(raw)) throw new Error("data: URLs are not supported for media. Use buffer instead.");
}
function isManagedMediaPathUnderRoot(candidate) {
	const expanded = expandPath(candidate);
	if (!hostPathLooksAbsolute(expanded)) return false;
	const mediaRoot = node_path.default.join(require_utils.resolveConfigDir(), "media");
	const resolvedMediaRoot = node_path.default.resolve(mediaRoot);
	const resolvedExpanded = node_path.default.resolve(expanded);
	if (resolvedExpanded === resolvedMediaRoot || !(0, _openclaw_fs_safe_path.isPathInside)(resolvedMediaRoot, resolvedExpanded)) return false;
	const firstSegment = node_path.default.relative(resolvedMediaRoot, resolvedExpanded).split(node_path.default.sep)[0] ?? "";
	return MANAGED_MEDIA_SUBDIRS.has(firstSegment) || firstSegment.startsWith("tool-");
}
async function resolveAllowedManagedMediaPath(candidate) {
	const expanded = expandPath(candidate);
	if (!isManagedMediaPathUnderRoot(expanded)) return;
	const resolved = node_path.default.resolve(expanded);
	await assertNoManagedMediaAliasEscape({
		filePath: resolved,
		managedMediaRoot: node_path.default.resolve(require_utils.resolveConfigDir(), "media")
	});
	return resolved;
}
async function resolveSandboxedMediaSource(params) {
	const raw = params.media.trim();
	if (!raw) return raw;
	if ((0, _gabrielvfonseca_media_core_media_source_url.isPassThroughRemoteMediaSource)(raw)) return raw;
	let candidate = raw;
	if (/^file:\/\//i.test(candidate)) {
		const workspaceMappedFromUrl = mapContainerWorkspaceFileUrl({
			fileUrl: candidate,
			sandboxRoot: params.sandboxRoot
		});
		if (workspaceMappedFromUrl) candidate = workspaceMappedFromUrl;
		else try {
			candidate = (0, _openclaw_fs_safe_advanced.safeFileURLToPath)(candidate);
		} catch (err) {
			throw new Error(`Invalid file:// URL for sandboxed media: ${err.message}`, { cause: err });
		}
	}
	const containerWorkspaceMapped = mapContainerWorkspacePath({
		candidate,
		sandboxRoot: params.sandboxRoot
	});
	if (containerWorkspaceMapped) candidate = containerWorkspaceMapped;
	(0, _openclaw_fs_safe_advanced.assertNoWindowsNetworkPath)(candidate, "Sandbox media path");
	const tmpMediaPath = await resolveAllowedTmpMediaPath({
		candidate,
		sandboxRoot: params.sandboxRoot
	});
	if (tmpMediaPath) return tmpMediaPath;
	const managedMediaPath = await resolveAllowedManagedMediaPath(candidate);
	if (managedMediaPath) return managedMediaPath;
	return (await assertSandboxPath({
		filePath: candidate,
		cwd: params.sandboxRoot,
		root: params.sandboxRoot
	})).resolved;
}
async function assertNoManagedMediaAliasEscape(params) {
	await (0, _openclaw_fs_safe_advanced.assertNoPathAliasEscape)({
		absolutePath: params.filePath,
		rootPath: params.managedMediaRoot,
		boundaryLabel: "managed media root"
	});
}
function mapContainerWorkspaceFileUrl(params) {
	let parsed;
	try {
		parsed = new node_url.URL(params.fileUrl);
	} catch {
		return;
	}
	if (parsed.protocol !== "file:") return;
	const host = parsed.hostname.trim().toLowerCase();
	if (host && host !== "localhost") return;
	if ((0, _openclaw_fs_safe_advanced.hasEncodedFileUrlSeparator)(parsed.pathname)) return;
	let normalizedPathname;
	try {
		normalizedPathname = decodeURIComponent(parsed.pathname).replace(/\\/g, "/");
	} catch {
		return;
	}
	if (normalizedPathname !== SANDBOX_CONTAINER_WORKDIR && !normalizedPathname.startsWith(`${SANDBOX_CONTAINER_WORKDIR}/`)) return;
	return mapContainerWorkspacePath({
		candidate: normalizedPathname,
		sandboxRoot: params.sandboxRoot
	});
}
function mapContainerWorkspacePath(params) {
	const normalized = params.candidate.replace(/\\/g, "/");
	if (normalized === SANDBOX_CONTAINER_WORKDIR) return node_path.default.resolve(params.sandboxRoot);
	const prefix = `${SANDBOX_CONTAINER_WORKDIR}/`;
	if (!normalized.startsWith(prefix)) return;
	const rel = normalized.slice(prefix.length);
	if (!rel) return node_path.default.resolve(params.sandboxRoot);
	return node_path.default.resolve(params.sandboxRoot, ...rel.split("/").filter(Boolean));
}
async function resolveAllowedTmpMediaPath(params) {
	if (!hostPathLooksAbsolute(expandPath(params.candidate))) return;
	const resolved = node_path.default.resolve(resolveSandboxInputPath(params.candidate, params.sandboxRoot));
	const openClawTmpDir = node_path.default.resolve(require_tmp_operator_dir.resolvePreferredOperatorTmpDir());
	if (!(0, _openclaw_fs_safe_path.isPathInside)(openClawTmpDir, resolved)) return;
	await assertNoTmpAliasEscape({
		filePath: resolved,
		tmpRoot: openClawTmpDir
	});
	return resolved;
}
async function assertNoTmpAliasEscape(params) {
	await (0, _openclaw_fs_safe_advanced.assertNoPathAliasEscape)({
		absolutePath: params.filePath,
		rootPath: params.tmpRoot,
		boundaryLabel: "tmp root"
	});
}
//#endregion
Object.defineProperty(exports, "assertMediaNotDataUrl", {
	enumerable: true,
	get: function() {
		return assertMediaNotDataUrl;
	}
});
Object.defineProperty(exports, "assertSandboxPath", {
	enumerable: true,
	get: function() {
		return assertSandboxPath;
	}
});
Object.defineProperty(exports, "resolveAllowedManagedMediaPath", {
	enumerable: true,
	get: function() {
		return resolveAllowedManagedMediaPath;
	}
});
Object.defineProperty(exports, "resolveSandboxInputPath", {
	enumerable: true,
	get: function() {
		return resolveSandboxInputPath;
	}
});
Object.defineProperty(exports, "resolveSandboxPath", {
	enumerable: true,
	get: function() {
		return resolveSandboxPath;
	}
});
Object.defineProperty(exports, "resolveSandboxedMediaSource", {
	enumerable: true,
	get: function() {
		return resolveSandboxedMediaSource;
	}
});
