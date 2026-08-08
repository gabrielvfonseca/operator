const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/infra/json-file.ts
function resolveJsonSymlinkTarget(pathname) {
	let stat;
	try {
		stat = node_fs.default.lstatSync(pathname);
	} catch (error) {
		if (error.code === "ENOENT") return;
		throw error;
	}
	if (!stat.isSymbolicLink()) return;
	return node_path.default.resolve(node_path.default.dirname(pathname), node_fs.default.readlinkSync(pathname));
}
function resolveJsonSaveTarget(pathname) {
	const target = resolveJsonSymlinkTarget(pathname);
	if (!target) return pathname;
	node_fs.default.statSync(node_path.default.dirname(target));
	return target;
}
function saveJsonFile(pathname, data) {
	(0, _openclaw_fs_safe_json.writeJsonSync)(resolveJsonSaveTarget(pathname), data);
}
function loadJsonFile(pathname) {
	const direct = (0, _openclaw_fs_safe_json.tryReadJsonSync)(pathname);
	if (direct !== null) return direct;
	const target = resolveJsonSymlinkTarget(pathname);
	return target ? (0, _openclaw_fs_safe_json.tryReadJsonSync)(target) ?? void 0 : void 0;
}
//#endregion
Object.defineProperty(exports, "loadJsonFile", {
	enumerable: true,
	get: function() {
		return loadJsonFile;
	}
});
Object.defineProperty(exports, "saveJsonFile", {
	enumerable: true,
	get: function() {
		return saveJsonFile;
	}
});
