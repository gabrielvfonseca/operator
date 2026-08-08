const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_legacy_names = require("./legacy-names-CjJxLNks.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_config = require("./config-DT0qiglW.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_installed_plugin_index_records = require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_plugins_allowlist = require("./plugins-allowlist-TYOT6QRc.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
const require_nix_mode_write_guard = require("./nix-mode-write-guard-mnuDSCNv.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_clawhub_trust_error_details = require("./clawhub-trust-error-details-D2MhbmgV.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_uninstall = require("./uninstall-C0yddP-R.cjs");
const require_install_record_commit = require("./install-record-commit-BUsKCeHe.cjs");
const require_registry_refresh = require("./registry-refresh-B3eSyFEy.cjs");
const require_install_persistence = require("./install-persistence-BlOFu5Bz.cjs");
const require_clawhub_error_codes = require("./clawhub-error-codes-BKV6QaJg.cjs");
const require_clawhub_install_records = require("./clawhub-install-records-EIHewKTB.cjs");
const require_clawhub$1 = require("./clawhub-FY3ULXyp.cjs");
const require_config_reload_plan = require("./config-reload-plan-Br2Lvuc3.cjs");
const require_config_reload_settings = require("./config-reload-settings-DfutOn_X.cjs");
const require_catalog_search = require("./catalog-search-Dtuw8S01.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
//#region src/plugins/management-service.ts
var ManagedPluginLifecycleError = class extends Error {
	constructor(message, details) {
		super(message, details?.cause !== void 0 ? { cause: details.cause } : void 0);
		this.name = "ManagedPluginLifecycleError";
		this.kind = details?.kind ?? "invalid-request";
		this.code = details?.code;
		this.version = details?.version;
		this.warning = details?.warning;
	}
};
let officialCatalogCache;
function officialCatalogCacheKey(config) {
	return JSON.stringify(config.marketplaces ?? null);
}
function mergeCatalogMetadata(hosted, bundled) {
	const hostedManifest = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(hosted);
	const bundledManifest = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(bundled);
	const bundledCatalog = bundledManifest?.catalog;
	const bundledPlugin = bundledManifest?.plugin;
	const bundledName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bundled.name);
	const bundledDescription = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bundled.description);
	const bundledKind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bundled.kind);
	const bundledSource = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bundled.source);
	if (!bundledCatalog && !bundledPlugin) return hosted;
	return {
		...hosted,
		...!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(hosted.name) && bundledName ? { name: bundledName } : {},
		...!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(hosted.description) && bundledDescription ? { description: bundledDescription } : {},
		...!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(hosted.kind) && bundledKind ? { kind: bundledKind } : {},
		...!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(hosted.source) && bundledSource ? { source: bundledSource } : {},
		[require_legacy_names.MANIFEST_KEY]: {
			...hostedManifest,
			...bundledPlugin ? { plugin: {
				...hostedManifest?.plugin,
				...bundledPlugin
			} } : {},
			...bundledCatalog ? { catalog: {
				...hostedManifest?.catalog,
				...bundledCatalog
			} } : {}
		}
	};
}
function resolveCatalogPackageSourceIdentities(entry) {
	const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry);
	const clawhubPackage = install?.clawhubSpec ? require_clawhub.parseClawHubPluginSpec(install.clawhubSpec)?.name : void 0;
	const npmPackage = install?.npmSpec ? require_npm_registry_spec.parseRegistryNpmSpec(install.npmSpec)?.name : void 0;
	return /* @__PURE__ */ new Set([...clawhubPackage ? [`clawhub:${clawhubPackage}`] : [], ...npmPackage ? [`npm:${npmPackage}`] : []]);
}
function matchesBundledCatalogIdentity(params) {
	const hostedSources = resolveCatalogPackageSourceIdentities(params.hosted);
	const bundledSources = resolveCatalogPackageSourceIdentities(params.bundled);
	return [...hostedSources].some((identity) => bundledSources.has(identity));
}
/** Overlay local runtime identity and editorial hints after an exact package/source match. */
function overlayBundledOfficialPluginCatalogMetadata(entries, bundledEntries = require_official_external_plugin_catalog.listOfficialExternalPluginCatalogEntries()) {
	return entries.map((entry) => {
		const matches = bundledEntries.filter((bundled) => matchesBundledCatalogIdentity({
			hosted: entry,
			bundled
		}));
		const bundled = matches.length === 1 ? matches[0] : void 0;
		return bundled ? mergeCatalogMetadata(entry, bundled) : entry;
	});
}
async function loadOfficialCatalog(config) {
	const key = officialCatalogCacheKey(config);
	if (officialCatalogCache?.key !== key) officialCatalogCache = {
		key,
		result: require_official_external_plugin_catalog.loadConfiguredHostedOfficialExternalPluginCatalogEntries(config)
	};
	const result = await officialCatalogCache.result;
	return {
		entries: overlayBundledOfficialPluginCatalogMetadata(result.entries),
		..."error" in result ? { error: result.error } : {}
	};
}
function normalizeKinds(kind) {
	const values = (typeof kind === "string" ? [kind] : kind ?? []).map((value) => value.trim()).filter(Boolean);
	return values.length > 0 ? [...new Set(values)] : void 0;
}
function normalizeCatalogMetadata(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return;
	const record = value;
	const featured = typeof record.featured === "boolean" ? record.featured : void 0;
	const order = typeof record.order === "number" && Number.isFinite(record.order) ? record.order : void 0;
	return featured === void 0 && order === void 0 ? void 0 : {
		...featured !== void 0 ? { featured } : {},
		...order !== void 0 ? { order } : {}
	};
}
function resolveCatalogInstallAction(params) {
	const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(params.entry, { catalogConfig: params.config.marketplaces });
	const clawhub = install?.clawhubSpec ? require_clawhub.parseClawHubPluginSpec(install.clawhubSpec) : void 0;
	if (clawhub && !clawhub.version) return {
		source: "clawhub",
		packageName: clawhub.name
	};
	return install ? {
		source: "official",
		pluginId: params.pluginId
	} : void 0;
}
/** Coarse manifest-derived grouping so catalog UIs can shelve a large inventory. */
function derivePluginCategory(manifest) {
	if (!manifest) return;
	if (manifest.channels.length > 0 || Object.keys(manifest.channelConfigs ?? {}).length > 0) return "channel";
	const mediaProvider = Object.keys(manifest.imageGenerationProviderMetadata ?? {}).length > 0 || Object.keys(manifest.videoGenerationProviderMetadata ?? {}).length > 0 || Object.keys(manifest.musicGenerationProviderMetadata ?? {}).length > 0 || Object.keys(manifest.mediaUnderstandingProviderMetadata ?? {}).length > 0;
	if (manifest.providers.length > 0 || manifest.providerEndpoints?.length || manifest.modelCatalog || mediaProvider) return "provider";
	const kinds = normalizeKinds(manifest.kind);
	if (kinds?.includes("memory")) return "memory";
	if (kinds?.includes("context-engine")) return "context-engine";
	if (manifest.contracts?.tools?.length || Object.keys(manifest.toolMetadata ?? {}).length > 0 || manifest.skills.length > 0) return "tool";
}
function firstPluginError(diagnostics, pluginId) {
	return diagnostics.find((diagnostic) => diagnostic.level === "error" && diagnostic.pluginId === pluginId)?.message;
}
function compareCatalogEntries(left, right) {
	const featured = Number(Boolean(right.featured)) - Number(Boolean(left.featured));
	if (featured !== 0) return featured;
	const order = (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER);
	return order !== 0 ? order : left.name.localeCompare(right.name);
}
/** Build cold installed state merged with the hosted official catalog and bundled curation. */
async function listManagedPlugins(params) {
	const env = params.env ?? process.env;
	const metadata = require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: params.config,
		env
	});
	const officialCatalog = params.officialCatalog ?? await loadOfficialCatalog(params.config);
	const plugins = metadata.index.plugins.map((record) => {
		const manifest = metadata.byPluginId.get(record.pluginId);
		const catalog = normalizeCatalogMetadata(manifest?.catalog);
		const error = firstPluginError(metadata.diagnostics, record.pluginId);
		const kind = normalizeKinds(manifest?.kind);
		const category = derivePluginCategory(manifest);
		const removable = record.origin !== "bundled" && Boolean(metadata.index.installRecords[record.pluginId]);
		const name = (manifest?.name && manifest.name !== record.packageName ? manifest.name : void 0) ?? manifest?.channelCatalogMeta?.label ?? record.pluginId;
		const description = manifest?.description ?? manifest?.channelCatalogMeta?.blurb ?? manifest?.packageDescription;
		return {
			id: record.pluginId,
			name,
			...record.packageName ? { packageName: record.packageName } : {},
			...description ? { description } : {},
			...record.packageVersion || manifest?.version ? { version: record.packageVersion ?? manifest?.version } : {},
			...kind ? { kind } : {},
			...record.origin ? { origin: record.origin } : {},
			installed: true,
			enabled: record.enabled,
			state: error ? "error" : record.enabled ? "enabled" : "disabled",
			...catalog?.featured !== void 0 ? { featured: catalog.featured } : {},
			...catalog?.order !== void 0 ? { order: catalog.order } : {},
			...error ? { error } : {},
			...category ? { category } : {},
			removable
		};
	});
	const installedIds = new Set(plugins.map((plugin) => plugin.id));
	const installedPackageNames = new Set(plugins.flatMap((plugin) => plugin.packageName ? [plugin.packageName] : []));
	const entryPackageInstalled = (entry) => [...resolveCatalogPackageSourceIdentities(entry)].some((identity) => installedPackageNames.has(identity.slice(identity.indexOf(":") + 1)));
	for (const entry of officialCatalog.entries) {
		const pluginId = require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry);
		const catalog = normalizeCatalogMetadata(require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(entry)?.catalog);
		if (!pluginId || !catalog || installedIds.has(pluginId) || entryPackageInstalled(entry)) continue;
		const kind = normalizeKinds(entry.kind);
		const install = resolveCatalogInstallAction({
			config: params.config,
			entry,
			pluginId
		});
		const description = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.description);
		const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.version);
		plugins.push({
			id: pluginId,
			name: require_official_external_plugin_catalog.resolveOfficialExternalPluginLabel(entry),
			...description ? { description } : {},
			...version ? { version } : {},
			...kind ? { kind } : {},
			origin: "official",
			installed: false,
			enabled: false,
			state: "not-installed",
			...catalog.featured !== void 0 ? { featured: catalog.featured } : {},
			...catalog.order !== void 0 ? { order: catalog.order } : {},
			...install ? { install } : {}
		});
	}
	const diagnostics = [...metadata.diagnostics];
	if (officialCatalog.error) diagnostics.push({
		level: "warn",
		message: `Official plugin catalog fallback: ${officialCatalog.error}`
	});
	return {
		plugins: plugins.toSorted(compareCatalogEntries),
		diagnostics,
		mutationAllowed: !require_paths.resolveIsNixMode(env)
	};
}
const withManagedPluginMutationLock = (0, _openclaw_fs_safe_advanced.createAsyncLock)();
function assertValidConfigSnapshot(prepared) {
	const { snapshot, writeOptions } = prepared;
	if (!snapshot.valid) throw new ManagedPluginLifecycleError("Config invalid; run `openclaw doctor --fix` before managing plugins.");
	const mutationWriteOptions = require_install_persistence.selectInstallMutationWriteOptions(writeOptions);
	const { pluginMutation } = require_install_persistence.resolveInstallConfigMutationPreflights({
		parsed: snapshot.parsed ?? {},
		snapshotPath: snapshot.path,
		writeOptions: mutationWriteOptions
	});
	if (pluginMutation.mode === "blocked") throw new ManagedPluginLifecycleError(pluginMutation.reason);
	return {
		config: snapshot.sourceConfig,
		baseHash: snapshot.hash,
		writeOptions: mutationWriteOptions
	};
}
async function readPluginMutationSnapshot(env) {
	try {
		require_nix_mode_write_guard.assertConfigWriteAllowedInCurrentMode({ env });
	} catch (error) {
		throw new ManagedPluginLifecycleError(require_errors.formatErrorMessage(error), { cause: error });
	}
	return assertValidConfigSnapshot(await require_io.readConfigFileSnapshotForWrite());
}
function createSilentRuntime() {
	return {
		log: () => void 0,
		error: () => void 0,
		exit: (code) => {
			throw new ManagedPluginLifecycleError(`plugin lifecycle exited with code ${code}`);
		}
	};
}
function createInstallLogger(warnings) {
	return {
		info: () => void 0,
		warn: (message) => warnings.push(message)
	};
}
function resolveOfficialEntryById(entries, pluginId) {
	return entries.find((entry) => require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry) === pluginId);
}
/** Explicitly declared runtime id, ignoring the entry-id fallback used for display. */
function resolveDeclaredOfficialPluginId(entry) {
	const manifest = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogManifest(entry);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.plugin?.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.channel?.id) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(manifest?.providers?.[0]?.id);
}
function resolveOfficialEntryByClawHubPackage(entries, config, packageName) {
	return [...require_official_external_plugin_catalog.listOfficialExternalPluginCatalogEntries(), ...entries].find((entry) => {
		return require_clawhub.parseClawHubPluginSpec(require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry, { catalogConfig: config.marketplaces })?.clawhubSpec ?? "")?.name === packageName;
	});
}
function resolveHostedOfficialEntryByClawHubPackage(entries, config, packageName) {
	return entries.find((entry) => {
		return require_clawhub.parseClawHubPluginSpec(require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry, { catalogConfig: config.marketplaces })?.clawhubSpec ?? "")?.name === packageName;
	});
}
function buildClawHubSpec(packageName, version) {
	const parsed = require_clawhub.parseClawHubPluginSpec(`clawhub:${packageName}`);
	if (!parsed || parsed.version) throw new ManagedPluginLifecycleError(`invalid ClawHub package name: ${packageName}`);
	return `clawhub:${packageName}${version ? `@${version}` : ""}`;
}
function throwInstallFailure(result) {
	const unavailable = !result.code || result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.ARTIFACT_UNAVAILABLE || result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.ARTIFACT_DOWNLOAD_UNAVAILABLE || result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_SECURITY_UNAVAILABLE;
	throw new ManagedPluginLifecycleError(result.error, {
		kind: unavailable ? "unavailable" : "invalid-request",
		code: result.code,
		version: result.version,
		warning: result.warning,
		cause: result
	});
}
function installRecordOwnsTarget(record, targetDir) {
	return Boolean(record?.installPath && node_path.default.resolve(record.installPath) === node_path.default.resolve(targetDir));
}
async function cleanupFailedManagedPluginInstall(params) {
	let installRecords;
	try {
		installRecords = await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords();
	} catch (error) {
		return [`Could not verify whether the failed plugin install was committed; retained ${params.targetDir}: ${require_errors.formatErrorMessage(error)}`];
	}
	if (installRecordOwnsTarget(installRecords[params.pluginId], params.targetDir)) return [`Plugin install persistence reported an error after ${params.targetDir} was recorded; retained the managed target.`];
	const plan = require_uninstall.planPluginUninstall({
		config: { plugins: { installs: { [params.pluginId]: params.install } } },
		pluginId: params.pluginId,
		deleteFiles: true,
		extensionsDir: params.extensionsDir
	});
	if (!plan.ok) return [`Could not plan cleanup for failed plugin install: ${plan.error}`];
	if (!plan.directoryRemoval) return [`Could not resolve a managed cleanup target for failed plugin install ${params.pluginId}.`];
	if (node_path.default.resolve(plan.directoryRemoval.target) !== node_path.default.resolve(params.targetDir)) return [`Refused cleanup for failed plugin install ${params.pluginId}: planned target does not match the newly installed target.`];
	try {
		return (await require_uninstall.applyPluginUninstallDirectoryRemoval(plan.directoryRemoval)).warnings;
	} catch (error) {
		return [`Failed to remove the newly installed target after plugin persistence failed: ${require_errors.formatErrorMessage(error)}`];
	}
}
function throwPersistenceFailureWithCleanupWarnings(error, warnings) {
	if (warnings.length === 0) throw error;
	const cleanupWarning = [...new Set(warnings)].join("\n");
	if (error instanceof ManagedPluginLifecycleError) throw new ManagedPluginLifecycleError(error.message, {
		kind: error.kind,
		code: error.code,
		version: error.version,
		warning: [error.warning, cleanupWarning].filter(Boolean).join("\n"),
		cause: error
	});
	throw new ManagedPluginLifecycleError(require_errors.formatErrorMessage(error), {
		kind: "unavailable",
		warning: cleanupWarning,
		cause: error
	});
}
async function persistManagedPluginInstall(params) {
	try {
		return await require_install_persistence.persistPluginInstall({
			snapshot: params.snapshot,
			pluginId: params.pluginId,
			install: params.install,
			invalidateRuntimeCache: false,
			runtime: createSilentRuntime()
		});
	} catch (error) {
		return throwPersistenceFailureWithCleanupWarnings(error, await cleanupFailedManagedPluginInstall({
			pluginId: params.pluginId,
			install: params.install,
			targetDir: params.targetDir,
			extensionsDir: params.extensionsDir
		}));
	}
}
async function installFromClawHub(params) {
	const packageName = params.request.packageName.trim();
	const official = resolveOfficialEntryByClawHubPackage(params.officialEntries, params.snapshot.config, packageName);
	const expectedPluginId = official ? resolveDeclaredOfficialPluginId(official) : void 0;
	const hostedOfficial = resolveHostedOfficialEntryByClawHubPackage(params.officialEntries, params.snapshot.config, packageName);
	const hostedInstall = hostedOfficial ? require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(hostedOfficial, { catalogConfig: params.snapshot.config.marketplaces }) : void 0;
	const hostedClawHub = require_clawhub.parseClawHubPluginSpec(hostedInstall?.clawhubSpec ?? "");
	const requestMatchesHostedCandidate = !params.request.version || params.request.version === hostedClawHub?.version;
	const expectedIntegrity = params.expectedIntegrity ?? (requestMatchesHostedCandidate ? hostedInstall?.expectedIntegrity : void 0);
	const spec = buildClawHubSpec(packageName, params.request.version ?? (requestMatchesHostedCandidate ? hostedClawHub?.version : void 0));
	const extensionsDir = require_install_paths.resolveDefaultPluginExtensionsDir(params.env);
	const result = await require_clawhub$1.installPluginFromClawHub({
		spec,
		config: params.snapshot.config,
		extensionsDir,
		logger: createInstallLogger(params.warnings),
		...expectedPluginId ? { expectedPluginId } : {},
		...expectedIntegrity ? { expectedIntegrity } : {},
		...params.request.acknowledgeClawHubRisk ? { acknowledgeClawHubRisk: true } : {}
	});
	if (!result.ok) return throwInstallFailure(result);
	if (expectedPluginId && result.pluginId !== expectedPluginId) throw new ManagedPluginLifecycleError(`official catalog plugin id mismatch: expected ${expectedPluginId}, got ${result.pluginId}`);
	const install = {
		...require_clawhub_install_records.buildClawHubPluginInstallRecordFields(result.clawhub),
		spec,
		installPath: result.targetDir
	};
	const config = await persistManagedPluginInstall({
		snapshot: params.snapshot,
		pluginId: result.pluginId,
		install,
		targetDir: result.targetDir,
		extensionsDir
	});
	return {
		pluginId: result.pluginId,
		config
	};
}
async function installFromOfficialCatalog(params) {
	const entry = resolveOfficialEntryById(params.officialEntries, params.request.pluginId);
	if (!entry) throw new ManagedPluginLifecycleError(`unknown official plugin catalog entry: ${params.request.pluginId}`);
	const pluginId = require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry);
	const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry, { catalogConfig: params.snapshot.config.marketplaces });
	if (!pluginId || !install) throw new ManagedPluginLifecycleError(`official plugin catalog entry is not installable: ${params.request.pluginId}`);
	const clawhub = install.clawhubSpec ? require_clawhub.parseClawHubPluginSpec(install.clawhubSpec) : void 0;
	if (clawhub) return await installFromClawHub({
		request: {
			source: "clawhub",
			packageName: clawhub.name,
			...clawhub.version ? { version: clawhub.version } : {}
		},
		snapshot: params.snapshot,
		officialEntries: params.officialEntries,
		env: params.env,
		warnings: params.warnings,
		...install.expectedIntegrity ? { expectedIntegrity: install.expectedIntegrity } : {}
	});
	if (!install.npmSpec) throw new ManagedPluginLifecycleError(`official plugin catalog entry has no supported install source: ${params.request.pluginId}`);
	const extensionsDir = require_install_paths.resolveDefaultPluginExtensionsDir(params.env);
	const result = await require_clawhub_error_codes.installPluginFromNpmSpec({
		spec: install.npmSpec,
		config: params.snapshot.config,
		extensionsDir,
		expectedPluginId: pluginId,
		...install.expectedIntegrity ? { expectedIntegrity: install.expectedIntegrity } : {},
		trustedSourceLinkedOfficialInstall: true,
		logger: createInstallLogger(params.warnings)
	});
	if (!result.ok) return throwInstallFailure(result);
	if (result.pluginId !== pluginId) throw new ManagedPluginLifecycleError(`official catalog plugin id mismatch: expected ${pluginId}, got ${result.pluginId}`);
	const installRecord = {
		source: "npm",
		spec: install.npmSpec,
		installPath: result.targetDir,
		...result.version ? { version: result.version } : {},
		...require_installed_plugin_index_records.buildNpmResolutionInstallFields(result.npmResolution)
	};
	return {
		pluginId,
		config: await persistManagedPluginInstall({
			snapshot: params.snapshot,
			pluginId,
			install: installRecord,
			targetDir: result.targetDir,
			extensionsDir
		})
	};
}
/** Install a ClawHub or curated official plugin through the canonical install pipeline. */
async function installManagedPlugin(params) {
	return await withManagedPluginMutationLock(async () => {
		const env = params.env ?? process.env;
		const snapshot = await readPluginMutationSnapshot(env);
		const officialCatalog = await loadOfficialCatalog(snapshot.config);
		const warnings = [];
		const installed = params.request.source === "clawhub" ? await installFromClawHub({
			request: params.request,
			snapshot,
			officialEntries: officialCatalog.entries,
			env,
			warnings
		}) : await installFromOfficialCatalog({
			request: params.request,
			snapshot,
			officialEntries: officialCatalog.entries,
			env,
			warnings
		});
		const plugin = (await listManagedPlugins({
			config: installed.config,
			env,
			officialCatalog
		})).plugins.find((entry) => entry.id === installed.pluginId);
		if (!plugin) throw new ManagedPluginLifecycleError(`installed plugin missing from refreshed registry: ${installed.pluginId}`);
		return {
			plugin,
			...warnings.length > 0 ? { warnings: [...new Set(warnings)] } : {}
		};
	});
}
/** Persist desired plugin policy while preserving allow/deny, slot, include, and hash guards. */
async function setManagedPluginEnabled(params) {
	return await withManagedPluginMutationLock(async () => {
		const env = params.env ?? process.env;
		const snapshot = await readPluginMutationSnapshot(env);
		const metadata = require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
			config: snapshot.config,
			env
		});
		const pluginId = metadata.normalizePluginId(params.pluginId.trim());
		if (!metadata.index.plugins.some((plugin) => plugin.pluginId === pluginId)) throw new ManagedPluginLifecycleError(`plugin not installed: ${params.pluginId}`);
		let next = snapshot.config;
		const warnings = [];
		let policyPluginId = pluginId;
		if (params.enabled) {
			if ((next.plugins?.allow?.length ?? 0) > 0) next = require_plugins_allowlist.ensurePluginAllowlisted(next, pluginId);
			const enableResult = require_enable.enableExplicitlySelectedPluginInConfig(next, pluginId, { updateChannelConfig: false });
			if (!enableResult.enabled) throw new ManagedPluginLifecycleError(`plugin "${pluginId}" could not be enabled (${enableResult.reason ?? "unknown reason"})`);
			next = enableResult.config;
			policyPluginId = enableResult.pluginId;
			const slotResult = require_install_persistence.applySlotSelectionForPlugin(next, pluginId);
			next = slotResult.config;
			warnings.push(...slotResult.warnings);
		} else next = require_enable.setPluginEnabledInConfig(next, pluginId, false, { updateChannelConfig: false });
		const changedPaths = /* @__PURE__ */ new Set();
		require_io.collectChangedPaths(snapshot.config, next, "", changedPaths);
		await require_config.replaceConfigFile({
			nextConfig: next,
			baseHash: snapshot.baseHash,
			writeOptions: snapshot.writeOptions
		});
		await require_registry_refresh.refreshPluginRegistryAfterConfigMutation({
			config: next,
			reason: "policy-changed",
			invalidateRuntimeCache: false,
			policyPluginIds: [policyPluginId]
		});
		const plugin = (await listManagedPlugins({
			config: next,
			env
		})).plugins.find((entry) => entry.id === pluginId);
		if (!plugin) throw new ManagedPluginLifecycleError(`updated plugin missing from refreshed registry: ${pluginId}`);
		return {
			plugin,
			changedPaths: [...changedPaths].filter(Boolean).toSorted(),
			...warnings.length > 0 ? { warnings } : {}
		};
	});
}
/** Remove an installed plugin: config references, install record, and managed files. */
async function uninstallManagedPlugin(params) {
	return await withManagedPluginMutationLock(async () => {
		const env = params.env ?? process.env;
		const snapshot = await readPluginMutationSnapshot(env);
		const installRecords = await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords();
		const configWithRecords = require_installed_plugin_index_records.withPluginInstallRecords(snapshot.config, installRecords);
		const metadata = require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
			config: configWithRecords,
			env
		});
		const pluginId = metadata.normalizePluginId(params.pluginId.trim());
		if (metadata.index.plugins.find((plugin) => plugin.pluginId === pluginId)?.origin === "bundled") throw new ManagedPluginLifecycleError(`bundled plugin cannot be uninstalled: ${pluginId}; disable it instead`);
		const manifest = metadata.byPluginId.get(pluginId);
		const channelIds = manifest && manifest.channels.length > 0 ? manifest.channels : void 0;
		const extensionsDir = require_install_paths.resolveDefaultPluginExtensionsDir(env);
		const plan = require_uninstall.planPluginUninstall({
			config: configWithRecords,
			pluginId,
			...channelIds ? { channelIds } : {},
			deleteFiles: true,
			extensionsDir
		});
		if (!plan.ok) throw new ManagedPluginLifecycleError(plan.error);
		const nextConfig = require_installed_plugin_index_records.withoutPluginInstallRecords(plan.config);
		const nextInstallRecords = require_installed_plugin_index_records.removePluginInstallRecordFromRecords(installRecords, pluginId);
		await require_install_record_commit.commitPluginInstallRecordsWithConfig({
			previousInstallRecords: installRecords,
			nextInstallRecords,
			nextConfig,
			baseHash: snapshot.baseHash,
			writeOptions: snapshot.writeOptions
		});
		const directoryResult = await require_uninstall.applyPluginUninstallDirectoryRemoval(plan.directoryRemoval);
		const warnings = [...directoryResult.warnings];
		await require_registry_refresh.refreshPluginRegistryAfterConfigMutation({
			config: nextConfig,
			reason: "source-changed",
			installRecords: nextInstallRecords,
			invalidateRuntimeCache: false,
			logger: { warn: (message) => warnings.push(message) }
		});
		return {
			pluginId,
			removed: require_uninstall.formatUninstallActionLabels({
				...plan.actions,
				directory: directoryResult.directoryRemoved
			}),
			...warnings.length > 0 ? { warnings: [...new Set(warnings)] } : {}
		};
	});
}
/** Normalize unexpected lifecycle failures for Gateway response adapters. */
function formatManagedPluginLifecycleError(error) {
	return require_errors.formatErrorMessage(error);
}
//#endregion
//#region src/gateway/server-methods/plugins.ts
function pluginPolicyRestartRequired(params) {
	const plan = require_config_reload_plan.buildGatewayReloadPlan([...params.changedPaths]);
	const mode = require_config_reload_settings.resolveGatewayReloadSettings(params.config).mode;
	return plan.restartGateway || mode === "off" || mode === "restart";
}
/** Gateway handlers for plugin inventory, ClawHub search, install, and policy state. */
const pluginsHandlers = {
	"plugins.list": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validatePluginsListParams, "plugins.list", respond)) return;
		try {
			respond(true, await listManagedPlugins({ config: context.getRuntimeConfig() }), void 0);
		} catch (error) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, formatManagedPluginLifecycleError(error)));
		}
	},
	"plugins.search": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validatePluginsSearchParams, "plugins.search", respond)) return;
		try {
			respond(true, { results: (await require_catalog_search.searchInstallablePluginPackages({
				query: params.query,
				limit: params.limit
			})).flatMap((entry) => {
				if (entry.package.family !== "code-plugin" && entry.package.family !== "bundle-plugin") return [];
				const downloads = entry.package.stats?.downloads;
				return [{
					score: entry.score,
					package: {
						name: entry.package.name,
						displayName: entry.package.displayName,
						family: entry.package.family,
						channel: entry.package.channel,
						isOfficial: entry.package.isOfficial,
						...entry.package.summary ? { summary: entry.package.summary } : {},
						...entry.package.latestVersion ? { latestVersion: entry.package.latestVersion } : {},
						...entry.package.runtimeId ? { runtimeId: entry.package.runtimeId } : {},
						...typeof downloads === "number" && Number.isFinite(downloads) && downloads >= 0 ? { downloads } : {},
						...entry.package.verificationTier ? { verificationTier: entry.package.verificationTier } : {}
					}
				}];
			}) }, void 0);
		} catch (error) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, formatManagedPluginLifecycleError(error)));
		}
	},
	"plugins.install": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validatePluginsInstallParams, "plugins.install", respond)) return;
		try {
			const result = await installManagedPlugin({ request: params });
			respond(true, {
				ok: true,
				plugin: result.plugin,
				restartRequired: true,
				...result.warnings ? { warnings: result.warnings } : {}
			}, void 0);
		} catch (error) {
			const lifecycleError = error instanceof ManagedPluginLifecycleError ? error : void 0;
			const trustCode = lifecycleError?.code && require_clawhub_trust_error_details.isClawHubTrustErrorCode(lifecycleError.code) ? lifecycleError.code : void 0;
			const details = lifecycleError ? require_clawhub_trust_error_details.buildClawHubTrustErrorDetails({
				...trustCode ? { code: trustCode } : {},
				...lifecycleError.version ? { version: lifecycleError.version } : {},
				...lifecycleError.warning ? { warning: lifecycleError.warning } : {}
			}) : void 0;
			respond(false, void 0, require_error_codes.errorShape(lifecycleError?.kind === "invalid-request" ? require_error_codes.ErrorCodes.INVALID_REQUEST : require_error_codes.ErrorCodes.UNAVAILABLE, formatManagedPluginLifecycleError(error), details ? { details } : void 0));
		}
	},
	"plugins.uninstall": async ({ params, respond }) => {
		if (!require_validation.assertValidParams(params, require_src.validatePluginsUninstallParams, "plugins.uninstall", respond)) return;
		try {
			const result = await uninstallManagedPlugin({ pluginId: params.pluginId });
			respond(true, {
				ok: true,
				pluginId: result.pluginId,
				restartRequired: true,
				removed: result.removed,
				...result.warnings ? { warnings: result.warnings } : {}
			}, void 0);
		} catch (error) {
			respond(false, void 0, require_error_codes.errorShape((error instanceof ManagedPluginLifecycleError ? error : void 0)?.kind === "invalid-request" ? require_error_codes.ErrorCodes.INVALID_REQUEST : require_error_codes.ErrorCodes.UNAVAILABLE, formatManagedPluginLifecycleError(error)));
		}
	},
	"plugins.setEnabled": async ({ params, respond, context }) => {
		if (!require_validation.assertValidParams(params, require_src.validatePluginsSetEnabledParams, "plugins.setEnabled", respond)) return;
		try {
			const result = await setManagedPluginEnabled({
				pluginId: params.pluginId,
				enabled: params.enabled
			});
			respond(true, {
				ok: true,
				plugin: result.plugin,
				restartRequired: pluginPolicyRestartRequired({
					config: context.getRuntimeConfig(),
					changedPaths: result.changedPaths
				}),
				...result.warnings ? { warnings: result.warnings } : {}
			}, void 0);
		} catch (error) {
			respond(false, void 0, require_error_codes.errorShape((error instanceof ManagedPluginLifecycleError ? error : void 0)?.kind === "invalid-request" ? require_error_codes.ErrorCodes.INVALID_REQUEST : require_error_codes.ErrorCodes.UNAVAILABLE, formatManagedPluginLifecycleError(error)));
		}
	}
};
//#endregion
exports.pluginsHandlers = pluginsHandlers;
