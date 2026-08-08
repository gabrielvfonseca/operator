//#region src/agents/subagent-registry-steer-runtime.ts
let replaceSubagentRunAfterSteerImpl = null;
let finalizeInterruptedSubagentRunImpl = null;
/** Installs registry mutation hooks used by steer/recovery runtime paths. */
function configureSubagentRegistrySteerRuntime(params) {
	replaceSubagentRunAfterSteerImpl = params.replaceSubagentRunAfterSteer;
	finalizeInterruptedSubagentRunImpl = params.finalizeInterruptedSubagentRun ?? null;
}
/** Replaces a previous run id after steering, returning false when no hook is installed. */
function replaceSubagentRunAfterSteer(params) {
	return replaceSubagentRunAfterSteerImpl?.(params) ?? false;
}
/** Finalizes one interrupted run generation through the installed registry hook. */
async function finalizeInterruptedSubagentRun(params) {
	return await finalizeInterruptedSubagentRunImpl?.(params) ?? 0;
}
//#endregion
Object.defineProperty(exports, "configureSubagentRegistrySteerRuntime", {
	enumerable: true,
	get: function() {
		return configureSubagentRegistrySteerRuntime;
	}
});
Object.defineProperty(exports, "finalizeInterruptedSubagentRun", {
	enumerable: true,
	get: function() {
		return finalizeInterruptedSubagentRun;
	}
});
Object.defineProperty(exports, "replaceSubagentRunAfterSteer", {
	enumerable: true,
	get: function() {
		return replaceSubagentRunAfterSteer;
	}
});
