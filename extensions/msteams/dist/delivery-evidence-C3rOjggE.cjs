require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_target_normalization = require("./target-normalization-CHxcE9Mj.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/accepted-session-spawn.ts
/** Normalizes accepted child-session spawn results from loose tool payloads. */
/** Normalize a tool result that accepted a child session spawn. */
function normalizeAcceptedSessionSpawnResult(result) {
	const details = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(result)?.details);
	if (details?.status !== "accepted") return null;
	const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(details.runId);
	const childSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(details.childSessionKey);
	if (!runId || !childSessionKey) return null;
	return {
		runId,
		childSessionKey
	};
}
/** Return true when a collection contains at least one accepted child spawn. */
function hasAcceptedSessionSpawn(acceptedSessionSpawns) {
	return (acceptedSessionSpawns ?? []).some((spawn) => {
		const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(spawn);
		if (!record) return false;
		return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.runId) && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.childSessionKey));
	});
}
//#endregion
//#region src/infra/outbound/source-delivery-plan.ts
function isMessageToolOwnedDelivery(owner) {
	return owner === "message_tool" || owner === "message_tool_then_direct_fallback";
}
function normalizeDeliveryTarget(channel, to) {
	const toTrimmed = to.trim();
	return require_target_normalization.normalizeTargetForProvider(channel, toTrimmed) ?? toTrimmed;
}
function deliveryTargetsMatch(channel, targetTo, deliveryTo) {
	const targetToTrimmed = targetTo.trim();
	const deliveryToTrimmed = deliveryTo.trim();
	if (targetToTrimmed === deliveryToTrimmed) return true;
	const targetPrefixed = targetToTrimmed.match(/^([a-z][a-z0-9_-]*):(.*)$/i);
	const deliveryPrefixed = deliveryToTrimmed.match(/^([a-z][a-z0-9_-]*):(.*)$/i);
	const targetKind = targetPrefixed?.[1]?.toLowerCase();
	const deliveryKind = deliveryPrefixed?.[1]?.toLowerCase();
	if (targetKind && targetKind === deliveryKind && [
		"channel",
		"conversation",
		"group",
		"user"
	].includes(targetKind)) {
		const targetId = targetPrefixed?.[2]?.trim();
		const deliveryId = deliveryPrefixed?.[2]?.trim();
		const comparison = require_registry.getChannelPlugin(channel)?.messaging?.targetIdComparison;
		if (comparison === "case-sensitive") return targetId === deliveryId;
		if (comparison === "lowercase") return targetId?.toLowerCase() === deliveryId?.toLowerCase();
	}
	return normalizeDeliveryTarget(channel, targetToTrimmed) === normalizeDeliveryTarget(channel, deliveryToTrimmed);
}
function normalizeDeliveryThreadId(threadId) {
	return require_channel_route.stringifyRouteThreadId(threadId)?.trim() || void 0;
}
function extractTopicThreadId(targetTo) {
	return targetTo.match(/:topic:(\d+)$/i)?.[1];
}
/** Compares a message-tool target with the required source delivery target. */
function sourceDeliveryTargetsMatch(target, delivery) {
	if (!delivery.channel || !delivery.to || !target.to) return false;
	const channel = delivery.channel.trim().toLowerCase();
	const provider = target.provider?.trim().toLowerCase();
	if (provider && provider !== "message" && provider !== channel) return false;
	if (delivery.accountId && target.accountId && target.accountId !== delivery.accountId) return false;
	if (!deliveryTargetsMatch(channel, target.to.replace(/:topic:\d+$/, ""), delivery.to)) return false;
	const deliveryThreadId = normalizeDeliveryThreadId(delivery.threadId);
	const targetThreadId = normalizeDeliveryThreadId(target.threadId) ?? extractTopicThreadId(target.to);
	if (!deliveryThreadId && !targetThreadId) return true;
	if (deliveryThreadId && !targetThreadId) return target.threadImplicit === true && target.threadSuppressed !== true;
	return deliveryThreadId === targetThreadId;
}
/** Builds a source delivery plan from ownership and fallback inputs. */
function createSourceDeliveryPlan(params) {
	const messageToolOwnsDelivery = isMessageToolOwnedDelivery(params.owner);
	const sourceReplyDeliveryMode = messageToolOwnsDelivery ? "message_tool_only" : void 0;
	const directDelivery = params.directFallback ?? (params.owner === "direct_fallback" || params.owner === "message_tool_then_direct_fallback");
	return {
		owner: params.owner,
		reason: params.reason,
		target: params.target ?? {},
		normalFinal: sourceReplyDeliveryMode === "message_tool_only" || params.owner === "none" ? "private" : "visible",
		sourceReplyDeliveryMode,
		messageTool: {
			enabled: params.messageToolEnabled ?? messageToolOwnsDelivery,
			force: params.messageToolForced ?? messageToolOwnsDelivery,
			requireExplicitTarget: params.requireExplicitMessageTarget ?? false,
			requireExplicitTargetEvidence: params.requireExplicitMessageTargetEvidence ?? false,
			defaultTarget: Boolean(params.target?.channel || params.target?.to)
		},
		fallback: {
			directDelivery,
			skipWhenMessageToolSentToTarget: params.skipFallbackWhenMessageToolSentToTarget ?? params.owner === "message_tool_then_direct_fallback",
			bestEffort: params.fallbackBestEffort ?? false
		},
		progress: { allowCallbacksWhenSourceDeliverySuppressed: params.allowProgressCallbacksWhenSourceDeliverySuppressed ?? false }
	};
}
function resolveImplicitMessageToolDeliveryTarget(plan) {
	if (!plan.target.channel || !plan.target.to) return;
	const threadId = require_channel_route.stringifyRouteThreadId(plan.target.threadId);
	return {
		tool: "message",
		provider: plan.target.channel,
		...plan.target.accountId ? { accountId: plan.target.accountId } : {},
		...plan.target.to ? { to: plan.target.to } : {},
		...threadId ? { threadId } : {}
	};
}
/** Evaluates whether observed message-tool sends satisfy the source delivery plan. */
function resolveSourceDeliveryOutcome(plan, params) {
	const didSendViaMessageTool = params.didSendViaMessageTool === true;
	const explicitTargets = params.messageToolSentTargets ?? [];
	const sentTargets = explicitTargets.length > 0 ? explicitTargets : didSendViaMessageTool && !plan.messageTool.requireExplicitTargetEvidence ? [resolveImplicitMessageToolDeliveryTarget(plan)].filter((target) => Boolean(target)) : [];
	const visibleDeliveries = sentTargets.map((target) => ({
		via: "message_tool",
		target,
		verifiedTarget: sourceDeliveryTargetsMatch(target, plan.target)
	}));
	const hasVerifiedMessageToolDelivery = visibleDeliveries.some((delivery) => didSendViaMessageTool && delivery.verifiedTarget);
	return {
		visibleDeliveries,
		verifiedMessageToolDelivery: hasVerifiedMessageToolDelivery,
		satisfiesSourceDelivery: plan.fallback.skipWhenMessageToolSentToTarget && hasVerifiedMessageToolDelivery,
		unverifiedMessageToolDelivery: didSendViaMessageTool && sentTargets.length > 0 && !hasVerifiedMessageToolDelivery
	};
}
//#endregion
//#region src/agents/embedded-agent-runner/delivery-evidence.ts
/**
* Extracts visible delivery evidence from embedded-agent run results.
*/
function collectSourceReplyFinalMarkers(value) {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry) => {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
		const marker = entry.sourceReplyFinal;
		return typeof marker === "boolean" ? [marker] : [];
	});
}
/** Resolve explicit progress/final evidence, or undefined for legacy runtimes. */
function resolveExplicitFinalSourceReplyDeliveryEvidence(result) {
	const markers = [...collectSourceReplyFinalMarkers(result.messagingToolSentTargets), ...collectSourceReplyFinalMarkers(result.messagingToolSourceReplyPayloads)];
	return markers.length > 0 ? markers.some(Boolean) : void 0;
}
/** Preserve legacy completion semantics unless the runtime emitted progress/final markers. */
function hasCompletedSourceReplyDeliveryEvidence(result) {
	return resolveExplicitFinalSourceReplyDeliveryEvidence(result) ?? hasCommittedSourceReplyDeliveryEvidence(result);
}
/** Returns whether delivery evidence completes the current interactive turn. */
function hasCompletedTerminalDeliveryEvidence(result) {
	const explicitFinal = resolveExplicitFinalSourceReplyDeliveryEvidence(result);
	return hasCompletedSourceReplyDeliveryEvidence(result) || explicitFinal === void 0 && hasVisibleOutboundDeliveryEvidence(result) || result.didSendDeterministicApprovalPrompt === true;
}
function hasNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
function hasNonEmptyArray(value) {
	return Array.isArray(value) && value.length > 0;
}
function hasNonEmptyStringArray(value) {
	return Array.isArray(value) && value.some(hasNonEmptyString);
}
function hasVisibleMessagingToolTarget(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const target = value;
	if ("text" in target || "mediaUrls" in target || "hasRichContent" in target || "visible" in target) return hasNonEmptyString(target.text) || hasNonEmptyStringArray(target.mediaUrls) || target.hasRichContent === true || target.visible === true;
	return true;
}
function hasVisibleAttachmentReference(value) {
	if (!Array.isArray(value)) return false;
	const urls = /* @__PURE__ */ new Set();
	for (const attachment of value) if (attachment && typeof attachment === "object" && !Array.isArray(attachment)) collectMediaUrlsFromRecord(attachment, urls);
	return urls.size > 0;
}
function collectStringValues(value, output) {
	if (typeof value === "string" && value.trim()) {
		output.add(value.trim());
		return;
	}
	if (!Array.isArray(value)) return;
	for (const entry of value) if (typeof entry === "string" && entry.trim()) output.add(entry.trim());
}
function collectMediaUrlsFromRecord(record, output, seen = /* @__PURE__ */ new WeakSet()) {
	if (seen.has(record)) return;
	seen.add(record);
	collectStringValues(record.mediaUrl, output);
	collectStringValues(record.mediaUrls, output);
	collectStringValues(record.path, output);
	collectStringValues(record.url, output);
	collectStringValues(record.filePath, output);
	const attachments = record.attachments;
	if (Array.isArray(attachments)) {
		for (const attachment of attachments) if (attachment && typeof attachment === "object" && !Array.isArray(attachment)) collectMediaUrlsFromRecord(attachment, output, seen);
	}
}
/** Collects media URLs from agent payloads and committed messaging-tool delivery metadata. */
function collectDeliveredMediaUrls(result) {
	const urls = /* @__PURE__ */ new Set();
	if (Array.isArray(result.payloads)) {
		for (const payload of result.payloads) if (payload && typeof payload === "object" && !Array.isArray(payload)) collectMediaUrlsFromRecord(payload, urls);
	}
	for (const url of collectMessagingToolDeliveredMediaUrls(result)) urls.add(url);
	return Array.from(urls);
}
/** Collects media URLs recorded by messaging-tool sends and their target attachments. */
function collectMessagingToolDeliveredMediaUrls(result) {
	const urls = /* @__PURE__ */ new Set();
	collectStringValues(result.messagingToolSentMediaUrls, urls);
	if (Array.isArray(result.messagingToolSentTargets)) {
		for (const target of result.messagingToolSentTargets) if (target && typeof target === "object" && !Array.isArray(target)) collectMediaUrlsFromRecord(target, urls);
	}
	return Array.from(urls);
}
function collectPayloadOutcomeMediaUrls(result, statuses) {
	const payloads = Array.isArray(result.payloads) ? result.payloads : [];
	const outcomes = Array.isArray(result.deliveryStatus?.payloadOutcomes) ? result.deliveryStatus.payloadOutcomes : [];
	const urls = /* @__PURE__ */ new Set();
	for (const outcome of outcomes) {
		if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) continue;
		const record = outcome;
		if (!statuses(record)) continue;
		const index = typeof record.index === "number" && Number.isInteger(record.index) ? record.index : void 0;
		const payload = index === void 0 ? void 0 : payloads[index];
		if (!hasDeliverableAgentPayload(payload)) continue;
		for (const url of collectDeliveredMediaUrls({ payloads: [payload] })) urls.add(url);
	}
	return Array.from(urls);
}
function hasDeliverableAgentPayload(payload) {
	if (payload && typeof payload === "object" && !Array.isArray(payload)) {
		if (payload.visible === false) return false;
	}
	return hasVisibleAgentPayload({ payloads: [payload] }, {
		includeErrorPayloads: false,
		includeReasoningPayloads: false
	});
}
function collectDeliverablePayloadMediaUrls(payloads) {
	if (!Array.isArray(payloads)) return [];
	const urls = /* @__PURE__ */ new Set();
	for (const payload of payloads) {
		if (!hasDeliverableAgentPayload(payload)) continue;
		for (const url of collectDeliveredMediaUrls({ payloads: [payload] })) urls.add(url);
	}
	return Array.from(urls);
}
/** Collect automatic-delivery media proven sent by aggregate or per-payload evidence. */
function collectAutomaticDeliveredMediaUrls(result) {
	if (Array.isArray(result.deliveryStatus?.payloadOutcomes)) return collectPayloadOutcomeMediaUrls(result, (outcome) => outcome.status === "sent" || outcome.status === "suppressed");
	return result.deliveryStatus?.status === "sent" || result.deliveryStatus?.status === "suppressed" ? collectDeliverablePayloadMediaUrls(result.payloads) : [];
}
/** Collect media whose send may have committed before a per-payload failure. */
function collectAmbiguousAutomaticMediaUrls(result) {
	return collectPayloadOutcomeMediaUrls(result, (outcome) => outcome.status === "failed" && outcome.sentBeforeError === true);
}
/** Check that a partial automatic send classifies every expected-media payload. */
function hasCompleteAutomaticMediaDeliveryOutcomeEvidence(result, expectedMediaUrls) {
	if (result.payloadsTruncated === true) return false;
	const payloads = Array.isArray(result.payloads) ? result.payloads : [];
	const outcomes = Array.isArray(result.deliveryStatus?.payloadOutcomes) ? result.deliveryStatus.payloadOutcomes : [];
	if (payloads.length === 0 || outcomes.length === 0) return false;
	const classifiedIndexes = /* @__PURE__ */ new Set();
	for (const outcome of outcomes) {
		if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) continue;
		const record = outcome;
		const index = typeof record.index === "number" && Number.isInteger(record.index) && record.index >= 0 && record.index < payloads.length ? record.index : void 0;
		const classified = record.status === "sent" || record.status === "suppressed" || record.status === "failed" && typeof record.sentBeforeError === "boolean";
		if (index !== void 0 && classified) classifiedIndexes.add(index);
	}
	const expected = new Set(expectedMediaUrls);
	return payloads.every((payload, index) => {
		return !collectDeliveredMediaUrls({ payloads: [payload] }).some((url) => expected.has(url)) || classifiedIndexes.has(index);
	});
}
function hasPositiveNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}
/** Extracts a gateway result payload when the response carries delivery evidence fields. */
function getGatewayAgentResult(response) {
	if (!response || typeof response !== "object") return null;
	const candidate = hasAgentDeliveryEvidenceShape(response) ? response : response.result;
	if (!candidate || typeof candidate !== "object" || !hasAgentDeliveryEvidenceShape(candidate)) return null;
	return candidate;
}
function hasAgentDeliveryEvidenceShape(value) {
	return "payloads" in value || "deliveryStatus" in value || "didSendViaMessagingTool" in value || "messagingToolSentTexts" in value || "messagingToolSentMediaUrls" in value || "messagingToolSentTargets" in value || "acceptedSessionSpawns" in value || "successfulCronAdds" in value || "meta" in value;
}
/** Returns whether payload metadata contains visible text, media, presentation, or channel data. */
function hasVisibleAgentPayload(result, options = {}) {
	const payloads = result.payloads;
	if (!Array.isArray(payloads)) return false;
	return payloads.some((payload) => {
		if (!payload || typeof payload !== "object") return false;
		const record = payload;
		if (options.includeErrorPayloads === false && record.isError === true) return false;
		if (options.includeReasoningPayloads === false && record.isReasoning === true) return false;
		return Boolean(hasNonEmptyString(record.text) || hasNonEmptyString(record.mediaUrl) || hasNonEmptyStringArray(record.mediaUrls) || hasVisibleAttachmentReference(record.attachments) || record.visible === true || record.presentation || record.interactive || record.channelData);
	});
}
/** Returns whether the messaging tool attempted or committed an outbound delivery. */
function hasMessagingToolDeliveryEvidence(result) {
	return result.didSendViaMessagingTool === true || hasCommittedMessagingToolDeliveryEvidence(result);
}
/** Returns whether messaging-tool metadata proves committed text, media, or target delivery. */
function hasCommittedMessagingToolDeliveryEvidence(result) {
	return hasNonEmptyStringArray(result.messagingToolSentTexts) || hasNonEmptyStringArray(result.messagingToolSentMediaUrls) || hasNonEmptyArray(result.messagingToolSentTargets);
}
function collectNonEmptyStringArray(value) {
	return Array.isArray(value) ? value.flatMap((item) => typeof item === "string" && item.trim() ? [item.trim()] : []) : [];
}
function hasUnaccountedStrings(aggregate, accounted) {
	const remaining = /* @__PURE__ */ new Map();
	for (const value of accounted) remaining.set(value, (remaining.get(value) ?? 0) + 1);
	for (const value of aggregate) {
		const count = remaining.get(value) ?? 0;
		if (count === 0) return true;
		if (count === 1) remaining.delete(value);
		else remaining.set(value, count - 1);
	}
	return false;
}
/** Returns whether aggregate message-tool sends lack route-checkable target records. */
function hasUnaccountedMessagingToolAggregateEvidence(result) {
	const routeCheckableTargets = Array.isArray(result.messagingToolSentTargets) ? result.messagingToolSentTargets.flatMap((target) => {
		if (!target || typeof target !== "object" || Array.isArray(target)) return [];
		const record = target;
		return typeof record.to === "string" && record.to.trim() ? [record] : [];
	}) : [];
	const aggregateTexts = collectNonEmptyStringArray(result.messagingToolSentTexts);
	const aggregateMediaUrls = collectNonEmptyStringArray(result.messagingToolSentMediaUrls);
	const accountedTexts = routeCheckableTargets.flatMap((target) => typeof target.text === "string" && target.text.trim() ? [target.text.trim()] : []);
	const accountedMediaUrls = routeCheckableTargets.flatMap((target) => collectNonEmptyStringArray(target.mediaUrls));
	if (hasUnaccountedStrings(aggregateTexts, accountedTexts) || hasUnaccountedStrings(aggregateMediaUrls, accountedMediaUrls)) return true;
	return result.didSendViaMessagingTool === true && routeCheckableTargets.length === 0 && aggregateTexts.length === 0 && aggregateMediaUrls.length === 0;
}
/** Returns whether messaging-tool metadata proves a user-visible committed delivery. */
function hasVisibleCommittedMessagingToolDeliveryEvidence(result) {
	return hasNonEmptyStringArray(result.messagingToolSentTexts) || hasNonEmptyStringArray(result.messagingToolSentMediaUrls) || Array.isArray(result.messagingToolSentTargets) && result.messagingToolSentTargets.some(hasVisibleMessagingToolTarget);
}
function hasGranularMessagingToolDeliveryEvidence(result) {
	return result.messagingToolSentTexts !== void 0 || result.messagingToolSentMediaUrls !== void 0 || result.messagingToolSentTargets !== void 0;
}
/** Returns whether a source reply was visibly delivered through the message tool. */
function hasCommittedSourceReplyDeliveryEvidence(result) {
	return result.didDeliverSourceReplyViaMessageTool === true || hasVisibleAgentPayload({ payloads: result.messagingToolSourceReplyPayloads });
}
/** Returns whether outbound metadata proves a visible message, spawn, or cron side effect. */
function hasVisibleOutboundDeliveryEvidence(result) {
	return hasVisibleCommittedMessagingToolDeliveryEvidence(result) || result.didSendViaMessagingTool === true && !hasGranularMessagingToolDeliveryEvidence(result) || Array.isArray(result.acceptedSessionSpawns) && hasAcceptedSessionSpawn(result.acceptedSessionSpawns) || hasPositiveNumber(result.successfulCronAdds);
}
/** Returns whether committed outbound evidence makes replay unsafe. */
function hasCommittedOutboundDeliveryEvidence(result) {
	return hasMessagingToolDeliveryEvidence(result) || Array.isArray(result.acceptedSessionSpawns) && hasAcceptedSessionSpawn(result.acceptedSessionSpawns) || hasPositiveNumber(result.successfulCronAdds);
}
/** Returns whether any tool progress or outbound side effect makes a retry unsafe. */
function hasOutboundDeliveryEvidence(result) {
	return hasCommittedOutboundDeliveryEvidence(result) || hasPositiveNumber(result.meta?.toolSummary?.calls);
}
/** Formats an agent-command delivery failure message from delivery status metadata. */
function getAgentCommandDeliveryFailure(result) {
	const status = result.deliveryStatus?.status;
	if (status !== "failed" && status !== "partial_failed") return;
	const message = result.deliveryStatus?.errorMessage;
	if (hasNonEmptyString(message)) return message;
	return status === "partial_failed" ? "agent delivery partially failed" : "agent delivery failed";
}
//#endregion
Object.defineProperty(exports, "collectAmbiguousAutomaticMediaUrls", {
	enumerable: true,
	get: function() {
		return collectAmbiguousAutomaticMediaUrls;
	}
});
Object.defineProperty(exports, "collectAutomaticDeliveredMediaUrls", {
	enumerable: true,
	get: function() {
		return collectAutomaticDeliveredMediaUrls;
	}
});
Object.defineProperty(exports, "collectDeliveredMediaUrls", {
	enumerable: true,
	get: function() {
		return collectDeliveredMediaUrls;
	}
});
Object.defineProperty(exports, "collectMessagingToolDeliveredMediaUrls", {
	enumerable: true,
	get: function() {
		return collectMessagingToolDeliveredMediaUrls;
	}
});
Object.defineProperty(exports, "createSourceDeliveryPlan", {
	enumerable: true,
	get: function() {
		return createSourceDeliveryPlan;
	}
});
Object.defineProperty(exports, "getAgentCommandDeliveryFailure", {
	enumerable: true,
	get: function() {
		return getAgentCommandDeliveryFailure;
	}
});
Object.defineProperty(exports, "getGatewayAgentResult", {
	enumerable: true,
	get: function() {
		return getGatewayAgentResult;
	}
});
Object.defineProperty(exports, "hasAcceptedSessionSpawn", {
	enumerable: true,
	get: function() {
		return hasAcceptedSessionSpawn;
	}
});
Object.defineProperty(exports, "hasCommittedMessagingToolDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasCommittedMessagingToolDeliveryEvidence;
	}
});
Object.defineProperty(exports, "hasCommittedOutboundDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasCommittedOutboundDeliveryEvidence;
	}
});
Object.defineProperty(exports, "hasCommittedSourceReplyDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasCommittedSourceReplyDeliveryEvidence;
	}
});
Object.defineProperty(exports, "hasCompleteAutomaticMediaDeliveryOutcomeEvidence", {
	enumerable: true,
	get: function() {
		return hasCompleteAutomaticMediaDeliveryOutcomeEvidence;
	}
});
Object.defineProperty(exports, "hasCompletedSourceReplyDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasCompletedSourceReplyDeliveryEvidence;
	}
});
Object.defineProperty(exports, "hasCompletedTerminalDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasCompletedTerminalDeliveryEvidence;
	}
});
Object.defineProperty(exports, "hasMessagingToolDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasMessagingToolDeliveryEvidence;
	}
});
Object.defineProperty(exports, "hasOutboundDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasOutboundDeliveryEvidence;
	}
});
Object.defineProperty(exports, "hasUnaccountedMessagingToolAggregateEvidence", {
	enumerable: true,
	get: function() {
		return hasUnaccountedMessagingToolAggregateEvidence;
	}
});
Object.defineProperty(exports, "hasVisibleAgentPayload", {
	enumerable: true,
	get: function() {
		return hasVisibleAgentPayload;
	}
});
Object.defineProperty(exports, "hasVisibleCommittedMessagingToolDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasVisibleCommittedMessagingToolDeliveryEvidence;
	}
});
Object.defineProperty(exports, "hasVisibleOutboundDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return hasVisibleOutboundDeliveryEvidence;
	}
});
Object.defineProperty(exports, "normalizeAcceptedSessionSpawnResult", {
	enumerable: true,
	get: function() {
		return normalizeAcceptedSessionSpawnResult;
	}
});
Object.defineProperty(exports, "resolveExplicitFinalSourceReplyDeliveryEvidence", {
	enumerable: true,
	get: function() {
		return resolveExplicitFinalSourceReplyDeliveryEvidence;
	}
});
Object.defineProperty(exports, "resolveSourceDeliveryOutcome", {
	enumerable: true,
	get: function() {
		return resolveSourceDeliveryOutcome;
	}
});
Object.defineProperty(exports, "sourceDeliveryTargetsMatch", {
	enumerable: true,
	get: function() {
		return sourceDeliveryTargetsMatch;
	}
});
