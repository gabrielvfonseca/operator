const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_reply_payload = require("./reply-payload-DomDFObW.cjs");
const require_reply_payload$1 = require("./reply-payload-B-1jXr3E.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_heartbeat = require("./heartbeat-B6M3DHWg.cjs");
const require_session_snapshot_merge = require("./session-snapshot-merge-BloJoO_g.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_util = require("node:util");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/cron/heartbeat-policy.ts
/** Decides when cron heartbeat acknowledgements should stay out of visible delivery. */
/** Returns whether delivery output contains only heartbeat acknowledgement text. */
function shouldSkipHeartbeatOnlyDelivery(payloads, ackMaxChars) {
	if (payloads.length === 0) return true;
	if (payloads.some((payload) => require_reply_payload.hasOutboundReplyContent({
		...payload,
		text: void 0
	}, { trimText: true }))) return false;
	return payloads.some((payload) => {
		return require_heartbeat.stripHeartbeatToken(payload.text, {
			mode: "heartbeat",
			maxAckChars: ackMaxChars
		}).shouldSkip;
	});
}
//#endregion
//#region src/cron/isolated-agent/helpers.ts
/** Normalizes isolated cron run output into summaries, delivery payloads, and error state. */
function normalizeCronFailureSignal(signal) {
	const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(signal?.message);
	if (signal?.fatalForCron !== true || !message) return;
	return {
		...signal,
		message,
		fatalForCron: true
	};
}
function formatCronFailureSignal(signal) {
	const kind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(signal.kind) ?? "run";
	const code = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(signal.code);
	const source = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(signal.toolName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(signal.source);
	return `cron classifier: ${kind} failure${source ? ` from ${source}` : ""}${code ? ` (${code})` : ""}: ${signal.message}`;
}
function formatCronRunLevelError(error) {
	const direct = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(error);
	if (direct) return `cron isolated run failed: ${direct}`;
	if (!error || typeof error !== "object") return;
	const record = error;
	const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.message);
	if (message) return `cron isolated run failed: ${message}`;
	const kind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.kind);
	if (kind) return `cron isolated run failed: ${kind}`;
	return "cron isolated run failed";
}
/** Picks a bounded cron run summary from plain text output. */
function pickSummaryFromOutput(text) {
	const clean = (text ?? "").trim();
	if (!clean) return;
	const limit = 2e3;
	return clean.length > limit ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(clean, limit)}…` : clean;
}
/** Picks the last non-error payload text suitable for cron run summaries. */
function pickSummaryFromPayloads(payloads) {
	for (let i = payloads.length - 1; i >= 0; i--) {
		if (payloads[i]?.isError) continue;
		const summary = pickSummaryFromOutput(payloads[i]?.text);
		if (summary) return summary;
	}
	for (let i = payloads.length - 1; i >= 0; i--) {
		if (isNonTerminalToolErrorWarning(payloads[i])) continue;
		const summary = pickSummaryFromOutput(payloads[i]?.text);
		if (summary) return summary;
	}
}
/** Picks the last non-empty payload text while ignoring terminal error payloads first. */
function pickLastNonEmptyTextFromPayloads(payloads) {
	for (let i = payloads.length - 1; i >= 0; i--) {
		if (payloads[i]?.isError) continue;
		const clean = (payloads[i]?.text ?? "").trim();
		if (clean) return clean;
	}
	for (let i = payloads.length - 1; i >= 0; i--) {
		if (isNonTerminalToolErrorWarning(payloads[i])) continue;
		const clean = (payloads[i]?.text ?? "").trim();
		if (clean) return clean;
	}
}
function isDeliverablePayload(payload) {
	if (!payload) return false;
	return require_reply_payload.hasOutboundReplyContent(payload, { trimText: true });
}
function payloadHasStructuredDeliveryContent(payload) {
	if (!payload) return false;
	return payload.mediaUrl !== void 0 || (payload.mediaUrls?.length ?? 0) > 0 || (payload.presentation?.blocks?.length ?? 0) > 0 || (payload.interactive?.blocks?.length ?? 0) > 0 || Object.keys(payload.channelData ?? {}).length > 0;
}
/** Picks the last payload with deliverable outbound content, preferring non-error payloads. */
function pickLastDeliverablePayload(payloads) {
	for (let i = payloads.length - 1; i >= 0; i--) {
		if (payloads[i]?.isError) continue;
		if (isDeliverablePayload(payloads[i])) return payloads[i];
	}
	for (let i = payloads.length - 1; i >= 0; i--) if (isDeliverablePayload(payloads[i])) return payloads[i];
}
/** Selects deliverable cron payloads while preserving multi-payload successful responses. */
function pickDeliverablePayloads(payloads) {
	const successfulDeliverablePayloads = payloads.filter((payload) => payload != null && payload.isError !== true && isDeliverablePayload(payload));
	if (successfulDeliverablePayloads.length > 0) return successfulDeliverablePayloads;
	const lastDeliverablePayload = pickLastDeliverablePayload(payloads);
	return lastDeliverablePayload ? [lastDeliverablePayload] : [];
}
/**
* Check if delivery should be skipped because the agent signaled no user-visible update.
* Returns true when any payload is a heartbeat ack token and no payload contains media.
*/
function isHeartbeatOnlyResponse(payloads, ackMaxChars) {
	return shouldSkipHeartbeatOnlyDelivery(payloads, ackMaxChars);
}
/** Resolves the non-negative heartbeat ack length used for heartbeat-only filtering. */
function resolveHeartbeatAckMaxChars(agentCfg) {
	const raw = agentCfg?.heartbeat?.ackMaxChars ?? 300;
	return Math.max(0, raw);
}
function isCronMessagePresentationWarning(text) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(text)?.toLowerCase();
	return normalized === "⚠️ ✉️ message failed" || normalized?.startsWith("⚠️ ✉️ message failed:") === true;
}
function isCronToolWarning(text) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(text)?.startsWith("⚠️ 🛠️ ") === true;
}
function isNonTerminalToolErrorWarning(payload) {
	return Boolean(payload && require_reply_payload$1.getReplyPayloadMetadata(payload)?.nonTerminalToolErrorWarning);
}
function isSuccessfulCronPayload(payload) {
	return payload?.isError !== true && (isDeliverablePayload(payload) || payloadHasStructuredDeliveryContent(payload));
}
/** Resolves summary, output text, delivery payloads, and fatal-error state from cron run output. */
function resolveCronPayloadOutcome(params) {
	const firstText = params.payloads.find((payload) => !isNonTerminalToolErrorWarning(payload))?.text ?? "";
	const fallbackSummary = pickSummaryFromPayloads(params.payloads) ?? pickSummaryFromOutput(firstText);
	const fallbackOutputText = pickLastNonEmptyTextFromPayloads(params.payloads);
	const deliveryPayload = pickLastDeliverablePayload(params.payloads);
	const selectedDeliveryPayloads = pickDeliverablePayloads(params.payloads);
	const deliveryPayloadHasStructuredContent = payloadHasStructuredDeliveryContent(deliveryPayload);
	const hasErrorPayload = params.payloads.some((payload) => payload?.isError === true);
	const lastErrorPayloadIndex = params.payloads.findLastIndex((payload) => payload?.isError === true);
	const lastErrorPayloadText = [...params.payloads].toReversed().find((payload) => payload?.isError === true && Boolean(payload?.text?.trim()))?.text?.trim();
	const errorPayloads = params.payloads.filter((payload) => payload?.isError === true);
	const normalizedFinalAssistantVisibleText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.finalAssistantVisibleText);
	const hasSuccessfulPayloadAfterLastError = !params.runLevelError && lastErrorPayloadIndex >= 0 && params.payloads.slice(lastErrorPayloadIndex + 1).some(isSuccessfulCronPayload);
	const hasSuccessfulPayloadBeforeLastError = !params.runLevelError && lastErrorPayloadIndex > 0 && params.payloads.slice(0, lastErrorPayloadIndex).some(isSuccessfulCronPayload);
	const lastErrorPayload = lastErrorPayloadIndex >= 0 ? params.payloads[lastErrorPayloadIndex] : void 0;
	const hasRecoveringTerminalOutput = normalizedFinalAssistantVisibleText !== void 0 || hasSuccessfulPayloadAfterLastError || hasSuccessfulPayloadBeforeLastError;
	const hasNonTerminalToolErrorWarning = !params.runLevelError && params.failureSignal?.fatalForCron !== true && hasRecoveringTerminalOutput && isNonTerminalToolErrorWarning(lastErrorPayload);
	const hasPendingPresentationWarning = !params.runLevelError && params.failureSignal?.fatalForCron !== true && lastErrorPayloadIndex >= 0 && isCronMessagePresentationWarning(lastErrorPayloadText) && (normalizedFinalAssistantVisibleText !== void 0 || hasSuccessfulPayloadBeforeLastError);
	const hasStructuredDeliveryPayloads = selectedDeliveryPayloads.some((payload) => payloadHasStructuredDeliveryContent(payload));
	const hasRecoveredToolWarning = !params.runLevelError && params.failureSignal?.fatalForCron !== true && normalizedFinalAssistantVisibleText !== void 0 && !hasStructuredDeliveryPayloads && errorPayloads.length > 0 && errorPayloads.every((payload) => isCronToolWarning(payload?.text));
	const hasFatalStructuredErrorPayload = hasErrorPayload && !hasSuccessfulPayloadAfterLastError && !hasPendingPresentationWarning && !hasNonTerminalToolErrorWarning && !hasRecoveredToolWarning;
	const shouldUseFinalAssistantVisibleText = (params.preferFinalAssistantVisibleText === true || hasRecoveredToolWarning) && normalizedFinalAssistantVisibleText !== void 0 && !hasFatalStructuredErrorPayload && !hasStructuredDeliveryPayloads;
	const summary = shouldUseFinalAssistantVisibleText ? pickSummaryFromOutput(normalizedFinalAssistantVisibleText) ?? fallbackSummary : fallbackSummary;
	const outputText = shouldUseFinalAssistantVisibleText ? normalizedFinalAssistantVisibleText : fallbackOutputText;
	const synthesizedText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(outputText) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(summary);
	const resolvedDeliveryPayloads = shouldUseFinalAssistantVisibleText ? [{ text: normalizedFinalAssistantVisibleText }] : selectedDeliveryPayloads.length > 0 ? selectedDeliveryPayloads : synthesizedText ? [{ text: synthesizedText }] : [];
	const failureSignal = normalizeCronFailureSignal(params.failureSignal);
	const runLevelError = formatCronRunLevelError(params.runLevelError);
	const hasFatalErrorPayload = hasFatalStructuredErrorPayload || failureSignal !== void 0 || runLevelError !== void 0;
	const structuredErrorText = hasFatalStructuredErrorPayload ? lastErrorPayloadText ?? "cron isolated run returned an error payload" : void 0;
	const shouldUseRunLevelErrorPayload = runLevelError !== void 0 && structuredErrorText === void 0 && failureSignal === void 0;
	const fatalDeliveryText = structuredErrorText ?? failureSignal?.message ?? (shouldUseRunLevelErrorPayload ? runLevelError : void 0);
	const fatalDeliveryPayload = fatalDeliveryText ? {
		text: fatalDeliveryText,
		isError: true
	} : void 0;
	return {
		summary: fatalDeliveryText ? pickSummaryFromOutput(fatalDeliveryText) ?? summary : summary,
		outputText: fatalDeliveryText ?? outputText,
		synthesizedText: fatalDeliveryText ?? synthesizedText,
		deliveryPayload: fatalDeliveryPayload ?? deliveryPayload,
		deliveryPayloads: fatalDeliveryPayload ? [fatalDeliveryPayload] : resolvedDeliveryPayloads,
		deliveryPayloadHasStructuredContent: fatalDeliveryPayload ? false : deliveryPayloadHasStructuredContent,
		hasFatalErrorPayload,
		hasFatalStructuredErrorPayload,
		embeddedRunError: structuredErrorText ? structuredErrorText : failureSignal ? formatCronFailureSignal(failureSignal) : runLevelError,
		pendingPresentationWarningError: hasPendingPresentationWarning ? lastErrorPayloadText : void 0
	};
}
//#endregion
//#region src/cron/isolated-agent/run-session-state.ts
/** Mutates and persists isolated cron session state around one run. */
var CronSessionLifecycleClaimError = class extends Error {
	constructor(sessionKey) {
		super(`Session "${sessionKey}" changed while starting work. Retry.`);
		this.name = "CronSessionLifecycleClaimError";
	}
};
function resolveCronLifecycleRevisionIdentity(lifecycleRevision) {
	return `cron-lifecycle-revision:${lifecycleRevision}`;
}
function cronTranscriptExists(entry) {
	const sessionFile = entry.sessionFile?.trim();
	if (require_sqlite_marker.parseSqliteSessionFileMarker(sessionFile)) return true;
	return Boolean(sessionFile && node_fs.default.existsSync(sessionFile));
}
function normalizeSessionField(value) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : void 0;
}
function projectCronOwnershipFields(entry) {
	const projected = { ...entry };
	delete projected.label;
	delete projected.pinnedAt;
	delete projected.updatedAt;
	return projected;
}
function toNonResumableCronSessionEntry(entry) {
	const next = { ...entry };
	delete next.sessionFile;
	delete next.sessionStartedAt;
	delete next.lastInteractionAt;
	delete next.cliSessionIds;
	delete next.cliSessionBindings;
	delete next.claudeCliSessionId;
	return next;
}
/** Creates the persistence callback that stores cron session metadata after a run. */
function createPersistCronSessionEntry(params) {
	return async () => {
		const liveEntry = params.cronSession.sessionEntry;
		const persistedEntry = require_session_key.isCronSessionKey(params.agentSessionKey) && liveEntry.sessionId && !cronTranscriptExists(liveEntry) ? toNonResumableCronSessionEntry(liveEntry) : liveEntry;
		let committedEntry = persistedEntry;
		let mergedLiveEntry = liveEntry;
		await params.persistSessionEntry({
			storePath: params.cronSession.storePath,
			sessionKey: params.agentSessionKey,
			fallbackEntry: persistedEntry,
			update: (currentEntry) => {
				const ownsCurrentRevision = currentEntry?.lifecycleRevision === params.cronSession.lifecycleRevision;
				const currentRevisionActive = Boolean(currentEntry?.lifecycleRevision && require_store.isSessionWorkAdmissionActive(params.cronSession.storePath, [resolveCronLifecycleRevisionIdentity(currentEntry.lifecycleRevision)]));
				const initialEntryMatchesOwnershipFields = currentEntry !== void 0 && params.cronSession.initialSessionEntry !== void 0 && (0, node_util.isDeepStrictEqual)(projectCronOwnershipFields(currentEntry), projectCronOwnershipFields(params.cronSession.initialSessionEntry));
				const canClaimInitialRevision = params.cronSession.initialSessionEntry ? !currentRevisionActive && initialEntryMatchesOwnershipFields : currentEntry === void 0;
				if (!ownsCurrentRevision && !canClaimInitialRevision) throw new CronSessionLifecycleClaimError(params.agentSessionKey);
				if ((ownsCurrentRevision || canClaimInitialRevision) && currentEntry && params.cronSession.initialSessionEntry) {
					committedEntry = require_session_snapshot_merge.mergeSessionSnapshotChanges({
						initial: params.cronSession.initialSessionEntry,
						next: persistedEntry,
						current: currentEntry
					});
					mergedLiveEntry = require_session_snapshot_merge.mergeSessionSnapshotChanges({
						initial: params.cronSession.initialSessionEntry,
						next: liveEntry,
						current: currentEntry
					});
				}
				return committedEntry;
			}
		});
		params.cronSession.sessionEntry = mergedLiveEntry;
		params.cronSession.initialSessionEntry = structuredClone(committedEntry);
		params.cronSession.store[params.agentSessionKey] = committedEntry;
	};
}
/** Creates the hidden exact-run session owner used by detached media wakes. */
function createCronRunContinuationSession(params) {
	const continuation = {
		lifecycleRevision: params.cronSession.lifecycleRevision,
		phase: "running",
		...params.toolsAllow !== void 0 ? { toolsAllow: [...params.toolsAllow] } : {},
		...params.toolsAllowIsDefault === true ? { toolsAllowIsDefault: true } : {},
		...params.cliSessionBindingFacts ? { cliSessionBindingFacts: { ...params.cliSessionBindingFacts } } : {}
	};
	const owns = (entry) => entry?.cronRunContinuation?.lifecycleRevision === continuation.lifecycleRevision;
	const persist = async (create, phase, basePersisted = false) => {
		const source = structuredClone(params.cronSession.sessionEntry);
		let persisted = false;
		let alreadySealed = false;
		await params.persistSessionEntry({
			storePath: params.cronSession.storePath,
			sessionKey: params.runSessionKey,
			fallbackEntry: source,
			update: (current) => {
				if (current && !owns(current) || !current && !create) throw new CronSessionLifecycleClaimError(params.runSessionKey);
				if (current && current.cronRunContinuation?.phase !== "running") {
					alreadySealed = phase === "ready" && current.cronRunContinuation?.phase === "ready";
					if (alreadySealed) return current;
					throw new CronSessionLifecycleClaimError(params.runSessionKey);
				}
				persisted = true;
				return {
					...current,
					...source,
					...params.thinkingLevel ? { thinkingLevel: params.thinkingLevel } : {},
					cronRunContinuation: {
						...continuation,
						phase,
						...phase === "ready" ? { basePersisted } : {}
					}
				};
			}
		});
		if (!persisted && !alreadySealed) throw new CronSessionLifecycleClaimError(params.runSessionKey);
	};
	return {
		initialize: async () => await persist(true, "running"),
		sync: async () => await persist(false, "running"),
		setCliExecutionProvider: async (provider) => {
			const normalizedProvider = provider?.trim();
			if (normalizedProvider) continuation.cliExecutionProvider = normalizedProvider;
			else delete continuation.cliExecutionProvider;
			await persist(false, "running");
		},
		seal: async (options) => await persist(false, "ready", options?.basePersisted === true)
	};
}
/** Adopts the session id/file produced by a run and preserves usage-family lineage. */
function adoptCronRunSessionMetadata(params) {
	const nextSessionId = normalizeSessionField(params.runMeta?.sessionId);
	const nextSessionFile = normalizeSessionField(params.runMeta?.sessionFile);
	if (!nextSessionFile) return false;
	let changed = false;
	const previousSessionId = params.entry.sessionId;
	if (nextSessionId && nextSessionId !== previousSessionId) {
		params.entry.sessionId = nextSessionId;
		params.entry.usageFamilyKey = params.entry.usageFamilyKey ?? params.sessionKey;
		params.entry.usageFamilySessionIds = Array.from(/* @__PURE__ */ new Set([
			...params.entry.usageFamilySessionIds ?? [],
			...previousSessionId ? [previousSessionId] : [],
			nextSessionId
		]));
		changed = true;
	}
	if (nextSessionFile !== params.entry.sessionFile) {
		params.entry.sessionFile = nextSessionFile;
		changed = true;
	}
	return changed;
}
/** Persists a changed skills snapshot onto the cron session entry outside fast tests. */
async function persistCronSkillsSnapshotIfChanged(params) {
	if (params.isFastTestEnv || params.skillsSnapshot === params.cronSession.sessionEntry.skillsSnapshot) return;
	params.cronSession.sessionEntry = {
		...params.cronSession.sessionEntry,
		updatedAt: params.nowMs,
		skillsSnapshot: params.skillsSnapshot
	};
	await params.persistSessionEntry();
}
/** Records the selected provider/model before a cron run starts. */
function markCronSessionPreRun(params) {
	params.entry.modelProvider = params.provider;
	params.entry.model = params.model;
	params.entry.systemSent = true;
}
/** Syncs live model/auth-profile changes from a running cron session back to storage. */
function syncCronSessionLiveSelection(params) {
	params.entry.modelProvider = params.liveSelection.provider;
	params.entry.model = params.liveSelection.model;
	if (params.liveSelection.agentRuntimeOverride) params.entry.agentRuntimeOverride = params.liveSelection.agentRuntimeOverride;
	else delete params.entry.agentRuntimeOverride;
	if (params.liveSelection.authProfileId) {
		params.entry.authProfileOverride = params.liveSelection.authProfileId;
		params.entry.authProfileOverrideSource = params.liveSelection.authProfileIdSource;
		if (params.liveSelection.authProfileIdSource === "auto") params.entry.authProfileOverrideCompactionCount = params.entry.compactionCount ?? 0;
		else delete params.entry.authProfileOverrideCompactionCount;
		return;
	}
	delete params.entry.authProfileOverride;
	delete params.entry.authProfileOverrideSource;
	delete params.entry.authProfileOverrideCompactionCount;
}
//#endregion
Object.defineProperty(exports, "CronSessionLifecycleClaimError", {
	enumerable: true,
	get: function() {
		return CronSessionLifecycleClaimError;
	}
});
Object.defineProperty(exports, "adoptCronRunSessionMetadata", {
	enumerable: true,
	get: function() {
		return adoptCronRunSessionMetadata;
	}
});
Object.defineProperty(exports, "createCronRunContinuationSession", {
	enumerable: true,
	get: function() {
		return createCronRunContinuationSession;
	}
});
Object.defineProperty(exports, "createPersistCronSessionEntry", {
	enumerable: true,
	get: function() {
		return createPersistCronSessionEntry;
	}
});
Object.defineProperty(exports, "isHeartbeatOnlyResponse", {
	enumerable: true,
	get: function() {
		return isHeartbeatOnlyResponse;
	}
});
Object.defineProperty(exports, "markCronSessionPreRun", {
	enumerable: true,
	get: function() {
		return markCronSessionPreRun;
	}
});
Object.defineProperty(exports, "persistCronSkillsSnapshotIfChanged", {
	enumerable: true,
	get: function() {
		return persistCronSkillsSnapshotIfChanged;
	}
});
Object.defineProperty(exports, "pickLastNonEmptyTextFromPayloads", {
	enumerable: true,
	get: function() {
		return pickLastNonEmptyTextFromPayloads;
	}
});
Object.defineProperty(exports, "pickSummaryFromOutput", {
	enumerable: true,
	get: function() {
		return pickSummaryFromOutput;
	}
});
Object.defineProperty(exports, "projectCronOwnershipFields", {
	enumerable: true,
	get: function() {
		return projectCronOwnershipFields;
	}
});
Object.defineProperty(exports, "resolveCronLifecycleRevisionIdentity", {
	enumerable: true,
	get: function() {
		return resolveCronLifecycleRevisionIdentity;
	}
});
Object.defineProperty(exports, "resolveCronPayloadOutcome", {
	enumerable: true,
	get: function() {
		return resolveCronPayloadOutcome;
	}
});
Object.defineProperty(exports, "resolveHeartbeatAckMaxChars", {
	enumerable: true,
	get: function() {
		return resolveHeartbeatAckMaxChars;
	}
});
Object.defineProperty(exports, "syncCronSessionLiveSelection", {
	enumerable: true,
	get: function() {
		return syncCronSessionLiveSelection;
	}
});
