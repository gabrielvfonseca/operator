require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_tool_policy_match = require("./tool-policy-match-CCdTHppY.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_provider_tool_policy = require("./provider-tool-policy-DJ98tBOL.cjs");
const require_conversation_capability_profile = require("./conversation-capability-profile-Cn8o5WHy.cjs");
const require_effective_tool_policy = require("./effective-tool-policy-Cfe5Df2e.cjs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/skills/workshop/tool-policy-diagnostic.ts
const SKILL_WORKSHOP_TOOL_NAME = "skill_workshop";
function findAgentTools(config, agentId) {
	const index = config.agents?.list?.findIndex((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId));
	const tools = index !== void 0 && index >= 0 ? config.agents?.list?.[index]?.tools : void 0;
	return index !== void 0 && index >= 0 && tools ? {
		path: `agents.list[${index}].tools`,
		tools
	} : void 0;
}
function providerPolicyPath(params) {
	const entry = require_provider_tool_policy.resolveProviderToolPolicyEntry({
		byProvider: params.tools?.byProvider,
		modelProvider: params.capabilityProfile.model.provider,
		modelId: params.capabilityProfile.model.id
	});
	return entry ? {
		path: `${params.basePath}.byProvider[${JSON.stringify(entry.key)}]`,
		profile: entry.policy.profile,
		ownsAlsoAllow: Array.isArray(entry.policy.alsoAllow)
	} : void 0;
}
function profileAlsoAllowPath(params) {
	if (Array.isArray(params.agent?.tools.alsoAllow)) return `${params.agent.path}.alsoAllow`;
	if (Array.isArray(params.config.tools?.alsoAllow)) return "tools.alsoAllow";
	return `${params.profileOwnerPath}.alsoAllow`;
}
function providerProfileAlsoAllowPath(params) {
	if (params.agentProvider?.ownsAlsoAllow) return `${params.agentProvider.path}.alsoAllow`;
	if (params.globalProvider?.ownsAlsoAllow) return `${params.globalProvider.path}.alsoAllow`;
	return `${params.profileOwnerPath}.alsoAllow`;
}
function policyDeniesWorkshop(event) {
	return !require_tool_policy_match.isToolAllowedByPolicyName(SKILL_WORKSHOP_TOOL_NAME, { deny: event.policy.deny });
}
function describeExclusion(params) {
	const label = params.event.step.label;
	const agent = findAgentTools(params.config, params.agentId);
	const globalProvider = providerPolicyPath({
		tools: params.config.tools,
		basePath: "tools",
		capabilityProfile: params.capabilityProfile
	});
	const agentProvider = providerPolicyPath({
		tools: agent?.tools,
		basePath: agent?.path ?? "agents.list[].tools",
		capabilityProfile: params.capabilityProfile
	});
	if (label.startsWith("tools.profile")) {
		const policyPath = agent?.tools.profile ? agent.path : "tools";
		const source = `${policyPath}.profile`;
		const grant = profileAlsoAllowPath({
			config: params.config,
			agent,
			profileOwnerPath: policyPath
		});
		return {
			source,
			detail: `${source}: ${JSON.stringify(params.capabilityProfile.policy.profile ?? "unknown")} does not include ${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)}.`,
			fix: `Add ${grant}: [${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)}].`
		};
	}
	if (label.startsWith("tools.byProvider.profile")) {
		const policyPath = agentProvider?.profile ? agentProvider.path : globalProvider?.path;
		const source = policyPath ? `${policyPath}.profile` : "tools.byProvider.profile";
		const grant = policyPath ? providerProfileAlsoAllowPath({
			globalProvider,
			agentProvider,
			profileOwnerPath: policyPath
		}) : "the matching tools.byProvider alsoAllow";
		return {
			source,
			detail: `${source}: ${JSON.stringify(params.capabilityProfile.policy.providerProfile ?? "unknown")} does not include ${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)}.`,
			fix: policyPath ? `Add ${grant}: [${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)}].` : `Add ${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)} to ${grant} list.`
		};
	}
	const normalizedLabel = label.startsWith(`agents.${params.agentId}.tools.byProvider`) ? label.replace(`agents.${params.agentId}.tools.byProvider`, agentProvider?.path ?? `${agent?.path ?? "agents.list[].tools"}.byProvider`) : label.startsWith("tools.byProvider") ? label.replace("tools.byProvider", globalProvider?.path ?? "tools.byProvider") : label.replace(`agents.${params.agentId}.tools`, agent?.path ?? "agents.list[].tools").replace("agent tools", agent?.path ?? "agents.list[].tools");
	if (policyDeniesWorkshop(params.event)) {
		const source = normalizedLabel.replace(/\.allow$/, ".deny");
		return {
			source,
			detail: `${source} denies ${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)}.`,
			fix: `Remove the matching ${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)} deny entry from ${source}.`
		};
	}
	return {
		source: normalizedLabel,
		detail: `${normalizedLabel} does not include ${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)}.`,
		fix: `Add ${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)} to ${normalizedLabel}.`
	};
}
function makeSkillWorkshopPolicyProbe() {
	return {
		name: SKILL_WORKSHOP_TOOL_NAME,
		label: SKILL_WORKSHOP_TOOL_NAME,
		description: "Skill Workshop policy availability probe.",
		parameters: {
			type: "object",
			properties: {}
		},
		execute: async () => ({
			content: [],
			details: {}
		})
	};
}
/** Applies the real final tool-policy composition used by agent sessions and /learn. */
function resolveSkillWorkshopToolPolicyAvailability(params) {
	let exclusion;
	return {
		available: require_effective_tool_policy.applyFinalEffectiveToolPolicy({
			bundledTools: [makeSkillWorkshopPolicyProbe()],
			config: params.config,
			conversationCapabilityProfile: params.conversationCapabilityProfile,
			warn: () => {},
			toolPolicyAuditLogLevel: "debug",
			onFilter: (event) => {
				if (!exclusion && event.before.some((tool) => tool.name === SKILL_WORKSHOP_TOOL_NAME) && !event.after.some((tool) => tool.name === SKILL_WORKSHOP_TOOL_NAME)) exclusion = event;
			}
		}).some((tool) => tool.name === SKILL_WORKSHOP_TOOL_NAME),
		...exclusion ? { exclusion } : {}
	};
}
/** Returns an actionable diagnostic when an active Workshop tool is policy-hidden. */
function detectSkillWorkshopToolPolicyDiagnostic(params) {
	if (!params.workshopEnabled) return null;
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId ?? require_agent_scope_config.resolveDefaultAgentId(params.config));
	const model = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.config,
		agentId
	});
	const capabilityProfile = require_conversation_capability_profile.resolveConversationCapabilityProfile({
		config: params.config,
		agentId,
		modelProvider: model.provider,
		modelId: model.model
	});
	const availability = resolveSkillWorkshopToolPolicyAvailability({
		config: params.config,
		conversationCapabilityProfile: capabilityProfile
	});
	if (availability.available || !availability.exclusion) return null;
	const explanation = describeExclusion({
		config: params.config,
		agentId,
		capabilityProfile,
		event: availability.exclusion
	});
	const prefix = `Skill Workshop is active, but ${JSON.stringify(SKILL_WORKSHOP_TOOL_NAME)} is hidden for agent ${JSON.stringify(agentId)}:`;
	return {
		agentId,
		...explanation,
		message: `${prefix} ${explanation.detail} ${explanation.fix}`
	};
}
//#endregion
Object.defineProperty(exports, "detectSkillWorkshopToolPolicyDiagnostic", {
	enumerable: true,
	get: function() {
		return detectSkillWorkshopToolPolicyDiagnostic;
	}
});
Object.defineProperty(exports, "resolveSkillWorkshopToolPolicyAvailability", {
	enumerable: true,
	get: function() {
		return resolveSkillWorkshopToolPolicyAvailability;
	}
});
