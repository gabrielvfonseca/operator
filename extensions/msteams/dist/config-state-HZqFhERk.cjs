const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/config-state.ts
/** Normalizes plugin config and resolves effective enablement, slots, and activation sources. */
const BUILT_IN_PLUGIN_ALIAS_FALLBACKS = [
	["google-gemini-cli", "google"],
	["minimax-portal", "minimax"],
	["minimax-portal-auth", "minimax"]
];
const BUILT_IN_PLUGIN_ALIAS_LOOKUP = new Map([...BUILT_IN_PLUGIN_ALIAS_FALLBACKS, ...BUILT_IN_PLUGIN_ALIAS_FALLBACKS.map(([, pluginId]) => [pluginId, pluginId])]);
function getBundledPluginAliasLookup() {
	const lookup = /* @__PURE__ */ new Map();
	for (const [alias, pluginId] of BUILT_IN_PLUGIN_ALIAS_FALLBACKS) lookup.set(alias, pluginId);
	return lookup;
}
function normalizePluginIdWithLookup(id, getAliasLookup) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id) ?? "") ?? "";
	const builtInAlias = BUILT_IN_PLUGIN_ALIAS_LOOKUP.get(normalized);
	if (builtInAlias) return builtInAlias;
	return getAliasLookup().get(normalized) ?? normalized;
}
function createScopedPluginIdNormalizer() {
	let lookup;
	return (id) => normalizePluginIdWithLookup(id, () => {
		lookup ??= getBundledPluginAliasLookup();
		return lookup;
	});
}
/** Normalizes user/config plugin ids into the canonical lowercase key form. */
function normalizePluginId(id) {
	return normalizePluginIdWithLookup(id, getBundledPluginAliasLookup);
}
const normalizePluginsConfig = (config) => {
	return require_config_activation_shared.normalizePluginsConfigWithResolver(config, createScopedPluginIdNormalizer());
};
/** Canonicalizes one plugin entry and its policy-list ids before a targeted mutation. */
function normalizePluginTargetConfig(config, pluginId) {
	const normalizedId = normalizePluginId(pluginId);
	const normalized = normalizePluginsConfig(config.plugins);
	const rawEntries = config.plugins?.entries ?? {};
	const hasTargetEntry = Object.keys(rawEntries).some((entryId) => normalizePluginId(entryId) === normalizedId);
	const entries = Object.fromEntries(Object.entries(rawEntries).filter(([entryId]) => normalizePluginId(entryId) !== normalizedId));
	if (hasTargetEntry) {
		const { config: pluginConfig, ...entry } = normalized.entries[normalizedId] ?? {};
		entries[normalizedId] = {
			...entry,
			...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginConfig) ? { config: pluginConfig } : {}
		};
	}
	return {
		...config,
		plugins: {
			...config.plugins,
			...Array.isArray(config.plugins?.allow) ? { allow: normalized.allow } : {},
			...Array.isArray(config.plugins?.deny) ? { deny: normalized.deny } : {},
			entries
		}
	};
}
function createPluginActivationSource(params) {
	return {
		plugins: params.plugins ?? normalizePluginsConfig(params.config?.plugins),
		rootConfig: params.config
	};
}
const hasExplicitMemorySlot = (plugins) => Boolean(plugins?.slots && Object.hasOwn(plugins.slots, "memory"));
const hasExplicitMemoryEntry = (plugins) => Boolean(plugins?.entries && Object.hasOwn(plugins.entries, require_config_activation_shared.defaultSlotIdForKey("memory")));
const hasExplicitPluginConfig = (plugins) => require_config_activation_shared.hasExplicitPluginConfig(plugins);
function applyTestPluginDefaults(cfg, env = process.env) {
	if (!env.VITEST) return cfg;
	const plugins = cfg.plugins;
	if (hasExplicitPluginConfig(plugins)) {
		if (hasExplicitMemorySlot(plugins) || hasExplicitMemoryEntry(plugins)) return cfg;
		return {
			...cfg,
			plugins: {
				...plugins,
				slots: {
					...plugins?.slots,
					memory: "none"
				}
			}
		};
	}
	return {
		...cfg,
		plugins: {
			...plugins,
			enabled: false,
			slots: {
				...plugins?.slots,
				memory: "none"
			}
		}
	};
}
function isTestDefaultMemorySlotDisabled(cfg, env = process.env) {
	if (!env.VITEST) return false;
	const plugins = cfg.plugins;
	if (hasExplicitMemorySlot(plugins) || hasExplicitMemoryEntry(plugins)) return false;
	return true;
}
function resolvePluginActivationState(params) {
	return require_config_activation_shared.toPluginActivationState(require_config_activation_shared.resolvePluginActivationDecisionShared({
		...params,
		activationSource: params.activationSource ?? createPluginActivationSource({
			config: params.rootConfig,
			plugins: params.config
		}),
		allowBundledChannelExplicitBypassesAllowlist: true,
		isBundledChannelEnabledByChannelConfig
	}));
}
const resolveEnableState = require_config_activation_shared.createPluginEnableStateResolver(resolvePluginActivationState);
const isBundledChannelEnabledByChannelConfig = require_config_activation_shared.isBundledChannelEnabledByChannelConfig;
const resolveEffectiveEnableState = require_config_activation_shared.createEffectiveEnableStateResolver(resolveEffectivePluginActivationState);
function resolveEffectivePluginActivationState(params) {
	return resolvePluginActivationState(params);
}
function resolveMemorySlotDecision(params) {
	return require_config_activation_shared.resolveMemorySlotDecisionShared(params);
}
//#endregion
Object.defineProperty(exports, "applyTestPluginDefaults", {
	enumerable: true,
	get: function() {
		return applyTestPluginDefaults;
	}
});
Object.defineProperty(exports, "createPluginActivationSource", {
	enumerable: true,
	get: function() {
		return createPluginActivationSource;
	}
});
Object.defineProperty(exports, "hasExplicitPluginConfig", {
	enumerable: true,
	get: function() {
		return hasExplicitPluginConfig;
	}
});
Object.defineProperty(exports, "isTestDefaultMemorySlotDisabled", {
	enumerable: true,
	get: function() {
		return isTestDefaultMemorySlotDisabled;
	}
});
Object.defineProperty(exports, "normalizePluginId", {
	enumerable: true,
	get: function() {
		return normalizePluginId;
	}
});
Object.defineProperty(exports, "normalizePluginTargetConfig", {
	enumerable: true,
	get: function() {
		return normalizePluginTargetConfig;
	}
});
Object.defineProperty(exports, "normalizePluginsConfig", {
	enumerable: true,
	get: function() {
		return normalizePluginsConfig;
	}
});
Object.defineProperty(exports, "resolveEffectiveEnableState", {
	enumerable: true,
	get: function() {
		return resolveEffectiveEnableState;
	}
});
Object.defineProperty(exports, "resolveEffectivePluginActivationState", {
	enumerable: true,
	get: function() {
		return resolveEffectivePluginActivationState;
	}
});
Object.defineProperty(exports, "resolveEnableState", {
	enumerable: true,
	get: function() {
		return resolveEnableState;
	}
});
Object.defineProperty(exports, "resolveMemorySlotDecision", {
	enumerable: true,
	get: function() {
		return resolveMemorySlotDecision;
	}
});
