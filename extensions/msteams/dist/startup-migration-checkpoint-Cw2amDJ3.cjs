const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_openclaw_state_db_readonly = require("./openclaw-state-db-readonly-tU1PH4QL.cjs");
let node_fs = require("node:fs");
let node_module = require("node:module");
let node_crypto = require("node:crypto");
//#region src/infra/startup-migration-checkpoint.ts
var startup_migration_checkpoint_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	STARTUP_MIGRATION_LEASE_TTL_MS: () => STARTUP_MIGRATION_LEASE_TTL_MS,
	acquireStartupMigrationLease: () => acquireStartupMigrationLease,
	hasActiveStartupMigrationLease: () => hasActiveStartupMigrationLease,
	needsStartupMigrationCheckpoint: () => needsStartupMigrationCheckpoint,
	readStartupMigrationVersion: () => readStartupMigrationVersion,
	recordSuccessfulStartupMigrations: () => recordSuccessfulStartupMigrations
});
const STARTUP_MIGRATION_META_KEY = "startup-migrations";
const STARTUP_MIGRATION_BUILD_SEPARATOR = "\n";
const STARTUP_MIGRATION_LEASE_SCOPE = "startup-migrations";
const STARTUP_MIGRATION_LEASE_KEY = "global";
const STARTUP_MIGRATION_LEASE_TTL_MS = 5 * 6e4;
function formatStartupMigrationCheckpoint(version, buildIdentity) {
	return `${version}${STARTUP_MIGRATION_BUILD_SEPARATOR}${buildIdentity}`;
}
function resolveStartupMigrationBuildIdentity(moduleUrl = require("url").pathToFileURL(__filename).href) {
	try {
		const require = (0, node_module.createRequire)(moduleUrl);
		for (const candidate of [
			"./build-info.json",
			"../build-info.json",
			"../../dist/build-info.json"
		]) try {
			const info = require(candidate);
			if (typeof info.builtAt !== "string" || !info.builtAt.trim()) continue;
			return info.builtAt.trim();
		} catch {}
	} catch {}
	return null;
}
function withStartupMigrationCheckpointDatabase(env, callback) {
	return require_openclaw_state_db.withOperatorStateStartupMigrationCheckpointDatabase(callback, { env });
}
function writeStartupMigrationCheckpointDatabase(env, callback) {
	return withStartupMigrationCheckpointDatabase(env, (db) => require_state_migrations_cron_run_logs.runSqliteImmediateTransactionSync(db, () => callback(db)));
}
function readStartupMigrationCheckpoint(env) {
	return withStartupMigrationCheckpointDatabase(env, (db) => {
		return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("schema_meta").select("app_version as appVersion").where("meta_key", "=", STARTUP_MIGRATION_META_KEY))?.appVersion ?? null;
	});
}
function readStartupMigrationVersion(env = process.env) {
	return readStartupMigrationCheckpoint(env)?.split(STARTUP_MIGRATION_BUILD_SEPARATOR, 1)[0] ?? null;
}
/** Returns whether the canonical gateway startup-migration lease is still live. */
function hasActiveStartupMigrationLease(params = {}) {
	const env = params.env ?? process.env;
	const nowMs = params.nowMs ?? Date.now();
	if (!(0, node_fs.existsSync)(require_openclaw_state_db.resolveOperatorStateSqlitePath(env))) return false;
	return require_openclaw_state_db_readonly.withOperatorStateDatabaseReadOnly(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		return Boolean(require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("state_leases").select("owner").where("scope", "=", STARTUP_MIGRATION_LEASE_SCOPE).where("lease_key", "=", STARTUP_MIGRATION_LEASE_KEY).where("expires_at", ">", nowMs)));
	}, { env });
}
function needsStartupMigrationCheckpoint(params = {}) {
	const env = params.env ?? process.env;
	const buildIdentity = params.buildIdentity === void 0 ? resolveStartupMigrationBuildIdentity() : params.buildIdentity;
	if (buildIdentity === null) return true;
	return readStartupMigrationCheckpoint(env) !== formatStartupMigrationCheckpoint(params.version ?? require_version.VERSION, buildIdentity);
}
function acquireStartupMigrationLease(params = {}) {
	const env = params.env ?? process.env;
	const nowMs = params.nowMs ?? Date.now();
	const owner = params.owner ?? (0, node_crypto.randomUUID)();
	const expiresAt = nowMs + STARTUP_MIGRATION_LEASE_TTL_MS;
	writeStartupMigrationCheckpointDatabase(env, (db) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.deleteFrom("state_leases").where("scope", "=", STARTUP_MIGRATION_LEASE_SCOPE).where("lease_key", "=", STARTUP_MIGRATION_LEASE_KEY).where("expires_at", "<=", nowMs));
		const existing = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("state_leases").select(["owner", "expires_at as expiresAt"]).where("scope", "=", STARTUP_MIGRATION_LEASE_SCOPE).where("lease_key", "=", STARTUP_MIGRATION_LEASE_KEY));
		if (existing) throw new Error(`Operator startup migrations are already running for this state directory; retry after the other gateway finishes or after ${new Date(existing.expiresAt ?? expiresAt).toISOString()}.`);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("state_leases").values({
			scope: STARTUP_MIGRATION_LEASE_SCOPE,
			lease_key: STARTUP_MIGRATION_LEASE_KEY,
			owner,
			expires_at: expiresAt,
			heartbeat_at: nowMs,
			payload_json: JSON.stringify({ version: require_version.VERSION }),
			created_at: nowMs,
			updated_at: nowMs
		}));
	});
	return {
		owner,
		heartbeat: (heartbeatParams = {}) => {
			const heartbeatNowMs = heartbeatParams.nowMs ?? Date.now();
			const heartbeatExpiresAt = heartbeatNowMs + STARTUP_MIGRATION_LEASE_TTL_MS;
			writeStartupMigrationCheckpointDatabase(env, (db) => {
				if (require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).updateTable("state_leases").set({
					expires_at: heartbeatExpiresAt,
					heartbeat_at: heartbeatNowMs,
					updated_at: heartbeatNowMs
				}).where("scope", "=", STARTUP_MIGRATION_LEASE_SCOPE).where("lease_key", "=", STARTUP_MIGRATION_LEASE_KEY).where("owner", "=", owner).where("expires_at", ">", heartbeatNowMs)).numAffectedRows !== 1n) throw new Error("Operator startup migration lease was lost before startup migrations completed; restart the gateway so migrations can run under a fresh lease.");
			});
		},
		release: () => {
			writeStartupMigrationCheckpointDatabase(env, (db) => {
				require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).deleteFrom("state_leases").where("scope", "=", STARTUP_MIGRATION_LEASE_SCOPE).where("lease_key", "=", STARTUP_MIGRATION_LEASE_KEY).where("owner", "=", owner));
			});
		}
	};
}
function recordSuccessfulStartupMigrations(params = {}) {
	const env = params.env ?? process.env;
	const version = params.version ?? require_version.VERSION;
	const buildIdentity = params.buildIdentity === void 0 ? resolveStartupMigrationBuildIdentity() : params.buildIdentity;
	const nowMs = params.nowMs ?? Date.now();
	const checkpoint = buildIdentity === null ? version : formatStartupMigrationCheckpoint(version, buildIdentity);
	writeStartupMigrationCheckpointDatabase(env, (db) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		if (params.lease) {
			if (!require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("state_leases").select("owner").where("scope", "=", STARTUP_MIGRATION_LEASE_SCOPE).where("lease_key", "=", STARTUP_MIGRATION_LEASE_KEY).where("owner", "=", params.lease.owner).where("expires_at", ">", nowMs))) throw new Error("Operator startup migration lease was lost before checkpoint recording; restart the gateway so migrations can run under a fresh lease.");
		}
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.insertInto("schema_meta").values({
			meta_key: STARTUP_MIGRATION_META_KEY,
			role: "global",
			schema_version: buildIdentity === null ? 1 : 2,
			agent_id: null,
			app_version: checkpoint,
			created_at: nowMs,
			updated_at: nowMs
		}).onConflict((conflict) => conflict.column("meta_key").doUpdateSet({
			role: "global",
			schema_version: buildIdentity === null ? 1 : 2,
			agent_id: null,
			app_version: checkpoint,
			updated_at: nowMs
		})));
	});
}
//#endregion
Object.defineProperty(exports, "STARTUP_MIGRATION_LEASE_TTL_MS", {
	enumerable: true,
	get: function() {
		return STARTUP_MIGRATION_LEASE_TTL_MS;
	}
});
Object.defineProperty(exports, "hasActiveStartupMigrationLease", {
	enumerable: true,
	get: function() {
		return hasActiveStartupMigrationLease;
	}
});
Object.defineProperty(exports, "startup_migration_checkpoint_exports", {
	enumerable: true,
	get: function() {
		return startup_migration_checkpoint_exports;
	}
});
