const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/config/sessions/sqlite-marker.ts
/** SQLite transcript sessionFile marker helpers shared by session runtime readers. */
const SQLITE_SESSION_FILE_MARKER_RE = /^sqlite:([^:]+):([^:]+):(.*)$/;
/** Formats the canonical sessionFile marker for SQLite-backed transcripts. */
function formatSqliteSessionFileMarker(marker) {
	return `sqlite:${marker.agentId}:${marker.sessionId}:${node_path.default.resolve(marker.storePath)}`;
}
/** Parses a SQLite-backed transcript sessionFile marker. */
function parseSqliteSessionFileMarker(sessionFile) {
	const marker = sessionFile?.trim();
	if (!marker?.startsWith("sqlite:")) return;
	const match = SQLITE_SESSION_FILE_MARKER_RE.exec(marker);
	if (!match?.[1] || !match[2] || !match[3]) return;
	return {
		agentId: match[1],
		sessionId: match[2],
		storePath: match[3]
	};
}
/** Checks whether a sessionFile marker points at the expected session id. */
function sqliteSessionFileMarkerMatchesSession(sessionFile, sessionId) {
	return parseSqliteSessionFileMarker(sessionFile)?.sessionId === sessionId;
}
//#endregion
Object.defineProperty(exports, "formatSqliteSessionFileMarker", {
	enumerable: true,
	get: function() {
		return formatSqliteSessionFileMarker;
	}
});
Object.defineProperty(exports, "parseSqliteSessionFileMarker", {
	enumerable: true,
	get: function() {
		return parseSqliteSessionFileMarker;
	}
});
Object.defineProperty(exports, "sqliteSessionFileMarkerMatchesSession", {
	enumerable: true,
	get: function() {
		return sqliteSessionFileMarkerMatchesSession;
	}
});
