const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_subagent_run_liveness = require("./subagent-run-liveness-DmyqOa7r.cjs");
const require_internal_session_effects = require("./internal-session-effects-Bt5F4fR6.cjs");
const require_subagent_registry_steer_runtime = require("./subagent-registry-steer-runtime-BFFOYbbq.cjs");
const require_subagent_recovery_state = require("./subagent-recovery-state-cp-2XAVz.cjs");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/agents/subagent-orphan-recovery.ts
/**
* Post-restart interrupted-run resume for subagent sessions.
*
* After a SIGUSR1 gateway reload aborts in-flight subagent LLM calls,
* this module scans for interrupted sessions (those with `abortedLastRun: true`
* that are still tracked as active in the subagent registry) and sends a
* synthetic resume message to restart their work. Parent notification is handled
* separately by completion delivery after the child reaches a terminal result.
*
* @see https://github.com/operator/operator/issues/47711
*/
const log = require_subsystem.createSubsystemLogger("subagent-interrupted-resume");
/** Delay before attempting recovery to let the gateway finish bootstrapping. */
const DEFAULT_RECOVERY_DELAY_MS = 5e3;
function isLegacyRestartInterruptedTimeout(runRecord, entry) {
	return entry?.abortedLastRun === true && runRecord.outcome?.status === "timeout" && typeof runRecord.endedAt === "number" && runRecord.endedAt > 0;
}
function reclassifyLegacyRestartInterruptedRun(runRecord) {
	const interruptedAt = runRecord.endedAt;
	runRecord.execution = {
		...runRecord.execution,
		status: "interrupted",
		interruptedAt,
		interruptionReason: "gateway-restart",
		endedAt: void 0,
		outcome: void 0
	};
	runRecord.endedAt = void 0;
	runRecord.endedReason = void 0;
	runRecord.outcome = void 0;
	runRecord.terminalOwner = void 0;
}
function loadRecoverySessionEntry(params) {
	return require_session_accessor.loadSessionEntry({
		storePath: params.storePath,
		sessionKey: params.childSessionKey,
		clone: false
	});
}
async function patchRecoverySessionEntry(params) {
	return await require_session_accessor.patchSessionEntry({
		storePath: params.storePath,
		sessionKey: params.childSessionKey
	}, (entry) => {
		params.update(entry);
		return entry;
	}, {
		replaceEntry: true,
		skipMaintenance: true
	});
}
/**
* Build the resume message for an orphaned subagent.
*/
function buildResumeMessage(task, lastHumanMessage) {
	const maxTaskLen = 2e3;
	let message = `[System] Your previous turn was interrupted by a gateway reload. Your original task was:\n\n${task.length > maxTaskLen ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(task, maxTaskLen)}...` : task}\n\n`;
	if (lastHumanMessage) message += `The last message from the user before the interruption was:\n\n${lastHumanMessage}\n\n`;
	message += `Please continue where you left off.`;
	return message;
}
function extractMessageText(msg) {
	if (!msg || typeof msg !== "object") return;
	const m = msg;
	if (typeof m.content === "string") return m.content;
	if (Array.isArray(m.content)) return m.content.filter((c) => typeof c === "object" && c !== null && c.type === "text" && typeof c.text === "string").map((c) => c.text).filter(Boolean).join("\n") || void 0;
}
/**
* Send a resume message through the owning Gateway's in-process agent dispatcher.
*/
async function resumeOrphanedSession(params) {
	let resumeMessage = buildResumeMessage(params.task, params.lastHumanMessage);
	if (params.configChangeHint) resumeMessage += params.configChangeHint;
	try {
		const idempotencyKey = node_crypto.default.randomUUID();
		const result = await params.gatewayRuntime.dispatchAgent({
			message: resumeMessage,
			sessionKey: params.sessionKey,
			idempotencyKey,
			deliver: false,
			lane: "subagent",
			inputProvenance: {
				kind: "inter_session",
				sourceSessionKey: params.originalRun.requesterSessionKey,
				sourceChannel: "internal",
				sourceTool: "subagent_interrupted_resume"
			},
			sessionEffects: "internal",
			suppressPromptPersistence: true
		}, 1e4);
		if (!require_subagent_registry_steer_runtime.replaceSubagentRunAfterSteer({
			previousRunId: params.originalRunId,
			nextRunId: result.runId,
			fallback: params.originalRun,
			transcriptTarget: require_internal_session_effects.resolveInternalSessionEffectsTarget({
				agentId: require_session_key.resolveAgentIdFromSessionKey(params.sessionKey),
				runId: result.runId,
				storePath: require_paths.resolveStorePath(require_io.getRuntimeConfig().session?.store, { agentId: require_session_key.resolveAgentIdFromSessionKey(params.sessionKey) })
			}),
			task: params.task
		})) {
			log.warn(`resumed orphaned session ${params.sessionKey} but remap failed (old run already removed); treating resume as accepted to avoid duplicate restarts`);
			return { resumed: true };
		}
		log.info(`resumed orphaned session: ${params.sessionKey}`);
		return { resumed: true };
	} catch (err) {
		const error = require_errors.formatErrorMessage(err);
		log.warn(`failed to resume orphaned session ${params.sessionKey}: ${error}`);
		return {
			resumed: false,
			error
		};
	}
}
/**
* Scan for and resume orphaned subagent sessions after a gateway restart.
*
* An orphaned session is one where:
* 1. It has an active (not ended) entry in the subagent run registry
* 2. Its session store entry has `abortedLastRun: true`
*
* For each orphaned session found, we:
* 1. Clear the `abortedLastRun` flag
* 2. Send a synthetic resume message to trigger a new LLM turn
*/
async function recoverOrphanedSubagentSessions(params) {
	const result = {
		recovered: 0,
		failed: 0,
		skipped: 0,
		failedRuns: []
	};
	const resumedSessionKeys = params.resumedSessionKeys ?? /* @__PURE__ */ new Set();
	const pendingStaleFinalizations = params.pendingStaleFinalizations ?? /* @__PURE__ */ new Map();
	const configChangePattern = /operator\.json|operator gateway restart|config\.patch/i;
	try {
		const activeRuns = params.getActiveRuns();
		if (activeRuns.size === 0) return result;
		let cfg;
		const scanNow = Date.now();
		const runEntries = [...activeRuns.entries()].toSorted(([, left], [, right]) => {
			const leftIsStale = require_subagent_run_liveness.isStaleUnendedSubagentRun(left, scanNow);
			const rightIsStale = require_subagent_run_liveness.isStaleUnendedSubagentRun(right, scanNow);
			return Number(rightIsStale) - Number(leftIsStale);
		});
		for (const [runId, runRecord] of runEntries) {
			const childSessionKey = runRecord.childSessionKey?.trim();
			if (!childSessionKey) continue;
			const now = scanNow;
			if (runRecord.terminalOwner === "interrupted-recovery" && Number.isFinite(runRecord.endedAt) && runRecord.outcome?.status === "error" && runRecord.endedReason === "subagent-error" && runRecord.pauseReason !== "sessions_yield") {
				const recoveryError = runRecord.outcome?.status === "error" ? runRecord.outcome.error ?? "subagent run interrupted by gateway restart" : "subagent run interrupted by gateway restart";
				try {
					if (await require_subagent_registry_steer_runtime.finalizeInterruptedSubagentRun({
						runId,
						error: recoveryError,
						endedAt: runRecord.endedAt
					}) === 0) {
						result.failed++;
						result.failedRuns.push({
							runId,
							childSessionKey,
							error: recoveryError
						});
					} else {
						pendingStaleFinalizations.delete(runId);
						result.skipped++;
					}
				} catch (err) {
					const error = require_errors.formatErrorMessage(err);
					log.warn(`replay interrupted terminal ${runId}: ${error}`);
					result.failed++;
					result.failedRuns.push({
						runId,
						childSessionKey,
						error
					});
				}
				continue;
			}
			const pendingStaleError = pendingStaleFinalizations.get(runId);
			if (pendingStaleError) {
				try {
					if (await require_subagent_registry_steer_runtime.finalizeInterruptedSubagentRun({
						runId,
						error: pendingStaleError
					}) === 0) {
						result.failed++;
						result.failedRuns.push({
							runId,
							childSessionKey,
							error: pendingStaleError
						});
					} else {
						pendingStaleFinalizations.delete(runId);
						result.skipped++;
					}
				} catch (err) {
					const error = require_errors.formatErrorMessage(err);
					log.warn(`retry stale terminal ${runId}: ${error}`);
					result.failed++;
					result.failedRuns.push({
						runId,
						childSessionKey,
						error
					});
				}
				continue;
			}
			if (resumedSessionKeys.has(childSessionKey)) {
				result.skipped++;
				continue;
			}
			try {
				cfg ??= require_io.getRuntimeConfig();
				const agentId = require_session_key.resolveAgentIdFromSessionKey(childSessionKey);
				const storePath = require_paths.resolveStorePath(cfg.session?.store, { agentId });
				const entry = loadRecoverySessionEntry({
					storePath,
					childSessionKey
				});
				if (!entry) {
					result.skipped++;
					continue;
				}
				if (isLegacyRestartInterruptedTimeout(runRecord, entry)) reclassifyLegacyRestartInterruptedRun(runRecord);
				if (typeof runRecord.endedAt === "number" && runRecord.endedAt > 0) {
					result.skipped++;
					continue;
				}
				if (!entry.abortedLastRun) {
					result.skipped++;
					continue;
				}
				if (require_subagent_run_liveness.isStaleUnendedSubagentRun(runRecord, now)) {
					const staleStartedAt = require_subagent_run_liveness.getSubagentSessionStartedAt(runRecord) ?? now;
					const staleError = `stale aborted subagent run not resumed (${Math.round((now - staleStartedAt) / 1e3)}s old, exceeds stale-run window)`;
					try {
						if (await require_subagent_registry_steer_runtime.finalizeInterruptedSubagentRun({
							runId,
							error: staleError
						}) === 0) {
							pendingStaleFinalizations.set(runId, staleError);
							result.failed++;
							result.failedRuns.push({
								runId,
								childSessionKey,
								error: staleError
							});
						} else {
							pendingStaleFinalizations.delete(runId);
							result.skipped++;
						}
					} catch (err) {
						const error = require_errors.formatErrorMessage(err);
						log.warn(`finalize stale run ${runId}: ${error}`);
						pendingStaleFinalizations.set(runId, staleError);
						result.failed++;
						result.failedRuns.push({
							runId,
							childSessionKey,
							error
						});
					}
					continue;
				}
				const recoveryGate = require_subagent_recovery_state.evaluateSubagentRecoveryGate(entry, now);
				if (!recoveryGate.allowed) {
					if (recoveryGate.shouldMarkWedged) try {
						const updated = await patchRecoverySessionEntry({
							storePath,
							childSessionKey,
							update: (current) => {
								require_subagent_recovery_state.markSubagentRecoveryWedged({
									entry: current,
									now,
									runId,
									reason: recoveryGate.reason
								});
							}
						});
						if (updated) Object.assign(entry, updated);
					} catch (err) {
						log.warn(`failed to persist wedged subagent recovery marker for ${childSessionKey}: ${String(err)}`);
					}
					log.warn(`skipping orphan recovery for ${childSessionKey}: ${recoveryGate.reason}`);
					result.skipped++;
					result.failedRuns.push({
						runId,
						childSessionKey,
						error: recoveryGate.reason
					});
					continue;
				}
				log.info(`found orphaned subagent session: ${childSessionKey} (run=${runId})`);
				const messages = await require_session_transcript_readers.readSessionMessagesAsync({
					agentId: require_session_key.resolveAgentIdFromSessionKey(childSessionKey),
					sessionEntry: entry,
					sessionId: entry.sessionId,
					sessionKey: childSessionKey,
					storePath
				}, {
					mode: "recent",
					maxMessages: 200,
					maxBytes: 1024 * 1024
				});
				const lastHumanMessage = [...messages].toReversed().find((msg) => msg?.role === "user");
				const configChangeDetected = messages.some((msg) => {
					if (msg?.role !== "assistant") return false;
					const text = extractMessageText(msg);
					return typeof text === "string" && configChangePattern.test(text);
				});
				const resumeResult = await resumeOrphanedSession({
					gatewayRuntime: params.gatewayRuntime,
					sessionKey: childSessionKey,
					task: runRecord.task,
					lastHumanMessage: extractMessageText(lastHumanMessage),
					configChangeHint: configChangeDetected ? "\n\n[config changes from your previous run were already applied — do not re-modify operator.json or restart the gateway]" : void 0,
					originalRunId: runId,
					originalRun: runRecord
				});
				if (resumeResult.resumed) {
					resumedSessionKeys.add(childSessionKey);
					try {
						await patchRecoverySessionEntry({
							storePath,
							childSessionKey,
							update: (current) => {
								current.abortedLastRun = false;
								require_subagent_recovery_state.markSubagentRecoveryAttempt({
									entry: current,
									now: Date.now(),
									runId,
									attempt: recoveryGate.nextAttempt
								});
								current.updatedAt = Date.now();
							}
						});
					} catch (err) {
						log.warn(`resume succeeded but failed to update session store for ${childSessionKey}: ${String(err)}`);
					}
					result.recovered++;
				} else {
					log.warn(`resume failed for ${childSessionKey}; abortedLastRun flag preserved for retry on next restart`);
					result.failed++;
					result.failedRuns.push({
						runId,
						childSessionKey,
						error: resumeResult.error
					});
				}
			} catch (err) {
				const error = require_errors.formatErrorMessage(err);
				log.warn(`error processing orphaned session ${childSessionKey}: ${error}`);
				result.failed++;
				result.failedRuns.push({
					runId,
					childSessionKey,
					error
				});
			}
		}
	} catch (err) {
		log.warn(`orphan recovery scan failed: ${String(err)}`);
		if (result.failed === 0) result.failed = 1;
	}
	if (result.recovered > 0 || result.failed > 0) log.info(`orphan recovery complete: recovered=${result.recovered} failed=${result.failed} skipped=${result.skipped}`);
	return result;
}
/** Maximum number of retry attempts for orphan recovery. */
const MAX_RECOVERY_RETRIES = 3;
/** Backoff multiplier between retries (exponential). */
const RETRY_BACKOFF_MULTIPLIER = 2;
/** Separate durable-terminal attempts after session recovery is exhausted. */
const MAX_TERMINAL_FINALIZE_ATTEMPTS = 3;
function buildRecoveryFailureMessage(params) {
	const base = `Subagent run was interrupted by a gateway restart or connection loss. Automatic recovery failed after ${params.attempts} attempt${params.attempts === 1 ? "" : "s"}. Please retry.`;
	const detail = params.error?.trim();
	if (!detail) return base;
	return `${base} (${detail})`;
}
async function finalizeInterruptedRunWithRetry(params) {
	let delayMs = Math.max(1, params.initialDelayMs);
	for (let attempt = 1; attempt <= MAX_TERMINAL_FINALIZE_ATTEMPTS; attempt += 1) {
		try {
			if (await require_subagent_registry_steer_runtime.finalizeInterruptedSubagentRun({
				runId: params.runId,
				error: params.error
			}) > 0) return true;
		} catch {}
		if (attempt < MAX_TERMINAL_FINALIZE_ATTEMPTS) {
			await new Promise((resolve) => {
				setTimeout(resolve, delayMs).unref?.();
			});
			delayMs *= RETRY_BACKOFF_MULTIPLIER;
		}
	}
	return false;
}
/**
* Schedule orphan recovery after a delay, with retry logic.
* The delay gives the gateway time to fully bootstrap after restart.
* If recovery fails (e.g. gateway not yet ready), retries with exponential backoff.
*/
function scheduleOrphanRecovery(params) {
	const initialDelay = params.delayMs ?? DEFAULT_RECOVERY_DELAY_MS;
	const maxRetries = params.maxRetries ?? MAX_RECOVERY_RETRIES;
	const resumedSessionKeys = /* @__PURE__ */ new Set();
	const pendingStaleFinalizations = /* @__PURE__ */ new Map();
	const attemptRecovery = (attempt, delay) => {
		setTimeout(() => {
			require_gateway_work_admission.runWithGatewayIndependentRootWorkAdmission(async () => {
				const gatewayRuntime = params.getGatewayRuntime();
				if (!gatewayRuntime) {
					if (attempt < maxRetries) attemptRecovery(attempt + 1, delay * RETRY_BACKOFF_MULTIPLIER);
					return;
				}
				const result = await recoverOrphanedSubagentSessions({
					gatewayRuntime,
					getActiveRuns: params.getActiveRuns,
					resumedSessionKeys,
					pendingStaleFinalizations
				});
				if (result.failed > 0 && attempt < maxRetries) {
					const nextDelay = delay * RETRY_BACKOFF_MULTIPLIER;
					log.info(`orphan recovery had ${result.failed} failure(s); retrying in ${nextDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
					attemptRecovery(attempt + 1, nextDelay);
					return;
				}
				if (result.failedRuns.length === 0) return;
				const attempts = attempt + 1;
				const incomplete = (await Promise.all(result.failedRuns.map(async (run) => ({
					runId: run.runId,
					completed: await finalizeInterruptedRunWithRetry({
						runId: run.runId,
						error: buildRecoveryFailureMessage({
							attempts,
							error: run.error
						}),
						initialDelayMs: delay
					})
				})))).filter((terminal) => !terminal.completed).map((terminal) => terminal.runId);
				if (incomplete.length > 0) log.warn(`orphan recovery exhausted with ${incomplete.length} interrupted terminal projection(s) incomplete`, { runIds: incomplete });
			}).catch((err) => {
				if (attempt < maxRetries) {
					const nextDelay = delay * RETRY_BACKOFF_MULTIPLIER;
					log.warn(`scheduled orphan recovery failed: ${String(err)}; retrying in ${nextDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
					attemptRecovery(attempt + 1, nextDelay);
				} else log.warn(`scheduled orphan recovery failed after ${maxRetries} retries: ${String(err)}`);
			});
		}, delay).unref?.();
	};
	attemptRecovery(0, initialDelay);
}
//#endregion
exports.scheduleOrphanRecovery = scheduleOrphanRecovery;
