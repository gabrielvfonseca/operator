const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
//#region src/gateway/active-sessions-shutdown-tracker.ts
const trackedSessions = /* @__PURE__ */ new Map();
function noteActiveSessionForShutdown(entry) {
	if (!entry.sessionId) return;
	trackedSessions.set(entry.sessionId, entry);
}
function forgetActiveSessionForShutdown(sessionId) {
	if (!sessionId) return;
	trackedSessions.delete(sessionId);
}
function listActiveSessionsForShutdown() {
	return Array.from(trackedSessions.values());
}
//#endregion
//#region src/auto-reply/reply/session-hooks.ts
function buildSessionHookContext(params) {
	return {
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		agentId: require_agent_scope.resolveSessionAgentId({
			sessionKey: params.sessionKey,
			config: params.cfg
		})
	};
}
/** Builds the payload for plugin session-start hooks. */
function buildSessionStartHookPayload(params) {
	return {
		event: {
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			resumedFrom: params.resumedFrom
		},
		context: buildSessionHookContext({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			cfg: params.cfg
		})
	};
}
/** Builds the payload for plugin session-end hooks. */
function buildSessionEndHookPayload(params) {
	return {
		event: {
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			messageCount: params.messageCount ?? 0,
			durationMs: params.durationMs,
			reason: params.reason,
			sessionFile: params.sessionFile,
			transcriptArchived: params.transcriptArchived,
			nextSessionId: params.nextSessionId,
			nextSessionKey: params.nextSessionKey
		},
		context: buildSessionHookContext({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			cfg: params.cfg
		})
	};
}
//#endregion
Object.defineProperty(exports, "buildSessionEndHookPayload", {
	enumerable: true,
	get: function() {
		return buildSessionEndHookPayload;
	}
});
Object.defineProperty(exports, "buildSessionStartHookPayload", {
	enumerable: true,
	get: function() {
		return buildSessionStartHookPayload;
	}
});
Object.defineProperty(exports, "forgetActiveSessionForShutdown", {
	enumerable: true,
	get: function() {
		return forgetActiveSessionForShutdown;
	}
});
Object.defineProperty(exports, "listActiveSessionsForShutdown", {
	enumerable: true,
	get: function() {
		return listActiveSessionsForShutdown;
	}
});
Object.defineProperty(exports, "noteActiveSessionForShutdown", {
	enumerable: true,
	get: function() {
		return noteActiveSessionForShutdown;
	}
});
