const require_shared = require("./shared-Bt0YEZDW.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/secrets/secret-value.ts
/** Validates resolved secret values against expected value shapes. */
/**
* Returns whether a resolved provider value satisfies the target's accepted runtime shape.
*/
function isExpectedResolvedSecretValue(value, expected) {
	if (expected === "string") return require_shared.isNonEmptyString(value);
	return require_shared.isNonEmptyString(value) || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value);
}
/**
* Returns whether an inline configured value should be treated as plaintext secret material.
*/
function hasConfiguredPlaintextSecretValue(value, expected) {
	if (expected === "string") return require_shared.isNonEmptyString(value);
	return require_shared.isNonEmptyString(value) || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && Object.keys(value).length > 0;
}
/**
* Throws a caller-provided error when a resolved secret value does not match its target shape.
*/
function assertExpectedResolvedSecretValue(params) {
	if (!isExpectedResolvedSecretValue(params.value, params.expected)) throw new Error(params.errorMessage);
}
//#endregion
Object.defineProperty(exports, "assertExpectedResolvedSecretValue", {
	enumerable: true,
	get: function() {
		return assertExpectedResolvedSecretValue;
	}
});
Object.defineProperty(exports, "hasConfiguredPlaintextSecretValue", {
	enumerable: true,
	get: function() {
		return hasConfiguredPlaintextSecretValue;
	}
});
Object.defineProperty(exports, "isExpectedResolvedSecretValue", {
	enumerable: true,
	get: function() {
		return isExpectedResolvedSecretValue;
	}
});
