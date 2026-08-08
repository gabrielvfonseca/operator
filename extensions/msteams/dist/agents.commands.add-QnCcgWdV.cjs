const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_auth_profiles = require("./auth-profiles-DQeiAyJi.cjs");
const require_agent_id = require("./agent-id-nux9kTGp.cjs");
const require_prompts = require("./prompts-DyiRjrc3.cjs");
const require_install_record_commit = require("./install-record-commit-BUsKCeHe.cjs");
const require_status = require("./status-pSULYkKm.cjs");
const require_config_recovery_hints = require("./config-recovery-hints-A_lub-Kc.cjs");
const require_logging = require("./logging-r9lZv9sT.cjs");
const require_clack_prompter = require("./clack-prompter-ClUICF-g.cjs");
const require_agents_bindings = require("./agents.bindings-CVK1HGZy.cjs");
const require_agents_config = require("./agents.config-BC-3Ve88.cjs");
const require_auth_choice_prompt = require("./auth-choice-prompt-BbEEGxQZ.cjs");
const require_auth_choice = require("./auth-choice-D4L_IVSJ.cjs");
const require_onboard_channels = require("./onboard-channels-BgLQ52s3.cjs");
const require_onboard_helpers = require("./onboard-helpers-B8YMO226.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/config-validation.ts
/** Read the config file and exit through the runtime when validation fails. */
async function requireValidConfigFileSnapshot$1(runtime, opts) {
	const snapshot = await require_io.readConfigFileSnapshot();
	if (snapshot.exists && !snapshot.valid) {
		const issues = snapshot.issues.length > 0 ? require_io.formatConfigIssueLines(snapshot.issues, "-").join("\n") : "Unknown validation issue.";
		runtime.error(`Operator config is invalid: ${snapshot.path}\n${issues}`);
		runtime.error(require_io.isPluginPackagingRuntimeOutputInvalidConfigSnapshot(snapshot) ? `Fix: ${require_config_recovery_hints.formatPluginPackagingRuntimeOutputRecoveryHint()}` : `Fix: ${require_command_format.formatCliCommand("operator doctor --fix")}`);
		runtime.error(`Inspect: ${require_command_format.formatCliCommand("operator config validate")}`);
		runtime.exit(1);
		return null;
	}
	if (opts?.includeCompatibilityAdvisory !== true) return snapshot;
	const compatibility = require_status.buildPluginCompatibilitySnapshotNotices({ config: snapshot.config });
	if (compatibility.length > 0) runtime.log([
		`Plugin compatibility: ${compatibility.length} notice${compatibility.length === 1 ? "" : "s"}.`,
		...compatibility.slice(0, 3).map((notice) => `- ${require_status.formatPluginCompatibilityNotice(notice)}`),
		...compatibility.length > 3 ? [`- ... +${compatibility.length - 3} more`] : [],
		`Review: ${require_command_format.formatCliCommand("operator doctor")}`
	].join("\n"));
	return snapshot;
}
//#endregion
//#region src/commands/agents.command-shared.ts
/** Wrap a runtime so helper setup work stays silent in JSON output paths. */
function createQuietRuntime(runtime) {
	return {
		...runtime,
		log: () => {}
	};
}
/** Load a config file snapshot and surface validation errors through the runtime. */
async function requireValidConfigFileSnapshot(runtime) {
	return await requireValidConfigFileSnapshot$1(runtime);
}
//#endregion
//#region src/commands/agents.commands.add.ts
var AgentsAddMutationError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "AgentsAddMutationError";
	}
};
function emptyBindingResult(config) {
	return {
		config,
		added: [],
		updated: [],
		skipped: [],
		conflicts: []
	};
}
function formatSkippedOAuthProfilesMessage(params) {
	return params.sourceIsInheritedMain ? `OAuth profiles stay shared from "${params.sourceAgentId}" unless this agent signs in separately.` : `OAuth profiles were not copied from "${params.sourceAgentId}"; sign in separately for this agent.`;
}
/** Create or update an agent through the non-interactive path or guided wizard. */
async function agentsAddCommand(opts, runtime = require_runtime.defaultRuntime, params) {
	const configSnapshot = await requireValidConfigFileSnapshot(runtime);
	if (!configSnapshot) return;
	const cfg = configSnapshot.sourceConfig ?? configSnapshot.config;
	const baseHash = configSnapshot.hash;
	const workspaceFlag = opts.workspace?.trim();
	const nameInput = opts.name?.trim();
	const hasFlags = params?.hasFlags === true;
	if (opts.nonInteractive === true || hasFlags) {
		if (!workspaceFlag) {
			runtime.error(`Non-interactive agent creation requires --workspace. Re-run ${require_command_format.formatCliCommand("openclaw agents add <id> --workspace <path>")} or omit flags to use the wizard.`);
			runtime.exit(1);
			return;
		}
		if (!nameInput) {
			runtime.error(`Agent name is required in non-interactive mode. Run ${require_command_format.formatCliCommand("openclaw agents add <id> --workspace <path>")}.`);
			runtime.exit(1);
			return;
		}
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(nameInput);
		if (agentId === "main" || require_agent_id.isReservedSystemAgentId(agentId)) {
			runtime.error(`"${agentId}" is reserved. Choose another name, or run ${require_command_format.formatCliCommand("openclaw agents list")} to inspect configured agents.`);
			runtime.exit(1);
			return;
		}
		if (agentId !== nameInput) runtime.log(`Normalized agent id to "${agentId}".`);
		if (require_agents_config.findAgentEntryIndex(require_agent_scope_config.listAgentEntries(cfg), agentId) >= 0) {
			runtime.error(`Agent "${agentId}" already exists. Run ${require_command_format.formatCliCommand("openclaw agents list")} to inspect configured agents.`);
			runtime.exit(1);
			return;
		}
		const workspaceDir = require_home_dir.resolveUserPath(workspaceFlag);
		const explicitAgentDir = opts.agentDir?.trim() ? require_home_dir.resolveUserPath(opts.agentDir.trim()) : void 0;
		const model = opts.model?.trim();
		let committed;
		try {
			committed = await require_install_record_commit.transformConfigWithPendingPluginInstalls({ transform: (latestConfig) => {
				if (require_agents_config.findAgentEntryIndex(require_agent_scope_config.listAgentEntries(latestConfig), agentId) >= 0) throw new AgentsAddMutationError(`Agent "${agentId}" already exists.`);
				const agentDir = explicitAgentDir ?? require_agent_scope_config.resolveAgentDir(latestConfig, agentId);
				const nextConfig = require_agents_config.applyAgentConfig(latestConfig, {
					agentId,
					name: nameInput,
					workspace: workspaceDir,
					agentDir,
					...model ? { model } : {}
				});
				const bindingParse = require_agents_bindings.parseBindingSpecs({
					agentId,
					specs: opts.bind,
					config: nextConfig
				});
				if (bindingParse.errors.length > 0) throw new AgentsAddMutationError(bindingParse.errors.join("\n"));
				const bindingResult = bindingParse.bindings.length > 0 ? require_agents_bindings.applyAgentBindings(nextConfig, bindingParse.bindings) : emptyBindingResult(nextConfig);
				return {
					nextConfig: bindingResult.config,
					result: {
						agentDir,
						bindingResult
					}
				};
			} });
		} catch (err) {
			if (err instanceof AgentsAddMutationError) {
				runtime.error(err.message);
				runtime.exit(1);
				return;
			}
			throw err;
		}
		const mutationResult = committed.result;
		if (!mutationResult) throw new Error("Agent config mutation did not return a result.");
		const { agentDir, bindingResult } = mutationResult;
		if (!opts.json) require_logging.logConfigUpdated(runtime);
		await require_onboard_helpers.ensureWorkspaceAndSessions(workspaceDir, opts.json ? createQuietRuntime(runtime) : runtime, {
			skipBootstrap: Boolean(committed.nextConfig.agents?.defaults?.skipBootstrap),
			skipOptionalBootstrapFiles: committed.nextConfig.agents?.defaults?.skipOptionalBootstrapFiles,
			agentId
		});
		const payload = {
			agentId,
			name: nameInput,
			workspace: workspaceDir,
			agentDir,
			model,
			bindings: {
				added: bindingResult.added.map(require_agents_bindings.describeBinding),
				updated: bindingResult.updated.map(require_agents_bindings.describeBinding),
				skipped: bindingResult.skipped.map(require_agents_bindings.describeBinding),
				conflicts: bindingResult.conflicts.map((conflict) => `${require_agents_bindings.describeBinding(conflict.binding)} (agent=${conflict.existingAgentId})`)
			}
		};
		if (opts.json) require_runtime.writeRuntimeJson(runtime, payload);
		else {
			runtime.log(`Agent: ${agentId}`);
			runtime.log(`Workspace: ${require_utils.shortenHomePath(workspaceDir)}`);
			runtime.log(`Agent dir: ${require_utils.shortenHomePath(agentDir)}`);
			if (model) runtime.log(`Model: ${model}`);
			if (bindingResult.conflicts.length > 0) runtime.error(["Skipped bindings already claimed by another agent:", ...bindingResult.conflicts.map((conflict) => `- ${require_agents_bindings.describeBinding(conflict.binding)} (agent=${conflict.existingAgentId})`)].join("\n"));
		}
		return;
	}
	const prompter = require_clack_prompter.createClackPrompter();
	try {
		await prompter.intro("Add Operator agent");
		const agentName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(nameInput ?? await prompter.text({
			message: "Agent name",
			validate: (value) => {
				if (!value?.trim()) return "Required";
				const normalized = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(value);
				if (normalized === "main" || require_agent_id.isReservedSystemAgentId(normalized)) return `"${normalized}" is reserved. Choose another name.`;
			}
		})) ?? "";
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentName);
		if (agentId === "main" || require_agent_id.isReservedSystemAgentId(agentId)) {
			await prompter.outro(`"${agentId}" is reserved. Choose another name.`);
			return;
		}
		if (agentName !== agentId) await prompter.note(`Normalized id to "${agentId}".`, "Agent id");
		if (require_agent_scope_config.listAgentEntries(cfg).find((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id) === agentId)) {
			if (!await prompter.confirm({
				message: `Agent "${agentId}" already exists. Update it?`,
				initialValue: false
			})) {
				await prompter.outro("No changes made.");
				return;
			}
		}
		const workspaceDefault = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId);
		const workspaceDir = require_home_dir.resolveUserPath((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(await prompter.text({
			message: "Workspace directory",
			initialValue: workspaceDefault,
			validate: (value) => value?.trim() ? void 0 : "Required"
		})) || workspaceDefault);
		const agentDir = require_agent_scope_config.resolveAgentDir(cfg, agentId);
		let nextConfig = require_agents_config.applyAgentConfig(cfg, {
			agentId,
			name: agentName,
			workspace: workspaceDir,
			agentDir
		});
		const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
		if (defaultAgentId !== agentId) {
			const sourceAgentDir = require_agent_scope_config.resolveAgentDir(cfg, defaultAgentId);
			const sourceAuthPath = require_path_resolve.resolveAuthStorePath(sourceAgentDir);
			const destAuthPath = require_path_resolve.resolveAuthStorePath(agentDir);
			const mainAuthPath = require_path_resolve.resolveAuthStorePath(void 0);
			const sameAuthPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.resolve(sourceAuthPath)) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.resolve(destAuthPath));
			const sourceIsInheritedMain = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.resolve(sourceAuthPath)) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(node_path.default.resolve(mainAuthPath));
			if (!sameAuthPath) {
				const sourceStore = require_persisted.loadPersistedAuthProfileStore(sourceAgentDir);
				const destStore = require_persisted.loadPersistedAuthProfileStore(agentDir);
				const portable = sourceStore ? require_auth_profiles.buildPortableAuthProfileStoreForAgentCopy(sourceStore) : void 0;
				if (portable && portable.copiedProfileIds.length > 0 && Object.keys(destStore?.profiles ?? {}).length === 0) {
					if (await prompter.confirm({
						message: `Copy portable auth profiles from "${defaultAgentId}"?`,
						initialValue: false
					})) {
						await node_fs_promises.default.mkdir(agentDir, { recursive: true });
						require_store.saveAuthProfileStore(portable.store, agentDir, {
							filterExternalAuthProfiles: false,
							syncExternalCli: false
						});
						const skippedText = portable.skippedProfileIds.length > 0 ? ` ${formatSkippedOAuthProfilesMessage({
							sourceAgentId: defaultAgentId,
							sourceIsInheritedMain
						})}` : "";
						await prompter.note(`Copied ${portable.copiedProfileIds.length} portable auth profile${portable.copiedProfileIds.length === 1 ? "" : "s"} from "${defaultAgentId}".${skippedText}`, "Auth profiles");
					}
				} else if ((portable?.skippedProfileIds.length ?? 0) > 0) await prompter.note(formatSkippedOAuthProfilesMessage({
					sourceAgentId: defaultAgentId,
					sourceIsInheritedMain
				}), "Auth profiles");
			}
		}
		if (await prompter.confirm({
			message: "Configure model/auth for this agent now?",
			initialValue: false
		})) {
			const authStore = require_store.ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
			while (true) {
				const authResult = await require_auth_choice.applyAuthChoice$1({
					authChoice: await require_auth_choice_prompt.promptAuthChoiceGrouped({
						prompter,
						store: authStore,
						includeSkip: true,
						config: nextConfig
					}),
					config: nextConfig,
					prompter,
					runtime,
					agentDir,
					setDefaultModel: false,
					agentId
				});
				nextConfig = authResult.config;
				if (authResult.retrySelection) continue;
				if (authResult.agentModelOverride) nextConfig = require_agents_config.applyAgentConfig(nextConfig, {
					agentId,
					model: authResult.agentModelOverride
				});
				break;
			}
		}
		await require_auth_choice.warnIfModelConfigLooksOff$1(nextConfig, prompter, {
			agentId,
			agentDir,
			validateCatalog: false
		});
		let selection = [];
		const channelAccountIds = {};
		nextConfig = await require_onboard_channels.setupChannels$1(nextConfig, runtime, prompter, {
			allowIMessageInstall: true,
			allowSignalInstall: true,
			onSelection: (value) => {
				selection = value;
			},
			promptAccountIds: true,
			onAccountId: (channel, accountId) => {
				channelAccountIds[channel] = accountId;
			}
		});
		if (selection.length > 0) if (await prompter.confirm({
			message: "Route selected channels to this agent now? (bindings)",
			initialValue: false
		})) {
			const desiredBindings = require_agents_bindings.buildChannelBindings({
				agentId,
				selection,
				config: nextConfig,
				accountIds: channelAccountIds
			});
			const result = require_agents_bindings.applyAgentBindings(nextConfig, desiredBindings);
			nextConfig = result.config;
			if (result.conflicts.length > 0) await prompter.note(["Skipped bindings already claimed by another agent:", ...result.conflicts.map((conflict) => `- ${require_agents_bindings.describeBinding(conflict.binding)} (agent=${conflict.existingAgentId})`)].join("\n"), "Routing bindings");
		} else await prompter.note(["Routing unchanged. Add bindings when you're ready.", "Docs: https://docs.operator.ai/concepts/multi-agent"].join("\n"), "Routing");
		nextConfig = (await require_install_record_commit.commitConfigWithPendingPluginInstalls({
			nextConfig,
			...baseHash !== void 0 ? { baseHash } : {}
		})).config;
		require_logging.logConfigUpdated(runtime);
		await require_onboard_helpers.ensureWorkspaceAndSessions(workspaceDir, runtime, {
			skipBootstrap: Boolean(nextConfig.agents?.defaults?.skipBootstrap),
			skipOptionalBootstrapFiles: nextConfig.agents?.defaults?.skipOptionalBootstrapFiles,
			agentId
		});
		const payload = {
			agentId,
			name: agentName,
			workspace: workspaceDir,
			agentDir
		};
		if (opts.json) require_runtime.writeRuntimeJson(runtime, payload);
		await prompter.outro(`Agent "${agentId}" ready.`);
	} catch (err) {
		if (err instanceof require_prompts.WizardCancelledError) {
			runtime.exit(1);
			return;
		}
		throw err;
	}
}
//#endregion
exports.agentsAddCommand = agentsAddCommand;
