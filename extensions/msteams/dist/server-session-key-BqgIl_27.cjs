const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_session_id_resolution = require("./session-id-resolution-CYXapfNW.cjs");
require("./session-utils-eOXJCZME.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/server-session-key.ts
var server_session_key_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resetResolvedSessionKeyForRunCacheForTest: () => resetResolvedSessionKeyForRunCacheForTest,
	resolveSessionKeyForRun: () => resolveSessionKeyForRun
});
const RUN_LOOKUP_CACHE_LIMIT = 256;
const RUN_LOOKUP_MISS_TTL_MS = 1e3;
const resolvedSessionKeyByRunId = /* @__PURE__ */ new Map();
function runLookupCacheKey(runId, agentId) {
	return `${agentId}\0${runId}`;
}
function setResolvedSessionKeyCache(runId, agentId, sessionKey) {
	if (!runId) return;
	const cacheKey = runLookupCacheKey(runId, agentId);
	if (!resolvedSessionKeyByRunId.has(cacheKey) && resolvedSessionKeyByRunId.size >= RUN_LOOKUP_CACHE_LIMIT) {
		const oldest = resolvedSessionKeyByRunId.keys().next().value;
		if (oldest) resolvedSessionKeyByRunId.delete(oldest);
	}
	let expiresAt = null;
	if (sessionKey === null) {
		const missExpiresAt = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(RUN_LOOKUP_MISS_TTL_MS);
		if (missExpiresAt === void 0) return;
		expiresAt = missExpiresAt;
	}
	resolvedSessionKeyByRunId.set(cacheKey, {
		sessionKey,
		expiresAt
	});
}
function sessionKeyMatchesAgent(sessionKey, agentId, cfg) {
	if (cfg.session?.scope === "global" && sessionKey.trim().toLowerCase() === "global") return true;
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	if (!require_session_key.parseAgentSessionKey(sessionKey) && sessionKey.trim().toLowerCase().startsWith("agent:")) return false;
	return require_session_accessor.resolveSessionStoreAgentId(cfg, require_session_accessor.resolveSessionStoreKey({
		cfg,
		sessionKey,
		storeAgentId: agentId
	})) === normalizedAgentId;
}
function resolveRunSessionKeyForCaller(storeKey) {
	return require_session_key.toAgentRequestSessionKey(storeKey) ?? storeKey;
}
/** Resolves the caller-facing session key for an active or recently persisted run id. */
function resolveSessionKeyForRun(runId, opts = {}) {
	const cfg = require_io.getRuntimeConfig();
	const explicitAgentId = typeof opts.agentId === "string" && opts.agentId.trim() ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts.agentId) : void 0;
	const cached = require_agent_events.getAgentRunContext(runId)?.sessionKey;
	if (!explicitAgentId && cached) return cached;
	const requestedAgentId = explicitAgentId ?? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(require_agent_scope_config.resolveDefaultAgentId(cfg));
	const cacheAgentId = requestedAgentId;
	if (cached && sessionKeyMatchesAgent(cached, requestedAgentId, cfg)) {
		const sessionKey = resolveRunSessionKeyForCaller(cached);
		setResolvedSessionKeyCache(runId, cacheAgentId, sessionKey);
		return sessionKey;
	}
	const cacheKey = runLookupCacheKey(runId, cacheAgentId);
	const cachedLookup = resolvedSessionKeyByRunId.get(cacheKey);
	if (cachedLookup !== void 0) {
		if (cachedLookup.sessionKey !== null) return cachedLookup.sessionKey;
		const expiresAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(cachedLookup.expiresAt);
		const now = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(Date.now());
		if (expiresAt !== void 0 && now !== void 0 && expiresAt > now) return;
		resolvedSessionKeyByRunId.delete(cacheKey);
	}
	const { store } = require_sessions.loadCombinedSessionStoreForGateway(cfg, { agentId: requestedAgentId });
	const storeKey = require_session_id_resolution.resolvePreferredSessionKeyForSessionIdMatches(Object.entries(store).filter((entry) => entry[1]?.sessionId === runId && sessionKeyMatchesAgent(entry[0], requestedAgentId, cfg)), runId);
	if (storeKey) {
		const sessionKey = resolveRunSessionKeyForCaller(storeKey);
		setResolvedSessionKeyCache(runId, cacheAgentId, sessionKey);
		return sessionKey;
	}
	setResolvedSessionKeyCache(runId, cacheAgentId, null);
}
/** Clears the run lookup cache for tests that mutate session stores. */
function resetResolvedSessionKeyForRunCacheForTest() {
	resolvedSessionKeyByRunId.clear();
}
//#endregion
Object.defineProperty(exports, "resolveSessionKeyForRun", {
	enumerable: true,
	get: function() {
		return resolveSessionKeyForRun;
	}
});
Object.defineProperty(exports, "server_session_key_exports", {
	enumerable: true,
	get: function() {
		return server_session_key_exports;
	}
});
