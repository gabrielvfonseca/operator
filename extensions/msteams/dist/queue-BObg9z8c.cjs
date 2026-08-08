require("./plugins-_-82JYfc.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_dedupe = require("./dedupe-CtfV06qO.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_cleanup = require("./cleanup-Do0eFW35.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/queue/enqueue.ts
const RECENT_QUEUE_MESSAGE_IDS = require_dedupe.resolveGlobalDedupeCache(Symbol.for("operator.recentQueueMessageIds"), {
	ttlMs: 300 * 1e3,
	maxSize: 1e4
});
function followupRouteIdentityKey(run) {
	return JSON.stringify([
		require_channel_route.channelRouteDedupeKey({
			channel: run.originatingChannel,
			to: run.originatingTo,
			accountId: run.originatingAccountId,
			threadId: run.originatingThreadId
		}),
		require_cleanup.resolveFollowupReplyAnchor(run) ?? "",
		run.originatingReplyToMode ?? "",
		require_chat_type.normalizeChatType(run.originatingChatType) ?? ""
	]);
}
function followupMessageRouteIdentityKey(run) {
	return JSON.stringify([require_channel_route.channelRouteDedupeKey({
		channel: run.originatingChannel,
		to: run.originatingTo,
		accountId: run.originatingAccountId,
		threadId: run.originatingThreadId
	}), require_chat_type.normalizeChatType(run.originatingChatType) ?? ""]);
}
function buildRecentMessageIdKey(run, queueKey) {
	const messageId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(run.messageId);
	if (!messageId) return;
	return JSON.stringify([
		"queue",
		queueKey,
		followupMessageRouteIdentityKey(run),
		messageId
	]);
}
function isRunAlreadyQueued(run, items, allowPromptFallback = false) {
	const messageId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(run.messageId);
	if (messageId) {
		const messageRouteKey = followupMessageRouteIdentityKey(run);
		return items.some((item) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item.messageId) === messageId && followupMessageRouteIdentityKey(item) === messageRouteKey);
	}
	if (!allowPromptFallback) return false;
	const routeKey = followupRouteIdentityKey(run);
	return items.some((item) => item.prompt === run.prompt && followupRouteIdentityKey(item) === routeKey);
}
function enqueueFollowupRun(key, run, settings, dedupeMode = "message-id", runFollowup, restartIfIdle = true, options = {}) {
	if (require_cleanup.isFollowupRunAborted(run)) return false;
	if (options.position === "front") run.protectFromQueueOverflow = true;
	const queue = require_cleanup.getFollowupQueue(key, settings);
	const recentMessageIdKey = dedupeMode !== "none" ? buildRecentMessageIdKey(run, key) : void 0;
	if (recentMessageIdKey && RECENT_QUEUE_MESSAGE_IDS.peek(recentMessageIdKey)) return false;
	const dedupe = dedupeMode === "none" ? void 0 : (item, items) => isRunAlreadyQueued(item, items, dedupeMode === "prompt");
	if (require_cleanup.shouldSkipQueueItem({
		item: run,
		items: queue.items,
		dedupe
	})) return false;
	const pendingCount = require_cleanup.countPendingQueueItems(queue.items, queue.inFlight);
	if (queue.dropPolicy === "new" && queue.cap > 0 && pendingCount >= queue.cap) {
		require_cleanup.completeFollowupRunLifecycle(run);
		return false;
	}
	if (!require_cleanup.markFollowupRunEnqueued(run)) return false;
	const shouldEnqueue = require_cleanup.applyQueueDropPolicy({
		queue,
		inFlight: queue.inFlight,
		summarize: (item) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item.summaryLine) || item.prompt.trim(),
		onDrop: (dropped) => {
			if (queue.dropPolicy === "summarize") {
				queue.summarySources.push(...dropped);
				return;
			}
			for (const item of dropped) require_cleanup.completeFollowupRunLifecycle(item);
		},
		isProtected: (item) => item.protectFromQueueOverflow === true
	});
	if (queue.dropPolicy === "summarize") {
		const overflow = queue.summarySources.length - queue.summaryLines.length;
		if (overflow > 0) {
			const removed = queue.summarySources.splice(0, overflow);
			for (const item of removed) {
				const contextKey = require_cleanup.resolveFollowupDeliveryContextKey(item);
				const lastElision = queue.summaryElisions.at(-1);
				if (lastElision?.contextKey === contextKey) {
					const compactSource = require_cleanup.createOverflowSummaryRetrySource(item);
					lastElision.count += 1;
					lastElision.sources.push(compactSource);
					lastElision.sourceRefs.set(item, compactSource);
					if (queue.activeSummarySources.has(item)) queue.activeSummarySources.add(compactSource);
				} else {
					const compactSource = require_cleanup.createOverflowSummaryRetrySource(item);
					queue.summaryElisions.push({
						contextKey,
						count: 1,
						sources: [compactSource],
						sourceRefs: new WeakMap([[item, compactSource]])
					});
					if (queue.activeSummarySources.has(item)) queue.activeSummarySources.add(compactSource);
				}
				require_cleanup.trimSummaryElisionsToCap(queue);
			}
		}
	}
	if (!shouldEnqueue) {
		require_cleanup.completeFollowupRunLifecycle(run);
		return false;
	}
	queue.lastEnqueuedAt = Date.now();
	queue.lastRun = run.run;
	run.queueAbortSignal = queue.abortController.signal;
	if (options.position === "front") queue.items.unshift(run);
	else queue.items.push(run);
	if (recentMessageIdKey) RECENT_QUEUE_MESSAGE_IDS.check(recentMessageIdKey);
	if (runFollowup) require_cleanup.rememberFollowupDrainCallback(key, runFollowup);
	if (restartIfIdle && !queue.draining) require_cleanup.kickFollowupDrainIfIdle(key);
	return true;
}
function getFollowupQueueDepth(key) {
	const queue = require_cleanup.getExistingFollowupQueue(key);
	if (!queue) return 0;
	return require_cleanup.countPendingQueueItems(queue.items, queue.inFlight);
}
function resetRecentQueuedMessageIdDedupe() {
	RECENT_QUEUE_MESSAGE_IDS.clear();
}
if (process.env.VITEST === "true" || false) globalThis[Symbol.for("operator.queueEnqueueTestApi")] = { resetRecentQueuedMessageIdDedupe };
//#endregion
//#region src/auto-reply/reply/queue/normalize.ts
/** Normalizes user-entered queue mode aliases from directives/config. */
function normalizeQueueMode(raw) {
	const cleaned = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (!cleaned) return;
	if (cleaned === "interrupt" || cleaned === "interrupts" || cleaned === "abort") return "interrupt";
	if (cleaned === "steer" || cleaned === "steering") return "steer";
	if (cleaned === "followup" || cleaned === "follow-ups" || cleaned === "followups") return "followup";
	if (cleaned === "collect" || cleaned === "coalesce") return "collect";
}
/** Normalizes persisted legacy queue mode aliases into current queue modes. */
function normalizePersistedQueueMode(raw) {
	const normalized = normalizeQueueMode(raw);
	if (normalized) return normalized;
	const cleaned = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (cleaned === "queue" || cleaned === "queued") return "steer";
	if (cleaned === "steer+backlog" || cleaned === "steer-backlog" || cleaned === "steer_backlog") return "followup";
}
/** Normalizes queue drop policy aliases from directives/config. */
function normalizeQueueDropPolicy(raw) {
	const cleaned = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (!cleaned) return;
	if (cleaned === "old" || cleaned === "oldest") return "old";
	if (cleaned === "new" || cleaned === "newest") return "new";
	if (cleaned === "summarize" || cleaned === "summary") return "summarize";
}
//#endregion
//#region src/auto-reply/reply/queue/settings.ts
/** Resolve per-channel debounce override from debounceMsByChannel map. */
function resolveChannelDebounce(byChannel, channelKey) {
	if (!channelKey || !byChannel) return;
	const value = byChannel[channelKey];
	return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : void 0;
}
function resolveQueueSettings$1(params) {
	const channelKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	const queueCfg = params.cfg.messages?.queue;
	const providerModeRaw = channelKey && queueCfg?.byChannel ? queueCfg.byChannel[channelKey] : void 0;
	const resolvedMode = params.inlineMode ?? normalizePersistedQueueMode(params.sessionEntry?.queueMode) ?? normalizeQueueMode(providerModeRaw) ?? normalizeQueueMode(queueCfg?.mode) ?? "steer";
	const debounceRaw = params.inlineOptions?.debounceMs ?? params.sessionEntry?.queueDebounceMs ?? resolveChannelDebounce(queueCfg?.debounceMsByChannel, channelKey) ?? params.pluginDebounceMs ?? queueCfg?.debounceMs ?? 500;
	const capRaw = params.inlineOptions?.cap ?? params.sessionEntry?.queueCap ?? queueCfg?.cap ?? 20;
	const dropRaw = params.inlineOptions?.dropPolicy ?? params.sessionEntry?.queueDrop ?? normalizeQueueDropPolicy(queueCfg?.drop) ?? "summarize";
	return {
		mode: resolvedMode,
		debounceMs: typeof debounceRaw === "number" ? Math.max(0, debounceRaw) : void 0,
		cap: typeof capRaw === "number" ? Math.max(1, Math.floor(capRaw)) : void 0,
		dropPolicy: dropRaw
	};
}
//#endregion
//#region src/auto-reply/reply/queue/settings-runtime.ts
/** Resolves plugin-provided debounce defaults for a channel queue. */
function resolvePluginDebounce(channelKey) {
	if (!channelKey) return;
	const value = require_registry.getLoadedChannelPlugin(channelKey)?.defaults?.queue?.debounceMs;
	return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : void 0;
}
/** Resolves queue settings with channel plugin defaults layered into core config. */
function resolveQueueSettings(params) {
	const channelKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	return resolveQueueSettings$1({
		...params,
		pluginDebounceMs: params.pluginDebounceMs ?? resolvePluginDebounce(channelKey)
	});
}
//#endregion
Object.defineProperty(exports, "enqueueFollowupRun", {
	enumerable: true,
	get: function() {
		return enqueueFollowupRun;
	}
});
Object.defineProperty(exports, "getFollowupQueueDepth", {
	enumerable: true,
	get: function() {
		return getFollowupQueueDepth;
	}
});
Object.defineProperty(exports, "normalizeQueueDropPolicy", {
	enumerable: true,
	get: function() {
		return normalizeQueueDropPolicy;
	}
});
Object.defineProperty(exports, "normalizeQueueMode", {
	enumerable: true,
	get: function() {
		return normalizeQueueMode;
	}
});
Object.defineProperty(exports, "resolveQueueSettings", {
	enumerable: true,
	get: function() {
		return resolveQueueSettings;
	}
});
Object.defineProperty(exports, "resolveQueueSettings$1", {
	enumerable: true,
	get: function() {
		return resolveQueueSettings$1;
	}
});
