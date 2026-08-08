require("./rolldown-runtime-u92d-OFm.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_install_record_commit = require("./install-record-commit-BUsKCeHe.cjs");
const require_registry_refresh = require("./registry-refresh-B3eSyFEy.cjs");
const require_agents_bindings = require("./agents.bindings-CVK1HGZy.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/channels/add-mutators.ts
/** Apply a display name to a channel account when the plugin supports account naming. */
function applyAccountName(params) {
	const accountId = require_account_id.normalizeAccountId(params.accountId);
	const apply = (params.plugin ?? require_registry.getChannelPlugin(params.channel))?.setup?.applyAccountName;
	return apply ? apply({
		cfg: params.cfg,
		accountId,
		name: params.name
	}) : params.cfg;
}
//#endregion
//#region src/commands/channels/add-wizard.ts
async function loadOnboardChannels() {
	return await Promise.resolve().then(() => require("./onboard-channels-BgLQ52s3.cjs"));
}
/** Resolve a raw channel name/alias against the installed setup entries. */
async function resolveInitialWizardChannel(raw, cfg) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (!normalized) return;
	const [{ listActiveChannelSetupPlugins }, { resolveChannelSetupEntries }] = await Promise.all([Promise.resolve().then(() => require("./setup-registry-coak-nw7.cjs")).then((n) => n.setup_registry_exports), Promise.resolve().then(() => require("./discovery-CYGuCwPJ.cjs")).then((n) => n.discovery_exports)]);
	return resolveChannelSetupEntries({
		cfg,
		installedPlugins: listActiveChannelSetupPlugins(),
		workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg))
	}).entries.find((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(entry.id) === normalized || (entry.meta.aliases ?? []).some((alias) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(alias) === normalized))?.id;
}
/** Run the interactive channel-setup flow and persist the resulting config. */
async function runChannelsAddWizardFlow(params) {
	const { cfg, baseHash, runtime, prompter } = params;
	const [{ buildAgentSummaries }, onboardChannels] = await Promise.all([Promise.resolve().then(() => require("./agents.config-BC-3Ve88.cjs")).then((n) => n.agents_config_exports), loadOnboardChannels()]);
	const postWriteHooks = onboardChannels.createChannelOnboardingPostWriteHookCollector();
	let selection = [];
	const accountIds = {};
	const resolvedPlugins = /* @__PURE__ */ new Map();
	await prompter.intro("Channel setup");
	let nextConfig = await onboardChannels.setupChannels(cfg, runtime, prompter, {
		...params.initialChannel ? { initialSelection: [params.initialChannel] } : {},
		allowDisable: false,
		allowIMessageInstall: true,
		allowSignalInstall: true,
		...params.beforePersistentEffect ? { beforePersistentEffect: params.beforePersistentEffect } : {},
		...params.deferDeviceLinkToClient ? { deferDeviceLinkToClient: true } : {},
		onPostWriteHook: (hook) => {
			postWriteHooks.collect(hook);
		},
		promptAccountIds: true,
		deferStatusUntilSelection: true,
		skipStatusNote: true,
		onSelection: (value) => {
			selection = value;
		},
		onAccountId: (channel, accountId) => {
			accountIds[channel] = accountId;
		},
		onResolvedPlugin: (channel, plugin) => {
			resolvedPlugins.set(channel, plugin);
		}
	});
	if (selection.length === 0) {
		await prompter.outro("No channel changes made.");
		return;
	}
	if (await prompter.confirm({
		message: "Name these channel accounts now? (optional)",
		initialValue: false
	})) for (const channel of selection) {
		const accountId = accountIds[channel] ?? "default";
		const plugin = resolvedPlugins.get(channel) ?? require_registry.getLoadedChannelPlugin(channel);
		const account = plugin?.config.resolveAccount(nextConfig, accountId);
		const existingName = (plugin?.config.describeAccount?.(account, nextConfig))?.name ?? account?.name;
		const name = await prompter.text({
			message: `${channel} display name for account "${accountId}"`,
			initialValue: existingName
		});
		if (name?.trim()) nextConfig = applyAccountName({
			cfg: nextConfig,
			channel,
			accountId,
			name,
			plugin
		});
	}
	const bindTargets = selection.map((channel) => ({
		channel,
		accountId: accountIds[channel]?.trim()
	})).filter((value) => Boolean(value.accountId));
	if (bindTargets.length > 0) {
		if (await prompter.confirm({
			message: "Route these channel accounts to agents now?",
			initialValue: true
		})) {
			const agentSummaries = buildAgentSummaries(nextConfig);
			const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(nextConfig);
			for (const target of bindTargets) {
				const targetAgentId = await prompter.select({
					message: `Send ${target.channel}/${target.accountId} messages to agent`,
					options: agentSummaries.map((agent) => ({
						value: agent.id,
						label: agent.isDefault ? `${agent.id} (default)` : agent.id
					})),
					initialValue: defaultAgentId
				});
				const bindingResult = require_agents_bindings.applyAgentBindings(nextConfig, [{
					agentId: targetAgentId,
					match: {
						channel: target.channel,
						accountId: target.accountId
					}
				}]);
				nextConfig = bindingResult.config;
				if (bindingResult.added.length > 0 || bindingResult.updated.length > 0) await prompter.note([...bindingResult.added.map((binding) => `Added: ${require_agents_bindings.describeBinding(binding)}`), ...bindingResult.updated.map((binding) => `Updated: ${require_agents_bindings.describeBinding(binding)}`)].join("\n"), "Routing bindings");
				if (bindingResult.conflicts.length > 0) await prompter.note(["Skipped bindings already claimed by another agent:", ...bindingResult.conflicts.map((conflict) => `- ${require_agents_bindings.describeBinding(conflict.binding)} (agent=${conflict.existingAgentId})`)].join("\n"), "Routing bindings");
			}
		}
	}
	await params.beforePersistentEffect?.();
	const committed = await require_install_record_commit.commitConfigWithPendingPluginInstalls({
		nextConfig,
		...baseHash !== void 0 ? { baseHash } : {}
	});
	const writtenConfig = committed.config;
	if (committed.movedInstallRecords) await require_registry_refresh.refreshPluginRegistryAfterConfigMutation({
		config: writtenConfig,
		reason: "source-changed",
		installRecords: committed.installRecords,
		logger: { warn: (message) => runtime.log(message) }
	});
	await onboardChannels.runCollectedChannelOnboardingPostWriteHooks({
		hooks: postWriteHooks.drain(),
		cfg: writtenConfig,
		runtime,
		...params.beforePersistentEffect ? { beforePersistentEffect: params.beforePersistentEffect } : {}
	});
	params.onConfigured?.(selection.map((channel) => ({
		channel,
		accountId: accountIds[channel] ?? "default"
	})));
	await prompter.outro("Channels updated.");
}
/**
* Gateway entry for `wizard.start {flow:"channels"}`. Unlike the CLI path this
* must never call runtime.exit — failures throw and surface as wizard errors.
*/
async function runChannelsSetupWizard(opts, runtime, prompter) {
	const snapshot = await require_io.readConfigFileSnapshot();
	if (snapshot.exists && !snapshot.valid) throw new Error("Operator config is invalid; run `openclaw doctor --fix`, then retry channel setup.");
	const cfg = snapshot.sourceConfig ?? snapshot.config;
	const initialChannel = opts.channel ? await resolveInitialWizardChannel(opts.channel, cfg) : void 0;
	await runChannelsAddWizardFlow({
		cfg,
		...snapshot.hash !== void 0 ? { baseHash: snapshot.hash } : {},
		runtime,
		prompter,
		...initialChannel ? { initialChannel } : {},
		deferDeviceLinkToClient: true,
		...opts.onConfigured ? { onConfigured: opts.onConfigured } : {},
		...opts.beforePersistentEffect ? { beforePersistentEffect: opts.beforePersistentEffect } : {}
	});
}
//#endregion
exports.runChannelsSetupWizard = runChannelsSetupWizard;
