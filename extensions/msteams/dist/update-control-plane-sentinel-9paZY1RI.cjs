const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_restart_sentinel = require("./restart-sentinel-BH8dJFkM.cjs");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/infra/update-restart-sentinel-payload.ts
/** Build the restart sentinel payload written after update runs. */
function buildUpdateRestartSentinelPayload(params) {
	const { result, meta } = params;
	const continuation = result.status === "ok" ? require_restart_sentinel.buildRestartSuccessContinuation({
		sessionKey: meta.sessionKey,
		continuationMessage: meta.continuationMessage
	}) : null;
	return {
		kind: "update",
		status: result.status,
		ts: params.nowMs ?? Date.now(),
		...meta.sessionKey ? { sessionKey: meta.sessionKey } : {},
		...meta.deliveryContext ? { deliveryContext: meta.deliveryContext } : {},
		...meta.threadId ? { threadId: meta.threadId } : {},
		message: meta.note ?? null,
		...continuation ? { continuation } : {},
		doctorHint: require_restart_sentinel.formatDoctorNonInteractiveHint(),
		stats: {
			mode: result.mode,
			...result.root ? { root: result.root } : {},
			...meta.handoffId ? { handoffId: meta.handoffId } : {},
			before: result.before ?? null,
			after: result.after ?? null,
			steps: result.steps.map((step) => ({
				name: step.name,
				command: step.command,
				cwd: step.cwd,
				durationMs: step.durationMs,
				log: {
					stdoutTail: step.stdoutTail ?? null,
					stderrTail: step.stderrTail ?? null,
					exitCode: step.exitCode ?? null
				}
			})),
			reason: result.reason ?? null,
			durationMs: result.durationMs
		}
	};
}
//#endregion
//#region src/infra/update-control-plane-sentinel.ts
const CONTROL_PLANE_UPDATE_SENTINEL_META_ENV = "OPERATOR_CONTROL_PLANE_UPDATE_SENTINEL_META";
const CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON = "managed-service-handoff-started";
const CONTROL_PLANE_UPDATE_RESTART_HEALTH_PENDING_REASON = "restart-health-pending";
const CONTROL_PLANE_UPDATE_PENDING_REASONS = /* @__PURE__ */ new Set([CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON, CONTROL_PLANE_UPDATE_RESTART_HEALTH_PENDING_REASON]);
/** Return true when an update sentinel represents an in-progress control-plane restart. */
function isPendingControlPlaneUpdateRestartSentinel(payload) {
	const reason = payload.stats?.reason;
	return payload.kind === "update" && payload.status === "skipped" && typeof reason === "string" && CONTROL_PLANE_UPDATE_PENDING_REASONS.has(reason);
}
//#endregion
Object.defineProperty(exports, "CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON", {
	enumerable: true,
	get: function() {
		return CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON;
	}
});
Object.defineProperty(exports, "CONTROL_PLANE_UPDATE_RESTART_HEALTH_PENDING_REASON", {
	enumerable: true,
	get: function() {
		return CONTROL_PLANE_UPDATE_RESTART_HEALTH_PENDING_REASON;
	}
});
Object.defineProperty(exports, "CONTROL_PLANE_UPDATE_SENTINEL_META_ENV", {
	enumerable: true,
	get: function() {
		return CONTROL_PLANE_UPDATE_SENTINEL_META_ENV;
	}
});
Object.defineProperty(exports, "buildUpdateRestartSentinelPayload", {
	enumerable: true,
	get: function() {
		return buildUpdateRestartSentinelPayload;
	}
});
Object.defineProperty(exports, "isPendingControlPlaneUpdateRestartSentinel", {
	enumerable: true,
	get: function() {
		return isPendingControlPlaneUpdateRestartSentinel;
	}
});
