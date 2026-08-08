const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
const require_bindings = require("./bindings-CBZZdnb1.cjs");
const require_bindings$1 = require("./bindings-CyUjIovi.cjs");
const require_resolve_route = require("./resolve-route-DQGFdHA5.cjs");
const require_outbound_session = require("./outbound-session-ca-y9vpw.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_channel_resolution = require("./channel-resolution-BHNgrqI2.cjs");
const require_target_resolver = require("./target-resolver-Bn46QRpp.cjs");
const require_targets_session = require("./targets-session-Dms1suLE.cjs");
const require_targets = require("./targets-BfrPEAMP.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/infra/outbound/agent-delivery.ts
function rebaseOutboundSessionRoute(route, baseSessionKey) {
	if (route.baseSessionKey === baseSessionKey) return route;
	if (route.sessionKey === route.baseSessionKey) return {
		...route,
		sessionKey: baseSessionKey,
		baseSessionKey
	};
	const basePrefix = `${route.baseSessionKey}:`;
	if (!route.sessionKey.startsWith(basePrefix)) return null;
	return {
		...route,
		sessionKey: `${baseSessionKey}:${route.sessionKey.slice(basePrefix.length)}`,
		baseSessionKey
	};
}
function resolveAgentDeliveryPlan(params) {
	const requestedRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.requestedChannel) ?? "";
	const requestedChannel = (requestedRaw ? require_message_channel.normalizeMessageChannel(requestedRaw) : void 0) || "last";
	const explicitTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.explicitTo) ?? void 0;
	const normalizedTurnSource = params.turnSourceChannel ? require_message_channel.normalizeMessageChannel(params.turnSourceChannel) : void 0;
	const turnSourceChannel = normalizedTurnSource && require_message_channel.isDeliverableMessageChannel(normalizedTurnSource) ? normalizedTurnSource : void 0;
	const turnSourceTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.turnSourceTo) ?? void 0;
	const turnSourceAccountId = require_delivery_context_shared.normalizeAccountId(params.turnSourceAccountId);
	const turnSourceThreadId = params.turnSourceThreadId != null && params.turnSourceThreadId !== "" ? params.turnSourceThreadId : void 0;
	const baseDelivery = require_targets_session.resolveSessionDeliveryTarget({
		entry: params.sessionEntry,
		requestedChannel: requestedChannel === "webchat" ? "last" : requestedChannel,
		explicitTo,
		explicitThreadId: params.explicitThreadId,
		turnSourceChannel,
		turnSourceTo,
		turnSourceAccountId,
		turnSourceThreadId
	});
	const resolvedChannel = (() => {
		if (requestedChannel === "webchat") return require_message_channel_core.INTERNAL_MESSAGE_CHANNEL;
		if (requestedChannel === "last") {
			if (baseDelivery.channel && baseDelivery.channel !== "webchat") return baseDelivery.channel;
			return require_message_channel_core.INTERNAL_MESSAGE_CHANNEL;
		}
		if (require_message_channel.isGatewayMessageChannel(requestedChannel)) return requestedChannel;
		if (baseDelivery.channel && baseDelivery.channel !== "webchat") return baseDelivery.channel;
		return require_message_channel_core.INTERNAL_MESSAGE_CHANNEL;
	})();
	const deliveryTargetMode = explicitTo ? "explicit" : require_message_channel.isDeliverableMessageChannel(resolvedChannel) ? "implicit" : void 0;
	const resolvedAccountId = require_delivery_context_shared.normalizeAccountId(params.accountId) ?? (deliveryTargetMode === "implicit" ? baseDelivery.accountId : void 0);
	let resolvedTo = explicitTo;
	if (!resolvedTo && require_message_channel.isDeliverableMessageChannel(resolvedChannel) && resolvedChannel === baseDelivery.lastChannel) resolvedTo = baseDelivery.lastTo;
	return {
		baseDelivery,
		resolvedChannel,
		resolvedTo,
		resolvedAccountId,
		resolvedThreadId: baseDelivery.threadId,
		deliveryTargetMode
	};
}
async function resolveAgentDeliveryPlanWithSessionRoute(params) {
	const plan = resolveAgentDeliveryPlan(params);
	const { resolvedChannel } = plan;
	if (!params.wantsDelivery || !require_message_channel.isDeliverableMessageChannel(resolvedChannel)) return plan;
	const plugin = require_channel_resolution.resolveOutboundChannelPlugin({
		channel: resolvedChannel,
		cfg: params.cfg,
		allowBootstrap: true
	});
	if (!plugin) return plan;
	const hasPluginSessionRoute = Boolean(plugin?.messaging?.resolveOutboundSessionRoute);
	const hasPluginTargetResolver = Boolean(plugin?.messaging?.targetResolver);
	const hasPluginConcreteTargetResolver = Boolean(plugin?.messaging?.targetResolver?.resolveTarget);
	if (!hasPluginSessionRoute && !hasPluginTargetResolver && params.sessionRouteMode !== "allow-fallback") return plan;
	const resolvedAccountId = plan.resolvedAccountId ?? (params.sessionRouteMode === "allow-fallback" ? require_helpers.resolveChannelDefaultAccountId({
		plugin,
		cfg: params.cfg
	}) : void 0);
	const routedPlan = resolvedAccountId === plan.resolvedAccountId ? plan : {
		...plan,
		resolvedAccountId
	};
	const normalizedTarget = require_targets.resolveOutboundTarget({
		channel: resolvedChannel,
		to: routedPlan.resolvedTo,
		cfg: params.cfg,
		accountId: routedPlan.resolvedAccountId,
		mode: routedPlan.deliveryTargetMode ?? "explicit"
	});
	const targetInput = normalizedTarget.ok ? normalizedTarget.to : routedPlan.resolvedTo;
	if (!targetInput) return normalizedTarget.ok ? routedPlan : {
		...routedPlan,
		targetResolutionError: normalizedTarget.error
	};
	const resolvedTarget = await require_target_resolver.resolveChannelTarget({
		cfg: params.cfg,
		channel: resolvedChannel,
		input: targetInput,
		accountId: routedPlan.resolvedAccountId,
		unknownTargetMode: hasPluginConcreteTargetResolver ? "error" : "normalized",
		plugin
	});
	if (!resolvedTarget.ok) return {
		...routedPlan,
		targetResolutionError: resolvedTarget.error
	};
	if (!normalizedTarget.ok && resolvedTarget.target.resolutionSource === "normalized") return {
		...routedPlan,
		targetResolutionError: normalizedTarget.error
	};
	const sessionRouteTarget = resolvedTarget.target.to;
	const resolvedSessionRouteTarget = !normalizedTarget.ok || normalizedTarget.to !== resolvedTarget.target.to || resolvedTarget.target.resolutionSource === "directory" ? resolvedTarget.target : void 0;
	const resolvedPlan = {
		...routedPlan,
		resolvedTo: sessionRouteTarget
	};
	if (!hasPluginSessionRoute && params.sessionRouteMode !== "allow-fallback") return resolvedPlan;
	const explicitThreadId = params.explicitThreadId != null && params.explicitThreadId !== "" ? params.explicitThreadId : void 0;
	const route = await (async () => {
		try {
			return await require_outbound_session.resolveOutboundSessionRoute({
				cfg: params.cfg,
				channel: resolvedChannel,
				plugin,
				agentId: params.agentId,
				accountId: routedPlan.resolvedAccountId,
				target: sessionRouteTarget,
				...resolvedSessionRouteTarget ? { resolvedTarget: resolvedSessionRouteTarget } : {},
				currentSessionKey: params.currentSessionKey,
				threadId: routedPlan.deliveryTargetMode === "explicit" ? explicitThreadId : resolvedPlan.resolvedThreadId
			});
		} catch {
			return null;
		}
	})();
	const globalDmScope = params.cfg.session?.dmScope ?? "main";
	const bindingRoute = route?.recipientSessionExact === true && route.chatType === "direct" && route.peer.kind === "direct" ? require_resolve_route.resolveAgentRoute({
		cfg: params.cfg,
		channel: resolvedChannel,
		accountId: routedPlan.resolvedAccountId,
		peer: route.peer
	}) : null;
	const bindingAwareRoute = route && bindingRoute?.dmScope !== void 0 && bindingRoute.dmScope !== globalDmScope && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(bindingRoute.agentId) === (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) ? rebaseOutboundSessionRoute(route, bindingRoute.sessionKey) : route;
	const knownNonExactRoute = params.sessionRouteMode === "allow-fallback" && (bindingAwareRoute?.recipientSessionExact === false || bindingAwareRoute?.recipientSessionExact === "direct-alias");
	const canonicalMainSessionKey = require_session_key.buildAgentMainSessionKey({
		agentId: params.agentId,
		mainKey: params.cfg.session?.mainKey
	});
	const usesCanonicalMainSession = bindingAwareRoute?.recipientSessionExact === "direct-alias" && bindingAwareRoute.chatType === "direct" && bindingAwareRoute.sessionKey === bindingAwareRoute.baseSessionKey && bindingAwareRoute.sessionKey === canonicalMainSessionKey && globalDmScope === "main" && !require_bindings$1.listRouteBindings(params.cfg).some((binding) => binding.session?.dmScope !== void 0 && binding.session.dmScope !== "main" && require_bindings.normalizeRouteBindingChannelId(binding.match.channel) === resolvedChannel);
	const usesIsolatedDeliveryIdentity = bindingAwareRoute?.recipientSessionExact === "delivery-identity" && bindingAwareRoute.baseSessionKey !== canonicalMainSessionKey && bindingAwareRoute.baseSessionKey.startsWith(`agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:${resolvedChannel}:`) && (bindingAwareRoute.sessionKey === bindingAwareRoute.baseSessionKey || bindingAwareRoute.sessionKey.startsWith(`${bindingAwareRoute.baseSessionKey}:`));
	const selectedRoute = bindingAwareRoute && (bindingAwareRoute.recipientSessionExact === "delivery-identity" ? usesIsolatedDeliveryIdentity : !knownNonExactRoute || usesCanonicalMainSession) ? bindingAwareRoute : null;
	if (!selectedRoute) {
		if (resolvedSessionRouteTarget) return {
			...resolvedPlan,
			resolvedTo: resolvedSessionRouteTarget.to,
			resolvedThreadId: resolvedPlan.deliveryTargetMode === "explicit" ? explicitThreadId : resolvedPlan.resolvedThreadId
		};
		return resolvedPlan;
	}
	return {
		...resolvedPlan,
		resolvedSessionKey: selectedRoute.sessionKey,
		resolvedTo: hasPluginSessionRoute ? selectedRoute.to : resolvedSessionRouteTarget?.to ?? sessionRouteTarget,
		resolvedThreadId: selectedRoute.threadId ?? (resolvedPlan.deliveryTargetMode === "explicit" ? explicitThreadId : resolvedPlan.resolvedThreadId)
	};
}
/** Resolves an explicit recipient into its canonical or stable provider-owned session. */
async function resolveAgentExplicitRecipientSession(params) {
	const plan = await resolveAgentDeliveryPlanWithSessionRoute({
		cfg: params.cfg,
		agentId: params.agentId,
		requestedChannel: params.channel,
		explicitTo: params.to,
		explicitThreadId: params.threadId,
		accountId: params.accountId,
		wantsDelivery: true,
		sessionRouteMode: "allow-fallback"
	});
	if (!plan.resolvedSessionKey && !plan.targetResolutionError) return { error: /* @__PURE__ */ new Error(`Unable to resolve a session route for channel "${params.channel}"`) };
	return {
		sessionKey: plan.resolvedSessionKey,
		channel: plan.resolvedChannel,
		to: plan.resolvedTo,
		accountId: plan.resolvedAccountId,
		threadId: plan.resolvedThreadId,
		error: plan.targetResolutionError
	};
}
function resolveAgentOutboundTarget(params) {
	const targetMode = params.targetMode ?? params.plan.deliveryTargetMode ?? (params.plan.resolvedTo ? "explicit" : "implicit");
	if (params.plan.targetResolutionError) return {
		resolvedTarget: {
			ok: false,
			error: params.plan.targetResolutionError
		},
		resolvedTo: void 0,
		targetMode
	};
	if (!require_message_channel.isDeliverableMessageChannel(params.plan.resolvedChannel)) return {
		resolvedTarget: null,
		resolvedTo: params.plan.resolvedTo,
		targetMode
	};
	if (params.validateExplicitTarget !== true && params.plan.resolvedTo) return {
		resolvedTarget: null,
		resolvedTo: params.plan.resolvedTo,
		targetMode
	};
	const resolvedTarget = require_targets.resolveOutboundTarget({
		channel: params.plan.resolvedChannel,
		to: params.plan.resolvedTo,
		cfg: params.cfg,
		accountId: params.plan.resolvedAccountId,
		mode: targetMode
	});
	return {
		resolvedTarget,
		resolvedTo: resolvedTarget.ok ? resolvedTarget.to : params.plan.resolvedTo,
		targetMode
	};
}
//#endregion
Object.defineProperty(exports, "resolveAgentDeliveryPlanWithSessionRoute", {
	enumerable: true,
	get: function() {
		return resolveAgentDeliveryPlanWithSessionRoute;
	}
});
Object.defineProperty(exports, "resolveAgentExplicitRecipientSession", {
	enumerable: true,
	get: function() {
		return resolveAgentExplicitRecipientSession;
	}
});
Object.defineProperty(exports, "resolveAgentOutboundTarget", {
	enumerable: true,
	get: function() {
		return resolveAgentOutboundTarget;
	}
});
