require("./rolldown-runtime-u92d-OFm.cjs");
const require_model_suppression = require("./model-suppression-DJYSur8B.cjs");
//#region src/agents/model-suppression.runtime.ts
/**
* Runtime seam for built-in model suppression.
* Lets tests and lazy catalog paths stub suppression behavior without importing
* the full suppression implementation at module load.
*/
/** Runtime-forwarded predicate for hiding bundled models. */
function shouldSuppressBuiltInModel(...args) {
	return require_model_suppression.shouldSuppressBuiltInModel(...args);
}
/** Build a provider-aware predicate for hiding bundled models. */
function buildShouldSuppressBuiltInModel(...args) {
	return require_model_suppression.buildShouldSuppressBuiltInModel(...args);
}
//#endregion
exports.buildShouldSuppressBuiltInModel = buildShouldSuppressBuiltInModel;
exports.shouldSuppressBuiltInModel = shouldSuppressBuiltInModel;
