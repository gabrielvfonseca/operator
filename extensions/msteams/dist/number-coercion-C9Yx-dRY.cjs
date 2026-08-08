const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
//#region src/shared/number-coercion.ts
var number_coercion_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ resolveNonNegativeNumber: () => resolveNonNegativeNumber });
require_rolldown_runtime.__reExport(number_coercion_exports, require("@gabrielvfonseca/normalization-core/number-coercion"));
function resolveNonNegativeNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : void 0;
}
//#endregion
Object.defineProperty(exports, "number_coercion_exports", {
	enumerable: true,
	get: function() {
		return number_coercion_exports;
	}
});
Object.defineProperty(exports, "resolveNonNegativeNumber", {
	enumerable: true,
	get: function() {
		return resolveNonNegativeNumber;
	}
});
