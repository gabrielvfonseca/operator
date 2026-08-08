const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
//#region packages/normalization-core/src/string-normalization.ts
/** Coerces entries to strings, trims them, and drops empty results. */
function normalizeStringEntries(list) {
	return (list ?? []).map((entry) => require_string_coerce.normalizeOptionalString(String(entry)) ?? "").filter(Boolean);
}
/** Returns first-seen unique values while preserving insertion order. */
function uniqueValues(values) {
	return [...new Set(values)];
}
/** Returns first-seen unique strings while preserving insertion order. */
function uniqueStrings(values) {
	return uniqueValues(values);
}
/** Returns unique strings sorted with stable ASCII comparison. */
function sortUniqueStrings(values) {
	return uniqueStrings(values).toSorted((left, right) => left < right ? -1 : left > right ? 1 : 0);
}
/** Normalizes entries, removes duplicates, and preserves first-seen order. */
function normalizeUniqueStringEntries(values) {
	return uniqueStrings(normalizeStringEntries(values ? [...values] : void 0));
}
/** Normalizes array-backed string lists and rejects non-array input as empty. */
function normalizeTrimmedStringList(value) {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry) => {
		const normalized = require_string_coerce.normalizeOptionalString(entry);
		return normalized ? [normalized] : [];
	});
}
/** Normalizes an array-backed string list and removes duplicates. */
function normalizeUniqueTrimmedStringList(value) {
	return uniqueStrings(normalizeTrimmedStringList(value));
}
//#endregion
Object.defineProperty(exports, "normalizeStringEntries", {
	enumerable: true,
	get: function() {
		return normalizeStringEntries;
	}
});
Object.defineProperty(exports, "normalizeTrimmedStringList", {
	enumerable: true,
	get: function() {
		return normalizeTrimmedStringList;
	}
});
Object.defineProperty(exports, "normalizeUniqueStringEntries", {
	enumerable: true,
	get: function() {
		return normalizeUniqueStringEntries;
	}
});
Object.defineProperty(exports, "normalizeUniqueTrimmedStringList", {
	enumerable: true,
	get: function() {
		return normalizeUniqueTrimmedStringList;
	}
});
Object.defineProperty(exports, "sortUniqueStrings", {
	enumerable: true,
	get: function() {
		return sortUniqueStrings;
	}
});
Object.defineProperty(exports, "uniqueStrings", {
	enumerable: true,
	get: function() {
		return uniqueStrings;
	}
});
Object.defineProperty(exports, "uniqueValues", {
	enumerable: true,
	get: function() {
		return uniqueValues;
	}
});
