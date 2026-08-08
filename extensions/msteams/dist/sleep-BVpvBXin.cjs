const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
//#region src/utils/sleep.ts
/** Promise-based sleep that clamps timer inputs through the shared timeout resolver. */
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(ms, 0, 0));
	});
}
//#endregion
Object.defineProperty(exports, "sleep", {
	enumerable: true,
	get: function() {
		return sleep;
	}
});
