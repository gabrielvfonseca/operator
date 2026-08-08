const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/trajectory/paths.ts
const TRAJECTORY_RUNTIME_CAPTURE_MAX_BYTES = 10 * 1024 * 1024;
const TRAJECTORY_RUNTIME_EVENT_MAX_BYTES = 256 * 1024;
function safeTrajectorySessionFileName(sessionId) {
	const safe = sessionId.replaceAll(/[^A-Za-z0-9_-]/g, "_").slice(0, 120);
	return /[A-Za-z0-9]/u.test(safe) ? safe : "session";
}
function resolveContainedPath(baseDir, fileName) {
	const resolvedBase = node_path.default.resolve(baseDir);
	const resolvedFile = node_path.default.resolve(resolvedBase, fileName);
	if (resolvedFile === resolvedBase || !(0, _openclaw_fs_safe_path.isPathInside)(resolvedBase, resolvedFile)) throw new Error("Trajectory file path escaped its configured directory");
	return resolvedFile;
}
function resolveTrajectoryFilePath(params) {
	const dirOverride = (params.env ?? process.env).OPERATOR_TRAJECTORY_DIR?.trim();
	if (dirOverride) return resolveContainedPath(require_home_dir.resolveHomeRelativePath(dirOverride), `${safeTrajectorySessionFileName(params.sessionId)}.jsonl`);
	if (!params.sessionFile) return node_path.default.join(process.cwd(), `${safeTrajectorySessionFileName(params.sessionId)}.trajectory.jsonl`);
	const sqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(params.sessionFile);
	if (sqliteMarker) return node_path.default.join(node_path.default.dirname(node_path.default.resolve(sqliteMarker.storePath)), "trajectory", `${safeTrajectorySessionFileName(sqliteMarker.sessionId)}.jsonl`);
	return params.sessionFile.endsWith(".jsonl") ? `${params.sessionFile.slice(0, -6)}.trajectory.jsonl` : `${params.sessionFile}.trajectory.jsonl`;
}
function resolveTrajectoryPointerFilePath(sessionFile) {
	return sessionFile.endsWith(".jsonl") ? `${sessionFile.slice(0, -6)}.trajectory-path.json` : `${sessionFile}.trajectory-path.json`;
}
//#endregion
Object.defineProperty(exports, "TRAJECTORY_RUNTIME_CAPTURE_MAX_BYTES", {
	enumerable: true,
	get: function() {
		return TRAJECTORY_RUNTIME_CAPTURE_MAX_BYTES;
	}
});
Object.defineProperty(exports, "TRAJECTORY_RUNTIME_EVENT_MAX_BYTES", {
	enumerable: true,
	get: function() {
		return TRAJECTORY_RUNTIME_EVENT_MAX_BYTES;
	}
});
Object.defineProperty(exports, "resolveTrajectoryFilePath", {
	enumerable: true,
	get: function() {
		return resolveTrajectoryFilePath;
	}
});
Object.defineProperty(exports, "resolveTrajectoryPointerFilePath", {
	enumerable: true,
	get: function() {
		return resolveTrajectoryPointerFilePath;
	}
});
Object.defineProperty(exports, "safeTrajectorySessionFileName", {
	enumerable: true,
	get: function() {
		return safeTrajectorySessionFileName;
	}
});
