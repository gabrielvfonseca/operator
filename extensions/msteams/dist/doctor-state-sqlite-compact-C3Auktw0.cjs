const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_doctor_sqlite_compact = require("./doctor-sqlite-compact-Cw8xcLuR.cjs");
const require_doctor_sqlite_maintenance_lock = require("./doctor-sqlite-maintenance-lock-DBgRaRhw.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
//#region src/commands/doctor-state-sqlite-compact.ts
/** Explicit doctor maintenance for the canonical shared state SQLite database. */
/** Compact only the canonical shared state database resolved for this invocation. */
async function runDoctorStateSqliteCompact(options = {}, deps = {}) {
	const env = options.env ?? process.env;
	const sqlitePath = require_openclaw_state_db.resolveOperatorStateSqlitePath(env);
	const stat = readCanonicalStateDatabaseStat(sqlitePath);
	if (!stat) return {
		mode: "compact",
		path: sqlitePath,
		reason: "missing",
		skipped: true
	};
	if (!stat.isFile()) throw new Error(`Canonical Operator state database is not a regular file: ${sqlitePath}`);
	return await (deps.withMaintenanceLock ?? require_doctor_sqlite_maintenance_lock.withDoctorSqliteMaintenanceLock)({
		env,
		operation: "state SQLite compaction",
		run: () => {
			if (require_openclaw_state_db.isOperatorStateDatabaseOpen()) throw new Error("The shared Operator state database is already open in this process. Stop Operator and retry.");
			return {
				...require_doctor_sqlite_compact.compactDoctorSqliteFile({
					afterMutation: () => require_openclaw_state_db.ensureOperatorStatePermissions(sqlitePath, env),
					...deps.busyTimeoutMs !== void 0 ? { busyTimeoutMs: deps.busyTimeoutMs } : {},
					sqlitePath,
					validateBeforeMutation: (database) => require_openclaw_state_db.assertOperatorStateDatabaseForMaintenance(database, { pathname: sqlitePath })
				}),
				mode: "compact",
				path: sqlitePath,
				skipped: false
			};
		}
	});
}
function readCanonicalStateDatabaseStat(sqlitePath) {
	try {
		return node_fs.default.lstatSync(sqlitePath);
	} catch (error) {
		if (error.code === "ENOENT") return;
		throw error;
	}
}
//#endregion
exports.runDoctorStateSqliteCompact = runDoctorStateSqliteCompact;
