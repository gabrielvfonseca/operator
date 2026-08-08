const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
//#region src/tasks/runtime-internal.ts
var runtime_internal_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ ensureTaskRuntimeStateReady: () => ensureTaskRuntimeStateReady });
function ensureTaskRuntimeStateReady() {
	require_task_registry.ensureTaskFlowRegistryReady();
	require_task_registry.ensureTaskRegistryReady();
}
//#endregion
Object.defineProperty(exports, "runtime_internal_exports", {
	enumerable: true,
	get: function() {
		return runtime_internal_exports;
	}
});
