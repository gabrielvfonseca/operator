let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/utils/boolean.ts
const DEFAULT_TRUTHY = [
	"true",
	"1",
	"yes",
	"on"
];
const DEFAULT_FALSY = [
	"false",
	"0",
	"no",
	"off"
];
const DEFAULT_TRUTHY_SET = new Set(DEFAULT_TRUTHY);
const DEFAULT_FALSY_SET = new Set(DEFAULT_FALSY);
/** Returns only real boolean values and leaves boolean-like strings for explicit parsing. */
function asBoolean(value) {
	return typeof value === "boolean" ? value : void 0;
}
/** Parses booleans and configured string literals, returning undefined for ambiguous input. */
function parseBooleanValue(value, options = {}) {
	const booleanValue = asBoolean(value);
	if (booleanValue !== void 0) return booleanValue;
	if (typeof value !== "string") return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (!normalized) return;
	const truthy = options.truthy ?? DEFAULT_TRUTHY;
	const falsy = options.falsy ?? DEFAULT_FALSY;
	const truthySet = truthy === DEFAULT_TRUTHY ? DEFAULT_TRUTHY_SET : new Set(truthy);
	const falsySet = falsy === DEFAULT_FALSY ? DEFAULT_FALSY_SET : new Set(falsy);
	if (truthySet.has(normalized)) return true;
	if (falsySet.has(normalized)) return false;
}
//#endregion
Object.defineProperty(exports, "asBoolean", {
	enumerable: true,
	get: function() {
		return asBoolean;
	}
});
Object.defineProperty(exports, "parseBooleanValue", {
	enumerable: true,
	get: function() {
		return parseBooleanValue;
	}
});
