const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_pid_alive = require("./pid-alive-BalBSmHd.cjs");
const require_session_write_lock_error = require("./session-write-lock-error-nizWfM3P.cjs");
const require_gateway_processes = require("./gateway-processes-BGxt3ntJ.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _openclaw_fs_safe_file_lock = require("@openclaw/fs-safe/file-lock");
//#region src/agents/session-write-lock.ts
var session_write_lock_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	acquireSessionWriteLock: () => acquireSessionWriteLock,
	cleanStaleLockFiles: () => cleanStaleLockFiles,
	drainSessionWriteLockStateForTest: () => drainSessionWriteLockStateForTest,
	resolveSessionLockMaxHoldFromTimeout: () => resolveSessionLockMaxHoldFromTimeout,
	resolveSessionWriteLockAcquireTimeoutMs: () => resolveSessionWriteLockAcquireTimeoutMs,
	resolveSessionWriteLockOptions: () => resolveSessionWriteLockOptions,
	resolveSessionWriteLockStaleMs: () => resolveSessionWriteLockStaleMs
});
function isValidLockNumber(value) {
	return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
const CLEANUP_SIGNALS = [
	"SIGINT",
	"SIGTERM",
	"SIGQUIT",
	"SIGABRT"
];
const CLEANUP_STATE_KEY = Symbol.for("operator.sessionWriteLockCleanupState");
const WATCHDOG_STATE_KEY = Symbol.for("operator.sessionWriteLockWatchdogState");
const DEFAULT_SESSION_WRITE_LOCK_STALE_MS = 1800 * 1e3;
const DEFAULT_SESSION_WRITE_LOCK_MAX_HOLD_MS = 300 * 1e3;
const DEFAULT_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS = 6e4;
const ABORTABLE_SESSION_WRITE_LOCK_POLL_MS = 100;
const DEFAULT_WATCHDOG_INTERVAL_MS = 6e4;
const DEFAULT_TIMEOUT_GRACE_MS = 120 * 1e3;
const REPORT_ONLY_STALE_LOCK_REASONS = /* @__PURE__ */ new Set(["too-old", "hold-exceeded"]);
/**
* Yield control to the event loop so other sessions can make progress
* while lock contention callbacks run synchronous I/O.
*/
function yieldEventLoop() {
	return new Promise((resolve) => {
		setImmediate(resolve);
	});
}
const ORPHAN_LOCK_PAYLOAD_GRACE_MS = 3e4;
const SHORT_TIMEOUT_ORPHAN_LOCK_PAYLOAD_GRACE_MS = 5e3;
const SESSION_LOCKS = (0, _openclaw_fs_safe_file_lock.createFileLockManager)("operator.session-write-lock");
let resolveProcessStartTimeForLock = require_pid_alive.getProcessStartTime;
function isFileLockError(error, code) {
	return error?.code === code;
}
const SESSION_WRITE_LOCK_ENV = {
	acquireTimeoutMs: "OPERATOR_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS",
	staleMs: "OPERATOR_SESSION_WRITE_LOCK_STALE_MS",
	maxHoldMs: "OPERATOR_SESSION_WRITE_LOCK_MAX_HOLD_MS"
};
function readPositiveMsEnv(env, key, opts = {}) {
	const raw = env[key]?.trim();
	if (!raw) return;
	if (raw === "Infinity") return opts.allowInfinity ? Number.POSITIVE_INFINITY : void 0;
	if (!/^\d+$/.test(raw)) return;
	return parsePositiveMs(Number(raw), opts);
}
function parsePositiveMs(value, opts = {}) {
	if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return;
	if (value === Number.POSITIVE_INFINITY) return opts.allowInfinity ? value : void 0;
	if (!Number.isFinite(value)) return;
	if (!Number.isSafeInteger(value)) return;
	return value;
}
function resolveSessionWriteLockMs(params) {
	const opts = { allowInfinity: params.allowInfinity };
	return readPositiveMsEnv(params.env ?? process.env, SESSION_WRITE_LOCK_ENV[params.key], opts) ?? parsePositiveMs(params.config?.session?.writeLock?.[params.key], opts) ?? params.fallback;
}
function resolveSessionWriteLockAcquireTimeoutMs(config, env) {
	return resolveSessionWriteLockMs({
		config,
		env,
		key: "acquireTimeoutMs",
		fallback: DEFAULT_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS,
		allowInfinity: true
	});
}
function resolveSessionWriteLockStaleMs(config, env) {
	return resolveSessionWriteLockMs({
		config,
		env,
		key: "staleMs",
		fallback: DEFAULT_SESSION_WRITE_LOCK_STALE_MS
	});
}
function resolveSessionWriteLockMaxHoldMs(config, params = {}) {
	return resolveSessionWriteLockMs({
		config,
		env: params.env,
		key: "maxHoldMs",
		fallback: params.fallback ?? DEFAULT_SESSION_WRITE_LOCK_MAX_HOLD_MS
	});
}
function resolveSessionWriteLockOptions(config, params = {}) {
	return {
		timeoutMs: resolveSessionWriteLockAcquireTimeoutMs(config, params.env),
		staleMs: resolveSessionWriteLockStaleMs(config, params.env),
		maxHoldMs: resolveSessionWriteLockMaxHoldMs(config, {
			env: params.env,
			fallback: params.maxHoldMsFallback
		})
	};
}
function resolveCleanupState() {
	const proc = process;
	if (!proc[CLEANUP_STATE_KEY]) proc[CLEANUP_STATE_KEY] = {
		registered: false,
		exitHandler: void 0,
		cleanupHandlers: /* @__PURE__ */ new Map()
	};
	return proc[CLEANUP_STATE_KEY];
}
function resolveWatchdogState() {
	const proc = process;
	if (!proc[WATCHDOG_STATE_KEY]) proc[WATCHDOG_STATE_KEY] = {
		started: false,
		intervalMs: DEFAULT_WATCHDOG_INTERVAL_MS
	};
	return proc[WATCHDOG_STATE_KEY];
}
function resolvePositiveMs(value, fallback, opts = {}) {
	if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return fallback;
	if (value === Number.POSITIVE_INFINITY) return opts.allowInfinity ? value : fallback;
	if (!Number.isFinite(value)) return fallback;
	return value;
}
function resolveSessionLockMaxHoldFromTimeout(params) {
	const minMs = resolvePositiveMs(params.minMs, DEFAULT_SESSION_WRITE_LOCK_MAX_HOLD_MS);
	const timeoutMs = resolvePositiveMs(params.timeoutMs, minMs, { allowInfinity: true });
	if (timeoutMs === Number.POSITIVE_INFINITY) return _gabrielvfonseca_normalization_core_number_coercion.MAX_TIMER_TIMEOUT_MS;
	const graceMs = resolvePositiveMs(params.graceMs, DEFAULT_TIMEOUT_GRACE_MS);
	return Math.min(_gabrielvfonseca_normalization_core_number_coercion.MAX_TIMER_TIMEOUT_MS, Math.max(minMs, timeoutMs + graceMs));
}
/**
* Synchronously release all held locks.
* Used during process exit when async operations aren't reliable.
*/
function releaseAllLocksSync() {
	SESSION_LOCKS.reset();
	stopWatchdogTimer();
}
async function runLockWatchdogCheck(nowMs = Date.now()) {
	let released = 0;
	for (const held of SESSION_LOCKS.heldEntries()) {
		const maxHoldMs = typeof held.metadata.maxHoldMs === "number" ? held.metadata.maxHoldMs : DEFAULT_SESSION_WRITE_LOCK_MAX_HOLD_MS;
		const heldForMs = nowMs - held.acquiredAt;
		if (heldForMs <= maxHoldMs) continue;
		process.stderr.write(`[session-write-lock] releasing lock held for ${heldForMs}ms (max=${maxHoldMs}ms): ${held.lockPath}\n`);
		if (await held.forceRelease()) released += 1;
	}
	return released;
}
function stopWatchdogTimer() {
	const watchdogState = resolveWatchdogState();
	if (watchdogState.timer) {
		clearInterval(watchdogState.timer);
		watchdogState.timer = void 0;
	}
	watchdogState.started = false;
}
function shouldStartBackgroundWatchdog() {
	return process.env.VITEST !== "true";
}
function ensureWatchdogStarted(intervalMs) {
	if (!shouldStartBackgroundWatchdog()) return;
	const watchdogState = resolveWatchdogState();
	if (watchdogState.started) return;
	watchdogState.started = true;
	watchdogState.intervalMs = intervalMs;
	watchdogState.timer = setInterval(() => {
		runLockWatchdogCheck().catch(() => {});
	}, intervalMs);
	watchdogState.timer.unref?.();
}
function handleTerminationSignal(signal) {
	releaseAllLocksSync();
	const cleanupState = resolveCleanupState();
	if (process.listenerCount(signal) === 1) {
		const handler = cleanupState.cleanupHandlers.get(signal);
		if (handler) {
			process.off(signal, handler);
			cleanupState.cleanupHandlers.delete(signal);
		}
		try {
			process.kill(process.pid, signal);
		} catch {}
	}
}
function registerCleanupHandlers() {
	const cleanupState = resolveCleanupState();
	cleanupState.registered = true;
	if (!cleanupState.exitHandler) {
		cleanupState.exitHandler = () => {
			releaseAllLocksSync();
		};
		process.on("exit", cleanupState.exitHandler);
	}
	ensureWatchdogStarted(DEFAULT_WATCHDOG_INTERVAL_MS);
	for (const signal of CLEANUP_SIGNALS) {
		if (cleanupState.cleanupHandlers.has(signal)) continue;
		try {
			const handler = () => handleTerminationSignal(signal);
			cleanupState.cleanupHandlers.set(signal, handler);
			process.on(signal, handler);
		} catch {}
	}
}
function unregisterCleanupHandlers() {
	const cleanupState = resolveCleanupState();
	if (cleanupState.exitHandler) {
		process.off("exit", cleanupState.exitHandler);
		cleanupState.exitHandler = void 0;
	}
	for (const [signal, handler] of cleanupState.cleanupHandlers) process.off(signal, handler);
	cleanupState.cleanupHandlers.clear();
	cleanupState.registered = false;
}
function parseLockPayload(raw) {
	const parsed = JSON.parse(raw);
	const payload = {};
	if (isValidLockNumber(parsed.pid) && parsed.pid > 0) payload.pid = parsed.pid;
	if (typeof parsed.createdAt === "string") payload.createdAt = parsed.createdAt;
	if (isValidLockNumber(parsed.starttime)) payload.starttime = parsed.starttime;
	if (isValidLockNumber(parsed.maxHoldMs) && parsed.maxHoldMs > 0) payload.maxHoldMs = parsed.maxHoldMs;
	return payload;
}
async function readLockPayload(lockPath) {
	try {
		return parseLockPayload(await node_fs_promises.default.readFile(lockPath, "utf8"));
	} catch {
		return null;
	}
}
async function readLockPayloadForDiagnostics(lockPath) {
	try {
		return {
			payload: parseLockPayload(await node_fs_promises.default.readFile(lockPath, "utf8")),
			missing: false
		};
	} catch (error) {
		return {
			payload: null,
			missing: error?.code === "ENOENT"
		};
	}
}
async function resolveNormalizedSessionFile(sessionFile) {
	const resolvedSessionFile = node_path.default.resolve(sessionFile);
	const sessionDir = node_path.default.dirname(resolvedSessionFile);
	try {
		const normalizedDir = await node_fs_promises.default.realpath(sessionDir);
		return node_path.default.join(normalizedDir, node_path.default.basename(resolvedSessionFile));
	} catch {
		return resolvedSessionFile;
	}
}
function resolveSessionWriteLockTarget(sessionFile) {
	const sqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(sessionFile);
	if (!sqliteMarker) return node_path.default.resolve(sessionFile);
	const safeAgentId = sqliteMarker.agentId.replace(/[^a-zA-Z0-9._-]/g, "_") || "agent";
	const safeSessionId = sqliteMarker.sessionId.replace(/[^a-zA-Z0-9._-]/g, "_") || "session";
	return node_path.default.join(node_path.default.dirname(node_path.default.resolve(sqliteMarker.storePath)), "session-locks", `${safeAgentId}-${safeSessionId}.sqlite-transcript`);
}
function normalizeOwnerProcessArg(arg) {
	return arg.trim().replaceAll("\\", "/").toLowerCase();
}
function isOperatorSessionOwnerArgv(args) {
	const normalized = args.map(normalizeOwnerProcessArg).filter(Boolean);
	if (normalized.length === 0) return false;
	const exe = (normalized[0] ?? "").replace(/\.(bat|cmd|exe)$/i, "");
	if (exe === "@gabrielvfonseca/operator" || exe.endsWith("/openclaw") || exe.endsWith("/operator-gateway")) return true;
	if (normalized.some((arg) => arg === "@gabrielvfonseca/operator" || arg.endsWith("/openclaw") || arg === "operator.mjs" || arg.endsWith("/operator.mjs"))) return true;
	const entryCandidates = [
		"dist/index.js",
		"dist/entry.js",
		"scripts/run-node.mjs",
		"src/entry.ts",
		"src/index.ts"
	];
	const hasOperatorCommandToken = normalized.some((arg) => arg === "gateway" || arg === "agent");
	return normalized.some((arg) => entryCandidates.some((entry) => arg.endsWith(entry)) && hasOperatorCommandToken);
}
function readOwnerProcessArgs(reader, pid) {
	try {
		const args = reader(pid);
		return Array.isArray(args) ? args : null;
	} catch {
		return null;
	}
}
function inspectLockPayload(payload, staleMs, nowMs, opts = {}) {
	const pid = isValidLockNumber(payload?.pid) && payload.pid > 0 ? payload.pid : null;
	const pidAlive = pid !== null ? require_pid_alive.isPidAlive(pid) : false;
	const createdAt = typeof payload?.createdAt === "string" ? payload.createdAt : null;
	const createdAtMs = createdAt ? Date.parse(createdAt) : NaN;
	const ageMs = Number.isFinite(createdAtMs) ? Math.max(0, nowMs - createdAtMs) : null;
	const storedStarttime = isValidLockNumber(payload?.starttime) ? payload.starttime : null;
	const pidRecycled = pidAlive && pid !== null && storedStarttime !== null ? (() => {
		const currentStarttime = resolveProcessStartTimeForLock(pid);
		return currentStarttime !== null && currentStarttime !== storedStarttime;
	})() : false;
	const staleReasons = [];
	if (pid === null) staleReasons.push("missing-pid");
	else if (!pidAlive) staleReasons.push("dead-pid");
	else if (pidRecycled) staleReasons.push("recycled-pid");
	if (ageMs === null) staleReasons.push("invalid-createdAt");
	else if (ageMs > staleMs) staleReasons.push("too-old");
	const holderMaxHoldMs = isValidLockNumber(payload?.maxHoldMs) && payload.maxHoldMs > 0 ? payload.maxHoldMs : void 0;
	if (opts.respectMaxHold === true && typeof holderMaxHoldMs === "number" && ageMs !== null && ageMs > holderMaxHoldMs) staleReasons.push("hold-exceeded");
	return {
		pid,
		pidAlive,
		createdAt,
		ageMs,
		stale: staleReasons.length > 0,
		staleReasons
	};
}
function shouldTreatAsNonOperatorOwner(params) {
	if (params.inspected.pid === null || !params.inspected.pidAlive) return false;
	if (params.inspected.staleReasons.includes("recycled-pid")) return false;
	if (params.inspected.pid === process.pid && params.heldByThisProcess) return false;
	if (!isValidLockNumber(params.payload?.pid) || params.payload.pid <= 0) return false;
	const args = readOwnerProcessArgs(params.readOwnerProcessArgs, params.payload.pid);
	if (!args || args.every((arg) => !arg.trim())) return false;
	return !isOperatorSessionOwnerArgv(args);
}
function lockInspectionNeedsMtimeStaleFallback(details) {
	return details.stale && details.staleReasons.every((reason) => reason === "missing-pid" || reason === "invalid-createdAt");
}
async function shouldReportContendedLockStale(params) {
	if (!params.details.stale) return false;
	if (params.heldByThisProcess) return false;
	if (lockInspectionNeedsMtimeStaleFallback(params.details)) try {
		const stat = await node_fs_promises.default.stat(params.lockPath);
		return Math.max(0, params.nowMs - stat.mtimeMs) > Math.min(params.staleMs, params.orphanPayloadGraceMs);
	} catch (error) {
		return error?.code !== "ENOENT";
	}
	return true;
}
async function shouldRemoveContendedLockFile(lockPath, details, staleMs, nowMs, orphanPayloadGraceMs = ORPHAN_LOCK_PAYLOAD_GRACE_MS) {
	if (!details.stale) return false;
	if (details.staleReasons.every((reason) => REPORT_ONLY_STALE_LOCK_REASONS.has(reason))) return false;
	if (!lockInspectionNeedsMtimeStaleFallback(details)) return true;
	try {
		const stat = await node_fs_promises.default.stat(lockPath);
		return Math.max(0, nowMs - stat.mtimeMs) > Math.min(staleMs, orphanPayloadGraceMs);
	} catch (error) {
		return error?.code !== "ENOENT";
	}
}
function resolveOrphanLockPayloadGraceMs(timeoutMs) {
	if (timeoutMs < ORPHAN_LOCK_PAYLOAD_GRACE_MS) return SHORT_TIMEOUT_ORPHAN_LOCK_PAYLOAD_GRACE_MS;
	return ORPHAN_LOCK_PAYLOAD_GRACE_MS;
}
function resolveRemainingAcquireTimeoutMs(timeoutMs, startedAtMs, nowMs) {
	if (timeoutMs === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
	const elapsedMs = Math.max(0, nowMs - startedAtMs);
	return Math.max(0, timeoutMs - elapsedMs);
}
async function shouldRetryStaleAcquireFailure(params) {
	if (params.lockMissingAtDiagnostics) return true;
	return !await shouldReportContendedLockStale({
		lockPath: params.lockPath,
		details: params.inspected,
		heldByThisProcess: params.heldByThisProcess,
		staleMs: params.staleMs,
		nowMs: params.nowMs,
		orphanPayloadGraceMs: params.orphanPayloadGraceMs
	});
}
async function shouldRemoveLockDuringCleanup(lockPath, details, staleMs, nowMs) {
	if (!details.stale) return false;
	return await shouldRemoveContendedLockFile(lockPath, details, staleMs, nowMs);
}
function sessionLockHeldByThisProcess(normalizedSessionFile) {
	return SESSION_LOCKS.heldEntries().some((entry) => entry.normalizedTargetPath === normalizedSessionFile);
}
function shouldTreatAsOrphanSelfLock(params) {
	if ((isValidLockNumber(params.payload?.pid) ? params.payload.pid : null) !== process.pid) return false;
	if (params.heldByThisProcess) return false;
	const storedStarttime = isValidLockNumber(params.payload?.starttime) ? params.payload.starttime : null;
	if (storedStarttime === null) return params.reclaimLockWithoutStarttime;
	const currentStarttime = resolveProcessStartTimeForLock(process.pid);
	return currentStarttime !== null && currentStarttime === storedStarttime;
}
function describeLockOwnerForError(params) {
	const parts = [];
	if (params.inspected.pid !== null) {
		parts.push(`pid=${params.inspected.pid}`);
		parts.push(`alive=${params.inspected.pidAlive ? "true" : "false"}`);
	} else if (typeof params.payload?.pid === "number") parts.push(`pid=${params.payload.pid}`);
	else parts.push("owner=unknown");
	if (typeof params.inspected.ageMs === "number") parts.push(`ageMs=${Math.floor(params.inspected.ageMs)}`);
	return parts.join(" ");
}
function inspectLockPayloadForSession(params) {
	const inspected = inspectLockPayload(params.payload, params.staleMs, params.nowMs, { respectMaxHold: params.respectMaxHold });
	if (shouldTreatAsOrphanSelfLock({
		payload: params.payload,
		heldByThisProcess: params.heldByThisProcess,
		reclaimLockWithoutStarttime: params.reclaimLockWithoutStarttime
	})) return {
		...inspected,
		stale: true,
		staleReasons: inspected.staleReasons.includes("orphan-self-pid") ? inspected.staleReasons : [...inspected.staleReasons, "orphan-self-pid"]
	};
	if (shouldTreatAsNonOperatorOwner({
		payload: params.payload,
		inspected,
		heldByThisProcess: params.heldByThisProcess,
		readOwnerProcessArgs: params.readOwnerProcessArgs
	})) return {
		...inspected,
		stale: true,
		staleReasons: [...inspected.staleReasons, "non-operator-owner"]
	};
	return inspected;
}
async function cleanStaleLockFiles(params) {
	const sessionsDir = node_path.default.resolve(params.sessionsDir);
	const staleMs = resolvePositiveMs(params.staleMs, resolveSessionWriteLockStaleMs(params.config, params.env));
	const removeStale = params.removeStale !== false;
	const nowMs = params.nowMs ?? Date.now();
	const baseOwnerProcessArgsReader = params.readOwnerProcessArgs ?? require_gateway_processes.readGatewayProcessArgsSync;
	const ownerArgsByPid = /* @__PURE__ */ new Map();
	const ownerProcessArgsReader = (pid) => {
		const cached = ownerArgsByPid.get(pid);
		if (cached !== void 0) return cached;
		const args = baseOwnerProcessArgsReader(pid);
		ownerArgsByPid.set(pid, args);
		return args;
	};
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(sessionsDir, { withFileTypes: true });
	} catch (err) {
		if (err.code === "ENOENT") return {
			locks: [],
			cleaned: []
		};
		throw err;
	}
	const locks = [];
	const cleaned = [];
	const lockEntries = entries.filter((entry) => entry.name.endsWith(".jsonl.lock")).toSorted((a, b) => a.name.localeCompare(b.name));
	for (const entry of lockEntries) {
		await new Promise((resolve) => {
			setImmediate(resolve);
		});
		const lockPath = node_path.default.join(sessionsDir, entry.name);
		const inspected = inspectLockPayloadForSession({
			payload: await readLockPayload(lockPath),
			staleMs,
			nowMs,
			heldByThisProcess: false,
			reclaimLockWithoutStarttime: false,
			readOwnerProcessArgs: ownerProcessArgsReader
		});
		const removable = await shouldRemoveLockDuringCleanup(lockPath, inspected, staleMs, nowMs);
		const lockInfo = {
			lockPath,
			...inspected,
			removable,
			removed: false
		};
		if (removeStale && removable) {
			await node_fs_promises.default.rm(lockPath, { force: true });
			lockInfo.removed = true;
			cleaned.push(lockInfo);
			params.log?.warn?.(`removed stale session lock: ${lockPath} (${lockInfo.staleReasons.join(", ") || "unknown"})`);
		}
		locks.push(lockInfo);
	}
	return {
		locks,
		cleaned
	};
}
async function acquireSessionWriteLock(params) {
	const throwIfAborted = () => {
		if (!params.signal?.aborted) return;
		if (params.signal.reason instanceof Error) throw params.signal.reason;
		const error = new Error("request aborted", { cause: params.signal.reason });
		error.name = "AbortError";
		throw error;
	};
	throwIfAborted();
	registerCleanupHandlers();
	const allowReentrant = params.allowReentrant ?? false;
	const defaultOptions = resolveSessionWriteLockOptions();
	const timeoutMs = resolvePositiveMs(params.timeoutMs, defaultOptions.timeoutMs, { allowInfinity: true });
	const staleMs = resolvePositiveMs(params.staleMs, defaultOptions.staleMs);
	const maxHoldMs = resolvePositiveMs(params.maxHoldMs, defaultOptions.maxHoldMs);
	const orphanPayloadGraceMs = resolveOrphanLockPayloadGraceMs(timeoutMs);
	const sessionFile = resolveSessionWriteLockTarget(params.sessionFile);
	const sessionDir = node_path.default.dirname(sessionFile);
	const normalizedSessionFile = await resolveNormalizedSessionFile(sessionFile);
	const lockPath = `${normalizedSessionFile}.lock`;
	await node_fs_promises.default.mkdir(sessionDir, { recursive: true });
	const startedAtMs = Date.now();
	while (true) {
		throwIfAborted();
		const remainingTimeoutMs = resolveRemainingAcquireTimeoutMs(timeoutMs, startedAtMs, Date.now());
		if (remainingTimeoutMs <= 0) {
			const payload = await readLockPayload(lockPath);
			const nowMs = Date.now();
			const heldByThisProcess = sessionLockHeldByThisProcess(normalizedSessionFile);
			throw new require_session_write_lock_error.SessionWriteLockTimeoutError({
				timeoutMs,
				owner: describeLockOwnerForError({
					payload,
					inspected: inspectLockPayloadForSession({
						payload,
						staleMs,
						nowMs,
						heldByThisProcess,
						reclaimLockWithoutStarttime: true,
						readOwnerProcessArgs: require_gateway_processes.readGatewayProcessArgsSync,
						respectMaxHold: !heldByThisProcess
					})
				}),
				lockPath
			});
		}
		try {
			const acquireAttemptTimeoutMs = params.signal ? Math.min(remainingTimeoutMs, ABORTABLE_SESSION_WRITE_LOCK_POLL_MS) : remainingTimeoutMs;
			return { release: (await SESSION_LOCKS.acquire(sessionFile, {
				staleMs,
				timeoutMs: acquireAttemptTimeoutMs,
				retry: {
					minTimeout: 50,
					maxTimeout: 1e3,
					factor: 1
				},
				staleRecovery: "remove-if-unchanged",
				allowReentrant,
				metadata: { maxHoldMs },
				payload: () => {
					const createdAt = (/* @__PURE__ */ new Date()).toISOString();
					const starttime = resolveProcessStartTimeForLock(process.pid);
					const lockPayload = {
						pid: process.pid,
						createdAt,
						maxHoldMs
					};
					if (starttime !== null) lockPayload.starttime = starttime;
					return lockPayload;
				},
				shouldReclaim: async ({ payload, nowMs, heldByThisProcess }) => {
					await yieldEventLoop();
					const inspected = inspectLockPayloadForSession({
						payload,
						staleMs,
						nowMs,
						heldByThisProcess,
						reclaimLockWithoutStarttime: true,
						readOwnerProcessArgs: require_gateway_processes.readGatewayProcessArgsSync,
						respectMaxHold: !heldByThisProcess
					});
					return await shouldReportContendedLockStale({
						lockPath,
						details: inspected,
						heldByThisProcess,
						staleMs,
						nowMs,
						orphanPayloadGraceMs
					});
				},
				shouldRemoveStaleLock: async ({ lockPath: lockPathLocal, normalizedTargetPath, payload }) => {
					await yieldEventLoop();
					const nowMs = Date.now();
					const heldByThisProcess = sessionLockHeldByThisProcess(normalizedTargetPath);
					return await shouldRemoveContendedLockFile(lockPathLocal, inspectLockPayloadForSession({
						payload,
						staleMs,
						nowMs,
						heldByThisProcess,
						reclaimLockWithoutStarttime: true,
						readOwnerProcessArgs: require_gateway_processes.readGatewayProcessArgsSync,
						respectMaxHold: !heldByThisProcess
					}), staleMs, nowMs, orphanPayloadGraceMs);
				}
			})).release };
		} catch (err) {
			throwIfAborted();
			if (!isFileLockError(err, "file_lock_timeout") && !isFileLockError(err, "file_lock_stale")) throw err;
			if (params.signal && isFileLockError(err, "file_lock_timeout") && resolveRemainingAcquireTimeoutMs(timeoutMs, startedAtMs, Date.now()) > 0) continue;
			const errorLockPath = err.lockPath ?? lockPath;
			const { payload, missing: lockMissingAtDiagnostics } = await readLockPayloadForDiagnostics(errorLockPath);
			const nowMs = Date.now();
			const heldByThisProcess = sessionLockHeldByThisProcess(normalizedSessionFile);
			const inspected = inspectLockPayloadForSession({
				payload,
				staleMs,
				nowMs,
				heldByThisProcess,
				reclaimLockWithoutStarttime: true,
				readOwnerProcessArgs: require_gateway_processes.readGatewayProcessArgsSync,
				respectMaxHold: !heldByThisProcess
			});
			const owner = describeLockOwnerForError({
				payload,
				inspected
			});
			if (isFileLockError(err, "file_lock_stale")) {
				if (resolveRemainingAcquireTimeoutMs(timeoutMs, startedAtMs, Date.now()) > 0 && await shouldRetryStaleAcquireFailure({
					lockPath: errorLockPath,
					lockMissingAtDiagnostics,
					inspected,
					heldByThisProcess,
					staleMs,
					nowMs,
					orphanPayloadGraceMs
				})) continue;
				throw new require_session_write_lock_error.SessionWriteLockStaleError({
					owner,
					lockPath: errorLockPath,
					staleReasons: inspected.staleReasons
				});
			}
			throw new require_session_write_lock_error.SessionWriteLockTimeoutError({
				timeoutMs,
				owner,
				lockPath: errorLockPath
			});
		}
	}
}
const testing = {
	cleanupSignals: [...CLEANUP_SIGNALS],
	handleTerminationSignal,
	inspectLockPayloadForTest: inspectLockPayload,
	releaseAllLocksSync,
	runLockWatchdogCheck,
	resolveRemainingAcquireTimeoutMs,
	setProcessStartTimeResolverForTest(resolver) {
		resolveProcessStartTimeForLock = resolver ?? require_pid_alive.getProcessStartTime;
	}
};
async function drainSessionWriteLockStateForTest() {
	await SESSION_LOCKS.drain();
	stopWatchdogTimer();
	unregisterCleanupHandlers();
}
function resetSessionWriteLockStateForTest() {
	releaseAllLocksSync();
	stopWatchdogTimer();
	unregisterCleanupHandlers();
	resolveProcessStartTimeForLock = require_pid_alive.getProcessStartTime;
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.sessionWriteLockTestApi")] = {
	resetSessionWriteLockStateForTest,
	testing
};
//#endregion
Object.defineProperty(exports, "acquireSessionWriteLock", {
	enumerable: true,
	get: function() {
		return acquireSessionWriteLock;
	}
});
Object.defineProperty(exports, "cleanStaleLockFiles", {
	enumerable: true,
	get: function() {
		return cleanStaleLockFiles;
	}
});
Object.defineProperty(exports, "resolveSessionLockMaxHoldFromTimeout", {
	enumerable: true,
	get: function() {
		return resolveSessionLockMaxHoldFromTimeout;
	}
});
Object.defineProperty(exports, "resolveSessionWriteLockOptions", {
	enumerable: true,
	get: function() {
		return resolveSessionWriteLockOptions;
	}
});
Object.defineProperty(exports, "resolveSessionWriteLockStaleMs", {
	enumerable: true,
	get: function() {
		return resolveSessionWriteLockStaleMs;
	}
});
Object.defineProperty(exports, "session_write_lock_exports", {
	enumerable: true,
	get: function() {
		return session_write_lock_exports;
	}
});
