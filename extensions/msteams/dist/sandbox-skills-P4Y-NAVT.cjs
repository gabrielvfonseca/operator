const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_workspace = require("./workspace-BaJ9ukou.cjs");
const require_runtime_config = require("./runtime-config-s4O0gA_M.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/skills/runtime/embedded-run-entries.ts
/** Resolves skill entries embedded into a run payload into runtime-visible entries. */
function resolveEmbeddedRunSkillEntries(params) {
	const shouldLoadSkillEntries = !params.skillsSnapshot?.resolvedSkills;
	const config = require_runtime_config.resolveSkillRuntimeConfig(params.config);
	return {
		shouldLoadSkillEntries,
		skillEntries: shouldLoadSkillEntries ? require_workspace.loadWorkspaceSkillEntries(params.workspaceDir, {
			config,
			agentId: params.agentId,
			...params.eligibility ? { eligibility: params.eligibility } : {},
			...params.workspaceOnly === true ? { workspaceOnly: true } : {}
		}) : []
	};
}
//#endregion
//#region src/agents/embedded-agent-runner/sandbox-skills.ts
/**
* Sandbox skill runtime input selection.
*
* Sandboxed runs must build prompt-facing skill entries from readable in-sandbox
* copies instead of reusing host-path snapshots.
*/
const MATERIALIZED_SKILLS_WORKSPACE_CONTAINER_PARTS = [".operator", "sandbox-skills"];
function containerJoin(root, ...parts) {
	const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
	const suffix = parts.map((part) => part.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
	return suffix ? `${normalizedRoot}/${suffix}` : normalizedRoot;
}
function pathEscapesRoot(relativePath) {
	return relativePath === ".." || relativePath.startsWith(`..${node_path.default.sep}`) || node_path.default.isAbsolute(relativePath);
}
function mapPathFromWorkspaceToContainer(params) {
	if (!params.filePath || !node_path.default.isAbsolute(params.filePath)) return params.filePath;
	const relativePath = node_path.default.relative(node_path.default.resolve(params.sourceWorkspaceDir), node_path.default.resolve(params.filePath));
	if (pathEscapesRoot(relativePath)) return params.filePath;
	if (!relativePath) return params.targetWorkspaceDir.replace(/\\/g, "/");
	return containerJoin(params.targetWorkspaceDir, ...relativePath.split(node_path.default.sep).filter(Boolean));
}
function mapSandboxSkillEntriesForPrompt(params) {
	if (!params.entries || params.skillsWorkspaceDir === params.skillsPromptWorkspaceDir) return params.entries;
	return params.entries.map((entry) => {
		const filePath = mapPathFromWorkspaceToContainer({
			filePath: entry.skill.filePath,
			sourceWorkspaceDir: params.skillsWorkspaceDir,
			targetWorkspaceDir: params.skillsPromptWorkspaceDir
		}) ?? entry.skill.filePath;
		const baseDir = mapPathFromWorkspaceToContainer({
			filePath: entry.skill.baseDir,
			sourceWorkspaceDir: params.skillsWorkspaceDir,
			targetWorkspaceDir: params.skillsPromptWorkspaceDir
		}) ?? entry.skill.baseDir;
		const sourceInfoPath = mapPathFromWorkspaceToContainer({
			filePath: entry.skill.sourceInfo.path,
			sourceWorkspaceDir: params.skillsWorkspaceDir,
			targetWorkspaceDir: params.skillsPromptWorkspaceDir
		}) ?? entry.skill.sourceInfo.path;
		const sourceInfoBaseDir = mapPathFromWorkspaceToContainer({
			filePath: entry.skill.sourceInfo.baseDir,
			sourceWorkspaceDir: params.skillsWorkspaceDir,
			targetWorkspaceDir: params.skillsPromptWorkspaceDir
		});
		return {
			...entry,
			skill: {
				...entry.skill,
				filePath,
				baseDir,
				sourceInfo: {
					...entry.skill.sourceInfo,
					path: sourceInfoPath,
					...sourceInfoBaseDir === void 0 ? {} : { baseDir: sourceInfoBaseDir }
				}
			}
		};
	});
}
function mapSandboxSkillUsagePaths(params) {
	if (!params.paths || params.skillsWorkspaceDir === params.skillsPromptWorkspaceDir) return params.paths;
	return params.paths.map((entry) => ({
		...entry,
		readPath: mapPathFromWorkspaceToContainer({
			filePath: entry.readPath,
			sourceWorkspaceDir: params.skillsWorkspaceDir,
			targetWorkspaceDir: params.skillsPromptWorkspaceDir
		}) ?? entry.readPath
	}));
}
function resolveSandboxSkillRuntimeInputs(params) {
	if (params.sandbox?.enabled === true) {
		const skillsWorkspaceDir = params.sandbox.skillsWorkspaceDir ?? params.effectiveWorkspace;
		const skillsPromptWorkspaceDir = params.sandbox.workspaceAccess === "rw" && params.sandbox.skillsWorkspaceDir && params.sandbox.containerWorkdir ? containerJoin(params.sandbox.containerWorkdir, ...MATERIALIZED_SKILLS_WORKSPACE_CONTAINER_PARTS) : params.sandbox.containerWorkdir ?? skillsWorkspaceDir;
		return {
			...params.sandbox.skillsEligibility ? { skillsEligibility: params.sandbox.skillsEligibility } : {},
			skillsPromptWorkspaceDir,
			skillsSnapshot: void 0,
			skillsWorkspaceDir,
			workspaceOnly: true
		};
	}
	return {
		skillsPromptWorkspaceDir: params.effectiveWorkspace,
		skillsSnapshot: params.skillsSnapshot,
		skillsWorkspaceDir: params.effectiveWorkspace,
		workspaceOnly: false
	};
}
//#endregion
Object.defineProperty(exports, "mapSandboxSkillEntriesForPrompt", {
	enumerable: true,
	get: function() {
		return mapSandboxSkillEntriesForPrompt;
	}
});
Object.defineProperty(exports, "mapSandboxSkillUsagePaths", {
	enumerable: true,
	get: function() {
		return mapSandboxSkillUsagePaths;
	}
});
Object.defineProperty(exports, "resolveEmbeddedRunSkillEntries", {
	enumerable: true,
	get: function() {
		return resolveEmbeddedRunSkillEntries;
	}
});
Object.defineProperty(exports, "resolveSandboxSkillRuntimeInputs", {
	enumerable: true,
	get: function() {
		return resolveSandboxSkillRuntimeInputs;
	}
});
