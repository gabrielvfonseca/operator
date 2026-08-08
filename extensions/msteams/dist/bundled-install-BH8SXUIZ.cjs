const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_schema_validator = require("./schema-validator-pDawCDK6.cjs");
require("./logger-Bw1L7SVe.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
require("./manifest-YOPvCZTp.cjs");
const require_install_safe_path = require("./install-safe-path-delEgqLr.cjs");
const require_bundle_manifest = require("./bundle-manifest-DNijUZc1.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
const require_install_security_scan = require("./install-security-scan-Dio5vohb.cjs");
const require_install_persistence = require("./install-persistence-BlOFu5Bz.cjs");
const require_frontmatter = require("./frontmatter-CVnCMs4I.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/cli/npm-resolution.ts
/** Build the npm section of a plugin install record. */
function buildNpmInstallRecordFields(params) {
	return {
		source: "npm",
		spec: params.spec,
		installPath: params.installPath,
		version: params.version,
		...require_install_source_utils.buildNpmResolutionFields(params.resolution)
	};
}
/** CLI adapter for npm install-record pinning with styled warning output. */
function resolvePinnedNpmInstallRecordForCli(rawSpec, pin, installPath, version, resolution, log, warnFormat) {
	const resolvedSpec = resolution?.resolvedSpec;
	const recordSpec = pin && resolvedSpec ? resolvedSpec : rawSpec;
	if (pin) if (resolvedSpec) log(`Pinned npm install record to ${resolvedSpec}.`);
	else log(warnFormat("Could not resolve exact npm version for --pin; storing original npm spec."));
	return buildNpmInstallRecordFields({
		spec: recordSpec,
		installPath,
		version,
		resolution
	});
}
//#endregion
//#region src/hooks/install.ts
const HOOK_MD_MAX_BYTES = 1024 * 1024;
const loadHookInstallRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./install.runtime-Dhx6MTpV.cjs")));
const HOOK_INSTALL_ERROR_CODE = {
	MISSING_OPERATOR_HOOKS: "missing_operator_hooks",
	EMPTY_OPERATOR_HOOKS: "empty_operator_hooks"
};
const defaultLogger = {};
function buildHookInstallForwardParams(params) {
	return {
		config: params.config,
		dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
		hooksDir: params.hooksDir,
		timeoutMs: params.timeoutMs,
		logger: params.logger,
		mode: params.mode,
		dryRun: params.dryRun,
		expectedHookPackId: params.expectedHookPackId,
		expectedPackageKind: params.expectedPackageKind,
		inspection: params.inspection,
		installPolicyRequest: params.installPolicyRequest
	};
}
function localHookInstallPolicySource(kind) {
	return kind === "plugin-archive" ? {
		kind: "archive",
		authority: "user",
		mutable: true,
		network: false
	} : {
		kind: "local-path",
		authority: "user",
		mutable: true,
		network: false
	};
}
async function runHookInstallScan(params) {
	try {
		const result = await params.scan();
		if (!result?.blocked) return null;
		return {
			ok: false,
			error: result.blocked.reason,
			...result.blocked.code ? { code: result.blocked.code } : {}
		};
	} catch (error) {
		return {
			ok: false,
			error: `Hook pack "${params.hookPackId}" installation blocked: install policy failed (${String(error)})`,
			code: "security_scan_failed"
		};
	}
}
async function runHookInstallPolicy(params) {
	const request = params.forward.installPolicyRequest;
	if (!request) return null;
	return await runHookInstallScan({
		hookPackId: params.hookPackId,
		scan: async () => await require_install_security_scan.scanPackageInstallSource({
			config: params.forward.config,
			dangerouslyForceUnsafeInstall: params.forward.dangerouslyForceUnsafeInstall,
			trustedSourceLinkedOfficialInstall: params.forward.trustedSourceLinkedOfficialInstall,
			packageDir: params.packageDir,
			pluginId: params.hookPackId,
			extensions: params.hookEntries,
			...params.packageName ? { packageName: params.packageName } : {},
			...params.version ? { version: params.version } : {},
			logger: params.logger,
			requestKind: request.kind,
			requestedSpecifier: request.requestedSpecifier,
			source: request.source,
			mode: params.mode
		})
	});
}
async function runHookInstalledDependencyPolicy(params) {
	const request = params.forward.installPolicyRequest;
	if (!request) return null;
	return await runHookInstallScan({
		hookPackId: params.hookPackId,
		scan: async () => await require_install_security_scan.scanInstalledPackageDependencyTree({
			config: params.forward.config,
			dangerouslyForceUnsafeInstall: params.forward.dangerouslyForceUnsafeInstall,
			trustedSourceLinkedOfficialInstall: params.forward.trustedSourceLinkedOfficialInstall,
			packageDir: params.installedDir,
			pluginId: params.hookPackId,
			logger: params.logger,
			requestKind: request.kind,
			requestedSpecifier: request.requestedSpecifier,
			source: request.source,
			mode: params.mode
		})
	});
}
function validateHookId(hookId) {
	if (!hookId) return "invalid hook name: missing";
	if (hookId === "." || hookId === "..") return "invalid hook name: reserved path segment";
	if (hookId.includes("/") || hookId.includes("\\")) return "invalid hook name: path separators not allowed";
	return null;
}
function resolveOperatorHooks(manifest) {
	const hooks = manifest[require_legacy_names.MANIFEST_KEY]?.hooks;
	if (!Array.isArray(hooks)) return {
		ok: false,
		error: "package.json missing operator.hooks",
		code: HOOK_INSTALL_ERROR_CODE.MISSING_OPERATOR_HOOKS
	};
	const list = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(hooks);
	if (list.length === 0) return {
		ok: false,
		error: "package.json operator.hooks is empty",
		code: HOOK_INSTALL_ERROR_CODE.EMPTY_OPERATOR_HOOKS
	};
	return {
		ok: true,
		entries: list
	};
}
function resolveHookPackageKind(manifest, packageKind) {
	if (packageKind) return packageKind;
	const extensions = manifest[require_legacy_names.MANIFEST_KEY]?.extensions;
	if (extensions === void 0) return "hook-only";
	return Array.isArray(extensions) && (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(extensions).length === 0 ? "hook-only" : "plugin-capable";
}
function resolveHookInstallTargetPath(id, hooksDir) {
	const result = (0, _openclaw_fs_safe_advanced.resolveSafeInstallDir)({
		baseDir: hooksDir ? require_home_dir.resolveUserPath(hooksDir) : node_path.default.join(require_utils.CONFIG_DIR, "hooks"),
		id,
		invalidNameMessage: "invalid hook name: path traversal detected"
	});
	return result.ok ? {
		ok: true,
		targetDir: result.path
	} : result;
}
async function resolveInstallTargetDir(id, hooksDir) {
	const runtime = await loadHookInstallRuntime();
	const baseHooksDir = hooksDir ? require_home_dir.resolveUserPath(hooksDir) : node_path.default.join(require_utils.CONFIG_DIR, "hooks");
	return await runtime.resolveCanonicalInstallTarget({
		baseDir: baseHooksDir,
		id,
		invalidNameMessage: "invalid hook name: path traversal detected",
		boundaryLabel: "hooks directory"
	});
}
async function resolvePreparedHookInstallTarget(params) {
	const runtime = await loadHookInstallRuntime();
	const targetDirResult = await resolveInstallTargetDir(params.id, params.hooksDir);
	if (!targetDirResult.ok) return targetDirResult;
	const targetDir = targetDirResult.targetDir;
	const effectiveMode = params.requestedMode === "update" && await runtime.fileExists(targetDir) ? "update" : "install";
	const availability = await runtime.ensureInstallTargetAvailable({
		mode: effectiveMode,
		targetDir,
		alreadyExistsError: params.alreadyExistsError(targetDir)
	});
	if (!availability.ok) return availability;
	return {
		ok: true,
		target: {
			targetDir,
			effectiveMode
		}
	};
}
async function installFromResolvedHookDir(resolvedDir, params) {
	const runtime = await loadHookInstallRuntime();
	const manifestPath = node_path.default.join(resolvedDir, "package.json");
	const packageKind = await runtime.fileExists(node_path.default.join(resolvedDir, "operator.plugin.json")) || require_bundle_manifest.detectBundleManifestFormat(resolvedDir) !== null ? "plugin-capable" : void 0;
	if (await runtime.fileExists(manifestPath)) return await installHookPackageFromDir({
		packageDir: resolvedDir,
		...packageKind ? { packageKind } : {},
		...buildHookInstallForwardParams(params)
	});
	return await installHookFromDir({
		hookDir: resolvedDir,
		...packageKind ? { packageKind } : {},
		...buildHookInstallForwardParams(params)
	});
}
async function resolveHookNameFromDir(hookDir) {
	const runtime = await loadHookInstallRuntime();
	const hookMdPath = node_path.default.join(hookDir, "HOOK.md");
	if (!await runtime.fileExists(hookMdPath)) throw new Error(`HOOK.md missing in ${hookDir}`);
	const { buffer } = await (0, _openclaw_fs_safe_advanced.readRegularFile)({
		filePath: hookMdPath,
		maxBytes: HOOK_MD_MAX_BYTES
	});
	return require_frontmatter.parseFrontmatter(buffer.toString("utf-8")).name || node_path.default.basename(hookDir);
}
async function validateHookDir(hookDir) {
	const runtime = await loadHookInstallRuntime();
	const hookMdPath = node_path.default.join(hookDir, "HOOK.md");
	if (!await runtime.fileExists(hookMdPath)) throw new Error(`HOOK.md missing in ${hookDir}`);
	const handlerCandidates = [
		"handler.ts",
		"handler.js",
		"index.ts",
		"index.js"
	];
	const handlerEntry = handlerCandidates[(await Promise.all(handlerCandidates.map(async (candidate) => runtime.fileExists(node_path.default.join(hookDir, candidate))))).findIndex(Boolean)];
	if (!handlerEntry) throw new Error(`handler.ts/handler.js/index.ts/index.js missing in ${hookDir}`);
	return { handlerEntry };
}
async function installHookPackageFromDir(params) {
	const runtime = await loadHookInstallRuntime();
	const { logger, timeoutMs, mode, dryRun } = runtime.resolveTimedInstallModeOptions(params, defaultLogger);
	const manifestPath = node_path.default.join(params.packageDir, "package.json");
	if (!await runtime.fileExists(manifestPath)) return {
		ok: false,
		error: "package.json missing"
	};
	let manifest;
	try {
		manifest = await runtime.readJsonFile(manifestPath);
	} catch (err) {
		return {
			ok: false,
			error: `invalid package.json: ${String(err)}`
		};
	}
	const hookManifest = resolveOperatorHooks(manifest);
	if (!hookManifest.ok) return hookManifest;
	const hookEntries = hookManifest.entries;
	const pkgName = typeof manifest.name === "string" ? manifest.name : "";
	const hookPackId = pkgName ? require_install_safe_path.unscopedPackageName(pkgName) : node_path.default.basename(params.packageDir);
	const packageKind = resolveHookPackageKind(manifest, params.packageKind);
	if (params.expectedPackageKind && packageKind !== params.expectedPackageKind) return {
		ok: false,
		error: `hook package kind mismatch: expected ${params.expectedPackageKind}, got ${packageKind}`
	};
	const hookIdError = validateHookId(hookPackId);
	if (hookIdError) return {
		ok: false,
		error: hookIdError
	};
	if (params.expectedHookPackId && params.expectedHookPackId !== hookPackId) return {
		ok: false,
		error: `hook pack id mismatch: expected ${params.expectedHookPackId}, got ${hookPackId}`
	};
	const resolvedHooks = [];
	for (const entry of hookEntries) {
		const hookDir = node_path.default.resolve(params.packageDir, entry);
		if (!runtime.isPathInside(params.packageDir, hookDir)) return {
			ok: false,
			error: `operator.hooks entry escapes package directory: ${entry}`
		};
		await validateHookDir(hookDir);
		if (!runtime.isPathInsideWithRealpath(params.packageDir, hookDir, { requireRealpath: true })) return {
			ok: false,
			error: `operator.hooks entry resolves outside package directory: ${entry}`
		};
		const hookName = await resolveHookNameFromDir(hookDir);
		resolvedHooks.push(hookName);
	}
	if (params.inspection === "package-kind") {
		const targetDirResult = resolveHookInstallTargetPath(hookPackId, params.hooksDir);
		if (!targetDirResult.ok) return targetDirResult;
		return {
			ok: true,
			hookPackId,
			hooks: resolvedHooks,
			packageKind,
			targetDir: targetDirResult.targetDir,
			version: typeof manifest.version === "string" ? manifest.version : void 0
		};
	}
	const preparedTarget = await resolvePreparedHookInstallTarget({
		id: hookPackId,
		hooksDir: params.hooksDir,
		requestedMode: mode,
		alreadyExistsError: (targetDir) => `hook pack already exists: ${targetDir} (delete it first)`
	});
	if (!preparedTarget.ok) return preparedTarget;
	const { targetDir, effectiveMode } = preparedTarget.target;
	const policyFailure = await runHookInstallPolicy({
		hookPackId,
		hookEntries,
		...pkgName ? { packageName: pkgName } : {},
		...typeof manifest.version === "string" ? { version: manifest.version } : {},
		packageDir: params.packageDir,
		forward: params,
		logger,
		mode: effectiveMode
	});
	if (policyFailure) return policyFailure;
	if (dryRun) return {
		ok: true,
		hookPackId,
		hooks: resolvedHooks,
		packageKind,
		targetDir,
		version: typeof manifest.version === "string" ? manifest.version : void 0
	};
	const installRes = await runtime.installPackageDirWithManifestDeps({
		sourceDir: params.packageDir,
		targetDir,
		mode: effectiveMode,
		timeoutMs,
		logger,
		copyErrorPrefix: "failed to copy hook pack",
		depsLogMessage: "Installing hook pack dependencies…",
		manifestDependencies: manifest.dependencies,
		afterInstall: async (installedDir) => {
			return await runHookInstalledDependencyPolicy({
				hookPackId,
				installedDir,
				forward: params,
				logger,
				mode: effectiveMode
			}) ?? { ok: true };
		}
	});
	if (!installRes.ok) return installRes;
	return {
		ok: true,
		hookPackId,
		hooks: resolvedHooks,
		packageKind,
		targetDir,
		version: typeof manifest.version === "string" ? manifest.version : void 0
	};
}
async function installHookFromDir(params) {
	const runtime = await loadHookInstallRuntime();
	const { logger, mode, dryRun } = runtime.resolveInstallModeOptions(params, defaultLogger);
	const { handlerEntry } = await validateHookDir(params.hookDir);
	const hookName = await resolveHookNameFromDir(params.hookDir);
	const packageKind = params.packageKind ?? "hook-only";
	if (params.expectedPackageKind && packageKind !== params.expectedPackageKind) return {
		ok: false,
		error: `hook package kind mismatch: expected ${params.expectedPackageKind}, got ${packageKind}`
	};
	const hookIdError = validateHookId(hookName);
	if (hookIdError) return {
		ok: false,
		error: hookIdError
	};
	if (params.expectedHookPackId && params.expectedHookPackId !== hookName) return {
		ok: false,
		error: `hook id mismatch: expected ${params.expectedHookPackId}, got ${hookName}`
	};
	if (params.inspection === "package-kind") {
		const targetDirResult = resolveHookInstallTargetPath(hookName, params.hooksDir);
		if (!targetDirResult.ok) return targetDirResult;
		return {
			ok: true,
			hookPackId: hookName,
			hooks: [hookName],
			packageKind,
			targetDir: targetDirResult.targetDir
		};
	}
	const preparedTarget = await resolvePreparedHookInstallTarget({
		id: hookName,
		hooksDir: params.hooksDir,
		requestedMode: mode,
		alreadyExistsError: (targetDir) => `hook already exists: ${targetDir} (delete it first)`
	});
	if (!preparedTarget.ok) return preparedTarget;
	const { targetDir, effectiveMode } = preparedTarget.target;
	const policyFailure = await runHookInstallPolicy({
		hookPackId: hookName,
		hookEntries: [handlerEntry],
		packageDir: params.hookDir,
		forward: params,
		logger,
		mode: effectiveMode
	});
	if (policyFailure) return policyFailure;
	if (dryRun) return {
		ok: true,
		hookPackId: hookName,
		hooks: [hookName],
		packageKind,
		targetDir
	};
	const installRes = await runtime.installPackageDir({
		sourceDir: params.hookDir,
		targetDir,
		mode: effectiveMode,
		timeoutMs: 12e4,
		logger,
		copyErrorPrefix: "failed to copy hook",
		hasDeps: false,
		depsLogMessage: "Installing hook dependencies…",
		afterInstall: async (installedDir) => {
			return await runHookInstalledDependencyPolicy({
				hookPackId: hookName,
				installedDir,
				forward: params,
				logger,
				mode: effectiveMode
			}) ?? { ok: true };
		}
	});
	if (!installRes.ok) return installRes;
	return {
		ok: true,
		hookPackId: hookName,
		hooks: [hookName],
		packageKind,
		targetDir
	};
}
/** Install hooks from an archive after extracting and validating the archive root. */
async function installHooksFromArchive(params) {
	const runtime = await loadHookInstallRuntime();
	const logger = params.logger ?? defaultLogger;
	const timeoutMs = params.timeoutMs ?? 12e4;
	const archivePathResult = await runtime.resolveArchiveSourcePath(params.archivePath);
	if (!archivePathResult.ok) return archivePathResult;
	const archivePath = archivePathResult.path;
	const installPolicyRequest = params.installPolicyRequest ?? {
		kind: "plugin-archive",
		requestedSpecifier: params.archivePath,
		source: localHookInstallPolicySource("plugin-archive")
	};
	return await runtime.withExtractedArchiveRoot({
		archivePath,
		tempDirPrefix: "operator-hook-",
		timeoutMs,
		logger,
		onExtracted: async (rootDir) => await installFromResolvedHookDir(rootDir, buildHookInstallForwardParams({
			...params,
			timeoutMs,
			logger,
			installPolicyRequest
		}))
	});
}
/** Download, verify, and install an npm hook pack tarball. */
async function installHooksFromNpmSpec(params) {
	const runtime = await loadHookInstallRuntime();
	const { logger, timeoutMs, mode, dryRun } = runtime.resolveTimedInstallModeOptions(params, defaultLogger);
	const spec = params.spec;
	logger.info?.(`Downloading ${spec.trim()}…`);
	return await runtime.installFromValidatedNpmSpecArchive({
		tempDirPrefix: "operator-hook-pack-",
		spec,
		timeoutMs,
		expectedIntegrity: params.expectedIntegrity,
		onIntegrityDrift: params.onIntegrityDrift,
		warn: (message) => {
			logger.warn?.(message);
		},
		installFromArchive: installHooksFromArchive,
		archiveInstallParams: buildHookInstallForwardParams({
			...params,
			timeoutMs,
			logger,
			mode,
			dryRun,
			installPolicyRequest: {
				kind: "plugin-npm",
				requestedSpecifier: spec,
				source: {
					kind: "npm",
					authority: "third-party",
					mutable: false,
					network: true
				}
			}
		})
	});
}
/** Install a hook pack or single hook from a local directory/archive path. */
async function installHooksFromPath(params) {
	const runtime = await loadHookInstallRuntime();
	const pathResult = await runtime.resolveExistingInstallPath(params.path);
	if (!pathResult.ok) return pathResult;
	const { resolvedPath: resolved, stat } = pathResult;
	const installPolicyKind = stat.isDirectory() ? "plugin-dir" : "plugin-archive";
	const forwardParams = buildHookInstallForwardParams({
		...params,
		installPolicyRequest: {
			kind: installPolicyKind,
			requestedSpecifier: params.path,
			source: localHookInstallPolicySource(installPolicyKind)
		}
	});
	if (stat.isDirectory()) return await installFromResolvedHookDir(resolved, forwardParams);
	if (!runtime.resolveArchiveKind(resolved)) return {
		ok: false,
		error: `unsupported hook file: ${resolved}`
	};
	return await installHooksFromArchive({
		archivePath: resolved,
		...forwardParams
	});
}
//#endregion
//#region src/cli/plugins-command-helpers.ts
function resolveFileNpmSpecToLocalPath(raw) {
	const trimmed = raw.trim();
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed).startsWith("file:")) return null;
	const rest = trimmed.slice(5);
	if (!rest) return {
		ok: false,
		error: "unsupported file: spec: missing path"
	};
	if (rest.startsWith("///")) return {
		ok: true,
		path: rest.slice(2)
	};
	if (rest.startsWith("//localhost/")) return {
		ok: true,
		path: rest.slice(11)
	};
	if (rest.startsWith("//")) return {
		ok: false,
		error: "unsupported file: URL host (expected \"file:<path>\" or \"file:///abs/path\")"
	};
	return {
		ok: true,
		path: rest
	};
}
function createPluginInstallLogger(runtime = require_runtime.defaultRuntime) {
	return {
		info: (msg) => runtime.log(msg),
		warn: (msg) => runtime.log(msg.includes("╭─") ? msg : require_theme.theme.warn(msg))
	};
}
function createHookPackInstallLogger(runtime = require_runtime.defaultRuntime) {
	return {
		info: (msg) => runtime.log(msg),
		warn: (msg) => runtime.log(require_theme.theme.warn(msg))
	};
}
function enableInternalHookEntries(config, hookNames) {
	const entries = { ...config.hooks?.internal?.entries };
	for (const hookName of hookNames) entries[hookName] = {
		...entries[hookName],
		enabled: true
	};
	return {
		...config,
		hooks: {
			...config.hooks,
			internal: {
				...config.hooks?.internal,
				enabled: true,
				entries
			}
		}
	};
}
function formatPluginInstallWithHookFallbackError(pluginError, hookFallback) {
	const formattedPluginError = formatPluginInstallAttemptError(pluginError);
	const formattedHookError = formatPluginInstallAttemptError(hookFallback.error);
	if (/plugin already exists: .+ \(delete it first\)/.test(pluginError)) return `${formattedPluginError}\nUse \`operator plugins update <id-or-npm-spec>\` to upgrade the tracked plugin, or rerun install with \`--force\` to replace it.`;
	if (pluginError.startsWith("Invalid extensions directory:") || pluginError === "Invalid path: must stay within extensions directory") return formattedPluginError;
	if (hookFallback.code === HOOK_INSTALL_ERROR_CODE.MISSING_OPERATOR_HOOKS) return formattedPluginError;
	return `${formattedPluginError}\nAlso not a valid hook pack: ${formattedHookError}`;
}
const MISSING_GIT_FOR_NPM_DEPENDENCY_HINT = "Git is required because one of this plugin's npm dependencies is fetched from a git URL, but `git` was not found on PATH. Install Git and rerun the install. On Windows, use `winget install --id Git.Git -e` or add a portable Git `bin` directory to PATH.";
function formatPluginInstallAttemptError(error) {
	if (!isMissingGitForNpmDependencyError(error)) return error;
	if (error.includes(MISSING_GIT_FOR_NPM_DEPENDENCY_HINT)) return error;
	return `${error}\n\n${MISSING_GIT_FOR_NPM_DEPENDENCY_HINT}`;
}
function isMissingGitForNpmDependencyError(error) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(error);
	return /\bspawn\s+git\b/u.test(normalized) && /\benoent\b/u.test(normalized);
}
function logHookPackRestartHint(runtime = require_runtime.defaultRuntime) {
	runtime.log("Restart the gateway to load hooks.");
}
function parseNpmPrefixSpec(raw) {
	const trimmed = raw.trim();
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed).startsWith("npm:")) return null;
	return trimmed.slice(4).trim();
}
function parseNpmPackPrefixPath(raw) {
	const trimmed = raw.trim();
	if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed).startsWith("npm-pack:")) return null;
	return trimmed.slice(9).trim();
}
//#endregion
//#region src/plugins/bundled-install.ts
function hasValidBundledPluginConfig(params) {
	if (!params.bundledSource.requiresConfig) return true;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.existingEntry)) return false;
	const config = params.existingEntry.config;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config)) return false;
	if (!params.bundledSource.configSchema) return Object.keys(config).length > 0;
	return require_schema_validator.validateJsonSchemaValue({
		schema: params.bundledSource.configSchema,
		cacheKey: `bundled-install:${params.bundledSource.pluginId}`,
		value: config,
		applyDefaults: true
	}).ok;
}
function prepareConfigForDisabledBundledInstall(config, pluginId) {
	const { [pluginId]: _removedEntry, ...nextEntries } = config.plugins?.entries ?? {};
	return {
		...config,
		plugins: {
			...config.plugins,
			entries: nextEntries
		}
	};
}
async function installBundledPluginSource(params) {
	const existingEntry = params.snapshot.config.plugins?.entries?.[params.bundledSource.pluginId];
	const shouldEnable = hasValidBundledPluginConfig({
		bundledSource: params.bundledSource,
		existingEntry
	});
	const configBase = shouldEnable ? params.snapshot.config : prepareConfigForDisabledBundledInstall(params.snapshot.config, params.bundledSource.pluginId);
	const configWarning = shouldEnable ? void 0 : `Installed bundled plugin "${params.bundledSource.pluginId}" without enabling it because it requires configuration first. Configure it, then run \`operator plugins enable ${params.bundledSource.pluginId}\`.`;
	const warnings = [params.warning, configWarning].filter((warning) => Boolean(warning));
	await require_install_persistence.persistPluginInstall({
		snapshot: {
			...params.snapshot,
			config: configBase
		},
		pluginId: params.bundledSource.pluginId,
		install: {
			source: "path",
			spec: params.rawSpec,
			sourcePath: params.bundledSource.localPath,
			installPath: params.bundledSource.localPath
		},
		enable: shouldEnable,
		invalidateRuntimeCache: params.invalidateRuntimeCache,
		...warnings.length > 0 ? { warningMessage: warnings.join("\n") } : {},
		runtime: params.runtime
	});
	return {
		pluginId: params.bundledSource.pluginId,
		warnings
	};
}
//#endregion
Object.defineProperty(exports, "buildNpmInstallRecordFields", {
	enumerable: true,
	get: function() {
		return buildNpmInstallRecordFields;
	}
});
Object.defineProperty(exports, "createHookPackInstallLogger", {
	enumerable: true,
	get: function() {
		return createHookPackInstallLogger;
	}
});
Object.defineProperty(exports, "createPluginInstallLogger", {
	enumerable: true,
	get: function() {
		return createPluginInstallLogger;
	}
});
Object.defineProperty(exports, "enableInternalHookEntries", {
	enumerable: true,
	get: function() {
		return enableInternalHookEntries;
	}
});
Object.defineProperty(exports, "formatPluginInstallWithHookFallbackError", {
	enumerable: true,
	get: function() {
		return formatPluginInstallWithHookFallbackError;
	}
});
Object.defineProperty(exports, "installBundledPluginSource", {
	enumerable: true,
	get: function() {
		return installBundledPluginSource;
	}
});
Object.defineProperty(exports, "installHooksFromNpmSpec", {
	enumerable: true,
	get: function() {
		return installHooksFromNpmSpec;
	}
});
Object.defineProperty(exports, "installHooksFromPath", {
	enumerable: true,
	get: function() {
		return installHooksFromPath;
	}
});
Object.defineProperty(exports, "logHookPackRestartHint", {
	enumerable: true,
	get: function() {
		return logHookPackRestartHint;
	}
});
Object.defineProperty(exports, "parseNpmPackPrefixPath", {
	enumerable: true,
	get: function() {
		return parseNpmPackPrefixPath;
	}
});
Object.defineProperty(exports, "parseNpmPrefixSpec", {
	enumerable: true,
	get: function() {
		return parseNpmPrefixSpec;
	}
});
Object.defineProperty(exports, "resolveFileNpmSpecToLocalPath", {
	enumerable: true,
	get: function() {
		return resolveFileNpmSpecToLocalPath;
	}
});
Object.defineProperty(exports, "resolvePinnedNpmInstallRecordForCli", {
	enumerable: true,
	get: function() {
		return resolvePinnedNpmInstallRecordForCli;
	}
});
