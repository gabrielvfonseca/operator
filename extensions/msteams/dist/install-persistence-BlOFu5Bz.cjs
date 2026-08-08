const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_installed_plugin_index_records = require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_includes = require("./includes-CvS4iKMf.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
const require_uninstall = require("./uninstall-C0yddP-R.cjs");
const require_install_record_commit = require("./install-record-commit-BUsKCeHe.cjs");
const require_registry_refresh = require("./registry-refresh-B3eSyFEy.cjs");
const require_status = require("./status-pSULYkKm.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/slot-selection.ts
function mergeRuntimeKinds(report, runtimeReport) {
	const runtimeKinds = new Map(runtimeReport.plugins.filter((plugin) => plugin.kind).map((plugin) => [plugin.id, plugin.kind]));
	return { plugins: report.plugins.map((plugin) => {
		if (plugin.kind) return plugin;
		const runtimeKind = runtimeKinds.get(plugin.id);
		return runtimeKind ? {
			...plugin,
			kind: runtimeKind
		} : plugin;
	}) };
}
function loadRuntimeKindReportForPlugins(config, pluginIds) {
	return require_status.buildPluginDiagnosticsReport({
		config,
		onlyPluginIds: [...pluginIds]
	});
}
function buildSlotSelectionRegistry(config, pluginId) {
	return { plugins: require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config,
		env: process.env
	}).plugins.filter((plugin) => plugin.id === pluginId).map((plugin) => ({
		id: plugin.id,
		kind: plugin.kind
	})) };
}
function applySlotSelectionForPlugin(config, pluginId) {
	const report = buildSlotSelectionRegistry(config, pluginId);
	const plugin = report.plugins.find((entry) => entry.id === pluginId);
	if (!plugin) return {
		config,
		warnings: []
	};
	if (!plugin.kind) {
		const runtimeReport = loadRuntimeKindReportForPlugins(config, [plugin.id]);
		const runtimePlugin = runtimeReport.plugins.find((entry) => entry.id === plugin.id);
		if (runtimePlugin?.kind) {
			const result = require_config_activation_shared.applyExclusiveSlotSelection({
				config,
				selectedId: runtimePlugin.id,
				selectedKind: runtimePlugin.kind,
				registry: mergeRuntimeKinds(report, runtimeReport)
			});
			return {
				config: result.config,
				warnings: result.warnings
			};
		}
	}
	const result = require_config_activation_shared.applyExclusiveSlotSelection({
		config,
		selectedId: plugin.id,
		selectedKind: plugin.kind,
		registry: report
	});
	return {
		config: result.config,
		warnings: result.warnings
	};
}
//#endregion
//#region src/plugins/install-persistence.ts
function addInstalledPluginToAllowlist(cfg, pluginId) {
	const allow = cfg.plugins?.allow;
	if (!Array.isArray(allow) || allow.length === 0 || allow.includes(pluginId)) return cfg;
	return {
		...cfg,
		plugins: {
			...cfg.plugins,
			allow: [...allow, pluginId]
		}
	};
}
function removeInstalledPluginFromDenylist(cfg, pluginId) {
	const deny = cfg.plugins?.deny;
	if (!Array.isArray(deny) || !deny.includes(pluginId)) return cfg;
	const nextDeny = deny.filter((id) => id !== pluginId);
	const plugins = {
		...cfg.plugins,
		...nextDeny.length > 0 ? { deny: nextDeny } : {}
	};
	if (nextDeny.length === 0) delete plugins.deny;
	return {
		...cfg,
		plugins
	};
}
const CONFIG_MUTATION_ALLOWED = { mode: "allowed" };
function containsConfigIncludeDirective(value) {
	if (Array.isArray(value)) return value.some((entry) => containsConfigIncludeDirective(entry));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return false;
	return Object.hasOwn(value, "$include") || Object.values(value).some((entry) => containsConfigIncludeDirective(entry));
}
function supportsInstallConfigSingleTopLevelIncludeShape(authoredSection) {
	if (!containsConfigIncludeDirective(authoredSection)) return true;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(authoredSection) && Object.keys(authoredSection).length === 1 && typeof authoredSection.$include === "string";
}
function resolveSingleTopLevelIncludePath(parsed, configPath, section) {
	const authoredSection = parsed[section];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(authoredSection) || Object.keys(authoredSection).length !== 1 || typeof authoredSection.$include !== "string") return null;
	return node_path.default.normalize(node_path.default.isAbsolute(authoredSection.$include) ? authoredSection.$include : node_path.default.resolve(node_path.default.dirname(configPath), authoredSection.$include));
}
function resolveConfigMutationPreflight(params) {
	if (Object.hasOwn(params.parsed, "$include")) return {
		mode: "blocked",
		scope: "config",
		reason: `Config ${params.section} are stored through an unsupported $include shape at the root; edit the included file directly or move ${params.section} into the root config before installing.`
	};
	if (!supportsInstallConfigSingleTopLevelIncludeShape(params.parsed[params.section])) return {
		mode: "blocked",
		scope: params.section,
		reason: `Config ${params.section} are stored through an unsupported $include shape; edit the included file directly or move ${params.section} to a single-file top-level include before installing.`
	};
	const includePath = resolveSingleTopLevelIncludePath(params.parsed, params.snapshotPath, params.section);
	if (!includePath) return CONFIG_MUTATION_ALLOWED;
	const expectedTarget = params.writeOptions.includeFileTargetsForWrite?.[includePath];
	let resolvedTarget = null;
	try {
		resolvedTarget = require_includes.resolveConfigIncludeWritePath({
			configPath: params.snapshotPath,
			includePath,
			allowedRoots: []
		});
	} catch {}
	if (expectedTarget && resolvedTarget && node_path.default.normalize(expectedTarget) === node_path.default.normalize(resolvedTarget)) {
		const expectedHash = params.writeOptions.includeFileHashesForWrite?.[includePath];
		try {
			const raw = require_includes.readConfigIncludeFileWithGuards({
				includePath,
				resolvedPath: resolvedTarget,
				rootRealDir: node_fs.default.realpathSync(node_path.default.dirname(params.snapshotPath))
			});
			if (expectedHash !== require_includes.hashConfigIncludeRaw(raw)) return {
				mode: "blocked",
				scope: params.section,
				reason: `Config ${params.section} include changed since the config was read; rerun the install after reloading the config.`
			};
			if (containsConfigIncludeDirective(require_parse_json_compat.parseJsonWithJson5Fallback(raw))) return {
				mode: "blocked",
				scope: params.section,
				reason: `Config ${params.section} are stored through a nested $include; edit the included file directly or remove the nested $include before installing.`
			};
			return CONFIG_MUTATION_ALLOWED;
		} catch {
			return {
				mode: "blocked",
				scope: params.section,
				reason: `Config ${params.section} include could not be inspected at its snapshot target; rerun the install after repairing or reloading the config.`
			};
		}
	}
	return {
		mode: "blocked",
		scope: params.section,
		reason: `Config ${params.section} are stored in an external or unresolved top-level $include; edit the included file directly or move it under the config directory before installing.`
	};
}
function resolveInstallConfigMutationPreflights(params) {
	const pluginMutation = resolveConfigMutationPreflight({
		...params,
		section: "plugins"
	});
	const hookMutation = resolveConfigMutationPreflight({
		...params,
		section: "hooks"
	});
	const pluginIncludePath = resolveSingleTopLevelIncludePath(params.parsed, params.snapshotPath, "plugins");
	const hookIncludePath = resolveSingleTopLevelIncludePath(params.parsed, params.snapshotPath, "hooks");
	const pluginTarget = pluginIncludePath ? params.writeOptions.includeFileTargetsForWrite?.[pluginIncludePath] : void 0;
	const hookTarget = hookIncludePath ? params.writeOptions.includeFileTargetsForWrite?.[hookIncludePath] : void 0;
	if (pluginTarget && hookTarget && node_path.default.normalize(pluginTarget) === node_path.default.normalize(hookTarget)) {
		const blocked = {
			mode: "blocked",
			scope: "config",
			reason: "Config plugins and hooks share the same top-level $include target; split them into separate include files before installing."
		};
		return {
			hookMutation: blocked,
			pluginMutation: blocked
		};
	}
	return {
		hookMutation,
		pluginMutation
	};
}
function selectInstallMutationWriteOptions(writeOptions) {
	return {
		...writeOptions.assertConfigPathForWrite ? { assertConfigPathForWrite: writeOptions.assertConfigPathForWrite } : {},
		expectedConfigPath: writeOptions.expectedConfigPath,
		ownedConfigPathForWrite: writeOptions.ownedConfigPathForWrite,
		envSnapshotForRestore: writeOptions.envSnapshotForRestore,
		includeFileHashesForWrite: writeOptions.includeFileHashesForWrite,
		includeFileTargetsForWrite: writeOptions.includeFileTargetsForWrite
	};
}
function sourceMatchesInstalledPath(params) {
	const activeSource = require_home_dir.resolveUserPath(params.activeSource, params.env);
	const installedSource = require_home_dir.resolveUserPath(params.installedSource, params.env);
	return activeSource === installedSource || (0, _openclaw_fs_safe_path.isPathInside)(installedSource, activeSource);
}
function logShadowedNpmInstallWarning(params) {
	if (params.install.source !== "npm") return;
	const installedSource = params.install.installPath ?? params.install.sourcePath;
	if (!installedSource) return;
	const active = require_status.buildPluginSnapshotReport({
		config: params.config,
		effectiveOnly: true,
		onlyPluginIds: [params.pluginId]
	}).plugins.find((plugin) => plugin.id === params.pluginId);
	if (active?.origin !== "config" || sourceMatchesInstalledPath({
		activeSource: active.source,
		installedSource
	})) return;
	params.runtime.log(require_theme.theme.warn([
		`Warning: installed plugin "${params.pluginId}" is not the active source because a config-selected plugin with the same id is currently selected:`,
		`  active config source: ${require_utils.shortenHomePath(active.source)}`,
		`  installed npm source: ${require_utils.shortenHomePath(installedSource)}`,
		"Run `openclaw plugins doctor` for repair options."
	].join("\n")));
}
function logSlotWarnings(warnings, runtime) {
	for (const warning of warnings) runtime.log(require_theme.theme.warn(warning));
}
function resolveComparableInstallPath(install) {
	return install.installPath ?? install.sourcePath;
}
function shouldPreserveReplacedInstallPath(params) {
	const removalTarget = require_home_dir.resolveUserPath(params.removalTarget);
	const nextInstallPath = require_home_dir.resolveUserPath(params.nextInstallPath);
	return (0, _openclaw_fs_safe_path.isPathInside)(removalTarget, nextInstallPath) || (0, _openclaw_fs_safe_path.isPathInside)(nextInstallPath, removalTarget);
}
function resolveReplacedManagedInstallRemoval(params) {
	if (!params.previousInstall) return null;
	const previousInstallPath = resolveComparableInstallPath(params.previousInstall);
	const nextInstallPath = resolveComparableInstallPath(params.nextInstall);
	if (!previousInstallPath || !nextInstallPath) return null;
	if (params.previousInstall.source === "npm" && params.nextInstall.source === "npm") return null;
	if (shouldPreserveReplacedInstallPath({
		removalTarget: previousInstallPath,
		nextInstallPath
	})) return null;
	const plan = require_uninstall.planPluginUninstall({
		config: { plugins: { installs: { [params.pluginId]: params.previousInstall } } },
		pluginId: params.pluginId,
		deleteFiles: true
	});
	if (!plan.ok || !plan.directoryRemoval) return null;
	if (shouldPreserveReplacedInstallPath({
		removalTarget: plan.directoryRemoval.target,
		nextInstallPath
	})) return null;
	return plan.directoryRemoval;
}
async function persistPluginInstall(params) {
	const runtime = params.runtime ?? require_runtime.defaultRuntime;
	const installConfig = params.enable === false ? params.snapshot.config : removeInstalledPluginFromDenylist(addInstalledPluginToAllowlist(params.snapshot.config, params.pluginId), params.pluginId);
	let next = params.enable === false ? installConfig : require_enable.enablePluginInConfig(installConfig, params.pluginId, { updateChannelConfig: false }).config;
	const installRecords = await require_discovery.tracePluginLifecyclePhaseAsync("install records load", () => require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords(), { command: "install" });
	const previousInstall = installRecords[params.pluginId];
	const replacedInstallRemoval = resolveReplacedManagedInstallRemoval({
		pluginId: params.pluginId,
		previousInstall,
		nextInstall: params.install
	});
	const nextInstallRecords = require_installed_plugin_index_records.recordPluginInstallInRecords(installRecords, {
		pluginId: params.pluginId,
		...params.install
	});
	const slotResult = params.enable === false ? {
		config: next,
		warnings: []
	} : await require_discovery.tracePluginLifecyclePhaseAsync("slot selection", async () => applySlotSelectionForPlugin(next, params.pluginId), {
		command: "install",
		pluginId: params.pluginId
	});
	next = require_installed_plugin_index_records.withoutPluginInstallRecords(slotResult.config);
	await require_discovery.tracePluginLifecyclePhaseAsync("config mutation", () => require_install_record_commit.commitPluginInstallRecordsWithConfig({
		previousInstallRecords: installRecords,
		nextInstallRecords,
		nextConfig: next,
		baseHash: params.snapshot.baseHash,
		writeOptions: {
			...params.snapshot.writeOptions,
			afterWrite: {
				mode: "restart",
				reason: "plugin source changed"
			}
		}
	}), { command: "install" });
	if (replacedInstallRemoval) {
		const removalResult = await require_discovery.tracePluginLifecyclePhaseAsync("replaced install cleanup", () => require_uninstall.applyPluginUninstallDirectoryRemoval(replacedInstallRemoval), {
			command: "install",
			pluginId: params.pluginId
		});
		for (const warning of removalResult.warnings) runtime.log(require_theme.theme.warn(warning));
		if (removalResult.directoryRemoved) runtime.log(require_theme.theme.muted(`Removed previous plugin install directory: ${require_utils.shortenHomePath(replacedInstallRemoval.target)}`));
	}
	await require_registry_refresh.refreshPluginRegistryAfterConfigMutation({
		config: next,
		reason: "source-changed",
		installRecords: nextInstallRecords,
		invalidateRuntimeCache: params.invalidateRuntimeCache,
		traceCommand: "install",
		logger: { warn: (message) => runtime.log(require_theme.theme.warn(message)) }
	});
	logSlotWarnings(slotResult.warnings, runtime);
	if (params.warningMessage) runtime.log(require_theme.theme.warn(params.warningMessage));
	runtime.log(params.successMessage ?? `Installed plugin: ${params.pluginId}`);
	logShadowedNpmInstallWarning({
		config: next,
		pluginId: params.pluginId,
		install: params.install,
		runtime
	});
	runtime.log("Restart the gateway to load plugins.");
	return next;
}
//#endregion
Object.defineProperty(exports, "applySlotSelectionForPlugin", {
	enumerable: true,
	get: function() {
		return applySlotSelectionForPlugin;
	}
});
Object.defineProperty(exports, "persistPluginInstall", {
	enumerable: true,
	get: function() {
		return persistPluginInstall;
	}
});
Object.defineProperty(exports, "resolveInstallConfigMutationPreflights", {
	enumerable: true,
	get: function() {
		return resolveInstallConfigMutationPreflights;
	}
});
Object.defineProperty(exports, "selectInstallMutationWriteOptions", {
	enumerable: true,
	get: function() {
		return selectInstallMutationWriteOptions;
	}
});
Object.defineProperty(exports, "supportsInstallConfigSingleTopLevelIncludeShape", {
	enumerable: true,
	get: function() {
		return supportsInstallConfigSingleTopLevelIncludeShape;
	}
});
