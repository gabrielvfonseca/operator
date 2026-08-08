Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
require("./rolldown-runtime-u92d-OFm.cjs");
const require_read_only = require("./read-only-MDrE_ZGP.cjs");
const require_setup_surface = require("./setup-surface-Bp54A5F5.cjs");
const require_runtime_api = require("./runtime-api-CfjFtGFK.cjs");
const require_channel_config_helpers = require("./channel-config-helpers-B5LadJVY.cjs");
const require_graph_users = require("./graph-users-Ct1vN_FN.cjs");
const require_config_schema = require("./config-schema-CT-P8YXp.cjs");
//#region extensions/msteams/src/channel.setup.ts
const meta = {
	id: "msteams",
	label: "Microsoft Teams",
	selectionLabel: "Microsoft Teams (Bot Framework)",
	docsPath: "/channels/msteams",
	docsLabel: "msteams",
	blurb: "Teams SDK; enterprise support.",
	aliases: ["teams"],
	order: 60
};
const resolveMSTeamsChannelConfig = (cfg) => ({
	allowFrom: cfg.channels?.msteams?.allowFrom,
	defaultTo: cfg.channels?.msteams?.defaultTo
});
const msteamsConfigAdapter = require_channel_config_helpers.createTopLevelChannelConfigAdapter({
	sectionKey: "msteams",
	resolveAccount: (cfg) => ({
		accountId: "default",
		enabled: cfg.channels?.msteams?.enabled !== false,
		configured: Boolean(require_graph_users.resolveMSTeamsCredentials(cfg.channels?.msteams))
	}),
	resolveAccessorAccount: ({ cfg }) => resolveMSTeamsChannelConfig(cfg),
	resolveAllowFrom: (account) => account.allowFrom,
	formatAllowFrom: (allowFrom) => require_runtime_api.formatAllowFromLowercase({ allowFrom }),
	resolveDefaultTo: (account) => account.defaultTo
});
const msteamsSetupPlugin = {
	id: "msteams",
	meta: {
		...meta,
		aliases: [...meta.aliases]
	},
	capabilities: {
		chatTypes: [
			"direct",
			"channel",
			"thread"
		],
		polls: true,
		threads: true,
		media: true
	},
	reload: { configPrefixes: ["channels.msteams"] },
	configSchema: require_config_schema.MSTeamsChannelConfigSchema,
	config: {
		...msteamsConfigAdapter,
		isConfigured: (_account, cfg) => Boolean(require_graph_users.resolveMSTeamsCredentials(cfg.channels?.msteams)),
		describeAccount: (account) => require_read_only.describeAccountSnapshot({
			account,
			configured: account.configured
		})
	},
	setupWizard: require_setup_surface.msteamsSetupWizard,
	setup: require_setup_surface.msteamsSetupAdapter
};
//#endregion
exports.msteamsSetupPlugin = msteamsSetupPlugin;
