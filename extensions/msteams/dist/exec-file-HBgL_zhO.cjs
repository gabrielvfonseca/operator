const require_exec = require("./exec-CMb2J-j8.cjs");
//#region src/daemon/exec-file.ts
/** Child-process wrapper used by daemon installers to preserve stdout/stderr on failure. */
/** Runs a child process as UTF-8 and returns exit data instead of throwing on nonzero exit. */
async function execFileUtf8(command, args, options = {}) {
	try {
		const result = await require_exec.runCommandWithTimeout([command, ...args], {
			baseEnv: options.env,
			cwd: options.cwd,
			killSignal: options.killSignal,
			maxOutputBytes: 1024 * 1024,
			timeoutMs: options.timeout
		});
		return {
			stdout: result.stdout,
			stderr: result.stderr,
			code: result.code ?? 1
		};
	} catch (error) {
		return {
			stdout: "",
			stderr: error instanceof Error ? error.message : String(error),
			code: 1
		};
	}
}
//#endregion
Object.defineProperty(exports, "execFileUtf8", {
	enumerable: true,
	get: function() {
		return execFileUtf8;
	}
});
