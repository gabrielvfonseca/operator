require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_transcript_events = require("./transcript-events-C9OOwQkF.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_session_transcript_files_fs = require("./session-transcript-files.fs-DYt0TgFR.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
require("./http-utils-C_86u7P2.cjs");
const require_session_transcript_path = require("./session-transcript-path-Tiv6cj9y.cjs");
const require_session_history_state = require("./session-history-state-D6SjkdT4.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/sessions-history-http.ts
const log = require_subsystem.createSubsystemLogger("gateway/sessions-history-sse");
const MAX_SESSION_HISTORY_LIMIT = 1e3;
function resolveSessionHistoryPath(req) {
	const match = new URL(req.url ?? "/", "http://localhost").pathname.match(/^\/sessions\/([^/]+)\/history$/);
	if (!match) return null;
	try {
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(decodeURIComponent(match[1] ?? "")) ?? null;
	} catch {
		return "";
	}
}
function shouldStreamSse(req) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_http_auth_utils.getHeader(req, "accept")).includes("text/event-stream");
}
function getRequestUrl(req) {
	return new URL(req.url ?? "/", "http://localhost");
}
function resolveLimit(req) {
	const raw = getRequestUrl(req).searchParams.get("limit");
	if (raw == null || raw.trim() === "") return;
	const trimmed = raw.trim();
	const value = /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
	if (Number.isNaN(value) || value < 1) return 1;
	return Math.min(MAX_SESSION_HISTORY_LIMIT, value);
}
function sseWrite(res, event, payload) {
	res.write(`event: ${event}\n`);
	res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
/** Handle `/sessions/:sessionKey/history` JSON/SSE requests. */
async function handleSessionHistoryHttpRequest(req, res, opts) {
	const sessionKey = resolveSessionHistoryPath(req);
	if (sessionKey === null) return false;
	if (!sessionKey) {
		require_http_common.sendInvalidRequest(res, "invalid session key");
		return true;
	}
	if (req.method !== "GET") {
		require_http_common.sendMethodNotAllowed(res, "GET");
		return true;
	}
	const authResult = await require_http_auth_utils.authorizeScopedGatewayHttpRequestOrReply({
		req,
		res,
		auth: opts.auth,
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: opts.rateLimiter,
		operatorMethod: "chat.history",
		resolveOperatorScopes: require_http_auth_utils.resolveSharedSecretHttpOperatorScopes
	});
	if (!authResult) return true;
	const { cfg } = authResult;
	const target = require_session_utils.resolveGatewaySessionStoreTargetWithStore({
		cfg,
		key: sessionKey
	});
	const entry = require_session_utils.resolveFreshestSessionEntryFromStoreKeys(target.store, target.storeKeys);
	if (!entry?.sessionId) {
		require_http_common.sendJson(res, 404, {
			ok: false,
			error: {
				type: "not_found",
				message: `Session not found: ${sessionKey}`
			}
		});
		return true;
	}
	const limit = resolveLimit(req);
	const cursor = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(getRequestUrl(req).searchParams.get("cursor"));
	const effectiveMaxChars = require_session_transcript_path.DEFAULT_CHAT_HISTORY_TEXT_MAX_CHARS;
	const boundedSnapshot = cursor === void 0 && typeof limit === "number" ? await require_session_transcript_readers.readRecentSessionMessagesWithStatsAsync({
		agentId: target.agentId,
		sessionEntry: entry,
		sessionId: entry.sessionId,
		sessionKey: target.canonicalKey,
		storePath: target.storePath
	}, {
		...require_session_history_state.resolveSessionHistoryTailReadOptions(limit),
		allowResetArchiveFallback: true
	}) : void 0;
	const fullSnapshot = boundedSnapshot === void 0 && entry?.sessionId ? await require_session_transcript_readers.readSessionMessagesWithSourceAsync({
		agentId: target.agentId,
		sessionEntry: entry,
		sessionId: entry.sessionId,
		sessionKey: target.canonicalKey,
		storePath: target.storePath
	}, {
		mode: "full",
		reason: "session history cursor pagination",
		allowResetArchiveFallback: true
	}) : void 0;
	const rawSnapshot = boundedSnapshot?.messages ?? fullSnapshot?.messages ?? [];
	const history = require_session_history_state.buildSessionHistorySnapshot({
		rawMessages: rawSnapshot,
		maxChars: effectiveMaxChars,
		limit,
		cursor,
		rawTranscriptSeq: boundedSnapshot?.totalMessages,
		totalRawMessages: boundedSnapshot?.totalMessages
	}).history;
	if (!shouldStreamSse(req)) {
		require_http_common.sendJson(res, 200, {
			sessionKey: target.canonicalKey,
			...history
		});
		return true;
	}
	const transcriptCandidates = entry?.sessionId ? new Set(require_session_transcript_files_fs.resolveSessionTranscriptCandidates(entry.sessionId, target.storePath, entry.sessionFile, target.agentId).map((candidate) => require_session_transcript_path.resolveTranscriptPathForComparison(candidate)).filter((candidate) => typeof candidate === "string")) : /* @__PURE__ */ new Set();
	let sentHistory = history;
	const sseState = require_session_history_state.SessionHistorySseState.fromRawSnapshot({
		target: {
			agentId: target.agentId,
			sessionEntry: entry,
			sessionId: entry.sessionId,
			sessionKey: target.canonicalKey,
			storePath: target.storePath
		},
		rawMessages: rawSnapshot,
		rawTranscriptSeq: boundedSnapshot?.totalMessages,
		totalRawMessages: boundedSnapshot?.totalMessages,
		transcriptPath: boundedSnapshot?.transcriptPath ?? fullSnapshot?.transcriptPath,
		maxChars: effectiveMaxChars,
		limit,
		cursor
	});
	sentHistory = sseState.snapshot();
	let streamStopped = false;
	let streamQueue = Promise.resolve();
	const streamResources = {};
	function releaseStreamResources() {
		if (streamStopped) return;
		streamStopped = true;
		if (streamResources.heartbeat) clearInterval(streamResources.heartbeat);
		if (streamResources.unsubscribe) streamResources.unsubscribe();
	}
	function detachStreamListeners() {
		req.off("close", handleRequestStreamClose);
		req.off("error", handleRequestStreamError);
		res.off("close", handleResponseStreamClose);
		res.off("finish", handleResponseStreamFinish);
		res.off("error", handleResponseStreamError);
	}
	function closeStream() {
		releaseStreamResources();
		if (!res.writableEnded && !res.destroyed) res.end();
	}
	function handleRequestStreamClose() {
		releaseStreamResources();
		req.off("close", handleRequestStreamClose);
		req.off("error", handleRequestStreamError);
	}
	function handleRequestStreamError(error) {
		log.warn("session history SSE request stream errored; closing stream", { error });
		closeStream();
	}
	function handleResponseStreamFinish() {
		releaseStreamResources();
		res.off("finish", handleResponseStreamFinish);
	}
	function handleResponseStreamClose() {
		releaseStreamResources();
		detachStreamListeners();
	}
	function handleResponseStreamError(error) {
		log.warn("session history SSE response stream errored; cleaning up stream", { error });
		releaseStreamResources();
	}
	const isStreamClosed = () => streamStopped || res.writableEnded || res.destroyed;
	req.on("close", handleRequestStreamClose);
	req.on("error", handleRequestStreamError);
	res.on("close", handleResponseStreamClose);
	res.on("finish", handleResponseStreamFinish);
	res.on("error", handleResponseStreamError);
	require_http_common.setSseHeaders(res);
	res.write("retry: 1000\n\n");
	if (isStreamClosed()) return true;
	sseWrite(res, "history", {
		sessionKey: target.canonicalKey,
		...sentHistory
	});
	if (isStreamClosed()) return true;
	const queueStreamWork = (work) => {
		streamQueue = streamQueue.then(async () => {
			if (streamStopped || res.writableEnded) return;
			await work();
		}).catch((error) => {
			log.warn("session history SSE stream work failed; closing stream", { error });
			closeStream();
		});
	};
	const isStreamStillAuthorized = async () => {
		const cfgLocal = require_io.getRuntimeConfig();
		const currentRequestAuth = await require_http_auth_utils.checkGatewayHttpRequestAuth({
			req,
			auth: opts.getResolvedAuth?.() ?? opts.auth,
			trustedProxies: cfgLocal.gateway?.trustedProxies,
			allowRealIpFallback: cfgLocal.gateway?.allowRealIpFallback,
			rateLimiter: opts.rateLimiter,
			cfg: cfgLocal
		});
		if (!currentRequestAuth.ok) return false;
		return require_method_scopes.authorizeOperatorScopesForMethod("chat.history", require_http_auth_utils.resolveSharedSecretHttpOperatorScopes(req, currentRequestAuth.requestAuth)).allowed;
	};
	streamResources.heartbeat = setInterval(() => {
		queueStreamWork(async () => {
			if (!await isStreamStillAuthorized()) {
				closeStream();
				return;
			}
			if (!res.writableEnded) res.write(": keepalive\n\n");
		});
	}, 15e3);
	streamResources.unsubscribe = require_transcript_events.onInternalSessionTranscriptUpdate((update) => {
		if (!entry?.sessionId) return;
		const updateMatchesIdentity = update.target?.sessionId === entry.sessionId && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(update.target.agentId) === (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId);
		const updatePath = require_session_transcript_path.resolveTranscriptPathForComparison(update.sessionFile);
		if (!updateMatchesIdentity && (!updatePath || !transcriptCandidates.has(updatePath))) return;
		queueStreamWork(async () => {
			if (res.writableEnded) return;
			if (!await isStreamStillAuthorized()) {
				closeStream();
				return;
			}
			if (update.message !== void 0) {
				if (limit === void 0 && cursor === void 0) {
					if (sseState.shouldRefreshForTranscriptPath(updatePath)) {
						sentHistory = await sseState.refreshAsync();
						sseWrite(res, "history", {
							sessionKey: target.canonicalKey,
							...sentHistory
						});
						return;
					}
					const nextEvent = sseState.appendInlineMessage({
						message: update.message,
						messageId: update.messageId,
						messageSeq: update.messageSeq
					});
					if (!nextEvent) return;
					if (nextEvent.shouldRefresh) {
						sentHistory = await sseState.refreshAsync();
						sseWrite(res, "history", {
							sessionKey: target.canonicalKey,
							...sentHistory
						});
						return;
					}
					if (nextEvent.message === void 0) return;
					sentHistory = sseState.snapshot();
					sseWrite(res, "message", {
						sessionKey: target.canonicalKey,
						message: nextEvent.message,
						...typeof update.messageId === "string" ? { messageId: update.messageId } : {},
						messageSeq: nextEvent.messageSeq
					});
					return;
				}
			}
			sentHistory = await sseState.refreshAsync();
			sseWrite(res, "history", {
				sessionKey: target.canonicalKey,
				...sentHistory
			});
		});
	});
	return true;
}
//#endregion
exports.handleSessionHistoryHttpRequest = handleSessionHistoryHttpRequest;
