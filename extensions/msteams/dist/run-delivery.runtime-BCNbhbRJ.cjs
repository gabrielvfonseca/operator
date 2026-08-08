require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_retry = require("./retry-DXZi6qkk.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_src = require("./src-BcOJL8NE.cjs");
const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_payloads = require("./payloads-MFaWqn01.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_gateway_startup_speech_providers = require("./gateway-startup-speech-providers-DjyFgDFT.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_store = require("./store-DCwJguwr.cjs");
require("./backoff-Dw8FZM0b.cjs");
const require_transcript_mirror = require("./transcript-mirror-CqY6-Fs5.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_delivery_recovery_shared = require("./delivery-recovery.shared-BWzaN0lD.cjs");
const require_target_normalization = require("./target-normalization-CHxcE9Mj.cjs");
require("./inbound.runtime-5wmC-Vmi.cjs");
const require_control_reply_text = require("./control-reply-text-Czbwitig.cjs");
const require_run_session_state = require("./run-session-state-DzW1EtOV.cjs");
const require_session_cleanup = require("./session-cleanup-DD1cdb39.cjs");
const require_session = require("./session-Fttlks47.cjs");
const require_jobs = require("./jobs-z8rHR25F.cjs");
const require_run_id = require("./run-id-BkGBiX9N.cjs");
const require_subagent_followup_hints = require("./subagent-followup-hints-CTfwXQyv.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
//#region src/cron/isolated-agent/delivery-dispatch.ts
/** Dispatches isolated cron output to direct delivery, mirrors, and follow-up queues. */
function normalizeDeliveryTarget(channel, to) {
	const toTrimmed = to.trim();
	return require_target_normalization.normalizeTargetForProvider(channel, toTrimmed) ?? toTrimmed;
}
function normalizeSilentReplyText(text) {
	if (!text) return {
		text,
		strippedTrailingSilentToken: false
	};
	if (require_control_reply_text.isSuppressedControlReplyText(text)) return {
		text: void 0,
		strippedTrailingSilentToken: false
	};
	let next = text;
	const hasLeadingSilentToken = require_tokens.startsWithSilentToken(next, require_tokens.SILENT_REPLY_TOKEN);
	if (hasLeadingSilentToken) next = require_tokens.stripLeadingSilentToken(next, require_tokens.SILENT_REPLY_TOKEN);
	let strippedTrailingSilentToken = false;
	if (hasLeadingSilentToken || next.toLowerCase().includes("NO_REPLY".toLowerCase())) {
		const trimmedBefore = next.trim();
		const stripped = require_tokens.stripSilentToken(next, require_tokens.SILENT_REPLY_TOKEN);
		strippedTrailingSilentToken = stripped !== trimmedBefore;
		next = stripped;
	}
	if (!next.trim() || require_control_reply_text.isSuppressedControlReplyText(next)) return {
		text: void 0,
		strippedTrailingSilentToken
	};
	return {
		text: next,
		strippedTrailingSilentToken
	};
}
/** Returns whether cron delivery should tolerate per-payload send failures. */
function resolveCronDeliveryBestEffort(job) {
	return job.delivery?.bestEffort === true;
}
const PERMANENT_DIRECT_CRON_DELIVERY_ERROR_PATTERNS = [
	/unsupported channel/i,
	/unknown channel/i,
	/chat not found/i,
	/user not found/i,
	/bot.*not.*member/i,
	/bot was blocked by the user/i,
	/forbidden: bot was kicked/i,
	/recipient is not a valid/i,
	/outbound not configured for channel/i
];
const STALE_CRON_DELIVERY_MAX_START_DELAY_MS = 180 * 6e4;
const deliveryOutboundRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./delivery-outbound.runtime-BRpHyiQM.cjs")));
const outboundSessionRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./outbound-session-ca-y9vpw.cjs")).then((n) => n.outbound_session_exports));
const transcriptRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./transcript.runtime-BDEfQFcw.cjs")));
const deliverySubagentRegistryRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./delivery-subagent-registry.runtime-DhPwzZbN.cjs")));
const deliveryLoggerRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./delivery-logger.runtime-N7Q5lddL.cjs")));
const subagentFollowupRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./subagent-followup.runtime-WgSqqlQ6.cjs")));
const ttsRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./tts.runtime-CPmoF7Y-.cjs")));
const COMPLETED_DIRECT_CRON_DELIVERIES = /* @__PURE__ */ new Map();
async function loadDeliveryOutboundRuntime() {
	return await deliveryOutboundRuntimeLoader.load();
}
async function loadOutboundSessionRuntime() {
	return await outboundSessionRuntimeLoader.load();
}
async function loadTranscriptRuntime() {
	return await transcriptRuntimeLoader.load();
}
async function loadDeliverySubagentRegistryRuntime() {
	return await deliverySubagentRegistryRuntimeLoader.load();
}
async function loadDeliveryLoggerRuntime() {
	return await deliveryLoggerRuntimeLoader.load();
}
async function loadSubagentFollowupRuntime() {
	return await subagentFollowupRuntimeLoader.load();
}
async function loadTtsRuntime() {
	return await ttsRuntimeLoader.load();
}
async function logCronDeliveryWarn(message) {
	const { logWarn } = await loadDeliveryLoggerRuntime();
	logWarn(message);
}
async function logCronDeliveryError(message) {
	const { logError } = await loadDeliveryLoggerRuntime();
	logError(message);
}
/** Deletes or retires ephemeral direct-delivery cron sessions for delete-after-run jobs. */
async function cleanupDirectCronSession(params) {
	await require_session_cleanup.cleanupCronRunSessionAfterRun({
		job: params.job,
		agentSessionKey: params.agentSessionKey,
		sessionId: params.sessionId,
		lifecycleRevision: params.lifecycleRevision,
		sessionUpdatedAt: params.sessionUpdatedAt,
		beforeDelete: params.beforeSessionDelete,
		reason: params.retireReason
	});
}
function logCronDeliveryErrorDeferred(message) {
	loadDeliveryLoggerRuntime().then(({ logError }) => {
		logError(message);
	});
}
function cloneDeliveryResults(results) {
	return results.map((result) => ({
		...result,
		...result.meta ? { meta: { ...result.meta } } : {}
	}));
}
function pruneCompletedDirectCronDeliveries(now) {
	const ttlMs = process.env.OPERATOR_TEST_FAST === "1" ? 6e4 : 1440 * 60 * 1e3;
	for (const [key, entry] of COMPLETED_DIRECT_CRON_DELIVERIES) if (now - entry.ts >= ttlMs) COMPLETED_DIRECT_CRON_DELIVERIES.delete(key);
	const maxEntries = 2e3;
	if (COMPLETED_DIRECT_CRON_DELIVERIES.size <= maxEntries) return;
	const entries = [...COMPLETED_DIRECT_CRON_DELIVERIES.entries()].toSorted((a, b) => a[1].ts - b[1].ts);
	const toDelete = COMPLETED_DIRECT_CRON_DELIVERIES.size - maxEntries;
	for (let i = 0; i < toDelete; i += 1) {
		const oldest = entries[i];
		if (!oldest) break;
		COMPLETED_DIRECT_CRON_DELIVERIES.delete(oldest[0]);
	}
}
function resolveCronDeliveryScheduledAtMs(params) {
	const scheduledAt = params.job.state?.nextRunAtMs;
	return require_jobs.hasScheduledNextRunAtMs(scheduledAt) ? scheduledAt : params.runStartedAt;
}
function resolveCronDeliveryStartDelayMs(params) {
	return params.runStartedAt - resolveCronDeliveryScheduledAtMs(params);
}
function isStaleCronDelivery(params) {
	return resolveCronDeliveryStartDelayMs(params) > STALE_CRON_DELIVERY_MAX_START_DELAY_MS;
}
function rememberCompletedDirectCronDelivery(idempotencyKey, results) {
	const now = Date.now();
	COMPLETED_DIRECT_CRON_DELIVERIES.set(idempotencyKey, {
		ts: now,
		results: cloneDeliveryResults(results)
	});
	pruneCompletedDirectCronDeliveries(now);
}
function getCompletedDirectCronDelivery(idempotencyKey) {
	pruneCompletedDirectCronDeliveries(Date.now());
	const cached = COMPLETED_DIRECT_CRON_DELIVERIES.get(idempotencyKey);
	if (!cached) return;
	return cloneDeliveryResults(cached.results);
}
async function maybeApplyTtsToCronPayloads(params) {
	if (!require_gateway_startup_speech_providers.shouldAttemptTtsPayload({
		cfg: params.cfg,
		ttsAuto: params.ttsAuto,
		agentId: params.agentId,
		channelId: params.delivery.channel,
		accountId: params.delivery.accountId
	})) return params.payloads;
	const { maybeApplyTtsToPayload } = await loadTtsRuntime();
	return await Promise.all(params.payloads.map((payload) => maybeApplyTtsToPayload({
		payload,
		cfg: params.cfg,
		channel: params.delivery.channel,
		kind: "final",
		ttsAuto: params.ttsAuto,
		agentId: params.agentId,
		accountId: params.delivery.accountId
	})));
}
function buildDirectCronDeliveryIdempotencyKey(params) {
	const executionId = require_run_id.createCronExecutionId(params.jobId, params.runStartedAt);
	const threadId = params.delivery.threadId == null || params.delivery.threadId === "" ? "" : require_channel_route.stringifyRouteThreadId(params.delivery.threadId) ?? "";
	const accountId = params.delivery.accountId?.trim() ?? "";
	const normalizedTo = normalizeDeliveryTarget(params.delivery.channel, params.delivery.to);
	return `cron-direct-delivery:v1:${executionId}:${params.delivery.channel}:${accountId}:${normalizedTo}:${threadId}`;
}
function shouldQueueCronAwareness(params) {
	return params.job.sessionTarget === "isolated" && !params.deliveryBestEffort && params.delivery.mode === "explicit";
}
function resolveCronAwarenessMainSessionKey(params) {
	return params.cfg.session?.scope === "global" ? require_main_session.resolveMainSessionKey(params.cfg) : require_main_session.resolveAgentMainSessionKey({
		cfg: params.cfg,
		agentId: params.agentId
	});
}
function isSameSessionKey(left, right) {
	const normalizedLeft = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(left);
	const normalizedRight = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(right);
	return normalizedLeft != null && normalizedLeft === normalizedRight;
}
function resolveCronAwarenessText(params) {
	if (params.outboundPayloads?.length) {
		const projectedText = resolveDirectCronTranscriptMirrorText(projectDeliveredDirectCronPayloadsForMirror(params.outboundPayloads));
		if (projectedText) return projectedText;
	}
	return params.deliveryPayloads ? require_run_session_state.pickLastNonEmptyTextFromPayloads(params.deliveryPayloads) : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.outputText) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.synthesizedText);
}
function formatTargetCronDeliveryAwarenessText(text) {
	return `A scheduled cron job delivered this message to this channel:\n${text}`;
}
function formatTargetCronDeliveryFailureAwarenessText(params) {
	const targetParts = [`${params.channel}:${params.to}`];
	if (params.threadId) targetParts.push(`thread ${params.threadId}`);
	return [
		"A scheduled cron job attempted to deliver to this channel, but delivery failed.",
		`Job: ${params.job.name || params.job.id}`,
		`Target: ${targetParts.join(" ")}`,
		`Delivery error: ${require_errors.formatErrorMessage(params.error)}`,
		params.partialDelivered ? "One or more scheduled message payloads may already have been delivered." : "No scheduled message was delivered."
	].join("\n");
}
async function queueCronAwarenessSystemEvent(params) {
	try {
		const { enqueueSystemEvent } = await loadDeliveryOutboundRuntime();
		const mainSessionKey = resolveCronAwarenessMainSessionKey({
			cfg: params.cfg,
			agentId: params.agentId
		});
		if (params.queueMainSession) enqueueSystemEvent(params.text, {
			sessionKey: mainSessionKey,
			contextKey: params.deliveryIdempotencyKey
		});
		const targetSessionKey = params.targetSessionKey;
		if (targetSessionKey && (!isSameSessionKey(targetSessionKey, mainSessionKey) || !params.queueMainSession)) enqueueSystemEvent(params.targetText ?? formatTargetCronDeliveryAwarenessText(params.text), {
			sessionKey: targetSessionKey,
			contextKey: params.deliveryIdempotencyKey
		});
	} catch (err) {
		await logCronDeliveryWarn(`[cron:${params.jobId}] failed to queue isolated cron awareness: ${require_errors.formatErrorMessage(err)}`);
	}
}
function isCustomCronSessionTarget(sessionTarget) {
	return typeof sessionTarget === "string" && sessionTarget.startsWith("session:");
}
function buildDirectCronTranscriptMirrorPayloads(payloads) {
	return payloads.map((payload) => {
		const spokenText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.spokenText);
		if (!spokenText) return payload;
		const mediaUrls = [payload.mediaUrl, ...payload.mediaUrls ?? []].filter((url) => Boolean(url) && !(0, _gabrielvfonseca_media_core_mime.isAudioFileName)(url));
		const { mediaUrl: _mediaUrl, mediaUrls: _mediaUrls, audioAsVoice: _audioAsVoice, spokenText: _spokenText, ...rest } = payload;
		return {
			...rest,
			text: spokenText,
			...mediaUrls.length ? { mediaUrls } : {}
		};
	});
}
function resolveDirectCronTranscriptMirrorText(params) {
	const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.text);
	const mediaText = require_transcript_mirror.resolveMirroredTranscriptText({ mediaUrls: params.mediaUrls }) ?? void 0;
	if (text && mediaText) return `${text}\n${mediaText}`;
	if (text || mediaText) return text ?? mediaText;
}
function pickDirectCronMirrorPayloadText(payload) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.hookContent) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.text);
}
function isTtsAudioMirrorOnly(params) {
	return (params.payload.audioAsVoice === true || Boolean(params.payload.hookContent)) && (0, _gabrielvfonseca_media_core_mime.isAudioFileName)(params.mediaUrl);
}
function projectDeliveredDirectCronPayloadsForMirror(payloads) {
	const textParts = [];
	const mediaUrls = [];
	for (const payload of payloads) {
		const text = pickDirectCronMirrorPayloadText(payload);
		if (text) textParts.push(text);
		for (const mediaUrl of payload.mediaUrls) {
			if (isTtsAudioMirrorOnly({
				payload,
				mediaUrl
			})) continue;
			mediaUrls.push(mediaUrl);
		}
	}
	return {
		text: textParts.join("\n"),
		mediaUrls
	};
}
function canonicalizeDirectCronRouteSessionKey(params) {
	const sessionKey = params.sessionKey.trim();
	const canonical = require_main_session.canonicalizeMainSessionAlias({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionKey
	});
	if (canonical !== sessionKey) return canonical;
	const thread = require_session_key.parseThreadSessionSuffix(sessionKey);
	if (!thread.baseSessionKey || !thread.threadId) return sessionKey;
	const canonicalBase = require_main_session.canonicalizeMainSessionAlias({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionKey: thread.baseSessionKey
	});
	if (canonicalBase === thread.baseSessionKey || canonicalBase === "global") return sessionKey;
	return `${canonicalBase}:thread:${thread.threadId}`;
}
async function resolveCronDeliveryRouteSessionKey(params) {
	try {
		const { resolveOutboundSessionRoute, ensureOutboundSessionEntry } = await loadOutboundSessionRuntime();
		const route = await resolveOutboundSessionRoute({
			cfg: params.cfg,
			channel: params.delivery.channel,
			agentId: params.agentId,
			accountId: params.delivery.accountId,
			target: params.delivery.to,
			currentSessionKey: params.agentSessionKey,
			threadId: params.delivery.threadId
		});
		const routeSessionKey = route?.sessionKey?.trim();
		if (!route || !routeSessionKey) return params.agentSessionKey;
		const canonicalRouteSessionKey = canonicalizeDirectCronRouteSessionKey({
			cfg: params.cfg,
			agentId: params.agentId,
			sessionKey: routeSessionKey
		});
		const canonicalRouteBaseSessionKey = canonicalizeDirectCronRouteSessionKey({
			cfg: params.cfg,
			agentId: params.agentId,
			sessionKey: route.baseSessionKey
		});
		const canonicalRoute = canonicalRouteSessionKey === route.sessionKey && canonicalRouteBaseSessionKey === route.baseSessionKey ? route : {
			...route,
			sessionKey: canonicalRouteSessionKey,
			baseSessionKey: canonicalRouteBaseSessionKey
		};
		await ensureOutboundSessionEntry({
			cfg: params.cfg,
			channel: params.delivery.channel,
			accountId: params.delivery.accountId,
			route: canonicalRoute
		});
		return canonicalRouteSessionKey;
	} catch (err) {
		await logCronDeliveryWarn(`[cron:${params.jobId}] failed to resolve destination session for ${params.warningContext}: ${require_errors.formatErrorMessage(err)}`);
		return params.agentSessionKey;
	}
}
/** Resolves the transcript mirror session for direct cron delivery. */
async function resolveDirectCronDeliverySessionKey(params) {
	if (isCustomCronSessionTarget(params.job.sessionTarget)) return params.agentSessionKey;
	return await resolveCronDeliveryRouteSessionKey({
		cfg: params.cfg,
		jobId: params.job.id,
		agentId: params.agentId,
		agentSessionKey: params.agentSessionKey,
		delivery: params.delivery,
		warningContext: "direct delivery mirror"
	});
}
function resolveCronMessageToolAwarenessTarget(params) {
	const { target } = params.delivery;
	const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.text) ?? require_transcript_mirror.resolveMirroredTranscriptText({ mediaUrls: target.mediaUrls }) ?? void 0;
	if (!text) return;
	const targetChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.provider);
	const channel = targetChannel && targetChannel !== "message" ? targetChannel : params.delivery.verifiedTarget && params.resolvedDelivery.ok ? params.resolvedDelivery.channel : void 0;
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.to) ?? (params.delivery.verifiedTarget && params.resolvedDelivery.ok ? params.resolvedDelivery.to : void 0);
	if (!channel || !to) return;
	const accountId = target.accountId ?? (params.delivery.verifiedTarget && params.resolvedDelivery.ok ? params.resolvedDelivery.accountId : void 0);
	const threadId = target.threadId ?? (params.delivery.verifiedTarget && target.threadImplicit === true && params.resolvedDelivery.ok ? params.resolvedDelivery.threadId : void 0);
	return {
		ok: true,
		channel,
		to,
		...accountId ? { accountId } : {},
		...threadId ? { threadId } : {},
		mode: "explicit",
		text
	};
}
/** Queues target-session context awareness for cron deliveries made via message tool. */
async function queueCronMessageToolDeliveryAwareness(params) {
	const seen = /* @__PURE__ */ new Set();
	for (const delivery of params.sourceDeliveryOutcome.visibleDeliveries) {
		const target = resolveCronMessageToolAwarenessTarget({
			delivery,
			resolvedDelivery: params.resolvedDelivery
		});
		if (!target) continue;
		const dedupeKey = [
			target.channel,
			normalizeDeliveryTarget(target.channel, target.to),
			target.accountId ?? "",
			target.threadId ?? "",
			target.text
		].join("\0");
		if (seen.has(dedupeKey)) continue;
		seen.add(dedupeKey);
		const targetSessionKey = await resolveCronDeliveryRouteSessionKey({
			cfg: params.cfg,
			jobId: params.job.id,
			agentId: params.agentId,
			agentSessionKey: params.agentSessionKey,
			delivery: target,
			warningContext: "message-tool delivery awareness"
		});
		const deliveryIdempotencyKey = buildDirectCronDeliveryIdempotencyKey({
			jobId: params.job.id,
			runStartedAt: params.runStartedAt,
			delivery: target
		});
		await queueCronAwarenessSystemEvent({
			cfg: params.cfg,
			jobId: params.job.id,
			agentId: params.agentId,
			deliveryIdempotencyKey,
			queueMainSession: false,
			targetSessionKey,
			text: target.text
		});
	}
}
async function appendDirectCronDeliveryTranscriptMirror(params) {
	if (!params.mirror.text && !params.mirror.mediaUrls?.length) return;
	try {
		const { appendAssistantMessageToSessionTranscript } = await loadTranscriptRuntime();
		const result = await appendAssistantMessageToSessionTranscript(params.mirror);
		if (!result.ok) await logCronDeliveryWarn(`[cron:${params.job.id}] failed to mirror direct delivery into session transcript: ${result.reason}`);
	} catch (err) {
		await logCronDeliveryWarn(`[cron:${params.job.id}] failed to mirror direct delivery into session transcript: ${require_errors.formatErrorMessage(err)}`);
	}
}
async function appendAdmittedDirectCronDeliveryTranscriptMirror(params) {
	const storePath = params.mirror.storePath;
	const initial = storePath ? require_session.loadCronSessionEntryLatest(storePath, params.mirror.sessionKey) : void 0;
	const expectedSessionId = params.mirror.expectedSessionId ?? initial?.sessionId;
	const expectedLifecycleRevision = params.mirror.expectedLifecycleRevision ?? initial?.lifecycleRevision;
	if (!storePath || !expectedSessionId) {
		await logCronDeliveryWarn(`[cron:${params.job.id}] skipped transcript mirror without an exact session identity`);
		return;
	}
	const admittedMirror = {
		...params.mirror,
		expectedSessionId,
		...expectedLifecycleRevision ? { expectedLifecycleRevision } : {}
	};
	try {
		const admission = await require_store.beginSessionWorkAdmission({
			scope: storePath,
			identities: [
				params.mirror.sessionKey,
				expectedSessionId,
				expectedLifecycleRevision ? require_run_session_state.resolveCronLifecycleRevisionIdentity(expectedLifecycleRevision) : void 0
			],
			signal: params.abortSignal,
			assertAllowed: () => {
				const latest = require_session.loadCronSessionEntryLatest(storePath, params.mirror.sessionKey);
				if (latest?.sessionId !== expectedSessionId || expectedLifecycleRevision !== void 0 && latest.lifecycleRevision !== expectedLifecycleRevision) throw new Error(`Session "${params.mirror.sessionKey}" changed before transcript mirror.`);
				const archivedError = require_lifecycle.resolveSessionWorkStartError(params.mirror.sessionKey, latest);
				if (archivedError) throw new Error(archivedError);
			}
		});
		try {
			await admission.run(() => appendDirectCronDeliveryTranscriptMirror({
				job: params.job,
				mirror: admittedMirror
			}));
		} finally {
			admission.release();
		}
	} catch (err) {
		await logCronDeliveryWarn(`[cron:${params.job.id}] skipped transcript mirror: ${require_errors.formatErrorMessage(err)}`);
	}
}
/** Clears the direct-delivery idempotency cache for deterministic tests. */
function resetCompletedDirectCronDeliveriesForTests() {
	COMPLETED_DIRECT_CRON_DELIVERIES.clear();
}
/** Returns the direct-delivery idempotency cache size for tests. */
function getCompletedDirectCronDeliveriesCountForTests() {
	return COMPLETED_DIRECT_CRON_DELIVERIES.size;
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.cronDeliveryDispatchTestApi")] = {
	resetCompletedDirectCronDeliveriesForTests,
	getCompletedDirectCronDeliveriesCountForTests
};
function summarizeDirectCronDeliveryError(error) {
	if (error instanceof Error) return error.message || "error";
	if (typeof error === "string") return error;
	try {
		return JSON.stringify(error) || String(error);
	} catch {
		return String(error);
	}
}
function isTransientDirectCronDeliveryError(error) {
	const message = summarizeDirectCronDeliveryError(error);
	if (!message) return false;
	if (PERMANENT_DIRECT_CRON_DELIVERY_ERROR_PATTERNS.some((re) => re.test(message))) return false;
	return require_delivery_recovery_shared.isProvenDeliveryNotSentError(error);
}
function resolveDirectCronRetryDelaysMs() {
	return [
		5e3,
		1e4,
		2e4
	];
}
async function retryTransientDirectCronDelivery(params) {
	const retryDelaysMs = resolveDirectCronRetryDelaysMs();
	if (params.signal?.aborted) throw new Error("cron delivery aborted");
	const runWithAbortCheck = async () => {
		if (params.signal?.aborted) throw new Error("cron delivery aborted");
		return await params.run();
	};
	return await require_retry.retryAsync(runWithAbortCheck, {
		attempts: retryDelaysMs.length + 1,
		minDelayMs: 0,
		maxDelayMs: Math.max(...retryDelaysMs),
		delayMs: ({ attempt }) => retryDelaysMs[attempt - 1] ?? 0,
		shouldRetry: (err) => params.signal?.aborted !== true && isTransientDirectCronDeliveryError(err) && (params.shouldRetryError?.(err) ?? true),
		onRetry: async ({ attempt, maxAttempts, delayMs, err }) => {
			await logCronDeliveryWarn(`[cron:${params.jobId}] transient direct announce delivery failure, retrying ${attempt + 1}/${maxAttempts} in ${Math.round(delayMs / 1e3)}s: ${summarizeDirectCronDeliveryError(err)}`);
			if (delayMs === 0) await require_src.sleepWithAbort(0, params.signal);
		},
		sleep: async (delayMs) => await require_src.sleepWithAbort(delayMs, params.signal)
	});
}
/** Dispatches cron run output through verified message-tool or direct delivery paths. */
async function dispatchCronDelivery(params) {
	const sourceDeliverySatisfied = params.sourceDeliveryOutcome.satisfiesSourceDelivery;
	const verifiedMessageToolDelivery = params.sourceDeliveryOutcome.verifiedMessageToolDelivery;
	let summary = params.summary;
	let outputText = params.outputText;
	let synthesizedText = params.synthesizedText;
	let deliveryPayloads = params.deliveryPayloads;
	let delivered = verifiedMessageToolDelivery;
	let deliveryAttempted = verifiedMessageToolDelivery;
	let deliveryError;
	let directCronSessionCleanupAttempted = false;
	let deferredDeletingSessionMirror;
	const buildDeliveryState = (result) => ({
		...result ? { result } : {},
		delivered,
		deliveryAttempted,
		...deliveryError ? { deliveryError } : {},
		cronRunSessionCleanupAttempted: directCronSessionCleanupAttempted,
		summary,
		outputText,
		synthesizedText,
		deliveryPayloads
	});
	const formatDeliveryTargetError = (error) => params.sourceDeliveryOutcome.unverifiedMessageToolDelivery ? `${error}; the agent used the message tool, but Operator could not verify that message matched the cron delivery target` : error;
	const failDeliveryTarget = (error) => params.withRunSession({
		status: "error",
		error: formatDeliveryTargetError(error),
		errorKind: "delivery-target",
		summary,
		outputText,
		deliveryAttempted,
		...params.telemetry
	});
	const cleanupDirectCronSessionIfNeeded = async () => {
		if (directCronSessionCleanupAttempted) return "not-requested";
		const cleanupOutcome = await require_session_cleanup.cleanupCronRunSessionAfterRun({
			job: params.job,
			agentSessionKey: params.agentSessionKey,
			sessionId: params.sessionId,
			lifecycleRevision: params.lifecycleRevision,
			sessionUpdatedAt: params.sessionUpdatedAt,
			beforeDelete: params.beforeSessionDelete,
			reason: "cron-delete-after-run-fallback"
		});
		if (cleanupOutcome !== "not-requested") directCronSessionCleanupAttempted = true;
		const survivingMirror = deferredDeletingSessionMirror;
		deferredDeletingSessionMirror = void 0;
		if (cleanupOutcome !== "not-requested" && cleanupOutcome !== "deleted" && survivingMirror) await appendAdmittedDirectCronDeliveryTranscriptMirror({
			job: params.job,
			mirror: survivingMirror,
			abortSignal: params.abortSignal
		});
		return cleanupOutcome;
	};
	const finishSilentReplyDelivery = async () => {
		deliveryAttempted = true;
		await cleanupDirectCronSessionIfNeeded();
		return params.withRunSession({
			status: "ok",
			summary,
			outputText,
			delivered: false,
			deliveryAttempted: true,
			...params.telemetry
		});
	};
	const deliverViaDirect = async (delivery, options) => {
		const { buildOutboundSessionContext, createOutboundSendDeps, resolveAgentOutboundIdentity, sendDurableMessageBatch } = await loadDeliveryOutboundRuntime();
		const identity = resolveAgentOutboundIdentity(params.cfgWithAgentDefaults, params.agentId);
		const deliveryIdempotencyKey = buildDirectCronDeliveryIdempotencyKey({
			jobId: params.job.id,
			runStartedAt: params.runStartedAt,
			delivery
		});
		try {
			const normalizedPayloads = (deliveryPayloads.length > 0 ? deliveryPayloads : synthesizedText ? [{ text: synthesizedText }] : []).map((p) => {
				if (!p.text) return p;
				const normalized = normalizeSilentReplyText(p.text);
				return Object.assign({}, p, { text: normalized.strippedTrailingSilentToken ? void 0 : normalized.text });
			}).filter((p) => require_payload.hasReplyPayloadContent(p, { trimText: true }));
			if (normalizedPayloads.length === 0) return await finishSilentReplyDelivery();
			if (params.isAborted()) return params.withRunSession({
				status: "error",
				error: params.abortReason(),
				deliveryAttempted,
				...params.telemetry
			});
			if (params.deliveryRequested && isStaleCronDelivery({
				job: params.job,
				runStartedAt: params.runStartedAt
			})) {
				deliveryAttempted = true;
				const nowMs = Date.now();
				const scheduledAtMs = resolveCronDeliveryScheduledAtMs({
					job: params.job,
					runStartedAt: params.runStartedAt
				});
				const startDelayMs = resolveCronDeliveryStartDelayMs({
					job: params.job,
					runStartedAt: params.runStartedAt
				});
				await logCronDeliveryWarn(`[cron:${params.job.id}] skipping stale delivery scheduled at ${new Date(scheduledAtMs).toISOString()}, started ${Math.round(startDelayMs / 6e4)}m late, current age ${Math.round((nowMs - scheduledAtMs) / 6e4)}m`);
				return params.withRunSession({
					status: "ok",
					summary,
					outputText,
					deliveryAttempted,
					delivered: false,
					...params.telemetry
				});
			}
			const payloadsForDelivery = (await maybeApplyTtsToCronPayloads({
				cfg: params.cfgWithAgentDefaults,
				payloads: normalizedPayloads,
				delivery,
				agentId: params.agentId,
				ttsAuto: params.ttsAuto
			})).filter((p) => require_payload.hasReplyPayloadContent(p, { trimText: true }));
			if (payloadsForDelivery.length === 0) return await finishSilentReplyDelivery();
			deliveryAttempted = true;
			if (getCompletedDirectCronDelivery(deliveryIdempotencyKey)) {
				delivered = true;
				return null;
			}
			const deliverySessionKey = await resolveDirectCronDeliverySessionKey({
				cfg: params.cfgWithAgentDefaults,
				job: params.job,
				agentId: params.agentId,
				agentSessionKey: params.agentSessionKey,
				delivery
			});
			const deliverySession = buildOutboundSessionContext({
				cfg: params.cfgWithAgentDefaults,
				agentId: params.agentId,
				sessionKey: deliverySessionKey
			});
			const awarenessMainSessionKey = resolveCronAwarenessMainSessionKey({
				cfg: params.cfgWithAgentDefaults,
				agentId: params.agentId
			});
			const mirrorTargetsAwarenessMainSession = isSameSessionKey(deliverySessionKey, awarenessMainSessionKey);
			const mirrorTargetsDeletingRunSession = params.job.deleteAfterRun === true && require_session_key.isCronSessionKey(params.agentSessionKey) && isSameSessionKey(deliverySessionKey, params.agentSessionKey);
			let hadPartialFailure = false;
			let payloadMayHaveReachedRecipientBeforeFailure = false;
			const attemptedPayloadsForMirror = [];
			const onError = params.deliveryBestEffort ? (err, _payload) => {
				hadPartialFailure = true;
				deliveryError ??= require_errors.formatErrorMessage(err);
				logCronDeliveryErrorDeferred(`[cron:${params.job.id}] delivery payload failed (bestEffort): ${require_errors.formatErrorMessage(err)}`);
			} : void 0;
			const runDelivery = async () => {
				attemptedPayloadsForMirror.length = 0;
				const send = await sendDurableMessageBatch({
					cfg: params.cfgWithAgentDefaults,
					channel: delivery.channel,
					to: delivery.to,
					accountId: delivery.accountId,
					threadId: delivery.threadId,
					payloads: payloadsForDelivery,
					session: deliverySession,
					identity,
					bestEffort: params.deliveryBestEffort,
					durability: params.deliveryBestEffort ? "best_effort" : "required",
					deps: createOutboundSendDeps(params.deps),
					signal: params.abortSignal,
					onError,
					onPayload: (payload) => {
						attemptedPayloadsForMirror.push(payload);
					},
					skipQueue: true
				});
				payloadMayHaveReachedRecipientBeforeFailure ||= send.payloadOutcomes?.some((outcome) => outcome.status === "sent" || outcome.status === "failed" && outcome.sentBeforeError || outcome.status === "suppressed" && outcome.reason === "adapter_returned_no_identity") ?? false;
				if (send.status === "failed") throw send.error;
				if (send.status === "partial_failed") {
					payloadMayHaveReachedRecipientBeforeFailure = true;
					if (!params.deliveryBestEffort) throw send.error;
					hadPartialFailure = true;
					deliveryError ??= require_errors.formatErrorMessage(send.error);
				}
				return send.status === "sent" || send.status === "partial_failed" ? send.results : [];
			};
			let deliveryResults;
			try {
				deliveryResults = options?.retryTransient ? await retryTransientDirectCronDelivery({
					jobId: params.job.id,
					signal: params.abortSignal,
					run: runDelivery,
					shouldRetryError: () => !payloadMayHaveReachedRecipientBeforeFailure
				}) : await runDelivery();
			} catch (err) {
				const failureAwarenessText = formatTargetCronDeliveryFailureAwarenessText({
					job: params.job,
					channel: delivery.channel,
					to: delivery.to,
					threadId: require_channel_route.stringifyRouteThreadId(delivery.threadId),
					error: err,
					partialDelivered: payloadMayHaveReachedRecipientBeforeFailure
				});
				await queueCronAwarenessSystemEvent({
					cfg: params.cfgWithAgentDefaults,
					jobId: params.job.id,
					agentId: params.agentId,
					deliveryIdempotencyKey: `${deliveryIdempotencyKey}:failure`,
					queueMainSession: false,
					targetSessionKey: deliverySessionKey,
					text: failureAwarenessText,
					targetText: failureAwarenessText
				});
				throw err;
			}
			delivered = deliveryResults.length > 0 && !hadPartialFailure;
			const deliveryAwarenessText = resolveCronAwarenessText({
				outputText,
				synthesizedText,
				deliveryPayloads: payloadsForDelivery,
				outboundPayloads: attemptedPayloadsForMirror
			});
			const shouldQueueAwarenessForDelivery = shouldQueueCronAwareness({
				job: params.job,
				delivery,
				deliveryBestEffort: params.deliveryBestEffort
			});
			const deliveryWillReachAwarenessMainSession = mirrorTargetsAwarenessMainSession && shouldQueueAwarenessForDelivery && Boolean(shouldQueueAwarenessForDelivery ? deliveryAwarenessText : void 0);
			const mirrorWouldBypassIsolatedAwarenessPolicy = mirrorTargetsAwarenessMainSession && params.job.sessionTarget === "isolated" && delivery.mode !== "explicit";
			if (delivered && !deliveryWillReachAwarenessMainSession && !mirrorWouldBypassIsolatedAwarenessPolicy) {
				const mirrorText = resolveDirectCronTranscriptMirrorText(attemptedPayloadsForMirror.length > 0 ? projectDeliveredDirectCronPayloadsForMirror(attemptedPayloadsForMirror) : require_payloads.projectOutboundPayloadPlanForMirror(require_payloads.createOutboundPayloadPlan(buildDirectCronTranscriptMirrorPayloads(payloadsForDelivery), {
					cfg: params.cfgWithAgentDefaults,
					sessionKey: deliverySessionKey,
					surface: delivery.channel
				})));
				const transcriptMirror = {
					sessionKey: deliverySessionKey,
					agentId: params.agentId,
					...mirrorTargetsDeletingRunSession ? {
						expectedSessionId: params.sessionId,
						expectedLifecycleRevision: params.lifecycleRevision
					} : {},
					text: mirrorText,
					mediaUrls: void 0,
					storePath: require_paths.resolveStorePath(params.cfgWithAgentDefaults.session?.store, { agentId: require_session_key.resolveAgentIdFromSessionKey(deliverySessionKey) }),
					idempotencyKey: deliveryIdempotencyKey,
					config: params.cfgWithAgentDefaults
				};
				if (mirrorTargetsDeletingRunSession) deferredDeletingSessionMirror = transcriptMirror;
				else await appendAdmittedDirectCronDeliveryTranscriptMirror({
					job: params.job,
					mirror: transcriptMirror,
					abortSignal: params.abortSignal
				});
			}
			if (delivered && !params.deliveryBestEffort && deliveryAwarenessText && (shouldQueueAwarenessForDelivery || !isSameSessionKey(deliverySessionKey, awarenessMainSessionKey))) await queueCronAwarenessSystemEvent({
				cfg: params.cfgWithAgentDefaults,
				jobId: params.job.id,
				agentId: params.agentId,
				deliveryIdempotencyKey,
				queueMainSession: shouldQueueAwarenessForDelivery,
				text: deliveryAwarenessText,
				targetSessionKey: deliverySessionKey
			});
			if (delivered) rememberCompletedDirectCronDelivery(deliveryIdempotencyKey, deliveryResults);
			return null;
		} catch (err) {
			if (!params.deliveryBestEffort) return params.withRunSession({
				status: "error",
				summary,
				outputText,
				error: String(err),
				deliveryAttempted,
				...params.telemetry
			});
			await logCronDeliveryError(`[cron:${params.job.id}] delivery failed (bestEffort): ${require_errors.formatErrorMessage(err)}`);
			deliveryError = require_errors.formatErrorMessage(err);
			return null;
		}
	};
	const deliverViaDirectAndCleanup = async (delivery, options) => {
		try {
			return await deliverViaDirect(delivery, options);
		} finally {
			await cleanupDirectCronSessionIfNeeded();
		}
	};
	const finalizeTextDelivery = async (delivery) => {
		if (!synthesizedText) return null;
		const initialSynthesizedText = synthesizedText.trim();
		const expectedSubagentFollowup = require_subagent_followup_hints.expectsSubagentFollowup(initialSynthesizedText);
		const subagentRegistryRuntime = await loadDeliverySubagentRegistryRuntime();
		const subagentFollowupSessionKey = params.runSessionKey;
		let activeSubagentRuns = subagentRegistryRuntime.countActiveDescendantRuns(subagentFollowupSessionKey);
		const shouldCheckCompletedDescendants = activeSubagentRuns === 0 && require_subagent_followup_hints.isLikelyInterimCronMessage(initialSynthesizedText);
		const subagentFollowupRuntime = shouldCheckCompletedDescendants || activeSubagentRuns > 0 || expectedSubagentFollowup ? await loadSubagentFollowupRuntime() : void 0;
		const completedDescendantReply = shouldCheckCompletedDescendants ? await subagentFollowupRuntime?.readDescendantSubagentFallbackReply({
			sessionKey: subagentFollowupSessionKey,
			runStartedAt: params.runStartedAt
		}) : void 0;
		const hadDescendants = activeSubagentRuns > 0 || Boolean(completedDescendantReply);
		if (!params.deliveryBestEffort && (activeSubagentRuns > 0 || expectedSubagentFollowup)) {
			let finalReply = await subagentFollowupRuntime?.waitForDescendantSubagentSummary({
				sessionKey: subagentFollowupSessionKey,
				initialReply: initialSynthesizedText,
				timeoutMs: params.timeoutMs,
				observedActiveDescendants: activeSubagentRuns > 0 || expectedSubagentFollowup
			});
			activeSubagentRuns = subagentRegistryRuntime.countActiveDescendantRuns(subagentFollowupSessionKey);
			if (!finalReply && activeSubagentRuns === 0) finalReply = await subagentFollowupRuntime?.readDescendantSubagentFallbackReply({
				sessionKey: subagentFollowupSessionKey,
				runStartedAt: params.runStartedAt
			});
			if (finalReply && activeSubagentRuns === 0) {
				outputText = finalReply;
				summary = require_run_session_state.pickSummaryFromOutput(finalReply) ?? summary;
				synthesizedText = finalReply;
				deliveryPayloads = [{ text: finalReply }];
			}
		} else if (completedDescendantReply) {
			outputText = completedDescendantReply;
			summary = require_run_session_state.pickSummaryFromOutput(completedDescendantReply) ?? summary;
			synthesizedText = completedDescendantReply;
			deliveryPayloads = [{ text: completedDescendantReply }];
		}
		if (!params.deliveryBestEffort && activeSubagentRuns > 0) {
			deliveryAttempted = true;
			return params.withRunSession({
				status: "ok",
				summary,
				outputText,
				deliveryAttempted,
				...params.telemetry
			});
		}
		if (hadDescendants && synthesizedText.trim() === initialSynthesizedText && require_subagent_followup_hints.isLikelyInterimCronMessage(initialSynthesizedText) && !require_tokens.isSilentReplyText(initialSynthesizedText, "NO_REPLY")) {
			deliveryAttempted = true;
			return params.withRunSession({
				status: "ok",
				summary,
				outputText,
				deliveryAttempted,
				...params.telemetry
			});
		}
		const normalizedSynthesizedText = normalizeSilentReplyText(synthesizedText);
		if (normalizedSynthesizedText.text === void 0 || normalizedSynthesizedText.strippedTrailingSilentToken) return await finishSilentReplyDelivery();
		synthesizedText = normalizedSynthesizedText.text;
		outputText = synthesizedText;
		if (params.isAborted()) return params.withRunSession({
			status: "error",
			error: params.abortReason(),
			deliveryAttempted,
			...params.telemetry
		});
		return await deliverViaDirectAndCleanup(delivery, { retryTransient: true });
	};
	if (params.deliveryRequested && !params.skipHeartbeatDelivery && !sourceDeliverySatisfied) {
		if (!params.resolvedDelivery.ok) {
			await cleanupDirectCronSessionIfNeeded();
			if (!params.deliveryBestEffort) return buildDeliveryState(failDeliveryTarget(params.resolvedDelivery.error.message));
			delivered = false;
			deliveryError = params.resolvedDelivery.error.message;
			await logCronDeliveryWarn(`[cron:${params.job.id}] ${params.resolvedDelivery.error.message}`);
			return buildDeliveryState(params.withRunSession({
				status: "ok",
				summary,
				outputText,
				delivered,
				deliveryError,
				deliveryAttempted,
				...params.telemetry
			}));
		}
		if (params.deliveryPayloadHasStructuredContent || params.resolvedDelivery.threadId != null) {
			const directResult = await deliverViaDirectAndCleanup(params.resolvedDelivery);
			if (directResult) return buildDeliveryState(directResult);
		} else {
			const finalizedTextResult = await finalizeTextDelivery(params.resolvedDelivery);
			if (finalizedTextResult) return buildDeliveryState(finalizedTextResult);
		}
	}
	return buildDeliveryState();
}
//#endregion
exports.cleanupDirectCronSession = cleanupDirectCronSession;
exports.dispatchCronDelivery = dispatchCronDelivery;
exports.queueCronMessageToolDeliveryAwareness = queueCronMessageToolDeliveryAwareness;
exports.resolveCronDeliveryBestEffort = resolveCronDeliveryBestEffort;
exports.resolveDeliveryTarget = require_jobs.resolveDeliveryTarget;
