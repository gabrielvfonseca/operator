require("./rolldown-runtime-u92d-OFm.cjs");
require("./plugins-_-82JYfc.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_runtime = require("./runtime-CIO0BRex.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
require("./message-channel-jMzaqV09.cjs");
const require_completion_delivery_policy = require("./completion-delivery-policy-Djb6F8Lx.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_session_context = require("./session-context-ByjQL-XR.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_inbound_context = require("./inbound-context-DRXGR9Cr.cjs");
const require_kernel = require("./kernel-BQTSZWlX.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_heartbeat_wake = require("./heartbeat-wake-E8hls_pf.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_transcript = require("./transcript-BHT2QzlI.cjs");
const require_delivery_queue = require("./delivery-queue-BAS-RXoO.cjs");
const require_delivery_evidence = require("./delivery-evidence-C3rOjggE.cjs");
const require_subagent_system_prompt = require("./subagent-system-prompt-DHPZu-hz.cjs");
const require_session_delivery_queue = require("./session-delivery-queue-BY_SdQdo.cjs");
const require_cron_run_continuation_cleanup = require("./cron-run-continuation-cleanup-DnxMCgYR.cjs");
const require_server_plugins = require("./server-plugins-Dy_TV4O_.cjs");
const require_targets = require("./targets-BfrPEAMP.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
require("./get-reply-run-queue-CC1iWomD.cjs");
const require_restart_sentinel = require("./restart-sentinel-BH8dJFkM.cjs");
const require_update_control_plane_sentinel = require("./update-control-plane-sentinel-9paZY1RI.cjs");
const require_session = require("./session-Baxdo1qA.cjs");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/gateway/server-restart-sentinel-agent-delivery.ts
const log$1 = require_subsystem.createSubsystemLogger("gateway/restart-sentinel");
const AGENT_DELIVERY_OWNERSHIP_RETRY_MS = 1e3;
function sessionDeliveryStateDirArgs$1(stateDir) {
	return stateDir === void 0 ? [] : [stateDir];
}
async function deadLetterSessionDelivery(entry, reason, stateDir) {
	await require_session_delivery_queue.markSessionDeliverySettlement(entry, "moved-to-failed", ...sessionDeliveryStateDirArgs$1(stateDir));
	log$1.warn("queued session delivery requires durable dead-letter settlement", { queueId: entry.id });
	throw new require_session_delivery_queue.SessionDeliveryDeadLetteredError(reason);
}
function hasQueuedVisiblePayload(payload) {
	if (payload && typeof payload === "object" && !Array.isArray(payload)) {
		const visible = payload.visible;
		if (typeof visible === "boolean") return visible;
	}
	return require_delivery_evidence.hasVisibleAgentPayload({ payloads: [payload] }, {
		includeErrorPayloads: false,
		includeReasoningPayloads: false
	});
}
function hasQueuedVisibleAgentPayload(result) {
	return Array.isArray(result.payloads) && result.payloads.some(hasQueuedVisiblePayload);
}
function hasUnexpectedRecoverySideEffects(result) {
	return result.restartUnsafeSideEffectsDetected === true || result.messagingToolAggregateEvidenceUnaccounted === true || result.messagingToolSentTargetsTruncated === true || result.didSendDeterministicApprovalPrompt === true || require_delivery_evidence.hasCommittedOutboundDeliveryEvidence(result);
}
function resolveQueuedAgentRunId(entry) {
	const base = entry.idempotencyKey ?? entry.messageId;
	return entry.agentRunAttempt ? `${base}:attempt:${entry.agentRunAttempt}` : base;
}
function collectVisiblePayloadMediaUrls(result) {
	const urls = /* @__PURE__ */ new Set();
	const payloads = Array.isArray(result.payloads) ? result.payloads : [];
	for (const payload of payloads) {
		if (!hasQueuedVisiblePayload(payload)) continue;
		for (const url of require_delivery_evidence.collectDeliveredMediaUrls({ payloads: [payload] })) urls.add(url);
	}
	return Array.from(urls);
}
function collectQueuedDeliveredMediaUrls(params) {
	if (params.route.channel === "webchat") return collectVisiblePayloadMediaUrls(params.result);
	return require_delivery_evidence.collectAutomaticDeliveredMediaUrls(params.result);
}
function hasAutomaticVisibleSendEvidence(result) {
	if (result.deliveryStatus?.status === "sent" || result.deliveryStatus?.status === "suppressed") return hasQueuedVisibleAgentPayload(result);
	const payloads = Array.isArray(result.payloads) ? result.payloads : [];
	return (Array.isArray(result.deliveryStatus?.payloadOutcomes) ? result.deliveryStatus.payloadOutcomes : []).some((outcome) => {
		if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) return false;
		const record = outcome;
		if (record.status !== "sent" && record.status !== "suppressed" && record.sentBeforeError !== true) return false;
		const index = typeof record.index === "number" && Number.isInteger(record.index) ? record.index : void 0;
		return index !== void 0 && hasQueuedVisiblePayload(payloads[index]);
	});
}
function hasQueuedVisibleReplyEvidence(params) {
	if (params.route.channel === "webchat") return hasQueuedVisibleAgentPayload(params.result);
	return hasAutomaticVisibleSendEvidence(params.result);
}
async function evaluateQueuedGeneratedMediaAgentResult(params) {
	if (hasUnexpectedRecoverySideEffects(params.result)) {
		log$1.warn("queued generated-media recovery reported an unexpected committed side effect", { queueId: params.entry.id });
		await deadLetterSessionDelivery(params.entry, "queued generated-media delivery dead-lettered after an unexpected committed side effect", params.stateDir);
	}
	const expectedMediaUrls = params.entry.expectedMediaUrls ?? [];
	const deliveredMediaUrls = new Set(collectQueuedDeliveredMediaUrls(params));
	const missingMediaUrls = expectedMediaUrls.filter((url) => !deliveredMediaUrls.has(url));
	const provenExpectedMediaUrls = expectedMediaUrls.filter((url) => deliveredMediaUrls.has(url));
	const ambiguousMediaUrls = new Set(require_delivery_evidence.collectAmbiguousAutomaticMediaUrls(params.result));
	const deliveryFailure = require_delivery_evidence.getAgentCommandDeliveryFailure(params.result);
	const replySatisfied = expectedMediaUrls.length > 0 ? missingMediaUrls.length === 0 : hasQueuedVisibleReplyEvidence(params);
	if (params.result.payloadsTruncated === true && !replySatisfied) {
		log$1.warn("queued generated-media delivery has truncated delivery evidence", { queueId: params.entry.id });
		await deadLetterSessionDelivery(params.entry, "queued generated-media delivery dead-lettered after truncated evidence", params.stateDir);
	}
	if (expectedMediaUrls.length > 0 && missingMediaUrls.length === 0) {
		await params.persistInternalMedia?.(provenExpectedMediaUrls);
		return;
	}
	const rearmAgentRun = async (reason, updates) => {
		const currentAgentRunAttempt = params.entry.agentRunAttempt ?? 0;
		if (!(params.entry.lastChargedAgentRunAttempt === currentAgentRunAttempt)) await require_session_delivery_queue.failSessionDelivery(params.entry.id, reason, ...sessionDeliveryStateDirArgs$1(params.stateDir));
		try {
			if (updates) await require_session_delivery_queue.advanceSessionDeliveryAgentRun(params.entry.id, updates, ...sessionDeliveryStateDirArgs$1(params.stateDir));
			else if (params.stateDir !== void 0) await require_session_delivery_queue.advanceSessionDeliveryAgentRun(params.entry.id, void 0, params.stateDir);
			else await require_session_delivery_queue.advanceSessionDeliveryAgentRun(params.entry.id);
			await require_session_delivery_queue.deferSessionDelivery(params.entry.id, AGENT_DELIVERY_OWNERSHIP_RETRY_MS, ...sessionDeliveryStateDirArgs$1(params.stateDir));
		} catch (error) {
			log$1.warn("queued generated-media terminal attempt state transition remains pending", {
				queueId: params.entry.id,
				error: String(error)
			});
			throw new require_session_delivery_queue.SessionDeliveryRetryChargedError(`${reason}; queue state transition failed after retry charge`);
		}
		throw new require_session_delivery_queue.SessionDeliveryDeferredError(reason);
	};
	if (deliveryFailure && expectedMediaUrls.length > 0) {
		if (params.result.deliveryStatus?.status === "partial_failed" && !require_delivery_evidence.hasCompleteAutomaticMediaDeliveryOutcomeEvidence(params.result, missingMediaUrls) || missingMediaUrls.some((url) => ambiguousMediaUrls.has(url))) {
			log$1.warn("queued generated-media delivery has ambiguous attachment side effects", {
				queueId: params.entry.id,
				error: deliveryFailure
			});
			await deadLetterSessionDelivery(params.entry, "queued generated-media delivery dead-lettered after ambiguous side effects", params.stateDir);
		}
	} else if (deliveryFailure) {
		if (hasQueuedVisibleReplyEvidence(params)) {
			log$1.warn("queued generated-media notice may already be visible; refusing duplicate replay", {
				queueId: params.entry.id,
				error: deliveryFailure
			});
			await deadLetterSessionDelivery(params.entry, "queued generated-media notice dead-lettered after a visible partial delivery", params.stateDir);
		}
		await rearmAgentRun(deliveryFailure);
	}
	if (provenExpectedMediaUrls.length > 0) await params.persistInternalMedia?.(provenExpectedMediaUrls);
	if (missingMediaUrls.length > 0) {
		const retryMessage = require_subagent_system_prompt.formatGeneratedMediaDeliveryRetryForPrompt(missingMediaUrls);
		await rearmAgentRun(`queued generated-media agent turn ${missingMediaUrls.length < expectedMediaUrls.length ? "partially missed" : "missed"} expected media: ${missingMediaUrls.join(", ")}`, {
			expectedMediaUrls: missingMediaUrls,
			...missingMediaUrls.length < expectedMediaUrls.length || hasQueuedVisibleReplyEvidence(params) || params.result.deliveryStatus?.status === "partial_failed" ? { suppressTextDelivery: true } : {},
			...retryMessage ? { message: retryMessage } : {}
		});
	}
	if (expectedMediaUrls.length === 0 && !hasQueuedVisibleReplyEvidence(params)) await rearmAgentRun("queued generated-media agent turn completed without a visible reply");
}
/** Runs durable generated-media handoffs through the normal owning-session agent loop. */
async function deliverQueuedGeneratedMediaAgentTurn(params) {
	if (params.entry.kind !== "agentTurn") return false;
	const entry = params.entry;
	const route = entry.route;
	if (!route || entry.inputProvenance?.kind !== "inter_session" || !entry.sourceReplyDeliveryMode) return false;
	const queuedRunId = resolveQueuedAgentRunId(entry);
	if (require_completion_delivery_policy.resolveDurableCompletionDeliveryMode(entry.sourceReplyDeliveryMode) === "host_owned" && route.channel === "webchat") return await deadLetterSessionDelivery(entry, "queued host-owned generated-media delivery requires an external route", params.stateDir);
	const persistInternalMedia = route.channel === "webchat" && (entry.expectedMediaUrls?.length ?? 0) > 0 ? async (mediaUrls) => {
		const sessionId = params.sessionEntry?.sessionId?.trim();
		if (!sessionId) throw new Error("queued internal generated-media delivery has no owning session");
		const appended = await require_transcript.appendAssistantMessageToSessionTranscript({
			sessionKey: params.canonicalKey,
			expectedSessionId: sessionId,
			...params.sessionEntry?.cronRunContinuation?.lifecycleRevision ? { expectedLifecycleRevision: params.sessionEntry.cronRunContinuation.lifecycleRevision } : {},
			mediaUrls,
			idempotencyKey: `${queuedRunId}:generated-media-transcript`,
			updateMode: "inline"
		});
		if (!appended.ok) {
			if (appended.code === "session-rebound") await deadLetterSessionDelivery(entry, "queued internal generated-media delivery lost its owning session", params.stateDir);
			throw new Error(`queued internal generated-media transcript persistence failed: ${appended.reason}`);
		}
	} : void 0;
	const evaluateResult = async (result) => {
		await evaluateQueuedGeneratedMediaAgentResult({
			entry,
			result,
			route,
			...params.stateDir !== void 0 ? { stateDir: params.stateDir } : {},
			...persistInternalMedia ? { persistInternalMedia } : {}
		});
		return true;
	};
	const terminalEvidence = require_store.getRestartRecoveryTerminalDeliveryEvidence(params.sessionEntry, queuedRunId);
	if (terminalEvidence) return await evaluateResult(terminalEvidence);
	if (require_store.hasRestartRecoveryTerminalRun(params.sessionEntry, queuedRunId)) await deadLetterSessionDelivery(entry, "queued generated-media agent turn dead-lettered without durable terminal evidence", params.stateDir);
	if (params.sessionEntry?.restartRecoveryDeliverySourceRunId === queuedRunId && Boolean(params.sessionEntry.restartRecoveryDeliveryRunId)) {
		await require_session_delivery_queue.deferSessionDelivery(entry.id, AGENT_DELIVERY_OWNERSHIP_RETRY_MS, ...sessionDeliveryStateDirArgs$1(params.stateDir));
		throw new require_session_delivery_queue.SessionDeliveryDeferredError("queued generated-media agent turn is still owned by agent recovery");
	}
	if (entry.deliveryStartedAt !== void 0) await deadLetterSessionDelivery(entry, "queued generated-media agent turn dead-lettered after an interrupted unproven attempt", params.stateDir);
	const sourceReplyDeliveryMode = "automatic";
	const cronSessionId = params.sessionEntry?.cronRunContinuation?.lifecycleRevision?.trim() ? params.sessionEntry?.sessionId?.trim() : void 0;
	await require_session_delivery_queue.markSessionDeliveryAttemptStarted(entry, ...sessionDeliveryStateDirArgs$1(params.stateDir));
	let accepted = false;
	let response;
	try {
		response = await require_server_plugins.dispatchGatewayMethodInProcess("agent", {
			sessionKey: params.canonicalKey,
			message: entry.message,
			deliver: route.channel !== require_message_channel_core.INTERNAL_MESSAGE_CHANNEL,
			bestEffortDeliver: false,
			channel: route.channel,
			accountId: route.accountId,
			to: route.to,
			threadId: route.threadId,
			...cronSessionId ? { sessionId: cronSessionId } : {},
			inputProvenance: entry.inputProvenance,
			sourceReplyDeliveryMode,
			disableMessageTool: true,
			forceRestartSafeTools: true,
			idempotencyKey: queuedRunId
		}, {
			...cronSessionId ? { allowSyntheticCronRunContinuation: true } : {},
			expectFinal: true,
			forceSyntheticClient: true,
			internalDeliveryMediaUrls: entry.expectedMediaUrls ?? [],
			...entry.suppressTextDelivery === true ? { internalDeliverySuppressText: true } : {},
			onAccepted: () => {
				accepted = true;
			}
		});
	} catch (error) {
		if (!accepted) throw new require_session_delivery_queue.SessionDeliverySafeRetryError("queued generated-media agent turn failed before gateway acceptance", { cause: error });
		throw error;
	}
	const result = require_delivery_evidence.getGatewayAgentResult(response);
	if (!result) {
		const responseStatus = response && typeof response === "object" ? response.status : void 0;
		const latestEntry = require_session_utils.loadSessionEntry(entry.sessionKey).entry;
		if (responseStatus === "accepted") accepted = true;
		if (responseStatus === "accepted" || responseStatus === "in_flight" || latestEntry?.restartRecoveryDeliverySourceRunId === queuedRunId && latestEntry.restartRecoveryDeliveryRunId) {
			await require_session_delivery_queue.deferSessionDelivery(entry.id, AGENT_DELIVERY_OWNERSHIP_RETRY_MS, ...sessionDeliveryStateDirArgs$1(params.stateDir));
			throw new require_session_delivery_queue.SessionDeliveryDeferredError("queued generated-media agent turn is still owned by agent recovery");
		}
		if (require_store.hasRestartRecoveryTerminalRun(latestEntry, queuedRunId)) {
			const latestTerminalEvidence = require_store.getRestartRecoveryTerminalDeliveryEvidence(latestEntry, queuedRunId);
			if (latestTerminalEvidence) return await evaluateResult(latestTerminalEvidence);
			log$1.warn("queued generated-media agent turn ended without durable delivery evidence; failing closed", {
				queueId: entry.id,
				runId: queuedRunId
			});
			await deadLetterSessionDelivery(entry, "queued generated-media agent turn dead-lettered without durable terminal evidence", params.stateDir);
		}
		if (!accepted) throw new require_session_delivery_queue.SessionDeliverySafeRetryError("queued generated-media agent turn returned no result before gateway acceptance");
		throw new Error("queued generated-media agent turn returned no delivery result");
	}
	return await evaluateResult(result);
}
//#endregion
//#region src/gateway/startup-tasks.ts
function taskMeta(task, result) {
	return {
		source: task.source,
		...task.agentId ? { agentId: task.agentId } : {},
		...task.sessionKey ? { sessionKey: task.sessionKey } : {},
		...task.workspaceDir ? { workspaceDir: task.workspaceDir } : {},
		...result?.status === "failed" || result?.status === "skipped" ? { reason: result.reason } : {}
	};
}
/** Runs startup tasks in order and logs failed/skipped task metadata. */
async function runStartupTasks(params) {
	const results = [];
	for (const task of params.tasks) {
		let result;
		try {
			result = await task.run();
		} catch (err) {
			result = {
				status: "failed",
				reason: require_errors.formatErrorMessage(err)
			};
		}
		results.push(result);
		if (result.status === "failed") {
			params.log.warn("startup task failed", taskMeta(task, result));
			continue;
		}
		if (result.status === "skipped") params.log.debug("startup task skipped", taskMeta(task, result));
	}
	return results;
}
//#endregion
//#region src/gateway/server-restart-sentinel.ts
const log = require_subsystem.createSubsystemLogger("gateway/restart-sentinel");
const OUTBOUND_RETRY_DELAY_MS = 1e3;
const OUTBOUND_MAX_ATTEMPTS = 45;
const RESTART_CONTINUATION_BUSY_RETRY_DELAY_MS = process.env.VITEST ? 1 : 6e3;
const RESTART_CONTINUATION_BUSY_MAX_ATTEMPTS = 20;
const CONTROL_PLANE_UPDATE_PENDING_RETRY_DELAY_MS = process.env.VITEST ? 1 : 2e3;
const CONTROL_PLANE_UPDATE_PENDING_MAX_ATTEMPTS = 900;
const RESTART_CONTINUATION_BUSY_RETRY_ERROR = "restart continuation deferred because previous run is still shutting down";
let latestUpdateRestartSentinel = null;
function sessionDeliveryStateDirArgs(stateDir) {
	return stateDir === void 0 ? [] : [stateDir];
}
function cloneRestartSentinelPayload(payload) {
	if (!payload) return null;
	return structuredClone(payload);
}
function hasRoutableDeliveryContext(context) {
	return Boolean(context?.channel && context?.to);
}
function enqueueRestartSentinelWake(message, sessionKey, deliveryContext) {
	require_system_events.enqueueSystemEvent(message, {
		sessionKey,
		...deliveryContext ? { deliveryContext } : {}
	});
	require_heartbeat_wake.requestHeartbeat({
		source: "restart-sentinel",
		intent: "immediate",
		reason: "wake",
		sessionKey
	});
}
async function waitForOutboundRetry(delayMs) {
	await new Promise((resolve) => {
		setTimeout(resolve, delayMs).unref?.();
	});
}
async function deliverRestartSentinelNotice(params) {
	const payloads = [{ text: params.message }];
	const queueId = await require_delivery_queue.enqueueDelivery({
		channel: params.channel,
		to: params.to,
		accountId: params.accountId,
		replyToId: params.replyToId,
		threadId: params.threadId,
		payloads,
		bestEffort: false
	}).catch(() => null);
	for (let attempt = 1; attempt <= OUTBOUND_MAX_ATTEMPTS; attempt += 1) try {
		const send = await require_runtime.sendDurableMessageBatch({
			cfg: params.cfg,
			channel: params.channel,
			to: params.to,
			accountId: params.accountId,
			replyToId: params.replyToId,
			threadId: params.threadId,
			payloads,
			session: params.session,
			deps: params.deps,
			bestEffort: false,
			skipQueue: true
		});
		if (send.status === "failed" || send.status === "partial_failed") throw send.error;
		if ((send.status === "sent" ? send.results : []).length > 0) {
			if (queueId) await require_delivery_queue.ackDelivery(queueId).catch(() => {});
			return;
		}
		throw new Error("outbound delivery returned no results");
	} catch (err) {
		const retrying = attempt < OUTBOUND_MAX_ATTEMPTS;
		const suffix = retrying ? `; retrying in ${OUTBOUND_RETRY_DELAY_MS}ms` : "";
		log.warn(`${params.summary}: outbound delivery failed${suffix}: ${String(err)}`, {
			channel: params.channel,
			to: params.to,
			sessionKey: params.sessionKey,
			attempt,
			maxAttempts: OUTBOUND_MAX_ATTEMPTS
		});
		if (!retrying) {
			if (queueId) await require_delivery_queue.failDelivery(queueId, require_errors.formatErrorMessage(err)).catch(() => void 0);
			return;
		}
		await waitForOutboundRetry(OUTBOUND_RETRY_DELAY_MS);
	}
}
function buildRestartContinuationMessageId(params) {
	return `restart-sentinel:${params.sessionKey}:${params.kind}:${params.ts}`;
}
function resolveRestartContinuationRoute(params) {
	if (!params.channel || !params.to) return;
	return {
		channel: params.channel,
		to: params.to,
		...params.accountId ? { accountId: params.accountId } : {},
		...params.replyToId ? { replyToId: params.replyToId } : {},
		...params.threadId ? { threadId: params.threadId } : {},
		chatType: params.chatType
	};
}
function isRestartContinuationBusyPayload(payload) {
	return typeof payload.text === "string" && payload.text.trim() === "⚠️ Previous run is still shutting down. Please try again in a moment.";
}
function isRestartContinuationBusyRetry(entry) {
	return entry?.lastError === RESTART_CONTINUATION_BUSY_RETRY_ERROR;
}
function resolveQueuedRestartContinuationMessageId(entry) {
	if (isRestartContinuationBusyRetry(entry) && entry.retryCount > 0) return `${entry.messageId}:retry:${entry.retryCount}`;
	return entry.messageId;
}
function resolveQueuedSessionDeliveryContext(entry) {
	if (entry.kind === "agentTurn" && entry.route) return {
		channel: entry.route.channel,
		to: entry.route.to,
		...entry.route.accountId ? { accountId: entry.route.accountId } : {},
		...entry.route.threadId ? { threadId: entry.route.threadId } : {}
	};
	return entry.deliveryContext;
}
async function deliverQueuedSessionDelivery(params) {
	const { cfg, entry, storePath, canonicalKey } = require_session_utils.loadSessionEntry(params.entry.sessionKey);
	const queuedDeliveryContext = resolveQueuedSessionDeliveryContext(params.entry);
	if (params.entry.kind === "systemEvent") {
		enqueueRestartSentinelWake(params.entry.text, canonicalKey, queuedDeliveryContext);
		return;
	}
	if (params.entry.expectedSessionId && (!entry?.sessionId || entry.sessionId !== params.entry.expectedSessionId)) {
		log.warn("restart continuation skipped: session changed", {
			sessionKey: canonicalKey,
			queueId: params.entry.id,
			expectedSessionId: params.entry.expectedSessionId,
			actualSessionId: entry?.sessionId ?? null
		});
		enqueueRestartSentinelWake(params.entry.message, canonicalKey, queuedDeliveryContext);
		return;
	}
	if (!params.entry.route) {
		enqueueRestartSentinelWake(params.entry.message, canonicalKey, queuedDeliveryContext);
		return;
	}
	if (await deliverQueuedGeneratedMediaAgentTurn({
		entry: params.entry,
		canonicalKey,
		sessionEntry: entry,
		...params.stateDir !== void 0 ? { stateDir: params.stateDir } : {}
	})) return;
	if (params.entry.deliveryStartedAt !== void 0) {
		await require_session_delivery_queue.markSessionDeliverySettlement(params.entry, "moved-to-failed", ...sessionDeliveryStateDirArgs(params.stateDir));
		throw new require_session_delivery_queue.SessionDeliveryDeadLetteredError("queued agent turn dead-lettered after an interrupted unproven attempt");
	}
	const route = params.entry.route;
	const messageId = resolveQueuedRestartContinuationMessageId(params.entry);
	const userMessage = params.entry.message.trim();
	const agentId = require_agent_scope.resolveSessionAgentId({
		sessionKey: canonicalKey,
		config: cfg
	});
	let dispatchError;
	const ctxPayload = require_inbound_context.finalizeInboundContext({
		Body: userMessage,
		BodyForAgent: userMessage,
		BodyForCommands: "",
		RawBody: userMessage,
		CommandBody: "",
		SessionKey: canonicalKey,
		AccountId: route.accountId,
		MessageSid: messageId,
		Timestamp: Date.now(),
		InputProvenance: {
			kind: "internal_system",
			sourceChannel: route.channel,
			sourceTool: "restart-sentinel"
		},
		Provider: require_message_channel_core.INTERNAL_MESSAGE_CHANNEL,
		Surface: require_message_channel_core.INTERNAL_MESSAGE_CHANNEL,
		ChatType: route.chatType,
		CommandAuthorized: true,
		GatewayClientScopes: ["operator.admin"],
		GatewayClientCaps: [],
		ReplyToId: route.replyToId,
		OriginatingChannel: route.channel,
		OriginatingTo: route.to,
		ExplicitDeliverRoute: false,
		MessageThreadId: route.threadId
	}, {
		forceBodyForCommands: true,
		forceChatType: true
	});
	await require_kernel.dispatchAssembledChannelTurn({
		cfg,
		channel: route.channel,
		accountId: route.accountId,
		agentId,
		routeSessionKey: canonicalKey,
		storePath,
		ctxPayload,
		recordInboundSession: require_session.recordInboundSession,
		dispatchReplyWithBufferedBlockDispatcher: require_session.dispatchReplyWithBufferedBlockDispatcher,
		replyOptions: { sourceReplyDeliveryMode: "message_tool_only" },
		onTurnAdopted: () => require_session_delivery_queue.markSessionDeliveryAttemptStarted(params.entry, ...sessionDeliveryStateDirArgs(params.stateDir)),
		delivery: {
			preparePayload: (payload) => {
				if (isRestartContinuationBusyPayload(payload)) throw new require_session_delivery_queue.SessionDeliverySafeRetryError(RESTART_CONTINUATION_BUSY_RETRY_ERROR);
				return payload;
			},
			durable: false,
			deliver: async () => ({ visibleReplySent: false }),
			onError: (err, info) => {
				dispatchError ??= err;
				log.warn(`restart continuation dispatch failed during ${info.kind}: ${String(err)}`, { sessionKey: canonicalKey });
			}
		},
		record: { onRecordError: (err) => {
			log.warn(`restart continuation failed to record inbound session metadata: ${String(err)}`, { sessionKey: canonicalKey });
		} }
	});
	if (dispatchError) throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(dispatchError, "Non-Error thrown");
}
function buildQueuedRestartContinuation(params) {
	const idempotencyKey = buildRestartContinuationMessageId({
		sessionKey: params.sessionKey,
		kind: params.continuation.kind,
		ts: params.ts
	});
	if (params.continuation.kind === "systemEvent") return {
		kind: "systemEvent",
		sessionKey: params.sessionKey,
		text: params.continuation.text,
		...params.deliveryContext ? { deliveryContext: params.deliveryContext } : {},
		idempotencyKey,
		maxRetries: RESTART_CONTINUATION_BUSY_MAX_ATTEMPTS
	};
	return {
		kind: "agentTurn",
		sessionKey: params.sessionKey,
		message: params.continuation.message,
		messageId: idempotencyKey,
		...params.expectedSessionId ? { expectedSessionId: params.expectedSessionId } : {},
		maxRetries: RESTART_CONTINUATION_BUSY_MAX_ATTEMPTS,
		...params.route ? { route: params.route } : {},
		...params.deliveryContext ? { deliveryContext: params.deliveryContext } : {},
		idempotencyKey
	};
}
async function drainRestartContinuationQueue(params) {
	for (let attempt = 1; attempt <= RESTART_CONTINUATION_BUSY_MAX_ATTEMPTS; attempt += 1) {
		await require_session_delivery_queue.drainPendingSessionDeliveries({
			drainKey: `restart-continuation:${params.entryId}`,
			logLabel: "restart continuation",
			log: params.log,
			deliver: (entry, context = {}) => deliverQueuedSessionDelivery({
				deps: params.deps,
				entry,
				...context.stateDir !== void 0 ? { stateDir: context.stateDir } : {}
			}),
			onSettled: (entry) => require_cron_run_continuation_cleanup.removeCronRunContinuationSessionIfIdle(entry.sessionKey, entry.id),
			selectEntry: (entry) => ({
				match: entry.id === params.entryId,
				bypassBackoff: true
			})
		});
		if (!isRestartContinuationBusyRetry(await require_session_delivery_queue.loadPendingSessionDelivery(params.entryId))) return;
		if (attempt >= RESTART_CONTINUATION_BUSY_MAX_ATTEMPTS) return;
		params.log.info(`restart continuation: entry ${params.entryId} still waiting for the previous run to clear; retrying in ${RESTART_CONTINUATION_BUSY_RETRY_DELAY_MS}ms`);
		await waitForOutboundRetry(RESTART_CONTINUATION_BUSY_RETRY_DELAY_MS);
	}
}
async function recoverPendingRestartContinuationDeliveries(params) {
	await require_session_delivery_queue.recoverPendingSessionDeliveries({
		deliver: (entry, context = {}) => deliverQueuedSessionDelivery({
			deps: params.deps,
			entry,
			...context.stateDir !== void 0 ? { stateDir: context.stateDir } : {}
		}),
		log: params.log ?? log,
		maxEnqueuedAt: params.maxEnqueuedAt,
		onSettled: (entry) => require_cron_run_continuation_cleanup.removeCronRunContinuationSessionIfIdle(entry.sessionKey, entry.id)
	});
}
async function loadRestartSentinelStartupTask(params) {
	const sentinel = await require_restart_sentinel.readRestartSentinel();
	if (!sentinel) return null;
	const payload = sentinel.payload;
	if (payload.kind === "update") recordLatestUpdateRestartSentinel(payload);
	const sessionKey = payload.sessionKey?.trim();
	const message = require_restart_sentinel.formatRestartSentinelMessage(payload);
	const summary = require_restart_sentinel.summarizeRestartSentinel(payload);
	const wakeDeliveryContext = require_delivery_context_shared.mergeDeliveryContext(payload.threadId != null ? {
		...payload.deliveryContext,
		threadId: payload.threadId
	} : payload.deliveryContext, void 0);
	const run = async () => {
		if (require_update_control_plane_sentinel.isPendingControlPlaneUpdateRestartSentinel(payload)) {
			const attempt = params.attempt ?? 0;
			if (attempt < CONTROL_PLANE_UPDATE_PENDING_MAX_ATTEMPTS) {
				setTimeout(() => {
					require_gateway_work_admission.runWithGatewayIndependentRootWorkAdmission(async () => {
						await scheduleRestartSentinelWakeAttempt({
							deps: params.deps,
							attempt: attempt + 1
						});
					}).catch((err) => {
						log.warn(`restart sentinel pending update retry failed: ${require_errors.formatErrorMessage(err)}`);
					});
				}, CONTROL_PLANE_UPDATE_PENDING_RETRY_DELAY_MS).unref?.();
				return {
					status: "skipped",
					reason: "update-restart-pending"
				};
			}
			log.warn(`${summary}: update restart sentinel remained pending after retry window`, {
				sessionKey,
				reason: payload.stats?.reason ?? null
			});
		}
		if (!sessionKey) {
			const mainSessionKey = require_sessions.resolveMainSessionKeyFromConfig();
			require_system_events.enqueueSystemEvent(message, { sessionKey: mainSessionKey });
			if (payload.continuation) log.warn(`${summary}: continuation skipped: restart sentinel sessionKey unavailable`, {
				sessionKey: mainSessionKey,
				continuationKind: payload.continuation.kind
			});
			await require_restart_sentinel.clearRestartSentinel();
			return { status: "ran" };
		}
		const { baseSessionKey, threadId: sessionThreadId } = require_store.parseSessionThreadInfo(sessionKey);
		const { cfg, entry, canonicalKey } = require_session_utils.loadSessionEntry(sessionKey);
		const sentinelContext = payload.deliveryContext;
		let sessionDeliveryContext = require_delivery_context_shared.deliveryContextFromSession(entry);
		let chatType = entry?.origin?.chatType ?? "direct";
		if (!hasRoutableDeliveryContext(sessionDeliveryContext) && baseSessionKey && baseSessionKey !== sessionKey) {
			const { entry: baseEntry } = require_session_utils.loadSessionEntry(baseSessionKey);
			chatType = entry?.origin?.chatType ?? baseEntry?.origin?.chatType ?? "direct";
			sessionDeliveryContext = require_delivery_context_shared.mergeDeliveryContext(sessionDeliveryContext, require_delivery_context_shared.deliveryContextFromSession(baseEntry));
		}
		const origin = require_delivery_context_shared.mergeDeliveryContext(sentinelContext, sessionDeliveryContext);
		const channelRaw = origin?.channel;
		const channel = channelRaw ? require_registry.normalizeChannelId(channelRaw) : null;
		const to = origin?.to;
		const threadId = payload.threadId ?? sessionThreadId ?? (origin?.threadId != null ? require_channel_route.stringifyRouteThreadId(origin.threadId) : void 0);
		let resolvedTo;
		let replyToId;
		let resolvedThreadId = threadId;
		let continuationQueueId;
		let continuationRoute;
		if (channel && to) {
			const resolved = require_targets.resolveOutboundTarget({
				channel,
				to,
				cfg,
				accountId: origin?.accountId,
				mode: "implicit"
			});
			if (resolved.ok) {
				resolvedTo = resolved.to;
				const replyTransport = require_registry.getChannelPlugin(channel)?.threading?.resolveReplyTransport?.({
					cfg,
					accountId: origin?.accountId,
					threadId
				}) ?? null;
				replyToId = replyTransport?.replyToId ?? void 0;
				resolvedThreadId = replyTransport && Object.hasOwn(replyTransport, "threadId") ? replyTransport.threadId != null ? require_channel_route.stringifyRouteThreadId(replyTransport.threadId) : void 0 : threadId;
			}
		}
		if (payload.continuation) {
			continuationRoute = resolveRestartContinuationRoute({
				channel: channel ?? void 0,
				to: resolvedTo,
				accountId: origin?.accountId,
				replyToId,
				threadId: resolvedThreadId,
				chatType
			});
			continuationQueueId = await require_session_delivery_queue.enqueueSessionDelivery(buildQueuedRestartContinuation({
				sessionKey: canonicalKey,
				continuation: payload.continuation,
				ts: payload.ts,
				route: continuationRoute,
				expectedSessionId: entry?.sessionId,
				deliveryContext: resolvedTo && channel ? {
					channel,
					to: resolvedTo,
					...origin?.accountId ? { accountId: origin.accountId } : {},
					...resolvedThreadId ? { threadId: resolvedThreadId } : {}
				} : wakeDeliveryContext
			}));
		}
		await require_restart_sentinel.clearRestartSentinel();
		if (!(payload.continuation?.kind === "agentTurn" && continuationRoute !== void 0)) enqueueRestartSentinelWake(message, sessionKey, wakeDeliveryContext);
		if (resolvedTo && channel) {
			const outboundSession = require_session_context.buildOutboundSessionContext({
				cfg,
				sessionKey: canonicalKey
			});
			await deliverRestartSentinelNotice({
				deps: params.deps,
				cfg,
				sessionKey: canonicalKey,
				summary,
				message,
				channel,
				to: resolvedTo,
				accountId: origin?.accountId,
				replyToId,
				threadId: resolvedThreadId,
				session: outboundSession
			});
		}
		if (continuationQueueId) await drainRestartContinuationQueue({
			deps: params.deps,
			entryId: continuationQueueId,
			log
		});
		return { status: "ran" };
	};
	return {
		source: "restart-sentinel",
		...sessionKey ? { sessionKey } : {},
		run
	};
}
async function scheduleRestartSentinelWakeAttempt(params) {
	const task = await loadRestartSentinelStartupTask(params);
	if (!task) return;
	await runStartupTasks({
		tasks: [task],
		log
	});
}
async function scheduleRestartSentinelWake(params) {
	await scheduleRestartSentinelWakeAttempt({
		...params,
		attempt: 0
	});
}
async function refreshLatestUpdateRestartSentinel() {
	const current = await require_restart_sentinel.readRestartSentinel();
	if (current?.payload.kind === "update" && require_update_control_plane_sentinel.isPendingControlPlaneUpdateRestartSentinel(current.payload)) {
		latestUpdateRestartSentinel = cloneRestartSentinelPayload(current.payload);
		return cloneRestartSentinelPayload(latestUpdateRestartSentinel);
	}
	const sentinel = await require_restart_sentinel.finalizeUpdateRestartSentinelRunningVersion() ?? current;
	if (sentinel?.payload.kind === "update") latestUpdateRestartSentinel = cloneRestartSentinelPayload(sentinel.payload);
	return cloneRestartSentinelPayload(latestUpdateRestartSentinel);
}
function getLatestUpdateRestartSentinel() {
	return cloneRestartSentinelPayload(latestUpdateRestartSentinel);
}
function recordLatestUpdateRestartSentinel(payload) {
	latestUpdateRestartSentinel = cloneRestartSentinelPayload(payload);
}
//#endregion
exports.deliverQueuedSessionDelivery = deliverQueuedSessionDelivery;
exports.getLatestUpdateRestartSentinel = getLatestUpdateRestartSentinel;
exports.recordLatestUpdateRestartSentinel = recordLatestUpdateRestartSentinel;
exports.recoverPendingRestartContinuationDeliveries = recoverPendingRestartContinuationDeliveries;
exports.refreshLatestUpdateRestartSentinel = refreshLatestUpdateRestartSentinel;
exports.scheduleRestartSentinelWake = scheduleRestartSentinelWake;
