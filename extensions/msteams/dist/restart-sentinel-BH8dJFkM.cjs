const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/infra/restart-sentinel.ts
const sentinelLog = require_subsystem.createSubsystemLogger("restart-sentinel");
const RESTART_SENTINEL_KEY = "current";
const LEGACY_RESTART_SENTINEL_FILENAME = "restart-sentinel.json";
function formatDoctorNonInteractiveHint(env = process.env) {
	return `Recommended follow-up: run ${require_command_format.formatCliCommand("openclaw doctor --non-interactive", env)} in a terminal or approvals-capable Operator surface.`;
}
async function writeRestartSentinel(payload, env = process.env) {
	const updatedAtMs = Date.now();
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).insertInto("gateway_restart_sentinel").values({
			sentinel_key: RESTART_SENTINEL_KEY,
			version: 1,
			kind: payload.kind,
			status: payload.status,
			ts: payload.ts,
			session_key: payload.sessionKey ?? null,
			thread_id: payload.threadId ?? null,
			delivery_channel: payload.deliveryContext?.channel ?? null,
			delivery_to: payload.deliveryContext?.to ?? null,
			delivery_account_id: payload.deliveryContext?.accountId ?? null,
			message: payload.message ?? null,
			continuation_json: payload.continuation ? JSON.stringify(payload.continuation) : null,
			doctor_hint: payload.doctorHint ?? null,
			stats_json: payload.stats ? JSON.stringify(payload.stats) : null,
			payload_json: JSON.stringify(payload),
			updated_at_ms: updatedAtMs
		}).onConflict((conflict) => conflict.column("sentinel_key").doUpdateSet({
			version: (eb) => eb.ref("excluded.version"),
			kind: (eb) => eb.ref("excluded.kind"),
			status: (eb) => eb.ref("excluded.status"),
			ts: (eb) => eb.ref("excluded.ts"),
			session_key: (eb) => eb.ref("excluded.session_key"),
			thread_id: (eb) => eb.ref("excluded.thread_id"),
			delivery_channel: (eb) => eb.ref("excluded.delivery_channel"),
			delivery_to: (eb) => eb.ref("excluded.delivery_to"),
			delivery_account_id: (eb) => eb.ref("excluded.delivery_account_id"),
			message: (eb) => eb.ref("excluded.message"),
			continuation_json: (eb) => eb.ref("excluded.continuation_json"),
			doctor_hint: (eb) => eb.ref("excluded.doctor_hint"),
			stats_json: (eb) => eb.ref("excluded.stats_json"),
			payload_json: (eb) => eb.ref("excluded.payload_json"),
			updated_at_ms: (eb) => eb.ref("excluded.updated_at_ms")
		})));
	}, { env });
	await removeLegacyRestartSentinel(env);
}
function cloneRestartSentinelPayload(payload) {
	return structuredClone(payload);
}
async function rewriteRestartSentinel(rewrite, env = process.env) {
	const current = await readRestartSentinel(env);
	if (!current) return null;
	const nextPayload = rewrite(cloneRestartSentinelPayload(current.payload));
	if (!nextPayload) return null;
	await writeRestartSentinel(nextPayload, env);
	return {
		version: 1,
		payload: nextPayload
	};
}
async function finalizeUpdateRestartSentinelRunningVersion(version = require_version.resolveRuntimeServiceVersion(process.env), env = process.env) {
	return await rewriteRestartSentinel((payload) => {
		if (payload.kind !== "update") return null;
		const stats = payload.stats ? { ...payload.stats } : {};
		const after = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(stats.after) ? { ...stats.after } : {};
		if (after.version === version) return null;
		after.version = version;
		stats.after = after;
		return {
			...payload,
			stats
		};
	}, env);
}
async function clearRestartSentinel(env = process.env) {
	try {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).deleteFrom("gateway_restart_sentinel").where("sentinel_key", "=", RESTART_SENTINEL_KEY));
		}, { env });
	} catch (err) {
		sentinelLog.warn(`Failed to clear restart sentinel: ${require_errors.formatErrorMessage(err)}`);
	}
	await removeLegacyRestartSentinel(env);
}
function resolveLegacyRestartSentinelPath(env) {
	return node_path.default.join(require_paths.resolveStateDir(env), LEGACY_RESTART_SENTINEL_FILENAME);
}
async function removeLegacyRestartSentinel(env) {
	try {
		await (0, node_fs_promises.rm)(resolveLegacyRestartSentinelPath(env), { force: true });
	} catch (err) {
		sentinelLog.warn(`Failed to remove legacy restart sentinel: ${require_errors.formatErrorMessage(err)}`);
	}
}
async function importLegacyRestartSentinel(env = process.env) {
	const legacyPath = resolveLegacyRestartSentinelPath(env);
	let parsed;
	try {
		parsed = JSON.parse(await (0, node_fs_promises.readFile)(legacyPath, "utf-8"));
	} catch {
		return null;
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || parsed.version !== 1 || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed.payload)) {
		await removeLegacyRestartSentinel(env);
		return null;
	}
	const payload = parsed.payload;
	await writeRestartSentinel(payload, env);
	await removeLegacyRestartSentinel(env);
	return {
		version: 1,
		payload
	};
}
function buildRestartSuccessContinuation(params) {
	const message = params.continuationMessage?.trim();
	if (message) return {
		kind: "agentTurn",
		message
	};
	return null;
}
async function readRestartSentinel(env = process.env) {
	try {
		const database = require_openclaw_state_db.openOperatorStateDatabase({ env });
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
		const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, stateDb.selectFrom("gateway_restart_sentinel").select(["version", "payload_json"]).where("sentinel_key", "=", RESTART_SENTINEL_KEY));
		if (!row) return await importLegacyRestartSentinel(env);
		let payload;
		try {
			payload = JSON.parse(row.payload_json);
		} catch {
			await clearRestartSentinel(env);
			return null;
		}
		if (row.version !== 1 || !payload) {
			await clearRestartSentinel(env);
			return null;
		}
		return {
			version: 1,
			payload
		};
	} catch (err) {
		sentinelLog.warn(`Failed to read restart sentinel: ${require_errors.formatErrorMessage(err)}`);
		return null;
	}
}
async function hasRestartSentinel(env = process.env) {
	try {
		const database = require_openclaw_state_db.openOperatorStateDatabase({ env });
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
		if (require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, stateDb.selectFrom("gateway_restart_sentinel").select("sentinel_key").where("sentinel_key", "=", RESTART_SENTINEL_KEY))) return true;
		return Boolean(await importLegacyRestartSentinel(env));
	} catch (err) {
		sentinelLog.warn(`Failed to check restart sentinel: ${require_errors.formatErrorMessage(err)}`);
		return false;
	}
}
function formatRestartSentinelMessage(payload) {
	const message = payload.message?.trim();
	if (message && (!payload.stats || payload.kind === "config-auto-recovery")) return message;
	const lines = [summarizeRestartSentinel(payload)];
	if (message) lines.push(message);
	const reason = payload.stats?.reason?.trim();
	if (reason && reason !== message) lines.push(`Reason: ${reason}`);
	if (payload.doctorHint?.trim()) lines.push(payload.doctorHint.trim());
	return lines.join("\n");
}
function isRestartRequiredConfigWriteSentinel(payload) {
	return (payload.kind === "config-apply" || payload.kind === "config-patch") && payload.status === "ok" && payload.stats?.requiresRestart === true;
}
function summarizeRestartSentinel(payload) {
	if (payload.kind === "config-auto-recovery") return "Gateway auto-recovery";
	if (isRestartRequiredConfigWriteSentinel(payload)) return `Gateway restart required${payload.stats?.mode ? ` (${payload.stats.mode})` : ""}`.trim();
	const kind = payload.kind;
	const status = payload.status;
	const mode = payload.stats?.mode ? ` (${payload.stats.mode})` : "";
	return `Gateway restart${kind === "restart" ? "" : ` ${kind}`} ${status}${mode}`.trim();
}
function trimLogTail(input, maxChars = 8e3) {
	if (!input) return null;
	const text = input.trimEnd();
	if (text.length <= maxChars) return text;
	return `…${(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(text, text.length - maxChars)}`;
}
//#endregion
Object.defineProperty(exports, "buildRestartSuccessContinuation", {
	enumerable: true,
	get: function() {
		return buildRestartSuccessContinuation;
	}
});
Object.defineProperty(exports, "clearRestartSentinel", {
	enumerable: true,
	get: function() {
		return clearRestartSentinel;
	}
});
Object.defineProperty(exports, "finalizeUpdateRestartSentinelRunningVersion", {
	enumerable: true,
	get: function() {
		return finalizeUpdateRestartSentinelRunningVersion;
	}
});
Object.defineProperty(exports, "formatDoctorNonInteractiveHint", {
	enumerable: true,
	get: function() {
		return formatDoctorNonInteractiveHint;
	}
});
Object.defineProperty(exports, "formatRestartSentinelMessage", {
	enumerable: true,
	get: function() {
		return formatRestartSentinelMessage;
	}
});
Object.defineProperty(exports, "hasRestartSentinel", {
	enumerable: true,
	get: function() {
		return hasRestartSentinel;
	}
});
Object.defineProperty(exports, "readRestartSentinel", {
	enumerable: true,
	get: function() {
		return readRestartSentinel;
	}
});
Object.defineProperty(exports, "summarizeRestartSentinel", {
	enumerable: true,
	get: function() {
		return summarizeRestartSentinel;
	}
});
Object.defineProperty(exports, "trimLogTail", {
	enumerable: true,
	get: function() {
		return trimLogTail;
	}
});
Object.defineProperty(exports, "writeRestartSentinel", {
	enumerable: true,
	get: function() {
		return writeRestartSentinel;
	}
});
