const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/auth-profiles/sqlite.ts
/**
* SQLite persistence adapter for auth profile secrets and runtime state.
* The public helpers expose raw JSON payloads so normalization stays in the
* store/state layers that own compatibility rules.
*/
const PRIMARY_ROW_KEY = "primary";
function resolveAgentDir(agentDir) {
	return require_home_dir.resolveUserPath(agentDir ?? require_agent_scope_config.resolveDefaultAgentDir({}));
}
function inferAgentIdFromDir(agentDir) {
	const normalized = node_path.default.normalize(agentDir);
	if (node_path.default.basename(normalized) === "agent") {
		const parent = node_path.default.basename(node_path.default.dirname(normalized));
		if (parent) return parent;
	}
	return `custom-${require_crypto_digest.sha256HexPrefix(normalized, 12)}`;
}
function resolveAuthProfileDatabaseOptions(agentDir) {
	const dir = resolveAgentDir(agentDir);
	return {
		agentId: require_agent_scope_config.resolveRegisteredAgentIdForDir(dir) ?? inferAgentIdFromDir(dir),
		path: node_path.default.join(dir, "operator-agent.sqlite")
	};
}
/** Resolves the SQLite database path that stores auth profiles for an agent dir. */
function resolveAuthProfileDatabasePath(agentDir) {
	return resolveAuthProfileDatabaseOptions(agentDir).path;
}
/** Resolves the durable agent owner expected for an auth-profile database. */
function resolveAuthProfileDatabaseOwnerId(agentDir) {
	return resolveAuthProfileDatabaseOptions(agentDir).agentId;
}
/** Resolves the SQLite database and sidecar paths used by auth profiles. */
function resolveAuthProfileDatabaseFilePaths(agentDir) {
	return require_state_migrations_cron_run_logs.resolveSqliteDatabaseFilePaths(resolveAuthProfileDatabasePath(agentDir));
}
function parseJsonCell(raw) {
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function getAuthProfileKysely(db) {
	return require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
}
function inspectAuthProfileJsonCellReadOnly(pathname, target) {
	const sqlite = require_state_migrations_cron_run_logs.requireNodeSqlite();
	let db;
	try {
		db = new sqlite.DatabaseSync(pathname, { readOnly: true });
		db.exec(`PRAGMA busy_timeout = ${require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS};`);
		if (require_state_migrations_cron_run_logs.readSqliteUserVersion(db) > 9) return { status: "unreadable" };
		const tableName = target === "store" ? "auth_profile_store" : "auth_profile_state";
		const schemaObject = db.prepare("SELECT type FROM sqlite_master WHERE name = ?").get(tableName);
		if (!schemaObject) return {
			status: "missing",
			reason: "table"
		};
		if (schemaObject.type !== "table") return { status: "unreadable" };
		const kysely = getAuthProfileKysely(db);
		if (target === "store") {
			const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, kysely.selectFrom("auth_profile_store").select("store_json").where("store_key", "=", PRIMARY_ROW_KEY));
			if (!row) return {
				status: "missing",
				reason: "row"
			};
			try {
				return {
					status: "readable",
					raw: JSON.parse(row.store_json)
				};
			} catch {
				return { status: "unreadable" };
			}
		}
		const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, kysely.selectFrom("auth_profile_state").select("state_json").where("state_key", "=", PRIMARY_ROW_KEY));
		if (!row) return {
			status: "missing",
			reason: "row"
		};
		try {
			return {
				status: "readable",
				raw: JSON.parse(row.state_json)
			};
		} catch {
			return { status: "unreadable" };
		}
	} catch {
		return { status: "unreadable" };
	} finally {
		if (db) {
			require_state_migrations_cron_run_logs.clearNodeSqliteKyselyCacheForDatabase(db);
			db.close();
		}
	}
}
function readAuthProfileJsonCellReadOnly(pathname, target) {
	const result = inspectAuthProfileJsonCellReadOnly(pathname, target);
	return result.status === "readable" ? result.raw : null;
}
/** Distinguishes an absent auth row from a present store that could not be read. */
function inspectPersistedAuthProfileStoreRaw(agentDir) {
	const databasePath = resolveAuthProfileDatabasePath(agentDir);
	if (!node_fs.default.existsSync(databasePath)) return {
		status: "missing",
		reason: "database"
	};
	return inspectAuthProfileJsonCellReadOnly(databasePath, "store");
}
/** Distinguishes an absent auth-state row from state that could not be read. */
function inspectPersistedAuthProfileStateRaw(agentDir) {
	const databasePath = resolveAuthProfileDatabasePath(agentDir);
	if (!node_fs.default.existsSync(databasePath)) return {
		status: "missing",
		reason: "database"
	};
	return inspectAuthProfileJsonCellReadOnly(databasePath, "state");
}
/** Reads the raw persisted secrets-store payload without coercing the schema. */
function readPersistedAuthProfileStoreRaw(agentDir, database) {
	if (database) {
		const db = getAuthProfileKysely(database.db);
		return parseJsonCell(require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("auth_profile_store").select("store_json").where("store_key", "=", PRIMARY_ROW_KEY))?.store_json);
	}
	const databasePath = resolveAuthProfileDatabasePath(agentDir);
	if (!node_fs.default.existsSync(databasePath)) return null;
	return readAuthProfileJsonCellReadOnly(databasePath, "store");
}
/** Reads the raw persisted runtime-state payload without coercing the schema. */
function readPersistedAuthProfileStateRaw(agentDir, database) {
	if (database) {
		const db = getAuthProfileKysely(database.db);
		return parseJsonCell(require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, db.selectFrom("auth_profile_state").select("state_json").where("state_key", "=", PRIMARY_ROW_KEY))?.state_json);
	}
	const databasePath = resolveAuthProfileDatabasePath(agentDir);
	if (!node_fs.default.existsSync(databasePath)) return null;
	return readAuthProfileJsonCellReadOnly(databasePath, "state");
}
/** Writes the raw persisted secrets-store payload inside the auth database. */
function writePersistedAuthProfileStoreRaw(payload, agentDir, database) {
	const write = (target) => {
		const db = getAuthProfileKysely(target.db);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(target.db, db.insertInto("auth_profile_store").values({
			store_key: PRIMARY_ROW_KEY,
			store_json: JSON.stringify(payload),
			updated_at: Date.now()
		}).onConflict((conflict) => conflict.column("store_key").doUpdateSet({
			store_json: JSON.stringify(payload),
			updated_at: Date.now()
		})));
	};
	if (database) {
		write(database);
		return;
	}
	require_openclaw_agent_db.runOperatorAgentWriteTransaction(write, resolveAuthProfileDatabaseOptions(agentDir));
}
/** Writes or deletes the persisted runtime-state payload. */
function writePersistedAuthProfileStateRaw(payload, agentDir, database) {
	const write = (target) => {
		const db = getAuthProfileKysely(target.db);
		if (!payload) {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(target.db, db.deleteFrom("auth_profile_state").where("state_key", "=", PRIMARY_ROW_KEY));
			return;
		}
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(target.db, db.insertInto("auth_profile_state").values({
			state_key: PRIMARY_ROW_KEY,
			state_json: JSON.stringify(payload),
			updated_at: Date.now()
		}).onConflict((conflict) => conflict.column("state_key").doUpdateSet({
			state_json: JSON.stringify(payload),
			updated_at: Date.now()
		})));
	};
	if (database) {
		write(database);
		return;
	}
	require_openclaw_agent_db.runOperatorAgentWriteTransaction(write, resolveAuthProfileDatabaseOptions(agentDir));
}
/** Runs an auth-profile database write transaction for store/state updates. */
function runAuthProfileWriteTransaction(agentDir, operation) {
	return require_openclaw_agent_db.runOperatorAgentWriteTransaction(operation, resolveAuthProfileDatabaseOptions(agentDir));
}
//#endregion
Object.defineProperty(exports, "inspectPersistedAuthProfileStateRaw", {
	enumerable: true,
	get: function() {
		return inspectPersistedAuthProfileStateRaw;
	}
});
Object.defineProperty(exports, "inspectPersistedAuthProfileStoreRaw", {
	enumerable: true,
	get: function() {
		return inspectPersistedAuthProfileStoreRaw;
	}
});
Object.defineProperty(exports, "readPersistedAuthProfileStateRaw", {
	enumerable: true,
	get: function() {
		return readPersistedAuthProfileStateRaw;
	}
});
Object.defineProperty(exports, "readPersistedAuthProfileStoreRaw", {
	enumerable: true,
	get: function() {
		return readPersistedAuthProfileStoreRaw;
	}
});
Object.defineProperty(exports, "resolveAuthProfileDatabaseFilePaths", {
	enumerable: true,
	get: function() {
		return resolveAuthProfileDatabaseFilePaths;
	}
});
Object.defineProperty(exports, "resolveAuthProfileDatabaseOwnerId", {
	enumerable: true,
	get: function() {
		return resolveAuthProfileDatabaseOwnerId;
	}
});
Object.defineProperty(exports, "resolveAuthProfileDatabasePath", {
	enumerable: true,
	get: function() {
		return resolveAuthProfileDatabasePath;
	}
});
Object.defineProperty(exports, "runAuthProfileWriteTransaction", {
	enumerable: true,
	get: function() {
		return runAuthProfileWriteTransaction;
	}
});
Object.defineProperty(exports, "writePersistedAuthProfileStateRaw", {
	enumerable: true,
	get: function() {
		return writePersistedAuthProfileStateRaw;
	}
});
Object.defineProperty(exports, "writePersistedAuthProfileStoreRaw", {
	enumerable: true,
	get: function() {
		return writePersistedAuthProfileStoreRaw;
	}
});
