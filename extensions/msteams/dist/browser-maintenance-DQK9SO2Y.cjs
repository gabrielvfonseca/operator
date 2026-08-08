require("./fs-safe-defaults-bWM6YSZm.cjs");
const require_facade_runtime = require("./facade-runtime-BM8A5__s.cjs");
require("@openclaw/fs-safe/advanced");
//#region src/plugin-sdk/browser-maintenance.ts
/**
* Public SDK facade for browser cleanup and trash operations.
*/
let cachedBrowserMaintenanceSurface;
function hasRequestedSessionKeys(sessionKeys) {
	return sessionKeys.some((key) => Boolean(key?.trim()));
}
function loadBrowserMaintenanceSurface() {
	const request = {
		dirName: "browser",
		artifactBasename: "browser-maintenance.js"
	};
	if (!require_facade_runtime.canLoadActivatedBundledPluginPublicSurface(request)) return null;
	if (!cachedBrowserMaintenanceSurface) cachedBrowserMaintenanceSurface = require_facade_runtime.tryLoadActivatedBundledPluginPublicSurfaceModuleSync(request) ?? void 0;
	return cachedBrowserMaintenanceSurface ?? null;
}
/** Closes tracked browser tabs for requested session keys when the browser plugin is active. */
async function closeTrackedBrowserTabsForSessions(params) {
	if (!hasRequestedSessionKeys(params.sessionKeys)) return 0;
	let surface;
	try {
		surface = loadBrowserMaintenanceSurface();
	} catch (error) {
		params.onWarn?.(`browser cleanup unavailable: ${String(error)}`);
		return 0;
	}
	if (!surface) return 0;
	return await surface.closeTrackedBrowserTabsForSessions(params);
}
//#endregion
Object.defineProperty(exports, "closeTrackedBrowserTabsForSessions", {
	enumerable: true,
	get: function() {
		return closeTrackedBrowserTabsForSessions;
	}
});
