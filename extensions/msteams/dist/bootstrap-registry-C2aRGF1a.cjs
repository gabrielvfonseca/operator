const require_bundled = require("./bundled-sSrX2DvO.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/bootstrap-registry.ts
/**
* Bundled channel bootstrap registry.
*
* Provides channel plugin metadata before the full runtime registry is installed.
*/
function resolveBootstrapChannelId(id) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id) ?? "";
}
function mergePluginSection(runtimeValue, setupValue) {
	if (runtimeValue && setupValue && typeof runtimeValue === "object" && typeof setupValue === "object") {
		const merged = { ...runtimeValue };
		for (const [key, value] of Object.entries(setupValue)) if (value !== void 0) merged[key] = value;
		return { ...merged };
	}
	return setupValue ?? runtimeValue;
}
function mergeBootstrapPlugin(runtimePlugin, setupPlugin) {
	return {
		...runtimePlugin,
		...setupPlugin,
		meta: mergePluginSection(runtimePlugin.meta, setupPlugin.meta),
		capabilities: mergePluginSection(runtimePlugin.capabilities, setupPlugin.capabilities),
		commands: mergePluginSection(runtimePlugin.commands, setupPlugin.commands),
		doctor: mergePluginSection(runtimePlugin.doctor, setupPlugin.doctor),
		reload: mergePluginSection(runtimePlugin.reload, setupPlugin.reload),
		config: mergePluginSection(runtimePlugin.config, setupPlugin.config),
		setup: mergePluginSection(runtimePlugin.setup, setupPlugin.setup),
		messaging: mergePluginSection(runtimePlugin.messaging, setupPlugin.messaging),
		actions: mergePluginSection(runtimePlugin.actions, setupPlugin.actions),
		secrets: mergePluginSection(runtimePlugin.secrets, setupPlugin.secrets)
	};
}
/**
* Loads a bundled channel plugin for bootstrap, merging runtime and setup artifacts.
*/
function getBootstrapChannelPlugin(id) {
	const resolvedId = resolveBootstrapChannelId(id);
	if (!resolvedId) return;
	let runtimePlugin;
	let setupPlugin;
	try {
		runtimePlugin = require_bundled.getBundledChannelPlugin(resolvedId);
		setupPlugin = require_bundled.getBundledChannelSetupPlugin(resolvedId);
	} catch {
		return;
	}
	return runtimePlugin && setupPlugin ? mergeBootstrapPlugin(runtimePlugin, setupPlugin) : setupPlugin ?? runtimePlugin;
}
/**
* Loads bootstrap secret metadata from bundled runtime and setup artifacts.
*/
function getBootstrapChannelSecrets(id) {
	const resolvedId = resolveBootstrapChannelId(id);
	if (!resolvedId) return;
	try {
		return mergePluginSection(require_bundled.getBundledChannelSecrets(resolvedId), require_bundled.getBundledChannelSetupSecrets(resolvedId));
	} catch {
		return;
	}
}
//#endregion
Object.defineProperty(exports, "getBootstrapChannelPlugin", {
	enumerable: true,
	get: function() {
		return getBootstrapChannelPlugin;
	}
});
Object.defineProperty(exports, "getBootstrapChannelSecrets", {
	enumerable: true,
	get: function() {
		return getBootstrapChannelSecrets;
	}
});
