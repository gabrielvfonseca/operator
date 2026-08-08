const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_dreaming = require("./dreaming-EdTx6LXJ.cjs");
const require_row_codec = require("./row-codec-BT74rIrn.cjs");
const require_store = require("./store-BGE2-Qsm.cjs");
const require_webhook_url = require("./webhook-url-Dz4EMPMX.cjs");
const require_store_migration = require("./store-migration-DHDo1ga3.cjs");
const require_runtime_policy_migration = require("./runtime-policy-migration-BeaV9CEA.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_util = require("node:util");
//#region src/commands/doctor/cron/dreaming-payload-migration.ts
function isManagedDreamingJob(raw) {
	if (require_string_coerce.normalizeOptionalString(raw.description)?.includes("[managed-by=memory-core.short-term-promotion]")) return true;
	if (require_string_coerce.normalizeOptionalString(raw.name) !== "Memory Dreaming Promotion") return false;
	const payload = raw.payload ?? void 0;
	const payloadKind = require_string_coerce.normalizeOptionalLowercaseString(payload?.kind);
	if (payloadKind === "systemevent") return require_string_coerce.normalizeOptionalString(payload?.text) === require_dreaming.MEMORY_DREAMING_SYSTEM_EVENT_TEXT;
	if (payloadKind === "agentturn") return require_string_coerce.normalizeOptionalString(payload?.message) === require_dreaming.MEMORY_DREAMING_SYSTEM_EVENT_TEXT;
	return false;
}
function isStaleDreamingJob(raw) {
	if (require_string_coerce.normalizeOptionalLowercaseString(raw.sessionTarget) !== "isolated") return true;
	const payload = raw.payload ?? void 0;
	if (require_string_coerce.normalizeOptionalLowercaseString(payload?.kind) !== "agentturn") return true;
	if (payload?.lightContext !== true) return true;
	if (require_string_coerce.normalizeOptionalLowercaseString((raw.delivery ?? void 0)?.mode) !== "none") return true;
	return false;
}
function rewriteDreamingJobShape(raw) {
	raw.sessionTarget = "isolated";
	raw.payload = {
		kind: "agentTurn",
		message: require_dreaming.MEMORY_DREAMING_SYSTEM_EVENT_TEXT,
		lightContext: true
	};
	raw.delivery = { mode: "none" };
}
/** Rewrite managed dreaming jobs to the isolated light-context agent-turn shape. */
function migrateLegacyDreamingPayloadShape(jobs) {
	let rewrittenCount = 0;
	for (const raw of jobs) {
		if (!isManagedDreamingJob(raw)) continue;
		if (!isStaleDreamingJob(raw)) continue;
		rewriteDreamingJobShape(raw);
		rewrittenCount += 1;
	}
	return {
		changed: rewrittenCount > 0,
		rewrittenCount
	};
}
/** Count managed dreaming jobs that still need payload/session/delivery migration. */
function countStaleDreamingJobs(jobs) {
	let count = 0;
	for (const raw of jobs) if (isManagedDreamingJob(raw) && isStaleDreamingJob(raw)) count += 1;
	return count;
}
//#endregion
//#region src/commands/doctor/cron/legacy-notify.ts
/** Migrate legacy notify fallback flags into explicit delivery destinations when possible. */
function migrateLegacyNotifyFallback(params) {
	let changed = false;
	const warnings = [];
	const configuredLegacyWebhook = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.legacyWebhook);
	const legacyWebhook = configuredLegacyWebhook ? require_webhook_url.normalizeHttpWebhookUrl(configuredLegacyWebhook) : void 0;
	for (const raw of params.jobs) {
		if (!("notify" in raw)) continue;
		const jobName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.name) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.id) ?? "<unnamed>";
		if (!(raw.notify === true)) {
			delete raw.notify;
			changed = true;
			continue;
		}
		const delivery = raw.delivery && typeof raw.delivery === "object" && !Array.isArray(raw.delivery) ? raw.delivery : null;
		const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(delivery?.mode);
		const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery?.to);
		const hasLegacyChatDelivery = mode === void 0 && delivery !== null && ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery.channel) !== void 0 || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(delivery.accountId) !== void 0 || "threadId" in delivery || to !== void 0 && !require_webhook_url.normalizeHttpWebhookUrl(to));
		const completionDestination = delivery?.completionDestination && typeof delivery.completionDestination === "object" && !Array.isArray(delivery.completionDestination) ? delivery.completionDestination : null;
		const completionMode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(completionDestination?.mode);
		const completionTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(completionDestination?.to);
		const validWebhookTo = to ? require_webhook_url.normalizeHttpWebhookUrl(to) : void 0;
		const validCompletionTo = completionTo ? require_webhook_url.normalizeHttpWebhookUrl(completionTo) : void 0;
		if (mode === "webhook" && validWebhookTo || completionMode === "webhook" && validCompletionTo) {
			delete raw.notify;
			changed = true;
			continue;
		}
		if (configuredLegacyWebhook && !legacyWebhook) {
			warnings.push(`Cron job "${jobName}" still uses legacy notify fallback, but cron.webhook is not a valid HTTP(S) URL so doctor cannot migrate it automatically.`);
			continue;
		}
		if (!legacyWebhook) {
			delete raw.notify;
			changed = true;
			continue;
		}
		if (mode === void 0 && !hasLegacyChatDelivery || mode === "none" || mode === "webhook") {
			raw.delivery = {
				...delivery,
				mode: "webhook",
				to: mode === "none" ? legacyWebhook : validWebhookTo ?? legacyWebhook
			};
			delete raw.notify;
			changed = true;
			continue;
		}
		raw.delivery = {
			...delivery,
			...hasLegacyChatDelivery ? { mode: "announce" } : {},
			completionDestination: {
				...completionDestination,
				mode: "webhook",
				to: legacyWebhook
			}
		};
		delete raw.notify;
		changed = true;
	}
	return {
		changed,
		warnings
	};
}
//#endregion
//#region src/commands/doctor/cron/legacy-run-log-migration.ts
const LEGACY_CRON_RUN_LOG_ARCHIVE_SUFFIX = ".migrated";
function parseCronRunLogEntriesFromJsonl(raw, opts) {
	const entries = [];
	for (const line of raw.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		try {
			const entry = require_state_migrations_cron_run_logs.parseCronRunLogEntryObject(JSON.parse(trimmed), opts);
			if (entry) entries.push(entry);
		} catch {}
	}
	return entries;
}
function archiveLegacyCronRunLogSync(filePath) {
	const archivePath = `${filePath}${LEGACY_CRON_RUN_LOG_ARCHIVE_SUFFIX}`;
	if (!node_fs.default.existsSync(filePath) || node_fs.default.existsSync(archivePath)) return;
	try {
		node_fs.default.renameSync(filePath, archivePath);
	} catch {}
}
/** Import legacy per-job JSONL run logs into task_runs and archive migrated files. */
async function migrateLegacyCronRunLogsToSqlite(storePath) {
	const resolvedStorePath = node_path.default.resolve(storePath);
	const runsDir = node_path.default.resolve(node_path.default.dirname(resolvedStorePath), "runs");
	const jsonlFiles = (await node_fs_promises.default.readdir(runsDir, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"));
	if (jsonlFiles.length === 0) return { importedFiles: 0 };
	for (const file of jsonlFiles) {
		const filePath = node_path.default.join(runsDir, file.name);
		const jobId = node_path.default.basename(file.name, ".jsonl");
		const entries = parseCronRunLogEntriesFromJsonl(node_fs.default.readFileSync(filePath, "utf-8"), { jobId });
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			db.exec(`
        CREATE TABLE cron_run_logs (
          store_key TEXT NOT NULL,
          job_id TEXT NOT NULL,
          seq INTEGER NOT NULL,
          ts INTEGER NOT NULL,
          entry_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (store_key, job_id, seq)
        ) STRICT;
      `);
			const insert = db.prepare(`INSERT INTO cron_run_logs
          (store_key, job_id, seq, ts, entry_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`);
			const storeKey = require_row_codec.cronStoreKey(resolvedStorePath);
			for (const [index, entry] of entries.entries()) insert.run(storeKey, jobId, index + 1, entry.ts, JSON.stringify(entry), Date.now());
			require_state_migrations_cron_run_logs.migrateLegacyCronRunLogsToTaskRuns(db);
		});
		archiveLegacyCronRunLogSync(filePath);
	}
	return { importedFiles: jsonlFiles.length };
}
/** Return true when legacy cron JSONL run log files exist next to a store path. */
async function legacyCronRunLogFilesExist(storePath) {
	const resolvedStorePath = node_path.default.resolve(storePath);
	const runsDir = node_path.default.resolve(node_path.default.dirname(resolvedStorePath), "runs");
	return (await node_fs_promises.default.readdir(runsDir, { withFileTypes: true }).catch(() => [])).some((entry) => entry.isFile() && entry.name.endsWith(".jsonl"));
}
//#endregion
//#region src/commands/doctor/cron/migration-ledger.ts
function migrationRunId(source) {
	return `cron-legacy:${source.sourceKey}`;
}
function hasLegacyCronMigrationReceiptInDatabase(db, source) {
	return require_state_migrations_cron_run_logs.executeSqliteQueryTakeFirstSync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).selectFrom("migration_sources").select("status").where("source_key", "=", source.sourceKey))?.status === "completed";
}
function hasLegacyCronMigrationReceipt(source) {
	return hasLegacyCronMigrationReceiptInDatabase(require_openclaw_state_db.openOperatorStateDatabase().db, source);
}
function tableExists(db, tableName) {
	return db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName) !== void 0;
}
function hasLegacyCronMigrationReceiptReadOnly(source) {
	const statePath = require_openclaw_state_db.resolveOperatorStateSqlitePath(process.env);
	if (!node_fs.default.existsSync(statePath)) return false;
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(statePath, { readOnly: true });
	try {
		if (!tableExists(db, "migration_sources")) return false;
		return hasLegacyCronMigrationReceiptInDatabase(db, source);
	} finally {
		db.close();
	}
}
function acquireLegacyCronMigrationReceipt(db, source) {
	if (hasLegacyCronMigrationReceiptInDatabase(db, source)) return false;
	const now = Date.now();
	const runId = migrationRunId(source);
	const reportJson = JSON.stringify({
		source: "legacy-cron-json",
		target: "cron_jobs",
		statePath: source.stateSha256 ? source.statePath : void 0,
		stateSha256: source.stateSha256
	});
	const kysely = require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.insertInto("migration_runs").values({
		id: runId,
		started_at: now,
		finished_at: now,
		status: "completed",
		report_json: reportJson
	}).onConflict((conflict) => conflict.column("id").doUpdateSet({
		finished_at: now,
		status: "completed",
		report_json: reportJson
	})));
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, kysely.insertInto("migration_sources").values({
		source_key: source.sourceKey,
		migration_kind: "legacy-cron-json",
		source_path: source.sourcePath,
		target_table: "cron_jobs",
		source_sha256: source.sourceSha256,
		source_size_bytes: source.sourceSizeBytes,
		source_record_count: source.sourceRecordCount,
		last_run_id: runId,
		status: "completed",
		imported_at: now,
		removed_source: 0,
		report_json: reportJson
	}).onConflict((conflict) => conflict.column("source_key").doUpdateSet({
		last_run_id: runId,
		status: "completed",
		imported_at: now,
		removed_source: 0,
		report_json: reportJson
	})));
	return true;
}
function markLegacyCronMigrationSourceRemoved(source) {
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, require_state_migrations_cron_run_logs.getNodeSqliteKysely(db).updateTable("migration_sources").set({ removed_source: 1 }).where("source_key", "=", source.sourceKey));
	});
}
//#endregion
//#region src/commands/doctor/cron/repair-plan.ts
function pluralize$1(count, noun) {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
function formatJobNameList(names) {
	const preview = names.slice(0, 5).map((name) => `\`${name}\``);
	const remaining = names.length - preview.length;
	return remaining > 0 ? `: ${preview.join(", ")} (+${remaining} more)` : `: ${preview.join(", ")}`;
}
/**
* Advisory for isolated agentTurn cron jobs that describe a command but cannot access shell tools.
* These need operator attention, but `doctor --fix` cannot safely infer whether to grant tool
* access or recreate them as command cron jobs.
*/
function formatUnresolvedCommandPromptAdvisory(names) {
	if (names.length === 0) return null;
	const describeVerb = names.length === 1 ? "describes" : "describe";
	const accessVerb = names.length === 1 ? "lacks" : "lack";
	return [
		`${pluralize$1(names.length, "isolated cron job")} ${describeVerb} a shell command in the agent prompt but ${accessVerb} shell/process tool access${formatJobNameList(names)}.`,
		"- This is not the supported shell-tool prompt shape, so doctor cannot prove the job will execute the requested command.",
		"- Recreate the job as a command cron job (`operator cron add ... --command \"<shell>\"`) or grant explicit shell/process tool access before relying on it."
	].join("\n");
}
/**
* Advisory for isolated agentTurn cron jobs that drive shell/process tools from the prompt.
* These keep running and are not a legacy store row, so `doctor --fix` cannot rewrite them;
* routing this through the auto-repair preview made the finding persist after every --fix.
*/
function formatUnresolvedShellPromptAdvisory(names) {
	if (names.length === 0) return null;
	const verb = names.length === 1 ? "drives" : "drive";
	const keepVerb = names.length === 1 ? "keeps" : "keep";
	return [
		`${pluralize$1(names.length, "isolated cron job")} ${verb} shell/process tools from the agent prompt and ${keepVerb} running as-is${formatJobNameList(names)}.`,
		"- This is a supported shape, not a legacy store row, so the doctor fix path cannot convert it and the finding is informational only.",
		"- For a deterministic run, recreate the job as a command cron job (`operator cron add ... --command \"<shell>\"`)."
	].join("\n");
}
/** Convert legacy cron issue counts into doctor preview lines. */
function formatLegacyIssuePreview(issues) {
	const lines = [];
	if (issues.jobId) lines.push(`- ${pluralize$1(issues.jobId, "job")} still uses legacy \`jobId\``);
	if (issues.missingId) lines.push(`- ${pluralize$1(issues.missingId, "job")} is missing a canonical string \`id\``);
	if (issues.nonStringId) lines.push(`- ${pluralize$1(issues.nonStringId, "job")} stores \`id\` as a non-string value`);
	if (issues.legacyScheduleString) lines.push(`- ${pluralize$1(issues.legacyScheduleString, "job")} stores schedule as a bare string`);
	if (issues.legacyScheduleCron) lines.push(`- ${pluralize$1(issues.legacyScheduleCron, "job")} still uses \`schedule.cron\``);
	if (issues.legacyPayloadKind) lines.push(`- ${pluralize$1(issues.legacyPayloadKind, "job")} needs payload kind normalization`);
	if (issues.legacyPayloadCodexModel) lines.push(`- ${pluralize$1(issues.legacyPayloadCodexModel, "job")} still uses legacy \`openai-codex/*\` cron model refs`);
	if (issues.legacyAgentTurnCommandPayload) lines.push(`- ${pluralize$1(issues.legacyAgentTurnCommandPayload, "job")} uses an agent prompt to run a shell command`);
	if (issues.legacyPayloadProvider) lines.push(`- ${pluralize$1(issues.legacyPayloadProvider, "job")} still uses payload \`provider\` as a delivery alias`);
	if (issues.legacyTopLevelPayloadFields) lines.push(`- ${pluralize$1(issues.legacyTopLevelPayloadFields, "job")} still uses top-level payload fields`);
	if (issues.legacyTopLevelDeliveryFields) lines.push(`- ${pluralize$1(issues.legacyTopLevelDeliveryFields, "job")} still uses top-level delivery fields`);
	if (issues.legacyDeliveryMode) lines.push(`- ${pluralize$1(issues.legacyDeliveryMode, "job")} still uses delivery mode \`deliver\``);
	if (issues.invalidSchedule) lines.push(`- ${pluralize$1(issues.invalidSchedule, "job")} has an invalid persisted schedule and will be removed`);
	if (issues.invalidPayload) lines.push(`- ${pluralize$1(issues.invalidPayload, "job")} has an invalid persisted payload and will be removed`);
	return lines;
}
function cronJobMigrationKey(job) {
	return require_string_coerce.normalizeOptionalStringifiedId(job.id) ?? require_string_coerce.normalizeOptionalStringifiedId(job.jobId) ?? require_store_migration.resolveLegacyCronMigrationId(job);
}
/** Merge legacy JSON jobs into current jobs without duplicating matching ids/jobIds. */
function mergeLegacyCronJobs(params) {
	const merged = [...params.currentJobs];
	const currentKeys = new Set(params.currentJobs.map((job) => cronJobMigrationKey(job)).filter((key) => key !== void 0));
	let importedCount = 0;
	for (const legacyJob of params.legacyJobs) {
		const key = cronJobMigrationKey(legacyJob);
		if (key && currentKeys.has(key)) continue;
		if (key) currentKeys.add(key);
		merged.push(legacyJob);
		importedCount += 1;
	}
	return {
		jobs: merged,
		importedCount
	};
}
/** Attach runtime SQLite state columns back onto a config-defined cron job row. */
function mergeRuntimeEntryIntoConfigJob(params) {
	return {
		...params.job,
		...params.runtimeEntry?.updatedAtMs !== void 0 ? { updatedAtMs: params.runtimeEntry.updatedAtMs } : {},
		...params.runtimeEntry?.state ? { state: structuredClone(params.runtimeEntry.state) } : {}
	};
}
/** Return true when a SQLite cron projection row no longer matches config JSON. */
function needsSqliteProjectionBackfill(params) {
	if (!params.projectedJob) return true;
	const normalizedConfig = require_row_codec.normalizeCronJobInput(params.configJob, { applyDefaults: true });
	if (!normalizedConfig) return true;
	const projected = params.projectedJob;
	for (const field of [
		"agentId",
		"deleteAfterRun",
		"delivery",
		"description",
		"enabled",
		"failureAlert",
		"name",
		"payload",
		"schedule",
		"sessionKey",
		"sessionTarget",
		"wakeMode"
	]) if (!(0, node_util.isDeepStrictEqual)(normalizedConfig[field], projected[field])) return true;
	return false;
}
//#endregion
//#region src/commands/doctor/cron/legacy-repair.ts
function pluralize(count, noun) {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
function formatRunLogMigrationNote(importedFiles) {
	return importedFiles > 0 ? ` Imported ${pluralize(importedFiles, "legacy cron run log")} into SQLite.` : "";
}
function errorMessage(err) {
	return err instanceof Error ? err.message : String(err);
}
async function loadLegacyCronRepairState(params) {
	const storePath = require_store.resolveCronJobsStorePath(params.cfg.cron?.store);
	const quarantinePath = require_store.resolveCronQuarantinePath(storePath);
	const legacyStoreDetected = await require_store_migration.legacyCronStoreFilesExist(storePath);
	const legacyRunLogDetected = await legacyCronRunLogFilesExist(storePath);
	if (params.onlyIfLegacyDetected && !legacyStoreDetected && !legacyRunLogDetected) return null;
	const loaded = params.readOnly ? await require_store.loadCronJobsStoreWithConfigJobsReadOnly(storePath) : await require_store.loadCronJobsStoreWithConfigJobs(storePath);
	const currentJobs = loaded.configJobs.length > 0 ? loaded.configJobs.map((job, index) => mergeRuntimeEntryIntoConfigJob({
		job,
		runtimeEntry: loaded.configJobRuntimeEntries[index]
	})) : loaded.store.jobs;
	const sqliteProjectionBackfillCount = loaded.configJobs.length > 0 ? currentJobs.filter((job, index) => needsSqliteProjectionBackfill({
		configJob: job,
		projectedJob: loaded.store.jobs[index]
	})).length : 0;
	let rawJobs = currentJobs;
	let legacyImportCount = 0;
	let legacyMigrationSource;
	let legacyMigrationAlreadyImported = false;
	if (legacyStoreDetected) {
		const loadedLegacy = await require_store_migration.loadLegacyCronStoreForMigration(storePath);
		legacyMigrationSource = loadedLegacy.migrationSource;
		legacyMigrationAlreadyImported = legacyMigrationSource ? params.readOnly ? hasLegacyCronMigrationReceiptReadOnly(legacyMigrationSource) : hasLegacyCronMigrationReceipt(legacyMigrationSource) : false;
		if (!legacyMigrationAlreadyImported) {
			const merged = mergeLegacyCronJobs({
				currentJobs: rawJobs,
				legacyJobs: loadedLegacy.store.jobs
			});
			rawJobs = merged.jobs;
			legacyImportCount = merged.importedCount;
		}
	}
	return {
		storePath,
		quarantinePath,
		legacyStoreDetected,
		legacyRunLogDetected,
		legacyMigrationSource,
		legacyMigrationAlreadyImported,
		legacyImportCount,
		sqliteProjectionBackfillCount,
		rawJobs
	};
}
async function applyLegacyCronStoreRepair(params) {
	const { state } = params;
	const changes = [];
	const warnings = [];
	const runtimePolicyPlan = params.migrateCodexModelRefs === true ? require_runtime_policy_migration.planCronCodexRefRewriteAgainstPersistedConfig({
		cfg: params.cfg,
		targets: require_store_migration.collectStoredCronCodexRuntimePolicyTargets(state.rawJobs),
		blockedModelIdentities: params.blockedModelIdentities
	}) : void 0;
	warnings.push(...runtimePolicyPlan?.warnings ?? []);
	const blockedRuntimePolicyTargets = new Set((runtimePolicyPlan?.blockedTargets ?? []).map(require_store_migration.cronCodexRuntimePolicyTargetKey));
	const normalized = params.normalized ?? require_store_migration.normalizeStoredCronJobs(state.rawJobs, {
		migrateCodexModelRefs: params.migrateCodexModelRefs,
		shouldMigrateCodexRuntimePolicyTarget: (target) => !blockedRuntimePolicyTargets.has(require_store_migration.cronCodexRuntimePolicyTargetKey(target))
	});
	const legacyWebhook = require_string_coerce.normalizeOptionalString(params.cfg.cron?.webhook);
	const notifyMigration = migrateLegacyNotifyFallback({
		jobs: state.rawJobs,
		legacyWebhook
	});
	const dreamingMigration = migrateLegacyDreamingPayloadShape(state.rawJobs);
	warnings.push(...notifyMigration.warnings);
	const storeChanged = state.legacyStoreDetected && !state.legacyMigrationAlreadyImported || state.sqliteProjectionBackfillCount > 0 || normalized.mutated || notifyMigration.changed || dreamingMigration.changed;
	if (!(state.legacyStoreDetected || state.legacyRunLogDetected || storeChanged) && warnings.length === 0) return {
		changes,
		warnings
	};
	if (storeChanged) try {
		if (normalized.removedJobs.length > 0) await require_store.saveCronQuarantineFile({
			storePath: state.storePath,
			nowMs: Date.now(),
			entries: normalized.removedJobs.map((entry) => ({
				sourceIndex: entry.sourceIndex,
				reason: entry.reason,
				job: entry.job
			}))
		});
		const store = {
			version: 1,
			jobs: state.rawJobs
		};
		const migrationSource = state.legacyMigrationSource;
		if (migrationSource && !state.legacyMigrationAlreadyImported) {
			await require_store_migration.assertLegacyCronMigrationSourceCurrent(migrationSource);
			await require_store.saveCronJobsStoreWithMetadata(state.storePath, store, (db) => {
				return acquireLegacyCronMigrationReceipt(db, migrationSource);
			});
		} else await require_store.saveCronJobsStore(state.storePath, store);
	} catch (err) {
		return {
			changes,
			warnings: [...warnings, `Failed writing migrated cron store at ${require_utils.shortenHomePath(state.storePath)}: ${errorMessage(err)}`]
		};
	}
	let importedRunLogs = 0;
	if (state.legacyRunLogDetected) try {
		importedRunLogs = (await migrateLegacyCronRunLogsToSqlite(state.storePath)).importedFiles;
	} catch (err) {
		warnings.push(`Failed importing legacy cron run logs at ${require_utils.shortenHomePath(state.storePath)}: ${errorMessage(err)}`);
	}
	if (state.legacyStoreDetected) {
		const archiveResult = await require_store_migration.archiveLegacyCronStoreForMigration(state.storePath, state.legacyMigrationSource);
		if (archiveResult.ok) {
			if (state.legacyMigrationSource) try {
				markLegacyCronMigrationSourceRemoved(state.legacyMigrationSource);
			} catch (err) {
				warnings.push(`Cron store was archived, but its migration receipt could not be finalized: ${errorMessage(err)}`);
			}
			changes.push(`Cron store migrated to SQLite at ${require_utils.shortenHomePath(state.storePath)}.${formatRunLogMigrationNote(importedRunLogs)}`);
		} else for (const failure of archiveResult.failures) warnings.push(`Migrated cron jobs to SQLite but could not archive the legacy cron file at ${require_utils.shortenHomePath(failure.path)}: ${failure.reason}. Remove it manually or rerun ${require_command_format.formatCliCommand("operator doctor --fix")} to retry.`);
	} else if (state.legacyRunLogDetected && importedRunLogs > 0) changes.push(`Cron run logs migrated to SQLite at ${require_utils.shortenHomePath(state.storePath)}.${formatRunLogMigrationNote(importedRunLogs)}`);
	else if (storeChanged) changes.push(`Cron store normalized at ${require_utils.shortenHomePath(state.storePath)}.`);
	if (dreamingMigration.rewrittenCount > 0) changes.push(`Rewrote ${pluralize(dreamingMigration.rewrittenCount, "managed dreaming job")} to run as an isolated agent turn so dreaming no longer requires heartbeat.`);
	return {
		changes,
		warnings,
		codexRuntimePolicyTargets: normalized.codexRuntimePolicyTargets
	};
}
async function repairLegacyCronStoreWithoutPrompt(params) {
	const storePath = require_store.resolveCronJobsStorePath(require_string_coerce.normalizeOptionalString(params.cfg.cron?.store));
	let state;
	try {
		state = await loadLegacyCronRepairState({
			cfg: params.cfg,
			onlyIfLegacyDetected: true
		});
	} catch (err) {
		return {
			changes: [],
			warnings: [`Failed reading legacy cron storage at ${require_utils.shortenHomePath(storePath)}: ${errorMessage(err)}`]
		};
	}
	if (!state) return {
		changes: [],
		warnings: []
	};
	return await applyLegacyCronStoreRepair({
		...params,
		state
	});
}
/** Read legacy Codex cron targets without changing either cron storage or config. */
async function collectCronCodexRuntimePolicyTargetsReadOnly(params) {
	const storePath = require_store.resolveCronJobsStorePath(require_string_coerce.normalizeOptionalString(params.cfg.cron?.store));
	try {
		const state = await loadLegacyCronRepairState({
			cfg: params.cfg,
			readOnly: true
		});
		return {
			targets: state ? require_store_migration.collectStoredCronCodexRuntimePolicyTargets(state.rawJobs) : [],
			warnings: []
		};
	} catch (err) {
		return {
			targets: [],
			warnings: [`Failed reading cron storage at ${require_utils.shortenHomePath(storePath)} while planning Codex model migration: ${errorMessage(err)}`]
		};
	}
}
/** Commit Codex cron refs only after their model-scoped config policy is durable. */
async function repairCronCodexModelRefsAfterConfigWrite(params) {
	const storePath = require_store.resolveCronJobsStorePath(require_string_coerce.normalizeOptionalString(params.cfg.cron?.store));
	try {
		const state = await loadLegacyCronRepairState({ cfg: params.cfg });
		return state ? await applyLegacyCronStoreRepair({
			cfg: params.cfg,
			state,
			migrateCodexModelRefs: true,
			blockedModelIdentities: params.blockedModelIdentities
		}) : {
			changes: [],
			warnings: []
		};
	} catch (err) {
		return {
			changes: [],
			warnings: [`Failed reading cron storage at ${require_utils.shortenHomePath(storePath)} while committing Codex model migration: ${errorMessage(err)}`]
		};
	}
}
//#endregion
exports.applyLegacyCronStoreRepair = applyLegacyCronStoreRepair;
exports.collectCronCodexRuntimePolicyTargetsReadOnly = collectCronCodexRuntimePolicyTargetsReadOnly;
exports.countStaleDreamingJobs = countStaleDreamingJobs;
exports.formatLegacyIssuePreview = formatLegacyIssuePreview;
exports.formatUnresolvedCommandPromptAdvisory = formatUnresolvedCommandPromptAdvisory;
exports.formatUnresolvedShellPromptAdvisory = formatUnresolvedShellPromptAdvisory;
exports.loadLegacyCronRepairState = loadLegacyCronRepairState;
exports.repairCronCodexModelRefsAfterConfigWrite = repairCronCodexModelRefsAfterConfigWrite;
exports.repairLegacyCronStoreWithoutPrompt = repairLegacyCronStoreWithoutPrompt;
