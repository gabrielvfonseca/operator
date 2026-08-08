const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
let node_crypto = require("node:crypto");
let node_async_hooks = require("node:async_hooks");
//#region src/shared/listeners.ts
/** Notifies every registered listener while isolating individual listener failures. */
function notifyListeners(listeners, event, onError) {
	for (const listener of listeners) try {
		listener(event);
	} catch (error) {
		onError?.(error);
	}
}
/** Registers a listener in a Set and returns an idempotent unsubscribe handle. */
function registerListener(listeners, listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
//#endregion
//#region src/infra/agent-events.ts
var agent_events_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	assertAgentRunLifecycleGenerationCurrent: () => assertAgentRunLifecycleGenerationCurrent,
	captureAgentRunLifecycleGeneration: () => captureAgentRunLifecycleGeneration,
	claimAgentRunContext: () => claimAgentRunContext,
	clearAgentRunContext: () => clearAgentRunContext,
	emitAgentApprovalEvent: () => emitAgentApprovalEvent,
	emitAgentAuditEvent: () => emitAgentAuditEvent,
	emitAgentCommandOutputEvent: () => emitAgentCommandOutputEvent,
	emitAgentEvent: () => emitAgentEvent,
	emitAgentEventForOwner: () => emitAgentEventForOwner,
	emitAgentItemEvent: () => emitAgentItemEvent,
	emitAgentPatchSummaryEvent: () => emitAgentPatchSummaryEvent,
	getAgentEventLifecycleGeneration: () => getAgentEventLifecycleGeneration,
	getAgentRunContext: () => getAgentRunContext,
	getAgentRunContextOwnerStatus: () => getAgentRunContextOwnerStatus,
	hasProjectedAgentRunForSession: () => hasProjectedAgentRunForSession,
	listAgentRunsForSession: () => listAgentRunsForSession,
	onAgentAuditEvent: () => onAgentAuditEvent,
	onAgentEvent: () => onAgentEvent,
	onAgentRuntimeEvent: () => onAgentRuntimeEvent,
	registerAgentRunContext: () => registerAgentRunContext,
	releaseAgentRunContext: () => releaseAgentRunContext,
	resetAgentEventsForTest: () => resetAgentEventsForTest,
	rotateAgentEventLifecycleGeneration: () => rotateAgentEventLifecycleGeneration,
	sweepStaleRunContexts: () => sweepStaleRunContexts,
	withAgentRunLifecycleGeneration: () => withAgentRunLifecycleGeneration
});
const AGENT_EVENT_STATE_KEY = Symbol.for("operator.agentEvents.state");
const AGENT_EVENT_EXECUTION_CONTEXT_KEY = Symbol.for("operator.agentEvents.executionContext");
function getAgentEventState() {
	return require_global_singleton.resolveGlobalSingleton(AGENT_EVENT_STATE_KEY, () => ({
		seqByRun: /* @__PURE__ */ new Map(),
		listeners: /* @__PURE__ */ new Set(),
		auditListeners: /* @__PURE__ */ new Set(),
		runContextById: /* @__PURE__ */ new Map(),
		lifecycleGeneration: (0, node_crypto.randomUUID)()
	}));
}
function getAgentEventExecutionContext() {
	return require_global_singleton.resolveGlobalSingleton(AGENT_EVENT_EXECUTION_CONTEXT_KEY, () => new node_async_hooks.AsyncLocalStorage());
}
/** Runs one execution with immutable ownership inherited by every emitted stream event. */
function withAgentRunLifecycleGeneration(lifecycleGeneration, run) {
	return getAgentEventExecutionContext().run({ lifecycleGeneration }, run);
}
function getAgentEventLifecycleGeneration() {
	return getAgentEventState().lifecycleGeneration;
}
/** Rejects work that no longer belongs to the active gateway lifecycle. */
function assertAgentRunLifecycleGenerationCurrent(lifecycleGeneration) {
	if (lifecycleGeneration === getAgentEventState().lifecycleGeneration) return;
	throw require_abort_signal.createAbortError("Agent run belongs to a stale gateway lifecycle");
}
/** Captures immutable lifecycle ownership for one admitted execution. */
function captureAgentRunLifecycleGeneration(runId) {
	return getAgentEventExecutionContext().getStore()?.lifecycleGeneration ?? getAgentEventState().runContextById.get(runId)?.lifecycleGeneration ?? getAgentEventState().lifecycleGeneration;
}
/** Starts a new ownership generation before an in-process gateway restart. */
function rotateAgentEventLifecycleGeneration() {
	const state = getAgentEventState();
	state.lifecycleGeneration = (0, node_crypto.randomUUID)();
	return state.lifecycleGeneration;
}
/** Registers or merges per-run context used by later agent event emissions. */
function registerAgentRunContext(runId, context, claimId) {
	if (!runId) return;
	const state = getAgentEventState();
	const lifecycleGeneration = context.lifecycleGeneration ?? state.lifecycleGeneration;
	const owners = getAgentRunContextOwners(state).get(runId);
	if (owners?.lifecycleGeneration === lifecycleGeneration && owners.exclusiveClaimId && (owners.exclusiveClaimId !== claimId || owners.clearRequested)) return;
	const existing = state.runContextById.get(runId);
	if (!existing) {
		state.runContextById.set(runId, {
			...context,
			lifecycleGeneration: context.lifecycleGeneration ?? state.lifecycleGeneration,
			registeredAt: context.registeredAt ?? Date.now()
		});
		return;
	}
	if (context.lifecycleGeneration && existing.lifecycleGeneration && context.lifecycleGeneration !== existing.lifecycleGeneration) return;
	if (context.sessionKey && existing.sessionKey !== context.sessionKey) existing.sessionKey = context.sessionKey;
	if (context.sessionId && existing.sessionId !== context.sessionId) existing.sessionId = context.sessionId;
	if (context.agentId && existing.agentId !== context.agentId) existing.agentId = context.agentId;
	if (context.verboseLevel && existing.verboseLevel !== context.verboseLevel) existing.verboseLevel = context.verboseLevel;
	if (context.isControlUiVisible !== void 0) existing.isControlUiVisible = context.isControlUiVisible;
	if (context.projectSessionActive !== void 0) existing.projectSessionActive = context.projectSessionActive;
	if (context.isHeartbeat !== void 0 && existing.isHeartbeat !== context.isHeartbeat) existing.isHeartbeat = context.isHeartbeat;
	if (context.registeredAt !== void 0) existing.registeredAt = context.registeredAt;
	if (context.lastActiveAt !== void 0) existing.lastActiveAt = context.lastActiveAt;
}
function getAgentRunContextOwners(state = getAgentEventState()) {
	state.runContextOwnersById ??= /* @__PURE__ */ new Map();
	return state.runContextOwnersById;
}
/** Claims a run id for a newly admitted execution, replacing stale ownership. */
function claimAgentRunContext(runId, context, options = {}) {
	if (!runId) return;
	const state = getAgentEventState();
	const lifecycleGeneration = context.lifecycleGeneration ?? state.lifecycleGeneration;
	const existing = state.runContextById.get(runId);
	const ownersById = getAgentRunContextOwners(state);
	const existingOwners = ownersById.get(runId);
	const currentOwners = existingOwners?.lifecycleGeneration === lifecycleGeneration ? existingOwners : void 0;
	const adoptsExistingUnowned = options.exclusive === true && options.adoptExistingUnowned === true && existing?.lifecycleGeneration === lifecycleGeneration && currentOwners === void 0;
	if (currentOwners?.exclusiveClaimId || options.exclusive && (existing?.lifecycleGeneration === lifecycleGeneration && !adoptsExistingUnowned || currentOwners !== void 0)) return;
	let claimId;
	if (options.trackOwner) {
		claimId = (0, node_crypto.randomUUID)();
		if (currentOwners) {
			currentOwners.claimIds.add(claimId);
			if (options.ownsContext) currentOwners.preserveAfterRelease = false;
			if (options.onClearRequested) {
				currentOwners.clearListeners ??= /* @__PURE__ */ new Map();
				currentOwners.clearListeners.set(claimId, options.onClearRequested);
			}
		} else ownersById.set(runId, {
			lifecycleGeneration,
			claimIds: /* @__PURE__ */ new Set([claimId]),
			preserveAfterRelease: options.ownsContext !== true && existing?.lifecycleGeneration === lifecycleGeneration,
			clearRequested: false,
			...options.exclusive ? { exclusiveClaimId: claimId } : {},
			...options.onClearRequested ? { clearListeners: /* @__PURE__ */ new Map([[claimId, options.onClearRequested]]) } : {}
		});
	} else if (existingOwners?.lifecycleGeneration !== lifecycleGeneration) ownersById.delete(runId);
	if (existing?.lifecycleGeneration === lifecycleGeneration) {
		registerAgentRunContext(runId, {
			...context,
			lifecycleGeneration
		}, claimId);
		return claimId;
	}
	state.runContextById.set(runId, {
		...context,
		lifecycleGeneration,
		registeredAt: context.registeredAt ?? Date.now()
	});
	state.seqByRun.delete(runId);
	return claimId;
}
/** Returns the currently registered context for a run, if it has not been cleared or swept. */
function getAgentRunContext(runId) {
	return getAgentEventState().runContextById.get(runId);
}
function getAgentRunContextOwnerStatus(runId, claimId, lifecycleGeneration) {
	const state = getAgentEventState();
	const owners = getAgentRunContextOwners(state).get(runId);
	if (lifecycleGeneration !== state.lifecycleGeneration || owners?.lifecycleGeneration !== lifecycleGeneration || !owners.claimIds.has(claimId)) return;
	return owners.clearRequested ? "clear-requested" : "active";
}
/** Lists active runs bound to one current session identity. */
function listAgentRunsForSession(params) {
	const currentLifecycleGeneration = getAgentEventState().lifecycleGeneration;
	const runs = [];
	for (const [runId, context] of getAgentEventState().runContextById) if ((context.sessionId ? context.sessionId === params.sessionId : context.sessionKey === params.sessionKey) && context.lifecycleGeneration === currentLifecycleGeneration) runs.push({
		runId,
		lifecycleGeneration: context.lifecycleGeneration
	});
	return runs.toSorted((a, b) => a.runId === b.runId ? a.lifecycleGeneration.localeCompare(b.lifecycleGeneration) : a.runId.localeCompare(b.runId));
}
function hasProjectedAgentRunForSession(params) {
	const lifecycleGeneration = getAgentEventState().lifecycleGeneration;
	for (const context of getAgentEventState().runContextById.values()) if ((context.sessionKey !== void 0 && params.sessionKeys.includes(context.sessionKey) || params.sessionId !== void 0 && context.sessionId === params.sessionId) && context.projectSessionActive === true && context.lifecycleGeneration === lifecycleGeneration) return true;
	return false;
}
/** Clears context and sequence state for a run that has ended or been discarded. */
function clearAgentRunContext(runId, lifecycleGeneration, claimId) {
	const state = getAgentEventState();
	const existing = state.runContextById.get(runId);
	if (lifecycleGeneration && existing && existing.lifecycleGeneration !== lifecycleGeneration) return;
	const owners = getAgentRunContextOwners(state).get(runId);
	if (claimId && (!owners || lifecycleGeneration && owners.lifecycleGeneration !== lifecycleGeneration || !owners.claimIds.has(claimId))) return;
	if (owners?.exclusiveClaimId && owners.exclusiveClaimId !== claimId) return;
	if (owners?.claimIds.size) {
		if (!lifecycleGeneration || owners.lifecycleGeneration === lifecycleGeneration) {
			owners.clearRequested = true;
			for (const [ownerClaimId, listener] of owners.clearListeners ?? []) listener(ownerClaimId);
		}
		return;
	}
	state.runContextById.delete(runId);
	state.seqByRun.delete(runId);
}
/** Releases one tracked owner and clears its context after the final owner exits. */
function releaseAgentRunContext(runId, claimId) {
	if (!runId || !claimId) return;
	const ownersById = getAgentRunContextOwners(getAgentEventState());
	const owners = ownersById.get(runId);
	if (!owners?.claimIds.delete(claimId)) return;
	owners.clearListeners?.delete(claimId);
	if (owners.exclusiveClaimId === claimId) owners.exclusiveClaimId = void 0;
	if (owners.claimIds.size > 0) return;
	ownersById.delete(runId);
	if (owners.clearRequested || !owners.preserveAfterRelease) clearAgentRunContext(runId, owners.lifecycleGeneration);
}
/**
* Sweep stale run contexts that exceeded the given TTL.
* Guards against orphaned entries when lifecycle "end"/"error" events are missed.
*/
function sweepStaleRunContexts(maxAgeMs = 1800 * 1e3) {
	const state = getAgentEventState();
	const now = Date.now();
	let swept = 0;
	for (const [runId, ctx] of state.runContextById.entries()) {
		const lastSeen = ctx.lastActiveAt ?? ctx.registeredAt;
		if ((lastSeen ? now - lastSeen : Infinity) > maxAgeMs) {
			state.runContextById.delete(runId);
			state.seqByRun.delete(runId);
			getAgentRunContextOwners(state).delete(runId);
			swept++;
		}
	}
	return swept;
}
function enrichAgentEvent(event, claimId) {
	const state = getAgentEventState();
	const owners = getAgentRunContextOwners(state).get(event.runId);
	if (claimId !== void 0) {
		if (owners?.lifecycleGeneration !== state.lifecycleGeneration || owners.exclusiveClaimId !== claimId || !owners.claimIds.has(claimId) || owners.clearRequested) return;
	} else if (owners?.lifecycleGeneration === state.lifecycleGeneration && owners.exclusiveClaimId) return;
	const context = state.runContextById.get(event.runId);
	const executionLifecycleGeneration = event.lifecycleGeneration ?? getAgentEventExecutionContext().getStore()?.lifecycleGeneration;
	const ownedLifecycleGeneration = executionLifecycleGeneration ?? context?.lifecycleGeneration;
	if (executionLifecycleGeneration && context?.lifecycleGeneration && executionLifecycleGeneration !== context.lifecycleGeneration) return;
	if (ownedLifecycleGeneration && ownedLifecycleGeneration !== state.lifecycleGeneration) return;
	const nextSeq = (state.seqByRun.get(event.runId) ?? 0) + 1;
	state.seqByRun.set(event.runId, nextSeq);
	if (context) context.lastActiveAt = Date.now();
	const isControlUiVisible = context?.isControlUiVisible ?? true;
	const eventSessionKey = typeof event.sessionKey === "string" && event.sessionKey.trim() ? event.sessionKey : void 0;
	const deliverySessionKey = eventSessionKey ?? context?.sessionKey;
	const sessionKey = isControlUiVisible || event.stream === "lifecycle" ? eventSessionKey ?? context?.sessionKey : void 0;
	const sessionId = event.stream === "lifecycle" ? event.sessionId ?? context?.sessionId : event.sessionId;
	const lifecycleGeneration = event.stream === "lifecycle" ? ownedLifecycleGeneration ?? state.lifecycleGeneration : ownedLifecycleGeneration;
	const agentId = event.agentId ?? context?.agentId;
	const enriched = {
		...event,
		sessionKey,
		...sessionId ? { sessionId } : {},
		...agentId ? { agentId } : {},
		seq: nextSeq,
		ts: Date.now()
	};
	if (lifecycleGeneration) Object.defineProperty(enriched, "lifecycleGeneration", {
		value: lifecycleGeneration,
		enumerable: false
	});
	if (context?.isControlUiVisible !== void 0) Object.defineProperty(enriched, "controlUiVisible", {
		value: context.isControlUiVisible,
		enumerable: false
	});
	if (claimId !== void 0) {
		Object.defineProperty(enriched, "contextClaimId", {
			value: claimId,
			enumerable: false
		});
		if (deliverySessionKey) Object.defineProperty(enriched, "deliverySessionKey", {
			value: deliverySessionKey,
			enumerable: false
		});
	}
	return enriched;
}
/** Emits an agent event after assigning per-run sequence, timestamp, and context metadata. */
function emitAgentEvent(event) {
	const enriched = enrichAgentEvent(event);
	if (enriched) notifyListeners(getAgentEventState().listeners, enriched);
}
function emitAgentEventForOwner(event, claimId) {
	const enriched = enrichAgentEvent(event, claimId);
	if (enriched) notifyListeners(getAgentEventState().listeners, enriched);
}
/** Emits run metadata only to the Gateway-owned durable audit projection. */
function emitAgentAuditEvent(event) {
	const state = getAgentEventState();
	const enriched = enrichAgentEvent(event);
	if (enriched) {
		notifyListeners(state.auditListeners, enriched);
		const phase = event.stream === "lifecycle" ? event.data.phase : void 0;
		if ((phase === "end" || phase === "error") && !state.runContextById.has(event.runId)) state.seqByRun.delete(event.runId);
	}
}
/** Emits an item activity event on the shared agent event bus. */
function emitAgentItemEvent(params) {
	emitAgentEvent({
		runId: params.runId,
		stream: "item",
		data: params.data,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
}
/** Emits an approval event on the shared agent event bus. */
function emitAgentApprovalEvent(params) {
	emitAgentEvent({
		runId: params.runId,
		stream: "approval",
		data: params.data,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
}
/** Emits command output for a running or completed item/tool call. */
function emitAgentCommandOutputEvent(params) {
	emitAgentEvent({
		runId: params.runId,
		stream: "command_output",
		data: params.data,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
}
/** Emits a patch summary for a completed file-editing item/tool call. */
function emitAgentPatchSummaryEvent(params) {
	emitAgentEvent({
		runId: params.runId,
		stream: "patch",
		data: params.data,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
}
/** Subscribes to sequenced agent events; returns an unsubscribe callback. */
function onAgentEvent(listener) {
	return registerListener(getAgentEventState().listeners, listener);
}
/** Subscribes Gateway internals that consume non-public ownership and routing metadata. */
function onAgentRuntimeEvent(listener) {
	return registerListener(getAgentEventState().listeners, listener);
}
/** Subscribes to private audit-only agent events; returns an unsubscribe callback. */
function onAgentAuditEvent(listener) {
	return registerListener(getAgentEventState().auditListeners, listener);
}
/** Clears agent event state; test suites with a live Gateway can preserve its listeners. */
function resetAgentEventsForTest(options) {
	const state = getAgentEventState();
	state.seqByRun.clear();
	if (!options?.preserveListeners) {
		state.listeners.clear();
		state.auditListeners.clear();
	}
	state.runContextById.clear();
	getAgentRunContextOwners(state).clear();
}
//#endregion
Object.defineProperty(exports, "agent_events_exports", {
	enumerable: true,
	get: function() {
		return agent_events_exports;
	}
});
Object.defineProperty(exports, "assertAgentRunLifecycleGenerationCurrent", {
	enumerable: true,
	get: function() {
		return assertAgentRunLifecycleGenerationCurrent;
	}
});
Object.defineProperty(exports, "captureAgentRunLifecycleGeneration", {
	enumerable: true,
	get: function() {
		return captureAgentRunLifecycleGeneration;
	}
});
Object.defineProperty(exports, "claimAgentRunContext", {
	enumerable: true,
	get: function() {
		return claimAgentRunContext;
	}
});
Object.defineProperty(exports, "clearAgentRunContext", {
	enumerable: true,
	get: function() {
		return clearAgentRunContext;
	}
});
Object.defineProperty(exports, "emitAgentApprovalEvent", {
	enumerable: true,
	get: function() {
		return emitAgentApprovalEvent;
	}
});
Object.defineProperty(exports, "emitAgentAuditEvent", {
	enumerable: true,
	get: function() {
		return emitAgentAuditEvent;
	}
});
Object.defineProperty(exports, "emitAgentCommandOutputEvent", {
	enumerable: true,
	get: function() {
		return emitAgentCommandOutputEvent;
	}
});
Object.defineProperty(exports, "emitAgentEvent", {
	enumerable: true,
	get: function() {
		return emitAgentEvent;
	}
});
Object.defineProperty(exports, "emitAgentEventForOwner", {
	enumerable: true,
	get: function() {
		return emitAgentEventForOwner;
	}
});
Object.defineProperty(exports, "emitAgentItemEvent", {
	enumerable: true,
	get: function() {
		return emitAgentItemEvent;
	}
});
Object.defineProperty(exports, "emitAgentPatchSummaryEvent", {
	enumerable: true,
	get: function() {
		return emitAgentPatchSummaryEvent;
	}
});
Object.defineProperty(exports, "getAgentEventLifecycleGeneration", {
	enumerable: true,
	get: function() {
		return getAgentEventLifecycleGeneration;
	}
});
Object.defineProperty(exports, "getAgentRunContext", {
	enumerable: true,
	get: function() {
		return getAgentRunContext;
	}
});
Object.defineProperty(exports, "getAgentRunContextOwnerStatus", {
	enumerable: true,
	get: function() {
		return getAgentRunContextOwnerStatus;
	}
});
Object.defineProperty(exports, "hasProjectedAgentRunForSession", {
	enumerable: true,
	get: function() {
		return hasProjectedAgentRunForSession;
	}
});
Object.defineProperty(exports, "listAgentRunsForSession", {
	enumerable: true,
	get: function() {
		return listAgentRunsForSession;
	}
});
Object.defineProperty(exports, "notifyListeners", {
	enumerable: true,
	get: function() {
		return notifyListeners;
	}
});
Object.defineProperty(exports, "onAgentAuditEvent", {
	enumerable: true,
	get: function() {
		return onAgentAuditEvent;
	}
});
Object.defineProperty(exports, "onAgentEvent", {
	enumerable: true,
	get: function() {
		return onAgentEvent;
	}
});
Object.defineProperty(exports, "onAgentRuntimeEvent", {
	enumerable: true,
	get: function() {
		return onAgentRuntimeEvent;
	}
});
Object.defineProperty(exports, "registerAgentRunContext", {
	enumerable: true,
	get: function() {
		return registerAgentRunContext;
	}
});
Object.defineProperty(exports, "registerListener", {
	enumerable: true,
	get: function() {
		return registerListener;
	}
});
Object.defineProperty(exports, "releaseAgentRunContext", {
	enumerable: true,
	get: function() {
		return releaseAgentRunContext;
	}
});
Object.defineProperty(exports, "sweepStaleRunContexts", {
	enumerable: true,
	get: function() {
		return sweepStaleRunContexts;
	}
});
Object.defineProperty(exports, "withAgentRunLifecycleGeneration", {
	enumerable: true,
	get: function() {
		return withAgentRunLifecycleGeneration;
	}
});
