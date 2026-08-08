const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_semver = require("./semver-CcnjzT8W.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_install_safe_path = require("./install-safe-path-delEgqLr.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_managed_npm_retention = require("./managed-npm-retention-edlbaFsN.cjs");
const require_crypto_digest = require("./crypto-digest-CN6xTbP1.cjs");
const require_package_entry_resolution = require("./package-entry-resolution-VwWE-qTF.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
const require_safe_package_install = require("./safe-package-install-D1effjCo.cjs");
const require_install_security_scan = require("./install-security-scan-Dio5vohb.cjs");
const require_npm_managed_root = require("./npm-managed-root-CXgmB3C6.cjs");
const require_plugin_peer_link = require("./plugin-peer-link-X42f2Hn6.cjs");
const require_npm_integrity = require("./npm-integrity-D0RjjSoX.cjs");
const require_package_update_utils = require("./package-update-utils-BsCOfBMW.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/install-types.ts
const PLUGIN_INSTALL_ERROR_CODE = {
	INVALID_NPM_SPEC: "invalid_npm_spec",
	INVALID_MIN_HOST_VERSION: "invalid_min_host_version",
	UNKNOWN_HOST_VERSION: "unknown_host_version",
	INCOMPATIBLE_HOST_VERSION: "incompatible_host_version",
	INCOMPATIBLE_PLUGIN_API: "incompatible_plugin_api",
	INVALID_PLUGIN_API: "invalid_plugin_api",
	MISSING_OPERATOR_EXTENSIONS: "missing_operator_extensions",
	MISSING_PLUGIN_MANIFEST: "missing_plugin_manifest",
	EMPTY_OPERATOR_EXTENSIONS: "empty_operator_extensions",
	INVALID_OPERATOR_EXTENSIONS: "invalid_operator_extensions",
	NPM_METADATA_FAILURE: "npm_metadata_failure",
	NPM_PACKAGE_NOT_FOUND: "npm_package_not_found",
	PLUGIN_ID_MISMATCH: "plugin_id_mismatch",
	SECURITY_SCAN_BLOCKED: "security_scan_blocked",
	SECURITY_SCAN_FAILED: "security_scan_failed",
	UNSUPPORTED_PLAIN_FILE_PLUGIN: "unsupported_plain_file_plugin"
};
//#endregion
//#region src/plugins/security-events.ts
function pluginLifecycleAction(mode) {
	return mode === "update" ? "plugin.updated" : "plugin.installed";
}
function pluginAuditOutcomeForReason(reason) {
	return reason === "security_scan_failed" ? "error" : "denied";
}
function emitPluginInstallSecurityEvent(params) {
	require_diagnostic_events.emitTrustedSecurityEvent({
		category: "plugin",
		action: pluginLifecycleAction(params.mode),
		outcome: "success",
		severity: "medium",
		actor: { kind: "operator" },
		target: {
			kind: "plugin",
			name: params.pluginId
		},
		policy: {
			id: "plugin.install",
			decision: "allow"
		},
		control: {
			id: "plugin.install",
			family: "supply_chain"
		},
		attributes: {
			source_family: params.sourceFamily,
			mode: params.mode,
			extension_count: params.extensionCount ?? 0,
			has_version: params.hasVersion ?? false,
			trusted_official_source: params.trustedSourceLinkedOfficialInstall === true
		}
	});
}
function emitPluginAuditSecurityEvent(params) {
	require_diagnostic_events.emitTrustedSecurityEvent({
		category: "plugin",
		action: "plugin.audit.failed",
		outcome: params.outcome,
		severity: params.outcome === "error" ? "high" : "medium",
		actor: { kind: "operator" },
		target: {
			kind: "plugin",
			...params.pluginId ? { name: params.pluginId } : {}
		},
		policy: {
			id: "plugin.install",
			decision: "deny",
			reason: params.reason
		},
		control: {
			id: "plugin.install.audit",
			family: "supply_chain"
		},
		reason: params.reason,
		attributes: {
			...params.sourceFamily ? { source_family: params.sourceFamily } : {},
			...params.mode ? { mode: params.mode } : {}
		}
	});
}
//#endregion
//#region src/plugins/install-shared.ts
const pluginInstallRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./install.runtime-CKRHXtrr.cjs")));
async function loadPluginInstallRuntime() {
	return await pluginInstallRuntimeLoader.load();
}
const defaultLogger = {};
function formatUnresolvedOperatorPeerLinkError(packageName) {
	return `Installed plugin ${packageName} declares openclaw as a peer dependency, but Operator could not create a plugin-local node_modules/openclaw link. Run from a packaged Operator install or reinstall Operator, then retry.`;
}
const MISSING_EXTENSIONS_ERROR = "package.json missing operator.extensions; update the plugin package to include operator.extensions (for example [\"./dist/index.js\"]). See https://docs.operator.ai/help/troubleshooting#plugin-install-fails-with-missing-operator-extensions";
function validateOperatorPackageCompatibility(params) {
	const pluginApiRangeCheck = require_package_entry_resolution.resolvePackagePluginApiRange(params.packageMetadata);
	if (!pluginApiRangeCheck.ok) return {
		ok: false,
		error: `invalid package.json operator.compat.pluginApi: ${pluginApiRangeCheck.error}`,
		code: PLUGIN_INSTALL_ERROR_CODE.INVALID_PLUGIN_API
	};
	const pluginApiRange = pluginApiRangeCheck.range;
	if (pluginApiRange && !require_clawhub.satisfiesPluginApiRange(params.currentHostVersion, pluginApiRange)) return {
		ok: false,
		error: `plugin "${params.pluginId}" requires plugin API ${pluginApiRange}, but this Operator runtime exposes ${params.currentHostVersion}. Upgrade Operator or install a compatible plugin version and retry.`,
		code: PLUGIN_INSTALL_ERROR_CODE.INCOMPATIBLE_PLUGIN_API
	};
	return null;
}
function validateOperatorPackageInstallCompatibility(params) {
	const currentHostVersion = params.runtime.resolveCompatibilityHostVersion();
	const minHostVersionCheck = params.runtime.checkMinHostVersion({
		currentVersion: currentHostVersion,
		minHostVersion: params.packageMetadata?.install?.minHostVersion
	});
	if (!minHostVersionCheck.ok) {
		if (minHostVersionCheck.kind === "invalid") return {
			ok: false,
			error: `invalid package.json operator.install.minHostVersion: ${minHostVersionCheck.error}`,
			code: PLUGIN_INSTALL_ERROR_CODE.INVALID_MIN_HOST_VERSION
		};
		if (minHostVersionCheck.kind === "unknown_host_version") return {
			ok: false,
			error: `plugin "${params.pluginId}" requires Operator >=${minHostVersionCheck.requirement.minimumLabel}, but this host version could not be determined. Re-run from a released build or set OPERATOR_VERSION and retry.`,
			code: PLUGIN_INSTALL_ERROR_CODE.UNKNOWN_HOST_VERSION
		};
		return {
			ok: false,
			error: `plugin "${params.pluginId}" requires Operator >=${minHostVersionCheck.requirement.minimumLabel}, but this host is ${minHostVersionCheck.currentVersion}. Upgrade Operator and retry.`,
			code: PLUGIN_INSTALL_ERROR_CODE.INCOMPATIBLE_HOST_VERSION
		};
	}
	return validateOperatorPackageCompatibility({
		pluginId: params.pluginId,
		currentHostVersion,
		packageMetadata: params.packageMetadata
	});
}
async function readOptionalPackageManifest(params) {
	const manifestPath = node_path.default.join(params.packageDir, "package.json");
	if (!await params.runtime.fileExists(manifestPath)) return { ok: true };
	try {
		return {
			ok: true,
			manifest: await params.runtime.readJsonFile(manifestPath)
		};
	} catch (err) {
		return {
			ok: false,
			error: `invalid package.json: ${String(err)}`
		};
	}
}
function ensureOperatorExtensions(params) {
	const resolved = require_manifest.resolvePackageExtensionEntries(params.manifest);
	if (resolved.status === "missing") return {
		ok: false,
		error: MISSING_EXTENSIONS_ERROR,
		code: PLUGIN_INSTALL_ERROR_CODE.MISSING_OPERATOR_EXTENSIONS
	};
	if (resolved.status === "empty") return {
		ok: false,
		error: "package.json operator.extensions is empty",
		code: PLUGIN_INSTALL_ERROR_CODE.EMPTY_OPERATOR_EXTENSIONS
	};
	if (resolved.status === "invalid") return {
		ok: false,
		error: resolved.error,
		code: PLUGIN_INSTALL_ERROR_CODE.INVALID_OPERATOR_EXTENSIONS
	};
	return {
		ok: true,
		entries: resolved.entries
	};
}
function buildDirectoryInstallResult(params) {
	return {
		ok: true,
		pluginId: params.pluginId,
		targetDir: params.targetDir,
		manifestName: params.manifestName,
		version: params.version,
		extensions: params.extensions
	};
}
function emitSuccessfulPluginInstallSecurityEvent(result, params) {
	if (params.dryRun || !result.ok) return;
	emitPluginInstallSecurityEvent({
		pluginId: result.pluginId,
		mode: params.mode,
		sourceFamily: params.sourceFamily,
		extensionCount: result.extensions.length,
		hasVersion: Boolean(result.version),
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall
	});
}
function hasPackageRuntimeDependencies(manifest) {
	return Object.keys(manifest.dependencies ?? {}).length > 0 || Object.keys(manifest.optionalDependencies ?? {}).length > 0;
}
function buildBlockedInstallResult(params) {
	return {
		ok: false,
		error: params.blocked.reason,
		...params.blocked.code === "security_scan_failed" ? { code: PLUGIN_INSTALL_ERROR_CODE.SECURITY_SCAN_FAILED } : params.blocked.code === "security_scan_blocked" ? { code: PLUGIN_INSTALL_ERROR_CODE.SECURITY_SCAN_BLOCKED } : {}
	};
}
function sourceFamilyForInstallPolicyKind(kind, fallback) {
	switch (kind) {
		case "plugin-archive": return "archive";
		case "plugin-dir": return "directory";
		case "plugin-git": return "git";
		case "plugin-npm": return "npm";
		case void 0: return fallback;
	}
	return fallback;
}
function sourceFamilyForInstallPolicySource(source, fallback) {
	switch (source?.kind) {
		case "archive": return "archive";
		case "file": return "file";
		case "git": return "git";
		case "npm": return "npm";
		case "bundled":
		case "clawhub":
		case "local-path":
		case "managed":
		case "upload":
		case "workspace":
		case void 0: return fallback;
	}
	return fallback;
}
async function ensureInstallTargetAvailableForMode(params) {
	return await params.runtime.ensureInstallTargetAvailable({
		mode: params.mode,
		targetDir: params.targetPath,
		alreadyExistsError: `plugin already exists: ${params.targetPath} (delete it first)`
	});
}
async function resolvePreparedDirectoryInstallTarget(params) {
	const targetDirResult = await resolvePluginInstallTarget({
		runtime: params.runtime,
		pluginId: params.pluginId,
		extensionsDir: params.extensionsDir,
		nameEncoder: params.nameEncoder
	});
	if (!targetDirResult.ok) return targetDirResult;
	return {
		ok: true,
		target: {
			targetPath: targetDirResult.targetDir,
			effectiveMode: await resolveEffectiveInstallMode({
				runtime: params.runtime,
				requestedMode: params.requestedMode,
				targetPath: targetDirResult.targetDir
			})
		}
	};
}
async function runInstallSourceScan(params) {
	try {
		const scanResult = await params.scan();
		if (scanResult?.blocked) {
			const reason = scanResult.blocked.code === "security_scan_failed" ? "security_scan_failed" : "security_scan_blocked";
			emitPluginAuditSecurityEvent({
				outcome: pluginAuditOutcomeForReason(reason),
				reason,
				pluginId: params.pluginId,
				mode: params.mode,
				sourceFamily: params.sourceFamily
			});
			return buildBlockedInstallResult({ blocked: scanResult.blocked });
		}
		return null;
	} catch (err) {
		emitPluginAuditSecurityEvent({
			outcome: "error",
			reason: "security_scan_failed",
			pluginId: params.pluginId,
			mode: params.mode,
			sourceFamily: params.sourceFamily
		});
		return {
			ok: false,
			error: `${params.subject} installation blocked: code safety scan failed (${String(err)}). Run "openclaw security audit --deep" for details.`,
			code: PLUGIN_INSTALL_ERROR_CODE.SECURITY_SCAN_FAILED
		};
	}
}
async function installPluginDirectoryIntoExtensions(params) {
	const runtime = await loadPluginInstallRuntime();
	let targetDir = params.targetDir;
	if (!targetDir) {
		const targetDirResult = await resolvePluginInstallTarget({
			runtime,
			pluginId: params.pluginId,
			extensionsDir: params.extensionsDir,
			nameEncoder: params.nameEncoder
		});
		if (!targetDirResult.ok) return {
			ok: false,
			error: targetDirResult.error
		};
		targetDir = targetDirResult.targetDir;
	}
	const availability = await ensureInstallTargetAvailableForMode({
		runtime,
		targetPath: targetDir,
		mode: params.mode
	});
	if (!availability.ok) return availability;
	if (params.dryRun) return buildDirectoryInstallResult({
		pluginId: params.pluginId,
		targetDir,
		manifestName: params.manifestName,
		version: params.version,
		extensions: params.extensions
	});
	const installRes = await runtime.installPackageDir({
		sourceDir: params.sourceDir,
		targetDir,
		mode: params.mode,
		timeoutMs: params.timeoutMs,
		logger: params.logger,
		copyErrorPrefix: params.copyErrorPrefix,
		hasDeps: params.hasDeps,
		sourceHardlinks: params.sourceHardlinks ?? "reject",
		depsLogMessage: params.depsLogMessage,
		afterCopy: params.afterCopy,
		afterInstall: async (installedDir) => {
			const postInstallResult = await params.afterInstall?.(installedDir);
			if (!postInstallResult) return { ok: true };
			return {
				ok: false,
				error: postInstallResult.error,
				...postInstallResult.code ? { code: postInstallResult.code } : {}
			};
		}
	});
	if (!installRes.ok) return {
		ok: false,
		error: installRes.error,
		...installRes.code ? { code: installRes.code } : {}
	};
	return buildDirectoryInstallResult({
		pluginId: params.pluginId,
		targetDir,
		manifestName: params.manifestName,
		version: params.version,
		extensions: params.extensions
	});
}
async function resolvePluginInstallTarget(params) {
	const extensionsDir = params.extensionsDir ? require_home_dir.resolveUserPath(params.extensionsDir) : require_install_paths.resolveDefaultPluginExtensionsDir();
	return await params.runtime.resolveCanonicalInstallTarget({
		baseDir: extensionsDir,
		id: params.pluginId,
		invalidNameMessage: "invalid plugin name: path traversal detected",
		boundaryLabel: "extensions directory",
		nameEncoder: params.nameEncoder
	});
}
async function resolveEffectiveInstallMode(params) {
	if (params.requestedMode !== "update") return "install";
	return await params.runtime.fileExists(params.targetPath) ? "update" : "install";
}
//#endregion
//#region src/plugins/install-installed-package.ts
async function validatePackagePluginInstallSource(params) {
	const manifestPath = node_path.default.join(params.packageDir, "package.json");
	if (!await params.runtime.fileExists(manifestPath)) return {
		ok: false,
		error: "extracted package missing package.json"
	};
	let manifest;
	try {
		manifest = await params.runtime.readJsonFile(manifestPath);
	} catch (err) {
		return {
			ok: false,
			error: `invalid package.json: ${String(err)}`
		};
	}
	const pkgName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest.name) ?? "";
	const npmPluginId = pkgName || "plugin";
	const ocManifestResult = params.runtime.loadPluginManifest(params.packageDir);
	if (!ocManifestResult.ok && params.requirePluginManifest) return {
		ok: false,
		error: `package missing valid operator.plugin.json: ${ocManifestResult.error}`,
		code: PLUGIN_INSTALL_ERROR_CODE.MISSING_PLUGIN_MANIFEST
	};
	const manifestPluginId = ocManifestResult.ok && ocManifestResult.manifest.id ? ocManifestResult.manifest.id.trim() : void 0;
	const pluginId = manifestPluginId ?? npmPluginId;
	const pluginIdError = require_install_paths.validatePluginId(pluginId);
	if (pluginIdError) return {
		ok: false,
		error: pluginIdError
	};
	if (!require_install_paths.matchesExpectedPluginId({
		expectedPluginId: params.expectedPluginId,
		pluginId,
		manifestPluginId,
		npmPluginId
	})) return {
		ok: false,
		error: `plugin id mismatch: expected ${params.expectedPluginId}, got ${pluginId}`,
		code: PLUGIN_INSTALL_ERROR_CODE.PLUGIN_ID_MISMATCH
	};
	if (manifestPluginId && !require_install_safe_path.packageNameMatchesId(npmPluginId, manifestPluginId)) params.logger.info?.(`Plugin manifest id "${manifestPluginId}" differs from npm package name "${npmPluginId}"; using manifest id as the config key.`);
	const packageMetadata = params.runtime.getPackageManifestMetadata(manifest);
	const compatibilityError = validateOperatorPackageInstallCompatibility({
		runtime: params.runtime,
		pluginId,
		packageMetadata
	});
	if (compatibilityError) return compatibilityError;
	const extensionsResult = ensureOperatorExtensions({ manifest });
	if (!extensionsResult.ok) return {
		ok: false,
		error: extensionsResult.error,
		code: extensionsResult.code
	};
	const extensions = extensionsResult.entries;
	const extensionValidation = await require_package_entry_resolution.validatePackageExtensionEntriesForInstall({
		packageDir: params.packageDir,
		extensions,
		manifest,
		allowSourceTypeScriptEntries: params.allowSourceTypeScriptEntries
	});
	if (!extensionValidation.ok) return {
		ok: false,
		error: extensionValidation.error,
		code: PLUGIN_INSTALL_ERROR_CODE.INVALID_OPERATOR_EXTENSIONS
	};
	const scanMode = params.resolveEffectiveMode ? await params.resolveEffectiveMode(pluginId) : params.mode;
	const scanResult = await runInstallSourceScan({
		subject: `Plugin "${pluginId}"`,
		pluginId,
		mode: scanMode,
		sourceFamily: sourceFamilyForInstallPolicySource(params.installPolicyRequest?.source, sourceFamilyForInstallPolicyKind(params.installPolicyRequest?.kind, "installed-package")),
		scan: async () => await params.runtime.scanPackageInstallSource({
			dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
			trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
			packageDir: params.packageDir,
			config: params.config,
			pluginId,
			logger: params.logger,
			extensions,
			...packageMetadata ? { packageMetadata } : {},
			requestKind: params.installPolicyRequest?.kind,
			requestedSpecifier: params.installPolicyRequest?.requestedSpecifier,
			source: params.installPolicyRequest?.source,
			mode: scanMode,
			packageName: pkgName || void 0,
			manifestId: manifestPluginId,
			version: typeof manifest.version === "string" ? manifest.version : void 0
		})
	});
	if (scanResult) return scanResult;
	return {
		ok: true,
		plugin: {
			manifest,
			pluginId,
			manifestName: pkgName || void 0,
			version: typeof manifest.version === "string" ? manifest.version : void 0,
			extensions,
			hasRuntimeDependencies: hasPackageRuntimeDependencies(manifest),
			peerDependencies: manifest.peerDependencies ?? {}
		}
	};
}
async function scanAndLinkInstalledPackage(params) {
	const scanResult = await runInstallSourceScan({
		subject: `Plugin "${params.pluginId}"`,
		pluginId: params.pluginId,
		mode: params.mode,
		sourceFamily: sourceFamilyForInstallPolicySource(params.source, sourceFamilyForInstallPolicyKind(params.requestKind, "installed-package")),
		scan: async () => await params.runtime.scanInstalledPackageDependencyTree({
			...params.additionalDependencyPackageDirs ? { additionalPackageDirs: params.additionalDependencyPackageDirs } : {},
			allowManagedNpmRootPackagePeerSymlinks: params.dependencyScanRootDir !== void 0 && node_path.default.resolve(params.dependencyScanRootDir) !== node_path.default.resolve(params.installedDir),
			dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
			dependencyScanRootDir: params.dependencyScanRootDir,
			logger: params.logger,
			mode: params.mode,
			packageDir: params.installedDir,
			pluginId: params.pluginId,
			config: params.config,
			...params.requestKind ? { requestKind: params.requestKind } : {},
			requestedSpecifier: params.requestedSpecifier,
			source: params.source,
			trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall
		})
	});
	if (scanResult) return scanResult;
	if ((await require_plugin_peer_link.linkOperatorPeerDependencies({
		installedDir: params.installedDir,
		peerDependencies: params.peerDependencies,
		logger: params.logger
	})).skipped > 0) return {
		ok: false,
		error: formatUnresolvedOperatorPeerLinkError(params.pluginId)
	};
	return null;
}
async function installPluginFromInstalledPackageDir(params) {
	return await installPluginFromInstalledPackageDirInternal(params);
}
async function installPluginFromInstalledPackageDirInternal(params) {
	const runtime = await loadPluginInstallRuntime();
	const { logger } = runtime.resolveTimedInstallModeOptions(params, defaultLogger);
	const validated = await validatePackagePluginInstallSource({
		runtime,
		packageDir: params.packageDir,
		expectedPluginId: params.expectedPluginId,
		requirePluginManifest: params.requirePluginManifest,
		allowSourceTypeScriptEntries: params.allowSourceTypeScriptEntries,
		dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
		config: params.config,
		installPolicyRequest: params.installPolicyRequest,
		logger,
		mode: params.mode ?? "install"
	});
	if (!validated.ok) return validated;
	const postInstallError = await scanAndLinkInstalledPackage({
		runtime,
		installedDir: params.packageDir,
		...params.additionalDependencyPackageDirs ? { additionalDependencyPackageDirs: params.additionalDependencyPackageDirs } : {},
		dependencyScanRootDir: params.dependencyScanRootDir,
		pluginId: validated.plugin.pluginId,
		peerDependencies: validated.plugin.peerDependencies,
		dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
		config: params.config,
		mode: params.mode ?? "install",
		...params.installPolicyRequest?.kind ? { requestKind: params.installPolicyRequest.kind } : {},
		requestedSpecifier: params.installPolicyRequest?.requestedSpecifier,
		source: params.installPolicyRequest?.source,
		logger
	});
	if (postInstallError) return postInstallError;
	const result = buildDirectoryInstallResult({
		pluginId: validated.plugin.pluginId,
		targetDir: params.packageDir,
		manifestName: validated.plugin.manifestName,
		version: validated.plugin.version,
		extensions: validated.plugin.extensions
	});
	if (params.emitSuccessSecurityEvent !== false) emitSuccessfulPluginInstallSecurityEvent(result, {
		dryRun: params.dryRun,
		mode: params.mode ?? "install",
		sourceFamily: sourceFamilyForInstallPolicyKind(params.installPolicyRequest?.kind, "installed-package"),
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall
	});
	return result;
}
//#endregion
//#region src/plugins/install-managed-npm-state.ts
const rollbackSnapshotCopyMode = node_fs.constants.COPYFILE_FICLONE;
const MANAGED_NPM_PROJECT_QUARANTINE_DIR = "_operator-quarantined-npm-projects";
const MANAGED_NPM_PROJECT_REBUILD_ARTIFACTS = [
	"node_modules",
	"package-lock.json",
	"npm-shrinkwrap.json"
];
function isNpmAliasOverrideComparatorError(result) {
	return `${result.stderr}\n${result.stdout}`.includes("Invalid comparator: npm:");
}
async function rollbackManagedNpmPluginInstall(params) {
	if (params.snapshot) {
		try {
			await restoreManagedNpmPluginInstallRollbackSnapshot({
				npmRoot: params.npmRoot,
				snapshot: params.snapshot
			});
			await require_plugin_peer_link.relinkOperatorPeerDependenciesInManagedNpmRoot({
				npmRoot: params.npmRoot,
				logger: params.logger
			});
		} catch (error) {
			params.logger.warn?.(`Failed to restore managed npm plugin root after installing ${params.packageName}: ${String(error)}`);
		}
		return;
	}
	try {
		await require_exec.runCommandWithTimeout([
			"npm",
			"uninstall",
			"--loglevel=error",
			"--legacy-peer-deps",
			"--ignore-scripts",
			"--no-audit",
			"--no-fund",
			params.packageName
		], {
			cwd: params.npmRoot,
			timeoutMs: Math.max(params.timeoutMs, 3e5),
			env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
				legacyPeerDeps: true,
				npmConfigCwd: params.npmRoot,
				packageLock: true,
				quiet: true
			})
		});
	} catch (error) {
		params.logger.warn?.(`Failed to run npm uninstall rollback for ${params.packageName}: ${String(error)}`);
	}
	try {
		await node_fs_promises.default.rm(params.targetDir, {
			recursive: true,
			force: true
		});
	} catch (error) {
		params.logger.warn?.(`Failed to remove failed plugin install directory ${params.targetDir}: ${String(error)}`);
	}
	try {
		await require_npm_managed_root.removeManagedNpmRootDependency({
			npmRoot: params.npmRoot,
			packageName: params.packageName
		});
	} catch (error) {
		params.logger.warn?.(`Failed to remove managed npm dependency ${params.packageName}: ${String(error)}`);
	}
	if (params.peerDependencySnapshot) try {
		const preRestorePeerDependencySnapshot = await require_npm_managed_root.readManagedNpmRootPeerDependencySnapshot({ npmRoot: params.npmRoot });
		const restoredPeerDependencyNames = new Set(params.peerDependencySnapshot.managedPeerDependencies);
		const addedPeerDependencyNames = preRestorePeerDependencySnapshot.managedPeerDependencies.filter((packageName) => !restoredPeerDependencyNames.has(packageName));
		await require_npm_managed_root.restoreManagedNpmRootPeerDependencySnapshot({
			npmRoot: params.npmRoot,
			snapshot: params.peerDependencySnapshot
		});
		const cleanupResult = await require_exec.runCommandWithTimeout([
			"npm",
			"install",
			"--omit=dev",
			"--omit=peer",
			"--loglevel=error",
			"--legacy-peer-deps",
			"--ignore-scripts",
			"--no-audit",
			"--no-fund"
		], {
			cwd: params.npmRoot,
			timeoutMs: Math.max(params.timeoutMs, 3e5),
			env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
				legacyPeerDeps: true,
				npmConfigCwd: params.npmRoot,
				packageLock: true,
				quiet: true
			})
		});
		if (cleanupResult.code !== 0) {
			params.logger.warn?.(`npm install cleanup after rollback for ${params.packageName} exited ${cleanupResult.code}: ${cleanupResult.stderr.trim() || cleanupResult.stdout.trim()}`);
			await Promise.all(addedPeerDependencyNames.map(async (packageName) => {
				try {
					await node_fs_promises.default.rm(resolveManagedNpmRootPackageDir(params.npmRoot, packageName), {
						recursive: true,
						force: true
					});
				} catch (error) {
					params.logger.warn?.(`Failed to remove rolled-back managed peer dependency ${packageName}: ${String(error)}`);
				}
			}));
		}
	} catch (error) {
		params.logger.warn?.(`Failed to restore managed npm peer dependencies after rollback for ${params.packageName}: ${String(error)}`);
	}
	if (params.packageName !== "@gabrielvfonseca/operator") try {
		await require_npm_managed_root.repairManagedNpmRootOperatorPeer({
			npmRoot: params.npmRoot,
			timeoutMs: params.timeoutMs,
			logger: params.logger
		});
	} catch (error) {
		params.logger.warn?.(`Failed to repair managed npm openclaw peer after rollback: ${String(error)}`);
	}
	try {
		await require_plugin_peer_link.relinkOperatorPeerDependenciesInManagedNpmRoot({
			npmRoot: params.npmRoot,
			logger: params.logger
		});
	} catch (error) {
		params.logger.warn?.(`Failed to repair managed npm peer links after rollback for ${params.packageName}: ${String(error)}`);
	}
}
async function resolveManagedNpmRootDependencySpecForInstall(params) {
	if (params.prepareDependencySpec) try {
		return await params.prepareDependencySpec({ npmRoot: params.npmRoot });
	} catch (error) {
		return {
			ok: false,
			error: `Failed to prepare managed npm dependency for ${params.packageName}: ${String(error)}`
		};
	}
	if (params.dependencySpec === void 0) return {
		ok: false,
		error: `missing managed npm dependency spec for ${params.packageName}`
	};
	return {
		ok: true,
		dependencySpec: params.dependencySpec
	};
}
async function rollbackManagedNpmRootPreparedDependency(params) {
	if (!params.preparedDependency.rollback) return;
	try {
		await params.preparedDependency.rollback();
	} catch (error) {
		params.logger.warn?.(`Failed to roll back prepared managed npm dependency artifacts for ${params.packageName}: ${String(error)}`);
	}
}
async function cleanupManagedNpmRootPreparedDependency(params) {
	if (!params.preparedDependency?.cleanup) return;
	try {
		await params.preparedDependency.cleanup();
	} catch (error) {
		params.logger.warn?.(`Failed to clean up prepared managed npm dependency artifacts for ${params.packageName}: ${String(error)}`);
	}
}
async function removeEmptyDirectoryIfPresent(dir) {
	try {
		await node_fs_promises.default.rmdir(dir);
	} catch (error) {
		if (![
			"ENOENT",
			"ENOTEMPTY",
			"EEXIST"
		].includes(error.code ?? "")) throw error;
	}
}
async function readRollbackFileIfPresent(filePath) {
	try {
		return await node_fs_promises.default.readFile(filePath, "utf8");
	} catch (error) {
		if (error.code === "ENOENT") return;
		throw error;
	}
}
async function writeOrRemoveRollbackFile(filePath, contents) {
	if (contents === void 0) {
		await node_fs_promises.default.rm(filePath, { force: true });
		return;
	}
	await node_fs_promises.default.mkdir(node_path.default.dirname(filePath), { recursive: true });
	await node_fs_promises.default.writeFile(filePath, contents, "utf8");
}
async function createManagedNpmPluginInstallRollbackSnapshot(params) {
	const tempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-npm-plugin-rollback-"));
	let nodeModulesBackupDir;
	const nodeModulesDir = node_path.default.join(params.npmRoot, "node_modules");
	try {
		await node_fs_promises.default.stat(nodeModulesDir);
		nodeModulesBackupDir = node_path.default.join(tempDir, "node_modules");
		await node_fs_promises.default.cp(nodeModulesDir, nodeModulesBackupDir, {
			recursive: true,
			force: true,
			filter: (sourcePath) => shouldCopyManagedNpmRollbackSnapshotEntry({
				nodeModulesDir,
				sourcePath
			}),
			mode: rollbackSnapshotCopyMode,
			verbatimSymlinks: true
		});
	} catch (error) {
		if (error.code !== "ENOENT") {
			await node_fs_promises.default.rm(tempDir, {
				recursive: true,
				force: true
			});
			throw error;
		}
	}
	try {
		return {
			packageJson: await readRollbackFileIfPresent(node_path.default.join(params.npmRoot, "package.json")),
			packageLockJson: await readRollbackFileIfPresent(node_path.default.join(params.npmRoot, "package-lock.json")),
			...nodeModulesBackupDir ? { nodeModulesBackupDir } : {},
			tempDir
		};
	} catch (error) {
		await node_fs_promises.default.rm(tempDir, {
			recursive: true,
			force: true
		});
		throw error;
	}
}
async function shouldCopyManagedNpmRollbackSnapshotEntry(params) {
	if (typeof params.sourcePath !== "string") return true;
	const relativeParts = node_path.default.relative(params.nodeModulesDir, params.sourcePath).split(node_path.default.sep);
	if (!(relativeParts.length === 3 && relativeParts[1] === "node_modules" && relativeParts[2] === "@gabrielvfonseca/operator" || relativeParts.length === 4 && relativeParts[0]?.startsWith("@") && relativeParts[2] === "node_modules" && relativeParts[3] === "@gabrielvfonseca/operator")) return true;
	try {
		return !(await node_fs_promises.default.lstat(params.sourcePath)).isSymbolicLink();
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}
async function restoreManagedNpmPluginInstallRollbackSnapshot(params) {
	const nodeModulesDir = node_path.default.join(params.npmRoot, "node_modules");
	await node_fs_promises.default.rm(nodeModulesDir, {
		recursive: true,
		force: true
	});
	if (params.snapshot.nodeModulesBackupDir) {
		await node_fs_promises.default.mkdir(params.npmRoot, { recursive: true });
		await node_fs_promises.default.cp(params.snapshot.nodeModulesBackupDir, nodeModulesDir, {
			recursive: true,
			force: true,
			mode: rollbackSnapshotCopyMode,
			verbatimSymlinks: true
		});
	}
	await writeOrRemoveRollbackFile(node_path.default.join(params.npmRoot, "package.json"), params.snapshot.packageJson);
	await writeOrRemoveRollbackFile(node_path.default.join(params.npmRoot, "package-lock.json"), params.snapshot.packageLockJson);
}
async function cleanupManagedNpmPluginInstallRollbackSnapshot(params) {
	if (!params.snapshot) return;
	try {
		await node_fs_promises.default.rm(params.snapshot.tempDir, {
			recursive: true,
			force: true
		});
	} catch (error) {
		params.logger.warn?.(`Failed to remove temporary managed npm rollback snapshot ${params.snapshot.tempDir}: ${String(error)}`);
	}
}
function formatNpmCommandFailureOutput(result) {
	return result.stderr.trim() || result.stdout.trim();
}
function isManagedNpmProjectCorruptionInstallFailure(result) {
	const output = `${result.stderr}\n${result.stdout}`;
	return output.includes("ERR_INVALID_ARG_TYPE") && output.includes("\"from\" argument") && output.includes("Received undefined");
}
function formatManagedNpmProjectQuarantineArtifacts(artifactNames) {
	return artifactNames.length > 0 ? artifactNames.join(", ") : "no rebuild artifacts";
}
async function quarantineManagedNpmProjectRebuildArtifacts(params) {
	await node_fs_promises.default.mkdir(params.npmRoot, { recursive: true });
	const quarantineParent = node_path.default.join(params.npmRoot, MANAGED_NPM_PROJECT_QUARANTINE_DIR);
	await node_fs_promises.default.mkdir(quarantineParent, { recursive: true });
	const quarantineDir = await node_fs_promises.default.mkdtemp(node_path.default.join(quarantineParent, "corrupt-"));
	const movedArtifactNames = [];
	for (const artifactName of MANAGED_NPM_PROJECT_REBUILD_ARTIFACTS) {
		const source = node_path.default.join(params.npmRoot, artifactName);
		try {
			await node_fs_promises.default.rename(source, node_path.default.join(quarantineDir, artifactName));
			movedArtifactNames.push(artifactName);
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
	}
	return {
		quarantineDir,
		movedArtifactNames
	};
}
async function listManagedNpmRootPackageNames(npmRoot) {
	const nodeModulesDir = node_path.default.join(npmRoot, "node_modules");
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(nodeModulesDir, { withFileTypes: true });
	} catch (error) {
		if (error.code === "ENOENT") return /* @__PURE__ */ new Set();
		throw error;
	}
	const packageNames = /* @__PURE__ */ new Set();
	for (const entry of entries.toSorted((left, right) => left.name.localeCompare(right.name))) {
		if (entry.name === ".bin" || entry.name === "@gabrielvfonseca/operator") continue;
		if (entry.name.startsWith("@")) {
			const scopeDir = node_path.default.join(nodeModulesDir, entry.name);
			let scopedEntries;
			try {
				scopedEntries = await node_fs_promises.default.readdir(scopeDir, { withFileTypes: true });
			} catch (error) {
				if (error.code === "ENOENT") continue;
				throw error;
			}
			for (const scopedEntry of scopedEntries.toSorted((left, right) => left.name.localeCompare(right.name))) if (scopedEntry.isDirectory() || scopedEntry.isSymbolicLink()) packageNames.add(`${entry.name}/${scopedEntry.name}`);
			continue;
		}
		if (entry.isDirectory() || entry.isSymbolicLink()) packageNames.add(entry.name);
	}
	return packageNames;
}
function resolveManagedNpmRootPackageDir(npmRoot, packageName) {
	return node_path.default.join(npmRoot, "node_modules", ...packageName.split("/"));
}
function resolveManagedNpmRootGenerationKey(params) {
	return [
		params.npmResolution.name ?? params.packageName,
		params.npmResolution.version ?? "",
		params.npmResolution.resolvedSpec ?? "",
		params.npmResolution.integrity ?? "",
		params.npmResolution.shasum ?? ""
	].join("\n");
}
function resolveManagedNpmRootForInstall(params) {
	if (!params.useGeneration) return require_install_paths.resolvePluginNpmProjectDir({
		npmDir: params.npmBaseDir,
		packageName: params.packageName
	});
	return require_install_paths.resolvePluginNpmGenerationProjectDir({
		npmDir: params.npmBaseDir,
		packageName: params.packageName,
		generationKey: resolveManagedNpmRootGenerationKey({
			packageName: params.packageName,
			npmResolution: params.npmResolution
		})
	});
}
function resolveManagedNpmInstallRoot(params) {
	const generationKey = resolveManagedNpmRootGenerationKey({
		packageName: params.packageName,
		npmResolution: params.npmResolution
	});
	const npmRoot = resolveManagedNpmRootForInstall(params);
	if (!require_managed_npm_retention.hasRetainedManagedNpmInstallMarker(resolveManagedNpmRootPackageDir(npmRoot, params.packageName))) return npmRoot;
	return require_install_paths.resolvePluginNpmGenerationProjectDir({
		npmDir: params.npmBaseDir,
		packageName: params.packageName,
		generationKey: `${generationKey}\nactivation\n${(0, node_crypto.randomUUID)()}`
	});
}
async function listManagedNpmPackageDirsForPackage(params) {
	const packageDirs = [];
	const legacyProjectRoot = require_install_paths.resolvePluginNpmProjectDir({
		npmDir: params.npmBaseDir,
		packageName: params.packageName
	});
	const legacyPackageDir = resolveManagedNpmRootPackageDir(legacyProjectRoot, params.packageName);
	if (await params.runtime.fileExists(legacyPackageDir)) packageDirs.push(legacyPackageDir);
	const projectsDir = node_path.default.dirname(legacyProjectRoot);
	const generationPrefix = require_install_paths.resolvePluginNpmGenerationProjectDirPrefix(params.packageName);
	let entries;
	try {
		entries = await node_fs_promises.default.readdir(projectsDir, { withFileTypes: true });
	} catch (error) {
		if ((0, _openclaw_fs_safe_path.isNotFoundPathError)(error)) return packageDirs;
		throw error;
	}
	for (const entry of entries) {
		if (!entry.isDirectory() || !entry.name.startsWith(generationPrefix)) continue;
		const packageDir = resolveManagedNpmRootPackageDir(node_path.default.join(projectsDir, entry.name), params.packageName);
		if (await params.runtime.fileExists(packageDir)) packageDirs.push(packageDir);
	}
	return packageDirs;
}
async function resolveManagedNpmGenerationUseForInstall(params) {
	const packageDirs = await listManagedNpmPackageDirsForPackage({
		runtime: params.runtime,
		npmBaseDir: params.npmBaseDir,
		packageName: params.packageName
	});
	const hasNonRetainedPackageDir = packageDirs.some((packageDir) => !require_managed_npm_retention.hasRetainedManagedNpmInstallMarker(packageDir));
	if (packageDirs.length > 0 && !hasNonRetainedPackageDir) return "retained-install";
	const generationUse = params.requestedMode === "update" && hasNonRetainedPackageDir ? "update" : "none";
	if (params.npmResolution) {
		if (require_managed_npm_retention.hasRetainedManagedNpmInstallMarker(resolveManagedNpmRootPackageDir(resolveManagedNpmRootForInstall({
			npmBaseDir: params.npmBaseDir,
			packageName: params.packageName,
			npmResolution: params.npmResolution,
			useGeneration: generationUse !== "none"
		}), params.packageName))) return "retained-install";
	}
	if (params.requestedMode === "update") return hasNonRetainedPackageDir ? "update" : "none";
	return "none";
}
function resolveRequiredPlatformPackageNames(packageMetadata) {
	const raw = packageMetadata?.install?.requiredPlatformPackages;
	if (raw === void 0) return {
		ok: true,
		packageNames: []
	};
	if (!Array.isArray(raw)) return {
		ok: false,
		error: "package.json operator.install.requiredPlatformPackages must be an array"
	};
	const packageNames = /* @__PURE__ */ new Set();
	for (const value of raw) {
		if (typeof value !== "string") return {
			ok: false,
			error: "package.json operator.install.requiredPlatformPackages must contain only npm package names"
		};
		const specError = require_npm_registry_spec.validateRegistryNpmSpec(value);
		const parsed = require_npm_registry_spec.parseRegistryNpmSpec(value);
		if (specError || !parsed || parsed.selectorKind !== "none") return {
			ok: false,
			error: `package.json operator.install.requiredPlatformPackages contains invalid package name: ${value}`
		};
		packageNames.add(parsed.name);
	}
	return {
		ok: true,
		packageNames: [...packageNames]
	};
}
async function listNewManagedNpmRootPackageDirs(params) {
	return [...await listManagedNpmRootPackageNames(params.npmRoot)].filter((packageName) => !params.beforeInstallPackageNames.has(packageName)).map((packageName) => resolveManagedNpmRootPackageDir(params.npmRoot, packageName)).toSorted((left, right) => left.localeCompare(right));
}
//#endregion
//#region src/plugins/install-npm-resolution.ts
function verifyInstalledNpmResolution(params) {
	if (!params.installed) return {
		kind: "incomplete",
		error: `npm install did not record package-lock metadata for ${params.packageName}`
	};
	if (params.expected.version && params.installed.version) {
		if (params.installed.version !== params.expected.version) return {
			kind: "conflict",
			error: `npm install resolved ${params.packageName} to version ${params.installed.version}, expected ${params.expected.version}`
		};
	}
	if (params.expected.integrity && params.installed.integrity) {
		if (params.installed.integrity !== params.expected.integrity) return {
			kind: "conflict",
			error: `npm install resolved ${params.packageName} with integrity ${params.installed.integrity}, expected ${params.expected.integrity}`
		};
	}
	if (params.expected.version && !params.installed.version || params.expected.integrity && !params.installed.integrity) return {
		kind: "incomplete",
		error: `npm install recorded incomplete package-lock metadata for ${params.packageName}: ${params.expected.version && !params.installed.version ? "version" : "integrity"} missing`
	};
	return { kind: "ok" };
}
//#endregion
//#region src/plugins/install-managed-npm.ts
async function installPluginFromManagedNpmRoot(params) {
	const runtime = await loadPluginInstallRuntime();
	const { logger, timeoutMs, mode, dryRun } = runtime.resolveTimedInstallModeOptions(params, defaultLogger);
	const expectedPluginId = params.expectedPluginId;
	const npmBaseDir = params.npmDir ? require_home_dir.resolveUserPath(params.npmDir) : require_install_paths.resolveDefaultPluginNpmDir();
	const generationUse = await resolveManagedNpmGenerationUseForInstall({
		runtime,
		npmBaseDir,
		packageName: params.packageName,
		requestedMode: mode,
		npmResolution: params.npmResolution
	});
	const npmRoot = resolveManagedNpmInstallRoot({
		npmBaseDir,
		packageName: params.packageName,
		npmResolution: params.npmResolution,
		useGeneration: generationUse !== "none"
	});
	const installRoot = resolveManagedNpmRootPackageDir(npmRoot, params.packageName);
	const targetMode = generationUse === "retained-install" && require_managed_npm_retention.hasRetainedManagedNpmInstallMarker(installRoot) ? "update" : await resolveEffectiveInstallMode({
		runtime,
		requestedMode: mode,
		targetPath: installRoot
	});
	const policyMode = generationUse === "update" ? "update" : generationUse === "retained-install" ? "install" : targetMode;
	const availability = await ensureInstallTargetAvailableForMode({
		runtime,
		targetPath: installRoot,
		mode: targetMode
	});
	if (!availability.ok) return availability;
	if (!params.skipPolicyPreflight) {
		const preflightPolicyResult = await runInstallSourceScan({
			subject: `Plugin "${expectedPluginId ?? params.packageName}"`,
			pluginId: expectedPluginId ?? params.packageName,
			mode: policyMode,
			sourceFamily: sourceFamilyForInstallPolicySource(params.installPolicyRequest.source, "npm"),
			scan: async () => await require_install_security_scan.preflightPluginNpmInstallPolicy({
				config: params.config,
				logger,
				mode: policyMode,
				packageName: params.packageName,
				...expectedPluginId ? { pluginId: expectedPluginId } : {},
				requestedSpecifier: params.installPolicyRequest.requestedSpecifier ?? params.displaySpec,
				source: params.installPolicyRequest.source,
				sourcePath: params.policyPreflightSourcePath ?? npmRoot,
				sourcePathKind: params.policyPreflightSourcePathKind ?? "directory"
			})
		});
		if (preflightPolicyResult) return preflightPolicyResult;
	}
	if (dryRun) return {
		ok: true,
		pluginId: expectedPluginId ?? params.packageName,
		targetDir: installRoot,
		extensions: [],
		npmResolution: params.npmResolution,
		...params.integrityDrift ? { integrityDrift: params.integrityDrift } : {}
	};
	let rollbackSnapshot;
	let preparedDependency;
	let rollbackPeerDependencySnapshot;
	let recovery;
	try {
		rollbackSnapshot = await createManagedNpmPluginInstallRollbackSnapshot({ npmRoot });
	} catch (error) {
		return {
			ok: false,
			error: `Failed to snapshot managed npm root before installing ${params.packageName}: ${String(error)}`
		};
	}
	const runManagedNpmInstall = async (prepared) => {
		logger.info?.(`Installing ${params.displaySpec} into ${npmRoot}…`);
		if (params.packageName !== "@gabrielvfonseca/operator") {
			if (await require_npm_managed_root.repairManagedNpmRootOperatorPeer({
				npmRoot,
				timeoutMs,
				logger
			})) logger.info?.(`Repaired stale openclaw peer dependency in ${npmRoot}`);
		}
		const managedOverrides = await require_npm_managed_root.readOperatorManagedNpmRootOverrides();
		rollbackPeerDependencySnapshot ??= await require_npm_managed_root.readManagedNpmRootPeerDependencySnapshot({ npmRoot });
		const rollbackFailedManagedNpmInstall = async (failure) => {
			await rollbackManagedNpmPluginInstall({
				npmRoot,
				packageName: params.packageName,
				targetDir: installRoot,
				timeoutMs,
				logger,
				peerDependencySnapshot: rollbackPeerDependencySnapshot,
				snapshot: recovery ? void 0 : rollbackSnapshot
			});
			await rollbackManagedNpmRootPreparedDependency({
				packageName: params.packageName,
				preparedDependency: prepared,
				logger
			});
			return failure;
		};
		const quarantineForRecovery = async (cause) => {
			try {
				recovery = {
					cause,
					quarantine: await quarantineManagedNpmProjectRebuildArtifacts({ npmRoot })
				};
			} catch (error) {
				return await rollbackFailedManagedNpmInstall({
					ok: false,
					error: `${cause.error}, but Operator could not quarantine ${npmRoot} for rebuild: ${String(error)}`
				});
			}
			logger.warn?.(`${cause.error}; quarantined ${formatManagedNpmProjectQuarantineArtifacts(recovery.quarantine.movedArtifactNames)} at ${recovery.quarantine.quarantineDir} and rebuilding once before retrying.`);
			return null;
		};
		const syncManagedPeerDependenciesForInstall = async (options) => {
			try {
				return {
					ok: true,
					changed: await require_npm_managed_root.syncManagedNpmRootPeerDependencies({
						npmRoot,
						managedOverrides,
						omitUnsupportedManagedOverrides: options?.omitUnsupportedManagedOverrides,
						timeoutMs
					})
				};
			} catch (error) {
				return {
					ok: false,
					error: `npm peer dependency planning failed: ${error instanceof Error ? error.message : String(error)}`
				};
			}
		};
		let omitUnsupportedManagedOverrides = false;
		const preInstallRootPackageNames = await listManagedNpmRootPackageNames(npmRoot);
		await require_npm_managed_root.upsertManagedNpmRootDependency({
			npmRoot,
			packageName: params.packageName,
			dependencySpec: prepared.dependencySpec,
			managedOverrides,
			omitUnsupportedManagedOverrides
		});
		const initialPeerSync = await syncManagedPeerDependenciesForInstall({ omitUnsupportedManagedOverrides });
		if (!initialPeerSync.ok) return await rollbackFailedManagedNpmInstall({
			ok: false,
			error: initialPeerSync.error
		});
		const npmInstallArgs = ["npm", ...require_safe_package_install.createSafeNpmInstallArgs({
			omitDev: true,
			omitPeer: true,
			loglevel: "error",
			legacyPeerDeps: true,
			noAudit: true,
			noFund: true
		})];
		const npmInstallOptions = {
			cwd: npmRoot,
			timeoutMs: Math.max(timeoutMs, 3e5),
			env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
				legacyPeerDeps: true,
				npmConfigCwd: npmRoot,
				packageLock: true,
				quiet: true
			})
		};
		let install = await require_exec.runCommandWithTimeout(npmInstallArgs, npmInstallOptions);
		if (install.code !== 0 && isNpmAliasOverrideComparatorError(install)) {
			logger.warn?.("npm rejected managed npm alias overrides; retrying plugin install without alias overrides for this npm version.");
			omitUnsupportedManagedOverrides = true;
			await require_npm_managed_root.upsertManagedNpmRootDependency({
				npmRoot,
				packageName: params.packageName,
				dependencySpec: prepared.dependencySpec,
				managedOverrides,
				omitUnsupportedManagedOverrides: true
			});
			const aliasRetryPeerSync = await syncManagedPeerDependenciesForInstall({ omitUnsupportedManagedOverrides: true });
			if (!aliasRetryPeerSync.ok) return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: aliasRetryPeerSync.error
			});
			install = await require_exec.runCommandWithTimeout(npmInstallArgs, npmInstallOptions);
		}
		if (!recovery && install.code !== 0 && isManagedNpmProjectCorruptionInstallFailure(install)) {
			const recoveryFailure = await quarantineForRecovery({
				kind: "npm-corruption",
				error: `npm install failed with a managed npm project corruption signature. Original npm error: ${formatNpmCommandFailureOutput(install)}`
			});
			if (recoveryFailure) return recoveryFailure;
			return await runManagedNpmInstall(prepared);
		}
		if (install.code !== 0) return await rollbackFailedManagedNpmInstall({
			ok: false,
			error: recovery ? `npm install failed after managed npm project recovery (quarantine: ${recovery.quarantine.quarantineDir}): ${formatNpmCommandFailureOutput(install)}. Original ${recovery.cause.kind === "npm-corruption" ? "npm" : "verification"} error: ${recovery.cause.error}` : `npm install failed: ${formatNpmCommandFailureOutput(install)}`
		});
		let settledManagedPeerDependencies = false;
		for (let peerSyncPass = 0; peerSyncPass < 10; peerSyncPass += 1) {
			const peerSync = await syncManagedPeerDependenciesForInstall({ omitUnsupportedManagedOverrides });
			if (!peerSync.ok) return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: peerSync.error
			});
			if (!peerSync.changed) {
				settledManagedPeerDependencies = true;
				break;
			}
			install = await require_exec.runCommandWithTimeout(npmInstallArgs, npmInstallOptions);
			if (install.code !== 0) return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: `npm install failed after syncing managed peer dependencies: ${install.stderr.trim() || install.stdout.trim()}`
			});
		}
		if (!settledManagedPeerDependencies) {
			const peerSync = await syncManagedPeerDependenciesForInstall({ omitUnsupportedManagedOverrides });
			if (!peerSync.ok) return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: peerSync.error
			});
			settledManagedPeerDependencies = !peerSync.changed;
		}
		if (!settledManagedPeerDependencies) return await rollbackFailedManagedNpmInstall({
			ok: false,
			error: "npm install could not settle managed peer dependencies after 10 sync passes; refusing to leave a partially reconciled plugin dependency tree."
		});
		const packageManifestResult = await readOptionalPackageManifest({
			runtime,
			packageDir: installRoot
		});
		if (!packageManifestResult.ok) return await rollbackFailedManagedNpmInstall(packageManifestResult);
		const requiredPlatformPackageNames = resolveRequiredPlatformPackageNames(packageManifestResult.manifest ? runtime.getPackageManifestMetadata(packageManifestResult.manifest) : void 0);
		if (!requiredPlatformPackageNames.ok) return await rollbackFailedManagedNpmInstall({
			ok: false,
			error: requiredPlatformPackageNames.error
		});
		let omittedPlatformPackages;
		try {
			omittedPlatformPackages = await require_npm_managed_root.listMissingRequiredPlatformPackages({
				npmRoot,
				requiredPackageNames: requiredPlatformPackageNames.packageNames
			});
		} catch (error) {
			return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: `Failed to verify platform-specific npm dependencies for ${params.packageName}: ${String(error)}`
			});
		}
		if (omittedPlatformPackages.length > 0) {
			const omittedPlatformPackageNames = omittedPlatformPackages.map((entry) => entry.name);
			logger.warn?.(`npm omitted current-platform package(s) ${omittedPlatformPackageNames.join(", ")}; retrying once with a fresh cache.`);
			let freshCacheDir;
			try {
				freshCacheDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-npm-cache-"));
				install = await require_exec.runCommandWithTimeout(npmInstallArgs, {
					...npmInstallOptions,
					env: {
						...npmInstallOptions.env,
						NPM_CONFIG_CACHE: freshCacheDir,
						npm_config_cache: freshCacheDir
					}
				});
			} catch (error) {
				return await rollbackFailedManagedNpmInstall({
					ok: false,
					error: `Failed to repair omitted current-platform package(s) ${omittedPlatformPackageNames.join(", ")}: ${String(error)}`
				});
			} finally {
				if (freshCacheDir) try {
					await node_fs_promises.default.rm(freshCacheDir, {
						recursive: true,
						force: true
					});
				} catch (error) {
					logger.warn?.(`Failed to remove temporary npm cache ${freshCacheDir}: ${String(error)}`);
				}
			}
			if (install.code !== 0) return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: `npm install failed while repairing omitted current-platform package(s) ${omittedPlatformPackageNames.join(", ")}: ${formatNpmCommandFailureOutput(install)}`
			});
			let stillOmittedPlatformPackages;
			try {
				stillOmittedPlatformPackages = await require_npm_managed_root.listMissingRequiredPlatformPackages({
					npmRoot,
					requiredPackageNames: requiredPlatformPackageNames.packageNames
				});
			} catch (error) {
				return await rollbackFailedManagedNpmInstall({
					ok: false,
					error: `Failed to verify repaired platform-specific npm dependencies for ${params.packageName}: ${String(error)}`
				});
			}
			if (stillOmittedPlatformPackages.length > 0) return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: `npm install reported success but omitted required current-platform package(s): ${stillOmittedPlatformPackages.map((entry) => entry.name).join(", ")}`
			});
		}
		if (params.packageName !== "@gabrielvfonseca/operator") {
			if (await require_npm_managed_root.repairManagedNpmRootOperatorPeer({
				npmRoot,
				timeoutMs,
				logger
			})) logger.info?.(`Repaired stale openclaw peer dependency in ${npmRoot} after npm install`);
		}
		try {
			await require_plugin_peer_link.relinkOperatorPeerDependenciesInManagedNpmRoot({
				npmRoot,
				logger
			});
		} catch (error) {
			return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: `Failed to repair openclaw peer links after npm install: ${String(error)}`
			});
		}
		if (require_package_update_utils.installedPackageNeedsOperatorPeerLinkRepair(installRoot)) return await rollbackFailedManagedNpmInstall({
			ok: false,
			error: formatUnresolvedOperatorPeerLinkError(params.packageName)
		});
		let installedDependency;
		try {
			installedDependency = await require_npm_managed_root.readManagedNpmRootInstalledDependency({
				npmRoot,
				packageName: params.packageName
			});
		} catch (error) {
			return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: `Failed to verify npm install metadata for ${params.packageName}: ${String(error)}`
			});
		}
		const resolutionVerification = verifyInstalledNpmResolution({
			packageName: params.packageName,
			expected: params.npmResolution,
			installed: installedDependency
		});
		if (resolutionVerification.kind === "conflict") return await rollbackFailedManagedNpmInstall({
			ok: false,
			error: resolutionVerification.error
		});
		if (resolutionVerification.kind === "incomplete") {
			if (!recovery) {
				const recoveryFailure = await quarantineForRecovery({
					kind: "incomplete-metadata",
					error: resolutionVerification.error
				});
				if (recoveryFailure) return recoveryFailure;
				return await runManagedNpmInstall(prepared);
			}
			return await rollbackFailedManagedNpmInstall({
				ok: false,
				error: `npm install metadata remained incomplete after managed npm project recovery (quarantine: ${recovery.quarantine.quarantineDir}): ${resolutionVerification.error}`
			});
		}
		const newRootPackageDirs = await listNewManagedNpmRootPackageDirs({
			beforeInstallPackageNames: preInstallRootPackageNames,
			npmRoot
		});
		const result = await installPluginFromInstalledPackageDir({
			dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
			config: params.config,
			additionalDependencyPackageDirs: newRootPackageDirs,
			packageDir: installRoot,
			dependencyScanRootDir: npmRoot,
			logger,
			expectedPluginId,
			trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
			mode: policyMode,
			installPolicyRequest: params.installPolicyRequest,
			emitSuccessSecurityEvent: false
		});
		if (!result.ok) return await rollbackFailedManagedNpmInstall(result);
		return {
			...result,
			npmResolution: params.npmResolution,
			...params.integrityDrift ? { integrityDrift: params.integrityDrift } : {}
		};
	};
	try {
		const dependencyResult = await resolveManagedNpmRootDependencySpecForInstall({
			npmRoot,
			packageName: params.packageName,
			dependencySpec: params.dependencySpec,
			prepareDependencySpec: params.prepareDependencySpec
		});
		if (!dependencyResult.ok) return dependencyResult;
		preparedDependency = dependencyResult;
		return await runManagedNpmInstall(preparedDependency);
	} finally {
		await cleanupManagedNpmRootPreparedDependency({
			packageName: params.packageName,
			preparedDependency,
			logger
		});
		await cleanupManagedNpmPluginInstallRollbackSnapshot({
			snapshot: rollbackSnapshot,
			logger
		});
	}
}
//#endregion
//#region src/plugins/install-npm-pack.ts
const MANAGED_NPM_PACK_ARCHIVE_DIR = "_operator-pack-archives";
function resolveTrustedNpmPackPackageName(packageName) {
	if (!packageName) return {
		ok: false,
		error: "npm pack metadata missing package name",
		code: PLUGIN_INSTALL_ERROR_CODE.INVALID_NPM_SPEC
	};
	const specError = require_npm_registry_spec.validateRegistryNpmSpec(packageName);
	const parsedSpec = require_npm_registry_spec.parseRegistryNpmSpec(packageName);
	if (specError || !parsedSpec || parsedSpec.selectorKind !== "none") return {
		ok: false,
		error: `unsupported npm pack package name: ${packageName}`,
		code: PLUGIN_INSTALL_ERROR_CODE.INVALID_NPM_SPEC
	};
	return {
		ok: true,
		packageName: parsedSpec.name
	};
}
async function stageNpmPackArchiveInManagedRoot(params) {
	const archiveStoreDir = node_path.default.join(params.npmRoot, MANAGED_NPM_PACK_ARCHIVE_DIR);
	const identitySlug = require_crypto_digest.sha256HexPrefix(params.integrity ?? params.shasum ?? params.tarballName, 16);
	const archiveFileName = `${require_install_paths.safePluginInstallFileName(params.packageName) || "plugin"}-${require_install_paths.safePluginInstallFileName(params.version ?? "pack") || "pack"}-${identitySlug}.tgz`;
	const stableArchivePath = node_path.default.join(archiveStoreDir, archiveFileName);
	const tempArchivePath = node_path.default.join(archiveStoreDir, `.${archiveFileName}.${process.pid}.${Date.now()}.tmp`);
	let archiveStoreExisted = true;
	let backupTempDir;
	let previousArchiveBackupPath;
	const cleanupBackup = async () => {
		if (!backupTempDir) return;
		const tempDir = backupTempDir;
		backupTempDir = void 0;
		previousArchiveBackupPath = void 0;
		await node_fs_promises.default.rm(tempDir, {
			recursive: true,
			force: true
		});
	};
	try {
		await node_fs_promises.default.access(archiveStoreDir);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		archiveStoreExisted = false;
	}
	try {
		await node_fs_promises.default.access(stableArchivePath);
		backupTempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-npm-pack-archive-"));
		previousArchiveBackupPath = node_path.default.join(backupTempDir, archiveFileName);
		await node_fs_promises.default.copyFile(stableArchivePath, previousArchiveBackupPath);
	} catch (error) {
		if (error.code !== "ENOENT") {
			await cleanupBackup();
			throw error;
		}
	}
	try {
		await node_fs_promises.default.mkdir(archiveStoreDir, { recursive: true });
		await node_fs_promises.default.copyFile(params.archivePath, tempArchivePath);
		await node_fs_promises.default.rename(tempArchivePath, stableArchivePath);
	} catch (error) {
		await node_fs_promises.default.rm(tempArchivePath, { force: true });
		await cleanupBackup();
		if (!archiveStoreExisted) await removeEmptyDirectoryIfPresent(archiveStoreDir);
		throw error;
	}
	return {
		stableArchivePath,
		dependencySpec: `file:./${node_path.default.posix.join(MANAGED_NPM_PACK_ARCHIVE_DIR, archiveFileName)}`,
		rollback: async () => {
			if (previousArchiveBackupPath) {
				await node_fs_promises.default.mkdir(archiveStoreDir, { recursive: true });
				await node_fs_promises.default.copyFile(previousArchiveBackupPath, stableArchivePath);
			} else await node_fs_promises.default.rm(stableArchivePath, { force: true });
			await cleanupBackup();
			if (!archiveStoreExisted) await removeEmptyDirectoryIfPresent(archiveStoreDir);
		},
		cleanup: cleanupBackup
	};
}
async function installPluginFromNpmPackArchive(params) {
	const runtime = await loadPluginInstallRuntime();
	const { logger, timeoutMs, mode, dryRun } = runtime.resolveTimedInstallModeOptions(params, defaultLogger);
	const metadataResult = await require_install_source_utils.resolveNpmPackArchiveMetadata({
		archivePath: params.archivePath,
		timeoutMs
	});
	if (!metadataResult.ok) return metadataResult;
	const npmResolution = {
		...metadataResult.metadata,
		resolvedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	const driftResult = await require_npm_integrity.resolveNpmIntegrityDriftWithDefaultMessage({
		spec: metadataResult.archivePath,
		expectedIntegrity: params.expectedIntegrity,
		resolution: npmResolution,
		onIntegrityDrift: params.onIntegrityDrift,
		warn: (message) => logger.warn?.(message)
	});
	if (driftResult.error) return {
		ok: false,
		error: driftResult.error
	};
	const packageNameResult = resolveTrustedNpmPackPackageName(metadataResult.metadata.name);
	if (!packageNameResult.ok) return packageNameResult;
	const packageName = packageNameResult.packageName;
	const npmBaseDir = params.npmDir ? require_home_dir.resolveUserPath(params.npmDir) : require_install_paths.resolveDefaultPluginNpmDir();
	const generationUse = await resolveManagedNpmGenerationUseForInstall({
		runtime,
		npmBaseDir,
		packageName,
		requestedMode: mode,
		npmResolution
	});
	const installRoot = resolveManagedNpmRootPackageDir(resolveManagedNpmRootForInstall({
		npmBaseDir,
		packageName,
		npmResolution,
		useGeneration: generationUse !== "none"
	}), packageName);
	const targetMode = generationUse === "retained-install" && require_managed_npm_retention.hasRetainedManagedNpmInstallMarker(installRoot) ? "update" : await resolveEffectiveInstallMode({
		runtime,
		requestedMode: mode,
		targetPath: installRoot
	});
	const policyMode = generationUse === "update" ? "update" : generationUse === "retained-install" ? "install" : targetMode;
	const result = await installPluginFromManagedNpmRoot({
		dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
		config: params.config,
		packageName,
		prepareDependencySpec: async ({ npmRoot }) => {
			try {
				return {
					ok: true,
					...await stageNpmPackArchiveInManagedRoot({
						archivePath: metadataResult.archivePath,
						npmRoot,
						packageName,
						version: metadataResult.metadata.version,
						integrity: metadataResult.metadata.integrity,
						shasum: metadataResult.metadata.shasum,
						tarballName: metadataResult.tarballName
					})
				};
			} catch (error) {
				return {
					ok: false,
					error: `Failed to stage npm pack archive in managed npm root: ${String(error)}`
				};
			}
		},
		displaySpec: metadataResult.archivePath,
		installPolicyRequest: {
			kind: "plugin-npm",
			requestedSpecifier: `npm-pack:${metadataResult.archivePath}`,
			source: {
				kind: "archive",
				authority: "user",
				mutable: true,
				network: false
			}
		},
		policyPreflightSourcePath: metadataResult.archivePath,
		policyPreflightSourcePathKind: "file",
		extensionsDir: params.extensionsDir,
		npmDir: npmBaseDir,
		timeoutMs,
		logger,
		mode,
		dryRun,
		expectedPluginId: params.expectedPluginId,
		npmResolution,
		...driftResult.integrityDrift ? { integrityDrift: driftResult.integrityDrift } : {}
	});
	emitSuccessfulPluginInstallSecurityEvent(result, {
		dryRun,
		mode: policyMode,
		sourceFamily: "archive",
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall
	});
	return {
		...result,
		...result.ok ? { npmTarballName: metadataResult.tarballName } : {}
	};
}
//#endregion
//#region src/plugins/install-npm-metadata.ts
function isNpmPackageNotFoundMessage(error) {
	const normalized = error.trim();
	if (normalized.startsWith("Package not found on npm:")) return true;
	return /E404|404 not found|not in this registry/i.test(normalized);
}
function compareNpmSemver(a, b) {
	const releaseCmp = require_npm_registry_spec.compareOperatorReleaseVersions(a, b);
	if (releaseCmp !== null) return releaseCmp;
	return require_semver.compareValidSemver(a, b) ?? 0;
}
async function loadNpmPackageVersions(params) {
	const versions = await require_exec.runCommandWithTimeout([
		"npm",
		"view",
		params.packageName,
		"versions",
		"--json"
	], {
		timeoutMs: Math.max(params.timeoutMs, 6e4),
		env: require_install_source_utils.createNpmMetadataEnv()
	});
	if (versions.code !== 0) return null;
	let parsed;
	try {
		parsed = JSON.parse(versions.stdout.trim());
	} catch {
		return null;
	}
	return (Array.isArray(parsed) ? parsed : [parsed]).filter((value) => typeof value === "string" && require_npm_registry_spec.isExactSemverVersion(value));
}
async function resolveTrustedOfficialPrereleaseResolution(params) {
	if (!params.spec.name.startsWith("@gabrielvfonseca/")) return null;
	const semverVersions = await loadNpmPackageVersions({
		packageName: params.spec.name,
		timeoutMs: params.timeoutMs
	});
	if (!semverVersions) return null;
	const stableVersion = semverVersions.filter((value) => !require_npm_registry_spec.isPrereleaseSemverVersion(value)).toSorted(compareNpmSemver).at(-1);
	if (!stableVersion) {
		const prereleaseVersion = semverVersions.filter(require_npm_registry_spec.isPrereleaseSemverVersion).toSorted(compareNpmSemver).at(-1);
		if (prereleaseVersion && semverVersions.every(require_npm_registry_spec.isPrereleaseSemverVersion)) {
			if (prereleaseVersion !== params.resolvedPrereleaseVersion) {
				const prereleaseSpec = `${params.spec.name}@${prereleaseVersion}`;
				const metadataResult = await require_install_source_utils.resolveNpmSpecMetadata({
					spec: prereleaseSpec,
					timeoutMs: params.timeoutMs
				});
				if (!metadataResult.ok) return null;
				params.logger.warn?.(`Resolved ${params.spec.raw} to prerelease version ${params.resolvedPrereleaseVersion}; using newest prerelease ${prereleaseSpec} because this trusted official Operator package has no stable npm versions yet.`);
				return {
					kind: "prerelease-only",
					resolution: metadataResult.metadata
				};
			}
			params.logger.warn?.(`Resolved ${params.spec.raw} to prerelease version ${params.resolvedPrereleaseVersion}; allowing it because this trusted official Operator package has no stable npm versions yet.`);
			return { kind: "allow-prerelease-only" };
		}
		return null;
	}
	const stableSpec = `${params.spec.name}@${stableVersion}`;
	const metadataResult = await require_install_source_utils.resolveNpmSpecMetadata({
		spec: stableSpec,
		timeoutMs: params.timeoutMs
	});
	if (!metadataResult.ok) return null;
	params.logger.warn?.(`Resolved ${params.spec.raw} to prerelease version ${params.resolvedPrereleaseVersion}; falling back to stable ${stableSpec} for this trusted official Operator install.`);
	return {
		kind: "stable",
		resolution: metadataResult.metadata
	};
}
function shouldResolveLatestCompatibleNpmVersion(spec) {
	return spec.selectorKind === "none" || spec.selectorKind === "tag" && (spec.selector ?? "").toLowerCase() === "latest";
}
function shouldResolveCompatiblePrereleaseNpmVersion(params) {
	if (!require_npm_registry_spec.isPrereleaseSemverVersion(params.currentVersion)) return false;
	if (params.spec.selectorKind === "none") return true;
	return params.spec.selectorKind === "tag" && (params.spec.selector ?? "").toLowerCase() !== "latest";
}
function resolvePrereleaseChannel(version) {
	if (!require_npm_registry_spec.isPrereleaseSemverVersion(version)) return null;
	return /^\s*v?\d+\.\d+\.\d+-([0-9A-Za-z]+)(?:[.-]|$)/.exec(version)?.[1]?.toLowerCase() ?? null;
}
function canResolveAroundCompatibilityError(error) {
	return error.code === PLUGIN_INSTALL_ERROR_CODE.INCOMPATIBLE_HOST_VERSION || error.code === PLUGIN_INSTALL_ERROR_CODE.INCOMPATIBLE_PLUGIN_API;
}
function validateNpmResolutionCompatibility(params) {
	return validateOperatorPackageInstallCompatibility({
		runtime: params.runtime,
		pluginId: params.expectedPluginId ?? params.resolution.name ?? params.parsedSpec.name,
		packageMetadata: params.resolution.packageOperator
	});
}
async function resolveLatestCompatibleNpmResolution(params) {
	if (!params.currentResolution.version) return null;
	const currentVersion = params.currentResolution.version;
	const allowPrereleaseCandidates = shouldResolveCompatiblePrereleaseNpmVersion({
		spec: params.parsedSpec,
		currentVersion
	});
	const prereleaseChannel = allowPrereleaseCandidates ? resolvePrereleaseChannel(currentVersion) : null;
	if (!shouldResolveLatestCompatibleNpmVersion(params.parsedSpec) && !allowPrereleaseCandidates) return null;
	const versions = await loadNpmPackageVersions({
		packageName: params.parsedSpec.name,
		timeoutMs: params.timeoutMs
	});
	if (!versions) return null;
	const candidates = versions.filter((version) => allowPrereleaseCandidates ? resolvePrereleaseChannel(version) === prereleaseChannel : !require_npm_registry_spec.isPrereleaseSemverVersion(version)).filter((version) => compareNpmSemver(version, currentVersion) < 0).toSorted(compareNpmSemver).toReversed();
	for (const version of candidates) {
		const spec = `${params.parsedSpec.name}@${version}`;
		const metadataResult = await require_install_source_utils.resolveNpmSpecMetadata({
			spec,
			timeoutMs: params.timeoutMs
		});
		if (!metadataResult.ok) {
			params.logger.warn?.(`Could not inspect ${spec} while looking for a compatible plugin version: ${metadataResult.error}`);
			continue;
		}
		if (!validateNpmResolutionCompatibility({
			runtime: params.runtime,
			parsedSpec: params.parsedSpec,
			expectedPluginId: params.expectedPluginId,
			resolution: metadataResult.metadata
		})) {
			params.logger.warn?.(`Resolved ${params.parsedSpec.raw} to ${params.currentResolution.resolvedSpec ?? currentVersion}, but that version is incompatible with this Operator runtime; using newest compatible ${metadataResult.metadata.resolvedSpec ?? spec}.`);
			return metadataResult.metadata;
		}
	}
	return null;
}
//#endregion
//#region src/plugins/install-npm.ts
async function installPluginFromNpmSpec(params) {
	const runtime = await loadPluginInstallRuntime();
	const { logger, timeoutMs, mode, dryRun } = runtime.resolveTimedInstallModeOptions(params, defaultLogger);
	const expectedPluginId = params.expectedPluginId;
	const spec = params.spec.trim();
	const specError = runtime.validateRegistryNpmSpec(spec);
	if (specError) return {
		ok: false,
		error: specError,
		code: PLUGIN_INSTALL_ERROR_CODE.INVALID_NPM_SPEC
	};
	const parsedSpec = require_npm_registry_spec.parseRegistryNpmSpec(spec);
	if (!parsedSpec) return {
		ok: false,
		error: "unsupported npm spec",
		code: PLUGIN_INSTALL_ERROR_CODE.INVALID_NPM_SPEC
	};
	const metadataResult = await require_install_source_utils.resolveNpmSpecMetadata({
		spec,
		timeoutMs
	});
	if (!metadataResult.ok) return {
		ok: false,
		error: metadataResult.error,
		...isNpmPackageNotFoundMessage(metadataResult.error) ? { code: PLUGIN_INSTALL_ERROR_CODE.NPM_PACKAGE_NOT_FOUND } : metadataResult.category === "metadata-env" ? { code: PLUGIN_INSTALL_ERROR_CODE.NPM_METADATA_FAILURE } : {}
	};
	const npmResolution = {
		...metadataResult.metadata,
		resolvedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (npmResolution.version && !require_npm_registry_spec.isPrereleaseResolutionAllowed({
		spec: parsedSpec,
		resolvedVersion: npmResolution.version
	})) {
		const trustedResolution = params.trustedSourceLinkedOfficialInstall ? await resolveTrustedOfficialPrereleaseResolution({
			spec: parsedSpec,
			resolvedPrereleaseVersion: npmResolution.version,
			timeoutMs,
			logger
		}) : null;
		if (trustedResolution?.kind === "stable" || trustedResolution?.kind === "prerelease-only") Object.assign(npmResolution, trustedResolution.resolution, { resolvedAt: npmResolution.resolvedAt });
		else if (trustedResolution?.kind === "allow-prerelease-only") {} else return {
			ok: false,
			error: require_npm_registry_spec.formatPrereleaseResolutionError({
				spec: parsedSpec,
				resolvedVersion: npmResolution.version
			})
		};
	}
	let compatibilityError = validateNpmResolutionCompatibility({
		runtime,
		parsedSpec,
		expectedPluginId,
		resolution: npmResolution
	});
	if (compatibilityError && canResolveAroundCompatibilityError(compatibilityError)) {
		const compatibleResolution = await resolveLatestCompatibleNpmResolution({
			runtime,
			parsedSpec,
			expectedPluginId,
			currentResolution: npmResolution,
			timeoutMs,
			logger
		});
		if (compatibleResolution) {
			Object.assign(npmResolution, compatibleResolution, { resolvedAt: npmResolution.resolvedAt });
			compatibilityError = validateNpmResolutionCompatibility({
				runtime,
				parsedSpec,
				expectedPluginId,
				resolution: npmResolution
			});
		}
	}
	if (compatibilityError) return compatibilityError;
	const npmInstallPolicySource = {
		kind: "npm",
		authority: params.trustedSourceLinkedOfficialInstall ? "official" : "third-party",
		mutable: false,
		network: true
	};
	const driftResult = await require_npm_integrity.resolveNpmIntegrityDriftWithDefaultMessage({
		spec,
		expectedIntegrity: params.expectedIntegrity,
		resolution: npmResolution,
		onIntegrityDrift: params.onIntegrityDrift,
		warn: (message) => logger.warn?.(message)
	});
	if (driftResult.error) return {
		ok: false,
		error: driftResult.error
	};
	const npmBaseDir = params.npmDir ? require_home_dir.resolveUserPath(params.npmDir) : require_install_paths.resolveDefaultPluginNpmDir();
	const generationUse = await resolveManagedNpmGenerationUseForInstall({
		runtime,
		npmBaseDir,
		packageName: parsedSpec.name,
		requestedMode: mode,
		npmResolution
	});
	const installRoot = resolveManagedNpmRootPackageDir(resolveManagedNpmRootForInstall({
		npmBaseDir,
		packageName: parsedSpec.name,
		npmResolution,
		useGeneration: generationUse !== "none"
	}), parsedSpec.name);
	const targetMode = generationUse === "retained-install" && require_managed_npm_retention.hasRetainedManagedNpmInstallMarker(installRoot) ? "update" : await resolveEffectiveInstallMode({
		runtime,
		requestedMode: mode,
		targetPath: installRoot
	});
	const policyMode = generationUse === "update" ? "update" : generationUse === "retained-install" ? "install" : targetMode;
	const policyTempDir = await node_fs_promises.default.mkdtemp(node_path.default.join(node_os.default.tmpdir(), "operator-npm-policy-"));
	try {
		const policyMetadataPath = node_path.default.join(policyTempDir, "npm-package-metadata.json");
		await node_fs_promises.default.writeFile(policyMetadataPath, `${JSON.stringify({
			packageName: parsedSpec.name,
			requestedSpecifier: spec,
			resolution: npmResolution
		}, null, 2)}\n`, "utf8");
		const preflightPolicyResult = await runInstallSourceScan({
			subject: `Plugin "${expectedPluginId ?? parsedSpec.name}"`,
			pluginId: expectedPluginId ?? parsedSpec.name,
			mode: policyMode,
			sourceFamily: "npm",
			scan: async () => await require_install_security_scan.preflightPluginNpmInstallPolicy({
				config: params.config,
				logger,
				mode: policyMode,
				packageName: parsedSpec.name,
				...expectedPluginId ? { pluginId: expectedPluginId } : {},
				requestedSpecifier: spec,
				source: npmInstallPolicySource,
				sourcePath: policyMetadataPath,
				sourcePathKind: "file"
			})
		});
		if (preflightPolicyResult) return preflightPolicyResult;
	} finally {
		await node_fs_promises.default.rm(policyTempDir, {
			recursive: true,
			force: true
		});
	}
	const result = await installPluginFromManagedNpmRoot({
		dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
		config: params.config,
		packageName: parsedSpec.name,
		dependencySpec: require_npm_managed_root.resolveManagedNpmRootDependencySpec({
			parsedSpec,
			resolution: npmResolution
		}),
		displaySpec: spec,
		installPolicyRequest: {
			kind: "plugin-npm",
			requestedSpecifier: spec,
			source: npmInstallPolicySource
		},
		extensionsDir: params.extensionsDir,
		npmDir: params.npmDir,
		timeoutMs,
		logger,
		mode,
		dryRun,
		skipPolicyPreflight: true,
		expectedPluginId,
		npmResolution,
		...driftResult.integrityDrift ? { integrityDrift: driftResult.integrityDrift } : {}
	});
	emitSuccessfulPluginInstallSecurityEvent(result, {
		dryRun,
		mode: policyMode,
		sourceFamily: "npm",
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall
	});
	return result;
}
//#endregion
//#region src/plugins/install-package.ts
const PLUGIN_ARCHIVE_ROOT_MARKERS = [
	"package.json",
	"operator.plugin.json",
	".codex-plugin/plugin.json",
	".claude-plugin/plugin.json",
	".cursor-plugin/plugin.json"
];
function pickPackageInstallCommonParams(params) {
	return {
		config: params.config,
		dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
		extensionsDir: params.extensionsDir,
		npmDir: params.npmDir,
		timeoutMs: params.timeoutMs,
		logger: params.logger,
		mode: params.mode,
		dryRun: params.dryRun,
		expectedPluginId: params.expectedPluginId,
		requirePluginManifest: params.requirePluginManifest,
		allowSourceTypeScriptEntries: params.allowSourceTypeScriptEntries,
		installPolicyRequest: params.installPolicyRequest,
		onEffectiveMode: params.onEffectiveMode
	};
}
function installPolicyRequestForPath(params, kind) {
	const requestKind = params.installPolicyRequest?.kind === "plugin-git" && kind === "plugin-dir" ? "plugin-git" : kind;
	return {
		kind: requestKind,
		requestedSpecifier: params.installPolicyRequest?.requestedSpecifier ?? params.path,
		source: params.installPolicyRequest?.source ?? localPluginInstallPolicySource(requestKind)
	};
}
function localPluginInstallPolicySource(kind) {
	if (kind === "plugin-archive") return {
		kind: "archive",
		authority: "user",
		mutable: true,
		network: false
	};
	if (kind === "plugin-git") return {
		kind: "git",
		authority: "third-party",
		mutable: true,
		network: true
	};
	return {
		kind: "local-path",
		authority: "user",
		mutable: true,
		network: false
	};
}
async function installBundleFromSourceDir(params) {
	const runtime = await loadPluginInstallRuntime();
	const bundleFormat = runtime.detectBundleManifestFormat(params.sourceDir);
	if (!bundleFormat) return null;
	const { logger, timeoutMs, mode, dryRun } = runtime.resolveTimedInstallModeOptions(params, defaultLogger);
	const manifestRes = runtime.loadBundleManifest({
		rootDir: params.sourceDir,
		bundleFormat,
		rejectHardlinks: true
	});
	if (!manifestRes.ok) return {
		ok: false,
		error: manifestRes.error
	};
	const pluginId = manifestRes.manifest.id;
	const pluginIdError = require_install_paths.validatePluginId(pluginId);
	if (pluginIdError) return {
		ok: false,
		error: pluginIdError
	};
	if (params.expectedPluginId && params.expectedPluginId !== pluginId) return {
		ok: false,
		error: `plugin id mismatch: expected ${params.expectedPluginId}, got ${pluginId}`,
		code: PLUGIN_INSTALL_ERROR_CODE.PLUGIN_ID_MISMATCH
	};
	const packageManifestResult = await readOptionalPackageManifest({
		runtime,
		packageDir: params.sourceDir
	});
	if (!packageManifestResult.ok) return packageManifestResult;
	const compatibilityError = validateOperatorPackageInstallCompatibility({
		runtime,
		pluginId,
		packageMetadata: packageManifestResult.manifest ? runtime.getPackageManifestMetadata(packageManifestResult.manifest) : void 0
	});
	if (compatibilityError) return compatibilityError;
	const targetResult = await resolvePreparedDirectoryInstallTarget({
		runtime,
		pluginId,
		extensionsDir: params.extensionsDir,
		requestedMode: mode
	});
	if (!targetResult.ok) return {
		ok: false,
		error: targetResult.error
	};
	params.onEffectiveMode?.(targetResult.target.effectiveMode);
	const scanResult = await runInstallSourceScan({
		subject: `Bundle "${pluginId}"`,
		pluginId,
		mode: targetResult.target.effectiveMode,
		sourceFamily: sourceFamilyForInstallPolicyKind(params.installPolicyRequest?.kind, "archive"),
		scan: async () => await runtime.scanBundleInstallSource({
			dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
			config: params.config,
			sourceDir: params.sourceDir,
			pluginId,
			logger,
			requestKind: params.installPolicyRequest?.kind,
			requestedSpecifier: params.installPolicyRequest?.requestedSpecifier,
			source: params.installPolicyRequest?.source,
			mode: targetResult.target.effectiveMode,
			version: manifestRes.manifest.version
		})
	});
	if (scanResult) return scanResult;
	return await installPluginDirectoryIntoExtensions({
		sourceDir: params.sourceDir,
		pluginId,
		manifestName: manifestRes.manifest.name,
		version: manifestRes.manifest.version,
		extensions: [],
		targetDir: targetResult.target.targetPath,
		extensionsDir: params.extensionsDir,
		logger,
		timeoutMs,
		mode: targetResult.target.effectiveMode,
		dryRun,
		copyErrorPrefix: "failed to copy plugin bundle",
		hasDeps: false,
		depsLogMessage: ""
	});
}
async function installPluginFromSourceDir(params) {
	if (await detectNativePackageInstallSource(params.sourceDir)) return await installPluginFromPackageDir({
		packageDir: params.sourceDir,
		...pickPackageInstallCommonParams(params)
	});
	const bundleResult = await installBundleFromSourceDir({
		sourceDir: params.sourceDir,
		...pickPackageInstallCommonParams(params)
	});
	if (bundleResult) return bundleResult;
	return await installPluginFromPackageDir({
		packageDir: params.sourceDir,
		...pickPackageInstallCommonParams(params)
	});
}
async function detectNativePackageInstallSource(packageDir) {
	const runtime = await loadPluginInstallRuntime();
	const manifestPath = node_path.default.join(packageDir, "package.json");
	if (!await runtime.fileExists(manifestPath)) return false;
	try {
		return ensureOperatorExtensions({ manifest: await runtime.readJsonFile(manifestPath) }).ok;
	} catch {
		return false;
	}
}
async function installPluginFromPackageDir(params) {
	const runtime = await loadPluginInstallRuntime();
	const { logger, timeoutMs, mode, dryRun } = runtime.resolveTimedInstallModeOptions(params, defaultLogger);
	let preparedTarget;
	const resolvePreparedTargetForPluginId = async (pluginId) => {
		if (!preparedTarget) {
			const targetResult = await resolvePreparedDirectoryInstallTarget({
				runtime,
				pluginId,
				extensionsDir: params.extensionsDir,
				requestedMode: mode,
				nameEncoder: require_install_paths.encodePluginInstallDirName
			});
			if (!targetResult.ok) throw new Error(targetResult.error);
			preparedTarget = targetResult.target;
		}
		return preparedTarget;
	};
	const validated = await validatePackagePluginInstallSource({
		runtime,
		packageDir: params.packageDir,
		expectedPluginId: params.expectedPluginId,
		requirePluginManifest: params.requirePluginManifest,
		allowSourceTypeScriptEntries: params.allowSourceTypeScriptEntries,
		dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
		config: params.config,
		installPolicyRequest: params.installPolicyRequest,
		logger,
		mode,
		resolveEffectiveMode: async (pluginId) => (await resolvePreparedTargetForPluginId(pluginId)).effectiveMode
	});
	if (!validated.ok) return validated;
	const { plugin } = validated;
	preparedTarget = await resolvePreparedTargetForPluginId(plugin.pluginId);
	const effectiveMode = preparedTarget.effectiveMode;
	params.onEffectiveMode?.(effectiveMode);
	const hasBundleManifest = Boolean(runtime.detectBundleManifestFormat(params.packageDir));
	const shouldInstallRuntimeDeps = plugin.hasRuntimeDependencies && !hasBundleManifest && params.installPolicyRequest?.kind === "plugin-archive";
	return await installPluginDirectoryIntoExtensions({
		sourceDir: params.packageDir,
		pluginId: plugin.pluginId,
		manifestName: plugin.manifestName,
		version: plugin.version,
		extensions: plugin.extensions,
		targetDir: preparedTarget.targetPath,
		extensionsDir: params.extensionsDir,
		logger,
		timeoutMs,
		mode: effectiveMode,
		dryRun,
		copyErrorPrefix: "failed to copy plugin",
		hasDeps: shouldInstallRuntimeDeps,
		sourceHardlinks: shouldInstallRuntimeDeps ? "package-manager" : "reject",
		depsLogMessage: "Installing plugin dependencies…",
		nameEncoder: require_install_paths.encodePluginInstallDirName,
		afterInstall: async (installedDir) => {
			return await scanAndLinkInstalledPackage({
				runtime,
				installedDir,
				pluginId: plugin.pluginId,
				peerDependencies: plugin.peerDependencies,
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
				config: params.config,
				mode: effectiveMode,
				...params.installPolicyRequest?.kind ? { requestKind: params.installPolicyRequest.kind } : {},
				requestedSpecifier: params.installPolicyRequest?.requestedSpecifier,
				source: params.installPolicyRequest?.source,
				logger
			});
		}
	});
}
async function installPluginFromArchive(params) {
	const runtime = await loadPluginInstallRuntime();
	const logger = params.logger ?? defaultLogger;
	const timeoutMs = params.timeoutMs ?? 12e4;
	const mode = params.mode ?? "install";
	const installPolicyRequest = params.installPolicyRequest ?? {
		kind: "plugin-archive",
		requestedSpecifier: params.archivePath,
		source: localPluginInstallPolicySource("plugin-archive")
	};
	const archivePathResult = await runtime.resolveArchiveSourcePath(params.archivePath);
	if (!archivePathResult.ok) return archivePathResult;
	const archivePath = archivePathResult.path;
	let effectiveMode = mode;
	const result = await runtime.withExtractedArchiveRoot({
		archivePath,
		tempDirPrefix: "operator-plugin-",
		timeoutMs,
		logger,
		rootMarkers: PLUGIN_ARCHIVE_ROOT_MARKERS,
		onExtracted: async (sourceDir) => await installPluginFromSourceDir({
			sourceDir,
			...pickPackageInstallCommonParams({
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				extensionsDir: params.extensionsDir,
				timeoutMs,
				logger,
				mode,
				dryRun: params.dryRun,
				config: params.config,
				expectedPluginId: params.expectedPluginId,
				trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall,
				requirePluginManifest: true,
				installPolicyRequest,
				onEffectiveMode: (resolvedMode) => {
					effectiveMode = resolvedMode;
				}
			})
		})
	});
	emitSuccessfulPluginInstallSecurityEvent(result, {
		dryRun: params.dryRun,
		mode: effectiveMode,
		sourceFamily: "archive",
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall
	});
	return result;
}
async function installPluginFromDir(params) {
	const runtime = await loadPluginInstallRuntime();
	const dirPath = require_home_dir.resolveUserPath(params.dirPath);
	const installPolicyRequest = params.installPolicyRequest ?? {
		kind: "plugin-dir",
		requestedSpecifier: params.dirPath,
		source: localPluginInstallPolicySource("plugin-dir")
	};
	if (!await runtime.fileExists(dirPath)) return {
		ok: false,
		error: `directory not found: ${dirPath}`
	};
	if (!(await node_fs_promises.default.stat(dirPath)).isDirectory()) return {
		ok: false,
		error: `not a directory: ${dirPath}`
	};
	let effectiveMode = params.mode ?? "install";
	const result = await installPluginFromSourceDir({
		sourceDir: dirPath,
		...pickPackageInstallCommonParams({
			...params,
			installPolicyRequest,
			onEffectiveMode: (resolvedMode) => {
				effectiveMode = resolvedMode;
			}
		})
	});
	emitSuccessfulPluginInstallSecurityEvent(result, {
		dryRun: params.dryRun,
		mode: effectiveMode,
		sourceFamily: sourceFamilyForInstallPolicyKind(installPolicyRequest.kind, "directory"),
		trustedSourceLinkedOfficialInstall: params.trustedSourceLinkedOfficialInstall
	});
	return result;
}
async function installPluginFromPath(params) {
	const runtime = await loadPluginInstallRuntime();
	const pathResult = await runtime.resolveExistingInstallPath(params.path);
	if (!pathResult.ok) return pathResult;
	const { resolvedPath: resolved, stat } = pathResult;
	const packageInstallOptions = pickPackageInstallCommonParams(params);
	if (stat.isDirectory()) return await installPluginFromDir({
		dirPath: resolved,
		...packageInstallOptions,
		installPolicyRequest: installPolicyRequestForPath(params, "plugin-dir")
	});
	if (runtime.resolveArchiveKind(resolved)) return await installPluginFromArchive({
		archivePath: resolved,
		...packageInstallOptions,
		installPolicyRequest: installPolicyRequestForPath(params, "plugin-archive")
	});
	return {
		ok: false,
		code: PLUGIN_INSTALL_ERROR_CODE.UNSUPPORTED_PLAIN_FILE_PLUGIN,
		error: "Plain file plugin installs are not supported. Install a plugin directory or archive that contains operator.plugin.json, or list standalone plugin files in plugins.load.paths."
	};
}
//#endregion
//#region src/plugins/clawhub-error-codes.ts
/** Stable ClawHub install error codes used by plugin install policy and diagnostics. */
const CLAWHUB_INSTALL_ERROR_CODE = {
	INVALID_SPEC: "invalid_spec",
	PACKAGE_NOT_FOUND: "package_not_found",
	VERSION_NOT_FOUND: "version_not_found",
	NO_INSTALLABLE_VERSION: "no_installable_version",
	SKILL_PACKAGE: "skill_package",
	UNSUPPORTED_FAMILY: "unsupported_family",
	PRIVATE_PACKAGE: "private_package",
	INCOMPATIBLE_PLUGIN_API: "incompatible_plugin_api",
	INCOMPATIBLE_GATEWAY: "incompatible_gateway",
	ARTIFACT_UNAVAILABLE: "artifact_unavailable",
	MISSING_ARCHIVE_INTEGRITY: "missing_archive_integrity",
	ARTIFACT_DOWNLOAD_UNAVAILABLE: "artifact_download_unavailable",
	ARCHIVE_INTEGRITY_MISMATCH: "archive_integrity_mismatch",
	CLAWHUB_SECURITY_UNAVAILABLE: "clawhub_security_unavailable",
	CLAWHUB_RISK_ACKNOWLEDGEMENT_REQUIRED: "clawhub_risk_acknowledgement_required",
	CLAWHUB_DOWNLOAD_BLOCKED: "clawhub_download_blocked"
};
//#endregion
Object.defineProperty(exports, "CLAWHUB_INSTALL_ERROR_CODE", {
	enumerable: true,
	get: function() {
		return CLAWHUB_INSTALL_ERROR_CODE;
	}
});
Object.defineProperty(exports, "PLUGIN_INSTALL_ERROR_CODE", {
	enumerable: true,
	get: function() {
		return PLUGIN_INSTALL_ERROR_CODE;
	}
});
Object.defineProperty(exports, "emitPluginAuditSecurityEvent", {
	enumerable: true,
	get: function() {
		return emitPluginAuditSecurityEvent;
	}
});
Object.defineProperty(exports, "emitPluginInstallSecurityEvent", {
	enumerable: true,
	get: function() {
		return emitPluginInstallSecurityEvent;
	}
});
Object.defineProperty(exports, "installPluginFromArchive", {
	enumerable: true,
	get: function() {
		return installPluginFromArchive;
	}
});
Object.defineProperty(exports, "installPluginFromInstalledPackageDir", {
	enumerable: true,
	get: function() {
		return installPluginFromInstalledPackageDir;
	}
});
Object.defineProperty(exports, "installPluginFromNpmPackArchive", {
	enumerable: true,
	get: function() {
		return installPluginFromNpmPackArchive;
	}
});
Object.defineProperty(exports, "installPluginFromNpmSpec", {
	enumerable: true,
	get: function() {
		return installPluginFromNpmSpec;
	}
});
Object.defineProperty(exports, "installPluginFromPath", {
	enumerable: true,
	get: function() {
		return installPluginFromPath;
	}
});
Object.defineProperty(exports, "pluginAuditOutcomeForReason", {
	enumerable: true,
	get: function() {
		return pluginAuditOutcomeForReason;
	}
});
