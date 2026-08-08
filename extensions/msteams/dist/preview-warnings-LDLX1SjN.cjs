require("./rolldown-runtime-u92d-OFm.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_bindings = require("./bindings-CyUjIovi.cjs");
const require_resolve_route = require("./resolve-route-DQGFdHA5.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_sandbox_tool_policy = require("./sandbox-tool-policy-DDU5nVeg.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
const require_provider_tool_policy = require("./provider-tool-policy-DJ98tBOL.cjs");
const require_configured_runtime_plugin_installs = require("./configured-runtime-plugin-installs-CWK0S1IQ.cjs");
const require_primary_model_ref = require("./primary-model-ref-DOhCLZw0.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/routing/channel-route-targets.ts
const CHANNELS_CONFIG_META_KEYS = /* @__PURE__ */ new Set(["defaults", "modelByChannel"]);
function normalizeConfiguredChannelKey(raw) {
	return require_ids.normalizeChatChannelId(raw) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
}
function normalizeRouteBindingChannelKey(raw) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
}
function listConfiguredChannelIds(cfg) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.channels)) return [];
	return Object.entries(cfg.channels).filter(([id, value]) => {
		if (CHANNELS_CONFIG_META_KEYS.has(id)) return false;
		return !((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && value.enabled === false);
	}).map(([id]) => normalizeConfiguredChannelKey(id)).filter(Boolean).toSorted();
}
function listConfiguredChannelAccountIds(cfg, channelId) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.channels)) return [];
	const channel = Object.entries(cfg.channels).find(([id]) => normalizeConfiguredChannelKey(id) === channelId)?.[1];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channel) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channel.accounts)) return [];
	return Object.entries(channel.accounts).filter(([, value]) => !((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && value.enabled === false)).map(([accountId]) => require_account_id.normalizeAccountId(accountId)).filter(Boolean).toSorted();
}
function addTarget(byAgent, agentId, channel) {
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	const trimmedChannel = channel.trim();
	if (!normalizedAgentId || !trimmedChannel) return;
	const channels = byAgent.get(normalizedAgentId) ?? /* @__PURE__ */ new Set();
	channels.add(trimmedChannel);
	byAgent.set(normalizedAgentId, channels);
}
function collectChannelRouteTargets(cfg) {
	const byAgent = /* @__PURE__ */ new Map();
	for (const binding of require_bindings.listRouteBindings(cfg)) addTarget(byAgent, binding.agentId, normalizeRouteBindingChannelKey(binding.match.channel));
	for (const channel of listConfiguredChannelIds(cfg)) {
		const accountIds = listConfiguredChannelAccountIds(cfg, channel);
		const sampledAccountIds = accountIds.length > 0 ? accountIds : [require_account_id.DEFAULT_ACCOUNT_ID];
		for (const accountId of sampledAccountIds) addTarget(byAgent, require_resolve_route.resolveAgentRoute({
			cfg,
			channel,
			accountId
		}).agentId, channel);
	}
	return Array.from(byAgent.entries()).map(([agentId, channels]) => ({
		agentId,
		channels: Array.from(channels).toSorted()
	})).filter((target) => target.channels.length > 0).toSorted((a, b) => a.agentId.localeCompare(b.agentId));
}
//#endregion
//#region src/commands/doctor/shared/preview-warnings.ts
const channelDoctorModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./channel-doctor-BmUKQKvS.cjs")).then((n) => n.channel_doctor_exports));
function loadChannelDoctorModule() {
	return channelDoctorModuleLoader.load();
}
function listAgentRecords(cfg) {
	return Array.isArray(cfg.agents?.list) ? cfg.agents.list.filter(_gabrielvfonseca_normalization_core_record_coerce.isRecord) : [];
}
function hasChannels(cfg) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.channels);
}
function hasPlugins(cfg) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.plugins);
}
function hasPluginLoadPaths(cfg) {
	const plugins = cfg.plugins;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(plugins)) return false;
	const load = plugins.load;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(load) && Array.isArray(load.paths) && load.paths.length > 0;
}
function hasSubagentAllowlistConfig(cfg) {
	if (Array.isArray(cfg.agents?.defaults?.subagents?.allowAgents)) return true;
	return listAgentRecords(cfg).some((agent) => {
		const subagents = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent.subagents) ? agent.subagents : void 0;
		return Array.isArray(subagents?.allowAgents);
	});
}
function hasToolsBySenderKey(value) {
	if (Array.isArray(value)) return value.some(hasToolsBySenderKey);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.toolsBySender)) return true;
	return Object.entries(value).some(([key, nested]) => key !== "toolsBySender" && hasToolsBySenderKey(nested));
}
function hasConfiguredSafeBins(cfg) {
	const globalExec = cfg.tools?.exec;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(globalExec) && Array.isArray(globalExec.safeBins) && globalExec.safeBins.length > 0) return true;
	return listAgentRecords(cfg).some((agent) => {
		const agentExec = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent.tools) ? agent.tools.exec : void 0;
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agentExec) && Array.isArray(agentExec.safeBins) && agentExec.safeBins.length > 0;
	});
}
function resolveMessageToolAvailability(params) {
	const agentConfig = params.agentId ? require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId) : void 0;
	const modelRef = require_primary_model_ref.resolveDoctorPrimaryModelRef(params.cfg, agentConfig?.model);
	const providerPolicy = require_provider_tool_policy.resolveProviderToolPolicy({
		byProvider: params.globalTools?.byProvider,
		modelProvider: modelRef.provider,
		modelId: modelRef.model
	});
	const agentProviderPolicy = require_provider_tool_policy.resolveProviderToolPolicy({
		byProvider: params.agentTools?.byProvider,
		modelProvider: modelRef.provider,
		modelId: modelRef.model
	});
	const profile = params.agentTools?.profile ?? params.globalTools?.profile;
	const configuredAlsoAllow = Array.isArray(params.agentTools?.alsoAllow) ? params.agentTools.alsoAllow : Array.isArray(params.globalTools?.alsoAllow) ? params.globalTools.alsoAllow : [];
	const providerAlsoAllow = Array.isArray(agentProviderPolicy?.alsoAllow) ? agentProviderPolicy.alsoAllow : Array.isArray(providerPolicy?.alsoAllow) ? providerPolicy.alsoAllow : [];
	const profileAlsoAllow = [...configuredAlsoAllow, ...params.runtimeAlsoAllow ?? []];
	const providerProfileAlsoAllow = [...providerAlsoAllow, ...params.runtimeAlsoAllow ?? []];
	return require_tool_policy_match.isToolAllowedByPolicies("message", [
		require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(profile), profileAlsoAllow),
		require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(agentProviderPolicy?.profile ?? providerPolicy?.profile), providerProfileAlsoAllow),
		require_sandbox_tool_policy.pickSandboxToolPolicy(providerPolicy),
		require_sandbox_tool_policy.pickSandboxToolPolicy(agentProviderPolicy),
		require_sandbox_tool_policy.pickSandboxToolPolicy(params.globalTools),
		require_sandbox_tool_policy.pickSandboxToolPolicy(params.agentTools)
	]);
}
const SOURCE_REPLY_RUNTIME_MESSAGE_ALLOW = ["message"];
function resolveSourceReplyMessageToolAvailability(params) {
	return resolveMessageToolAvailability({
		...params,
		runtimeAlsoAllow: SOURCE_REPLY_RUNTIME_MESSAGE_ALLOW
	});
}
function sourceReplyRuntimeMayAllowMessageTool(cfg) {
	if (resolveGroupVisibleReplyProvenance(cfg).value === "message_tool") return true;
	if (cfg.messages?.visibleReplies === "message_tool") return true;
	return false;
}
function collectMessageToolUnavailableTargets(cfg, options = {}) {
	const agents = listAgentRecords(cfg);
	if (agents.length === 0) return (options.sourceReplyRuntimeGrant ? resolveSourceReplyMessageToolAvailability({
		cfg,
		globalTools: cfg.tools
	}) : resolveMessageToolAvailability({
		cfg,
		globalTools: cfg.tools
	})) ? [] : ["default tool policy"];
	return agents.flatMap((agent) => {
		const agentId = typeof agent.id === "string" ? agent.id : "unknown";
		return (options.sourceReplyRuntimeGrant ? resolveSourceReplyMessageToolAvailability({
			cfg,
			agentId,
			globalTools: cfg.tools,
			agentTools: agent.tools
		}) : resolveMessageToolAvailability({
			cfg,
			agentId,
			globalTools: cfg.tools,
			agentTools: agent.tools
		})) ? [] : [`agent "${agentId}"`];
	});
}
function resolveGroupVisibleReplyProvenance(cfg) {
	const groupVisibleReplies = cfg.messages?.groupChat?.visibleReplies;
	if (groupVisibleReplies) return {
		path: "messages.groupChat.visibleReplies",
		provenance: "group-explicit",
		value: groupVisibleReplies
	};
	const globalVisibleReplies = cfg.messages?.visibleReplies;
	if (globalVisibleReplies) return {
		path: "messages.visibleReplies",
		provenance: "global-explicit",
		value: globalVisibleReplies
	};
	return {
		path: "messages.groupChat.visibleReplies",
		provenance: "default",
		value: "automatic"
	};
}
function formatTargets(targets) {
	if (targets.length <= 2) return targets.join(" and ");
	return `${targets.slice(0, 2).join(", ")}, and ${targets.length - 2} more`;
}
/** Warn when visible-reply policy selects message_tool but message is unavailable. */
function collectVisibleReplyToolPolicyWarnings(cfg) {
	const groupPolicy = resolveGroupVisibleReplyProvenance(cfg);
	const warnings = [];
	if (groupPolicy.value === "message_tool") {
		const targets = collectMessageToolUnavailableTargets(cfg, { sourceReplyRuntimeGrant: true });
		if (targets.length === 0) return warnings;
		warnings.push(`- ${groupPolicy.path} is set to "message_tool", but the message tool is unavailable for ${formatTargets(targets)}; Operator falls back to automatic visible replies, so normal replies may post to the source chat. Enable the message tool or set ${groupPolicy.path} to "automatic".`);
	}
	if (cfg.messages?.visibleReplies === "message_tool" && groupPolicy.path !== "messages.visibleReplies") {
		const targets = collectMessageToolUnavailableTargets(cfg, { sourceReplyRuntimeGrant: true });
		if (targets.length === 0) return warnings;
		warnings.push(`- messages.visibleReplies is set to "message_tool", but the message tool is unavailable for ${formatTargets(targets)}; Operator falls back to automatic direct-chat replies, so normal replies may post to the source chat. Enable the message tool or set messages.visibleReplies to "automatic".`);
	}
	return warnings;
}
function formatChannelList(channels) {
	if (channels.length <= 2) return channels.map((channel) => `"${channel}"`).join(" and ");
	return `${channels.slice(0, 2).map((channel) => `"${channel}"`).join(", ")}, and ${channels.length - 2} more`;
}
/** Warn when routed channel agents lack the message tool required for channel actions. */
function collectChannelBoundMessageToolPolicyWarnings(cfg) {
	return collectChannelRouteTargets(cfg).flatMap((target) => {
		const agentTools = require_agent_scope_config.resolveAgentConfig(cfg, target.agentId)?.tools;
		if (sourceReplyRuntimeMayAllowMessageTool(cfg) ? resolveSourceReplyMessageToolAvailability({
			cfg,
			agentId: target.agentId,
			globalTools: cfg.tools,
			agentTools
		}) : resolveMessageToolAvailability({
			cfg,
			agentId: target.agentId,
			globalTools: cfg.tools,
			agentTools
		})) return [];
		return [`- Agent "${target.agentId}" is routed from channel ${formatChannelList(target.channels)}, but the message tool is unavailable for that agent; explicit channel actions such as sendAttachment, upload-file, thread-reply, or reply can fail. Add "message" to the agent tool allowlist, add "group:messaging", or switch the agent to a profile that includes messaging tools.`];
	});
}
const PROFILE_CONFIGURED_TOOL_SECTIONS = [{
	key: "exec",
	label: "tools.exec",
	grants: ["exec", "process"]
}, {
	key: "fs",
	label: "tools.fs",
	grants: [
		"read",
		"write",
		"edit"
	]
}];
function collectConfiguredToolSectionGrantEntries(params) {
	const entries = [];
	for (const section of PROFILE_CONFIGURED_TOOL_SECTIONS) if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.tools?.[section.key])) entries.push({
		label: `${params.pathLabel}.${section.key}`,
		grants: [...section.grants]
	});
	return entries;
}
function formatQuotedList(values) {
	return values.map((value) => `"${value}"`).join(", ");
}
function hasNonEmptyStringList(value) {
	return Array.isArray(value) && value.some((entry) => typeof entry === "string");
}
function readPreviewStringList(value) {
	return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : void 0;
}
function collectUncoveredConfiguredToolSectionGrantEntries(configuredEntries, profilePolicy) {
	if (!profilePolicy) return [];
	return configuredEntries.map((entry) => ({
		...entry,
		grants: entry.grants.filter((toolName) => !require_tool_policy_match.isToolAllowedByPolicyName(toolName, profilePolicy))
	})).filter((entry) => entry.grants.length > 0);
}
function formatProfileConfiguredSectionGrantAdvice(params) {
	const providerSuffix = params.provider ? " for that provider" : "";
	if (params.hasAllow) return `Add these grants to ${params.pathLabel}.allow and set ${params.pathLabel}.profile to "full" if these tools should be available${providerSuffix}.`;
	return `Add ${params.pathLabel}.alsoAllow: [${formatQuotedList(params.grants)}] if these tools should be available${providerSuffix}.`;
}
function collectProfileConfiguredToolSectionScopeWarnings(params) {
	const tools = params.tools;
	const profile = (typeof tools?.profile === "string" ? tools.profile : void 0) ?? params.inheritedProfile;
	if (!profile) return [];
	const configuredEntries = [...params.includeInheritedSections && params.inheritedTools && params.inheritedPathLabel ? collectConfiguredToolSectionGrantEntries({
		tools: params.inheritedTools,
		pathLabel: params.inheritedPathLabel
	}) : [], ...collectConfiguredToolSectionGrantEntries({
		tools,
		pathLabel: params.pathLabel
	})];
	if (configuredEntries.length === 0) return [];
	const alsoAllow = Array.isArray(tools?.alsoAllow) ? tools.alsoAllow.filter((entry) => typeof entry === "string") : params.inheritedAlsoAllow;
	const profilePolicy = require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(profile), alsoAllow);
	if (!profilePolicy) return [];
	const uncoveredEntries = collectUncoveredConfiguredToolSectionGrantEntries(configuredEntries, profilePolicy);
	if (uncoveredEntries.length === 0) return [];
	const uncoveredGrants = [...new Set(uncoveredEntries.flatMap((entry) => entry.grants))];
	const advice = formatProfileConfiguredSectionGrantAdvice({
		pathLabel: params.pathLabel,
		grants: uncoveredGrants,
		hasAllow: hasNonEmptyStringList(tools?.allow)
	});
	return [`- ${params.pathLabel}.profile is "${profile}" and ${uncoveredEntries.map((entry) => entry.label).join(" / ")} is configured, but configured sections no longer widen the active profile. ${advice}`];
}
function collectByProviderConfiguredToolSectionWarnings(params) {
	const byProvider = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.tools?.byProvider) ? params.tools.byProvider : void 0;
	if (!byProvider || params.configuredEntries.length === 0) return [];
	const inheritedByProvider = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.inheritedTools?.byProvider) ? params.inheritedTools.byProvider : void 0;
	return Object.entries(byProvider).flatMap(([providerKey, policyValue]) => {
		const policy = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(policyValue) ? policyValue : void 0;
		if (!policy) return [];
		const profile = typeof policy.profile === "string" ? policy.profile : void 0;
		if (!profile) return [];
		const inheritedPolicy = resolveInheritedProviderPolicyForPreview(inheritedByProvider, providerKey);
		const alsoAllow = readPreviewStringList(policy.alsoAllow) ?? readPreviewStringList(inheritedPolicy?.alsoAllow);
		const profilePolicy = require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(profile), alsoAllow);
		if (!profilePolicy) return [];
		const uncoveredEntries = collectUncoveredConfiguredToolSectionGrantEntries(params.configuredEntries, profilePolicy);
		if (uncoveredEntries.length === 0) return [];
		const providerPath = `${params.pathLabel}.byProvider.${providerKey}`;
		const advice = formatProfileConfiguredSectionGrantAdvice({
			pathLabel: providerPath,
			grants: [...new Set(uncoveredEntries.flatMap((entry) => entry.grants))],
			hasAllow: hasNonEmptyStringList(policy.allow),
			provider: true
		});
		return [`- ${providerPath}.profile is "${profile}" and ${uncoveredEntries.map((entry) => entry.label).join(" / ")} is configured, but configured sections no longer widen the provider profile. ${advice}`];
	});
}
function resolveInheritedProviderPolicyForPreview(inheritedByProvider, providerKey) {
	if (!inheritedByProvider) return;
	const normalized = require_provider_tool_policy.normalizeToolProviderPolicyKey(providerKey);
	const slashIndex = normalized.indexOf("/");
	const policy = require_provider_tool_policy.resolveProviderToolPolicy({
		byProvider: inheritedByProvider,
		modelProvider: slashIndex > 0 ? normalized.slice(0, slashIndex) : normalized,
		modelId: slashIndex > 0 ? normalized.slice(slashIndex + 1) : void 0
	});
	return policy && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(policy) ? policy : void 0;
}
function resolveProviderPolicyEntryForPreview(params) {
	const entry = require_provider_tool_policy.resolveProviderToolPolicyEntry(params);
	return entry ? {
		key: entry.key,
		policy: entry.policy
	} : void 0;
}
function collectInheritedByProviderConfiguredToolSectionWarnings(params) {
	const inheritedByProvider = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.inheritedTools?.byProvider) ? params.inheritedTools.byProvider : void 0;
	if (!inheritedByProvider || params.configuredEntries.length === 0) return [];
	const overridingByProvider = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.overridingTools?.byProvider) ? params.overridingTools.byProvider : void 0;
	const inheritedEntryForModel = resolveProviderPolicyEntryForPreview({
		byProvider: inheritedByProvider,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	return Object.entries(inheritedByProvider).flatMap(([providerKey, policyValue]) => {
		if (params.modelProvider && inheritedEntryForModel?.key !== providerKey) return [];
		const inheritedPolicy = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(policyValue) ? policyValue : void 0;
		if (!inheritedPolicy) return [];
		const profile = typeof inheritedPolicy.profile === "string" ? inheritedPolicy.profile : void 0;
		if (!profile) return [];
		const overridingEntry = resolveProviderPolicyEntryForPreview({
			byProvider: overridingByProvider,
			modelProvider: params.modelProvider,
			modelId: params.modelId
		}) ?? ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(overridingByProvider?.[providerKey]) ? {
			key: providerKey,
			policy: overridingByProvider[providerKey]
		} : void 0);
		const overridingPolicy = overridingEntry?.policy;
		if (typeof overridingPolicy?.profile === "string") return [];
		const alsoAllow = readPreviewStringList(overridingPolicy?.alsoAllow) ?? readPreviewStringList(inheritedPolicy.alsoAllow);
		const profilePolicy = require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(profile), alsoAllow);
		if (!profilePolicy) return [];
		const uncoveredEntries = collectUncoveredConfiguredToolSectionGrantEntries(params.configuredEntries, profilePolicy);
		if (uncoveredEntries.length === 0) return [];
		const overridePath = `${params.overridingPathLabel}.byProvider.${overridingEntry?.key ?? providerKey}`;
		const inheritedPath = `${params.inheritedPathLabel}.byProvider.${providerKey}`;
		const advice = formatProfileConfiguredSectionGrantAdvice({
			pathLabel: overridePath,
			grants: [...new Set(uncoveredEntries.flatMap((entry) => entry.grants))],
			hasAllow: hasNonEmptyStringList(overridingPolicy?.allow),
			provider: true
		});
		return [`- ${inheritedPath}.profile is "${profile}" and ${uncoveredEntries.map((entry) => entry.label).join(" / ")} is configured, but configured sections no longer widen the inherited provider profile. ${advice}`];
	});
}
/** Warn when configured tool sections no longer widen restrictive tool profiles. */
function collectProfileConfiguredToolSectionWarnings(cfg) {
	const warnings = [];
	const globalTools = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.tools) ? cfg.tools : void 0;
	const globalAlsoAllow = Array.isArray(globalTools?.alsoAllow) ? globalTools.alsoAllow.filter((entry) => typeof entry === "string") : void 0;
	const globalProfile = typeof globalTools?.profile === "string" ? globalTools.profile : void 0;
	const globalConfiguredEntries = collectConfiguredToolSectionGrantEntries({
		tools: globalTools,
		pathLabel: "tools"
	});
	warnings.push(...collectProfileConfiguredToolSectionScopeWarnings({
		tools: globalTools,
		pathLabel: "tools"
	}), ...collectByProviderConfiguredToolSectionWarnings({
		tools: globalTools,
		pathLabel: "tools",
		configuredEntries: globalConfiguredEntries
	}));
	listAgentRecords(cfg).forEach((agent, index) => {
		const agentTools = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent.tools) ? agent.tools : void 0;
		const agentId = typeof agent.id === "string" ? agent.id : void 0;
		const modelRef = require_primary_model_ref.resolveDoctorPrimaryModelRef(cfg, (agentId ? require_agent_scope_config.resolveAgentConfig(cfg, agentId) : void 0)?.model);
		const agentPath = `agents.list[${index}].tools`;
		const includeInheritedSections = agentTools !== void 0 && typeof agentTools.profile !== "string";
		const ownAgentConfiguredEntries = collectConfiguredToolSectionGrantEntries({
			tools: agentTools,
			pathLabel: agentPath
		});
		const agentConfiguredEntries = [...globalConfiguredEntries, ...ownAgentConfiguredEntries];
		warnings.push(...collectProfileConfiguredToolSectionScopeWarnings({
			tools: agentTools,
			inheritedTools: globalTools,
			pathLabel: agentPath,
			inheritedPathLabel: "tools",
			includeInheritedSections,
			inheritedProfile: globalProfile,
			inheritedAlsoAllow: globalAlsoAllow
		}), ...collectByProviderConfiguredToolSectionWarnings({
			tools: agentTools,
			inheritedTools: globalTools,
			pathLabel: agentPath,
			configuredEntries: agentConfiguredEntries
		}), ...collectInheritedByProviderConfiguredToolSectionWarnings({
			inheritedTools: globalTools,
			inheritedPathLabel: "tools",
			overridingTools: agentTools,
			overridingPathLabel: agentPath,
			configuredEntries: ownAgentConfiguredEntries,
			modelProvider: modelRef.provider,
			modelId: modelRef.model
		}));
	});
	return warnings;
}
async function resolveDoctorChannelPreviewConfig(params) {
	const [{ resolveCommandSecretRefsViaGateway }, { getConfiguredChannelsCommandSecretTargetIds }] = await Promise.all([Promise.resolve().then(() => require("./command-secret-gateway-bUpj2U36.cjs")).then((n) => n.command_secret_gateway_exports), Promise.resolve().then(() => require("./command-secret-targets-CcsWgblx.cjs")).then((n) => n.command_secret_targets_exports)]);
	const targetIds = getConfiguredChannelsCommandSecretTargetIds(params.cfg, params.env);
	if (targetIds.size === 0) return {
		cfg: params.cfg,
		diagnostics: []
	};
	const resolved = await resolveCommandSecretRefsViaGateway({
		config: params.cfg,
		commandName: "doctor preview",
		targetIds,
		mode: "read_only_status",
		allowLocalExecSecretRefs: params.allowExec === true,
		scrubUnresolvedSecretRefs: false
	});
	return {
		cfg: resolved.resolvedConfig,
		diagnostics: resolved.diagnostics
	};
}
/** Collect info and warning notes for doctor preview mode. */
async function collectDoctorPreviewNotes(params) {
	const infoNotes = [];
	const warnings = [];
	const env = params.env ?? process.env;
	const hasChannelConfig = hasChannels(params.cfg);
	const hasPluginConfig = hasPlugins(params.cfg);
	warnings.push(...collectVisibleReplyToolPolicyWarnings(params.cfg));
	warnings.push(...collectChannelBoundMessageToolPolicyWarnings(params.cfg));
	warnings.push(...collectProfileConfiguredToolSectionWarnings(params.cfg));
	const { collectActiveToolSchemaProjectionWarnings } = await Promise.resolve().then(() => require("./active-tool-schema-warnings--49NhIat.cjs"));
	warnings.push(...collectActiveToolSchemaProjectionWarnings({
		cfg: params.cfg,
		env
	}));
	const channelPluginRuntime = await Promise.resolve().then(() => require("./channel-plugin-blockers-CFkxs2GQ.cjs"));
	const channelPluginBlockerHits = channelPluginRuntime.scanConfiguredChannelPluginBlockers(params.cfg, env, params.activationSourceConfig);
	if (channelPluginBlockerHits.length > 0) warnings.push(channelPluginRuntime.collectConfiguredChannelPluginBlockerWarnings(channelPluginBlockerHits).join("\n"));
	if (hasChannelConfig) {
		const channelPreviewConfig = await resolveDoctorChannelPreviewConfig({
			cfg: params.cfg,
			env,
			allowExec: params.allowExec
		});
		warnings.push(...channelPreviewConfig.diagnostics);
		const { collectChannelDoctorPreviewWarnings } = await loadChannelDoctorModule();
		const channelDoctorWarnings = await collectChannelDoctorPreviewWarnings({
			cfg: channelPreviewConfig.cfg,
			doctorFixCommand: params.doctorFixCommand,
			env
		});
		if (channelDoctorWarnings.length > 0) warnings.push(...channelDoctorWarnings);
		const { collectOpenPolicyAllowFromWarnings, maybeRepairOpenPolicyAllowFrom } = await Promise.resolve().then(() => require("./open-policy-allowfrom-UtsNAu9x.cjs"));
		const allowFromScan = maybeRepairOpenPolicyAllowFrom(params.cfg);
		if (allowFromScan.changes.length > 0) warnings.push(collectOpenPolicyAllowFromWarnings({
			changes: allowFromScan.changes,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
	}
	if ((hasPluginConfig || hasChannelConfig) && params.cfg.plugins?.enabled !== false) {
		const { collectStalePluginConfigWarnings, isStalePluginAutoRepairBlocked, scanStalePluginConfig } = await Promise.resolve().then(() => require("./stale-plugin-config-Dmz-RtD4.cjs"));
		const stalePluginHits = scanStalePluginConfig(params.cfg, env);
		if (stalePluginHits.length > 0) {
			const stalePluginWarnings = collectStalePluginConfigWarnings({
				hits: stalePluginHits,
				doctorFixCommand: params.doctorFixCommand,
				autoRepairBlocked: isStalePluginAutoRepairBlocked(params.cfg, env),
				surfacePreservePluginIds: require_configured_runtime_plugin_installs.VERSION_BOUND_RUNTIME_PLUGIN_POLICY_IDS_BY_SURFACE
			});
			if (stalePluginWarnings.length > 0) warnings.push(stalePluginWarnings.join("\n"));
		}
	}
	const { collectCodexRouteWarnings } = await Promise.resolve().then(() => require("./codex-route-warnings-DZiR4oAu.cjs"));
	warnings.push(...collectCodexRouteWarnings({
		cfg: params.cfg,
		env,
		blockedProviderPlan: params.blockedCodexProviderPlan
	}));
	if (hasPluginConfig) {
		const { collectContextEngineHostCompatibilityWarnings } = await Promise.resolve().then(() => require("./context-engine-host-compat-TfUbOMO9.cjs"));
		warnings.push(...await collectContextEngineHostCompatibilityWarnings({
			cfg: params.cfg,
			doctorFixCommand: params.doctorFixCommand,
			env
		}));
	}
	if (hasSubagentAllowlistConfig(params.cfg)) {
		const { collectStaleSubagentAllowlistWarnings, scanStaleSubagentAllowlistReferences } = await Promise.resolve().then(() => require("./stale-subagent-allowlist-AR6qHPka.cjs"));
		const staleSubagentAllowlistHits = scanStaleSubagentAllowlistReferences(params.cfg);
		if (staleSubagentAllowlistHits.length > 0) warnings.push(collectStaleSubagentAllowlistWarnings({
			hits: staleSubagentAllowlistHits,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
	}
	const { collectCodexNativeAssetInfoNotes } = await Promise.resolve().then(() => require("./codex-native-assets-B8rQsOo6.cjs"));
	infoNotes.push(...await collectCodexNativeAssetInfoNotes({
		cfg: params.cfg,
		env
	}));
	if (hasPluginLoadPaths(params.cfg)) {
		const { collectBundledPluginLoadPathWarnings, scanBundledPluginLoadPathMigrations } = await Promise.resolve().then(() => require("./bundled-plugin-load-paths-C1N5AQUz.cjs"));
		const bundledPluginLoadPathHits = scanBundledPluginLoadPathMigrations(params.cfg, env);
		if (bundledPluginLoadPathHits.length > 0) warnings.push(collectBundledPluginLoadPathWarnings({
			hits: bundledPluginLoadPathHits,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
	}
	if (hasChannelConfig) {
		const { createChannelDoctorEmptyAllowlistPolicyHooks } = await loadChannelDoctorModule();
		const { scanEmptyAllowlistPolicyWarnings } = await Promise.resolve().then(() => require("./empty-allowlist-scan-DUQXux0n.cjs"));
		const emptyAllowlistHooks = createChannelDoctorEmptyAllowlistPolicyHooks({
			cfg: params.cfg,
			env
		});
		const emptyAllowlistWarnings = scanEmptyAllowlistPolicyWarnings(params.cfg, {
			doctorFixCommand: params.doctorFixCommand,
			extraWarningsForAccount: emptyAllowlistHooks.extraWarningsForAccount,
			shouldSkipDefaultEmptyGroupAllowlistWarning: emptyAllowlistHooks.shouldSkipDefaultEmptyGroupAllowlistWarning
		}).filter((warning) => !channelPluginRuntime.isWarningBlockedByChannelPlugin(warning, channelPluginBlockerHits));
		if (emptyAllowlistWarnings.length > 0) {
			const { sanitizeForLog } = await Promise.resolve().then(() => require("./ansi-DY9p-M6m.cjs")).then((n) => n.ansi_exports);
			warnings.push(emptyAllowlistWarnings.map((line) => sanitizeForLog(line)).join("\n"));
		}
	}
	if (hasToolsBySenderKey(params.cfg)) {
		const { collectLegacyToolsBySenderWarnings, scanLegacyToolsBySenderKeys } = await Promise.resolve().then(() => require("./legacy-tools-by-sender-B8iU08xW.cjs"));
		const toolsBySenderHits = scanLegacyToolsBySenderKeys(params.cfg);
		if (toolsBySenderHits.length > 0) warnings.push(collectLegacyToolsBySenderWarnings({
			hits: toolsBySenderHits,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
	}
	if (hasConfiguredSafeBins(params.cfg)) {
		const { collectExecSafeBinCoverageWarnings, collectExecSafeBinTrustedDirHintWarnings, scanExecSafeBinCoverage, scanExecSafeBinTrustedDirHints } = await Promise.resolve().then(() => require("./exec-safe-bins-CAR4sxsv.cjs"));
		const safeBinCoverage = scanExecSafeBinCoverage(params.cfg);
		if (safeBinCoverage.length > 0) warnings.push(collectExecSafeBinCoverageWarnings({
			hits: safeBinCoverage,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
		const safeBinTrustedDirHints = scanExecSafeBinTrustedDirHints(params.cfg);
		if (safeBinTrustedDirHints.length > 0) warnings.push(collectExecSafeBinTrustedDirHintWarnings(safeBinTrustedDirHints).join("\n"));
	}
	const { collectStaleOAuthProfileShadowWarnings, scanStaleOAuthProfileShadows } = await Promise.resolve().then(() => require("./stale-oauth-profile-shadows-Ca4xmxY3.cjs"));
	const staleOAuthProfileShadows = await scanStaleOAuthProfileShadows({
		cfg: params.cfg,
		env
	});
	if (staleOAuthProfileShadows.length > 0) warnings.push(collectStaleOAuthProfileShadowWarnings({
		hits: staleOAuthProfileShadows,
		doctorFixCommand: params.doctorFixCommand
	}).join("\n"));
	const { collectStaleConfiguredAuthOrderWarnings } = await Promise.resolve().then(() => require("./stale-auth-order-BrE0Cj_K.cjs"));
	warnings.push(...collectStaleConfiguredAuthOrderWarnings({
		cfg: params.cfg,
		doctorFixCommand: params.doctorFixCommand,
		env
	}));
	return {
		infoNotes,
		warningNotes: warnings
	};
}
//#endregion
exports.collectDoctorPreviewNotes = collectDoctorPreviewNotes;
exports.resolveDoctorChannelPreviewConfig = resolveDoctorChannelPreviewConfig;
