const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_glob_pattern = require("./glob-pattern-DmJJnFQo.cjs");
const require_agent_bundle_mcp_names = require("./agent-bundle-mcp-names-DiSt2aZy.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_audit = require("./tool-policy-audit-eHY9weCY.cjs");
const require_agent_tools_policy = require("./agent-tools.policy-CgUshexf.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_mcp_config_normalize = require("./mcp-config-normalize-BK5qrIxl.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/agents/tool-policy-declared-context.ts
function normalizeToolDenylist(list) {
	return require_glob_pattern.compileGlobPatterns({
		raw: list,
		normalize: require_tool_policy.normalizeToolName
	});
}
function denylistBlocksName(name, denylist) {
	const normalized = require_tool_policy.normalizeToolName(name);
	return normalized ? require_glob_pattern.matchesAnyGlobPattern(normalized, denylist) : false;
}
function denylistBlocksMcpServerNamespace(params) {
	const serverPrefix = require_tool_policy.normalizeToolName(params.safeServerName + "__");
	if (!serverPrefix) return false;
	return require_glob_pattern.matchesAnyGlobPattern(serverPrefix, params.denylist);
}
function denylistBlocksMcpServer(params) {
	return denylistBlocksName("bundle-mcp", params.denylist) || require_glob_pattern.matchesAnyGlobPattern("group:plugins", params.denylist) || denylistBlocksMcpServerNamespace({
		safeServerName: params.safeServerName,
		denylist: params.denylist
	});
}
function denylistBlocksPlugin(params) {
	return denylistBlocksName(params.pluginId, params.denylist) || require_glob_pattern.matchesAnyGlobPattern("group:plugins", params.denylist);
}
function denylistBlocksPluginTool(params) {
	return denylistBlocksPlugin({
		pluginId: params.pluginId,
		denylist: params.denylist
	}) || denylistBlocksName(params.toolName, params.denylist);
}
function collectConfiguredMcpServerNames(params) {
	const servers = require_mcp_config_normalize.normalizeConfiguredMcpServers(params.config?.mcp?.servers);
	const denylist = normalizeToolDenylist(params.toolDenylist);
	const usedServerNames = /* @__PURE__ */ new Set();
	const names = [];
	for (const [name, value] of Object.entries(servers)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || value.enabled === false || !name.trim()) continue;
		const safeServerName = require_agent_bundle_mcp_names.sanitizeServerName(name, usedServerNames);
		if (denylistBlocksMcpServer({
			safeServerName,
			denylist
		})) continue;
		names.push(safeServerName);
	}
	return names;
}
function collectAvailableManifestToolNames(params) {
	return (params.plugin.contracts?.tools ?? []).filter((toolName) => !denylistBlocksPluginTool({
		pluginId: params.plugin.id,
		toolName,
		denylist: params.denylist
	})).filter((toolName) => require_tools.hasManifestToolAvailability({
		plugin: params.plugin,
		toolNames: [toolName],
		config: params.config,
		env: params.env
	})).map(require_tool_policy.normalizeToolName).filter(Boolean);
}
function collectDeclaredPluginContext(params) {
	if (params.config?.plugins?.enabled === false) return {};
	const env = params.env ?? process.env;
	const snapshot = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.config,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		env
	});
	const normalizedPlugins = require_config_state.normalizePluginsConfig(params.config?.plugins);
	const denylist = normalizeToolDenylist(params.toolDenylist);
	const pluginIds = /* @__PURE__ */ new Set();
	const pluginToolNames = /* @__PURE__ */ new Set();
	for (const plugin of snapshot.manifestRegistry.plugins) {
		if (!require_manifest_contract_eligibility.isManifestPluginAvailableForControlPlane({
			snapshot,
			plugin,
			config: params.config
		}) || normalizedPlugins.entries[plugin.id]?.enabled === false || normalizedPlugins.deny.includes(plugin.id) || denylistBlocksPlugin({
			pluginId: plugin.id,
			denylist
		})) continue;
		const availableToolNames = collectAvailableManifestToolNames({
			plugin,
			config: params.config,
			env,
			denylist
		});
		if (availableToolNames.length === 0) continue;
		pluginIds.add(plugin.id);
		for (const toolName of availableToolNames) pluginToolNames.add(toolName);
	}
	return {
		pluginIds,
		pluginToolNames
	};
}
function buildDeclaredToolAllowlistContext(params) {
	const mcpServerNames = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(collectConfiguredMcpServerNames({
		config: params.config,
		toolDenylist: params.toolDenylist
	}));
	const pluginContext = collectDeclaredPluginContext(params);
	const pluginIds = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(pluginContext.pluginIds ?? []);
	const pluginToolNames = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(pluginContext.pluginToolNames ?? []);
	if (mcpServerNames.length === 0 && pluginIds.length === 0 && pluginToolNames.length === 0) return;
	return {
		...pluginIds.length > 0 ? { pluginIds } : {},
		...pluginToolNames.length > 0 ? { pluginToolNames } : {},
		...mcpServerNames.length > 0 ? { mcpServerNames } : {}
	};
}
//#endregion
//#region src/agents/tool-policy-pipeline.ts
/**
* Applies layered tool policy in runtime resolution order. Policy diagnostics
* stay tied to the layer that introduced them, while plugin groups are
* expanded only after unknown core/plugin entries are classified.
*/
const MAX_TOOL_POLICY_WARNING_CACHE = 256;
const seenToolPolicyWarnings = /* @__PURE__ */ new Set();
const toolPolicyWarningOrder = [];
function rememberToolPolicyWarning(warning) {
	if (seenToolPolicyWarnings.has(warning)) return false;
	if (seenToolPolicyWarnings.size >= MAX_TOOL_POLICY_WARNING_CACHE) {
		const oldest = toolPolicyWarningOrder.shift();
		if (oldest) seenToolPolicyWarnings.delete(oldest);
	}
	seenToolPolicyWarnings.add(warning);
	toolPolicyWarningOrder.push(warning);
	return true;
}
/** Builds the default profile, provider, agent, group, and sender policy layers. */
function buildDefaultToolPolicyPipelineSteps(params) {
	const agentId = params.agentId?.trim();
	const profile = params.profile?.trim();
	const providerProfile = params.providerProfile?.trim();
	const unavailableCoreToolReason = params.unavailableCoreToolReason?.trim();
	return [
		{
			policy: params.profilePolicy,
			label: profile ? `tools.profile (${profile})` : "tools.profile",
			stripPluginOnlyAllowlist: true,
			suppressUnavailableCoreToolWarningAllowlist: params.profileUnavailableCoreWarningAllowlist,
			unavailableCoreToolReason
		},
		{
			policy: params.providerProfilePolicy,
			label: providerProfile ? `tools.byProvider.profile (${providerProfile})` : "tools.byProvider.profile",
			stripPluginOnlyAllowlist: true,
			suppressUnavailableCoreToolWarningAllowlist: params.providerProfileUnavailableCoreWarningAllowlist,
			unavailableCoreToolReason
		},
		{
			policy: params.globalPolicy,
			label: "tools.allow",
			stripPluginOnlyAllowlist: true,
			unavailableCoreToolReason
		},
		{
			policy: params.globalProviderPolicy,
			label: "tools.byProvider.allow",
			stripPluginOnlyAllowlist: true,
			unavailableCoreToolReason
		},
		{
			policy: params.agentPolicy,
			label: agentId ? `agents.${agentId}.tools.allow` : "agent tools.allow",
			stripPluginOnlyAllowlist: true,
			unavailableCoreToolReason
		},
		{
			policy: params.agentProviderPolicy,
			label: agentId ? `agents.${agentId}.tools.byProvider.allow` : "agent tools.byProvider.allow",
			stripPluginOnlyAllowlist: true,
			unavailableCoreToolReason
		},
		{
			policy: params.groupPolicy,
			label: "group tools.allow",
			stripPluginOnlyAllowlist: true,
			unavailableCoreToolReason
		},
		{
			policy: params.senderPolicy,
			label: "tools.toolsBySender",
			stripPluginOnlyAllowlist: true,
			unavailableCoreToolReason
		}
	];
}
/** Applies configured policy layers to a tool list and emits deduped warnings/audit events. */
function applyToolPolicyPipeline(params) {
	const coreToolNames = new Set(params.tools.filter((tool) => !params.toolMeta(tool)).map((tool) => require_tool_policy.normalizeToolName(tool.name)).filter(Boolean));
	const pluginGroups = require_tool_policy.buildPluginToolGroups({
		tools: params.tools,
		toolMeta: params.toolMeta
	});
	let filtered = params.tools;
	for (const step of params.steps) {
		if (!step.policy) continue;
		let policy = step.policy;
		if (step.stripPluginOnlyAllowlist) {
			const resolved = require_tool_policy.analyzeAllowlistByToolType(policy, pluginGroups, coreToolNames, params.declaredToolAllowlist);
			if (resolved.unknownAllowlist.length > 0) {
				const unavailableCoreWarningAllowlist = new Set((step.suppressUnavailableCoreToolWarningAllowlist ?? []).map((entry) => require_tool_policy.normalizeToolName(entry)));
				const gatedCoreEntries = resolved.unknownAllowlist.filter((entry) => require_tool_policy.isKnownCoreToolId(entry));
				const warnableGatedCoreEntries = step.suppressUnavailableCoreToolWarning ? [] : gatedCoreEntries.filter((entry) => !unavailableCoreWarningAllowlist.has(entry));
				const otherEntries = resolved.unknownAllowlist.filter((entry) => !require_tool_policy.isKnownCoreToolId(entry) && !unavailableCoreWarningAllowlist.has(entry));
				const warningEntries = [...warnableGatedCoreEntries, ...otherEntries];
				if (shouldWarnAboutUnknownAllowlist({
					hasGatedCoreEntries: warnableGatedCoreEntries.length > 0,
					hasOtherEntries: otherEntries.length > 0
				})) {
					const entries = warningEntries.join(", ");
					const suffix = describeUnknownAllowlistSuffix({
						pluginOnlyAllowlist: resolved.pluginOnlyAllowlist,
						hasGatedCoreEntries: warnableGatedCoreEntries.length > 0,
						hasOtherEntries: otherEntries.length > 0,
						unavailableCoreToolReason: step.unavailableCoreToolReason
					});
					const warning = `tools: ${step.label} allowlist contains unknown entries (${entries}). ${suffix}`;
					if (rememberToolPolicyWarning(warning)) params.warn(warning);
				}
			}
			policy = resolved.policy;
		}
		const expanded = require_tool_policy.expandPolicyWithPluginGroups(policy, pluginGroups);
		if (!expanded) continue;
		const before = filtered;
		filtered = require_agent_tools_policy.filterToolsByPolicy(before, expanded);
		params.onFilter?.({
			step,
			policy: expanded,
			before,
			after: filtered
		});
		require_tool_policy_audit.auditToolPolicyFilter({
			stepLabel: step.label,
			policy: expanded,
			before,
			after: filtered,
			logLevel: params.auditLogLevel
		});
	}
	return filtered;
}
function shouldWarnAboutUnknownAllowlist(params) {
	return params.hasGatedCoreEntries || params.hasOtherEntries;
}
function describeUnknownAllowlistSuffix(params) {
	const preface = params.pluginOnlyAllowlist ? "Allowlist contains only plugin entries; core tools will not be available." : "";
	const unavailableCoreToolReason = params.unavailableCoreToolReason?.trim();
	const unavailableCoreDetail = unavailableCoreToolReason ? `These entries are shipped core tools but unavailable here: ${unavailableCoreToolReason}.` : "These entries are shipped core tools but unavailable in the current runtime/provider/model/config.";
	const mixedUnavailableCoreDetail = unavailableCoreToolReason ? `Some entries are shipped core tools but unavailable here: ${unavailableCoreToolReason}; other entries won't match any tool unless the plugin is enabled.` : "Some entries are shipped core tools but unavailable in the current runtime/provider/model/config; other entries won't match any tool unless the plugin is enabled.";
	const detail = params.hasGatedCoreEntries && params.hasOtherEntries ? mixedUnavailableCoreDetail : params.hasGatedCoreEntries ? unavailableCoreDetail : "These entries won't match any tool unless the plugin is enabled.";
	return preface ? `${preface} ${detail}` : detail;
}
/** Clears process-local warning dedupe state between tests. */
function resetToolPolicyWarningCacheForTest() {
	seenToolPolicyWarnings.clear();
	toolPolicyWarningOrder.length = 0;
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.toolPolicyWarningCacheTestApi")] = { resetToolPolicyWarningCacheForTest };
//#endregion
Object.defineProperty(exports, "applyToolPolicyPipeline", {
	enumerable: true,
	get: function() {
		return applyToolPolicyPipeline;
	}
});
Object.defineProperty(exports, "buildDeclaredToolAllowlistContext", {
	enumerable: true,
	get: function() {
		return buildDeclaredToolAllowlistContext;
	}
});
Object.defineProperty(exports, "buildDefaultToolPolicyPipelineSteps", {
	enumerable: true,
	get: function() {
		return buildDefaultToolPolicyPipelineSteps;
	}
});
