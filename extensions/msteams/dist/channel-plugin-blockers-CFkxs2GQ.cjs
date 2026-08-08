require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_manifest_owner_policy = require("./manifest-owner-policy-BI1K0z-h.cjs");
const require_config_presence = require("./config-presence-iIICLITG.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/doctor/shared/channel-plugin-blockers.ts
const CHANNEL_PLUGIN_BLOCKERS_CHECK_ID = "core/doctor/channel-plugin-blockers";
/** Find configured channel ids whose backing plugins cannot activate. */
function scanConfiguredChannelPluginBlockers(cfg, env = process.env, activationSourceConfig = cfg, options = {}) {
	const explicitChannelIds = require_channel_presence_policy.listExplicitConfiguredChannelIdsForConfig(cfg).map((channelId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId)).filter((channelId) => Boolean(channelId));
	const sourcePluginsConfig = require_config_state.normalizePluginsConfig(activationSourceConfig.plugins);
	const effectivePluginsConfig = require_config_state.normalizePluginsConfig(cfg.plugins);
	const manifestRecords = options.manifestRecords ?? require_plugin_registry.loadPluginManifestRegistryForPluginRegistry({
		config: cfg,
		env,
		includeDisabled: true
	}).plugins;
	const manifestEnvTriggers = listManifestEnvConfiguredChannelTriggers(manifestRecords, env);
	const policyChannelIds = require_channel_presence_policy.resolveConfiguredChannelPresencePolicy({
		config: cfg,
		activationSourceConfig,
		env,
		includePersistedAuthState: false,
		manifestRecords
	}).filter((entry) => !manifestEnvTriggers.has(entry.channelId) || entry.sources.some((source) => source !== "env" && source !== "manifest-env")).map((entry) => entry.channelId);
	const genericChannelIds = /* @__PURE__ */ new Set([...explicitChannelIds, ...explicitChannelIds.length === 0 ? policyChannelIds : []]);
	for (const channelId of require_config_presence.listExplicitlyDisabledChannelIdsForConfig(cfg)) {
		const normalizedChannelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId) ?? channelId;
		genericChannelIds.delete(normalizedChannelId);
		manifestEnvTriggers.delete(normalizedChannelId);
	}
	if (genericChannelIds.size === 0 && manifestEnvTriggers.size === 0) return [];
	const hits = [];
	const hitKeys = /* @__PURE__ */ new Set();
	const globalDisableChannelIds = /* @__PURE__ */ new Set();
	const addHits = (channelId, ownerStates, channelAvailable = false) => {
		for (const state of ownerStates) {
			if (!state.reason) continue;
			if (state.reason === "plugins disabled") {
				if (globalDisableChannelIds.has(channelId)) continue;
				globalDisableChannelIds.add(channelId);
			}
			const key = `${channelId}\0${state.pluginId}\0${state.reason}`;
			if (hitKeys.has(key)) continue;
			hitKeys.add(key);
			const hit = {
				channelId,
				pluginId: state.pluginId,
				reason: state.reason
			};
			if (channelAvailable) hit.channelAvailable = true;
			hits.push(hit);
		}
	};
	for (const channelId of genericChannelIds) {
		const ownerStates = manifestRecords.filter((plugin) => plugin.channels.some((rawChannelId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(rawChannelId) === channelId)).map((plugin) => resolveConfiguredChannelOwnerState({
			plugin,
			channelId,
			sourceConfig: activationSourceConfig,
			sourcePluginsConfig,
			effectiveConfig: cfg,
			effectivePluginsConfig
		}));
		if (ownerStates.some((state) => state.available)) continue;
		addHits(channelId, ownerStates);
	}
	for (const [channelId, triggers] of manifestEnvTriggers) {
		const channelOwnerStates = manifestRecords.filter((plugin) => plugin.channels.some((rawChannelId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(rawChannelId) === channelId)).map((plugin) => resolveConfiguredChannelOwnerState({
			plugin,
			channelId,
			sourceConfig: activationSourceConfig,
			sourcePluginsConfig,
			effectiveConfig: cfg,
			effectivePluginsConfig
		}));
		const channelAvailable = channelOwnerStates.some((state) => state.available);
		for (const pluginIds of triggers.values()) {
			const ownerStates = channelOwnerStates.filter((state) => pluginIds.has(state.pluginId));
			if (ownerStates.some((state) => state.available)) continue;
			addHits(channelId, ownerStates, channelAvailable);
		}
	}
	return hits;
}
function listManifestEnvConfiguredChannelTriggers(plugins, env) {
	const triggersByChannelId = /* @__PURE__ */ new Map();
	for (const plugin of plugins) {
		const ownedChannelIds = new Set(plugin.channels.map((channelId) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId)).filter((channelId) => Boolean(channelId)));
		for (const [rawChannelId, envVars] of Object.entries(plugin.channelEnvVars ?? {})) {
			const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(rawChannelId);
			if (!channelId || !ownedChannelIds.has(channelId)) continue;
			for (const envVar of envVars) {
				if (!require_channel_presence_policy.isSafeChannelEnvVarTriggerName(envVar)) continue;
				const value = env[envVar] ?? env[envVar.toUpperCase()];
				if (typeof value !== "string" || value.trim().length === 0) continue;
				let triggers = triggersByChannelId.get(channelId);
				if (!triggers) {
					triggers = /* @__PURE__ */ new Map();
					triggersByChannelId.set(channelId, triggers);
				}
				const trigger = envVar.trim().toUpperCase();
				let ownerIds = triggers.get(trigger);
				if (!ownerIds) {
					ownerIds = /* @__PURE__ */ new Set();
					triggers.set(trigger, ownerIds);
				}
				ownerIds.add(plugin.id);
			}
		}
	}
	return triggersByChannelId;
}
function resolveConfiguredChannelOwnerState(params) {
	const bundledChannelConfigured = params.plugin.origin === "bundled" && require_channel_presence_policy.hasExplicitChannelConfig({
		config: params.sourceConfig,
		channelId: params.channelId
	});
	const sourceAllowlistBypass = bundledChannelConfigured || params.plugin.origin === "workspace" && params.sourcePluginsConfig.slots.contextEngine === params.plugin.id;
	const sourceBaseBlock = require_manifest_owner_policy.resolveManifestOwnerBasePolicyBlock({
		plugin: params.plugin,
		normalizedConfig: params.sourcePluginsConfig,
		allowRestrictiveAllowlistBypass: sourceAllowlistBypass
	});
	const sourceExternalTrusted = params.plugin.origin === "bundled" || require_manifest_owner_policy.hasExplicitManifestOwnerTrust({
		plugin: params.plugin,
		normalizedConfig: params.sourcePluginsConfig
	}) || params.plugin.origin === "workspace" && params.sourcePluginsConfig.slots.contextEngine === params.plugin.id;
	const sourceBundledActivated = params.plugin.origin === "bundled" && (bundledChannelConfigured || require_manifest_owner_policy.isActivatedManifestOwner({
		plugin: params.plugin,
		normalizedConfig: params.sourcePluginsConfig,
		rootConfig: params.sourceConfig
	}));
	const sourceBundledNeedsExplicitEnablement = params.plugin.origin === "bundled" && !require_default_enablement.isPluginEnabledByDefaultForPlatform(params.plugin) && params.sourcePluginsConfig.entries[params.plugin.id]?.enabled !== true;
	const effectiveBundledChannelConfigured = params.plugin.origin === "bundled" && require_channel_presence_policy.hasExplicitChannelConfig({
		config: params.effectiveConfig,
		channelId: params.channelId
	});
	const effectiveAllowlistBypass = effectiveBundledChannelConfigured || params.plugin.origin === "workspace" && params.effectivePluginsConfig.slots.contextEngine === params.plugin.id;
	const available = require_manifest_owner_policy.resolveManifestOwnerBasePolicyBlock({
		plugin: params.plugin,
		normalizedConfig: params.effectivePluginsConfig,
		allowRestrictiveAllowlistBypass: effectiveAllowlistBypass
	}) === null && sourceExternalTrusted && (effectiveBundledChannelConfigured || require_manifest_owner_policy.isActivatedManifestOwner({
		plugin: params.plugin,
		normalizedConfig: params.effectivePluginsConfig,
		rootConfig: params.effectiveConfig
	}));
	return {
		pluginId: params.plugin.id,
		available,
		reason: available ? void 0 : params.plugin.origin === "bundled" && sourceBaseBlock === "not-in-allowlist" && sourceBundledNeedsExplicitEnablement ? "not enabled and not in allowlist" : mapManifestOwnerBlockerReason(sourceBaseBlock) ?? (!sourceExternalTrusted && sourceBaseBlock === null ? "missing explicit enablement" : params.plugin.origin === "bundled" && sourceBaseBlock === null && !sourceBundledActivated ? "not enabled" : void 0)
	};
}
function mapManifestOwnerBlockerReason(reason) {
	if (reason === "plugins-disabled") return "plugins disabled";
	if (reason === "plugin-disabled") return "disabled in config";
	if (reason === "blocked-by-denylist") return "blocked by denylist";
	if (reason === "not-in-allowlist") return "not in allowlist";
}
function formatReason(hit) {
	if (hit.reason === "disabled in config") return `plugin "${require_ansi.sanitizeForLog(hit.pluginId)}" is disabled by plugins.entries.${require_ansi.sanitizeForLog(hit.pluginId)}.enabled=false.`;
	if (hit.reason === "blocked by denylist") return `plugin "${require_ansi.sanitizeForLog(hit.pluginId)}" is blocked by plugins.deny. Remove "${require_ansi.sanitizeForLog(hit.pluginId)}" from plugins.deny.`;
	if (hit.reason === "plugins disabled") return `plugins.enabled=false blocks channel plugins globally.`;
	if (hit.reason === "missing explicit enablement") return `external plugin "${require_ansi.sanitizeForLog(hit.pluginId)}" is installed without explicit trust. Add plugins.entries.${require_ansi.sanitizeForLog(hit.pluginId)}.enabled=true.`;
	if (hit.reason === "not enabled") return `plugin "${require_ansi.sanitizeForLog(hit.pluginId)}" is installed but not enabled. Add plugins.entries.${require_ansi.sanitizeForLog(hit.pluginId)}.enabled=true.`;
	if (hit.reason === "not enabled and not in allowlist") return `plugin "${require_ansi.sanitizeForLog(hit.pluginId)}" is not enabled and is omitted from plugins.allow. Add plugins.entries.${require_ansi.sanitizeForLog(hit.pluginId)}.enabled=true and include "${require_ansi.sanitizeForLog(hit.pluginId)}" in plugins.allow.`;
	if (hit.reason === "not in allowlist") return `plugin "${require_ansi.sanitizeForLog(hit.pluginId)}" is installed but omitted from plugins.allow. Include "${require_ansi.sanitizeForLog(hit.pluginId)}" in plugins.allow.`;
	return `plugin "${require_ansi.sanitizeForLog(hit.pluginId)}" is not loadable (${require_ansi.sanitizeForLog(hit.reason)}).`;
}
/** Format doctor warnings for configured channels blocked by plugin activation state. */
function collectConfiguredChannelPluginBlockerWarnings(hits) {
	return hits.map((hit) => `- channels.${require_ansi.sanitizeForLog(hit.channelId)}: channel is configured, but ${formatReason(hit)} Fix plugin enablement before relying on setup guidance for this channel.`);
}
function stripListMarker(message) {
	return message.startsWith("- ") ? message.slice(2) : message;
}
/** Convert a configured channel plugin blocker into a structured Doctor finding. */
function channelPluginBlockerHitToHealthFinding(hit) {
	return {
		checkId: CHANNEL_PLUGIN_BLOCKERS_CHECK_ID,
		severity: "warning",
		message: stripListMarker(collectConfiguredChannelPluginBlockerWarnings([hit])[0] ?? ""),
		path: `channels.${hit.channelId}`,
		target: hit.pluginId,
		requirement: hit.reason,
		fixHint: "Fix plugin enablement before relying on setup guidance for this channel."
	};
}
/** Return true when a setup warning targets a channel already explained by plugin blockers. */
function isWarningBlockedByChannelPlugin(warning, hits) {
	return hits.some((hit) => {
		if (hit.channelAvailable) return false;
		const prefix = `channels.${require_ansi.sanitizeForLog(hit.channelId)}`;
		return warning.includes(`${prefix}:`) || warning.includes(`${prefix}.`);
	});
}
//#endregion
exports.channelPluginBlockerHitToHealthFinding = channelPluginBlockerHitToHealthFinding;
exports.collectConfiguredChannelPluginBlockerWarnings = collectConfiguredChannelPluginBlockerWarnings;
exports.isWarningBlockedByChannelPlugin = isWarningBlockedByChannelPlugin;
exports.scanConfiguredChannelPluginBlockers = scanConfiguredChannelPluginBlockers;
