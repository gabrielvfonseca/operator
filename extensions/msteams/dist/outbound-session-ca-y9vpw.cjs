const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
const require_resolve_route = require("./resolve-route-DQGFdHA5.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
require("./inbound.runtime-5wmC-Vmi.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/base-session-key.ts
/**
* Builds the canonical outbound base-session key for a resolved route peer.
*
* Mirrors the routing layer's session-scope rules so outbound-only sends and
* inbound route resolution keep the same `dmScope` and identity-link behavior.
*/
function buildOutboundBaseSessionKey(params) {
	return require_resolve_route.buildAgentSessionKey({
		agentId: params.agentId,
		mainKey: params.cfg.session?.mainKey,
		channel: params.channel,
		accountId: params.accountId,
		peer: params.peer,
		dmScope: params.cfg.session?.dmScope ?? "main",
		identityLinks: params.cfg.session?.identityLinks
	});
}
//#endregion
//#region src/infra/outbound/outbound-session.ts
var outbound_session_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	ensureOutboundSessionEntry: () => ensureOutboundSessionEntry,
	resolveOutboundSessionRoute: () => resolveOutboundSessionRoute
});
function resolveOutboundChannelPlugin(channel) {
	return require_registry.getChannelPlugin(channel);
}
function stripProviderPrefix(raw, channel) {
	const trimmed = raw.trim();
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	const prefix = `${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(channel)}:`;
	if (lower.startsWith(prefix)) return trimmed.slice(prefix.length).trim();
	return trimmed;
}
function stripKindPrefix(raw) {
	return raw.replace(/^(user|channel|group|conversation|room|dm|thread):/i, "").trim();
}
const FALLBACK_TARGET_KIND_PREFIXES = [
	{
		kind: "direct",
		pattern: /^(user:|dm:)/i
	},
	{
		kind: "channel",
		pattern: /^(channel:|conversation:|thread:)/i
	},
	{
		kind: "group",
		pattern: /^(group:|room:)/i
	}
];
function normalizeInferredPeerKind(value) {
	return value === "direct" || value === "group" || value === "channel" ? value : void 0;
}
function inferPeerKindFromPlugin(params) {
	for (const target of params.targets) {
		const inferred = normalizeInferredPeerKind(params.plugin?.messaging?.inferTargetChatType?.({ to: target }));
		if (inferred) return inferred;
	}
}
function inferPeerKindFromLegacyParser(params) {
	for (const target of params.targets) {
		const parsed = params.plugin?.messaging?.parseExplicitTarget?.({ raw: target });
		const inferred = normalizeInferredPeerKind(parsed?.chatType);
		if (inferred) return inferred;
	}
}
function inferPeerKindFromFallbackPrefixes(targets) {
	for (const target of targets) for (const fallback of FALLBACK_TARGET_KIND_PREFIXES) if (fallback.pattern.test(target)) return fallback.kind;
}
function inferPeerKindFromCapabilities(plugin) {
	const chatTypes = [];
	for (const chatType of plugin?.capabilities?.chatTypes ?? []) if ((chatType === "direct" || chatType === "group" || chatType === "channel") && !chatTypes.includes(chatType)) chatTypes.push(chatType);
	return chatTypes.length === 1 ? chatTypes[0] : void 0;
}
function inferPeerKind(params) {
	const resolvedKind = params.resolvedTarget?.kind;
	if (resolvedKind === "user") return "direct";
	if (resolvedKind === "channel") return "channel";
	if (resolvedKind === "group") {
		const chatTypes = (params.plugin ?? resolveOutboundChannelPlugin(params.channel))?.capabilities?.chatTypes ?? [];
		const supportsChannel = chatTypes.includes("channel");
		const supportsGroup = chatTypes.includes("group");
		if (supportsChannel && !supportsGroup) return "channel";
		return "group";
	}
	const plugin = params.plugin ?? resolveOutboundChannelPlugin(params.channel);
	const strippedTarget = stripProviderPrefix(params.target, params.channel).trim();
	const targets = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([params.target, strippedTarget].filter(Boolean));
	return inferPeerKindFromPlugin({
		plugin,
		targets
	}) ?? inferPeerKindFromLegacyParser({
		plugin,
		targets
	}) ?? inferPeerKindFromFallbackPrefixes(targets) ?? inferPeerKindFromCapabilities(plugin) ?? "direct";
}
function resolveFallbackSession(params) {
	const trimmed = stripProviderPrefix(params.target, params.channel).trim();
	if (!trimmed) return null;
	const peerKind = inferPeerKind({
		channel: params.channel,
		plugin: params.plugin,
		target: params.target,
		resolvedTarget: params.resolvedTarget
	});
	if (!peerKind) return null;
	const peerId = stripKindPrefix(trimmed);
	if (!peerId) return null;
	const peer = {
		kind: peerKind,
		id: peerId
	};
	const baseSessionKey = buildOutboundBaseSessionKey({
		cfg: params.cfg,
		agentId: params.agentId,
		channel: params.channel,
		accountId: params.accountId,
		peer
	});
	return {
		sessionKey: baseSessionKey,
		baseSessionKey,
		recipientSessionExact: false,
		peer,
		chatType: peerKind === "direct" ? "direct" : peerKind === "channel" ? "channel" : "group",
		from: peerKind === "direct" ? `${params.channel}:${peerId}` : `${params.channel}:${peerKind}:${peerId}`,
		to: `${peerKind === "direct" ? "user" : "channel"}:${peerId}`
	};
}
/** Resolves the session route used to mirror outbound delivery into conversation state. */
async function resolveOutboundSessionRoute(params) {
	const target = params.target.trim();
	if (!target) return null;
	const nextParams = {
		...params,
		target
	};
	const resolver = (params.plugin ?? resolveOutboundChannelPlugin(params.channel))?.messaging?.resolveOutboundSessionRoute;
	if (resolver) return await resolver(nextParams);
	return resolveFallbackSession(nextParams);
}
/** Persists best-effort session metadata for an outbound-only route. */
async function ensureOutboundSessionEntry(params) {
	const storePath = require_paths.resolveStorePath(params.cfg.session?.store, { agentId: require_session_key.resolveAgentIdFromSessionKey(params.route.sessionKey) });
	const ctx = {
		From: params.route.from,
		To: params.route.to,
		SessionKey: params.route.sessionKey,
		AccountId: params.accountId ?? void 0,
		ChatType: params.route.chatType,
		Provider: params.channel,
		Surface: params.channel,
		MessageThreadId: params.route.threadId,
		OriginatingChannel: params.channel,
		OriginatingTo: params.route.to
	};
	try {
		await require_session_accessor.recordInboundSessionMeta({
			storePath,
			sessionKey: params.route.sessionKey,
			ctx
		});
	} catch {}
}
//#endregion
Object.defineProperty(exports, "buildOutboundBaseSessionKey", {
	enumerable: true,
	get: function() {
		return buildOutboundBaseSessionKey;
	}
});
Object.defineProperty(exports, "ensureOutboundSessionEntry", {
	enumerable: true,
	get: function() {
		return ensureOutboundSessionEntry;
	}
});
Object.defineProperty(exports, "outbound_session_exports", {
	enumerable: true,
	get: function() {
		return outbound_session_exports;
	}
});
Object.defineProperty(exports, "resolveOutboundSessionRoute", {
	enumerable: true,
	get: function() {
		return resolveOutboundSessionRoute;
	}
});
