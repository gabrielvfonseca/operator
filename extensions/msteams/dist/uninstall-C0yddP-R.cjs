const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_safe_package_install = require("./safe-package-install-D1effjCo.cjs");
const require_npm_managed_root = require("./npm-managed-root-CXgmB3C6.cjs");
const require_plugin_peer_link = require("./plugin-peer-link-X42f2Hn6.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/plugins/uninstall.ts
const UNINSTALL_ACTION_LABELS = {
	entry: "config entry",
	install: "install record",
	allowlist: "allowlist entry",
	denylist: "denylist entry",
	loadPath: "load path",
	memorySlot: "memory slot",
	contextEngineSlot: "context engine slot",
	channelConfig: "channel config",
	directory: "directory"
};
const UNINSTALL_ACTION_ORDER = [
	"entry",
	"install",
	"allowlist",
	"denylist",
	"loadPath",
	"memorySlot",
	"contextEngineSlot",
	"channelConfig",
	"directory"
];
function createEmptyUninstallActions(overrides = {}) {
	return {
		entry: false,
		install: false,
		allowlist: false,
		denylist: false,
		loadPath: false,
		memorySlot: false,
		contextEngineSlot: false,
		channelConfig: false,
		directory: false,
		...overrides
	};
}
function createEmptyConfigUninstallActions() {
	const { directory: _directory, ...actions } = createEmptyUninstallActions();
	return actions;
}
function formatUninstallActionLabels(actions) {
	return UNINSTALL_ACTION_ORDER.flatMap((key) => actions[key] ? [UNINSTALL_ACTION_LABELS[key]] : []);
}
function hasUninstallAction(actions) {
	return Object.values(actions).some(Boolean);
}
function resolveUninstallDirectoryTarget(params) {
	if (!params.hasInstall) return null;
	if (isLinkedPathInstallRecord(params.installRecord)) return null;
	const npmManagedInstall = resolveNpmManagedInstall({
		installRecord: params.installRecord,
		extensionsDir: params.extensionsDir
	});
	if (npmManagedInstall) return npmManagedInstall.installPath;
	const gitManagedInstall = resolveGitManagedInstall({
		installRecord: params.installRecord,
		extensionsDir: params.extensionsDir
	});
	if (gitManagedInstall) return gitManagedInstall.installPath;
	let defaultPath;
	try {
		defaultPath = require_install_paths.resolvePluginInstallDir(params.pluginId, params.extensionsDir);
	} catch {
		return null;
	}
	const configuredPath = params.installRecord?.installPath;
	if (!configuredPath) return defaultPath;
	if (node_path.default.resolve(configuredPath) === node_path.default.resolve(defaultPath)) return configuredPath;
	if (params.extensionsDir && isPathInsideOrEqual(params.extensionsDir, configuredPath)) return configuredPath;
	const recordedManagedPath = resolveRecordedManagedInstallPath({
		pluginId: params.pluginId,
		installPath: configuredPath
	});
	if (recordedManagedPath) return recordedManagedPath;
	return defaultPath;
}
function resolveNpmManagedInstall(params) {
	const installPath = params.installRecord?.installPath?.trim();
	if (params.installRecord?.source !== "npm" || !installPath) return null;
	const npmRoots = /* @__PURE__ */ new Set();
	if (params.extensionsDir) npmRoots.add(node_path.default.join(node_path.default.dirname(node_path.default.resolve(params.extensionsDir)), "npm"));
	npmRoots.add(require_install_paths.resolveDefaultPluginNpmDir());
	for (const npmRoot of npmRoots) {
		const nodeModulesRoot = node_path.default.join(npmRoot, "node_modules");
		if (isPathInsideOrEqual(nodeModulesRoot, installPath) && resolveComparablePath(nodeModulesRoot) !== resolveComparablePath(installPath)) {
			const packageName = resolveNpmPackageNameFromInstallPath({
				installPath,
				nodeModulesRoot
			});
			return packageName ? {
				installPath,
				npmRoot,
				packageName
			} : null;
		}
		const projectMatch = resolveNpmManagedProjectInstall({
			installPath,
			projectsDir: require_install_paths.resolvePluginNpmProjectsDir(npmRoot)
		});
		if (projectMatch) return projectMatch;
	}
	return null;
}
function resolveNpmManagedProjectInstall(params) {
	if (!isPathInsideOrEqual(params.projectsDir, params.installPath) || resolveComparablePath(params.projectsDir) === resolveComparablePath(params.installPath)) return null;
	const segments = node_path.default.relative(node_path.default.resolve(params.projectsDir), node_path.default.resolve(params.installPath)).split(node_path.default.sep).filter(Boolean);
	if (segments.length < 3 || segments[1] !== "node_modules") return null;
	const npmRoot = node_path.default.join(params.projectsDir, segments[0] ?? "");
	const nodeModulesRoot = node_path.default.join(npmRoot, "node_modules");
	const packageName = resolveNpmPackageNameFromInstallPath({
		installPath: params.installPath,
		nodeModulesRoot
	});
	return packageName ? {
		installPath: params.installPath,
		npmRoot,
		packageName
	} : null;
}
function resolveNpmPackageNameFromInstallPath(params) {
	const relativePath = node_path.default.relative(node_path.default.resolve(params.nodeModulesRoot), node_path.default.resolve(params.installPath));
	if (!relativePath || relativePath.startsWith("..") || node_path.default.isAbsolute(relativePath)) return null;
	const segments = relativePath.split(node_path.default.sep).filter(Boolean);
	if (segments.length < 1) return null;
	if (segments[0]?.startsWith("@")) return segments.length >= 2 ? `${segments[0]}/${segments[1]}` : null;
	return segments[0] ?? null;
}
function resolveGitManagedInstall(params) {
	const installPath = params.installRecord?.installPath?.trim();
	if (params.installRecord?.source !== "git" || !installPath) return null;
	const gitRoots = /* @__PURE__ */ new Set();
	if (params.extensionsDir) gitRoots.add(node_path.default.join(node_path.default.dirname(node_path.default.resolve(params.extensionsDir)), "git"));
	gitRoots.add(require_install_paths.resolveDefaultPluginGitDir());
	for (const gitRoot of gitRoots) if (isPathInsideOrEqual(gitRoot, installPath) && resolveComparablePath(gitRoot) !== resolveComparablePath(installPath)) return {
		installPath,
		parentDir: node_path.default.dirname(installPath)
	};
	return null;
}
function resolveRecordedManagedInstallPath(params) {
	const resolvedInstallPath = node_path.default.resolve(params.installPath);
	const recordedExtensionsDir = node_path.default.dirname(resolvedInstallPath);
	if (node_path.default.basename(recordedExtensionsDir) !== "extensions") return null;
	try {
		return node_path.default.resolve(require_install_paths.resolvePluginInstallDir(params.pluginId, recordedExtensionsDir)) === resolvedInstallPath ? params.installPath : null;
	} catch {
		return null;
	}
}
function isLinkedPathInstallRecord(installRecord) {
	if (installRecord?.source !== "path") return false;
	if (!installRecord.sourcePath || !installRecord.installPath) return true;
	return resolveComparablePath(installRecord.sourcePath) === resolveComparablePath(installRecord.installPath);
}
const SHARED_CHANNEL_CONFIG_KEYS = /* @__PURE__ */ new Set(["defaults", "modelByChannel"]);
/**
* Resolve the channel config keys owned by a plugin during uninstall.
* - `channelIds === undefined`: fall back to the plugin id for backward compatibility.
* - `channelIds === []`: explicit "owns no channels" signal; remove nothing.
*/
function resolveUninstallChannelConfigKeys(pluginId, opts) {
	const rawKeys = opts?.channelIds ?? [pluginId];
	const seen = /* @__PURE__ */ new Set();
	const keys = [];
	for (const key of rawKeys) {
		if (SHARED_CHANNEL_CONFIG_KEYS.has(key) || seen.has(key)) continue;
		seen.add(key);
		keys.push(key);
	}
	return keys;
}
function loadPathMatchesInstallSourcePath(loadPath, sourcePath) {
	if (loadPath === sourcePath) return true;
	return resolveComparablePath(loadPath) === resolveComparablePath(sourcePath);
}
function resolveComparablePath(value) {
	const resolved = node_path.default.resolve(value);
	try {
		return (0, node_fs.realpathSync)(resolved);
	} catch {
		return resolved;
	}
}
function isPathInsideOrEqual(parent, child) {
	const relative = node_path.default.relative(resolveComparablePath(parent), resolveComparablePath(child));
	return relative === "" || !relative.startsWith("..") && !node_path.default.isAbsolute(relative);
}
/**
* Remove plugin references from config (pure config mutation).
* Returns a new config with the plugin removed from entries, installs, allow, load.paths, slots,
* and owned channel config.
*/
function removePluginFromConfig(cfg, pluginId, opts) {
	const actions = createEmptyConfigUninstallActions();
	const pluginsConfig = cfg.plugins ?? {};
	let entries = pluginsConfig.entries;
	if (entries && Object.hasOwn(entries, pluginId)) {
		const { [pluginId]: _, ...rest } = entries;
		entries = Object.keys(rest).length > 0 ? rest : void 0;
		actions.entry = true;
	}
	let installs = pluginsConfig.installs;
	const hasInstallRecord = Object.hasOwn(installs ?? {}, pluginId);
	const installRecord = hasInstallRecord ? installs?.[pluginId] : void 0;
	if (installs && hasInstallRecord) {
		const { [pluginId]: _, ...rest } = installs;
		installs = Object.keys(rest).length > 0 ? rest : void 0;
		actions.install = true;
	}
	let allow = pluginsConfig.allow;
	if (Array.isArray(allow) && allow.includes(pluginId)) {
		allow = allow.filter((id) => id !== pluginId);
		if (allow.length === 0) allow = void 0;
		actions.allowlist = true;
	}
	let deny = pluginsConfig.deny;
	if (Array.isArray(deny) && deny.includes(pluginId)) {
		deny = deny.filter((id) => id !== pluginId);
		if (deny.length === 0) deny = void 0;
		actions.denylist = true;
	}
	let load = pluginsConfig.load;
	if (installRecord?.source === "path" && installRecord.sourcePath) {
		const sourcePath = installRecord.sourcePath;
		const loadPaths = load?.paths;
		if (Array.isArray(loadPaths) && loadPaths.some((p) => loadPathMatchesInstallSourcePath(p, sourcePath))) {
			const nextLoadPaths = loadPaths.filter((p) => !loadPathMatchesInstallSourcePath(p, sourcePath));
			load = nextLoadPaths.length > 0 ? {
				...load,
				paths: nextLoadPaths
			} : void 0;
			actions.loadPath = true;
		}
	}
	let slots = pluginsConfig.slots;
	if (slots?.memory === pluginId) actions.memorySlot = true;
	if (slots?.contextEngine === pluginId) actions.contextEngineSlot = true;
	slots = require_config_activation_shared.resetPluginSlotsToDefaults(slots, pluginId);
	if (slots && Object.keys(slots).length === 0) slots = void 0;
	const cleanedPlugins = {
		...pluginsConfig,
		entries,
		installs,
		allow,
		deny,
		load,
		slots
	};
	if (cleanedPlugins.entries === void 0) delete cleanedPlugins.entries;
	if (cleanedPlugins.installs === void 0) delete cleanedPlugins.installs;
	if (cleanedPlugins.allow === void 0) delete cleanedPlugins.allow;
	if (cleanedPlugins.deny === void 0) delete cleanedPlugins.deny;
	if (cleanedPlugins.load === void 0) delete cleanedPlugins.load;
	if (cleanedPlugins.slots === void 0) delete cleanedPlugins.slots;
	let channels = cfg.channels;
	if (hasInstallRecord && channels) for (const key of resolveUninstallChannelConfigKeys(pluginId, opts)) {
		if (!Object.hasOwn(channels, key)) continue;
		const { [key]: _removed, ...rest } = channels;
		channels = Object.keys(rest).length > 0 ? rest : void 0;
		actions.channelConfig = true;
		if (!channels) break;
	}
	return {
		config: {
			...cfg,
			plugins: Object.keys(cleanedPlugins).length > 0 ? cleanedPlugins : void 0,
			channels
		},
		actions
	};
}
/**
* Plan a plugin uninstall by removing it from config and resolving a safe file-removal target.
* Linked path plugins never have their source directory deleted. Copied path installs still remove
* their managed install directory.
*/
function planPluginUninstall(params) {
	const { config, pluginId, channelIds, deleteFiles = true, extensionsDir } = params;
	const entries = config.plugins?.entries ?? {};
	const installs = config.plugins?.installs ?? {};
	const hasEntry = Object.hasOwn(entries, pluginId);
	const hasInstall = Object.hasOwn(installs, pluginId);
	const installRecord = hasInstall ? installs[pluginId] : void 0;
	const isLinked = isLinkedPathInstallRecord(installRecord);
	const { config: newConfig, actions: configActions } = removePluginFromConfig(config, pluginId, { channelIds });
	if (!hasEntry && !hasInstall && !hasUninstallAction(configActions)) return {
		ok: false,
		error: `Plugin not found: ${pluginId}`
	};
	const actions = {
		...configActions,
		directory: false
	};
	const npmManagedInstall = deleteFiles && !isLinked ? resolveNpmManagedInstall({
		installRecord,
		extensionsDir
	}) : null;
	const gitManagedInstall = deleteFiles && !isLinked ? resolveGitManagedInstall({
		installRecord,
		extensionsDir
	}) : null;
	const deleteTarget = deleteFiles && !isLinked ? resolveUninstallDirectoryTarget({
		pluginId,
		hasInstall,
		installRecord,
		extensionsDir
	}) : null;
	return {
		ok: true,
		config: newConfig,
		pluginId,
		actions,
		directoryRemoval: deleteTarget ? {
			target: deleteTarget,
			...npmManagedInstall ? { cleanup: {
				kind: "npm",
				npmRoot: npmManagedInstall.npmRoot,
				packageName: npmManagedInstall.packageName
			} } : gitManagedInstall && deleteTarget === gitManagedInstall.installPath ? { cleanup: {
				kind: "git",
				parentDir: gitManagedInstall.parentDir
			} } : {}
		} : null
	};
}
async function applyPluginUninstallDirectoryRemoval(removal) {
	if (!removal) return {
		directoryRemoved: false,
		warnings: []
	};
	const existed = await node_fs_promises.default.access(removal.target).then(() => true).catch(() => false) ?? false;
	const warnings = [];
	if (!existed && removal.cleanup?.kind !== "npm") return {
		directoryRemoved: false,
		warnings
	};
	const npmCleanupManifestExists = removal.cleanup?.kind === "npm" ? await node_fs_promises.default.access(node_path.default.join(removal.cleanup.npmRoot, "package.json")).then(() => true).catch(() => false) : false;
	if (!existed && removal.cleanup?.kind === "npm" && !npmCleanupManifestExists) return {
		directoryRemoved: false,
		warnings
	};
	if (removal.cleanup?.kind === "npm" && npmCleanupManifestExists) {
		const uninstall = await require_exec.runCommandWithTimeout([
			"npm",
			"uninstall",
			"--loglevel=error",
			"--legacy-peer-deps",
			"--ignore-scripts",
			"--no-audit",
			"--no-fund",
			removal.cleanup.packageName
		], {
			cwd: removal.cleanup.npmRoot,
			timeoutMs: 3e5,
			env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
				legacyPeerDeps: true,
				npmConfigCwd: removal.cleanup.npmRoot,
				packageLock: true,
				quiet: true
			})
		});
		if (uninstall.code !== 0) warnings.push(`Failed to prune npm dependencies for plugin package ${removal.cleanup.packageName}: ${uninstall.stderr.trim() || uninstall.stdout.trim() || `npm exited with code ${uninstall.code}`}`);
		try {
			const managedOverrides = await require_npm_managed_root.readOperatorManagedNpmRootOverrides();
			if (await require_npm_managed_root.syncManagedNpmRootPeerDependencies({
				npmRoot: removal.cleanup.npmRoot,
				managedOverrides
			})) {
				const cleanup = await require_exec.runCommandWithTimeout([
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
					cwd: removal.cleanup.npmRoot,
					timeoutMs: 3e5,
					env: require_safe_package_install.createSafeNpmInstallEnv(process.env, {
						legacyPeerDeps: true,
						npmConfigCwd: removal.cleanup.npmRoot,
						packageLock: true,
						quiet: true
					})
				});
				if (cleanup.code !== 0) warnings.push(`Failed to prune managed peer dependencies after uninstalling ${removal.cleanup.packageName}: ${cleanup.stderr.trim() || cleanup.stdout.trim() || `npm exited with code ${cleanup.code}`}`);
			}
		} catch (error) {
			warnings.push(`Failed to sync managed peer dependencies after uninstalling ${removal.cleanup.packageName}: ${require_errors.formatErrorMessage(error)}`);
		}
		try {
			await require_plugin_peer_link.relinkOperatorPeerDependenciesInManagedNpmRoot({
				npmRoot: removal.cleanup.npmRoot,
				logger: { warn: (message) => warnings.push(message) }
			});
		} catch (error) {
			warnings.push(`Failed to repair managed npm peer links after uninstalling ${removal.cleanup.packageName}: ${require_errors.formatErrorMessage(error)}`);
		}
	}
	try {
		await node_fs_promises.default.rm(removal.target, {
			recursive: true,
			force: true
		});
		if (removal.cleanup?.kind === "git") try {
			await node_fs_promises.default.rmdir(removal.cleanup.parentDir);
		} catch (error) {
			const code = error.code;
			if (code !== "ENOENT" && code !== "ENOTEMPTY") warnings.push(`Failed to remove empty git plugin install parent ${removal.cleanup.parentDir}: ${require_errors.formatErrorMessage(error)}`);
		}
		return {
			directoryRemoved: existed,
			warnings
		};
	} catch (error) {
		return {
			directoryRemoved: false,
			warnings: [...warnings, `Failed to remove plugin directory ${removal.target}: ${require_errors.formatErrorMessage(error)}`]
		};
	}
}
//#endregion
Object.defineProperty(exports, "applyPluginUninstallDirectoryRemoval", {
	enumerable: true,
	get: function() {
		return applyPluginUninstallDirectoryRemoval;
	}
});
Object.defineProperty(exports, "formatUninstallActionLabels", {
	enumerable: true,
	get: function() {
		return formatUninstallActionLabels;
	}
});
Object.defineProperty(exports, "planPluginUninstall", {
	enumerable: true,
	get: function() {
		return planPluginUninstall;
	}
});
