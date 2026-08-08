const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
const require_selection = require("./selection-BpqUSi0C.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./hook-runner-global-De_h3eqM.cjs");
require("./config-DT0qiglW.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_transcript_tree = require("./transcript-tree-0YpOJFJQ.cjs");
const require_transcript_events = require("./transcript-events-C9OOwQkF.cjs");
const require_internal_hooks = require("./internal-hooks-CP-OV43M.cjs");
const require_transcript = require("./transcript-BHT2QzlI.cjs");
const require_provider_hook_runtime = require("./provider-hook-runtime-CQSINlxr.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
const require_logger = require("./logger-B-gij7u9.cjs");
const require_session_manager = require("./session-manager-Bhv4hvYF.cjs");
const require_thinking_runtime = require("./thinking-runtime-CrpgBgYy.cjs");
const require_session_utils = require("./session-utils-eOXJCZME.cjs");
const require_auth = require("./auth-Bk8NmCMz.cjs");
const require_tools = require("./tools-cldx6uki.cjs");
const require_extra_params = require("./extra-params-CBjN2etI.cjs");
const require_memory_runtime = require("./memory-runtime-Qfejy7hD.cjs");
const require_memory_search = require("./memory-search-CB0O7FbP.cjs");
const require_result_fallback_classifier = require("./result-fallback-classifier-ngBKsYXt.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_crypto = require("node:crypto");
//#region src/gateway/session-compaction-checkpoints.ts
const log = require_subsystem.createSubsystemLogger("gateway/session-compaction-checkpoints");
const MAX_COMPACTION_CHECKPOINT_LEAF_SCAN_BYTES = 64 * 1024 * 1024;
const MAX_COMPACTION_CHECKPOINT_RETAINED_BYTES_PER_SESSION = 128 * 1024 * 1024;
function resolveCompactionCheckpointTranscriptPosition(params) {
	const leafId = params.preferredLeafId ?? params.transcriptState?.leafId ?? void 0;
	const entryId = params.transcriptState?.entryId ?? leafId;
	return {
		...leafId ? { leafId } : {},
		...entryId ? { entryId } : {}
	};
}
function checkpointSnapshotPath(checkpoint) {
	return checkpoint.preCompaction.sessionFile?.trim() || void 0;
}
function checkpointSnapshotBytes(checkpoint, snapshotBytesByPath) {
	const sessionFile = checkpointSnapshotPath(checkpoint);
	if (!sessionFile) return 0;
	const bytes = snapshotBytesByPath.get(sessionFile);
	return typeof bytes === "number" && Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
}
function trimSessionCheckpoints(checkpoints, snapshotBytesByPath = /* @__PURE__ */ new Map()) {
	if (!Array.isArray(checkpoints) || checkpoints.length === 0) return {
		kept: void 0,
		removed: []
	};
	const countTrimmed = checkpoints.slice(-25);
	const countRemoved = checkpoints.slice(0, Math.max(0, checkpoints.length - countTrimmed.length));
	const keptNewestFirst = [];
	const byteRemovedNewestFirst = [];
	let retainedBytes = 0;
	for (let index = countTrimmed.length - 1; index >= 0; index -= 1) {
		const checkpoint = countTrimmed[index];
		if (!checkpoint) continue;
		const checkpointBytes = checkpointSnapshotBytes(checkpoint, snapshotBytesByPath);
		if (keptNewestFirst.length === 0 || retainedBytes + checkpointBytes <= MAX_COMPACTION_CHECKPOINT_RETAINED_BYTES_PER_SESSION) {
			keptNewestFirst.push(checkpoint);
			retainedBytes += checkpointBytes;
		} else byteRemovedNewestFirst.push(checkpoint);
	}
	const kept = keptNewestFirst.toReversed();
	return {
		kept: kept.length > 0 ? kept : void 0,
		removed: [...countRemoved, ...byteRemovedNewestFirst.toReversed()]
	};
}
function sessionStoreCheckpoints(entry) {
	return Array.isArray(entry?.compactionCheckpoints) ? [...entry.compactionCheckpoints] : [];
}
async function statCheckpointSnapshotBytes(checkpoints) {
	const bytesByPath = /* @__PURE__ */ new Map();
	await Promise.all(checkpoints.map(async (checkpoint) => {
		const sessionFile = checkpointSnapshotPath(checkpoint);
		if (!sessionFile || bytesByPath.has(sessionFile)) return;
		try {
			const stat = await node_fs_promises.default.stat(sessionFile);
			bytesByPath.set(sessionFile, stat.isFile() ? stat.size : 0);
		} catch {
			bytesByPath.set(sessionFile, 0);
		}
	}));
	return bytesByPath;
}
/** Resolve the stored checkpoint reason from compaction trigger state. */
function resolveSessionCompactionCheckpointReason(params) {
	if (params.trigger === "manual") return "manual";
	if (params.timedOut) return "timeout-retry";
	if (params.trigger === "overflow") return "overflow-retry";
	return "auto-threshold";
}
const SESSION_HEADER_READ_MAX_BYTES = 64 * 1024;
const SESSION_TAIL_READ_INITIAL_BYTES = 64 * 1024;
async function readSessionHeaderFromTranscriptAsync(sessionFile) {
	let fileHandle;
	try {
		fileHandle = await node_fs_promises.default.open(sessionFile, "r");
		const buffer = await require_transcript.readFileRangeAsync(fileHandle, 0, SESSION_HEADER_READ_MAX_BYTES);
		if (buffer.length <= 0) return null;
		const firstLine = buffer.toString("utf-8").split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0);
		if (!firstLine) return null;
		const parsed = JSON.parse(firstLine);
		if (parsed.type !== "session" || typeof parsed.id !== "string" || !parsed.id.trim()) return null;
		return {
			id: parsed.id.trim(),
			...typeof parsed.cwd === "string" && parsed.cwd.trim() ? { cwd: parsed.cwd } : {}
		};
	} catch {
		return null;
	} finally {
		if (fileHandle) await fileHandle.close().catch(() => void 0);
	}
}
async function readSessionIdFromTranscriptHeaderAsync(sessionFile) {
	return (await readSessionHeaderFromTranscriptAsync(sessionFile))?.id ?? null;
}
function parseTranscriptLine(line) {
	try {
		const parsed = JSON.parse(line);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}
async function readTranscriptEntriesForForkAsync(params) {
	const entries = [];
	const stopAfterEntryId = params.stopAfterEntryId?.trim();
	let foundStopEntry = false;
	try {
		for await (const line of require_transcript.streamSessionTranscriptLines(params.sessionFile)) try {
			const parsed = JSON.parse(line);
			if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
			entries.push(parsed);
			if (stopAfterEntryId && parsed.type !== "session" && parsed.id === stopAfterEntryId) {
				foundStopEntry = true;
				break;
			}
		} catch {}
	} catch {
		return null;
	}
	const firstEntry = entries[0];
	if (firstEntry?.type !== "session" || typeof firstEntry.id !== "string") return null;
	if (stopAfterEntryId && !foundStopEntry) return null;
	return entries;
}
function trimTranscriptEntriesThroughLeaf(entries, leafId) {
	const normalizedLeafId = leafId?.trim();
	if (!normalizedLeafId) return entries;
	const leafIndex = entries.findIndex((entry, index) => index > 0 && entry.id === normalizedLeafId);
	if (leafIndex < 1) return null;
	return entries.slice(0, leafIndex + 1);
}
async function readSessionLeafStateFromTranscriptAsync(sessionFile, maxBytes = MAX_COMPACTION_CHECKPOINT_LEAF_SCAN_BYTES) {
	const sqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(sessionFile);
	if (sqliteMarker) return readSessionLeafStateFromRecords(require_session_accessor.loadTranscriptEventsSync(sqliteMarker).filter((event) => Boolean(event) && typeof event === "object" && !Array.isArray(event)));
	let fileHandle;
	try {
		fileHandle = await node_fs_promises.default.open(sessionFile, "r");
		const stat = await fileHandle.stat();
		if (!stat.isFile() || stat.size <= 0) return null;
		const requestedMaxBytes = Number.isFinite(maxBytes) ? Math.max(1024, Math.floor(maxBytes)) : MAX_COMPACTION_CHECKPOINT_LEAF_SCAN_BYTES;
		const maxReadableBytes = Math.min(stat.size, requestedMaxBytes);
		let readLength = Math.min(maxReadableBytes, SESSION_TAIL_READ_INITIAL_BYTES);
		while (readLength > 0) {
			const readStart = Math.max(0, stat.size - readLength);
			const lines = (await require_transcript.readFileRangeAsync(fileHandle, readStart, readLength)).toString("utf-8").split(/\r?\n/);
			const candidateLines = readStart > 0 ? lines.slice(1) : lines;
			const records = [];
			let latestEntryId;
			for (const candidateLine of candidateLines) {
				const line = candidateLine.trim();
				if (!line) continue;
				const parsed = parseTranscriptLine(line);
				if (!parsed) continue;
				records.push(parsed);
				if (parsed.type === "session") continue;
				const entryId = typeof parsed.id === "string" ? parsed.id.trim() : "";
				if (entryId) latestEntryId = entryId;
			}
			const tree = require_transcript_tree.scanSessionTranscriptTree(records);
			if (latestEntryId && tree.hasLeafUpdate && (!tree.hasInvalidLeafControl || readStart === 0)) return {
				entryId: latestEntryId,
				leafId: tree.leafId
			};
			if (readStart === 0) return null;
			const nextReadLength = Math.min(maxReadableBytes, readLength * 2);
			if (nextReadLength === readLength) return latestEntryId ? {
				entryId: latestEntryId,
				leafId: latestEntryId
			} : null;
			readLength = nextReadLength;
		}
	} catch {
		return null;
	} finally {
		if (fileHandle) await fileHandle.close().catch(() => void 0);
	}
	return null;
}
function readSessionLeafStateFromRecords(records) {
	let latestEntryId;
	for (const record of records) {
		if (record.type === "session") continue;
		const entryId = typeof record.id === "string" ? record.id.trim() : "";
		if (entryId) latestEntryId = entryId;
	}
	if (!latestEntryId) return null;
	const tree = require_transcript_tree.scanSessionTranscriptTree(records);
	return {
		entryId: latestEntryId,
		leafId: tree.leafId
	};
}
async function forkCompactionCheckpointTranscriptAsync(params) {
	const sourceFile = params.sourceFile.trim();
	if (!sourceFile) return null;
	const sourceHeader = await readSessionHeaderFromTranscriptAsync(sourceFile);
	if (!sourceHeader) return null;
	const entries = await readTranscriptEntriesForForkAsync({
		sessionFile: sourceFile,
		stopAfterEntryId: params.sourceLeafId
	});
	if (!entries) return null;
	require_session_manager.migrateSessionEntries(entries);
	const forkEntries = trimTranscriptEntriesThroughLeaf(entries, params.sourceLeafId);
	if (!forkEntries) return null;
	const targetCwd = params.targetCwd ?? sourceHeader.cwd ?? process.cwd();
	const sessionDir = params.sessionDir ?? node_path.default.dirname(sourceFile);
	const sessionId = (0, node_crypto.randomUUID)();
	const timestamp = (/* @__PURE__ */ new Date()).toISOString();
	const fileTimestamp = timestamp.replace(/[:.]/g, "-");
	const sessionFile = node_path.default.join(sessionDir, `${fileTimestamp}_${sessionId}.jsonl`);
	const header = {
		type: "session",
		version: 3,
		id: sessionId,
		timestamp,
		cwd: targetCwd,
		parentSession: sourceFile
	};
	try {
		await node_fs_promises.default.mkdir(sessionDir, { recursive: true });
		const lines = [JSON.stringify(header)];
		for (const entry of forkEntries) if (entry.type !== "session") lines.push(JSON.stringify(entry));
		await node_fs_promises.default.writeFile(sessionFile, `${lines.join("\n")}\n`, {
			encoding: "utf-8",
			flag: "wx"
		});
		return {
			sessionId,
			sessionFile
		};
	} catch {
		try {
			await node_fs_promises.default.unlink(sessionFile);
		} catch {}
		return null;
	}
}
function resolveCheckpointTranscriptForkSource(checkpoint) {
	const preCompactionFile = checkpoint.preCompaction.sessionFile?.trim();
	if (preCompactionFile) return {
		sourceFile: preCompactionFile,
		sourceLeafId: checkpoint.preCompaction.entryId ?? checkpoint.preCompaction.leafId,
		totalTokens: checkpoint.tokensBefore
	};
	const postCompactionFile = checkpoint.postCompaction.sessionFile?.trim();
	if (!postCompactionFile) return null;
	const postCompactionLeafId = checkpoint.postCompaction.entryId ?? checkpoint.postCompaction.leafId;
	if (!postCompactionLeafId) return null;
	return {
		sourceFile: postCompactionFile,
		sourceLeafId: postCompactionLeafId,
		totalTokens: checkpoint.tokensAfter
	};
}
async function forkCheckpointTranscriptFromStoredBoundary(params) {
	const forkSource = resolveCheckpointTranscriptForkSource(params.checkpoint);
	if (!forkSource) return { status: "missing-boundary" };
	const forked = await forkCompactionCheckpointTranscriptAsync({
		sourceFile: forkSource.sourceFile,
		sourceLeafId: forkSource.sourceLeafId,
		sessionDir: params.sessionDir ?? node_path.default.dirname(forkSource.sourceFile),
		...params.targetCwd ? { targetCwd: params.targetCwd } : {}
	});
	if (!forked) return { status: "failed" };
	return {
		status: "created",
		transcript: {
			...forked,
			...typeof forkSource.totalTokens === "number" ? { totalTokens: forkSource.totalTokens } : {}
		}
	};
}
function cloneCheckpointSessionEntry(params) {
	return {
		...params.currentEntry,
		sessionId: params.nextSessionId,
		sessionFile: params.nextSessionFile,
		updatedAt: Date.now(),
		systemSent: false,
		abortedLastRun: false,
		startedAt: void 0,
		endedAt: void 0,
		runtimeMs: void 0,
		status: void 0,
		inputTokens: void 0,
		outputTokens: void 0,
		cacheRead: void 0,
		cacheWrite: void 0,
		estimatedCostUsd: void 0,
		totalTokens: typeof params.totalTokens === "number" && Number.isFinite(params.totalTokens) ? params.totalTokens : void 0,
		totalTokensFresh: typeof params.totalTokens === "number" && Number.isFinite(params.totalTokens) ? true : void 0,
		label: params.label ?? params.currentEntry.label,
		parentSessionKey: params.parentSessionKey ?? params.currentEntry.parentSessionKey,
		archivedAt: params.preserveManagementState ? params.currentEntry.archivedAt : void 0,
		pinnedAt: params.preserveManagementState ? params.currentEntry.pinnedAt : void 0,
		compactionCheckpoints: params.preserveCompactionCheckpoints ? params.currentEntry.compactionCheckpoints : void 0
	};
}
async function branchCheckpointSessionFromStoredBoundary(params) {
	if (shouldRouteCheckpointSessionMutationToSqlite({
		checkpointId: params.checkpointId,
		...params.agentId ? { agentId: params.agentId } : {},
		sessionKey: params.sourceStoreKey ?? params.sourceKey,
		storePath: params.storePath
	})) return await require_session_accessor.branchSqliteCompactionCheckpointSession({
		...params.agentId ? { agentId: params.agentId } : {},
		storePath: params.storePath,
		sourceKey: params.sourceKey,
		nextKey: params.nextKey,
		checkpointId: params.checkpointId,
		...params.sourceStoreKey ? { sourceStoreKey: params.sourceStoreKey } : {}
	});
	return await require_session_accessor.branchSessionFromCompactionCheckpoint({
		storePath: params.storePath,
		sourceKey: params.sourceKey,
		nextKey: params.nextKey,
		checkpointId: params.checkpointId,
		...params.sourceStoreKey ? { sourceStoreKey: params.sourceStoreKey } : {},
		forkTranscriptFromCheckpoint: async (checkpoint) => await forkCheckpointTranscriptFromStoredBoundary({ checkpoint }),
		buildEntry: ({ currentEntry, forkedTranscript }) => {
			const label = currentEntry.label?.trim() ? `${currentEntry.label.trim()} (checkpoint)` : "Checkpoint branch";
			return cloneCheckpointSessionEntry({
				currentEntry,
				nextSessionId: forkedTranscript.sessionId,
				nextSessionFile: forkedTranscript.sessionFile,
				label,
				parentSessionKey: params.sourceKey,
				totalTokens: forkedTranscript.totalTokens
			});
		}
	});
}
async function restoreCheckpointSessionFromStoredBoundary(params) {
	if (shouldRouteCheckpointSessionMutationToSqlite({
		checkpointId: params.checkpointId,
		...params.agentId ? { agentId: params.agentId } : {},
		sessionKey: params.sessionStoreKey ?? params.sessionKey,
		storePath: params.storePath
	})) return await require_session_accessor.restoreSqliteCompactionCheckpointSession({
		...params.agentId ? { agentId: params.agentId } : {},
		storePath: params.storePath,
		sessionKey: params.sessionKey,
		checkpointId: params.checkpointId,
		...params.sessionStoreKey ? { sessionStoreKey: params.sessionStoreKey } : {}
	});
	return await require_session_accessor.restoreSessionFromCompactionCheckpoint({
		storePath: params.storePath,
		sessionKey: params.sessionKey,
		checkpointId: params.checkpointId,
		...params.sessionStoreKey ? { sessionStoreKey: params.sessionStoreKey } : {},
		forkTranscriptFromCheckpoint: async (checkpoint) => await forkCheckpointTranscriptFromStoredBoundary({ checkpoint }),
		buildEntry: ({ currentEntry, forkedTranscript }) => cloneCheckpointSessionEntry({
			currentEntry,
			nextSessionId: forkedTranscript.sessionId,
			nextSessionFile: forkedTranscript.sessionFile,
			totalTokens: forkedTranscript.totalTokens,
			preserveCompactionCheckpoints: true,
			preserveManagementState: true
		})
	});
}
function shouldRouteCheckpointSessionMutationToSqlite(params) {
	const entry = require_session_accessor.loadSessionEntry({
		...params.agentId ? { agentId: params.agentId } : {},
		sessionKey: params.sessionKey,
		storePath: params.storePath
	});
	if (!entry) return false;
	if (require_sqlite_marker.parseSqliteSessionFileMarker(entry.sessionFile)) return true;
	const checkpoint = entry.compactionCheckpoints?.find((candidate) => candidate.checkpointId === params.checkpointId);
	const preCheckpointFile = checkpoint?.preCompaction.sessionFile?.trim();
	const postCheckpointFile = checkpoint?.postCompaction.sessionFile?.trim();
	if (require_sqlite_marker.parseSqliteSessionFileMarker(preCheckpointFile) || require_sqlite_marker.parseSqliteSessionFileMarker(postCheckpointFile)) return true;
	const hasCheckpointFile = Boolean(preCheckpointFile) || Boolean(postCheckpointFile);
	return (Boolean(checkpoint?.preCompaction.entryId?.trim()) || Boolean(checkpoint?.postCompaction.entryId?.trim())) && !hasCheckpointFile;
}
/**
* Creates the current file-backed compaction checkpoint domain store.
*
* The branch/restore operations own the transcript fork plus session entry
* update so a SQLite implementation can copy transcript rows and update
* `session_entries.entry_json` inside one write transaction.
*/
function createFileBackedCompactionCheckpointStore() {
	return {
		captureSnapshot: captureCompactionCheckpointSnapshotAsync,
		persistCheckpoint: persistSessionCompactionCheckpoint,
		cleanupSnapshot: cleanupCompactionCheckpointSnapshot,
		branchCheckpointSession: branchCheckpointSessionFromStoredBoundary,
		restoreCheckpointSession: restoreCheckpointSessionFromStoredBoundary
	};
}
/**
* Capture the stable pre-compaction identity without duplicating the transcript.
* Branch/restore uses the compacted successor transcript, while legacy
* checkpoints that already have a snapshot file keep working.
*/
async function captureCompactionCheckpointSnapshotAsync(params) {
	const getLeafId = params.sessionManager && typeof params.sessionManager.getLeafId === "function" ? params.sessionManager.getLeafId.bind(params.sessionManager) : null;
	const sessionFile = params.sessionFile.trim();
	if (!sessionFile || params.sessionManager && !getLeafId) return null;
	const liveLeafId = getLeafId ? getLeafId() : void 0;
	if (getLeafId && !liveLeafId) return null;
	const maxBytes = params.maxBytes ?? MAX_COMPACTION_CHECKPOINT_LEAF_SCAN_BYTES;
	const sqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(sessionFile);
	if (sqliteMarker) {
		if (typeof params.sessionManager?.getEntries !== "function") return null;
		const position = resolveCompactionCheckpointTranscriptPosition({
			preferredLeafId: liveLeafId,
			transcriptState: readSessionLeafStateFromRecords(params.sessionManager.getEntries())
		});
		const leafId = position.leafId;
		if (!leafId) return null;
		return {
			sessionId: typeof params.sessionManager.getSessionId === "function" ? params.sessionManager.getSessionId() : sqliteMarker.sessionId,
			leafId,
			...position.entryId ? { entryId: position.entryId } : {}
		};
	}
	const sessionId = await readSessionIdFromTranscriptHeaderAsync(sessionFile);
	const position = resolveCompactionCheckpointTranscriptPosition({
		preferredLeafId: liveLeafId,
		transcriptState: await readSessionLeafStateFromTranscriptAsync(sessionFile, maxBytes)
	});
	const leafId = position.leafId;
	if (!sessionId || !leafId) return null;
	return {
		sessionId,
		leafId,
		...position.entryId ? { entryId: position.entryId } : {}
	};
}
async function cleanupCompactionCheckpointSnapshot(snapshot) {
	if (!snapshot?.sessionFile) return;
	try {
		await node_fs_promises.default.unlink(snapshot.sessionFile);
	} catch {}
}
async function cleanupTrimmedCompactionCheckpointFiles(params) {
	if (params.removed.length === 0 || !params.artifactDir) return;
	const artifactDir = node_path.default.resolve(params.artifactDir);
	const retainedPaths = new Set((params.retained ?? []).map((checkpoint) => checkpoint.preCompaction.sessionFile?.trim()).filter((filePath) => Boolean(filePath)));
	for (const checkpoint of params.removed) {
		const sessionFile = checkpoint.preCompaction.sessionFile?.trim();
		if (!sessionFile || retainedPaths.has(sessionFile)) continue;
		const resolvedSessionFile = node_path.default.resolve(sessionFile);
		if (node_path.default.dirname(resolvedSessionFile) !== artifactDir || !require_paths.isCompactionCheckpointTranscriptFileName(node_path.default.basename(resolvedSessionFile))) continue;
		try {
			await node_fs_promises.default.unlink(resolvedSessionFile);
		} catch {}
	}
}
async function persistSessionCompactionCheckpoint(params) {
	const snapshotSessionFile = params.snapshot.sessionFile?.trim();
	const postSessionFile = params.postSessionFile?.trim();
	const snapshotSqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(snapshotSessionFile);
	const postSqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(postSessionFile);
	const snapshotArtifactFile = snapshotSqliteMarker ? void 0 : snapshotSessionFile;
	const postArtifactFile = postSqliteMarker ? void 0 : postSessionFile;
	const postSourceLeafId = params.postEntryId?.trim() || params.postLeafId?.trim();
	if (!snapshotArtifactFile && !postSourceLeafId) {
		log.warn("skipping compaction checkpoint persist: missing stable fork source", { sessionKey: params.sessionKey });
		return null;
	}
	const target = require_session_utils.resolveGatewaySessionStoreTarget({
		cfg: params.cfg,
		key: params.sessionKey
	});
	const createdAt = params.createdAt ?? Date.now();
	const checkpoint = {
		checkpointId: (0, node_crypto.randomUUID)(),
		sessionKey: target.canonicalKey,
		sessionId: params.sessionId,
		createdAt,
		reason: params.reason,
		...typeof params.tokensBefore === "number" ? { tokensBefore: params.tokensBefore } : {},
		...typeof params.tokensAfter === "number" ? { tokensAfter: params.tokensAfter } : {},
		...params.summary?.trim() ? { summary: params.summary.trim() } : {},
		...params.firstKeptEntryId?.trim() ? { firstKeptEntryId: params.firstKeptEntryId.trim() } : {},
		preCompaction: {
			sessionId: params.snapshot.sessionId,
			...snapshotArtifactFile ? { sessionFile: snapshotArtifactFile } : {},
			leafId: params.snapshot.leafId,
			...params.snapshot.entryId?.trim() ? { entryId: params.snapshot.entryId.trim() } : {}
		},
		postCompaction: {
			sessionId: params.sessionId,
			...postArtifactFile ? { sessionFile: postArtifactFile } : {},
			...params.postLeafId?.trim() ? { leafId: params.postLeafId.trim() } : {},
			...params.postEntryId?.trim() ? { entryId: params.postEntryId.trim() } : {}
		}
	};
	let trimmedCheckpoints;
	let stored = false;
	if (!await require_session_accessor.updateSessionEntry({
		storePath: target.storePath,
		sessionKey: target.canonicalKey
	}, async (existing) => {
		if (!existing.sessionId) return null;
		const checkpoints = sessionStoreCheckpoints(existing);
		checkpoints.push(checkpoint);
		trimmedCheckpoints = trimSessionCheckpoints(checkpoints, await statCheckpointSnapshotBytes(checkpoints));
		stored = true;
		return {
			updatedAt: Math.max(existing.updatedAt ?? 0, createdAt),
			compactionCheckpoints: trimmedCheckpoints.kept
		};
	}) || !stored) {
		log.warn("skipping compaction checkpoint persist: session not found", { sessionKey: params.sessionKey });
		return null;
	}
	const checkpointArtifactFile = snapshotArtifactFile || postArtifactFile || "";
	await cleanupTrimmedCompactionCheckpointFiles({
		removed: trimmedCheckpoints?.removed ?? [],
		retained: trimmedCheckpoints?.kept,
		...checkpointArtifactFile ? { artifactDir: node_path.default.dirname(checkpointArtifactFile) } : {}
	});
	return checkpoint;
}
function listSessionCompactionCheckpoints(entry) {
	return sessionStoreCheckpoints(entry).toSorted((a, b) => b.createdAt - a.createdAt);
}
function getSessionCompactionCheckpoint(params) {
	const checkpointId = params.checkpointId.trim();
	if (!checkpointId) return;
	return listSessionCompactionCheckpoints(params.entry).find((checkpoint) => checkpoint.checkpointId === checkpointId);
}
//#endregion
//#region src/agents/embedded-agent-runner/compaction-harness-model-provider.ts
function buildCompactionHarnessModelProvider(params) {
	const route = params.plan?.modelRoute;
	return {
		api: route?.api ?? params.model?.api,
		baseUrl: route?.baseUrl ?? params.model?.baseUrl,
		...require_thinking_runtime.resolveAgentHarnessPreparedRouteSupport(params.plan),
		...params.plan ? { preparedAuth: require_thinking_runtime.resolveAgentHarnessPreparedAuthSupport({
			plan: params.plan,
			source: params.attempt?.kind === "implicit" ? void 0 : params.attempt?.kind
		}) } : {}
	};
}
//#endregion
//#region src/agents/embedded-agent-runner/compaction-hooks.ts
function resolvePostCompactionIndexSyncMode(config) {
	const mode = config?.agents?.defaults?.compaction?.postIndexSync;
	if (mode === "off" || mode === "async" || mode === "await") return mode;
	return "async";
}
async function runPostCompactionSessionMemorySync(params) {
	if (!params.config) return;
	try {
		const sessionFile = params.sessionFile.trim();
		if (!sessionFile) return;
		const agentId = require_agent_scope.resolveSessionAgentId({
			sessionKey: params.sessionKey,
			config: params.config,
			agentId: params.agentId
		});
		const resolvedMemory = require_memory_search.resolveMemorySearchConfig(params.config, agentId);
		if (!resolvedMemory?.sources.includes("sessions")) return;
		if (!resolvedMemory.sync.sessions.postCompactionForce) return;
		const { manager } = await require_memory_runtime.getActiveMemorySearchManager({
			cfg: params.config,
			agentId
		});
		if (!manager?.sync) return;
		const sessionId = params.sessionId?.trim();
		await manager.sync({
			reason: "post-compaction",
			...sessionId ? { sessions: [{
				agentId,
				sessionId,
				...params.sessionKey ? { sessionKey: params.sessionKey } : {}
			}] } : { archiveFiles: [sessionFile] }
		});
	} catch (err) {
		require_logger.log.warn(`memory sync skipped (post-compaction): ${require_errors.formatErrorMessage(err)}`);
	}
}
function syncPostCompactionSessionMemory(params) {
	if (params.mode === "off" || !params.config) return Promise.resolve();
	const syncTask = runPostCompactionSessionMemorySync({
		config: params.config,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		agentId: params.agentId,
		sessionFile: params.sessionFile
	});
	if (params.mode === "await") return syncTask;
	return Promise.resolve();
}
/** Emits post-compaction transcript and memory-index side effects for a compacted session file. */
async function runPostCompactionSideEffects(params) {
	const sessionFile = params.sessionFile.trim();
	if (!sessionFile) return;
	require_transcript_events.emitSessionTranscriptUpdate({
		sessionFile,
		sessionKey: params.sessionKey,
		...params.sessionId ? { sessionId: params.sessionId } : {},
		...params.agentId ? { agentId: params.agentId } : {}
	});
	await syncPostCompactionSessionMemory({
		config: params.config,
		sessionKey: params.sessionKey,
		sessionId: params.sessionId,
		agentId: params.agentId,
		sessionFile,
		mode: resolvePostCompactionIndexSyncMode(params.config)
	});
}
/** Converts the global hook runner into the compaction-specific hook shape. */
function asCompactionHookRunner(hookRunner) {
	if (!hookRunner) return null;
	return {
		hasHooks: (hookName) => hookRunner.hasHooks?.(hookName) ?? false,
		runBeforeCompaction: hookRunner.runBeforeCompaction?.bind(hookRunner),
		runAfterCompaction: hookRunner.runAfterCompaction?.bind(hookRunner)
	};
}
function estimateTokenCountSafe(messages, estimateTokensFn) {
	try {
		let total = 0;
		for (const message of messages) total += estimateTokensFn(message);
		return total;
	} catch {
		return;
	}
}
/** Builds before-hook metrics while tolerating providers that cannot estimate all messages. */
function buildBeforeCompactionHookMetrics(params) {
	return {
		messageCountOriginal: params.originalMessages.length,
		tokenCountOriginal: estimateTokenCountSafe(params.originalMessages, params.estimateTokensFn),
		messageCountBefore: params.currentMessages.length,
		tokenCountBefore: params.observedTokenCount ?? estimateTokenCountSafe(params.currentMessages, params.estimateTokensFn)
	};
}
/** Runs internal and plugin before-compaction hooks, forwarding hook-produced messages. */
async function runBeforeCompactionHooks(params) {
	const missingSessionKey = !params.sessionKey?.trim();
	const hookSessionKey = params.sessionKey?.trim() || params.sessionId;
	try {
		const hookEvent = require_internal_hooks.createInternalHookEvent("session", "compact:before", hookSessionKey, {
			sessionId: params.sessionId,
			missingSessionKey,
			messageCount: params.metrics.messageCountBefore,
			tokenCount: params.metrics.tokenCountBefore,
			messageCountOriginal: params.metrics.messageCountOriginal,
			tokenCountOriginal: params.metrics.tokenCountOriginal
		});
		await require_internal_hooks.triggerInternalHook(hookEvent);
		if (hookEvent.messages.length > 0) await params.onHookMessages?.({
			phase: "before",
			messages: hookEvent.messages.slice(),
			sessionId: params.sessionId,
			sessionKey: hookSessionKey
		});
	} catch (err) {
		require_logger.log.warn("session:compact:before hook failed", {
			errorMessage: require_errors.formatErrorMessage(err),
			errorStack: err instanceof Error ? err.stack : void 0
		});
	}
	if (params.hookRunner?.hasHooks?.("before_compaction")) try {
		await params.hookRunner.runBeforeCompaction?.({
			messageCount: params.metrics.messageCountBefore,
			tokenCount: params.metrics.tokenCountBefore
		}, {
			sessionId: params.sessionId,
			agentId: params.sessionAgentId,
			sessionKey: hookSessionKey,
			workspaceDir: params.workspaceDir,
			messageProvider: params.messageProvider
		});
	} catch (err) {
		require_logger.log.warn("before_compaction hook failed", {
			errorMessage: require_errors.formatErrorMessage(err),
			errorStack: err instanceof Error ? err.stack : void 0
		});
	}
	return {
		hookSessionKey,
		missingSessionKey
	};
}
/** Estimates compacted-session token count and rejects impossible growth from stale estimates. */
function estimateTokensAfterCompaction(params) {
	const tokensAfter = estimateTokenCountSafe(params.messagesAfter, params.estimateTokensFn);
	if (tokensAfter === void 0) return;
	const sanityCheckBaseline = params.observedTokenCount ?? params.fullSessionTokensBefore;
	if (sanityCheckBaseline > 0 && tokensAfter > (params.observedTokenCount !== void 0 ? sanityCheckBaseline : sanityCheckBaseline * 1.1)) return;
	return tokensAfter;
}
/** Runs internal and plugin after-compaction hooks with the final compacted metrics. */
async function runAfterCompactionHooks(params) {
	try {
		const hookEvent = require_internal_hooks.createInternalHookEvent("session", "compact:after", params.hookSessionKey, {
			sessionId: params.sessionId,
			missingSessionKey: params.missingSessionKey,
			messageCount: params.messageCountAfter,
			tokenCount: params.tokensAfter,
			compactedCount: params.compactedCount,
			summaryLength: params.summaryLength,
			tokensBefore: params.tokensBefore,
			tokensAfter: params.tokensAfter,
			firstKeptEntryId: params.firstKeptEntryId
		});
		await require_internal_hooks.triggerInternalHook(hookEvent);
		if (hookEvent.messages.length > 0) await params.onHookMessages?.({
			phase: "after",
			messages: hookEvent.messages.slice(),
			sessionId: params.sessionId,
			sessionKey: params.hookSessionKey
		});
	} catch (err) {
		require_logger.log.warn("session:compact:after hook failed", {
			errorMessage: require_errors.formatErrorMessage(err),
			errorStack: err instanceof Error ? err.stack : void 0
		});
	}
	if (params.hookRunner?.hasHooks?.("after_compaction")) try {
		await params.hookRunner.runAfterCompaction?.({
			messageCount: params.messageCountAfter,
			tokenCount: params.tokensAfter,
			compactedCount: params.compactedCount,
			sessionFile: params.sessionFile,
			...params.previousSessionId ? { previousSessionId: params.previousSessionId } : {}
		}, {
			sessionId: params.sessionId,
			agentId: params.sessionAgentId,
			sessionKey: params.hookSessionKey,
			workspaceDir: params.workspaceDir,
			messageProvider: params.messageProvider
		});
	} catch (err) {
		require_logger.log.warn("after_compaction hook failed", {
			errorMessage: require_errors.formatErrorMessage(err),
			errorStack: err instanceof Error ? err.stack : void 0
		});
	}
}
//#endregion
//#region src/agents/embedded-agent-runner/model-context-tokens.ts
/** Returns finite context-token metadata when a model discovery source provided it. */
/** Prefer contextTokens, then contextWindow, when present on model metadata. */
function readAgentModelContextTokens(model) {
	const value = model?.contextTokens;
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
//#endregion
//#region src/agents/runtime-plan/build.ts
function formatResolvedRef(params) {
	return `${params.provider}/${params.modelId}`;
}
function asOperatorConfig(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function asProviderRuntimeModel(value) {
	return value !== void 0 ? value : void 0;
}
function isProviderRuntimePluginHandle(value) {
	return value !== void 0 && "plugin" in value;
}
function resolveProviderRuntimeHandleForPlugins(params) {
	if (isProviderRuntimePluginHandle(params.runtimeHandle) && (params.runtimeHandle.plugin || !params.modelId || params.runtimeHandle.modelId === params.modelId)) return params.runtimeHandle;
	if (!params.runtimeHandle && !params.resolveWhenMissing) return;
	return require_provider_hook_runtime.resolveProviderRuntimePluginHandle({
		provider: params.runtimeHandle?.provider ?? params.provider,
		modelId: params.modelId,
		config: asOperatorConfig(params.runtimeHandle?.config) ?? params.config,
		workspaceDir: params.runtimeHandle?.workspaceDir ?? params.workspaceDir,
		env: params.runtimeHandle?.env ?? process.env,
		applyAutoEnable: params.runtimeHandle?.applyAutoEnable,
		bundledProviderVitestCompat: params.runtimeHandle?.bundledProviderVitestCompat
	});
}
/** Build delivery-specific runtime decisions for one provider/model. */
function buildAgentRuntimeDeliveryPlan(params) {
	const config = asOperatorConfig(params.config);
	const providerRuntimeHandle = resolveProviderRuntimeHandleForPlugins({
		provider: params.provider,
		modelId: params.modelId,
		config,
		workspaceDir: params.workspaceDir,
		runtimeHandle: params.providerRuntimeHandle
	});
	return {
		isSilentPayload(payload) {
			return require_tokens.isSilentReplyPayloadText(payload.text, "NO_REPLY") && !require_payload.hasReplyPayloadContent({
				...payload,
				text: void 0
			}, { trimText: true });
		},
		resolveFollowupRoute(routeParams) {
			return require_provider_hook_runtime.resolveProviderFollowupFallbackRoute({
				provider: params.provider,
				config,
				workspaceDir: params.workspaceDir,
				runtimeHandle: providerRuntimeHandle,
				context: {
					config,
					agentDir: params.agentDir,
					workspaceDir: params.workspaceDir,
					provider: params.provider,
					modelId: params.modelId,
					payload: routeParams.payload,
					originatingChannel: routeParams.originatingChannel,
					originatingTo: routeParams.originatingTo,
					originRoutable: routeParams.originRoutable,
					dispatcherAvailable: routeParams.dispatcherAvailable
				}
			});
		}
	};
}
/** Build run-outcome classification hooks for model fallback decisions. */
function buildAgentRuntimeOutcomePlan() {
	return { classifyRunResult: require_result_fallback_classifier.classifyEmbeddedAgentRunResultForModelFallback };
}
/** Build the complete runtime plan for an embedded agent attempt. */
function buildAgentRuntimePlan(params) {
	const config = asOperatorConfig(params.config);
	const model = asProviderRuntimeModel(params.model);
	const modelApi = params.modelApi ?? params.model?.api ?? void 0;
	const transport = params.resolvedTransport;
	const toolPlanningConfig = config ? require_io.projectConfigOntoRuntimeSourceSnapshot(config) : void 0;
	let toolPlanningMetadataSnapshot;
	const loadToolPlanningMetadataSnapshot = () => {
		toolPlanningMetadataSnapshot ??= require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
			config: toolPlanningConfig,
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
			env: process.env
		});
		return toolPlanningMetadataSnapshot;
	};
	const providerRuntimeHandleForPlugins = resolveProviderRuntimeHandleForPlugins({
		provider: params.provider,
		modelId: params.modelId,
		config,
		workspaceDir: params.workspaceDir,
		runtimeHandle: params.providerRuntimeHandle,
		resolveWhenMissing: true
	});
	const auth = params.preparedAuthPlan ?? require_auth.buildAgentRuntimeAuthPlan({
		provider: params.provider,
		modelId: params.modelId,
		authProfileProvider: params.authProfileProvider,
		authProfileMode: params.authProfileMode,
		sessionAuthProfileId: params.sessionAuthProfileId,
		sessionAuthProfileSource: params.sessionAuthProfileSource,
		sessionAuthProfileCandidateIds: params.sessionAuthProfileCandidateIds,
		modelRoute: params.modelRoute,
		config,
		workspaceDir: params.workspaceDir,
		harnessId: params.harnessId,
		harnessRuntime: params.harnessRuntime,
		allowHarnessAuthProfileForwarding: params.allowHarnessAuthProfileForwarding
	});
	const resolvedRef = {
		provider: params.provider,
		modelId: params.modelId,
		...modelApi ? { modelApi } : {},
		...params.harnessId ? { harnessId: params.harnessId } : {},
		...transport ? { transport } : {}
	};
	const toolContext = {
		provider: params.provider,
		config,
		workspaceDir: params.workspaceDir,
		env: process.env,
		runtimeHandle: providerRuntimeHandleForPlugins,
		modelId: params.modelId,
		modelApi,
		model
	};
	const resolveToolContext = (overrides) => ({
		...toolContext,
		...overrides?.workspaceDir !== void 0 ? { workspaceDir: overrides.workspaceDir } : {},
		...overrides?.modelApi !== void 0 ? { modelApi: overrides.modelApi } : {},
		...overrides?.model !== void 0 ? { model: asProviderRuntimeModel(overrides.model) } : {}
	});
	const resolveTranscriptRuntimePolicy = (overrides) => require_selection.resolveTranscriptPolicy({
		provider: params.provider,
		modelId: params.modelId,
		config,
		workspaceDir: overrides?.workspaceDir ?? params.workspaceDir,
		env: process.env,
		runtimeHandle: providerRuntimeHandleForPlugins,
		modelApi: overrides?.modelApi ?? modelApi,
		model: asProviderRuntimeModel(overrides?.model) ?? model
	});
	const resolveTransportExtraParams = (overrides = {}) => require_extra_params.resolvePreparedExtraParams({
		cfg: config,
		provider: params.provider,
		modelId: params.modelId,
		agentDir: params.agentDir,
		workspaceDir: overrides.workspaceDir ?? params.workspaceDir,
		extraParamsOverride: overrides.extraParamsOverride ?? params.extraParamsOverride,
		thinkingLevel: overrides.thinkingLevel ?? params.thinkingLevel,
		agentId: overrides.agentId ?? params.agentId,
		model: asProviderRuntimeModel(overrides.model) ?? model,
		resolvedTransport: overrides.resolvedTransport ?? transport,
		providerRuntimeHandle: providerRuntimeHandleForPlugins
	});
	let memoizedTranscriptPolicy;
	let memoizedTransportExtraParams;
	const resolveDefaultTranscriptPolicy = () => {
		memoizedTranscriptPolicy ??= resolveTranscriptRuntimePolicy();
		return memoizedTranscriptPolicy;
	};
	const resolveDefaultTransportExtraParams = () => {
		memoizedTransportExtraParams ??= resolveTransportExtraParams();
		return memoizedTransportExtraParams;
	};
	const providerTextTransforms = require_provider_runtime.resolveProviderTextTransforms({
		provider: params.provider,
		config,
		workspaceDir: params.workspaceDir,
		env: process.env,
		runtimeHandle: providerRuntimeHandleForPlugins
	});
	return {
		resolvedRef,
		providerRuntimeHandle: providerRuntimeHandleForPlugins,
		auth,
		prompt: {
			provider: params.provider,
			modelId: params.modelId,
			textTransforms: providerTextTransforms,
			resolveSystemPromptContribution(context) {
				return require_provider_runtime.resolveProviderSystemPromptContribution({
					provider: params.provider,
					config,
					workspaceDir: context.workspaceDir ?? params.workspaceDir,
					runtimeHandle: providerRuntimeHandleForPlugins,
					context: {
						...context,
						config: asOperatorConfig(context.config)
					}
				});
			},
			transformSystemPrompt(context) {
				return require_provider_runtime.transformProviderSystemPrompt({
					provider: params.provider,
					config,
					workspaceDir: context.workspaceDir ?? params.workspaceDir,
					runtimeHandle: providerRuntimeHandleForPlugins,
					context: {
						...context,
						config: asOperatorConfig(context.config)
					}
				});
			}
		},
		tools: {
			preparedPlanning: { loadMetadataSnapshot: loadToolPlanningMetadataSnapshot },
			normalize(tools, overrides) {
				return require_tools.normalizeProviderToolSchemas({
					...resolveToolContext(overrides),
					tools
				});
			},
			logDiagnostics(tools, overrides) {
				require_tools.logProviderToolSchemaDiagnostics({
					...resolveToolContext(overrides),
					tools
				});
			}
		},
		transcript: {
			get policy() {
				return resolveDefaultTranscriptPolicy();
			},
			resolvePolicy: resolveTranscriptRuntimePolicy
		},
		delivery: buildAgentRuntimeDeliveryPlan({
			...params,
			providerRuntimeHandle: providerRuntimeHandleForPlugins
		}),
		outcome: buildAgentRuntimeOutcomePlan(),
		transport: {
			get extraParams() {
				return resolveDefaultTransportExtraParams();
			},
			resolveExtraParams: resolveTransportExtraParams
		},
		observability: {
			resolvedRef: formatResolvedRef({
				provider: params.provider,
				modelId: params.modelId
			}),
			provider: params.provider,
			modelId: params.modelId,
			...modelApi ? { modelApi } : {},
			...params.harnessId ? { harnessId: params.harnessId } : {},
			...auth.forwardedAuthProfileId ? { authProfileId: auth.forwardedAuthProfileId } : {},
			...transport ? { transport } : {}
		}
	};
}
//#endregion
Object.defineProperty(exports, "asCompactionHookRunner", {
	enumerable: true,
	get: function() {
		return asCompactionHookRunner;
	}
});
Object.defineProperty(exports, "buildAgentRuntimeDeliveryPlan", {
	enumerable: true,
	get: function() {
		return buildAgentRuntimeDeliveryPlan;
	}
});
Object.defineProperty(exports, "buildAgentRuntimeOutcomePlan", {
	enumerable: true,
	get: function() {
		return buildAgentRuntimeOutcomePlan;
	}
});
Object.defineProperty(exports, "buildAgentRuntimePlan", {
	enumerable: true,
	get: function() {
		return buildAgentRuntimePlan;
	}
});
Object.defineProperty(exports, "buildBeforeCompactionHookMetrics", {
	enumerable: true,
	get: function() {
		return buildBeforeCompactionHookMetrics;
	}
});
Object.defineProperty(exports, "buildCompactionHarnessModelProvider", {
	enumerable: true,
	get: function() {
		return buildCompactionHarnessModelProvider;
	}
});
Object.defineProperty(exports, "createFileBackedCompactionCheckpointStore", {
	enumerable: true,
	get: function() {
		return createFileBackedCompactionCheckpointStore;
	}
});
Object.defineProperty(exports, "estimateTokensAfterCompaction", {
	enumerable: true,
	get: function() {
		return estimateTokensAfterCompaction;
	}
});
Object.defineProperty(exports, "getSessionCompactionCheckpoint", {
	enumerable: true,
	get: function() {
		return getSessionCompactionCheckpoint;
	}
});
Object.defineProperty(exports, "listSessionCompactionCheckpoints", {
	enumerable: true,
	get: function() {
		return listSessionCompactionCheckpoints;
	}
});
Object.defineProperty(exports, "readAgentModelContextTokens", {
	enumerable: true,
	get: function() {
		return readAgentModelContextTokens;
	}
});
Object.defineProperty(exports, "readSessionLeafStateFromTranscriptAsync", {
	enumerable: true,
	get: function() {
		return readSessionLeafStateFromTranscriptAsync;
	}
});
Object.defineProperty(exports, "resolveCompactionCheckpointTranscriptPosition", {
	enumerable: true,
	get: function() {
		return resolveCompactionCheckpointTranscriptPosition;
	}
});
Object.defineProperty(exports, "resolveSessionCompactionCheckpointReason", {
	enumerable: true,
	get: function() {
		return resolveSessionCompactionCheckpointReason;
	}
});
Object.defineProperty(exports, "runAfterCompactionHooks", {
	enumerable: true,
	get: function() {
		return runAfterCompactionHooks;
	}
});
Object.defineProperty(exports, "runBeforeCompactionHooks", {
	enumerable: true,
	get: function() {
		return runBeforeCompactionHooks;
	}
});
Object.defineProperty(exports, "runPostCompactionSideEffects", {
	enumerable: true,
	get: function() {
		return runPostCompactionSideEffects;
	}
});
