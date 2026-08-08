const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_installed_plugin_index_store = require("./installed-plugin-index-store-vrROJGFd.cjs");
require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_config = require("./config-DT0qiglW.cjs");
require("./archive-HshK6KD3.cjs");
require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_nix_mode_write_guard = require("./nix-mode-write-guard-mnuDSCNv.cjs");
const require_bundled_sources = require("./bundled-sources-xMGcgjbI.cjs");
const require_install_provenance = require("./install-provenance-Bl-7v9O6.cjs");
const require_install_persistence = require("./install-persistence-BlOFu5Bz.cjs");
const require_bundled_install = require("./bundled-install-BH8SXUIZ.cjs");
const require_clawhub_error_codes = require("./clawhub-error-codes-BKV6QaJg.cjs");
const require_plugin_install_plan = require("./plugin-install-plan-XBeFJs16.cjs");
const require_clawhub_install_records = require("./clawhub-install-records-EIHewKTB.cjs");
const require_clawhub$1 = require("./clawhub-FY3ULXyp.cjs");
const require_git_install = require("./git-install-DIh4esrE.cjs");
const require_marketplace = require("./marketplace-iJF1Yup-.cjs");
const require_prompt = require("./prompt-VQppewrU.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
let _openclaw_fs_safe_archive = require("@openclaw/fs-safe/archive");
//#region src/cli/clawhub-risk-acknowledgement.ts
function canPromptForClawHubRisk() {
	return process.stdin.isTTY && process.stdout.isTTY;
}
function resolveClawHubRiskAcknowledgementCliOptions(params) {
	return {
		acknowledgeClawHubRisk: params.acknowledgeClawHubRisk,
		onClawHubRisk: params.acknowledgeClawHubRisk || params.allowPrompt === false || !canPromptForClawHubRisk() ? void 0 : async (request) => {
			const packageName = require_safe_text.sanitizeTerminalText(request.packageName);
			const releaseLabel = `${packageName}@${require_safe_text.sanitizeTerminalText(request.version)}`;
			if (request.acknowledgementKind === "type-package") return (await require_prompt.promptText(`type: '${packageName}' to ${params.action === "installing" ? "install" : "update"} anyway\n> `)).trim() === packageName;
			return await require_prompt.promptYesNo(`${params.action === "installing" ? "Install" : "Update"} ClawHub package "${releaseLabel}" after reviewing the warning above?`);
		}
	};
}
//#endregion
//#region src/hooks/installs.ts
/** Return config with one hook install record merged into hooks.internal.installs. */
function recordHookInstall(cfg, update) {
	const { hookId, ...record } = update;
	const installs = {
		...cfg.hooks?.internal?.installs,
		[hookId]: {
			...cfg.hooks?.internal?.installs?.[hookId],
			...record,
			installedAt: record.installedAt ?? (/* @__PURE__ */ new Date()).toISOString()
		}
	};
	return {
		...cfg,
		hooks: {
			...cfg.hooks,
			internal: {
				...cfg.hooks?.internal,
				installs: {
					...installs,
					[hookId]: (0, _gabrielvfonseca_normalization_core.expectDefined)(installs[hookId], "installs entry at hook id")
				}
			}
		}
	};
}
//#endregion
//#region src/cli/hook-install-persistence.ts
async function persistHookPackInstall(params) {
	const runtime = params.runtime ?? require_runtime.defaultRuntime;
	let next = require_bundled_install.enableInternalHookEntries(params.snapshot.config, params.hooks);
	next = recordHookInstall(next, {
		hookId: params.hookPackId,
		hooks: params.hooks,
		...params.install
	});
	await require_config.replaceConfigFile({
		nextConfig: next,
		baseHash: params.snapshot.baseHash,
		writeOptions: params.snapshot.writeOptions
	});
	runtime.log(params.successMessage ?? `Installed hook pack: ${params.hookPackId}`);
	require_bundled_install.logHookPackRestartHint(runtime);
	return next;
}
//#endregion
//#region src/cli/install-spec.ts
/** Detect specs that should be interpreted as local file/path installs. */
function looksLikeLocalInstallSpec(spec, knownSuffixes) {
	return spec.startsWith(".") || spec.startsWith("~") || node_path.default.isAbsolute(spec) || knownSuffixes.some((suffix) => spec.endsWith(suffix));
}
//#endregion
//#region src/cli/non-clawhub-install-acknowledgement.ts
function canPromptForNonClawHubInstall() {
	return process.stdin.isTTY && process.stdout.isTTY;
}
async function confirmNonClawHubInstall(params) {
	const warning = require_install_provenance.formatNonClawHubInstallWarning({
		sourceClass: params.sourceClass,
		spec: params.spec
	});
	if (params.acknowledged) {
		params.runtime.log(require_theme.theme.warn(warning));
		return true;
	}
	if (canPromptForNonClawHubInstall()) {
		params.runtime.log(require_theme.theme.warn(warning));
		return await require_prompt.promptYesNo("Install this non-ClawHub plugin source?");
	}
	params.runtime.error(`${warning}\nInstall cancelled; rerun with ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG} after reviewing the source.`);
	return false;
}
//#endregion
//#region src/cli/plugin-install-config-policy.ts
function readBundledInstallRecoveryMetadata(rootDir) {
	const packageJsonPath = node_path.default.join(rootDir, "package.json");
	if (!node_fs.default.existsSync(packageJsonPath)) return { allowInvalidConfigRecovery: false };
	const manifest = require_manifest.loadPluginManifest(rootDir, false);
	const pluginId = manifest.ok ? manifest.manifest.id : void 0;
	const parsed = (0, _openclaw_fs_safe_json.tryReadJsonSync)(packageJsonPath);
	return {
		...pluginId ? { pluginId } : {},
		allowInvalidConfigRecovery: parsed?.operator?.install?.allowInvalidConfigRecovery === true
	};
}
function resolveBundledInstallRecoveryMetadata(request) {
	if (request.marketplace) return {};
	if (request.resolvedPath && node_fs.default.existsSync(node_path.default.join(request.resolvedPath, "package.json"))) {
		const direct = readBundledInstallRecoveryMetadata(request.resolvedPath);
		if (direct.pluginId || direct.allowInvalidConfigRecovery) return direct;
	}
	if (require_bundled_install.resolveFileNpmSpecToLocalPath(request.rawSpec) !== null || request.resolvedPath !== void 0 && node_fs.default.existsSync(request.resolvedPath)) return {};
	const rawNpmPrefixSpec = require_bundled_install.parseNpmPrefixSpec(request.rawSpec);
	const normalizedNpmPrefixSpec = require_bundled_install.parseNpmPrefixSpec(request.normalizedSpec);
	for (const value of [
		request.rawSpec.trim(),
		request.normalizedSpec.trim(),
		rawNpmPrefixSpec ?? "",
		normalizedNpmPrefixSpec ?? ""
	]) {
		if (!value) continue;
		const bundled = require_bundled_sources.findBundledPluginSource({ lookup: {
			kind: "npmSpec",
			value
		} });
		if (!bundled) continue;
		const recovered = readBundledInstallRecoveryMetadata(bundled.localPath);
		return {
			pluginId: recovered.pluginId ?? bundled.pluginId,
			allowInvalidConfigRecovery: recovered.allowInvalidConfigRecovery
		};
	}
	return {};
}
function resolveOfficialExternalInstallRecoveryMetadata(request) {
	if (request.marketplace) return {};
	if (require_bundled_install.resolveFileNpmSpecToLocalPath(request.rawSpec) !== null) return {};
	if (node_fs.default.existsSync(require_home_dir.resolveUserPath(request.rawSpec))) return {};
	const rawNpmPrefixSpec = require_bundled_install.parseNpmPrefixSpec(request.rawSpec);
	const normalizedNpmPrefixSpec = require_bundled_install.parseNpmPrefixSpec(request.normalizedSpec);
	const values = new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)([
		request.rawSpec,
		request.normalizedSpec,
		rawNpmPrefixSpec ?? "",
		normalizedNpmPrefixSpec ?? "",
		require_npm_registry_spec.parseRegistryNpmSpec(request.rawSpec)?.name ?? "",
		require_npm_registry_spec.parseRegistryNpmSpec(request.normalizedSpec)?.name ?? "",
		rawNpmPrefixSpec ? require_npm_registry_spec.parseRegistryNpmSpec(rawNpmPrefixSpec)?.name : "",
		normalizedNpmPrefixSpec ? require_npm_registry_spec.parseRegistryNpmSpec(normalizedNpmPrefixSpec)?.name : ""
	]));
	if (values.size === 0) return {};
	for (const entry of require_official_external_plugin_catalog.listOfficialExternalPluginCatalogEntries()) {
		const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry);
		const npmSpec = install?.npmSpec?.trim() || entry.name?.trim();
		if (!npmSpec || !values.has(npmSpec)) continue;
		const pluginId = require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry);
		return {
			...pluginId ? { pluginId } : {},
			allowInvalidConfigRecovery: install?.allowInvalidConfigRecovery === true
		};
	}
	return {};
}
/** Resolve install metadata from the raw spec before Commander action handlers mutate config. */
function resolvePluginInstallRequestContext(params) {
	if (params.marketplace) return {
		ok: true,
		request: {
			rawSpec: params.rawSpec,
			normalizedSpec: params.rawSpec,
			installKind: "plugin",
			marketplace: params.marketplace
		}
	};
	const fileSpec = require_bundled_install.resolveFileNpmSpecToLocalPath(params.rawSpec);
	if (fileSpec && !fileSpec.ok) return {
		ok: false,
		error: fileSpec.error
	};
	const normalizedSpec = fileSpec?.ok ? fileSpec.path : params.rawSpec;
	const bundledRecovered = resolveBundledInstallRecoveryMetadata({
		rawSpec: params.rawSpec,
		normalizedSpec,
		resolvedPath: require_home_dir.resolveUserPath(normalizedSpec),
		marketplace: params.marketplace
	});
	const officialRecovered = resolveOfficialExternalInstallRecoveryMetadata({
		rawSpec: params.rawSpec,
		normalizedSpec,
		marketplace: params.marketplace
	});
	const recovered = officialRecovered.pluginId || officialRecovered.allowInvalidConfigRecovery !== void 0 ? officialRecovered : bundledRecovered;
	return {
		ok: true,
		request: {
			rawSpec: params.rawSpec,
			normalizedSpec,
			resolvedPath: require_home_dir.resolveUserPath(normalizedSpec),
			...params.installKind === "plugin" || recovered.pluginId ? { installKind: "plugin" } : {},
			...recovered.pluginId ? { bundledPluginId: recovered.pluginId } : {},
			...recovered.allowInvalidConfigRecovery !== void 0 ? { allowInvalidConfigRecovery: recovered.allowInvalidConfigRecovery } : {}
		}
	};
}
/** Decide whether invalid config should block a command before plugin recovery can run. */
function resolvePluginInstallInvalidConfigPolicy(request) {
	if (!request) return "deny";
	return request.allowInvalidConfigRecovery === true ? "allow-plugin-recovery" : "deny";
}
//#endregion
//#region src/cli/plugins-location-bridges.ts
/** List exact previous bundled paths that an explicit plugin reinstall may recover. */
async function listPersistedBundledPluginRecoveryLocations(options) {
	const index = await require_installed_plugin_index_store.readPersistedInstalledPluginIndex(options);
	if (!index) return [];
	return index.plugins.flatMap((record) => {
		const rootDir = record.rootDir.trim();
		if (record.origin !== "bundled" || !node_path.default.isAbsolute(rootDir)) return [];
		const loadPaths = Array.from(/* @__PURE__ */ new Set([rootDir, ...require_discovery.buildBundledPluginLoadPathAliases(rootDir).map((alias) => alias.path)]));
		return [{
			pluginId: record.pluginId,
			loadPaths
		}];
	});
}
//#endregion
//#region src/cli/plugins-install-command.ts
function isClawHubBlockedCliFailure(result) {
	return result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_DOWNLOAD_BLOCKED && typeof result.warning === "string" && result.warning.trim().length > 0;
}
function resolveInstallMode(force) {
	return force ? "update" : "install";
}
function resolveInstallSafetyOverrides(overrides) {
	return {
		config: overrides.config,
		dangerouslyForceUnsafeInstall: overrides.dangerouslyForceUnsafeInstall,
		trustedSourceLinkedOfficialInstall: overrides.trustedSourceLinkedOfficialInstall
	};
}
async function probeHookPackFromNpmSpec(params) {
	try {
		return await require_bundled_install.installHooksFromNpmSpec(params);
	} catch (error) {
		return {
			ok: false,
			error: require_errors.formatErrorMessage(error)
		};
	}
}
async function probeHookPackFromPath(params) {
	try {
		return await require_bundled_install.installHooksFromPath(params);
	} catch (error) {
		return {
			ok: false,
			error: require_errors.formatErrorMessage(error)
		};
	}
}
const DEPRECATED_DANGEROUS_FORCE_UNSAFE_INSTALL_WARNING = "--dangerously-force-unsafe-install is deprecated and no longer affects plugin installs because built-in install-time dangerous-code scanning has been removed. Configure security.installPolicy for operator-owned install decisions.";
function supportsPluginRecoveryIncludeShape(parsed) {
	if (Object.hasOwn(parsed, "$include")) return false;
	return require_install_persistence.supportsInstallConfigSingleTopLevelIncludeShape(parsed.plugins);
}
function resolveFullyBlockedConfigMutationReason(snapshot) {
	if (snapshot.pluginMutation.mode !== "blocked" || snapshot.hookMutation.mode !== "blocked") return null;
	if (snapshot.pluginMutation.reason === snapshot.hookMutation.reason) return snapshot.pluginMutation.reason;
	return `Config plugin and hook mutations are both blocked. ${snapshot.pluginMutation.reason} ${snapshot.hookMutation.reason}`;
}
function assertPluginConfigMutationAllowed(preflight) {
	if (preflight.mode === "blocked") throw buildInvalidPluginInstallConfigError(preflight.reason);
}
async function tryInstallHookPackFromLocalPath(params) {
	if (params.snapshot.hookMutation.mode === "blocked") return {
		ok: false,
		error: params.snapshot.hookMutation.reason
	};
	if (params.link) {
		if (!node_fs.default.statSync(params.resolvedPath).isDirectory()) return {
			ok: false,
			error: "Linked hook pack paths must be directories."
		};
		const probe = await require_bundled_install.installHooksFromPath({
			...resolveInstallSafetyOverrides(params.safetyOverrides ?? {}),
			path: params.resolvedPath,
			dryRun: true,
			...params.expectedPackageKind ? { expectedPackageKind: params.expectedPackageKind } : {}
		});
		if (!probe.ok) return probe;
		const merged = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...params.snapshot.config.hooks?.internal?.load?.extraDirs ?? [], params.resolvedPath]);
		await persistHookPackInstall({
			snapshot: {
				...params.snapshot,
				config: {
					...params.snapshot.config,
					hooks: {
						...params.snapshot.config.hooks,
						internal: {
							...params.snapshot.config.hooks?.internal,
							enabled: true,
							load: {
								...params.snapshot.config.hooks?.internal?.load,
								extraDirs: merged
							}
						}
					}
				}
			},
			hookPackId: probe.hookPackId,
			hooks: probe.hooks,
			install: {
				source: "path",
				sourcePath: params.resolvedPath,
				installPath: params.resolvedPath,
				version: probe.version
			},
			successMessage: `Linked hook pack path: ${require_utils.shortenHomePath(params.resolvedPath)}`,
			runtime: params.runtime
		});
		return { ok: true };
	}
	const result = await require_bundled_install.installHooksFromPath({
		...resolveInstallSafetyOverrides(params.safetyOverrides ?? {}),
		path: params.resolvedPath,
		mode: params.installMode,
		...params.expectedPackageKind ? { expectedPackageKind: params.expectedPackageKind } : {},
		logger: require_bundled_install.createHookPackInstallLogger(params.runtime)
	});
	if (!result.ok) return result;
	const source = (0, _openclaw_fs_safe_archive.resolveArchiveKind)(params.resolvedPath) ? "archive" : "path";
	await persistHookPackInstall({
		snapshot: params.snapshot,
		hookPackId: result.hookPackId,
		hooks: result.hooks,
		install: {
			source,
			sourcePath: params.resolvedPath,
			installPath: result.targetDir,
			version: result.version
		},
		runtime: params.runtime
	});
	return { ok: true };
}
async function tryInstallHookPackFromNpmSpec(params) {
	if (params.snapshot.hookMutation.mode === "blocked") return {
		ok: false,
		error: params.snapshot.hookMutation.reason
	};
	const result = await require_bundled_install.installHooksFromNpmSpec({
		config: params.snapshot.config,
		spec: params.spec,
		mode: params.installMode,
		...params.expectedIntegrity ? { expectedIntegrity: params.expectedIntegrity } : {},
		...params.expectedPackageKind ? { expectedPackageKind: params.expectedPackageKind } : {},
		logger: require_bundled_install.createHookPackInstallLogger(params.runtime)
	});
	if (!result.ok) return result;
	const installRecord = require_bundled_install.resolvePinnedNpmInstallRecordForCli(params.spec, Boolean(params.pin), result.targetDir, result.version, result.npmResolution, params.runtime?.log ?? require_runtime.defaultRuntime.log, require_theme.theme.warn);
	await persistHookPackInstall({
		snapshot: params.snapshot,
		hookPackId: result.hookPackId,
		hooks: result.hooks,
		install: installRecord,
		runtime: params.runtime
	});
	return { ok: true };
}
async function tryInstallPluginOrHookPackFromNpmSpec(params) {
	const fullyBlockedReason = resolveFullyBlockedConfigMutationReason(params.snapshot);
	if (fullyBlockedReason) {
		(params.runtime ?? require_runtime.defaultRuntime).error(fullyBlockedReason);
		return { ok: false };
	}
	if (params.snapshot.pluginMutation.mode === "blocked" || params.snapshot.hookMutation.mode === "blocked") {
		const hookProbe = await probeHookPackFromNpmSpec({
			config: params.snapshot.config,
			spec: params.spec,
			mode: params.installMode,
			inspection: "package-kind",
			...params.expectedIntegrity ? { expectedIntegrity: params.expectedIntegrity } : {},
			logger: require_bundled_install.createHookPackInstallLogger(params.runtime)
		});
		if (hookProbe.ok && hookProbe.packageKind === "hook-only") {
			if (params.snapshot.hookMutation.mode === "blocked") {
				(params.runtime ?? require_runtime.defaultRuntime).error(params.snapshot.hookMutation.reason);
				return { ok: false };
			}
			const hookFallback = await tryInstallHookPackFromNpmSpec({
				snapshot: params.snapshot,
				installMode: params.installMode,
				spec: params.spec,
				pin: params.pin,
				expectedIntegrity: hookProbe.npmResolution?.integrity ?? params.expectedIntegrity,
				expectedPackageKind: "hook-only",
				runtime: params.runtime
			});
			if (hookFallback.ok) return { ok: true };
			(params.runtime ?? require_runtime.defaultRuntime).error(hookFallback.error);
			return { ok: false };
		}
		if (params.snapshot.pluginMutation.mode === "blocked") {
			(params.runtime ?? require_runtime.defaultRuntime).error(params.snapshot.pluginMutation.reason);
			return { ok: false };
		}
	}
	const result = await require_clawhub_error_codes.installPluginFromNpmSpec({
		...params.safetyOverrides,
		mode: params.installMode,
		spec: params.spec,
		...params.expectedPluginId ? { expectedPluginId: params.expectedPluginId } : {},
		...params.expectedIntegrity ? { expectedIntegrity: params.expectedIntegrity } : {},
		...params.trustedSourceLinkedOfficialInstall ? { trustedSourceLinkedOfficialInstall: true } : {},
		extensionsDir: params.extensionsDir,
		logger: require_bundled_install.createPluginInstallLogger(params.runtime)
	});
	if (!result.ok) {
		if (isTerminalPluginInstallFailure(result.code)) {
			(params.runtime ?? require_runtime.defaultRuntime).error(result.error);
			return { ok: false };
		}
		if (params.allowBundledFallback) {
			const bundledFallbackPlan = require_plugin_install_plan.resolveBundledInstallPlanForNpmFailure({
				rawSpec: params.spec,
				code: result.code,
				findBundledSource: (lookup) => require_bundled_sources.findBundledPluginSource({ lookup })
			});
			if (bundledFallbackPlan) {
				await require_bundled_install.installBundledPluginSource({
					snapshot: params.snapshot,
					rawSpec: params.spec,
					bundledSource: bundledFallbackPlan.bundledSource,
					warning: bundledFallbackPlan.warning,
					invalidateRuntimeCache: params.invalidateRuntimeCache,
					runtime: params.runtime
				});
				return { ok: true };
			}
		}
		const hookFallback = await tryInstallHookPackFromNpmSpec({
			snapshot: params.snapshot,
			installMode: params.installMode,
			spec: params.spec,
			pin: params.pin,
			expectedIntegrity: params.expectedIntegrity,
			runtime: params.runtime
		});
		if (hookFallback.ok) return { ok: true };
		(params.runtime ?? require_runtime.defaultRuntime).error(require_bundled_install.formatPluginInstallWithHookFallbackError(result.error, hookFallback));
		return { ok: false };
	}
	const installRecord = require_bundled_install.resolvePinnedNpmInstallRecordForCli(params.spec, Boolean(params.pin), result.targetDir, result.version, result.npmResolution, params.runtime?.log ?? require_runtime.defaultRuntime.log, require_theme.theme.warn);
	await require_install_persistence.persistPluginInstall({
		snapshot: params.snapshot,
		pluginId: result.pluginId,
		install: installRecord,
		invalidateRuntimeCache: params.invalidateRuntimeCache,
		runtime: params.runtime
	});
	return { ok: true };
}
async function tryInstallPluginFromNpmPackArchive(params) {
	const result = await require_clawhub_error_codes.installPluginFromNpmPackArchive({
		...params.safetyOverrides,
		mode: params.installMode,
		archivePath: params.archivePath,
		extensionsDir: params.extensionsDir,
		logger: require_bundled_install.createPluginInstallLogger(params.runtime)
	});
	if (!result.ok) {
		(params.runtime ?? require_runtime.defaultRuntime).error(result.error);
		return { ok: false };
	}
	await require_install_persistence.persistPluginInstall({
		snapshot: params.snapshot,
		pluginId: result.pluginId,
		install: {
			source: "npm",
			spec: result.npmResolution?.resolvedSpec ?? result.manifestName ?? result.pluginId,
			sourcePath: params.archivePath,
			installPath: result.targetDir,
			...result.version ? { version: result.version } : {},
			...result.npmResolution?.name ? { resolvedName: result.npmResolution.name } : {},
			...result.npmResolution?.version ? { resolvedVersion: result.npmResolution.version } : {},
			...result.npmResolution?.resolvedSpec ? { resolvedSpec: result.npmResolution.resolvedSpec } : {},
			...result.npmResolution?.integrity ? { integrity: result.npmResolution.integrity } : {},
			...result.npmResolution?.shasum ? { shasum: result.npmResolution.shasum } : {},
			...result.npmResolution?.resolvedAt ? { resolvedAt: result.npmResolution.resolvedAt } : {},
			artifactKind: "npm-pack",
			artifactFormat: "tgz",
			...result.npmResolution?.integrity ? { npmIntegrity: result.npmResolution.integrity } : {},
			...result.npmResolution?.shasum ? { npmShasum: result.npmResolution.shasum } : {},
			...result.npmTarballName ? { npmTarballName: result.npmTarballName } : {}
		},
		invalidateRuntimeCache: params.invalidateRuntimeCache,
		runtime: params.runtime
	});
	return { ok: true };
}
async function tryInstallPluginFromGitSpec(params) {
	const result = await require_git_install.installPluginFromGitSpec({
		...params.safetyOverrides,
		mode: params.installMode,
		spec: params.spec,
		extensionsDir: params.extensionsDir,
		logger: require_bundled_install.createPluginInstallLogger(params.runtime)
	});
	if (!result.ok) {
		(params.runtime ?? require_runtime.defaultRuntime).error(result.error);
		return { ok: false };
	}
	await require_install_persistence.persistPluginInstall({
		snapshot: params.snapshot,
		pluginId: result.pluginId,
		install: {
			source: "git",
			spec: params.spec,
			installPath: result.targetDir,
			version: result.version,
			resolvedAt: result.git.resolvedAt,
			gitUrl: result.git.url,
			gitRef: result.git.ref,
			gitCommit: result.git.commit
		},
		invalidateRuntimeCache: params.invalidateRuntimeCache,
		runtime: params.runtime
	});
	return { ok: true };
}
function isTerminalPluginInstallFailure(code) {
	return code === require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.SECURITY_SCAN_BLOCKED || code === require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.SECURITY_SCAN_FAILED || code === require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.UNSUPPORTED_PLAIN_FILE_PLUGIN;
}
function isAllowedPluginRecoveryIssue(issue, request, ownedLoadPaths) {
	const pluginId = request.bundledPluginId?.trim();
	if (!pluginId) return false;
	return issue.path === `channels.${pluginId}` && issue.message === `unknown channel id: ${pluginId}` || isOwnedMissingPluginLoadPathIssue(issue, ownedLoadPaths) || issue.path === `plugins.entries.${pluginId}` && typeof issue.message === "string" && issue.message.includes("requires compiled runtime output") || issue.path === "tools.web.search.provider" && typeof issue.message === "string" && issue.message.includes(`plugin "${pluginId}"`);
}
function buildInvalidPluginInstallConfigError(message) {
	const error = new Error(message);
	error.code = "INVALID_CONFIG";
	return error;
}
function extractMissingPluginLoadPath(issue) {
	if (issue.path !== "plugins.load.paths" || typeof issue.message !== "string") return null;
	const markerIndex = issue.message.indexOf("plugin path not found:");
	if (markerIndex < 0) return null;
	return issue.message.slice(markerIndex + 22).trim() || null;
}
function collectRequestedPluginInstallPaths(cfg, installRecords, request, env = process.env) {
	const pluginId = request.bundledPluginId?.trim();
	if (!pluginId) return /* @__PURE__ */ new Set();
	const paths = /* @__PURE__ */ new Set();
	const record = installRecords[pluginId] ?? cfg.plugins?.installs?.[pluginId];
	for (const value of [record?.sourcePath, record?.installPath]) if (typeof value === "string" && value.trim()) paths.add(require_home_dir.resolveUserPath(value, env));
	return paths;
}
function isOwnedMissingPluginLoadPathIssue(issue, ownedLoadPaths, env = process.env) {
	const missingPath = extractMissingPluginLoadPath(issue);
	return missingPath !== null && ownedLoadPaths.has(require_home_dir.resolveUserPath(missingPath, env));
}
async function collectRequestedPluginLocationBridgePaths(request, env) {
	const pluginId = request.bundledPluginId?.trim();
	if (!pluginId) return /* @__PURE__ */ new Set();
	const locations = await listPersistedBundledPluginRecoveryLocations({ env });
	return new Set(locations.filter((location) => location.pluginId === pluginId).flatMap((location) => location.loadPaths.map((loadPath) => require_home_dir.resolveUserPath(loadPath, env))));
}
function removeOwnedMissingPluginLoadPaths(cfg, issues, ownedLoadPaths, env = process.env) {
	const missingPaths = /* @__PURE__ */ new Set();
	for (const issue of issues) {
		const missingPath = extractMissingPluginLoadPath(issue);
		if (!missingPath) continue;
		const resolved = require_home_dir.resolveUserPath(missingPath, env);
		if (ownedLoadPaths.has(resolved)) missingPaths.add(resolved);
	}
	const paths = cfg.plugins?.load?.paths;
	if (missingPaths.size === 0 || !Array.isArray(paths)) return cfg;
	const nextPaths = paths.filter((entry) => typeof entry !== "string" || !missingPaths.has(require_home_dir.resolveUserPath(entry, env)));
	if (nextPaths.length === paths.length) return cfg;
	return {
		...cfg,
		plugins: {
			...cfg.plugins,
			load: {
				...cfg.plugins?.load,
				paths: nextPaths
			}
		}
	};
}
async function resolveRequestedPluginInstallPaths(cfg, issues, request, env = process.env) {
	if (!issues.some((issue) => extractMissingPluginLoadPath(issue) !== null)) return /* @__PURE__ */ new Set();
	const ownedLoadPaths = collectRequestedPluginInstallPaths(cfg, await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords(), request, env);
	if (issues.some((issue) => extractMissingPluginLoadPath(issue) !== null && !isOwnedMissingPluginLoadPathIssue(issue, ownedLoadPaths, env))) for (const loadPath of await collectRequestedPluginLocationBridgePaths(request, env)) ownedLoadPaths.add(loadPath);
	return ownedLoadPaths;
}
async function loadConfigFromSnapshotForInstall(request, prepared) {
	const { snapshot, writeOptions } = prepared;
	const mutationWriteOptions = require_install_persistence.selectInstallMutationWriteOptions(writeOptions);
	if (resolvePluginInstallInvalidConfigPolicy(request) !== "allow-plugin-recovery") throw buildInvalidPluginInstallConfigError("Config invalid; run `operator doctor --fix` before installing plugins.");
	const parsed = snapshot.parsed ?? {};
	if (!snapshot.exists || Object.keys(parsed).length === 0) throw buildInvalidPluginInstallConfigError("Config file could not be parsed; run `operator doctor` to repair it.");
	const ownedLoadPaths = await resolveRequestedPluginInstallPaths(snapshot.config, snapshot.issues, request, process.env);
	if (snapshot.legacyIssues.length > 0 || snapshot.issues.length === 0 || snapshot.issues.some((issue) => !isAllowedPluginRecoveryIssue(issue, request, ownedLoadPaths))) throw buildInvalidPluginInstallConfigError(`Config invalid outside the plugin recovery path for ${request.bundledPluginId ?? "the requested plugin"}; run \`operator doctor --fix\` before reinstalling it.`);
	if (!supportsPluginRecoveryIncludeShape(parsed)) throw buildInvalidPluginInstallConfigError("Config plugin recovery uses an unsupported $include shape; use a single-file top-level plugins include or run `operator doctor --fix` before reinstalling it.");
	const { hookMutation, pluginMutation } = require_install_persistence.resolveInstallConfigMutationPreflights({
		parsed,
		snapshotPath: snapshot.path,
		writeOptions: mutationWriteOptions
	});
	assertPluginConfigMutationAllowed(pluginMutation);
	return {
		config: removeOwnedMissingPluginLoadPaths(snapshot.config, snapshot.issues, ownedLoadPaths, process.env),
		baseHash: snapshot.hash,
		writeOptions: mutationWriteOptions,
		hookMutation,
		pluginMutation
	};
}
async function loadConfigForInstall(request) {
	const prepared = await require_discovery.tracePluginLifecyclePhaseAsync("config read", () => require_io.readConfigFileSnapshotForWrite(), { command: "install" });
	const { snapshot, writeOptions } = prepared;
	const mutationWriteOptions = require_install_persistence.selectInstallMutationWriteOptions(writeOptions);
	if (snapshot.valid) {
		const { hookMutation, pluginMutation } = require_install_persistence.resolveInstallConfigMutationPreflights({
			parsed: snapshot.parsed ?? {},
			snapshotPath: snapshot.path,
			writeOptions: mutationWriteOptions
		});
		if (request.installKind === "plugin") assertPluginConfigMutationAllowed(pluginMutation);
		return {
			config: snapshot.sourceConfig,
			baseHash: snapshot.hash,
			writeOptions: mutationWriteOptions,
			hookMutation,
			pluginMutation
		};
	}
	return loadConfigFromSnapshotForInstall(request, prepared);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.pluginsInstallCommandTestApi")] = { loadConfigForInstall };
async function runPluginInstallCommand(params) {
	require_nix_mode_write_guard.assertConfigWriteAllowedInCurrentMode();
	const runtime = params.runtime ?? require_runtime.defaultRuntime;
	const invalidateRuntimeCache = params.invalidateRuntimeCache ?? true;
	const shorthand = !params.opts.marketplace ? await require_discovery.tracePluginLifecyclePhaseAsync("marketplace shortcut resolution", () => require_marketplace.resolveMarketplaceInstallShortcut(params.raw), { command: "install" }) : null;
	if (shorthand?.ok === false) {
		runtime.error(shorthand.error);
		return runtime.exit(1);
	}
	const raw = shorthand?.ok ? shorthand.plugin : params.raw;
	const opts = {
		...params.opts,
		marketplace: params.opts.marketplace ?? (shorthand?.ok ? shorthand.marketplaceSource : void 0)
	};
	if (opts.dangerouslyForceUnsafeInstall) runtime.log(require_theme.theme.warn(DEPRECATED_DANGEROUS_FORCE_UNSAFE_INSTALL_WARNING));
	if (opts.marketplace) {
		if (opts.link) {
			runtime.error(`--link is not supported with --marketplace. Remove --link, or install a local path with ${require_command_format.formatCliCommand(`operator plugins install --link <path> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)}.`);
			return runtime.exit(1);
		}
		if (opts.pin) {
			runtime.error(`--pin is not supported with --marketplace. Use ${require_command_format.formatCliCommand(`operator plugins install <plugin> --marketplace <name> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)} without --pin.`);
			return runtime.exit(1);
		}
	}
	const gitPrefix = raw.trim().toLowerCase().startsWith("git:");
	const gitSpec = require_git_install.parseGitPluginSpec(raw);
	if (gitPrefix && !gitSpec) {
		runtime.error(`Unsupported git plugin spec: ${raw}. Use ${require_command_format.formatCliCommand(`operator plugins install git:<repo>@<ref> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)}.`);
		return runtime.exit(1);
	}
	if (gitSpec && opts.link) {
		runtime.error(`--link is not supported with git: installs. Use ${require_command_format.formatCliCommand(`operator plugins install git:<repo>@<ref> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)} for Git installs or ${require_command_format.formatCliCommand(`operator plugins install --link <path> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)} for local paths.`);
		return runtime.exit(1);
	}
	if (gitSpec && opts.pin) {
		runtime.error(`--pin is not supported with git: installs. Pin the ref in the spec instead, for example ${require_command_format.formatCliCommand(`operator plugins install git:<repo>@<ref> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)}.`);
		return runtime.exit(1);
	}
	const npmPackPath = require_bundled_install.parseNpmPackPrefixPath(raw);
	const clawhubSpec = require_clawhub.parseClawHubPluginSpec(raw);
	const requestResolution = resolvePluginInstallRequestContext({
		rawSpec: raw,
		marketplace: opts.marketplace
	});
	if (!requestResolution.ok) {
		runtime.error(requestResolution.error);
		return runtime.exit(1);
	}
	let request = requestResolution.request;
	const resolved = request.resolvedPath ?? request.normalizedSpec;
	const resolvesToLocalPath = node_fs.default.existsSync(resolved);
	if (!resolvesToLocalPath && (gitSpec || npmPackPath !== null || clawhubSpec)) request = {
		...request,
		installKind: "plugin"
	};
	const bundledPreNpmPlan = resolvesToLocalPath ? null : require_plugin_install_plan.resolveBundledInstallPlanBeforeNpm({
		rawSpec: raw,
		findBundledSource: (lookup) => require_bundled_sources.findBundledPluginSource({ lookup })
	});
	const officialExternalPlan = resolvesToLocalPath ? null : require_install_provenance.resolveCatalogOfficialExternalInstallPlan(raw);
	if (bundledPreNpmPlan || officialExternalPlan) request = {
		...request,
		installKind: "plugin"
	};
	const snapshot = await loadConfigForInstall(request).catch((error) => {
		runtime.error(require_errors.formatErrorMessage(error));
		return null;
	});
	if (!snapshot) return runtime.exit(1);
	const cfg = snapshot.config;
	const installMode = resolveInstallMode(opts.force && !opts.link);
	const safetyOverrides = resolveInstallSafetyOverrides({
		...opts,
		config: cfg
	});
	const extensionsDir = require_install_paths.resolveDefaultPluginExtensionsDir();
	const acknowledgeNonClawHubSource = async (sourceClass, spec) => await confirmNonClawHubInstall({
		acknowledged: opts.force,
		runtime,
		sourceClass,
		spec
	});
	if (opts.marketplace) {
		if (!await acknowledgeNonClawHubSource("marketplace", `${raw} from ${opts.marketplace}`)) return runtime.exit(1);
		const result = await require_marketplace.installPluginFromMarketplace({
			...safetyOverrides,
			marketplace: opts.marketplace,
			mode: installMode,
			plugin: raw,
			extensionsDir,
			logger: require_bundled_install.createPluginInstallLogger(runtime)
		});
		if (!result.ok) {
			if (!isClawHubBlockedCliFailure(result)) runtime.error(result.error);
			return runtime.exit(1);
		}
		await require_install_persistence.persistPluginInstall({
			snapshot,
			pluginId: result.pluginId,
			install: {
				source: "marketplace",
				installPath: result.targetDir,
				version: result.version,
				marketplaceName: result.marketplaceName,
				marketplaceSource: result.marketplaceSource,
				marketplacePlugin: result.marketplacePlugin
			},
			invalidateRuntimeCache,
			runtime
		});
		return;
	}
	if (node_fs.default.existsSync(resolved)) {
		if (!((0, _openclaw_fs_safe_archive.resolveArchiveKind)(resolved) ? void 0 : require_bundled_sources.findBundledPluginSource({ lookup: {
			kind: "localPath",
			value: resolved
		} })) && !await acknowledgeNonClawHubSource((0, _openclaw_fs_safe_archive.resolveArchiveKind)(resolved) ? "local-archive" : "local-path", resolved)) return runtime.exit(1);
		const fullyBlockedReason = resolveFullyBlockedConfigMutationReason(snapshot);
		if (fullyBlockedReason) {
			runtime.error(fullyBlockedReason);
			return runtime.exit(1);
		}
		if (snapshot.pluginMutation.mode === "blocked" || snapshot.hookMutation.mode === "blocked") {
			const hookProbe = await probeHookPackFromPath({
				...safetyOverrides,
				path: resolved,
				mode: installMode,
				inspection: "package-kind"
			});
			if (hookProbe.ok && hookProbe.packageKind === "hook-only") {
				if (snapshot.hookMutation.mode === "blocked") {
					runtime.error(snapshot.hookMutation.reason);
					return runtime.exit(1);
				}
				const hookFallback = await tryInstallHookPackFromLocalPath({
					snapshot,
					installMode,
					resolvedPath: resolved,
					safetyOverrides,
					...opts.link ? { link: true } : {},
					expectedPackageKind: "hook-only",
					runtime
				});
				if (hookFallback.ok) return;
				runtime.error(hookFallback.error);
				return runtime.exit(1);
			}
			if (snapshot.pluginMutation.mode === "blocked") {
				runtime.error(snapshot.pluginMutation.reason);
				return runtime.exit(1);
			}
		}
		if (opts.link) {
			const merged = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...cfg.plugins?.load?.paths ?? [], resolved]);
			const probe = await require_clawhub_error_codes.installPluginFromPath({
				...safetyOverrides,
				mode: installMode,
				path: resolved,
				dryRun: true,
				allowSourceTypeScriptEntries: true,
				extensionsDir,
				logger: require_bundled_install.createPluginInstallLogger(runtime)
			});
			if (!probe.ok) {
				if (isTerminalPluginInstallFailure(probe.code)) {
					runtime.error(probe.error);
					return runtime.exit(1);
				}
				const hookFallback = await tryInstallHookPackFromLocalPath({
					snapshot,
					installMode,
					resolvedPath: resolved,
					safetyOverrides,
					link: true,
					runtime
				});
				if (hookFallback.ok) return;
				runtime.error(require_bundled_install.formatPluginInstallWithHookFallbackError(probe.error, hookFallback));
				return runtime.exit(1);
			}
			await require_install_persistence.persistPluginInstall({
				snapshot: {
					...snapshot,
					config: {
						...cfg,
						plugins: {
							...cfg.plugins,
							load: {
								...cfg.plugins?.load,
								paths: merged
							}
						}
					}
				},
				pluginId: probe.pluginId,
				install: {
					source: "path",
					sourcePath: resolved,
					installPath: resolved,
					version: probe.version
				},
				invalidateRuntimeCache,
				successMessage: `Linked plugin path: ${require_utils.shortenHomePath(resolved)}`,
				runtime
			});
			return;
		}
		const result = await require_clawhub_error_codes.installPluginFromPath({
			...safetyOverrides,
			mode: installMode,
			path: resolved,
			extensionsDir,
			logger: require_bundled_install.createPluginInstallLogger(runtime)
		});
		if (!result.ok) {
			if (isTerminalPluginInstallFailure(result.code)) {
				runtime.error(result.error);
				return runtime.exit(1);
			}
			const hookFallback = await tryInstallHookPackFromLocalPath({
				snapshot,
				installMode,
				resolvedPath: resolved,
				safetyOverrides,
				runtime
			});
			if (hookFallback.ok) return;
			runtime.error(require_bundled_install.formatPluginInstallWithHookFallbackError(result.error, hookFallback));
			return runtime.exit(1);
		}
		const source = (0, _openclaw_fs_safe_archive.resolveArchiveKind)(resolved) ? "archive" : "path";
		await require_install_persistence.persistPluginInstall({
			snapshot,
			pluginId: result.pluginId,
			install: {
				source,
				sourcePath: resolved,
				installPath: result.targetDir,
				version: result.version
			},
			invalidateRuntimeCache,
			runtime
		});
		return;
	}
	if (opts.link) {
		runtime.error(`--link requires a local path. Run ${require_command_format.formatCliCommand(`operator plugins install --link <path> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)}.`);
		return runtime.exit(1);
	}
	const npmPrefixSpec = require_bundled_install.parseNpmPrefixSpec(raw);
	if (npmPrefixSpec !== null) {
		if (!npmPrefixSpec) {
			runtime.error(`Unsupported npm plugin spec: missing package. Use ${require_command_format.formatCliCommand(`operator plugins install npm:<package> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)}.`);
			return runtime.exit(1);
		}
		const trustedNpmInstall = require_install_provenance.resolveOperatorTrustedNpmPackageInstall(npmPrefixSpec);
		if (!trustedNpmInstall && !await acknowledgeNonClawHubSource("npm", npmPrefixSpec)) return runtime.exit(1);
		if (!(await tryInstallPluginOrHookPackFromNpmSpec({
			snapshot,
			installMode,
			spec: npmPrefixSpec,
			pin: opts.pin,
			safetyOverrides,
			allowBundledFallback: false,
			extensionsDir,
			invalidateRuntimeCache,
			...trustedNpmInstall ? {
				expectedPluginId: trustedNpmInstall.pluginId,
				...trustedNpmInstall.expectedIntegrity ? { expectedIntegrity: trustedNpmInstall.expectedIntegrity } : {},
				trustedSourceLinkedOfficialInstall: true
			} : {},
			runtime
		})).ok) return runtime.exit(1);
		return;
	}
	if (npmPackPath !== null) {
		if (!npmPackPath) {
			runtime.error(`Unsupported npm-pack plugin spec: missing archive path. Use ${require_command_format.formatCliCommand(`operator plugins install npm-pack:<path-to.tgz> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)}.`);
			return runtime.exit(1);
		}
		if (!await acknowledgeNonClawHubSource("npm-pack", raw)) return runtime.exit(1);
		if (!(await tryInstallPluginFromNpmPackArchive({
			snapshot,
			installMode,
			archivePath: npmPackPath,
			safetyOverrides,
			extensionsDir,
			invalidateRuntimeCache,
			runtime
		})).ok) return runtime.exit(1);
		return;
	}
	if (gitSpec) {
		if (!await acknowledgeNonClawHubSource("git", raw)) return runtime.exit(1);
		if (!(await tryInstallPluginFromGitSpec({
			snapshot,
			installMode,
			spec: raw,
			safetyOverrides,
			extensionsDir,
			invalidateRuntimeCache,
			runtime
		})).ok) return runtime.exit(1);
		return;
	}
	if (looksLikeLocalInstallSpec(raw, [
		".ts",
		".js",
		".mjs",
		".cjs",
		".tgz",
		".tar.gz",
		".tar",
		".zip"
	])) {
		runtime.error(`Plugin path not found: ${resolved}. Check the path, or install from npm with ${require_command_format.formatCliCommand(`operator plugins install npm:<package> ${require_install_provenance.NON_CLAWHUB_INSTALL_FORCE_FLAG}`)}.`);
		return runtime.exit(1);
	}
	if (bundledPreNpmPlan) {
		await require_discovery.tracePluginLifecyclePhaseAsync("install execution", () => require_bundled_install.installBundledPluginSource({
			snapshot,
			rawSpec: raw,
			bundledSource: bundledPreNpmPlan.bundledSource,
			warning: bundledPreNpmPlan.warning,
			invalidateRuntimeCache,
			runtime
		}), {
			command: "install",
			source: "bundled",
			pluginId: bundledPreNpmPlan.bundledSource.pluginId
		});
		return;
	}
	if (officialExternalPlan) {
		if (!(await tryInstallPluginOrHookPackFromNpmSpec({
			snapshot,
			installMode,
			spec: officialExternalPlan.npmSpec,
			pin: opts.pin,
			safetyOverrides,
			allowBundledFallback: false,
			extensionsDir,
			expectedPluginId: officialExternalPlan.pluginId,
			expectedIntegrity: officialExternalPlan.expectedIntegrity,
			trustedSourceLinkedOfficialInstall: true,
			invalidateRuntimeCache,
			runtime
		})).ok) return runtime.exit(1);
		return;
	}
	if (clawhubSpec) {
		const result = await require_clawhub$1.installPluginFromClawHub({
			...safetyOverrides,
			...resolveClawHubRiskAcknowledgementCliOptions({
				acknowledgeClawHubRisk: opts.acknowledgeClawHubRisk,
				action: "installing"
			}),
			mode: installMode,
			spec: raw,
			extensionsDir,
			logger: require_bundled_install.createPluginInstallLogger(runtime)
		});
		if (!result.ok) {
			if (!isClawHubBlockedCliFailure(result)) runtime.error(result.error);
			return runtime.exit(1);
		}
		await require_install_persistence.persistPluginInstall({
			snapshot,
			pluginId: result.pluginId,
			install: {
				...require_clawhub_install_records.buildClawHubPluginInstallRecordFields(result.clawhub),
				spec: raw,
				installPath: result.targetDir
			},
			invalidateRuntimeCache,
			runtime
		});
		return;
	}
	const trustedNpmInstall = require_install_provenance.resolveOperatorTrustedNpmPackageInstall(raw);
	if (!trustedNpmInstall && !await acknowledgeNonClawHubSource("npm", raw)) return runtime.exit(1);
	if (!(await tryInstallPluginOrHookPackFromNpmSpec({
		snapshot,
		installMode,
		spec: raw,
		pin: opts.pin,
		safetyOverrides,
		allowBundledFallback: true,
		extensionsDir,
		invalidateRuntimeCache,
		...trustedNpmInstall ? {
			expectedPluginId: trustedNpmInstall.pluginId,
			...trustedNpmInstall.expectedIntegrity ? { expectedIntegrity: trustedNpmInstall.expectedIntegrity } : {},
			trustedSourceLinkedOfficialInstall: true
		} : {},
		runtime
	})).ok) return runtime.exit(1);
}
//#endregion
exports.runPluginInstallCommand = runPluginInstallCommand;
