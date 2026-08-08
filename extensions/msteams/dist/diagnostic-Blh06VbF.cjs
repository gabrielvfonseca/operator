const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./replace-file-D77oDPOz.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
require("./errors-BqS4bzom.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
const require_diagnostic_stability = require("./diagnostic-stability-BM7LOjsk.cjs");
const require_diagnostic_run_activity = require("./diagnostic-run-activity-DjuaoKPQ.cjs");
const require_diagnostic_runtime = require("./diagnostic-runtime-DOIuSHus.cjs");
const require_store = require("./store-BGE2-Qsm.cjs");
const require_diagnostic_session_state = require("./diagnostic-session-state-C4bkHap8.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let node_process = require("node:process");
node_process = require_rolldown_runtime.__toESM(node_process, 1);
let node_perf_hooks = require("node:perf_hooks");
let node_v8 = require("node:v8");
node_v8 = require_rolldown_runtime.__toESM(node_v8, 1);
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
let _openclaw_fs_safe_atomic = require("@openclaw/fs-safe/atomic");
//#region src/infra/fatal-error-hooks.ts
const hooks = /* @__PURE__ */ new Set();
/** Registers a fatal-error hook and returns an unsubscribe callback. */
function registerFatalErrorHook(hook) {
	hooks.add(hook);
	return () => {
		hooks.delete(hook);
	};
}
//#endregion
//#region src/node-host/with-timeout.ts
/** Timeout wrapper for node-host operations using AbortSignal cancellation. */
/**
* AbortSignal-based timeout wrapper for node-host operations.
*
* The wrapper races work against an abort promise, clears timers/listeners on
* completion, and preserves object-shaped abort reasons as Error properties.
*/
/** Run work with an optional timeout and AbortSignal. */
async function withTimeout(work, timeoutMs, label) {
	const resolved = timeoutMs === void 0 ? void 0 : (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(timeoutMs, 1);
	if (!resolved) return await work(void 0);
	const abortCtrl = new AbortController();
	const timeoutError = /* @__PURE__ */ new Error(`${label ?? "request"} timed out`);
	const timer = setTimeout(() => abortCtrl.abort(timeoutError), resolved);
	timer.unref?.();
	let abortListener;
	const abortPromise = abortCtrl.signal.aborted ? Promise.reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(abortCtrl.signal.reason ?? timeoutError, "Non-Error rejection")) : new Promise((_, reject) => {
		abortListener = () => reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(abortCtrl.signal.reason ?? timeoutError, "Non-Error rejection"));
		abortCtrl.signal.addEventListener("abort", abortListener, { once: true });
	});
	try {
		return await Promise.race([work(abortCtrl.signal), abortPromise]);
	} finally {
		clearTimeout(timer);
		if (abortListener) abortCtrl.signal.removeEventListener("abort", abortListener);
	}
}
//#endregion
//#region src/agents/embedded-agent-runner/compaction-safety-timeout.ts
/**
* Wraps compaction calls with a safety timeout and abort cleanup.
*/
const EMBEDDED_COMPACTION_TIMEOUT_MS = 18e4;
function abortErrorFromSignal(signal) {
	const reason = "reason" in signal ? signal.reason : void 0;
	if (reason instanceof Error) return reason;
	return require_abort_signal.createAbortError("aborted", reason ? { cause: reason } : void 0);
}
function resolveCompactionTimeoutMs(cfg) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.finiteSecondsToTimerSafeMilliseconds)(cfg?.agents?.defaults?.compaction?.timeoutSeconds, { floorSeconds: true }) ?? EMBEDDED_COMPACTION_TIMEOUT_MS;
}
async function compactWithSafetyTimeout(compact, timeoutMs = EMBEDDED_COMPACTION_TIMEOUT_MS, opts) {
	let canceled = false;
	const cancel = () => {
		if (canceled) return;
		canceled = true;
		try {
			opts?.onCancel?.();
		} catch {}
	};
	return await withTimeout(async (timeoutSignal) => {
		let timeoutListener;
		let externalAbortListener;
		let externalAbortPromise;
		const abortSignal = opts?.abortSignal;
		const composedAbortSignal = timeoutSignal && abortSignal ? AbortSignal.any([timeoutSignal, abortSignal]) : timeoutSignal ?? abortSignal;
		if (timeoutSignal) {
			timeoutListener = () => {
				cancel();
			};
			timeoutSignal.addEventListener("abort", timeoutListener, { once: true });
		}
		if (abortSignal) {
			if (abortSignal.aborted) {
				cancel();
				throw abortErrorFromSignal(abortSignal);
			}
			externalAbortPromise = new Promise((_, reject) => {
				externalAbortListener = () => {
					cancel();
					reject(abortErrorFromSignal(abortSignal));
				};
				abortSignal.addEventListener("abort", externalAbortListener, { once: true });
			});
		}
		try {
			const compactPromise = compact(composedAbortSignal);
			if (externalAbortPromise) return await Promise.race([compactPromise, externalAbortPromise]);
			return await compactPromise;
		} finally {
			if (timeoutListener) timeoutSignal?.removeEventListener("abort", timeoutListener);
			if (externalAbortListener) abortSignal?.removeEventListener("abort", externalAbortListener);
		}
	}, timeoutMs, "Compaction");
}
/**
* Invoke a plugin-owned {@link ContextEngine.compact} bounded by the same
* finite safety timeout that protects native runtime compaction.
*
* Plugin context engines that advertise `ownsCompaction` previously had their
* `compact()` awaited with no timeout, no watchdog, and no abort signal — a
* slow or hung plugin compaction would hang the agent turn indefinitely. This
* wrapper closes that gap:
*  - the call is bounded by `timeoutMs` (host-resolved, default
*    {@link EMBEDDED_COMPACTION_TIMEOUT_MS}); on timeout it rejects with a
*    "Compaction timed out" error so the caller's existing failure handling
*    runs instead of hanging;
*  - the timeout signal and caller `abortSignal` are both raced against the
*    call (so a non-cooperating engine is still bounded) and threaded into the
*    `compact()` params (so cooperating engines can cancel their own in-flight
*    work).
*
* Callers keep their existing try/catch — a timeout or abort surfaces as a
* thrown error, never a silent hang.
*/
function compactContextEngineWithSafetyTimeout(contextEngine, params, timeoutMs = EMBEDDED_COMPACTION_TIMEOUT_MS, abortSignal) {
	return compactWithSafetyTimeout((compactAbortSignal) => contextEngine.compact(compactAbortSignal ? {
		...params,
		abortSignal: compactAbortSignal
	} : params), timeoutMs, abortSignal ? { abortSignal } : void 0);
}
const DEFAULT_DIAGNOSTIC_STABILITY_BUNDLE_LIMIT = require_diagnostic_stability.MAX_DIAGNOSTIC_STABILITY_LIMIT;
const DEFAULT_DIAGNOSTIC_STABILITY_BUNDLE_RETENTION = 20;
const SAFE_REASON_CODE = /^[A-Za-z0-9_.:-]{1,120}$/u;
const BUNDLE_PREFIX = "operator-stability-";
const BUNDLE_SUFFIX = ".json";
const REDACTED_HOSTNAME = "<redacted-hostname>";
const MAX_SAFE_ERROR_MESSAGE_LENGTH = 500;
const MAX_ACTIVE_RESOURCE_TYPES = 25;
const MAX_SESSION_FILE_RESULTS = 20;
const MAX_SESSION_SCAN_AGENTS = 100;
const MAX_SESSION_SCAN_FILES = 5e3;
const CGROUP_V2_MEMORY_FILES = [
	"current",
	"max",
	"high",
	"peak",
	"swap.current",
	"swap.max"
];
const CGROUP_V2_MEMORY_EVENTS = ["events", "events.local"];
let fatalHookUnsubscribe = null;
function normalizeReason(reason) {
	return SAFE_REASON_CODE.test(reason) ? reason : "unknown";
}
function formatBundleTimestamp(now) {
	return now.toISOString().replace(/[:.]/g, "-");
}
function readErrorCode(error) {
	if (!error || typeof error !== "object" || !("code" in error)) return;
	const code = error.code;
	if (typeof code === "string" && SAFE_REASON_CODE.test(code)) return code;
	if (typeof code === "number" && Number.isFinite(code)) return String(code);
}
function readErrorName(error) {
	if (!error || typeof error !== "object" || !("name" in error)) return;
	const name = error.name;
	return typeof name === "string" && SAFE_REASON_CODE.test(name) ? name : void 0;
}
function readErrorMessage(error) {
	if (!error || typeof error !== "object" || !("message" in error)) return;
	const message = error.message;
	if (typeof message !== "string") return;
	const sanitized = require_redact.redactSensitiveText(message, { mode: "tools" }).replace(/\s+/gu, " ").trim();
	if (!sanitized) return;
	return sanitized.length > MAX_SAFE_ERROR_MESSAGE_LENGTH ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(sanitized, MAX_SAFE_ERROR_MESSAGE_LENGTH)}...` : sanitized;
}
function readSafeErrorMetadata(error) {
	const name = readErrorName(error);
	const code = readErrorCode(error);
	const message = readErrorMessage(error);
	if (!name && !code && !message) return;
	return {
		...name ? { name } : {},
		...code ? { code } : {},
		...message ? { message } : {}
	};
}
function resolveDiagnosticStabilityBundleDir(options = {}) {
	return node_path.default.join(options.stateDir ?? require_paths.resolveStateDir(options.env ?? node_process.default.env), "logs", "stability");
}
function buildBundlePath(dir, now, reason) {
	return node_path.default.join(dir, `${BUNDLE_PREFIX}${formatBundleTimestamp(now)}-${node_process.default.pid}-${normalizeReason(reason)}${BUNDLE_SUFFIX}`);
}
function isBundleFile(name) {
	return name.startsWith(BUNDLE_PREFIX) && name.endsWith(BUNDLE_SUFFIX);
}
function readPositiveMemoryFile(file) {
	try {
		const raw = node_fs.default.readFileSync(file, "utf8").trim();
		if (raw === "max") return "max";
		return require_parse_finite_number.parseStrictNonNegativeInteger(raw);
	} catch {
		return;
	}
}
function readCgroupEventFile(file) {
	try {
		const events = {};
		for (const line of node_fs.default.readFileSync(file, "utf8").split(/\r?\n/u)) {
			const [key, raw] = line.trim().split(/\s+/u);
			if (!key || !SAFE_REASON_CODE.test(key)) continue;
			const value = require_parse_finite_number.parseStrictNonNegativeInteger(raw ?? "");
			if (value !== void 0) events[key] = value;
		}
		return events;
	} catch {
		return {};
	}
}
function resolveCgroupV2MemoryDir() {
	if (node_process.default.platform !== "linux") return;
	try {
		const line = node_fs.default.readFileSync("/proc/self/cgroup", "utf8").split(/\r?\n/u).find((entry) => entry.startsWith("0::"));
		if (!line) return;
		const relative = line.slice(3).trim().replace(/^\/+/u, "");
		return node_path.default.join("/sys/fs/cgroup", relative);
	} catch {
		return;
	}
}
function collectCgroupMemorySummary() {
	const dir = resolveCgroupV2MemoryDir();
	if (!dir) return;
	const values = {};
	for (const name of CGROUP_V2_MEMORY_FILES) {
		const value = readPositiveMemoryFile(node_path.default.join(dir, `memory.${name}`));
		if (value !== void 0) values[name] = value;
	}
	const events = {};
	for (const name of CGROUP_V2_MEMORY_EVENTS) {
		const parsed = readCgroupEventFile(node_path.default.join(dir, `memory.${name}`));
		for (const [key, value] of Object.entries(parsed)) events[name === "events" ? key : `${name}.${key}`] = value;
	}
	return Object.keys(values).length > 0 || Object.keys(events).length > 0 ? {
		version: "v2",
		values,
		events
	} : void 0;
}
function collectHeapStatistics() {
	try {
		const stats = node_v8.default.getHeapStatistics();
		return {
			totalHeapSizeBytes: stats.total_heap_size,
			totalHeapSizeExecutableBytes: stats.total_heap_size_executable,
			totalPhysicalSizeBytes: stats.total_physical_size,
			totalAvailableSizeBytes: stats.total_available_size,
			usedHeapSizeBytes: stats.used_heap_size,
			heapSizeLimitBytes: stats.heap_size_limit,
			mallocedMemoryBytes: stats.malloced_memory,
			externalMemoryBytes: stats.external_memory
		};
	} catch {
		return;
	}
}
function collectHeapSpaces() {
	try {
		const spaces = node_v8.default.getHeapSpaceStatistics().map((space) => ({
			spaceName: space.space_name,
			spaceSizeBytes: space.space_size,
			spaceUsedBytes: space.space_used_size,
			spaceAvailableBytes: space.space_available_size,
			physicalSpaceSizeBytes: space.physical_space_size
		}));
		return spaces.length > 0 ? spaces : void 0;
	} catch {
		return;
	}
}
function collectActiveResources() {
	try {
		if (typeof node_process.default.getActiveResourcesInfo !== "function") return;
		const names = node_process.default.getActiveResourcesInfo();
		const byType = {};
		for (const name of names) {
			if (!SAFE_REASON_CODE.test(name)) continue;
			byType[name] = (byType[name] ?? 0) + 1;
		}
		const sorted = Object.entries(byType).toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, MAX_ACTIVE_RESOURCE_TYPES);
		return {
			total: names.length,
			byType: Object.fromEntries(sorted)
		};
	} catch {
		return;
	}
}
function sanitizeSessionEvidencePath(relativePath) {
	const parts = relativePath.split("/");
	if (parts.length === 4 && parts[0] === "agents" && parts[2] === "sessions") return `agents/<agent>/sessions/${sanitizeSessionEvidenceFileName((0, _gabrielvfonseca_normalization_core.expectDefined)(parts[3], "parts entry at 3"))}`;
	if (parts.length === 2 && parts[0] === "sessions") return `sessions/${sanitizeSessionEvidenceFileName((0, _gabrielvfonseca_normalization_core.expectDefined)(parts[1], "parts entry at 1"))}`;
	return require_redact.redactSensitiveText(relativePath, { mode: "tools" });
}
function sanitizeSessionEvidenceFileName(fileName) {
	if (fileName === "sessions.json") return "sessions.json";
	if (fileName.endsWith(".jsonl")) return "<session>.jsonl";
	if (fileName.endsWith(".json")) return "<session>.json";
	return "<session>";
}
function visitDirentsBounded(dir, maxEntries, visitor) {
	if (maxEntries <= 0) return;
	let handle;
	try {
		handle = node_fs.default.opendirSync(dir);
		for (let count = 0; count < maxEntries; count += 1) {
			const entry = handle.readSync();
			if (!entry || visitor(entry) === false) return;
		}
	} catch {} finally {
		try {
			handle?.closeSync();
		} catch {}
	}
}
function pushSessionFileSummary(results, stateDir, file, relativePathOverride) {
	try {
		const stat = node_fs.default.statSync(file);
		if (!stat.isFile()) return;
		const relativePath = (relativePathOverride ?? node_path.default.relative(stateDir, file)).replace(/\\/gu, "/");
		if (relativePath.startsWith("../") || node_path.default.isAbsolute(relativePath)) return;
		results.push({
			relativePath: sanitizeSessionEvidencePath(relativePath),
			sizeBytes: stat.size,
			mtimeMs: stat.mtimeMs
		});
	} catch {}
}
function scanSessionDirectory(params) {
	const sessionsDir = node_path.default.resolve(params.sessionsDir);
	if (params.seenDirs.has(sessionsDir)) return;
	params.seenDirs.add(sessionsDir);
	visitDirentsBounded(sessionsDir, MAX_SESSION_SCAN_FILES - params.scannedSessionEntries.count, (sessionEntry) => {
		params.scannedSessionEntries.count += 1;
		if (!sessionEntry.isFile() || !/\.(?:jsonl|json)$/u.test(sessionEntry.name)) return params.scannedSessionEntries.count < MAX_SESSION_SCAN_FILES;
		pushSessionFileSummary(params.results, params.stateDir, node_path.default.join(sessionsDir, sessionEntry.name), node_path.default.posix.join(params.relativePrefix, sessionEntry.name));
		return params.scannedSessionEntries.count < MAX_SESSION_SCAN_FILES;
	});
}
function collectTopSessionFiles(stateDir, sessionStorePaths = []) {
	const results = [];
	const seenDirs = /* @__PURE__ */ new Set();
	const scannedSessionEntries = { count: 0 };
	try {
		pushSessionFileSummary(results, stateDir, node_path.default.join(stateDir, "sessions.json"));
		const agentsDir = node_path.default.join(stateDir, "agents");
		visitDirentsBounded(agentsDir, MAX_SESSION_SCAN_AGENTS, (agentEntry) => {
			if (!agentEntry.isDirectory() || scannedSessionEntries.count >= MAX_SESSION_SCAN_FILES) return;
			scanSessionDirectory({
				results,
				stateDir,
				sessionsDir: node_path.default.join(agentsDir, agentEntry.name, "sessions"),
				relativePrefix: node_path.default.posix.join("agents", agentEntry.name, "sessions"),
				seenDirs,
				scannedSessionEntries
			});
		});
		for (const storePath of sessionStorePaths) {
			if (scannedSessionEntries.count >= MAX_SESSION_SCAN_FILES) break;
			scanSessionDirectory({
				results,
				stateDir,
				sessionsDir: node_path.default.dirname(node_path.default.resolve(storePath)),
				relativePrefix: "sessions",
				seenDirs,
				scannedSessionEntries
			});
		}
	} catch {}
	const top = results.toSorted((a, b) => b.sizeBytes - a.sizeBytes || a.relativePath.localeCompare(b.relativePath)).slice(0, MAX_SESSION_FILE_RESULTS);
	return top.length > 0 ? top : void 0;
}
function buildMemoryPressureEvidence(options) {
	const stateDir = options.stateDir ?? require_paths.resolveStateDir(options.env ?? node_process.default.env);
	const heapStatistics = collectHeapStatistics();
	const heapSpaces = collectHeapSpaces();
	const cgroup = collectCgroupMemorySummary();
	const activeResources = collectActiveResources();
	const topSessionFiles = collectTopSessionFiles(stateDir, options.sessionStorePaths);
	return { memoryPressure: {
		level: options.pressure.level,
		reason: options.pressure.reason,
		memory: options.pressure.memory,
		...options.pressure.thresholdBytes !== void 0 ? { thresholdBytes: options.pressure.thresholdBytes } : {},
		...options.pressure.rssGrowthBytes !== void 0 ? { rssGrowthBytes: options.pressure.rssGrowthBytes } : {},
		...options.pressure.windowMs !== void 0 ? { windowMs: options.pressure.windowMs } : {},
		...heapStatistics ? { heapStatistics } : {},
		...heapSpaces ? { heapSpaces } : {},
		...cgroup ? { cgroup } : {},
		...activeResources ? { activeResources } : {},
		...topSessionFiles ? { topSessionFiles } : {}
	} };
}
function pruneOldBundles(dir, retention) {
	if (!Number.isFinite(retention) || retention < 1) return;
	try {
		const entries = node_fs.default.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isFile() && isBundleFile(entry.name)).map((entry) => {
			const file = node_path.default.join(dir, entry.name);
			let mtimeMs = 0;
			try {
				mtimeMs = node_fs.default.statSync(file).mtimeMs;
			} catch {}
			return {
				file,
				mtimeMs
			};
		}).toSorted((a, b) => b.mtimeMs - a.mtimeMs || b.file.localeCompare(a.file));
		for (const entry of entries.slice(retention)) try {
			node_fs.default.unlinkSync(entry.file);
		} catch {}
	} catch {}
}
function writeDiagnosticStabilityBundleSync(options) {
	try {
		const now = options.now ?? /* @__PURE__ */ new Date();
		const snapshot = require_diagnostic_stability.getDiagnosticStabilitySnapshot({ limit: options.limit ?? DEFAULT_DIAGNOSTIC_STABILITY_BUNDLE_LIMIT });
		if (!options.includeEmpty && snapshot.count === 0) return {
			status: "skipped",
			reason: "empty"
		};
		const reason = normalizeReason(options.reason);
		const error = options.error ? readSafeErrorMetadata(options.error) : void 0;
		const bundle = {
			version: 1,
			generatedAt: now.toISOString(),
			reason,
			process: {
				pid: node_process.default.pid,
				platform: node_process.default.platform,
				arch: node_process.default.arch,
				node: node_process.default.versions.node,
				uptimeMs: Math.round(node_process.default.uptime() * 1e3)
			},
			host: { hostname: REDACTED_HOSTNAME },
			...error ? { error } : {},
			...options.evidence ? { evidence: options.evidence } : {},
			snapshot
		};
		const dir = resolveDiagnosticStabilityBundleDir(options);
		const file = buildBundlePath(dir, now, reason);
		(0, _openclaw_fs_safe_atomic.replaceFileAtomicSync)({
			filePath: file,
			content: `${JSON.stringify(bundle, null, 2)}\n`,
			dirMode: 448,
			mode: 384,
			tempPrefix: ".operator-stability"
		});
		pruneOldBundles(dir, options.retention ?? DEFAULT_DIAGNOSTIC_STABILITY_BUNDLE_RETENTION);
		return {
			status: "written",
			path: file,
			bundle
		};
	} catch (error) {
		return {
			status: "failed",
			error
		};
	}
}
function writeDiagnosticMemoryPressureBundleSync(options) {
	return writeDiagnosticStabilityBundleSync({
		...options,
		reason: "diagnostic.memory.pressure.critical",
		includeEmpty: true,
		evidence: buildMemoryPressureEvidence(options)
	});
}
function writeDiagnosticStabilityBundleForFailureSync(reason, error, options = {}) {
	const result = writeDiagnosticStabilityBundleSync({
		...options,
		reason,
		error,
		includeEmpty: true
	});
	if (result.status === "written") return {
		status: "written",
		path: result.path,
		message: `wrote stability bundle: ${result.path}`
	};
	if (result.status === "failed") return {
		status: "failed",
		error: result.error,
		message: `failed to write stability bundle: ${String(result.error)}`
	};
	return result;
}
function installDiagnosticStabilityFatalHook(options = {}) {
	if (fatalHookUnsubscribe) return;
	fatalHookUnsubscribe = registerFatalErrorHook(({ reason, error }) => {
		const result = writeDiagnosticStabilityBundleForFailureSync(reason, error, options);
		return "message" in result ? result.message : void 0;
	});
}
function uninstallDiagnosticStabilityFatalHook() {
	fatalHookUnsubscribe?.();
	fatalHookUnsubscribe = null;
}
//#endregion
//#region src/logging/diagnostic-memory.ts
const MB = 1024 * 1024;
const DEFAULT_RSS_WARNING_BYTES = 1536 * MB;
const DEFAULT_RSS_CRITICAL_BYTES = 3072 * MB;
const DEFAULT_HEAP_WARNING_BYTES = 1024 * MB;
const DEFAULT_HEAP_CRITICAL_BYTES = 2048 * MB;
const DEFAULT_RSS_GROWTH_WARNING_BYTES = 512 * MB;
const DEFAULT_RSS_GROWTH_CRITICAL_BYTES = 1024 * MB;
const DEFAULT_GROWTH_WINDOW_MS = 600 * 1e3;
const DEFAULT_PRESSURE_REPEAT_MS = 300 * 1e3;
const BYTE_UNITS = [
	"B",
	"KiB",
	"MiB",
	"GiB",
	"TiB"
];
const log = require_subsystem.createSubsystemLogger("gateway").child("diagnostics/memory");
const state = {
	lastSample: null,
	lastPressureAtByKey: /* @__PURE__ */ new Map()
};
function normalizeMemoryUsage(memory) {
	return {
		rssBytes: memory.rss,
		heapTotalBytes: memory.heapTotal,
		heapUsedBytes: memory.heapUsed,
		externalBytes: memory.external,
		arrayBuffersBytes: memory.arrayBuffers
	};
}
function resolveThresholds(thresholds) {
	return {
		rssWarningBytes: thresholds?.rssWarningBytes ?? DEFAULT_RSS_WARNING_BYTES,
		rssCriticalBytes: thresholds?.rssCriticalBytes ?? DEFAULT_RSS_CRITICAL_BYTES,
		heapUsedWarningBytes: thresholds?.heapUsedWarningBytes ?? DEFAULT_HEAP_WARNING_BYTES,
		heapUsedCriticalBytes: thresholds?.heapUsedCriticalBytes ?? DEFAULT_HEAP_CRITICAL_BYTES,
		rssGrowthWarningBytes: thresholds?.rssGrowthWarningBytes ?? DEFAULT_RSS_GROWTH_WARNING_BYTES,
		rssGrowthCriticalBytes: thresholds?.rssGrowthCriticalBytes ?? DEFAULT_RSS_GROWTH_CRITICAL_BYTES,
		growthWindowMs: thresholds?.growthWindowMs ?? DEFAULT_GROWTH_WINDOW_MS,
		pressureRepeatMs: thresholds?.pressureRepeatMs ?? DEFAULT_PRESSURE_REPEAT_MS
	};
}
function pickThresholdPressure(params) {
	const { memory, thresholds } = params;
	if (memory.rssBytes >= thresholds.rssCriticalBytes) return {
		level: "critical",
		reason: "rss_threshold",
		memory,
		thresholdBytes: thresholds.rssCriticalBytes
	};
	if (memory.heapUsedBytes >= thresholds.heapUsedCriticalBytes) return {
		level: "critical",
		reason: "heap_threshold",
		memory,
		thresholdBytes: thresholds.heapUsedCriticalBytes
	};
	if (memory.rssBytes >= thresholds.rssWarningBytes) return {
		level: "warning",
		reason: "rss_threshold",
		memory,
		thresholdBytes: thresholds.rssWarningBytes
	};
	if (memory.heapUsedBytes >= thresholds.heapUsedWarningBytes) return {
		level: "warning",
		reason: "heap_threshold",
		memory,
		thresholdBytes: thresholds.heapUsedWarningBytes
	};
	return null;
}
function pickGrowthPressure(params) {
	const { previous, current, thresholds } = params;
	if (!previous) return null;
	const windowMs = current.ts - previous.ts;
	if (windowMs <= 0 || windowMs > thresholds.growthWindowMs) return null;
	const rssGrowthBytes = current.memory.rssBytes - previous.memory.rssBytes;
	if (rssGrowthBytes >= thresholds.rssGrowthCriticalBytes) return {
		level: "critical",
		reason: "rss_growth",
		memory: current.memory,
		thresholdBytes: thresholds.rssGrowthCriticalBytes,
		rssGrowthBytes,
		windowMs
	};
	if (rssGrowthBytes >= thresholds.rssGrowthWarningBytes) return {
		level: "warning",
		reason: "rss_growth",
		memory: current.memory,
		thresholdBytes: thresholds.rssGrowthWarningBytes,
		rssGrowthBytes,
		windowMs
	};
	return null;
}
function shouldEmitPressure(pressure, now, repeatMs) {
	const key = `${pressure.level}:${pressure.reason}`;
	const lastAt = state.lastPressureAtByKey.get(key);
	if (lastAt !== void 0 && now - lastAt < repeatMs) return false;
	state.lastPressureAtByKey.set(key, now);
	return true;
}
function formatOptionalPressureMetric(label, value) {
	return typeof value === "number" && Number.isFinite(value) ? ` ${label}=${value}` : "";
}
function formatScaledNumber(value) {
	return (value >= 10 ? value.toFixed(1) : value.toFixed(2)).replace(/\.0+$/u, "").replace(/(\.\d*[1-9])0$/u, "$1");
}
function formatReadableBytes(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return;
	let scaled = value;
	let unitIndex = 0;
	while (scaled >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
		scaled /= 1024;
		unitIndex++;
	}
	return unitIndex === 0 ? `${Math.round(scaled)} ${BYTE_UNITS[unitIndex]}` : `${formatScaledNumber(scaled)} ${BYTE_UNITS[unitIndex]}`;
}
function formatPressureRatio(params) {
	const { pressure, thresholdBytes } = params;
	if (!Number.isFinite(thresholdBytes) || thresholdBytes <= 0) return;
	const value = pressure.reason === "heap_threshold" ? pressure.memory.heapUsedBytes : pressure.reason === "rss_growth" ? pressure.rssGrowthBytes : pressure.memory.rssBytes;
	if (typeof value !== "number" || !Number.isFinite(value)) return;
	return `${formatScaledNumber(value / thresholdBytes * 100)}%`;
}
function formatPressureSummary(pressure) {
	return [
		`rss=${formatReadableBytes(pressure.memory.rssBytes)}`,
		`heap=${formatReadableBytes(pressure.memory.heapUsedBytes)}`,
		pressure.thresholdBytes !== void 0 ? `threshold=${formatReadableBytes(pressure.thresholdBytes)}` : "",
		pressure.thresholdBytes !== void 0 ? `thresholdRatio=${formatPressureRatio({
			pressure,
			thresholdBytes: pressure.thresholdBytes
		})}` : "",
		pressure.rssGrowthBytes !== void 0 ? `rssGrowth=${formatReadableBytes(pressure.rssGrowthBytes)}` : ""
	].filter((part) => Boolean(part)).join(" ");
}
function formatPressureNextStep(pressure) {
	return pressure.level === "critical" ? "nextStep=inspect latest stability bundle or run operator gateway diagnostics export; restart gateway if process is unstable" : "nextStep=run operator gateway status --deep and operator gateway diagnostics export; restart gateway if pressure persists";
}
function logMemoryPressure(params) {
	const { pressure } = params;
	const message = `memory pressure: level=${pressure.level} reason=${pressure.reason} ${formatPressureSummary(pressure)} rssBytes=${pressure.memory.rssBytes} heapUsedBytes=${pressure.memory.heapUsedBytes}` + formatOptionalPressureMetric("thresholdBytes", pressure.thresholdBytes) + formatOptionalPressureMetric("rssGrowthBytes", pressure.rssGrowthBytes) + formatOptionalPressureMetric("windowMs", pressure.windowMs) + (pressure.level === "critical" ? ` memoryPressureSnapshot=${params.writeCriticalBundle ? "enabled" : "disabled"}` : "") + ` ${formatPressureNextStep(pressure)}`;
	log.warn(message);
}
function emitDiagnosticMemorySample(options) {
	const now = options?.now ?? Date.now();
	const memory = normalizeMemoryUsage(options?.memoryUsage ?? process.memoryUsage());
	const current = {
		ts: now,
		memory
	};
	const thresholds = resolveThresholds(options?.thresholds);
	if (options?.emitSample !== false) require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "diagnostic.memory.sample",
		memory,
		uptimeMs: options?.uptimeMs ?? Math.round(process.uptime() * 1e3)
	});
	const pressure = pickThresholdPressure({
		memory,
		thresholds
	}) ?? pickGrowthPressure({
		previous: state.lastSample,
		current,
		thresholds
	});
	state.lastSample = current;
	if (pressure && shouldEmitPressure(pressure, now, thresholds.pressureRepeatMs)) {
		require_diagnostic_events.emitInternalDiagnosticEvent({
			type: "diagnostic.memory.pressure",
			...pressure
		});
		const writeCriticalBundle = options?.writeCriticalBundle === true;
		logMemoryPressure({
			pressure,
			writeCriticalBundle
		});
		if (pressure.level === "critical" && writeCriticalBundle) {
			const sessionStorePaths = options?.sessionStorePaths ?? options?.resolveSessionStorePaths?.();
			const result = writeDiagnosticMemoryPressureBundleSync({
				pressure,
				stateDir: options?.stateDir,
				sessionStorePaths,
				now: new Date(now)
			});
			if (result.status === "written") log.warn(`critical memory pressure bundle written: path=${result.path} reason=${pressure.reason} level=${pressure.level}`);
			else if (result.status === "failed") log.warn(`critical memory pressure bundle failed: ${String(result.error)}`);
		} else if (pressure.level === "critical") log.warn("critical memory pressure snapshot disabled: diagnostics.memoryPressureSnapshot=false");
	}
	return memory;
}
//#endregion
//#region src/logging/diagnostic-phase.ts
const RECENT_PHASE_CAPACITY = 40;
let activePhaseStack = [];
let recentPhases = [];
function roundMetric(value, digits = 1) {
	if (!Number.isFinite(value)) return 0;
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}
function pushRecentPhase(snapshot) {
	recentPhases.push(snapshot);
	if (recentPhases.length > RECENT_PHASE_CAPACITY) recentPhases = recentPhases.slice(-40);
}
function getCurrentDiagnosticPhase() {
	return activePhaseStack.at(-1)?.name;
}
function resolveRecentPhaseLimit(limit) {
	if (!Number.isFinite(limit) || limit <= 0) return null;
	return Math.floor(limit);
}
function getRecentDiagnosticPhases(limit = 8) {
	const resolved = resolveRecentPhaseLimit(limit);
	if (resolved === null) return [];
	return recentPhases.slice(-resolved).map((phase) => Object.assign({}, phase));
}
/** Records a completed phase in memory and emits it when diagnostics are enabled. */
function recordDiagnosticPhase(snapshot) {
	pushRecentPhase(snapshot);
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	require_diagnostic_events.emitDiagnosticEvent({
		type: "diagnostic.phase.completed",
		...snapshot
	});
}
/** Runs work inside a measured diagnostic phase with wall-clock and CPU metrics. */
async function withDiagnosticPhase(name, run, details) {
	const active = {
		name,
		startedAt: Date.now(),
		startedWallMs: node_perf_hooks.performance.now(),
		cpuStarted: process.cpuUsage(),
		details
	};
	activePhaseStack.push(active);
	try {
		return await run();
	} finally {
		const endedAt = Date.now();
		const durationMs = roundMetric(node_perf_hooks.performance.now() - active.startedWallMs, 1);
		const cpu = process.cpuUsage(active.cpuStarted);
		const cpuUserMs = roundMetric(cpu.user / 1e3, 1);
		const cpuSystemMs = roundMetric(cpu.system / 1e3, 1);
		const cpuTotalMs = roundMetric(cpuUserMs + cpuSystemMs, 1);
		activePhaseStack = activePhaseStack.filter((entry) => entry !== active);
		recordDiagnosticPhase({
			name,
			startedAt: active.startedAt,
			endedAt,
			durationMs,
			cpuUserMs,
			cpuSystemMs,
			cpuTotalMs,
			cpuCoreRatio: roundMetric(cpuTotalMs / Math.max(1, durationMs), 3),
			details: active.details
		});
	}
}
//#endregion
//#region src/logging/diagnostic-session-attention.ts
function classifySessionAttention(params) {
	if (params.activity.activeWorkKind) {
		const lastProgressAgeMs = params.activity.lastProgressAgeMs ?? 0;
		if (params.state === "idle" && params.queueDepth > 0 && params.activity.hasActiveEmbeddedRun !== true && lastProgressAgeMs > params.staleMs) return {
			eventType: "session.stuck",
			reason: "queued_work_without_active_run",
			classification: "stale_session_state",
			recoveryEligible: true
		};
		if (params.activity.activeWorkKind === "tool_call" && (params.activity.activeToolAgeMs ?? 0) > params.staleMs && lastProgressAgeMs > params.staleMs) return {
			eventType: "session.stalled",
			reason: "blocked_tool_call",
			classification: "blocked_tool_call",
			activeWorkKind: params.activity.activeWorkKind,
			recoveryEligible: false
		};
		if (params.queueDepth > 0 && params.activity.activeWorkKind === "embedded_run" && isTerminalDiagnosticProgressReason(params.activity.lastProgressReason)) return {
			eventType: "session.stalled",
			reason: "queued_behind_terminal_active_work",
			classification: "stalled_agent_run",
			activeWorkKind: params.activity.activeWorkKind,
			recoveryEligible: false
		};
		if (params.activity.activeWorkKind === "model_call" && params.activity.hasActiveEmbeddedRun === true && lastProgressAgeMs > params.staleMs) {
			if (typeof params.stuckSessionAbortMs === "number" && lastProgressAgeMs >= params.stuckSessionAbortMs) return {
				eventType: "session.stalled",
				reason: "active_work_without_progress",
				classification: "stalled_agent_run",
				activeWorkKind: params.activity.activeWorkKind,
				recoveryEligible: false
			};
			return {
				eventType: "session.long_running",
				reason: "active_model_call_without_progress",
				classification: "long_running",
				activeWorkKind: params.activity.activeWorkKind,
				recoveryEligible: false
			};
		}
		if (lastProgressAgeMs > params.staleMs) return {
			eventType: "session.stalled",
			reason: "active_work_without_progress",
			classification: "stalled_agent_run",
			activeWorkKind: params.activity.activeWorkKind,
			recoveryEligible: false
		};
		return {
			eventType: "session.long_running",
			reason: params.queueDepth > 0 ? "queued_behind_active_work" : "active_work",
			classification: "long_running",
			activeWorkKind: params.activity.activeWorkKind,
			recoveryEligible: false
		};
	}
	return {
		eventType: "session.stuck",
		reason: params.queueDepth > 0 ? "queued_work_without_active_run" : "stale_session_state",
		classification: "stale_session_state",
		recoveryEligible: true
	};
}
function isTerminalDiagnosticProgressReason(reason) {
	if (!reason) return false;
	return reason === "run:completed" || reason === "embedded_run:ended" || reason.includes("response.completed") || reason.includes("rawResponseItem/completed") || reason.includes("raw_response_item.completed") || reason.includes("output_item.done");
}
//#endregion
//#region src/logging/diagnostic-session-context.ts
const SESSION_TAIL_BYTES = 64 * 1024;
const MAX_QUOTED_FIELD_CHARS = 140;
function quoteLogField(value) {
	const oneLine = value.replace(/\s+/g, " ").trim();
	return `"${(oneLine.length > MAX_QUOTED_FIELD_CHARS ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(oneLine, Math.max(0, MAX_QUOTED_FIELD_CHARS - 3))}...` : oneLine).replace(/["\\]/g, "\\$&")}"`;
}
function parseCronRunSessionKey(sessionKey) {
	const parts = sessionKey?.trim().split(":") ?? [];
	if (parts[0] !== "agent") return {};
	const cronIndex = parts.indexOf("cron");
	if (cronIndex < 2) return {};
	const runIndex = parts.indexOf("run", cronIndex + 2);
	return {
		agentId: parts[1],
		cronJobId: parts[cronIndex + 1],
		cronRunId: runIndex >= 0 ? parts[runIndex + 1] : void 0
	};
}
function resolveSessionFile(params) {
	const agentId = params.agentId?.trim();
	const runId = params.activeSessionId?.trim() || params.cronRunId?.trim();
	if (!agentId || !runId) return;
	return node_path.default.join(require_paths.resolveStateDir(), "agents", agentId, "sessions", `${runId}.jsonl`);
}
function readTailText(filePath) {
	let fd;
	try {
		const stat = node_fs.default.statSync(filePath);
		if (!stat.isFile() || stat.size <= 0) return;
		const length = Math.min(stat.size, SESSION_TAIL_BYTES);
		const start = Math.max(0, stat.size - length);
		const buffer = Buffer.alloc(length);
		fd = node_fs.default.openSync(filePath, "r");
		const read = node_fs.default.readSync(fd, buffer, 0, length, start);
		return {
			text: buffer.subarray(0, read).toString("utf8"),
			truncated: start > 0
		};
	} catch {
		return;
	} finally {
		if (fd !== void 0) try {
			node_fs.default.closeSync(fd);
		} catch {}
	}
}
function textFromContent(content) {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return;
	const texts = content.map((part) => {
		if (!part || typeof part !== "object") return;
		const text = part.text;
		return typeof text === "string" ? text : void 0;
	}).filter((text) => Boolean(text?.trim()));
	return texts.length ? texts.join(" ") : void 0;
}
function readLastAssistantFromSessionFile(filePath) {
	if (!filePath) return;
	const tail = readTailText(filePath);
	if (!tail?.text) return;
	const lines = tail.text.split(/\r?\n/).filter(Boolean);
	if (tail.truncated && lines.length > 0) lines.shift();
	for (let index = lines.length - 1; index >= 0; index -= 1) try {
		const parsed = JSON.parse((0, _gabrielvfonseca_normalization_core.expectDefined)(lines[index], "lines entry at index"));
		if (parsed.message?.role !== "assistant") continue;
		const text = textFromContent(parsed.message.content)?.trim();
		if (text) return text;
	} catch {}
}
function readCronJobName(cronJobId) {
	if (!cronJobId) return;
	try {
		const job = require_store.loadCronJobsStoreSync(require_store.resolveCronJobsStorePath()).jobs.find((entry) => entry.id === cronJobId);
		return typeof job?.name === "string" && job.name.trim() ? job.name.trim() : void 0;
	} catch {
		return;
	}
}
function resolveCronSessionDiagnosticContext(params) {
	const parsed = parseCronRunSessionKey(params.sessionKey);
	if (!parsed.cronJobId && !parsed.cronRunId) return {};
	return {
		...parsed,
		cronJobName: readCronJobName(parsed.cronJobId),
		lastAssistant: readLastAssistantFromSessionFile(resolveSessionFile({
			...parsed,
			activeSessionId: params.activeSessionId
		}))
	};
}
function formatCronSessionDiagnosticFields(context) {
	const fields = [];
	if (context.cronJobId) fields.push(`cronJobId=${context.cronJobId}`);
	if (context.cronRunId) fields.push(`cronRunId=${context.cronRunId}`);
	if (context.cronJobName) fields.push(`cronJob=${quoteLogField(context.cronJobName)}`);
	if (context.lastAssistant) fields.push(`lastAssistant=${quoteLogField(context.lastAssistant)}`);
	return fields.join(" ");
}
function formatStoppedCronSessionDiagnosticFields(context) {
	const fields = [];
	if (context.cronJobName) fields.push(`stopped=${quoteLogField(context.cronJobName)}`);
	const rest = formatCronSessionDiagnosticFields({
		cronJobId: context.cronJobId,
		cronRunId: context.cronRunId,
		lastAssistant: context.lastAssistant
	});
	if (rest) fields.push(rest);
	return fields.join(" ");
}
//#endregion
//#region src/logging/diagnostic-session-recovery.ts
function resolveStuckSessionRecoveryRef(params) {
	return params.sessionKey?.trim() || params.sessionId?.trim() || void 0;
}
function recoveryOutcomeMutatesSessionState(outcome) {
	if (!outcome) return false;
	return outcome.status === "aborted" || outcome.status === "released" || outcome.status === "noop" && outcome.reason === "no_active_work";
}
function recoveryOutcomeClearsQueuedSessionState(outcome) {
	return outcome.status === "released" || outcome.status === "aborted" && outcome.released > 0 && (outcome.queuedCount ?? 0) === 0 || outcome.status === "noop" && outcome.reason === "no_active_work";
}
function recoveryOutcomeReleasedCount(outcome) {
	return "released" in outcome ? outcome.released : 0;
}
function formatRecoveryOutcome(outcome) {
	const fields = [
		`status=${outcome.status}`,
		`action=${outcome.action}`,
		`sessionId=${outcome.sessionId ?? outcome.activeSessionId ?? "unknown"}`,
		`sessionKey=${outcome.sessionKey ?? "unknown"}`
	];
	if (outcome.activeSessionId) fields.push(`activeSessionId=${outcome.activeSessionId}`);
	if (outcome.activeWorkKind) fields.push(`activeWorkKind=${outcome.activeWorkKind}`);
	if (outcome.lane) fields.push(`lane=${outcome.lane}`);
	if ("reason" in outcome) fields.push(`reason=${outcome.reason}`);
	if ("aborted" in outcome) fields.push(`aborted=${outcome.aborted}`, `drained=${outcome.drained}`, `forceCleared=${outcome.forceCleared}`);
	if ("released" in outcome) fields.push(`released=${outcome.released}`);
	if ((outcome.status === "aborted" || outcome.status === "released") && outcome.queuedCount !== void 0) fields.push(`queuedCount=${outcome.queuedCount}`);
	if ("activeCount" in outcome && outcome.activeCount !== void 0) fields.push(`laneActive=${outcome.activeCount}`);
	if (outcome.status === "skipped" && outcome.queuedCount !== void 0) fields.push(`laneQueued=${outcome.queuedCount}`);
	if ("error" in outcome) fields.push(`error=${outcome.error}`);
	return fields.join(" ");
}
//#endregion
//#region src/logging/diagnostic-session-recovery-coordinator.ts
const recoveryRequestsInFlight = /* @__PURE__ */ new Set();
function emitSessionRecoveryRequested(params) {
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "session.recovery.requested",
		sessionId: params.request.sessionId,
		sessionKey: params.request.sessionKey,
		state: params.request.expectedState ?? "processing",
		stateGeneration: params.request.stateGeneration,
		ageMs: params.request.ageMs,
		queueDepth: params.request.queueDepth,
		reason: params.classification.reason,
		activeWorkKind: params.classification.activeWorkKind,
		allowActiveAbort: params.request.allowActiveAbort
	});
}
function emitSessionRecoveryCompleted(params) {
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "session.recovery.completed",
		sessionId: params.request.sessionId,
		sessionKey: params.request.sessionKey,
		state: params.request.expectedState ?? "processing",
		stateGeneration: params.request.stateGeneration,
		ageMs: params.request.ageMs,
		queueDepth: params.request.queueDepth,
		activeWorkKind: params.outcome.activeWorkKind,
		status: params.outcome.status,
		action: params.outcome.action,
		outcomeReason: "reason" in params.outcome ? params.outcome.reason : void 0,
		released: recoveryOutcomeReleasedCount(params.outcome) || void 0,
		stale: params.stale
	});
}
function recoveryRequestKey(request) {
	return resolveStuckSessionRecoveryRef(request);
}
function isRecoveryPromiseLike(value) {
	return typeof value?.then === "function";
}
function recoveryOutcomeHasQueuedLaneWork(outcome) {
	return outcome.status === "aborted" && (outcome.queuedCount ?? 0) > 0;
}
function applyRecoveryOutcomeToDiagnosticState(params) {
	if (!params.outcome) return;
	if (!recoveryOutcomeMutatesSessionState(params.outcome)) {
		emitSessionRecoveryCompleted({
			request: params.request,
			outcome: params.outcome
		});
		return;
	}
	const expectedState = params.request.expectedState ?? "processing";
	const currentState = require_diagnostic_session_state.peekDiagnosticSessionState(params.request);
	const currentGeneration = currentState?.generation ?? 0;
	const requestGeneration = params.request.stateGeneration ?? 0;
	if (!(expectedState === "idle" && params.request.stateGeneration !== void 0 && params.outcome.action === "abort_embedded_run" ? currentState?.state === "idle" && (currentGeneration === requestGeneration || currentGeneration === requestGeneration + 1) : require_diagnostic_session_state.isDiagnosticSessionStateCurrent({
		sessionId: params.request.sessionId,
		sessionKey: params.request.sessionKey,
		generation: params.request.stateGeneration,
		state: expectedState
	}))) {
		emitSessionRecoveryCompleted({
			request: params.request,
			outcome: params.outcome,
			stale: true
		});
		return;
	}
	const state = require_diagnostic_session_state.getDiagnosticSessionState(params.request);
	if (require_diagnostic_run_activity.clearDiagnosticEmbeddedRunActivityForSession({
		sessionId: state.sessionId,
		sessionKey: state.sessionKey,
		activeSessionId: params.outcome.activeSessionId,
		recoveryStartedAfterEmbeddedRunSequence: params.recoveryStartedAfterEmbeddedRunSequence,
		recoveryStartedAfterDiagnosticEventSequence: params.recoveryStartedAfterDiagnosticEventSequence
	}).blockedByActiveEmbeddedRun) {
		emitSessionRecoveryCompleted({
			request: params.request,
			outcome: params.outcome,
			stale: true
		});
		return;
	}
	const prevState = state.state;
	state.state = "idle";
	state.lastActivity = Date.now();
	state.generation = (state.generation ?? 0) + 1;
	state.lastStuckWarnAgeMs = void 0;
	state.lastLongRunningWarnAgeMs = void 0;
	const preserveQueuedIdleWork = params.request.expectedState === "idle" && recoveryOutcomeHasQueuedLaneWork(params.outcome);
	state.queueDepth = recoveryOutcomeClearsQueuedSessionState(params.outcome) ? 0 : preserveQueuedIdleWork ? Math.max(state.queueDepth, params.request.queueDepth ?? 0) : Math.max(0, state.queueDepth - 1);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "session.state",
		sessionId: state.sessionId,
		sessionKey: state.sessionKey,
		prevState,
		state: "idle",
		reason: `stuck_recovery:${params.outcome.status}`,
		queueDepth: state.queueDepth
	});
	emitSessionRecoveryCompleted({
		request: params.request,
		outcome: params.outcome
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function requestStuckSessionRecoveryOutcome(params) {
	const inFlightKey = recoveryRequestKey(params.request);
	if (inFlightKey && recoveryRequestsInFlight.has(inFlightKey)) {
		const outcome = {
			status: "skipped",
			action: "observe_only",
			reason: "already_in_flight",
			sessionId: params.request.sessionId,
			sessionKey: params.request.sessionKey,
			activeWorkKind: params.classification.activeWorkKind
		};
		emitSessionRecoveryCompleted({
			request: params.request,
			outcome
		});
		return Promise.resolve(outcome);
	}
	if (inFlightKey) recoveryRequestsInFlight.add(inFlightKey);
	emitSessionRecoveryRequested({
		request: params.request,
		classification: params.classification
	});
	const recoveryStartedAfterEmbeddedRunSequence = require_diagnostic_run_activity.getDiagnosticEmbeddedRunActivitySequence();
	const recoveryStartedAfterDiagnosticEventSequence = require_diagnostic_events.getInternalDiagnosticEventSequence();
	const clearInFlight = () => {
		if (inFlightKey) recoveryRequestsInFlight.delete(inFlightKey);
	};
	const completeRecovery = (outcome) => {
		applyRecoveryOutcomeToDiagnosticState({
			request: params.request,
			outcome,
			recoveryStartedAfterEmbeddedRunSequence,
			recoveryStartedAfterDiagnosticEventSequence
		});
		return outcome;
	};
	const failRecovery = (err) => {
		const outcome = {
			status: "failed",
			action: "none",
			reason: "exception",
			sessionId: params.request.sessionId,
			sessionKey: params.request.sessionKey,
			error: String(err)
		};
		applyRecoveryOutcomeToDiagnosticState({
			request: params.request,
			outcome,
			recoveryStartedAfterEmbeddedRunSequence,
			recoveryStartedAfterDiagnosticEventSequence
		});
		return outcome;
	};
	try {
		const result = params.recover(params.request);
		if (isRecoveryPromiseLike(result)) return result.then((outcome) => completeRecovery(outcome ?? void 0)).catch(failRecovery).finally(clearInFlight);
		const outcome = completeRecovery(result ?? void 0);
		clearInFlight();
		return Promise.resolve(outcome);
	} catch (err) {
		try {
			return Promise.resolve(failRecovery(err));
		} finally {
			clearInFlight();
		}
	}
}
function requestStuckSessionRecovery(params) {
	requestStuckSessionRecoveryOutcome(params);
}
//#endregion
//#region src/logging/diagnostic.ts
const webhookStats = {
	received: 0,
	processed: 0,
	errors: 0,
	lastReceived: 0
};
const DEFAULT_STUCK_SESSION_WARN_MS = 12e4;
const MIN_STUCK_SESSION_WARN_MS = 1e3;
const MAX_STUCK_SESSION_WARN_MS = 1440 * 60 * 1e3;
const MIN_STALLED_EMBEDDED_RUN_ABORT_MS = 5 * 6e4;
const STALLED_EMBEDDED_RUN_ABORT_WARN_MULTIPLIER = 3;
const RECENT_DIAGNOSTIC_ACTIVITY_MS = 12e4;
const DEFAULT_LIVENESS_EVENT_LOOP_DELAY_WARN_MS = 1e3;
const DEFAULT_LIVENESS_EVENT_LOOP_UTILIZATION_WARN = .95;
const DEFAULT_LIVENESS_CPU_CORE_RATIO_WARN = .9;
const DEFAULT_LIVENESS_WARN_COOLDOWN_MS = 12e4;
const DIAGNOSTIC_HEARTBEAT_INTERVAL_MS = 3e4;
const loadStuckSessionRecoveryRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./diagnostic-stuck-session-recovery.runtime-HPBBlP95.cjs")));
function resolveDiagnosticSessionStorePaths(config) {
	if (!config) return;
	try {
		const paths = require_targets.resolveAllAgentSessionStoreTargetsSync(config).map((target) => target.storePath);
		return paths.length > 0 ? paths : void 0;
	} catch {
		return;
	}
}
function shouldWriteCriticalMemoryPressureBundle(config) {
	return config?.diagnostics?.memoryPressureSnapshot === true;
}
let diagnosticLivenessMonitor = null;
let lastDiagnosticLivenessWallAt = 0;
let lastDiagnosticLivenessCpuUsage = null;
let lastDiagnosticLivenessEventLoopUtilization = null;
let lastDiagnosticLivenessEventAt = 0;
let lastDiagnosticLivenessWarnAt = 0;
const loadCommandPollBackoffRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./command-poll-backoff.runtime-YjGh6xpy.cjs")));
async function recoverStuckSession(params) {
	return loadStuckSessionRecoveryRuntime().then(({ recoverStuckDiagnosticSession }) => recoverStuckDiagnosticSession(params)).catch((err) => {
		require_diagnostic_runtime.diagnosticLogger.warn(`stuck session recovery unavailable: ${String(err)}`);
		return {
			status: "failed",
			action: "none",
			reason: "exception",
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			error: String(err)
		};
	});
}
function formatDiagnosticWorkLabel(state, now) {
	const label = state.sessionKey ?? state.sessionId ?? "unknown";
	const ageSeconds = Math.round(Math.max(0, now - state.lastActivity) / 1e3);
	const activity = require_diagnostic_run_activity.getDiagnosticSessionActivitySnapshot({
		sessionId: state.sessionId,
		sessionKey: state.sessionKey
	}, now);
	const workKind = activity.activeWorkKind ? `/${activity.activeWorkKind}` : "";
	const lastProgress = activity.lastProgressReason ? ` last=${activity.lastProgressReason}` : "";
	return `${label}(${state.state}${workKind},q=${state.queueDepth},age=${ageSeconds}s${lastProgress})`;
}
function pushLimitedDiagnosticLabel(labels, label, limit = 5) {
	if (labels.length < limit) labels.push(label);
}
function getDiagnosticWorkSnapshot(now = Date.now()) {
	let activeCount = 0;
	let waitingCount = 0;
	let queuedCount = 0;
	const activeLabels = [];
	const waitingLabels = [];
	const queuedLabels = [];
	for (const state of require_diagnostic_session_state.diagnosticSessionStates.values()) {
		if (state.state === "processing") {
			activeCount += 1;
			pushLimitedDiagnosticLabel(activeLabels, formatDiagnosticWorkLabel(state, now));
		} else if (state.state === "waiting") {
			waitingCount += 1;
			pushLimitedDiagnosticLabel(waitingLabels, formatDiagnosticWorkLabel(state, now));
		}
		const queuedBacklog = Math.max(0, state.queueDepth - (state.state === "processing" && state.activeQueuedTurn ? 1 : 0));
		if (queuedBacklog > 0) pushLimitedDiagnosticLabel(queuedLabels, formatDiagnosticWorkLabel(state, now));
		queuedCount += queuedBacklog;
	}
	return {
		activeCount,
		waitingCount,
		queuedCount,
		activeLabels,
		waitingLabels,
		queuedLabels
	};
}
function hasOpenDiagnosticWork(snapshot) {
	return snapshot.activeCount > 0 || snapshot.waitingCount > 0 || snapshot.queuedCount > 0;
}
function hasRecentDiagnosticActivity(now) {
	const lastActivityAt = require_diagnostic_runtime.getLastDiagnosticActivityAt();
	return lastActivityAt > 0 && now - lastActivityAt <= RECENT_DIAGNOSTIC_ACTIVITY_MS;
}
function roundDiagnosticMetric(value, digits = 3) {
	if (!Number.isFinite(value)) return 0;
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}
function nanosecondsToMilliseconds(value) {
	return roundDiagnosticMetric(value / 1e6, 1);
}
function formatOptionalDiagnosticMetric(value) {
	return value === void 0 ? "unknown" : String(value);
}
function startDiagnosticLivenessSampler() {
	lastDiagnosticLivenessWallAt = Date.now();
	lastDiagnosticLivenessCpuUsage = process.cpuUsage();
	lastDiagnosticLivenessEventLoopUtilization = node_perf_hooks.performance.eventLoopUtilization();
	lastDiagnosticLivenessEventAt = 0;
	lastDiagnosticLivenessWarnAt = 0;
	if (diagnosticLivenessMonitor) {
		diagnosticLivenessMonitor.reset();
		return;
	}
	try {
		diagnosticLivenessMonitor = (0, node_perf_hooks.monitorEventLoopDelay)({ resolution: 20 });
		diagnosticLivenessMonitor.enable();
		diagnosticLivenessMonitor.reset();
	} catch (err) {
		diagnosticLivenessMonitor = null;
		require_diagnostic_runtime.diagnosticLogger.debug(`diagnostic liveness monitor unavailable: ${String(err)}`);
	}
}
function stopDiagnosticLivenessSampler() {
	diagnosticLivenessMonitor?.disable();
	diagnosticLivenessMonitor = null;
	lastDiagnosticLivenessWallAt = 0;
	lastDiagnosticLivenessCpuUsage = null;
	lastDiagnosticLivenessEventLoopUtilization = null;
	lastDiagnosticLivenessEventAt = 0;
	lastDiagnosticLivenessWarnAt = 0;
}
function sampleDiagnosticLiveness(now) {
	if (!diagnosticLivenessMonitor || !lastDiagnosticLivenessCpuUsage || !lastDiagnosticLivenessEventLoopUtilization || lastDiagnosticLivenessWallAt <= 0) {
		startDiagnosticLivenessSampler();
		return null;
	}
	const intervalMs = Math.max(1, now - lastDiagnosticLivenessWallAt);
	const cpuUsage = process.cpuUsage(lastDiagnosticLivenessCpuUsage);
	const currentEventLoopUtilization = node_perf_hooks.performance.eventLoopUtilization();
	const eventLoopUtilization = node_perf_hooks.performance.eventLoopUtilization(currentEventLoopUtilization, lastDiagnosticLivenessEventLoopUtilization).utilization;
	const eventLoopDelayP99Ms = nanosecondsToMilliseconds(diagnosticLivenessMonitor.percentile(99));
	const eventLoopDelayMaxMs = nanosecondsToMilliseconds(diagnosticLivenessMonitor.max);
	diagnosticLivenessMonitor.reset();
	lastDiagnosticLivenessWallAt = now;
	lastDiagnosticLivenessCpuUsage = process.cpuUsage();
	lastDiagnosticLivenessEventLoopUtilization = currentEventLoopUtilization;
	const cpuUserMs = roundDiagnosticMetric(cpuUsage.user / 1e3, 1);
	const cpuSystemMs = roundDiagnosticMetric(cpuUsage.system / 1e3, 1);
	const cpuTotalMs = roundDiagnosticMetric(cpuUserMs + cpuSystemMs, 1);
	const cpuCoreRatio = roundDiagnosticMetric(cpuTotalMs / intervalMs, 3);
	const eventLoopUtilizationRatio = roundDiagnosticMetric(eventLoopUtilization, 3);
	const reasons = [];
	if (eventLoopDelayP99Ms >= DEFAULT_LIVENESS_EVENT_LOOP_DELAY_WARN_MS || eventLoopDelayMaxMs >= DEFAULT_LIVENESS_EVENT_LOOP_DELAY_WARN_MS) reasons.push("event_loop_delay");
	if (eventLoopUtilizationRatio >= DEFAULT_LIVENESS_EVENT_LOOP_UTILIZATION_WARN) reasons.push("event_loop_utilization");
	if (cpuCoreRatio >= DEFAULT_LIVENESS_CPU_CORE_RATIO_WARN) reasons.push("cpu");
	if (reasons.length === 0) return null;
	return {
		reasons,
		intervalMs,
		eventLoopDelayP99Ms,
		eventLoopDelayMaxMs,
		eventLoopUtilization: eventLoopUtilizationRatio,
		cpuUserMs,
		cpuSystemMs,
		cpuTotalMs,
		cpuCoreRatio
	};
}
function shouldEmitDiagnosticLivenessEvent(now) {
	if (lastDiagnosticLivenessEventAt > 0 && now - lastDiagnosticLivenessEventAt < DEFAULT_LIVENESS_WARN_COOLDOWN_MS) return false;
	lastDiagnosticLivenessEventAt = now;
	return true;
}
function shouldEmitDiagnosticLivenessWarning(now, work) {
	if (!hasOpenDiagnosticWork(work)) return false;
	if (lastDiagnosticLivenessWarnAt > 0 && now - lastDiagnosticLivenessWarnAt < DEFAULT_LIVENESS_WARN_COOLDOWN_MS) return false;
	lastDiagnosticLivenessWarnAt = now;
	return true;
}
function emitDiagnosticLivenessWarning(sample, work) {
	const phase = getCurrentDiagnosticPhase();
	const recentPhases = getRecentDiagnosticPhases(6);
	const recentPhaseSummary = formatRecentDiagnosticPhases(recentPhases);
	const workLabelSummary = formatDiagnosticWorkLabels(work);
	const message = `liveness warning: reasons=${sample.reasons.join(",")} interval=${Math.round(sample.intervalMs / 1e3)}s eventLoopDelayP99Ms=${formatOptionalDiagnosticMetric(sample.eventLoopDelayP99Ms)} eventLoopDelayMaxMs=${formatOptionalDiagnosticMetric(sample.eventLoopDelayMaxMs)} eventLoopUtilization=${formatOptionalDiagnosticMetric(sample.eventLoopUtilization)} cpuCoreRatio=${formatOptionalDiagnosticMetric(sample.cpuCoreRatio)} active=${work.activeCount} waiting=${work.waitingCount} queued=${work.queuedCount}${phase ? ` phase=${phase}` : ""}${recentPhaseSummary ? ` recentPhases=${recentPhaseSummary}` : ""}${workLabelSummary ? ` work=[${workLabelSummary}]` : ""}`;
	const hasBlockingWork = work.waitingCount > 0 || work.queuedCount > 0;
	const hasSustainedEventLoopDelay = (sample.eventLoopDelayP99Ms ?? 0) >= DEFAULT_LIVENESS_EVENT_LOOP_DELAY_WARN_MS;
	if (hasBlockingWork || hasOpenDiagnosticWork(work) && hasSustainedEventLoopDelay) require_diagnostic_runtime.diagnosticLogger.warn(message);
	else require_diagnostic_runtime.diagnosticLogger.debug(message);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "diagnostic.liveness.warning",
		reasons: sample.reasons,
		intervalMs: sample.intervalMs,
		eventLoopDelayP99Ms: sample.eventLoopDelayP99Ms,
		eventLoopDelayMaxMs: sample.eventLoopDelayMaxMs,
		eventLoopUtilization: sample.eventLoopUtilization,
		cpuUserMs: sample.cpuUserMs,
		cpuSystemMs: sample.cpuSystemMs,
		cpuTotalMs: sample.cpuTotalMs,
		cpuCoreRatio: sample.cpuCoreRatio,
		active: work.activeCount,
		waiting: work.waitingCount,
		queued: work.queuedCount,
		phase,
		recentPhases,
		activeWorkLabels: work.activeLabels,
		waitingWorkLabels: work.waitingLabels,
		queuedWorkLabels: work.queuedLabels
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function formatRecentDiagnosticPhases(phases) {
	return phases.map((phase) => `${phase.name}:${Math.round(phase.durationMs ?? 0)}ms`).join(",");
}
function formatDiagnosticWorkLabels(work) {
	return [
		work.activeLabels.length > 0 ? `active=${work.activeLabels.join("|")}` : "",
		work.waitingLabels.length > 0 ? `waiting=${work.waitingLabels.join("|")}` : "",
		work.queuedLabels.length > 0 ? `queued=${work.queuedLabels.join("|")}` : ""
	].filter(Boolean).join(" ");
}
function resolveStuckSessionWarnMs(config) {
	const raw = config?.diagnostics?.stuckSessionWarnMs;
	if (typeof raw !== "number" || !Number.isFinite(raw)) return DEFAULT_STUCK_SESSION_WARN_MS;
	const rounded = Math.floor(raw);
	if (rounded < MIN_STUCK_SESSION_WARN_MS || rounded > MAX_STUCK_SESSION_WARN_MS) return DEFAULT_STUCK_SESSION_WARN_MS;
	return rounded;
}
function resolveStuckSessionAbortMs(config, stuckSessionWarnMs) {
	const raw = config?.diagnostics?.stuckSessionAbortMs;
	if (typeof raw !== "number" || !Number.isFinite(raw)) return resolveStalledEmbeddedRunAbortMs(stuckSessionWarnMs);
	const rounded = Math.floor(raw);
	if (rounded <= 0) return resolveStalledEmbeddedRunAbortMs(stuckSessionWarnMs);
	return Math.max(stuckSessionWarnMs, rounded);
}
function resolveStalledEmbeddedRunAbortMs(stuckSessionWarnMs) {
	return Math.max(MIN_STALLED_EMBEDDED_RUN_ABORT_MS, stuckSessionWarnMs * STALLED_EMBEDDED_RUN_ABORT_WARN_MULTIPLIER);
}
function isStalledEmbeddedRunRecoveryEligible(params) {
	const lastProgressAgeMs = params.activity?.lastProgressAgeMs;
	return params.classification?.eventType === "session.stalled" && params.classification.classification === "stalled_agent_run" && params.classification.activeWorkKind === "embedded_run" && typeof lastProgressAgeMs === "number" && lastProgressAgeMs >= params.stuckSessionAbortMs;
}
function isBlockedToolCallRecoveryEligible(params) {
	const toolAgeMs = params.activity?.activeToolAgeMs;
	const lastProgressAgeMs = params.activity?.lastProgressAgeMs;
	const abortMs = Math.max(params.stuckSessionAbortMs, require_diagnostic_run_activity.BLOCKED_TOOL_CALL_ABORT_FLOOR_MS);
	return params.classification?.eventType === "session.stalled" && params.classification.classification === "blocked_tool_call" && params.classification.activeWorkKind === "tool_call" && typeof toolAgeMs === "number" && typeof lastProgressAgeMs === "number" && toolAgeMs >= abortMs && lastProgressAgeMs >= abortMs;
}
function isStalledModelCallRecoveryEligible(params) {
	const lastProgressAgeMs = params.activity?.lastProgressAgeMs;
	return params.classification?.eventType === "session.stalled" && params.classification.classification === "stalled_agent_run" && params.classification.activeWorkKind === "model_call" && typeof lastProgressAgeMs === "number" && lastProgressAgeMs >= params.stuckSessionAbortMs;
}
function isActiveAbortRecoveryEligible(params) {
	return isStalledEmbeddedRunRecoveryEligible(params) || isBlockedToolCallRecoveryEligible(params) || isStalledModelCallRecoveryEligible(params);
}
function isIdleQueuedRecoverableSessionStall(params) {
	const hasEmbeddedOwner = params.activity.activeWorkKind === "embedded_run" || params.activity.hasActiveEmbeddedRun === true;
	const hasOrphanedActivity = params.activity.activeWorkKind !== void 0 && params.activity.hasActiveEmbeddedRun !== true;
	return params.state.state === "idle" && params.state.queueDepth > 0 && (hasEmbeddedOwner || hasOrphanedActivity) && (params.activity.lastProgressAgeMs ?? 0) > params.staleMs;
}
function logMessageQueued(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	const state = require_diagnostic_session_state.getDiagnosticSessionState(params);
	state.queueDepth += 1;
	state.lastActivity = Date.now();
	state.generation = (state.generation ?? 0) + 1;
	state.lastStuckWarnAgeMs = void 0;
	state.lastLongRunningWarnAgeMs = void 0;
	if (require_diagnostic_runtime.diagnosticLogger.isEnabled("debug")) require_diagnostic_runtime.diagnosticLogger.debug(`message queued: sessionId=${state.sessionId ?? "unknown"} sessionKey=${state.sessionKey ?? "unknown"} source=${params.source} queueDepth=${state.queueDepth} sessionState=${state.state}`);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "message.queued",
		sessionId: state.sessionId,
		sessionKey: state.sessionKey,
		channel: params.channel,
		source: params.source,
		queueDepth: state.queueDepth
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function logMessageReceived(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	if (require_diagnostic_runtime.diagnosticLogger.isEnabled("debug")) require_diagnostic_runtime.diagnosticLogger.debug(`message received: channel=${params.channel ?? "unknown"} chatId=${params.chatId ?? "unknown"} messageId=${params.messageId ?? "unknown"} sessionId=${params.sessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} source=${params.source}`);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "message.received",
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		channel: params.channel,
		messageId: params.messageId,
		chatId: params.chatId,
		source: params.source
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function logMessageDispatchStarted(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	if (require_diagnostic_runtime.diagnosticLogger.isEnabled("debug")) require_diagnostic_runtime.diagnosticLogger.debug(`message dispatch started: channel=${params.channel ?? "unknown"} sessionId=${params.sessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} source=${params.source}`);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "message.dispatch.started",
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		channel: params.channel,
		source: params.source
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function logMessageDispatchCompleted(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	if (require_diagnostic_runtime.diagnosticLogger.isEnabled(params.outcome === "error" ? "error" : "debug")) {
		const payload = `message dispatch completed: channel=${params.channel ?? "unknown"} sessionId=${params.sessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} source=${params.source} outcome=${params.outcome} duration=${params.durationMs}ms${params.reason ? ` reason=${params.reason}` : ""}${params.error ? ` error="${params.error}"` : ""}`;
		if (params.outcome === "error") require_diagnostic_runtime.diagnosticLogger.error(payload);
		else require_diagnostic_runtime.diagnosticLogger.debug(payload);
	}
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "message.dispatch.completed",
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		channel: params.channel,
		source: params.source,
		durationMs: params.durationMs,
		outcome: params.outcome,
		reason: params.reason,
		error: params.error
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function logMessageProcessed(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	if (params.outcome === "error" ? require_diagnostic_runtime.diagnosticLogger.isEnabled("error") : require_diagnostic_runtime.diagnosticLogger.isEnabled("debug")) {
		const payload = `message processed: channel=${params.channel} chatId=${params.chatId ?? "unknown"} messageId=${params.messageId ?? "unknown"} sessionId=${params.sessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} outcome=${params.outcome} duration=${params.durationMs ?? 0}ms${params.reason ? ` reason=${params.reason}` : ""}${params.error ? ` error="${params.error}"` : ""}`;
		if (params.outcome === "error") require_diagnostic_runtime.diagnosticLogger.error(payload);
		else require_diagnostic_runtime.diagnosticLogger.debug(payload);
	}
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "message.processed",
		channel: params.channel,
		chatId: params.chatId,
		messageId: params.messageId,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		durationMs: params.durationMs,
		outcome: params.outcome,
		reason: params.reason,
		error: params.error
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function logSessionTurnCreated(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	if (require_diagnostic_runtime.diagnosticLogger.isEnabled("debug")) require_diagnostic_runtime.diagnosticLogger.debug(`session turn created: runId=${params.runId} sessionId=${params.sessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} agentId=${params.agentId ?? "unknown"} channel=${params.channel ?? "unknown"} trigger=${params.trigger}`);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "session.turn.created",
		runId: params.runId,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		channel: params.channel,
		trigger: params.trigger
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function logSessionStateChange(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	const state = require_diagnostic_session_state.getDiagnosticSessionState(params);
	const isProbeSession = state.sessionId?.startsWith("probe-") ?? false;
	const prevState = state.state;
	state.state = params.state;
	state.lastActivity = Date.now();
	state.generation = (state.generation ?? 0) + 1;
	state.lastStuckWarnAgeMs = void 0;
	state.lastLongRunningWarnAgeMs = void 0;
	if (params.state === "processing" && prevState !== "processing") state.activeQueuedTurn = state.queueDepth > 0;
	if (params.state === "idle") {
		state.queueDepth = Math.max(0, state.queueDepth - 1);
		state.activeQueuedTurn = false;
	}
	if (!isProbeSession && require_diagnostic_runtime.diagnosticLogger.isEnabled("debug")) require_diagnostic_runtime.diagnosticLogger.debug(`session state: sessionId=${state.sessionId ?? "unknown"} sessionKey=${state.sessionKey ?? "unknown"} prev=${prevState} new=${params.state} reason="${params.reason ?? ""}" queueDepth=${state.queueDepth}`);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "session.state",
		sessionId: state.sessionId,
		sessionKey: state.sessionKey,
		prevState,
		state: params.state,
		reason: params.reason,
		queueDepth: state.queueDepth
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
function updateDiagnosticSessionFile(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	const state = require_diagnostic_session_state.getDiagnosticSessionState(params);
	state.sessionFile = params.sessionFile?.trim() || void 0;
	require_diagnostic_runtime.markDiagnosticActivity();
}
function markDiagnosticSessionProgress(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	const state = require_diagnostic_session_state.getDiagnosticSessionState(params);
	state.lastActivity = Date.now();
	state.generation = (state.generation ?? 0) + 1;
	state.lastStuckWarnAgeMs = void 0;
	state.lastLongRunningWarnAgeMs = void 0;
	require_diagnostic_runtime.markDiagnosticActivity();
}
function sessionAttentionFields(params) {
	const terminalProgressStale = isTerminalDiagnosticProgressReason(params.activity.lastProgressReason);
	return {
		...params.classification.activeWorkKind ? { activeWorkKind: params.classification.activeWorkKind } : {},
		...params.activity.lastProgressAgeMs !== void 0 ? { lastProgressAgeMs: params.activity.lastProgressAgeMs } : {},
		...params.activity.lastProgressReason ? { lastProgressReason: params.activity.lastProgressReason } : {},
		...params.activity.activeToolName ? { activeToolName: params.activity.activeToolName } : {},
		...params.activity.activeToolCallId ? { activeToolCallId: params.activity.activeToolCallId } : {},
		...params.activity.activeToolAgeMs !== void 0 ? { activeToolAgeMs: params.activity.activeToolAgeMs } : {},
		...terminalProgressStale ? { terminalProgressStale: true } : {}
	};
}
function formatSessionActivityLogFields(activity) {
	const fields = [];
	if (activity.lastProgressReason) fields.push(`lastProgress=${activity.lastProgressReason}`);
	if (activity.lastProgressAgeMs !== void 0) fields.push(`lastProgressAge=${Math.round(activity.lastProgressAgeMs / 1e3)}s`);
	if (activity.activeToolName) fields.push(`activeTool=${activity.activeToolName}`);
	if (activity.activeToolCallId) fields.push(`activeToolCallId=${activity.activeToolCallId}`);
	if (activity.activeToolAgeMs !== void 0) fields.push(`activeToolAge=${Math.round(activity.activeToolAgeMs / 1e3)}s`);
	if (isTerminalDiagnosticProgressReason(activity.lastProgressReason)) fields.push("terminalProgressStale=true");
	return fields.join(" ");
}
function logSessionAttention(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	const state = require_diagnostic_session_state.getDiagnosticSessionState(params);
	const activity = require_diagnostic_run_activity.getDiagnosticSessionActivitySnapshot({
		sessionId: state.sessionId,
		sessionKey: state.sessionKey
	}, Date.now());
	const stuckSessionAbortMs = params.abortThresholdMs ?? resolveStalledEmbeddedRunAbortMs(params.thresholdMs);
	const classification = classifySessionAttention({
		state: state.state,
		queueDepth: state.queueDepth,
		activity,
		staleMs: params.thresholdMs,
		stuckSessionAbortMs
	});
	const recoveryEligible = classification.recoveryEligible || isActiveAbortRecoveryEligible({
		classification,
		activity,
		stuckSessionAbortMs
	});
	let suppressWarning = false;
	if (classification.eventType === "session.stuck") {
		const nextWarnAgeMs = state.lastStuckWarnAgeMs === void 0 ? params.thresholdMs : Math.max(state.lastStuckWarnAgeMs + params.thresholdMs, state.lastStuckWarnAgeMs * 2);
		if (params.ageMs < nextWarnAgeMs) {
			if (!recoveryEligible) return;
			suppressWarning = true;
		} else state.lastStuckWarnAgeMs = params.ageMs;
	}
	if (classification.eventType === "session.long_running") {
		const nextWarnAgeMs = state.lastLongRunningWarnAgeMs === void 0 ? params.thresholdMs : Math.max(state.lastLongRunningWarnAgeMs + params.thresholdMs, state.lastLongRunningWarnAgeMs * 2);
		if (params.ageMs < nextWarnAgeMs) {
			if (!recoveryEligible) return;
			suppressWarning = true;
		} else state.lastLongRunningWarnAgeMs = params.ageMs;
	}
	if (suppressWarning) return classification;
	const label = classification.eventType === "session.stuck" ? "stuck session" : classification.eventType === "session.stalled" ? "stalled session" : "long-running session";
	const detailFields = [formatSessionActivityLogFields(activity), formatCronSessionDiagnosticFields(resolveCronSessionDiagnosticContext({ sessionKey: state.sessionKey }))].filter(Boolean).join(" ");
	const message = `${label}: sessionId=${state.sessionId ?? "unknown"} sessionKey=${state.sessionKey ?? "unknown"} state=${params.state} age=${Math.round(params.ageMs / 1e3)}s queueDepth=${state.queueDepth} reason=${classification.reason} classification=${classification.classification}${classification.activeWorkKind ? ` activeWorkKind=${classification.activeWorkKind}` : ""}${detailFields ? ` ${detailFields}` : ""} recovery=${recoveryEligible ? "checking" : "none"}`;
	if (classification.eventType === "session.long_running" && state.queueDepth <= 0) require_diagnostic_runtime.diagnosticLogger.debug(message);
	else require_diagnostic_runtime.diagnosticLogger.warn(message);
	const baseEvent = {
		sessionId: state.sessionId,
		sessionKey: state.sessionKey,
		state: params.state,
		ageMs: params.ageMs,
		queueDepth: state.queueDepth,
		reason: classification.reason,
		...sessionAttentionFields({
			classification,
			activity
		})
	};
	if (classification.eventType === "session.long_running") require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "session.long_running",
		...baseEvent,
		classification: "long_running"
	});
	else if (classification.eventType === "session.stalled") require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "session.stalled",
		...baseEvent,
		classification: classification.classification
	});
	else require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "session.stuck",
		...baseEvent,
		classification: "stale_session_state"
	});
	require_diagnostic_runtime.markDiagnosticActivity();
	return classification;
}
function logToolLoopAction(params) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess()) return;
	const payload = `tool loop: sessionId=${params.sessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} tool=${params.toolName} level=${params.level} action=${params.action} detector=${params.detector} count=${params.count}${params.pairedToolName ? ` pairedTool=${params.pairedToolName}` : ""} message="${params.message}"`;
	if (params.level === "critical") require_diagnostic_runtime.diagnosticLogger.error(payload);
	else require_diagnostic_runtime.diagnosticLogger.warn(payload);
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "tool.loop",
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		toolName: params.toolName,
		level: params.level,
		action: params.action,
		detector: params.detector,
		count: params.count,
		message: params.message,
		pairedToolName: params.pairedToolName
	});
	require_diagnostic_runtime.markDiagnosticActivity();
}
let heartbeatInterval = null;
let lastDiagnosticHeartbeatTickAt;
function startDiagnosticHeartbeat(config, opts) {
	if (!require_diagnostic_events.areDiagnosticsEnabledForProcess() || !require_diagnostic_events.isDiagnosticsEnabled(config)) return;
	require_diagnostic_stability.startDiagnosticStabilityRecorder();
	installDiagnosticStabilityFatalHook();
	if (heartbeatInterval) return;
	startDiagnosticLivenessSampler();
	const livenessGraceUntil = opts?.startupGraceMs != null && opts.startupGraceMs > 0 ? Date.now() + opts.startupGraceMs : 0;
	lastDiagnosticHeartbeatTickAt = Date.now();
	heartbeatInterval = setInterval(() => {
		let heartbeatConfig = config;
		if (!heartbeatConfig) try {
			heartbeatConfig = (opts?.getConfig ?? require_io.getRuntimeConfig)();
		} catch {
			heartbeatConfig = void 0;
		}
		const stuckSessionWarnMs = resolveStuckSessionWarnMs(heartbeatConfig);
		const stuckSessionAbortMs = resolveStuckSessionAbortMs(heartbeatConfig, stuckSessionWarnMs);
		const compactionSafetyTimeoutMs = resolveCompactionTimeoutMs(heartbeatConfig);
		const now = Date.now();
		const heartbeatElapsedMs = lastDiagnosticHeartbeatTickAt === void 0 ? 0 : now - lastDiagnosticHeartbeatTickAt;
		lastDiagnosticHeartbeatTickAt = now;
		const heartbeatOverdueMs = Math.max(0, heartbeatElapsedMs - DIAGNOSTIC_HEARTBEAT_INTERVAL_MS);
		const recoveryObservationNow = now - heartbeatOverdueMs;
		const shouldDeferRecovery = heartbeatOverdueMs >= DEFAULT_LIVENESS_EVENT_LOOP_DELAY_WARN_MS;
		if (shouldDeferRecovery) require_diagnostic_runtime.diagnosticLogger.warn(`liveness heartbeat delayed ${Math.round(heartbeatElapsedMs)}ms; deferring recovery decisions`);
		require_diagnostic_session_state.pruneDiagnosticSessionStates(now, true);
		const work = getDiagnosticWorkSnapshot(now);
		const inStartupGrace = livenessGraceUntil > 0 && now < livenessGraceUntil;
		const rawLivenessSample = (opts?.sampleLiveness ?? sampleDiagnosticLiveness)(now, work);
		const livenessSample = inStartupGrace ? null : rawLivenessSample;
		const shouldEmitLivenessEvent = livenessSample !== null && shouldEmitDiagnosticLivenessEvent(now);
		const shouldEmitLivenessWarning = livenessSample !== null && shouldEmitDiagnosticLivenessWarning(now, work);
		const shouldEmitLivenessReport = shouldEmitLivenessEvent || shouldEmitLivenessWarning;
		const shouldRecordMemorySample = shouldEmitLivenessReport || hasRecentDiagnosticActivity(now) || hasOpenDiagnosticWork(work);
		if (opts?.emitMemorySample) opts.emitMemorySample({ emitSample: shouldRecordMemorySample });
		else emitDiagnosticMemorySample({
			emitSample: shouldRecordMemorySample,
			writeCriticalBundle: shouldWriteCriticalMemoryPressureBundle(heartbeatConfig),
			resolveSessionStorePaths: () => resolveDiagnosticSessionStorePaths(heartbeatConfig)
		});
		if (!shouldRecordMemorySample) return;
		if (shouldEmitLivenessReport && livenessSample) emitDiagnosticLivenessWarning(livenessSample, work);
		require_diagnostic_runtime.diagnosticLogger.debug(`heartbeat: webhooks=${webhookStats.received}/${webhookStats.processed}/${webhookStats.errors} active=${work.activeCount} waiting=${work.waitingCount} queued=${work.queuedCount}`);
		require_diagnostic_events.emitInternalDiagnosticEvent({
			type: "diagnostic.heartbeat",
			webhooks: {
				received: webhookStats.received,
				processed: webhookStats.processed,
				errors: webhookStats.errors
			},
			active: work.activeCount,
			waiting: work.waitingCount,
			queued: work.queuedCount
		});
		loadCommandPollBackoffRuntime().then(({ pruneStaleCommandPolls }) => {
			for (const [, state] of require_diagnostic_session_state.diagnosticSessionStates) pruneStaleCommandPolls(state);
		}).catch((err) => {
			require_diagnostic_runtime.diagnosticLogger.debug(`command-poll-backoff prune failed: ${String(err)}`);
		});
		for (const [, state] of require_diagnostic_session_state.diagnosticSessionStates) {
			const ageMs = recoveryObservationNow - state.lastActivity;
			const activity = require_diagnostic_run_activity.getDiagnosticSessionActivitySnapshot({
				sessionId: state.sessionId,
				sessionKey: state.sessionKey
			}, recoveryObservationNow);
			const idleQueuedRecoverableStall = isIdleQueuedRecoverableSessionStall({
				state,
				activity,
				staleMs: stuckSessionWarnMs
			});
			if (state.state === "processing" && ageMs > stuckSessionWarnMs || idleQueuedRecoverableStall) {
				const attentionAgeMs = idleQueuedRecoverableStall ? activity.lastProgressAgeMs ?? ageMs : ageMs;
				const classification = logSessionAttention({
					sessionId: state.sessionId,
					sessionKey: state.sessionKey,
					state: state.state,
					ageMs: attentionAgeMs,
					thresholdMs: stuckSessionWarnMs,
					abortThresholdMs: stuckSessionAbortMs
				});
				if (!classification || shouldDeferRecovery) continue;
				const activeAbortEligible = !classification.recoveryEligible && isActiveAbortRecoveryEligible({
					classification,
					activity,
					stuckSessionAbortMs
				});
				if (!classification.recoveryEligible && !activeAbortEligible) continue;
				requestStuckSessionRecovery({
					recover: opts?.recoverStuckSession ?? recoverStuckSession,
					classification,
					request: {
						sessionId: state.sessionId,
						sessionKey: state.sessionKey,
						sessionFile: state.sessionFile,
						ageMs: attentionAgeMs,
						queueDepth: state.queueDepth,
						expectedState: state.state,
						stateGeneration: state.generation,
						...activeAbortEligible ? { allowActiveAbort: true } : { staleActiveProgressAbortMs: stuckSessionAbortMs },
						compactionSafetyTimeoutMs
					}
				});
			}
		}
	}, DIAGNOSTIC_HEARTBEAT_INTERVAL_MS);
	heartbeatInterval.unref?.();
}
function stopDiagnosticHeartbeat() {
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
		heartbeatInterval = null;
	}
	lastDiagnosticHeartbeatTickAt = void 0;
	stopDiagnosticLivenessSampler();
	require_diagnostic_stability.stopDiagnosticStabilityRecorder();
	uninstallDiagnosticStabilityFatalHook();
}
//#endregion
Object.defineProperty(exports, "compactContextEngineWithSafetyTimeout", {
	enumerable: true,
	get: function() {
		return compactContextEngineWithSafetyTimeout;
	}
});
Object.defineProperty(exports, "compactWithSafetyTimeout", {
	enumerable: true,
	get: function() {
		return compactWithSafetyTimeout;
	}
});
Object.defineProperty(exports, "formatRecoveryOutcome", {
	enumerable: true,
	get: function() {
		return formatRecoveryOutcome;
	}
});
Object.defineProperty(exports, "formatStoppedCronSessionDiagnosticFields", {
	enumerable: true,
	get: function() {
		return formatStoppedCronSessionDiagnosticFields;
	}
});
Object.defineProperty(exports, "logMessageDispatchCompleted", {
	enumerable: true,
	get: function() {
		return logMessageDispatchCompleted;
	}
});
Object.defineProperty(exports, "logMessageDispatchStarted", {
	enumerable: true,
	get: function() {
		return logMessageDispatchStarted;
	}
});
Object.defineProperty(exports, "logMessageProcessed", {
	enumerable: true,
	get: function() {
		return logMessageProcessed;
	}
});
Object.defineProperty(exports, "logMessageQueued", {
	enumerable: true,
	get: function() {
		return logMessageQueued;
	}
});
Object.defineProperty(exports, "logMessageReceived", {
	enumerable: true,
	get: function() {
		return logMessageReceived;
	}
});
Object.defineProperty(exports, "logSessionStateChange", {
	enumerable: true,
	get: function() {
		return logSessionStateChange;
	}
});
Object.defineProperty(exports, "logSessionTurnCreated", {
	enumerable: true,
	get: function() {
		return logSessionTurnCreated;
	}
});
Object.defineProperty(exports, "logToolLoopAction", {
	enumerable: true,
	get: function() {
		return logToolLoopAction;
	}
});
Object.defineProperty(exports, "markDiagnosticSessionProgress", {
	enumerable: true,
	get: function() {
		return markDiagnosticSessionProgress;
	}
});
Object.defineProperty(exports, "resolveCompactionTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveCompactionTimeoutMs;
	}
});
Object.defineProperty(exports, "resolveCronSessionDiagnosticContext", {
	enumerable: true,
	get: function() {
		return resolveCronSessionDiagnosticContext;
	}
});
Object.defineProperty(exports, "resolveStuckSessionRecoveryRef", {
	enumerable: true,
	get: function() {
		return resolveStuckSessionRecoveryRef;
	}
});
Object.defineProperty(exports, "startDiagnosticHeartbeat", {
	enumerable: true,
	get: function() {
		return startDiagnosticHeartbeat;
	}
});
Object.defineProperty(exports, "stopDiagnosticHeartbeat", {
	enumerable: true,
	get: function() {
		return stopDiagnosticHeartbeat;
	}
});
Object.defineProperty(exports, "updateDiagnosticSessionFile", {
	enumerable: true,
	get: function() {
		return updateDiagnosticSessionFile;
	}
});
Object.defineProperty(exports, "withDiagnosticPhase", {
	enumerable: true,
	get: function() {
		return withDiagnosticPhase;
	}
});
