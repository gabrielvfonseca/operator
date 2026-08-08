const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./workspace-oX0zfOZq.cjs");
require("./config-DT0qiglW.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/commands/cleanup-utils.ts
function collectWorkspaceDirs(cfg) {
	const dirs = /* @__PURE__ */ new Set();
	if (!cfg) {
		dirs.add(require_agent_scope_config.resolveDefaultAgentWorkspaceDir());
		return [...dirs];
	}
	for (const agentId of require_agent_scope_config.listAgentIds(cfg)) dirs.add(require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId));
	return [...dirs];
}
/** Determine which config, credential, and workspace paths cleanup should consider. */
function buildCleanupPlan(params) {
	return {
		configInsideState: isPathWithin(params.configPath, params.stateDir),
		oauthInsideState: isPathWithin(params.oauthDir, params.stateDir),
		workspaceDirs: collectWorkspaceDirs(params.cfg)
	};
}
/** Return true when `child` resolves inside `parent`. */
function isPathWithin(child, parent) {
	return (0, _openclaw_fs_safe_path.isPathInside)(parent, child);
}
//#endregion
//#region src/commands/backup-shared.ts
function backupAssetPriority(kind) {
	switch (kind) {
		case "state": return 0;
		case "config": return 1;
		case "credentials": return 2;
		case "workspace": return 3;
	}
	throw new Error("Unsupported backup asset kind");
}
/** Format a filesystem-safe local timestamp with explicit UTC offset for backup names. */
function formatBackupArchiveTimestamp(nowMs = Date.now(), offsetMinutes = -new Date(nowMs).getTimezoneOffset()) {
	const shifted = nowMs + offsetMinutes * 6e4;
	const local = new Date(shifted);
	const sign = offsetMinutes >= 0 ? "+" : "-";
	const absOffsetMinutes = Math.abs(offsetMinutes);
	const offsetHours = String(Math.floor(absOffsetMinutes / 60)).padStart(2, "0");
	const offsetMins = String(absOffsetMinutes % 60).padStart(2, "0");
	return `${String(local.getUTCFullYear()).padStart(4, "0")}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}T${String(local.getUTCHours()).padStart(2, "0")}-${String(local.getUTCMinutes()).padStart(2, "0")}-${String(local.getUTCSeconds()).padStart(2, "0")}.${String(local.getUTCMilliseconds()).padStart(3, "0")}${sign}${offsetHours}-${offsetMins}`;
}
/** Build the root directory name stored inside a backup tarball. */
function buildBackupArchiveRoot(nowMs = Date.now()) {
	return `${formatBackupArchiveTimestamp(nowMs)}-operator-backup`;
}
/** Build the default `.tar.gz` filename for a backup archive. */
function buildBackupArchiveBasename(nowMs = Date.now()) {
	return `${buildBackupArchiveRoot(nowMs)}.tar.gz`;
}
/** Encode an absolute or relative source path into a traversal-safe archive payload path. */
function encodeAbsolutePathForBackupArchive(sourcePath) {
	const normalized = sourcePath.replaceAll("\\", "/");
	const windowsMatch = normalized.match(/^([A-Za-z]):\/(.*)$/);
	if (windowsMatch) {
		const drive = windowsMatch[1]?.toUpperCase() ?? "UNKNOWN";
		const rest = windowsMatch[2] ?? "";
		return node_path.default.posix.join("windows", drive, rest);
	}
	if (normalized.startsWith("/")) return node_path.default.posix.join("posix", normalized.slice(1));
	return node_path.default.posix.join("relative", normalized);
}
/** Build the archive-relative payload path for one source path. */
function buildBackupArchivePath(archiveRoot, sourcePath) {
	return node_path.default.posix.join(archiveRoot, "payload", encodeAbsolutePathForBackupArchive(sourcePath));
}
/** Resolve a backup plan from explicit paths, deduplicating assets already covered by parents. */
async function resolveBackupPlanFromPaths(params) {
	const includeWorkspace = params.includeWorkspace ?? true;
	const onlyConfig = params.onlyConfig ?? false;
	const stateDir = params.stateDir;
	const configPath = params.configPath;
	const oauthDir = params.oauthDir;
	const archiveRoot = buildBackupArchiveRoot(params.nowMs);
	const workspaceDirs = includeWorkspace ? params.workspaceDirs ?? [] : [];
	const configInsideState = params.configInsideState ?? false;
	const oauthInsideState = params.oauthInsideState ?? false;
	if (onlyConfig) {
		const resolvedConfigPath = node_path.default.resolve(configPath);
		if (!await require_utils.pathExists(resolvedConfigPath)) return {
			stateDir,
			configPath,
			oauthDir,
			workspaceDirs: [],
			included: [],
			skipped: [{
				kind: "config",
				sourcePath: resolvedConfigPath,
				displayPath: require_utils.shortenHomePath(resolvedConfigPath),
				reason: "missing"
			}]
		};
		const canonicalConfigPath = await canonicalizeExistingPath(resolvedConfigPath);
		return {
			stateDir,
			configPath,
			oauthDir,
			workspaceDirs: [],
			included: [{
				kind: "config",
				sourcePath: canonicalConfigPath,
				displayPath: require_utils.shortenHomePath(canonicalConfigPath),
				archivePath: buildBackupArchivePath(archiveRoot, canonicalConfigPath)
			}],
			skipped: []
		};
	}
	const rawCandidates = [
		{
			kind: "state",
			sourcePath: node_path.default.resolve(stateDir)
		},
		...configInsideState ? [] : [{
			kind: "config",
			sourcePath: node_path.default.resolve(configPath)
		}],
		...oauthInsideState ? [] : [{
			kind: "credentials",
			sourcePath: node_path.default.resolve(oauthDir)
		}],
		...workspaceDirs.map((workspaceDir) => ({
			kind: "workspace",
			sourcePath: node_path.default.resolve(workspaceDir)
		}))
	];
	const candidates = await Promise.all(rawCandidates.map(async (candidate) => {
		const exists = await require_utils.pathExists(candidate.sourcePath);
		return Object.assign({}, candidate, {
			exists,
			canonicalPath: exists ? await canonicalizeExistingPath(candidate.sourcePath) : node_path.default.resolve(candidate.sourcePath)
		});
	}));
	const uniqueCandidates = [];
	const seenCanonicalPaths = /* @__PURE__ */ new Set();
	for (const candidate of [...candidates].toSorted(compareCandidates)) {
		if (seenCanonicalPaths.has(candidate.canonicalPath)) continue;
		seenCanonicalPaths.add(candidate.canonicalPath);
		uniqueCandidates.push(candidate);
	}
	const included = [];
	const skipped = [];
	for (const candidate of uniqueCandidates) {
		if (!candidate.exists) {
			skipped.push({
				kind: candidate.kind,
				sourcePath: candidate.sourcePath,
				displayPath: require_utils.shortenHomePath(candidate.sourcePath),
				reason: "missing"
			});
			continue;
		}
		const coveredBy = included.find((asset) => isPathWithin(candidate.canonicalPath, asset.sourcePath));
		if (coveredBy) {
			skipped.push({
				kind: candidate.kind,
				sourcePath: candidate.canonicalPath,
				displayPath: require_utils.shortenHomePath(candidate.canonicalPath),
				reason: "covered",
				coveredBy: coveredBy.displayPath
			});
			continue;
		}
		included.push({
			kind: candidate.kind,
			sourcePath: candidate.canonicalPath,
			displayPath: require_utils.shortenHomePath(candidate.canonicalPath),
			archivePath: buildBackupArchivePath(archiveRoot, candidate.canonicalPath)
		});
	}
	return {
		stateDir,
		configPath,
		oauthDir,
		workspaceDirs: workspaceDirs.map((entry) => node_path.default.resolve(entry)),
		included,
		skipped
	};
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.backupPlanTestApi")] = { resolveBackupPlanFromPaths };
function compareCandidates(left, right) {
	const depthDelta = left.canonicalPath.length - right.canonicalPath.length;
	if (depthDelta !== 0) return depthDelta;
	const priorityDelta = backupAssetPriority(left.kind) - backupAssetPriority(right.kind);
	if (priorityDelta !== 0) return priorityDelta;
	return left.canonicalPath.localeCompare(right.canonicalPath);
}
async function canonicalizeExistingPath(targetPath) {
	try {
		return await node_fs_promises.default.realpath(targetPath);
	} catch {
		return node_path.default.resolve(targetPath);
	}
}
/** Resolve the backup plan from the current Operator state/config/workspace paths on disk. */
async function resolveBackupPlanFromDisk(params = {}) {
	const includeWorkspace = params.includeWorkspace ?? true;
	const onlyConfig = params.onlyConfig ?? false;
	const stateDir = require_paths.resolveStateDir();
	const configPath = require_paths.resolveConfigPath();
	const oauthDir = require_paths.resolveOAuthDir();
	const configSnapshot = await require_io.readConfigFileSnapshot();
	if (includeWorkspace && configSnapshot.exists && !configSnapshot.valid) throw new Error(`Config invalid at ${require_utils.shortenHomePath(configSnapshot.path)}. Operator cannot reliably discover custom workspaces for backup. Fix the config or rerun with --no-include-workspace for a partial backup.`);
	const cleanupPlan = buildCleanupPlan({
		cfg: configSnapshot.config,
		stateDir,
		configPath,
		oauthDir
	});
	return await resolveBackupPlanFromPaths({
		stateDir,
		configPath,
		oauthDir,
		workspaceDirs: includeWorkspace ? cleanupPlan.workspaceDirs : [],
		includeWorkspace,
		onlyConfig,
		configInsideState: cleanupPlan.configInsideState,
		oauthInsideState: cleanupPlan.oauthInsideState,
		nowMs: params.nowMs
	});
}
//#endregion
Object.defineProperty(exports, "buildBackupArchiveBasename", {
	enumerable: true,
	get: function() {
		return buildBackupArchiveBasename;
	}
});
Object.defineProperty(exports, "buildBackupArchivePath", {
	enumerable: true,
	get: function() {
		return buildBackupArchivePath;
	}
});
Object.defineProperty(exports, "buildBackupArchiveRoot", {
	enumerable: true,
	get: function() {
		return buildBackupArchiveRoot;
	}
});
Object.defineProperty(exports, "isPathWithin", {
	enumerable: true,
	get: function() {
		return isPathWithin;
	}
});
Object.defineProperty(exports, "resolveBackupPlanFromDisk", {
	enumerable: true,
	get: function() {
		return resolveBackupPlanFromDisk;
	}
});
