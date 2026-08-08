const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_manifest_owner_policy = require("./manifest-owner-policy-BI1K0z-h.cjs");
const require_config_presence = require("./config-presence-iIICLITG.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/secrets/channel-env-var-names.ts
/** Ambient process env names that are too common to imply channel configuration. */
const UNSAFE_CHANNEL_ENV_VAR_TRIGGER_NAMES = /* @__PURE__ */ new Set([
	"CI",
	"HOME",
	"LANG",
	"LC_ALL",
	"LC_CTYPE",
	"LOGNAME",
	"NODE_ENV",
	"OLDPWD",
	"PATH",
	"PWD",
	"SHELL",
	"SSH_AUTH_SOCK",
	"TEMP",
	"TERM",
	"TMP",
	"TMPDIR",
	"USER"
]);
/**
* Returns whether a channel env var name is safe to treat as a credential/config trigger.
*/
function isSafeChannelEnvVarTriggerName(key) {
	const normalized = key.trim().toUpperCase();
	return /^[A-Z][A-Z0-9_]*$/.test(normalized) && !UNSAFE_CHANNEL_ENV_VAR_TRIGGER_NAMES.has(normalized);
}
//#endregion
//#region src/plugins/activation-planner.ts
/** Computes which manifest-owned plugins need activation for commands, routes, providers, or capabilities. */
/** Returns a deterministic activation plan without importing plugin runtime modules. */
function resolveManifestActivationPlan(params) {
	const onlyPluginIdSet = require_current_plugin_metadata_snapshot.createPluginIdScopeSet(require_current_plugin_metadata_snapshot.normalizePluginIdScope(params.onlyPluginIds));
	const registry = params.manifestRecords ? {
		plugins: params.manifestRecords,
		diagnostics: []
	} : require_plugin_registry.loadPluginManifestRegistryForPluginRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeDisabled: true
	});
	const normalizedConfig = require_config_state.normalizePluginsConfig(params.config?.plugins);
	const entries = registry.plugins.flatMap((plugin) => {
		if (params.origin && plugin.origin !== params.origin) return [];
		if (onlyPluginIdSet && !onlyPluginIdSet.has(plugin.id)) return [];
		if (!require_manifest_owner_policy.passesManifestOwnerBasePolicy({
			plugin,
			normalizedConfig,
			allowRestrictiveAllowlistBypass: params.allowRestrictiveAllowlistBypass
		})) return [];
		if (params.requireExplicitManifestOwnerTrust && !hasExplicitActivationPlannerManifestOwnerTrust({
			plugin,
			normalizedConfig
		})) return [];
		const reasons = listManifestActivationTriggerReasons(plugin, params.trigger);
		if (reasons.length === 0) return [];
		return [{
			pluginId: plugin.id,
			origin: plugin.origin,
			reasons
		}];
	}).toSorted((left, right) => left.pluginId.localeCompare(right.pluginId));
	return {
		trigger: params.trigger,
		pluginIds: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(entries.map((entry) => entry.pluginId)),
		entries,
		diagnostics: registry.diagnostics
	};
}
/** Convenience wrapper for callers that only need plugin ids from the activation plan. */
function resolveManifestActivationPluginIds(params) {
	return [...resolveManifestActivationPlan(params).pluginIds];
}
function hasExplicitActivationPlannerManifestOwnerTrust(params) {
	return require_manifest_owner_policy.isBundledManifestOwner(params.plugin) || params.plugin.origin === "config" || require_manifest_owner_policy.hasExplicitManifestOwnerTrust({
		plugin: params.plugin,
		normalizedConfig: params.normalizedConfig
	});
}
function listManifestActivationTriggerReasons(plugin, trigger) {
	switch (trigger.kind) {
		case "command": return listCommandTriggerReasons(plugin, normalizeCommandId(trigger.command));
		case "provider": return listProviderTriggerReasons(plugin, (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(trigger.provider));
		case "agentHarness": return listAgentHarnessTriggerReasons(plugin, normalizeCommandId(trigger.runtime));
		case "channel": return listChannelTriggerReasons(plugin, normalizeCommandId(trigger.channel));
		case "route": return listRouteTriggerReasons(plugin, normalizeCommandId(trigger.route));
		case "capability": return listCapabilityTriggerReasons(plugin, trigger.capability);
	}
	return trigger;
}
function listAgentHarnessTriggerReasons(plugin, runtime) {
	return listHasNormalizedValue(plugin.activation?.onAgentHarnesses, runtime, normalizeCommandId) ? ["activation-agent-harness-hint"] : [];
}
function listCommandTriggerReasons(plugin, command) {
	return dedupeReasons([listHasNormalizedValue(plugin.activation?.onCommands, command, normalizeCommandId) ? "activation-command-hint" : null, listHasNormalizedValue((plugin.commandAliases ?? []).flatMap((alias) => alias.cliCommand ?? alias.name), command, normalizeCommandId) ? "manifest-command-alias" : null]);
}
function listProviderTriggerReasons(plugin, provider) {
	return dedupeReasons([
		listHasNormalizedValue(plugin.activation?.onProviders, provider, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId) ? "activation-provider-hint" : null,
		listHasNormalizedValue(plugin.providers, provider, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId) ? "manifest-provider-owner" : null,
		listHasNormalizedValue(plugin.setup?.providers?.map((setupProvider) => setupProvider.id), provider, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId) ? "manifest-setup-provider-owner" : null
	]);
}
function listChannelTriggerReasons(plugin, channel) {
	return dedupeReasons([listHasNormalizedValue(plugin.activation?.onChannels, channel, normalizeCommandId) ? "activation-channel-hint" : null, listHasNormalizedValue(plugin.channels, channel, normalizeCommandId) ? "manifest-channel-owner" : null]);
}
function listRouteTriggerReasons(plugin, route) {
	return listHasNormalizedValue(plugin.activation?.onRoutes, route, normalizeCommandId) ? ["activation-route-hint"] : [];
}
function listCapabilityTriggerReasons(plugin, capability) {
	switch (capability) {
		case "provider": return dedupeReasons([
			plugin.activation?.onCapabilities?.includes(capability) ? "activation-capability-hint" : null,
			hasValues(plugin.activation?.onProviders) ? "activation-provider-hint" : null,
			hasValues(plugin.providers) ? "manifest-provider-owner" : null,
			hasValues(plugin.setup?.providers) ? "manifest-setup-provider-owner" : null
		]);
		case "channel": return dedupeReasons([
			plugin.activation?.onCapabilities?.includes(capability) ? "activation-capability-hint" : null,
			hasValues(plugin.activation?.onChannels) ? "activation-channel-hint" : null,
			hasValues(plugin.channels) ? "manifest-channel-owner" : null
		]);
		case "tool": return dedupeReasons([plugin.activation?.onCapabilities?.includes(capability) ? "activation-capability-hint" : null, hasValues(plugin.contracts?.tools) ? "manifest-tool-contract" : null]);
		case "hook": return dedupeReasons([plugin.activation?.onCapabilities?.includes(capability) ? "activation-capability-hint" : null, hasValues(plugin.hooks) ? "manifest-hook-owner" : null]);
	}
	return capability;
}
function listHasNormalizedValue(values, expected, normalize) {
	return values?.some((value) => normalize(value) === expected) ?? false;
}
function hasValues(values) {
	return (values?.length ?? 0) > 0;
}
function dedupeReasons(reasons) {
	return [...new Set(reasons.filter((reason) => Boolean(reason)))];
}
function normalizeCommandId(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) ?? "";
}
//#endregion
//#region src/plugins/channel-presence-policy.ts
var channel_presence_policy_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	hasConfiguredChannelsForReadOnlyScope: () => hasConfiguredChannelsForReadOnlyScope,
	hasExplicitChannelConfig: () => hasExplicitChannelConfig,
	listConfiguredAnnounceChannelIdsForConfig: () => listConfiguredAnnounceChannelIdsForConfig,
	listConfiguredChannelIdsForReadOnlyScope: () => listConfiguredChannelIdsForReadOnlyScope,
	listExplicitConfiguredChannelIdsForConfig: () => listExplicitConfiguredChannelIdsForConfig,
	resolveConfiguredChannelPluginIds: () => resolveConfiguredChannelPluginIds,
	resolveConfiguredChannelPresencePolicy: () => resolveConfiguredChannelPresencePolicy,
	resolveDiscoverableScopedChannelPluginIds: () => resolveDiscoverableScopedChannelPluginIds
});
const IGNORED_CHANNEL_CONFIG_KEYS = /* @__PURE__ */ new Set(["defaults", "modelByChannel"]);
const ANNOUNCE_SUPPRESSING_BLOCKED_REASONS = /* @__PURE__ */ new Set([
	"plugins-disabled",
	"blocked-by-denylist",
	"plugin-disabled"
]);
function normalizeChannelIds(channelIds) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([...channelIds].flatMap((channelId) => {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId);
		return normalized ? [normalized] : [];
	}));
}
function hasNonEmptyEnvValue(env, key) {
	if (!isSafeChannelEnvVarTriggerName(key)) return false;
	const trimmed = key.trim();
	const value = env[trimmed] ?? env[trimmed.toUpperCase()];
	return typeof value === "string" && value.trim().length > 0;
}
/** True when config contains meaningful enabled channel settings. */
function hasExplicitChannelConfig(params) {
	const channels = params.config.channels;
	if (!channels || typeof channels !== "object" || Array.isArray(channels)) return false;
	const entry = channels[params.channelId];
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
	const enabled = entry.enabled;
	if (enabled === false) return false;
	return enabled === true || require_config_presence.hasMeaningfulChannelConfig(entry);
}
/** Lists explicitly configured channel ids, excluding global channel config keys. */
function listExplicitConfiguredChannelIdsForConfig(config) {
	const channels = config.channels;
	if (!channels || typeof channels !== "object" || Array.isArray(channels)) return [];
	return Object.keys(channels).filter((channelId) => !IGNORED_CHANNEL_CONFIG_KEYS.has(channelId) && hasExplicitChannelConfig({
		config,
		channelId
	})).toSorted((left, right) => left.localeCompare(right));
}
function recordDeclaresChannel(record, channelId) {
	const normalizedChannelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId) ?? "";
	if (!normalizedChannelId) return false;
	return record.channels.some((ownedChannelId) => ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ownedChannelId) ?? "") === normalizedChannelId);
}
function listManifestEnvConfiguredChannelSignals(params) {
	const signals = [];
	const seen = /* @__PURE__ */ new Set();
	const trustConfig = params.activationSourceConfig ?? params.config;
	const normalizedConfig = require_config_state.normalizePluginsConfig(trustConfig.plugins);
	for (const record of params.records) {
		if (!isChannelPluginEligibleForScopedOwnership({
			plugin: record,
			normalizedConfig,
			rootConfig: trustConfig
		})) continue;
		for (const channelId of record.channels) {
			if (!(record.channelEnvVars?.[channelId] ?? []).some((envVar) => hasNonEmptyEnvValue(params.env, envVar))) continue;
			if (seen.has(channelId)) continue;
			seen.add(channelId);
			signals.push({
				channelId,
				source: "manifest-env"
			});
		}
	}
	return signals.toSorted((left, right) => left.channelId.localeCompare(right.channelId));
}
function normalizeActivationBlockedReason(reason) {
	switch (reason) {
		case "plugins disabled": return "plugins-disabled";
		case "blocked by denylist": return "blocked-by-denylist";
		case "disabled in config": return "plugin-disabled";
		case "not in allowlist": return "not-in-allowlist";
		case "workspace plugin (disabled by default)": return "workspace-disabled-by-default";
		case "bundled (disabled by default)": return "bundled-disabled-by-default";
		default: return "not-activated";
	}
}
function resolveBasePolicyBlockedReason(params) {
	return require_manifest_owner_policy.resolveManifestOwnerBasePolicyBlock(params);
}
function isChannelPluginEligibleForScopedOwnership(params) {
	const allowRestrictiveAllowlistBypass = params.channelId !== void 0 && require_manifest_owner_policy.isBundledManifestOwner(params.plugin) && hasExplicitChannelConfig({
		config: params.rootConfig,
		channelId: params.channelId
	});
	if (!require_manifest_owner_policy.passesManifestOwnerBasePolicy({
		plugin: params.plugin,
		normalizedConfig: params.normalizedConfig,
		allowRestrictiveAllowlistBypass
	})) return false;
	if (require_manifest_owner_policy.isBundledManifestOwner(params.plugin)) return true;
	if (params.plugin.origin === "global" || params.plugin.origin === "config") return require_manifest_owner_policy.hasExplicitManifestOwnerTrust({
		plugin: params.plugin,
		normalizedConfig: params.normalizedConfig
	});
	return require_manifest_owner_policy.isActivatedManifestOwner({
		plugin: params.plugin,
		normalizedConfig: params.normalizedConfig,
		rootConfig: params.rootConfig
	});
}
function evaluateEffectiveChannelPlugin(params) {
	const explicitBundledChannelConfig = require_manifest_owner_policy.isBundledManifestOwner(params.plugin) && hasExplicitChannelConfig({
		config: params.activationSource.rootConfig ?? params.config,
		channelId: params.channelId
	});
	const baseBlockedReason = resolveBasePolicyBlockedReason({
		plugin: params.plugin,
		normalizedConfig: params.normalizedConfig,
		allowRestrictiveAllowlistBypass: explicitBundledChannelConfig
	});
	if (baseBlockedReason) return {
		effective: false,
		pluginId: params.plugin.id,
		blockedReason: baseBlockedReason
	};
	if (!require_manifest_owner_policy.isBundledManifestOwner(params.plugin)) {
		if (params.plugin.origin === "global" || params.plugin.origin === "config") return require_manifest_owner_policy.hasExplicitManifestOwnerTrust({
			plugin: params.plugin,
			normalizedConfig: params.normalizedConfig
		}) ? {
			effective: true,
			pluginId: params.plugin.id
		} : {
			effective: false,
			pluginId: params.plugin.id,
			blockedReason: "untrusted-plugin"
		};
		return require_manifest_owner_policy.isActivatedManifestOwner({
			plugin: params.plugin,
			normalizedConfig: params.normalizedConfig,
			rootConfig: params.activationSource.rootConfig
		}) ? {
			effective: true,
			pluginId: params.plugin.id
		} : {
			effective: false,
			pluginId: params.plugin.id,
			blockedReason: "untrusted-plugin"
		};
	}
	if (explicitBundledChannelConfig) return {
		effective: true,
		pluginId: params.plugin.id
	};
	const activationState = require_config_state.resolveEffectivePluginActivationState({
		id: params.plugin.id,
		origin: params.plugin.origin,
		config: params.normalizedConfig,
		rootConfig: params.config,
		enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(params.plugin),
		activationSource: params.activationSource
	});
	return activationState.enabled ? {
		effective: true,
		pluginId: params.plugin.id
	} : {
		effective: false,
		pluginId: params.plugin.id,
		blockedReason: normalizeActivationBlockedReason(activationState.reason)
	};
}
function addPolicySignal(entries, channelId, source) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channelId);
	if (!normalized) return;
	let sources = entries.get(normalized);
	if (!sources) {
		sources = /* @__PURE__ */ new Set();
		entries.set(normalized, sources);
	}
	sources.add(source);
}
function loadInstalledChannelManifestRecords(params) {
	return require_plugin_registry.loadPluginManifestRegistryForPluginRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeDisabled: true
	}).plugins;
}
/** Resolves effective configured-channel policy rows from config, auth state, env, and manifests. */
function resolveConfiguredChannelPresencePolicy(params) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(params.config, require_agent_scope_config.resolveDefaultAgentId(params.config));
	const records = params.manifestRecords ?? loadInstalledChannelManifestRecords({
		config: params.config,
		workspaceDir,
		env
	});
	const disabledChannelIds = new Set(require_config_presence.listExplicitlyDisabledChannelIdsForConfig(params.config));
	const entrySources = /* @__PURE__ */ new Map();
	for (const channelId of listExplicitConfiguredChannelIdsForConfig(params.config)) addPolicySignal(entrySources, channelId, "explicit-config");
	for (const signal of require_config_presence.listPotentialConfiguredChannelPresenceSignals(params.config, env, { includePersistedAuthState: params.includePersistedAuthState })) {
		if (signal.source === "config") continue;
		addPolicySignal(entrySources, signal.channelId, signal.source);
	}
	for (const signal of listManifestEnvConfiguredChannelSignals({
		records,
		config: params.config,
		activationSourceConfig: params.activationSourceConfig,
		env
	})) addPolicySignal(entrySources, signal.channelId, signal.source);
	for (const channelId of disabledChannelIds) entrySources.delete(channelId);
	const activationSource = require_config_state.createPluginActivationSource({ config: params.activationSourceConfig ?? params.config });
	const normalizedConfig = activationSource.plugins;
	const entries = [];
	for (const channelId of normalizeChannelIds(entrySources.keys())) {
		const owningRecords = records.filter((record) => recordDeclaresChannel(record, channelId));
		const evaluations = owningRecords.map((plugin) => evaluateEffectiveChannelPlugin({
			plugin,
			channelId,
			normalizedConfig,
			config: params.config,
			activationSource
		}));
		const effectivePluginIds = evaluations.filter((entry) => entry.effective).map((entry) => entry.pluginId);
		const blockedReasons = owningRecords.length === 0 ? ["no-channel-owner"] : [...new Set(evaluations.map((entry) => entry.blockedReason).filter((reason) => Boolean(reason)))].toSorted((left, right) => left.localeCompare(right));
		entries.push({
			channelId,
			sources: [...entrySources.get(channelId) ?? []].toSorted((left, right) => left.localeCompare(right)),
			effective: effectivePluginIds.length > 0,
			pluginIds: (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(effectivePluginIds),
			blockedReasons
		});
	}
	return entries;
}
/** Lists effective channel ids available to read-only scoped discovery. */
function listConfiguredChannelIdsForReadOnlyScope(params) {
	return resolveConfiguredChannelPresencePolicy(params).filter((entry) => entry.effective).map((entry) => entry.channelId);
}
/** True when read-only scoped discovery has any effective configured channel. */
function hasConfiguredChannelsForReadOnlyScope(params) {
	return listConfiguredChannelIdsForReadOnlyScope(params).length > 0;
}
/** Lists channel ids that should be announced as configured for operators. */
function listConfiguredAnnounceChannelIdsForConfig(params) {
	const disabledChannelIds = new Set(require_config_presence.listExplicitlyDisabledChannelIdsForConfig(params.config));
	const trustConfig = params.activationSourceConfig ?? params.config;
	const normalizedConfig = require_config_state.normalizePluginsConfig(trustConfig.plugins);
	const policy = resolveConfiguredChannelPresencePolicy({
		config: params.config,
		activationSourceConfig: trustConfig,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includePersistedAuthState: false,
		manifestRecords: params.manifestRecords
	});
	const policyDisabledChannelIds = new Set(policy.filter((entry) => !entry.effective && entry.blockedReasons.some((reason) => ANNOUNCE_SUPPRESSING_BLOCKED_REASONS.has(reason))).map((entry) => entry.channelId));
	return normalizeChannelIds([...listExplicitConfiguredChannelIdsForConfig(params.config).filter((channelId) => normalizedConfig.enabled && !normalizedConfig.deny.includes(channelId) && normalizedConfig.entries[channelId]?.enabled !== false && (normalizedConfig.allow.length === 0 || normalizedConfig.allow.includes(channelId))), ...policy.filter((entry) => entry.effective).map((entry) => entry.channelId)]).filter((channelId) => !disabledChannelIds.has(channelId) && !policyDisabledChannelIds.has(channelId));
}
function resolveScopedChannelOwnerPluginIds(params) {
	const channelIds = normalizeChannelIds(params.channelIds);
	if (channelIds.length === 0) return [];
	const records = params.manifestRecords ?? loadInstalledChannelManifestRecords({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	const trustConfig = params.activationSourceConfig ?? params.config;
	const normalizedConfig = require_config_state.normalizePluginsConfig(trustConfig.plugins);
	const candidateIds = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(channelIds.flatMap((channelId) => {
		return resolveManifestActivationPluginIds({
			trigger: {
				kind: "channel",
				channel: channelId
			},
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			manifestRecords: records,
			allowRestrictiveAllowlistBypass: hasExplicitChannelConfig({
				config: trustConfig,
				channelId
			})
		});
	}));
	if (candidateIds.length === 0) return [];
	const candidateIdSet = new Set(candidateIds);
	return records.filter((plugin) => {
		if (!candidateIdSet.has(plugin.id)) return false;
		return isChannelPluginEligibleForScopedOwnership({
			plugin,
			normalizedConfig,
			rootConfig: trustConfig,
			channelId: channelIds.find((channelId) => recordDeclaresChannel(plugin, channelId))
		});
	}).map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
}
/** Resolves plugin ids discoverable for scoped channel activation. */
function resolveDiscoverableScopedChannelPluginIds(params) {
	return resolveScopedChannelOwnerPluginIds(params);
}
/** Resolves plugin ids that own currently configured channels. */
function resolveConfiguredChannelPluginIds(params) {
	const configuredChannelIds = normalizeChannelIds([...listConfiguredChannelIdsForReadOnlyScope({
		config: params.config,
		activationSourceConfig: params.activationSourceConfig,
		workspaceDir: params.workspaceDir,
		env: params.env
	}), ...listExplicitConfiguredChannelIdsForConfig(params.activationSourceConfig ?? params.config)]);
	if (configuredChannelIds.length === 0) return [];
	return resolveScopedChannelOwnerPluginIds({
		...params,
		channelIds: configuredChannelIds
	});
}
//#endregion
Object.defineProperty(exports, "channel_presence_policy_exports", {
	enumerable: true,
	get: function() {
		return channel_presence_policy_exports;
	}
});
Object.defineProperty(exports, "hasConfiguredChannelsForReadOnlyScope", {
	enumerable: true,
	get: function() {
		return hasConfiguredChannelsForReadOnlyScope;
	}
});
Object.defineProperty(exports, "hasExplicitChannelConfig", {
	enumerable: true,
	get: function() {
		return hasExplicitChannelConfig;
	}
});
Object.defineProperty(exports, "isSafeChannelEnvVarTriggerName", {
	enumerable: true,
	get: function() {
		return isSafeChannelEnvVarTriggerName;
	}
});
Object.defineProperty(exports, "listConfiguredAnnounceChannelIdsForConfig", {
	enumerable: true,
	get: function() {
		return listConfiguredAnnounceChannelIdsForConfig;
	}
});
Object.defineProperty(exports, "listConfiguredChannelIdsForReadOnlyScope", {
	enumerable: true,
	get: function() {
		return listConfiguredChannelIdsForReadOnlyScope;
	}
});
Object.defineProperty(exports, "listExplicitConfiguredChannelIdsForConfig", {
	enumerable: true,
	get: function() {
		return listExplicitConfiguredChannelIdsForConfig;
	}
});
Object.defineProperty(exports, "resolveConfiguredChannelPluginIds", {
	enumerable: true,
	get: function() {
		return resolveConfiguredChannelPluginIds;
	}
});
Object.defineProperty(exports, "resolveConfiguredChannelPresencePolicy", {
	enumerable: true,
	get: function() {
		return resolveConfiguredChannelPresencePolicy;
	}
});
Object.defineProperty(exports, "resolveDiscoverableScopedChannelPluginIds", {
	enumerable: true,
	get: function() {
		return resolveDiscoverableScopedChannelPluginIds;
	}
});
Object.defineProperty(exports, "resolveManifestActivationPlan", {
	enumerable: true,
	get: function() {
		return resolveManifestActivationPlan;
	}
});
Object.defineProperty(exports, "resolveManifestActivationPluginIds", {
	enumerable: true,
	get: function() {
		return resolveManifestActivationPluginIds;
	}
});
