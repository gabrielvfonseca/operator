//#region packages/normalization-core/src/string-coerce.ts
/** Reads a value only when it is already a string, preserving whitespace. */
function readStringValue(value) {
	return typeof value === "string" ? value : void 0;
}
/** Trims string input and returns null for non-strings or empty strings. */
function normalizeNullableString(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}
/** Trims string input and returns undefined for non-strings or empty strings. */
function normalizeOptionalString(value) {
	return normalizeNullableString(value) ?? void 0;
}
/** Lowercases a normalized optional string. */
function normalizeOptionalLowercaseString(value) {
	return normalizeOptionalString(value)?.toLowerCase();
}
/** Lowercases a normalized string or returns an empty string when absent. */
function normalizeLowercaseStringOrEmpty(value) {
	return normalizeOptionalLowercaseString(value) ?? "";
}
/** Parses loose boolean/fast-mode flags from strings or booleans. */
function normalizeFastMode(raw) {
	if (typeof raw === "boolean") return raw;
	if (!raw) return;
	const key = normalizeLowercaseStringOrEmpty(raw);
	if ([
		"off",
		"false",
		"no",
		"0",
		"disable",
		"disabled",
		"normal"
	].includes(key)) return false;
	if ([
		"on",
		"true",
		"yes",
		"1",
		"enable",
		"enabled",
		"fast"
	].includes(key)) return true;
	if (["auto", "automatic"].includes(key)) return "auto";
}
/** Reads a string directly or from an object's `primary` field. */
function resolvePrimaryStringValue(value) {
	if (typeof value === "string") return normalizeOptionalString(value);
	if (!value || typeof value !== "object") return;
	return normalizeOptionalString(value.primary);
}
/** Normalizes thread ids that may be numeric or string-backed. */
function normalizeOptionalThreadValue(value) {
	if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : void 0;
	return normalizeOptionalString(value);
}
/** Normalizes a thread/id value and stringifies finite numeric ids. */
function normalizeOptionalStringifiedId(value) {
	const normalized = normalizeOptionalThreadValue(value);
	return normalized == null ? void 0 : String(normalized);
}
/** Type guard for strings that remain non-empty after trimming. */
function hasNonEmptyString(value) {
	return normalizeOptionalString(value) !== void 0;
}
//#endregion
Object.defineProperty(exports, "hasNonEmptyString", {
	enumerable: true,
	get: function() {
		return hasNonEmptyString;
	}
});
Object.defineProperty(exports, "normalizeFastMode", {
	enumerable: true,
	get: function() {
		return normalizeFastMode;
	}
});
Object.defineProperty(exports, "normalizeLowercaseStringOrEmpty", {
	enumerable: true,
	get: function() {
		return normalizeLowercaseStringOrEmpty;
	}
});
Object.defineProperty(exports, "normalizeOptionalLowercaseString", {
	enumerable: true,
	get: function() {
		return normalizeOptionalLowercaseString;
	}
});
Object.defineProperty(exports, "normalizeOptionalString", {
	enumerable: true,
	get: function() {
		return normalizeOptionalString;
	}
});
Object.defineProperty(exports, "normalizeOptionalStringifiedId", {
	enumerable: true,
	get: function() {
		return normalizeOptionalStringifiedId;
	}
});
Object.defineProperty(exports, "normalizeOptionalThreadValue", {
	enumerable: true,
	get: function() {
		return normalizeOptionalThreadValue;
	}
});
Object.defineProperty(exports, "readStringValue", {
	enumerable: true,
	get: function() {
		return readStringValue;
	}
});
Object.defineProperty(exports, "resolvePrimaryStringValue", {
	enumerable: true,
	get: function() {
		return resolvePrimaryStringValue;
	}
});
