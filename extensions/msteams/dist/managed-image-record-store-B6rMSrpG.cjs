const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
//#region src/gateway/managed-image-record-store.ts
const MANAGED_OUTGOING_ORIGINALS_SUBDIR = "outgoing/originals";
function stateDatabaseOptions(stateDir) {
	return stateDir ? { env: {
		...process.env,
		OPERATOR_STATE_DIR: stateDir
	} } : { env: process.env };
}
function managedImageRecordToRow(record) {
	return {
		attachment_id: record.attachmentId,
		session_key: record.sessionKey,
		agent_id: record.agentId ?? null,
		message_id: record.messageId,
		created_at: record.createdAt,
		updated_at: record.updatedAt ?? null,
		retention_class: record.retentionClass ?? null,
		alt: record.alt,
		original_media_root: record.original.mediaRoot,
		original_media_id: record.original.mediaId,
		original_media_subdir: record.original.mediaSubdir,
		original_content_type: record.original.contentType,
		original_width: record.original.width,
		original_height: record.original.height,
		original_size_bytes: record.original.sizeBytes,
		original_filename: record.original.filename,
		record_json: JSON.stringify(record)
	};
}
function managedImageRecordFromRow(row) {
	return {
		attachmentId: row.attachment_id,
		sessionKey: row.session_key,
		...row.agent_id ? { agentId: row.agent_id } : {},
		messageId: row.message_id,
		createdAt: row.created_at,
		...row.updated_at ? { updatedAt: row.updated_at } : {},
		...row.retention_class === "history" || row.retention_class === "transient" ? { retentionClass: row.retention_class } : {},
		alt: row.alt,
		original: {
			mediaRoot: row.original_media_root,
			mediaId: row.original_media_id,
			mediaSubdir: row.original_media_subdir,
			contentType: row.original_content_type,
			width: row.original_width,
			height: row.original_height,
			sizeBytes: row.original_size_bytes,
			filename: row.original_filename
		}
	};
}
function managedImageRecordsEqual(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}
function readManagedImageRecord(attachmentId, stateDir) {
	const database = require_openclaw_state_db.openOperatorStateDatabase(stateDatabaseOptions(stateDir));
	const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(database.db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).selectFrom("managed_outgoing_image_records").selectAll().where("attachment_id", "=", attachmentId).where("cleanup_pending", "=", 0));
	return row ? managedImageRecordFromRow(row) : null;
}
function listManagedImageRecordEntries(params) {
	const database = require_openclaw_state_db.openOperatorStateDatabase(stateDatabaseOptions(params.stateDir));
	let query = require_state_migrations_cron_run_logs.getNodeSqliteKysely(database.db).selectFrom("managed_outgoing_image_records").selectAll();
	if (params.sessionKey) query = query.where("session_key", "=", params.sessionKey);
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(database.db, query.orderBy("created_at", "desc").orderBy("attachment_id", "asc")).rows.map((row) => ({
		record: managedImageRecordFromRow(row),
		cleanupPending: row.cleanup_pending === 1
	}));
}
function insertManagedImageRecord(record, stateDir) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).insertInto("managed_outgoing_image_records").values(managedImageRecordToRow(record)));
	}, stateDatabaseOptions(stateDir));
}
/** Promote a transient record atomically so concurrent message commits cannot lose state. */
function attachManagedImageRecordToMessage(params) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("managed_outgoing_image_records").selectAll().where("attachment_id", "=", params.attachmentId).where("session_key", "=", params.sessionKey));
		if (!row) return false;
		if (row.cleanup_pending === 1) return false;
		const current = managedImageRecordFromRow(row);
		if (current.messageId === params.messageId && current.retentionClass === "history") return true;
		const nextRow = managedImageRecordToRow({
			...current,
			messageId: params.messageId,
			retentionClass: "history",
			updatedAt: params.updatedAt
		});
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.updateTable("managed_outgoing_image_records").set({
			message_id: nextRow.message_id,
			retention_class: nextRow.retention_class,
			updated_at: nextRow.updated_at,
			record_json: nextRow.record_json
		}).where("attachment_id", "=", params.attachmentId));
		return true;
	}, stateDatabaseOptions(params.stateDir));
}
/** Claim only the exact row cleanup planned against; concurrent updates win. */
function claimManagedImageRecordCleanupIfCurrent(planned, stateDir) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("managed_outgoing_image_records").selectAll().where("attachment_id", "=", planned.attachmentId));
		if (!row || row.cleanup_pending === 1 || !managedImageRecordsEqual(managedImageRecordFromRow(row), planned)) return false;
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.updateTable("managed_outgoing_image_records").set({ cleanup_pending: 1 }).where("attachment_id", "=", planned.attachmentId));
		return true;
	}, stateDatabaseOptions(stateDir));
}
/** Delete a durably claimed row only after its attachment file is gone. */
function deleteClaimedManagedImageRecord(planned, stateDir) {
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		const stateDb = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
		const row = require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, stateDb.selectFrom("managed_outgoing_image_records").selectAll().where("attachment_id", "=", planned.attachmentId));
		if (row?.cleanup_pending !== 1 || !managedImageRecordsEqual(managedImageRecordFromRow(row), planned)) return false;
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, stateDb.deleteFrom("managed_outgoing_image_records").where("attachment_id", "=", planned.attachmentId));
		return true;
	}, stateDatabaseOptions(stateDir));
}
//#endregion
Object.defineProperty(exports, "MANAGED_OUTGOING_ORIGINALS_SUBDIR", {
	enumerable: true,
	get: function() {
		return MANAGED_OUTGOING_ORIGINALS_SUBDIR;
	}
});
Object.defineProperty(exports, "attachManagedImageRecordToMessage", {
	enumerable: true,
	get: function() {
		return attachManagedImageRecordToMessage;
	}
});
Object.defineProperty(exports, "claimManagedImageRecordCleanupIfCurrent", {
	enumerable: true,
	get: function() {
		return claimManagedImageRecordCleanupIfCurrent;
	}
});
Object.defineProperty(exports, "deleteClaimedManagedImageRecord", {
	enumerable: true,
	get: function() {
		return deleteClaimedManagedImageRecord;
	}
});
Object.defineProperty(exports, "insertManagedImageRecord", {
	enumerable: true,
	get: function() {
		return insertManagedImageRecord;
	}
});
Object.defineProperty(exports, "listManagedImageRecordEntries", {
	enumerable: true,
	get: function() {
		return listManagedImageRecordEntries;
	}
});
Object.defineProperty(exports, "managedImageRecordFromRow", {
	enumerable: true,
	get: function() {
		return managedImageRecordFromRow;
	}
});
Object.defineProperty(exports, "managedImageRecordToRow", {
	enumerable: true,
	get: function() {
		return managedImageRecordToRow;
	}
});
Object.defineProperty(exports, "managedImageRecordsEqual", {
	enumerable: true,
	get: function() {
		return managedImageRecordsEqual;
	}
});
Object.defineProperty(exports, "readManagedImageRecord", {
	enumerable: true,
	get: function() {
		return readManagedImageRecord;
	}
});
