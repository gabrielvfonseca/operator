const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region packages/memory-host-sdk/src/host/error-utils.ts
const SECRET_PATTERNS = [
	/\b[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD)\b\s*[=:]\s*(["']?)([^\s"'\\]+)\1/g,
	/[?&](?:access[-_]?token|auth[-_]?token|hook[-_]?token|refresh[-_]?token|api[-_]?key|client[-_]?secret|token|key|secret|password|pass|passwd|auth|signature)=([^&\s"'<>]+)/gi,
	/"(?:apiKey|token|secret|password|passwd|accessToken|refreshToken)"\s*:\s*"([^"]+)"/g,
	/--(?:api[-_]?key|hook[-_]?token|token|secret|password|passwd)\s+(["']?)([^\s"']+)\1/g,
	/Authorization\s*[:=]\s*Bearer\s+([A-Za-z0-9._\-+=]+)/g,
	/\bBearer\s+([A-Za-z0-9._\-+=]{18,})\b/g,
	/(^|[\s,;])(?:access_token|refresh_token|api[-_]?key|token|secret|password|passwd)=([^\s&#]+)/g,
	/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+?-----END [A-Z ]*PRIVATE KEY-----/g,
	/\b(sk-[A-Za-z0-9_-]{8,})\b/g,
	/\b(ghp_[A-Za-z0-9]{20,})\b/g,
	/\b(github_pat_[A-Za-z0-9_]{20,})\b/g,
	/\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/g,
	/\b(xapp-[A-Za-z0-9-]{10,})\b/g,
	/\b(gsk_[A-Za-z0-9_-]{10,})\b/g,
	/\b(AIza[0-9A-Za-z\-_]{20,})\b/g,
	/\b(pplx-[A-Za-z0-9_-]{10,})\b/g,
	/\b(npm_[A-Za-z0-9]{10,})\b/g,
	/\bbot(\d{6,}:[A-Za-z0-9_-]{20,})\b/g,
	/\b(\d{6,}:[A-Za-z0-9_-]{20,})\b/g
];
function maskToken(token) {
	if (token.length < 18) return "***";
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(token, 0, 6)}...${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(token, -4)}`;
}
function redactPemBlock(block) {
	const lines = block.split(/\r?\n/).filter(Boolean);
	if (lines.length < 2) return "***";
	return `${lines[0]}\n...redacted...\n${lines[lines.length - 1]}`;
}
function redactMatch(match, groups) {
	if (match.includes("PRIVATE KEY-----")) return redactPemBlock(match);
	const token = groups.findLast((value) => typeof value === "string" && value.length > 0) ?? match;
	const masked = maskToken(token);
	if (token === match) return masked;
	const tokenOffset = match.lastIndexOf(token);
	if (tokenOffset < 0) return "***";
	return `${match.slice(0, tokenOffset)}${masked}${match.slice(tokenOffset + token.length)}`;
}
function redactSensitiveText(text) {
	let next = text;
	for (const pattern of SECRET_PATTERNS) next = next.replace(pattern, (...args) => redactMatch(args[0] ?? "", args.slice(1, -2)));
	return next;
}
/** Format memory-host errors through the canonical formatter and local redaction policy. */
function formatErrorMessage(err) {
	return (0, _gabrielvfonseca_normalization_core_error_coercion.formatErrorMessage)(err, { redact: redactSensitiveText });
}
//#endregion
//#region packages/memory-host-sdk/src/host/memory-schema.ts
const MEMORY_INDEX_META_TABLE = "memory_index_meta";
const MEMORY_INDEX_SOURCES_TABLE = "memory_index_sources";
const MEMORY_INDEX_CHUNKS_TABLE = "memory_index_chunks";
const MEMORY_INDEX_PATHS_FTS_TABLE = "memory_index_paths_fts";
/** Optional canonical triggers owned by the derived path FTS index. */
const MEMORY_PATH_FTS_TRIGGER_DEFINITIONS = [
	{
		name: "memory_index_paths_fts_after_insert",
		sql: `
      CREATE TRIGGER IF NOT EXISTS main.memory_index_paths_fts_after_insert
      AFTER INSERT ON ${MEMORY_INDEX_SOURCES_TABLE}
      BEGIN
        INSERT INTO ${MEMORY_INDEX_PATHS_FTS_TABLE} (rowid, path, source)
        VALUES (NEW.id, NEW.path, NEW.source);
      END;
    `
	},
	{
		name: "memory_index_paths_fts_after_update",
		sql: `
      CREATE TRIGGER IF NOT EXISTS main.memory_index_paths_fts_after_update
      AFTER UPDATE OF id, path, source ON ${MEMORY_INDEX_SOURCES_TABLE}
      BEGIN
        DELETE FROM ${MEMORY_INDEX_PATHS_FTS_TABLE}
        WHERE rowid = OLD.id;
        INSERT INTO ${MEMORY_INDEX_PATHS_FTS_TABLE} (rowid, path, source)
        VALUES (NEW.id, NEW.path, NEW.source);
      END;
    `
	},
	{
		name: "memory_index_paths_fts_after_delete",
		sql: `
      CREATE TRIGGER IF NOT EXISTS main.memory_index_paths_fts_after_delete
      AFTER DELETE ON ${MEMORY_INDEX_SOURCES_TABLE}
      BEGIN
        DELETE FROM ${MEMORY_INDEX_PATHS_FTS_TABLE}
        WHERE rowid = OLD.id;
      END;
    `
	}
];
const LEGACY_MEMORY_INDEX_SOURCE_COLUMNS = [
	"path",
	"source",
	"hash",
	"mtime",
	"size"
];
const MEMORY_INDEX_SOURCE_COLUMNS = ["id", ...LEGACY_MEMORY_INDEX_SOURCE_COLUMNS];
const MEMORY_INDEX_SOURCE_COLUMN_TYPES = /* @__PURE__ */ new Map([
	["id", "INTEGER"],
	["path", "TEXT"],
	["source", "TEXT"],
	["hash", "TEXT"],
	["mtime", "REAL"],
	["size", "INTEGER"]
]);
function tableColumnInfo(db, tableName, schema = "main") {
	return db.prepare(`PRAGMA ${schema}.table_xinfo(${tableName})`).all().flatMap((row) => typeof row.name === "string" && typeof row.type === "string" ? [{
		name: row.name,
		type: row.type.toUpperCase(),
		notnull: Number(row.notnull ?? 0),
		pk: Number(row.pk ?? 0),
		defaultValue: typeof row.dflt_value === "string" ? row.dflt_value : null,
		hidden: Number(row.hidden ?? 0)
	}] : []);
}
function tableColumns(db, tableName, schema = "main") {
	return new Set(tableColumnInfo(db, tableName, schema).map((row) => row.name));
}
function tableHasExactColumns(db, tableName, expected, schema = "main") {
	const columns = tableColumns(db, tableName, schema);
	return columns.size === expected.length && expected.every((column) => columns.has(column));
}
function tablePrimaryKeyColumns(db, tableName) {
	return tableColumnInfo(db, tableName).filter((row) => row.pk > 0).toSorted((left, right) => left.pk - right.pk).map((row) => row.name);
}
function tableHasPrimaryKey(db, tableName, expectedColumns) {
	const columns = tablePrimaryKeyColumns(db, tableName);
	return columns.length === expectedColumns.length && columns.every((column, index) => column === expectedColumns[index]);
}
function tableHasUniqueIndex(db, tableName, expectedColumns) {
	const indexes = db.prepare(`SELECT name, partial FROM pragma_index_list(?) WHERE "unique" = 1`).all(tableName);
	if (indexes.length !== 1) return false;
	return indexes.some((index) => {
		if (typeof index.name !== "string" || Number(index.partial ?? 0) !== 0) return false;
		const columns = db.prepare(`SELECT cid, name, coll, "desc" AS sort_desc, key FROM pragma_index_xinfo(?) ORDER BY seqno`).all(index.name).filter((row) => Number(row.key ?? 0) === 1);
		return columns.length === expectedColumns.length && columns.every((column, columnIndex) => Number(column.cid ?? -1) >= 0 && column.name === expectedColumns[columnIndex] && column.coll === "BINARY" && Number(column.sort_desc ?? 0) === 0);
	});
}
function tableHasNoDeclaredCollations(db, tableName) {
	const row = db.prepare(`SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = ?`).get(tableName);
	return typeof row?.sql === "string" && !/\bCOLLATE\b/iu.test(row.sql);
}
function tableHasCanonicalSourceColumnTypes(db) {
	return tableColumnInfo(db, MEMORY_INDEX_SOURCES_TABLE).every((column) => {
		const expectedType = MEMORY_INDEX_SOURCE_COLUMN_TYPES.get(column.name);
		const expectedDefault = column.name === "source" ? "'memory'" : null;
		if (column.type !== expectedType && !(column.name === "mtime" && column.type === "INTEGER") || column.defaultValue !== expectedDefault || column.hidden !== 0) return false;
		return true;
	});
}
function tableHasCanonicalSourceColumns(db) {
	return tableHasCanonicalSourceColumnTypes(db) && tableColumnInfo(db, "memory_index_sources").every((column) => {
		return column.name === "id" || column.notnull === 1;
	});
}
function tableHasLegacySourceColumns(db, hasPathPrimaryKey) {
	return tableHasCanonicalSourceColumnTypes(db) && tableColumnInfo(db, "memory_index_sources").every((column) => {
		return hasPathPrimaryKey && column.name === "path" || column.notnull === 1;
	});
}
function tableHasIntegerRowIdPrimaryKey(db) {
	if (tableColumnInfo(db, "memory_index_sources").find((column) => column.name === "id")?.type !== "INTEGER" || !tableHasPrimaryKey(db, "memory_index_sources", ["id"])) return false;
	return db.prepare(`SELECT 1 AS found FROM pragma_index_list(?) WHERE origin = 'pk' LIMIT 1`).get(MEMORY_INDEX_SOURCES_TABLE)?.found !== 1;
}
function tableExists(db, tableName) {
	return db.prepare(`SELECT 1 AS found FROM sqlite_master WHERE type = 'table' AND name = ?`).get(tableName)?.found === 1;
}
/** Upgrade canonical memory sources to stable integer identities. */
function migrateMemoryIndexSourcesIdentity(db) {
	if (!tableExists(db, "memory_index_sources")) return;
	if (tableHasExactColumns(db, "memory_index_sources", MEMORY_INDEX_SOURCE_COLUMNS)) {
		if (tableHasCanonicalSourceColumns(db) && tableHasIntegerRowIdPrimaryKey(db) && tableHasNoDeclaredCollations(db, "memory_index_sources") && tableHasUniqueIndex(db, "memory_index_sources", ["path", "source"])) return;
		throw new Error("canonical memory source identity schema is invalid");
	}
	if (!tableHasExactColumns(db, "memory_index_sources", LEGACY_MEMORY_INDEX_SOURCE_COLUMNS)) throw new Error("canonical memory source identity schema is invalid");
	const hasPathPrimaryKey = tableHasPrimaryKey(db, MEMORY_INDEX_SOURCES_TABLE, ["path"]);
	const hasPathSourcePrimaryKey = tableHasPrimaryKey(db, MEMORY_INDEX_SOURCES_TABLE, ["path", "source"]);
	if (!hasPathPrimaryKey && !hasPathSourcePrimaryKey) throw new Error("canonical memory source identity schema is invalid");
	if (!tableHasLegacySourceColumns(db, hasPathPrimaryKey)) throw new Error("canonical memory source identity schema is invalid");
	const rebuildsPathFts = tableExists(db, MEMORY_INDEX_PATHS_FTS_TABLE);
	db.exec("SAVEPOINT migrate_memory_index_sources_identity");
	try {
		dropMemoryPathFtsTriggers(db);
		db.exec(`
      DROP TRIGGER IF EXISTS memory_index_sources_revision_after_insert;
      DROP TRIGGER IF EXISTS memory_index_sources_revision_after_update;
      DROP TRIGGER IF EXISTS memory_index_sources_revision_after_delete;

      ALTER TABLE ${MEMORY_INDEX_SOURCES_TABLE}
        RENAME TO memory_index_sources_identity_migration;
      CREATE TABLE ${MEMORY_INDEX_SOURCES_TABLE} (
        id INTEGER PRIMARY KEY,
        path TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'memory',
        hash TEXT NOT NULL,
        mtime REAL NOT NULL,
        size INTEGER NOT NULL,
        UNIQUE (path, source)
      ) STRICT;
      INSERT INTO ${MEMORY_INDEX_SOURCES_TABLE} (id, path, source, hash, mtime, size)
      SELECT rowid, path, source, hash, mtime, size
      FROM memory_index_sources_identity_migration;
      DROP TABLE memory_index_sources_identity_migration;
    `);
		if (rebuildsPathFts) {
			db.exec(`
        DELETE FROM ${MEMORY_INDEX_PATHS_FTS_TABLE};
        INSERT INTO ${MEMORY_INDEX_PATHS_FTS_TABLE} (rowid, path, source)
        SELECT id, path, source FROM ${MEMORY_INDEX_SOURCES_TABLE};
      `);
			ensureMemoryPathFtsTriggers(db);
		}
		db.exec("RELEASE migrate_memory_index_sources_identity");
	} catch (err) {
		db.exec("ROLLBACK TO migrate_memory_index_sources_identity");
		db.exec("RELEASE migrate_memory_index_sources_identity");
		throw err;
	}
}
/** Drop the canonical source-to-path-FTS maintenance triggers. */
function dropMemoryPathFtsTriggers(db) {
	for (const trigger of MEMORY_PATH_FTS_TRIGGER_DEFINITIONS) db.exec(`DROP TRIGGER IF EXISTS main.${trigger.name}`);
}
/** Install the canonical source-to-path-FTS maintenance triggers. */
function ensureMemoryPathFtsTriggers(db) {
	for (const trigger of MEMORY_PATH_FTS_TRIGGER_DEFINITIONS) db.exec(trigger.sql);
}
//#endregion
//#region src/state/openclaw-agent-db-session-migrations.ts
function readSqliteTableColumns(db, tableName) {
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) throw new Error(`invalid SQLite table identifier: ${tableName}`);
	if (!db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)) return null;
	const rows = db.prepare(`PRAGMA table_info(${tableName})`).all();
	return new Set(rows.flatMap((row) => typeof row.name === "string" ? [row.name] : []));
}
function migrateSessionEntryStatusProjection(db, readStatus) {
	const columns = readSqliteTableColumns(db, "session_entries");
	if (!columns) return;
	if (!columns.has("status")) db.exec("ALTER TABLE session_entries ADD COLUMN status TEXT CHECK (status IS NULL OR status IN ('running', 'done', 'failed', 'killed', 'timeout'));");
	const rows = db.prepare("SELECT session_key, entry_json FROM session_entries").all();
	const update = db.prepare("UPDATE session_entries SET status = ? WHERE session_key = ?");
	for (const row of rows) if (typeof row.session_key === "string") update.run(readStatus(row.entry_json), row.session_key);
}
//#endregion
//#region src/state/openclaw-agent-db-session-provenance.ts
function readMigratedEntry(value) {
	if (typeof value === "string") try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : void 0;
	} catch {
		return;
	}
	return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function normalizedText(value) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}
function addSessionProvenanceColumns(db, columns) {
	if (columns && !columns.has("session_entry_provenance")) db.exec("ALTER TABLE sessions ADD COLUMN session_entry_provenance INTEGER NOT NULL DEFAULT 0 CHECK (session_entry_provenance IN (0, 1));");
	if (columns && !columns.has("acp_owned")) db.exec("ALTER TABLE sessions ADD COLUMN acp_owned INTEGER NOT NULL DEFAULT 0 CHECK (acp_owned IN (0, 1));");
	if (columns && !columns.has("plugin_owner_id")) db.exec("ALTER TABLE sessions ADD COLUMN plugin_owner_id TEXT;");
	if (columns && !columns.has("hook_external_content_source")) db.exec("ALTER TABLE sessions ADD COLUMN hook_external_content_source TEXT CHECK (hook_external_content_source IS NULL OR hook_external_content_source IN ('gmail', 'webhook'));");
}
function backfillSessionEntryProvenance(db, previousVersion) {
	if (previousVersion >= 8) return;
	const rows = db.prepare(`SELECT se.session_id, se.entry_json
       FROM session_entries AS se
       INNER JOIN sessions AS s
         ON s.session_id = se.session_id AND s.session_key = se.session_key;`).all();
	const update = db.prepare(`
    UPDATE sessions
    SET session_entry_provenance = 1, acp_owned = ?, plugin_owner_id = ?,
        hook_external_content_source = ?
    WHERE session_id = ?;
  `);
	for (const row of rows) {
		const sessionId = normalizedText(row.session_id);
		const entry = readMigratedEntry(row.entry_json);
		if (!sessionId || !entry) continue;
		const hookSource = normalizedText(entry.hookExternalContentSource);
		const acp = entry.acp;
		update.run(acp && typeof acp === "object" && !Array.isArray(acp) ? 1 : 0, normalizedText(entry.pluginOwnerId), hookSource === "gmail" || hookSource === "webhook" ? hookSource : null, sessionId);
	}
}
function backfillTranscriptMutationWatermarks(db) {
	if (db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?").get("transcript_events")?.ok !== 1) return;
	db.exec(`
    UPDATE sessions
    SET
      transcript_updated_at = COALESCE(
        transcript_updated_at,
        (SELECT MAX(transcript_events.created_at)
         FROM transcript_events
         WHERE transcript_events.session_id = sessions.session_id)
      ),
      transcript_observed_at = COALESCE(transcript_observed_at, updated_at)
    WHERE EXISTS (
      SELECT 1 FROM transcript_events
      WHERE transcript_events.session_id = sessions.session_id
    );
  `);
}
//#endregion
//#region src/state/openclaw-agent-db.paths.ts
/** Resolve the SQLite file for one normalized agent id. */
function resolveOperatorAgentSqlitePath(options) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(options.agentId);
	return node_path.default.resolve(options.path ?? node_path.default.join(node_path.default.dirname(require_openclaw_state_db.resolveOperatorStateSqliteDir(options.env ?? process.env)), "agents", agentId, "agent", "operator-agent.sqlite"));
}
//#endregion
//#region src/state/openclaw-agent-schema.generated.ts
/**
* This file was generated from the SQLite schema source.
* Please do not edit it manually.
*/
const OPERATOR_AGENT_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS schema_meta (
  meta_key TEXT NOT NULL PRIMARY KEY,
  role TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  agent_id TEXT,
  app_version TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT NOT NULL PRIMARY KEY,
  session_key TEXT NOT NULL,
  session_scope TEXT NOT NULL DEFAULT 'conversation' CHECK (session_scope IN ('conversation', 'shared-main', 'group', 'channel')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  transcript_updated_at INTEGER DEFAULT NULL,
  transcript_observed_at INTEGER DEFAULT NULL,
  session_entry_provenance INTEGER NOT NULL DEFAULT 0 CHECK (session_entry_provenance IN (0, 1)),
  acp_owned INTEGER NOT NULL DEFAULT 0 CHECK (acp_owned IN (0, 1)),
  plugin_owner_id TEXT,
  hook_external_content_source TEXT CHECK (hook_external_content_source IS NULL OR hook_external_content_source IN ('gmail', 'webhook')),
  started_at INTEGER,
  ended_at INTEGER,
  status TEXT CHECK (status IS NULL OR status IN ('running', 'done', 'failed', 'killed', 'timeout')),
  chat_type TEXT CHECK (chat_type IS NULL OR chat_type IN ('direct', 'group', 'channel')),
  channel TEXT,
  account_id TEXT,
  primary_conversation_id TEXT,
  model_provider TEXT,
  model TEXT,
  agent_harness_id TEXT,
  parent_session_key TEXT,
  spawned_by TEXT,
  display_name TEXT,
  FOREIGN KEY (primary_conversation_id) REFERENCES conversations(conversation_id) ON DELETE SET NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_agent_sessions_updated_at
  ON sessions(updated_at DESC, session_id);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at
  ON sessions(created_at DESC, session_id);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_conversation
  ON sessions(primary_conversation_id, updated_at DESC, session_id)
  WHERE primary_conversation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS session_routes (
  session_key TEXT NOT NULL PRIMARY KEY,
  session_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_agent_session_routes_session_id
  ON session_routes(session_id);

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id TEXT NOT NULL PRIMARY KEY,
  channel TEXT NOT NULL,
  account_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('direct', 'group', 'channel')),
  peer_id TEXT NOT NULL,
  parent_conversation_id TEXT,
  thread_id TEXT,
  native_channel_id TEXT,
  native_direct_user_id TEXT,
  label TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_agent_conversations_lookup
  ON conversations(channel, account_id, kind, peer_id, thread_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_conversations_identity
  ON conversations(
    channel,
    account_id,
    kind,
    peer_id,
    IFNULL(parent_conversation_id, ''),
    IFNULL(thread_id, '')
  );

CREATE INDEX IF NOT EXISTS idx_agent_conversations_updated
  ON conversations(updated_at DESC, conversation_id);

CREATE TABLE IF NOT EXISTS session_conversations (
  session_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'participant', 'related')),
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, conversation_id, role),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_agent_session_conversations_conversation
  ON session_conversations(conversation_id, last_seen_at DESC, session_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_session_conversations_primary
  ON session_conversations(session_id)
  WHERE role = 'primary';

CREATE TABLE IF NOT EXISTS session_entries (
  session_key TEXT NOT NULL PRIMARY KEY,
  session_id TEXT NOT NULL,
  entry_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  status TEXT CHECK (status IS NULL OR status IN ('running', 'done', 'failed', 'killed', 'timeout')),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_agent_session_entries_updated_at
  ON session_entries(updated_at DESC, session_key);

CREATE INDEX IF NOT EXISTS idx_agent_session_entries_session_updated
  ON session_entries(session_id, updated_at DESC, session_key);

CREATE INDEX IF NOT EXISTS idx_agent_session_entries_status
  ON session_entries(status, session_key)
  WHERE status IS NOT NULL;

CREATE TABLE IF NOT EXISTS transcript_events (
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  event_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, seq),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS trajectory_runtime_events (
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  run_id TEXT,
  event_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, seq),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS idx_agent_trajectory_runtime_run
  ON trajectory_runtime_events(session_id, run_id, seq)
  WHERE run_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS transcript_event_identities (
  session_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  event_type TEXT,
  parent_id TEXT,
  message_idempotency_key TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, event_id),
  FOREIGN KEY (session_id, seq) REFERENCES transcript_events(session_id, seq) ON DELETE CASCADE
) STRICT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_transcript_message_idempotency
  ON transcript_event_identities(session_id, message_idempotency_key)
  WHERE message_idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_transcript_event_parent
  ON transcript_event_identities(session_id, parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_transcript_event_sequence
  ON transcript_event_identities(session_id, event_type, seq DESC);

CREATE TABLE IF NOT EXISTS cache_entries (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT,
  blob BLOB,
  expires_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (scope, key)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_agent_cache_expiry
  ON cache_entries(scope, expires_at, key)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_cache_updated
  ON cache_entries(scope, updated_at DESC, key);

CREATE TABLE IF NOT EXISTS auth_profile_store (
  store_key TEXT NOT NULL PRIMARY KEY,
  store_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS auth_profile_state (
  state_key TEXT NOT NULL PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS memory_index_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS memory_index_sources (
  id INTEGER PRIMARY KEY,
  path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'memory',
  hash TEXT NOT NULL,
  mtime REAL NOT NULL,
  size INTEGER NOT NULL,
  UNIQUE (path, source)
) STRICT;

CREATE TABLE IF NOT EXISTS memory_index_chunks (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'memory',
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  hash TEXT NOT NULL,
  model TEXT NOT NULL,
  text TEXT NOT NULL,
  embedding TEXT NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS memory_embedding_cache (
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  hash TEXT NOT NULL,
  embedding TEXT NOT NULL,
  dims INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (provider, model, provider_key, hash)
) STRICT;

CREATE TABLE IF NOT EXISTS memory_index_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS session_transcript_index_state (
  session_id TEXT NOT NULL PRIMARY KEY,
  indexed_seq INTEGER NOT NULL,
  leaf_event_id TEXT,
  needs_rebuild INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE VIRTUAL TABLE IF NOT EXISTS session_transcript_fts USING fts5(
  text,
  session_id UNINDEXED,
  message_id UNINDEXED,
  role UNINDEXED,
  timestamp UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2'
);

INSERT OR IGNORE INTO memory_index_state (id, revision) VALUES (1, 0);

CREATE TRIGGER IF NOT EXISTS memory_index_sources_revision_after_insert
AFTER INSERT ON memory_index_sources
BEGIN
  UPDATE memory_index_state SET revision = revision + 1 WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS memory_index_sources_revision_after_update
AFTER UPDATE ON memory_index_sources
BEGIN
  UPDATE memory_index_state SET revision = revision + 1 WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS memory_index_sources_revision_after_delete
AFTER DELETE ON memory_index_sources
BEGIN
  UPDATE memory_index_state SET revision = revision + 1 WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS memory_index_chunks_revision_after_insert
AFTER INSERT ON memory_index_chunks
BEGIN
  UPDATE memory_index_state SET revision = revision + 1 WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS memory_index_chunks_revision_after_update
AFTER UPDATE ON memory_index_chunks
BEGIN
  UPDATE memory_index_state SET revision = revision + 1 WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS memory_index_chunks_revision_after_delete
AFTER DELETE ON memory_index_chunks
BEGIN
  UPDATE memory_index_state SET revision = revision + 1 WHERE id = 1;
END;

CREATE INDEX IF NOT EXISTS idx_memory_embedding_cache_updated_at
  ON memory_embedding_cache(updated_at);

CREATE INDEX IF NOT EXISTS idx_memory_index_sources_source
  ON memory_index_sources(source);

CREATE INDEX IF NOT EXISTS idx_memory_index_chunks_path_source
  ON memory_index_chunks(path, source);

CREATE INDEX IF NOT EXISTS idx_memory_index_chunks_path
  ON memory_index_chunks(path);

CREATE INDEX IF NOT EXISTS idx_memory_index_chunks_source
  ON memory_index_chunks(source);\n`;
//#endregion
//#region src/state/openclaw-agent-db.ts
var openclaw_agent_db_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	OPERATOR_AGENT_SCHEMA_VERSION: () => 9,
	assertOperatorAgentDatabaseForMaintenance: () => assertOperatorAgentDatabaseForMaintenance,
	closeOperatorAgentDatabaseByPath: () => closeOperatorAgentDatabaseByPath,
	closeOperatorAgentDatabases: () => closeOperatorAgentDatabases,
	deferOperatorAgentPostCommitPublication: () => deferOperatorAgentPostCommitPublication,
	disposeOperatorAgentDatabaseByPath: () => disposeOperatorAgentDatabaseByPath,
	ensureOperatorAgentDatabasePermissions: () => ensureOperatorAgentDatabasePermissions,
	ensureOperatorAgentDatabaseSchema: () => ensureOperatorAgentDatabaseSchema,
	inspectOperatorAgentDatabaseOwner: () => inspectOperatorAgentDatabaseOwner,
	isOperatorAgentDatabaseOpen: () => isOperatorAgentDatabaseOpen,
	listOperatorRegisteredAgentDatabases: () => listOperatorRegisteredAgentDatabases,
	migrateOperatorAgentDatabaseForMaintenance: () => migrateOperatorAgentDatabaseForMaintenance,
	openOperatorAgentDatabase: () => openOperatorAgentDatabase,
	runOperatorAgentWriteTransaction: () => runOperatorAgentWriteTransaction
});
const OPERATOR_AGENT_DB_DIR_MODE = 448;
const OPERATOR_AGENT_DB_FILE_MODE = 384;
const OPERATOR_AGENT_DB_SLOW_OPEN_MS = 1e3;
const OPERATOR_AGENT_CANONICAL_UNIQUE_INDEXES = [
	{
		name: "idx_agent_conversations_identity",
		definition: `
      ON conversations(
        channel,
        account_id,
        kind,
        peer_id,
        IFNULL(parent_conversation_id, ''),
        IFNULL(thread_id, '')
      )
    `
	},
	{
		name: "idx_agent_session_conversations_primary",
		definition: `
      ON session_conversations(session_id)
      WHERE role = 'primary'
    `
	},
	{
		name: "idx_agent_transcript_message_idempotency",
		definition: `
      ON transcript_event_identities(session_id, message_idempotency_key)
      WHERE message_idempotency_key IS NOT NULL
    `
	}
];
const OPERATOR_AGENT_MAINTENANCE_SCHEMA_COMPATIBILITY = { optionalCanonicalTriggerGroups: [{
	tableName: MEMORY_INDEX_SOURCES_TABLE,
	triggers: MEMORY_PATH_FTS_TRIGGER_DEFINITIONS
}] };
const agentDbLog = require_subsystem.createSubsystemLogger("state/agent-db");
const cachedDatabases = /* @__PURE__ */ new Map();
function logSlowAgentDatabaseOpen(params) {
	if (params.elapsedMs < OPERATOR_AGENT_DB_SLOW_OPEN_MS) return;
	agentDbLog.warn("slow Operator agent database open", {
		agentId: params.agentId,
		elapsedMs: params.elapsedMs,
		path: params.path,
		thresholdMs: OPERATOR_AGENT_DB_SLOW_OPEN_MS
	});
}
function assertSupportedAgentSchemaVersion(db, pathname) {
	const userVersion = require_state_migrations_cron_run_logs.readSqliteUserVersion(db);
	if (userVersion > 9) throw require_state_migrations_cron_run_logs.createNewerSqliteSchemaVersionError("Operator agent database", pathname, userVersion, 9);
}
function migratedSessionColumn(columns, columnName, fallback) {
	return columns.has(columnName) ? columnName : fallback;
}
function dropLegacySessionTranscriptSearchSchema(db) {
	db.exec("DROP TABLE IF EXISTS session_transcript_files;");
	if (db.prepare("PRAGMA table_info(session_transcript_fts)").all().some((row) => row.name === "session_key")) db.exec(`
      DROP TABLE IF EXISTS session_transcript_fts;
      DROP TABLE IF EXISTS session_transcript_index_state;
    `);
}
function dropLegacyMemoryIndexSchema(db) {
	if (!db.prepare("PRAGMA table_info(memory_index_sources)").all().some((row) => row.name === "source_kind")) return;
	db.exec(`
    DROP TABLE IF EXISTS memory_index_chunks_fts;
    DROP TABLE IF EXISTS memory_index_chunks;
    DROP TABLE IF EXISTS memory_index_sources;
  `);
}
function migrateOperatorAgentSchema(db) {
	const userVersion = require_state_migrations_cron_run_logs.readSqliteUserVersion(db);
	if (userVersion >= 9) return;
	if (userVersion < 7) {
		db.exec("DROP INDEX IF EXISTS idx_agent_sessions_status;");
		migrateSessionEntryStatusProjection(db, (entryJson) => {
			const entry = parseMigratedSessionEntry(entryJson);
			return entry ? migratedStatus(entry.status) : null;
		});
	}
	if (userVersion < 6) db.exec("DROP INDEX IF EXISTS idx_agent_session_entries_session_id;");
	if (userVersion < 3) db.exec("DROP INDEX IF EXISTS idx_agent_transcript_events_session;");
	const columns = readSqliteTableColumns(db, "sessions");
	if (columns && !columns.has("transcript_updated_at")) db.exec("ALTER TABLE sessions ADD COLUMN transcript_updated_at INTEGER DEFAULT NULL;");
	if (columns && !columns.has("transcript_observed_at")) db.exec("ALTER TABLE sessions ADD COLUMN transcript_observed_at INTEGER DEFAULT NULL;");
	addSessionProvenanceColumns(db, columns);
	if (!columns) return;
	if (userVersion > 1) {
		backfillTranscriptMutationWatermarks(db);
		return;
	}
	const copyColumns = [
		"session_id",
		"session_key",
		"session_scope",
		"created_at",
		"updated_at",
		"session_entry_provenance",
		"acp_owned",
		"plugin_owner_id",
		"hook_external_content_source",
		"started_at",
		"ended_at",
		"status",
		"chat_type",
		"channel",
		"account_id",
		"primary_conversation_id",
		"model_provider",
		"model",
		"agent_harness_id",
		"parent_session_key",
		"spawned_by",
		"display_name"
	];
	const selectColumns = [
		"session_id",
		"session_key",
		migratedSessionColumn(columns, "session_scope", "'conversation'"),
		"created_at",
		"updated_at",
		migratedSessionColumn(columns, "session_entry_provenance", "0"),
		migratedSessionColumn(columns, "acp_owned", "0"),
		migratedSessionColumn(columns, "plugin_owner_id", "NULL"),
		migratedSessionColumn(columns, "hook_external_content_source", "NULL"),
		migratedSessionColumn(columns, "started_at", "NULL"),
		migratedSessionColumn(columns, "ended_at", "NULL"),
		migratedSessionColumn(columns, "status", "NULL"),
		migratedSessionColumn(columns, "chat_type", "NULL"),
		migratedSessionColumn(columns, "channel", "NULL"),
		migratedSessionColumn(columns, "account_id", "NULL"),
		migratedSessionColumn(columns, "primary_conversation_id", "NULL"),
		migratedSessionColumn(columns, "model_provider", "NULL"),
		migratedSessionColumn(columns, "model", "NULL"),
		migratedSessionColumn(columns, "agent_harness_id", "NULL"),
		migratedSessionColumn(columns, "parent_session_key", "NULL"),
		migratedSessionColumn(columns, "spawned_by", "NULL"),
		migratedSessionColumn(columns, "display_name", "NULL")
	];
	db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      conversation_id TEXT NOT NULL PRIMARY KEY,
      channel TEXT NOT NULL,
      account_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('direct', 'group', 'channel')),
      peer_id TEXT NOT NULL,
      parent_conversation_id TEXT,
      thread_id TEXT,
      native_channel_id TEXT,
      native_direct_user_id TEXT,
      label TEXT,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
	db.exec(`
      DROP TABLE IF EXISTS sessions_new;
      CREATE TABLE sessions_new (
        session_id TEXT NOT NULL PRIMARY KEY,
        session_key TEXT NOT NULL,
        session_scope TEXT NOT NULL DEFAULT 'conversation' CHECK (session_scope IN ('conversation', 'shared-main', 'group', 'channel')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        transcript_updated_at INTEGER DEFAULT NULL,
        transcript_observed_at INTEGER DEFAULT NULL,
        session_entry_provenance INTEGER NOT NULL DEFAULT 0 CHECK (session_entry_provenance IN (0, 1)),
        acp_owned INTEGER NOT NULL DEFAULT 0 CHECK (acp_owned IN (0, 1)),
        plugin_owner_id TEXT,
        hook_external_content_source TEXT CHECK (hook_external_content_source IS NULL OR hook_external_content_source IN ('gmail', 'webhook')),
        started_at INTEGER,
        ended_at INTEGER,
        status TEXT CHECK (status IS NULL OR status IN ('running', 'done', 'failed', 'killed', 'timeout')),
        chat_type TEXT CHECK (chat_type IS NULL OR chat_type IN ('direct', 'group', 'channel')),
        channel TEXT,
        account_id TEXT,
        primary_conversation_id TEXT,
        model_provider TEXT,
        model TEXT,
        agent_harness_id TEXT,
        parent_session_key TEXT,
        spawned_by TEXT,
        display_name TEXT,
        FOREIGN KEY (primary_conversation_id) REFERENCES conversations(conversation_id) ON DELETE SET NULL
      );
      INSERT INTO sessions_new (${copyColumns.join(", ")})
      SELECT ${selectColumns.join(", ")} FROM sessions;
      DROP TABLE sessions;
      ALTER TABLE sessions_new RENAME TO sessions;
    `);
	backfillTranscriptMutationWatermarks(db);
}
function parseMigratedSessionEntry(value) {
	if (typeof value !== "string") return null;
	try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
function migratedObjectField(entry, key) {
	const value = entry[key];
	return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function migratedText(value) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}
function migratedNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function migratedChatType(value) {
	if (value === "direct" || value === "group" || value === "channel") return value;
	return null;
}
function migratedStatus(value) {
	if (value === "running" || value === "done" || value === "failed" || value === "killed" || value === "timeout") return value;
	return null;
}
function migratedSessionScope(entry, sessionKey) {
	const chatType = migratedChatType(entry.chatType);
	const normalizedKey = sessionKey.trim().toLowerCase();
	if (chatType === "direct" && (normalizedKey === "main" || normalizedKey.endsWith(":main"))) return "shared-main";
	if (chatType === "group" || chatType === "channel") return chatType;
	return "conversation";
}
function migratedEntryChannel(entry) {
	const deliveryContext = migratedObjectField(entry, "deliveryContext");
	const origin = migratedObjectField(entry, "origin");
	return migratedText(entry.channel) ?? migratedText(deliveryContext?.channel) ?? migratedText(entry.lastChannel) ?? migratedText(origin?.provider);
}
function migratedEntryAccountId(entry) {
	const deliveryContext = migratedObjectField(entry, "deliveryContext");
	const origin = migratedObjectField(entry, "origin");
	return migratedText(deliveryContext?.accountId) ?? migratedText(entry.lastAccountId) ?? migratedText(origin?.accountId);
}
function migratedEntryDisplayName(entry) {
	return migratedText(entry.displayName) ?? migratedText(entry.label) ?? migratedText(entry.subject) ?? migratedText(entry.groupId);
}
function backfillOperatorAgentSchema(db, previousVersion) {
	if (previousVersion >= 2) return;
	db.exec(`
    INSERT OR REPLACE INTO session_routes (session_key, session_id, updated_at)
    SELECT se.session_key, se.session_id, se.updated_at
    FROM session_entries AS se
    INNER JOIN sessions AS s ON s.session_id = se.session_id;
  `);
	const rows = db.prepare(`
        SELECT se.session_key, se.session_id, se.entry_json
        FROM session_entries AS se
        INNER JOIN sessions AS s ON s.session_id = se.session_id;
      `).all();
	const update = db.prepare(`
    UPDATE sessions
    SET
      session_scope = ?,
      started_at = ?,
      ended_at = ?,
      status = ?,
      chat_type = ?,
      channel = ?,
      account_id = ?,
      model_provider = ?,
      model = ?,
      agent_harness_id = ?,
      parent_session_key = ?,
      spawned_by = ?,
      display_name = ?
    WHERE session_id = ?;
  `);
	for (const row of rows) {
		const sessionKey = migratedText(row.session_key);
		const sessionId = migratedText(row.session_id);
		const entry = parseMigratedSessionEntry(row.entry_json);
		if (!sessionKey || !sessionId || !entry) continue;
		update.run(migratedSessionScope(entry, sessionKey), migratedNumber(entry.startedAt), migratedNumber(entry.endedAt), migratedStatus(entry.status), migratedChatType(entry.chatType), migratedEntryChannel(entry), migratedEntryAccountId(entry), migratedText(entry.modelProvider), migratedText(entry.model), migratedText(entry.agentHarnessId), migratedText(entry.parentSessionKey), migratedText(entry.spawnedBy), migratedEntryDisplayName(entry), sessionId);
	}
}
function ensureOperatorAgentDatabasePermissions(pathname, options) {
	const dir = node_path.default.dirname(pathname);
	const defaultPath = resolveOperatorAgentSqlitePath({
		agentId: options.agentId,
		env: options.env
	});
	const isDefaultAgentDatabase = node_path.default.resolve(pathname) === node_path.default.resolve(defaultPath);
	const dirExisted = (0, node_fs.existsSync)(dir);
	(0, node_fs.mkdirSync)(dir, {
		recursive: true,
		mode: OPERATOR_AGENT_DB_DIR_MODE
	});
	if (isDefaultAgentDatabase || !dirExisted) (0, node_fs.chmodSync)(dir, OPERATOR_AGENT_DB_DIR_MODE);
	for (const candidate of require_state_migrations_cron_run_logs.resolveSqliteDatabaseFilePaths(pathname)) if ((0, node_fs.existsSync)(candidate)) (0, node_fs.chmodSync)(candidate, OPERATOR_AGENT_DB_FILE_MODE);
}
function readExistingSchemaMeta(db) {
	if (!db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_meta'").get()) return null;
	const row = db.prepare("SELECT role, schema_version, agent_id FROM schema_meta WHERE meta_key = 'primary'").get();
	if (!row) return null;
	return {
		agentId: typeof row.agent_id === "string" ? row.agent_id : null,
		role: typeof row.role === "string" ? row.role : null,
		schemaVersion: typeof row.schema_version === "number" ? row.schema_version : null
	};
}
function assertExistingSchemaOwner(existing, agentId, pathname) {
	if (!existing) return;
	if (existing.role !== "agent") throw new Error(`Operator agent database ${pathname} has schema role ${existing.role ?? "unknown"}; expected agent.`);
	if (!existing.agentId) throw new Error(`Operator agent database ${pathname} has no agent owner.`);
	if ((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(existing.agentId) !== agentId) throw new Error(`Operator agent database ${pathname} belongs to agent ${existing.agentId}; requested agent ${agentId}.`);
}
/** Require the exact agent owner and schema before offline file maintenance. */
function assertOperatorAgentDatabaseForMaintenance(database, options) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(options.agentId);
	const metadata = readExistingSchemaMeta(database);
	if (!metadata) throw new Error(`Operator agent database ${options.pathname} has no schema ownership metadata.`);
	assertExistingSchemaOwner(metadata, agentId, options.pathname);
	const userVersion = require_state_migrations_cron_run_logs.readSqliteUserVersion(database);
	if (userVersion > 9) throw require_state_migrations_cron_run_logs.createNewerSqliteSchemaVersionError("Operator agent database", options.pathname, userVersion, 9);
	if (userVersion !== 9) throw new Error(`Operator agent database ${options.pathname} uses schema version ${userVersion}; run openclaw doctor --fix before compacting it.`);
	if (metadata.schemaVersion !== 9) throw new Error(`Operator agent database ${options.pathname} metadata schema version ${metadata.schemaVersion ?? "invalid"} does not match 9; run openclaw doctor --fix before compacting it.`);
	require_state_migrations_cron_run_logs.assertSqliteSchemaContains(database, options.pathname, OPERATOR_AGENT_SCHEMA_SQL, OPERATOR_AGENT_MAINTENANCE_SCHEMA_COMPATIBILITY);
}
/** Upgrade a supported older owned schema before strict offline maintenance. */
function migrateOperatorAgentDatabaseForMaintenance(options) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(options.agentId);
	const database = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(options.pathname);
	try {
		database.exec(`PRAGMA busy_timeout = ${require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS};`);
		const metadata = readExistingSchemaMeta(database);
		if (!metadata) return;
		assertExistingSchemaOwner(metadata, agentId, options.pathname);
		assertSupportedAgentSchemaVersion(database, options.pathname);
		const userVersion = require_state_migrations_cron_run_logs.readSqliteUserVersion(database);
		const metadataVersion = metadata.schemaVersion;
		if (!(userVersion >= 1 && userVersion < 9 && metadataVersion !== null && metadataVersion === userVersion && metadataVersion >= 1 && metadataVersion < 9)) return;
		ensureOperatorAgentDatabaseSchema(database, {
			agentId,
			path: options.pathname
		});
	} finally {
		require_state_migrations_cron_run_logs.clearNodeSqliteKyselyCacheForDatabase(database);
		database.close();
	}
}
function ensureAgentSchema(db, agentId, pathname) {
	db.exec("PRAGMA foreign_keys = OFF;");
	try {
		require_state_migrations_cron_run_logs.runSqliteImmediateTransactionSync(db, () => {
			assertExistingSchemaOwner(readExistingSchemaMeta(db), agentId, pathname);
			assertSupportedAgentSchemaVersion(db, pathname);
			const previousVersion = require_state_migrations_cron_run_logs.readSqliteUserVersion(db);
			dropLegacyMemoryIndexSchema(db);
			dropLegacySessionTranscriptSearchSchema(db);
			migrateMemoryIndexSourcesIdentity(db);
			migrateOperatorAgentSchema(db);
			db.exec(OPERATOR_AGENT_SCHEMA_SQL);
			if (previousVersion < 9) require_state_migrations_cron_run_logs.migrateSqliteSchemaToStrictInTransaction(db, OPERATOR_AGENT_SCHEMA_SQL, { databaseLabel: pathname });
			require_state_migrations_cron_run_logs.repairCanonicalSqliteUniqueIndexes(db, pathname, OPERATOR_AGENT_CANONICAL_UNIQUE_INDEXES);
			backfillOperatorAgentSchema(db, previousVersion);
			backfillSessionEntryProvenance(db, previousVersion);
			const kysely = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
			db.exec(`PRAGMA user_version = 9;`);
			const now = Date.now();
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.insertInto("schema_meta").values({
				meta_key: "primary",
				role: "agent",
				schema_version: 9,
				agent_id: agentId,
				app_version: null,
				created_at: now,
				updated_at: now
			}).onConflict((conflict) => conflict.column("meta_key").doUpdateSet({
				role: "agent",
				schema_version: 9,
				agent_id: agentId,
				app_version: null,
				updated_at: now
			})));
		});
	} finally {
		db.exec("PRAGMA foreign_keys = ON;");
	}
}
/** Initialize agent schema/ownership metadata on an independently managed connection. */
function ensureOperatorAgentDatabaseSchema(db, options) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(options.agentId);
	const databaseOptions = {
		...options,
		agentId
	};
	const pathname = resolveOperatorAgentSqlitePath(databaseOptions);
	ensureOperatorAgentDatabasePermissions(pathname, databaseOptions);
	assertAgentDatabaseIntegrityBeforeMutation(db, pathname);
	require_state_migrations_cron_run_logs.configureSqlitePreSchemaPragmas(db, { busyTimeoutMs: require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS });
	ensureAgentSchema(db, agentId, pathname);
	ensureOperatorAgentDatabasePermissions(pathname, databaseOptions);
	if (options.register === true) registerAgentDatabase({
		agentId,
		path: pathname,
		env: options.env
	});
}
function registerAgentDatabase(params) {
	let sizeBytes = null;
	try {
		sizeBytes = (0, node_fs.statSync)(params.path).size;
	} catch {
		sizeBytes = null;
	}
	const lastSeenAt = Date.now();
	require_openclaw_state_db.runOperatorStateWriteTransaction((database) => {
		const db = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.insertInto("agent_databases").values({
			agent_id: params.agentId,
			path: params.path,
			schema_version: 9,
			last_seen_at: lastSeenAt,
			size_bytes: sizeBytes
		}).onConflict((conflict) => conflict.columns(["agent_id", "path"]).doUpdateSet({
			schema_version: 9,
			last_seen_at: lastSeenAt,
			size_bytes: sizeBytes
		})));
	}, { env: params.env });
}
function unregisterAgentDatabase(params) {
	require_openclaw_state_db.runOperatorStateWriteTransaction((database) => {
		const db = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, db.deleteFrom("agent_databases").where("agent_id", "=", params.agentId).where("path", "=", params.path));
	}, { env: params.env });
}
function hasUnavailableMissingSqlitePath(pathname) {
	for (const candidate of require_state_migrations_cron_run_logs.resolveSqliteDatabaseFilePaths(pathname)) try {
		(0, node_fs.lstatSync)(candidate);
		return true;
	} catch (error) {
		if (error.code !== "ENOENT") return true;
	}
	let ancestor = node_path.default.dirname(pathname);
	while (true) {
		try {
			const stat = (0, node_fs.lstatSync)(ancestor);
			if (!stat.isSymbolicLink()) return !stat.isDirectory();
			try {
				return !(0, node_fs.statSync)(ancestor).isDirectory();
			} catch {
				return true;
			}
		} catch (error) {
			if (error.code !== "ENOENT") return true;
		}
		const parent = node_path.default.dirname(ancestor);
		if (parent === ancestor) return false;
		ancestor = parent;
	}
}
/** List agent databases recorded in the shared Operator state registry. */
function listOperatorRegisteredAgentDatabases(options = {}) {
	const pathname = node_path.default.resolve(options.path ?? require_openclaw_state_db.resolveOperatorStateSqlitePath(options.env ?? process.env));
	if (!(0, node_fs.existsSync)(pathname)) {
		if (hasUnavailableMissingSqlitePath(pathname)) throw new Error(`Operator state database ${pathname} is unavailable.`);
		return [];
	}
	if (require_openclaw_state_db.detectOperatorStateDatabaseSchemaMigrations(options).length > 0) throw new Error(`Operator state database ${pathname} has a legacy agent database registry schema; run openclaw doctor --fix to migrate it.`);
	const database = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(pathname, { readOnly: true });
	try {
		database.exec(`PRAGMA busy_timeout = ${require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS};`);
		if (require_state_migrations_cron_run_logs.readSqliteUserVersion(database) > 3) throw new Error(`Operator state database ${pathname} uses a newer schema than this Operator build.`);
		const registryTable = database.prepare("SELECT type FROM sqlite_master WHERE name = 'agent_databases'").get();
		if (!registryTable) return [];
		if (registryTable.type !== "table") throw new Error(`Operator state database ${pathname} has an invalid agent registry.`);
		return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database, require_state_migrations_cron_run_logs.getNodeSqliteKysely(database).selectFrom("agent_databases").selectAll().orderBy("agent_id", "asc").orderBy("path", "asc")).rows.map((row) => ({
			agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(row.agent_id),
			path: row.path,
			schemaVersion: row.schema_version,
			lastSeenAt: row.last_seen_at,
			sizeBytes: row.size_bytes
		}));
	} finally {
		require_state_migrations_cron_run_logs.clearNodeSqliteKyselyCacheForDatabase(database);
		database.close();
	}
}
/** Read a database's durable role and agent owner without mutating it. */
function inspectOperatorAgentDatabaseOwner(pathname) {
	const sqlite = require_state_migrations_cron_run_logs.requireNodeSqlite();
	let db;
	try {
		db = new sqlite.DatabaseSync(pathname, { readOnly: true });
		db.exec(`PRAGMA busy_timeout = ${require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS};`);
		assertSupportedAgentSchemaVersion(db, pathname);
		const existing = readExistingSchemaMeta(db);
		if (!existing) return { status: "unowned" };
		if (existing.role !== "agent" || !existing.agentId) return { status: "unreadable" };
		return {
			status: "owned",
			agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(existing.agentId)
		};
	} catch {
		return { status: "unreadable" };
	} finally {
		db?.close();
	}
}
function assertAgentDatabaseIntegrityBeforeMutation(database, pathname) {
	database.exec(`PRAGMA busy_timeout = ${require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS};`);
	require_state_migrations_cron_run_logs.assertSqliteIntegrity(database, pathname);
}
/** Open or return a cached per-agent database after schema and owner validation. */
function openOperatorAgentDatabase(options) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(options.agentId);
	const databaseOptions = {
		...options,
		agentId
	};
	const pathname = resolveOperatorAgentSqlitePath(databaseOptions);
	const cached = cachedDatabases.get(pathname);
	if (cached?.db.isOpen) {
		if (cached.agentId !== agentId) throw new Error(`Operator agent database ${pathname} is already open for agent ${cached.agentId}; requested agent ${agentId}.`);
		return cached;
	}
	if (cached) {
		cached.walMaintenance.close();
		require_state_migrations_cron_run_logs.clearNodeSqliteKyselyCacheForDatabase(cached.db);
		cachedDatabases.delete(pathname);
	}
	const openStartedAt = Date.now();
	ensureOperatorAgentDatabasePermissions(pathname, databaseOptions);
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(pathname);
	const walMaintenance = (() => {
		let maintenance;
		try {
			assertAgentDatabaseIntegrityBeforeMutation(db, pathname);
			require_state_migrations_cron_run_logs.configureSqlitePreSchemaPragmas(db, { busyTimeoutMs: require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS });
			maintenance = require_state_migrations_cron_run_logs.configureSqliteConnectionPragmas(db, {
				busyTimeoutMs: require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS,
				databaseLabel: `operator-agent:${agentId}`,
				databasePath: pathname,
				foreignKeys: true,
				synchronous: "NORMAL"
			});
			ensureAgentSchema(db, agentId, pathname);
			return maintenance;
		} catch (err) {
			maintenance?.close();
			db.close();
			throw err;
		}
	})();
	ensureOperatorAgentDatabasePermissions(pathname, databaseOptions);
	const database = {
		agentId,
		db,
		path: pathname,
		walMaintenance
	};
	try {
		registerAgentDatabase({
			agentId,
			path: pathname,
			env: options.env
		});
	} catch (error) {
		closeCachedOperatorAgentDatabase(database);
		throw error;
	}
	cachedDatabases.set(pathname, database);
	unregisterExitClose ??= require_state_migrations_cron_run_logs.registerSqliteCacheExitClose(closeOperatorAgentDatabases);
	logSlowAgentDatabaseOpen({
		agentId,
		elapsedMs: Date.now() - openStartedAt,
		path: pathname
	});
	return database;
}
/** Run a synchronous immediate transaction against an agent database. */
const postCommitPublications = /* @__PURE__ */ new WeakMap();
/** Queue a non-throwing runtime publication on the outer database commit edge. */
function deferOperatorAgentPostCommitPublication(database, publish) {
	const publications = postCommitPublications.get(database);
	if (!publications) return false;
	publications.push(publish);
	return true;
}
function runOperatorAgentWriteTransaction(operation, options, transactionOptions = {}) {
	const database = openOperatorAgentDatabase(options);
	const enteredNestedTransaction = database.db.isTransaction;
	const publications = enteredNestedTransaction ? postCommitPublications.get(database) : [];
	const publicationStart = publications?.length ?? 0;
	if (!enteredNestedTransaction && publications) postCommitPublications.set(database, publications);
	let result;
	try {
		result = require_state_migrations_cron_run_logs.runSqliteImmediateTransactionSync(database.db, () => {
			const operationResult = operation(database);
			if (!enteredNestedTransaction) ensureOperatorAgentDatabasePermissions(database.path, options);
			return operationResult;
		}, {
			busyTimeoutMs: require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS,
			databaseLabel: database.path,
			...transactionOptions,
			operationLabel: transactionOptions.operationLabel ?? "agent.write"
		});
	} catch (error) {
		publications?.splice(publicationStart);
		throw error;
	} finally {
		if (!enteredNestedTransaction && publications) postCommitPublications.delete(database);
	}
	if (!enteredNestedTransaction) for (const publish of publications ?? []) publish();
	return result;
}
let unregisterExitClose = null;
function closeCachedOperatorAgentDatabase(database) {
	database.walMaintenance.close();
	require_state_migrations_cron_run_logs.clearNodeSqliteKyselyCacheForDatabase(database.db);
	if (database.db.isOpen) database.db.close();
}
/** Return whether the exact cached agent database pathname is still open. */
function isOperatorAgentDatabaseOpen(pathname) {
	return cachedDatabases.get(node_path.default.resolve(pathname))?.db.isOpen === true;
}
/** Close one cached agent database identified by its exact resolved pathname. */
function closeOperatorAgentDatabaseByPath(pathname) {
	const resolvedPath = node_path.default.resolve(pathname);
	const database = cachedDatabases.get(resolvedPath);
	if (!database) return false;
	closeCachedOperatorAgentDatabase(database);
	cachedDatabases.delete(resolvedPath);
	if (cachedDatabases.size === 0) {
		unregisterExitClose?.();
		unregisterExitClose = null;
	}
	return true;
}
/** Close and unregister one transient agent database by exact cached pathname. */
function disposeOperatorAgentDatabaseByPath(pathname, options = {}) {
	const resolvedPath = node_path.default.resolve(pathname);
	const database = cachedDatabases.get(resolvedPath);
	if (!database || database.path !== resolvedPath) return false;
	try {
		unregisterAgentDatabase({
			agentId: database.agentId,
			path: resolvedPath,
			...options.env ? { env: options.env } : {}
		});
	} finally {
		closeOperatorAgentDatabaseByPath(resolvedPath);
	}
	return true;
}
/** Close all cached agent database handles. */
function closeOperatorAgentDatabases() {
	unregisterExitClose?.();
	unregisterExitClose = null;
	for (const database of cachedDatabases.values()) closeCachedOperatorAgentDatabase(database);
	cachedDatabases.clear();
}
//#endregion
Object.defineProperty(exports, "MEMORY_INDEX_CHUNKS_TABLE", {
	enumerable: true,
	get: function() {
		return MEMORY_INDEX_CHUNKS_TABLE;
	}
});
Object.defineProperty(exports, "MEMORY_INDEX_META_TABLE", {
	enumerable: true,
	get: function() {
		return MEMORY_INDEX_META_TABLE;
	}
});
Object.defineProperty(exports, "MEMORY_INDEX_SOURCES_TABLE", {
	enumerable: true,
	get: function() {
		return MEMORY_INDEX_SOURCES_TABLE;
	}
});
Object.defineProperty(exports, "assertOperatorAgentDatabaseForMaintenance", {
	enumerable: true,
	get: function() {
		return assertOperatorAgentDatabaseForMaintenance;
	}
});
Object.defineProperty(exports, "closeOperatorAgentDatabaseByPath", {
	enumerable: true,
	get: function() {
		return closeOperatorAgentDatabaseByPath;
	}
});
Object.defineProperty(exports, "deferOperatorAgentPostCommitPublication", {
	enumerable: true,
	get: function() {
		return deferOperatorAgentPostCommitPublication;
	}
});
Object.defineProperty(exports, "disposeOperatorAgentDatabaseByPath", {
	enumerable: true,
	get: function() {
		return disposeOperatorAgentDatabaseByPath;
	}
});
Object.defineProperty(exports, "ensureOperatorAgentDatabasePermissions", {
	enumerable: true,
	get: function() {
		return ensureOperatorAgentDatabasePermissions;
	}
});
Object.defineProperty(exports, "formatErrorMessage", {
	enumerable: true,
	get: function() {
		return formatErrorMessage;
	}
});
Object.defineProperty(exports, "inspectOperatorAgentDatabaseOwner", {
	enumerable: true,
	get: function() {
		return inspectOperatorAgentDatabaseOwner;
	}
});
Object.defineProperty(exports, "isOperatorAgentDatabaseOpen", {
	enumerable: true,
	get: function() {
		return isOperatorAgentDatabaseOpen;
	}
});
Object.defineProperty(exports, "listOperatorRegisteredAgentDatabases", {
	enumerable: true,
	get: function() {
		return listOperatorRegisteredAgentDatabases;
	}
});
Object.defineProperty(exports, "migrateOperatorAgentDatabaseForMaintenance", {
	enumerable: true,
	get: function() {
		return migrateOperatorAgentDatabaseForMaintenance;
	}
});
Object.defineProperty(exports, "openOperatorAgentDatabase", {
	enumerable: true,
	get: function() {
		return openOperatorAgentDatabase;
	}
});
Object.defineProperty(exports, "openclaw_agent_db_exports", {
	enumerable: true,
	get: function() {
		return openclaw_agent_db_exports;
	}
});
Object.defineProperty(exports, "resolveOperatorAgentSqlitePath", {
	enumerable: true,
	get: function() {
		return resolveOperatorAgentSqlitePath;
	}
});
Object.defineProperty(exports, "runOperatorAgentWriteTransaction", {
	enumerable: true,
	get: function() {
		return runOperatorAgentWriteTransaction;
	}
});
