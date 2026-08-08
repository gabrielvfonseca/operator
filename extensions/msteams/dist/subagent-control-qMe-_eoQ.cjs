const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
require("./message-channel-jMzaqV09.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_task_registry = require("./task-registry-VcVsRI11.cjs");
const require_sessions_helpers = require("./sessions-helpers-BzXDIb2t.cjs");
const require_subagent_registry_state = require("./subagent-registry-state-Cb8uurME.cjs");
require("./subagent-run-liveness-DmyqOa7r.cjs");
const require_subagent_registry_read = require("./subagent-registry-read-LeoF2Gsl.cjs");
const require_lanes = require("./lanes-CNGMiDO4.cjs");
const require_run_wait = require("./run-wait-BNfiubiD.cjs");
const require_subagent_registry = require("./subagent-registry-DLykI6PJ.cjs");
const require_subagents_utils = require("./subagents-utils-DU8qD7dC.cjs");
const require_subagent_list = require("./subagent-list-C1S6-Fg_.cjs");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/agents/subagent-control.ts
/**
* Implements subagent control operations: list, kill, steer, and send-message.
* The module enforces controller ownership before mutating child sessions or
* routing internal follow-up messages.
*/
/** Maximum recent-run window accepted by subagent control UI/tools. */
const MAX_RECENT_MINUTES = 1440;
const STEER_RATE_LIMIT_MS = 2e3;
const STEER_ABORT_SETTLE_TIMEOUT_MS = 5e3;
const SUBAGENT_REPLY_HISTORY_LIMIT = 50;
const steerRateLimit = /* @__PURE__ */ new Map();
const defaultSubagentControlDeps = {
	callGateway: require_call.callGateway,
	patchSessionEntry: require_session_accessor.patchSessionEntry
};
let subagentControlDeps = defaultSubagentControlDeps;
const subagentControlRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./subagent-control.runtime-Dlr0OXsd.cjs")));
function loadSubagentControlRuntime() {
	return subagentControlRuntimeLoader.load();
}
async function resolveSubagentControlRuntime() {
	if (subagentControlDeps.abortEmbeddedAgentRun && subagentControlDeps.isEmbeddedAgentRunActive && subagentControlDeps.clearSessionQueues) return {
		abortEmbeddedAgentRun: subagentControlDeps.abortEmbeddedAgentRun,
		isEmbeddedAgentRunActive: subagentControlDeps.isEmbeddedAgentRunActive,
		clearSessionQueues: subagentControlDeps.clearSessionQueues
	};
	const runtime = await loadSubagentControlRuntime();
	return {
		abortEmbeddedAgentRun: subagentControlDeps.abortEmbeddedAgentRun ?? runtime.abortEmbeddedAgentRun,
		isEmbeddedAgentRunActive: subagentControlDeps.isEmbeddedAgentRunActive ?? runtime.isEmbeddedAgentRunActive,
		clearSessionQueues: subagentControlDeps.clearSessionQueues ?? runtime.clearSessionQueues
	};
}
/** Resolves which subagent runs the caller is allowed to control. */
function resolveSubagentController(params) {
	const { mainKey, alias } = require_sessions_helpers.resolveMainSessionAlias(params.cfg);
	const callerSessionKey = require_sessions_helpers.resolveInternalSessionKey({
		key: params.agentSessionKey?.trim() || alias,
		alias,
		mainKey
	});
	if (!require_session_key.isSubagentSessionKey(callerSessionKey)) return {
		controllerSessionKey: callerSessionKey,
		callerSessionKey,
		callerIsSubagent: false,
		controlScope: "children"
	};
	return {
		controllerSessionKey: callerSessionKey,
		callerSessionKey,
		callerIsSubagent: true,
		controlScope: require_subagent_capabilities.resolveStoredSubagentCapabilities(callerSessionKey, { cfg: params.cfg }).controlScope
	};
}
function isSubagentRunVisibleToSession(entry, sessionKey) {
	const controllerKey = entry.controllerSessionKey?.trim();
	const requesterKey = entry.requesterSessionKey.trim();
	return controllerKey === sessionKey || requesterKey === sessionKey;
}
/** Lists latest child runs controlled by a session key. */
function listControlledSubagentRuns(controllerSessionKey) {
	const key = controllerSessionKey.trim();
	if (!key) return [];
	const latestByChildSessionKey = require_subagent_list.buildLatestSubagentRunIndex(require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns)).latestByChildSessionKey;
	return require_subagents_utils.sortSubagentRuns(Array.from(latestByChildSessionKey.values()).filter((entry) => isSubagentRunVisibleToSession(entry, key)));
}
function ensureControllerOwnsRun(params) {
	if ((params.entry.controllerSessionKey?.trim() || params.entry.requesterSessionKey) === params.controller.controllerSessionKey) return;
	return "Subagents can only control runs spawned from their own session.";
}
function isFinishedForSteerControl(entry, hasPendingDescendants) {
	return Boolean(entry.endedAt) && entry.pauseReason !== "sessions_yield" && !hasPendingDescendants;
}
function resolveSubagentKillTargetState(entry) {
	if (entry.endedReason === "subagent-killed" && entry.suppressAnnounceReason !== "steer-restart") {
		const taskEndedAt = require_subagent_registry.resolveKilledSubagentTaskEndedAt(entry);
		return typeof taskEndedAt === "number" ? {
			state: "terminal",
			task: {
				status: "cancelled",
				endedAt: taskEndedAt,
				lastEventAt: taskEndedAt,
				error: require_task_registry.SUBAGENT_KILL_TASK_ERROR,
				progressSummary: entry.completion?.resultText ?? void 0,
				terminalSummary: null
			}
		} : void 0;
	}
	const terminal = require_subagent_registry.resolveFinalizedSubagentTaskState(entry);
	if (terminal) return {
		state: "terminal",
		task: terminal
	};
	return typeof entry.endedAt === "number" && entry.pauseReason !== "sessions_yield" && (entry.endedReason !== "subagent-killed" || entry.suppressAnnounceReason === "steer-restart") ? { state: "finalizing" } : void 0;
}
async function persistSubagentAbortedLastRun(params) {
	if (!params.hasSessionEntry) return;
	try {
		await subagentControlDeps.patchSessionEntry({
			storePath: params.storePath,
			sessionKey: params.childSessionKey
		}, (current) => ({
			...current,
			abortedLastRun: params.abortedLastRun,
			updatedAt: Date.now()
		}), { replaceEntry: true });
	} catch (error) {
		require_globals.logVerbose(`subagents control kill: failed to persist abortedLastRun=${params.abortedLastRun} for ${params.childSessionKey}: ${require_errors.formatErrorMessage(error)}`);
	}
}
function markSubagentRunTerminatedBestEffort(params) {
	try {
		return require_subagent_registry.markSubagentRunTerminated(params);
	} catch (error) {
		require_globals.logVerbose(`subagents control kill: failed to persist ${params.runId ?? params.childSessionKey ?? "unknown"}: ${require_errors.formatErrorMessage(error)}`);
		return 0;
	}
}
async function killSubagentRun(params) {
	const initialTargetState = resolveSubagentKillTargetState(params.entry);
	if (initialTargetState) {
		if (params.entry.endedReason === "subagent-killed" && params.entry.suppressAnnounceReason !== "steer-restart") markSubagentRunTerminatedBestEffort({
			runId: params.entry.runId,
			childSessionKey: params.entry.childSessionKey,
			reason: "killed"
		});
		return {
			killed: false,
			targetState: initialTargetState
		};
	}
	if (params.entry.endedAt && params.entry.pauseReason !== "sessions_yield") return { killed: false };
	const childSessionKey = params.entry.childSessionKey;
	const resolved = require_subagent_list.resolveSessionEntryForKey({
		cfg: params.cfg,
		key: childSessionKey,
		cache: params.cache
	});
	const sessionId = resolved.entry?.sessionId;
	const runtime = await resolveSubagentControlRuntime();
	const targetStateAfterRuntimeLoad = resolveSubagentKillTargetState(params.entry);
	if (targetStateAfterRuntimeLoad) {
		if (params.entry.endedReason === "subagent-killed" && params.entry.suppressAnnounceReason !== "steer-restart") markSubagentRunTerminatedBestEffort({
			runId: params.entry.runId,
			childSessionKey,
			reason: "killed"
		});
		return {
			killed: false,
			sessionId,
			targetState: targetStateAfterRuntimeLoad
		};
	}
	const active = sessionId ? runtime.isEmbeddedAgentRunActive(sessionId) : false;
	const aborted = sessionId ? runtime.abortEmbeddedAgentRun(sessionId) : false;
	const cleared = runtime.clearSessionQueues([childSessionKey, sessionId]);
	if (cleared.followupCleared > 0 || cleared.laneCleared > 0) require_globals.logVerbose(`subagents control kill: cleared followups=${cleared.followupCleared} lane=${cleared.laneCleared} keys=${cleared.keys.join(",")}`);
	if (active && !aborted) return {
		killed: false,
		sessionId
	};
	const persistAbortedLastRun = (abortedLastRun) => persistSubagentAbortedLastRun({
		childSessionKey,
		storePath: resolved.storePath,
		hasSessionEntry: resolved.entry !== void 0,
		abortedLastRun
	});
	await persistAbortedLastRun(true);
	const targetState = resolveSubagentKillTargetState(params.entry);
	if (targetState) {
		const killedTarget = targetState.state === "terminal" && targetState.task.status === "cancelled" && targetState.task.error === "Subagent run killed.";
		if (killedTarget) markSubagentRunTerminatedBestEffort({
			runId: params.entry.runId,
			childSessionKey,
			reason: "killed"
		});
		else await persistAbortedLastRun(false);
		return {
			killed: killedTarget && (aborted || cleared.followupCleared > 0 || cleared.laneCleared > 0),
			sessionId,
			targetState
		};
	}
	return {
		killed: markSubagentRunTerminatedBestEffort({
			runId: params.entry.runId,
			childSessionKey,
			reason: "killed"
		}) > 0 || aborted || cleared.followupCleared > 0 || cleared.laneCleared > 0,
		sessionId
	};
}
async function cascadeKillChildren(params) {
	const childRunsBySessionKey = /* @__PURE__ */ new Map();
	for (const run of require_subagent_registry_read.listSubagentRunsForController(params.parentChildSessionKey)) {
		const childKey = run.childSessionKey?.trim();
		if (!childKey) continue;
		const latest = require_subagent_registry_read.getLatestSubagentRunByChildSessionKey(childKey);
		const latestControllerSessionKey = latest?.controllerSessionKey?.trim() || latest?.requesterSessionKey?.trim();
		if (!latest || latest.runId !== run.runId || latestControllerSessionKey !== params.parentChildSessionKey) continue;
		childRunsBySessionKey.set(childKey, run);
	}
	const childRuns = Array.from(childRunsBySessionKey.values());
	const seenChildSessionKeys = params.seenChildSessionKeys ?? /* @__PURE__ */ new Set();
	let killed = 0;
	const labels = [];
	for (const run of childRuns) {
		const childKey = run.childSessionKey?.trim();
		if (!childKey || seenChildSessionKeys.has(childKey)) continue;
		seenChildSessionKeys.add(childKey);
		if (!run.endedAt || run.pauseReason === "sessions_yield") {
			if ((await killSubagentRun({
				cfg: params.cfg,
				entry: run,
				cache: params.cache
			})).killed) {
				killed += 1;
				labels.push(require_subagents_utils.resolveSubagentLabel(run));
			}
		}
		const cascade = await cascadeKillChildren({
			cfg: params.cfg,
			parentChildSessionKey: childKey,
			cache: params.cache,
			seenChildSessionKeys
		});
		killed += cascade.killed;
		labels.push(...cascade.labels);
	}
	return {
		killed,
		labels
	};
}
/** Kills every currently controlled child run and its descendants. */
async function killAllControlledSubagentRuns(params) {
	if (params.controller.controlScope !== "children") return {
		status: "forbidden",
		error: "Leaf subagents cannot control other sessions.",
		killed: 0,
		labels: []
	};
	const cache = /* @__PURE__ */ new Map();
	const seenChildSessionKeys = /* @__PURE__ */ new Set();
	const killedLabels = [];
	let killed = 0;
	for (const entry of params.runs) {
		const childKey = entry.childSessionKey?.trim();
		if (!childKey || seenChildSessionKeys.has(childKey)) continue;
		const currentEntry = require_subagent_registry_read.getLatestSubagentRunByChildSessionKey(childKey);
		if (!currentEntry || currentEntry.runId !== entry.runId) continue;
		seenChildSessionKeys.add(childKey);
		if (!currentEntry.endedAt || currentEntry.pauseReason === "sessions_yield") {
			if ((await killSubagentRun({
				cfg: params.cfg,
				entry: currentEntry,
				cache
			})).killed) {
				killed += 1;
				killedLabels.push(require_subagents_utils.resolveSubagentLabel(currentEntry));
			}
		}
		const cascade = await cascadeKillChildren({
			cfg: params.cfg,
			parentChildSessionKey: childKey,
			cache,
			seenChildSessionKeys
		});
		killed += cascade.killed;
		killedLabels.push(...cascade.labels);
	}
	return {
		status: "ok",
		killed,
		labels: killedLabels
	};
}
/** Kills one controlled subagent run and any active descendants. */
async function killControlledSubagentRun(params) {
	const ownershipError = ensureControllerOwnsRun({
		controller: params.controller,
		entry: params.entry
	});
	if (ownershipError) return {
		status: "forbidden",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		error: ownershipError
	};
	if (params.controller.controlScope !== "children") return {
		status: "forbidden",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		error: "Leaf subagents cannot control other sessions."
	};
	const currentEntry = require_subagent_registry_read.getLatestSubagentRunByChildSessionKey(params.entry.childSessionKey);
	if (!currentEntry || currentEntry.runId !== params.entry.runId) return {
		status: "done",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		label: require_subagents_utils.resolveSubagentLabel(params.entry),
		text: `${require_subagents_utils.resolveSubagentLabel(params.entry)} is already finished.`
	};
	const killCache = /* @__PURE__ */ new Map();
	const stopResult = await killSubagentRun({
		cfg: params.cfg,
		entry: currentEntry,
		cache: killCache
	});
	const seenChildSessionKeys = /* @__PURE__ */ new Set();
	const targetChildKey = params.entry.childSessionKey?.trim();
	if (targetChildKey) seenChildSessionKeys.add(targetChildKey);
	const cascade = await cascadeKillChildren({
		cfg: params.cfg,
		parentChildSessionKey: params.entry.childSessionKey,
		cache: killCache,
		seenChildSessionKeys
	});
	if (!stopResult.killed && cascade.killed === 0) return {
		status: "done",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		label: require_subagents_utils.resolveSubagentLabel(params.entry),
		text: `${require_subagents_utils.resolveSubagentLabel(params.entry)} is already finished.`
	};
	const cascadeText = cascade.killed > 0 ? ` (+ ${cascade.killed} descendant${cascade.killed === 1 ? "" : "s"})` : "";
	return {
		status: "ok",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		label: require_subagents_utils.resolveSubagentLabel(params.entry),
		cascadeKilled: cascade.killed,
		cascadeLabels: cascade.killed > 0 ? cascade.labels : void 0,
		text: stopResult.killed ? `killed ${require_subagents_utils.resolveSubagentLabel(params.entry)}${cascadeText}.` : `killed ${cascade.killed} descendant${cascade.killed === 1 ? "" : "s"} of ${require_subagents_utils.resolveSubagentLabel(params.entry)}.`
	};
}
/** Admin kill path for a subagent session key, bypassing caller ownership checks. */
async function killSubagentRunAdmin(params) {
	const targetSessionKey = params.sessionKey.trim();
	if (!targetSessionKey) return {
		found: false,
		killed: false
	};
	const entry = require_subagent_registry_read.getLatestSubagentRunByChildSessionKey(targetSessionKey);
	if (!entry) return {
		found: false,
		killed: false
	};
	const killCache = /* @__PURE__ */ new Map();
	const stopResult = await killSubagentRun({
		cfg: params.cfg,
		entry,
		cache: killCache
	});
	const seenChildSessionKeys = /* @__PURE__ */ new Set([targetSessionKey]);
	const cascade = await cascadeKillChildren({
		cfg: params.cfg,
		parentChildSessionKey: targetSessionKey,
		cache: killCache,
		seenChildSessionKeys
	});
	const targetState = resolveSubagentKillTargetState(entry) ?? stopResult.targetState;
	const killedTarget = targetState?.state === "terminal" && targetState.task.status === "cancelled" && targetState.task.error === "Subagent run killed.";
	const stopResultAlreadyClearedAbort = stopResult.targetState !== void 0 && !(stopResult.targetState.state === "terminal" && stopResult.targetState.task.status === "cancelled" && stopResult.targetState.task.error === "Subagent run killed.");
	if (targetState && !killedTarget && !stopResultAlreadyClearedAbort) {
		const resolved = require_subagent_list.resolveSessionEntryForKey({
			cfg: params.cfg,
			key: targetSessionKey,
			cache: killCache
		});
		await persistSubagentAbortedLastRun({
			childSessionKey: targetSessionKey,
			storePath: resolved.storePath,
			hasSessionEntry: resolved.entry !== void 0,
			abortedLastRun: false
		});
	}
	return {
		found: true,
		killed: stopResult.killed || cascade.killed > 0,
		...targetState ? { targetState } : {},
		runId: entry.runId,
		sessionKey: entry.childSessionKey,
		cascadeKilled: cascade.killed,
		cascadeLabels: cascade.killed > 0 ? cascade.labels : void 0
	};
}
/** Restarts a controlled subagent run with a new steering message. */
async function steerControlledSubagentRun(params) {
	const ownershipError = ensureControllerOwnsRun({
		controller: params.controller,
		entry: params.entry
	});
	if (ownershipError) return {
		status: "forbidden",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		error: ownershipError
	};
	if (params.controller.controlScope !== "children") return {
		status: "forbidden",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		error: "Leaf subagents cannot control other sessions."
	};
	const targetHasPendingDescendants = require_subagent_registry.countPendingDescendantRuns(params.entry.childSessionKey) > 0;
	if (isFinishedForSteerControl(params.entry, targetHasPendingDescendants)) return {
		status: "done",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		text: `${require_subagents_utils.resolveSubagentLabel(params.entry)} is already finished.`
	};
	if (params.controller.callerSessionKey === params.entry.childSessionKey) return {
		status: "forbidden",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		error: "Subagents cannot steer themselves."
	};
	const currentEntry = require_subagent_registry_read.getLatestSubagentRunByChildSessionKey(params.entry.childSessionKey);
	const currentHasPendingDescendants = currentEntry ? require_subagent_registry.countPendingDescendantRuns(currentEntry.childSessionKey) > 0 : false;
	if (!currentEntry || currentEntry.runId !== params.entry.runId || isFinishedForSteerControl(currentEntry, currentHasPendingDescendants)) return {
		status: "done",
		runId: params.entry.runId,
		sessionKey: params.entry.childSessionKey,
		text: `${require_subagents_utils.resolveSubagentLabel(params.entry)} is already finished.`
	};
	const rateKey = `${params.controller.callerSessionKey}:${params.entry.childSessionKey}`;
	if (process.env.VITEST !== "true") {
		const now = Date.now();
		if (now - (steerRateLimit.get(rateKey) ?? 0) < STEER_RATE_LIMIT_MS) return {
			status: "rate_limited",
			runId: params.entry.runId,
			sessionKey: params.entry.childSessionKey,
			error: "Steer rate limit exceeded. Wait a moment before sending another steer."
		};
		steerRateLimit.set(rateKey, now);
	}
	require_subagent_registry.markSubagentRunForSteerRestart(params.entry.runId);
	const targetSession = require_subagent_list.resolveSessionEntryForKey({
		cfg: params.cfg,
		key: params.entry.childSessionKey,
		cache: /* @__PURE__ */ new Map()
	});
	const sessionId = typeof targetSession.entry?.sessionId === "string" && targetSession.entry.sessionId.trim() ? targetSession.entry.sessionId.trim() : void 0;
	const restartSessionId = sessionId ? node_crypto.default.randomUUID() : void 0;
	const runtime = await resolveSubagentControlRuntime();
	if (sessionId) {
		const active = runtime.isEmbeddedAgentRunActive(sessionId);
		const aborted = runtime.abortEmbeddedAgentRun(sessionId);
		if (active && !aborted) {
			require_subagent_registry.clearSubagentRunSteerRestart(params.entry.runId);
			return {
				status: "error",
				runId: params.entry.runId,
				sessionKey: params.entry.childSessionKey,
				sessionId,
				error: "Subagent reply is already finalizing and can no longer be restarted."
			};
		}
	}
	const cleared = runtime.clearSessionQueues([params.entry.childSessionKey, sessionId]);
	if (cleared.followupCleared > 0 || cleared.laneCleared > 0) require_globals.logVerbose(`subagents control steer: cleared followups=${cleared.followupCleared} lane=${cleared.laneCleared} keys=${cleared.keys.join(",")}`);
	try {
		await subagentControlDeps.callGateway({
			method: "agent.wait",
			params: {
				runId: params.entry.runId,
				timeoutMs: STEER_ABORT_SETTLE_TIMEOUT_MS
			},
			timeoutMs: 7e3
		});
	} catch {}
	const idempotencyKey = node_crypto.default.randomUUID();
	let runId = idempotencyKey;
	try {
		const response = await subagentControlDeps.callGateway({
			method: "agent",
			params: {
				message: params.message,
				sessionKey: params.entry.childSessionKey,
				sessionId: restartSessionId,
				idempotencyKey,
				deliver: false,
				channel: require_message_channel_core.INTERNAL_MESSAGE_CHANNEL,
				lane: require_lanes.AGENT_LANE_SUBAGENT,
				timeout: 0
			},
			timeoutMs: 1e4
		});
		if (typeof response?.runId === "string" && response.runId) runId = response.runId;
	} catch (err) {
		require_subagent_registry.clearSubagentRunSteerRestart(params.entry.runId);
		const error = require_errors.formatErrorMessage(err);
		return {
			status: "error",
			runId,
			sessionKey: params.entry.childSessionKey,
			sessionId: restartSessionId,
			error
		};
	}
	if (!require_subagent_registry.replaceSubagentRunAfterSteer({
		previousRunId: params.entry.runId,
		nextRunId: runId,
		fallback: params.entry,
		runTimeoutSeconds: params.entry.runTimeoutSeconds ?? 0,
		task: params.message
	})) {
		require_subagent_registry.clearSubagentRunSteerRestart(params.entry.runId);
		return {
			status: "error",
			runId,
			sessionKey: params.entry.childSessionKey,
			sessionId: restartSessionId,
			error: "failed to replace steered subagent run"
		};
	}
	return {
		status: "accepted",
		runId,
		sessionKey: params.entry.childSessionKey,
		sessionId: restartSessionId,
		mode: "restart",
		label: require_subagents_utils.resolveSubagentLabel(params.entry),
		text: `steered ${require_subagents_utils.resolveSubagentLabel(params.entry)}.`
	};
}
/** Sends a follow-up message to a controlled subagent and waits for a reply. */
async function sendControlledSubagentMessage(params) {
	const ownershipError = ensureControllerOwnsRun({
		controller: params.controller,
		entry: params.entry
	});
	if (ownershipError) return {
		status: "forbidden",
		error: ownershipError
	};
	if (params.controller.controlScope !== "children") return {
		status: "forbidden",
		error: "Leaf subagents cannot control other sessions."
	};
	const currentEntry = require_subagent_registry_read.getLatestSubagentRunByChildSessionKey(params.entry.childSessionKey);
	if (!currentEntry || currentEntry.runId !== params.entry.runId) return {
		status: "done",
		runId: params.entry.runId,
		text: `${require_subagents_utils.resolveSubagentLabel(params.entry)} is already finished.`
	};
	const targetSessionKey = params.entry.childSessionKey;
	const parsed = require_session_key.parseAgentSessionKey(targetSessionKey);
	const targetSessionEntry = require_session_accessor.loadSessionEntry({
		storePath: require_paths.resolveStorePath(params.cfg.session?.store, { agentId: parsed?.agentId }),
		sessionKey: targetSessionKey,
		clone: false
	});
	const targetSessionId = typeof targetSessionEntry?.sessionId === "string" && targetSessionEntry.sessionId.trim() ? targetSessionEntry.sessionId.trim() : void 0;
	const idempotencyKey = node_crypto.default.randomUUID();
	let runId = idempotencyKey;
	try {
		const baselineReply = await require_run_wait.readLatestAssistantReplySnapshot({
			sessionKey: targetSessionKey,
			limit: SUBAGENT_REPLY_HISTORY_LIMIT,
			callGateway: subagentControlDeps.callGateway
		});
		const response = await subagentControlDeps.callGateway({
			method: "agent",
			params: {
				message: params.message,
				sessionKey: targetSessionKey,
				sessionId: targetSessionId,
				idempotencyKey,
				deliver: false,
				channel: require_message_channel_core.INTERNAL_MESSAGE_CHANNEL,
				lane: require_lanes.AGENT_LANE_SUBAGENT,
				timeout: 0
			},
			timeoutMs: 1e4
		});
		const responseRunId = typeof response?.runId === "string" ? response.runId : void 0;
		if (responseRunId) runId = responseRunId;
		const result = await require_run_wait.waitForAgentRunAndReadUpdatedAssistantReply({
			runId,
			sessionKey: targetSessionKey,
			timeoutMs: 3e4,
			limit: SUBAGENT_REPLY_HISTORY_LIMIT,
			baseline: baselineReply,
			callGateway: subagentControlDeps.callGateway
		});
		if (result.status === "timeout") return {
			status: "timeout",
			runId
		};
		if (result.status === "error") return {
			status: "error",
			runId,
			error: result.error ?? "unknown error"
		};
		return {
			status: "ok",
			runId,
			replyText: result.replyText
		};
	} catch (err) {
		const error = require_errors.formatErrorMessage(err);
		return {
			status: "error",
			runId,
			error
		};
	}
}
const testing = { setDepsForTest(overrides) {
	subagentControlDeps = overrides ? {
		...defaultSubagentControlDeps,
		...overrides
	} : defaultSubagentControlDeps;
} };
if (process.env.VITEST || false) globalThis[Symbol.for("operator.subagentControlTestApi")] = testing;
//#endregion
Object.defineProperty(exports, "MAX_RECENT_MINUTES", {
	enumerable: true,
	get: function() {
		return MAX_RECENT_MINUTES;
	}
});
Object.defineProperty(exports, "killAllControlledSubagentRuns", {
	enumerable: true,
	get: function() {
		return killAllControlledSubagentRuns;
	}
});
Object.defineProperty(exports, "killControlledSubagentRun", {
	enumerable: true,
	get: function() {
		return killControlledSubagentRun;
	}
});
Object.defineProperty(exports, "killSubagentRunAdmin", {
	enumerable: true,
	get: function() {
		return killSubagentRunAdmin;
	}
});
Object.defineProperty(exports, "listControlledSubagentRuns", {
	enumerable: true,
	get: function() {
		return listControlledSubagentRuns;
	}
});
Object.defineProperty(exports, "resolveSubagentController", {
	enumerable: true,
	get: function() {
		return resolveSubagentController;
	}
});
Object.defineProperty(exports, "sendControlledSubagentMessage", {
	enumerable: true,
	get: function() {
		return sendControlledSubagentMessage;
	}
});
Object.defineProperty(exports, "steerControlledSubagentRun", {
	enumerable: true,
	get: function() {
		return steerControlledSubagentRun;
	}
});
