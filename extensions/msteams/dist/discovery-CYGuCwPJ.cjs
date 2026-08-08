const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_channel_meta = require("./channel-meta-Bapt3Qtj.cjs");
const require_registry = require("./registry-BWWaGAnQ.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_manifest_owner_policy = require("./manifest-owner-policy-BI1K0z-h.cjs");
const require_channel_configured_shared = require("./channel-configured-shared-BK0nEQGb.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
const require_catalog = require("./catalog-B1bu3qBh.cjs");
const require_manifest_contribution_ids = require("./manifest-contribution-ids-DiU20iE0.cjs");
//#region src/commands/channel-setup/trusted-catalog.ts
const LOCAL_CHANNEL_PLUGIN_ORIGIN_SET = /* @__PURE__ */ new Set([
	"workspace",
	"config",
	"global"
]);
const MAX_TRUSTED_CATALOG_FALLBACKS = 16;
function isLocalChannelPluginOrigin(origin) {
	return origin !== void 0 && LOCAL_CHANNEL_PLUGIN_ORIGIN_SET.has(origin);
}
function resolveEffectiveTrustConfig(cfg, env) {
	return require_plugin_auto_enable.applyPluginAutoEnable({
		config: cfg,
		env: env ?? process.env
	}).config;
}
function resolveTrustedCatalogExtraPaths(cfg) {
	const extraPaths = require_config_state.normalizePluginsConfig(cfg.plugins).loadPaths;
	return extraPaths.length > 0 ? extraPaths : void 0;
}
function isTrustedLocalChannelCatalogEntry(entry, cfg, env) {
	if (!isLocalChannelPluginOrigin(entry?.origin)) return true;
	if (!entry.pluginId) return false;
	const effectiveConfig = resolveEffectiveTrustConfig(cfg, env);
	const normalizedPlugins = require_config_state.normalizePluginsConfig(effectiveConfig.plugins);
	if (require_manifest_owner_policy.resolveManifestOwnerBasePolicyBlock({
		plugin: { id: entry.pluginId },
		normalizedConfig: normalizedPlugins
	}) !== null) return false;
	const activationState = require_config_state.resolveEffectivePluginActivationState({
		id: entry.pluginId,
		origin: entry.origin,
		config: normalizedPlugins,
		rootConfig: effectiveConfig
	});
	return require_manifest_owner_policy.hasExplicitManifestOwnerTrust({
		plugin: { id: entry.pluginId },
		normalizedConfig: normalizedPlugins
	}) || entry.origin === "workspace" && activationState.source === "auto";
}
function resolveRejectedCatalogLookup(rejected) {
	const excludePluginRefs = rejected.flatMap((entry) => entry.pluginId?.trim() ? [{
		pluginId: entry.pluginId.trim(),
		...entry.origin ? { origin: entry.origin } : {}
	}] : []);
	const excludeOrigins = rejected.flatMap((entry) => isLocalChannelPluginOrigin(entry.origin) && !entry.pluginId ? [entry.origin] : []);
	const lookup = {};
	if (excludeOrigins.length > 0) lookup.excludeOrigins = excludeOrigins;
	if (excludePluginRefs.length > 0) lookup.excludePluginRefs = excludePluginRefs;
	return lookup;
}
function resolveRejectedCatalogEntryKey(entry) {
	const pluginId = entry.pluginId?.trim();
	if (pluginId) return `plugin:${entry.origin ?? ""}:${pluginId}`;
	return isLocalChannelPluginOrigin(entry.origin) ? `origin:${entry.origin}` : null;
}
function resolveTrustedCatalogEntry(channelId, params, rejected = []) {
	const extraPaths = resolveTrustedCatalogExtraPaths(params.cfg);
	const rejectedEntries = [...rejected];
	const seenRejectedKeys = new Set(rejectedEntries.flatMap((entry) => {
		const key = resolveRejectedCatalogEntryKey(entry);
		return key ? [key] : [];
	}));
	for (let attempts = 0; attempts <= MAX_TRUSTED_CATALOG_FALLBACKS; attempts += 1) {
		const candidate = require_catalog.getChannelPluginCatalogEntry(channelId, {
			workspaceDir: params.workspaceDir,
			env: params.env,
			...extraPaths ? { extraPaths } : {},
			...resolveRejectedCatalogLookup(rejectedEntries)
		});
		if (!candidate) return;
		if (isTrustedLocalChannelCatalogEntry(candidate, params.cfg, params.env)) return candidate;
		const rejectedKey = resolveRejectedCatalogEntryKey(candidate);
		if (rejectedKey && seenRejectedKeys.has(rejectedKey)) return;
		if (rejectedKey) seenRejectedKeys.add(rejectedKey);
		rejectedEntries.push(candidate);
	}
}
/** Resolve a catalog entry, falling back to non-workspace metadata when workspace entry is untrusted. */
function getTrustedChannelPluginCatalogEntry(channelId, params) {
	return resolveTrustedCatalogEntry(channelId, params);
}
function listChannelPluginCatalogEntriesWithTrustedFallback(params, onMissingFallback) {
	const extraPaths = resolveTrustedCatalogExtraPaths(params.cfg);
	return require_catalog.listRawChannelPluginCatalogEntries({
		workspaceDir: params.workspaceDir,
		env: params.env,
		...extraPaths ? { extraPaths } : {}
	}).flatMap((entry) => {
		if (isTrustedLocalChannelCatalogEntry(entry, params.cfg, params.env)) return [entry];
		const fallback = resolveTrustedCatalogEntry(entry.id, params, [entry]);
		return fallback ? [fallback] : onMissingFallback(entry);
	});
}
/** List trusted catalog entries, dropping untrusted workspace-only shadows. */
function listTrustedChannelPluginCatalogEntries(params) {
	return listChannelPluginCatalogEntriesWithTrustedFallback(params, () => []);
}
/** List setup discovery entries, preserving untrusted workspace-only entries for install prompts. */
function listSetupDiscoveryChannelPluginCatalogEntries(params) {
	return listChannelPluginCatalogEntriesWithTrustedFallback(params, (entry) => [entry]);
}
//#endregion
//#region src/commands/channel-setup/discovery.ts
var discovery_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	isCatalogChannelInstalled: () => isCatalogChannelInstalled,
	listManifestInstalledChannelIds: () => listManifestInstalledChannelIds,
	resolveChannelSetupEntries: () => resolveChannelSetupEntries,
	shouldShowChannelInSetup: () => shouldShowChannelInSetup
});
/** Return true when channel metadata should appear in setup/onboarding choices. */
function shouldShowChannelInSetup(meta) {
	return require_channel_meta.isChannelVisibleInSetup(meta);
}
function resolveWorkspaceDir(cfg, workspaceDir) {
	return workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg));
}
/** List channel ids contributed by currently installed manifest-backed plugins. */
function listManifestInstalledChannelIds(params) {
	const resolvedConfig = require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.cfg,
		env: params.env ?? process.env
	}).config;
	const workspaceDir = resolveWorkspaceDir(resolvedConfig, params.workspaceDir);
	return new Set(require_manifest_contribution_ids.listManifestChannelContributionIds({
		config: resolvedConfig,
		workspaceDir,
		env: params.env ?? process.env
	}).map((channelId) => channelId));
}
/** Return true when a trusted catalog channel is already installed through plugin manifests. */
function isCatalogChannelInstalled(params) {
	return listManifestInstalledChannelIds(params).has(params.entry.id);
}
/** Merge configured channels and installable catalog channels into setup display buckets. */
function resolveChannelSetupEntries(params) {
	const workspaceDir = resolveWorkspaceDir(params.cfg, params.workspaceDir);
	const manifestInstalledIds = listManifestInstalledChannelIds({
		cfg: params.cfg,
		workspaceDir,
		env: params.env
	});
	const installedPluginIds = new Set(params.installedPlugins.map((plugin) => plugin.id));
	const installedCatalogEntriesSource = listTrustedChannelPluginCatalogEntries({
		cfg: params.cfg,
		workspaceDir,
		env: params.env
	});
	const installableCatalogEntriesSource = listSetupDiscoveryChannelPluginCatalogEntries({
		cfg: params.cfg,
		workspaceDir,
		env: params.env
	});
	const installedCatalogEntries = installedCatalogEntriesSource.filter((entry) => !installedPluginIds.has(entry.id) && manifestInstalledIds.has(entry.id) && shouldShowChannelInSetup(entry.meta)).map((entry) => Object.assign({}, entry, { meta: require_bundled.normalizeChannelMeta({
		id: entry.id,
		meta: entry.meta
	}) }));
	const installableCatalogEntries = installableCatalogEntriesSource.filter((entry) => !installedPluginIds.has(entry.id) && !manifestInstalledIds.has(entry.id) && !require_channel_configured_shared.isStaticallyChannelConfigured(params.cfg, entry.id, params.env ?? process.env) && shouldShowChannelInSetup(entry.meta)).map((entry) => Object.assign({}, entry, { meta: require_bundled.normalizeChannelMeta({
		id: entry.id,
		meta: entry.meta
	}) }));
	const metaById = /* @__PURE__ */ new Map();
	for (const meta of require_registry.listChatChannels()) metaById.set(meta.id, require_bundled.normalizeChannelMeta({
		id: meta.id,
		meta
	}));
	for (const plugin of params.installedPlugins) metaById.set(plugin.id, require_bundled.normalizeChannelMeta({
		id: plugin.id,
		meta: plugin.meta,
		existing: metaById.get(plugin.id)
	}));
	for (const entry of installedCatalogEntries) if (!metaById.has(entry.id)) metaById.set(entry.id, require_bundled.normalizeChannelMeta({
		id: entry.id,
		meta: entry.meta,
		existing: metaById.get(entry.id)
	}));
	for (const entry of installableCatalogEntries) if (!metaById.has(entry.id)) metaById.set(entry.id, require_bundled.normalizeChannelMeta({
		id: entry.id,
		meta: entry.meta,
		existing: metaById.get(entry.id)
	}));
	return {
		entries: Array.from(metaById, ([id, meta]) => ({
			id,
			meta
		})).filter((entry) => shouldShowChannelInSetup(entry.meta)),
		installedCatalogEntries,
		installableCatalogEntries,
		installedCatalogById: new Map(installedCatalogEntries.map((entry) => [entry.id, entry])),
		installableCatalogById: new Map(installableCatalogEntries.map((entry) => [entry.id, entry]))
	};
}
//#endregion
Object.defineProperty(exports, "discovery_exports", {
	enumerable: true,
	get: function() {
		return discovery_exports;
	}
});
Object.defineProperty(exports, "getTrustedChannelPluginCatalogEntry", {
	enumerable: true,
	get: function() {
		return getTrustedChannelPluginCatalogEntry;
	}
});
Object.defineProperty(exports, "listTrustedChannelPluginCatalogEntries", {
	enumerable: true,
	get: function() {
		return listTrustedChannelPluginCatalogEntries;
	}
});
Object.defineProperty(exports, "resolveChannelSetupEntries", {
	enumerable: true,
	get: function() {
		return resolveChannelSetupEntries;
	}
});
Object.defineProperty(exports, "shouldShowChannelInSetup", {
	enumerable: true,
	get: function() {
		return shouldShowChannelInSetup;
	}
});
