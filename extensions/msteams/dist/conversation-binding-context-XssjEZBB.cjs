require("./plugins-_-82JYfc.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_channel_target_prefix = require("./channel-target-prefix-HjpWN9Zt.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_session_binding_normalization = require("./session-binding-normalization-DSoe9GtS.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_target_parsing_loaded = require("./target-parsing-loaded-D2VCi2lk.cjs");
const require_public_surface_loader = require("./public-surface-loader-CK-Iot2Y.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/conversation-id.ts
function resolveExplicitConversationTargetId(target) {
	for (const prefix of [
		"channel:",
		"conversation:",
		"group:",
		"room:",
		"dm:"
	]) if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(target).startsWith(prefix)) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.slice(prefix.length));
}
/**
* Chooses the best conversation id from an explicit thread id or outbound targets.
*/
function resolveConversationIdFromTargets(params) {
	const threadId = require_channel_route.stringifyRouteThreadId(params.threadId);
	if (threadId) return threadId;
	for (const rawTarget of params.targets) {
		const target = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawTarget);
		if (!target) continue;
		const explicitConversationId = resolveExplicitConversationTargetId(target);
		if (explicitConversationId) return explicitConversationId;
		if (target.includes(":") && explicitConversationId === void 0) continue;
		const mentionMatch = target.match(/^<#(\d+)>$/);
		if (mentionMatch?.[1]) return mentionMatch[1];
		if (/^\d{6,}$/.test(target)) return target;
	}
}
//#endregion
//#region src/channels/plugins/thread-binding-api.ts
/**
* Bundled channel thread-binding public artifact loader.
*
* Reads lightweight thread placement and inbound conversation hooks without full plugin loading.
*/
const THREAD_BINDING_API_ARTIFACT_BASENAME = "thread-binding-api.js";
const MISSING_PUBLIC_SURFACE_PREFIX = "Unable to resolve bundled plugin public surface ";
function loadBundledChannelThreadBindingApi(channelId) {
	const cacheKey = channelId.trim();
	try {
		return require_public_surface_loader.loadBundledPluginPublicArtifactModuleSync({
			dirName: cacheKey,
			artifactBasename: THREAD_BINDING_API_ARTIFACT_BASENAME
		});
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(MISSING_PUBLIC_SURFACE_PREFIX)) return;
		throw error;
	}
}
function normalizeThreadBindingPlacement(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typeof value === "string" ? value : void 0);
	return normalized === "current" || normalized === "child" ? normalized : void 0;
}
/**
* Resolves the default top-level thread-binding placement for a bundled channel.
*/
function resolveBundledChannelThreadBindingDefaultPlacement(channelId) {
	return normalizeThreadBindingPlacement(loadBundledChannelThreadBindingApi(channelId)?.defaultTopLevelPlacement);
}
/**
* Resolves inbound conversation refs from a bundled channel thread-binding artifact.
*/
function resolveBundledChannelThreadBindingInboundConversation(params) {
	const api = loadBundledChannelThreadBindingApi(params.channelId);
	if (typeof api?.resolveInboundConversation !== "function") return;
	return api.resolveInboundConversation({
		from: params.from,
		to: params.to,
		conversationId: params.conversationId,
		threadId: params.threadId,
		threadParentId: params.threadParentId,
		isGroup: params.isGroup
	});
}
//#endregion
//#region src/channels/conversation-resolution.ts
/**
* Canonical conversation resolution for command and inbound channel flows.
* This module turns channel targets, thread ids, aliases, and plugin hooks into stable binding ids.
*/
const CANONICAL_TARGET_PREFIXES = ["user:", "spaces/"];
function resolveChannelId(raw) {
	const normalizedRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw);
	if (!normalizedRaw) return null;
	return require_registry_normalize.normalizeAnyChannelId(normalizedRaw) ?? require_registry$1.normalizeChannelId(normalizedRaw) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(normalizedRaw) ?? null;
}
function getActiveRegistryChannelPlugin(rawChannel) {
	const normalized = require_registry_normalize.normalizeAnyChannelId(rawChannel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawChannel);
	if (!normalized) return;
	return require_runtime.getActivePluginChannelRegistry()?.channels.find((entry) => entry.plugin.id === normalized)?.plugin;
}
function getRuntimeChannelPluginCandidates(channel) {
	const candidates = [getActiveRegistryChannelPlugin(channel), require_registry$1.getLoadedChannelPlugin(channel)].filter((plugin) => Boolean(plugin));
	return [...new Map(candidates.map((plugin) => [plugin.id, plugin])).values()];
}
function resolveRuntimeChannelPlugin(channel) {
	return getRuntimeChannelPluginCandidates(channel)[0];
}
function shouldDefaultParentConversationToSelf(plugin) {
	return plugin?.bindings?.selfParentConversationByDefault === true;
}
function normalizeResolutionTarget(params) {
	const conversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.conversation?.conversationId);
	if (!conversationId) return null;
	const parentConversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.conversation?.parentConversationId);
	const defaultParentToSelf = shouldDefaultParentConversationToSelf(params.plugin) && !params.threadId && !parentConversationId;
	const normalized = require_session_binding_normalization.normalizeConversationTargetRef({
		conversationId,
		parentConversationId: defaultParentToSelf ? conversationId : parentConversationId
	});
	const normalizedParentConversationId = defaultParentToSelf ? normalized.conversationId : normalized.parentConversationId;
	const placementHint = params.includePlacementHint === false ? void 0 : resolveChannelDefaultBindingPlacement(params.channel);
	return {
		canonical: {
			channel: params.channel,
			accountId: params.accountId,
			conversationId: normalized.conversationId,
			...normalizedParentConversationId ? { parentConversationId: normalizedParentConversationId } : {}
		},
		...params.threadId ? { threadId: params.threadId } : {},
		...placementHint ? { placementHint } : {},
		source: params.source
	};
}
function resolveBindingAccountId(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.rawAccountId) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.plugin?.config.defaultAccountId?.(params.cfg)) || "default";
}
function resolveFallbackConversationTargetId(params) {
	const { allowNumericTopicShorthand = false } = params;
	const target = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.rawTarget);
	if (!target) return;
	const withoutKind = require_channel_target_prefix.stripTargetKindPrefix(target);
	const withoutTopic = params.preserveExplicitTopicSuffix && /:topic:/iu.test(withoutKind) ? withoutKind : require_channel_target_prefix.stripTargetTopicSuffix(withoutKind, { allowNumericShorthand: allowNumericTopicShorthand });
	return resolveConversationIdFromTargets({ targets: [withoutTopic] }) ?? (withoutTopic !== target ? withoutTopic : void 0) ?? resolveConversationIdFromTargets({ targets: [target] });
}
function resolveChannelTargetId(params) {
	const target = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.target);
	if (!target) return;
	const messaging = resolveRuntimeChannelPlugin(params.channel)?.messaging;
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(target);
	const channelPrefix = `${params.channel}:`;
	if (lower.startsWith(channelPrefix)) return resolveChannelTargetId({
		channel: params.channel,
		target: target.slice(channelPrefix.length),
		preserveExplicitTopicSuffix: params.preserveExplicitTopicSuffix
	});
	if (CANONICAL_TARGET_PREFIXES.some((prefix) => lower.startsWith(prefix))) return target;
	const prefixedChannel = require_channel_target_prefix.resolveTargetPrefixedChannel(target);
	if (!prefixedChannel || prefixedChannel !== params.channel) {
		const explicitConversationId = resolveFallbackConversationTargetId({
			rawTarget: target,
			allowNumericTopicShorthand: messaging?.numericTopicShorthand === true,
			preserveExplicitTopicSuffix: params.preserveExplicitTopicSuffix
		});
		if (explicitConversationId) return explicitConversationId;
	}
	const normalizedTarget = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(messaging?.normalizeTarget?.(target));
	if (normalizedTarget) {
		const withoutProvider = require_channel_target_prefix.stripTargetProviderPrefix(normalizedTarget, params.channel);
		return resolveFallbackConversationTargetId({
			rawTarget: withoutProvider,
			allowNumericTopicShorthand: messaging?.numericTopicShorthand === true,
			preserveExplicitTopicSuffix: params.preserveExplicitTopicSuffix
		}) || withoutProvider || normalizedTarget;
	}
	const parsedTarget = require_target_parsing_loaded.resolveExplicitDeliveryTargetCompat({
		channel: params.channel,
		rawTarget: target
	});
	if (parsedTarget?.to) return resolveConversationIdFromTargets({ targets: [parsedTarget.to] }) ?? parsedTarget.to;
	return target;
}
function buildThreadingContext(params) {
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.originatingTo) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.fallbackTo);
	return {
		...to ? { To: to } : {},
		...params.from ? { From: params.from } : {},
		...params.chatType ? { ChatType: params.chatType } : {},
		...params.threadId ? { MessageThreadId: params.threadId } : {},
		...params.nativeChannelId ? { NativeChannelId: params.nativeChannelId } : {}
	};
}
/**
* Resolves whether top-level bindings default to the current conversation or a child thread.
*/
function resolveChannelDefaultBindingPlacement(rawChannel) {
	const channel = resolveChannelId(rawChannel);
	if (!channel) return;
	return resolveRuntimeChannelPlugin(channel)?.conversationBindings?.defaultTopLevelPlacement ?? resolveBundledChannelThreadBindingDefaultPlacement(channel);
}
/**
* Resolves command context into a canonical channel/account/conversation tuple.
*/
function resolveCommandConversationResolution(params) {
	const channel = resolveChannelId(params.channel);
	if (!channel) return null;
	const plugin = resolveRuntimeChannelPlugin(channel);
	const accountId = resolveBindingAccountId({
		rawAccountId: params.accountId,
		plugin,
		cfg: params.cfg
	});
	const threadId = require_channel_route.stringifyRouteThreadId(params.threadId);
	const commandParams = {
		accountId,
		threadId,
		threadParentId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.threadParentId),
		senderId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.senderId),
		sessionKey: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey),
		parentSessionKey: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.parentSessionKey),
		from: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.from),
		chatType: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.chatType),
		originatingTo: params.originatingTo ?? void 0,
		commandTo: params.commandTo ?? void 0,
		fallbackTo: params.fallbackTo ?? void 0
	};
	const resolvedByProvider = plugin?.bindings?.resolveCommandConversation?.(commandParams);
	const providerResolution = normalizeResolutionTarget({
		channel,
		accountId,
		conversation: resolvedByProvider,
		source: "command-provider",
		threadId,
		plugin,
		includePlacementHint: params.includePlacementHint
	});
	if (providerResolution) return providerResolution;
	const focusedBinding = plugin?.threading?.resolveFocusedBinding?.({
		cfg: params.cfg,
		accountId,
		context: buildThreadingContext({
			fallbackTo: params.fallbackTo ?? void 0,
			originatingTo: params.originatingTo ?? void 0,
			threadId,
			from: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.from),
			chatType: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.chatType),
			nativeChannelId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.nativeChannelId)
		})
	});
	const focusedResolution = normalizeResolutionTarget({
		channel,
		accountId,
		conversation: focusedBinding,
		source: "focused-binding",
		threadId,
		plugin,
		includePlacementHint: params.includePlacementHint
	});
	if (focusedResolution) return focusedResolution;
	const baseConversationId = resolveChannelTargetId({
		channel,
		target: params.originatingTo
	}) ?? resolveChannelTargetId({
		channel,
		target: params.commandTo
	}) ?? resolveChannelTargetId({
		channel,
		target: params.fallbackTo
	});
	const parentConversationId = resolveChannelTargetId({
		channel,
		target: params.threadParentId
	}) ?? (threadId && baseConversationId && baseConversationId !== threadId ? baseConversationId : void 0);
	const conversationId = threadId || baseConversationId;
	if (!conversationId) return null;
	return normalizeResolutionTarget({
		channel,
		accountId,
		conversation: {
			conversationId,
			parentConversationId
		},
		source: "command-fallback",
		threadId,
		plugin,
		includePlacementHint: params.includePlacementHint
	});
}
/**
* Resolves inbound message context into the canonical binding conversation tuple.
*/
function resolveInboundConversationResolution(params) {
	const channel = resolveChannelId(params.channel);
	if (!channel) return null;
	const plugin = resolveRuntimeChannelPlugin(channel);
	const accountId = resolveBindingAccountId({
		rawAccountId: params.accountId,
		plugin,
		cfg: params.cfg
	});
	const threadId = require_channel_route.stringifyRouteThreadId(params.threadId);
	const resolverParams = {
		from: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.from),
		to: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.to),
		conversationId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.conversationId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.groupId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.to),
		threadId,
		threadParentId: require_channel_route.stringifyRouteThreadId(params.threadParentId),
		isGroup: params.isGroup ?? true
	};
	const providerConversation = plugin?.messaging?.resolveInboundConversation?.(resolverParams);
	const providerResolution = normalizeResolutionTarget({
		channel,
		accountId,
		conversation: providerConversation,
		source: "inbound-provider",
		threadId,
		plugin
	});
	if (providerResolution || providerConversation === null) return providerResolution;
	const artifactConversation = resolveBundledChannelThreadBindingInboundConversation({
		channelId: channel,
		...resolverParams
	});
	const artifactResolution = normalizeResolutionTarget({
		channel,
		accountId,
		conversation: artifactConversation,
		source: "inbound-bundled-artifact",
		threadId,
		plugin
	});
	if (artifactResolution || artifactConversation === null) return artifactResolution;
	const parentConversationId = resolveChannelTargetId({
		channel,
		target: params.threadParentId == null ? void 0 : String(params.threadParentId),
		preserveExplicitTopicSuffix: threadId == null
	}) ?? resolveChannelTargetId({
		channel,
		target: params.to,
		preserveExplicitTopicSuffix: threadId == null
	}) ?? resolveChannelTargetId({
		channel,
		target: params.conversationId,
		preserveExplicitTopicSuffix: threadId == null
	}) ?? resolveChannelTargetId({
		channel,
		target: params.groupId,
		preserveExplicitTopicSuffix: threadId == null
	});
	const genericConversationId = threadId ?? resolveChannelTargetId({
		channel,
		target: params.conversationId,
		preserveExplicitTopicSuffix: threadId == null
	}) ?? resolveChannelTargetId({
		channel,
		target: params.groupId,
		preserveExplicitTopicSuffix: threadId == null
	}) ?? parentConversationId;
	if (!genericConversationId) return null;
	return normalizeResolutionTarget({
		channel,
		accountId,
		conversation: {
			conversationId: genericConversationId,
			parentConversationId: threadId != null ? parentConversationId : void 0
		},
		source: "inbound-fallback",
		threadId,
		plugin
	});
}
//#endregion
//#region src/channels/conversation-binding-context.ts
/**
* Resolves the canonical channel/account/conversation tuple used for conversation bindings.
*/
function resolveConversationBindingContext(params) {
	const resolution = resolveCommandConversationResolution({
		...params,
		includePlacementHint: false
	});
	if (!resolution) return null;
	return {
		channel: resolution.canonical.channel,
		accountId: resolution.canonical.accountId,
		conversationId: resolution.canonical.conversationId,
		...resolution.canonical.parentConversationId ? { parentConversationId: resolution.canonical.parentConversationId } : {},
		...resolution.threadId ? { threadId: resolution.threadId } : {}
	};
}
//#endregion
Object.defineProperty(exports, "resolveBundledChannelThreadBindingDefaultPlacement", {
	enumerable: true,
	get: function() {
		return resolveBundledChannelThreadBindingDefaultPlacement;
	}
});
Object.defineProperty(exports, "resolveChannelDefaultBindingPlacement", {
	enumerable: true,
	get: function() {
		return resolveChannelDefaultBindingPlacement;
	}
});
Object.defineProperty(exports, "resolveConversationBindingContext", {
	enumerable: true,
	get: function() {
		return resolveConversationBindingContext;
	}
});
Object.defineProperty(exports, "resolveConversationIdFromTargets", {
	enumerable: true,
	get: function() {
		return resolveConversationIdFromTargets;
	}
});
Object.defineProperty(exports, "resolveInboundConversationResolution", {
	enumerable: true,
	get: function() {
		return resolveInboundConversationResolution;
	}
});
