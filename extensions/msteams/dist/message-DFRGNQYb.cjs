const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_runtime = require("./runtime-CIO0BRex.cjs");
const require_deliver = require("./deliver-1KcHW32R.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
require("./message-channel-jMzaqV09.cjs");
const require_payloads = require("./payloads-MFaWqn01.cjs");
const require_session_context = require("./session-context-ByjQL-XR.cjs");
const require_polls = require("./polls-CobigrW4.cjs");
const require_channel_resolution = require("./channel-resolution-BHNgrqI2.cjs");
const require_channel_selection = require("./channel-selection-SjphkB8p.cjs");
const require_targets = require("./targets-BfrPEAMP.cjs");
//#region src/channels/message/capabilities.ts
function hasMediaPayload(payload) {
	if (payload.mediaUrl?.trim()) return true;
	return Array.isArray(payload.mediaUrls) && payload.mediaUrls.some((url) => typeof url === "string" && url.trim().length > 0);
}
function setRequired(requirements, capability, required) {
	if (required === true) requirements[capability] = true;
}
/** Derives the adapter capabilities core needs before it can require durable final delivery. */
function deriveDurableFinalDeliveryRequirements(params) {
	const requirements = {};
	setRequired(requirements, "text", true);
	setRequired(requirements, "media", hasMediaPayload(params.payload));
	setRequired(requirements, "replyTo", params.replyToId != null || params.payload.replyToId != null);
	setRequired(requirements, "thread", params.threadId != null);
	setRequired(requirements, "silent", params.silent);
	setRequired(requirements, "messageSendingHooks", params.messageSendingHooks !== false);
	setRequired(requirements, "payload", params.payloadTransport);
	setRequired(requirements, "batch", params.batch);
	setRequired(requirements, "reconcileUnknownSend", params.reconcileUnknownSend);
	setRequired(requirements, "afterSendSuccess", params.afterSendSuccess);
	setRequired(requirements, "afterCommit", params.afterCommit);
	for (const [capability, required] of Object.entries(params.extraCapabilities ?? {})) setRequired(requirements, capability, required);
	return requirements;
}
//#endregion
//#region src/infra/outbound/message-gateway-options.ts
/** Normalizes outbound gateway options and fills CLI defaults. */
function resolveOutboundMessageGatewayOptions(gateway) {
	const clientName = gateway?.clientName ?? require_client_info.GATEWAY_CLIENT_NAMES.CLI;
	const mode = gateway?.mode ?? require_client_info.GATEWAY_CLIENT_MODES.CLI;
	return {
		url: mode === require_client_info.GATEWAY_CLIENT_MODES.BACKEND || clientName === require_client_info.GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT ? void 0 : gateway?.url,
		token: gateway?.token,
		timeoutMs: (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(gateway?.timeoutMs, 1e4),
		clientName,
		clientDisplayName: gateway?.clientDisplayName,
		mode
	};
}
//#endregion
//#region src/infra/outbound/message.ts
var message_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	sendMessage: () => sendMessage,
	sendPoll: () => sendPoll
});
const SEND_BUFFER_MEDIA_URL = "buffer://message-send/attachment";
const loadMessageConfigRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./message.config.runtime-9CIF1LqY.cjs")));
const loadMessageGatewayRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./message.gateway.runtime-Do3REJAD.cjs")));
function buildMessagePollResult(params) {
	return {
		channel: params.channel,
		to: params.to,
		question: params.normalized.question,
		options: params.normalized.options,
		maxSelections: params.normalized.maxSelections,
		durationSeconds: params.normalized.durationSeconds ?? null,
		durationHours: params.normalized.durationHours ?? null,
		via: params.via,
		...params.dryRun ? { dryRun: true } : { result: params.result }
	};
}
function assertPollOptionSupport(params) {
	if (typeof params.durationSeconds === "number" && params.outbound.supportsPollDurationSeconds !== true) throw new Error(`durationSeconds is not supported for ${params.channel} polls`);
	if (typeof params.isAnonymous === "boolean" && params.outbound.supportsAnonymousPolls !== true) throw new Error(`isAnonymous is not supported for ${params.channel} polls`);
}
async function resolveRequiredChannel(params) {
	return (await require_channel_selection.resolveMessageChannelSelection({
		cfg: params.cfg,
		channel: params.channel
	})).channel;
}
function resolveRequiredPlugin(channel, cfg) {
	const plugin = require_channel_resolution.resolveOutboundChannelPlugin({
		channel,
		cfg
	});
	if (!plugin) throw new Error(`Unknown channel: ${channel}`);
	return plugin;
}
function payloadRequiresDurablePayloadTransport(payload) {
	return payload.presentation !== void 0 || payload.delivery !== void 0 || payload.interactive !== void 0 || payload.channelData !== void 0 && Object.keys(payload.channelData).length > 0;
}
function mergeDurableRequirements(target, source) {
	for (const [capability, required] of Object.entries(source)) if (required === true) target[capability] = true;
	return target;
}
function deriveRequiredMessageSendCapabilities(params) {
	const requirements = { reconcileUnknownSend: true };
	for (const payload of params.payloads) mergeDurableRequirements(requirements, deriveDurableFinalDeliveryRequirements({
		payload,
		replyToId: params.replyToId,
		threadId: params.threadId,
		silent: params.silent,
		payloadTransport: payloadRequiresDurablePayloadTransport(payload),
		batch: params.payloads.length > 1,
		reconcileUnknownSend: true
	}));
	return requirements;
}
async function assertRequiredMessageSendDurability(params) {
	const support = await require_deliver.resolveOutboundDurableFinalDeliverySupport({
		cfg: params.cfg,
		channel: params.channel,
		requirements: deriveRequiredMessageSendCapabilities(params)
	});
	if (support.ok) return;
	const suffix = support.reason === "capability_mismatch" && support.capability ? `missing ${support.capability}` : support.reason;
	throw new Error(`Required durable message send is unsupported for ${params.channel}: ${suffix}. Use queuePolicy:"best_effort" for best-effort delivery, omit bestEffort:false in message-tool calls, or use a channel with required durable delivery support.`);
}
function resolveGatewayOptions(opts) {
	return resolveOutboundMessageGatewayOptions(opts);
}
async function callMessageGateway(params) {
	const { callGatewayLeastPrivilege } = await loadMessageGatewayRuntime();
	const gateway = resolveGatewayOptions(params.gateway);
	return await callGatewayLeastPrivilege({
		url: gateway.url,
		token: gateway.token,
		method: params.method,
		params: params.params,
		timeoutMs: gateway.timeoutMs,
		clientName: gateway.clientName,
		clientDisplayName: gateway.clientDisplayName,
		mode: gateway.mode
	});
}
async function resolveMessageConfig(cfg) {
	if (cfg) return cfg;
	const { getRuntimeConfig } = await loadMessageConfigRuntime();
	return getRuntimeConfig();
}
async function resolveGatewayIdempotencyKey(idempotencyKey) {
	if (idempotencyKey) return idempotencyKey;
	const { randomIdempotencyKey } = await loadMessageGatewayRuntime();
	return randomIdempotencyKey();
}
async function sendMessage(params) {
	const cfg = await resolveMessageConfig(params.cfg);
	const channel = await resolveRequiredChannel({
		cfg,
		channel: params.channel
	});
	const deliveryMode = resolveRequiredPlugin(channel, cfg).outbound?.deliveryMode ?? "direct";
	const hasRealMediaSource = [params.mediaUrl, ...params.mediaUrls ?? []].filter((source) => Boolean(source)).some((source) => source !== SEND_BUFFER_MEDIA_URL);
	const shouldForwardBuffer = deliveryMode === "gateway" && Boolean(params.buffer) && !hasRealMediaSource;
	const mediaUrl = params.mediaUrl ?? (shouldForwardBuffer ? SEND_BUFFER_MEDIA_URL : void 0);
	const mediaUrls = params.mediaUrls ?? (shouldForwardBuffer ? [SEND_BUFFER_MEDIA_URL] : void 0);
	const outboundPlan = require_payloads.createOutboundPayloadPlan(params.payloads && params.payloads.length > 0 ? params.payloads : [{
		text: params.content,
		mediaUrl,
		mediaUrls,
		audioAsVoice: params.asVoice === true
	}]);
	const normalizedPayloads = require_payloads.projectOutboundPayloadPlanForDelivery(outboundPlan);
	const mirrorProjection = require_payloads.projectOutboundPayloadPlanForMirror(outboundPlan);
	const mirrorText = mirrorProjection.text;
	const mirrorMediaUrls = mirrorProjection.mediaUrls;
	const primaryMediaUrl = mirrorMediaUrls[0] ?? mediaUrl ?? null;
	if (params.dryRun) return {
		channel,
		to: params.to,
		via: deliveryMode === "gateway" ? "gateway" : "direct",
		mediaUrl: primaryMediaUrl,
		mediaUrls: mirrorMediaUrls.length ? mirrorMediaUrls : void 0,
		dryRun: true
	};
	if (deliveryMode !== "gateway") {
		const outboundChannel = channel;
		const resolvedTarget = require_targets.resolveOutboundTarget({
			channel: outboundChannel,
			to: params.to,
			cfg,
			accountId: params.accountId,
			mode: "explicit"
		});
		if (!resolvedTarget.ok) throw resolvedTarget.error;
		const outboundSession = require_session_context.buildOutboundSessionContext({
			cfg,
			agentId: params.agentId,
			sessionKey: params.requesterSessionKey ?? params.mirror?.sessionKey,
			conversationType: params.conversationType,
			requesterAccountId: params.requesterAccountId ?? params.accountId,
			requesterSenderId: params.requesterSenderId,
			requesterSenderName: params.requesterSenderName,
			requesterSenderUsername: params.requesterSenderUsername,
			requesterSenderE164: params.requesterSenderE164
		});
		const requireUnknownSendReconciliation = params.queuePolicy === "required";
		if (requireUnknownSendReconciliation) await assertRequiredMessageSendDurability({
			cfg,
			channel: outboundChannel,
			payloads: normalizedPayloads,
			replyToId: params.replyToId,
			threadId: params.threadId,
			silent: params.silent
		});
		const send = await require_runtime.sendDurableMessageBatch({
			cfg,
			channel: outboundChannel,
			to: resolvedTarget.to,
			session: outboundSession,
			accountId: params.accountId,
			conversationReadOrigin: params.conversationReadOrigin,
			payloads: normalizedPayloads,
			replyToId: params.replyToId,
			threadId: params.threadId,
			gifPlayback: params.gifPlayback,
			forceDocument: params.forceDocument,
			deps: params.deps,
			bestEffort: params.bestEffort,
			...requireUnknownSendReconciliation ? { requireUnknownSendReconciliation: true } : {},
			durability: params.bestEffort || params.queuePolicy === "best_effort" ? "best_effort" : "required",
			signal: params.abortSignal,
			silent: params.silent,
			mediaAccess: params.mediaAccess,
			formatting: params.parseMode ? { parseMode: params.parseMode } : void 0,
			mirror: params.mirror ? {
				...params.mirror,
				text: mirrorText || params.content,
				mediaUrls: mirrorMediaUrls.length ? mirrorMediaUrls : void 0,
				idempotencyKey: params.mirror.idempotencyKey ?? params.idempotencyKey
			} : void 0
		});
		if (!params.bestEffort && (send.status === "failed" || send.status === "partial_failed")) throw send.error;
		const results = send.status === "sent" || send.status === "partial_failed" ? send.results : [];
		const payloadOutcomes = require_runtime.serializeDurableMessagePayloadOutcomes(send.payloadOutcomes);
		return {
			channel,
			to: params.to,
			via: "direct",
			mediaUrl: primaryMediaUrl,
			mediaUrls: mirrorMediaUrls.length ? mirrorMediaUrls : void 0,
			result: results.at(-1),
			deliveryStatus: send.status,
			...send.status === "failed" || send.status === "partial_failed" ? { error: require_errors.formatErrorMessage(send.error) } : {},
			...send.status === "partial_failed" ? { sentBeforeError: true } : {},
			...payloadOutcomes ? { payloadOutcomes } : {}
		};
	}
	const result = await callMessageGateway({
		gateway: params.gateway,
		method: "send",
		params: {
			to: params.to,
			message: params.content,
			mediaUrl,
			mediaUrls: mirrorMediaUrls.length ? mirrorMediaUrls : mediaUrls,
			buffer: shouldForwardBuffer ? params.buffer : void 0,
			filename: shouldForwardBuffer ? params.filename : void 0,
			contentType: shouldForwardBuffer ? params.contentType : void 0,
			asVoice: params.asVoice,
			gifPlayback: params.gifPlayback,
			accountId: params.accountId,
			agentId: params.agentId,
			channel,
			replyToId: params.replyToId,
			threadId: params.threadId != null ? String(params.threadId) : void 0,
			forceDocument: params.forceDocument,
			silent: params.silent,
			parseMode: params.parseMode,
			sessionKey: params.mirror?.sessionKey,
			idempotencyKey: await resolveGatewayIdempotencyKey(params.idempotencyKey)
		}
	});
	return {
		channel,
		to: params.to,
		via: "gateway",
		mediaUrl: primaryMediaUrl,
		mediaUrls: mirrorMediaUrls.length ? mirrorMediaUrls : void 0,
		result
	};
}
async function sendPoll(params) {
	const cfg = await resolveMessageConfig(params.cfg);
	const channel = await resolveRequiredChannel({
		cfg,
		channel: params.channel
	});
	const pollInput = {
		question: params.question,
		options: params.options,
		maxSelections: params.maxSelections,
		durationSeconds: params.durationSeconds,
		durationHours: params.durationHours
	};
	const outbound = resolveRequiredPlugin(channel, cfg)?.outbound;
	if (!outbound?.sendPoll) throw new Error(`Unsupported poll channel: ${channel}`);
	const deliveryMode = outbound.deliveryMode ?? "direct";
	const normalized = outbound.pollMaxOptions ? require_polls.normalizePollInput(pollInput, { maxOptions: outbound.pollMaxOptions }) : require_polls.normalizePollInput(pollInput);
	if (params.dryRun) return buildMessagePollResult({
		channel,
		to: params.to,
		normalized,
		via: deliveryMode === "gateway" ? "gateway" : "direct",
		dryRun: true
	});
	assertPollOptionSupport({
		channel,
		outbound,
		durationSeconds: params.durationSeconds,
		isAnonymous: params.isAnonymous
	});
	if (deliveryMode !== "gateway") {
		const resolvedTarget = require_targets.resolveOutboundTarget({
			channel,
			to: params.to,
			cfg,
			accountId: params.accountId,
			mode: "explicit"
		});
		if (!resolvedTarget.ok) throw resolvedTarget.error;
		const result = await outbound.sendPoll({
			cfg,
			to: resolvedTarget.to,
			poll: normalized,
			accountId: params.accountId,
			threadId: params.threadId,
			silent: params.silent,
			isAnonymous: params.isAnonymous
		});
		return buildMessagePollResult({
			channel,
			to: params.to,
			normalized,
			via: "direct",
			result
		});
	}
	const result = await callMessageGateway({
		gateway: params.gateway,
		method: "poll",
		params: {
			to: params.to,
			question: normalized.question,
			options: normalized.options,
			maxSelections: normalized.maxSelections,
			durationSeconds: normalized.durationSeconds,
			durationHours: normalized.durationHours,
			threadId: params.threadId,
			silent: params.silent,
			isAnonymous: params.isAnonymous,
			channel,
			accountId: params.accountId,
			idempotencyKey: await resolveGatewayIdempotencyKey(params.idempotencyKey)
		}
	});
	return buildMessagePollResult({
		channel,
		to: params.to,
		normalized,
		via: "gateway",
		result
	});
}
//#endregion
Object.defineProperty(exports, "deriveDurableFinalDeliveryRequirements", {
	enumerable: true,
	get: function() {
		return deriveDurableFinalDeliveryRequirements;
	}
});
Object.defineProperty(exports, "message_exports", {
	enumerable: true,
	get: function() {
		return message_exports;
	}
});
Object.defineProperty(exports, "resolveOutboundMessageGatewayOptions", {
	enumerable: true,
	get: function() {
		return resolveOutboundMessageGatewayOptions;
	}
});
Object.defineProperty(exports, "sendMessage", {
	enumerable: true,
	get: function() {
		return sendMessage;
	}
});
Object.defineProperty(exports, "sendPoll", {
	enumerable: true,
	get: function() {
		return sendPoll;
	}
});
