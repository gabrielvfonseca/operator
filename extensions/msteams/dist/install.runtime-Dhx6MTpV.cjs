require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
require("./archive-HshK6KD3.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
require("./scan-paths-bPESVZQ5.cjs");
const require_install_package_dir = require("./install-package-dir-BsJPCuuA.cjs");
const require_install_target = require("./install-target-CdfJ0Nsa.cjs");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _openclaw_fs_safe_archive = require("@openclaw/fs-safe/archive");
//#region src/infra/install-from-npm-spec.ts
/**
* Validates a registry npm spec, downloads its archive, and delegates final installation.
* The caller supplies archive-specific params without `archivePath`; this helper injects
* the downloaded archive path and normalizes the npm archive flow result.
*/
async function installFromValidatedNpmSpecArchive(params) {
	const spec = params.spec.trim();
	const specError = require_npm_registry_spec.validateRegistryNpmSpec(spec);
	if (specError) return {
		ok: false,
		error: specError
	};
	return require_install_target.finalizeNpmSpecArchiveInstall(await require_install_target.installFromNpmSpecArchiveWithInstaller({
		tempDirPrefix: params.tempDirPrefix,
		spec,
		timeoutMs: params.timeoutMs,
		expectedIntegrity: params.expectedIntegrity,
		onIntegrityDrift: params.onIntegrityDrift,
		warn: params.warn,
		installFromArchive: params.installFromArchive,
		archiveInstallParams: params.archiveInstallParams
	}));
}
//#endregion
exports.ensureInstallTargetAvailable = require_install_target.ensureInstallTargetAvailable;
Object.defineProperty(exports, "fileExists", {
	enumerable: true,
	get: function() {
		return _openclaw_fs_safe_advanced.pathExists;
	}
});
exports.installFromValidatedNpmSpecArchive = installFromValidatedNpmSpecArchive;
exports.installPackageDir = require_install_package_dir.installPackageDir;
exports.installPackageDirWithManifestDeps = require_install_package_dir.installPackageDirWithManifestDeps;
Object.defineProperty(exports, "isPathInside", {
	enumerable: true,
	get: function() {
		return _openclaw_fs_safe_path.isPathInside;
	}
});
Object.defineProperty(exports, "isPathInsideWithRealpath", {
	enumerable: true,
	get: function() {
		return _openclaw_fs_safe_path.isPathInsideWithRealpath;
	}
});
Object.defineProperty(exports, "readJsonFile", {
	enumerable: true,
	get: function() {
		return _openclaw_fs_safe_json.readJson;
	}
});
Object.defineProperty(exports, "resolveArchiveKind", {
	enumerable: true,
	get: function() {
		return _openclaw_fs_safe_archive.resolveArchiveKind;
	}
});
exports.resolveArchiveSourcePath = require_install_source_utils.resolveArchiveSourcePath;
exports.resolveCanonicalInstallTarget = require_install_target.resolveCanonicalInstallTarget;
exports.resolveExistingInstallPath = require_install_package_dir.resolveExistingInstallPath;
exports.resolveInstallModeOptions = require_install_target.resolveInstallModeOptions;
exports.resolveTimedInstallModeOptions = require_install_target.resolveTimedInstallModeOptions;
exports.withExtractedArchiveRoot = require_install_package_dir.withExtractedArchiveRoot;
