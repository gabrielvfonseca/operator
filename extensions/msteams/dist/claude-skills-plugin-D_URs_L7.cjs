const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_helpers = require("./helpers-D33_rP9K.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/cli-runner/claude-skills-plugin.ts
/**
* Materializes selected Operator skills as a temporary Claude CLI plugin.
*/
const CLAUDE_CLI_BACKEND_ID = "claude-cli";
const OPERATOR_CLAUDE_PLUGIN_NAME = "operator-skills";
function sanitizeSkillDirName(name, used) {
	const base = name.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "skill";
	const safeBase = base.startsWith(".") ? `skill-${base.replace(/^\.+/, "") || "skill"}` : base;
	let candidate = safeBase;
	for (let index = 2; used.has(candidate); index += 1) candidate = `${safeBase}-${index}`;
	used.add(candidate);
	return candidate;
}
/** Returns whether a resolved skill file is readable before linking it into the Claude plugin. */
function isClaudeCliSkillFileAccessible(skillFilePath) {
	try {
		(0, node_fs.accessSync)(skillFilePath);
		return true;
	} catch {
		return false;
	}
}
async function collectClaudePluginSkills(snapshot) {
	const skills = snapshot?.resolvedSkills ?? [];
	if (skills.length === 0) return [];
	const usedTargetNames = /* @__PURE__ */ new Set();
	const materialized = [];
	for (const skill of skills) {
		const name = skill.name?.trim();
		const skillFilePath = skill.filePath?.trim();
		if (!name || !skillFilePath) continue;
		if (!isClaudeCliSkillFileAccessible(skillFilePath)) {
			require_helpers.cliBackendLog.warn(`claude skill plugin skipped missing skill file: ${skillFilePath}`);
			continue;
		}
		materialized.push({
			name,
			sourceDir: node_path.default.dirname(skillFilePath),
			targetDirName: sanitizeSkillDirName(name, usedTargetNames)
		});
	}
	return materialized;
}
async function linkOrCopySkillDir(params) {
	try {
		await node_fs_promises.default.symlink(params.sourceDir, params.targetDir, process.platform === "win32" ? "junction" : "dir");
	} catch {
		await node_fs_promises.default.cp(params.sourceDir, params.targetDir, {
			recursive: true,
			force: true,
			verbatimSymlinks: true
		});
	}
}
/** Prepares Claude CLI `--plugin-dir` args for the current session skill snapshot. */
async function prepareClaudeCliSkillsPlugin(params) {
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.backendId) !== CLAUDE_CLI_BACKEND_ID) return {
		args: [],
		cleanup: async () => {}
	};
	const skills = await collectClaudePluginSkills(params.skillsSnapshot);
	if (skills.length === 0) return {
		args: [],
		cleanup: async () => {}
	};
	const tempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(require_tmp_operator_dir.resolvePreferredOperatorTmpDir(), "operator-claude-skills-"));
	const pluginDir = node_path.default.join(tempDir, OPERATOR_CLAUDE_PLUGIN_NAME);
	const manifestDir = node_path.default.join(pluginDir, ".claude-plugin");
	const skillsDir = node_path.default.join(pluginDir, "skills");
	await node_fs_promises.default.mkdir(manifestDir, {
		recursive: true,
		mode: 448
	});
	await node_fs_promises.default.mkdir(skillsDir, {
		recursive: true,
		mode: 448
	});
	const manifest = {
		name: OPERATOR_CLAUDE_PLUGIN_NAME,
		version: "0.0.0",
		description: "Session-scoped Operator skills selected for this agent run.",
		skills: "./skills"
	};
	await node_fs_promises.default.writeFile(node_path.default.join(manifestDir, "plugin.json"), `${JSON.stringify(manifest, null, 2)}\n`, {
		encoding: "utf-8",
		mode: 384
	});
	let linkedSkillCount = 0;
	for (const skill of skills) try {
		await linkOrCopySkillDir({
			sourceDir: skill.sourceDir,
			targetDir: node_path.default.join(skillsDir, skill.targetDirName)
		});
		linkedSkillCount += 1;
	} catch (error) {
		require_helpers.cliBackendLog.warn(`claude skill plugin skipped ${skill.name}: ${error instanceof Error ? error.message : String(error)}`);
	}
	if (linkedSkillCount === 0) {
		await node_fs_promises.default.rm(tempDir, {
			recursive: true,
			force: true
		});
		return {
			args: [],
			cleanup: async () => {}
		};
	}
	return {
		args: ["--plugin-dir", pluginDir],
		pluginDir,
		cleanup: async () => {
			await node_fs_promises.default.rm(tempDir, {
				recursive: true,
				force: true
			});
		}
	};
}
//#endregion
Object.defineProperty(exports, "prepareClaudeCliSkillsPlugin", {
	enumerable: true,
	get: function() {
		return prepareClaudeCliSkillsPlugin;
	}
});
