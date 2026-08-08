const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_hook_helpers = require("./hook-helpers-B7eHTW1w.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_lanes = require("./lanes-Bdd4iV5N.cjs");
const require_user_turn_transcript = require("./user-turn-transcript-Dn526zAI.cjs");
const require_route_reply = require("./route-reply-SQzoK-SZ.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/utils/queue-helpers.ts
/**
* Shared queue overflow, debounce, and collection helpers.
*
* Queue owners use these helpers to cap pending work, summarize dropped items,
* debounce drains, and force individual collection when cross-channel ordering matters.
*/
/** Build a summary prompt preview without mutating the source queue state. */
function previewQueueSummaryPrompt(params) {
	return buildQueueSummaryPrompt({
		state: params.state,
		noun: params.noun,
		title: params.title
	});
}
/** Apply runtime queue settings while preserving previous values for omitted fields. */
function applyQueueRuntimeSettings(params) {
	params.target.mode = params.settings.mode;
	params.target.debounceMs = typeof params.settings.debounceMs === "number" ? Math.max(0, params.settings.debounceMs) : params.target.debounceMs;
	params.target.cap = typeof params.settings.cap === "number" && params.settings.cap > 0 ? Math.floor(params.settings.cap) : params.target.cap;
	params.target.dropPolicy = params.settings.dropPolicy ?? params.target.dropPolicy;
}
/** Trim queue summary text to a bounded single-line preview. */
function elideQueueText(text, limit = 140) {
	if (text.length <= limit) return text;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, Math.max(0, limit - 1)).trimEnd()}…`;
}
/** Normalize whitespace and elide one dropped item for queue summaries. */
function buildQueueSummaryLine(text, limit = 160) {
	return elideQueueText(text.replace(/\s+/g, " ").trim(), limit);
}
/** Run optional duplicate detection before an item enters a queue. */
function shouldSkipQueueItem(params) {
	if (!params.dedupe) return false;
	return params.dedupe(params.item, params.items);
}
/** Count identities that are still pending in the queue, excluding active deliveries. */
function countPendingQueueItems(items, inFlight) {
	if (!inFlight || inFlight.size === 0) return items.length;
	return items.reduce((count, item) => count + (inFlight.has(item) ? 0 : 1), 0);
}
/** Apply overflow policy before enqueueing another item. */
function applyQueueDropPolicy(params) {
	const cap = params.queue.cap;
	const pendingCount = countPendingQueueItems(params.queue.items, params.inFlight);
	if (cap <= 0 || pendingCount < cap) return true;
	if (params.queue.dropPolicy === "new") return false;
	const dropCount = pendingCount - cap + 1;
	const victimIndices = [];
	for (const [index, item] of params.queue.items.entries()) {
		if (params.inFlight?.has(item) || params.isProtected?.(item) === true) continue;
		victimIndices.push(index);
		if (victimIndices.length === dropCount) break;
	}
	if (victimIndices.length < dropCount) return false;
	const dropped = [];
	for (let i = victimIndices.length - 1; i >= 0; i -= 1) dropped.unshift(...params.queue.items.splice((0, _gabrielvfonseca_normalization_core.expectDefined)(victimIndices[i], "victim indices entry at i"), 1));
	params.onDrop?.(dropped);
	if (params.queue.dropPolicy === "summarize") {
		for (const item of dropped) {
			params.queue.droppedCount += 1;
			params.queue.summaryLines.push(buildQueueSummaryLine(params.summarize(item)));
		}
		const limit = Math.max(0, params.summaryLimit ?? cap);
		while (params.queue.summaryLines.length > limit) params.queue.summaryLines.shift();
	}
	return true;
}
/** Wait until the queue has been quiet for its debounce window. */
function waitForQueueDebounce(queue, abortSignal) {
	if (process.env.OPERATOR_TEST_FAST === "1") return Promise.resolve();
	const debounceMs = Math.max(0, queue.debounceMs);
	if (debounceMs <= 0) return Promise.resolve();
	if (abortSignal?.aborted) return Promise.resolve();
	return new Promise((resolve) => {
		let settled = false;
		let timer;
		const finish = () => {
			if (settled) return;
			settled = true;
			if (timer !== void 0) clearTimeout(timer);
			abortSignal?.removeEventListener("abort", finish);
			resolve();
		};
		const check = () => {
			if (abortSignal?.aborted) {
				finish();
				return;
			}
			const since = Date.now() - queue.lastEnqueuedAt;
			if (since >= debounceMs) {
				finish();
				return;
			}
			timer = setTimeout(check, debounceMs - since);
		};
		abortSignal?.addEventListener("abort", finish, { once: true });
		check();
	});
}
/** Mark one queue as draining unless another drain is already active. */
function beginQueueDrain(map, key) {
	const queue = map.get(key);
	if (!queue || queue.draining) return;
	queue.draining = true;
	return queue;
}
function removeQueuedItemsByRef(items, processed) {
	for (const item of processed) {
		const idx = items.indexOf(item);
		if (idx !== -1) items.splice(idx, 1);
	}
}
/** Run and remove the next queued item, returning false when empty. */
async function drainNextQueueItem(items, run, options) {
	const next = items[0];
	if (!next) return false;
	options?.inFlight?.add(next);
	try {
		await run(next);
		removeQueuedItemsByRef(items, [next]);
	} catch (error) {
		if (!(options?.shouldRestoreOnError?.(next) ?? true)) {
			removeQueuedItemsByRef(items, [next]);
			options?.onDiscard?.(next);
		}
		throw error;
	} finally {
		options?.inFlight?.delete(next);
	}
	return true;
}
/** Drain one item when collect mode requires individual processing. */
async function drainCollectItemIfNeeded(params) {
	if (!params.forceIndividualCollect && !params.isCrossChannel) return "skipped";
	if (params.isCrossChannel) params.setForceIndividualCollect?.(true);
	return await drainNextQueueItem(params.items, params.run, params.reserveOptions) ? "drained" : "empty";
}
/** Drain one collect step using mutable queue collection state. */
async function drainCollectQueueStep(params) {
	return await drainCollectItemIfNeeded({
		forceIndividualCollect: params.collectState.forceIndividualCollect,
		isCrossChannel: params.isCrossChannel,
		setForceIndividualCollect: (next) => {
			params.collectState.forceIndividualCollect = next;
		},
		items: params.items,
		run: params.run,
		reserveOptions: params.reserveOptions
	});
}
/** Build the queue overflow summary prompt. */
function buildQueueSummaryPrompt(params) {
	if (params.state.dropPolicy !== "summarize" || params.state.droppedCount <= 0) return;
	const noun = params.noun;
	const lines = [params.title ?? `[Queue overflow] Dropped ${params.state.droppedCount} ${noun}${params.state.droppedCount === 1 ? "" : "s"} due to cap.`];
	if (params.state.summaryLines.length > 0) {
		lines.push("Summary:");
		for (const line of params.state.summaryLines) lines.push(`- ${line}`);
	}
	return lines.join("\n");
}
/** Render a collect prompt from queued items and optional overflow summary. */
function buildCollectPrompt(params) {
	const blocks = [params.title];
	if (params.summary) blocks.push(params.summary);
	params.items.forEach((item, idx) => {
		blocks.push(params.renderItem(item, idx));
	});
	return blocks.join("\n\n");
}
/** Return true when queued items span keys or explicitly mark cross-channel state. */
function hasCrossChannelItems(items, resolveKey) {
	const keys = /* @__PURE__ */ new Set();
	for (const item of items) {
		const resolved = resolveKey(item);
		if (resolved.cross) return true;
		if (!resolved.key) continue;
		keys.add(resolved.key);
	}
	return keys.size > 1;
}
//#endregion
//#region src/auto-reply/reply/queue/types.ts
var FollowupRunDeferredError = class extends Error {
	constructor(message = "Follow-up run deferred") {
		super(message);
		this.name = "FollowupRunDeferredError";
	}
};
function isFollowupRunDeferredError(error) {
	return error instanceof FollowupRunDeferredError;
}
function isFollowupRunAborted(run) {
	return run.abortSignal?.aborted === true || run.queueAbortSignal?.aborted === true;
}
function resolveFollowupAbortSignal(run) {
	const signals = [run.abortSignal, run.queueAbortSignal].filter((signal) => signal !== void 0);
	return signals.length > 1 ? AbortSignal.any(signals) : signals[0];
}
const enqueuedFollowupLifecycles = /* @__PURE__ */ new WeakSet();
const admittedFollowupLifecycles = /* @__PURE__ */ new WeakSet();
const admittingFollowupLifecycles = /* @__PURE__ */ new WeakMap();
const retiredFollowupCancellationLifecycles = /* @__PURE__ */ new WeakSet();
const completedFollowupLifecycles = /* @__PURE__ */ new WeakSet();
const completedFollowupLifecycleCallbacks = /* @__PURE__ */ new WeakSet();
function markFollowupRunEnqueued(run) {
	const lifecycle = run.queuedLifecycle;
	if (!lifecycle || enqueuedFollowupLifecycles.has(lifecycle)) return true;
	if (lifecycle.onEnqueued?.() === false) return false;
	enqueuedFollowupLifecycles.add(lifecycle);
	return true;
}
function retireFollowupRunCancellation(run) {
	const lifecycle = run.queuedLifecycle;
	if (!lifecycle || retiredFollowupCancellationLifecycles.has(lifecycle)) return;
	retiredFollowupCancellationLifecycles.add(lifecycle);
	lifecycle.onCancellationRetired?.();
}
async function admitFollowupRunLifecycle(run) {
	const lifecycle = run.queuedLifecycle;
	if (!lifecycle || admittedFollowupLifecycles.has(lifecycle)) return;
	const existing = admittingFollowupLifecycles.get(lifecycle);
	if (existing) {
		await existing;
		return;
	}
	if (completedFollowupLifecycles.has(lifecycle)) throw new Error("followup run lifecycle completed before admission");
	const admission = Promise.resolve().then(async () => await lifecycle.onAdmitted?.()).then(() => {
		admittedFollowupLifecycles.add(lifecycle);
	});
	admittingFollowupLifecycles.set(lifecycle, admission);
	try {
		await admission;
	} finally {
		admittingFollowupLifecycles.delete(lifecycle);
	}
}
function completeFollowupRunLifecycle(run) {
	const lifecycle = run.queuedLifecycle;
	if (!lifecycle || completedFollowupLifecycles.has(lifecycle)) return;
	completedFollowupLifecycles.add(lifecycle);
	const finish = () => {
		if (completedFollowupLifecycleCallbacks.has(lifecycle)) return;
		completedFollowupLifecycleCallbacks.add(lifecycle);
		lifecycle.onComplete?.();
	};
	const admission = admittingFollowupLifecycles.get(lifecycle);
	if (!admission) {
		finish();
		return;
	}
	admission.then(finish, finish).catch(() => {});
}
const DEFAULT_QUEUE_DROP = "summarize";
/**
* Share followup queues across bundled chunks so busy-session enqueue/drain
* logic observes one queue registry per process.
*/
const FOLLOWUP_QUEUES_KEY = Symbol.for("operator.followupQueues");
const FOLLOWUP_QUEUES = require_global_singleton.resolveGlobalMap(FOLLOWUP_QUEUES_KEY);
function getExistingFollowupQueue(key) {
	const cleaned = key.trim();
	if (!cleaned) return;
	return FOLLOWUP_QUEUES.get(cleaned);
}
function trimSummaryElisionsToCap(queue) {
	let sourceCount = queue.summaryElisions.reduce((count, entry) => count + entry.sources.filter((source) => !queue.activeSummarySources.has(source)).length, 0);
	while (sourceCount > queue.cap) {
		let evicted = false;
		for (const [entryIndex, entry] of queue.summaryElisions.entries()) {
			const sourceIndex = entry.sources.findIndex((source) => !queue.activeSummarySources.has(source));
			if (sourceIndex < 0) continue;
			const [source] = entry.sources.splice(sourceIndex, 1);
			entry.count = entry.sources.length;
			queue.evictedSummaryCount += 1;
			sourceCount -= 1;
			if (source) completeFollowupRunLifecycle(source);
			if (entry.sources.length === 0) queue.summaryElisions.splice(entryIndex, 1);
			evicted = true;
			break;
		}
		if (!evicted) return;
	}
}
function getFollowupQueue(key, settings) {
	const existing = FOLLOWUP_QUEUES.get(key);
	if (existing) {
		applyQueueRuntimeSettings({
			target: existing,
			settings
		});
		trimSummaryElisionsToCap(existing);
		return existing;
	}
	const created = {
		abortController: new AbortController(),
		items: [],
		draining: false,
		inFlight: /* @__PURE__ */ new Set(),
		lastEnqueuedAt: 0,
		mode: settings.mode,
		debounceMs: typeof settings.debounceMs === "number" ? Math.max(0, settings.debounceMs) : 500,
		cap: typeof settings.cap === "number" && settings.cap > 0 ? Math.floor(settings.cap) : 20,
		dropPolicy: settings.dropPolicy ?? "summarize",
		droppedCount: 0,
		summaryLines: [],
		summarySources: [],
		activeSummarySources: /* @__PURE__ */ new WeakSet(),
		summaryElisions: [],
		evictedSummaryCount: 0
	};
	applyQueueRuntimeSettings({
		target: created,
		settings
	});
	FOLLOWUP_QUEUES.set(key, created);
	return created;
}
function clearFollowupQueue(key) {
	const cleaned = key.trim();
	const queue = getExistingFollowupQueue(cleaned);
	if (!queue) return 0;
	queue.abortController.abort();
	const cleared = queue.items.length + queue.droppedCount;
	for (const item of queue.items) completeFollowupRunLifecycle(item);
	for (const item of queue.summarySources) completeFollowupRunLifecycle(item);
	for (const entry of queue.summaryElisions) for (const source of entry.sources) completeFollowupRunLifecycle(source);
	queue.items.length = 0;
	queue.inFlight.clear();
	queue.droppedCount = 0;
	queue.summaryLines = [];
	queue.summarySources = [];
	queue.summaryElisions = [];
	queue.evictedSummaryCount = 0;
	queue.lastRun = void 0;
	queue.lastEnqueuedAt = 0;
	FOLLOWUP_QUEUES.delete(cleaned);
	return cleared;
}
function refreshQueuedFollowupSession(params) {
	const cleaned = params.key.trim();
	if (!cleaned) return;
	const queue = getExistingFollowupQueue(cleaned);
	if (!queue) return;
	const shouldRewriteSession = Boolean(params.previousSessionId) && Boolean(params.nextSessionId) && params.previousSessionId !== params.nextSessionId;
	const shouldRewriteModelSelection = typeof params.nextProvider === "string" || typeof params.nextModel === "string" || Object.hasOwn(params, "nextModelOverrideSource");
	const shouldRewriteSelection = shouldRewriteModelSelection || Object.hasOwn(params, "nextAuthProfileId") || Object.hasOwn(params, "nextAuthProfileIdSource") || params.nextThinking !== void 0;
	if (!shouldRewriteSession && !shouldRewriteSelection) return;
	const rewriteRun = (run) => {
		if (!run) return;
		if (shouldRewriteSession && run.sessionId === params.previousSessionId) {
			run.sessionId = params.nextSessionId;
			const nextSessionFile = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.nextSessionFile);
			if (nextSessionFile) run.sessionFile = nextSessionFile;
		}
		if (shouldRewriteSelection) {
			if (typeof params.nextProvider === "string") run.provider = params.nextProvider;
			if (typeof params.nextModel === "string") run.model = params.nextModel;
			if (shouldRewriteModelSelection) delete run.hasAutoFallbackProvenance;
			if (Object.hasOwn(params, "nextModelOverrideSource")) {
				run.hasSessionModelOverride = Boolean(run.provider || run.model);
				run.modelOverrideSource = params.nextModelOverrideSource;
			}
			if (Object.hasOwn(params, "nextAuthProfileId")) run.authProfileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.nextAuthProfileId);
			if (Object.hasOwn(params, "nextAuthProfileIdSource")) run.authProfileIdSource = run.authProfileId ? params.nextAuthProfileIdSource : void 0;
			if (params.nextThinking) {
				const explicitLevel = require_thinking.normalizeThinkLevel(params.nextThinking.level);
				run.thinkLevel = explicitLevel ? require_thinking.resolveSupportedThinkingLevel({
					provider: run.provider,
					model: run.model,
					level: explicitLevel,
					catalog: params.nextThinking.catalog,
					agentRuntime: params.nextThinking.agentRuntime
				}) : require_thinking.resolveThinkingDefaultForModel({
					provider: run.provider,
					model: run.model,
					catalog: params.nextThinking.catalog,
					agentRuntime: params.nextThinking.agentRuntime
				});
			}
		}
	};
	rewriteRun(queue.lastRun);
	for (const item of queue.items) rewriteRun(item.run);
	for (const item of queue.summarySources) rewriteRun(item.run);
	for (const entry of queue.summaryElisions) for (const source of entry.sources) rewriteRun(source.run);
}
//#endregion
//#region src/auto-reply/reply/queue/drain.ts
const FOLLOWUP_RUN_CALLBACKS = require_global_singleton.resolveGlobalMap(Symbol.for("operator.followupDrainCallbacks"));
const queuedAdmissionOwnerState = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.queuedAdmissionOwnerState"), () => ({
	keys: /* @__PURE__ */ new WeakMap(),
	nextId: 1
}));
function resolveQueuedLifecycleDeliveryKey(lifecycle) {
	if (!lifecycle) return "";
	const explicitOwnerKey = lifecycle.ownerKey ?? "";
	if (!lifecycle.onAdmitted) return explicitOwnerKey;
	let admissionOwnerKey = queuedAdmissionOwnerState.keys.get(lifecycle);
	if (!admissionOwnerKey) {
		admissionOwnerKey = `admission:${queuedAdmissionOwnerState.nextId++}`;
		queuedAdmissionOwnerState.keys.set(lifecycle, admissionOwnerKey);
	}
	return JSON.stringify([explicitOwnerKey, admissionOwnerKey]);
}
function assertSingleAdmissionOwner(items) {
	if (new Set(items.flatMap((item) => item.queuedLifecycle?.onAdmitted ? [item.queuedLifecycle] : [])).size > 1) throw new Error("followup queue cannot aggregate distinct admission lifecycles");
}
function rememberFollowupDrainCallback(key, runFollowup) {
	FOLLOWUP_RUN_CALLBACKS.set(key, runFollowup);
}
function clearFollowupDrainCallback(key) {
	FOLLOWUP_RUN_CALLBACKS.delete(key);
}
/** Restart the drain for `key` if it is currently idle, using the stored callback. */
function kickFollowupDrainIfIdle(key) {
	const cb = FOLLOWUP_RUN_CALLBACKS.get(key);
	if (!cb) return;
	scheduleFollowupDrain(key, cb);
}
function resolveOriginRoutingMetadata(items) {
	const source = items.find((item) => item.originatingChannel && item.originatingTo) ?? items.find((item) => item.originatingChannel || item.originatingTo || item.originatingAccountId || item.originatingThreadId != null || item.originatingChatId || item.originatingReplyToId || item.originatingReplyToMode || item.originatingChatType);
	if (!source) return {};
	return {
		originatingChannel: source.originatingChannel,
		originatingTo: source.originatingTo,
		originatingAccountId: source.originatingAccountId,
		originatingThreadId: source.originatingThreadId,
		originatingChatId: source.originatingChatId,
		originatingReplyToId: source.originatingReplyToId,
		originatingReplyToMode: source.originatingReplyToMode,
		originatingChatType: source.originatingChatType
	};
}
function resolveFollowupAuthorizationKey(run) {
	return JSON.stringify([
		run.senderId ?? "",
		JSON.stringify(run.channelContext ?? null),
		run.senderE164 ?? "",
		run.senderIsOwner === true,
		run.execOverrides?.host ?? "",
		run.execOverrides?.security ?? "",
		run.execOverrides?.ask ?? "",
		run.execOverrides?.node ?? "",
		run.execOverrides?.nodeCwd ?? "",
		run.bashElevated?.enabled === true,
		run.bashElevated?.allowed === true,
		run.bashElevated?.defaultLevel ?? "",
		run.approvalReviewerDeviceId ?? ""
	]);
}
function resolveFollowupDeliveryContextKey(run) {
	const execution = run.run;
	const provenance = execution.inputProvenance;
	return JSON.stringify([
		require_channel_route.channelRouteDedupeKey({
			channel: run.originatingChannel,
			to: run.originatingTo,
			accountId: run.originatingAccountId,
			threadId: run.originatingThreadId
		}),
		run.originatingChatId ?? "",
		resolveFollowupReplyAnchor(run) ?? "",
		run.originatingReplyToMode ?? "",
		require_chat_type.normalizeChatType(run.originatingChatType) ?? "",
		resolveFollowupAuthorizationKey(execution),
		run.queuedLifecycle?.ownerKey ?? "",
		(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(execution.runtimePolicySessionKey ?? execution.sessionKey) ?? "",
		execution.messageProvider ?? "",
		JSON.stringify([...new Set(execution.clientCaps ?? [])].toSorted()),
		execution.chatType ?? "",
		execution.agentAccountId ?? "",
		execution.groupId ?? "",
		execution.groupChannel ?? "",
		execution.groupSpace ?? "",
		execution.spawnedBy ?? "",
		execution.traceAuthorized === true,
		execution.elevatedLevel ?? "",
		provenance?.kind ?? "",
		provenance?.originSessionId ?? "",
		provenance?.sourceSessionKey ?? "",
		provenance?.sourceChannel ?? "",
		provenance?.sourceTool ?? "",
		execution.extraSystemPrompt ?? "",
		execution.extraSystemPromptStatic ?? "",
		execution.sourceReplyDeliveryMode ?? "",
		execution.taskSuggestionDeliveryMode ?? "",
		execution.silentReplyPromptMode ?? "",
		execution.enforceFinalTag === true,
		execution.skipProviderRuntimeHints === true,
		execution.silentExpected === true,
		execution.allowEmptyAssistantReplyAsSilent === true,
		execution.suppressNextUserMessagePersistence === true,
		execution.suppressTranscriptOnlyAssistantPersistence === true,
		execution.blockReplyBreak,
		resolveQueuedLifecycleDeliveryKey(run.queuedLifecycle)
	]);
}
function resolveFollowupReplyAnchor(run) {
	if (run.originatingReplyToMode === "off") return;
	const replyToId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(run.originatingReplyToId);
	if (replyToId || require_message_channel.normalizeMessageChannel(run.originatingChannel) !== "slack") return replyToId;
	const threadId = run.originatingThreadId;
	return (typeof threadId === "number" ? Number.isFinite(threadId) : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(threadId) !== void 0) ? void 0 : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(run.messageId);
}
function splitCollectItemsByDeliveryContext(items) {
	if (items.length <= 1) return items.length === 0 ? [] : [items];
	const groups = [];
	let currentGroup = [];
	let currentKey;
	for (const item of items) {
		const itemKey = resolveFollowupDeliveryContextKey(item);
		if (currentGroup.length === 0 || itemKey === currentKey) {
			currentGroup.push(item);
			currentKey = itemKey;
			continue;
		}
		groups.push(currentGroup);
		currentGroup = [item];
		currentKey = itemKey;
	}
	if (currentGroup.length > 0) groups.push(currentGroup);
	return groups;
}
function renderCollectItem(item, idx) {
	return renderCollectItemPrompt(item, idx, item.prompt);
}
function renderCollectItemPrompt(item, idx, prompt) {
	const senderLabel = item.run.senderName ?? item.run.senderUsername ?? item.run.senderId ?? item.run.senderE164;
	const senderSuffix = senderLabel ? ` (from ${senderLabel})` : "";
	return `---\nQueued #${idx + 1}${senderSuffix}\n${prompt}`.trim();
}
function collectQueuedImages(items) {
	const images = [];
	const imageOrder = [];
	for (const item of items) {
		if (item.images) images.push(...item.images);
		if (item.imageOrder) imageOrder.push(...item.imageOrder);
	}
	return {
		...images.length > 0 ? { images } : {},
		...imageOrder.length > 0 ? { imageOrder } : {}
	};
}
function hasCurrentTurnRuntimeMetadata(item) {
	return item.currentInboundEventKind === "room_event" || item.currentInboundAudio === true || Boolean(item.currentInboundContext);
}
function hasRuntimeOnlyFollowupMetadata(item) {
	return item.currentInboundEventKind === "room_event" || item.currentInboundAudio === true;
}
function buildCollectTranscriptPrompt(items) {
	return buildCollectPrompt({
		title: "[Queued messages while agent was busy]",
		items,
		renderItem: (item, index) => renderCollectItemPrompt(item, index, item.transcriptPrompt ?? item.prompt)
	});
}
function resolveFollowupTranscriptTarget(source) {
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(source.run.sessionKey) ?? source.run.sessionId;
	const storePath = require_paths.resolveStorePath(source.run.config.session?.store, { agentId: source.run.agentId });
	const sessionEntry = require_session_accessor.loadSessionEntry({
		storePath,
		sessionKey,
		clone: false
	});
	return {
		sessionId: sessionEntry?.sessionId ?? source.run.sessionId,
		sessionKey,
		sessionEntry,
		storePath,
		agentId: source.run.agentId,
		cwd: source.run.cwd ?? source.run.workspaceDir,
		config: source.run.config
	};
}
function createCollectUserTurnTranscriptRecorder(items) {
	const transcriptSources = items.filter((item) => item.userTurnTranscriptRecorder);
	const source = transcriptSources.at(-1);
	if (!source) return;
	const buildInput = async () => {
		const messages = await Promise.all(transcriptSources.map(async (item) => await item.userTurnTranscriptRecorder?.resolveMessage()));
		const media = messages.flatMap((message) => require_user_turn_transcript.buildPersistedUserTurnMediaInputsFromFields(message));
		const timestamp = messages.reduce((latest, message) => {
			const candidate = message?.timestamp;
			return typeof candidate === "number" && (latest === void 0 || candidate > latest) ? candidate : latest;
		}, void 0);
		const transcriptPrompt = buildCollectTranscriptPrompt(transcriptSources);
		const identityHash = (0, node_crypto.createHash)("sha256").update(JSON.stringify(transcriptSources.map((item) => [
			item.messageId ?? "",
			item.enqueuedAt,
			item.transcriptPrompt
		]))).digest("hex");
		return {
			text: transcriptPrompt,
			senderIsOwner: source.run.senderIsOwner,
			provenance: source.run.inputProvenance,
			idempotencyKey: `followup-collect:${source.run.sessionId}:${identityHash}`,
			...timestamp === void 0 ? {} : { timestamp },
			...media.length === 0 ? {} : {
				media,
				mediaOnlyText: "[User sent media without caption]"
			}
		};
	};
	return require_user_turn_transcript.createUserTurnTranscriptRecorder({
		input: {
			text: buildCollectTranscriptPrompt(transcriptSources),
			senderIsOwner: source.run.senderIsOwner,
			provenance: source.run.inputProvenance
		},
		resolveInput: buildInput,
		target: () => resolveFollowupTranscriptTarget(source),
		errorContext: "collected followup user turn transcript",
		beforeMessageWrite: require_hook_helpers.runAgentHarnessBeforeMessageWriteHook
	});
}
function resolveAggregateOwner(items) {
	return items.findLast((item) => item.abortSignal) ?? items.findLast((item) => item.queuedLifecycle) ?? items.at(-1);
}
function requiresIndividualCollectDrain(item) {
	return item.disableCollectBatching === true || hasRuntimeOnlyFollowupMetadata(item);
}
function createAggregateCancellation(items) {
	const owner = resolveAggregateOwner(items);
	const sourceSignals = /* @__PURE__ */ new Map();
	for (const item of items) {
		if (!item.abortSignal) continue;
		const owners = sourceSignals.get(item.abortSignal) ?? /* @__PURE__ */ new Set();
		owners.add(item);
		sourceSignals.set(item.abortSignal, owners);
	}
	const signals = new Set(sourceSignals.keys());
	if (signals.size === 0) return {
		signal: void 0,
		admit: () => void 0,
		dispose: () => void 0
	};
	const onlySignal = signals.size === 1 ? signals.values().next().value : void 0;
	const onlySignalOwned = onlySignal && owner ? sourceSignals.get(onlySignal)?.has(owner) === true : false;
	if (onlySignal && onlySignalOwned) return {
		signal: onlySignal,
		admit: () => void 0,
		dispose: () => void 0
	};
	const controller = new AbortController();
	const listeners = /* @__PURE__ */ new Map();
	for (const signal of signals) {
		const abort = () => controller.abort();
		listeners.set(signal, abort);
		if (signal.aborted) abort();
		else signal.addEventListener("abort", abort, { once: true });
	}
	const disposeSignal = (signal) => {
		const listener = listeners.get(signal);
		if (!listener) return;
		signal.removeEventListener("abort", listener);
		listeners.delete(signal);
	};
	return {
		signal: controller.signal,
		admit: () => {
			for (const [signal, sourceOwners] of sourceSignals) if (!owner || !sourceOwners.has(owner)) disposeSignal(signal);
		},
		dispose: () => {
			for (const signal of listeners.keys()) disposeSignal(signal);
		}
	};
}
function collectCurrentInboundContext(items) {
	const contexts = items.flatMap((item, index) => item.currentInboundContext ? [{
		context: item.currentInboundContext,
		index
	}] : []);
	if (contexts.length === 0) return;
	if (contexts.length === 1) return contexts[0]?.context;
	const renderField = (field) => {
		const blocks = contexts.flatMap(({ context, index }) => {
			const value = context[field];
			return value ? [`Queued #${index + 1} context:\n${value}`] : [];
		});
		return blocks.length > 0 ? blocks.join("\n\n") : void 0;
	};
	const text = renderField("text");
	if (!text) return;
	const resumableText = renderField("resumableText");
	const injectedGoalContexts = [...new Set(contexts.flatMap(({ context }) => context.injectedGoalContexts ?? []))];
	return {
		text,
		...resumableText ? { resumableText } : {},
		promptJoiner: "\n\n",
		...injectedGoalContexts.length > 0 ? { injectedGoalContexts } : {}
	};
}
function collectRuntimeMetadata(items, abortSignal) {
	const currentTurnSource = items.find(hasCurrentTurnRuntimeMetadata);
	const deliveryCorrelations = items.flatMap((item) => item.deliveryCorrelations ?? []);
	const admissionWaitCallbacks = new Set(items.flatMap((item) => item.onReplyAdmissionWaitChange ? [item.onReplyAdmissionWaitChange] : []));
	return {
		currentInboundEventKind: currentTurnSource?.currentInboundEventKind,
		currentInboundAudio: currentTurnSource?.currentInboundAudio,
		currentInboundContext: collectCurrentInboundContext(items),
		abortSignal,
		queueAbortSignal: items.find((item) => item.queueAbortSignal)?.queueAbortSignal,
		deliveryCorrelations: deliveryCorrelations.length > 0 ? deliveryCorrelations : void 0,
		queuedLifecycle: items.length === 1 ? items[0]?.queuedLifecycle : void 0,
		onReplyAdmissionWaitChange: admissionWaitCallbacks.size > 0 ? (waiting) => {
			for (const callback of admissionWaitCallbacks) callback(waiting);
		} : void 0
	};
}
function createQueueSummaryDelivery(params) {
	const sources = params.sources ? [...params.sources] : [...params.queue.summarySources];
	if (params.sources && !sources.every((source, index) => params.queue.summarySources[index] === source)) return;
	const droppedCount = params.sources ? sources.length : params.queue.droppedCount;
	const summaryLines = params.sources ? params.queue.summaryLines.slice(0, sources.length) : [...params.queue.summaryLines];
	const prompt = previewQueueSummaryPrompt({
		state: {
			dropPolicy: params.queue.dropPolicy,
			droppedCount,
			summaryLines
		},
		noun: "message"
	});
	if (!prompt) return;
	return {
		prompt,
		droppedCount,
		sources
	};
}
function consumeQueueSummaryDelivery(queue, delivery, completeLifecycles = true) {
	let consumedCount = delivery.sources.length === 0 ? delivery.droppedCount : 0;
	for (const source of delivery.sources) {
		const sourceIndex = queue.summarySources.indexOf(source);
		if (sourceIndex >= 0) {
			queue.summarySources.splice(sourceIndex, 1);
			queue.summaryLines.splice(sourceIndex, 1);
			consumedCount += 1;
		} else {
			const elisionIndex = queue.summaryElisions.findIndex((entry) => entry.sources.includes(source) || entry.sourceRefs.has(source));
			if (elisionIndex >= 0) {
				const entry = (0, _gabrielvfonseca_normalization_core.expectDefined)(queue.summaryElisions[elisionIndex], "summary elisions entry at elision index");
				const elidedSourceIndex = entry.sources.indexOf(entry.sourceRefs.get(source) ?? source);
				entry.sources.splice(elidedSourceIndex, 1);
				entry.count = entry.sources.length;
				consumedCount += 1;
				if (entry.sources.length === 0) queue.summaryElisions.splice(elisionIndex, 1);
			}
		}
		if (completeLifecycles) completeFollowupRunLifecycle(source);
	}
	queue.droppedCount = Math.max(0, queue.droppedCount - consumedCount);
}
function releaseQueueSummaryDeliveryForRetry(queue, delivery) {
	for (const source of delivery.sources) {
		const sourceIndex = queue.summarySources.indexOf(source);
		if (sourceIndex >= 0) queue.summarySources[sourceIndex] = createOverflowSummaryRetrySource(source);
		if (!source.queuedLifecycle) completeFollowupRunLifecycle(source);
	}
}
function dropAbortedQueueSummarySources(queue) {
	let dropped = 0;
	for (let index = queue.summarySources.length - 1; index >= 0; index -= 1) {
		const source = (0, _gabrielvfonseca_normalization_core.expectDefined)(queue.summarySources[index], "summary sources entry at index");
		if (!isFollowupRunAborted(source)) continue;
		queue.summarySources.splice(index, 1);
		queue.summaryLines.splice(index, 1);
		queue.droppedCount = Math.max(0, queue.droppedCount - 1);
		completeFollowupRunLifecycle(source);
		dropped += 1;
	}
	return dropped;
}
async function runQueueSummaryDelivery(queue, delivery, run, protectedSources = delivery.sources) {
	assertSingleAdmissionOwner(protectedSources);
	const inheritedActiveSources = new Set(protectedSources.filter((source) => queue.activeSummarySources.has(source)));
	for (const source of protectedSources) queue.activeSummarySources.add(source);
	let admitted = false;
	let deferredBeforeAdmission = false;
	const cancellation = createAggregateCancellation(protectedSources);
	const onAdmitted = protectedSources.length > 1 || protectedSources.some((source) => source.queuedLifecycle?.onAdmitted) ? async () => {
		if (admitted) return;
		await Promise.all(protectedSources.map((source) => admitFollowupRunLifecycle(source)));
		cancellation.admit();
		admitted = true;
		consumeQueueSummaryDelivery(queue, {
			...delivery,
			sources: protectedSources
		}, false);
		const aggregateOwner = resolveAggregateOwner(protectedSources);
		for (const source of protectedSources) if (source !== aggregateOwner) retireFollowupRunCancellation(source);
	} : void 0;
	try {
		try {
			await run({
				abortSignal: cancellation.signal,
				onAdmitted
			});
		} catch (err) {
			if (!admitted) {
				deferredBeforeAdmission = isFollowupRunDeferredError(err);
				if (!deferredBeforeAdmission) releaseQueueSummaryDeliveryForRetry(queue, delivery);
			} else for (const source of protectedSources) completeFollowupRunLifecycle(source);
			throw err;
		}
		if (!admitted) {
			const canceledSources = protectedSources.filter(isFollowupRunAborted);
			if (canceledSources.length > 0) {
				consumeQueueSummaryDelivery(queue, {
					...delivery,
					sources: canceledSources
				});
				return false;
			}
		}
		if (!admitted) consumeQueueSummaryDelivery(queue, delivery);
		return true;
	} finally {
		cancellation.dispose();
		const deferredCarryover = deferredBeforeAdmission && inheritedActiveSources.size === 0 ? new Set(protectedSources) : inheritedActiveSources;
		for (const source of protectedSources) {
			if (deferredBeforeAdmission && deferredCarryover.has(source)) continue;
			queue.activeSummarySources.delete(source);
			for (const entry of queue.summaryElisions) {
				const compactSource = entry.sourceRefs.get(source);
				if (compactSource) queue.activeSummarySources.delete(compactSource);
			}
		}
		trimSummaryElisionsToCap(queue);
	}
}
async function dropAbortedFollowups(items, runFollowup) {
	let dropped = 0;
	for (let index = items.length - 1; index >= 0; index -= 1) {
		const item = (0, _gabrielvfonseca_normalization_core.expectDefined)(items[index], "items entry at index");
		if (isFollowupRunAborted(item)) {
			await runFollowup(item);
			completeFollowupRunLifecycle(item);
			items.splice(index, 1);
			dropped += 1;
		}
	}
	return dropped;
}
function resolveCrossChannelKey(item) {
	const { originatingChannel: channel, originatingTo: to, originatingAccountId: accountId } = item;
	const threadId = item.originatingThreadId;
	const replyToId = resolveFollowupReplyAnchor(item);
	const chatType = require_chat_type.normalizeChatType(item.originatingChatType);
	if (!channel && !to && !accountId && (threadId == null || threadId === "") && !item.originatingChatId && !replyToId) return chatType ? { key: JSON.stringify(["unresolved", chatType]) } : {};
	if (!require_route_reply.isRoutableChannel(channel) || !to) return { key: JSON.stringify([
		"local",
		channel ?? "",
		to ?? "",
		accountId ?? "",
		threadId ?? "",
		item.originatingChatId ?? "",
		replyToId ?? "",
		item.originatingReplyToMode ?? "",
		chatType ?? ""
	]) };
	const key = require_channel_route.channelRouteCompactKey({
		channel,
		to,
		accountId,
		threadId
	});
	return key ? { key: JSON.stringify([
		key,
		replyToId ?? "",
		item.originatingReplyToMode ?? "",
		chatType ?? ""
	]) } : { cross: true };
}
function resolveOverflowSummarySourceGroup(queue) {
	const source = queue.summarySources[0];
	if (!source) return [];
	const contextKey = resolveFollowupDeliveryContextKey(source);
	const sources = [];
	for (const candidate of queue.summarySources) {
		if (resolveFollowupDeliveryContextKey(candidate) !== contextKey) break;
		sources.push(candidate);
	}
	return sources;
}
async function drainProtectedPriorityFollowup(items, runFollowup) {
	const priority = items.find((item) => item.protectFromQueueOverflow === true);
	if (!priority) return false;
	await runFollowup(priority);
	removeQueuedItemsByRef(items, [priority]);
	return true;
}
function createOverflowSummaryRetrySource(source) {
	return {
		prompt: source.prompt,
		queueAbortSignal: source.queueAbortSignal,
		transcriptPrompt: source.transcriptPrompt,
		messageId: source.messageId,
		summaryLine: source.summaryLine,
		enqueuedAt: source.enqueuedAt,
		originatingChannel: source.originatingChannel,
		originatingTo: source.originatingTo,
		originatingAccountId: source.originatingAccountId,
		originatingThreadId: source.originatingThreadId,
		originatingChatId: source.originatingChatId,
		originatingReplyToId: source.originatingReplyToId,
		originatingReplyToMode: source.originatingReplyToMode,
		originatingChatType: source.originatingChatType,
		abortSignal: source.abortSignal,
		queuedLifecycle: source.queuedLifecycle,
		onReplyAdmissionWaitChange: source.onReplyAdmissionWaitChange,
		...source.currentInboundEventKind === "room_event" ? { currentInboundEventKind: "room_event" } : {},
		run: source.run
	};
}
function resolveOverflowSummaryInboundEventKind(sources) {
	return sources.length > 0 && sources.every((source) => source.currentInboundEventKind === "room_event") ? "room_event" : void 0;
}
async function runSyntheticOverflowSummary(params) {
	const promptHash = (0, node_crypto.createHash)("sha256").update(params.prompt).digest("hex");
	const routeHash = (0, node_crypto.createHash)("sha256").update(JSON.stringify([
		require_channel_route.channelRouteDedupeKey({
			channel: params.source.originatingChannel,
			to: params.source.originatingTo,
			accountId: params.source.originatingAccountId,
			threadId: params.source.originatingThreadId
		}),
		resolveFollowupReplyAnchor(params.source) ?? "",
		params.source.originatingReplyToMode ?? "",
		require_chat_type.normalizeChatType(params.source.originatingChatType) ?? ""
	])).digest("hex");
	const userTurnTranscriptRecorder = require_user_turn_transcript.createUserTurnTranscriptRecorder({
		input: {
			text: params.prompt,
			idempotencyKey: `followup-overflow:${params.source.run.sessionId}:${routeHash}:${params.source.messageId ?? params.source.enqueuedAt}:${promptHash}`,
			provenance: params.source.run.inputProvenance
		},
		target: () => resolveFollowupTranscriptTarget(params.source),
		beforeMessageWrite: require_hook_helpers.runAgentHarnessBeforeMessageWriteHook,
		errorContext: "followup overflow summary transcript"
	});
	const currentInboundEventKind = resolveOverflowSummaryInboundEventKind(params.sources);
	let admitted = false;
	await params.runFollowup({
		prompt: params.prompt,
		queueAbortSignal: params.source.queueAbortSignal,
		transcriptPrompt: params.prompt,
		messageId: params.source.messageId,
		userTurnTranscriptRecorder,
		run: params.source.run,
		enqueuedAt: Date.now(),
		abortSignal: params.abortSignal,
		onReplyAdmissionWaitChange: collectRuntimeMetadata(params.sources).onReplyAdmissionWaitChange,
		...params.onAdmitted ? { queuedLifecycle: {
			onAdmitted: async () => {
				await params.onAdmitted?.();
				admitted = true;
			},
			onComplete: () => {
				if (admitted) for (const source of params.sources) completeFollowupRunLifecycle(source);
			}
		} } : {},
		...resolveOriginRoutingMetadata([params.source]),
		...currentInboundEventKind ? { currentInboundEventKind } : {}
	});
}
async function drainElidedOverflowSummary(params) {
	const entry = params.queue.summaryElisions[0];
	if (!entry) return false;
	const retainedSources = params.queue.summaryElisions.length === 1 ? resolveOverflowSummarySourceGroup(params.queue).filter((source) => resolveFollowupDeliveryContextKey(source) === entry.contextKey) : [];
	for (let index = entry.sources.length - 1; index >= 0; index -= 1) {
		const source = (0, _gabrielvfonseca_normalization_core.expectDefined)(entry.sources[index], "sources entry at index");
		if (!isFollowupRunAborted(source)) continue;
		entry.sources.splice(index, 1);
		entry.count = Math.max(0, entry.count - 1);
		params.queue.droppedCount = Math.max(0, params.queue.droppedCount - 1);
		completeFollowupRunLifecycle(source);
	}
	if (entry.sources.length === 0) {
		params.queue.summaryElisions.shift();
		return true;
	}
	const source = retainedSources.at(-1) ?? entry.sources.at(-1);
	if (!source) return false;
	const elidedCount = entry.sources.length;
	const elidedSources = [...entry.sources];
	const droppedCount = elidedCount + retainedSources.length;
	const summaryLines = params.queue.summaryLines.slice(0, retainedSources.length);
	const prompt = previewQueueSummaryPrompt({
		state: {
			dropPolicy: params.queue.dropPolicy,
			droppedCount,
			summaryLines
		},
		noun: "message"
	});
	if (!prompt) return false;
	if (!await runQueueSummaryDelivery(params.queue, {
		prompt,
		droppedCount: retainedSources.length,
		sources: retainedSources
	}, async ({ abortSignal, onAdmitted }) => {
		await runSyntheticOverflowSummary({
			source,
			sources: [...elidedSources, ...retainedSources],
			prompt,
			abortSignal,
			onAdmitted,
			runFollowup: params.runFollowup
		});
	}, [...elidedSources, ...retainedSources])) return true;
	const entryIndex = params.queue.summaryElisions.indexOf(entry);
	if (entryIndex < 0) return true;
	const consumedCount = Math.min(elidedCount, entry.sources.length);
	const consumedSources = entry.sources.splice(0, consumedCount);
	entry.count = entry.sources.length;
	for (const consumedSource of consumedSources) completeFollowupRunLifecycle(consumedSource);
	params.queue.droppedCount = Math.max(0, params.queue.droppedCount - consumedCount);
	if (entry.sources.length === 0) params.queue.summaryElisions.splice(entryIndex, 1);
	return true;
}
async function drainOverflowSummaryGroup(params) {
	if (dropAbortedQueueSummarySources(params.queue) > 0 && params.queue.droppedCount === 0) return true;
	if (params.queue.evictedSummaryCount > 0) {
		const evictedCount = params.queue.evictedSummaryCount;
		params.queue.evictedSummaryCount = 0;
		params.queue.droppedCount = Math.max(0, params.queue.droppedCount - evictedCount);
		require_runtime.defaultRuntime.error?.(`followup queue omitted ${evictedCount} route-isolated overflow summar${evictedCount === 1 ? "y" : "ies"} after reaching the summary context cap`);
		return true;
	}
	if (await drainElidedOverflowSummary(params)) return true;
	const sources = resolveOverflowSummarySourceGroup(params.queue);
	const source = sources.at(-1);
	if (!source) return false;
	const delivery = createQueueSummaryDelivery({
		queue: params.queue,
		sources
	});
	if (!delivery) return false;
	await runQueueSummaryDelivery(params.queue, delivery, async ({ abortSignal, onAdmitted }) => {
		await runSyntheticOverflowSummary({
			source,
			sources: delivery.sources,
			prompt: delivery.prompt,
			abortSignal,
			onAdmitted,
			runFollowup: params.runFollowup
		});
	});
	return true;
}
function scheduleFollowupDrain(key, runFollowup) {
	if (FOLLOWUP_QUEUES.get(key)?.draining) {
		rememberFollowupDrainCallback(key, runFollowup);
		return;
	}
	const queue = beginQueueDrain(FOLLOWUP_QUEUES, key);
	if (!queue) return;
	const effectiveRunFollowup = FOLLOWUP_RUN_CALLBACKS.get(key) ?? runFollowup;
	const reserveOptions = {
		inFlight: queue.inFlight,
		shouldRestoreOnError: () => FOLLOWUP_QUEUES.get(key) === queue && !queue.abortController.signal.aborted,
		onDiscard: (item) => completeFollowupRunLifecycle(item)
	};
	rememberFollowupDrainCallback(key, effectiveRunFollowup);
	require_gateway_work_admission.runWithGatewayIndependentRootWorkContinuation(async () => {
		let retryDeferred = false;
		try {
			const collectState = { forceIndividualCollect: false };
			while (queue.items.length > 0 || queue.droppedCount > 0) {
				await dropAbortedFollowups(queue.items, effectiveRunFollowup);
				if (queue.items.length === 0 && queue.droppedCount === 0) break;
				await waitForQueueDebounce(queue, queue.abortController.signal);
				await dropAbortedFollowups(queue.items, effectiveRunFollowup);
				if (queue.items.length === 0 && queue.droppedCount === 0) break;
				if (await drainProtectedPriorityFollowup(queue.items, effectiveRunFollowup)) continue;
				if (queue.droppedCount > 0 && await drainOverflowSummaryGroup({
					queue,
					runFollowup: effectiveRunFollowup
				})) continue;
				if (queue.mode === "collect") {
					const isCrossChannel = hasCrossChannelItems(queue.items, resolveCrossChannelKey) || queue.items.some(requiresIndividualCollectDrain);
					if (collectState.forceIndividualCollect && !isCrossChannel && queue.items.length > 1) collectState.forceIndividualCollect = false;
					const collectDrainResult = await drainCollectQueueStep({
						collectState,
						isCrossChannel,
						items: queue.items,
						run: effectiveRunFollowup,
						reserveOptions
					});
					if (collectDrainResult === "empty") break;
					if (collectDrainResult === "drained") continue;
					const contextGroups = splitCollectItemsByDeliveryContext(queue.items.slice());
					if (contextGroups.length === 0) break;
					for (const groupItems of contextGroups) {
						const currentGroupItems = groupItems.filter((item) => queue.items.includes(item));
						const abortedGroupItems = currentGroupItems.filter(isFollowupRunAborted);
						if (abortedGroupItems.length > 0) {
							removeQueuedItemsByRef(queue.items, abortedGroupItems);
							for (const item of abortedGroupItems) completeFollowupRunLifecycle(item);
						}
						const activeGroupItems = currentGroupItems.filter((item) => !isFollowupRunAborted(item));
						if (activeGroupItems.length === 0) continue;
						assertSingleAdmissionOwner(activeGroupItems);
						const groupSource = activeGroupItems.at(-1);
						const run = groupSource?.run ?? queue.lastRun;
						if (!run) break;
						const routing = resolveOriginRoutingMetadata(activeGroupItems);
						const prompt = buildCollectPrompt({
							title: "[Queued messages while agent was busy]",
							items: activeGroupItems,
							renderItem: renderCollectItem
						});
						const transcriptPrompt = buildCollectTranscriptPrompt(activeGroupItems);
						const userTurnTranscriptRecorder = createCollectUserTurnTranscriptRecorder(activeGroupItems);
						const aggregateOwner = resolveAggregateOwner(activeGroupItems);
						const cancellation = createAggregateCancellation(activeGroupItems);
						let admitted = false;
						const restoreGroupItems = (groupItemsToRestore) => {
							const missingItems = groupItemsToRestore.filter((item) => !queue.items.includes(item));
							queue.items.unshift(...missingItems);
						};
						const needsGroupAdmission = activeGroupItems.length > 1 || activeGroupItems.some((item) => item.queuedLifecycle?.onAdmitted);
						const consumeAdmittedGroup = () => {
							cancellation.admit();
							admitted = true;
							removeQueuedItemsByRef(queue.items, activeGroupItems);
							for (const item of activeGroupItems) if (item !== aggregateOwner) retireFollowupRunCancellation(item);
						};
						const admitGroupSources = async () => {
							await Promise.all(activeGroupItems.map((item) => admitFollowupRunLifecycle(item)));
							consumeAdmittedGroup();
						};
						const completeGroup = () => {
							removeQueuedItemsByRef(queue.items, activeGroupItems);
							for (const item of activeGroupItems) completeFollowupRunLifecycle(item);
						};
						const drainGroup = async () => {
							await effectiveRunFollowup({
								prompt,
								transcriptPrompt,
								...userTurnTranscriptRecorder ? { userTurnTranscriptRecorder } : {},
								run,
								messageId: groupSource?.messageId ?? (groupSource ? resolveFollowupReplyAnchor(groupSource) : void 0),
								enqueuedAt: Date.now(),
								...routing,
								...collectRuntimeMetadata(activeGroupItems, cancellation.signal),
								...needsGroupAdmission ? { queuedLifecycle: {
									onAdmitted: admitGroupSources,
									onComplete: () => {
										if (admitted) completeGroup();
									}
								} } : {},
								...collectQueuedImages(activeGroupItems)
							});
						};
						try {
							for (const item of activeGroupItems) queue.inFlight.add(item);
							await drainGroup();
						} catch (err) {
							if (admitted) completeGroup();
							else if (FOLLOWUP_QUEUES.get(key) === queue && !queue.abortController.signal.aborted) restoreGroupItems(activeGroupItems);
							else for (const item of activeGroupItems) completeFollowupRunLifecycle(item);
							throw err;
						} finally {
							for (const item of activeGroupItems) queue.inFlight.delete(item);
							cancellation.dispose();
						}
						if (!admitted) {
							const canceledSources = activeGroupItems.filter(isFollowupRunAborted);
							if (canceledSources.length > 0) {
								removeQueuedItemsByRef(queue.items, canceledSources);
								for (const item of canceledSources) completeFollowupRunLifecycle(item);
								const survivors = activeGroupItems.filter((item) => !canceledSources.includes(item));
								if (FOLLOWUP_QUEUES.get(key) === queue && !queue.abortController.signal.aborted) {
									restoreGroupItems(survivors);
									if (survivors.length > 0) break;
								} else for (const item of survivors) completeFollowupRunLifecycle(item);
								continue;
							}
						}
						completeGroup();
					}
					continue;
				}
				if (!await drainNextQueueItem(queue.items, effectiveRunFollowup, reserveOptions)) break;
			}
		} catch (err) {
			queue.lastEnqueuedAt = Date.now();
			if (isFollowupRunDeferredError(err)) retryDeferred = true;
			else require_runtime.defaultRuntime.error?.(`followup queue drain failed for ${key}: ${String(err)}`);
		} finally {
			queue.draining = false;
			const hasPendingQueueWork = queue.items.length > 0 || queue.droppedCount > 0;
			if (retryDeferred && hasPendingQueueWork) scheduleFollowupDrain(key, effectiveRunFollowup);
			else if (!hasPendingQueueWork) {
				if (FOLLOWUP_QUEUES.get(key) === queue) {
					FOLLOWUP_QUEUES.delete(key);
					clearFollowupDrainCallback(key);
				}
			} else scheduleFollowupDrain(key, effectiveRunFollowup);
		}
	}).catch((err) => {
		queue.draining = false;
		require_runtime.defaultRuntime.error?.(`followup queue drain admission failed for ${key}: ${String(err)}`);
	});
}
//#endregion
//#region src/auto-reply/reply/queue/cleanup.ts
const defaultQueueCleanupDeps = {
	resolveEmbeddedSessionLane: require_lanes.resolveEmbeddedSessionLane,
	clearCommandLane: require_command_queue.clearCommandLane
};
const queueCleanupDeps = { ...defaultQueueCleanupDeps };
function resolveQueueCleanupLaneResolver() {
	return typeof queueCleanupDeps.resolveEmbeddedSessionLane === "function" ? queueCleanupDeps.resolveEmbeddedSessionLane : defaultQueueCleanupDeps.resolveEmbeddedSessionLane;
}
function resolveQueueCleanupLaneClearer() {
	return typeof queueCleanupDeps.clearCommandLane === "function" ? queueCleanupDeps.clearCommandLane : defaultQueueCleanupDeps.clearCommandLane;
}
const queueCleanupTestApi = {
	setDepsForTests(deps) {
		queueCleanupDeps.resolveEmbeddedSessionLane = typeof deps?.resolveEmbeddedSessionLane === "function" ? deps.resolveEmbeddedSessionLane : defaultQueueCleanupDeps.resolveEmbeddedSessionLane;
		queueCleanupDeps.clearCommandLane = typeof deps?.clearCommandLane === "function" ? deps.clearCommandLane : defaultQueueCleanupDeps.clearCommandLane;
	},
	resetDepsForTests() {
		queueCleanupDeps.resolveEmbeddedSessionLane = defaultQueueCleanupDeps.resolveEmbeddedSessionLane;
		queueCleanupDeps.clearCommandLane = defaultQueueCleanupDeps.clearCommandLane;
	}
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.queueCleanupTestApi")] = queueCleanupTestApi;
function clearSessionQueues(keys) {
	const seen = /* @__PURE__ */ new Set();
	let followupCleared = 0;
	let laneCleared = 0;
	const clearedKeys = [];
	const resolveLane = resolveQueueCleanupLaneResolver();
	const clearLane = resolveQueueCleanupLaneClearer();
	for (const key of keys) {
		const cleaned = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(key);
		if (!cleaned || seen.has(cleaned)) continue;
		seen.add(cleaned);
		clearedKeys.push(cleaned);
		followupCleared += clearFollowupQueue(cleaned);
		clearFollowupDrainCallback(cleaned);
		laneCleared += clearLane(resolveLane(cleaned));
	}
	return {
		followupCleared,
		laneCleared,
		keys: clearedKeys
	};
}
//#endregion
Object.defineProperty(exports, "DEFAULT_QUEUE_DROP", {
	enumerable: true,
	get: function() {
		return DEFAULT_QUEUE_DROP;
	}
});
Object.defineProperty(exports, "FollowupRunDeferredError", {
	enumerable: true,
	get: function() {
		return FollowupRunDeferredError;
	}
});
Object.defineProperty(exports, "admitFollowupRunLifecycle", {
	enumerable: true,
	get: function() {
		return admitFollowupRunLifecycle;
	}
});
Object.defineProperty(exports, "applyQueueDropPolicy", {
	enumerable: true,
	get: function() {
		return applyQueueDropPolicy;
	}
});
Object.defineProperty(exports, "clearSessionQueues", {
	enumerable: true,
	get: function() {
		return clearSessionQueues;
	}
});
Object.defineProperty(exports, "completeFollowupRunLifecycle", {
	enumerable: true,
	get: function() {
		return completeFollowupRunLifecycle;
	}
});
Object.defineProperty(exports, "countPendingQueueItems", {
	enumerable: true,
	get: function() {
		return countPendingQueueItems;
	}
});
Object.defineProperty(exports, "createOverflowSummaryRetrySource", {
	enumerable: true,
	get: function() {
		return createOverflowSummaryRetrySource;
	}
});
Object.defineProperty(exports, "getExistingFollowupQueue", {
	enumerable: true,
	get: function() {
		return getExistingFollowupQueue;
	}
});
Object.defineProperty(exports, "getFollowupQueue", {
	enumerable: true,
	get: function() {
		return getFollowupQueue;
	}
});
Object.defineProperty(exports, "isFollowupRunAborted", {
	enumerable: true,
	get: function() {
		return isFollowupRunAborted;
	}
});
Object.defineProperty(exports, "kickFollowupDrainIfIdle", {
	enumerable: true,
	get: function() {
		return kickFollowupDrainIfIdle;
	}
});
Object.defineProperty(exports, "markFollowupRunEnqueued", {
	enumerable: true,
	get: function() {
		return markFollowupRunEnqueued;
	}
});
Object.defineProperty(exports, "refreshQueuedFollowupSession", {
	enumerable: true,
	get: function() {
		return refreshQueuedFollowupSession;
	}
});
Object.defineProperty(exports, "rememberFollowupDrainCallback", {
	enumerable: true,
	get: function() {
		return rememberFollowupDrainCallback;
	}
});
Object.defineProperty(exports, "resolveFollowupAbortSignal", {
	enumerable: true,
	get: function() {
		return resolveFollowupAbortSignal;
	}
});
Object.defineProperty(exports, "resolveFollowupDeliveryContextKey", {
	enumerable: true,
	get: function() {
		return resolveFollowupDeliveryContextKey;
	}
});
Object.defineProperty(exports, "resolveFollowupReplyAnchor", {
	enumerable: true,
	get: function() {
		return resolveFollowupReplyAnchor;
	}
});
Object.defineProperty(exports, "scheduleFollowupDrain", {
	enumerable: true,
	get: function() {
		return scheduleFollowupDrain;
	}
});
Object.defineProperty(exports, "shouldSkipQueueItem", {
	enumerable: true,
	get: function() {
		return shouldSkipQueueItem;
	}
});
Object.defineProperty(exports, "trimSummaryElisionsToCap", {
	enumerable: true,
	get: function() {
		return trimSummaryElisionsToCap;
	}
});
