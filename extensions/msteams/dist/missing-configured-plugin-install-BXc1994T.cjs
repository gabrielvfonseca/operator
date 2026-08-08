const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_manifest = require("./manifest-YOPvCZTp.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_clawhub = require("./clawhub-DUe_UbhS.cjs");
const require_semver = require("./semver-CcnjzT8W.cjs");
const require_npm_registry_spec = require("./npm-registry-spec-zPQqYLMQ.cjs");
require("./install-safe-path-delEgqLr.cjs");
const require_install_paths = require("./install-paths-Bi14HVWN.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_discovery = require("./discovery-CRioZnAK.cjs");
const require_package_entry_resolution = require("./package-entry-resolution-VwWE-qTF.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_min_host_version = require("./min-host-version-CbJbYF_h.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_install_source_utils = require("./install-source-utils-RcPCojAk.cjs");
const require_installed_plugin_index_records = require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_config_presence = require("./config-presence-iIICLITG.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
const require_gateway_startup_speech_providers = require("./gateway-startup-speech-providers-DjyFgDFT.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
const require_web_search_install_catalog = require("./web-search-install-catalog-DYHiCZZj.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
const require_plugin_peer_link = require("./plugin-peer-link-X42f2Hn6.cjs");
const require_bundled_sources = require("./bundled-sources-xMGcgjbI.cjs");
const require_clawhub_error_codes = require("./clawhub-error-codes-BKV6QaJg.cjs");
const require_package_update_utils = require("./package-update-utils-BsCOfBMW.cjs");
const require_clawhub_install_records = require("./clawhub-install-records-EIHewKTB.cjs");
const require_clawhub$1 = require("./clawhub-FY3ULXyp.cjs");
const require_git_install = require("./git-install-DIh4esrE.cjs");
const require_marketplace = require("./marketplace-iJF1Yup-.cjs");
const require_catalog = require("./catalog-B1bu3qBh.cjs");
const require_update_channels = require("./update-channels-BEYweYMB.cjs");
const require_install_channel_specs = require("./install-channel-specs-gn0f1gcg.cjs");
const require_provider_install_catalog = require("./provider-install-catalog-Buj0eWKh.cjs");
const require_object = require("./object-Be4AQnVV.cjs");
const require_configured_provider_selection_ids = require("./configured-provider-selection-ids-Bp1YWALB.cjs");
const require_configured_runtime_plugin_installs = require("./configured-runtime-plugin-installs-CWK0S1IQ.cjs");
const require_update_phase = require("./update-phase-noJPNQLY.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/update.ts
/** Updates installed plugins across npm, ClawHub, marketplace, Git, and bundled bridge sources. */
/** Return whether a tracked plugin install source can be updated in place. */
function isPluginInstallRecordUpdateSource(record) {
	return record?.source === "npm" || record?.source === "marketplace" || record?.source === "clawhub" || record?.source === "git";
}
async function hasRunnableInstalledNpmPayload(params) {
	const extensions = require_manifest.resolvePackageExtensionEntries(params.manifest);
	if (extensions.status !== "ok") return false;
	return (await require_package_entry_resolution.validatePackageExtensionEntriesForInstall({
		packageDir: params.installPath,
		extensions: extensions.entries,
		manifest: params.manifest ?? {}
	})).ok;
}
function formatNpmInstallFailure(params) {
	if (params.result.code === require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.NPM_PACKAGE_NOT_FOUND) return `Failed to ${params.phase} ${params.pluginId}: npm package not found for ${params.spec}.`;
	return `Failed to ${params.phase} ${params.pluginId}: ${params.result.error}`;
}
function formatMarketplaceInstallFailure(params) {
	return `Failed to ${params.phase} ${params.pluginId}: ${params.error} (marketplace plugin ${params.marketplacePlugin} from ${params.marketplaceSource}).`;
}
function formatClawHubInstallFailure(params) {
	return `Failed to ${params.phase} ${params.pluginId}: ${params.error} (ClawHub ${params.spec}).`;
}
function isClawHubRiskAcknowledgementRequired(result) {
	return result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_RISK_ACKNOWLEDGEMENT_REQUIRED;
}
function isClawHubDownloadBlocked(result) {
	return result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_DOWNLOAD_BLOCKED;
}
function isClawHubSecurityUnavailable(result) {
	return result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_SECURITY_UNAVAILABLE;
}
function readClawHubTrustErrorCode(result) {
	if (result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_RISK_ACKNOWLEDGEMENT_REQUIRED || result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_DOWNLOAD_BLOCKED || result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_SECURITY_UNAVAILABLE) return result.code;
}
function shouldSkipClawHubTrustFailureForExistingInstall(params) {
	if (isClawHubRiskAcknowledgementRequired(params.result)) return Boolean(params.currentVersion);
	if (isClawHubSecurityUnavailable(params.result)) return Boolean(params.currentVersion);
	if (!isClawHubDownloadBlocked(params.result)) return false;
	return Boolean(params.result.version && params.currentVersion && params.result.version !== params.currentVersion);
}
function buildClawHubTrustSkippedOutcome(params) {
	return {
		pluginId: params.pluginId,
		status: "skipped",
		...params.code ? { code: params.code } : {},
		...params.currentVersion ? { currentVersion: params.currentVersion } : {},
		...params.warning ? { warning: params.warning } : {},
		message: `Skipped ${params.pluginId} ClawHub ${params.phase}: ${params.error} Existing installed plugin left unchanged.`
	};
}
function isClawHubTrustSkippedOutcome(outcome) {
	return outcome.status === "skipped" && (outcome.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_RISK_ACKNOWLEDGEMENT_REQUIRED || outcome.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_DOWNLOAD_BLOCKED || outcome.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.CLAWHUB_SECURITY_UNAVAILABLE);
}
function formatGitInstallFailure(params) {
	return `Failed to ${params.phase} ${params.pluginId}: ${params.error} (git ${params.spec}).`;
}
function shouldSkipUnchangedNpmInstall(params) {
	if (!params.currentVersion || !params.metadata.version) return false;
	if (params.currentVersion !== params.metadata.version) return false;
	if (!params.record.resolvedName || !params.record.resolvedSpec || !params.record.resolvedVersion) return false;
	if (!params.metadata.name || !params.metadata.resolvedSpec) return false;
	if (params.metadata.integrity && !params.record.integrity) return false;
	if (params.metadata.shasum && !params.record.shasum) return false;
	return (!params.metadata.integrity || params.record.integrity === params.metadata.integrity) && (!params.metadata.shasum || params.record.shasum === params.metadata.shasum) && params.record.resolvedName === params.metadata.name && params.record.resolvedSpec === params.metadata.resolvedSpec && params.record.resolvedVersion === params.metadata.version;
}
function shouldBypassTrustedOfficialUnchangedNpmCheck(params) {
	if (!params.trustedSourceLinkedOfficialInstall || !params.metadata.version) return false;
	const parsedSpec = require_npm_registry_spec.parseRegistryNpmSpec(params.spec);
	return Boolean(parsedSpec && !require_npm_registry_spec.isPrereleaseResolutionAllowed({
		spec: parsedSpec,
		resolvedVersion: params.metadata.version
	}));
}
function expectedIntegrityForNpmUpdate(params) {
	if (params.record.source !== "npm") return;
	if (params.effectiveSpec === params.record.spec) return require_package_update_utils.expectedIntegrityForUpdate(params.record.spec, params.record.integrity);
	if (!params.trustedSourceLinkedOfficialInstall || !params.metadata) return;
	const metadataName = params.metadata.name ?? resolveNpmSpecPackageName(params.effectiveSpec);
	const recordName = params.record.resolvedName ?? resolveNpmSpecPackageName(params.record.resolvedSpec) ?? resolveNpmSpecPackageName(params.record.spec);
	if (!metadataName || metadataName !== recordName) return;
	if (!params.metadata.version || params.metadata.version !== params.record.resolvedVersion) return;
	return require_package_update_utils.expectedIntegrityForUpdate(params.record.resolvedSpec ?? params.record.spec, params.record.integrity);
}
function compareNpmSemverForUpdate(left, right) {
	const releaseCmp = require_npm_registry_spec.compareOperatorReleaseVersions(left, right);
	if (releaseCmp !== null) return releaseCmp;
	return require_semver.compareValidSemver(left, right) ?? 0;
}
async function resolveNewerExactPinnedNpmDefaultLine(params) {
	if (!params.currentVersion || !params.probeNpmVersion || !params.effectiveSpec) return;
	const packageName = resolveNpmSpecPackageName(params.effectiveSpec);
	const exactVersion = resolveExactNpmSpecVersion(params.effectiveSpec);
	const probeNpmVersion = normalizeExactNpmVersion(params.probeNpmVersion);
	if (!packageName || !exactVersion || probeNpmVersion !== exactVersion) return;
	const metadataResult = await require_install_source_utils.resolveNpmSpecMetadata({
		spec: packageName,
		timeoutMs: params.timeoutMs
	}).catch(() => void 0);
	if (!metadataResult?.ok || metadataResult.metadata.name !== packageName || !metadataResult.metadata.version) return;
	return compareNpmSemverForUpdate(metadataResult.metadata.version, params.currentVersion) > 0 ? {
		packageName,
		version: metadataResult.metadata.version
	} : void 0;
}
async function loadNpmPackageVersionsForUpdate(params) {
	const versions = await require_exec.runCommandWithTimeout([
		"npm",
		"view",
		params.packageName,
		"versions",
		"--json"
	], {
		timeoutMs: Math.max(params.timeoutMs ?? 0, 6e4),
		env: require_install_source_utils.createNpmMetadataEnv()
	});
	if (versions?.code !== 0) return null;
	let parsed;
	try {
		parsed = JSON.parse(versions.stdout.trim());
	} catch {
		return null;
	}
	return (Array.isArray(parsed) ? parsed : [parsed]).filter((value) => typeof value === "string" && require_npm_registry_spec.isExactSemverVersion(value));
}
async function resolveTrustedOfficialPrereleaseFallbackMetadataForUpdate(params) {
	const parsedSpec = require_npm_registry_spec.parseRegistryNpmSpec(params.spec);
	if (!parsedSpec?.name.startsWith("@gabrielvfonseca/") || !params.metadata.version || require_npm_registry_spec.isPrereleaseResolutionAllowed({
		spec: parsedSpec,
		resolvedVersion: params.metadata.version
	})) return;
	const versions = await loadNpmPackageVersionsForUpdate({
		packageName: parsedSpec.name,
		timeoutMs: params.timeoutMs
	});
	const stableVersion = versions?.filter((value) => !require_npm_registry_spec.isPrereleaseSemverVersion(value)).toSorted(compareNpmSemverForUpdate).at(-1);
	if (stableVersion) {
		const stableMetadata = await require_install_source_utils.resolveNpmSpecMetadata({
			spec: `${parsedSpec.name}@${stableVersion}`,
			timeoutMs: params.timeoutMs
		});
		return stableMetadata.ok ? {
			kind: "stable",
			metadata: stableMetadata.metadata
		} : void 0;
	}
	const prereleaseVersion = versions?.filter(require_npm_registry_spec.isPrereleaseSemverVersion).toSorted(compareNpmSemverForUpdate).at(-1);
	if (!prereleaseVersion || !versions?.every(require_npm_registry_spec.isPrereleaseSemverVersion)) return;
	if (prereleaseVersion === params.metadata.version) return {
		kind: "prerelease-only",
		metadata: params.metadata
	};
	const prereleaseMetadata = await require_install_source_utils.resolveNpmSpecMetadata({
		spec: `${parsedSpec.name}@${prereleaseVersion}`,
		timeoutMs: params.timeoutMs
	});
	return prereleaseMetadata.ok ? {
		kind: "prerelease-only",
		metadata: prereleaseMetadata.metadata
	} : void 0;
}
async function expectedIntegrityForNpmFallback(params) {
	if (params.record.source !== "npm" || !params.fallbackSpec) return;
	if (params.fallbackSpec === params.record.spec) return require_package_update_utils.expectedIntegrityForUpdate(params.record.spec, params.record.integrity);
	if (!params.trustedSourceLinkedOfficialInstall) return;
	const fallbackMetadata = await require_install_source_utils.resolveNpmSpecMetadata({
		spec: params.fallbackSpec,
		timeoutMs: params.timeoutMs
	});
	if (!fallbackMetadata.ok) return;
	const expectedIntegrityMetadata = (await resolveTrustedOfficialPrereleaseFallbackMetadataForUpdate({
		metadata: fallbackMetadata.metadata,
		spec: params.fallbackSpec,
		timeoutMs: params.timeoutMs
	}))?.metadata ?? fallbackMetadata.metadata;
	if (!isNpmMetadataCompatibleWithCurrentHost(expectedIntegrityMetadata)) return;
	return expectedIntegrityForNpmUpdate({
		effectiveSpec: params.fallbackSpec,
		metadata: expectedIntegrityMetadata,
		record: params.record,
		trustedSourceLinkedOfficialInstall: true
	});
}
function isNpmMetadataCompatibleWithCurrentHost(metadata) {
	const hostVersion = require_version.resolveCompatibilityHostVersion();
	const installMetadata = metadata.packageOperator?.install;
	if (!require_min_host_version.checkMinHostVersion({
		currentVersion: hostVersion,
		minHostVersion: (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(installMetadata) ? installMetadata.minHostVersion : void 0
	}).ok) return false;
	const pluginApiRangeCheck = require_package_entry_resolution.resolvePackagePluginApiRange(metadata.packageOperator);
	if (!pluginApiRangeCheck.ok) return false;
	const pluginApiRange = pluginApiRangeCheck.range;
	if (!pluginApiRange) return true;
	return require_clawhub.satisfiesPluginApiRange(hostVersion, pluginApiRange);
}
function isBundledVersionNewer(bundledVersion, installedVersion) {
	const releaseCmp = require_npm_registry_spec.compareOperatorReleaseVersions(bundledVersion, installedVersion);
	if (releaseCmp !== null) return releaseCmp > 0;
	return (require_semver.compareValidSemver(bundledVersion, installedVersion) ?? 0) > 0;
}
function pathsEqual$1(left, right, env = process.env) {
	if (!left || !right) return false;
	return require_home_dir.resolveUserPath(left, env) === require_home_dir.resolveUserPath(right, env);
}
function resolveRecordedExtensionsDir(params) {
	const parentDir = node_path.default.dirname(params.installPath);
	try {
		return pathsEqual$1(require_install_paths.resolvePluginInstallDir(params.pluginId, parentDir), params.installPath) ? parentDir : void 0;
	} catch {
		return;
	}
}
function shouldFallbackClawHubBridgeToNpm(params) {
	if (!require_npm_registry_spec.isOperatorOrgNpmSpec(params.npmSpec)) return false;
	return params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.PACKAGE_NOT_FOUND || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.VERSION_NOT_FOUND || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.ARTIFACT_DOWNLOAD_UNAVAILABLE || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.ARTIFACT_UNAVAILABLE;
}
function shouldFallbackClawHubToDefault(result) {
	return result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.PACKAGE_NOT_FOUND || result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.VERSION_NOT_FOUND;
}
function shouldFallbackBetaClawHubUpdate(result) {
	return shouldFallbackClawHubToDefault(result);
}
function isUnavailableNpmTarget(result) {
	return result.code === require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.NPM_PACKAGE_NOT_FOUND || /\b(ETARGET|notarget)\b|No matching version found|dist-tag|tag .*not found/i.test(result.error);
}
function describeBetaNpmFallback(params) {
	const betaSpec = params.betaSpec ?? "the beta npm release";
	const reason = isUnavailableNpmTarget(params.result) ? "has no beta npm release" : "failed beta npm update";
	return `Plugin "${params.pluginId}" ${reason} for ${betaSpec}; using ${params.fallbackSpec} instead. Core update can still complete.`;
}
function formatNpmSpecSelectorLabel(spec) {
	const parsed = spec ? require_npm_registry_spec.parseRegistryNpmSpec(spec) : void 0;
	if (!parsed) return spec ?? "unknown";
	if (parsed.selectorKind === "none") return "@latest";
	return `@${parsed.selector}`;
}
function describeNpmChannelFallback(params) {
	const requestedSpec = params.requestedSpec ?? "unknown";
	const requestedLabel = formatNpmSpecSelectorLabel(params.requestedSpec);
	const usedLabel = formatNpmSpecSelectorLabel(params.usedSpec);
	const reason = isUnavailableNpmTarget(params.result) ? "unavailable" : "failed";
	const message = reason === "unavailable" ? `plugin channel fallback: ${params.pluginId} ${params.verb} ${usedLabel} because ${requestedLabel} was unavailable` : `plugin channel fallback: ${params.pluginId} ${params.verb} ${usedLabel} after ${requestedLabel} failed`;
	return {
		requestedSpec,
		usedSpec: params.usedSpec,
		requestedLabel,
		usedLabel,
		reason,
		message
	};
}
function formatBetaChannelFallbackOutcomeSuffix(params) {
	if (!params.fallbackSpec) return "";
	const betaTarget = params.fallbackLabel ?? "beta target";
	return ` (warning: beta channel fallback ${params.verb} ${params.fallbackSpec} because ${betaTarget} could not be used).`;
}
function npmUpdateFailureSpec(params) {
	if (params.usedFallback && params.fallbackSpec) return params.fallbackSpec;
	return params.effectiveSpec ?? params.fallbackSpec ?? "unknown";
}
function resolveNpmSpecPackageName(spec) {
	return spec ? require_npm_registry_spec.parseRegistryNpmSpec(spec)?.name : void 0;
}
function resolveExactNpmSpecVersion(spec) {
	const parsed = spec ? require_npm_registry_spec.parseRegistryNpmSpec(spec) : null;
	return parsed?.selectorKind === "exact-version" ? normalizeExactNpmVersion(parsed.selector) : void 0;
}
function normalizeExactNpmVersion(value) {
	if (!value) return;
	const trimmed = value.trim();
	if (!require_npm_registry_spec.isExactSemverVersion(trimmed)) return;
	return trimmed.startsWith("v") ? trimmed.slice(1) : trimmed;
}
function resolveNpmResultVersion(result) {
	return result.npmResolution?.version;
}
function resolveClawHubSpecPackageName(spec) {
	return spec ? require_clawhub.parseClawHubPluginSpec(spec)?.name : void 0;
}
function isOfficialClawHubInstallRecord(record) {
	if (record.source !== "clawhub" || record.clawhubChannel !== "official") return false;
	return (record.clawhubUrl ?? "").replace(/\/+$/, "") === "https://clawhub.ai";
}
function resolveTrustedSourceLinkedOfficialNpmFallbackForClawHubUpdate(params) {
	if (!isOfficialClawHubInstallRecord(params.record)) return null;
	const entry = require_official_external_plugin_catalog.getOfficialExternalPluginCatalogEntry(params.pluginId);
	if (!entry) return null;
	const officialSpec = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry)?.npmSpec;
	const officialPackageName = resolveNpmSpecPackageName(officialSpec);
	if (!officialSpec || !officialPackageName) return null;
	if (![
		params.record.clawhubPackage,
		resolveClawHubSpecPackageName(params.record.spec),
		resolveClawHubSpecPackageName(params.effectiveClawHubSpec)
	].filter((value) => Boolean(value)).includes(officialPackageName)) return null;
	const effectiveClawHubVersion = params.effectiveClawHubSpec ? require_clawhub.parseClawHubPluginSpec(params.effectiveClawHubSpec)?.version : void 0;
	const recordClawHubVersion = params.recordClawHubSpec ? require_clawhub.parseClawHubPluginSpec(params.recordClawHubSpec)?.version : void 0;
	if (effectiveClawHubVersion && effectiveClawHubVersion.toLowerCase() !== "latest") return {
		installSpec: `${officialPackageName}@${effectiveClawHubVersion}`,
		recordSpec: recordClawHubVersion && recordClawHubVersion.toLowerCase() !== "latest" ? `${officialPackageName}@${recordClawHubVersion}` : officialSpec,
		...params.updateChannel === "beta" && effectiveClawHubVersion.toLowerCase() === "beta" ? {
			fallbackSpec: officialSpec,
			fallbackLabel: `${officialPackageName}@beta`
		} : {}
	};
	return require_install_channel_specs.resolveNpmInstallSpecsForUpdateChannel({
		spec: officialSpec,
		updateChannel: params.updateChannel,
		officialPackageName,
		coreVersion: params.coreVersion
	});
}
function isTrustedSourceLinkedOfficialNpmUpdate(params) {
	const officialPackageName = resolveNpmSpecPackageName(require_manifest_registry.resolveTrustedSourceLinkedOfficialNpmSpec(params));
	const requestedPackageName = resolveNpmSpecPackageName(params.spec);
	return Boolean(officialPackageName && requestedPackageName === officialPackageName);
}
function resolveNpmUpdateSpecs(params) {
	const recordSpec = params.specOverride ?? (params.updateChannel === "extended-stable" && params.record.spec ? params.record.spec : params.officialSpecOverride ?? params.record.spec);
	if (!recordSpec) return {};
	if (params.specOverride) return require_install_channel_specs.resolveNpmInstallSpecsForUpdateChannel({
		spec: recordSpec,
		updateChannel: params.updateChannel,
		officialPackageName: params.officialPackageName,
		coreVersion: params.coreVersion
	});
	return require_install_channel_specs.resolveNpmInstallSpecsForUpdateChannel({
		spec: recordSpec,
		updateChannel: params.updateChannel,
		officialPackageName: params.officialPackageName,
		coreVersion: params.coreVersion
	});
}
function resolveClawHubUpdateSpecs(params) {
	if (!params.officialSpecOverride && !params.record.clawhubPackage) return {};
	return require_install_channel_specs.resolveClawHubInstallSpecsForUpdateChannel({
		spec: params.officialSpecOverride ?? params.record.spec ?? `clawhub:${params.record.clawhubPackage}`,
		updateChannel: params.updateChannel
	});
}
function replacePluginIdInList(entries, fromId, toId) {
	if (!entries || entries.length === 0 || fromId === toId || !entries.includes(fromId)) return entries;
	const next = [];
	for (const entry of entries) {
		const value = entry === fromId ? toId : entry;
		if (!next.includes(value)) next.push(value);
	}
	return next;
}
function migratePluginConfigId(cfg, fromId, toId) {
	const plugins = cfg.plugins;
	if (fromId === toId || !plugins) return cfg;
	let nextPlugins = plugins;
	const ensureNextPlugins = () => {
		if (nextPlugins === plugins) nextPlugins = { ...plugins };
		return nextPlugins;
	};
	const installs = plugins.installs;
	if (installs && Object.hasOwn(installs, fromId)) {
		const record = installs[fromId];
		const nextInstalls = { ...installs };
		if (record && !Object.hasOwn(installs, toId)) Object.defineProperty(nextInstalls, toId, {
			configurable: true,
			enumerable: true,
			value: record,
			writable: true
		});
		delete nextInstalls[fromId];
		ensureNextPlugins().installs = nextInstalls;
	}
	const entries = plugins.entries;
	if (entries && Object.hasOwn(entries, fromId)) {
		const entry = entries[fromId];
		const existingEntry = Object.hasOwn(entries, toId) ? entries[toId] : void 0;
		const nextEntries = { ...entries };
		if (entry) Object.defineProperty(nextEntries, toId, {
			configurable: true,
			enumerable: true,
			value: existingEntry ? {
				...entry,
				...existingEntry
			} : entry,
			writable: true
		});
		delete nextEntries[fromId];
		ensureNextPlugins().entries = nextEntries;
	}
	const allow = replacePluginIdInList(plugins.allow, fromId, toId);
	if (allow !== plugins.allow) ensureNextPlugins().allow = allow;
	const deny = replacePluginIdInList(plugins.deny, fromId, toId);
	if (deny !== plugins.deny) ensureNextPlugins().deny = deny;
	const slots = plugins.slots;
	if (slots?.memory === fromId || slots?.contextEngine === fromId) ensureNextPlugins().slots = {
		...slots,
		...slots.memory === fromId ? { memory: toId } : {},
		...slots.contextEngine === fromId ? { contextEngine: toId } : {}
	};
	return nextPlugins === plugins ? cfg : {
		...cfg,
		plugins: nextPlugins
	};
}
function withoutPluginInstallRecord(cfg, pluginId) {
	const installs = cfg.plugins?.installs;
	if (!installs || !Object.hasOwn(installs, pluginId)) return cfg;
	const { [pluginId]: _removed, ...nextInstalls } = installs;
	return {
		...cfg,
		plugins: {
			...cfg.plugins,
			installs: nextInstalls
		}
	};
}
function createPluginUpdateIntegrityDriftHandler(params) {
	return async (drift) => {
		const payload = {
			pluginId: params.pluginId,
			spec: drift.spec,
			expectedIntegrity: drift.expectedIntegrity,
			actualIntegrity: drift.actualIntegrity,
			resolvedSpec: drift.resolution.resolvedSpec,
			resolvedVersion: drift.resolution.version,
			dryRun: params.dryRun
		};
		if (params.onIntegrityDrift) return await params.onIntegrityDrift(payload);
		params.logger.warn?.(`Integrity drift for "${params.pluginId}" (${payload.resolvedSpec ?? payload.spec}): expected ${payload.expectedIntegrity}, got ${payload.actualIntegrity}`);
		return false;
	};
}
function disablePluginAfterUpdateFailure(config, pluginId) {
	const disabled = require_enable.setPluginEnabledInConfig(config, pluginId, false, { updateChannelConfig: false });
	const pluginsConfig = disabled.plugins ?? {};
	return {
		...disabled,
		plugins: {
			...pluginsConfig,
			slots: require_config_activation_shared.resetPluginSlotsToDefaults(pluginsConfig.slots, pluginId)
		}
	};
}
async function repairOperatorPeerLinksForNpmInstalls(params) {
	let repaired = false;
	for (const [pluginId, record] of Object.entries(params.config.plugins?.installs ?? {})) {
		if (record.source !== "npm") continue;
		let installPath;
		try {
			installPath = require_home_dir.resolveUserPath(record.installPath?.trim() || require_install_paths.resolvePluginInstallDir(pluginId));
		} catch (err) {
			params.logger.warn?.(`Could not repair operator peer link for "${pluginId}" due to invalid install path: ${String(err)}`);
			continue;
		}
		if (!require_package_update_utils.installedPackageNeedsOperatorPeerLinkRepair(installPath)) continue;
		const peerDependencies = require_package_update_utils.readInstalledPackagePeerDependencies(installPath);
		if (!Object.hasOwn(peerDependencies, "@gabrielvfonseca/operator")) continue;
		try {
			const warnings = [];
			if ((await require_plugin_peer_link.linkOperatorPeerDependencies({
				installedDir: installPath,
				peerDependencies,
				logger: {
					info: (message) => params.logger.info?.(message),
					warn: (message) => warnings.push(message)
				}
			})).skipped > 0) {
				params.logger.warn?.(`Could not repair operator peer link for "${pluginId}" at ${installPath}: ${warnings.join("; ") || "peer link repair was skipped"}`);
				continue;
			}
			repaired = !require_package_update_utils.installedPackageNeedsOperatorPeerLinkRepair(installPath) || repaired;
		} catch (err) {
			params.logger.warn?.(`Could not repair operator peer link for "${pluginId}" at ${installPath}: ${String(err)}`);
		}
	}
	return repaired;
}
async function updateNpmInstalledPlugins(params) {
	const logger = params.logger ?? {};
	const installs = params.config.plugins?.installs ?? {};
	const targets = params.pluginIds?.length ? params.pluginIds : Object.keys(installs);
	const normalizedPluginConfig = params.skipDisabledPlugins ? require_config_state.normalizePluginsConfig(params.config.plugins) : void 0;
	const bundled = require_bundled_sources.resolveBundledPluginSources({});
	const outcomes = [];
	let next = params.config;
	let changed = false;
	let ranNpmInstaller = false;
	const installNpmSpecForUpdate = async (installParams) => {
		ranNpmInstaller = true;
		return await require_clawhub_error_codes.installPluginFromNpmSpec(installParams);
	};
	const clawHubRiskAcknowledgementOptions = {
		...params.acknowledgeClawHubRisk ? { acknowledgeClawHubRisk: true } : {},
		...!params.dryRun && params.onClawHubRisk ? { onClawHubRisk: params.onClawHubRisk } : {}
	};
	const recordFailure = (pluginId, message, options = {}) => {
		const preserveInstalledPayload = options.code === require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.NPM_METADATA_FAILURE && options.installedPayloadRunnable === true;
		if (params.disableOnFailure && !params.dryRun && !preserveInstalledPayload) {
			const disabledMessage = `Disabled "${pluginId}" after plugin update failure; Operator will continue without it. ` + message;
			logger.warn?.(disabledMessage);
			next = disablePluginAfterUpdateFailure(next, pluginId);
			changed = true;
			outcomes.push({
				pluginId,
				status: "skipped",
				message: disabledMessage,
				...options.channelFallback ? { channelFallback: options.channelFallback } : {}
			});
			return;
		}
		outcomes.push({
			pluginId,
			status: "error",
			message,
			...options.channelFallback ? { channelFallback: options.channelFallback } : {}
		});
	};
	for (const pluginId of targets) {
		if (params.skipIds?.has(pluginId)) {
			outcomes.push({
				pluginId,
				status: "skipped",
				message: `Skipping "${pluginId}" (already updated).`
			});
			continue;
		}
		const record = Object.hasOwn(installs, pluginId) ? installs[pluginId] : void 0;
		if (!record) {
			outcomes.push({
				pluginId,
				status: "skipped",
				message: `No install record for "${pluginId}".`
			});
			continue;
		}
		const trustedOfficialNpmSpec = require_manifest_registry.resolveTrustedSourceLinkedOfficialNpmSpec({
			pluginId,
			record
		});
		const officialNpmSpec = params.syncOfficialPluginInstalls ? trustedOfficialNpmSpec : void 0;
		const officialClawHubSpec = params.syncOfficialPluginInstalls ? require_manifest_registry.resolveTrustedSourceLinkedOfficialClawHubSpec({
			pluginId,
			record
		}) : void 0;
		const officialSyncUpdateChannel = params.officialPluginUpdateChannel ?? params.updateChannel;
		const officialNpmPackageName = resolveNpmSpecPackageName(trustedOfficialNpmSpec);
		if (normalizedPluginConfig) {
			const enableState = require_config_state.resolveEffectiveEnableState({
				id: pluginId,
				origin: "global",
				config: normalizedPluginConfig,
				rootConfig: params.config
			});
			if (!enableState.enabled && !officialNpmSpec && !officialClawHubSpec) {
				outcomes.push({
					pluginId,
					status: "skipped",
					message: `Skipping "${pluginId}" (${enableState.reason ?? "disabled by plugin config"}).`
				});
				continue;
			}
		}
		if (!isPluginInstallRecordUpdateSource(record)) {
			outcomes.push({
				pluginId,
				status: "skipped",
				message: `Skipping "${pluginId}" (source: ${record.source}).`
			});
			continue;
		}
		const npmSpecs = record.source === "npm" ? resolveNpmUpdateSpecs({
			record,
			specOverride: params.specOverrides?.[pluginId],
			officialSpecOverride: officialNpmSpec,
			updateChannel: officialNpmSpec ? officialSyncUpdateChannel : params.updateChannel,
			officialPackageName: officialNpmPackageName,
			coreVersion: params.coreVersion
		}) : void 0;
		const clawhubSpecs = record.source === "clawhub" ? resolveClawHubUpdateSpecs({
			record,
			officialSpecOverride: officialClawHubSpec,
			updateChannel: officialClawHubSpec ? officialSyncUpdateChannel : params.updateChannel
		}) : void 0;
		const effectiveSpec = record.source === "npm" ? npmSpecs?.installSpec : record.source === "clawhub" ? clawhubSpecs?.installSpec : record.spec;
		const recordSpec = record.source === "npm" ? npmSpecs?.recordSpec : record.source === "clawhub" ? clawhubSpecs?.recordSpec : record.spec;
		const preserveNpmRecordIntent = record.source === "npm" && npmSpecs?.installSpec !== npmSpecs?.recordSpec && (officialNpmSpec ? officialSyncUpdateChannel : params.updateChannel) === "extended-stable";
		const officialNpmFallbackSpecs = record.source === "clawhub" ? resolveTrustedSourceLinkedOfficialNpmFallbackForClawHubUpdate({
			pluginId,
			record,
			effectiveClawHubSpec: effectiveSpec,
			recordClawHubSpec: recordSpec,
			updateChannel: params.syncOfficialPluginInstalls ? officialSyncUpdateChannel : params.updateChannel,
			coreVersion: params.coreVersion
		}) : null;
		let officialNpmFallbackInstallSpec = officialNpmFallbackSpecs?.installSpec;
		let officialNpmFallbackRecordSpec = officialNpmFallbackSpecs?.recordSpec;
		let activeClawHubInstallSpec = effectiveSpec;
		const trustedSourceLinkedOfficialInstall = isTrustedSourceLinkedOfficialNpmUpdate({
			pluginId,
			spec: effectiveSpec,
			record
		});
		let expectedIntegrity = expectedIntegrityForNpmUpdate({
			effectiveSpec,
			record,
			trustedSourceLinkedOfficialInstall
		});
		let fallbackExpectedIntegrityLoaded = false;
		let fallbackExpectedIntegrity;
		const getFallbackExpectedIntegrity = async () => {
			if (!fallbackExpectedIntegrityLoaded) {
				fallbackExpectedIntegrity = await expectedIntegrityForNpmFallback({
					fallbackSpec: npmSpecs?.fallbackSpec,
					record,
					timeoutMs: params.timeoutMs,
					trustedSourceLinkedOfficialInstall
				});
				fallbackExpectedIntegrityLoaded = true;
			}
			return fallbackExpectedIntegrity;
		};
		if (record.source === "npm" && !effectiveSpec) {
			outcomes.push({
				pluginId,
				status: "skipped",
				message: `Skipping "${pluginId}" (missing npm spec).`
			});
			continue;
		}
		if (record.source === "git" && !effectiveSpec) {
			outcomes.push({
				pluginId,
				status: "skipped",
				message: `Skipping "${pluginId}" (missing git spec).`
			});
			continue;
		}
		if (record.source === "clawhub" && !record.clawhubPackage && !officialClawHubSpec) {
			outcomes.push({
				pluginId,
				status: "skipped",
				message: `Skipping "${pluginId}" (missing ClawHub package metadata).`
			});
			continue;
		}
		if (record.source === "clawhub" || record.source === "marketplace") {
			const bundledSource = bundled.get(pluginId);
			if (bundledSource?.version && record.version && isBundledVersionNewer(bundledSource.version, record.version)) {
				logger.warn?.(`Skipping "${pluginId}" update: bundled version ${bundledSource.version} is newer than the installed ${record.source} version ${record.version}. Uninstall the ${record.source} plugin to use the bundled version, or pin a newer version explicitly.`);
				outcomes.push({
					pluginId,
					status: "skipped",
					message: `Skipping "${pluginId}": bundled version ${bundledSource.version} is newer than ${record.source} version ${record.version}.`
				});
				continue;
			}
		}
		if (record.source === "marketplace" && (!record.marketplaceSource || !record.marketplacePlugin)) {
			outcomes.push({
				pluginId,
				status: "skipped",
				message: `Skipping "${pluginId}" (missing marketplace source metadata).`
			});
			continue;
		}
		let installPath;
		try {
			installPath = require_home_dir.resolveUserPath(record.installPath?.trim() || require_install_paths.resolvePluginInstallDir(pluginId));
		} catch (err) {
			recordFailure(pluginId, `Invalid install path for "${pluginId}": ${String(err)}`);
			continue;
		}
		let currentVersion;
		let installedManifest;
		try {
			installedManifest = require_package_update_utils.readInstalledPackageManifest(installPath);
			currentVersion = typeof installedManifest?.version === "string" ? installedManifest.version : void 0;
		} catch (err) {
			recordFailure(pluginId, `Failed to inspect installed package for ${pluginId}: ${String(err)}`);
			continue;
		}
		const hasRunnableInstalledPayloadForFailure = async (code) => {
			if (code !== require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.NPM_METADATA_FAILURE || !params.disableOnFailure || params.dryRun || currentVersion === void 0) return false;
			try {
				return await hasRunnableInstalledNpmPayload({
					installPath,
					manifest: installedManifest
				});
			} catch {
				return false;
			}
		};
		const extensionsDir = resolveRecordedExtensionsDir({
			pluginId,
			installPath
		});
		if (!params.dryRun && record.source === "npm" && (currentVersion || params.syncOfficialPluginInstalls && trustedSourceLinkedOfficialInstall)) {
			const metadataResult = await require_install_source_utils.resolveNpmSpecMetadata({
				spec: effectiveSpec,
				timeoutMs: params.timeoutMs
			});
			if (metadataResult.ok) {
				const bypassTrustedOfficialUnchangedNpmCheck = shouldBypassTrustedOfficialUnchangedNpmCheck({
					metadata: metadataResult.metadata,
					spec: effectiveSpec,
					trustedSourceLinkedOfficialInstall
				});
				const trustedPrereleaseFallback = trustedSourceLinkedOfficialInstall ? await resolveTrustedOfficialPrereleaseFallbackMetadataForUpdate({
					metadata: metadataResult.metadata,
					spec: effectiveSpec,
					timeoutMs: params.timeoutMs
				}) : void 0;
				const expectedIntegrityMetadata = trustedPrereleaseFallback?.metadata ?? metadataResult.metadata;
				expectedIntegrity = expectedIntegrityForNpmUpdate({
					effectiveSpec,
					metadata: expectedIntegrityMetadata,
					record,
					trustedSourceLinkedOfficialInstall
				});
				if (!isNpmMetadataCompatibleWithCurrentHost(expectedIntegrityMetadata)) expectedIntegrity = void 0;
				if (bypassTrustedOfficialUnchangedNpmCheck && !trustedPrereleaseFallback) expectedIntegrity = void 0;
				if (currentVersion && !bypassTrustedOfficialUnchangedNpmCheck && isNpmMetadataCompatibleWithCurrentHost(metadataResult.metadata) && !require_package_update_utils.installedPackageNeedsOperatorPeerLinkRepair(installPath) && shouldSkipUnchangedNpmInstall({
					currentVersion,
					record,
					metadata: metadataResult.metadata
				})) {
					if (params.syncOfficialPluginInstalls && trustedSourceLinkedOfficialInstall) {
						const nextRecordSpec = require_installed_plugin_index_records.resolveNpmInstallRecordSpec({
							requestedSpec: recordSpec,
							resolution: metadataResult.metadata,
							pinResolvedRegistrySpec: !preserveNpmRecordIntent
						});
						if (nextRecordSpec !== record.spec) {
							const resolutionFields = require_installed_plugin_index_records.buildNpmResolutionInstallFields(metadataResult.metadata);
							next = {
								...next,
								plugins: {
									...next.plugins,
									installs: {
										...next.plugins?.installs,
										[pluginId]: {
											...record,
											spec: nextRecordSpec,
											resolvedName: resolutionFields.resolvedName ?? record.resolvedName,
											resolvedVersion: resolutionFields.resolvedVersion ?? record.resolvedVersion,
											resolvedSpec: resolutionFields.resolvedSpec ?? record.resolvedSpec,
											integrity: resolutionFields.integrity ?? record.integrity,
											shasum: resolutionFields.shasum ?? record.shasum,
											resolvedAt: resolutionFields.resolvedAt ?? record.resolvedAt
										}
									}
								}
							};
							changed = true;
						}
					}
					outcomes.push({
						pluginId,
						status: "unchanged",
						currentVersion,
						nextVersion: metadataResult.metadata.version,
						message: `${pluginId} is up to date (${currentVersion}).`
					});
					continue;
				}
			} else {
				if (!require_npm_registry_spec.parseRegistryNpmSpec(effectiveSpec)) {
					const code = metadataResult.category === "metadata-env" ? require_clawhub_error_codes.PLUGIN_INSTALL_ERROR_CODE.NPM_METADATA_FAILURE : void 0;
					recordFailure(pluginId, `Failed to check ${pluginId}: ${metadataResult.error}`, {
						code,
						installedPayloadRunnable: await hasRunnableInstalledPayloadForFailure(code)
					});
					continue;
				}
				logger.warn?.(`Could not check ${pluginId} before update; falling back to installer path: ${metadataResult.error}`);
			}
		}
		if (params.dryRun) {
			let probe;
			try {
				probe = record.source === "npm" ? await require_clawhub_error_codes.installPluginFromNpmSpec({
					spec: effectiveSpec,
					config: params.config,
					mode: "update",
					extensionsDir,
					timeoutMs: params.timeoutMs,
					dryRun: true,
					dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
					trustedSourceLinkedOfficialInstall,
					expectedPluginId: pluginId,
					expectedIntegrity,
					onIntegrityDrift: createPluginUpdateIntegrityDriftHandler({
						pluginId,
						dryRun: true,
						logger,
						onIntegrityDrift: params.onIntegrityDrift
					}),
					logger
				}) : record.source === "clawhub" ? await require_clawhub$1.installPluginFromClawHub({
					spec: effectiveSpec ?? `clawhub:${record.clawhubPackage}`,
					config: params.config,
					baseUrl: record.clawhubUrl,
					mode: "update",
					extensionsDir,
					timeoutMs: params.timeoutMs,
					dryRun: true,
					dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
					expectedPluginId: pluginId,
					...clawHubRiskAcknowledgementOptions,
					logger
				}) : record.source === "git" ? await require_git_install.installPluginFromGitSpec({
					spec: effectiveSpec,
					config: params.config,
					mode: "update",
					extensionsDir,
					timeoutMs: params.timeoutMs,
					dryRun: true,
					dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
					expectedPluginId: pluginId,
					logger
				}) : await require_marketplace.installPluginFromMarketplace({
					marketplace: record.marketplaceSource,
					plugin: record.marketplacePlugin,
					config: params.config,
					mode: "update",
					extensionsDir,
					timeoutMs: params.timeoutMs,
					dryRun: true,
					dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
					expectedPluginId: pluginId,
					logger
				});
			} catch (err) {
				recordFailure(pluginId, `Failed to check ${pluginId}: ${String(err)}`);
				continue;
			}
			let usedNpmFallback = false;
			let usedOfficialNpmFallback = false;
			let channelFallbackSuffix = "";
			let npmChannelFallback;
			if (!probe.ok && record.source === "npm" && npmSpecs?.fallbackSpec) {
				logger.warn?.(describeBetaNpmFallback({
					pluginId,
					betaSpec: npmSpecs.fallbackLabel ?? effectiveSpec,
					fallbackSpec: npmSpecs.fallbackSpec,
					result: probe
				}));
				usedNpmFallback = true;
				npmChannelFallback = describeNpmChannelFallback({
					pluginId,
					requestedSpec: npmSpecs.fallbackLabel ?? effectiveSpec,
					usedSpec: npmSpecs.fallbackSpec,
					result: probe,
					verb: "would use"
				});
				channelFallbackSuffix = formatBetaChannelFallbackOutcomeSuffix({
					fallbackLabel: npmSpecs.fallbackLabel ?? effectiveSpec,
					fallbackSpec: npmSpecs.fallbackSpec,
					verb: "would use"
				});
				probe = await require_clawhub_error_codes.installPluginFromNpmSpec({
					spec: npmSpecs.fallbackSpec,
					config: params.config,
					mode: "update",
					extensionsDir,
					timeoutMs: params.timeoutMs,
					dryRun: true,
					dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
					trustedSourceLinkedOfficialInstall,
					expectedPluginId: pluginId,
					expectedIntegrity: await getFallbackExpectedIntegrity(),
					onIntegrityDrift: createPluginUpdateIntegrityDriftHandler({
						pluginId,
						dryRun: true,
						logger,
						onIntegrityDrift: params.onIntegrityDrift
					}),
					logger
				});
			}
			if (!probe.ok && record.source === "clawhub" && clawhubSpecs?.fallbackSpec && shouldFallbackBetaClawHubUpdate(probe)) {
				channelFallbackSuffix = formatBetaChannelFallbackOutcomeSuffix({
					fallbackLabel: clawhubSpecs.fallbackLabel ?? effectiveSpec,
					fallbackSpec: clawhubSpecs.fallbackSpec,
					verb: "would use"
				});
				logger.warn?.(`Plugin "${pluginId}" has no beta ClawHub release for ${clawhubSpecs.fallbackLabel ?? effectiveSpec}; using ${clawhubSpecs.fallbackSpec} instead. Core update can still complete.`);
				probe = await require_clawhub$1.installPluginFromClawHub({
					spec: clawhubSpecs.fallbackSpec,
					config: params.config,
					baseUrl: record.clawhubUrl,
					mode: "update",
					extensionsDir,
					timeoutMs: params.timeoutMs,
					dryRun: true,
					dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
					expectedPluginId: pluginId,
					...clawHubRiskAcknowledgementOptions,
					logger
				});
				activeClawHubInstallSpec = clawhubSpecs.fallbackSpec;
				if (officialNpmFallbackSpecs?.fallbackSpec) officialNpmFallbackInstallSpec = officialNpmFallbackSpecs.fallbackSpec;
			}
			if (!probe.ok && record.source === "clawhub" && officialNpmFallbackInstallSpec && shouldFallbackClawHubBridgeToNpm({
				result: probe,
				npmSpec: officialNpmFallbackInstallSpec
			})) {
				channelFallbackSuffix = ` (warning: official ClawHub artifact fallback would use ${officialNpmFallbackInstallSpec}).`;
				logger.warn?.(`Plugin "${pluginId}" could not download official ClawHub artifact for ${activeClawHubInstallSpec ?? `clawhub:${record.clawhubPackage}`}; using npm ${officialNpmFallbackInstallSpec} instead. Core update can still complete.`);
				usedNpmFallback = true;
				usedOfficialNpmFallback = true;
				probe = await require_clawhub_error_codes.installPluginFromNpmSpec({
					spec: officialNpmFallbackInstallSpec,
					config: params.config,
					mode: "update",
					extensionsDir,
					timeoutMs: params.timeoutMs,
					dryRun: true,
					dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
					trustedSourceLinkedOfficialInstall: true,
					expectedPluginId: pluginId,
					logger
				});
			}
			if (!probe.ok) {
				if (record.source === "clawhub" && shouldSkipClawHubTrustFailureForExistingInstall({
					result: probe,
					currentVersion
				})) {
					const code = readClawHubTrustErrorCode(probe);
					if (!code) continue;
					outcomes.push(buildClawHubTrustSkippedOutcome({
						pluginId,
						phase: "check",
						error: probe.error,
						code,
						..."warning" in probe && probe.warning ? { warning: probe.warning } : {},
						...currentVersion ? { currentVersion } : {}
					}));
					continue;
				}
				const code = "code" in probe && probe.code ? probe.code : void 0;
				recordFailure(pluginId, record.source === "npm" || usedOfficialNpmFallback ? formatNpmInstallFailure({
					pluginId,
					spec: usedOfficialNpmFallback ? officialNpmFallbackInstallSpec ?? effectiveSpec ?? "" : npmUpdateFailureSpec({
						effectiveSpec,
						fallbackSpec: npmSpecs?.fallbackSpec,
						usedFallback: usedNpmFallback
					}),
					phase: "check",
					result: probe
				}) : record.source === "clawhub" ? formatClawHubInstallFailure({
					pluginId,
					spec: activeClawHubInstallSpec ?? `clawhub:${record.clawhubPackage}`,
					phase: "check",
					error: probe.error
				}) : record.source === "git" ? formatGitInstallFailure({
					pluginId,
					spec: effectiveSpec,
					phase: "check",
					error: probe.error
				}) : formatMarketplaceInstallFailure({
					pluginId,
					marketplaceSource: record.marketplaceSource,
					marketplacePlugin: record.marketplacePlugin,
					phase: "check",
					error: probe.error
				}), {
					channelFallback: npmChannelFallback,
					code,
					installedPayloadRunnable: await hasRunnableInstalledPayloadForFailure(code)
				});
				continue;
			}
			const probeSpec = usedNpmFallback ? npmSpecs?.fallbackSpec ?? officialNpmFallbackInstallSpec : effectiveSpec;
			const npmProbeVersion = record.source === "npm" || usedOfficialNpmFallback ? resolveNpmResultVersion(probe) : void 0;
			const resolvedProbeVersion = probe.version ?? npmProbeVersion ?? (record.source === "npm" || usedOfficialNpmFallback ? resolveExactNpmSpecVersion(probeSpec) : void 0);
			const nextVersion = resolvedProbeVersion ?? "unknown";
			const currentLabel = currentVersion ?? "unknown";
			const gitProbe = record.source === "git" ? probe.git : void 0;
			const unchanged = record.source === "git" && record.gitCommit && gitProbe?.commit ? record.gitCommit === gitProbe.commit : Boolean(currentVersion && resolvedProbeVersion && currentVersion === resolvedProbeVersion);
			const newerExactPinnedDefaultLine = unchanged && record.source === "npm" && !params.specOverrides?.[pluginId] && !officialNpmSpec ? await resolveNewerExactPinnedNpmDefaultLine({
				currentVersion,
				effectiveSpec,
				probeNpmVersion: npmProbeVersion,
				timeoutMs: params.timeoutMs
			}) : void 0;
			if (unchanged) {
				const message = newerExactPinnedDefaultLine && effectiveSpec ? `${pluginId} is pinned to ${effectiveSpec} (installed ${currentLabel}); registry default resolves to ${newerExactPinnedDefaultLine.version}. Pass \`operator plugins update ${newerExactPinnedDefaultLine.packageName}@latest\` to follow the registry default line.` + channelFallbackSuffix : `${pluginId} is up to date (${currentLabel}).${channelFallbackSuffix}`;
				outcomes.push({
					pluginId,
					status: "unchanged",
					currentVersion: currentVersion ?? void 0,
					nextVersion: resolvedProbeVersion,
					message,
					...npmChannelFallback ? { channelFallback: npmChannelFallback } : {}
				});
			} else outcomes.push({
				pluginId,
				status: "updated",
				currentVersion: currentVersion ?? void 0,
				nextVersion: resolvedProbeVersion,
				message: `Would update ${pluginId}: ${currentLabel} -> ${nextVersion}.${channelFallbackSuffix}`,
				...npmChannelFallback ? { channelFallback: npmChannelFallback } : {}
			});
			continue;
		}
		let result;
		try {
			result = record.source === "npm" ? await installNpmSpecForUpdate({
				spec: effectiveSpec,
				config: params.config,
				mode: "update",
				extensionsDir,
				timeoutMs: params.timeoutMs,
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				trustedSourceLinkedOfficialInstall,
				expectedPluginId: pluginId,
				expectedIntegrity,
				onIntegrityDrift: createPluginUpdateIntegrityDriftHandler({
					pluginId,
					dryRun: false,
					logger,
					onIntegrityDrift: params.onIntegrityDrift
				}),
				logger
			}) : record.source === "clawhub" ? await require_clawhub$1.installPluginFromClawHub({
				spec: effectiveSpec ?? `clawhub:${record.clawhubPackage}`,
				config: params.config,
				baseUrl: record.clawhubUrl,
				mode: "update",
				extensionsDir,
				timeoutMs: params.timeoutMs,
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				expectedPluginId: pluginId,
				...clawHubRiskAcknowledgementOptions,
				logger
			}) : record.source === "git" ? await require_git_install.installPluginFromGitSpec({
				spec: effectiveSpec,
				config: params.config,
				mode: "update",
				extensionsDir,
				timeoutMs: params.timeoutMs,
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				expectedPluginId: pluginId,
				logger
			}) : await require_marketplace.installPluginFromMarketplace({
				marketplace: record.marketplaceSource,
				plugin: record.marketplacePlugin,
				config: params.config,
				mode: "update",
				extensionsDir,
				timeoutMs: params.timeoutMs,
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				expectedPluginId: pluginId,
				logger
			});
		} catch (err) {
			recordFailure(pluginId, `Failed to update ${pluginId}: ${String(err)}`);
			continue;
		}
		let usedNpmFallback = false;
		let usedOfficialNpmFallback = false;
		let channelFallbackSuffix = "";
		let resultSource = record.source;
		activeClawHubInstallSpec = effectiveSpec;
		let npmChannelFallback;
		if (!result.ok && record.source === "npm" && npmSpecs?.fallbackSpec) {
			logger.warn?.(describeBetaNpmFallback({
				pluginId,
				betaSpec: npmSpecs.fallbackLabel ?? effectiveSpec,
				fallbackSpec: npmSpecs.fallbackSpec,
				result
			}));
			usedNpmFallback = true;
			npmChannelFallback = describeNpmChannelFallback({
				pluginId,
				requestedSpec: npmSpecs.fallbackLabel ?? effectiveSpec,
				usedSpec: npmSpecs.fallbackSpec,
				result,
				verb: "used"
			});
			channelFallbackSuffix = formatBetaChannelFallbackOutcomeSuffix({
				fallbackLabel: npmSpecs.fallbackLabel ?? effectiveSpec,
				fallbackSpec: npmSpecs.fallbackSpec,
				verb: "used"
			});
			result = await installNpmSpecForUpdate({
				spec: npmSpecs.fallbackSpec,
				mode: "update",
				extensionsDir,
				timeoutMs: params.timeoutMs,
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				trustedSourceLinkedOfficialInstall,
				expectedPluginId: pluginId,
				expectedIntegrity: await getFallbackExpectedIntegrity(),
				onIntegrityDrift: createPluginUpdateIntegrityDriftHandler({
					pluginId,
					dryRun: false,
					logger,
					onIntegrityDrift: params.onIntegrityDrift
				}),
				logger
			});
		}
		if (!result.ok && record.source === "clawhub" && clawhubSpecs?.fallbackSpec && shouldFallbackBetaClawHubUpdate(result)) {
			channelFallbackSuffix = formatBetaChannelFallbackOutcomeSuffix({
				fallbackLabel: clawhubSpecs.fallbackLabel ?? effectiveSpec,
				fallbackSpec: clawhubSpecs.fallbackSpec,
				verb: "used"
			});
			logger.warn?.(`Plugin "${pluginId}" has no beta ClawHub release for ${clawhubSpecs.fallbackLabel ?? effectiveSpec}; using ${clawhubSpecs.fallbackSpec} instead. Core update can still complete.`);
			result = await require_clawhub$1.installPluginFromClawHub({
				spec: clawhubSpecs.fallbackSpec,
				config: params.config,
				baseUrl: record.clawhubUrl,
				mode: "update",
				extensionsDir,
				timeoutMs: params.timeoutMs,
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				expectedPluginId: pluginId,
				...clawHubRiskAcknowledgementOptions,
				logger
			});
			activeClawHubInstallSpec = clawhubSpecs.fallbackSpec;
			if (officialNpmFallbackSpecs?.fallbackSpec) {
				officialNpmFallbackInstallSpec = officialNpmFallbackSpecs.fallbackSpec;
				officialNpmFallbackRecordSpec = officialNpmFallbackSpecs.fallbackSpec;
			}
		}
		if (!result.ok && record.source === "clawhub" && officialNpmFallbackInstallSpec && shouldFallbackClawHubBridgeToNpm({
			result,
			npmSpec: officialNpmFallbackInstallSpec
		})) {
			logger.warn?.(`Plugin "${pluginId}" could not download official ClawHub artifact for ${activeClawHubInstallSpec ?? `clawhub:${record.clawhubPackage}`}; using npm ${officialNpmFallbackInstallSpec} instead. Core update can still complete.`);
			usedNpmFallback = true;
			usedOfficialNpmFallback = true;
			resultSource = "npm";
			channelFallbackSuffix = ` (warning: official ClawHub artifact fallback used ${officialNpmFallbackInstallSpec}).`;
			result = await installNpmSpecForUpdate({
				spec: officialNpmFallbackInstallSpec,
				config: params.config,
				mode: "update",
				extensionsDir,
				timeoutMs: params.timeoutMs,
				dangerouslyForceUnsafeInstall: params.dangerouslyForceUnsafeInstall,
				trustedSourceLinkedOfficialInstall: true,
				expectedPluginId: pluginId,
				logger
			});
		}
		if (!result.ok) {
			if (record.source === "clawhub" && shouldSkipClawHubTrustFailureForExistingInstall({
				result,
				currentVersion
			})) {
				const code = readClawHubTrustErrorCode(result);
				if (!code) continue;
				outcomes.push(buildClawHubTrustSkippedOutcome({
					pluginId,
					phase: "update",
					error: result.error,
					code,
					..."warning" in result && result.warning ? { warning: result.warning } : {},
					...currentVersion ? { currentVersion } : {}
				}));
				continue;
			}
			const code = resultSource === "npm" && result && "code" in result ? result.code : void 0;
			recordFailure(pluginId, resultSource === "npm" ? formatNpmInstallFailure({
				pluginId,
				spec: usedOfficialNpmFallback ? officialNpmFallbackInstallSpec ?? effectiveSpec ?? "" : npmUpdateFailureSpec({
					effectiveSpec,
					fallbackSpec: npmSpecs?.fallbackSpec,
					usedFallback: usedNpmFallback
				}),
				phase: "update",
				result
			}) : resultSource === "clawhub" ? formatClawHubInstallFailure({
				pluginId,
				spec: activeClawHubInstallSpec ?? `clawhub:${record.clawhubPackage}`,
				phase: "update",
				error: result.error
			}) : record.source === "git" ? formatGitInstallFailure({
				pluginId,
				spec: effectiveSpec,
				phase: "update",
				error: result.error
			}) : formatMarketplaceInstallFailure({
				pluginId,
				marketplaceSource: record.marketplaceSource,
				marketplacePlugin: record.marketplacePlugin,
				phase: "update",
				error: result.error
			}), {
				channelFallback: npmChannelFallback,
				code,
				installedPayloadRunnable: await hasRunnableInstalledPayloadForFailure(code)
			});
			continue;
		}
		const resolvedPluginId = result.pluginId;
		if (resolvedPluginId !== pluginId) next = migratePluginConfigId(next, pluginId, resolvedPluginId);
		const nextVersion = result.version ?? await require_package_update_utils.readInstalledPackageVersion(result.targetDir);
		if (resultSource === "npm") {
			const npmResult = result;
			next = require_installed_plugin_index_records.recordPluginInstall(usedOfficialNpmFallback ? withoutPluginInstallRecord(next, resolvedPluginId) : next, {
				pluginId: resolvedPluginId,
				source: "npm",
				spec: require_installed_plugin_index_records.resolveNpmInstallRecordSpec({
					requestedSpec: usedOfficialNpmFallback ? officialNpmFallbackRecordSpec : recordSpec,
					resolution: npmResult.npmResolution,
					pinResolvedRegistrySpec: params.syncOfficialPluginInstalls && trustedSourceLinkedOfficialInstall && !preserveNpmRecordIntent || usedOfficialNpmFallback && officialSyncUpdateChannel !== "extended-stable"
				}),
				installPath: result.targetDir,
				version: nextVersion,
				...require_installed_plugin_index_records.buildNpmResolutionInstallFields(npmResult.npmResolution)
			});
		} else if (resultSource === "clawhub") next = require_installed_plugin_index_records.recordPluginInstall(next, {
			pluginId: resolvedPluginId,
			...require_clawhub_install_records.buildClawHubPluginInstallRecordFields(result.clawhub),
			spec: recordSpec ?? record.spec ?? `clawhub:${record.clawhubPackage}`,
			installPath: result.targetDir,
			version: nextVersion
		});
		else if (record.source === "git") {
			const gitResult = result;
			next = require_installed_plugin_index_records.recordPluginInstall(next, {
				pluginId: resolvedPluginId,
				source: "git",
				spec: effectiveSpec ?? record.spec,
				installPath: result.targetDir,
				version: nextVersion,
				resolvedAt: gitResult.git.resolvedAt,
				gitUrl: gitResult.git.url,
				gitRef: gitResult.git.ref,
				gitCommit: gitResult.git.commit
			});
		} else {
			const marketplaceResult = result;
			next = require_installed_plugin_index_records.recordPluginInstall(next, {
				pluginId: resolvedPluginId,
				source: "marketplace",
				installPath: result.targetDir,
				version: nextVersion,
				marketplaceName: marketplaceResult.marketplaceName ?? record.marketplaceName,
				marketplaceSource: record.marketplaceSource,
				marketplacePlugin: record.marketplacePlugin
			});
		}
		changed = true;
		const currentLabel = currentVersion ?? "unknown";
		const nextLabel = nextVersion ?? "unknown";
		if (currentVersion && nextVersion && currentVersion === nextVersion) outcomes.push({
			pluginId,
			status: "unchanged",
			currentVersion: currentVersion ?? void 0,
			nextVersion: nextVersion ?? void 0,
			message: `${pluginId} already at ${currentLabel}.${channelFallbackSuffix}`,
			...npmChannelFallback ? { channelFallback: npmChannelFallback } : {}
		});
		else outcomes.push({
			pluginId,
			status: "updated",
			currentVersion: currentVersion ?? void 0,
			nextVersion: nextVersion ?? void 0,
			message: `Updated ${pluginId}: ${currentLabel} -> ${nextLabel}.${channelFallbackSuffix}`,
			...npmChannelFallback ? { channelFallback: npmChannelFallback } : {}
		});
	}
	if (ranNpmInstaller) changed = await repairOperatorPeerLinksForNpmInstalls({
		config: next,
		logger
	}) || changed;
	return {
		config: next,
		changed,
		outcomes
	};
}
//#endregion
//#region src/commands/doctor/shared/configured-provider-plugin-ids.ts
/** Lists official external provider plugins without loading installed plugin registries. */
function collectConfiguredOfficialProviderPluginIds(params) {
	const configuredProviderIds = require_configured_provider_selection_ids.collectConfiguredModelProviderSelectionIds(params.cfg);
	const configuredMediaProviderIds = require_configured_provider_selection_ids.collectConfiguredMediaProviderSelectionIds(params.cfg);
	const pluginIds = new Set(require_official_external_plugin_catalog.resolveOfficialExternalProviderPluginIds({ providerIds: configuredProviderIds }));
	for (const pluginId of require_official_external_plugin_catalog.resolveOfficialExternalProviderPluginIdsForEnv(params.env ?? process.env)) pluginIds.add(pluginId);
	for (const pluginId of require_official_external_plugin_catalog.resolveOfficialExternalProviderContractPluginIds({
		contract: "mediaUnderstandingProviders",
		providerIds: configuredMediaProviderIds
	})) pluginIds.add(pluginId);
	for (const pluginId of require_official_external_plugin_catalog.resolveOfficialExternalProviderContractPluginIds({
		contract: "speechProviders",
		providerIds: configuredProviderIds
	})) pluginIds.add(pluginId);
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
//#endregion
//#region src/commands/doctor/shared/configured-provider-plugin-installs.ts
/** Lists external provider plugins implied by configured auth profiles and model refs. */
function collectConfiguredProviderPluginIds(params) {
	const selectedProviderIds = require_configured_provider_selection_ids.collectConfiguredProviderSelectionIds(params.cfg);
	const pluginIds = new Set(collectConfiguredOfficialProviderPluginIds(params));
	for (const entry of require_provider_install_catalog.resolveProviderInstallCatalogEntries({
		config: params.cfg,
		env: params.env,
		includeUntrustedWorkspacePlugins: false
	})) if ([entry.providerId, ...entry.providerAliases ?? []].some((providerId) => selectedProviderIds.has(providerId.toLowerCase()))) pluginIds.add(entry.pluginId);
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
//#endregion
//#region src/commands/doctor/shared/missing-configured-plugin-install.ts
const CONFIGURED_PLUGIN_INSTALLS_CHECK_ID = "core/doctor/configured-plugin-installs";
const MISSING_CHANNEL_CONFIG_DESCRIPTOR_DIAGNOSTIC = "without channelConfigs metadata";
const REPAIRABLE_PACKAGE_ENTRY_DIAGNOSTIC_MARKERS = [
	"extension entry escapes package directory",
	"extension entry unreadable",
	"requires compiled runtime output"
];
const OPERATOR_BETA_COMPANION_VERSION_RE = /^(\d{4}\.[1-9]\d?\.[1-9]\d?)-beta\.[1-9]\d*$/;
const OPERATOR_STABLE_OR_BETA_COMPANION_VERSION_RE = /^(\d{4}\.[1-9]\d?\.[1-9]\d?)(?:-beta\.[1-9]\d*)?$/;
function shouldFallbackClawHubToNpm(params) {
	if (!require_npm_registry_spec.isOperatorOrgNpmSpec(params.npmSpec)) return false;
	return params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.PACKAGE_NOT_FOUND || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.VERSION_NOT_FOUND || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.ARTIFACT_DOWNLOAD_UNAVAILABLE || params.result.code === require_clawhub_error_codes.CLAWHUB_INSTALL_ERROR_CODE.ARTIFACT_UNAVAILABLE;
}
function appendClawHubRiskAcknowledgementGuidance(params) {
	if (!params.spec || !params.message.includes("--acknowledge-clawhub-risk")) return params.message;
	const shellSpec = shellQuotePosixArg(require_safe_text.sanitizeTerminalText(params.spec));
	return `${params.message} To review and acknowledge this ClawHub package, run \`operator plugins install ${shellSpec} --acknowledge-clawhub-risk\` from a trusted shell, then rerun repair.`;
}
function shellQuotePosixArg(value) {
	if (/^[A-Za-z0-9_./:@%+=,-]+$/u.test(value)) return value;
	return `'${value.replaceAll("'", "'\\''")}'`;
}
function isActionableClawHubSkippedOutcome(outcome) {
	return isClawHubTrustSkippedOutcome(outcome);
}
function isClawHubReviewNotice(message) {
	const trimmed = require_ansi.stripAnsi(message).trimStart();
	return trimmed.startsWith("╭─ REVIEW RECOMMENDED - ClawHub ") || trimmed.startsWith("╭─ WARNING - ClawHub found security risks ");
}
function recordClawHubInstallSpec(record) {
	if (record?.source !== "clawhub") return;
	if (record.spec) return record.spec;
	if (record.clawhubPackage) return `clawhub:${record.clawhubPackage}`;
}
function resolveCandidateClawHubSpec(install) {
	const explicit = install.clawhubSpec?.trim();
	if (explicit) return explicit;
}
function addConfiguredPluginId(ids, value) {
	if (typeof value !== "string") return;
	const pluginId = value.trim();
	if (pluginId) ids.add(pluginId);
}
function addConfiguredAgentRuntimePluginIds(ids, cfg) {
	for (const runtime of require_configured_runtime_plugin_installs.collectConfiguredRuntimePluginIds(cfg)) addConfiguredPluginId(ids, runtime);
}
function addConfiguredMemoryEmbeddingProviderPluginIds(ids, cfg) {
	const configuredProviderIds = require_gateway_startup_plugin_ids.collectConfiguredMemoryEmbeddingProviderIds(cfg);
	if (configuredProviderIds.size === 0) return;
	for (const contract of ["embeddingProviders", "memoryEmbeddingProviders"]) for (const pluginId of require_official_external_plugin_catalog.resolveOfficialExternalProviderContractPluginIds({
		contract,
		providerIds: configuredProviderIds
	})) ids.add(pluginId);
}
function addConfiguredSpeechProviderPluginIds(ids, cfg) {
	for (const pluginId of require_official_external_plugin_catalog.resolveOfficialExternalProviderContractPluginIds({
		contract: "speechProviders",
		providerIds: require_gateway_startup_speech_providers.collectConfiguredSpeechProviderIds(cfg)
	})) ids.add(pluginId);
}
function addConfiguredWebFetchProviderPluginIds(ids, cfg) {
	const webFetch = cfg.tools?.web?.fetch;
	if (webFetch?.enabled === false) return;
	const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(webFetch?.provider);
	if (!providerId) return;
	for (const pluginId of require_official_external_plugin_catalog.resolveOfficialExternalProviderContractPluginIds({
		contract: "webFetchProviders",
		providerIds: /* @__PURE__ */ new Set([providerId])
	})) ids.add(pluginId);
}
function addEnvWebFetchProviderPluginIds(ids, cfg, env) {
	if (cfg.tools?.web?.fetch?.enabled === false) return;
	for (const pluginId of require_official_external_plugin_catalog.resolveOfficialExternalWebProviderContractPluginIdsForEnv({
		contract: "webFetchProviders",
		env: env ?? process.env
	})) ids.add(pluginId);
}
function collectConfiguredPluginIds(cfg, env) {
	const ids = /* @__PURE__ */ new Set();
	const plugins = require_object.asObjectRecord(cfg.plugins);
	if (plugins?.enabled === false) return ids;
	const entries = require_object.asObjectRecord(plugins?.entries);
	for (const [pluginId, entry] of Object.entries(entries ?? {})) {
		if (require_object.asObjectRecord(entry)?.enabled === false) continue;
		addConfiguredPluginId(ids, pluginId);
	}
	const searchProvider = cfg.tools?.web?.search?.provider;
	if (cfg.tools?.web?.search?.enabled !== false && typeof searchProvider === "string") {
		const installEntry = require_web_search_install_catalog.resolveWebSearchInstallCatalogEntry({ providerId: searchProvider });
		if (installEntry?.pluginId) ids.add(installEntry.pluginId);
	}
	if (cfg.tools?.web?.search?.enabled !== false) for (const entry of require_web_search_install_catalog.resolveWebSearchInstallCatalogEntriesForEnv(env ?? process.env)) ids.add(entry.pluginId);
	addConfiguredAgentRuntimePluginIds(ids, cfg);
	for (const pluginId of collectConfiguredProviderPluginIds({
		cfg,
		env
	})) ids.add(pluginId);
	addConfiguredMemoryEmbeddingProviderPluginIds(ids, cfg);
	addConfiguredSpeechProviderPluginIds(ids, cfg);
	addConfiguredWebFetchProviderPluginIds(ids, cfg);
	addEnvWebFetchProviderPluginIds(ids, cfg, env);
	return ids;
}
function collectBlockedPluginIds(cfg) {
	const ids = /* @__PURE__ */ new Set();
	const deny = cfg.plugins?.deny;
	if (Array.isArray(deny)) {
		for (const pluginId of deny) if (typeof pluginId === "string" && pluginId.trim()) ids.add(pluginId.trim());
	}
	const entries = require_object.asObjectRecord(cfg.plugins?.entries);
	for (const [pluginId, entry] of Object.entries(entries ?? {})) if (pluginId.trim() && require_object.asObjectRecord(entry)?.enabled === false) ids.add(pluginId.trim());
	return ids;
}
function collectConfiguredChannelIds(cfg, env) {
	const ids = /* @__PURE__ */ new Set();
	if (require_object.asObjectRecord(cfg.plugins)?.enabled === false) return ids;
	const disabled = new Set(require_config_presence.listExplicitlyDisabledChannelIdsForConfig(cfg));
	const candidateChannelIds = require_catalog.listRawChannelPluginCatalogEntries({
		env,
		excludeWorkspace: true
	}).map((entry) => entry.id);
	for (const channelId of require_config_presence.listPotentialConfiguredChannelIds(cfg, env, {
		channelIds: candidateChannelIds,
		includePersistedAuthState: false
	})) {
		const normalized = channelId.trim();
		if (normalized && !disabled.has(normalized.toLowerCase())) ids.add(normalized);
	}
	return ids;
}
function collectEffectiveConfiguredChannelOwnerPluginIds(params) {
	const owners = /* @__PURE__ */ new Map();
	const configuredChannelIds = new Set([...params.configuredChannelIds].map((channelId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId)).filter((channelId) => Boolean(channelId)));
	if (configuredChannelIds.size === 0) return owners;
	for (const entry of require_channel_presence_policy.resolveConfiguredChannelPresencePolicy({
		config: params.cfg,
		env: params.env,
		includePersistedAuthState: false,
		manifestRecords: params.snapshot.plugins
	})) {
		if (!entry.effective || !configuredChannelIds.has(entry.channelId)) continue;
		const pluginIds = new Set(entry.pluginIds);
		if (pluginIds.size > 0) owners.set(entry.channelId, pluginIds);
	}
	return owners;
}
function collectDownloadableInstallCandidates(params) {
	const configuredPluginIds = params.configuredPluginIds ?? collectConfiguredPluginIds(params.cfg);
	const configuredChannelIds = params.configuredChannelIds ?? collectConfiguredChannelIds(params.cfg, params.env);
	const candidates = /* @__PURE__ */ new Map();
	for (const entry of require_catalog.listRawChannelPluginCatalogEntries({
		env: params.env,
		excludeWorkspace: true
	})) {
		if (entry.origin === "bundled") continue;
		const pluginId = entry.pluginId ?? entry.id;
		const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.id);
		if (params.blockedPluginIds?.has(pluginId)) continue;
		const selectedOnlyByChannel = !params.missingPluginIds.has(pluginId) && !configuredPluginIds.has(pluginId) && (channelId ? configuredChannelIds.has(channelId) : configuredChannelIds.has(entry.id));
		const configuredChannelOwnerPluginIds = channelId ? params.configuredChannelOwnerPluginIds?.get(channelId) : void 0;
		if (selectedOnlyByChannel && configuredChannelOwnerPluginIds && configuredChannelOwnerPluginIds.size > 0 && !configuredChannelOwnerPluginIds.has(pluginId)) continue;
		if (!params.missingPluginIds.has(pluginId) && !configuredPluginIds.has(pluginId) && !configuredChannelIds.has(entry.id)) continue;
		const npmSpec = entry.install.npmSpec?.trim();
		const clawhubSpec = resolveCandidateClawHubSpec(entry.install);
		if (!npmSpec && !clawhubSpec) continue;
		candidates.set(pluginId, {
			pluginId,
			label: entry.meta.label,
			...npmSpec ? { npmSpec } : {},
			...clawhubSpec ? { clawhubSpec } : {},
			...entry.install.expectedIntegrity ? { expectedIntegrity: entry.install.expectedIntegrity } : {},
			...entry.trustedSourceLinkedOfficialInstall ? { trustedSourceLinkedOfficialInstall: true } : {},
			...entry.install.defaultChoice ? { defaultChoice: entry.install.defaultChoice } : {}
		});
	}
	for (const entry of require_provider_install_catalog.resolveProviderInstallCatalogEntries({
		config: params.cfg,
		env: params.env,
		includeUntrustedWorkspacePlugins: false
	})) {
		if (!configuredPluginIds.has(entry.pluginId) && !params.missingPluginIds.has(entry.pluginId)) continue;
		if (params.blockedPluginIds?.has(entry.pluginId)) continue;
		const npmSpec = entry.install.npmSpec?.trim();
		const clawhubSpec = resolveCandidateClawHubSpec(entry.install);
		if (!npmSpec && !clawhubSpec) continue;
		candidates.set(entry.pluginId, {
			pluginId: entry.pluginId,
			label: entry.label,
			...npmSpec ? { npmSpec } : {},
			...clawhubSpec ? { clawhubSpec } : {},
			...entry.install.expectedIntegrity ? { expectedIntegrity: entry.install.expectedIntegrity } : {},
			...entry.origin === "bundled" ? { trustedSourceLinkedOfficialInstall: true } : {},
			...entry.install.defaultChoice ? { defaultChoice: entry.install.defaultChoice } : {}
		});
	}
	for (const entry of require_official_external_plugin_catalog.listOfficialExternalPluginCatalogEntries()) {
		const pluginId = require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry);
		if (!pluginId || candidates.has(pluginId) || params.blockedPluginIds?.has(pluginId)) continue;
		if (!configuredPluginIds.has(pluginId) && !params.missingPluginIds.has(pluginId)) continue;
		const install = require_official_external_plugin_catalog.resolveOfficialExternalPluginInstall(entry);
		if (!install) continue;
		const npmSpec = install.npmSpec?.trim();
		const clawhubSpec = resolveCandidateClawHubSpec(install);
		if (!npmSpec && !clawhubSpec) continue;
		candidates.set(pluginId, {
			pluginId,
			label: require_official_external_plugin_catalog.resolveOfficialExternalPluginLabel(entry),
			...npmSpec ? { npmSpec } : {},
			...clawhubSpec ? { clawhubSpec } : {},
			...install.expectedIntegrity ? { expectedIntegrity: install.expectedIntegrity } : {},
			trustedSourceLinkedOfficialInstall: true,
			...install.defaultChoice ? { defaultChoice: install.defaultChoice } : {}
		});
	}
	for (const entry of require_configured_runtime_plugin_installs.CONFIGURED_RUNTIME_PLUGIN_INSTALL_CANDIDATES) {
		if (!configuredPluginIds.has(entry.pluginId) && !params.missingPluginIds.has(entry.pluginId)) continue;
		if (params.blockedPluginIds?.has(entry.pluginId)) continue;
		if (!candidates.has(entry.pluginId)) candidates.set(entry.pluginId, entry);
	}
	for (const candidate of collectLegacyNpmDeclarationInstallCandidates({
		cfg: params.cfg,
		env: params.env,
		configuredPluginIds,
		missingPluginIds: params.missingPluginIds,
		blockedPluginIds: params.blockedPluginIds
	})) if (!candidates.has(candidate.pluginId)) candidates.set(candidate.pluginId, candidate);
	return [...candidates.values()].toSorted((left, right) => left.pluginId.localeCompare(right.pluginId));
}
function addLegacyNpmDeclarationInstallCandidate(params) {
	const declaration = require_discovery.readLegacyNpmPluginDeclaration(params.pluginDir);
	if (!declaration) return;
	if (params.blockedPluginIds?.has(declaration.pluginId) || !params.configuredPluginIds.has(declaration.pluginId) && !params.missingPluginIds.has(declaration.pluginId)) return;
	params.candidates.set(declaration.pluginId, {
		pluginId: declaration.pluginId,
		label: declaration.pluginId,
		npmSpec: declaration.npmSpec,
		defaultChoice: "npm"
	});
}
function collectLegacyNpmDeclarationInstallCandidates(params) {
	const candidates = /* @__PURE__ */ new Map();
	const env = params.env ?? process.env;
	const loadPaths = params.cfg.plugins?.load?.paths;
	if (Array.isArray(loadPaths)) for (const rawPath of loadPaths) {
		if (typeof rawPath !== "string" || !rawPath.trim()) continue;
		addLegacyNpmDeclarationInstallCandidate({
			candidates,
			pluginDir: require_home_dir.resolveUserPath(rawPath, env),
			configuredPluginIds: params.configuredPluginIds,
			missingPluginIds: params.missingPluginIds,
			blockedPluginIds: params.blockedPluginIds
		});
	}
	const extensionsDir = require_install_paths.resolveDefaultPluginExtensionsDir(env);
	const configuredOrMissingPluginIds = /* @__PURE__ */ new Set([...params.configuredPluginIds, ...params.missingPluginIds]);
	for (const pluginId of configuredOrMissingPluginIds) try {
		addLegacyNpmDeclarationInstallCandidate({
			candidates,
			pluginDir: require_install_paths.resolvePluginInstallDir(pluginId, extensionsDir),
			configuredPluginIds: params.configuredPluginIds,
			missingPluginIds: params.missingPluginIds,
			blockedPluginIds: params.blockedPluginIds
		});
	} catch {}
	return [...candidates.values()].toSorted((left, right) => left.pluginId.localeCompare(right.pluginId));
}
function collectUpdateDeferredPluginIds(params) {
	const pluginIds = new Set(params.configuredPluginIds);
	for (const candidate of collectDownloadableInstallCandidates({
		cfg: params.cfg,
		env: params.env,
		missingPluginIds: /* @__PURE__ */ new Set(),
		configuredPluginIds: params.configuredPluginIds,
		configuredChannelIds: params.configuredChannelIds,
		configuredChannelOwnerPluginIds: params.configuredChannelOwnerPluginIds,
		blockedPluginIds: params.blockedPluginIds
	})) pluginIds.add(candidate.pluginId);
	return pluginIds;
}
function collectConfiguredPluginIdsWithMissingChannelConfigDescriptors(params) {
	const stalePluginIds = /* @__PURE__ */ new Set();
	const pluginsById = new Map(params.snapshot.plugins.map((plugin) => [plugin.id, plugin]));
	for (const diagnostic of params.snapshot.diagnostics) {
		const pluginId = diagnostic.pluginId?.trim();
		if (!pluginId || !diagnostic.message.includes(MISSING_CHANNEL_CONFIG_DESCRIPTOR_DIAGNOSTIC)) continue;
		const ownsConfiguredChannel = pluginsById.get(pluginId)?.channels.some((channelId) => params.configuredChannelIds.has(channelId));
		if (params.configuredPluginIds.has(pluginId) || ownsConfiguredChannel) stalePluginIds.add(pluginId);
	}
	return stalePluginIds;
}
function collectInstalledPluginIdsWithRepairablePackageDiagnostics(params) {
	const pluginIds = /* @__PURE__ */ new Set();
	for (const diagnostic of params.snapshot.diagnostics) {
		const pluginId = diagnostic.pluginId?.trim();
		if (!pluginId || !Object.hasOwn(params.installRecords, pluginId)) continue;
		if (REPAIRABLE_PACKAGE_ENTRY_DIAGNOSTIC_MARKERS.some((marker) => diagnostic.message.includes(marker))) pluginIds.add(pluginId);
	}
	return pluginIds;
}
function resolveInstalledRuntimePackageVersion(params) {
	const plugin = params.snapshot.byPluginId?.get(params.pluginId) ?? params.snapshot.plugins.find((entry) => entry.id === params.pluginId);
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.record.resolvedVersion ?? params.record.version ?? plugin?.packageVersion ?? plugin?.version);
}
function installedRuntimePackageVersionIsStale(params) {
	if (!params.installedVersion) return false;
	if (params.updateChannel === "beta" && betaCompanionMatchesCurrentStableVersion({
		installedVersion: params.installedVersion,
		currentVersion: params.currentVersion
	})) return false;
	const comparison = require_npm_registry_spec.compareOperatorReleaseVersions(params.installedVersion, params.currentVersion);
	return comparison === null ? params.installedVersion !== params.currentVersion : comparison < 0;
}
function betaCompanionMatchesCurrentStableVersion(params) {
	const installedBase = OPERATOR_BETA_COMPANION_VERSION_RE.exec(params.installedVersion)?.[1];
	const currentBase = OPERATOR_STABLE_OR_BETA_COMPANION_VERSION_RE.exec(params.currentVersion)?.[1];
	return Boolean(installedBase && currentBase && installedBase === currentBase);
}
function collectInstalledPluginIdsWithStaleVersionBoundRuntimePackages(params) {
	const pluginIds = /* @__PURE__ */ new Set();
	const currentVersion = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(require_version.VERSION);
	if (!currentVersion) return pluginIds;
	for (const candidate of require_configured_runtime_plugin_installs.CONFIGURED_RUNTIME_PLUGIN_INSTALL_CANDIDATES) {
		if (!require_configured_runtime_plugin_installs.VERSION_BOUND_RUNTIME_PLUGIN_IDS.has(candidate.pluginId) || !params.configuredPluginIds.has(candidate.pluginId)) continue;
		const record = params.installRecords[candidate.pluginId];
		if (!record) continue;
		if (installedRuntimePackageVersionIsStale({
			installedVersion: resolveInstalledRuntimePackageVersion({
				pluginId: candidate.pluginId,
				snapshot: params.snapshot,
				record
			}),
			currentVersion,
			updateChannel: params.updateChannel
		})) pluginIds.add(candidate.pluginId);
	}
	return pluginIds;
}
function isConfiguredPluginRepairTarget(params) {
	if (params.configuredPluginIds.has(params.pluginId)) return true;
	if (params.configuredChannelIds.has(params.pluginId)) return true;
	for (const ownerIds of params.configuredChannelOwnerPluginIds.values()) if (ownerIds.has(params.pluginId)) return true;
	return false;
}
function collectOfficialReplacementInstallCandidates(params) {
	const repairableConfiguredPluginIds = new Set([...params.repairablePluginIds].filter((pluginId) => isConfiguredPluginRepairTarget({
		pluginId,
		configuredPluginIds: params.configuredPluginIds,
		configuredChannelIds: params.configuredChannelIds,
		configuredChannelOwnerPluginIds: params.configuredChannelOwnerPluginIds
	})));
	if (repairableConfiguredPluginIds.size === 0) return /* @__PURE__ */ new Map();
	const candidates = collectDownloadableInstallCandidates({
		cfg: params.cfg,
		env: params.env,
		missingPluginIds: repairableConfiguredPluginIds,
		configuredPluginIds: params.configuredPluginIds,
		configuredChannelIds: params.configuredChannelIds,
		configuredChannelOwnerPluginIds: params.configuredChannelOwnerPluginIds,
		blockedPluginIds: params.blockedPluginIds
	});
	return new Map(candidates.filter((candidate) => repairableConfiguredPluginIds.has(candidate.pluginId) && candidate.trustedSourceLinkedOfficialInstall).map((candidate) => [candidate.pluginId, candidate]));
}
function forceNpmInstallRecordRepair(record) {
	if (record.source !== "npm") return record;
	const next = { ...record };
	delete next.resolvedSpec;
	delete next.resolvedVersion;
	return next;
}
function isInstalledRecordMissingOnDisk(record, env) {
	const installPath = record?.installPath?.trim();
	if (!installPath) return true;
	const resolved = require_home_dir.resolveUserPath(installPath, env);
	return !(0, node_fs.existsSync)(node_path.default.join(resolved, "package.json"));
}
function pathsEqual(left, right) {
	return node_path.default.resolve(left) === node_path.default.resolve(right);
}
function resolveNpmPackageInstallPath(params) {
	return require_install_paths.resolvePluginNpmPackageDir({
		npmDir: params.npmRoot,
		packageName: params.packageName
	});
}
function resolveLegacyNpmPackageInstallPath(params) {
	return node_path.default.join(params.npmRoot, "node_modules", ...params.packageName.split("/"));
}
function collectCandidateOfficialPackageNames(candidate) {
	const names = /* @__PURE__ */ new Set();
	const npmName = candidate.npmSpec ? require_npm_registry_spec.parseRegistryNpmSpec(candidate.npmSpec)?.name : void 0;
	const clawhubName = candidate.clawhubSpec ? require_clawhub.parseClawHubPluginSpec(candidate.clawhubSpec)?.name : void 0;
	if (npmName) names.add(npmName);
	if (clawhubName) names.add(clawhubName);
	return names;
}
function collectInstalledRecordPackageNames(record) {
	const names = /* @__PURE__ */ new Set();
	if (record.source === "npm") {
		const specName = record.spec ? require_npm_registry_spec.parseRegistryNpmSpec(record.spec)?.name : void 0;
		const resolvedSpecName = record.resolvedSpec ? require_npm_registry_spec.parseRegistryNpmSpec(record.resolvedSpec)?.name : void 0;
		for (const value of [
			record.resolvedName,
			specName,
			resolvedSpecName
		]) if (value) names.add(value);
	}
	if (record.source === "clawhub") {
		const specName = record.spec ? require_clawhub.parseClawHubPluginSpec(record.spec)?.name : void 0;
		for (const value of [record.clawhubPackage, specName]) if (value) names.add(value);
	}
	return names;
}
function isTrustedOfficialInstallRecordForCandidate(params) {
	const record = params.record;
	if (!record) return false;
	if (record.source !== "npm" && record.source !== "clawhub") return false;
	if (record.source === "clawhub" && record.clawhubChannel !== "official") return false;
	const candidatePackageNames = collectCandidateOfficialPackageNames(params.candidate);
	if (candidatePackageNames.size === 0) return false;
	for (const installedPackageName of collectInstalledRecordPackageNames(record)) if (candidatePackageNames.has(installedPackageName)) return true;
	return false;
}
function resolveSafeBrokenOfficialInstallRemovalPath(params) {
	const installPath = params.record?.installPath?.trim();
	if (!installPath) return null;
	const resolvedInstallPath = require_home_dir.resolveUserPath(installPath, params.env);
	try {
		const extensionsDir = require_install_paths.resolveDefaultPluginExtensionsDir(params.env);
		if (pathsEqual(resolvedInstallPath, require_install_paths.resolvePluginInstallDir(params.pluginId, extensionsDir))) return resolvedInstallPath;
	} catch {}
	const parsedNpmSpec = params.candidate.npmSpec ? require_npm_registry_spec.parseRegistryNpmSpec(params.candidate.npmSpec) : null;
	if (!parsedNpmSpec?.name) return null;
	const npmRoot = require_install_paths.resolveDefaultPluginNpmDir(params.env);
	return [resolveNpmPackageInstallPath({
		packageName: parsedNpmSpec.name,
		npmRoot
	}), resolveLegacyNpmPackageInstallPath({
		packageName: parsedNpmSpec.name,
		npmRoot
	})].some((expectedPath) => pathsEqual(resolvedInstallPath, expectedPath)) ? resolvedInstallPath : null;
}
function recordMatchesBundledPackage(record, bundled) {
	const packageName = bundled.packageName?.trim() || bundled.name?.trim();
	if (!packageName) return false;
	if (record.source === "npm") return [
		record.spec,
		record.resolvedName,
		record.resolvedSpec
	].some((value) => recordNpmPackageName(value) === packageName);
	if (record.source === "clawhub") return [record.clawhubPackage, record.spec].some((value) => recordClawHubPackageName(value) === packageName);
	return false;
}
function recordNpmPackageName(value) {
	const trimmed = value?.trim();
	return trimmed ? require_npm_registry_spec.parseRegistryNpmSpec(trimmed)?.name : void 0;
}
function recordClawHubPackageName(value) {
	const trimmed = value?.trim();
	if (!trimmed) return;
	return require_clawhub.parseClawHubPluginSpec(trimmed)?.name ?? trimmed;
}
function formatInstalledConfiguredPluginChange(params) {
	return params.repairReason === "stale-version-bound-runtime" ? `Refreshed stale configured plugin "${params.pluginId}" from ${params.installSpec}.` : `Installed missing configured plugin "${params.pluginId}" from ${params.installSpec}.`;
}
async function installCandidate(params) {
	const { candidate } = params;
	const extensionsDir = require_install_paths.resolveDefaultPluginExtensionsDir(params.env);
	const changes = [];
	const warnings = [];
	const clawhubSpecs = candidate.clawhubSpec ? require_install_channel_specs.resolveClawHubInstallSpecsForUpdateChannel({
		spec: candidate.clawhubSpec,
		updateChannel: params.updateChannel
	}) : null;
	const npmSpecs = candidate.npmSpec ? require_install_channel_specs.resolveNpmInstallSpecsForUpdateChannel({
		spec: candidate.npmSpec,
		updateChannel: params.updateChannel,
		officialPackageName: candidate.trustedSourceLinkedOfficialInstall ? require_npm_registry_spec.parseRegistryNpmSpec(candidate.npmSpec)?.name : void 0,
		coreVersion: require_version.resolveCompatibilityHostVersion(params.env)
	}) : null;
	const clawhubInstallSpec = clawhubSpecs?.installSpec ?? candidate.clawhubSpec;
	const npmInstallSpec = npmSpecs?.installSpec ?? candidate.npmSpec;
	const npmDir = require_install_paths.resolveDefaultPluginNpmDir(params.env);
	const existingClawHubPackagePath = clawhubInstallSpec ? resolveExistingCandidateClawHubPackagePath({
		candidate,
		extensionsDir
	}) : null;
	const existingNpmPackagePath = npmInstallSpec ? resolveExistingCandidateNpmPackagePath({
		candidate,
		npmDir
	}) : null;
	const existingNpmPackageVersion = existingNpmPackagePath ? await readNpmPackageVersion(existingNpmPackagePath) : void 0;
	if (existingNpmPackagePath && existingNpmPackageVersion && npmInstallSpec && params.mode !== "update" && require_update_phase.isPostCoreConvergencePass(params.env)) return await adoptExistingNpmPackage({
		candidate,
		records: params.records,
		npmInstallSpec,
		npmRecordSpec: npmSpecs?.recordSpec ?? npmInstallSpec,
		pinResolvedRegistrySpec: false,
		packagePath: existingNpmPackagePath,
		version: existingNpmPackageVersion
	});
	if (clawhubInstallSpec && !existingNpmPackagePath && !(params.preferNpm && npmInstallSpec) && candidate.defaultChoice !== "npm") {
		const clawhubInstallSpecLabel = require_safe_text.sanitizeTerminalText(clawhubInstallSpec);
		const clawhubResult = await require_clawhub$1.installPluginFromClawHub({
			spec: clawhubInstallSpec,
			extensionsDir,
			env: params.env,
			expectedPluginId: candidate.pluginId,
			mode: params.mode === "update" || existingClawHubPackagePath ? "update" : "install",
			logger: {
				terminalLinks: false,
				warn: (message) => warnings.push(require_ansi.stripAnsi(message))
			},
			...params.acknowledgeClawHubRisk ? { acknowledgeClawHubRisk: true } : {},
			...params.onClawHubRisk ? { onClawHubRisk: params.onClawHubRisk } : {}
		});
		if (clawhubResult.ok) {
			const pluginId = clawhubResult.pluginId;
			return {
				records: {
					...params.records,
					[pluginId]: {
						...require_clawhub_install_records.buildClawHubPluginInstallRecordFields(clawhubResult.clawhub),
						spec: clawhubSpecs?.recordSpec ?? clawhubInstallSpec,
						installPath: clawhubResult.targetDir,
						installedAt: (/* @__PURE__ */ new Date()).toISOString()
					}
				},
				changes: [formatInstalledConfiguredPluginChange({
					pluginId,
					installSpec: clawhubInstallSpecLabel,
					repairReason: params.repairReason
				})],
				notices: warnings,
				warnings: []
			};
		}
		if (!npmInstallSpec || !shouldFallbackClawHubToNpm({
			result: clawhubResult,
			npmSpec: npmInstallSpec
		})) {
			const failure = `Failed to install missing configured plugin "${candidate.pluginId}" from ${clawhubInstallSpecLabel}: ${clawhubResult.error}`;
			return {
				records: params.records,
				changes: [],
				notices: [],
				warnings: [...warnings, appendClawHubRiskAcknowledgementGuidance({
					message: failure,
					spec: clawhubInstallSpec
				})],
				failedPluginId: candidate.pluginId
			};
		}
		const npmInstallSpecLabel = require_safe_text.sanitizeTerminalText(npmInstallSpec);
		changes.push(`ClawHub ${clawhubInstallSpecLabel} unavailable for "${candidate.pluginId}"; falling back to npm ${npmInstallSpecLabel}.`);
	}
	if (!npmInstallSpec) return {
		records: params.records,
		changes: [],
		notices: [],
		warnings: [...warnings, `Failed to install missing configured plugin "${candidate.pluginId}": missing npm spec.`],
		failedPluginId: candidate.pluginId
	};
	const npmInstallMode = params.mode === "update" || existingNpmPackagePath ? "update" : "install";
	let result = await require_clawhub_error_codes.installPluginFromNpmSpec({
		spec: npmInstallSpec,
		extensionsDir,
		npmDir,
		expectedPluginId: candidate.pluginId,
		expectedIntegrity: candidate.expectedIntegrity,
		...candidate.trustedSourceLinkedOfficialInstall ? { trustedSourceLinkedOfficialInstall: true } : {},
		mode: npmInstallMode
	});
	if (!result.ok && npmInstallMode === "install" && isPluginAlreadyExistsError(result.error)) result = await require_clawhub_error_codes.installPluginFromNpmSpec({
		spec: npmInstallSpec,
		extensionsDir,
		npmDir,
		expectedPluginId: candidate.pluginId,
		expectedIntegrity: candidate.expectedIntegrity,
		...candidate.trustedSourceLinkedOfficialInstall ? { trustedSourceLinkedOfficialInstall: true } : {},
		mode: "update"
	});
	if (!result.ok) return {
		records: params.records,
		changes: [],
		notices: [],
		warnings: [...warnings, `Failed to install missing configured plugin "${candidate.pluginId}" from ${npmInstallSpec}: ${result.error}`],
		failedPluginId: candidate.pluginId
	};
	const pluginId = result.pluginId;
	return {
		records: {
			...params.records,
			[pluginId]: {
				source: "npm",
				spec: require_installed_plugin_index_records.resolveNpmInstallRecordSpec({
					requestedSpec: npmSpecs?.recordSpec ?? npmInstallSpec,
					resolution: result.npmResolution,
					pinResolvedRegistrySpec: false
				}),
				installPath: result.targetDir,
				version: result.version,
				installedAt: (/* @__PURE__ */ new Date()).toISOString(),
				...require_installed_plugin_index_records.buildNpmResolutionInstallFields(result.npmResolution)
			}
		},
		changes: [...changes, formatInstalledConfiguredPluginChange({
			pluginId,
			installSpec: npmInstallSpec,
			repairReason: params.repairReason
		})],
		notices: [],
		warnings: []
	};
}
function isPluginAlreadyExistsError(error) {
	return /\bplugin already exists:/.test(error);
}
function resolveExistingCandidateNpmPackagePath(params) {
	const npmName = params.candidate.npmSpec ? require_npm_registry_spec.parseRegistryNpmSpec(params.candidate.npmSpec)?.name : void 0;
	if (!npmName) return null;
	const packagePath = resolveNpmPackageInstallPath({
		packageName: npmName,
		npmRoot: params.npmDir
	});
	if ((0, node_fs.existsSync)(packagePath)) return packagePath;
	const legacyPackagePath = resolveLegacyNpmPackageInstallPath({
		packageName: npmName,
		npmRoot: params.npmDir
	});
	return (0, node_fs.existsSync)(legacyPackagePath) ? legacyPackagePath : null;
}
function resolveExistingCandidateClawHubPackagePath(params) {
	try {
		const packagePath = require_install_paths.resolvePluginInstallDir(params.candidate.pluginId, params.extensionsDir);
		return (0, node_fs.existsSync)(packagePath) ? packagePath : null;
	} catch {
		return null;
	}
}
async function readNpmPackageVersion(packagePath) {
	try {
		const parsed = JSON.parse(await (0, node_fs_promises.readFile)(node_path.default.join(packagePath, "package.json"), "utf-8"));
		return typeof parsed.version === "string" && parsed.version.trim() ? parsed.version.trim() : void 0;
	} catch {
		return;
	}
}
async function adoptExistingNpmPackage(params) {
	const npmName = require_npm_registry_spec.parseRegistryNpmSpec(params.npmInstallSpec)?.name;
	const npmResolution = npmName ? {
		name: npmName,
		version: params.version,
		resolvedSpec: `${npmName}@${params.version}`
	} : void 0;
	return {
		records: {
			...params.records,
			[params.candidate.pluginId]: {
				source: "npm",
				spec: require_installed_plugin_index_records.resolveNpmInstallRecordSpec({
					requestedSpec: params.npmRecordSpec,
					resolution: npmResolution,
					pinResolvedRegistrySpec: params.pinResolvedRegistrySpec
				}),
				installPath: params.packagePath,
				installedAt: (/* @__PURE__ */ new Date()).toISOString(),
				version: params.version,
				resolvedVersion: params.version,
				...npmName ? { resolvedName: npmName } : {},
				...npmResolution ? { resolvedSpec: npmResolution.resolvedSpec } : {}
			}
		},
		changes: [`Repaired missing configured plugin "${params.candidate.pluginId}" from existing npm payload ${params.npmInstallSpec}.`],
		notices: [],
		warnings: []
	};
}
function resolveCandidateInstallSpec(params) {
	if (params.candidate.defaultChoice !== "npm" && params.candidate.clawhubSpec) return require_install_channel_specs.resolveClawHubInstallSpecsForUpdateChannel({
		spec: params.candidate.clawhubSpec,
		updateChannel: params.updateChannel
	}).installSpec;
	if (params.candidate.npmSpec) return require_install_channel_specs.resolveNpmInstallSpecsForUpdateChannel({
		spec: params.candidate.npmSpec,
		updateChannel: params.updateChannel,
		officialPackageName: params.candidate.trustedSourceLinkedOfficialInstall ? require_npm_registry_spec.parseRegistryNpmSpec(params.candidate.npmSpec)?.name : void 0,
		coreVersion: params.coreVersion
	}).installSpec;
	if (params.candidate.clawhubSpec) return require_install_channel_specs.resolveClawHubInstallSpecsForUpdateChannel({
		spec: params.candidate.clawhubSpec,
		updateChannel: params.updateChannel
	}).installSpec;
}
function resolveRecordInstallPath(record, env) {
	const installPath = record?.installPath?.trim();
	return installPath ? require_home_dir.resolveUserPath(installPath, env) : void 0;
}
function missingRecordedPluginIssueKind(params) {
	if (params.staleVersionBoundRuntimePluginIds.has(params.pluginId)) return "stale-version-bound-runtime";
	if (params.repairablePackageDiagnosticPluginIds.has(params.pluginId)) return "repairable-installed-plugin";
	if (params.staleDescriptorPluginIds.has(params.pluginId)) return "stale-channel-config-descriptor";
	return "missing-installed-payload";
}
/** Detect configured plugin installs that Doctor can repair without mutating package state. */
async function detectConfiguredPluginInstallHealthIssues(params) {
	const env = params.env ?? process.env;
	const pluginIds = collectConfiguredPluginIds(params.cfg, env);
	const channelIds = collectConfiguredChannelIds(params.cfg, env);
	const blockedPluginIds = collectBlockedPluginIds(params.cfg);
	const snapshot = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.cfg,
		env
	});
	const currentBundledPlugins = require_installed_plugin_index.loadInstalledPluginIndex({
		config: params.cfg,
		env,
		installRecords: {}
	}).plugins.filter((plugin) => plugin.origin === "bundled");
	const knownIds = /* @__PURE__ */ new Set([...snapshot.plugins.map((plugin) => plugin.id), ...currentBundledPlugins.map((plugin) => plugin.pluginId)]);
	const configuredChannelOwnerPluginIds = collectEffectiveConfiguredChannelOwnerPluginIds({
		cfg: params.cfg,
		env,
		snapshot,
		configuredChannelIds: channelIds
	});
	const bundledPluginsById = new Map([...snapshot.plugins.filter((plugin) => plugin.origin === "bundled").map((plugin) => [plugin.id, plugin]), ...currentBundledPlugins.map((plugin) => [plugin.pluginId, { packageName: plugin.packageName }])]);
	const staleDescriptorPluginIds = collectConfiguredPluginIdsWithMissingChannelConfigDescriptors({
		snapshot,
		configuredPluginIds: pluginIds,
		configuredChannelIds: channelIds
	});
	const records = params.baselineRecords ?? await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords({ env });
	const updateChannel = require_update_channels.resolveRegistryUpdateChannel({
		configChannel: require_update_channels.normalizeUpdateChannel(params.cfg.update?.channel),
		currentVersion: require_version.VERSION
	});
	const repairablePackageDiagnosticPluginIds = collectInstalledPluginIdsWithRepairablePackageDiagnostics({
		snapshot,
		installRecords: records
	});
	const staleVersionBoundRuntimePluginIds = collectInstalledPluginIdsWithStaleVersionBoundRuntimePackages({
		snapshot,
		installRecords: records,
		configuredPluginIds: pluginIds,
		updateChannel
	});
	const repairableInstalledPluginIds = /* @__PURE__ */ new Set([...repairablePackageDiagnosticPluginIds, ...staleVersionBoundRuntimePluginIds]);
	const officialReplacementInstallCandidates = collectOfficialReplacementInstallCandidates({
		cfg: params.cfg,
		env,
		repairablePluginIds: repairableInstalledPluginIds,
		configuredPluginIds: pluginIds,
		configuredChannelIds: channelIds,
		configuredChannelOwnerPluginIds,
		blockedPluginIds
	});
	const officialReplacementPluginIds = new Set(officialReplacementInstallCandidates.keys());
	const deferredPluginIds = /* @__PURE__ */ new Set();
	const reportedPluginIds = /* @__PURE__ */ new Set();
	const issues = [];
	if (require_update_phase.shouldDeferConfiguredPluginInstallRepair(env)) for (const pluginId of collectUpdateDeferredPluginIds({
		cfg: params.cfg,
		env,
		configuredPluginIds: pluginIds,
		configuredChannelIds: channelIds,
		configuredChannelOwnerPluginIds,
		blockedPluginIds
	})) {
		deferredPluginIds.add(pluginId);
		const record = records[pluginId];
		if (!record || !isInstalledRecordMissingOnDisk(record, env)) continue;
		issues.push({
			kind: "deferred-package-manager-repair",
			pluginId,
			...resolveRecordInstallPath(record, env) ? { installPath: resolveRecordInstallPath(record, env) } : {}
		});
		reportedPluginIds.add(pluginId);
	}
	const missingRecordedPluginIds = Object.keys(records).filter((pluginId) => !deferredPluginIds.has(pluginId) && !officialReplacementPluginIds.has(pluginId) && !bundledPluginsById.has(pluginId) && (pluginIds.has(pluginId) && (!knownIds.has(pluginId) || isInstalledRecordMissingOnDisk(records[pluginId], env)) || staleDescriptorPluginIds.has(pluginId) || repairableInstalledPluginIds.has(pluginId)));
	for (const pluginId of missingRecordedPluginIds) {
		const record = records[pluginId];
		const kind = missingRecordedPluginIssueKind({
			pluginId,
			staleVersionBoundRuntimePluginIds,
			repairablePackageDiagnosticPluginIds,
			staleDescriptorPluginIds
		});
		const installPath = resolveRecordInstallPath(record, env);
		if (kind === "stale-channel-config-descriptor") {
			issues.push({
				kind,
				pluginId,
				...installPath ? { installPath } : {}
			});
			reportedPluginIds.add(pluginId);
			continue;
		}
		issues.push({
			kind,
			pluginId,
			...installPath ? { installPath } : {},
			...record?.spec ? { installSpec: record.spec } : {}
		});
		reportedPluginIds.add(pluginId);
	}
	const missingPluginIds = new Set([...pluginIds].filter((pluginId) => {
		if (deferredPluginIds.has(pluginId)) return false;
		const hasRecord = Object.hasOwn(records, pluginId);
		return !knownIds.has(pluginId) && !hasRecord && !bundledPluginsById.has(pluginId) || hasRecord && !bundledPluginsById.has(pluginId) && isInstalledRecordMissingOnDisk(records[pluginId], env);
	}));
	const installCandidatePluginIds = /* @__PURE__ */ new Set([...missingPluginIds, ...officialReplacementPluginIds]);
	for (const candidate of collectDownloadableInstallCandidates({
		cfg: params.cfg,
		env,
		missingPluginIds: installCandidatePluginIds,
		configuredPluginIds: pluginIds,
		configuredChannelIds: channelIds,
		configuredChannelOwnerPluginIds,
		blockedPluginIds: deferredPluginIds.size > 0 ? /* @__PURE__ */ new Set([...blockedPluginIds, ...deferredPluginIds]) : blockedPluginIds
	})) {
		if (bundledPluginsById.has(candidate.pluginId)) continue;
		if (reportedPluginIds.has(candidate.pluginId)) continue;
		const shouldReplaceBrokenOfficialInstall = officialReplacementPluginIds.has(candidate.pluginId);
		if (shouldReplaceBrokenOfficialInstall && !candidate.trustedSourceLinkedOfficialInstall) continue;
		const record = records[candidate.pluginId];
		if (shouldReplaceBrokenOfficialInstall && !isTrustedOfficialInstallRecordForCandidate({
			record,
			candidate
		})) continue;
		const hasUsableRecord = Object.hasOwn(records, candidate.pluginId) && !isInstalledRecordMissingOnDisk(records[candidate.pluginId], env);
		if (!shouldReplaceBrokenOfficialInstall && knownIds.has(candidate.pluginId) && hasUsableRecord) continue;
		if (!shouldReplaceBrokenOfficialInstall && hasUsableRecord) continue;
		const installSpec = resolveCandidateInstallSpec({
			candidate,
			updateChannel,
			coreVersion: require_version.resolveCompatibilityHostVersion(env)
		});
		if (shouldReplaceBrokenOfficialInstall) {
			const installPath = resolveRecordInstallPath(record, env);
			if (staleVersionBoundRuntimePluginIds.has(candidate.pluginId)) issues.push({
				kind: "stale-version-bound-runtime",
				pluginId: candidate.pluginId,
				...installPath ? { installPath } : {},
				...installSpec ? { installSpec } : {}
			});
			else issues.push({
				kind: "repairable-installed-plugin",
				pluginId: candidate.pluginId,
				...installPath ? { installPath } : {},
				...installSpec ? { installSpec } : {}
			});
			continue;
		}
		if (record) {
			const installPath = resolveRecordInstallPath(record, env);
			issues.push({
				kind: "missing-installed-payload",
				pluginId: candidate.pluginId,
				...installPath ? { installPath } : {},
				...installSpec ? { installSpec } : {}
			});
		} else if (installSpec) issues.push({
			kind: "missing-install-record",
			pluginId: candidate.pluginId,
			installSpec
		});
	}
	return issues.toSorted((left, right) => left.pluginId.localeCompare(right.pluginId));
}
function configuredPluginInstallIssueToHealthFinding(issue) {
	const target = issue.pluginId;
	switch (issue.kind) {
		case "missing-install-record": return {
			checkId: CONFIGURED_PLUGIN_INSTALLS_CHECK_ID,
			severity: "warning",
			message: `Configured plugin ${issue.pluginId} is not installed.`,
			target,
			fixHint: `Run \`operator doctor --fix\` to install ${issue.installSpec}.`
		};
		case "missing-installed-payload": return {
			checkId: CONFIGURED_PLUGIN_INSTALLS_CHECK_ID,
			severity: "warning",
			message: `Configured plugin ${issue.pluginId} has an install record but its package payload is missing.`,
			target,
			...issue.installPath ? { path: issue.installPath } : {},
			fixHint: "Run `operator doctor --fix` to reinstall the configured plugin package."
		};
		case "repairable-installed-plugin": return {
			checkId: CONFIGURED_PLUGIN_INSTALLS_CHECK_ID,
			severity: "warning",
			message: `Configured plugin ${issue.pluginId} has a repairable package install problem.`,
			target,
			...issue.installPath ? { path: issue.installPath } : {},
			fixHint: "Run `operator doctor --fix` to repair the configured plugin package."
		};
		case "stale-version-bound-runtime": return {
			checkId: CONFIGURED_PLUGIN_INSTALLS_CHECK_ID,
			severity: "warning",
			message: `Configured runtime plugin ${issue.pluginId} is older than this Operator version.`,
			target,
			...issue.installPath ? { path: issue.installPath } : {},
			fixHint: "Run `operator doctor --fix` to refresh the configured runtime plugin."
		};
		case "stale-channel-config-descriptor": return {
			checkId: CONFIGURED_PLUGIN_INSTALLS_CHECK_ID,
			severity: "warning",
			message: `Configured plugin ${issue.pluginId} has stale channel config metadata.`,
			target,
			...issue.installPath ? { path: issue.installPath } : {},
			fixHint: "Run `operator doctor --fix` to repair the configured plugin install metadata."
		};
		case "deferred-package-manager-repair": return {
			checkId: CONFIGURED_PLUGIN_INSTALLS_CHECK_ID,
			severity: "warning",
			message: `Configured plugin ${issue.pluginId} package repair is deferred until the package update finishes.`,
			target,
			...issue.installPath ? { path: issue.installPath } : {},
			fixHint: "Rerun `operator doctor --fix` after the package update completes."
		};
	}
	return assertNeverConfiguredPluginInstallIssue(issue);
}
function configuredPluginInstallIssueToRepairEffect(issue) {
	switch (issue.kind) {
		case "missing-install-record": return {
			kind: "package",
			action: "would-install-configured-plugin",
			target: issue.pluginId,
			dryRunSafe: false
		};
		case "missing-installed-payload": return {
			kind: "package",
			action: "would-reinstall-configured-plugin",
			target: issue.pluginId,
			dryRunSafe: false
		};
		case "repairable-installed-plugin":
		case "stale-channel-config-descriptor": return {
			kind: "package",
			action: "would-repair-configured-plugin-install",
			target: issue.pluginId,
			dryRunSafe: false
		};
		case "stale-version-bound-runtime": return {
			kind: "package",
			action: "would-refresh-configured-runtime-plugin",
			target: issue.pluginId,
			dryRunSafe: false
		};
		case "deferred-package-manager-repair": return {
			kind: "package",
			action: "would-defer-configured-plugin-install-repair",
			target: issue.pluginId,
			dryRunSafe: true
		};
	}
	return assertNeverConfiguredPluginInstallIssue(issue);
}
function assertNeverConfiguredPluginInstallIssue(issue) {
	throw new Error(`Unhandled configured plugin install issue kind: ${String(issue.kind)}`);
}
/** Repair missing installs inferred from the current Operator config. */
async function repairMissingConfiguredPluginInstalls(params) {
	return repairMissingPluginInstalls({
		cfg: params.cfg,
		env: params.env,
		pluginIds: collectConfiguredPluginIds(params.cfg, params.env),
		channelIds: collectConfiguredChannelIds(params.cfg, params.env),
		blockedPluginIds: collectBlockedPluginIds(params.cfg),
		...params.acknowledgeClawHubRisk ? { acknowledgeClawHubRisk: true } : {},
		...params.onClawHubRisk ? { onClawHubRisk: params.onClawHubRisk } : {},
		...params.baselineRecords ? { baselineRecords: params.baselineRecords } : {}
	});
}
/** Repair missing installs for an explicit plugin/channel id set. */
async function repairMissingPluginInstallsForIds(params) {
	return repairMissingPluginInstalls({
		cfg: params.cfg,
		env: params.env,
		pluginIds: new Set([...params.pluginIds].map((pluginId) => pluginId.trim()).filter((pluginId) => pluginId)),
		channelIds: new Set([...params.channelIds ?? []].map((channelId) => channelId.trim()).filter((channelId) => channelId)),
		blockedPluginIds: new Set([...params.blockedPluginIds ?? []].map((pluginId) => pluginId.trim()).filter((pluginId) => pluginId)),
		...params.acknowledgeClawHubRisk ? { acknowledgeClawHubRisk: true } : {},
		...params.onClawHubRisk ? { onClawHubRisk: params.onClawHubRisk } : {},
		...params.baselineRecords ? { baselineRecords: params.baselineRecords } : {}
	});
}
async function repairMissingPluginInstalls(params) {
	const env = params.env ?? process.env;
	const snapshot = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.cfg,
		env
	});
	const currentBundledPlugins = require_installed_plugin_index.loadInstalledPluginIndex({
		config: params.cfg,
		env,
		installRecords: {}
	}).plugins.filter((plugin) => plugin.origin === "bundled");
	const knownIds = /* @__PURE__ */ new Set([...snapshot.plugins.map((plugin) => plugin.id), ...currentBundledPlugins.map((plugin) => plugin.pluginId)]);
	const configuredChannelOwnerPluginIds = collectEffectiveConfiguredChannelOwnerPluginIds({
		cfg: params.cfg,
		env,
		snapshot,
		configuredChannelIds: params.channelIds
	});
	const bundledPluginsById = new Map([...snapshot.plugins.filter((plugin) => plugin.origin === "bundled").map((plugin) => [plugin.id, plugin]), ...currentBundledPlugins.map((plugin) => [plugin.pluginId, { packageName: plugin.packageName }])]);
	const configuredPluginIdsWithStaleDescriptors = collectConfiguredPluginIdsWithMissingChannelConfigDescriptors({
		snapshot,
		configuredPluginIds: params.pluginIds,
		configuredChannelIds: params.channelIds
	});
	const records = params.baselineRecords ?? await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords({ env });
	const updateChannel = require_update_channels.resolveRegistryUpdateChannel({
		configChannel: require_update_channels.normalizeUpdateChannel(params.cfg.update?.channel),
		currentVersion: require_version.VERSION
	});
	const installedPluginIdsWithRepairablePackageDiagnostics = collectInstalledPluginIdsWithRepairablePackageDiagnostics({
		snapshot,
		installRecords: records
	});
	const installedPluginIdsWithStaleVersionBoundRuntimePackages = collectInstalledPluginIdsWithStaleVersionBoundRuntimePackages({
		snapshot,
		installRecords: records,
		configuredPluginIds: params.pluginIds,
		updateChannel
	});
	const installedPluginIdsWithRepairablePackages = /* @__PURE__ */ new Set([...installedPluginIdsWithRepairablePackageDiagnostics, ...installedPluginIdsWithStaleVersionBoundRuntimePackages]);
	const officialReplacementInstallCandidates = collectOfficialReplacementInstallCandidates({
		cfg: params.cfg,
		env,
		repairablePluginIds: installedPluginIdsWithRepairablePackages,
		configuredPluginIds: params.pluginIds,
		configuredChannelIds: params.channelIds,
		configuredChannelOwnerPluginIds,
		blockedPluginIds: params.blockedPluginIds
	});
	const officialReplacementPluginIds = new Set(officialReplacementInstallCandidates.keys());
	const changes = [];
	const notices = [];
	const warnings = [];
	const deferredRepairDetails = [];
	const failedPluginIds = /* @__PURE__ */ new Set();
	const repairedPluginIds = /* @__PURE__ */ new Set();
	const deferredPluginIds = /* @__PURE__ */ new Set();
	const preferNpmInstalls = require_update_phase.isLegacyPackageUpdateDoctorPass(env);
	let nextRecords = records;
	for (const [pluginId, record] of Object.entries(records)) {
		const bundled = bundledPluginsById.get(pluginId);
		if (!bundled || !recordMatchesBundledPackage(record, bundled)) continue;
		if (nextRecords === records) nextRecords = { ...records };
		delete nextRecords[pluginId];
		changes.push(`Removed stale managed install record for bundled plugin "${pluginId}".`);
	}
	if (require_update_phase.shouldDeferConfiguredPluginInstallRepair(env)) {
		const updateDeferredPluginIds = collectUpdateDeferredPluginIds({
			cfg: params.cfg,
			env,
			configuredPluginIds: params.pluginIds,
			configuredChannelIds: params.channelIds,
			configuredChannelOwnerPluginIds,
			blockedPluginIds: params.blockedPluginIds
		});
		for (const pluginId of updateDeferredPluginIds) {
			deferredPluginIds.add(pluginId);
			const record = nextRecords[pluginId];
			if (!record || !isInstalledRecordMissingOnDisk(record, env)) continue;
			const detail = `Skipped package-manager repair for configured plugin "${pluginId}" during package update; rerun "operator doctor --fix" after the update completes.`;
			changes.push(detail);
			deferredRepairDetails.push(detail);
		}
	}
	const missingRecordedPluginIds = Object.keys(records).filter((pluginId) => !deferredPluginIds.has(pluginId) && !officialReplacementPluginIds.has(pluginId) && Object.hasOwn(nextRecords, pluginId) && !bundledPluginsById.has(pluginId) && (params.pluginIds.has(pluginId) && (!knownIds.has(pluginId) || isInstalledRecordMissingOnDisk(nextRecords[pluginId], env)) || configuredPluginIdsWithStaleDescriptors.has(pluginId) || installedPluginIdsWithRepairablePackages.has(pluginId)));
	if (missingRecordedPluginIds.length > 0) {
		for (const pluginId of missingRecordedPluginIds) {
			const record = nextRecords[pluginId];
			if (!record) continue;
			const forced = forceNpmInstallRecordRepair(record);
			if (forced !== record) {
				if (nextRecords === records) nextRecords = { ...records };
				nextRecords[pluginId] = forced;
			}
		}
		const updateResult = await updateNpmInstalledPlugins({
			config: {
				...params.cfg,
				plugins: {
					...params.cfg.plugins,
					installs: nextRecords
				}
			},
			pluginIds: missingRecordedPluginIds,
			updateChannel,
			coreVersion: require_version.resolveCompatibilityHostVersion(env),
			logger: {
				terminalLinks: false,
				warn: (message) => {
					if (isClawHubReviewNotice(message)) {
						notices.push(require_ansi.stripAnsi(message));
						return;
					}
					warnings.push(message);
				},
				error: (message) => warnings.push(message)
			},
			...params.acknowledgeClawHubRisk ? { acknowledgeClawHubRisk: true } : {},
			...params.onClawHubRisk ? { onClawHubRisk: params.onClawHubRisk } : {}
		});
		for (const outcome of updateResult.outcomes) if (outcome.status === "updated" || outcome.status === "unchanged") {
			repairedPluginIds.add(outcome.pluginId);
			changes.push(installedPluginIdsWithStaleVersionBoundRuntimePackages.has(outcome.pluginId) ? `Refreshed stale configured plugin "${outcome.pluginId}".` : installedPluginIdsWithRepairablePackageDiagnostics.has(outcome.pluginId) ? `Repaired broken installed plugin "${outcome.pluginId}".` : `Repaired missing configured plugin "${outcome.pluginId}".`);
		} else if (outcome.status === "error") {
			warnings.push(outcome.message);
			failedPluginIds.add(outcome.pluginId);
		} else if (isActionableClawHubSkippedOutcome(outcome)) {
			warnings.push(appendClawHubRiskAcknowledgementGuidance({
				message: outcome.message,
				spec: recordClawHubInstallSpec(nextRecords[outcome.pluginId])
			}));
			failedPluginIds.add(outcome.pluginId);
		}
		nextRecords = updateResult.config.plugins?.installs ?? nextRecords;
	}
	const missingPluginIds = new Set([...params.pluginIds].filter((pluginId) => {
		if (deferredPluginIds.has(pluginId)) return false;
		const hasRecord = Object.hasOwn(nextRecords, pluginId);
		return !knownIds.has(pluginId) && !hasRecord && !bundledPluginsById.has(pluginId) || hasRecord && !bundledPluginsById.has(pluginId) && isInstalledRecordMissingOnDisk(nextRecords[pluginId], env);
	}));
	const installCandidatePluginIds = /* @__PURE__ */ new Set([...missingPluginIds, ...officialReplacementPluginIds]);
	for (const candidate of collectDownloadableInstallCandidates({
		cfg: params.cfg,
		env,
		missingPluginIds: installCandidatePluginIds,
		configuredPluginIds: params.pluginIds,
		configuredChannelIds: params.channelIds,
		configuredChannelOwnerPluginIds,
		blockedPluginIds: deferredPluginIds.size > 0 ? /* @__PURE__ */ new Set([...params.blockedPluginIds ?? [], ...deferredPluginIds]) : params.blockedPluginIds
	})) {
		if (bundledPluginsById.has(candidate.pluginId)) continue;
		const shouldReplaceBrokenOfficialInstall = officialReplacementPluginIds.has(candidate.pluginId);
		if (shouldReplaceBrokenOfficialInstall && !candidate.trustedSourceLinkedOfficialInstall) continue;
		const record = nextRecords[candidate.pluginId];
		if (shouldReplaceBrokenOfficialInstall && !isTrustedOfficialInstallRecordForCandidate({
			record,
			candidate
		})) continue;
		const hasUsableRecord = Object.hasOwn(nextRecords, candidate.pluginId) && !isInstalledRecordMissingOnDisk(nextRecords[candidate.pluginId], env);
		if (!shouldReplaceBrokenOfficialInstall && knownIds.has(candidate.pluginId) && hasUsableRecord) continue;
		if (!shouldReplaceBrokenOfficialInstall && hasUsableRecord) continue;
		const removalPath = shouldReplaceBrokenOfficialInstall ? resolveSafeBrokenOfficialInstallRemovalPath({
			pluginId: candidate.pluginId,
			candidate,
			record,
			env
		}) : null;
		const previousRecords = nextRecords;
		const installed = await installCandidate({
			candidate,
			records: nextRecords,
			env,
			updateChannel,
			mode: shouldReplaceBrokenOfficialInstall ? "update" : "install",
			preferNpm: preferNpmInstalls,
			...installedPluginIdsWithStaleVersionBoundRuntimePackages.has(candidate.pluginId) ? { repairReason: "stale-version-bound-runtime" } : {},
			...params.acknowledgeClawHubRisk ? { acknowledgeClawHubRisk: true } : {},
			...params.onClawHubRisk ? { onClawHubRisk: params.onClawHubRisk } : {}
		});
		if (shouldReplaceBrokenOfficialInstall) {
			const installedRecord = installed.records[candidate.pluginId];
			if (installed.records !== previousRecords && removalPath && (!installedRecord?.installPath || !pathsEqual(require_home_dir.resolveUserPath(installedRecord.installPath, env), removalPath))) try {
				await (0, node_fs_promises.rm)(removalPath, {
					recursive: true,
					force: true
				});
			} catch (error) {
				warnings.push(`Failed to remove broken installed plugin "${candidate.pluginId}" at ${removalPath}: ${String(error)}`);
			}
		}
		nextRecords = installed.records;
		changes.push(...installed.changes);
		notices.push(...installed.notices);
		warnings.push(...installed.warnings);
		if (!installed.failedPluginId && installed.records[candidate.pluginId]) repairedPluginIds.add(candidate.pluginId);
		if (installed.failedPluginId) failedPluginIds.add(installed.failedPluginId);
	}
	if (nextRecords !== records) await require_installed_plugin_index_records.writePersistedInstalledPluginIndexInstallRecords(nextRecords, { env });
	else if (params.baselineRecords) await require_installed_plugin_index_records.writePersistedInstalledPluginIndexInstallRecords(nextRecords, { env });
	return {
		changes,
		warnings,
		...notices.length > 0 ? { notices } : {},
		...deferredRepairDetails.length > 0 ? { deferredRepairDetails } : {},
		...repairedPluginIds.size > 0 ? { repairedPluginIds: [...repairedPluginIds].toSorted((left, right) => left.localeCompare(right)) } : {},
		...failedPluginIds.size > 0 ? { failedPluginIds: [...failedPluginIds].toSorted((left, right) => left.localeCompare(right)) } : {},
		records: nextRecords
	};
}
//#endregion
exports.collectConfiguredProviderPluginIds = collectConfiguredProviderPluginIds;
exports.configuredPluginInstallIssueToHealthFinding = configuredPluginInstallIssueToHealthFinding;
exports.configuredPluginInstallIssueToRepairEffect = configuredPluginInstallIssueToRepairEffect;
exports.detectConfiguredPluginInstallHealthIssues = detectConfiguredPluginInstallHealthIssues;
exports.repairMissingConfiguredPluginInstalls = repairMissingConfiguredPluginInstalls;
exports.repairMissingPluginInstallsForIds = repairMissingPluginInstallsForIds;
