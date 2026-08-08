const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/workspace-dir.ts
/**
* Workspace directory normalization helpers. They expand user paths, reject
* filesystem roots, and provide cwd fallback for runtime callers.
*/
/** Normalizes a workspace directory and rejects filesystem roots. */
function normalizeWorkspaceDir(workspaceDir) {
	const trimmed = workspaceDir?.trim();
	if (!trimmed) return null;
	const expanded = trimmed.startsWith("~") ? require_home_dir.resolveUserPath(trimmed) : trimmed;
	const resolved = node_path.default.resolve(expanded);
	if (resolved === node_path.default.parse(resolved).root) return null;
	return resolved;
}
/** Resolves the effective workspace root, falling back to cwd. */
function resolveWorkspaceRoot(workspaceDir) {
	return normalizeWorkspaceDir(workspaceDir) ?? process.cwd();
}
//#endregion
Object.defineProperty(exports, "normalizeWorkspaceDir", {
	enumerable: true,
	get: function() {
		return normalizeWorkspaceDir;
	}
});
Object.defineProperty(exports, "resolveWorkspaceRoot", {
	enumerable: true,
	get: function() {
		return resolveWorkspaceRoot;
	}
});
