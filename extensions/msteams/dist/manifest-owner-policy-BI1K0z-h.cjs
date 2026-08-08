const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
//#region src/plugins/manifest-owner-policy.ts
/** True when a manifest owner comes from a bundled plugin. */
function isBundledManifestOwner(plugin) {
	return plugin.origin === "bundled";
}
/** True when config explicitly trusts a plugin as a manifest owner. */
function hasExplicitManifestOwnerTrust(params) {
	return params.normalizedConfig.allow.includes(params.plugin.id) || params.normalizedConfig.entries[params.plugin.id]?.enabled === true;
}
/** True when a plugin passes global enablement, allowlist, denylist, and disabled checks. */
function passesManifestOwnerBasePolicy(params) {
	return resolveManifestOwnerBasePolicyBlock(params) === null;
}
/** Resolves the base policy block reason for a manifest owner plugin. */
function resolveManifestOwnerBasePolicyBlock(params) {
	if (!params.normalizedConfig.enabled) return "plugins-disabled";
	if (params.normalizedConfig.deny.includes(params.plugin.id)) return "blocked-by-denylist";
	if (params.normalizedConfig.entries[params.plugin.id]?.enabled === false && params.allowExplicitlyDisabled !== true) return "plugin-disabled";
	if (params.allowRestrictiveAllowlistBypass !== true && params.normalizedConfig.allow.length > 0 && !params.normalizedConfig.allow.includes(params.plugin.id)) return "not-in-allowlist";
	return null;
}
/** Resolves whether a manifest owner plugin is effectively activated. */
function isActivatedManifestOwner(params) {
	return require_config_state.resolveEffectivePluginActivationState({
		id: params.plugin.id,
		origin: params.plugin.origin,
		config: params.normalizedConfig,
		rootConfig: params.rootConfig,
		enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(params.plugin)
	}).activated;
}
//#endregion
Object.defineProperty(exports, "hasExplicitManifestOwnerTrust", {
	enumerable: true,
	get: function() {
		return hasExplicitManifestOwnerTrust;
	}
});
Object.defineProperty(exports, "isActivatedManifestOwner", {
	enumerable: true,
	get: function() {
		return isActivatedManifestOwner;
	}
});
Object.defineProperty(exports, "isBundledManifestOwner", {
	enumerable: true,
	get: function() {
		return isBundledManifestOwner;
	}
});
Object.defineProperty(exports, "passesManifestOwnerBasePolicy", {
	enumerable: true,
	get: function() {
		return passesManifestOwnerBasePolicy;
	}
});
Object.defineProperty(exports, "resolveManifestOwnerBasePolicyBlock", {
	enumerable: true,
	get: function() {
		return resolveManifestOwnerBasePolicyBlock;
	}
});
