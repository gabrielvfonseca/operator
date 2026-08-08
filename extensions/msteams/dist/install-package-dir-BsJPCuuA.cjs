const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_replace_file = require("./replace-file-D77oDPOz.cjs");
require("./json-files-Bp0Z4DKb.cjs");
require("./install-safe-path-delEgqLr.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
require("./archive-HshK6KD3.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
const require_safe_package_install = require("./safe-package-install-D1effjCo.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_archive = require("@openclaw/fs-safe/archive");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/infra/install-flow.ts
/** Resolve and stat a user-provided install path. */
async function resolveExistingInstallPath(inputPath) {
	const resolvedPath = require_home_dir.resolveUserPath(inputPath);
	if (!await (0, _openclaw_fs_safe_advanced.pathExists)(resolvedPath)) return {
		ok: false,
		error: `path not found: ${resolvedPath}`
	};
	return {
		ok: true,
		resolvedPath,
		stat: await node_fs_promises.default.stat(resolvedPath)
	};
}
/** Extract an archive to a temp dir and run work against the detected package root. */
async function withExtractedArchiveRoot(params) {
	return await require_install_source_utils.withTempDir(params.tempDirPrefix, async (tmpDir) => {
		const extractDir = node_path.default.join(tmpDir, "extract");
		await node_fs_promises.default.mkdir(extractDir, { recursive: true });
		params.logger?.info?.(`Extracting ${params.archivePath}…`);
		try {
			await (0, _openclaw_fs_safe_archive.extractArchive)({
				archivePath: params.archivePath,
				destDir: extractDir,
				timeoutMs: params.timeoutMs,
				logger: params.logger
			});
		} catch (err) {
			return {
				ok: false,
				error: `failed to extract archive: ${String(err)}`
			};
		}
		let rootDir;
		try {
			rootDir = await (0, _openclaw_fs_safe_archive.resolvePackedRootDir)(extractDir, { rootMarkers: params.rootMarkers ? [...params.rootMarkers] : void 0 });
		} catch (err) {
			return {
				ok: false,
				error: String(err)
			};
		}
		return await params.onExtracted(rootDir);
	});
}
//#endregion
//#region src/infra/install-package-dir.ts
const DEFAULT_INSTALL_SOURCE_HARDLINKS = "reject";
const INSTALL_BASE_CHANGED_ERROR_MESSAGE = "install base directory changed during install";
const INSTALL_BASE_CHANGED_ABORT_WARNING = "Install base directory changed during install; aborting staged publish.";
const INSTALL_BASE_CHANGED_BACKUP_WARNING = "Install base directory changed before backup cleanup; leaving backup in place.";
const STAGED_NPM_PROJECT_CONFIG_NAME = ".npmrc";
const STAGED_NPM_PROJECT_CONFIG_PREFIX = ".operator-install-hidden-npmrc-";
async function sanitizeManifestForNpmInstall(targetDir) {
	const manifestPath = node_path.default.join(targetDir, "package.json");
	const parsed = await (0, _openclaw_fs_safe_json.tryReadJson)(manifestPath);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) return;
	const manifest = parsed;
	const devDependencies = manifest.devDependencies;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(devDependencies)) return;
	const filteredEntries = Object.entries(devDependencies).filter(([, rawSpec]) => {
		return !(typeof rawSpec === "string" ? rawSpec.trim() : "").startsWith("workspace:");
	});
	if (filteredEntries.length === Object.keys(devDependencies).length) return;
	if (filteredEntries.length === 0) delete manifest.devDependencies;
	else manifest.devDependencies = Object.fromEntries(filteredEntries);
	await (0, _openclaw_fs_safe_json.writeJson)(manifestPath, manifest, { trailingNewline: true });
}
function formatNpmDependencyInstallFailure(result) {
	const detail = result.stderr.trim() || result.stdout.trim();
	if (detail) return detail;
	if (result.code !== null) return `exit code ${result.code} (no output from npm)`;
	if (result.signal) return `signal ${result.signal} (no output from npm)`;
	return `termination ${result.termination} (no output from npm)`;
}
async function hideProjectNpmConfigForInstall(targetDir) {
	const originalPath = node_path.default.join(targetDir, STAGED_NPM_PROJECT_CONFIG_NAME);
	let hiddenDir = "";
	try {
		hiddenDir = await node_fs_promises.default.mkdtemp(node_path.default.join(targetDir, STAGED_NPM_PROJECT_CONFIG_PREFIX));
		const hiddenPath = node_path.default.join(hiddenDir, STAGED_NPM_PROJECT_CONFIG_NAME);
		await node_fs_promises.default.rename(originalPath, hiddenPath);
		return {
			hiddenDir,
			originalPath,
			hiddenPath
		};
	} catch (error) {
		if (hiddenDir) await node_fs_promises.default.rm(hiddenDir, {
			recursive: true,
			force: true
		}).catch(() => void 0);
		if (error.code === "ENOENT") return null;
		throw error;
	}
}
async function restoreProjectNpmConfigAfterInstall(hiddenConfig) {
	if (!hiddenConfig) return;
	await node_fs_promises.default.rename(hiddenConfig.hiddenPath, hiddenConfig.originalPath);
	await node_fs_promises.default.rm(hiddenConfig.hiddenDir, {
		recursive: true,
		force: true
	});
}
async function assertInstallBoundaryPaths(params) {
	for (const candidatePath of params.candidatePaths) await (0, _openclaw_fs_safe_advanced.assertCanonicalPathWithinBase)({
		baseDir: params.installBaseDir,
		candidatePath,
		boundaryLabel: "install directory"
	});
}
function isRelativePathInsideBase(relativePath) {
	return Boolean(relativePath) && relativePath !== ".." && !relativePath.startsWith(`..${node_path.default.sep}`);
}
function isInstallBaseChangedError(error) {
	return error instanceof Error && error.message === INSTALL_BASE_CHANGED_ERROR_MESSAGE;
}
function resolveMoveSourceHardlinks(policy) {
	return policy === "package-manager" ? "allow" : "reject";
}
async function assertInstallBaseStable(params) {
	if (!(await node_fs_promises.default.stat(params.installBaseDir)).isDirectory()) throw new Error(INSTALL_BASE_CHANGED_ERROR_MESSAGE);
	if (await node_fs_promises.default.realpath(params.installBaseDir) !== params.expectedRealPath) throw new Error(INSTALL_BASE_CHANGED_ERROR_MESSAGE);
}
async function cleanupInstallTempDir(dirPath) {
	if (!dirPath) return;
	await node_fs_promises.default.rm(dirPath, {
		recursive: true,
		force: true
	}).catch(() => void 0);
}
async function resolveInstallPublishTarget(params) {
	const installBaseResolved = node_path.default.resolve(params.installBaseDir);
	const targetResolved = node_path.default.resolve(params.targetDir);
	const targetRelativePath = node_path.default.relative(installBaseResolved, targetResolved);
	if (!isRelativePathInsideBase(targetRelativePath)) throw new Error("invalid install target path");
	const installBaseRealPath = await node_fs_promises.default.realpath(params.installBaseDir);
	return {
		installBaseRealPath,
		canonicalTargetDir: node_path.default.join(installBaseRealPath, targetRelativePath)
	};
}
/**
* Publishes a package directory into an install target via a staged copy.
* Update mode backs up the existing target, runs optional validation hooks,
* and rolls back when copy, dependency install, or validation fails.
*/
async function installPackageDir(params) {
	params.logger?.info?.(`Installing to ${params.targetDir}…`);
	const installBaseDir = node_path.default.dirname(params.targetDir);
	let initialInstallBaseRealPath;
	try {
		await node_fs_promises.default.mkdir(installBaseDir, { recursive: true });
		initialInstallBaseRealPath = await node_fs_promises.default.realpath(installBaseDir);
		await assertInstallBoundaryPaths({
			installBaseDir,
			candidatePaths: [params.targetDir]
		});
	} catch (err) {
		return {
			ok: false,
			error: `${params.copyErrorPrefix}: ${String(err)}`
		};
	}
	let installBaseRealPath;
	let canonicalTargetDir;
	try {
		({installBaseRealPath, canonicalTargetDir} = await resolveInstallPublishTarget({
			installBaseDir,
			targetDir: params.targetDir
		}));
		if (installBaseRealPath !== initialInstallBaseRealPath) throw new Error(INSTALL_BASE_CHANGED_ERROR_MESSAGE);
	} catch (err) {
		if (isInstallBaseChangedError(err)) params.logger?.warn?.(INSTALL_BASE_CHANGED_ABORT_WARNING);
		return {
			ok: false,
			error: `${params.copyErrorPrefix}: ${String(err)}`
		};
	}
	let stageDir = null;
	let backupDir = null;
	const sourceHardlinks = resolveMoveSourceHardlinks(params.sourceHardlinks ?? DEFAULT_INSTALL_SOURCE_HARDLINKS);
	const fail = async (error, cause) => {
		if (isInstallBaseChangedError(cause)) params.logger?.warn?.(INSTALL_BASE_CHANGED_ABORT_WARNING);
		else {
			await restoreBackup();
			if (stageDir) {
				await cleanupInstallTempDir(stageDir);
				stageDir = null;
			}
		}
		return {
			ok: false,
			error
		};
	};
	const failWithCode = async (paramsLocal, cause) => {
		const failed = await fail(paramsLocal.error, cause);
		return paramsLocal.code ? {
			...failed,
			code: paramsLocal.code
		} : failed;
	};
	const restoreBackup = async () => {
		if (!backupDir) return;
		await require_replace_file.movePathWithCopyFallback({
			from: backupDir,
			sourceHardlinks,
			to: canonicalTargetDir
		}).catch(() => void 0);
		backupDir = null;
	};
	try {
		await assertInstallBoundaryPaths({
			installBaseDir: installBaseRealPath,
			candidatePaths: [canonicalTargetDir]
		});
		stageDir = await node_fs_promises.default.mkdtemp(node_path.default.join(installBaseRealPath, ".operator-install-stage-"));
		await node_fs_promises.default.cp(params.sourceDir, stageDir, {
			recursive: true,
			verbatimSymlinks: true
		});
	} catch (err) {
		return await fail(`${params.copyErrorPrefix}: ${String(err)}`, err);
	}
	try {
		await params.afterCopy?.(stageDir);
	} catch (err) {
		return await fail(`post-copy validation failed: ${String(err)}`, err);
	}
	if (params.hasDeps) try {
		await sanitizeManifestForNpmInstall(stageDir);
		const hiddenProjectNpmConfig = await hideProjectNpmConfigForInstall(stageDir);
		params.logger?.info?.(params.depsLogMessage);
		const npmRes = await (async () => {
			try {
				return await require_exec.runCommandWithTimeout(["npm", ...require_safe_package_install.createSafeNpmInstallArgs({
					omitDev: true,
					loglevel: "error"
				})], {
					timeoutMs: Math.max(params.timeoutMs, 3e5),
					cwd: stageDir,
					env: require_safe_package_install.createSafeNpmInstallEnv(process.env, { npmConfigCwd: stageDir })
				});
			} finally {
				await restoreProjectNpmConfigAfterInstall(hiddenProjectNpmConfig);
			}
		})();
		if (npmRes.code !== 0) return await fail(`npm install failed: ${formatNpmDependencyInstallFailure(npmRes)}`);
	} catch (error) {
		return await fail(`npm install failed: ${String(error)}`, error);
	}
	if (params.afterInstall) try {
		const postInstallResult = await params.afterInstall(stageDir);
		if (!postInstallResult.ok) return await failWithCode(postInstallResult);
	} catch (err) {
		return await fail(`post-install validation failed: ${String(err)}`, err);
	}
	if (params.mode === "update" && await (0, _openclaw_fs_safe_advanced.pathExists)(canonicalTargetDir)) {
		const backupRoot = node_path.default.join(installBaseRealPath, ".operator-install-backups");
		backupDir = node_path.default.join(backupRoot, `${node_path.default.basename(canonicalTargetDir)}-${Date.now()}`);
		try {
			await node_fs_promises.default.mkdir(backupRoot, { recursive: true });
			await assertInstallBoundaryPaths({
				installBaseDir: installBaseRealPath,
				candidatePaths: [backupDir]
			});
			await assertInstallBaseStable({
				installBaseDir,
				expectedRealPath: installBaseRealPath
			});
			await require_replace_file.movePathWithCopyFallback({
				from: canonicalTargetDir,
				sourceHardlinks,
				to: backupDir
			});
		} catch (err) {
			return await fail(`${params.copyErrorPrefix}: ${String(err)}`, err);
		}
	}
	try {
		await assertInstallBaseStable({
			installBaseDir,
			expectedRealPath: installBaseRealPath
		});
		await require_replace_file.movePathWithCopyFallback({
			from: stageDir,
			sourceHardlinks,
			to: canonicalTargetDir
		});
		stageDir = null;
	} catch (err) {
		return await fail(`${params.copyErrorPrefix}: ${String(err)}`, err);
	}
	if (backupDir) try {
		await assertInstallBaseStable({
			installBaseDir,
			expectedRealPath: installBaseRealPath
		});
	} catch (err) {
		if (isInstallBaseChangedError(err)) params.logger?.warn?.(INSTALL_BASE_CHANGED_BACKUP_WARNING);
		backupDir = null;
	}
	if (backupDir) await node_fs_promises.default.rm(backupDir, {
		recursive: true,
		force: true
	}).catch(() => void 0);
	if (stageDir) await cleanupInstallTempDir(stageDir);
	return { ok: true };
}
/**
* Installs a manifest-backed package directory while deriving whether npm
* dependencies must be installed and which hardlink policy is safe to use.
*/
async function installPackageDirWithManifestDeps(params) {
	const hasDeps = Object.keys(params.manifestDependencies ?? {}).length > 0;
	return installPackageDir({
		...params,
		hasDeps,
		sourceHardlinks: hasDeps ? "package-manager" : "reject"
	});
}
//#endregion
Object.defineProperty(exports, "installPackageDir", {
	enumerable: true,
	get: function() {
		return installPackageDir;
	}
});
Object.defineProperty(exports, "installPackageDirWithManifestDeps", {
	enumerable: true,
	get: function() {
		return installPackageDirWithManifestDeps;
	}
});
Object.defineProperty(exports, "resolveExistingInstallPath", {
	enumerable: true,
	get: function() {
		return resolveExistingInstallPath;
	}
});
Object.defineProperty(exports, "withExtractedArchiveRoot", {
	enumerable: true,
	get: function() {
		return withExtractedArchiveRoot;
	}
});
