const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
let node_async_hooks = require("node:async_hooks");
//#region src/process/gateway-work-admission.ts
var GatewayDrainingError = class extends Error {
	constructor() {
		super("Gateway is draining; new tasks are not accepted");
		this.name = "GatewayDrainingError";
	}
};
const admissionLog = require_subsystem.createSubsystemLogger("gateway/admission");
const GATEWAY_WORK_ADMISSION_STATE = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.gatewayWorkAdmissionState"), () => ({
	restartDraining: false,
	restartSignalPending: false,
	restartSignalGeneration: 0,
	suspendPhase: "accepting",
	suspendGeneration: 0,
	activeRootWork: /* @__PURE__ */ new Set(),
	rootDrainWaiters: /* @__PURE__ */ new Set(),
	currentRootWork: new node_async_hooks.AsyncLocalStorage(),
	suspendOpenWaiters: /* @__PURE__ */ new Set()
}));
function logAdmissionClosed(reason) {
	admissionLog.info(`admission closed: ${reason}`);
}
function logAdmissionReopened(reason) {
	admissionLog.info(`admission reopened: ${reason}`);
}
function createGatewayRootWorkAdmission() {
	const admission = {
		references: 1,
		released: false
	};
	GATEWAY_WORK_ADMISSION_STATE.activeRootWork.add(admission);
	return {
		ownsRoot: true,
		release: createGatewayRootWorkRelease(admission),
		run: async (run) => await GATEWAY_WORK_ADMISSION_STATE.currentRootWork.run(admission, run)
	};
}
function createGatewayRootWorkRelease(admission) {
	let leaseReleased = false;
	return () => {
		if (leaseReleased || admission.released) return;
		leaseReleased = true;
		admission.references -= 1;
		if (admission.references > 0) return;
		admission.released = true;
		GATEWAY_WORK_ADMISSION_STATE.activeRootWork.delete(admission);
		if (GATEWAY_WORK_ADMISSION_STATE.activeRootWork.size === 0) resolveRootDrainWaiters();
	};
}
function resolveRootDrainWaiters() {
	const rootDrainWaiters = GATEWAY_WORK_ADMISSION_STATE.rootDrainWaiters;
	if (!rootDrainWaiters) return;
	const waiters = Array.from(rootDrainWaiters);
	rootDrainWaiters.clear();
	for (const resolve of waiters) resolve();
}
function clearRestartSignalFence() {
	if (GATEWAY_WORK_ADMISSION_STATE.restartDraining || !GATEWAY_WORK_ADMISSION_STATE.restartSignalPending) return false;
	GATEWAY_WORK_ADMISSION_STATE.restartSignalPending = false;
	GATEWAY_WORK_ADMISSION_STATE.restartSignalGeneration += 1;
	resolveSuspendOpenWaiters();
	logAdmissionReopened("restart-signal fence");
	return true;
}
function resolveSuspendOpenWaiters() {
	const waiters = Array.from(GATEWAY_WORK_ADMISSION_STATE.suspendOpenWaiters);
	GATEWAY_WORK_ADMISSION_STATE.suspendOpenWaiters.clear();
	for (const resolve of waiters) resolve();
}
/** True while restart signal/drain or host suspension rejects new process work. */
function isGatewayWorkAdmissionClosed() {
	return GATEWAY_WORK_ADMISSION_STATE.restartDraining || GATEWAY_WORK_ADMISSION_STATE.restartSignalPending || GATEWAY_WORK_ADMISSION_STATE.suspendPhase !== "accepting";
}
/** Existing admitted roots may finish spawning subordinate command/session work.
* New async chains still see the global fence, preserving refuse-only suspension. */
function isGatewaySubordinateWorkAdmissionClosed() {
	if (GATEWAY_WORK_ADMISSION_STATE.restartDraining || GATEWAY_WORK_ADMISSION_STATE.restartSignalPending) return true;
	const current = GATEWAY_WORK_ADMISSION_STATE.currentRootWork.getStore();
	if (current) return current.released;
	return GATEWAY_WORK_ADMISSION_STATE.suspendPhase !== "accepting";
}
function getGatewaySuspendAdmissionPhase() {
	return GATEWAY_WORK_ADMISSION_STATE.suspendPhase;
}
function isGatewayRestartDraining() {
	return GATEWAY_WORK_ADMISSION_STATE.restartDraining || GATEWAY_WORK_ADMISSION_STATE.restartSignalPending;
}
/**
* Blocks suspension across signal emission until the run loop starts restart drain.
* Returns null when another owner already holds the fence or one-way drain is active.
* Callers must not invent a stand-in lease: a dead rollback handle is how the fence
* can stay closed after the real owner is lost.
*/
function beginGatewayRestartSignalAdmission() {
	if (GATEWAY_WORK_ADMISSION_STATE.restartDraining || GATEWAY_WORK_ADMISSION_STATE.restartSignalPending) return null;
	GATEWAY_WORK_ADMISSION_STATE.restartSignalPending = true;
	const generation = ++GATEWAY_WORK_ADMISSION_STATE.restartSignalGeneration;
	logAdmissionClosed("restart-signal fence");
	return { rollback: () => {
		if (!GATEWAY_WORK_ADMISSION_STATE.restartSignalPending || GATEWAY_WORK_ADMISSION_STATE.restartSignalGeneration !== generation) return false;
		return clearRestartSignalFence();
	} };
}
/**
* Reopens a reversible restart-signal fence that no longer has a live lease.
* No-op while one-way restart drain owns admission.
*/
function rollbackGatewayRestartSignalFence() {
	return clearRestartSignalFence();
}
/** Root RPC/timer admission. Nested work in the same async chain counts once. */
function tryBeginGatewayRootWorkAdmission() {
	const current = GATEWAY_WORK_ADMISSION_STATE.currentRootWork.getStore();
	if (current && !current.released) return {
		ownsRoot: false,
		release: () => {},
		run: async (run) => await run()
	};
	if (GATEWAY_WORK_ADMISSION_STATE.restartDraining || GATEWAY_WORK_ADMISSION_STATE.restartSignalPending || GATEWAY_WORK_ADMISSION_STATE.suspendPhase !== "accepting") return null;
	return createGatewayRootWorkAdmission();
}
/** Independent detached work counts separately even when launched by an admitted parent. */
function tryBeginGatewayIndependentRootWorkAdmission() {
	if (GATEWAY_WORK_ADMISSION_STATE.restartDraining || GATEWAY_WORK_ADMISSION_STATE.restartSignalPending || GATEWAY_WORK_ADMISSION_STATE.suspendPhase !== "accepting") return null;
	return createGatewayRootWorkAdmission();
}
/** Waits through a prepared lease, then joins the root-work set atomically. */
async function beginGatewayRootWorkAdmissionWhenOpen() {
	while (true) {
		if (GATEWAY_WORK_ADMISSION_STATE.restartDraining) throw new GatewayDrainingError();
		const admission = tryBeginGatewayRootWorkAdmission();
		if (admission) return admission;
		await new Promise((resolve) => {
			GATEWAY_WORK_ADMISSION_STATE.suspendOpenWaiters.add(resolve);
		});
	}
}
async function runWithGatewayIndependentRootWorkAdmission(run) {
	while (true) {
		if (GATEWAY_WORK_ADMISSION_STATE.restartDraining) throw new Error("gateway is draining for restart");
		const admission = tryBeginGatewayIndependentRootWorkAdmission();
		if (admission) try {
			return await admission.run(run);
		} finally {
			admission.release();
		}
		await new Promise((resolve) => {
			GATEWAY_WORK_ADMISSION_STATE.suspendOpenWaiters.add(resolve);
		});
	}
}
/**
* Detaches required follow-up from the current admitted transaction.
* A live parent synchronously reserves a tracked root even after restart or
* suspension closes admission; callers without a live parent use the normal
* independent-root fence.
*/
function runWithGatewayIndependentRootWorkContinuation(run) {
	const parent = GATEWAY_WORK_ADMISSION_STATE.currentRootWork.getStore();
	if (!parent || parent.released) return runWithGatewayIndependentRootWorkAdmission(run);
	const admission = createGatewayRootWorkAdmission();
	return admission.run(run).finally(admission.release);
}
/** Transfers an admitted request root to work that intentionally outlives its handler. */
function retainGatewayRootWorkAdmissionContinuation() {
	const current = GATEWAY_WORK_ADMISSION_STATE.currentRootWork.getStore();
	if (!current || current.released) return null;
	current.references += 1;
	return createGatewayRootWorkRelease(current);
}
/** Starts process-lifetime work without inheriting the request root that created it. */
function runOutsideGatewayRootWorkAdmission(run) {
	return GATEWAY_WORK_ADMISSION_STATE.currentRootWork.exit(run);
}
/** Active root requests/ticks, optionally excluding the caller running prepare. */
function getActiveGatewayRootWorkCount(opts) {
	let count = GATEWAY_WORK_ADMISSION_STATE.activeRootWork.size;
	const current = GATEWAY_WORK_ADMISSION_STATE.currentRootWork.getStore();
	if (opts?.excludeCurrent === true && current && !current.released && GATEWAY_WORK_ADMISSION_STATE.activeRootWork.has(current)) count -= 1;
	return Math.max(0, count);
}
/** Atomically closes new suspension admission before synchronous inspection. */
function tryBeginGatewaySuspendAdmission(onInvalidated) {
	if (GATEWAY_WORK_ADMISSION_STATE.restartDraining || GATEWAY_WORK_ADMISSION_STATE.restartSignalPending || GATEWAY_WORK_ADMISSION_STATE.suspendPhase !== "accepting") return null;
	GATEWAY_WORK_ADMISSION_STATE.suspendPhase = "preparing";
	const generation = ++GATEWAY_WORK_ADMISSION_STATE.suspendGeneration;
	GATEWAY_WORK_ADMISSION_STATE.suspendInvalidated = onInvalidated;
	logAdmissionClosed("suspend phase");
	const transition = (expected, next) => {
		if (GATEWAY_WORK_ADMISSION_STATE.suspendGeneration !== generation || GATEWAY_WORK_ADMISSION_STATE.suspendPhase !== expected) return false;
		GATEWAY_WORK_ADMISSION_STATE.suspendPhase = next;
		if (next === "accepting") {
			GATEWAY_WORK_ADMISSION_STATE.suspendInvalidated = void 0;
			resolveSuspendOpenWaiters();
			logAdmissionReopened("suspend phase");
		}
		return true;
	};
	return {
		commit: () => transition("preparing", "prepared"),
		rollback: () => transition("preparing", "accepting"),
		release: () => transition("prepared", "accepting")
	};
}
//#endregion
Object.defineProperty(exports, "GatewayDrainingError", {
	enumerable: true,
	get: function() {
		return GatewayDrainingError;
	}
});
Object.defineProperty(exports, "beginGatewayRestartSignalAdmission", {
	enumerable: true,
	get: function() {
		return beginGatewayRestartSignalAdmission;
	}
});
Object.defineProperty(exports, "beginGatewayRootWorkAdmissionWhenOpen", {
	enumerable: true,
	get: function() {
		return beginGatewayRootWorkAdmissionWhenOpen;
	}
});
Object.defineProperty(exports, "getActiveGatewayRootWorkCount", {
	enumerable: true,
	get: function() {
		return getActiveGatewayRootWorkCount;
	}
});
Object.defineProperty(exports, "getGatewaySuspendAdmissionPhase", {
	enumerable: true,
	get: function() {
		return getGatewaySuspendAdmissionPhase;
	}
});
Object.defineProperty(exports, "isGatewayRestartDraining", {
	enumerable: true,
	get: function() {
		return isGatewayRestartDraining;
	}
});
Object.defineProperty(exports, "isGatewaySubordinateWorkAdmissionClosed", {
	enumerable: true,
	get: function() {
		return isGatewaySubordinateWorkAdmissionClosed;
	}
});
Object.defineProperty(exports, "isGatewayWorkAdmissionClosed", {
	enumerable: true,
	get: function() {
		return isGatewayWorkAdmissionClosed;
	}
});
Object.defineProperty(exports, "retainGatewayRootWorkAdmissionContinuation", {
	enumerable: true,
	get: function() {
		return retainGatewayRootWorkAdmissionContinuation;
	}
});
Object.defineProperty(exports, "rollbackGatewayRestartSignalFence", {
	enumerable: true,
	get: function() {
		return rollbackGatewayRestartSignalFence;
	}
});
Object.defineProperty(exports, "runOutsideGatewayRootWorkAdmission", {
	enumerable: true,
	get: function() {
		return runOutsideGatewayRootWorkAdmission;
	}
});
Object.defineProperty(exports, "runWithGatewayIndependentRootWorkAdmission", {
	enumerable: true,
	get: function() {
		return runWithGatewayIndependentRootWorkAdmission;
	}
});
Object.defineProperty(exports, "runWithGatewayIndependentRootWorkContinuation", {
	enumerable: true,
	get: function() {
		return runWithGatewayIndependentRootWorkContinuation;
	}
});
Object.defineProperty(exports, "tryBeginGatewayRootWorkAdmission", {
	enumerable: true,
	get: function() {
		return tryBeginGatewayRootWorkAdmission;
	}
});
Object.defineProperty(exports, "tryBeginGatewaySuspendAdmission", {
	enumerable: true,
	get: function() {
		return tryBeginGatewaySuspendAdmission;
	}
});
