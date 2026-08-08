require("./fs-safe-defaults-bWM6YSZm.cjs");
const require_pid_alive = require("./pid-alive-BalBSmHd.cjs");
const require_stale_lock_file = require("./stale-lock-file-CfpUwJO5.cjs");
let _openclaw_fs_safe_file_lock = require("@openclaw/fs-safe/file-lock");
//#region src/plugin-sdk/file-lock.ts
/** Stable error code used when lock acquisition retries are exhausted. */
const FILE_LOCK_TIMEOUT_ERROR_CODE = "file_lock_timeout";
/** Stable error code used when stale lock recovery cannot proceed safely. */
const FILE_LOCK_STALE_ERROR_CODE = "file_lock_stale";
const FILE_LOCK_MANAGER_KEY = "operator.plugin-sdk.file-lock";
let currentProcessStartTime;
function getCurrentProcessStartTime() {
	if (currentProcessStartTime === void 0) currentProcessStartTime = require_pid_alive.getFileLockProcessStartTime(process.pid);
	return currentProcessStartTime;
}
function normalizeLockError(err) {
	if (err.code === "file_lock_timeout") throw Object.assign(new Error(err.message), {
		code: FILE_LOCK_TIMEOUT_ERROR_CODE,
		lockPath: err.lockPath ?? ""
	});
	if (err.code === "file_lock_stale") throw Object.assign(new Error(err.message), {
		code: FILE_LOCK_STALE_ERROR_CODE,
		lockPath: err.lockPath ?? ""
	});
	throw err;
}
/** Acquire a re-entrant process-local file lock backed by a `.lock` sidecar file. */
async function acquireFileLock(filePath, options) {
	const staleRecovery = options.staleRecovery ?? "remove-if-unchanged";
	try {
		const lock = await (0, _openclaw_fs_safe_file_lock.acquireFileLock)(filePath, {
			managerKey: FILE_LOCK_MANAGER_KEY,
			staleMs: options.stale,
			retry: options.retries,
			staleRecovery,
			allowReentrant: true,
			payload: () => {
				const payload = {
					pid: process.pid,
					createdAt: (/* @__PURE__ */ new Date()).toISOString()
				};
				const starttime = getCurrentProcessStartTime();
				if (starttime !== null) payload.starttime = starttime;
				return payload;
			},
			shouldReclaim: (params) => staleRecovery === "fail-closed" ? require_stale_lock_file.isLockOwnerDefinitelyStale({ payload: params.payload }) : require_stale_lock_file.shouldRemoveDeadOwnerOrExpiredLock({
				payload: params.payload,
				staleMs: params.staleMs,
				nowMs: params.nowMs
			}),
			...staleRecovery === "remove-if-unchanged" ? { shouldRemoveStaleLock: (snapshot) => require_stale_lock_file.shouldRemoveDeadOwnerOrExpiredLock({
				payload: snapshot.payload,
				staleMs: options.stale
			}) } : {}
		});
		return {
			lockPath: lock.lockPath,
			release: lock.release
		};
	} catch (err) {
		return normalizeLockError(err);
	}
}
/** Run an async callback while holding a file lock, always releasing the lock afterward. */
async function withFileLock(filePath, options, fn) {
	const lock = await acquireFileLock(filePath, options);
	try {
		return await fn();
	} finally {
		await lock.release();
	}
}
//#endregion
Object.defineProperty(exports, "FILE_LOCK_TIMEOUT_ERROR_CODE", {
	enumerable: true,
	get: function() {
		return FILE_LOCK_TIMEOUT_ERROR_CODE;
	}
});
Object.defineProperty(exports, "withFileLock", {
	enumerable: true,
	get: function() {
		return withFileLock;
	}
});
