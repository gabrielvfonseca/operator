const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_net_policy_redact_sensitive_url = require("@gabrielvfonseca/net-policy/redact-sensitive-url");
//#region src/utils/fetch-timeout.ts
const log = require_subsystem.createSubsystemLogger("fetch-timeout");
const LOG_URL_MAX_CHARS = 500;
const URL_SECRET_SUFFIX_PATTERN = /[?#]/;
/**
* Relay abort without forwarding the Event argument as the abort reason.
* Using .bind() avoids closure scope capture (memory leak prevention).
*/
function relayAbort() {
	this.abort();
}
/** Returns a bound abort relay for use as an event listener. */
function bindAbortRelay(controller) {
	return relayAbort.bind(controller);
}
function sanitizeTimeoutLogUrl(rawUrl) {
	const trimmed = rawUrl?.trim();
	if (!trimmed) return;
	try {
		const parsed = new URL(trimmed);
		parsed.username = "";
		parsed.password = "";
		parsed.search = "";
		parsed.hash = "";
		const value = (0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)(parsed.toString());
		return value.length > LOG_URL_MAX_CHARS ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, LOG_URL_MAX_CHARS)}...` : value;
	} catch {
		const cleaned = (0, _gabrielvfonseca_net_policy_redact_sensitive_url.redactSensitiveUrlLikeString)((trimmed.split(URL_SECRET_SUFFIX_PATTERN, 1)[0] ?? "").replace(/[\r\n\u2028\u2029]+/g, " ").replace(/\p{Cc}+/gu, " ").replace(/\s+/g, " ").trim());
		if (!cleaned) return;
		return cleaned.length > LOG_URL_MAX_CHARS ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(cleaned, LOG_URL_MAX_CHARS)}...` : cleaned;
	}
}
function abortDueToTimeout(controller, timeoutMs, startedAtMs, operation, url, combinedSignal) {
	if (combinedSignal?.aborted ?? controller.signal.aborted) return;
	const sanitizedUrl = sanitizeTimeoutLogUrl(url);
	const elapsedMs = Math.max(0, Date.now() - startedAtMs);
	const delayMs = Math.max(0, elapsedMs - timeoutMs);
	const eventLoopDelayHint = delayMs >= Math.max(1e3, timeoutMs * .5) ? `timer delayed ${delayMs}ms, likely event-loop starvation` : null;
	const consoleMessage = [
		`fetch timeout after ${timeoutMs}ms`,
		`(elapsed ${elapsedMs}ms)`,
		eventLoopDelayHint,
		operation ? `operation=${operation}` : null,
		sanitizedUrl ? `url=${sanitizedUrl}` : null
	].filter((part) => Boolean(part)).join(" ");
	log.warn("fetch timeout reached; aborting operation", {
		timeoutMs,
		elapsedMs,
		...eventLoopDelayHint ? {
			timerDelayMs: delayMs,
			eventLoopDelayHint
		} : {},
		consoleMessage,
		...operation ? { operation } : {},
		...sanitizedUrl ? { url: sanitizedUrl } : {}
	});
	const error = /* @__PURE__ */ new Error("request timed out");
	error.name = "TimeoutError";
	controller.abort(error);
}
/**
* Builds an abort signal that combines an optional parent signal with a timeout.
* Callers must run `cleanup`; `refresh` restarts only the internal timeout timer.
*/
function buildTimeoutAbortSignal(params) {
	const { timeoutMs, signal: parentSignal } = params;
	if (!timeoutMs && !parentSignal) return {
		signal: void 0,
		cleanup: () => {},
		refresh: () => {}
	};
	if (!timeoutMs) return {
		signal: parentSignal,
		cleanup: () => {},
		refresh: () => {}
	};
	const controller = new AbortController();
	const signal = parentSignal ? AbortSignal.any([parentSignal, controller.signal]) : controller.signal;
	const normalizedTimeoutMs = require_timeouts.resolveSafeTimeoutDelayMs(timeoutMs);
	let active = true;
	let timeoutId;
	const scheduleTimeout = () => {
		timeoutId = setTimeout(abortDueToTimeout, normalizedTimeoutMs, controller, normalizedTimeoutMs, Date.now(), params.operation, params.url, signal);
	};
	scheduleTimeout();
	return {
		signal,
		refresh: () => {
			if (!active || signal.aborted) return;
			if (timeoutId) clearTimeout(timeoutId);
			scheduleTimeout();
		},
		cleanup: () => {
			active = false;
			if (timeoutId) clearTimeout(timeoutId);
		}
	};
}
/**
* Fetch wrapper that adds timeout support via AbortController.
*
* @param url - The URL to fetch
* @param init - RequestInit options (headers, method, body, etc.)
* @param timeoutMs - Timeout in milliseconds
* @param fetchFn - The fetch implementation to use (defaults to global fetch)
* @returns The fetch Response
* @throws AbortError if the request times out
*/
async function fetchWithTimeout(url, init, timeoutMs, fetchFn = fetch) {
	const { signal: timeoutSignal, cleanup } = buildTimeoutAbortSignal({
		timeoutMs: Math.max(1, timeoutMs),
		operation: "fetchWithTimeout",
		url
	});
	const callerSignal = init.signal ?? void 0;
	const signal = callerSignal && timeoutSignal ? AbortSignal.any([callerSignal, timeoutSignal]) : callerSignal ?? timeoutSignal;
	try {
		return await fetchFn(url, {
			...init,
			signal
		});
	} finally {
		cleanup();
	}
}
//#endregion
Object.defineProperty(exports, "bindAbortRelay", {
	enumerable: true,
	get: function() {
		return bindAbortRelay;
	}
});
Object.defineProperty(exports, "buildTimeoutAbortSignal", {
	enumerable: true,
	get: function() {
		return buildTimeoutAbortSignal;
	}
});
Object.defineProperty(exports, "fetchWithTimeout", {
	enumerable: true,
	get: function() {
		return fetchWithTimeout;
	}
});
