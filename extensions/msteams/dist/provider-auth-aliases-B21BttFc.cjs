const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/plugin-config-trust.ts
/** Applies workspace plugin allow/deny config before manifest records reach control-plane decisions. */
/** Normalizes plugin ids used in config allow/deny/entry lists. */
function normalizePluginConfigId(id) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(id) ?? "";
}
function hasPluginConfigId(list, pluginId) {
	return Array.isArray(list) && list.some((entry) => normalizePluginConfigId(entry) === pluginId);
}
function findPluginConfigEntry(entries, pluginId) {
	if (!entries || typeof entries !== "object" || Array.isArray(entries)) return;
	for (const [key, value] of Object.entries(entries)) {
		if (normalizePluginConfigId(key) !== pluginId) continue;
		return value && typeof value === "object" && !Array.isArray(value) ? value : {};
	}
}
/** Resolves whether workspace plugin config allows one plugin manifest record. */
function isWorkspacePluginAllowedByConfig(params) {
	const pluginsConfig = params.config?.plugins;
	if (pluginsConfig?.enabled === false) return false;
	const pluginId = normalizePluginConfigId(params.plugin.id);
	if (!pluginId || hasPluginConfigId(pluginsConfig?.deny, pluginId)) return false;
	const entry = findPluginConfigEntry(pluginsConfig?.entries, pluginId);
	if (entry?.enabled === false) return false;
	if (entry?.enabled === true || hasPluginConfigId(pluginsConfig?.allow, pluginId)) return true;
	return params.isImplicitlyAllowed?.(pluginId) ?? false;
}
//#endregion
//#region src/agents/provider-auth-aliases.ts
/**
* Provider auth alias resolution.
* Maps deprecated and plugin-defined provider IDs to canonical credential
* providers, with trusted workspace plugin handling and process-stable caching.
*/
var provider_auth_aliases_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolveProviderAuthAliasMap: () => resolveProviderAuthAliasMap,
	resolveProviderIdForAuth: () => resolveProviderIdForAuth
});
const PROVIDER_AUTH_ALIAS_ORIGIN_PRIORITY = {
	config: 0,
	bundled: 1,
	global: 2,
	workspace: 3
};
let providerAuthAliasMapCache = /* @__PURE__ */ new WeakMap();
function buildProviderAuthAliasMapCacheKey(params, env) {
	return JSON.stringify({
		pluginControlPlane: require_current_plugin_metadata_snapshot.resolvePluginControlPlaneFingerprint({
			config: params?.config,
			env,
			workspaceDir: params?.workspaceDir
		}),
		includeUntrustedWorkspacePlugins: params?.includeUntrustedWorkspacePlugins === true,
		plugins: params?.config?.plugins ?? null
	});
}
/** Clear provider auth alias cache for tests that mutate plugin metadata. */
function resetProviderAuthAliasMapCacheForTest() {
	providerAuthAliasMapCache = /* @__PURE__ */ new WeakMap();
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.providerAuthAliasesTestApi")] = { resetProviderAuthAliasMapCacheForTest };
function resolveProviderAuthAliasOriginPriority(origin) {
	if (!origin) return Number.MAX_SAFE_INTEGER;
	return PROVIDER_AUTH_ALIAS_ORIGIN_PRIORITY[origin] ?? Number.MAX_SAFE_INTEGER;
}
function isWorkspacePluginTrustedForAuthAliases(plugin, config) {
	return isWorkspacePluginAllowedByConfig({
		config,
		isImplicitlyAllowed: (pluginId) => normalizePluginConfigId(config?.plugins?.slots?.contextEngine) === pluginId,
		plugin
	});
}
function shouldUsePluginAuthAliases(plugin, params) {
	if (plugin.origin !== "workspace" || params?.includeUntrustedWorkspacePlugins === true) return true;
	return isWorkspacePluginTrustedForAuthAliases(plugin, params?.config);
}
function setPreferredAlias(params) {
	const normalizedAlias = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.alias);
	const normalizedTarget = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.target);
	if (!normalizedAlias || !normalizedTarget) return;
	const existing = params.aliases.get(normalizedAlias);
	if (!existing || resolveProviderAuthAliasOriginPriority(params.origin) < resolveProviderAuthAliasOriginPriority(existing.origin)) params.aliases.set(normalizedAlias, {
		origin: params.origin,
		target: normalizedTarget
	});
}
/** Resolve canonical auth provider aliases from plugin metadata. */
function resolveProviderAuthAliasMap(params) {
	const env = params?.env ?? process.env;
	const config = params?.config;
	let cacheKey;
	let envCache;
	if (!params?.metadataSnapshot) {
		cacheKey = buildProviderAuthAliasMapCacheKey(params, env);
		envCache = providerAuthAliasMapCache.get(env);
		if (!envCache) {
			envCache = /* @__PURE__ */ new Map();
			providerAuthAliasMapCache.set(env, envCache);
		}
		const cached = envCache.get(cacheKey);
		if (cached) return cached;
	}
	const snapshot = params?.metadataSnapshot ?? (config ? require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config,
		...params?.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
		env,
		allowWorkspaceScopedSnapshot: true
	}) : require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		...params?.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
		env,
		allowWorkspaceScopedSnapshot: true,
		requireDefaultDiscoveryContext: true
	})) ?? (() => {
		if (!config || require_config_state.normalizePluginsConfig(config.plugins).loadPaths.length !== 0) return;
		return require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
			...params?.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
			env,
			allowWorkspaceScopedSnapshot: true,
			requireDefaultDiscoveryContext: true
		});
	})() ?? require_plugin_metadata_snapshot.loadPluginMetadataSnapshot({
		config: config ?? {},
		...params?.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
		env
	});
	const preferredAliases = /* @__PURE__ */ new Map();
	const aliases = Object.create(null);
	for (const plugin of snapshot.plugins) {
		if (!shouldUsePluginAuthAliases(plugin, params)) continue;
		for (const [alias, target] of Object.entries(plugin.providerAuthAliases ?? {}).toSorted(([left], [right]) => left.localeCompare(right))) setPreferredAlias({
			aliases: preferredAliases,
			alias,
			origin: plugin.origin,
			target
		});
		for (const choice of plugin.providerAuthChoices ?? []) for (const deprecatedChoiceId of choice.deprecatedChoiceIds ?? []) setPreferredAlias({
			aliases: preferredAliases,
			alias: deprecatedChoiceId,
			origin: plugin.origin,
			target: choice.provider
		});
	}
	for (const [alias, candidate] of preferredAliases) aliases[alias] = candidate.target;
	if (envCache && cacheKey) envCache.set(cacheKey, aliases);
	return aliases;
}
/** Resolve the provider ID that should be used for credential lookup. */
function resolveProviderIdForAuth(provider, params) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	if (!normalized) return normalized;
	return resolveProviderAuthAliasMap(params)[normalized] ?? normalized;
}
//#endregion
Object.defineProperty(exports, "isWorkspacePluginAllowedByConfig", {
	enumerable: true,
	get: function() {
		return isWorkspacePluginAllowedByConfig;
	}
});
Object.defineProperty(exports, "normalizePluginConfigId", {
	enumerable: true,
	get: function() {
		return normalizePluginConfigId;
	}
});
Object.defineProperty(exports, "provider_auth_aliases_exports", {
	enumerable: true,
	get: function() {
		return provider_auth_aliases_exports;
	}
});
Object.defineProperty(exports, "resolveProviderAuthAliasMap", {
	enumerable: true,
	get: function() {
		return resolveProviderAuthAliasMap;
	}
});
Object.defineProperty(exports, "resolveProviderIdForAuth", {
	enumerable: true,
	get: function() {
		return resolveProviderIdForAuth;
	}
});
