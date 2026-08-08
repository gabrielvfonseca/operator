const require_typing_start_guard = require("./typing-start-guard-Ujlb4b5N.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/channels/typing.ts
const DEFAULT_MAX_CONSECUTIVE_TYPING_FAILURES = 2;
function resolvePositiveIntegerOption(value, fallback) {
	const parsed = (0, _gabrielvfonseca_normalization_core_number_coercion.parseFiniteNumber)(value);
	return parsed === void 0 || parsed <= 0 ? fallback : Math.max(1, Math.floor(parsed));
}
function resolveKeepaliveIntervalMs(value) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(value, 3e3, 0);
}
function resolveDurationMsOption(value, fallback) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(value, fallback, 0);
}
function createTypingCallbacks(params) {
	const stop = params.stop;
	const keepaliveIntervalMs = resolveKeepaliveIntervalMs(params.keepaliveIntervalMs);
	const maxConsecutiveFailures = resolvePositiveIntegerOption(params.maxConsecutiveFailures, DEFAULT_MAX_CONSECUTIVE_TYPING_FAILURES);
	const maxDurationMs = resolveDurationMsOption(params.maxDurationMs, 6e4);
	let stopSent = false;
	let closed = false;
	let ttlTimer;
	const startGuard = require_typing_start_guard.createTypingStartGuard({
		isSealed: () => closed,
		onStartError: params.onStartError,
		maxConsecutiveFailures,
		onTrip: () => {
			keepaliveLoop.stop();
		}
	});
	const fireStart = async () => {
		await startGuard.run(() => params.start());
	};
	const keepaliveLoop = require_typing_start_guard.createTypingKeepaliveLoop({
		intervalMs: keepaliveIntervalMs,
		onTick: fireStart
	});
	const startTtlTimer = () => {
		if (maxDurationMs <= 0) return;
		clearTtlTimer();
		ttlTimer = setTimeout(() => {
			if (!closed) {
				console.warn(`[typing] TTL exceeded (${maxDurationMs}ms), auto-stopping typing indicator`);
				fireStop();
			}
		}, maxDurationMs);
		ttlTimer.unref?.();
	};
	const clearTtlTimer = () => {
		if (ttlTimer) {
			clearTimeout(ttlTimer);
			ttlTimer = void 0;
		}
	};
	const onReplyStart = async () => {
		if (closed) return;
		stopSent = false;
		startGuard.reset();
		keepaliveLoop.stop();
		clearTtlTimer();
		fireStart().then(() => {
			if (closed || startGuard.isTripped()) return;
			keepaliveLoop.start();
			startTtlTimer();
		});
		await Promise.resolve();
	};
	const fireStop = () => {
		closed = true;
		keepaliveLoop.stop();
		clearTtlTimer();
		if (!stop || stopSent) return;
		stopSent = true;
		stop().catch((err) => (params.onStopError ?? params.onStartError)(err));
	};
	return {
		onReplyStart,
		onIdle: fireStop,
		onCleanup: fireStop
	};
}
//#endregion
Object.defineProperty(exports, "createTypingCallbacks", {
	enumerable: true,
	get: function() {
		return createTypingCallbacks;
	}
});
