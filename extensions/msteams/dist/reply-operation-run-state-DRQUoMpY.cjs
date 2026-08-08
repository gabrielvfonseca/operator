const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_date_time = require("./date-time-zxjypawc.cjs");
const require_store_record = require("./store-record-BBVFLj9_.cjs");
let node_crypto = require("node:crypto");
//#region src/commitments/config.ts
const DEFAULT_COMMITMENT_EXTRACTION_DEBOUNCE_MS = 15e3;
const DEFAULT_COMMITMENT_BATCH_MAX_ITEMS = 8;
const DEFAULT_COMMITMENT_EXTRACTION_QUEUE_MAX_ITEMS = 64;
const DEFAULT_COMMITMENT_CONFIDENCE_THRESHOLD = .72;
const DEFAULT_COMMITMENT_CARE_CONFIDENCE_THRESHOLD = .86;
const DEFAULT_COMMITMENT_EXTRACTION_TIMEOUT_SECONDS = 45;
const DEFAULT_COMMITMENT_MAX_PER_DAY = 3;
function positiveInt(value, fallback) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}
/** Resolves commitment extraction config with conservative defaults. */
function resolveCommitmentsConfig(cfg) {
	const raw = cfg?.commitments;
	return {
		enabled: raw?.enabled === true,
		maxPerDay: positiveInt(raw?.maxPerDay, DEFAULT_COMMITMENT_MAX_PER_DAY),
		extraction: {
			debounceMs: DEFAULT_COMMITMENT_EXTRACTION_DEBOUNCE_MS,
			batchMaxItems: DEFAULT_COMMITMENT_BATCH_MAX_ITEMS,
			queueMaxItems: DEFAULT_COMMITMENT_EXTRACTION_QUEUE_MAX_ITEMS,
			confidenceThreshold: DEFAULT_COMMITMENT_CONFIDENCE_THRESHOLD,
			careConfidenceThreshold: DEFAULT_COMMITMENT_CARE_CONFIDENCE_THRESHOLD,
			timeoutSeconds: DEFAULT_COMMITMENT_EXTRACTION_TIMEOUT_SECONDS
		}
	};
}
/** Resolves the timezone used when interpreting inferred commitment dates. */
function resolveCommitmentTimezone(cfg) {
	return require_date_time.resolveUserTimezone(cfg?.agents?.defaults?.userTimezone);
}
//#endregion
//#region src/commitments/store.ts
const ROLLING_DAY_MS = 1440 * 60 * 1e3;
const ACTIVE_STATUSES = ["pending", "snoozed"];
function databaseOptions(env = process.env) {
	return { env };
}
function generateCommitmentId(nowMs) {
	return `cm_${nowMs.toString(36)}_${(0, node_crypto.randomBytes)(5).toString("hex")}`;
}
function optionalScopeValue(value) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : void 0;
}
function normalizeScope(scope) {
	return {
		agentId: scope.agentId.trim(),
		sessionKey: scope.sessionKey.trim(),
		channel: scope.channel.trim(),
		...optionalScopeValue(scope.accountId) ? { accountId: scope.accountId?.trim() } : {},
		...optionalScopeValue(scope.to) ? { to: scope.to?.trim() } : {},
		...optionalScopeValue(scope.threadId) ? { threadId: scope.threadId?.trim() } : {},
		...optionalScopeValue(scope.senderId) ? { senderId: scope.senderId?.trim() } : {}
	};
}
function candidateToRecord(params) {
	const scope = normalizeScope(params.item);
	return require_store_record.coerceCommitmentRecord({
		id: generateCommitmentId(params.nowMs),
		...scope,
		kind: params.candidate.kind,
		sensitivity: params.candidate.sensitivity,
		source: params.candidate.source,
		status: "pending",
		reason: params.candidate.reason.trim(),
		suggestedText: params.candidate.suggestedText.trim(),
		dedupeKey: params.candidate.dedupeKey.trim(),
		confidence: params.candidate.confidence,
		dueWindow: {
			earliestMs: params.earliestMs,
			latestMs: params.latestMs,
			timezone: params.timezone
		},
		...optionalScopeValue(params.item.sourceMessageId) ? { sourceMessageId: params.item.sourceMessageId?.trim() } : {},
		...optionalScopeValue(params.item.sourceRunId) ? { sourceRunId: params.item.sourceRunId?.trim() } : {},
		createdAtMs: params.nowMs,
		updatedAtMs: params.nowMs,
		attempts: 0
	});
}
function expireAfterMs() {
	return 4320 * 60 * 1e3;
}
function updateCommitmentRow(db, record) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).updateTable("commitments").set(require_store_record.commitmentRecordToUpdate(record)).where("id", "=", record.id));
}
function expireStaleCommitmentsInTransaction(db, nowMs) {
	const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("commitments").selectAll().where("status", "in", [...ACTIVE_STATUSES]).where("due_latest_ms", "<", nowMs - expireAfterMs())).rows;
	for (const row of rows) updateCommitmentRow(db, {
		...require_store_record.commitmentRecordFromRow(row),
		status: "expired",
		expiredAtMs: nowMs,
		updatedAtMs: nowMs
	});
	return rows.length;
}
function expireStaleCommitments(nowMs) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => expireStaleCommitmentsInTransaction(db, nowMs));
}
function applyExactScopeWhere(query, scope) {
	const normalized = normalizeScope(scope);
	let scoped = query.where("agent_id", "=", normalized.agentId).where("session_key", "=", normalized.sessionKey).where("channel", "=", normalized.channel);
	scoped = normalized.accountId ? scoped.where("account_id", "=", normalized.accountId) : scoped.where("account_id", "is", null);
	scoped = normalized.to ? scoped.where("recipient_id", "=", normalized.to) : scoped.where("recipient_id", "is", null);
	scoped = normalized.threadId ? scoped.where("thread_id", "=", normalized.threadId) : scoped.where("thread_id", "is", null);
	return normalized.senderId ? scoped.where("sender_id", "=", normalized.senderId) : scoped.where("sender_id", "is", null);
}
function activeAndUnsnoozed(query, nowMs) {
	return query.where("status", "in", [...ACTIVE_STATUSES]).where((eb) => eb.or([
		eb("status", "=", "pending"),
		eb("snoozed_until_ms", "is", null),
		eb("snoozed_until_ms", "<=", nowMs)
	]));
}
async function listPendingCommitmentsForScope(params) {
	const nowMs = params.nowMs ?? Date.now();
	expireStaleCommitments(nowMs);
	const database = require_openclaw_state_db.openOperatorStateDatabase();
	const scoped = applyExactScopeWhere(require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).selectFrom("commitments").selectAll(), params.scope);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, activeAndUnsnoozed(scoped, nowMs).orderBy("due_earliest_ms", "asc").orderBy("created_at_ms", "asc").orderBy("id", "asc").limit(params.limit ?? 20)).rows.map(require_store_record.commitmentRecordFromRow);
}
async function upsertInferredCommitments(params) {
	if (params.candidates.length === 0) return [];
	const nowMs = params.nowMs ?? Date.now();
	const planned = params.candidates.flatMap((entry) => {
		const record = candidateToRecord({
			item: params.item,
			...entry,
			nowMs
		});
		return record ? [record] : [];
	});
	if (planned.length === 0) return [];
	const scope = normalizeScope(params.item);
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		expireStaleCommitmentsInTransaction(db, nowMs);
		const commitmentsDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const created = [];
		for (const record of planned) {
			const existingRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, applyExactScopeWhere(commitmentsDb.selectFrom("commitments").selectAll(), scope).where("dedupe_key", "=", record.dedupeKey).where("status", "in", [...ACTIVE_STATUSES]).orderBy("updated_at_ms", "desc").orderBy("id", "asc"));
			if (existingRow) {
				const existing = require_store_record.commitmentRecordFromRow(existingRow);
				updateCommitmentRow(db, {
					...existing,
					reason: record.reason,
					suggestedText: record.suggestedText,
					confidence: Math.max(existing.confidence, record.confidence),
					dueWindow: {
						earliestMs: Math.min(existing.dueWindow.earliestMs, record.dueWindow.earliestMs),
						latestMs: Math.max(existing.dueWindow.latestMs, record.dueWindow.latestMs),
						timezone: record.dueWindow.timezone
					},
					updatedAtMs: nowMs
				});
				continue;
			}
			require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, commitmentsDb.insertInto("commitments").values(require_store_record.commitmentRecordToRow(record)));
			created.push(record);
		}
		return created;
	}, databaseOptions());
}
async function listDueCommitmentsForSession(params) {
	const resolved = resolveCommitmentsConfig(params.cfg);
	if (!resolved.enabled) return [];
	const nowMs = params.nowMs ?? Date.now();
	expireStaleCommitments(nowMs);
	const database = require_openclaw_state_db.openOperatorStateDatabase();
	const commitmentsDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	const sentCountRow = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, commitmentsDb.selectFrom("commitments").select((eb) => eb.fn.countAll().as("count")).where("agent_id", "=", params.agentId).where("session_key", "=", params.sessionKey).where("status", "=", "sent").where("sent_at_ms", ">=", nowMs - ROLLING_DAY_MS));
	const remainingToday = resolved.maxPerDay - Number(sentCountRow?.count ?? 0);
	if (remainingToday <= 0) return [];
	const limit = Math.min(params.limit ?? 3, remainingToday, 3);
	const due = activeAndUnsnoozed(commitmentsDb.selectFrom("commitments").selectAll().where("agent_id", "=", params.agentId).where("session_key", "=", params.sessionKey), nowMs).where("due_earliest_ms", "<=", nowMs).where("due_latest_ms", ">=", nowMs - expireAfterMs()).orderBy("due_earliest_ms", "asc").orderBy("created_at_ms", "asc").orderBy("id", "asc").limit(limit);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, due).rows.map(require_store_record.commitmentRecordFromRow);
}
async function listDueCommitmentSessionKeys(params) {
	const resolved = resolveCommitmentsConfig(params.cfg);
	if (!resolved.enabled) return [];
	const nowMs = params.nowMs ?? Date.now();
	expireStaleCommitments(nowMs);
	const database = require_openclaw_state_db.openOperatorStateDatabase();
	const commitmentsDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	const dueSessionRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, activeAndUnsnoozed(commitmentsDb.selectFrom("commitments").select("session_key").distinct().where("agent_id", "=", params.agentId), nowMs).where("due_earliest_ms", "<=", nowMs).where("due_latest_ms", ">=", nowMs - expireAfterMs()).orderBy("session_key", "asc")).rows;
	if (dueSessionRows.length === 0) return [];
	const sentCountRows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, commitmentsDb.selectFrom("commitments").select(["session_key", (eb) => eb.fn.countAll().as("count")]).where("agent_id", "=", params.agentId).where("status", "=", "sent").where("sent_at_ms", ">=", nowMs - ROLLING_DAY_MS).groupBy("session_key")).rows;
	const sentCounts = new Map(sentCountRows.map((row) => [row.session_key, Number(row.count)]));
	const eligible = dueSessionRows.map((row) => row.session_key).filter((sessionKey) => (sentCounts.get(sessionKey) ?? 0) < resolved.maxPerDay);
	return params.limit && params.limit > 0 ? eligible.slice(0, params.limit) : eligible;
}
async function markCommitmentsAttempted(params) {
	const ids = [...new Set(params.ids.map((id) => id.trim()).filter(Boolean))];
	if (ids.length === 0) return;
	const nowMs = params.nowMs ?? Date.now();
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("commitments").selectAll().where("id", "in", ids)).rows;
		for (const row of rows) {
			const record = require_store_record.commitmentRecordFromRow(row);
			updateCommitmentRow(db, {
				...record,
				attempts: record.attempts + 1,
				lastAttemptAtMs: nowMs,
				updatedAtMs: nowMs
			});
		}
	});
}
async function markCommitmentsStatus(params) {
	const ids = [...new Set(params.ids.map((id) => id.trim()).filter(Boolean))];
	if (ids.length === 0) return;
	const nowMs = params.nowMs ?? Date.now();
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const rows = require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("commitments").selectAll().where("id", "in", ids).where("status", "in", [...ACTIVE_STATUSES])).rows;
		for (const row of rows) updateCommitmentRow(db, {
			...require_store_record.commitmentRecordFromRow(row),
			status: params.status,
			updatedAtMs: nowMs,
			...params.status === "sent" ? { sentAtMs: nowMs } : {},
			...params.status === "dismissed" ? { dismissedAtMs: nowMs } : {},
			...params.status === "expired" ? { expiredAtMs: nowMs } : {}
		});
	});
}
//#endregion
//#region src/auto-reply/reply/reply-operation-run-state.ts
const REPLY_OPERATION_RUN_STATE = Symbol("operator.replyOperationRunState");
function resolveReplyOperationRunState(options) {
	return options?.[REPLY_OPERATION_RUN_STATE];
}
//#endregion
Object.defineProperty(exports, "REPLY_OPERATION_RUN_STATE", {
	enumerable: true,
	get: function() {
		return REPLY_OPERATION_RUN_STATE;
	}
});
Object.defineProperty(exports, "listDueCommitmentSessionKeys", {
	enumerable: true,
	get: function() {
		return listDueCommitmentSessionKeys;
	}
});
Object.defineProperty(exports, "listDueCommitmentsForSession", {
	enumerable: true,
	get: function() {
		return listDueCommitmentsForSession;
	}
});
Object.defineProperty(exports, "listPendingCommitmentsForScope", {
	enumerable: true,
	get: function() {
		return listPendingCommitmentsForScope;
	}
});
Object.defineProperty(exports, "markCommitmentsAttempted", {
	enumerable: true,
	get: function() {
		return markCommitmentsAttempted;
	}
});
Object.defineProperty(exports, "markCommitmentsStatus", {
	enumerable: true,
	get: function() {
		return markCommitmentsStatus;
	}
});
Object.defineProperty(exports, "resolveCommitmentTimezone", {
	enumerable: true,
	get: function() {
		return resolveCommitmentTimezone;
	}
});
Object.defineProperty(exports, "resolveCommitmentsConfig", {
	enumerable: true,
	get: function() {
		return resolveCommitmentsConfig;
	}
});
Object.defineProperty(exports, "resolveReplyOperationRunState", {
	enumerable: true,
	get: function() {
		return resolveReplyOperationRunState;
	}
});
Object.defineProperty(exports, "upsertInferredCommitments", {
	enumerable: true,
	get: function() {
		return upsertInferredCommitments;
	}
});
