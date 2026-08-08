require("./registry-BWWaGAnQ.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry_loaded = require("./registry-loaded-BQ6D0fDi.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/registry.ts
/**
* Runtime channel plugin registry facade.
*
* Lists, resolves, and normalizes active channel plugins with bundled fallback.
*/
/**
* Lists currently loaded channel plugins in registry order.
*/
function listChannelPlugins() {
	return require_registry_loaded.listLoadedChannelPlugins();
}
/**
* Returns a loaded channel plugin without falling back to bundled metadata.
*/
function getLoadedChannelPlugin(id) {
	const resolvedId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id) ?? "";
	if (!resolvedId) return;
	return require_registry_loaded.getLoadedChannelPluginById(resolvedId);
}
/**
* Returns the package/install origin for a loaded channel plugin.
*/
function getLoadedChannelPluginOrigin(id) {
	const resolvedId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id) ?? "";
	if (!resolvedId) return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_registry_loaded.getLoadedChannelPluginEntryById(resolvedId)?.origin) ?? void 0;
}
/**
* Resolves the active channel implementation together with host-owned provenance.
*/
function resolveChannelPluginRegistration(id) {
	const resolvedId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id) ?? "";
	if (!resolvedId) return;
	const loadedEntry = require_registry_loaded.getLoadedChannelPluginEntryById(resolvedId);
	if (loadedEntry) {
		const origin = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(loadedEntry.origin) ?? void 0;
		return {
			plugin: loadedEntry.plugin,
			...origin ? { origin } : {}
		};
	}
	const plugin = require_bundled.getBundledChannelPlugin(resolvedId);
	return plugin ? {
		plugin,
		origin: "bundled"
	} : void 0;
}
/**
* Returns the active channel plugin, with bundled fallback for built-in channels.
*/
function getChannelPlugin(id) {
	return resolveChannelPluginRegistration(id)?.plugin;
}
/**
* Normalizes user-facing channel aliases to canonical channel ids.
*/
function normalizeChannelId(raw) {
	return require_registry_normalize.normalizeAnyChannelId(raw);
}
//#endregion
Object.defineProperty(exports, "getChannelPlugin", {
	enumerable: true,
	get: function() {
		return getChannelPlugin;
	}
});
Object.defineProperty(exports, "getLoadedChannelPlugin", {
	enumerable: true,
	get: function() {
		return getLoadedChannelPlugin;
	}
});
Object.defineProperty(exports, "getLoadedChannelPluginOrigin", {
	enumerable: true,
	get: function() {
		return getLoadedChannelPluginOrigin;
	}
});
Object.defineProperty(exports, "listChannelPlugins", {
	enumerable: true,
	get: function() {
		return listChannelPlugins;
	}
});
Object.defineProperty(exports, "normalizeChannelId", {
	enumerable: true,
	get: function() {
		return normalizeChannelId;
	}
});
Object.defineProperty(exports, "resolveChannelPluginRegistration", {
	enumerable: true,
	get: function() {
		return resolveChannelPluginRegistration;
	}
});
