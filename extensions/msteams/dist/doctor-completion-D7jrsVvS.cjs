const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_cli_name = require("./cli-name-riMh4a6G.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_operator_root = require("./operator-root-D_zS4PlX.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_child_process = require("node:child_process");
//#region src/cli/completion-runtime.ts
const COMPLETION_SHELLS = [
	"zsh",
	"bash",
	"powershell",
	"fish"
];
const COMPLETION_SKIP_PLUGIN_COMMANDS_ENV = "OPERATOR_COMPLETION_SKIP_PLUGIN_COMMANDS";
/** Narrows an arbitrary shell label to a completion shell supported by installer logic. */
function isCompletionShell(value) {
	return COMPLETION_SHELLS.includes(value);
}
function resolveShellBasename(shellPath, platform = process.platform) {
	const platformBasename = platform === "win32" ? node_path.default.win32.basename(shellPath) : node_path.default.basename(shellPath);
	const winBasename = node_path.default.win32.basename(shellPath);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((winBasename.length < platformBasename.length ? winBasename : platformBasename).replace(/\.(?:exe|cmd|bat)$/i, ""));
}
/** Resolves the active shell from environment paths, defaulting to zsh for unknown shells. */
function resolveShellFromEnv(env = process.env) {
	const shellPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.SHELL) ?? "";
	const shellName = shellPath ? resolveShellBasename(shellPath) : "";
	if (shellName === "zsh") return "zsh";
	if (shellName === "bash") return "bash";
	if (shellName === "fish") return "fish";
	if (shellName === "pwsh" || shellName === "powershell") return "powershell";
	return "zsh";
}
function sanitizeCompletionBasename(value) {
	const trimmed = value.trim();
	if (!trimmed) return "@gabrielvfonseca/operator";
	return trimmed.replace(/[^a-zA-Z0-9._-]/g, "-");
}
function resolveCompletionCacheDir(env = process.env) {
	const stateDir = require_paths.resolveStateDir(env, node_os.default.homedir);
	return node_path.default.join(stateDir, "completions");
}
/** Returns the per-shell cached completion script path for a sanitized CLI binary name. */
function resolveCompletionCachePath(shell, binName) {
	const basename = sanitizeCompletionBasename(binName);
	const extension = shell === "powershell" ? "ps1" : shell === "fish" ? "fish" : shell === "bash" ? "bash" : "zsh";
	return node_path.default.join(resolveCompletionCacheDir(), `${basename}.${extension}`);
}
/** Check if the completion cache file exists for the given shell. */
async function completionCacheExists(shell, binName = "@gabrielvfonseca/operator") {
	return require_utils.pathExists(resolveCompletionCachePath(shell, binName));
}
function escapePowerShellSingleQuotedString(value) {
	return value.replace(/'/g, "''");
}
function formatCompletionSourceLine(shell, cachePath) {
	if (shell === "powershell") return `. '${escapePowerShellSingleQuotedString(cachePath)}'`;
	if (shell === "fish") return `test -f "${cachePath}"; and source "${cachePath}"`;
	return `[ -f "${cachePath}" ] && source "${cachePath}"`;
}
/** Formats the command users can run to reload the shell profile after installation. */
function formatCompletionReloadCommand(shell, profilePath) {
	if (shell === "powershell") return `. '${escapePowerShellSingleQuotedString(profilePath)}'`;
	return `source ${profilePath}`;
}
function isCompletionProfileHeader(line) {
	return line.trim() === "# Operator Completion";
}
function isCompletionProfileLine(line, binName, cachePath) {
	if (line.includes(`${binName} completion`)) return true;
	if (cachePath && line.includes(cachePath)) return true;
	return false;
}
/** Check if a line uses the slow dynamic completion pattern (source <(...)) */
function isSlowDynamicCompletionLine(line, binName) {
	return line.includes(`<(${binName} completion`) || line.includes(`${binName} completion`) && line.includes("| source");
}
function updateCompletionProfile(content, binName, cachePath, sourceLine) {
	const lines = content.split("\n");
	const filtered = [];
	let hadExisting = false;
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i] ?? "";
		if (isCompletionProfileHeader(line)) {
			hadExisting = true;
			i += 1;
			continue;
		}
		if (isCompletionProfileLine(line, binName, cachePath)) {
			hadExisting = true;
			continue;
		}
		filtered.push(line);
	}
	const trimmed = filtered.join("\n").trimEnd();
	const block = `# Operator Completion\n${sourceLine}`;
	const next = trimmed ? `${trimmed}\n\n${block}\n` : `${block}\n`;
	return {
		next,
		changed: next !== content,
		hadExisting
	};
}
/** Resolves the shell startup profile path that should contain the Operator completion block. */
function resolveCompletionProfilePath(shell, options = {}) {
	const env = options.env ?? process.env;
	const homeDir = options.homeDir ?? node_os.default.homedir;
	const platform = options.platform ?? process.platform;
	const home = env.HOME || homeDir();
	if (shell === "zsh") return node_path.default.join(home, ".zshrc");
	if (shell === "bash") return node_path.default.join(home, ".bashrc");
	if (shell === "fish") return node_path.default.join(home, ".config", "fish", "config.fish");
	if (platform === "win32") {
		const shellPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env.SHELL) ?? "";
		const profileDirectory = (shellPath ? resolveShellBasename(shellPath, platform) : "") === "powershell" ? "WindowsPowerShell" : "PowerShell";
		return node_path.default.win32.join(env.USERPROFILE || home, "Documents", profileDirectory, "Microsoft.PowerShell_profile.ps1");
	}
	return node_path.default.join(home, ".config", "powershell", "Microsoft.PowerShell_profile.ps1");
}
/** Returns whether a shell profile already contains an Operator completion block or source line. */
async function isCompletionInstalled(shell, binName = "@gabrielvfonseca/operator") {
	const profilePath = resolveCompletionProfilePath(shell);
	if (!await require_utils.pathExists(profilePath)) return false;
	const cachePathCandidate = resolveCompletionCachePath(shell, binName);
	const cachedPath = await require_utils.pathExists(cachePathCandidate) ? cachePathCandidate : null;
	return (await node_fs_promises.default.readFile(profilePath, "utf-8")).split("\n").some((line) => isCompletionProfileHeader(line) || isCompletionProfileLine(line, binName, cachedPath));
}
/**
* Check if the profile uses the slow dynamic completion pattern.
* Returns true if profile has `source <(openclaw completion ...)` instead of cached file.
*/
async function usesSlowDynamicCompletion(shell, binName = "@gabrielvfonseca/operator") {
	const profilePath = resolveCompletionProfilePath(shell);
	if (!await require_utils.pathExists(profilePath)) return false;
	const cachePath = resolveCompletionCachePath(shell, binName);
	const lines = (await node_fs_promises.default.readFile(profilePath, "utf-8")).split("\n");
	for (const line of lines) if (isSlowDynamicCompletionLine(line, binName) && !line.includes(cachePath)) return true;
	return false;
}
async function installCompletion(shell, yes, binName = "@gabrielvfonseca/operator") {
	if (!isCompletionShell(shell)) throw new Error(`Automated installation not supported for ${shell} yet.`);
	const cachePath = resolveCompletionCachePath(shell, binName);
	if (!await require_utils.pathExists(cachePath)) throw new Error(`Completion cache not found at ${cachePath}. Run \`${binName} completion --write-state\` first.`);
	let profilePath;
	let sourceLine;
	switch (shell) {
		case "zsh":
			profilePath = resolveCompletionProfilePath("zsh");
			sourceLine = formatCompletionSourceLine("zsh", cachePath);
			break;
		case "bash":
			profilePath = resolveCompletionProfilePath("bash");
			try {
				await node_fs_promises.default.access(profilePath);
			} catch {
				const home = process.env.HOME || node_os.default.homedir();
				profilePath = node_path.default.join(home, ".bash_profile");
			}
			sourceLine = formatCompletionSourceLine("bash", cachePath);
			break;
		case "fish":
			profilePath = resolveCompletionProfilePath("fish");
			sourceLine = formatCompletionSourceLine("fish", cachePath);
			break;
		case "powershell":
			profilePath = resolveCompletionProfilePath("powershell");
			sourceLine = formatCompletionSourceLine("powershell", cachePath);
			break;
	}
	try {
		try {
			await node_fs_promises.default.access(profilePath);
		} catch {
			if (!yes) console.warn(`Profile not found at ${profilePath}. Created a new one.`);
			await node_fs_promises.default.mkdir(node_path.default.dirname(profilePath), { recursive: true });
			await node_fs_promises.default.writeFile(profilePath, "", "utf-8");
		}
		const update = updateCompletionProfile(await node_fs_promises.default.readFile(profilePath, "utf-8"), binName, cachePath, sourceLine);
		if (!update.changed) {
			if (!yes) console.log(`Completion already installed in ${profilePath}`);
			return;
		}
		if (!yes) {
			const action = update.hadExisting ? "Updating" : "Installing";
			console.log(`${action} completion in ${profilePath}...`);
		}
		await node_fs_promises.default.writeFile(profilePath, update.next, "utf-8");
		if (!yes) console.log(`Completion installed. Restart your shell or run: ${formatCompletionReloadCommand(shell, profilePath)}`);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`Failed to install completion: ${message}`, { cause: err });
	}
}
//#endregion
//#region src/commands/doctor-completion.ts
/** Doctor checks and repair effects for cached shell completion setup. */
var doctor_completion_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	checkShellCompletionStatus: () => checkShellCompletionStatus,
	doctorShellCompletion: () => doctorShellCompletion,
	ensureCompletionCacheExists: () => ensureCompletionCacheExists,
	shellCompletionStatusToHealthFindings: () => shellCompletionStatusToHealthFindings,
	shellCompletionStatusToRepairEffects: () => shellCompletionStatusToRepairEffects
});
const COMPLETION_CACHE_WRITE_TIMEOUT_MS = 3e4;
const PROFILE_WRITE_ERROR_CODES = /* @__PURE__ */ new Set([
	"EACCES",
	"EPERM",
	"EROFS"
]);
function findProfileWriteError(err) {
	if (require_errors.isErrno(err) && PROFILE_WRITE_ERROR_CODES.has(err.code ?? "")) return err;
	return err instanceof Error ? findProfileWriteError(err.cause) : void 0;
}
function resolveCompletionReloadPath(shell) {
	if (shell === "powershell") return resolveCompletionProfilePath("powershell");
	return `~/.${shell === "zsh" ? "zshrc" : shell === "bash" ? "bashrc" : "config/fish/config.fish"}`;
}
function formatCompletionReloadNote(shell, action) {
	return `Shell completion ${action}. Restart your shell or run: ${formatCompletionReloadCommand(shell, resolveCompletionReloadPath(shell))}`;
}
async function installCompletionForDoctor(shell, cliName, action) {
	try {
		await installCompletion(shell, true, cliName);
		require_note.note(formatCompletionReloadNote(shell, action), "Shell completion");
	} catch (err) {
		const writeError = findProfileWriteError(err);
		if (!writeError) throw err;
		require_note.note(`Shell completion not ${action}: ${writeError.path ?? resolveCompletionProfilePath(shell)} is not writable. Run \`${cliName} completion --install\` against a writable profile file.`, "Shell completion");
	}
}
/** Generate the completion cache by spawning the CLI. */
async function generateCompletionCache(options) {
	const root = await require_operator_root.resolveOperatorPackageRoot({
		moduleUrl: require("url").pathToFileURL(__filename).href,
		argv1: process.argv[1],
		cwd: process.cwd()
	});
	if (!root) return false;
	const args = [
		node_path.default.join(root, "operator.mjs"),
		"completion",
		"--write-state"
	];
	if (options.shell) args.push("--shell", options.shell);
	const env = { ...process.env };
	if (options.generationMode === "core-only") env[COMPLETION_SKIP_PLUGIN_COMMANDS_ENV] = "1";
	else delete env[COMPLETION_SKIP_PLUGIN_COMMANDS_ENV];
	return (0, node_child_process.spawnSync)(process.execPath, args, {
		cwd: root,
		env,
		encoding: "utf-8",
		timeout: COMPLETION_CACHE_WRITE_TIMEOUT_MS
	}).status === 0;
}
/** Check the status of shell completion for the current shell. */
async function checkShellCompletionStatus(binName = "@gabrielvfonseca/operator", options = {}) {
	const shell = options.shell ?? resolveShellFromEnv();
	return {
		shell,
		profileInstalled: await isCompletionInstalled(shell, binName),
		cacheExists: await completionCacheExists(shell, binName),
		cachePath: resolveCompletionCachePath(shell, binName),
		usesSlowPattern: await usesSlowDynamicCompletion(shell, binName)
	};
}
/** Converts shell completion status into health findings shown by check flows. */
function shellCompletionStatusToHealthFindings(status) {
	const checkId = "core/doctor/shell-completion";
	const pathLocal = `shellCompletion.${status.shell}`;
	if (status.usesSlowPattern) return [{
		checkId,
		severity: "info",
		message: `Your ${status.shell} profile uses slow dynamic completion (source <(...)).`,
		path: pathLocal,
		fixHint: "Run `operator doctor --fix` to upgrade to cached completion."
	}];
	if (status.profileInstalled && !status.cacheExists) return [{
		checkId,
		severity: "info",
		message: `Shell completion is configured in your ${status.shell} profile but the cache is missing.`,
		path: pathLocal,
		fixHint: `Run \`operator completion --write-state\` or \`operator doctor --fix\` to regenerate ${status.cachePath}.`
	}];
	return [];
}
/** Converts shell completion status into dry-run repair effects for health check reporting. */
function shellCompletionStatusToRepairEffects(status) {
	const effects = [];
	if (status.usesSlowPattern && !status.cacheExists) effects.push({
		kind: "state",
		action: "would-generate-completion-cache",
		target: status.cachePath,
		dryRunSafe: true
	});
	if (status.usesSlowPattern) effects.push({
		kind: "file",
		action: "would-upgrade-shell-profile-completion",
		target: status.shell,
		dryRunSafe: false
	});
	else if (status.profileInstalled && !status.cacheExists) effects.push({
		kind: "state",
		action: "would-regenerate-completion-cache",
		target: status.cachePath,
		dryRunSafe: true
	});
	return effects;
}
/**
* Repairs shell completion setup when doctor runs interactively.
*
* Slow dynamic profiles are upgraded to cached completion; configured profiles with a missing
* cache regenerate it; missing completion prompts unless non-interactive mode is active.
*/
async function doctorShellCompletion(_runtime, prompter, options = {}) {
	const cliName = require_cli_name.resolveCliName();
	const status = await checkShellCompletionStatus(cliName);
	if (status.usesSlowPattern) {
		require_note.note(`Your ${status.shell} profile uses slow dynamic completion (source <(...)).\nUpgrading to cached completion for faster shell startup...`, "Shell completion");
		if (!status.cacheExists) {
			if (!await generateCompletionCache({ generationMode: "core-only" })) {
				require_note.note(`Failed to generate completion cache. Run \`${cliName} completion --write-state\` manually.`, "Shell completion");
				return;
			}
		}
		await installCompletionForDoctor(status.shell, cliName, "upgraded");
		return;
	}
	if (status.profileInstalled && !status.cacheExists) {
		require_note.note(`Shell completion is configured in your ${status.shell} profile but the cache is missing.\nRegenerating cache...`, "Shell completion");
		if (await generateCompletionCache({ generationMode: "core-only" })) require_note.note(`Completion cache regenerated at ${status.cachePath}`, "Shell completion");
		else require_note.note(`Failed to regenerate completion cache. Run \`${cliName} completion --write-state\` manually.`, "Shell completion");
		return;
	}
	if (!status.profileInstalled) {
		if (options.nonInteractive) return;
		if (await prompter.confirm({
			message: `Enable ${status.shell} shell completion for ${cliName}?`,
			initialValue: true
		})) {
			if (!await generateCompletionCache({ generationMode: "core-only" })) {
				require_note.note(`Failed to generate completion cache. Run \`${cliName} completion --write-state\` manually.`, "Shell completion");
				return;
			}
			await installCompletionForDoctor(status.shell, cliName, "installed");
		}
	}
}
/** Ensures the shell completion cache exists without prompting during setup/update flows. */
async function ensureCompletionCacheExists(binName, options) {
	if (await completionCacheExists(options.shell ?? resolveShellFromEnv(), binName)) return true;
	return generateCompletionCache(options);
}
//#endregion
Object.defineProperty(exports, "checkShellCompletionStatus", {
	enumerable: true,
	get: function() {
		return checkShellCompletionStatus;
	}
});
Object.defineProperty(exports, "doctor_completion_exports", {
	enumerable: true,
	get: function() {
		return doctor_completion_exports;
	}
});
Object.defineProperty(exports, "ensureCompletionCacheExists", {
	enumerable: true,
	get: function() {
		return ensureCompletionCacheExists;
	}
});
Object.defineProperty(exports, "formatCompletionReloadCommand", {
	enumerable: true,
	get: function() {
		return formatCompletionReloadCommand;
	}
});
Object.defineProperty(exports, "installCompletion", {
	enumerable: true,
	get: function() {
		return installCompletion;
	}
});
Object.defineProperty(exports, "resolveCompletionProfilePath", {
	enumerable: true,
	get: function() {
		return resolveCompletionProfilePath;
	}
});
Object.defineProperty(exports, "shellCompletionStatusToHealthFindings", {
	enumerable: true,
	get: function() {
		return shellCompletionStatusToHealthFindings;
	}
});
Object.defineProperty(exports, "shellCompletionStatusToRepairEffects", {
	enumerable: true,
	get: function() {
		return shellCompletionStatusToRepairEffects;
	}
});
