const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_tool_policy_pipeline = require("./tool-policy-pipeline-JYa4zOwK.cjs");
//#region src/agents/embedded-agent-runner/effective-tool-policy.ts
function applyFinalEffectiveToolPolicy(params) {
	if (params.bundledTools.length === 0) return params.bundledTools;
	const capabilityProfile = params.conversationCapabilityProfile;
	const { trustedGroup } = capabilityProfile.policy;
	if (trustedGroup.dropped) params.warn("effective tool policy: dropping caller-provided groupId that does not match session-derived group context");
	const { agentId, globalPolicy, globalProviderPolicy, agentPolicy, agentProviderPolicy, profile, providerProfile, profilePolicy, providerProfilePolicy, profileAlsoAllow, providerProfileAlsoAllow, groupPolicy, senderPolicy, sandboxPolicy, subagentPolicy, inheritedToolPolicy } = capabilityProfile.policy;
	const profilePolicyWithAlsoAllow = require_tool_policy.mergeAlsoAllowPolicy(profilePolicy, profileAlsoAllow);
	const providerProfilePolicyWithAlsoAllow = require_tool_policy.mergeAlsoAllowPolicy(providerProfilePolicy, providerProfileAlsoAllow);
	const pipelineSteps = [
		...require_tool_policy_pipeline.buildDefaultToolPolicyPipelineSteps({
			profilePolicy: profilePolicyWithAlsoAllow,
			profile,
			profileUnavailableCoreWarningAllowlist: profilePolicy?.allow,
			providerProfilePolicy: providerProfilePolicyWithAlsoAllow,
			providerProfile,
			providerProfileUnavailableCoreWarningAllowlist: providerProfilePolicy?.allow,
			globalPolicy,
			globalProviderPolicy,
			agentPolicy,
			agentProviderPolicy,
			groupPolicy,
			senderPolicy,
			agentId
		}),
		{
			policy: sandboxPolicy,
			label: "sandbox tools.allow"
		},
		{
			policy: subagentPolicy,
			label: "subagent tools.allow"
		},
		{
			policy: inheritedToolPolicy,
			label: "inherited tools"
		}
	].map((step) => Object.assign({}, step, { suppressUnavailableCoreToolWarning: true }));
	return require_tool_policy_pipeline.applyToolPolicyPipeline({
		tools: params.bundledTools,
		toolMeta: (tool) => require_tools.getPluginToolMeta(tool),
		warn: params.warn,
		steps: pipelineSteps,
		auditLogLevel: params.toolPolicyAuditLogLevel,
		onFilter: params.onFilter,
		declaredToolAllowlist: require_tool_policy_pipeline.buildDeclaredToolAllowlistContext({
			config: params.config,
			toolDenylist: require_tool_policy.collectExplicitDenylist(pipelineSteps.map((step) => step.policy))
		})
	});
}
//#endregion
Object.defineProperty(exports, "applyFinalEffectiveToolPolicy", {
	enumerable: true,
	get: function() {
		return applyFinalEffectiveToolPolicy;
	}
});
