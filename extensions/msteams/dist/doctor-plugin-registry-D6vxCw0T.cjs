const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_managed_npm_retention = require("./managed-npm-retention-edlbaFsN.cjs");
const require_installed_plugin_index_store = require("./installed-plugin-index-store-vrROJGFd.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_plugin_install_config_migration = require("./plugin-install-config-migration-BsnyrqD3.cjs");
const require_json_file = require("./json-file-DCJhM2Bu.cjs");
const require_plugin_peer_link = require("./plugin-peer-link-X42f2Hn6.cjs");
const require_note = require("./note-DKh-wVkx.cjs");
const require_stale_local_bundled_plugin_install_records = require("./stale-local-bundled-plugin-install-records-C1qb0aJi.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/commands/doctor/shared/plugin-registry-migration.ts
const DISABLE_PLUGIN_REGISTRY_MIGRATION_ENV = "OPERATOR_DISABLE_PLUGIN_REGISTRY_MIGRATION";
const FORCE_PLUGIN_REGISTRY_MIGRATION_ENV = "OPERATOR_FORCE_PLUGIN_REGISTRY_MIGRATION";
const DOCTOR_PLUGIN_ID_ALIASES = { openai: ["openai-codex"] };
function hasEnvFlag(env, key) {
	const value = env?.[key]?.trim().toLowerCase();
	return Boolean(value && value !== "0" && value !== "false" && value !== "no");
}
function forceDeprecationWarning() {
	return `${FORCE_PLUGIN_REGISTRY_MIGRATION_ENV} is deprecated and will be removed after the plugin registry migration rollout; use doctor registry repair once available.`;
}
/** Decide whether plugin install registry migration should run for this environment. */
function preflightPluginRegistryInstallMigration(params = {}) {
	const env = params.env ?? process.env;
	const filePath = require_installed_plugin_index_record_reader.resolveInstalledPluginIndexStorePath(params);
	const force = hasEnvFlag(env, FORCE_PLUGIN_REGISTRY_MIGRATION_ENV);
	const deprecationWarnings = force ? [forceDeprecationWarning()] : [];
	if (hasEnvFlag(env, "OPERATOR_DISABLE_PLUGIN_REGISTRY_MIGRATION")) return {
		action: "disabled",
		filePath,
		force,
		deprecationWarnings
	};
	const pathExists = params.existsSync ?? node_fs.default.existsSync;
	if (!force && pathExists(filePath)) {
		if (require_installed_plugin_index_store.readPersistedInstalledPluginIndexSync(params)) return {
			action: "skip-existing",
			filePath,
			force,
			deprecationWarnings
		};
	}
	return {
		action: "migrate",
		filePath,
		force,
		deprecationWarnings
	};
}
async function readMigrationConfig(params) {
	if (params.config) return params.config;
	if (params.readConfig) return await params.readConfig();
	return await (await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports)).readBestEffortConfig();
}
function normalizeRegistryReference(value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	return trimmed ? trimmed.toLowerCase() : void 0;
}
function createMigrationPluginIdNormalizer(index, manifests) {
	const aliases = /* @__PURE__ */ new Map();
	for (const plugin of index.plugins) {
		const pluginId = normalizeRegistryReference(plugin.pluginId);
		if (!pluginId) continue;
		aliases.set(pluginId, plugin.pluginId);
	}
	for (const plugin of manifests) {
		const pluginId = normalizeRegistryReference(plugin.id);
		if (!pluginId) continue;
		aliases.set(pluginId, plugin.id);
		for (const alias of [
			...plugin.providers,
			...plugin.channels,
			...plugin.setup?.providers?.map((provider) => provider.id) ?? [],
			...plugin.cliBackends,
			...plugin.setup?.cliBackends ?? [],
			...Object.keys(plugin.modelCatalog?.providers ?? {}),
			...plugin.legacyPluginIds ?? [],
			...DOCTOR_PLUGIN_ID_ALIASES[plugin.id] ?? []
		]) {
			const normalizedAlias = normalizeRegistryReference(alias);
			if (normalizedAlias && !aliases.has(normalizedAlias)) aliases.set(normalizedAlias, plugin.id);
		}
	}
	return (pluginId) => {
		const normalized = normalizeRegistryReference(pluginId);
		return normalized ? aliases.get(normalized) ?? pluginId.trim() : pluginId.trim();
	};
}
function addPluginReference(references, normalizePluginId, value) {
	if (typeof value !== "string") return;
	const normalized = normalizePluginId(value);
	if (normalized) references.add(normalized);
}
function listConfiguredChannelIds(config) {
	const channels = config.channels;
	if (!channels || typeof channels !== "object" || Array.isArray(channels)) return /* @__PURE__ */ new Set();
	return new Set(Object.keys(channels).map((channelId) => normalizeRegistryReference(channelId)).filter((channelId) => Boolean(channelId)));
}
function listConfiguredModelProviderIds(config) {
	const providers = config.models?.providers;
	if (!providers || typeof providers !== "object" || Array.isArray(providers)) return /* @__PURE__ */ new Set();
	return new Set(Object.keys(providers).map((providerId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId)).filter(Boolean));
}
function listMigrationRelevantPluginRecords(params) {
	const manifestRegistry = require_current_plugin_metadata_snapshot.loadPluginManifestRegistryForInstalledIndex({
		index: params.index,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeDisabled: true
	});
	const manifestByPluginId = new Map(manifestRegistry.plugins.map((plugin) => [plugin.id, plugin]));
	const normalizePluginId = createMigrationPluginIdNormalizer(params.index, manifestRegistry.plugins);
	const referencedPluginIds = /* @__PURE__ */ new Set();
	const installedPluginIds = /* @__PURE__ */ new Set();
	for (const pluginId of Object.keys(params.installRecords)) addPluginReference(installedPluginIds, normalizePluginId, pluginId);
	const plugins = params.config.plugins;
	for (const pluginId of plugins?.allow ?? []) addPluginReference(referencedPluginIds, normalizePluginId, pluginId);
	for (const pluginId of plugins?.deny ?? []) addPluginReference(referencedPluginIds, normalizePluginId, pluginId);
	for (const pluginId of Object.keys(plugins?.entries ?? {})) addPluginReference(referencedPluginIds, normalizePluginId, pluginId);
	for (const pluginId of Object.values(plugins?.slots ?? {})) {
		if (normalizeRegistryReference(pluginId) === "none") continue;
		addPluginReference(referencedPluginIds, normalizePluginId, pluginId);
	}
	const configuredChannelIds = listConfiguredChannelIds(params.config);
	const configuredModelProviderIds = listConfiguredModelProviderIds(params.config);
	return params.index.plugins.filter((plugin) => {
		if (plugin.origin !== "bundled") return true;
		const manifest = manifestByPluginId.get(plugin.pluginId);
		if (plugin.enabledByDefault && (manifest?.providers.length ?? 0) > 0) return true;
		if (plugin.startup.memory) return true;
		if ((manifest?.commandAliases ?? []).some((alias) => alias.cliCommand)) return true;
		if ((manifest?.contracts?.migrationProviders?.length ?? 0) > 0) return true;
		if (installedPluginIds.has(plugin.pluginId) || referencedPluginIds.has(plugin.pluginId)) return true;
		if ((manifest?.channels ?? []).some((channelId) => configuredChannelIds.has(normalizeRegistryReference(channelId) ?? ""))) return true;
		return (manifest?.providers ?? []).some((providerId) => configuredModelProviderIds.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId)));
	});
}
/** Persist a migrated plugin install registry from legacy config/install records when needed. */
async function migratePluginRegistryForInstall(params = {}) {
	const preflight = preflightPluginRegistryInstallMigration(params);
	if (preflight.action === "disabled") return {
		status: "disabled",
		migrated: false,
		preflight
	};
	if (preflight.action === "skip-existing") return {
		status: "skip-existing",
		migrated: false,
		preflight
	};
	if (params.dryRun) return {
		status: "dry-run",
		migrated: false,
		preflight
	};
	const rawConfig = await readMigrationConfig(params);
	const config = require_plugin_install_config_migration.stripShippedPluginInstallConfigRecords(rawConfig);
	const durableInstallRecords = params.installRecords ?? await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords(params);
	const installRecords = {
		...require_plugin_install_config_migration.extractShippedPluginInstallConfigRecords(rawConfig),
		...durableInstallRecords
	};
	const migrationParams = {
		...params,
		config,
		installRecords
	};
	const inspection = await require_installed_plugin_index_store.inspectPersistedInstalledPluginIndex(migrationParams);
	const candidateIndex = require_installed_plugin_index.loadInstalledPluginIndex({ ...migrationParams });
	const current = {
		...candidateIndex,
		refreshReason: "migration",
		plugins: listMigrationRelevantPluginRecords({
			index: candidateIndex,
			config,
			installRecords,
			workspaceDir: params.workspaceDir,
			env: params.env
		})
	};
	await require_installed_plugin_index_store.writePersistedInstalledPluginIndex(current, params);
	return {
		status: "migrated",
		migrated: true,
		preflight,
		inspection,
		current
	};
}
//#endregion
//#region src/commands/doctor-plugin-registry.ts
/** Doctor repairs for stale plugin registry entries, managed npm shadows, and peer links. */
const PLUGIN_REGISTRY_CHECK_ID = "core/doctor/plugin-registry";
function readJsonObject(filePath) {
	const parsed = (0, _openclaw_fs_safe_json.tryReadJsonSync)(filePath);
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? parsed : null;
}
function readStringMap(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return {};
	const result = {};
	for (const [key, raw] of Object.entries(value)) if (typeof raw === "string" && raw.trim()) result[key] = raw.trim();
	return result;
}
function resolveManagedPluginNpmRoot(params) {
	return params.stateDir ? node_path.default.join(params.stateDir, "npm") : require_install_paths.resolveDefaultPluginNpmDir(params.env);
}
function listManagedPluginNpmRoots(params) {
	return require_managed_npm_retention.listManagedPluginNpmRootsSync(resolveManagedPluginNpmRoot(params));
}
function deleteObjectKey(record, key) {
	if (!Object.hasOwn(record, key)) return false;
	delete record[key];
	return true;
}
function readPackageVersion(packageDir) {
	const version = readJsonObject(node_path.default.join(packageDir, "package.json"))?.version;
	return typeof version === "string" && version.trim() ? version.trim() : void 0;
}
function readPluginManifestId(packageDir) {
	const id = readJsonObject(node_path.default.join(packageDir, "operator.plugin.json"))?.id;
	return typeof id === "string" && id.trim() ? id.trim() : void 0;
}
function listStaleManagedNpmBundledPlugins(params) {
	const currentBundled = require_installed_plugin_index.loadInstalledPluginIndex({
		...params,
		installRecords: {}
	}).plugins.filter((plugin) => plugin.origin === "bundled" && plugin.packageName);
	const bundledByPackage = new Map(currentBundled.map((plugin) => [plugin.packageName, plugin]));
	const stale = [];
	for (const npmRoot of listManagedPluginNpmRoots(params)) {
		const dependencies = readStringMap(readJsonObject(node_path.default.join(npmRoot, "package.json"))?.dependencies);
		for (const packageName of Object.keys(dependencies).toSorted((left, right) => left.localeCompare(right))) {
			if (!packageName.startsWith("@gabrielvfonseca/")) continue;
			const bundled = bundledByPackage.get(packageName);
			if (!bundled) continue;
			const packageDir = node_path.default.join(npmRoot, "node_modules", ...packageName.split("/"));
			if (require_managed_npm_retention.hasRetainedManagedNpmInstallMarker(packageDir)) continue;
			const pluginId = readPluginManifestId(packageDir);
			if (!pluginId || pluginId !== bundled.pluginId) continue;
			stale.push({
				pluginId,
				packageName,
				packageDir,
				npmRoot,
				...readPackageVersion(packageDir) ? { version: readPackageVersion(packageDir) } : {}
			});
		}
	}
	return stale;
}
function loadCurrentBundledPluginSources(params) {
	const currentBundled = require_installed_plugin_index.loadInstalledPluginIndex({
		...params,
		installRecords: {}
	}).plugins.filter((plugin) => plugin.origin === "bundled");
	return new Map(currentBundled.map((plugin) => [plugin.pluginId, {
		pluginId: plugin.pluginId,
		localPath: plugin.rootDir,
		...plugin.packageName ? { npmSpec: plugin.packageName } : {},
		...plugin.packageVersion ? { version: plugin.packageVersion } : {}
	}]));
}
async function listStaleLocalBundledPluginInstallRecordShadows(params) {
	return require_stale_local_bundled_plugin_install_records.listStaleLocalBundledPluginInstallRecords({
		installRecords: await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords(params),
		workspaceDir: params.workspaceDir,
		env: params.env,
		bundled: loadCurrentBundledPluginSources(params)
	});
}
function removeManagedNpmDependency(params) {
	const npmPackageJsonPath = node_path.default.join(params.npmRoot, "package.json");
	const packageJson = readJsonObject(npmPackageJsonPath) ?? {};
	const dependencies = readStringMap(packageJson.dependencies);
	delete dependencies[params.packageName];
	require_json_file.saveJsonFile(npmPackageJsonPath, Object.keys(dependencies).length === 0 ? (() => {
		const { dependencies: _dependencies, ...rest } = packageJson;
		return rest;
	})() : {
		...packageJson,
		dependencies
	});
	removeManagedNpmPackageLockDependency(params);
	node_fs.default.rmSync(params.packageDir, {
		recursive: true,
		force: true
	});
	const scopeDir = node_path.default.dirname(params.packageDir);
	if (node_path.default.basename(node_path.default.dirname(scopeDir)) === "node_modules") try {
		node_fs.default.rmdirSync(scopeDir);
	} catch {}
}
function removeManagedNpmPackageLockDependency(params) {
	const packageLockPath = node_path.default.join(params.npmRoot, "package-lock.json");
	const packageLock = readJsonObject(packageLockPath);
	if (!packageLock) return;
	let changed = false;
	const packages = packageLock.packages;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(packages)) {
		const rootPackage = packages[""];
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rootPackage)) {
			const rootDependencies = readStringMap(rootPackage.dependencies);
			if (deleteObjectKey(rootDependencies, params.packageName)) {
				changed = true;
				if (Object.keys(rootDependencies).length === 0) delete rootPackage.dependencies;
				else rootPackage.dependencies = rootDependencies;
			}
		}
		changed = deleteObjectKey(packages, `node_modules/${params.packageName}`) || changed;
	}
	const dependencies = packageLock.dependencies;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(dependencies)) changed = deleteObjectKey(dependencies, params.packageName) || changed;
	if (changed) require_json_file.saveJsonFile(packageLockPath, packageLock);
}
/** Removes managed npm packages that shadow current bundled plugins when repair is enabled. */
function maybeRepairStaleManagedNpmBundledPlugins(params) {
	const stale = listStaleManagedNpmBundledPlugins(params);
	if (stale.length === 0) return false;
	if (!params.prompter.shouldRepair) {
		require_note.note([
			"Managed npm plugin packages shadow bundled plugins:",
			...stale.map((plugin) => `- ${plugin.pluginId}: ${plugin.packageName}${plugin.version ? `@${plugin.version}` : ""}`),
			`Repair with ${require_command_format.formatCliCommand("openclaw doctor --fix")} to remove stale managed npm packages and rebuild the plugin registry.`
		].join("\n"), "Plugin registry");
		return false;
	}
	for (const plugin of stale) removeManagedNpmDependency(plugin);
	require_note.note(["Removed stale managed npm plugin package(s) shadowing bundled plugins:", ...stale.map((plugin) => `- ${plugin.pluginId}: ${plugin.packageName}${plugin.version ? `@${plugin.version}` : ""}`)].join("\n"), "Plugin registry");
	return true;
}
/** Removes local install records that shadow current bundled plugin sources. */
async function maybeRepairStaleLocalBundledPluginInstallRecords(params) {
	const stale = await listStaleLocalBundledPluginInstallRecordShadows(params);
	if (stale.length === 0) return [];
	if (!params.prompter.shouldRepair) {
		require_note.note([
			"Local bundled plugin install records shadow bundled plugins:",
			...stale.map((record) => `- ${record.pluginId}: ${require_utils.shortenHomePath(record.stalePath)}`),
			`Repair with ${require_command_format.formatCliCommand("openclaw doctor --fix")} to remove stale local install records and rebuild the plugin registry.`
		].join("\n"), "Plugin registry");
		return [];
	}
	require_note.note(["Removed stale local bundled plugin install record(s) shadowing bundled plugins:", ...stale.map((record) => `- ${record.pluginId}: ${require_utils.shortenHomePath(record.stalePath)}`)].join("\n"), "Plugin registry");
	return stale.map((record) => record.pluginId);
}
/** Relinks managed npm plugin packages to the current Operator host packages. */
async function maybeRepairManagedNpmOperatorPeerLinks(params) {
	const npmRoots = listManagedPluginNpmRoots(params);
	if (!params.prompter.shouldRepair) {
		const issues = (await Promise.all(npmRoots.map((npmRoot) => require_plugin_peer_link.auditOperatorPeerDependenciesInManagedNpmRoot({ npmRoot })))).flatMap((audit) => audit.issues);
		if (issues.length > 0) require_note.note([
			"Managed npm Operator host peer links need repair:",
			...issues.map((issue) => `- ${issue.packageName}: ${issue.reason}`),
			`Repair with ${require_command_format.formatCliCommand("openclaw doctor --fix")} to relink managed npm plugin packages.`
		].join("\n"), "Plugin registry");
		return false;
	}
	const messages = [];
	const logger = {
		info: (message) => messages.push({
			level: "info",
			message
		}),
		warn: (message) => messages.push({
			level: "warn",
			message
		})
	};
	const repaired = (await Promise.all(npmRoots.map((npmRoot) => require_plugin_peer_link.relinkOperatorPeerDependenciesInManagedNpmRoot({
		npmRoot,
		logger
	})))).reduce((total, result) => total + result.repaired, 0);
	if (repaired > 0) require_note.note(`Repaired Operator host peer link(s) for ${repaired} managed npm plugin package(s).`, "Plugin registry");
	const warnings = messages.filter((message) => message.level === "warn").map((message) => `- ${message.message}`);
	if (warnings.length > 0) require_note.note(["Could not repair all managed npm Operator host peer links:", ...warnings].join("\n"), "Plugin registry");
	return repaired > 0;
}
async function loadInstallRecordsWithoutPluginIds(params, pluginIds) {
	const records = await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords(params);
	for (const pluginId of pluginIds) delete records[pluginId];
	return records;
}
async function listManagedNpmOperatorPeerLinkIssues(params) {
	return (await Promise.all(listManagedPluginNpmRoots(params).map((npmRoot) => require_plugin_peer_link.auditOperatorPeerDependenciesInManagedNpmRoot({ npmRoot })))).flatMap((audit) => audit.issues);
}
async function detectPluginRegistryHealthIssues(params) {
	const preflight = preflightPluginRegistryInstallMigration(params);
	const issues = [];
	if (preflight.action === "migrate") issues.push({
		kind: "registry-missing-or-stale",
		path: preflight.filePath
	});
	for (const plugin of listStaleManagedNpmBundledPlugins(params)) issues.push({
		kind: "stale-managed-npm-bundled-plugin",
		pluginId: plugin.pluginId,
		packageName: plugin.packageName,
		packageDir: plugin.packageDir,
		npmRoot: plugin.npmRoot,
		...plugin.version ? { version: plugin.version } : {}
	});
	for (const record of await listStaleLocalBundledPluginInstallRecordShadows(params)) issues.push({
		kind: "stale-local-bundled-plugin-install-record",
		pluginId: record.pluginId,
		stalePath: record.stalePath
	});
	for (const issue of await listManagedNpmOperatorPeerLinkIssues(params)) issues.push({
		kind: "managed-npm-operator-peer-link",
		packageName: issue.packageName,
		packageDir: issue.packageDir,
		reason: issue.reason
	});
	return issues;
}
function pluginRegistryIssueToHealthFinding(issue) {
	switch (issue.kind) {
		case "registry-missing-or-stale": return {
			checkId: PLUGIN_REGISTRY_CHECK_ID,
			severity: "warning",
			message: "Persisted plugin registry is missing or stale.",
			path: issue.path,
			fixHint: "Run `openclaw doctor --fix` to rebuild the plugin registry from enabled plugins."
		};
		case "stale-managed-npm-bundled-plugin": return {
			checkId: PLUGIN_REGISTRY_CHECK_ID,
			severity: "warning",
			message: `Managed npm package ${issue.packageName}${issue.version ? `@${issue.version}` : ""} shadows bundled plugin ${issue.pluginId}.`,
			path: issue.packageDir,
			target: issue.pluginId,
			fixHint: "Run `openclaw doctor --fix` to remove stale managed npm packages and rebuild the plugin registry."
		};
		case "stale-local-bundled-plugin-install-record": return {
			checkId: PLUGIN_REGISTRY_CHECK_ID,
			severity: "warning",
			message: `Local install record for bundled plugin ${issue.pluginId} points at a stale path.`,
			path: issue.stalePath,
			target: issue.pluginId,
			fixHint: "Run `openclaw doctor --fix` to remove stale local install records and rebuild the plugin registry."
		};
		case "managed-npm-operator-peer-link": return {
			checkId: PLUGIN_REGISTRY_CHECK_ID,
			severity: "warning",
			message: `Managed npm package ${issue.packageName} has a broken Operator peer link: ${issue.reason}.`,
			path: issue.packageDir,
			target: issue.packageName,
			fixHint: "Run `openclaw doctor --fix` to relink managed npm plugin packages."
		};
	}
	return assertNeverPluginRegistryIssue(issue);
}
function pluginRegistryIssueToRepairEffect(issue) {
	switch (issue.kind) {
		case "registry-missing-or-stale": return {
			kind: "state",
			action: "would-rebuild-plugin-registry",
			target: issue.path,
			dryRunSafe: false
		};
		case "stale-managed-npm-bundled-plugin": return {
			kind: "package",
			action: "would-remove-stale-managed-npm-bundled-plugin",
			target: issue.packageDir,
			dryRunSafe: false
		};
		case "stale-local-bundled-plugin-install-record": return {
			kind: "state",
			action: "would-remove-stale-local-bundled-plugin-install-record",
			target: issue.pluginId,
			dryRunSafe: false
		};
		case "managed-npm-operator-peer-link": return {
			kind: "package",
			action: "would-relink-managed-npm-operator-peer",
			target: issue.packageDir,
			dryRunSafe: false
		};
	}
	return assertNeverPluginRegistryIssue(issue);
}
function assertNeverPluginRegistryIssue(issue) {
	throw new Error(`Unhandled plugin registry issue kind: ${String(issue.kind)}`);
}
/**
* Runs plugin registry doctor repairs and refreshes the persisted plugin index when needed.
*
* Stale bundled shadows are removed before registry migration so the rebuilt index resolves the
* current bundled source instead of an obsolete managed/local install record.
*/
async function maybeRepairPluginRegistryState(params) {
	const preflight = preflightPluginRegistryInstallMigration(params);
	for (const warning of preflight.deprecationWarnings) require_note.note(warning, "Plugin registry");
	if (preflight.action === "disabled") {
		require_note.note(`${DISABLE_PLUGIN_REGISTRY_MIGRATION_ENV} is set; skipping plugin registry repair.`, "Plugin registry");
		return params.config;
	}
	const migrationParams = {
		...params,
		config: params.config
	};
	const staleManagedNpmBundledPluginIds = listStaleManagedNpmBundledPlugins(params).map((plugin) => plugin.pluginId);
	const removedStaleManagedNpmBundledPlugins = maybeRepairStaleManagedNpmBundledPlugins(params);
	const removedStaleLocalBundledPluginIds = await maybeRepairStaleLocalBundledPluginInstallRecords(params);
	const repairedManagedNpmOperatorPeerLinks = await maybeRepairManagedNpmOperatorPeerLinks(params);
	const stalePluginIdsToRemove = [.../* @__PURE__ */ new Set([...removedStaleManagedNpmBundledPlugins ? staleManagedNpmBundledPluginIds : [], ...removedStaleLocalBundledPluginIds])];
	if (!params.prompter.shouldRepair) {
		if (preflight.action === "migrate") require_note.note(["Persisted plugin registry is missing or stale.", `Repair with ${require_command_format.formatCliCommand("openclaw doctor --fix")} to rebuild ${require_utils.shortenHomePath(preflight.filePath)} from enabled plugins.`].join("\n"), "Plugin registry");
		return params.config;
	}
	if (preflight.action === "migrate") {
		const result = await migratePluginRegistryForInstall({
			...migrationParams,
			...stalePluginIdsToRemove.length > 0 ? { installRecords: await loadInstallRecordsWithoutPluginIds(params, stalePluginIdsToRemove) } : {}
		});
		if (result.migrated) {
			const total = result.current.plugins.length;
			const enabled = result.current.plugins.filter((plugin) => plugin.enabled).length;
			require_note.note(`Plugin registry rebuilt: ${enabled}/${total} enabled plugins indexed.`, "Plugin registry");
		}
		return params.config;
	}
	if (preflight.action === "skip-existing" || removedStaleManagedNpmBundledPlugins || removedStaleLocalBundledPluginIds.length > 0 || repairedManagedNpmOperatorPeerLinks) {
		const index = await require_plugin_registry.refreshPluginRegistry({
			...migrationParams,
			reason: "migration",
			...stalePluginIdsToRemove.length > 0 ? { installRecords: await loadInstallRecordsWithoutPluginIds(params, stalePluginIdsToRemove) } : {}
		});
		const total = index.plugins.length;
		const enabled = index.plugins.filter((plugin) => plugin.enabled).length;
		require_note.note(`Plugin registry refreshed: ${enabled}/${total} enabled plugins indexed.`, "Plugin registry");
	}
	return params.config;
}
//#endregion
exports.detectPluginRegistryHealthIssues = detectPluginRegistryHealthIssues;
exports.maybeRepairManagedNpmOperatorPeerLinks = maybeRepairManagedNpmOperatorPeerLinks;
exports.maybeRepairPluginRegistryState = maybeRepairPluginRegistryState;
exports.maybeRepairStaleManagedNpmBundledPlugins = maybeRepairStaleManagedNpmBundledPlugins;
exports.pluginRegistryIssueToHealthFinding = pluginRegistryIssueToHealthFinding;
exports.pluginRegistryIssueToRepairEffect = pluginRegistryIssueToRepairEffect;
