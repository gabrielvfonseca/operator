const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_paths$1 = require("./paths-DsfW3Lup.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_session_dirs = require("./session-dirs-CZJH_seJ.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_transcript = require("./transcript-BHT2QzlI.cjs");
const require_send_policy = require("./send-policy-4PnHfY3z.cjs");
require("./code-mode-control-tools-DFxwLnU6.cjs");
const require_message_action_turn_capability = require("./message-action-turn-capability-BDaT1ykL.cjs");
const require_run_state = require("./run-state-lPLPf1ME.cjs");
const require_user_turn_transcript = require("./user-turn-transcript-Dn526zAI.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_pending_final_delivery = require("./pending-final-delivery-eW02u6f_.cjs");
const require_runtime_plugins = require("./runtime-plugins-Cv0iqeLD.cjs");
const require_restart_recovery_hook_safety = require("./restart-recovery-hook-safety-kW4ec5ub.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/agents/main-session-restart-claim.ts
function matchesExpectedRestartRecoveryClaim(entry, expected) {
	return Boolean(entry && entry.sessionId === expected.sessionId && entry.status === "running" && entry.abortedLastRun === true && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliveryRunId) === expected.recoveryRunId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId) === expected.recoverySourceRunId);
}
function loadExpectedRestartRecoveryClaim(params) {
	const exact = require_session_accessor.loadExactSessionEntry({
		readConsistency: "latest",
		sessionKey: params.expected.sessionKey,
		storePath: params.storePath
	});
	return exact?.sessionKey === params.expected.sessionKey && matchesExpectedRestartRecoveryClaim(exact.entry, params.expected) ? exact.entry : void 0;
}
function buildUnresumableSessionNoticeIdempotencyKey(entry) {
	return `main-session-restart-recovery:${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliveryRunId) ?? entry.sessionId}:failed-notice`;
}
//#endregion
//#region src/agents/main-session-restart-dispatch.ts
const log$1 = require_subsystem.createSubsystemLogger("main-session-restart-recovery");
const RESTART_RECOVERY_RESUME_MESSAGE = "[System] Your previous turn was interrupted by a gateway restart while Operator was waiting on tool/model work. Continue from the existing transcript and finish the interrupted response.";
function normalizeFiniteTimestamp$1(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function hasRestartRecoveryMessageActionAuthority(entry) {
	const authority = require_store.resolveRestartRecoveryChannelAuthority(entry);
	return authority !== void 0 && require_message_action_turn_capability.isTrustedMessageActionTurnIngress(authority.deliveryContext.channel);
}
/** Internal continuations never inherit channel authority; every other message-tool recovery must. */
function requiresRestartRecoveryMessageActionAuthority(entry) {
	return entry.restartRecoverySourceReplyDeliveryMode === "message_tool_only" && entry.restartRecoverySourceIngress !== "internal";
}
function resolveRestartRecoveryResumeBlockReason(params) {
	const beforeAgentReplyState = params.entry.restartRecoveryBeforeAgentReplyState;
	const sourceIngress = params.entry.restartRecoverySourceIngress;
	if (!(sourceIngress === void 0 && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.restartRecoveryDeliveryRunId) !== void 0 || beforeAgentReplyState === "admitted" || beforeAgentReplyState === "continue" || beforeAgentReplyState === "handled-reply" || sourceIngress === "channel" || sourceIngress === "control-ui")) return;
	if (!params.cfg) return "pre-hook recovery runtime config is unavailable";
	try {
		const agentId = require_session_key.resolveAgentIdFromSessionKey(params.sessionKey);
		require_runtime_plugins.ensureRuntimePluginsLoaded({
			config: params.cfg,
			workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, agentId),
			allowGatewaySubagentBinding: true
		});
	} catch {
		return "pre-hook recovery runtime plugins could not be loaded";
	}
	const unsafeHook = require_restart_recovery_hook_safety.findRestartRecoveryUnsafeReplyHook();
	return unsafeHook ? `pre-hook recovery cannot bypass the active ${unsafeHook} hook` : void 0;
}
function buildResumeMessage(pendingFinalDeliveryText) {
	const sanitizedPendingText = typeof pendingFinalDeliveryText === "string" ? require_pending_final_delivery.sanitizePendingFinalDeliveryText(pendingFinalDeliveryText) : "";
	if (sanitizedPendingText) return `${RESTART_RECOVERY_RESUME_MESSAGE}\n\nNote: The interrupted final reply was captured: "${sanitizedPendingText}"`;
	return RESTART_RECOVERY_RESUME_MESSAGE;
}
function resolveRestartRecoveryDeliveryContext(params) {
	const activeRunDeliveryContext = require_delivery_context_shared.normalizeDeliveryContext(params.entry.restartRecoveryDeliveryContext);
	const hasActiveRunDeliveryClaim = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.restartRecoveryDeliveryRunId) !== void 0;
	const deliveryContext = require_delivery_context_shared.normalizeDeliveryContext(params.entry.pendingFinalDeliveryContext) ?? activeRunDeliveryContext ?? (params.includeSessionDeliveryFallback && !hasActiveRunDeliveryClaim ? require_delivery_context_shared.deliveryContextFromSession(params.entry) : void 0);
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(deliveryContext?.channel);
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(deliveryContext?.to);
	if (!channel || !to || !require_message_channel.isDeliverableMessageChannel(channel)) return;
	if (params.cfg && require_send_policy.resolveSendPolicy({
		cfg: params.cfg,
		entry: params.entry,
		sessionKey: params.sessionKey,
		channel,
		chatType: params.entry.chatType
	}) === "deny") return;
	return {
		...deliveryContext,
		channel,
		to
	};
}
function normalizeRestartRecoveryTerminalStatus(value) {
	return value === "error" || value === "ok" || value === "timeout" ? value : void 0;
}
async function probeRestartRecoveryTerminalStatus(runId, gatewayRuntime) {
	try {
		const result = await gatewayRuntime.waitForAgent({
			runId,
			timeoutMs: 0
		}, 2e3);
		const status = normalizeRestartRecoveryTerminalStatus(result.status);
		return status === "timeout" && typeof result.endedAt !== "number" ? void 0 : status;
	} catch {
		return;
	}
}
async function settleRestartRecoveryDispatch(params) {
	await require_session_accessor.applySessionEntryReplacements({
		sessionKeys: params.sessionKeys,
		storePath: params.storePath,
		update: (entries) => {
			const current = entries.filter(({ entry }) => entry.sessionId === params.expectedSessionId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliveryRunId) === params.expectedRecoveryRunId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId) === params.expectedRecoverySourceRunId).toSorted((a, b) => (b.entry.updatedAt ?? 0) - (a.entry.updatedAt ?? 0))[0];
			if (!current) return { result: void 0 };
			const entry = current.entry;
			const now = Date.now();
			if (params.terminalStatus) {
				entry.abortedLastRun = params.terminalStatus !== "ok";
				entry.status = params.terminalStatus === "ok" ? "done" : params.terminalStatus === "timeout" ? "timeout" : "failed";
				entry.endedAt = now;
				const startedAt = normalizeFiniteTimestamp$1(entry.startedAt);
				if (startedAt !== void 0) entry.runtimeMs = Math.max(0, now - startedAt);
				entry.restartRecoveryForceSafeTools = void 0;
				Object.assign(entry, require_store.buildRestartRecoveryClaimCleanupPatch({
					entry,
					recordTerminalSource: true,
					terminalSourceRunId: params.expectedRecoverySourceRunId
				}));
			} else entry.abortedLastRun = false;
			entry.updatedAt = now;
			if (entry.pendingFinalDelivery || entry.pendingFinalDeliveryText) if (params.pendingFinalDeliveryText) {
				entry.pendingFinalDeliveryLastAttemptAt = now;
				entry.pendingFinalDeliveryAttemptCount = (entry.pendingFinalDeliveryAttemptCount ?? 0) + 1;
				entry.pendingFinalDeliveryLastError = null;
				entry.pendingFinalDeliveryText = params.pendingFinalDeliveryText;
			} else {
				entry.pendingFinalDelivery = void 0;
				entry.pendingFinalDeliveryText = void 0;
				entry.pendingFinalDeliveryCreatedAt = void 0;
				entry.pendingFinalDeliveryLastAttemptAt = void 0;
				entry.pendingFinalDeliveryAttemptCount = void 0;
				entry.pendingFinalDeliveryLastError = void 0;
				entry.pendingFinalDeliveryContext = void 0;
			}
			return {
				result: void 0,
				replacements: [{
					sessionKey: current.sessionKey,
					entry
				}]
			};
		}
	});
}
async function resumeMainSession(params) {
	const sanitizedPendingText = typeof params.pendingFinalDeliveryText === "string" ? require_pending_final_delivery.sanitizePendingFinalDeliveryText(params.pendingFinalDeliveryText) : "";
	const deliveryContext = resolveRestartRecoveryDeliveryContext({
		cfg: params.cfg,
		entry: params.entry,
		sessionKey: params.sessionKey
	});
	const claimedRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.restartRecoveryDeliveryRunId);
	const sourceRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.restartRecoveryDeliverySourceRunId);
	if (requiresRestartRecoveryMessageActionAuthority(params.entry) && !hasRestartRecoveryMessageActionAuthority(params.entry)) {
		log$1.warn(`refusing message-tool-only recovery without channel authority: ${params.sessionKey}`);
		return false;
	}
	const recoveryRunId = claimedRunId && claimedRunId !== sourceRunId ? claimedRunId : (0, node_crypto.randomUUID)();
	const reusingRecoveryRunId = recoveryRunId === claimedRunId;
	const dispatchSessionKey = params.canonicalSessionKey ?? params.sessionKey;
	const recoverySessionKeys = Array.from(/* @__PURE__ */ new Set([dispatchSessionKey, params.sessionKey]));
	let dispatchOutcomeUnknown = false;
	try {
		if (!await require_session_accessor.applySessionEntryReplacements({
			sessionKeys: [params.sessionKey],
			storePath: params.storePath,
			update: (entries) => {
				const entry = entries.find((entry) => entry.sessionKey === params.sessionKey)?.entry;
				if (!entry || entry.sessionId !== params.entry.sessionId || entry.status !== "running" || entry.abortedLastRun !== true || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliveryRunId) !== claimedRunId || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId) !== sourceRunId) return { result: false };
				entry.restartRecoveryDeliveryRunId = recoveryRunId;
				if (params.forceRestartSafeTools) entry.restartRecoveryForceSafeTools = true;
				entry.updatedAt = Date.now();
				return {
					result: true,
					replacements: [{
						sessionKey: params.sessionKey,
						entry
					}]
				};
			}
		})) throw new Error("restart recovery session ownership changed before dispatch");
		const agentParams = {
			message: buildResumeMessage(sanitizedPendingText),
			sessionKey: dispatchSessionKey,
			expectedExistingSessionId: params.entry.sessionId,
			...params.sessionWorkAdmissionHandoffId ? { internalRuntimeHandoffId: params.sessionWorkAdmissionHandoffId } : {},
			idempotencyKey: recoveryRunId,
			deliver: Boolean(deliveryContext) && params.entry.restartRecoverySourceReplyDeliveryMode !== "message_tool_only",
			lane: "main",
			...params.entry.restartRecoverySourceReplyDeliveryMode ? { sourceReplyDeliveryMode: params.entry.restartRecoverySourceReplyDeliveryMode } : {},
			...params.forceRestartSafeTools ? { forceRestartSafeTools: true } : {}
		};
		if (deliveryContext) {
			agentParams.channel = deliveryContext.channel;
			agentParams.to = deliveryContext.to;
			agentParams.bestEffortDeliver = true;
			if (deliveryContext.accountId) agentParams.accountId = deliveryContext.accountId;
			if (deliveryContext.threadId != null) agentParams.threadId = String(deliveryContext.threadId);
		}
		if (params.forceRestartSafeTools) log$1.info(`dispatching restart-safe recovery for ${params.sessionKey}`);
		dispatchOutcomeUnknown = true;
		const dispatchResult = await params.gatewayRuntime.dispatchAgent(agentParams, 1e4);
		dispatchOutcomeUnknown = false;
		let terminalStatus = normalizeRestartRecoveryTerminalStatus(dispatchResult.status);
		if (!terminalStatus && reusingRecoveryRunId && dispatchResult.status === "accepted") terminalStatus = await probeRestartRecoveryTerminalStatus(recoveryRunId, params.gatewayRuntime);
		await settleRestartRecoveryDispatch({
			expectedRecoveryRunId: recoveryRunId,
			expectedRecoverySourceRunId: sourceRunId,
			expectedSessionId: params.entry.sessionId,
			pendingFinalDeliveryText: sanitizedPendingText,
			sessionKeys: recoverySessionKeys,
			storePath: params.storePath,
			terminalStatus
		});
		log$1.info(`resumed interrupted main session: ${params.sessionKey}${sanitizedPendingText ? " (with pending payload)" : ""}`);
		return true;
	} catch (error) {
		if (reusingRecoveryRunId && dispatchOutcomeUnknown) {
			const terminalStatus = await probeRestartRecoveryTerminalStatus(recoveryRunId, params.gatewayRuntime);
			if (terminalStatus) {
				await settleRestartRecoveryDispatch({
					expectedRecoveryRunId: recoveryRunId,
					expectedRecoverySourceRunId: sourceRunId,
					expectedSessionId: params.entry.sessionId,
					pendingFinalDeliveryText: sanitizedPendingText,
					sessionKeys: recoverySessionKeys,
					storePath: params.storePath,
					terminalStatus
				});
				log$1.info(`settled completed restart recovery for ${params.sessionKey}`);
				return true;
			}
		}
		log$1.warn(`failed to resume interrupted main session ${params.sessionKey}: ${String(error)}`);
		return false;
	}
}
//#endregion
//#region src/agents/main-session-restart-recovery.ts
/**
* Post-restart recovery for main sessions interrupted while holding a transcript lock.
*/
const log = require_subsystem.createSubsystemLogger("main-session-restart-recovery");
const DEFAULT_RECOVERY_DELAY_MS = 5e3;
const MAX_RECOVERY_RETRIES = 3;
const RETRY_BACKOFF_MULTIPLIER = 2;
const UNRESUMABLE_SESSION_NOTICE = "I was interrupted by a gateway restart and couldn't safely resume the previous turn. Please send that last request again and I'll pick it up cleanly.";
function shouldSkipMainRecovery(entry, sessionKey) {
	if (typeof entry.spawnDepth === "number" && entry.spawnDepth > 0) return true;
	if (entry.subagentRole != null) return true;
	return require_session_key.isSubagentSessionKey(sessionKey) || require_session_key.isCronSessionKey(sessionKey) || require_session_key.isAcpSessionKey(sessionKey);
}
function normalizeStringSet(values) {
	const normalized = /* @__PURE__ */ new Set();
	for (const value of values ?? []) {
		const trimmed = value.trim();
		if (trimmed) normalized.add(trimmed);
	}
	return normalized;
}
function normalizeFiniteTimestamp(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function hasCurrentProcessOwner(params) {
	if (params.activeSessionIds.has(params.entry.sessionId)) return true;
	return params.activeSessionIds.size === 0 && params.activeSessionKeys.has(params.sessionKey);
}
function normalizeTranscriptLockPath(lockPath) {
	const trimmed = lockPath.trim();
	if (!node_path.default.basename(trimmed).endsWith(".jsonl.lock")) return;
	const resolved = node_path.default.resolve(trimmed);
	try {
		return node_path.default.join(node_fs.default.realpathSync(node_path.default.dirname(resolved)), node_path.default.basename(resolved));
	} catch {
		return resolved;
	}
}
function resolveEntryTranscriptLockPaths(params) {
	const paths = /* @__PURE__ */ new Set();
	const push = (resolvePath) => {
		try {
			paths.add(node_path.default.resolve(`${resolvePath()}.lock`));
		} catch {}
	};
	push(() => require_paths$1.resolveSessionFilePath(params.entry.sessionId, params.entry, { sessionsDir: params.sessionsDir }));
	push(() => require_paths$1.resolveSessionTranscriptPathInDir(params.entry.sessionId, params.sessionsDir));
	return [...paths];
}
async function markRestartAbortedMainSessions(params) {
	const sessionKeys = normalizeStringSet(params.sessionKeys);
	const sessionIds = normalizeStringSet(params.sessionIds);
	const preferSessionIdMatch = sessionIds.size > 0;
	const activeRuns = [...params.activeRuns ?? []].map((run) => ({
		runId: run.runId.trim(),
		lifecycleGeneration: run.lifecycleGeneration.trim(),
		sessionKey: run.sessionKey.trim(),
		sessionId: run.sessionId.trim(),
		observedAt: normalizeFiniteTimestamp(run.observedAt)
	})).filter((run) => run.runId && run.lifecycleGeneration && (run.sessionKey || run.sessionId));
	const currentLifecycleGeneration = require_agent_events.getAgentEventLifecycleGeneration();
	const result = {
		marked: 0,
		skipped: 0
	};
	if (sessionKeys.size === 0 && sessionIds.size === 0) return result;
	const storePaths = /* @__PURE__ */ new Set();
	const env = params.stateDir === void 0 ? process.env : {
		...process.env,
		OPERATOR_STATE_DIR: params.stateDir
	};
	const stateDir = require_paths.resolveStateDir(env);
	const configs = [params.cfg, ...params.additionalCfgs ?? []].filter((cfg) => Boolean(cfg));
	for (const cfg of configs) {
		try {
			for (const target of require_targets.resolveAllAgentSessionStoreTargetsSync(cfg, { env })) storePaths.add(node_path.default.resolve(target.storePath));
		} catch (err) {
			log.warn(`failed to resolve configured session stores for restart marker: ${String(err)}`);
		}
		for (const sessionKey of sessionKeys) try {
			const target = require_session_utils.resolveGatewaySessionStoreTarget({
				cfg,
				key: sessionKey
			});
			storePaths.add(node_path.default.resolve(target.storePath));
			for (const storeKey of target.storeKeys) {
				const trimmed = storeKey.trim();
				if (trimmed) sessionKeys.add(trimmed);
			}
		} catch (err) {
			log.warn(`failed to resolve session store for restart marker ${sessionKey}: ${String(err)}`);
		}
	}
	for (const sessionsDir of await require_session_dirs.resolveAgentSessionDirs(stateDir)) storePaths.add(node_path.default.join(sessionsDir, "sessions.json"));
	for (const storePath of storePaths) {
		const storeResult = await require_session_accessor.applySessionEntryReplacements({
			storePath,
			requireWriteSuccess: true,
			update: (entries) => {
				const replacements = [];
				const counts = {
					marked: 0,
					skipped: 0
				};
				for (const { sessionKey, entry } of entries) {
					const registeredActiveRuns = require_agent_events.listAgentRunsForSession({
						sessionKey,
						sessionId: entry.sessionId
					});
					const matchingActiveRuns = activeRuns.filter((run) => (run.sessionId ? run.sessionId === entry.sessionId : run.sessionKey === sessionKey) && (entry.status === "running" || run.observedAt === void 0 || normalizeFiniteTimestamp(entry.updatedAt) === void 0 || entry.updatedAt < run.observedAt && run.lifecycleGeneration !== currentLifecycleGeneration) && params.isActiveRun?.(run) !== false);
					if (entry.status !== "running" && matchingActiveRuns.length === 0 && registeredActiveRuns.length === 0) continue;
					if (!(typeof entry.sessionId === "string" && sessionIds.has(entry.sessionId) ? true : !preferSessionIdMatch && sessionKeys.has(sessionKey))) continue;
					if (shouldSkipMainRecovery(entry, sessionKey)) {
						counts.skipped++;
						continue;
					}
					const wasRunning = entry.status === "running";
					entry.status = "running";
					entry.abortedLastRun = true;
					if (!wasRunning) {
						entry.startedAt = void 0;
						entry.endedAt = void 0;
						entry.runtimeMs = void 0;
					}
					const recoveryRuns = /* @__PURE__ */ new Map();
					for (const run of entry.restartRecoveryRuns ?? []) if (run.lifecycleGeneration === currentLifecycleGeneration) recoveryRuns.set(`${run.runId}\u0000${run.lifecycleGeneration}`, run);
					const replaceActiveRunMarker = (run) => {
						for (const [key, existingRun] of recoveryRuns) if (existingRun.runId === run.runId) recoveryRuns.delete(key);
						recoveryRuns.set(`${run.runId}\u0000${run.lifecycleGeneration}`, run);
					};
					for (const run of registeredActiveRuns) replaceActiveRunMarker(run);
					for (const run of matchingActiveRuns) replaceActiveRunMarker({
						runId: run.runId,
						lifecycleGeneration: run.lifecycleGeneration
					});
					entry.restartRecoveryRuns = [...recoveryRuns.values()].toSorted((a, b) => a.runId === b.runId ? a.lifecycleGeneration.localeCompare(b.lifecycleGeneration) : a.runId.localeCompare(b.runId));
					entry.updatedAt = Date.now();
					replacements.push({
						sessionKey,
						entry
					});
					counts.marked++;
				}
				return {
					result: counts,
					replacements
				};
			}
		});
		result.marked += storeResult.marked;
		result.skipped += storeResult.skipped;
	}
	if (result.marked > 0) log.warn(`marked ${result.marked} interrupted main session(s) for restart recovery${params.reason ? ` (${params.reason})` : ""}`);
	return result;
}
async function markStartupOrphanedMainSessionsForRecovery(params) {
	const result = {
		marked: 0,
		skipped: 0
	};
	const providedActiveSessionIds = params.activeSessionIds === void 0 ? void 0 : normalizeStringSet(params.activeSessionIds);
	const providedActiveSessionKeys = params.activeSessionKeys === void 0 ? void 0 : normalizeStringSet(params.activeSessionKeys);
	const updatedBeforeMs = normalizeFiniteTimestamp(params.updatedBeforeMs);
	const resolveActiveSessionIds = () => providedActiveSessionIds ?? normalizeStringSet(require_run_state.listActiveEmbeddedRunSessionIds());
	const resolveActiveSessionKeys = () => providedActiveSessionKeys ?? normalizeStringSet(require_run_state.listActiveEmbeddedRunSessionKeys());
	for (const storePath of await resolveRestartRecoveryStorePaths(params)) {
		const storeResult = await require_session_accessor.applySessionEntryReplacements({
			storePath,
			statuses: ["running"],
			update: (entries) => {
				const replacements = [];
				const counts = {
					marked: 0,
					skipped: 0
				};
				for (const { sessionKey, entry } of entries) {
					if (entry.status !== "running" || entry.abortedLastRun === true) continue;
					if (shouldSkipMainRecovery(entry, sessionKey)) {
						counts.skipped++;
						continue;
					}
					const updatedAt = normalizeFiniteTimestamp(entry.updatedAt);
					if (updatedBeforeMs !== void 0 && updatedAt !== void 0 && updatedAt > updatedBeforeMs) continue;
					if (hasCurrentProcessOwner({
						activeSessionIds: resolveActiveSessionIds(),
						activeSessionKeys: resolveActiveSessionKeys(),
						entry,
						sessionKey
					})) continue;
					entry.abortedLastRun = true;
					entry.updatedAt = Date.now();
					replacements.push({
						sessionKey,
						entry
					});
					counts.marked++;
				}
				return {
					result: counts,
					replacements
				};
			}
		});
		result.marked += storeResult.marked;
		result.skipped += storeResult.skipped;
	}
	if (result.marked > 0) log.warn(`marked ${result.marked} startup-orphaned main session(s) for restart recovery`);
	return result;
}
function getMessageRole(message) {
	if (!message || typeof message !== "object") return;
	const role = message.role;
	return typeof role === "string" ? role : void 0;
}
function findSourceTurnRange(params) {
	const sourceUserTurnId = require_user_turn_transcript.buildRunUserTurnIdempotencyKey(params.sourceTurnId);
	const sourceTurnIds = /* @__PURE__ */ new Set([params.sourceTurnId, sourceUserTurnId]);
	const continuationTurnId = params.continuationRunId ? require_user_turn_transcript.buildRunUserTurnIdempotencyKey(params.continuationRunId) : void 0;
	for (let index = params.messages.length - 1; index >= 0; index -= 1) {
		const message = params.messages[index];
		if (getMessageRole(message) === "user" && message && typeof message === "object" && sourceTurnIds.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.idempotencyKey) ?? "")) {
			let endIndex = params.messages.length;
			for (let nextIndex = index + 1; nextIndex < params.messages.length; nextIndex += 1) {
				const nextMessage = params.messages[nextIndex];
				if (getMessageRole(nextMessage) !== "user") continue;
				const nextIdempotencyKey = nextMessage && typeof nextMessage === "object" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(nextMessage.idempotencyKey) : void 0;
				if (nextIdempotencyKey === `${params.sourceTurnId}:late-media` || nextIdempotencyKey === continuationTurnId || continuationTurnId !== void 0 && nextIdempotencyKey === `${continuationTurnId}:late-media`) continue;
				endIndex = nextIndex;
				break;
			}
			return {
				startIndex: index,
				endIndex
			};
		}
	}
}
function readToolCallId(message) {
	return [
		message.toolCallId,
		message.toolUseId,
		message.tool_call_id,
		message.tool_use_id,
		message.callId,
		message.call_id
	].map(_gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString).find(Boolean);
}
function findMessageToolCallIndexInSourceTurn(params) {
	for (let index = params.sourceTurnRange.endIndex - 1; index > params.sourceTurnRange.startIndex; index -= 1) {
		const message = params.messages[index];
		if (!message || typeof message !== "object" || getMessageRole(message) !== "assistant") continue;
		const content = message.content;
		if (!Array.isArray(content)) continue;
		if (content.some((block) => {
			if (!block || typeof block !== "object") return false;
			const record = block;
			const type = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.type);
			return (type === "toolCall" || type === "toolUse" || type === "tool_use") && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.id) === params.toolCallId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.name) === "message";
		})) return index;
	}
}
function hasSiblingAssistantToolCalls(message) {
	if (!message || typeof message !== "object" || getMessageRole(message) !== "assistant") return true;
	const content = message.content;
	if (!Array.isArray(content)) return true;
	let toolCallCount = 0;
	for (const block of content) {
		if (!block || typeof block !== "object") continue;
		const type = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.type);
		if (type === "toolCall" || type === "toolUse" || type === "tool_use") toolCallCount += 1;
	}
	return toolCallCount !== 1;
}
function isSuccessfulMessageToolResult(message, toolCallId) {
	const role = getMessageRole(message);
	if (!message || typeof message !== "object" || role !== "tool" && role !== "toolResult") return false;
	const record = message;
	return readToolCallId(record) === toolCallId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.toolName) === "message" && record.isError !== true;
}
function findSuccessfulMessageToolResultIndex(params) {
	for (let index = params.toolCallIndex + 1; index < params.sourceTurnRange.endIndex; index += 1) if (isSuccessfulMessageToolResult(params.messages[index], params.toolCallId)) return index;
}
function isExactMessageToolDeliveryMirror(params) {
	if (!params.message || typeof params.message !== "object") return false;
	const marker = params.message.operatorDeliveryMirror;
	if (!marker || typeof marker !== "object") return false;
	const delivery = marker;
	return delivery.kind === "message-tool-source-reply" && delivery.final === true && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery.sourceTurnId) === params.sourceTurnId && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery.toolCallId) === params.toolCallId;
}
function isSafeTerminalDeliveryTailMessage(params) {
	if (isExactMessageToolDeliveryMirror(params)) return true;
	return isRestartAbortTailArtifact(params.message);
}
function isTerminalSilentAssistantMessage(message) {
	if (!message || typeof message !== "object" || getMessageRole(message) !== "assistant") return false;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.stopReason) !== "stop") return false;
	const content = message.content;
	if (!Array.isArray(content) || content.length === 0) return false;
	const textParts = [];
	for (const block of content) {
		if (!block || typeof block !== "object") return false;
		const type = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.type);
		if (type === "thinking") continue;
		if (type !== "text") return false;
		const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.text);
		if (text) textParts.push(text);
	}
	return require_tokens.isSilentReplyPayloadText(textParts.join("\n"), require_tokens.SILENT_REPLY_TOKEN);
}
function canReconcileTerminalDeliveryAtSourceTurnTail(params) {
	if (params.sourceTurnRange.endIndex !== params.messages.length) return false;
	for (let messageIndex = params.toolCallIndex + 1; messageIndex < params.sourceTurnRange.endIndex; messageIndex += 1) {
		if (messageIndex === params.successfulToolResultIndex) continue;
		const message = params.messages[messageIndex];
		if (params.successfulToolResultIndex !== void 0 && messageIndex > params.successfulToolResultIndex && messageIndex === params.sourceTurnRange.endIndex - 1 && isTerminalSilentAssistantMessage(message)) continue;
		if (isSafeTerminalDeliveryTailMessage({
			message,
			sourceTurnId: params.sourceTurnId,
			toolCallId: params.toolCallId
		})) continue;
		return false;
	}
	return true;
}
function buildRecoveryToolResultIdempotencyKey(sourceTurnId, toolCallId) {
	return `restart-recovery:message-tool-result:${sourceTurnId}:${toolCallId}`;
}
function isMeaningfulTailMessage(message) {
	const role = getMessageRole(message);
	if (!role || role === "system") return false;
	return true;
}
function readDeliveredTerminalSourceReplyToolCallId(messages, expectedSourceTurnId) {
	if (!expectedSourceTurnId) return;
	for (const message of messages.toReversed()) {
		if (!message || typeof message !== "object" || getMessageRole(message) !== "assistant") continue;
		const marker = message.operatorDeliveryMirror;
		if (!marker || typeof marker !== "object") continue;
		const delivery = marker;
		if (delivery.kind === "message-tool-source-reply" && delivery.final === true && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery.sourceTurnId) === expectedSourceTurnId) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery.toolCallId);
	}
}
function readCodeModeWaitCall(message) {
	if (!message || typeof message !== "object" || getMessageRole(message) !== "assistant" || message.stopReason !== "toolUse") return;
	const content = message.content;
	if (!Array.isArray(content)) return;
	const supportedTypes = /* @__PURE__ */ new Set([
		"text",
		"thinking",
		"toolCall",
		"toolUse",
		"tool_use"
	]);
	if (content.some((block) => !block || typeof block !== "object" || !supportedTypes.has(String(block.type)) || block.type === "text" && Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.text)))) return;
	const toolCalls = content.filter((block) => {
		const type = block.type;
		return type === "toolCall" || type === "toolUse" || type === "tool_use";
	});
	if (toolCalls.length !== 1) return;
	const block = toolCalls[0];
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.name) !== "wait") return;
	const args = block.arguments ?? block.input;
	const runId = args && typeof args === "object" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.runId) : void 0;
	if (!runId) return;
	const toolCallId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.id);
	return {
		runId,
		...toolCallId ? { toolCallId } : {}
	};
}
function isResumableTailMessage(message) {
	const role = getMessageRole(message);
	return role === "user" || role === "tool" || role === "toolResult";
}
function isPendingAssistantToolCall(message) {
	if (!message || typeof message !== "object" || getMessageRole(message) !== "assistant") return false;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.stopReason) !== "toolUse") return false;
	const content = message.content;
	if (!Array.isArray(content)) return false;
	let hasToolCall = false;
	for (const block of content) {
		if (!block || typeof block !== "object") return false;
		const type = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.type);
		if (type === "toolCall" || type === "toolUse" || type === "tool_use") {
			hasToolCall = true;
			continue;
		}
		if (type === "thinking") continue;
		if (type === "text" && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.text)) continue;
		return false;
	}
	return hasToolCall;
}
function readCodeModeCheckpoint(message) {
	if (!message || typeof message !== "object") return;
	const role = getMessageRole(message);
	if (role !== "tool" && role !== "toolResult") return;
	const toolName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.toolName);
	if (toolName !== "exec" && toolName !== "wait") return;
	const content = message.content;
	if (!Array.isArray(content)) return;
	const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(content.find((block) => block && typeof block === "object" && block.type === "text")?.text);
	if (!text) return;
	try {
		const result = JSON.parse(text);
		if (result.status === "completed" || result.status === "failed") return { replaySafe: result.replaySafe === true };
		const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(result.runId);
		return result.status === "waiting" && runId ? {
			replaySafe: result.replaySafe === true,
			runId
		} : void 0;
	} catch {
		return;
	}
}
function hasReplaySafeCodeModeCheckpointInCurrentTurn(messages) {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (getMessageRole(message) === "user") return false;
		if (readCodeModeCheckpoint(message)?.replaySafe === true) return true;
	}
	return false;
}
function isRestartAbortTailArtifact(message) {
	if (!message || typeof message !== "object" || getMessageRole(message) !== "assistant") return false;
	const stopReason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.stopReason);
	if (stopReason !== "error" && stopReason !== "aborted") return false;
	const errorMessage = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.errorMessage);
	const content = message.content;
	return Array.isArray(content) && content.length === 0 && (errorMessage === "Request was aborted" || errorMessage === "This operation was aborted");
}
function isRestartAbortedWaitFailure(message) {
	if (!message || typeof message !== "object" || getMessageRole(message) !== "toolResult") return false;
	const record = message;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.toolName) !== "wait" || record.isError !== true) return false;
	const details = record.details;
	if (!details || typeof details !== "object" || details.status !== "failed" || details.code !== "internal_error") return false;
	const content = record.content;
	const contentText = Array.isArray(content) ? content.filter((block) => block && typeof block === "object" && block.type === "text").map((block) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.text) ?? "").join("\n") : "";
	const errorText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(details.error) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(contentText);
	return /^(?:(?:Abort)?Error:\s*)?(?:The|This) operation was aborted\.?$/u.test(errorText ?? "");
}
function isRestartAbortedWaitResultArtifact(message, waitMessage) {
	if (!isRestartAbortedWaitFailure(message)) return false;
	const toolCallId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.toolCallId);
	const waitCall = readCodeModeWaitCall(waitMessage);
	return Boolean(toolCallId && waitCall?.toolCallId === toolCallId);
}
function isApprovalPendingToolResult(message) {
	if (!message || typeof message !== "object" || getMessageRole(message) !== "toolResult") return false;
	const details = message.details;
	if (!details || typeof details !== "object") return false;
	return details.status === "approval-pending";
}
function resolveMainSessionResumePolicy(messages, forceRestartSafeTools = false, expectedSourceTurnId, beforeAgentReplyState, deliveryReceiptState, deliveryToolCallId) {
	const mirroredToolCallId = readDeliveredTerminalSourceReplyToolCallId(messages, expectedSourceTurnId);
	if (mirroredToolCallId) return {
		action: "complete",
		reason: "delivered-terminal",
		toolCallId: mirroredToolCallId
	};
	if (deliveryReceiptState === "delivered-terminal") return deliveryToolCallId ? {
		action: "complete",
		reason: "delivered-terminal-receipt",
		toolCallId: deliveryToolCallId
	} : {
		action: "fail",
		reason: "terminal delivery receipt lacks tool-call correlation"
	};
	if (deliveryReceiptState === "terminal-pending") return {
		action: "fail",
		reason: "terminal source reply delivery outcome is unknown"
	};
	if (beforeAgentReplyState === "handled-silent") return {
		action: "complete",
		reason: "handled-silent"
	};
	if (beforeAgentReplyState === "pending") return {
		action: "fail",
		reason: "before_agent_reply hook outcome is unknown"
	};
	if (beforeAgentReplyState === "handled-reply") return {
		action: "fail",
		reason: "before_agent_reply handled reply is not recoverable"
	};
	if (beforeAgentReplyState === "handled-unrecoverable") return {
		action: "fail",
		reason: "before_agent_reply handled an unrecoverable reply shape"
	};
	const meaningfulMessages = messages.toReversed().filter(isMeaningfulTailMessage);
	if (isRestartAbortTailArtifact(meaningfulMessages[0])) meaningfulMessages.shift();
	if (isRestartAbortedWaitResultArtifact(meaningfulMessages[0], meaningfulMessages[1])) meaningfulMessages.shift();
	const lastMeaningful = meaningfulMessages[0];
	if (forceRestartSafeTools && isPendingAssistantToolCall(lastMeaningful)) return {
		action: "resume",
		forceRestartSafeTools: true
	};
	if (isRestartAbortedWaitFailure(lastMeaningful)) {
		const waitCall = readCodeModeWaitCall(meaningfulMessages[1]);
		const checkpoint = readCodeModeCheckpoint(meaningfulMessages[2]);
		return waitCall && checkpoint?.replaySafe === true && checkpoint.runId === waitCall.runId ? {
			action: "resume",
			forceRestartSafeTools: true
		} : {
			action: "fail",
			reason: "failed Code Mode wait cannot be matched to a replay-safe checkpoint"
		};
	}
	const waitCall = readCodeModeWaitCall(lastMeaningful);
	if (waitCall) {
		const checkpoint = readCodeModeCheckpoint(meaningfulMessages[1]);
		return checkpoint?.replaySafe === true && checkpoint.runId === waitCall.runId ? {
			action: "resume",
			forceRestartSafeTools: true
		} : {
			action: "fail",
			reason: "Code Mode wait checkpoint is not replay-safe"
		};
	}
	const tailCheckpoint = readCodeModeCheckpoint(lastMeaningful);
	if (tailCheckpoint) return tailCheckpoint.replaySafe ? {
		action: "resume",
		forceRestartSafeTools: true
	} : {
		action: "fail",
		reason: "Code Mode wait checkpoint is not replay-safe"
	};
	if (!lastMeaningful || !isResumableTailMessage(lastMeaningful)) return {
		action: "fail",
		reason: "transcript tail is not resumable"
	};
	if (isApprovalPendingToolResult(lastMeaningful)) return {
		action: "fail",
		reason: "transcript tail is a stale approval-pending tool result"
	};
	return {
		action: "resume",
		forceRestartSafeTools: false
	};
}
async function markSessionFailed(params) {
	const marked = await require_session_accessor.applySessionEntryReplacements({
		sessionKeys: [params.sessionKey],
		storePath: params.storePath,
		update: (entries) => {
			const entry = entries.find((entry) => entry.sessionKey === params.sessionKey)?.entry;
			if (!entry || entry.sessionId !== params.expectedSessionId || entry.status !== "running" || entry.abortedLastRun !== true || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliveryRunId) !== params.expectedRecoveryRunId || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId) !== params.expectedRecoverySourceRunId) return { result: false };
			entry.status = "failed";
			entry.abortedLastRun = true;
			entry.endedAt = Date.now();
			entry.updatedAt = entry.endedAt;
			entry.pendingFinalDelivery = void 0;
			entry.pendingFinalDeliveryText = void 0;
			entry.pendingFinalDeliveryCreatedAt = void 0;
			entry.pendingFinalDeliveryLastAttemptAt = void 0;
			entry.pendingFinalDeliveryAttemptCount = void 0;
			entry.pendingFinalDeliveryLastError = void 0;
			entry.pendingFinalDeliveryContext = void 0;
			entry.pendingFinalDeliveryIntentId = void 0;
			Object.assign(entry, require_store.buildRestartRecoveryClaimCleanupPatch({
				entry,
				recordTerminalSource: true
			}));
			return {
				result: true,
				replacements: [{
					sessionKey: params.sessionKey,
					entry
				}]
			};
		}
	});
	if (marked) log.warn(`marked interrupted main session failed: ${params.sessionKey} (${params.reason})`);
	return marked;
}
async function markSessionCompletedAfterRecoveryCheckpoint(params) {
	const expectedRecoveryRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.restartRecoveryDeliveryRunId);
	const expectedRecoverySourceRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.restartRecoveryDeliverySourceRunId);
	const endedAt = Date.now();
	const lifecyclePatch = {
		...require_store.buildRestartRecoveryClaimCleanupPatch({
			entry: params.entry,
			recordTerminalSource: expectedRecoverySourceRunId !== void 0,
			terminalSourceRunId: expectedRecoverySourceRunId
		}),
		abortedLastRun: false,
		endedAt,
		pendingFinalDelivery: void 0,
		pendingFinalDeliveryText: void 0,
		pendingFinalDeliveryCreatedAt: void 0,
		pendingFinalDeliveryLastAttemptAt: void 0,
		pendingFinalDeliveryAttemptCount: void 0,
		pendingFinalDeliveryLastError: void 0,
		pendingFinalDeliveryContext: void 0,
		pendingFinalDeliveryIntentId: void 0,
		restartRecoveryForceSafeTools: void 0,
		restartRecoveryRuns: void 0,
		runtimeMs: typeof params.entry.startedAt === "number" ? Math.max(0, endedAt - params.entry.startedAt) : void 0,
		status: "done",
		updatedAt: endedAt
	};
	const sourceTurnId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sourceTurnId);
	if (params.reason === "handled-silent" && !sourceTurnId) return {
		outcome: "unsafe-transcript",
		reason: "handled silent checkpoint lacks its durable source turn"
	};
	const sourceTurnRange = sourceTurnId ? findSourceTurnRange({
		continuationRunId: expectedRecoveryRunId,
		messages: params.messages,
		sourceTurnId
	}) : void 0;
	const toolCallId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.toolCallId);
	if (sourceTurnId && sourceTurnRange === void 0) return {
		outcome: "unsafe-transcript",
		reason: "recovery checkpoint cannot be matched to its durable source turn"
	};
	if (sourceTurnRange && sourceTurnRange.endIndex !== params.messages.length) return {
		outcome: "unsafe-transcript",
		reason: "recovery checkpoint belongs to an earlier transcript turn"
	};
	if (toolCallId && !sourceTurnId) return {
		outcome: "unsafe-transcript",
		reason: "terminal delivery lacks its durable source turn"
	};
	const messageToolCallIndex = toolCallId && sourceTurnRange ? findMessageToolCallIndexInSourceTurn({
		messages: params.messages,
		sourceTurnRange,
		toolCallId
	}) : void 0;
	if (toolCallId && messageToolCallIndex === void 0) return {
		outcome: "unsafe-transcript",
		reason: "terminal delivery cannot be matched to its message tool call"
	};
	if (messageToolCallIndex !== void 0 && hasSiblingAssistantToolCalls(params.messages[messageToolCallIndex])) return {
		outcome: "unsafe-transcript",
		reason: "terminal message tool call has sibling tool work"
	};
	const recoveryToolResultIdempotencyKey = toolCallId && sourceTurnId ? buildRecoveryToolResultIdempotencyKey(sourceTurnId, toolCallId) : void 0;
	const successfulToolResultIndex = toolCallId && sourceTurnRange && messageToolCallIndex !== void 0 ? findSuccessfulMessageToolResultIndex({
		messages: params.messages,
		sourceTurnRange,
		toolCallId,
		toolCallIndex: messageToolCallIndex
	}) : void 0;
	if (toolCallId && sourceTurnId && sourceTurnRange !== void 0 && messageToolCallIndex !== void 0 && !canReconcileTerminalDeliveryAtSourceTurnTail({
		messages: params.messages,
		sourceTurnId,
		sourceTurnRange,
		toolCallId,
		toolCallIndex: messageToolCallIndex,
		successfulToolResultIndex
	})) return {
		outcome: "unsafe-transcript",
		reason: successfulToolResultIndex === void 0 ? "terminal delivery would require an out-of-order transcript repair" : "terminal delivery result is followed by unfinished transcript work"
	};
	if (toolCallId && sourceTurnId && sourceTurnRange !== void 0 && messageToolCallIndex !== void 0 && recoveryToolResultIdempotencyKey && successfulToolResultIndex === void 0) {
		const expectedSessionState = {
			abortedLastRun: params.entry.abortedLastRun,
			restartRecoveryBeforeAgentReplyState: params.entry.restartRecoveryBeforeAgentReplyState,
			restartRecoveryDeliveryReceiptState: params.entry.restartRecoveryDeliveryReceiptState,
			restartRecoveryDeliveryToolCallId: params.entry.restartRecoveryDeliveryToolCallId,
			restartRecoveryDeliveryRequestFingerprint: params.entry.restartRecoveryDeliveryRequestFingerprint,
			restartRecoveryDeliveryRunId: params.entry.restartRecoveryDeliveryRunId,
			restartRecoveryDeliverySourceRunId: params.entry.restartRecoveryDeliverySourceRunId,
			restartRecoveryRequesterAccountId: params.entry.restartRecoveryRequesterAccountId,
			restartRecoveryRequesterSenderId: params.entry.restartRecoveryRequesterSenderId,
			restartRecoverySameChannelThreadRequired: params.entry.restartRecoverySameChannelThreadRequired,
			restartRecoverySourceIngress: params.entry.restartRecoverySourceIngress,
			restartRecoverySourceReplyDeliveryMode: params.entry.restartRecoverySourceReplyDeliveryMode,
			restartRecoveryTerminalRunIds: params.entry.restartRecoveryTerminalRunIds,
			status: params.entry.status,
			updatedAt: params.entry.updatedAt
		};
		const completed = (await require_session_accessor.persistSessionTranscriptTurn({
			agentId: require_session_key.resolveAgentIdFromSessionKey(params.sessionKey),
			sessionId: params.entry.sessionId,
			sessionKey: params.sessionKey,
			storePath: params.storePath
		}, {
			expectedSessionId: params.entry.sessionId,
			expectedSessionState,
			messages: [{
				idempotencyLookup: "scan",
				message: {
					role: "toolResult",
					toolCallId,
					toolName: "message",
					content: [{
						type: "text",
						text: "Message delivered before gateway restart."
					}],
					idempotencyKey: recoveryToolResultIdempotencyKey,
					isError: false,
					timestamp: endedAt
				}
			}],
			sessionLifecyclePatch: lifecyclePatch,
			updateMode: "none"
		})).sessionEntry?.status === "done";
		if (completed) log.info(`reconciled delivered terminal reply after restart: ${params.sessionKey}`);
		return { outcome: completed ? "completed" : "changed" };
	}
	const marked = await require_session_accessor.applySessionEntryReplacements({
		sessionKeys: [params.sessionKey],
		storePath: params.storePath,
		update: (entries) => {
			const entry = entries.find((candidate) => candidate.sessionKey === params.sessionKey)?.entry;
			if (!entry || entry.sessionId !== params.entry.sessionId || entry.status !== "running" || entry.abortedLastRun !== true || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliveryRunId) !== expectedRecoveryRunId || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId) !== expectedRecoverySourceRunId) return { result: false };
			Object.assign(entry, lifecyclePatch);
			return {
				result: true,
				replacements: [{
					sessionKey: params.sessionKey,
					entry
				}]
			};
		}
	});
	if (marked) log.info(params.reason === "delivered-terminal" || params.reason === "delivered-terminal-receipt" ? `reconciled delivered terminal reply after restart: ${params.sessionKey}` : `reconciled handled silent reply after restart: ${params.sessionKey}`);
	return { outcome: marked ? "completed" : "changed" };
}
async function sendUnresumableSessionNotice(params) {
	const messageParams = {
		to: params.deliveryContext.to,
		message: UNRESUMABLE_SESSION_NOTICE,
		bestEffort: true
	};
	if (params.deliveryContext.threadId != null) messageParams.threadId = params.deliveryContext.threadId;
	const actionParams = {
		channel: params.deliveryContext.channel,
		action: "send",
		sessionKey: params.sessionKey,
		sessionId: params.entry.sessionId,
		idempotencyKey: buildUnresumableSessionNoticeIdempotencyKey(params.entry),
		params: messageParams
	};
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.deliveryContext.accountId);
	if (accountId) actionParams.accountId = accountId;
	try {
		await params.gatewayRuntime.sendRecoveryNotice(actionParams, 1e4);
		log.info(`sent interrupted main session recovery notice: ${params.sessionKey} (${params.reason})`);
	} catch (err) {
		log.warn(`failed to send interrupted main session recovery notice ${params.sessionKey}: ${String(err)}`);
	}
}
async function writeUnresumableSessionNotice(params) {
	const result = await require_transcript.appendAssistantMessageToSessionTranscript({
		agentId: require_session_key.resolveAgentIdFromSessionKey(params.sessionKey),
		sessionKey: params.sessionKey,
		expectedSessionId: params.entry.sessionId,
		expectedSessionState: {
			abortedLastRun: params.entry.abortedLastRun,
			restartRecoveryBeforeAgentReplyState: params.entry.restartRecoveryBeforeAgentReplyState,
			restartRecoveryDeliveryReceiptState: params.entry.restartRecoveryDeliveryReceiptState,
			restartRecoveryDeliveryToolCallId: params.entry.restartRecoveryDeliveryToolCallId,
			restartRecoveryDeliveryRequestFingerprint: params.entry.restartRecoveryDeliveryRequestFingerprint,
			restartRecoveryDeliveryRunId: params.entry.restartRecoveryDeliveryRunId,
			restartRecoveryDeliverySourceRunId: params.entry.restartRecoveryDeliverySourceRunId,
			restartRecoveryRequesterAccountId: params.entry.restartRecoveryRequesterAccountId,
			restartRecoveryRequesterSenderId: params.entry.restartRecoveryRequesterSenderId,
			restartRecoverySameChannelThreadRequired: params.entry.restartRecoverySameChannelThreadRequired,
			restartRecoverySourceIngress: params.entry.restartRecoverySourceIngress,
			restartRecoverySourceReplyDeliveryMode: params.entry.restartRecoverySourceReplyDeliveryMode,
			restartRecoveryTerminalRunIds: params.entry.restartRecoveryTerminalRunIds,
			status: params.entry.status,
			updatedAt: params.entry.updatedAt
		},
		storePath: params.storePath,
		text: UNRESUMABLE_SESSION_NOTICE,
		idempotencyKey: buildUnresumableSessionNoticeIdempotencyKey(params.entry)
	}).catch((error) => ({
		ok: false,
		reason: String(error)
	}));
	if (!result.ok) log.warn(`failed to write interrupted main session notice ${params.sessionKey}: ${result.reason}`);
	return result.ok;
}
async function failUnresumableMainSession(params) {
	const deliveryContext = resolveRestartRecoveryDeliveryContext({
		cfg: params.cfg,
		entry: params.entry,
		includeSessionDeliveryFallback: true,
		sessionKey: params.sessionKey
	});
	if (!deliveryContext && !await writeUnresumableSessionNotice({
		entry: params.entry,
		sessionKey: params.sessionKey,
		storePath: params.storePath
	})) return "failed";
	if (!await markSessionFailed({
		expectedRecoveryRunId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.restartRecoveryDeliveryRunId),
		expectedRecoverySourceRunId: params.expectedRecoverySourceRunId,
		expectedSessionId: params.entry.sessionId,
		storePath: params.storePath,
		sessionKey: params.sessionKey,
		reason: params.reason
	})) return "skipped";
	if (deliveryContext) await sendUnresumableSessionNotice({
		deliveryContext,
		entry: params.entry,
		gatewayRuntime: params.gatewayRuntime,
		reason: params.reason,
		sessionKey: params.sessionKey
	});
	return "failed";
}
async function markRestartAbortedMainSessionsFromLocks(params) {
	const result = {
		marked: 0,
		skipped: 0
	};
	const sessionsDir = node_path.default.resolve(params.sessionsDir);
	const interruptedLockPaths = new Set(params.cleanedLocks.map((lock) => normalizeTranscriptLockPath(lock.lockPath)).filter((lockPath) => Boolean(lockPath)));
	if (interruptedLockPaths.size === 0) return result;
	const storeResult = await require_session_accessor.applySessionEntryReplacements({
		storePath: node_path.default.join(sessionsDir, "sessions.json"),
		statuses: ["running"],
		update: (entries) => {
			const replacements = [];
			const counts = {
				marked: 0,
				skipped: 0
			};
			for (const { sessionKey, entry } of entries) {
				if (entry.status !== "running") continue;
				if (shouldSkipMainRecovery(entry, sessionKey)) {
					counts.skipped++;
					continue;
				}
				if (!resolveEntryTranscriptLockPaths({
					entry,
					sessionsDir
				}).some((lockPath) => interruptedLockPaths.has(lockPath))) continue;
				entry.abortedLastRun = true;
				replacements.push({
					sessionKey,
					entry
				});
				counts.marked++;
			}
			return {
				result: counts,
				replacements
			};
		}
	});
	result.marked += storeResult.marked;
	result.skipped += storeResult.skipped;
	if (result.marked > 0) log.warn(`marked ${result.marked} interrupted main session(s) from stale transcript locks`);
	return result;
}
function resolveRecoveryDispatchSessionKey(params) {
	if (!params.cfg) return params.sessionKey;
	try {
		const target = require_session_utils.resolveGatewaySessionStoreTarget({
			cfg: params.cfg,
			key: params.sessionKey
		});
		return !params.cfg.session?.store || node_path.default.resolve(target.storePath) === node_path.default.resolve(params.storePath) ? target.canonicalKey : void 0;
	} catch (err) {
		log.warn(`failed to resolve recovery store for ${params.sessionKey}: ${String(err)}`);
		return;
	}
}
async function recoverStore(params) {
	const result = {
		recovered: 0,
		failed: 0,
		skipped: 0
	};
	const providedActiveSessionIds = params.activeSessionIds === void 0 ? void 0 : normalizeStringSet(params.activeSessionIds);
	const providedActiveSessionKeys = params.activeSessionKeys === void 0 ? void 0 : normalizeStringSet(params.activeSessionKeys);
	const resolveActiveSessionIds = () => providedActiveSessionIds ?? normalizeStringSet(require_run_state.listActiveEmbeddedRunSessionIds());
	const resolveActiveSessionKeys = () => providedActiveSessionKeys ?? normalizeStringSet(require_run_state.listActiveEmbeddedRunSessionKeys());
	let entries;
	try {
		if (params.expectedClaim) {
			const entry = loadExpectedRestartRecoveryClaim({
				expected: params.expectedClaim,
				storePath: params.storePath
			});
			entries = entry ? [{
				sessionKey: params.expectedClaim.sessionKey,
				entry
			}] : [];
		} else entries = require_session_accessor.listSessionEntriesByStatus({ storePath: params.storePath }, ["running"]);
	} catch (err) {
		log.warn(`failed to load session store ${params.storePath}: ${String(err)}`);
		result.failed++;
		return result;
	}
	for (const { sessionKey, entry } of entries.toSorted((a, b) => a.sessionKey.localeCompare(b.sessionKey))) {
		if (entry?.status !== "running" || entry.abortedLastRun !== true) continue;
		if (shouldSkipMainRecovery(entry, sessionKey)) {
			result.skipped++;
			continue;
		}
		if (require_lifecycle.resolveSessionWorkStartError(sessionKey, entry)) {
			result.skipped++;
			continue;
		}
		const resolvedDispatchSessionKey = resolveRecoveryDispatchSessionKey({
			cfg: params.cfg,
			sessionKey,
			storePath: params.storePath
		});
		if (!resolvedDispatchSessionKey) {
			result.skipped++;
			continue;
		}
		const dispatchSessionKey = params.expectedClaim?.canonicalSessionKey ?? resolvedDispatchSessionKey;
		if (hasCurrentProcessOwner({
			activeSessionIds: resolveActiveSessionIds(),
			activeSessionKeys: resolveActiveSessionKeys(),
			entry,
			sessionKey
		})) {
			result.skipped++;
			continue;
		}
		const resumeDedupeKey = sessionKey;
		if (params.resumedSessionKeys.has(resumeDedupeKey)) {
			result.skipped++;
			continue;
		}
		if (requiresRestartRecoveryMessageActionAuthority(entry) && !hasRestartRecoveryMessageActionAuthority(entry)) {
			const disposition = await failUnresumableMainSession({
				cfg: params.cfg,
				entry,
				expectedRecoverySourceRunId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId),
				gatewayRuntime: params.gatewayRuntime,
				reason: "message-tool-only recovery authority is unavailable",
				sessionKey,
				storePath: params.storePath
			});
			result[disposition]++;
			continue;
		}
		const expectedRecoverySourceRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.restartRecoveryDeliverySourceRunId);
		let resumeBlockReason;
		let resumeSafetyResolved = false;
		const failBlockedResume = async () => {
			if (!resumeSafetyResolved) {
				resumeSafetyResolved = true;
				resumeBlockReason = resolveRestartRecoveryResumeBlockReason({
					cfg: params.cfg,
					entry,
					sessionKey
				});
			}
			if (!resumeBlockReason) return false;
			const disposition = await failUnresumableMainSession({
				cfg: params.cfg,
				entry,
				expectedRecoverySourceRunId,
				gatewayRuntime: params.gatewayRuntime,
				reason: resumeBlockReason,
				sessionKey,
				storePath: params.storePath
			});
			result[disposition]++;
			return true;
		};
		if (entry.pendingFinalDelivery === true && entry.pendingFinalDeliveryText && entry.restartRecoveryForceSafeTools === true) {
			if (await failBlockedResume()) continue;
			if (await resumeMainSession({
				canonicalSessionKey: dispatchSessionKey,
				cfg: params.cfg,
				entry,
				storePath: params.storePath,
				sessionKey,
				pendingFinalDeliveryText: entry.pendingFinalDeliveryText,
				forceRestartSafeTools: true,
				sessionWorkAdmissionHandoffId: params.sessionWorkAdmissionHandoffId,
				gatewayRuntime: params.gatewayRuntime
			})) {
				params.resumedSessionKeys.add(resumeDedupeKey);
				result.recovered++;
			} else result.failed++;
			continue;
		}
		let messages;
		try {
			messages = await require_session_transcript_readers.readSessionMessagesAsync({
				agentId: require_session_key.resolveAgentIdFromSessionKey(sessionKey),
				sessionEntry: entry,
				sessionId: entry.sessionId,
				sessionKey,
				storePath: params.storePath
			}, {
				mode: "recent",
				maxMessages: 20,
				maxBytes: 256 * 1024
			});
		} catch (err) {
			if (entry.pendingFinalDelivery === true && entry.pendingFinalDeliveryText) {
				if (await failBlockedResume()) continue;
				log.warn(`transcript unavailable for ${sessionKey}; resuming its durable pending final delivery`);
				if (await resumeMainSession({
					canonicalSessionKey: dispatchSessionKey,
					cfg: params.cfg,
					entry,
					storePath: params.storePath,
					sessionKey,
					pendingFinalDeliveryText: entry.pendingFinalDeliveryText,
					sessionWorkAdmissionHandoffId: params.sessionWorkAdmissionHandoffId,
					gatewayRuntime: params.gatewayRuntime
				})) {
					params.resumedSessionKeys.add(resumeDedupeKey);
					result.recovered++;
				} else result.failed++;
				continue;
			}
			log.warn(`failed to read transcript for ${sessionKey}: ${String(err)}`);
			result.failed++;
			continue;
		}
		if (entry.pendingFinalDelivery === true && entry.pendingFinalDeliveryText) {
			if (await failBlockedResume()) continue;
			if (await resumeMainSession({
				canonicalSessionKey: dispatchSessionKey,
				cfg: params.cfg,
				entry,
				storePath: params.storePath,
				sessionKey,
				pendingFinalDeliveryText: entry.pendingFinalDeliveryText,
				forceRestartSafeTools: hasReplaySafeCodeModeCheckpointInCurrentTurn(messages),
				sessionWorkAdmissionHandoffId: params.sessionWorkAdmissionHandoffId,
				gatewayRuntime: params.gatewayRuntime
			})) {
				params.resumedSessionKeys.add(resumeDedupeKey);
				result.recovered++;
			} else result.failed++;
			continue;
		}
		const resumePolicy = resolveMainSessionResumePolicy(messages, entry.restartRecoveryForceSafeTools === true, expectedRecoverySourceRunId, entry.restartRecoveryBeforeAgentReplyState, entry.restartRecoveryDeliveryReceiptState, entry.restartRecoveryDeliveryToolCallId);
		if (resumePolicy.action === "complete") {
			const completion = await markSessionCompletedAfterRecoveryCheckpoint({
				entry,
				messages,
				reason: resumePolicy.reason,
				storePath: params.storePath,
				sessionKey,
				sourceTurnId: expectedRecoverySourceRunId,
				...resumePolicy.reason === "handled-silent" ? {} : { toolCallId: resumePolicy.toolCallId }
			});
			if (completion.outcome === "completed") {
				params.resumedSessionKeys.add(resumeDedupeKey);
				result.recovered++;
			} else if (completion.outcome === "changed") result.skipped++;
			else {
				const disposition = await failUnresumableMainSession({
					cfg: params.cfg,
					entry,
					expectedRecoverySourceRunId,
					gatewayRuntime: params.gatewayRuntime,
					reason: completion.reason,
					sessionKey,
					storePath: params.storePath
				});
				result[disposition]++;
			}
			continue;
		}
		if (resumePolicy.action === "fail") {
			const disposition = await failUnresumableMainSession({
				cfg: params.cfg,
				entry,
				expectedRecoverySourceRunId,
				gatewayRuntime: params.gatewayRuntime,
				reason: resumePolicy.reason,
				sessionKey,
				storePath: params.storePath
			});
			result[disposition]++;
			continue;
		}
		if (await failBlockedResume()) continue;
		if (await resumeMainSession({
			canonicalSessionKey: dispatchSessionKey,
			cfg: params.cfg,
			entry,
			storePath: params.storePath,
			sessionKey,
			pendingFinalDeliveryText: entry.pendingFinalDeliveryText,
			forceRestartSafeTools: entry.restartRecoveryForceSafeTools === true || resumePolicy.forceRestartSafeTools,
			sessionWorkAdmissionHandoffId: params.sessionWorkAdmissionHandoffId,
			gatewayRuntime: params.gatewayRuntime
		})) {
			params.resumedSessionKeys.add(resumeDedupeKey);
			result.recovered++;
		} else result.failed++;
	}
	return result;
}
async function resolveRestartRecoveryStorePaths(params) {
	const storePaths = /* @__PURE__ */ new Set();
	const stateDir = params.stateDir ?? require_paths.resolveStateDir(process.env);
	for (const sessionsDir of await require_session_dirs.resolveAgentSessionDirs(stateDir)) storePaths.add(node_path.default.join(sessionsDir, "sessions.json"));
	if (params.cfg) {
		const env = {
			...process.env,
			OPERATOR_STATE_DIR: stateDir
		};
		for (const target of require_targets.resolveAllAgentSessionStoreTargetsSync(params.cfg, { env })) storePaths.add(node_path.default.resolve(target.storePath));
	}
	return [...storePaths].toSorted((a, b) => a.localeCompare(b));
}
async function recoverRestartAbortedMainSessions(params) {
	const result = {
		recovered: 0,
		failed: 0,
		skipped: 0
	};
	const resumedSessionKeys = params.resumedSessionKeys ?? /* @__PURE__ */ new Set();
	for (const storePath of await resolveRestartRecoveryStorePaths(params)) {
		const storeResult = await recoverStore({
			cfg: params.cfg,
			storePath,
			resumedSessionKeys,
			activeSessionIds: params.activeSessionIds,
			activeSessionKeys: params.activeSessionKeys,
			gatewayRuntime: params.gatewayRuntime
		});
		result.recovered += storeResult.recovered;
		result.failed += storeResult.failed;
		result.skipped += storeResult.skipped;
	}
	if (result.recovered > 0 || result.failed > 0) log.info(`main-session restart recovery complete: recovered=${result.recovered} failed=${result.failed} skipped=${result.skipped}`);
	return result;
}
/** Retries one exact durable Control UI row from its owning per-agent SQLite store. */
async function retryRestartAbortedMainSessionRecovery(params) {
	const expectedClaim = {
		canonicalSessionKey: params.canonicalSessionKey,
		recoveryRunId: params.expectedRecoveryRunId,
		recoverySourceRunId: params.expectedRecoverySourceRunId,
		sessionId: params.expectedSessionId,
		sessionKey: params.sessionKey
	};
	if (!loadExpectedRestartRecoveryClaim({
		expected: expectedClaim,
		storePath: params.storePath
	})) return {
		recovered: 0,
		failed: 0,
		skipped: 0
	};
	const assertClaimCurrent = () => {
		if (!loadExpectedRestartRecoveryClaim({
			expected: expectedClaim,
			storePath: params.storePath
		})) throw new Error("restart recovery session ownership changed before dispatch");
	};
	const admission = await require_store.beginSessionWorkAdmission({
		scope: params.storePath,
		identities: [
			params.sessionKey,
			params.canonicalSessionKey,
			params.expectedSessionId
		],
		assertAllowed: assertClaimCurrent,
		revalidateAllowed: assertClaimCurrent
	});
	const handoffId = admission.createHandoff();
	try {
		return await admission.run(async () => await recoverStore({
			cfg: params.cfg,
			storePath: params.storePath,
			resumedSessionKeys: /* @__PURE__ */ new Set(),
			expectedClaim,
			sessionWorkAdmissionHandoffId: handoffId,
			gatewayRuntime: params.gatewayRuntime
		}));
	} finally {
		require_store.cancelSessionWorkAdmissionHandoff(handoffId);
	}
}
async function recoverStartupOrphanedMainSessions(params) {
	const startupRecoveryCutoffMs = params.updatedBeforeMs ?? Date.now();
	const marked = await markStartupOrphanedMainSessionsForRecovery({
		cfg: params.cfg,
		stateDir: params.stateDir,
		activeSessionIds: params.activeSessionIds,
		activeSessionKeys: params.activeSessionKeys,
		updatedBeforeMs: startupRecoveryCutoffMs
	});
	const recovered = await recoverRestartAbortedMainSessions({
		cfg: params.cfg,
		stateDir: params.stateDir,
		resumedSessionKeys: params.resumedSessionKeys,
		activeSessionIds: params.activeSessionIds,
		activeSessionKeys: params.activeSessionKeys,
		gatewayRuntime: params.gatewayRuntime
	});
	return {
		marked: marked.marked,
		recovered: recovered.recovered,
		failed: recovered.failed,
		skipped: marked.skipped + recovered.skipped
	};
}
function scheduleRestartAbortedMainSessionRecovery(params) {
	const initialDelay = params.delayMs ?? DEFAULT_RECOVERY_DELAY_MS;
	const maxRetries = params.maxRetries ?? MAX_RECOVERY_RETRIES;
	const resumedSessionKeys = /* @__PURE__ */ new Set();
	const startupRecoveryCutoffMs = Date.now();
	const runRecoveryAttempt = (attempt, delay) => {
		require_gateway_work_admission.runWithGatewayIndependentRootWorkAdmission(async () => await recoverStartupOrphanedMainSessions({
			cfg: params.cfg,
			stateDir: params.stateDir,
			resumedSessionKeys,
			updatedBeforeMs: startupRecoveryCutoffMs,
			gatewayRuntime: params.gatewayRuntime
		})).then((result) => {
			if (result.failed > 0 && attempt < maxRetries) scheduleAttempt(attempt + 1, delay * RETRY_BACKOFF_MULTIPLIER);
		}).catch((err) => {
			if (attempt < maxRetries) {
				log.warn(`main-session restart recovery failed: ${String(err)}`);
				scheduleAttempt(attempt + 1, delay * RETRY_BACKOFF_MULTIPLIER);
			} else log.warn(`main-session restart recovery gave up: ${String(err)}`);
		});
	};
	const scheduleAttempt = (attempt, delay) => {
		if (delay <= 0) {
			runRecoveryAttempt(attempt, delay);
			return;
		}
		setTimeout(() => {
			runRecoveryAttempt(attempt, delay);
		}, delay).unref?.();
	};
	scheduleAttempt(1, initialDelay);
}
//#endregion
exports.markRestartAbortedMainSessions = markRestartAbortedMainSessions;
exports.markRestartAbortedMainSessionsFromLocks = markRestartAbortedMainSessionsFromLocks;
exports.markStartupOrphanedMainSessionsForRecovery = markStartupOrphanedMainSessionsForRecovery;
exports.recoverRestartAbortedMainSessions = recoverRestartAbortedMainSessions;
exports.recoverStartupOrphanedMainSessions = recoverStartupOrphanedMainSessions;
exports.retryRestartAbortedMainSessionRecovery = retryRestartAbortedMainSessionRecovery;
exports.scheduleRestartAbortedMainSessionRecovery = scheduleRestartAbortedMainSessionRecovery;
