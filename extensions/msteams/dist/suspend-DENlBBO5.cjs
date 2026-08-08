require("./rolldown-runtime-u92d-OFm.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_active_jobs = require("./active-jobs-B43nN2RN.cjs");
const require_active_run_cancellation = require("./active-run-cancellation-MXFyFXl_.cjs");
const require_gateway_active_work = require("./gateway-active-work-DRI4ItAc.cjs");
let node_crypto = require("node:crypto");
//#region src/infra/gateway-suspend-coordinator.ts
const GATEWAY_SUSPEND_TTL_MS = 2 * 6e4;
const GATEWAY_SUSPEND_RETRY_AFTER_MS = 2e4;
const GATEWAY_SCHEDULER_RECOVERY_RETRY_MS = 1e3;
const COORDINATOR_STATE = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.gatewaySuspendCoordinatorState"), () => ({
	current: null,
	retiredForLifecycleReset: null
}));
function schedulerRecoveryResult() {
	return {
		status: "recovering",
		reason: "scheduler-resume-failed",
		retryAfterMs: GATEWAY_SCHEDULER_RECOVERY_RETRY_MS
	};
}
function clearEntryTimer(entry) {
	if (entry.timer) {
		clearTimeout(entry.timer);
		entry.timer = void 0;
	}
}
function scheduleEntry(entry, delayMs, callback) {
	clearEntryTimer(entry);
	entry.timer = setTimeout(callback, delayMs);
	entry.timer.unref?.();
}
function resumeAndReopen(entry) {
	try {
		entry.resumeScheduling();
	} catch (err) {
		entry.warn?.(`gateway scheduler recovery failed: ${String(err)}`);
		enterSchedulerRecovery(entry);
		return false;
	}
	if (COORDINATOR_STATE.current !== entry) return true;
	if (!entry.reopenAdmission()) {
		entry.warn?.("gateway scheduler recovery could not reopen admission");
		enterSchedulerRecovery(entry);
		return false;
	}
	clearEntryTimer(entry);
	COORDINATOR_STATE.current = null;
	return true;
}
function enterSchedulerRecovery(entry) {
	if (COORDINATOR_STATE.current !== entry) return;
	if (entry.kind === "recovering") {
		scheduleRecoveryRetry(entry);
		return;
	}
	clearEntryTimer(entry);
	const recovery = {
		kind: "recovering",
		owner: entry.owner,
		resumeScheduling: entry.resumeScheduling,
		reopenAdmission: entry.reopenAdmission,
		warn: entry.warn
	};
	COORDINATOR_STATE.current = recovery;
	scheduleRecoveryRetry(recovery);
}
function scheduleRecoveryRetry(entry) {
	scheduleEntry(entry, GATEWAY_SCHEDULER_RECOVERY_RETRY_MS, () => {
		if (COORDINATOR_STATE.current === entry) resumeAndReopen(entry);
	});
}
function normalizeExpiredHeldSuspension(held) {
	if (held.nowMs() < held.expiresAtMs) return held;
	resumeAndReopen(held);
	return COORDINATOR_STATE.current;
}
function armSchedulerRecovery(recovery) {
	const entry = {
		kind: "recovering",
		...recovery
	};
	scheduleRecoveryRetry(entry);
	return entry;
}
function resumeSchedulingBeforeReopen(params) {
	if (params.isInvalidated()) return true;
	try {
		params.resumeScheduling();
	} catch (err) {
		params.warn?.(`gateway scheduler resume failed during suspension rollback: ${String(err)}`);
		COORDINATOR_STATE.current = armSchedulerRecovery({
			owner: params.owner,
			resumeScheduling: params.resumeScheduling,
			reopenAdmission: params.reopenAdmission,
			warn: params.warn
		});
		return false;
	}
	if (!params.isInvalidated()) params.reopenAdmission();
	return true;
}
function armExpiry(held) {
	const entry = {
		kind: "held",
		...held
	};
	scheduleEntry(entry, GATEWAY_SUSPEND_TTL_MS, () => {
		if (COORDINATOR_STATE.current === entry) resumeAndReopen(entry);
	});
	return entry;
}
function renewHeldSuspension(held, nowMs) {
	held.expiresAtMs = nowMs + GATEWAY_SUSPEND_TTL_MS;
	scheduleEntry(held, GATEWAY_SUSPEND_TTL_MS, () => {
		if (COORDINATOR_STATE.current === held) resumeAndReopen(held);
	});
}
/** Acquire, inspect, and either roll back immediately or hold an idle fence. */
function prepareGatewaySuspend(params) {
	const nowMs = (params.nowMs ?? Date.now)();
	const current = COORDINATOR_STATE.current;
	if (current?.kind === "recovering") return schedulerRecoveryResult();
	const existing = current ? normalizeExpiredHeldSuspension(current) : null;
	if (existing?.kind === "recovering") return schedulerRecoveryResult();
	if (existing) {
		if (existing.requestId !== params.requestId) return {
			status: "conflict",
			expiresAtMs: existing.expiresAtMs
		};
		existing.nowMs = params.nowMs ?? Date.now;
		renewHeldSuspension(existing, nowMs);
		return {
			status: "ready",
			suspensionId: existing.suspensionId,
			expiresAtMs: existing.expiresAtMs,
			activeCount: existing.snapshot.counts.totalActive,
			blockers: existing.snapshot.blockers
		};
	}
	const owner = {};
	let suspensionInvalidated = false;
	const admission = require_gateway_work_admission.tryBeginGatewaySuspendAdmission(() => {
		suspensionInvalidated = true;
		const activeEntry = COORDINATOR_STATE.current;
		if (activeEntry?.owner !== owner) return;
		clearEntryTimer(activeEntry);
		COORDINATOR_STATE.current = null;
		COORDINATOR_STATE.retiredForLifecycleReset = activeEntry;
	});
	if (!admission) {
		const snapshot = require_gateway_active_work.createGatewayActiveWorkSnapshot(params.inspect);
		return {
			status: "busy",
			reason: "gateway-draining",
			retryAfterMs: GATEWAY_SUSPEND_RETRY_AFTER_MS,
			activeCount: snapshot.counts.totalActive,
			blockers: snapshot.blockers
		};
	}
	let schedulingPaused = false;
	let admissionCommitted = false;
	try {
		params.pauseScheduling();
		schedulingPaused = true;
		const snapshot = require_gateway_active_work.createGatewayActiveWorkSnapshot(params.inspect);
		if (!snapshot.idle) {
			const resumed = resumeSchedulingBeforeReopen({
				owner,
				resumeScheduling: params.resumeScheduling,
				reopenAdmission: admission.rollback,
				isInvalidated: () => suspensionInvalidated,
				warn: params.warn
			});
			schedulingPaused = false;
			if (!resumed) return schedulerRecoveryResult();
			return {
				status: "busy",
				reason: "active-work",
				retryAfterMs: GATEWAY_SUSPEND_RETRY_AFTER_MS,
				activeCount: snapshot.counts.totalActive,
				blockers: snapshot.blockers
			};
		}
		if (!admission.commit()) throw new Error("gateway suspension admission changed during preparation");
		admissionCommitted = true;
		const suspensionId = (params.createSuspensionId ?? node_crypto.randomUUID)();
		const expiresAtMs = nowMs + GATEWAY_SUSPEND_TTL_MS;
		const held = armExpiry({
			owner,
			requestId: params.requestId,
			suspensionId,
			expiresAtMs,
			snapshot,
			reopenAdmission: admission.release,
			resumeScheduling: params.resumeScheduling,
			nowMs: params.nowMs ?? Date.now,
			warn: params.warn
		});
		COORDINATOR_STATE.current = held;
		return {
			status: "ready",
			suspensionId,
			expiresAtMs,
			activeCount: snapshot.counts.totalActive,
			blockers: snapshot.blockers
		};
	} catch (err) {
		if (schedulingPaused) {
			if (!resumeSchedulingBeforeReopen({
				owner,
				resumeScheduling: params.resumeScheduling,
				reopenAdmission: admissionCommitted ? admission.release : admission.rollback,
				isInvalidated: () => suspensionInvalidated,
				warn: params.warn
			})) return schedulerRecoveryResult();
		} else if (admissionCommitted) admission.release();
		else admission.rollback();
		throw err;
	}
}
function getGatewaySuspendStatus(suspensionId) {
	const current = COORDINATOR_STATE.current;
	if (current?.kind === "recovering") return schedulerRecoveryResult();
	const held = current ? normalizeExpiredHeldSuspension(current) : null;
	if (held?.kind === "recovering") return schedulerRecoveryResult();
	if (!held) return { status: "running" };
	if (held.suspensionId !== suspensionId) return {
		status: "conflict",
		expiresAtMs: held.expiresAtMs
	};
	return {
		status: "ready",
		expiresAtMs: held.expiresAtMs
	};
}
function resumeGatewaySuspend(suspensionId) {
	const current = COORDINATOR_STATE.current;
	if (current?.kind === "recovering") return {
		ok: false,
		reason: "scheduler-resume-failed",
		retryAfterMs: GATEWAY_SCHEDULER_RECOVERY_RETRY_MS
	};
	const held = current ? normalizeExpiredHeldSuspension(current) : null;
	if (held?.kind === "recovering") return {
		ok: false,
		reason: "scheduler-resume-failed",
		retryAfterMs: GATEWAY_SCHEDULER_RECOVERY_RETRY_MS
	};
	if (!held) return {
		ok: true,
		status: "running",
		resumed: false
	};
	if (held.suspensionId !== suspensionId) return {
		ok: false,
		reason: "suspension-mismatch"
	};
	if (!resumeAndReopen(held)) return {
		ok: false,
		reason: "scheduler-resume-failed",
		retryAfterMs: GATEWAY_SCHEDULER_RECOVERY_RETRY_MS
	};
	return {
		ok: true,
		status: "running",
		resumed: true
	};
}
//#endregion
//#region src/gateway/server-active-work.ts
function createGatewayServerActiveWorkInspectors(context) {
	return {
		getCronRuns: () => Math.max(require_active_jobs.getActiveCronJobCount(), require_active_run_cancellation.getSuspensionVisibleCronTaskRunCount()) + (context.cron.getSuspensionBlockerCount?.() ?? 0),
		getChatRuns: () => Array.from(context.chatAbortControllers.values()).filter((entry) => !entry.controller.signal.aborted && entry.registrationCleanupRequested !== true).length,
		getQueuedTurns: () => Array.from(context.chatQueuedTurns.values()).filter((entry) => !entry.controller.signal.aborted).length,
		getTerminalPersistence: () => Array.from(context.chatAbortControllers.values()).filter((entry) => entry.controlUiVisible !== false && entry.projectSessionTerminalPersisted !== true && (entry.projectSessionTerminalPending === true || entry.projectSessionTerminalPersistence !== void 0)).length,
		getTerminalSessions: () => context.terminalSessions?.size ?? 0
	};
}
//#endregion
//#region src/gateway/server-methods/suspend.ts
function invalidParams(method) {
	return require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid ${method} params`);
}
function schedulerRecoveryError(retryAfterMs) {
	return require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "gateway scheduler recovery is pending", {
		retryable: true,
		retryAfterMs,
		details: { reason: "scheduler-resume-failed" }
	});
}
const suspendHandlers = {
	"gateway.suspend.prepare": async ({ respond, params, context }) => {
		if (!require_src.validateGatewaySuspendPrepareParams(params)) {
			respond(false, void 0, invalidParams("gateway.suspend.prepare"));
			return;
		}
		const result = prepareGatewaySuspend({
			requestId: params.requestId.trim(),
			pauseScheduling: () => context.cron.pauseScheduling(),
			resumeScheduling: () => context.cron.resumeScheduling(),
			inspect: createGatewayServerActiveWorkInspectors(context),
			warn: (message) => context.logGateway.warn(message)
		});
		if (result.status === "conflict") {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "another gateway suspension is already prepared", {
				retryable: true,
				retryAfterMs: Math.max(0, result.expiresAtMs - Date.now()),
				details: {
					reason: "gateway-suspension-conflict",
					expiresAtMs: result.expiresAtMs
				}
			}));
			return;
		}
		if (result.status === "recovering") {
			respond(false, void 0, schedulerRecoveryError(result.retryAfterMs));
			return;
		}
		respond(true, result);
	},
	"gateway.suspend.status": async ({ respond, params }) => {
		if (!require_src.validateGatewaySuspendStatusParams(params)) {
			respond(false, void 0, invalidParams("gateway.suspend.status"));
			return;
		}
		const result = getGatewaySuspendStatus(params.suspensionId.trim());
		if (result.status === "conflict") {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "a different gateway suspension is prepared", {
				retryable: true,
				retryAfterMs: Math.max(0, result.expiresAtMs - Date.now()),
				details: {
					reason: "gateway-suspension-conflict",
					expiresAtMs: result.expiresAtMs
				}
			}));
			return;
		}
		if (result.status === "recovering") {
			respond(false, void 0, schedulerRecoveryError(result.retryAfterMs));
			return;
		}
		respond(true, result);
	},
	"gateway.suspend.resume": async ({ respond, params }) => {
		if (!require_src.validateGatewaySuspendResumeParams(params)) {
			respond(false, void 0, invalidParams("gateway.suspend.resume"));
			return;
		}
		const result = resumeGatewaySuspend(params.suspensionId.trim());
		if (!result.ok) {
			if (result.reason === "scheduler-resume-failed") {
				respond(false, void 0, schedulerRecoveryError(result.retryAfterMs));
				return;
			}
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "gateway suspension id does not match"));
			return;
		}
		respond(true, result);
	}
};
//#endregion
exports.suspendHandlers = suspendHandlers;
