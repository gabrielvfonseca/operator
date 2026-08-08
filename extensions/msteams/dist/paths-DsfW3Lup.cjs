const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_regexp = require("./regexp-C8Y0xoXY.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let node_zlib = require("node:zlib");
node_zlib = require_rolldown_runtime.__toESM(node_zlib, 1);
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/config/sessions/archive-compression.ts
const SESSION_ARCHIVE_ZSTD_SUFFIX = ".zst";
function resolveZstdCodec() {
	const candidate = node_zlib.default;
	if (typeof candidate.zstdCompressSync !== "function" || typeof candidate.zstdDecompressSync !== "function") return null;
	return {
		compress: candidate.zstdCompressSync.bind(node_zlib.default),
		decompress: candidate.zstdDecompressSync.bind(node_zlib.default)
	};
}
const zstdCodec = resolveZstdCodec();
/** Strips the optional zstd suffix so archive name parsers see one shape. */
function stripSessionArchiveCompressionSuffix(fileName) {
	return fileName.endsWith(".zst") ? fileName.slice(0, -4) : fileName;
}
/** Compresses archive content when the runtime supports zstd. */
function encodeSessionArchiveContent(content) {
	const plain = Buffer.from(content, "utf8");
	if (!zstdCodec || plain.length === 0) return {
		bytes: plain,
		suffix: ""
	};
	return {
		bytes: zstdCodec.compress(plain),
		suffix: SESSION_ARCHIVE_ZSTD_SUFFIX
	};
}
/** Reads an archived transcript, transparently decompressing zstd artifacts. */
function readSessionArchiveContentSync(filePath) {
	if (!filePath.endsWith(".zst")) return node_fs.default.readFileSync(filePath, "utf8");
	if (!zstdCodec) throw new Error(`Cannot read compressed transcript archive ${filePath}: this runtime lacks node:zlib zstd support`);
	return zstdCodec.decompress(node_fs.default.readFileSync(filePath)).toString("utf8");
}
/**
* Materializes a compressed archive as a plain JSONL cache file and returns
* the readable path; plain archives pass through untouched. Archives are
* write-once (timestamped names), so a cache hit never needs revalidation —
* this lets every downstream transcript reader (index, tail chunks, header
* probes) work on archives without learning about compression.
*/
function materializeSessionArchiveForRead(filePath) {
	if (!filePath.endsWith(".zst")) return filePath;
	const cacheDir = node_path.default.join(require_tmp_operator_dir.resolvePreferredOperatorTmpDir(), "session-archive-read-cache");
	const pathKey = (0, node_crypto.createHash)("sha256").update(filePath).digest("hex").slice(0, 32);
	let sourceStat;
	try {
		sourceStat = node_fs.default.statSync(filePath);
	} catch (error) {
		removeMaterializedArchiveCacheEntries(cacheDir, pathKey);
		throw error;
	}
	const cachePath = node_path.default.join(cacheDir, `${pathKey}-${sourceStat.size}-${Math.trunc(sourceStat.mtimeMs)}.jsonl`);
	sweepMaterializedArchiveCache(cacheDir);
	if (node_fs.default.existsSync(cachePath)) return cachePath;
	const content = readSessionArchiveContentSync(filePath);
	removeMaterializedArchiveCacheEntries(cacheDir, pathKey, node_path.default.basename(cachePath));
	node_fs.default.mkdirSync(cacheDir, {
		recursive: true,
		mode: 448
	});
	const tempPath = `${cachePath}.${process.pid}.${(0, node_crypto.randomUUID)()}.tmp`;
	node_fs.default.writeFileSync(tempPath, content, {
		encoding: "utf8",
		mode: 384
	});
	node_fs.default.renameSync(tempPath, cachePath);
	return cachePath;
}
const MATERIALIZED_ARCHIVE_CACHE_TTL_MS = 1440 * 60 * 1e3;
let lastMaterializedArchiveCacheSweepMs = 0;
function sweepMaterializedArchiveCache(cacheDir) {
	const now = Date.now();
	if (now - lastMaterializedArchiveCacheSweepMs < MATERIALIZED_ARCHIVE_CACHE_TTL_MS / 24) return;
	lastMaterializedArchiveCacheSweepMs = now;
	let entries;
	try {
		entries = node_fs.default.readdirSync(cacheDir);
	} catch {
		return;
	}
	for (const entry of entries) {
		const entryPath = node_path.default.join(cacheDir, entry);
		try {
			if (now - node_fs.default.statSync(entryPath).mtimeMs > MATERIALIZED_ARCHIVE_CACHE_TTL_MS) node_fs.default.rmSync(entryPath, { force: true });
		} catch {}
	}
}
function removeMaterializedArchiveCacheEntries(cacheDir, pathKey, keepName) {
	let entries;
	try {
		entries = node_fs.default.readdirSync(cacheDir);
	} catch {
		return;
	}
	for (const entry of entries) {
		if (!entry.startsWith(`${pathKey}-`) || entry === keepName || entry.endsWith(".tmp")) continue;
		node_fs.default.rmSync(node_path.default.join(cacheDir, entry), { force: true });
	}
}
//#endregion
//#region src/config/sessions/artifacts.ts
const ARCHIVE_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(?:\.\d{3})?Z$/;
const LEGACY_STORE_BACKUP_RE = /^sessions\.json\.bak\.\d+$/;
const MIGRATION_ARCHIVE_RE = /\.migrated(?:\.\d+)?$/u;
const COMPACTION_CHECKPOINT_TRANSCRIPT_RE = /^(.+)\.checkpoint\.([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.jsonl$/i;
function hasArchiveSuffix(fileName, reason) {
	const marker = `.${reason}.`;
	const normalized = stripSessionArchiveCompressionSuffix(fileName);
	const index = normalized.lastIndexOf(marker);
	if (index < 0) return false;
	const raw = normalized.slice(index + marker.length);
	return ARCHIVE_TIMESTAMP_RE.test(raw);
}
/** Returns true for archived session artifacts and legacy store backup names. */
function isSessionArchiveArtifactName(fileName) {
	if (LEGACY_STORE_BACKUP_RE.test(fileName)) return true;
	return hasArchiveSuffix(fileName, "deleted") || hasArchiveSuffix(fileName, "reset") || hasArchiveSuffix(fileName, "bak");
}
/** Returns true for migration rollback archives retained beside their legacy source. */
function isMigrationArchiveArtifactName(fileName) {
	return MIGRATION_ARCHIVE_RE.test(fileName);
}
const SESSION_STORE_TEMP_RE_CACHE = /* @__PURE__ */ new Map();
const SESSION_STORE_TEMP_STALE_MS = 300 * 1e3;
function sessionStoreTempPattern(storeBasename) {
	let pattern = SESSION_STORE_TEMP_RE_CACHE.get(storeBasename);
	if (!pattern) {
		pattern = new RegExp(`^${require_regexp.escapeRegExp(storeBasename)}\\.(?:\\d+\\.)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.tmp$`, "i");
		SESSION_STORE_TEMP_RE_CACHE.set(storeBasename, pattern);
	}
	return pattern;
}
function isSessionStoreTempArtifactName(fileName, storeBasename) {
	if (!storeBasename) return false;
	return sessionStoreTempPattern(storeBasename).test(fileName);
}
/** Parses a compaction checkpoint transcript filename into session/checkpoint ids. */
function parseCompactionCheckpointTranscriptFileName(fileName) {
	const match = COMPACTION_CHECKPOINT_TRANSCRIPT_RE.exec(fileName);
	const sessionId = match?.[1];
	const checkpointId = match?.[2];
	return sessionId && checkpointId ? {
		sessionId,
		checkpointId
	} : null;
}
/** Returns true when a filename is a compaction checkpoint transcript. */
function isCompactionCheckpointTranscriptFileName(fileName) {
	return parseCompactionCheckpointTranscriptFileName(fileName) !== null;
}
/** Returns true for trajectory runtime jsonl artifacts. */
function isTrajectoryRuntimeArtifactName(fileName) {
	return fileName.endsWith(".trajectory.jsonl");
}
/** Returns true for trajectory pointer artifacts. */
function isTrajectoryPointerArtifactName(fileName) {
	return fileName.endsWith(".trajectory-path.json");
}
/** Returns true for any trajectory-related session artifact. */
function isTrajectorySessionArtifactName(fileName) {
	return isTrajectoryRuntimeArtifactName(fileName) || isTrajectoryPointerArtifactName(fileName);
}
/** Returns true for primary session transcript files that represent live session history. */
function isPrimarySessionTranscriptFileName(fileName) {
	if (fileName === "sessions.json") return false;
	if (!fileName.endsWith(".jsonl")) return false;
	if (isTrajectoryRuntimeArtifactName(fileName)) return false;
	if (isCompactionCheckpointTranscriptFileName(fileName)) return false;
	return !isSessionArchiveArtifactName(fileName);
}
/** Returns true for transcript files counted in usage, including reset/deleted archives. */
function isUsageCountedSessionTranscriptFileName(fileName) {
	if (isPrimarySessionTranscriptFileName(fileName)) return true;
	return hasArchiveSuffix(fileName, "reset") || hasArchiveSuffix(fileName, "deleted");
}
/** Extracts the session id from a usage-counted transcript filename. */
function parseUsageCountedSessionIdFromFileName(fileName) {
	if (isPrimarySessionTranscriptFileName(fileName)) return fileName.slice(0, -6);
	const normalized = stripSessionArchiveCompressionSuffix(fileName);
	for (const reason of ["reset", "deleted"]) {
		const marker = `.jsonl.${reason}.`;
		const index = normalized.lastIndexOf(marker);
		if (index > 0 && hasArchiveSuffix(normalized, reason)) return normalized.slice(0, index);
	}
	return null;
}
/** Formats an archive timestamp that is safe for filenames. */
function formatSessionArchiveTimestamp(nowMs = Date.now()) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoFileStamp)(nowMs);
}
function restoreSessionArchiveTimestamp(raw) {
	const [datePart, timePart] = raw.split("T");
	if (!datePart || !timePart) return raw;
	return `${datePart}T${timePart.replace(/-/g, ":")}`;
}
function parseSessionArchiveTimestamp(fileName, reason) {
	const marker = `.${reason}.`;
	const normalized = stripSessionArchiveCompressionSuffix(fileName);
	const index = normalized.lastIndexOf(marker);
	if (index < 0) return null;
	const raw = normalized.slice(index + marker.length);
	if (!raw) return null;
	if (!ARCHIVE_TIMESTAMP_RE.test(raw)) return null;
	const timestamp = Date.parse(restoreSessionArchiveTimestamp(raw));
	return Number.isNaN(timestamp) ? null : timestamp;
}
//#endregion
//#region src/config/sessions/paths.ts
function resolveAgentSessionsDir(agentId, env = process.env, homedir = () => require_home_dir.resolveRequiredHomeDir(env, node_os.default.homedir)) {
	const root = require_paths.resolveStateDir(env, homedir);
	const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId ?? "main");
	return node_path.default.join(root, "agents", id, "sessions");
}
function resolveSessionTranscriptsDirForAgent(agentId, env = process.env, homedir = () => require_home_dir.resolveRequiredHomeDir(env, node_os.default.homedir)) {
	return resolveAgentSessionsDir(agentId, env, homedir);
}
function resolveDefaultSessionStorePath(agentId) {
	return node_path.default.join(resolveAgentSessionsDir(agentId), "sessions.json");
}
const MULTI_STORE_PATH_SENTINEL = "(multiple)";
const SQLITE_TRANSCRIPT_TARGET_PREFIX = "sqlite:";
function resolveSessionFilePathOptions(params) {
	const agentId = params.agentId?.trim();
	const storePath = params.storePath?.trim();
	if (storePath && storePath !== MULTI_STORE_PATH_SENTINEL) {
		const sessionsDir = node_path.default.dirname(node_path.default.resolve(storePath));
		return agentId ? {
			sessionsDir,
			agentId
		} : { sessionsDir };
	}
	if (agentId) return { agentId };
}
const SAFE_SESSION_ID_RE = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
function validateSessionId(sessionId) {
	const trimmed = sessionId.trim();
	if (!SAFE_SESSION_ID_RE.test(trimmed) || isCompactionCheckpointTranscriptFileName(`${trimmed}.jsonl`)) throw new Error(`Invalid session ID: ${sessionId}`);
	return trimmed;
}
function resolveSessionsDir(opts) {
	const sessionsDir = opts?.sessionsDir?.trim();
	if (sessionsDir) return node_path.default.resolve(sessionsDir);
	return resolveAgentSessionsDir(opts?.agentId);
}
function resolvePathFromAgentSessionsDir(agentSessionsDir, candidateAbsPath) {
	const agentBase = safeRealpathSync(node_path.default.resolve(agentSessionsDir)) ?? node_path.default.resolve(agentSessionsDir);
	const realCandidate = safeRealpathSync(candidateAbsPath) ?? candidateAbsPath;
	const relative = node_path.default.relative(agentBase, realCandidate);
	if (!relative || relative.startsWith("..") || node_path.default.isAbsolute(relative)) return resolveRerootedSessionPath(agentBase, candidateAbsPath);
	return node_path.default.resolve(agentBase, relative);
}
function resolveRerootedSessionPath(agentSessionsDir, candidateAbsPath) {
	const parsed = resolveAgentSessionsPathParts(candidateAbsPath);
	if (!parsed) return;
	const relativeSegments = parsed.parts.slice(parsed.sessionsIndex + 1);
	if (relativeSegments.length === 0) return;
	const rerooted = node_path.default.resolve(agentSessionsDir, ...relativeSegments);
	const contained = node_path.default.relative(agentSessionsDir, rerooted);
	if (!contained || contained.startsWith("..") || node_path.default.isAbsolute(contained)) return;
	return node_fs.default.existsSync(rerooted) ? rerooted : void 0;
}
function resolveSiblingAgentSessionsDir(baseSessionsDir, agentId) {
	const resolvedBase = node_path.default.resolve(baseSessionsDir);
	if (node_path.default.basename(resolvedBase) !== "sessions") return;
	const baseAgentDir = node_path.default.dirname(resolvedBase);
	const baseAgentsDir = node_path.default.dirname(baseAgentDir);
	if (node_path.default.basename(baseAgentsDir) !== "agents") return;
	const rootDir = node_path.default.dirname(baseAgentsDir);
	return node_path.default.join(rootDir, "agents", (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId), "sessions");
}
function resolveAgentSessionsPathParts(candidateAbsPath) {
	const parts = node_path.default.normalize(node_path.default.resolve(candidateAbsPath)).split(node_path.default.sep).filter(Boolean);
	const sessionsIndex = parts.lastIndexOf("sessions");
	if (sessionsIndex < 2 || parts[sessionsIndex - 2] !== "agents") return null;
	return {
		parts,
		sessionsIndex
	};
}
function extractAgentIdFromAbsoluteSessionPath(candidateAbsPath) {
	const parsed = resolveAgentSessionsPathParts(candidateAbsPath);
	if (!parsed) return;
	const { parts, sessionsIndex } = parsed;
	return parts[sessionsIndex - 1] || void 0;
}
function resolveStructuralSessionFallbackPath(candidateAbsPath, expectedAgentId) {
	const parsed = resolveAgentSessionsPathParts(candidateAbsPath);
	if (!parsed) return;
	const { parts, sessionsIndex } = parsed;
	const agentIdPart = parts[sessionsIndex - 1];
	if (!agentIdPart) return;
	const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentIdPart);
	if (normalizedAgentId !== (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(agentIdPart)) return;
	if (normalizedAgentId !== (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(expectedAgentId)) return;
	const relativeSegments = parts.slice(sessionsIndex + 1);
	if (relativeSegments.length !== 1) return;
	const fileName = relativeSegments[0];
	if (!fileName || fileName === "." || fileName === "..") return;
	return node_path.default.normalize(node_path.default.resolve(candidateAbsPath));
}
function safeRealpathSync(filePath) {
	try {
		return node_fs.default.realpathSync(filePath);
	} catch {
		return;
	}
}
function resolvePathWithinSessionsDir(sessionsDir, candidate, opts) {
	const trimmed = candidate.trim();
	if (!trimmed) throw new Error("Session file path must not be empty");
	const resolvedBase = node_path.default.resolve(sessionsDir);
	const realBase = safeRealpathSync(resolvedBase) ?? resolvedBase;
	const realTrimmed = node_path.default.isAbsolute(trimmed) ? safeRealpathSync(trimmed) ?? trimmed : trimmed;
	const normalized = node_path.default.isAbsolute(realTrimmed) ? node_path.default.relative(realBase, realTrimmed) : realTrimmed;
	if (normalized.startsWith("..") && node_path.default.isAbsolute(realTrimmed)) {
		const tryAgentFallback = (agentId) => {
			const normalizedAgentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
			const siblingSessionsDir = resolveSiblingAgentSessionsDir(realBase, normalizedAgentId);
			if (siblingSessionsDir) {
				const siblingResolved = resolvePathFromAgentSessionsDir(siblingSessionsDir, realTrimmed);
				if (siblingResolved) return siblingResolved;
			}
			return resolvePathFromAgentSessionsDir(resolveAgentSessionsDir(normalizedAgentId), realTrimmed);
		};
		const explicitAgentId = opts?.agentId?.trim();
		if (explicitAgentId) {
			const resolvedFromAgent = tryAgentFallback(explicitAgentId);
			if (resolvedFromAgent) return resolvedFromAgent;
		}
		const extractedAgentId = extractAgentIdFromAbsoluteSessionPath(realTrimmed);
		if (extractedAgentId) {
			const resolvedFromPath = tryAgentFallback(extractedAgentId);
			if (resolvedFromPath) return resolvedFromPath;
			const structuralFallback = resolveStructuralSessionFallbackPath(realTrimmed, extractedAgentId);
			if (structuralFallback) return structuralFallback;
		}
	}
	if (!normalized || normalized.startsWith("..") || node_path.default.isAbsolute(normalized)) throw new Error("Session file path must be within sessions directory");
	return node_path.default.resolve(realBase, normalized);
}
function resolveSessionTranscriptPathInDir(sessionId, sessionsDir, topicId) {
	const safeSessionId = validateSessionId(sessionId);
	const safeTopicId = typeof topicId === "string" ? encodeURIComponent(topicId) : typeof topicId === "number" ? String(topicId) : void 0;
	return resolvePathWithinSessionsDir(sessionsDir, safeTopicId !== void 0 ? `${safeSessionId}-topic-${safeTopicId}.jsonl` : `${safeSessionId}.jsonl`);
}
function resolveSessionTranscriptPath(sessionId, agentId, topicId) {
	return resolveSessionTranscriptPathInDir(sessionId, resolveAgentSessionsDir(agentId), topicId);
}
function resolveSessionFilePath(sessionId, entry, opts) {
	const sessionsDir = resolveSessionsDir(opts);
	const candidate = entry?.sessionFile?.trim();
	if (candidate) {
		if (candidate.startsWith(SQLITE_TRANSCRIPT_TARGET_PREFIX)) return candidate;
		try {
			return resolvePathWithinSessionsDir(sessionsDir, candidate, { agentId: opts?.agentId });
		} catch {}
	}
	return resolveSessionTranscriptPathInDir(sessionId, sessionsDir);
}
function resolveStorePath(store, opts) {
	const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(opts?.agentId ?? "main");
	const env = opts?.env ?? process.env;
	const homedir = () => require_home_dir.resolveRequiredHomeDir(env, node_os.default.homedir);
	if (!store) return node_path.default.join(resolveAgentSessionsDir(agentId, env, homedir), "sessions.json");
	if (store.includes("{agentId}")) {
		const expanded = store.replaceAll("{agentId}", agentId);
		if (expanded.startsWith("~")) return node_path.default.resolve(require_home_dir.expandHomePrefix(expanded, {
			home: require_home_dir.resolveRequiredHomeDir(env, homedir),
			env,
			homedir
		}));
		return node_path.default.resolve(expanded);
	}
	if (store.startsWith("~")) return node_path.default.resolve(require_home_dir.expandHomePrefix(store, {
		home: require_home_dir.resolveRequiredHomeDir(env, homedir),
		env,
		homedir
	}));
	return node_path.default.resolve(store);
}
function resolveAgentsDirFromSessionStorePath(storePath) {
	const candidateAbsPath = node_path.default.resolve(storePath);
	if (node_path.default.basename(candidateAbsPath) !== "sessions.json") return;
	const sessionsDir = node_path.default.dirname(candidateAbsPath);
	if (node_path.default.basename(sessionsDir) !== "sessions") return;
	const agentDir = node_path.default.dirname(sessionsDir);
	const agentsDir = node_path.default.dirname(agentDir);
	if (node_path.default.basename(agentsDir) !== "agents") return;
	return agentsDir;
}
//#endregion
Object.defineProperty(exports, "SESSION_ARCHIVE_ZSTD_SUFFIX", {
	enumerable: true,
	get: function() {
		return SESSION_ARCHIVE_ZSTD_SUFFIX;
	}
});
Object.defineProperty(exports, "SESSION_STORE_TEMP_STALE_MS", {
	enumerable: true,
	get: function() {
		return SESSION_STORE_TEMP_STALE_MS;
	}
});
Object.defineProperty(exports, "encodeSessionArchiveContent", {
	enumerable: true,
	get: function() {
		return encodeSessionArchiveContent;
	}
});
Object.defineProperty(exports, "formatSessionArchiveTimestamp", {
	enumerable: true,
	get: function() {
		return formatSessionArchiveTimestamp;
	}
});
Object.defineProperty(exports, "isCompactionCheckpointTranscriptFileName", {
	enumerable: true,
	get: function() {
		return isCompactionCheckpointTranscriptFileName;
	}
});
Object.defineProperty(exports, "isMigrationArchiveArtifactName", {
	enumerable: true,
	get: function() {
		return isMigrationArchiveArtifactName;
	}
});
Object.defineProperty(exports, "isPrimarySessionTranscriptFileName", {
	enumerable: true,
	get: function() {
		return isPrimarySessionTranscriptFileName;
	}
});
Object.defineProperty(exports, "isSessionArchiveArtifactName", {
	enumerable: true,
	get: function() {
		return isSessionArchiveArtifactName;
	}
});
Object.defineProperty(exports, "isSessionStoreTempArtifactName", {
	enumerable: true,
	get: function() {
		return isSessionStoreTempArtifactName;
	}
});
Object.defineProperty(exports, "isTrajectorySessionArtifactName", {
	enumerable: true,
	get: function() {
		return isTrajectorySessionArtifactName;
	}
});
Object.defineProperty(exports, "isUsageCountedSessionTranscriptFileName", {
	enumerable: true,
	get: function() {
		return isUsageCountedSessionTranscriptFileName;
	}
});
Object.defineProperty(exports, "materializeSessionArchiveForRead", {
	enumerable: true,
	get: function() {
		return materializeSessionArchiveForRead;
	}
});
Object.defineProperty(exports, "parseSessionArchiveTimestamp", {
	enumerable: true,
	get: function() {
		return parseSessionArchiveTimestamp;
	}
});
Object.defineProperty(exports, "parseUsageCountedSessionIdFromFileName", {
	enumerable: true,
	get: function() {
		return parseUsageCountedSessionIdFromFileName;
	}
});
Object.defineProperty(exports, "readSessionArchiveContentSync", {
	enumerable: true,
	get: function() {
		return readSessionArchiveContentSync;
	}
});
Object.defineProperty(exports, "resolveAgentsDirFromSessionStorePath", {
	enumerable: true,
	get: function() {
		return resolveAgentsDirFromSessionStorePath;
	}
});
Object.defineProperty(exports, "resolveDefaultSessionStorePath", {
	enumerable: true,
	get: function() {
		return resolveDefaultSessionStorePath;
	}
});
Object.defineProperty(exports, "resolveSessionFilePath", {
	enumerable: true,
	get: function() {
		return resolveSessionFilePath;
	}
});
Object.defineProperty(exports, "resolveSessionFilePathOptions", {
	enumerable: true,
	get: function() {
		return resolveSessionFilePathOptions;
	}
});
Object.defineProperty(exports, "resolveSessionTranscriptPath", {
	enumerable: true,
	get: function() {
		return resolveSessionTranscriptPath;
	}
});
Object.defineProperty(exports, "resolveSessionTranscriptPathInDir", {
	enumerable: true,
	get: function() {
		return resolveSessionTranscriptPathInDir;
	}
});
Object.defineProperty(exports, "resolveSessionTranscriptsDirForAgent", {
	enumerable: true,
	get: function() {
		return resolveSessionTranscriptsDirForAgent;
	}
});
Object.defineProperty(exports, "resolveStorePath", {
	enumerable: true,
	get: function() {
		return resolveStorePath;
	}
});
Object.defineProperty(exports, "validateSessionId", {
	enumerable: true,
	get: function() {
		return validateSessionId;
	}
});
