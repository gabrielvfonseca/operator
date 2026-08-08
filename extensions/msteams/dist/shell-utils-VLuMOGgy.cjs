const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_kill_tree = require("./kill-tree-BxZeSfim.cjs");
const require_config = require("./config-Bb4ey1E_.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_child_process = require("node:child_process");
//#region src/agents/shell-utils.ts
/**
* Shell execution helpers.
*
* Resolves platform shell commands, sanitizes binary output, and exposes process-tree cleanup.
*/
function resolvePowerShellPath() {
	const programFiles = process.env.ProgramFiles || process.env.PROGRAMFILES || "C:\\Program Files";
	const pwsh7 = node_path.default.join(programFiles, "PowerShell", "7", "pwsh.exe");
	if (node_fs.default.existsSync(pwsh7)) return pwsh7;
	const programW6432 = process.env.ProgramW6432;
	if (programW6432 && programW6432 !== programFiles) {
		const pwsh7Alt = node_path.default.join(programW6432, "PowerShell", "7", "pwsh.exe");
		if (node_fs.default.existsSync(pwsh7Alt)) return pwsh7Alt;
	}
	const pwshInPath = resolveShellFromPath("pwsh");
	if (pwshInPath) return pwshInPath;
	const systemRoot = process.env.SystemRoot || process.env.WINDIR;
	if (systemRoot) {
		const candidate = node_path.default.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	return "powershell.exe";
}
const NON_INTERACTIVE_SHELLS = /* @__PURE__ */ new Set(["false", "nologin"]);
function isNonInteractiveShell(shellPath) {
	if (!shellPath) return false;
	return NON_INTERACTIVE_SHELLS.has(node_path.default.basename(shellPath));
}
function getPosixShellArgs(shellPath) {
	switch (node_path.default.basename(shellPath)) {
		case "bash": return [
			"--noprofile",
			"--norc",
			"-c"
		];
		case "zsh": return ["-f", "-c"];
		case "fish": return ["--no-config", "-c"];
		default: return ["-c"];
	}
}
function resolveWindowsBashPath(env = process.env) {
	const candidates = [env.ProgramFiles, env["ProgramFiles(x86)"]].filter((dir) => Boolean(dir?.trim())).map((dir) => node_path.default.join(dir, "Git", "bin", "bash.exe"));
	for (const candidate of candidates) if (node_fs.default.existsSync(candidate)) return candidate;
	return resolveShellFromPath("bash.exe", env) ?? resolveShellFromPath("bash", env);
}
function getShellConfig(customShellPath) {
	if (customShellPath) {
		if (!node_fs.default.existsSync(customShellPath)) throw new Error(`Custom shell path not found: ${customShellPath}`);
		return {
			shell: customShellPath,
			args: getPosixShellArgs(customShellPath)
		};
	}
	if (process.platform === "win32") return {
		shell: resolvePowerShellPath(),
		args: [
			"-NoProfile",
			"-NonInteractive",
			"-Command"
		]
	};
	const rawEnvShell = process.env.SHELL?.trim();
	const envShell = rawEnvShell && !isNonInteractiveShell(rawEnvShell) ? rawEnvShell : void 0;
	if ((envShell ? node_path.default.basename(envShell) : "") === "fish") {
		const bash = resolveShellFromPath("bash");
		if (bash) return {
			shell: bash,
			args: getPosixShellArgs(bash)
		};
		const sh = resolveShellFromPath("sh");
		if (sh) return {
			shell: sh,
			args: getPosixShellArgs(sh)
		};
	}
	if (envShell) return {
		shell: envShell,
		args: getPosixShellArgs(envShell)
	};
	const shell = resolveShellFromPath("sh") ?? resolveShellFromPath("bash") ?? "sh";
	return {
		shell,
		args: getPosixShellArgs(shell)
	};
}
function getBashShellConfig(customShellPath) {
	if (customShellPath) {
		if (!node_fs.default.existsSync(customShellPath)) throw new Error(`Custom shell path not found: ${customShellPath}`);
		return {
			shell: customShellPath,
			args: getPosixShellArgs(customShellPath)
		};
	}
	if (process.platform === "win32") {
		const bash = resolveWindowsBashPath();
		if (bash) return {
			shell: bash,
			args: ["-c"]
		};
		throw new Error("No bash shell found. Install Git for Windows or add bash.exe to PATH.");
	}
	if (node_fs.default.existsSync("/bin/bash")) return {
		shell: "/bin/bash",
		args: getPosixShellArgs("/bin/bash")
	};
	const shell = resolveShellFromPath("bash") ?? resolveShellFromWhich("bash") ?? resolveShellFromPath("sh") ?? "sh";
	return {
		shell,
		args: getPosixShellArgs(shell)
	};
}
function resolveShellFromPath(name, env = process.env) {
	const envPath = env.PATH ?? "";
	if (!envPath) return;
	const entries = envPath.split(node_path.default.delimiter).filter(Boolean);
	for (const entry of entries) {
		const candidate = node_path.default.join(entry, name);
		try {
			node_fs.default.accessSync(candidate, node_fs.default.constants.X_OK);
			return candidate;
		} catch {}
	}
}
function resolveShellFromWhich(name) {
	if (process.platform === "win32") return;
	try {
		const result = (0, node_child_process.spawnSync)("which", [name], {
			encoding: "utf8",
			timeout: 5e3,
			windowsHide: true
		});
		if (result.status !== 0 || !result.stdout) return;
		return result.stdout.trim().split(/\r?\n/)[0]?.trim() || void 0;
	} catch {
		return;
	}
}
function normalizeShellName(value) {
	const trimmed = value.trim();
	if (!trimmed) return "";
	return node_path.default.basename(trimmed).replace(/\.(exe|cmd|bat)$/i, "").replace(/[^a-zA-Z0-9_-]/g, "");
}
function detectRuntimeShell() {
	const overrideShell = process.env.OPERATOR_SHELL?.trim();
	if (overrideShell) {
		const name = normalizeShellName(overrideShell);
		if (name) return name;
	}
	if (process.platform === "win32") {
		if (process.env.POWERSHELL_DISTRIBUTION_CHANNEL) return "pwsh";
		return "powershell";
	}
	const envShell = process.env.SHELL?.trim();
	if (envShell && !isNonInteractiveShell(envShell)) {
		const name = normalizeShellName(envShell);
		if (name) return name;
	}
	if (process.env.POWERSHELL_DISTRIBUTION_CHANNEL) return "pwsh";
	if (process.env.BASH_VERSION) return "bash";
	if (process.env.ZSH_VERSION) return "zsh";
	if (process.env.FISH_VERSION) return "fish";
	if (process.env.KSH_VERSION) return "ksh";
	if (process.env.NU_VERSION || process.env.NUSHELL_VERSION) return "nu";
}
function sanitizeBinaryOutput(text, options) {
	const scrubbed = require_ansi.stripAnsiForStreamChunk(text, { compatibilityGrammar: options?.ansiMode === "compat" }).replace(/[\p{Format}\p{Surrogate}]/gu, "");
	if (!scrubbed) return scrubbed;
	const chunks = [];
	for (const char of scrubbed) {
		const code = char.codePointAt(0);
		if (code == null) continue;
		if (code === 9 || code === 10 || code === 13) {
			chunks.push(char);
			continue;
		}
		if (code < 32 || code >= 127 && code <= 159) {
			chunks.push(`\\x${code.toString(16).padStart(2, "0")}`);
			continue;
		}
		chunks.push(char);
	}
	return chunks.join("");
}
function getShellEnv() {
	const binDir = require_config.getBinDir();
	const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
	const currentPath = process.env[pathKey] ?? "";
	const updatedPath = currentPath.split(node_path.default.delimiter).filter(Boolean).includes(binDir) ? currentPath : [binDir, currentPath].filter(Boolean).join(node_path.default.delimiter);
	return {
		...process.env,
		[pathKey]: updatedPath
	};
}
function killProcessTree(pid, opts) {
	require_kill_tree.killProcessTree(pid, {
		force: true,
		...opts
	});
}
//#endregion
Object.defineProperty(exports, "detectRuntimeShell", {
	enumerable: true,
	get: function() {
		return detectRuntimeShell;
	}
});
Object.defineProperty(exports, "getBashShellConfig", {
	enumerable: true,
	get: function() {
		return getBashShellConfig;
	}
});
Object.defineProperty(exports, "getShellConfig", {
	enumerable: true,
	get: function() {
		return getShellConfig;
	}
});
Object.defineProperty(exports, "getShellEnv", {
	enumerable: true,
	get: function() {
		return getShellEnv;
	}
});
Object.defineProperty(exports, "killProcessTree", {
	enumerable: true,
	get: function() {
		return killProcessTree;
	}
});
Object.defineProperty(exports, "sanitizeBinaryOutput", {
	enumerable: true,
	get: function() {
		return sanitizeBinaryOutput;
	}
});
