const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_replace_file = require("./replace-file-D77oDPOz.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_row_codec = require("./row-codec-BT74rIrn.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cron/store.ts
/** Public cron store load/save API backed by SQLite plus quarantine sidecars. */
function resolveDefaultCronDir(env) {
	return node_path.default.join(require_utils.resolveConfigDir(env), "cron");
}
function resolveDefaultCronStorePath(env) {
	return node_path.default.join(resolveDefaultCronDir(env), "jobs.json");
}
/** Resolves the sidecar quarantine path used for invalid cron config rows. */
function resolveCronQuarantinePath(storePath) {
	if (storePath.endsWith(".json")) return storePath.replace(/\.json$/, "-quarantine.json");
	return `${storePath}-quarantine.json`;
}
/** Resolves the cron jobs store path, expanding home-relative user input. */
function resolveCronJobsStorePath(storePath, env = process.env) {
	if (storePath?.trim()) {
		const raw = storePath.trim();
		if (raw.startsWith("~")) return node_path.default.resolve(require_home_dir.expandHomePrefix(raw, { env }));
		return node_path.default.resolve(raw);
	}
	return resolveDefaultCronStorePath(env);
}
/** Loads cron jobs plus config/runtime sidecars from the SQLite-backed store. */
async function loadCronJobsStoreWithConfigJobs(storePath) {
	const storeKey = require_row_codec.cronStoreKey(node_path.default.resolve(storePath));
	const database = require_openclaw_state_db.openOperatorStateDatabase().db;
	const rows = require_row_codec.loadCronRows(database, storeKey);
	if (rows.length > 0) return require_row_codec.loadedCronStoreFromRows(rows);
	return {
		store: {
			version: 1,
			jobs: []
		},
		configJobs: [],
		configJobIndexes: [],
		configJobRuntimeEntries: [],
		invalidConfigRows: []
	};
}
function emptyLoadedCronStore() {
	return {
		store: {
			version: 1,
			jobs: []
		},
		configJobs: [],
		configJobIndexes: [],
		configJobRuntimeEntries: [],
		invalidConfigRows: []
	};
}
function tableExists(db, tableName) {
	return db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName) !== void 0;
}
/** Loads cron jobs from an existing SQLite store without creating or migrating state. */
async function loadCronJobsStoreWithConfigJobsReadOnly(storePath) {
	const statePath = require_openclaw_state_db.resolveOperatorStateSqlitePath(process.env);
	if (!node_fs.default.existsSync(statePath)) return emptyLoadedCronStore();
	const storeKey = require_row_codec.cronStoreKey(node_path.default.resolve(storePath));
	const db = new (require_state_migrations_cron_run_logs.requireNodeSqlite()).DatabaseSync(statePath, { readOnly: true });
	try {
		if (!tableExists(db, "cron_jobs")) return emptyLoadedCronStore();
		const rows = require_row_codec.loadCronRows(db, storeKey);
		if (rows.length > 0) return require_row_codec.loadedCronStoreFromRows(rows);
		return emptyLoadedCronStore();
	} finally {
		db.close();
	}
}
/** Loads only the persisted cron job store payload. */
async function loadCronJobsStore(storePath) {
	return (await loadCronJobsStoreWithConfigJobs(storePath)).store;
}
/** Synchronously loads only the persisted cron job store payload. */
function loadCronJobsStoreSync(storePath) {
	const storeKey = require_row_codec.cronStoreKey(node_path.default.resolve(storePath));
	const database = require_openclaw_state_db.openOperatorStateDatabase().db;
	const rows = require_row_codec.loadCronRows(database, storeKey);
	if (rows.length > 0) return require_row_codec.loadedCronStoreFromRows(rows).store;
	return {
		version: 1,
		jobs: []
	};
}
async function atomicWrite(filePath, content, dirMode = 448) {
	await require_replace_file.replaceFileAtomic({
		filePath,
		content,
		dirMode,
		mode: 384,
		tempPrefix: ".operator-cron",
		renameMaxRetries: 3,
		copyFallbackOnPermissionError: true
	});
}
/** Persists cron jobs, or only mutable runtime state when stateOnly is set. */
async function saveCronJobsStore(storePath, store, opts) {
	const storeKey = require_row_codec.cronStoreKey(node_path.default.resolve(storePath));
	if (opts?.stateOnly) {
		require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
			require_row_codec.updateCronRuntimeRows(db, storeKey, store);
		});
		return;
	}
	require_row_codec.assertCronStoreCanPersist(store);
	require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		require_row_codec.replaceCronRows(db, storeKey, store);
	});
}
/** Atomically acquire doctor migration metadata and replace cron rows only for the winner. */
async function saveCronJobsStoreWithMetadata(storePath, store, acquireMetadata) {
	const storeKey = require_row_codec.cronStoreKey(node_path.default.resolve(storePath));
	require_row_codec.assertCronStoreCanPersist(store);
	return require_openclaw_state_db.runOperatorStateWriteTransaction(({ db }) => {
		if (!acquireMetadata(db)) return false;
		require_row_codec.replaceCronRows(db, storeKey, store);
		return true;
	});
}
/** Loads the cron quarantine sidecar, validating its persisted v1 shape. */
async function loadCronQuarantineFile(pathLocal) {
	try {
		const parsed = require_parse_json_compat.parseJsonWithJson5Fallback(await node_fs.default.promises.readFile(pathLocal, "utf-8"));
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) || parsed.version !== 1 || !Array.isArray(parsed.jobs)) throw new Error(`Unsupported cron quarantine file shape at ${pathLocal}`);
		return {
			version: 1,
			jobs: parsed.jobs.map((entry, index) => {
				if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || typeof entry.reason !== "string" || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.job) && !("raw" in entry)) throw new Error(`Unsupported cron quarantine entry at ${pathLocal} index ${index}`);
				const sourceIndex = typeof entry.sourceIndex === "number" ? entry.sourceIndex : -1;
				const quarantined = {
					quarantinedAtMs: typeof entry.quarantinedAtMs === "number" && Number.isFinite(entry.quarantinedAtMs) ? entry.quarantinedAtMs : Date.now(),
					sourceIndex,
					reason: entry.reason
				};
				if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.job)) quarantined.job = entry.job;
				if ("raw" in entry) quarantined.raw = entry.raw;
				if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.state)) quarantined.state = entry.state;
				if (typeof entry.updatedAtMs === "number" && Number.isFinite(entry.updatedAtMs)) quarantined.updatedAtMs = entry.updatedAtMs;
				if (typeof entry.scheduleIdentity === "string") quarantined.scheduleIdentity = entry.scheduleIdentity;
				return quarantined;
			})
		};
	} catch (err) {
		if (err?.code === "ENOENT") return {
			version: 1,
			jobs: []
		};
		throw err;
	}
}
function quarantineEntryKey(entry) {
	const rawId = entry.job ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.job.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.job.jobId) : null;
	return JSON.stringify({
		id: rawId ?? null,
		sourceIndex: entry.sourceIndex,
		reason: entry.reason,
		job: entry.job ?? null,
		raw: entry.raw ?? null,
		state: entry.state ?? null,
		updatedAtMs: entry.updatedAtMs ?? null,
		scheduleIdentity: entry.scheduleIdentity ?? null
	});
}
/** Appends new invalid cron config rows to the quarantine sidecar without duplicating entries. */
async function saveCronQuarantineFile(params) {
	if (params.entries.length === 0) return null;
	const quarantinePath = resolveCronQuarantinePath(params.storePath);
	const existing = await loadCronQuarantineFile(quarantinePath);
	const seen = new Set(existing.jobs.map(quarantineEntryKey));
	const nextJobs = existing.jobs.slice();
	let appended = false;
	for (const entry of params.entries.toSorted((a, b) => a.sourceIndex - b.sourceIndex)) {
		const key = quarantineEntryKey(entry);
		if (seen.has(key)) continue;
		seen.add(key);
		appended = true;
		nextJobs.push({
			quarantinedAtMs: params.nowMs,
			sourceIndex: entry.sourceIndex,
			reason: entry.reason,
			...entry.job ? { job: structuredClone(entry.job) } : {},
			..."raw" in entry ? { raw: structuredClone(entry.raw) } : {},
			...entry.state ? { state: structuredClone(entry.state) } : {},
			...entry.updatedAtMs !== void 0 ? { updatedAtMs: entry.updatedAtMs } : {},
			...entry.scheduleIdentity !== void 0 ? { scheduleIdentity: entry.scheduleIdentity } : {}
		});
	}
	if (!appended) return quarantinePath;
	await atomicWrite(quarantinePath, JSON.stringify({
		version: 1,
		jobs: nextJobs
	}, null, 2));
	return quarantinePath;
}
//#endregion
Object.defineProperty(exports, "loadCronJobsStore", {
	enumerable: true,
	get: function() {
		return loadCronJobsStore;
	}
});
Object.defineProperty(exports, "loadCronJobsStoreSync", {
	enumerable: true,
	get: function() {
		return loadCronJobsStoreSync;
	}
});
Object.defineProperty(exports, "loadCronJobsStoreWithConfigJobs", {
	enumerable: true,
	get: function() {
		return loadCronJobsStoreWithConfigJobs;
	}
});
Object.defineProperty(exports, "loadCronJobsStoreWithConfigJobsReadOnly", {
	enumerable: true,
	get: function() {
		return loadCronJobsStoreWithConfigJobsReadOnly;
	}
});
Object.defineProperty(exports, "loadCronQuarantineFile", {
	enumerable: true,
	get: function() {
		return loadCronQuarantineFile;
	}
});
Object.defineProperty(exports, "resolveCronJobsStorePath", {
	enumerable: true,
	get: function() {
		return resolveCronJobsStorePath;
	}
});
Object.defineProperty(exports, "resolveCronQuarantinePath", {
	enumerable: true,
	get: function() {
		return resolveCronQuarantinePath;
	}
});
Object.defineProperty(exports, "saveCronJobsStore", {
	enumerable: true,
	get: function() {
		return saveCronJobsStore;
	}
});
Object.defineProperty(exports, "saveCronJobsStoreWithMetadata", {
	enumerable: true,
	get: function() {
		return saveCronJobsStoreWithMetadata;
	}
});
Object.defineProperty(exports, "saveCronQuarantineFile", {
	enumerable: true,
	get: function() {
		return saveCronQuarantineFile;
	}
});
