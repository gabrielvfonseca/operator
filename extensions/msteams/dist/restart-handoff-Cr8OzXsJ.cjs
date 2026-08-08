const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
require("node:crypto");
//#region src/infra/restart-handoff.ts
const GATEWAY_SUPERVISOR_RESTART_HANDOFF_KIND = "gateway-supervisor-restart-handoff";
const GATEWAY_SUPERVISOR_RESTART_HANDOFF_KEY = "current";
const GATEWAY_RESTART_HANDOFF_TTL_MS = 6e4;
const GATEWAY_RESTART_TRACE_HANDOFF_MAX_DURATION_MS = 10 * 6e4;
const MAX_INTENT_ID_LENGTH = 120;
const MAX_PROCESS_INSTANCE_ID_LENGTH = 120;
const MAX_REASON_LENGTH = 200;
require_subsystem.createSubsystemLogger("restart-handoff");
function formatShortDuration(ms) {
	const clamped = Math.max(0, Math.floor(ms));
	if (clamped < 1e3) return `${clamped}ms`;
	const seconds = Math.floor(clamped / 1e3);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}
function formatDiagnosticValue(value) {
	let normalized = "";
	let previousWasSpace = true;
	for (const char of value) {
		const code = char.charCodeAt(0);
		if (code <= 31 || code === 127 || /\s/u.test(char)) {
			if (!previousWasSpace) {
				normalized += " ";
				previousWasSpace = true;
			}
			continue;
		}
		normalized += char;
		previousWasSpace = false;
	}
	return normalized.trimEnd();
}
/** Format a compact diagnostic for a recently consumed restart handoff. */
function formatGatewayRestartHandoffDiagnostic(handoff, now = Date.now()) {
	const reason = handoff.reason ? formatDiagnosticValue(handoff.reason) : void 0;
	return `Recent restart handoff: ${[
		`${handoff.restartKind} via ${handoff.supervisorMode}`,
		`source=${handoff.source}`,
		reason ? `reason=${reason}` : void 0,
		`pid=${handoff.pid}`,
		`age=${formatShortDuration(now - handoff.createdAt)}`,
		`expiresIn=${formatShortDuration(handoff.expiresAt - now)}`
	].filter((value) => Boolean(value)).join("; ")}`;
}
function normalizeText(value, maxLength) {
	const text = typeof value === "string" ? value.trim() : "";
	return text ? (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, maxLength) : void 0;
}
function normalizeRestartTraceHandoff(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return;
	const record = value;
	if (typeof record.startedAt !== "number" || !Number.isFinite(record.startedAt) || typeof record.lastAt !== "number" || !Number.isFinite(record.lastAt) || record.startedAt <= 0 || record.lastAt < record.startedAt || record.lastAt - record.startedAt > GATEWAY_RESTART_TRACE_HANDOFF_MAX_DURATION_MS) return;
	return {
		startedAt: record.startedAt,
		lastAt: record.lastAt
	};
}
function isSource(value) {
	return value === "config-write" || value === "gateway-update" || value === "operator-restart" || value === "plugin-change" || value === "signal" || value === "unknown";
}
function isRestartKind(value) {
	return value === "full-process" || value === "update-process";
}
function isSupervisorMode(value) {
	return value === "launchd" || value === "systemd" || value === "schtasks" || value === "external";
}
function normalizeGatewayRestartHandoffRow(row) {
	const intentId = normalizeText(row.intent_id, MAX_INTENT_ID_LENGTH);
	if (row.kind !== GATEWAY_SUPERVISOR_RESTART_HANDOFF_KIND || row.version !== 1 || !intentId || typeof row.pid !== "number" || !Number.isSafeInteger(row.pid) || row.pid <= 0 || typeof row.created_at !== "number" || !Number.isFinite(row.created_at) || typeof row.expires_at !== "number" || !Number.isFinite(row.expires_at) || row.expires_at <= row.created_at || row.expires_at - row.created_at > GATEWAY_RESTART_HANDOFF_TTL_MS || !isSource(row.source) || !isRestartKind(row.restart_kind) || !isSupervisorMode(row.supervisor_mode)) return null;
	const restartTrace = normalizeRestartTraceHandoff(row.restart_trace_started_at !== null && row.restart_trace_last_at !== null ? {
		startedAt: row.restart_trace_started_at,
		lastAt: row.restart_trace_last_at
	} : null);
	const processInstanceId = normalizeText(row.process_instance_id, MAX_PROCESS_INSTANCE_ID_LENGTH);
	const reason = normalizeText(row.reason, MAX_REASON_LENGTH);
	return {
		kind: GATEWAY_SUPERVISOR_RESTART_HANDOFF_KIND,
		version: 1,
		intentId,
		pid: row.pid,
		...processInstanceId ? { processInstanceId } : {},
		createdAt: Math.floor(row.created_at),
		expiresAt: Math.floor(row.expires_at),
		...reason ? { reason } : {},
		source: row.source,
		restartKind: row.restart_kind,
		supervisorMode: row.supervisor_mode,
		...restartTrace ? { restartTrace } : {}
	};
}
function readGatewayRestartHandoffRowSync(env) {
	try {
		const { db } = require_openclaw_state_db.openOperatorStateDatabase({ env });
		return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("gateway_restart_handoff").select([
			"kind",
			"version",
			"intent_id",
			"pid",
			"process_instance_id",
			"created_at",
			"expires_at",
			"reason",
			"restart_trace_started_at",
			"restart_trace_last_at",
			"source",
			"restart_kind",
			"supervisor_mode"
		]).where("handoff_key", "=", GATEWAY_SUPERVISOR_RESTART_HANDOFF_KEY));
	} catch {
		return null;
	}
}
/** Read the current unexpired restart handoff without consuming it. */
function readGatewayRestartHandoffSync(env = process.env, now = Date.now()) {
	const row = readGatewayRestartHandoffRowSync(env);
	const payload = row ? normalizeGatewayRestartHandoffRow(row) : null;
	if (!payload || now < payload.createdAt || now > payload.expiresAt) return null;
	return payload;
}
//#endregion
Object.defineProperty(exports, "formatGatewayRestartHandoffDiagnostic", {
	enumerable: true,
	get: function() {
		return formatGatewayRestartHandoffDiagnostic;
	}
});
Object.defineProperty(exports, "readGatewayRestartHandoffSync", {
	enumerable: true,
	get: function() {
		return readGatewayRestartHandoffSync;
	}
});
