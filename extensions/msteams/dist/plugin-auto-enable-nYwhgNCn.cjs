const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
const require_registry = require("./registry-BWWaGAnQ.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_harness_runtimes = require("./harness-runtimes-bhXUB0Pb.cjs");
const require_config_presence = require("./config-presence-iIICLITG.cjs");
const require_gateway_startup_speech_providers = require("./gateway-startup-speech-providers-DjyFgDFT.cjs");
const require_worker_provider_registry = require("./worker-provider-registry-CsuKJchR.cjs");
const require_plugins_allowlist = require("./plugins-allowlist-TYOT6QRc.cjs");
const require_channel_configured = require("./channel-configured-CF9ewAnb.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_setup_registry = require("./setup-registry-bM3fH6vu.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_configured_model_refs = require("@gabrielvfonseca/model-catalog-core/configured-model-refs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/config/plugin-auto-enable.prefer-over.ts
const ENV_CATALOG_PATHS = ["OPERATOR_PLUGIN_CATALOG_PATHS", "OPERATOR_MPM_CATALOG_PATHS"];
function splitEnvPaths(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
	if (!trimmed) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(trimmed.split(/[;,]/g).flatMap((chunk) => chunk.split(node_path.default.delimiter)));
}
function resolveExternalCatalogPaths(env) {
	for (const key of ENV_CATALOG_PATHS) {
		const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env[key]);
		if (raw) return splitEnvPaths(raw);
	}
	const configDir = require_utils.resolveConfigDir(env);
	return [
		node_path.default.join(configDir, "mpm", "plugins.json"),
		node_path.default.join(configDir, "mpm", "catalog.json"),
		node_path.default.join(configDir, "plugins", "catalog.json")
	];
}
function parseExternalCatalogChannelEntries(raw) {
	const list = (() => {
		if (Array.isArray(raw)) return raw;
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return [];
		const entries = raw.entries ?? raw.packages ?? raw.plugins;
		return Array.isArray(entries) ? entries : [];
	})();
	const channels = [];
	for (const entry of list) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.operator) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.operator.channel)) continue;
		const channel = entry.operator.channel;
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(channel.id) ?? "";
		if (!id) continue;
		const preferOver = Array.isArray(channel.preferOver) ? channel.preferOver.filter((value) => typeof value === "string") : [];
		channels.push({
			id,
			preferOver
		});
	}
	return channels;
}
function resolveExternalCatalogPreferOver(channelId, env) {
	for (const rawPath of resolveExternalCatalogPaths(env)) {
		const resolved = require_home_dir.resolveUserPath(rawPath, env);
		if (!node_fs.default.existsSync(resolved)) continue;
		try {
			const channel = parseExternalCatalogChannelEntries(JSON.parse(node_fs.default.readFileSync(resolved, "utf-8"))).find((entry) => entry.id === channelId);
			if (channel) return channel.preferOver;
		} catch {}
	}
	return [];
}
function resolveBuiltInChannelPreferOver(channelId) {
	const builtInChannelId = require_ids.normalizeChatChannelId(channelId);
	if (!builtInChannelId) return [];
	return require_registry.findChatChannelMeta(builtInChannelId)?.preferOver ?? [];
}
function resolvePreferredOverIds(candidate, env, registry) {
	const channelId = candidate.kind === "channel-configured" ? candidate.channelId : candidate.pluginId;
	const installedPlugin = registry.plugins.find((record) => record.id === candidate.pluginId);
	const manifestChannelPreferOver = installedPlugin?.channelConfigs?.[channelId]?.preferOver;
	if (manifestChannelPreferOver?.length) return [...manifestChannelPreferOver];
	const installedChannelMeta = installedPlugin?.channelCatalogMeta;
	if (installedChannelMeta?.preferOver?.length) return [...installedChannelMeta.preferOver];
	const builtInChannelPreferOver = resolveBuiltInChannelPreferOver(channelId);
	if (builtInChannelPreferOver.length) return [...builtInChannelPreferOver];
	return resolveExternalCatalogPreferOver(channelId, env);
}
function getPluginAutoEnableCandidateCacheKey(candidate) {
	return `${candidate.pluginId}:${candidate.kind === "channel-configured" ? candidate.channelId : candidate.pluginId}`;
}
function shouldSkipPreferredPluginAutoEnable(params) {
	const getPreferredOverIds = (candidate) => {
		const cacheKey = getPluginAutoEnableCandidateCacheKey(candidate);
		const cached = params.preferOverCache.get(cacheKey);
		if (cached) return cached;
		const resolved = resolvePreferredOverIds(candidate, params.env, params.registry);
		params.preferOverCache.set(cacheKey, resolved);
		return resolved;
	};
	for (const other of params.configured) {
		if (other.pluginId === params.entry.pluginId) continue;
		if (params.isPluginDenied(params.config, other.pluginId) || params.isPluginExplicitlyDisabled(params.config, other.pluginId)) continue;
		if (getPreferredOverIds(other).includes(params.entry.pluginId)) return true;
	}
	return false;
}
//#endregion
//#region src/config/plugin-auto-enable.shared.ts
const EMPTY_PLUGIN_MANIFEST_REGISTRY = {
	plugins: [],
	diagnostics: []
};
function resolveAutoEnableProviderPluginIds(registry) {
	const entries = /* @__PURE__ */ new Map();
	for (const plugin of registry.plugins) for (const providerId of plugin.autoEnableWhenConfiguredProviders ?? []) if (!entries.has(providerId)) entries.set(providerId, plugin.id);
	return Object.fromEntries(entries);
}
function canReuseUnscopedCurrentPluginMetadataSnapshot(config) {
	return require_config_state.normalizePluginsConfig(config.plugins).loadPaths.length === 0;
}
function extractProviderFromModelRef(value) {
	const trimmed = value.trim();
	const slash = trimmed.indexOf("/");
	if (slash <= 0) return null;
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(trimmed.slice(0, slash));
}
function hasConfiguredEmbeddedHarnessRuntime(cfg, _env) {
	return require_harness_runtimes.collectConfiguredAgentHarnessRuntimes(cfg).length > 0;
}
function resolveAgentHarnessOwnerPluginIds(registry, runtime) {
	const normalizedRuntime = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(runtime);
	if (!normalizedRuntime) return [];
	return registry.plugins.filter((plugin) => [...plugin.activation?.onAgentHarnesses ?? [], ...plugin.cliBackends ?? []].some((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry) === normalizedRuntime)).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
function isProviderConfigured(cfg, providerId) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	const profiles = cfg.auth?.profiles;
	if (profiles && typeof profiles === "object") for (const profile of Object.values(profiles)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(profile)) continue;
		if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(profile.provider ?? "") === normalized) return true;
	}
	const providerConfig = cfg.models?.providers;
	if (providerConfig && typeof providerConfig === "object") {
		for (const key of Object.keys(providerConfig)) if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(key) === normalized) return true;
	}
	for (const { value: ref } of (0, _gabrielvfonseca_model_catalog_core_configured_model_refs.collectConfiguredModelRefs)(cfg, { includeChannelModelOverrides: false })) {
		const provider = extractProviderFromModelRef(ref);
		if (provider && provider === normalized) return true;
	}
	return false;
}
function hasPluginOwnedWebSearchConfig(cfg, pluginId) {
	const pluginConfig = cfg.plugins?.entries?.[pluginId]?.config;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig.webSearch);
}
function hasPluginOwnedWebFetchConfig(cfg, pluginId) {
	const pluginConfig = cfg.plugins?.entries?.[pluginId]?.config;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig.webFetch);
}
function resolvePluginOwnedToolConfigKeys(plugin) {
	if ((plugin.contracts?.tools?.length ?? 0) === 0) return [];
	const properties = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(plugin.configSchema) ? plugin.configSchema.properties : void 0;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(properties)) return [];
	return Object.keys(properties).filter((key) => key !== "webSearch" && key !== "webFetch");
}
function hasPluginOwnedToolConfig(cfg, plugin) {
	const pluginConfig = cfg.plugins?.entries?.[plugin.id]?.config;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig)) return false;
	return resolvePluginOwnedToolConfigKeys(plugin).some((key) => pluginConfig[key] !== void 0);
}
function resolveProviderPluginsWithOwnedWebSearch(registry) {
	return registry.plugins.filter((plugin) => (plugin.providers?.length ?? 0) > 0).filter((plugin) => (plugin.contracts?.webSearchProviders?.length ?? 0) > 0);
}
function resolveProviderPluginsWithOwnedWebFetch(registry) {
	return registry.plugins.filter((plugin) => (plugin.contracts?.webFetchProviders?.length ?? 0) > 0);
}
function resolvePluginIdsForConfiguredSpeechProvider(providerId, registry) {
	const normalizedProviderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId);
	if (!normalizedProviderId) return [];
	return registry.plugins.filter((plugin) => (plugin.contracts?.speechProviders ?? []).some((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(candidate) === normalizedProviderId)).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
function resolvePluginsWithOwnedToolConfig(registry) {
	return registry.plugins.filter((plugin) => (plugin.contracts?.tools?.length ?? 0) > 0);
}
function resolvePluginIdForConfiguredWebFetchProvider(providerId, registry) {
	const normalizedProviderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId);
	if (!normalizedProviderId) return;
	return registry.plugins.find((plugin) => plugin.origin === "bundled" && (plugin.contracts?.webFetchProviders ?? []).some((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(candidate) === normalizedProviderId))?.id;
}
function resolvePluginIdForConfiguredWebSearchProvider(providerId, registry) {
	const normalizedProviderId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId);
	if (!normalizedProviderId) return;
	return registry.plugins.find((plugin) => (plugin.contracts?.webSearchProviders ?? []).some((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(candidate) === normalizedProviderId))?.id;
}
function normalizeManifestChannelId(channelId) {
	return require_ids.normalizeChatChannelId(channelId) ?? channelId;
}
function getManifestChannelPreferOver(plugin, channelId) {
	return plugin.channelConfigs?.[channelId]?.preferOver ?? [];
}
function collectPluginIdsForConfiguredChannel(channelId, registry) {
	const normalizedChannelId = normalizeManifestChannelId(channelId);
	const builtInId = require_ids.normalizeChatChannelId(normalizedChannelId);
	const claims = [];
	for (const record of registry.plugins) if ((record.channels ?? []).some((id) => normalizeManifestChannelId(id) === normalizedChannelId)) claims.push({
		plugin: record,
		preferOver: getManifestChannelPreferOver(record, normalizedChannelId)
	});
	if (claims.length === 0) return builtInId ? [builtInId] : [];
	const claimIds = new Set(claims.map((claim) => claim.plugin.id));
	if (builtInId) claimIds.add(builtInId);
	const preferredIds = /* @__PURE__ */ new Set();
	for (const claim of claims) for (const preferredOverId of claim.preferOver) if (claimIds.has(preferredOverId)) {
		preferredIds.add(claim.plugin.id);
		preferredIds.add(preferredOverId);
	}
	if (preferredIds.size > 0) return [...preferredIds].toSorted((left, right) => left.localeCompare(right));
	return [claims[0]?.plugin.id ?? builtInId ?? normalizedChannelId];
}
function collectConfiguredChannelIds(cfg, env, discovery) {
	const configuredStateChannelIds = new Set(require_channel_configured.listBundledChannelIdsWithConfiguredState(discovery));
	return require_config_presence.listPotentialConfiguredChannelPresenceSignals(cfg, env, {
		includePersistedAuthState: false,
		discovery
	}).map((signal) => ({
		source: signal.source,
		channelId: require_ids.normalizeChatChannelId(signal.channelId) ?? signal.channelId
	})).filter(({ channelId, source }) => isAutoEnableConfiguredChannelSignal({
		cfg,
		env,
		channelId,
		source,
		configuredStateChannelIds,
		discovery
	})).map(({ channelId }) => channelId);
}
function isAutoEnableConfiguredChannelSignal(params) {
	if (params.source === "env" && params.configuredStateChannelIds.has(params.channelId) && !require_channel_configured.hasBundledChannelConfiguredState({
		channelId: params.channelId,
		cfg: params.cfg,
		env: params.env,
		discovery: params.discovery
	})) return false;
	return require_channel_configured.isChannelConfigured(params.cfg, params.channelId, params.env);
}
function hasConfiguredWebSearchPluginEntry(cfg) {
	const entries = cfg.plugins?.entries;
	return Boolean(entries) && typeof entries === "object" && Object.values(entries).some((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.config) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.config.webSearch));
}
function hasConfiguredWebSearchProviderSelection(cfg) {
	const provider = cfg.tools?.web?.search?.provider;
	return cfg.tools?.web?.search?.enabled !== false && typeof provider === "string" && Boolean(provider.trim());
}
function hasConfiguredWebFetchPluginEntry(cfg) {
	const entries = cfg.plugins?.entries;
	return Boolean(entries) && typeof entries === "object" && Object.values(entries).some((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.config) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.config.webFetch));
}
function hasConfiguredSpeechProviderSelection(cfg) {
	return require_gateway_startup_speech_providers.collectConfiguredSpeechProviderIds(cfg).size > 0;
}
function hasConfiguredPluginConfigEntry(cfg) {
	const entries = cfg.plugins?.entries;
	return Boolean(entries) && typeof entries === "object" && Object.values(entries).some((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.config));
}
function listContainsNormalized(value, expected) {
	return Array.isArray(value) && value.some((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry) === expected);
}
function toolPolicyReferencesBrowser(value) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && (listContainsNormalized(value.allow, "browser") || listContainsNormalized(value.alsoAllow, "browser"));
}
function hasBrowserToolReference(cfg) {
	if (toolPolicyReferencesBrowser(cfg.tools)) return true;
	const agentList = cfg.agents?.list;
	return Array.isArray(agentList) ? agentList.some((entry) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && toolPolicyReferencesBrowser(entry.tools)) : false;
}
function collectConfiguredPluginEntryIds(cfg) {
	const entries = cfg.plugins?.entries;
	if (!entries || typeof entries !== "object") return [];
	return Object.keys(entries).map((pluginId) => pluginId.trim()).filter((pluginId) => pluginId && !isPluginEntryExplicitlyDisabled(cfg, pluginId));
}
function hasOwnPluginEntry(cfg, pluginId) {
	const entries = cfg.plugins?.entries;
	return Boolean(entries) && typeof entries === "object" && Object.hasOwn(entries, pluginId);
}
function isPluginEntryExplicitlyDisabled(cfg, pluginId) {
	return cfg.plugins?.entries?.[pluginId]?.enabled === false;
}
function hasNonDisabledPluginEntry(cfg, pluginId) {
	if (!hasOwnPluginEntry(cfg, pluginId)) return false;
	return !isPluginEntryExplicitlyDisabled(cfg, pluginId);
}
function hasBrowserSetupAutoEnableRelevantConfig(cfg) {
	if (cfg.browser?.enabled === false || isPluginEntryExplicitlyDisabled(cfg, "browser")) return false;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.browser)) return true;
	if (hasNonDisabledPluginEntry(cfg, "browser")) return true;
	return hasBrowserToolReference(cfg);
}
function hasAcpxSetupAutoEnableRelevantConfig(cfg) {
	if (isPluginEntryExplicitlyDisabled(cfg, "acpx")) return false;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.acp)) return false;
	const backend = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(cfg.acp.backend);
	return (cfg.acp.enabled === true || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.acp.dispatch) && cfg.acp.dispatch.enabled === true || backend === "acpx") && (!backend || backend === "acpx");
}
function hasXaiSetupAutoEnableRelevantConfig(cfg) {
	if (isPluginEntryExplicitlyDisabled(cfg, "xai")) return false;
	const pluginConfig = cfg.plugins?.entries?.xai?.config;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig) && ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig.xSearch) || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig.codeExecution)) || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.tools?.web) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.tools.web.x_search);
}
function resolveRelevantSetupAutoEnablePluginIds(cfg) {
	const pluginIds = new Set(collectConfiguredPluginEntryIds(cfg));
	if (hasBrowserSetupAutoEnableRelevantConfig(cfg)) pluginIds.add("browser");
	if (hasAcpxSetupAutoEnableRelevantConfig(cfg)) pluginIds.add("acpx");
	if (hasXaiSetupAutoEnableRelevantConfig(cfg)) pluginIds.add("xai");
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
function hasSetupAutoEnableRelevantConfig(cfg) {
	return hasBrowserSetupAutoEnableRelevantConfig(cfg) || hasAcpxSetupAutoEnableRelevantConfig(cfg) || hasXaiSetupAutoEnableRelevantConfig(cfg) || hasConfiguredPluginConfigEntry(cfg);
}
function hasPluginEntries(cfg) {
	const entries = cfg.plugins?.entries;
	return Boolean(entries) && typeof entries === "object" && Object.keys(entries).length > 0;
}
function hasPluginAllowlistWithMaterialEntries(cfg) {
	if (!Array.isArray(cfg.plugins?.allow) || cfg.plugins.allow.length === 0 || !hasPluginEntries(cfg)) return false;
	const entries = cfg.plugins?.entries;
	if (!entries || typeof entries !== "object") return false;
	return Object.values(entries).some(hasMaterialPluginEntryConfig);
}
function hasConfiguredProviderModelOrHarness(cfg, env) {
	if (cfg.auth?.profiles && Object.keys(cfg.auth.profiles).length > 0) return true;
	if (cfg.models?.providers && Object.keys(cfg.models.providers).length > 0) return true;
	if ((0, _gabrielvfonseca_model_catalog_core_configured_model_refs.collectConfiguredModelRefs)(cfg, { includeChannelModelOverrides: false }).length > 0) return true;
	return hasConfiguredEmbeddedHarnessRuntime(cfg, env);
}
function arePluginsGloballyDisabled(cfg) {
	return cfg.plugins?.enabled === false;
}
function configMayNeedPluginManifestRegistry(cfg, env) {
	if (arePluginsGloballyDisabled(cfg)) return false;
	if (hasPluginAllowlistWithMaterialEntries(cfg)) return true;
	if (hasConfiguredPluginConfigEntry(cfg)) return true;
	if (hasConfiguredProviderModelOrHarness(cfg, env)) return true;
	if (hasConfiguredSpeechProviderSelection(cfg)) return true;
	if (require_worker_provider_registry.collectConfiguredWorkerProviderIds(cfg).length > 0) return true;
	if (hasConfiguredWebSearchProviderSelection(cfg)) return true;
	const configuredChannels = cfg.channels;
	if (!configuredChannels || typeof configuredChannels !== "object") return false;
	for (const key of Object.keys(configuredChannels)) {
		if (key === "defaults" || key === "modelByChannel") continue;
		return true;
	}
	return false;
}
function configMayNeedPluginAutoEnable(cfg, env) {
	return resolvePluginAutoEnableReadiness(cfg, env).mayNeedAutoEnable;
}
function resolvePluginAutoEnableReadiness(cfg, env, discovery) {
	if (arePluginsGloballyDisabled(cfg)) return {
		mayNeedAutoEnable: false,
		configuredChannelIds: []
	};
	if (hasPluginAllowlistWithMaterialEntries(cfg)) return {
		mayNeedAutoEnable: true,
		configuredChannelIds: []
	};
	if (hasConfiguredPluginConfigEntry(cfg)) return {
		mayNeedAutoEnable: true,
		configuredChannelIds: []
	};
	const configuredChannelIds = collectConfiguredChannelIds(cfg, env, discovery);
	if (configuredChannelIds.length > 0) return {
		mayNeedAutoEnable: true,
		configuredChannelIds
	};
	if (hasConfiguredProviderModelOrHarness(cfg, env)) return {
		mayNeedAutoEnable: true,
		configuredChannelIds
	};
	if (hasConfiguredSpeechProviderSelection(cfg)) return {
		mayNeedAutoEnable: true,
		configuredChannelIds
	};
	if (require_worker_provider_registry.collectConfiguredWorkerProviderIds(cfg).length > 0) return {
		mayNeedAutoEnable: true,
		configuredChannelIds
	};
	if (hasConfiguredWebSearchProviderSelection(cfg) || hasConfiguredWebSearchPluginEntry(cfg) || hasConfiguredWebFetchPluginEntry(cfg)) return {
		mayNeedAutoEnable: true,
		configuredChannelIds
	};
	if (!hasSetupAutoEnableRelevantConfig(cfg)) return {
		mayNeedAutoEnable: false,
		configuredChannelIds
	};
	return {
		mayNeedAutoEnable: require_setup_registry.resolvePluginSetupAutoEnableReasons({
			config: cfg,
			env,
			pluginIds: resolveRelevantSetupAutoEnablePluginIds(cfg)
		}).length > 0,
		configuredChannelIds
	};
}
function resolvePluginAutoEnableCandidateReason(candidate) {
	switch (candidate.kind) {
		case "channel-configured": return `${candidate.channelId} configured`;
		case "provider-auth-configured": return `${candidate.providerId} auth configured`;
		case "provider-model-configured": return `${candidate.modelRef} model configured`;
		case "speech-provider-selected": return `${candidate.providerId} speech provider selected`;
		case "worker-provider-selected": return `${candidate.providerId} worker provider selected`;
		case "agent-harness-runtime-configured": return `${candidate.runtime} agent runtime configured`;
		case "web-search-provider-selected": return `${candidate.providerId} web search provider selected`;
		case "web-fetch-provider-selected": return `${candidate.providerId} web fetch provider selected`;
		case "plugin-web-search-configured": return `${candidate.pluginId} web search configured`;
		case "plugin-web-fetch-configured": return `${candidate.pluginId} web fetch configured`;
		case "plugin-tool-configured": return `${candidate.pluginId} tool configured`;
		case "configured-plugin-repaired": return `${candidate.pluginId} installed for existing configuration`;
		case "setup-auto-enable": return candidate.reason;
	}
	throw new Error("Unsupported plugin auto-enable candidate");
}
function resolveConfiguredPluginAutoEnableCandidates(params) {
	const changes = [];
	for (const channelId of params.configuredChannelIds ?? collectConfiguredChannelIds(params.config, params.env)) for (const pluginId of collectPluginIdsForConfiguredChannel(channelId, params.registry)) changes.push({
		pluginId,
		kind: "channel-configured",
		channelId
	});
	for (const [providerId, pluginId] of Object.entries(resolveAutoEnableProviderPluginIds(params.registry))) if (isProviderConfigured(params.config, providerId)) changes.push({
		pluginId,
		kind: "provider-auth-configured",
		providerId
	});
	for (const { value: modelRef } of (0, _gabrielvfonseca_model_catalog_core_configured_model_refs.collectConfiguredModelRefs)(params.config, { includeChannelModelOverrides: false })) {
		const owningPluginIds = require_providers.resolveOwningPluginIdsForModelRef({
			model: modelRef,
			config: params.config,
			env: params.env,
			manifestRegistry: params.registry
		});
		if (owningPluginIds?.length === 1) changes.push({
			pluginId: (0, _gabrielvfonseca_normalization_core.expectDefined)(owningPluginIds[0], "owning plugin ids entry at 0"),
			kind: "provider-model-configured",
			modelRef
		});
	}
	for (const providerId of require_gateway_startup_speech_providers.collectConfiguredSpeechProviderIds(params.config)) for (const pluginId of resolvePluginIdsForConfiguredSpeechProvider(providerId, params.registry)) changes.push({
		pluginId,
		kind: "speech-provider-selected",
		providerId
	});
	for (const { pluginId, providerId } of require_worker_provider_registry.listBundledWorkerProviderOwners(params.registry, require_worker_provider_registry.collectConfiguredWorkerProviderIds(params.config))) changes.push({
		pluginId,
		kind: "worker-provider-selected",
		providerId
	});
	for (const runtime of require_harness_runtimes.collectConfiguredAgentHarnessRuntimes(params.config)) {
		const pluginIds = resolveAgentHarnessOwnerPluginIds(params.registry, runtime);
		for (const pluginId of pluginIds) changes.push({
			pluginId,
			kind: "agent-harness-runtime-configured",
			runtime
		});
	}
	const webSearchConfig = params.config.tools?.web?.search;
	const webSearchProvider = webSearchConfig?.enabled !== false && typeof webSearchConfig?.provider === "string" ? webSearchConfig.provider : void 0;
	const webSearchPluginId = resolvePluginIdForConfiguredWebSearchProvider(webSearchProvider, params.registry);
	if (webSearchPluginId) changes.push({
		pluginId: webSearchPluginId,
		kind: "web-search-provider-selected",
		providerId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(webSearchProvider) ?? ""
	});
	const webFetchProvider = typeof params.config.tools?.web?.fetch?.provider === "string" ? params.config.tools.web.fetch.provider : void 0;
	const webFetchPluginId = resolvePluginIdForConfiguredWebFetchProvider(webFetchProvider, params.registry);
	if (webFetchPluginId) changes.push({
		pluginId: webFetchPluginId,
		kind: "web-fetch-provider-selected",
		providerId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(webFetchProvider) ?? ""
	});
	for (const plugin of resolveProviderPluginsWithOwnedWebSearch(params.registry)) {
		const pluginId = plugin.id;
		if (hasPluginOwnedWebSearchConfig(params.config, pluginId)) changes.push({
			pluginId,
			kind: "plugin-web-search-configured"
		});
	}
	for (const plugin of resolvePluginsWithOwnedToolConfig(params.registry)) {
		const pluginId = plugin.id;
		if (hasPluginOwnedToolConfig(params.config, plugin)) changes.push({
			pluginId,
			kind: "plugin-tool-configured"
		});
	}
	for (const plugin of resolveProviderPluginsWithOwnedWebFetch(params.registry)) {
		const pluginId = plugin.id;
		if (hasPluginOwnedWebFetchConfig(params.config, pluginId)) changes.push({
			pluginId,
			kind: "plugin-web-fetch-configured"
		});
	}
	if (hasSetupAutoEnableRelevantConfig(params.config)) {
		const manifestMatchedPluginIds = new Set(changes.map((entry) => entry.pluginId));
		const setupPluginIds = resolveRelevantSetupAutoEnablePluginIds(params.config).filter((pluginId) => !manifestMatchedPluginIds.has(pluginId));
		for (const entry of require_setup_registry.resolvePluginSetupAutoEnableReasons({
			config: params.config,
			env: params.env,
			pluginIds: setupPluginIds
		})) changes.push({
			pluginId: entry.pluginId,
			kind: "setup-auto-enable",
			reason: entry.reason
		});
	}
	return changes;
}
function isPluginExplicitlyDisabled(cfg, pluginId) {
	const builtInChannelId = require_ids.normalizeChatChannelId(pluginId);
	if (builtInChannelId) {
		const channelConfig = cfg.channels?.[builtInChannelId];
		if (channelConfig && typeof channelConfig === "object" && !Array.isArray(channelConfig) && channelConfig.enabled === false) return true;
	}
	return cfg.plugins?.entries?.[pluginId]?.enabled === false;
}
function isPluginDenied(cfg, pluginId) {
	const deny = cfg.plugins?.deny;
	return Array.isArray(deny) && deny.includes(pluginId);
}
function isPluginExplicitlySelected(cfg, pluginId) {
	const allow = cfg.plugins?.allow;
	if (Array.isArray(allow) && allow.includes(pluginId)) return true;
	return hasMaterialPluginEntryConfig(cfg.plugins?.entries?.[pluginId]);
}
function disableImplicitPreferredOverPlugin(params) {
	if (isPluginExplicitlySelected(params.originalConfig, params.pluginId)) return params.config;
	if (!require_ids.normalizeChatChannelId(params.pluginId) && !isKnownPluginId(params.pluginId, params.manifestRegistry)) return params.config;
	const existingEntry = params.config.plugins?.entries?.[params.pluginId];
	return {
		...params.config,
		plugins: {
			...params.config.plugins,
			entries: {
				...params.config.plugins?.entries,
				[params.pluginId]: {
					...existingEntry && typeof existingEntry === "object" ? existingEntry : {},
					enabled: false
				}
			}
		}
	};
}
function isBuiltInChannelAlreadyEnabled(cfg, channelId) {
	const channelConfig = cfg.channels?.[channelId];
	return Boolean(channelConfig) && typeof channelConfig === "object" && !Array.isArray(channelConfig) && channelConfig.enabled === true;
}
function resolveAutoEnableChannelId(params) {
	if (params.entry.kind === "configured-plugin-repaired") return null;
	const plugin = params.manifestRegistry.plugins.find((record) => record.id === params.entry.pluginId);
	if (plugin && plugin.origin !== "bundled") {
		if (params.entry.kind !== "channel-configured") return null;
		const channelId = normalizeManifestChannelId(params.entry.channelId);
		if ((plugin.channels ?? []).some((id) => normalizeManifestChannelId(id) === channelId)) return null;
	}
	const builtInChannelId = require_ids.normalizeChatChannelId(params.entry.pluginId);
	if (builtInChannelId) return builtInChannelId;
	if (params.entry.kind !== "channel-configured") return null;
	if (plugin?.origin !== "bundled") return null;
	const channelId = normalizeManifestChannelId(params.entry.channelId);
	return (plugin.channels ?? []).some((id) => normalizeManifestChannelId(id) === channelId) ? channelId : null;
}
function registerPluginEntry(cfg, entry, manifestRegistry) {
	const builtInChannelId = resolveAutoEnableChannelId({
		entry,
		manifestRegistry
	});
	if (builtInChannelId) {
		const existing = cfg.channels?.[builtInChannelId];
		const existingRecord = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
		return {
			...cfg,
			channels: {
				...cfg.channels,
				[builtInChannelId]: {
					...existingRecord,
					enabled: true
				}
			}
		};
	}
	return {
		...cfg,
		plugins: {
			...cfg.plugins,
			entries: {
				...cfg.plugins?.entries,
				[entry.pluginId]: {
					...cfg.plugins?.entries?.[entry.pluginId],
					enabled: true
				}
			}
		}
	};
}
function hasMaterialPluginEntryConfig(entry) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) return false;
	return entry.enabled === true || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.config) || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.hooks) || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.subagent) || (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.llm) || entry.apiKey !== void 0 || entry.env !== void 0;
}
function isKnownPluginId(pluginId, manifestRegistry) {
	if (require_ids.normalizeChatChannelId(pluginId)) return true;
	return manifestRegistry.plugins.some((plugin) => plugin.id === pluginId) || require_official_external_plugin_catalog.isOfficialExternalPluginId(pluginId);
}
function materializeConfiguredPluginEntryAllowlist(params) {
	let next = params.config;
	const allow = next.plugins?.allow;
	const entries = next.plugins?.entries;
	if (!Array.isArray(allow) || allow.length === 0 || !entries || typeof entries !== "object") return next;
	for (const pluginId of Object.keys(entries).toSorted((left, right) => left.localeCompare(right))) {
		const entry = entries[pluginId];
		if (!hasMaterialPluginEntryConfig(entry) || isPluginDenied(next, pluginId) || isPluginExplicitlyDisabled(next, pluginId) || allow.includes(pluginId) || !isKnownPluginId(pluginId, params.manifestRegistry)) continue;
		next = require_plugins_allowlist.ensurePluginAllowlisted(next, pluginId);
		params.changes.push(`${pluginId} plugin config present, added to plugin allowlist.`);
	}
	return next;
}
function resolveChannelAutoEnableDisplayLabel(entry, manifestRegistry) {
	const builtInChannelId = require_ids.normalizeChatChannelId(entry.channelId);
	const plugin = manifestRegistry.plugins.find((record) => record.id === entry.pluginId);
	return (builtInChannelId ? require_registry.findChatChannelMeta(builtInChannelId)?.label : void 0) ?? plugin?.channelConfigs?.[entry.channelId]?.label ?? plugin?.channelCatalogMeta?.label;
}
function formatAutoEnableChange(entry, manifestRegistry) {
	if (entry.kind === "channel-configured") {
		const label = resolveChannelAutoEnableDisplayLabel(entry, manifestRegistry);
		if (label) return `${label} configured, enabled automatically.`;
	}
	return `${resolvePluginAutoEnableCandidateReason(entry).trim()}, enabled automatically.`;
}
function resolvePluginAutoEnableManifestRegistry(params) {
	if (params.manifestRegistry) return params.manifestRegistry;
	if (!configMayNeedPluginManifestRegistry(params.config, params.env)) return EMPTY_PLUGIN_MANIFEST_REGISTRY;
	return (require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.config,
		env: params.env,
		allowWorkspaceScopedSnapshot: true
	}) ?? (() => {
		if (!canReuseUnscopedCurrentPluginMetadataSnapshot(params.config)) return;
		const snapshot = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
			env: params.env,
			allowWorkspaceScopedSnapshot: true,
			requireDefaultDiscoveryContext: true
		});
		return snapshot?.policyHash === require_installed_plugin_index.resolveInstalledPluginIndexPolicyHash(params.config) ? snapshot : void 0;
	})())?.manifestRegistry ?? require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: params.config,
		env: params.env
	}).manifestRegistry;
}
function materializePluginAutoEnableCandidatesInternal(params) {
	let next = params.config ?? {};
	const changes = [];
	const autoEnabledReasons = /* @__PURE__ */ new Map();
	if (next.plugins?.enabled === false) return {
		config: next,
		changes,
		autoEnabledReasons: {}
	};
	const preferOverCache = /* @__PURE__ */ new Map();
	for (const entry of params.candidates) {
		const builtInChannelId = resolveAutoEnableChannelId({
			entry,
			manifestRegistry: params.manifestRegistry
		});
		if (isPluginDenied(next, entry.pluginId) || isPluginExplicitlyDisabled(next, entry.pluginId)) continue;
		if (shouldSkipPreferredPluginAutoEnable({
			config: next,
			entry,
			configured: params.candidates,
			env: params.env,
			registry: params.manifestRegistry,
			isPluginDenied,
			isPluginExplicitlyDisabled,
			preferOverCache
		})) {
			next = disableImplicitPreferredOverPlugin({
				config: next,
				originalConfig: params.config ?? {},
				pluginId: entry.pluginId,
				manifestRegistry: params.manifestRegistry
			});
			continue;
		}
		const allow = next.plugins?.allow;
		const hasRestrictiveAllowlist = Array.isArray(allow) && allow.length > 0;
		const allowMissing = hasRestrictiveAllowlist && !allow.includes(entry.pluginId);
		if ((builtInChannelId != null ? isBuiltInChannelAlreadyEnabled(next, builtInChannelId) : next.plugins?.entries?.[entry.pluginId]?.enabled === true) && !allowMissing) continue;
		next = registerPluginEntry(next, entry, params.manifestRegistry);
		if (hasRestrictiveAllowlist) next = require_plugins_allowlist.ensurePluginAllowlisted(next, entry.pluginId);
		const reason = resolvePluginAutoEnableCandidateReason(entry);
		autoEnabledReasons.set(entry.pluginId, [...autoEnabledReasons.get(entry.pluginId) ?? [], reason]);
		changes.push(formatAutoEnableChange(entry, params.manifestRegistry));
	}
	next = materializeConfiguredPluginEntryAllowlist({
		config: next,
		changes,
		manifestRegistry: params.manifestRegistry
	});
	const autoEnabledReasonRecord = Object.create(null);
	for (const [pluginId, reasons] of autoEnabledReasons) if (!require_prototype_keys.isBlockedObjectKey(pluginId)) autoEnabledReasonRecord[pluginId] = [...reasons];
	return {
		config: next,
		changes,
		autoEnabledReasons: autoEnabledReasonRecord
	};
}
//#endregion
//#region src/config/plugin-auto-enable.detect.ts
/** Detects installed plugins that should become enabled from existing config usage. */
function detectPluginAutoEnableCandidates(params) {
	const env = params.env ?? process.env;
	const config = params.config ?? {};
	const readiness = resolvePluginAutoEnableReadiness(config, env, params.discovery);
	if (!readiness.mayNeedAutoEnable) return [];
	return resolveConfiguredPluginAutoEnableCandidates({
		config,
		env,
		registry: resolvePluginAutoEnableManifestRegistry({
			config,
			env,
			manifestRegistry: params.manifestRegistry
		}),
		configuredChannelIds: readiness.configuredChannelIds
	});
}
//#endregion
//#region src/config/plugin-auto-enable.apply.ts
let sameTurnApplyCache;
let sameTurnApplyCacheClearScheduled = false;
function scheduleSameTurnApplyCacheClear() {
	if (sameTurnApplyCacheClearScheduled) return;
	sameTurnApplyCacheClearScheduled = true;
	setImmediate(() => {
		sameTurnApplyCache = void 0;
		sameTurnApplyCacheClearScheduled = false;
	}).unref?.();
}
function getOrCreateWeakMap(parent, key, create) {
	const existing = parent.get(key);
	if (existing) return existing;
	const next = create();
	parent.set(key, next);
	return next;
}
function stableFingerprintValue(value) {
	if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
	if (Array.isArray(value)) return `[${value.map((entry) => stableFingerprintValue(entry)).join(",")}]`;
	const record = value;
	return `{${Object.keys(record).toSorted((left, right) => left.localeCompare(right)).map((key) => `${JSON.stringify(key)}:${stableFingerprintValue(record[key])}`).join(",")}}`;
}
/** Fingerprints mutable config inputs used by plugin auto-enable detection. */
function fingerprintPluginAutoEnableConfig(config) {
	return require_runtime_snapshot.hashRuntimeConfigValue(config);
}
/** Fingerprints mutable environment inputs used by plugin auto-enable detection. */
function fingerprintPluginAutoEnableEnv(env) {
	return stableFingerprintValue(env);
}
function createPluginAutoEnableCacheEntry(params) {
	return {
		configFingerprint: fingerprintPluginAutoEnableConfig(params.config),
		discoveryFingerprint: stableFingerprintValue(params.discovery.candidates),
		envFingerprint: fingerprintPluginAutoEnableEnv(params.env),
		registryFingerprint: stableFingerprintValue(params.manifestRegistry.plugins),
		result: params.result
	};
}
function isPluginAutoEnableCacheEntryFresh(params) {
	return params.entry.configFingerprint === fingerprintPluginAutoEnableConfig(params.config) && params.entry.discoveryFingerprint === stableFingerprintValue(params.discovery.candidates) && params.entry.envFingerprint === fingerprintPluginAutoEnableEnv(params.env) && params.entry.registryFingerprint === stableFingerprintValue(params.manifestRegistry.plugins);
}
/** Applies already detected plugin auto-enable candidates to config. */
function materializePluginAutoEnableCandidates(params) {
	const env = params.env ?? process.env;
	const config = params.config ?? {};
	const entries = config.plugins?.entries;
	const hasRestrictiveAllowlistWithEntries = Array.isArray(config.plugins?.allow) && config.plugins.allow.length > 0 && entries !== void 0 && typeof entries === "object";
	if (params.candidates.length === 0 && !hasRestrictiveAllowlistWithEntries) return {
		config,
		changes: [],
		autoEnabledReasons: {}
	};
	const manifestRegistry = resolvePluginAutoEnableManifestRegistry({
		config,
		env,
		manifestRegistry: params.manifestRegistry
	});
	return materializePluginAutoEnableCandidatesInternal({
		config,
		candidates: params.candidates,
		env,
		manifestRegistry
	});
}
function applyPluginAutoEnable(params) {
	const config = params.config;
	if (config && typeof config === "object" && params.manifestRegistry && params.discovery) {
		const env = params.env ?? process.env;
		const discoveryCache = getOrCreateWeakMap(getOrCreateWeakMap(getOrCreateWeakMap(sameTurnApplyCache ??= /* @__PURE__ */ new WeakMap(), config, () => /* @__PURE__ */ new WeakMap()), env, () => /* @__PURE__ */ new WeakMap()), params.manifestRegistry, () => /* @__PURE__ */ new WeakMap());
		const cached = discoveryCache.get(params.discovery);
		if (cached && isPluginAutoEnableCacheEntryFresh({
			entry: cached,
			config,
			discovery: params.discovery,
			env,
			manifestRegistry: params.manifestRegistry
		})) return cached.result;
		const result = materializePluginAutoEnableCandidates({
			config,
			candidates: detectPluginAutoEnableCandidates(params),
			env: params.env,
			manifestRegistry: params.manifestRegistry
		});
		discoveryCache.set(params.discovery, createPluginAutoEnableCacheEntry({
			config,
			discovery: params.discovery,
			env,
			manifestRegistry: params.manifestRegistry,
			result
		}));
		scheduleSameTurnApplyCacheClear();
		return result;
	}
	const candidates = detectPluginAutoEnableCandidates(params);
	return materializePluginAutoEnableCandidates({
		config: params.config,
		candidates,
		env: params.env,
		manifestRegistry: params.manifestRegistry
	});
}
//#endregion
//#region src/config/plugin-auto-enable.ts
var plugin_auto_enable_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	applyPluginAutoEnable: () => applyPluginAutoEnable,
	detectPluginAutoEnableCandidates: () => detectPluginAutoEnableCandidates,
	materializePluginAutoEnableCandidates: () => materializePluginAutoEnableCandidates,
	resolvePluginAutoEnableCandidateReason: () => resolvePluginAutoEnableCandidateReason
});
//#endregion
Object.defineProperty(exports, "applyPluginAutoEnable", {
	enumerable: true,
	get: function() {
		return applyPluginAutoEnable;
	}
});
Object.defineProperty(exports, "configMayNeedPluginAutoEnable", {
	enumerable: true,
	get: function() {
		return configMayNeedPluginAutoEnable;
	}
});
Object.defineProperty(exports, "detectPluginAutoEnableCandidates", {
	enumerable: true,
	get: function() {
		return detectPluginAutoEnableCandidates;
	}
});
Object.defineProperty(exports, "fingerprintPluginAutoEnableConfig", {
	enumerable: true,
	get: function() {
		return fingerprintPluginAutoEnableConfig;
	}
});
Object.defineProperty(exports, "fingerprintPluginAutoEnableEnv", {
	enumerable: true,
	get: function() {
		return fingerprintPluginAutoEnableEnv;
	}
});
Object.defineProperty(exports, "materializePluginAutoEnableCandidates", {
	enumerable: true,
	get: function() {
		return materializePluginAutoEnableCandidates;
	}
});
Object.defineProperty(exports, "plugin_auto_enable_exports", {
	enumerable: true,
	get: function() {
		return plugin_auto_enable_exports;
	}
});
