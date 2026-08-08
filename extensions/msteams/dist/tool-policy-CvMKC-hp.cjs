const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_bundle_mcp_names = require("./agent-bundle-mcp-names-DiSt2aZy.cjs");
const require_sandbox_tool_policy = require("./sandbox-tool-policy-DDU5nVeg.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/tool-description-presets.ts
const EXEC_TOOL_DISPLAY_SUMMARY = "Run shell now.";
const PROCESS_TOOL_DISPLAY_SUMMARY = "Inspect/control exec sessions.";
const CRON_TOOL_DISPLAY_SUMMARY = "Schedule reminders, cron, wake events.";
const SESSIONS_LIST_TOOL_DISPLAY_SUMMARY = "List visible sessions; filters/previews.";
const SESSIONS_HISTORY_TOOL_DISPLAY_SUMMARY = "Read sanitized session history.";
const SESSIONS_SEARCH_TOOL_DISPLAY_SUMMARY = "Search past session transcripts.";
const SESSIONS_SEND_TOOL_DISPLAY_SUMMARY = "Message session or configured agent.";
const SESSIONS_SPAWN_TOOL_DISPLAY_SUMMARY = "Spawn subagent or ACP session.";
const SESSIONS_SPAWN_SUBAGENT_TOOL_DISPLAY_SUMMARY = "Spawn subagent session.";
const SESSION_STATUS_TOOL_DISPLAY_SUMMARY = "Show session status/model/usage.";
const UPDATE_PLAN_TOOL_DISPLAY_SUMMARY = "Track short work plan.";
const SPAWN_TASK_TOOL_DISPLAY_SUMMARY = "Suggest follow-up work for operator approval.";
const DISMISS_TASK_TOOL_DISPLAY_SUMMARY = "Withdraw a pending task suggestion.";
/** Describes the sessions_list tool for model-facing instructions. */
function describeSessionsListTool() {
	return ["List visible sessions; filter kind/label/agentId/search/activity/archive.", "Use before history/send target selection."].join(" ");
}
/** Describes the sessions_history tool for model-facing instructions. */
function describeSessionsHistoryTool() {
	return ["Read sanitized visible-session history.", "Before reply/debug/resume. Supports limit, offset, search-result sessionId/messageId anchors, and tool messages."].join(" ");
}
/** Describes the sessions_search tool for model-facing instructions. */
function describeSessionsSearchTool() {
	return ["Search your own past sessions for matching user and assistant text.", "Follow up with sessions_history using a returned sessionKey, sessionId, and messageId for neighboring context."].join(" ");
}
/** Describes the sessions_send tool for model-facing instructions. */
function describeSessionsSendTool() {
	return [
		"Message visible session by sessionKey/label, or configured agent by agentId; sessionKey wins redundant label.",
		"Thread chats rejected: target parent channel. Missing configured-agent main created. Waits for reply when available.",
		"watch:true: notice arrives when others later change target session."
	].join(" ");
}
/** Describes the sessions_spawn tool for model-facing instructions. */
function describeSessionsSpawnTool(options) {
	const runtimeDescription = options?.acpAvailable === false ? "Spawn clean child; default `runtime=\"subagent\"`." : "Spawn clean child; default `runtime=\"subagent\"`; ACP needs explicit `runtime=\"acp\"`.";
	const sessionCompletionGuidance = options?.acpAvailable === false ? "After spawn, do non-overlap work. Run result returns; session output stays thread." : "After spawn, do non-overlap work. Run result returns; session output stays thread unless ACP `streamTo=\"parent\"`.";
	const completionGuidance = options?.threadAvailable ? sessionCompletionGuidance : "After spawn, do non-overlap work while run result returns.";
	const baseDescription = [
		runtimeDescription,
		options?.threadAvailable ? "`mode=\"run\"` one-shot; `mode=\"session\"` persistent/thread-bound only on supporting requester channel." : "`mode=\"run\"` one-shot background.",
		"Inherits parent workspace. Native task arrives as first `[Subagent Task]`.",
		"Native transcript needed: `context=\"fork\"`; else omit/isolated.",
		"Use fresh child for sidecar/parallel batch reads, multi-step search, data collection; avoid quick lookup/single read unless policy prefers.",
		completionGuidance
	];
	if (options?.acpAvailable === false) return baseDescription.join(" ");
	return [
		...baseDescription.slice(0, 3),
		"`runtime=\"acp\"` ids: codex, claude, gemini, opencode, or configured ACP.",
		...baseDescription.slice(3)
	].join(" ");
}
/** Describes the session_status tool for model-facing instructions. */
function describeSessionStatusTool() {
	return [
		"Show visible-session model/usage/time/cost/tasks.",
		"`sessionKey=\"current\"` for current; UI labels are not keys.",
		"`model` overrides; `model=default` resets. Use for active model/session questions."
	].join(" ");
}
/** Describes the update_plan tool for model-facing instructions. */
function describeUpdatePlanTool() {
	return "Use for multi-step work. Send the full list each call; keep statuses current and exactly one `in_progress` until done.";
}
//#endregion
//#region src/agents/tool-catalog.ts
/**
* Core tool catalog and profile defaults.
* Drives built-in profile allowlists, group expansion, and UI section metadata
* for Operator-owned tools.
*/
const CORE_TOOL_SECTION_ORDER = [
	{
		id: "fs",
		label: "Files"
	},
	{
		id: "runtime",
		label: "Runtime"
	},
	{
		id: "web",
		label: "Web"
	},
	{
		id: "memory",
		label: "Memory"
	},
	{
		id: "sessions",
		label: "Sessions"
	},
	{
		id: "ui",
		label: "UI"
	},
	{
		id: "messaging",
		label: "Messaging"
	},
	{
		id: "automation",
		label: "Automation"
	},
	{
		id: "nodes",
		label: "Nodes"
	},
	{
		id: "agents",
		label: "Agents"
	},
	{
		id: "media",
		label: "Media"
	}
];
const CORE_TOOL_DEFINITIONS = [
	{
		id: "read",
		label: "read",
		description: "Read file contents",
		sectionId: "fs",
		profiles: ["coding"]
	},
	{
		id: "write",
		label: "write",
		description: "Create or overwrite files",
		sectionId: "fs",
		profiles: ["coding"]
	},
	{
		id: "edit",
		label: "edit",
		description: "Make precise edits",
		sectionId: "fs",
		profiles: ["coding"]
	},
	{
		id: "apply_patch",
		label: "apply_patch",
		description: "Patch files",
		sectionId: "fs",
		profiles: ["coding"]
	},
	{
		id: "exec",
		label: "exec",
		description: EXEC_TOOL_DISPLAY_SUMMARY,
		sectionId: "runtime",
		profiles: ["coding"]
	},
	{
		id: "process",
		label: "process",
		description: PROCESS_TOOL_DISPLAY_SUMMARY,
		sectionId: "runtime",
		profiles: ["coding"]
	},
	{
		id: "code_execution",
		label: "code_execution",
		description: "Run sandboxed remote analysis",
		sectionId: "runtime",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "web_search",
		label: "web_search",
		description: "Search the web",
		sectionId: "web",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "web_fetch",
		label: "web_fetch",
		description: "Fetch web content",
		sectionId: "web",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "x_search",
		label: "x_search",
		description: "Search X posts",
		sectionId: "web",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "memory_search",
		label: "memory_search",
		description: "Semantic search",
		sectionId: "memory",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "memory_get",
		label: "memory_get",
		description: "Read memory files",
		sectionId: "memory",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "sessions",
		label: "sessions",
		description: "Session settings and groups",
		sectionId: "sessions",
		profiles: ["coding", "messaging"],
		includeInOperatorGroup: true
	},
	{
		id: "sessions_list",
		label: "sessions_list",
		description: SESSIONS_LIST_TOOL_DISPLAY_SUMMARY,
		sectionId: "sessions",
		profiles: ["coding", "messaging"],
		includeInOperatorGroup: true
	},
	{
		id: "sessions_history",
		label: "sessions_history",
		description: SESSIONS_HISTORY_TOOL_DISPLAY_SUMMARY,
		sectionId: "sessions",
		profiles: ["coding", "messaging"],
		includeInOperatorGroup: true
	},
	{
		id: "sessions_search",
		label: "sessions_search",
		description: SESSIONS_SEARCH_TOOL_DISPLAY_SUMMARY,
		sectionId: "sessions",
		profiles: ["coding", "messaging"],
		includeInOperatorGroup: true
	},
	{
		id: "sessions_send",
		label: "sessions_send",
		description: SESSIONS_SEND_TOOL_DISPLAY_SUMMARY,
		sectionId: "sessions",
		profiles: ["coding", "messaging"],
		includeInOperatorGroup: true
	},
	{
		id: "sessions_spawn",
		label: "sessions_spawn",
		description: SESSIONS_SPAWN_TOOL_DISPLAY_SUMMARY,
		sectionId: "sessions",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "sessions_yield",
		label: "sessions_yield",
		description: "End turn to receive sub-agent results",
		sectionId: "sessions",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "subagents",
		label: "subagents",
		description: "Background work: subagents, media gen, cron runs. list/cancel.",
		sectionId: "sessions",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "session_status",
		label: "session_status",
		description: SESSION_STATUS_TOOL_DISPLAY_SUMMARY,
		sectionId: "sessions",
		profiles: [
			"minimal",
			"coding",
			"messaging"
		],
		includeInOperatorGroup: true
	},
	{
		id: "spawn_task",
		label: "spawn_task",
		description: SPAWN_TASK_TOOL_DISPLAY_SUMMARY,
		sectionId: "sessions",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "dismiss_task",
		label: "dismiss_task",
		description: DISMISS_TASK_TOOL_DISPLAY_SUMMARY,
		sectionId: "sessions",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "browser",
		label: "browser",
		description: "Control web browser",
		sectionId: "ui",
		profiles: [],
		includeInOperatorGroup: true
	},
	{
		id: "canvas",
		label: "canvas",
		description: "Control node Canvas surfaces when the Canvas plugin is enabled",
		sectionId: "ui",
		profiles: []
	},
	{
		id: "message",
		label: "message",
		description: "Send messages",
		sectionId: "messaging",
		profiles: ["messaging"],
		includeInOperatorGroup: true
	},
	{
		id: "heartbeat_respond",
		label: "heartbeat_respond",
		description: "Record heartbeat outcomes",
		sectionId: "automation",
		profiles: [],
		includeInOperatorGroup: true
	},
	{
		id: "cron",
		label: "cron",
		description: CRON_TOOL_DISPLAY_SUMMARY,
		sectionId: "automation",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "gateway",
		label: "gateway",
		description: "Read Gateway config and schema",
		sectionId: "automation",
		profiles: [],
		includeInOperatorGroup: true
	},
	{
		id: "nodes",
		label: "nodes",
		description: "Nodes + devices",
		sectionId: "nodes",
		profiles: [],
		includeInOperatorGroup: true
	},
	{
		id: "computer",
		label: "computer",
		description: "Control a paired computer node desktop",
		sectionId: "nodes",
		profiles: [],
		includeInOperatorGroup: true
	},
	{
		id: "agents_list",
		label: "agents_list",
		description: "List agents",
		sectionId: "agents",
		profiles: [],
		includeInOperatorGroup: true
	},
	{
		id: "get_goal",
		label: "get_goal",
		description: "Get current thread goal",
		sectionId: "agents",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "create_goal",
		label: "create_goal",
		description: "Create a thread goal",
		sectionId: "agents",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "update_goal",
		label: "update_goal",
		description: "Complete or block a thread goal",
		sectionId: "agents",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "update_plan",
		label: "update_plan",
		description: UPDATE_PLAN_TOOL_DISPLAY_SUMMARY,
		sectionId: "agents",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "skill_workshop",
		label: "skill_workshop",
		description: "Create, update, revise, list, inspect, apply, reject, or quarantine Skill Workshop proposals",
		sectionId: "agents",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "image",
		label: "image",
		description: "Image understanding",
		sectionId: "media",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "image_generate",
		label: "image_generate",
		description: "Image generation",
		sectionId: "media",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "music_generate",
		label: "music_generate",
		description: "Music generation",
		sectionId: "media",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "video_generate",
		label: "video_generate",
		description: "Video generation",
		sectionId: "media",
		profiles: ["coding"],
		includeInOperatorGroup: true
	},
	{
		id: "tts",
		label: "tts",
		description: "Text-to-speech conversion",
		sectionId: "media",
		profiles: [],
		includeInOperatorGroup: true
	}
];
const CORE_TOOL_BY_ID = new Map(CORE_TOOL_DEFINITIONS.map((tool) => [tool.id, tool]));
function listCoreToolIdsForProfile(profile) {
	return CORE_TOOL_DEFINITIONS.filter((tool) => tool.profiles.includes(profile)).map((tool) => tool.id);
}
const CORE_TOOL_PROFILES = {
	minimal: { allow: listCoreToolIdsForProfile("minimal") },
	coding: { allow: [...listCoreToolIdsForProfile("coding"), "bundle-mcp"] },
	messaging: { allow: [...listCoreToolIdsForProfile("messaging"), "bundle-mcp"] },
	full: { allow: ["*"] }
};
function buildCoreToolGroupMap() {
	const sectionToolMap = /* @__PURE__ */ new Map();
	for (const tool of CORE_TOOL_DEFINITIONS) {
		const groupId = `group:${tool.sectionId}`;
		const list = sectionToolMap.get(groupId) ?? [];
		list.push(tool.id);
		sectionToolMap.set(groupId, list);
	}
	return {
		"group:openclaw": CORE_TOOL_DEFINITIONS.filter((tool) => tool.includeInOperatorGroup).map((tool) => tool.id),
		...Object.fromEntries(sectionToolMap.entries())
	};
}
/** Built-in core tool groups keyed by group id. */
const CORE_TOOL_GROUPS = buildCoreToolGroupMap();
/** Profile options shown in model/tool configuration UIs. */
const PROFILE_OPTIONS = [
	{
		id: "minimal",
		label: "Minimal"
	},
	{
		id: "coding",
		label: "Coding"
	},
	{
		id: "messaging",
		label: "Messaging"
	},
	{
		id: "full",
		label: "Full"
	}
];
/** Resolves the allow/deny policy for a built-in tool profile. */
function resolveCoreToolProfilePolicy(profile) {
	if (!profile) return;
	const resolved = CORE_TOOL_PROFILES[profile];
	if (!resolved) return;
	if (!resolved.allow && !resolved.deny) return;
	return {
		allow: resolved.allow ? [...resolved.allow] : void 0,
		deny: resolved.deny ? [...resolved.deny] : void 0
	};
}
/** Lists core tools grouped into UI sections. */
function listCoreToolSections() {
	return CORE_TOOL_SECTION_ORDER.map((section) => ({
		id: section.id,
		label: section.label,
		tools: CORE_TOOL_DEFINITIONS.filter((tool) => tool.sectionId === section.id).map((tool) => ({
			id: tool.id,
			label: tool.label,
			description: tool.description
		}))
	})).filter((section) => section.tools.length > 0);
}
/** Lists built-in profile ids that include a core tool. */
function resolveCoreToolProfiles(toolId) {
	const tool = CORE_TOOL_BY_ID.get(toolId);
	if (!tool) return [];
	return [...tool.profiles];
}
/** Returns true when a tool id is a known core tool. */
function isKnownCoreToolId(toolId) {
	return CORE_TOOL_BY_ID.has(toolId);
}
//#endregion
//#region src/agents/tool-policy-shared.ts
/**
* Shared runtime tool policy normalization.
*
* Keeps aliases, groups, profile expansion, and prefix matching consistent across allow/deny paths.
*/
const TOOL_NAME_ALIASES = {
	bash: "exec",
	"apply-patch": "apply_patch"
};
/** Core tool groups exposed to allow/deny policy config. */
const TOOL_GROUPS = { ...CORE_TOOL_GROUPS };
/** Normalizes a tool name or alias to the policy id used for matching. */
function normalizeToolName(name) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(name);
	return TOOL_NAME_ALIASES[normalized] ?? normalized;
}
/** Checks whether an in-progress prefix can still resolve to an allowed tool or alias. */
function couldNormalizeToolNamePrefixToAllowedTool(prefix, allowedToolNames) {
	const normalizedPrefix = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(prefix);
	if (!normalizedPrefix) return false;
	const allowed = /* @__PURE__ */ new Set();
	for (const toolName of allowedToolNames) {
		const normalizedToolName = normalizeToolName(toolName);
		const foldedToolName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(toolName);
		if (normalizedToolName) allowed.add(normalizedToolName);
		if (foldedToolName) allowed.add(foldedToolName);
		if (normalizedToolName.startsWith(normalizedPrefix) || foldedToolName.startsWith(normalizedPrefix)) return true;
	}
	const resolvedPrefix = normalizeToolName(normalizedPrefix);
	if (resolvedPrefix !== normalizedPrefix) {
		for (const toolName of allowed) if (toolName.startsWith(resolvedPrefix)) return true;
	}
	for (const [alias, toolName] of Object.entries(TOOL_NAME_ALIASES)) if (alias.startsWith(normalizedPrefix) && allowed.has(toolName)) return true;
	return false;
}
/** Normalizes a configured allow/deny list while dropping blank entries. */
function normalizeToolList(list) {
	if (!list) return [];
	return list.map(normalizeToolName).filter(Boolean);
}
/** Expands named tool groups into concrete tool ids. */
function expandToolGroups(list) {
	const normalized = normalizeToolList(list);
	const expanded = [];
	for (const value of normalized) {
		const group = TOOL_GROUPS[value];
		if (group) {
			expanded.push(...group);
			continue;
		}
		expanded.push(value);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(expanded);
}
/** Resolves a built-in tool profile policy by id. */
function resolveToolProfilePolicy(profile) {
	return resolveCoreToolProfilePolicy(profile);
}
//#endregion
//#region src/agents/tool-policy.ts
/**
* Tool allow/deny policy helpers.
* Normalizes core and plugin tool groups, expands plugin entries, and extracts
* explicit operator allow/deny lists.
*/
var tool_policy_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	DEFAULT_PLUGIN_TOOLS_ALLOWLIST_ENTRY: () => DEFAULT_PLUGIN_TOOLS_ALLOWLIST_ENTRY,
	TOOL_GROUPS: () => TOOL_GROUPS,
	analyzeAllowlistByToolType: () => analyzeAllowlistByToolType,
	buildPluginToolGroups: () => buildPluginToolGroups,
	collectExplicitAllowlist: () => collectExplicitAllowlist,
	collectExplicitDenylist: () => collectExplicitDenylist,
	couldNormalizeToolNamePrefixToAllowedTool: () => couldNormalizeToolNamePrefixToAllowedTool,
	expandPolicyWithPluginGroups: () => expandPolicyWithPluginGroups,
	expandToolGroups: () => expandToolGroups,
	hasRestrictiveAllowPolicy: () => hasRestrictiveAllowPolicy,
	mergeAlsoAllowPolicy: () => mergeAlsoAllowPolicy,
	normalizeToolList: () => normalizeToolList,
	normalizeToolName: () => normalizeToolName,
	replaceWithEffectiveToolAllowlist: () => replaceWithEffectiveToolAllowlist,
	resolveToolProfilePolicy: () => resolveToolProfilePolicy
});
/** Synthetic allowlist entry that means "use default plugin tools". */
const DEFAULT_PLUGIN_TOOLS_ALLOWLIST_ENTRY = "__operator_default_plugin_tools__";
/** Returns true when an allow policy is narrower than all/default plugin tools. */
function hasRestrictiveAllowPolicy(policy) {
	return Array.isArray(policy?.allow) && policy.allow.some((entry) => {
		const normalized = normalizeToolName(entry);
		return Boolean(normalized) && normalized !== "*" && normalized !== "__operator_default_plugin_tools__";
	});
}
/** Replaces an allowlist with the normalized names of an effective tool array. */
function replaceWithEffectiveToolAllowlist(target, tools) {
	target.length = 0;
	const seen = /* @__PURE__ */ new Set();
	for (const tool of tools) {
		const normalized = normalizeToolName(tool.name);
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		target.push(normalized);
	}
}
/** Collects explicit allow entries from layered policies. */
function collectExplicitAllowlist(policies) {
	const entries = [];
	for (const policy of policies) {
		if (!policy?.allow) continue;
		for (const value of policy.allow) {
			if (typeof value !== "string") continue;
			const trimmed = value.trim();
			if (trimmed === "*" && policy[require_sandbox_tool_policy.IMPLICIT_ALLOW_ALL_FROM_ALSO_ALLOW] === true) continue;
			if (trimmed) entries.push(trimmed);
		}
		if (policy[require_sandbox_tool_policy.IMPLICIT_ALLOW_ALL_FROM_ALSO_ALLOW] === true) entries.push(DEFAULT_PLUGIN_TOOLS_ALLOWLIST_ENTRY);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(entries);
}
/** Collects explicit deny entries from layered policies. */
function collectExplicitDenylist(policies) {
	const entries = [];
	for (const policy of policies) {
		if (!policy?.deny) continue;
		for (const value of policy.deny) {
			if (typeof value !== "string") continue;
			const trimmed = value.trim();
			if (trimmed) entries.push(trimmed);
		}
	}
	return entries;
}
/** Builds plugin tool groups from tool metadata. */
function buildPluginToolGroups(params) {
	const all = [];
	const byPlugin = /* @__PURE__ */ new Map();
	for (const tool of params.tools) {
		const meta = params.toolMeta(tool);
		if (!meta) continue;
		const name = normalizeToolName(tool.name);
		all.push(name);
		const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(meta.pluginId);
		if (!pluginId) continue;
		const list = byPlugin.get(pluginId) ?? [];
		list.push(name);
		byPlugin.set(pluginId, list);
	}
	return {
		all,
		byPlugin
	};
}
/** Expands group:plugins and plugin-id entries into concrete plugin tool names. */
function expandPluginGroups(list, groups) {
	if (!list || list.length === 0) return list;
	const expanded = [];
	for (const entry of list) {
		const normalized = normalizeToolName(entry);
		if (normalized === "group:plugins") {
			if (groups.all.length > 0) expanded.push(...groups.all);
			else expanded.push(normalized);
			continue;
		}
		const tools = groups.byPlugin.get(normalized);
		if (tools && tools.length > 0) {
			expanded.push(...tools);
			continue;
		}
		expanded.push(normalized);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(expanded);
}
/** Expands plugin groups in a policy while preserving undefined policies. */
function expandPolicyWithPluginGroups(policy, groups) {
	if (!policy) return;
	return {
		allow: expandPluginGroups(policy.allow, groups),
		deny: expandPluginGroups(policy.deny, groups)
	};
}
function buildDeclaredMcpToolPrefixes(serverNames) {
	const prefixes = /* @__PURE__ */ new Set();
	const usedNames = /* @__PURE__ */ new Set();
	for (const serverName of serverNames ?? []) {
		const prefix = normalizeToolName(require_agent_bundle_mcp_names.sanitizeServerName(serverName, usedNames) + "__");
		if (prefix) prefixes.add(prefix);
	}
	return prefixes;
}
function normalizeDeclaredPluginIds(values) {
	return new Set(Array.from(values ?? [], (value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value)).filter((value) => Boolean(value)));
}
function normalizeDeclaredToolNames(values) {
	return new Set(Array.from(values ?? [], (value) => normalizeToolName(value)).filter((value) => Boolean(value)));
}
function isDeclaredMcpAllowlistEntry(entry, prefixes) {
	if (prefixes.size === 0) return false;
	if (entry === "bundle-mcp") return true;
	for (const prefix of prefixes) if (entry.length > prefix.length && entry.startsWith(prefix)) return true;
	return false;
}
/** Classifies allowlists as core, plugin-only, or unknown for diagnostics. */
function analyzeAllowlistByToolType(policy, groups, coreTools, declaredTools) {
	if (!policy?.allow || policy.allow.length === 0) return {
		policy,
		unknownAllowlist: [],
		pluginOnlyAllowlist: false
	};
	const normalized = normalizeToolList(policy.allow);
	if (normalized.length === 0) return {
		policy,
		unknownAllowlist: [],
		pluginOnlyAllowlist: false
	};
	const pluginIds = /* @__PURE__ */ new Set([...groups.byPlugin.keys(), ...normalizeDeclaredPluginIds(declaredTools?.pluginIds)]);
	const pluginTools = /* @__PURE__ */ new Set([...groups.all, ...normalizeDeclaredToolNames(declaredTools?.pluginToolNames)]);
	const mcpToolPrefixes = buildDeclaredMcpToolPrefixes(declaredTools?.mcpServerNames);
	const unknownAllowlist = [];
	let hasOnlyPluginEntries = true;
	for (const entry of normalized) {
		if (entry === "*") {
			hasOnlyPluginEntries = false;
			continue;
		}
		const isPluginEntry = entry === "group:plugins" || pluginIds.has(entry) || pluginTools.has(entry) || isDeclaredMcpAllowlistEntry(entry, mcpToolPrefixes);
		const isCoreEntry = expandToolGroups([entry]).some((tool) => coreTools.has(tool));
		if (!isPluginEntry) hasOnlyPluginEntries = false;
		if (!isCoreEntry && !isPluginEntry) unknownAllowlist.push(entry);
	}
	const pluginOnlyAllowlist = hasOnlyPluginEntries;
	return {
		policy,
		unknownAllowlist: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(unknownAllowlist),
		pluginOnlyAllowlist
	};
}
/** Merges alsoAllow entries into an existing allow policy. */
function mergeAlsoAllowPolicy(policy, alsoAllow) {
	if (!policy?.allow || !Array.isArray(alsoAllow) || alsoAllow.length === 0) return policy;
	return {
		...policy,
		allow: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...policy.allow, ...alsoAllow])
	};
}
//#endregion
Object.defineProperty(exports, "CRON_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return CRON_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "DEFAULT_PLUGIN_TOOLS_ALLOWLIST_ENTRY", {
	enumerable: true,
	get: function() {
		return DEFAULT_PLUGIN_TOOLS_ALLOWLIST_ENTRY;
	}
});
Object.defineProperty(exports, "DISMISS_TASK_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return DISMISS_TASK_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "EXEC_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return EXEC_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "PROCESS_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return PROCESS_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "PROFILE_OPTIONS", {
	enumerable: true,
	get: function() {
		return PROFILE_OPTIONS;
	}
});
Object.defineProperty(exports, "SESSIONS_HISTORY_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return SESSIONS_HISTORY_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "SESSIONS_LIST_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return SESSIONS_LIST_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "SESSIONS_SEARCH_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return SESSIONS_SEARCH_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "SESSIONS_SEND_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return SESSIONS_SEND_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "SESSIONS_SPAWN_SUBAGENT_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return SESSIONS_SPAWN_SUBAGENT_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "SESSIONS_SPAWN_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return SESSIONS_SPAWN_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "SESSION_STATUS_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return SESSION_STATUS_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "SPAWN_TASK_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return SPAWN_TASK_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "UPDATE_PLAN_TOOL_DISPLAY_SUMMARY", {
	enumerable: true,
	get: function() {
		return UPDATE_PLAN_TOOL_DISPLAY_SUMMARY;
	}
});
Object.defineProperty(exports, "analyzeAllowlistByToolType", {
	enumerable: true,
	get: function() {
		return analyzeAllowlistByToolType;
	}
});
Object.defineProperty(exports, "buildPluginToolGroups", {
	enumerable: true,
	get: function() {
		return buildPluginToolGroups;
	}
});
Object.defineProperty(exports, "collectExplicitAllowlist", {
	enumerable: true,
	get: function() {
		return collectExplicitAllowlist;
	}
});
Object.defineProperty(exports, "collectExplicitDenylist", {
	enumerable: true,
	get: function() {
		return collectExplicitDenylist;
	}
});
Object.defineProperty(exports, "couldNormalizeToolNamePrefixToAllowedTool", {
	enumerable: true,
	get: function() {
		return couldNormalizeToolNamePrefixToAllowedTool;
	}
});
Object.defineProperty(exports, "describeSessionStatusTool", {
	enumerable: true,
	get: function() {
		return describeSessionStatusTool;
	}
});
Object.defineProperty(exports, "describeSessionsHistoryTool", {
	enumerable: true,
	get: function() {
		return describeSessionsHistoryTool;
	}
});
Object.defineProperty(exports, "describeSessionsListTool", {
	enumerable: true,
	get: function() {
		return describeSessionsListTool;
	}
});
Object.defineProperty(exports, "describeSessionsSearchTool", {
	enumerable: true,
	get: function() {
		return describeSessionsSearchTool;
	}
});
Object.defineProperty(exports, "describeSessionsSendTool", {
	enumerable: true,
	get: function() {
		return describeSessionsSendTool;
	}
});
Object.defineProperty(exports, "describeSessionsSpawnTool", {
	enumerable: true,
	get: function() {
		return describeSessionsSpawnTool;
	}
});
Object.defineProperty(exports, "describeUpdatePlanTool", {
	enumerable: true,
	get: function() {
		return describeUpdatePlanTool;
	}
});
Object.defineProperty(exports, "expandPolicyWithPluginGroups", {
	enumerable: true,
	get: function() {
		return expandPolicyWithPluginGroups;
	}
});
Object.defineProperty(exports, "expandToolGroups", {
	enumerable: true,
	get: function() {
		return expandToolGroups;
	}
});
Object.defineProperty(exports, "hasRestrictiveAllowPolicy", {
	enumerable: true,
	get: function() {
		return hasRestrictiveAllowPolicy;
	}
});
Object.defineProperty(exports, "isKnownCoreToolId", {
	enumerable: true,
	get: function() {
		return isKnownCoreToolId;
	}
});
Object.defineProperty(exports, "listCoreToolSections", {
	enumerable: true,
	get: function() {
		return listCoreToolSections;
	}
});
Object.defineProperty(exports, "mergeAlsoAllowPolicy", {
	enumerable: true,
	get: function() {
		return mergeAlsoAllowPolicy;
	}
});
Object.defineProperty(exports, "normalizeToolList", {
	enumerable: true,
	get: function() {
		return normalizeToolList;
	}
});
Object.defineProperty(exports, "normalizeToolName", {
	enumerable: true,
	get: function() {
		return normalizeToolName;
	}
});
Object.defineProperty(exports, "replaceWithEffectiveToolAllowlist", {
	enumerable: true,
	get: function() {
		return replaceWithEffectiveToolAllowlist;
	}
});
Object.defineProperty(exports, "resolveCoreToolProfiles", {
	enumerable: true,
	get: function() {
		return resolveCoreToolProfiles;
	}
});
Object.defineProperty(exports, "resolveToolProfilePolicy", {
	enumerable: true,
	get: function() {
		return resolveToolProfilePolicy;
	}
});
Object.defineProperty(exports, "tool_policy_exports", {
	enumerable: true,
	get: function() {
		return tool_policy_exports;
	}
});
