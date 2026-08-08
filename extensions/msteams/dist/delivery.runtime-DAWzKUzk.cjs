require("./rolldown-runtime-u92d-OFm.cjs");
require("./plugins-_-82JYfc.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_runtime$1 = require("./runtime-CIO0BRex.cjs");
const require_normalize_reply = require("./normalize-reply-DKfUboQ9.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_reply_prefix = require("./reply-prefix-uHrwsdsW.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_reply_payload = require("./reply-payload-B-1jXr3E.cjs");
const require_payloads = require("./payloads-MFaWqn01.cjs");
const require_reply_payloads = require("./reply-payloads-Bn46m3tA.cjs");
const require_reply_payloads_dedupe = require("./reply-payloads-dedupe-BL0WFVBj.cjs");
const require_run_termination = require("./run-termination-CDRVMWOn.cjs");
const require_channel_selection = require("./channel-selection-SjphkB8p.cjs");
const require_lanes = require("./lanes-CNGMiDO4.cjs");
const require_reply_media_paths_runtime = require("./reply-media-paths.runtime-CjPT_dnR.cjs");
require("./reply-payloads-dedupe.runtime-Cn2FHNhl.cjs");
const require_outbound_send_deps = require("./outbound-send-deps-Bux5I_gX.cjs");
const require_agent_delivery = require("./agent-delivery-Bh0S5JaY.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/infra/outbound/envelope.ts
const isOutboundPayloadJson = (payload) => "mediaUrl" in payload;
/** Builds the outbound result envelope, flattening plain delivery-only results by default. */
function buildOutboundResultEnvelope(params) {
	const hasPayloads = params.payloads !== void 0;
	const payloads = params.payloads === void 0 ? void 0 : params.payloads.length === 0 ? [] : isOutboundPayloadJson((0, _gabrielvfonseca_normalization_core.expectDefined)(params.payloads[0], "payloads entry at 0")) ? [...params.payloads] : require_payloads.normalizeOutboundPayloadsForJson(params.payloads);
	if (params.flattenDelivery !== false && params.delivery && !params.meta && !hasPayloads) return params.delivery;
	return {
		...hasPayloads ? { payloads } : {},
		...params.meta ? { meta: params.meta } : {},
		...params.delivery ? { delivery: params.delivery } : {}
	};
}
//#endregion
//#region src/agents/command/delivery.ts
/**
* Normalizes and delivers agent command results to outbound channels.
*/
function createRestartOnlyAbortSignal(source) {
	if (!source) return { dispose: () => {} };
	const controller = new AbortController();
	const onAbort = () => {
		if (require_run_termination.isAgentRunRestartAbortReason(source.reason)) controller.abort(source.reason);
	};
	if (source.aborted) onAbort();
	else source.addEventListener("abort", onAbort, { once: true });
	return {
		signal: controller.signal,
		dispose: () => source.removeEventListener("abort", onAbort)
	};
}
const NESTED_LOG_PREFIX = "[agent:nested]";
function normalizeDeliverySessionId(value) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : void 0;
}
function isFreshDeliverySessionMatch(freshSessionEntry, expectedSessionId) {
	const normalizedExpected = normalizeDeliverySessionId(expectedSessionId);
	return Boolean(normalizedExpected && freshSessionEntry.sessionId === normalizedExpected);
}
function formatNestedLogPrefix(opts, sessionKey) {
	const parts = [NESTED_LOG_PREFIX];
	const session = sessionKey ?? opts.sessionKey ?? opts.sessionId;
	if (session) parts.push(`session=${session}`);
	if (opts.runId) parts.push(`run=${opts.runId}`);
	const channel = opts.messageChannel ?? opts.channel;
	if (channel) parts.push(`channel=${channel}`);
	if (opts.to) parts.push(`to=${opts.to}`);
	if (opts.accountId) parts.push(`account=${opts.accountId}`);
	return parts.join(" ");
}
function logNestedOutput(runtime, opts, output, sessionKey) {
	const prefix = formatNestedLogPrefix(opts, sessionKey);
	for (const line of output.split(/\r?\n/)) {
		if (!line) continue;
		runtime.log(`${prefix} ${line}`);
	}
}
function mergeResultMetaOverrides(meta, overrides) {
	if (!overrides) return meta;
	return {
		...meta,
		...overrides
	};
}
function hasNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
function hasNonEmptyStringArray(value) {
	return Array.isArray(value) && value.some(hasNonEmptyString);
}
function hasNonEmptyArray(value) {
	return Array.isArray(value) && value.length > 0;
}
function buildDeliveryResult(params) {
	return {
		payloads: params.payloads,
		meta: params.meta,
		...params.result.didSendViaMessagingTool === true ? { didSendViaMessagingTool: true } : {},
		...hasNonEmptyStringArray(params.result.messagingToolSentTexts) ? { messagingToolSentTexts: params.result.messagingToolSentTexts } : {},
		...hasNonEmptyStringArray(params.result.messagingToolSentMediaUrls) ? { messagingToolSentMediaUrls: params.result.messagingToolSentMediaUrls } : {},
		...hasNonEmptyArray(params.result.messagingToolSentTargets) ? { messagingToolSentTargets: params.result.messagingToolSentTargets } : {},
		...params.deliverySucceeded !== void 0 ? { deliverySucceeded: params.deliverySucceeded } : {},
		...params.deliveryStatus ? { deliveryStatus: params.deliveryStatus } : {}
	};
}
function deliveryStatusFromDurableSend(send) {
	const payloadOutcomes = require_runtime$1.serializeDurableMessagePayloadOutcomes(send.payloadOutcomes, { includeHookEffect: true });
	switch (send.status) {
		case "sent": return {
			requested: true,
			attempted: true,
			status: "sent",
			succeeded: true,
			resultCount: send.results.length,
			...payloadOutcomes ? { payloadOutcomes } : {}
		};
		case "suppressed": return {
			requested: true,
			attempted: true,
			status: "suppressed",
			succeeded: true,
			reason: send.reason,
			resultCount: 0,
			...payloadOutcomes ? { payloadOutcomes } : {}
		};
		case "partial_failed": return {
			requested: true,
			attempted: true,
			status: "partial_failed",
			succeeded: "partial",
			error: true,
			errorMessage: require_errors.formatErrorMessage(send.error),
			resultCount: send.results.length,
			sentBeforeError: true,
			...payloadOutcomes ? { payloadOutcomes } : {}
		};
		case "failed": return {
			requested: true,
			attempted: true,
			status: "failed",
			succeeded: false,
			error: true,
			errorMessage: require_errors.formatErrorMessage(send.error),
			...send.stage ? { reason: send.stage } : {},
			...payloadOutcomes ? { payloadOutcomes } : {}
		};
	}
	return send;
}
function preDeliveryFailureStatus(reason) {
	return {
		requested: true,
		attempted: false,
		status: "failed",
		succeeded: false,
		error: true,
		reason
	};
}
function noVisiblePayloadStatus() {
	return {
		requested: true,
		attempted: false,
		status: "suppressed",
		succeeded: true,
		reason: "no_visible_payload",
		resultCount: 0
	};
}
async function normalizeReplyMediaPathsForDelivery(params) {
	if (params.payloads.length === 0) return { payloads: params.payloads };
	const agentId = params.outboundSession?.agentId ?? require_agent_scope.resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: params.cfg
	});
	const workspaceDir = agentId ? require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId) : void 0;
	if (!workspaceDir) return { payloads: params.payloads };
	const normalizeMediaPaths = require_reply_media_paths_runtime.createReplyMediaPathNormalizer({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		agentId,
		workspaceDir,
		messageProvider: params.deliveryChannel,
		accountId: params.accountId
	});
	const result = [];
	for (const payload of params.payloads) result.push(await normalizeMediaPaths(payload));
	return {
		payloads: result,
		normalizeMediaPaths
	};
}
async function normalizeSentMediaUrlsForDelivery(params) {
	const normalizedUrls = [];
	const seen = /* @__PURE__ */ new Set();
	for (const raw of params.sentMediaUrls) {
		const trimmed = raw.trim();
		if (!trimmed) continue;
		if (!seen.has(trimmed)) {
			seen.add(trimmed);
			normalizedUrls.push(trimmed);
		}
		if (!params.normalizeMediaPaths) continue;
		try {
			const normalized = await params.normalizeMediaPaths({
				mediaUrl: trimmed,
				mediaUrls: [trimmed]
			});
			for (const mediaUrl of [normalized.mediaUrl, ...normalized.mediaUrls ?? []]) {
				const candidate = mediaUrl?.trim();
				if (!candidate || seen.has(candidate)) continue;
				seen.add(candidate);
				normalizedUrls.push(candidate);
			}
		} catch {}
	}
	return normalizedUrls;
}
const UNRESOLVED_RESPONSE_PREFIX_VAR_PATTERN = /\{[a-zA-Z][a-zA-Z0-9.]*\}/;
async function filterAlreadyDeliveredReplyPayloads(params) {
	const sentTexts = params.result.messagingToolSentTexts ?? [];
	const sentMediaUrls = params.result.messagingToolSentMediaUrls ?? [];
	const implicitToolAccountId = params.sourceAccountId ?? params.defaultAccountId;
	const sentTargets = (params.result.messagingToolSentTargets ?? []).flatMap((target) => {
		if (target.accountId || !params.accountId) return [target];
		return implicitToolAccountId ? [{
			...target,
			accountId: implicitToolAccountId
		}] : [];
	});
	if (sentTexts.length === 0 && sentMediaUrls.length === 0 && sentTargets.length === 0) return params.payloads;
	const decision = require_reply_payloads_dedupe.resolveMessagingToolPayloadDedupe({
		config: params.cfg,
		messageProvider: params.deliveryChannel,
		messagingToolSentTargets: sentTargets,
		originatingTo: params.deliveryTarget,
		originatingThreadId: params.threadId,
		accountId: params.accountId
	});
	if (!decision.matchingRoute) return params.payloads;
	const routeSentMediaUrls = decision.useGlobalSentMediaUrlEvidenceFallback ? sentMediaUrls : decision.routeSentMediaUrls;
	const rawRouteSentTexts = decision.useGlobalSentTextEvidenceFallback ? sentTexts : decision.routeSentTexts;
	const routeSentTexts = params.normalizeSentTexts?.(rawRouteSentTexts) ?? rawRouteSentTexts;
	const exactRouteSentTexts = new Set(routeSentTexts.filter((text) => Boolean(text.trim())));
	const normalizedSentMediaUrls = await normalizeSentMediaUrlsForDelivery({
		sentMediaUrls: routeSentMediaUrls,
		normalizeMediaPaths: params.normalizeMediaPaths
	});
	const mediaFiltered = require_reply_payloads_dedupe.filterMessagingToolMediaDuplicates({
		payloads: params.payloads,
		sentMediaUrls: normalizedSentMediaUrls
	});
	const filteredPayloads = [];
	for (const candidate of mediaFiltered) {
		if (require_reply_payloads_dedupe.hasEnabledDeliveryOperation(candidate)) {
			filteredPayloads.push(candidate);
			continue;
		}
		const effectiveCandidateText = require_reply_payloads.formatBtwTextForExternalDelivery(candidate) ?? candidate.text ?? "";
		if (!effectiveCandidateText.trim() || !exactRouteSentTexts.has(effectiveCandidateText)) {
			filteredPayloads.push(candidate);
			continue;
		}
		const withoutDuplicateText = require_reply_payload.copyReplyPayloadMetadata(candidate, {
			...candidate,
			text: void 0
		});
		if (require_payload.hasReplyPayloadContent(withoutDuplicateText, {
			trimText: true,
			extraContent: withoutDuplicateText.location != null
		})) filteredPayloads.push(withoutDuplicateText);
	}
	return filteredPayloads;
}
/** Normalizes reply payloads and media paths before delivery. */
function normalizeAgentCommandReplyPayloads(params) {
	const payloads = params.payloads ?? [];
	if (payloads.length === 0) return [];
	const channel = params.deliveryChannel && !require_message_channel.isInternalMessageChannel(params.deliveryChannel) ? require_registry.normalizeChannelId(params.deliveryChannel) ?? params.deliveryChannel : void 0;
	if (!channel) return payloads;
	const applyChannelTransforms = params.applyChannelTransforms ?? true;
	const deliveryPlugin = applyChannelTransforms ? require_registry.getChannelPlugin(channel) : void 0;
	const sessionKey = params.outboundSession?.key ?? params.opts.sessionKey;
	const agentId = params.outboundSession?.agentId ?? require_agent_scope.resolveSessionAgentId({
		sessionKey,
		config: params.cfg
	});
	const replyPrefix = require_reply_prefix.createReplyPrefixContext({
		cfg: params.cfg,
		agentId,
		channel,
		accountId: params.accountId
	});
	const modelUsed = params.result.meta.agentMeta?.model;
	const providerUsed = params.result.meta.agentMeta?.provider;
	if (params.includeRunModelContext !== false && providerUsed && modelUsed) replyPrefix.onModelSelected({
		provider: providerUsed,
		model: modelUsed,
		thinkLevel: void 0
	});
	const responsePrefixContext = replyPrefix.responsePrefixContextProvider();
	const resolvedResponsePrefix = require_normalize_reply.resolveResponsePrefixTemplate(replyPrefix.responsePrefix, responsePrefixContext);
	const responsePrefix = params.includeRunModelContext === false && resolvedResponsePrefix && UNRESOLVED_RESPONSE_PREFIX_VAR_PATTERN.test(resolvedResponsePrefix) ? void 0 : replyPrefix.responsePrefix;
	const transformReplyPayload = deliveryPlugin?.messaging?.transformReplyPayload ? (payload) => deliveryPlugin.messaging?.transformReplyPayload?.({
		payload,
		cfg: params.cfg,
		accountId: params.accountId
	}) ?? payload : void 0;
	const normalizedPayloads = [];
	for (const payload of payloads) {
		const normalized = require_normalize_reply.normalizeReplyPayload(payload, {
			responsePrefix,
			applyChannelTransforms,
			responsePrefixContext,
			transformReplyPayload
		});
		if (normalized) normalizedPayloads.push(normalized);
	}
	return normalizedPayloads;
}
/** Delivers an agent command result or records why delivery was skipped. */
async function deliverAgentCommandResult(params) {
	params.assertDeliveryCurrent?.();
	const { cfg, deps, runtime, opts, outboundSession, sessionEntry, payloads, result } = params;
	const effectiveSessionKey = outboundSession?.key ?? opts.sessionKey;
	const deliveryAgentId = outboundSession?.agentId ?? require_agent_scope.resolveSessionAgentId({
		sessionKey: effectiveSessionKey,
		config: cfg
	}) ?? require_agent_scope_config.resolveDefaultAgentId(cfg);
	const deliver = opts.deliver === true;
	const bestEffortDeliver = opts.bestEffortDeliver === true;
	const turnSourceChannel = opts.runContext?.messageChannel ?? opts.messageChannel;
	const turnSourceTo = opts.runContext?.currentChannelId ?? opts.to;
	const turnSourceAccountId = opts.runContext?.accountId ?? opts.accountId;
	const turnSourceThreadId = opts.runContext?.currentThreadTs ?? opts.threadId;
	const explicitChannelHint = (opts.replyChannel ?? opts.channel)?.trim();
	const resolveDeliveryRouting = async (candidateSessionEntry) => {
		const deliveryPlan = await require_agent_delivery.resolveAgentDeliveryPlanWithSessionRoute({
			cfg,
			agentId: deliveryAgentId,
			currentSessionKey: effectiveSessionKey,
			sessionEntry: candidateSessionEntry,
			requestedChannel: opts.replyChannel ?? opts.channel,
			explicitTo: opts.replyTo ?? opts.to,
			explicitThreadId: opts.threadId,
			accountId: opts.replyAccountId ?? opts.accountId,
			wantsDelivery: deliver,
			turnSourceChannel,
			turnSourceTo,
			turnSourceAccountId,
			turnSourceThreadId
		});
		params.assertDeliveryCurrent?.();
		let deliveryChannel = deliveryPlan.resolvedChannel;
		if (deliver && require_message_channel.isInternalMessageChannel(deliveryChannel) && !explicitChannelHint) try {
			const selection = await require_channel_selection.resolveMessageChannelSelection({ cfg });
			params.assertDeliveryCurrent?.();
			deliveryChannel = selection.channel;
		} catch {}
		const effectiveDeliveryPlan = deliveryChannel === deliveryPlan.resolvedChannel ? deliveryPlan : {
			...deliveryPlan,
			resolvedChannel: deliveryChannel
		};
		const deliveryPlugin = deliver && !require_message_channel.isInternalMessageChannel(deliveryChannel) ? require_registry.getChannelPlugin(require_registry.normalizeChannelId(deliveryChannel) ?? deliveryChannel) : void 0;
		const isDeliveryChannelKnown = require_message_channel.isInternalMessageChannel(deliveryChannel) || Boolean(deliveryPlugin);
		const targetMode = opts.deliveryTargetMode ?? effectiveDeliveryPlan.deliveryTargetMode ?? (opts.to ? "explicit" : "implicit");
		const defaultAccountId = !effectiveDeliveryPlan.resolvedAccountId && deliveryPlugin?.config?.listAccountIds ? require_helpers.resolveChannelDefaultAccountId({
			plugin: deliveryPlugin,
			cfg
		}) : void 0;
		const resolvedAccountId = effectiveDeliveryPlan.resolvedAccountId ?? defaultAccountId;
		const resolvedDeliveryPlan = resolvedAccountId === effectiveDeliveryPlan.resolvedAccountId ? effectiveDeliveryPlan : {
			...effectiveDeliveryPlan,
			resolvedAccountId
		};
		const resolved = deliver && isDeliveryChannelKnown && deliveryChannel ? require_agent_delivery.resolveAgentOutboundTarget({
			cfg,
			plan: resolvedDeliveryPlan,
			targetMode,
			validateExplicitTarget: true
		}) : {
			resolvedTarget: null,
			resolvedTo: effectiveDeliveryPlan.resolvedTo,
			targetMode
		};
		const resolvedThreadId = deliveryPlan.resolvedThreadId ?? opts.threadId;
		const replyTransport = deliveryPlugin?.threading?.resolveReplyTransport?.({
			cfg,
			accountId: resolvedAccountId,
			threadId: resolvedThreadId
		}) ?? null;
		return {
			deliveryPlan,
			deliveryChannel,
			effectiveDeliveryPlan: resolvedDeliveryPlan,
			deliveryPlugin,
			isDeliveryChannelKnown,
			targetMode,
			defaultAccountId,
			resolvedAccountId,
			resolved,
			resolvedTarget: resolved.resolvedTarget,
			deliveryTarget: resolved.resolvedTo,
			resolvedThreadId,
			resolvedReplyToId: replyTransport?.replyToId ?? void 0,
			resolvedThreadTarget: replyTransport && Object.hasOwn(replyTransport, "threadId") ? replyTransport.threadId ?? null : resolvedThreadId ?? null
		};
	};
	const deliveryRoutingFailureReason = (route) => {
		if (!deliver) return;
		if (require_message_channel.isInternalMessageChannel(route.deliveryChannel)) return "channel_resolved_to_internal";
		if (!route.isDeliveryChannelKnown) return "unknown_channel";
		if (route.resolvedTarget && !route.resolvedTarget.ok) return "invalid_delivery_target";
		if (!route.deliveryTarget) return "no_delivery_target";
	};
	const isRetryableFreshSessionRoutingFailure = (route) => {
		const reason = deliveryRoutingFailureReason(route);
		if (!reason) return false;
		if (reason === "unknown_channel") return false;
		return true;
	};
	let deliveryRouting = await resolveDeliveryRouting(sessionEntry);
	params.assertDeliveryCurrent?.();
	if (isRetryableFreshSessionRoutingFailure(deliveryRouting)) {
		const freshSessionEntry = await params.resolveFreshSessionEntryForDelivery?.();
		params.assertDeliveryCurrent?.();
		const expectedFreshSessionId = params.expectedSessionIdForFreshDelivery ?? sessionEntry?.sessionId;
		if (freshSessionEntry && freshSessionEntry !== sessionEntry && isFreshDeliverySessionMatch(freshSessionEntry, expectedFreshSessionId)) {
			const freshRouting = await resolveDeliveryRouting(freshSessionEntry);
			params.assertDeliveryCurrent?.();
			if (!deliveryRoutingFailureReason(freshRouting)) {
				if (!opts.json) runtime.log(`[delivery] refreshed session routing before final delivery (session=${effectiveSessionKey ?? "unknown"} channel=${freshRouting.deliveryChannel})`);
				deliveryRouting = freshRouting;
			}
		}
	}
	const { deliveryChannel, isDeliveryChannelKnown, defaultAccountId, resolvedAccountId, resolvedTarget, deliveryTarget, resolvedReplyToId, resolvedThreadTarget } = deliveryRouting;
	let deliveryLoggedError = false;
	const logDeliveryError = (err) => {
		deliveryLoggedError = true;
		const message = `Delivery failed (${deliveryChannel}${deliveryTarget ? ` to ${deliveryTarget}` : ""}): ${String(err)}`;
		runtime.error?.(message);
		if (!runtime.error) runtime.log(message);
	};
	let strictPreDeliveryError;
	let deliveryStatus;
	const handlePreDeliveryError = (err, reason) => {
		deliveryStatus = preDeliveryFailureStatus(reason);
		if (!bestEffortDeliver) {
			if (opts.json) {
				strictPreDeliveryError = err;
				return;
			}
			throw err;
		}
		logDeliveryError(err);
	};
	if (deliver) {
		if (require_message_channel.isInternalMessageChannel(deliveryChannel)) handlePreDeliveryError(/* @__PURE__ */ new Error("delivery channel is required: pass --channel/--reply-channel or use a main session with a previous channel"), "channel_resolved_to_internal");
		else if (!isDeliveryChannelKnown) handlePreDeliveryError(/* @__PURE__ */ new Error(`Unknown channel: ${deliveryChannel}`), "unknown_channel");
		else if (resolvedTarget && !resolvedTarget.ok) handlePreDeliveryError(resolvedTarget.error, "invalid_delivery_target");
	}
	const canonicalReplyPayloads = require_payloads.projectOutboundPayloadPlanForDelivery(require_payloads.createOutboundPayloadPlan(normalizeAgentCommandReplyPayloads({
		cfg,
		opts,
		outboundSession,
		payloads,
		result,
		deliveryChannel,
		accountId: resolvedAccountId,
		applyChannelTransforms: deliver
	})));
	const shouldFilterDeliveredPayloads = deliver && !deliveryStatus && Boolean(deliveryTarget) && !require_message_channel.isInternalMessageChannel(deliveryChannel);
	const normalizeSentTexts = (sentTexts) => normalizeAgentCommandReplyPayloads({
		cfg,
		opts,
		outboundSession,
		payloads: sentTexts.map((text) => ({ text })),
		result,
		deliveryChannel,
		accountId: resolvedAccountId,
		applyChannelTransforms: deliver,
		includeRunModelContext: false
	}).flatMap((payload) => payload.text?.trim() ? [payload.text] : []);
	const filterDeliveredPayloads = (replyPayloads, normalizeMediaPaths) => {
		if (!shouldFilterDeliveredPayloads || !deliveryTarget) return Promise.resolve(replyPayloads);
		return filterAlreadyDeliveredReplyPayloads({
			cfg,
			payloads: replyPayloads,
			result,
			deliveryChannel,
			deliveryTarget,
			accountId: resolvedAccountId,
			sourceAccountId: turnSourceAccountId,
			defaultAccountId,
			threadId: resolvedThreadTarget ?? resolvedReplyToId ?? void 0,
			normalizeMediaPaths,
			normalizeSentTexts
		});
	};
	const rawFilteredReplyPayloads = await filterDeliveredPayloads(canonicalReplyPayloads);
	const mediaNormalization = deliver && !deliveryStatus && !require_message_channel.isInternalMessageChannel(deliveryChannel) ? await normalizeReplyMediaPathsForDelivery({
		cfg,
		payloads: rawFilteredReplyPayloads,
		sessionKey: effectiveSessionKey,
		outboundSession,
		deliveryChannel,
		accountId: resolvedAccountId
	}) : { payloads: rawFilteredReplyPayloads };
	const mediaNormalizedReplyPayloads = await filterDeliveredPayloads(mediaNormalization.payloads, mediaNormalization.normalizeMediaPaths);
	params.assertDeliveryCurrent?.();
	const outboundPayloadPlan = require_payloads.createOutboundPayloadPlan(mediaNormalizedReplyPayloads);
	const normalizedPayloads = require_payloads.projectOutboundPayloadPlanForJson(outboundPayloadPlan);
	const resultMeta = mergeResultMetaOverrides(result.meta, opts.resultMetaOverrides);
	const captureDeliveryResult = (deliveryResult) => {
		params.onDeliveryResult?.(deliveryResult);
		return deliveryResult;
	};
	const emitJsonEnvelope = (status) => {
		if (!opts.json) return;
		require_runtime.writeRuntimeJson(runtime, {
			...buildOutboundResultEnvelope({
				payloads: normalizedPayloads,
				meta: resultMeta
			}),
			...status ? { deliveryStatus: status } : {}
		});
	};
	if (strictPreDeliveryError) {
		emitJsonEnvelope(deliveryStatus);
		captureDeliveryResult(buildDeliveryResult({
			payloads: normalizedPayloads,
			meta: resultMeta,
			result,
			deliveryStatus
		}));
		throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(strictPreDeliveryError, "Non-Error thrown");
	}
	const deliveryPayloads = require_payloads.projectOutboundPayloadPlanForOutbound(outboundPayloadPlan);
	if (deliveryPayloads.length === 0) {
		deliveryStatus = deliver ? deliveryStatus ?? noVisiblePayloadStatus() : void 0;
		const deliverySucceeded = deliveryStatus?.succeeded === true ? true : void 0;
		emitJsonEnvelope(deliveryStatus);
		return captureDeliveryResult(buildDeliveryResult({
			payloads: normalizedPayloads,
			meta: resultMeta,
			result,
			deliverySucceeded,
			deliveryStatus
		}));
	}
	let deliverySucceeded = false;
	const logPayload = (payload) => {
		if (opts.json) return;
		const output = require_payloads.formatOutboundPayloadLog(payload);
		if (!output) return;
		if (require_lanes.isNestedAgentLane(opts.lane)) {
			logNestedOutput(runtime, opts, output, effectiveSessionKey);
			return;
		}
		runtime.log(output);
	};
	if (!deliver) {
		for (const payload of deliveryPayloads) logPayload(payload);
		emitJsonEnvelope();
		return captureDeliveryResult(buildDeliveryResult({
			payloads: normalizedPayloads,
			meta: resultMeta,
			result
		}));
	}
	if (deliver && deliveryChannel && !require_message_channel.isInternalMessageChannel(deliveryChannel)) {
		if (deliveryTarget && !deliveryStatus) {
			params.assertDeliveryCurrent?.();
			const restartAbort = createRestartOnlyAbortSignal(opts.abortSignal);
			let send;
			try {
				send = await require_runtime$1.sendDurableMessageBatch({
					cfg,
					channel: deliveryChannel,
					to: deliveryTarget,
					accountId: resolvedAccountId,
					payloads: deliveryPayloads,
					session: outboundSession,
					replyToId: resolvedReplyToId ?? null,
					threadId: resolvedThreadTarget ?? null,
					bestEffort: bestEffortDeliver,
					durability: bestEffortDeliver ? "best_effort" : "required",
					signal: restartAbort.signal,
					onDeliveryIntent: restartAbort.dispose,
					onError: logDeliveryError,
					onPayload: logPayload,
					deps: require_outbound_send_deps.createOutboundSendDeps(deps)
				});
			} finally {
				restartAbort.dispose();
			}
			if (restartAbort.signal?.aborted && send.status === "failed") throw restartAbort.signal.reason;
			deliveryStatus = deliveryStatusFromDurableSend(send);
			if (!bestEffortDeliver && (send.status === "failed" || send.status === "partial_failed")) {
				emitJsonEnvelope(deliveryStatus);
				captureDeliveryResult(buildDeliveryResult({
					payloads: normalizedPayloads,
					meta: resultMeta,
					result,
					deliverySucceeded: false,
					deliveryStatus
				}));
				throw send.error;
			}
			deliverySucceeded = send.status === "sent" || send.status === "suppressed";
		}
	}
	if (deliver && !deliveryStatus) deliveryStatus = preDeliveryFailureStatus("no_delivery_target");
	if (deliver && !deliverySucceeded && !opts.json && !deliveryLoggedError) {
		const message = `[delivery] delivery requested but not completed: ${deliveryStatus?.status ?? "unknown"} (reason=${deliveryStatus?.reason ?? "none"} session=${effectiveSessionKey ?? "unknown"} channel=${deliveryChannel ?? "none"} target=${deliveryTarget ?? "none"} payloads=${deliveryPayloads.length})`;
		runtime.error?.(message);
		if (!runtime.error) runtime.log(message);
	}
	emitJsonEnvelope(deliveryStatus);
	return captureDeliveryResult(buildDeliveryResult({
		payloads: normalizedPayloads,
		meta: resultMeta,
		result,
		deliverySucceeded,
		deliveryStatus
	}));
}
//#endregion
exports.deliverAgentCommandResult = deliverAgentCommandResult;
