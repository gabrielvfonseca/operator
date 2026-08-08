require("./utils-CXqBhRFw.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/commands/doctor/shared/legacy-config-record-shared.ts
/** Clone a record-like config section, treating undefined as an empty object. */
function cloneRecord(value) {
	return { ...value };
}
/** Ensure a nested config value is a mutable record and return it. */
function ensureRecord(target, key) {
	const current = target[key];
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(current)) return current;
	const next = {};
	target[key] = next;
	return next;
}
/** Own-property guard used by migrations that must preserve falsy values. */
function hasOwnKey(target, key) {
	return Object.hasOwn(target, key);
}
//#endregion
Object.defineProperty(exports, "cloneRecord", {
	enumerable: true,
	get: function() {
		return cloneRecord;
	}
});
Object.defineProperty(exports, "ensureRecord", {
	enumerable: true,
	get: function() {
		return ensureRecord;
	}
});
Object.defineProperty(exports, "hasOwnKey", {
	enumerable: true,
	get: function() {
		return hasOwnKey;
	}
});
