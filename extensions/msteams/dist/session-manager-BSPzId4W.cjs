const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_utf8_truncate = require("./utf8-truncate-CThlmb6d.cjs");
const require_windows_command = require("./windows-command-C8d7D1FM.cjs");
const require_kill_tree = require("./kill-tree-BxZeSfim.cjs");
const require_terminal_upload_constants = require("./terminal-upload-constants-BNmT6J2I.cjs");
const require_output_ring = require("./output-ring-CcdBFajR.cjs");
const require_gateway_transport = require("./gateway-transport-CBwYxhJI.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
let node_fs_promises = require("node:fs/promises");
let node_crypto = require("node:crypto");
//#region src/infra/terminal-file-upload.ts
const TERMINAL_UPLOAD_PREFIX = "operator-terminal-upload-";
const TERMINAL_UPLOAD_RETENTION_MS = 1440 * 60 * 1e3;
const TERMINAL_UPLOAD_CLEANUP_RETRY_MS = 3600 * 1e3;
const MAX_STAGED_NAME_BYTES = 180;
const PORTABLE_NAME_FORBIDDEN = /* @__PURE__ */ new Set([
	"<",
	">",
	":",
	"\"",
	"/",
	"\\",
	"|",
	"?",
	"*",
	"%",
	"!"
]);
const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/iu;
const cleanupTimers = /* @__PURE__ */ new Map();
const cleanupRecoveryTimers = /* @__PURE__ */ new Map();
let defaultCleanupPromise;
/** Windows temp variables can point at a shared directory; inherit the user's profile ACL instead. */
function resolveTerminalUploadRoot(options) {
	return (options?.platform ?? process.platform) === "win32" ? node_path.default.join(options?.homeDir ?? (0, node_os.homedir)(), ".operator", "tmp") : options?.tempDir ?? (0, node_os.tmpdir)();
}
function truncateUtf8(value, maxBytes) {
	let result = "";
	let bytes = 0;
	for (const character of value) {
		const nextBytes = Buffer.byteLength(character, "utf8");
		if (bytes + nextBytes > maxBytes) break;
		result += character;
		bytes += nextBytes;
	}
	return result;
}
function sanitizeTerminalUploadName(name) {
	const basename = node_path.default.posix.basename(name.replaceAll("\\", "/"));
	const cleaned = Array.from(basename, (char) => {
		const codePoint = char.codePointAt(0) ?? 0;
		return codePoint <= 31 || codePoint === 127 || PORTABLE_NAME_FORBIDDEN.has(char) ? "_" : char;
	}).join("").trim().replace(/[. ]+$/u, "");
	const portable = WINDOWS_RESERVED_NAME.test(cleaned) ? `_${cleaned}` : cleaned;
	return truncateUtf8(portable && portable !== "." && portable !== ".." ? portable : "upload", MAX_STAGED_NAME_BYTES) || "upload";
}
function decodeTerminalUpload(contentBase64) {
	if (contentBase64.length > require_terminal_upload_constants.MAX_TERMINAL_UPLOAD_BASE64_LENGTH || require_terminal_upload_constants.terminalUploadDecodedSize(contentBase64) > 16777216) throw new Error(`terminal upload exceeds ${require_terminal_upload_constants.MAX_TERMINAL_UPLOAD_BYTES} bytes`);
	if (!require_terminal_upload_constants.isCanonicalTerminalUploadBase64(contentBase64)) throw new Error("invalid terminal upload encoding");
	const bytes = Buffer.from(contentBase64, "base64");
	if (bytes.length > 16777216) throw new Error(`terminal upload exceeds ${require_terminal_upload_constants.MAX_TERMINAL_UPLOAD_BYTES} bytes`);
	if (bytes.toString("base64") !== contentBase64) throw new Error("invalid terminal upload encoding");
	return bytes;
}
async function removeTerminalUploadDirectory(directory) {
	try {
		await (0, node_fs_promises.rm)(directory, {
			recursive: true,
			force: true
		});
	} catch (error) {
		require_logger.logWarn(`terminal-upload: cleanup failed; retrying: ${String(error)}`);
		scheduleTerminalUploadCleanup(directory, TERMINAL_UPLOAD_CLEANUP_RETRY_MS);
	}
}
function scheduleTerminalUploadCleanup(directory, afterMs) {
	if (cleanupTimers.has(directory)) return;
	const timer = setTimeout(() => {
		cleanupTimers.delete(directory);
		removeTerminalUploadDirectory(directory);
	}, Math.max(0, afterMs));
	cleanupTimers.set(directory, timer);
	timer.unref?.();
}
/** Restores cleanup timers for staged uploads left by a previous process. */
async function recoverTerminalUploadCleanup(options) {
	const tempRoot = options?.tempRoot ?? resolveTerminalUploadRoot();
	const retentionMs = options?.retentionMs ?? TERMINAL_UPLOAD_RETENTION_MS;
	const nowMs = options?.nowMs ?? Date.now();
	let entries;
	try {
		entries = await (0, node_fs_promises.readdir)(tempRoot, { withFileTypes: true });
	} catch (error) {
		if (error.code !== "ENOENT") {
			require_logger.logWarn(`terminal-upload: recovery scan failed: ${String(error)}`);
			throw error;
		}
		return;
	}
	await Promise.all(entries.filter((entry) => entry.isDirectory() && entry.name.startsWith(TERMINAL_UPLOAD_PREFIX)).map(async (entry) => {
		const directory = node_path.default.join(tempRoot, entry.name);
		try {
			const stats = await (0, node_fs_promises.lstat)(directory);
			if (!stats.isDirectory()) return;
			if (typeof process.getuid === "function" && stats.uid !== process.getuid()) return;
			const remainingMs = retentionMs - Math.max(0, nowMs - stats.mtimeMs);
			if (remainingMs <= 0) await removeTerminalUploadDirectory(directory);
			else scheduleTerminalUploadCleanup(directory, remainingMs);
		} catch (error) {
			if (error.code !== "ENOENT") {
				require_logger.logWarn(`terminal-upload: recovery failed: ${String(error)}`);
				throw error;
			}
		}
	}));
}
function cleanupRecoveryRoot(options) {
	return options?.tempRoot ?? resolveTerminalUploadRoot();
}
function clearTerminalUploadCleanupRetry(tempRoot) {
	const timer = cleanupRecoveryTimers.get(tempRoot);
	if (!timer) return;
	clearTimeout(timer);
	cleanupRecoveryTimers.delete(tempRoot);
}
function scheduleTerminalUploadCleanupRetry(options) {
	const tempRoot = cleanupRecoveryRoot(options);
	if (cleanupRecoveryTimers.has(tempRoot)) return;
	const timer = setTimeout(() => {
		cleanupRecoveryTimers.delete(tempRoot);
		ensureTerminalUploadCleanup(options ? {
			tempRoot,
			retentionMs: options.retentionMs
		} : void 0);
	}, TERMINAL_UPLOAD_CLEANUP_RETRY_MS);
	cleanupRecoveryTimers.set(tempRoot, timer);
	timer.unref?.();
}
async function runTerminalUploadCleanupRecovery(options) {
	const tempRoot = cleanupRecoveryRoot(options);
	try {
		await recoverTerminalUploadCleanup(options);
		clearTerminalUploadCleanupRetry(tempRoot);
	} catch {
		scheduleTerminalUploadCleanupRetry(options);
	}
}
/** Starts one process-wide recovery scan and retries transient scan failures. */
function ensureTerminalUploadCleanup(options) {
	if (options) return runTerminalUploadCleanupRecovery(options);
	if (defaultCleanupPromise) return defaultCleanupPromise;
	defaultCleanupPromise = runTerminalUploadCleanupRecovery().finally(() => {
		if (cleanupRecoveryTimers.has(cleanupRecoveryRoot())) defaultCleanupPromise = void 0;
	});
	return defaultCleanupPromise;
}
/** Stages one browser-selected file in a private, expiring temporary directory. */
async function stageTerminalUpload(file, options) {
	if (!options?.tempRoot) ensureTerminalUploadCleanup();
	const bytes = decodeTerminalUpload(file.contentBase64);
	const platform = options?.platform ?? process.platform;
	const tempRoot = options?.tempRoot ?? resolveTerminalUploadRoot(options);
	if (platform === "win32" && !options?.tempRoot) await (0, node_fs_promises.mkdir)(tempRoot, {
		recursive: true,
		mode: 448
	});
	const directory = await (0, node_fs_promises.mkdtemp)(node_path.default.join(tempRoot, TERMINAL_UPLOAD_PREFIX));
	const targetPath = node_path.default.join(directory, sanitizeTerminalUploadName(file.name));
	try {
		await (0, node_fs_promises.writeFile)(targetPath, bytes, {
			flag: "wx",
			mode: 384
		});
	} catch (error) {
		await removeTerminalUploadDirectory(directory);
		throw error;
	}
	scheduleTerminalUploadCleanup(directory, options?.cleanupAfterMs ?? TERMINAL_UPLOAD_RETENTION_MS);
	return {
		path: targetPath,
		size: bytes.length
	};
}
//#endregion
//#region src/process/terminal-pty.ts
function resolveTerminalPtyInvocation(params) {
	const platform = params.platform ?? process.platform;
	if (!require_windows_command.isWindowsBatchCommand(params.file, platform)) return {
		file: params.file,
		args: params.args
	};
	return {
		file: params.comSpec?.trim() || require_windows_command.resolveTrustedWindowsCmdExe(platform),
		args: [
			"/d",
			"/s",
			"/c",
			require_windows_command.buildWindowsCmdExeCommandLine(params.file, params.args)
		]
	};
}
async function spawnTerminalPty(params) {
	const { spawn } = await import("@lydell/node-pty");
	const comSpec = params.env.ComSpec ?? params.env.COMSPEC;
	const invocation = resolveTerminalPtyInvocation({
		file: params.file,
		args: params.args,
		...comSpec ? { comSpec } : {}
	});
	const pty = spawn(invocation.file, invocation.args, {
		name: params.env.TERM ?? "xterm-256color",
		cols: params.cols,
		rows: params.rows,
		cwd: params.cwd,
		env: params.env
	});
	return {
		get pid() {
			return pty.pid;
		},
		write: (data) => pty.write(data),
		resize: (cols, rows) => pty.resize(cols, rows),
		pause: () => pty.pause(),
		resume: () => pty.resume(),
		onData: (listener) => {
			pty.onData(listener);
		},
		onExit: (listener) => {
			pty.onExit(listener);
		},
		kill: (signal) => killPtyTree(pty, signal)
	};
}
function killPtyTree(pty, signal) {
	const sig = signal ?? "SIGKILL";
	try {
		if ((sig === "SIGKILL" || sig === "SIGTERM") && typeof pty.pid === "number" && pty.pid > 0) require_kill_tree.signalProcessTree(pty.pid, sig);
		else if (process.platform === "win32") pty.kill();
		else pty.kill(sig);
	} catch {}
}
//#endregion
//#region src/gateway/terminal/backend.ts
async function createLocalTerminalBackend(params, spawn = spawnTerminalPty) {
	const pty = await spawn(params);
	return {
		write: (data) => pty.write(data),
		resize: (cols, rows) => pty.resize(cols, rows),
		pause: () => pty.pause(),
		resume: () => pty.resume(),
		kill: () => pty.kill(),
		onData: (callback) => pty.onData(callback),
		onExit: (callback) => pty.onExit(callback)
	};
}
//#endregion
//#region src/gateway/terminal/output-coalescer.ts
const TERMINAL_OUTPUT_COALESCE_WINDOW_MS = 4;
const TERMINAL_OUTPUT_FRAME_BYTES = 64 * 1024;
/** Batches adjacent PTY chunks while keeping each emitted frame UTF-8 bounded. */
var TerminalOutputCoalescer = class {
	constructor(emit) {
		this.chunks = [];
		this.bufferedBytes = 0;
		this.timer = null;
		this.emit = emit;
	}
	get isEmpty() {
		return this.chunks.length === 0;
	}
	push(data, opts) {
		let remaining = data;
		while (remaining) {
			const available = TERMINAL_OUTPUT_FRAME_BYTES - this.bufferedBytes;
			const part = require_utf8_truncate.truncateUtf8Prefix(remaining, available);
			if (!part) {
				this.flush();
				continue;
			}
			this.chunks.push(part);
			this.bufferedBytes += Buffer.byteLength(part, "utf8");
			remaining = remaining.slice(part.length);
			if (this.bufferedBytes >= TERMINAL_OUTPUT_FRAME_BYTES) this.flush();
		}
		if (opts?.flushNow) this.flush();
		else this.schedule();
	}
	flush() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		if (this.chunks.length === 0) return;
		const data = this.chunks.join("");
		this.chunks = [];
		this.bufferedBytes = 0;
		this.emit(data);
	}
	clear() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		this.chunks = [];
		this.bufferedBytes = 0;
	}
	dispose(opts) {
		if (opts?.flush) this.flush();
		else this.clear();
	}
	schedule() {
		if (this.timer || this.chunks.length === 0) return;
		this.timer = setTimeout(() => {
			this.timer = null;
			this.flush();
		}, TERMINAL_OUTPUT_COALESCE_WINDOW_MS);
		this.timer.unref?.();
	}
};
//#endregion
//#region src/gateway/terminal/output-flow-control.ts
const TERMINAL_OUTPUT_HIGH_WATER_BYTES = 4 * 1024 * 1024;
const TERMINAL_OUTPUT_LOW_WATER_BYTES = 512 * 1024;
const TERMINAL_OUTPUT_REASSERT_MS = 5e3;
const INTERACTIVE_OUTPUT_BYTES = 1024;
const INTERACTIVE_OUTPUT_WINDOW_MS = 100;
/** Couples PTY output batching to the owning WebSocket's send pressure. */
var TerminalOutputController = class {
	constructor(options) {
		this.endOffsetValue = 0;
		this.emittedOffset = 0;
		this.lastInputAtMs = Number.NEGATIVE_INFINITY;
		this.desiredPaused = false;
		this.reassertTimer = null;
		this.backend = options.backend;
		this.getConnId = options.getConnId;
		this.getBufferedAmount = options.getBufferedAmount;
		this.record = options.record;
		this.emit = options.emit;
		this.now = options.now ?? Date.now;
		this.coalescer = new TerminalOutputCoalescer((data) => this.emitBuffered(data));
	}
	/** Cumulative UTF-16 end offset across streamed and detached output. */
	get endOffset() {
		return this.endOffsetValue;
	}
	push(chunk) {
		this.record(chunk);
		this.endOffsetValue += chunk.length;
		const connId = this.getConnId();
		if (connId === null) return;
		if (this.coalescer.isEmpty) this.reconcile(connId);
		const interactive = Buffer.byteLength(chunk, "utf8") <= INTERACTIVE_OUTPUT_BYTES && this.now() - this.lastInputAtMs <= INTERACTIVE_OUTPUT_WINDOW_MS;
		this.coalescer.push(chunk, { flushNow: interactive });
	}
	noteInput() {
		this.lastInputAtMs = this.now();
	}
	resetOwnership() {
		this.coalescer.clear();
		this.emittedOffset = this.endOffsetValue;
		this.lastInputAtMs = Number.NEGATIVE_INFINITY;
		if (this.reassertTimer) {
			this.desiredPaused = false;
			this.tryResume();
		}
	}
	dispose(opts) {
		this.coalescer.dispose(opts);
		if (this.reassertTimer) {
			clearInterval(this.reassertTimer);
			this.reassertTimer = null;
			this.desiredPaused = false;
			this.tryResume();
		}
	}
	emitBuffered(data) {
		const connId = this.getConnId();
		if (connId === null) return;
		this.emittedOffset += data.length;
		this.emit(connId, data, this.emittedOffset);
		this.reconcile(connId);
	}
	reconcile(connId) {
		const bufferedAmount = this.getBufferedAmount(connId);
		if (bufferedAmount === void 0) return;
		if (bufferedAmount >= TERMINAL_OUTPUT_HIGH_WATER_BYTES) {
			this.ensureReassertTimer();
			if (!this.desiredPaused) {
				this.desiredPaused = true;
				this.tryPause();
			}
			return;
		}
		if (bufferedAmount <= TERMINAL_OUTPUT_LOW_WATER_BYTES && this.desiredPaused) {
			this.desiredPaused = false;
			this.tryResume();
		}
	}
	ensureReassertTimer() {
		if (this.reassertTimer) return;
		this.reassertTimer = setInterval(() => {
			const connId = this.getConnId();
			const bufferedAmount = connId === null ? void 0 : this.getBufferedAmount(connId);
			if (bufferedAmount !== void 0) {
				if (bufferedAmount >= TERMINAL_OUTPUT_HIGH_WATER_BYTES) this.desiredPaused = true;
				else if (bufferedAmount <= TERMINAL_OUTPUT_LOW_WATER_BYTES) this.desiredPaused = false;
			} else this.desiredPaused = false;
			if (this.desiredPaused) this.tryPause();
			else this.tryResume();
		}, TERMINAL_OUTPUT_REASSERT_MS);
		this.reassertTimer.unref?.();
	}
	tryPause() {
		try {
			this.backend.pause();
		} catch {}
	}
	tryResume() {
		try {
			this.backend.resume();
		} catch {}
	}
};
/** Default grace period before a detached session is killed (seconds). */
const DEFAULT_TERMINAL_DETACH_SECONDS = 300;
//#endregion
//#region src/gateway/terminal/session-manager.ts
/**
* Tracks live PTY sessions keyed by session id, with a reverse index by
* connection so a disconnect can tear down every shell it owned.
*/
var TerminalSessionManager = class {
	constructor(options) {
		this.sessions = /* @__PURE__ */ new Map();
		this.byConn = /* @__PURE__ */ new Map();
		this.pendingOpens = /* @__PURE__ */ new Map();
		this.opening = 0;
		this.spawning = 0;
		ensureTerminalUploadCleanup();
		this.emit = options.emit;
		this.getBufferedAmount = options.getBufferedAmount ?? (() => void 0);
		this.spawn = options.spawn;
		this.maxSessions = options.maxSessions ?? 24;
		this.detachGraceMs = options.detachGraceMs ?? 0;
		this.maxDetachedSessions = options.maxDetachedSessions ?? 8;
		this.scrollbackChars = options.scrollbackChars ?? 262144;
	}
	/** Number of live sessions; used by tests and health surfaces. */
	get size() {
		return this.sessions.size;
	}
	/** Spawns a shell and wires its output/exit to the owning connection. */
	async open(request) {
		if (request.signal?.aborted) return {
			ok: false,
			code: "closed",
			message: this.openAbortMessage(request.signal)
		};
		if (this.spawning >= this.maxSessions * 2) return {
			ok: false,
			code: "limit",
			message: `terminal spawn limit reached (${this.maxSessions * 2})`
		};
		if (this.sessions.size + this.opening >= this.maxSessions) return {
			ok: false,
			code: "limit",
			message: `terminal session limit reached (${this.maxSessions})`
		};
		this.opening += 1;
		this.spawning += 1;
		let reservationActive = true;
		const releaseReservation = () => {
			if (!reservationActive) return;
			reservationActive = false;
			this.opening -= 1;
			this.untrackPendingOpen(request.connId, pending);
		};
		const pending = {
			agentId: request.agentId,
			abort: (message) => {
				pending.abortMessage ??= message;
				releaseReservation();
			}
		};
		const abortPending = () => {
			pending.abort(this.openAbortMessage(request.signal));
		};
		request.signal?.addEventListener("abort", abortPending, { once: true });
		this.trackPendingOpen(request.connId, pending);
		let backend;
		try {
			backend = request.createBackend ? await request.createBackend() : await createLocalTerminalBackend({
				file: request.shell,
				args: request.args,
				cwd: request.cwd,
				env: request.env,
				cols: request.cols,
				rows: request.rows
			}, this.spawn);
		} catch (err) {
			this.spawning -= 1;
			releaseReservation();
			request.signal?.removeEventListener("abort", abortPending);
			return {
				ok: false,
				code: "spawn_failed",
				message: err instanceof Error ? err.message : String(err)
			};
		}
		this.spawning -= 1;
		releaseReservation();
		request.signal?.removeEventListener("abort", abortPending);
		if (pending.abortMessage) {
			try {
				backend.kill();
			} catch {}
			return {
				ok: false,
				code: "closed",
				message: pending.abortMessage
			};
		}
		const sessionId = (0, node_crypto.randomUUID)();
		const buffer = new require_output_ring.TerminalOutputRing(this.scrollbackChars);
		const owner = { connId: request.connId };
		const output = new TerminalOutputController({
			backend,
			getConnId: () => owner.connId,
			getBufferedAmount: this.getBufferedAmount,
			record: (chunk) => buffer.push(chunk),
			emit: (connId, data, seq) => this.emit(connId, require_gateway_transport.TERMINAL_EVENT_DATA, {
				sessionId,
				seq,
				data
			})
		});
		const session = {
			id: sessionId,
			get connId() {
				return owner.connId;
			},
			set connId(connId) {
				owner.connId = connId;
			},
			agentId: request.agentId,
			cwd: request.cwd,
			shell: request.shell,
			backend,
			stageUpload: request.stageUpload ?? stageTerminalUpload,
			closed: false,
			createdAtMs: Date.now(),
			buffer,
			output,
			reaper: null,
			detachedAtMs: null
		};
		this.sessions.set(session.id, session);
		this.indexByConn(request.connId, session.id);
		backend.onData((chunk) => {
			if (!session.closed) session.output.push(chunk);
		});
		backend.onExit((event) => {
			const signal = event.signal && event.signal !== 0 ? event.signal : null;
			this.finalize(session, event.error ? "error" : "process_exit", {
				exitCode: event.exitCode ?? null,
				signal,
				...event.error ? { error: event.error } : {}
			});
		});
		return {
			ok: true,
			sessionId: session.id,
			agentId: session.agentId,
			cwd: session.cwd,
			shell: session.shell
		};
	}
	/** Writes client input to a session; returns false when the session is gone. */
	write(connId, sessionId, data) {
		const session = this.ownedSession(connId, sessionId);
		if (!session) return false;
		try {
			session.output.noteInput();
			session.backend.write(data);
			return true;
		} catch {
			this.finalize(session, "error", { error: "write failed" });
			return false;
		}
	}
	/** Applies a new PTY grid size; returns false when the session is gone. */
	resize(connId, sessionId, cols, rows) {
		const session = this.ownedSession(connId, sessionId);
		if (!session) return false;
		try {
			session.backend.resize(cols, rows);
			return true;
		} catch {
			this.finalize(session, "error", { error: "resize failed" });
			return false;
		}
	}
	/** Stages a file on the same host as an owned terminal session. */
	async upload(connId, sessionId, file) {
		const session = this.ownedSession(connId, sessionId);
		if (!session) return;
		const result = await session.stageUpload(file);
		return this.ownedSession(connId, sessionId) === session ? result : void 0;
	}
	/** Closes one session on operator request. */
	close(connId, sessionId) {
		const session = this.ownedSession(connId, sessionId);
		if (!session) return false;
		this.finalize(session, "closed", {});
		return true;
	}
	/**
	* Rebinds a live-or-detached session to `connId` and returns the replay
	* buffer. Take-over is deliberate: the surface is operator.admin (full host
	* access already), so any admin connection may adopt any session; a previous
	* live owner is notified with reason "detached". Snapshot and rebind happen
	* in one synchronous step, so no PTY chunk can land in both the returned
	* buffer and the new owner's event stream.
	*/
	attach(connId, sessionId) {
		const session = this.sessions.get(sessionId);
		if (!session || session.closed) return;
		if (session.reaper) {
			clearTimeout(session.reaper);
			session.reaper = null;
		}
		session.output.resetOwnership();
		session.detachedAtMs = null;
		if (session.connId !== null && session.connId !== connId) {
			this.byConn.get(session.connId)?.delete(session.id);
			this.emit(session.connId, require_gateway_transport.TERMINAL_EVENT_EXIT, {
				sessionId: session.id,
				exitCode: null,
				signal: null,
				reason: "detached"
			});
		}
		session.connId = connId;
		this.indexByConn(connId, session.id);
		return {
			sessionId: session.id,
			agentId: session.agentId,
			cwd: session.cwd,
			shell: session.shell,
			buffer: session.buffer.snapshot(),
			seq: session.output.endOffset
		};
	}
	/** Every live session, oldest first; all admin connections see the same list. */
	list() {
		return [...this.sessions.values()].filter((session) => !session.closed).map((session) => ({
			sessionId: session.id,
			agentId: session.agentId,
			shell: session.shell,
			cwd: session.cwd,
			attached: session.connId !== null,
			createdAtMs: session.createdAtMs
		})).toSorted((a, b) => a.createdAtMs - b.createdAtMs);
	}
	/** Raw buffered output for one session, or undefined when it is gone. */
	snapshot(sessionId) {
		const session = this.sessions.get(sessionId);
		if (!session || session.closed) return;
		return session.buffer.snapshot();
	}
	trackPendingOpen(connId, pending) {
		let set = this.pendingOpens.get(connId);
		if (!set) {
			set = /* @__PURE__ */ new Set();
			this.pendingOpens.set(connId, set);
		}
		set.add(pending);
	}
	openAbortMessage(signal) {
		return signal?.reason instanceof Error ? signal.reason.message : "terminal open cancelled";
	}
	untrackPendingOpen(connId, pending) {
		const set = this.pendingOpens.get(connId);
		if (set) {
			set.delete(pending);
			if (set.size === 0) this.pendingOpens.delete(connId);
		}
	}
	/**
	* Handles a dropped connection: detaches its sessions for later reattach
	* when a grace period is configured, otherwise kills them (legacy behavior,
	* still selected by detachedSessionTimeoutSeconds: 0).
	*/
	handleDisconnect(connId) {
		const opens = this.pendingOpens.get(connId);
		if (opens) for (const pending of opens) pending.abort("connection closed during open");
		const ids = this.byConn.get(connId);
		if (!ids) return;
		for (const id of Array.from(ids)) {
			const session = this.sessions.get(id);
			if (!session) continue;
			if (this.detachGraceMs > 0) this.detach(session);
			else this.finalize(session, "disconnected", {}, { silent: true });
		}
		this.byConn.delete(connId);
	}
	/** Closes live and pending sessions whose agent no longer permits a host shell. */
	closeDisallowedAgents(isAllowed) {
		for (const opens of this.pendingOpens.values()) for (const pending of opens) if (!isAllowed(pending.agentId)) pending.abort("terminal closed because the agent policy changed");
		for (const session of Array.from(this.sessions.values())) if (!isAllowed(session.agentId)) this.finalize(session, "closed", { error: "terminal closed because the agent policy changed" });
	}
	/** Parks a session ownerless with a reaper; PTY output keeps buffering. */
	detach(session) {
		session.output.resetOwnership();
		session.connId = null;
		session.detachedAtMs = Date.now();
		session.reaper = setTimeout(() => {
			this.finalize(session, "disconnected", {}, { silent: true });
		}, this.detachGraceMs);
		session.reaper.unref?.();
		this.enforceDetachedCap();
	}
	enforceDetachedCap() {
		const detached = [...this.sessions.values()].filter((session) => !session.closed && session.connId === null).toSorted((a, b) => (a.detachedAtMs ?? 0) - (b.detachedAtMs ?? 0));
		for (const session of detached.slice(0, Math.max(0, detached.length - this.maxDetachedSessions))) this.finalize(session, "disconnected", {}, { silent: true });
	}
	/**
	* Tears down every session — detached ones included — on gateway
	* shutdown/stop. Silent because the sockets are going away anyway (disabling
	* the terminal is a `gateway` restart, so that path also runs through here,
	* not a live notification).
	*/
	disposeAll() {
		for (const opens of this.pendingOpens.values()) for (const pending of opens) pending.abort("gateway closed during terminal open");
		for (const session of Array.from(this.sessions.values())) this.finalize(session, "disconnected", {}, { silent: true });
	}
	indexByConn(connId, sessionId) {
		let connSessions = this.byConn.get(connId);
		if (!connSessions) {
			connSessions = /* @__PURE__ */ new Set();
			this.byConn.set(connId, connSessions);
		}
		connSessions.add(sessionId);
	}
	ownedSession(connId, sessionId) {
		const session = this.sessions.get(sessionId);
		if (!session || session.connId !== connId || session.closed) return;
		return session;
	}
	finalize(session, reason, detail, opts) {
		if (session.closed) return;
		session.output.dispose({ flush: !opts?.silent && session.connId !== null });
		session.closed = true;
		if (session.reaper) {
			clearTimeout(session.reaper);
			session.reaper = null;
		}
		this.sessions.delete(session.id);
		if (session.connId !== null) this.byConn.get(session.connId)?.delete(session.id);
		try {
			session.backend.kill();
		} catch {}
		if (!opts?.silent && session.connId !== null) this.emit(session.connId, require_gateway_transport.TERMINAL_EVENT_EXIT, {
			sessionId: session.id,
			exitCode: detail.exitCode ?? null,
			signal: detail.signal ?? null,
			reason,
			...detail.error ? { error: detail.error } : {}
		});
	}
};
//#endregion
exports.DEFAULT_TERMINAL_DETACH_SECONDS = DEFAULT_TERMINAL_DETACH_SECONDS;
exports.TerminalSessionManager = TerminalSessionManager;
