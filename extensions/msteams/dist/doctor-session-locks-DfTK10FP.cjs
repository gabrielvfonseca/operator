require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_session_dirs = require("./session-dirs-CZJH_seJ.cjs");
const require_session_write_lock = require("./session-write-lock-BTWJIoPj.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
//#region src/commands/doctor-session-locks.ts
/** Doctor diagnostics and cleanup for stale session write lock files. */
const SESSION_LOCKS_CHECK_ID = "core/doctor/session-locks";
const REPORT_ONLY_STALE_LOCK_REASONS = /* @__PURE__ */ new Set(["too-old", "hold-exceeded"]);
function isReportOnlyStaleLock(lock) {
	return lock.staleReasons.length > 0 && lock.staleReasons.every((reason) => REPORT_ONLY_STALE_LOCK_REASONS.has(reason));
}
function formatAge(ageMs) {
	if (ageMs === null) return "unknown";
	const seconds = Math.floor(ageMs / 1e3);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	if (minutes < 60) return `${minutes}m${remainingSeconds}s`;
	return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
}
function formatLockLine(lock) {
	const pidStatus = lock.pid === null ? "pid=missing" : `pid=${lock.pid} (${lock.pidAlive ? "alive" : "dead"})`;
	const ageStatus = `age=${formatAge(lock.ageMs)}`;
	const staleStatus = lock.stale ? `stale=yes (${lock.staleReasons.join(", ") || "unknown"})` : "stale=no";
	const removedStatus = lock.removed ? " [removed]" : "";
	return `- ${require_utils.shortenHomePath(lock.lockPath)} ${pidStatus} ${ageStatus} ${staleStatus}${removedStatus}`;
}
async function detectStaleSessionLocks(params) {
	const staleMs = params?.staleMs ?? require_session_write_lock.resolveSessionWriteLockStaleMs(params?.config, params?.env);
	const sessionDirs = await require_session_dirs.resolveAgentSessionDirs(require_paths.resolveStateDir(params?.env ?? process.env));
	const staleLocks = [];
	for (const sessionsDir of sessionDirs) {
		const result = await require_session_write_lock.cleanStaleLockFiles({
			sessionsDir,
			staleMs,
			removeStale: false,
			readOwnerProcessArgs: params?.readOwnerProcessArgs
		});
		staleLocks.push(...result.locks.filter((lock) => lock.stale));
	}
	return staleLocks.toSorted((a, b) => a.lockPath.localeCompare(b.lockPath));
}
function sessionLockToHealthFinding(lock) {
	const fixHint = lock.removable ? "Run \"openclaw doctor --fix\" to remove this stale lock file automatically." : isReportOnlyStaleLock(lock) ? "Operator is preserving this live owned lock; inspect the owning process if it appears stuck." : "Run \"openclaw doctor --fix\" after the cleanup grace period if this stale lock remains.";
	return {
		checkId: SESSION_LOCKS_CHECK_ID,
		severity: "warning",
		message: `Stale session lock file: ${require_utils.shortenHomePath(lock.lockPath)} (${lock.staleReasons.join(", ") || "unknown"})`,
		path: lock.lockPath,
		fixHint
	};
}
function sessionLockToRepairEffect(lock) {
	return {
		kind: "state",
		action: lock.removable ? "would-remove-stale-session-lock" : isReportOnlyStaleLock(lock) ? "would-preserve-report-only-stale-session-lock" : "would-preserve-mtime-gated-stale-session-lock",
		target: lock.lockPath,
		dryRunSafe: false
	};
}
/** Reports session write locks and removes stale locks when doctor repair is enabled. */
async function noteSessionLockHealth(params) {
	const shouldRepair = params?.shouldRepair === true;
	const staleMs = params?.staleMs ?? require_session_write_lock.resolveSessionWriteLockStaleMs(params?.config, params?.env);
	let sessionDirs;
	try {
		sessionDirs = await require_session_dirs.resolveAgentSessionDirs(require_paths.resolveStateDir(process.env));
	} catch (err) {
		require_note.note(`- Failed to inspect session lock files: ${String(err)}`, "Session locks");
		return;
	}
	if (sessionDirs.length === 0) return;
	const allLocks = [];
	for (const sessionsDir of sessionDirs) {
		const result = await require_session_write_lock.cleanStaleLockFiles({
			sessionsDir,
			staleMs,
			removeStale: shouldRepair,
			readOwnerProcessArgs: params?.readOwnerProcessArgs
		});
		allLocks.push(...result.locks);
	}
	if (allLocks.length === 0) return;
	const staleCount = allLocks.filter((lock) => lock.stale).length;
	const removedCount = allLocks.filter((lock) => lock.removed).length;
	const lines = [`- Found ${allLocks.length} session lock file${allLocks.length === 1 ? "" : "s"}.`, ...allLocks.toSorted((a, b) => a.lockPath.localeCompare(b.lockPath)).map(formatLockLine)];
	if (staleCount > 0 && !shouldRepair) {
		lines.push(`- ${staleCount} lock file${staleCount === 1 ? " is" : "s are"} stale.`);
		lines.push("- Run \"openclaw doctor --fix\" to remove stale lock files automatically.");
	}
	if (shouldRepair && removedCount > 0) lines.push(`- Removed ${removedCount} stale session lock file${removedCount === 1 ? "" : "s"}.`);
	require_note.note(lines.join("\n"), "Session locks");
}
//#endregion
exports.detectStaleSessionLocks = detectStaleSessionLocks;
exports.noteSessionLockHealth = noteSessionLockHealth;
exports.sessionLockToHealthFinding = sessionLockToHealthFinding;
exports.sessionLockToRepairEffect = sessionLockToRepairEffect;
