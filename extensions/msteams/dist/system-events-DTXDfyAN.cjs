const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_system_tags = require("./system-tags-DnXAcM7s.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/system-events.ts
const MAX_EVENTS = 20;
const queues = require_global_singleton.resolveGlobalMap(Symbol.for("operator.systemEvents.queues"));
function requireSessionKey(key) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(key) ?? "";
	if (!trimmed) throw new Error("system events require a sessionKey");
	return trimmed;
}
function normalizeContextKey(key) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(key) ?? null;
}
function getSessionQueue(sessionKey) {
	return queues.get(requireSessionKey(sessionKey));
}
function getOrCreateSessionQueue(sessionKey) {
	const key = requireSessionKey(sessionKey);
	const existing = queues.get(key);
	if (existing) return existing;
	const created = {
		queue: [],
		lastContextKey: null
	};
	queues.set(key, created);
	return created;
}
function cloneSystemEvent(event) {
	return {
		...event,
		...event.deliveryContext ? { deliveryContext: { ...event.deliveryContext } } : {}
	};
}
function isSystemEventContextChanged(sessionKey, contextKey) {
	const existing = getSessionQueue(sessionKey);
	return normalizeContextKey(contextKey) !== (existing?.lastContextKey ?? null);
}
function findDuplicateInQueue(queue, text, contextKey, deliveryContext) {
	const incoming = {
		text,
		contextKey,
		deliveryContext
	};
	if (contextKey === null) {
		const last = queue[queue.length - 1];
		return last ? isDuplicateSystemEvent(last, incoming) : false;
	}
	return queue.some((event) => isDuplicateSystemEvent(event, incoming));
}
function enqueueSystemEventEntry(text, options) {
	if (options.replace) return replaceSystemEventEntry(text, options);
	const entry = getOrCreateSessionQueue(requireSessionKey(options.sessionKey));
	const cleaned = require_system_tags.sanitizeInboundSystemTags(text).trim();
	if (!cleaned) return null;
	const normalizedContextKey = normalizeContextKey(options.contextKey);
	const normalizedDeliveryContext = require_delivery_context_shared.normalizeDeliveryContext(options.deliveryContext);
	if (findDuplicateInQueue(entry.queue, cleaned, normalizedContextKey, normalizedDeliveryContext)) return null;
	if (normalizedContextKey !== null) entry.lastContextKey = normalizedContextKey;
	const event = {
		text: cleaned,
		ts: Date.now(),
		contextKey: normalizedContextKey,
		deliveryContext: normalizedDeliveryContext
	};
	entry.queue.push(event);
	if (entry.queue.length > MAX_EVENTS) entry.queue.shift();
	return cloneSystemEvent(event);
}
function enqueueSystemEvent(text, options) {
	return enqueueSystemEventEntry(text, options) !== null;
}
function drainSystemEventEntries(sessionKey) {
	const key = requireSessionKey(sessionKey);
	const entry = getSessionQueue(key);
	if (!entry || entry.queue.length === 0) return [];
	const out = entry.queue.map(cloneSystemEvent);
	entry.queue.length = 0;
	entry.lastContextKey = null;
	queues.delete(key);
	return out;
}
function areDeliveryContextsEqual(left, right) {
	if (!left && !right) return true;
	if (!left || !right) return false;
	return require_channel_route.channelRouteDedupeKey(left) === require_channel_route.channelRouteDedupeKey(right);
}
function replaceSystemEventEntry(text, options) {
	const entry = getOrCreateSessionQueue(requireSessionKey(options.sessionKey));
	const cleaned = require_system_tags.sanitizeInboundSystemTags(text).trim();
	if (!cleaned) return null;
	const normalizedContextKey = normalizeContextKey(options.contextKey);
	if (normalizedContextKey === null) throw new Error("replaced system events require a contextKey");
	const normalizedDeliveryContext = require_delivery_context_shared.normalizeDeliveryContext(options.deliveryContext);
	const matching = entry.queue.filter((event) => (event.contextKey ?? null) === normalizedContextKey && areDeliveryContextsEqual(event.deliveryContext, normalizedDeliveryContext));
	if (matching.length === 1 && matching[0]?.text === cleaned) return null;
	entry.queue = entry.queue.filter((event) => (event.contextKey ?? null) !== normalizedContextKey || !areDeliveryContextsEqual(event.deliveryContext, normalizedDeliveryContext));
	const event = {
		text: cleaned,
		ts: Date.now(),
		contextKey: normalizedContextKey,
		deliveryContext: normalizedDeliveryContext
	};
	entry.queue.push(event);
	if (entry.queue.length > MAX_EVENTS) entry.queue.shift();
	entry.lastContextKey = normalizedContextKey;
	return cloneSystemEvent(event);
}
function isDuplicateSystemEvent(existing, incoming) {
	return existing.text === incoming.text && (existing.contextKey ?? null) === (incoming.contextKey ?? null) && areDeliveryContextsEqual(existing.deliveryContext, incoming.deliveryContext);
}
function areSystemEventsEqual(left, right) {
	return left.text === right.text && left.ts === right.ts && (left.contextKey ?? null) === (right.contextKey ?? null) && areDeliveryContextsEqual(left.deliveryContext, right.deliveryContext);
}
function resetQueueState(key, entry) {
	if (entry.queue.length === 0) {
		entry.lastContextKey = null;
		queues.delete(key);
		return;
	}
	for (let index = entry.queue.length - 1; index >= 0; index -= 1) {
		const contextKey = (0, _gabrielvfonseca_normalization_core.expectDefined)(entry.queue[index], "queue entry at index").contextKey ?? null;
		if (contextKey !== null) {
			entry.lastContextKey = contextKey;
			return;
		}
	}
	entry.lastContextKey = null;
}
function consumeSelectedSystemEventEntries(sessionKey, consumedEntries) {
	const key = requireSessionKey(sessionKey);
	const entry = getSessionQueue(key);
	if (!entry || entry.queue.length === 0 || consumedEntries.length === 0) return [];
	const removed = [];
	for (const consumed of consumedEntries) {
		const index = entry.queue.findIndex((event) => areSystemEventsEqual(event, consumed));
		if (index === -1) continue;
		const [event] = entry.queue.splice(index, 1);
		if (event) removed.push(cloneSystemEvent(event));
	}
	resetQueueState(key, entry);
	return removed;
}
function peekSystemEventEntries(sessionKey) {
	return getSessionQueue(sessionKey)?.queue.map(cloneSystemEvent) ?? [];
}
function peekSystemEvents(sessionKey) {
	return peekSystemEventEntries(sessionKey).map((event) => event.text);
}
function resolveSystemEventDeliveryContext(events) {
	let resolved;
	for (const event of events) resolved = require_delivery_context_shared.mergeDeliveryContext(event.deliveryContext, resolved);
	return resolved;
}
//#endregion
Object.defineProperty(exports, "consumeSelectedSystemEventEntries", {
	enumerable: true,
	get: function() {
		return consumeSelectedSystemEventEntries;
	}
});
Object.defineProperty(exports, "drainSystemEventEntries", {
	enumerable: true,
	get: function() {
		return drainSystemEventEntries;
	}
});
Object.defineProperty(exports, "enqueueSystemEvent", {
	enumerable: true,
	get: function() {
		return enqueueSystemEvent;
	}
});
Object.defineProperty(exports, "enqueueSystemEventEntry", {
	enumerable: true,
	get: function() {
		return enqueueSystemEventEntry;
	}
});
Object.defineProperty(exports, "isSystemEventContextChanged", {
	enumerable: true,
	get: function() {
		return isSystemEventContextChanged;
	}
});
Object.defineProperty(exports, "peekSystemEventEntries", {
	enumerable: true,
	get: function() {
		return peekSystemEventEntries;
	}
});
Object.defineProperty(exports, "peekSystemEvents", {
	enumerable: true,
	get: function() {
		return peekSystemEvents;
	}
});
Object.defineProperty(exports, "resolveSystemEventDeliveryContext", {
	enumerable: true,
	get: function() {
		return resolveSystemEventDeliveryContext;
	}
});
