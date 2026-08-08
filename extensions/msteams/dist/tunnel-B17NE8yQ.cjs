const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_src = require("./src-BcOJL8NE.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_kill_tree = require("./kill-tree-BxZeSfim.cjs");
require("./backoff-Dw8FZM0b.cjs");
const require_workspace_reconcile = require("./workspace-reconcile-6o8I3TBU.cjs");
const require_ssh = require("./ssh-Bl6XEwGu.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let node_crypto = require("node:crypto");
let node_child_process = require("node:child_process");
let node_timers_promises = require("node:timers/promises");
//#region src/gateway/worker-environments/tunnel-ssh-runner.ts
const WORKER_TUNNEL_READY_MARKER = "OPERATOR_WORKER_TUNNEL_READY";
const STOP_GRACE_MS = 1500;
function workerSshProcessError(stderr) {
	const detail = require_redact.redactSensitiveText(stderr, { mode: "tools" }).replace(/\s+/gu, " ").trim();
	return /* @__PURE__ */ new Error(detail ? `Worker SSH tunnel failed: ${detail}` : "Worker SSH tunnel failed");
}
/** Production runner that treats the remote post-forward marker as connection readiness. */
function createWorkerSshRunner() {
	return {
		run: require_exec.runCommandWithTimeout,
		start(argv, options) {
			const [command, ...args] = argv;
			if (!command) throw new Error("Worker SSH runner requires a command");
			const child = (0, node_child_process.spawn)(command, args, {
				env: options.baseEnv,
				stdio: [
					"pipe",
					"pipe",
					"pipe"
				],
				windowsHide: true
			});
			let closed = false;
			let readySettled = false;
			let resolveReady;
			let rejectReady;
			let resolveExited;
			const ready = new Promise((resolve, reject) => {
				resolveReady = resolve;
				rejectReady = reject;
			});
			const exited = new Promise((resolve) => {
				resolveExited = resolve;
			});
			let stdout = "";
			let stderr = "";
			const settleReadyError = () => {
				if (readySettled) return;
				readySettled = true;
				rejectReady(workerSshProcessError(stderr));
			};
			child.stdout.setEncoding("utf8");
			child.stdout.on("error", () => {});
			child.stdout.on("data", (chunk) => {
				if (readySettled) return;
				stdout = (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(`${stdout}${chunk}`, -4096);
				if (stdout.split(/\r?\n/u).includes("OPERATOR_WORKER_TUNNEL_READY")) {
					readySettled = true;
					resolveReady();
				}
			});
			child.stderr.setEncoding("utf8");
			child.stderr.on("error", () => {});
			child.stderr.on("data", (chunk) => {
				stderr = (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(`${stderr}${chunk}`, -4096);
			});
			child.once("error", settleReadyError);
			child.once("close", (code, signal) => {
				closed = true;
				settleReadyError();
				resolveExited({
					code,
					signal
				});
			});
			child.stdin.on("error", () => {});
			if (options.input !== void 0) child.stdin.end(options.input);
			else child.stdin.end();
			let stopPromise;
			return {
				ready,
				exited,
				stop() {
					return stopPromise ??= (async () => {
						if (closed) return;
						child.kill("SIGTERM");
						let timer;
						await Promise.race([exited, new Promise((resolve) => {
							timer = setTimeout(resolve, STOP_GRACE_MS);
							timer.unref?.();
						})]);
						clearTimeout(timer);
						if (!closed) {
							child.kill("SIGKILL");
							await exited;
						}
					})();
				}
			};
		}
	};
}
//#endregion
//#region src/gateway/worker-environments/workspace-sync-helpers.ts
const MANIFEST_REF_PATTERN = /^sha256:[a-f0-9]{64}$/u;
function waitForQuiescenceRenewal(signal, intervalMs) {
	if (signal.aborted) return Promise.resolve(false);
	return new Promise((resolve) => {
		const onAbort = () => {
			clearTimeout(timer);
			resolve(false);
		};
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve(true);
		}, intervalMs);
		signal.addEventListener("abort", onAbort, { once: true });
	});
}
function workerWorkspaceCommandSucceeded(result) {
	return result.termination === "exit" && result.code === 0;
}
function workspaceSyncError(result) {
	const detail = require_redact.redactSensitiveText(result.stderr || result.stdout, { mode: "tools" }).replace(/\s+/gu, " ").trim();
	return /* @__PURE__ */ new Error(detail ? `Worker workspace sync failed: ${detail}` : "Worker workspace sync failed");
}
function stableWorkerPathComponent(value, length) {
	return (0, node_crypto.createHash)("sha256").update(value).digest("hex").slice(0, length);
}
function validateWorkspaceSyncRequest(request) {
	if (!request.sessionId.trim()) throw new Error("Worker workspace session id must be non-empty");
	if (!node_path.default.isAbsolute(request.localPath)) throw new Error("Worker workspace local path must be absolute");
	if (!Number.isSafeInteger(request.generation) || request.generation < 0) throw new Error("Worker workspace generation must be a non-negative safe integer");
}
function parseRemoteWorkspaceDirectory(stdout) {
	const lines = stdout.split(/\r?\n/u).filter(Boolean);
	const directory = lines.length === 1 ? lines[0] : void 0;
	if (!directory || !node_path.default.posix.isAbsolute(directory) || node_path.default.posix.normalize(directory) !== directory || directory === "/") throw new Error("Worker workspace setup returned an invalid remote directory");
	return directory;
}
function parseManifestRef(stdout) {
	const lines = stdout.split(/\r?\n/u).filter(Boolean);
	const manifestRef = lines.length === 1 ? lines[0] : void 0;
	if (!manifestRef || !MANIFEST_REF_PATTERN.test(manifestRef)) throw new Error("Worker workspace sync returned an invalid manifest reference");
	return manifestRef;
}
async function readTransferredManifest(filePath) {
	const stats = await node_fs_promises.default.lstat(filePath).catch((error) => {
		if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return;
		throw error;
	});
	if (!stats?.isFile() || stats.isSymbolicLink() || stats.size > 64 * 1024 * 1024) throw new Error("Worker workspace manifest transfer is not a bounded regular file");
	return await node_fs_promises.default.readFile(filePath, "utf8");
}
async function inboundDirectoryUsage(root, limits) {
	let bytes = 0;
	let entries = 0;
	const walk = async (directory) => {
		for await (const directoryEntry of await node_fs_promises.default.opendir(directory)) {
			const candidate = node_path.default.join(directory, directoryEntry.name);
			const stats = await node_fs_promises.default.lstat(candidate).catch((error) => {
				if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return;
				throw error;
			});
			if (!stats) continue;
			entries += 1;
			if (entries > limits.entries) return;
			if (stats.isDirectory() && !stats.isSymbolicLink()) await walk(candidate);
			else if (stats.isFile()) {
				bytes += stats.size;
				if (bytes > limits.bytes) return;
			}
			if (bytes > limits.bytes || entries > limits.entries) return;
		}
	};
	await walk(root);
	return {
		bytes,
		entries
	};
}
async function runBoundedInboundRsync(params) {
	const quotaAbort = new AbortController();
	const signal = AbortSignal.any([params.ownerSignal, quotaAbort.signal]);
	const transfer = params.runTask(params.argv, require_ssh.workerSshCommandOptions({
		timeoutMs: params.timeoutMs,
		signal
	}));
	const transferSettled = transfer.then(() => true, () => true);
	let quotaError;
	while (!await Promise.race([transferSettled, (0, node_timers_promises.setTimeout)(25).then(() => false)])) {
		const usage = await inboundDirectoryUsage(params.destinationRoot, {
			bytes: params.totalByteLimit,
			entries: params.entryLimit
		});
		if (usage.bytes > params.totalByteLimit || usage.entries > params.entryLimit) {
			quotaError = /* @__PURE__ */ new Error(`Cloud workspace inbound transfer exceeds its ${params.totalByteLimit} byte or ${params.entryLimit} entry limit`);
			quotaAbort.abort(quotaError);
			break;
		}
	}
	let result;
	try {
		result = await transfer;
	} catch (error) {
		throw quotaError ?? error;
	}
	const finalUsage = await inboundDirectoryUsage(params.destinationRoot, {
		bytes: params.totalByteLimit,
		entries: params.entryLimit
	});
	if (quotaError || finalUsage.bytes > params.totalByteLimit || finalUsage.entries > params.entryLimit) throw quotaError ?? /* @__PURE__ */ new Error(`Cloud workspace inbound transfer exceeds its ${params.totalByteLimit} byte or ${params.entryLimit} entry limit`);
	return result;
}
//#endregion
//#region src/gateway/worker-environments/workspace-sync-local.ts
const COMMAND_KILL_GRACE_MS = 300;
function validateGitRelativePath(file) {
	if (!file || node_path.default.posix.isAbsolute(file) || node_path.default.posix.normalize(file) !== file || file === ".." || file.startsWith("../")) throw new Error("Worker workspace git file list contains an unsafe path");
	return file;
}
async function* readNulFile(filePath) {
	let pending = Buffer.alloc(0);
	for await (const value of (0, node_fs.createReadStream)(filePath)) {
		const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
		const buffer = pending.length === 0 ? chunk : Buffer.concat([pending, chunk]);
		let offset = 0;
		for (;;) {
			const separator = buffer.indexOf(0, offset);
			if (separator < 0) break;
			yield validateGitRelativePath(buffer.subarray(offset, separator).toString("utf8"));
			offset = separator + 1;
		}
		pending = Buffer.from(buffer.subarray(offset));
	}
	if (pending.length > 0) throw new Error("Worker workspace git file list is not NUL terminated");
}
async function runLocalCommandToFile(params) {
	const [command, ...args] = params.argv;
	if (!command) throw new Error("Worker workspace command requires an executable");
	const output = await node_fs_promises.default.open(params.outputPath, "wx", 384);
	const input = params.inputPath ? await node_fs_promises.default.open(params.inputPath, "r") : void 0;
	let stderr = "";
	let timer;
	let terminationTimer;
	let abort;
	try {
		if (params.signal.aborted) throw new Error("Worker workspace file enumeration was aborted");
		const child = (0, node_child_process.spawn)(command, args, {
			env: require_ssh.workerSshCommandOptions({ timeoutMs: params.timeoutMs }).baseEnv,
			stdio: [
				input?.fd ?? "ignore",
				output.fd,
				"pipe"
			],
			...process.platform !== "win32" ? { detached: true } : {},
			windowsHide: true
		});
		const childStderr = child.stderr;
		if (!childStderr) throw new Error("Worker workspace command has no stderr pipe");
		childStderr.setEncoding("utf8");
		childStderr.on("data", (chunk) => {
			stderr = (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(`${stderr}${chunk}`, -4096);
		});
		const result = await new Promise((resolve) => {
			let settled = false;
			const finish = (value) => {
				if (settled) return;
				settled = true;
				resolve(value);
			};
			let terminationStarted = false;
			const terminate = () => {
				if (settled || terminationStarted) return;
				terminationStarted = true;
				const pid = child.pid;
				if (typeof pid === "number" && pid > 0) require_kill_tree.killProcessTree(pid, { graceMs: COMMAND_KILL_GRACE_MS });
				else child.kill("SIGTERM");
				terminationTimer = setTimeout(() => {
					if (typeof pid === "number" && pid > 0) require_kill_tree.killProcessTree(pid, { force: true });
					else child.kill("SIGKILL");
					childStderr.destroy();
					finish({ code: null });
				}, 1300);
				terminationTimer.unref?.();
			};
			child.once("error", (error) => finish({
				code: null,
				error
			}));
			child.once("close", (code) => finish({ code }));
			abort = terminate;
			params.signal.addEventListener("abort", abort, { once: true });
			timer = setTimeout(terminate, params.timeoutMs);
			timer.unref?.();
			if (params.signal.aborted) terminate();
		});
		if (result.error) throw result.error;
		if (params.signal.aborted) throw new Error("Worker workspace file enumeration was aborted");
		if (result.code !== 0) throw new Error(stderr.trim() ? `Worker workspace file enumeration failed: ${stderr.trim()}` : "Worker workspace file enumeration failed");
	} finally {
		clearTimeout(timer);
		clearTimeout(terminationTimer);
		if (abort) params.signal.removeEventListener("abort", abort);
		await output.close();
		await input?.close();
	}
}
function hasErrorCode(error, code) {
	return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" && error.code === code;
}
async function writeEligibleGitFiles(params) {
	const output = await node_fs_promises.default.open(params.outputPath, "wx", 384);
	const canonicalRoot = await node_fs_promises.default.realpath(params.gitRoot);
	let buffered = [];
	let bufferedBytes = 0;
	const flush = async () => {
		if (buffered.length === 0) return;
		await output.write(buffered.join(""));
		buffered = [];
		bufferedBytes = 0;
	};
	const appendIfTransferable = async (file) => {
		const absolute = node_path.default.join(canonicalRoot, file);
		const stats = await node_fs_promises.default.lstat(absolute).catch((error) => {
			if (hasErrorCode(error, "ENOENT")) return;
			throw error;
		});
		if (!stats || !stats.isFile() && !stats.isSymbolicLink()) return;
		if (stats.isSymbolicLink()) {
			const target = await node_fs_promises.default.readlink(absolute);
			const resolvedTarget = node_path.default.resolve(node_path.default.dirname(absolute), target);
			if (resolvedTarget !== canonicalRoot && !resolvedTarget.startsWith(canonicalRoot + node_path.default.sep)) throw new Error(`worker workspace symlink escapes the sync root: ${file}`);
		}
		const record = `${file}\0`;
		buffered.push(record);
		bufferedBytes += Buffer.byteLength(record);
		if (bufferedBytes >= 64 * 1024) await flush();
	};
	try {
		for await (const file of readNulFile(params.eligiblePath)) await appendIfTransferable(file);
		const ignored = readNulFile(params.ignoredPath)[Symbol.asyncIterator]();
		const selected = readNulFile(params.selectedPath)[Symbol.asyncIterator]();
		let ignoredItem = await ignored.next();
		let selectedItem = await selected.next();
		while (!ignoredItem.done && !selectedItem.done) {
			const order = Buffer.compare(Buffer.from(ignoredItem.value), Buffer.from(selectedItem.value));
			if (order === 0) {
				await appendIfTransferable(ignoredItem.value);
				ignoredItem = await ignored.next();
				selectedItem = await selected.next();
			} else if (order < 0) ignoredItem = await ignored.next();
			else selectedItem = await selected.next();
		}
		await flush();
	} finally {
		await output.close();
	}
}
//#endregion
//#region src/gateway/worker-environments/workspace-sync-scripts.ts
const REMOTE_WORKSPACE_SETUP_SCRIPT = String.raw`set -eu
relative=$1
root=$HOME/.operator-worker

ensure_private_directory() {
  directory=$1
  if [ -e "$directory" ] || [ -L "$directory" ]; then
    if [ ! -d "$directory" ] || [ -L "$directory" ]; then
      printf '%s\n' 'unsafe worker workspace directory' >&2
      exit 2
    fi
  else
    mkdir "$directory"
  fi
  chmod 700 "$directory"
}

ensure_private_directory "$root"
current=$root
old_ifs=$IFS
IFS=/
set -- $relative
IFS=$old_ifs
for segment in "$@"; do
  current=$current/$segment
  ensure_private_directory "$current"
done
cd "$current"
find . -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
pwd -P
`;
const REMOTE_WORKSPACE_QUIESCE_JS = String.raw`const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const root = fs.realpathSync(process.argv[1]);
if (typeof process.getuid !== "function") throw new Error("workspace quiescence requires POSIX");
const uid = process.getuid();
if (uid === 0) throw new Error("workspace quiescence refuses root-owned worker sessions");
const sleeper = new Int32Array(new SharedArrayBuffer(4));
const leaseDirectory = path.join(os.homedir(), ".operator-worker", "quiescence");
fs.mkdirSync(leaseDirectory, { recursive: true, mode: 0o700 });
fs.chmodSync(leaseDirectory, 0o700);
const workspaceKey = crypto.createHash("sha256").update(root).digest("hex");
const nonce = crypto.randomBytes(16).toString("hex");
const leasePath = path.join(leaseDirectory, workspaceKey + "." + nonce + ".json");
const watchdogTimeoutMs = Number(process.argv[2] || 12 * 60 * 1000);
if (!Number.isSafeInteger(watchdogTimeoutMs) || watchdogTimeoutMs < 1) throw new Error("invalid watchdog timeout");
function processes() {
  const output = childProcess.execFileSync("ps", ["-axo", "pid=,ppid=,uid=,stat=,lstart="], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  const rows = new Map();
  for (const line of output.split("\n")) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
    if (!match) continue;
    rows.set(Number(match[1]), {
      ppid: Number(match[2]),
      uid: Number(match[3]),
      state: match[4],
      start: match[5],
    });
  }
  return rows;
}
function ancestors(rows) {
  const result = new Set();
  let pid = process.pid;
  while (pid > 0 && !result.has(pid)) {
    result.add(pid);
    pid = rows.get(pid)?.ppid || 0;
  }
  return result;
}
const frozen = new Map();
let watchdogReference = null;
function processIdentity(pid) {
  try {
    const start = childProcess.execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], {
      encoding: "utf8",
      maxBuffer: 4096,
    }).trim();
    return start || null;
  } catch (error) {
    if (error && error.status === 1) return null;
    throw error;
  }
}
function validProcessReference(value) {
  return value && Number.isSafeInteger(value.pid) && value.pid > 0 && typeof value.start === "string" && value.start.length > 0 && value.start.length <= 128;
}
function parseLease(raw, expectedNonce) {
  const lease = JSON.parse(raw);
  if (
    !lease ||
    lease.version !== 1 ||
    lease.nonce !== expectedNonce ||
    !Array.isArray(lease.processes) ||
    lease.processes.length > 4096 ||
    lease.processes.some((entry) => !validProcessReference(entry)) ||
    (lease.watchdog !== null && !validProcessReference(lease.watchdog)) ||
    !Number.isSafeInteger(lease.expiresAtMs) ||
    lease.expiresAtMs < 1
  ) {
    throw new Error("invalid workspace quiescence lease");
  }
  return lease;
}
function persistLease(expiresAtMs = Date.now() + watchdogTimeoutMs) {
  const temporary = leasePath + "." + process.pid + "." + crypto.randomBytes(8).toString("hex");
  const processes = [...frozen].map(([pid, start]) => ({ pid, start }));
  fs.writeFileSync(temporary, JSON.stringify({ version: 1, nonce, processes, watchdog: watchdogReference, expiresAtMs }), { mode: 0o600, flag: "wx" });
  fs.renameSync(temporary, leasePath);
}
function resumeProcesses(entries) {
  for (const entry of entries) {
    if (processIdentity(entry.pid) !== entry.start) continue;
    try {
      process.kill(entry.pid, "SIGCONT");
    } catch (error) {
      if (!error || error.code !== "ESRCH") throw error;
    }
  }
}
const orphanNames = fs.readdirSync(leaseDirectory).filter((name) =>
  name.startsWith(workspaceKey + ".") && name.endsWith(".json"),
);
if (orphanNames.length > 16) throw new Error("too many workspace quiescence leases");
for (const name of orphanNames) {
  const match = name.match(/^[a-f0-9]{64}\.([a-f0-9]{32})\.json$/);
  if (!match) continue;
  const orphanPath = path.join(leaseDirectory, name);
  const lease = parseLease(fs.readFileSync(orphanPath, "utf8"), match[1]);
  if (lease.watchdog !== null && processIdentity(lease.watchdog.pid) === lease.watchdog.start) {
    try { process.kill(lease.watchdog.pid, "SIGTERM"); } catch (error) { if (!error || error.code !== "ESRCH") throw error; }
  }
  resumeProcesses(lease.processes);
  fs.unlinkSync(orphanPath);
}
persistLease();
const watchdog = childProcess.spawn(
  process.execPath,
  ["-e", "(" + watchdogMain.toString() + ")(process.argv[1], process.argv[2])", leasePath, nonce],
  { detached: true, stdio: "ignore" },
);
watchdog.unref();
if (!Number.isSafeInteger(watchdog.pid) || watchdog.pid < 1) {
  fs.unlinkSync(leasePath);
  throw new Error("workspace quiescence watchdog did not start");
}
let watchdogStart = null;
for (let attempt = 0; attempt < 100 && !watchdogStart; attempt += 1) {
  watchdogStart = processIdentity(watchdog.pid);
  if (!watchdogStart) Atomics.wait(sleeper, 0, 0, 10);
}
if (!watchdogStart) {
  try { process.kill(watchdog.pid, "SIGTERM"); } catch {}
  fs.unlinkSync(leasePath);
  throw new Error("workspace quiescence watchdog identity was not observable");
}
watchdogReference = { pid: watchdog.pid, start: watchdogStart };
persistLease();
let quietScans = 0;
try {
  for (let attempt = 0; attempt < 250 && quietScans < 3; attempt += 1) {
    const before = processes();
    const preserved = ancestors(before);
    const candidates = [...before.entries()].filter(
      ([pid, row]) =>
        row.uid === uid &&
        !preserved.has(pid) &&
        row.ppid !== process.pid &&
        pid !== watchdog.pid &&
        !frozen.has(pid) &&
        !row.state.startsWith("T") &&
        !row.state.startsWith("Z") &&
        !row.state.startsWith("X"),
    );
    if (candidates.length + frozen.size > 4096) {
      throw new Error("too many worker processes to quiesce safely");
    }
    for (const [pid, row] of candidates) {
      try {
        frozen.set(pid, row.start);
        persistLease();
        if (processIdentity(pid) !== row.start) {
          frozen.delete(pid);
          persistLease();
          continue;
        }
        process.kill(pid, "SIGSTOP");
      } catch (error) {
        if (!error || error.code !== "ESRCH") throw error;
      }
    }
    Atomics.wait(sleeper, 0, 0, 20);
    const after = processes();
    const afterPreserved = ancestors(after);
    const writable = [...after.entries()].some(
      ([pid, row]) =>
        row.uid === uid &&
        !afterPreserved.has(pid) &&
        row.ppid !== process.pid &&
        pid !== watchdog.pid &&
        !row.state.startsWith("T") &&
        !row.state.startsWith("Z") &&
        !row.state.startsWith("X"),
    );
    quietScans = writable ? 0 : quietScans + 1;
  }
  if (quietScans < 3) {
    throw new Error("worker processes did not reach a quiescent state");
  }
} catch (error) {
  if (processIdentity(watchdog.pid) === watchdogStart) {
    try { process.kill(watchdog.pid, "SIGTERM"); } catch (killError) { if (!killError || killError.code !== "ESRCH") throw killError; }
  }
  resumeProcesses([...frozen].map(([pid, start]) => ({ pid, start })));
  try { fs.unlinkSync(leasePath); } catch (unlinkError) { if (!unlinkError || unlinkError.code !== "ENOENT") throw unlinkError; }
  throw error;
}
function watchdogMain(watchedLeasePath, watchedNonce) {
  const check = () => {
    try {
      const watchdogFs = require("node:fs");
      const lease = JSON.parse(watchdogFs.readFileSync(watchedLeasePath, "utf8"));
      if (
        !lease ||
        lease.version !== 1 ||
        lease.nonce !== watchedNonce ||
        !Array.isArray(lease.processes) ||
        !Number.isSafeInteger(lease.expiresAtMs)
      ) return;
      const remainingMs = lease.expiresAtMs - Date.now();
      if (remainingMs > 0) {
        setTimeout(check, Math.min(remainingMs, 60 * 1000));
        return;
      }
      // Re-read at expiry so a renewal that raced this wake-up wins before SIGCONT.
      const latest = JSON.parse(watchdogFs.readFileSync(watchedLeasePath, "utf8"));
      if (
        latest &&
        latest.version === 1 &&
        latest.nonce === watchedNonce &&
        Array.isArray(latest.processes) &&
        Number.isSafeInteger(latest.expiresAtMs) &&
        latest.expiresAtMs > Date.now()
      ) {
        setTimeout(check, Math.min(latest.expiresAtMs - Date.now(), 60 * 1000));
        return;
      }
      const watchdogChildProcess = require("node:child_process");
      const identity = (pid) => {
        try {
          return watchdogChildProcess.execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8", maxBuffer: 4096 }).trim() || null;
        } catch (error) {
          if (error && error.status === 1) return null;
          throw error;
        }
      };
      for (const entry of lease.processes) {
        if (
          !entry ||
          !Number.isSafeInteger(entry.pid) ||
          entry.pid < 1 ||
          typeof entry.start !== "string" ||
          identity(entry.pid) !== entry.start
        ) continue;
        try { process.kill(entry.pid, "SIGCONT"); } catch (error) { if (!error || error.code !== "ESRCH") throw error; }
      }
      watchdogFs.unlinkSync(watchedLeasePath);
    } catch (error) {
      if (!error || error.code !== "ENOENT") process.exitCode = 1;
    }
  };
  check();
}
process.stdout.write("quiesced " + nonce + "\n");
`;
const REMOTE_WORKSPACE_RENEW_QUIESCENCE_JS = String.raw`const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const root = fs.realpathSync(process.argv[1]);
const nonce = process.argv[2];
const timeoutMs = Number(process.argv[3] || 12 * 60 * 1000);
const validationMode = process.argv[4] || "final";
if (typeof process.getuid !== "function") throw new Error("workspace quiescence requires POSIX");
const uid = process.getuid();
if (!/^[a-f0-9]{32}$/.test(nonce || "")) throw new Error("invalid workspace quiescence nonce");
if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 10 * 1000) throw new Error("invalid watchdog timeout");
if (validationMode !== "heartbeat" && validationMode !== "final") throw new Error("invalid workspace quiescence validation mode");
const leasePath = path.join(os.homedir(), ".operator-worker", "quiescence", crypto.createHash("sha256").update(root).digest("hex") + "." + nonce + ".json");
const input = JSON.parse(fs.readFileSync(leasePath, "utf8"));
if (
  !input ||
  input.version !== 1 ||
  input.nonce !== nonce ||
  !Array.isArray(input.processes) ||
  input.processes.length > 4096 ||
  input.processes.some((entry) => !entry || !Number.isSafeInteger(entry.pid) || entry.pid < 1 || typeof entry.start !== "string" || !entry.start || entry.start.length > 128) ||
  !input.watchdog ||
  !Number.isSafeInteger(input.watchdog.pid) ||
  input.watchdog.pid < 1 ||
  typeof input.watchdog.start !== "string" ||
  !input.watchdog.start ||
  input.watchdog.start.length > 128 ||
  !Number.isSafeInteger(input.expiresAtMs) ||
  input.expiresAtMs - Date.now() < 5000
) {
  throw new Error("workspace quiescence lease is no longer active");
}
function processStatus(pid) {
  try {
    const output = childProcess.execFileSync("ps", ["-o", "stat=,lstart=", "-p", String(pid)], { encoding: "utf8", maxBuffer: 4096 }).trim();
    const match = /^(\S+)\s+(.+)$/u.exec(output);
    return match ? { state: match[1], start: match[2] } : null;
  } catch (error) {
    if (error && error.status === 1) return null;
    throw error;
  }
}
function processes() {
  const output = childProcess.execFileSync("ps", ["-axo", "pid=,ppid=,uid=,stat=,lstart="], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  const rows = new Map();
  for (const line of output.split("\n")) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
    if (!match) continue;
    rows.set(Number(match[1]), {
      ppid: Number(match[2]),
      uid: Number(match[3]),
      state: match[4],
      start: match[5],
    });
  }
  return rows;
}
function ancestors(rows) {
  const result = new Set();
  let pid = process.pid;
  while (pid > 0 && !result.has(pid)) {
    result.add(pid);
    pid = rows.get(pid)?.ppid || 0;
  }
  return result;
}
for (const entry of input.processes) {
  const status = processStatus(entry.pid);
  if (!status || status.start !== entry.start) continue;
  const state = status.state;
  if (state && !state.startsWith("T")) throw new Error("workspace quiescence process resumed unexpectedly");
}
const watchdogStatus = processStatus(input.watchdog.pid);
if (!watchdogStatus || watchdogStatus.start !== input.watchdog.start) {
  throw new Error("workspace quiescence watchdog identity changed unexpectedly");
}
try { process.kill(input.watchdog.pid, 0); } catch (error) {
  if (error && error.code === "ESRCH") throw new Error("workspace quiescence watchdog exited unexpectedly");
  throw error;
}
if (validationMode === "final") {
  const rows = processes();
  const preserved = ancestors(rows);
  const frozen = new Map(input.processes.map((entry) => [entry.pid, entry.start]));
  const newWritableProcess = [...rows.entries()].some(
    ([pid, row]) =>
      row.uid === uid &&
      !preserved.has(pid) &&
      row.ppid !== process.pid &&
      pid !== input.watchdog.pid &&
      frozen.get(pid) !== row.start &&
      !row.state.startsWith("T") &&
      !row.state.startsWith("Z") &&
      !row.state.startsWith("X"),
  );
  if (newWritableProcess) {
    throw new Error("workspace quiescence observed a new writable process");
  }
}
const renewed = { ...input, expiresAtMs: Date.now() + timeoutMs };
const temporary = leasePath + "." + process.pid + "." + crypto.randomBytes(8).toString("hex");
fs.writeFileSync(temporary, JSON.stringify(renewed), { mode: 0o600, flag: "wx" });
fs.renameSync(temporary, leasePath);
const confirmed = JSON.parse(fs.readFileSync(leasePath, "utf8"));
if (confirmed.nonce !== nonce || confirmed.expiresAtMs !== renewed.expiresAtMs) {
  throw new Error("workspace quiescence renewal was not durable");
}
process.stdout.write("renewed " + nonce + "\n");
`;
const REMOTE_WORKSPACE_RESUME_JS = String.raw`const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
if (typeof process.getuid !== "function") throw new Error("workspace quiescence requires POSIX");
const root = fs.realpathSync(process.argv[1]);
const nonce = process.argv[2];
if (!/^[a-f0-9]{32}$/.test(nonce || "")) throw new Error("invalid workspace quiescence nonce");
const leasePath = path.join(os.homedir(), ".operator-worker", "quiescence", crypto.createHash("sha256").update(root).digest("hex") + "." + nonce + ".json");
let raw;
try { raw = fs.readFileSync(leasePath, "utf8"); } catch (error) {
  if (error && error.code === "ENOENT") process.exit(0);
  throw error;
}
const input = JSON.parse(raw);
if (
  !input ||
  input.version !== 1 ||
  input.nonce !== nonce ||
  !Array.isArray(input.processes) ||
  input.processes.length > 4096 ||
  input.processes.some((entry) => !entry || !Number.isSafeInteger(entry.pid) || entry.pid < 1 || typeof entry.start !== "string" || !entry.start || entry.start.length > 128) ||
  (input.watchdog !== null && (!input.watchdog || !Number.isSafeInteger(input.watchdog.pid) || input.watchdog.pid < 1 || typeof input.watchdog.start !== "string" || !input.watchdog.start || input.watchdog.start.length > 128)) ||
  !Number.isSafeInteger(input.expiresAtMs) ||
  input.expiresAtMs < 1
) {
  throw new Error("invalid workspace quiescence lease");
}
function identity(pid) {
  try {
    return require("node:child_process").execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8", maxBuffer: 4096 }).trim() || null;
  } catch (error) {
    if (error && error.status === 1) return null;
    throw error;
  }
}
if (input.watchdog !== null && identity(input.watchdog.pid) === input.watchdog.start) {
  try { process.kill(input.watchdog.pid, "SIGTERM"); } catch (error) { if (!error || error.code !== "ESRCH") throw error; }
}
for (const entry of input.processes) {
  if (identity(entry.pid) !== entry.start) continue;
  try { process.kill(entry.pid, "SIGCONT"); } catch (error) { if (!error || error.code !== "ESRCH") throw error; }
}
fs.unlinkSync(leasePath);
`;
const REMOTE_GIT_WORKSPACE_SETUP_SCRIPT = String.raw`set -eu
workspace=$1
pack=$2
base=$3
author_name=$4
author_email=$5
cd "$workspace"
if ! command -v git >/dev/null 2>&1; then
  printf '%s\n' 'git is required for a git worker workspace' >&2
  exit 2
fi
case ${"${"}#base} in
  40) git init -q . ;;
  64) git init -q --object-format=sha256 . ;;
  *) printf '%s\n' 'invalid worker git base object id' >&2; exit 2 ;;
esac
git index-pack --stdin < "$pack" >/dev/null
printf '%s\n' "$base" > .git/shallow
actual=$(git rev-parse --verify "$base^{commit}")
if [ "$actual" != "$base" ]; then
  printf '%s\n' 'worker git base does not match the synced pack' >&2
  exit 2
fi
git update-ref refs/heads/operator-worker "$base"
git symbolic-ref HEAD refs/heads/operator-worker
git read-tree "$base"
git ls-files --stage -z | node -e '
const childProcess = require("node:child_process");
const chunks = [];
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  const paths = Buffer.concat(chunks)
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .flatMap((record) => {
      const separator = record.indexOf("\t");
      return separator >= 0 && record.startsWith("160000 ") ? [record.slice(separator + 1)] : [];
    });
  if (paths.length > 0) {
    childProcess.execFileSync("git", ["update-index", "--skip-worktree", "--", ...paths]);
  }
});'
rm -f -- "$pack"
if [ -n "$author_name" ]; then git config user.name "$author_name"; fi
if [ -n "$author_email" ]; then git config user.email "$author_email"; fi
`;
const REMOTE_WORKSPACE_MANIFEST_JS = String.raw`const crypto = require("node:crypto");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const root = fs.realpathSync(process.argv[1]);
const requestedBaseCommit = process.argv[2] || null;
const eligibleOnly = process.argv[3] === "eligible";
const priorManifestDigests = [...new Set(process.argv.slice(4).filter(Boolean))];
const entriesByPath = new Map();
function fail(message) {
  throw new Error(message);
}
function addEntry(relative) {
  if (
    !relative ||
    path.posix.isAbsolute(relative) ||
    path.posix.normalize(relative) !== relative ||
    relative === ".." ||
    relative.startsWith("../")
  ) {
    fail("unsafe worker workspace path: " + relative);
  }
  if (entriesByPath.has(relative)) return;
  const absolute = path.join(root, relative);
  let stats;
  try {
    stats = fs.lstatSync(absolute);
  } catch (error) {
    if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) return;
    throw error;
  }
  const mode = stats.mode & 0o777;
  if (stats.isDirectory()) {
    entriesByPath.set(relative, { path: relative, type: "directory", mode });
  } else if (stats.isFile()) {
    entriesByPath.set(relative, { path: relative, type: "file", mode, size: stats.size, sha256: null });
  } else if (stats.isSymbolicLink()) {
    const target = fs.readlinkSync(absolute);
    if (target.includes("\\") || path.posix.isAbsolute(target) || path.win32.parse(target).root) {
      fail("worker workspace symlink must be portable and relative: " + relative);
    }
    const resolvedTarget = path.resolve(path.dirname(absolute), target);
    if (resolvedTarget !== root && !resolvedTarget.startsWith(root + path.sep)) {
      fail("worker workspace symlink escapes the sync root: " + relative);
    }
    entriesByPath.set(relative, { path: relative, type: "symlink", mode, target });
  } else {
    fail("unsupported worker workspace entry: " + relative);
  }
}
function addWithParents(relative) {
  const segments = relative.split("/");
  for (let index = 1; index < segments.length; index += 1) {
    addEntry(segments.slice(0, index).join("/"));
  }
  addEntry(relative);
}
function walk(relativeDirectory) {
  const absoluteDirectory = relativeDirectory ? path.join(root, relativeDirectory) : root;
  for (const name of fs.readdirSync(absoluteDirectory).sort()) {
    if (!relativeDirectory && name === ".git") {
      continue;
    }
    const relative = relativeDirectory ? relativeDirectory + "/" + name : name;
    const absolute = path.join(root, relative);
    const stats = fs.lstatSync(absolute);
    const mode = stats.mode & 0o777;
    if (stats.isDirectory()) {
      entriesByPath.set(relative, { path: relative, type: "directory", mode });
      walk(relative);
    } else if (stats.isFile()) {
      entriesByPath.set(relative, {
        path: relative,
        type: "file",
        mode,
        size: stats.size,
        sha256: null,
      });
    } else if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(absolute);
      if (target.includes("\\") || path.posix.isAbsolute(target) || path.win32.parse(target).root) {
        fail("worker workspace symlink must be portable and relative: " + relative);
      }
      const resolvedTarget = path.resolve(path.dirname(absolute), target);
      if (resolvedTarget !== root && !resolvedTarget.startsWith(root + path.sep)) {
        fail("worker workspace symlink escapes the sync root: " + relative);
      }
      entriesByPath.set(relative, { path: relative, type: "symlink", mode, target });
    } else {
      fail("unsupported worker workspace entry: " + relative);
    }
  }
}
function nulPaths(args) {
  const value = childProcess.execFileSync("git", ["-C", root, "ls-files", ...args, "-z"], {
    encoding: "buffer",
    maxBuffer: 64 * 1024 * 1024,
  });
  return value.toString("utf8").split("\0").filter(Boolean);
}
function eligiblePaths() {
  const selected = new Set(nulPaths(["--full-name", "--cached", "--others", "--exclude-standard"]));
  selected.delete(".operator-base.pack");
  const includePath = path.join(root, ".worktreeinclude");
  if (fs.existsSync(includePath) && fs.lstatSync(includePath).isFile()) {
    const ignored = new Set(nulPaths(["--full-name", "--others", "--ignored", "--exclude-standard"]));
    // Keep standard excludes out of this query. Their union would select every
    // ignored path instead of only explicit .worktreeinclude matches.
    for (const candidate of nulPaths([
      "--full-name",
      "--others",
      "--ignored",
      "--exclude-from=" + includePath,
    ])) {
      if (ignored.has(candidate)) selected.add(candidate);
    }
  }
  for (const priorManifestDigest of priorManifestDigests) {
    if (!/^[a-f0-9]{64}$/.test(priorManifestDigest)) fail("invalid prior workspace manifest digest");
    const priorPath = path.join(process.env.HOME, ".operator-worker", "manifests", priorManifestDigest + ".json");
    const priorRaw = fs.readFileSync(priorPath, "utf8");
    if (crypto.createHash("sha256").update(priorRaw).digest("hex") !== priorManifestDigest) {
      fail("prior workspace manifest digest mismatch");
    }
    const prior = JSON.parse(priorRaw);
    if (!prior || prior.version !== 1 || !Array.isArray(prior.entries)) {
      fail("invalid prior workspace manifest");
    }
    for (const entry of prior.entries) {
      if (!entry || typeof entry.path !== "string") fail("invalid prior workspace manifest entry");
      if (entry.path !== ".operator-base.pack") selected.add(entry.path);
    }
  }
  return [...selected].sort();
}
async function hashFiles() {
  const entries = [...entriesByPath.values()].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
  for (const entry of entries) {
    if (entry.type !== "file") {
      continue;
    }
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(path.join(root, entry.path));
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    entry.sha256 = hash.digest("hex");
  }
  return entries;
}
function ensurePrivateDirectory(directory) {
  try {
    const stats = fs.lstatSync(directory);
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      fail("unsafe worker manifest directory");
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      fs.mkdirSync(directory, { mode: 0o700 });
    } else {
      throw error;
    }
  }
  fs.chmodSync(directory, 0o700);
}
async function main() {
  if (eligibleOnly) {
    for (const relative of eligiblePaths()) addWithParents(relative);
  } else {
    walk("");
  }
  const entries = await hashFiles();
  const baseCommit = requestedBaseCommit;
  const manifest = JSON.stringify({ version: 1, baseCommit, entries });
  const digest = crypto.createHash("sha256").update(manifest).digest("hex");
  const workerRoot = path.join(process.env.HOME, ".operator-worker");
  const manifestRoot = path.join(workerRoot, "manifests");
  ensurePrivateDirectory(workerRoot);
  ensurePrivateDirectory(manifestRoot);
  const manifestPath = path.join(manifestRoot, digest + ".json");
  const temporaryPath = manifestPath + "." + process.pid + "." + crypto.randomBytes(4).toString("hex");
  fs.writeFileSync(temporaryPath, manifest, { encoding: "utf8", flag: "wx", mode: 0o600 });
  try {
    try {
      fs.linkSync(temporaryPath, manifestPath);
    } catch (error) {
      const existing = error && error.code === "EEXIST" ? fs.lstatSync(manifestPath) : null;
      if (
        !existing ||
        existing.isSymbolicLink() ||
        !existing.isFile() ||
        fs.readFileSync(manifestPath, "utf8") !== manifest
      ) {
        throw error;
      }
    }
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
  process.stdout.write("sha256:" + digest + "\n");
}
main().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error) + "\n");
  process.exitCode = 1;
});`;
//#endregion
//#region src/gateway/worker-environments/workspace-sync.ts
const REMOTE_SETUP_TIMEOUT_MS$1 = 2e4;
const WORKSPACE_TIMEOUT_MS = 10 * 6e4;
const WORKSPACE_QUIESCENCE_TIMEOUT_MS = 12 * 6e4;
const WORKSPACE_QUIESCENCE_RENEW_INTERVAL_MS = 4 * 6e4;
const REMOTE_WORKSPACE_ROOT = "workspaces";
const REMOTE_GIT_PACK_NAME = ".operator-base.pack";
const GIT_COMMIT_PATTERN = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u;
const INBOUND_RSYNC_BW_LIMIT_KIB = 65536;
/** Binds workspace commands and synchronization to one connected tunnel owner. */
function createWorkerWorkspaceActions(options) {
	const track = (task) => {
		options.tasks.add(task);
		task.then(() => options.tasks.delete(task), () => options.tasks.delete(task));
		return task;
	};
	const requirePrepared = () => {
		const prepared = options.getPrepared();
		if (!options.isConnected() || !prepared) throw new Error("Worker tunnel owner is no longer connected");
		return prepared;
	};
	const runTask = (argv, commandOptions) => track(options.runner.run(argv, commandOptions));
	const runBoundedInboundRsync$1 = async (params) => {
		return await runBoundedInboundRsync({
			...params,
			ownerSignal: options.ownerSignal,
			runTask,
			timeoutMs: WORKSPACE_TIMEOUT_MS
		});
	};
	const runWorkspaceCommand = async (command) => {
		const prepared = requirePrepared();
		return await runTask([
			"ssh",
			...require_ssh.workerSshOptions(prepared, { forwarding: "disabled" }),
			"-a",
			"-x",
			"-T",
			"-p",
			String(prepared.port),
			"--",
			prepared.sshTarget,
			require_ssh.workerSshRemoteCommand(command.argv)
		], require_ssh.workerSshCommandOptions({
			input: command.input,
			timeoutMs: command.timeoutMs ?? WORKSPACE_TIMEOUT_MS,
			signal: command.signal ? AbortSignal.any([options.ownerSignal, command.signal]) : options.ownerSignal
		}));
	};
	const quiesceWorkspace = async (remoteWorkspaceDir) => {
		if (!node_path.default.posix.isAbsolute(remoteWorkspaceDir)) throw new Error("Worker workspace quiescence path must be absolute");
		const result = await runWorkspaceCommand({ argv: [
			"node",
			"-e",
			REMOTE_WORKSPACE_QUIESCE_JS,
			remoteWorkspaceDir,
			String(WORKSPACE_QUIESCENCE_TIMEOUT_MS)
		] });
		if (!workerWorkspaceCommandSucceeded(result)) throw workspaceSyncError(result);
		const acknowledgement = /^quiesced ([a-f0-9]{32})$/u.exec(result.stdout.trim());
		if (!acknowledgement) throw new Error("Worker workspace quiescence returned an invalid acknowledgement");
		const nonce = acknowledgement[1];
		let resumed = false;
		let renewalFailure;
		const renewalAbort = new AbortController();
		const abortRenewal = () => renewalAbort.abort(options.ownerSignal.reason);
		options.ownerSignal.addEventListener("abort", abortRenewal, { once: true });
		let renewalQueue = Promise.resolve();
		const renew = (validationMode) => {
			const operation = renewalQueue.then(async () => {
				const renewedResult = await runWorkspaceCommand({ argv: [
					"node",
					"-e",
					REMOTE_WORKSPACE_RENEW_QUIESCENCE_JS,
					remoteWorkspaceDir,
					nonce,
					String(WORKSPACE_QUIESCENCE_TIMEOUT_MS),
					validationMode
				] });
				if (!workerWorkspaceCommandSucceeded(renewedResult)) throw workspaceSyncError(renewedResult);
				if (renewedResult.stdout.trim() !== `renewed ${nonce}`) throw new Error("Worker workspace quiescence renewal returned an invalid acknowledgement");
			});
			renewalQueue = operation.catch(() => void 0);
			return operation;
		};
		const renewalLoop = (async () => {
			while (!renewalAbort.signal.aborted) {
				if (!await waitForQuiescenceRenewal(renewalAbort.signal, WORKSPACE_QUIESCENCE_RENEW_INTERVAL_MS)) return;
				try {
					await renew("heartbeat");
				} catch (error) {
					renewalFailure = error;
					return;
				}
			}
		})();
		return {
			assertActive: async () => {
				if (resumed) throw new Error("Worker workspace quiescence was already released");
				if (renewalFailure) throw new Error("Worker workspace quiescence renewal failed", { cause: renewalFailure });
				await renew("final");
			},
			resume: async () => {
				if (resumed) return;
				options.ownerSignal.removeEventListener("abort", abortRenewal);
				renewalAbort.abort();
				await renewalLoop;
				const resumedResult = await runWorkspaceCommand({ argv: [
					"node",
					"-e",
					REMOTE_WORKSPACE_RESUME_JS,
					remoteWorkspaceDir,
					nonce
				] });
				if (!workerWorkspaceCommandSucceeded(resumedResult)) throw workspaceSyncError(resumedResult);
				resumed = true;
			}
		};
	};
	const syncWorkspaceImpl = async (request) => {
		validateWorkspaceSyncRequest(request);
		const prepared = requirePrepared();
		const environmentKey = stableWorkerPathComponent(options.environmentId, 16);
		const sessionKey = stableWorkerPathComponent(request.sessionId, 32);
		const remoteRelative = [
			REMOTE_WORKSPACE_ROOT,
			environmentKey,
			sessionKey,
			String(request.generation)
		].join("/");
		const setup = await runWorkspaceCommand({
			argv: [
				"sh",
				"-s",
				"--",
				remoteRelative
			],
			input: REMOTE_WORKSPACE_SETUP_SCRIPT
		});
		if (!workerWorkspaceCommandSucceeded(setup)) throw workspaceSyncError(setup);
		const remoteWorkspaceDir = parseRemoteWorkspaceDirectory(setup.stdout.trim());
		const gitRootResult = await runTask([
			"git",
			"-C",
			request.localPath,
			"rev-parse",
			"--show-toplevel"
		], require_ssh.workerSshCommandOptions({
			timeoutMs: REMOTE_SETUP_TIMEOUT_MS$1,
			signal: options.ownerSignal
		}));
		const mode = workerWorkspaceCommandSucceeded(gitRootResult) ? "git" : "plain";
		let baseCommit = "";
		let gitRoot = request.localPath;
		const temporaryDirectory = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-worker-workspace-sync-"));
		const rsyncSsh = require_ssh.workerSshRemoteCommand([
			"ssh",
			...require_ssh.workerSshOptions(prepared, { forwarding: "disabled" }),
			"-a",
			"-x",
			"-T",
			"-p",
			String(prepared.port)
		]);
		try {
			let fileListPath;
			if (mode === "git") {
				gitRoot = gitRootResult.stdout.trim();
				const [canonicalRequestPath, canonicalGitRoot] = await Promise.all([node_fs_promises.default.realpath(request.localPath), node_fs_promises.default.realpath(gitRoot)]);
				if (canonicalRequestPath !== canonicalGitRoot) throw new Error("Worker git workspace sync requires the managed worktree root");
				const gitBase = await runTask([
					"git",
					"-C",
					gitRoot,
					"rev-parse",
					"--verify",
					"HEAD"
				], require_ssh.workerSshCommandOptions({
					timeoutMs: REMOTE_SETUP_TIMEOUT_MS$1,
					signal: options.ownerSignal
				}));
				if (!workerWorkspaceCommandSucceeded(gitBase)) throw new Error("Worker git workspace has no base commit");
				baseCommit = gitBase.stdout.trim();
				if (!GIT_COMMIT_PATTERN.test(baseCommit)) throw new Error("Worker workspace git base is not a commit id");
				const eligiblePath = node_path.default.join(temporaryDirectory, "eligible");
				const ignoredPath = node_path.default.join(temporaryDirectory, "ignored");
				const selectedPath = node_path.default.join(temporaryDirectory, "selected");
				fileListPath = node_path.default.join(temporaryDirectory, "transfer-list");
				await runLocalCommandToFile({
					argv: [
						"git",
						"-C",
						gitRoot,
						"ls-files",
						"--full-name",
						"--cached",
						"--others",
						"--exclude-standard",
						"-z"
					],
					outputPath: eligiblePath,
					signal: options.ownerSignal,
					timeoutMs: WORKSPACE_TIMEOUT_MS
				});
				const worktreeIncludePath = node_path.default.join(gitRoot, ".worktreeinclude");
				if ((await node_fs_promises.default.lstat(worktreeIncludePath).catch(() => void 0))?.isFile()) {
					await runLocalCommandToFile({
						argv: [
							"git",
							"-C",
							gitRoot,
							"ls-files",
							"--full-name",
							"--others",
							"--ignored",
							"--exclude-standard",
							"-z"
						],
						outputPath: ignoredPath,
						signal: options.ownerSignal,
						timeoutMs: WORKSPACE_TIMEOUT_MS
					});
					await runLocalCommandToFile({
						argv: [
							"git",
							"-C",
							gitRoot,
							"ls-files",
							"--full-name",
							"--others",
							"--ignored",
							`--exclude-from=${worktreeIncludePath}`,
							"-z"
						],
						outputPath: selectedPath,
						signal: options.ownerSignal,
						timeoutMs: WORKSPACE_TIMEOUT_MS
					});
				} else await Promise.all([node_fs_promises.default.writeFile(ignoredPath, "", { mode: 384 }), node_fs_promises.default.writeFile(selectedPath, "", { mode: 384 })]);
				await writeEligibleGitFiles({
					gitRoot,
					eligiblePath,
					ignoredPath,
					selectedPath,
					outputPath: fileListPath
				});
				const objectListPath = node_path.default.join(temporaryDirectory, "base-objects");
				const packPath = node_path.default.join(temporaryDirectory, "base.pack");
				await runLocalCommandToFile({
					argv: [
						"git",
						"-C",
						gitRoot,
						"rev-list",
						"--objects",
						"--no-object-names",
						`${baseCommit}^{tree}`
					],
					outputPath: objectListPath,
					signal: options.ownerSignal,
					timeoutMs: WORKSPACE_TIMEOUT_MS
				});
				await node_fs_promises.default.appendFile(objectListPath, `${baseCommit}\n`);
				await runLocalCommandToFile({
					argv: [
						"git",
						"-C",
						gitRoot,
						"pack-objects",
						"--stdout"
					],
					inputPath: objectListPath,
					outputPath: packPath,
					signal: options.ownerSignal,
					timeoutMs: WORKSPACE_TIMEOUT_MS
				});
				const packTransfer = await runTask([
					"rsync",
					"--archive",
					"--checksum",
					"-e",
					rsyncSsh,
					"--",
					packPath,
					`${prepared.scpTarget}:${remoteWorkspaceDir}/${REMOTE_GIT_PACK_NAME}`
				], require_ssh.workerSshCommandOptions({
					timeoutMs: WORKSPACE_TIMEOUT_MS,
					signal: options.ownerSignal
				}));
				if (!workerWorkspaceCommandSucceeded(packTransfer)) throw workspaceSyncError(packTransfer);
				const [authorName, authorEmail] = await Promise.all(["user.name", "user.email"].map(async (key) => {
					const result = await runTask([
						"git",
						"-C",
						gitRoot,
						"config",
						"--get",
						key
					], require_ssh.workerSshCommandOptions({
						timeoutMs: REMOTE_SETUP_TIMEOUT_MS$1,
						signal: options.ownerSignal
					}));
					return workerWorkspaceCommandSucceeded(result) ? result.stdout.trim() : "";
				}));
				const seeded = await runWorkspaceCommand({
					argv: [
						"sh",
						"-s",
						"--",
						remoteWorkspaceDir,
						node_path.default.posix.join(remoteWorkspaceDir, REMOTE_GIT_PACK_NAME),
						baseCommit,
						authorName ?? "",
						authorEmail ?? ""
					],
					input: REMOTE_GIT_WORKSPACE_SETUP_SCRIPT
				});
				if (!workerWorkspaceCommandSucceeded(seeded)) throw workspaceSyncError(seeded);
			}
			const localSource = gitRoot.endsWith(node_path.default.sep) ? gitRoot : `${gitRoot}${node_path.default.sep}`;
			const transfer = await runTask([
				"rsync",
				"--archive",
				"--checksum",
				"--exclude=.git",
				...fileListPath ? [
					"--recursive",
					"--from0",
					`--files-from=${fileListPath}`
				] : [],
				"-e",
				rsyncSsh,
				"--",
				localSource,
				`${prepared.scpTarget}:${remoteWorkspaceDir}/`
			], require_ssh.workerSshCommandOptions({
				timeoutMs: WORKSPACE_TIMEOUT_MS,
				signal: options.ownerSignal
			}));
			if (!workerWorkspaceCommandSucceeded(transfer)) throw workspaceSyncError(transfer);
			const manifest = await runWorkspaceCommand({ argv: [
				"node",
				"-e",
				REMOTE_WORKSPACE_MANIFEST_JS,
				remoteWorkspaceDir,
				baseCommit,
				...mode === "git" ? ["eligible"] : []
			] });
			if (!workerWorkspaceCommandSucceeded(manifest)) throw workspaceSyncError(manifest);
			return {
				mode,
				remoteWorkspaceDir,
				manifestRef: parseManifestRef(manifest.stdout.trim())
			};
		} finally {
			await node_fs_promises.default.rm(temporaryDirectory, {
				recursive: true,
				force: true
			});
		}
	};
	const reconcileWorkspaceImpl = async (request) => {
		if (!node_path.default.isAbsolute(request.localPath) || !node_path.default.posix.isAbsolute(request.remoteWorkspaceDir)) throw new Error("Worker workspace reconcile paths must be absolute");
		const pending = request.journal.load();
		if (pending) {
			await require_workspace_reconcile.recoverWorkerWorkspaceReconciliation({
				root: request.localPath,
				journal: pending
			});
			request.journal.abort();
		}
		const baseDigest = MANIFEST_REF_PATTERN.exec(request.baseManifestRef)?.[0]?.slice(7);
		if (!baseDigest) throw new Error("Worker workspace base manifest reference is invalid");
		const prepared = requirePrepared();
		const temporaryDirectory = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-worker-workspace-reconcile-"));
		const stagingRoot = node_path.default.join(temporaryDirectory, "staging");
		const manifestRoot = node_path.default.join(temporaryDirectory, "manifests");
		const baseManifestPath = node_path.default.join(manifestRoot, `${baseDigest}.json`);
		const transferListPath = node_path.default.join(temporaryDirectory, "transfer-list");
		const rsyncSsh = require_ssh.workerSshRemoteCommand([
			"ssh",
			...require_ssh.workerSshOptions(prepared, { forwarding: "disabled" }),
			"-a",
			"-x",
			"-T",
			"-p",
			String(prepared.port)
		]);
		try {
			await node_fs_promises.default.mkdir(stagingRoot, { mode: 448 });
			await node_fs_promises.default.mkdir(manifestRoot, { mode: 448 });
			const baseManifestTransfer = await runBoundedInboundRsync$1({
				argv: [
					"rsync",
					"--archive",
					"--no-recursive",
					"--checksum",
					`--max-size=${require_workspace_reconcile.MAX_RECONCILIATION_FILE_BYTES}`,
					`--bwlimit=${INBOUND_RSYNC_BW_LIMIT_KIB}`,
					"-e",
					rsyncSsh,
					"--",
					`${prepared.scpTarget}:.operator-worker/manifests/${baseDigest}.json`,
					baseManifestPath
				],
				destinationRoot: manifestRoot,
				entryLimit: 1,
				totalByteLimit: require_workspace_reconcile.MAX_RECONCILIATION_FILE_BYTES
			});
			if (!workerWorkspaceCommandSucceeded(baseManifestTransfer)) throw workspaceSyncError(baseManifestTransfer);
			const base = require_workspace_reconcile.parseWorkerWorkspaceManifest(await readTransferredManifest(baseManifestPath), request.baseManifestRef);
			await node_fs_promises.default.rm(baseManifestPath);
			await require_workspace_reconcile.assertWorkspaceMatchesManifest({
				root: request.localPath,
				manifest: base
			});
			const verifyStable = async (expectedRef) => {
				const expectedDigest = expectedRef.slice(7);
				const verified = await runWorkspaceCommand({ argv: [
					"node",
					"-e",
					REMOTE_WORKSPACE_MANIFEST_JS,
					request.remoteWorkspaceDir,
					base.baseCommit ?? "",
					...base.baseCommit ? [
						"eligible",
						expectedDigest,
						baseDigest
					] : []
				] });
				if (!workerWorkspaceCommandSucceeded(verified)) throw workspaceSyncError(verified);
				if (parseManifestRef(verified.stdout.trim()) !== expectedRef) throw new Error("Cloud workspace changed during final reconciliation");
			};
			const currentResult = await runWorkspaceCommand({ argv: [
				"node",
				"-e",
				REMOTE_WORKSPACE_MANIFEST_JS,
				request.remoteWorkspaceDir,
				base.baseCommit ?? "",
				...base.baseCommit ? ["eligible"] : [],
				...base.baseCommit ? [baseDigest] : []
			] });
			if (!workerWorkspaceCommandSucceeded(currentResult)) throw workspaceSyncError(currentResult);
			const currentRef = parseManifestRef(currentResult.stdout.trim());
			if (currentRef === request.baseManifestRef) {
				await verifyStable(currentRef);
				request.journal.commit(currentRef);
				return {
					manifestRef: currentRef,
					changed: false,
					verifyStable: async () => await verifyStable(currentRef),
					verifyLocalStable: async () => await require_workspace_reconcile.assertWorkspaceResultStable({
						root: request.localPath,
						base,
						current: base
					})
				};
			}
			const currentDigest = currentRef.slice(7);
			const currentManifestPath = node_path.default.join(manifestRoot, `${currentDigest}.json`);
			const currentManifestTransfer = await runBoundedInboundRsync$1({
				argv: [
					"rsync",
					"--archive",
					"--no-recursive",
					"--checksum",
					`--max-size=${require_workspace_reconcile.MAX_RECONCILIATION_FILE_BYTES}`,
					`--bwlimit=${INBOUND_RSYNC_BW_LIMIT_KIB}`,
					"-e",
					rsyncSsh,
					"--",
					`${prepared.scpTarget}:.operator-worker/manifests/${currentDigest}.json`,
					currentManifestPath
				],
				destinationRoot: manifestRoot,
				entryLimit: 1,
				totalByteLimit: require_workspace_reconcile.MAX_RECONCILIATION_FILE_BYTES
			});
			if (!workerWorkspaceCommandSucceeded(currentManifestTransfer)) throw workspaceSyncError(currentManifestTransfer);
			const current = require_workspace_reconcile.parseWorkerWorkspaceManifest(await readTransferredManifest(currentManifestPath), currentRef);
			const transferPaths = require_workspace_reconcile.workerWorkspaceTransferPaths(current, base);
			const transferPathSet = new Set(transferPaths);
			if (transferPaths.length > 0) {
				await node_fs_promises.default.writeFile(transferListPath, Buffer.from(`${transferPaths.join("\0")}\0`), { mode: 384 });
				const resultTransfer = await runBoundedInboundRsync$1({
					argv: [
						"rsync",
						"--archive",
						"--checksum",
						`--max-size=${require_workspace_reconcile.MAX_RECONCILIATION_FILE_BYTES}`,
						`--bwlimit=${INBOUND_RSYNC_BW_LIMIT_KIB}`,
						"--from0",
						`--files-from=${transferListPath}`,
						"-e",
						rsyncSsh,
						"--",
						`${prepared.scpTarget}:${request.remoteWorkspaceDir}/`,
						`${stagingRoot}/`
					],
					destinationRoot: stagingRoot,
					entryLimit: require_workspace_reconcile.MAX_RECONCILIATION_ENTRIES * 2,
					totalByteLimit: require_workspace_reconcile.MAX_RECONCILIATION_TOTAL_BYTES
				});
				if (!workerWorkspaceCommandSucceeded(resultTransfer)) throw workspaceSyncError(resultTransfer);
			}
			await require_workspace_reconcile.assertWorkspaceMatchesManifest({
				root: stagingRoot,
				manifest: current,
				entries: current.entries.filter((entry) => transferPathSet.has(entry.path))
			});
			await verifyStable(currentRef);
			await require_workspace_reconcile.applyStagedWorkerWorkspace({
				root: request.localPath,
				stagingRoot,
				baseManifestRef: request.baseManifestRef,
				currentManifestRef: currentRef,
				base,
				current,
				journal: request.journal
			});
			return {
				manifestRef: currentRef,
				changed: true,
				verifyStable: async () => await verifyStable(currentRef),
				verifyLocalStable: async () => await require_workspace_reconcile.assertWorkspaceResultStable({
					root: request.localPath,
					base,
					current
				})
			};
		} finally {
			await node_fs_promises.default.rm(temporaryDirectory, {
				recursive: true,
				force: true
			}).catch(() => void 0);
		}
	};
	return {
		quiesceWorkspace,
		reconcileWorkspace(request) {
			return track(reconcileWorkspaceImpl(request));
		},
		runWorkspaceCommand,
		syncWorkspace(request) {
			return track(syncWorkspaceImpl(request));
		}
	};
}
//#endregion
//#region src/gateway/worker-environments/tunnel.ts
const REMOTE_SOCKET_NAME = "gateway.sock";
const REMOTE_SETUP_TIMEOUT_MS = 2e4;
const DEFAULT_STABLE_CONNECTION_MS = 3e4;
const DEFAULT_BACKOFF = {
	initialMs: 250,
	maxMs: 3e4,
	factor: 2,
	jitter: 0
};
const REMOTE_SOCKET_SETUP_SCRIPT = String.raw`set -eu
directory=$1
socket=$2
umask 077
if [ -e "$directory" ] || [ -L "$directory" ]; then
  if [ ! -d "$directory" ] || [ -L "$directory" ]; then
    printf '%s\n' 'unsafe worker tunnel directory' >&2
    exit 2
  fi
else
  mkdir -- "$directory"
fi
chmod 700 -- "$directory"
rm -f -- "$socket"
`;
const REMOTE_TUNNEL_READY_SCRIPT = String.raw`set -eu
socket=$1
test -S "$socket"
printf '%s\n' '${WORKER_TUNNEL_READY_MARKER}'
trap 'exit 0' HUP INT TERM
while :; do sleep 3600; done
`;
const REMOTE_SOCKET_CLEANUP_SCRIPT = String.raw`set -eu
socket=$1
directory=$2
rm -f -- "$socket"
rmdir -- "$directory" 2>/dev/null || true
`;
function success(result) {
	return result.termination === "exit" && result.code === 0;
}
function validateStartRequest(request) {
	if (!request.environmentId.trim()) throw new Error("Worker tunnel environment id must be non-empty");
	if (!Number.isSafeInteger(request.ownerEpoch) || request.ownerEpoch < 0) throw new Error("Worker tunnel owner epoch must be a non-negative safe integer");
	if (!Number.isInteger(request.gateway.port) || request.gateway.port < 1 || request.gateway.port > 65535) throw new Error("Worker tunnel gateway port must be an integer between 1 and 65535");
}
function remoteTargetHost(host) {
	return host === "::1" ? `[${host}]` : host;
}
/** Owns process-local reverse tunnels and fences all delayed work on stop or owner replacement. */
function createWorkerTunnelManager(options = {}) {
	const runner = options.runner ?? createWorkerSshRunner();
	const sleep = options.sleep ?? require_src.sleepWithAbort;
	const backoff = options.backoff ?? DEFAULT_BACKOFF;
	const now = options.now ?? Date.now;
	const stableConnectionMs = options.stableConnectionMs ?? DEFAULT_STABLE_CONNECTION_MS;
	const entries = /* @__PURE__ */ new Map();
	const claimedOwnerEpochs = /* @__PURE__ */ new Map();
	const isCurrent = (entry) => entries.get(entry.environmentId) === entry && !entry.abortController.signal.aborted;
	const sshCommand = (prepared, params) => ({
		argv: [
			"ssh",
			...require_ssh.workerSshOptions(prepared, { forwarding: "disabled" }),
			"-a",
			"-x",
			"-T",
			"-p",
			String(prepared.port),
			"--",
			prepared.sshTarget,
			require_ssh.workerSshRemoteCommand([
				"sh",
				"-s",
				"--",
				...params.remoteArgs
			])
		],
		options: require_ssh.workerSshCommandOptions({
			input: params.input,
			timeoutMs: REMOTE_SETUP_TIMEOUT_MS,
			signal: params.signal
		})
	});
	const prepareRemoteSocket = async (entry) => {
		const prepared = entry.prepared;
		if (!prepared) throw new Error("Worker tunnel SSH context is unavailable");
		const command = sshCommand(prepared, {
			input: REMOTE_SOCKET_SETUP_SCRIPT,
			remoteArgs: [entry.remoteDirectory, entry.remoteSocketPath],
			signal: entry.abortController.signal
		});
		const result = await runner.run(command.argv, command.options);
		if (!success(result)) throw workerSshProcessError(result.stderr || result.stdout);
	};
	const cleanupRemoteSocket = async (entry) => {
		if (!entry.prepared) return;
		const command = sshCommand(entry.prepared, {
			input: REMOTE_SOCKET_CLEANUP_SCRIPT,
			remoteArgs: [entry.remoteSocketPath, entry.remoteDirectory]
		});
		await runner.run(command.argv, command.options).catch(() => void 0);
	};
	const createHandle = (entry) => ({
		environmentId: entry.environmentId,
		ownerEpoch: entry.ownerEpoch,
		remoteSocketPath: entry.remoteSocketPath,
		...createWorkerWorkspaceActions({
			environmentId: entry.environmentId,
			ownerSignal: entry.abortController.signal,
			isConnected: () => isCurrent(entry) && entry.status === "connected",
			getPrepared: () => entry.prepared,
			runner,
			tasks: entry.workspaceTasks
		}),
		stop: () => stop(entry.environmentId, entry.ownerEpoch)
	});
	const connect = async (entry) => {
		const prepared = entry.prepared;
		if (!prepared) throw new Error("Worker tunnel SSH context is unavailable");
		await prepareRemoteSocket(entry);
		if (!isCurrent(entry)) throw new Error("Worker tunnel owner changed during connection");
		const target = `${remoteTargetHost(entry.gateway.host)}:${entry.gateway.port}`;
		return runner.start([
			"ssh",
			...require_ssh.workerSshOptions(prepared, { forwarding: "explicit" }),
			"-a",
			"-x",
			"-T",
			"-o",
			"ServerAliveInterval=15",
			"-o",
			"ServerAliveCountMax=3",
			"-o",
			"StreamLocalBindMask=0177",
			"-o",
			"StreamLocalBindUnlink=yes",
			"-R",
			`${entry.remoteSocketPath}:${target}`,
			"-p",
			String(prepared.port),
			"--",
			prepared.sshTarget,
			require_ssh.workerSshRemoteCommand([
				"sh",
				"-s",
				"--",
				entry.remoteSocketPath
			])
		], require_ssh.workerSshCommandOptions({
			input: REMOTE_TUNNEL_READY_SCRIPT,
			timeoutMs: Number.MAX_SAFE_INTEGER,
			signal: entry.abortController.signal
		}));
	};
	const reconnectLoop = async (entry) => {
		const reconnectSupervisor = new require_src.RetrySupervisor(backoff);
		while (isCurrent(entry)) {
			entry.status = reconnectSupervisor.attempts === 0 ? "connecting" : "reconnecting";
			let child;
			try {
				child = await connect(entry);
				entry.process = child;
				await child.ready;
				if (!isCurrent(entry)) {
					await child.stop();
					return;
				}
				entry.status = "connected";
				if (!entry.readySettled) {
					entry.readySettled = true;
					entry.resolveReady(createHandle(entry));
				}
				const connectedAtMs = now();
				await child.exited;
				if (now() - connectedAtMs >= stableConnectionMs) reconnectSupervisor.reset();
			} catch {
				await child?.stop().catch(() => void 0);
			} finally {
				if (entry.process === child) entry.process = void 0;
			}
			if (!isCurrent(entry)) return;
			entry.status = "reconnecting";
			try {
				const retry = reconnectSupervisor.next(entry.abortController.signal);
				await sleep(retry.delayMs, retry.signal);
			} catch {
				return;
			}
		}
	};
	const stopEntry = (entry) => {
		if (entry.stopPromise) return entry.stopPromise;
		entry.stopPromise = (async () => {
			if (entries.get(entry.environmentId) === entry) entries.delete(entry.environmentId);
			entry.abortController.abort(/* @__PURE__ */ new Error("Worker tunnel owner stopped"));
			if (!entry.readySettled) {
				entry.readySettled = true;
				entry.rejectReady(/* @__PURE__ */ new Error("Worker tunnel stopped before connecting"));
			}
			await entry.process?.stop().catch(() => void 0);
			await entry.initialization?.catch(() => void 0);
			await entry.process?.stop().catch(() => void 0);
			await Promise.allSettled(entry.workspaceTasks);
			await entry.loop?.catch(() => void 0);
			await cleanupRemoteSocket(entry);
			await entry.prepared?.dispose().catch(() => void 0);
		})();
		return entry.stopPromise;
	};
	async function start(request) {
		validateStartRequest(request);
		const claimedEpoch = claimedOwnerEpochs.get(request.environmentId);
		if (claimedEpoch !== void 0 && request.ownerEpoch < claimedEpoch) throw new Error("Worker tunnel owner epoch is stale");
		claimedOwnerEpochs.set(request.environmentId, request.ownerEpoch);
		const current = entries.get(request.environmentId);
		if (current) {
			if (request.ownerEpoch < current.ownerEpoch) throw new Error("Worker tunnel owner epoch is stale");
			if (request.ownerEpoch === current.ownerEpoch) return await current.ready;
		}
		let resolveReady;
		let rejectReady;
		const ready = new Promise((resolve, reject) => {
			resolveReady = resolve;
			rejectReady = reject;
		});
		ready.catch(() => void 0);
		const remoteDirectory = `/tmp/ocw-${stableWorkerPathComponent(request.environmentId, 16)}-${request.ownerEpoch}`;
		const entry = {
			environmentId: request.environmentId,
			ownerEpoch: request.ownerEpoch,
			gateway: request.gateway,
			remoteDirectory,
			remoteSocketPath: `${remoteDirectory}/${REMOTE_SOCKET_NAME}`,
			abortController: new AbortController(),
			status: "connecting",
			ready,
			resolveReady,
			rejectReady,
			readySettled: false,
			workspaceTasks: /* @__PURE__ */ new Set()
		};
		entries.set(request.environmentId, entry);
		entry.initialization = (async () => {
			if (current) await stopEntry(current);
			if (!isCurrent(entry)) return;
			entry.prepared = await require_ssh.prepareWorkerSsh({
				ssh: request.ssh,
				pinnedHostKey: request.ssh.hostKey,
				resolveIdentity: request.resolveIdentity,
				temporaryDirectoryPrefix: "operator-worker-tunnel-"
			});
			if (!isCurrent(entry)) {
				await entry.prepared.dispose();
				entry.prepared = void 0;
				return;
			}
			entry.loop = reconnectLoop(entry);
			entry.loop.catch((error) => {
				if (!entry.readySettled) {
					entry.readySettled = true;
					entry.rejectReady(error instanceof Error ? error : /* @__PURE__ */ new Error("Worker tunnel failed"));
				}
			});
		})();
		entry.initialization.catch((error) => {
			if (!entry.readySettled) {
				entry.readySettled = true;
				entry.rejectReady(error instanceof Error ? error : /* @__PURE__ */ new Error("Worker tunnel failed"));
			}
			stopEntry(entry);
		});
		return await entry.ready;
	}
	async function stop(environmentId, ownerEpoch) {
		const entry = entries.get(environmentId);
		if (!entry || ownerEpoch !== void 0 && ownerEpoch !== entry.ownerEpoch) return;
		await stopEntry(entry);
	}
	async function stopAll() {
		const current = [...entries.values()];
		for (const entry of current) {
			entries.delete(entry.environmentId);
			entry.abortController.abort(/* @__PURE__ */ new Error("Worker tunnel manager stopped"));
		}
		await Promise.all(current.map(stopEntry));
	}
	return {
		start,
		stop,
		stopAll,
		status(environmentId) {
			return entries.get(environmentId)?.status ?? "stopped";
		}
	};
}
//#endregion
exports.createWorkerTunnelManager = createWorkerTunnelManager;
