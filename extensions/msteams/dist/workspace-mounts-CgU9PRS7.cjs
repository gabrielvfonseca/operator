const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_constants = require("./constants-DD-eOR3_.cjs");
const require_network_mode = require("./network-mode-DcJhB8iN.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/agents/sandbox/workspace-mounts.ts
/**
* Sandbox workspace mount argument builder.
*
* Creates Docker bind specs for writable workspaces and read-only skill source mounts.
*/
const MATERIALIZED_SANDBOX_SKILLS_WORKSPACE_PARTS = [".operator", "sandbox-skills"];
function formatManagedWorkspaceBind(params) {
	return `${params.hostPath}:${params.containerPath}:${params.readOnly ? "ro,z" : "z"}`;
}
function containerJoin(root, ...parts) {
	const normalizedRoot = root.endsWith("/") && root !== "/" ? root.slice(0, -1) : root;
	const suffix = parts.map((part) => part.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
	return suffix ? `${normalizedRoot}/${suffix}` : normalizedRoot;
}
/** Hidden workspace used to materialize non-workspace skills for rw sandboxes. */
function resolveMaterializedSandboxSkillsWorkspaceDir(rootDir) {
	return node_path.default.join(rootDir, ...MATERIALIZED_SANDBOX_SKILLS_WORKSPACE_PARTS);
}
/** Returns true when a skill mount source exists inside the canonical mount root. */
function isExistingWorkspaceSkillMountSource(params) {
	try {
		if (!node_fs.default.lstatSync(params.hostPath).isDirectory()) return false;
	} catch {
		return false;
	}
	return (0, _openclaw_fs_safe_path.isPathInside)(require_network_mode.resolveSandboxHostPathViaExistingAncestor(node_path.default.resolve(params.rootDir)), require_network_mode.resolveSandboxHostPathViaExistingAncestor(node_path.default.resolve(params.hostPath)));
}
/** Finds agent-workspace skill directories that should be mounted read-only in rw workspaces. */
function resolveReadOnlyWorkspaceSkillMounts(params) {
	if (params.workspaceAccess !== "rw") return [];
	const materializedSkillsWorkspaceDir = params.skillsWorkspaceDir ?? resolveMaterializedSandboxSkillsWorkspaceDir(params.agentWorkspaceDir);
	return [
		{
			hostPath: node_path.default.join(params.agentWorkspaceDir, "skills"),
			containerPath: containerJoin(params.workdir, "skills"),
			rootDir: params.agentWorkspaceDir
		},
		{
			hostPath: node_path.default.join(params.agentWorkspaceDir, ".agents", "skills"),
			containerPath: containerJoin(params.workdir, ".agents", "skills"),
			rootDir: params.agentWorkspaceDir
		},
		{
			hostPath: node_path.default.join(materializedSkillsWorkspaceDir, "skills"),
			containerPath: containerJoin(params.workdir, ...MATERIALIZED_SANDBOX_SKILLS_WORKSPACE_PARTS, "skills"),
			rootDir: materializedSkillsWorkspaceDir
		}
	].filter((mount) => isExistingWorkspaceSkillMountSource({
		rootDir: mount.rootDir,
		hostPath: mount.hostPath
	})).map(({ hostPath, containerPath }) => ({
		hostPath,
		containerPath
	}));
}
/** Returns stable mount state for sandbox config hashes. */
function formatReadOnlyWorkspaceSkillMountHashState(mounts) {
	return mounts.map((mount) => `${mount.hostPath}:${mount.containerPath}:ro`);
}
/** Appends Docker `-v` args for read-only skill mounts. */
function appendReadOnlyWorkspaceSkillMountArgs(params) {
	for (const mount of params.readOnlyWorkspaceSkillMounts) params.args.push("-v", formatManagedWorkspaceBind({
		hostPath: mount.hostPath,
		containerPath: mount.containerPath,
		readOnly: true
	}));
}
/** Appends Docker workspace mount args for the project, agent workspace, and skill overlays. */
function appendWorkspaceMountArgs(params) {
	const { args, workspaceDir, agentWorkspaceDir, workdir, workspaceAccess } = params;
	args.push("-v", formatManagedWorkspaceBind({
		hostPath: workspaceDir,
		containerPath: workdir,
		readOnly: workspaceAccess !== "rw"
	}));
	if (workspaceAccess !== "none" && workspaceDir !== agentWorkspaceDir) args.push("-v", formatManagedWorkspaceBind({
		hostPath: agentWorkspaceDir,
		containerPath: require_constants.SANDBOX_AGENT_WORKSPACE_MOUNT,
		readOnly: workspaceAccess === "ro"
	}));
	if (params.includeReadOnlyWorkspaceSkillMounts !== false) appendReadOnlyWorkspaceSkillMountArgs({
		args,
		readOnlyWorkspaceSkillMounts: params.readOnlyWorkspaceSkillMounts ?? resolveReadOnlyWorkspaceSkillMounts({
			workspaceDir,
			agentWorkspaceDir,
			skillsWorkspaceDir: params.skillsWorkspaceDir,
			workdir,
			workspaceAccess
		})
	});
}
//#endregion
Object.defineProperty(exports, "appendReadOnlyWorkspaceSkillMountArgs", {
	enumerable: true,
	get: function() {
		return appendReadOnlyWorkspaceSkillMountArgs;
	}
});
Object.defineProperty(exports, "appendWorkspaceMountArgs", {
	enumerable: true,
	get: function() {
		return appendWorkspaceMountArgs;
	}
});
Object.defineProperty(exports, "formatReadOnlyWorkspaceSkillMountHashState", {
	enumerable: true,
	get: function() {
		return formatReadOnlyWorkspaceSkillMountHashState;
	}
});
Object.defineProperty(exports, "isExistingWorkspaceSkillMountSource", {
	enumerable: true,
	get: function() {
		return isExistingWorkspaceSkillMountSource;
	}
});
Object.defineProperty(exports, "resolveMaterializedSandboxSkillsWorkspaceDir", {
	enumerable: true,
	get: function() {
		return resolveMaterializedSandboxSkillsWorkspaceDir;
	}
});
Object.defineProperty(exports, "resolveReadOnlyWorkspaceSkillMounts", {
	enumerable: true,
	get: function() {
		return resolveReadOnlyWorkspaceSkillMounts;
	}
});
