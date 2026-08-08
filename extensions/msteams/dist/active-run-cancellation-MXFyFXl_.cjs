//#region src/cron/service/active-run-cancellation.ts
const activeCronTaskRunsByRunId = /* @__PURE__ */ new Map();
const settlingCronTaskRuns = /* @__PURE__ */ new Map();
const suspensionVisibleCronTaskRuns = /* @__PURE__ */ new Set();
const CRON_TASK_RUN_SETTLEMENT_TRACKING_MAX_MS = 6e4;
function startActiveCronTaskRunSettlementGrace() {
	for (const [promise, entry] of settlingCronTaskRuns) {
		if (entry.retirementTimer) continue;
		const retirementTimer = setTimeout(() => {
			settlingCronTaskRuns.delete(promise);
		}, CRON_TASK_RUN_SETTLEMENT_TRACKING_MAX_MS);
		retirementTimer.unref?.();
		entry.retirementTimer = retirementTimer;
	}
}
function registerActiveCronTaskRun(params) {
	const runId = params.runId?.trim();
	if (!runId) return;
	activeCronTaskRunsByRunId.set(runId, {
		controller: params.controller,
		onCancel: params.onCancel
	});
	return () => {
		if (activeCronTaskRunsByRunId.get(runId)?.controller === params.controller) activeCronTaskRunsByRunId.delete(runId);
	};
}
function trackActiveCronTaskRunSettlement(promise) {
	settlingCronTaskRuns.set(promise, {});
	suspensionVisibleCronTaskRuns.add(promise);
	promise.catch(() => void 0).finally(() => {
		const entry = settlingCronTaskRuns.get(promise);
		if (entry?.retirementTimer) clearTimeout(entry.retirementTimer);
		settlingCronTaskRuns.delete(promise);
		suspensionVisibleCronTaskRuns.delete(promise);
	});
}
/** Cron cores that can still mutate state even after timeout/cancel returned. */
function getSuspensionVisibleCronTaskRunCount() {
	return suspensionVisibleCronTaskRuns.size;
}
/** Retires restart-drain bookkeeping without hiding still-running cores from suspension. */
function retireActiveCronTaskRunTracking() {
	activeCronTaskRunsByRunId.clear();
	for (const entry of settlingCronTaskRuns.values()) if (entry.retirementTimer) clearTimeout(entry.retirementTimer);
	settlingCronTaskRuns.clear();
}
function resetActiveCronTaskRunsForTests() {
	retireActiveCronTaskRunTracking();
	suspensionVisibleCronTaskRuns.clear();
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.activeCronTaskRunTestApi")] = { resetActiveCronTaskRunsForTests };
//#endregion
Object.defineProperty(exports, "getSuspensionVisibleCronTaskRunCount", {
	enumerable: true,
	get: function() {
		return getSuspensionVisibleCronTaskRunCount;
	}
});
Object.defineProperty(exports, "registerActiveCronTaskRun", {
	enumerable: true,
	get: function() {
		return registerActiveCronTaskRun;
	}
});
Object.defineProperty(exports, "startActiveCronTaskRunSettlementGrace", {
	enumerable: true,
	get: function() {
		return startActiveCronTaskRunSettlementGrace;
	}
});
Object.defineProperty(exports, "trackActiveCronTaskRunSettlement", {
	enumerable: true,
	get: function() {
		return trackActiveCronTaskRunSettlement;
	}
});
