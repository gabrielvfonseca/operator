const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/system-agent/audit.ts
var audit_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	appendSystemAgentAuditEntry: () => appendSystemAgentAuditEntry,
	resolveSystemAgentAuditPath: () => resolveSystemAgentAuditPath
});
/** Resolve the JSONL audit path for Operator persistent operations. */
function resolveSystemAgentAuditPath(env = process.env, stateDir = require_paths.resolveStateDir(env)) {
	return node_path.default.join(stateDir, "audit", "system-agent.jsonl");
}
/** Append one Operator audit entry and return the file path written. */
async function appendSystemAgentAuditEntry(entry, opts = {}) {
	const auditPath = opts.auditPath ?? resolveSystemAgentAuditPath(opts.env);
	await node_fs_promises.default.mkdir(node_path.default.dirname(auditPath), { recursive: true });
	await (0, _openclaw_fs_safe_advanced.appendRegularFile)({
		filePath: auditPath,
		content: `${JSON.stringify({
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			...entry
		})}\n`,
		rejectSymlinkParents: true
	});
	return auditPath;
}
//#endregion
Object.defineProperty(exports, "appendSystemAgentAuditEntry", {
	enumerable: true,
	get: function() {
		return appendSystemAgentAuditEntry;
	}
});
Object.defineProperty(exports, "audit_exports", {
	enumerable: true,
	get: function() {
		return audit_exports;
	}
});
Object.defineProperty(exports, "resolveSystemAgentAuditPath", {
	enumerable: true,
	get: function() {
		return resolveSystemAgentAuditPath;
	}
});
