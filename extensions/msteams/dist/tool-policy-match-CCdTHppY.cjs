const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_glob_pattern = require("./glob-pattern-DmJJnFQo.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
//#region src/agents/tool-policy-match.ts
/**
* Runtime matcher for sandbox tool policies. Deny patterns always win, then
* an empty allow list means "allow everything not denied".
*/
var tool_policy_match_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	isToolAllowedByPolicies: () => isToolAllowedByPolicies,
	isToolAllowedByPolicyName: () => isToolAllowedByPolicyName
});
function makeToolPolicyMatcher(policy) {
	const deny = require_glob_pattern.compileGlobPatterns({
		raw: require_tool_policy.expandToolGroups(policy.deny ?? []),
		normalize: require_tool_policy.normalizeToolName
	});
	const allow = require_glob_pattern.compileGlobPatterns({
		raw: require_tool_policy.expandToolGroups(policy.allow ?? []),
		normalize: require_tool_policy.normalizeToolName
	});
	return (name) => {
		const normalized = require_tool_policy.normalizeToolName(name);
		if (require_glob_pattern.matchesAnyGlobPattern(normalized, deny)) return false;
		if (allow.length === 0) return true;
		if (require_glob_pattern.matchesAnyGlobPattern(normalized, allow)) return true;
		if (normalized === "apply_patch" && require_glob_pattern.matchesAnyGlobPattern("write", allow)) return true;
		return false;
	};
}
/** Return whether one tool name is allowed by a single sandbox policy. */
function isToolAllowedByPolicyName(name, policy) {
	if (!policy) return true;
	return makeToolPolicyMatcher(policy)(name);
}
/** Return whether one tool name is allowed by every active sandbox policy. */
function isToolAllowedByPolicies(name, policies) {
	return policies.every((policy) => isToolAllowedByPolicyName(name, policy));
}
//#endregion
Object.defineProperty(exports, "isToolAllowedByPolicies", {
	enumerable: true,
	get: function() {
		return isToolAllowedByPolicies;
	}
});
Object.defineProperty(exports, "isToolAllowedByPolicyName", {
	enumerable: true,
	get: function() {
		return isToolAllowedByPolicyName;
	}
});
Object.defineProperty(exports, "tool_policy_match_exports", {
	enumerable: true,
	get: function() {
		return tool_policy_match_exports;
	}
});
