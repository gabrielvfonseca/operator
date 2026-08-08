const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/tui/tui-last-session.ts
function stateDatabaseOptions(stateDir) {
	return stateDir ? { env: {
		...process.env,
		OPERATOR_STATE_DIR: stateDir
	} } : { env: process.env };
}
/** Builds a stable private-store key for the current TUI connection, agent, and session scope. */
function buildTuiLastSessionScopeKey(params) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId);
	const connectionUrl = params.connectionUrl.trim() || "local";
	return (0, node_crypto.createHash)("sha256").update(`${params.sessionScope}\n${agentId}\n${connectionUrl}`).digest("hex").slice(0, 32);
}
function normalizeMarker(value) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function isHeartbeatSessionKey(sessionKey) {
	return normalizeMarker(sessionKey).endsWith(":heartbeat");
}
/** Detects heartbeat/system sessions that should not become the remembered human session. */
function isHeartbeatLikeTuiSession(session) {
	if (isHeartbeatSessionKey(session.key)) return true;
	return [
		session.provider,
		session.lastProvider,
		session.lastChannel,
		session.lastTo,
		session.origin?.provider,
		session.origin?.surface,
		session.origin?.label
	].some((marker) => normalizeMarker(marker) === "heartbeat");
}
/** Reads the remembered session key for a scope from canonical shared state. */
async function readTuiLastSessionKey(params) {
	const database = require_openclaw_state_db.openOperatorStateDatabase(stateDatabaseOptions(params.stateDir));
	const sessionKey = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).selectFrom("tui_last_sessions").select("session_key").where("scope_key", "=", params.scopeKey))?.session_key.trim() ?? "";
	return sessionKey && !isHeartbeatSessionKey(sessionKey) ? sessionKey : null;
}
/** Writes the remembered session key unless it is empty, unknown, or heartbeat-owned. */
async function writeTuiLastSessionKey(params) {
	const sessionKey = params.sessionKey.trim();
	if (!sessionKey || sessionKey === "unknown" || isHeartbeatSessionKey(sessionKey)) return;
	const updatedAt = Date.now();
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).insertInto("tui_last_sessions").values({
			scope_key: params.scopeKey,
			session_key: sessionKey,
			updated_at: updatedAt
		}).onConflict((conflict) => conflict.column("scope_key").doUpdateSet({
			session_key: sessionKey,
			updated_at: updatedAt
		})));
	}, stateDatabaseOptions(params.stateDir));
}
/** Removes restore pointers that target sessions retired by doctor repair. */
function clearTuiLastSessionPointers(params) {
	if (params.sessionKeys.size === 0) return 0;
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const result = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).deleteFrom("tui_last_sessions").where("session_key", "in", [...params.sessionKeys]));
		return Number(result.numAffectedRows ?? 0n);
	}, stateDatabaseOptions(params.stateDir));
}
/** Resolves a remembered key to a currently listed session for the active agent. */
function resolveRememberedTuiSessionKey(params) {
	const rememberedKey = params.rememberedKey?.trim();
	if (!rememberedKey) return null;
	if (isHeartbeatSessionKey(rememberedKey)) return null;
	const currentAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.currentAgentId);
	const parsed = require_session_key.parseAgentSessionKey(rememberedKey);
	if (parsed && (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(parsed.agentId) !== currentAgentId) return null;
	const rememberedRest = parsed?.rest ?? rememberedKey;
	return params.sessions.find((session) => {
		if (isHeartbeatLikeTuiSession(session)) return false;
		if (session.key === rememberedKey) return true;
		return require_session_key.parseAgentSessionKey(session.key)?.rest === rememberedRest;
	})?.key ?? null;
}
//#endregion
Object.defineProperty(exports, "buildTuiLastSessionScopeKey", {
	enumerable: true,
	get: function() {
		return buildTuiLastSessionScopeKey;
	}
});
Object.defineProperty(exports, "clearTuiLastSessionPointers", {
	enumerable: true,
	get: function() {
		return clearTuiLastSessionPointers;
	}
});
Object.defineProperty(exports, "readTuiLastSessionKey", {
	enumerable: true,
	get: function() {
		return readTuiLastSessionKey;
	}
});
Object.defineProperty(exports, "resolveRememberedTuiSessionKey", {
	enumerable: true,
	get: function() {
		return resolveRememberedTuiSessionKey;
	}
});
Object.defineProperty(exports, "writeTuiLastSessionKey", {
	enumerable: true,
	get: function() {
		return writeTuiLastSessionKey;
	}
});
