const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_session_transcript_files_fs = require("./session-transcript-files.fs-DYt0TgFR.cjs");
const require_exec_defaults = require("./exec-defaults-DvQXwpzS.cjs");
const require_session_hooks = require("./session-hooks-Hjqs8fIk.cjs");
const require_remote = require("./remote-Dds9m5_I.cjs");
const require_session_snapshot = require("./session-snapshot-BR4feGxF.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/auto-reply/reply/session-updates.ts
/** Session update helpers for skill snapshots, compaction, and lifecycle hooks. */
async function persistSessionEntryUpdate(params) {
	if (!params.sessionEntryHandle && (!params.sessionStore || !params.sessionKey)) return;
	if (!params.storePath || !params.sessionKey) {
		if (params.sessionEntryHandle) params.sessionEntryHandle.replaceCurrent(params.nextEntry);
		else if (params.sessionStore && params.sessionKey) params.sessionStore[params.sessionKey] = {
			...params.sessionStore[params.sessionKey],
			...params.nextEntry
		};
		return params.nextEntry;
	}
	const persistedEntry = await require_session_accessor.updateSessionEntry({
		storePath: params.storePath,
		sessionKey: params.sessionKey
	}, (entry) => entry.sessionId === params.expectedSessionId ? params.updates : null);
	if (persistedEntry) {
		if (params.sessionEntryHandle) params.sessionEntryHandle.replaceCurrent(persistedEntry);
		else if (params.sessionStore && params.sessionKey) params.sessionStore[params.sessionKey] = persistedEntry;
		return persistedEntry;
	}
	params.sessionEntryHandle?.clearCurrent();
	if (params.sessionStore && params.sessionKey) delete params.sessionStore[params.sessionKey];
}
function emitCompactionSessionLifecycleHooks(params) {
	if (params.previousEntry.sessionId) require_session_hooks.forgetActiveSessionForShutdown(params.previousEntry.sessionId);
	if (params.nextEntry.sessionId && params.storePath) require_session_hooks.noteActiveSessionForShutdown({
		cfg: params.cfg,
		sessionKey: params.sessionKey,
		sessionId: params.nextEntry.sessionId,
		storePath: params.storePath,
		sessionFile: params.nextEntry.sessionFile,
		agentId: require_session_key.resolveAgentIdFromSessionKey(params.sessionKey)
	});
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner) return;
	if (hookRunner.hasHooks("session_end")) {
		const transcript = require_session_transcript_files_fs.resolveStableSessionEndTranscript({
			sessionId: params.previousEntry.sessionId,
			storePath: params.storePath,
			sessionFile: params.previousEntry.sessionFile,
			agentId: require_session_key.resolveAgentIdFromSessionKey(params.sessionKey)
		});
		const payload = require_session_hooks.buildSessionEndHookPayload({
			sessionId: params.previousEntry.sessionId,
			sessionKey: params.sessionKey,
			cfg: params.cfg,
			reason: "compaction",
			sessionFile: transcript.sessionFile,
			transcriptArchived: transcript.transcriptArchived,
			nextSessionId: params.nextEntry.sessionId
		});
		require_gateway_work_admission.runWithGatewayIndependentRootWorkContinuation(async () => {
			await hookRunner.runSessionEnd(payload.event, payload.context);
		}).catch((err) => {
			require_globals.logVerbose(`session_end hook failed: ${String(err)}`);
		});
	}
	if (hookRunner.hasHooks("session_start")) {
		const payload = require_session_hooks.buildSessionStartHookPayload({
			sessionId: params.nextEntry.sessionId,
			sessionKey: params.sessionKey,
			cfg: params.cfg,
			resumedFrom: params.previousEntry.sessionId
		});
		require_gateway_work_admission.runWithGatewayIndependentRootWorkContinuation(async () => {
			await hookRunner.runSessionStart(payload.event, payload.context);
		}).catch((err) => {
			require_globals.logVerbose(`session_start hook failed: ${String(err)}`);
		});
	}
}
function resolveNonNegativeTokenCount(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : void 0;
}
/** Ensures a session entry has the reusable skill snapshot needed for reply runs. */
async function ensureSkillSnapshot(params) {
	if (process.env.OPERATOR_TEST_FAST === "1") return {
		sessionEntry: params.sessionEntry,
		skillsSnapshot: params.sessionEntry?.skillsSnapshot,
		systemSent: params.sessionEntry?.systemSent ?? false
	};
	const { sessionEntry, sessionEntryHandle, sessionStore, sessionKey, storePath, sessionId, isFirstTurnInSession, workspaceDir, cfg, skillFilter } = params;
	let nextEntry = sessionEntryHandle?.getCurrent() ?? sessionEntry;
	let systemSent = sessionEntry?.systemSent ?? false;
	const sessionAgentId = require_agent_scope.resolveSessionAgentId({
		sessionKey,
		config: cfg
	});
	const nodeSkillsEligibility = require_exec_defaults.resolveNodeExecEligibility({
		cfg,
		sessionEntry,
		sessionKey,
		agentId: sessionAgentId,
		execOverrides: params.execOverrides
	});
	const remoteEligibility = require_remote.getRemoteSkillEligibility({ advertiseExecNode: nodeSkillsEligibility.canExec });
	const existingSnapshot = nextEntry?.skillsSnapshot;
	const resolveSnapshot = (snapshot) => require_session_snapshot.resolveReusableWorkspaceSkillSnapshot({
		workspaceDir,
		config: cfg,
		agentId: sessionAgentId,
		skillFilter,
		eligibility: {
			nodeSkills: nodeSkillsEligibility,
			remote: remoteEligibility
		},
		existingSnapshot: snapshot
	});
	const initialSnapshotState = resolveSnapshot(existingSnapshot);
	const shouldRefreshSnapshot = initialSnapshotState.shouldRefresh;
	if (isFirstTurnInSession && (sessionEntryHandle || sessionStore) && sessionKey) {
		const current = nextEntry ?? sessionEntryHandle?.get(sessionKey) ?? sessionStore?.[sessionKey] ?? {
			sessionId: sessionId ?? node_crypto.default.randomUUID(),
			updatedAt: Date.now()
		};
		const skillSnapshot = !current.skillsSnapshot || shouldRefreshSnapshot ? initialSnapshotState.snapshot : resolveSnapshot(current.skillsSnapshot).snapshot;
		nextEntry = {
			...current,
			sessionId: sessionId ?? current.sessionId ?? node_crypto.default.randomUUID(),
			updatedAt: Date.now(),
			systemSent: true,
			skillsSnapshot: skillSnapshot
		};
		const persistedEntry = await persistSessionEntryUpdate({
			expectedSessionId: current.sessionId,
			sessionEntryHandle,
			sessionStore,
			sessionKey,
			storePath,
			nextEntry,
			updates: {
				sessionId: nextEntry.sessionId,
				updatedAt: nextEntry.updatedAt,
				systemSent: nextEntry.systemSent,
				skillsSnapshot: nextEntry.skillsSnapshot
			}
		});
		nextEntry = persistedEntry;
		systemSent = persistedEntry?.systemSent ?? systemSent;
	}
	const skillsSnapshot = Boolean(nextEntry?.skillsSnapshot) && (nextEntry?.skillsSnapshot !== existingSnapshot || !shouldRefreshSnapshot) && nextEntry?.skillsSnapshot ? resolveSnapshot(nextEntry.skillsSnapshot).snapshot : shouldRefreshSnapshot || !nextEntry?.skillsSnapshot ? initialSnapshotState.snapshot : resolveSnapshot(nextEntry.skillsSnapshot).snapshot;
	if (skillsSnapshot && (sessionEntryHandle || sessionStore) && sessionKey && !isFirstTurnInSession && (!nextEntry?.skillsSnapshot || shouldRefreshSnapshot)) {
		const current = nextEntry ?? {
			sessionId: sessionId ?? node_crypto.default.randomUUID(),
			updatedAt: Date.now()
		};
		nextEntry = {
			...current,
			sessionId: sessionId ?? current.sessionId ?? node_crypto.default.randomUUID(),
			updatedAt: Date.now(),
			skillsSnapshot
		};
		nextEntry = await persistSessionEntryUpdate({
			expectedSessionId: current.sessionId,
			sessionEntryHandle,
			sessionStore,
			sessionKey,
			storePath,
			nextEntry,
			updates: {
				sessionId: nextEntry.sessionId,
				updatedAt: nextEntry.updatedAt,
				skillsSnapshot: nextEntry.skillsSnapshot
			}
		});
	}
	return {
		sessionEntry: nextEntry,
		skillsSnapshot,
		systemSent
	};
}
/** Increments compaction count and persists the updated session entry. */
async function incrementCompactionCount(params) {
	const { sessionEntry, sessionStore, sessionKey, storePath, cfg, now = Date.now(), amount = 1, tokensAfter, newSessionId, newSessionFile } = params;
	if (!sessionStore || !sessionKey) return;
	const entry = sessionStore[sessionKey] ?? sessionEntry;
	if (!entry) return;
	const incrementBy = Math.max(0, amount);
	const nextCount = (entry.compactionCount ?? 0) + incrementBy;
	const updates = {
		compactionCount: nextCount,
		updatedAt: now
	};
	const explicitNewSessionFile = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(newSessionFile);
	const sessionIdChanged = Boolean(newSessionId && newSessionId !== entry.sessionId);
	const sessionFileChanged = Boolean(explicitNewSessionFile && explicitNewSessionFile !== entry.sessionFile);
	if (sessionIdChanged && newSessionId) {
		updates.sessionId = newSessionId;
		updates.sessionFile = explicitNewSessionFile ?? require_sessions.resolveCompactionSessionFile({
			entry,
			sessionKey,
			storePath,
			newSessionId
		});
		updates.usageFamilyKey = entry.usageFamilyKey ?? sessionKey;
		updates.usageFamilySessionIds = Array.from(/* @__PURE__ */ new Set([
			...entry.usageFamilySessionIds ?? [],
			entry.sessionId,
			newSessionId
		]));
	} else if (sessionFileChanged && explicitNewSessionFile) updates.sessionFile = explicitNewSessionFile;
	const tokensAfterCompaction = resolveNonNegativeTokenCount(tokensAfter);
	if (tokensAfterCompaction !== void 0) {
		updates.totalTokens = tokensAfterCompaction;
		updates.totalTokensFresh = true;
		updates.inputTokens = void 0;
		updates.outputTokens = void 0;
		updates.cacheRead = void 0;
		updates.cacheWrite = void 0;
	} else if (incrementBy > 0) updates.totalTokensFresh = false;
	const nextEntry = {
		...entry,
		...updates
	};
	sessionStore[sessionKey] = nextEntry;
	if (storePath) {
		const persistedEntry = await require_session_accessor.patchSessionEntry({
			storePath,
			sessionKey
		}, () => updates, { fallbackEntry: nextEntry });
		if (persistedEntry) sessionStore[sessionKey] = persistedEntry;
	}
	if ((sessionIdChanged || sessionFileChanged) && cfg) emitCompactionSessionLifecycleHooks({
		cfg,
		sessionKey,
		storePath,
		previousEntry: entry,
		nextEntry: sessionStore[sessionKey]
	});
	return nextCount;
}
//#endregion
Object.defineProperty(exports, "ensureSkillSnapshot", {
	enumerable: true,
	get: function() {
		return ensureSkillSnapshot;
	}
});
Object.defineProperty(exports, "incrementCompactionCount", {
	enumerable: true,
	get: function() {
		return incrementCompactionCount;
	}
});
