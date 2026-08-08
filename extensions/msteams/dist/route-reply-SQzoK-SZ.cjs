const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./plugins-_-82JYfc.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_normalize_reply = require("./normalize-reply-DKfUboQ9.cjs");
require("./message-channel-core-CeN5z1gK.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_identity = require("./identity-Dv2mhJl0.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_reply_payload = require("./reply-payload-B-1jXr3E.cjs");
const require_reply_payloads = require("./reply-payloads-Bn46m3tA.cjs");
const require_session_context = require("./session-context-ByjQL-XR.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/route-reply.ts
/**
* Provider-agnostic reply router.
*
* Routes replies to the originating channel based on OriginatingChannel/OriginatingTo
* instead of using the session's lastChannel. This ensures replies go back to the
* provider where the message originated, even when the main session is shared
* across multiple providers.
*/
const messageRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./runtime-CIO0BRex.cjs")).then((n) => n.runtime_exports));
function loadDeliverRuntime() {
	return messageRuntimeLoader.load();
}
function replyDeliverySourceMatchesRoute(params) {
	return (require_message_channel.normalizeMessageChannel(params.source.channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.source.channel)) === (require_message_channel.normalizeMessageChannel(params.channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel)) && require_account_id.normalizeAccountId(params.source.accountId) === require_account_id.normalizeAccountId(params.accountId) && require_chat_type.normalizeChatType(params.payloadDelivery.chatType ?? void 0) === require_chat_type.normalizeChatType(params.routeDelivery.chatType ?? void 0);
}
/**
* Routes a reply payload to the specified channel.
*
* This function provides a unified interface for sending messages to any
* supported provider. It's used by the followup queue to route replies
* back to the originating channel when OriginatingChannel/OriginatingTo
* are set.
*/
async function routeReply(params) {
	const { payload, channel, to, accountId, threadId, cfg, abortSignal } = params;
	if (require_reply_payloads.shouldSuppressReasoningPayload(payload)) return { ok: true };
	const normalizedChannel = require_message_channel.normalizeMessageChannel(channel);
	const channelId = require_registry$1.normalizeChannelId(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel) ?? null;
	const loadedPlugin = channelId ? require_registry$1.getLoadedChannelPlugin(channelId) : void 0;
	const bundledPlugin = channelId && !loadedPlugin ? require_bundled.getBundledChannelPlugin(channelId) : void 0;
	const messaging = loadedPlugin?.messaging ?? bundledPlugin?.messaging;
	const threading = loadedPlugin?.threading ?? bundledPlugin?.threading;
	const resolvedAgentId = params.sessionKey ? require_agent_scope.resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: cfg
	}) : void 0;
	const normalized = require_normalize_reply.normalizeReplyPayload(payload, {
		responsePrefix: params.sessionKey ? require_identity.resolveEffectiveMessagesConfig(cfg, resolvedAgentId ?? require_agent_scope.resolveSessionAgentId({ config: cfg }), {
			channel: normalizedChannel,
			accountId
		}).responsePrefix : cfg.messages?.responsePrefix === "auto" ? void 0 : cfg.messages?.responsePrefix,
		transformReplyPayload: messaging?.transformReplyPayload ? (nextPayload) => messaging.transformReplyPayload?.({
			payload: nextPayload,
			cfg,
			accountId
		}) ?? nextPayload : void 0
	});
	if (!normalized) return { ok: true };
	const externalPayload = {
		...normalized,
		text: require_reply_payloads.formatBtwTextForExternalDelivery(normalized)
	};
	const text = externalPayload.text ?? "";
	let mediaUrls = [];
	for (const url of externalPayload.mediaUrls ?? []) if (url) mediaUrls.push(url);
	if (mediaUrls.length === 0 && externalPayload.mediaUrl) mediaUrls = [externalPayload.mediaUrl];
	const replyToId = externalPayload.replyToId;
	const hasChannelData = messaging?.hasStructuredReplyPayload?.({ payload: externalPayload });
	if (!require_payload.hasReplyPayloadContent({
		...externalPayload,
		text,
		mediaUrls
	}, { hasChannelData })) return { ok: true };
	if (channel === "webchat") return {
		ok: false,
		error: "Webchat routing not supported for queued replies"
	};
	if (!channelId) return {
		ok: false,
		error: `Unknown channel: ${String(channel)}`
	};
	if (abortSignal?.aborted) return {
		ok: false,
		error: "Reply routing aborted"
	};
	const payloadMetadata = require_reply_payload.getReplyPayloadMetadata(normalized);
	const payloadReplyDelivery = payloadMetadata?.replyDelivery;
	const replyDelivery = (payloadReplyDelivery && params.replyDelivery && payloadMetadata.replyDeliverySource ? replyDeliverySourceMatchesRoute({
		source: payloadMetadata.replyDeliverySource,
		payloadDelivery: payloadReplyDelivery,
		routeDelivery: params.replyDelivery,
		channel: channelId,
		accountId
	}) : false) ? payloadReplyDelivery : params.replyDelivery ?? payloadReplyDelivery;
	const replyTransport = threading?.resolveReplyTransport?.({
		cfg,
		accountId,
		threadId,
		replyToId,
		replyToIsExplicit: Boolean(payloadMetadata?.replyToIdExplicit || normalized.replyToTag || normalized.replyToCurrent),
		replyDelivery
	}) ?? null;
	const resolvedReplyToId = replyTransport?.replyToId === null ? void 0 : replyTransport?.replyToId ?? replyToId ?? void 0;
	const resolvedThreadId = replyTransport && Object.hasOwn(replyTransport, "threadId") ? replyTransport.threadId ?? null : threadId ?? null;
	const deliveryPayload = {
		...externalPayload,
		replyToId: resolvedReplyToId
	};
	try {
		const { sendDurableMessageBatch } = await loadDeliverRuntime();
		const outboundSession = require_session_context.buildOutboundSessionContext({
			cfg,
			agentId: resolvedAgentId,
			sessionKey: params.sessionKey,
			policySessionKey: params.policySessionKey,
			conversationType: params.policyConversationType,
			isGroup: params.policySessionKey || params.policyConversationType ? void 0 : params.isGroup,
			requesterSenderId: params.requesterSenderId,
			requesterSenderName: params.requesterSenderName,
			requesterSenderUsername: params.requesterSenderUsername,
			requesterSenderE164: params.requesterSenderE164
		});
		const send = await sendDurableMessageBatch({
			cfg,
			channel: channelId,
			to,
			accountId: accountId ?? void 0,
			payloads: [deliveryPayload],
			replyPayloadSendingHook: {
				kind: params.replyKind,
				channel: channelId,
				...params.sessionKey ? { sessionKey: params.sessionKey } : {},
				...params.runId ? { runId: params.runId } : {},
				context: {
					channelId,
					...accountId ? { accountId } : {},
					conversationId: to,
					...params.sessionKey ? { sessionKey: params.sessionKey } : {},
					...params.requesterSenderId ? { senderId: params.requesterSenderId } : {},
					...params.runId ? { runId: params.runId } : {}
				}
			},
			replyToId: resolvedReplyToId ?? null,
			threadId: resolvedThreadId,
			session: outboundSession,
			signal: abortSignal,
			mirror: params.mirror !== false && params.sessionKey ? {
				sessionKey: params.sessionKey,
				agentId: resolvedAgentId,
				text,
				mediaUrls,
				...params.isGroup != null ? { isGroup: params.isGroup } : {},
				...params.groupId ? { groupId: params.groupId } : {}
			} : void 0
		});
		if (send.status === "failed" || send.status === "partial_failed") throw send.error;
		if (send.status === "suppressed" && (send.reason === "cancelled_by_reply_payload_sending_hook" || send.reason === "empty_after_reply_payload_sending_hook")) return {
			ok: true,
			suppressed: true,
			reason: send.reason
		};
		return {
			ok: true,
			messageId: (send.status === "sent" ? send.results : []).at(-1)?.messageId
		};
	} catch (err) {
		return {
			ok: false,
			error: `Failed to route reply to ${channel}: ${require_errors.formatErrorMessage(err)}`
		};
	}
}
/**
* Checks if a channel type is routable via routeReply.
*
* Some channels (webchat) require special handling and cannot be routed through
* this generic interface.
*/
function isRoutableChannel(channel) {
	if (!channel || channel === "webchat") return false;
	return require_ids.normalizeChatChannelId(channel) !== null || require_registry$1.normalizeChannelId(channel) !== null;
}
//#endregion
Object.defineProperty(exports, "isRoutableChannel", {
	enumerable: true,
	get: function() {
		return isRoutableChannel;
	}
});
Object.defineProperty(exports, "routeReply", {
	enumerable: true,
	get: function() {
		return routeReply;
	}
});
