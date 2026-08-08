const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_paths$1 = require("./paths-BRFVmnyv.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/trajectory/cleanup.ts
function canonicalizePathForComparison(filePath) {
	const resolved = node_path.default.resolve(filePath);
	try {
		return node_fs.default.realpathSync(resolved);
	} catch {
		return resolved;
	}
}
function isPathWithinDir(parentDir, filePath) {
	const resolvedParent = canonicalizePathForComparison(parentDir);
	const resolvedFile = canonicalizePathForComparison(filePath);
	return resolvedFile !== resolvedParent && (0, _openclaw_fs_safe_path.isPathInside)(resolvedParent, resolvedFile);
}
function isRegularNonSymlinkFile(filePath) {
	try {
		const lst = node_fs.default.lstatSync(filePath);
		if (!lst.isFile() || lst.isSymbolicLink()) return false;
		return node_fs.default.statSync(filePath).isFile();
	} catch {
		return false;
	}
}
function readTrajectoryPointerFile(pointerPath, sessionId) {
	if (!isRegularNonSymlinkFile(pointerPath)) return null;
	try {
		const parsed = JSON.parse(node_fs.default.readFileSync(pointerPath, "utf8"));
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed)) return null;
		if (parsed.traceSchema !== "operator-trajectory-pointer" || parsed.schemaVersion !== 1 || parsed.sessionId !== sessionId || typeof parsed.runtimeFile !== "string" || !parsed.runtimeFile.trim()) return null;
		return { runtimeFile: node_path.default.resolve(parsed.runtimeFile) };
	} catch {
		return null;
	}
}
function readFirstNonEmptyLine(filePath) {
	let fd = null;
	try {
		fd = node_fs.default.openSync(filePath, "r");
		const buffer = Buffer.alloc(64 * 1024);
		const bytesRead = node_fs.default.readSync(fd, buffer, 0, buffer.length, 0);
		if (bytesRead <= 0) return null;
		for (const line of buffer.subarray(0, bytesRead).toString("utf8").split(/\r?\n/u)) {
			const trimmed = line.trim();
			if (trimmed) return trimmed;
		}
		return null;
	} catch {
		return null;
	} finally {
		if (fd !== null) try {
			node_fs.default.closeSync(fd);
		} catch {}
	}
}
function runtimeFileStartsWithSessionEvent(filePath, sessionId) {
	if (!isRegularNonSymlinkFile(filePath)) return false;
	const firstLine = readFirstNonEmptyLine(filePath);
	if (!firstLine) return false;
	try {
		const parsed = JSON.parse(firstLine);
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) && parsed.traceSchema === "operator-trajectory" && parsed.schemaVersion === 1 && parsed.source === "runtime" && parsed.sessionId === sessionId;
	} catch {
		return false;
	}
}
async function removeRegularFile(filePath, kind) {
	if (!isRegularNonSymlinkFile(filePath)) return null;
	await node_fs.default.promises.rm(filePath, { force: true });
	return {
		kind,
		path: node_path.default.resolve(filePath)
	};
}
function resolveRemovedSessionFile(params) {
	try {
		return require_paths.resolveSessionFilePath(params.sessionId, params.sessionFile ? { sessionFile: params.sessionFile } : void 0, { sessionsDir: node_path.default.dirname(params.storePath) });
	} catch {
		return null;
	}
}
function mayRemoveRuntimeTarget(params) {
	const resolved = canonicalizePathForComparison(params.filePath);
	const withinStoreDir = isPathWithinDir(params.storeDir, resolved);
	if (canonicalizePathForComparison(params.defaultRuntimePath) === resolved) return !params.restrictToStoreDir || withinStoreDir;
	if (params.restrictToStoreDir && withinStoreDir) return true;
	const expectedName = `${require_paths$1.safeTrajectorySessionFileName(params.sessionId)}.jsonl`;
	if (node_path.default.basename(resolved) !== expectedName) return false;
	return runtimeFileStartsWithSessionEvent(resolved, params.sessionId);
}
async function removeSessionTrajectoryArtifacts(params) {
	const sessionFile = resolveRemovedSessionFile(params);
	if (!sessionFile) return [];
	const storeDir = node_path.default.dirname(node_path.default.resolve(params.storePath));
	const restrictToStoreDir = params.restrictToStoreDir === true;
	const removed = [];
	const sqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(sessionFile);
	if (sqliteMarker && (sqliteMarker.sessionId !== params.sessionId || node_path.default.resolve(sqliteMarker.storePath) !== node_path.default.resolve(params.storePath))) return [];
	const pointerPath = sqliteMarker ? void 0 : require_paths$1.resolveTrajectoryPointerFilePath(sessionFile);
	const pointer = pointerPath ? readTrajectoryPointerFile(pointerPath, params.sessionId) : null;
	const defaultRuntimePath = require_paths$1.resolveTrajectoryFilePath({
		env: {},
		sessionFile,
		sessionId: params.sessionId
	});
	const runtimeCandidates = /* @__PURE__ */ new Set([defaultRuntimePath]);
	if (pointer?.runtimeFile) runtimeCandidates.add(pointer.runtimeFile);
	for (const runtimePath of runtimeCandidates) {
		if (!mayRemoveRuntimeTarget({
			defaultRuntimePath,
			filePath: runtimePath,
			sessionId: params.sessionId,
			storeDir,
			restrictToStoreDir
		})) continue;
		const deleted = await removeRegularFile(runtimePath, "runtime");
		if (deleted) removed.push(deleted);
	}
	if (pointerPath && (!restrictToStoreDir || isPathWithinDir(storeDir, pointerPath))) {
		const deletedPointer = await removeRegularFile(pointerPath, "pointer");
		if (deletedPointer) removed.push(deletedPointer);
	}
	return removed;
}
async function removeRemovedSessionTrajectoryArtifacts(params) {
	const removed = [];
	for (const [sessionId, sessionFile] of params.removedSessionFiles) {
		if (params.referencedSessionIds.has(sessionId)) continue;
		removed.push(...await removeSessionTrajectoryArtifacts({
			sessionId,
			sessionFile,
			storePath: params.storePath,
			restrictToStoreDir: params.restrictToStoreDir
		}));
	}
	return removed;
}
//#endregion
exports.removeRemovedSessionTrajectoryArtifacts = removeRemovedSessionTrajectoryArtifacts;
exports.removeSessionTrajectoryArtifacts = removeSessionTrajectoryArtifacts;
