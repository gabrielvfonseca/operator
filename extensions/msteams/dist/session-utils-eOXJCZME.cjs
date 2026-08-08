const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_runtime_workspace_state = require("./runtime-workspace-state-C4MmR84x.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_identity_avatar_file = require("./identity-avatar-file-Cw3zle5k.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_model_thinking_default = require("./model-thinking-default-3L3oHDLO.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_delivery_context_shared = require("./delivery-context.shared-E1kLe5ub.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
const require_model_selection_cli = require("./model-selection-cli-PCHB2Ve6.cjs");
const require_model_selection = require("./model-selection-BvFurMxy.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_session_target = require("./session-target-DT_L-Jst.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_agent_runtime_metadata = require("./agent-runtime-metadata-DAHq7Kgy.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
require("./model-catalog-BFgB2-Jk.cjs");
const require_session_model_ref = require("./session-model-ref-DUZbU68I.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_session_transcript_files_fs = require("./session-transcript-files.fs-DYt0TgFR.cjs");
const require_context = require("./context-Ddgh80NW.cjs");
const require_fast_mode = require("./fast-mode-0YvHCt-K.cjs");
const require_subagent_run_liveness = require("./subagent-run-liveness-DmyqOa7r.cjs");
const require_subagent_registry_read = require("./subagent-registry-read-LeoF2Gsl.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
const require_git = require("./git-BqcKnCbx.cjs");
const require_usage_format = require("./usage-format-Ed9eVdJX.cjs");
const require_agent_list = require("./agent-list-C2uJTQ1H.cjs");
const require_session_key$1 = require("./session-key-CB-VWyPJ.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/cron/job-session-bindings.ts
/**
* Resolves every canonical session key a job is bound to: the session the run
* joins (main/isolated/session:<key>) plus the explicit wake/delivery lane in
* job.sessionKey. Keys use the same canonicalization as cron run/session
* creation, so they compare equal to gateway session-store row keys.
*/
function resolveCronJobBoundSessionKeys(job, opts) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(job.agentId ?? opts.defaultAgentId);
	const keys = /* @__PURE__ */ new Set();
	const add = (sessionKey) => {
		const trimmed = sessionKey?.trim();
		if (!trimmed) return;
		keys.add(require_session_key$1.resolveCronAgentSessionKey({
			sessionKey: trimmed,
			agentId,
			mainKey: opts.cfg.session?.mainKey,
			cfg: opts.cfg
		}));
	};
	try {
		if (job.sessionTarget === "main") add("main");
		else if (job.sessionTarget === "isolated" || job.sessionTarget === "current") add(`cron:${job.id}`);
		else add(require_session_target.resolveCronSessionTargetSessionKey(job.sessionTarget));
		add(job.sessionKey);
	} catch {
		keys.clear();
	}
	return keys;
}
/** Signals a locked re-check found the job no longer bound; a per-job no-op. */
var CronJobBindingStaleError = class extends Error {
	constructor() {
		super("cron job binding changed concurrently");
	}
};
/**
* Disables every enabled cron job bound to a session, used when the session is
* archived so schedules stop targeting a lane that rejects new work.
* Returns the disabled job ids.
*/
async function disableCronJobsBoundToSession(params) {
	const jobs = await params.cron.list();
	const defaultAgentId = params.cron.getDefaultAgentId();
	const boundToSession = (job) => job.enabled && resolveCronJobBoundSessionKeys(job, {
		cfg: params.cfg,
		defaultAgentId
	}).has(params.sessionKey);
	const disabled = [];
	const failures = [];
	for (const job of jobs) {
		if (!boundToSession(job)) continue;
		try {
			await params.cron.updateWithPrecondition(job.id, { enabled: false }, (currentJob) => {
				if (!boundToSession(currentJob)) throw new CronJobBindingStaleError();
			});
			disabled.push(job.id);
		} catch (error) {
			if (error instanceof CronJobBindingStaleError) continue;
			failures.push(error);
		}
	}
	if (failures.length > 0) throw new AggregateError(failures, `failed to disable ${failures.length} cron job(s) bound to ${params.sessionKey}`);
	return disabled;
}
//#endregion
//#region src/gateway/session-automation-index.ts
let source = null;
let sourceVersion = 0;
let epochCounter = 0;
let registeredEpoch = 0;
let memo = null;
/**
* Claimed at cron service build time so registration authority follows build
* order: a stale service whose start resolves after a config reload cannot
* clobber the replacement's registration.
*/
function claimSessionAutomationEpoch() {
	return ++epochCounter;
}
/** Registered by the gateway cron owner; newer epochs win over stale services. */
function registerSessionAutomationSource(next, epoch) {
	const effectiveEpoch = epoch ?? claimSessionAutomationEpoch();
	if (effectiveEpoch < registeredEpoch) return;
	registeredEpoch = effectiveEpoch;
	source = next;
	memo = null;
	sourceVersion += 1;
}
/**
* Owner-compare unregistration: a stopped cron service must not clear a
* replacement's registration when config reloads race the lazy service build.
*/
function unregisterSessionAutomationSource(owner) {
	if (source !== owner) return;
	source = null;
	memo = null;
	sourceVersion += 1;
}
/** Called from the cron onEvent hook after any job/store change. */
function bumpSessionAutomationVersion() {
	sourceVersion += 1;
}
function buildAutomationKeys(jobs, cfg, defaultAgentId) {
	const keys = /* @__PURE__ */ new Set();
	for (const job of jobs) {
		if (!job.enabled) continue;
		for (const key of resolveCronJobBoundSessionKeys(job, {
			cfg,
			defaultAgentId
		})) keys.add(key);
	}
	return keys;
}
/** True when an enabled cron job is bound to the canonical session key. */
function sessionHasAutomation(sessionKey, cfg) {
	const jobs = source?.getJobs();
	if (!source || !jobs || jobs.length === 0) return false;
	if (!memo || memo.jobs !== jobs || memo.version !== sourceVersion || memo.cfg !== cfg) memo = {
		jobs,
		version: sourceVersion,
		cfg,
		keys: buildAutomationKeys(jobs, cfg, source.getDefaultAgentId())
	};
	return memo.keys.has(sessionKey);
}
//#endregion
//#region src/gateway/session-list-order.ts
const SESSIONS_LIST_TOP_N_LIMIT = 200;
function compareSessionEntryPairs(a, b, sortBy = "updatedAt") {
	if (sortBy !== "lastInteractionAt") {
		const aPinnedAt = a[1]?.pinnedAt ?? 0;
		const bPinnedAt = b[1]?.pinnedAt ?? 0;
		if (aPinnedAt !== bPinnedAt) return bPinnedAt - aPinnedAt;
	}
	const aTimestamp = sortBy === "lastInteractionAt" ? a[1]?.lastInteractionAt : a[1]?.updatedAt;
	const byTimestamp = ((sortBy === "lastInteractionAt" ? b[1]?.lastInteractionAt : b[1]?.updatedAt) ?? 0) - (aTimestamp ?? 0);
	if (byTimestamp !== 0) return byTimestamp;
	return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
}
function selectNewestLimitedEntries(entries, limit, sortBy) {
	const selected = [];
	for (const entry of entries) {
		const insertAt = selected.findIndex((candidate) => compareSessionEntryPairs(entry, candidate, sortBy) < 0);
		if (insertAt >= 0) {
			selected.splice(insertAt, 0, entry);
			if (selected.length > limit) selected.pop();
		} else if (selected.length < limit) selected.push(entry);
	}
	return selected;
}
function sortAndLimitSessionEntries(entries, limit, sortBy) {
	if (limit !== void 0 && limit <= SESSIONS_LIST_TOP_N_LIMIT) return selectNewestLimitedEntries(entries, limit, sortBy);
	const sorted = entries.toSorted((a, b) => compareSessionEntryPairs(a, b, sortBy));
	return limit === void 0 ? sorted : sorted.slice(0, limit);
}
//#endregion
//#region src/gateway/session-utils.ts
var session_utils_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildGatewaySessionInfo: () => buildGatewaySessionInfo,
	buildGatewaySessionRow: () => buildGatewaySessionRow,
	canonicalizeSpawnedByForAgent: () => require_session_accessor.canonicalizeSpawnedByForAgent,
	deriveSessionTitle: () => deriveSessionTitle,
	filterAndSortSessionEntries: () => filterAndSortSessionEntries,
	getSessionDefaults: () => getSessionDefaults,
	listAgentsForGateway: () => listAgentsForGateway,
	listSessionsFromStore: () => listSessionsFromStore,
	listSessionsFromStoreAsync: () => listSessionsFromStoreAsync,
	loadCombinedSessionStoreForGateway: () => require_sessions.loadCombinedSessionStoreForGateway,
	loadGatewaySessionRow: () => loadGatewaySessionRow,
	loadSessionEntry: () => loadSessionEntry,
	migrateAndPruneGatewaySessionStoreKey: () => migrateAndPruneGatewaySessionStoreKey,
	resolveDeletedAgentIdFromSessionKey: () => resolveDeletedAgentIdFromSessionKey,
	resolveFreshestSessionEntryFromStoreKeys: () => resolveFreshestSessionEntryFromStoreKeys,
	resolveGatewayModelSupportsImages: () => resolveGatewayModelSupportsImages,
	resolveGatewaySessionStoreTarget: () => resolveGatewaySessionStoreTarget,
	resolveGatewaySessionStoreTargetWithStore: () => resolveGatewaySessionStoreTargetWithStore,
	resolveGatewaySessionThinkingProjection: () => resolveGatewaySessionThinkingProjection,
	resolveSessionDisplayModelIdentityRef: () => resolveSessionDisplayModelIdentityRef,
	resolveSessionHistoryTranscriptPathAsync: () => require_session_transcript_readers.resolveSessionHistoryTranscriptPathAsync,
	resolveSessionModelRef: () => require_session_model_ref.resolveSessionModelRef,
	resolveSessionStoreKey: () => require_session_accessor.resolveSessionStoreKey,
	resolveSessionTranscriptCandidates: () => require_session_transcript_files_fs.resolveSessionTranscriptCandidates
});
const DERIVED_TITLE_MAX_LEN = 60;
function formatSessionIdPrefix(sessionId, updatedAt) {
	const prefix = sessionId.slice(0, 8);
	if (updatedAt && updatedAt > 0) return `${prefix} (${new Date(updatedAt).toISOString().slice(0, 10)})`;
	return prefix;
}
function truncateTitle(text, maxLen) {
	if (text.length <= maxLen) return text;
	const cut = (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, maxLen - 1);
	const lastSpace = cut.lastIndexOf(" ");
	if (lastSpace > maxLen * .6) return `${cut.slice(0, lastSpace)}…`;
	return `${cut}…`;
}
function deriveSessionTitle(entry, firstUserMessage) {
	if (!entry) return;
	const label = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.label);
	if (label) return label;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.displayName)) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.displayName);
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.subject)) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.subject);
	if (firstUserMessage?.trim()) return truncateTitle(firstUserMessage.replace(/\s+/g, " ").trim(), DERIVED_TITLE_MAX_LEN);
	if (entry.sessionId) return formatSessionIdPrefix(entry.sessionId, entry.updatedAt);
}
function resolveSessionRuntimeMs(run, now) {
	return require_subagent_run_liveness.getSubagentSessionRuntimeMs(run, now);
}
function resolvePositiveNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
}
function deriveSessionUnread(entry) {
	return entry?.markedUnreadAt !== void 0 || entry?.lastReadAt !== void 0 && Math.max(entry.lastInteractionAt ?? 0, entry.lastActivityAt ?? 0) > entry.lastReadAt;
}
function isProjectableCompactionCheckpoint(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const checkpoint = value;
	return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(checkpoint.checkpointId)) && typeof checkpoint.createdAt === "number" && Number.isFinite(checkpoint.createdAt) && (checkpoint.reason === "manual" || checkpoint.reason === "auto-threshold" || checkpoint.reason === "overflow-retry" || checkpoint.reason === "timeout-retry");
}
function resolveProjectableCompactionCheckpoints(entry) {
	const checkpoints = entry?.compactionCheckpoints;
	if (!Array.isArray(checkpoints) || checkpoints.length === 0) return [];
	return checkpoints.filter(isProjectableCompactionCheckpoint);
}
function resolveLatestCompactionCheckpoint(checkpoints) {
	return checkpoints.reduce((latest, checkpoint) => !latest || checkpoint.createdAt > latest.createdAt ? checkpoint : latest, void 0);
}
function buildCompactionCheckpointPreview(checkpoint) {
	if (!checkpoint) return;
	const checkpointId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(checkpoint.checkpointId);
	const createdAt = checkpoint.createdAt;
	const reason = checkpoint.reason;
	if (!checkpointId || typeof createdAt !== "number" || !Number.isFinite(createdAt)) return;
	if (reason !== "manual" && reason !== "auto-threshold" && reason !== "overflow-retry" && reason !== "timeout-retry") return;
	return {
		checkpointId,
		createdAt,
		reason
	};
}
function resolveModelCostConfigCached(provider, model, cfg, rowContext) {
	if (!rowContext) return require_usage_format.resolveModelCostConfig({
		provider,
		model,
		config: cfg
	});
	const key = createSessionRowModelCacheKey(provider, model);
	if (rowContext.modelCostConfigByModelRef.has(key)) return rowContext.modelCostConfigByModelRef.get(key);
	const value = require_usage_format.resolveModelCostConfig({
		provider,
		model,
		config: cfg
	});
	rowContext.modelCostConfigByModelRef.set(key, value);
	return value;
}
function resolveEstimatedSessionCostUsd(params) {
	const explicitCostUsd = require_number_coercion.resolveNonNegativeNumber(params.explicitCostUsd ?? params.entry?.estimatedCostUsd);
	if (explicitCostUsd !== void 0) return explicitCostUsd;
	const input = resolvePositiveNumber(params.entry?.inputTokens);
	const output = resolvePositiveNumber(params.entry?.outputTokens);
	const cacheRead = resolvePositiveNumber(params.entry?.cacheRead);
	const cacheWrite = resolvePositiveNumber(params.entry?.cacheWrite);
	if (input === void 0 && output === void 0 && cacheRead === void 0 && cacheWrite === void 0) return;
	const cost = resolveModelCostConfigCached(params.provider, params.model, params.cfg, params.rowContext);
	if (!cost) return;
	return require_number_coercion.resolveNonNegativeNumber(require_usage_format.estimateUsageCost({
		usage: {
			...input !== void 0 ? { input } : {},
			...output !== void 0 ? { output } : {},
			...cacheRead !== void 0 ? { cacheRead } : {},
			...cacheWrite !== void 0 ? { cacheWrite } : {}
		},
		cost
	}));
}
const STALE_STORE_ONLY_CHILD_LINK_MS = 3600 * 1e3;
const SINGLE_ROW_CONTEXT_CACHE_MAX_ENTRIES = 64;
function isFinitePositiveTimestamp(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function shouldKeepStoreOnlyChildLink(entry, now) {
	if (require_store.isTerminalSessionStatus(entry.status) || isFinitePositiveTimestamp(entry.endedAt)) {
		const endedAt = isFinitePositiveTimestamp(entry.endedAt) ? entry.endedAt : entry.updatedAt;
		return isFinitePositiveTimestamp(endedAt) && now - endedAt <= 18e5;
	}
	if (entry.status === "running" || isFinitePositiveTimestamp(entry.startedAt)) return true;
	return isFinitePositiveTimestamp(entry.updatedAt) && now - entry.updatedAt <= STALE_STORE_ONLY_CHILD_LINK_MS;
}
const singleRowChildSessionCandidateCache = /* @__PURE__ */ new Map();
function rememberSingleRowChildSessionCandidateCacheEntry(storePath, entry) {
	if (singleRowChildSessionCandidateCache.has(storePath)) singleRowChildSessionCandidateCache.delete(storePath);
	singleRowChildSessionCandidateCache.set(storePath, entry);
	if (singleRowChildSessionCandidateCache.size <= SINGLE_ROW_CONTEXT_CACHE_MAX_ENTRIES) return;
	const oldestKey = singleRowChildSessionCandidateCache.keys().next().value;
	if (oldestKey) singleRowChildSessionCandidateCache.delete(oldestKey);
}
function buildStoreChildSessionCandidateIndex(store) {
	const childSessionsByKey = /* @__PURE__ */ new Map();
	if (!store) return childSessionsByKey;
	for (const [key, entry] of Object.entries(store)) {
		if (!entry) continue;
		const parentKeys = [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.spawnedBy), (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.parentSessionKey)].filter((value) => Boolean(value) && value !== key);
		for (const parentKey of parentKeys) addChildSessionKey(childSessionsByKey, parentKey, key);
	}
	return childSessionsByKey;
}
function getSingleRowChildSessionCandidates(params) {
	if (!params.store) return /* @__PURE__ */ new Map();
	const storeVersion = require_store.getSessionStoreCacheVersion(params.storePath);
	const cached = singleRowChildSessionCandidateCache.get(params.storePath);
	if (cached && cached.store === params.store && cached.storeVersion === storeVersion) return cached.childSessionCandidatesByParentKey;
	const childSessionCandidatesByParentKey = buildStoreChildSessionCandidateIndex(params.store);
	rememberSingleRowChildSessionCandidateCacheEntry(params.storePath, {
		store: params.store,
		storeVersion,
		childSessionCandidatesByParentKey
	});
	return childSessionCandidatesByParentKey;
}
function resolveRuntimeChildSessionKeys(controllerSessionKey, now = Date.now(), subagentRuns) {
	const childSessionKeys = /* @__PURE__ */ new Set();
	const controllerKey = controllerSessionKey.trim();
	const runs = subagentRuns ? subagentRuns.runsByControllerSessionKey.get(controllerKey) ?? [] : require_subagent_registry_read.listSubagentRunsForController(controllerSessionKey);
	for (const entry of runs) {
		const childSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.childSessionKey);
		if (!childSessionKey) continue;
		const latest = subagentRuns ? subagentRuns.getDisplaySubagentRun(childSessionKey) : require_subagent_registry_read.getSessionDisplaySubagentRunByChildSessionKey(childSessionKey);
		if (!latest) continue;
		if (((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest?.controllerSessionKey) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest?.requesterSessionKey)) !== controllerSessionKey) continue;
		if (!require_subagent_run_liveness.shouldKeepSubagentRunChildLink(latest, {
			activeDescendants: subagentRuns ? subagentRuns.countActiveDescendantRuns(childSessionKey) : require_subagent_registry_read.countActiveDescendantRuns(childSessionKey),
			now
		})) continue;
		childSessionKeys.add(childSessionKey);
	}
	const childSessions = Array.from(childSessionKeys);
	return childSessions.length > 0 ? childSessions : void 0;
}
function addChildSessionKey(childSessionsByKey, parentKey, childKey) {
	const current = childSessionsByKey.get(parentKey);
	if (current) {
		if (!current.includes(childKey)) current.push(childKey);
		return;
	}
	childSessionsByKey.set(parentKey, [childKey]);
}
function buildStoreChildSessionIndex(store, now = Date.now(), subagentRuns) {
	const childSessionsByKey = /* @__PURE__ */ new Map();
	for (const [key, entry] of Object.entries(store)) {
		if (!entry) continue;
		const parentKeys = [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.spawnedBy), (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.parentSessionKey)].filter((value) => Boolean(value) && value !== key);
		if (parentKeys.length === 0) continue;
		const latest = subagentRuns ? subagentRuns.getDisplaySubagentRun(key) : require_subagent_registry_read.getSessionDisplaySubagentRunByChildSessionKey(key);
		let latestControllerSessionKey;
		if (latest) {
			latestControllerSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest.controllerSessionKey) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest.requesterSessionKey);
			if (!require_subagent_run_liveness.shouldKeepSubagentRunChildLink(latest, {
				activeDescendants: subagentRuns ? subagentRuns.countActiveDescendantRuns(key) : require_subagent_registry_read.countActiveDescendantRuns(key),
				now
			})) continue;
		} else if (!shouldKeepStoreOnlyChildLink(entry, now)) continue;
		for (const parentKey of parentKeys) {
			if (latestControllerSessionKey && latestControllerSessionKey !== parentKey) continue;
			addChildSessionKey(childSessionsByKey, parentKey, key);
		}
	}
	return childSessionsByKey;
}
function resolveStoreChildSessionKeysFromCandidates(params) {
	const childSessionKeys = [];
	for (const childKey of params.candidates.get(params.key) ?? []) {
		const entry = params.store[childKey];
		if (!entry) continue;
		const latest = require_subagent_registry_read.getSessionDisplaySubagentRunByChildSessionKey(childKey);
		if (latest) {
			if (((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest.controllerSessionKey) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest.requesterSessionKey)) !== params.key) continue;
			if (!require_subagent_run_liveness.shouldKeepSubagentRunChildLink(latest, {
				activeDescendants: require_subagent_registry_read.countActiveDescendantRuns(childKey),
				now: params.now
			})) continue;
			childSessionKeys.push(childKey);
			continue;
		}
		if (!shouldKeepStoreOnlyChildLink(entry, params.now)) continue;
		childSessionKeys.push(childKey);
	}
	return childSessionKeys.length > 0 ? childSessionKeys : void 0;
}
function buildSessionListRowContext(params) {
	const subagentRuns = require_subagent_registry_read.buildSubagentRunReadIndex(params.now);
	return buildSessionListRowContextFromParts({
		subagentRuns,
		storeChildSessionsByKey: buildStoreChildSessionIndex(params.store, params.now, subagentRuns)
	});
}
function buildSessionListRowContextFromParts(params) {
	return {
		subagentRuns: params.subagentRuns,
		storeChildSessionsByKey: params.storeChildSessionsByKey,
		selectedModelByOverrideRef: /* @__PURE__ */ new Map(),
		thinkingMetadataByModelRef: /* @__PURE__ */ new Map(),
		displayModelIdentityByKey: /* @__PURE__ */ new Map(),
		modelCostConfigByModelRef: /* @__PURE__ */ new Map()
	};
}
function buildSessionListRowMetadataContext(params) {
	return buildSessionListRowContextFromParts({
		subagentRuns: require_subagent_registry_read.buildSubagentRunReadIndex(params.now),
		storeChildSessionsByKey: /* @__PURE__ */ new Map()
	});
}
function buildSingleRowStoreChildSessionsByKey(params) {
	const storeChildSessions = resolveStoreChildSessionKeysFromCandidates({
		store: params.store,
		key: params.key,
		now: params.now,
		candidates: getSingleRowChildSessionCandidates({
			storePath: params.storePath,
			store: params.store
		})
	});
	return storeChildSessions ? /* @__PURE__ */ new Map([[params.key, storeChildSessions]]) : /* @__PURE__ */ new Map();
}
function createSessionRowModelCacheKey(provider, model) {
	return `${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(provider)}\0${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(model) ?? ""}`;
}
function resolveSessionSelectedModelRef(params) {
	const override = require_model_selection.normalizeStoredOverrideModel({
		providerOverride: params.entry?.providerOverride,
		modelOverride: params.entry?.modelOverride
	});
	if (!override.modelOverride) return null;
	if (!params.rowContext) return require_session_model_ref.resolveSessionModelRef(params.cfg, params.entry, params.agentId, { allowPluginNormalization: params.allowPluginNormalization });
	const key = [
		(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId),
		override.providerOverride ?? "",
		override.modelOverride
	].join("\0");
	const cached = params.rowContext.selectedModelByOverrideRef.get(key);
	if (cached) return cached;
	const selected = require_session_model_ref.resolveSessionModelRef(params.cfg, params.entry, params.agentId, { allowPluginNormalization: params.allowPluginNormalization });
	params.rowContext.selectedModelByOverrideRef.set(key, selected);
	return selected;
}
function resolveSessionRowThinkingMetadata(params) {
	if (!params.rowContext) return {
		levels: require_thinking.listThinkingLevelOptions(params.provider, params.model, params.modelCatalog, params.agentRuntime),
		defaultLevel: resolveGatewaySessionThinkingDefault({
			cfg: params.cfg,
			provider: params.provider,
			model: params.model,
			agentId: params.agentId,
			modelCatalog: params.modelCatalog,
			agentRuntime: params.agentRuntime
		})
	};
	const key = `${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId)}\0${params.agentRuntime}\0${createSessionRowModelCacheKey(params.provider, params.model)}`;
	const cached = params.rowContext.thinkingMetadataByModelRef.get(key);
	if (cached) return cached;
	const metadata = {
		levels: require_thinking.listThinkingLevelOptions(params.provider, params.model, params.modelCatalog, params.agentRuntime),
		defaultLevel: resolveGatewaySessionThinkingDefault({
			cfg: params.cfg,
			provider: params.provider,
			model: params.model,
			agentId: params.agentId,
			modelCatalog: params.modelCatalog,
			agentRuntime: params.agentRuntime
		})
	};
	params.rowContext.thinkingMetadataByModelRef.set(key, metadata);
	return metadata;
}
function mergeChildSessionKeys(runtimeChildSessions, storeChildSessions) {
	if (!runtimeChildSessions?.length) return storeChildSessions?.length ? storeChildSessions : void 0;
	if (!storeChildSessions?.length) return runtimeChildSessions;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...runtimeChildSessions, ...storeChildSessions]);
}
function resolveChildSessionKeys(controllerSessionKey, store, now = Date.now(), subagentRuns) {
	return mergeChildSessionKeys(resolveRuntimeChildSessionKeys(controllerSessionKey, now, subagentRuns), buildStoreChildSessionIndex(store, now, subagentRuns).get(controllerSessionKey));
}
function resolveTranscriptUsageFallback(params) {
	const entry = params.entry;
	if (!entry?.sessionId) return null;
	const parsed = require_session_key.parseAgentSessionKey(params.key);
	const agentId = parsed?.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) : (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId ?? require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const storePath = resolveConcreteSessionStorePath(params.storePath) ?? require_paths.resolveStorePath(params.cfg.session?.store, { agentId });
	let snapshot;
	try {
		snapshot = require_session_transcript_readers.readRecentSessionUsageFromTranscript({
			agentId,
			sessionEntry: entry,
			sessionId: entry.sessionId,
			sessionKey: params.key,
			storePath
		}, typeof params.maxTranscriptBytes === "number" ? params.maxTranscriptBytes : 256 * 1024);
	} catch {
		return null;
	}
	if (!snapshot) return null;
	const modelProvider = snapshot.modelProvider ?? params.fallbackProvider;
	const model = snapshot.model ?? params.fallbackModel;
	const contextTokens = require_context.resolveContextTokensForModel({
		cfg: params.cfg,
		provider: modelProvider,
		model,
		allowAsyncLoad: false
	});
	const estimatedCostUsd = resolveEstimatedSessionCostUsd({
		cfg: params.cfg,
		provider: modelProvider,
		model,
		explicitCostUsd: snapshot.costUsd,
		entry: {
			inputTokens: snapshot.inputTokens,
			outputTokens: snapshot.outputTokens,
			cacheRead: snapshot.cacheRead,
			cacheWrite: snapshot.cacheWrite
		},
		rowContext: params.rowContext
	});
	return {
		modelProvider,
		model,
		totalTokens: resolvePositiveNumber(snapshot.totalTokens),
		totalTokensFresh: snapshot.totalTokensFresh === true,
		contextTokens: resolvePositiveNumber(contextTokens),
		estimatedCostUsd
	};
}
function readAcpMetaForDeletedAgentCheck(params) {
	if (params.entry?.acp) return params.entry.acp;
	const acpMetadataSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.acpMetadataSessionKey);
	const directKeys = /* @__PURE__ */ new Set();
	if (acpMetadataSessionKey) directKeys.add(acpMetadataSessionKey);
	else {
		const acpMeta = require_session_meta.readAcpSessionMeta({
			sessionKey: params.sessionKey,
			cfg: params.cfg
		});
		if (acpMeta) return acpMeta;
	}
	directKeys.add(params.sessionKey);
	for (const directKey of directKeys) {
		const acpMeta = require_session_meta.readAcpSessionMetaForEntry({
			sessionKey: directKey,
			entry: params.entry ?? void 0
		});
		if (acpMeta) return acpMeta;
	}
	require_session_meta.repairAcpSessionMetaKeyForMigration({
		sessionKey: params.sessionKey,
		candidateSessionKeys: directKeys,
		entry: params.entry ?? void 0
	});
	return require_session_meta.readAcpSessionMetaForEntry({
		sessionKey: params.sessionKey,
		entry: params.entry ?? void 0
	});
}
/**
* Returns the owning agent id if the session key belongs to an agent that is no
* longer present in config (deleted). Returns null for non-agent legacy/global
* keys, confirmed ACP runtime session keys, or when the owning agent still
* exists (#65524).
*/
function resolveDeletedAgentIdFromSessionKey(cfg, sessionKey, entry, options) {
	const parsed = require_session_key.parseAgentSessionKey(sessionKey);
	if (!parsed) return null;
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId);
	if (require_agent_scope_config.listAgentIds(cfg).includes(agentId)) return null;
	if (require_session_key.isAcpSessionKey(sessionKey) && !parsed.rest.startsWith("acp:binding:")) {
		if (readAcpMetaForDeletedAgentCheck({
			cfg,
			sessionKey,
			entry,
			acpMetadataSessionKey: options?.acpMetadataSessionKey
		})) return null;
	}
	return agentId;
}
function loadSessionEntry(sessionKey, opts) {
	const cfg = require_io.getRuntimeConfig();
	const target = resolveGatewaySessionStoreTargetWithStore({
		cfg,
		key: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey) ?? "",
		...opts?.clone === false ? { clone: false } : {},
		...opts?.agentId ? { agentId: opts.agentId } : {}
	});
	const storePath = target.storePath;
	const store = target.store;
	const freshestMatch = resolveFreshestSessionStoreMatchFromStoreKeys(store, target.storeKeys);
	const legacyKey = freshestMatch?.key !== target.canonicalKey ? freshestMatch?.key : void 0;
	return {
		cfg,
		storePath,
		store,
		entry: freshestMatch?.entry,
		canonicalKey: target.canonicalKey,
		storeKeys: target.storeKeys,
		legacyKey
	};
}
function resolveFreshestSessionStoreMatchFromStoreKeys(store, storeKeys) {
	let freshest;
	for (const key of storeKeys) {
		const entry = store[key];
		if (!entry) continue;
		const match = {
			key,
			entry
		};
		if (!freshest || (match.entry.updatedAt ?? 0) > (freshest.entry.updatedAt ?? 0)) freshest = match;
	}
	return freshest;
}
function resolveFreshestSessionEntryFromStoreKeys(store, storeKeys) {
	return resolveFreshestSessionStoreMatchFromStoreKeys(store, storeKeys)?.entry;
}
function findFreshestStoreMatch(store, ...candidates) {
	const matches = /* @__PURE__ */ new Map();
	for (const candidate of candidates) {
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate) ?? "";
		if (!trimmed) continue;
		const exact = store[trimmed];
		if (exact) matches.set(trimmed, {
			entry: exact,
			key: trimmed
		});
	}
	if (matches.size === 0) return;
	let freshest;
	for (const match of matches.values()) if (!freshest || (match.entry.updatedAt ?? 0) > (freshest.entry.updatedAt ?? 0)) freshest = match;
	return freshest;
}
/**
* Remove legacy key variants for one canonical session key.
* Candidates can include aliases (for example, "agent:ops:main" when canonical is "agent:ops:work").
*/
function pruneLegacyStoreKeys(params) {
	const keysToDelete = /* @__PURE__ */ new Set();
	for (const candidate of params.candidates) {
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate ?? "") ?? "";
		if (!trimmed) continue;
		if (trimmed !== params.canonicalKey) keysToDelete.add(trimmed);
	}
	for (const key of keysToDelete) delete params.store[key];
}
function migrateAndPruneGatewaySessionStoreKey(params) {
	const target = resolveGatewaySessionStoreTarget({
		cfg: params.cfg,
		key: params.key,
		store: params.store,
		...params.agentId ? { agentId: params.agentId } : {}
	});
	const primaryKey = target.canonicalKey;
	const freshestMatch = resolveFreshestSessionStoreMatchFromStoreKeys(params.store, target.storeKeys);
	if (freshestMatch) {
		const currentPrimary = params.store[primaryKey];
		if (!currentPrimary || (freshestMatch.entry.updatedAt ?? 0) > (currentPrimary.updatedAt ?? 0)) params.store[primaryKey] = freshestMatch.entry;
	}
	pruneLegacyStoreKeys({
		store: params.store,
		canonicalKey: primaryKey,
		candidates: target.storeKeys
	});
	return {
		target,
		primaryKey,
		entry: params.store[primaryKey]
	};
}
function classifySessionKey(key, entry) {
	if (key === "global") return "global";
	if (key === "unknown") return "unknown";
	if (entry?.chatType === "group" || entry?.chatType === "channel") return "group";
	if (key.includes(":group:") || key.includes(":channel:")) return "group";
	return "direct";
}
function parseGroupKey(key) {
	const parts = (require_session_key.parseAgentSessionKey(key)?.rest ?? key).split(":").filter(Boolean);
	if (parts.length >= 3) {
		const [channel, kind, ...rest] = parts;
		if (kind === "group" || kind === "channel") return {
			channel,
			kind,
			id: rest.join(":")
		};
	}
	return null;
}
function isGroupOrChannelDisplaySession(entry, parsed) {
	return entry?.chatType === "group" || entry?.chatType === "channel" || parsed?.kind === "group" || parsed?.kind === "channel";
}
function isStorePathTemplate(store) {
	return typeof store === "string" && store.includes("{agentId}");
}
function resolveConcreteSessionStorePath(storePath) {
	const trimmed = storePath?.trim();
	if (!trimmed || trimmed === "(multiple)" || isStorePathTemplate(trimmed)) return;
	return trimmed;
}
function normalizeFallbackList(values) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const value of values) {
		const trimmed = value.trim();
		if (!trimmed) continue;
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(trimmed);
	}
	return out;
}
function resolveGatewayAgentModel(cfg, agentId) {
	const primary = require_agent_scope.resolveAgentEffectiveModelPrimary(cfg, agentId)?.trim();
	const fallbackOverride = require_agent_scope.resolveAgentModelFallbacksOverride(cfg, agentId);
	const defaultFallbacks = require_model_input.resolveAgentModelFallbackValues(cfg.agents?.defaults?.model);
	const fallbacks = normalizeFallbackList(fallbackOverride ?? defaultFallbacks);
	if (!primary && fallbacks.length === 0) return;
	return {
		...primary ? { primary } : {},
		...fallbacks.length > 0 ? { fallbacks } : {}
	};
}
function listAgentsForGateway(cfg, modelCatalog, options) {
	const defaultId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
	const mainKey = require_session_key.normalizeMainKey(cfg.session?.mainKey);
	const scope = cfg.session?.scope ?? "per-sender";
	const configuredById = /* @__PURE__ */ new Map();
	for (const entry of cfg.agents?.list ?? []) {
		if (!entry?.id) continue;
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id);
		const configuredName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.name);
		const avatar = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.identity?.avatar);
		const avatarUrl = require_identity_avatar_file.resolveAgentAvatarUrlFromSource(cfg, agentId, avatar);
		const identity = entry.identity ? {
			name: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.identity.name),
			theme: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.identity.theme),
			emoji: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.identity.emoji),
			avatar,
			avatarUrl
		} : void 0;
		configuredById.set(agentId, {
			name: configuredName ?? identity?.name,
			identity
		});
	}
	const explicitIds = new Set((cfg.agents?.list ?? []).map((entry) => entry?.id ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) : "").filter(Boolean));
	const allowedIds = explicitIds.size > 0 ? /* @__PURE__ */ new Set([...explicitIds, defaultId]) : null;
	let agentIds = require_agent_list.listGatewayAgentIds(cfg).filter((id) => allowedIds ? allowedIds.has(id) : true);
	if (mainKey && !agentIds.includes(mainKey) && (!allowedIds || allowedIds.has(mainKey))) agentIds = [...agentIds, mainKey];
	return {
		defaultId,
		mainKey,
		scope,
		agents: agentIds.map((id) => {
			const meta = configuredById.get(id);
			const model = resolveGatewayAgentModel(cfg, id);
			const resolvedModel = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
				cfg,
				agentId: id
			});
			const sessionKey = require_main_session.resolveAgentMainSessionKey({
				cfg,
				agentId: id
			});
			const agentRuntime = require_agent_runtime_metadata.resolveModelAgentRuntimeMetadata({
				cfg,
				agentId: id,
				provider: resolvedModel.provider,
				model: resolvedModel.model,
				sessionKey,
				acpRuntime: false
			});
			const thinkingRuntime = require_thinking_runtime.resolveEffectiveAgentRuntime({
				cfg,
				provider: resolvedModel.provider,
				modelId: resolvedModel.model,
				agentId: id,
				sessionKey
			});
			const agentModelCatalog = options?.modelCatalogByAgentId?.get(id) ?? modelCatalog;
			const thinkingLevels = require_thinking.listThinkingLevelOptions(resolvedModel.provider, resolvedModel.model, agentModelCatalog, thinkingRuntime);
			const workspace = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, id);
			const workspaceGit = require_git.insideGitCheckout(workspace);
			return Object.assign({
				id,
				name: meta?.name,
				identity: meta?.identity,
				workspace,
				workspaceGit,
				agentRuntime,
				thinkingLevels,
				thinkingOptions: thinkingLevels.map((level) => level.label),
				thinkingDefault: resolveGatewaySessionThinkingDefault({
					cfg,
					provider: resolvedModel.provider,
					model: resolvedModel.model,
					agentId: id,
					modelCatalog: agentModelCatalog,
					agentRuntime: thinkingRuntime
				})
			}, model ? { model } : {});
		})
	};
}
function buildGatewaySessionStoreScanTargets(params) {
	const targets = /* @__PURE__ */ new Set();
	if (params.canonicalKey) targets.add(params.canonicalKey);
	if (params.key && params.key !== params.canonicalKey) targets.add(params.key);
	if (params.canonicalKey === "global" || params.canonicalKey === "unknown") return [...targets];
	const agentMainKey = require_main_session.resolveAgentMainSessionKey({
		cfg: params.cfg,
		agentId: params.agentId
	});
	if (params.canonicalKey === agentMainKey) targets.add(`agent:${params.agentId}:main`);
	return [...targets];
}
function resolveGatewaySessionStoreCandidates(cfg, agentId) {
	const storeConfig = cfg.session?.store;
	const defaultTarget = {
		agentId,
		storePath: require_paths.resolveStorePath(storeConfig, { agentId })
	};
	if (!isStorePathTemplate(storeConfig)) return [defaultTarget];
	const targets = /* @__PURE__ */ new Map();
	targets.set(defaultTarget.storePath, defaultTarget);
	for (const target of require_targets.resolveAllAgentSessionStoreTargetsSync(cfg)) if (target.agentId === agentId) targets.set(target.storePath, target);
	return [...targets.values()];
}
function loadGatewaySessionLookupStore(storePath, clone, agentId) {
	try {
		return Object.fromEntries(require_session_accessor.listSessionEntries({
			...agentId ? { agentId } : {},
			...clone === false ? { clone: false } : {},
			storePath
		}).map(({ sessionKey, entry }) => [sessionKey, entry]));
	} catch {
		return {};
	}
}
function resolveGatewaySessionStoreLookup(params) {
	const scanTargets = buildGatewaySessionStoreScanTargets(params);
	const candidates = resolveGatewaySessionStoreCandidates(params.cfg, params.agentId);
	const fallback = candidates[0] ?? {
		agentId: params.agentId,
		storePath: require_paths.resolveStorePath(params.cfg.session?.store, { agentId: params.agentId })
	};
	const loadStore = (target) => loadGatewaySessionLookupStore(target.storePath, params.clone, target.agentId);
	let selectedStorePath = fallback.storePath;
	let selectedStore = params.initialStore ?? loadStore(fallback);
	let selectedMatch = findFreshestStoreMatch(selectedStore, ...scanTargets);
	let selectedUpdatedAt = selectedMatch?.entry.updatedAt ?? Number.NEGATIVE_INFINITY;
	for (let index = 1; index < candidates.length; index += 1) {
		const candidate = candidates[index];
		if (!candidate) continue;
		const store = loadStore(candidate);
		const match = findFreshestStoreMatch(store, ...scanTargets);
		if (!match) continue;
		const updatedAt = match.entry.updatedAt ?? 0;
		if (!selectedMatch || updatedAt >= selectedUpdatedAt) {
			selectedStorePath = candidate.storePath;
			selectedStore = store;
			selectedMatch = match;
			selectedUpdatedAt = updatedAt;
		}
	}
	return {
		storePath: selectedStorePath,
		store: selectedStore,
		match: selectedMatch
	};
}
function isAgentScopedSentinelSessionKey(canonicalKey) {
	return canonicalKey === "global" || canonicalKey === "unknown";
}
function resolveExplicitDeletedLegacyMainStoreTarget(params) {
	const parsed = require_session_key.parseAgentSessionKey(params.key);
	const legacyAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed?.agentId);
	if (!parsed || legacyAgentId !== "main" || require_agent_scope_config.listAgentIds(params.cfg).includes(legacyAgentId)) return null;
	const canonicalKey = require_session_accessor.resolveStoredSessionKeyForAgentStore({
		cfg: params.cfg,
		agentId: legacyAgentId,
		sessionKey: params.key
	});
	const agentMainKey = require_main_session.resolveAgentMainSessionKey({
		cfg: params.cfg,
		agentId: legacyAgentId
	});
	const legacyAgentMainKey = `agent:${legacyAgentId}:main`;
	const lookupSeeds = Array.from(/* @__PURE__ */ new Set([
		params.key,
		canonicalKey,
		agentMainKey,
		legacyAgentMainKey
	]));
	let best;
	for (const target of require_targets.resolveAllAgentSessionStoreTargetsSync(params.cfg)) {
		if (target.agentId !== legacyAgentId) continue;
		const store = loadGatewaySessionLookupStore(target.storePath, params.clone, target.agentId);
		const match = findFreshestStoreMatch(store, ...lookupSeeds);
		if (!match) continue;
		if (!best || (match.entry.updatedAt ?? 0) >= (best.match.entry.updatedAt ?? 0)) best = {
			storePath: target.storePath,
			store,
			match
		};
	}
	if (!best) return null;
	const storeKeys = /* @__PURE__ */ new Set([canonicalKey]);
	if (params.key !== canonicalKey) storeKeys.add(params.key);
	storeKeys.add(best.match.key);
	for (const seed of lookupSeeds) storeKeys.add(seed);
	return {
		agentId: legacyAgentId,
		storePath: best.storePath,
		canonicalKey,
		storeKeys: Array.from(storeKeys),
		store: best.store
	};
}
function resolveGatewaySessionStoreTargetWithStore(params) {
	const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.key) ?? "";
	const explicitDeletedMainTarget = resolveExplicitDeletedLegacyMainStoreTarget({
		cfg: params.cfg,
		key,
		clone: params.clone
	});
	if (explicitDeletedMainTarget) return explicitDeletedMainTarget;
	const requestedAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId);
	const canonicalKey = require_session_accessor.resolveSessionStoreKey({
		cfg: params.cfg,
		sessionKey: key,
		...requestedAgentId ? { storeAgentId: requestedAgentId } : {}
	});
	const agentId = requestedAgentId && (isAgentScopedSentinelSessionKey(canonicalKey) || !require_session_key.parseAgentSessionKey(key)) ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(requestedAgentId) : require_session_accessor.resolveSessionStoreAgentId(params.cfg, canonicalKey);
	const { storePath, store } = resolveGatewaySessionStoreLookup({
		cfg: params.cfg,
		key,
		canonicalKey,
		agentId,
		clone: params.clone,
		initialStore: params.store
	});
	if (canonicalKey === "global" || canonicalKey === "unknown") return {
		agentId,
		storePath,
		canonicalKey,
		storeKeys: key && key !== canonicalKey ? [canonicalKey, key] : [key],
		store
	};
	const storeKeys = new Set(buildGatewaySessionStoreScanTargets({
		cfg: params.cfg,
		key,
		canonicalKey,
		agentId
	}));
	return {
		agentId,
		storePath,
		canonicalKey,
		storeKeys: Array.from(storeKeys),
		store
	};
}
function resolveGatewaySessionStoreTarget(params) {
	const { store: _store, ...target } = resolveGatewaySessionStoreTargetWithStore(params);
	return target;
}
function resolveGatewaySessionThinkingLevel(params) {
	if (!(params.modelCatalog ? require_model_selection_shared.findModelCatalogEntry(params.modelCatalog, {
		provider: params.provider,
		modelId: params.model
	}) : void 0)) return params.level;
	return require_thinking.resolveSupportedThinkingLevel({
		provider: params.provider,
		model: params.model,
		level: params.level,
		catalog: params.modelCatalog,
		agentRuntime: params.agentRuntime
	});
}
function resolveGatewaySessionThinkingDefault(params) {
	const defaultLevel = (params.agentId ? require_agent_scope_config.resolveAgentConfig(params.cfg, params.agentId)?.thinkingDefault : void 0) ?? require_model_thinking_default.resolveThinkingDefault({
		cfg: params.cfg,
		provider: params.provider,
		model: params.model,
		catalog: params.modelCatalog,
		agentRuntime: params.agentRuntime
	});
	return resolveGatewaySessionThinkingLevel({
		provider: params.provider,
		model: params.model,
		level: defaultLevel,
		modelCatalog: params.modelCatalog,
		agentRuntime: params.agentRuntime
	});
}
function resolveGatewaySessionThinkingProjectionInternal(params) {
	const acpMeta = require_session_meta.readAcpSessionMeta({ sessionKey: params.sessionKey });
	const configuredAgentRuntime = require_agent_runtime_metadata.resolveModelAgentRuntimeMetadata({
		cfg: params.cfg,
		agentId: params.agentId,
		provider: params.provider,
		model: params.model,
		sessionKey: params.sessionKey,
		acpRuntime: acpMeta != null,
		acpBackend: acpMeta?.backend
	});
	const persistedAgentRuntime = require_session_runtime_compat.resolveSessionRuntimeOverrideForProvider({
		provider: params.provider,
		entry: params.entry,
		cfg: params.cfg
	});
	const persistedAgentRuntimeSource = params.entry?.modelSelectionLocked === true ? "session" : "session-key";
	const agentRuntime = acpMeta || !persistedAgentRuntime ? configuredAgentRuntime : {
		id: persistedAgentRuntime,
		source: persistedAgentRuntimeSource
	};
	const thinkingRuntime = acpMeta ? require_thinking_runtime.concretizeAgentRuntime(acpMeta.backend ?? agentRuntime.id) : require_thinking_runtime.resolveEffectiveAgentRuntime({
		cfg: params.cfg,
		provider: params.provider,
		modelId: params.model,
		agentId: params.agentId,
		sessionKey: params.sessionKey,
		sessionEntry: params.entry
	});
	const metadata = resolveSessionRowThinkingMetadata({
		cfg: params.cfg,
		agentId: params.agentId,
		provider: params.provider,
		model: params.model,
		agentRuntime: thinkingRuntime,
		modelCatalog: params.modelCatalog,
		rowContext: params.rowContext
	});
	const storedThinkingLevel = require_thinking.normalizeThinkLevel(params.entry?.thinkingLevel);
	const thinkingLevel = storedThinkingLevel ? resolveGatewaySessionThinkingLevel({
		provider: params.provider,
		model: params.model,
		level: storedThinkingLevel,
		modelCatalog: params.modelCatalog,
		agentRuntime: thinkingRuntime
	}) : void 0;
	return {
		agentRuntime,
		thinkingLevel,
		effectiveThinkingLevel: thinkingLevel ?? metadata.defaultLevel,
		thinkingLevels: metadata.levels,
		thinkingOptions: metadata.levels.map((level) => level.label),
		thinkingDefault: metadata.defaultLevel
	};
}
/** Resolve the canonical runtime, selected level, and picker metadata for a session. */
function resolveGatewaySessionThinkingProjection(params) {
	return resolveGatewaySessionThinkingProjectionInternal(params);
}
function getSessionDefaults(cfg, modelCatalog, options) {
	const resolved = require_model_selection_shared.resolveConfiguredModelRef({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL,
		allowPluginNormalization: options?.allowPluginNormalization
	});
	const contextTokens = cfg.agents?.defaults?.contextTokens ?? require_context.lookupContextTokens(resolved.model, { allowAsyncLoad: false }) ?? 2e5;
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
	const sessionKey = require_main_session.resolveAgentMainSessionKey({
		cfg,
		agentId
	});
	const agentRuntime = require_agent_runtime_metadata.resolveModelAgentRuntimeMetadata({
		cfg,
		agentId,
		provider: resolved.provider,
		model: resolved.model,
		sessionKey,
		acpRuntime: false
	});
	const thinkingRuntime = require_thinking_runtime.resolveEffectiveAgentRuntime({
		cfg,
		provider: resolved.provider,
		modelId: resolved.model,
		agentId,
		sessionKey
	});
	const thinkingLevels = require_thinking.listThinkingLevelOptions(resolved.provider, resolved.model, modelCatalog, thinkingRuntime);
	return {
		modelProvider: resolved.provider ?? null,
		model: resolved.model ?? null,
		contextTokens: contextTokens ?? null,
		agentRuntime,
		thinkingLevels,
		thinkingOptions: thinkingLevels.map((level) => level.label),
		thinkingDefault: resolveGatewaySessionThinkingDefault({
			cfg,
			provider: resolved.provider,
			model: resolved.model,
			modelCatalog,
			agentRuntime: thinkingRuntime
		})
	};
}
async function resolveGatewayModelSupportsImages(params) {
	if (!params.model) return true;
	try {
		const modelEntry = require_model_selection_shared.findModelCatalogEntry(await params.loadGatewayModelCatalog({ readOnly: false }), {
			provider: params.provider,
			modelId: params.model
		});
		const normalizedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.provider ?? modelEntry?.provider);
		const normalizedCandidates = [(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.model), (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelEntry?.name)].filter(Boolean);
		if (modelEntry) {
			if (require_model_selection_shared.modelSupportsInput(modelEntry, "image")) return true;
			if (normalizedProvider === "microsoft-foundry" && normalizedCandidates.some((candidate) => candidate.startsWith("gpt-") || candidate.startsWith("o1") || candidate.startsWith("o3") || candidate.startsWith("o4") || candidate === "computer-use-preview")) return true;
			if (normalizedProvider === "claude-cli" && normalizedCandidates.some((candidate) => candidate === "opus" || candidate === "sonnet" || candidate === "haiku" || candidate.startsWith("claude-"))) return true;
			return false;
		}
		if (normalizedProvider === "claude-cli" && normalizedCandidates.some((candidate) => candidate === "opus" || candidate === "sonnet" || candidate === "haiku" || candidate.startsWith("claude-"))) return true;
		return false;
	} catch {
		return false;
	}
}
function resolveSessionDisplayModelIdentityRefCached(params) {
	const ctx = params.rowContext;
	if (!ctx) return resolveSessionDisplayModelIdentityRef(params);
	const key = `${params.agentId}\u0000${createSessionRowModelCacheKey(params.provider, params.model)}`;
	const cached = ctx.displayModelIdentityByKey.get(key);
	if (cached) return cached;
	const value = resolveSessionDisplayModelIdentityRef(params);
	ctx.displayModelIdentityByKey.set(key, value);
	return value;
}
function resolveSessionDisplayModelIdentityRef(params) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider);
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model);
	if (!provider || !model || !require_model_selection_cli.isCliProvider(provider, params.cfg)) return {
		provider,
		model
	};
	const defaultRef = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId
	});
	if (model.includes("/")) {
		const parsedModel = require_model_selection_normalize.parseModelRef(model, defaultRef.provider);
		if (parsedModel && !require_model_selection_cli.isCliProvider(parsedModel.provider, params.cfg)) return parsedModel;
	}
	const inferredProvider = require_model_selection_shared.inferUniqueProviderFromConfiguredModels({
		cfg: params.cfg,
		model
	});
	if (inferredProvider && !require_model_selection_cli.isCliProvider(inferredProvider, params.cfg)) return {
		provider: inferredProvider,
		model
	};
	const parsedModel = require_model_selection_normalize.parseModelRef(model, defaultRef.provider);
	if (parsedModel && !require_model_selection_cli.isCliProvider(parsedModel.provider, params.cfg)) return parsedModel;
	return {
		provider: defaultRef.provider || provider,
		model
	};
}
function buildGatewaySessionRow(params) {
	const { cfg, storePath, store, key, entry } = params;
	const lightweight = params.lightweightListRow === true;
	const skipTranscriptUsage = params.skipTranscriptUsageFallback === true;
	const now = params.now ?? Date.now();
	const updatedAt = entry?.updatedAt ?? null;
	const parsed = parseGroupKey(key);
	const channel = entry?.channel ?? parsed?.channel;
	const subject = entry?.subject;
	const groupChannel = entry?.groupChannel;
	const space = entry?.space;
	const id = parsed?.id;
	const origin = entry?.origin;
	const originLabel = origin?.label;
	const isGroupSession = isGroupOrChannelDisplaySession(entry, parsed);
	const displayName = entry?.label ?? (isGroupSession ? require_session_accessor.buildGroupDisplayTitle({
		subject,
		groupChannel,
		space
	}) : void 0) ?? entry?.displayName ?? (isGroupSession && channel ? require_session_accessor.buildGroupDisplayName({
		provider: channel,
		subject,
		groupChannel,
		space,
		id,
		key
	}) : void 0) ?? originLabel;
	const deliveryFields = require_delivery_context_shared.normalizeSessionDeliveryFields(entry);
	const sessionAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_session_key.parseAgentSessionKey(key)?.agentId ?? params.agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg));
	const rowContext = params.rowContext;
	const subagentRun = rowContext ? rowContext.subagentRuns.getDisplaySubagentRun(key) : require_subagent_registry_read.getSessionDisplaySubagentRunByChildSessionKey(key);
	const subagentOwner = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(subagentRun?.controllerSessionKey) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(subagentRun?.requesterSessionKey);
	const liveSubagentRunActive = require_subagent_registry_read.isSubagentRunLive(subagentRun);
	const persistedSessionStatus = entry?.status;
	const persistedSessionEndedAt = entry?.endedAt;
	const persistedSessionStartedAt = entry?.startedAt;
	const persistedSessionRuntimeMs = entry?.runtimeMs;
	const subagentRunState = subagentRun ? liveSubagentRunActive ? "active" : typeof subagentRun.endedAt === "number" || persistedSessionStatus === "done" || persistedSessionStatus === "failed" || persistedSessionStatus === "killed" || persistedSessionStatus === "timeout" || typeof persistedSessionEndedAt === "number" ? "historical" : "interrupted" : void 0;
	const subagentStatus = subagentRun ? liveSubagentRunActive ? require_subagent_run_liveness.resolveSubagentSessionStatus(subagentRun) : persistedSessionStatus === "running" ? void 0 : persistedSessionStatus ?? (typeof subagentRun.endedAt === "number" ? require_subagent_run_liveness.resolveSubagentSessionStatus(subagentRun) : void 0) : void 0;
	const subagentStartedAt = subagentRun ? liveSubagentRunActive ? require_subagent_run_liveness.getSubagentSessionStartedAt(subagentRun) : persistedSessionStartedAt ?? require_subagent_run_liveness.getSubagentSessionStartedAt(subagentRun) : void 0;
	const subagentEndedAt = subagentRun ? liveSubagentRunActive ? subagentRun.endedAt : persistedSessionEndedAt ?? subagentRun.endedAt : void 0;
	const subagentRuntimeMs = subagentRun ? liveSubagentRunActive ? resolveSessionRuntimeMs(subagentRun, now) : persistedSessionRuntimeMs ?? (typeof subagentRun.endedAt === "number" ? resolveSessionRuntimeMs(subagentRun, now) : void 0) : void 0;
	const selectedModel = resolveSessionSelectedModelRef({
		cfg,
		entry,
		agentId: sessionAgentId,
		rowContext,
		allowPluginNormalization: !lightweight
	});
	const resolvedModel = require_session_model_ref.resolveSessionModelIdentityRef(cfg, entry, sessionAgentId, subagentRun?.model, { allowPluginNormalization: !lightweight });
	const runtimeModelPresent = Boolean(entry?.model?.trim()) || Boolean(entry?.modelProvider?.trim());
	const freshSessionTotalTokens = require_number_coercion.resolveNonNegativeNumber(require_store.resolveFreshSessionTotalTokens(entry));
	const needsTranscriptTotalTokens = freshSessionTotalTokens === void 0;
	const needsTranscriptContextTokens = resolvePositiveNumber(entry?.contextTokens) === void 0;
	const needsTranscriptEstimatedCostUsd = !skipTranscriptUsage && resolveEstimatedSessionCostUsd({
		cfg,
		provider: resolvedModel.provider,
		model: resolvedModel.model ?? "openrouter/auto",
		entry,
		rowContext
	}) === void 0;
	const transcriptUsage = !skipTranscriptUsage && (needsTranscriptTotalTokens || needsTranscriptContextTokens || needsTranscriptEstimatedCostUsd) ? resolveTranscriptUsageFallback({
		cfg,
		key,
		entry,
		storePath,
		fallbackProvider: resolvedModel.provider,
		fallbackModel: resolvedModel.model ?? "openrouter/auto",
		maxTranscriptBytes: params.transcriptUsageMaxBytes,
		rowContext: params.rowContext,
		agentId: sessionAgentId
	}) : null;
	const preferLiveSubagentModelIdentity = Boolean(subagentRun?.model?.trim()) && subagentStatus === "running";
	const shouldUseTranscriptModelIdentity = runtimeModelPresent && !preferLiveSubagentModelIdentity && (needsTranscriptTotalTokens || needsTranscriptContextTokens);
	const resolvedModelIdentity = {
		provider: resolvedModel.provider,
		model: resolvedModel.model ?? "openrouter/auto"
	};
	const { provider: modelProvider, model } = shouldUseTranscriptModelIdentity ? {
		provider: transcriptUsage?.modelProvider ?? resolvedModelIdentity.provider,
		model: transcriptUsage?.model ?? resolvedModelIdentity.model
	} : resolvedModelIdentity;
	const totalTokens = freshSessionTotalTokens ?? require_number_coercion.resolveNonNegativeNumber(transcriptUsage?.totalTokens);
	const totalTokensFresh = freshSessionTotalTokens !== void 0 || typeof totalTokens === "number" && Number.isFinite(totalTokens) && totalTokens > 0 ? true : transcriptUsage?.totalTokensFresh === true;
	const goal = entry?.goal ? require_sessions.resolveSessionGoalDisplayState({
		goal: entry.goal,
		totalTokens,
		totalTokensFresh
	}, now, { adoptFreshBaseline: false }) : void 0;
	const childSessions = params.storeChildSessionsByKey ? mergeChildSessionKeys(resolveRuntimeChildSessionKeys(key, now, rowContext?.subagentRuns), params.storeChildSessionsByKey.get(key)) : resolveChildSessionKeys(key, store, now, rowContext?.subagentRuns);
	const compactionCheckpoints = resolveProjectableCompactionCheckpoints(entry);
	const compactionCheckpointCount = Array.isArray(entry?.compactionCheckpoints) ? compactionCheckpoints.length : void 0;
	const latestCompactionCheckpoint = buildCompactionCheckpointPreview(resolveLatestCompactionCheckpoint(compactionCheckpoints));
	const selectedOrRuntimeModelProvider = selectedModel?.provider ?? modelProvider;
	const selectedOrRuntimeModel = selectedModel?.model ?? model;
	const rowModelIdentity = lightweight ? {
		provider: selectedOrRuntimeModelProvider,
		model: selectedOrRuntimeModel
	} : resolveSessionDisplayModelIdentityRefCached({
		cfg,
		agentId: sessionAgentId,
		provider: selectedOrRuntimeModelProvider,
		model: selectedOrRuntimeModel,
		rowContext: params.rowContext
	});
	const rowModelProvider = rowModelIdentity.provider;
	const rowModel = rowModelIdentity.model;
	const acpSessionKey = require_session_accessor.resolveStoredSessionKeyForAgentStore({
		cfg,
		agentId: sessionAgentId,
		sessionKey: key
	});
	const estimatedCostUsd = lightweight ? require_number_coercion.resolveNonNegativeNumber(entry?.estimatedCostUsd) : resolveEstimatedSessionCostUsd({
		cfg,
		provider: rowModelProvider,
		model: rowModel,
		entry,
		rowContext: params.rowContext
	}) ?? require_number_coercion.resolveNonNegativeNumber(transcriptUsage?.estimatedCostUsd);
	const contextTokens = lightweight ? resolvePositiveNumber(entry?.contextTokens) ?? resolvePositiveNumber(require_context.resolveContextTokensForModel({
		cfg,
		provider: rowModelProvider,
		model: rowModel,
		allowAsyncLoad: false
	})) : resolvePositiveNumber(entry?.contextTokens) ?? resolvePositiveNumber(transcriptUsage?.contextTokens) ?? resolvePositiveNumber(require_context.resolveContextTokensForModel({
		cfg,
		provider: rowModelProvider,
		model: rowModel,
		allowAsyncLoad: false
	}));
	let derivedTitle;
	let lastMessagePreview;
	if (entry?.sessionId && (params.includeDerivedTitles || params.includeLastMessage)) {
		const fields = require_session_transcript_readers.readSessionTitleFieldsFromTranscript({
			agentId: sessionAgentId,
			sessionEntry: entry,
			sessionId: entry.sessionId,
			sessionKey: key,
			storePath
		});
		if (params.includeDerivedTitles) derivedTitle = deriveSessionTitle(entry, fields.firstUserMessage);
		if (params.includeLastMessage && fields.lastMessagePreview) lastMessagePreview = fields.lastMessagePreview;
	}
	const thinkingProjection = resolveGatewaySessionThinkingProjectionInternal({
		cfg,
		agentId: sessionAgentId,
		provider: rowModelProvider ?? "openrouter",
		model: rowModel ?? "openrouter/auto",
		sessionKey: acpSessionKey,
		entry,
		modelCatalog: params.modelCatalog,
		rowContext
	});
	const fastModeState = require_fast_mode.resolveFastModeState({
		cfg,
		provider: selectedOrRuntimeModelProvider ?? "openrouter",
		model: selectedOrRuntimeModel ?? "openrouter/auto",
		agentId: sessionAgentId,
		sessionEntry: entry?.fastMode !== void 0 ? { fastMode: entry.fastMode } : void 0
	});
	const pluginExtensions = !lightweight && entry ? require_registry.projectPluginSessionExtensionsSync({
		sessionKey: key,
		entry
	}) : [];
	return {
		key,
		spawnedBy: subagentOwner || entry?.spawnedBy,
		spawnedWorkspaceDir: entry?.spawnedWorkspaceDir,
		spawnedCwd: entry?.spawnedCwd,
		worktree: entry?.worktree,
		execNode: entry?.execNode,
		execCwd: entry?.execCwd,
		forkedFromParent: entry?.forkedFromParent,
		spawnDepth: entry?.spawnDepth,
		subagentRole: entry?.subagentRole,
		subagentControlScope: entry?.subagentControlScope,
		kind: classifySessionKey(key, entry),
		label: entry?.label,
		category: entry?.category,
		displayName,
		derivedTitle,
		lastMessagePreview,
		channel,
		subject,
		groupChannel,
		space,
		chatType: entry?.chatType,
		origin,
		updatedAt,
		archived: entry?.archivedAt !== void 0,
		archivedAt: entry?.archivedAt,
		pinned: entry?.pinnedAt !== void 0,
		pinnedAt: entry?.pinnedAt,
		unread: deriveSessionUnread(entry),
		lastReadAt: entry?.lastReadAt,
		lastInteractionAt: entry?.lastInteractionAt,
		lastActivityAt: entry?.lastActivityAt,
		sessionId: entry?.sessionId,
		systemSent: entry?.systemSent,
		abortedLastRun: entry?.abortedLastRun,
		thinkingLevel: thinkingProjection.thinkingLevel,
		thinkingLevels: thinkingProjection.thinkingLevels,
		thinkingOptions: thinkingProjection.thinkingOptions,
		thinkingDefault: thinkingProjection.thinkingDefault,
		fastMode: entry?.fastMode,
		effectiveFastMode: fastModeState.mode,
		effectiveFastModeSource: fastModeState.source,
		fastAutoOnSeconds: fastModeState.fastAutoOnSeconds,
		verboseLevel: entry?.verboseLevel,
		traceLevel: entry?.traceLevel,
		reasoningLevel: entry?.reasoningLevel,
		elevatedLevel: entry?.elevatedLevel,
		sendPolicy: entry?.sendPolicy,
		inputTokens: entry?.inputTokens,
		outputTokens: entry?.outputTokens,
		totalTokens,
		totalTokensFresh,
		goal,
		estimatedCostUsd,
		status: subagentRun ? subagentStatus : entry?.status,
		hasAutomation: sessionHasAutomation(key, cfg) ? true : void 0,
		subagentRunState,
		hasActiveSubagentRun: subagentRun ? liveSubagentRunActive : void 0,
		startedAt: subagentRun ? subagentStartedAt : entry?.startedAt,
		endedAt: subagentRun ? subagentEndedAt : entry?.endedAt,
		runtimeMs: subagentRun ? subagentRuntimeMs : entry?.runtimeMs,
		parentSessionKey: subagentOwner || entry?.parentSessionKey,
		childSessions,
		responseUsage: entry?.responseUsage,
		effectiveResponseUsage: require_thinking.resolveEffectiveResponseUsage(entry?.responseUsage, cfg.messages?.responseUsage, channel),
		modelProvider: rowModelProvider,
		model: rowModel,
		modelSelectionLocked: entry?.modelSelectionLocked,
		agentRuntime: thinkingProjection.agentRuntime,
		contextTokens,
		contextBudgetStatus: entry?.contextBudgetStatus,
		deliveryContext: deliveryFields.deliveryContext,
		lastChannel: deliveryFields.lastChannel ?? entry?.lastChannel,
		lastTo: deliveryFields.lastTo ?? entry?.lastTo,
		lastAccountId: deliveryFields.lastAccountId ?? entry?.lastAccountId,
		lastThreadId: deliveryFields.lastThreadId ?? entry?.lastThreadId,
		compactionCheckpointCount,
		latestCompactionCheckpoint,
		pluginExtensions: pluginExtensions.length > 0 ? pluginExtensions : void 0
	};
}
function resolveSessionListSearchDisplayName(key, entry) {
	if (entry?.displayName) return entry.displayName;
	const parsed = parseGroupKey(key);
	const channel = entry?.channel ?? parsed?.channel;
	if (isGroupOrChannelDisplaySession(entry, parsed) && channel) return require_session_accessor.buildGroupDisplayName({
		provider: channel,
		subject: entry?.subject,
		groupChannel: entry?.groupChannel,
		space: entry?.space,
		id: parsed?.id,
		key
	});
	return entry?.label ?? entry?.origin?.label;
}
function addSessionListSearchModelFields(fields, identity) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity.provider);
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity.model);
	fields.push(provider, model);
	if (provider && model) fields.push(`${provider}/${model}`);
}
function matchesSessionListSearch(fields, search) {
	return fields.some((field) => typeof field === "string" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(field).includes(search));
}
function appendStoredSessionModelSearchFields(fields, entry) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.modelProvider);
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.model);
	fields.push(provider, model);
	if (provider && model) fields.push(`${provider}/${model}`);
}
function shouldResolveDerivedSessionModelSearchFields(search) {
	return !search.startsWith("agent:");
}
function resolveSessionListRowContext(params) {
	return params.rowContext ?? params.getRowContext?.();
}
function resolveSessionListSearchModelFields(params) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_session_key.parseAgentSessionKey(params.key)?.agentId ?? require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const subagentRun = params.rowContext ? params.rowContext.subagentRuns.getDisplaySubagentRun(params.key) : require_subagent_registry_read.getSessionDisplaySubagentRunByChildSessionKey(params.key);
	const selectedModel = resolveSessionSelectedModelRef({
		cfg: params.cfg,
		entry: params.entry,
		agentId,
		rowContext: params.rowContext,
		allowPluginNormalization: false
	});
	const resolvedModel = require_session_model_ref.resolveSessionModelIdentityRef(params.cfg, params.entry, agentId, subagentRun?.model, { allowPluginNormalization: false });
	const modelIdentity = {
		provider: resolvedModel.provider,
		model: resolvedModel.model ?? "openrouter/auto"
	};
	const selectedOrRuntimeModelProvider = selectedModel?.provider ?? modelIdentity.provider;
	const selectedOrRuntimeModel = selectedModel?.model ?? modelIdentity.model;
	const displayModelIdentity = resolveSessionDisplayModelIdentityRefCached({
		cfg: params.cfg,
		agentId,
		provider: selectedOrRuntimeModelProvider,
		model: selectedOrRuntimeModel,
		rowContext: params.rowContext
	});
	const fields = [];
	addSessionListSearchModelFields(fields, {
		provider: params.entry?.modelProvider,
		model: params.entry?.model
	});
	addSessionListSearchModelFields(fields, resolvedModel);
	if (selectedModel) addSessionListSearchModelFields(fields, selectedModel);
	addSessionListSearchModelFields(fields, displayModelIdentity);
	return fields;
}
function loadGatewaySessionRow(sessionKey, options) {
	const now = options?.now ?? Date.now();
	const { cfg, storePath, store, entry, canonicalKey } = loadSessionEntry(sessionKey, {
		clone: false,
		...options?.agentId ? { agentId: options.agentId } : {}
	});
	if (!entry) return null;
	const storeChildSessionsByKey = buildSingleRowStoreChildSessionsByKey({
		storePath,
		store,
		key: canonicalKey,
		now
	});
	return buildGatewaySessionRow({
		cfg,
		storePath,
		store,
		key: canonicalKey,
		entry,
		now,
		includeDerivedTitles: options?.includeDerivedTitles,
		includeLastMessage: options?.includeLastMessage,
		transcriptUsageMaxBytes: options?.transcriptUsageMaxBytes,
		storeChildSessionsByKey,
		...options?.agentId ? { agentId: options.agentId } : {}
	});
}
function buildGatewaySessionInfo(params) {
	const now = params.now ?? Date.now();
	const storeChildSessionsByKey = buildSingleRowStoreChildSessionsByKey({
		storePath: params.storePath,
		store: params.store,
		key: params.key,
		now
	});
	return buildGatewaySessionRow({
		cfg: params.cfg,
		storePath: params.storePath,
		store: params.store,
		key: params.key,
		entry: params.entry,
		agentId: params.agentId,
		modelCatalog: params.modelCatalog,
		now,
		storeChildSessionsByKey,
		skipTranscriptUsageFallback: true,
		lightweightListRow: true
	});
}
/**
* Number of session rows to build per batch before yielding to the event loop.
* Keeps the main thread responsive during large session list operations while
* avoiding excessive yielding overhead for small stores.
*/
const SESSIONS_LIST_YIELD_BATCH_SIZE = 10;
const SESSIONS_LIST_DEFAULT_LIMIT = 100;
function resolveSessionsListLimit(opts, defaultLimit) {
	if (typeof opts.limit !== "number" || !Number.isFinite(opts.limit)) return defaultLimit;
	return Math.max(1, Math.floor(opts.limit));
}
function resolveSessionsListOffset(opts) {
	if (typeof opts.offset !== "number" || !Number.isFinite(opts.offset)) return 0;
	return Math.max(0, Math.floor(opts.offset));
}
function resolveSessionsListWindowLimit(limit, offset) {
	if (limit === void 0) return;
	const windowLimit = offset + limit;
	return Number.isFinite(windowLimit) ? Math.min(windowLimit, Number.MAX_SAFE_INTEGER) : void 0;
}
function filterSessionEntries(params) {
	const { cfg, store, opts, now } = params;
	const includeGlobal = opts.includeGlobal === true;
	const includeUnknown = opts.includeUnknown === true;
	const spawnedBy = typeof opts.spawnedBy === "string" ? opts.spawnedBy : "";
	const label = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.label) ?? "";
	const agentId = typeof opts.agentId === "string" ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agentId) : "";
	const search = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(opts.search);
	const activeMinutes = typeof opts.activeMinutes === "number" && Number.isFinite(opts.activeMinutes) ? Math.max(1, Math.floor(opts.activeMinutes)) : void 0;
	let entries = Object.entries(store).filter(([key]) => {
		if (require_session_key.isCronRunSessionKey(key)) return false;
		if (!includeGlobal && key === "global") return false;
		if (!includeUnknown && key === "unknown") return false;
		if (agentId) {
			if (key === "global") return includeGlobal;
			if (key === "unknown") return false;
			const parsed = require_session_key.parseAgentSessionKey(key);
			if (!parsed) return false;
			return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) === agentId;
		}
		return true;
	}).filter(([key, entry]) => {
		if (isPhantomAgentStoreListEntry(key, entry)) return false;
		if (!spawnedBy) return true;
		if (key === "unknown" || key === "global") return false;
		const filterRowContext = resolveSessionListRowContext(params);
		const latest = filterRowContext ? filterRowContext.subagentRuns.getDisplaySubagentRun(key) : require_subagent_registry_read.getSessionDisplaySubagentRunByChildSessionKey(key);
		if (latest) return ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest.controllerSessionKey) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(latest.requesterSessionKey)) === spawnedBy && require_subagent_run_liveness.shouldKeepSubagentRunChildLink(latest, {
			activeDescendants: filterRowContext ? filterRowContext.subagentRuns.countActiveDescendantRuns(key) : require_subagent_registry_read.countActiveDescendantRuns(key),
			now
		});
		return shouldKeepStoreOnlyChildLink(entry, now) && (entry?.spawnedBy === spawnedBy || entry?.parentSessionKey === spawnedBy);
	}).filter(([, entry]) => {
		const archived = entry?.archivedAt !== void 0;
		return opts.archived === true ? archived : !archived;
	}).filter(([, entry]) => {
		if (opts.requireLastInteraction !== true) return true;
		return isFinitePositiveTimestamp(entry?.lastInteractionAt) && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.heartbeatIsolatedBaseSessionKey);
	}).filter(([, entry]) => {
		if (!label) return true;
		return entry?.label === label;
	});
	if (search) entries = entries.filter(([key, entry]) => {
		const cheapFields = [
			resolveSessionListSearchDisplayName(key, entry),
			entry?.label,
			entry?.subject,
			entry?.sessionId,
			key
		];
		appendStoredSessionModelSearchFields(cheapFields, entry);
		if (matchesSessionListSearch(cheapFields, search)) return true;
		if (!shouldResolveDerivedSessionModelSearchFields(search)) return false;
		const searchRowContext = resolveSessionListRowContext(params);
		return matchesSessionListSearch(resolveSessionListSearchModelFields({
			cfg,
			key,
			entry,
			rowContext: searchRowContext
		}), search);
	});
	if (activeMinutes !== void 0) {
		const cutoff = now - activeMinutes * 6e4;
		entries = entries.filter(([, entry]) => (entry?.updatedAt ?? 0) >= cutoff);
	}
	return entries;
}
function isPhantomAgentStoreListEntry(key, entry) {
	return require_session_key.parseAgentSessionKey(key)?.rest === "sessions" && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.sessionId) && entry?.updatedAt == null;
}
function selectSessionEntries(params) {
	const filtered = filterSessionEntries(params);
	const limit = resolveSessionsListLimit(params.opts, params.defaultLimit);
	const offset = resolveSessionsListOffset(params.opts);
	const sortedWindow = sortAndLimitSessionEntries(filtered, resolveSessionsListWindowLimit(limit, offset), params.opts.sortBy);
	const entries = limit === void 0 ? sortedWindow.slice(offset) : sortedWindow.slice(offset, offset + limit);
	const nextOffset = offset + entries.length;
	const hasMore = nextOffset < filtered.length;
	return {
		entries,
		totalCount: filtered.length,
		limitApplied: limit,
		offset,
		nextOffset: hasMore ? nextOffset : null,
		hasMore
	};
}
function filterAndSortSessionEntries(params) {
	return selectSessionEntries(params).entries;
}
function listSessionsFromStore(params) {
	const { cfg, storePath, store, opts } = params;
	const now = Date.now();
	const sessionListTranscriptUsageMaxBytes = 64 * 1024;
	const sessionListTranscriptFieldRows = 100;
	let rowContext;
	const getRowContext = () => {
		rowContext ??= buildSessionListRowContext({
			store,
			now
		});
		return rowContext;
	};
	const includeDerivedTitles = opts.includeDerivedTitles === true;
	const includeLastMessage = opts.includeLastMessage === true;
	const hasSpawnedByFilter = typeof opts.spawnedBy === "string" && opts.spawnedBy.length > 0;
	const { entries, totalCount, limitApplied, offset, nextOffset, hasMore } = selectSessionEntries({
		cfg,
		store,
		opts,
		now,
		getRowContext: hasSpawnedByFilter || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.search) ? getRowContext : void 0,
		defaultLimit: SESSIONS_LIST_DEFAULT_LIMIT
	});
	const fullRowContext = rowContext || hasSpawnedByFilter || entries.length > SESSIONS_LIST_YIELD_BATCH_SIZE ? getRowContext() : void 0;
	const sharedRowContext = fullRowContext ?? (entries.length > 0 ? buildSessionListRowMetadataContext({ now }) : void 0);
	const sessions = entries.map(([key, entry], index) => {
		const includeTranscriptFields = index < sessionListTranscriptFieldRows;
		const rowAgentId = key === "global" && typeof opts.agentId === "string" ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agentId) : void 0;
		const storeChildSessionsByKey = fullRowContext?.storeChildSessionsByKey ?? buildSingleRowStoreChildSessionsByKey({
			store,
			storePath,
			key,
			now
		});
		return buildGatewaySessionRow({
			cfg,
			storePath,
			store,
			key,
			entry,
			agentId: rowAgentId,
			modelCatalog: params.modelCatalog,
			now,
			includeDerivedTitles: includeTranscriptFields && includeDerivedTitles,
			includeLastMessage: includeTranscriptFields && includeLastMessage,
			transcriptUsageMaxBytes: sessionListTranscriptUsageMaxBytes,
			storeChildSessionsByKey,
			rowContext: sharedRowContext
		});
	});
	return {
		ts: now,
		path: storePath,
		count: sessions.length,
		totalCount,
		limitApplied,
		offset: offset > 0 ? offset : void 0,
		nextOffset,
		hasMore,
		defaults: getSessionDefaults(cfg, params.modelCatalog, { allowPluginNormalization: false }),
		sessions
	};
}
/**
* Async version of listSessionsFromStore that yields to the event loop between
* batches of session row builds. This prevents large session stores from
* blocking the event loop during sessions.list requests.
*
* The synchronous file I/O in readSessionTitleFieldsFromTranscript (head/tail
* reads for derived titles and last-message previews) is the dominant blocker.
* By yielding every SESSIONS_LIST_YIELD_BATCH_SIZE rows, we keep the event
* loop responsive for WebSocket heartbeats, channel I/O, and concurrent RPC.
*/
async function listSessionsFromStoreAsync(params) {
	return require_runtime_workspace_state.withPinnedActivePluginRegistryWorkspaceDir(async () => {
		const { cfg, storePath, store, opts } = params;
		const now = Date.now();
		const sessionListTranscriptUsageMaxBytes = 64 * 1024;
		const sessionListTranscriptFieldRows = 100;
		let rowContext;
		const getRowContext = () => {
			rowContext ??= buildSessionListRowContext({
				store,
				now
			});
			return rowContext;
		};
		const includeDerivedTitles = opts.includeDerivedTitles === true;
		const includeLastMessage = opts.includeLastMessage === true;
		const hasSpawnedByFilter = typeof opts.spawnedBy === "string" && opts.spawnedBy.length > 0;
		const { entries, totalCount, limitApplied, offset, nextOffset, hasMore } = selectSessionEntries({
			cfg,
			store,
			opts,
			now,
			getRowContext: hasSpawnedByFilter || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.search) ? getRowContext : void 0,
			defaultLimit: SESSIONS_LIST_DEFAULT_LIMIT
		});
		const fullRowContext = rowContext || hasSpawnedByFilter || entries.length > SESSIONS_LIST_YIELD_BATCH_SIZE ? getRowContext() : void 0;
		const sharedRowContext = fullRowContext ?? (entries.length > 0 ? buildSessionListRowMetadataContext({ now }) : void 0);
		const sessions = [];
		for (let i = 0; i < entries.length; i++) {
			const [key, entry] = (0, _gabrielvfonseca_normalization_core.expectDefined)(entries[i], "entries entry at i");
			const includeTranscriptFields = i < sessionListTranscriptFieldRows;
			const rowAgentId = key === "global" && typeof opts.agentId === "string" ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agentId) : void 0;
			const storeChildSessionsByKey = fullRowContext?.storeChildSessionsByKey ?? buildSingleRowStoreChildSessionsByKey({
				store,
				storePath,
				key,
				now
			});
			const row = buildGatewaySessionRow({
				cfg,
				storePath,
				store,
				key,
				entry,
				agentId: rowAgentId,
				modelCatalog: params.modelCatalog,
				now,
				includeDerivedTitles: false,
				includeLastMessage: false,
				transcriptUsageMaxBytes: sessionListTranscriptUsageMaxBytes,
				storeChildSessionsByKey,
				rowContext: sharedRowContext,
				skipTranscriptUsageFallback: true,
				lightweightListRow: true
			});
			if (entry?.sessionId && includeTranscriptFields && (includeDerivedTitles || includeLastMessage)) {
				const parsed = require_session_key.parseAgentSessionKey(key);
				const fields = await require_session_transcript_readers.readSessionTitleFieldsFromTranscriptAsync({
					agentId: rowAgentId ?? (parsed?.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) : require_agent_scope_config.resolveDefaultAgentId(cfg)),
					sessionEntry: entry,
					sessionId: entry.sessionId,
					sessionKey: key,
					storePath
				});
				if (includeDerivedTitles) row.derivedTitle = deriveSessionTitle(entry, fields.firstUserMessage);
				if (includeLastMessage && fields.lastMessagePreview) row.lastMessagePreview = fields.lastMessagePreview;
			}
			sessions.push(row);
			if ((i + 1) % SESSIONS_LIST_YIELD_BATCH_SIZE === 0 && i + 1 < entries.length) await new Promise((resolve) => {
				setImmediate(resolve);
			});
		}
		return {
			ts: now,
			path: storePath,
			count: sessions.length,
			totalCount,
			limitApplied,
			offset: offset > 0 ? offset : void 0,
			nextOffset,
			hasMore,
			defaults: getSessionDefaults(cfg, params.modelCatalog, { allowPluginNormalization: false }),
			sessions
		};
	});
}
//#endregion
Object.defineProperty(exports, "buildGatewaySessionInfo", {
	enumerable: true,
	get: function() {
		return buildGatewaySessionInfo;
	}
});
Object.defineProperty(exports, "buildGatewaySessionRow", {
	enumerable: true,
	get: function() {
		return buildGatewaySessionRow;
	}
});
Object.defineProperty(exports, "bumpSessionAutomationVersion", {
	enumerable: true,
	get: function() {
		return bumpSessionAutomationVersion;
	}
});
Object.defineProperty(exports, "claimSessionAutomationEpoch", {
	enumerable: true,
	get: function() {
		return claimSessionAutomationEpoch;
	}
});
Object.defineProperty(exports, "deriveSessionTitle", {
	enumerable: true,
	get: function() {
		return deriveSessionTitle;
	}
});
Object.defineProperty(exports, "disableCronJobsBoundToSession", {
	enumerable: true,
	get: function() {
		return disableCronJobsBoundToSession;
	}
});
Object.defineProperty(exports, "filterAndSortSessionEntries", {
	enumerable: true,
	get: function() {
		return filterAndSortSessionEntries;
	}
});
Object.defineProperty(exports, "getSessionDefaults", {
	enumerable: true,
	get: function() {
		return getSessionDefaults;
	}
});
Object.defineProperty(exports, "listAgentsForGateway", {
	enumerable: true,
	get: function() {
		return listAgentsForGateway;
	}
});
Object.defineProperty(exports, "listSessionsFromStore", {
	enumerable: true,
	get: function() {
		return listSessionsFromStore;
	}
});
Object.defineProperty(exports, "listSessionsFromStoreAsync", {
	enumerable: true,
	get: function() {
		return listSessionsFromStoreAsync;
	}
});
Object.defineProperty(exports, "loadGatewaySessionRow", {
	enumerable: true,
	get: function() {
		return loadGatewaySessionRow;
	}
});
Object.defineProperty(exports, "loadSessionEntry", {
	enumerable: true,
	get: function() {
		return loadSessionEntry;
	}
});
Object.defineProperty(exports, "migrateAndPruneGatewaySessionStoreKey", {
	enumerable: true,
	get: function() {
		return migrateAndPruneGatewaySessionStoreKey;
	}
});
Object.defineProperty(exports, "registerSessionAutomationSource", {
	enumerable: true,
	get: function() {
		return registerSessionAutomationSource;
	}
});
Object.defineProperty(exports, "resolveCronJobBoundSessionKeys", {
	enumerable: true,
	get: function() {
		return resolveCronJobBoundSessionKeys;
	}
});
Object.defineProperty(exports, "resolveDeletedAgentIdFromSessionKey", {
	enumerable: true,
	get: function() {
		return resolveDeletedAgentIdFromSessionKey;
	}
});
Object.defineProperty(exports, "resolveFreshestSessionEntryFromStoreKeys", {
	enumerable: true,
	get: function() {
		return resolveFreshestSessionEntryFromStoreKeys;
	}
});
Object.defineProperty(exports, "resolveGatewayModelSupportsImages", {
	enumerable: true,
	get: function() {
		return resolveGatewayModelSupportsImages;
	}
});
Object.defineProperty(exports, "resolveGatewaySessionStoreTarget", {
	enumerable: true,
	get: function() {
		return resolveGatewaySessionStoreTarget;
	}
});
Object.defineProperty(exports, "resolveGatewaySessionStoreTargetWithStore", {
	enumerable: true,
	get: function() {
		return resolveGatewaySessionStoreTargetWithStore;
	}
});
Object.defineProperty(exports, "resolveGatewaySessionThinkingProjection", {
	enumerable: true,
	get: function() {
		return resolveGatewaySessionThinkingProjection;
	}
});
Object.defineProperty(exports, "resolveSessionDisplayModelIdentityRef", {
	enumerable: true,
	get: function() {
		return resolveSessionDisplayModelIdentityRef;
	}
});
Object.defineProperty(exports, "session_utils_exports", {
	enumerable: true,
	get: function() {
		return session_utils_exports;
	}
});
Object.defineProperty(exports, "unregisterSessionAutomationSource", {
	enumerable: true,
	get: function() {
		return unregisterSessionAutomationSource;
	}
});
