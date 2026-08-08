const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_reset = require("./reset-DL3L8VC3.cjs");
const require_session_key$1 = require("./session-key-DBTOYACI.cjs");
const require_bootstrap_cache = require("./bootstrap-cache-CaqmJxMO.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_entry_freshness = require("./entry-freshness-DzG9sDbU.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
const require_session_id_resolution = require("./session-id-resolution-CYXapfNW.cjs");
const require_cli_session = require("./cli-session-CX50GYdw.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let node_async_hooks = require("node:async_hooks");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/command/session.ts
/**
* Resolves command session ids, keys, stores, and persisted thinking state.
*/
function clearRotatedSessionMetadata(entry) {
	const next = {
		...entry,
		sessionFile: void 0,
		status: void 0,
		startedAt: void 0,
		endedAt: void 0,
		runtimeMs: void 0,
		abortedLastRun: void 0,
		restartRecoveryForceSafeTools: void 0,
		restartRecoveryDeliveryContext: void 0,
		restartRecoveryDeliveryMediaUrls: void 0,
		restartRecoveryDisableMessageTool: void 0,
		restartRecoverySuppressTextDelivery: void 0,
		restartRecoveryDeliveryRequestFingerprint: void 0,
		restartRecoveryDeliveryRunId: void 0,
		restartRecoveryDeliverySourceRunId: void 0,
		restartRecoveryBeforeAgentReplyState: void 0,
		restartRecoveryDeliveryReceiptState: void 0,
		restartRecoveryDeliveryToolCallId: void 0,
		restartRecoveryRequesterAccountId: void 0,
		restartRecoveryRequesterSenderId: void 0,
		restartRecoverySameChannelThreadRequired: void 0,
		restartRecoverySourceIngress: void 0,
		restartRecoverySourceReplyDeliveryMode: void 0,
		restartRecoveryTerminalDeliveryEvidence: void 0,
		restartRecoveryTerminalRunIds: void 0,
		sessionStartedAt: void 0,
		lastInteractionAt: void 0
	};
	require_cli_session.clearAllCliSessions(next);
	return next;
}
function loadCommandSessionStore(params) {
	return Object.fromEntries(require_session_accessor.listSessionEntries({
		storePath: params.storePath,
		...params.agentId ? { agentId: params.agentId } : {},
		...params.clone === false ? { clone: false } : {}
	}).map(({ sessionKey, entry }) => [sessionKey, entry]));
}
/** Builds the synthetic session key used for explicit session-id runs. */
function buildExplicitSessionIdSessionKey(params) {
	return `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}:explicit:${params.sessionId.trim()}`;
}
function resolveLegacyMainStoreSessionForDefaultAgent(opts) {
	if (opts.defaultAgentId === "main" || !opts.sessionKey) return;
	const defaultMainSessionKey = require_session_key.buildAgentMainSessionKey({
		agentId: opts.defaultAgentId,
		mainKey: opts.mainKey
	});
	if (opts.sessionKey !== defaultMainSessionKey || opts.sessionStore[opts.sessionKey]) return;
	const legacyStorePath = require_paths.resolveStorePath(opts.cfg.session?.store, { agentId: require_session_key.DEFAULT_AGENT_ID });
	const legacyKeys = [require_session_key.buildAgentMainSessionKey({
		agentId: require_session_key.DEFAULT_AGENT_ID,
		mainKey: opts.mainKey
	}), require_session_key.buildAgentMainSessionKey({
		agentId: require_session_key.DEFAULT_AGENT_ID,
		mainKey: "main"
	})];
	if (legacyStorePath === opts.storePath) {
		for (const legacyKey of legacyKeys) {
			const legacyEntry = opts.sessionStore[legacyKey];
			if (legacyEntry) {
				const sessionStore = opts.cloneOnWrite ? { ...opts.sessionStore } : opts.sessionStore;
				sessionStore[opts.sessionKey] = { ...legacyEntry };
				return {
					sessionKey: opts.sessionKey,
					sessionStore,
					storePath: opts.storePath
				};
			}
		}
		return;
	}
	const legacyStore = loadCommandSessionStore({
		agentId: require_session_key.DEFAULT_AGENT_ID,
		storePath: legacyStorePath,
		...opts.cloneOnWrite ? { clone: false } : {}
	});
	for (const legacyKey of legacyKeys) {
		const legacyEntry = legacyStore[legacyKey];
		if (legacyEntry) {
			const sessionStore = opts.cloneOnWrite ? { ...opts.sessionStore } : opts.sessionStore;
			sessionStore[opts.sessionKey] = { ...legacyEntry };
			return {
				sessionKey: opts.sessionKey,
				sessionStore,
				storePath: opts.storePath
			};
		}
	}
}
function collectSessionIdMatchesForRequest(opts) {
	const matches = [];
	const primaryStoreMatches = [];
	const storeByKey = /* @__PURE__ */ new Map();
	const addMatches = (candidateStore, candidateStorePath, options) => {
		for (const [candidateKey, candidateEntry] of Object.entries(candidateStore)) {
			if (candidateEntry?.sessionId !== opts.sessionId) continue;
			matches.push([candidateKey, candidateEntry]);
			if (options?.primary) primaryStoreMatches.push([candidateKey, candidateEntry]);
			storeByKey.set(candidateKey, {
				sessionKey: candidateKey,
				sessionStore: candidateStore,
				storePath: candidateStorePath
			});
		}
	};
	addMatches(opts.sessionStore, opts.storePath, { primary: true });
	if (!opts.searchOtherAgentStores) return {
		matches,
		primaryStoreMatches,
		storeByKey
	};
	for (const agentId of require_agent_scope_config.listAgentIds(opts.cfg)) {
		if (agentId === opts.storeAgentId) continue;
		const candidateStorePath = require_paths.resolveStorePath(opts.cfg.session?.store, { agentId });
		addMatches(loadCommandSessionStore({
			agentId,
			storePath: candidateStorePath,
			...opts.clone === false ? { clone: false } : {}
		}), candidateStorePath);
	}
	return {
		matches,
		primaryStoreMatches,
		storeByKey
	};
}
/**
* Resolve an existing stored session key for a session id from a specific agent store.
* This scopes the lookup to the target store without implicitly converting `agentId`
* into that agent's main session key.
*/
function resolveStoredSessionKeyForSessionId(opts) {
	const sessionId = opts.sessionId.trim();
	const storeAgentId = opts.agentId?.trim() ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agentId) : void 0;
	const storePath = require_paths.resolveStorePath(opts.cfg.session?.store, { agentId: storeAgentId });
	const sessionStore = loadCommandSessionStore({
		storePath,
		...storeAgentId ? { agentId: storeAgentId } : {}
	});
	if (!sessionId) return {
		sessionKey: void 0,
		sessionStore,
		storePath
	};
	const selection = require_session_id_resolution.resolveSessionIdMatchSelection(Object.entries(sessionStore).filter(([, entry]) => entry?.sessionId === sessionId), sessionId);
	return {
		sessionKey: selection.kind === "selected" ? selection.sessionKey : void 0,
		sessionStore,
		storePath
	};
}
/** Resolves the session key/store targeted by one command request. */
function resolveSessionKeyForRequest(opts) {
	const sessionCfg = opts.cfg.session;
	const scope = sessionCfg?.scope ?? "per-sender";
	const mainKey = require_session_key.normalizeMainKey(sessionCfg?.mainKey);
	const defaultAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(opts.cfg));
	const requestedAgentId = opts.agentId?.trim() ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agentId) : void 0;
	const requestedSessionId = opts.sessionId?.trim() || void 0;
	const requestedSessionKey = opts.sessionKey?.trim() || void 0;
	const toSessionKey = !requestedSessionKey && !requestedSessionId && require_session_key.classifySessionKeyShape(opts.to) === "agent" ? opts.to?.trim() : void 0;
	const explicitSessionKey = requestedSessionKey || toSessionKey || (!requestedSessionId ? require_main_session.resolveExplicitAgentSessionKey({
		cfg: opts.cfg,
		agentId: requestedAgentId
	}) : void 0);
	const storeAgentId = explicitSessionKey ? require_session_key.isUnscopedSessionKeySentinel(explicitSessionKey) ? requestedAgentId ?? defaultAgentId : require_session_key.resolveAgentIdFromSessionKey(explicitSessionKey) : requestedAgentId ?? defaultAgentId;
	const storePath = require_paths.resolveStorePath(sessionCfg?.store, { agentId: storeAgentId });
	const sessionStore = loadCommandSessionStore({
		storePath,
		agentId: storeAgentId,
		...(opts.clone === false ? { clone: false } : void 0) ? { clone: false } : {}
	});
	const ctx = opts.to?.trim() ? { From: opts.to } : void 0;
	let sessionKey = explicitSessionKey ?? (ctx ? require_session_key$1.resolveSessionKey(scope, ctx, mainKey, storeAgentId) : void 0);
	if (ctx && !requestedAgentId && !requestedSessionId && !explicitSessionKey) {
		const legacyMainSession = resolveLegacyMainStoreSessionForDefaultAgent({
			cfg: opts.cfg,
			defaultAgentId,
			mainKey,
			sessionKey,
			sessionStore,
			storePath,
			cloneOnWrite: opts.clone === false
		});
		if (legacyMainSession) return legacyMainSession;
	}
	if (requestedSessionId && !explicitSessionKey && (!sessionKey || sessionStore[sessionKey]?.sessionId !== requestedSessionId)) {
		const { matches, primaryStoreMatches, storeByKey } = collectSessionIdMatchesForRequest({
			cfg: opts.cfg,
			sessionStore,
			storePath,
			storeAgentId,
			sessionId: requestedSessionId,
			searchOtherAgentStores: requestedAgentId === void 0,
			...opts.clone === false ? { clone: false } : {}
		});
		const preferredSelection = require_session_id_resolution.resolveSessionIdMatchSelection(matches, requestedSessionId);
		const currentStoreSelection = preferredSelection.kind === "selected" ? preferredSelection : require_session_id_resolution.resolveSessionIdMatchSelection(primaryStoreMatches, requestedSessionId);
		if (currentStoreSelection.kind === "selected") {
			const preferred = storeByKey.get(currentStoreSelection.sessionKey);
			if (preferred) return preferred;
			sessionKey = currentStoreSelection.sessionKey;
		}
	}
	if (requestedSessionId && !sessionKey) sessionKey = buildExplicitSessionIdSessionKey({
		sessionId: requestedSessionId,
		agentId: opts.agentId
	});
	return {
		sessionKey,
		sessionStore,
		storePath
	};
}
/** Resolves or creates the session used by one agent command request. */
function resolveSession(opts) {
	const sessionCfg = opts.cfg.session;
	const { sessionKey, sessionStore, storePath } = resolveSessionKeyForRequest({
		cfg: opts.cfg,
		to: opts.to,
		sessionId: opts.sessionId,
		sessionKey: opts.sessionKey,
		agentId: opts.agentId,
		...opts.clone === false ? { clone: false } : {}
	});
	const now = Date.now();
	const sessionEntry = sessionKey ? sessionStore[sessionKey] : void 0;
	const sessionAgentId = opts.agentId?.trim() ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agentId) : require_session_key.resolveAgentIdFromSessionKey(sessionKey);
	const resetPolicy = require_reset.resolveSessionResetPolicy({
		sessionCfg,
		resetType: require_reset.resolveSessionResetType({ sessionKey }),
		resetOverride: require_reset.resolveChannelResetConfig({
			sessionCfg,
			channel: sessionEntry?.lastChannel ?? sessionEntry?.channel ?? sessionEntry?.origin?.provider
		})
	});
	const requestedSessionId = opts.sessionId?.trim() || void 0;
	const terminalMainTranscriptNewerThanRegistry = sessionEntry && !requestedSessionId ? require_lifecycle.hasTerminalMainSessionTranscriptNewerThanRegistrySync({
		entry: sessionEntry,
		sessionScope: sessionCfg?.scope,
		sessionKey,
		agentId: sessionAgentId,
		mainKey: sessionCfg?.mainKey,
		storePath
	}) : false;
	const lockedModelSelection = require_model_overrides.isModelSelectionLocked(sessionEntry);
	const skipImplicitExpiry = resetPolicy.configured !== true && require_entry_freshness.hasProviderOwnedSession(sessionEntry);
	const fresh = sessionEntry ? lockedModelSelection || !terminalMainTranscriptNewerThanRegistry && (skipImplicitExpiry || require_reset.evaluateSessionFreshness({
		updatedAt: sessionEntry.updatedAt,
		...require_lifecycle.resolveSessionLifecycleTimestamps({
			entry: sessionEntry,
			agentId: sessionAgentId,
			storePath
		}),
		now,
		policy: resetPolicy
	}).fresh) : false;
	const sessionId = requestedSessionId || (fresh ? sessionEntry?.sessionId : void 0) || node_crypto.default.randomUUID();
	const isNewSession = !fresh && !requestedSessionId;
	const resolvedSessionEntry = isNewSession && sessionEntry ? clearRotatedSessionMetadata(sessionEntry) : sessionEntry;
	require_bootstrap_cache.clearBootstrapSnapshotOnSessionRollover({
		sessionKey,
		previousSessionId: isNewSession ? sessionEntry?.sessionId : void 0
	});
	return {
		sessionId,
		sessionKey,
		sessionEntry: resolvedSessionEntry,
		sessionStore,
		storePath,
		isNewSession,
		persistedThinking: fresh && sessionEntry?.thinkingLevel ? require_thinking.normalizeThinkLevel(sessionEntry.thinkingLevel) : void 0,
		persistedVerbose: fresh && sessionEntry?.verboseLevel ? require_thinking.normalizeVerboseLevel(sessionEntry.verboseLevel) : void 0
	};
}
//#endregion
//#region src/agents/session-suspension.ts
/**
* Session suspension and lane auto-resume helpers.
*
* Records quota/manual/circuit suspensions and temporarily lowers command-lane concurrency.
*/
const log = require_subsystem.createSubsystemLogger("session-suspension");
const DEFAULT_CUSTOM_LANE_RESUME_CONCURRENCY = 1;
const DEFAULT_QUOTA_SUSPENSION_RESUME_MS = 1800 * 1e3;
/**
* Keep timer shutdown state process-global so bundled gateway chunks cannot
* leave one module copy scheduling lane resumes after another copy cleaned up.
*/
const SESSION_SUSPENSION_STATE_KEY = Symbol.for("operator.sessionSuspensionRuntimeState");
function getSessionSuspensionState() {
	const state = require_global_singleton.resolveGlobalSingleton(SESSION_SUSPENSION_STATE_KEY, () => ({
		laneResumeTimers: /* @__PURE__ */ new Map(),
		clearedLaneResumes: /* @__PURE__ */ new Map(),
		pendingSuspensionWrites: /* @__PURE__ */ new Map(),
		suspensionWriteChain: Promise.resolve(),
		cleanupGeneration: 0,
		cleanupActive: false
	}));
	if (!state.clearedLaneResumes) state.clearedLaneResumes = /* @__PURE__ */ new Map();
	if (!state.pendingSuspensionWrites) state.pendingSuspensionWrites = /* @__PURE__ */ new Map();
	if (state.suspensionWriteChain === void 0) state.suspensionWriteChain = Promise.resolve();
	return state;
}
const deferredSessionSuspension = new node_async_hooks.AsyncLocalStorage();
function resolveLaneResumeConcurrency(cfg, laneId) {
	switch (laneId) {
		case "main": return require_io.resolveAgentMaxConcurrent(cfg);
		case "subagent": return require_io.resolveSubagentMaxConcurrent(cfg);
		case "cron":
		case "cron-nested": return require_io.resolveCronMaxConcurrentRuns(cfg?.cron);
		default: return DEFAULT_CUSTOM_LANE_RESUME_CONCURRENCY;
	}
}
function isGatewayManagedLane(laneId) {
	const lane = laneId;
	return lane === "main" || lane === "subagent" || lane === "cron" || lane === "cron-nested" || lane === "nested";
}
function resolveSessionSuspensionReason(reason) {
	if (reason === "billing") return "manual";
	if (reason === "rate_limit") return "quota_exhausted";
	return "circuit_open";
}
function runWithDeferredSessionSuspension(run, onDeferred) {
	return deferredSessionSuspension.run({
		claimed: false,
		onDeferred
	}, run);
}
function resolveSessionSuspensionTarget() {
	const scope = deferredSessionSuspension.getStore();
	if (!scope || scope.claimed) return { mode: "suspend" };
	scope.claimed = true;
	return {
		mode: "defer",
		defer: (params) => scope.onDeferred?.(params)
	};
}
function scheduleLaneAutoResume(laneId, delayMs, resumeConcurrency, opts = {}) {
	const nowMs = opts.nowMs ?? Date.now();
	const state = getSessionSuspensionState();
	const existing = state.laneResumeTimers.get(laneId);
	if (existing) clearTimeout(existing.timer);
	const timer = setTimeout(() => {
		if (state.laneResumeTimers.get(laneId)?.timer === timer) state.laneResumeTimers.delete(laneId);
		require_command_queue.setCommandLaneConcurrency(laneId, resumeConcurrency);
		log.info("auto-resumed lane after suspension TTL", {
			laneId,
			delayMs,
			resumeConcurrency
		});
	}, delayMs);
	if (typeof timer.unref === "function") timer.unref();
	state.laneResumeTimers.set(laneId, {
		timer,
		resumeConcurrency,
		resumeAtMs: nowMs + delayMs
	});
}
function clearSessionSuspensionTimers() {
	const state = getSessionSuspensionState();
	state.cleanupGeneration += 1;
	state.cleanupActive = true;
	let cleared = 0;
	for (const [laneId, entry] of state.laneResumeTimers) {
		clearTimeout(entry.timer);
		state.clearedLaneResumes.set(laneId, {
			resumeConcurrency: entry.resumeConcurrency,
			resumeAtMs: entry.resumeAtMs
		});
		cleared += 1;
	}
	state.laneResumeTimers.clear();
	return cleared;
}
function enableSessionSuspensionTimersForGatewayStart(resolveResumeConcurrency = (_laneId, savedResumeConcurrency) => savedResumeConcurrency) {
	const state = getSessionSuspensionState();
	state.cleanupGeneration += 1;
	state.cleanupActive = false;
	const suspendedLaneIds = /* @__PURE__ */ new Set();
	const nowMs = Date.now();
	for (const [laneId, cleared] of state.clearedLaneResumes) {
		const resumeConcurrency = resolveResumeConcurrency(laneId, cleared.resumeConcurrency);
		const remainingMs = (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(cleared.resumeAtMs - nowMs, 0, 0);
		if (remainingMs > 0) {
			require_command_queue.setCommandLaneConcurrency(laneId, 0);
			scheduleLaneAutoResume(laneId, remainingMs, resumeConcurrency, { nowMs });
			suspendedLaneIds.add(laneId);
			continue;
		}
		if (isGatewayManagedLane(laneId)) continue;
		require_command_queue.setCommandLaneConcurrency(laneId, resumeConcurrency);
	}
	state.clearedLaneResumes.clear();
	return suspendedLaneIds;
}
function getCleanupSuspendedLaneIdsForGatewayPublication() {
	const state = getSessionSuspensionState();
	return state.cleanupActive ? new Set(state.clearedLaneResumes.keys()) : /* @__PURE__ */ new Set();
}
async function suspendSession(params) {
	const state = getSessionSuspensionState();
	const queuedGeneration = state.cleanupGeneration;
	const run = state.suspensionWriteChain.catch(() => void 0).then(() => suspendSessionQueued(params, queuedGeneration));
	state.suspensionWriteChain = run.then(() => void 0, () => void 0);
	await run;
}
async function suspendSessionQueued(params, queuedGeneration) {
	if (!params.cfg) return;
	const { sessionKey, storePath } = resolveStoredSessionKeyForSessionId({
		cfg: params.cfg,
		sessionId: params.sessionId,
		agentId: params.agentDir ? node_path.default.basename(params.agentDir) : void 0
	});
	if (!sessionKey) return;
	const ttlMs = (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(params.ttlMs, DEFAULT_QUOTA_SUSPENSION_RESUME_MS, 0);
	const now = Date.now();
	const expectedResumeBy = (0, require_number_coercion.number_coercion_exports.resolveExpiresAtMsFromDurationMs)(ttlMs, { nowMs: now }) ?? now;
	const state = getSessionSuspensionState();
	if (state.cleanupActive || state.cleanupGeneration !== queuedGeneration) return;
	const suspensionGeneration = state.cleanupGeneration;
	const pendingWriteKey = `${storePath}\0${sessionKey}`;
	const existingPendingWrite = state.pendingSuspensionWrites.get(pendingWriteKey);
	const pendingWrite = existingPendingWrite?.generation === suspensionGeneration ? existingPendingWrite : {
		generation: suspensionGeneration,
		previousQuotaSuspension: void 0,
		previousSnapshotCaptured: false,
		activeCount: 0
	};
	pendingWrite.activeCount += 1;
	state.pendingSuspensionWrites.set(pendingWriteKey, pendingWrite);
	const releasePendingWrite = () => {
		pendingWrite.activeCount -= 1;
		if (pendingWrite.activeCount <= 0 && getSessionSuspensionState().pendingSuspensionWrites.get(pendingWriteKey) === pendingWrite) getSessionSuspensionState().pendingSuspensionWrites.delete(pendingWriteKey);
	};
	const throttleLane = () => {
		if (!params.laneId) return;
		require_command_queue.setCommandLaneConcurrency(params.laneId, 0);
		scheduleLaneAutoResume(params.laneId, ttlMs, resolveLaneResumeConcurrency(params.cfg, params.laneId));
	};
	let persistedSuspension;
	try {
		persistedSuspension = await require_session_accessor.patchSessionEntry({
			storePath,
			sessionKey
		}, (entry) => {
			if (getSessionSuspensionState().cleanupGeneration !== suspensionGeneration) return null;
			if (!pendingWrite.previousSnapshotCaptured) {
				pendingWrite.previousQuotaSuspension = entry.quotaSuspension;
				pendingWrite.previousSnapshotCaptured = true;
			}
			return { quotaSuspension: {
				schemaVersion: 1,
				suspendedAt: now,
				reason: params.reason,
				failedProvider: params.failedProvider,
				failedModel: params.failedModel,
				summary: params.summary,
				laneId: params.laneId,
				expectedResumeBy,
				state: "suspended"
			} };
		}, {
			skipMaintenance: true,
			takeCacheOwnership: true
		}) !== null;
	} catch (err) {
		log.warn("failed to persist quota suspension; applying transient lane throttle", {
			sessionId: params.sessionId,
			laneId: params.laneId,
			error: err instanceof Error ? err.message : String(err)
		});
		releasePendingWrite();
		if (!getSessionSuspensionState().cleanupActive && suspensionGeneration === getSessionSuspensionState().cleanupGeneration) throttleLane();
		return;
	}
	const postPatchState = getSessionSuspensionState();
	if (persistedSuspension && (postPatchState.cleanupActive || suspensionGeneration !== postPatchState.cleanupGeneration)) {
		try {
			await require_session_accessor.patchSessionEntry({
				storePath,
				sessionKey
			}, (entry) => entry.quotaSuspension?.suspendedAt === now && entry.quotaSuspension.reason === params.reason && entry.quotaSuspension.failedProvider === params.failedProvider && entry.quotaSuspension.failedModel === params.failedModel && entry.quotaSuspension.laneId === params.laneId ? { quotaSuspension: pendingWrite.previousQuotaSuspension } : null, {
				skipMaintenance: true,
				takeCacheOwnership: true
			});
		} catch (err) {
			log.warn("failed to clear quota suspension after shutdown cleanup", {
				sessionId: params.sessionId,
				laneId: params.laneId,
				error: err instanceof Error ? err.message : String(err)
			});
		}
		releasePendingWrite();
		return;
	}
	if (persistedSuspension) throttleLane();
	releasePendingWrite();
}
function resetSessionSuspensionStateForTest() {
	const state = getSessionSuspensionState();
	for (const entry of state.laneResumeTimers.values()) clearTimeout(entry.timer);
	state.laneResumeTimers.clear();
	state.clearedLaneResumes.clear();
	state.pendingSuspensionWrites.clear();
	state.suspensionWriteChain = Promise.resolve();
	state.cleanupGeneration = 0;
	state.cleanupActive = false;
}
function seedClearedLaneResumeForTest(laneId, cleared) {
	const state = getSessionSuspensionState();
	state.cleanupActive = true;
	state.clearedLaneResumes.set(laneId, cleared);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.sessionSuspensionTestApi")] = {
	resetSessionSuspensionStateForTest,
	seedClearedLaneResumeForTest
};
//#endregion
Object.defineProperty(exports, "clearRotatedSessionMetadata", {
	enumerable: true,
	get: function() {
		return clearRotatedSessionMetadata;
	}
});
Object.defineProperty(exports, "clearSessionSuspensionTimers", {
	enumerable: true,
	get: function() {
		return clearSessionSuspensionTimers;
	}
});
Object.defineProperty(exports, "enableSessionSuspensionTimersForGatewayStart", {
	enumerable: true,
	get: function() {
		return enableSessionSuspensionTimersForGatewayStart;
	}
});
Object.defineProperty(exports, "getCleanupSuspendedLaneIdsForGatewayPublication", {
	enumerable: true,
	get: function() {
		return getCleanupSuspendedLaneIdsForGatewayPublication;
	}
});
Object.defineProperty(exports, "resolveSession", {
	enumerable: true,
	get: function() {
		return resolveSession;
	}
});
Object.defineProperty(exports, "resolveSessionKeyForRequest", {
	enumerable: true,
	get: function() {
		return resolveSessionKeyForRequest;
	}
});
Object.defineProperty(exports, "resolveSessionSuspensionReason", {
	enumerable: true,
	get: function() {
		return resolveSessionSuspensionReason;
	}
});
Object.defineProperty(exports, "resolveSessionSuspensionTarget", {
	enumerable: true,
	get: function() {
		return resolveSessionSuspensionTarget;
	}
});
Object.defineProperty(exports, "resolveStoredSessionKeyForSessionId", {
	enumerable: true,
	get: function() {
		return resolveStoredSessionKeyForSessionId;
	}
});
Object.defineProperty(exports, "runWithDeferredSessionSuspension", {
	enumerable: true,
	get: function() {
		return runWithDeferredSessionSuspension;
	}
});
Object.defineProperty(exports, "suspendSession", {
	enumerable: true,
	get: function() {
		return suspendSession;
	}
});
