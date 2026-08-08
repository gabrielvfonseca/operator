require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./json-files-Bp0Z4DKb.cjs");
require("./path-safety-m1VY3jod.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_bundle_manifest = require("./bundle-manifest-DNijUZc1.cjs");
const require_min_host_version = require("./min-host-version-CbJbYF_h.cjs");
require("./archive-HshK6KD3.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
const require_install_package_dir = require("./install-package-dir-BsJPCuuA.cjs");
const require_install_security_scan = require("./install-security-scan-Dio5vohb.cjs");
const require_install_target = require("./install-target-CdfJ0Nsa.cjs");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _openclaw_fs_safe_archive = require("@openclaw/fs-safe/archive");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
//#region src/plugins/install.runtime.ts
/** Lazy runtime barrel for plugin installation helpers used by install flows. */
//#endregion
exports.checkMinHostVersion = require_min_host_version.checkMinHostVersion;
exports.detectBundleManifestFormat = require_bundle_manifest.detectBundleManifestFormat;
exports.ensureInstallTargetAvailable = require_install_target.ensureInstallTargetAvailable;
Object.defineProperty(exports, "fileExists", {
	enumerable: true,
	get: function() {
		return _openclaw_fs_safe_advanced.pathExists;
	}
});
exports.finalizeNpmSpecArchiveInstall = require_install_target.finalizeNpmSpecArchiveInstall;
exports.getPackageManifestMetadata = require_manifest.getPackageManifestMetadata;
exports.installFromNpmSpecArchiveWithInstaller = require_install_target.installFromNpmSpecArchiveWithInstaller;
exports.installPackageDir = require_install_package_dir.installPackageDir;
Object.defineProperty(exports, "isPathInside", {
	enumerable: true,
	get: function() {
		return _openclaw_fs_safe_path.isPathInside;
	}
});
exports.loadBundleManifest = require_bundle_manifest.loadBundleManifest;
exports.loadPluginManifest = require_manifest.loadPluginManifest;
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
exports.resolveCompatibilityHostVersion = require_version.resolveCompatibilityHostVersion;
exports.resolveExistingInstallPath = require_install_package_dir.resolveExistingInstallPath;
exports.resolveInstallModeOptions = require_install_target.resolveInstallModeOptions;
exports.resolvePackageExtensionEntries = require_manifest.resolvePackageExtensionEntries;
exports.resolveRuntimeServiceVersion = require_version.resolveRuntimeServiceVersion;
exports.resolveTimedInstallModeOptions = require_install_target.resolveTimedInstallModeOptions;
Object.defineProperty(exports, "root", {
	enumerable: true,
	get: function() {
		return _openclaw_fs_safe_root.root;
	}
});
exports.scanBundleInstallSource = require_install_security_scan.scanBundleInstallSource;
exports.scanFileInstallSource = require_install_security_scan.scanFileInstallSource;
exports.scanInstalledPackageDependencyTree = require_install_security_scan.scanInstalledPackageDependencyTree;
exports.scanPackageInstallSource = require_install_security_scan.scanPackageInstallSource;
exports.validateRegistryNpmSpec = require_npm_registry_spec.validateRegistryNpmSpec;
exports.withExtractedArchiveRoot = require_install_package_dir.withExtractedArchiveRoot;
