const require_plain_object = require("./plain-object-CITRo0uW.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
//#region src/infra/deep-merge.ts
function sanitizePlainObject(value) {
	const sanitized = {};
	for (const [key, entry] of Object.entries(value)) {
		if (require_prototype_keys.isBlockedObjectKey(key)) continue;
		sanitized[key] = require_plain_object.isPlainObject(entry) ? sanitizePlainObject(entry) : entry;
	}
	return sanitized;
}
/** Merge plain objects while preserving Operator's null, undefined, and array policies. */
function mergeDeep(base, override, options = {}) {
	const arrays = options.arrays ?? "replace";
	const undefinedValues = options.undefinedValues ?? "skip";
	if (Array.isArray(base) && Array.isArray(override)) return arrays === "concat" ? [...base, ...override] : override;
	if (!require_plain_object.isPlainObject(base) || !require_plain_object.isPlainObject(override)) return override === void 0 && undefinedValues === "skip" ? base : override;
	const merged = sanitizePlainObject(base);
	for (const [key, value] of Object.entries(override)) {
		if (require_prototype_keys.isBlockedObjectKey(key) || value === void 0 && undefinedValues === "skip") continue;
		const current = merged[key];
		if (require_plain_object.isPlainObject(value)) merged[key] = require_plain_object.isPlainObject(current) ? mergeDeep(current, value, options) : sanitizePlainObject(value);
		else if (arrays === "concat" && Array.isArray(current) && Array.isArray(value)) merged[key] = [...current, ...value];
		else merged[key] = value;
	}
	return merged;
}
//#endregion
Object.defineProperty(exports, "mergeDeep", {
	enumerable: true,
	get: function() {
		return mergeDeep;
	}
});
