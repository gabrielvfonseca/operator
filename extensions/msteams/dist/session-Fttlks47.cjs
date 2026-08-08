const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_reset = require("./reset-DL3L8VC3.cjs");
const require_bootstrap_cache = require("./bootstrap-cache-CaqmJxMO.cjs");
const require_entry_freshness = require("./entry-freshness-DzG9sDbU.cjs");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/cron/isolated-agent/session.ts
/** Resolves session rollover and carried state for isolated cron runs. */
const FRESH_CRON_CARRIED_PREFERENCE_FIELDS = [
	"heartbeatTaskState",
	"chatType",
	"thinkingLevel",
	"fastMode",
	"verboseLevel",
	"traceLevel",
	"reasoningLevel",
	"ttsAuto",
	"responseUsage",
	"pinnedAt",
	"label",
	"displayName"
];
const AMBIENT_SESSION_CONTEXT_FIELDS = [
	"elevatedLevel",
	"groupActivation",
	"groupActivationNeedsSystemIntro",
	"sendPolicy",
	"queueMode",
	"queueDebounceMs",
	"queueCap",
	"queueDrop",
	"channel",
	"groupId",
	"subject",
	"groupChannel",
	"space",
	"origin",
	"acp"
];
function cloneSessionField(value) {
	return globalThis.structuredClone(value);
}
function copySessionFields(target, entry, fields) {
	for (const field of fields) if (entry[field] !== void 0) target[field] = cloneSessionField(entry[field]);
}
function preserveNonAutoModelOverride(target, entry) {
	const recoveredAutoFallbackOverride = entry.modelOverrideSource === void 0 && require_agent_scope.hasSessionAutoModelFallbackProvenance(entry);
	if (entry.modelOverrideSource !== "auto" && !recoveredAutoFallbackOverride) {
		let preservedModelSelection = false;
		if (entry.modelOverride !== void 0) {
			target.modelOverride = entry.modelOverride;
			preservedModelSelection = true;
		}
		if (entry.providerOverride !== void 0) target.providerOverride = entry.providerOverride;
		if (entry.modelOverrideSource !== void 0) target.modelOverrideSource = entry.modelOverrideSource;
		if (preservedModelSelection && entry.agentRuntimeOverride !== void 0) target.agentRuntimeOverride = entry.agentRuntimeOverride;
	}
}
function preserveUserAuthOverride(target, entry) {
	if (entry.authProfileOverrideSource === "user") {
		if (entry.authProfileOverride !== void 0) target.authProfileOverride = entry.authProfileOverride;
		target.authProfileOverrideSource = entry.authProfileOverrideSource;
		if (entry.authProfileOverrideCompactionCount !== void 0) target.authProfileOverrideCompactionCount = entry.authProfileOverrideCompactionCount;
	}
}
function sanitizeFreshCronSessionEntry(entry, options) {
	const next = {};
	copySessionFields(next, entry, FRESH_CRON_CARRIED_PREFERENCE_FIELDS);
	if (options.preserveAmbientContext) copySessionFields(next, entry, AMBIENT_SESSION_CONTEXT_FIELDS);
	preserveNonAutoModelOverride(next, entry);
	preserveUserAuthOverride(next, entry);
	return next;
}
/**
* Reads the current cron session row without an in-process cache snapshot.
* Lifecycle admission guards compare this against the run's initial entry, so
* the read must bypass cached store snapshots (accessor readConsistency
* "latest"). Cron keys are canonicalized before use, so accessor key
* resolution selects the same row the cron persist path writes.
*/
function loadCronSessionEntryLatest(storePath, sessionKey) {
	return require_session_accessor.loadSessionEntry({
		sessionKey,
		storePath,
		readConsistency: "latest"
	});
}
/** Resolves or rolls over the cron session entry for one isolated-agent run. */
function resolveCronSession(params) {
	const sessionCfg = params.cfg.session;
	const storePath = require_paths.resolveStorePath(sessionCfg?.store, { agentId: params.agentId });
	const store = params.store ?? Object.fromEntries(require_session_accessor.listSessionEntries({ storePath }).map(({ sessionKey, entry }) => [sessionKey, entry]));
	const sourceSessionKey = params.sourceSessionKey?.trim();
	const sourceSessionDiffers = Boolean(sourceSessionKey && sourceSessionKey !== params.sessionKey);
	const targetEntry = store[params.sessionKey];
	const entry = store[sourceSessionKey || params.sessionKey];
	const archivedSessionError = require_lifecycle.resolveSessionWorkStartError(params.sessionKey, targetEntry);
	if (archivedSessionError) throw new Error(archivedSessionError);
	let sessionId;
	let isNewSession;
	let systemSent;
	if (!params.forceNew && entry?.sessionId) {
		const resetPolicy = require_reset.resolveSessionResetPolicy({
			sessionCfg,
			resetType: "direct"
		});
		if ((resetPolicy.configured !== true && require_entry_freshness.hasProviderOwnedSession(entry) ? { fresh: true } : require_reset.evaluateSessionFreshness({
			updatedAt: entry.updatedAt,
			...require_lifecycle.resolveSessionLifecycleTimestamps({
				entry,
				agentId: params.agentId,
				storePath
			}),
			now: params.nowMs,
			policy: resetPolicy
		})).fresh) {
			sessionId = entry.sessionId;
			isNewSession = false;
			systemSent = entry.systemSent ?? false;
		} else {
			sessionId = node_crypto.default.randomUUID();
			isNewSession = true;
			systemSent = false;
		}
	} else {
		sessionId = node_crypto.default.randomUUID();
		isNewSession = true;
		systemSent = false;
	}
	const previousSessionId = isNewSession && !sourceSessionDiffers ? entry?.sessionId : void 0;
	require_bootstrap_cache.clearBootstrapSnapshotOnSessionRollover({
		sessionKey: params.sessionKey,
		previousSessionId
	});
	const baseEntry = entry ? isNewSession ? sanitizeFreshCronSessionEntry(entry, { preserveAmbientContext: !params.forceNew }) : entry : void 0;
	const lifecycleRevision = node_crypto.default.randomUUID();
	return {
		storePath,
		store,
		sessionEntry: {
			...baseEntry,
			sessionId,
			lifecycleRevision,
			updatedAt: params.nowMs,
			sessionStartedAt: isNewSession ? params.nowMs : baseEntry?.sessionStartedAt ?? require_lifecycle.resolveSessionLifecycleTimestamps({
				entry,
				agentId: params.agentId,
				storePath
			}).sessionStartedAt,
			lastInteractionAt: isNewSession ? params.nowMs : baseEntry?.lastInteractionAt,
			...params.hookExternalContentSource ? { hookExternalContentSource: params.hookExternalContentSource } : {},
			systemSent
		},
		lifecycleRevision,
		systemSent,
		isNewSession,
		previousSessionId,
		initialSessionEntry: targetEntry
	};
}
//#endregion
Object.defineProperty(exports, "loadCronSessionEntryLatest", {
	enumerable: true,
	get: function() {
		return loadCronSessionEntryLatest;
	}
});
Object.defineProperty(exports, "resolveCronSession", {
	enumerable: true,
	get: function() {
		return resolveCronSession;
	}
});
