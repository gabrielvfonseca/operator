const require_plain_object = require("./plain-object-CITRo0uW.cjs");
require("./utils-CXqBhRFw.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
//#region src/agents/code-mode-control-tools.ts
/**
* Tags Code Mode exec/wait control tools and normalizes hook params for the
* exec-compatible before-tool-call surface.
*/
/** Model-visible Code Mode exec tool name. */
const CODE_MODE_EXEC_TOOL_NAME = "exec";
/** Model-visible Code Mode wait tool name. */
const CODE_MODE_WAIT_TOOL_NAME = "wait";
/** Direct tools whose structured results cannot cross the JSON-only guest bridge. */
const CODE_MODE_DIRECT_TOOL_NAMES = /* @__PURE__ */ new Set(["computer", "image"]);
/** Hook metadata kind for Code Mode exec tools. */
const CODE_MODE_EXEC_TOOL_KIND = "code_mode_exec";
const codeModeControlTools = /* @__PURE__ */ new WeakSet();
/** Mark a tool as owned by code mode control flow. */
function markCodeModeControlTool(tool) {
	codeModeControlTools.add(tool);
	return tool;
}
/** Replicate code-mode identity from an original tool object to a wrapper. */
function copyCodeModeControlToolIdentity(original, wrapper) {
	if (codeModeControlTools.has(original)) codeModeControlTools.add(wrapper);
}
/** Return whether a tool was marked as code-mode owned. */
function isCodeModeControlTool(tool) {
	return codeModeControlTools.has(tool);
}
/** Return whether a provider payload tool may remain model-visible in Code Mode. */
function isCodeModeModelVisibleToolName(name) {
	return name === "exec" || name === "wait" || CODE_MODE_DIRECT_TOOL_NAMES.has(name);
}
function isCodeModeExecTool(tool) {
	return isCodeModeControlTool(tool) && require_tool_policy.normalizeToolName(tool.name) === "exec";
}
function resolveCodeModeExecToolInputKind(params) {
	if (!require_plain_object.isPlainObject(params)) return;
	const language = params.language;
	if (language === void 0 || language === "javascript") return "javascript";
	if (language === "typescript") return "typescript";
}
function normalizeCodeModeExecParams(params) {
	if (!require_plain_object.isPlainObject(params)) return params;
	const code = params.code;
	const command = params.command;
	if (typeof code === "string" && typeof command !== "string") return {
		...params,
		command: params.code
	};
	if (typeof command === "string" && typeof code !== "string") return {
		...params,
		code: params.command
	};
	return params;
}
/** Build before-tool-call metadata for a marked code-mode exec tool. */
function getCodeModeExecBeforeHookMetadata(params) {
	if (!isCodeModeExecTool(params.tool)) return;
	const toolInputKind = resolveCodeModeExecToolInputKind(params.params);
	return {
		toolKind: CODE_MODE_EXEC_TOOL_KIND,
		...toolInputKind && { toolInputKind }
	};
}
/** Build before-tool-call metadata when only the tool kind is available. */
function getCodeModeExecBeforeHookMetadataForToolKind(params) {
	if (params.toolKind !== CODE_MODE_EXEC_TOOL_KIND) return;
	const toolInputKind = resolveCodeModeExecToolInputKind(params.params);
	return {
		toolKind: CODE_MODE_EXEC_TOOL_KIND,
		...toolInputKind && { toolInputKind }
	};
}
/** Normalize before-hook params for a marked code-mode exec tool. */
function normalizeCodeModeExecBeforeHookParams(params) {
	if (!isCodeModeExecTool(params.tool)) return params.params;
	return normalizeCodeModeExecParams(params.params);
}
/** Normalize before-hook params when only the code-mode tool kind is available. */
function normalizeCodeModeExecBeforeHookParamsForToolKind(params) {
	if (params.toolKind !== CODE_MODE_EXEC_TOOL_KIND) return params.params;
	return normalizeCodeModeExecParams(params.params);
}
/** Reconcile hook-adjusted `code` and `command` fields after code-mode normalization. */
function reconcileCodeModeExecBeforeHookParams(params) {
	if (!isCodeModeExecTool(params.tool) || !require_plain_object.isPlainObject(params.originalParams) || !require_plain_object.isPlainObject(params.hookParams) || !require_plain_object.isPlainObject(params.adjustedParams)) return params.adjustedParams;
	const hookCode = params.hookParams.code;
	const hookCommand = params.hookParams.command;
	if (typeof hookCode !== "string" || hookCode !== hookCommand) return params.adjustedParams;
	const adjustedCode = params.adjustedParams.code;
	const adjustedCommand = params.adjustedParams.command;
	const adjustedCodeChanged = typeof adjustedCode === "string" && adjustedCode !== hookCode;
	const adjustedCommandChanged = typeof adjustedCommand === "string" && adjustedCommand !== hookCode;
	if (adjustedCodeChanged === adjustedCommandChanged) return params.adjustedParams;
	if (adjustedCodeChanged) return {
		...params.adjustedParams,
		command: adjustedCode
	};
	if (adjustedCommandChanged) return {
		...params.adjustedParams,
		code: adjustedCommand
	};
	return params.adjustedParams;
}
//#endregion
Object.defineProperty(exports, "CODE_MODE_EXEC_TOOL_NAME", {
	enumerable: true,
	get: function() {
		return CODE_MODE_EXEC_TOOL_NAME;
	}
});
Object.defineProperty(exports, "CODE_MODE_WAIT_TOOL_NAME", {
	enumerable: true,
	get: function() {
		return CODE_MODE_WAIT_TOOL_NAME;
	}
});
Object.defineProperty(exports, "copyCodeModeControlToolIdentity", {
	enumerable: true,
	get: function() {
		return copyCodeModeControlToolIdentity;
	}
});
Object.defineProperty(exports, "getCodeModeExecBeforeHookMetadata", {
	enumerable: true,
	get: function() {
		return getCodeModeExecBeforeHookMetadata;
	}
});
Object.defineProperty(exports, "getCodeModeExecBeforeHookMetadataForToolKind", {
	enumerable: true,
	get: function() {
		return getCodeModeExecBeforeHookMetadataForToolKind;
	}
});
Object.defineProperty(exports, "isCodeModeControlTool", {
	enumerable: true,
	get: function() {
		return isCodeModeControlTool;
	}
});
Object.defineProperty(exports, "isCodeModeModelVisibleToolName", {
	enumerable: true,
	get: function() {
		return isCodeModeModelVisibleToolName;
	}
});
Object.defineProperty(exports, "markCodeModeControlTool", {
	enumerable: true,
	get: function() {
		return markCodeModeControlTool;
	}
});
Object.defineProperty(exports, "normalizeCodeModeExecBeforeHookParams", {
	enumerable: true,
	get: function() {
		return normalizeCodeModeExecBeforeHookParams;
	}
});
Object.defineProperty(exports, "normalizeCodeModeExecBeforeHookParamsForToolKind", {
	enumerable: true,
	get: function() {
		return normalizeCodeModeExecBeforeHookParamsForToolKind;
	}
});
Object.defineProperty(exports, "reconcileCodeModeExecBeforeHookParams", {
	enumerable: true,
	get: function() {
		return reconcileCodeModeExecBeforeHookParams;
	}
});
