const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_progress_line = require("./progress-line-CDI8nBBL.cjs");
//#region packages/terminal-core/src/restore.ts
const RESET_SEQUENCE = "\x1B[0m\x1B[?25h\x1B[?1000l\x1B[?1002l\x1B[?1003l\x1B[?1006l\x1B[?2004l\x1B[<u\x1B[>4;0m";
function reportRestoreFailure(scope, err, reason) {
	const suffix = reason ? ` (${reason})` : "";
	const message = `[terminal] restore ${scope} failed${suffix}: ${String(err)}`;
	try {
		process.stderr.write(`${message}\n`);
	} catch (writeErr) {
		console.error(`[terminal] restore reporting failed${suffix}: ${String(writeErr)}`);
	}
}
function restoreTerminalState(reason, options = {}) {
	const resumeStdin = options.resumeStdinIfPaused ?? options.resumeStdin ?? false;
	try {
		require_progress_line.clearActiveProgressLine();
	} catch (err) {
		reportRestoreFailure("progress line", err, reason);
	}
	const stdin = process.stdin;
	if (stdin.isTTY && typeof stdin.setRawMode === "function") {
		try {
			stdin.setRawMode(false);
		} catch (err) {
			reportRestoreFailure("raw mode", err, reason);
		}
		if (resumeStdin && typeof stdin.isPaused === "function" && stdin.isPaused()) try {
			stdin.resume();
		} catch (err) {
			reportRestoreFailure("stdin resume", err, reason);
		}
	}
	if (process.stdout.isTTY) try {
		process.stdout.write(RESET_SEQUENCE);
	} catch (err) {
		reportRestoreFailure("stdout reset", err, reason);
	}
}
//#endregion
//#region src/runtime.ts
var runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	defaultRuntime: () => defaultRuntime,
	writeRuntimeJson: () => writeRuntimeJson
});
function shouldEmitRuntimeLog(env = process.env) {
	if (env.VITEST !== "true") return true;
	if (env.OPERATOR_TEST_RUNTIME_LOG === "1") return true;
	return typeof console.log.mock === "object";
}
function shouldEmitRuntimeStdout(env = process.env) {
	if (env.VITEST !== "true") return true;
	if (env.OPERATOR_TEST_RUNTIME_LOG === "1") return true;
	return typeof process.stdout.write.mock === "object";
}
function isPipeClosedError(err) {
	const code = err?.code;
	return code === "EPIPE" || code === "EIO";
}
function hasRuntimeOutputWriter(runtime) {
	return typeof runtime.writeStdout === "function";
}
function writeStdout(value) {
	if (!shouldEmitRuntimeStdout()) return;
	require_progress_line.clearActiveProgressLine();
	const line = value.endsWith("\n") ? value : `${value}\n`;
	try {
		process.stdout.write(line);
	} catch (err) {
		if (isPipeClosedError(err)) return;
		throw err;
	}
}
function createRuntimeIo() {
	return {
		log: (...args) => {
			if (!shouldEmitRuntimeLog()) return;
			require_progress_line.clearActiveProgressLine();
			console.log(...args);
		},
		error: (...args) => {
			require_progress_line.clearActiveProgressLine();
			console.error(...args);
		},
		writeStdout,
		writeJson: (value, space = 2) => {
			writeStdout(JSON.stringify(value, null, space > 0 ? space : void 0));
		}
	};
}
const defaultRuntime = {
	...createRuntimeIo(),
	exit: (code) => {
		restoreTerminalState("runtime exit", { resumeStdinIfPaused: false });
		process.exit(code);
		throw new Error("unreachable");
	}
};
function writeRuntimeJson(runtime, value, space = 2) {
	if (hasRuntimeOutputWriter(runtime)) {
		runtime.writeJson(value, space);
		return;
	}
	runtime.log(JSON.stringify(value, null, space > 0 ? space : void 0));
}
//#endregion
Object.defineProperty(exports, "defaultRuntime", {
	enumerable: true,
	get: function() {
		return defaultRuntime;
	}
});
Object.defineProperty(exports, "restoreTerminalState", {
	enumerable: true,
	get: function() {
		return restoreTerminalState;
	}
});
Object.defineProperty(exports, "runtime_exports", {
	enumerable: true,
	get: function() {
		return runtime_exports;
	}
});
Object.defineProperty(exports, "writeRuntimeJson", {
	enumerable: true,
	get: function() {
		return writeRuntimeJson;
	}
});
