require("./agent-bundle-mcp-names-DiSt2aZy.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
//#region src/agents/core-tool-factory-descriptors.ts
const CORE_TOOL_FACTORY_FAMILY_BY_NAME = new Map([
	{
		name: "edit",
		family: "base-coding"
	},
	{
		name: "read",
		family: "base-coding"
	},
	{
		name: "write",
		family: "base-coding"
	},
	{
		name: "apply_patch",
		family: "shell"
	},
	{
		name: "exec",
		family: "shell"
	},
	{
		name: "process",
		family: "shell"
	},
	{
		name: "agents_list",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "@gabrielvfonseca/operator",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "computer",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "cron",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "gateway",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "get_goal",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "heartbeat_respond",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "image",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "image_generate",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "message",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "music_generate",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "nodes",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "pdf",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "session_status",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "sessions",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "sessions_history",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "sessions_list",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "sessions_search",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "sessions_send",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "sessions_spawn",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "sessions_yield",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "skill_workshop",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "spawn_task",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "create_goal",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "subagents",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "transcripts",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "tts",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "update_goal",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "update_plan",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "dismiss_task",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "video_generate",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "web_fetch",
		family: "@gabrielvfonseca/operator"
	},
	{
		name: "web_search",
		family: "@gabrielvfonseca/operator"
	}
].map(({ name, family }) => [name, family]));
function resolveCoreToolFactoryFamily(name) {
	return CORE_TOOL_FACTORY_FAMILY_BY_NAME.get(name);
}
//#endregion
//#region src/agents/embedded-agent-runner/run/attempt-tool-construction-plan.ts
/**
* Plans which core, bundle MCP, and bundle LSP tools an attempt should build.
*/
const ALL_CODING_TOOL_CONSTRUCTION_PLAN = {
	includeBaseCodingTools: true,
	includeShellTools: true,
	includeChannelTools: true,
	includeOperatorTools: true,
	includePluginTools: true
};
const NO_CODING_TOOL_CONSTRUCTION_PLAN = {
	includeBaseCodingTools: false,
	includeShellTools: false,
	includeChannelTools: false,
	includeOperatorTools: false,
	includePluginTools: false
};
function cloneCodingToolConstructionPlan(plan) {
	return { ...plan };
}
function isBundleMcpAllowlistName(normalized) {
	return normalized === "bundle-mcp" || normalized.includes("__");
}
function isPluginGroupAllowlistName(normalized) {
	return normalized === "group:plugins";
}
function hasWildcardToolAllowlist(toolsAllow) {
	return toolsAllow.some((entry) => require_tool_policy.normalizeToolName(entry) === "*");
}
/**
* Applies a runtime allowlist to a concrete tool list after expanding tool and
* plugin groups. Undefined allowlists keep all tools; an explicit empty list
* intentionally disables all runtime tools.
*/
function applyEmbeddedAttemptToolsAllow(tools, toolsAllow, options) {
	if (!toolsAllow) return tools;
	if (toolsAllow.length === 0) return [];
	if (hasWildcardToolAllowlist(toolsAllow)) return tools;
	const pluginGroups = options?.toolMeta ? require_tool_policy.buildPluginToolGroups({
		tools,
		toolMeta: options.toolMeta
	}) : void 0;
	const policy = pluginGroups ? require_tool_policy.expandPolicyWithPluginGroups({ allow: toolsAllow }, pluginGroups) : { allow: toolsAllow };
	return tools.filter((tool) => require_tool_policy_match.isToolAllowedByPolicyName(tool.name, policy));
}
/**
* Adds the message tool to a narrowed allowlist when the caller must support
* forced source-reply delivery. Wildcard and undefined allowlists already cover
* message, while an empty allowlist becomes message-only.
*/
function mergeForcedEmbeddedAttemptToolsAllow(toolsAllow, params) {
	if (!params.forceMessageTool || toolsAllow === void 0 || hasWildcardToolAllowlist(toolsAllow)) return toolsAllow;
	if (toolsAllow.length === 0) return ["message"];
	return new Set(toolsAllow.map((entry) => require_tool_policy.normalizeToolName(entry))).has("message") ? toolsAllow : [...toolsAllow, "message"];
}
function resolveCodingToolConstructionPlanForAllowlist(toolsAllow) {
	if (!toolsAllow) return cloneCodingToolConstructionPlan(ALL_CODING_TOOL_CONSTRUCTION_PLAN);
	if (toolsAllow.length === 0) return cloneCodingToolConstructionPlan(NO_CODING_TOOL_CONSTRUCTION_PLAN);
	if (hasWildcardToolAllowlist(toolsAllow)) return cloneCodingToolConstructionPlan(ALL_CODING_TOOL_CONSTRUCTION_PLAN);
	const normalized = require_tool_policy.normalizeToolList(require_tool_policy.expandToolGroups(toolsAllow));
	const coreFamilies = /* @__PURE__ */ new Set();
	let includePluginTools = false;
	for (const name of normalized) {
		const family = resolveCoreToolFactoryFamily(name);
		if (family) {
			coreFamilies.add(family);
			continue;
		}
		if (!isBundleMcpAllowlistName(name)) includePluginTools = true;
	}
	const includeBaseCodingTools = coreFamilies.has("base-coding");
	const includeShellTools = coreFamilies.has("shell");
	const includeOperatorTools = coreFamilies.has("@gabrielvfonseca/operator");
	return {
		includeBaseCodingTools,
		includeShellTools,
		includeChannelTools: includePluginTools,
		includeOperatorTools,
		includePluginTools
	};
}
/**
* Decides which tool families need to be constructed for an embedded attempt.
* This keeps allowlisted plugin/channel tools available without forcing every
* local core tool factory to run for narrow plugin-only configurations.
*/
function resolveEmbeddedAttemptToolConstructionPlan(params) {
	if (params.disableTools === true || params.isRawModelRun === true || params.toolsEnabled === false) return {
		constructTools: false,
		includeCoreTools: false,
		codingToolConstructionPlan: cloneCodingToolConstructionPlan(NO_CODING_TOOL_CONSTRUCTION_PLAN)
	};
	const toolsAllow = mergeForcedEmbeddedAttemptToolsAllow(params.toolsAllow, { forceMessageTool: params.forceMessageTool });
	const codingToolConstructionPlan = resolveCodingToolConstructionPlanForAllowlist(toolsAllow);
	const includeCoreTools = codingToolConstructionPlan.includeBaseCodingTools || codingToolConstructionPlan.includeShellTools || codingToolConstructionPlan.includeOperatorTools;
	return {
		constructTools: includeCoreTools || codingToolConstructionPlan.includeChannelTools || codingToolConstructionPlan.includePluginTools,
		includeCoreTools,
		...toolsAllow ? { runtimeToolAllowlist: toolsAllow } : {},
		codingToolConstructionPlan
	};
}
function shouldCreateBundleRuntimeForAttempt(params, matchesAllowlist) {
	if (!params.toolsEnabled || params.disableTools === true) return false;
	if (!params.toolsAllow) return true;
	if (params.toolsAllow.length === 0) return false;
	if (hasWildcardToolAllowlist(params.toolsAllow)) return true;
	return params.toolsAllow.some((toolName) => matchesAllowlist(require_tool_policy.normalizeToolName(toolName)));
}
/**
* Decides whether the bundled MCP runtime is needed for this attempt. Bundle
* runtime creation follows explicit bundle/plugin allowlist names rather than
* generic local tool names.
*/
function shouldCreateBundleMcpRuntimeForAttempt(params) {
	return shouldCreateBundleRuntimeForAttempt(params, (normalized) => {
		return isBundleMcpAllowlistName(normalized) || isPluginGroupAllowlistName(normalized);
	});
}
/**
* Decides whether the bundled LSP runtime is needed for this attempt. LSP tools
* are enabled by default/wildcard and by allowlist entries with the `lsp_`
* prefix.
*/
function shouldCreateBundleLspRuntimeForAttempt(params) {
	return shouldCreateBundleRuntimeForAttempt(params, (normalized) => {
		return normalized.startsWith("lsp_");
	});
}
//#endregion
Object.defineProperty(exports, "applyEmbeddedAttemptToolsAllow", {
	enumerable: true,
	get: function() {
		return applyEmbeddedAttemptToolsAllow;
	}
});
Object.defineProperty(exports, "mergeForcedEmbeddedAttemptToolsAllow", {
	enumerable: true,
	get: function() {
		return mergeForcedEmbeddedAttemptToolsAllow;
	}
});
Object.defineProperty(exports, "resolveEmbeddedAttemptToolConstructionPlan", {
	enumerable: true,
	get: function() {
		return resolveEmbeddedAttemptToolConstructionPlan;
	}
});
Object.defineProperty(exports, "shouldCreateBundleLspRuntimeForAttempt", {
	enumerable: true,
	get: function() {
		return shouldCreateBundleLspRuntimeForAttempt;
	}
});
Object.defineProperty(exports, "shouldCreateBundleMcpRuntimeForAttempt", {
	enumerable: true,
	get: function() {
		return shouldCreateBundleMcpRuntimeForAttempt;
	}
});
