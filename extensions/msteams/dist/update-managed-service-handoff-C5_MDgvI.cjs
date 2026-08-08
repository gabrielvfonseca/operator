const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_child_process_tree = require("./child-process-tree-Bm7wobLy.cjs");
const require_paths = require("./paths-amwIgX1d.cjs");
const require_update_control_plane_sentinel = require("./update-control-plane-sentinel-9paZY1RI.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let node_child_process = require("node:child_process");
//#region src/infra/supervisor-markers.ts
const SUPERVISOR_HINTS = {
	launchd: ["OPERATOR_LAUNCHD_LABEL"],
	systemd: [
		"OPERATOR_SYSTEMD_UNIT",
		"INVOCATION_ID",
		"SYSTEMD_EXEC_PID",
		"JOURNAL_STREAM"
	],
	schtasks: ["OPERATOR_WINDOWS_TASK_NAME"]
};
/** Environment keys that imply the gateway process is supervised by an external respawner. */
const SUPERVISOR_HINT_ENV_VARS = [
	"LAUNCH_JOB_LABEL",
	"LAUNCH_JOB_NAME",
	"XPC_SERVICE_NAME",
	...SUPERVISOR_HINTS.launchd,
	...SUPERVISOR_HINTS.systemd,
	...SUPERVISOR_HINTS.schtasks,
	"OPERATOR_SERVICE_MARKER",
	"OPERATOR_SERVICE_KIND"
];
function hasAnyHint(env, keys) {
	return keys.some((key) => {
		const value = env[key];
		return typeof value === "string" && value.trim().length > 0;
	});
}
function hasOperatorGatewayServiceMarker(env) {
	return env.OPERATOR_SERVICE_MARKER?.trim() === "@gabrielvfonseca/operator" && env.OPERATOR_SERVICE_KIND?.trim() === "gateway";
}
function isCurrentGatewayLaunchdJob(env) {
	const expectedLabel = require_paths.resolveGatewayLaunchAgentLabel(env.OPERATOR_PROFILE);
	if ([env.LAUNCH_JOB_LABEL, env.LAUNCH_JOB_NAME].some((value) => value?.trim() === expectedLabel)) return true;
	return env.XPC_SERVICE_NAME?.trim() === require_paths.GATEWAY_LAUNCH_AGENT_LABEL;
}
/** Detects the current platform supervisor from process environment hints. */
function detectRespawnSupervisor(env = process.env, platform = process.platform, options = {}) {
	if (platform === "darwin") return hasAnyHint(env, SUPERVISOR_HINTS.launchd) || isCurrentGatewayLaunchdJob(env) ? "launchd" : null;
	if (platform === "linux") return hasAnyHint(env, SUPERVISOR_HINTS.systemd) || options.includeLinuxOperatorGatewayServiceMarker === true && hasOperatorGatewayServiceMarker(env) ? "systemd" : null;
	if (platform === "win32") {
		if (hasAnyHint(env, SUPERVISOR_HINTS.schtasks)) return "schtasks";
		const marker = env.OPERATOR_SERVICE_MARKER?.trim();
		const serviceKind = env.OPERATOR_SERVICE_KIND?.trim();
		return marker && serviceKind === "gateway" ? "schtasks" : null;
	}
	return null;
}
//#endregion
//#region src/infra/update-managed-service-handoff-cleanup.ts
const MANAGED_SERVICE_UPDATE_HANDOFF_TEMP_PREFIX = "operator-update-run-handoff-";
//#endregion
//#region src/infra/update-managed-service-handoff.ts
const PARENT_EXIT_SHUTDOWN_RESERVE_MS = 3e4;
const HANDOFF_READY_TIMEOUT_MS = 3e4;
const HANDOFF_READY_MARKER = "OPERATOR_UPDATE_HANDOFF_READY\n";
const HANDOFF_STATE_DATABASE_BUSY_TIMEOUT_MS = 5e3;
const SYSTEMD_RUN_CANDIDATE_PATHS = ["/usr/bin/systemd-run", "/bin/systemd-run"];
const SERVICE_IDENTITY_ENV_VARS = /* @__PURE__ */ new Set([
	"OPERATOR_LAUNCHD_LABEL",
	"OPERATOR_SYSTEMD_UNIT",
	"OPERATOR_WINDOWS_TASK_NAME"
]);
const HANDOFF_SCRIPT = String.raw`
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const params = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));

function appendLog(line) {
  try {
    fs.mkdirSync(path.dirname(params.logPath), { recursive: true, mode: 0o700 });
    fs.appendFileSync(params.logPath, "[" + new Date().toISOString() + "] " + line + "\n", {
      mode: 0o600,
    });
  } catch {
    // Best effort only.
  }
}

fs.writeSync(1, ${JSON.stringify(HANDOFF_READY_MARKER)});

function isPidAlive(pid) {
  if (!pid || typeof pid !== "number") {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === "EPERM";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanupSensitiveFiles() {
  for (const filePath of params.sensitivePaths || []) {
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // Best effort only.
    }
  }
}

function resolveExistingDirectory(candidates) {
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") {
      continue;
    }
    try {
      const stat = fs.statSync(candidate);
      if (stat.isDirectory()) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }
  return undefined;
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function isPendingUpdatePayload(payload) {
  const reason = payload && payload.stats && payload.stats.reason;
  return (
    payload &&
    payload.kind === "update" &&
    payload.status === "skipped" &&
    (reason === "managed-service-handoff-started" || reason === "restart-health-pending")
  );
}

function openStateDatabase() {
  if (!params.stateDatabasePath || typeof params.stateDatabasePath !== "string") {
    return null;
  }
  try {
    const sqlite = require("node:sqlite");
    fs.mkdirSync(path.dirname(params.stateDatabasePath), { recursive: true, mode: 0o700 });
    const db = new sqlite.DatabaseSync(params.stateDatabasePath);
    db.exec("PRAGMA busy_timeout = ${HANDOFF_STATE_DATABASE_BUSY_TIMEOUT_MS};");
    db.exec([
      "CREATE TABLE IF NOT EXISTS gateway_restart_sentinel (",
      "sentinel_key TEXT NOT NULL PRIMARY KEY,",
      "version INTEGER NOT NULL,",
      "kind TEXT NOT NULL,",
      "status TEXT NOT NULL,",
      "ts INTEGER NOT NULL,",
      "session_key TEXT,",
      "thread_id TEXT,",
      "delivery_channel TEXT,",
      "delivery_to TEXT,",
      "delivery_account_id TEXT,",
      "message TEXT,",
      "continuation_json TEXT,",
      "doctor_hint TEXT,",
      "stats_json TEXT,",
      "payload_json TEXT NOT NULL,",
      "updated_at_ms INTEGER NOT NULL",
      ") STRICT;",
      "CREATE INDEX IF NOT EXISTS idx_gateway_restart_sentinel_ts",
      "ON gateway_restart_sentinel(ts DESC, sentinel_key);",
    ].join(" "));
    ensureGatewayRestartSentinelColumns(db);
    hardenStateDatabaseFiles();
    return db;
  } catch (err) {
    appendLog("failed to open restart sentinel database: " + (err && err.stack ? err.stack : String(err)));
    return null;
  }
}

function tableHasColumn(db, tableName, columnName) {
  try {
    return db.prepare("PRAGMA table_info(" + tableName + ")").all().some((row) => row && row.name === columnName);
  } catch {
    return false;
  }
}

function ensureColumn(db, tableName, columnSql) {
  const columnName = columnSql.trim().split(/\s+/, 1)[0];
  if (!columnName || tableHasColumn(db, tableName, columnName)) {
    return;
  }
  db.exec("ALTER TABLE " + tableName + " ADD COLUMN " + columnSql + ";");
}

function ensureGatewayRestartSentinelColumns(db) {
  ensureColumn(db, "gateway_restart_sentinel", "delivery_channel TEXT");
  ensureColumn(db, "gateway_restart_sentinel", "delivery_to TEXT");
  ensureColumn(db, "gateway_restart_sentinel", "delivery_account_id TEXT");
  ensureColumn(db, "gateway_restart_sentinel", "message TEXT");
  ensureColumn(db, "gateway_restart_sentinel", "continuation_json TEXT");
  ensureColumn(db, "gateway_restart_sentinel", "doctor_hint TEXT");
  ensureColumn(db, "gateway_restart_sentinel", "stats_json TEXT");
}

function hardenStateDatabaseFiles() {
  if (!params.stateDatabasePath || typeof params.stateDatabasePath !== "string") {
    return;
  }
  for (const filePath of [
    params.stateDatabasePath,
    params.stateDatabasePath + "-wal",
    params.stateDatabasePath + "-shm",
  ]) {
    try {
      if (fs.existsSync(filePath)) {
        fs.chmodSync(filePath, 0o600);
      }
    } catch {
      // Best effort only.
    }
  }
}

function readRestartSentinelPayload() {
  const db = openStateDatabase();
  if (!db) {
    return null;
  }
  try {
    const row = db
      .prepare("SELECT version, payload_json FROM gateway_restart_sentinel WHERE sentinel_key = ?")
      .get("current");
    if (!row || row.version !== 1 || typeof row.payload_json !== "string") {
      return null;
    }
    return JSON.parse(row.payload_json);
  } catch {
    return null;
  } finally {
    hardenStateDatabaseFiles();
    try {
      db.close();
    } catch {}
  }
}

function writeRestartSentinelPayload(payload) {
  const db = openStateDatabase();
  if (!db) {
    return;
  }
  try {
    const updatedAtMs = Date.now();
    db.prepare(
      [
        "INSERT INTO gateway_restart_sentinel (",
        "sentinel_key, version, kind, status, ts, session_key, thread_id,",
        "delivery_channel, delivery_to, delivery_account_id, message, continuation_json,",
        "doctor_hint, stats_json, payload_json, updated_at_ms",
        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        "ON CONFLICT(sentinel_key) DO UPDATE SET",
        "version = excluded.version, kind = excluded.kind, status = excluded.status,",
        "ts = excluded.ts, session_key = excluded.session_key, thread_id = excluded.thread_id,",
        "delivery_channel = excluded.delivery_channel, delivery_to = excluded.delivery_to,",
        "delivery_account_id = excluded.delivery_account_id, message = excluded.message,",
        "continuation_json = excluded.continuation_json, doctor_hint = excluded.doctor_hint,",
        "stats_json = excluded.stats_json, payload_json = excluded.payload_json,",
        "updated_at_ms = excluded.updated_at_ms",
      ].join(" "),
    ).run(
      "current",
      1,
      payload.kind,
      payload.status,
      payload.ts,
      payload.sessionKey || null,
      payload.threadId || null,
      payload.deliveryContext && typeof payload.deliveryContext.channel === "string"
        ? payload.deliveryContext.channel
        : null,
      payload.deliveryContext && typeof payload.deliveryContext.to === "string"
        ? payload.deliveryContext.to
        : null,
      payload.deliveryContext && typeof payload.deliveryContext.accountId === "string"
        ? payload.deliveryContext.accountId
        : null,
      payload.message || null,
      payload.continuation ? JSON.stringify(payload.continuation) : null,
      payload.doctorHint || null,
      payload.stats ? JSON.stringify(payload.stats) : null,
      JSON.stringify(payload),
      updatedAtMs,
    );
  } catch (err) {
    appendLog("failed to write update sentinel failure: " + (err && err.stack ? err.stack : String(err)));
  } finally {
    hardenStateDatabaseFiles();
    try {
      db.close();
    } catch {}
  }
}

function buildFallbackFailurePayload(reason) {
  const metaFile = params.metaPath ? readJsonFile(params.metaPath) : null;
  const meta = metaFile && metaFile.version === 1 && metaFile.meta ? metaFile.meta : {};
  const payload = {
    kind: "update",
    status: "error",
    ts: Date.now(),
    message: typeof meta.note === "string" ? meta.note : null,
    stats: {
      mode: "unknown",
      ...(typeof meta.handoffId === "string" && meta.handoffId.trim()
        ? { handoffId: meta.handoffId }
        : {}),
      reason,
      steps: [],
      durationMs: 0,
    },
  };
  if (typeof meta.sessionKey === "string" && meta.sessionKey.trim()) {
    payload.sessionKey = meta.sessionKey;
  }
  if (meta.deliveryContext && typeof meta.deliveryContext === "object") {
    payload.deliveryContext = meta.deliveryContext;
  }
  if (typeof meta.threadId === "string" && meta.threadId.trim()) {
    payload.threadId = meta.threadId;
  }
  return payload;
}

function markUpdateSentinelFailureIfPending(reason) {
  let payload = readRestartSentinelPayload();
  if (payload && (payload.kind !== "update" || !isPendingUpdatePayload(payload))) {
    return;
  }
  const handoffId = typeof params.handoffId === "string" ? params.handoffId.trim() : "";
  if (payload && handoffId && (!payload.stats || payload.stats.handoffId !== handoffId)) {
    return;
  }
  if (payload) {
    payload = { ...payload, status: "error" };
    delete payload.continuation;
    payload.stats = { ...(payload.stats || {}), reason };
  } else {
    payload = buildFallbackFailurePayload(reason);
  }
  writeRestartSentinelPayload(payload);
}

function runServiceCommand(command, args) {
  try {
    const result = spawnSync(command, args, { stdio: "ignore", timeout: 30000 });
    return typeof result.status === "number" ? result.status : 1;
  } catch {
    return 1;
  }
}

function startGatewayServiceBestEffort() {
  const recovery = params.serviceRecovery;
  if (!recovery || typeof recovery !== "object" || !recovery.kind) {
    return;
  }
  let target = "";
  let status = 1;
  if (recovery.kind === "systemd") {
    target = recovery.unit;
    status = runServiceCommand("systemctl", ["--user", "start", recovery.unit]);
  } else if (recovery.kind === "launchd") {
    target = recovery.label;
    const serviceTarget = "gui/" + recovery.uid + "/" + recovery.label;
    status = runServiceCommand("launchctl", ["kickstart", serviceTarget]);
    if (status !== 0) {
      runServiceCommand("launchctl", ["enable", serviceTarget]);
      status = runServiceCommand("launchctl", [
        "bootstrap",
        "gui/" + recovery.uid,
        recovery.plistPath,
      ]);
      if (status !== 0) {
        // Bootstrap can fail when the label is already loaded. Retry start-only
        // so recovery does not bounce a gateway that is already running.
        status = runServiceCommand("launchctl", ["kickstart", serviceTarget]);
      }
    }
  } else if (recovery.kind === "schtasks") {
    target = recovery.taskName;
    status = runServiceCommand("schtasks.exe", ["/Run", "/TN", recovery.taskName]);
  } else {
    return;
  }
  appendLog(
    "gateway service recovery " +
      (status === 0 ? "succeeded" : "failed status=" + status) +
      " target=" +
      target,
  );
}

(async () => {
  const deadline =
    typeof params.parentExitTimeoutMs === "number"
      ? Date.now() + params.parentExitTimeoutMs
      : null;
  while (isPidAlive(params.parentPid) && (deadline === null || Date.now() < deadline)) {
    await sleep(250);
  }
  if (deadline !== null && isPidAlive(params.parentPid)) {
    appendLog("gateway parent pid " + params.parentPid + " did not exit before handoff timeout");
    markUpdateSentinelFailureIfPending("managed-service-handoff-parent-timeout");
    cleanupSensitiveFiles();
    process.exitCode = 1;
    return;
  }

  appendLog("starting managed update command: " + params.commandLabel);
  let outputFd;
  try {
    outputFd = fs.openSync(params.logPath, "a", 0o600);
    const commandCwd =
      resolveExistingDirectory([
        params.cwd,
        os.homedir(),
        os.tmpdir(),
        path.parse(process.execPath).root,
      ]) || params.cwd;
    if (commandCwd !== params.cwd) {
      appendLog("managed update command cwd fallback: " + params.cwd + " -> " + commandCwd);
    }
    const child = spawn(params.commandArgv[0], params.commandArgv.slice(1), {
      cwd: commandCwd,
      env: process.env,
      detached: true,
      stdio: ["ignore", outputFd, outputFd],
    });
    appendLog("managed update command pid=" + (child.pid || "unknown"));
    const exit = await new Promise((resolve) => {
      child.once("error", (err) => resolve({ error: err }));
      child.once("exit", (code, signal) => resolve({ code, signal }));
    });
    if (exit && exit.error) {
      appendLog("managed update command failed to start: " + (exit.error && exit.error.stack ? exit.error.stack : String(exit.error)));
      markUpdateSentinelFailureIfPending("managed-service-handoff-spawn-failed");
      startGatewayServiceBestEffort();
      process.exitCode = 1;
      return;
    }
    appendLog(
      "managed update command exited code=" +
        (exit && exit.code !== null && exit.code !== undefined ? exit.code : "null") +
        " signal=" +
        (exit && exit.signal ? exit.signal : "null"),
    );
    if (exit && typeof exit.code === "number" && exit.code !== 0) {
      markUpdateSentinelFailureIfPending("managed-service-handoff-failed");
      startGatewayServiceBestEffort();
      process.exitCode = exit.code;
    } else if (exit && exit.signal) {
      markUpdateSentinelFailureIfPending("managed-service-handoff-failed");
      startGatewayServiceBestEffort();
      process.exitCode = 1;
    }
  } finally {
    if (outputFd !== undefined) {
      try {
        fs.closeSync(outputFd);
      } catch {
        // Ignore close failures.
      }
    }
    cleanupSensitiveFiles();
  }
})().catch((err) => {
  appendLog("handoff failed: " + (err && err.stack ? err.stack : String(err)));
  markUpdateSentinelFailureIfPending("managed-service-handoff-helper-failed");
  startGatewayServiceBestEffort();
  cleanupSensitiveFiles();
  process.exitCode = 1;
});
`;
function isNodeLikeRuntime(execPath) {
	if (!execPath?.trim()) return false;
	const base = node_path.default.basename(execPath).toLowerCase();
	return base === "node" || base === "node.exe" || base === "bun" || base === "bun.exe";
}
function resolveUpdateCliArgv(params) {
	const updateArgs = [
		"update",
		"--yes",
		"--json"
	];
	if (params.channel) updateArgs.push("--channel", params.channel);
	if (typeof params.timeoutMs === "number" && Number.isFinite(params.timeoutMs)) updateArgs.push("--timeout", String(Math.max(1, Math.ceil(params.timeoutMs / 1e3))));
	const execPath = params.execPath?.trim();
	const argv1 = params.argv1?.trim();
	if (execPath && argv1) return [
		execPath,
		argv1,
		...updateArgs
	];
	if (execPath && !isNodeLikeRuntime(execPath)) return [execPath, ...updateArgs];
	return ["@gabrielvfonseca/operator", ...updateArgs];
}
function formatManagedServiceUpdateCommand(params) {
	const args = [
		"@gabrielvfonseca/operator",
		"update",
		"--yes"
	];
	if (params?.channel) args.push("--channel", params.channel);
	if (typeof params?.timeoutMs === "number" && Number.isFinite(params.timeoutMs)) args.push("--timeout", String(Math.max(1, Math.ceil(params.timeoutMs / 1e3))));
	return args.join(" ");
}
function resolveGatewayServiceRecovery(supervisor, env) {
	if (supervisor === "systemd") {
		const override = env.OPERATOR_SYSTEMD_UNIT?.trim();
		return {
			kind: "systemd",
			unit: override ? override.endsWith(".service") ? override : `${override}.service` : `${require_paths.resolveGatewaySystemdServiceName(env.OPERATOR_PROFILE)}.service`
		};
	}
	if (supervisor === "launchd") {
		const label = env.OPERATOR_LAUNCHD_LABEL?.trim() || require_paths.resolveGatewayLaunchAgentLabel(env.OPERATOR_PROFILE);
		const uid = typeof process.getuid === "function" ? process.getuid() : 501;
		const home = env.HOME?.trim() || node_os.default.homedir();
		return {
			kind: "launchd",
			uid,
			label,
			plistPath: node_path.default.join(home, "Library", "LaunchAgents", `${label}.plist`)
		};
	}
	if (supervisor === "schtasks") return {
		kind: "schtasks",
		taskName: env.OPERATOR_WINDOWS_TASK_NAME?.trim() || require_paths.resolveGatewayWindowsTaskName(env.OPERATOR_PROFILE)
	};
}
function stripSupervisorHintEnv(env) {
	const next = { ...env };
	for (const key of SUPERVISOR_HINT_ENV_VARS) {
		if (SERVICE_IDENTITY_ENV_VARS.has(key)) continue;
		delete next[key];
	}
	return next;
}
async function resolveManagedServiceHandoffCwd(root) {
	const candidates = [
		node_os.default.homedir(),
		node_os.default.tmpdir(),
		node_path.default.dirname(process.execPath),
		root
	];
	for (const candidate of candidates) {
		if (!candidate.trim()) continue;
		try {
			if ((await node_fs_promises.default.stat(candidate)).isDirectory()) return candidate;
		} catch {}
	}
	return root;
}
async function resolveExecutableOnPath(name, env, fallbackPaths) {
	const candidates = /* @__PURE__ */ new Set();
	const pathValue = env.PATH?.trim();
	if (pathValue) {
		for (const dir of pathValue.split(node_path.default.delimiter)) if (dir.trim()) candidates.add(node_path.default.join(dir, name));
	}
	for (const candidate of fallbackPaths) candidates.add(candidate);
	for (const candidate of candidates) try {
		await node_fs_promises.default.access(candidate, node_fs_promises.default.constants.X_OK);
		return candidate;
	} catch {}
	return null;
}
function sanitizeSystemdUnitFragment(value) {
	return (value?.trim().replace(/[^A-Za-z0-9_.:@-]+/gu, "-") ?? "").replace(/^-+|-+$/gu, "").slice(0, 80);
}
function buildSystemdHandoffUnitName(handoffId) {
	return `operator-update-${sanitizeSystemdUnitFragment(handoffId) || sanitizeSystemdUnitFragment(`${process.pid}-${Date.now()}`) || "handoff"}.scope`;
}
async function waitForHandoffReady(child) {
	const output = child.stdout;
	await new Promise((resolve, reject) => {
		let settled = false;
		let buffered = "";
		const cleanup = () => {
			clearTimeout(timeout);
			child.removeListener("error", onError);
			child.removeListener("exit", onExit);
			output.removeListener("data", onData);
			output.removeListener("error", onOutputError);
			output.destroy();
		};
		const finish = (err) => {
			if (settled) return;
			settled = true;
			cleanup();
			if (err) reject(err);
			else resolve();
		};
		const onError = (err) => finish(err);
		const onExit = (code, signal) => finish(/* @__PURE__ */ new Error(`managed update handoff exited before signaling readiness (code=${code ?? "null"}, signal=${signal ?? "null"})`));
		const terminateBeforeFailure = () => {
			if (typeof child.pid !== "number" || child.pid <= 0) return;
			require_child_process_tree.forceKillChildProcessTree(child);
		};
		const onOutputError = (err) => {
			terminateBeforeFailure();
			finish(err);
		};
		const onData = (chunk) => {
			buffered = `${buffered}${chunk.toString()}`.slice(-60);
			if (buffered.includes(HANDOFF_READY_MARKER)) finish();
		};
		const timeout = setTimeout(() => {
			terminateBeforeFailure();
			finish(/* @__PURE__ */ new Error("managed update handoff did not signal readiness within 30 seconds"));
		}, HANDOFF_READY_TIMEOUT_MS);
		child.once("error", onError);
		child.once("exit", onExit);
		output.once("error", onOutputError);
		output.on("data", onData);
	});
}
async function resolveHandoffSpawn(params) {
	if (params.supervisor !== "systemd") return {
		command: params.execPath,
		args: [params.scriptPath, params.paramsPath]
	};
	const systemdRunPath = await resolveExecutableOnPath("systemd-run", params.env, SYSTEMD_RUN_CANDIDATE_PATHS);
	if (!systemdRunPath) throw new Error("systemd-run is required to start the managed update handoff outside operator-gateway.service");
	return {
		command: systemdRunPath,
		args: [
			"--user",
			"--scope",
			"--collect",
			`--unit=${buildSystemdHandoffUnitName(params.handoffId)}`,
			params.execPath,
			params.scriptPath,
			params.paramsPath
		]
	};
}
async function startManagedServiceUpdateHandoff(params) {
	const dir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), MANAGED_SERVICE_UPDATE_HANDOFF_TEMP_PREFIX));
	const scriptPath = node_path.default.join(dir, "handoff.cjs");
	const paramsPath = node_path.default.join(dir, "handoff.json");
	const metaPath = node_path.default.join(dir, "sentinel-meta.json");
	const logPath = node_path.default.join(dir, "handoff.log");
	const commandArgv = resolveUpdateCliArgv({
		timeoutMs: params.timeoutMs,
		channel: params.channel,
		execPath: params.execPath ?? process.execPath,
		argv1: params.argv1 ?? process.argv[1]
	});
	const commandLabel = formatManagedServiceUpdateCommand({
		timeoutMs: params.timeoutMs,
		channel: params.channel
	});
	const handoffCwd = await resolveManagedServiceHandoffCwd(params.root);
	const metaFile = {
		version: 1,
		meta: params.meta
	};
	const helperParams = {
		parentPid: params.parentPid ?? process.pid,
		parentExitTimeoutMs: params.restartDrainTimeoutMs === void 0 ? null : Math.max(0, params.restartDelayMs ?? 0) + Math.max(0, params.restartDrainTimeoutMs) + PARENT_EXIT_SHUTDOWN_RESERVE_MS,
		cwd: handoffCwd,
		commandArgv,
		commandLabel,
		handoffId: params.handoffId,
		logPath,
		metaPath,
		stateDatabasePath: require_openclaw_state_db.resolveOperatorStateSqlitePath(params.env ?? process.env),
		sensitivePaths: [
			scriptPath,
			paramsPath,
			metaPath
		],
		serviceRecovery: resolveGatewayServiceRecovery(params.supervisor, params.env ?? process.env)
	};
	let child;
	try {
		await node_fs_promises.default.writeFile(scriptPath, `${HANDOFF_SCRIPT}\n`, { mode: 448 });
		await node_fs_promises.default.writeFile(paramsPath, `${JSON.stringify(helperParams, null, 2)}\n`, { mode: 384 });
		await node_fs_promises.default.writeFile(metaPath, `${JSON.stringify(metaFile, null, 2)}\n`, { mode: 384 });
		const env = {
			...stripSupervisorHintEnv(params.env ?? process.env),
			[require_update_control_plane_sentinel.CONTROL_PLANE_UPDATE_SENTINEL_META_ENV]: metaPath,
			OPERATOR_UPDATE_RUN_HANDOFF: "1"
		};
		const spawnTarget = await resolveHandoffSpawn({
			supervisor: params.supervisor,
			env,
			execPath: params.execPath ?? process.execPath,
			scriptPath,
			paramsPath,
			handoffId: params.handoffId
		});
		child = (0, node_child_process.spawn)(spawnTarget.command, spawnTarget.args, {
			cwd: handoffCwd,
			env,
			detached: true,
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			]
		});
		await waitForHandoffReady(child);
	} catch (err) {
		await node_fs_promises.default.rm(dir, {
			recursive: true,
			force: true
		}).catch(() => {});
		throw err;
	}
	child.unref();
	return {
		status: "started",
		...child.pid ? { pid: child.pid } : {},
		command: commandLabel,
		logPath
	};
}
function buildManagedServiceHandoffUnavailableMessage(command) {
	return ["Operator updates cannot safely run inside the live gateway process without a managed-service handoff.", `Run \`${command}\` from a shell outside the gateway service, or restart/update from the host UI.`].join("\n");
}
//#endregion
Object.defineProperty(exports, "buildManagedServiceHandoffUnavailableMessage", {
	enumerable: true,
	get: function() {
		return buildManagedServiceHandoffUnavailableMessage;
	}
});
Object.defineProperty(exports, "detectRespawnSupervisor", {
	enumerable: true,
	get: function() {
		return detectRespawnSupervisor;
	}
});
Object.defineProperty(exports, "formatManagedServiceUpdateCommand", {
	enumerable: true,
	get: function() {
		return formatManagedServiceUpdateCommand;
	}
});
Object.defineProperty(exports, "startManagedServiceUpdateHandoff", {
	enumerable: true,
	get: function() {
		return startManagedServiceUpdateHandoff;
	}
});
