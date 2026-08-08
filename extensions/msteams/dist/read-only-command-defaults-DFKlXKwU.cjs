const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/read-only-command-defaults.ts
/**
* Read-only channel command default resolver.
*
* Reads native command/skill defaults from installed plugin manifests without loading plugins.
*/
const SAFE_MANIFEST_CHANNEL_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
/**
* Returns whether a manifest channel id is safe for own-property lookup.
*/
function isSafeManifestChannelId(channelId) {
	return SAFE_MANIFEST_CHANNEL_ID_PATTERN.test(channelId) && !require_prototype_keys.isBlockedObjectKey(channelId);
}
/**
* Reads an own record property while blocking prototype-polluting keys.
*/
function readOwnRecordValue(record, key) {
	if (require_prototype_keys.isBlockedObjectKey(key) || !Object.hasOwn(record, key)) return;
	return record[key];
}
/**
* Normalizes manifest command defaults down to supported boolean fields.
*/
function normalizeChannelCommandDefaults(value) {
	if (!value) return;
	const nativeCommandsAutoEnabled = typeof value.nativeCommandsAutoEnabled === "boolean" ? value.nativeCommandsAutoEnabled : void 0;
	const nativeSkillsAutoEnabled = typeof value.nativeSkillsAutoEnabled === "boolean" ? value.nativeSkillsAutoEnabled : void 0;
	if (nativeCommandsAutoEnabled === void 0 && nativeSkillsAutoEnabled === void 0) return;
	const defaults = {};
	if (nativeCommandsAutoEnabled !== void 0) defaults.nativeCommandsAutoEnabled = nativeCommandsAutoEnabled;
	if (nativeSkillsAutoEnabled !== void 0) defaults.nativeSkillsAutoEnabled = nativeSkillsAutoEnabled;
	return defaults;
}
/**
* Resolves command defaults from enabled installed plugin metadata without loading plugins.
*/
function resolveReadOnlyChannelCommandDefaults(channelId, options) {
	const normalizedChannelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(channelId) ?? "";
	if (!normalizedChannelId || !isSafeManifestChannelId(normalizedChannelId)) return;
	const env = options.env ?? process.env;
	const resolvedSnapshot = require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: options.config,
		stateDir: options.stateDir,
		workspaceDir: options.workspaceDir,
		env,
		allowWorkspaceScopedCurrent: true
	});
	for (const record of resolvedSnapshot.plugins) {
		if (!record.channels.includes(normalizedChannelId)) continue;
		if (!require_installed_plugin_index.isInstalledPluginEnabled(resolvedSnapshot.index, record.id, options.config)) continue;
		const channelConfigValue = record.channelConfigs ? readOwnRecordValue(record.channelConfigs, normalizedChannelId) : void 0;
		const channelConfig = channelConfigValue && typeof channelConfigValue === "object" && !Array.isArray(channelConfigValue) ? channelConfigValue : void 0;
		const catalogCommands = record.channelCatalogMeta?.id === normalizedChannelId ? record.channelCatalogMeta.commands : void 0;
		const commands = normalizeChannelCommandDefaults(channelConfig?.commands ?? catalogCommands);
		if (commands) return commands;
	}
}
//#endregion
Object.defineProperty(exports, "isSafeManifestChannelId", {
	enumerable: true,
	get: function() {
		return isSafeManifestChannelId;
	}
});
Object.defineProperty(exports, "normalizeChannelCommandDefaults", {
	enumerable: true,
	get: function() {
		return normalizeChannelCommandDefaults;
	}
});
Object.defineProperty(exports, "readOwnRecordValue", {
	enumerable: true,
	get: function() {
		return readOwnRecordValue;
	}
});
Object.defineProperty(exports, "resolveReadOnlyChannelCommandDefaults", {
	enumerable: true,
	get: function() {
		return resolveReadOnlyChannelCommandDefaults;
	}
});
