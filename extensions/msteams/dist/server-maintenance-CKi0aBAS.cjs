require("./rolldown-runtime-u92d-OFm.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
const require_delivery_queue_media_spool = require("./delivery-queue-media-spool-CNGRftlP.cjs");
const require_curator = require("./curator-D3crpveo.cjs");
const require_server_constants = require("./server-constants-CESgKlPt.cjs");
const require_server_chat_state = require("./server-chat-state-C221bQhe.cjs");
const require_chat_abort = require("./chat-abort-CWaOZDr9.cjs");
require("./server-shared-BEWIDSNP.cjs");
const require_service = require("./service-D9VsD8u0.cjs");
const require_owner_protection = require("./owner-protection-B2wwlIbL.cjs");
const require_control_plane_rate_limit = require("./control-plane-rate-limit-CoRWsoiI.cjs");
require("./server-utils-Cs8RsB0Z.cjs");
const require_health_state = require("./health-state-BQvfPUgE.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/gateway/server-maintenance.ts
const DELIVERY_QUEUE_MEDIA_GC_INTERVAL_MS = 60 * 6e4;
function startGatewayMaintenanceTimers(params) {
	require_health_state.setBroadcastHealthUpdate((snap) => {
		params.broadcast("health", snap, { stateVersion: {
			presence: params.getPresenceVersion(),
			health: params.getHealthVersion()
		} });
		params.nodeSendToAllSubscribed("health", snap);
	});
	const tickInterval = setInterval(() => {
		const payload = { ts: Date.now() };
		params.broadcast("tick", payload);
		params.nodeSendToAllSubscribed("tick", payload);
	}, require_server_constants.TICK_INTERVAL_MS);
	const healthInterval = setInterval(() => {
		params.refreshGatewayHealthSnapshot({ probe: false }).catch((err) => params.logHealth.error(`refresh failed: ${require_errors.formatErrorMessage(err)}`));
	}, require_server_constants.HEALTH_REFRESH_INTERVAL_MS);
	params.refreshGatewayHealthSnapshot({ probe: false }).catch((err) => params.logHealth.error(`initial refresh failed: ${require_errors.formatErrorMessage(err)}`));
	const runWorktreeGc = params.runWorktreeGc ?? (() => {
		const cfg = params.getRuntimeConfig();
		return require_service.managedWorktrees.gc({
			shouldProtectOwner: require_owner_protection.createManagedWorktreeOwnerProtection(cfg),
			limits: require_service.resolveWorktreeCleanupLimits(cfg.worktrees)
		});
	});
	const performWorktreeGc = () => runWorktreeGc().catch((err) => {
		params.logHealth.error(`managed worktree cleanup failed: ${require_errors.formatErrorMessage(err)}`);
	});
	const worktreeCleanup = setInterval(() => void performWorktreeGc(), require_service.WORKTREE_GC_INTERVAL_MS);
	performWorktreeGc();
	const runDeliveryQueueMediaGc = params.runDeliveryQueueMediaGc ?? (() => require_delivery_queue_media_spool.pruneOrphanedDeliveryQueueMedia());
	let deliveryQueueMediaGcInFlight = null;
	let deliveryQueueMediaGcStartedAtMs = 0;
	const performDeliveryQueueMediaGc = () => {
		if (deliveryQueueMediaGcInFlight) return deliveryQueueMediaGcInFlight;
		deliveryQueueMediaGcStartedAtMs = Date.now();
		deliveryQueueMediaGcInFlight = Promise.resolve().then(async () => {
			await runDeliveryQueueMediaGc();
		}).catch((err) => {
			params.logHealth.error(`delivery queue media cleanup failed: ${require_errors.formatErrorMessage(err)}`);
		}).finally(() => {
			deliveryQueueMediaGcInFlight = null;
		});
		return deliveryQueueMediaGcInFlight;
	};
	performDeliveryQueueMediaGc();
	let skillCuratorCleanup = () => {};
	if (params.enableSkillCurator) skillCuratorCleanup = require_curator.startSkillCuratorMaintenance({
		onError: (err) => params.logHealth.error(`skill curator sweep failed: ${require_errors.formatErrorMessage(err)}`),
		registerUsageTracking: params.registerSkillUsageTracking,
		runSweep: params.runSkillCuratorSweep
	});
	const dedupeCleanup = setInterval(() => {
		const AGENT_RUN_SEQ_MAX = 1e4;
		const now = Date.now();
		if (now - deliveryQueueMediaGcStartedAtMs >= DELIVERY_QUEUE_MEDIA_GC_INTERVAL_MS) performDeliveryQueueMediaGc();
		const resolveDedupeRunId = (key, entry) => {
			if (!key.startsWith("agent:") && !key.startsWith("chat:")) return;
			const keyRunId = key.slice(key.indexOf(":") + 1);
			if (keyRunId) {
				if (params.chatAbortControllers.has(keyRunId) || params.chatQueuedTurns.has(keyRunId)) return keyRunId;
			}
			const payload = entry.payload;
			return payload && typeof payload === "object" && !Array.isArray(payload) ? typeof payload.runId === "string" ? payload.runId.trim() || void 0 : void 0 : void 0;
		};
		const isPendingAcceptedRunDedupeKey = (key, dedupeEntry) => {
			if (!key.startsWith("agent:") && !key.startsWith("pending-chat:")) return false;
			const payload = dedupeEntry.payload;
			if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
			if (payload.status !== "accepted") return false;
			const expiresAtMs = payload.expiresAtMs;
			return (0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(expiresAtMs, { nowMs: now });
		};
		const isActiveRunDedupeKey = (key, dedupeEntry) => {
			const isAgentKey = key.startsWith("agent:");
			const isChatKey = key.startsWith("chat:");
			if (!isAgentKey && !isChatKey) return false;
			const runId = resolveDedupeRunId(key, dedupeEntry);
			const entry = runId ? params.chatAbortControllers.get(runId) : void 0;
			if (entry) return isAgentKey ? entry.kind === "agent" : entry.kind !== "agent";
			return Boolean(isChatKey && runId && params.chatQueuedTurns.has(runId));
		};
		for (const [k, v] of params.dedupe) {
			if (isActiveRunDedupeKey(k, v) || isPendingAcceptedRunDedupeKey(k, v)) continue;
			if (now - v.ts > 3e5) params.dedupe.delete(k);
		}
		if (params.dedupe.size > 1e3) {
			const excess = params.dedupe.size - require_server_constants.DEDUPE_MAX;
			const oldestKeys = [...params.dedupe.entries()].filter(([key, entry]) => !isActiveRunDedupeKey(key, entry) && !isPendingAcceptedRunDedupeKey(key, entry)).toSorted(([, left], [, right]) => left.ts - right.ts).slice(0, excess).map(([key]) => key);
			for (const key of oldestKeys) params.dedupe.delete(key);
		}
		if (params.agentRunSeq.size > AGENT_RUN_SEQ_MAX) {
			const excess = params.agentRunSeq.size - AGENT_RUN_SEQ_MAX;
			let removed = 0;
			for (const runId of params.agentRunSeq.keys()) {
				params.agentRunSeq.delete(runId);
				removed += 1;
				if (removed >= excess) break;
			}
		}
		const resolveAgentThrottleRunId = (key) => {
			if (key.endsWith(":assistant")) return key.slice(0, -10);
			if (key.endsWith(":thinking")) return key.slice(0, -9);
			return key;
		};
		for (const [runId, entry] of params.chatAbortControllers) {
			if (entry.projectSessionTerminalPending === true) continue;
			if ((0, _gabrielvfonseca_normalization_core_number_coercion.isFutureDateTimestampMs)(entry.expiresAtMs, { nowMs: now })) continue;
			if (entry.projectSessionTerminalPersistence) {
				const lifecycleGeneration = entry.lifecycleGeneration?.trim();
				const sessionKey = entry.sessionKey.trim();
				const sessionId = entry.sessionId.trim();
				if (entry.controlUiVisible !== false && lifecycleGeneration && sessionKey && sessionId) params.restartRecoveryCandidates.set(runId, {
					runId,
					lifecycleGeneration,
					sessionKey,
					sessionId,
					observedAt: entry.projectSessionTerminalObservedAt
				});
				require_chat_abort.removeChatAbortControllerEntry(params.chatAbortControllers, runId, entry);
				continue;
			}
			if (entry.projectSessionActive === false) {
				require_chat_abort.removeChatAbortControllerEntry(params.chatAbortControllers, runId, entry);
				continue;
			}
			require_chat_abort.abortTrackedChatRunById(params, {
				runId,
				sessionKey: entry.sessionKey,
				stopReason: "timeout"
			});
		}
		const ABORTED_RUN_TTL_MS = 60 * 6e4;
		for (const [runId, abortMarker] of params.chatRunState.abortedRuns) {
			if (now - require_server_chat_state.chatAbortMarkerTimestampMs(abortMarker) <= ABORTED_RUN_TTL_MS) continue;
			params.chatRunState.abortedRuns.delete(runId);
			params.chatRunState.clearRun(runId);
		}
		require_control_plane_rate_limit.pruneStaleControlPlaneBuckets(now);
		for (const [runId, lastSentAt] of params.chatDeltaSentAt) {
			if (params.chatRunState.abortedRuns.has(runId)) continue;
			if (params.chatAbortControllers.has(runId)) continue;
			if (now - lastSentAt <= ABORTED_RUN_TTL_MS) continue;
			params.chatRunState.clearRun(runId);
		}
		for (const [runId, lastUpdatedAt] of params.chatRunState.bufferUpdatedAt) {
			if (params.chatRunState.abortedRuns.has(runId)) continue;
			if (params.chatAbortControllers.has(runId)) continue;
			if (now - lastUpdatedAt <= ABORTED_RUN_TTL_MS) continue;
			params.chatRunState.clearRun(runId);
		}
		for (const [key, lastSentAt] of params.chatRunState.agentDeltaSentAt) {
			const runId = resolveAgentThrottleRunId(key);
			if (params.chatRunState.abortedRuns.has(runId)) continue;
			if (params.chatAbortControllers.has(runId)) continue;
			if (now - lastSentAt <= ABORTED_RUN_TTL_MS) continue;
			params.chatRunState.clearRun(runId);
		}
		require_agent_events.sweepStaleRunContexts();
	}, 6e4);
	if (typeof params.mediaCleanupTtlMs !== "number") return {
		tickInterval,
		healthInterval,
		dedupeCleanup,
		mediaCleanup: null,
		worktreeCleanup,
		skillCuratorCleanup
	};
	let mediaCleanupInFlight = null;
	const runMediaCleanup = () => {
		if (mediaCleanupInFlight) return mediaCleanupInFlight;
		mediaCleanupInFlight = require_store.cleanOldMedia(params.mediaCleanupTtlMs, {
			recursive: true,
			pruneEmptyDirs: true
		}).catch((err) => {
			params.logHealth.error(`media cleanup failed: ${require_errors.formatErrorMessage(err)}`);
		}).finally(() => {
			mediaCleanupInFlight = null;
		});
		return mediaCleanupInFlight;
	};
	const mediaCleanup = setInterval(() => {
		runMediaCleanup();
	}, 60 * 6e4);
	runMediaCleanup();
	return {
		tickInterval,
		healthInterval,
		dedupeCleanup,
		mediaCleanup,
		worktreeCleanup,
		skillCuratorCleanup
	};
}
//#endregion
exports.startGatewayMaintenanceTimers = startGatewayMaintenanceTimers;
