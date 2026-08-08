const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_glob_pattern = require("./glob-pattern-DmJJnFQo.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_constants = require("./constants-DD-eOR3_.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/sandbox/tool-policy.ts
/**
* Sandbox tool policy resolver.
*
* Merges global, agent, and default allow/deny lists into normalized policy plus source diagnostics.
*/
var tool_policy_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	classifyToolAgainstSandboxToolPolicy: () => classifyToolAgainstSandboxToolPolicy,
	isToolAllowed: () => isToolAllowed,
	resolveSandboxToolPolicyForAgent: () => resolveSandboxToolPolicyForAgent
});
function buildSource(params) {
	return {
		source: params.scope,
		key: params.key
	};
}
function pickConfiguredList(params) {
	if (Array.isArray(params.agent)) return {
		values: params.agent,
		source: buildSource({
			scope: "agent",
			key: "agents.list[].tools.sandbox.tools.allow"
		})
	};
	if (Array.isArray(params.global)) return {
		values: params.global,
		source: buildSource({
			scope: "global",
			key: "tools.sandbox.tools.allow"
		})
	};
	return {
		values: void 0,
		source: buildSource({
			scope: "default",
			key: "tools.sandbox.tools.allow"
		})
	};
}
function pickConfiguredDeny(params) {
	if (Array.isArray(params.agent)) return {
		values: params.agent,
		source: buildSource({
			scope: "agent",
			key: "agents.list[].tools.sandbox.tools.deny"
		})
	};
	if (Array.isArray(params.global)) return {
		values: params.global,
		source: buildSource({
			scope: "global",
			key: "tools.sandbox.tools.deny"
		})
	};
	return {
		values: void 0,
		source: buildSource({
			scope: "default",
			key: "tools.sandbox.tools.deny"
		})
	};
}
function pickConfiguredAlsoAllow(params) {
	if (Array.isArray(params.agent)) return {
		values: params.agent,
		source: buildSource({
			scope: "agent",
			key: "agents.list[].tools.sandbox.tools.alsoAllow"
		})
	};
	if (Array.isArray(params.global)) return {
		values: params.global,
		source: buildSource({
			scope: "global",
			key: "tools.sandbox.tools.alsoAllow"
		})
	};
	return {
		values: void 0,
		source: void 0
	};
}
function mergeAllowlist(base, extra) {
	if (Array.isArray(base)) {
		if (base.length === 0) return [];
		if (!Array.isArray(extra) || extra.length === 0) return [...base];
		return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...base, ...extra]);
	}
	if (Array.isArray(extra) && extra.length > 0) return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...require_constants.DEFAULT_TOOL_ALLOW, ...extra]);
	return [...require_constants.DEFAULT_TOOL_ALLOW];
}
function pickAllowSource(params) {
	if (params.allowDefined && params.allow.source === "agent") return params.allow;
	if (params.alsoAllow?.source === "agent") return params.alsoAllow;
	if (params.allowDefined && params.allow.source === "global") return params.allow;
	if (params.alsoAllow?.source === "global") return params.alsoAllow;
	return params.allow;
}
function resolveExplicitSandboxReAllowPatterns(params) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...params.allow ?? [], ...params.alsoAllow ?? []]);
}
function filterDefaultDenyForExplicitAllows(params) {
	if (params.explicitAllowPatterns.length === 0) return [...params.deny];
	const allowPatterns = require_glob_pattern.compileGlobPatterns({
		raw: require_tool_policy.expandToolGroups(params.explicitAllowPatterns),
		normalize: require_tool_policy.normalizeToolName
	});
	if (allowPatterns.length === 0) return [...params.deny];
	return params.deny.filter((toolName) => !require_glob_pattern.matchesAnyGlobPattern(require_tool_policy.normalizeToolName(toolName), allowPatterns));
}
function expandResolvedPolicy(policy) {
	const expandedDeny = require_tool_policy.expandToolGroups(policy.deny ?? []);
	let expandedAllow = require_tool_policy.expandToolGroups(policy.allow ?? []);
	const expandedDenyLower = expandedDeny.map(_gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty);
	const expandedAllowLower = expandedAllow.map(_gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty);
	if (expandedAllow.length > 0 && !expandedDenyLower.includes("image") && !expandedAllowLower.includes("image")) expandedAllow = [...expandedAllow, "image"];
	return {
		allow: expandedAllow,
		deny: expandedDeny
	};
}
function classifyToolAgainstSandboxToolPolicy(name, policy) {
	if (!policy) return {
		blockedByDeny: false,
		blockedByAllow: false
	};
	const normalized = require_tool_policy.normalizeToolName(name);
	const blockedByDeny = require_glob_pattern.matchesAnyGlobPattern(normalized, require_glob_pattern.compileGlobPatterns({
		raw: require_tool_policy.expandToolGroups(policy.deny ?? []),
		normalize: require_tool_policy.normalizeToolName
	}));
	const allow = require_glob_pattern.compileGlobPatterns({
		raw: require_tool_policy.expandToolGroups(policy.allow ?? []),
		normalize: require_tool_policy.normalizeToolName
	});
	return {
		blockedByDeny,
		blockedByAllow: !blockedByDeny && allow.length > 0 && !require_glob_pattern.matchesAnyGlobPattern(normalized, allow)
	};
}
function isToolAllowed(policy, name) {
	const { blockedByDeny, blockedByAllow } = classifyToolAgainstSandboxToolPolicy(name, policy);
	return !blockedByDeny && !blockedByAllow;
}
function resolveSandboxToolPolicyForAgent(cfg, agentId) {
	const agentPolicy = (cfg && agentId ? require_agent_scope_config.resolveAgentConfig(cfg, agentId) : void 0)?.tools?.sandbox?.tools;
	const globalPolicy = cfg?.tools?.sandbox?.tools;
	const allowConfig = pickConfiguredList({
		agent: agentPolicy?.allow,
		global: globalPolicy?.allow
	});
	const alsoAllowConfig = pickConfiguredAlsoAllow({
		agent: agentPolicy?.alsoAllow,
		global: globalPolicy?.alsoAllow
	});
	const denyConfig = pickConfiguredDeny({
		agent: agentPolicy?.deny,
		global: globalPolicy?.deny
	});
	const explicitAllowPatterns = resolveExplicitSandboxReAllowPatterns({
		allow: allowConfig.values,
		alsoAllow: alsoAllowConfig.values
	});
	const expanded = expandResolvedPolicy({
		allow: mergeAllowlist(allowConfig.values, alsoAllowConfig.values),
		deny: Array.isArray(denyConfig.values) ? [...denyConfig.values] : filterDefaultDenyForExplicitAllows({
			deny: [...require_constants.DEFAULT_TOOL_DENY],
			explicitAllowPatterns
		})
	});
	return {
		allow: expanded.allow ?? [],
		deny: expanded.deny ?? [],
		sources: {
			allow: pickAllowSource({
				allow: allowConfig.source,
				allowDefined: Array.isArray(allowConfig.values),
				alsoAllow: alsoAllowConfig.source
			}),
			deny: denyConfig.source
		}
	};
}
//#endregion
Object.defineProperty(exports, "classifyToolAgainstSandboxToolPolicy", {
	enumerable: true,
	get: function() {
		return classifyToolAgainstSandboxToolPolicy;
	}
});
Object.defineProperty(exports, "isToolAllowed", {
	enumerable: true,
	get: function() {
		return isToolAllowed;
	}
});
Object.defineProperty(exports, "resolveSandboxToolPolicyForAgent", {
	enumerable: true,
	get: function() {
		return resolveSandboxToolPolicyForAgent;
	}
});
Object.defineProperty(exports, "tool_policy_exports", {
	enumerable: true,
	get: function() {
		return tool_policy_exports;
	}
});
