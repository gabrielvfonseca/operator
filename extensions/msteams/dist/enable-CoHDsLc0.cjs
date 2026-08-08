const require_ids = require("./ids-BOvGIu4A.cjs");
const require_plugins_allowlist = require("./plugins-allowlist-TYOT6QRc.cjs");
//#region src/plugins/toggle-config.ts
/** Returns config with a plugin enabled/disabled and optional built-in channel state synced. */
function setPluginEnabledInConfig(config, pluginId, enabled, options = {}) {
	const builtInChannelId = require_ids.normalizeChatChannelId(pluginId);
	const resolvedId = builtInChannelId ?? pluginId;
	const next = {
		...config,
		plugins: {
			...config.plugins,
			entries: {
				...config.plugins?.entries,
				[resolvedId]: {
					...config.plugins?.entries?.[resolvedId],
					enabled
				}
			}
		}
	};
	if (!builtInChannelId || options.updateChannelConfig === false) return next;
	const existing = config.channels?.[builtInChannelId];
	const existingRecord = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
	return {
		...next,
		channels: {
			...config.channels,
			[builtInChannelId]: {
				...existingRecord,
				enabled
			}
		}
	};
}
//#endregion
//#region src/plugins/enable.ts
/** Enables a plugin in config unless global, denylist, or allowlist policy blocks it. */
function enablePluginInConfig(cfg, pluginId, options = {}) {
	const resolvedId = require_ids.normalizeChatChannelId(pluginId) ?? pluginId;
	if (cfg.plugins?.enabled === false) return {
		config: cfg,
		enabled: false,
		pluginId: resolvedId,
		reason: "plugins disabled"
	};
	if (cfg.plugins?.deny?.includes(pluginId) || cfg.plugins?.deny?.includes(resolvedId)) return {
		config: cfg,
		enabled: false,
		pluginId: resolvedId,
		reason: "blocked by denylist"
	};
	const allow = cfg.plugins?.allow;
	if (Array.isArray(allow) && allow.length > 0 && !allow.includes(pluginId) && !allow.includes(resolvedId)) return {
		config: cfg,
		enabled: false,
		pluginId: resolvedId,
		reason: "blocked by allowlist"
	};
	return {
		config: setPluginEnabledInConfig(cfg, resolvedId, true, options),
		enabled: true,
		pluginId: resolvedId
	};
}
/**
* Enables a plugin selected through an explicit user action.
*
* ClickClack is bundled without a separate install trust record, so selecting
* it is the trust gesture that materializes its id in a restrictive allowlist.
*/
function enableExplicitlySelectedPluginInConfig(cfg, pluginId, options = {}) {
	const result = enablePluginInConfig(cfg, pluginId, options);
	if (result.reason !== "blocked by allowlist" || result.pluginId !== "clickclack") return result;
	return enablePluginInConfig(require_plugins_allowlist.ensurePluginAllowlisted(cfg, result.pluginId), result.pluginId, options);
}
//#endregion
Object.defineProperty(exports, "enableExplicitlySelectedPluginInConfig", {
	enumerable: true,
	get: function() {
		return enableExplicitlySelectedPluginInConfig;
	}
});
Object.defineProperty(exports, "enablePluginInConfig", {
	enumerable: true,
	get: function() {
		return enablePluginInConfig;
	}
});
Object.defineProperty(exports, "setPluginEnabledInConfig", {
	enumerable: true,
	get: function() {
		return setPluginEnabledInConfig;
	}
});
