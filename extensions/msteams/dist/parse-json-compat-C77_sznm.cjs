const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let json5 = require("json5");
json5 = require_rolldown_runtime.__toESM(json5, 1);
//#region src/utils/parse-json-compat.ts
/**
* JSON parser compatibility helper for persisted config, manifests, and legacy stores.
* Strict JSON stays the fast path; JSON5 is only the authored/legacy fallback.
*/
/** Parses strict JSON first, then accepts JSON5 syntax such as comments and trailing commas. */
function parseJsonWithJson5Fallback(raw, json5$1 = json5.default) {
	try {
		return JSON.parse(raw);
	} catch {
		return json5$1.parse(raw);
	}
}
//#endregion
Object.defineProperty(exports, "parseJsonWithJson5Fallback", {
	enumerable: true,
	get: function() {
		return parseJsonWithJson5Fallback;
	}
});
