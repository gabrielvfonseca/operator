const require_zod_schema_installs = require("./zod-schema.installs-DvUhp0g9.cjs");
let zod = require("zod");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/config/plugin-install-config-migration.ts
const PluginInstallRecordsSchema = zod.z.record(zod.z.string(), zod.z.object(require_zod_schema_installs.PluginInstallRecordShape).passthrough());
function pruneEmptyPluginsObject(plugins) {
	const { installs: _installs, ...rest } = plugins;
	return Object.keys(rest).length === 0 ? void 0 : rest;
}
/**
* Reads legacy shipped `plugins.installs` records for migration into the plugin index.
*
* Invalid install maps are ignored so config loading can keep using the stripped
* runtime config while doctor/write paths decide how to report or recover.
*/
function extractShippedPluginInstallConfigRecords(config) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config.plugins)) return {};
	const parsed = PluginInstallRecordsSchema.safeParse(config.plugins.installs);
	return parsed.success ? structuredClone(parsed.data) : {};
}
/** Removes legacy shipped `plugins.installs` without mutating the original config object. */
function stripShippedPluginInstallConfigRecords(config) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(config.plugins) || !("installs" in config.plugins)) return config;
	const plugins = pruneEmptyPluginsObject(config.plugins);
	const { plugins: _plugins, ...rest } = config;
	return plugins === void 0 ? rest : {
		...rest,
		plugins
	};
}
//#endregion
Object.defineProperty(exports, "extractShippedPluginInstallConfigRecords", {
	enumerable: true,
	get: function() {
		return extractShippedPluginInstallConfigRecords;
	}
});
Object.defineProperty(exports, "stripShippedPluginInstallConfigRecords", {
	enumerable: true,
	get: function() {
		return stripShippedPluginInstallConfigRecords;
	}
});
