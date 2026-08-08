const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
//#region src/node-host/config.ts
/** Canonical shared-SQLite configuration for the node-host runner. */
const NODE_HOST_CONFIG_KEY = "current";
const LEGACY_NODE_HOST_CONFIG_FILE = "node.json";
const LEGACY_NODE_HOST_CONFIG_CLAIM_SUFFIX = ".doctor-importing";
function databaseOptions(env) {
	return { env };
}
function resolveLegacyNodeHostConfigPath(env = process.env) {
	return node_path.default.join(require_paths.resolveStateDir(env), LEGACY_NODE_HOST_CONFIG_FILE);
}
function resolveLegacyNodeHostConfigClaimPath(env = process.env) {
	return `${resolveLegacyNodeHostConfigPath(env)}${LEGACY_NODE_HOST_CONFIG_CLAIM_SUFFIX}`;
}
function legacyPathMayExist(filePath) {
	try {
		node_fs.default.lstatSync(filePath);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw new Error(`unable to verify retired node-host state path ${filePath}`, { cause: error });
	}
}
/** Runtime must not choose between canonical SQLite state and a retired file store. */
function assertNodeHostLegacyStateMigrated(env = process.env) {
	const sourcePath = resolveLegacyNodeHostConfigPath(env);
	const claimPath = resolveLegacyNodeHostConfigClaimPath(env);
	if (!legacyPathMayExist(sourcePath) && !legacyPathMayExist(claimPath)) return;
	throw new Error(`retired node-host state remains at ${sourcePath}; stop the node host and run \`openclaw doctor --fix\``);
}
function optionalNonEmptyString(value, label) {
	if (value === null) return;
	const normalized = value.trim();
	if (!normalized) throw new Error(`invalid node-host SQLite row: ${label} must not be empty`);
	return normalized;
}
function validatePort(value, label) {
	if (value === null || value === void 0) return;
	if (!Number.isSafeInteger(value) || value <= 0 || value > 65535) throw new Error(`invalid node-host ${label}: expected an integer between 1 and 65535`);
	return value;
}
function rowToNodeHostConfig(row) {
	if (row.version !== 1) throw new Error(`invalid node-host SQLite row: unsupported version ${String(row.version)}`);
	const nodeId = row.node_id.trim();
	if (!nodeId) throw new Error("invalid node-host SQLite row: node_id must not be empty");
	if (!Number.isSafeInteger(row.updated_at_ms) || row.updated_at_ms < 0) throw new Error("invalid node-host SQLite row: updated_at_ms must be a non-negative integer");
	if (row.gateway_tls !== null && row.gateway_tls !== 0 && row.gateway_tls !== 1) throw new Error("invalid node-host SQLite row: gateway_tls must be 0, 1, or null");
	const gateway = {
		host: optionalNonEmptyString(row.gateway_host, "gateway_host"),
		port: validatePort(row.gateway_port, "SQLite gateway_port"),
		tls: row.gateway_tls === null ? void 0 : row.gateway_tls === 1,
		tlsFingerprint: optionalNonEmptyString(row.gateway_tls_fingerprint, "gateway_tls_fingerprint"),
		contextPath: optionalNonEmptyString(row.gateway_context_path, "gateway_context_path")
	};
	const hasGateway = Object.values(gateway).some((value) => value !== void 0);
	return {
		version: 1,
		nodeId,
		displayName: optionalNonEmptyString(row.display_name, "display_name"),
		gateway: hasGateway ? gateway : void 0
	};
}
function readNodeHostConfigRow(database) {
	return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).selectFrom("node_host_config").select([
		"config_key",
		"version",
		"node_id",
		"display_name",
		"gateway_host",
		"gateway_port",
		"gateway_tls",
		"gateway_tls_fingerprint",
		"gateway_context_path",
		"updated_at_ms"
	]).where("config_key", "=", NODE_HOST_CONFIG_KEY));
}
/** Load canonical node-host state. Legacy files block the read until Doctor migrates them. */
async function loadNodeHostConfig(env = process.env) {
	assertNodeHostLegacyStateMigrated(env);
	const row = readNodeHostConfigRow(require_openclaw_state_db.openOperatorStateDatabase(databaseOptions(env)));
	return row ? rowToNodeHostConfig(row) : null;
}
//#endregion
Object.defineProperty(exports, "LEGACY_NODE_HOST_CONFIG_CLAIM_SUFFIX", {
	enumerable: true,
	get: function() {
		return LEGACY_NODE_HOST_CONFIG_CLAIM_SUFFIX;
	}
});
Object.defineProperty(exports, "LEGACY_NODE_HOST_CONFIG_FILE", {
	enumerable: true,
	get: function() {
		return LEGACY_NODE_HOST_CONFIG_FILE;
	}
});
Object.defineProperty(exports, "NODE_HOST_CONFIG_KEY", {
	enumerable: true,
	get: function() {
		return NODE_HOST_CONFIG_KEY;
	}
});
Object.defineProperty(exports, "loadNodeHostConfig", {
	enumerable: true,
	get: function() {
		return loadNodeHostConfig;
	}
});
