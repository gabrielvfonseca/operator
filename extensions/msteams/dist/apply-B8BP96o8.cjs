const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_sleep = require("./sleep-BVpvBXin.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_openclaw_state_db = require("./openclaw-state-db-BPmWhmKx.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_resolve_system_bin = require("./resolve-system-bin-B1IIqmHp.cjs");
require("./fs-safe-advanced-r6xSCXfB.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_progress = require("./progress-JkW4pQSo.cjs");
const require_engine_storage = require("./engine-storage-BLMY4Nid.cjs");
const require_backup_shared = require("./backup-shared-T1k5tz3P.cjs");
const require_migration = require("./migration-ty5IFml7.cjs");
const require_migration_provider_runtime = require("./migration-provider-runtime-BfZcEKfA.cjs");
const require_context = require("./context-BZlEBcHB.cjs");
const require_output = require("./output-yAsarn29.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let node_stream_promises = require("node:stream/promises");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/infra/backup-create-stream.ts
async function writeArchiveStreamToFile(params) {
	await (0, node_stream_promises.pipeline)(params.archiveStream, (0, node_fs.createWriteStream)(params.archivePath, {
		flags: "wx",
		mode: 384
	}));
}
//#endregion
//#region src/infra/backup-tar-retry.ts
const BACKUP_TAR_MAX_ATTEMPTS = 3;
const BACKUP_TAR_BACKOFF_MS = [1e4, 2e4];
function isTarEofRaceError(err) {
	if (!err || typeof err !== "object") return false;
	if (err.code === "EOF") return true;
	const message = err.message ?? "";
	return /(did not encounter expected|encountered unexpected) EOF|TAR_BAD_ARCHIVE/i.test(message);
}
function resolveBackupTarAttemptTempPath(tempArchivePath, attempt) {
	return attempt === 1 ? tempArchivePath : `${tempArchivePath}.retry-${attempt}`;
}
function resolveBackupTarAttemptTempPaths(tempArchivePath) {
	return Array.from({ length: BACKUP_TAR_MAX_ATTEMPTS }, (_value, index) => resolveBackupTarAttemptTempPath(tempArchivePath, index + 1));
}
async function removeBackupTempArchiveBestEffort(tempArchivePath) {
	await node_fs_promises.default.rm(tempArchivePath, { force: true }).catch(() => void 0);
}
async function writeTarArchiveWithRetry(params) {
	const sleepFn = params.sleepMs ?? require_sleep.sleep;
	let lastErr;
	const attemptTempArchivePaths = [];
	for (let attempt = 1; attempt <= BACKUP_TAR_MAX_ATTEMPTS; attempt += 1) {
		const attemptTempArchivePath = resolveBackupTarAttemptTempPath(params.tempArchivePath, attempt);
		attemptTempArchivePaths.push(attemptTempArchivePath);
		try {
			await params.runTar(attemptTempArchivePath);
			for (const staleTempArchivePath of attemptTempArchivePaths.slice(0, -1)) await removeBackupTempArchiveBestEffort(staleTempArchivePath);
			return attemptTempArchivePath;
		} catch (err) {
			lastErr = err;
			if (!isTarEofRaceError(err) || attempt === BACKUP_TAR_MAX_ATTEMPTS) {
				for (const staleTempArchivePath of attemptTempArchivePaths) await removeBackupTempArchiveBestEffort(staleTempArchivePath);
				break;
			}
			try {
				await node_fs_promises.default.rm(attemptTempArchivePath, { force: true });
			} catch (cleanupErr) {
				const code = cleanupErr.code;
				if (code && code !== "ENOENT") params.log?.(`Backup archiver could not remove temp archive ${attemptTempArchivePath} between retries: ${code}. Continuing.`);
			}
			const backoff = BACKUP_TAR_BACKOFF_MS[attempt - 1] ?? 0;
			const offendingPath = err.path;
			params.log?.(`Backup archiver hit a live-write race${offendingPath ? ` on ${offendingPath}` : ""} (attempt ${attempt}/${BACKUP_TAR_MAX_ATTEMPTS}); retrying in ${Math.round(backoff / 1e3)}s.`);
			await sleepFn(backoff);
		}
	}
	const final = lastErr instanceof Error ? lastErr : new Error(String(lastErr));
	const offendingPath = lastErr?.path;
	const suffix = offendingPath ? ` (last offending path: ${offendingPath}, after ${BACKUP_TAR_MAX_ATTEMPTS} attempts)` : ` (after ${BACKUP_TAR_MAX_ATTEMPTS} attempts)`;
	throw new Error(`Backup archive write failed: ${final.message}${suffix}`, { cause: final });
}
//#endregion
//#region src/infra/backup-volatile-filter.ts
/**
* Paths that are known to change during a live backup and commonly trigger
* tar EOF errors. These files are actively appended to (logs, sockets, pid
* markers) while `tar.c()` is reading them, which races with the size recorded
* at `lstat()` time.
*
* Skipping them is safe: they are either recreated on startup, are transient
* by nature, or have durable equivalents elsewhere in state. Snapshotting a
* partial tail of a live log has no restoration value.
*/
const STATE_TRANSIENT_EXTENSIONS = /* @__PURE__ */ new Set([
	".sock",
	".pid",
	".tmp"
]);
function normalizePosix(input) {
	if (!input) return input;
	return node_path.default.posix.normalize(input.replaceAll("\\", "/"));
}
function isUnder(childPosix, parentPosix) {
	if (!parentPosix) return false;
	const p = parentPosix.endsWith("/") ? parentPosix : `${parentPosix}/`;
	return childPosix === parentPosix || childPosix.startsWith(p);
}
function hasExtension(filePosix, extensions) {
	const ext = node_path.default.posix.extname(filePosix).toLowerCase();
	return extensions.includes(ext);
}
function hasExtensionInSet(filePosix, extensions) {
	return extensions.has(node_path.default.posix.extname(filePosix).toLowerCase());
}
function isAgentSessionTranscriptPath(filePosix, stateDirPosix) {
	const agentsRoot = node_path.default.posix.join(stateDirPosix, "agents");
	if (!isUnder(filePosix, agentsRoot)) return false;
	const parts = node_path.default.posix.relative(agentsRoot, filePosix).split("/").filter(Boolean);
	return parts.length >= 3 && parts[1] === "sessions";
}
function filePathCandidates(input) {
	const normalized = normalizePosix(input);
	if (normalized.startsWith("/") || /^[A-Za-z]:\//u.test(normalized)) return [normalized];
	return [normalized, normalizePosix(`/${normalized}`)];
}
/**
* Returns true if the given absolute path should be skipped during backup
* because it is a live-mutation target.
*
* Rules:
*   - `{stateDir}/sessions/**`/`*.{jsonl,log}` (legacy)
*   - `{stateDir}/agents/<agentId>/sessions/**`/`*.{jsonl,log}`
*   - `{stateDir}/cron/runs/**`/`*.{jsonl,log}`
*   - `{stateDir}/logs/**`/`*.{jsonl,log}`
*   - `{stateDir}/{delivery-queue,session-delivery-queue}/**`/`*.{json,delivered,tmp}`
*   - `{stateDir}/**`/`*.{sock,pid,tmp}`
*/
function isVolatileBackupPath(absolutePath, plan) {
	if (!absolutePath) return false;
	const candidates = filePathCandidates(absolutePath);
	for (const stateDir of plan.stateDirs) {
		if (!stateDir) continue;
		const stateDirPosix = normalizePosix(stateDir);
		for (const filePosix of candidates) {
			if (isUnder(filePosix, node_path.default.posix.join(stateDirPosix, "sessions")) && hasExtension(filePosix, [".jsonl", ".log"])) return true;
			if (isAgentSessionTranscriptPath(filePosix, stateDirPosix) && hasExtension(filePosix, [".jsonl", ".log"])) return true;
			if (isUnder(filePosix, node_path.default.posix.join(stateDirPosix, "cron", "runs")) && hasExtension(filePosix, [".jsonl", ".log"])) return true;
			if (isUnder(filePosix, node_path.default.posix.join(stateDirPosix, "logs")) && hasExtension(filePosix, [".jsonl", ".log"])) return true;
			for (const queueDir of ["delivery-queue", "session-delivery-queue"]) if (isUnder(filePosix, node_path.default.posix.join(stateDirPosix, queueDir)) && hasExtension(filePosix, [
				".json",
				".delivered",
				".tmp"
			])) return true;
			if (isUnder(filePosix, stateDirPosix) && hasExtensionInSet(filePosix, STATE_TRANSIENT_EXTENSIONS)) return true;
		}
	}
	return false;
}
//#endregion
//#region src/infra/backup-volatile-stat-cache.ts
const VOLATILE_BACKUP_SYNTHETIC_STAT = {
	isBlockDevice: () => false,
	isCharacterDevice: () => false,
	isDirectory: () => false,
	isFIFO: () => false,
	isFile: () => false,
	isSocket: () => false,
	isSymbolicLink: () => false
};
var BackupVolatileStatCache = class extends Map {
	constructor(volatilePlan) {
		super();
		this.volatilePlan = volatilePlan;
	}
	get(key) {
		const cached = super.get(key);
		if (cached) return cached;
		return isVolatileBackupPath(key, this.volatilePlan) ? VOLATILE_BACKUP_SYNTHETIC_STAT : void 0;
	}
};
function createBackupVolatileStatCache(volatilePlan) {
	return new BackupVolatileStatCache(volatilePlan);
}
//#endregion
//#region src/infra/sqlite-snapshot.ts
const SQLITE_DIRECTORY_MODE = 448;
const WINDOWS_DIRECTORY_EXISTS_MARKER = "OPERATOR_SQLITE_DIRECTORY_EXISTS";
const WINDOWS_PRIVATE_DIRECTORY_NATIVE_SOURCE = `
using System;
using System.Runtime.InteropServices;

public static class OperatorPrivateDirectory
{
    [StructLayout(LayoutKind.Sequential)]
    private struct SecurityAttributes
    {
        public int Length;
        public IntPtr SecurityDescriptor;
        public int InheritHandle;
    }

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool ConvertStringSecurityDescriptorToSecurityDescriptorW(
        string securityDescriptor,
        uint revision,
        out IntPtr convertedSecurityDescriptor,
        out uint convertedSecurityDescriptorSize);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CreateDirectoryW(
        string path,
        ref SecurityAttributes securityAttributes);

    [DllImport("kernel32.dll")]
    private static extern IntPtr LocalFree(IntPtr memory);

    public static int Create(string path, string securityDescriptor)
    {
        IntPtr descriptor;
        uint descriptorSize;
        if (!ConvertStringSecurityDescriptorToSecurityDescriptorW(
                securityDescriptor,
                1,
                out descriptor,
                out descriptorSize))
        {
            return Marshal.GetLastWin32Error();
        }

        try
        {
            var attributes = new SecurityAttributes
            {
                Length = Marshal.SizeOf(typeof(SecurityAttributes)),
                SecurityDescriptor = descriptor,
                InheritHandle = 0,
            };
            return CreateDirectoryW(path, ref attributes) ? 0 : Marshal.GetLastWin32Error();
        }
        finally
        {
            LocalFree(descriptor);
        }
    }
}
`;
async function createPrivateSqliteDirectory(directoryPath) {
	if (process.platform !== "win32") {
		await node_fs_promises.default.mkdir(directoryPath, { mode: SQLITE_DIRECTORY_MODE });
		return;
	}
	const encodedPath = Buffer.from(directoryPath, "utf8").toString("base64");
	const encodedNativeSource = Buffer.from(WINDOWS_PRIVATE_DIRECTORY_NATIVE_SOURCE, "utf8").toString("base64");
	const command = [
		"$ErrorActionPreference = 'Stop'",
		`$path = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedPath}'))`,
		`$nativeSource = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedNativeSource}'))`,
		"Add-Type -TypeDefinition $nativeSource -Language CSharp",
		"$current = [System.Security.Principal.WindowsIdentity]::GetCurrent().User",
		"$security = New-Object System.Security.AccessControl.DirectorySecurity",
		"$security.SetAccessRuleProtection($true, $false)",
		"$security.SetOwner($current)",
		"$inheritance = [System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [System.Security.AccessControl.InheritanceFlags]::ObjectInherit",
		"$propagation = [System.Security.AccessControl.PropagationFlags]::None",
		"foreach ($sidValue in @($current.Value, 'S-1-5-18', 'S-1-5-32-544')) { $sid = New-Object System.Security.Principal.SecurityIdentifier($sidValue); $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($sid, [System.Security.AccessControl.FileSystemRights]::FullControl, $inheritance, $propagation, [System.Security.AccessControl.AccessControlType]::Allow); [void]$security.AddAccessRule($rule) }",
		"$sections = [System.Security.AccessControl.AccessControlSections]::Owner -bor [System.Security.AccessControl.AccessControlSections]::Access",
		"$sddl = $security.GetSecurityDescriptorSddlForm($sections)",
		"$errorCode = [OperatorPrivateDirectory]::Create($path, $sddl)",
		`if ($errorCode -eq 80 -or $errorCode -eq 183) { throw '${WINDOWS_DIRECTORY_EXISTS_MARKER}' }`,
		"if ($errorCode -ne 0) { $exception = New-Object System.ComponentModel.Win32Exception($errorCode); throw $exception }"
	].join("; ");
	const powershell = require_resolve_system_bin.resolveSystemBin("powershell");
	if (!powershell) throw new Error("Unable to resolve PowerShell for private Windows SQLite staging.");
	const encodedCommand = Buffer.from(command, "utf16le").toString("base64");
	try {
		await require_exec.runExec(powershell, [
			"-NoLogo",
			"-NoProfile",
			"-NonInteractive",
			"-EncodedCommand",
			encodedCommand
		], {
			timeoutMs: 1e4,
			maxBuffer: 64 * 1024
		});
	} catch (error) {
		if (String(error).includes(WINDOWS_DIRECTORY_EXISTS_MARKER)) {
			const existsError = /* @__PURE__ */ new Error(`Private SQLite directory already exists: ${directoryPath}`);
			existsError.code = "EEXIST";
			throw existsError;
		}
		throw new Error(`Unable to create private Windows SQLite directory: ${directoryPath}`, { cause: error });
	}
}
async function createPrivateSqliteTempDirectory(rootPath, prefix) {
	if (process.platform !== "win32") return await node_fs_promises.default.mkdtemp(node_path.default.join(rootPath, prefix));
	const directoryPath = node_path.default.join(rootPath, `${prefix}${(0, node_crypto.randomUUID)()}`);
	await createPrivateSqliteDirectory(directoryPath);
	return directoryPath;
}
async function assertRegularSourceFile(sourcePath) {
	if (!(await node_fs_promises.default.lstat(sourcePath)).isFile()) throw new Error(`SQLite snapshot source must be a regular file: ${sourcePath}`);
}
async function assertTargetAbsent(targetPath) {
	try {
		await node_fs_promises.default.lstat(targetPath);
	} catch (error) {
		if (error.code === "ENOENT") return;
		throw error;
	}
	throw new Error(`SQLite snapshot target already exists: ${targetPath}`);
}
async function copyFileExclusive(source, targetPath) {
	const sourceFingerprint = await readMutationFingerprint(source);
	let target;
	let targetIdentity;
	try {
		target = await node_fs_promises.default.open(targetPath, "wx+", 384);
		targetIdentity = await target.stat();
		const buffer = Buffer.allocUnsafe(1024 * 1024);
		const hash = (0, node_crypto.createHash)("sha256");
		let offset = 0;
		while (true) {
			const { bytesRead } = await source.read(buffer, 0, buffer.length, offset);
			if (bytesRead === 0) break;
			hash.update(buffer.subarray(0, bytesRead));
			let bytesWritten = 0;
			while (bytesWritten < bytesRead) {
				const result = await target.write(buffer, bytesWritten, bytesRead - bytesWritten, offset + bytesWritten);
				if (result.bytesWritten === 0) throw new Error(`SQLite snapshot copy made no progress: ${targetPath}`);
				bytesWritten += result.bytesWritten;
			}
			offset += bytesRead;
		}
		await assertMutationFingerprintUnchanged(source, sourceFingerprint, targetPath);
		await target.sync();
		const currentIdentity = await node_fs_promises.default.lstat(targetPath);
		if (!(0, _openclaw_fs_safe_advanced.sameFileIdentity)(targetIdentity, currentIdentity)) throw new Error(`SQLite snapshot target changed during publication: ${targetPath}`);
		return {
			content: {
				sha256: hash.digest("hex"),
				sizeBytes: offset
			},
			identity: currentIdentity
		};
	} catch (error) {
		if (targetIdentity) {
			await target?.close().catch(() => void 0);
			target = void 0;
			removePublishedTargetIfOwned(targetPath, targetIdentity);
		}
		throw error;
	} finally {
		await target?.close().catch(() => void 0);
	}
}
async function readMutationFingerprint(handle) {
	const stat = await handle.stat({ bigint: true });
	return {
		birthtimeNs: stat.birthtimeNs,
		ctimeNs: stat.ctimeNs,
		dev: stat.dev,
		ino: stat.ino,
		mtimeNs: stat.mtimeNs,
		size: stat.size
	};
}
async function assertMutationFingerprintUnchanged(handle, expected, filePath) {
	const current = await readMutationFingerprint(handle);
	if (current.birthtimeNs !== expected.birthtimeNs || current.ctimeNs !== expected.ctimeNs || current.dev !== expected.dev || current.ino !== expected.ino || current.mtimeNs !== expected.mtimeNs || current.size !== expected.size) throw new Error(`SQLite snapshot file changed while reading: ${filePath}`);
}
function sameMutationFingerprint(left, right) {
	return left.birthtimeNs === right.birthtimeNs && left.ctimeNs === right.ctimeNs && left.dev === right.dev && left.ino === right.ino && left.mtimeNs === right.mtimeNs && left.size === right.size;
}
async function syncFile(filePath) {
	const handle = await node_fs_promises.default.open(filePath, "r+");
	try {
		await handle.sync();
	} finally {
		await handle.close();
	}
}
async function assertOpenFileIdentity(handle, filePath, expectedIdentity) {
	const openedIdentity = await handle.stat();
	const currentIdentity = await node_fs_promises.default.lstat(filePath);
	if (!openedIdentity.isFile() || !currentIdentity.isFile() || !(0, _openclaw_fs_safe_advanced.sameFileIdentity)(expectedIdentity, openedIdentity) || !(0, _openclaw_fs_safe_advanced.sameFileIdentity)(expectedIdentity, currentIdentity)) throw new Error(`SQLite snapshot file changed: ${filePath}`);
}
async function hashPublishedFile(filePath, expectedIdentity) {
	const handle = await node_fs_promises.default.open(filePath, "r");
	try {
		return await hashOpenPublishedFile(handle, filePath, expectedIdentity);
	} finally {
		await handle.close();
	}
}
async function hashOpenPublishedFile(handle, filePath, expectedIdentity) {
	await assertOpenFileIdentity(handle, filePath, expectedIdentity);
	const fingerprint = await readMutationFingerprint(handle);
	const buffer = Buffer.allocUnsafe(1024 * 1024);
	const hash = (0, node_crypto.createHash)("sha256");
	let offset = 0;
	while (true) {
		const { bytesRead } = await handle.read(buffer, 0, buffer.length, offset);
		if (bytesRead === 0) break;
		hash.update(buffer.subarray(0, bytesRead));
		offset += bytesRead;
	}
	await assertMutationFingerprintUnchanged(handle, fingerprint, filePath);
	await assertOpenFileIdentity(handle, filePath, expectedIdentity);
	return {
		sha256: hash.digest("hex"),
		sizeBytes: offset
	};
}
function assertPublishedFileIdentitySync(filePath, expectedIdentity) {
	const currentIdentity = node_fs.default.lstatSync(filePath);
	if (!currentIdentity.isFile() || !(0, _openclaw_fs_safe_advanced.sameFileIdentity)(expectedIdentity, currentIdentity) || expectedIdentity.size !== currentIdentity.size || expectedIdentity.mtimeMs !== currentIdentity.mtimeMs || expectedIdentity.ctimeMs !== currentIdentity.ctimeMs || expectedIdentity.birthtimeMs !== currentIdentity.birthtimeMs) throw new Error(`SQLite snapshot file changed: ${filePath}`);
}
function assertOpenFileIdentitySync(fileDescriptor, filePath, expectedIdentity) {
	const openedIdentity = node_fs.default.fstatSync(fileDescriptor);
	const currentIdentity = node_fs.default.lstatSync(filePath);
	if (!openedIdentity.isFile() || !currentIdentity.isFile() || !(0, _openclaw_fs_safe_advanced.sameFileIdentity)(expectedIdentity, openedIdentity) || !(0, _openclaw_fs_safe_advanced.sameFileIdentity)(expectedIdentity, currentIdentity)) throw new Error(`SQLite snapshot file changed: ${filePath}`);
}
function hashPublishedFileSync(filePath, expectedIdentity) {
	const fileDescriptor = node_fs.default.openSync(filePath, "r");
	try {
		assertOpenFileIdentitySync(fileDescriptor, filePath, expectedIdentity);
		const initialStat = node_fs.default.fstatSync(fileDescriptor, { bigint: true });
		const initialFingerprint = {
			birthtimeNs: initialStat.birthtimeNs,
			ctimeNs: initialStat.ctimeNs,
			dev: initialStat.dev,
			ino: initialStat.ino,
			mtimeNs: initialStat.mtimeNs,
			size: initialStat.size
		};
		const hash = (0, node_crypto.createHash)("sha256");
		const buffer = Buffer.allocUnsafe(1024 * 1024);
		let offset = 0;
		while (true) {
			const bytesRead = node_fs.default.readSync(fileDescriptor, buffer, 0, buffer.length, offset);
			if (bytesRead === 0) break;
			hash.update(buffer.subarray(0, bytesRead));
			offset += bytesRead;
		}
		const finalStat = node_fs.default.fstatSync(fileDescriptor, { bigint: true });
		if (!sameMutationFingerprint(initialFingerprint, {
			birthtimeNs: finalStat.birthtimeNs,
			ctimeNs: finalStat.ctimeNs,
			dev: finalStat.dev,
			ino: finalStat.ino,
			mtimeNs: finalStat.mtimeNs,
			size: finalStat.size
		})) throw new Error(`SQLite snapshot file changed while reading: ${filePath}`);
		assertOpenFileIdentitySync(fileDescriptor, filePath, expectedIdentity);
		return {
			sha256: hash.digest("hex"),
			sizeBytes: offset
		};
	} finally {
		node_fs.default.closeSync(fileDescriptor);
	}
}
function assertExpectedContent(actual, expected, filePath) {
	if (actual.sizeBytes !== expected.sizeBytes) throw new Error(`SQLite snapshot size mismatch for ${filePath}: expected ${expected.sizeBytes}, got ${actual.sizeBytes}`);
	if (actual.sha256 !== expected.sha256) throw new Error(`SQLite snapshot hash mismatch for ${filePath}: expected ${expected.sha256}, got ${actual.sha256}`);
}
function removePublishedTargetIfOwned(filePath, expectedIdentity, requireFingerprint = false) {
	let currentIdentity;
	try {
		currentIdentity = node_fs.default.lstatSync(filePath);
	} catch {
		return false;
	}
	const fingerprintMatches = !requireFingerprint || expectedIdentity.size === currentIdentity.size && expectedIdentity.mtimeMs === currentIdentity.mtimeMs && expectedIdentity.ctimeMs === currentIdentity.ctimeMs && expectedIdentity.birthtimeMs === currentIdentity.birthtimeMs;
	if (!(0, _openclaw_fs_safe_advanced.sameFileIdentity)(expectedIdentity, currentIdentity) || !fingerprintMatches) return false;
	try {
		node_fs.default.unlinkSync(filePath);
		return true;
	} catch {
		return false;
	}
}
function assertSynchronousCallbackResult(result, label) {
	if (result && (typeof result === "object" || typeof result === "function") && typeof result.then === "function") {
		Promise.resolve(result).catch(() => void 0);
		throw new Error(`${label} must be synchronous.`);
	}
}
function isUnsupportedDirectorySyncError(error) {
	const code = error.code;
	return code === "EINVAL" || code === "ENOTSUP" || code === "ENOSYS" || process.platform === "win32" && (code === "EISDIR" || code === "EPERM" || code === "EACCES");
}
async function syncDirectoryBestEffort(directoryPath) {
	const handle = await node_fs_promises.default.open(directoryPath, "r").catch((error) => {
		if (isUnsupportedDirectorySyncError(error)) return;
		throw error;
	});
	if (!handle) return;
	try {
		await handle.sync();
	} catch (error) {
		if (!isUnsupportedDirectorySyncError(error)) throw error;
	} finally {
		await handle.close();
	}
}
function isLinkFallbackError(error) {
	const code = error.code;
	return code === "EPERM" || code === "EXDEV" || code === "ENOTSUP" || code === "EOPNOTSUPP" || code === "ENOSYS";
}
/**
* Publish the exact bytes of one already-verified SQLite file without reopening
* its pathname during the copy. The target is always created exclusively.
*/
async function publishVerifiedSqliteFile(options) {
	await assertTargetAbsent(options.targetPath);
	const targetDirectory = node_path.default.dirname(options.targetPath);
	const stagingDir = await createPrivateSqliteTempDirectory(targetDirectory, `.sqlite-publish-${(0, node_crypto.randomUUID)()}-`);
	const stagedPath = node_path.default.join(stagingDir, "database.sqlite");
	let stagingIdentity;
	let source;
	let target;
	let targetPinFileDescriptor;
	let verifiedStagedIdentity;
	let linkedCandidateIdentity;
	let publishedIdentity;
	let ownershipPinned = false;
	let hardLinkCreated = false;
	try {
		stagingIdentity = await node_fs_promises.default.lstat(stagingDir);
		await node_fs_promises.default.chmod(stagingDir, 448);
		source = await node_fs_promises.default.open(options.sourcePath, "r");
		await assertOpenFileIdentity(source, options.sourcePath, options.sourceIdentity);
		const staged = await copyFileExclusive(source, stagedPath);
		verifiedStagedIdentity = staged.identity;
		const expectedContent = options.expectedContent;
		assertExpectedContent(staged.content, expectedContent, options.targetPath);
		await source.close();
		source = void 0;
		await options.validatePublished?.(stagedPath);
		assertExpectedContent(await hashPublishedFile(stagedPath, staged.identity), expectedContent, options.targetPath);
		await options.beforePublish?.();
		await assertTargetAbsent(options.targetPath);
		let usedHardLink = false;
		try {
			await node_fs_promises.default.link(stagedPath, options.targetPath);
			usedHardLink = true;
			hardLinkCreated = true;
		} catch (error) {
			if (!isLinkFallbackError(error)) throw error;
			if (options.requireAtomicPublication) throw new Error(`Atomic SQLite publication requires hard-link support in ${targetDirectory}.`, { cause: error });
			const stagedSource = await node_fs_promises.default.open(stagedPath, "r");
			try {
				const copied = await copyFileExclusive(stagedSource, options.targetPath);
				publishedIdentity = copied.identity;
				assertExpectedContent(copied.content, expectedContent, options.targetPath);
			} finally {
				await stagedSource.close();
			}
		}
		if (usedHardLink) {
			target = await node_fs_promises.default.open(options.targetPath, "r");
			const linkedIdentity = await target.stat();
			linkedCandidateIdentity = linkedIdentity;
			const currentTargetIdentity = await node_fs_promises.default.lstat(options.targetPath);
			const currentStagedIdentity = await node_fs_promises.default.lstat(stagedPath);
			if (!(0, _openclaw_fs_safe_advanced.sameFileIdentity)(linkedIdentity, currentTargetIdentity)) throw new Error(`SQLite snapshot target changed during publication: ${options.targetPath}`);
			const matchesVerifiedStaging = (0, _openclaw_fs_safe_advanced.sameFileIdentity)(staged.identity, linkedIdentity);
			const matchesCurrentStaging = (0, _openclaw_fs_safe_advanced.sameFileIdentity)(currentStagedIdentity, linkedIdentity);
			if (matchesVerifiedStaging || matchesCurrentStaging) {
				publishedIdentity = linkedIdentity;
				ownershipPinned = true;
			}
			if (!matchesCurrentStaging) throw new Error(`SQLite snapshot staging path changed after publication: ${stagedPath}`);
			if (!matchesVerifiedStaging) throw new Error(`SQLite snapshot staging file changed during publication: ${options.targetPath}`);
		}
		if (!publishedIdentity) throw new Error(`SQLite snapshot target was not published: ${options.targetPath}`);
		const initialPublishedIdentity = publishedIdentity;
		target ??= await node_fs_promises.default.open(options.targetPath, "r");
		await assertOpenFileIdentity(target, options.targetPath, initialPublishedIdentity);
		ownershipPinned = true;
		await syncDirectoryBestEffort(targetDirectory);
		await node_fs_promises.default.unlink(stagedPath);
		const expectedIdentity = await target.stat();
		publishedIdentity = expectedIdentity;
		await node_fs_promises.default.rmdir(stagingDir);
		await syncDirectoryBestEffort(targetDirectory);
		assertExpectedContent(await hashOpenPublishedFile(target, options.targetPath, expectedIdentity), expectedContent, options.targetPath);
		await target.close();
		target = void 0;
		ownershipPinned = false;
		targetPinFileDescriptor = node_fs.default.openSync(options.targetPath, "r");
		assertOpenFileIdentitySync(targetPinFileDescriptor, options.targetPath, expectedIdentity);
		ownershipPinned = true;
		const guard = {
			assertTargetMatchesExpectedContent: (finalCheck) => {
				assertExpectedContent(hashPublishedFileSync(options.targetPath, expectedIdentity), expectedContent, options.targetPath);
				assertSynchronousCallbackResult(finalCheck?.(), "SQLite publication final check");
				assertPublishedFileIdentitySync(options.targetPath, expectedIdentity);
			},
			assertTargetUnchanged: (finalCheck) => {
				assertPublishedFileIdentitySync(options.targetPath, expectedIdentity);
				assertSynchronousCallbackResult(finalCheck?.(), "SQLite publication final check");
				assertPublishedFileIdentitySync(options.targetPath, expectedIdentity);
			}
		};
		if (options.afterPublish) assertSynchronousCallbackResult(options.afterPublish(guard), "SQLite after-publication guard");
		else guard.assertTargetUnchanged();
		node_fs.default.closeSync(targetPinFileDescriptor);
		targetPinFileDescriptor = void 0;
		ownershipPinned = false;
	} catch (error) {
		if (!publishedIdentity && hardLinkCreated && verifiedStagedIdentity) {
			const currentTargetIdentity = await node_fs_promises.default.lstat(options.targetPath).catch(() => void 0);
			const currentStagedIdentity = await node_fs_promises.default.lstat(stagedPath).catch(() => void 0);
			const targetMatchesStaging = currentTargetIdentity && currentStagedIdentity && (0, _openclaw_fs_safe_advanced.sameFileIdentity)(currentTargetIdentity, currentStagedIdentity);
			const targetMatchesVerified = currentTargetIdentity && (0, _openclaw_fs_safe_advanced.sameFileIdentity)(currentTargetIdentity, verifiedStagedIdentity);
			if (targetMatchesStaging || targetMatchesVerified) {
				publishedIdentity = currentTargetIdentity;
				ownershipPinned = Boolean(targetMatchesStaging);
			}
		}
		if (!publishedIdentity && target && linkedCandidateIdentity && verifiedStagedIdentity) {
			const currentTargetIdentity = await node_fs_promises.default.lstat(options.targetPath).catch(() => void 0);
			const currentStagedIdentity = await node_fs_promises.default.lstat(stagedPath).catch(() => void 0);
			const targetStillMatches = currentTargetIdentity && (0, _openclaw_fs_safe_advanced.sameFileIdentity)(currentTargetIdentity, linkedCandidateIdentity);
			const targetCameFromStaging = currentStagedIdentity && (0, _openclaw_fs_safe_advanced.sameFileIdentity)(currentStagedIdentity, linkedCandidateIdentity) || (0, _openclaw_fs_safe_advanced.sameFileIdentity)(verifiedStagedIdentity, linkedCandidateIdentity);
			if (targetStillMatches && targetCameFromStaging) {
				publishedIdentity = linkedCandidateIdentity;
				ownershipPinned = true;
			}
		}
		if (target && publishedIdentity) {
			const openedIdentity = await target.stat().catch(() => void 0);
			if (openedIdentity && (0, _openclaw_fs_safe_advanced.sameFileIdentity)(openedIdentity, publishedIdentity)) {
				publishedIdentity = openedIdentity;
				ownershipPinned = true;
			}
		}
		if (publishedIdentity) {
			if (removePublishedTargetIfOwned(options.targetPath, publishedIdentity, !ownershipPinned)) await syncDirectoryBestEffort(targetDirectory).catch(() => void 0);
		}
		if (stagingIdentity) await removePublicationStagingDirectory(stagingDir, stagingIdentity).catch(() => void 0);
		else await node_fs_promises.default.rmdir(stagingDir).catch(() => void 0);
		throw error;
	} finally {
		if (targetPinFileDescriptor !== void 0) node_fs.default.closeSync(targetPinFileDescriptor);
		if (target) await target.close().catch(() => void 0);
		if (source) await source.close().catch(() => void 0);
	}
}
async function removePublicationStagingDirectory(stagingDir, expectedIdentity) {
	const currentIdentity = await node_fs_promises.default.lstat(stagingDir).catch(() => void 0);
	if (!currentIdentity) return;
	if (!currentIdentity.isDirectory() || !(0, _openclaw_fs_safe_advanced.sameFileIdentity)(expectedIdentity, currentIdentity)) throw new Error(`SQLite publication staging directory changed: ${stagingDir}`);
	const entries = await node_fs_promises.default.readdir(stagingDir, { withFileTypes: true });
	if (entries.length > 1 || entries.some((entry) => entry.name !== "database.sqlite" || !entry.isFile())) throw new Error(`SQLite publication staging directory has unexpected contents: ${stagingDir}`);
	const stagedEntry = entries[0];
	if (stagedEntry) await node_fs_promises.default.unlink(node_path.default.join(stagingDir, stagedEntry.name));
	await node_fs_promises.default.rmdir(stagingDir);
}
/**
* Compact one SQLite database into a fresh private file and verify the result.
*
* The source and output both receive full structural, index, and foreign-key
* checks. Only a fully verified, synced snapshot is published to the target.
*/
async function createVerifiedSqliteSnapshot(options) {
	await assertRegularSourceFile(options.sourcePath);
	await assertTargetAbsent(options.targetPath);
	const stagingDir = await createPrivateSqliteTempDirectory(node_path.default.dirname(options.targetPath), ".sqlite-snapshot-");
	await node_fs_promises.default.chmod(stagingDir, 448);
	const stagedPath = node_path.default.join(stagingDir, "database.sqlite");
	const sqlite = require_state_migrations_cron_run_logs.requireNodeSqlite();
	let stagedIdentity;
	try {
		const source = new sqlite.DatabaseSync(options.sourcePath, {
			allowExtension: true,
			readOnly: true
		});
		try {
			source.exec("PRAGMA busy_timeout = 30000; PRAGMA trusted_schema = OFF;");
			await require_engine_storage.loadSqliteVecExtension({ db: source });
			require_state_migrations_cron_run_logs.assertSqliteIntegrity(source, options.sourcePath);
			options.validate?.(source, options.sourcePath);
			source.prepare("VACUUM INTO ?").run(stagedPath);
		} finally {
			source.close();
		}
		await node_fs_promises.default.chmod(stagedPath, 384);
		const snapshot = new sqlite.DatabaseSync(stagedPath, { allowExtension: true });
		try {
			snapshot.exec("PRAGMA busy_timeout = 30000; PRAGMA trusted_schema = OFF;");
			await require_engine_storage.loadSqliteVecExtension({ db: snapshot });
			if (options.transform) {
				await options.transform(snapshot);
				snapshot.exec("VACUUM;");
			}
			require_state_migrations_cron_run_logs.assertSqliteIntegrity(snapshot, options.targetPath);
			options.validate?.(snapshot, options.targetPath);
			const userVersion = require_state_migrations_cron_run_logs.readSqliteUserVersion(snapshot);
			snapshot.close();
			await syncFile(stagedPath);
			stagedIdentity = await node_fs_promises.default.lstat(stagedPath);
			const expectedContent = await hashPublishedFile(stagedPath, stagedIdentity);
			await publishVerifiedSqliteFile({
				sourceIdentity: stagedIdentity,
				sourcePath: stagedPath,
				targetPath: options.targetPath,
				expectedContent,
				beforePublish: options.beforePublish,
				afterPublish: options.afterPublish,
				validatePublished: async (publishedPath) => {
					const published = new sqlite.DatabaseSync(publishedPath, {
						allowExtension: true,
						readOnly: true
					});
					try {
						published.exec("PRAGMA busy_timeout = 30000; PRAGMA trusted_schema = OFF;");
						await require_engine_storage.loadSqliteVecExtension({ db: published });
						require_state_migrations_cron_run_logs.assertSqliteIntegrity(published, options.targetPath);
						options.validate?.(published, options.targetPath);
						const publishedUserVersion = require_state_migrations_cron_run_logs.readSqliteUserVersion(published);
						if (publishedUserVersion !== userVersion) throw new Error(`SQLite snapshot user_version changed during publication: expected ${userVersion}, got ${publishedUserVersion}`);
					} finally {
						published.close();
					}
				}
			});
			return {
				path: options.targetPath,
				userVersion
			};
		} finally {
			if (snapshot.isOpen) snapshot.close();
		}
	} catch (error) {
		throw new Error(`SQLite database cannot be snapshotted safely: ${options.sourcePath}. ${require_errors.formatErrorMessage(error)}`, { cause: error });
	} finally {
		await node_fs_promises.default.rm(stagingDir, {
			force: true,
			recursive: true
		}).catch(() => void 0);
	}
}
//#endregion
//#region src/infra/backup-create.ts
const loadTarRuntime = require_lazy_runtime.createLazyRuntimeModule(() => import("tar"));
var BackupLinkCache = class extends Map {
	get(_key) {}
	set(_key, _value) {
		return this;
	}
};
async function resolveOutputPath(params) {
	const basename = require_backup_shared.buildBackupArchiveBasename(params.nowMs);
	const rawOutput = params.output?.trim();
	if (!rawOutput) {
		const cwd = node_path.default.resolve(process.cwd());
		const canonicalCwd = await node_fs_promises.default.realpath(cwd).catch(() => cwd);
		const defaultDir = params.includedAssets.some((asset) => require_backup_shared.isPathWithin(canonicalCwd, asset.sourcePath)) ? require_utils.resolveHomeDir() ?? node_path.default.dirname(params.stateDir) : cwd;
		return node_path.default.resolve(defaultDir, basename);
	}
	const resolved = require_home_dir.resolveUserPath(rawOutput);
	if (rawOutput.endsWith("/") || rawOutput.endsWith("\\")) return node_path.default.join(resolved, basename);
	try {
		if ((await node_fs_promises.default.stat(resolved)).isDirectory()) return node_path.default.join(resolved, basename);
	} catch {}
	return resolved;
}
async function assertOutputPathReady(outputPath) {
	try {
		await node_fs_promises.default.access(outputPath);
		throw new Error(`Refusing to overwrite existing backup archive: ${outputPath}`);
	} catch (err) {
		if (err?.code === "ENOENT") return;
		throw err;
	}
}
function buildTempArchivePath(outputPath) {
	return `${outputPath}.${(0, node_crypto.randomUUID)()}.tmp`;
}
async function chooseBackupTempRoot(params) {
	const systemTmp = node_os.default.tmpdir();
	const canonicalSystemTmp = await canonicalizePathForContainment(systemTmp);
	if (!params.assets.some((asset) => require_backup_shared.isPathWithin(canonicalSystemTmp, asset.sourcePath))) return systemTmp;
	const fallback = node_path.default.dirname(params.outputPath);
	const canonicalFallback = await canonicalizePathForContainment(fallback);
	const fallbackInsideAsset = params.assets.find((asset) => require_backup_shared.isPathWithin(canonicalFallback, asset.sourcePath));
	if (fallbackInsideAsset) throw new Error(`Backup temp root cannot be placed outside every source path: ${systemTmp} and ${fallback} both overlap ${fallbackInsideAsset.sourcePath}.`);
	return fallback;
}
function isLinkUnsupportedError(code) {
	return code === "ENOTSUP" || code === "EOPNOTSUPP" || code === "EPERM";
}
async function publishTempArchive(params) {
	try {
		await node_fs_promises.default.link(params.tempArchivePath, params.outputPath);
	} catch (err) {
		const code = err?.code;
		if (code === "EEXIST") throw new Error(`Refusing to overwrite existing backup archive: ${params.outputPath}`, { cause: err });
		if (!isLinkUnsupportedError(code)) throw err;
		try {
			await node_fs_promises.default.copyFile(params.tempArchivePath, params.outputPath, node_fs.constants.COPYFILE_EXCL);
		} catch (copyErr) {
			const copyCode = copyErr?.code;
			if (copyCode !== "EEXIST") await node_fs_promises.default.rm(params.outputPath, { force: true }).catch(() => void 0);
			if (copyCode === "EEXIST") throw new Error(`Refusing to overwrite existing backup archive: ${params.outputPath}`, { cause: copyErr });
			throw copyErr;
		}
	}
	await node_fs_promises.default.rm(params.tempArchivePath, { force: true });
}
async function canonicalizePathForContainment(targetPath) {
	const resolved = node_path.default.resolve(targetPath);
	const suffix = [];
	let probe = resolved;
	while (true) try {
		const realProbe = await node_fs_promises.default.realpath(probe);
		return suffix.length === 0 ? realProbe : node_path.default.join(realProbe, ...suffix.toReversed());
	} catch {
		const parent = node_path.default.dirname(probe);
		if (parent === probe) return resolved;
		suffix.push(node_path.default.basename(probe));
		probe = parent;
	}
}
function buildManifest(params) {
	return {
		schemaVersion: 1,
		createdAt: params.createdAt,
		archiveRoot: params.archiveRoot,
		runtimeVersion: require_version.resolveRuntimeServiceVersion(),
		platform: process.platform,
		nodeVersion: process.version,
		options: {
			includeWorkspace: params.includeWorkspace,
			onlyConfig: params.onlyConfig
		},
		paths: {
			stateDir: params.stateDir,
			configPath: params.configPath,
			oauthDir: params.oauthDir,
			workspaceDirs: params.workspaceDirs
		},
		assets: params.assets.map((asset) => ({
			kind: asset.kind,
			sourcePath: asset.sourcePath,
			archivePath: asset.archivePath
		})),
		skipped: params.skipped.map((entry) => ({
			kind: entry.kind,
			sourcePath: entry.sourcePath,
			reason: entry.reason,
			coveredBy: entry.coveredBy
		}))
	};
}
function formatBackupCreateSummary(result) {
	const lines = [`Backup archive: ${result.archivePath}`];
	lines.push(`Included ${result.assets.length} path${result.assets.length === 1 ? "" : "s"}:`);
	for (const asset of result.assets) lines.push(`- ${asset.kind}: ${asset.displayPath}`);
	if (result.skipped.length > 0) {
		lines.push(`Skipped ${result.skipped.length} path${result.skipped.length === 1 ? "" : "s"}:`);
		for (const entry of result.skipped) if (entry.reason === "covered" && entry.coveredBy) lines.push(`- ${entry.kind}: ${entry.displayPath} (${entry.reason} by ${entry.coveredBy})`);
		else lines.push(`- ${entry.kind}: ${entry.displayPath} (${entry.reason})`);
	}
	if (result.dryRun) lines.push("Dry run only; archive was not written.");
	else {
		lines.push(`Created ${result.archivePath}`);
		if (result.skippedVolatileCount > 0) lines.push(`Skipped ${result.skippedVolatileCount} volatile file${result.skippedVolatileCount === 1 ? "" : "s"} (live sessions, cron logs, queues, sockets, pid/tmp).`);
		if (result.verified) lines.push("Archive verification: passed");
	}
	return lines;
}
function remapArchiveEntryPath(params) {
	const normalizedEntry = node_path.default.resolve(params.entryPath);
	if (normalizedEntry === params.manifestPath) return node_path.default.posix.join(params.archiveRoot, "manifest.json");
	const remappedSourcePath = params.sourcePathRemaps?.get(normalizedEntry);
	if (remappedSourcePath) return require_backup_shared.buildBackupArchivePath(params.archiveRoot, remappedSourcePath);
	return require_backup_shared.buildBackupArchivePath(params.archiveRoot, normalizedEntry);
}
function normalizeBackupFilterPath(value) {
	return value.replaceAll("\\", "/").replace(/\/+$/u, "");
}
function buildExtensionsNodeModulesFilter(stateDir) {
	const extensionsPrefix = `${normalizeBackupFilterPath(stateDir)}/extensions/`;
	return (filePath) => {
		const normalizedFilePath = normalizeBackupFilterPath(filePath);
		if (!normalizedFilePath.startsWith(extensionsPrefix)) return true;
		return !normalizedFilePath.slice(extensionsPrefix.length).split("/").includes("node_modules");
	};
}
const SQLITE_BACKUP_SOURCE_SUFFIXES = [
	"",
	"-wal",
	"-shm",
	"-journal"
];
const SQLITE_BACKUP_EXCLUDED_SUFFIXES = [".reindex-lock.sqlite"];
const SQLITE_BACKUP_REINDEX_TRANSIENT_PATTERN = /\.sqlite\.(?:backup|memory-reindex|tmp)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
function isCanonicalAgentSqlitePathOrAncestor(sourcePath, stateDir) {
	const segments = node_path.default.relative(node_path.default.resolve(stateDir), node_path.default.resolve(sourcePath)).split(node_path.default.sep);
	if (segments[0] !== "agents" || !segments[1]) return false;
	if (segments.length === 2) return true;
	if (segments[2] !== "agent") return false;
	if (segments.length === 3) return true;
	if (segments.length !== 4) return false;
	return SQLITE_BACKUP_SOURCE_SUFFIXES.some((suffix) => segments[3] === `operator-agent.sqlite${suffix}`);
}
function isStatePackageContentPath(sourcePath, stateDir) {
	const resolvedStateDir = node_path.default.resolve(stateDir);
	const resolvedSourcePath = node_path.default.resolve(sourcePath);
	return require_backup_shared.isPathWithin(resolvedSourcePath, resolvedStateDir) && !isCanonicalAgentSqlitePathOrAncestor(resolvedSourcePath, resolvedStateDir) && node_path.default.relative(resolvedStateDir, resolvedSourcePath).split(node_path.default.sep).includes("node_modules");
}
function resolveSqliteBackupDatabasePath(sourcePath) {
	for (const suffix of SQLITE_BACKUP_SOURCE_SUFFIXES.slice(1)) if (sourcePath.endsWith(suffix)) {
		const databasePath = sourcePath.slice(0, -suffix.length);
		return databasePath.endsWith(".sqlite") ? databasePath : void 0;
	}
	return sourcePath.endsWith(".sqlite") ? sourcePath : void 0;
}
function resolveSqliteBackupBasePath(sourcePath) {
	for (const suffix of SQLITE_BACKUP_SOURCE_SUFFIXES.slice(1)) if (sourcePath.endsWith(suffix)) return sourcePath.slice(0, -suffix.length);
	return sourcePath;
}
function classifyStateSqliteBackupSourcePath(sourcePath, stateDir) {
	const resolvedSourcePath = node_path.default.resolve(sourcePath);
	if (!require_backup_shared.isPathWithin(resolvedSourcePath, stateDir)) return;
	if (isStatePackageContentPath(resolvedSourcePath, stateDir)) return;
	if (SQLITE_BACKUP_REINDEX_TRANSIENT_PATTERN.test(resolveSqliteBackupBasePath(resolvedSourcePath))) return "excluded";
	const databasePath = resolveSqliteBackupDatabasePath(resolvedSourcePath);
	if (!databasePath) return;
	return SQLITE_BACKUP_EXCLUDED_SUFFIXES.some((suffix) => databasePath.endsWith(suffix)) ? "excluded" : "sqlite";
}
function isBackupTarFilterFile(entry) {
	return "isFile" in entry ? entry.isFile() : entry.type === "File";
}
function tableExistsSql(db, tableName) {
	return db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)?.ok === 1;
}
function sanitizeGlobalStateSqliteSnapshot(db) {
	if (tableExistsSql(db, "delivery_queue_entries")) db.prepare("DELETE FROM delivery_queue_entries").run();
}
async function listStateSqlitePaths(params) {
	const snapshotPaths = /* @__PURE__ */ new Set();
	const discoveredSourcePaths = /* @__PURE__ */ new Set();
	const extensionsFilter = buildExtensionsNodeModulesFilter(params.stateDir);
	async function visit(dir) {
		let entries;
		try {
			entries = await node_fs_promises.default.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const entryPath = node_path.default.join(dir, entry.name);
			if (entry.isSymbolicLink()) continue;
			if (entry.isDirectory()) {
				if (extensionsFilter(entryPath) && !isStatePackageContentPath(entryPath, params.stateDir)) await visit(entryPath);
			} else if (entry.isFile() && extensionsFilter(entryPath) && !isStatePackageContentPath(entryPath, params.stateDir)) {
				const resolvedEntryPath = node_path.default.resolve(entryPath);
				if (resolveSqliteBackupDatabasePath(resolvedEntryPath)) discoveredSourcePaths.add(resolvedEntryPath);
				if (entry.name.endsWith(".sqlite") && !SQLITE_BACKUP_EXCLUDED_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) snapshotPaths.add(resolvedEntryPath);
			}
		}
	}
	await visit(params.stateDir);
	const globalStateSqlitePath = node_path.default.resolve(params.globalStateSqlitePath);
	let globalStateEntry;
	try {
		globalStateEntry = await node_fs_promises.default.lstat(globalStateSqlitePath);
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
	if (globalStateEntry?.isFile()) {
		snapshotPaths.add(globalStateSqlitePath);
		discoveredSourcePaths.add(globalStateSqlitePath);
	} else if (globalStateEntry?.isSymbolicLink()) {
		let targetEntry;
		try {
			targetEntry = await node_fs_promises.default.stat(globalStateSqlitePath);
		} catch (err) {
			throw new Error(`Canonical global SQLite symlink cannot be snapshotted: ${globalStateSqlitePath}`, { cause: err });
		}
		if (!targetEntry.isFile()) throw new Error(`Canonical global SQLite symlink must resolve to a regular file: ${globalStateSqlitePath}`);
		snapshotPaths.add(globalStateSqlitePath);
		discoveredSourcePaths.add(globalStateSqlitePath);
	} else if (globalStateEntry) throw new Error(`Canonical global SQLite path must be a regular file or symlink to one: ${globalStateSqlitePath}`);
	return {
		snapshotPaths: [...snapshotPaths].toSorted((left, right) => left.localeCompare(right)),
		discoveredSourcePaths
	};
}
async function createStateSqliteBackupPlan(params) {
	const globalStateSqlitePath = node_path.default.resolve(require_openclaw_state_db.resolveOperatorStateSqlitePath({
		...process.env,
		OPERATOR_STATE_DIR: params.stateDir
	}));
	const discovery = await listStateSqlitePaths({
		stateDir: params.stateDir,
		globalStateSqlitePath
	});
	const snapshots = [];
	for (const archiveSourcePath of discovery.snapshotPaths) {
		const sourceDatabasePath = node_path.default.resolve(archiveSourcePath) === globalStateSqlitePath ? await node_fs_promises.default.realpath(archiveSourcePath) : archiveSourcePath;
		const sourcePath = node_path.default.join(params.tempDir, `openclaw-state-db-${snapshots.length}.sqlite`);
		try {
			await createVerifiedSqliteSnapshot({
				sourcePath: sourceDatabasePath,
				targetPath: sourcePath,
				transform: node_path.default.resolve(archiveSourcePath) === globalStateSqlitePath ? sanitizeGlobalStateSqliteSnapshot : void 0
			});
		} catch (err) {
			throw new Error(`SQLite database cannot be compacted safely for backup: ${archiveSourcePath}. ${require_errors.formatErrorMessage(err)}. The source must pass full integrity checks and VACUUM INTO with its required SQLite capabilities; raw page backup was refused because it can retain deleted data.`, { cause: err });
		}
		snapshots.push({
			sourcePath,
			archiveSourcePath,
			skippedSourcePaths: new Set([archiveSourcePath, sourceDatabasePath].flatMap((databasePath) => SQLITE_BACKUP_SOURCE_SUFFIXES.map((suffix) => node_path.default.resolve(`${databasePath}${suffix}`))))
		});
	}
	return {
		snapshots,
		discoveredSourcePaths: discovery.discoveredSourcePaths
	};
}
async function createBackupArchive(opts = {}) {
	const nowMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(opts.nowMs);
	const archiveRoot = require_backup_shared.buildBackupArchiveRoot(nowMs);
	const onlyConfig = Boolean(opts.onlyConfig);
	const includeWorkspace = onlyConfig ? false : opts.includeWorkspace ?? true;
	const plan = await require_backup_shared.resolveBackupPlanFromDisk({
		includeWorkspace,
		onlyConfig,
		nowMs
	});
	const outputPath = await resolveOutputPath({
		output: opts.output,
		nowMs,
		includedAssets: plan.included,
		stateDir: plan.stateDir
	});
	if (plan.included.length === 0) throw new Error(onlyConfig ? "No Operator config file was found to back up." : "No local Operator state was found to back up.");
	const canonicalOutputPath = await canonicalizePathForContainment(outputPath);
	const overlappingAsset = plan.included.find((asset) => require_backup_shared.isPathWithin(canonicalOutputPath, asset.sourcePath));
	if (overlappingAsset) throw new Error(`Backup output must not be written inside a source path: ${outputPath} is inside ${overlappingAsset.sourcePath}`);
	if (!opts.dryRun) await assertOutputPathReady(outputPath);
	const createdAt = new Date(nowMs).toISOString();
	const result = {
		createdAt,
		archiveRoot,
		archivePath: outputPath,
		dryRun: Boolean(opts.dryRun),
		includeWorkspace,
		onlyConfig,
		verified: false,
		assets: plan.included,
		skipped: plan.skipped,
		skippedVolatileCount: 0
	};
	if (opts.dryRun) return result;
	await node_fs_promises.default.mkdir(node_path.default.dirname(outputPath), { recursive: true });
	const tempRoot = await chooseBackupTempRoot({
		assets: result.assets,
		outputPath
	});
	await node_fs_promises.default.mkdir(tempRoot, { recursive: true });
	const tempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(tempRoot, "operator-backup-"));
	const manifestPath = node_path.default.join(tempDir, "manifest.json");
	const tempArchivePath = buildTempArchivePath(outputPath);
	const tempArchiveCleanupPaths = resolveBackupTarAttemptTempPaths(tempArchivePath);
	const stateAsset = result.assets.find((asset) => asset.kind === "state");
	try {
		const stateSqliteBackup = stateAsset ? await createStateSqliteBackupPlan({
			stateDir: stateAsset.sourcePath,
			tempDir
		}) : {
			snapshots: [],
			discoveredSourcePaths: /* @__PURE__ */ new Set()
		};
		const sourcePathRemaps = /* @__PURE__ */ new Map();
		const skippedSqliteSourcePaths = /* @__PURE__ */ new Set();
		for (const snapshot of stateSqliteBackup.snapshots) {
			sourcePathRemaps.set(node_path.default.resolve(snapshot.sourcePath), snapshot.archiveSourcePath);
			for (const skippedSourcePath of snapshot.skippedSourcePaths) skippedSqliteSourcePaths.add(skippedSourcePath);
		}
		await (0, _openclaw_fs_safe_json.writeJson)(manifestPath, buildManifest({
			createdAt,
			archiveRoot,
			includeWorkspace,
			onlyConfig,
			assets: result.assets,
			skipped: result.skipped,
			stateDir: plan.stateDir,
			configPath: plan.configPath,
			oauthDir: plan.oauthDir,
			workspaceDirs: plan.workspaceDirs
		}), { trailingNewline: true });
		const tar = await loadTarRuntime();
		const extensionsFilter = stateAsset ? buildExtensionsNodeModulesFilter(stateAsset.sourcePath) : void 0;
		const volatilePlan = { stateDirs: [stateAsset?.sourcePath ?? plan.stateDir] };
		let skippedVolatileCount = 0;
		const unexpectedSqliteSourcePaths = [];
		const tarFilter = (entryPath, entryStat) => {
			const resolvedEntryPath = node_path.default.resolve(entryPath);
			if (resolvedEntryPath === manifestPath) return true;
			if (extensionsFilter && !extensionsFilter(entryPath)) return false;
			const sqliteSourceKind = stateAsset ? classifyStateSqliteBackupSourcePath(resolvedEntryPath, stateAsset.sourcePath) : void 0;
			if (sqliteSourceKind === "excluded") return false;
			if (skippedSqliteSourcePaths.has(resolvedEntryPath)) return false;
			if (sqliteSourceKind === "sqlite" && stateSqliteBackup.discoveredSourcePaths.has(resolvedEntryPath)) return false;
			if (sqliteSourceKind === "sqlite" && isBackupTarFilterFile(entryStat)) {
				unexpectedSqliteSourcePaths.push(entryPath);
				return false;
			}
			if (isVolatileBackupPath(entryPath, volatilePlan)) {
				skippedVolatileCount += 1;
				return false;
			}
			return true;
		};
		const completedTempArchivePath = await writeTarArchiveWithRetry({
			tempArchivePath,
			log: opts.log,
			runTar: async (attemptTempArchivePath) => {
				skippedVolatileCount = 0;
				unexpectedSqliteSourcePaths.length = 0;
				await writeArchiveStreamToFile({
					archivePath: attemptTempArchivePath,
					archiveStream: tar.c({
						gzip: true,
						portable: true,
						preservePaths: true,
						linkCache: new BackupLinkCache(),
						statCache: createBackupVolatileStatCache(volatilePlan),
						filter: tarFilter,
						onWriteEntry: (entry) => {
							entry.path = remapArchiveEntryPath({
								entryPath: entry.path,
								manifestPath,
								archiveRoot,
								sourcePathRemaps
							});
						}
					}, [
						manifestPath,
						...stateSqliteBackup.snapshots.map((snapshot) => snapshot.sourcePath),
						...result.assets.map((asset) => asset.sourcePath)
					])
				});
				const unexpectedSqliteSourcePath = unexpectedSqliteSourcePaths[0];
				if (unexpectedSqliteSourcePath) throw new Error(`SQLite state appeared after snapshot discovery: ${unexpectedSqliteSourcePath}. Retry backup so it can be snapshotted.`);
			}
		});
		result.skippedVolatileCount = skippedVolatileCount;
		if (skippedVolatileCount > 0) opts.log?.(`Backup skipped ${skippedVolatileCount} volatile file${skippedVolatileCount === 1 ? "" : "s"} (live sessions, cron logs, queues, sockets, pid/tmp).`);
		await publishTempArchive({
			tempArchivePath: completedTempArchivePath,
			outputPath
		});
	} finally {
		for (const cleanupPath of tempArchiveCleanupPaths) await removeBackupTempArchiveBestEffort(cleanupPath);
		await node_fs_promises.default.rm(tempDir, {
			recursive: true,
			force: true
		}).catch(() => void 0);
	}
	return result;
}
//#endregion
//#region src/commands/backup.ts
const backupVerifyRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./backup-verify-CEeQHdLv.cjs")));
function loadBackupVerifyRuntime() {
	return backupVerifyRuntimeLoader.load();
}
/** Create a backup archive, optionally verify it, and emit text or JSON output. */
async function backupCreateCommand(runtime, opts = {}) {
	const result = await createBackupArchive({
		...opts,
		log: opts.log ?? (opts.json ? void 0 : (message) => runtime.log(message))
	});
	if (opts.verify && !opts.dryRun) {
		const { backupVerifyCommand } = await loadBackupVerifyRuntime();
		await backupVerifyCommand({
			...runtime,
			log: () => {}
		}, {
			archive: result.archivePath,
			json: false
		});
		result.verified = true;
	}
	if (opts.json) require_runtime.writeRuntimeJson(runtime, result);
	else runtime.log(formatBackupCreateSummary(result).join("\n"));
	return result;
}
//#endregion
//#region src/commands/migrate/item-selection.ts
/** Exact migration item selection for embedded and non-interactive callers. */
const MIGRATION_NOT_SELECTED_REASON$1 = "not selected for migration";
function formatSelectionRefList$1(values) {
	return values.length === 0 ? "none" : values.map((value) => `"${value}"`).join(", ");
}
/** Applies an exact item-id selection to planned/conflicting migration items. */
function applyMigrationItemSelection(plan, selectedItemIds) {
	if (selectedItemIds === void 0) return plan;
	const selectable = plan.items.filter((item) => item.status === "planned" || item.status === "conflict");
	const selectableIds = new Set(selectable.map((item) => item.id));
	const unknown = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(selectedItemIds).filter((id) => !selectableIds.has(id));
	if (unknown.length > 0) throw new Error(`Unknown or unavailable migration item ids: ${formatSelectionRefList$1(unknown)}.`);
	const selected = new Set(selectedItemIds);
	const items = plan.items.map((item) => selectableIds.has(item.id) && !selected.has(item.id) ? require_migration.markMigrationItemSkipped(item, MIGRATION_NOT_SELECTED_REASON$1) : item);
	return {
		...plan,
		items,
		summary: require_migration.summarizeMigrationItems(items)
	};
}
//#endregion
//#region src/commands/migrate/providers.ts
/** Migration provider lookup, option shaping, and plan creation helpers. */
/** Resolves a migration provider from the loaded plugin migration registry. */
function resolveMigrationProvider(providerId, config = require_io.getRuntimeConfig()) {
	require_migration_provider_runtime.ensureStandaloneMigrationProviderRegistryLoaded({
		cfg: config,
		providerId
	});
	const provider = require_migration_provider_runtime.resolvePluginMigrationProvider({
		providerId,
		cfg: config
	});
	if (!provider) {
		const available = require_migration_provider_runtime.resolvePluginMigrationProviders({ cfg: config }).map((entry) => entry.id);
		const suffix = available.length > 0 ? ` Available providers: ${available.join(", ")}.` : " No providers found.";
		throw new Error(`Unknown migration provider "${providerId}".${suffix}`);
	}
	return provider;
}
/** Builds provider-specific options from shared migrate CLI flags. */
function buildMigrationProviderOptions(opts, providerId = opts.provider) {
	const options = {};
	if (providerId === "codex" && opts.verifyPluginApps === true) options.verifyPluginApps = true;
	if (providerId === "codex" && opts.configPatchMode) options.configPatchMode = opts.configPatchMode;
	return Object.keys(options).length > 0 ? options : void 0;
}
/** Creates a migration plan after validating provider-specific flag support. */
async function createMigrationPlan(runtime, opts) {
	if (opts.verifyPluginApps && opts.provider !== "codex") throw new Error("--verify-plugin-apps is only supported for Codex migrations.");
	const provider = resolveMigrationProvider(opts.provider, opts.configOverride);
	const ctx = require_context.buildMigrationContext({
		source: opts.source,
		targetAgentId: opts.targetAgentId,
		itemKinds: opts.itemKinds,
		includeSecrets: opts.includeSecrets,
		overwrite: opts.overwrite,
		configOverride: opts.configOverride,
		providerOptions: buildMigrationProviderOptions(opts),
		runtime,
		json: opts.json
	});
	return await provider.plan(ctx);
}
//#endregion
//#region src/commands/migrate/selection.ts
/** Selection helpers for filtering migration plan items before apply. */
const MIGRATION_NOT_SELECTED_REASON = "not selected for migration";
const MIGRATION_SELECTION_ACCEPT = "__operator_migrate_accept_recommended__";
const MIGRATION_SELECTION_TOGGLE_ALL_ON = "__operator_migrate_toggle_all_on__";
const MIGRATION_SELECTION_TOGGLE_ALL_OFF = "__operator_migrate_toggle_all_off__";
function normalizeSelectionRef(value) {
	return value.trim().toLowerCase();
}
function readMigrationSkillName(item) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item.details?.skillName);
}
function readMigrationSkillSourceLabel(item) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item.details?.sourceLabel);
}
function readMigrationPluginName(item) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item.details?.pluginName);
}
function readMigrationPluginConfigKey(item) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item.details?.configKey);
}
function readMigrationPluginMarketplaceName(item) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item.details?.marketplaceName);
}
function migrationSkillRefs(item) {
	const skillName = readMigrationSkillName(item);
	const idSuffix = item.id.startsWith("skill:") ? item.id.slice(6) : void 0;
	const sourceBase = item.source ? node_path.default.basename(item.source) : void 0;
	const targetBase = item.target ? node_path.default.basename(item.target) : void 0;
	return [
		item.id,
		idSuffix,
		skillName,
		sourceBase,
		targetBase
	].filter((value) => typeof value === "string" && value.trim().length > 0);
}
function migrationPluginRefs(item) {
	const pluginName = readMigrationPluginName(item);
	const configKey = readMigrationPluginConfigKey(item);
	const idSuffix = item.id.startsWith("plugin:") ? item.id.slice(7) : void 0;
	const sourceBase = item.source ? node_path.default.basename(item.source) : void 0;
	const targetBase = item.target ? node_path.default.basename(item.target) : void 0;
	return [
		item.id,
		idSuffix,
		pluginName,
		configKey,
		sourceBase,
		targetBase
	].filter((value) => typeof value === "string" && value.trim().length > 0);
}
function formatSelectionRefList(values) {
	if (values.length === 0) return "none";
	return values.map((value) => `"${value}"`).join(", ");
}
function buildSelectionIndex(items, refsForItem) {
	const index = /* @__PURE__ */ new Map();
	for (const item of items) for (const ref of refsForItem(item)) {
		const normalized = normalizeSelectionRef(ref);
		if (!normalized) continue;
		const existing = index.get(normalized) ?? /* @__PURE__ */ new Set();
		existing.add(item.id);
		index.set(normalized, existing);
	}
	return index;
}
function resolveSelectedMigrationItemIds(params) {
	const index = buildSelectionIndex(params.items, params.refsForItem);
	const selectedIds = /* @__PURE__ */ new Set();
	const unknownRefs = [];
	const ambiguousRefs = [];
	for (const ref of params.selectedRefs) {
		const normalized = normalizeSelectionRef(ref);
		if (!normalized) continue;
		const matches = index.get(normalized);
		if (!matches) {
			unknownRefs.push(ref);
			continue;
		}
		if (matches.size > 1) {
			ambiguousRefs.push(ref);
			continue;
		}
		const [id] = matches;
		if (id) selectedIds.add(id);
	}
	if (unknownRefs.length > 0 || ambiguousRefs.length > 0) {
		const available = params.items.map(params.formatSelectionLabel).toSorted((a, b) => a.localeCompare(b));
		const titleKind = (0, _gabrielvfonseca_normalization_core.expectDefined)(params.kindLabel[0], "kind label entry at 0").toUpperCase() + params.kindLabel.slice(1);
		const parts = [];
		if (unknownRefs.length > 0) parts.push(`No migratable ${params.kindLabel} matched ${formatSelectionRefList(unknownRefs)}.`);
		if (ambiguousRefs.length > 0) parts.push(`${titleKind} selection ${formatSelectionRefList(ambiguousRefs)} was ambiguous.`);
		parts.push(`Available ${params.availableLabel}: ${available.length > 0 ? available.join(", ") : "none"}.`);
		throw new Error(parts.join(" "));
	}
	return selectedIds;
}
function resolveSelectedSkillItemIds(items, selectedRefs) {
	return resolveSelectedMigrationItemIds({
		items,
		selectedRefs,
		refsForItem: migrationSkillRefs,
		formatSelectionLabel: formatMigrationSkillSelectionLabel,
		kindLabel: "skill",
		availableLabel: "skills"
	});
}
function resolveSelectedPluginItemIds(items, selectedRefs) {
	return resolveSelectedMigrationItemIds({
		items,
		selectedRefs,
		refsForItem: migrationPluginRefs,
		formatSelectionLabel: formatMigrationPluginSelectionLabel,
		kindLabel: "plugin",
		availableLabel: "plugins"
	});
}
/** Returns skill copy items that can still be selected or deselected. */
function getSelectableMigrationSkillItems(plan) {
	return plan.items.filter((item) => item.kind === "skill" && item.action === "copy" && (item.status === "planned" || item.status === "conflict"));
}
/** Returns plugin install items that can still be selected or deselected. */
function getSelectableMigrationPluginItems(plan) {
	return plan.items.filter((item) => item.kind === "plugin" && item.action === "install" && (item.status === "planned" || item.status === "conflict"));
}
/** Returns the stable checkbox value for a skill migration item. */
function getMigrationSkillSelectionValue(item) {
	return item.id;
}
/** Returns the stable checkbox value for a plugin migration item. */
function getMigrationPluginSelectionValue(item) {
	return item.id;
}
/** Formats the visible label for a plugin migration checkbox. */
function formatMigrationPluginSelectionLabel(item) {
	return readMigrationPluginName(item) ?? item.id.replace(/^plugin:/u, "");
}
/** Defaults skill selection to planned items only. */
function getDefaultMigrationSkillSelectionValues(items) {
	return items.filter((item) => item.status === "planned").map(getMigrationSkillSelectionValue);
}
/** Defaults plugin selection to planned items only. */
function getDefaultMigrationPluginSelectionValues(items) {
	return items.filter((item) => item.status === "planned").map(getMigrationPluginSelectionValue);
}
/** Formats the visible label for a skill migration checkbox. */
function formatMigrationSkillSelectionLabel(item) {
	return readMigrationSkillName(item) ?? item.id.replace(/^skill:/u, "");
}
function humanizeMigrationConflictReason(reason) {
	if (!reason) return "conflict";
	return require_output.MIGRATION_CONFLICT_REASON_PHRASES[reason] ?? reason;
}
/** Formats conflict helper text for a skill migration checkbox. */
function formatMigrationSkillSelectionHint(item) {
	if (item.status !== "conflict") return;
	const sourceLabel = readMigrationSkillSourceLabel(item);
	const reason = humanizeMigrationConflictReason(item.reason);
	return sourceLabel ? `${sourceLabel} ${reason}` : reason;
}
/** Formats conflict helper text for a plugin migration checkbox. */
function formatMigrationPluginSelectionHint(item) {
	if (item.status !== "conflict") return;
	const marketplace = readMigrationPluginMarketplaceName(item);
	const reason = humanizeMigrationConflictReason(item.reason);
	return marketplace ? `${marketplace} plugin ${reason}` : reason;
}
/** Marks unselected selectable skill items as skipped and recomputes plan summary. */
function applyMigrationSelectedSkillItemIds(plan, selectedItemIds) {
	const selectableIds = new Set(getSelectableMigrationSkillItems(plan).map((item) => item.id));
	const items = plan.items.map((item) => {
		if (!selectableIds.has(item.id) || selectedItemIds.has(item.id)) return item;
		return require_migration.markMigrationItemSkipped(item, MIGRATION_NOT_SELECTED_REASON);
	});
	return {
		...plan,
		items,
		summary: require_migration.summarizeMigrationItems(items)
	};
}
/** Applies skill refs passed by CLI flags to a migration plan. */
function applyMigrationSkillSelection(plan, selectedSkillRefs) {
	if (selectedSkillRefs === void 0) return plan;
	return applyMigrationSelectedSkillItemIds(plan, resolveSelectedSkillItemIds(getSelectableMigrationSkillItems(plan), selectedSkillRefs));
}
/** Applies plugin refs passed by CLI flags to a migration plan. */
function applyMigrationPluginSelection(plan, selectedPluginRefs) {
	if (selectedPluginRefs === void 0) return plan;
	return applyMigrationSelectedPluginItemIds(plan, resolveSelectedPluginItemIds(getSelectableMigrationPluginItems(plan), selectedPluginRefs));
}
/** Marks unselected plugin items skipped and filters matching Codex plugin config writes. */
function applyMigrationSelectedPluginItemIds(plan, selectedItemIds) {
	const selectable = getSelectableMigrationPluginItems(plan);
	const selectableIds = new Set(selectable.map((item) => item.id));
	const selectedConfigKeys = new Set(selectable.filter((item) => selectedItemIds.has(item.id)).map(readMigrationPluginConfigKey).filter((value) => value !== void 0));
	const items = plan.items.map((item) => {
		if (isCodexPluginConfigItem(item)) return applyCodexPluginConfigSelection(item, selectedConfigKeys);
		if (!selectableIds.has(item.id) || selectedItemIds.has(item.id)) return item;
		return require_migration.markMigrationItemSkipped(item, MIGRATION_NOT_SELECTED_REASON);
	});
	return {
		...plan,
		items,
		summary: require_migration.summarizeMigrationItems(items)
	};
}
function isCodexPluginConfigItem(item) {
	if (item.kind !== "config" || item.action !== "merge") return false;
	const value = item.details?.value;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	const config = value.config;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config)) return false;
	const codexPlugins = config.codexPlugins;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(codexPlugins)) return false;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(codexPlugins.plugins);
}
function applyCodexPluginConfigSelection(item, selectedConfigKeys) {
	const value = item.details?.value;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return item;
	const config = value.config;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config)) return item;
	const codexPlugins = config.codexPlugins;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(codexPlugins) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(codexPlugins.plugins)) return item;
	const plugins = Object.fromEntries(Object.entries(codexPlugins.plugins).filter(([configKey]) => selectedConfigKeys.has(configKey)));
	if (Object.keys(plugins).length === 0) return require_migration.markMigrationItemSkipped(item, MIGRATION_NOT_SELECTED_REASON);
	return {
		...item,
		details: {
			...item.details,
			value: {
				...value,
				config: {
					...config,
					codexPlugins: {
						...codexPlugins,
						plugins
					}
				}
			}
		}
	};
}
function resolveInteractiveMigrationSelection(items, selectedValues, getSelectionValue) {
	const selectableIds = new Set(items.map(getSelectionValue));
	const selectedItemIds = new Set(selectedValues.filter((value) => selectableIds.has(value)));
	if (selectedItemIds.size > 0) return {
		action: "select",
		selectedItemIds
	};
	const selectedValueSet = new Set(selectedValues);
	if (selectedValueSet.has("__operator_migrate_toggle_all_off__")) return {
		action: "select",
		selectedItemIds: /* @__PURE__ */ new Set()
	};
	if (selectedValueSet.has("__operator_migrate_toggle_all_on__")) return {
		action: "select",
		selectedItemIds: selectableIds
	};
	return {
		action: "select",
		selectedItemIds
	};
}
function isMigrationSelectionToggleValue(value) {
	return value === "__operator_migrate_toggle_all_on__" || value === "__operator_migrate_toggle_all_off__";
}
function selectedMigrationItemValues(selectedValues) {
	return selectedValues.filter((value) => !isMigrationSelectionToggleValue(value));
}
function resolveMigrationSelectionBulkToggleValues(activatedValue, selectableValues) {
	if (activatedValue === "__operator_migrate_toggle_all_on__") return [MIGRATION_SELECTION_TOGGLE_ALL_ON, ...selectableValues];
	if (activatedValue === "__operator_migrate_toggle_all_off__") return [MIGRATION_SELECTION_TOGGLE_ALL_OFF];
}
/** Resolves checkbox values into selected skill migration item ids. */
function resolveInteractiveMigrationSkillSelection(items, selectedValues) {
	return resolveInteractiveMigrationSelection(items, selectedValues, getMigrationSkillSelectionValue);
}
/** Resolves checkbox values into selected plugin migration item ids. */
function resolveInteractiveMigrationPluginSelection(items, selectedValues) {
	return resolveInteractiveMigrationSelection(items, selectedValues, getMigrationPluginSelectionValue);
}
/** Reconciles all/none checkbox toggles for the skill-selection prompt. */
function reconcileInteractiveMigrationSkillToggleValues(selectedValues, activatedValue, selectableValues) {
	const bulkValues = resolveMigrationSelectionBulkToggleValues(activatedValue, selectableValues);
	if (bulkValues !== void 0) return bulkValues;
	if (activatedValue !== void 0 && selectableValues.includes(activatedValue)) return selectedMigrationItemValues(selectedValues);
	return selectedValues.filter((value) => value !== "__operator_migrate_toggle_all_on__" || !selectedValues.includes("__operator_migrate_toggle_all_off__"));
}
/** Reconciles Enter-key selection behavior for interactive migration prompts. */
function reconcileInteractiveMigrationEnterValues(selectedValues, activatedValue, selectableValues, opts = {}) {
	const bulkValues = resolveMigrationSelectionBulkToggleValues(activatedValue, selectableValues);
	if (bulkValues !== void 0) return bulkValues;
	if (activatedValue !== void 0 && selectableValues.includes(activatedValue)) {
		const selectedSelectableValues = selectedMigrationItemValues(selectedValues);
		if (opts.preserveDeselectedActivatedValue && !selectedValues.includes(activatedValue)) return selectedSelectableValues;
		return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...selectedSelectableValues, activatedValue]);
	}
	return [...selectedValues];
}
/** Reconciles keyboard shortcuts for all/none migration prompt selections. */
function reconcileInteractiveMigrationShortcutValues(previousValues, selectedValues, selectableValues, key) {
	const previousSelectable = previousValues.filter((value) => selectableValues.includes(value));
	if (key === "a" && previousSelectable.length === selectableValues.length) return [MIGRATION_SELECTION_TOGGLE_ALL_OFF];
	const selectedSelectable = selectedValues.filter((value) => selectableValues.includes(value));
	if (selectedSelectable.length === selectableValues.length) return [MIGRATION_SELECTION_TOGGLE_ALL_ON, ...selectableValues];
	if (selectedSelectable.length === 0) return [MIGRATION_SELECTION_TOGGLE_ALL_OFF];
	return selectedSelectable;
}
//#endregion
//#region src/commands/migrate/apply.ts
/** Applies migration plans with backup, filtering, reporting, and progress output. */
function shouldTreatMissingBackupAsEmptyState(error) {
	const message = error instanceof Error ? error.message : String(error);
	return message.includes("No local Operator state was found to back up") || message.includes("No Operator config file was found to back up");
}
/** Creates a verified pre-migration backup, treating absent local state as empty. */
async function createPreMigrationBackup(opts) {
	try {
		return (await backupCreateCommand({
			log() {},
			error() {},
			exit(code) {
				throw new Error(`backup exited with ${code}`);
			}
		}, {
			output: opts.output,
			verify: true
		})).archivePath;
	} catch (err) {
		if (shouldTreatMissingBackupAsEmptyState(err)) return;
		throw err;
	}
}
/** Applies the selected migration provider plan and writes the final result. */
async function runMigrationApply(params) {
	const applyMigration = async (progress) => {
		const total = (params.opts.preflightPlan ? 0 : 1) + (params.opts.noBackup ? 0 : 1) + 1;
		let completed = 0;
		const tick = () => {
			completed += 1;
			progress?.setPercent(completed / total * 100);
		};
		if (!params.opts.preflightPlan) progress?.setLabel("Preparing migration plan…");
		const preflightPlan = params.opts.preflightPlan ?? await params.provider.plan(require_context.buildMigrationContext({
			source: params.opts.source,
			targetAgentId: params.opts.targetAgentId,
			itemKinds: params.opts.itemKinds,
			includeSecrets: params.opts.includeSecrets,
			overwrite: params.opts.overwrite,
			configOverride: params.opts.configOverride,
			providerOptions: buildMigrationProviderOptions(params.opts, params.providerId),
			runtime: params.runtime,
			json: params.opts.json
		}));
		if (!params.opts.preflightPlan) tick();
		const selectedPlan = applyMigrationItemSelection(applyMigrationPluginSelection(applyMigrationSkillSelection(preflightPlan, params.opts.skills), params.opts.plugins), params.opts.itemIds);
		require_output.assertConflictFreePlan(selectedPlan, params.providerId);
		const stateDir = require_paths.resolveStateDir();
		const reportDir = require_context.buildMigrationReportDir(params.providerId, stateDir);
		if (!params.opts.noBackup) progress?.setLabel("Preparing migration backup…");
		const backupPath = params.opts.noBackup ? void 0 : await createPreMigrationBackup({ output: params.opts.backupOutput });
		if (!params.opts.noBackup) tick();
		await node_fs_promises.default.mkdir(reportDir, { recursive: true });
		const ctx = require_context.buildMigrationContext({
			source: params.opts.source,
			targetAgentId: params.opts.targetAgentId,
			itemKinds: params.opts.itemKinds,
			includeSecrets: params.opts.includeSecrets,
			overwrite: params.opts.overwrite,
			configOverride: params.opts.configOverride,
			providerOptions: buildMigrationProviderOptions(params.opts, params.providerId),
			runtime: params.runtime,
			backupPath,
			reportDir,
			json: params.opts.json
		});
		progress?.setLabel("Applying migration…");
		const result = await params.provider.apply(ctx, selectedPlan);
		tick();
		return {
			...result,
			backupPath: result.backupPath ?? backupPath,
			reportDir: result.reportDir ?? reportDir
		};
	};
	const withBackup = params.opts.json ? await applyMigration() : await require_progress.withProgress({ label: `Applying ${params.providerId} migration…` }, async (progress) => await applyMigration(progress));
	require_output.writeApplyResult(params.runtime, params.opts, withBackup);
	if (!params.opts.allowPartialResult) require_output.assertApplySucceeded(withBackup);
	return withBackup;
}
//#endregion
exports.MIGRATION_SELECTION_ACCEPT = MIGRATION_SELECTION_ACCEPT;
exports.MIGRATION_SELECTION_TOGGLE_ALL_OFF = MIGRATION_SELECTION_TOGGLE_ALL_OFF;
exports.MIGRATION_SELECTION_TOGGLE_ALL_ON = MIGRATION_SELECTION_TOGGLE_ALL_ON;
exports.applyMigrationPluginSelection = applyMigrationPluginSelection;
exports.applyMigrationSelectedPluginItemIds = applyMigrationSelectedPluginItemIds;
exports.applyMigrationSelectedSkillItemIds = applyMigrationSelectedSkillItemIds;
exports.applyMigrationSkillSelection = applyMigrationSkillSelection;
exports.createMigrationPlan = createMigrationPlan;
exports.createPreMigrationBackup = createPreMigrationBackup;
exports.formatMigrationPluginSelectionHint = formatMigrationPluginSelectionHint;
exports.formatMigrationPluginSelectionLabel = formatMigrationPluginSelectionLabel;
exports.formatMigrationSkillSelectionHint = formatMigrationSkillSelectionHint;
exports.formatMigrationSkillSelectionLabel = formatMigrationSkillSelectionLabel;
exports.getDefaultMigrationPluginSelectionValues = getDefaultMigrationPluginSelectionValues;
exports.getDefaultMigrationSkillSelectionValues = getDefaultMigrationSkillSelectionValues;
exports.getMigrationPluginSelectionValue = getMigrationPluginSelectionValue;
exports.getMigrationSkillSelectionValue = getMigrationSkillSelectionValue;
exports.getSelectableMigrationPluginItems = getSelectableMigrationPluginItems;
exports.getSelectableMigrationSkillItems = getSelectableMigrationSkillItems;
exports.reconcileInteractiveMigrationEnterValues = reconcileInteractiveMigrationEnterValues;
exports.reconcileInteractiveMigrationShortcutValues = reconcileInteractiveMigrationShortcutValues;
exports.reconcileInteractiveMigrationSkillToggleValues = reconcileInteractiveMigrationSkillToggleValues;
exports.resolveInteractiveMigrationPluginSelection = resolveInteractiveMigrationPluginSelection;
exports.resolveInteractiveMigrationSkillSelection = resolveInteractiveMigrationSkillSelection;
exports.resolveMigrationProvider = resolveMigrationProvider;
exports.runMigrationApply = runMigrationApply;
