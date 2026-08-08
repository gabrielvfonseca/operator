const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
require("./boundary-path-r6xSCXfB.cjs");
const require_gateway_lock = require("./gateway-lock-CUpJMYSa.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/commands/doctor-sqlite-maintenance-lock.ts
/** Serializes offline SQLite maintenance against the Gateway state owner. */
const MAINTENANCE_LOCK_TIMEOUT_MS = 250;
const MAINTENANCE_LOCK_POLL_INTERVAL_MS = 25;
function assertMaintenancePathsOwnedByStateDir(env, operation, protectedPaths) {
	if (protectedPaths.length === 0) return;
	const stateDir = node_path.default.resolve(require_paths.resolveStateDir(env));
	const stateCanonicalDir = (0, _openclaw_fs_safe_advanced.resolvePathViaExistingAncestorSync)(stateDir);
	for (const protectedPath of protectedPaths) {
		const absolutePath = node_path.default.resolve(protectedPath);
		let resolvedPath;
		try {
			if (!(0, _openclaw_fs_safe_path.isPathInside)(stateDir, absolutePath) && !(0, _openclaw_fs_safe_path.isPathInside)(stateCanonicalDir, absolutePath)) throw new Error("path is not lexically owned by the active state directory");
			resolvedPath = (0, _openclaw_fs_safe_advanced.resolveRootPathSync)({
				absolutePath,
				boundaryLabel: "Operator state directory",
				rootCanonicalPath: stateCanonicalDir,
				rootPath: stateDir
			});
		} catch (error) {
			throw new Error(`Cannot run ${operation} for a path outside the active Operator state directory: ${protectedPath}. Set OPERATOR_STATE_DIR to the owning state directory and retry.`, { cause: error });
		}
		if (resolvedPath.exists && resolvedPath.kind === "file" && node_fs.default.statSync(resolvedPath.canonicalPath).nlink > 1) throw new Error(`Cannot run ${operation} for a hard-linked path: ${protectedPath}. Remove the additional hard link and retry.`);
	}
}
function isDestructiveDoctorSessionSqliteMode(mode) {
	return mode === "import" || mode === "compact" || mode === "restore" || mode === "recover";
}
/** Run one destructive doctor operation while excluding Gateway startup and peer maintenance. */
async function withDoctorSqliteMaintenanceLock(params, deps = {}) {
	const env = params.env ?? process.env;
	const acquireLock = deps.acquireLock ?? require_gateway_lock.acquireGatewayLock;
	const lockOptions = deps.lockOptions;
	let lock;
	try {
		lock = await acquireLock({
			...lockOptions,
			allowInTests: true,
			env,
			pollIntervalMs: lockOptions?.pollIntervalMs ?? MAINTENANCE_LOCK_POLL_INTERVAL_MS,
			role: "sqlite-maintenance",
			timeoutMs: lockOptions?.timeoutMs ?? MAINTENANCE_LOCK_TIMEOUT_MS
		});
	} catch (error) {
		if (error instanceof require_gateway_lock.GatewayLockError) throw new Error(`Cannot run ${params.operation} while the Gateway or another SQLite maintenance command owns this Operator state directory. Stop the Gateway and retry.`, { cause: error });
		throw error;
	}
	if (!lock) throw new Error(`Cannot run ${params.operation} without exclusive Operator state ownership.`);
	try {
		assertMaintenancePathsOwnedByStateDir(env, params.operation, params.protectedPaths ?? []);
		return await params.run();
	} finally {
		await lock.release();
	}
}
//#endregion
Object.defineProperty(exports, "isDestructiveDoctorSessionSqliteMode", {
	enumerable: true,
	get: function() {
		return isDestructiveDoctorSessionSqliteMode;
	}
});
Object.defineProperty(exports, "withDoctorSqliteMaintenanceLock", {
	enumerable: true,
	get: function() {
		return withDoctorSqliteMaintenanceLock;
	}
});
