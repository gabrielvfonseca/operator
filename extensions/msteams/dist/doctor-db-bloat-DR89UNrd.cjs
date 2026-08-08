const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_doctor_disk_space = require("./doctor-disk-space-Bh101fzt.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
//#region src/commands/doctor-db-bloat.ts
const BLOAT_MIN_FILE_BYTES = 128 * 1024 * 1024;
const BLOAT_MIN_FREE_BYTES = 32 * 1024 * 1024;
const BLOAT_FREE_RATIO = .25;
const LARGE_DB_WARN_BYTES = 1024 * 1024 * 1024;
function readSqliteBloatStats(pathname) {
	let fileBytes;
	try {
		fileBytes = node_fs.default.statSync(pathname, { throwIfNoEntry: false })?.size ?? 0;
	} catch {
		return null;
	}
	if (fileBytes <= 0) return null;
	const sqlite = require_state_migrations_cron_run_logs.requireNodeSqlite();
	let db;
	try {
		db = new sqlite.DatabaseSync(pathname, { readOnly: true });
		const pageSize = readPragmaNumber(db, "page_size") ?? 4096;
		const freelistCount = readPragmaNumber(db, "freelist_count") ?? 0;
		const autoVacuum = readPragmaNumber(db, "auto_vacuum") ?? 0;
		return {
			fileBytes,
			freeBytes: freelistCount * pageSize,
			incrementalAutoVacuum: autoVacuum === 2
		};
	} catch {
		return null;
	} finally {
		db?.close();
	}
}
function readPragmaNumber(db, pragma) {
	const value = db.prepare(`PRAGMA ${pragma}`).get()?.[pragma];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function describeBloat(label, stats) {
	const freeRatio = stats.fileBytes > 0 ? stats.freeBytes / stats.fileBytes : 0;
	if (stats.fileBytes >= BLOAT_MIN_FILE_BYTES && stats.freeBytes >= BLOAT_MIN_FREE_BYTES && freeRatio >= BLOAT_FREE_RATIO) {
		const remedy = stats.incrementalAutoVacuum ? "incremental vacuum will release it gradually" : "run `VACUUM` offline (gateway stopped) to reclaim it";
		return `${label}: ${require_doctor_disk_space.formatBytes(stats.fileBytes)} on disk with ${require_doctor_disk_space.formatBytes(stats.freeBytes)} reclaimable free pages; ${remedy}.`;
	}
	if (stats.fileBytes >= LARGE_DB_WARN_BYTES) return `${label}: ${require_doctor_disk_space.formatBytes(stats.fileBytes)} on disk; review session/transcript retention settings if growth is unexpected.`;
	return null;
}
function collectSqliteBloatWarnings(deps) {
	const env = deps?.env ?? process.env;
	const warnings = [];
	const stateStats = readSqliteBloatStats(require_openclaw_state_db.resolveOperatorStateSqlitePath(env));
	if (stateStats) {
		const warning = describeBloat("state DB", stateStats);
		if (warning) warnings.push(warning);
	}
	for (const registered of require_openclaw_agent_db.listOperatorRegisteredAgentDatabases({ env })) {
		const stats = readSqliteBloatStats(registered.path);
		if (!stats) continue;
		const warning = describeBloat(`agent DB (${registered.agentId})`, stats);
		if (warning) warnings.push(warning);
	}
	return warnings;
}
function noteSqliteDatabaseBloat(_cfg, deps) {
	const warnings = collectSqliteBloatWarnings(deps);
	if (warnings.length === 0) return;
	require_note.note(warnings.join("\n"), "SQLite database size");
}
//#endregion
exports.noteSqliteDatabaseBloat = noteSqliteDatabaseBloat;
