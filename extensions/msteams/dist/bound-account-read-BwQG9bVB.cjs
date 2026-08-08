require("./session-key-BQFkCTNx.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_bindings = require("./bindings-CBZZdnb1.cjs");
const require_bindings$1 = require("./bindings-CyUjIovi.cjs");
const require_resolve_route = require("./resolve-route-DQGFdHA5.cjs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/routing/bound-account-read.ts
function resolveNormalizedBoundAccountMatch(binding) {
	const baseMatch = require_bindings.resolveNormalizedRouteBindingMatch(binding);
	const match = binding.match;
	if (!baseMatch || !match || typeof match !== "object") return null;
	const peerId = match.peer && typeof match.peer.id === "string" ? match.peer.id.trim() : void 0;
	const peerKind = match.peer ? require_chat_type.normalizeChatType(match.peer.kind) : void 0;
	return {
		...baseMatch,
		peerId: peerId || void 0,
		peerKind: peerKind ?? void 0,
		guildId: require_bindings.normalizeRouteBindingId(match.guildId) || null,
		teamId: require_bindings.normalizeRouteBindingId(match.teamId) || null,
		roles: require_bindings.normalizeRouteBindingRoles(match.roles)
	};
}
function buildExactPeerIdSet(params) {
	const exactPeerIds = /* @__PURE__ */ new Set();
	const peerId = params.peerId?.trim();
	if (peerId) exactPeerIds.add(peerId);
	for (const alias of params.exactPeerIdAliases ?? []) {
		const trimmed = alias.trim();
		if (trimmed) exactPeerIds.add(trimmed);
	}
	return exactPeerIds;
}
function resolveFirstBoundAccountId(params) {
	const normalizedChannel = require_bindings.normalizeRouteBindingChannelId(params.channelId);
	if (!normalizedChannel) return;
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	const exactPeerIds = buildExactPeerIdSet({
		peerId: params.peerId?.trim() || void 0,
		exactPeerIdAliases: params.exactPeerIdAliases
	});
	const hasPeerContext = exactPeerIds.size > 0;
	const normalizedPeerKind = require_chat_type.normalizeChatType(params.peerKind) ?? void 0;
	let wildcardPeerMatch;
	let channelOnlyFallback;
	for (const binding of require_bindings$1.listRouteBindings(params.cfg)) {
		const resolved = resolveNormalizedBoundAccountMatch(binding);
		if (!resolved || resolved.channelId !== normalizedChannel || resolved.agentId !== normalizedAgentId) continue;
		if (!require_bindings.routeBindingScopeMatches(resolved, {
			groupSpace: params.groupSpace,
			memberRoleIds: params.memberRoleIds
		})) continue;
		if (!hasPeerContext) return resolved.accountId;
		if (resolved.peerId === "*") {
			if (!resolved.peerKind || !normalizedPeerKind || !require_resolve_route.peerKindMatches(resolved.peerKind, normalizedPeerKind)) continue;
			wildcardPeerMatch ??= resolved.accountId;
		} else if (resolved.peerId) {
			if (resolved.peerKind && normalizedPeerKind && !require_resolve_route.peerKindMatches(resolved.peerKind, normalizedPeerKind)) continue;
			if (exactPeerIds.has(resolved.peerId)) return resolved.accountId;
		} else channelOnlyFallback ??= resolved.accountId;
	}
	return wildcardPeerMatch ?? channelOnlyFallback;
}
//#endregion
Object.defineProperty(exports, "resolveFirstBoundAccountId", {
	enumerable: true,
	get: function() {
		return resolveFirstBoundAccountId;
	}
});
