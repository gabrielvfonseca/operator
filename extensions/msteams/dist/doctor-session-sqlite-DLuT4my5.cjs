const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./replace-file-D77oDPOz.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths$1 = require("./paths-DsfW3Lup.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_targets = require("./targets-BCEDn-da.cjs");
const require_session_manager = require("./session-manager-Bhv4hvYF.cjs");
const require_doctor_sqlite_compact = require("./doctor-sqlite-compact-Cw8xcLuR.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let zod = require("zod");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let node_crypto = require("node:crypto");
let node_util = require("node:util");
let _openclaw_fs_safe_atomic = require("@openclaw/fs-safe/atomic");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/doctor-session-sqlite-readers.ts
/** Read-only diagnostic readers used by the session SQLite doctor mode. */
const JSONL_READ_CHUNK_BYTES = 64 * 1024;
function countTranscriptEventsForPath(transcriptPath) {
	if (!transcriptPath) return {
		status: "ok",
		events: 0
	};
	if (!node_fs.default.existsSync(transcriptPath)) return { status: "missing" };
	let events = 0;
	try {
		for (const line of iterateJsonlLinesSync(transcriptPath)) {
			if (!parseJsonlLine(line)) continue;
			events += 1;
		}
		return {
			status: "ok",
			events
		};
	} catch (err) {
		return {
			status: "malformed",
			message: String(err)
		};
	}
}
function createTranscriptEventReader(transcriptPath) {
	return (append) => {
		for (const line of iterateJsonlLinesSync(transcriptPath)) {
			const parsed = parseJsonlLine(line);
			if (parsed) append(require_session_manager.normalizeLoadedFileEntry(parsed));
		}
	};
}
function createTranscriptEventPrefixReader(transcriptPath) {
	return (append) => {
		try {
			for (const line of iterateJsonlLinesSync(transcriptPath)) {
				const parsed = parseJsonlLine(line);
				if (parsed) append(require_session_manager.normalizeLoadedFileEntry(parsed));
			}
		} catch {}
	};
}
function readSqliteEntryCount(target) {
	const result = readOnlySqliteSessionEntries(target);
	return result.ok ? result.summaries.length : 0;
}
function readOnlySqliteExactSessionEntry(target, sessionKey) {
	const result = readOnlySqliteSessionEntries(target);
	if (!result.ok) return {
		error: result.error,
		ok: false
	};
	return {
		entry: result.summaries.find((summary) => summary.sessionKey === sessionKey),
		ok: true
	};
}
function readOnlySqliteSessionEntries(target) {
	const sqlitePath = resolveTargetSqlitePath(target);
	if (!node_fs.default.existsSync(sqlitePath)) return {
		exists: false,
		ok: true,
		summaries: []
	};
	const sqlite = require_state_migrations_cron_run_logs.requireNodeSqlite();
	let database;
	try {
		database = new sqlite.DatabaseSync(sqlitePath, { readOnly: true });
		if (!database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get("session_entries")) return {
			exists: true,
			ok: true,
			summaries: []
		};
		return {
			exists: true,
			ok: true,
			summaries: database.prepare("SELECT session_key, entry_json FROM session_entries ORDER BY session_key ASC").all().flatMap((row) => {
				if (typeof row.session_key !== "string" || typeof row.entry_json !== "string") return [];
				const entry = parseSqliteSessionEntry(row.entry_json);
				return entry ? [{
					entry,
					sessionKey: row.session_key
				}] : [];
			})
		};
	} catch (error) {
		return {
			error,
			exists: true,
			ok: false
		};
	} finally {
		database?.close();
	}
}
function readOnlySqliteTranscriptEventCount(target, sessionId) {
	const sqlitePath = resolveTargetSqlitePath(target);
	if (!node_fs.default.existsSync(sqlitePath)) return {
		events: 0,
		exists: false,
		ok: true
	};
	const sqlite = require_state_migrations_cron_run_logs.requireNodeSqlite();
	let database;
	try {
		database = new sqlite.DatabaseSync(sqlitePath, { readOnly: true });
		if (!database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get("transcript_events")) return {
			events: 0,
			exists: true,
			ok: true
		};
		const count = database.prepare("SELECT COUNT(*) AS count FROM transcript_events WHERE session_id = ?").get(sessionId)?.count;
		return {
			events: typeof count === "number" && Number.isFinite(count) ? count : 0,
			exists: true,
			ok: true
		};
	} catch (error) {
		return {
			error,
			exists: true,
			ok: false
		};
	} finally {
		database?.close();
	}
}
function readOnlySqliteDbStats(target) {
	const sqlitePath = resolveTargetSqlitePath(target);
	const sizeFor = (filePath) => {
		try {
			return node_fs.default.statSync(filePath).size;
		} catch {
			return 0;
		}
	};
	if (!node_fs.default.existsSync(sqlitePath)) return {
		ok: true,
		stats: {
			dbSizeBytes: 0,
			largestSessions: [],
			totalTranscriptRowBytes: 0,
			walSizeBytes: sizeFor(`${sqlitePath}-wal`)
		}
	};
	const sqlite = require_state_migrations_cron_run_logs.requireNodeSqlite();
	let database;
	try {
		database = new sqlite.DatabaseSync(sqlitePath, { readOnly: true });
		const hasTranscriptEvents = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get("transcript_events");
		const integrityRow = database.prepare("PRAGMA quick_check").get();
		if (!hasTranscriptEvents) return {
			ok: true,
			stats: {
				dbSizeBytes: sizeFor(sqlitePath),
				integrityCheck: typeof integrityRow?.quick_check === "string" ? integrityRow.quick_check : void 0,
				largestSessions: [],
				totalTranscriptRowBytes: 0,
				walSizeBytes: sizeFor(`${sqlitePath}-wal`)
			}
		};
		const totalRow = database.prepare("SELECT COALESCE(SUM(LENGTH(event_json)), 0) AS row_bytes FROM transcript_events").get();
		const largestRows = database.prepare(`
          SELECT session_id, COUNT(*) AS events, COALESCE(SUM(LENGTH(event_json)), 0) AS row_bytes
          FROM transcript_events
          GROUP BY session_id
          ORDER BY row_bytes DESC, events DESC, session_id ASC
          LIMIT 5
        `).all();
		return {
			ok: true,
			stats: {
				dbSizeBytes: sizeFor(sqlitePath),
				integrityCheck: typeof integrityRow?.quick_check === "string" ? integrityRow.quick_check : void 0,
				largestSessions: largestRows.flatMap((row) => {
					if (typeof row.session_id !== "string") return [];
					return [{
						events: sqliteNumber(row.events),
						rowBytes: sqliteNumber(row.row_bytes),
						sessionId: row.session_id
					}];
				}),
				totalTranscriptRowBytes: sqliteNumber(totalRow?.row_bytes),
				walSizeBytes: sizeFor(`${sqlitePath}-wal`)
			}
		};
	} catch (error) {
		return {
			error,
			ok: false
		};
	} finally {
		database?.close();
	}
}
function resolveTargetSqlitePath(target) {
	const sqliteTarget = require_targets.resolveSqliteTargetFromSessionStorePath(target.storePath, { agentId: target.agentId });
	return require_openclaw_agent_db.resolveOperatorAgentSqlitePath({
		agentId: sqliteTarget.agentId ?? target.agentId,
		...sqliteTarget.path ? { path: sqliteTarget.path } : {}
	});
}
function parseSqliteSessionEntry(entryJson) {
	try {
		const parsed = JSON.parse(entryJson);
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function* iterateJsonlLinesSync(filePath) {
	const fd = node_fs.default.openSync(filePath, "r");
	const decoder = new node_util.TextDecoder("utf-8", { fatal: true });
	const buffer = Buffer.allocUnsafe(JSONL_READ_CHUNK_BYTES);
	let carry = "";
	let lineNumber = 0;
	try {
		while (true) {
			const bytesRead = node_fs.default.readSync(fd, buffer, 0, buffer.length, null);
			if (bytesRead === 0) break;
			carry += decoder.decode(buffer.subarray(0, bytesRead), { stream: true });
			const parts = carry.split(/\r?\n/);
			carry = parts.pop() ?? "";
			for (const part of parts) {
				lineNumber += 1;
				const text = part.trim();
				if (text) yield {
					final: false,
					lineNumber,
					text
				};
			}
		}
		carry += decoder.decode();
		const text = carry.trim();
		if (text) yield {
			final: true,
			lineNumber: lineNumber + 1,
			text
		};
	} catch (err) {
		throw new Error(`${filePath}:${lineNumber + 1}: ${String(err)}`, { cause: err });
	} finally {
		node_fs.default.closeSync(fd);
	}
}
function sqliteNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "bigint") return Number(value);
	return 0;
}
function parseJsonlLine(line) {
	try {
		return JSON.parse(line.text);
	} catch (error) {
		if (line.final) return;
		throw error;
	}
}
//#endregion
//#region src/commands/doctor-session-sqlite-compact.ts
/** Runs doctor-owned SQLite file compaction for migrated session stores. */
/** Reclaim free pages from one agent session SQLite database. */
function compactDoctorSessionSqliteTarget(target, options = {}) {
	const sqlitePath = resolveTargetSqlitePath(target);
	const beforeFileSizes = readSqliteFileSizes(sqlitePath);
	const stat = readSessionDatabaseStat(sqlitePath);
	if (!stat) return {
		dbSizeAfterBytes: 0,
		dbSizeBeforeBytes: 0,
		freelistAfterPages: 0,
		freelistBeforePages: 0,
		pageSizeBytes: 0,
		reclaimedBytes: 0,
		skipped: true,
		walSizeAfterBytes: beforeFileSizes.walSizeBytes,
		walSizeBeforeBytes: beforeFileSizes.walSizeBytes
	};
	if (!stat.isFile()) throw new Error(`Operator agent database is not a regular file: ${sqlitePath}`);
	if (require_openclaw_agent_db.isOperatorAgentDatabaseOpen(sqlitePath)) throw new Error(`Operator agent database ${sqlitePath} is already open in this process. Stop Operator and retry.`);
	if (options.migrateOlderSchema) require_openclaw_agent_db.migrateOperatorAgentDatabaseForMaintenance({
		agentId: target.agentId,
		pathname: sqlitePath
	});
	const compact = require_doctor_sqlite_compact.compactDoctorSqliteFile({
		afterMutation: () => require_openclaw_agent_db.ensureOperatorAgentDatabasePermissions(sqlitePath, {
			agentId: target.agentId,
			path: sqlitePath
		}),
		sqlitePath,
		validateBeforeMutation: (database) => require_openclaw_agent_db.assertOperatorAgentDatabaseForMaintenance(database, {
			agentId: target.agentId,
			pathname: sqlitePath
		})
	});
	return {
		dbSizeAfterBytes: compact.after.dbSizeBytes,
		dbSizeBeforeBytes: compact.before.dbSizeBytes,
		freelistAfterPages: compact.after.freelistPages,
		freelistBeforePages: compact.before.freelistPages,
		pageSizeBytes: compact.before.pageSizeBytes || compact.after.pageSizeBytes,
		reclaimedBytes: compact.reclaimedBytes,
		skipped: false,
		walSizeAfterBytes: compact.after.walSizeBytes,
		walSizeBeforeBytes: compact.before.walSizeBytes
	};
}
function readSessionDatabaseStat(sqlitePath) {
	try {
		return node_fs.default.lstatSync(sqlitePath);
	} catch (error) {
		if (error.code === "ENOENT") return;
		throw error;
	}
}
function readSqliteFileSizes(sqlitePath) {
	return {
		dbSizeBytes: fileSize(sqlitePath),
		walSizeBytes: fileSize(`${sqlitePath}-wal`)
	};
}
function fileSize(filePath) {
	try {
		return node_fs.default.statSync(filePath).size;
	} catch {
		return 0;
	}
}
//#endregion
//#region src/commands/doctor-session-sqlite-migration-run.ts
/** Manifest and restore helpers for doctor-owned session SQLite migrations. */
const SESSION_SQLITE_MIGRATION_RUNS_DIR = "session-sqlite-migration-runs";
const COMPLETED_MIGRATION_RUN_RETENTION = 50;
const AbsolutePathSchema = zod.z.string().min(1).refine((value) => !value.includes("\0") && node_path.default.isAbsolute(value)).transform((value) => node_path.default.resolve(value));
const MigrationMoveSchema = zod.z.object({
	archivePath: AbsolutePathSchema,
	kind: zod.z.enum([
		"legacy-store",
		"transcript",
		"trajectory",
		"unreferenced-jsonl"
	]),
	sessionKey: zod.z.string().optional(),
	sourcePath: AbsolutePathSchema
});
const MigrationIssueSchema = zod.z.object({
	code: zod.z.string().min(1),
	message: zod.z.string(),
	sessionKey: zod.z.string().optional()
});
const RestoreConflictSchema = zod.z.object({
	archivePath: AbsolutePathSchema,
	reason: zod.z.string(),
	sourcePath: AbsolutePathSchema
});
const MigrationTargetSchema = zod.z.object({
	agentId: zod.z.string().min(1),
	completedMoves: zod.z.array(MigrationMoveSchema),
	issues: zod.z.array(MigrationIssueSchema),
	plannedMoves: zod.z.array(MigrationMoveSchema),
	sqlitePath: AbsolutePathSchema,
	storePath: AbsolutePathSchema,
	validationBeforeArchive: zod.z.enum([
		"not_run",
		"passed",
		"failed"
	])
}).superRefine((target, context) => {
	const plannedMoveKeys = /* @__PURE__ */ new Set();
	for (const move of target.plannedMoves) {
		if (!isRestoreMoveWithinTarget(move, target)) context.addIssue({
			code: "custom",
			message: "restore move is outside target paths"
		});
		const moveKey = migrationMoveKey(move);
		if (plannedMoveKeys.has(moveKey)) context.addIssue({
			code: "custom",
			message: "duplicate planned restore move"
		});
		plannedMoveKeys.add(moveKey);
	}
	const completedMoveKeys = /* @__PURE__ */ new Set();
	for (const move of target.completedMoves) {
		const moveKey = migrationMoveKey(move);
		if (!isRestoreMoveWithinTarget(move, target) || !plannedMoveKeys.has(moveKey) || completedMoveKeys.has(moveKey)) context.addIssue({
			code: "custom",
			message: "invalid completed restore move"
		});
		completedMoveKeys.add(moveKey);
	}
});
const MigrationManifestSchema = zod.z.object({
	completedAt: zod.z.string().optional(),
	failedAt: zod.z.string().optional(),
	failureReports: zod.z.object({
		jsonPath: AbsolutePathSchema,
		markdownPath: AbsolutePathSchema
	}).optional(),
	manifestVersion: zod.z.union([zod.z.literal(1), zod.z.literal(2)]),
	openClawVersion: zod.z.string().min(1),
	restore: zod.z.object({
		attemptedAt: zod.z.string().min(1),
		conflicts: zod.z.array(RestoreConflictSchema),
		restoredFiles: zod.z.array(AbsolutePathSchema),
		skippedFiles: zod.z.array(AbsolutePathSchema),
		status: zod.z.enum([
			"restored",
			"partial",
			"conflicts",
			"failed",
			"noop"
		])
	}).optional(),
	runId: zod.z.string().min(1),
	startedAt: zod.z.string().min(1),
	targets: zod.z.array(MigrationTargetSchema)
}).superRefine((manifest, context) => {
	const targetKeys = /* @__PURE__ */ new Set();
	for (const target of manifest.targets) {
		const targetKey = sessionSqliteMigrationTargetKey(target);
		if (targetKeys.has(targetKey)) context.addIssue({
			code: "custom",
			message: "duplicate migration target"
		});
		targetKeys.add(targetKey);
	}
});
function createSessionSqliteMigrationRun(env, targets) {
	for (const target of targets) assertSafeMigrationTargetTopology(target);
	const runId = `session-sqlite-${Date.now()}-${(0, node_crypto.randomUUID)().slice(0, 8)}`;
	const manifestPath = node_path.default.join(resolveSessionSqliteMigrationRunsDir(env), `${runId}.json`);
	const activeRun = {
		manifest: {
			manifestVersion: 2,
			openClawVersion: require_version.VERSION,
			runId,
			startedAt: (/* @__PURE__ */ new Date()).toISOString(),
			targets: targets.map((target) => ({
				...normalizeMigrationTarget(target),
				completedMoves: [],
				issues: [],
				plannedMoves: [],
				validationBeforeArchive: "not_run"
			}))
		},
		manifestPath
	};
	writeSessionSqliteMigrationManifest(activeRun);
	pruneCompletedSessionSqliteMigrationRuns(env);
	return activeRun;
}
function resolveSessionSqliteMigrationRunsDir(env) {
	return node_path.default.join(require_paths.resolveStateDir(env), SESSION_SQLITE_MIGRATION_RUNS_DIR);
}
function writeSessionSqliteMigrationManifest(activeRun) {
	node_fs.default.mkdirSync(node_path.default.dirname(activeRun.manifestPath), {
		recursive: true,
		mode: 448
	});
	_openclaw_fs_safe_atomic.replaceFileAtomicSync({
		filePath: activeRun.manifestPath,
		content: `${JSON.stringify(activeRun.manifest, null, 2)}\n`,
		dirMode: 448,
		mode: 384,
		tempPrefix: node_path.default.basename(activeRun.manifestPath)
	});
}
function updateMigrationManifestTarget(activeRun, target, issues, updates = {}) {
	const manifestTarget = findMigrationManifestTarget(activeRun, target);
	if (!activeRun || !manifestTarget) return;
	manifestTarget.issues = issues.map((issue) => ({ ...issue }));
	if (updates.validationBeforeArchive) manifestTarget.validationBeforeArchive = updates.validationBeforeArchive;
	writeSessionSqliteMigrationManifest(activeRun);
}
function recordPlannedMigrationMove(activeRun, target, move) {
	recordPlannedMigrationMoves(activeRun, target, [move]);
}
function recordPlannedMigrationMoves(activeRun, target, moves) {
	recordMigrationMoves(activeRun, target, "plannedMoves", moves);
}
function recordCompletedMigrationMove(activeRun, target, move) {
	recordCompletedMigrationMoves(activeRun, target, [move]);
}
function recordCompletedMigrationMoves(activeRun, target, moves) {
	recordMigrationMoves(activeRun, target, "completedMoves", moves);
}
function recordMigrationMoves(activeRun, target, listKey, moves) {
	const manifestTarget = findMigrationManifestTarget(activeRun, target);
	if (!activeRun || !manifestTarget || moves.length === 0) return;
	const targetMoves = manifestTarget[listKey];
	const knownMoves = new Set(targetMoves.map(migrationMoveKey));
	let changed = false;
	for (const move of moves) {
		const normalizedMove = normalizeMigrationMove(move);
		const key = migrationMoveKey(normalizedMove);
		if (knownMoves.has(key)) continue;
		knownMoves.add(key);
		targetMoves.push(normalizedMove);
		changed = true;
	}
	if (changed) writeSessionSqliteMigrationManifest(activeRun);
}
function migrationMoveKey(move) {
	return `${move.sourcePath}\u0000${move.archivePath}`;
}
function restoreSessionSqliteMigrationRuns(params) {
	const restoreReport = emptyRestoreReport();
	for (const manifestPath of listSessionSqliteMigrationManifestPaths(params.env)) {
		const manifest = readSessionSqliteMigrationManifest(manifestPath);
		if (!manifest) continue;
		const targetManifests = filterRestoreManifestTargets(manifest, params.trustedTargets);
		if (targetManifests.length === 0) continue;
		const manifestRestoreReport = {
			...emptyRestoreReport(),
			manifestPaths: [manifestPath]
		};
		restoreReport.manifestPaths.push(manifestPath);
		restoreSessionSqliteMigrationManifest(manifest, targetManifests, manifestRestoreReport);
		restoreReport.conflicts.push(...manifestRestoreReport.conflicts);
		restoreReport.restoredFiles.push(...manifestRestoreReport.restoredFiles);
		restoreReport.skippedFiles.push(...manifestRestoreReport.skippedFiles);
		writeSessionSqliteMigrationManifest({
			manifest,
			manifestPath
		});
	}
	return restoreReport;
}
function restoreSessionSqliteMigrationRun(params) {
	const restoreReport = {
		...emptyRestoreReport(),
		manifestPaths: [params.manifestPath]
	};
	const manifest = readSessionSqliteMigrationManifest(params.manifestPath);
	if (!manifest) {
		restoreReport.conflicts.push({
			archivePath: params.manifestPath,
			reason: "manifest is missing or unreadable",
			sourcePath: params.manifestPath
		});
		return restoreReport;
	}
	const targetManifests = filterRestoreManifestTargets(manifest, params.trustedTargets);
	if (targetManifests.length === 0) {
		restoreReport.conflicts.push({
			archivePath: params.manifestPath,
			reason: "manifest does not match a trusted session target",
			sourcePath: params.manifestPath
		});
		return restoreReport;
	}
	restoreSessionSqliteMigrationManifest(manifest, targetManifests, restoreReport);
	writeSessionSqliteMigrationManifest({
		manifest,
		manifestPath: params.manifestPath
	});
	return restoreReport;
}
function findLatestFailedSessionSqliteMigrationManifest(env, trustedTargets) {
	return listSessionSqliteMigrationManifestPaths(env).map((manifestPath) => {
		const manifest = readSessionSqliteMigrationManifest(manifestPath);
		return {
			manifest,
			manifestPath,
			targets: manifest ? filterRestoreManifestTargets(manifest, trustedTargets) : []
		};
	}).filter((item) => item.manifest !== void 0 && isFailedSessionSqliteMigrationManifest(item.manifest) && item.targets.length > 0).toSorted((left, right) => manifestSortTime(right.manifest) - manifestSortTime(left.manifest))[0];
}
function writeSessionSqliteMigrationFailureReports(manifestPath, params) {
	const manifest = readSessionSqliteMigrationManifest(manifestPath);
	const jsonPath = manifestPath.replace(/\.json$/, ".failure.json");
	const markdownPath = manifestPath.replace(/\.json$/, ".failure.md");
	const payload = {
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		manifestPath: sanitizeFailureReportText(shortenFailureReportPath(manifestPath)),
		reason: params.reason,
		recoveryCommand: "operator doctor --session-sqlite recover --github-issue",
		restoreStatus: manifest?.restore?.status ?? "not_attempted",
		runId: manifest?.runId ?? node_path.default.basename(manifestPath, ".json"),
		targets: manifest?.targets.map((target) => ({
			agentId: sanitizeFailureReportText(target.agentId),
			completedMoves: target.completedMoves.length,
			issues: target.issues.map((issue) => ({
				code: issue.code,
				message: sanitizeFailureIssueMessage(issue, target),
				...issue.sessionKey ? { sessionKey: redactSessionKey(issue.sessionKey) } : {}
			})),
			plannedMoves: target.plannedMoves.length,
			sqlitePath: sanitizeFailureReportText(shortenFailureReportPath(target.sqlitePath)),
			storePath: sanitizeFailureReportText(shortenFailureReportPath(target.storePath)),
			validationBeforeArchive: target.validationBeforeArchive
		})) ?? [],
		version: require_version.VERSION
	};
	node_fs.default.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 384 });
	node_fs.default.writeFileSync(markdownPath, renderFailureMarkdown(payload), { mode: 384 });
	if (manifest) {
		manifest.failureReports = {
			jsonPath,
			markdownPath
		};
		writeSessionSqliteMigrationManifest({
			manifest,
			manifestPath
		});
	}
	return {
		jsonPath,
		markdownPath
	};
}
function createSessionSqliteMigrationFailureIssue(manifestPath, trustedTargets) {
	const manifest = readSessionSqliteMigrationManifest(manifestPath);
	if (!manifest) return;
	const title = `Session SQLite migration recovery report (${manifest.runId})`;
	const bodyPath = manifest.failureReports?.markdownPath;
	const targets = trustedTargets ? filterRestoreManifestTargets(manifest, trustedTargets) : manifest.targets;
	const body = [
		"Operator doctor generated this sanitized report from a local session SQLite migration recovery.",
		"",
		renderFailureMarkdown({
			generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			manifestPath: sanitizeFailureReportText(shortenFailureReportPath(manifestPath)),
			reason: "session SQLite migration failed",
			recoveryCommand: "operator doctor --session-sqlite recover --github-issue",
			restoreStatus: manifest.restore?.status ?? "not_attempted",
			runId: manifest.runId,
			targets: targets.map((target) => ({
				agentId: sanitizeFailureReportText(target.agentId),
				completedMoves: target.completedMoves.length,
				issues: target.issues.map((issue) => ({
					code: issue.code,
					message: sanitizeFailureIssueMessage(issue, target)
				})),
				plannedMoves: target.plannedMoves.length,
				sqlitePath: sanitizeFailureReportText(shortenFailureReportPath(target.sqlitePath)),
				storePath: sanitizeFailureReportText(shortenFailureReportPath(target.storePath)),
				validationBeforeArchive: target.validationBeforeArchive
			})),
			version: require_version.VERSION
		})
	].join("\n").slice(0, 2e4);
	return {
		body,
		...bodyPath ? { bodyPath } : {},
		title,
		url: createPrefilledGithubIssueUrl(title, body)
	};
}
function sessionSqliteMigrationTargetKey(target) {
	return `${target.agentId}\u0000${canonicalMigrationFilePath(target.storePath)}`;
}
function findMigrationManifestTarget(activeRun, target) {
	if (!activeRun) return;
	return activeRun.manifest.targets.find((item) => sessionSqliteMigrationTargetKey(item) === sessionSqliteMigrationTargetKey(target));
}
function emptyRestoreReport() {
	return {
		conflicts: [],
		manifestPaths: [],
		restoredFiles: [],
		skippedFiles: []
	};
}
function restoreSessionSqliteMigrationManifest(manifest, targets, restoreReport) {
	for (const target of targets) for (const move of uniqueRestoreMoves(target)) restoreMigrationMove(move, restoreReport);
	manifest.restore = {
		attemptedAt: (/* @__PURE__ */ new Date()).toISOString(),
		conflicts: restoreReport.conflicts,
		restoredFiles: restoreReport.restoredFiles,
		skippedFiles: restoreReport.skippedFiles,
		status: resolveRestoreStatus(restoreReport)
	};
}
function uniqueRestoreMoves(target) {
	const moves = /* @__PURE__ */ new Map();
	for (const move of [...target.completedMoves, ...target.plannedMoves]) moves.set(`${move.sourcePath}\u0000${move.archivePath}`, move);
	return [...moves.values()];
}
function restoreMigrationMove(move, restoreReport) {
	const sourceExists = node_fs.default.existsSync(move.sourcePath);
	const archiveExists = node_fs.default.existsSync(move.archivePath);
	if (!sourceExists && archiveExists) {
		if (!isRegularFileWithoutFollowingSymlinks(move.archivePath)) {
			restoreReport.conflicts.push({
				archivePath: move.archivePath,
				reason: "archive is not a regular file; refusing restore",
				sourcePath: move.sourcePath
			});
			return;
		}
		const sourceDir = node_path.default.dirname(move.sourcePath);
		const archiveDir = node_path.default.dirname(move.archivePath);
		if (hasSymbolicLinkInDirectoryPath(sourceDir) || hasSymbolicLinkInDirectoryPath(archiveDir)) {
			restoreReport.conflicts.push({
				archivePath: move.archivePath,
				reason: "source or archive parent is a symbolic link; refusing restore",
				sourcePath: move.sourcePath
			});
			return;
		}
		node_fs.default.mkdirSync(sourceDir, {
			recursive: true,
			mode: 448
		});
		if (hasSymbolicLinkInDirectoryPath(sourceDir) || hasSymbolicLinkInDirectoryPath(archiveDir)) {
			restoreReport.conflicts.push({
				archivePath: move.archivePath,
				reason: "source or archive parent is a symbolic link; refusing restore",
				sourcePath: move.sourcePath
			});
			return;
		}
		node_fs.default.renameSync(move.archivePath, move.sourcePath);
		restoreReport.restoredFiles.push(move.sourcePath);
		return;
	}
	if (sourceExists && !archiveExists) {
		restoreReport.skippedFiles.push(move.sourcePath);
		return;
	}
	if (sourceExists && archiveExists) {
		restoreReport.conflicts.push({
			archivePath: move.archivePath,
			reason: "source and archive both exist; refusing to overwrite source",
			sourcePath: move.sourcePath
		});
		return;
	}
	restoreReport.conflicts.push({
		archivePath: move.archivePath,
		reason: "source and archive are both missing",
		sourcePath: move.sourcePath
	});
}
function assertSafeSessionSqliteMigrationMove(move, target) {
	if (!isRestoreMoveWithinTarget(move, target)) throw new Error(`Migration source is outside the target sessions directory: ${move.sourcePath}`);
	if (!isRegularFileWithoutFollowingSymlinks(move.sourcePath)) throw new Error(`Migration source is not a regular file: ${move.sourcePath}`);
	assertSafeSessionSqliteMigrationDirectory(node_path.default.dirname(move.sourcePath));
	assertSafeSessionSqliteMigrationDirectory(node_path.default.dirname(move.archivePath));
}
function assertSafeSessionSqliteMigrationDirectory(directoryPath) {
	if (hasSymbolicLinkInDirectoryPath(directoryPath)) throw new Error(`Refusing session SQLite migration through symbolic link: ${directoryPath}`);
}
function isRegularFileWithoutFollowingSymlinks(filePath) {
	try {
		return node_fs.default.lstatSync(filePath).isFile();
	} catch {
		return false;
	}
}
function hasSymbolicLinkInDirectoryPath(directoryPath) {
	const resolvedPath = node_path.default.resolve(directoryPath);
	const root = node_path.default.parse(resolvedPath).root;
	let currentPath = root;
	for (const segment of node_path.default.relative(root, resolvedPath).split(node_path.default.sep).filter(Boolean)) {
		currentPath = node_path.default.join(currentPath, segment);
		try {
			if (node_fs.default.lstatSync(currentPath).isSymbolicLink()) return true;
		} catch (error) {
			if (error.code === "ENOENT") continue;
			return true;
		}
	}
	return false;
}
function resolveRestoreStatus(report) {
	if (report.conflicts.length > 0 && report.restoredFiles.length > 0) return "partial";
	if (report.conflicts.length > 0) return "conflicts";
	if (report.restoredFiles.length > 0) return "restored";
	if (report.skippedFiles.length > 0) return "noop";
	return "noop";
}
function filterRestoreManifestTargets(manifest, trustedTargets) {
	if (trustedTargets.length === 0) return [];
	const trustedSqlitePaths = new Map(trustedTargets.map((target) => [sessionSqliteMigrationTargetKey(target), canonicalMigrationFilePath(target.sqlitePath)]));
	return manifest.targets.filter((target) => trustedSqlitePaths.get(sessionSqliteMigrationTargetKey(target)) === canonicalMigrationFilePath(target.sqlitePath));
}
function listSessionSqliteMigrationManifestPaths(env) {
	const runsDir = resolveSessionSqliteMigrationRunsDir(env);
	let entries;
	try {
		entries = node_fs.default.readdirSync(runsDir);
	} catch {
		return [];
	}
	return entries.filter((entry) => entry.endsWith(".json")).filter((entry) => !entry.endsWith(".failure.json")).map((entry) => node_path.default.join(runsDir, entry)).toSorted((left, right) => right.localeCompare(left));
}
function readSessionSqliteMigrationManifest(manifestPath) {
	try {
		const parsed = JSON.parse(node_fs.default.readFileSync(manifestPath, "utf-8"));
		const result = MigrationManifestSchema.safeParse(parsed);
		if (!result.success) return;
		if (result.data.manifestVersion === 1) {
			if (hasUnsupportedV1DirectorySymlink(result.data)) return;
			const normalized = {
				...result.data,
				targets: result.data.targets.map(normalizeMigrationTargetManifest)
			};
			const normalizedResult = MigrationManifestSchema.safeParse(normalized);
			return normalizedResult.success ? normalizedResult.data : void 0;
		}
		return result.data;
	} catch {
		return;
	}
}
function isRestoreMoveWithinTarget(move, target) {
	const sourcePath = node_path.default.resolve(move.sourcePath);
	const archivePath = node_path.default.resolve(move.archivePath);
	if (sourcePath === archivePath) return false;
	const storePath = node_path.default.resolve(target.storePath);
	const sessionsDir = node_path.default.dirname(storePath);
	const archiveDir = node_path.default.join(node_path.default.dirname(sessionsDir), "session-sqlite-import-archive");
	if (node_path.default.dirname(archivePath) !== archiveDir) return false;
	return move.kind === "legacy-store" ? sourcePath === storePath : node_path.default.dirname(sourcePath) === sessionsDir;
}
function normalizeMigrationTarget(target) {
	return {
		agentId: target.agentId,
		sqlitePath: canonicalMigrationFilePath(target.sqlitePath),
		storePath: canonicalMigrationFilePath(target.storePath)
	};
}
function normalizeMigrationTargetManifest(target) {
	return {
		...target,
		...normalizeMigrationTarget(target),
		completedMoves: target.completedMoves.map(normalizeMigrationMove),
		plannedMoves: target.plannedMoves.map(normalizeMigrationMove)
	};
}
function normalizeMigrationMove(move) {
	return {
		archivePath: canonicalMigrationFilePath(move.archivePath),
		kind: move.kind,
		...move.sessionKey ? { sessionKey: move.sessionKey } : {},
		sourcePath: canonicalMigrationFilePath(move.sourcePath)
	};
}
function hasUnsupportedV1DirectorySymlink(manifest) {
	return manifest.targets.flatMap((target) => [
		node_path.default.dirname(target.sqlitePath),
		node_path.default.dirname(target.storePath),
		...target.plannedMoves.flatMap((move) => [node_path.default.dirname(move.archivePath), node_path.default.dirname(move.sourcePath)]),
		...target.completedMoves.flatMap((move) => [node_path.default.dirname(move.archivePath), node_path.default.dirname(move.sourcePath)])
	]).some((directoryPath) => {
		const resolvedPath = node_path.default.resolve(directoryPath);
		const root = node_path.default.parse(resolvedPath).root;
		let currentPath = root;
		for (const segment of node_path.default.relative(root, resolvedPath).split(node_path.default.sep).filter(Boolean)) {
			currentPath = node_path.default.join(currentPath, segment);
			try {
				if (node_fs.default.lstatSync(currentPath).isSymbolicLink() && node_path.default.dirname(currentPath) !== root) return true;
			} catch (error) {
				if (error.code !== "ENOENT") return true;
			}
		}
		return false;
	});
}
function canonicalMigrationFilePath(filePath) {
	const resolvedPath = node_path.default.resolve(filePath);
	const fileName = node_path.default.basename(resolvedPath);
	const directoryPath = node_path.default.dirname(resolvedPath);
	const suffix = [];
	let currentPath = directoryPath;
	while (true) try {
		return node_path.default.join(node_fs.default.realpathSync.native(currentPath), ...suffix, fileName);
	} catch (error) {
		const code = error.code;
		const parentPath = node_path.default.dirname(currentPath);
		if (code !== "ENOENT" && code !== "ENOTDIR" || parentPath === currentPath) return resolvedPath;
		suffix.unshift(node_path.default.basename(currentPath));
		currentPath = parentPath;
	}
}
function assertSafeMigrationTargetTopology(target) {
	for (const filePath of [target.storePath, target.sqlitePath]) if (isSymbolicLinkPath(filePath) || isSymbolicLinkPath(node_path.default.dirname(filePath))) throw new Error(`Refusing session SQLite migration through symbolic link: ${filePath}`);
	const sessionsDir = node_path.default.dirname(canonicalMigrationFilePath(target.storePath));
	assertSafeSessionSqliteMigrationDirectory(node_path.default.join(node_path.default.dirname(sessionsDir), "session-sqlite-import-archive"));
}
function isSymbolicLinkPath(filePath) {
	try {
		return node_fs.default.lstatSync(filePath).isSymbolicLink();
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
function isFailedSessionSqliteMigrationManifest(manifest) {
	return manifest.completedAt === void 0 || manifest.failedAt !== void 0 || manifest.failureReports !== void 0 || manifest.targets.some((target) => target.issues.length > 0);
}
function manifestSortTime(manifest) {
	const timestamp = manifest.failedAt ?? manifest.completedAt ?? manifest.startedAt;
	const parsed = Date.parse(timestamp);
	return Number.isFinite(parsed) ? parsed : 0;
}
function createPrefilledGithubIssueUrl(title, body) {
	const urlBody = body.length > 6e3 ? `${body.slice(0, 6e3)}\n\n...(truncated for URL; see local failure report for the full sanitized body)` : body;
	return `https://github.com/operator/operator/issues/new?${new URLSearchParams({
		body: urlBody,
		title
	}).toString()}`;
}
function pruneCompletedSessionSqliteMigrationRuns(env) {
	const completed = listSessionSqliteMigrationManifestPaths(env).map((manifestPath) => ({
		manifest: readSessionSqliteMigrationManifest(manifestPath),
		manifestPath
	})).filter((item) => item.manifest !== void 0 && item.manifest.completedAt !== void 0 && !isFailedSessionSqliteMigrationManifest(item.manifest)).toSorted((left, right) => manifestSortTime(right.manifest) - manifestSortTime(left.manifest));
	for (const item of completed.slice(COMPLETED_MIGRATION_RUN_RETENTION)) try {
		node_fs.default.rmSync(item.manifestPath, { force: true });
	} catch {}
}
function renderFailureMarkdown(payload) {
	const lines = [
		"# Session SQLite Migration Failure",
		"",
		`- Run: ${payload.runId}`,
		`- Generated: ${payload.generatedAt}`,
		`- Operator version: ${payload.version}`,
		`- Reason: ${sanitizeFailureReportText(payload.reason)}`,
		`- Restore status: ${payload.restoreStatus}`,
		`- Recovery command: \`${payload.recoveryCommand}\``,
		"",
		"## Targets"
	];
	for (const target of payload.targets) {
		lines.push("", `### ${target.agentId}`, "", `- Store: ${target.storePath}`, `- SQLite: ${target.sqlitePath}`, `- Planned moves: ${target.plannedMoves}`, `- Completed moves: ${target.completedMoves}`, `- Validation before archive: ${target.validationBeforeArchive}`, `- Issues: ${target.issues.length}`);
		for (const issue of target.issues.slice(0, 10)) lines.push(`  - [${issue.code}] ${issue.sessionKey ? `${issue.sessionKey}: ` : ""}${issue.message}`);
	}
	lines.push("");
	return `${lines.join("\n")}\n`;
}
function sanitizeFailureReportText(value) {
	return value.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[redacted-email]").replace(/(api[_-]?key|token|secret|password)[=-][A-Za-z0-9._-]+/gi, "$1-[redacted]").replace(/(api[_-]?key|token|secret|password)=\S+/gi, "$1=[redacted]").slice(0, 500);
}
function shortenFailureReportPath(filePath) {
	const home = process.env.HOME;
	if (home && filePath.startsWith(`${home}${node_path.default.sep}`)) return `~${node_path.default.sep}${node_path.default.relative(home, filePath)}`;
	return filePath;
}
function sanitizeFailureIssueMessage(issue, target) {
	let message = issue.message;
	for (const filePath of [
		target.storePath,
		target.sqlitePath,
		...target.plannedMoves.flatMap((move) => [move.sourcePath, move.archivePath]),
		...target.completedMoves.flatMap((move) => [move.sourcePath, move.archivePath])
	]) message = message.split(filePath).join(shortenFailureReportPath(filePath));
	if (issue.sessionKey) message = message.split(issue.sessionKey).join(redactSessionKey(issue.sessionKey));
	message = redactAbsoluteHomePaths(message);
	return sanitizeFailureReportText(message);
}
function redactSessionKey(sessionKey) {
	if (!sessionKey.trim()) return "[redacted-session-key]";
	return `[redacted-session-key:${(0, node_crypto.randomUUID)().slice(0, 8)}]`;
}
function redactAbsoluteHomePaths(value) {
	const home = process.env.HOME;
	if (!home) return value;
	return value.split(home).join("~");
}
//#endregion
//#region src/commands/doctor-session-sqlite-recover-report.ts
/** Builds doctor reports for session SQLite migration recovery mode. */
/** Restores the latest failed migration run and validates only selected manifest targets. */
async function recoverDoctorSessionSqliteTargets(params) {
	const trustedTargets = resolveRecoverTargets(params.targets);
	const failedRun = findLatestFailedSessionSqliteMigrationManifest(params.env, trustedTargets);
	if (!failedRun) {
		const recoveredCorruptTargets = recoverCorruptSqliteTargets(params.targets);
		if (recoveredCorruptTargets.length > 0) return summarizeRecoverReport(recoveredCorruptTargets);
		return summarizeRecoverReport([createSyntheticRecoverTargetReport(params.env, "No failed session SQLite migration manifest found.")]);
	}
	const restore = restoreSessionSqliteMigrationRun({
		manifestPath: failedRun.manifestPath,
		trustedTargets
	});
	const targetReports = [];
	for (const manifestTarget of failedRun.targets) targetReports.push(await params.validateTarget({
		agentId: manifestTarget.agentId,
		storePath: manifestTarget.storePath
	}));
	const reportTarget = targetReports[0] ?? createSyntheticRecoverTargetReport(params.env, failedRun.manifestPath);
	reportTarget.restore = restore;
	reportTarget.issues.push(...restore.conflicts.map((conflict) => ({
		code: "restore_conflict",
		message: `${conflict.sourcePath}: ${conflict.reason}`
	})));
	const failureReports = writeSessionSqliteMigrationFailureReports(failedRun.manifestPath, { reason: "doctor recover restored and validated a failed session SQLite migration run" });
	const report = summarizeRecoverReport(targetReports.length > 0 ? targetReports : [reportTarget]);
	report.migrationRun = {
		failureReportJsonPath: failureReports.jsonPath,
		failureReportMarkdownPath: failureReports.markdownPath,
		manifestPath: failedRun.manifestPath,
		runId: failedRun.manifest.runId
	};
	report.supportIssue = createSessionSqliteMigrationFailureIssue(failedRun.manifestPath, trustedTargets);
	return report;
}
function recoverCorruptSqliteTargets(targets) {
	return targets.flatMap((target) => {
		const sqlitePath = resolveTargetSqlitePath(target);
		let recoveryFiles;
		try {
			recoveryFiles = inspectSqliteRecoveryFiles(sqlitePath);
		} catch (error) {
			return [createRecoverInspectionFailureTargetReport(target, sqlitePath, error)];
		}
		if (recoveryFiles.existing.length === 0) return [];
		if (!recoveryFiles.existing.includes(sqlitePath)) return [recoverCorruptSqliteTarget(target, sqlitePath, /* @__PURE__ */ new Error(`SQLite sidecars exist without their main database: ${sqlitePath}`))];
		const inspection = inspectSqliteForRecovery(sqlitePath, recoveryFiles.existing);
		if (inspection.ok) return [];
		if (!isSqliteCorruptionError(inspection.error)) return [createRecoverInspectionFailureTargetReport(target, sqlitePath, inspection.error)];
		return [recoverCorruptSqliteTarget(target, sqlitePath, inspection.error)];
	});
}
function inspectSqliteForRecovery(sqlitePath, sourcePaths) {
	let inspectionDir;
	let database;
	let inspectionError;
	try {
		const sqlite = require_state_migrations_cron_run_logs.requireNodeSqlite();
		inspectionDir = node_fs.default.mkdtempSync(node_path.default.join(node_os.default.tmpdir(), "operator-sqlite-recovery-"));
		const inspectionPath = node_path.default.join(inspectionDir, node_path.default.basename(sqlitePath));
		for (const sourcePath of sourcePaths) {
			const inspectionFilePath = `${inspectionPath}${sourcePath.slice(sqlitePath.length)}`;
			node_fs.default.copyFileSync(sourcePath, inspectionFilePath, node_fs.default.constants.COPYFILE_EXCL);
			node_fs.default.chmodSync(inspectionFilePath, 384);
		}
		database = new sqlite.DatabaseSync(inspectionPath);
		database.exec(`PRAGMA busy_timeout = ${require_openclaw_state_db.OPERATOR_SQLITE_BUSY_TIMEOUT_MS};`);
		database.exec("PRAGMA trusted_schema = OFF;");
		require_state_migrations_cron_run_logs.assertSqliteIntegrity(database, inspectionPath);
	} catch (error) {
		inspectionError = error;
	}
	try {
		database?.close();
	} catch (error) {
		inspectionError ??= error;
	}
	try {
		if (inspectionDir) node_fs.default.rmSync(inspectionDir, {
			force: true,
			recursive: true
		});
	} catch (error) {
		inspectionError ??= error;
	}
	return inspectionError === void 0 ? { ok: true } : {
		error: inspectionError,
		ok: false
	};
}
function recoverCorruptSqliteTarget(target, sqlitePath, error) {
	const report = createEmptyRecoverTargetReport(target, sqlitePath);
	try {
		report.corruptRecovery = moveCorruptSqliteFilesAside(sqlitePath);
	} catch (moveError) {
		report.issues.push({
			code: "sqlite_corrupt_recovery_failed",
			message: `${sqlitePath}: ${String(moveError)}; original error: ${String(error)}`
		});
	}
	return report;
}
function createRecoverInspectionFailureTargetReport(target, sqlitePath, error) {
	const report = createEmptyRecoverTargetReport(target, sqlitePath);
	report.issues.push({
		code: "sqlite_recovery_inspect_failed",
		message: `${sqlitePath}: ${String(error)}`
	});
	return report;
}
function moveCorruptSqliteFilesAside(sqlitePath) {
	const recoveryFiles = inspectSqliteRecoveryFiles(sqlitePath);
	const moves = planCorruptSqliteMoves(recoveryFiles.existing);
	const completed = [];
	try {
		for (const move of moves.toSorted((left, right) => {
			if (left.sourcePath === sqlitePath) return 1;
			if (right.sourcePath === sqlitePath) return -1;
			return left.sourcePath.localeCompare(right.sourcePath);
		})) {
			node_fs.default.renameSync(move.sourcePath, move.destinationPath);
			completed.push(move);
		}
	} catch (error) {
		const rollbackErrors = [];
		for (const move of completed.toReversed()) try {
			if (pathExists(move.sourcePath)) throw new Error(`rollback source was recreated: ${move.sourcePath}`, { cause: error });
			node_fs.default.renameSync(move.destinationPath, move.sourcePath);
		} catch (rollbackError) {
			rollbackErrors.push(rollbackError);
		}
		if (rollbackErrors.length > 0) {
			const rollbackDetails = rollbackErrors.map((rollbackError) => String(rollbackError)).join("; ");
			throw new Error(`Could not move corrupt SQLite file set aside or restore it: ${sqlitePath}; rollback failures: ${rollbackDetails}`, { cause: error });
		}
		throw error;
	}
	return {
		movedFiles: moves.map((move) => move.destinationPath),
		skippedFiles: recoveryFiles.missing
	};
}
function inspectSqliteRecoveryFiles(sqlitePath) {
	const existing = [];
	const missing = [];
	for (const candidate of require_state_migrations_cron_run_logs.resolveSqliteDatabaseFilePaths(sqlitePath)) try {
		if (!node_fs.default.lstatSync(candidate).isFile()) throw new Error(`SQLite recovery path is not a regular file: ${candidate}`);
		existing.push(candidate);
	} catch (error) {
		if (error.code === "ENOENT") {
			missing.push(candidate);
			continue;
		}
		throw error;
	}
	return {
		existing,
		missing
	};
}
function planCorruptSqliteMoves(sourcePaths) {
	const timestampSuffix = `.corrupt-${Date.now()}`;
	for (let attempt = 0; attempt < 100; attempt += 1) {
		const suffix = attempt === 0 ? timestampSuffix : `${timestampSuffix}.${attempt}`;
		const moves = sourcePaths.map((sourcePath) => ({
			destinationPath: `${sourcePath}${suffix}`,
			sourcePath
		}));
		if (moves.every((move) => !pathExists(move.destinationPath))) return moves;
	}
	throw new Error(`Could not choose recovery paths for ${sourcePaths[0] ?? "SQLite files"}`);
}
function pathExists(filePath) {
	try {
		node_fs.default.lstatSync(filePath);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
function isSqliteCorruptionError(error) {
	const code = error && typeof error === "object" ? error.code : void 0;
	if (code === "SQLITE_CORRUPT" || code === "SQLITE_NOTADB") return true;
	const message = String(error).toLowerCase();
	return message.includes("database disk image is malformed") || message.includes("not a database") || message.includes("sqlite quick_check failed") || message.includes("sqlite integrity_check failed") || message.includes("sqlite foreign_key_check failed");
}
function resolveRecoverTargets(targets) {
	return targets.map((target) => ({
		...target,
		sqlitePath: resolveTargetSqlitePath(target)
	}));
}
function createSyntheticRecoverTargetReport(env, message) {
	return {
		agentId: "recover",
		archivedTranscriptFiles: [],
		archivedUnreferencedJsonlFiles: [],
		importedEntries: 0,
		importedTranscriptEvents: 0,
		issues: [{
			code: "recover_manifest_missing",
			message
		}],
		legacyEntries: 0,
		referencedTranscriptFiles: 0,
		sqliteEntries: 0,
		sqlitePath: "",
		storePath: resolveSessionSqliteMigrationRunsDir(env),
		unreferencedJsonlFiles: [],
		validatedEntries: 0,
		validatedTranscriptEvents: 0
	};
}
function createEmptyRecoverTargetReport(target, sqlitePath) {
	return {
		agentId: target.agentId,
		archivedTranscriptFiles: [],
		archivedUnreferencedJsonlFiles: [],
		importedEntries: 0,
		importedTranscriptEvents: 0,
		issues: [],
		legacyEntries: 0,
		referencedTranscriptFiles: 0,
		sqliteEntries: 0,
		sqlitePath,
		storePath: target.storePath,
		unreferencedJsonlFiles: [],
		validatedEntries: 0,
		validatedTranscriptEvents: 0
	};
}
function summarizeRecoverReport(targets) {
	return {
		mode: "recover",
		targets,
		totals: {
			archivedTranscriptFiles: 0,
			archivedUnreferencedJsonlFiles: 0,
			importedEntries: 0,
			importedTranscriptEvents: 0,
			issues: targets.reduce((total, target) => total + target.issues.length, 0),
			legacyEntries: targets.reduce((total, target) => total + target.legacyEntries, 0),
			sqliteEntries: targets.reduce((total, target) => total + target.sqliteEntries, 0),
			targets: targets.length,
			unreferencedJsonlFiles: targets.reduce((total, target) => total + target.unreferencedJsonlFiles.length, 0),
			validatedEntries: targets.reduce((total, target) => total + target.validatedEntries, 0),
			validatedTranscriptEvents: targets.reduce((total, target) => total + target.validatedTranscriptEvents, 0)
		}
	};
}
//#endregion
//#region src/commands/doctor-session-sqlite-restore-report.ts
async function restoreDoctorSessionSqliteTargets(params) {
	const targetReports = params.targets.map((target) => createEmptyTargetReport(target));
	const trustedTargets = params.targets.map((target) => ({
		...target,
		sqlitePath: resolveTargetSqlitePath(target)
	}));
	const restore = restoreSessionSqliteMigrationRuns({
		env: params.env,
		trustedTargets
	});
	const reportTarget = targetReports[0] ?? createSyntheticRestoreTargetReport(params.env, restore.manifestPaths[0] ?? resolveSessionSqliteMigrationRunsDir(params.env));
	reportTarget.restore = restore;
	reportTarget.issues.push(...restore.conflicts.map((conflict) => ({
		code: "restore_conflict",
		message: `${conflict.sourcePath}: ${conflict.reason}`
	})));
	return summarizeRestoreReport(targetReports.length > 0 ? targetReports : [reportTarget]);
}
function createEmptyTargetReport(target) {
	return {
		agentId: target.agentId,
		archivedTranscriptFiles: [],
		archivedUnreferencedJsonlFiles: [],
		importedEntries: 0,
		importedTranscriptEvents: 0,
		issues: [],
		legacyEntries: 0,
		referencedTranscriptFiles: 0,
		sqliteEntries: readSqliteEntryCount(target),
		sqlitePath: resolveTargetSqlitePath(target),
		storePath: target.storePath,
		unreferencedJsonlFiles: [],
		validatedEntries: 0,
		validatedTranscriptEvents: 0
	};
}
function createSyntheticRestoreTargetReport(env, manifestPath) {
	return {
		agentId: "restore",
		archivedTranscriptFiles: [],
		archivedUnreferencedJsonlFiles: [],
		importedEntries: 0,
		importedTranscriptEvents: 0,
		issues: [],
		legacyEntries: 0,
		referencedTranscriptFiles: 0,
		sqliteEntries: 0,
		sqlitePath: "",
		storePath: manifestPath || resolveSessionSqliteMigrationRunsDir(env),
		unreferencedJsonlFiles: [],
		validatedEntries: 0,
		validatedTranscriptEvents: 0
	};
}
function summarizeRestoreReport(targets) {
	return {
		mode: "restore",
		targets,
		totals: {
			archivedTranscriptFiles: 0,
			archivedUnreferencedJsonlFiles: 0,
			importedEntries: 0,
			importedTranscriptEvents: 0,
			issues: targets.reduce((total, target) => total + target.issues.length, 0),
			legacyEntries: 0,
			sqliteEntries: targets.reduce((total, target) => total + target.sqliteEntries, 0),
			targets: targets.length,
			unreferencedJsonlFiles: 0,
			validatedEntries: 0,
			validatedTranscriptEvents: 0
		}
	};
}
//#endregion
//#region src/commands/doctor-session-sqlite.ts
const WARNING_ISSUE_CODES = /* @__PURE__ */ new Set([
	"transcript_missing",
	"transcript_archive_failed",
	"transcript_malformed",
	"unreferenced_jsonl_archive_failed"
]);
/** Runs the targeted doctor SQLite session migration/inspection submode. */
async function runDoctorSessionSqlite(options) {
	const env = options.env ?? process.env;
	const cfg = resolveDoctorSessionSqliteConfig(options);
	const targets = resolveDoctorSessionSqliteTargets({
		allAgents: options.allAgents,
		agent: options.agent,
		cfg,
		env,
		mode: options.mode,
		store: options.store
	});
	if (options.mode === "restore") return restoreDoctorSessionSqliteTargets({
		env,
		targets
	});
	if (options.mode === "recover") return recoverDoctorSessionSqliteTargets({
		env,
		options,
		targets,
		validateTarget: (target) => inspectOrMigrateTarget({
			cfg,
			env,
			mode: "validate",
			target
		})
	});
	const activeRun = options.mode === "import" && targets.length > 0 ? createSessionSqliteMigrationRun(env, targets.map(createMigrationTargetInput)) : void 0;
	const fullyCoveredStorePaths = options.mode === "import" ? resolveFullyCoveredLegacyStorePaths(cfg, targets) : /* @__PURE__ */ new Set();
	const reports = [];
	for (const target of targets) reports.push(await inspectOrMigrateTarget({
		activeRun,
		archiveImportedArtifacts: fullyCoveredStorePaths.has(node_path.default.resolve(target.storePath)),
		cfg,
		env,
		mode: options.mode,
		target
	}));
	if (activeRun) {
		archiveImportedLegacySessionStores(targets, reports, activeRun, fullyCoveredStorePaths);
		const hasIssues = reports.some((report) => report.issues.length > 0);
		activeRun.manifest.completedAt = (/* @__PURE__ */ new Date()).toISOString();
		if (hasIssues) {
			activeRun.manifest.failedAt = activeRun.manifest.completedAt;
			const failureReports = writeSessionSqliteMigrationFailureReports(activeRun.manifestPath, { reason: "doctor import reported session SQLite migration issues" });
			activeRun.manifest.failureReports = failureReports;
		}
		writeSessionSqliteMigrationManifest(activeRun);
	}
	return summarizeDoctorSessionSqliteReport(options.mode, reports, activeRun);
}
function resolveDoctorSessionSqliteConfig(options) {
	if (options.cfg) return options.cfg;
	return options.store ? {} : require_io.getRuntimeConfig();
}
function resolveDoctorSessionSqliteTargets(params) {
	if (params.store) return filterLegacySessionStoreTargets(require_targets.resolveSessionStoreTargets(params.cfg, { store: params.store }, { env: params.env }), params.mode);
	if (params.mode === "restore" || params.mode === "recover") {
		const candidates = require_targets.resolveAllAgentSessionStoreCandidateTargetsSync(params.cfg, { env: params.env });
		if (!params.agent) return candidates;
		const requestedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agent);
		return candidates.filter((target) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(target.agentId) === requestedAgentId);
	}
	if (params.agent) return filterLegacySessionStoreTargets(require_targets.resolveAgentSessionStoreTargetsSync(params.cfg, params.agent, { env: params.env }), params.mode);
	if (params.allAgents) return filterLegacySessionStoreTargets(require_targets.resolveAllAgentSessionStoreTargetsSync(params.cfg, { env: params.env }), params.mode);
	return require_targets.resolveSessionStoreTargets(params.cfg, {}, { env: params.env }).filter((target) => node_fs.default.existsSync(target.storePath));
}
function filterLegacySessionStoreTargets(targets, mode) {
	if (mode === "inspect" || mode === "compact" || mode === "restore" || mode === "recover") return targets;
	return targets.filter((target) => node_fs.default.existsSync(target.storePath));
}
async function inspectOrMigrateTarget(params) {
	const issues = [];
	const allRecords = readLegacySessionRecords(params.target, issues, { allowMissingStore: params.mode === "inspect" || params.mode === "compact" });
	const records = shouldFilterLegacySessionRecordsByTarget(params.target) ? allRecords.filter((record) => isLegacySessionRecordOwnedByTarget(params.cfg, params.target, record.sessionKey)) : allRecords;
	const referencedTranscriptFiles = new Set(allRecords.flatMap((record) => record.transcriptPath ? [record.transcriptPath] : []));
	const report = {
		agentId: params.target.agentId,
		archivedLegacyStoreFiles: [],
		archivedTranscriptFiles: [],
		archivedUnreferencedJsonlFiles: [],
		importedEntries: 0,
		importedTranscriptEvents: 0,
		issues,
		legacyEntries: records.length,
		referencedTranscriptFiles: referencedTranscriptFiles.size,
		sqliteEntries: readSqliteEntryCount(params.target),
		sqlitePath: resolveTargetSqlitePath(params.target),
		storePath: params.target.storePath,
		unreferencedJsonlFiles: listUnreferencedJsonlFiles(params.target.storePath, [...referencedTranscriptFiles]),
		validatedEntries: 0,
		validatedTranscriptEvents: 0
	};
	if (params.mode === "inspect") {
		report.sqliteEntries = readSqliteEntryCount(params.target);
		appendSqliteDbStats(params.target, report);
		appendActiveSqliteTranscriptFileIssues(params.target, report);
		return report;
	}
	if (params.mode === "compact") {
		compactSqliteDatabase(params.target, report);
		report.sqliteEntries = readSqliteEntryCount(params.target);
		appendSqliteDbStats(params.target, report);
		return report;
	}
	for (const record of records) {
		if (params.mode === "dry-run") {
			countLegacyTranscript(record, report);
			continue;
		}
		if (params.mode === "import") {
			await importLegacySessionRecord(params.target, record, report);
			continue;
		}
		validateLegacySessionRecord(params.target, record, report);
	}
	if (params.mode === "import" && blockingIssueCount(report) === 0) {
		const validationPassed = validateImportedTargetBeforeArchive(params.target, records, report);
		updateMigrationManifestTarget(params.activeRun, createMigrationTargetInput(params.target), report.issues, { validationBeforeArchive: validationPassed ? "passed" : "failed" });
		if (validationPassed && params.archiveImportedArtifacts !== false) {
			archiveImportedTranscripts(params.target, records, report, params.activeRun);
			archiveUnreferencedJsonlFiles(params.target, report, [...referencedTranscriptFiles], params.activeRun);
		}
		if (validationPassed) compactSqliteDatabase(params.target, report, {
			closeImportedHandle: true,
			migrateOlderSchema: true
		});
	}
	report.unreferencedJsonlFiles = listUnreferencedJsonlFiles(params.target.storePath, [...referencedTranscriptFiles]);
	report.sqliteEntries = readSqliteEntryCount(params.target);
	appendActiveSqliteTranscriptFileIssues(params.target, report);
	updateMigrationManifestTarget(params.activeRun, createMigrationTargetInput(params.target), report.issues);
	return report;
}
function resolveFullyCoveredLegacyStorePaths(cfg, targets) {
	const covered = /* @__PURE__ */ new Set();
	const targetsByStore = /* @__PURE__ */ new Map();
	for (const target of targets) {
		const storePath = node_path.default.resolve(target.storePath);
		targetsByStore.set(storePath, [...targetsByStore.get(storePath) ?? [], target]);
	}
	for (const [storePath, storeTargets] of targetsByStore) {
		const [firstStoreTarget] = storeTargets;
		if (!firstStoreTarget) continue;
		const issues = [];
		const coversEveryRecord = readLegacySessionRecords(firstStoreTarget, issues).every((record) => storeTargets.some((target) => !shouldFilterLegacySessionRecordsByTarget(target) || isLegacySessionRecordOwnedByTarget(cfg, target, record.sessionKey)));
		if (issues.length === 0 && coversEveryRecord) covered.add(storePath);
	}
	return covered;
}
function readLegacySessionRecords(target, issues, options = {}) {
	let parsed;
	try {
		parsed = JSON.parse(node_fs.default.readFileSync(target.storePath, "utf-8"));
	} catch (err) {
		if (options.allowMissingStore === true && err?.code === "ENOENT") return [];
		issues.push({
			code: "store_unreadable",
			message: `${target.storePath}: ${String(err)}`
		});
		return [];
	}
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) {
		issues.push({
			code: "store_not_object",
			message: `${target.storePath} does not contain an object session store.`
		});
		return [];
	}
	const records = [];
	for (const [sessionKey, value] of Object.entries(parsed)) {
		if (!isSessionEntry(value)) {
			issues.push({
				code: "entry_invalid",
				message: "Session entry is missing a valid sessionId.",
				sessionKey
			});
			continue;
		}
		records.push({
			entry: require_store.normalizeSessionEntryDelivery(value),
			sessionKey,
			transcriptPath: resolveLegacyTranscriptPath(target, value)
		});
	}
	return records;
}
function isLegacySessionRecordOwnedByTarget(cfg, target, sessionKey) {
	const ownerAgentId = require_session_accessor.resolveStoredSessionOwnerAgentId({
		cfg,
		agentId: target.agentId,
		sessionKey
	});
	return ownerAgentId ? ownerAgentId === target.agentId : target.agentId === require_agent_scope_config.resolveDefaultAgentId(cfg);
}
function shouldFilterLegacySessionRecordsByTarget(target) {
	return !require_targets.resolveSqliteTargetFromSessionStorePath(target.storePath).agentId;
}
function resolveLegacyTranscriptPath(target, entry) {
	if (require_sqlite_marker.parseSqliteSessionFileMarker(entry.sessionFile)) return;
	const defaultPath = require_paths$1.resolveSessionFilePath(entry.sessionId, entry, {
		agentId: target.agentId,
		sessionsDir: node_path.default.dirname(target.storePath)
	});
	if (node_fs.default.existsSync(defaultPath)) return defaultPath;
	return entry.sessionFile?.trim() ? defaultPath : void 0;
}
function countLegacyTranscript(record, report) {
	const result = countTranscriptEvents(record);
	if (result.status === "missing") {
		report.issues.push({
			code: "transcript_missing",
			message: `Transcript file is missing: ${record.transcriptPath}`,
			sessionKey: record.sessionKey
		});
		return;
	}
	if (result.status === "malformed") {
		report.issues.push({
			code: "transcript_malformed",
			message: result.message,
			sessionKey: record.sessionKey
		});
		return;
	}
	report.validatedEntries += 1;
	report.validatedTranscriptEvents += result.events;
}
function blockingIssueCount(report) {
	return report.issues.filter((issue) => !WARNING_ISSUE_CODES.has(issue.code)).length;
}
async function importLegacySessionRecord(target, record, report) {
	const result = countTranscriptEvents(record);
	const transcriptMtimeMs = readLegacyTranscriptMtimeMs(record);
	if (result.status === "missing") {
		if (markAlreadyMigratedTranscript(target, record, report)) return;
		const imported = await require_session_accessor.importSqliteSessionRows({
			agentId: target.agentId,
			entry: record.entry,
			sessionKey: record.sessionKey,
			storePath: target.storePath
		});
		report.importedEntries += 1;
		report.importedTranscriptEvents += imported.transcriptEvents;
		report.issues.push({
			code: "transcript_missing",
			message: `Transcript file is missing: ${record.transcriptPath}`,
			sessionKey: record.sessionKey
		});
		return;
	} else if (result.status === "malformed") {
		const imported = await require_session_accessor.importSqliteSessionRows({
			agentId: target.agentId,
			entry: record.entry,
			sessionKey: record.sessionKey,
			storePath: target.storePath,
			...record.transcriptPath ? { readTranscriptEvents: createTranscriptEventPrefixReader(record.transcriptPath) } : {},
			...transcriptMtimeMs !== void 0 ? { transcriptMtimeMs } : {}
		});
		report.importedEntries += 1;
		report.importedTranscriptEvents += imported.transcriptEvents;
		report.issues.push({
			code: "transcript_malformed",
			message: result.message,
			sessionKey: record.sessionKey
		});
		return;
	}
	const imported = await require_session_accessor.importSqliteSessionRows({
		agentId: target.agentId,
		entry: record.entry,
		sessionKey: record.sessionKey,
		storePath: target.storePath,
		...record.transcriptPath && result.status === "ok" ? { readTranscriptEvents: createTranscriptEventReader(record.transcriptPath) } : {},
		...transcriptMtimeMs !== void 0 ? { transcriptMtimeMs } : {}
	});
	report.importedEntries += 1;
	report.importedTranscriptEvents += imported.transcriptEvents;
}
function markAlreadyMigratedTranscript(target, record, report) {
	const migratedEvents = countAlreadyMigratedTranscriptEventsForImport(target, record);
	if (migratedEvents === void 0) return false;
	report.validatedEntries += 1;
	report.validatedTranscriptEvents += migratedEvents;
	return true;
}
function validateImportedTargetBeforeArchive(target, records, report) {
	const issueCountBeforeValidation = report.issues.length;
	for (const record of records) validateImportedRecordBeforeArchive(target, record, report);
	return report.issues.length === issueCountBeforeValidation;
}
function validateImportedRecordBeforeArchive(target, record, report) {
	const normalizedKey = require_store.normalizeStoreSessionKey(record.sessionKey);
	const sqliteEntry = require_session_accessor.loadExactSqliteSessionEntry({
		agentId: target.agentId,
		sessionKey: normalizedKey,
		storePath: target.storePath
	});
	if (!sqliteEntry) {
		report.issues.push({
			code: "sqlite_entry_missing",
			message: `SQLite entry is missing for ${normalizedKey}.`,
			sessionKey: record.sessionKey
		});
		return;
	}
	if (sqliteEntry.entry.sessionId !== record.entry.sessionId) {
		report.issues.push({
			code: "sqlite_entry_mismatch",
			message: `SQLite sessionId ${sqliteEntry.entry.sessionId} does not match ${record.entry.sessionId}.`,
			sessionKey: record.sessionKey
		});
		return;
	}
	const result = countTranscriptEvents(record);
	if (result.status === "missing") return;
	if (result.status !== "ok") {
		if (!hasSessionIssue(report, "transcript_malformed", record.sessionKey)) report.issues.push({
			code: "transcript_malformed",
			message: result.message,
			sessionKey: record.sessionKey
		});
		return;
	}
	const sqliteEvents = readOnlySqliteTranscriptEventCount(target, record.entry.sessionId);
	if (!sqliteEvents.ok) {
		report.issues.push({
			code: "sqlite_read_failed",
			message: `SQLite transcript count read failed: ${String(sqliteEvents.error)}`,
			sessionKey: record.sessionKey
		});
		return;
	}
	if (sqliteEvents.events < result.events) report.issues.push({
		code: "sqlite_transcript_count_mismatch",
		message: `SQLite transcript has ${sqliteEvents.events} events; source has ${result.events}.`,
		sessionKey: record.sessionKey
	});
}
function archiveImportedTranscript(target, record, report, activeRun) {
	if (!record.transcriptPath || !node_fs.default.existsSync(record.transcriptPath)) return;
	try {
		report.archivedTranscriptFiles.push(...moveImportedTranscriptArtifactsToArchive(target, record.sessionKey, record.transcriptPath, activeRun));
	} catch (err) {
		report.issues.push({
			code: "transcript_archive_failed",
			message: `${record.transcriptPath}: ${String(err)}`,
			sessionKey: record.sessionKey
		});
	}
}
function archiveImportedTranscripts(target, records, report, activeRun) {
	const archivedTranscriptPaths = /* @__PURE__ */ new Set();
	for (const record of records) {
		if (!record.transcriptPath || archivedTranscriptPaths.has(record.transcriptPath)) continue;
		archiveImportedTranscript(target, record, report, activeRun);
		archivedTranscriptPaths.add(record.transcriptPath);
	}
}
function archiveUnreferencedJsonlFiles(target, report, referencedPaths, activeRun) {
	const reservedArchivePaths = /* @__PURE__ */ new Set();
	const plannedMoves = listUnreferencedJsonlFiles(target.storePath, referencedPaths).flatMap((sourcePath) => {
		try {
			const move = planSessionJsonlArchiveMove({
				archiveKey: "archive-tier",
				baseNameRaw: node_path.default.basename(sourcePath),
				kind: "unreferenced-jsonl",
				reservedArchivePaths,
				sourcePathRaw: sourcePath,
				target
			});
			reservedArchivePaths.add(move.archivePath);
			return [move];
		} catch (err) {
			report.issues.push({
				code: "unreferenced_jsonl_archive_failed",
				message: `${sourcePath}: ${String(err)}`
			});
			return [];
		}
	});
	recordPlannedMigrationMoves(activeRun, createMigrationTargetInput(target), plannedMoves);
	const completedMoves = [];
	const migrationTarget = createMigrationTargetInput(target);
	for (const move of plannedMoves) try {
		assertSafeSessionSqliteMigrationMove(move, migrationTarget);
		node_fs.default.renameSync(move.sourcePath, move.archivePath);
		report.archivedUnreferencedJsonlFiles.push(move.archivePath);
		completedMoves.push(move);
	} catch (err) {
		report.issues.push({
			code: "unreferenced_jsonl_archive_failed",
			message: `${move.sourcePath}: ${String(err)}`
		});
	}
	recordCompletedMigrationMoves(activeRun, createMigrationTargetInput(target), completedMoves);
}
function archiveImportedLegacySessionStores(targets, reports, activeRun, fullyCoveredStorePaths) {
	const byStore = /* @__PURE__ */ new Map();
	for (const target of targets) {
		const report = reports.find((candidate) => candidate.agentId === target.agentId && node_path.default.resolve(candidate.storePath) === node_path.default.resolve(target.storePath));
		if (!report) continue;
		const key = node_path.default.resolve(target.storePath);
		byStore.set(key, [...byStore.get(key) ?? [], {
			report,
			target
		}]);
	}
	for (const [storePath, entries] of byStore) {
		if (!fullyCoveredStorePaths.has(storePath)) continue;
		if (entries.some((entry) => blockingIssueCount(entry.report) > 0)) continue;
		const [firstEntry] = entries;
		if (!firstEntry) continue;
		const archivePath = archiveLegacySessionStore(firstEntry.target, firstEntry.report, activeRun);
		if (!archivePath) continue;
		for (const entry of entries.slice(1)) recordLegacyStoreMoveForTarget(entry.target, archivePath, activeRun);
	}
}
function archiveLegacySessionStore(target, report, activeRun) {
	if (!node_fs.default.existsSync(target.storePath)) return;
	try {
		const archivePath = moveSessionJsonlToArchive({
			activeRun,
			archiveKey: "legacy-store",
			baseNameRaw: node_path.default.basename(target.storePath),
			kind: "legacy-store",
			sourcePathRaw: target.storePath,
			target
		});
		(report.archivedLegacyStoreFiles ??= []).push(archivePath);
		return archivePath;
	} catch (err) {
		report.issues.push({
			code: "legacy_store_archive_failed",
			message: `${target.storePath}: ${String(err)}`
		});
		return;
	}
}
function recordLegacyStoreMoveForTarget(target, archivePath, activeRun) {
	const move = {
		archivePath,
		kind: "legacy-store",
		sourcePath: node_path.default.resolve(target.storePath)
	};
	recordPlannedMigrationMove(activeRun, createMigrationTargetInput(target), move);
	recordCompletedMigrationMove(activeRun, createMigrationTargetInput(target), move);
}
function validateLegacySessionRecord(target, record, report) {
	const normalizedKey = require_store.normalizeStoreSessionKey(record.sessionKey);
	const sqliteEntry = readOnlySqliteExactSessionEntry(target, normalizedKey);
	if (!sqliteEntry.ok) {
		report.issues.push({
			code: "sqlite_read_failed",
			message: `SQLite session entry read failed: ${String(sqliteEntry.error)}`,
			sessionKey: record.sessionKey
		});
		return;
	}
	if (!sqliteEntry.entry) {
		report.issues.push({
			code: "sqlite_entry_missing",
			message: `SQLite entry is missing for ${normalizedKey}.`,
			sessionKey: record.sessionKey
		});
		return;
	}
	if (sqliteEntry.entry.entry.sessionId !== record.entry.sessionId) {
		report.issues.push({
			code: "sqlite_entry_mismatch",
			message: `SQLite sessionId ${sqliteEntry.entry.entry.sessionId} does not match ${record.entry.sessionId}.`,
			sessionKey: record.sessionKey
		});
		return;
	}
	report.validatedEntries += 1;
	validateTranscriptEventCount(target, record, report);
}
function validateTranscriptEventCount(target, record, report) {
	const result = countTranscriptEvents(record);
	if (result.status === "missing") {
		const migratedEvents = countAlreadyMigratedTranscriptEventsForValidate(target, record);
		if (migratedEvents !== void 0) report.validatedTranscriptEvents += migratedEvents;
		return;
	}
	if (result.status !== "ok") {
		if (!hasSessionIssue(report, "transcript_malformed", record.sessionKey)) report.issues.push({
			code: "transcript_malformed",
			message: result.message,
			sessionKey: record.sessionKey
		});
		return;
	}
	const sqliteEvents = readOnlySqliteTranscriptEventCount(target, record.entry.sessionId);
	if (!sqliteEvents.ok) {
		report.issues.push({
			code: "sqlite_read_failed",
			message: `SQLite transcript count read failed: ${String(sqliteEvents.error)}`,
			sessionKey: record.sessionKey
		});
		return;
	}
	if (sqliteEvents.events !== result.events) {
		report.issues.push({
			code: "sqlite_transcript_count_mismatch",
			message: `SQLite transcript has ${sqliteEvents.events} events; source has ${result.events}.`,
			sessionKey: record.sessionKey
		});
		return;
	}
	report.validatedTranscriptEvents += sqliteEvents.events;
}
function hasSessionIssue(report, code, sessionKey) {
	return report.issues.some((issue) => issue.code === code && issue.sessionKey === sessionKey);
}
function countAlreadyMigratedTranscriptEventsForImport(target, record) {
	const normalizedKey = require_store.normalizeStoreSessionKey(record.sessionKey);
	if (require_session_accessor.loadExactSqliteSessionEntry({
		agentId: target.agentId,
		sessionKey: normalizedKey,
		storePath: target.storePath
	})?.entry.sessionId !== record.entry.sessionId) return;
	const eventCount = readOnlySqliteTranscriptEventCount(target, record.entry.sessionId);
	return eventCount.ok ? eventCount.events : void 0;
}
function countAlreadyMigratedTranscriptEventsForValidate(target, record) {
	const sqliteEntry = readOnlySqliteExactSessionEntry(target, require_store.normalizeStoreSessionKey(record.sessionKey));
	if (!sqliteEntry.ok || sqliteEntry.entry?.entry.sessionId !== record.entry.sessionId) return;
	const eventCount = readOnlySqliteTranscriptEventCount(target, record.entry.sessionId);
	return eventCount.ok ? eventCount.events : void 0;
}
function countTranscriptEvents(record) {
	return countTranscriptEventsForPath(record.transcriptPath);
}
function readLegacyTranscriptMtimeMs(record) {
	if (!record.transcriptPath) return;
	try {
		const mtimeMs = Math.floor(node_fs.default.statSync(record.transcriptPath).mtimeMs);
		return Number.isFinite(mtimeMs) && mtimeMs >= 0 ? mtimeMs : void 0;
	} catch {
		return;
	}
}
function listUnreferencedJsonlFiles(storePath, referencedPaths) {
	const sessionsDir = node_path.default.dirname(storePath);
	let entries;
	try {
		entries = node_fs.default.readdirSync(sessionsDir);
	} catch {
		return [];
	}
	const referenced = new Set(referencedPaths.map((filePath) => canonicalFilePath(filePath)));
	return entries.filter((entry) => entry.endsWith(".jsonl")).map((entry) => node_path.default.join(sessionsDir, entry)).filter((filePath) => !referenced.has(canonicalFilePath(filePath))).toSorted((a, b) => a.localeCompare(b));
}
function appendActiveSqliteTranscriptFileIssues(target, report) {
	const result = readOnlySqliteSessionEntries(target);
	if (!result.ok) {
		report.issues.push({
			code: "sqlite_active_transcript_scan_failed",
			message: `Could not scan SQLite-backed sessions for active JSONL transcript files: ${String(result.error)}`
		});
		return;
	}
	for (const summary of result.summaries) {
		const transcriptPath = resolveActiveSqliteTranscriptFile(target, summary.entry);
		if (!transcriptPath) continue;
		report.issues.push({
			code: "active_sqlite_transcript_jsonl",
			message: `SQLite-backed session still has an active JSONL transcript file: ${transcriptPath}`,
			sessionKey: summary.sessionKey
		});
	}
}
function appendSqliteDbStats(target, report) {
	const result = readOnlySqliteDbStats(target);
	if (!result.ok) {
		report.issues.push({
			code: "sqlite_corrupt",
			message: `SQLite database could not be inspected: ${String(result.error)}`
		});
		return;
	}
	report.dbStats = result.stats;
	if (result.stats.integrityCheck && result.stats.integrityCheck !== "ok") report.issues.push({
		code: "sqlite_integrity_check_failed",
		message: `SQLite quick_check reported: ${result.stats.integrityCheck}`
	});
}
function compactSqliteDatabase(target, report, options = {}) {
	try {
		if (options.closeImportedHandle) require_openclaw_agent_db.closeOperatorAgentDatabaseByPath(resolveTargetSqlitePath(target));
		report.compact = options.migrateOlderSchema ? compactDoctorSessionSqliteTarget(target, { migrateOlderSchema: true }) : compactDoctorSessionSqliteTarget(target);
	} catch (err) {
		report.issues.push({
			code: "sqlite_compact_failed",
			message: `SQLite database compact failed: ${String(err)}`
		});
	}
}
function resolveActiveSqliteTranscriptFile(target, entry) {
	let transcriptPath;
	try {
		transcriptPath = require_paths$1.resolveSessionFilePath(entry.sessionId, entry, {
			agentId: target.agentId,
			sessionsDir: node_path.default.dirname(target.storePath)
		});
	} catch {
		return;
	}
	if (!transcriptPath.endsWith(".jsonl")) return;
	let stat;
	try {
		stat = node_fs.default.statSync(transcriptPath);
	} catch {
		return;
	}
	if (!stat.isFile()) return;
	const sessionsDir = canonicalFilePath(node_path.default.dirname(target.storePath));
	const activePath = canonicalFilePath(transcriptPath);
	if (node_path.default.dirname(activePath) !== sessionsDir) return;
	return activePath;
}
function moveImportedTranscriptArtifactsToArchive(target, sessionKey, transcriptPath, activeRun) {
	const archived = [moveImportedTranscriptToArchive(target, sessionKey, transcriptPath, "transcript", activeRun)];
	const trajectoryPath = resolveTrajectoryPath(transcriptPath);
	if (trajectoryPath && node_fs.default.existsSync(trajectoryPath)) archived.push(moveImportedTranscriptToArchive(target, sessionKey, trajectoryPath, "trajectory", activeRun));
	const trajectoryPointerPath = resolveTrajectoryPointerPath(transcriptPath);
	if (trajectoryPointerPath && node_fs.default.existsSync(trajectoryPointerPath)) archived.push(moveImportedTranscriptToArchive(target, sessionKey, trajectoryPointerPath, "trajectory", activeRun));
	return archived;
}
function resolveTrajectoryPath(transcriptPath) {
	return transcriptPath.endsWith(".jsonl") ? `${transcriptPath.slice(0, -6)}.trajectory.jsonl` : void 0;
}
function resolveTrajectoryPointerPath(transcriptPath) {
	return transcriptPath.endsWith(".jsonl") ? `${transcriptPath.slice(0, -6)}.trajectory-path.json` : void 0;
}
function moveImportedTranscriptToArchive(target, sessionKey, sourcePathRaw, kind, activeRun) {
	return moveSessionJsonlToArchive({
		activeRun,
		archiveKey: sessionKey,
		baseNameRaw: node_path.default.basename(sourcePathRaw),
		kind,
		sessionKey,
		sourcePathRaw,
		target
	});
}
function moveSessionJsonlToArchive(params) {
	const move = planSessionJsonlArchiveMove(params);
	const migrationTarget = createMigrationTargetInput(params.target);
	recordPlannedMigrationMove(params.activeRun, migrationTarget, move);
	assertSafeSessionSqliteMigrationMove(move, migrationTarget);
	node_fs.default.renameSync(move.sourcePath, move.archivePath);
	recordCompletedMigrationMove(params.activeRun, migrationTarget, move);
	return move.archivePath;
}
function planSessionJsonlArchiveMove(params) {
	const sourcePathRaw = node_path.default.resolve(params.sourcePathRaw);
	if (!node_fs.default.lstatSync(sourcePathRaw).isFile()) throw new Error("source is not a regular file");
	const sourcePath = node_path.default.join(canonicalFilePath(node_path.default.dirname(sourcePathRaw)), node_path.default.basename(sourcePathRaw));
	const sessionsDir = canonicalFilePath(node_path.default.dirname(node_path.default.resolve(params.target.storePath)));
	if (node_path.default.dirname(sourcePath) !== sessionsDir) throw new Error(`Migration source is outside the target sessions directory: ${sourcePath}`);
	const archiveDir = resolveImportedTranscriptArchiveDir(params.target.storePath);
	assertSafeSessionSqliteMigrationDirectory(archiveDir);
	node_fs.default.mkdirSync(archiveDir, { recursive: true });
	assertSafeSessionSqliteMigrationDirectory(archiveDir);
	const baseName = params.baseNameRaw.replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 160) || "artifact";
	const keySlug = params.archiveKey.replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 120) || "session";
	for (let attempt = 0; attempt < 100; attempt += 1) {
		const suffix = attempt === 0 ? "" : `.${attempt}`;
		const archivePath = node_path.default.join(archiveDir, `${keySlug}.${baseName}.imported-${Date.now()}${suffix}`);
		if (node_fs.default.existsSync(archivePath) || params.reservedArchivePaths?.has(archivePath)) continue;
		return {
			archivePath,
			kind: params.kind,
			...params.sessionKey ? { sessionKey: params.sessionKey } : {},
			sourcePath
		};
	}
	throw new Error(`Could not archive ${baseName} for ${params.archiveKey}`);
}
function resolveImportedTranscriptArchiveDir(storePath) {
	const storeDir = canonicalFilePath(node_path.default.dirname(node_path.default.resolve(storePath)));
	return node_path.default.join(node_path.default.dirname(storeDir), "session-sqlite-import-archive");
}
function canonicalFilePath(filePath) {
	try {
		return node_fs.default.realpathSync.native(filePath);
	} catch {
		return node_path.default.resolve(filePath);
	}
}
function createMigrationTargetInput(target) {
	return {
		agentId: target.agentId,
		sqlitePath: canonicalMigrationFilePath(resolveTargetSqlitePath(target)),
		storePath: canonicalMigrationFilePath(target.storePath)
	};
}
function isSessionEntry(value) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && typeof value.sessionId === "string" && value.sessionId.trim() !== "";
}
function summarizeDoctorSessionSqliteReport(mode, targets, activeRun) {
	return {
		...activeRun ? { migrationRun: {
			...activeRun.manifest.failureReports ? {
				failureReportJsonPath: activeRun.manifest.failureReports.jsonPath,
				failureReportMarkdownPath: activeRun.manifest.failureReports.markdownPath
			} : {},
			manifestPath: activeRun.manifestPath,
			runId: activeRun.manifest.runId
		} } : {},
		mode,
		targets,
		totals: {
			archivedLegacyStoreFiles: targets.reduce((total, target) => total + (target.archivedLegacyStoreFiles?.length ?? 0), 0),
			archivedTranscriptFiles: targets.reduce((total, target) => total + target.archivedTranscriptFiles.length, 0),
			archivedUnreferencedJsonlFiles: targets.reduce((total, target) => total + target.archivedUnreferencedJsonlFiles.length, 0),
			importedEntries: sumTargets(targets, "importedEntries"),
			importedTranscriptEvents: sumTargets(targets, "importedTranscriptEvents"),
			issues: targets.reduce((total, target) => total + target.issues.length, 0),
			legacyEntries: sumTargets(targets, "legacyEntries"),
			reclaimedBytes: targets.reduce((total, target) => total + (target.compact?.reclaimedBytes ?? 0), 0),
			sqliteEntries: sumTargets(targets, "sqliteEntries"),
			targets: targets.length,
			unreferencedJsonlFiles: targets.reduce((total, target) => total + target.unreferencedJsonlFiles.length, 0),
			validatedEntries: sumTargets(targets, "validatedEntries"),
			validatedTranscriptEvents: sumTargets(targets, "validatedTranscriptEvents")
		}
	};
}
function sumTargets(targets, key) {
	return targets.reduce((total, target) => total + target[key], 0);
}
//#endregion
exports.restoreSessionSqliteMigrationRun = restoreSessionSqliteMigrationRun;
exports.runDoctorSessionSqlite = runDoctorSessionSqlite;
exports.writeSessionSqliteMigrationFailureReports = writeSessionSqliteMigrationFailureReports;
