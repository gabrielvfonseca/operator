const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
//#region src/infra/delivery-queue-sqlite.ts
const COMPLETED_TOMBSTONE_RETENTION_MS = 720 * 60 * 6e4;
function openStateDatabase(stateDir) {
	return require_openclaw_state_db.openOperatorStateDatabase({ env: stateDir ? {
		...process.env,
		OPERATOR_STATE_DIR: stateDir
	} : process.env });
}
function enoent(queueName, id) {
	const err = /* @__PURE__ */ new Error(`No pending ${queueName} delivery queue entry ${id}`);
	err.code = "ENOENT";
	return err;
}
function inflate(row) {
	let parsed;
	try {
		parsed = JSON.parse(row.entry_json);
	} catch {
		return null;
	}
	return {
		...parsed,
		id: row.id,
		enqueuedAt: Number(row.enqueued_at),
		retryCount: Number(row.retry_count),
		...row.last_attempt_at == null ? {} : { lastAttemptAt: Number(row.last_attempt_at) },
		...row.last_error == null ? {} : { lastError: row.last_error },
		...row.platform_send_started_at == null ? {} : { platformSendStartedAt: Number(row.platform_send_started_at) },
		...row.recovery_state == null ? {} : { recoveryState: row.recovery_state }
	};
}
function metadata(entry) {
	const item = entry;
	return {
		entryKind: item.kind,
		sessionKey: item.sessionKey ?? item.session?.key,
		channel: item.channel ?? item.route?.channel ?? item.deliveryContext?.channel,
		target: item.to ?? item.route?.to ?? item.deliveryContext?.to,
		accountId: item.accountId ?? item.route?.accountId ?? item.deliveryContext?.accountId
	};
}
function upsertDeliveryQueueEntryInDatabase(params, database) {
	const now = Date.now();
	const status = params.status ?? "pending";
	const meta = params.metadata ?? metadata(params.entry);
	const insert = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).insertInto("delivery_queue_entries").values({
		queue_name: params.queueName,
		id: params.entry.id,
		status,
		entry_kind: meta.entryKind ?? null,
		session_key: meta.sessionKey ?? null,
		channel: meta.channel ?? null,
		target: meta.target ?? null,
		account_id: meta.accountId ?? null,
		retry_count: params.entry.retryCount,
		last_attempt_at: params.entry.lastAttemptAt ?? null,
		last_error: params.entry.lastError ?? null,
		recovery_state: params.entry.recoveryState ?? null,
		platform_send_started_at: params.entry.platformSendStartedAt ?? null,
		entry_json: JSON.stringify(params.entry),
		enqueued_at: params.entry.enqueuedAt,
		updated_at: now,
		failed_at: status === "failed" ? now : null
	});
	const query = params.insertOnly ? insert.onConflict((conflict) => conflict.columns(["queue_name", "id"]).doNothing()) : insert.onConflict((conflict) => {
		const update = conflict.columns(["queue_name", "id"]).doUpdateSet({
			status: (eb) => eb.ref("excluded.status"),
			entry_kind: (eb) => eb.ref("excluded.entry_kind"),
			session_key: (eb) => eb.ref("excluded.session_key"),
			channel: (eb) => eb.ref("excluded.channel"),
			target: (eb) => eb.ref("excluded.target"),
			account_id: (eb) => eb.ref("excluded.account_id"),
			retry_count: (eb) => eb.ref("excluded.retry_count"),
			last_attempt_at: (eb) => eb.ref("excluded.last_attempt_at"),
			last_error: (eb) => eb.ref("excluded.last_error"),
			recovery_state: (eb) => eb.ref("excluded.recovery_state"),
			platform_send_started_at: (eb) => eb.ref("excluded.platform_send_started_at"),
			entry_json: (eb) => eb.ref("excluded.entry_json"),
			enqueued_at: (eb) => eb.ref("excluded.enqueued_at"),
			updated_at: (eb) => eb.ref("excluded.updated_at"),
			failed_at: (eb) => eb.ref("excluded.failed_at")
		});
		if (!params.reviveFailedOrCorruptPending) {
			if (params.updatePendingOnly) return update.where("delivery_queue_entries.status", "=", "pending");
			if (params.completeExisting) return update.where("delivery_queue_entries.status", "in", ["pending", "failed"]);
			return update;
		}
		return update.where((eb) => eb.or([eb("delivery_queue_entries.status", "=", "failed"), eb.and([eb("delivery_queue_entries.status", "=", "pending"), eb(eb.fn("json_valid", ["delivery_queue_entries.entry_json"]), "=", 0)])]));
	});
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, query).numAffectedRows === 1n;
}
/** Insert or replace a delivery queue entry under a queue namespace. */
function upsertDeliveryQueueEntry(params) {
	return upsertDeliveryQueueEntryInDatabase(params, openStateDatabase(params.stateDir));
}
/** Atomically publish a queue row only while its staging row still exists. */
function commitStagedDeliveryQueueEntry(params) {
	const database = openStateDatabase(params.stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	return require_state_migrations_cron_run_logs.runSqliteImmediateTransactionSync(database.db, () => {
		if (!require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, queueDb.selectFrom("delivery_queue_entries").select("id").where("queue_name", "=", params.stagingQueueName).where("id", "=", params.stagingId).where("status", "=", "pending"))) return false;
		if (!upsertDeliveryQueueEntryInDatabase({
			queueName: params.queueName,
			entry: params.entry,
			metadata: params.metadata,
			insertOnly: true
		}, database)) throw new Error(`Delivery queue entry already exists: ${params.queueName}/${params.entry.id}`);
		if (require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, queueDb.deleteFrom("delivery_queue_entries").where("queue_name", "=", params.stagingQueueName).where("id", "=", params.stagingId).where("status", "=", "pending")).numAffectedRows !== 1n) throw new Error(`Delivery queue staging row changed during commit: ${params.stagingQueueName}/${params.stagingId}`);
		return true;
	}, {
		databaseLabel: "operator-state",
		operationLabel: "commit staged delivery queue entry"
	});
}
/**
* Expire abandoned staging rows and capture destination/staging ownership in
* one write snapshot. A concurrent commit either lands before this snapshot or
* loses its staging row and must fail closed.
*/
function expireStagingAndLoadDeliveryQueueEntries(params) {
	const database = openStateDatabase(params.stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	const snapshot = require_state_migrations_cron_run_logs.runSqliteImmediateTransactionSync(database.db, () => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, queueDb.deleteFrom("delivery_queue_entries").where("queue_name", "=", params.stagingQueueName).where("status", "=", "pending").where("enqueued_at", "<=", params.expireBeforeMs));
		const selectPending = (queueName) => require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, queueDb.selectFrom("delivery_queue_entries").select([
			"id",
			"entry_json",
			"enqueued_at",
			"retry_count",
			"last_attempt_at",
			"last_error",
			"platform_send_started_at",
			"recovery_state"
		]).where("queue_name", "=", queueName).where("status", "=", "pending").orderBy("enqueued_at", "asc").orderBy("id", "asc")).rows;
		return {
			entryRows: selectPending(params.queueName),
			stagingRows: selectPending(params.stagingQueueName)
		};
	}, {
		databaseLabel: "operator-state",
		operationLabel: "expire delivery queue staging entries"
	});
	return {
		entries: snapshot.entryRows.map(inflate).filter((entry) => entry != null),
		stagingEntries: snapshot.stagingRows.map(inflate).filter((entry) => entry != null)
	};
}
/** Load a single pending delivery queue entry. */
function loadDeliveryQueueEntry(queueName, id, stateDir) {
	const database = openStateDatabase(stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, queueDb.selectFrom("delivery_queue_entries").select([
		"id",
		"entry_json",
		"enqueued_at",
		"retry_count",
		"last_attempt_at",
		"last_error",
		"platform_send_started_at",
		"recovery_state"
	]).where("queue_name", "=", queueName).where("id", "=", id).where("status", "=", "pending"));
	return row ? inflate(row) : null;
}
/** Read row status without hiding dead-lettered entries. */
function getDeliveryQueueEntryStatus(queueName, id, stateDir) {
	const database = openStateDatabase(stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, queueDb.selectFrom("delivery_queue_entries").select("status").where("queue_name", "=", queueName).where("id", "=", id))?.status;
}
/** Load all pending entries for a queue namespace in database order. */
function loadDeliveryQueueEntries(queueName, stateDir) {
	const database = openStateDatabase(stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, queueDb.selectFrom("delivery_queue_entries").select([
		"id",
		"entry_json",
		"enqueued_at",
		"retry_count",
		"last_attempt_at",
		"last_error",
		"platform_send_started_at",
		"recovery_state"
	]).where("queue_name", "=", queueName).where("status", "=", "pending").orderBy("enqueued_at", "asc").orderBy("id", "asc")).rows.map(inflate).filter((entry) => entry != null);
}
/** Delete a pending delivery queue entry after successful delivery. */
function deleteDeliveryQueueEntry(queueName, id, stateDir) {
	const database = openStateDatabase(stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, queueDb.deleteFrom("delivery_queue_entries").where("queue_name", "=", queueName).where("id", "=", id).where("status", "=", "pending"));
}
/** Retain a delivered row as a durable idempotency tombstone. */
function completeDeliveryQueueEntry(queueName, id, stateDir) {
	const now = Date.now();
	if (!upsertDeliveryQueueEntry({
		queueName,
		entry: {
			id,
			enqueuedAt: now,
			retryCount: 0,
			acknowledgedAt: now
		},
		metadata: {},
		status: "completed",
		stateDir,
		completeExisting: true
	})) {
		if (getDeliveryQueueEntryStatus(queueName, id, stateDir) === "completed") return;
		throw enoent(queueName, id);
	}
	const database = openStateDatabase(stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, queueDb.deleteFrom("delivery_queue_entries").where("queue_name", "=", queueName).where("status", "=", "completed").where("enqueued_at", "<", now - COMPLETED_TOMBSTONE_RETENTION_MS));
}
/** Load, transform, and persist a pending delivery queue entry. */
function updateDeliveryQueueEntry(queueName, id, stateDir, update) {
	const current = loadDeliveryQueueEntry(queueName, id, stateDir);
	if (!current) throw enoent(queueName, id);
	upsertDeliveryQueueEntry({
		queueName,
		entry: update(current),
		stateDir
	});
}
/** Count dead-lettered (failed) entries per queue namespace for health reporting. */
function countFailedDeliveryQueueEntries(stateDir) {
	const database = openStateDatabase(stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, queueDb.selectFrom("delivery_queue_entries").select((eb) => [
		"queue_name",
		eb.fn.countAll().as("failed_count"),
		eb.fn.min("failed_at").as("oldest_failed_at")
	]).where("status", "=", "failed").groupBy("queue_name").orderBy("queue_name", "asc")).rows.map((row) => ({
		queueName: row.queue_name,
		count: Number(row.failed_count),
		oldestFailedAt: row.oldest_failed_at == null ? null : Number(row.oldest_failed_at)
	}));
}
/** Mark a pending delivery queue entry as failed for later diagnostics. */
function moveDeliveryQueueEntryToFailed(queueName, id, stateDir) {
	const current = loadDeliveryQueueEntry(queueName, id, stateDir);
	if (!current) throw enoent(queueName, id);
	upsertDeliveryQueueEntry({
		queueName,
		entry: current,
		status: "failed",
		stateDir
	});
}
/** Atomically fail a queue row only while its persisted status is still pending. */
function failPendingDeliveryQueueEntry(params) {
	if (params.entry.id !== params.id) throw new Error(`Delivery queue entry id mismatch: ${params.entry.id} != ${params.id}`);
	const now = Date.now();
	const failedEntry = {
		...params.entry,
		lastError: params.lastError
	};
	const database = openStateDatabase(params.stateDir);
	const queueDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, queueDb.updateTable("delivery_queue_entries").set({
		status: "failed",
		last_error: params.lastError,
		entry_json: JSON.stringify(failedEntry),
		updated_at: now,
		failed_at: now
	}).where("queue_name", "=", params.queueName).where("id", "=", params.id).where("status", "=", params.expectedStatus)).numAffectedRows === 1n ? { status: "failed" } : { status: "not_pending" };
}
//#endregion
Object.defineProperty(exports, "commitStagedDeliveryQueueEntry", {
	enumerable: true,
	get: function() {
		return commitStagedDeliveryQueueEntry;
	}
});
Object.defineProperty(exports, "completeDeliveryQueueEntry", {
	enumerable: true,
	get: function() {
		return completeDeliveryQueueEntry;
	}
});
Object.defineProperty(exports, "countFailedDeliveryQueueEntries", {
	enumerable: true,
	get: function() {
		return countFailedDeliveryQueueEntries;
	}
});
Object.defineProperty(exports, "deleteDeliveryQueueEntry", {
	enumerable: true,
	get: function() {
		return deleteDeliveryQueueEntry;
	}
});
Object.defineProperty(exports, "expireStagingAndLoadDeliveryQueueEntries", {
	enumerable: true,
	get: function() {
		return expireStagingAndLoadDeliveryQueueEntries;
	}
});
Object.defineProperty(exports, "failPendingDeliveryQueueEntry", {
	enumerable: true,
	get: function() {
		return failPendingDeliveryQueueEntry;
	}
});
Object.defineProperty(exports, "getDeliveryQueueEntryStatus", {
	enumerable: true,
	get: function() {
		return getDeliveryQueueEntryStatus;
	}
});
Object.defineProperty(exports, "loadDeliveryQueueEntries", {
	enumerable: true,
	get: function() {
		return loadDeliveryQueueEntries;
	}
});
Object.defineProperty(exports, "loadDeliveryQueueEntry", {
	enumerable: true,
	get: function() {
		return loadDeliveryQueueEntry;
	}
});
Object.defineProperty(exports, "moveDeliveryQueueEntryToFailed", {
	enumerable: true,
	get: function() {
		return moveDeliveryQueueEntryToFailed;
	}
});
Object.defineProperty(exports, "updateDeliveryQueueEntry", {
	enumerable: true,
	get: function() {
		return updateDeliveryQueueEntry;
	}
});
Object.defineProperty(exports, "upsertDeliveryQueueEntry", {
	enumerable: true,
	get: function() {
		return upsertDeliveryQueueEntry;
	}
});
