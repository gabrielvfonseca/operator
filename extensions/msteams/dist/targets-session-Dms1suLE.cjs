const require_channel_config_helpers = require("./channel-config-helpers-B5LadJVY.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_channel_target_prefix = require("./channel-target-prefix-HjpWN9Zt.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_target_parsing_loaded = require("./target-parsing-loaded-D2VCi2lk.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_target_normalization = require("./target-normalization-CHxcE9Mj.cjs");
const require_target_errors = require("./target-errors-BFUCqxUb.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/targets-resolve-shared.ts
function buildWebChatDeliveryError() {
	return /* @__PURE__ */ new Error(`Delivering to WebChat is not supported via \`${require_command_format.formatCliCommand("openclaw agent")}\`; use WhatsApp/Telegram or run with --deliver=false.`);
}
/**
* Resolves a target through a channel plugin or the generic fallback path.
*/
function resolveOutboundTargetWithPlugin(params) {
	if (params.target.channel === "webchat") return {
		ok: false,
		error: buildWebChatDeliveryError()
	};
	const plugin = params.plugin;
	if (!plugin) return params.onMissingPlugin?.();
	const allowFromRaw = params.target.allowFrom ?? (params.target.cfg && plugin.config.resolveAllowFrom ? plugin.config.resolveAllowFrom({
		cfg: params.target.cfg,
		accountId: params.target.accountId ?? void 0
	}) : void 0);
	const allowFrom = allowFromRaw ? require_channel_config_helpers.mapAllowFromEntries(allowFromRaw) : void 0;
	const effectiveTo = params.target.to?.trim() || (params.target.cfg && plugin.config.resolveDefaultTo ? plugin.config.resolveDefaultTo({
		cfg: params.target.cfg,
		accountId: params.target.accountId ?? void 0
	}) : void 0);
	const targetPrefixError = require_channel_target_prefix.validateTargetProviderPrefix({
		channel: params.target.channel,
		to: effectiveTo
	});
	if (targetPrefixError) return {
		ok: false,
		error: targetPrefixError
	};
	const hint = plugin.messaging?.targetResolver?.hint;
	if (params.target.mode !== "heartbeat") {
		const reservedLiteral = require_target_normalization.resolveReservedTargetLiteral({
			raw: effectiveTo,
			plugin
		});
		if (reservedLiteral) return {
			ok: false,
			error: require_target_errors.reservedTargetLiteralError(plugin.meta.label ?? params.target.channel, reservedLiteral, hint)
		};
	}
	const resolveTarget = plugin.outbound?.resolveTarget;
	if (resolveTarget) return resolveTarget({
		cfg: params.target.cfg,
		to: effectiveTo,
		allowFrom,
		accountId: params.target.accountId ?? void 0,
		mode: params.target.mode ?? "explicit"
	});
	if (effectiveTo) return {
		ok: true,
		to: effectiveTo
	};
	return {
		ok: false,
		error: require_target_errors.missingTargetError(plugin.meta.label ?? params.target.channel, hint)
	};
}
//#endregion
//#region src/infra/outbound/targets-session.ts
function resolveParsedRouteTarget(params) {
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.channel);
	const rawTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.rawTarget);
	if (!channel || !rawTo) return null;
	const parsed = require_target_parsing_loaded.resolveExplicitDeliveryTargetCompat({
		channel,
		rawTarget: rawTo,
		fallbackThreadId: params.fallbackThreadId
	});
	const threadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalThreadValue)(parsed?.threadId ?? params.fallbackThreadId);
	return {
		channel,
		rawTo,
		to: parsed?.to ?? rawTo,
		...threadId != null ? { threadId } : {},
		chatType: parsed?.chatType
	};
}
/**
* Resolves the effective outbound target for a session-scoped delivery request.
*/
function resolveSessionDeliveryTarget(params) {
	const context = require_delivery_context_shared.deliveryContextFromSession(params.entry);
	const sessionLastChannel = context?.channel && require_message_channel_core.isDeliverableMessageChannel(context.channel) ? context.channel : void 0;
	const parsedSessionTarget = sessionLastChannel ? resolveParsedRouteTarget({
		channel: sessionLastChannel,
		rawTarget: context?.to,
		fallbackThreadId: context?.threadId
	}) : null;
	const hasTurnSourceChannel = params.turnSourceChannel != null;
	const parsedTurnSourceTarget = hasTurnSourceChannel && params.turnSourceChannel ? resolveParsedRouteTarget({
		channel: params.turnSourceChannel,
		rawTarget: params.turnSourceTo,
		fallbackThreadId: params.turnSourceThreadId
	}) : null;
	const hasTurnSourceThreadId = parsedTurnSourceTarget?.threadId != null;
	const lastChannel = hasTurnSourceChannel ? params.turnSourceChannel : sessionLastChannel;
	const lastTo = hasTurnSourceChannel ? parsedTurnSourceTarget?.to ?? params.turnSourceTo : parsedSessionTarget?.to ?? context?.to;
	const lastAccountId = hasTurnSourceChannel ? params.turnSourceAccountId : context?.accountId;
	const turnToMatchesSession = !params.turnSourceTo || !context?.to || params.turnSourceChannel === sessionLastChannel && require_channel_route.channelRouteTargetsShareConversation({
		left: parsedTurnSourceTarget,
		right: parsedSessionTarget
	});
	const lastThreadId = hasTurnSourceThreadId ? parsedTurnSourceTarget?.threadId : hasTurnSourceChannel && (params.turnSourceChannel !== sessionLastChannel || !turnToMatchesSession) ? void 0 : parsedSessionTarget?.threadId;
	const rawRequested = params.requestedChannel ?? "last";
	const requested = rawRequested === "last" ? "last" : require_message_channel_core.normalizeMessageChannel(rawRequested);
	const requestedChannel = requested === "last" ? "last" : requested && require_message_channel_core.isDeliverableMessageChannel(requested) ? requested : void 0;
	const rawExplicitTo = typeof params.explicitTo === "string" && params.explicitTo.trim() ? params.explicitTo.trim() : void 0;
	const explicitPrefixedChannel = requestedChannel === "last" ? require_channel_target_prefix.resolveTargetPrefixedChannel(rawExplicitTo) : void 0;
	let channel = explicitPrefixedChannel && require_message_channel_core.isDeliverableMessageChannel(explicitPrefixedChannel) ? explicitPrefixedChannel : requestedChannel === "last" ? lastChannel : requestedChannel;
	if (!channel && params.fallbackChannel && require_message_channel_core.isDeliverableMessageChannel(params.fallbackChannel)) channel = params.fallbackChannel;
	const parsedExplicitTarget = channel && rawExplicitTo ? require_target_parsing_loaded.resolveExplicitDeliveryTargetCompat({
		channel,
		rawTarget: rawExplicitTo,
		fallbackThreadId: params.explicitThreadId
	}) : null;
	const explicitTo = parsedExplicitTarget?.to ?? rawExplicitTo;
	const explicitThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalThreadValue)(parsedExplicitTarget?.threadId ?? params.explicitThreadId);
	const explicitThreadIdSource = explicitThreadId != null ? "explicit" : void 0;
	let to = explicitTo;
	if (!to && lastTo) {
		if (channel && channel === lastChannel) to = lastTo;
		else if (params.allowMismatchedLastTo) to = lastTo;
	}
	const mode = params.mode ?? (explicitTo ? "explicit" : "implicit");
	const accountId = channel && channel === lastChannel ? lastAccountId : void 0;
	const threadId = channel && channel === lastChannel ? mode === "heartbeat" ? hasTurnSourceThreadId ? params.turnSourceThreadId : void 0 : lastThreadId : void 0;
	return {
		channel,
		to,
		accountId,
		threadId: explicitThreadId ?? threadId,
		threadIdSource: explicitThreadIdSource ?? (threadId != null ? hasTurnSourceThreadId ? "turn-source" : "session" : void 0),
		mode,
		lastChannel,
		lastTo,
		lastAccountId,
		lastThreadId
	};
}
//#endregion
Object.defineProperty(exports, "resolveOutboundTargetWithPlugin", {
	enumerable: true,
	get: function() {
		return resolveOutboundTargetWithPlugin;
	}
});
Object.defineProperty(exports, "resolveSessionDeliveryTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionDeliveryTarget;
	}
});
