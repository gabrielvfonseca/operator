require("./rolldown-runtime-u92d-OFm.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
require("./model-selection-BvFurMxy.cjs");
//#region src/commitments/model-selection.runtime.ts
function resolveCommitmentDefaultModelRef(params) {
	return require_codex_plugin_diagnostics.resolveDefaultModelForAgent(params);
}
//#endregion
exports.resolveCommitmentDefaultModelRef = resolveCommitmentDefaultModelRef;
