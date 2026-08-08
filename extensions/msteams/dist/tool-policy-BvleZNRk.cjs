const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
//#region src/agents/cli-runner/tool-policy.ts
/** CLI backends cannot enforce runtime caps; keep only real restrictions. */
function resolveCliRuntimeToolsAllow(toolsAllow, toolsAllowIsDefault) {
	if (toolsAllow === void 0 || toolsAllowIsDefault) return;
	return toolsAllow.some((toolName) => require_tool_policy.normalizeToolName(toolName) === "*") ? void 0 : toolsAllow;
}
//#endregion
Object.defineProperty(exports, "resolveCliRuntimeToolsAllow", {
	enumerable: true,
	get: function() {
		return resolveCliRuntimeToolsAllow;
	}
});
