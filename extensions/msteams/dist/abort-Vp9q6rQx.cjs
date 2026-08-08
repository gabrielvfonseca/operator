const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_abort_primitives = require("./abort-primitives-CPS0AKDl.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_mentions = require("./mentions-xs5giNxG.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_command_auth = require("./command-auth-GSEJNgZd.cjs");
const require_conversation_binding_input = require("./conversation-binding-input-CJRXIfwl.cjs");
const require_reply_run_registry = require("./reply-run-registry-BN03YRe9.cjs");
const require_run_state = require("./run-state-lPLPf1ME.cjs");
const require_runs = require("./runs-BxiWZCUY.cjs");
const require_sessions_helpers = require("./sessions-helpers-BzXDIb2t.cjs");
const require_cleanup = require("./cleanup-Do0eFW35.cjs");
require("./queue-BObg9z8c.cjs");
const require_subagent_registry = require("./subagent-registry-DLykI6PJ.cjs");
const require_manager = require("./manager-B5L0WDCm.cjs");
const require_abort_cutoff = require("./abort-cutoff-BOwNx53m.cjs");
const require_acp_reset_target = require("./acp-reset-target-D6Yggd8E.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/abort.ts
const defaultAbortDeps = {
	getAcpSessionManager: require_manager.getAcpSessionManager,
	abortEmbeddedAgentRun: require_runs.abortEmbeddedAgentRun,
	resolveActiveEmbeddedRunSessionId: require_run_state.resolveActiveEmbeddedRunSessionId,
	markSessionAbortTarget: require_session_accessor.markSessionAbortTarget,
	resolveSessionAbortTarget: require_session_accessor.resolveSessionAbortTarget,
	getLatestSubagentRunByChildSessionKey: require_subagent_registry.getLatestSubagentRunByChildSessionKey,
	listSubagentRunsForController: require_subagent_registry.listSubagentRunsForController,
	markSubagentRunTerminated: require_subagent_registry.markSubagentRunTerminated
};
const abortDeps = { ...defaultAbortDeps };
const abortTestApi = {
	setDepsForTests(deps) {
		abortDeps.getAcpSessionManager = deps?.getAcpSessionManager ?? defaultAbortDeps.getAcpSessionManager;
		abortDeps.abortEmbeddedAgentRun = deps?.abortEmbeddedAgentRun ?? defaultAbortDeps.abortEmbeddedAgentRun;
		abortDeps.resolveActiveEmbeddedRunSessionId = deps?.resolveActiveEmbeddedRunSessionId ?? defaultAbortDeps.resolveActiveEmbeddedRunSessionId;
		abortDeps.markSessionAbortTarget = deps?.markSessionAbortTarget ?? defaultAbortDeps.markSessionAbortTarget;
		abortDeps.resolveSessionAbortTarget = deps?.resolveSessionAbortTarget ?? defaultAbortDeps.resolveSessionAbortTarget;
		abortDeps.getLatestSubagentRunByChildSessionKey = deps?.getLatestSubagentRunByChildSessionKey ?? defaultAbortDeps.getLatestSubagentRunByChildSessionKey;
		abortDeps.listSubagentRunsForController = deps?.listSubagentRunsForController ?? defaultAbortDeps.listSubagentRunsForController;
		abortDeps.markSubagentRunTerminated = deps?.markSubagentRunTerminated ?? defaultAbortDeps.markSubagentRunTerminated;
	},
	resetDepsForTests() {
		abortDeps.getAcpSessionManager = defaultAbortDeps.getAcpSessionManager;
		abortDeps.abortEmbeddedAgentRun = defaultAbortDeps.abortEmbeddedAgentRun;
		abortDeps.resolveActiveEmbeddedRunSessionId = defaultAbortDeps.resolveActiveEmbeddedRunSessionId;
		abortDeps.markSessionAbortTarget = defaultAbortDeps.markSessionAbortTarget;
		abortDeps.resolveSessionAbortTarget = defaultAbortDeps.resolveSessionAbortTarget;
		abortDeps.getLatestSubagentRunByChildSessionKey = defaultAbortDeps.getLatestSubagentRunByChildSessionKey;
		abortDeps.listSubagentRunsForController = defaultAbortDeps.listSubagentRunsForController;
		abortDeps.markSubagentRunTerminated = defaultAbortDeps.markSubagentRunTerminated;
	}
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.abortTestApi")] = abortTestApi;
function abortSessionRunTargetWithOutcome(params) {
	const sessionIds = /* @__PURE__ */ new Set();
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.key);
	let active = key ? require_reply_run_registry.replyRunRegistry.isActive(key) : false;
	if (key) {
		const activeSessionId = abortDeps.resolveActiveEmbeddedRunSessionId(key);
		if (activeSessionId) {
			active = true;
			sessionIds.add(activeSessionId);
		}
	}
	const explicitSessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionId);
	if (explicitSessionId) sessionIds.add(explicitSessionId);
	let aborted = key ? require_reply_run_registry.replyRunRegistry.abort(key) : false;
	for (const sessionId of sessionIds) aborted = abortDeps.abortEmbeddedAgentRun(sessionId) || aborted;
	return {
		active,
		aborted
	};
}
function formatAbortReplyText(stoppedSubagents, rejectionReason) {
	if (rejectionReason === "finalizing") {
		const base = "Agent reply is already finalizing and can no longer be aborted.";
		if (typeof stoppedSubagents !== "number" || stoppedSubagents <= 0) return base;
		return `${base} Stopped ${stoppedSubagents} ${stoppedSubagents === 1 ? "sub-agent" : "sub-agents"}.`;
	}
	if (typeof stoppedSubagents !== "number" || stoppedSubagents <= 0) return "⚙️ Agent was aborted.";
	return `⚙️ Agent was aborted. Stopped ${stoppedSubagents} ${stoppedSubagents === 1 ? "sub-agent" : "sub-agents"}.`;
}
function resolveStoredSessionId(params) {
	const agentId = require_agent_scope.resolveSessionAgentId({
		sessionKey: params.sessionKey,
		config: params.cfg
	});
	const storePath = require_paths.resolveStorePath(params.cfg.session?.store, { agentId });
	try {
		return require_session_accessor.loadSessionEntry({
			agentId,
			clone: false,
			sessionKey: params.sessionKey,
			storePath
		})?.sessionId;
	} catch {
		return;
	}
}
function resolveBoundAcpAbortTargetSessionKey(params) {
	const bindingContext = require_conversation_binding_input.resolveConversationBindingContextFromMessage({
		cfg: params.cfg,
		ctx: params.ctx
	});
	if (!bindingContext) return;
	return require_acp_reset_target.resolveEffectiveResetTargetSessionKey({
		cfg: params.cfg,
		channel: bindingContext.channel,
		accountId: bindingContext.accountId,
		conversationId: bindingContext.conversationId,
		parentConversationId: bindingContext.parentConversationId,
		activeSessionKey: params.activeSessionKey,
		skipConfiguredFallbackWhenActiveSessionNonAcp: false,
		fallbackToActiveAcpWhenUnbound: false
	});
}
function normalizeRequesterSessionKey(cfg, key) {
	const cleaned = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(key);
	if (!cleaned) return;
	const { mainKey, alias } = require_sessions_helpers.resolveMainSessionAlias(cfg);
	return require_sessions_helpers.resolveInternalSessionKey({
		key: cleaned,
		alias,
		mainKey
	});
}
function markSubagentRunTerminatedBestEffort(params) {
	try {
		return abortDeps.markSubagentRunTerminated(params);
	} catch (error) {
		require_globals.logVerbose(`abort: failed to persist killed subagent ${params.runId ?? params.childSessionKey ?? "unknown"}: ${require_errors.formatErrorMessage(error)}`);
		return 0;
	}
}
function stopSubagentsForRequester(params) {
	const requesterKey = normalizeRequesterSessionKey(params.cfg, params.requesterSessionKey);
	if (!requesterKey) return { stopped: 0 };
	const dedupedRunsByChildKey = /* @__PURE__ */ new Map();
	for (const run of abortDeps.listSubagentRunsForController(requesterKey)) {
		const childKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(run.childSessionKey);
		if (!childKey) continue;
		const latest = abortDeps.getLatestSubagentRunByChildSessionKey(childKey);
		if (!latest) {
			const existing = dedupedRunsByChildKey.get(childKey);
			if (!existing || run.createdAt >= existing.createdAt) dedupedRunsByChildKey.set(childKey, run);
			continue;
		}
		const latestControllerSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest?.controllerSessionKey) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest?.requesterSessionKey);
		if (latest.runId !== run.runId || latestControllerSessionKey !== requesterKey) continue;
		const existing = dedupedRunsByChildKey.get(childKey);
		if (!existing || run.createdAt >= existing.createdAt) dedupedRunsByChildKey.set(childKey, run);
	}
	const runs = Array.from(dedupedRunsByChildKey.values());
	if (runs.length === 0) return { stopped: 0 };
	const seenChildKeys = /* @__PURE__ */ new Set();
	let stopped = 0;
	for (const run of runs) {
		const childKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(run.childSessionKey);
		if (!childKey || seenChildKeys.has(childKey)) continue;
		seenChildKeys.add(childKey);
		if (!run.endedAt || run.pauseReason === "sessions_yield") {
			const cleared = require_cleanup.clearSessionQueues([childKey]);
			const parsed = require_session_key.parseAgentSessionKey(childKey);
			const storePath = require_paths.resolveStorePath(params.cfg.session?.store, { agentId: parsed?.agentId });
			const abortOutcome = abortSessionRunTargetWithOutcome({
				key: childKey,
				sessionId: require_reply_run_registry.replyRunRegistry.resolveSessionId(childKey) ?? require_session_accessor.loadSessionEntry({
					agentId: parsed?.agentId,
					clone: false,
					sessionKey: childKey,
					storePath
				})?.sessionId
			});
			const abortRejected = abortOutcome.active && !abortOutcome.aborted;
			const markedTerminated = abortRejected ? false : markSubagentRunTerminatedBestEffort({
				runId: run.runId,
				childSessionKey: childKey,
				reason: "killed",
				suppressTaskDelivery: true
			}) > 0;
			if (!abortRejected && (markedTerminated || abortOutcome.aborted || cleared.followupCleared > 0 || cleared.laneCleared > 0)) stopped += 1;
		}
		const cascadeResult = stopSubagentsForRequester({
			cfg: params.cfg,
			requesterSessionKey: childKey
		});
		stopped += cascadeResult.stopped;
	}
	if (stopped > 0) require_globals.logVerbose(`abort: stopped ${stopped} subagent run(s) for ${requesterKey}`);
	return { stopped };
}
async function tryFastAbortFromMessage(params) {
	const { ctx, cfg } = params;
	const commandSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.SessionKey) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.ParentSessionKey);
	const targetKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.CommandTargetSessionKey) ?? commandSessionKey;
	const raw = require_mentions.stripStructuralPrefixes(ctx.CommandBody ?? ctx.RawBody ?? ctx.Body ?? "");
	if (!require_abort_primitives.isAbortRequestText((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.ChatType) === "group" ? require_mentions.stripMentions(raw, ctx, cfg, require_agent_scope.resolveSessionAgentId({
		sessionKey: targetKey ?? ctx.SessionKey ?? "",
		config: cfg
	})) : raw)) return {
		handled: false,
		aborted: false
	};
	const commandAuthorized = ctx.CommandAuthorized;
	const auth = require_command_auth.resolveCommandAuthorization({
		ctx,
		cfg,
		commandAuthorized
	});
	if (!auth.isAuthorizedSender) return {
		handled: false,
		aborted: false
	};
	const agentId = require_agent_scope.resolveSessionAgentId({
		sessionKey: targetKey ?? ctx.SessionKey ?? "",
		config: cfg
	});
	const abortKey = targetKey ?? auth.from ?? auth.to;
	const requesterSessionKey = targetKey ?? ctx.SessionKey ?? abortKey;
	if (targetKey) {
		const storePath = require_paths.resolveStorePath(cfg.session?.store, { agentId });
		const abortCutoffForTarget = (target) => require_abort_cutoff.shouldPersistAbortCutoff({
			commandSessionKey,
			targetSessionKey: target.sessionKey
		}) ? require_abort_cutoff.resolveAbortCutoffFromContext(ctx) : void 0;
		let resolvedAbortTarget = null;
		try {
			resolvedAbortTarget = abortDeps.resolveSessionAbortTarget({
				agentId,
				sessionKey: targetKey,
				storePath
			});
		} catch (error) {
			require_globals.logVerbose(`abort: failed to resolve abort metadata for ${targetKey}: ${require_errors.formatErrorMessage(error)}`);
		}
		const resolvedTargetKey = resolvedAbortTarget?.sessionKey ?? targetKey;
		const conversationBoundAcpTargetKey = commandSessionKey ? resolveBoundAcpAbortTargetSessionKey({
			ctx,
			cfg,
			activeSessionKey: commandSessionKey
		}) : void 0;
		const boundAcpTargetKey = !require_session_key.isAcpSessionKey(resolvedTargetKey) ? conversationBoundAcpTargetKey : void 0;
		const abortTargetKeys = [resolvedTargetKey];
		if (boundAcpTargetKey && boundAcpTargetKey !== resolvedTargetKey) abortTargetKeys.push(boundAcpTargetKey);
		const acpManager = abortDeps.getAcpSessionManager();
		for (const acpTargetKey of abortTargetKeys.filter(require_session_key.isAcpSessionKey)) {
			if (acpManager.resolveSession({
				cfg,
				sessionKey: acpTargetKey
			}).kind === "none") continue;
			try {
				await acpManager.cancelSession({
					cfg,
					sessionKey: acpTargetKey,
					reason: "fast-abort"
				});
			} catch (error) {
				require_globals.logVerbose(`abort: ACP cancel failed for ${acpTargetKey}: ${require_errors.formatErrorMessage(error)}`);
			}
		}
		const sourceAbortKey = commandSessionKey && !abortTargetKeys.includes(commandSessionKey) && conversationBoundAcpTargetKey && abortTargetKeys.includes(conversationBoundAcpTargetKey) ? commandSessionKey : void 0;
		const sessionIdsByKey = new Map(abortTargetKeys.map((abortTargetKey) => [abortTargetKey, require_reply_run_registry.replyRunRegistry.resolveSessionId(abortTargetKey) ?? (abortTargetKey === resolvedTargetKey ? resolvedAbortTarget?.sessionId : resolveStoredSessionId({
			cfg,
			sessionKey: abortTargetKey
		}))]));
		let aborted = false;
		let activeAbortRejected = false;
		for (const abortTargetKey of abortTargetKeys) {
			const outcome = abortSessionRunTargetWithOutcome({
				key: abortTargetKey,
				sessionId: sessionIdsByKey.get(abortTargetKey)
			});
			activeAbortRejected ||= outcome.active && !outcome.aborted;
			aborted = outcome.aborted || aborted;
		}
		const sourceSessionId = sourceAbortKey ? require_reply_run_registry.replyRunRegistry.resolveSessionId(sourceAbortKey) ?? resolveStoredSessionId({
			cfg,
			sessionKey: sourceAbortKey
		}) : void 0;
		if (sourceAbortKey) {
			const outcome = abortSessionRunTargetWithOutcome({
				key: sourceAbortKey,
				sessionId: sourceSessionId
			});
			activeAbortRejected ||= outcome.active && !outcome.aborted;
			aborted = outcome.aborted || aborted;
		}
		const cleared = require_cleanup.clearSessionQueues(abortTargetKeys.flatMap((abortTargetKey) => [abortTargetKey, sessionIdsByKey.get(abortTargetKey)]).concat(sourceAbortKey, sourceSessionId));
		if (cleared.followupCleared > 0 || cleared.laneCleared > 0) require_globals.logVerbose(`abort: cleared followups=${cleared.followupCleared} lane=${cleared.laneCleared} keys=${cleared.keys.join(",")}`);
		const { stopped } = stopSubagentsForRequester({
			cfg,
			requesterSessionKey
		});
		if (activeAbortRejected && !aborted) return {
			handled: true,
			aborted: false,
			rejectionReason: "finalizing",
			stoppedSubagents: stopped
		};
		let persistedAbortTarget = null;
		try {
			persistedAbortTarget = await abortDeps.markSessionAbortTarget({
				scope: {
					agentId,
					sessionKey: targetKey,
					storePath
				},
				resolveAbortCutoff: abortCutoffForTarget
			});
		} catch (error) {
			require_globals.logVerbose(`abort: failed to persist abort metadata for ${targetKey}: ${require_errors.formatErrorMessage(error)}`);
		}
		if (persistedAbortTarget?.persisted === false) require_globals.logVerbose(`abort: failed to persist abort metadata for ${targetKey}: ${persistedAbortTarget.persistenceError ?? "unknown error"}`);
		const abortMemoryKey = persistedAbortTarget?.sessionKey ?? resolvedAbortTarget?.sessionKey ?? abortKey;
		const hasAbortTargetEntry = Boolean(persistedAbortTarget?.entry ?? resolvedAbortTarget?.entry);
		if (persistedAbortTarget?.persisted !== true && abortMemoryKey && !hasAbortTargetEntry) require_abort_primitives.setAbortMemory(abortMemoryKey, true);
		return {
			handled: true,
			aborted,
			stoppedSubagents: stopped
		};
	}
	if (abortKey) require_abort_primitives.setAbortMemory(abortKey, true);
	const { stopped } = stopSubagentsForRequester({
		cfg,
		requesterSessionKey
	});
	return {
		handled: true,
		aborted: false,
		stoppedSubagents: stopped
	};
}
//#endregion
Object.defineProperty(exports, "abortSessionRunTargetWithOutcome", {
	enumerable: true,
	get: function() {
		return abortSessionRunTargetWithOutcome;
	}
});
Object.defineProperty(exports, "formatAbortReplyText", {
	enumerable: true,
	get: function() {
		return formatAbortReplyText;
	}
});
Object.defineProperty(exports, "stopSubagentsForRequester", {
	enumerable: true,
	get: function() {
		return stopSubagentsForRequester;
	}
});
Object.defineProperty(exports, "tryFastAbortFromMessage", {
	enumerable: true,
	get: function() {
		return tryFastAbortFromMessage;
	}
});
