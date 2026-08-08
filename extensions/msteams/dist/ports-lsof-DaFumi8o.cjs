const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/infra/ports-lsof.ts
const LSOF_CANDIDATES = process.platform === "darwin" ? ["/usr/sbin/lsof", "/usr/bin/lsof"] : ["/usr/bin/lsof", "/usr/sbin/lsof"];
async function canExecute(path) {
	try {
		await node_fs_promises.default.access(path, node_fs.default.constants.X_OK);
		return true;
	} catch {
		return false;
	}
}
async function resolveLsofCommand() {
	for (const candidate of LSOF_CANDIDATES) if (await canExecute(candidate)) return candidate;
	return "lsof";
}
function resolveLsofCommandSync() {
	for (const candidate of LSOF_CANDIDATES) try {
		node_fs.default.accessSync(candidate, node_fs.default.constants.X_OK);
		return candidate;
	} catch {}
	return "lsof";
}
//#endregion
Object.defineProperty(exports, "resolveLsofCommand", {
	enumerable: true,
	get: function() {
		return resolveLsofCommand;
	}
});
Object.defineProperty(exports, "resolveLsofCommandSync", {
	enumerable: true,
	get: function() {
		return resolveLsofCommandSync;
	}
});
