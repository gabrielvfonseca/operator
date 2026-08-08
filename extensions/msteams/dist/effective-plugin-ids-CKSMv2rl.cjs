const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_manifest_owner_policy = require("./manifest-owner-policy-BI1K0z-h.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_config_presence = require("./config-presence-iIICLITG.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/effective-plugin-ids.ts
/** Resolves effective plugin ids from config, installed records, and activation metadata. */
function collectConfiguredChannelIds(config, activationSourceConfig, env) {
	const disabled = /* @__PURE__ */ new Set([...require_config_presence.listExplicitlyDisabledChannelIdsForConfig(config), ...require_config_presence.listExplicitlyDisabledChannelIdsForConfig(activationSourceConfig)]);
	return [.../* @__PURE__ */ new Set([...require_config_presence.listPotentialConfiguredChannelIds(config, env, { includePersistedAuthState: false }), ...require_channel_presence_policy.listExplicitConfiguredChannelIdsForConfig(activationSourceConfig)])].map((channelId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId)).filter((channelId) => {
		if (!channelId) return false;
		return !disabled.has(channelId);
	}).toSorted((left, right) => left.localeCompare(right));
}
function collectBundledChannelOwnerPluginIds(params) {
	const plugins = require_config_state.normalizePluginsConfig(params.config.plugins);
	const channelIds = new Set(params.channelIds.map((channelId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId)).filter((channelId) => Boolean(channelId)));
	if (channelIds.size === 0) return [];
	const env = params.bundledPluginsDir ? {
		...params.env,
		OPERATOR_BUNDLED_PLUGINS_DIR: params.bundledPluginsDir,
		...params.env.VITEST || process.env.VITEST ? { OPERATOR_TEST_TRUST_BUNDLED_PLUGINS_DIR: "1" } : {}
	} : params.env;
	const snapshot = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.config,
		env,
		workspaceDir: params.workspaceDir
	});
	const pluginIds = /* @__PURE__ */ new Set();
	for (const plugin of snapshot.plugins) {
		if (plugin.origin !== "bundled") continue;
		if (plugin.channels.some((channelId) => channelIds.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId) ?? ""))) {
			const pluginId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(plugin.id);
			if (pluginId && require_manifest_owner_policy.passesManifestOwnerBasePolicy({
				plugin: { id: pluginId },
				normalizedConfig: plugins,
				allowRestrictiveAllowlistBypass: true
			})) pluginIds.add(pluginId);
		}
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(pluginIds);
}
function collectExplicitEffectivePluginIds(config) {
	const plugins = require_config_state.normalizePluginsConfig(config.plugins);
	if (!plugins.enabled) return [];
	const ids = new Set(plugins.allow);
	for (const [pluginId, entry] of Object.entries(plugins.entries)) if (entry?.enabled === true && (plugins.allow.length === 0 || plugins.allow.includes(pluginId))) ids.add(pluginId);
	for (const pluginId of plugins.deny) ids.delete(pluginId);
	for (const [pluginId, entry] of Object.entries(plugins.entries)) if (entry?.enabled === false) ids.delete(pluginId);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(ids);
}
function collectSelectedContextEnginePluginIds(config) {
	const plugins = require_config_state.normalizePluginsConfig(config.plugins);
	if (!plugins.enabled) return [];
	const pluginId = plugins.slots.contextEngine;
	if (!pluginId || pluginId === require_config_activation_shared.defaultSlotIdForKey("contextEngine")) return [];
	if (plugins.deny.includes(pluginId)) return [];
	if (plugins.entries[pluginId]?.enabled === false) return [];
	return [pluginId];
}
/** Lists plugin ids that are effectively enabled for a config/discovery context. */
function resolveEffectivePluginIds(params) {
	const effectiveConfig = require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.config,
		env: params.env
	}).config;
	const ids = new Set(collectExplicitEffectivePluginIds(effectiveConfig));
	for (const pluginId of collectSelectedContextEnginePluginIds(effectiveConfig)) ids.add(pluginId);
	const configuredChannelIds = collectConfiguredChannelIds(effectiveConfig, params.config, params.env);
	for (const pluginId of require_channel_presence_policy.resolveConfiguredChannelPluginIds({
		config: effectiveConfig,
		activationSourceConfig: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	})) ids.add(pluginId);
	for (const pluginId of collectBundledChannelOwnerPluginIds({
		config: effectiveConfig,
		channelIds: configuredChannelIds,
		env: params.env,
		workspaceDir: params.workspaceDir,
		...params.bundledPluginsDir ? { bundledPluginsDir: params.bundledPluginsDir } : {}
	})) ids.add(pluginId);
	for (const pluginId of require_gateway_startup_plugin_ids.loadGatewayStartupPluginPlan({
		config: effectiveConfig,
		activationSourceConfig: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}).pluginIds) ids.add(pluginId);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(ids);
}
//#endregion
Object.defineProperty(exports, "resolveEffectivePluginIds", {
	enumerable: true,
	get: function() {
		return resolveEffectivePluginIds;
	}
});
