const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
require("./embedded-agent-helpers-DJEcJifp.cjs");
const require_assistant_error_format = require("./assistant-error-format-fNZkoCjs.cjs");
const require_sanitize_user_facing_text = require("./sanitize-user-facing-text-B2i4WcAm.cjs");
const require_errors$1 = require("./errors-DsTBGN_q.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-resolve-DIIpxg9p.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
const require_model_selection_cli = require("./model-selection-cli-PCHB2Ve6.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
const require_providers_runtime = require("./providers.runtime-C5KyGi_O.cjs");
const require_source_check = require("./source-check-bi20wzmV.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_failover_error = require("./failover-error-voHYvp7k.cjs");
const require_run_termination = require("./run-termination-CDRVMWOn.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_errors$2 = require("./errors-8CSAqwWV.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
const require_usage_state = require("./usage-state-CfaEuTkC.cjs");
const require_redact_identifier = require("./redact-identifier-DrE35Pyt.cjs");
const require_session_suspension = require("./session-suspension-BguFcopH.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/agents/embedded-agent-runner/execution-phase.ts
const EMBEDDED_AGENT_EXECUTION_PHASE_LABELS = {
	runner_entered: "runner-entered",
	workspace: "workspace",
	runtime_plugins: "runtime-plugins",
	before_agent_reply: "before-agent-reply",
	model_resolution: "model-resolution",
	auth: "auth",
	context_engine: "context-engine",
	attempt_dispatch: "attempt-dispatch",
	context_assembled: "context-assembled",
	turn_accepted: "turn-accepted",
	process_spawned: "process-spawned",
	tool_execution_started: "tool-execution-started",
	assistant_output_started: "assistant-output-started",
	model_call_started: "model-call-started"
};
/** Converts an internal phase id into the compact label used in status output. */
function formatEmbeddedAgentExecutionPhase(phase) {
	return phase ? EMBEDDED_AGENT_EXECUTION_PHASE_LABELS[phase] : void 0;
}
//#endregion
//#region src/cron/service/execution-errors.ts
/** Formats stable cron timeout and execution error messages. */
function formatCronAgentExecutionPhase(execution) {
	return formatEmbeddedAgentExecutionPhase(execution?.phase);
}
const CRON_SETUP_TIMEOUT_ERROR = "cron: isolated agent setup timed out before runner start";
const CRON_PRE_EXECUTION_TIMEOUT_ERROR = "cron: isolated agent run stalled before execution start";
const CRON_TIMEOUT_ERROR_PREFIXES = [
	require_state_migrations_cron_run_logs.CRON_JOB_EXECUTION_TIMEOUT_ERROR,
	CRON_SETUP_TIMEOUT_ERROR,
	CRON_PRE_EXECUTION_TIMEOUT_ERROR
];
function hasCronTimeoutPrefix(error, prefix) {
	return error === prefix || error.startsWith(`${prefix} `);
}
function isCronTerminalAbortReasonText(error) {
	for (const prefix of CRON_TIMEOUT_ERROR_PREFIXES) if (hasCronTimeoutPrefix(error, prefix)) return true;
	return false;
}
/** Formats the generic cron execution timeout message with last-known phase context when available. */
function timeoutErrorMessage(execution) {
	const phase = formatCronAgentExecutionPhase(execution);
	if (!phase) return require_state_migrations_cron_run_logs.CRON_JOB_EXECUTION_TIMEOUT_ERROR;
	return `${require_state_migrations_cron_run_logs.CRON_JOB_EXECUTION_TIMEOUT_ERROR} (last phase: ${phase})`;
}
/** Formats timeout text for runs that stalled before the isolated runner started. */
function setupTimeoutErrorMessage(execution) {
	const phase = formatCronAgentExecutionPhase(execution);
	if (!phase) return CRON_SETUP_TIMEOUT_ERROR;
	return `${CRON_SETUP_TIMEOUT_ERROR} (last phase: ${phase})`;
}
/** Returns true for the setup-timeout class that fires before the isolated runner starts. */
function isSetupTimeoutErrorText(error) {
	return hasCronTimeoutPrefix(error, CRON_SETUP_TIMEOUT_ERROR);
}
/** Formats timeout text for runs that stalled after setup but before execution start. */
function preExecutionTimeoutErrorMessage(execution) {
	const phase = formatCronAgentExecutionPhase(execution);
	if (!phase) return CRON_PRE_EXECUTION_TIMEOUT_ERROR;
	return `${CRON_PRE_EXECUTION_TIMEOUT_ERROR} (last phase: ${phase})`;
}
/** Extracts a human timeout/abort reason, falling back to the canonical cron timeout text. */
function resolveCronAbortReasonText(reason) {
	if (typeof reason === "string" && reason.trim()) return reason.trim();
	if (reason instanceof Error && reason.message.trim()) return reason.message.trim();
}
/** Extracts a human timeout/abort reason, falling back to the canonical cron timeout text. */
function abortErrorMessage(signal) {
	return resolveCronAbortReasonText(signal?.reason) ?? timeoutErrorMessage();
}
function isAbortError(err) {
	if (!(err instanceof Error)) return false;
	return err.name === "AbortError" || err.message === timeoutErrorMessage();
}
/** Normalizes thrown cron run failures into stable log/run-history text. */
function normalizeCronRunErrorText(err) {
	if (isAbortError(err)) return timeoutErrorMessage();
	if (typeof err === "string") return err === `Error: ${timeoutErrorMessage()}` ? timeoutErrorMessage() : err;
	return String(err);
}
//#endregion
//#region src/agents/embedded-agent-runner/run/abortable.ts
/**
* AbortSignal-aware promise racing helper for embedded-agent attempts.
*/
function getAbortReason(signal) {
	return "reason" in signal ? signal.reason : void 0;
}
/** Marks AbortErrors produced by abortable() so provider aborts stay retryable. */
const OPERATOR_ABORTABLE_WRAPPER = Symbol.for("operator.abortable.wrapper");
function isOperatorAbortableWrapper(err) {
	return err !== null && typeof err === "object" && OPERATOR_ABORTABLE_WRAPPER in err;
}
function tagAsAbortableWrapper(err) {
	err[OPERATOR_ABORTABLE_WRAPPER] = true;
	return err;
}
function makeAbortError(signal) {
	const reason = getAbortReason(signal);
	if (reason instanceof Error) {
		const err = new Error(reason.message, { cause: reason });
		err.name = "AbortError";
		return tagAsAbortableWrapper(err);
	}
	const err = reason ? new Error("aborted", { cause: reason }) : /* @__PURE__ */ new Error("aborted");
	err.name = "AbortError";
	return tagAsAbortableWrapper(err);
}
/**
* Races a promise against an AbortSignal while preserving normal promise
* settlement. Abort wins immediately and rejected non-Error payloads are
* normalized so callers can safely log/inspect them as Error objects.
*/
function abortable(signal, promise) {
	if (signal.aborted) return Promise.reject(makeAbortError(signal));
	return new Promise((resolve, reject) => {
		const onAbort = () => {
			signal.removeEventListener("abort", onAbort);
			reject(makeAbortError(signal));
		};
		signal.addEventListener("abort", onAbort, { once: true });
		promise.then((value) => {
			signal.removeEventListener("abort", onAbort);
			resolve(value);
		}, (err) => {
			signal.removeEventListener("abort", onAbort);
			reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(err, "Non-Error rejection"));
		});
	});
}
//#endregion
//#region src/agents/failover-policy.ts
/** Returns true when a failed model can be probed during cooldown. */
function shouldAllowCooldownProbeForReason(reason) {
	return reason === "rate_limit" || reason === "overloaded" || reason === "billing" || reason === "unknown" || reason === "empty_response" || reason === "no_error_details" || reason === "unclassified" || reason === "timeout";
}
/** Returns true when a transient failure should consume a cooldown probe slot. */
function shouldUseTransientCooldownProbeSlot(reason) {
	return reason === "rate_limit" || reason === "overloaded" || reason === "unknown" || reason === "empty_response" || reason === "no_error_details" || reason === "unclassified" || reason === "timeout";
}
/** Returns true when a non-transient failure should leave transient probe budget intact. */
function shouldPreserveTransientCooldownProbeSlot(reason) {
	return reason === "model_not_found" || reason === "format" || reason === "auth" || reason === "auth_permanent" || reason === "session_expired";
}
//#endregion
//#region src/agents/fallback-skip-cache.ts
/**
* Session-scoped "known-bad candidate" cache for the model fallback chain.
*
* When explicitly enabled and a fallback candidate fails with a non-transient
* credential error (`auth` / `auth_permanent`), the chain can avoid retrying
* the same candidate on every subsequent turn until the user fixes their auth.
*
* This module records skip markers per `(sessionId, provider, model)` with a
* short TTL. The cache is intentionally in-memory only: a process restart
* clears it so a freshly-restarted gateway always tries every candidate at
* least once before deciding to skip again.
*
* The cache is global, not per-config, so any caller running fallbacks for the
* same `sessionId` shares the same skip set.
*/
/**
* Default time-to-live for a skip marker. Disabled by default so existing
* fallback retry behavior stays unchanged unless an operator opts in with
* OPERATOR_FALLBACK_SKIP_TTL_MS.
*/
const DEFAULT_FALLBACK_SKIP_TTL_MS = 0;
const FALLBACK_SKIP_TTL_ENV = "OPERATOR_FALLBACK_SKIP_TTL_MS";
const FALLBACK_SKIP_TTL_MIN_MS = 1e3;
const FALLBACK_SKIP_TTL_MAX_MS = 10 * 6e4;
function resolveConfiguredSkipTtlMs(env = process.env) {
	const raw = env[FALLBACK_SKIP_TTL_ENV];
	if (!raw) return DEFAULT_FALLBACK_SKIP_TTL_MS;
	const trimmed = raw.trim();
	if (!trimmed) return DEFAULT_FALLBACK_SKIP_TTL_MS;
	const parsed = (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictNonNegativeInteger)(trimmed);
	if (parsed === void 0) return DEFAULT_FALLBACK_SKIP_TTL_MS;
	if (parsed === 0) return 0;
	return Math.min(FALLBACK_SKIP_TTL_MAX_MS, Math.max(FALLBACK_SKIP_TTL_MIN_MS, parsed));
}
/**
* Minimum interval between two opportunistic global prunes. Keeps the
* worst-case cost of a hot write/check path amortized: even if a gateway
* tracks thousands of sessions, the cache is only walked every
* `GLOBAL_PRUNE_INTERVAL_MS`, not on every call.
*/
const GLOBAL_PRUNE_INTERVAL_MS = 5e3;
function getState() {
	const globalStore = globalThis;
	if (!globalStore.operatorFallbackSkipCacheState) {
		const buckets = globalStore.operatorFallbackSkipCache ?? /* @__PURE__ */ new Map();
		globalStore.operatorFallbackSkipCacheState = {
			buckets,
			lastGlobalPruneAtMs: 0
		};
		globalStore.operatorFallbackSkipCache = buckets;
	}
	return globalStore.operatorFallbackSkipCacheState;
}
function getBuckets() {
	return getState().buckets;
}
function sessionBucket(sessionId, create) {
	const buckets = getBuckets();
	let bucket = buckets.get(sessionId);
	if (!bucket && create) {
		bucket = /* @__PURE__ */ new Map();
		buckets.set(sessionId, bucket);
	}
	return bucket;
}
function candidateKey(provider, model) {
	return require_model_selection_normalize.modelKey(provider, model);
}
function pruneExpired(bucket, now) {
	for (const [key, entry] of bucket.entries()) if (entry.expiresAtMs <= now) bucket.delete(key);
}
/**
* Walk every session bucket, drop expired markers, and remove buckets that
* end up empty. Called opportunistically from the hot write/check paths so
* stale buckets left behind by one-off sessions cannot accumulate across the
* gateway's lifetime — the per-bucket prune only fires when the same session
* is queried again, which is not guaranteed for short-lived sessions.
*/
function pruneAllExpired(now) {
	const state = getState();
	if (now - state.lastGlobalPruneAtMs < GLOBAL_PRUNE_INTERVAL_MS) return;
	state.lastGlobalPruneAtMs = now;
	for (const [sessionId, bucket] of state.buckets.entries()) {
		pruneExpired(bucket, now);
		if (bucket.size === 0) state.buckets.delete(sessionId);
	}
}
/**
* Record that `(sessionId, provider, model)` should be skipped for the
* configured TTL. Safe to call with falsy `sessionId` — the call becomes a
* no-op so callers do not need to guard themselves.
*/
function markFallbackCandidateSkipped(params) {
	if (!params.sessionId || !params.provider || !params.model) return;
	const now = params.now ?? Date.now();
	const ttlMs = params.ttlMs ?? resolveConfiguredSkipTtlMs();
	if (ttlMs <= 0) return;
	pruneAllExpired(now);
	const bucket = sessionBucket(params.sessionId, true);
	if (!bucket) return;
	bucket.set(candidateKey(params.provider, params.model), {
		expiresAtMs: now + ttlMs,
		reason: params.reason
	});
}
/**
* Returns true when `(sessionId, provider, model)` has an unexpired skip
* marker. Expired entries are pruned as a side-effect so the cache does not
* grow unbounded.
*/
function isFallbackCandidateSkipped(params) {
	if (!params.sessionId || !params.provider || !params.model) return false;
	const now = params.now ?? Date.now();
	pruneAllExpired(now);
	const bucket = sessionBucket(params.sessionId, false);
	if (!bucket) return false;
	pruneExpired(bucket, now);
	if (bucket.size === 0) {
		getBuckets().delete(params.sessionId);
		return false;
	}
	const entry = bucket.get(candidateKey(params.provider, params.model));
	return Boolean(entry && entry.expiresAtMs > now);
}
/**
* Look up the recorded skip reason for a `(sessionId, provider, model)`
* triple. Returns `undefined` when no unexpired marker exists. Used by the
* fallback chain to surface the original failure reason in observation logs.
*/
function getFallbackCandidateSkipReason(params) {
	if (!params.sessionId || !params.provider || !params.model) return;
	const bucket = sessionBucket(params.sessionId, false);
	if (!bucket) return;
	const now = params.now ?? Date.now();
	const entry = bucket.get(candidateKey(params.provider, params.model));
	if (!entry || entry.expiresAtMs <= now) return;
	return entry.reason;
}
//#endregion
//#region src/agents/harness/errors.ts
/**
* Agent harness error helpers.
*
* Registry and runtime callers use this stable error type to distinguish missing
* harness selection from ordinary harness execution failures.
*/
/** Error thrown when a requested harness id is not registered. */
var MissingAgentHarnessError = class extends Error {
	constructor(harnessId) {
		super(`Requested agent harness "${harnessId}" is not registered.`);
		this.name = "MissingAgentHarnessError";
		this.harnessId = harnessId;
	}
};
/** Returns whether an error is a missing harness error. */
function isMissingAgentHarnessError(err) {
	return err instanceof MissingAgentHarnessError;
}
//#endregion
//#region src/agents/live-model-switch-error.ts
/** Control-flow error used to request a live session model switch. */
var LiveSessionModelSwitchError = class extends Error {
	constructor(selection) {
		super(`Live session model switch requested: ${selection.provider}/${selection.model}`);
		this.name = "LiveSessionModelSwitchError";
		this.provider = selection.provider;
		this.model = selection.model;
		this.agentRuntimeOverride = selection.agentRuntimeOverride;
		this.authProfileId = selection.authProfileId;
		this.authProfileIdSource = selection.authProfileIdSource;
	}
};
//#endregion
//#region src/agents/embedded-agent-error-observation.ts
/**
* Builds structured observations for embedded-agent API/text failures.
*/
const MAX_OBSERVATION_INPUT_CHARS = 64e3;
const MAX_FINGERPRINT_MESSAGE_CHARS = 8e3;
const RAW_ERROR_PREVIEW_MAX_CHARS = 400;
const PROVIDER_ERROR_PREVIEW_MAX_CHARS = 200;
const REQUEST_ID_RE = /\brequest[_ ]?id\b\s*[:=]\s*["'()]*([A-Za-z0-9._:-]+)/i;
const OBSERVATION_EXTRA_REDACT_PATTERNS = [
	String.raw`\b(?:x-)?api[-_]?key\b\s*[:=]\s*(["']?)([^\s"'\\;]+)\1`,
	String.raw`"(?:api[-_]?key|api_key)"\s*:\s*"([^"]+)"`,
	String.raw`(?:\bCookie\b\s*[:=]\s*[^;=\s]+=|;\s*[^;=\s]+=)([^;\s\r\n]+)`
];
const RAW_ERROR_CONSOLE_SUPPRESSED_FAILURE_KINDS = /* @__PURE__ */ new Set([
	"auth_html",
	"auth_refresh",
	"auth_scope",
	"upstream_html"
]);
function resolveConfiguredRedactPatterns() {
	const configured = require_redact.readLoggingConfig()?.redactPatterns;
	if (!Array.isArray(configured)) return [];
	return configured.filter((pattern) => typeof pattern === "string");
}
function truncateForObservation(text, maxChars) {
	const trimmed = text?.trim();
	if (!trimmed) return;
	return trimmed.length > maxChars ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, maxChars)}…` : trimmed;
}
function boundObservationInput(text) {
	const trimmed = text?.trim();
	if (!trimmed) return;
	return trimmed.length > MAX_OBSERVATION_INPUT_CHARS ? (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(trimmed, MAX_OBSERVATION_INPUT_CHARS) : trimmed;
}
function replaceRequestIdPreview(text, requestId) {
	if (!text || !requestId) return text;
	return text.split(requestId).join(require_redact_identifier.redactIdentifier(requestId, { len: 12 }));
}
function redactObservationText(text) {
	if (!text) return text;
	const configuredPatterns = resolveConfiguredRedactPatterns();
	return require_redact.redactSensitiveText(text, {
		mode: "tools",
		patterns: [
			...require_redact.getDefaultRedactPatterns(),
			...configuredPatterns,
			...OBSERVATION_EXTRA_REDACT_PATTERNS
		]
	});
}
function shouldSuppressRawErrorConsoleSuffix(providerRuntimeFailureKind) {
	return providerRuntimeFailureKind ? RAW_ERROR_CONSOLE_SUPPRESSED_FAILURE_KINDS.has(providerRuntimeFailureKind) : false;
}
function buildObservationFingerprint(params) {
	const boundedMessage = params.message && params.message.length > MAX_FINGERPRINT_MESSAGE_CHARS ? (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(params.message, MAX_FINGERPRINT_MESSAGE_CHARS) : params.message;
	const structured = params.httpCode || params.type || boundedMessage ? require_stable_stringify.stableStringify({
		httpCode: params.httpCode,
		type: params.type,
		message: boundedMessage
	}) : null;
	if (structured) return structured;
	if (params.requestId) return params.raw.split(params.requestId).join("<request_id>");
	return require_sanitize_user_facing_text.getApiErrorPayloadFingerprint(params.raw);
}
function buildApiErrorObservationFields(rawError, opts) {
	const trimmed = boundObservationInput(rawError);
	if (!trimmed) return {};
	try {
		const parsed = require_assistant_error_format.parseApiErrorInfo(trimmed);
		const requestId = parsed?.requestId ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(trimmed.match(REQUEST_ID_RE)?.[1]);
		const requestIdHash = requestId ? require_redact_identifier.redactIdentifier(requestId, { len: 12 }) : void 0;
		const rawFingerprint = buildObservationFingerprint({
			raw: trimmed,
			requestId,
			httpCode: parsed?.httpCode,
			type: parsed?.type,
			message: parsed?.message
		});
		const redactedRawPreview = replaceRequestIdPreview(redactObservationText(trimmed), requestId);
		const redactedProviderMessage = replaceRequestIdPreview(redactObservationText(parsed?.message), requestId);
		return {
			rawErrorPreview: truncateForObservation(redactedRawPreview, RAW_ERROR_PREVIEW_MAX_CHARS),
			rawErrorHash: require_redact_identifier.redactIdentifier(trimmed, { len: 12 }),
			rawErrorFingerprint: rawFingerprint ? require_redact_identifier.redactIdentifier(rawFingerprint, { len: 12 }) : void 0,
			httpCode: parsed?.httpCode,
			providerRuntimeFailureKind: require_errors$1.classifyProviderRuntimeFailureKind({
				status: parsed?.httpCode ? Number(parsed.httpCode) : void 0,
				message: trimmed,
				provider: opts?.provider
			}),
			providerErrorType: parsed?.type,
			providerErrorMessagePreview: truncateForObservation(redactedProviderMessage, PROVIDER_ERROR_PREVIEW_MAX_CHARS),
			requestIdHash
		};
	} catch {
		return {};
	}
}
function buildTextObservationFields(text, opts) {
	const observed = buildApiErrorObservationFields(text, opts);
	return {
		textPreview: observed.rawErrorPreview,
		textHash: observed.rawErrorHash,
		textFingerprint: observed.rawErrorFingerprint,
		httpCode: observed.httpCode,
		providerRuntimeFailureKind: observed.providerRuntimeFailureKind,
		providerErrorType: observed.providerErrorType,
		providerErrorMessagePreview: observed.providerErrorMessagePreview,
		requestIdHash: observed.requestIdHash
	};
}
//#endregion
//#region src/agents/model-fallback-observation.ts
/**
* Structured logging for model fallback decisions. The log payload carries
* sanitized error observations plus step fields that make fallback chains
* auditable.
*/
const decisionLog = require_subsystem.createSubsystemLogger("model-fallback").child("decision");
const AUTH_DECISION_LOG_COALESCE_WINDOW_MS = 3e4;
const AUTH_DECISION_LOG_COALESCE_MAX_ENTRIES = 100;
/** Return whether fallback decision logging is enabled for warn-level events. */
function isModelFallbackDecisionLogEnabled() {
	return decisionLog.isEnabled("warn");
}
function buildErrorObservationFields(error) {
	const observed = buildTextObservationFields(error);
	return {
		errorPreview: observed.textPreview,
		errorHash: observed.textHash,
		errorFingerprint: observed.textFingerprint,
		httpCode: observed.httpCode,
		providerErrorType: observed.providerErrorType,
		providerErrorMessagePreview: observed.providerErrorMessagePreview,
		requestIdHash: observed.requestIdHash
	};
}
const authDecisionLogCoalesceEntries = /* @__PURE__ */ new Map();
function formatModelRef(candidate) {
	return `${candidate.provider}/${candidate.model}`;
}
function isAuthDecisionLogCoalescingEligible(params) {
	return (params.decision === "candidate_failed" || params.decision === "skip_candidate") && (params.reason === "auth" || params.reason === "auth_permanent");
}
function buildAuthDecisionLogCoalesceKey(params, observedError) {
	return JSON.stringify([
		params.sessionId ?? params.runId,
		params.lane,
		params.requestedProvider,
		params.requestedModel,
		params.decision,
		params.candidate.provider,
		params.candidate.model,
		params.attempt,
		params.total,
		params.reason,
		params.status,
		params.code,
		observedError.httpCode,
		observedError.providerErrorType,
		observedError.errorFingerprint ?? observedError.errorHash,
		params.nextCandidate ? formatModelRef(params.nextCandidate) : null,
		params.isPrimary,
		params.requestedModelMatched,
		params.fallbackConfigured
	]);
}
function pruneAuthDecisionLogCoalesceEntries(now) {
	const staleBefore = now - AUTH_DECISION_LOG_COALESCE_WINDOW_MS * 2;
	for (const [key, entry] of authDecisionLogCoalesceEntries) if (entry.lastLoggedAt < staleBefore) authDecisionLogCoalesceEntries.delete(key);
}
function evictOldestAuthDecisionLogCoalesceEntry() {
	let oldestKey;
	let oldestLoggedAt = Infinity;
	for (const [key, entry] of authDecisionLogCoalesceEntries) if (entry.lastLoggedAt < oldestLoggedAt) {
		oldestLoggedAt = entry.lastLoggedAt;
		oldestKey = key;
	}
	if (oldestKey !== void 0) authDecisionLogCoalesceEntries.delete(oldestKey);
}
function rememberAuthDecisionLogCoalesceEntry(key, now) {
	if (!authDecisionLogCoalesceEntries.has(key)) {
		pruneAuthDecisionLogCoalesceEntries(now);
		if (authDecisionLogCoalesceEntries.size >= AUTH_DECISION_LOG_COALESCE_MAX_ENTRIES) evictOldestAuthDecisionLogCoalesceEntry();
	}
	authDecisionLogCoalesceEntries.set(key, {
		lastLoggedAt: now,
		suppressed: 0
	});
}
function resolveAuthDecisionLogCoalescing(params, observedError) {
	if (!isAuthDecisionLogCoalescingEligible(params)) return { shouldLog: true };
	const now = Date.now();
	const key = buildAuthDecisionLogCoalesceKey(params, observedError);
	const recent = authDecisionLogCoalesceEntries.get(key);
	const recentAgeMs = recent ? now - recent.lastLoggedAt : void 0;
	if (recent && recentAgeMs !== void 0 && recentAgeMs >= AUTH_DECISION_LOG_COALESCE_WINDOW_MS * 2) {
		authDecisionLogCoalesceEntries.delete(key);
		rememberAuthDecisionLogCoalesceEntry(key, now);
		return { shouldLog: true };
	}
	if (recent && recentAgeMs !== void 0 && recentAgeMs < AUTH_DECISION_LOG_COALESCE_WINDOW_MS) {
		recent.suppressed += 1;
		return { shouldLog: false };
	}
	const suppressedDuplicateCount = recent?.suppressed;
	rememberAuthDecisionLogCoalesceEntry(key, now);
	return {
		shouldLog: true,
		suppressedDuplicateCount
	};
}
function buildFallbackStepFields(params) {
	const lastPreviousAttempt = params.previousAttempts?.at(-1);
	if (params.decision === "candidate_succeeded") {
		if (!lastPreviousAttempt) return;
		return {
			fallbackStepType: "fallback_step",
			fallbackStepFromModel: `${lastPreviousAttempt.provider}/${lastPreviousAttempt.model}`,
			fallbackStepToModel: formatModelRef(params.candidate),
			...lastPreviousAttempt.reason ? { fallbackStepFromFailureReason: lastPreviousAttempt.reason } : {},
			...lastPreviousAttempt.error ? { fallbackStepFromFailureDetail: lastPreviousAttempt.error } : {},
			...typeof params.attempt === "number" ? { fallbackStepChainPosition: params.attempt } : {},
			fallbackStepFinalOutcome: "succeeded"
		};
	}
	const observed = buildErrorObservationFields(params.error);
	return {
		fallbackStepType: "fallback_step",
		fallbackStepFromModel: formatModelRef(params.candidate),
		...params.nextCandidate ? { fallbackStepToModel: formatModelRef(params.nextCandidate) } : {},
		...params.reason ? { fallbackStepFromFailureReason: params.reason } : {},
		...observed.providerErrorMessagePreview ?? observed.errorPreview ? { fallbackStepFromFailureDetail: observed.providerErrorMessagePreview ?? observed.errorPreview } : {},
		...typeof params.attempt === "number" ? { fallbackStepChainPosition: params.attempt } : {},
		fallbackStepFinalOutcome: params.nextCandidate ? "next_fallback" : "chain_exhausted"
	};
}
/** Log one model fallback decision and return structured fallback-step fields. */
function logModelFallbackDecision(params) {
	const nextText = params.nextCandidate ? `${require_ansi.sanitizeForLog(params.nextCandidate.provider)}/${require_ansi.sanitizeForLog(params.nextCandidate.model)}` : "none";
	const reasonText = params.reason ?? "unknown";
	const observedError = buildErrorObservationFields(params.error);
	const detailText = observedError.providerErrorMessagePreview ?? observedError.errorPreview;
	const fallbackStepFields = params.decision === "skip_candidate" || params.decision === "candidate_failed" || params.decision === "candidate_succeeded" ? buildFallbackStepFields({
		decision: params.decision,
		candidate: params.candidate,
		reason: params.reason,
		error: params.error,
		nextCandidate: params.nextCandidate,
		attempt: params.attempt,
		previousAttempts: params.previousAttempts
	}) : void 0;
	const providerErrorTypeSuffix = observedError.providerErrorType ? ` providerErrorType=${require_ansi.sanitizeForLog(observedError.providerErrorType)}` : "";
	const detailSuffix = detailText ? ` detail=${require_ansi.sanitizeForLog(detailText)}` : "";
	const logCoalescing = resolveAuthDecisionLogCoalescing(params, observedError);
	if (!logCoalescing.shouldLog) return fallbackStepFields;
	const suppressedDuplicateCount = logCoalescing.suppressedDuplicateCount ?? 0;
	const suppressedSuffix = suppressedDuplicateCount > 0 ? ` (${suppressedDuplicateCount} duplicates suppressed in last ${AUTH_DECISION_LOG_COALESCE_WINDOW_MS / 1e3}s)` : "";
	decisionLog.warn("model fallback decision", {
		event: "model_fallback_decision",
		tags: [
			"error_handling",
			"model_fallback",
			params.decision
		],
		runId: params.runId,
		sessionId: params.sessionId,
		lane: params.lane,
		decision: params.decision,
		requestedProvider: params.requestedProvider,
		requestedModel: params.requestedModel,
		candidateProvider: params.candidate.provider,
		candidateModel: params.candidate.model,
		attempt: params.attempt,
		total: params.total,
		reason: params.reason,
		status: params.status,
		code: params.code,
		...observedError,
		...fallbackStepFields,
		nextCandidateProvider: params.nextCandidate?.provider,
		nextCandidateModel: params.nextCandidate?.model,
		isPrimary: params.isPrimary,
		requestedModelMatched: params.requestedModelMatched,
		fallbackConfigured: params.fallbackConfigured,
		allowTransientCooldownProbe: params.allowTransientCooldownProbe,
		profileCount: params.profileCount,
		...suppressedDuplicateCount > 0 ? { suppressedDuplicateCount } : {},
		previousAttempts: params.previousAttempts?.map((attempt) => ({
			provider: attempt.provider,
			model: attempt.model,
			reason: attempt.reason,
			status: attempt.status,
			code: attempt.code,
			...buildErrorObservationFields(attempt.error)
		})),
		consoleMessage: `model fallback decision: decision=${params.decision} requested=${require_ansi.sanitizeForLog(params.requestedProvider)}/${require_ansi.sanitizeForLog(params.requestedModel)} candidate=${require_ansi.sanitizeForLog(params.candidate.provider)}/${require_ansi.sanitizeForLog(params.candidate.model)} reason=${reasonText}${providerErrorTypeSuffix} next=${nextText}${detailSuffix}${suppressedSuffix}`
	});
	return fallbackStepFields;
}
//#endregion
//#region src/agents/model-fallback.ts
/**
* Runs model and image fallback chains across provider/model candidates.
*/
const log = require_subsystem.createSubsystemLogger("model-fallback");
function isTranscriptNotContinuableError(err) {
	if (!err || typeof err !== "object") return false;
	return err.code === require_errors$2.TRANSCRIPT_NOT_CONTINUABLE_ERROR_CODE;
}
function hasExactConfiguredProviderModel(params) {
	const normalizedProvider = require_model_selection_normalize.normalizeProviderId(params.provider);
	const model = params.model.trim();
	if (!params.cfg || !normalizedProvider || !model) return false;
	for (const [providerId, providerConfig] of Object.entries(params.cfg.models?.providers ?? {})) {
		if (require_model_selection_normalize.normalizeProviderId(providerId) !== normalizedProvider) continue;
		return (providerConfig.models ?? []).some((entry) => entry.id.trim() === model);
	}
	return false;
}
function hasConfiguredProvider(params) {
	const normalizedProvider = require_model_selection_normalize.normalizeProviderId(params.provider);
	if (!params.cfg || !normalizedProvider) return false;
	return Object.keys(params.cfg.models?.providers ?? {}).some((providerId) => require_model_selection_normalize.normalizeProviderId(providerId) === normalizedProvider);
}
function allowPluginModelNormalizationForRef(params) {
	if (params.cfg && !require_config_state.normalizePluginsConfig(params.cfg.plugins).enabled && hasConfiguredProvider(params)) return false;
	return !hasExactConfiguredProviderModel(params);
}
/**
* Structured error thrown when all model fallback candidates have been
* exhausted. Carries per-attempt details so callers can build informative
* user-facing messages (e.g. "rate-limited, retry in 30 s").
*/
var FallbackSummaryError = class extends Error {
	constructor(message, attempts, soonestCooldownExpiry, cause, attribution) {
		super(message, { cause });
		this.name = "FallbackSummaryError";
		this.attempts = attempts;
		this.soonestCooldownExpiry = soonestCooldownExpiry;
		this.sessionId = attribution?.sessionId;
		this.lane = attribution?.lane;
	}
};
function isFallbackSummaryError(err) {
	return err instanceof FallbackSummaryError;
}
function isTerminalAbortReasonString(reason) {
	return isCronTerminalAbortReasonText(reason);
}
function getErrorCauseCandidates(err) {
	const candidates = [];
	if ("cause" in err && err.cause !== void 0) {
		candidates.push(err.cause);
		if (err.cause instanceof Error && "cause" in err.cause && err.cause.cause !== void 0) candidates.push(err.cause.cause);
	}
	return candidates;
}
function isTerminalAbortCandidate(candidate) {
	if (typeof candidate === "string") return isTerminalAbortReasonString(candidate);
	if (!(candidate instanceof Error)) return false;
	if (require_run_termination.isAgentRunRestartAbortReason(candidate)) return true;
	if (candidate.name === "TimeoutError") return true;
	if (candidate.name === "ClientDisconnectError") return true;
	return isTerminalAbortReasonString(candidate.message);
}
function isTerminalAbort(signal) {
	if (!signal?.aborted) return false;
	const reason = signal.reason;
	if (reason instanceof Error) return [reason, ...getErrorCauseCandidates(reason)].some(isTerminalAbortCandidate);
	return isTerminalAbortCandidate(reason);
}
function isTerminalAbortFromError(err) {
	if (!(err instanceof Error)) return false;
	if (require_run_termination.isAgentRunRestartAbortReason(err)) return true;
	const causeCandidates = getErrorCauseCandidates(err);
	if (err.name !== "AbortError") return false;
	for (const candidate of causeCandidates) if (require_run_termination.isAgentRunRestartAbortReason(candidate)) return true;
	if (!isOperatorAbortableWrapper(err)) return false;
	return causeCandidates.some(isTerminalAbortCandidate);
}
function isCallerAbortSignal(signal) {
	return signal?.aborted === true;
}
function createModelCandidateCollector(allowlist) {
	const seen = /* @__PURE__ */ new Set();
	const candidates = [];
	const addCandidate = (candidate, enforceAllowlist) => {
		if (!candidate.provider || !candidate.model) return;
		const key = require_model_selection_normalize.modelKey(candidate.provider, candidate.model);
		if (seen.has(key)) return;
		if (enforceAllowlist && allowlist && !allowlist.has(key)) return;
		seen.add(key);
		candidates.push(candidate);
	};
	const addExplicitCandidate = (candidate) => {
		addCandidate(candidate, false);
	};
	const addAllowlistedCandidate = (candidate) => {
		addCandidate(candidate, true);
	};
	return {
		candidates,
		addExplicitCandidate,
		addAllowlistedCandidate
	};
}
const modelFallbackAuthRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./model-fallback-auth.runtime-iKLIuYxj.cjs")));
const MAX_FALLBACK_CANDIDATE_CACHE_ENTRIES = 256;
const fallbackCandidateCache = /* @__PURE__ */ new Map();
async function loadModelFallbackAuthRuntime() {
	return await modelFallbackAuthRuntimeLoader.load();
}
function buildFallbackSuccess(params) {
	return {
		outcome: "completed",
		result: params.result,
		provider: params.provider,
		model: params.model,
		attempts: params.attempts
	};
}
async function runFallbackCandidate(params) {
	try {
		const run = () => params.options ? params.run(params.provider, params.model, params.options) : params.run(params.provider, params.model);
		return {
			ok: true,
			result: params.deferSessionSuspension ? await require_session_suspension.runWithDeferredSessionSuspension(run, params.onDeferredSessionSuspension) : await run()
		};
	} catch (err) {
		if (require_command_queue.isCommandLaneTaskTimeoutError(err)) throw err;
		const fallbackError = require_failover_error.resolveModelFallbackError(err, {
			provider: params.provider,
			model: params.model,
			sessionId: params.attribution?.sessionId,
			lane: params.attribution?.lane
		});
		if (fallbackError.kind === "coordination") throw err;
		if (isTerminalAbort(params.abortSignal) || isCallerAbortSignal(params.abortSignal)) throw err;
		if (require_run_termination.isAgentRunDirectAbortReason(err) || require_run_termination.isAgentRunRestartAbortReason(err)) throw err;
		if (isTerminalAbortFromError(err)) throw err;
		return {
			ok: false,
			error: fallbackError.kind === "failover" ? fallbackError.error : err
		};
	}
}
async function runFallbackAttempt(params) {
	const runResult = await runFallbackCandidate({
		run: params.run,
		provider: params.provider,
		model: params.model,
		options: params.options,
		deferSessionSuspension: params.deferSessionSuspension,
		onDeferredSessionSuspension: params.onDeferredSessionSuspension,
		attribution: params.attribution,
		abortSignal: params.abortSignal
	});
	if (runResult.ok) {
		const classification = await params.classifyResult?.({
			result: runResult.result,
			provider: params.provider,
			model: params.model,
			attempt: params.attempt,
			total: params.total
		});
		const classifiedError = resolveResultClassificationError(classification, {
			provider: params.provider,
			model: params.model,
			attribution: params.attribution
		});
		if (classifiedError) {
			if (isTerminalAbort(params.abortSignal) || isCallerAbortSignal(params.abortSignal)) throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(classifiedError, "Non-Error thrown");
			const preserveResultOnExhaustion = classification && "preserveResultOnExhaustion" in classification && classification.preserveResultOnExhaustion === true;
			return {
				error: classifiedError,
				classifiedResult: {
					result: runResult.result,
					provider: params.provider,
					model: params.model
				},
				...preserveResultOnExhaustion ? { exhaustionResult: {
					result: runResult.result,
					provider: params.provider,
					model: params.model,
					priority: typeof classification.preserveResultPriority === "number" && Number.isFinite(classification.preserveResultPriority) ? classification.preserveResultPriority : 0
				} } : {}
			};
		}
		return { success: buildFallbackSuccess({
			result: runResult.result,
			provider: params.provider,
			model: params.model,
			attempts: params.attempts
		}) };
	}
	return { error: runResult.error };
}
function resolveResultClassificationError(classification, params) {
	if (!classification) return null;
	if ("error" in classification) return classification.error;
	const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(classification.message);
	if (!message) return null;
	return new require_failover_error.FailoverError(message, {
		reason: classification.reason ?? "unknown",
		provider: params.provider,
		model: params.model,
		sessionId: params.attribution?.sessionId,
		lane: params.attribution?.lane,
		status: classification.status,
		code: classification.code,
		rawError: classification.rawError
	});
}
function sameModelCandidate(a, b) {
	return a.provider === b.provider && a.model === b.model;
}
function isCliAgentRuntime(runtime, cfg) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(runtime);
	if (!normalized) return false;
	return require_model_runtime_aliases.isCliRuntimeAlias(normalized) || require_model_selection_cli.isCliProvider(normalized, cfg);
}
async function resolveModelFallbackCandidateHarnessAuthPrecheck(params) {
	const agentHarnessRuntimeOverride = params.resolveAgentHarnessRuntimeOverride?.(params.provider, params.model);
	const result = (skipsProviderAuthCooldown) => ({
		skipsProviderAuthCooldown,
		agentHarnessRuntimeOverride
	});
	if (!params.cfg) return result(false);
	const agentRuntimeOverride = require_openai_routing.normalizeOptionalAgentRuntimeId(agentHarnessRuntimeOverride);
	const explicitAgentRuntime = agentRuntimeOverride && !require_openai_routing.isDefaultAgentRuntimeId(agentRuntimeOverride) ? agentRuntimeOverride : void 0;
	if (!explicitAgentRuntime && require_model_selection_cli.isCliProvider(params.provider, params.cfg)) return result(true);
	const harnessPolicy = require_policy.resolveAgentHarnessPolicy({
		provider: params.provider,
		modelId: params.model,
		config: params.cfg,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
	const agentRuntime = explicitAgentRuntime ?? harnessPolicy.runtime;
	const agentRuntimeSource = explicitAgentRuntime ? "model" : harnessPolicy.runtimeSource;
	if (agentRuntime === "@gabrielvfonseca/operator") return result(false);
	if (agentRuntime === "auto" || agentRuntime === "codex" && agentRuntimeSource === "implicit") return result(false);
	await params.prepareAgentHarnessRuntime?.({
		provider: params.provider,
		model: params.model,
		agentHarnessRuntimeOverride
	});
	if (require_registry.getRegisteredAgentHarness(agentRuntime)) return result(true);
	if (isCliAgentRuntime(agentRuntime, params.cfg)) return result(true);
	throw new MissingAgentHarnessError(agentRuntime);
}
function resolveCandidateAttemptError(described, candidate) {
	if (described.rawError && (!described.provider || described.provider === candidate.provider && (!described.model || described.model === candidate.model))) return described.rawError;
	return described.message;
}
function recordFailedCandidateAttempt(params) {
	const described = require_failover_error.describeFailoverError(params.error);
	const error = resolveCandidateAttemptError(described, params.candidate);
	params.attempts.push({
		provider: params.candidate.provider,
		model: params.candidate.model,
		error,
		reason: described.reason ?? "unknown",
		authMode: described.authMode,
		status: described.status,
		code: described.code
	});
	return logModelFallbackDecision({
		decision: "candidate_failed",
		runId: params.runId,
		sessionId: params.sessionId,
		lane: params.lane,
		requestedProvider: params.requestedProvider ?? params.candidate.provider,
		requestedModel: params.requestedModel ?? params.candidate.model,
		candidate: params.candidate,
		attempt: params.attempt,
		total: params.total,
		reason: described.reason,
		status: described.status,
		code: described.code,
		error,
		nextCandidate: params.nextCandidate,
		isPrimary: params.isPrimary,
		requestedModelMatched: params.requestedModelMatched,
		fallbackConfigured: params.fallbackConfigured
	});
}
function appendFailedCandidateAttempt(params) {
	const described = require_failover_error.describeFailoverError(params.error);
	params.attempts.push({
		provider: params.candidate.provider,
		model: params.candidate.model,
		error: resolveCandidateAttemptError(described, params.candidate),
		reason: described.reason ?? "unknown",
		authMode: described.authMode,
		status: described.status,
		code: described.code
	});
}
function findLiveSessionModelSwitchRedirectIndex(params) {
	const targetKey = require_model_selection_normalize.modelKey(params.error.provider, params.error.model);
	for (const [offset, candidate] of params.candidates.slice(params.currentIndex + 1).entries()) if (require_model_selection_normalize.modelKey(candidate.provider, candidate.model) === targetKey) return params.currentIndex + 1 + offset;
	return null;
}
function hasDifferentLiveSessionRuntimeSelection(params) {
	const normalizeRuntime = (runtime) => {
		const normalized = require_openai_routing.normalizeOptionalAgentRuntimeId(runtime);
		return normalized && !require_openai_routing.isDefaultAgentRuntimeId(normalized) ? normalized : void 0;
	};
	return normalizeRuntime(params.currentAgentHarnessRuntimeOverride) !== normalizeRuntime(params.error.agentRuntimeOverride);
}
function throwFallbackFailureSummary(params) {
	if (params.attempts.length <= 1 && params.lastError) throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(params.lastError, "Non-Error thrown");
	if (params.attribution?.sessionId) require_session_suspension.suspendSession({
		cfg: params.cfg,
		agentDir: params.agentDir,
		sessionId: params.attribution.sessionId,
		laneId: params.attribution.lane,
		reason: "circuit_open",
		failedProvider: params.attempts[params.attempts.length - 1]?.provider ?? "unknown",
		failedModel: params.attempts[params.attempts.length - 1]?.model ?? "unknown"
	});
	const summary = params.attempts.length > 0 ? params.attempts.map(params.formatAttempt).join(" | ") : "unknown";
	const remediation = require_failover_error.buildFailoverRemediationHint(params.lastError);
	throw new FallbackSummaryError(remediation ? `All ${params.label} failed (${params.attempts.length || params.candidates.length}): ${summary}. ${remediation}` : `All ${params.label} failed (${params.attempts.length || params.candidates.length}): ${summary}`, params.attempts, params.soonestCooldownExpiry ?? null, params.lastError instanceof Error ? params.lastError : void 0, params.attribution);
}
function resolveFallbackSoonestCooldownExpiry(params) {
	if (!params.authRuntime || !params.authStore) return null;
	const refreshedStore = params.authRuntime.loadAuthProfileStoreForRuntime(params.agentDir, {
		readOnly: true,
		externalCli: require_external_cli_discovery.externalCliDiscoveryForProviders({
			cfg: params.cfg,
			providers: params.candidates.map((candidate) => candidate.provider)
		})
	});
	let soonest = null;
	for (const candidate of params.candidates) {
		const ids = params.authRuntime.resolveAuthProfileOrder({
			cfg: params.cfg,
			store: refreshedStore,
			provider: candidate.provider
		});
		const candidateSoonest = params.authRuntime.getSoonestCooldownExpiry(refreshedStore, ids, { forModel: candidate.model });
		if (typeof candidateSoonest === "number" && Number.isFinite(candidateSoonest) && (soonest === null || candidateSoonest < soonest)) soonest = candidateSoonest;
	}
	return soonest;
}
function resolveImageFallbackCandidates(params) {
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg ?? {},
		defaultProvider: params.defaultProvider,
		manifestPlugins: params.manifestPlugins
	});
	const { candidates, addExplicitCandidate, addAllowlistedCandidate } = createModelCandidateCollector(require_model_selection_shared.buildConfiguredAllowlistKeys({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		manifestPlugins: params.manifestPlugins
	}));
	const addRaw = (raw, opts) => {
		const resolved = require_model_selection_shared.resolveModelRefFromString({
			cfg: params.cfg,
			raw,
			defaultProvider: params.defaultProvider,
			aliasIndex,
			manifestPlugins: params.manifestPlugins
		});
		if (!resolved) return;
		if (opts?.allowlist) {
			addAllowlistedCandidate(resolved.ref);
			return;
		}
		addExplicitCandidate(resolved.ref);
	};
	if (params.modelOverride?.trim()) addRaw(params.modelOverride);
	else {
		const primary = require_model_input.resolveAgentModelPrimaryValue(params.cfg?.agents?.defaults?.imageModel);
		if (primary?.trim()) addRaw(primary);
	}
	const imageFallbacks = require_model_input.resolveAgentModelFallbackValues(params.cfg?.agents?.defaults?.imageModel);
	for (const raw of imageFallbacks) addRaw(raw);
	return candidates;
}
function resolveImageFallbackDefaultProvider(cfg) {
	const configuredPrimary = require_model_input.resolveAgentModelPrimaryValue(cfg?.agents?.defaults?.imageModel);
	if (configuredPrimary?.trim()) {
		const resolved = require_model_selection_shared.resolveModelRefFromString({
			cfg,
			raw: configuredPrimary,
			defaultProvider: require_defaults.DEFAULT_PROVIDER,
			aliasIndex: require_model_selection_shared.buildModelAliasIndex({
				cfg: cfg ?? {},
				defaultProvider: require_defaults.DEFAULT_PROVIDER
			})
		});
		if (resolved?.ref.provider) return resolved.ref.provider;
	}
	return require_defaults.DEFAULT_PROVIDER;
}
function resolveModelCandidateChain(params) {
	const cacheKey = resolveFallbackCandidateCacheKey(params);
	if (cacheKey) {
		const cached = fallbackCandidateCache.get(cacheKey);
		if (cached) return cached.map(cloneModelCandidate);
	}
	const candidates = resolveFallbackCandidatesUncached(params);
	if (cacheKey) {
		fallbackCandidateCache.set(cacheKey, candidates.map(cloneModelCandidate));
		while (fallbackCandidateCache.size > MAX_FALLBACK_CANDIDATE_CACHE_ENTRIES) {
			const oldest = fallbackCandidateCache.keys().next();
			if (oldest.done) break;
			fallbackCandidateCache.delete(oldest.value);
		}
	}
	return candidates;
}
function cloneModelCandidate(candidate) {
	return {
		provider: candidate.provider,
		model: candidate.model
	};
}
function resolveFallbackCandidateCacheKey(params) {
	if (params.manifestPlugins) return null;
	const workspaceDir = require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	const env = process.env;
	const pluginMetadata = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		env,
		workspaceDir,
		allowWorkspaceScopedSnapshot: true
	});
	const providerLoadMetadata = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.cfg,
		env,
		workspaceDir,
		allowWorkspaceScopedSnapshot: true
	});
	if (require_providers_runtime.isPluginProvidersLoadInFlight({
		config: params.cfg,
		workspaceDir,
		env,
		...providerLoadMetadata ? { pluginMetadataSnapshot: providerLoadMetadata } : {},
		activate: false,
		bundledProviderVitestCompat: true
	})) return null;
	const registryState = require_runtime_state.getPluginRegistryState();
	return JSON.stringify({
		provider: params.provider,
		model: params.model,
		fallbacksOverride: params.fallbacksOverride,
		agentsDefaultsModel: params.cfg?.agents?.defaults?.model,
		agentsDefaultsModels: params.cfg?.agents?.defaults?.models,
		modelProviders: resolveFallbackCandidateModelProviderCacheParts(params.cfg),
		pluginControlPlane: require_current_plugin_metadata_snapshot.resolvePluginControlPlaneFingerprint({
			config: params.cfg,
			env,
			workspaceDir
		}),
		pluginMetadataFingerprint: pluginMetadata?.configFingerprint ?? null,
		pluginRegistryKey: registryState?.key ?? null,
		pluginRegistryVersion: registryState?.activeVersion ?? null,
		pluginWorkspaceDir: workspaceDir ?? null
	});
}
function resolveFallbackCandidateModelProviderCacheParts(cfg) {
	const providers = cfg?.models?.providers;
	if (!providers) return;
	return Object.entries(providers).map(([providerId, providerConfig]) => ({
		providerId,
		api: typeof providerConfig?.api === "string" ? providerConfig.api : void 0,
		models: Array.isArray(providerConfig?.models) ? providerConfig.models.map((entry) => typeof entry?.id === "string" ? entry.id : void 0).filter((id) => id !== void 0) : []
	}));
}
function resolveFallbackCandidatesUncached(params) {
	const primary = params.cfg ? require_model_selection_shared.resolveConfiguredModelRef({
		cfg: params.cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL,
		allowPluginNormalization: false,
		manifestPlugins: params.manifestPlugins
	}) : null;
	const defaultProvider = primary?.provider ?? "openrouter";
	const defaultModel = primary?.model ?? "openrouter/auto";
	const providerRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider) || defaultProvider;
	const modelRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model) || defaultModel;
	const normalizeCandidateRef = (provider, model) => require_model_selection_normalize.normalizeModelRef(provider, model, {
		allowPluginNormalization: allowPluginModelNormalizationForRef({
			cfg: params.cfg,
			provider,
			model
		}),
		manifestPlugins: params.manifestPlugins
	});
	const allowPluginModelAliases = params.cfg ? require_config_state.normalizePluginsConfig(params.cfg.plugins).enabled : true;
	const normalizedPrimary = normalizeCandidateRef(providerRaw, modelRaw);
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg ?? {},
		defaultProvider,
		allowPluginNormalization: allowPluginModelAliases,
		manifestPlugins: params.manifestPlugins
	});
	const { candidates, addExplicitCandidate } = createModelCandidateCollector(require_model_selection_shared.buildConfiguredAllowlistKeys({
		cfg: params.cfg,
		defaultProvider,
		allowPluginNormalization: allowPluginModelAliases,
		manifestPlugins: params.manifestPlugins
	}));
	const resolvedModelAlias = require_model_selection_shared.resolveModelRefFromString({
		cfg: params.cfg,
		raw: modelRaw,
		defaultProvider: providerRaw,
		aliasIndex,
		allowPluginNormalization: allowPluginModelNormalizationForRef({
			cfg: params.cfg,
			provider: providerRaw,
			model: modelRaw
		}),
		manifestPlugins: params.manifestPlugins
	});
	const resolvedProviderModelAlias = require_model_selection_shared.resolveModelRefFromString({
		cfg: params.cfg,
		raw: `${providerRaw}/${modelRaw}`,
		defaultProvider,
		aliasIndex,
		allowPluginNormalization: allowPluginModelNormalizationForRef({
			cfg: params.cfg,
			provider: providerRaw,
			model: modelRaw
		}),
		manifestPlugins: params.manifestPlugins
	});
	const resolvedBareModelAlias = resolvedModelAlias?.alias && (resolvedModelAlias.ref.provider === normalizedPrimary.provider || normalizedPrimary.provider === defaultProvider) ? resolvedModelAlias.ref : null;
	const resolvedPrimary = (resolvedProviderModelAlias?.alias ? resolvedProviderModelAlias.ref : null) ?? resolvedBareModelAlias ?? normalizedPrimary;
	addExplicitCandidate(normalizeCandidateRef(resolvedPrimary.provider, resolvedPrimary.model));
	const modelFallbacks = params.fallbacksOverride !== void 0 ? params.fallbacksOverride : require_model_input.resolveAgentModelFallbackValues(params.cfg?.agents?.defaults?.model);
	for (const raw of modelFallbacks) {
		const resolved = require_model_selection_shared.resolveModelRefFromString({
			cfg: params.cfg,
			raw,
			defaultProvider,
			aliasIndex,
			allowPluginNormalization: allowPluginModelAliases,
			manifestPlugins: params.manifestPlugins
		});
		if (!resolved) continue;
		addExplicitCandidate(normalizeCandidateRef(resolved.ref.provider, resolved.ref.model));
	}
	if (params.fallbacksOverride === void 0 && primary?.provider && primary.model) addExplicitCandidate(normalizeCandidateRef(primary.provider, primary.model));
	return candidates;
}
const lastProbeAttempt = /* @__PURE__ */ new Map();
const MIN_PROBE_INTERVAL_MS = 3e4;
const PROBE_MARGIN_MS = 120 * 1e3;
const PROBE_SCOPE_DELIMITER = "::";
const PROBE_STATE_TTL_MS = 1440 * 60 * 1e3;
const MAX_PROBE_KEYS = 256;
function resolveProbeThrottleKey(provider, agentDir) {
	const scope = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentDir) ?? "";
	return scope ? `${scope}${PROBE_SCOPE_DELIMITER}${provider}` : provider;
}
function pruneProbeState(now) {
	for (const [key, ts] of lastProbeAttempt) if (!Number.isFinite(ts) || ts <= 0 || now - ts > PROBE_STATE_TTL_MS) lastProbeAttempt.delete(key);
}
function enforceProbeStateCap() {
	while (lastProbeAttempt.size > MAX_PROBE_KEYS) {
		let oldestKey = null;
		let oldestTs = Number.POSITIVE_INFINITY;
		for (const [key, ts] of lastProbeAttempt) if (ts < oldestTs) {
			oldestKey = key;
			oldestTs = ts;
		}
		if (!oldestKey) break;
		lastProbeAttempt.delete(oldestKey);
	}
}
function isProbeThrottleOpen(now, throttleKey) {
	pruneProbeState(now);
	return now - (lastProbeAttempt.get(throttleKey) ?? 0) >= MIN_PROBE_INTERVAL_MS;
}
function markProbeAttempt(now, throttleKey) {
	pruneProbeState(now);
	lastProbeAttempt.set(throttleKey, now);
	enforceProbeStateCap();
}
function hasActiveProviderRateLimitResetWindow(params) {
	return params.profileIds.some((profileId) => {
		const stats = params.authStore.usageStats?.[profileId];
		if (!stats) return false;
		if (!require_usage_state.isActiveUnusableWindow(stats.blockedUntil, params.now)) return false;
		if (stats.blockedReason !== "subscription_limit" || !stats.blockedSource) return false;
		return !stats.blockedModel || stats.blockedModel === params.model;
	});
}
function shouldProbePrimaryDuringCooldown(params) {
	if (!params.isPrimary) return false;
	if (!isProbeThrottleOpen(params.now, params.throttleKey)) return false;
	if (!params.hasFallbackCandidates) return true;
	const soonest = params.authRuntime.getSoonestCooldownExpiry(params.authStore, params.profileIds, {
		now: params.now,
		forModel: params.model
	});
	if (params.reason === "rate_limit" && !hasActiveProviderRateLimitResetWindow({
		authStore: params.authStore,
		profileIds: params.profileIds,
		now: params.now,
		model: params.model
	})) return true;
	if (soonest === null || !Number.isFinite(soonest)) return true;
	return params.now >= soonest - PROBE_MARGIN_MS;
}
function resolveCooldownDecision(params) {
	const inferredReason = params.authRuntime.resolveProfilesUnavailableReason({
		store: params.authStore,
		profileIds: params.profileIds,
		now: params.now
	}) ?? "unknown";
	const shouldProbe = shouldProbePrimaryDuringCooldown({
		isPrimary: params.isPrimary,
		hasFallbackCandidates: params.hasFallbackCandidates,
		reason: inferredReason,
		now: params.now,
		throttleKey: params.probeThrottleKey,
		authRuntime: params.authRuntime,
		authStore: params.authStore,
		profileIds: params.profileIds,
		model: params.candidate.model
	});
	if (inferredReason === "auth" || inferredReason === "auth_permanent") return {
		type: "skip",
		reason: inferredReason,
		error: `Provider ${params.candidate.provider} has ${inferredReason} issue (skipping all models)`
	};
	if (inferredReason === "billing") {
		if (params.isPrimary && shouldProbe) return {
			type: "attempt",
			reason: inferredReason,
			markProbe: true
		};
		return {
			type: "suspend_lanes",
			reason: inferredReason,
			leaderCandidate: params.candidate
		};
	}
	if (!(params.isPrimary && (!params.requestedModel || shouldProbe) || !params.isPrimary && shouldUseTransientCooldownProbeSlot(inferredReason))) return {
		type: "suspend_lanes",
		reason: inferredReason,
		leaderCandidate: params.candidate
	};
	return {
		type: "attempt",
		reason: inferredReason,
		markProbe: params.isPrimary && shouldProbe
	};
}
function flushDeferredSessionSuspension(state) {
	const pending = state.pending;
	if (!pending) return;
	state.pending = void 0;
	require_session_suspension.suspendSession(pending);
}
function shouldDiscardDeferredSessionSuspension(params) {
	return isTerminalAbort(params.abortSignal) || isCallerAbortSignal(params.abortSignal) || require_run_termination.isAgentRunDirectAbortReason(params.error) || require_run_termination.isAgentRunRestartAbortReason(params.error) || isTerminalAbortFromError(params.error) || require_command_queue.isCommandLaneTaskTimeoutError(params.error) || require_failover_error.isNonProviderRuntimeCoordinationError(params.error) || isTranscriptNotContinuableError(params.error) || require_errors$1.isLikelyContextOverflowError(require_errors.formatErrorMessage(params.error));
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.modelFallbackTestApi")] = {
	resolveCooldownDecision,
	shouldDiscardDeferredSessionSuspension
};
async function runWithModelFallback(params) {
	const deferredSuspension = {};
	try {
		const result = await runWithModelFallbackInternal(params, deferredSuspension);
		if (result.outcome === "exhausted") flushDeferredSessionSuspension(deferredSuspension);
		return result;
	} catch (err) {
		if (!shouldDiscardDeferredSessionSuspension({
			error: err,
			abortSignal: params.abortSignal
		})) flushDeferredSessionSuspension(deferredSuspension);
		throw err;
	}
}
async function runWithModelFallbackInternal(params, deferredSuspension) {
	const candidates = resolveModelCandidateChain({
		cfg: params.cfg,
		provider: params.provider,
		model: params.model,
		fallbacksOverride: params.fallbacksOverride,
		manifestPlugins: params.manifestPlugins
	});
	const authRuntime = !params.skipAuthProfileRuntime && params.cfg && require_source_check.hasAnyAuthProfileStoreSource(params.agentDir) ? await loadModelFallbackAuthRuntime() : null;
	const authStore = authRuntime ? authRuntime.ensureAuthProfileStore(params.agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForProviders({
		cfg: params.cfg,
		providers: candidates.map((candidate) => candidate.provider)
	}) }) : null;
	const attempts = [];
	let lastError;
	let latestClassifiedResult;
	let exhaustionResult;
	const cooldownProbeUsedProviders = /* @__PURE__ */ new Set();
	const resolveTerminalSuspensionLane = () => deferredSuspension.pending ? deferredSuspension.pending.laneId : params.lane;
	const observeDecision = async (decision) => {
		if (!params.onFallbackStep && !isModelFallbackDecisionLogEnabled()) return;
		const fallbackStep = logModelFallbackDecision(decision);
		if (fallbackStep) await params.onFallbackStep?.(fallbackStep);
	};
	const observeFailedCandidate = async (failedAttempt) => {
		if (!params.onFallbackStep && !isModelFallbackDecisionLogEnabled()) appendFailedCandidateAttempt(failedAttempt);
		else {
			const fallbackStep = recordFailedCandidateAttempt(failedAttempt);
			if (fallbackStep) await params.onFallbackStep?.(fallbackStep);
		}
		if (params.sessionId && failedAttempt.nextCandidate) {
			const described = require_failover_error.describeFailoverError(failedAttempt.error);
			require_diagnostic_events.emitFailoverEvent({
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				lane: params.lane,
				fromProvider: failedAttempt.candidate.provider,
				fromModel: failedAttempt.candidate.model,
				toProvider: failedAttempt.nextCandidate.provider,
				toModel: failedAttempt.nextCandidate.model,
				reason: described.reason ?? "unknown",
				cascadeDepth: failedAttempt.attempt - 1,
				suspended: false
			});
		}
	};
	const hasFallbackCandidates = candidates.length > 1;
	const requestedCandidate = candidates[0];
	for (let i = 0; i < candidates.length; i += 1) {
		const candidate = candidates.at(i);
		if (!candidate) throw new Error(`Missing model fallback candidate at index ${i}`);
		const candidateHarnessAuth = await resolveModelFallbackCandidateHarnessAuthPrecheck({
			cfg: params.cfg,
			agentId: params.agentId,
			sessionKey: params.sessionKey,
			resolveAgentHarnessRuntimeOverride: params.resolveAgentHarnessRuntimeOverride,
			prepareAgentHarnessRuntime: params.prepareAgentHarnessRuntime,
			...candidate
		});
		const isPrimary = i === 0;
		const requestedModel = requestedCandidate ? sameModelCandidate(candidate, requestedCandidate) : false;
		if (!isPrimary && params.sessionId) {
			if (isFallbackCandidateSkipped({
				sessionId: params.sessionId,
				provider: candidate.provider,
				model: candidate.model
			})) {
				const skipReason = getFallbackCandidateSkipReason({
					sessionId: params.sessionId,
					provider: candidate.provider,
					model: candidate.model
				}) ?? "auth";
				const reauthCommand = require_failover_error.buildProviderReauthCommand(candidate.provider);
				const reauthHint = reauthCommand ? `run \`${reauthCommand}\` to re-authenticate` : "re-authenticate that provider";
				const error = `Skipping ${candidate.provider}/${candidate.model}: recent ${skipReason} failure in this session (${reauthHint})`;
				attempts.push({
					provider: candidate.provider,
					model: candidate.model,
					error,
					reason: skipReason
				});
				await observeDecision({
					decision: "skip_candidate",
					runId: params.runId,
					sessionId: params.sessionId,
					lane: params.lane,
					requestedProvider: params.provider,
					requestedModel: params.model,
					candidate,
					attempt: i + 1,
					total: candidates.length,
					reason: skipReason,
					error,
					nextCandidate: candidates[i + 1],
					isPrimary,
					requestedModelMatched: requestedModel,
					fallbackConfigured: hasFallbackCandidates
				});
				continue;
			}
		}
		let runOptions;
		let attemptedDuringCooldown = false;
		let transientProbeProviderForAttempt = null;
		if (authRuntime && authStore && !candidateHarnessAuth.skipsProviderAuthCooldown) {
			const profileIds = authRuntime.resolveAuthProfileOrder({
				cfg: params.cfg,
				store: authStore,
				provider: candidate.provider
			});
			authRuntime.maybeReprobeWhamBlockedProfiles({
				store: authStore,
				profileIds,
				agentDir: params.agentDir,
				forModel: candidate.model
			});
			const isAnyProfileAvailable = profileIds.some((id) => !authRuntime.isProfileInCooldown(authStore, id, void 0, candidate.model));
			if (profileIds.length > 0 && !isAnyProfileAvailable) {
				const now = Date.now();
				const probeThrottleKey = resolveProbeThrottleKey(candidate.provider, params.agentDir);
				const decision = resolveCooldownDecision({
					candidate,
					isPrimary,
					requestedModel,
					hasFallbackCandidates,
					now,
					probeThrottleKey,
					authRuntime,
					authStore,
					profileIds
				});
				const authMode = decision.reason === "billing" ? require_profile_list.resolveSubscriptionAuthModeForProfiles({
					store: authStore,
					profileIds
				}) : void 0;
				if (decision.type === "suspend_lanes") {
					const error = `Provider ${candidate.provider} is in cooldown (suspending lanes)`;
					attempts.push({
						provider: candidate.provider,
						model: candidate.model,
						error,
						reason: decision.reason,
						authMode
					});
					const hasRemainingCandidates = i + 1 < candidates.length;
					if (params.sessionId) {
						require_diagnostic_events.emitFailoverEvent({
							sessionId: params.sessionId,
							lane: params.lane,
							fromProvider: candidate.provider,
							fromModel: candidate.model,
							reason: decision.reason,
							suspended: !hasRemainingCandidates
						});
						if (!hasRemainingCandidates) {
							const laneId = resolveTerminalSuspensionLane();
							deferredSuspension.pending = void 0;
							require_session_suspension.suspendSession({
								cfg: params.cfg,
								agentDir: params.agentDir,
								sessionId: params.sessionId,
								laneId,
								reason: require_session_suspension.resolveSessionSuspensionReason(decision.reason),
								failedProvider: candidate.provider,
								failedModel: candidate.model
							});
						}
					}
					await observeDecision({
						decision: "skip_candidate",
						runId: params.runId,
						sessionId: params.sessionId,
						lane: params.lane,
						requestedProvider: params.provider,
						requestedModel: params.model,
						candidate,
						attempt: i + 1,
						total: candidates.length,
						reason: decision.reason,
						error,
						nextCandidate: candidates[i + 1],
						isPrimary,
						requestedModelMatched: requestedModel,
						fallbackConfigured: hasFallbackCandidates,
						profileCount: profileIds.length
					});
					continue;
				}
				if (decision.type === "skip") {
					attempts.push({
						provider: candidate.provider,
						model: candidate.model,
						error: decision.error,
						reason: decision.reason,
						authMode
					});
					await observeDecision({
						decision: "skip_candidate",
						runId: params.runId,
						sessionId: params.sessionId,
						lane: params.lane,
						requestedProvider: params.provider,
						requestedModel: params.model,
						candidate,
						attempt: i + 1,
						total: candidates.length,
						reason: decision.reason,
						error: decision.error,
						nextCandidate: candidates[i + 1],
						isPrimary,
						requestedModelMatched: requestedModel,
						fallbackConfigured: hasFallbackCandidates,
						profileCount: profileIds.length
					});
					continue;
				}
				if (decision.markProbe) markProbeAttempt(now, probeThrottleKey);
				if (shouldAllowCooldownProbeForReason(decision.reason)) {
					const isTransientCooldownReason = shouldUseTransientCooldownProbeSlot(decision.reason);
					if (isTransientCooldownReason && cooldownProbeUsedProviders.has(candidate.provider)) {
						const error = `Provider ${candidate.provider} is in cooldown (probe already attempted this run)`;
						attempts.push({
							provider: candidate.provider,
							model: candidate.model,
							error,
							reason: decision.reason,
							authMode
						});
						await observeDecision({
							decision: "skip_candidate",
							runId: params.runId,
							sessionId: params.sessionId,
							lane: params.lane,
							requestedProvider: params.provider,
							requestedModel: params.model,
							candidate,
							attempt: i + 1,
							total: candidates.length,
							reason: decision.reason,
							error,
							nextCandidate: candidates[i + 1],
							isPrimary,
							requestedModelMatched: requestedModel,
							fallbackConfigured: hasFallbackCandidates,
							profileCount: profileIds.length
						});
						continue;
					}
					runOptions = { allowTransientCooldownProbe: true };
					if (isTransientCooldownReason) transientProbeProviderForAttempt = candidate.provider;
				}
				attemptedDuringCooldown = true;
				await observeDecision({
					decision: "probe_cooldown_candidate",
					runId: params.runId,
					sessionId: params.sessionId,
					lane: params.lane,
					requestedProvider: params.provider,
					requestedModel: params.model,
					candidate,
					attempt: i + 1,
					total: candidates.length,
					reason: decision.reason,
					nextCandidate: candidates[i + 1],
					isPrimary,
					requestedModelMatched: requestedModel,
					fallbackConfigured: hasFallbackCandidates,
					allowTransientCooldownProbe: runOptions?.allowTransientCooldownProbe,
					profileCount: profileIds.length
				});
			}
		}
		const attemptRun = await runFallbackAttempt({
			run: params.run,
			...candidate,
			attempts,
			options: {
				...runOptions,
				isFinalFallbackAttempt: i + 1 === candidates.length
			},
			deferSessionSuspension: i + 1 < candidates.length,
			onDeferredSessionSuspension: (suspension) => {
				deferredSuspension.pending = suspension;
			},
			classifyResult: params.classifyResult,
			attempt: i + 1,
			total: candidates.length,
			attribution: {
				sessionId: params.sessionId,
				lane: params.lane
			},
			abortSignal: params.abortSignal
		});
		if ("success" in attemptRun) {
			if (i > 0 || attempts.length > 0 || attemptedDuringCooldown) await observeDecision({
				decision: "candidate_succeeded",
				runId: params.runId,
				sessionId: params.sessionId,
				lane: params.lane,
				requestedProvider: params.provider,
				requestedModel: params.model,
				candidate,
				attempt: i + 1,
				total: candidates.length,
				previousAttempts: attempts,
				isPrimary,
				requestedModelMatched: requestedModel,
				fallbackConfigured: hasFallbackCandidates
			});
			const notFoundAttempt = i > 0 ? attempts.find((a) => a.reason === "model_not_found") : void 0;
			if (notFoundAttempt) log.warn(`Model "${require_ansi.sanitizeForLog(notFoundAttempt.provider)}/${require_ansi.sanitizeForLog(notFoundAttempt.model)}" not found. Fell back to "${require_ansi.sanitizeForLog(candidate.provider)}/${require_ansi.sanitizeForLog(candidate.model)}".`);
			return attemptRun.success;
		}
		const err = attemptRun.error;
		if (require_failover_error.findCliMaxTurnsError(err)) throw err;
		if (!attemptRun.classifiedResult && params.canFallbackAfterError && !await params.canFallbackAfterError({
			provider: candidate.provider,
			model: candidate.model,
			error: err,
			attempt: i + 1,
			total: candidates.length
		})) throw err;
		if (attemptRun.classifiedResult) latestClassifiedResult = attemptRun.classifiedResult;
		if (attemptRun.exhaustionResult && (!exhaustionResult || attemptRun.exhaustionResult.priority >= exhaustionResult.priority)) exhaustionResult = attemptRun.exhaustionResult;
		{
			if (require_failover_error.isNonProviderRuntimeCoordinationError(err)) throw err;
			if (isTranscriptNotContinuableError(err)) throw err;
			if (transientProbeProviderForAttempt) {
				const probeFailureReason = require_failover_error.describeFailoverError(err).reason;
				if (!shouldPreserveTransientCooldownProbeSlot(probeFailureReason)) cooldownProbeUsedProviders.add(transientProbeProviderForAttempt);
			}
			if (require_errors$1.isLikelyContextOverflowError(require_errors.formatErrorMessage(err))) throw err;
			if (isMissingAgentHarnessError(err)) throw err;
			const normalized = require_failover_error.coerceToFailoverError(err, {
				provider: candidate.provider,
				model: candidate.model,
				sessionId: params.sessionId,
				lane: params.lane
			}) ?? err;
			if (err instanceof LiveSessionModelSwitchError) {
				if (hasDifferentLiveSessionRuntimeSelection({
					error: err,
					currentAgentHarnessRuntimeOverride: candidateHarnessAuth.agentHarnessRuntimeOverride
				})) throw err;
				const liveSwitchTargetIndex = findLiveSessionModelSwitchRedirectIndex({
					error: err,
					candidates,
					currentIndex: i
				});
				if (liveSwitchTargetIndex !== null) {
					i = liveSwitchTargetIndex - 1;
					continue;
				}
				const switchMsg = err.message;
				const switchNormalized = new require_failover_error.FailoverError(switchMsg, {
					reason: "unknown",
					provider: candidate.provider,
					model: candidate.model,
					sessionId: params.sessionId,
					lane: params.lane
				});
				lastError = switchNormalized;
				await observeFailedCandidate({
					attempts,
					candidate,
					error: switchNormalized,
					runId: params.runId,
					sessionId: params.sessionId,
					lane: params.lane,
					requestedProvider: params.provider,
					requestedModel: params.model,
					attempt: i + 1,
					total: candidates.length,
					nextCandidate: candidates[i + 1],
					isPrimary,
					requestedModelMatched: requestedModel,
					fallbackConfigured: hasFallbackCandidates
				});
				continue;
			}
			const isKnownFailover = require_failover_error.isFailoverError(normalized);
			if (!isKnownFailover && i === candidates.length - 1) throw err;
			if (isKnownFailover && !isPrimary && params.sessionId && (normalized.reason === "auth" || normalized.reason === "auth_permanent")) markFallbackCandidateSkipped({
				sessionId: params.sessionId,
				provider: candidate.provider,
				model: candidate.model,
				reason: normalized.reason
			});
			lastError = isKnownFailover ? normalized : err;
			await observeFailedCandidate({
				attempts,
				candidate,
				error: normalized,
				runId: params.runId,
				sessionId: params.sessionId,
				lane: params.lane,
				requestedProvider: params.provider,
				requestedModel: params.model,
				attempt: i + 1,
				total: candidates.length,
				nextCandidate: candidates[i + 1],
				isPrimary,
				requestedModelMatched: requestedModel,
				fallbackConfigured: hasFallbackCandidates
			});
			await params.onError?.({
				provider: candidate.provider,
				model: candidate.model,
				error: isKnownFailover ? normalized : err,
				attempt: i + 1,
				total: candidates.length
			});
		}
	}
	if (exhaustionResult) {
		if (latestClassifiedResult && params.mergeExhaustedResult) return {
			outcome: "exhausted",
			result: params.mergeExhaustedResult({
				latestResult: latestClassifiedResult.result,
				preferredResult: exhaustionResult.result
			}),
			provider: latestClassifiedResult.provider,
			model: latestClassifiedResult.model,
			attempts
		};
		return {
			outcome: "exhausted",
			result: exhaustionResult.result,
			provider: exhaustionResult.provider,
			model: exhaustionResult.model,
			attempts
		};
	}
	return throwFallbackFailureSummary({
		attempts,
		candidates,
		lastError,
		label: "models",
		formatAttempt: (attempt) => `${attempt.provider}/${attempt.model}: ${attempt.error}${attempt.reason ? ` (${attempt.reason})` : ""}`,
		soonestCooldownExpiry: resolveFallbackSoonestCooldownExpiry({
			authRuntime,
			authStore,
			agentDir: params.agentDir,
			cfg: params.cfg,
			candidates
		}),
		attribution: {
			sessionId: params.sessionId,
			lane: resolveTerminalSuspensionLane()
		},
		cfg: params.cfg,
		agentDir: params.agentDir
	});
}
async function runWithImageModelFallback(params) {
	const candidates = resolveImageFallbackCandidates({
		cfg: params.cfg,
		defaultProvider: resolveImageFallbackDefaultProvider(params.cfg),
		modelOverride: params.modelOverride
	});
	if (candidates.length === 0) throw new Error("No image model configured. Set agents.defaults.imageModel.primary or agents.defaults.imageModel.fallbacks.");
	const attempts = [];
	let lastError;
	for (const [i, candidate] of candidates.entries()) {
		const attemptRun = await runFallbackAttempt({
			run: params.run,
			...candidate,
			attempts,
			attempt: i + 1,
			total: candidates.length
		});
		if ("success" in attemptRun) return attemptRun.success;
		{
			const err = attemptRun.error;
			lastError = err;
			attempts.push({
				provider: candidate.provider,
				model: candidate.model,
				error: require_errors.formatErrorMessage(err)
			});
			await params.onError?.({
				provider: candidate.provider,
				model: candidate.model,
				error: err,
				attempt: i + 1,
				total: candidates.length
			});
		}
	}
	return throwFallbackFailureSummary({
		attempts,
		candidates,
		lastError,
		label: "image models",
		formatAttempt: (attempt) => `${attempt.provider}/${attempt.model}: ${attempt.error}`,
		cfg: params.cfg
	});
}
//#endregion
Object.defineProperty(exports, "LiveSessionModelSwitchError", {
	enumerable: true,
	get: function() {
		return LiveSessionModelSwitchError;
	}
});
Object.defineProperty(exports, "MissingAgentHarnessError", {
	enumerable: true,
	get: function() {
		return MissingAgentHarnessError;
	}
});
Object.defineProperty(exports, "abortErrorMessage", {
	enumerable: true,
	get: function() {
		return abortErrorMessage;
	}
});
Object.defineProperty(exports, "abortable", {
	enumerable: true,
	get: function() {
		return abortable;
	}
});
Object.defineProperty(exports, "buildApiErrorObservationFields", {
	enumerable: true,
	get: function() {
		return buildApiErrorObservationFields;
	}
});
Object.defineProperty(exports, "buildTextObservationFields", {
	enumerable: true,
	get: function() {
		return buildTextObservationFields;
	}
});
Object.defineProperty(exports, "isFallbackSummaryError", {
	enumerable: true,
	get: function() {
		return isFallbackSummaryError;
	}
});
Object.defineProperty(exports, "isSetupTimeoutErrorText", {
	enumerable: true,
	get: function() {
		return isSetupTimeoutErrorText;
	}
});
Object.defineProperty(exports, "normalizeCronRunErrorText", {
	enumerable: true,
	get: function() {
		return normalizeCronRunErrorText;
	}
});
Object.defineProperty(exports, "preExecutionTimeoutErrorMessage", {
	enumerable: true,
	get: function() {
		return preExecutionTimeoutErrorMessage;
	}
});
Object.defineProperty(exports, "resolveCronAbortReasonText", {
	enumerable: true,
	get: function() {
		return resolveCronAbortReasonText;
	}
});
Object.defineProperty(exports, "resolveImageFallbackCandidates", {
	enumerable: true,
	get: function() {
		return resolveImageFallbackCandidates;
	}
});
Object.defineProperty(exports, "resolveImageFallbackDefaultProvider", {
	enumerable: true,
	get: function() {
		return resolveImageFallbackDefaultProvider;
	}
});
Object.defineProperty(exports, "resolveModelCandidateChain", {
	enumerable: true,
	get: function() {
		return resolveModelCandidateChain;
	}
});
Object.defineProperty(exports, "runWithImageModelFallback", {
	enumerable: true,
	get: function() {
		return runWithImageModelFallback;
	}
});
Object.defineProperty(exports, "runWithModelFallback", {
	enumerable: true,
	get: function() {
		return runWithModelFallback;
	}
});
Object.defineProperty(exports, "setupTimeoutErrorMessage", {
	enumerable: true,
	get: function() {
		return setupTimeoutErrorMessage;
	}
});
Object.defineProperty(exports, "shouldSuppressRawErrorConsoleSuffix", {
	enumerable: true,
	get: function() {
		return shouldSuppressRawErrorConsoleSuffix;
	}
});
Object.defineProperty(exports, "shouldUseTransientCooldownProbeSlot", {
	enumerable: true,
	get: function() {
		return shouldUseTransientCooldownProbeSlot;
	}
});
Object.defineProperty(exports, "timeoutErrorMessage", {
	enumerable: true,
	get: function() {
		return timeoutErrorMessage;
	}
});
