const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
//#region src/agents/internal-session-effects.ts
/** Manages hidden SQLite sessions used for suppressed agent side effects. */
/** Resolves the deterministic SQLite target owned by one internal-effects run. */
function resolveInternalSessionEffectsTarget(params) {
	return {
		agentId: params.agentId,
		storePath: params.storePath,
		...require_session_accessor.resolveInternalSessionEffectsIdentity(params)
	};
}
function toInternalSessionEffectsTarget(params) {
	return {
		agentId: params.agentId,
		sessionId: params.entry.sessionId,
		sessionKey: params.sessionKey,
		storePath: params.storePath,
		sessionEntry: params.entry,
		sessionFile: require_sqlite_marker.formatSqliteSessionFileMarker({
			agentId: params.agentId,
			sessionId: params.entry.sessionId,
			storePath: params.storePath
		})
	};
}
/** Creates or reopens the hidden SQLite session owned by one internal-effects run. */
async function prepareInternalSessionEffectsSession(params) {
	const scope = resolveInternalSessionEffectsTarget(params);
	const existing = require_session_accessor.loadExactSessionEntry(scope)?.entry;
	if (existing?.sessionId === scope.sessionId) return toInternalSessionEffectsTarget({
		agentId: params.agentId,
		entry: existing,
		sessionKey: scope.sessionKey,
		storePath: params.storePath
	});
	if ((params.source ? await require_session_accessor.forkSessionFromParentTranscript({
		agentId: params.source.agentId,
		parentEntry: {
			sessionId: params.source.sessionId,
			updatedAt: Date.now()
		},
		parentSessionKey: params.source.sessionKey,
		sessionKey: scope.sessionKey,
		storePath: params.source.storePath,
		targetSessionId: scope.sessionId,
		targetStorePath: params.storePath
	}) : void 0)?.status !== "created") await require_session_accessor.replaceTranscriptEvents(scope, [require_session_accessor.createSessionTranscriptHeader({
		cwd: params.cwd,
		sessionId: scope.sessionId
	})]);
	const now = Date.now();
	const entry = await require_session_accessor.upsertSessionEntry(scope, {
		sessionId: scope.sessionId,
		sessionStartedAt: now,
		updatedAt: now
	});
	if (!entry) throw new Error(`Failed to create internal SQLite session for run ${params.runId}`);
	return toInternalSessionEffectsTarget({
		agentId: params.agentId,
		entry,
		sessionKey: scope.sessionKey,
		storePath: params.storePath
	});
}
/** Hard-deletes a run-owned hidden session and its SQLite transcript rows. */
async function removeInternalSessionEffectsSession(target) {
	if (!target?.sessionKey || !target.storePath) return;
	await require_session_accessor.applySessionEntryLifecycleMutation({
		...target.agentId ? { agentId: target.agentId } : {},
		storePath: target.storePath,
		removals: [{
			sessionKey: target.sessionKey,
			...target.sessionId ? { expectedSessionId: target.sessionId } : {},
			archiveRemovedTranscript: false
		}],
		skipMaintenance: true
	});
}
//#endregion
Object.defineProperty(exports, "prepareInternalSessionEffectsSession", {
	enumerable: true,
	get: function() {
		return prepareInternalSessionEffectsSession;
	}
});
Object.defineProperty(exports, "removeInternalSessionEffectsSession", {
	enumerable: true,
	get: function() {
		return removeInternalSessionEffectsSession;
	}
});
Object.defineProperty(exports, "resolveInternalSessionEffectsTarget", {
	enumerable: true,
	get: function() {
		return resolveInternalSessionEffectsTarget;
	}
});
