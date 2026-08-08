let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commitments/store-record.ts
const COMMITMENT_KINDS = /* @__PURE__ */ new Set([
	"event_check_in",
	"deadline_check",
	"care_check_in",
	"open_loop"
]);
const COMMITMENT_SENSITIVITIES = /* @__PURE__ */ new Set([
	"routine",
	"personal",
	"care"
]);
const COMMITMENT_SOURCES = /* @__PURE__ */ new Set(["inferred_user_context", "agent_promise"]);
const COMMITMENT_STATUSES = /* @__PURE__ */ new Set([
	"pending",
	"sent",
	"dismissed",
	"snoozed",
	"expired"
]);
function normalizeNonNegativeNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : void 0;
}
function normalizeNonNegativeInteger(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : void 0;
}
/** Validate a persisted record and remove retired raw-source fields. */
function coerceCommitmentRecord(raw) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return;
	const dueWindow = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.dueWindow) ? raw.dueWindow : void 0;
	if (!dueWindow) return;
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.id);
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.agentId);
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.sessionKey);
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.channel);
	const reason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.reason);
	const suggestedText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.suggestedText);
	const dedupeKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.dedupeKey);
	const kind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.kind);
	const sensitivity = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.sensitivity);
	const source = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.source);
	const status = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.status);
	const confidence = normalizeNonNegativeNumber(raw.confidence);
	const createdAtMs = normalizeNonNegativeNumber(raw.createdAtMs);
	const updatedAtMs = normalizeNonNegativeNumber(raw.updatedAtMs);
	const attempts = normalizeNonNegativeInteger(raw.attempts);
	const earliestMs = normalizeNonNegativeNumber(dueWindow.earliestMs);
	const latestMs = normalizeNonNegativeNumber(dueWindow.latestMs);
	const timezone = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(dueWindow.timezone);
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.accountId);
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.to);
	const threadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.threadId);
	const senderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.senderId);
	const sourceMessageId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.sourceMessageId);
	const sourceRunId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.sourceRunId);
	const lastAttemptAtMs = normalizeNonNegativeNumber(raw.lastAttemptAtMs);
	const sentAtMs = normalizeNonNegativeNumber(raw.sentAtMs);
	const dismissedAtMs = normalizeNonNegativeNumber(raw.dismissedAtMs);
	const snoozedUntilMs = normalizeNonNegativeNumber(raw.snoozedUntilMs);
	const expiredAtMs = normalizeNonNegativeNumber(raw.expiredAtMs);
	if (!id || !agentId || !sessionKey || !channel || !reason || !suggestedText || !dedupeKey || !kind || !sensitivity || !source || !status || !COMMITMENT_KINDS.has(kind) || !COMMITMENT_SENSITIVITIES.has(sensitivity) || !COMMITMENT_SOURCES.has(source) || !COMMITMENT_STATUSES.has(status) || confidence === void 0 || createdAtMs === void 0 || updatedAtMs === void 0 || attempts === void 0 || earliestMs === void 0 || latestMs === void 0 || !timezone || latestMs < earliestMs) return;
	return {
		id,
		agentId,
		sessionKey,
		channel,
		...accountId ? { accountId } : {},
		...to ? { to } : {},
		...threadId ? { threadId } : {},
		...senderId ? { senderId } : {},
		kind,
		sensitivity,
		source,
		status,
		reason,
		suggestedText,
		dedupeKey,
		confidence,
		dueWindow: {
			earliestMs,
			latestMs,
			timezone
		},
		...sourceMessageId ? { sourceMessageId } : {},
		...sourceRunId ? { sourceRunId } : {},
		createdAtMs,
		updatedAtMs,
		attempts,
		...lastAttemptAtMs !== void 0 ? { lastAttemptAtMs } : {},
		...sentAtMs !== void 0 ? { sentAtMs } : {},
		...dismissedAtMs !== void 0 ? { dismissedAtMs } : {},
		...snoozedUntilMs !== void 0 ? { snoozedUntilMs } : {},
		...expiredAtMs !== void 0 ? { expiredAtMs } : {}
	};
}
function commitmentRecordFromRow(row) {
	const record = coerceCommitmentRecord({
		id: row.id,
		agentId: row.agent_id,
		sessionKey: row.session_key,
		channel: row.channel,
		...row.account_id !== null ? { accountId: row.account_id } : {},
		...row.recipient_id !== null ? { to: row.recipient_id } : {},
		...row.thread_id !== null ? { threadId: row.thread_id } : {},
		...row.sender_id !== null ? { senderId: row.sender_id } : {},
		kind: row.kind,
		sensitivity: row.sensitivity,
		source: row.source,
		status: row.status,
		reason: row.reason,
		suggestedText: row.suggested_text,
		dedupeKey: row.dedupe_key,
		confidence: row.confidence,
		dueWindow: {
			earliestMs: row.due_earliest_ms,
			latestMs: row.due_latest_ms,
			timezone: row.due_timezone
		},
		...row.source_message_id !== null ? { sourceMessageId: row.source_message_id } : {},
		...row.source_run_id !== null ? { sourceRunId: row.source_run_id } : {},
		createdAtMs: row.created_at_ms,
		updatedAtMs: row.updated_at_ms,
		attempts: row.attempts,
		...row.last_attempt_at_ms !== null ? { lastAttemptAtMs: row.last_attempt_at_ms } : {},
		...row.sent_at_ms !== null ? { sentAtMs: row.sent_at_ms } : {},
		...row.dismissed_at_ms !== null ? { dismissedAtMs: row.dismissed_at_ms } : {},
		...row.snoozed_until_ms !== null ? { snoozedUntilMs: row.snoozed_until_ms } : {},
		...row.expired_at_ms !== null ? { expiredAtMs: row.expired_at_ms } : {}
	});
	if (!record) throw new Error(`commitment row ${row.id} violates the canonical record contract`);
	return record;
}
function commitmentRecordToRow(record) {
	return {
		id: record.id,
		agent_id: record.agentId,
		session_key: record.sessionKey,
		channel: record.channel,
		account_id: record.accountId ?? null,
		recipient_id: record.to ?? null,
		thread_id: record.threadId ?? null,
		sender_id: record.senderId ?? null,
		kind: record.kind,
		sensitivity: record.sensitivity,
		source: record.source,
		status: record.status,
		reason: record.reason,
		suggested_text: record.suggestedText,
		dedupe_key: record.dedupeKey,
		confidence: record.confidence,
		due_earliest_ms: record.dueWindow.earliestMs,
		due_latest_ms: record.dueWindow.latestMs,
		due_timezone: record.dueWindow.timezone,
		source_message_id: record.sourceMessageId ?? null,
		source_run_id: record.sourceRunId ?? null,
		created_at_ms: record.createdAtMs,
		updated_at_ms: record.updatedAtMs,
		attempts: record.attempts,
		last_attempt_at_ms: record.lastAttemptAtMs ?? null,
		sent_at_ms: record.sentAtMs ?? null,
		dismissed_at_ms: record.dismissedAtMs ?? null,
		snoozed_until_ms: record.snoozedUntilMs ?? null,
		expired_at_ms: record.expiredAtMs ?? null,
		record_json: JSON.stringify(record)
	};
}
function commitmentRecordToUpdate(record) {
	const { id: _id, ...update } = commitmentRecordToRow(record);
	return update;
}
function commitmentRecordsEqual(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}
function commitmentImmutableIdentity(record) {
	return JSON.stringify([
		record.id,
		record.agentId,
		record.sessionKey,
		record.channel,
		record.accountId ?? null,
		record.to ?? null,
		record.threadId ?? null,
		record.senderId ?? null,
		record.kind,
		record.sensitivity,
		record.source,
		record.dedupeKey,
		record.createdAtMs
	]);
}
//#endregion
Object.defineProperty(exports, "coerceCommitmentRecord", {
	enumerable: true,
	get: function() {
		return coerceCommitmentRecord;
	}
});
Object.defineProperty(exports, "commitmentImmutableIdentity", {
	enumerable: true,
	get: function() {
		return commitmentImmutableIdentity;
	}
});
Object.defineProperty(exports, "commitmentRecordFromRow", {
	enumerable: true,
	get: function() {
		return commitmentRecordFromRow;
	}
});
Object.defineProperty(exports, "commitmentRecordToRow", {
	enumerable: true,
	get: function() {
		return commitmentRecordToRow;
	}
});
Object.defineProperty(exports, "commitmentRecordToUpdate", {
	enumerable: true,
	get: function() {
		return commitmentRecordToUpdate;
	}
});
Object.defineProperty(exports, "commitmentRecordsEqual", {
	enumerable: true,
	get: function() {
		return commitmentRecordsEqual;
	}
});
