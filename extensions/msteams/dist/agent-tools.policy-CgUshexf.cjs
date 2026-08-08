const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_dedupe = require("./dedupe-CtfV06qO.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_sandbox_tool_policy = require("./sandbox-tool-policy-DDU5nVeg.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
const require_tool_policy$1 = require("./tool-policy-DWNs5HaX.cjs");
const require_config = require("./config-DT0qiglW.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_provider_tool_policy = require("./provider-tool-policy-DJ98tBOL.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/config/group-policy.ts
function resolveChannelGroupConfig(groups, groupId, caseInsensitive = false) {
	if (!groups) return;
	const direct = groups[groupId];
	if (direct) return direct;
	if (!caseInsensitive) return;
	const target = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(groupId);
	const matchedKey = Object.keys(groups).find((key) => key !== "*" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key) === target);
	if (!matchedKey) return;
	return groups[matchedKey];
}
const warnedLegacyToolsBySenderKeys = require_dedupe.createDedupeCache({
	ttlMs: 0,
	maxSize: 4096
});
const compiledToolsBySenderCache = /* @__PURE__ */ new WeakMap();
function normalizeSenderKey(value, options = {}) {
	const trimmed = value.trim();
	if (!trimmed) return "";
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(options.stripLeadingAt && trimmed.startsWith("@") ? trimmed.slice(1) : trimmed);
}
function normalizeTypedSenderKey(value, type) {
	if (type === "channel") return normalizeChannelSenderKey(value);
	return normalizeSenderKey(value, { stripLeadingAt: type === "username" });
}
function normalizeSenderPolicyChannel(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return "";
	return require_message_channel_core.normalizeMessageChannel(trimmed) ?? normalizeSenderKey(trimmed);
}
function normalizeChannelSenderKey(value) {
	const trimmed = value.trim();
	const separatorIndex = trimmed.indexOf(":");
	if (separatorIndex <= 0 || separatorIndex === trimmed.length - 1) return "";
	const channel = normalizeSenderPolicyChannel(trimmed.slice(0, separatorIndex));
	const senderId = normalizeTypedSenderKey(trimmed.slice(separatorIndex + 1), "id");
	if (!channel || !senderId) return "";
	return `${channel}:${senderId}`;
}
function normalizeLegacySenderKey(value) {
	return normalizeSenderKey(value, { stripLeadingAt: true });
}
function warnLegacyToolsBySenderKey(rawKey) {
	const trimmed = rawKey.trim();
	if (!trimmed || warnedLegacyToolsBySenderKeys.check(trimmed)) return;
	process.emitWarning(`toolsBySender key "${trimmed}" is deprecated. Use explicit prefixes (channel:, id:, e164:, username:, name:). Legacy unprefixed keys are matched as id only.`, {
		type: "DeprecationWarning",
		code: "OPERATOR_TOOLS_BY_SENDER_UNTYPED_KEY"
	});
}
function parseSenderPolicyKey(rawKey) {
	const trimmed = rawKey.trim();
	if (!trimmed) return;
	if (trimmed === "*") return { kind: "wildcard" };
	const typed = require_config.parseToolsBySenderTypedKey(trimmed);
	if (typed) {
		const key = normalizeTypedSenderKey(typed.value, typed.type);
		if (!key) return;
		return {
			kind: "typed",
			type: typed.type,
			key
		};
	}
	warnLegacyToolsBySenderKey(trimmed);
	const key = normalizeLegacySenderKey(trimmed);
	if (!key) return;
	return {
		kind: "typed",
		type: "id",
		key
	};
}
function createSenderPolicyBuckets() {
	return {
		channel: /* @__PURE__ */ new Map(),
		id: /* @__PURE__ */ new Map(),
		e164: /* @__PURE__ */ new Map(),
		username: /* @__PURE__ */ new Map(),
		name: /* @__PURE__ */ new Map()
	};
}
function compileToolsBySenderPolicy(toolsBySender) {
	const entries = Object.entries(toolsBySender);
	if (entries.length === 0) return;
	const buckets = createSenderPolicyBuckets();
	let wildcard;
	for (const [rawKey, policy] of entries) {
		if (!policy) continue;
		const parsed = parseSenderPolicyKey(rawKey);
		if (!parsed) continue;
		if (parsed.kind === "wildcard") {
			wildcard = policy;
			continue;
		}
		const bucket = buckets[parsed.type];
		if (!bucket.has(parsed.key)) bucket.set(parsed.key, policy);
	}
	return {
		buckets,
		wildcard
	};
}
function resolveCompiledToolsBySenderPolicy(toolsBySender) {
	const cached = compiledToolsBySenderCache.get(toolsBySender);
	if (cached) return cached;
	const compiled = compileToolsBySenderPolicy(toolsBySender);
	if (!compiled) return;
	compiledToolsBySenderCache.set(toolsBySender, compiled);
	return compiled;
}
function normalizeCandidate(value, type) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return "";
	return normalizeTypedSenderKey(trimmed, type);
}
function normalizeSenderIdCandidates(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed) return [];
	const typed = normalizeTypedSenderKey(trimmed, "id");
	const legacy = normalizeLegacySenderKey(trimmed);
	if (!typed) return legacy ? [legacy] : [];
	if (!legacy || legacy === typed) return [typed];
	return [typed, legacy];
}
function matchToolsBySenderPolicy(compiled, params) {
	const senderIdCandidates = normalizeSenderIdCandidates(params.senderId);
	const channel = normalizeSenderPolicyChannel(params.messageProvider);
	if (channel) for (const senderIdCandidate of senderIdCandidates) {
		const match = compiled.buckets.channel.get(`${channel}:${senderIdCandidate}`);
		if (match) return match;
	}
	for (const senderIdCandidate of senderIdCandidates) {
		const match = compiled.buckets.id.get(senderIdCandidate);
		if (match) return match;
	}
	const senderE164 = normalizeCandidate(params.senderE164, "e164");
	if (senderE164) {
		const match = compiled.buckets.e164.get(senderE164);
		if (match) return match;
	}
	const senderUsername = normalizeCandidate(params.senderUsername, "username");
	if (senderUsername) {
		const match = compiled.buckets.username.get(senderUsername);
		if (match) return match;
	}
	const senderName = normalizeCandidate(params.senderName, "name");
	if (senderName) {
		const match = compiled.buckets.name.get(senderName);
		if (match) return match;
	}
	return compiled.wildcard;
}
function resolveToolsBySender(params) {
	const toolsBySender = params.toolsBySender;
	if (!toolsBySender) return;
	const compiled = resolveCompiledToolsBySenderPolicy(toolsBySender);
	if (!compiled) return;
	return matchToolsBySenderPolicy(compiled, params);
}
function resolveChannelGroups(cfg, channel, accountId) {
	const normalizedAccountId = require_account_id.normalizeAccountId(accountId);
	const channelConfig = cfg.channels?.[channel];
	if (!channelConfig) return;
	const accountGroups = require_account_lookup.resolveAccountEntry(channelConfig.accounts, normalizedAccountId)?.groups;
	if (!(Object.keys(channelConfig.accounts ?? {}).length > 1)) return accountGroups && Object.keys(accountGroups).length > 0 ? accountGroups : channelConfig.groups;
	return accountGroups ?? channelConfig.groups;
}
function resolveChannelGroupPolicyMode(cfg, channel, accountId) {
	const normalizedAccountId = require_account_id.normalizeAccountId(accountId);
	const channelConfig = cfg.channels?.[channel];
	if (!channelConfig) return;
	return require_account_lookup.resolveAccountEntry(channelConfig.accounts, normalizedAccountId)?.groupPolicy ?? channelConfig.groupPolicy;
}
function resolveChannelGroupPolicy(params) {
	const { cfg, channel } = params;
	const groups = resolveChannelGroups(cfg, channel, params.accountId);
	const groupPolicy = resolveChannelGroupPolicyMode(cfg, channel, params.accountId);
	const hasGroups = Boolean(groups && Object.keys(groups).length > 0);
	const allowlistEnabled = groupPolicy === "allowlist" || hasGroups;
	const normalizedId = params.groupId?.trim();
	const groupConfig = normalizedId ? resolveChannelGroupConfig(groups, normalizedId, params.groupIdCaseInsensitive) : void 0;
	const defaultConfig = groups?.["*"];
	const allowAll = allowlistEnabled && Boolean(groups && Object.hasOwn(groups, "*"));
	const senderFilterBypass = groupPolicy === "allowlist" && !hasGroups && Boolean(params.hasGroupAllowFrom);
	return {
		allowlistEnabled,
		allowed: groupPolicy === "disabled" ? false : !allowlistEnabled || allowAll || Boolean(groupConfig) || senderFilterBypass,
		groupConfig,
		defaultConfig
	};
}
function resolveChannelGroupRequireMention(params) {
	const { requireMentionOverride, overrideOrder = "after-config" } = params;
	const { groupConfig, defaultConfig } = resolveChannelGroupPolicy(params);
	const configMention = typeof groupConfig?.requireMention === "boolean" ? groupConfig.requireMention : typeof defaultConfig?.requireMention === "boolean" ? defaultConfig.requireMention : void 0;
	if (overrideOrder === "before-config" && typeof requireMentionOverride === "boolean") return requireMentionOverride;
	if (typeof configMention === "boolean") return configMention;
	if (overrideOrder !== "before-config" && typeof requireMentionOverride === "boolean") return requireMentionOverride;
	if (params.configuredGroupDefaultsToNoMention && groupConfig) return false;
	return true;
}
function resolveChannelGroupToolsPolicy(params) {
	const groups = resolveChannelGroups(params.cfg, params.channel, params.accountId);
	const groupIds = [params.groupId, ...Array.isArray(params.groupIdCandidates) ? params.groupIdCandidates : []];
	let groupConfig;
	for (const rawGroupId of groupIds) {
		const groupId = rawGroupId?.trim();
		if (!groupId) continue;
		groupConfig = resolveChannelGroupConfig(groups, groupId, params.groupIdCaseInsensitive);
		if (groupConfig) break;
	}
	const defaultConfig = groups?.["*"];
	const groupSenderPolicy = resolveToolsBySender({
		toolsBySender: groupConfig?.toolsBySender,
		messageProvider: params.messageProvider ?? params.channel,
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	});
	if (groupSenderPolicy) return groupSenderPolicy;
	if (groupConfig?.tools) return groupConfig.tools;
	const defaultSenderPolicy = resolveToolsBySender({
		toolsBySender: defaultConfig?.toolsBySender,
		messageProvider: params.messageProvider ?? params.channel,
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	});
	if (defaultSenderPolicy) return defaultSenderPolicy;
	if (defaultConfig?.tools) return defaultConfig.tools;
}
//#endregion
//#region src/agents/agent-tools.policy.ts
/**
* Resolves sandbox tool policies for agents, providers, sub-agents, and group
* sessions. Keeps runtime tool filtering tied to canonical config, session
* provenance, and inherited sub-agent capabilities.
*/
/**
* Tools always denied for sub-agents regardless of depth.
* These are system-level or interactive tools that sub-agents should never use.
*/
const SUBAGENT_TOOL_DENY_ALWAYS = [
	"gateway",
	"agents_list",
	"session_status",
	"cron",
	"sessions_send"
];
/** Tools that only make sense for orchestrator sub-agents that can spawn children. */
const SUBAGENT_TOOL_DENY_LEAF = [
	"subagents",
	"sessions_list",
	"sessions_history",
	"sessions_search",
	"sessions_spawn"
];
function resolveSubagentDenyListForRole(role) {
	if (role === "leaf") return [...SUBAGENT_TOOL_DENY_ALWAYS, ...SUBAGENT_TOOL_DENY_LEAF];
	return [...SUBAGENT_TOOL_DENY_ALWAYS];
}
function mergeConfiguredSubagentAllow(allow, alsoAllow) {
	return allow && alsoAllow ? (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...allow, ...alsoAllow]) : allow;
}
/** Resolve sub-agent tool policy from stored session capabilities. */
function resolveSubagentToolPolicyForSession(cfg, sessionKey, opts) {
	const configured = cfg?.tools?.subagents?.tools;
	const capabilities = require_subagent_capabilities.resolveStoredSubagentCapabilities(sessionKey, {
		cfg,
		store: require_subagent_capabilities.resolveSubagentCapabilityStore(sessionKey, {
			cfg,
			store: opts?.store
		})
	});
	const allow = Array.isArray(configured?.allow) ? configured.allow : void 0;
	const alsoAllow = Array.isArray(configured?.alsoAllow) ? configured.alsoAllow : void 0;
	const explicitAllow = new Set([...allow ?? [], ...alsoAllow ?? []].map((toolName) => require_tool_policy.normalizeToolName(toolName)));
	const deny = [...resolveSubagentDenyListForRole(capabilities.role).filter((toolName) => !explicitAllow.has(require_tool_policy.normalizeToolName(toolName))), ...Array.isArray(configured?.deny) ? configured.deny : []];
	return {
		allow: mergeConfiguredSubagentAllow(allow, alsoAllow),
		deny
	};
}
/** Resolve the tool policy inherited from a parent sub-agent session. */
function resolveInheritedToolPolicyForSession(cfg, sessionKey, opts) {
	const inheritedToolAllow = require_subagent_capabilities.resolveStoredSubagentInheritedToolAllowlist(sessionKey, {
		cfg,
		store: opts?.store
	});
	const inheritedToolDeny = require_subagent_capabilities.resolveStoredSubagentInheritedToolDenylist(sessionKey, {
		cfg,
		store: opts?.store
	});
	if (inheritedToolAllow.length === 0 && inheritedToolDeny.length === 0) return;
	return {
		...inheritedToolAllow.length > 0 ? { allow: inheritedToolAllow } : {},
		...inheritedToolDeny.length > 0 ? { deny: inheritedToolDeny } : {}
	};
}
/** Filter runtime tools by sandbox allow/deny policy. */
function filterToolsByPolicy(tools, policy) {
	if (!policy) return tools;
	return tools.filter((tool) => require_tool_policy_match.isToolAllowedByPolicyName(tool.name, policy));
}
/** Resolve the shared profile, scope, extra, and sandbox policy layers. */
function resolveConfiguredToolPolicies(params) {
	const policies = [];
	const profile = params.agentTools?.profile ?? params.cfg.tools?.profile;
	const profileAlsoAllow = resolveExplicitProfileAlsoAllow(params.agentTools) ?? resolveExplicitProfileAlsoAllow(params.cfg.tools);
	const profilePolicy = require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(profile), profileAlsoAllow);
	if (profilePolicy) policies.push(profilePolicy);
	const globalPolicy = require_sandbox_tool_policy.pickSandboxToolPolicy(params.cfg.tools ?? void 0);
	if (globalPolicy) policies.push(globalPolicy);
	const agentPolicy = require_sandbox_tool_policy.pickSandboxToolPolicy(params.agentTools);
	if (agentPolicy) policies.push(agentPolicy);
	for (const policy of params.extraPolicies ?? []) if (policy) policies.push(policy);
	if (params.sandboxMode === "all") policies.push(require_tool_policy$1.resolveSandboxToolPolicyForAgent(params.cfg, params.agentId ?? void 0));
	return policies;
}
function collectUniqueStrings(values) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueSingleOrTrimmedStringList)(values);
}
function buildScopedGroupIdCandidates(groupId) {
	const raw = groupId?.trim();
	if (!raw) return [];
	const topicSenderMatch = raw.match(/^(.+):topic:([^:]+):sender:([^:]+)$/i);
	if (topicSenderMatch) {
		const [, chatId, topicId] = topicSenderMatch;
		return collectUniqueStrings([
			raw,
			`${chatId}:topic:${topicId}`,
			chatId
		]);
	}
	const topicMatch = raw.match(/^(.+):topic:([^:]+)$/i);
	if (topicMatch) {
		const [, chatId, topicId] = topicMatch;
		return collectUniqueStrings([`${chatId}:topic:${topicId}`, chatId]);
	}
	const senderMatch = raw.match(/^(.+):sender:([^:]+)$/i);
	if (senderMatch) {
		const [, chatId] = senderMatch;
		return collectUniqueStrings([raw, chatId]);
	}
	return [raw];
}
function resolveGroupContextFromSessionKey(sessionKey) {
	const raw = (sessionKey ?? "").trim();
	if (!raw) return {};
	const { baseSessionKey, threadId } = require_session_key.parseThreadSessionSuffix(raw);
	const conversationKey = threadId ? baseSessionKey : raw;
	const conversation = require_session_key.parseRawSessionConversationRef(conversationKey);
	if (conversation) {
		const resolvedConversation = require_store.resolveSessionConversation({
			channel: conversation.channel,
			kind: conversation.kind,
			rawId: conversation.rawId
		});
		return {
			channel: conversation.channel,
			groupIds: collectUniqueStrings([
				...buildScopedGroupIdCandidates(conversation.rawId),
				resolvedConversation?.id,
				resolvedConversation?.baseConversationId,
				...resolvedConversation?.parentConversationCandidates ?? []
			])
		};
	}
	const parts = (conversationKey ?? raw).split(":").filter(Boolean);
	let body = parts[0] === "agent" ? parts.slice(2) : parts;
	if (body[0] === "subagent") body = body.slice(1);
	if (body.length < 3) return {};
	const [channel, kind, ...rest] = body;
	if (kind !== "group" && kind !== "channel") return {};
	const groupId = rest.join(":").trim();
	if (!groupId) return {};
	return {
		channel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(channel),
		groupIds: buildScopedGroupIdCandidates(groupId)
	};
}
function resolveTrustedGroupIdFromContexts(params) {
	const callerGroupId = (params.groupId ?? "").trim();
	if (!callerGroupId) return {
		groupId: params.groupId,
		dropped: false
	};
	const trustedGroupIds = collectUniqueStrings([...params.sessionContext.groupIds ?? [], ...params.spawnedContext.groupIds ?? []]);
	if (trustedGroupIds.length === 0) return {
		groupId: null,
		dropped: true
	};
	if (trustedGroupIds.includes(callerGroupId)) return {
		groupId: params.groupId,
		dropped: false
	};
	return {
		groupId: null,
		dropped: true
	};
}
/** Validate caller-supplied group ids against server-derived session context. */
function resolveTrustedGroupId(params) {
	return resolveTrustedGroupIdFromContexts({
		groupId: params.groupId,
		sessionContext: resolveGroupContextFromSessionKey(params.sessionKey),
		spawnedContext: resolveGroupContextFromSessionKey(params.spawnedBy)
	});
}
/** True when a server-derived session key names a group/channel conversation. */
function sessionKeyNamesGroupConversation(sessionKey) {
	return (resolveGroupContextFromSessionKey(sessionKey).groupIds?.length ?? 0) > 0;
}
function resolveExplicitProfileAlsoAllow(tools) {
	return Array.isArray(tools?.alsoAllow) ? tools.alsoAllow : void 0;
}
function hasExplicitToolSection(section) {
	return section !== void 0 && section !== null;
}
function detectImplicitProfileGrants(params) {
	const entries = [];
	if (hasExplicitToolSection(params.agentTools?.exec) || params.includeGlobalSections && hasExplicitToolSection(params.globalTools?.exec)) entries.push({
		section: "tools.exec",
		grants: ["exec", "process"]
	});
	if (hasExplicitToolSection(params.agentTools?.fs) || params.includeGlobalSections && hasExplicitToolSection(params.globalTools?.fs)) entries.push({
		section: "tools.fs",
		grants: [
			"read",
			"write",
			"edit"
		]
	});
	if (entries.length === 0) return;
	return { entries };
}
function formatImplicitToolSections(sections) {
	return sections.join(" / ");
}
function formatToolListForWarning(toolNames) {
	return toolNames.map((toolName) => `"${toolName}"`).join(", ");
}
/** Resolve the layered global, provider, agent, and profile tool policies. */
function resolveEffectiveToolPolicy(params) {
	const agentId = (typeof params.agentId === "string" && params.agentId.trim() ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) : void 0) ?? (params.sessionKey ? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey) : void 0);
	const agentTools = (params.config && agentId ? require_agent_scope_config.resolveAgentConfig(params.config, agentId) : void 0)?.tools;
	const globalTools = params.config?.tools;
	const profile = agentTools?.profile ?? globalTools?.profile;
	const profileSource = agentTools?.profile ? "agent" : globalTools?.profile ? "global" : void 0;
	const providerPolicy = require_provider_tool_policy.resolveProviderToolPolicy({
		byProvider: globalTools?.byProvider,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	const agentProviderPolicy = require_provider_tool_policy.resolveProviderToolPolicy({
		byProvider: agentTools?.byProvider,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	const explicitProfileAlsoAllow = resolveExplicitProfileAlsoAllow(agentTools) ?? resolveExplicitProfileAlsoAllow(globalTools);
	if (profile) {
		const implicitGrants = detectImplicitProfileGrants({
			globalTools,
			agentTools,
			includeGlobalSections: profileSource === "global"
		});
		if (implicitGrants) {
			const profilePolicy = require_tool_policy.mergeAlsoAllowPolicy(require_tool_policy.resolveToolProfilePolicy(profile), explicitProfileAlsoAllow);
			const uncoveredEntries = implicitGrants.entries.map((entry) => ({
				section: entry.section,
				grants: entry.grants.filter((toolName) => !require_tool_policy_match.isToolAllowedByPolicyName(toolName, profilePolicy))
			})).filter((entry) => entry.grants.length > 0);
			const uncovered = uncoveredEntries.flatMap((entry) => entry.grants);
			if (uncovered.length > 0) require_logger.logWarn(`tools policy: profile "${profile}"${agentId ? ` (agent "${agentId}")` : ""} has configured tool sections (${formatImplicitToolSections(uncoveredEntries.map((entry) => entry.section))}) that no longer implicitly widen the profile. Add alsoAllow: [${formatToolListForWarning(uncovered)}] explicitly if these tools should be available. See #47487.`);
		}
	}
	const profileAlsoAllow = explicitProfileAlsoAllow ? (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(explicitProfileAlsoAllow) : void 0;
	return {
		agentId,
		globalPolicy: require_sandbox_tool_policy.pickSandboxToolPolicy(globalTools),
		globalProviderPolicy: require_sandbox_tool_policy.pickSandboxToolPolicy(providerPolicy),
		agentPolicy: require_sandbox_tool_policy.pickSandboxToolPolicy(agentTools),
		agentProviderPolicy: require_sandbox_tool_policy.pickSandboxToolPolicy(agentProviderPolicy),
		profile,
		providerProfile: agentProviderPolicy?.profile ?? providerPolicy?.profile,
		profileAlsoAllow,
		providerProfileAlsoAllow: Array.isArray(agentProviderPolicy?.alsoAllow) ? agentProviderPolicy?.alsoAllow : Array.isArray(providerPolicy?.alsoAllow) ? providerPolicy?.alsoAllow : void 0
	};
}
/** Resolve group-scoped tool policy after validating session provenance. */
function resolveGroupToolPolicy(params) {
	if (!params.config) return;
	const sessionContext = resolveGroupContextFromSessionKey(params.sessionKey);
	const spawnedContext = resolveGroupContextFromSessionKey(params.spawnedBy);
	const trustedGroup = resolveTrustedGroupIdFromContexts({
		groupId: params.groupId,
		sessionContext,
		spawnedContext
	});
	const groupIds = collectUniqueStrings([
		...sessionContext.groupIds ?? [],
		...spawnedContext.groupIds ?? [],
		...buildScopedGroupIdCandidates(trustedGroup.groupId)
	]);
	if (groupIds.length === 0) return;
	const channel = require_message_channel.normalizeMessageChannel(sessionContext.channel ?? spawnedContext.channel ?? params.messageProvider);
	if (!channel) return;
	let plugin;
	try {
		plugin = require_registry.getLoadedChannelPlugin(channel);
	} catch {
		plugin = void 0;
	}
	for (const groupId of groupIds) {
		const toolsConfig = plugin?.groups?.resolveToolPolicy?.({
			cfg: params.config,
			groupId,
			groupChannel: trustedGroup.dropped ? null : params.groupChannel,
			groupSpace: trustedGroup.dropped ? null : params.groupSpace,
			accountId: params.accountId,
			senderId: params.senderId,
			senderName: params.senderName,
			senderUsername: params.senderUsername,
			senderE164: params.senderE164
		});
		const policy = require_sandbox_tool_policy.pickSandboxToolPolicy(toolsConfig);
		if (policy) return policy;
	}
	return require_sandbox_tool_policy.pickSandboxToolPolicy(resolveChannelGroupToolsPolicy({
		cfg: params.config,
		channel,
		messageProvider: channel,
		groupId: groupIds[0],
		groupIdCandidates: groupIds.slice(1),
		accountId: params.accountId,
		senderId: params.senderId,
		senderName: params.senderName,
		senderUsername: params.senderUsername,
		senderE164: params.senderE164
	}));
}
//#endregion
Object.defineProperty(exports, "filterToolsByPolicy", {
	enumerable: true,
	get: function() {
		return filterToolsByPolicy;
	}
});
Object.defineProperty(exports, "resolveChannelGroupPolicy", {
	enumerable: true,
	get: function() {
		return resolveChannelGroupPolicy;
	}
});
Object.defineProperty(exports, "resolveChannelGroupRequireMention", {
	enumerable: true,
	get: function() {
		return resolveChannelGroupRequireMention;
	}
});
Object.defineProperty(exports, "resolveConfiguredToolPolicies", {
	enumerable: true,
	get: function() {
		return resolveConfiguredToolPolicies;
	}
});
Object.defineProperty(exports, "resolveEffectiveToolPolicy", {
	enumerable: true,
	get: function() {
		return resolveEffectiveToolPolicy;
	}
});
Object.defineProperty(exports, "resolveGroupToolPolicy", {
	enumerable: true,
	get: function() {
		return resolveGroupToolPolicy;
	}
});
Object.defineProperty(exports, "resolveInheritedToolPolicyForSession", {
	enumerable: true,
	get: function() {
		return resolveInheritedToolPolicyForSession;
	}
});
Object.defineProperty(exports, "resolveSubagentToolPolicyForSession", {
	enumerable: true,
	get: function() {
		return resolveSubagentToolPolicyForSession;
	}
});
Object.defineProperty(exports, "resolveToolsBySender", {
	enumerable: true,
	get: function() {
		return resolveToolsBySender;
	}
});
Object.defineProperty(exports, "resolveTrustedGroupId", {
	enumerable: true,
	get: function() {
		return resolveTrustedGroupId;
	}
});
Object.defineProperty(exports, "sessionKeyNamesGroupConversation", {
	enumerable: true,
	get: function() {
		return sessionKeyNamesGroupConversation;
	}
});
