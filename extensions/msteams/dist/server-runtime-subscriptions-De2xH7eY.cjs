const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_tool_call_shared = require("./tool-call-shared-BusxbfAk.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_session_lifecycle_events = require("./session-lifecycle-events-DldGnQfO.cjs");
const require_transcript_events = require("./transcript-events-C9OOwQkF.cjs");
const require_message_audit_events = require("./message-audit-events-CKKmnGez.cjs");
const require_agent_run_terminal_outcome = require("./agent-run-terminal-outcome-BNehmvQh.cjs");
const require_chat_abort = require("./chat-abort-CWaOZDr9.cjs");
const require_session_active_runs = require("./session-active-runs-DHK8blJg.cjs");
const require_heartbeat_events = require("./heartbeat-events-DGL6ZKoG.cjs");
const require_task_summary = require("./task-summary-DF5_WpVN.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let node_worker_threads = require("node:worker_threads");
//#region src/audit/audit-config.ts
/**
* The ledger is on by default: an audit trail enabled only after an incident
* cannot explain the incident. `audit.enabled: false` stops new event inserts after
* restart; audit queries still serve retained rows until they expire.
*/
function isAuditLedgerEnabled(cfg) {
	return cfg?.audit?.enabled !== false;
}
/** Message metadata remains an explicit opt-in inside the default-on ledger. */
function resolveAuditMessageMode(cfg) {
	return cfg?.audit?.messages ?? "off";
}
//#endregion
//#region src/audit/audit-event-writer.ts
/** Non-blocking worker-thread writer for Gateway audit metadata. */
const MAX_PENDING_AUDIT_EVENTS = 4096;
const AUDIT_WRITER_SHUTDOWN_TIMEOUT_MS = require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS + 5e3;
function resolveAuditEventWriterUrl(currentModuleUrl = require("url").pathToFileURL(__filename).href) {
	const currentPath = (0, node_url.fileURLToPath)(currentModuleUrl);
	const distIndex = currentPath.replaceAll(node_path.default.sep, "/").lastIndexOf("/dist/");
	if (distIndex >= 0) {
		const distRoot = currentPath.slice(0, distIndex + 6);
		return (0, node_url.pathToFileURL)(node_path.default.join(distRoot, "audit", "audit-event-writer.worker.js"));
	}
	const extension = node_path.default.extname(currentPath) || ".js";
	return new URL(`./audit-event-writer.worker${extension}`, currentModuleUrl);
}
/** Start one bounded worker queue. SQLite contention never blocks the agent-event callback. */
function createAuditEventWriter(options = {}) {
	const workerUrl = options.workerUrl ?? resolveAuditEventWriterUrl();
	const sourceWorkerExecArgv = workerUrl.pathname.endsWith(".ts") ? ["--import", "tsx"] : void 0;
	const maxPending = Math.max(1, Math.floor(options.maxPending ?? MAX_PENDING_AUDIT_EVENTS));
	let worker;
	try {
		worker = new node_worker_threads.Worker(workerUrl, {
			workerData: { stateDir: options.stateDir ?? require_paths.resolveStateDir(process.env) },
			execArgv: sourceWorkerExecArgv
		});
	} catch (error) {
		options.onError?.(error instanceof Error ? error.message : String(error));
		return {
			ready: Promise.resolve(),
			record: () => false,
			stop: async () => {}
		};
	}
	worker.unref?.();
	let pending = 0;
	let stopped = false;
	let unavailable = false;
	let readyResolved = false;
	let resolveReady;
	const ready = new Promise((resolve) => {
		resolveReady = resolve;
	});
	let resolveStop;
	let stopTimer;
	const markReady = () => {
		if (!readyResolved) {
			readyResolved = true;
			resolveReady();
		}
	};
	const finishStop = () => {
		if (stopTimer) {
			clearTimeout(stopTimer);
			stopTimer = void 0;
		}
		const finish = resolveStop;
		resolveStop = void 0;
		finish?.();
	};
	const fail = (error) => {
		options.onError?.(error instanceof Error ? error.message : String(error));
	};
	worker.on("message", (message) => {
		switch (message.type) {
			case "ready":
				markReady();
				return;
			case "recorded":
				pending = Math.max(0, pending - 1);
				return;
			case "record-error":
				pending = Math.max(0, pending - 1);
				fail(message.error);
				return;
			case "maintenance-error":
				fail(message.error);
				return;
			case "stopped":
				pending = 0;
				markReady();
				finishStop();
		}
	});
	worker.on("error", (error) => {
		unavailable = true;
		fail(error);
		markReady();
		finishStop();
	});
	worker.on("exit", (code) => {
		unavailable = true;
		if (!stopped) fail(`audit event writer exited with code ${code}`);
		markReady();
		finishStop();
	});
	return {
		ready,
		record: (input) => {
			if (stopped || unavailable || pending >= maxPending) {
				if (!stopped) fail(unavailable ? "audit event writer is unavailable; dropping metadata" : `audit event queue is full (${maxPending}); dropping metadata`);
				return false;
			}
			pending += 1;
			try {
				worker.postMessage({
					type: "record",
					input
				});
				return true;
			} catch (error) {
				pending -= 1;
				unavailable = true;
				fail(error);
				return false;
			}
		},
		stop: async () => {
			if (stopped) return;
			stopped = true;
			if (unavailable) return;
			await new Promise((resolve) => {
				resolveStop = resolve;
				stopTimer = setTimeout(() => {
					fail("audit event writer shutdown timed out; pending metadata may be lost");
					worker.terminate();
					finishStop();
				}, AUDIT_WRITER_SHUTDOWN_TIMEOUT_MS);
				try {
					worker.postMessage({ type: "stop" });
				} catch (error) {
					fail(error);
					finishStop();
				}
			});
		}
	};
}
//#endregion
//#region src/audit/agent-event-audit.ts
/** Redaction-safe projection from live agent events into durable audit metadata. */
const runProvenance = /* @__PURE__ */ new Map();
const MAX_TRACKED_RUN_PROVENANCE = 1024;
const log$1 = require_subsystem.createSubsystemLogger("audit/events");
let persistenceFailureWarned$1 = false;
function nonEmptyString(value) {
	return typeof value === "string" && value.length > 0 ? value : void 0;
}
function auditToolName(value) {
	const toolName = nonEmptyString(value)?.trim();
	if (!toolName) return;
	return require_tool_call_shared.isAllowedToolCallName(toolName, null) ? toolName : "unknown";
}
function auditToolCallId(value) {
	const toolCallId = nonEmptyString(value);
	if (!toolCallId) return;
	return `sha256:${(0, node_crypto.createHash)("sha256").update(toolCallId).digest("hex")}`;
}
function legacyAuditSourceId(params) {
	return `${params.runId}:${params.sourceSequence}:${params.occurredAt}:${params.action}`;
}
function rememberRunProvenance(runId, provenance) {
	runProvenance.delete(runId);
	runProvenance.set(runId, provenance);
	while (runProvenance.size > MAX_TRACKED_RUN_PROVENANCE) {
		const oldestRunId = runProvenance.keys().next().value;
		if (oldestRunId === void 0) break;
		runProvenance.delete(oldestRunId);
	}
}
function resolveProvenance(runId, event) {
	const remembered = runProvenance.get(runId);
	const sessionKey = nonEmptyString(event.sessionKey) ?? remembered?.sessionKey;
	const sessionId = nonEmptyString(event.sessionId) ?? remembered?.sessionId;
	const eventAgentId = nonEmptyString(event.agentId);
	const sessionAgentId = sessionKey ? require_session_key.parseAgentSessionKey(sessionKey)?.agentId : void 0;
	const agentId = eventAgentId ?? sessionAgentId ?? remembered?.agentId ?? "unknown";
	return {
		actorType: eventAgentId || sessionAgentId ? "agent" : remembered?.actorType ?? "system",
		agentId,
		sessionKey,
		sessionId
	};
}
function resolveToolProvenance(runId, event) {
	const observed = resolveProvenance(runId, event);
	const remembered = runProvenance.get(runId);
	if (!remembered) return observed;
	return {
		...remembered,
		sessionKey: remembered.sessionKey ?? observed.sessionKey,
		sessionId: remembered.sessionId ?? observed.sessionId
	};
}
function classifyRunTerminal(data, phase) {
	const stopReason = nonEmptyString(data.stopReason);
	const timeoutPhase = require_agent_run_terminal_outcome.normalizeAgentRunTimeoutPhase(data.timeoutPhase);
	const terminalStatus = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(data.status);
	const explicitlyTimedOut = stopReason === "timeout" || timeoutPhase !== void 0 || terminalStatus === "timeout" || terminalStatus === "timed_out";
	const explicitlyCancelled = !explicitlyTimedOut && (data.aborted === true || stopReason === "aborted" || terminalStatus === "cancelled" || terminalStatus === "canceled" || terminalStatus === "aborted");
	const outcome = require_agent_run_terminal_outcome.buildAgentRunTerminalOutcome({
		status: explicitlyTimedOut ? "timeout" : phase === "error" ? "error" : explicitlyCancelled ? "error" : "ok",
		stopReason: explicitlyCancelled && !explicitlyTimedOut ? "stop" : stopReason,
		livenessState: data.livenessState,
		timeoutPhase,
		providerStarted: data.providerStarted,
		startedAt: data.startedAt,
		endedAt: data.endedAt
	});
	if (outcome.reason === "cancelled" || outcome.reason === "aborted") return {
		outcome,
		status: "cancelled",
		errorCode: "run_cancelled"
	};
	if (outcome.reason === "hard_timeout" || outcome.reason === "timed_out") return {
		outcome,
		status: "timed_out",
		errorCode: "run_timed_out"
	};
	if (outcome.reason === "blocked") return {
		outcome,
		status: "blocked",
		errorCode: "run_blocked"
	};
	return outcome.reason === "completed" ? {
		outcome,
		status: "succeeded"
	} : {
		outcome,
		status: "failed",
		errorCode: "run_failed"
	};
}
function projectAgentEvent(event) {
	const runId = nonEmptyString(event.runId);
	const phase = nonEmptyString(event.data.phase);
	if (!runId || !phase) return;
	const provenance = resolveProvenance(runId, event);
	if (event.stream === "lifecycle" && phase === "start") {
		rememberRunProvenance(runId, provenance);
		const occurredAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(event.data.startedAt) ?? event.ts;
		const action = "agent.run.started";
		return { input: {
			sourceId: legacyAuditSourceId({
				runId,
				sourceSequence: event.seq,
				occurredAt,
				action
			}),
			sourceSequence: event.seq,
			occurredAt,
			kind: "agent_run",
			action,
			status: "started",
			actorType: provenance.actorType,
			actorId: provenance.agentId,
			agentId: provenance.agentId,
			...provenance.sessionKey ? { sessionKey: provenance.sessionKey } : {},
			...provenance.sessionId ? { sessionId: provenance.sessionId } : {},
			runId
		} };
	}
	if (event.stream === "lifecycle" && (phase === "end" || phase === "error")) {
		rememberRunProvenance(runId, provenance);
		const { outcome, ...terminal } = classifyRunTerminal(event.data, phase);
		const occurredAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(event.data.endedAt) ?? event.ts;
		const action = "agent.run.finished";
		return {
			input: {
				sourceId: legacyAuditSourceId({
					runId,
					sourceSequence: event.seq,
					occurredAt,
					action
				}),
				sourceSequence: event.seq,
				occurredAt,
				kind: "agent_run",
				action,
				...terminal,
				actorType: provenance.actorType,
				actorId: provenance.agentId,
				agentId: provenance.agentId,
				...provenance.sessionKey ? { sessionKey: provenance.sessionKey } : {},
				...provenance.sessionId ? { sessionId: provenance.sessionId } : {},
				runId
			},
			terminal: {
				outcome,
				phase
			}
		};
	}
}
/** Project the complete trusted tool-execution lifecycle without private diagnostic content. */
function projectToolExecutionEventToAudit(event) {
	if (event.type === "tool.execution.blocked" && event.deniedReason === "unsupported_tool_schema" && !nonEmptyString(event.toolCallId)) return;
	const runId = nonEmptyString(event.runId);
	const toolName = auditToolName(event.toolName);
	if (!runId || !toolName) return;
	const toolCallId = auditToolCallId(event.toolCallId);
	const provenance = resolveToolProvenance(runId, event);
	const occurredAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(event.sourceTimestampMs) ?? event.ts;
	const attribution = {
		sourceSequence: event.seq,
		occurredAt,
		kind: "tool_action",
		actorType: provenance.actorType,
		actorId: provenance.agentId,
		agentId: provenance.agentId,
		...provenance.sessionKey ? { sessionKey: provenance.sessionKey } : {},
		...provenance.sessionId ? { sessionId: provenance.sessionId } : {},
		runId,
		...toolCallId ? { toolCallId } : {},
		toolName
	};
	if (event.type === "tool.execution.started") {
		const action = "tool.action.started";
		return {
			sourceId: legacyAuditSourceId({
				runId,
				sourceSequence: event.seq,
				occurredAt,
				action
			}),
			...attribution,
			action,
			status: "started"
		};
	}
	const errorCategory = event.type === "tool.execution.error" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(event.errorCategory) : void 0;
	const terminalReason = event.type === "tool.execution.error" ? event.terminalReason : void 0;
	const diagnosticErrorCode = event.type === "tool.execution.error" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(event.errorCode) : void 0;
	const toolCancelled = terminalReason === "cancelled" || terminalReason === void 0 && (errorCategory === "aborted" || errorCategory === "aborterror" || errorCategory === "cancelled" || errorCategory === "canceled");
	const toolTimedOut = terminalReason === "timed_out";
	const terminal = event.type === "tool.execution.completed" ? { status: "succeeded" } : event.type === "tool.execution.blocked" ? {
		status: "blocked",
		errorCode: "tool_blocked"
	} : diagnosticErrorCode === "tool_outcome_unknown" ? {
		status: "unknown",
		errorCode: "tool_outcome_unknown"
	} : toolCancelled ? {
		status: "cancelled",
		errorCode: "tool_cancelled"
	} : toolTimedOut ? {
		status: "timed_out",
		errorCode: "tool_timed_out"
	} : {
		status: "failed",
		errorCode: "tool_failed"
	};
	const action = "tool.action.finished";
	return {
		sourceId: legacyAuditSourceId({
			runId,
			sourceSequence: event.seq,
			occurredAt,
			action
		}),
		...attribution,
		action,
		...terminal
	};
}
/** Create the Gateway-owned non-blocking audit projection and persistence handle. */
function createAgentEventAuditRecorder(options) {
	const writer = options?.writer ?? createAuditEventWriter({
		...options?.stateDir ? { stateDir: options.stateDir } : {},
		onError: (error) => {
			if (!persistenceFailureWarned$1) {
				persistenceFailureWarned$1 = true;
				log$1.warn(`audit event persistence failed: ${error}`);
			}
		}
	});
	const terminalSettleMs = Math.max(0, Math.floor(options?.terminalSettleMs ?? 15e3));
	const pendingTerminals = /* @__PURE__ */ new Map();
	const openRunInstances = /* @__PURE__ */ new Set();
	const settledRunInstances = /* @__PURE__ */ new Set();
	const rememberSettled = (runInstance) => {
		settledRunInstances.delete(runInstance);
		settledRunInstances.add(runInstance);
		if (settledRunInstances.size > MAX_TRACKED_RUN_PROVENANCE) {
			const oldest = settledRunInstances.values().next().value;
			if (oldest !== void 0) settledRunInstances.delete(oldest);
		}
	};
	const clearPending = (runInstance) => {
		const pending = pendingTerminals.get(runInstance);
		if (!pending) return;
		clearTimeout(pending.timer);
		pendingTerminals.delete(runInstance);
	};
	const flushPending = (runInstance) => {
		const pending = pendingTerminals.get(runInstance);
		if (!pending) return;
		clearPending(runInstance);
		openRunInstances.delete(runInstance);
		if (writer.record(pending.input)) rememberSettled(runInstance);
	};
	const scheduleTerminal = (runInstance, incoming) => {
		const existing = pendingTerminals.get(runInstance);
		let selected = incoming;
		if (existing) {
			if (existing.phase === "error" && incoming.phase === "end" && incoming.outcome.reason === "completed") selected = existing;
			else selected = require_agent_run_terminal_outcome.mergeAgentRunTerminalOutcome(existing.outcome, incoming.outcome) === existing.outcome ? existing : incoming;
			clearTimeout(existing.timer);
		}
		const timer = setTimeout(() => flushPending(runInstance), terminalSettleMs);
		timer.unref?.();
		pendingTerminals.delete(runInstance);
		pendingTerminals.set(runInstance, {
			...selected,
			timer
		});
		if (pendingTerminals.size > MAX_TRACKED_RUN_PROVENANCE) {
			const oldest = pendingTerminals.keys().next().value;
			if (oldest !== void 0) flushPending(oldest);
		}
	};
	return {
		record: (event) => {
			const projection = projectAgentEvent(event);
			if (!projection) return;
			const runInstance = `${event.lifecycleGeneration ?? "unknown"}\0${event.runId}`;
			if (!projection.terminal) {
				const alreadyOpen = openRunInstances.has(runInstance);
				clearPending(runInstance);
				settledRunInstances.delete(runInstance);
				if (alreadyOpen) return;
				openRunInstances.add(runInstance);
				writer.record(projection.input);
				return;
			}
			if (settledRunInstances.has(runInstance)) return;
			if (projection.terminal.outcome.reason === "completed" && !pendingTerminals.has(runInstance)) {
				openRunInstances.delete(runInstance);
				if (writer.record(projection.input)) rememberSettled(runInstance);
				return;
			}
			scheduleTerminal(runInstance, {
				input: projection.input,
				...projection.terminal
			});
		},
		recordTool: (event) => {
			const input = projectToolExecutionEventToAudit(event);
			if (input) writer.record(input);
		},
		stop: async () => {
			for (const runInstance of pendingTerminals.keys()) flushPending(runInstance);
			await writer.stop();
		}
	};
}
//#endregion
//#region src/audit/audit-recorder.ts
/** Gateway-owned recorder joining trusted run, tool, and message lifecycle streams. */
const log = require_subsystem.createSubsystemLogger("audit/events");
let persistenceFailureWarned = false;
function createAuditEventRecorder(options) {
	let nextAcceptedMessageSequence = 0;
	const writer = options.writer ?? createAuditEventWriter({
		...options.stateDir ? { stateDir: options.stateDir } : {},
		onError: (error) => {
			if (!persistenceFailureWarned) {
				persistenceFailureWarned = true;
				log.warn(`audit event persistence failed: ${error}`);
			}
		}
	});
	return {
		...createAgentEventAuditRecorder({
			writer,
			...options.terminalSettleMs !== void 0 ? { terminalSettleMs: options.terminalSettleMs } : {}
		}),
		recordMessage: (event) => {
			if (options.messageMode === "off") return;
			if (options.messageMode === "direct" && event.conversationKind !== "direct") return;
			nextAcceptedMessageSequence += 1;
			writer.record({
				...event,
				sourceId: event.sourceId?.trim() || `message:${(0, node_crypto.randomUUID)()}`,
				sourceSequence: nextAcceptedMessageSequence
			});
		}
	};
}
//#endregion
//#region src/gateway/server-runtime-subscriptions.ts
function dispatchEventHandler(params) {
	params.loadHandler().then((handler) => handler(params.event)).catch((error) => {
		params.log.warn(params.failureMessage, {
			...params.context,
			error
		});
	});
}
/** Register gateway runtime event subscriptions and return unsubscribe handles. */
function startGatewayEventSubscriptions(params) {
	const runtimeConfig = require_io.getRuntimeConfig();
	const auditEnabled = isAuditLedgerEnabled(runtimeConfig);
	const auditMessageMode = resolveAuditMessageMode(runtimeConfig);
	const auditRecorder = createAuditEventRecorder({ messageMode: auditEnabled ? auditMessageMode : "off" });
	const unsubscribePrivateAuditEvents = auditEnabled ? require_agent_events.onAgentAuditEvent(auditRecorder.record) : void 0;
	const unsubscribeToolAuditEvents = auditEnabled ? require_diagnostic_events.onTrustedToolExecutionEvent(auditRecorder.recordTool) : void 0;
	const unsubscribeMessageAuditEvents = auditEnabled && auditMessageMode !== "off" ? require_message_audit_events.onTrustedMessageAuditEvent(auditRecorder.recordMessage) : void 0;
	const agentEventHandlerLoader = require_lazy_promise.createLazyPromiseLoader(() => {
		return Promise.all([Promise.resolve().then(() => require("./server-chat-DAMo3SjJ.cjs")), Promise.resolve().then(() => require("./server-session-key-BqgIl_27.cjs")).then((n) => n.server_session_key_exports)]).then(([{ createAgentEventHandler }, { resolveSessionKeyForRun }]) => createAgentEventHandler({
			broadcast: params.broadcast,
			broadcastToConnIds: params.broadcastToConnIds,
			nodeSendToSession: params.nodeSendToSession,
			agentRunSeq: params.agentRunSeq,
			chatRunState: params.chatRunState,
			resolveSessionKeyForRun,
			clearAgentRunContext: require_agent_events.clearAgentRunContext,
			toolEventRecipients: params.toolEventRecipients,
			sessionEventSubscribers: params.sessionEventSubscribers,
			sessionMessageSubscribers: params.sessionMessageSubscribers,
			updateRunToolErrorSummary: ({ runId, clientRunId, summary }) => {
				for (const candidateRunId of /* @__PURE__ */ new Set([runId, clientRunId])) {
					const entry = params.chatAbortControllers.get(candidateRunId);
					if (entry) entry.toolErrorSummary = summary;
				}
			},
			clearTrackedActiveRun: ({ runId, clientRunId }) => {
				const candidateRunIds = runId === clientRunId ? [runId] : [runId, clientRunId];
				for (const candidateRunId of candidateRunIds) {
					const entry = params.chatAbortControllers.get(candidateRunId);
					if (entry) {
						entry.projectSessionActive = false;
						entry.projectSessionTerminalPending = false;
						entry.projectSessionTerminalPersisted = false;
						queueMicrotask(() => {
							if (params.chatAbortControllers.get(candidateRunId) === entry && entry.registrationCleanupRequested === true && !entry.projectSessionTerminalPersistence) require_chat_abort.removeChatAbortControllerEntry(params.chatAbortControllers, candidateRunId, entry);
						});
					}
				}
			},
			markTrackedRunTerminalPersisted: ({ runId, clientRunId }) => {
				const candidateRunIds = runId === clientRunId ? [runId] : [runId, clientRunId];
				for (const candidateRunId of candidateRunIds) {
					params.restartRecoveryCandidates.delete(candidateRunId);
					const entry = params.chatAbortControllers.get(candidateRunId);
					if (entry) {
						entry.projectSessionTerminalPending = false;
						entry.projectSessionTerminalPersisted = true;
						entry.projectSessionTerminalPersistence = void 0;
					}
				}
			},
			trackTrackedRunTerminalPersistence: ({ runId, clientRunId, sessionId: terminalSessionId, observedAt, persistence }) => {
				const candidateRunIds = runId === clientRunId ? [runId] : [runId, clientRunId];
				for (const candidateRunId of candidateRunIds) {
					const entry = params.chatAbortControllers.get(candidateRunId);
					if (entry) {
						entry.projectSessionTerminalPending = false;
						entry.projectSessionTerminalPersistence = persistence;
						if (entry.registrationCleanupRequested === true) persistence.catch(() => void 0).then(() => {
							if (params.chatAbortControllers.get(candidateRunId) === entry) require_chat_abort.removeChatAbortControllerEntry(params.chatAbortControllers, candidateRunId, entry);
						});
						const lifecycleGeneration = entry.lifecycleGeneration?.trim();
						const sessionKey = entry.sessionKey.trim();
						const sessionId = terminalSessionId?.trim() || entry.sessionId.trim();
						if (entry.controlUiVisible !== false && lifecycleGeneration && sessionKey && sessionId) persistence.catch(() => {
							params.restartRecoveryCandidates.set(candidateRunId, {
								runId: candidateRunId,
								lifecycleGeneration,
								sessionKey,
								sessionId,
								observedAt
							});
						});
					}
				}
			},
			isChatSendRunActive: (runId) => {
				const entry = params.chatAbortControllers.get(runId);
				return entry !== void 0 && entry.kind !== "agent";
			},
			resolveActiveLifecycleGenerationForRun: (runId) => params.chatAbortControllers.get(runId)?.lifecycleGeneration,
			resolveSessionActiveRunState: (session) => require_session_active_runs.resolveVisibleActiveSessionRunState({
				context: params,
				...session,
				defaultAgentId: require_agent_scope_config.resolveDefaultAgentId(require_io.getRuntimeConfig())
			})
		}));
	}, { cacheRejections: true });
	const getAgentEventHandler = agentEventHandlerLoader.load;
	const getSessionEventsModule = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./server-session-events-BD0iFpa6.cjs")), { cacheRejections: true });
	let transcriptUpdateHandlerPromise = null;
	const getTranscriptUpdateHandler = () => {
		transcriptUpdateHandlerPromise ??= getSessionEventsModule().then(({ createTranscriptUpdateBroadcastHandler }) => createTranscriptUpdateBroadcastHandler({
			broadcastToConnIds: params.broadcastToConnIds,
			sessionEventSubscribers: params.sessionEventSubscribers,
			sessionMessageSubscribers: params.sessionMessageSubscribers,
			chatAbortControllers: params.chatAbortControllers
		}));
		return transcriptUpdateHandlerPromise;
	};
	let lifecycleEventHandlerPromise = null;
	const getLifecycleEventHandler = () => {
		lifecycleEventHandlerPromise ??= getSessionEventsModule().then(({ createLifecycleEventBroadcastHandler }) => createLifecycleEventBroadcastHandler({
			broadcastToConnIds: params.broadcastToConnIds,
			sessionEventSubscribers: params.sessionEventSubscribers,
			chatAbortControllers: params.chatAbortControllers
		}));
		return lifecycleEventHandlerPromise;
	};
	const unsubscribeAgentEvents = require_agent_events.onAgentRuntimeEvent((evt) => {
		if (auditEnabled) auditRecorder.record(evt);
		const lifecyclePhase = evt.stream === "lifecycle" && typeof evt.data?.phase === "string" ? evt.data.phase : void 0;
		if (lifecyclePhase === "end" || lifecyclePhase === "error") {
			const clientRunId = (evt.contextClaimId ? void 0 : params.chatRunState.registry.peek(evt.runId))?.clientRunId ?? evt.runId;
			const candidateRunIds = evt.runId === clientRunId ? [evt.runId] : [evt.runId, clientRunId];
			for (const candidateRunId of candidateRunIds) {
				const entry = params.chatAbortControllers.get(candidateRunId);
				const eventLifecycleGeneration = evt.lifecycleGeneration?.trim();
				if (entry && (!eventLifecycleGeneration || !entry.lifecycleGeneration || entry.lifecycleGeneration === eventLifecycleGeneration)) {
					entry.projectSessionTerminalPending = true;
					entry.projectSessionTerminalObservedAt = typeof evt.data.endedAt === "number" && Number.isFinite(evt.data.endedAt) ? evt.data.endedAt : evt.ts;
				}
			}
		} else if (lifecyclePhase === "start") {
			const clientRunId = (evt.contextClaimId ? void 0 : params.chatRunState.registry.peek(evt.runId))?.clientRunId ?? evt.runId;
			const candidateRunIds = evt.runId === clientRunId ? [evt.runId] : [evt.runId, clientRunId];
			const eventLifecycleGeneration = evt.lifecycleGeneration?.trim();
			for (const candidateRunId of candidateRunIds) {
				const entry = params.chatAbortControllers.get(candidateRunId);
				if (entry && (!eventLifecycleGeneration || !entry.lifecycleGeneration || entry.lifecycleGeneration === eventLifecycleGeneration)) {
					entry.projectSessionTerminalPending = false;
					entry.projectSessionTerminalObservedAt = void 0;
				}
			}
		}
		dispatchEventHandler({
			loadHandler: getAgentEventHandler,
			event: evt,
			log: params.log,
			failureMessage: "Agent event dispatch failed",
			context: {
				runId: evt.runId,
				stream: evt.stream
			}
		});
	});
	const agentUnsub = async () => {
		unsubscribeAgentEvents();
		unsubscribePrivateAuditEvents?.();
		unsubscribeToolAuditEvents?.();
		unsubscribeMessageAuditEvents?.();
		await agentEventHandlerLoader.peek()?.then((handler) => handler.dispose()).catch(() => void 0);
		await auditRecorder.stop();
	};
	const heartbeatUnsub = require_heartbeat_events.onHeartbeatEvent((evt) => {
		params.broadcast("heartbeat", evt, { dropIfSlow: true });
	});
	const transcriptUnsub = require_transcript_events.onInternalSessionTranscriptUpdate((evt) => {
		dispatchEventHandler({
			loadHandler: getTranscriptUpdateHandler,
			event: evt,
			log: params.log,
			failureMessage: "Transcript update dispatch failed",
			context: { sessionKey: evt.sessionKey }
		});
	});
	const lifecycleUnsub = require_session_lifecycle_events.onSessionLifecycleEvent((evt) => {
		dispatchEventHandler({
			loadHandler: getLifecycleEventHandler,
			event: evt,
			log: params.log,
			failureMessage: "Lifecycle event dispatch failed",
			context: { sessionKey: evt.sessionKey }
		});
	});
	let taskObserverDisposed = false;
	const taskObservers = { onEvent: (event) => {
		let payload;
		switch (event.kind) {
			case "upserted":
				payload = {
					action: "upserted",
					task: require_task_summary.mapTaskSummary(event.task)
				};
				break;
			case "deleted":
				payload = {
					action: "deleted",
					taskId: event.taskId
				};
				break;
			case "restored":
				payload = { action: "restored" };
				break;
		}
		params.broadcast("task", payload, { dropIfSlow: true });
	} };
	const taskObserverRuntimePromise = Promise.resolve().then(() => require("./task-registry.store-BKV6yBzt.cjs")).then((n) => n.task_registry_store_exports).then((module) => {
		if (!taskObserverDisposed) module.configureTaskRegistryRuntime({ observers: taskObservers });
		return module;
	});
	taskObserverRuntimePromise.catch((error) => {
		params.log.warn("Task registry observer registration failed", { error });
	});
	const taskUnsub = () => {
		taskObserverDisposed = true;
		return taskObserverRuntimePromise.then((module) => {
			if (module.getTaskRegistryObservers() === taskObservers) module.configureTaskRegistryRuntime({ observers: null });
		}).catch(() => void 0);
	};
	return {
		agentUnsub,
		heartbeatUnsub,
		transcriptUnsub,
		lifecycleUnsub,
		taskUnsub
	};
}
//#endregion
exports.startGatewayEventSubscriptions = startGatewayEventSubscriptions;
