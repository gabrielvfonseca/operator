const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_deliver = require("./deliver-1KcHW32R.cjs");
const require_delivery_recovery_shared = require("./delivery-recovery.shared-BWzaN0lD.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/channels/message/receipt.ts
/**
* Channel message receipt normalization.
*
* Builds stable receipts from platform send results and nested adapter receipt data.
*/
function resolveReceiptMessageId(result) {
	return result.messageId || result.chatId || result.channelId || result.roomId || result.conversationId || result.toJid || result.pollId;
}
function hasNestedReceiptData(receipt) {
	return Boolean(receipt && (receipt.parts.length > 0 || receipt.platformMessageIds.length > 0 || receipt.primaryPlatformMessageId));
}
function appendUnique(values, value) {
	const normalized = value?.trim();
	if (normalized && !values.includes(normalized)) values.push(normalized);
}
/** Builds one normalized receipt from platform send results or nested adapter receipts. */
function createMessageReceiptFromOutboundResults(params) {
	const parts = params.results.flatMap((result, resultIndex) => {
		if (hasNestedReceiptData(result.receipt)) {
			if (result.receipt.parts.length === 0) return result.receipt.platformMessageIds.map((platformMessageId, partIndex) => ({
				platformMessageId,
				kind: params.kind ?? "unknown",
				index: partIndex,
				...params.threadId ? { threadId: params.threadId } : {},
				...params.replyToId ? { replyToId: params.replyToId } : {}
			}));
			const hasPartReplyMetadata = result.receipt.parts.some((part) => part.replyToId);
			return result.receipt.parts.map((part, partIndex) => ({
				...part,
				index: part.index ?? partIndex,
				...part.threadId || !params.threadId ? {} : { threadId: params.threadId },
				...part.replyToId || !params.replyToId || hasPartReplyMetadata ? {} : { replyToId: params.replyToId }
			}));
		}
		const platformMessageId = resolveReceiptMessageId(result);
		if (!platformMessageId) return [];
		return [{
			platformMessageId,
			kind: params.kind ?? "unknown",
			index: resultIndex,
			...params.threadId ? { threadId: params.threadId } : {},
			...params.replyToId ? { replyToId: params.replyToId } : {},
			raw: result
		}];
	});
	const platformMessageIds = [];
	for (const result of params.results) {
		if (hasNestedReceiptData(result.receipt)) {
			appendUnique(platformMessageIds, result.receipt.primaryPlatformMessageId);
			for (const platformMessageId of result.receipt.platformMessageIds) appendUnique(platformMessageIds, platformMessageId);
			for (const part of result.receipt.parts) appendUnique(platformMessageIds, part.platformMessageId);
			continue;
		}
		appendUnique(platformMessageIds, resolveReceiptMessageId(result));
	}
	const firstNestedReceipt = params.results.find((result) => hasNestedReceiptData(result.receipt))?.receipt;
	return {
		...platformMessageIds[0] ? { primaryPlatformMessageId: platformMessageIds[0] } : {},
		platformMessageIds,
		parts,
		...params.threadId ?? firstNestedReceipt?.threadId ? { threadId: params.threadId ?? firstNestedReceipt?.threadId } : {},
		...params.replyToId ?? firstNestedReceipt?.replyToId ? { replyToId: params.replyToId ?? firstNestedReceipt?.replyToId } : {},
		sentAt: params.sentAt ?? firstNestedReceipt?.sentAt ?? Date.now(),
		raw: params.results
	};
}
/** Lists unique platform message ids in receipt order. */
function listMessageReceiptPlatformIds(receipt) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(receipt.platformMessageIds);
}
//#endregion
//#region src/channels/message/live.ts
/** Creates the initial live-message state, optionally seeded with an existing preview receipt. */
function createLiveMessageState(params) {
	return {
		phase: params?.receipt ? "previewing" : "idle",
		canFinalizeInPlace: params?.canFinalizeInPlace ?? Boolean(params?.receipt),
		...params?.receipt ? { receipt: params.receipt } : {},
		...params?.lastRendered ? { lastRendered: params.lastRendered } : {}
	};
}
/** Records the latest rendered preview batch and moves the live message into previewing state. */
function markLiveMessagePreviewUpdated(state, rendered) {
	return {
		...state,
		phase: "previewing",
		lastRendered: rendered
	};
}
//#endregion
//#region src/channels/message/send.ts
const log = require_subsystem.createSubsystemLogger("channels/message/send");
function serializeDurableMessagePayloadOutcomes(outcomes, options) {
	if (!outcomes || outcomes.length === 0) return;
	return outcomes.map((outcome) => {
		if (outcome.status === "sent") return {
			index: outcome.index,
			status: "sent",
			resultCount: outcome.results.length
		};
		if (outcome.status === "suppressed") return {
			index: outcome.index,
			status: "suppressed",
			reason: outcome.reason,
			...options?.includeHookEffect === true && outcome.hookEffect ? { hookEffect: outcome.hookEffect } : {}
		};
		return {
			index: outcome.index,
			status: "failed",
			error: require_errors.formatErrorMessage(outcome.error),
			sentBeforeError: outcome.sentBeforeError,
			stage: outcome.stage
		};
	});
}
const neverAbortedSignal = new AbortController().signal;
function toDurableMessageIntent(intent, renderedBatch) {
	return {
		id: intent.id,
		channel: intent.channel,
		to: intent.to,
		...intent.accountId ? { accountId: intent.accountId } : {},
		durability: intent.queuePolicy === "required" ? "required" : "best_effort",
		renderedBatch
	};
}
function toDurablePayloadOutcome(outcome) {
	return outcome;
}
function toDurablePayloadOutcomes(outcomes) {
	return outcomes.map((outcome) => toDurablePayloadOutcome(outcome));
}
async function withDurableMessageSendContext(params, run) {
	let deliveryIntent;
	const { attempt, durability, onDeleteReceipt, onDeliveryIntent, onEditReceipt, onCommitReceipt, onPreviewUpdate, onSendFailure, onPayloadDeliveryOutcome, payloads, preview, previousReceipt, signal, abortSignal, ...deliveryParams } = params;
	const effectiveSignal = signal ?? abortSignal;
	const queuePolicy = durability === "best_effort" ? "best_effort" : "required";
	let liveState = preview ?? createLiveMessageState();
	const ctx = {
		id: `${params.channel}:${params.to}`,
		channel: params.channel,
		to: params.to,
		...params.accountId ? { accountId: params.accountId } : {},
		durability: durability ?? "required",
		attempt: attempt ?? 1,
		signal: effectiveSignal ?? neverAbortedSignal,
		...previousReceipt ? { previousReceipt } : {},
		preview: liveState,
		render: async () => require_deliver.createRenderedMessageBatch(payloads),
		previewUpdate: async (rendered) => {
			liveState = onPreviewUpdate ? await onPreviewUpdate(rendered, liveState) : markLiveMessagePreviewUpdated(liveState, rendered);
			ctx.preview = liveState;
			return liveState;
		},
		send: async (rendered) => {
			const payloadOutcomes = [];
			const durablePayloadOutcomes = () => toDurablePayloadOutcomes(payloadOutcomes);
			try {
				const results = await require_deliver.deliverOutboundPayloadsInternal({
					...deliveryParams,
					payloads: rendered.payloads,
					renderedBatchPlan: rendered.plan,
					queuePolicy,
					...effectiveSignal ? { abortSignal: effectiveSignal } : {},
					onPayloadDeliveryOutcome: (outcome) => {
						payloadOutcomes.push(outcome);
						onPayloadDeliveryOutcome?.(outcome);
					},
					onDeliveryIntent: (intent) => {
						deliveryIntent = intent;
						const durableIntent = toDurableMessageIntent(intent, rendered);
						ctx.intent = durableIntent;
						onDeliveryIntent?.(durableIntent);
					}
				});
				const receipt = createMessageReceiptFromOutboundResults({
					results,
					threadId: params.threadId == null ? void 0 : String(params.threadId),
					replyToId: params.replyToId ?? void 0
				});
				const failedOutcome = payloadOutcomes.find((outcome) => outcome.status === "failed");
				if (failedOutcome) {
					if (results.length > 0) return {
						status: "partial_failed",
						results,
						receipt,
						error: failedOutcome.error,
						sentBeforeError: true,
						...deliveryIntent ? { deliveryIntent } : {},
						...payloadOutcomes.length > 0 ? { payloadOutcomes: durablePayloadOutcomes() } : {}
					};
					return {
						status: "failed",
						error: failedOutcome.error,
						stage: failedOutcome.stage,
						...payloadOutcomes.length > 0 ? { payloadOutcomes: durablePayloadOutcomes() } : {}
					};
				}
				if (results.length === 0) return {
					status: "suppressed",
					results: [],
					receipt,
					...deliveryIntent ? { deliveryIntent } : {},
					reason: payloadOutcomes.find((outcome) => outcome.status === "suppressed")?.reason ?? "no_visible_result",
					...payloadOutcomes.length > 0 ? { payloadOutcomes: durablePayloadOutcomes() } : {}
				};
				return {
					status: "sent",
					results,
					receipt,
					...deliveryIntent ? { deliveryIntent } : {},
					...payloadOutcomes.length > 0 ? { payloadOutcomes: durablePayloadOutcomes() } : {}
				};
			} catch (error) {
				if (require_delivery_recovery_shared.isOutboundDeliveryError(error)) {
					if (error.results.length > 0) {
						const receipt = createMessageReceiptFromOutboundResults({
							results: error.results,
							threadId: params.threadId == null ? void 0 : String(params.threadId),
							replyToId: params.replyToId ?? void 0
						});
						return {
							status: "partial_failed",
							results: error.results,
							receipt,
							error,
							sentBeforeError: true,
							...deliveryIntent ? { deliveryIntent } : {},
							...error.payloadOutcomes.length > 0 ? { payloadOutcomes: toDurablePayloadOutcomes(error.payloadOutcomes) } : {}
						};
					}
					return {
						status: "failed",
						error,
						stage: error.stage,
						...error.payloadOutcomes.length > 0 ? { payloadOutcomes: toDurablePayloadOutcomes(error.payloadOutcomes) } : {}
					};
				}
				return {
					status: "failed",
					error
				};
			}
		},
		edit: async (receipt, rendered) => {
			if (!onEditReceipt) throw new Error("message send context edit is not configured");
			const editedReceipt = await onEditReceipt(receipt, rendered);
			liveState = {
				...liveState,
				receipt: editedReceipt,
				lastRendered: rendered
			};
			ctx.preview = liveState;
			return editedReceipt;
		},
		delete: async (receipt) => {
			if (!onDeleteReceipt) throw new Error("message send context delete is not configured");
			await onDeleteReceipt(receipt);
		},
		commit: async (receipt) => {
			await onCommitReceipt?.(receipt);
		},
		fail: async (error) => {
			try {
				await onSendFailure?.(error);
			} catch (cleanupError) {
				log.warn(`message send failure cleanup failed; preserving original send error: ${require_errors.formatErrorMessage(cleanupError)}`);
			}
		}
	};
	try {
		return await run(ctx);
	} catch (error) {
		await ctx.fail(error);
		throw error;
	}
}
async function sendDurableMessageBatch(params) {
	return await withDurableMessageSendContext(params, async (ctx) => {
		const rendered = await ctx.render();
		const result = await ctx.send(rendered);
		if (result.status === "sent" || result.status === "suppressed") await ctx.commit(result.receipt);
		else await ctx.fail(result.error);
		return result;
	});
}
//#endregion
//#region src/channels/message/runtime.ts
var runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	sendDurableMessageBatch: () => sendDurableMessageBatch,
	serializeDurableMessagePayloadOutcomes: () => serializeDurableMessagePayloadOutcomes,
	withDurableMessageSendContext: () => withDurableMessageSendContext
});
//#endregion
Object.defineProperty(exports, "createMessageReceiptFromOutboundResults", {
	enumerable: true,
	get: function() {
		return createMessageReceiptFromOutboundResults;
	}
});
Object.defineProperty(exports, "listMessageReceiptPlatformIds", {
	enumerable: true,
	get: function() {
		return listMessageReceiptPlatformIds;
	}
});
Object.defineProperty(exports, "runtime_exports", {
	enumerable: true,
	get: function() {
		return runtime_exports;
	}
});
Object.defineProperty(exports, "sendDurableMessageBatch", {
	enumerable: true,
	get: function() {
		return sendDurableMessageBatch;
	}
});
Object.defineProperty(exports, "serializeDurableMessagePayloadOutcomes", {
	enumerable: true,
	get: function() {
		return serializeDurableMessagePayloadOutcomes;
	}
});
