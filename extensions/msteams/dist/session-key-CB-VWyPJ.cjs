const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
//#region src/cron/isolated-agent/session-key.ts
/** Canonicalizes cron session keys into agent-scoped session-store keys. */
/** Resolves a cron session key into the canonical agent-scoped session-store key. */
function resolveCronAgentSessionKey(params) {
	const raw = require_session_key.toAgentStoreSessionKey({
		agentId: params.agentId,
		requestKey: params.sessionKey.trim(),
		mainKey: params.mainKey
	});
	return require_main_session.canonicalizeMainSessionAlias({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionKey: raw
	});
}
//#endregion
Object.defineProperty(exports, "resolveCronAgentSessionKey", {
	enumerable: true,
	get: function() {
		return resolveCronAgentSessionKey;
	}
});
