const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_subagent_run_generation = require("./subagent-run-generation-Ds6deSIQ.cjs");
const require_subagent_run_liveness = require("./subagent-run-liveness-DmyqOa7r.cjs");
//#region src/agents/subagent-registry-memory.ts
const subagentRuns = /* @__PURE__ */ new Map();
//#endregion
//#region src/agents/subagent-registry-queries.ts
function resolveControllerSessionKey(entry) {
	return entry.controllerSessionKey?.trim() || entry.requesterSessionKey;
}
/** Lists requester-owned runs, optionally scoped to the lifetime of a requester run. */
function listRunsForRequesterFromRuns(runs, requesterSessionKey, options) {
	const key = requesterSessionKey.trim();
	if (!key) return [];
	const requesterRunId = options?.requesterRunId?.trim();
	const requesterRun = requesterRunId ? runs.get(requesterRunId) : void 0;
	const requesterRunMatchesScope = requesterRun && requesterRun.childSessionKey === key ? requesterRun : void 0;
	const lowerBound = requesterRunMatchesScope?.startedAt ?? requesterRunMatchesScope?.createdAt;
	const upperBound = requesterRunMatchesScope?.endedAt;
	return [...runs.values()].filter((entry) => {
		if (entry.requesterSessionKey !== key) return false;
		if (typeof lowerBound === "number" && entry.createdAt < lowerBound) return false;
		if (typeof upperBound === "number" && entry.createdAt > upperBound) return false;
		return true;
	});
}
/** Lists runs controlled by the normalized controller session key. */
function listRunsForControllerFromRuns(runs, controllerSessionKey) {
	const key = controllerSessionKey.trim();
	if (!key) return [];
	return [...runs.values()].filter((entry) => resolveControllerSessionKey(entry) === key);
}
function rememberLatestRunEntry(map, key, entry) {
	const existing = map.get(key);
	if (!existing || require_subagent_run_generation.compareSubagentRunGeneration(entry, existing) > 0) map.set(key, entry);
}
/** Builds a reusable latest-generation lookup from one registry snapshot. */
function buildLatestSubagentRunReadIndexFromRuns(runs) {
	const latestRunByChildSessionKey = /* @__PURE__ */ new Map();
	for (const entry of runs.values()) {
		const childSessionKey = entry.childSessionKey.trim();
		if (!childSessionKey) continue;
		rememberLatestRunEntry(latestRunByChildSessionKey, childSessionKey, entry);
	}
	return { getLatestSubagentRun: (childSessionKey) => latestRunByChildSessionKey.get(childSessionKey.trim()) ?? null };
}
function rememberLatestRunPair(map, key, runId, entry) {
	const existing = map.get(key);
	if (!existing || require_subagent_run_generation.compareSubagentRunGeneration(entry, existing.entry) > 0) map.set(key, {
		runId,
		entry
	});
}
/** Builds a read index from snapshot and optional in-memory runs. */
function buildSubagentRunReadIndexFromRuns(params) {
	const { runs } = params;
	const now = params.now ?? Date.now();
	const inMemoryDisplayByChildSessionKey = /* @__PURE__ */ new Map();
	const latestSnapshotActiveByChildSessionKey = /* @__PURE__ */ new Map();
	const latestSnapshotEndedByChildSessionKey = /* @__PURE__ */ new Map();
	const latestRunByChildSessionKey = /* @__PURE__ */ new Map();
	const runsByControllerSessionKey = /* @__PURE__ */ new Map();
	const latestRunByRequesterAndChildSessionKey = /* @__PURE__ */ new Map();
	const activeDescendantCountBySessionKey = /* @__PURE__ */ new Map();
	for (const entry of params.inMemoryRuns ?? []) {
		const childSessionKey = entry.childSessionKey.trim();
		if (!childSessionKey) continue;
		let display = inMemoryDisplayByChildSessionKey.get(childSessionKey);
		if (!display) {
			display = {
				latestInMemoryActive: null,
				latestInMemoryEnded: null
			};
			inMemoryDisplayByChildSessionKey.set(childSessionKey, display);
		}
		if (require_subagent_run_liveness.hasSubagentRunEnded(entry)) {
			if (!display.latestInMemoryEnded || require_subagent_run_generation.compareSubagentRunGeneration(entry, display.latestInMemoryEnded) > 0) display.latestInMemoryEnded = entry;
			continue;
		}
		if (!display.latestInMemoryActive || require_subagent_run_generation.compareSubagentRunGeneration(entry, display.latestInMemoryActive) > 0) display.latestInMemoryActive = entry;
	}
	for (const [runId, entry] of runs.entries()) {
		const childSessionKey = entry.childSessionKey.trim();
		const controllerSessionKey = resolveControllerSessionKey(entry);
		if (controllerSessionKey) {
			let controllerRuns = runsByControllerSessionKey.get(controllerSessionKey);
			if (!controllerRuns) {
				controllerRuns = [];
				runsByControllerSessionKey.set(controllerSessionKey, controllerRuns);
			}
			controllerRuns.push(entry);
		}
		if (!childSessionKey) continue;
		if (require_subagent_run_liveness.isLiveUnendedSubagentRun(entry, now)) rememberLatestRunEntry(latestSnapshotActiveByChildSessionKey, childSessionKey, entry);
		else rememberLatestRunEntry(latestSnapshotEndedByChildSessionKey, childSessionKey, entry);
		rememberLatestRunPair(latestRunByChildSessionKey, childSessionKey, runId, entry);
		const requesterSessionKey = entry.requesterSessionKey;
		if (!requesterSessionKey) continue;
		let latestByChild = latestRunByRequesterAndChildSessionKey.get(requesterSessionKey);
		if (!latestByChild) {
			latestByChild = /* @__PURE__ */ new Map();
			latestRunByRequesterAndChildSessionKey.set(requesterSessionKey, latestByChild);
		}
		rememberLatestRunPair(latestByChild, childSessionKey, runId, entry);
	}
	const getDisplaySubagentRun = (childSessionKey) => {
		const key = childSessionKey.trim();
		if (!key) return null;
		const inMemoryDisplay = inMemoryDisplayByChildSessionKey.get(key);
		if (inMemoryDisplay) {
			const latestInMemoryEnded = inMemoryDisplay.latestInMemoryEnded;
			const latestInMemoryActive = inMemoryDisplay.latestInMemoryActive;
			if (latestInMemoryEnded || latestInMemoryActive) {
				if (latestInMemoryEnded && (!latestInMemoryActive || require_subagent_run_generation.compareSubagentRunGeneration(latestInMemoryEnded, latestInMemoryActive) > 0)) return latestInMemoryEnded;
				return latestInMemoryActive ?? latestInMemoryEnded;
			}
		}
		return latestSnapshotActiveByChildSessionKey.get(key) ?? latestSnapshotEndedByChildSessionKey.get(key) ?? null;
	};
	const countActiveDescendantRuns = (rootSessionKey) => {
		const root = rootSessionKey.trim();
		if (!root) return 0;
		if (activeDescendantCountBySessionKey.has(root)) return activeDescendantCountBySessionKey.get(root) ?? 0;
		let count = 0;
		const pending = [root];
		const visited = /* @__PURE__ */ new Set([root]);
		for (const requester of pending) {
			if (!requester) continue;
			const latestByChild = latestRunByRequesterAndChildSessionKey.get(requester);
			if (!latestByChild) continue;
			for (const [childSessionKey, pair] of latestByChild.entries()) {
				const latestForChildSession = latestRunByChildSessionKey.get(childSessionKey);
				if (!latestForChildSession || latestForChildSession.runId !== pair.runId || latestForChildSession.entry.requesterSessionKey !== requester) continue;
				if (require_subagent_run_liveness.isLiveUnendedSubagentRun(pair.entry, now)) count += 1;
				if (!childSessionKey || visited.has(childSessionKey)) continue;
				visited.add(childSessionKey);
				pending.push(childSessionKey);
			}
		}
		activeDescendantCountBySessionKey.set(root, count);
		return count;
	};
	return {
		getDisplaySubagentRun,
		countActiveDescendantRuns,
		runsByControllerSessionKey
	};
}
function findLatestRunForChildSession(runs, childSessionKey) {
	const key = childSessionKey.trim();
	if (!key) return;
	let latest;
	for (const entry of runs.values()) {
		if (entry.childSessionKey !== key) continue;
		if (!latest || require_subagent_run_generation.compareSubagentRunGeneration(entry, latest) > 0) latest = entry;
	}
	return latest;
}
/** Returns whether the latest run for a child session is still live. */
function isSubagentSessionRunActiveFromRuns(runs, childSessionKey) {
	const latest = findLatestRunForChildSession(runs, childSessionKey);
	return Boolean(latest && require_subagent_run_liveness.isLiveUnendedSubagentRun(latest));
}
/** Returns the preferred run for a child session, active first then latest ended. */
function getSubagentRunByChildSessionKeyFromRuns(runs, childSessionKey) {
	const key = childSessionKey.trim();
	if (!key) return null;
	let latestActive = null;
	let latestEnded = null;
	for (const entry of runs.values()) {
		if (entry.childSessionKey !== key) continue;
		if (require_subagent_run_liveness.isLiveUnendedSubagentRun(entry)) {
			if (!latestActive || require_subagent_run_generation.compareSubagentRunGeneration(entry, latestActive) > 0) latestActive = entry;
			continue;
		}
		if (!latestEnded || require_subagent_run_generation.compareSubagentRunGeneration(entry, latestEnded) > 0) latestEnded = entry;
	}
	return latestActive ?? latestEnded;
}
/** Resolves the requester and delivery origin for the latest child-session run. */
function resolveRequesterForChildSessionFromRuns(runs, childSessionKey) {
	const latest = findLatestRunForChildSession(runs, childSessionKey);
	if (!latest) return null;
	return {
		requesterSessionKey: latest.requesterSessionKey,
		requesterOrigin: latest.requesterOrigin
	};
}
/** Returns whether post-completion announce should be skipped for a cleaned-up run. */
function shouldIgnorePostCompletionAnnounceForSessionFromRuns(runs, childSessionKey) {
	const latest = findLatestRunForChildSession(runs, childSessionKey);
	return Boolean(latest && latest.spawnMode !== "session" && typeof latest.endedAt === "number" && typeof latest.cleanupCompletedAt === "number" && latest.cleanupCompletedAt >= latest.endedAt);
}
/** Counts active direct child runs plus completed children that still have pending descendants. */
function countActiveRunsForSessionFromRuns(runs, controllerSessionKey) {
	const key = controllerSessionKey.trim();
	if (!key) return 0;
	const pendingDescendantCache = /* @__PURE__ */ new Map();
	const pendingDescendantCount = (sessionKey) => {
		if (pendingDescendantCache.has(sessionKey)) return pendingDescendantCache.get(sessionKey) ?? 0;
		const pending = countPendingDescendantRunsInternal(runs, sessionKey);
		pendingDescendantCache.set(sessionKey, pending);
		return pending;
	};
	const latestByChildSessionKey = /* @__PURE__ */ new Map();
	for (const entry of runs.values()) {
		if (resolveControllerSessionKey(entry) !== key) continue;
		const existing = latestByChildSessionKey.get(entry.childSessionKey);
		if (!existing || require_subagent_run_generation.compareSubagentRunGeneration(entry, existing) > 0) latestByChildSessionKey.set(entry.childSessionKey, entry);
	}
	let count = 0;
	for (const entry of latestByChildSessionKey.values()) {
		if (require_subagent_run_liveness.isLiveUnendedSubagentRun(entry)) {
			count += 1;
			continue;
		}
		if (pendingDescendantCount(entry.childSessionKey) > 0) count += 1;
	}
	return count;
}
function forEachDescendantRun(runs, rootSessionKey, visitor) {
	const root = rootSessionKey.trim();
	if (!root) return false;
	const pending = [root];
	const visited = /* @__PURE__ */ new Set([root]);
	for (const requester of pending) {
		if (!requester) continue;
		const latestByChildSessionKey = /* @__PURE__ */ new Map();
		for (const [runId, entry] of runs.entries()) {
			if (entry.requesterSessionKey !== requester) continue;
			const childKey = entry.childSessionKey.trim();
			const existing = latestByChildSessionKey.get(childKey);
			if (!existing || require_subagent_run_generation.compareSubagentRunGeneration(entry, existing[1]) > 0) latestByChildSessionKey.set(childKey, [runId, entry]);
		}
		for (const [runId, entry] of latestByChildSessionKey.values()) {
			const latestForChildSession = findLatestRunForChildSession(runs, entry.childSessionKey);
			if (!latestForChildSession || latestForChildSession.runId !== runId || latestForChildSession.requesterSessionKey !== requester) continue;
			visitor(runId, entry);
			const childKey = entry.childSessionKey.trim();
			if (!childKey || visited.has(childKey)) continue;
			visited.add(childKey);
			pending.push(childKey);
		}
	}
	return true;
}
/** Counts live descendants under a requester/session tree. */
function countActiveDescendantRunsFromRuns(runs, rootSessionKey) {
	let count = 0;
	if (!forEachDescendantRun(runs, rootSessionKey, (_runId, entry) => {
		if (require_subagent_run_liveness.isLiveUnendedSubagentRun(entry)) count += 1;
	})) return 0;
	return count;
}
function countPendingDescendantRunsInternal(runs, rootSessionKey, excludeRunId) {
	const excludedRunId = excludeRunId?.trim();
	let count = 0;
	if (!forEachDescendantRun(runs, rootSessionKey, (runId, entry) => {
		const runEnded = require_subagent_run_liveness.hasSubagentRunEnded(entry);
		const cleanupCompleted = typeof entry.cleanupCompletedAt === "number";
		if ((runEnded ? !cleanupCompleted : require_subagent_run_liveness.isLiveUnendedSubagentRun(entry)) && runId !== excludedRunId) count += 1;
	})) return 0;
	return count;
}
/** Counts descendants that are live or ended but not yet cleaned up. */
function countPendingDescendantRunsFromRuns(runs, rootSessionKey) {
	return countPendingDescendantRunsInternal(runs, rootSessionKey);
}
/** Counts pending descendants while excluding one run id from the total. */
function countPendingDescendantRunsExcludingRunFromRuns(runs, rootSessionKey, excludeRunId) {
	return countPendingDescendantRunsInternal(runs, rootSessionKey, excludeRunId);
}
/** Lists latest descendant runs under a requester/session tree. */
function listDescendantRunsForRequesterFromRuns(runs, rootSessionKey) {
	const descendants = [];
	if (!forEachDescendantRun(runs, rootSessionKey, (_runId, entry) => {
		descendants.push(entry);
	})) return [];
	return descendants;
}
//#endregion
//#region src/agents/subagent-delivery-state.ts
/** Normalizes legacy subagent run fields into nested execution/completion/delivery state. */
function normalizeSubagentRunState(entry) {
	const legacy = entry;
	entry.taskRunId = (typeof entry.taskRunId === "string" ? entry.taskRunId.trim() : "") || void 0;
	entry.generation = typeof entry.generation === "number" && Number.isSafeInteger(entry.generation) && entry.generation > 0 ? entry.generation : void 0;
	entry.deleteCleanupDispatchedAt = Number.isFinite(entry.deleteCleanupDispatchedAt) ? entry.deleteCleanupDispatchedAt : void 0;
	entry.suppressCompletionDelivery = entry.suppressCompletionDelivery === true ? true : void 0;
	entry.terminalOwner = entry.terminalOwner === "interrupted-recovery" && Number.isFinite(entry.endedAt) && entry.outcome?.status === "error" && entry.endedReason === "subagent-error" && entry.pauseReason !== "sessions_yield" ? "interrupted-recovery" : void 0;
	const killReconciliation = entry.killReconciliation;
	if (!killReconciliation || typeof killReconciliation !== "object" || !Number.isFinite(killReconciliation.killedAt)) delete entry.killReconciliation;
	else entry.killReconciliation = {
		killedAt: killReconciliation.killedAt,
		suppressTaskDelivery: killReconciliation.suppressTaskDelivery === true ? true : void 0,
		supersededAt: Number.isFinite(killReconciliation.supersededAt) ? killReconciliation.supersededAt : void 0
	};
	entry.execution = mergeExecutionState(entry.execution, buildExecutionState(entry));
	entry.completion = mergeCompletionState(entry.completion, buildCompletionState(entry, legacy));
	entry.delivery = mergeDeliveryState(entry, entry.delivery, buildDeliveryState(entry, legacy));
	delete entry.delivery?.handoffLeaseId;
	delete entry.delivery?.handoffLeasedAt;
	delete entry.delivery?.handoffInjectedAt;
	if (entry.cleanupHandled === true && typeof entry.cleanupCompletedAt !== "number" && entry.delivery?.status !== "discarded") entry.cleanupHandled = false;
	delete legacy.announceRetryCount;
	delete legacy.lastAnnounceRetryAt;
	delete legacy.lastAnnounceDeliveryError;
	delete legacy.frozenResultText;
	delete legacy.frozenResultCapturedAt;
	delete legacy.fallbackFrozenResultText;
	delete legacy.fallbackFrozenResultCapturedAt;
	delete legacy.pendingFinalDelivery;
	delete legacy.pendingFinalDeliveryCreatedAt;
	delete legacy.pendingFinalDeliveryLastAttemptAt;
	delete legacy.pendingFinalDeliveryAttemptCount;
	delete legacy.pendingFinalDeliveryLastError;
	delete legacy.pendingFinalDeliveryPayload;
	delete legacy.deliverySuspendedAt;
	delete legacy.deliverySuspendedReason;
	delete legacy.deliveryDiscardedAt;
	delete legacy.deliveryDiscardReason;
	delete legacy.deliveryDiscardedPayloadSummary;
	delete legacy.completionEnqueuedAt;
	delete legacy.completionDeliveredAt;
	delete legacy.completionAnnouncedAt;
	delete legacy.lastAnnounceDropReason;
	return entry;
}
function mergeExecutionState(current, restored) {
	return current ? {
		...restored,
		...current
	} : restored;
}
function mergeCompletionState(current, restored) {
	if (!current) return restored;
	return {
		...restored,
		...current,
		required: current.required ?? restored.required
	};
}
function mergeDeliveryState(entry, current, restored) {
	if (!current) return restored;
	const status = current.status === "not_required" && entry.expectsCompletionMessage !== false && restored.status !== "not_required" ? restored.status : current.status;
	return {
		...restored,
		...current,
		status,
		payload: current.payload ?? restored.payload,
		createdAt: current.createdAt ?? restored.createdAt,
		enqueuedAt: current.enqueuedAt ?? restored.enqueuedAt,
		deliveredAt: current.deliveredAt ?? restored.deliveredAt,
		announcedAt: current.announcedAt ?? restored.announcedAt,
		lastAttemptAt: current.lastAttemptAt ?? restored.lastAttemptAt,
		attemptCount: current.attemptCount ?? restored.attemptCount,
		lastError: current.lastError ?? restored.lastError,
		steeringLeaseId: current.steeringLeaseId ?? current.handoffLeaseId ?? restored.steeringLeaseId,
		steeringLeasedAt: current.steeringLeasedAt ?? current.handoffLeasedAt ?? restored.steeringLeasedAt,
		steeringInjectedAt: current.steeringInjectedAt ?? current.handoffInjectedAt ?? restored.steeringInjectedAt,
		suspendedAt: current.suspendedAt ?? restored.suspendedAt,
		suspendedReason: current.suspendedReason ?? restored.suspendedReason,
		discardedAt: current.discardedAt ?? restored.discardedAt,
		discardReason: current.discardReason ?? restored.discardReason,
		discardedPayloadSummary: current.discardedPayloadSummary ?? restored.discardedPayloadSummary,
		lastDropReason: current.lastDropReason ?? restored.lastDropReason
	};
}
function buildExecutionState(entry) {
	if (typeof entry.endedAt === "number") return {
		status: "terminal",
		startedAt: entry.startedAt,
		endedAt: entry.endedAt,
		outcome: entry.outcome
	};
	return {
		status: "running",
		startedAt: entry.startedAt
	};
}
function buildCompletionState(entry, legacy) {
	return {
		required: entry.expectsCompletionMessage === true,
		...legacy.frozenResultText !== void 0 ? { resultText: legacy.frozenResultText } : {},
		...typeof legacy.frozenResultCapturedAt === "number" ? { capturedAt: legacy.frozenResultCapturedAt } : {},
		...legacy.fallbackFrozenResultText !== void 0 ? { fallbackResultText: legacy.fallbackFrozenResultText } : {},
		...typeof legacy.fallbackFrozenResultCapturedAt === "number" ? { fallbackCapturedAt: legacy.fallbackFrozenResultCapturedAt } : {}
	};
}
function buildDeliveryState(entry, legacy) {
	if (entry.expectsCompletionMessage === false) return { status: "not_required" };
	if (typeof legacy.deliveryDiscardedAt === "number") return {
		status: "discarded",
		discardedAt: legacy.deliveryDiscardedAt,
		discardReason: legacy.deliveryDiscardReason,
		discardedPayloadSummary: legacy.deliveryDiscardedPayloadSummary
	};
	if (typeof legacy.deliverySuspendedAt === "number") return {
		status: "suspended",
		payload: legacy.pendingFinalDeliveryPayload,
		createdAt: legacy.pendingFinalDeliveryCreatedAt,
		lastAttemptAt: legacy.pendingFinalDeliveryLastAttemptAt ?? legacy.lastAnnounceRetryAt,
		attemptCount: legacy.pendingFinalDeliveryAttemptCount ?? legacy.announceRetryCount,
		lastError: legacy.pendingFinalDeliveryLastError ?? legacy.lastAnnounceDeliveryError ?? null,
		suspendedAt: legacy.deliverySuspendedAt,
		suspendedReason: legacy.deliverySuspendedReason,
		lastDropReason: legacy.lastAnnounceDropReason
	};
	if (typeof legacy.completionAnnouncedAt === "number") return {
		status: "delivered",
		enqueuedAt: legacy.completionEnqueuedAt,
		deliveredAt: legacy.completionDeliveredAt ?? legacy.completionAnnouncedAt,
		announcedAt: legacy.completionAnnouncedAt,
		lastDropReason: legacy.lastAnnounceDropReason
	};
	if (legacy.pendingFinalDelivery === true || legacy.pendingFinalDeliveryPayload) return {
		status: "pending",
		payload: legacy.pendingFinalDeliveryPayload,
		createdAt: legacy.pendingFinalDeliveryCreatedAt,
		lastAttemptAt: legacy.pendingFinalDeliveryLastAttemptAt ?? legacy.lastAnnounceRetryAt,
		attemptCount: legacy.pendingFinalDeliveryAttemptCount ?? legacy.announceRetryCount,
		lastError: legacy.pendingFinalDeliveryLastError ?? legacy.lastAnnounceDeliveryError ?? null,
		enqueuedAt: legacy.completionEnqueuedAt,
		deliveredAt: legacy.completionDeliveredAt,
		lastDropReason: legacy.lastAnnounceDropReason
	};
	return {
		status: typeof entry.endedAt === "number" ? "pending" : "not_required",
		enqueuedAt: legacy.completionEnqueuedAt,
		deliveredAt: legacy.completionDeliveredAt,
		lastAttemptAt: legacy.lastAnnounceRetryAt,
		attemptCount: legacy.announceRetryCount,
		lastError: legacy.lastAnnounceDeliveryError ?? null,
		lastDropReason: legacy.lastAnnounceDropReason
	};
}
/** Ensures a run has a nested completion state object. */
function ensureCompletionState(entry) {
	entry.completion ??= { required: entry.expectsCompletionMessage === true };
	return entry.completion;
}
/** Ensures a run has a nested delivery state object. */
function ensureDeliveryState(entry) {
	entry.delivery ??= { status: entry.expectsCompletionMessage === false ? "not_required" : "pending" };
	return entry.delivery;
}
/** Resets delivery state to its initial status for the run's completion requirement. */
function clearDeliveryState(entry) {
	entry.delivery = { status: entry.expectsCompletionMessage === false ? "not_required" : "pending" };
}
/** Returns true when delivery is suspended with a durable timestamp. */
function isDeliverySuspended(entry) {
	return entry.delivery?.status === "suspended" && typeof entry.delivery.suspendedAt === "number";
}
/** Reads the current delivery attempt count. */
function getDeliveryAttemptCount(entry) {
	return entry.delivery?.attemptCount ?? 0;
}
/** Reads the timestamp of the last delivery attempt. */
function getDeliveryLastAttemptAt(entry) {
	return entry.delivery?.lastAttemptAt;
}
/** Reads the non-empty last delivery error. */
function getDeliveryLastError(entry) {
	const error = entry.delivery?.lastError;
	return typeof error === "string" && error.trim() ? error : void 0;
}
//#endregion
//#region src/agents/subagent-registry.store.sqlite.ts
/** Converts undefined to null so optional record fields round-trip through sqlite columns. */
function jsonStringify(value) {
	return value === void 0 ? null : JSON.stringify(value);
}
function parseJson(raw) {
	if (!raw) return;
	try {
		return JSON.parse(raw);
	} catch {
		return;
	}
}
function boolToSqlite(value) {
	return value === void 0 ? null : value ? 1 : 0;
}
function sqliteBool(value) {
	return value == null ? void 0 : value !== 0;
}
function normalizeFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function createDeliveryFromTypedColumns(row, fallback) {
	const delivery = fallback ? { ...fallback } : void 0;
	const payload = parseJson(row.pending_final_delivery_payload_json);
	const status = row.expects_completion_message === 0 ? "not_required" : row.pending_final_delivery ? "pending" : delivery?.status;
	if (!status && row.completion_announced_at == null && row.last_announce_delivery_error == null) return delivery;
	return {
		status: status ?? "pending",
		...delivery,
		...payload ? { payload } : {},
		...normalizeFiniteNumber(row.pending_final_delivery_created_at) !== void 0 ? { createdAt: row.pending_final_delivery_created_at ?? void 0 } : {},
		...normalizeFiniteNumber(row.pending_final_delivery_last_attempt_at) !== void 0 ? { lastAttemptAt: row.pending_final_delivery_last_attempt_at ?? void 0 } : {},
		...normalizeFiniteNumber(row.pending_final_delivery_attempt_count) !== void 0 ? { attemptCount: row.pending_final_delivery_attempt_count ?? void 0 } : {},
		...row.pending_final_delivery_last_error !== null ? { lastError: row.pending_final_delivery_last_error } : {},
		...row.completion_announced_at !== null ? {
			status: "delivered",
			announcedAt: row.completion_announced_at,
			deliveredAt: delivery?.deliveredAt ?? row.completion_announced_at
		} : {}
	};
}
/** Rehydrates one sqlite row into the normalized subagent run record shape. */
function rowToSubagentRunRecord(row) {
	const payload = parseJson(row.payload_json) ?? {};
	const requesterOrigin = parseJson(row.requester_origin_json) ?? payload.requesterOrigin;
	const outcome = parseJson(row.outcome_json) ?? payload.outcome;
	const completion = {
		...payload.completion ?? { required: row.expects_completion_message === 1 },
		required: payload.completion?.required ?? row.expects_completion_message === 1,
		...row.frozen_result_text !== null ? { resultText: row.frozen_result_text } : {},
		...row.frozen_result_captured_at !== null ? { capturedAt: row.frozen_result_captured_at } : {},
		...row.fallback_frozen_result_text !== null ? { fallbackResultText: row.fallback_frozen_result_text } : {},
		...row.fallback_frozen_result_captured_at !== null ? { fallbackCapturedAt: row.fallback_frozen_result_captured_at } : {}
	};
	const execution = payload.execution ? {
		...payload.execution,
		...row.started_at !== null ? { startedAt: row.started_at } : {},
		...row.ended_at !== null ? {
			status: "terminal",
			endedAt: row.ended_at,
			outcome
		} : {}
	} : void 0;
	const delivery = createDeliveryFromTypedColumns(row, payload.delivery);
	const record = normalizeSubagentRunState({
		...payload,
		runId: row.run_id,
		childSessionKey: row.child_session_key,
		...row.controller_session_key ? { controllerSessionKey: row.controller_session_key } : {},
		requesterSessionKey: row.requester_session_key,
		...requesterOrigin ? { requesterOrigin: require_delivery_context_shared.normalizeDeliveryContext(requesterOrigin) } : {},
		requesterDisplayKey: row.requester_display_key,
		task: row.task,
		cleanup: row.cleanup === "delete" ? "delete" : "keep",
		...row.task_name ? { taskName: row.task_name } : {},
		...row.label ? { label: row.label } : {},
		...row.model ? { model: row.model } : {},
		...row.agent_dir ? { agentDir: row.agent_dir } : {},
		...row.workspace_dir ? { workspaceDir: row.workspace_dir } : {},
		...row.run_timeout_seconds !== null ? { runTimeoutSeconds: row.run_timeout_seconds } : {},
		...row.spawn_mode === "session" || row.spawn_mode === "run" ? { spawnMode: row.spawn_mode } : {},
		createdAt: row.created_at,
		...row.started_at !== null ? { startedAt: row.started_at } : {},
		...row.session_started_at !== null ? { sessionStartedAt: row.session_started_at } : {},
		...row.accumulated_runtime_ms !== null ? { accumulatedRuntimeMs: row.accumulated_runtime_ms } : {},
		...row.ended_at !== null ? { endedAt: row.ended_at } : {},
		...outcome ? { outcome } : {},
		...row.archive_at_ms !== null ? { archiveAtMs: row.archive_at_ms } : {},
		...row.cleanup_completed_at !== null ? { cleanupCompletedAt: row.cleanup_completed_at } : {},
		...sqliteBool(row.cleanup_handled) !== void 0 ? { cleanupHandled: sqliteBool(row.cleanup_handled) } : {},
		...row.suppress_announce_reason === "steer-restart" || row.suppress_announce_reason === "killed" ? { suppressAnnounceReason: row.suppress_announce_reason } : {},
		...sqliteBool(row.expects_completion_message) !== void 0 ? { expectsCompletionMessage: sqliteBool(row.expects_completion_message) } : {},
		...row.ended_reason ? { endedReason: row.ended_reason } : {},
		...row.pause_reason === "sessions_yield" ? { pauseReason: row.pause_reason } : {},
		...sqliteBool(row.wake_on_descendant_settle) !== void 0 ? { wakeOnDescendantSettle: sqliteBool(row.wake_on_descendant_settle) } : {},
		...execution ? { execution } : {},
		completion,
		...row.ended_hook_emitted_at !== null ? { endedHookEmittedAt: row.ended_hook_emitted_at } : {},
		...delivery ? { delivery } : {}
	});
	return record.runId && record.childSessionKey && record.requesterSessionKey ? record : null;
}
/** Flattens a normalized subagent run into typed sqlite columns plus payload_json. */
function subagentRunRecordToSqliteInsert(entry) {
	const normalized = normalizeSubagentRunState(structuredClone(entry));
	const delivery = normalized.delivery;
	const completion = normalized.completion;
	return {
		run_id: normalized.runId,
		child_session_key: normalized.childSessionKey,
		controller_session_key: normalized.controllerSessionKey ?? null,
		requester_session_key: normalized.requesterSessionKey,
		requester_display_key: normalized.requesterDisplayKey,
		requester_origin_json: jsonStringify(normalized.requesterOrigin),
		task: normalized.task,
		task_name: normalized.taskName ?? null,
		cleanup: normalized.cleanup,
		label: normalized.label ?? null,
		model: normalized.model ?? null,
		agent_dir: normalized.agentDir ?? null,
		workspace_dir: normalized.workspaceDir ?? null,
		run_timeout_seconds: normalized.runTimeoutSeconds ?? null,
		spawn_mode: normalized.spawnMode ?? null,
		created_at: normalized.createdAt,
		started_at: normalized.startedAt ?? null,
		session_started_at: normalized.sessionStartedAt ?? null,
		accumulated_runtime_ms: normalized.accumulatedRuntimeMs ?? null,
		ended_at: normalized.endedAt ?? null,
		outcome_json: jsonStringify(normalized.outcome),
		archive_at_ms: normalized.archiveAtMs ?? null,
		cleanup_completed_at: normalized.cleanupCompletedAt ?? null,
		cleanup_handled: boolToSqlite(normalized.cleanupHandled),
		suppress_announce_reason: normalized.suppressAnnounceReason ?? null,
		expects_completion_message: boolToSqlite(normalized.expectsCompletionMessage),
		announce_retry_count: delivery?.attemptCount ?? null,
		last_announce_retry_at: delivery?.lastAttemptAt ?? null,
		last_announce_delivery_error: delivery?.lastError ?? null,
		ended_reason: normalized.endedReason ?? null,
		pause_reason: normalized.pauseReason ?? null,
		wake_on_descendant_settle: boolToSqlite(normalized.wakeOnDescendantSettle),
		frozen_result_text: completion?.resultText ?? null,
		frozen_result_captured_at: completion?.capturedAt ?? null,
		fallback_frozen_result_text: completion?.fallbackResultText ?? null,
		fallback_frozen_result_captured_at: completion?.fallbackCapturedAt ?? null,
		ended_hook_emitted_at: normalized.endedHookEmittedAt ?? null,
		pending_final_delivery: boolToSqlite(delivery?.status === "pending" || Boolean(delivery?.payload)),
		pending_final_delivery_created_at: delivery?.createdAt ?? null,
		pending_final_delivery_last_attempt_at: delivery?.lastAttemptAt ?? null,
		pending_final_delivery_attempt_count: delivery?.attemptCount ?? null,
		pending_final_delivery_last_error: delivery?.lastError ?? null,
		pending_final_delivery_payload_json: jsonStringify(delivery?.payload),
		completion_announced_at: delivery?.announcedAt ?? null,
		payload_json: JSON.stringify(normalized)
	};
}
function subagentRunRecordToSqliteUpdate(values) {
	const { run_id: _runId, ...update } = values;
	return update;
}
function readSubagentRegistryRows() {
	const { db } = require_openclaw_state_db.openOperatorStateDatabase();
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("subagent_runs").selectAll().orderBy("created_at", "asc").orderBy("run_id", "asc")).rows;
}
/** Loads the canonical subagent registry from shared SQLite state. */
function loadSubagentRegistryFromSqlite() {
	const runs = /* @__PURE__ */ new Map();
	for (const row of readSubagentRegistryRows()) {
		const entry = rowToSubagentRunRecord(row);
		if (entry) runs.set(entry.runId, entry);
	}
	return runs;
}
/** Saves the complete subagent run snapshot to sqlite and prunes rows not in the snapshot. */
function saveSubagentRegistryToSqlite(runs) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const runIds = [];
		for (const entry of runs.values()) {
			const values = subagentRunRecordToSqliteInsert(entry);
			runIds.push(values.run_id);
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("subagent_runs").values(values).onConflict((conflict) => conflict.column("run_id").doUpdateSet(subagentRunRecordToSqliteUpdate(values))));
		}
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, runIds.length === 0 ? stateDb.deleteFrom("subagent_runs") : stateDb.deleteFrom("subagent_runs").where("run_id", "not in", runIds));
	});
}
//#endregion
//#region src/agents/subagent-registry-state.ts
/**
* Subagent registry state persistence bridge.
*
* Merges process-local active runs with persisted SQLite state for cross-process readers.
*/
const SUBAGENT_RUNS_READ_CACHE_TTL_MS = 500;
let persistedSubagentRunsReadCache;
function cloneSubagentRunsSnapshot(runs) {
	return new Map([...runs.entries()].map(([runId, entry]) => [runId, structuredClone(entry)]));
}
function rememberPersistedSubagentRunsSnapshot(runs) {
	persistedSubagentRunsReadCache = {
		loadedAtMs: Date.now(),
		runs: cloneSubagentRunsSnapshot(runs)
	};
}
function loadPersistedSubagentRunsForRead() {
	const nowMs = Date.now();
	if (persistedSubagentRunsReadCache && nowMs >= persistedSubagentRunsReadCache.loadedAtMs && nowMs - persistedSubagentRunsReadCache.loadedAtMs < SUBAGENT_RUNS_READ_CACHE_TTL_MS) return persistedSubagentRunsReadCache.runs;
	const runs = loadSubagentRegistryFromSqlite();
	persistedSubagentRunsReadCache = {
		loadedAtMs: nowMs,
		runs
	};
	return runs;
}
function clearSubagentRunsReadCacheForTest() {
	persistedSubagentRunsReadCache = void 0;
}
function persistSubagentRunsToDisk(runs) {
	try {
		saveSubagentRegistryToSqlite(runs);
		rememberPersistedSubagentRunsSnapshot(runs);
	} catch {}
}
function persistSubagentRunsToDiskOrThrow(runs) {
	saveSubagentRegistryToSqlite(runs);
	rememberPersistedSubagentRunsSnapshot(runs);
}
function restoreSubagentRunsFromDisk(params) {
	const restored = loadSubagentRegistryFromSqlite();
	if (restored.size === 0) return 0;
	let added = 0;
	for (const [runId, entry] of restored.entries()) {
		if (!runId || !entry) continue;
		if (params.mergeOnly && params.runs.has(runId)) continue;
		params.runs.set(runId, entry);
		added += 1;
	}
	return added;
}
function getSubagentRunsSnapshotForRead(inMemoryRuns) {
	const merged = /* @__PURE__ */ new Map();
	if (process.env.OPERATOR_TEST_READ_SUBAGENT_RUNS_FROM_SQLITE === "1" || !(process.env.VITEST || false)) try {
		for (const [runId, entry] of loadPersistedSubagentRunsForRead().entries()) merged.set(runId, entry);
	} catch {}
	for (const [runId, entry] of inMemoryRuns.entries()) merged.set(runId, entry);
	return merged;
}
//#endregion
Object.defineProperty(exports, "buildLatestSubagentRunReadIndexFromRuns", {
	enumerable: true,
	get: function() {
		return buildLatestSubagentRunReadIndexFromRuns;
	}
});
Object.defineProperty(exports, "buildSubagentRunReadIndexFromRuns", {
	enumerable: true,
	get: function() {
		return buildSubagentRunReadIndexFromRuns;
	}
});
Object.defineProperty(exports, "clearDeliveryState", {
	enumerable: true,
	get: function() {
		return clearDeliveryState;
	}
});
Object.defineProperty(exports, "clearSubagentRunsReadCacheForTest", {
	enumerable: true,
	get: function() {
		return clearSubagentRunsReadCacheForTest;
	}
});
Object.defineProperty(exports, "countActiveDescendantRunsFromRuns", {
	enumerable: true,
	get: function() {
		return countActiveDescendantRunsFromRuns;
	}
});
Object.defineProperty(exports, "countActiveRunsForSessionFromRuns", {
	enumerable: true,
	get: function() {
		return countActiveRunsForSessionFromRuns;
	}
});
Object.defineProperty(exports, "countPendingDescendantRunsExcludingRunFromRuns", {
	enumerable: true,
	get: function() {
		return countPendingDescendantRunsExcludingRunFromRuns;
	}
});
Object.defineProperty(exports, "countPendingDescendantRunsFromRuns", {
	enumerable: true,
	get: function() {
		return countPendingDescendantRunsFromRuns;
	}
});
Object.defineProperty(exports, "ensureCompletionState", {
	enumerable: true,
	get: function() {
		return ensureCompletionState;
	}
});
Object.defineProperty(exports, "ensureDeliveryState", {
	enumerable: true,
	get: function() {
		return ensureDeliveryState;
	}
});
Object.defineProperty(exports, "getDeliveryAttemptCount", {
	enumerable: true,
	get: function() {
		return getDeliveryAttemptCount;
	}
});
Object.defineProperty(exports, "getDeliveryLastAttemptAt", {
	enumerable: true,
	get: function() {
		return getDeliveryLastAttemptAt;
	}
});
Object.defineProperty(exports, "getDeliveryLastError", {
	enumerable: true,
	get: function() {
		return getDeliveryLastError;
	}
});
Object.defineProperty(exports, "getSubagentRunByChildSessionKeyFromRuns", {
	enumerable: true,
	get: function() {
		return getSubagentRunByChildSessionKeyFromRuns;
	}
});
Object.defineProperty(exports, "getSubagentRunsSnapshotForRead", {
	enumerable: true,
	get: function() {
		return getSubagentRunsSnapshotForRead;
	}
});
Object.defineProperty(exports, "isDeliverySuspended", {
	enumerable: true,
	get: function() {
		return isDeliverySuspended;
	}
});
Object.defineProperty(exports, "isSubagentSessionRunActiveFromRuns", {
	enumerable: true,
	get: function() {
		return isSubagentSessionRunActiveFromRuns;
	}
});
Object.defineProperty(exports, "listDescendantRunsForRequesterFromRuns", {
	enumerable: true,
	get: function() {
		return listDescendantRunsForRequesterFromRuns;
	}
});
Object.defineProperty(exports, "listRunsForControllerFromRuns", {
	enumerable: true,
	get: function() {
		return listRunsForControllerFromRuns;
	}
});
Object.defineProperty(exports, "listRunsForRequesterFromRuns", {
	enumerable: true,
	get: function() {
		return listRunsForRequesterFromRuns;
	}
});
Object.defineProperty(exports, "normalizeSubagentRunState", {
	enumerable: true,
	get: function() {
		return normalizeSubagentRunState;
	}
});
Object.defineProperty(exports, "persistSubagentRunsToDisk", {
	enumerable: true,
	get: function() {
		return persistSubagentRunsToDisk;
	}
});
Object.defineProperty(exports, "persistSubagentRunsToDiskOrThrow", {
	enumerable: true,
	get: function() {
		return persistSubagentRunsToDiskOrThrow;
	}
});
Object.defineProperty(exports, "resolveRequesterForChildSessionFromRuns", {
	enumerable: true,
	get: function() {
		return resolveRequesterForChildSessionFromRuns;
	}
});
Object.defineProperty(exports, "restoreSubagentRunsFromDisk", {
	enumerable: true,
	get: function() {
		return restoreSubagentRunsFromDisk;
	}
});
Object.defineProperty(exports, "shouldIgnorePostCompletionAnnounceForSessionFromRuns", {
	enumerable: true,
	get: function() {
		return shouldIgnorePostCompletionAnnounceForSessionFromRuns;
	}
});
Object.defineProperty(exports, "subagentRuns", {
	enumerable: true,
	get: function() {
		return subagentRuns;
	}
});
