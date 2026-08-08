require("./rolldown-runtime-u92d-OFm.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_config_env_vars = require("./config-env-vars-Cp6sSeHJ.cjs");
const require_harness_runtimes = require("./harness-runtimes-bhXUB0Pb.cjs");
const require_config_presence = require("./config-presence-iIICLITG.cjs");
const require_gateway_startup_speech_providers = require("./gateway-startup-speech-providers-DjyFgDFT.cjs");
const require_web_search_install_catalog = require("./web-search-install-catalog-DYHiCZZj.cjs");
const require_channel_configured = require("./channel-configured-CF9ewAnb.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
const require_object = require("./object-Be4AQnVV.cjs");
const require_update_phase = require("./update-phase-noJPNQLY.cjs");
const require_missing_configured_plugin_install = require("./missing-configured-plugin-install-BXc1994T.cjs");
const require_update_doctor_result = require("./update-doctor-result-orYzSBLp.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor/shared/release-configured-plugin-installs.ts
const CONFIGURED_PLUGIN_INSTALL_RELEASE_VERSION = "2026.5.2-beta.1";
const AGENT_HARNESS_RUNTIME_PLUGIN_IDS = { codex: "codex" };
function isPluginsGloballyDisabled(cfg) {
	return cfg.plugins?.enabled === false;
}
function isDenied(cfg, pluginId) {
	const deny = cfg.plugins?.deny;
	return Array.isArray(deny) && deny.includes(pluginId);
}
function collectBlockedPluginIds(cfg) {
	const ids = /* @__PURE__ */ new Set();
	const deny = cfg.plugins?.deny;
	if (Array.isArray(deny)) for (const pluginId of deny) {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(pluginId);
		if (normalized) ids.add(normalized);
	}
	const entries = require_object.asObjectRecord(cfg.plugins?.entries);
	for (const [pluginId, entry] of Object.entries(entries ?? {})) if (require_object.asObjectRecord(entry)?.enabled === false && pluginId.trim()) ids.add(pluginId.trim());
	return [...ids].toSorted((left, right) => left.localeCompare(right));
}
function isPluginEntryDisabled(cfg, pluginId) {
	return cfg.plugins?.entries?.[pluginId]?.enabled === false;
}
function isChannelDisabled(cfg, channelId) {
	return require_object.asObjectRecord(require_object.asObjectRecord(cfg.channels)?.[channelId])?.enabled === false;
}
function isDisabled(cfg, pluginId) {
	if (isPluginEntryDisabled(cfg, pluginId)) return true;
	const channelId = require_ids.normalizeChatChannelId(pluginId);
	return channelId ? isChannelDisabled(cfg, channelId) : false;
}
function hasMaterialPluginEntry(entry) {
	const record = require_object.asObjectRecord(entry);
	if (!record) return false;
	return record.enabled === true || require_object.asObjectRecord(record.config) !== null || require_object.asObjectRecord(record.hooks) !== null || require_object.asObjectRecord(record.subagent) !== null || record.apiKey !== void 0 || record.env !== void 0;
}
function collectMaterialPluginEntryIds(cfg) {
	const entries = require_object.asObjectRecord(cfg.plugins?.entries);
	if (!entries) return [];
	return Object.entries(entries).filter(([, entry]) => hasMaterialPluginEntry(entry)).map(([pluginId]) => pluginId.trim()).filter((pluginId) => pluginId);
}
function collectSlotPluginIds(cfg) {
	const slots = require_object.asObjectRecord(cfg.plugins?.slots);
	return ["memory", "contextEngine"].map((key) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(slots?.[key])).filter((pluginId) => typeof pluginId === "string" && pluginId.toLowerCase() !== "none");
}
function collectConfiguredChannelIds(cfg, env) {
	const ids = /* @__PURE__ */ new Set();
	const channels = require_object.asObjectRecord(cfg.channels);
	if (channels) for (const [channelId, value] of Object.entries(channels)) {
		if (channelId === "defaults" || channelId === "modelByChannel" || !channelId.trim()) continue;
		const entry = require_object.asObjectRecord(value);
		if (entry?.enabled === false) continue;
		if (entry?.enabled === true || Object.keys(entry ?? {}).some((key) => key !== "enabled")) ids.add(channelId.trim());
	}
	for (const signal of require_config_presence.listPotentialConfiguredChannelPresenceSignals(cfg, env, { includePersistedAuthState: false })) {
		const channelId = require_ids.normalizeChatChannelId(signal.channelId) ?? signal.channelId;
		if (!isChannelDisabled(cfg, channelId) && require_channel_configured.isChannelConfigured(cfg, channelId, env)) ids.add(channelId);
	}
	return [...ids].toSorted((left, right) => left.localeCompare(right));
}
function collectAgentHarnessRuntimePluginIds(cfg, _env) {
	return require_harness_runtimes.collectConfiguredAgentHarnessRuntimes(cfg).map((runtime) => AGENT_HARNESS_RUNTIME_PLUGIN_IDS[runtime]).filter((pluginId) => Boolean(pluginId)).toSorted((left, right) => left.localeCompare(right));
}
function collectWebSearchPluginIds(cfg) {
	if (cfg.tools?.web?.search?.enabled === false) return [];
	const providerId = cfg.tools?.web?.search?.provider;
	if (typeof providerId !== "string") return [];
	const entry = require_web_search_install_catalog.resolveWebSearchInstallCatalogEntry({ providerId });
	return entry?.pluginId ? [entry.pluginId] : [];
}
function collectEnvWebSearchPluginIds(cfg, env) {
	if (cfg.tools?.web?.search?.enabled === false) return [];
	return require_web_search_install_catalog.resolveWebSearchInstallCatalogEntriesForEnv(env).map((entry) => entry.pluginId);
}
function collectWebFetchPluginIds(cfg) {
	const webFetch = cfg.tools?.web?.fetch;
	if (webFetch?.enabled === false) return [];
	const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(webFetch?.provider)?.toLowerCase();
	if (!providerId) return [];
	return require_official_external_plugin_catalog.resolveOfficialExternalProviderContractPluginIds({
		contract: "webFetchProviders",
		providerIds: /* @__PURE__ */ new Set([providerId])
	});
}
function collectEnvWebFetchPluginIds(cfg, env) {
	if (cfg.tools?.web?.fetch?.enabled === false) return [];
	return require_official_external_plugin_catalog.resolveOfficialExternalWebProviderContractPluginIdsForEnv({
		contract: "webFetchProviders",
		env
	});
}
function collectSpeechPluginIds(cfg) {
	return require_official_external_plugin_catalog.resolveOfficialExternalProviderContractPluginIds({
		contract: "speechProviders",
		providerIds: require_gateway_startup_speech_providers.collectConfiguredSpeechProviderIds(cfg)
	});
}
function collectAcpRuntimePluginIds(cfg) {
	const acp = require_object.asObjectRecord(cfg.acp);
	if (!acp) return [];
	const backend = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(acp.backend)?.toLowerCase() ?? "";
	if (!(acp.enabled === true || require_object.asObjectRecord(acp.dispatch)?.enabled === true || backend === "acpx") || backend && backend !== "acpx") return [];
	return ["acpx"];
}
function collectAllowOnlyOfficialPluginIds(cfg) {
	const allow = cfg.plugins?.allow;
	if (!Array.isArray(allow) || allow.length === 0) return [];
	const materialEntryIds = new Set(collectMaterialPluginEntryIds(cfg).map((id) => id.toLowerCase()));
	const ids = [];
	for (const rawPluginId of allow) {
		const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(rawPluginId);
		if (!pluginId || materialEntryIds.has(pluginId.toLowerCase())) continue;
		if (require_official_external_plugin_catalog.getOfficialExternalPluginCatalogEntry(pluginId)) ids.push(pluginId);
	}
	return ids;
}
function addEligiblePluginId(cfg, pluginIds, pluginId) {
	const normalized = pluginId.trim();
	if (!normalized || isDenied(cfg, normalized) || isDisabled(cfg, normalized)) return;
	pluginIds.add(normalized);
}
/** Return true when this config has not yet crossed the configured-plugin install release gate. */
function shouldRunConfiguredPluginInstallReleaseStep(params) {
	const releaseVersion = params.releaseVersion ?? CONFIGURED_PLUGIN_INSTALL_RELEASE_VERSION;
	const currentComparedToRelease = require_config_env_vars.compareOperatorVersions(params.currentVersion ?? require_version.VERSION, releaseVersion);
	if (currentComparedToRelease === null || currentComparedToRelease < 0) return false;
	const touchedComparedToRelease = require_config_env_vars.compareOperatorVersions(params.touchedVersion, releaseVersion);
	return touchedComparedToRelease === null || touchedComparedToRelease < 0;
}
/** Collect plugin/channel ids implied by config for the release install backfill step. */
function collectReleaseConfiguredPluginIds(params) {
	const env = params.env ?? process.env;
	const pluginIds = /* @__PURE__ */ new Set();
	const channelIds = /* @__PURE__ */ new Set();
	if (isPluginsGloballyDisabled(params.cfg)) return {
		pluginIds: [],
		channelIds: []
	};
	for (const candidate of require_plugin_auto_enable.detectPluginAutoEnableCandidates({
		config: params.cfg,
		env
	})) addEligiblePluginId(params.cfg, pluginIds, candidate.pluginId);
	for (const pluginId of collectMaterialPluginEntryIds(params.cfg)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectSlotPluginIds(params.cfg)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of require_missing_configured_plugin_install.collectConfiguredProviderPluginIds({
		cfg: params.cfg,
		env
	})) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectAgentHarnessRuntimePluginIds(params.cfg, env)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectWebSearchPluginIds(params.cfg)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectEnvWebSearchPluginIds(params.cfg, env)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectWebFetchPluginIds(params.cfg)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectEnvWebFetchPluginIds(params.cfg, env)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectSpeechPluginIds(params.cfg)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectAcpRuntimePluginIds(params.cfg)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const pluginId of collectAllowOnlyOfficialPluginIds(params.cfg)) addEligiblePluginId(params.cfg, pluginIds, pluginId);
	for (const channelId of collectConfiguredChannelIds(params.cfg, env)) if (!isChannelDisabled(params.cfg, channelId) && !isDenied(params.cfg, channelId) && !isPluginEntryDisabled(params.cfg, channelId)) channelIds.add(channelId);
	return {
		pluginIds: [...pluginIds].toSorted((left, right) => left.localeCompare(right)),
		channelIds: [...channelIds].toSorted((left, right) => left.localeCompare(right))
	};
}
/** Run the configured-plugin install release backfill when the config still needs it. */
async function maybeRunConfiguredPluginInstallReleaseStep(params) {
	const env = params.env ?? process.env;
	const updateInProgress = require_update_phase.shouldDeferConfiguredPluginInstallRepair(env);
	const configured = collectReleaseConfiguredPluginIds({
		cfg: params.cfg,
		env
	});
	if (!shouldRunConfiguredPluginInstallReleaseStep({
		currentVersion: params.currentVersion,
		touchedVersion: params.touchedVersion
	})) {
		if (configured.pluginIds.length === 0 && configured.channelIds.length === 0) return {
			changes: [],
			warnings: [],
			completed: false,
			touchedConfig: false
		};
		const repaired = await require_missing_configured_plugin_install.repairMissingPluginInstallsForIds({
			cfg: params.cfg,
			pluginIds: configured.pluginIds,
			channelIds: configured.channelIds,
			blockedPluginIds: collectBlockedPluginIds(params.cfg),
			env
		});
		const warnings = [...repaired.warnings, ...repaired.notices ?? []];
		const postInstallDoctorResult = createPostInstallDoctorResultForDeferredRepair({
			updateInProgress,
			details: repaired.deferredRepairDetails ?? [],
			warnings: repaired.warnings
		});
		return {
			changes: repaired.changes,
			warnings,
			completed: repaired.warnings.length === 0,
			touchedConfig: false,
			...postInstallDoctorResult ? { postInstallDoctorResult } : {}
		};
	}
	if (configured.pluginIds.length === 0 && configured.channelIds.length === 0) return {
		changes: [],
		warnings: [],
		completed: true,
		touchedConfig: !updateInProgress
	};
	const repaired = await require_missing_configured_plugin_install.repairMissingPluginInstallsForIds({
		cfg: params.cfg,
		pluginIds: configured.pluginIds,
		channelIds: configured.channelIds,
		blockedPluginIds: collectBlockedPluginIds(params.cfg),
		env
	});
	const completed = repaired.warnings.length === 0 && !updateInProgress;
	const warnings = [...repaired.warnings, ...repaired.notices ?? []];
	const postInstallDoctorResult = createPostInstallDoctorResultForDeferredRepair({
		updateInProgress,
		details: repaired.deferredRepairDetails ?? [],
		warnings: repaired.warnings
	});
	return {
		changes: repaired.changes,
		warnings,
		completed,
		touchedConfig: completed,
		...postInstallDoctorResult ? { postInstallDoctorResult } : {}
	};
}
function createPostInstallDoctorResultForDeferredRepair(params) {
	if (!params.updateInProgress || params.warnings.length > 0 || params.details.length === 0) return;
	return require_update_doctor_result.createDeferredConfiguredPluginRepairDoctorResult(params.details);
}
//#endregion
exports.maybeRunConfiguredPluginInstallReleaseStep = maybeRunConfiguredPluginInstallReleaseStep;
