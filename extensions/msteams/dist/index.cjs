require("./rolldown-runtime-u92d-OFm.cjs");
//#region extensions/msteams/index.ts
var msteams_default = require("./channel-entry-contract-BgZLgCh9.cjs").defineBundledChannelEntry({
	id: "msteams",
	name: "Microsoft Teams",
	description: "Microsoft Teams channel plugin (Bot Framework)",
	importMetaUrl: require("url").pathToFileURL(__filename).href,
	plugin: {
		specifier: "./channel-plugin-api.cjs",
		exportName: "msteamsPlugin"
	},
	secrets: {
		specifier: "./secret-contract-api.cjs",
		exportName: "channelSecrets"
	},
	runtime: {
		specifier: "./runtime-api.cjs",
		exportName: "setMSTeamsRuntime"
	}
});
//#endregion
module.exports = msteams_default;
