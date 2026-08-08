const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/infra/package-update-utils.ts
/** Return expected integrity only for concrete semver package specs. */
function expectedIntegrityForUpdate(spec, integrity) {
	if (!integrity || !spec) return;
	const value = spec.trim();
	if (!value) return;
	const at = value.lastIndexOf("@");
	if (at <= 0 || at >= value.length - 1) return;
	const version = value.slice(at + 1).trim();
	if (!/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) return;
	return integrity;
}
function readInstalledPackageManifest(dir) {
	const result = (0, _openclaw_fs_safe_json.readRootJsonObjectSync)({
		rootDir: dir,
		relativePath: "package.json",
		boundaryLabel: "installed package directory"
	});
	return result.ok ? result.value : void 0;
}
/** Read the installed package version from a package root. */
async function readInstalledPackageVersion(dir) {
	const manifest = readInstalledPackageManifest(dir);
	return typeof manifest?.version === "string" ? manifest.version : void 0;
}
/** Read string-valued peer dependencies from an installed package. */
function readInstalledPackagePeerDependencies(dir) {
	const manifest = readInstalledPackageManifest(dir);
	const peerDependencies = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(manifest?.peerDependencies) ? manifest.peerDependencies : {};
	return Object.fromEntries(Object.entries(peerDependencies).filter((entry) => {
		const [, value] = entry;
		return typeof value === "string";
	}));
}
/** Return true when an installed package needs an openclaw peer link repair. */
function installedPackageNeedsOperatorPeerLinkRepair(dir) {
	const peerDependencies = readInstalledPackagePeerDependencies(dir);
	if (!Object.hasOwn(peerDependencies, "@gabrielvfonseca/operator")) return false;
	try {
		node_fs.default.statSync(node_path.default.join(dir, "node_modules", "@gabrielvfonseca/operator"));
		return false;
	} catch (error) {
		const code = error?.code;
		return code === "ENOENT" || code === "ENOTDIR";
	}
}
//#endregion
Object.defineProperty(exports, "expectedIntegrityForUpdate", {
	enumerable: true,
	get: function() {
		return expectedIntegrityForUpdate;
	}
});
Object.defineProperty(exports, "installedPackageNeedsOperatorPeerLinkRepair", {
	enumerable: true,
	get: function() {
		return installedPackageNeedsOperatorPeerLinkRepair;
	}
});
Object.defineProperty(exports, "readInstalledPackageManifest", {
	enumerable: true,
	get: function() {
		return readInstalledPackageManifest;
	}
});
Object.defineProperty(exports, "readInstalledPackagePeerDependencies", {
	enumerable: true,
	get: function() {
		return readInstalledPackagePeerDependencies;
	}
});
Object.defineProperty(exports, "readInstalledPackageVersion", {
	enumerable: true,
	get: function() {
		return readInstalledPackageVersion;
	}
});
