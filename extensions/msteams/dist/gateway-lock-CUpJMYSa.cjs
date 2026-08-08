const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_zod_parse = require("./zod-parse-D5uufcMS.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_pid_alive = require("./pid-alive-BalBSmHd.cjs");
const require_windows_port_pids = require("./windows-port-pids-FzMQAPMX.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let zod = require("zod");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let node_child_process = require("node:child_process");
//#region src/infra/gateway-lock.ts
const DEFAULT_TIMEOUT_MS = 5e3;
const DEFAULT_POLL_INTERVAL_MS = 100;
const DEFAULT_STALE_MS = 3e4;
const LockPayloadSchema = zod.z.object({
	pid: zod.z.number(),
	createdAt: zod.z.string(),
	configPath: zod.z.string(),
	port: zod.z.number().int().min(1).max(65535).optional(),
	role: zod.z.enum(["gateway", "sqlite-maintenance"]).optional(),
	stateDir: zod.z.string().optional(),
	startTime: zod.z.number().optional()
});
var GatewayLockError = class extends Error {
	constructor(message, cause) {
		super(message);
		this.cause = cause;
		this.name = "GatewayLockError";
	}
};
function tryAcquireGatewayLockCoordinator(lockPath) {
	const { DatabaseSync } = require_state_migrations_cron_run_logs.requireNodeSqlite();
	const coordinatorDb = new DatabaseSync(`${lockPath}.sqlite`);
	try {
		coordinatorDb.exec("PRAGMA busy_timeout = 0; BEGIN EXCLUSIVE;");
	} catch (error) {
		try {
			coordinatorDb.close();
		} catch {}
		if (require_state_migrations_cron_run_logs.isSqliteLockError(error)) return null;
		throw error;
	}
	return { release: () => {
		let releaseError;
		try {
			coordinatorDb.exec("ROLLBACK");
		} catch (error) {
			releaseError = error;
		}
		try {
			coordinatorDb.close();
		} catch (error) {
			releaseError ??= error;
		}
		if (releaseError) throw new GatewayLockError("failed to release gateway lock coordinator", releaseError);
	} };
}
function readLinuxCmdline(pid) {
	try {
		return require_windows_port_pids.parseProcCmdline(node_fs.default.readFileSync(`/proc/${pid}/cmdline`, "utf8"));
	} catch {
		return null;
	}
}
const CMDLINE_EXEC_TIMEOUT_MS = 1e3;
function readWindowsCmdline(pid) {
	return require_windows_port_pids.readWindowsProcessArgsSync(pid, CMDLINE_EXEC_TIMEOUT_MS);
}
/**
* Read the command line of a macOS/BSD process via `ps`.
*
* `ps -o command=` outputs an unquoted flat string, so the naive whitespace
* split will misparse paths containing spaces. This is acceptable because
* standard macOS install paths do not contain spaces, and when the split
* does fail the caller falls back to "alive" (conservative).
*/
function readDarwinCmdline(pid) {
	try {
		const line = (0, node_child_process.execFileSync)("ps", [
			"-p",
			String(pid),
			"-o",
			"command="
		], {
			encoding: "utf8",
			timeout: CMDLINE_EXEC_TIMEOUT_MS,
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			]
		}).trim();
		if (!line) return null;
		return line.split(/\s+/).filter(Boolean);
	} catch {
		return null;
	}
}
function readProcessStartTime(pid, platform) {
	if (platform !== process.platform) return null;
	return platform === "win32" ? require_windows_port_pids.readWindowsProcessStartTimeSync(pid, CMDLINE_EXEC_TIMEOUT_MS) : require_pid_alive.getFileLockProcessStartTime(pid);
}
function defaultReadProcessCmdline(pid, platform) {
	if (platform === "linux") return readLinuxCmdline(pid);
	if (platform === "win32") return readWindowsCmdline(pid);
	if (platform === "darwin") return readDarwinCmdline(pid);
	return null;
}
async function resolveGatewayOwnerStatus(pid, payload, platform, readCmdline, readStartTime, opts = {}) {
	const role = payload?.role ?? "gateway";
	if (!require_pid_alive.isPidAlive(pid)) return "dead";
	const payloadStartTime = payload?.startTime;
	if (Number.isFinite(payloadStartTime)) {
		const currentStartTime = (readStartTime ?? ((ownerPid) => readProcessStartTime(ownerPid, platform)))(pid);
		if (currentStartTime != null) return currentStartTime === payloadStartTime ? "alive" : "dead";
	}
	const readFn = readCmdline ?? ((p) => defaultReadProcessCmdline(p, platform));
	if (role === "sqlite-maintenance") {
		const args = readFn(pid);
		if (!args) return "unknown";
		return require_windows_port_pids.isOperatorCommandArgv(args, "doctor") ? "alive" : "dead";
	}
	const args = readFn(pid);
	if (!args) return platform === "linux" || opts.trustUnknownCmdlineOwner === false ? "unknown" : "alive";
	return require_windows_port_pids.isGatewayArgv(args, { allowGatewayBinary: true }) ? "alive" : "dead";
}
async function readLockPayload(lockPath) {
	try {
		const raw = await node_fs_promises.default.readFile(lockPath, "utf8");
		return require_zod_parse.safeParseJsonWithSchema(LockPayloadSchema, raw);
	} catch {
		return null;
	}
}
function canonicalizeStateDir(stateDir) {
	const resolved = node_path.default.resolve(stateDir);
	try {
		return node_fs.default.realpathSync.native(resolved);
	} catch {
		const missingSegments = [];
		let current = resolved;
		while (true) {
			const parent = node_path.default.dirname(current);
			if (parent === current) return resolved;
			missingSegments.push(node_path.default.basename(current));
			current = parent;
			try {
				return node_path.default.join(node_fs.default.realpathSync.native(current), ...missingSegments.toReversed());
			} catch {}
		}
	}
}
function resolveGatewayLockPaths(env, lockDir = require_paths.resolveGatewayLockDir()) {
	const resolvedStateDir = require_paths.resolveStateDir(env);
	const stateDir = canonicalizeStateDir(resolvedStateDir);
	const configPath = require_paths.resolveConfigPath(env, resolvedStateDir);
	const configHash = require_crypto_digest.sha256HexPrefix(configPath, 8);
	const stateHash = require_crypto_digest.sha256HexPrefix(stateDir, 8);
	return {
		configLockPath: node_path.default.join(lockDir, `gateway.${configHash}.lock`),
		configPath,
		stateDir,
		stateLockPath: node_path.default.join(lockDir, `gateway.state.${stateHash}.lock`)
	};
}
async function readActiveGatewayLockPort(opts = {}) {
	const { configLockPath, stateLockPath } = resolveGatewayLockPaths(opts.env ?? process.env, opts.lockDir);
	return await readVerifiedGatewayLockPort(configLockPath, opts) ?? await readVerifiedGatewayLockPort(stateLockPath, opts);
}
async function readVerifiedGatewayLockPort(lockPath, opts) {
	const payload = await readLockPayload(lockPath);
	if (!payload?.port || payload.role === "sqlite-maintenance") return;
	return await resolveGatewayOwnerStatus(payload.pid, payload, opts.platform ?? process.platform, opts.readProcessCmdline, opts.readProcessStartTime, { trustUnknownCmdlineOwner: false }) === "alive" ? payload.port : void 0;
}
async function acquireGatewayLock(opts = {}) {
	const env = opts.env ?? process.env;
	if (!(opts.allowInTests === true) && (env.VITEST || env.NODE_ENV === "test")) return null;
	const role = opts.role ?? "gateway";
	const paths = resolveGatewayLockPaths(env, opts.lockDir);
	const stateLock = await acquireLockFile({
		...opts,
		configPath: paths.configPath,
		env,
		lockPath: paths.stateLockPath,
		role,
		stateDir: paths.stateDir
	});
	if (!(role === "sqlite-maintenance" || env.OPERATOR_ALLOW_MULTI_GATEWAY !== "1")) return {
		...stateLock,
		stateLockPath: stateLock.lockPath
	};
	try {
		const configLock = await acquireLockFile({
			...opts,
			configPath: paths.configPath,
			env,
			lockPath: paths.configLockPath,
			role,
			stateDir: paths.stateDir
		});
		return {
			...configLock,
			stateLockPath: stateLock.lockPath,
			release: async () => {
				let releaseError;
				try {
					await configLock.release();
				} catch (error) {
					releaseError = error instanceof Error ? error : new GatewayLockError("failed to release config lock", error);
				}
				try {
					await stateLock.release();
				} catch (error) {
					releaseError ??= error instanceof Error ? error : new GatewayLockError("failed to release state lock", error);
				}
				if (releaseError) throw releaseError;
			}
		};
	} catch (error) {
		await stateLock.release().catch(() => void 0);
		throw error;
	}
}
async function acquireLockFile(opts) {
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(opts.timeoutMs, DEFAULT_TIMEOUT_MS, 0);
	const pollIntervalMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolvePositiveTimerTimeoutMs)(opts.pollIntervalMs, DEFAULT_POLL_INTERVAL_MS);
	const staleMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(opts.staleMs, DEFAULT_STALE_MS, 0);
	const platform = opts.platform ?? process.platform;
	const port = opts.port;
	const role = opts.role;
	const now = opts.now ?? Date.now;
	const sleep = opts.sleep ?? (async (ms) => await new Promise((resolve) => {
		setTimeout(resolve, ms);
	}));
	const { configPath, lockPath, stateDir } = opts;
	await node_fs_promises.default.mkdir(node_path.default.dirname(lockPath), { recursive: true });
	const startedAt = now();
	let lastPayload = null;
	while (now() - startedAt < timeoutMs) {
		let coordinator;
		try {
			coordinator = tryAcquireGatewayLockCoordinator(lockPath);
		} catch (error) {
			throw new GatewayLockError(`failed to acquire gateway lock at ${lockPath}`, error);
		}
		if (!coordinator) lastPayload = await readLockPayload(lockPath);
		else {
			let handle;
			let acquisitionError;
			let waitForOwner = false;
			try {
				while (!handle && !waitForOwner) {
					let candidateHandle;
					try {
						candidateHandle = await node_fs_promises.default.open(lockPath, "wx");
					} catch (error) {
						if (error.code !== "EEXIST") throw error;
						lastPayload = await readLockPayload(lockPath);
						const ownerPid = lastPayload?.pid;
						const ownerStatus = ownerPid ? await resolveGatewayOwnerStatus(ownerPid, lastPayload, platform, opts.readProcessCmdline, opts.readProcessStartTime) : "unknown";
						if (ownerStatus === "dead" && ownerPid) {
							await node_fs_promises.default.rm(lockPath, { force: true });
							continue;
						}
						if (ownerStatus !== "alive") {
							let stale = false;
							if (lastPayload?.createdAt) {
								const createdAt = Date.parse(lastPayload.createdAt);
								stale = Number.isFinite(createdAt) ? now() - createdAt > staleMs : false;
							}
							if (!stale) try {
								const st = await node_fs_promises.default.stat(lockPath);
								stale = now() - st.mtimeMs > staleMs;
							} catch {
								stale = false;
							}
							if (stale) {
								await node_fs_promises.default.rm(lockPath, { force: true });
								continue;
							}
						}
						waitForOwner = true;
						continue;
					}
					try {
						const startTime = (opts.readProcessStartTime ?? ((pid) => readProcessStartTime(pid, platform)))(process.pid);
						const payload = {
							pid: process.pid,
							createdAt: (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimestampMsToIsoString)(now()),
							configPath,
							stateDir
						};
						if (typeof port === "number" && Number.isInteger(port) && port > 0 && port <= 65535) payload.port = port;
						if (role !== "gateway") payload.role = role;
						if (typeof startTime === "number" && Number.isFinite(startTime)) payload.startTime = startTime;
						await candidateHandle.writeFile(JSON.stringify(payload), "utf8");
						handle = candidateHandle;
					} catch (error) {
						await candidateHandle.close().catch(() => void 0);
						await node_fs_promises.default.rm(lockPath, { force: true }).catch(() => void 0);
						throw error;
					}
				}
			} catch (error) {
				acquisitionError = error;
			}
			if (handle) return {
				lockPath,
				configPath,
				release: async () => {
					let releaseError;
					try {
						await handle.close();
					} catch (error) {
						releaseError = error;
					}
					try {
						await node_fs_promises.default.rm(lockPath, { force: true });
					} catch (error) {
						releaseError ??= error;
					}
					try {
						coordinator.release();
					} catch (error) {
						releaseError ??= error;
					}
					if (releaseError) throw new GatewayLockError(`failed to release gateway lock at ${lockPath}`, releaseError);
				}
			};
			try {
				coordinator.release();
			} catch (error) {
				acquisitionError ??= error;
			}
			if (acquisitionError) throw new GatewayLockError(`failed to acquire gateway lock at ${lockPath}`, acquisitionError);
		}
		const remainingMs = timeoutMs - (now() - startedAt);
		if (remainingMs <= 0) break;
		await sleep(Math.min(pollIntervalMs, remainingMs));
	}
	throw new GatewayLockError(`gateway already running${lastPayload?.pid ? ` (pid ${lastPayload.pid})` : ""}; lock timeout after ${timeoutMs}ms`);
}
//#endregion
Object.defineProperty(exports, "GatewayLockError", {
	enumerable: true,
	get: function() {
		return GatewayLockError;
	}
});
Object.defineProperty(exports, "acquireGatewayLock", {
	enumerable: true,
	get: function() {
		return acquireGatewayLock;
	}
});
Object.defineProperty(exports, "readActiveGatewayLockPort", {
	enumerable: true,
	get: function() {
		return readActiveGatewayLockPort;
	}
});
