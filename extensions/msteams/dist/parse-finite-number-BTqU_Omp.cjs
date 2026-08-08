//#region packages/normalization-core/src/number-coercion.ts
/** Returns a number only when the input is already finite. */
function asFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
/** Returns a finite number only when it satisfies the supplied inclusive/exclusive bounds. */
function asFiniteNumberInRange(value, range) {
	const number = asFiniteNumber(value);
	if (number === void 0) return;
	if (range.min !== void 0) {
		if (range.minExclusive ? number <= range.min : number < range.min) return;
	}
	if (range.max !== void 0) {
		if (range.maxExclusive ? number >= range.max : number > range.max) return;
	}
	return number;
}
function normalizeNumericString(value) {
	const trimmed = value.trim();
	return trimmed ? trimmed : void 0;
}
/** Parses only safe integer numbers or base-10 integer strings. */
function parseStrictInteger(value) {
	if (typeof value === "number") return Number.isSafeInteger(value) ? value : void 0;
	if (typeof value !== "string") return;
	const normalized = normalizeNumericString(value);
	if (!normalized || !/^[+-]?\d+$/.test(normalized)) return;
	const parsed = Number(normalized);
	return Number.isSafeInteger(parsed) ? parsed : void 0;
}
/** Parses only finite decimal/scientific string tokens, rejecting partial numbers. */
function parseStrictFiniteNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : void 0;
	if (typeof value !== "string") return;
	const normalized = normalizeNumericString(value);
	if (!normalized || !/^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(normalized)) return;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : void 0;
}
/** Returns positive safe integers without string coercion. */
function asPositiveSafeInteger(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : void 0;
}
/** Conservative upper bound for Node timer delays. */
const MAX_TIMER_TIMEOUT_MS = 2147e6;
/** Largest timestamp accepted by JavaScript Date. */
const MAX_DATE_TIMESTAMP_MS = 864e13;
/** Returns a Date-valid millisecond timestamp. */
function asDateTimestampMs(value) {
	return asFiniteNumberInRange(value, {
		min: -864e13,
		max: MAX_DATE_TIMESTAMP_MS
	});
}
/** Checks whether a Date-valid timestamp is after the supplied/current time. */
function isFutureDateTimestampMs(value, opts = {}) {
	const timestampMs = asDateTimestampMs(value);
	const nowMs = asDateTimestampMs(opts.nowMs ?? Date.now());
	return timestampMs !== void 0 && nowMs !== void 0 && timestampMs > nowMs;
}
/** Converts Date-valid millisecond timestamps to ISO strings. */
function timestampMsToIsoString(value) {
	const timestampMs = asDateTimestampMs(value);
	return timestampMs === void 0 ? void 0 : new Date(timestampMs).toISOString();
}
/** Resolves arbitrary timeout input with fallback and minimum timer bounds. */
function resolveTimerTimeoutMs(valueMs, fallbackMs, minMs = 1) {
	const value = asFiniteNumber(valueMs) ?? asFiniteNumber(fallbackMs);
	const min = Math.max(0, Math.floor(minMs));
	if (value === void 0) return min;
	return Math.min(Math.max(Math.floor(value), min), MAX_TIMER_TIMEOUT_MS);
}
/** Resolves an integer option from finite numeric input or fallback, then clamps bounds. */
function resolveIntegerOption(value, fallback, range = {}) {
	const floored = Math.floor(typeof value === "number" && Number.isFinite(value) ? value : fallback);
	const minBounded = range.min === void 0 ? floored : Math.max(range.min, floored);
	return range.max === void 0 ? minBounded : Math.min(range.max, minBounded);
}
/** Resolves an integer option with a non-negative lower bound. */
function resolveNonNegativeIntegerOption(value, fallback) {
	return resolveIntegerOption(value, fallback, { min: 0 });
}
/** Parses strict positive integer values from numbers or strings. */
function parseStrictPositiveInteger(value) {
	const parsed = parseStrictInteger(value);
	return parsed !== void 0 && parsed > 0 ? parsed : void 0;
}
/** Parses strict non-negative integer values from numbers or strings. */
function parseStrictNonNegativeInteger(value) {
	const parsed = parseStrictInteger(value);
	return parsed !== void 0 && parsed >= 0 ? parsed : void 0;
}
/** Converts strict positive seconds to safe millisecond counts. */
function positiveSecondsToSafeMilliseconds(value) {
	const seconds = parseStrictPositiveInteger(value);
	if (seconds === void 0) return;
	const milliseconds = seconds * 1e3;
	return Number.isSafeInteger(milliseconds) ? milliseconds : void 0;
}
/** Converts strict non-negative seconds to safe millisecond counts. */
function nonNegativeSecondsToSafeMilliseconds(value) {
	const seconds = parseStrictNonNegativeInteger(value);
	if (seconds === void 0) return;
	const milliseconds = seconds * 1e3;
	return Number.isSafeInteger(milliseconds) ? milliseconds : void 0;
}
/** Resolves an absolute expiration timestamp from a positive duration in milliseconds. */
function resolveExpiresAtMsFromDurationMs(value, opts = {}) {
	const durationMs = asPositiveSafeInteger(value);
	if (durationMs === void 0) return;
	const nowMs = asDateTimestampMs(opts.nowMs ?? Date.now());
	const bufferMs = asFiniteNumber(opts.bufferMs ?? 0);
	if (nowMs === void 0 || bufferMs === void 0) return;
	const expiresAt = nowMs + durationMs - bufferMs;
	if (!Number.isSafeInteger(expiresAt) || timestampMsToIsoString(expiresAt) === void 0) return;
	const minRemainingMs = opts.minRemainingMs;
	if (minRemainingMs === void 0) return expiresAt;
	const minExpiresAt = nowMs + minRemainingMs;
	if (!Number.isSafeInteger(minExpiresAt) || timestampMsToIsoString(minExpiresAt) === void 0) return expiresAt;
	return Math.max(expiresAt, minExpiresAt);
}
/** Resolves an absolute expiration timestamp from a positive duration in seconds. */
function resolveExpiresAtMsFromDurationSeconds(value, opts = {}) {
	const durationMs = positiveSecondsToSafeMilliseconds(value);
	return durationMs === void 0 ? void 0 : resolveExpiresAtMsFromDurationMs(durationMs, opts);
}
/** Resolves an absolute expiration timestamp from Unix epoch seconds. */
function resolveExpiresAtMsFromEpochSeconds(value, opts = {}) {
	const epochMs = typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.trunc(value) * 1e3 : positiveSecondsToSafeMilliseconds(value);
	if (epochMs === void 0) return;
	const expiresAt = epochMs - (opts.bufferMs ?? 0);
	if (!Number.isSafeInteger(expiresAt)) return;
	if (timestampMsToIsoString(expiresAt) === void 0) return;
	const maxMs = opts.maxMs;
	return maxMs === void 0 || expiresAt <= maxMs ? expiresAt : void 0;
}
//#endregion
Object.defineProperty(exports, "MAX_TIMER_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return MAX_TIMER_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "asDateTimestampMs", {
	enumerable: true,
	get: function() {
		return asDateTimestampMs;
	}
});
Object.defineProperty(exports, "asFiniteNumber", {
	enumerable: true,
	get: function() {
		return asFiniteNumber;
	}
});
Object.defineProperty(exports, "asFiniteNumberInRange", {
	enumerable: true,
	get: function() {
		return asFiniteNumberInRange;
	}
});
Object.defineProperty(exports, "isFutureDateTimestampMs", {
	enumerable: true,
	get: function() {
		return isFutureDateTimestampMs;
	}
});
Object.defineProperty(exports, "nonNegativeSecondsToSafeMilliseconds", {
	enumerable: true,
	get: function() {
		return nonNegativeSecondsToSafeMilliseconds;
	}
});
Object.defineProperty(exports, "parseStrictFiniteNumber", {
	enumerable: true,
	get: function() {
		return parseStrictFiniteNumber;
	}
});
Object.defineProperty(exports, "parseStrictInteger", {
	enumerable: true,
	get: function() {
		return parseStrictInteger;
	}
});
Object.defineProperty(exports, "parseStrictNonNegativeInteger", {
	enumerable: true,
	get: function() {
		return parseStrictNonNegativeInteger;
	}
});
Object.defineProperty(exports, "parseStrictPositiveInteger", {
	enumerable: true,
	get: function() {
		return parseStrictPositiveInteger;
	}
});
Object.defineProperty(exports, "positiveSecondsToSafeMilliseconds", {
	enumerable: true,
	get: function() {
		return positiveSecondsToSafeMilliseconds;
	}
});
Object.defineProperty(exports, "resolveExpiresAtMsFromDurationMs", {
	enumerable: true,
	get: function() {
		return resolveExpiresAtMsFromDurationMs;
	}
});
Object.defineProperty(exports, "resolveExpiresAtMsFromDurationSeconds", {
	enumerable: true,
	get: function() {
		return resolveExpiresAtMsFromDurationSeconds;
	}
});
Object.defineProperty(exports, "resolveExpiresAtMsFromEpochSeconds", {
	enumerable: true,
	get: function() {
		return resolveExpiresAtMsFromEpochSeconds;
	}
});
Object.defineProperty(exports, "resolveNonNegativeIntegerOption", {
	enumerable: true,
	get: function() {
		return resolveNonNegativeIntegerOption;
	}
});
Object.defineProperty(exports, "resolveTimerTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveTimerTimeoutMs;
	}
});
Object.defineProperty(exports, "timestampMsToIsoString", {
	enumerable: true,
	get: function() {
		return timestampMsToIsoString;
	}
});
