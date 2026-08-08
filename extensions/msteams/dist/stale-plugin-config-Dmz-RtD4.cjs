require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_installed_plugin_index_record_reader = require("./installed-plugin-index-record-reader-SpcSi_Wi.cjs");
const require_official_external_plugin_catalog = require("./official-external-plugin-catalog-BBggNRZa.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
require("./installed-plugin-index-records-2CPyZnZe.cjs");
const require_object = require("./object-Be4AQnVV.cjs");
//#region src/commands/doctor/shared/stale-plugin-repair-preservation.ts
function normalizeIds(ids) {
	return new Set([...ids ?? []].map((id) => require_config_state.normalizePluginId(id)).filter((id) => Boolean(id)));
}
function filterRepairableStalePluginHits(params) {
	const preserveIds = normalizeIds(params.preservePluginIds);
	const surfacePreserveIds = Object.fromEntries(Object.entries(params.surfacePreservePluginIds ?? {}).map(([surface, ids]) => [surface, normalizeIds(ids)]));
	return params.hits.filter((hit) => {
		const id = require_config_state.normalizePluginId(hit.pluginId);
		return !preserveIds.has(id) && !surfacePreserveIds[hit.surface]?.has(id);
	});
}
//#endregion
//#region src/commands/doctor/shared/stale-plugin-config.ts
const CHANNEL_CONFIG_META_KEYS = /* @__PURE__ */ new Set(["defaults", "modelByChannel"]);
function collectPluginRegistryState(cfg, env) {
	const environment = env ?? process.env;
	const registry = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: cfg,
		workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg)) ?? void 0,
		env: environment
	}).manifestRegistry;
	const knownIds = new Set(registry.plugins.map((plugin) => plugin.id));
	const officialIds = new Set(require_official_external_plugin_catalog.listOfficialExternalPluginCatalogEntries().map((entry) => require_config_state.normalizePluginId(require_official_external_plugin_catalog.resolveOfficialExternalPluginId(entry) ?? "")).filter(Boolean));
	const installedIds = /* @__PURE__ */ new Set();
	for (const pluginId of Object.keys(cfg.plugins?.installs ?? {})) {
		const normalized = require_config_state.normalizePluginId(pluginId);
		if (normalized) installedIds.add(normalized);
	}
	try {
		for (const pluginId of Object.keys(require_installed_plugin_index_record_reader.loadInstalledPluginIndexInstallRecordsSync({ env: environment }))) {
			const normalized = require_config_state.normalizePluginId(pluginId);
			if (normalized) installedIds.add(normalized);
		}
	} catch {}
	const knownChannelIds = new Set(require_ids.CHANNEL_IDS.map((channelId) => require_config_state.normalizePluginId(channelId)));
	for (const plugin of registry.plugins) for (const channelId of plugin.channels) {
		const normalized = require_config_state.normalizePluginId(channelId);
		if (normalized) knownChannelIds.add(normalized);
	}
	return {
		knownIds,
		officialIds,
		knownChannelIds,
		missingInstalledIds: new Set([...installedIds].filter((pluginId) => !knownIds.has(pluginId))),
		hasDiscoveryErrors: registry.diagnostics.some((diag) => diag.level === "error")
	};
}
/** Return true when plugin discovery errors should pause stale-plugin auto-removal. */
function isStalePluginAutoRepairBlocked(cfg, env) {
	if (cfg.plugins?.enabled === false) return false;
	return collectPluginRegistryState(cfg, env).hasDiscoveryErrors;
}
/** Scan plugin/channel config surfaces for ids no longer present in manifests or installs. */
function scanStalePluginConfig(cfg, env) {
	if (cfg.plugins?.enabled === false) return [];
	return scanStalePluginConfigWithState(cfg, collectPluginRegistryState(cfg, env ?? process.env));
}
function scanStalePluginConfigWithState(cfg, registryState) {
	const plugins = require_object.asObjectRecord(cfg.plugins);
	const { knownIds, officialIds } = registryState;
	const hits = [];
	const staleEvidenceIds = new Set(registryState.missingInstalledIds);
	for (const surface of ["allow", "deny"]) {
		const list = Array.isArray(plugins?.[surface]) ? plugins[surface] : [];
		for (const rawPluginId of list) {
			if (typeof rawPluginId !== "string") continue;
			const pluginId = require_config_state.normalizePluginId(rawPluginId);
			if (!pluginId || knownIds.has(pluginId) || officialIds.has(pluginId) || registryState.knownChannelIds.has(pluginId)) continue;
			hits.push({
				pluginId: rawPluginId,
				pathLabel: `plugins.${surface}`,
				surface
			});
			staleEvidenceIds.add(pluginId);
		}
	}
	const entries = require_object.asObjectRecord(plugins?.entries);
	if (entries) for (const rawPluginId of Object.keys(entries)) {
		const pluginId = require_config_state.normalizePluginId(rawPluginId);
		if (!pluginId || knownIds.has(pluginId) || officialIds.has(pluginId) || registryState.knownChannelIds.has(pluginId)) continue;
		hits.push({
			pluginId: rawPluginId,
			pathLabel: `plugins.entries.${rawPluginId}`,
			surface: "entries"
		});
		staleEvidenceIds.add(pluginId);
	}
	const slots = require_object.asObjectRecord(plugins?.slots);
	if (slots) for (const slotKey of ["memory", "contextEngine"]) {
		const rawPluginId = slots[slotKey];
		if (typeof rawPluginId !== "string") continue;
		const pluginId = require_config_state.normalizePluginId(rawPluginId);
		const defaultSlotId = require_config_activation_shared.defaultSlotIdForKey(slotKey);
		if (!pluginId || rawPluginId.trim().toLowerCase() === "none" || pluginId === require_config_state.normalizePluginId(defaultSlotId) || knownIds.has(pluginId)) continue;
		hits.push({
			pluginId: rawPluginId,
			pathLabel: `plugins.slots.${slotKey}`,
			surface: "slot",
			slotKey
		});
	}
	const staleChannelIds = collectDanglingChannelIds({
		cfg,
		registryState,
		staleEvidenceIds
	});
	for (const channelId of staleChannelIds) hits.push({
		pluginId: channelId,
		pathLabel: `channels.${channelId}`,
		surface: "channel"
	});
	for (const hit of collectDependentChannelConfigHits(cfg, staleChannelIds)) hits.push(hit);
	return hits;
}
function collectDanglingChannelIds(params) {
	const channels = require_object.asObjectRecord(params.cfg.channels);
	if (!channels) return [];
	const ids = [];
	const seen = /* @__PURE__ */ new Set();
	for (const channelId of Object.keys(channels)) {
		if (CHANNEL_CONFIG_META_KEYS.has(channelId)) continue;
		const normalized = require_config_state.normalizePluginId(channelId);
		if (!normalized || params.registryState.knownChannelIds.has(normalized) || !params.staleEvidenceIds.has(normalized) || seen.has(normalized)) continue;
		seen.add(normalized);
		ids.push(channelId);
	}
	return ids;
}
function collectDependentChannelConfigHits(cfg, channelIds) {
	if (channelIds.length === 0) return [];
	const staleChannelIds = new Set(channelIds.map((channelId) => require_config_state.normalizePluginId(channelId)));
	const hits = [];
	const defaultTarget = cfg.agents?.defaults?.heartbeat?.target;
	if (typeof defaultTarget === "string" && staleChannelIds.has(require_config_state.normalizePluginId(defaultTarget))) hits.push({
		pluginId: defaultTarget,
		pathLabel: "agents.defaults.heartbeat.target",
		surface: "heartbeat"
	});
	const agents = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	for (const [index, agent] of agents.entries()) {
		const target = agent?.heartbeat?.target;
		if (typeof target !== "string" || !staleChannelIds.has(require_config_state.normalizePluginId(target))) continue;
		hits.push({
			pluginId: target,
			pathLabel: `agents.list.${index}.heartbeat.target`,
			surface: "heartbeat"
		});
	}
	const modelByChannel = require_object.asObjectRecord(cfg.channels?.modelByChannel);
	if (modelByChannel) for (const [providerId, channelMap] of Object.entries(modelByChannel)) {
		const channels = require_object.asObjectRecord(channelMap);
		if (!channels) continue;
		for (const channelId of Object.keys(channels)) {
			if (!staleChannelIds.has(require_config_state.normalizePluginId(channelId))) continue;
			hits.push({
				pluginId: channelId,
				pathLabel: `channels.modelByChannel.${providerId}.${channelId}`,
				surface: "modelByChannel"
			});
		}
	}
	return hits;
}
const isPolicySurfaceHit = (hit) => hit.surface === "allow" || hit.surface === "deny" || hit.surface === "entries";
function formatStalePluginHitWarning(hit) {
	if (isPolicySurfaceHit(hit)) return null;
	if (hit.surface === "slot") return `- ${hit.pathLabel}: slot references missing plugin "${hit.pluginId}".`;
	if (hit.surface === "channel") return `- ${hit.pathLabel}: dangling channel config for missing plugin "${hit.pluginId}" was found.`;
	if (hit.surface === "heartbeat") return `- ${hit.pathLabel}: heartbeat target references missing channel plugin "${hit.pluginId}".`;
	return `- ${hit.pathLabel}: model override references missing channel plugin "${hit.pluginId}".`;
}
/** Format warnings for stale plugin config hits. */
function collectStalePluginConfigWarnings(params) {
	const hits = filterRepairableStalePluginHits(params);
	if (hits.length === 0) return [];
	const policyPluginIds = [...new Set(hits.filter(isPolicySurfaceHit).map((hit) => hit.pluginId))].toSorted((a, b) => a.localeCompare(b));
	const lines = hits.map((hit) => formatStalePluginHitWarning(hit)).filter((line) => line !== null);
	if (policyPluginIds.length > 0) lines.unshift(`- Stale plugin references (plugins.allow/deny/entries): ${policyPluginIds.join(", ")}.`);
	if (params.autoRepairBlocked) lines.push(`- Auto-removal is paused because plugin discovery currently has errors. Fix plugin discovery first, then rerun "${params.doctorFixCommand}".`);
	else lines.push(`- Run "${params.doctorFixCommand}" to remove stale plugin ids and dangling channel references.`);
	return lines.map((line) => require_ansi.sanitizeForLog(line));
}
/** Remove stale plugin ids and dangling channel references when discovery is healthy. */
function maybeRepairStalePluginConfig(cfg, env, params) {
	if (cfg.plugins?.enabled === false) return {
		config: cfg,
		changes: []
	};
	const registryState = collectPluginRegistryState(cfg, env ?? process.env);
	if (registryState.hasDiscoveryErrors) return {
		config: cfg,
		changes: []
	};
	const hits = filterRepairableStalePluginHits({
		hits: scanStalePluginConfigWithState(cfg, registryState),
		preservePluginIds: params?.preservePluginIds,
		surfacePreservePluginIds: params?.surfacePreservePluginIds
	});
	if (hits.length === 0) return {
		config: cfg,
		changes: []
	};
	const next = structuredClone(cfg);
	const nextPlugins = require_object.asObjectRecord(next.plugins);
	const allowIds = hits.filter((hit) => hit.surface === "allow").map((hit) => hit.pluginId);
	if (allowIds.length > 0 && Array.isArray(nextPlugins?.allow)) {
		const staleAllowIds = new Set(allowIds.map((pluginId) => require_config_state.normalizePluginId(pluginId)));
		nextPlugins.allow = nextPlugins.allow.filter((pluginId) => typeof pluginId !== "string" || !staleAllowIds.has(require_config_state.normalizePluginId(pluginId)));
	}
	const denyIds = hits.filter((hit) => hit.surface === "deny").map((hit) => hit.pluginId);
	if (denyIds.length > 0 && Array.isArray(nextPlugins?.deny)) {
		const staleDenyIds = new Set(denyIds.map((pluginId) => require_config_state.normalizePluginId(pluginId)));
		nextPlugins.deny = nextPlugins.deny.filter((pluginId) => typeof pluginId !== "string" || !staleDenyIds.has(require_config_state.normalizePluginId(pluginId)));
	}
	const entryIds = hits.filter((hit) => hit.surface === "entries").map((hit) => hit.pluginId);
	if (entryIds.length > 0) {
		const entries = require_object.asObjectRecord(nextPlugins?.entries);
		if (entries) {
			const staleEntryIds = new Set(entryIds.map((pluginId) => require_config_state.normalizePluginId(pluginId)));
			for (const pluginId of Object.keys(entries)) if (staleEntryIds.has(require_config_state.normalizePluginId(pluginId))) delete entries[pluginId];
		}
	}
	const slotHits = hits.filter((hit) => hit.surface === "slot" && hit.slotKey !== void 0);
	if (slotHits.length > 0) {
		const slots = require_object.asObjectRecord(nextPlugins?.slots);
		if (slots) for (const hit of slotHits) slots[hit.slotKey] = require_config_activation_shared.defaultSlotIdForKey(hit.slotKey);
	}
	const channelIds = hits.filter((hit) => hit.surface === "channel").map((hit) => hit.pluginId);
	if (channelIds.length > 0) removeDanglingChannelReferences(next, channelIds);
	const changes = [];
	if (allowIds.length > 0) changes.push(`- plugins.allow: removed ${allowIds.length} stale plugin id${allowIds.length === 1 ? "" : "s"} (${allowIds.join(", ")})`);
	if (denyIds.length > 0) changes.push(`- plugins.deny: removed ${denyIds.length} stale plugin id${denyIds.length === 1 ? "" : "s"} (${denyIds.join(", ")})`);
	if (entryIds.length > 0) changes.push(`- plugins.entries: removed ${entryIds.length} stale plugin entr${entryIds.length === 1 ? "y" : "ies"} (${entryIds.join(", ")})`);
	if (slotHits.length > 0) changes.push(`- plugins.slots: reset ${slotHits.length} stale plugin slot${slotHits.length === 1 ? "" : "s"} (${slotHits.map((hit) => `${hit.slotKey}: ${hit.pluginId} -> ${require_config_activation_shared.defaultSlotIdForKey(hit.slotKey)}`).join(", ")})`);
	if (channelIds.length > 0) {
		changes.push(`- channels: removed ${channelIds.length} stale channel config${channelIds.length === 1 ? "" : "s"} (${channelIds.join(", ")})`);
		const heartbeatCount = hits.filter((hit) => hit.surface === "heartbeat").length;
		if (heartbeatCount > 0) changes.push(`- agents heartbeat: removed ${heartbeatCount} stale heartbeat target${heartbeatCount === 1 ? "" : "s"} (${channelIds.join(", ")})`);
		const modelByChannelCount = hits.filter((hit) => hit.surface === "modelByChannel").length;
		if (modelByChannelCount > 0) changes.push(`- channels.modelByChannel: removed ${modelByChannelCount} stale channel model override${modelByChannelCount === 1 ? "" : "s"} (${channelIds.join(", ")})`);
	}
	return {
		config: next,
		changes
	};
}
function removeDanglingChannelReferences(config, channelIds) {
	const staleChannelIds = new Set(channelIds.map((channelId) => require_config_state.normalizePluginId(channelId)));
	const channels = require_object.asObjectRecord(config.channels);
	if (channels) {
		for (const channelId of Object.keys(channels)) {
			if (CHANNEL_CONFIG_META_KEYS.has(channelId)) continue;
			if (staleChannelIds.has(require_config_state.normalizePluginId(channelId))) delete channels[channelId];
		}
		const modelByChannel = require_object.asObjectRecord(channels.modelByChannel);
		if (modelByChannel) {
			for (const [providerId, channelMap] of Object.entries(modelByChannel)) {
				const channelsForProvider = require_object.asObjectRecord(channelMap);
				if (!channelsForProvider) continue;
				for (const channelId of Object.keys(channelsForProvider)) if (staleChannelIds.has(require_config_state.normalizePluginId(channelId))) delete channelsForProvider[channelId];
				if (Object.keys(channelsForProvider).length === 0) delete modelByChannel[providerId];
			}
			if (Object.keys(modelByChannel).length === 0) delete channels.modelByChannel;
		}
	}
	const defaultsHeartbeat = config.agents?.defaults?.heartbeat;
	if (defaultsHeartbeat && typeof defaultsHeartbeat.target === "string" && staleChannelIds.has(require_config_state.normalizePluginId(defaultsHeartbeat.target))) delete defaultsHeartbeat.target;
	const agents = Array.isArray(config.agents?.list) ? config.agents.list : [];
	for (const agent of agents) {
		const heartbeat = agent.heartbeat;
		if (heartbeat && typeof heartbeat.target === "string" && staleChannelIds.has(require_config_state.normalizePluginId(heartbeat.target))) delete heartbeat.target;
	}
}
//#endregion
exports.collectStalePluginConfigWarnings = collectStalePluginConfigWarnings;
exports.isStalePluginAutoRepairBlocked = isStalePluginAutoRepairBlocked;
exports.maybeRepairStalePluginConfig = maybeRepairStalePluginConfig;
exports.scanStalePluginConfig = scanStalePluginConfig;
