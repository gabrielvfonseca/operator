const require_pid_alive = require("./pid-alive-BalBSmHd.cjs");
//#region src/infra/stale-lock-file.ts
function readLockFileOwnerPayload(payload) {
	if (!payload) return null;
	return {
		pid: typeof payload.pid === "number" && Number.isInteger(payload.pid) && payload.pid > 0 ? payload.pid : void 0,
		createdAt: typeof payload.createdAt === "string" ? payload.createdAt : void 0,
		starttime: typeof payload.starttime === "number" && Number.isInteger(payload.starttime) && payload.starttime >= 0 ? payload.starttime : void 0
	};
}
function isLockOwnerDefinitelyStale(params) {
	const payload = readLockFileOwnerPayload(params.payload);
	if (payload?.pid) {
		if (payload.starttime !== void 0) {
			const currentStarttime = (params.getProcessStartTime ?? require_pid_alive.getFileLockProcessStartTime)(payload.pid);
			const normalizedStored = process.platform === "darwin" && payload.starttime > 1e10 ? Math.floor(payload.starttime / 1e6) : payload.starttime;
			if (currentStarttime !== null && currentStarttime !== normalizedStored) return true;
		}
		return (params.isPidDefinitelyDead ?? require_pid_alive.isPidDefinitelyDead)(payload.pid);
	}
	return false;
}
function shouldRemoveDeadOwnerOrExpiredLock(params) {
	const payload = readLockFileOwnerPayload(params.payload);
	if (payload?.pid) return isLockOwnerDefinitelyStale({
		payload: params.payload,
		isPidDefinitelyDead: params.isPidDefinitelyDead,
		getProcessStartTime: params.getProcessStartTime
	});
	if (!payload?.createdAt) return false;
	const createdAt = Date.parse(payload.createdAt);
	return !Number.isFinite(createdAt) || (params.nowMs ?? Date.now()) - createdAt > params.staleMs;
}
//#endregion
Object.defineProperty(exports, "isLockOwnerDefinitelyStale", {
	enumerable: true,
	get: function() {
		return isLockOwnerDefinitelyStale;
	}
});
Object.defineProperty(exports, "shouldRemoveDeadOwnerOrExpiredLock", {
	enumerable: true,
	get: function() {
		return shouldRemoveDeadOwnerOrExpiredLock;
	}
});
