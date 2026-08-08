const require_retry = require("./retry-DXZi6qkk.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_delivery_recovery_shared = require("./delivery-recovery.shared-BWzaN0lD.cjs");
const require_delivery_queue_sqlite = require("./delivery-queue-sqlite-g1mFGVTq.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/infra/session-delivery-queue-storage.ts
const QUEUE_NAME = "session";
var SessionDeliveryDeferredError = class extends Error {
	constructor(..._args) {
		super(..._args);
		this.name = "SessionDeliveryDeferredError";
	}
};
/** Signals that retry budget was already persisted before a later transition failed. */
var SessionDeliveryRetryChargedError = class extends Error {
	constructor(..._args2) {
		super(..._args2);
		this.name = "SessionDeliveryRetryChargedError";
	}
};
/** Signals that durable pre-delivery ownership could not be established. */
var SessionDeliveryAttemptStartError = class extends Error {
	constructor(..._args3) {
		super(..._args3);
		this.name = "SessionDeliveryAttemptStartError";
	}
};
/** Signals that delivery proved no external or transcript side effect committed. */
var SessionDeliverySafeRetryError = class extends Error {
	constructor(..._args4) {
		super(..._args4);
		this.name = "SessionDeliverySafeRetryError";
	}
};
/** Signals that recovery must settle this pending row as failed without replaying delivery. */
var SessionDeliveryDeadLetteredError = class extends Error {
	constructor(..._args5) {
		super(..._args5);
		this.name = "SessionDeliveryDeadLetteredError";
	}
};
function buildEntryId(idempotencyKey) {
	if (!idempotencyKey) return require_retry.generateSecureUuid();
	return require_crypto_digest.sha256Hex(idempotencyKey);
}
function queuedSessionDeliveryMetadata(entry) {
	const route = entry.kind === "agentTurn" ? entry.route : void 0;
	return {
		entryKind: entry.kind,
		sessionKey: entry.sessionKey,
		channel: route?.channel ?? entry.deliveryContext?.channel,
		target: route?.to ?? entry.deliveryContext?.to,
		accountId: route?.accountId ?? entry.deliveryContext?.accountId
	};
}
/** Enqueue a session delivery and return its durable id. */
async function enqueueSessionDelivery(params, stateDir) {
	const id = buildEntryId(params.idempotencyKey);
	const entry = {
		...params,
		id,
		enqueuedAt: Date.now(),
		retryCount: 0
	};
	require_delivery_queue_sqlite.upsertDeliveryQueueEntry({
		queueName: QUEUE_NAME,
		entry,
		metadata: queuedSessionDeliveryMetadata(entry),
		stateDir,
		reviveFailedOrCorruptPending: Boolean(params.idempotencyKey)
	});
	return id;
}
/** Enqueue and lease the first attempt to one caller before recovery can see it as eligible. */
async function enqueueClaimedSessionDelivery(params, initialAttemptLeaseMs, stateDir) {
	const id = buildEntryId(params.idempotencyKey);
	const entry = {
		...params,
		id,
		enqueuedAt: Date.now(),
		retryCount: 0,
		availableAt: Date.now() + Math.max(0, initialAttemptLeaseMs)
	};
	const claimed = require_delivery_queue_sqlite.upsertDeliveryQueueEntry({
		queueName: QUEUE_NAME,
		entry,
		metadata: queuedSessionDeliveryMetadata(entry),
		stateDir,
		insertOnly: true
	});
	let status;
	try {
		status = claimed ? "pending" : require_delivery_queue_sqlite.getDeliveryQueueEntryStatus(QUEUE_NAME, id, stateDir);
	} catch {
		return {
			id,
			claimed,
			status: "unknown"
		};
	}
	return {
		id,
		claimed,
		status: status ?? "completed"
	};
}
/** Release the initial-attempt lease so runtime recovery can retry immediately. */
async function releaseSessionDeliveryClaim(id, stateDir) {
	require_delivery_queue_sqlite.updateDeliveryQueueEntry(QUEUE_NAME, id, stateDir, (entry) => ({
		...entry,
		availableAt: Date.now()
	}));
}
/** Defer a currently owned delivery without consuming its retry budget. */
async function deferSessionDelivery(id, delayMs, stateDir) {
	require_delivery_queue_sqlite.updateDeliveryQueueEntry(QUEUE_NAME, id, stateDir, (entry) => ({
		...entry,
		availableAt: Date.now() + Math.max(0, delayMs)
	}));
}
/** Advance only after a completed agent turn proves a fresh run is safe. */
async function advanceSessionDeliveryAgentRun(id, updates, stateDir) {
	require_delivery_queue_sqlite.updateDeliveryQueueEntry(QUEUE_NAME, id, stateDir, (entry) => {
		const queued = entry;
		if (queued.kind !== "agentTurn") return queued;
		return {
			...queued,
			agentRunAttempt: (queued.agentRunAttempt ?? 0) + 1,
			deliveryStartedAt: void 0,
			...updates?.message ? { message: updates.message } : {},
			...updates?.expectedMediaUrls ? { expectedMediaUrls: updates.expectedMediaUrls } : {},
			...updates?.suppressTextDelivery === true ? { suppressTextDelivery: true } : {}
		};
	});
}
/** Mark an agent turn before it can commit transcript or channel side effects. */
async function markSessionDeliveryAttemptStarted(entry, stateDir) {
	try {
		if (!require_delivery_queue_sqlite.upsertDeliveryQueueEntry({
			queueName: QUEUE_NAME,
			entry: {
				...entry,
				deliveryStartedAt: entry.deliveryStartedAt ?? Date.now()
			},
			metadata: queuedSessionDeliveryMetadata(entry),
			stateDir,
			updatePendingOnly: true
		})) throw new Error(`Session delivery ${entry.id} is no longer pending`);
	} catch (error) {
		throw new SessionDeliveryAttemptStartError(`Session delivery ${entry.id} could not persist attempt ownership`, { cause: error });
	}
}
/** Signals that a delivered result still needs durable settlement finalization. */
var SessionDeliveryAcknowledgementFinalizeError = class extends Error {
	constructor(id, options) {
		super(`Session delivery ${id} still needs settlement finalization`, options);
		this.name = "SessionDeliveryAcknowledgementFinalizeError";
	}
};
/** Persist terminal delivery state while retaining settlement cleanup metadata. */
async function markSessionDeliverySettlement(entry, outcome, stateDir) {
	try {
		if (require_delivery_queue_sqlite.upsertDeliveryQueueEntry({
			queueName: QUEUE_NAME,
			entry: {
				...entry,
				settlementOutcome: outcome,
				...outcome === "recovered" ? { acknowledgedAt: entry.acknowledgedAt ?? Date.now() } : {}
			},
			metadata: queuedSessionDeliveryMetadata(entry),
			stateDir,
			updatePendingOnly: true
		})) return;
		if (require_delivery_queue_sqlite.getDeliveryQueueEntryStatus(QUEUE_NAME, entry.id, stateDir) === "completed") return;
		throw new Error(`Session delivery ${entry.id} is no longer pending`);
	} catch (error) {
		try {
			if (require_delivery_queue_sqlite.getDeliveryQueueEntryStatus(QUEUE_NAME, entry.id, stateDir) === "completed") return;
		} catch {}
		throw new SessionDeliveryAcknowledgementFinalizeError(entry.id, { cause: error });
	}
}
/** Replace a settled pending row with its completed idempotency tombstone. */
async function completeSessionDelivery(id, stateDir) {
	try {
		require_delivery_queue_sqlite.completeDeliveryQueueEntry(QUEUE_NAME, id, stateDir);
	} catch (error) {
		try {
			if (require_delivery_queue_sqlite.getDeliveryQueueEntryStatus(QUEUE_NAME, id, stateDir) === "completed") return;
		} catch {}
		throw new SessionDeliveryAcknowledgementFinalizeError(id, { cause: error });
	}
}
/** Record a failed delivery attempt and increment retry metadata. */
async function failSessionDelivery(id, error, stateDir, options) {
	require_delivery_queue_sqlite.updateDeliveryQueueEntry(QUEUE_NAME, id, stateDir, (entry) => {
		const queued = entry;
		return {
			...queued,
			retryCount: queued.retryCount + 1,
			...queued.kind === "agentTurn" ? { lastChargedAgentRunAttempt: queued.agentRunAttempt ?? 0 } : {},
			...options?.releaseAttemptOwnership === true ? { deliveryStartedAt: void 0 } : {},
			lastAttemptAt: Date.now(),
			lastError: error
		};
	});
}
/** Load one pending session delivery by durable id. */
async function loadPendingSessionDelivery(id, stateDir) {
	return require_delivery_queue_sqlite.loadDeliveryQueueEntry(QUEUE_NAME, id, stateDir);
}
/** Load all pending session deliveries in retry order. */
async function loadPendingSessionDeliveries(stateDir) {
	return require_delivery_queue_sqlite.loadDeliveryQueueEntries(QUEUE_NAME, stateDir);
}
/** Move an exhausted session delivery out of the pending queue. */
async function moveSessionDeliveryToFailed(id, stateDir) {
	try {
		require_delivery_queue_sqlite.moveDeliveryQueueEntryToFailed(QUEUE_NAME, id, stateDir);
	} catch (error) {
		try {
			if (require_delivery_queue_sqlite.getDeliveryQueueEntryStatus(QUEUE_NAME, id, stateDir) === "failed") return;
		} catch {}
		throw error;
	}
}
//#endregion
//#region src/infra/session-delivery-queue-recovery.ts
const MAX_SESSION_DELIVERY_RETRIES = 5;
const drainInProgress = /* @__PURE__ */ new Map();
const entriesInProgress = /* @__PURE__ */ new Set();
const recoveryReplayPacer = require_delivery_recovery_shared.createRecoveryReplayPacer();
async function notifySessionDeliverySettled(params) {
	try {
		await params.onSettled?.(params.entry, params.outcome);
		return true;
	} catch (error) {
		params.log.error(`session delivery: settled callback failed for ${params.entry.id}: ${String(error)}`);
		return false;
	}
}
async function finalizeSessionDeliverySettlement(params) {
	if (!await notifySessionDeliverySettled(params)) return false;
	try {
		if (params.outcome === "recovered") await completeSessionDelivery(params.entry.id, params.stateDir);
		else await moveSessionDeliveryToFailed(params.entry.id, params.stateDir);
		return true;
	} catch (error) {
		params.log.error(`session delivery: ${params.outcome} finalization failed for ${params.entry.id}: ${String(error)}`);
		return false;
	}
}
function resolvePendingSettlementOutcome(entry) {
	return entry.settlementOutcome ?? (entry.acknowledgedAt !== void 0 ? "recovered" : void 0);
}
function createEmptyRecoverySummary() {
	return {
		recovered: 0,
		failed: 0,
		skippedMaxRetries: 0,
		deferredBackoff: 0
	};
}
function resolveSessionDeliveryMaxRetries(entry) {
	return entry.maxRetries ?? MAX_SESSION_DELIVERY_RETRIES;
}
function canReconcileStartedAgentAttemptAtRetryLimit(entry) {
	return entry.kind === "agentTurn" && entry.deliveryStartedAt !== void 0 && entry.retryCount === resolveSessionDeliveryMaxRetries(entry);
}
function resolveSessionDeliveryRecoveryDeadlineMs(maxRecoveryMs) {
	const durationMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveNonNegativeIntegerOption)(maxRecoveryMs, 6e4);
	if (durationMs <= 0) return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(Date.now());
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(durationMs) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(Date.now());
}
function isSessionDeliveryEligibleForRetry(entry, now) {
	if (entry.availableAt && now < entry.availableAt) return {
		eligible: false,
		remainingBackoffMs: entry.availableAt - now
	};
	const backoff = require_delivery_recovery_shared.computeBackoffMs(entry.retryCount);
	if (backoff <= 0) return { eligible: true };
	if (entry.retryCount === 0 && entry.lastAttemptAt === void 0) return { eligible: true };
	const nextEligibleAt = (typeof entry.lastAttemptAt === "number" && entry.lastAttemptAt > 0 ? entry.lastAttemptAt : entry.enqueuedAt) + backoff;
	if (now >= nextEligibleAt) return { eligible: true };
	return {
		eligible: false,
		remainingBackoffMs: nextEligibleAt - now
	};
}
async function drainQueuedEntry(opts) {
	const { entry } = opts;
	try {
		const pendingOutcome = resolvePendingSettlementOutcome(entry);
		if (pendingOutcome) return pendingOutcome;
		await opts.deliver(entry, { stateDir: opts.stateDir });
		await markSessionDeliverySettlement(entry, "recovered", opts.stateDir);
		return "recovered";
	} catch (err) {
		if (err instanceof SessionDeliveryDeadLetteredError) {
			try {
				await markSessionDeliverySettlement(entry, "moved-to-failed", opts.stateDir);
			} catch (markError) {
				if (markError instanceof SessionDeliveryAcknowledgementFinalizeError) return "deferred";
				throw markError;
			}
			return "moved-to-failed";
		}
		if (err instanceof SessionDeliveryDeferredError) return "deferred";
		if (err instanceof SessionDeliveryAcknowledgementFinalizeError) return "deferred";
		if (err instanceof SessionDeliveryAttemptStartError) return "deferred";
		const errMsg = require_errors.formatErrorMessage(err);
		opts.onFailed?.(entry, errMsg);
		if (err instanceof SessionDeliveryRetryChargedError) return "failed";
		try {
			await failSessionDelivery(entry.id, errMsg, opts.stateDir, { releaseAttemptOwnership: err instanceof SessionDeliverySafeRetryError });
			return "failed";
		} catch (failErr) {
			if (require_delivery_recovery_shared.getErrnoCode(failErr) === "ENOENT") return "already-gone";
			return "failed";
		}
	}
}
/** Drain matching queued session deliveries with retry/backoff protection. */
async function drainPendingSessionDeliveries(opts) {
	if (drainInProgress.get(opts.drainKey)) {
		opts.log.info(`${opts.logLabel}: already in progress for ${opts.drainKey}, skipping`);
		return;
	}
	drainInProgress.set(opts.drainKey, true);
	try {
		const matchingEntries = (await loadPendingSessionDeliveries(opts.stateDir)).filter((entry) => opts.selectEntry(entry, Date.now()).match).toSorted((a, b) => a.enqueuedAt - b.enqueuedAt);
		for (const entry of matchingEntries) {
			if (!require_delivery_recovery_shared.claimRecoveryEntry(entriesInProgress, entry.id)) {
				opts.log.info(`${opts.logLabel}: entry ${entry.id} is already being recovered`);
				continue;
			}
			try {
				const currentEntry = await loadPendingSessionDelivery(entry.id, opts.stateDir);
				if (!currentEntry) continue;
				const currentDecision = opts.selectEntry(currentEntry, Date.now());
				if (!currentDecision.match) continue;
				const pendingSettlementOutcome = resolvePendingSettlementOutcome(currentEntry);
				if (!pendingSettlementOutcome && !canReconcileStartedAgentAttemptAtRetryLimit(currentEntry) && currentEntry.retryCount >= resolveSessionDeliveryMaxRetries(currentEntry)) {
					await markSessionDeliverySettlement(currentEntry, "moved-to-failed", opts.stateDir);
					if (await finalizeSessionDeliverySettlement({
						entry: currentEntry,
						log: opts.log,
						onSettled: opts.onSettled,
						outcome: "moved-to-failed",
						stateDir: opts.stateDir
					})) opts.log.warn(`${opts.logLabel}: entry ${currentEntry.id} exceeded max retries and was moved to failed`);
					continue;
				}
				if (!pendingSettlementOutcome && !currentDecision.bypassBackoff) {
					const retryEligibility = isSessionDeliveryEligibleForRetry(currentEntry, Date.now());
					if (!retryEligibility.eligible) {
						opts.log.info(`${opts.logLabel}: entry ${currentEntry.id} not ready for retry yet — backoff ${retryEligibility.remainingBackoffMs}ms remaining`);
						continue;
					}
				}
				const result = await drainQueuedEntry({
					entry: currentEntry,
					deliver: opts.deliver,
					stateDir: opts.stateDir,
					onFailed: (failedEntry, errMsg) => {
						opts.log.warn(`${opts.logLabel}: retry failed for entry ${failedEntry.id}: ${errMsg}`);
					}
				});
				if (result === "recovered" || result === "moved-to-failed") await finalizeSessionDeliverySettlement({
					entry: currentEntry,
					log: opts.log,
					onSettled: opts.onSettled,
					outcome: result,
					stateDir: opts.stateDir
				});
			} finally {
				require_delivery_recovery_shared.releaseRecoveryEntry(entriesInProgress, entry.id);
			}
		}
	} finally {
		drainInProgress.delete(opts.drainKey);
	}
}
/** Replay pending session deliveries until the recovery budget is exhausted. */
async function recoverPendingSessionDeliveries(opts) {
	const pending = (await loadPendingSessionDeliveries(opts.stateDir)).filter((entry) => opts.maxEnqueuedAt == null || entry.enqueuedAt <= opts.maxEnqueuedAt);
	if (pending.length === 0) return createEmptyRecoverySummary();
	pending.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
	const summary = createEmptyRecoverySummary();
	const deadline = resolveSessionDeliveryRecoveryDeadlineMs(opts.maxRecoveryMs);
	for (const entry of pending) {
		if (Date.now() >= deadline) {
			opts.log.warn("Session delivery recovery time budget exceeded — remaining entries deferred");
			break;
		}
		if (!require_delivery_recovery_shared.claimRecoveryEntry(entriesInProgress, entry.id)) continue;
		try {
			const currentEntry = await loadPendingSessionDelivery(entry.id, opts.stateDir);
			if (!currentEntry) continue;
			if (opts.maxEnqueuedAt != null && currentEntry.enqueuedAt > opts.maxEnqueuedAt) continue;
			const pendingSettlementOutcome = resolvePendingSettlementOutcome(currentEntry);
			if (!pendingSettlementOutcome && !canReconcileStartedAgentAttemptAtRetryLimit(currentEntry) && currentEntry.retryCount >= resolveSessionDeliveryMaxRetries(currentEntry)) {
				summary.skippedMaxRetries += 1;
				await markSessionDeliverySettlement(currentEntry, "moved-to-failed", opts.stateDir);
				await finalizeSessionDeliverySettlement({
					entry: currentEntry,
					log: opts.log,
					onSettled: opts.onSettled,
					outcome: "moved-to-failed",
					stateDir: opts.stateDir
				});
				continue;
			}
			if (!pendingSettlementOutcome) {
				if (!isSessionDeliveryEligibleForRetry(currentEntry, Date.now()).eligible) {
					summary.deferredBackoff += 1;
					continue;
				}
				if (await recoveryReplayPacer.wait(deadline) === "deadline-exceeded") {
					opts.log.warn("Session delivery recovery time budget exceeded — remaining entries deferred");
					break;
				}
			}
			const result = await drainQueuedEntry({
				entry: currentEntry,
				deliver: opts.deliver,
				stateDir: opts.stateDir,
				onFailed: (_failedEntry, errMsg) => {
					summary.failed += 1;
					opts.log.warn(`Session delivery retry failed: ${errMsg}`);
				}
			});
			if (result === "recovered" || result === "moved-to-failed") {
				if (await finalizeSessionDeliverySettlement({
					entry: currentEntry,
					log: opts.log,
					onSettled: opts.onSettled,
					outcome: result,
					stateDir: opts.stateDir
				}) && result === "recovered") {
					summary.recovered += 1;
					opts.log.info(`Recovered session delivery ${currentEntry.id}`);
				}
			}
		} finally {
			require_delivery_recovery_shared.releaseRecoveryEntry(entriesInProgress, entry.id);
		}
	}
	return summary;
}
//#endregion
Object.defineProperty(exports, "SessionDeliveryDeadLetteredError", {
	enumerable: true,
	get: function() {
		return SessionDeliveryDeadLetteredError;
	}
});
Object.defineProperty(exports, "SessionDeliveryDeferredError", {
	enumerable: true,
	get: function() {
		return SessionDeliveryDeferredError;
	}
});
Object.defineProperty(exports, "SessionDeliveryRetryChargedError", {
	enumerable: true,
	get: function() {
		return SessionDeliveryRetryChargedError;
	}
});
Object.defineProperty(exports, "SessionDeliverySafeRetryError", {
	enumerable: true,
	get: function() {
		return SessionDeliverySafeRetryError;
	}
});
Object.defineProperty(exports, "advanceSessionDeliveryAgentRun", {
	enumerable: true,
	get: function() {
		return advanceSessionDeliveryAgentRun;
	}
});
Object.defineProperty(exports, "deferSessionDelivery", {
	enumerable: true,
	get: function() {
		return deferSessionDelivery;
	}
});
Object.defineProperty(exports, "drainPendingSessionDeliveries", {
	enumerable: true,
	get: function() {
		return drainPendingSessionDeliveries;
	}
});
Object.defineProperty(exports, "enqueueClaimedSessionDelivery", {
	enumerable: true,
	get: function() {
		return enqueueClaimedSessionDelivery;
	}
});
Object.defineProperty(exports, "enqueueSessionDelivery", {
	enumerable: true,
	get: function() {
		return enqueueSessionDelivery;
	}
});
Object.defineProperty(exports, "failSessionDelivery", {
	enumerable: true,
	get: function() {
		return failSessionDelivery;
	}
});
Object.defineProperty(exports, "loadPendingSessionDeliveries", {
	enumerable: true,
	get: function() {
		return loadPendingSessionDeliveries;
	}
});
Object.defineProperty(exports, "loadPendingSessionDelivery", {
	enumerable: true,
	get: function() {
		return loadPendingSessionDelivery;
	}
});
Object.defineProperty(exports, "markSessionDeliveryAttemptStarted", {
	enumerable: true,
	get: function() {
		return markSessionDeliveryAttemptStarted;
	}
});
Object.defineProperty(exports, "markSessionDeliverySettlement", {
	enumerable: true,
	get: function() {
		return markSessionDeliverySettlement;
	}
});
Object.defineProperty(exports, "recoverPendingSessionDeliveries", {
	enumerable: true,
	get: function() {
		return recoverPendingSessionDeliveries;
	}
});
Object.defineProperty(exports, "releaseSessionDeliveryClaim", {
	enumerable: true,
	get: function() {
		return releaseSessionDeliveryClaim;
	}
});
