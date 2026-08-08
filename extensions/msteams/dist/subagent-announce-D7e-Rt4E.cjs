require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
require("./message-channel-jMzaqV09.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_subagent_capabilities = require("./subagent-capabilities-Bg6I8KeP.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_runs = require("./runs-BxiWZCUY.cjs");
require("./delivery-context-ywYGmcjO.cjs");
const require_subagent_system_prompt = require("./subagent-system-prompt-DHPZu-hz.cjs");
const require_server_plugins = require("./server-plugins-Dy_TV4O_.cjs");
const require_subagent_session_cleanup = require("./subagent-session-cleanup-C9pu4x8u.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/subagent-announce.ts
/**
* Subagent completion announcement coordinator.
*
* Captures child output, applies wait outcomes, routes announcements, and performs cleanup decisions.
*/
const defaultSubagentAnnounceDeps = {
	callGateway: require_call.callGateway,
	dispatchGatewayMethodInProcess: require_server_plugins.dispatchGatewayMethodInProcess,
	getRuntimeConfig: require_io.getRuntimeConfig,
	loadSubagentRegistryRuntime
};
let subagentAnnounceDeps = defaultSubagentAnnounceDeps;
const subagentRegistryRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./subagent-announce.registry.runtime-D6BxTgaa.cjs")));
function loadSubagentRegistryRuntime() {
	return subagentRegistryRuntimeLoader.load();
}
function buildAnnounceReplyInstruction(params) {
	if (params.requesterIsSubagent) return `Convert this completion into a concise internal orchestration update for your parent agent in your own words. Keep this internal context private (don't mention system/log/stats/session details or announce type). If this result is duplicate or no update is needed, reply ONLY: ${require_tokens.SILENT_REPLY_TOKEN}.`;
	if (params.expectsCompletionMessage) return `A completed ${params.announceType} is ready for parent review. Review/verify the result above before deciding whether the original task is done. If additional action is required, continue the task or record a follow-up; otherwise send a truthful user-facing update. Keep this internal context private (don't mention system/log/stats/session details or announce type). Reply ONLY: ${require_tokens.SILENT_REPLY_TOKEN} only when this exact result is already visible to the user in this same turn.`;
	return `A completed ${params.announceType} is ready for parent review. Review/verify the result above before deciding whether the original task is done. If additional action is required, continue the task or record a follow-up; otherwise send a truthful user-facing update. Keep this internal context private (don't mention system/log/stats/session details or announce type), and do not copy the internal event text verbatim. Reply ONLY: ${require_tokens.SILENT_REPLY_TOKEN} if this exact result was already delivered to the user in this same turn.`;
}
function buildAnnounceSteerMessage(events) {
	return require_subagent_system_prompt.formatAgentInternalEventsForPrompt(events) || "A background task finished. Process the completion update now.";
}
function hasUsableSessionEntry(entry) {
	if (!entry || typeof entry !== "object") return false;
	const sessionId = entry.sessionId;
	return typeof sessionId !== "string" || sessionId.trim() !== "";
}
function buildDescendantWakeMessage(params) {
	return [
		"[Subagent Context] Your prior run ended while waiting for descendant subagent completions.",
		"[Subagent Context] All pending descendants for that run have now settled.",
		"[Subagent Context] Continue your workflow using these results. Spawn more subagents if needed, otherwise send your final answer.",
		"",
		`Task: ${params.taskLabel}`,
		"",
		params.findings
	].join("\n");
}
const WAKE_RUN_SUFFIX = ":wake";
function stripWakeRunSuffixes(runId) {
	let next = runId.trim();
	while (next.endsWith(WAKE_RUN_SUFFIX)) next = next.slice(0, -5);
	return next || runId.trim();
}
function isWakeContinuationRun(runId) {
	const trimmed = runId.trim();
	if (!trimmed) return false;
	return stripWakeRunSuffixes(trimmed) !== trimmed;
}
function stripAndClassifyReply(text) {
	let result = text;
	let didStrip = false;
	const hasLeadingSilentToken = require_tokens.startsWithSilentToken(result, require_tokens.SILENT_REPLY_TOKEN);
	if (hasLeadingSilentToken) {
		result = require_tokens.stripLeadingSilentToken(result, require_tokens.SILENT_REPLY_TOKEN);
		didStrip = true;
	}
	if (hasLeadingSilentToken || result.toLowerCase().includes("NO_REPLY".toLowerCase())) {
		result = require_tokens.stripSilentToken(result, require_tokens.SILENT_REPLY_TOKEN);
		didStrip = true;
	}
	if (didStrip && (!result.trim() || require_tokens.isSilentReplyText(result, "NO_REPLY") || require_subagent_session_cleanup.isAnnounceSkip(result))) return null;
	return result;
}
async function wakeSubagentRunAfterDescendants(params) {
	if (params.signal?.aborted) return false;
	if (!hasUsableSessionEntry(require_subagent_system_prompt.loadSessionEntryByKey(params.childSessionKey))) return false;
	const announceTimeoutMs = require_subagent_system_prompt.resolveSubagentAnnounceTimeoutMs(subagentAnnounceDeps.getRuntimeConfig());
	const wakeMessage = buildDescendantWakeMessage({
		findings: params.findings,
		taskLabel: params.taskLabel
	});
	let wakeRunId;
	try {
		wakeRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((await require_subagent_system_prompt.runAnnounceDeliveryWithRetry({
			operation: "descendant wake agent call",
			signal: params.signal,
			run: async () => await subagentAnnounceDeps.dispatchGatewayMethodInProcess("agent", {
				sessionKey: params.childSessionKey,
				message: wakeMessage,
				deliver: false,
				inputProvenance: {
					kind: "inter_session",
					sourceSessionKey: params.childSessionKey,
					sourceChannel: "webchat",
					sourceTool: "subagent_announce"
				},
				idempotencyKey: require_subagent_session_cleanup.buildAnnounceIdempotencyKey(`${params.announceId}:wake`)
			}, { timeoutMs: announceTimeoutMs })
		}))?.runId) ?? "";
	} catch {
		return false;
	}
	if (!wakeRunId) return false;
	const { replaceSubagentRunAfterSteer } = await loadSubagentRegistryRuntime();
	return replaceSubagentRunAfterSteer({
		previousRunId: params.runId,
		nextRunId: wakeRunId,
		preserveFrozenResultFallback: true,
		task: wakeMessage
	});
}
async function runSubagentAnnounceFlow(params) {
	let didAnnounce = false;
	const expectsCompletionMessage = params.expectsCompletionMessage === true;
	const announceType = params.announceType ?? "subagent task";
	let shouldDeleteChildSession = params.cleanup === "delete";
	try {
		let targetRequesterSessionKey = params.requesterSessionKey;
		let targetRequesterOrigin = require_delivery_context_shared.normalizeDeliveryContext(params.requesterOrigin);
		const childSessionId = (() => {
			const entry = require_subagent_system_prompt.loadSessionEntryByKey(params.childSessionKey);
			return typeof entry?.sessionId === "string" && entry.sessionId.trim() ? entry.sessionId.trim() : void 0;
		})();
		const settleTimeoutMs = Math.min(Math.max(params.timeoutMs, 1), 12e4);
		let reply = params.roundOneReply;
		let outcome = params.outcome;
		if (childSessionId && require_runs.isEmbeddedAgentRunActive(childSessionId)) {
			if (!await require_runs.waitForEmbeddedAgentRunEnd(childSessionId, settleTimeoutMs) && require_runs.isEmbeddedAgentRunActive(childSessionId)) {
				shouldDeleteChildSession = false;
				if (outcome?.status !== "timeout" || params.cleanup === "delete") return false;
			}
		}
		if (!reply && params.waitForCompletion !== false) {
			const applied = require_subagent_session_cleanup.applySubagentWaitOutcome({
				wait: await require_subagent_session_cleanup.waitForSubagentRunOutcome(params.childRunId, settleTimeoutMs),
				outcome,
				startedAt: params.startedAt,
				endedAt: params.endedAt
			});
			outcome = applied.outcome;
			params.startedAt = applied.startedAt;
			params.endedAt = applied.endedAt;
		}
		if (!outcome) outcome = { status: "unknown" };
		const failedTerminalOutcome = outcome.status === "error";
		const allowFailedOutputCapture = !failedTerminalOutcome || !params.roundOneReply && !params.fallbackReply;
		if (failedTerminalOutcome) reply = void 0;
		let requesterDepth = require_subagent_capabilities.getSubagentDepthFromSessionStore(targetRequesterSessionKey);
		const requesterIsInternalSession = () => requesterDepth >= 1 || require_session_key.isCronSessionKey(targetRequesterSessionKey);
		let childCompletionFindings;
		let subagentRegistryRuntime;
		try {
			subagentRegistryRuntime = await subagentAnnounceDeps.loadSubagentRegistryRuntime();
			if (requesterDepth >= 1 && subagentRegistryRuntime.shouldIgnorePostCompletionAnnounceForSession(targetRequesterSessionKey)) return true;
			if (Math.max(0, subagentRegistryRuntime.countPendingDescendantRuns(params.childSessionKey)) > 0 && announceType !== "cron job") {
				shouldDeleteChildSession = false;
				return false;
			}
			if (typeof subagentRegistryRuntime.listSubagentRunsForRequester === "function") {
				const directChildren = subagentRegistryRuntime.listSubagentRunsForRequester(params.childSessionKey, { requesterRunId: params.childRunId });
				if (Array.isArray(directChildren) && directChildren.length > 0) childCompletionFindings = require_subagent_session_cleanup.buildChildCompletionFindings(require_subagent_session_cleanup.dedupeLatestChildCompletionRows(require_subagent_session_cleanup.filterCurrentDirectChildCompletionRows(directChildren, {
					requesterSessionKey: params.childSessionKey,
					getLatestSubagentRunByChildSessionKey: subagentRegistryRuntime.getLatestSubagentRunByChildSessionKey
				})));
			}
		} catch {}
		const announceId = require_subagent_session_cleanup.buildAnnounceIdFromChildRun({
			childSessionKey: params.childSessionKey,
			childRunId: params.childRunId
		});
		const childRunAlreadyWoken = isWakeContinuationRun(params.childRunId);
		if (params.wakeOnDescendantSettle === true && childCompletionFindings?.trim() && !childRunAlreadyWoken) {
			const wakeAnnounceId = require_subagent_session_cleanup.buildAnnounceIdFromChildRun({
				childSessionKey: params.childSessionKey,
				childRunId: stripWakeRunSuffixes(params.childRunId)
			});
			if (await wakeSubagentRunAfterDescendants({
				runId: params.childRunId,
				childSessionKey: params.childSessionKey,
				taskLabel: params.label || params.task || "task",
				findings: childCompletionFindings,
				announceId: wakeAnnounceId,
				signal: params.signal
			})) {
				shouldDeleteChildSession = false;
				return true;
			}
		}
		if (!childCompletionFindings) {
			const fallbackReply = failedTerminalOutcome ? void 0 : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.fallbackReply);
			const fallbackIsSilent = Boolean(fallbackReply) && (require_subagent_session_cleanup.isAnnounceSkip(fallbackReply) || require_tokens.isSilentReplyText(fallbackReply, "NO_REPLY"));
			if (!reply && allowFailedOutputCapture) reply = await require_subagent_session_cleanup.readSubagentOutput(params.childSessionKey, outcome);
			if (!reply?.trim() && allowFailedOutputCapture) reply = await require_subagent_session_cleanup.readLatestSubagentOutputWithRetry({
				sessionKey: params.childSessionKey,
				maxWaitMs: params.timeoutMs,
				outcome
			});
			if (!reply?.trim() && fallbackReply && !fallbackIsSilent) reply = fallbackReply;
			if (outcome?.status === "timeout" && reply?.trim() && params.waitForCompletion !== false) try {
				const applied = require_subagent_session_cleanup.applySubagentWaitOutcome({
					wait: await require_subagent_session_cleanup.waitForSubagentRunOutcome(params.childRunId, 0),
					outcome,
					startedAt: params.startedAt,
					endedAt: params.endedAt
				});
				outcome = applied.outcome;
				params.startedAt = applied.startedAt;
				params.endedAt = applied.endedAt;
			} catch {}
			if (require_subagent_session_cleanup.isAnnounceSkip(reply) || require_tokens.isSilentReplyText(reply, "NO_REPLY")) if (fallbackReply && !fallbackIsSilent) {
				const cleaned = stripAndClassifyReply(fallbackReply);
				if (cleaned === null) {
					if (require_subagent_session_cleanup.isAnnounceSkip(reply) && require_session_key.isCronSessionKey(targetRequesterSessionKey)) require_logger.logWarn(`cron job completion for session=${targetRequesterSessionKey} run=${params.childRunId} suppressed by ANNOUNCE_SKIP; the agent replied with the skip sentinel instead of delivering a result`);
					return true;
				}
				reply = cleaned;
			} else {
				if (require_subagent_session_cleanup.isAnnounceSkip(reply) && require_session_key.isCronSessionKey(targetRequesterSessionKey)) require_logger.logWarn(`cron job completion for session=${targetRequesterSessionKey} run=${params.childRunId} suppressed by ANNOUNCE_SKIP; the agent replied with the skip sentinel instead of delivering a result`);
				return true;
			}
			else if (reply) {
				const cleaned = stripAndClassifyReply(reply);
				if (cleaned === null) if (fallbackReply && !fallbackIsSilent) {
					const cleanedFallback = stripAndClassifyReply(fallbackReply);
					if (cleanedFallback === null) return true;
					reply = cleanedFallback;
				} else return true;
				else reply = cleaned;
			}
		}
		if (!outcome) outcome = { status: "unknown" };
		const statusLabel = outcome.status === "ok" ? "completed; ready for parent review" : outcome.status === "timeout" ? "timed out" : outcome.status === "error" ? `failed: ${outcome.error || "unknown error"}` : "finished with unknown status";
		const taskLabel = params.label || params.task || "task";
		const announceSessionId = childSessionId || "unknown";
		const findings = childCompletionFindings || reply || "(no output)";
		let requesterIsSubagent = requesterIsInternalSession();
		if (requesterIsSubagent) {
			const { isSubagentSessionRunActive, resolveRequesterForChildSession, shouldIgnorePostCompletionAnnounceForSession } = subagentRegistryRuntime ?? await loadSubagentRegistryRuntime();
			if (!isSubagentSessionRunActive(targetRequesterSessionKey)) {
				if (shouldIgnorePostCompletionAnnounceForSession(targetRequesterSessionKey)) return true;
				if (!hasUsableSessionEntry(require_subagent_system_prompt.loadSessionEntryByKey(targetRequesterSessionKey))) {
					const fallback = resolveRequesterForChildSession(targetRequesterSessionKey);
					if (!fallback?.requesterSessionKey) {
						shouldDeleteChildSession = false;
						return false;
					}
					targetRequesterSessionKey = fallback.requesterSessionKey;
					targetRequesterOrigin = require_delivery_context_shared.normalizeDeliveryContext(fallback.requesterOrigin) ?? targetRequesterOrigin;
					requesterDepth = require_subagent_capabilities.getSubagentDepthFromSessionStore(targetRequesterSessionKey);
					requesterIsSubagent = requesterIsInternalSession();
				}
			}
		}
		const replyInstruction = buildAnnounceReplyInstruction({
			requesterIsSubagent,
			announceType,
			expectsCompletionMessage
		});
		const statsLine = await require_subagent_session_cleanup.buildCompactAnnounceStatsLine({
			sessionKey: params.childSessionKey,
			startedAt: params.startedAt,
			endedAt: params.endedAt
		});
		const internalEvents = [{
			type: "task_completion",
			source: announceType === "cron job" ? "cron" : "subagent",
			childSessionKey: params.childSessionKey,
			childSessionId: announceSessionId,
			announceType,
			taskLabel,
			status: outcome.status,
			statusLabel,
			result: findings,
			statsLine,
			replyInstruction
		}];
		const triggerMessage = buildAnnounceSteerMessage(internalEvents);
		let directOrigin = targetRequesterOrigin;
		if (!requesterIsSubagent) {
			const { entry } = require_subagent_system_prompt.loadRequesterSessionEntry(targetRequesterSessionKey);
			directOrigin = require_subagent_system_prompt.resolveAnnounceOrigin(entry, targetRequesterOrigin);
		}
		const completionDirectOrigin = expectsCompletionMessage && !requesterIsSubagent ? await require_subagent_system_prompt.resolveSubagentCompletionOrigin({
			childSessionKey: params.childSessionKey,
			requesterSessionKey: targetRequesterSessionKey,
			requesterOrigin: directOrigin,
			childRunId: params.childRunId,
			spawnMode: params.spawnMode,
			expectsCompletionMessage
		}) : targetRequesterOrigin;
		const directIdempotencyKey = require_subagent_session_cleanup.buildAnnounceIdempotencyKey(announceId);
		const delivery = await require_subagent_system_prompt.deliverSubagentAnnouncement({
			requesterSessionKey: targetRequesterSessionKey,
			announceId,
			triggerMessage,
			steerMessage: triggerMessage,
			internalEvents,
			summaryLine: taskLabel,
			requesterSessionOrigin: targetRequesterOrigin,
			requesterOrigin: expectsCompletionMessage && !requesterIsSubagent ? completionDirectOrigin : targetRequesterOrigin,
			completionDirectOrigin,
			directOrigin,
			sourceSessionKey: params.childSessionKey,
			sourceChannel: require_message_channel_core.INTERNAL_MESSAGE_CHANNEL,
			sourceTool: "subagent_announce",
			targetRequesterSessionKey,
			requesterIsSubagent,
			expectsCompletionMessage,
			bestEffortDeliver: params.bestEffortDeliver,
			directIdempotencyKey,
			signal: params.signal
		});
		params.onDeliveryResult?.(delivery);
		didAnnounce = delivery.delivered || delivery.terminal === true;
		if (!delivery.delivered && delivery.path === "direct" && delivery.error) require_runtime.defaultRuntime.log(`[warn] Subagent completion direct announce failed for run ${params.childRunId}: ${delivery.error}`);
	} catch (err) {
		require_runtime.defaultRuntime.error?.(`Subagent announce failed: ${String(err)}`);
	} finally {
		if (params.label) try {
			await subagentAnnounceDeps.callGateway({
				method: "sessions.patch",
				params: {
					key: params.childSessionKey,
					label: params.label
				},
				timeoutMs: 1e4
			});
		} catch {}
		if (shouldDeleteChildSession && (params.onBeforeDeleteChildSession?.() ?? true)) await require_subagent_session_cleanup.deleteSubagentSessionForCleanup({
			callGateway: subagentAnnounceDeps.callGateway,
			childSessionKey: params.childSessionKey,
			spawnMode: params.spawnMode
		});
	}
	return didAnnounce;
}
const testing = { setDepsForTest(overrides) {
	const callGatewayOverride = overrides?.callGateway;
	const dispatchGatewayMethodInProcessOverride = overrides?.dispatchGatewayMethodInProcess ?? (callGatewayOverride ? (async (method, agentParams, options) => await callGatewayOverride({
		method,
		params: agentParams,
		expectFinal: options?.expectFinal,
		timeoutMs: options?.timeoutMs
	})) : void 0);
	subagentAnnounceDeps = overrides ? {
		...defaultSubagentAnnounceDeps,
		...overrides,
		...dispatchGatewayMethodInProcessOverride ? { dispatchGatewayMethodInProcess: dispatchGatewayMethodInProcessOverride } : {}
	} : defaultSubagentAnnounceDeps;
} };
//#endregion
exports.buildSubagentSystemPrompt = require_subagent_system_prompt.buildSubagentSystemPrompt;
exports.captureSubagentCompletionReply = require_subagent_session_cleanup.captureSubagentCompletionReply;
exports.runSubagentAnnounceFlow = runSubagentAnnounceFlow;
exports.testing = testing;
