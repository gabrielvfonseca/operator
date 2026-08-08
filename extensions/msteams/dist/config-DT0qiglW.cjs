const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_types_models = require("./types.models-BeIsgDJM.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_keyed_async_queue = require("./keyed-async-queue-BXE4i2mb.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_file_lock = require("./file-lock-BhHrzsWW.cjs");
const require_env_substitution = require("./env-substitution-CP7V8_Ov.cjs");
const require_config_env_vars = require("./config-env-vars-Cp6sSeHJ.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
require("./scan-paths-bPESVZQ5.cjs");
const require_includes = require("./includes-CvS4iKMf.cjs");
const require_nix_mode_write_guard = require("./nix-mode-write-guard-mnuDSCNv.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_async_hooks = require("node:async_hooks");
let node_util = require("node:util");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
//#region src/config/types.tools.ts
const TOOLS_BY_SENDER_KEY_TYPES = [
	"channel",
	"id",
	"e164",
	"username",
	"name"
];
function parseToolsBySenderTypedKey(rawKey) {
	const trimmed = rawKey.trim();
	if (!trimmed) return;
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	for (const type of TOOLS_BY_SENDER_KEY_TYPES) {
		const prefix = `${type}:`;
		if (!lowered.startsWith(prefix)) continue;
		return {
			type,
			value: trimmed.slice(prefix.length)
		};
	}
}
//#endregion
//#region src/config/mutate.ts
const CONFIG_MUTATION_LOCK_OPTIONS = {
	retries: {
		retries: 80,
		factor: 1.2,
		minTimeout: 25,
		maxTimeout: 250,
		randomize: true
	},
	stale: 3e4
};
const DEFAULT_CONFIG_MUTATION_RETRY_ATTEMPTS = 5;
const activeConfigMutationLocks = new node_async_hooks.AsyncLocalStorage();
const configMutationQueue = new require_keyed_async_queue.KeyedAsyncQueue();
function resolveManagedRuntimeEnvBaseline() {
	const published = require_config_env_vars.getPublishedConfigRuntimeEnvState();
	return {
		generation: published.generation,
		sourceConfig: published.sourceConfig ?? require_runtime_snapshot.getRuntimeConfigSourceSnapshot() ?? {}
	};
}
function assertManagedRuntimeEnvGeneration(generation) {
	if (require_config_env_vars.getPublishedConfigRuntimeEnvState().generation !== generation) throw new require_io.ConfigMutationConflictError("active config environment changed while preparing write", { currentHash: null });
}
function assertBaseHashMatches(snapshot, expectedHash) {
	const currentHash = require_io.resolveConfigSnapshotHash(snapshot) ?? null;
	if (expectedHash !== void 0 && expectedHash !== currentHash) throw new require_io.ConfigMutationConflictError("config changed since last load", { currentHash });
	return currentHash;
}
function assertExpectedConfigPathMatches(snapshot, expectedConfigPath) {
	if (expectedConfigPath !== void 0 && expectedConfigPath !== snapshot.path) throw new require_io.ConfigMutationConflictError("config path changed since last load", {
		currentHash: require_io.resolveConfigSnapshotHash(snapshot) ?? null,
		retryable: false
	});
}
async function withConfigMutationLock(params, fn) {
	if (params.io) return await fn();
	const configPath = node_path.default.resolve(params.lockPath ?? require_paths.resolveConfigPath());
	const activeLocks = activeConfigMutationLocks.getStore();
	if (activeLocks?.has(configPath)) return await fn();
	require_nix_mode_write_guard.assertConfigWriteAllowedInCurrentMode({ configPath });
	await node_fs_promises.default.mkdir(node_path.default.dirname(configPath), {
		recursive: true,
		mode: 448
	});
	const nextActiveLocks = new Set(activeLocks ?? []);
	nextActiveLocks.add(configPath);
	return await configMutationQueue.enqueue(configPath, () => activeConfigMutationLocks.run(nextActiveLocks, async () => await require_file_lock.withFileLock(configPath, CONFIG_MUTATION_LOCK_OPTIONS, fn)));
}
function markActiveConfigMutationPath(configPath) {
	activeConfigMutationLocks.getStore()?.add(node_path.default.resolve(configPath));
}
async function readConfigSnapshotForMutation(params) {
	const options = params.writeOptions?.skipPluginValidation ? { skipPluginValidation: true } : {};
	if (params.io) return await params.io.readConfigFileSnapshotForWrite(options);
	if (params.ownedConfigPathForWrite) {
		const ioOptions = {
			configPath: params.ownedConfigPathForWrite,
			...params.writeOptions?.skipPluginValidation ? { pluginValidation: "skip" } : {}
		};
		return await (require_runtime_snapshot.hasManagedRuntimeConfigWriteOwner(params.ownedConfigPathForWrite) ? require_io.createConfigIO({
			...ioOptions,
			env: require_config_env_vars.createConfigRuntimeEnvBase(resolveManagedRuntimeEnvBaseline().sourceConfig, process.env, { preservedKeys: require_io.GATEWAY_CONFIG_SELECTION_ENV_KEYS })
		}) : require_io.createConfigIO(ioOptions)).readConfigFileSnapshotForWrite();
	}
	return await require_io.readConfigFileSnapshotForWrite(options);
}
function createConfigMutationOwnership(prepared, writeOptions) {
	const mergedWriteOptions = {
		...prepared.writeOptions,
		...writeOptions
	};
	return {
		initialized: true,
		expectedConfigPath: mergedWriteOptions.expectedConfigPath ?? prepared.snapshot.path,
		ownedConfigPathForWrite: mergedWriteOptions.ownedConfigPathForWrite,
		assertConfigPathForWrite: mergedWriteOptions.assertConfigPathForWrite
	};
}
async function withConfigMutationSnapshotLock(params, fn) {
	let lockPath = node_path.default.resolve(params.writeOptions?.ownedConfigPathForWrite ?? require_paths.resolveConfigPath());
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const outcome = await withConfigMutationLock({ lockPath }, async () => {
			const prepared = await readConfigSnapshotForMutation({
				...params.writeOptions?.ownedConfigPathForWrite ? { ownedConfigPathForWrite: params.writeOptions.ownedConfigPathForWrite } : {},
				writeOptions: params.writeOptions
			});
			const preparedPath = node_path.default.resolve(prepared.snapshot.path);
			if (preparedPath !== lockPath) return {
				done: false,
				lockPath: preparedPath
			};
			return {
				done: true,
				value: await fn(prepared)
			};
		});
		if (outcome.done) return outcome.value;
		lockPath = outcome.lockPath;
	}
	throw new require_io.ConfigMutationConflictError("config path changed repeatedly while acquiring lock", {
		currentHash: null,
		retryable: false
	});
}
function getChangedTopLevelKeys(base, next) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(base) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next)) return (0, node_util.isDeepStrictEqual)(base, next) ? [] : ["<root>"];
	return [.../* @__PURE__ */ new Set([...Object.keys(base), ...Object.keys(next)])].filter((key) => !(0, node_util.isDeepStrictEqual)(base[key], next[key]));
}
function getSingleTopLevelIncludeTarget(params) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.snapshot.parsed)) return null;
	const authoredSection = params.snapshot.parsed[params.key];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(authoredSection)) return null;
	const keys = Object.keys(authoredSection);
	const includeValue = authoredSection[require_includes.INCLUDE_KEY];
	if (keys.length !== 1 || typeof includeValue !== "string") return null;
	const rootDir = node_path.default.dirname(params.snapshot.path);
	return node_path.default.normalize(node_path.default.isAbsolute(includeValue) ? includeValue : node_path.default.resolve(rootDir, includeValue));
}
function containsConfigIncludeDirective(value) {
	if (Array.isArray(value)) return value.some((item) => containsConfigIncludeDirective(item));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	return Object.hasOwn(value, "$include") || Object.values(value).some((item) => containsConfigIncludeDirective(item));
}
function snapshotProvesBrokenInclude(snapshot, includePath) {
	return !snapshot.valid && snapshot.issues.some((issue) => /Failed to (?:read|parse) include file:/.test(issue.message) && issue.message.includes(includePath));
}
function formatJsonFileValue(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}
function isMissingFileError(error) {
	const code = error?.code;
	return code === "ENOENT" || code === "not-found";
}
function resolveRootBoundRelativePath(target, absolutePath) {
	const relativePath = node_path.default.relative(target.root.rootReal, node_path.default.resolve(absolutePath));
	const firstSegment = relativePath.split(node_path.default.sep)[0];
	if (node_path.default.isAbsolute(relativePath) || firstSegment === "..") throw new Error(`Config include backup path escaped its approved root: ${absolutePath}`);
	return relativePath;
}
async function resolveRootBoundIncludeFile(params) {
	const absolutePath = require_includes.resolveConfigIncludeWritePath(params);
	const candidateRoots = [node_path.default.dirname(params.configPath), ...params.allowedRoots];
	for (const candidateRoot of candidateRoots) {
		const rootReal = await node_fs_promises.default.realpath(candidateRoot).catch(() => null);
		if (!rootReal || !(0, _openclaw_fs_safe_path.isPathInside)(rootReal, absolutePath)) continue;
		const relativePath = node_path.default.relative(rootReal, absolutePath);
		if (!relativePath || node_path.default.isAbsolute(relativePath) || relativePath.split(node_path.default.sep)[0] === "..") continue;
		return {
			absolutePath,
			relativePath,
			root: await (0, _openclaw_fs_safe_root.root)(rootReal, {
				hardlinks: "reject",
				mkdir: true,
				mode: 384,
				symlinks: "reject"
			})
		};
	}
	throw new Error(`Config include write path has no approved existing root: ${absolutePath}`);
}
async function resolveExpectedRootBoundIncludeFile(params) {
	let target;
	try {
		target = await resolveRootBoundIncludeFile(params);
	} catch (error) {
		if (error instanceof require_includes.ConfigIncludeError || error instanceof Error && error.message.startsWith("Config include write path has no approved existing root:")) throw new require_io.ConfigMutationConflictError("included config target changed since last load", { currentHash: null });
		throw error;
	}
	if (node_path.default.normalize(target.absolutePath) !== node_path.default.normalize(params.expectedAbsolutePath)) throw new require_io.ConfigMutationConflictError("included config target changed since last load", { currentHash: null });
	return target;
}
async function readRootBoundFileRawIfExists(target) {
	try {
		return await target.root.readText(target.relativePath);
	} catch (error) {
		if (isMissingFileError(error)) return null;
		throw error;
	}
}
async function assertRootConfigStillMatchesSnapshot(snapshot) {
	let currentRaw = null;
	try {
		currentRaw = await node_fs_promises.default.readFile(snapshot.path, "utf-8");
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
	const currentHash = require_includes.hashConfigIncludeRaw(currentRaw);
	if (currentHash !== require_includes.hashConfigIncludeRaw(snapshot.exists ? snapshot.raw ?? null : null)) throw new require_io.ConfigMutationConflictError("config changed while preparing include write", { currentHash });
}
async function rollbackJsonFileWriteIfUnchanged(params) {
	if (require_includes.hashConfigIncludeRaw(await readRootBoundFileRawIfExists(params.target)) !== params.committedHash) return false;
	if (params.previousRaw !== null) {
		await params.target.root.write(params.target.relativePath, params.previousRaw, {
			mkdir: true,
			mode: 384,
			overwrite: true
		});
		return true;
	}
	try {
		await params.target.root.remove(params.target.relativePath);
	} catch (error) {
		if (!isMissingFileError(error)) throw error;
	}
	return true;
}
function createRootBoundBackupFs(target) {
	return {
		chmod: async (filePath, mode) => {
			const opened = await target.root.open(resolveRootBoundRelativePath(target, filePath));
			try {
				await opened.handle.chmod(mode);
			} finally {
				await opened[Symbol.asyncDispose]();
			}
		},
		copyFile: async (from, to) => {
			const content = await target.root.readBytes(resolveRootBoundRelativePath(target, from));
			await target.root.write(resolveRootBoundRelativePath(target, to), content, {
				mkdir: true,
				mode: 384,
				overwrite: true
			});
		},
		readdir: async (dir) => await target.root.list(resolveRootBoundRelativePath(target, dir)),
		rename: async (from, to) => {
			await target.root.move(resolveRootBoundRelativePath(target, from), resolveRootBoundRelativePath(target, to), { overwrite: true });
		},
		unlink: async (filePath) => {
			await target.root.remove(resolveRootBoundRelativePath(target, filePath));
		}
	};
}
async function writeRootBoundJsonFile(params) {
	params.assertConfigPathForWrite();
	const targetBeforeBackup = await resolveExpectedRootBoundIncludeFile({
		configPath: params.configPath,
		includePath: params.includePath,
		allowedRoots: params.allowedRoots,
		expectedAbsolutePath: params.expectedTargetPath
	});
	if (await targetBeforeBackup.root.exists(targetBeforeBackup.relativePath)) await require_io.maintainConfigBackups(targetBeforeBackup.absolutePath, createRootBoundBackupFs(targetBeforeBackup));
	const targetAtCommit = await resolveExpectedRootBoundIncludeFile({
		configPath: params.configPath,
		includePath: params.includePath,
		allowedRoots: params.allowedRoots,
		expectedAbsolutePath: params.expectedTargetPath
	});
	params.assertConfigPathForWrite();
	await assertRootConfigStillMatchesSnapshot(params.rootSnapshot);
	const currentRaw = await readRootBoundFileRawIfExists(targetAtCommit);
	const currentHash = require_includes.hashConfigIncludeRaw(currentRaw);
	if (currentHash !== require_includes.hashConfigIncludeRaw(params.expectedRaw)) throw new require_io.ConfigMutationConflictError("included config changed while preparing write", { currentHash });
	const content = formatJsonFileValue(params.value);
	await params.preCommitRuntimePreflight?.();
	params.assertConfigPathForWrite();
	require_io.warnIfJSON5CommentsWillBeStripped({
		raw: currentRaw,
		filePath: targetAtCommit.absolutePath,
		skipOutputLogs: params.skipOutputLogs
	});
	await targetAtCommit.root.write(targetAtCommit.relativePath, content, {
		mkdir: true,
		mode: 384,
		overwrite: true
	});
	try {
		params.assertConfigPathForWrite();
	} catch (error) {
		await rollbackJsonFileWriteIfUnchanged({
			target: targetAtCommit,
			previousRaw: currentRaw,
			committedHash: require_includes.hashConfigIncludeRaw(content)
		});
		throw error;
	}
}
async function tryWriteSingleTopLevelIncludeMutation(params) {
	const nextConfig = require_io.applyUnsetPathsForWrite(params.nextConfig, require_io.resolveManagedUnsetPathsForWrite(params.writeOptions?.unsetPaths));
	const changedKeys = getChangedTopLevelKeys(params.snapshot.sourceConfig, nextConfig);
	if (changedKeys.length !== 1 || changedKeys[0] === "<root>") return null;
	const key = (0, _gabrielvfonseca_normalization_core.expectDefined)(changedKeys[0], "changed keys entry at 0");
	const includePath = getSingleTopLevelIncludeTarget({
		snapshot: params.snapshot,
		key
	});
	if (!includePath || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(nextConfig) || !(key in nextConfig)) return null;
	const nextConfigRecord = nextConfig;
	const writeEnv = params.io?.env ?? process.env;
	const allowedRoots = [];
	const expectedIncludeTarget = params.writeOptions?.includeFileTargetsForWrite?.[includePath];
	if (!expectedIncludeTarget) throw new require_io.ConfigMutationConflictError("included config target changed since last load", { currentHash: null });
	const assertConfigPathForWrite = params.writeOptions?.assertConfigPathForWrite;
	if (!assertConfigPathForWrite) return null;
	assertConfigPathForWrite();
	if (!(0, _openclaw_fs_safe_path.isPathInside)(await node_fs_promises.default.realpath(node_path.default.dirname(params.snapshot.path)), expectedIncludeTarget)) throw new Error(`Config mutation cannot update external $include target ${includePath}; edit the included file directly or move it under the config directory.`);
	const includeTarget = await resolveExpectedRootBoundIncludeFile({
		configPath: params.snapshot.path,
		includePath,
		allowedRoots,
		expectedAbsolutePath: expectedIncludeTarget
	});
	const previousIncludeRaw = await readRootBoundFileRawIfExists(includeTarget);
	const previousIncludeHash = require_includes.hashConfigIncludeRaw(previousIncludeRaw);
	const expectedIncludeHash = params.writeOptions?.includeFileHashesForWrite?.[includePath];
	if (expectedIncludeHash !== void 0 && expectedIncludeHash !== previousIncludeHash) throw new require_io.ConfigMutationConflictError("included config changed since last load", { currentHash: previousIncludeHash });
	const envForRestore = require_io.resolveWriteEnvSnapshotForPath({
		actualConfigPath: params.snapshot.path,
		expectedConfigPath: params.writeOptions?.expectedConfigPath,
		envSnapshotForRestore: params.writeOptions?.envSnapshotForRestore
	}) ?? params.io?.env ?? process.env;
	const snapshotHasBrokenInclude = snapshotProvesBrokenInclude(params.snapshot, includePath);
	if (previousIncludeRaw === null && (!snapshotHasBrokenInclude || expectedIncludeHash === void 0)) throw new require_io.ConfigMutationConflictError("included config changed since last load", { currentHash: previousIncludeHash });
	let includedValueToWrite = nextConfigRecord[key];
	if (previousIncludeRaw !== null) {
		let authoredIncludeValue;
		let parsedInclude = false;
		try {
			authoredIncludeValue = require_parse_json_compat.parseJsonWithJson5Fallback(previousIncludeRaw);
			parsedInclude = true;
		} catch {
			if (!snapshotHasBrokenInclude || expectedIncludeHash === void 0) throw new require_io.ConfigMutationConflictError("included config changed since last load", { currentHash: previousIncludeHash });
		}
		if (parsedInclude) {
			if (containsConfigIncludeDirective(authoredIncludeValue)) return null;
			const currentIncludedValue = require_env_substitution.resolveConfigEnvVars(authoredIncludeValue, envForRestore, { onMissing: () => {} });
			const snapshotIncludedValue = params.snapshot.sourceConfig[key];
			if (!(0, node_util.isDeepStrictEqual)(currentIncludedValue, snapshotIncludedValue)) throw new require_io.ConfigMutationConflictError("included config changed since last load", { currentHash: previousIncludeHash });
			includedValueToWrite = require_io.restoreEnvVarRefs(includedValueToWrite, authoredIncludeValue, envForRestore);
		}
	}
	const deferRuntimeActivation = require_runtime_snapshot.hasManagedRuntimeConfigWriteOwner(params.snapshot.path);
	const runtimeEnvBaseline = deferRuntimeActivation ? resolveManagedRuntimeEnvBaseline() : void 0;
	const runtimeCandidateEnv = runtimeEnvBaseline ? require_config_env_vars.createConfigRuntimeEnvBase(runtimeEnvBaseline.sourceConfig, process.env, { preservedKeys: require_io.GATEWAY_CONFIG_SELECTION_ENV_KEYS }) : require_config_env_vars.cloneEnvWithPlatformSemantics(writeEnv);
	const authoredRuntimeCandidate = require_io.restoreEnvVarRefs(nextConfig, params.snapshot.parsed, envForRestore);
	require_config_env_vars.applyConfigEnvVars(authoredRuntimeCandidate, runtimeCandidateEnv);
	const runtimeConfigToWrite = require_env_substitution.resolveConfigEnvVars({
		...authoredRuntimeCandidate,
		[key]: includedValueToWrite
	}, runtimeCandidateEnv, { onMissing: () => {} });
	const validated = require_io.validateConfigObjectWithPlugins(runtimeConfigToWrite, params.writeOptions?.skipPluginValidation ? { pluginValidation: "skip" } : void 0);
	if (!validated.ok) throw require_io.createInvalidConfigError(params.snapshot.path, require_io.formatInvalidConfigDetails(validated.issues));
	const runtimeConfigSnapshot = require_runtime_snapshot.getRuntimeConfigSnapshot();
	const runtimeConfigSourceSnapshot = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
	const hadRuntimeSnapshot = Boolean(runtimeConfigSnapshot);
	const hadBothSnapshots = Boolean(runtimeConfigSnapshot && runtimeConfigSourceSnapshot);
	let managedPreparedCandidates = /* @__PURE__ */ new Map();
	let runtimePreflightResult;
	if (runtimeEnvBaseline) {
		managedPreparedCandidates = await require_runtime_snapshot.preflightManagedRuntimeConfigWrite(params.snapshot.path, runtimeConfigToWrite, params.writeOptions?.runtimeRefresh);
		assertManagedRuntimeEnvGeneration(runtimeEnvBaseline.generation);
	} else runtimePreflightResult = await require_runtime_snapshot.preflightRuntimeSnapshotWrite({
		nextSourceConfig: runtimeConfigToWrite,
		refreshOptions: params.writeOptions?.runtimeRefresh,
		formatRefreshError: (error) => require_errors.formatErrorMessage(error),
		createRefreshError: (detail, cause) => new Error(`Config write blocked before committing ${includePath}: active SecretRef resolution failed: ${detail}`, { cause })
	});
	const committedIncludeHash = require_includes.hashConfigIncludeRaw(formatJsonFileValue(includedValueToWrite));
	const callerPreCommit = params.writeOptions?.preCommitRuntimePreflight;
	assertConfigPathForWrite();
	await assertRootConfigStillMatchesSnapshot(params.snapshot);
	const includeRawAtCommit = await readRootBoundFileRawIfExists(includeTarget);
	if (require_includes.hashConfigIncludeRaw(includeRawAtCommit) !== require_includes.hashConfigIncludeRaw(previousIncludeRaw)) throw new require_io.ConfigMutationConflictError("included config changed while preparing write", { currentHash: require_includes.hashConfigIncludeRaw(includeRawAtCommit) });
	await writeRootBoundJsonFile({
		configPath: params.snapshot.path,
		includePath,
		allowedRoots,
		expectedTargetPath: expectedIncludeTarget,
		value: includedValueToWrite,
		expectedRaw: includeRawAtCommit,
		rootSnapshot: params.snapshot,
		assertConfigPathForWrite,
		skipOutputLogs: params.writeOptions?.skipOutputLogs,
		preCommitRuntimePreflight: runtimeEnvBaseline || callerPreCommit ? async () => {
			if (runtimeEnvBaseline) assertManagedRuntimeEnvGeneration(runtimeEnvBaseline.generation);
			await callerPreCommit?.(runtimeConfigToWrite);
		} : void 0
	});
	const envBeforePostWriteRead = { ...writeEnv };
	let envAfterPostWriteRead = envBeforePostWriteRead;
	try {
		if (params.writeOptions?.skipRuntimeSnapshotRefresh && !hadRuntimeSnapshot && !require_runtime_snapshot.getRuntimeConfigSnapshotRefreshHandler()) return {
			persistedHash: null,
			persistedConfig: runtimeConfigToWrite
		};
		let refreshed;
		try {
			refreshed = await readConfigSnapshotForMutation({
				ownedConfigPathForWrite: params.snapshot.path,
				io: params.io,
				writeOptions: params.writeOptions
			});
		} finally {
			envAfterPostWriteRead = { ...writeEnv };
		}
		const refreshedSnapshot = refreshed.snapshot;
		assertConfigPathForWrite();
		assertExpectedConfigPathMatches(refreshedSnapshot, params.snapshot.path);
		const persistedHash = require_io.resolveConfigSnapshotHash(refreshedSnapshot);
		if (!refreshedSnapshot.valid) throw require_io.createInvalidConfigError(params.snapshot.path, require_io.formatInvalidConfigDetails(refreshedSnapshot.issues));
		if (!persistedHash) throw new Error(`Config was written to ${params.snapshot.path}, but no persisted hash was available.`);
		const notifyCommittedWrite = () => {
			const currentRuntimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
			const notificationRuntimeConfig = deferRuntimeActivation ? refreshedSnapshot.runtimeConfig : currentRuntimeConfig;
			if (!notificationRuntimeConfig) return;
			const notificationPreparedCandidates = new Map([...managedPreparedCandidates].map(([ownerId, candidate]) => [ownerId, {
				...candidate,
				runtimeConfig: candidate.reapplyRuntimeOverlays?.(refreshedSnapshot.runtimeConfig) ?? candidate.runtimeConfig,
				compareConfig: candidate.reapplyCompareOverlays?.(refreshedSnapshot.sourceConfig) ?? candidate.compareConfig
			}]));
			require_runtime_snapshot.notifyRuntimeConfigWriteListeners(require_runtime_snapshot.createRuntimeConfigWriteNotification({
				configPath: params.snapshot.path,
				sourceConfig: refreshedSnapshot.sourceConfig,
				runtimeConfig: notificationRuntimeConfig,
				persistedHash,
				afterWrite: params.afterWrite ?? params.writeOptions?.afterWrite,
				runtimeRefresh: params.writeOptions?.runtimeRefresh,
				...notificationPreparedCandidates.size > 0 ? { preparedCandidatesByOwner: notificationPreparedCandidates } : {}
			}));
		};
		await require_runtime_snapshot.finalizeRuntimeSnapshotWrite({
			nextSourceConfig: refreshedSnapshot.sourceConfig,
			refreshOptions: params.writeOptions?.runtimeRefresh,
			hadRuntimeSnapshot,
			hadBothSnapshots,
			loadFreshConfig: () => refreshedSnapshot.runtimeConfig,
			notifyCommittedWrite,
			preflightResult: runtimePreflightResult,
			deferRuntimeActivation,
			formatRefreshError: (error) => require_errors.formatErrorMessage(error),
			createRefreshError: (detail, cause) => new Error(`Config was written to ${params.snapshot.path}, but runtime snapshot refresh failed: ${detail}`, { cause })
		});
		return {
			persistedHash,
			persistedConfig: refreshedSnapshot.sourceConfig
		};
	} catch (error) {
		try {
			if (await rollbackJsonFileWriteIfUnchanged({
				target: includeTarget,
				previousRaw: includeRawAtCommit,
				committedHash: committedIncludeHash
			})) require_io.restoreEnvChangesIfUnchanged({
				env: writeEnv,
				before: envBeforePostWriteRead,
				after: envAfterPostWriteRead
			});
		} catch (rollbackError) {
			throw new Error(`${require_errors.formatErrorMessage(error)} Rollback failed: ${require_errors.formatErrorMessage(rollbackError)}`, { cause: rollbackError });
		}
		throw error;
	}
}
function resolveConfigWriteResult(result, fallbackConfig) {
	if (result) return {
		persistedHash: result.persistedHash,
		persistedConfig: result.persistedConfig
	};
	return {
		persistedHash: null,
		persistedConfig: fallbackConfig
	};
}
async function replaceConfigFile(params) {
	if (!params.snapshot && !params.io) return await withConfigMutationSnapshotLock({ writeOptions: params.writeOptions }, async (prepared) => await replaceConfigFileUnlocked({
		...params,
		snapshot: prepared.snapshot,
		writeOptions: {
			...prepared.writeOptions,
			...params.writeOptions
		}
	}));
	return await withConfigMutationLock({
		io: params.io,
		lockPath: params.snapshot?.path
	}, async () => await replaceConfigFileUnlocked(params));
}
async function replaceConfigFileUnlocked(params) {
	const { snapshot, writeOptions } = params.snapshot ? {
		snapshot: params.snapshot,
		writeOptions: params.writeOptions ?? {}
	} : await readConfigSnapshotForMutation({
		io: params.io,
		writeOptions: params.writeOptions
	});
	const mergedWriteOptions = {
		...writeOptions,
		...params.writeOptions
	};
	mergedWriteOptions.assertConfigPathForWrite?.();
	assertExpectedConfigPathMatches(snapshot, mergedWriteOptions.expectedConfigPath);
	require_nix_mode_write_guard.assertConfigWriteAllowedInCurrentMode({ configPath: snapshot.path });
	markActiveConfigMutationPath(snapshot.path);
	const previousHash = assertBaseHashMatches(snapshot, params.baseHash);
	const afterWrite = require_runtime_snapshot.resolveConfigWriteAfterWrite(params.afterWrite ?? params.writeOptions?.afterWrite);
	let writeResult = await tryWriteSingleTopLevelIncludeMutation({
		snapshot,
		nextConfig: params.nextConfig,
		afterWrite,
		writeOptions: mergedWriteOptions,
		io: params.io
	});
	if (!writeResult) {
		const fallbackWriteOptions = {
			baseSnapshot: snapshot,
			...mergedWriteOptions,
			afterWrite
		};
		const ioPreCommitRuntimePreflight = params.io ? fallbackWriteOptions.preCommitRuntimePreflight : void 0;
		if (params.io) fallbackWriteOptions.preCommitRuntimePreflight = async (sourceConfig) => {
			await require_runtime_snapshot.preflightRuntimeSnapshotWrite({
				nextSourceConfig: sourceConfig,
				refreshOptions: fallbackWriteOptions.runtimeRefresh,
				formatRefreshError: (error) => require_errors.formatErrorMessage(error),
				createRefreshError: (detail, cause) => new Error(`Config write blocked before committing ${snapshot.path}: active SecretRef resolution failed: ${detail}`, { cause })
			});
			await ioPreCommitRuntimePreflight?.(sourceConfig);
		};
		writeResult = resolveConfigWriteResult(await (params.io?.writeConfigFile ?? require_io.writeConfigFile)(params.nextConfig, fallbackWriteOptions), params.nextConfig);
	}
	return {
		path: snapshot.path,
		previousHash,
		snapshot,
		nextConfig: writeResult.persistedConfig,
		persistedHash: writeResult.persistedHash,
		afterWrite,
		followUp: require_runtime_snapshot.resolveConfigWriteFollowUp(afterWrite)
	};
}
async function commitPreparedConfigMutation(params) {
	const result = await replaceConfigFileUnlocked({
		nextConfig: params.nextConfig,
		snapshot: params.snapshot,
		baseHash: params.baseHash,
		writeOptions: {
			...params.writeOptions,
			afterWrite: params.afterWrite
		},
		io: params.io
	});
	return {
		config: result.nextConfig,
		persistedHash: result.persistedHash,
		afterWrite: result.afterWrite
	};
}
async function transformConfigFileAttempt(params, attempt, ownership, prepared) {
	ownership?.assertConfigPathForWrite?.();
	const { snapshot, writeOptions } = prepared ?? await readConfigSnapshotForMutation({
		...ownership?.ownedConfigPathForWrite ? { ownedConfigPathForWrite: ownership.ownedConfigPathForWrite } : {},
		io: params.io,
		writeOptions: params.writeOptions
	});
	let mergedWriteOptions = {
		...writeOptions,
		...params.writeOptions
	};
	if (ownership) {
		if (!ownership.initialized) {
			ownership.initialized = true;
			ownership.expectedConfigPath = mergedWriteOptions.expectedConfigPath ?? snapshot.path;
			ownership.ownedConfigPathForWrite = mergedWriteOptions.ownedConfigPathForWrite;
			ownership.assertConfigPathForWrite = mergedWriteOptions.assertConfigPathForWrite;
		}
		mergedWriteOptions = {
			...mergedWriteOptions,
			expectedConfigPath: ownership.expectedConfigPath,
			...ownership.ownedConfigPathForWrite ? { ownedConfigPathForWrite: ownership.ownedConfigPathForWrite } : {},
			...ownership.assertConfigPathForWrite ? { assertConfigPathForWrite: ownership.assertConfigPathForWrite } : {}
		};
	}
	mergedWriteOptions.assertConfigPathForWrite?.();
	assertExpectedConfigPathMatches(snapshot, mergedWriteOptions.expectedConfigPath);
	require_nix_mode_write_guard.assertConfigWriteAllowedInCurrentMode({ configPath: snapshot.path });
	markActiveConfigMutationPath(snapshot.path);
	const previousHash = assertBaseHashMatches(snapshot, params.baseHash);
	const baseConfig = params.base === "runtime" ? snapshot.runtimeConfig : snapshot.sourceConfig;
	const afterWrite = require_runtime_snapshot.resolveConfigWriteAfterWrite(params.afterWrite ?? params.writeOptions?.afterWrite);
	const transformed = await params.transform(baseConfig, {
		snapshot,
		previousHash,
		attempt
	});
	const committed = await (params.commit ?? commitPreparedConfigMutation)({
		nextConfig: transformed.nextConfig,
		snapshot,
		...previousHash !== null ? { baseHash: previousHash } : {},
		writeOptions: mergedWriteOptions,
		afterWrite,
		io: params.io
	});
	const committedAfterWrite = committed.afterWrite ?? afterWrite;
	return {
		path: snapshot.path,
		previousHash,
		snapshot,
		nextConfig: committed.config,
		persistedHash: committed.persistedHash,
		result: transformed.result,
		attempts: attempt + 1,
		afterWrite: committedAfterWrite,
		followUp: require_runtime_snapshot.resolveConfigWriteFollowUp(committedAfterWrite)
	};
}
async function transformConfigFile(params) {
	if (!params.io) return await withConfigMutationSnapshotLock({ writeOptions: params.writeOptions }, async (prepared) => await transformConfigFileAttempt(params, 0, createConfigMutationOwnership(prepared, params.writeOptions), prepared));
	return await withConfigMutationLock({ io: params.io }, async () => await transformConfigFileAttempt(params, 0));
}
async function transformConfigFileWithRetry(params) {
	const maxAttempts = params.maxAttempts ?? DEFAULT_CONFIG_MUTATION_RETRY_ATTEMPTS;
	if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new Error("Config mutation maxAttempts must be a positive integer.");
	const runWithPrepared = async (prepared) => {
		const ownership = prepared ? createConfigMutationOwnership(prepared, params.writeOptions) : {
			initialized: false,
			expectedConfigPath: ""
		};
		for (let attempt = 0; attempt < maxAttempts; attempt += 1) try {
			return await transformConfigFileAttempt(params, attempt, ownership, attempt === 0 ? prepared : void 0);
		} catch (err) {
			if (err instanceof require_io.ConfigMutationConflictError && err.retryable && attempt < maxAttempts - 1) continue;
			throw err;
		}
		throw new Error("Config mutation retry loop exhausted unexpectedly.");
	};
	if (!params.io) return await withConfigMutationSnapshotLock({ writeOptions: params.writeOptions }, runWithPrepared);
	return await withConfigMutationLock({ io: params.io }, async () => await runWithPrepared());
}
async function mutateConfigFile(params) {
	return await transformConfigFile({
		base: params.base,
		baseHash: params.baseHash,
		afterWrite: params.afterWrite,
		writeOptions: params.writeOptions,
		io: params.io,
		transform: async (currentConfig, context) => {
			const draft = structuredClone(currentConfig);
			return {
				nextConfig: draft,
				result: await params.mutate(draft, context)
			};
		}
	});
}
async function mutateConfigFileWithRetry(params) {
	return await transformConfigFileWithRetry({
		base: params.base,
		baseHash: params.baseHash,
		maxAttempts: params.maxAttempts,
		afterWrite: params.afterWrite,
		writeOptions: params.writeOptions,
		io: params.io,
		transform: async (currentConfig, context) => {
			const draft = structuredClone(currentConfig);
			return {
				nextConfig: draft,
				result: await params.mutate(draft, context)
			};
		}
	});
}
//#endregion
//#region src/config/config.ts
var config_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	CONFIG_PATH: () => require_paths.CONFIG_PATH,
	ConfigMutationConflictError: () => require_io.ConfigMutationConflictError,
	ConfigRuntimeRefreshError: () => require_io.ConfigRuntimeRefreshError,
	DEFAULT_GATEWAY_PORT: () => require_paths.DEFAULT_GATEWAY_PORT,
	DEFAULT_SECRET_PROVIDER_ALIAS: () => require_types_secrets.DEFAULT_SECRET_PROVIDER_ALIAS,
	ENV_SECRET_REF_ID_RE: () => require_types_secrets.ENV_SECRET_REF_ID_RE,
	LEGACY_DOUBLE_UNDERSCORE_ENV_MARKER_PREFIX: () => require_types_secrets.LEGACY_DOUBLE_UNDERSCORE_ENV_MARKER_PREFIX,
	LEGACY_SECRETREF_ENV_MARKER_PREFIX: () => require_types_secrets.LEGACY_SECRETREF_ENV_MARKER_PREFIX,
	MODEL_APIS: () => require_types_models.MODEL_APIS,
	MODEL_THINKING_FORMATS: () => require_types_models.MODEL_THINKING_FORMATS,
	NixModeConfigMutationError: () => require_nix_mode_write_guard.NixModeConfigMutationError,
	STATE_DIR: () => require_paths.STATE_DIR,
	TOOLS_BY_SENDER_KEY_TYPES: () => TOOLS_BY_SENDER_KEY_TYPES,
	UnresolvedSecretInputError: () => require_types_secrets.UnresolvedSecretInputError,
	applyConfigOverrides: () => require_io.applyConfigOverrides,
	assertConfigWriteAllowedInCurrentMode: () => require_nix_mode_write_guard.assertConfigWriteAllowedInCurrentMode,
	assertSecretInputResolved: () => require_types_secrets.assertSecretInputResolved,
	captureConfigOverrideApplier: () => require_io.captureConfigOverrideApplier,
	clearConfigCache: () => require_io.clearConfigCache,
	clearRuntimeConfigSnapshot: () => require_runtime_snapshot.clearRuntimeConfigSnapshot,
	coerceSecretRef: () => require_types_secrets.coerceSecretRef,
	createConfigIO: () => require_io.createConfigIO,
	getConfigOverrides: () => require_io.getConfigOverrides,
	getRuntimeConfig: () => require_io.getRuntimeConfig,
	getRuntimeConfigAppliedHash: () => require_runtime_snapshot.getRuntimeConfigAppliedHash,
	getRuntimeConfigSnapshot: () => require_runtime_snapshot.getRuntimeConfigSnapshot,
	getRuntimeConfigSnapshotMetadata: () => require_runtime_snapshot.getRuntimeConfigSnapshotMetadata,
	getRuntimeConfigSourceSnapshot: () => require_runtime_snapshot.getRuntimeConfigSourceSnapshot,
	hasConfiguredSecretInput: () => require_types_secrets.hasConfiguredSecretInput,
	hashRuntimeConfigValue: () => require_runtime_snapshot.hashRuntimeConfigValue,
	isModelThinkingFormat: () => require_types_models.isModelThinkingFormat,
	isNamedProfile: () => require_paths.isNamedProfile,
	isNixMode: () => require_paths.isNixMode,
	isPluginLocalInvalidConfigSnapshot: () => require_io.isPluginLocalInvalidConfigSnapshot,
	isPluginPackagingRuntimeOutputInvalidConfigSnapshot: () => require_io.isPluginPackagingRuntimeOutputInvalidConfigSnapshot,
	isSecretRef: () => require_types_secrets.isSecretRef,
	isUnresolvedSecretInputError: () => require_types_secrets.isUnresolvedSecretInputError,
	isValidEnvSecretRefId: () => require_types_secrets.isValidEnvSecretRefId,
	loadConfig: () => require_io.loadConfig,
	mutateConfigFile: () => mutateConfigFile,
	mutateConfigFileWithRetry: () => mutateConfigFileWithRetry,
	normalizeResolvedSecretInputString: () => require_types_secrets.normalizeResolvedSecretInputString,
	normalizeSecretInputString: () => require_types_secrets.normalizeSecretInputString,
	normalizeStateDirEnv: () => require_paths.normalizeStateDirEnv,
	parseConfigJson5: () => require_io.parseConfigJson5,
	parseEnvTemplateSecretRef: () => require_types_secrets.parseEnvTemplateSecretRef,
	parseLegacySecretRefEnvMarker: () => require_types_secrets.parseLegacySecretRefEnvMarker,
	parseToolsBySenderTypedKey: () => parseToolsBySenderTypedKey,
	pinRuntimePaths: () => require_paths.pinRuntimePaths,
	projectConfigOntoRuntimeSourceSnapshot: () => require_io.projectConfigOntoRuntimeSourceSnapshot,
	promoteConfigSnapshotToLastKnownGood: () => require_io.promoteConfigSnapshotToLastKnownGood,
	readBestEffortConfig: () => require_io.readBestEffortConfig,
	readBestEffortConfigSnapshot: () => require_io.readBestEffortConfigSnapshot,
	readConfigFileSnapshot: () => require_io.readConfigFileSnapshot,
	readConfigFileSnapshotForWrite: () => require_io.readConfigFileSnapshotForWrite,
	readConfigFileSnapshotWithPluginMetadata: () => require_io.readConfigFileSnapshotWithPluginMetadata,
	readSourceConfigBestEffort: () => require_io.readSourceConfigBestEffort,
	readSourceConfigSnapshot: () => require_io.readSourceConfigSnapshot,
	readSourceConfigSnapshotForWrite: () => require_io.readSourceConfigSnapshotForWrite,
	recoverConfigFromJsonRootSuffix: () => require_io.recoverConfigFromJsonRootSuffix,
	recoverConfigFromLastKnownGood: () => require_io.recoverConfigFromLastKnownGood,
	registerConfigWriteListener: () => require_io.registerConfigWriteListener,
	replaceConfigFile: () => replaceConfigFile,
	resetConfigOverrides: () => require_io.resetConfigOverrides,
	resetConfigRuntimeState: () => require_runtime_snapshot.resetConfigRuntimeState,
	resolveConfigPath: () => require_paths.resolveConfigPath,
	resolveConfigPathCandidate: () => require_paths.resolveConfigPathCandidate,
	resolveConfigSnapshotHash: () => require_io.resolveConfigSnapshotHash,
	resolveConfigWriteAfterWrite: () => require_runtime_snapshot.resolveConfigWriteAfterWrite,
	resolveConfigWriteFollowUp: () => require_runtime_snapshot.resolveConfigWriteFollowUp,
	resolveDefaultConfigCandidates: () => require_paths.resolveDefaultConfigCandidates,
	resolveDeliveryQueueMediaDir: () => require_paths.resolveDeliveryQueueMediaDir,
	resolveGatewayLockDir: () => require_paths.resolveGatewayLockDir,
	resolveGatewayPort: () => require_paths.resolveGatewayPort,
	resolveIncludeRoots: () => require_paths.resolveIncludeRoots,
	resolveIsNixMode: () => require_paths.resolveIsNixMode,
	resolveLegacyStateDirs: () => require_paths.resolveLegacyStateDirs,
	resolveNewStateDir: () => require_paths.resolveNewStateDir,
	resolveOAuthDir: () => require_paths.resolveOAuthDir,
	resolveOAuthPath: () => require_paths.resolveOAuthPath,
	resolveRuntimeConfigCacheKey: () => require_runtime_snapshot.resolveRuntimeConfigCacheKey,
	resolveSecretInputRef: () => require_types_secrets.resolveSecretInputRef,
	resolveSecretInputString: () => require_types_secrets.resolveSecretInputString,
	resolveStateDir: () => require_paths.resolveStateDir,
	selectApplicableRuntimeConfig: () => require_runtime_snapshot.selectApplicableRuntimeConfig,
	setAppliedRuntimeConfigSnapshot: () => require_runtime_snapshot.setAppliedRuntimeConfigSnapshot,
	setConfigOverride: () => require_io.setConfigOverride,
	setRuntimeConfigAppliedHash: () => require_runtime_snapshot.setRuntimeConfigAppliedHash,
	setRuntimeConfigSnapshot: () => require_runtime_snapshot.setRuntimeConfigSnapshot,
	setRuntimeConfigSnapshotRefreshHandler: () => require_runtime_snapshot.setRuntimeConfigSnapshotRefreshHandler,
	shouldAttemptLastKnownGoodRecovery: () => require_io.shouldAttemptLastKnownGoodRecovery,
	transformConfigFile: () => transformConfigFile,
	transformConfigFileWithRetry: () => transformConfigFileWithRetry,
	unsetConfigOverride: () => require_io.unsetConfigOverride,
	validateConfigObject: () => require_io.validateConfigObject,
	validateConfigObjectRaw: () => require_io.validateConfigObjectRaw,
	validateConfigObjectRawWithPlugins: () => require_io.validateConfigObjectRawWithPlugins,
	validateConfigObjectWithPlugins: () => require_io.validateConfigObjectWithPlugins,
	writeConfigFile: () => require_io.writeConfigFile
});
//#endregion
Object.defineProperty(exports, "config_exports", {
	enumerable: true,
	get: function() {
		return config_exports;
	}
});
Object.defineProperty(exports, "mutateConfigFileWithRetry", {
	enumerable: true,
	get: function() {
		return mutateConfigFileWithRetry;
	}
});
Object.defineProperty(exports, "parseToolsBySenderTypedKey", {
	enumerable: true,
	get: function() {
		return parseToolsBySenderTypedKey;
	}
});
Object.defineProperty(exports, "replaceConfigFile", {
	enumerable: true,
	get: function() {
		return replaceConfigFile;
	}
});
Object.defineProperty(exports, "transformConfigFileWithRetry", {
	enumerable: true,
	get: function() {
		return transformConfigFileWithRetry;
	}
});
