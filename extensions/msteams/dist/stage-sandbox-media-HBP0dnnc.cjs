const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
const require_media_reference = require("./media-reference-1HgJGiDy.cjs");
const require_sandbox_paths = require("./sandbox-paths-BmmHDLnB.cjs");
const require_channel_inbound_roots = require("./channel-inbound-roots-D9jR-iC-.cjs");
const require_sandbox = require("./sandbox-CjshBxRn.cjs");
const require_docker = require("./docker-Bz1bPNmB.cjs");
const require_scp_host = require("./scp-host-CIGWtgvr.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_media_core_inbound_path_policy = require("@gabrielvfonseca/media-core/inbound-path-policy");
let _openclaw_fs_safe_errors = require("@openclaw/fs-safe/errors");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
//#region src/auto-reply/reply/stage-sandbox-media.ts
const STAGED_MEDIA_MAX_BYTES = require_store.MEDIA_MAX_BYTES;
const SCP_STDERR_TAIL_CHARS = 16384;
const EMPTY_STAGE_RESULT = { staged: /* @__PURE__ */ new Map() };
async function stageSandboxMedia(params) {
	const { ctx, sessionCtx, cfg, sessionKey, workspaceDir } = params;
	const hasPathsArray = Array.isArray(ctx.MediaPaths) && ctx.MediaPaths.length > 0;
	const rawPaths = resolveRawPaths(ctx);
	if (rawPaths.length === 0 || !sessionKey) return EMPTY_STAGE_RESULT;
	const sandbox = ctx.MediaRemoteHost && params.remoteMediaMode === "cache" ? null : await require_sandbox.ensureSandboxWorkspaceForSession({
		config: cfg,
		sessionKey,
		workspaceDir
	});
	const remoteMediaCacheDir = ctx.MediaRemoteHost ? node_path.default.join(require_utils.CONFIG_DIR, "media", "remote-cache", require_docker.slugifySessionKey(sessionKey)) : null;
	const effectiveWorkspaceDir = sandbox?.workspaceDir ?? remoteMediaCacheDir ?? workspaceDir;
	if (!effectiveWorkspaceDir) return EMPTY_STAGE_RESULT;
	await node_fs_promises.default.mkdir(effectiveWorkspaceDir, { recursive: true });
	const remoteAttachmentRoots = ctx.MediaRemoteHost ? require_channel_inbound_roots.resolveChannelRemoteInboundAttachmentRoots({
		cfg,
		ctx
	}) ?? [] : [];
	const usedNames = /* @__PURE__ */ new Set();
	const staged = /* @__PURE__ */ new Map();
	const hostWorkspaceStagingDir = !sandbox && !ctx.MediaRemoteHost ? node_path.default.join("media", "inbound", `operator-staged-${node_crypto.default.randomUUID()}`) : void 0;
	for (const raw of rawPaths) {
		const source = await resolveStageableMediaSource(raw);
		if (!source || staged.has(source.lookupKey) || staged.has(source.physicalPath)) continue;
		if (!await isAllowedSourcePath({
			source: source.physicalPath,
			mediaRemoteHost: ctx.MediaRemoteHost,
			remoteAttachmentRoots
		})) continue;
		const fileName = allocateStagedFileName(source.pathForFileName, usedNames);
		if (!fileName) continue;
		const stageIntoSandboxMediaDir = Boolean(sandbox);
		const relativeDest = stageIntoSandboxMediaDir || hostWorkspaceStagingDir ? node_path.default.join(hostWorkspaceStagingDir ?? node_path.default.join("media", "inbound"), fileName) : fileName;
		const dest = node_path.default.join(effectiveWorkspaceDir, relativeDest);
		try {
			if (ctx.MediaRemoteHost) await stageRemoteFileIntoRoot({
				remoteHost: ctx.MediaRemoteHost,
				remotePath: source.physicalPath,
				rootDir: effectiveWorkspaceDir,
				relativeDestPath: relativeDest,
				maxBytes: STAGED_MEDIA_MAX_BYTES
			});
			else await stageLocalFileIntoRoot({
				sourcePath: await node_fs_promises.default.realpath(source.physicalPath).catch(() => source.physicalPath),
				rootDir: effectiveWorkspaceDir,
				relativeDestPath: relativeDest,
				maxBytes: STAGED_MEDIA_MAX_BYTES
			});
		} catch (err) {
			if (err instanceof _openclaw_fs_safe_errors.FsSafeError && err.code === "too-large") require_globals.logVerbose(`Blocking inbound media staging above ${STAGED_MEDIA_MAX_BYTES} bytes: ${source.physicalPath}`);
			else require_globals.logVerbose(`Failed to stage inbound media path ${source.physicalPath}: ${String(err)}`);
			continue;
		}
		const stagedPath = stageIntoSandboxMediaDir ? toPosixRelativePath(relativeDest) : dest;
		staged.set(source.lookupKey, stagedPath);
		if (source.physicalPath !== source.lookupKey) staged.set(source.physicalPath, stagedPath);
	}
	if (staged.size > 0 && hostWorkspaceStagingDir) ctx.MediaWorkspaceDir = node_path.default.join(effectiveWorkspaceDir, hostWorkspaceStagingDir);
	rewriteStagedMediaPaths({
		ctx,
		sessionCtx,
		rawPaths,
		staged,
		hasPathsArray
	});
	return { staged };
}
function toPosixRelativePath(filePath) {
	return filePath.split(node_path.default.sep).join(node_path.default.posix.sep);
}
async function resolveStageableMediaSource(value) {
	const raw = value.trim();
	if (!raw) return null;
	const inboundReference = await require_media_reference.resolveInboundMediaReference(raw).catch(() => null);
	if (inboundReference) return {
		lookupKey: raw,
		pathForFileName: inboundReference.physicalPath,
		physicalPath: inboundReference.physicalPath
	};
	const source = resolveAbsolutePath(raw);
	return source ? {
		lookupKey: source,
		pathForFileName: source,
		physicalPath: source
	} : null;
}
async function stageLocalFileIntoRoot(params) {
	await (await (0, _openclaw_fs_safe_root.root)(params.rootDir)).copyIn(params.relativeDestPath, params.sourcePath, { maxBytes: params.maxBytes });
}
async function stageRemoteFileIntoRoot(params) {
	const tmpRoot = require_tmp_operator_dir.resolvePreferredOperatorTmpDir();
	await node_fs_promises.default.mkdir(tmpRoot, { recursive: true });
	const tmpDir = await node_fs_promises.default.mkdtemp(node_path.default.join(tmpRoot, "stage-sandbox-media-"));
	const tmpPath = node_path.default.join(tmpDir, "download");
	try {
		await scpFile(params.remoteHost, params.remotePath, tmpPath);
		await stageLocalFileIntoRoot({
			sourcePath: tmpPath,
			rootDir: params.rootDir,
			relativeDestPath: params.relativeDestPath,
			maxBytes: params.maxBytes
		});
	} finally {
		await node_fs_promises.default.rm(tmpDir, {
			recursive: true,
			force: true
		}).catch(() => {});
	}
}
function resolveRawPaths(ctx) {
	const pathsFromArray = Array.isArray(ctx.MediaPaths) ? ctx.MediaPaths : void 0;
	return pathsFromArray && pathsFromArray.length > 0 ? pathsFromArray : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.MediaPath) ? [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.MediaPath)] : [];
}
function resolveAbsolutePath(value) {
	let resolved = value.trim();
	if (!resolved) return null;
	if (resolved.startsWith("file://")) try {
		resolved = (0, node_url.fileURLToPath)(resolved);
	} catch {
		return null;
	}
	if (!node_path.default.isAbsolute(resolved)) return null;
	return resolved;
}
async function isAllowedSourcePath(params) {
	if (params.mediaRemoteHost) {
		if (!(0, _gabrielvfonseca_media_core_inbound_path_policy.isInboundPathAllowed)({
			filePath: params.source,
			roots: params.remoteAttachmentRoots
		})) {
			require_globals.logVerbose(`Blocking remote media staging from disallowed attachment path: ${params.source}`);
			return false;
		}
		return true;
	}
	if (await require_media_reference.resolveInboundMediaReference(params.source).catch(() => null)) return true;
	const mediaDir = require_store.getMediaDir();
	const canonicalMediaDir = await node_fs_promises.default.realpath(mediaDir).catch(() => mediaDir);
	if (!(0, _gabrielvfonseca_media_core_inbound_path_policy.isInboundPathAllowed)({
		filePath: params.source,
		roots: [mediaDir, canonicalMediaDir]
	})) {
		require_globals.logVerbose(`Blocking attempt to stage media from outside media directory: ${params.source}`);
		return false;
	}
	try {
		await require_sandbox_paths.assertSandboxPath({
			filePath: await node_fs_promises.default.realpath(params.source).catch(() => params.source),
			cwd: canonicalMediaDir,
			root: canonicalMediaDir
		});
		return true;
	} catch {
		require_globals.logVerbose(`Blocking attempt to stage media from outside media directory: ${params.source}`);
		return false;
	}
}
function allocateStagedFileName(source, usedNames) {
	const baseName = node_path.default.basename(source);
	if (!baseName) return null;
	const parsed = node_path.default.parse(baseName);
	let fileName = baseName;
	let suffix = 1;
	while (usedNames.has(fileName)) {
		fileName = `${parsed.name}-${suffix}${parsed.ext}`;
		suffix += 1;
	}
	usedNames.add(fileName);
	return fileName;
}
function rewriteStagedMediaPaths(params) {
	const rewriteIfStaged = (value) => {
		const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
		if (!raw) return value;
		const abs = resolveAbsolutePath(raw);
		return params.staged.get(raw) ?? (abs ? params.staged.get(abs) : void 0) ?? value;
	};
	const nextMediaPaths = params.hasPathsArray ? params.rawPaths.map((p) => rewriteIfStaged(p) ?? p) : void 0;
	if (nextMediaPaths) {
		params.ctx.MediaPaths = nextMediaPaths;
		params.sessionCtx.MediaPaths = nextMediaPaths;
		params.ctx.MediaPath = nextMediaPaths[0];
		params.sessionCtx.MediaPath = nextMediaPaths[0];
	} else {
		const rewritten = rewriteIfStaged(params.ctx.MediaPath);
		if (rewritten && rewritten !== params.ctx.MediaPath) {
			params.ctx.MediaPath = rewritten;
			params.sessionCtx.MediaPath = rewritten;
		}
	}
	if (Array.isArray(params.ctx.MediaUrls) && params.ctx.MediaUrls.length > 0) {
		const nextUrls = params.ctx.MediaUrls.map((u) => rewriteIfStaged(u) ?? u);
		params.ctx.MediaUrls = nextUrls;
		params.sessionCtx.MediaUrls = nextUrls;
	}
	const rewrittenUrl = rewriteIfStaged(params.ctx.MediaUrl);
	if (rewrittenUrl && rewrittenUrl !== params.ctx.MediaUrl) {
		params.ctx.MediaUrl = rewrittenUrl;
		params.sessionCtx.MediaUrl = rewrittenUrl;
	}
}
async function scpFile(remoteHost, remotePath, localPath) {
	const safeRemoteHost = require_scp_host.normalizeScpRemoteHost(remoteHost);
	if (!safeRemoteHost) throw new Error("invalid remote host for SCP");
	const safeRemotePath = require_scp_host.normalizeScpRemotePath(remotePath);
	if (!safeRemotePath) throw new Error("invalid remote path for SCP");
	const result = await require_exec.runCommandWithTimeout([
		"scp",
		"-o",
		"BatchMode=yes",
		"-o",
		"StrictHostKeyChecking=yes",
		"--",
		`${safeRemoteHost}:${safeRemotePath}`,
		localPath
	], { maxOutputBytes: {
		stdout: 1,
		stderr: SCP_STDERR_TAIL_CHARS * 4
	} });
	if (result.code !== 0) {
		const stderr = appendScpStderrTail("", result.stderr).trim();
		throw new Error(`scp failed (${result.code}): ${stderr}`);
	}
}
function appendScpStderrTail(current, chunk, maxChars = SCP_STDERR_TAIL_CHARS) {
	const combined = `${current}${chunk}`;
	if (combined.length <= maxChars) return combined;
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(combined, Math.max(0, combined.length - maxChars));
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.stageSandboxMediaTestApi")] = { scpFile };
//#endregion
Object.defineProperty(exports, "stageSandboxMedia", {
	enumerable: true,
	get: function() {
		return stageSandboxMedia;
	}
});
