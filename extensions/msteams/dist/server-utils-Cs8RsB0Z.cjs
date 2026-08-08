require("./errors-BqS4bzom.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/voicewake.ts
const DEFAULT_TRIGGERS = [
	"@gabrielvfonseca/operator",
	"claude",
	"computer"
];
const VOICEWAKE_CONFIG_KEY = "default";
function sanitizeTriggers(triggers) {
	const cleaned = (triggers ?? []).map((w) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(w) ?? "").filter((w) => w.length > 0);
	return cleaned.length > 0 ? cleaned : DEFAULT_TRIGGERS;
}
function openStateDatabase(stateDir) {
	return require_openclaw_state_db.openOperatorStateDatabase({ env: stateDir ? {
		...process.env,
		OPERATOR_STATE_DIR: stateDir
	} : process.env });
}
/** Return the built-in voice wake trigger list. */
function defaultVoiceWakeTriggers() {
	return [...DEFAULT_TRIGGERS];
}
/** Load persisted voice wake triggers, falling back to defaults. */
async function loadVoiceWakeConfig(baseDir) {
	const database = openStateDatabase(baseDir);
	const voicewakeDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, voicewakeDb.selectFrom("voicewake_triggers").select(["trigger", "updated_at_ms"]).where("config_key", "=", VOICEWAKE_CONFIG_KEY).orderBy("position", "asc")).rows;
	if (rows.length === 0) return {
		triggers: defaultVoiceWakeTriggers(),
		updatedAtMs: 0
	};
	return {
		triggers: sanitizeTriggers(rows.map((row) => row.trigger)),
		updatedAtMs: Math.max(0, ...rows.map((row) => row.updated_at_ms))
	};
}
/** Persist the configured voice wake trigger list. */
async function setVoiceWakeTriggers(triggers, baseDir) {
	const sanitized = sanitizeTriggers(triggers);
	const updatedAtMs = Date.now();
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const voicewakeDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, voicewakeDb.deleteFrom("voicewake_triggers").where("config_key", "=", VOICEWAKE_CONFIG_KEY));
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, voicewakeDb.insertInto("voicewake_triggers").values(sanitized.map((trigger, position) => ({
			config_key: VOICEWAKE_CONFIG_KEY,
			position,
			trigger,
			updated_at_ms: updatedAtMs
		}))));
	}, baseDir ? { env: {
		...process.env,
		OPERATOR_STATE_DIR: baseDir
	} } : {});
	return {
		triggers: sanitized,
		updatedAtMs
	};
}
//#endregion
//#region src/gateway/server-utils.ts
/** Normalizes voice-wake trigger config with bounded count/length and defaults. */
function normalizeVoiceWakeTriggers(input) {
	const cleaned = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(input).slice(0, 32).map((value) => (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, 64));
	return cleaned.length > 0 ? cleaned : defaultVoiceWakeTriggers();
}
//#endregion
Object.defineProperty(exports, "loadVoiceWakeConfig", {
	enumerable: true,
	get: function() {
		return loadVoiceWakeConfig;
	}
});
Object.defineProperty(exports, "normalizeVoiceWakeTriggers", {
	enumerable: true,
	get: function() {
		return normalizeVoiceWakeTriggers;
	}
});
Object.defineProperty(exports, "setVoiceWakeTriggers", {
	enumerable: true,
	get: function() {
		return setVoiceWakeTriggers;
	}
});
