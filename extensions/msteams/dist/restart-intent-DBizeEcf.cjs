const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/infra/restart-intent.ts
const GATEWAY_RESTART_INTENT_KEY = "gateway-restart";
const restartLog = require_subsystem.createSubsystemLogger("restart");
function normalizeRestartIntentPid(pid) {
	return typeof pid === "number" && Number.isSafeInteger(pid) && pid > 0 ? pid : null;
}
function normalizeRestartIntentReason(reason) {
	const normalized = reason?.trim();
	return normalized ? (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, 200) : void 0;
}
function writeGatewayRestartIntentSync(opts) {
	const targetPid = normalizeRestartIntentPid(opts.targetPid);
	if (targetPid === null) return false;
	const env = opts.env ?? process.env;
	try {
		const reason = normalizeRestartIntentReason(opts.reason ?? opts.intent?.reason);
		const waitMs = typeof opts.intent?.waitMs === "number" && Number.isFinite(opts.intent.waitMs) && opts.intent.waitMs >= 0 ? Math.floor(opts.intent.waitMs) : null;
		const createdAt = Date.now();
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).insertInto("gateway_restart_intent").values({
				intent_key: GATEWAY_RESTART_INTENT_KEY,
				kind: "gateway-restart",
				pid: targetPid,
				created_at: createdAt,
				reason: reason ?? null,
				force: opts.intent?.force ? 1 : null,
				wait_ms: waitMs,
				updated_at_ms: createdAt
			}).onConflict((conflict) => conflict.column("intent_key").doUpdateSet({
				kind: (eb) => eb.ref("excluded.kind"),
				pid: (eb) => eb.ref("excluded.pid"),
				created_at: (eb) => eb.ref("excluded.created_at"),
				reason: (eb) => eb.ref("excluded.reason"),
				force: (eb) => eb.ref("excluded.force"),
				wait_ms: (eb) => eb.ref("excluded.wait_ms"),
				updated_at_ms: (eb) => eb.ref("excluded.updated_at_ms")
			})));
		}, { env });
		return true;
	} catch (err) {
		restartLog.warn(`failed to write gateway restart intent: ${String(err)}`);
		return false;
	}
}
function clearGatewayRestartIntentSync(env = process.env) {
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).deleteFrom("gateway_restart_intent").where("intent_key", "=", GATEWAY_RESTART_INTENT_KEY));
		}, { env });
	} catch {}
}
//#endregion
Object.defineProperty(exports, "clearGatewayRestartIntentSync", {
	enumerable: true,
	get: function() {
		return clearGatewayRestartIntentSync;
	}
});
Object.defineProperty(exports, "normalizeRestartIntentReason", {
	enumerable: true,
	get: function() {
		return normalizeRestartIntentReason;
	}
});
Object.defineProperty(exports, "writeGatewayRestartIntentSync", {
	enumerable: true,
	get: function() {
		return writeGatewayRestartIntentSync;
	}
});
