const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
//#region src/utils/timer-delay.ts
/** Wrapper around setTimeout that clamps unsafe or invalid delays before arming the timer. */
function setSafeTimeout(callback, delayMs, opts) {
	return setTimeout(callback, require_timeouts.resolveSafeTimeoutDelayMs(delayMs, opts));
}
//#endregion
Object.defineProperty(exports, "setSafeTimeout", {
	enumerable: true,
	get: function() {
		return setSafeTimeout;
	}
});
