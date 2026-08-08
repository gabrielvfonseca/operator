const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
const require_record_coerce = require("./record-coerce-B82bFbwe.cjs");
const require_persisted_shape = require("./persisted-shape-B4cVRP0Q.cjs");
const require_stagger = require("./stagger-B6F7g8Gn.cjs");
const require_codex_route_model_ref = require("./codex-route-model-ref-CKO9Qire.cjs");
require("./schedule-JbL5oWY9.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let zod = require("zod");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
//#region src/commands/doctor/cron/legacy-delivery.ts
function parseLegacyDeliveryHintsInput(payload) {
	return {
		deliver: require_persisted_shape.parseOptionalField(zod.z.boolean(), payload.deliver),
		bestEffortDeliver: require_persisted_shape.parseOptionalField(zod.z.boolean(), payload.bestEffortDeliver),
		channel: require_persisted_shape.parseOptionalField(require_persisted_shape.LowercaseNonEmptyStringFieldSchema, payload.channel),
		provider: require_persisted_shape.parseOptionalField(require_persisted_shape.LowercaseNonEmptyStringFieldSchema, payload.provider),
		to: require_persisted_shape.parseOptionalField(require_persisted_shape.TrimmedNonEmptyStringFieldSchema, payload.to),
		threadId: require_persisted_shape.parseOptionalField(require_persisted_shape.DeliveryThreadIdFieldSchema.transform((value) => String(value)), payload.threadId)
	};
}
/** Return true when a payload still carries legacy delivery hint fields. */
function hasLegacyDeliveryHints(payload) {
	const hints = parseLegacyDeliveryHintsInput(payload);
	return hints.deliver !== void 0 || hints.bestEffortDeliver !== void 0 || hints.channel !== void 0 || hints.provider !== void 0 || hints.to !== void 0 || hints.threadId !== void 0;
}
/** Build a new delivery object from legacy top-level payload delivery fields. */
function buildDeliveryFromLegacyPayload(payload) {
	const hints = parseLegacyDeliveryHintsInput(payload);
	const next = { mode: hints.deliver === false ? "none" : "announce" };
	if (hints.channel ?? hints.provider) next.channel = hints.channel ?? hints.provider;
	if (hints.to) next.to = hints.to;
	if (hints.threadId) next.threadId = hints.threadId;
	if (hints.bestEffortDeliver !== void 0) next.bestEffort = hints.bestEffortDeliver;
	return next;
}
/** Build a partial delivery patch from legacy payload fields, or null when none exist. */
function buildDeliveryPatchFromLegacyPayload(payload) {
	const hints = parseLegacyDeliveryHintsInput(payload);
	const next = {};
	let hasPatch = false;
	if (hints.deliver === false) {
		next.mode = "none";
		hasPatch = true;
	} else if (hints.deliver === true || hints.channel || hints.provider || hints.to || hints.threadId || hints.bestEffortDeliver !== void 0) {
		next.mode = "announce";
		hasPatch = true;
	}
	if (hints.channel ?? hints.provider) {
		next.channel = hints.channel ?? hints.provider;
		hasPatch = true;
	}
	if (hints.to) {
		next.to = hints.to;
		hasPatch = true;
	}
	if (hints.threadId) {
		next.threadId = hints.threadId;
		hasPatch = true;
	}
	if (hints.bestEffortDeliver !== void 0) {
		next.bestEffort = hints.bestEffortDeliver;
		hasPatch = true;
	}
	return hasPatch ? next : null;
}
/** Merge legacy payload delivery hints into an existing delivery object. */
function mergeLegacyDeliveryInto(delivery, payload) {
	const patch = buildDeliveryPatchFromLegacyPayload(payload);
	if (!patch) return {
		delivery,
		mutated: false
	};
	const next = { ...delivery };
	let mutated = false;
	if ("mode" in patch && patch.mode !== next.mode) {
		next.mode = patch.mode;
		mutated = true;
	}
	if ("channel" in patch && patch.channel !== next.channel) {
		next.channel = patch.channel;
		mutated = true;
	}
	if ("to" in patch && patch.to !== next.to) {
		next.to = patch.to;
		mutated = true;
	}
	if ("threadId" in patch && patch.threadId !== next.threadId) {
		next.threadId = patch.threadId;
		mutated = true;
	}
	if ("bestEffort" in patch && patch.bestEffort !== next.bestEffort) {
		next.bestEffort = patch.bestEffort;
		mutated = true;
	}
	return {
		delivery: next,
		mutated
	};
}
/** Normalize delivery and strip consumed legacy delivery fields from the payload. */
function normalizeLegacyDeliveryInput(params) {
	if (!params.payload || !hasLegacyDeliveryHints(params.payload)) return {
		delivery: params.delivery ?? void 0,
		mutated: false
	};
	const nextDelivery = params.delivery ? mergeLegacyDeliveryInto(params.delivery, params.payload) : {
		delivery: buildDeliveryFromLegacyPayload(params.payload),
		mutated: true
	};
	stripLegacyDeliveryFields(params.payload);
	return {
		delivery: nextDelivery.delivery,
		mutated: true
	};
}
function stripLegacyDeliveryFields(payload) {
	if ("deliver" in payload) delete payload.deliver;
	if ("channel" in payload) delete payload.channel;
	if ("provider" in payload) delete payload.provider;
	if ("to" in payload) delete payload.to;
	if ("threadId" in payload) delete payload.threadId;
	if ("bestEffortDeliver" in payload) delete payload.bestEffortDeliver;
}
//#endregion
//#region src/commands/doctor/cron/legacy-store-migration.ts
const LEGACY_CRON_ARCHIVE_SUFFIX = ".migrated";
const legacyCronMigrationIds = /* @__PURE__ */ new WeakMap();
function resolveLegacyCronMigrationId(job) {
	return legacyCronMigrationIds.get(job);
}
function markLegacyCronMigrationIdentity(job, sourceIndex) {
	if (require_string_coerce.normalizeOptionalStringifiedId(job.id) ?? require_string_coerce.normalizeOptionalStringifiedId(job.jobId)) return;
	const digest = (0, node_crypto.createHash)("sha256").update(JSON.stringify(job)).digest("hex");
	legacyCronMigrationIds.set(job, `cron-migrated-${sourceIndex}-${digest}`);
}
function resolveLegacyCronStatePath(storePath) {
	if (storePath.endsWith(".json")) return storePath.replace(/\.json$/, "-state.json");
	return `${storePath}-state.json`;
}
function createLegacyCronMigrationSource(params) {
	const sourceSha256 = (0, node_crypto.createHash)("sha256").update(params.raw).digest("hex");
	const stateSha256 = params.stateRaw !== void 0 ? (0, node_crypto.createHash)("sha256").update(params.stateRaw).digest("hex") : void 0;
	return {
		sourceKey: `cron-json:${(0, node_crypto.createHash)("sha256").update(`${params.sourcePath}\0${sourceSha256}\0${stateSha256 ?? ""}`).digest("hex")}`,
		sourcePath: params.sourcePath,
		sourceSha256,
		statePath: params.statePath,
		stateSha256,
		sourceSizeBytes: Buffer.byteLength(params.raw) + Buffer.byteLength(params.stateRaw ?? ""),
		sourceRecordCount: params.recordCount
	};
}
async function legacyCronFileExists(filePath) {
	try {
		await node_fs_promises.default.access(filePath);
		return true;
	} catch (err) {
		if (err.code === "ENOENT") return false;
		throw err;
	}
}
function formatArchiveError(err) {
	return err instanceof Error ? err.message : String(err);
}
function isUnsupportedDirectorySyncError(err) {
	const code = err.code;
	if (code === "EINVAL" || code === "ENOTSUP" || code === "ENOSYS") return true;
	return process.platform === "win32" && (code === "EISDIR" || code === "EPERM" || code === "EACCES");
}
async function syncArchiveDirectory(dirPath) {
	let handle;
	try {
		handle = await node_fs_promises.default.open(dirPath, "r");
		await handle.sync();
	} catch (err) {
		if (!isUnsupportedDirectorySyncError(err)) throw err;
	} finally {
		await handle?.close();
	}
}
async function sha256File(filePath) {
	return (0, node_crypto.createHash)("sha256").update(await node_fs_promises.default.readFile(filePath)).digest("hex");
}
/** Refuse to persist a migration plan built from legacy files that changed after loading. */
async function assertLegacyCronMigrationSourceCurrent(source) {
	if (await sha256File(source.sourcePath) !== source.sourceSha256) throw new Error("legacy cron source changed while doctor was preparing its migration");
	if (source.stateSha256) {
		if (await sha256File(source.statePath) !== source.stateSha256) throw new Error("legacy cron state changed while doctor was preparing its migration");
	} else if (await legacyCronFileExists(source.statePath)) throw new Error("legacy cron state appeared while doctor was preparing its migration");
}
async function restoreArchivedSource(archivePath, sourcePath, expectedSha256) {
	try {
		if (await legacyCronFileExists(sourcePath)) return {
			ok: false,
			reason: `archive remains at ${archivePath} because a new source exists at ${sourcePath}`
		};
	} catch (err) {
		return {
			ok: false,
			reason: `archive remains at ${archivePath} because the source path could not be checked: ${formatArchiveError(err)}`
		};
	}
	try {
		await node_fs_promises.default.rename(archivePath, sourcePath);
	} catch (err) {
		if (err.code === "EXDEV") {
			const outcome = await copyLegacyCronFileAcrossDevices(archivePath, sourcePath, expectedSha256, false);
			return outcome.ok ? { ok: true } : outcome;
		}
		return {
			ok: false,
			reason: `archive remains at ${archivePath} because restoration failed: ${formatArchiveError(err)}`
		};
	}
	try {
		await syncArchiveDirectory(node_path.default.dirname(sourcePath));
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			reason: `the source was restored, but rollback directory sync failed: ${formatArchiveError(err)}`
		};
	}
}
async function copyLegacyCronFileAcrossDevices(filePath, initialArchivePath, expectedSha256, useNumberedArchive = true) {
	let archivePath = initialArchivePath;
	let archiveCreated = false;
	let sourceRemoved = false;
	try {
		const sourceStat = await node_fs_promises.default.stat(filePath);
		if (!sourceStat.isFile()) throw new Error("legacy cron source is not a regular file");
		if (expectedSha256 && await sha256File(filePath) !== expectedSha256) throw new Error("legacy cron source changed after it was imported; refusing to archive it");
		const sourceMode = sourceStat.mode & 511;
		for (let index = 2;; index += 1) try {
			const archiveHandle = await node_fs_promises.default.open(archivePath, "wx", sourceMode | 384);
			archiveCreated = true;
			await archiveHandle.close();
			break;
		} catch (err) {
			if (err.code !== "EEXIST" || !useNumberedArchive) throw err;
			archivePath = `${filePath}${LEGACY_CRON_ARCHIVE_SUFFIX}.${index}`;
		}
		await node_fs_promises.default.copyFile(filePath, archivePath);
		if (expectedSha256 && await sha256File(archivePath) !== expectedSha256) throw new Error("copied legacy cron archive does not match the imported source");
		await node_fs_promises.default.chmod(archivePath, sourceMode | 384);
		const archiveHandle = await node_fs_promises.default.open(archivePath, "r+");
		try {
			await archiveHandle.chmod(sourceMode);
			await archiveHandle.utimes(sourceStat.atime, sourceStat.mtime);
			await archiveHandle.sync();
		} finally {
			await archiveHandle.close();
		}
		await syncArchiveDirectory(node_path.default.dirname(archivePath));
		const currentSourceStat = await node_fs_promises.default.stat(filePath);
		if (currentSourceStat.dev !== sourceStat.dev || currentSourceStat.ino !== sourceStat.ino || expectedSha256 && await sha256File(filePath) !== expectedSha256) throw new Error("legacy cron source changed during archival; refusing to remove it");
		await node_fs_promises.default.unlink(filePath);
		sourceRemoved = true;
		await syncArchiveDirectory(node_path.default.dirname(filePath));
		return {
			ok: true,
			archivePath
		};
	} catch (err) {
		if (sourceRemoved) return {
			ok: false,
			reason: `${formatArchiveError(err)}; the durable archive is preserved at ${archivePath} because the source was already removed`
		};
		const cleanupFailures = [];
		if (archiveCreated) {
			let archiveRemoved = false;
			try {
				try {
					await node_fs_promises.default.unlink(archivePath);
				} catch (cleanupErr) {
					if (cleanupErr.code !== "ENOENT") throw cleanupErr;
				}
				archiveRemoved = true;
				await syncArchiveDirectory(node_path.default.dirname(archivePath));
			} catch (cleanupErr) {
				cleanupFailures.push(archiveRemoved ? `the partial archive was removed, but cleanup directory sync failed: ${formatArchiveError(cleanupErr)}` : `partial archive remains at ${archivePath} because cleanup failed: ${formatArchiveError(cleanupErr)}`);
			}
		}
		const cleanupReason = cleanupFailures.length > 0 ? `; ${cleanupFailures.join("; ")}` : "";
		return {
			ok: false,
			reason: `${formatArchiveError(err)}${cleanupReason}`
		};
	}
}
async function archiveLegacyCronFile(filePath, expectedSha256) {
	let archivePath = `${filePath}${LEGACY_CRON_ARCHIVE_SUFFIX}`;
	try {
		if (!await legacyCronFileExists(filePath)) return { ok: true };
		for (let index = 2; await legacyCronFileExists(archivePath); index += 1) archivePath = `${filePath}${LEGACY_CRON_ARCHIVE_SUFFIX}.${index}`;
	} catch (err) {
		return {
			ok: false,
			reason: formatArchiveError(err)
		};
	}
	try {
		await node_fs_promises.default.rename(filePath, archivePath);
	} catch (err) {
		if (err?.code !== "EXDEV") return {
			ok: false,
			reason: formatArchiveError(err)
		};
		return await copyLegacyCronFileAcrossDevices(filePath, archivePath, expectedSha256);
	}
	try {
		if (expectedSha256 && await sha256File(archivePath) !== expectedSha256) throw new Error("legacy cron source changed after it was imported; refusing to archive it");
		await syncArchiveDirectory(node_path.default.dirname(filePath));
		if (await legacyCronFileExists(filePath)) return {
			ok: false,
			reason: `the imported source was archived, but a new legacy cron source now exists at ${filePath}`
		};
		return {
			ok: true,
			archivePath
		};
	} catch (err) {
		const restoreFailure = await restoreArchivedSource(archivePath, filePath, expectedSha256);
		return {
			ok: false,
			reason: restoreFailure.ok ? formatArchiveError(err) : `${formatArchiveError(err)}; ${restoreFailure.reason}`
		};
	}
}
function parseCronStateFile(raw) {
	try {
		const parsed = require_parse_json_compat.parseJsonWithJson5Fallback(raw);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
		const record = parsed;
		if (record.version !== 1 || typeof record.jobs !== "object" || record.jobs === null || Array.isArray(record.jobs)) return null;
		return {
			version: 1,
			jobs: record.jobs
		};
	} catch {
		return null;
	}
}
function readString(record, key) {
	return require_string_coerce.normalizeOptionalString(record[key]);
}
function readNumber(record, key) {
	return require_stagger.coerceFiniteScheduleNumber(record[key]);
}
function legacySchedulePayloadFromRecord(schedule) {
	const rawKind = readString(schedule, "kind")?.toLowerCase();
	const expr = readString(schedule, "expr") ?? readString(schedule, "cron");
	const at = readString(schedule, "at");
	const atMs = readNumber(schedule, "atMs");
	const everyMs = readNumber(schedule, "everyMs");
	const anchorMs = readNumber(schedule, "anchorMs");
	const tz = readString(schedule, "tz");
	const staggerMs = require_stagger.normalizeCronStaggerMs(schedule.staggerMs);
	const kind = rawKind === "at" || rawKind === "every" || rawKind === "cron" ? rawKind : at || atMs !== void 0 ? "at" : everyMs !== void 0 ? "every" : expr ? "cron" : void 0;
	if (kind === "at") return at ? {
		kind: "at",
		at
	} : atMs !== void 0 ? {
		kind: "at",
		at: String(atMs)
	} : void 0;
	if (kind === "every" && everyMs !== void 0) return {
		kind: "every",
		everyMs,
		anchorMs
	};
	if (kind === "cron" && expr) return {
		kind: "cron",
		expr,
		tz,
		staggerMs
	};
}
function tryLegacyCronScheduleIdentity(job) {
	const schedule = job.schedule && typeof job.schedule === "object" && !Array.isArray(job.schedule) ? legacySchedulePayloadFromRecord(job.schedule) : legacySchedulePayloadFromRecord(job);
	if (!schedule) return;
	return JSON.stringify({
		version: 1,
		enabled: typeof job.enabled === "boolean" ? job.enabled : true,
		schedule
	});
}
function getRawCronJobs(parsed) {
	return Array.isArray(parsed) ? parsed : require_record_coerce.isRecord(parsed) && Array.isArray(parsed.jobs) ? parsed.jobs : [];
}
function cloneConfigJobs(jobs) {
	return jobs.map((job) => structuredClone(job));
}
async function loadStateFile(statePath) {
	let raw;
	try {
		raw = await node_fs_promises.default.readFile(statePath, "utf-8");
	} catch (err) {
		if (err?.code === "ENOENT") return { state: null };
		throw new Error(`Failed to read cron state at ${statePath}: ${String(err)}`, { cause: err });
	}
	return {
		state: parseCronStateFile(raw),
		raw
	};
}
function hasInlineState(jobs) {
	return jobs.some((job) => job != null && require_record_coerce.isRecord(job.state) && Object.keys(job.state).length > 0);
}
function ensureJobStateObject(job) {
	if (!require_record_coerce.isRecord(job.state)) job.state = {};
}
function backfillMissingRuntimeFields(job) {
	ensureJobStateObject(job);
	if (typeof job.updatedAtMs !== "number") job.updatedAtMs = typeof job.createdAtMs === "number" ? job.createdAtMs : Date.now();
}
function resolveUpdatedAtMs(job, updatedAtMs) {
	if (typeof updatedAtMs === "number" && Number.isFinite(updatedAtMs)) return updatedAtMs;
	if (typeof job.updatedAtMs === "number" && Number.isFinite(job.updatedAtMs)) return job.updatedAtMs;
	return typeof job.createdAtMs === "number" && Number.isFinite(job.createdAtMs) ? job.createdAtMs : Date.now();
}
function mergeStateFileEntry(job, entry) {
	if (!require_record_coerce.isRecord(entry)) {
		backfillMissingRuntimeFields(job);
		return;
	}
	job.updatedAtMs = resolveUpdatedAtMs(job, entry.updatedAtMs);
	job.state = require_record_coerce.isRecord(entry.state) ? entry.state : {};
	if (typeof entry.scheduleIdentity === "string" && entry.scheduleIdentity !== tryLegacyCronScheduleIdentity(job)) {
		ensureJobStateObject(job);
		job.state.nextRunAtMs = void 0;
	}
}
function resolveCronStateId(job) {
	return require_string_coerce.normalizeOptionalString(job.id) ?? require_string_coerce.normalizeOptionalString(job.jobId);
}
/** Return true when legacy cron JSON or state files exist for a store path. */
async function legacyCronStoreFilesExist(storePath) {
	const resolvedStorePath = node_path.default.resolve(storePath);
	return await legacyCronFileExists(resolvedStorePath) || await legacyCronFileExists(resolveLegacyCronStatePath(resolvedStorePath));
}
/** Archive legacy cron JSON/state files after successful migration. */
async function archiveLegacyCronStoreForMigration(storePath, source) {
	const resolvedStorePath = node_path.default.resolve(storePath);
	const statePath = resolveLegacyCronStatePath(resolvedStorePath);
	const failures = [];
	const archived = [];
	const rollbackArchived = async () => {
		for (const target of archived.toReversed()) {
			const outcome = await restoreArchivedSource(target.archivePath, target.path, target.sha256);
			if (!outcome.ok) failures.push({
				path: target.path,
				reason: `archive rollback failed: ${outcome.reason}`
			});
		}
	};
	const unexpectedStateReason = async () => {
		try {
			return await legacyCronFileExists(statePath) ? "legacy cron state appeared after the store was imported; refusing to archive it" : void 0;
		} catch (err) {
			return `legacy cron state path could not be checked: ${formatArchiveError(err)}`;
		}
	};
	if (source && !source.stateSha256) {
		const reason = await unexpectedStateReason();
		if (reason) return {
			ok: false,
			failures: [{
				path: statePath,
				reason
			}]
		};
	}
	const targets = source ? [...source.stateSha256 ? [{
		path: statePath,
		sha256: source.stateSha256
	}] : [], {
		path: resolvedStorePath,
		sha256: source.sourceSha256
	}] : [{ path: statePath }, { path: resolvedStorePath }];
	for (const target of targets) {
		const outcome = await archiveLegacyCronFile(target.path, target.sha256);
		if (!outcome.ok) {
			failures.push({
				path: target.path,
				reason: outcome.reason
			});
			await rollbackArchived();
			break;
		}
		if (outcome.archivePath) archived.push({
			...target,
			archivePath: outcome.archivePath
		});
	}
	if (failures.length === 0 && source) {
		const reason = await unexpectedStateReason();
		if (reason) {
			failures.push({
				path: statePath,
				reason
			});
			await rollbackArchived();
		}
	}
	return failures.length === 0 ? { ok: true } : {
		ok: false,
		failures
	};
}
/** Load legacy cron JSON/state files into the current loaded-store shape for migration. */
async function loadLegacyCronStoreForMigration(storePath) {
	const resolvedStorePath = node_path.default.resolve(storePath);
	try {
		const raw = await node_fs_promises.default.readFile(resolvedStorePath, "utf-8");
		let parsed;
		try {
			parsed = require_parse_json_compat.parseJsonWithJson5Fallback(raw);
		} catch (err) {
			throw new Error(`Failed to parse cron store at ${resolvedStorePath}: ${String(err)}`, { cause: err });
		}
		const rawJobs = getRawCronJobs(parsed);
		const configJobIndexes = [];
		const configRows = [];
		const configJobRuntimeEntries = [];
		const invalidConfigRows = [];
		for (const [index, row] of rawJobs.entries()) if (require_record_coerce.isRecord(row)) {
			markLegacyCronMigrationIdentity(row, index);
			configJobIndexes.push(index);
			configRows.push(row);
		} else invalidConfigRows.push({
			sourceIndex: index,
			reason: "non-object-row",
			raw: structuredClone(row)
		});
		const store = {
			version: 1,
			jobs: configRows
		};
		const jobs = store.jobs;
		const configJobs = cloneConfigJobs(configRows);
		const statePath = resolveLegacyCronStatePath(resolvedStorePath);
		const loadedStateFile = await loadStateFile(statePath);
		const stateFile = loadedStateFile.state;
		const hasLegacyInlineState = !stateFile && hasInlineState(jobs);
		if (stateFile) for (const job of store.jobs) {
			const stateId = resolveCronStateId(job);
			const entry = stateId ? stateFile.jobs[stateId] : void 0;
			configJobRuntimeEntries.push(require_record_coerce.isRecord(entry) ? structuredClone(entry) : {});
			if (entry) mergeStateFileEntry(job, entry);
			else backfillMissingRuntimeFields(job);
		}
		else if (!hasLegacyInlineState) for (const job of store.jobs) backfillMissingRuntimeFields(job);
		for (const job of store.jobs) ensureJobStateObject(job);
		return {
			store,
			configJobs,
			configJobIndexes,
			configJobRuntimeEntries,
			invalidConfigRows,
			migrationSource: createLegacyCronMigrationSource({
				sourcePath: resolvedStorePath,
				raw,
				statePath,
				stateRaw: loadedStateFile.raw,
				recordCount: rawJobs.length
			})
		};
	} catch (err) {
		if (err?.code === "ENOENT") return {
			store: {
				version: 1,
				jobs: []
			},
			configJobs: [],
			configJobIndexes: [],
			configJobRuntimeEntries: [],
			invalidConfigRows: []
		};
		throw err;
	}
}
//#endregion
//#region src/commands/doctor/cron/payload-migration.ts
const LEGACY_AGENT_TURN_COMMAND_MARKER_RE = /\bCommand to run\s*:/iu;
const LEGACY_AGENT_TURN_COMMAND_FIELD_RE = /^\s*-\s*(command|workdir|timeout)\s*:\s*(.*?)\s*$/iu;
const SHELL_TOOL_NAMES = /* @__PURE__ */ new Set([
	"bash",
	"command",
	"exec",
	"process",
	"shell",
	"sh"
]);
const SHELL_COMMAND_MESSAGE_RE = /\b(?:bash|command|execute|exec|process|run|shell)\b[\s\S]{0,240}\b(?:python3?|node|bun|pnpm|npm|npx|yarn|sh|bash|sudo|cd|\.\/|\/[A-Za-z0-9._/-]+)\b/iu;
const LEGACY_DELIVERY_HINT_FIELDS = [
	"deliver",
	"bestEffortDeliver",
	"channel",
	"provider",
	"to",
	"threadId"
];
function hasShellToolAccess(toolsAllow) {
	if (toolsAllow === void 0) return true;
	if (!Array.isArray(toolsAllow)) return false;
	return toolsAllow.some((tool) => {
		const normalized = require_string_coerce.normalizeOptionalLowercaseString(tool);
		return normalized === "*" || (normalized ? SHELL_TOOL_NAMES.has(normalized) : false);
	});
}
function readLegacyOpenAICodexCronModelRoute(value) {
	const legacyModelRef = require_string_coerce.readStringValue(value)?.trim();
	const canonicalModelRef = legacyModelRef ? require_codex_route_model_ref.toCanonicalOpenAIModelRef(legacyModelRef) : void 0;
	return legacyModelRef && canonicalModelRef ? {
		legacyModelRef,
		canonicalModelRef
	} : void 0;
}
/** Legacy and canonical route pairs retained for namespace-specific migration blockers. */
function collectLegacyOpenAICodexCronModelRoutes(payload) {
	const routes = /* @__PURE__ */ new Map();
	const add = (value) => {
		const route = readLegacyOpenAICodexCronModelRoute(value);
		if (route) routes.set(`${route.legacyModelRef}\u0000${route.canonicalModelRef}`, route);
	};
	add(payload.model);
	if (Array.isArray(payload.fallbacks)) for (const fallback of payload.fallbacks) add(fallback);
	return [...routes.values()];
}
/** Canonical OpenAI refs whose legacy cron shape implied the Codex runtime. */
function collectLegacyOpenAICodexCronModelRefs(payload) {
	return [...new Set(collectLegacyOpenAICodexCronModelRoutes(payload).map((route) => route.canonicalModelRef))];
}
function normalizeChannel(value) {
	return require_string_coerce.normalizeOptionalLowercaseString(value) ?? "";
}
function parsePositiveInteger(value) {
	const trimmed = value.trim();
	if (!/^\d+$/u.test(trimmed)) return;
	const parsed = Number.parseInt(trimmed, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : void 0;
}
function readPositiveInteger(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : void 0;
}
function parseLegacyAgentTurnCommandMessage(message) {
	if (!LEGACY_AGENT_TURN_COMMAND_MARKER_RE.test(message)) return null;
	let command = "";
	let cwd;
	let timeoutSeconds;
	for (const line of message.split(/\r?\n/u)) {
		const match = LEGACY_AGENT_TURN_COMMAND_FIELD_RE.exec(line);
		if (!match) continue;
		const key = match[1]?.toLowerCase();
		const value = match[2]?.trim() ?? "";
		if (key === "command" && value && !command) command = value;
		else if (key === "workdir" && value && !cwd) cwd = value;
		else if (key === "timeout" && value && timeoutSeconds === void 0) timeoutSeconds = parsePositiveInteger(value);
	}
	if (!command) return null;
	return {
		command,
		...cwd ? { cwd } : {},
		...timeoutSeconds ? { timeoutSeconds } : {}
	};
}
/** Return true when a cron payload contains legacy Codex-route model refs. */
function hasLegacyOpenAICodexCronModelRef(payload) {
	return collectLegacyOpenAICodexCronModelRefs(payload).length > 0;
}
function migrateLegacyOpenAICodexModelRefs(payload, shouldMigrate) {
	let mutated = false;
	const model = readLegacyOpenAICodexCronModelRoute(payload.model);
	if (model && shouldMigrate(model.canonicalModelRef, model.legacyModelRef) && payload.model !== model.canonicalModelRef) {
		payload.model = model.canonicalModelRef;
		mutated = true;
	}
	const fallbacks = payload.fallbacks;
	if (Array.isArray(fallbacks)) {
		const next = fallbacks.map((fallback) => {
			const route = readLegacyOpenAICodexCronModelRoute(fallback);
			return route && shouldMigrate(route.canonicalModelRef, route.legacyModelRef) ? route.canonicalModelRef : fallback;
		});
		if (next.some((fallback, index) => fallback !== fallbacks[index])) {
			payload.fallbacks = next;
			mutated = true;
		}
	}
	return mutated;
}
/** Normalize legacy cron payload channel/provider and model reference fields in place. */
function migrateLegacyCronPayload(payload, options = {}) {
	let mutated = false;
	const channelValue = require_string_coerce.readStringValue(payload.channel);
	const providerValue = require_string_coerce.readStringValue(payload.provider);
	const nextChannel = typeof channelValue === "string" && channelValue.trim().length > 0 ? normalizeChannel(channelValue) : typeof providerValue === "string" && providerValue.trim().length > 0 ? normalizeChannel(providerValue) : "";
	if (nextChannel) {
		if (channelValue !== nextChannel) {
			payload.channel = nextChannel;
			mutated = true;
		}
	}
	if ("provider" in payload) {
		delete payload.provider;
		mutated = true;
	}
	if (migrateLegacyOpenAICodexModelRefs(payload, options.migrateCodexModelRefs === true ? options.shouldMigrateCodexModelRef ?? (() => true) : () => false)) mutated = true;
	return mutated;
}
function migrateLegacyAgentTurnCommandPayload(payload) {
	if (payload.kind !== "agentTurn") return false;
	const message = require_string_coerce.readStringValue(payload.message);
	if (typeof message !== "string") return false;
	const parsed = parseLegacyAgentTurnCommandMessage(message);
	if (!parsed) return false;
	if (!hasShellToolAccess(payload.toolsAllow)) return false;
	const timeoutSeconds = readPositiveInteger(payload.timeoutSeconds) ?? parsed.timeoutSeconds;
	const deliveryHints = {};
	for (const key of LEGACY_DELIVERY_HINT_FIELDS) if (key in payload) deliveryHints[key] = payload[key];
	for (const key of Object.keys(payload)) delete payload[key];
	payload.kind = "command";
	payload.argv = [
		"sh",
		"-lc",
		parsed.command
	];
	if (parsed.cwd) payload.cwd = parsed.cwd;
	if (timeoutSeconds !== void 0) payload.timeoutSeconds = timeoutSeconds;
	Object.assign(payload, deliveryHints);
	return true;
}
function classifyUnresolvedAgentTurnShellToolPrompt(payload) {
	if (payload.kind !== "agentTurn") return null;
	const message = require_string_coerce.readStringValue(payload.message);
	if (typeof message !== "string") return null;
	const parsed = parseLegacyAgentTurnCommandMessage(message);
	const shellToolAccess = hasShellToolAccess(payload.toolsAllow);
	if (parsed && !shellToolAccess) return "commandPromptWithoutShellAccess";
	if (shellToolAccess && SHELL_COMMAND_MESSAGE_RE.test(message)) return "shellToolPrompt";
	return null;
}
//#endregion
//#region src/commands/doctor/cron/store-migration.ts
function cronCodexRuntimePolicyTargetKey(target) {
	return `${target.agentId ?? ""}\u0000${target.modelRef}\u0000${target.legacyModelRef ?? ""}`;
}
function collectStoredCronCodexRuntimePolicyTargets(jobs, blockedModelIdentities) {
	const targets = /* @__PURE__ */ new Map();
	for (const job of jobs) {
		const agentId = require_string_coerce.normalizeOptionalString(job.agentId);
		const routes = [...collectLegacyOpenAICodexCronModelRoutes(job.payload && typeof job.payload === "object" && !Array.isArray(job.payload) ? job.payload : {}), ...collectLegacyOpenAICodexCronModelRoutes({ model: job.model })];
		for (const route of routes) {
			if (require_codex_route_model_ref.isBlockedLegacyCodexModelRef({
				modelRef: route.legacyModelRef,
				blockedModelIdentities
			})) continue;
			const target = {
				...agentId ? { agentId } : {},
				modelRef: route.canonicalModelRef,
				legacyModelRef: route.legacyModelRef
			};
			targets.set(cronCodexRuntimePolicyTargetKey(target), target);
		}
	}
	return [...targets.values()];
}
function incrementIssue(issues, key) {
	issues[key] = (issues[key] ?? 0) + 1;
}
function normalizeStoredCronJobIdentity(raw) {
	const hadIdKey = "id" in raw;
	const hadJobIdKey = "jobId" in raw;
	const id = require_string_coerce.normalizeOptionalStringifiedId(raw.id);
	const legacyJobId = require_string_coerce.normalizeOptionalStringifiedId(raw.jobId);
	const canonicalId = id ?? legacyJobId ?? resolveLegacyCronMigrationId(raw) ?? `cron-${(0, node_crypto.randomUUID)()}`;
	const nonStringIdIssue = hadIdKey && raw.id != null && typeof raw.id !== "string";
	const missingIdIssue = !id && !legacyJobId;
	let mutated = false;
	if (raw.id !== canonicalId) {
		raw.id = canonicalId;
		mutated = true;
	}
	if (hadJobIdKey) {
		delete raw.jobId;
		mutated = true;
	}
	return {
		mutated,
		legacyJobIdIssue: hadJobIdKey,
		missingIdIssue,
		nonStringIdIssue
	};
}
function normalizePayloadKind(payload) {
	const raw = require_string_coerce.normalizeOptionalLowercaseString(payload.kind) ?? "";
	if (raw === "agentturn") {
		if (payload.kind !== "agentTurn") {
			payload.kind = "agentTurn";
			return true;
		}
		return false;
	}
	if (raw === "systemevent") {
		if (payload.kind !== "systemEvent") {
			payload.kind = "systemEvent";
			return true;
		}
		return false;
	}
	return false;
}
function inferPayloadIfMissing(raw) {
	const message = require_string_coerce.normalizeOptionalString(raw.message) ?? "";
	const text = require_string_coerce.normalizeOptionalString(raw.text) ?? "";
	const command = require_string_coerce.normalizeOptionalString(raw.command) ?? "";
	if (message) {
		raw.payload = {
			kind: "agentTurn",
			message
		};
		return true;
	}
	if (text) {
		raw.payload = {
			kind: "systemEvent",
			text
		};
		return true;
	}
	if (command) {
		raw.payload = {
			kind: "systemEvent",
			text: command
		};
		return true;
	}
	return false;
}
function copyTopLevelAgentTurnFields(raw, payload) {
	let mutated = false;
	const copyTrimmedString = (field) => {
		if (require_string_coerce.normalizeOptionalString(payload[field])) return;
		const value = require_string_coerce.normalizeOptionalString(raw[field]);
		if (value) {
			payload[field] = value;
			mutated = true;
		}
	};
	copyTrimmedString("model");
	copyTrimmedString("thinking");
	if (typeof payload.timeoutSeconds !== "number" && typeof raw.timeoutSeconds === "number" && Number.isFinite(raw.timeoutSeconds)) {
		payload.timeoutSeconds = Math.max(0, Math.floor(raw.timeoutSeconds));
		mutated = true;
	}
	if (typeof payload.allowUnsafeExternalContent !== "boolean" && typeof raw.allowUnsafeExternalContent === "boolean") {
		payload.allowUnsafeExternalContent = raw.allowUnsafeExternalContent;
		mutated = true;
	}
	if (typeof payload.deliver !== "boolean" && typeof raw.deliver === "boolean") {
		payload.deliver = raw.deliver;
		mutated = true;
	}
	const channel = require_string_coerce.normalizeOptionalString(raw.channel);
	if (typeof payload.channel !== "string" && channel) {
		payload.channel = channel;
		mutated = true;
	}
	const to = require_string_coerce.normalizeOptionalString(raw.to);
	if (typeof payload.to !== "string" && to) {
		payload.to = to;
		mutated = true;
	}
	const rawThreadId = require_string_coerce.normalizeOptionalString(raw.threadId);
	if (!("threadId" in payload) && (typeof raw.threadId === "number" && Number.isFinite(raw.threadId) || Boolean(rawThreadId))) {
		payload.threadId = rawThreadId ?? raw.threadId;
		mutated = true;
	}
	if (typeof payload.bestEffortDeliver !== "boolean" && typeof raw.bestEffortDeliver === "boolean") {
		payload.bestEffortDeliver = raw.bestEffortDeliver;
		mutated = true;
	}
	const provider = require_string_coerce.normalizeOptionalString(raw.provider);
	if (typeof payload.provider !== "string" && provider) {
		payload.provider = provider;
		mutated = true;
	}
	return mutated;
}
function stripLegacyTopLevelFields(raw) {
	if ("model" in raw) delete raw.model;
	if ("thinking" in raw) delete raw.thinking;
	if ("timeoutSeconds" in raw) delete raw.timeoutSeconds;
	if ("allowUnsafeExternalContent" in raw) delete raw.allowUnsafeExternalContent;
	if ("message" in raw) delete raw.message;
	if ("text" in raw) delete raw.text;
	if ("deliver" in raw) delete raw.deliver;
	if ("channel" in raw) delete raw.channel;
	if ("to" in raw) delete raw.to;
	if ("threadId" in raw) delete raw.threadId;
	if ("bestEffortDeliver" in raw) delete raw.bestEffortDeliver;
	if ("provider" in raw) delete raw.provider;
	if ("command" in raw) delete raw.command;
	if ("timeout" in raw) delete raw.timeout;
}
/** Normalize persisted cron jobs in place and report issues plus rows to quarantine. */
function normalizeStoredCronJobs(jobs, options = {}) {
	const issues = {};
	const unresolvedAgentTurnCommandPromptJobs = [];
	const unresolvedAgentTurnShellToolPromptJobs = [];
	const unresolvedAgentTurnPromptJobsByKind = {
		commandPromptWithoutShellAccess: unresolvedAgentTurnCommandPromptJobs,
		shellToolPrompt: unresolvedAgentTurnShellToolPromptJobs
	};
	let mutated = false;
	const keptJobs = [];
	const removedJobs = [];
	const codexRuntimePolicyTargets = /* @__PURE__ */ new Map();
	for (const [sourceIndex, raw] of jobs.entries()) {
		const jobIssues = /* @__PURE__ */ new Set();
		const trackIssue = (key) => {
			if (jobIssues.has(key)) return;
			jobIssues.add(key);
			incrementIssue(issues, key);
		};
		const idNorm = normalizeStoredCronJobIdentity(raw);
		if (idNorm.mutated) mutated = true;
		if (idNorm.legacyJobIdIssue) trackIssue("jobId");
		if (idNorm.missingIdIssue) trackIssue("missingId");
		if (idNorm.nonStringIdIssue) trackIssue("nonStringId");
		const state = raw.state;
		if (!state || typeof state !== "object" || Array.isArray(state)) {
			raw.state = {};
			mutated = true;
		}
		if (typeof raw.schedule === "string") {
			raw.schedule = {
				kind: "cron",
				expr: raw.schedule.trim()
			};
			mutated = true;
			trackIssue("legacyScheduleString");
		}
		const nameRaw = raw.name;
		if (typeof nameRaw !== "string" || nameRaw.trim().length === 0) {
			raw.name = require_stagger.inferCronJobName({
				schedule: raw.schedule,
				payload: raw.payload
			});
			mutated = true;
		} else raw.name = nameRaw.trim();
		const desc = require_string_coerce.normalizeOptionalString(raw.description);
		if (raw.description !== desc) {
			raw.description = desc;
			mutated = true;
		}
		if ("sessionKey" in raw) {
			const sessionKey = typeof raw.sessionKey === "string" ? require_string_coerce.normalizeOptionalString(raw.sessionKey) : void 0;
			if (raw.sessionKey !== sessionKey) {
				raw.sessionKey = sessionKey;
				mutated = true;
			}
		}
		if (typeof raw.enabled !== "boolean") {
			raw.enabled = true;
			mutated = true;
		}
		const wakeModeRaw = require_string_coerce.normalizeOptionalLowercaseString(raw.wakeMode) ?? "";
		if (wakeModeRaw === "next-heartbeat") {
			if (raw.wakeMode !== "next-heartbeat") {
				raw.wakeMode = "next-heartbeat";
				mutated = true;
			}
		} else if (wakeModeRaw === "now") {
			if (raw.wakeMode !== "now") {
				raw.wakeMode = "now";
				mutated = true;
			}
		} else {
			raw.wakeMode = "now";
			mutated = true;
		}
		const payload = raw.payload;
		if ((!payload || typeof payload !== "object" || Array.isArray(payload)) && inferPayloadIfMissing(raw)) {
			mutated = true;
			trackIssue("legacyTopLevelPayloadFields");
		}
		const payloadRecord = raw.payload && typeof raw.payload === "object" && !Array.isArray(raw.payload) ? raw.payload : null;
		if (payloadRecord) {
			if (normalizePayloadKind(payloadRecord)) {
				mutated = true;
				trackIssue("legacyPayloadKind");
			}
			if (!payloadRecord.kind) {
				if (require_string_coerce.normalizeOptionalString(payloadRecord.message)) {
					payloadRecord.kind = "agentTurn";
					mutated = true;
					trackIssue("legacyPayloadKind");
				} else if (require_string_coerce.normalizeOptionalString(payloadRecord.text)) {
					payloadRecord.kind = "systemEvent";
					mutated = true;
					trackIssue("legacyPayloadKind");
				}
			}
			if (payloadRecord.kind === "agentTurn" && copyTopLevelAgentTurnFields(raw, payloadRecord)) mutated = true;
			if (payloadRecord.kind === "systemEvent" && !require_string_coerce.normalizeOptionalString(payloadRecord.text)) {
				const message = require_string_coerce.normalizeOptionalString(payloadRecord.message);
				if (message) {
					payloadRecord.text = message;
					delete payloadRecord.message;
					mutated = true;
					trackIssue("legacyPayloadKind");
				}
			}
		}
		const hadLegacyTopLevelPayloadFields = "model" in raw || "thinking" in raw || "timeoutSeconds" in raw || "allowUnsafeExternalContent" in raw || "message" in raw || "text" in raw || "command" in raw || "timeout" in raw;
		const hadLegacyTopLevelDeliveryFields = "deliver" in raw || "channel" in raw || "to" in raw || "threadId" in raw || "bestEffortDeliver" in raw || "provider" in raw;
		if (hadLegacyTopLevelPayloadFields || hadLegacyTopLevelDeliveryFields) {
			stripLegacyTopLevelFields(raw);
			mutated = true;
			if (hadLegacyTopLevelPayloadFields) trackIssue("legacyTopLevelPayloadFields");
			if (hadLegacyTopLevelDeliveryFields) trackIssue("legacyTopLevelDeliveryFields");
		}
		if (payloadRecord) {
			const hadLegacyPayloadProvider = Boolean(require_string_coerce.normalizeOptionalString(payloadRecord.provider));
			const hadLegacyPayloadCodexModel = hasLegacyOpenAICodexCronModelRef(payloadRecord);
			const legacyCodexModelRoutes = collectLegacyOpenAICodexCronModelRoutes(payloadRecord);
			const agentId = require_string_coerce.normalizeOptionalString(raw.agentId);
			const shouldMigrateCodexModelRef = (modelRef, legacyModelRef) => options.shouldMigrateCodexRuntimePolicyTarget?.({
				...agentId ? { agentId } : {},
				modelRef,
				legacyModelRef
			}) !== false;
			if (hadLegacyPayloadCodexModel) trackIssue("legacyPayloadCodexModel");
			if (migrateLegacyCronPayload(payloadRecord, {
				migrateCodexModelRefs: options.migrateCodexModelRefs,
				shouldMigrateCodexModelRef
			})) {
				mutated = true;
				if (hadLegacyPayloadProvider) trackIssue("legacyPayloadProvider");
			}
			if (hadLegacyPayloadCodexModel && options.migrateCodexModelRefs === true) for (const route of legacyCodexModelRoutes) {
				const target = {
					...agentId ? { agentId } : {},
					modelRef: route.canonicalModelRef,
					legacyModelRef: route.legacyModelRef
				};
				if (shouldMigrateCodexModelRef(route.canonicalModelRef, route.legacyModelRef)) codexRuntimePolicyTargets.set(cronCodexRuntimePolicyTargetKey(target), target);
			}
			if (migrateLegacyAgentTurnCommandPayload(payloadRecord)) {
				mutated = true;
				trackIssue("legacyAgentTurnCommandPayload");
			} else {
				const unresolvedPromptKind = classifyUnresolvedAgentTurnShellToolPrompt(payloadRecord);
				if (unresolvedPromptKind) {
					trackIssue("unresolvedAgentTurnShellToolPrompt");
					const name = require_string_coerce.normalizeOptionalString(raw.name) ?? require_string_coerce.normalizeOptionalString(raw.id);
					if (name) unresolvedAgentTurnPromptJobsByKind[unresolvedPromptKind].push(name);
				}
			}
		}
		const schedule = raw.schedule;
		if (schedule && typeof schedule === "object" && !Array.isArray(schedule)) {
			const sched = schedule;
			const kind = require_string_coerce.normalizeOptionalLowercaseString(sched.kind) ?? "";
			if (!kind && ("at" in sched || "atMs" in sched)) {
				sched.kind = "at";
				mutated = true;
			}
			const atRaw = require_string_coerce.normalizeOptionalString(sched.at) ?? "";
			const atMsRaw = sched.atMs;
			const parsedAtMs = typeof atMsRaw === "number" ? atMsRaw : typeof atMsRaw === "string" ? require_stagger.parseAbsoluteTimeMs(atMsRaw) : atRaw ? require_stagger.parseAbsoluteTimeMs(atRaw) : null;
			const parsedAt = parsedAtMs !== null ? require_parse_finite_number.timestampMsToIsoString(parsedAtMs) : void 0;
			const fallbackAtMs = !parsedAt && atRaw ? require_stagger.parseAbsoluteTimeMs(atRaw) : null;
			const fallbackAt = fallbackAtMs !== null ? require_parse_finite_number.timestampMsToIsoString(fallbackAtMs) : void 0;
			const normalizedAt = parsedAt ?? fallbackAt;
			if (normalizedAt) {
				sched.at = normalizedAt;
				if ("atMs" in sched) delete sched.atMs;
				mutated = true;
			}
			const everyMsRaw = sched.everyMs;
			const everyMsCoerced = require_stagger.coerceFiniteScheduleNumber(everyMsRaw);
			const everyMs = everyMsCoerced !== void 0 ? Math.floor(everyMsCoerced) : null;
			if (everyMs !== null && everyMsRaw !== everyMs) {
				sched.everyMs = everyMs;
				mutated = true;
			}
			if ((kind === "every" || sched.kind === "every") && everyMs !== null) {
				const anchorRaw = sched.anchorMs;
				const anchorCoerced = require_stagger.coerceFiniteScheduleNumber(anchorRaw);
				const normalizedAnchor = anchorCoerced !== void 0 ? Math.max(0, Math.floor(anchorCoerced)) : typeof raw.createdAtMs === "number" && Number.isFinite(raw.createdAtMs) ? Math.max(0, Math.floor(raw.createdAtMs)) : typeof raw.updatedAtMs === "number" && Number.isFinite(raw.updatedAtMs) ? Math.max(0, Math.floor(raw.updatedAtMs)) : null;
				if (normalizedAnchor !== null && anchorRaw !== normalizedAnchor) {
					sched.anchorMs = normalizedAnchor;
					mutated = true;
				}
			}
			const exprRaw = require_string_coerce.normalizeOptionalString(sched.expr) ?? "";
			const legacyCronRaw = require_string_coerce.normalizeOptionalString(sched.cron) ?? "";
			let normalizedExpr = exprRaw;
			if (!normalizedExpr && legacyCronRaw) {
				normalizedExpr = legacyCronRaw;
				sched.expr = normalizedExpr;
				mutated = true;
				trackIssue("legacyScheduleCron");
			}
			if (typeof sched.expr === "string" && sched.expr !== normalizedExpr) {
				sched.expr = normalizedExpr;
				mutated = true;
			}
			if ("cron" in sched) {
				delete sched.cron;
				mutated = true;
				trackIssue("legacyScheduleCron");
			}
			if ((kind === "cron" || sched.kind === "cron") && normalizedExpr) {
				const explicitStaggerMs = require_stagger.normalizeCronStaggerMs(sched.staggerMs);
				const defaultStaggerMs = require_stagger.resolveDefaultCronStaggerMs(normalizedExpr);
				const targetStaggerMs = explicitStaggerMs ?? defaultStaggerMs;
				if (targetStaggerMs === void 0) {
					if ("staggerMs" in sched) {
						delete sched.staggerMs;
						mutated = true;
					}
				} else if (sched.staggerMs !== targetStaggerMs) {
					sched.staggerMs = targetStaggerMs;
					mutated = true;
				}
			}
		}
		const delivery = raw.delivery;
		if (delivery && typeof delivery === "object" && !Array.isArray(delivery)) {
			const modeRaw = delivery.mode;
			if (typeof modeRaw === "string") {
				if ((require_string_coerce.normalizeOptionalLowercaseString(modeRaw) ?? "") === "deliver") {
					delivery.mode = "announce";
					mutated = true;
					trackIssue("legacyDeliveryMode");
				}
			} else if (modeRaw === void 0 || modeRaw === null) {
				delivery.mode = "announce";
				mutated = true;
			}
		}
		const isolation = raw.isolation;
		if (isolation && typeof isolation === "object" && !Array.isArray(isolation)) {
			delete raw.isolation;
			mutated = true;
		}
		const payloadKind = payloadRecord && typeof payloadRecord.kind === "string" ? payloadRecord.kind : "";
		const rawSessionTarget = require_string_coerce.normalizeOptionalString(raw.sessionTarget) ?? "";
		const loweredSessionTarget = require_string_coerce.normalizeLowercaseStringOrEmpty(rawSessionTarget);
		if (loweredSessionTarget === "main" || loweredSessionTarget === "isolated") {
			if (raw.sessionTarget !== loweredSessionTarget) {
				raw.sessionTarget = loweredSessionTarget;
				mutated = true;
			}
		} else if (loweredSessionTarget.startsWith("session:")) {
			const customSessionId = rawSessionTarget.slice(8).trim();
			if (customSessionId) {
				const normalizedSessionTarget = `session:${customSessionId}`;
				if (raw.sessionTarget !== normalizedSessionTarget) {
					raw.sessionTarget = normalizedSessionTarget;
					mutated = true;
				}
			}
		} else if (loweredSessionTarget === "current") {
			if (raw.sessionTarget !== "isolated") {
				raw.sessionTarget = "isolated";
				mutated = true;
			}
		} else {
			const inferredSessionTarget = payloadKind === "agentTurn" || payloadKind === "command" ? "isolated" : "main";
			if (raw.sessionTarget !== inferredSessionTarget) {
				raw.sessionTarget = inferredSessionTarget;
				mutated = true;
			}
		}
		const sessionTarget = require_string_coerce.normalizeOptionalLowercaseString(raw.sessionTarget) ?? "";
		const isIsolatedRunnablePayload = sessionTarget === "isolated" || sessionTarget === "current" || sessionTarget.startsWith("session:") || sessionTarget === "" && (payloadKind === "agentTurn" || payloadKind === "command");
		const hasDelivery = delivery && typeof delivery === "object" && !Array.isArray(delivery);
		const normalizedLegacy = normalizeLegacyDeliveryInput({
			delivery: hasDelivery ? delivery : null,
			payload: payloadRecord
		});
		if (isIsolatedRunnablePayload && (payloadKind === "agentTurn" || payloadKind === "command")) {
			if (!hasDelivery && normalizedLegacy.delivery) {
				raw.delivery = normalizedLegacy.delivery;
				mutated = true;
			} else if (!hasDelivery) {
				raw.delivery = { mode: "announce" };
				mutated = true;
			} else if (normalizedLegacy.mutated && normalizedLegacy.delivery) {
				raw.delivery = normalizedLegacy.delivery;
				mutated = true;
			}
		} else if (normalizedLegacy.mutated && normalizedLegacy.delivery) {
			raw.delivery = normalizedLegacy.delivery;
			mutated = true;
		}
		const invalidPersistedReason = require_persisted_shape.getInvalidPersistedCronJobReason(raw);
		if (invalidPersistedReason === "missing-schedule" || invalidPersistedReason === "invalid-schedule") {
			trackIssue("invalidSchedule");
			removedJobs.push({
				job: structuredClone(raw),
				reason: invalidPersistedReason,
				sourceIndex
			});
			mutated = true;
			continue;
		}
		if (invalidPersistedReason === "missing-payload" || invalidPersistedReason === "invalid-payload") {
			trackIssue("invalidPayload");
			removedJobs.push({
				job: structuredClone(raw),
				reason: invalidPersistedReason,
				sourceIndex
			});
			mutated = true;
			continue;
		}
		keptJobs.push(raw);
	}
	if (keptJobs.length !== jobs.length) jobs.splice(0, jobs.length, ...keptJobs);
	return {
		codexRuntimePolicyTargets: [...codexRuntimePolicyTargets.values()],
		issues,
		unresolvedAgentTurnCommandPromptJobs,
		unresolvedAgentTurnShellToolPromptJobs,
		jobs,
		mutated,
		removedJobs
	};
}
//#endregion
Object.defineProperty(exports, "archiveLegacyCronStoreForMigration", {
	enumerable: true,
	get: function() {
		return archiveLegacyCronStoreForMigration;
	}
});
Object.defineProperty(exports, "assertLegacyCronMigrationSourceCurrent", {
	enumerable: true,
	get: function() {
		return assertLegacyCronMigrationSourceCurrent;
	}
});
Object.defineProperty(exports, "collectStoredCronCodexRuntimePolicyTargets", {
	enumerable: true,
	get: function() {
		return collectStoredCronCodexRuntimePolicyTargets;
	}
});
Object.defineProperty(exports, "cronCodexRuntimePolicyTargetKey", {
	enumerable: true,
	get: function() {
		return cronCodexRuntimePolicyTargetKey;
	}
});
Object.defineProperty(exports, "legacyCronStoreFilesExist", {
	enumerable: true,
	get: function() {
		return legacyCronStoreFilesExist;
	}
});
Object.defineProperty(exports, "loadLegacyCronStoreForMigration", {
	enumerable: true,
	get: function() {
		return loadLegacyCronStoreForMigration;
	}
});
Object.defineProperty(exports, "normalizeStoredCronJobs", {
	enumerable: true,
	get: function() {
		return normalizeStoredCronJobs;
	}
});
Object.defineProperty(exports, "resolveLegacyCronMigrationId", {
	enumerable: true,
	get: function() {
		return resolveLegacyCronMigrationId;
	}
});
