const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_transcript_events = require("./transcript-events-C9OOwQkF.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
//#region src/config/sessions/generated-transcript-session-id.ts
function extractGeneratedTranscriptSessionId(sessionFile) {
	const trimmed = sessionFile?.trim();
	if (!trimmed) return;
	const base = node_path.default.basename(trimmed);
	if (!base.endsWith(".jsonl")) return;
	const withoutExt = base.slice(0, -6);
	const topicIndex = withoutExt.indexOf("-topic-");
	if (topicIndex > 0) {
		const topicSessionId = withoutExt.slice(0, topicIndex);
		return looksLikeGeneratedSessionId(topicSessionId) ? topicSessionId : void 0;
	}
	const forkMatch = withoutExt.match(/^(\d{4}-\d{2}-\d{2}T[\w-]+(?:Z|[+-]\d{2}(?:-\d{2})?)?)_(.+)$/);
	if (forkMatch?.[2]) return looksLikeGeneratedSessionId(forkMatch[2]) ? forkMatch[2] : void 0;
	return looksLikeGeneratedSessionId(withoutExt) ? withoutExt : void 0;
}
function looksLikeGeneratedSessionId(value) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
//#endregion
//#region src/gateway/session-transcript-files.fs.ts
const MAX_RESET_ARCHIVE_DISCOVERY_CACHE_ENTRIES = 2048;
const MAX_RESET_ARCHIVE_HEADER_MATCH_CACHE_ENTRIES = 4096;
const MAX_RESET_ARCHIVE_CANDIDATES_PER_TRANSCRIPT = 128;
const resetArchiveDiscoveryCache = /* @__PURE__ */ new Map();
const resetArchiveHeaderMatchCache = /* @__PURE__ */ new Map();
function clearSessionTranscriptResetArchiveDiscoveryCache() {
	resetArchiveDiscoveryCache.clear();
	resetArchiveHeaderMatchCache.clear();
}
function deleteResetArchiveHeaderMatchesForArchives(archives) {
	if (archives.length === 0 || resetArchiveHeaderMatchCache.size === 0) return;
	const archivePaths = new Set(archives.map((archive) => archive.archivePath));
	for (const cacheKey of resetArchiveHeaderMatchCache.keys()) {
		const archivePath = cacheKey.slice(cacheKey.indexOf("\0") + 1);
		if (archivePaths.has(archivePath)) resetArchiveHeaderMatchCache.delete(cacheKey);
	}
}
function setResetArchiveDiscoveryCacheEntry(cacheKey, entry) {
	resetArchiveDiscoveryCache.set(cacheKey, entry);
	while (resetArchiveDiscoveryCache.size > MAX_RESET_ARCHIVE_DISCOVERY_CACHE_ENTRIES) {
		const oldestKey = resetArchiveDiscoveryCache.keys().next().value;
		if (typeof oldestKey !== "string") break;
		const oldestEntry = resetArchiveDiscoveryCache.get(oldestKey);
		if (oldestEntry) deleteResetArchiveHeaderMatchesForArchives(oldestEntry.archives);
		resetArchiveDiscoveryCache.delete(oldestKey);
	}
}
function setResetArchiveHeaderMatchCacheEntry(cacheKey, entry) {
	resetArchiveHeaderMatchCache.set(cacheKey, entry);
	while (resetArchiveHeaderMatchCache.size > MAX_RESET_ARCHIVE_HEADER_MATCH_CACHE_ENTRIES) {
		const oldestKey = resetArchiveHeaderMatchCache.keys().next().value;
		if (typeof oldestKey !== "string") break;
		resetArchiveHeaderMatchCache.delete(oldestKey);
	}
}
function classifySessionTranscriptCandidate(sessionId, sessionFile) {
	const transcriptSessionId = extractGeneratedTranscriptSessionId(sessionFile);
	if (!transcriptSessionId) return "custom";
	return transcriptSessionId === sessionId ? "current" : "stale";
}
function canonicalizePathForComparison(filePath) {
	const resolved = node_path.default.resolve(filePath);
	try {
		return node_fs.default.realpathSync(resolved);
	} catch {
		return resolved;
	}
}
function resolveSessionTranscriptCandidates(sessionId, storePath, sessionFile, agentId) {
	const candidates = [];
	const sessionFileState = classifySessionTranscriptCandidate(sessionId, sessionFile);
	const pushCandidate = (resolve) => {
		try {
			candidates.push(resolve());
		} catch {}
	};
	if (storePath) {
		const sessionsDir = node_path.default.dirname(storePath);
		if (sessionFile && sessionFileState !== "stale") pushCandidate(() => require_paths.resolveSessionFilePath(sessionId, { sessionFile }, {
			sessionsDir,
			agentId
		}));
		pushCandidate(() => require_paths.resolveSessionTranscriptPathInDir(sessionId, sessionsDir));
		if (sessionFile && sessionFileState === "stale") pushCandidate(() => require_paths.resolveSessionFilePath(sessionId, { sessionFile }, {
			sessionsDir,
			agentId
		}));
	} else if (sessionFile) if (agentId) {
		if (sessionFileState !== "stale") pushCandidate(() => require_paths.resolveSessionFilePath(sessionId, { sessionFile }, { agentId }));
	} else {
		const trimmed = sessionFile.trim();
		if (trimmed) candidates.push(node_path.default.resolve(trimmed));
	}
	if (agentId) {
		pushCandidate(() => require_paths.resolveSessionTranscriptPath(sessionId, agentId));
		if (sessionFile && sessionFileState === "stale") pushCandidate(() => require_paths.resolveSessionFilePath(sessionId, { sessionFile }, { agentId }));
	}
	const home = require_home_dir.resolveRequiredHomeDir(process.env, node_os.default.homedir);
	const legacyDir = node_path.default.join(home, ".operator", "sessions");
	pushCandidate(() => require_paths.resolveSessionTranscriptPathInDir(sessionId, legacyDir));
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(candidates);
}
async function resetArchiveHeaderMatchesSessionId(sessionId, archivePath) {
	let probePath;
	try {
		probePath = require_paths.materializeSessionArchiveForRead(archivePath);
	} catch {
		return false;
	}
	const stat = await node_fs.default.promises.stat(probePath).catch(() => null);
	if (!stat?.isFile()) return false;
	const cacheKey = `${sessionId}\0${archivePath}`;
	const cached = resetArchiveHeaderMatchCache.get(cacheKey);
	if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
		resetArchiveHeaderMatchCache.delete(cacheKey);
		resetArchiveHeaderMatchCache.set(cacheKey, cached);
		return cached.matches;
	}
	let matches = false;
	const handle = await node_fs.default.promises.open(probePath, "r").catch(() => null);
	if (!handle) return false;
	try {
		const buffer = Buffer.alloc(64 * 1024);
		const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
		const lines = buffer.toString("utf-8", 0, bytesRead).split(/\r?\n/);
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			const record = JSON.parse(trimmed);
			matches = Boolean(record) && typeof record === "object" && !Array.isArray(record) && record.type === "session" && record.id === sessionId;
			return matches;
		}
		return false;
	} catch {
		return false;
	} finally {
		await handle.close().catch(() => void 0);
		setResetArchiveHeaderMatchCacheEntry(cacheKey, {
			mtimeMs: stat.mtimeMs,
			size: stat.size,
			matches
		});
	}
}
async function listResetArchiveCandidatesForTranscriptAsync(transcriptPath) {
	const base = node_path.default.basename(transcriptPath);
	if (!base.endsWith(".jsonl")) return;
	const dir = node_path.default.dirname(transcriptPath);
	const dirStat = await node_fs.default.promises.stat(dir).catch(() => null);
	if (!dirStat?.isDirectory()) return;
	const cacheKey = `${dir}\0${base}`;
	const cached = resetArchiveDiscoveryCache.get(cacheKey);
	if (cached && cached.dirMtimeMs === dirStat.mtimeMs && cached.dirSize === dirStat.size) {
		resetArchiveDiscoveryCache.delete(cacheKey);
		resetArchiveDiscoveryCache.set(cacheKey, cached);
		return cached.archives;
	}
	const archives = [];
	try {
		for (const entry of await node_fs.default.promises.readdir(dir, { withFileTypes: true })) {
			if (!entry.isFile() || !entry.name.startsWith(`${base}.reset.`)) continue;
			const timestamp = require_paths.parseSessionArchiveTimestamp(entry.name, "reset");
			if (timestamp == null) continue;
			archives.push({
				archivePath: node_path.default.join(dir, entry.name),
				name: entry.name,
				timestamp
			});
		}
	} catch {
		return;
	}
	archives.sort((left, right) => right.timestamp - left.timestamp || right.name.localeCompare(left.name));
	const boundedArchives = archives.slice(0, MAX_RESET_ARCHIVE_CANDIDATES_PER_TRANSCRIPT);
	setResetArchiveDiscoveryCacheEntry(cacheKey, {
		dirMtimeMs: dirStat.mtimeMs,
		dirSize: dirStat.size,
		archives: boundedArchives
	});
	return boundedArchives;
}
async function resolveLatestResetArchiveForTranscriptAsync(sessionId, transcriptPath, opts) {
	const archives = await listResetArchiveCandidatesForTranscriptAsync(transcriptPath);
	if (!archives) return;
	if (opts?.requireSessionHeader !== true) return archives[0];
	for (const archive of archives) if (await resetArchiveHeaderMatchesSessionId(sessionId, archive.archivePath)) return archive;
}
function transcriptArchiveIdentity(sessionId, transcriptPath) {
	const generatedSessionId = extractGeneratedTranscriptSessionId(transcriptPath);
	return {
		key: node_path.default.basename(transcriptPath),
		requireSessionHeader: !generatedSessionId || generatedSessionId !== sessionId
	};
}
async function resolveSessionTranscriptResetArchiveCandidatesAsync(sessionId, storePath, sessionFile, agentId) {
	const candidatesByIdentity = /* @__PURE__ */ new Map();
	for (const candidate of resolveSessionTranscriptCandidates(sessionId, storePath, sessionFile, agentId)) {
		const identity = transcriptArchiveIdentity(sessionId, candidate);
		if (!identity) continue;
		candidatesByIdentity.set(identity.key, [...candidatesByIdentity.get(identity.key) ?? [], {
			path: candidate,
			requireSessionHeader: identity.requireSessionHeader
		}]);
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((await Promise.all(Array.from(candidatesByIdentity.values(), (candidates) => Promise.all(candidates.map((candidate) => resolveLatestResetArchiveForTranscriptAsync(sessionId, candidate.path, { requireSessionHeader: candidate.requireSessionHeader })))))).flatMap((identityArchives) => identityArchives.flatMap((archive) => archive ? [archive] : []).toSorted((left, right) => right.timestamp - left.timestamp || right.name.localeCompare(left.name)).slice(0, 1)).map((archive) => archive.archivePath));
}
function archiveFileOnDisk(filePath, reason) {
	const archived = `${filePath}.${reason}.${require_paths.formatSessionArchiveTimestamp()}`;
	node_fs.default.renameSync(filePath, archived);
	clearSessionTranscriptResetArchiveDiscoveryCache();
	require_transcript_events.emitSessionTranscriptUpdate({ sessionFile: archived });
	return archived;
}
function archiveSessionTranscriptPaths(opts) {
	const archived = [];
	const paths = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(Array.from(opts.paths, (candidate) => canonicalizePathForComparison(candidate)));
	for (const sourcePath of paths) {
		if (!node_fs.default.existsSync(sourcePath)) continue;
		try {
			archived.push({
				sourcePath,
				archivedPath: archiveFileOnDisk(sourcePath, opts.reason)
			});
		} catch (err) {
			opts.onArchiveError?.(err, sourcePath);
		}
	}
	return archived;
}
function archiveSessionTranscripts(opts) {
	return archiveSessionTranscriptsDetailed(opts).map((entry) => entry.archivedPath);
}
function archiveSessionTranscriptsDetailed(opts) {
	const candidatePaths = [];
	const storeDir = opts.restrictToStoreDir && opts.storePath ? canonicalizePathForComparison(node_path.default.dirname(opts.storePath)) : null;
	for (const candidate of resolveSessionTranscriptCandidates(opts.sessionId, opts.storePath, opts.sessionFile, opts.agentId)) {
		const candidatePath = canonicalizePathForComparison(candidate);
		if (storeDir) {
			const relative = node_path.default.relative(storeDir, candidatePath);
			if (!relative || relative.startsWith("..") || node_path.default.isAbsolute(relative)) continue;
		}
		candidatePaths.push(candidatePath);
	}
	return archiveSessionTranscriptPaths({
		paths: candidatePaths,
		reason: opts.reason,
		onArchiveError: opts.onArchiveError
	});
}
function resolveStableSessionEndTranscript(params) {
	const archivedTranscripts = params.archivedTranscripts ?? [];
	if (archivedTranscripts.length > 0) {
		const preferredPath = params.sessionFile?.trim() ? canonicalizePathForComparison(params.sessionFile) : void 0;
		const archivedPath = (preferredPath == null ? void 0 : archivedTranscripts.find((entry) => canonicalizePathForComparison(entry.sourcePath) === preferredPath))?.archivedPath ?? archivedTranscripts[0]?.archivedPath;
		if (archivedPath) return {
			sessionFile: archivedPath,
			transcriptArchived: true
		};
	}
	for (const candidate of resolveSessionTranscriptCandidates(params.sessionId, params.storePath, params.sessionFile, params.agentId)) {
		const candidatePath = canonicalizePathForComparison(candidate);
		if (node_fs.default.existsSync(candidatePath)) return {
			sessionFile: candidatePath,
			transcriptArchived: false
		};
	}
	return {};
}
async function cleanupArchivedSessionTranscripts(opts) {
	const rules = opts.rules.filter((rule) => Number.isFinite(rule.olderThanMs) && rule.olderThanMs >= 0);
	if (rules.length === 0) return {
		removed: 0,
		scanned: 0
	};
	const now = opts.nowMs ?? Date.now();
	const directories = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(opts.directories.map((dir) => node_path.default.resolve(dir)));
	let removed = 0;
	let scanned = 0;
	for (const dir of directories) {
		const entries = await node_fs.default.promises.readdir(dir).catch(() => []);
		for (const entry of entries) for (const rule of rules) {
			const timestamp = require_paths.parseSessionArchiveTimestamp(entry, rule.reason);
			if (timestamp == null) continue;
			scanned += 1;
			if (now - timestamp > rule.olderThanMs) {
				const fullPath = node_path.default.join(dir, entry);
				if ((await node_fs.default.promises.stat(fullPath).catch(() => null))?.isFile()) {
					await node_fs.default.promises.rm(fullPath).catch(() => void 0);
					removed += 1;
				}
			}
			break;
		}
	}
	return {
		removed,
		scanned
	};
}
//#endregion
Object.defineProperty(exports, "archiveSessionTranscriptPaths", {
	enumerable: true,
	get: function() {
		return archiveSessionTranscriptPaths;
	}
});
Object.defineProperty(exports, "archiveSessionTranscripts", {
	enumerable: true,
	get: function() {
		return archiveSessionTranscripts;
	}
});
Object.defineProperty(exports, "archiveSessionTranscriptsDetailed", {
	enumerable: true,
	get: function() {
		return archiveSessionTranscriptsDetailed;
	}
});
Object.defineProperty(exports, "cleanupArchivedSessionTranscripts", {
	enumerable: true,
	get: function() {
		return cleanupArchivedSessionTranscripts;
	}
});
Object.defineProperty(exports, "resolveSessionTranscriptCandidates", {
	enumerable: true,
	get: function() {
		return resolveSessionTranscriptCandidates;
	}
});
Object.defineProperty(exports, "resolveSessionTranscriptResetArchiveCandidatesAsync", {
	enumerable: true,
	get: function() {
		return resolveSessionTranscriptResetArchiveCandidatesAsync;
	}
});
Object.defineProperty(exports, "resolveStableSessionEndTranscript", {
	enumerable: true,
	get: function() {
		return resolveStableSessionEndTranscript;
	}
});
