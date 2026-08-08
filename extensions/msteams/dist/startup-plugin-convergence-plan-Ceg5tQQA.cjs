const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_official_external_plugin_bundled_catalogs = require("./official-external-plugin-bundled-catalogs-D4053ETf.cjs");
const require_embedding_provider_config = require("./embedding-provider-config-DNHxXwXH.cjs");
const require_gateway_startup_speech_providers = require("./gateway-startup-speech-providers-DjyFgDFT.cjs");
const require_configured_provider_selection_ids = require("./configured-provider-selection-ids-Bp1YWALB.cjs");
const require_configured_runtime_plugin_installs = require("./configured-runtime-plugin-installs-CWK0S1IQ.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/plugins/bundled-plugin-startup-metadata.ts
const DOCTOR_CONTRACT_BASENAMES = ["doctor-contract-api", "contract-api"];
const MODULE_EXTENSIONS = [
	"js",
	"cjs",
	"mjs",
	"ts",
	"cts",
	"mts"
];
function hasDoctorContractArtifact(pluginRoot) {
	return [pluginRoot, node_path.default.join(pluginRoot, "dist")].some((root) => DOCTOR_CONTRACT_BASENAMES.some((basename) => MODULE_EXTENSIONS.some((extension) => node_fs.default.existsSync(node_path.default.join(root, `${basename}.${extension}`)))));
}
/** Resolves one exact bundled id without scanning or materializing the full plugin catalog. */
function inspectBundledPluginStartupMetadata(params) {
	const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir(params.env);
	if (!bundledPluginsDir) return;
	const pluginRoot = node_path.default.join(bundledPluginsDir, params.pluginId);
	const manifest = (0, _openclaw_fs_safe_json.tryReadJsonSync)(node_path.default.join(pluginRoot, "operator.plugin.json"));
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(manifest) || manifest.id !== params.pluginId) return;
	return { hasDoctorContract: hasDoctorContractArtifact(pluginRoot) };
}
//#endregion
//#region src/plugins/official-external-plugin-targets.ts
const STATIC_ENTRIES = require_official_external_plugin_bundled_catalogs.BUNDLED_OFFICIAL_EXTERNAL_PLUGIN_CATALOG_ENTRIES;
function normalizeIds(values) {
	return new Set([...values].map((value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value)).filter((value) => Boolean(value)));
}
function envHasAny(env, names) {
	return names?.some((name) => Boolean(env[name]?.trim())) ?? false;
}
function hasOfficialExternalProviderTarget(params) {
	const providerIds = normalizeIds(params.providerIds);
	return STATIC_ENTRIES.some((entry) => entry.operator?.providers?.some((provider) => envHasAny(params.env, provider.envVars) || [provider.id, ...provider.aliases ?? []].some((providerId) => {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId);
		return normalized ? providerIds.has(normalized) : false;
	})));
}
function hasOfficialExternalContractTarget(params) {
	const providerIds = normalizeIds(params.providerIds);
	if (providerIds.size === 0) return false;
	return STATIC_ENTRIES.some((entry) => entry.operator?.contracts?.[params.contract]?.some((providerId) => {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId);
		return normalized ? providerIds.has(normalized) : false;
	}));
}
function hasOfficialExternalWebContractEnvTarget(params) {
	return STATIC_ENTRIES.some((entry) => {
		const manifest = entry.operator;
		const contractIds = normalizeIds(manifest?.contracts?.[params.contract] ?? []);
		return manifest?.webSearchProviders?.some((provider) => {
			const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider.id);
			return Boolean(providerId && contractIds.has(providerId) && envHasAny(params.env, provider.envVars));
		});
	});
}
function hasOfficialExternalChannelTarget(params) {
	const channels = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.config.channels) ? params.config.channels : void 0;
	return STATIC_ENTRIES.some((entry) => {
		const channel = entry.operator?.channel;
		const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel?.id);
		if (!channelId) return false;
		const channelConfig = channels?.[channelId];
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channelConfig) && channelConfig.enabled !== false || envHasAny(params.env, channel?.envVars);
	});
}
function hasOfficialExternalWebSearchTarget(params) {
	const configuredId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.providerId);
	return STATIC_ENTRIES.some((entry) => entry.operator?.webSearchProviders?.some((provider) => {
		const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider.id);
		return configuredId !== void 0 && providerId === configuredId || envHasAny(params.env, provider.envVars);
	}));
}
//#endregion
//#region src/commands/doctor/shared/startup-plugin-convergence-plan.ts
function hasPotentialPluginConfig(config, env) {
	if (config.plugins?.enabled === false) return false;
	const entries = config.plugins?.entries;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entries)) return false;
	return Object.entries(entries).some(([pluginId, entry]) => {
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && entry.enabled === false) return false;
		return !inspectBundledPluginStartupMetadata({
			pluginId,
			env
		});
	});
}
function collectConfiguredMemoryEmbeddingProviderIds(config) {
	const providerIds = /* @__PURE__ */ new Set();
	const add = (value) => {
		const providerId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
		if (!providerId || providerId === "none" || providerId === "auto") return;
		providerIds.add(providerId);
		const ownerId = require_embedding_provider_config.resolveConfiguredGenericEmbeddingProviderId(providerId, config);
		if (ownerId) providerIds.add(ownerId);
	};
	const defaults = config.agents?.defaults?.memorySearch;
	if (defaults?.enabled !== false) {
		add(defaults?.provider);
		add(defaults?.fallback);
	}
	for (const agent of config.agents?.list ?? []) {
		if (agent.memorySearch?.enabled === false) continue;
		add(agent.memorySearch?.provider ?? defaults?.provider);
		add(agent.memorySearch?.fallback ?? defaults?.fallback);
	}
	return providerIds;
}
function hasConfiguredCapabilityPlugin(config, env) {
	const memoryEmbeddingProviderIds = collectConfiguredMemoryEmbeddingProviderIds(config);
	if (memoryEmbeddingProviderIds.size > 0) {
		if (hasOfficialExternalContractTarget({
			contract: "memoryEmbeddingProviders",
			providerIds: memoryEmbeddingProviderIds
		})) return true;
	}
	if (hasOfficialExternalContractTarget({
		contract: "speechProviders",
		providerIds: require_gateway_startup_speech_providers.collectConfiguredSpeechProviderIds(config)
	})) return true;
	const webFetchProviderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(config.tools?.web?.fetch?.provider);
	if (webFetchProviderId && hasOfficialExternalContractTarget({
		contract: "webFetchProviders",
		providerIds: /* @__PURE__ */ new Set([webFetchProviderId])
	})) return true;
	return hasOfficialExternalWebContractEnvTarget({
		contract: "webFetchProviders",
		env
	});
}
/** True when config or environment state can require a missing managed plugin repair. */
function configMayRequireStartupPluginConvergence(params) {
	if (params.config.plugins?.enabled === false) return false;
	if (hasPotentialPluginConfig(params.config, params.env)) return true;
	if (require_configured_runtime_plugin_installs.collectConfiguredRuntimePluginIds(params.config).length > 0) return true;
	if (hasOfficialExternalProviderTarget({
		providerIds: require_configured_provider_selection_ids.collectConfiguredProviderSelectionIds(params.config),
		env: params.env
	})) return true;
	if (hasOfficialExternalChannelTarget(params)) return true;
	const webSearchProvider = params.config.tools?.web?.search?.provider;
	if (params.config.tools?.web?.search?.enabled !== false && hasOfficialExternalWebSearchTarget({
		providerId: typeof webSearchProvider === "string" ? webSearchProvider : void 0,
		env: params.env
	})) return true;
	return hasConfiguredCapabilityPlugin(params.config, params.env);
}
/** Carries the canonical install-record snapshot into the expensive convergence pass. */
async function planStartupPluginConvergence(params) {
	const installRecords = await require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecords({ env: params.env });
	return {
		required: Object.keys(installRecords).length > 0 || configMayRequireStartupPluginConvergence(params),
		installRecords
	};
}
//#endregion
exports.configMayRequireStartupPluginConvergence = configMayRequireStartupPluginConvergence;
exports.inspectBundledPluginStartupMetadata = inspectBundledPluginStartupMetadata;
exports.planStartupPluginConvergence = planStartupPluginConvergence;
