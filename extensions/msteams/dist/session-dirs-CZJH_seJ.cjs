const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/agents/session-dirs.ts
/**
* Agent session directory discovery helpers.
* Lists per-agent `sessions` directories under state roots in sorted order for
* callers that scan persisted session stores.
*/
var session_dirs_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveAgentSessionDirs: () => resolveAgentSessionDirs,
	resolveAgentSessionDirsFromAgentsDirSync: () => resolveAgentSessionDirsFromAgentsDirSync
});
function mapAgentSessionDirs(agentsDir, entries) {
	return entries.filter((entry) => entry.isDirectory()).map((entry) => node_path.default.join(agentsDir, entry.name, "sessions")).toSorted((a, b) => a.localeCompare(b));
}
/** Synchronous variant of per-agent session directory discovery. */
function resolveAgentSessionDirsFromAgentsDirSync(agentsDir) {
	let entries;
	try {
		entries = node_fs.default.readdirSync(agentsDir, { withFileTypes: true });
	} catch (err) {
		if (err.code === "ENOENT") return [];
		throw err;
	}
	return mapAgentSessionDirs(agentsDir, entries);
}
/** Lists per-agent session directories under a state directory. */
async function resolveAgentSessionDirs(stateDir) {
	const agentsDir = node_path.default.join(stateDir, "agents");
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(agentsDir, { withFileTypes: true });
	} catch (err) {
		if (err.code === "ENOENT") return [];
		throw err;
	}
	return mapAgentSessionDirs(agentsDir, entries);
}
//#endregion
Object.defineProperty(exports, "resolveAgentSessionDirs", {
	enumerable: true,
	get: function() {
		return resolveAgentSessionDirs;
	}
});
Object.defineProperty(exports, "resolveAgentSessionDirsFromAgentsDirSync", {
	enumerable: true,
	get: function() {
		return resolveAgentSessionDirsFromAgentsDirSync;
	}
});
Object.defineProperty(exports, "session_dirs_exports", {
	enumerable: true,
	get: function() {
		return session_dirs_exports;
	}
});
