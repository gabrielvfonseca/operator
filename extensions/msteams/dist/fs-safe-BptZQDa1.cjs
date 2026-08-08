const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
let _openclaw_fs_safe_errors = require("@openclaw/fs-safe/errors");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_secure_file = require("@openclaw/fs-safe/secure-file");
let _openclaw_fs_safe_walk = require("@openclaw/fs-safe/walk");
//#region src/infra/fs-safe.ts
var fs_safe_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	FsSafeError: () => _openclaw_fs_safe_errors.FsSafeError,
	appendRegularFile: () => _openclaw_fs_safe_advanced.appendRegularFile,
	appendRegularFileSync: () => _openclaw_fs_safe_advanced.appendRegularFileSync,
	assertAbsolutePathInput: () => _openclaw_fs_safe_advanced.assertAbsolutePathInput,
	canonicalPathFromExistingAncestor: () => _openclaw_fs_safe_advanced.canonicalPathFromExistingAncestor,
	ensureAbsoluteDirectory: () => ensureAbsoluteDirectory,
	findExistingAncestor: () => _openclaw_fs_safe_advanced.findExistingAncestor,
	isPathInside: () => _openclaw_fs_safe_path.isPathInside,
	movePathToTrash: () => _openclaw_fs_safe_advanced.movePathToTrash,
	openLocalFileSafely: () => _openclaw_fs_safe_root.openLocalFileSafely,
	pathExists: () => _openclaw_fs_safe_advanced.pathExists,
	pathExistsSync: () => _openclaw_fs_safe_advanced.pathExistsSync,
	readFileWithinRoot: () => readFileWithinRoot,
	readLocalFileFromRoots: () => _openclaw_fs_safe_advanced.readLocalFileFromRoots,
	readLocalFileSafely: () => _openclaw_fs_safe_root.readLocalFileSafely,
	readRegularFile: () => _openclaw_fs_safe_advanced.readRegularFile,
	readRegularFileSync: () => _openclaw_fs_safe_advanced.readRegularFileSync,
	readSecureFile: () => _openclaw_fs_safe_secure_file.readSecureFile,
	resolveAbsolutePathForRead: () => _openclaw_fs_safe_advanced.resolveAbsolutePathForRead,
	resolveAbsolutePathForWrite: () => _openclaw_fs_safe_advanced.resolveAbsolutePathForWrite,
	resolveLocalPathFromRootsSync: () => _openclaw_fs_safe_advanced.resolveLocalPathFromRootsSync,
	resolveOpenedFileRealPathForHandle: () => _openclaw_fs_safe_root.resolveOpenedFileRealPathForHandle,
	resolveRegularFileAppendFlags: () => _openclaw_fs_safe_advanced.resolveRegularFileAppendFlags,
	root: () => _openclaw_fs_safe_root.root,
	sanitizeUntrustedFileName: () => _openclaw_fs_safe_advanced.sanitizeUntrustedFileName,
	statRegularFile: () => _openclaw_fs_safe_advanced.statRegularFile,
	statRegularFileSync: () => _openclaw_fs_safe_advanced.statRegularFileSync,
	walkDirectory: () => _openclaw_fs_safe_walk.walkDirectory,
	walkDirectorySync: () => _openclaw_fs_safe_walk.walkDirectorySync,
	withTimeout: () => _openclaw_fs_safe_advanced.withTimeout,
	writeExternalFileWithinRoot: () => writeExternalFileWithinRoot,
	writeFileWithinRoot: () => writeFileWithinRoot
});
async function ensureAbsoluteDirectory(dirPath, options) {
	const absolutePath = node_path.default.resolve(dirPath);
	const scopeLabel = options?.scopeLabel ?? "directory";
	const existingAncestor = await (0, _openclaw_fs_safe_advanced.findExistingAncestor)(absolutePath);
	if (!existingAncestor) return {
		ok: false,
		error: /* @__PURE__ */ new Error(`Invalid path: must stay within ${scopeLabel}`)
	};
	if (existingAncestor === absolutePath) {
		try {
			const stat = await node_fs_promises.default.lstat(absolutePath);
			if (!stat.isSymbolicLink() && stat.isDirectory()) return {
				ok: true,
				path: absolutePath
			};
		} catch {}
		return {
			ok: false,
			error: /* @__PURE__ */ new Error(`Invalid path: must stay within ${scopeLabel}`)
		};
	}
	const result = await (0, _openclaw_fs_safe_advanced.ensureDirectoryWithinRoot)({
		rootDir: existingAncestor,
		requestedPath: node_path.default.relative(existingAncestor, absolutePath),
		scopeLabel,
		mode: options?.mode
	});
	if (result.ok) return result;
	return {
		ok: false,
		error: new Error(result.error)
	};
}
async function writeExternalFileWithinRoot(options) {
	const targetPath = node_path.default.resolve(options.rootDir, options.path);
	await (0, _openclaw_fs_safe_advanced.writeViaSiblingTempPath)({
		rootDir: options.rootDir,
		targetPath,
		writeTemp: options.write,
		fallbackFileName: options.fallbackFileName,
		tempPrefix: options.tempPrefix
	});
	return { path: targetPath };
}
/** @deprecated Use root(rootDir).read(relativePath, options). */
async function readFileWithinRoot(params) {
	return await (await (0, _openclaw_fs_safe_root.root)(params.rootDir)).read(params.relativePath, {
		hardlinks: params.rejectHardlinks === false ? "allow" : "reject",
		maxBytes: params.maxBytes,
		nonBlockingRead: params.nonBlockingRead,
		symlinks: params.allowSymlinkTargetWithinRoot === true ? "follow-within-root" : "reject"
	});
}
/** @deprecated Use root(rootDir).write(relativePath, data, options). */
async function writeFileWithinRoot(params) {
	await (await (0, _openclaw_fs_safe_root.root)(params.rootDir)).write(params.relativePath, params.data, {
		encoding: params.encoding,
		mkdir: params.mkdir
	});
}
//#endregion
Object.defineProperty(exports, "fs_safe_exports", {
	enumerable: true,
	get: function() {
		return fs_safe_exports;
	}
});
Object.defineProperty(exports, "writeExternalFileWithinRoot", {
	enumerable: true,
	get: function() {
		return writeExternalFileWithinRoot;
	}
});
