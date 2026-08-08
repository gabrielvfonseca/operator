const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_plugins = require("./plugins-_-82JYfc.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_store = require("./store-DCwJguwr.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/model-overrides.ts
/**
* Channel-scoped model override resolver.
*
* Matches conversation ids, parent sessions, and wildcard config entries to model overrides.
*/
function resolveProviderEntry(modelByChannel, channel) {
	const normalized = require_message_channel.normalizeMessageChannel(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel) ?? "";
	return modelByChannel?.[normalized] ?? modelByChannel?.[Object.keys(modelByChannel ?? {}).find((key) => {
		return (require_message_channel.normalizeMessageChannel(key) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(key) ?? "") === normalized;
	}) ?? ""];
}
function buildChannelCandidates(params) {
	const normalizedChannel = require_message_channel.normalizeMessageChannel(params.channel ?? "") ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	const groupId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.groupId);
	const rawParentConversation = require_session_key.parseRawSessionConversationRef(params.parentSessionKey);
	const parentOverrideFallbacks = (normalizedChannel ? require_registry.getChannelPlugin(normalizedChannel) : void 0)?.conversationBindings?.buildModelOverrideParentCandidates?.({ parentConversationId: rawParentConversation?.rawId }) ?? [];
	const sessionConversation = require_store.resolveSessionConversationRef(params.parentSessionKey, { bundledFallback: parentOverrideFallbacks.length === 0 });
	const groupConversationKind = require_chat_type.normalizeChatType(params.groupChatType ?? void 0) === "channel" ? "channel" : sessionConversation?.kind === "channel" ? "channel" : "group";
	const groupConversation = require_store.resolveSessionConversation({
		channel: normalizedChannel ?? "",
		kind: groupConversationKind,
		rawId: groupId ?? ""
	});
	const groupChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.groupChannel);
	const groupSubject = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.groupSubject);
	const channelBare = groupChannel ? groupChannel.replace(/^#/, "") : void 0;
	const subjectBare = groupSubject ? groupSubject.replace(/^#/, "") : void 0;
	const channelSlug = channelBare ? require_plugins.normalizeChannelSlug(channelBare) : void 0;
	const subjectSlug = subjectBare ? require_plugins.normalizeChannelSlug(subjectBare) : void 0;
	return {
		keys: require_plugins.buildChannelKeyCandidates(groupId, sessionConversation?.rawId, ...groupConversation?.parentConversationCandidates ?? [], ...sessionConversation?.parentConversationCandidates ?? [], ...parentOverrideFallbacks),
		parentKeys: require_plugins.buildChannelKeyCandidates(groupChannel, channelBare, channelSlug, groupSubject, subjectBare, subjectSlug)
	};
}
function buildGenericParentOverrideCandidates(sessionKey) {
	const raw = require_session_key.parseRawSessionConversationRef(sessionKey);
	if (!raw) return [];
	const { baseSessionKey, threadId } = require_session_key.parseThreadSessionSuffix(raw.rawId);
	return require_plugins.buildChannelKeyCandidates(threadId ? baseSessionKey : raw.rawId);
}
/** Expand prefixed peer IDs by also trying the raw form after the channel prefix. */
function expandPeerIds(ids, channel) {
	const channelPrefix = `${channel.toLowerCase()}:`;
	const expanded = [];
	for (const id of ids) if (id != null) {
		expanded.push(id);
		if (id.toLowerCase().startsWith(channelPrefix)) expanded.push(id.slice(channelPrefix.length));
	}
	return expanded;
}
function resolveDirectChannelModelMatch(params) {
	const expandedUserIds = expandPeerIds(params.directUserIds ?? [], params.channel);
	const directKeys = require_plugins.buildChannelKeyCandidates(params.groupId, ...expandedUserIds, ...buildGenericParentOverrideCandidates(params.parentSessionKey));
	if (directKeys.length === 0) return null;
	const match = require_plugins.resolveChannelEntryMatchWithFallback({
		entries: params.providerEntries,
		keys: directKeys,
		parentKeys: [],
		wildcardKey: "*",
		normalizeKey: (value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) ?? ""
	});
	const raw = match.entry ?? match.wildcardEntry;
	if (typeof raw !== "string") return null;
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw);
	if (!model) return null;
	return {
		model,
		matchKey: match.matchKey,
		matchSource: match.matchSource
	};
}
/** Resolves a channel-scoped model override from direct, parent, and wildcard config entries. */
function resolveChannelModelOverride(params) {
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel);
	if (!channel) return null;
	const modelByChannel = params.cfg.channels?.modelByChannel;
	if (!modelByChannel) return null;
	const providerEntries = resolveProviderEntry(modelByChannel, channel);
	if (!providerEntries) return null;
	const isDirectChat = require_chat_type.normalizeChatType(params.groupChatType ?? void 0) === "direct";
	let directMatch = null;
	if (isDirectChat) directMatch = resolveDirectChannelModelMatch({
		channel,
		providerEntries,
		groupId: params.groupId,
		parentSessionKey: params.parentSessionKey,
		directUserIds: params.directUserIds
	});
	if (directMatch) return {
		channel: require_message_channel.normalizeMessageChannel(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel) ?? "",
		model: directMatch.model,
		matchKey: directMatch.matchKey,
		matchSource: directMatch.matchSource
	};
	const { keys, parentKeys } = buildChannelCandidates(params);
	if (keys.length === 0 && parentKeys.length === 0) {
		const wildcardModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(providerEntries["*"]);
		if (wildcardModel) return {
			channel: require_message_channel.normalizeMessageChannel(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel) ?? "",
			model: wildcardModel,
			matchKey: "*",
			matchSource: "wildcard"
		};
		return null;
	}
	const match = require_plugins.resolveChannelEntryMatchWithFallback({
		entries: providerEntries,
		keys,
		parentKeys,
		wildcardKey: "*",
		normalizeKey: (value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) ?? ""
	});
	const raw = match.entry ?? match.wildcardEntry;
	if (typeof raw !== "string") return null;
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw);
	if (!model) return null;
	return {
		channel: require_message_channel.normalizeMessageChannel(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel) ?? "",
		model,
		matchKey: match.matchKey,
		matchSource: match.matchSource
	};
}
//#endregion
Object.defineProperty(exports, "resolveChannelModelOverride", {
	enumerable: true,
	get: function() {
		return resolveChannelModelOverride;
	}
});
