const require_session_key = require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_subagent_registry_read = require("./subagent-registry-read-LeoF2Gsl.cjs");
require("./operator-approval-store-CfqdT13-.cjs");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/approval-session-audience.ts
const MAX_APPROVAL_AUDIENCE_SESSIONS = 64;
function canonicalizeAudienceSessionKey(sources, sessionKey, relativeToSessionKey) {
	const raw = sessionKey?.trim();
	if (!raw) return null;
	return sources.canonicalizeSessionKey(raw, relativeToSessionKey)?.trim() || null;
}
/** Resolves the source session and its operator-visible ancestor audience. */
function resolveApprovalSessionAudienceFromSources(params) {
	const sourceSessionKey = canonicalizeAudienceSessionKey(params.sources, params.sourceSessionKey);
	if (!sourceSessionKey) return [];
	const audience = [];
	const queued = /* @__PURE__ */ new Set([sourceSessionKey]);
	const pending = [sourceSessionKey];
	const enqueue = (sessionKey) => {
		if (!sessionKey || queued.has(sessionKey) || pending.length >= MAX_APPROVAL_AUDIENCE_SESSIONS) return;
		queued.add(sessionKey);
		pending.push(sessionKey);
	};
	for (const sessionKey of pending) {
		audience.push(sessionKey);
		const subagentLineage = params.sources.getLatestSubagentLineage(sessionKey);
		const registryParents = [canonicalizeAudienceSessionKey(params.sources, subagentLineage?.controllerSessionKey, sessionKey), canonicalizeAudienceSessionKey(params.sources, subagentLineage?.requesterSessionKey, sessionKey)].filter((candidate) => Boolean(candidate));
		if (registryParents.length > 0) {
			for (const parentSessionKey of registryParents) enqueue(parentSessionKey);
			continue;
		}
		const storedLineage = params.sources.getStoredSessionLineage(sessionKey);
		const parentSessionKey = storedLineage?.parentSessionKey?.trim() ? storedLineage.parentSessionKey : storedLineage?.spawnedBy;
		enqueue(canonicalizeAudienceSessionKey(params.sources, parentSessionKey, sessionKey));
	}
	return audience;
}
function createRuntimeApprovalSessionAudienceSources(cfg, sourceAgentId) {
	const subagentRuns = require_subagent_registry_read.buildLatestSubagentRunReadIndex();
	const resolveStorageTarget = (sessionKey) => {
		const parsed = require_session_key.parseAgentSessionKey(sessionKey);
		if (parsed?.rest.toLowerCase() === "global") return {
			agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId),
			sessionKey: "global"
		};
		return {
			agentId: require_session_accessor.resolveSessionStoreAgentId(cfg, sessionKey),
			sessionKey
		};
	};
	return {
		canonicalizeSessionKey: (sessionKey, relativeToSessionKey) => {
			if (!relativeToSessionKey) return canonicalizeApprovalSourceStreamKey(cfg, sessionKey, sourceAgentId);
			const relativeAgentId = require_session_accessor.resolveSessionStoreAgentId(cfg, relativeToSessionKey);
			const canonical = require_session_accessor.canonicalizeSpawnedByForAgent(cfg, relativeAgentId, sessionKey);
			return canonical ? resolveApprovalSourceStreamKey(canonical, relativeAgentId) : canonical;
		},
		getLatestSubagentLineage: (sessionKey) => subagentRuns.getLatestSubagentRun(sessionKey),
		getStoredSessionLineage: (sessionKey) => {
			const target = resolveStorageTarget(sessionKey);
			return require_session_accessor.loadSessionEntry({
				agentId: target.agentId,
				clone: false,
				hydrateSkillPromptRefs: false,
				sessionKey: target.sessionKey
			});
		}
	};
}
/** Resolves an approval audience from the live registry and session stores. */
function resolveApprovalSessionAudience(sourceSessionKey, sourceAgentId) {
	return resolveApprovalSessionAudienceFromSources({
		sourceSessionKey,
		sources: createRuntimeApprovalSessionAudienceSources(require_io.getRuntimeConfig(), sourceAgentId)
	});
}
/** Canonicalize one source key against config: agent scoping, main-key aliases, global sentinel. */
function canonicalizeApprovalSourceStreamKey(cfg, sessionKey, sourceAgentId) {
	const ownerAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(sourceAgentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg));
	const lowered = sessionKey.trim().toLowerCase();
	return resolveApprovalSourceStreamKey(require_session_accessor.resolveSessionStoreKey({
		cfg,
		sessionKey: require_session_key.parseAgentSessionKey(sessionKey) || lowered === "global" || lowered === "unknown" ? sessionKey : `agent:${ownerAgentId}:${sessionKey}`
	}), ownerAgentId);
}
/**
* Fallback audience key when the lineage walk fails. Config-only
* canonicalization (agent scope, configured main-key aliases) still applies
* when the config loads; the pure-string form is the true last resort.
*/
/** Non-throwing audience resolver for injection into the approval manager.
* Lineage is routing metadata, not an approval safety prerequisite; when
* session stores are unavailable this preserves the agent-scoped source. */
function resolveApprovalSessionAudienceWithFallback(sourceSessionKey, sourceAgentId) {
	try {
		return resolveApprovalSessionAudience(sourceSessionKey, sourceAgentId);
	} catch {
		return [resolveApprovalFallbackAudienceSessionKey(sourceSessionKey, sourceAgentId)];
	}
}
function resolveApprovalFallbackAudienceSessionKey(sourceSessionKey, sourceAgentId) {
	try {
		return canonicalizeApprovalSourceStreamKey(require_io.getRuntimeConfig(), sourceSessionKey, sourceAgentId);
	} catch {
		return resolveApprovalSourceStreamKey(sourceSessionKey, sourceAgentId);
	}
}
/** Best-effort stream key used when lineage lookup is unavailable. */
function resolveApprovalSourceStreamKey(sourceSessionKey, sourceAgentId) {
	const normalizedSessionKey = sourceSessionKey.trim();
	const lowered = normalizedSessionKey.toLowerCase();
	if (!sourceAgentId || lowered === "unknown" || require_session_key.parseAgentSessionKey(normalizedSessionKey)) return normalizedSessionKey;
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(sourceAgentId);
	return lowered === "global" ? `agent:${agentId}:global` : `agent:${agentId}:${normalizedSessionKey}`;
}
//#endregion
Object.defineProperty(exports, "resolveApprovalSessionAudienceWithFallback", {
	enumerable: true,
	get: function() {
		return resolveApprovalSessionAudienceWithFallback;
	}
});
Object.defineProperty(exports, "resolveApprovalSourceStreamKey", {
	enumerable: true,
	get: function() {
		return resolveApprovalSourceStreamKey;
	}
});
