const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/state/openclaw-state-db-readonly.ts
function assertSupportedSchemaVersion(db, pathname) {
	const userVersion = require_state_migrations_cron_run_logs.readSqliteUserVersion(db);
	if (userVersion > 3) throw require_state_migrations_cron_run_logs.createNewerSqliteSchemaVersionError("Operator state database", pathname, userVersion, 3);
}
/**
* Read shared state without joining the writable lifecycle.
*
* CLI metadata reads can overlap a live Gateway. Keep them off schema repair,
* journal-mode setup, checkpoints, and permission mutation owned by writers.
*/
function withOperatorStateDatabaseReadOnly(operation, options = {}) {
	const pathname = node_path.default.resolve(options.path ?? require_openclaw_state_db.resolveOperatorStateSqlitePath(options.env ?? process.env));
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(pathname, { readOnly: true });
	try {
		db.exec(`PRAGMA busy_timeout = ${require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS};`);
		assertSupportedSchemaVersion(db, pathname);
		return operation({
			db,
			path: pathname
		});
	} finally {
		require_state_migrations_cron_run_logs.clearNodeSqliteKyselyCacheForDatabase(db);
		db.close();
	}
}
//#endregion
Object.defineProperty(exports, "withOperatorStateDatabaseReadOnly", {
	enumerable: true,
	get: function() {
		return withOperatorStateDatabaseReadOnly;
	}
});
