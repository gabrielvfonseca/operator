const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
const require_task_registry_store_sqlite = require("./task-registry.store.sqlite-CCfs-gtZ.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cron/list-snapshot-revision.ts
function resolveCronListSnapshotRevision(jobs) {
	return `sha256:${require_crypto_digest.sha256Base64Url(require_stable_stringify.stableStringify(jobs))}`;
}
//#endregion
//#region src/cron/task-run-history.ts
/** Cron run-history reads backed by authoritative task-ledger rows. */
const INVALID_CRON_TASK_RUN_JOB_ID_MESSAGE = "invalid cron task run job id";
function normalizeCronTaskRunJobId(jobId) {
	const trimmed = jobId.trim();
	if (!trimmed || trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("\0")) throw new Error(INVALID_CRON_TASK_RUN_JOB_ID_MESSAGE);
	return trimmed;
}
function isInvalidCronTaskRunJobIdError(error) {
	return error instanceof Error && error.message === INVALID_CRON_TASK_RUN_JOB_ID_MESSAGE;
}
function normalizeStatuses(options) {
	if (options.statuses?.length) {
		const statuses = options.statuses.filter(isCronRunStatus);
		if (statuses.length > 0) return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueValues)(statuses);
	}
	return isCronRunStatus(options.status) ? [options.status] : null;
}
function isCronRunStatus(value) {
	return value === "ok" || value === "error" || value === "skipped";
}
function isCronDeliveryStatus(value) {
	return value === "delivered" || value === "not-delivered" || value === "unknown" || value === "not-requested";
}
function normalizeDeliveryStatuses(options) {
	if (options.deliveryStatuses?.length) {
		const statuses = options.deliveryStatuses.filter(isCronDeliveryStatus);
		if (statuses.length > 0) return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueValues)(statuses);
	}
	return isCronDeliveryStatus(options.deliveryStatus) ? [options.deliveryStatus] : null;
}
function queryText(entry, jobNameById) {
	return [
		entry.summary ?? "",
		entry.error ?? "",
		entry.errorReason ?? "",
		entry.diagnostics?.summary ?? "",
		...(entry.diagnostics?.entries ?? []).map((diagnostic) => diagnostic.message),
		entry.jobId,
		jobNameById?.[entry.jobId] ?? "",
		entry.delivery?.intended?.channel ?? "",
		entry.delivery?.resolved?.channel ?? "",
		...(entry.delivery?.messageToolSentTo ?? []).map((target) => target.channel)
	].join(" ");
}
function compareHistoryRows(left, right, direction) {
	const multiplier = direction === "asc" ? 1 : -1;
	return multiplier * (left.entry.ts - right.entry.ts) || multiplier * (left.task.createdAt - right.task.createdAt) || multiplier * left.task.taskId.localeCompare(right.task.taskId);
}
function attachJobNames(entries, jobNameById) {
	for (const entry of entries) {
		const jobName = jobNameById?.[entry.jobId];
		if (jobName) entry.jobName = jobName;
	}
}
/** Reads and filters cron task rows with the legacy run-history paging contract. */
function readCronTaskRunHistoryPage(options) {
	const jobId = options.jobId ? normalizeCronTaskRunJobId(options.jobId) : void 0;
	const limit = Math.max(1, Math.min(200, Math.floor(options.limit ?? 50)));
	const offset = Math.max(0, Math.floor(options.offset ?? 0));
	const statuses = normalizeStatuses(options);
	const deliveryStatuses = normalizeDeliveryStatuses(options);
	const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(options.runId);
	const jobIds = options.jobIds ? new Set(options.jobIds) : void 0;
	const query = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(options.query);
	const sortDir = options.sortDir === "asc" ? "asc" : "desc";
	const rows = require_task_registry_store_sqlite.listTaskRegistryRecordsByRuntimeSourceIdFromSqlite({
		runtime: "cron",
		sourceId: jobId
	}).filter((task) => require_state_migrations_cron_run_logs.cronTaskRecordStoreKey(task) === options.storeKey).map((task) => ({
		task,
		entry: require_state_migrations_cron_run_logs.cronTaskRecordToRunLogEntry(task)
	})).filter((row) => row.entry !== null).filter(({ entry }) => {
		if (jobIds && !jobIds.has(entry.jobId)) return false;
		if (runId && entry.runId !== runId) return false;
		if (statuses && (!entry.status || !statuses.includes(entry.status))) return false;
		if (deliveryStatuses && !deliveryStatuses.includes(entry.deliveryStatus ?? "not-requested")) return false;
		return !query || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(queryText(entry, options.jobNameById)).includes(query);
	}).toSorted((left, right) => compareHistoryRows(left, right, sortDir));
	const total = rows.length;
	const boundedOffset = Math.min(total, offset);
	const entries = rows.slice(boundedOffset, boundedOffset + limit).map(({ entry }) => entry);
	attachJobNames(entries, options.jobNameById);
	const nextOffset = boundedOffset + entries.length;
	return {
		entries,
		total,
		offset: boundedOffset,
		limit,
		hasMore: nextOffset < total,
		nextOffset: nextOffset < total ? nextOffset : null
	};
}
//#endregion
Object.defineProperty(exports, "isInvalidCronTaskRunJobIdError", {
	enumerable: true,
	get: function() {
		return isInvalidCronTaskRunJobIdError;
	}
});
Object.defineProperty(exports, "normalizeCronTaskRunJobId", {
	enumerable: true,
	get: function() {
		return normalizeCronTaskRunJobId;
	}
});
Object.defineProperty(exports, "readCronTaskRunHistoryPage", {
	enumerable: true,
	get: function() {
		return readCronTaskRunHistoryPage;
	}
});
Object.defineProperty(exports, "resolveCronListSnapshotRevision", {
	enumerable: true,
	get: function() {
		return resolveCronListSnapshotRevision;
	}
});
