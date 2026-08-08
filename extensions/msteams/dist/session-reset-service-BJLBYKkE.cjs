const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_session_binding_service = require("./session-binding-service-Bu6XDLmS.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_internal_hooks = require("./internal-hooks-CP-OV43M.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_session_state_events = require("./session-state-events-B4SfvxiO.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_agent_bundle_mcp_runtime = require("./agent-bundle-mcp-runtime-bT8ElU5D.cjs");
require("./agent-bundle-mcp-tools-e1AmWJ1L.cjs");
const require_registry$1 = require("./registry-DPQgylfd.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_runs = require("./runs-BxiWZCUY.cjs");
const require_bootstrap_cache = require("./bootstrap-cache-CaqmJxMO.cjs");
const require_cli_session_binding = require("./cli-session-binding-BLYmlDx8.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
const require_cli_session = require("./cli-session-CX50GYdw.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_session_model_ref = require("./session-model-ref-DUZbU68I.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_session_transcript_files_fs = require("./session-transcript-files.fs-DYt0TgFR.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_manager = require("./manager-B5L0WDCm.cjs");
require("./embedded-agent-C44j1_Yh.cjs");
const require_session_placement_admission = require("./session-placement-admission-DVqcuHQn.cjs");
const require_abort = require("./abort-Vp9q6rQx.cjs");
const require_session_hooks = require("./session-hooks-Hjqs8fIk.cjs");
const require_browser_lifecycle_cleanup = require("./browser-lifecycle-cleanup-D3bWgPni.cjs");
const require_session_reset_cleanup = require("./session-reset-cleanup-D1kv2Oqs.cjs");
const require_host_hook_cleanup = require("./host-hook-cleanup-CCfZfwzs.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/session-child-sessions.ts
/** Returns true when a session store row is a direct child of the parent key. */
function isDirectChildSessionEntry(params) {
	const parentKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.parentKey);
	if (!parentKey || params.sessionKey === parentKey || !params.entry) return false;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.spawnedBy) === parentKey || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.parentSessionKey) === parentKey;
}
/** Finds direct child sessions for a parent session across the combined gateway store. */
function findDirectChildSessionsForParent(params) {
	const { store } = require_sessions.loadCombinedSessionStoreForGateway(params.cfg);
	return Object.entries(store).filter(([sessionKey, entry]) => isDirectChildSessionEntry({
		sessionKey,
		entry,
		parentKey: params.parentKey
	})).map(([sessionKey, entry]) => ({
		sessionKey,
		entry
	}));
}
//#endregion
//#region src/gateway/session-reset-service.ts
const ACP_RUNTIME_CLEANUP_TIMEOUT_MS = 15e3;
function archiveSessionTranscriptsForSessionDetailed(params) {
	if (!params.sessionId) return [];
	return require_session_transcript_files_fs.archiveSessionTranscriptsDetailed({
		sessionId: params.sessionId,
		storePath: params.storePath,
		sessionFile: params.sessionFile,
		agentId: params.agentId,
		reason: params.reason,
		onArchiveError: params.onArchiveError
	});
}
function emitGatewaySessionEndPluginHook(params) {
	if (!params.sessionId) return;
	require_session_hooks.forgetActiveSessionForShutdown(params.sessionId);
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("session_end")) return;
	const transcript = require_session_transcript_files_fs.resolveStableSessionEndTranscript({
		sessionId: params.sessionId,
		storePath: params.storePath,
		sessionFile: params.sessionFile,
		agentId: params.agentId,
		archivedTranscripts: params.archivedTranscripts
	});
	const payload = require_session_hooks.buildSessionEndHookPayload({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		cfg: params.cfg,
		reason: params.reason,
		sessionFile: transcript.sessionFile,
		transcriptArchived: transcript.transcriptArchived,
		nextSessionId: params.nextSessionId,
		nextSessionKey: params.nextSessionKey
	});
	require_gateway_work_admission.runWithGatewayIndependentRootWorkContinuation(async () => {
		await hookRunner.runSessionEnd(payload.event, payload.context);
	}).catch((err) => {
		require_globals.logVerbose(`session_end hook failed: ${String(err)}`);
	});
}
function emitGatewaySessionStartPluginHook(params) {
	if (!params.sessionId) return;
	if (params.storePath) require_session_hooks.noteActiveSessionForShutdown({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		storePath: params.storePath,
		sessionFile: params.sessionFile,
		agentId: params.agentId
	});
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("session_start")) return;
	const payload = require_session_hooks.buildSessionStartHookPayload({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		cfg: params.cfg,
		resumedFrom: params.resumedFrom
	});
	require_gateway_work_admission.runWithGatewayIndependentRootWorkContinuation(async () => {
		await hookRunner.runSessionStart(payload.event, payload.context);
	}).catch((err) => {
		require_globals.logVerbose(`session_start hook failed: ${String(err)}`);
	});
}
const SHUTDOWN_DRAIN_DEFAULT_TOTAL_TIMEOUT_MS = 2e3;
/**
* Emit a typed `session_end` for every session that received `session_start`
* but did not yet receive a paired `session_end`. The bounded total timeout
* mirrors the gateway lifecycle hook timeout so a slow plugin cannot block
* SIGTERM/SIGINT past the runtime's overall shutdown grace window.
*
* Sessions that have already been finalized through replace / reset / delete /
* compaction are forgotten from the tracker by `emitGatewaySessionEndPluginHook`
* before this drain runs, so they will not be double-fired here.
*/
async function drainActiveSessionsForShutdown(params) {
	const tracked = require_session_hooks.listActiveSessionsForShutdown();
	if (tracked.length === 0) return {
		emittedSessionIds: [],
		timedOut: false
	};
	const totalTimeoutMs = Math.max(100, Math.floor(params.totalTimeoutMs ?? SHUTDOWN_DRAIN_DEFAULT_TOTAL_TIMEOUT_MS));
	const emittedSessionIds = [];
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	let settledEmissions = 0;
	const drain = Promise.allSettled(tracked.map(async (entry) => {
		try {
			require_session_hooks.forgetActiveSessionForShutdown(entry.sessionId);
			emittedSessionIds.push(entry.sessionId);
			if (!hookRunner?.hasHooks("session_end")) return;
			const transcript = require_session_transcript_files_fs.resolveStableSessionEndTranscript({
				sessionId: entry.sessionId,
				storePath: entry.storePath,
				sessionFile: entry.sessionFile,
				agentId: entry.agentId
			});
			const payload = require_session_hooks.buildSessionEndHookPayload({
				sessionId: entry.sessionId,
				sessionKey: entry.sessionKey,
				cfg: entry.cfg,
				reason: params.reason,
				sessionFile: transcript.sessionFile,
				transcriptArchived: transcript.transcriptArchived
			});
			await hookRunner.runSessionEnd(payload.event, payload.context);
		} catch (err) {
			require_globals.logVerbose(`session_end hook failed during shutdown drain: ${String(err)}`);
		} finally {
			settledEmissions++;
		}
	}));
	let timer;
	const timeout = new Promise((resolve) => {
		timer = setTimeout(() => resolve("timeout"), totalTimeoutMs);
		timer.unref?.();
	});
	try {
		if (await Promise.race([drain.then(() => "ok"), timeout]) === "timeout") {
			require_globals.logVerbose(`shutdown session-end drain timed out after ${totalTimeoutMs}ms with ${tracked.length - settledEmissions} session_end handler(s) still pending`);
			return {
				emittedSessionIds,
				timedOut: true
			};
		}
		return {
			emittedSessionIds,
			timedOut: false
		};
	} finally {
		if (timer) clearTimeout(timer);
	}
}
async function emitSessionUnboundLifecycleEvent(params) {
	const targetKind = require_session_key.isSubagentSessionKey(params.targetSessionKey) ? "subagent" : "acp";
	await require_session_binding_service.getSessionBindingService().unbind({
		targetSessionKey: params.targetSessionKey,
		reason: params.reason
	});
	if (params.emitHooks === false) return;
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("subagent_ended")) return;
	await hookRunner.runSubagentEnded({
		targetSessionKey: params.targetSessionKey,
		targetKind,
		reason: params.reason,
		sendFarewell: true,
		outcome: params.reason === "session-reset" ? "reset" : "deleted"
	}, { childSessionKey: params.targetSessionKey });
}
async function ensureSessionRuntimeCleanup(params) {
	const closeTrackedBrowserTabs = async () => {
		params.assertCurrent?.();
		const closeKeys = /* @__PURE__ */ new Set([
			params.key,
			params.target.canonicalKey,
			...params.target.storeKeys,
			params.sessionId ?? ""
		]);
		await require_browser_lifecycle_cleanup.cleanupBrowserSessionsForLifecycleEnd({
			cfg: params.cfg,
			sessionKeys: [...closeKeys],
			onWarn: (message) => require_globals.logVerbose(message)
		});
		params.assertCurrent?.();
	};
	params.assertCurrent?.();
	const queueKeys = new Set(params.target.storeKeys);
	queueKeys.add(params.target.canonicalKey);
	if (params.sessionId) queueKeys.add(params.sessionId);
	require_session_reset_cleanup.clearSessionResetRuntimeState([...queueKeys], { activeReplySessionId: params.sessionId });
	require_abort.stopSubagentsForRequester({
		cfg: params.cfg,
		requesterSessionKey: params.target.canonicalKey
	});
	if (!params.sessionId) {
		params.assertCurrent?.();
		require_bootstrap_cache.clearBootstrapSnapshot(params.target.canonicalKey);
		await closeTrackedBrowserTabs();
		return;
	}
	params.assertCurrent?.();
	require_runs.abortEmbeddedAgentRun(params.sessionId);
	const ended = await require_runs.waitForEmbeddedAgentRunEnd(params.sessionId, 15e3);
	params.assertCurrent?.();
	require_bootstrap_cache.clearBootstrapSnapshot(params.target.canonicalKey);
	if (ended) {
		params.assertCurrent?.();
		await require_agent_bundle_mcp_runtime.retireSessionMcpRuntime({
			sessionId: params.sessionId,
			reason: "gateway-session-cleanup",
			onError: (error, sessionId) => {
				require_globals.logVerbose(`sessions cleanup: failed to dispose bundle MCP runtime for ${sessionId}: ${String(error)}`);
			}
		});
		params.assertCurrent?.();
		await closeTrackedBrowserTabs();
		return;
	}
	return require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Session ${params.key} is still active; try again in a moment.`);
}
async function runAcpCleanupStep(params) {
	let timer;
	const timeoutPromise = new Promise((resolve) => {
		timer = setTimeout(() => resolve({ status: "timeout" }), ACP_RUNTIME_CLEANUP_TIMEOUT_MS);
	});
	const opPromise = params.op().then(() => ({ status: "ok" })).catch((error) => ({
		status: "error",
		error
	}));
	const outcome = await Promise.race([opPromise, timeoutPromise]);
	if (timer) clearTimeout(timer);
	return outcome;
}
async function closeAcpRuntimeForSession(params) {
	if (params.shouldCleanup && !params.shouldCleanup()) return;
	params.assertCurrent?.();
	const sessionKeys = Array.from(new Set([params.sessionKey, ...params.fallbackSessionKeys ?? []].map((key) => typeof key === "string" ? key.trim() : "").filter(Boolean)));
	let acpMeta;
	let acpSessionKey = params.sessionKey;
	for (const sessionKey of sessionKeys) {
		acpMeta = require_session_meta.readAcpSessionMeta({ sessionKey });
		if (acpMeta) {
			acpSessionKey = sessionKey;
			break;
		}
	}
	if (!acpMeta) return;
	const acpManager = require_manager.getAcpSessionManager();
	if (params.shouldCleanup && !params.shouldCleanup()) return;
	params.assertCurrent?.();
	const cancelOutcome = await runAcpCleanupStep({ op: async () => {
		await acpManager.cancelSession({
			cfg: params.cfg,
			sessionKey: acpSessionKey,
			reason: params.reason
		});
	} });
	if (params.shouldCleanup && !params.shouldCleanup()) return;
	params.assertCurrent?.();
	if (cancelOutcome.status === "timeout") return require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Session ${params.sessionKey} is still active; try again in a moment.`);
	if (cancelOutcome.status === "error") require_globals.logVerbose(`sessions.${params.reason}: ACP cancel failed for ${params.sessionKey}: ${String(cancelOutcome.error)}`);
	if (params.shouldCleanup && !params.shouldCleanup()) return;
	params.assertCurrent?.();
	const closeOutcome = await runAcpCleanupStep({ op: async () => {
		await acpManager.closeSession({
			cfg: params.cfg,
			sessionKey: acpSessionKey,
			reason: params.reason,
			discardPersistentState: true,
			requireAcpSession: false,
			allowBackendUnavailable: true
		});
	} });
	if (params.shouldCleanup && !params.shouldCleanup()) return;
	params.assertCurrent?.();
	if (closeOutcome.status === "timeout") return require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Session ${params.sessionKey} is still active; try again in a moment.`);
	if (closeOutcome.status === "error") require_globals.logVerbose(`sessions.${params.reason}: ACP runtime close failed for ${params.sessionKey}: ${String(closeOutcome.error)}`);
	if (params.reason === "session-delete") {
		params.assertCurrent?.();
		await require_session_meta.upsertAcpSessionMeta({
			cfg: params.cfg,
			sessionKey: acpSessionKey,
			mutate: () => null
		});
		params.assertCurrent?.();
	} else if (params.deferResetState) params.onDeferredResetState?.({
		sessionKey: acpSessionKey,
		meta: acpMeta
	});
	else {
		const resetMeta = await ensureFreshAcpResetState({
			cfg: params.cfg,
			sessionKey: acpSessionKey,
			reason: params.reason,
			acpMeta,
			assertCurrent: params.assertCurrent,
			shouldApply: params.shouldCleanup
		});
		if (resetMeta) params.onResetMeta?.({
			sessionKey: acpSessionKey,
			meta: resetMeta
		});
	}
}
function buildPendingAcpMeta(base, now) {
	const currentIdentity = base.identity;
	const nextIdentity = currentIdentity ? {
		state: "pending",
		...currentIdentity.acpxRecordId ? { acpxRecordId: currentIdentity.acpxRecordId } : {},
		source: currentIdentity.source,
		lastUpdatedAt: now
	} : void 0;
	return {
		backend: base.backend,
		agent: base.agent,
		runtimeSessionName: base.runtimeSessionName,
		...nextIdentity ? { identity: nextIdentity } : {},
		mode: base.mode,
		...base.runtimeOptions ? { runtimeOptions: base.runtimeOptions } : {},
		...base.cwd ? { cwd: base.cwd } : {},
		state: "idle",
		lastActivityAt: now
	};
}
async function ensureFreshAcpResetState(params) {
	if (params.reason !== "session-reset") return;
	const latestMeta = require_session_meta.readAcpSessionMeta({ sessionKey: params.sessionKey }) ?? params.acpMeta;
	if (latestMeta.identity?.state !== "resolved" || !latestMeta.identity.acpxSessionId && !latestMeta.identity.agentSessionId) return;
	const backendId = (latestMeta.backend || params.cfg.acp?.backend || "").trim() || void 0;
	if (params.shouldApply && !params.shouldApply()) return;
	try {
		params.assertCurrent?.();
		await require_registry$1.getAcpRuntimeBackend(backendId)?.runtime.prepareFreshSession?.({ sessionKey: params.sessionKey });
		if (params.shouldApply && !params.shouldApply()) return;
		params.assertCurrent?.();
	} catch (error) {
		params.assertCurrent?.();
		require_globals.logVerbose(`sessions.${params.reason}: ACP prepareFreshSession failed for ${params.sessionKey}: ${String(error)}`);
	}
	const now = Date.now();
	let resetMeta;
	if (params.shouldApply && !params.shouldApply()) return;
	params.assertCurrent?.();
	await require_session_meta.upsertAcpSessionMeta({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		mutate: (current) => {
			if (params.shouldApply && !params.shouldApply()) return current;
			resetMeta = buildPendingAcpMeta(current ?? latestMeta, now);
			return resetMeta;
		}
	});
	params.assertCurrent?.();
	return resetMeta;
}
async function closeChildAcpRuntimesForParent(params) {
	let children;
	try {
		if (params.shouldCleanup && !params.shouldCleanup()) return;
		params.assertCurrent?.();
		children = findDirectChildSessionsForParent({
			cfg: params.cfg,
			parentKey: params.parentKey
		}).flatMap(({ sessionKey }) => {
			return require_session_meta.readAcpSessionMeta({ sessionKey }) ? [{ sessionKey }] : [];
		});
	} catch (error) {
		require_globals.logVerbose(`sessions.${params.reason}: failed to enumerate sessions for child ACP cleanup: ${String(error)}`);
		return;
	}
	if (params.shouldCleanup && !params.shouldCleanup()) return;
	params.assertCurrent?.();
	await Promise.allSettled(children.map(({ sessionKey }) => closeAcpRuntimeForSession({
		cfg: params.cfg,
		sessionKey,
		reason: params.reason,
		assertCurrent: params.assertCurrent,
		shouldCleanup: params.shouldCleanup
	}).then((childError) => {
		if (childError) require_globals.logVerbose(`sessions.${params.reason}: child ACP cleanup incomplete for ${sessionKey}`);
	})));
	if (params.shouldCleanup && !params.shouldCleanup()) return;
	params.assertCurrent?.();
}
async function cleanupSessionBeforeMutation(params) {
	const cleanupError = await ensureSessionRuntimeCleanup({
		cfg: params.cfg,
		key: params.key,
		target: params.target,
		sessionId: params.entry?.sessionId,
		assertCurrent: params.assertCurrent
	});
	if (cleanupError) return cleanupError;
	const pluginCleanup = await require_host_hook_cleanup.runPluginHostCleanup({
		cfg: params.cfg,
		registry: require_runtime.getActivePluginRegistry(),
		reason: params.reason === "session-reset" ? "reset" : "delete",
		sessionKey: params.target.canonicalKey ?? params.key,
		shouldCleanup: () => {
			params.assertCurrent?.();
			return true;
		}
	});
	params.assertCurrent?.();
	for (const failure of pluginCleanup.failures) require_globals.logVerbose(`plugin host cleanup failed for ${failure.pluginId}/${failure.hookId}: ${String(failure.error)}`);
	const parentSessionKey = params.target.canonicalKey ?? params.canonicalKey ?? params.key;
	const parentAcpError = await closeAcpRuntimeForSession({
		cfg: params.cfg,
		sessionKey: parentSessionKey,
		fallbackSessionKeys: [
			params.canonicalKey,
			params.legacyKey,
			params.key
		],
		reason: params.reason,
		onResetMeta: params.onAcpResetMeta,
		assertCurrent: params.assertCurrent
	});
	params.assertCurrent?.();
	await closeChildAcpRuntimesForParent({
		cfg: params.cfg,
		parentKey: params.target.canonicalKey ?? params.canonicalKey ?? params.key,
		reason: params.reason,
		assertCurrent: params.assertCurrent
	});
	params.assertCurrent?.();
	if (parentAcpError) return parentAcpError;
	if (params.entry?.sessionId) {
		await require_registry.resetRegisteredAgentHarnessSessions({
			agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.target.agentId ?? require_agent_scope_config.resolveDefaultAgentId(params.cfg)),
			sessionId: params.entry.sessionId,
			sessionKey: params.target.canonicalKey ?? params.key,
			sessionFile: params.entry.sessionFile,
			reason: params.reason === "session-reset" ? "reset" : "deleted"
		});
		params.assertCurrent?.();
	}
}
async function emitGatewayBeforeResetPluginHook(params) {
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("before_reset")) return;
	const sessionKey = params.target.canonicalKey ?? params.key;
	const sessionId = params.entry?.sessionId;
	const sessionFile = params.entry?.sessionFile;
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.target.agentId ?? require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId);
	const messages = params.messages ?? await readGatewayBeforeResetPluginHookMessages({
		agentId,
		entry: params.entry,
		sessionId,
		sessionKey,
		storePath: params.storePath
	});
	hookRunner.runBeforeReset({
		sessionFile,
		messages,
		reason: params.reason
	}, {
		agentId,
		sessionKey,
		sessionId,
		workspaceDir
	}).catch((err) => {
		require_globals.logVerbose(`before_reset hook failed: ${String(err)}`);
	});
}
async function readGatewayBeforeResetPluginHookMessages(params) {
	if (typeof params.sessionId !== "string" || params.sessionId.trim().length === 0) return [];
	try {
		return await require_session_transcript_readers.readSessionMessagesAsync({
			agentId: params.agentId,
			sessionEntry: params.entry,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			storePath: params.storePath
		}, {
			mode: "full",
			reason: "before_reset hook payload"
		});
	} catch (err) {
		require_globals.logVerbose(`before_reset: failed to read session messages for ${params.sessionId}; firing hook with empty messages (${String(err)})`);
		return [];
	}
}
async function performGatewaySessionReset(params) {
	const resetTarget = (() => {
		const cfg = require_io.getRuntimeConfig();
		const explicitAgentId = params.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) : void 0;
		const parsedKey = require_session_key.parseAgentSessionKey(params.key);
		const inferredGlobalAgentId = !explicitAgentId && parsedKey && require_session_accessor.resolveSessionStoreKey({
			cfg,
			sessionKey: params.key
		}) === "global" ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsedKey.agentId) : void 0;
		const requestedAgentId = explicitAgentId ?? inferredGlobalAgentId;
		if (requestedAgentId && !require_agent_scope_config.listAgentIds(cfg).includes(requestedAgentId)) return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Unknown agent id: ${requestedAgentId}`)
		};
		if (explicitAgentId && parsedKey?.agentId && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsedKey.agentId) !== explicitAgentId) return {
			ok: false,
			error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "session key agent does not match agentId")
		};
		const target = require_session_utils.resolveGatewaySessionStoreTarget({
			cfg,
			key: params.key,
			...requestedAgentId ? { agentId: requestedAgentId } : {}
		});
		return {
			ok: true,
			cfg,
			target,
			storePath: target.storePath,
			requestedAgentId
		};
	})();
	if (!resetTarget.ok) return resetTarget;
	const initialResetEntry = require_session_utils.loadSessionEntry(params.key, resetTarget.requestedAgentId ? { agentId: resetTarget.requestedAgentId } : void 0).entry;
	const missingHarnessSessionError = require_store.resolveMissingAgentHarnessSessionError(resetTarget.target.canonicalKey, initialResetEntry);
	if (missingHarnessSessionError) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, missingHarnessSessionError)
	};
	if (require_model_overrides.isModelSelectionLocked(initialResetEntry)) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_model_overrides.MODEL_SELECTION_LOCKED_RESET_MESSAGE)
	};
	const initialPlacementBlock = initialResetEntry?.sessionId ? require_session_placement_admission.resolveSessionPlacementResetBlock(initialResetEntry.sessionId) : void 0;
	if (initialPlacementBlock) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Session ${params.key} cannot reset while ${initialPlacementBlock}.`)
	};
	const resetLifecycleIdentities = [
		resetTarget.target.canonicalKey,
		params.key,
		initialResetEntry?.sessionId
	];
	const activeLifecycleMutation = require_store.isSessionLifecycleMutationActive(resetTarget.storePath, resetLifecycleIdentities);
	const activeCompaction = require_store.hasOnlySessionLifecycleMutationKindActive(resetTarget.storePath, resetLifecycleIdentities, "compaction");
	if (activeLifecycleMutation && !activeCompaction) return {
		ok: false,
		error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Session ${params.key} has another lifecycle mutation in progress; try again.`)
	};
	let admittedWorkReleased = true;
	return await require_store.runExclusiveSessionLifecycleMutation({
		scope: resetTarget.storePath,
		identities: resetLifecycleIdentities,
		prepare: async () => {
			params.assertCurrent?.();
			admittedWorkReleased = await require_store.interruptSessionWorkAdmissions({
				scope: resetTarget.storePath,
				identities: resetLifecycleIdentities,
				timeoutMs: require_store.SESSION_WORK_ADMISSION_DRAIN_TIMEOUT_MS
			});
		},
		run: async () => {
			const { cfg, target, storePath, requestedAgentId } = resetTarget;
			if (!admittedWorkReleased) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `Session ${params.key} is still active; try again in a moment.`)
			};
			const { entry, legacyKey, canonicalKey } = require_session_utils.loadSessionEntry(params.key, requestedAgentId ? { agentId: requestedAgentId } : void 0);
			const placementBlock = entry?.sessionId ? require_session_placement_admission.resolveSessionPlacementResetBlock(entry.sessionId) : void 0;
			if (placementBlock) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `Session ${params.key} cannot reset while ${placementBlock}.`)
			};
			const archivedSessionError = require_lifecycle.resolveSessionWorkStartError(canonicalKey, entry);
			if (archivedSessionError) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, archivedSessionError)
			};
			if (require_model_overrides.isModelSelectionLocked(entry)) return {
				ok: false,
				error: require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, require_model_overrides.MODEL_SELECTION_LOCKED_RESET_MESSAGE)
			};
			const hadExistingEntry = Boolean(entry);
			const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg));
			const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId);
			const resetPluginRegistry = require_runtime.getActivePluginRegistry();
			const isResetLifecycleCurrent = () => {
				try {
					params.assertCurrent?.();
					return true;
				} catch {
					return false;
				}
			};
			let deferredAcpResetState;
			const hookEvent = require_internal_hooks.createInternalHookEvent("command", params.reason, target.canonicalKey ?? params.key, {
				sessionEntry: entry,
				previousSessionEntry: entry,
				commandSource: params.commandSource,
				cfg,
				workspaceDir
			});
			params.assertCurrent?.();
			await require_internal_hooks.triggerInternalHook(hookEvent);
			params.assertCurrent?.();
			const runtimeCleanupError = await ensureSessionRuntimeCleanup({
				cfg,
				key: params.key,
				target,
				sessionId: entry?.sessionId
			});
			if (runtimeCleanupError) return {
				ok: false,
				error: runtimeCleanupError
			};
			const parentAcpError = await closeAcpRuntimeForSession({
				cfg,
				sessionKey: target.canonicalKey ?? canonicalKey ?? params.key,
				fallbackSessionKeys: [
					canonicalKey,
					legacyKey,
					params.key
				],
				reason: "session-reset",
				deferResetState: true,
				onDeferredResetState: (state) => {
					deferredAcpResetState = state;
				}
			});
			if (parentAcpError) return {
				ok: false,
				error: parentAcpError
			};
			const pluginCleanup = await require_host_hook_cleanup.runPluginHostCleanup({
				cfg,
				registry: resetPluginRegistry,
				reason: "reset",
				sessionKey: target.canonicalKey ?? params.key,
				skipPersistentSessionState: true
			});
			for (const failure of pluginCleanup.failures) require_globals.logVerbose(`plugin host cleanup failed for ${failure.pluginId}/${failure.hookId}: ${String(failure.error)}`);
			await closeChildAcpRuntimesForParent({
				cfg,
				parentKey: target.canonicalKey ?? canonicalKey ?? params.key,
				reason: "session-reset"
			});
			if (entry?.sessionId) await require_registry.resetRegisteredAgentHarnessSessions({
				agentId,
				sessionId: entry.sessionId,
				sessionKey: target.canonicalKey ?? params.key,
				sessionFile: entry.sessionFile,
				reason: "reset"
			});
			const beforeResetMessages = require_hook_runner_global.getGlobalHookRunner()?.hasHooks("before_reset") ? await readGatewayBeforeResetPluginHookMessages({
				agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId ?? requestedAgentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg)),
				entry,
				sessionId: entry?.sessionId,
				sessionKey: target.canonicalKey ?? params.key,
				storePath
			}) : void 0;
			const lifecycle = await require_session_accessor.resetSessionEntryLifecycle({
				agentId: target.agentId,
				storePath,
				target: {
					canonicalKey: target.canonicalKey,
					storeKeys: target.storeKeys
				},
				buildNextEntry: ({ currentEntry, primaryKey }) => {
					if (!isResetLifecycleCurrent() && currentEntry?.sessionId !== entry?.sessionId) params.assertCurrent?.();
					const sessionAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_session_key.parseAgentSessionKey(primaryKey)?.agentId ?? target.agentId ?? requestedAgentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg));
					const resetPreservedSelection = require_session_reset_cleanup.resolveResetPreservedSelection({ entry: currentEntry });
					const now = Date.now();
					const nextSessionId = (0, node_crypto.randomUUID)();
					const nextEntry = {
						sessionId: nextSessionId,
						sessionFile: require_sqlite_marker.formatSqliteSessionFileMarker({
							agentId: sessionAgentId,
							sessionId: nextSessionId,
							storePath
						}),
						updatedAt: now,
						systemSent: false,
						abortedLastRun: false,
						thinkingLevel: currentEntry?.thinkingLevel,
						fastMode: currentEntry?.fastMode,
						verboseLevel: currentEntry?.verboseLevel,
						traceLevel: currentEntry?.traceLevel,
						reasoningLevel: currentEntry?.reasoningLevel,
						elevatedLevel: currentEntry?.elevatedLevel,
						ttsAuto: currentEntry?.ttsAuto,
						execHost: params.execNode ? "node" : params.clearExecBinding ? void 0 : currentEntry?.execHost,
						execSecurity: currentEntry?.execSecurity,
						execAsk: currentEntry?.execAsk,
						execNode: params.execNode ? params.execNode : params.clearExecBinding ? void 0 : currentEntry?.execNode,
						execCwd: params.execNode ? params.execCwd : params.clearExecBinding ? void 0 : currentEntry?.execCwd,
						responseUsage: currentEntry?.responseUsage,
						pinnedAt: currentEntry?.pinnedAt,
						...resetPreservedSelection,
						groupActivation: currentEntry?.groupActivation,
						groupActivationNeedsSystemIntro: currentEntry?.groupActivationNeedsSystemIntro,
						chatType: currentEntry?.chatType,
						compactionCount: currentEntry?.compactionCount,
						compactionCheckpoints: currentEntry?.compactionCheckpoints,
						sendPolicy: currentEntry?.sendPolicy,
						queueMode: currentEntry?.queueMode,
						queueDebounceMs: currentEntry?.queueDebounceMs,
						queueCap: currentEntry?.queueCap,
						queueDrop: currentEntry?.queueDrop,
						spawnedBy: currentEntry?.spawnedBy,
						spawnedWorkspaceDir: currentEntry?.spawnedWorkspaceDir,
						spawnedCwd: params.clearSpawnedCwd ? void 0 : params.spawnedCwd ?? currentEntry?.spawnedCwd,
						worktree: params.clearSpawnedCwd ? void 0 : params.worktree ?? currentEntry?.worktree,
						parentSessionKey: currentEntry?.parentSessionKey,
						forkedFromParent: currentEntry?.forkedFromParent,
						spawnDepth: currentEntry?.spawnDepth,
						subagentRole: currentEntry?.subagentRole,
						subagentControlScope: currentEntry?.subagentControlScope,
						label: currentEntry?.label,
						displayName: currentEntry?.displayName,
						channel: currentEntry?.channel,
						groupId: currentEntry?.groupId,
						subject: currentEntry?.subject,
						groupChannel: currentEntry?.groupChannel,
						space: currentEntry?.space,
						origin: require_session_accessor.snapshotSessionOrigin(currentEntry),
						deliveryContext: currentEntry?.deliveryContext,
						cliSessionBindings: currentEntry?.cliSessionBindings,
						cliSessionIds: currentEntry?.cliSessionIds,
						claudeCliSessionId: currentEntry?.claudeCliSessionId,
						lastChannel: currentEntry?.lastChannel,
						lastTo: currentEntry?.lastTo,
						lastAccountId: currentEntry?.lastAccountId,
						lastThreadId: currentEntry?.lastThreadId,
						inputTokens: 0,
						outputTokens: 0,
						totalTokens: 0,
						totalTokensFresh: true
					};
					if (!require_session_key.isSubagentSessionKey(primaryKey)) require_cli_session.clearAllCliSessions(nextEntry);
					else nextEntry.cliSessionBindings = require_cli_session_binding.rebindCliSessionReseedReceiptsForReset(nextEntry.cliSessionBindings, nextSessionId);
					return nextEntry;
				},
				afterEntryMutation: async (mutation) => {
					let committedAcpResetState;
					if (deferredAcpResetState) {
						const identity = deferredAcpResetState.meta.identity;
						if (identity?.state === "resolved" && (identity.acpxSessionId || identity.agentSessionId)) {
							committedAcpResetState = {
								sessionKey: deferredAcpResetState.sessionKey,
								meta: buildPendingAcpMeta(deferredAcpResetState.meta, Date.now())
							};
							require_session_meta.writeAcpSessionMetaForMigration({
								sessionKey: committedAcpResetState.sessionKey,
								sessionId: mutation.nextEntry.sessionId,
								meta: committedAcpResetState.meta
							});
						}
					}
					params.onCommitted?.({
						key: target.canonicalKey,
						sessionId: mutation.nextEntry.sessionId
					});
					if (committedAcpResetState && isResetLifecycleCurrent()) try {
						await require_registry$1.getAcpRuntimeBackend((committedAcpResetState.meta.backend || cfg.acp?.backend || "").trim() || void 0)?.runtime.prepareFreshSession?.({ sessionKey: committedAcpResetState.sessionKey });
					} catch (error) {
						require_globals.logVerbose(`sessions.session-reset: ACP prepareFreshSession failed for ${committedAcpResetState.sessionKey}: ${String(error)}`);
					}
					await emitGatewayBeforeResetPluginHook({
						cfg,
						key: params.key,
						messages: beforeResetMessages,
						target,
						storePath,
						entry: mutation.previousEntry,
						reason: params.reason
					});
				}
			});
			require_session_state_events.handleSessionStateSessionReset(target.canonicalKey ?? params.key);
			const next = lifecycle.nextEntry;
			const selectedModel = require_session_model_ref.resolveSessionModelRef(cfg, next, target.agentId);
			const resolved = {
				modelProvider: selectedModel.provider,
				model: selectedModel.model
			};
			const responseEntry = {
				...next,
				modelProvider: resolved.modelProvider,
				model: resolved.model
			};
			const oldSessionId = lifecycle.previousSessionId;
			const oldSessionFile = lifecycle.previousSessionFile;
			const archivedTranscripts = lifecycle.archivedTranscripts;
			emitGatewaySessionEndPluginHook({
				cfg,
				sessionKey: target.canonicalKey ?? params.key,
				sessionId: oldSessionId,
				storePath,
				sessionFile: oldSessionFile,
				agentId: target.agentId,
				reason: params.reason,
				archivedTranscripts,
				nextSessionId: next.sessionId
			});
			emitGatewaySessionStartPluginHook({
				cfg,
				sessionKey: target.canonicalKey ?? params.key,
				sessionId: next.sessionId,
				resumedFrom: oldSessionId,
				storePath,
				sessionFile: next.sessionFile,
				agentId: target.agentId
			});
			if (hadExistingEntry) await emitSessionUnboundLifecycleEvent({
				targetSessionKey: target.canonicalKey ?? params.key,
				reason: "session-reset"
			});
			return {
				ok: true,
				key: target.canonicalKey,
				entry: responseEntry,
				resolved,
				agentId: target.agentId,
				storePath
			};
		}
	});
}
//#endregion
Object.defineProperty(exports, "archiveSessionTranscriptsForSessionDetailed", {
	enumerable: true,
	get: function() {
		return archiveSessionTranscriptsForSessionDetailed;
	}
});
Object.defineProperty(exports, "cleanupSessionBeforeMutation", {
	enumerable: true,
	get: function() {
		return cleanupSessionBeforeMutation;
	}
});
Object.defineProperty(exports, "drainActiveSessionsForShutdown", {
	enumerable: true,
	get: function() {
		return drainActiveSessionsForShutdown;
	}
});
Object.defineProperty(exports, "emitGatewayBeforeResetPluginHook", {
	enumerable: true,
	get: function() {
		return emitGatewayBeforeResetPluginHook;
	}
});
Object.defineProperty(exports, "emitGatewaySessionEndPluginHook", {
	enumerable: true,
	get: function() {
		return emitGatewaySessionEndPluginHook;
	}
});
Object.defineProperty(exports, "emitGatewaySessionStartPluginHook", {
	enumerable: true,
	get: function() {
		return emitGatewaySessionStartPluginHook;
	}
});
Object.defineProperty(exports, "emitSessionUnboundLifecycleEvent", {
	enumerable: true,
	get: function() {
		return emitSessionUnboundLifecycleEvent;
	}
});
Object.defineProperty(exports, "performGatewaySessionReset", {
	enumerable: true,
	get: function() {
		return performGatewaySessionReset;
	}
});
