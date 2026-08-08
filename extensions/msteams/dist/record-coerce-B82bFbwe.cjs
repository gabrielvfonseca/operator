//#region packages/normalization-core/src/record-coerce.ts
/** Type guard for non-array object records at browser-safe boundaries. */
function isRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
/** Coerces object-like values to records, falling back to an empty record. */
function asRecord(value) {
	return typeof value === "object" && value !== null ? value : {};
}
//#endregion
Object.defineProperty(exports, "asRecord", {
	enumerable: true,
	get: function() {
		return asRecord;
	}
});
Object.defineProperty(exports, "isRecord", {
	enumerable: true,
	get: function() {
		return isRecord;
	}
});
