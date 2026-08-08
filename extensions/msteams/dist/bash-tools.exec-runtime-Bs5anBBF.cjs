const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
require("./errors-BqS4bzom.cjs");
const require_spawn_utils = require("./spawn-utils-DnBYRiMr.cjs");
const require_windows_command = require("./windows-command-C8d7D1FM.cjs");
const require_kill_tree = require("./kill-tree-BxZeSfim.cjs");
const require_markdown_code = require("./markdown-code-XePB7Ipf.cjs");
const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_heartbeat_wake = require("./heartbeat-wake-E8hls_pf.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_windows_spawn = require("./windows-spawn-CxukckE5.cjs");
const require_linux_oom_score = require("./linux-oom-score-DsJe3nUs.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_shell_utils = require("./shell-utils-VLuMOGgy.cjs");
const require_event_session_routing = require("./event-session-routing-BmkihcER.cjs");
require("./bash-tools.schemas-DAU-eSdE.cjs");
const require_bash_tools_shared = require("./bash-tools.shared-DLnmR_E2.cjs");
const require_bash_process_registry = require("./bash-process-registry-CmxCXwAs.cjs");
const require_path_prepend = require("./path-prepend-CrHzSLEG.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_child_process = require("node:child_process");
let node_perf_hooks = require("node:perf_hooks");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/process/supervisor/adapters/env.ts
/** Convert Node's optional env values into the concrete string map spawn adapters expect. */
function toStringEnv(env) {
	if (!env) return {};
	const out = {};
	for (const [key, value] of Object.entries(env)) {
		if (value === void 0) continue;
		out[key] = value;
	}
	return out;
}
//#endregion
//#region src/process/supervisor/adapters/child.ts
const FORCE_KILL_WAIT_FALLBACK_MS$1 = 4e3;
const WINDOWS_CLOSE_STATE_SETTLE_TIMEOUT_MS = 250;
const WINDOWS_PACKAGE_MANAGER_SHIMS = [
	"npm",
	"pnpm",
	"yarn",
	"npx"
];
function resolveChildInvocation(params) {
	const command = params.argv[0] ?? "";
	const candidate = require_windows_spawn.resolveWindowsSpawnProgramCandidate({
		command,
		env: params.env,
		execPath: process.platform === "win32" ? require_windows_spawn.resolveWindowsExecutablePath("node", params.env ?? process.env) : void 0
	});
	const args = [...candidate.leadingArgv, ...params.argv.slice(1)];
	const resolvedCommand = candidate.resolution === "direct" && candidate.command === command ? require_windows_command.resolveWindowsCommandShim({
		command,
		cmdCommands: WINDOWS_PACKAGE_MANAGER_SHIMS
	}) : candidate.command;
	if (!require_windows_command.isWindowsBatchCommand(resolvedCommand)) return {
		command: resolvedCommand,
		args,
		windowsVerbatimArguments: params.windowsVerbatimArguments
	};
	return {
		command: require_windows_command.resolveTrustedWindowsCmdExe(),
		args: [
			"/d",
			"/s",
			"/c",
			require_windows_command.buildWindowsCmdExeCommandLine(resolvedCommand, args)
		],
		windowsVerbatimArguments: true
	};
}
function isServiceManagedRuntime() {
	return Boolean(process.env.OPERATOR_SERVICE_MARKER?.trim());
}
async function createChildAdapter(params) {
	const baseEnv = params.env ? toStringEnv(params.env) : void 0;
	const invocation = resolveChildInvocation({
		argv: params.argv,
		env: baseEnv,
		windowsVerbatimArguments: params.windowsVerbatimArguments
	});
	const preparedSpawn = require_linux_oom_score.prepareOomScoreAdjustedSpawn(invocation.command, invocation.args, { env: baseEnv });
	const stdinMode = params.stdinMode ?? (params.input !== void 0 ? "pipe-closed" : "inherit");
	const useDetached = process.platform !== "win32" && !isServiceManagedRuntime();
	const options = {
		cwd: params.cwd,
		env: preparedSpawn.env,
		stdio: [
			"pipe",
			"pipe",
			"pipe"
		],
		detached: useDetached,
		windowsHide: true,
		windowsVerbatimArguments: invocation.windowsVerbatimArguments
	};
	if (stdinMode === "inherit") options.stdio = [
		"inherit",
		"pipe",
		"pipe"
	];
	else options.stdio = [
		"pipe",
		"pipe",
		"pipe"
	];
	const spawned = await require_spawn_utils.spawnWithFallback({
		argv: [preparedSpawn.command, ...preparedSpawn.args],
		options,
		fallbacks: useDetached ? [{
			label: "no-detach",
			options: { detached: false }
		}] : []
	});
	const child = spawned.child;
	const ignoreOutputStreamError = () => {};
	child.stdout.on("error", ignoreOutputStreamError);
	child.stderr.on("error", ignoreOutputStreamError);
	const childStdin = spawned.child.stdin;
	let stdinDestroyed = childStdin?.destroyed ?? false;
	let stdinEnded = childStdin?.writableEnded === true || childStdin?.writableFinished === true;
	if (childStdin) {
		childStdin.once("finish", () => {
			stdinEnded = true;
		});
		childStdin.once("close", () => {
			stdinEnded = true;
			stdinDestroyed = true;
		});
		childStdin.once("error", () => {
			stdinDestroyed = true;
		});
		if (params.input !== void 0) {
			childStdin.write(params.input);
			stdinEnded = true;
			childStdin.end();
		} else if (stdinMode === "pipe-closed") {
			stdinEnded = true;
			childStdin.end();
		}
	}
	const stdin = childStdin ? {
		get destroyed() {
			return stdinDestroyed || childStdin.destroyed;
		},
		get writable() {
			return !stdinDestroyed && !stdinEnded && childStdin.writable;
		},
		get writableEnded() {
			return stdinEnded || childStdin.writableEnded;
		},
		get writableFinished() {
			return childStdin.writableFinished;
		},
		write: (data, cb) => {
			if (stdinDestroyed || stdinEnded || !childStdin.writable) {
				cb?.(/* @__PURE__ */ new Error("stdin is not writable"));
				return;
			}
			try {
				childStdin.write(data, cb);
			} catch (err) {
				cb?.(err);
			}
		},
		end: () => {
			try {
				stdinEnded = true;
				childStdin.end();
			} catch {}
		},
		destroy: () => {
			try {
				stdinDestroyed = true;
				stdinEnded = true;
				childStdin.destroy();
			} catch {}
		}
	} : void 0;
	const onStdout = (listener) => {
		const stdoutDecoder = require_spawn_utils.createWindowsOutputDecoder();
		let flushed = false;
		const flush = () => {
			if (flushed) return;
			flushed = true;
			const tail = stdoutDecoder.flush();
			if (tail) listener(tail);
		};
		child.stdout.on("data", (chunk) => {
			const text = stdoutDecoder.decode(chunk);
			if (text) listener(text);
		});
		child.stdout.once("end", flush);
		child.stdout.once("close", flush);
	};
	const onStderr = (listener) => {
		const stderrDecoder = require_spawn_utils.createWindowsOutputDecoder();
		let flushed = false;
		const flush = () => {
			if (flushed) return;
			flushed = true;
			const tail = stderrDecoder.flush();
			if (tail) listener(tail);
		};
		child.stderr.on("data", (chunk) => {
			const text = stderrDecoder.decode(chunk);
			if (text) listener(text);
		});
		child.stderr.once("end", flush);
		child.stderr.once("close", flush);
	};
	let waitResult = null;
	let waitError;
	let resolveWait = null;
	let rejectWait = null;
	let waitPromise = null;
	let forceKillWaitFallbackTimer = null;
	let childExitState = null;
	let windowsCloseFallbackTimer = null;
	let stdoutDrained = child.stdout == null;
	let stderrDrained = child.stderr == null;
	const clearForceKillWaitFallback = () => {
		if (!forceKillWaitFallbackTimer) return;
		clearTimeout(forceKillWaitFallbackTimer);
		forceKillWaitFallbackTimer = null;
	};
	const clearWindowsCloseFallbackTimer = () => {
		if (!windowsCloseFallbackTimer) return;
		clearTimeout(windowsCloseFallbackTimer);
		windowsCloseFallbackTimer = null;
	};
	const settleWait = (value) => {
		if (waitResult || waitError !== void 0) return;
		clearForceKillWaitFallback();
		clearWindowsCloseFallbackTimer();
		waitResult = value;
		if (resolveWait) {
			const resolve = resolveWait;
			resolveWait = null;
			rejectWait = null;
			resolve(value);
		}
	};
	const rejectPendingWait = (error) => {
		if (waitResult || waitError !== void 0) return;
		clearForceKillWaitFallback();
		clearWindowsCloseFallbackTimer();
		waitError = error;
		if (rejectWait) {
			const reject = rejectWait;
			resolveWait = null;
			rejectWait = null;
			reject(error);
		}
	};
	const scheduleForceKillWaitFallback = (signal) => {
		clearForceKillWaitFallback();
		forceKillWaitFallbackTimer = setTimeout(() => {
			settleWait({
				code: null,
				signal
			});
		}, FORCE_KILL_WAIT_FALLBACK_MS$1);
		forceKillWaitFallbackTimer.unref?.();
	};
	const resolveObservedExitState = (fallback) => {
		if (childExitState != null) return childExitState;
		return {
			code: child.exitCode ?? fallback.code,
			signal: child.signalCode ?? fallback.signal
		};
	};
	const maybeSettleAfterWindowsExit = () => {
		if (process.platform !== "win32" || childExitState == null || !stdoutDrained || !stderrDrained) return;
		settleWait(resolveObservedExitState(childExitState));
	};
	const scheduleWindowsCloseFallback = () => {
		if (process.platform !== "win32") return;
		clearWindowsCloseFallbackTimer();
		windowsCloseFallbackTimer = setTimeout(() => {
			maybeSettleAfterWindowsExit();
		}, WINDOWS_CLOSE_STATE_SETTLE_TIMEOUT_MS);
		windowsCloseFallbackTimer.unref?.();
	};
	child.stdout?.once("end", () => {
		stdoutDrained = true;
		maybeSettleAfterWindowsExit();
	});
	child.stdout?.once("close", () => {
		stdoutDrained = true;
		maybeSettleAfterWindowsExit();
	});
	child.stderr?.once("end", () => {
		stderrDrained = true;
		maybeSettleAfterWindowsExit();
	});
	child.stderr?.once("close", () => {
		stderrDrained = true;
		maybeSettleAfterWindowsExit();
	});
	child.once("error", (error) => {
		rejectPendingWait(error);
	});
	child.once("exit", (code, signal) => {
		childExitState = {
			code,
			signal
		};
		scheduleWindowsCloseFallback();
	});
	child.once("close", (code, signal) => {
		settleWait(resolveObservedExitState({
			code,
			signal
		}));
	});
	const wait = async () => {
		if (waitResult) return waitResult;
		if (waitError !== void 0) throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(waitError, "Non-Error thrown");
		if (!waitPromise) waitPromise = new Promise((resolve, reject) => {
			resolveWait = resolve;
			rejectWait = reject;
			if (waitResult) {
				const settled = waitResult;
				resolveWait = null;
				rejectWait = null;
				resolve(settled);
				return;
			}
			if (waitError !== void 0) {
				const error = waitError;
				resolveWait = null;
				rejectWait = null;
				reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Non-Error rejection"));
			}
		});
		return waitPromise;
	};
	const childIsDetached = useDetached && !spawned.usedFallback;
	const signalProcessTreeForChild = (pid, signal) => {
		require_kill_tree.signalProcessTree(pid, signal, { detached: childIsDetached });
	};
	const kill = (signal) => {
		const pid = child.pid ?? void 0;
		if (signal === void 0 || signal === "SIGKILL") {
			if (pid) signalProcessTreeForChild(pid, "SIGKILL");
			try {
				child.kill("SIGKILL");
			} catch {}
			scheduleForceKillWaitFallback("SIGKILL");
			return;
		}
		if (signal === "SIGTERM" && pid) {
			signalProcessTreeForChild(pid, "SIGTERM");
			return;
		}
		try {
			child.kill(signal);
		} catch {}
	};
	const dispose = () => {
		clearForceKillWaitFallback();
		clearWindowsCloseFallbackTimer();
		child.removeAllListeners();
	};
	return {
		pid: child.pid ?? void 0,
		stdin,
		onStdout,
		onStderr,
		wait,
		kill,
		dispose
	};
}
//#endregion
//#region src/process/supervisor/adapters/pty.ts
const FORCE_KILL_WAIT_FALLBACK_MS = 4e3;
async function createPtyAdapter(params) {
	const { spawn } = await import("@lydell/node-pty");
	const baseEnv = params.env ? toStringEnv(params.env) : void 0;
	const preparedSpawn = require_linux_oom_score.prepareOomScoreAdjustedSpawn(params.shell, params.args, { env: baseEnv });
	const pty = spawn(preparedSpawn.command, preparedSpawn.args, {
		cwd: params.cwd,
		env: preparedSpawn.env ? toStringEnv(preparedSpawn.env) : void 0,
		name: params.name ?? process.env.TERM ?? "xterm-256color",
		cols: params.cols ?? 120,
		rows: params.rows ?? 30
	});
	let dataListener = null;
	let exitListener = null;
	let waitResult = null;
	let resolveWait = null;
	let waitPromise = null;
	let forceKillWaitFallbackTimer = null;
	let stdinDestroyed = false;
	let stdinEnded = false;
	const clearForceKillWaitFallback = () => {
		if (!forceKillWaitFallbackTimer) return;
		clearTimeout(forceKillWaitFallbackTimer);
		forceKillWaitFallbackTimer = null;
	};
	const settleWait = (value) => {
		if (waitResult) return;
		clearForceKillWaitFallback();
		stdinDestroyed = true;
		stdinEnded = true;
		waitResult = value;
		if (resolveWait) {
			const resolve = resolveWait;
			resolveWait = null;
			resolve(value);
		}
	};
	const scheduleForceKillWaitFallback = (signal) => {
		clearForceKillWaitFallback();
		forceKillWaitFallbackTimer = setTimeout(() => {
			settleWait({
				code: null,
				signal
			});
		}, FORCE_KILL_WAIT_FALLBACK_MS);
		forceKillWaitFallbackTimer.unref();
	};
	exitListener = pty.onExit((event) => {
		const signal = event.signal && event.signal !== 0 ? event.signal : null;
		settleWait({
			code: event.exitCode ?? null,
			signal
		});
	});
	const stdin = {
		get destroyed() {
			return stdinDestroyed;
		},
		get writable() {
			return !stdinDestroyed && !stdinEnded;
		},
		get writableEnded() {
			return stdinEnded;
		},
		get writableFinished() {
			return stdinEnded;
		},
		write: (data, cb) => {
			try {
				pty.write(data);
				cb?.(null);
			} catch (err) {
				cb?.(err);
			}
		},
		end: () => {
			try {
				stdinEnded = true;
				const eof = process.platform === "win32" ? "" : "";
				pty.write(eof);
			} catch {}
		},
		destroy: () => {
			stdinDestroyed = true;
			stdinEnded = true;
		}
	};
	const onStdout = (listener) => {
		dataListener = pty.onData((chunk) => {
			listener(chunk);
		});
	};
	const onStderr = (_listener) => {};
	const wait = async () => {
		if (waitResult) return waitResult;
		if (!waitPromise) waitPromise = new Promise((resolve) => {
			resolveWait = resolve;
			if (waitResult) {
				const settled = waitResult;
				resolveWait = null;
				resolve(settled);
			}
		});
		return waitPromise;
	};
	const kill = (signal = "SIGKILL") => {
		try {
			if ((signal === "SIGKILL" || signal === "SIGTERM") && typeof pty.pid === "number" && pty.pid > 0) require_kill_tree.signalProcessTree(pty.pid, signal);
			else if (process.platform === "win32") pty.kill();
			else pty.kill(signal);
		} catch {}
		if (signal === "SIGKILL") scheduleForceKillWaitFallback(signal);
	};
	const dispose = () => {
		stdinDestroyed = true;
		stdinEnded = true;
		try {
			dataListener?.dispose();
		} catch {}
		try {
			exitListener?.dispose();
		} catch {}
		clearForceKillWaitFallback();
		dataListener = null;
		exitListener = null;
		settleWait({
			code: null,
			signal: null
		});
	};
	return {
		pid: pty.pid || void 0,
		stdin,
		onStdout,
		onStderr,
		wait,
		kill,
		dispose
	};
}
//#endregion
//#region src/process/supervisor/registry.ts
/** In-memory run index for the supervisor; callers receive detached snapshots. */
function nowMs() {
	return Date.now();
}
const DEFAULT_MAX_EXITED_RECORDS = 2e3;
function resolveMaxExitedRecords(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 1) return DEFAULT_MAX_EXITED_RECORDS;
	return Math.max(1, Math.floor(value));
}
/**
* Create the supervisor's mutable run registry. Exited records are retained
* only for diagnostics, so the cap bounds memory without touching live runs.
*/
function createRunRegistry(options) {
	const records = /* @__PURE__ */ new Map();
	const maxExitedRecords = resolveMaxExitedRecords(options?.maxExitedRecords);
	const pruneExitedRecords = () => {
		if (!records.size) return;
		let exited = 0;
		for (const record of records.values()) if (record.state === "exited") exited += 1;
		if (exited <= maxExitedRecords) return;
		let remove = exited - maxExitedRecords;
		for (const [runId, record] of records.entries()) {
			if (remove <= 0) break;
			if (record.state !== "exited") continue;
			records.delete(runId);
			remove -= 1;
		}
	};
	const add = (record) => {
		records.set(record.runId, { ...record });
	};
	const get = (runId) => {
		const record = records.get(runId);
		return record ? { ...record } : void 0;
	};
	const updateState = (runId, state, patch) => {
		const current = records.get(runId);
		if (!current) return;
		const updatedAtMs = nowMs();
		const next = {
			...current,
			...patch,
			state,
			updatedAtMs,
			lastOutputAtMs: current.lastOutputAtMs
		};
		records.set(runId, next);
		return { ...next };
	};
	const touchOutput = (runId) => {
		const current = records.get(runId);
		if (!current) return;
		const ts = nowMs();
		records.set(runId, {
			...current,
			lastOutputAtMs: ts,
			updatedAtMs: ts
		});
	};
	const finalize = (runId, exit) => {
		const current = records.get(runId);
		if (!current) return null;
		const firstFinalize = current.state !== "exited";
		const ts = nowMs();
		const next = {
			...current,
			state: "exited",
			terminationReason: current.terminationReason ?? exit.reason,
			exitCode: current.exitCode !== void 0 ? current.exitCode : exit.exitCode,
			exitSignal: current.exitSignal !== void 0 ? current.exitSignal : exit.exitSignal,
			updatedAtMs: ts
		};
		records.set(runId, next);
		pruneExitedRecords();
		return {
			record: { ...next },
			firstFinalize
		};
	};
	return {
		add,
		get,
		updateState,
		touchOutput,
		finalize
	};
}
//#endregion
//#region src/process/supervisor/supervisor.ts
const GRACEFUL_CANCEL_TIMEOUT_MS = 5e3;
const DEFAULT_MAX_CAPTURED_OUTPUT_CHARS = 1024 * 1024;
const loadSupervisorLogRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./supervisor-log.runtime-CEf6Jbjz.cjs")));
function clampTimeout(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
	return Math.max(1, Math.floor(value));
}
function clampCapturedOutputChars(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return DEFAULT_MAX_CAPTURED_OUTPUT_CHARS;
	return Math.max(256, Math.floor(value));
}
function appendCapturedOutput(current, chunk, stream, maxChars) {
	const next = current + chunk;
	if (next.length <= maxChars) return next;
	const marker = `[operator: captured ${stream} truncated to last ${maxChars} chars]\n`;
	return `${marker}${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(next, -Math.max(0, maxChars - marker.length))}`;
}
function isTimeoutReason(reason) {
	return reason === "overall-timeout" || reason === "no-output-timeout";
}
function resolveElapsedTimeoutReason(params) {
	const elapsedDeadlines = [];
	if (params.overallTimeoutDeadlineMs !== null && params.nowMs >= params.overallTimeoutDeadlineMs) elapsedDeadlines.push({
		reason: "overall-timeout",
		deadlineMs: params.overallTimeoutDeadlineMs
	});
	if (params.noOutputTimeoutDeadlineMs !== null && params.nowMs >= params.noOutputTimeoutDeadlineMs) elapsedDeadlines.push({
		reason: "no-output-timeout",
		deadlineMs: params.noOutputTimeoutDeadlineMs
	});
	if (elapsedDeadlines.length === 0) return null;
	elapsedDeadlines.sort((a, b) => a.deadlineMs - b.deadlineMs);
	return (0, _gabrielvfonseca_normalization_core.expectDefined)(elapsedDeadlines[0], "elapsed deadlines entry at 0").reason;
}
function createProcessSupervisor() {
	const registry = createRunRegistry();
	const active = /* @__PURE__ */ new Map();
	const cancel = (runId, reason = "manual-cancel") => {
		const current = active.get(runId);
		if (!current) return;
		registry.updateState(runId, "exiting", { terminationReason: reason });
		current.run.cancel(reason);
	};
	const cancelScope = (scopeKey, reason = "manual-cancel") => {
		if (!scopeKey.trim()) return;
		for (const [runId, run] of active.entries()) {
			if (run.scopeKey !== scopeKey) continue;
			cancel(runId, reason);
		}
	};
	const spawn = async (input) => {
		const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.runId) ?? node_crypto.default.randomUUID();
		const scopeKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(input.scopeKey);
		if (input.replaceExistingScope && scopeKey) cancelScope(scopeKey, "manual-cancel");
		const startedAtMs = Date.now();
		const record = {
			runId,
			sessionId: input.sessionId,
			backendId: input.backendId,
			scopeKey,
			state: "starting",
			startedAtMs,
			lastOutputAtMs: startedAtMs,
			createdAtMs: startedAtMs,
			updatedAtMs: startedAtMs
		};
		registry.add(record);
		let forcedReason = null;
		let settled = false;
		let stdout = "";
		let stderr = "";
		let timeoutTimer = null;
		let noOutputTimer = null;
		let forceKillTimer = null;
		const captureOutput = input.captureOutput !== false;
		const maxCapturedOutputChars = clampCapturedOutputChars(input.maxCapturedOutputChars);
		const overallTimeoutMs = clampTimeout(input.timeoutMs);
		const noOutputTimeoutMs = clampTimeout(input.noOutputTimeoutMs);
		let overallTimeoutDeadlineMs = null;
		let noOutputTimeoutDeadlineMs = null;
		const setForcedReason = (reason) => {
			if (forcedReason) return;
			forcedReason = reason;
			registry.updateState(runId, "exiting", { terminationReason: reason });
		};
		let cancelAdapter = null;
		const requestCancel = (reason) => {
			setForcedReason(reason);
			cancelAdapter?.(reason);
		};
		const touchOutput = () => {
			registry.touchOutput(runId);
			if (!noOutputTimeoutMs || settled) return;
			noOutputTimeoutDeadlineMs = node_perf_hooks.performance.now() + noOutputTimeoutMs;
			if (noOutputTimer) clearTimeout(noOutputTimer);
			noOutputTimer = setTimeout(() => {
				requestCancel("no-output-timeout");
			}, noOutputTimeoutMs);
		};
		try {
			if (input.mode === "child" && input.argv.length === 0) throw new Error("spawn argv cannot be empty");
			const adapter = input.mode === "pty" ? await (async () => {
				const { shell, args: shellArgs } = require_shell_utils.getShellConfig();
				const ptyCommand = input.ptyCommand.trim();
				if (!ptyCommand) throw new Error("PTY command cannot be empty");
				return await createPtyAdapter({
					shell,
					args: [...shellArgs, ptyCommand],
					cwd: input.cwd,
					env: input.env
				});
			})() : await createChildAdapter({
				argv: input.argv,
				cwd: input.cwd,
				env: input.env,
				windowsVerbatimArguments: input.windowsVerbatimArguments,
				input: input.input,
				stdinMode: input.stdinMode
			});
			registry.updateState(runId, "running", { pid: adapter.pid });
			const clearTimers = () => {
				if (timeoutTimer) {
					clearTimeout(timeoutTimer);
					timeoutTimer = null;
				}
				if (noOutputTimer) {
					clearTimeout(noOutputTimer);
					noOutputTimer = null;
				}
				if (forceKillTimer) {
					clearTimeout(forceKillTimer);
					forceKillTimer = null;
				}
			};
			cancelAdapter = (_reason) => {
				if (settled || forceKillTimer) return;
				adapter.kill("SIGTERM");
				forceKillTimer = setTimeout(() => {
					if (!settled) adapter.kill("SIGKILL");
				}, GRACEFUL_CANCEL_TIMEOUT_MS);
				forceKillTimer.unref?.();
			};
			if (overallTimeoutMs) {
				overallTimeoutDeadlineMs = node_perf_hooks.performance.now() + overallTimeoutMs;
				timeoutTimer = setTimeout(() => {
					requestCancel("overall-timeout");
				}, overallTimeoutMs);
			}
			if (noOutputTimeoutMs) {
				noOutputTimeoutDeadlineMs = node_perf_hooks.performance.now() + noOutputTimeoutMs;
				noOutputTimer = setTimeout(() => {
					requestCancel("no-output-timeout");
				}, noOutputTimeoutMs);
			}
			adapter.onStdout((chunk) => {
				if (captureOutput) stdout = appendCapturedOutput(stdout, chunk, "stdout", maxCapturedOutputChars);
				input.onStdout?.(chunk);
				touchOutput();
			});
			adapter.onStderr((chunk) => {
				if (captureOutput) stderr = appendCapturedOutput(stderr, chunk, "stderr", maxCapturedOutputChars);
				input.onStderr?.(chunk);
				touchOutput();
			});
			const waitPromise = (async () => {
				const result = await adapter.wait();
				const deadlineReason = resolveElapsedTimeoutReason({
					nowMs: node_perf_hooks.performance.now(),
					overallTimeoutDeadlineMs,
					noOutputTimeoutDeadlineMs
				});
				const terminalReason = forcedReason ?? deadlineReason;
				if (settled) return {
					reason: terminalReason ?? "exit",
					exitCode: result.code,
					exitSignal: result.signal,
					durationMs: Date.now() - startedAtMs,
					stdout,
					stderr,
					timedOut: isTimeoutReason(terminalReason ?? "exit"),
					noOutputTimedOut: terminalReason === "no-output-timeout"
				};
				settled = true;
				clearTimers();
				adapter.dispose();
				active.delete(runId);
				const reason = terminalReason ?? (result.signal != null ? "signal" : "exit");
				const exit = {
					reason,
					exitCode: result.code,
					exitSignal: result.signal,
					durationMs: Date.now() - startedAtMs,
					stdout,
					stderr,
					timedOut: isTimeoutReason(terminalReason ?? reason),
					noOutputTimedOut: terminalReason === "no-output-timeout"
				};
				registry.finalize(runId, {
					reason: exit.reason,
					exitCode: exit.exitCode,
					exitSignal: exit.exitSignal
				});
				return exit;
			})().catch((err) => {
				if (!settled) {
					settled = true;
					clearTimers();
					active.delete(runId);
					adapter.dispose();
					registry.finalize(runId, {
						reason: "spawn-error",
						exitCode: null,
						exitSignal: null
					});
				}
				throw err;
			});
			const managedRun = {
				runId,
				pid: adapter.pid,
				startedAtMs,
				stdin: adapter.stdin,
				wait: async () => await waitPromise,
				cancel: (reason = "manual-cancel") => {
					requestCancel(reason);
				}
			};
			active.set(runId, {
				run: managedRun,
				scopeKey
			});
			return managedRun;
		} catch (err) {
			registry.finalize(runId, {
				reason: "spawn-error",
				exitCode: null,
				exitSignal: null
			});
			const { warnProcessSupervisorSpawnFailure } = await loadSupervisorLogRuntime();
			warnProcessSupervisorSpawnFailure(`spawn failed: runId=${runId} reason=${String(err)}`);
			throw err;
		}
	};
	return {
		spawn,
		cancel,
		cancelScope,
		getRecord: (runId) => registry.get(runId)
	};
}
//#endregion
//#region src/process/supervisor/index.ts
let singleton = null;
/** Return the process-wide supervisor used by runtime code that does not inject one. */
function getProcessSupervisor() {
	if (singleton) return singleton;
	singleton = createProcessSupervisor();
	return singleton;
}
//#endregion
//#region src/agents/bash-tools.exec-output.ts
/**
* Rendering helpers for exec output/status updates.
* Keeps no-output placeholders and warning placement consistent across exec
* progress, polling, and completion surfaces.
*/
const EXEC_NO_OUTPUT_PLACEHOLDER = "(no output)";
/** Render command output with a stable placeholder for empty output. */
function renderExecOutputText(value) {
	return value || EXEC_NO_OUTPUT_PLACEHOLDER;
}
/** Render the text shown in exec progress updates, including warnings first. */
function renderExecUpdateText(params) {
	return (params.warnings.length ? `${params.warnings.join("\n")}\n\n` : "") + renderExecOutputText(params.tailText);
}
//#endregion
//#region src/agents/pty-dsr.ts
const DSR_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[\\??6n`, "g");
/** Removes terminal device-status-report cursor requests and counts them. */
function stripDsrRequests(input) {
	let requests = 0;
	return {
		cleaned: input.replace(DSR_PATTERN, () => {
			requests += 1;
			return "";
		}),
		requests
	};
}
/** Builds a terminal cursor-position response for intercepted DSR requests. */
function buildCursorPositionResponse(row = 1, col = 1) {
	return `\x1b[${row};${col}R`;
}
//#endregion
//#region src/agents/shell-snapshot.ts
/**
* Login-shell environment snapshot capture.
*
* Caches safe shell-derived environment variables while filtering secrets and stale snapshots.
*/
const SNAPSHOT_VERSION = 1;
const SNAPSHOT_REFRESH_MS = 300 * 1e3;
const SNAPSHOT_MAX_AGE_MS = 4320 * 60 * 1e3;
const CAPTURE_MARKER = "__OPERATOR_SHELL_SNAPSHOT_CAPTURE__";
const ENV_MARKER = "__OPERATOR_SHELL_SNAPSHOT_ENV__";
const EXEC_SHELL_SNAPSHOT_ENV = "OPERATOR_EXEC_SHELL_SNAPSHOT";
const VALID_ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const SNAPSHOT_SHELLS = /* @__PURE__ */ new Set(["bash", "zsh"]);
const SNAPSHOT_DISABLE_VALUES = /* @__PURE__ */ new Set([
	"0",
	"false",
	"no",
	"off"
]);
const SAFE_ENV_NAMES = /* @__PURE__ */ new Set([
	"ASDF_DIR",
	"BUN_INSTALL",
	"CARGO_HOME",
	"CDPATH",
	"GOPATH",
	"GOROOT",
	"GOENV_ROOT",
	"HOMEBREW_CELLAR",
	"HOMEBREW_PREFIX",
	"HOMEBREW_REPOSITORY",
	"INFOPATH",
	"MANPATH",
	"NVM_DIR",
	"PATH",
	"PNPM_HOME",
	"PYENV_ROOT",
	"RBENV_ROOT",
	"RUSTUP_HOME",
	"VOLTA_HOME"
]);
const CAPTURE_ENV_NAMES = /* @__PURE__ */ new Set([
	...SAFE_ENV_NAMES,
	"HOME",
	"OPERATOR_SHELL",
	"SHELL",
	"USERPROFILE",
	"ZDOTDIR"
]);
const SECRET_ENV_PATTERN = /(secret|token|password|passwd|credential|cookie|session|auth|key)/i;
const SECRET_SHELL_STATE_PATTERNS = [
	/\b(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|passwd|credential)\b\s*[:=]/i,
	/\b[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL|API_KEY|ACCESS_KEY|SESSION)[A-Z0-9_]*\s*[:=]/,
	/\b(GITHUB_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_API_KEY|GEMINI_API_KEY)\b/,
	/\b(ghp_|github_pat_|sk-[A-Za-z0-9]|xox[baprs]-|ya29\.|AIza[0-9A-Za-z_-]|AKIA[0-9A-Z]{16})/,
	/-----BEGIN [A-Z ]*PRIVATE KEY-----/
];
const snapshotCache = /* @__PURE__ */ new Map();
let cleanupPromise = null;
async function maybeWrapCommandWithShellSnapshot(opts) {
	if (process.platform === "win32" || isExecShellSnapshotDisabled(process.env) || !isSupportedSnapshotShell(opts.shell, opts.shellArgs)) return opts.command;
	try {
		const snapshot = await getOrCreateShellSnapshot(opts);
		return snapshot ? buildSnapshotWrappedCommand(opts.command, snapshot.path, buildRuntimeEnvRestoreScript(opts.env)) : opts.command;
	} catch {
		return opts.command;
	}
}
function resolveShellSnapshotDir(env = process.env) {
	return node_path.default.join(require_paths.resolveStateDir(env), "cache", "shell-snapshots");
}
function isSupportedSnapshotShell(shell, shellArgs) {
	return shellArgs.includes("-c") && SNAPSHOT_SHELLS.has(node_path.default.basename(shell));
}
function isExecShellSnapshotDisabled(env) {
	const value = env[EXEC_SHELL_SNAPSHOT_ENV]?.trim().toLowerCase();
	return Boolean(value && SNAPSHOT_DISABLE_VALUES.has(value));
}
async function getOrCreateShellSnapshot(opts) {
	const key = buildSnapshotKey(opts);
	const cached = snapshotCache.get(key);
	const now = Date.now();
	if (cached && now - cached.createdAtMs < SNAPSHOT_REFRESH_MS) return await cached.promise;
	const created = createShellSnapshot(opts, key, { forceRefresh: Boolean(cached) });
	snapshotCache.set(key, {
		createdAtMs: now,
		promise: created
	});
	return await created;
}
function buildSnapshotKey(opts) {
	return (0, node_crypto.createHash)("sha256").update(JSON.stringify({
		version: SNAPSHOT_VERSION,
		shell: opts.shell,
		shellArgs: opts.shellArgs,
		cwd: node_path.default.resolve(opts.cwd),
		home: getTrustedShellHome(),
		stateDir: require_paths.resolveStateDir(process.env),
		env: buildSafeEnvSignature(process.env),
		startup: buildStartupSignature(opts.shell)
	})).digest("hex");
}
function buildSafeEnvSignature(env) {
	return [...SAFE_ENV_NAMES].toSorted().map((key) => [key, env[key] ?? null]);
}
function buildStartupSignature(shell) {
	const shellName = node_path.default.basename(shell);
	const home = getTrustedShellHome();
	const zdotdir = process.env.ZDOTDIR?.trim() || home;
	return (shellName === "zsh" ? [node_path.default.join(zdotdir, ".zshrc")] : shellName === "bash" ? [node_path.default.join(home, ".bashrc")] : []).map((candidate) => {
		try {
			const stat = (0, node_fs.statSync)(candidate);
			return [
				candidate,
				stat.mtimeMs,
				stat.size
			];
		} catch {
			return [candidate, null];
		}
	});
}
function getTrustedShellHome() {
	return process.env.HOME ?? process.env.USERPROFILE ?? node_os.default.homedir();
}
async function createShellSnapshot(opts, key, options) {
	const snapshotDir = resolveShellSnapshotDir(process.env);
	await node_fs_promises.default.mkdir(snapshotDir, {
		recursive: true,
		mode: 448
	});
	cleanupPromise ??= cleanupStaleSnapshots(snapshotDir);
	const snapshotPath = node_path.default.join(snapshotDir, `${key}.sh`);
	if (options?.forceRefresh !== true && await isFreshSnapshot(snapshotPath) && await validateSnapshot(opts, snapshotPath)) return { path: snapshotPath };
	const capture = await captureShellSnapshot(opts);
	if (!capture) return null;
	const tmpPath = node_path.default.join(snapshotDir, `${key}.${process.pid}.${Date.now()}.tmp`);
	await node_fs_promises.default.writeFile(tmpPath, capture, {
		encoding: "utf8",
		mode: 384
	});
	await node_fs_promises.default.chmod(tmpPath, 384);
	if (!await validateSnapshot(opts, tmpPath)) {
		await node_fs_promises.default.rm(tmpPath, { force: true });
		return null;
	}
	await node_fs_promises.default.rename(tmpPath, snapshotPath);
	await node_fs_promises.default.chmod(snapshotPath, 384);
	return { path: snapshotPath };
}
async function isFreshSnapshot(snapshotPath) {
	try {
		const stat = await node_fs_promises.default.stat(snapshotPath);
		return Date.now() - stat.mtimeMs < SNAPSHOT_REFRESH_MS;
	} catch {
		return false;
	}
}
async function validateSnapshot(opts, snapshotPath) {
	try {
		await node_fs_promises.default.access(snapshotPath);
	} catch {
		return false;
	}
	return (await runShell({
		shell: opts.shell,
		shellArgs: opts.shellArgs,
		cwd: opts.cwd,
		env: buildTrustedSnapshotCaptureEnv(opts.env),
		command: `. ${shQuote(snapshotPath)} >/dev/null 2>&1`,
		timeoutMs: 2e3
	})).status === 0;
}
async function captureShellSnapshot(opts) {
	const shellName = node_path.default.basename(opts.shell);
	const captureOutputDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-shell-snapshot-"));
	await node_fs_promises.default.chmod(captureOutputDir, 448);
	const captureOutputPath = node_path.default.join(captureOutputDir, "snapshot.out");
	await (await node_fs_promises.default.open(captureOutputPath, "wx", 384)).close();
	const captureCommand = [
		"{",
		buildStartupSourceScript(shellName),
		`printf '\\n%s\\n' ${shQuote(CAPTURE_MARKER)}`,
		buildAliasCaptureScript(shellName),
		"(typeset -f 2>/dev/null || declare -f 2>/dev/null || true)",
		`printf '\\n%s\\n' ${shQuote(ENV_MARKER)}`,
		`${shQuote(process.execPath)} -e ${shQuote(ENV_CAPTURE_NODE_SCRIPT)}`,
		`} > ${shQuote(captureOutputPath)}`
	].join("\n");
	try {
		if ((await runShell({
			shell: opts.shell,
			shellArgs: buildCaptureShellArgs(shellName, opts.shellArgs),
			cwd: opts.cwd,
			env: buildTrustedSnapshotCaptureEnv(opts.env),
			command: captureCommand,
			timeoutMs: 5e3
		})).status !== 0) return null;
		return buildSnapshotFile(await node_fs_promises.default.readFile(captureOutputPath, "utf8"));
	} finally {
		await node_fs_promises.default.rm(captureOutputDir, {
			force: true,
			recursive: true
		});
	}
}
function buildCaptureShellArgs(shellName, shellArgs) {
	if (shellName === "bash") return ["-i", "-c"];
	if (shellName === "zsh") return [
		"-f",
		"-i",
		"-c"
	];
	return shellArgs;
}
function buildSnapshotCaptureEnv(env) {
	return Object.fromEntries(Object.entries(env).filter(([key]) => CAPTURE_ENV_NAMES.has(key) && !SECRET_ENV_PATTERN.test(key)));
}
function buildTrustedSnapshotCaptureEnv(runtimeEnv) {
	const env = buildSnapshotCaptureEnv(process.env);
	if (runtimeEnv.OPERATOR_SHELL === "exec") env.OPERATOR_SHELL = "exec";
	return env;
}
function buildStartupSourceScript(shellName) {
	if (shellName === "zsh") return `if [ -r "\${ZDOTDIR:-$HOME}/.zshrc" ]; then . "\${ZDOTDIR:-$HOME}/.zshrc"; fi`;
	if (shellName === "bash") return ":";
	return ":";
}
function buildAliasCaptureScript(shellName) {
	return shellName === "zsh" ? "alias -L 2>/dev/null || true" : "alias 2>/dev/null || true";
}
const ENV_CAPTURE_NODE_SCRIPT = `
const safe = new Set(${JSON.stringify([...SAFE_ENV_NAMES].toSorted())});
const blocked = ${SECRET_ENV_PATTERN.toString()};
const out = {};
for (const [key, value] of Object.entries(process.env)) {
  if (!safe.has(key) || blocked.test(key)) continue;
  out[key] = value;
}
process.stdout.write(JSON.stringify(out));
`.trim();
function buildSnapshotFile(stdout) {
	const captureIndex = stdout.indexOf(CAPTURE_MARKER);
	const envIndex = stdout.indexOf(ENV_MARKER);
	if (captureIndex === -1 || envIndex === -1 || envIndex <= captureIndex) return null;
	const shellState = stdout.slice(captureIndex + 35, envIndex).trim().split(/\r?\n/).filter((line) => !line.includes(CAPTURE_MARKER) && !line.includes(ENV_MARKER)).join("\n");
	if (containsSecretLikeShellState(shellState)) return null;
	return [
		"# Operator exec shell snapshot. Generated; do not edit.",
		"if [ -n \"${BASH_VERSION:-}\" ]; then shopt -s expand_aliases 2>/dev/null || true; fi",
		"unalias -a 2>/dev/null || true",
		shellState,
		parseSafeEnvExports(stdout.slice(envIndex + 31).trim()),
		""
	].filter((part) => part.trim().length > 0).join("\n");
}
function containsSecretLikeShellState(shellState) {
	return SECRET_SHELL_STATE_PATTERNS.some((pattern) => pattern.test(shellState));
}
function parseSafeEnvExports(envJson) {
	let parsed;
	try {
		parsed = JSON.parse(envJson);
	} catch {
		return "";
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "";
	return Object.entries(parsed).filter((entry) => VALID_ENV_NAME.test(entry[0]) && SAFE_ENV_NAMES.has(entry[0]) && !SECRET_ENV_PATTERN.test(entry[0]) && typeof entry[1] === "string").toSorted(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `export ${key}=${shQuote(value)}`).join("\n");
}
function buildRuntimeEnvRestoreScript(env) {
	return [...SAFE_ENV_NAMES].toSorted().filter((key) => env[key] !== process.env[key] && !SECRET_ENV_PATTERN.test(key)).map((key) => typeof env[key] === "string" ? `export ${key}=${shQuote(env[key])}` : `unset ${key}`).join("\n");
}
function buildSnapshotWrappedCommand(command, snapshotPath, runtimeEnvRestoreScript) {
	return [
		`if [ -r ${shQuote(snapshotPath)} ]; then . ${shQuote(snapshotPath)}; fi`,
		runtimeEnvRestoreScript,
		`eval ${shQuote(command)}`
	].filter((part) => part.trim().length > 0).join("\n");
}
function shQuote(value) {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}
async function runShell(opts) {
	return await new Promise((resolve) => {
		const child = (0, node_child_process.spawn)(opts.shell, [...opts.shellArgs, opts.command], {
			cwd: opts.cwd,
			detached: process.platform !== "win32",
			env: opts.env,
			stdio: "ignore",
			windowsHide: true
		});
		let settled = false;
		const finish = (status) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			require_kill_tree.killProcessTree(child.pid ?? 0, { graceMs: 0 });
			resolve({ status });
		};
		const timeout = setTimeout(() => {
			require_kill_tree.killProcessTree(child.pid ?? 0, { graceMs: 250 });
			finish(null);
		}, opts.timeoutMs);
		child.on("error", () => {
			finish(null);
		});
		child.on("exit", (status) => {
			setTimeout(() => finish(status), 250);
		});
		child.on("close", (status) => {
			finish(status);
		});
	});
}
async function cleanupStaleSnapshots(snapshotDir) {
	const cutoff = Date.now() - SNAPSHOT_MAX_AGE_MS;
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(snapshotDir);
	} catch {
		return;
	}
	await Promise.all(entries.filter((entry) => entry.endsWith(".sh") || entry.endsWith(".tmp")).map(async (entry) => {
		const target = node_path.default.join(snapshotDir, entry);
		try {
			if ((await node_fs_promises.default.stat(target)).mtimeMs < cutoff) await node_fs_promises.default.rm(target, { force: true });
		} catch {}
	}));
}
//#endregion
//#region src/agents/bash-tools.exec-runtime.ts
/**
* Bash exec runtime.
* Spawns host/sandbox processes, manages session updates/backgrounding,
* approval messaging constants, environment safety, and exit outcome shaping.
*/
const SMKX = "\x1B[?1h";
const RMKX = "\x1B[?1l";
function resolveExecTimeoutMs(timeoutSec) {
	if (typeof timeoutSec !== "number" || !Number.isFinite(timeoutSec) || timeoutSec <= 0) return;
	return require_timeouts.resolveSafeTimeoutDelayMs(timeoutSec * 1e3);
}
/**
* Detect cursor key mode from PTY output chunk.
* Uses lastIndexOf to find the *last* toggle in the chunk.
* Returns "application" if smkx is the last toggle, "normal" if rmkx is last,
* or null if no toggle is found.
*/
function detectCursorKeyMode(raw) {
	const lastSmkx = raw.lastIndexOf(SMKX);
	const lastRmkx = raw.lastIndexOf(RMKX);
	if (lastSmkx === -1 && lastRmkx === -1) return null;
	return lastSmkx > lastRmkx ? "application" : "normal";
}
/** Default retained aggregate output cap for exec sessions. */
const DEFAULT_MAX_OUTPUT = require_bash_tools_shared.clampWithDefault(require_bash_tools_shared.readEnvInt("OPERATOR_BASH_MAX_OUTPUT_CHARS", "PI_BASH_MAX_OUTPUT_CHARS"), 2e5, 1e3, 2e5);
/** Default pending output cap for poll/update buffers. */
const DEFAULT_PENDING_MAX_OUTPUT = require_bash_tools_shared.clampWithDefault(require_bash_tools_shared.readEnvInt("OPERATOR_BASH_PENDING_MAX_OUTPUT_CHARS"), 3e4, 1e3, 2e5);
/** Fallback PATH used when the process environment has no PATH. */
const DEFAULT_PATH = process.env.PATH ?? "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";
const DEFAULT_NOTIFY_SNIPPET_CHARS = 180;
/** Default time an approval can remain pending. */
const DEFAULT_APPROVAL_TIMEOUT_MS = require_exec_approvals.DEFAULT_EXEC_APPROVAL_TIMEOUT_MS;
/** Gateway request timeout for approval registration/wait calls. */
const DEFAULT_APPROVAL_REQUEST_TIMEOUT_MS = DEFAULT_APPROVAL_TIMEOUT_MS + 1e4;
const DEFAULT_APPROVAL_RUNNING_NOTICE_MS = 1e4;
const APPROVAL_SLUG_LENGTH = 8;
function normalizeExecExitSignal(signal) {
	if (signal === null) return;
	return String(signal);
}
function emitExecProcessCompleted(params) {
	const exitSignal = normalizeExecExitSignal(params.outcome.exitSignal);
	require_diagnostic_events.emitDiagnosticEvent({
		type: "exec.process.completed",
		target: params.target,
		mode: params.mode,
		outcome: params.outcome.status,
		durationMs: params.outcome.durationMs,
		commandLength: params.command.length,
		...params.sessionKey?.trim() ? { sessionKey: params.sessionKey.trim() } : {},
		...typeof params.outcome.exitCode === "number" ? { exitCode: params.outcome.exitCode } : {},
		...exitSignal ? { exitSignal } : {},
		...params.outcome.status === "failed" ? {
			timedOut: params.outcome.timedOut,
			failureKind: params.outcome.failureKind
		} : {}
	});
}
/** Renders a host label for user-facing exec policy messages. */
function renderExecHostLabel(host) {
	return host === "sandbox" ? "sandbox" : host === "gateway" ? "gateway" : "node";
}
/** Renders an exec target label, preserving `auto`. */
function renderExecTargetLabel(target) {
	return target === "auto" ? "auto" : renderExecHostLabel(target);
}
/** Returns true when a per-call target override is allowed by configured policy. */
function isRequestedExecTargetAllowed(params) {
	if (params.requestedTarget === params.configuredTarget) return true;
	if (params.configuredTarget === "auto") {
		if (params.sandboxAvailable && (params.requestedTarget === "gateway" || params.requestedTarget === "node")) return false;
		return true;
	}
	return false;
}
/** Resolves configured/requested/elevated exec target into an effective host. */
function resolveExecTarget(params) {
	const configuredTarget = params.configuredTarget ?? "auto";
	const requestedTarget = params.requestedTarget ?? null;
	if (requestedTarget && !isRequestedExecTargetAllowed({
		configuredTarget,
		requestedTarget,
		sandboxAvailable: params.sandboxAvailable
	})) {
		const allowedConfig = Array.from(new Set(configuredTarget === "auto" && params.sandboxAvailable && (requestedTarget === "gateway" || requestedTarget === "node") ? [renderExecTargetLabel(requestedTarget)] : requestedTarget === "gateway" && !params.sandboxAvailable ? ["gateway", "auto"] : [renderExecTargetLabel(requestedTarget), "auto"])).join(" or ");
		throw new Error(`exec host not allowed (requested ${renderExecTargetLabel(requestedTarget)}; configured host is ${renderExecTargetLabel(configuredTarget)}; set tools.exec.host=${allowedConfig} to allow this override).`);
	}
	const selectedTarget = requestedTarget ?? configuredTarget;
	const resolvedTarget = params.elevatedRequested ? selectedTarget === "node" ? "node" : "gateway" : selectedTarget;
	return {
		configuredTarget,
		requestedTarget,
		selectedTarget: resolvedTarget,
		effectiveHost: resolvedTarget === "auto" ? params.sandboxAvailable ? "sandbox" : "gateway" : resolvedTarget
	};
}
/** Normalizes notification snippets to a compact single-line form. */
function normalizeNotifyOutput(value) {
	return value.replace(/\s+/g, " ").trim();
}
function compactNotifyOutput(value, maxChars = DEFAULT_NOTIFY_SNIPPET_CHARS) {
	const normalized = normalizeNotifyOutput(value);
	if (!normalized) return "";
	if (normalized.length <= maxChars) return normalized;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, Math.max(1, maxChars - 1))}…`;
}
/** Merges shell-discovered PATH entries into an exec environment. */
function applyShellPath(env, shellPath) {
	if (!shellPath) return;
	const entries = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(shellPath.split(node_path.default.delimiter));
	if (entries.length === 0) return;
	const pathKey = require_path_prepend.findPathKey(env);
	const merged = require_path_prepend.mergePathPrepend(env[pathKey], entries);
	if (merged) env[pathKey] = merged;
}
function maybeNotifyOnExit(session, status) {
	if (!session.backgrounded || !session.notifyOnExit || session.exitNotified) return;
	const sessionKey = session.sessionKey?.trim();
	if (!sessionKey) return;
	session.exitNotified = true;
	const exitLabel = session.exitSignal ? `signal ${session.exitSignal}` : `code ${session.exitCode ?? 0}`;
	const output = compactNotifyOutput(require_bash_process_registry.tail(session.tail || session.aggregated || "", 400));
	if (status === "failed" && session.exitReason === "manual-cancel" && !output) return;
	if (status === "completed" && !output && session.notifyOnExitEmptySuccess !== true) return;
	const summary = output ? `Exec ${status} (${session.id.slice(0, 8)}, ${exitLabel}) :: ${output}` : `Exec ${status} (${session.id.slice(0, 8)}, ${exitLabel})`;
	const eventRouting = session.eventRouting ?? {
		mainKey: session.mainKey,
		sessionScope: session.sessionScope
	};
	require_system_events.enqueueSystemEvent(summary, {
		sessionKey: require_event_session_routing.resolveEventSessionKeyForPolicy(sessionKey, eventRouting),
		deliveryContext: session.notifyDeliveryContext
	});
	if (!require_session_key.isSubagentSessionKey(sessionKey)) require_heartbeat_wake.requestHeartbeat(require_event_session_routing.scopedHeartbeatWakeOptionsForPolicy(sessionKey, {
		source: "exec-event",
		intent: "event",
		reason: "exec-event",
		coalesceMs: 0
	}, eventRouting));
}
/** Creates the short approval id shown in `/approve` prompts. */
function createApprovalSlug(id) {
	return id.slice(0, APPROVAL_SLUG_LENGTH);
}
/** Builds the user-facing approval-pending message for foreground exec. */
function buildApprovalPendingMessage(params) {
	const commandBlock = require_markdown_code.formatFencedCodeBlock(params.command, "sh");
	const lines = [];
	const allowedDecisions = params.allowedDecisions ?? require_exec_approvals.resolveExecApprovalAllowedDecisions();
	const decisionText = allowedDecisions.join("|");
	const warningText = params.warningText?.trim();
	if (warningText) lines.push(warningText, "");
	lines.push(`Approval required (id ${params.approvalSlug}, full ${params.approvalId}).`);
	lines.push(`Host: ${params.host}`);
	if (params.nodeId) lines.push(`Node: ${params.nodeId}`);
	lines.push(`CWD: ${params.cwd ?? "(node default)"}`);
	lines.push("Command:");
	lines.push(commandBlock);
	lines.push("Mode: foreground (interactive approvals available).");
	lines.push(allowedDecisions.includes("allow-always") ? "Background mode requires pre-approved policy (allow-always or ask=off)." : "Background mode requires an effective policy that allows pre-approval (for example ask=off).");
	lines.push(`Reply with: /approve ${params.approvalSlug} ${decisionText}`);
	if (!allowedDecisions.includes("allow-always")) lines.push("Allow Always is unavailable for this command.");
	lines.push("If the short code is ambiguous, use the full id in /approve.");
	return lines.join("\n");
}
/** Normalizes the delay before showing a running approval notice. */
function resolveApprovalRunningNoticeMs(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_APPROVAL_RUNNING_NOTICE_MS;
	if (value <= 0) return 0;
	return Math.floor(value);
}
function joinExecFailureOutput(aggregated, reason) {
	return aggregated ? `${aggregated}\n\n${reason}` : reason;
}
function classifyExecFailureKind(params) {
	if (params.isShellFailure) return params.exitCode === 127 ? "shell-command-not-found" : "shell-not-executable";
	if (params.exitReason === "overall-timeout") return "overall-timeout";
	if (params.exitReason === "no-output-timeout") return "no-output-timeout";
	if (params.exitSignal != null) return "signal";
	return "aborted";
}
/** Formats a user-facing reason for a failed exec process exit. */
function formatExecFailureReason(params) {
	switch (params.failureKind) {
		case "shell-command-not-found": return "Command not found";
		case "shell-not-executable": return "Command not executable (permission denied)";
		case "overall-timeout": return typeof params.timeoutSec === "number" && params.timeoutSec > 0 ? `Command timed out after ${params.timeoutSec} seconds. If this command is expected to take longer, re-run with a higher timeout (e.g., exec timeout=300). If it should keep running, start it with exec background=true or yieldMs so Operator can register a pollable process session. Do not rely on shell backgrounding with a trailing &.` : "Command timed out. If this command is expected to take longer, re-run with a higher timeout (e.g., exec timeout=300). If it should keep running, start it with exec background=true or yieldMs so Operator can register a pollable process session. Do not rely on shell backgrounding with a trailing &.";
		case "no-output-timeout": return "Command timed out waiting for output";
		case "signal": return `Command aborted by signal ${params.exitSignal}`;
		case "aborted": return "Command aborted before exit code was captured";
	}
	throw new Error("Unsupported exec failure kind");
}
/** Converts a supervisor exit record into a normalized exec process outcome. */
function buildExecExitOutcome(params) {
	const exitCode = params.exit.exitCode ?? 0;
	const isNormalExit = params.exit.reason === "exit";
	const isShellFailure = exitCode === 126 || exitCode === 127;
	if ((isNormalExit && !isShellFailure ? "completed" : "failed") === "completed") {
		const exitMsg = exitCode !== 0 ? `\n\n(Command exited with code ${exitCode})` : "";
		return {
			status: "completed",
			exitCode,
			exitSignal: params.exit.exitSignal,
			exitReason: params.exit.reason,
			durationMs: params.durationMs,
			aggregated: params.aggregated + exitMsg,
			timedOut: false,
			noOutputTimedOut: params.exit.noOutputTimedOut
		};
	}
	const failureKind = classifyExecFailureKind({
		exitReason: params.exit.reason,
		exitCode,
		isShellFailure,
		exitSignal: params.exit.exitSignal
	});
	const reason = formatExecFailureReason({
		failureKind,
		exitSignal: params.exit.exitSignal,
		timeoutSec: params.timeoutSec
	});
	return {
		status: "failed",
		exitCode: params.exit.exitCode,
		exitSignal: params.exit.exitSignal,
		exitReason: params.exit.reason,
		durationMs: params.durationMs,
		aggregated: params.aggregated,
		timedOut: params.exit.timedOut,
		noOutputTimedOut: params.exit.noOutputTimedOut,
		failureKind,
		reason: joinExecFailureOutput(params.aggregated, reason)
	};
}
/** Converts spawn/runtime errors into a normalized failed exec outcome. */
function buildExecRuntimeErrorOutcome(params) {
	return {
		status: "failed",
		exitCode: null,
		exitSignal: null,
		durationMs: params.durationMs,
		aggregated: params.aggregated,
		timedOut: false,
		failureKind: "runtime-error",
		reason: joinExecFailureOutput(params.aggregated, String(params.error))
	};
}
/**
* Apply PATH prepends inside the shell command.
* This ensures our paths take precedence even if user RC files (e.g. ~/.zshenv)
* prepend their own entries to PATH during shell startup.
*/
function wrapPosixCommandWithPathPrepend(command, env, pathPrepend) {
	if (process.platform === "win32") return command;
	if (!pathPrepend || pathPrepend.length === 0) return command;
	const pathKey = require_path_prepend.findPathKey(env);
	const currentPath = env[pathKey];
	if (currentPath) {
		const newPath = require_path_prepend.removePathPrepend(currentPath, pathPrepend);
		if (newPath !== void 0) env[pathKey] = newPath;
	}
	env.OPERATOR_PREPEND_PATH = pathPrepend.join(node_path.default.delimiter);
	return `export PATH="\${OPERATOR_PREPEND_PATH}\${PATH:+:$PATH}"; unset OPERATOR_PREPEND_PATH; ${command}`;
}
/** Starts a host or sandbox exec process and registers it for polling/backgrounding. */
async function runExecProcess(opts) {
	const startedAt = Date.now();
	const sessionId = require_bash_process_registry.createSessionSlug();
	const execCommand = opts.execCommand ?? opts.command;
	const diagnosticTarget = opts.sandbox ? "sandbox" : "host";
	const supervisor = getProcessSupervisor();
	const shellRuntimeEnv = {
		...opts.env,
		OPERATOR_SHELL: "exec"
	};
	const session = {
		id: sessionId,
		command: opts.command,
		scopeKey: opts.scopeKey,
		sessionKey: opts.sessionKey,
		mainKey: opts.mainKey,
		sessionScope: opts.sessionScope,
		eventRouting: opts.eventRouting,
		notifyDeliveryContext: require_delivery_context_shared.normalizeDeliveryContext(opts.notifyDeliveryContext),
		notifyOnExit: opts.notifyOnExit,
		notifyOnExitEmptySuccess: opts.notifyOnExitEmptySuccess === true,
		exitNotified: false,
		child: void 0,
		stdin: void 0,
		pid: void 0,
		startedAt,
		cwd: opts.workdir,
		maxOutputChars: opts.maxOutput,
		pendingMaxOutputChars: opts.pendingMaxOutput,
		totalOutputChars: 0,
		pendingStdout: [],
		pendingStderr: [],
		pendingStdoutChars: 0,
		pendingStderrChars: 0,
		aggregated: "",
		tail: "",
		exited: false,
		exitCode: void 0,
		exitSignal: void 0,
		truncated: false,
		backgrounded: false,
		cursorKeyMode: opts.usePty ? "unknown" : "normal"
	};
	require_bash_process_registry.addSession(session);
	let updatesDisabled = false;
	const emitUpdate = () => {
		if (!opts.onUpdate) return;
		if (session.backgrounded || session.exited || updatesDisabled) return;
		const tailText = session.tail || session.aggregated;
		opts.onUpdate({
			content: [{
				type: "text",
				text: renderExecUpdateText({
					tailText,
					warnings: opts.warnings
				})
			}],
			details: {
				status: "running",
				sessionId,
				pid: session.pid ?? void 0,
				startedAt,
				cwd: session.cwd,
				tail: session.tail
			}
		});
	};
	const handleStdout = (data) => {
		const raw = data;
		const mode = detectCursorKeyMode(raw);
		if (mode) session.cursorKeyMode = mode;
		const str = require_shell_utils.sanitizeBinaryOutput(raw);
		for (const chunk of require_bash_tools_shared.chunkString(str)) {
			require_bash_process_registry.appendOutput(session, "stdout", chunk);
			emitUpdate();
		}
	};
	const handleStderr = (data) => {
		const str = require_shell_utils.sanitizeBinaryOutput(data);
		for (const chunk of require_bash_tools_shared.chunkString(str)) {
			require_bash_process_registry.appendOutput(session, "stderr", chunk);
			emitUpdate();
		}
	};
	const timeoutMs = resolveExecTimeoutMs(opts.timeoutSec);
	let sandboxFinalizeToken;
	let sandboxFinalized = false;
	const finalizeSandboxExec = async (params) => {
		if (sandboxFinalized || !opts.sandbox?.finalizeExec) return;
		sandboxFinalized = true;
		await opts.sandbox.finalizeExec({
			...params,
			token: sandboxFinalizeToken
		});
	};
	const finalizeAndSettleSession = async (outcome) => {
		let finalOutcome = outcome;
		session.finalizing = true;
		try {
			await finalizeSandboxExec({
				status: outcome.status,
				exitCode: outcome.exitCode,
				timedOut: outcome.timedOut
			});
		} catch (error) {
			if (outcome.status === "completed") finalOutcome = buildExecRuntimeErrorOutcome({
				error,
				aggregated: session.aggregated.trim(),
				durationMs: Date.now() - startedAt
			});
			else require_logger.logWarn(`exec: sandbox finalize after process failure failed (${String(error)}).`);
		} finally {
			session.finalizing = false;
			if (!session.exited) {
				require_bash_process_registry.markExited(session, finalOutcome.exitCode, finalOutcome.exitSignal, finalOutcome.status, finalOutcome.exitReason, finalOutcome.noOutputTimedOut);
				maybeNotifyOnExit(session, finalOutcome.status);
			}
		}
		return finalOutcome;
	};
	const spawnSpec = await (async () => {
		if (opts.sandbox) {
			const backendExecSpec = await opts.sandbox.buildExecSpec?.({
				command: execCommand,
				workdir: opts.containerWorkdir ?? opts.sandbox.containerWorkdir,
				env: shellRuntimeEnv,
				usePty: opts.usePty
			});
			sandboxFinalizeToken = backendExecSpec?.finalizeToken;
			return {
				mode: "child",
				argv: backendExecSpec?.argv ?? ["docker", ...require_bash_tools_shared.buildDockerExecArgs({
					containerName: opts.sandbox.containerName,
					command: execCommand,
					workdir: opts.containerWorkdir ?? opts.sandbox.containerWorkdir,
					env: shellRuntimeEnv,
					tty: opts.usePty
				})],
				env: backendExecSpec?.env ?? process.env,
				stdinMode: backendExecSpec?.stdinMode ?? (opts.usePty ? "pipe-open" : "pipe-closed")
			};
		}
		const { shell, args: shellArgs } = require_shell_utils.getShellConfig();
		const commandWithShellSnapshot = await maybeWrapCommandWithShellSnapshot({
			command: wrapPosixCommandWithPathPrepend(execCommand, shellRuntimeEnv, opts.pathPrepend),
			shell,
			shellArgs,
			cwd: opts.workdir,
			env: shellRuntimeEnv
		});
		const childArgv = [
			shell,
			...shellArgs,
			commandWithShellSnapshot
		];
		if (opts.usePty) return {
			mode: "pty",
			ptyCommand: commandWithShellSnapshot,
			childFallbackArgv: childArgv,
			env: shellRuntimeEnv,
			stdinMode: "pipe-open"
		};
		return {
			mode: "child",
			argv: childArgv,
			env: shellRuntimeEnv,
			stdinMode: "pipe-closed"
		};
	})();
	let managedRun = null;
	let usingPty = spawnSpec.mode === "pty";
	const cursorResponse = buildCursorPositionResponse();
	const onSupervisorStdout = (chunk) => {
		if (usingPty) {
			const { cleaned, requests } = stripDsrRequests(chunk);
			if (requests > 0 && managedRun?.stdin) for (let i = 0; i < requests; i += 1) managedRun.stdin.write(cursorResponse);
			handleStdout(cleaned);
			return;
		}
		handleStdout(chunk);
	};
	try {
		const spawnBase = {
			runId: sessionId,
			sessionId: opts.sessionKey?.trim() || sessionId,
			backendId: opts.sandbox ? "exec-sandbox" : "exec-host",
			scopeKey: opts.scopeKey,
			cwd: opts.workdir,
			env: spawnSpec.env,
			timeoutMs,
			captureOutput: false,
			onStdout: onSupervisorStdout,
			onStderr: handleStderr
		};
		managedRun = spawnSpec.mode === "pty" ? await supervisor.spawn({
			...spawnBase,
			mode: "pty",
			ptyCommand: spawnSpec.ptyCommand
		}) : await supervisor.spawn({
			...spawnBase,
			mode: "child",
			argv: spawnSpec.argv,
			stdinMode: spawnSpec.stdinMode
		});
	} catch (err) {
		if (spawnSpec.mode === "pty") {
			const warning = `Warning: PTY spawn failed (${String(err)}); retrying without PTY for \`${opts.command}\`.`;
			require_logger.logWarn(`exec: PTY spawn failed (${String(err)}); retrying without PTY for "${opts.command}".`);
			opts.warnings.push(warning);
			usingPty = false;
			try {
				managedRun = await supervisor.spawn({
					runId: sessionId,
					sessionId: opts.sessionKey?.trim() || sessionId,
					backendId: "exec-host",
					scopeKey: opts.scopeKey,
					mode: "child",
					argv: spawnSpec.childFallbackArgv,
					cwd: opts.workdir,
					env: spawnSpec.env,
					stdinMode: "pipe-open",
					timeoutMs,
					captureOutput: false,
					onStdout: handleStdout,
					onStderr: handleStderr
				});
			} catch (retryErr) {
				require_bash_process_registry.markExited(session, null, null, "failed");
				maybeNotifyOnExit(session, "failed");
				await finalizeSandboxExec({
					status: "failed",
					exitCode: null,
					timedOut: false
				}).catch((finalizeErr) => {
					require_logger.logWarn(`exec: sandbox finalize after spawn failure failed (${String(finalizeErr)}).`);
				});
				emitExecProcessCompleted({
					command: opts.command,
					mode: "child",
					outcome: buildExecRuntimeErrorOutcome({
						error: retryErr,
						aggregated: session.aggregated.trim(),
						durationMs: Date.now() - startedAt
					}),
					sessionKey: opts.sessionKey,
					target: diagnosticTarget
				});
				throw retryErr;
			}
		} else {
			require_bash_process_registry.markExited(session, null, null, "failed");
			maybeNotifyOnExit(session, "failed");
			await finalizeSandboxExec({
				status: "failed",
				exitCode: null,
				timedOut: false
			}).catch((finalizeErr) => {
				require_logger.logWarn(`exec: sandbox finalize after spawn failure failed (${String(finalizeErr)}).`);
			});
			emitExecProcessCompleted({
				command: opts.command,
				mode: spawnSpec.mode,
				outcome: buildExecRuntimeErrorOutcome({
					error: err,
					aggregated: session.aggregated.trim(),
					durationMs: Date.now() - startedAt
				}),
				sessionKey: opts.sessionKey,
				target: diagnosticTarget
			});
			throw err;
		}
	}
	session.stdin = managedRun.stdin;
	session.pid = managedRun.pid;
	const promise = managedRun.wait().then(async (exit) => {
		updatesDisabled = true;
		const durationMs = Date.now() - startedAt;
		const outcome = buildExecExitOutcome({
			exit,
			aggregated: session.aggregated.trim(),
			durationMs,
			timeoutSec: opts.timeoutSec
		});
		const finalOutcome = await finalizeAndSettleSession(outcome);
		emitExecProcessCompleted({
			command: opts.command,
			mode: usingPty ? "pty" : "child",
			outcome: finalOutcome,
			sessionKey: opts.sessionKey,
			target: diagnosticTarget
		});
		return finalOutcome;
	}).catch(async (err) => {
		updatesDisabled = true;
		const outcome = buildExecRuntimeErrorOutcome({
			error: err,
			aggregated: session.aggregated.trim(),
			durationMs: Date.now() - startedAt
		});
		const finalOutcome = await finalizeAndSettleSession(outcome);
		emitExecProcessCompleted({
			command: opts.command,
			mode: usingPty ? "pty" : "child",
			outcome: finalOutcome,
			sessionKey: opts.sessionKey,
			target: diagnosticTarget
		});
		return finalOutcome;
	});
	return {
		session,
		startedAt,
		pid: session.pid ?? void 0,
		promise,
		kill: () => {
			managedRun?.cancel("manual-cancel");
		},
		disableUpdates: () => {
			updatesDisabled = true;
		}
	};
}
//#endregion
Object.defineProperty(exports, "DEFAULT_APPROVAL_REQUEST_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return DEFAULT_APPROVAL_REQUEST_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "DEFAULT_APPROVAL_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return DEFAULT_APPROVAL_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "DEFAULT_MAX_OUTPUT", {
	enumerable: true,
	get: function() {
		return DEFAULT_MAX_OUTPUT;
	}
});
Object.defineProperty(exports, "DEFAULT_PATH", {
	enumerable: true,
	get: function() {
		return DEFAULT_PATH;
	}
});
Object.defineProperty(exports, "DEFAULT_PENDING_MAX_OUTPUT", {
	enumerable: true,
	get: function() {
		return DEFAULT_PENDING_MAX_OUTPUT;
	}
});
Object.defineProperty(exports, "applyShellPath", {
	enumerable: true,
	get: function() {
		return applyShellPath;
	}
});
Object.defineProperty(exports, "buildApprovalPendingMessage", {
	enumerable: true,
	get: function() {
		return buildApprovalPendingMessage;
	}
});
Object.defineProperty(exports, "buildExecRuntimeErrorOutcome", {
	enumerable: true,
	get: function() {
		return buildExecRuntimeErrorOutcome;
	}
});
Object.defineProperty(exports, "createApprovalSlug", {
	enumerable: true,
	get: function() {
		return createApprovalSlug;
	}
});
Object.defineProperty(exports, "getProcessSupervisor", {
	enumerable: true,
	get: function() {
		return getProcessSupervisor;
	}
});
Object.defineProperty(exports, "isRequestedExecTargetAllowed", {
	enumerable: true,
	get: function() {
		return isRequestedExecTargetAllowed;
	}
});
Object.defineProperty(exports, "normalizeNotifyOutput", {
	enumerable: true,
	get: function() {
		return normalizeNotifyOutput;
	}
});
Object.defineProperty(exports, "renderExecOutputText", {
	enumerable: true,
	get: function() {
		return renderExecOutputText;
	}
});
Object.defineProperty(exports, "renderExecTargetLabel", {
	enumerable: true,
	get: function() {
		return renderExecTargetLabel;
	}
});
Object.defineProperty(exports, "renderExecUpdateText", {
	enumerable: true,
	get: function() {
		return renderExecUpdateText;
	}
});
Object.defineProperty(exports, "resolveApprovalRunningNoticeMs", {
	enumerable: true,
	get: function() {
		return resolveApprovalRunningNoticeMs;
	}
});
Object.defineProperty(exports, "resolveExecTarget", {
	enumerable: true,
	get: function() {
		return resolveExecTarget;
	}
});
Object.defineProperty(exports, "runExecProcess", {
	enumerable: true,
	get: function() {
		return runExecProcess;
	}
});
