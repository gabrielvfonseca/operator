require("./rolldown-runtime-u92d-OFm.cjs");
//#region extensions/msteams/setup-entry.ts
var setup_entry_default = require("./channel-entry-contract-BgZLgCh9.cjs").defineBundledChannelSetupEntry({
	importMetaUrl: require("url").pathToFileURL(__filename).href,
	plugin: {
		specifier: "./setup-plugin-api.cjs",
		exportName: "msteamsSetupPlugin"
	},
	secrets: {
		specifier: "./secret-contract-api.cjs",
		exportName: "channelSecrets"
	}
});
//#endregion
module.exports = setup_entry_default;
