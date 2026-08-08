const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_windows_install_roots = require("./windows-install-roots-pUuZWNtA.cjs");
const require_executable_path = require("./executable-path-BHxqQqcc.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_process = require("node:process");
node_process = require_rolldown_runtime.__toESM(node_process, 1);
//#region src/process/windows-command.ts
const WINDOWS_UNSAFE_CMD_CHARS_RE = /[&|<>%\r\n]/;
function resolveNpmArgvForWindows(argv) {
	if (node_process.default.platform !== "win32" || argv.length === 0) return null;
	const basename = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename((0, _gabrielvfonseca_normalization_core.expectDefined)(argv[0], "argv entry at 0"))).replace(/\.(cmd|exe|bat)$/, "");
	const cliName = basename === "npx" ? "npx-cli.js" : basename === "npm" ? "npm-cli.js" : null;
	if (!cliName) return null;
	const cliPath = node_path.default.join(node_path.default.dirname(node_process.default.execPath), "node_modules", "npm", "bin", cliName);
	if (node_fs.default.existsSync(cliPath)) return [
		node_process.default.execPath,
		cliPath,
		...argv.slice(1)
	];
	const command = argv[0] ?? "";
	return [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.extname(command)) ? command : `${command}.cmd`, ...argv.slice(1)];
}
function createWindowsCommandNotFoundError(command) {
	const error = /* @__PURE__ */ new Error(`spawn ${command} ENOENT`);
	error.code = "ENOENT";
	error.path = command;
	error.syscall = `spawn ${command}`;
	return error;
}
function resolveWindowsEnvironmentValue(env, name) {
	const normalizedName = name.toLowerCase();
	return Object.entries(env).find(([key]) => key.toLowerCase() === normalizedName)?.[1];
}
function resolveWindowsCommandFromCwdOrPath(params) {
	if (params.command.includes("/") || params.command.includes("\\")) {
		const candidate = require_executable_path.resolveExecutablePathCandidate(params.command, {
			cwd: params.cwd,
			env: params.env
		});
		if (!candidate) return;
		if (node_path.default.extname(candidate)) return require_executable_path.isRegularFile(candidate) ? candidate : void 0;
		return require_executable_path.resolveExecutableFromPathEnv(node_path.default.basename(candidate), node_path.default.dirname(candidate), params.env, { includeExtensionless: false });
	}
	const cwd = params.cwd?.trim() || node_process.default.cwd();
	const pathEntries = (resolveWindowsEnvironmentValue(params.env, "PATH") ?? resolveWindowsEnvironmentValue(node_process.default.env, "PATH") ?? "").split(";").map((entry) => entry.replace(/^"(.*)"$/, "$1").trim()).filter(Boolean).map((entry) => node_path.default.isAbsolute(entry) ? entry : node_path.default.resolve(cwd, entry));
	return require_executable_path.resolveExecutableFromPathEnv(params.command, pathEntries.join(";"), params.env, { includeExtensionless: false });
}
function resolveSupportedWindowsCommand(params) {
	if (node_process.default.platform !== "win32") return params.command;
	let resolved = resolveWindowsCommandFromCwdOrPath(params);
	const shimmedCommand = resolveWindowsCommandShim({
		command: params.command,
		cmdCommands: [
			"corepack",
			"pnpm",
			"yarn"
		]
	});
	if (!resolved && shimmedCommand !== params.command) resolved = resolveWindowsCommandFromCwdOrPath({
		...params,
		command: shimmedCommand
	});
	if (!resolved) throw createWindowsCommandNotFoundError(params.command);
	const extension = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.extname(resolved));
	if ([
		".exe",
		".com",
		".cmd",
		".bat"
	].includes(extension)) return resolved;
	throw new Error(`Unsupported Windows command extension ${JSON.stringify(extension || "<none>")} for ${JSON.stringify(params.command)}; use an explicit executable or shell wrapper.`);
}
/** Resolve one shell-free invocation before Execa can apply Windows fallbacks. */
function resolveSafeChildProcessInvocation(params) {
	const finalArgv = resolveNpmArgvForWindows(params.argv) ?? params.argv;
	const cwd = params.cwd instanceof URL ? (0, node_url.fileURLToPath)(params.cwd) : params.cwd;
	const resolvedCommand = resolveSupportedWindowsCommand({
		command: finalArgv[0] ?? "",
		cwd,
		env: params.env
	});
	const useCmdWrapper = isWindowsBatchCommand(resolvedCommand);
	return {
		command: useCmdWrapper ? resolveSupportedWindowsCommand({
			command: resolveTrustedWindowsCmdExe(),
			cwd,
			env: params.env
		}) : resolvedCommand,
		args: useCmdWrapper ? [
			"/d",
			"/s",
			"/c",
			buildWindowsCmdExeCommandLine(resolvedCommand, finalArgv.slice(1))
		] : finalArgv.slice(1),
		usesWindowsExitCodeShim: node_process.default.platform === "win32" && (useCmdWrapper || finalArgv !== params.argv),
		windowsHide: true,
		windowsVerbatimArguments: useCmdWrapper ? true : params.windowsVerbatimArguments
	};
}
function isWindowsBatchCommand(resolvedCommand, platform = node_process.default.platform) {
	if (platform !== "win32") return false;
	const ext = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.extname(resolvedCommand));
	return ext === ".cmd" || ext === ".bat";
}
function escapeForWindowsCmdExe(arg) {
	if (WINDOWS_UNSAFE_CMD_CHARS_RE.test(arg)) throw new Error(`Unsafe Windows cmd.exe argument detected: ${JSON.stringify(arg)}. Pass an explicit shell-wrapper argv at the call site instead.`);
	const escaped = arg.replace(/\^/g, "^^");
	if (!escaped.includes(" ") && !escaped.includes("\"")) return escaped;
	return `"${escaped.replace(/"/g, "\"\"")}"`;
}
function buildWindowsCmdExeCommandLine(command, args) {
	const escapedCommand = escapeForWindowsCmdExe(command);
	const commandLine = [escapedCommand, ...args.map(escapeForWindowsCmdExe)].join(" ");
	return escapedCommand.startsWith("\"") ? `"${commandLine}"` : commandLine;
}
function resolveTrustedWindowsCmdExe(platform = node_process.default.platform) {
	if (platform !== "win32") return "cmd.exe";
	return require_windows_install_roots.getWindowsCmdExePath();
}
/**
* Resolve package-manager commands that Windows exposes through .cmd shims.
* Explicit extensions are preserved so callers can pass already-resolved tools.
*/
function resolveWindowsCommandShim(params) {
	if ((params.platform ?? node_process.default.platform) !== "win32") return params.command;
	const basename = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.basename(params.command));
	if (node_path.default.extname(basename)) return params.command;
	if (params.cmdCommands.includes(basename)) return `${params.command}.cmd`;
	return params.command;
}
//#endregion
Object.defineProperty(exports, "buildWindowsCmdExeCommandLine", {
	enumerable: true,
	get: function() {
		return buildWindowsCmdExeCommandLine;
	}
});
Object.defineProperty(exports, "isWindowsBatchCommand", {
	enumerable: true,
	get: function() {
		return isWindowsBatchCommand;
	}
});
Object.defineProperty(exports, "resolveSafeChildProcessInvocation", {
	enumerable: true,
	get: function() {
		return resolveSafeChildProcessInvocation;
	}
});
Object.defineProperty(exports, "resolveTrustedWindowsCmdExe", {
	enumerable: true,
	get: function() {
		return resolveTrustedWindowsCmdExe;
	}
});
Object.defineProperty(exports, "resolveWindowsCommandShim", {
	enumerable: true,
	get: function() {
		return resolveWindowsCommandShim;
	}
});
