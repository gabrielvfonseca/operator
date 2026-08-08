const require_sessions = require("./sessions-BOjfaI9B.cjs");
const require_session_id_resolution = require("./session-id-resolution-CYXapfNW.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
//#region src/gateway/worker-environments/session-target.ts
function resolveWorkerSessionTarget(cfg, sessionId) {
	const { store } = require_sessions.loadCombinedSessionStoreForGateway(cfg);
	const selection = require_session_id_resolution.resolveSessionIdMatchSelection(Object.entries(store).filter(([, entry]) => entry.sessionId === sessionId), sessionId);
	if (selection.kind !== "selected") return;
	const target = require_session_utils.resolveGatewaySessionStoreTargetWithStore({
		cfg,
		key: selection.sessionKey,
		clone: false
	});
	const entry = require_session_utils.resolveFreshestSessionEntryFromStoreKeys(target.store, target.storeKeys);
	if (!entry || entry.sessionId !== sessionId) return;
	return {
		agentId: target.agentId,
		sessionEntry: entry,
		sessionId,
		sessionKey: target.canonicalKey,
		sessionStore: target.store,
		storePath: target.storePath
	};
}
//#endregion
Object.defineProperty(exports, "resolveWorkerSessionTarget", {
	enumerable: true,
	get: function() {
		return resolveWorkerSessionTarget;
	}
});
