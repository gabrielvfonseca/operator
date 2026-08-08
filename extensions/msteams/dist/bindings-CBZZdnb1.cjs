const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_bindings = require("./bindings-CyUjIovi.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/routing/binding-scope.ts
function normalizeRouteBindingId(value) {
	if (typeof value === "string") return value.trim();
	if (typeof value === "number" || typeof value === "bigint") return String(value).trim();
	return "";
}
function normalizeRouteBindingRoles(value) {
	return Array.isArray(value) && value.length > 0 ? value : null;
}
function normalizeRouteBindingChannelId(raw) {
	const normalized = require_ids.normalizeChatChannelId(raw);
	if (normalized) return normalized;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw) || null;
}
function resolveNormalizedRouteBindingMatch(binding) {
	if (!binding || typeof binding !== "object") return null;
	const match = binding.match;
	if (!match || typeof match !== "object") return null;
	const channelId = normalizeRouteBindingChannelId(match.channel);
	if (!channelId) return null;
	const accountId = typeof match.accountId === "string" ? match.accountId.trim() : "";
	if (!accountId || accountId === "*") return null;
	return {
		agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(binding.agentId),
		accountId: require_account_id.normalizeAccountId(accountId),
		channelId
	};
}
function scopeIdMatches(params) {
	if (!params.constraint) return true;
	return params.constraint === params.exact || params.constraint === params.groupSpace;
}
function hasRoleLookup(memberRoleIds) {
	return typeof memberRoleIds.has === "function";
}
function hasAnyRouteBindingRole(roles, memberRoleIds) {
	if (!memberRoleIds) return false;
	if (hasRoleLookup(memberRoleIds)) return roles.some((role) => memberRoleIds.has(role));
	const memberRoleIdSet = new Set(memberRoleIds);
	return roles.some((role) => memberRoleIdSet.has(role));
}
function routeBindingScopeMatches(constraint, scope) {
	const guildId = normalizeRouteBindingId(scope.guildId);
	const teamId = normalizeRouteBindingId(scope.teamId);
	const groupSpace = normalizeRouteBindingId(scope.groupSpace);
	if (!scopeIdMatches({
		constraint: constraint.guildId,
		exact: guildId,
		groupSpace
	})) return false;
	if (!scopeIdMatches({
		constraint: constraint.teamId,
		exact: teamId,
		groupSpace
	})) return false;
	const roles = normalizeRouteBindingRoles(constraint.roles);
	if (!roles) return true;
	return hasAnyRouteBindingRole(roles, scope.memberRoleIds);
}
//#endregion
//#region src/routing/bindings.ts
function listBindings(cfg) {
	return require_bindings.listRouteBindings(cfg);
}
function buildChannelAccountBindings(cfg) {
	const map = /* @__PURE__ */ new Map();
	for (const binding of listBindings(cfg)) {
		const resolved = resolveNormalizedRouteBindingMatch(binding);
		if (!resolved) continue;
		const byAgent = map.get(resolved.channelId) ?? /* @__PURE__ */ new Map();
		const list = byAgent.get(resolved.agentId) ?? [];
		if (!list.includes(resolved.accountId)) list.push(resolved.accountId);
		byAgent.set(resolved.agentId, list);
		map.set(resolved.channelId, byAgent);
	}
	return map;
}
function resolvePreferredAccountId(params) {
	if (params.boundAccounts.length > 0) return (0, _gabrielvfonseca_normalization_core.expectDefined)(params.boundAccounts[0], "bound accounts entry at 0");
	return params.defaultAccountId;
}
//#endregion
Object.defineProperty(exports, "buildChannelAccountBindings", {
	enumerable: true,
	get: function() {
		return buildChannelAccountBindings;
	}
});
Object.defineProperty(exports, "listBindings", {
	enumerable: true,
	get: function() {
		return listBindings;
	}
});
Object.defineProperty(exports, "normalizeRouteBindingChannelId", {
	enumerable: true,
	get: function() {
		return normalizeRouteBindingChannelId;
	}
});
Object.defineProperty(exports, "normalizeRouteBindingId", {
	enumerable: true,
	get: function() {
		return normalizeRouteBindingId;
	}
});
Object.defineProperty(exports, "normalizeRouteBindingRoles", {
	enumerable: true,
	get: function() {
		return normalizeRouteBindingRoles;
	}
});
Object.defineProperty(exports, "resolveNormalizedRouteBindingMatch", {
	enumerable: true,
	get: function() {
		return resolveNormalizedRouteBindingMatch;
	}
});
Object.defineProperty(exports, "resolvePreferredAccountId", {
	enumerable: true,
	get: function() {
		return resolvePreferredAccountId;
	}
});
Object.defineProperty(exports, "routeBindingScopeMatches", {
	enumerable: true,
	get: function() {
		return routeBindingScopeMatches;
	}
});
