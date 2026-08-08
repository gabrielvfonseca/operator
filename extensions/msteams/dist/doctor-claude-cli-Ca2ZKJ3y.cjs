const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_executable_path = require("./executable-path-BHxqQqcc.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_external_auth = require("./external-auth-CPpcflX7.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_agent_runtime_metadata = require("./agent-runtime-metadata-DAHq7Kgy.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_claude_cli_project_dir = require("./claude-cli-project-dir-C5uGs6SN.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor-claude-cli.ts
/** Doctor health note for Claude CLI binary, auth, and workspace/project directories. */
const CLAUDE_CLI_PROVIDER = "claude-cli";
function usesClaudeCliModelSelection(cfg) {
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)((0, _gabrielvfonseca_normalization_core_string_coerce.resolvePrimaryStringValue)(cfg.agents?.defaults?.model))?.startsWith(`${CLAUDE_CLI_PROVIDER}/`)) return true;
	return Object.keys(cfg.agents?.defaults?.models ?? {}).some((key) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(key)?.startsWith(`${CLAUDE_CLI_PROVIDER}/`));
}
function resolveClaudeCliCommand(cfg) {
	const configured = cfg.agents?.defaults?.cliBackends ?? {};
	for (const [key, entry] of Object.entries(configured)) {
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(key) !== CLAUDE_CLI_PROVIDER) continue;
		const command = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.command);
		if (command) return command;
	}
	return "claude";
}
function probeDirectoryHealth(dirPath) {
	try {
		if (!node_fs.default.statSync(dirPath).isDirectory()) return "not_directory";
	} catch {
		return "missing";
	}
	try {
		node_fs.default.accessSync(dirPath, node_fs.default.constants.R_OK);
	} catch {
		return "unreadable";
	}
	try {
		node_fs.default.accessSync(dirPath, node_fs.default.constants.W_OK);
	} catch {
		return "readonly";
	}
	return "present";
}
function formatWorkspaceProblemLine(workspaceDir, health, agentId) {
	const label = agentId ? `Agent ${agentId} workspace` : "Workspace";
	const display = require_utils.shortenHomePath(workspaceDir);
	if (health === "present" || health === "missing") return null;
	if (health === "not_directory") return `- ${label}: ${display} exists but is not a directory.`;
	if (health === "unreadable") return `- ${label}: ${display} is not readable by this user.`;
	return `- ${label}: ${display} is not writable by this user.`;
}
function formatProjectDirProblemLine(projectDir, health, agentId) {
	const label = agentId ? `Agent ${agentId} Claude project dir` : "Claude project dir";
	const display = require_utils.shortenHomePath(projectDir);
	if (health === "present" || health === "missing") return null;
	if (health === "not_directory") return `- ${label}: ${display} exists but is not a directory.`;
	if (health === "unreadable") return `- ${label}: ${display} is not readable by this user.`;
	return `- ${label}: ${display} is not writable by this user.`;
}
function resolveClaudeCliAgentIds(cfg) {
	const runtimeAgentIds = require_agent_scope_config.listAgentIds(cfg).filter((agentId) => require_agent_runtime_metadata.resolveModelAgentRuntimeMetadata({
		cfg,
		agentId
	}).id === CLAUDE_CLI_PROVIDER);
	if (runtimeAgentIds.length > 0) return runtimeAgentIds;
	if (usesClaudeCliModelSelection(cfg)) return [require_agent_scope_config.resolveDefaultAgentId(cfg)];
	return [];
}
function resolveClaudeCliWorkspaceTargets(params) {
	const agentIds = resolveClaudeCliAgentIds(params.cfg);
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(params.cfg);
	const seen = /* @__PURE__ */ new Set();
	return agentIds.filter((agentId) => {
		if (seen.has(agentId)) return false;
		seen.add(agentId);
		return true;
	}).map((agentId) => {
		const workspaceDir = params.workspaceDir && agentIds.length === 1 && agentId === defaultAgentId ? params.workspaceDir : require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId, params.env);
		const projectDir = require_claude_cli_project_dir.resolveClaudeCliProjectDirForWorkspace({
			workspaceDir,
			homeDir: params.homeDir
		});
		return {
			agentId,
			workspaceDir,
			projectDir,
			workspaceHealth: probeDirectoryHealth(workspaceDir),
			projectDirHealth: probeDirectoryHealth(projectDir)
		};
	});
}
/**
* Emits Claude CLI health diagnostics for every agent currently routed through the CLI backend.
*
* The optional deps let tests inject auth stores, PATH resolution, and workspace roots without
* touching the user's real Claude credentials or filesystem.
*/
function noteClaudeCliHealth(cfg, deps) {
	const env = deps?.env ?? process.env;
	const workspaceTargets = resolveClaudeCliWorkspaceTargets({
		cfg,
		env,
		homeDir: deps?.homeDir,
		workspaceDir: deps?.workspaceDir
	});
	if (workspaceTargets.length === 0) return;
	const store = deps?.store ?? require_store.ensureAuthProfileStore(void 0, { allowKeychainPrompt: false });
	const credential = (deps?.readClaudeCliCredentials ?? (() => require_external_auth.readClaudeCliCredentialsCached({ allowKeychainPrompt: false })))();
	const command = resolveClaudeCliCommand(cfg);
	const commandPath = (deps?.resolveCommandPath ?? ((rawCommand, nextEnv) => require_executable_path.resolveExecutablePath(rawCommand, { env: nextEnv })))(command, env);
	const authStorePath = require_path_resolve.resolveAuthStorePathForDisplay();
	const storedProfile = store.profiles[require_persisted.CLAUDE_CLI_PROFILE_ID];
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const showAgentLabels = workspaceTargets.length > 1 || workspaceTargets.some((target) => target.agentId !== defaultAgentId);
	const lines = [];
	const fixHints = [];
	if (!commandPath) {
		lines.push(`- Binary: command "${command}" was not found on PATH.`);
		fixHints.push("- Fix: install Claude CLI or set agents.defaults.cliBackends.claude-cli.command to the real binary path.");
	}
	if (!credential) {
		lines.push("- Headless Claude auth: unavailable without interactive prompting.");
		fixHints.push(`- Fix: run ${require_command_format.formatCliCommand("claude auth login")}, then ${require_command_format.formatCliCommand("openclaw models auth login --provider anthropic --method cli --set-default")}.`);
	}
	if (!storedProfile) {
		lines.push(`- Operator auth profile: missing (${require_persisted.CLAUDE_CLI_PROFILE_ID}) in ${authStorePath}.`);
		fixHints.push(`- Fix: run ${require_command_format.formatCliCommand("openclaw models auth login --provider anthropic --method cli --set-default")}.`);
	} else if (storedProfile.provider !== CLAUDE_CLI_PROVIDER) {
		lines.push(`- Operator auth profile: ${require_persisted.CLAUDE_CLI_PROFILE_ID} is wired to provider "${storedProfile.provider}" instead of "${CLAUDE_CLI_PROVIDER}".`);
		fixHints.push(`- Fix: rerun ${require_command_format.formatCliCommand("openclaw models auth login --provider anthropic --method cli --set-default")} to rewrite the profile cleanly.`);
	}
	for (const target of workspaceTargets) {
		const agentLabel = showAgentLabels ? target.agentId : void 0;
		const workspaceProblem = formatWorkspaceProblemLine(target.workspaceDir, target.workspaceHealth, agentLabel);
		if (workspaceProblem) lines.push(workspaceProblem);
		if (target.workspaceHealth === "readonly" || target.workspaceHealth === "unreadable" || target.workspaceHealth === "not_directory") fixHints.push(`- Fix: make ${agentLabel ? `agent ${agentLabel}'s workspace` : "the workspace"} a readable, writable directory for the gateway user.`);
		const projectDirProblem = formatProjectDirProblemLine(target.projectDir, target.projectDirHealth, agentLabel);
		if (projectDirProblem) lines.push(projectDirProblem);
		if (target.projectDirHealth === "unreadable" || target.projectDirHealth === "not_directory") fixHints.push(`- Fix: make ${agentLabel ? `agent ${agentLabel}'s Claude project dir` : "the Claude project dir"} readable, or remove the broken path and let Claude recreate it.`);
	}
	if (lines.length > 0 && workspaceTargets.length > 1) lines.push(`- Agents using Claude CLI: ${workspaceTargets.map((target) => target.agentId).toSorted((a, b) => a.localeCompare(b)).join(", ")}.`);
	if (lines.length === 0 && fixHints.length === 0) return;
	if (fixHints.length > 0) lines.push(...fixHints);
	(deps?.noteFn ?? require_note.note)(lines.join("\n"), "Claude CLI");
}
//#endregion
exports.noteClaudeCliHealth = noteClaudeCliHealth;
