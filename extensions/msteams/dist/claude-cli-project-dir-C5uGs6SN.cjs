const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/command/claude-cli-project-dir.ts
/**
* Resolves Claude CLI project storage directories for Operator workspaces.
*/
const CLAUDE_PROJECTS_DIRNAME = node_path.default.join(".claude", "projects");
const MAX_SANITIZED_PROJECT_LENGTH = 200;
function simpleHash36(input) {
	let hash = 0;
	for (let index = 0; index < input.length; index += 1) hash = hash * 31 + input.charCodeAt(index) >>> 0;
	return hash.toString(36);
}
function sanitizeClaudeCliProjectKey(workspaceDir) {
	const sanitized = workspaceDir.replace(/[^a-zA-Z0-9]/g, "-");
	if (sanitized.length <= MAX_SANITIZED_PROJECT_LENGTH) return sanitized;
	return `${sanitized.slice(0, MAX_SANITIZED_PROJECT_LENGTH)}-${simpleHash36(workspaceDir)}`;
}
function canonicalizeWorkspaceDir(workspaceDir) {
	const resolved = node_path.default.resolve(workspaceDir).normalize("NFC");
	try {
		return node_fs.default.realpathSync.native(resolved).normalize("NFC");
	} catch {
		return resolved;
	}
}
/** Resolves Claude CLI's per-workspace project directory. */
function resolveClaudeCliProjectDirForWorkspace(params) {
	const homeDir = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.homeDir) || process.env.HOME || node_os.default.homedir();
	const canonicalWorkspaceDir = canonicalizeWorkspaceDir(params.workspaceDir);
	return node_path.default.join(homeDir, CLAUDE_PROJECTS_DIRNAME, sanitizeClaudeCliProjectKey(canonicalWorkspaceDir));
}
//#endregion
Object.defineProperty(exports, "resolveClaudeCliProjectDirForWorkspace", {
	enumerable: true,
	get: function() {
		return resolveClaudeCliProjectDirForWorkspace;
	}
});
