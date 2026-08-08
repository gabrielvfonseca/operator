const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_diagnostic_runtime = require("./diagnostic-runtime-DOIuSHus.cjs");
//#region src/process/command-queue.ts
/**
* Dedicated error type thrown when a queued command is rejected because
* its lane was cleared.  Callers that fire-and-forget enqueued tasks can
* catch (or ignore) this specific type to avoid unhandled-rejection noise.
*/
var CommandLaneClearedError = class extends Error {
	constructor(lane) {
		super(lane ? `Command lane "${lane}" cleared` : "Command lane cleared");
		this.name = "CommandLaneClearedError";
	}
};
/**
* Dedicated error type thrown when an active command exceeds its caller-owned
* lane timeout. The underlying task may still be unwinding, but the lane is
* released so queued work is not blocked forever.
*/
var CommandLaneTaskTimeoutError = class extends Error {
	constructor(lane, timeoutMs) {
		super(`Command lane "${lane}" task timed out after ${timeoutMs}ms`);
		this.name = "CommandLaneTaskTimeoutError";
	}
};
function isCommandLaneTaskTimeoutError(err, lane) {
	if (!(err instanceof Error)) return false;
	if (!(err instanceof CommandLaneTaskTimeoutError || err.name === "CommandLaneTaskTimeoutError")) return false;
	return lane === void 0 || err.message.includes(`Command lane "${lane}" task timed out`);
}
function isExpectedNonErrorLaneFailure(err) {
	return err instanceof Error && err.name === "LiveSessionModelSwitchError";
}
function isQuietProbeLane(lane) {
	return lane.startsWith("auth-probe:") || lane.startsWith("session:probe-") || lane.startsWith("session:temp:setup-inference:probe-setup-inference-");
}
/**
* Keep queue runtime state on globalThis so every bundled entry/chunk shares
* the same lanes, counters, and draining flag in production builds.
*/
const COMMAND_QUEUE_STATE_KEY = Symbol.for("operator.commandQueueState");
function getQueueState() {
	const state = require_global_singleton.resolveGlobalSingleton(COMMAND_QUEUE_STATE_KEY, () => ({
		lanes: /* @__PURE__ */ new Map(),
		activeTaskWaiters: /* @__PURE__ */ new Set(),
		nextTaskId: 1,
		nextQueueSequence: 1
	}));
	if (!state.activeTaskWaiters) state.activeTaskWaiters = /* @__PURE__ */ new Set();
	if (!state.nextQueueSequence) state.nextQueueSequence = 1;
	let maxQueueSequence = state.nextQueueSequence - 1;
	for (const lane of state.lanes.values()) for (const [index, entry] of lane.queue.entries()) {
		if (typeof entry.priority !== "number") entry.priority = 0;
		if (typeof entry.sequence !== "number") entry.sequence = state.nextQueueSequence++;
		else maxQueueSequence = Math.max(maxQueueSequence, entry.sequence);
		if (typeof entry.queuedAheadAtEnqueue !== "number") entry.queuedAheadAtEnqueue = index;
		if (typeof entry.activeAheadAtEnqueue !== "number") entry.activeAheadAtEnqueue = lane.activeTaskIds.size;
	}
	if (state.nextQueueSequence <= maxQueueSequence) state.nextQueueSequence = maxQueueSequence + 1;
	return state;
}
function normalizeLane(lane) {
	return lane.trim() || "main";
}
function getLaneDepth(state) {
	return state.queue.length + state.activeTaskIds.size;
}
function createCommandLaneSnapshot(state) {
	return {
		lane: state.lane,
		queuedCount: state.queue.length,
		activeCount: state.activeTaskIds.size,
		maxConcurrent: state.maxConcurrent,
		draining: state.draining,
		generation: state.generation
	};
}
function getLaneState(lane) {
	const queueState = getQueueState();
	const existing = queueState.lanes.get(lane);
	if (existing) return existing;
	const created = {
		lane,
		queue: [],
		activeTaskIds: /* @__PURE__ */ new Set(),
		maxConcurrent: 1,
		draining: false,
		generation: 0
	};
	queueState.lanes.set(lane, created);
	return created;
}
function completeTask(state, taskId, taskGeneration) {
	if (taskGeneration !== state.generation) return false;
	state.activeTaskIds.delete(taskId);
	return true;
}
function hasPendingActiveTasks(taskIds) {
	const queueState = getQueueState();
	for (const state of queueState.lanes.values()) for (const taskId of state.activeTaskIds) if (taskIds.has(taskId)) return true;
	return false;
}
function resolveActiveTaskWaiter(waiter, result) {
	if (!getQueueState().activeTaskWaiters.delete(waiter)) return;
	if (waiter.timeout) clearTimeout(waiter.timeout);
	waiter.resolve(result);
}
function notifyActiveTaskWaiters() {
	const queueState = getQueueState();
	for (const waiter of Array.from(queueState.activeTaskWaiters)) if (waiter.activeTaskIds.size === 0 || !hasPendingActiveTasks(waiter.activeTaskIds)) resolveActiveTaskWaiter(waiter, { drained: true });
}
function normalizeTaskTimeoutMs(value) {
	if (value === void 0 || !Number.isFinite(value) || value <= 0) return;
	return (0, require_number_coercion.number_coercion_exports.clampPositiveTimerTimeoutMs)(value);
}
function resolveQueuePriority(priority) {
	switch (priority) {
		case "foreground": return 1;
		case "background": return -1;
		default: return 0;
	}
}
function enqueueLaneEntry(state, entry) {
	const insertAt = state.queue.findIndex((queued) => queued.priority < entry.priority || queued.priority === entry.priority && queued.sequence > entry.sequence);
	entry.queuedAheadAtEnqueue = insertAt < 0 ? state.queue.length : insertAt;
	entry.activeAheadAtEnqueue = state.activeTaskIds.size;
	if (insertAt < 0) {
		state.queue.push(entry);
		return;
	}
	state.queue.splice(insertAt, 0, entry);
}
async function runQueueEntryTask(lane, entry) {
	const taskPromise = Promise.resolve().then(entry.task);
	const taskTimeoutMs = normalizeTaskTimeoutMs(entry.taskTimeoutMs);
	if (taskTimeoutMs === void 0) return await taskPromise;
	const taskTimeoutAbortGraceMs = normalizeTaskTimeoutMs(entry.taskTimeoutAbortGraceMs) ?? taskTimeoutMs;
	const startedAtMs = Date.now();
	const readLastProgressAtMs = () => {
		let value;
		try {
			value = entry.taskTimeoutProgressAtMs?.();
		} catch (err) {
			require_diagnostic_runtime.diagnosticLogger.warn(`lane task timeout progress callback failed: lane=${lane} error="${String(err)}"`);
		}
		return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.max(startedAtMs, Math.floor(value)) : startedAtMs;
	};
	let timeoutHandle;
	let removeAbortListener;
	let removeReleaseListener;
	let timedOut = false;
	const timeoutPromise = new Promise((_, reject) => {
		const rejectForTimeout = () => {
			timedOut = true;
			reject(new CommandLaneTaskTimeoutError(lane, taskTimeoutMs));
		};
		const armTimer = (delayMs, onTimeout) => {
			if (timeoutHandle) clearTimeout(timeoutHandle);
			if (delayMs <= 0) {
				onTimeout();
				return;
			}
			timeoutHandle = setTimeout(onTimeout, delayMs);
			timeoutHandle.unref?.();
		};
		const armProgressTimeout = () => {
			const elapsedMs = Math.max(0, Date.now() - readLastProgressAtMs());
			const remainingMs = taskTimeoutMs - elapsedMs;
			if (remainingMs <= 0) {
				rejectForTimeout();
				return;
			}
			armTimer(remainingMs, armProgressTimeout);
		};
		const armAbortTimeout = () => {
			armTimer(taskTimeoutAbortGraceMs, rejectForTimeout);
		};
		const abortSignal = entry.taskTimeoutAbortSignal;
		const releaseSignal = entry.taskTimeoutReleaseSignal;
		const onRelease = () => {
			removeReleaseListener?.();
			rejectForTimeout();
		};
		if (releaseSignal?.aborted) {
			onRelease();
			return;
		}
		if (abortSignal?.aborted) {
			armAbortTimeout();
			return;
		}
		armProgressTimeout();
		if (abortSignal) {
			const onAbort = () => {
				removeAbortListener?.();
				armAbortTimeout();
			};
			abortSignal.addEventListener("abort", onAbort, { once: true });
			removeAbortListener = () => abortSignal.removeEventListener("abort", onAbort);
		}
		if (releaseSignal) {
			releaseSignal.addEventListener("abort", onRelease, { once: true });
			removeReleaseListener = () => releaseSignal.removeEventListener("abort", onRelease);
		}
	});
	try {
		return await Promise.race([taskPromise, timeoutPromise]);
	} catch (err) {
		if (timedOut) taskPromise.catch((lateErr) => {
			require_diagnostic_runtime.diagnosticLogger.warn(`lane task rejected after timeout: lane=${lane} timeoutMs=${taskTimeoutMs} error="${String(lateErr)}"`);
		});
		throw err;
	} finally {
		if (timeoutHandle) clearTimeout(timeoutHandle);
		removeAbortListener?.();
		removeReleaseListener?.();
	}
}
function drainLane(lane) {
	const state = getLaneState(lane);
	if (state.draining) {
		if (state.activeTaskIds.size === 0 && state.queue.length > 0) require_diagnostic_runtime.diagnosticLogger.warn(`drainLane blocked: lane=${lane} draining=true active=0 queue=${state.queue.length}`);
		return;
	}
	state.draining = true;
	const pump = () => {
		try {
			while (state.activeTaskIds.size < state.maxConcurrent && state.queue.length > 0) {
				const entry = state.queue.shift();
				const waitedMs = Date.now() - entry.enqueuedAt;
				if (waitedMs >= entry.warnAfterMs) {
					try {
						entry.onWait?.(waitedMs, entry.queuedAheadAtEnqueue);
					} catch (err) {
						require_diagnostic_runtime.diagnosticLogger.error(`lane onWait callback failed: lane=${lane} error="${String(err)}"`);
					}
					require_diagnostic_runtime.diagnosticLogger.warn(`lane wait exceeded: lane=${lane} waitedMs=${waitedMs} queueAhead=${entry.queuedAheadAtEnqueue} activeAhead=${entry.activeAheadAtEnqueue} activeNow=${state.activeTaskIds.size} queueBehind=${state.queue.length}`);
				}
				require_diagnostic_runtime.logLaneDequeue(lane, waitedMs, state.queue.length);
				const taskId = getQueueState().nextTaskId++;
				const taskGeneration = state.generation;
				state.activeTaskIds.add(taskId);
				(async () => {
					const startTime = Date.now();
					try {
						const result = await runQueueEntryTask(lane, entry);
						if (completeTask(state, taskId, taskGeneration)) {
							notifyActiveTaskWaiters();
							require_diagnostic_runtime.diagnosticLogger.debug(`lane task done: lane=${lane} durationMs=${Date.now() - startTime} active=${state.activeTaskIds.size} queued=${state.queue.length}`);
							pump();
						}
						entry.resolve(result);
					} catch (err) {
						const completedCurrentGeneration = completeTask(state, taskId, taskGeneration);
						const isProbeLane = isQuietProbeLane(lane);
						if (!isProbeLane && !isExpectedNonErrorLaneFailure(err)) require_diagnostic_runtime.diagnosticLogger.error(`lane task error: lane=${lane} durationMs=${Date.now() - startTime} error="${String(err)}"`);
						else if (!isProbeLane) require_diagnostic_runtime.diagnosticLogger.debug(`lane task interrupted: lane=${lane} durationMs=${Date.now() - startTime} reason="${String(err)}"`);
						if (completedCurrentGeneration) {
							notifyActiveTaskWaiters();
							pump();
						}
						entry.reject(err);
					}
				})();
			}
		} finally {
			state.draining = false;
		}
	};
	pump();
}
function isGatewayDraining() {
	return require_gateway_work_admission.isGatewayWorkAdmissionClosed();
}
function setCommandLaneConcurrency(lane, maxConcurrent) {
	const cleaned = normalizeLane(lane);
	const state = getLaneState(cleaned);
	const minConcurrent = isQuietProbeLane(cleaned) ? 1 : 0;
	state.maxConcurrent = Math.max(minConcurrent, Math.floor(maxConcurrent));
	if (state.maxConcurrent > 0) drainLane(cleaned);
}
function enqueueCommandInLane(lane, task, opts) {
	const queueState = getQueueState();
	if (require_gateway_work_admission.isGatewaySubordinateWorkAdmissionClosed()) return Promise.reject(new require_gateway_work_admission.GatewayDrainingError());
	const cleaned = normalizeLane(lane);
	const warnAfterMs = opts?.warnAfterMs ?? 2e3;
	const state = getLaneState(cleaned);
	return new Promise((resolve, reject) => {
		enqueueLaneEntry(state, {
			task: () => task(),
			resolve: (value) => resolve(value),
			reject,
			enqueuedAt: Date.now(),
			sequence: queueState.nextQueueSequence++,
			priority: resolveQueuePriority(opts?.priority),
			warnAfterMs,
			queuedAheadAtEnqueue: 0,
			activeAheadAtEnqueue: 0,
			taskTimeoutMs: normalizeTaskTimeoutMs(opts?.taskTimeoutMs),
			taskTimeoutProgressAtMs: opts?.taskTimeoutProgressAtMs,
			taskTimeoutAbortSignal: opts?.taskTimeoutAbortSignal,
			taskTimeoutAbortGraceMs: normalizeTaskTimeoutMs(opts?.taskTimeoutAbortGraceMs),
			taskTimeoutReleaseSignal: opts?.taskTimeoutReleaseSignal,
			onWait: opts?.onWait
		});
		require_diagnostic_runtime.logLaneEnqueue(cleaned, getLaneDepth(state));
		drainLane(cleaned);
	});
}
function getQueueSize(lane = "main") {
	const resolved = normalizeLane(lane);
	const state = getQueueState().lanes.get(resolved);
	if (!state) return 0;
	return getLaneDepth(state);
}
function getCommandLaneSnapshot(lane = "main") {
	const resolved = normalizeLane(lane);
	const state = getQueueState().lanes.get(resolved);
	if (!state) return {
		lane: resolved,
		queuedCount: 0,
		activeCount: 0,
		maxConcurrent: 1,
		draining: false,
		generation: 0
	};
	return createCommandLaneSnapshot(state);
}
/**
* Active task ids for a lane. Ids are process-monotonic, so recovery can
* detect a turn that started after a point in time it captured earlier.
*/
function getCommandLaneActiveTaskIds(lane = "main") {
	const state = getQueueState().lanes.get(normalizeLane(lane));
	return state ? [...state.activeTaskIds] : [];
}
function getCommandLaneSnapshots() {
	return Array.from(getQueueState().lanes.values(), createCommandLaneSnapshot).toSorted((a, b) => a.lane.localeCompare(b.lane));
}
function getTotalQueueSize() {
	let total = 0;
	for (const s of getQueueState().lanes.values()) total += getLaneDepth(s);
	return total;
}
function clearCommandLane(lane = "main") {
	const cleaned = normalizeLane(lane);
	const state = getQueueState().lanes.get(cleaned);
	if (!state) return 0;
	const removed = state.queue.length;
	const pending = state.queue.splice(0);
	for (const entry of pending) entry.reject(new CommandLaneClearedError(cleaned));
	return removed;
}
/**
* Force a single lane back to idle and immediately pump any queued entries.
* Used only by recovery paths after the owner has already attempted to abort
* the active work; stale completions from the previous generation are ignored.
*/
function resetCommandLane(lane = "main") {
	const cleaned = normalizeLane(lane);
	const state = getQueueState().lanes.get(cleaned);
	if (!state) return 0;
	const released = state.activeTaskIds.size;
	state.generation += 1;
	state.activeTaskIds.clear();
	state.draining = false;
	if (state.queue.length > 0) drainLane(cleaned);
	notifyActiveTaskWaiters();
	return released;
}
//#endregion
Object.defineProperty(exports, "CommandLaneClearedError", {
	enumerable: true,
	get: function() {
		return CommandLaneClearedError;
	}
});
Object.defineProperty(exports, "clearCommandLane", {
	enumerable: true,
	get: function() {
		return clearCommandLane;
	}
});
Object.defineProperty(exports, "enqueueCommandInLane", {
	enumerable: true,
	get: function() {
		return enqueueCommandInLane;
	}
});
Object.defineProperty(exports, "getCommandLaneActiveTaskIds", {
	enumerable: true,
	get: function() {
		return getCommandLaneActiveTaskIds;
	}
});
Object.defineProperty(exports, "getCommandLaneSnapshot", {
	enumerable: true,
	get: function() {
		return getCommandLaneSnapshot;
	}
});
Object.defineProperty(exports, "getCommandLaneSnapshots", {
	enumerable: true,
	get: function() {
		return getCommandLaneSnapshots;
	}
});
Object.defineProperty(exports, "getQueueSize", {
	enumerable: true,
	get: function() {
		return getQueueSize;
	}
});
Object.defineProperty(exports, "getTotalQueueSize", {
	enumerable: true,
	get: function() {
		return getTotalQueueSize;
	}
});
Object.defineProperty(exports, "isCommandLaneTaskTimeoutError", {
	enumerable: true,
	get: function() {
		return isCommandLaneTaskTimeoutError;
	}
});
Object.defineProperty(exports, "isGatewayDraining", {
	enumerable: true,
	get: function() {
		return isGatewayDraining;
	}
});
Object.defineProperty(exports, "resetCommandLane", {
	enumerable: true,
	get: function() {
		return resetCommandLane;
	}
});
Object.defineProperty(exports, "setCommandLaneConcurrency", {
	enumerable: true,
	get: function() {
		return setCommandLaneConcurrency;
	}
});
