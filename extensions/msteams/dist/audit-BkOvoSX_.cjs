require("./rolldown-runtime-u92d-OFm.cjs");
require("./redact-Bg-yc44I.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
require("node:crypto");
//#region src/audit/audit-event-types.ts
const AUDIT_INBOUND_MESSAGE_COMPLETED_REASONS = [
	"fast_abort",
	"plugin_bound_handled",
	"plugin_bound_unavailable",
	"plugin_bound_declined",
	"before_dispatch_handled",
	"acp_dispatch_completed",
	"acp_dispatch_empty"
];
const AUDIT_INBOUND_MESSAGE_SKIPPED_REASONS = [
	"duplicate",
	"reply_operation_active",
	"reply_operation_aborted",
	"acp_dispatch_aborted"
];
const AUDIT_OUTBOUND_MESSAGE_SUPPRESSED_REASONS = [
	"cancelled_by_message_sending_hook",
	"cancelled_by_reply_payload_sending_hook",
	"empty_after_message_sending_hook",
	"empty_after_reply_payload_sending_hook",
	"no_visible_payload"
];
//#endregion
//#region src/audit/audit-identity.ts
/** Stable installation-local pseudonyms for sensitive audit identifiers. */
//#endregion
//#region src/audit/audit-event-store.ts
/** SQLite persistence and stable cursor queries for metadata-only audit events. */
const AUDIT_EVENT_RETENTION_MS = 720 * 60 * 6e4;
function getAuditKysely(db) {
	return require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
}
const RUN_ACTIONS = ["agent.run.started", "agent.run.finished"];
const TOOL_ACTIONS = ["tool.action.started", "tool.action.finished"];
const CONVERSATION_KINDS = [
	"direct",
	"group",
	"channel",
	"unknown"
];
const DELIVERY_KINDS = [
	"text",
	"media",
	"other"
];
const FAILURE_STAGES = [
	"platform_send",
	"queue",
	"unknown"
];
const AUDIT_HMAC_REF_RE = /^hmac-sha256:v1:[a-f0-9]{32}:[a-f0-9]{64}$/u;
const MESSAGE_COLUMNS = [
	"direction",
	"channel",
	"conversation_kind",
	"message_outcome",
	"reason_code",
	"delivery_kind",
	"failure_stage",
	"duration_ms",
	"result_count",
	"account_ref",
	"conversation_ref",
	"message_ref",
	"target_ref"
];
function corruptAuditRow(row, problem) {
	const sequence = require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.sequence);
	const location = sequence === void 0 ? "" : ` ${sequence}`;
	throw new Error(`corrupt audit event row${location}: ${problem}`);
}
function requiredInteger(row, value, field, minimum) {
	const normalized = require_state_migrations_cron_run_logs.normalizeSqliteNumber(value);
	if (normalized === void 0 || !Number.isSafeInteger(normalized) || normalized < minimum) corruptAuditRow(row, `invalid ${field}`);
	return normalized;
}
function optionalInteger(row, value, field, minimum) {
	if (value === null) return;
	return requiredInteger(row, value, field, minimum);
}
function requiredText(row, value, field) {
	if (typeof value !== "string" || value.length === 0) corruptAuditRow(row, `invalid ${field}`);
	return value;
}
function optionalText(row, value, field) {
	if (value === null || value === void 0) return;
	return requiredText(row, value, field);
}
function requiredEnum(row, value, field, allowed) {
	for (const candidate of allowed) if (value === candidate) return candidate;
	return corruptAuditRow(row, `invalid ${field}`);
}
function optionalEnum(row, value, field, allowed) {
	if (value === null || value === void 0) return;
	return requiredEnum(row, value, field, allowed);
}
function requiredHmacRef(row, value, field) {
	const ref = requiredText(row, value, field);
	if (!AUDIT_HMAC_REF_RE.test(ref)) corruptAuditRow(row, `invalid ${field}`);
	return ref;
}
function optionalHmacRef(row, value, field) {
	if (value === null || value === void 0) return;
	return requiredHmacRef(row, value, field);
}
function requireNull(row, field) {
	if (row[field] !== null) corruptAuditRow(row, `unexpected ${field}`);
}
function requireNullColumns(row, fields) {
	for (const field of fields) requireNull(row, field);
}
function parseAuditRecordBase(row) {
	const schemaVersion = requiredInteger(row, row.schema_version, "schemaVersion", 1);
	if (schemaVersion !== 1) corruptAuditRow(row, `unsupported schemaVersion ${schemaVersion}`);
	return {
		schemaVersion,
		sequence: requiredInteger(row, row.sequence, "sequence", 1),
		eventId: requiredText(row, row.event_id, "eventId"),
		sourceSequence: requiredInteger(row, row.source_sequence, "sourceSequence", 1),
		occurredAt: requiredInteger(row, row.occurred_at, "occurredAt", 0),
		redaction: "metadata_only"
	};
}
function parseAgentRecordFields(row) {
	requireNullColumns(row, MESSAGE_COLUMNS);
	return {
		...parseAuditRecordBase(row),
		actorType: requiredEnum(row, row.actor_type, "actorType", ["agent", "system"]),
		actorId: requiredText(row, row.actor_id, "actorId"),
		agentId: requiredText(row, row.agent_id, "agentId"),
		...optionalText(row, row.session_key, "sessionKey") !== void 0 ? { sessionKey: requiredText(row, row.session_key, "sessionKey") } : {},
		...optionalText(row, row.session_id, "sessionId") !== void 0 ? { sessionId: requiredText(row, row.session_id, "sessionId") } : {},
		runId: requiredText(row, row.run_id, "runId")
	};
}
function parseAgentRunRow(row) {
	requireNull(row, "tool_call_id");
	requireNull(row, "tool_name");
	const common = {
		...parseAgentRecordFields(row),
		kind: "agent_run"
	};
	const action = requiredEnum(row, row.action, "action", RUN_ACTIONS);
	if (action === "agent.run.started") {
		requiredEnum(row, row.status, "status", ["started"]);
		requireNull(row, "error_code");
		return {
			...common,
			action,
			status: "started"
		};
	}
	if (row.status === "succeeded") {
		requireNull(row, "error_code");
		return {
			...common,
			action,
			status: "succeeded"
		};
	}
	const terminal = row.status === "failed" ? {
		status: "failed",
		errorCode: "run_failed"
	} : row.status === "cancelled" ? {
		status: "cancelled",
		errorCode: "run_cancelled"
	} : row.status === "timed_out" ? {
		status: "timed_out",
		errorCode: "run_timed_out"
	} : row.status === "blocked" ? {
		status: "blocked",
		errorCode: "run_blocked"
	} : corruptAuditRow(row, "invalid run terminal status");
	requiredEnum(row, row.error_code, "errorCode", [terminal.errorCode]);
	return {
		...common,
		action,
		...terminal
	};
}
function parseToolActionRow(row) {
	const toolCallId = optionalText(row, row.tool_call_id, "toolCallId");
	const toolName = optionalText(row, row.tool_name, "toolName");
	const common = {
		...parseAgentRecordFields(row),
		kind: "tool_action",
		...toolCallId ? { toolCallId } : {},
		...toolName ? { toolName } : {}
	};
	const action = requiredEnum(row, row.action, "action", TOOL_ACTIONS);
	if (action === "tool.action.started") {
		requiredEnum(row, row.status, "status", ["started"]);
		requireNull(row, "error_code");
		return {
			...common,
			action,
			status: "started"
		};
	}
	if (row.status === "succeeded") {
		requireNull(row, "error_code");
		return {
			...common,
			action,
			status: "succeeded"
		};
	}
	const terminal = row.status === "failed" ? {
		status: "failed",
		errorCode: "tool_failed"
	} : row.status === "cancelled" ? {
		status: "cancelled",
		errorCode: "tool_cancelled"
	} : row.status === "timed_out" ? {
		status: "timed_out",
		errorCode: "tool_timed_out"
	} : row.status === "blocked" ? {
		status: "blocked",
		errorCode: "tool_blocked"
	} : row.status === "unknown" ? {
		status: "unknown",
		errorCode: "tool_outcome_unknown"
	} : corruptAuditRow(row, "invalid tool terminal status");
	requiredEnum(row, row.error_code, "errorCode", [terminal.errorCode]);
	return {
		...common,
		action,
		...terminal
	};
}
function parseMessageRecordFields(row) {
	requireNullColumns(row, [
		"session_key",
		"session_id",
		"tool_call_id",
		"tool_name"
	]);
	const agentId = optionalText(row, row.agent_id, "agentId");
	const runId = optionalText(row, row.run_id, "runId");
	const durationMs = optionalInteger(row, row.duration_ms, "durationMs", 0);
	const resultCount = optionalInteger(row, row.result_count, "resultCount", 0);
	const accountRef = optionalHmacRef(row, row.account_ref, "accountRef");
	const conversationRef = optionalHmacRef(row, row.conversation_ref, "conversationRef");
	const messageRef = optionalHmacRef(row, row.message_ref, "messageRef");
	const targetRef = optionalHmacRef(row, row.target_ref, "targetRef");
	return {
		...parseAuditRecordBase(row),
		kind: "message",
		channel: requiredText(row, row.channel, "channel"),
		conversationKind: requiredEnum(row, row.conversation_kind, "conversationKind", CONVERSATION_KINDS),
		...agentId ? { agentId } : {},
		...runId ? { runId } : {},
		...durationMs !== void 0 ? { durationMs } : {},
		...resultCount !== void 0 ? { resultCount } : {},
		...accountRef ? { accountRef } : {},
		...conversationRef ? { conversationRef } : {},
		...messageRef ? { messageRef } : {},
		...targetRef ? { targetRef } : {}
	};
}
function parseInboundMessageRow(row) {
	requiredEnum(row, row.action, "action", ["message.inbound.processed"]);
	requiredEnum(row, row.direction, "direction", ["inbound"]);
	requireNull(row, "delivery_kind");
	requireNull(row, "failure_stage");
	const actorType = requiredEnum(row, row.actor_type, "actorType", ["channel_sender", "system"]);
	const actorId = actorType === "channel_sender" ? requiredHmacRef(row, row.actor_id, "actorId") : requiredText(row, row.actor_id, "actorId");
	const common = {
		...parseMessageRecordFields(row),
		action: "message.inbound.processed",
		direction: "inbound",
		actorType,
		actorId
	};
	if (row.status === "succeeded") {
		requiredEnum(row, row.message_outcome, "outcome", ["completed"]);
		requireNull(row, "error_code");
		const reasonCode = optionalEnum(row, row.reason_code, "reasonCode", AUDIT_INBOUND_MESSAGE_COMPLETED_REASONS);
		return {
			...common,
			status: "succeeded",
			outcome: "completed",
			...reasonCode ? { reasonCode } : {}
		};
	}
	if (row.status === "blocked") {
		requiredEnum(row, row.message_outcome, "outcome", ["skipped"]);
		requireNull(row, "error_code");
		const reasonCode = optionalEnum(row, row.reason_code, "reasonCode", AUDIT_INBOUND_MESSAGE_SKIPPED_REASONS);
		return {
			...common,
			status: "blocked",
			outcome: "skipped",
			...reasonCode ? { reasonCode } : {}
		};
	}
	if (row.status === "failed") {
		requiredEnum(row, row.message_outcome, "outcome", ["failed"]);
		requiredEnum(row, row.error_code, "errorCode", ["message_processing_failed"]);
		const reasonCode = optionalEnum(row, row.reason_code, "reasonCode", ["acp_dispatch_failed", "plugin_bound_error"]);
		return {
			...common,
			status: "failed",
			outcome: "failed",
			errorCode: "message_processing_failed",
			...reasonCode ? { reasonCode } : {}
		};
	}
	return corruptAuditRow(row, "invalid inbound status");
}
function parseOutboundMessageRow(row) {
	requiredEnum(row, row.action, "action", ["message.outbound.finished"]);
	requiredEnum(row, row.direction, "direction", ["outbound"]);
	const actorType = requiredEnum(row, row.actor_type, "actorType", ["agent", "system"]);
	const actorId = requiredText(row, row.actor_id, "actorId");
	const common = {
		...parseMessageRecordFields(row),
		action: "message.outbound.finished",
		direction: "outbound",
		actorType,
		actorId
	};
	if (row.status === "succeeded") {
		const deliveryKind = optionalEnum(row, row.delivery_kind, "deliveryKind", DELIVERY_KINDS);
		requiredEnum(row, row.message_outcome, "outcome", ["sent"]);
		requireNullColumns(row, [
			"error_code",
			"reason_code",
			"failure_stage"
		]);
		return {
			...common,
			status: "succeeded",
			outcome: "sent",
			...deliveryKind ? { deliveryKind } : {}
		};
	}
	if (row.status === "blocked") {
		requireNull(row, "delivery_kind");
		requiredEnum(row, row.message_outcome, "outcome", ["suppressed"]);
		requireNullColumns(row, ["error_code", "failure_stage"]);
		const reasonCode = requiredEnum(row, row.reason_code, "reasonCode", AUDIT_OUTBOUND_MESSAGE_SUPPRESSED_REASONS);
		return {
			...common,
			status: "blocked",
			outcome: "suppressed",
			reasonCode
		};
	}
	if (row.status === "failed") {
		const deliveryKind = optionalEnum(row, row.delivery_kind, "deliveryKind", DELIVERY_KINDS);
		requiredEnum(row, row.message_outcome, "outcome", ["failed"]);
		requireNull(row, "reason_code");
		const errorCode = requiredEnum(row, row.error_code, "errorCode", ["message_delivery_failed", "message_delivery_partial_failure"]);
		const failureStage = requiredEnum(row, row.failure_stage, "failureStage", FAILURE_STAGES);
		return {
			...common,
			status: "failed",
			outcome: "failed",
			errorCode,
			failureStage,
			...deliveryKind ? { deliveryKind } : {}
		};
	}
	if (row.status === "unknown") {
		requireNull(row, "delivery_kind");
		requiredEnum(row, row.message_outcome, "outcome", ["unknown"]);
		requireNullColumns(row, ["error_code", "reason_code"]);
		const failureStage = requiredEnum(row, row.failure_stage, "failureStage", FAILURE_STAGES);
		return {
			...common,
			status: "unknown",
			outcome: "unknown",
			failureStage
		};
	}
	return corruptAuditRow(row, "invalid outbound status");
}
function rowToAuditEvent(row) {
	if (row.kind === "agent_run") return parseAgentRunRow(row);
	if (row.kind === "tool_action") return parseToolActionRow(row);
	if (row.kind !== "message") corruptAuditRow(row, "invalid kind");
	if (row.direction === "inbound") return parseInboundMessageRow(row);
	if (row.direction === "outbound") return parseOutboundMessageRow(row);
	return corruptAuditRow(row, "invalid message direction");
}
/** List newest-first records using a stable sequence cursor. */
function listAuditEvents(params) {
	const { db } = require_openclaw_state_db.openOperatorStateDatabase(params.database);
	const filters = params.filters ?? {};
	const retainedAfter = (params.now ?? Date.now()) - AUDIT_EVENT_RETENTION_MS;
	let query = getAuditKysely(db).selectFrom("audit_events").selectAll().where("occurred_at", ">=", retainedAfter);
	if (params.cursor !== void 0) query = query.where("sequence", "<", params.cursor);
	if (filters.agentId) query = query.where("agent_id", "=", filters.agentId);
	if (filters.sessionKey) query = query.where("session_key", "=", filters.sessionKey);
	if (filters.runId) query = query.where("run_id", "=", filters.runId);
	if (filters.kind) query = query.where("kind", "=", filters.kind);
	else if (filters.includeMessages !== true) query = query.where("kind", "!=", "message");
	if (filters.status) query = query.where("status", "=", filters.status);
	if (filters.direction) query = query.where("direction", "=", filters.direction);
	if (filters.channel) query = query.where("channel", "=", filters.channel);
	if (filters.after !== void 0) query = query.where("occurred_at", ">=", filters.after);
	if (filters.before !== void 0) query = query.where("occurred_at", "<=", filters.before);
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, query.orderBy("sequence", "desc").limit(params.limit + 1)).rows;
	const hasMore = rows.length > params.limit;
	const events = (hasMore ? rows.slice(0, params.limit) : rows).map(rowToAuditEvent);
	return {
		events,
		...hasMore && events.length > 0 ? { nextCursor: events[events.length - 1]?.sequence } : {}
	};
}
//#endregion
//#region src/gateway/server-methods/audit.ts
const DEFAULT_AUDIT_LIST_LIMIT = 100;
const MAX_AUDIT_LIST_LIMIT = 500;
function parseAuditCursor(cursor) {
	if (cursor === void 0) return;
	if (!/^\d+$/.test(cursor)) return null;
	const parsed = Number(cursor);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
/** Preserve the shipped audit.list result shape for run/tool-only clients. */
function mapLegacyAuditEvent(event) {
	const { schemaVersion: _schemaVersion, actorType, actorId, ...legacyEvent } = event;
	return {
		...legacyEvent,
		actor: {
			type: actorType,
			id: actorId
		}
	};
}
function mapAuditActivityEvent(event) {
	if (event.kind === "agent_run") {
		const { actorType, actorId, ...activity } = event;
		return {
			...activity,
			eventType: "agent_run",
			actor: {
				type: actorType,
				id: actorId
			}
		};
	}
	if (event.kind === "tool_action") {
		const { actorType, actorId, ...activity } = event;
		return {
			...activity,
			eventType: "tool_action",
			actor: {
				type: actorType,
				id: actorId
			}
		};
	}
	if (event.direction === "inbound") {
		const { actorType, actorId, ...activity } = event;
		const actor = actorType === "channel_sender" ? {
			type: "channel_sender",
			id: actorId
		} : {
			type: "system",
			id: actorId
		};
		return {
			...activity,
			eventType: "inbound_message",
			actor
		};
	}
	const { actorType, actorId, ...activity } = event;
	return {
		...activity,
		eventType: "outbound_message",
		actor: {
			type: actorType,
			id: actorId
		}
	};
}
function invalidRangeOrCursor(params) {
	const cursor = parseAuditCursor(params.cursor);
	return {
		...cursor !== void 0 && cursor !== null ? { cursor } : {},
		invalid: cursor === null || params.after !== void 0 && params.before !== void 0 && params.after > params.before
	};
}
const auditHandlers = {
	"audit.list": ({ params, respond }) => {
		if (!require_src.validateAuditListParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid audit.list params: ${require_validation_errors.formatValidationErrors(require_src.validateAuditListParams.errors)}`));
			return;
		}
		const parsed = invalidRangeOrCursor(params);
		if (parsed.invalid) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid audit.list range or cursor"));
			return;
		}
		const page = listAuditEvents({
			limit: Math.min(params.limit ?? DEFAULT_AUDIT_LIST_LIMIT, MAX_AUDIT_LIST_LIMIT),
			...parsed.cursor !== void 0 ? { cursor: parsed.cursor } : {},
			filters: {
				...params.agentId ? { agentId: params.agentId } : {},
				...params.sessionKey ? { sessionKey: params.sessionKey } : {},
				...params.runId ? { runId: params.runId } : {},
				...params.kind ? { kind: params.kind } : {},
				...params.status ? { status: params.status } : {},
				...params.after !== void 0 ? { after: params.after } : {},
				...params.before !== void 0 ? { before: params.before } : {}
			}
		});
		respond(true, {
			events: page.events.map((event) => {
				if (event.kind === "message") throw new Error("legacy audit.list cannot project message records");
				return mapLegacyAuditEvent(event);
			}),
			...page.nextCursor !== void 0 ? { nextCursor: String(page.nextCursor) } : {}
		});
	},
	"audit.activity.list": ({ params, respond }) => {
		if (!require_src.validateAuditActivityListParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid audit.activity.list params: ${require_validation_errors.formatValidationErrors(require_src.validateAuditActivityListParams.errors)}`));
			return;
		}
		const parsed = invalidRangeOrCursor(params);
		if (parsed.invalid) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "invalid audit.activity.list range or cursor"));
			return;
		}
		const page = listAuditEvents({
			limit: Math.min(params.limit ?? DEFAULT_AUDIT_LIST_LIMIT, MAX_AUDIT_LIST_LIMIT),
			...parsed.cursor !== void 0 ? { cursor: parsed.cursor } : {},
			filters: {
				includeMessages: true,
				...params.agentId ? { agentId: params.agentId } : {},
				...params.sessionKey ? { sessionKey: params.sessionKey } : {},
				...params.runId ? { runId: params.runId } : {},
				...params.kind ? { kind: params.kind } : {},
				...params.status ? { status: params.status } : {},
				...params.direction ? { direction: params.direction } : {},
				...params.channel ? { channel: params.channel } : {},
				...params.after !== void 0 ? { after: params.after } : {},
				...params.before !== void 0 ? { before: params.before } : {}
			}
		});
		respond(true, {
			events: page.events.map(mapAuditActivityEvent),
			...page.nextCursor !== void 0 ? { nextCursor: String(page.nextCursor) } : {}
		});
	}
};
const testApi = {
	mapAuditActivityEvent,
	mapLegacyAuditEvent,
	parseAuditCursor
};
//#endregion
exports.auditHandlers = auditHandlers;
exports.testApi = testApi;
