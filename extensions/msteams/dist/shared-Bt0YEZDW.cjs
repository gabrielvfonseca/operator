const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
require("./utils-CXqBhRFw.cjs");
require("./replace-file-D77oDPOz.cjs");
require("./private-file-store-C0DdQCy-.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/secrets/shared.ts
/** Shared parsing and file helpers for secrets migration/runtime code. */
/**
* Narrows to strings that contain non-whitespace content.
*/
function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
/**
* Normalizes numeric config to a positive integer, falling back when the input is not finite.
*/
function normalizePositiveInt(value, fallback) {
	if (typeof value === "number" && Number.isFinite(value)) return Math.max(1, Math.floor(value));
	return Math.max(1, Math.floor(fallback));
}
/**
* Normalizes timer values with the shared timeout coercion rules used by secret providers.
*/
function normalizePositiveTimerMs(value, fallback) {
	return (0, require_number_coercion.number_coercion_exports.resolvePositiveTimerTimeoutMs)(value, fallback);
}
/**
* Splits a dotted config path into non-empty trimmed segments.
*/
function parseDotPath(pathname) {
	return pathname.split(".").map((segment) => segment.trim()).filter((segment) => segment.length > 0);
}
//#endregion
Object.defineProperty(exports, "isNonEmptyString", {
	enumerable: true,
	get: function() {
		return isNonEmptyString;
	}
});
Object.defineProperty(exports, "normalizePositiveInt", {
	enumerable: true,
	get: function() {
		return normalizePositiveInt;
	}
});
Object.defineProperty(exports, "normalizePositiveTimerMs", {
	enumerable: true,
	get: function() {
		return normalizePositiveTimerMs;
	}
});
Object.defineProperty(exports, "parseDotPath", {
	enumerable: true,
	get: function() {
		return parseDotPath;
	}
});
