require("./account-id-Di7YWYh4.cjs");
require("./plugins-_-82JYfc.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_reply_reference = require("./reply-reference-C8sqwH21.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_reply_payload = require("./reply-payload-B-1jXr3E.cjs");
const require_directive_tags = require("./directive-tags-8jEdunuA.cjs");
require("./reply-payloads-dedupe-BL0WFVBj.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/reply-tags.ts
/** Extracts inline reply-target tags from outbound reply text. */
function extractReplyToTag(text, currentMessageId) {
	const result = require_directive_tags.parseInlineDirectives(text, {
		currentMessageId,
		stripAudioTag: false
	});
	return {
		cleaned: result.text,
		replyToId: result.replyToId,
		replyToCurrent: result.replyToCurrent,
		hasTag: result.hasReplyTag
	};
}
//#endregion
//#region src/auto-reply/reply/reply-threading.ts
/** Reply threading policy helpers for channel replies and status notices. */
function normalizeReplyToModeChatType(chatType) {
	return chatType === "direct" || chatType === "group" || chatType === "channel" ? chatType : void 0;
}
/** Resolve configured reply-to mode from channel and chat-type config. */
function resolveConfiguredReplyToMode(cfg, channel, chatType) {
	const provider = require_registry_normalize.normalizeAnyChannelId(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	if (!provider) return "all";
	const channelConfig = cfg.channels?.[provider];
	const normalizedChatType = normalizeReplyToModeChatType(chatType);
	if (normalizedChatType) {
		const scopedMode = channelConfig?.replyToModeByChatType?.[normalizedChatType];
		if (scopedMode !== void 0) return scopedMode;
	}
	if (normalizedChatType === "direct") {
		const legacyDirectMode = channelConfig?.dm?.replyToMode;
		if (legacyDirectMode !== void 0) return legacyDirectMode;
	}
	return channelConfig?.replyToMode ?? "all";
}
/** Resolve reply-to mode using channel threading adapter override when present. */
function resolveReplyToModeWithThreading(cfg, threading, params = {}) {
	return threading?.resolveReplyToMode?.({
		cfg,
		accountId: params.accountId,
		chatType: params.chatType
	}) ?? resolveConfiguredReplyToMode(cfg, params.channel, params.chatType);
}
/** Resolve effective reply-to mode for a channel/account/chat tuple. */
function resolveReplyToMode(cfg, channel, accountId, chatType) {
	const normalizedAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(accountId);
	if (!normalizedAccountId) return resolveConfiguredReplyToMode(cfg, channel, chatType);
	const provider = require_registry_normalize.normalizeAnyChannelId(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	return resolveReplyToModeWithThreading(cfg, provider ? require_registry$1.getChannelPlugin(provider)?.threading : void 0, {
		channel,
		accountId: normalizedAccountId,
		chatType
	});
}
/** Resolve the account that routed reply delivery will use when none is explicit. */
function resolveReplyDeliveryAccountId(cfg, channel, accountId) {
	const explicitAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(accountId);
	if (explicitAccountId) return explicitAccountId;
	const provider = require_registry_normalize.normalizeAnyChannelId(channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	if (!provider) return;
	const plugin = require_registry$1.getChannelPlugin(provider);
	if (!plugin) return;
	const configuredDefault = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(plugin.config.defaultAccountId?.(cfg));
	if (configuredDefault) return configuredDefault;
	const channelConfiguredDefault = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(cfg.channels?.[provider]?.defaultAccount);
	if (channelConfiguredDefault) return channelConfiguredDefault;
	return plugin.config.listAccountIds(cfg).map((listedAccountId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(listedAccountId)).find((listedAccountId) => Boolean(listedAccountId)) ?? "default";
}
/** Build the canonical reply policy context consumed by delivery adapters. */
function createReplyDeliveryContext(replyToMode, chatType) {
	const normalizedChatType = require_chat_type.normalizeChatType(chatType ?? void 0);
	return {
		...normalizedChatType ? { chatType: normalizedChatType } : {},
		replyToMode
	};
}
/** Create a payload filter that strips reply targets according to reply-to mode. */
function createReplyToModeFilter(mode, opts = {}) {
	let hasThreaded = false;
	return (payload) => {
		const isStatusNotice = require_reply_payload.isReplyPayloadStatusNotice(payload);
		if (!payload.replyToId) return payload;
		if (mode === "off") {
			const isExplicit = Boolean(payload.replyToTag) || Boolean(payload.replyToCurrent);
			if (opts.allowExplicitReplyTagsWhenOff && isExplicit && !isStatusNotice) return payload;
			return require_reply_payload.copyReplyPayloadMetadata(payload, {
				...payload,
				replyToId: void 0
			});
		}
		if (mode === "all") return payload;
		if (require_reply_reference.isSingleUseReplyToMode(mode) && hasThreaded) {
			if (isStatusNotice) return payload;
			return require_reply_payload.copyReplyPayloadMetadata(payload, {
				...payload,
				replyToId: void 0
			});
		}
		if (require_reply_reference.isSingleUseReplyToMode(mode) && !isStatusNotice) hasThreaded = true;
		return payload;
	};
}
/** Resolve whether implicit current-message replies are allowed under threading policy. */
function resolveImplicitCurrentMessageReplyAllowance(mode, policy) {
	const implicitCurrentMessage = policy?.implicitCurrentMessage ?? "default";
	if (implicitCurrentMessage === "allow") return true;
	if (implicitCurrentMessage === "deny") return false;
	return mode !== "batched";
}
/** Create a reply-to filter using channel-specific explicit-tag defaults. */
function createReplyToModeFilterForChannel(mode, channel) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	return createReplyToModeFilter(mode, { allowExplicitReplyTagsWhenOff: normalized ? true : normalized === "webchat" });
}
//#endregion
//#region src/auto-reply/reply/reply-payloads-base.ts
/** Adds the BTW question banner for channels that only accept plain text bodies. */
function formatBtwTextForExternalDelivery(payload) {
	const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.text);
	if (!text) return payload.text;
	const question = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.btw?.question);
	if (!question) return payload.text;
	const formatted = `BTW\nQuestion: ${question}\n\n${text}`;
	return text === formatted || text.startsWith("BTW\nQuestion:") ? text : formatted;
}
function resolveReplyThreadingForPayload(params) {
	const payload = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.payload.replyToId) ? require_reply_payload.setReplyPayloadMetadata(require_reply_payload.copyReplyPayloadMetadata(params.payload, { ...params.payload }), { replyToIdExplicit: true }) : params.payload;
	const implicitReplyToId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.implicitReplyToId);
	const currentMessageId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.currentMessageId);
	const allowImplicitReplyToCurrentMessage = resolveImplicitCurrentMessageReplyAllowance(params.replyToMode, params.replyThreading);
	let resolved = payload.replyToId || payload.replyToCurrent === false || !implicitReplyToId || !allowImplicitReplyToCurrentMessage ? payload : require_reply_payload.copyReplyPayloadMetadata(payload, {
		...payload,
		replyToId: implicitReplyToId
	});
	if (typeof resolved.text === "string" && resolved.text.includes("[[")) {
		const { cleaned, replyToId, replyToCurrent, hasTag } = extractReplyToTag(resolved.text, currentMessageId);
		resolved = require_reply_payload.copyReplyPayloadMetadata(resolved, {
			...resolved,
			text: cleaned ? cleaned : void 0,
			replyToId: replyToId ?? resolved.replyToId,
			replyToTag: hasTag || resolved.replyToTag,
			replyToCurrent: replyToCurrent || resolved.replyToCurrent
		});
	}
	if (resolved.replyToCurrent && !resolved.replyToId && currentMessageId) resolved = require_reply_payload.copyReplyPayloadMetadata(resolved, {
		...resolved,
		replyToId: currentMessageId
	});
	return resolved;
}
/** Applies inline reply tags to a single payload. */
function applyReplyTagsToPayload(payload, currentMessageId) {
	return resolveReplyThreadingForPayload({
		payload,
		currentMessageId
	});
}
/** True when a payload has visible or playable content for delivery. */
function isRenderablePayload(payload) {
	return require_payload.hasReplyPayloadContent(payload, { extraContent: payload.audioAsVoice || payload.location != null });
}
/** True when a payload should stay internal as reasoning-only output. */
function shouldSuppressReasoningPayload(payload) {
	return payload.isReasoning === true;
}
/** Resolves reply targets and filters empty payloads before channel delivery. */
function resolveReplyThreadingPayloads(params) {
	const { payloads, replyToMode, currentMessageId, replyThreading } = params;
	const implicitReplyToId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(currentMessageId);
	return payloads.map((payload) => resolveReplyThreadingForPayload({
		payload,
		replyToMode,
		implicitReplyToId,
		currentMessageId,
		replyThreading
	})).filter(isRenderablePayload);
}
/** Applies threading policy and filters empty payloads before channel delivery. */
function applyReplyThreading(params) {
	const applyReplyToMode = createReplyToModeFilterForChannel(params.replyToMode, params.replyToChannel);
	return resolveReplyThreadingPayloads(params).map(applyReplyToMode);
}
//#endregion
Object.defineProperty(exports, "applyReplyTagsToPayload", {
	enumerable: true,
	get: function() {
		return applyReplyTagsToPayload;
	}
});
Object.defineProperty(exports, "applyReplyThreading", {
	enumerable: true,
	get: function() {
		return applyReplyThreading;
	}
});
Object.defineProperty(exports, "createReplyDeliveryContext", {
	enumerable: true,
	get: function() {
		return createReplyDeliveryContext;
	}
});
Object.defineProperty(exports, "createReplyToModeFilterForChannel", {
	enumerable: true,
	get: function() {
		return createReplyToModeFilterForChannel;
	}
});
Object.defineProperty(exports, "formatBtwTextForExternalDelivery", {
	enumerable: true,
	get: function() {
		return formatBtwTextForExternalDelivery;
	}
});
Object.defineProperty(exports, "isRenderablePayload", {
	enumerable: true,
	get: function() {
		return isRenderablePayload;
	}
});
Object.defineProperty(exports, "resolveReplyDeliveryAccountId", {
	enumerable: true,
	get: function() {
		return resolveReplyDeliveryAccountId;
	}
});
Object.defineProperty(exports, "resolveReplyThreadingPayloads", {
	enumerable: true,
	get: function() {
		return resolveReplyThreadingPayloads;
	}
});
Object.defineProperty(exports, "resolveReplyToMode", {
	enumerable: true,
	get: function() {
		return resolveReplyToMode;
	}
});
Object.defineProperty(exports, "shouldSuppressReasoningPayload", {
	enumerable: true,
	get: function() {
		return shouldSuppressReasoningPayload;
	}
});
