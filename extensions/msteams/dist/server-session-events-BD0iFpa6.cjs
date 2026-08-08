require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_session_id_resolution = require("./session-id-resolution-CYXapfNW.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_session_transcript_files_fs = require("./session-transcript-files.fs-DYt0TgFR.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_session_transcript_path = require("./session-transcript-path-Tiv6cj9y.cjs");
const require_session_active_runs = require("./session-active-runs-DHK8blJg.cjs");
const require_session_event_payload = require("./session-event-payload-CuPlulwC.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/session-transcript-key.ts
const TRANSCRIPT_SESSION_KEY_CACHE = /* @__PURE__ */ new Map();
const TRANSCRIPT_SESSION_KEY_CACHE_MAX = 256;
function sessionKeyMatchesTranscriptPath(params) {
	const entry = params.store[params.key];
	if (!entry?.sessionId) return false;
	const target = require_session_utils.resolveGatewaySessionStoreTarget({
		cfg: params.cfg,
		key: params.key,
		store: params.store
	});
	const sessionAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId);
	return require_session_transcript_files_fs.resolveSessionTranscriptCandidates(entry.sessionId, target.storePath, entry.sessionFile, sessionAgentId).some((candidate) => require_session_transcript_path.resolveTranscriptPathForComparison(candidate) === params.targetPath);
}
/** Resolve the most likely Gateway session key for a transcript file path. */
function resolveSessionKeyForTranscriptFile(sessionFile) {
	const targetPath = require_session_transcript_path.resolveTranscriptPathForComparison(sessionFile);
	if (!targetPath) return;
	const cfg = require_io.getRuntimeConfig();
	const { store } = require_sessions.loadCombinedSessionStoreForGateway(cfg);
	const cachedKey = TRANSCRIPT_SESSION_KEY_CACHE.get(targetPath);
	if (cachedKey && sessionKeyMatchesTranscriptPath({
		cfg,
		store,
		key: cachedKey,
		targetPath
	})) return cachedKey;
	const matchingEntries = [];
	for (const [key, entry] of Object.entries(store)) {
		if (!entry?.sessionId || key === cachedKey) continue;
		if (sessionKeyMatchesTranscriptPath({
			cfg,
			store,
			key,
			targetPath
		})) matchingEntries.push([key, entry]);
	}
	if (matchingEntries.length > 0) {
		const matchesBySessionId = /* @__PURE__ */ new Map();
		for (const entry of matchingEntries) {
			const sessionId = entry[1].sessionId;
			if (!sessionId) continue;
			const group = matchesBySessionId.get(sessionId);
			if (group) group.push(entry);
			else matchesBySessionId.set(sessionId, [entry]);
		}
		const resolvedMatches = Array.from(matchesBySessionId.entries()).map(([sessionId, matches]) => {
			const resolvedKey = require_session_id_resolution.resolvePreferredSessionKeyForSessionIdMatches(matches, sessionId) ?? matches[0]?.[0];
			const resolvedEntry = resolvedKey ? matches.find(([key]) => key === resolvedKey)?.[1] : void 0;
			return resolvedKey && resolvedEntry ? {
				key: resolvedKey,
				updatedAt: resolvedEntry.updatedAt ?? 0
			} : void 0;
		}).filter((match) => match !== void 0);
		const [freshestMatch, secondFreshestMatch] = [...resolvedMatches].toSorted((a, b) => b.updatedAt - a.updatedAt);
		const resolvedKey = resolvedMatches.length === 1 ? freshestMatch?.key : (freshestMatch?.updatedAt ?? 0) > (secondFreshestMatch?.updatedAt ?? 0) ? freshestMatch?.key : void 0;
		if (resolvedKey) {
			if (!TRANSCRIPT_SESSION_KEY_CACHE.has(targetPath) && TRANSCRIPT_SESSION_KEY_CACHE.size >= TRANSCRIPT_SESSION_KEY_CACHE_MAX) {
				const oldest = TRANSCRIPT_SESSION_KEY_CACHE.keys().next().value;
				if (oldest !== void 0) TRANSCRIPT_SESSION_KEY_CACHE.delete(oldest);
			}
			TRANSCRIPT_SESSION_KEY_CACHE.set(targetPath, resolvedKey);
			return resolvedKey;
		}
	}
	TRANSCRIPT_SESSION_KEY_CACHE.delete(targetPath);
}
//#endregion
//#region src/gateway/server-session-events.ts
function readMessageIdempotencyKey(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return;
	const value = message.idempotencyKey;
	return typeof value === "string" && value.trim() ? value : void 0;
}
function readMessageSenderIsOwner(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return;
	const openclaw = message["__openclaw"];
	if (!openclaw || typeof openclaw !== "object" || Array.isArray(openclaw)) return;
	const value = openclaw.senderIsOwner;
	return typeof value === "boolean" ? value : void 0;
}
function resolveSessionMessageBroadcastKeys(sessionKey, agentId) {
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(agentId);
	if (sessionKey === "global") {
		const defaultAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(require_io.getRuntimeConfig()));
		if (normalizedAgentId) {
			const scopedKey = `agent:${(0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(normalizedAgentId)}:global`;
			return (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(normalizedAgentId) === defaultAgentId ? [scopedKey, sessionKey] : [scopedKey];
		}
		return [`agent:${defaultAgentId}:global`, sessionKey];
	}
	return [sessionKey];
}
function buildGatewaySessionSnapshot(params) {
	const { sessionRow } = params;
	if (!sessionRow) return {};
	const session = params.includeSession ? {
		...require_session_event_payload.buildGatewaySessionEventRow(sessionRow),
		thinkingLevel: sessionRow.thinkingLevel ?? null
	} : void 0;
	if (session && sessionRow.key === "global" && !params.agentId) delete session.goal;
	if (session && params.hasActiveRun !== void 0) session.hasActiveRun = params.hasActiveRun;
	if (session && params.activeRunIds !== void 0) session.activeRunIds = params.activeRunIds;
	return {
		...session ? { session } : {},
		...require_session_event_payload.buildGatewaySessionEventFields({
			sessionRow,
			agentId: params.agentId,
			label: params.label,
			displayName: params.displayName,
			parentSessionKey: params.parentSessionKey,
			hasActiveRun: params.hasActiveRun,
			activeRunIds: params.activeRunIds
		}),
		subagentRunState: sessionRow.subagentRunState,
		hasActiveSubagentRun: sessionRow.hasActiveSubagentRun
	};
}
/** Creates a serialized transcript-update broadcaster for session websocket clients. */
function createTranscriptUpdateBroadcastHandler(params) {
	let broadcastQueue = Promise.resolve();
	return (update) => {
		broadcastQueue = broadcastQueue.then(() => handleTranscriptUpdateBroadcast(params, update)).catch(() => void 0);
	};
}
async function handleTranscriptUpdateBroadcast(params, update) {
	const sqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(update.sessionFile);
	const storageAgentId = update.target?.agentId ?? update.agentId ?? sqliteMarker?.agentId;
	const sessionKey = update.target?.sessionKey ?? update.sessionKey ?? (sqliteMarker ? require_session_accessor.resolveTranscriptSessionKeyBySessionId({
		agentId: storageAgentId,
		sessionId: sqliteMarker.sessionId,
		storePath: sqliteMarker.storePath
	}) : void 0) ?? (update.sessionFile ? resolveSessionKeyForTranscriptFile(update.sessionFile) : void 0);
	if (!sessionKey || update.message === void 0) return;
	const effectiveAgentId = update.target?.agentId ?? update.agentId;
	const defaultGlobalAgentId = sessionKey === "global" ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(require_io.getRuntimeConfig())) : void 0;
	const visibleAgentId = effectiveAgentId ?? (effectiveAgentId && effectiveAgentId !== defaultGlobalAgentId ? effectiveAgentId : void 0);
	const connIds = /* @__PURE__ */ new Set();
	for (const connId of params.sessionEventSubscribers.getAll()) connIds.add(connId);
	for (const broadcastKey of resolveSessionMessageBroadcastKeys(sessionKey, effectiveAgentId)) for (const connId of params.sessionMessageSubscribers.get(broadcastKey)) connIds.add(connId);
	if (connIds.size === 0) return;
	let messageSeq = (0, _gabrielvfonseca_normalization_core_number_coercion.asPositiveSafeInteger)(update.messageSeq);
	if (messageSeq === void 0) {
		const markerEntry = sqliteMarker ? require_session_accessor.loadSessionEntry({
			agentId: storageAgentId,
			sessionKey,
			storePath: sqliteMarker.storePath
		}) : void 0;
		const fallbackTarget = markerEntry ? void 0 : require_session_utils.loadSessionEntry(sessionKey, { agentId: visibleAgentId });
		const entry = markerEntry ?? fallbackTarget?.entry;
		const storePath = sqliteMarker?.storePath ?? fallbackTarget?.storePath;
		messageSeq = entry?.sessionId ? (0, _gabrielvfonseca_normalization_core_number_coercion.asPositiveSafeInteger)(await require_session_transcript_readers.readSessionMessageCountAsync({
			agentId: storageAgentId ?? visibleAgentId,
			sessionEntry: entry,
			sessionId: entry.sessionId,
			sessionKey,
			storePath
		})) : void 0;
	}
	const sessionRow = require_session_utils.loadGatewaySessionRow(sessionKey, {
		agentId: visibleAgentId,
		transcriptUsageMaxBytes: 64 * 1024
	});
	const activeRunState = sessionRow ? require_session_active_runs.resolveVisibleActiveSessionRunState({
		context: params,
		requestedKey: sessionKey,
		canonicalKey: sessionRow.key,
		sessionId: sessionRow.sessionId,
		...sessionRow.key === "global" && visibleAgentId ? { agentId: visibleAgentId } : {},
		defaultAgentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(require_io.getRuntimeConfig()))
	}) : null;
	const sessionSnapshot = buildGatewaySessionSnapshot({
		sessionRow,
		agentId: visibleAgentId,
		includeSession: true,
		hasActiveRun: activeRunState?.active,
		activeRunIds: activeRunState?.runIds
	});
	const idempotencyKey = readMessageIdempotencyKey(update.message);
	const senderIsOwner = readMessageSenderIsOwner(update.message);
	const message = require_session_transcript_path.projectChatDisplayMessage(require_session_transcript_readers.attachOperatorTranscriptMeta(update.message, {
		...typeof update.messageId === "string" ? { id: update.messageId } : {},
		...idempotencyKey ? { idempotencyKey } : {},
		...messageSeq !== void 0 ? { seq: messageSeq } : {}
	}));
	if (message) {
		params.broadcastToConnIds("session.message", {
			sessionKey,
			...senderIsOwner === void 0 ? {} : { senderIsOwner },
			...visibleAgentId ? { agentId: visibleAgentId } : {},
			message,
			...typeof update.messageId === "string" ? { messageId: update.messageId } : {},
			...messageSeq !== void 0 ? { messageSeq } : {},
			...sessionSnapshot
		}, connIds, { dropIfSlow: true });
		return;
	}
	const sessionEventConnIds = params.sessionEventSubscribers.getAll();
	if (sessionEventConnIds.size === 0) return;
	params.broadcastToConnIds("sessions.changed", {
		sessionKey,
		...visibleAgentId ? { agentId: visibleAgentId } : {},
		phase: "message",
		ts: Date.now(),
		...typeof update.messageId === "string" ? { messageId: update.messageId } : {},
		...messageSeq !== void 0 ? { messageSeq } : {},
		...sessionSnapshot
	}, sessionEventConnIds, { dropIfSlow: true });
}
/** Creates a lifecycle-event broadcaster for session list refreshes. */
function createLifecycleEventBroadcastHandler(params) {
	return (event) => {
		const connIds = params.sessionEventSubscribers.getAll();
		if (connIds.size === 0) return;
		const sessionRow = require_session_utils.loadGatewaySessionRow(event.sessionKey);
		const activeRunState = sessionRow ? require_session_active_runs.resolveVisibleActiveSessionRunState({
			context: params,
			requestedKey: event.sessionKey,
			canonicalKey: sessionRow.key,
			sessionId: sessionRow.sessionId,
			defaultAgentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(require_io.getRuntimeConfig()))
		}) : null;
		params.broadcastToConnIds("sessions.changed", {
			sessionKey: event.sessionKey,
			reason: event.reason,
			parentSessionKey: event.parentSessionKey,
			label: event.label,
			displayName: event.displayName,
			ts: Date.now(),
			...buildGatewaySessionSnapshot({
				sessionRow,
				label: event.label,
				displayName: event.displayName,
				parentSessionKey: event.parentSessionKey,
				hasActiveRun: activeRunState?.active,
				activeRunIds: activeRunState?.runIds
			})
		}, connIds, { dropIfSlow: true });
	};
}
//#endregion
exports.createLifecycleEventBroadcastHandler = createLifecycleEventBroadcastHandler;
exports.createTranscriptUpdateBroadcastHandler = createTranscriptUpdateBroadcastHandler;
