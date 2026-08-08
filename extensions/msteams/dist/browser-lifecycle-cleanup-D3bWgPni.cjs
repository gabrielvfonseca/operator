const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_browser_maintenance = require("./browser-maintenance-DQK9SO2Y.cjs");
//#region src/infra/non-fatal-cleanup.ts
/** Run cleanup and swallow failures after invoking the optional error hook. */
async function runBestEffortCleanup(params) {
	try {
		return await params.cleanup();
	} catch (error) {
		params.onError?.(error);
		return;
	}
}
//#endregion
//#region src/browser-lifecycle-cleanup.ts
var browser_lifecycle_cleanup_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ cleanupBrowserSessionsForLifecycleEnd: () => cleanupBrowserSessionsForLifecycleEnd });
function normalizeSessionKeys(sessionKeys) {
	const keys = /* @__PURE__ */ new Set();
	for (const sessionKey of sessionKeys) {
		const normalized = sessionKey.trim();
		if (normalized) keys.add(normalized);
	}
	return [...keys];
}
function isBrowserCleanupDisabled(cfg) {
	return cfg?.browser?.enabled === false || cfg?.plugins?.entries?.browser?.enabled === false;
}
async function cleanupBrowserSessionsForLifecycleEnd(params) {
	if (isBrowserCleanupDisabled(params.cfg)) return;
	const sessionKeys = normalizeSessionKeys(params.sessionKeys);
	if (sessionKeys.length === 0) return;
	await runBestEffortCleanup({
		cleanup: async () => {
			await require_browser_maintenance.closeTrackedBrowserTabsForSessions({
				sessionKeys,
				onWarn: params.onWarn
			});
		},
		onError: params.onError
	});
}
//#endregion
Object.defineProperty(exports, "browser_lifecycle_cleanup_exports", {
	enumerable: true,
	get: function() {
		return browser_lifecycle_cleanup_exports;
	}
});
Object.defineProperty(exports, "cleanupBrowserSessionsForLifecycleEnd", {
	enumerable: true,
	get: function() {
		return cleanupBrowserSessionsForLifecycleEnd;
	}
});
