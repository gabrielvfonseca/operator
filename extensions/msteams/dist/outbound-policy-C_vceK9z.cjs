require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_target_normalization = require("./target-normalization-CHxcE9Mj.cjs");
const require_target_resolver = require("./target-resolver-Bn46QRpp.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/channels/plugins/message-action-names.ts
/**
* Canonical message action names accepted by channel message tool dispatch.
*/
const CHANNEL_MESSAGE_ACTION_NAMES = [
	"send",
	"broadcast",
	"poll",
	"poll-vote",
	"react",
	"reactions",
	"read",
	"edit",
	"unsend",
	"reply",
	"sendWithEffect",
	"renameGroup",
	"setGroupIcon",
	"addParticipant",
	"removeParticipant",
	"leaveGroup",
	"sendAttachment",
	"delete",
	"pin",
	"unpin",
	"list-pins",
	"permissions",
	"thread-create",
	"thread-list",
	"thread-reply",
	"search",
	"sticker",
	"sticker-search",
	"member-info",
	"role-info",
	"emoji-list",
	"emoji-upload",
	"sticker-upload",
	"role-add",
	"role-remove",
	"channel-info",
	"channel-list",
	"channel-create",
	"channel-edit",
	"channel-delete",
	"channel-move",
	"category-create",
	"category-edit",
	"category-delete",
	"topic-create",
	"topic-edit",
	"voice-status",
	"event-list",
	"event-create",
	"timeout",
	"kick",
	"ban",
	"set-profile",
	"set-presence",
	"download-file",
	"upload-file"
];
//#endregion
//#region src/infra/outbound/outbound-policy.ts
const CONTEXT_GUARDED_ACTIONS = /* @__PURE__ */ new Set([
	"send",
	"poll",
	"poll-vote",
	"reply",
	"sendWithEffect",
	"sendAttachment",
	"upload-file",
	"edit",
	"delete",
	"pin",
	"unpin",
	"thread-create",
	"thread-reply",
	"sticker"
]);
const CONTEXT_MARKER_ACTIONS = /* @__PURE__ */ new Set([
	"send",
	"poll",
	"reply",
	"sendWithEffect",
	"sendAttachment",
	"upload-file",
	"thread-reply",
	"sticker"
]);
function resolveContextGuardTarget(action, params) {
	if (!CONTEXT_GUARDED_ACTIONS.has(action)) return;
	if (action === "thread-reply" || action === "thread-create") {
		if (typeof params.channelId === "string") return params.channelId;
		if (typeof params.to === "string") return params.to;
		return;
	}
	if (typeof params.to === "string") return params.to;
	if (typeof params.channelId === "string") return params.channelId;
}
function normalizeTarget(channel, raw) {
	return require_target_normalization.normalizeTargetForProvider(channel, raw) ?? raw.trim();
}
function isCrossContextTarget(params) {
	if (params.toolContext && require_registry.getChannelPlugin(params.channel)?.threading?.matchesToolContextTarget?.({
		target: params.target,
		toolContext: params.toolContext
	})) return false;
	const currentTargets = [params.toolContext?.currentMessagingTarget?.trim(), params.toolContext?.currentChannelId?.trim()].filter((target) => Boolean(target));
	if (currentTargets.length === 0) return false;
	const normalizedTarget = normalizeTarget(params.channel, params.target);
	if (!normalizedTarget) return false;
	return !currentTargets.some((currentTarget) => normalizeTarget(params.channel, currentTarget) === normalizedTarget);
}
function resolveAgentMessageToolsConfig(cfg, agentId) {
	const trimmedAgentId = agentId?.trim();
	const globalConfig = cfg.tools?.message;
	if (!trimmedAgentId) return globalConfig;
	const agentConfig = cfg.agents?.list?.find((entry) => entry.id === trimmedAgentId)?.tools?.message;
	if (!agentConfig) return globalConfig;
	return {
		...globalConfig,
		...agentConfig,
		crossContext: globalConfig?.crossContext || agentConfig.crossContext ? {
			...globalConfig?.crossContext,
			...agentConfig.crossContext,
			marker: globalConfig?.crossContext?.marker || agentConfig.crossContext?.marker ? {
				...globalConfig?.crossContext?.marker,
				...agentConfig.crossContext?.marker
			} : void 0
		} : void 0,
		broadcast: globalConfig?.broadcast || agentConfig.broadcast ? {
			...globalConfig?.broadcast,
			...agentConfig.broadcast
		} : void 0,
		actions: globalConfig?.actions || agentConfig.actions ? {
			...globalConfig?.actions,
			...agentConfig.actions
		} : void 0
	};
}
/**
* Resolves the message-tool policy after applying any agent-specific overrides.
*/
function resolveEffectiveMessageToolsConfig(params) {
	return resolveAgentMessageToolsConfig(params.cfg, params.agentId);
}
/**
* Returns the normalized allowed message actions for an agent or the global policy.
*/
function resolveAllowedMessageActions(params) {
	const allow = resolveEffectiveMessageToolsConfig(params)?.actions?.allow;
	if (!allow) return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(allow);
	return normalized.length > 0 ? normalized : void 0;
}
/**
* Rejects disabled message actions before channel-specific send handling runs.
*/
function enforceMessageActionAllowlist(params) {
	const allowed = resolveAllowedMessageActions(params);
	if (!allowed || allowed.includes(params.action)) return;
	throw new Error(`Message action "${params.action}" is disabled for this agent.`);
}
/**
* Enforces cross-context message-send policy for a bound channel/thread context.
*/
function enforceCrossContextPolicy(params) {
	const currentTarget = params.toolContext?.currentChannelId?.trim() ?? params.toolContext?.currentMessagingTarget?.trim();
	if (!currentTarget) return;
	if (!CONTEXT_GUARDED_ACTIONS.has(params.action)) return;
	const messageConfig = resolveEffectiveMessageToolsConfig({
		cfg: params.cfg,
		agentId: params.agentId
	});
	if (messageConfig?.allowCrossContextSend) return;
	const currentProvider = params.toolContext?.currentChannelProvider;
	const allowWithinProvider = messageConfig?.crossContext?.allowWithinProvider !== false;
	const allowAcrossProviders = messageConfig?.crossContext?.allowAcrossProviders === true;
	if (currentProvider && currentProvider !== params.channel) {
		if (!allowAcrossProviders) throw new Error(`Cross-context messaging denied: action=${params.action} target provider "${params.channel}" while bound to "${currentProvider}".`);
		return;
	}
	if (allowWithinProvider) return;
	const target = resolveContextGuardTarget(params.action, params.args);
	if (!target) return;
	if (!isCrossContextTarget({
		channel: params.channel,
		target,
		toolContext: params.toolContext
	})) return;
	throw new Error(`Cross-context messaging denied: action=${params.action} target="${target}" while bound to "${currentTarget}" (channel=${params.channel}).`);
}
/**
* Builds cross-context marker text or a channel-native presentation for forwarded sends.
*/
async function buildCrossContextDecoration(params) {
	const currentTarget = params.toolContext?.currentChannelId ?? params.toolContext?.currentMessagingTarget;
	if (!currentTarget) return null;
	if (params.toolContext?.skipCrossContextDecoration) return null;
	if (!isCrossContextTarget(params)) return null;
	const markerConfig = resolveEffectiveMessageToolsConfig({
		cfg: params.cfg,
		agentId: params.agentId
	})?.crossContext?.marker;
	if (markerConfig?.enabled === false) return null;
	const currentName = await require_target_resolver.lookupDirectoryDisplay({
		cfg: params.cfg,
		channel: params.channel,
		targetId: currentTarget,
		accountId: params.accountId ?? void 0
	}) ?? currentTarget;
	const originLabel = require_target_resolver.formatTargetDisplay({
		channel: params.channel,
		target: currentTarget,
		display: currentName
	});
	const prefixTemplate = markerConfig?.prefix ?? "[from {channel}] ";
	const suffixTemplate = markerConfig?.suffix ?? "";
	const prefix = prefixTemplate.replaceAll("{channel}", originLabel);
	const suffix = suffixTemplate.replaceAll("{channel}", originLabel);
	const buildPresentation = require_registry.getChannelPlugin(params.channel)?.messaging?.buildCrossContextPresentation;
	return {
		prefix,
		suffix,
		presentationBuilder: buildPresentation ? (message) => buildPresentation({
			originLabel,
			message,
			cfg: params.cfg,
			accountId: params.accountId ?? void 0
		}) : void 0
	};
}
/**
* Reports whether an action can carry a cross-context marker in outbound payloads.
*/
function shouldApplyCrossContextMarker(action) {
	return CONTEXT_MARKER_ACTIONS.has(action);
}
/**
* Applies text markers or a preferred rich presentation to a cross-context message.
*/
function applyCrossContextDecoration(params) {
	if (params.preferPresentation && params.decoration.presentationBuilder) return {
		message: params.message,
		presentation: params.decoration.presentationBuilder?.(params.message),
		usedPresentation: true
	};
	return {
		message: `${params.decoration.prefix}${params.message}${params.decoration.suffix}`,
		usedPresentation: false
	};
}
//#endregion
Object.defineProperty(exports, "CHANNEL_MESSAGE_ACTION_NAMES", {
	enumerable: true,
	get: function() {
		return CHANNEL_MESSAGE_ACTION_NAMES;
	}
});
Object.defineProperty(exports, "applyCrossContextDecoration", {
	enumerable: true,
	get: function() {
		return applyCrossContextDecoration;
	}
});
Object.defineProperty(exports, "buildCrossContextDecoration", {
	enumerable: true,
	get: function() {
		return buildCrossContextDecoration;
	}
});
Object.defineProperty(exports, "enforceCrossContextPolicy", {
	enumerable: true,
	get: function() {
		return enforceCrossContextPolicy;
	}
});
Object.defineProperty(exports, "enforceMessageActionAllowlist", {
	enumerable: true,
	get: function() {
		return enforceMessageActionAllowlist;
	}
});
Object.defineProperty(exports, "resolveAllowedMessageActions", {
	enumerable: true,
	get: function() {
		return resolveAllowedMessageActions;
	}
});
Object.defineProperty(exports, "resolveEffectiveMessageToolsConfig", {
	enumerable: true,
	get: function() {
		return resolveEffectiveMessageToolsConfig;
	}
});
Object.defineProperty(exports, "shouldApplyCrossContextMarker", {
	enumerable: true,
	get: function() {
		return shouldApplyCrossContextMarker;
	}
});
