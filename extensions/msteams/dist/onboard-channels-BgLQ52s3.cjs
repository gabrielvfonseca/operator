require("./rolldown-runtime-u92d-OFm.cjs");
const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
const require_registry = require("./registry-BWWaGAnQ.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_setup_group_access = require("./setup-group-access-CPN6DyTf.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
const require_channel_configured = require("./channel-configured-CF9ewAnb.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_bundled_sources = require("./bundled-sources-xMGcgjbI.cjs");
const require_setup_registry = require("./setup-registry-coak-nw7.cjs");
const require_discovery = require("./discovery-CYGuCwPJ.cjs");
const require_onboarding_plugin_install = require("./onboarding-plugin-install-BVkG7njW.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/logger.ts
/** Adapts a generic logger to the plugin loader logger interface. */
function createPluginLoaderLogger(logger) {
	return {
		info: (msg) => logger.info(msg),
		warn: (msg) => logger.warn(msg),
		error: (msg) => logger.error(msg),
		debug: (msg) => logger.debug?.(msg)
	};
}
//#endregion
//#region src/commands/channel-setup/plugin-install.ts
function toOnboardingPluginInstallEntry(entry) {
	return {
		pluginId: entry.pluginId ?? entry.id,
		label: entry.meta.label,
		install: entry.install,
		...entry.trustedSourceLinkedOfficialInstall ? { trustedSourceLinkedOfficialInstall: true } : {}
	};
}
/** Install or reuse the plugin package required by a trusted channel catalog entry. */
async function ensureChannelSetupPluginInstalled(params) {
	const result = await require_onboarding_plugin_install.ensureOnboardingPluginInstalled({
		cfg: params.cfg,
		entry: toOnboardingPluginInstallEntry(params.entry),
		prompter: params.prompter,
		runtime: params.runtime,
		workspaceDir: params.workspaceDir,
		...params.promptInstall !== void 0 ? { promptInstall: params.promptInstall } : {},
		...params.autoConfirmSingleSource !== void 0 ? { autoConfirmSingleSource: params.autoConfirmSingleSource } : {},
		...params.beforePersistentEffect ? { beforePersistentEffect: params.beforePersistentEffect } : {}
	});
	return {
		cfg: result.cfg,
		installed: result.installed,
		pluginId: result.pluginId,
		status: result.status
	};
}
function loadChannelSetupPluginRegistry(params) {
	const autoEnabled = require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.cfg,
		env: process.env
	});
	const resolvedConfig = autoEnabled.config;
	const workspaceDir = params.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(resolvedConfig, require_agent_scope_config.resolveDefaultAgentId(resolvedConfig));
	const onlyPluginIds = params.onlyPluginIds ?? require_channel_presence_policy.resolveConfiguredChannelPluginIds({
		config: resolvedConfig,
		activationSourceConfig: params.cfg,
		workspaceDir,
		env: process.env
	});
	const log = require_subsystem.createSubsystemLogger("plugins");
	return require_loader.loadOperatorPlugins({
		config: resolvedConfig,
		activationSourceConfig: params.cfg,
		autoEnabledReasons: autoEnabled.autoEnabledReasons,
		workspaceDir,
		cache: false,
		logger: createPluginLoaderLogger(log),
		onlyPluginIds,
		includeSetupOnlyChannelPlugins: true,
		forceSetupOnlyChannelPlugins: params.forceSetupOnlyChannelPlugins,
		activate: params.activate
	});
}
function resolveScopedChannelPluginId(params) {
	const explicitPluginId = params.pluginId?.trim();
	if (explicitPluginId) return explicitPluginId;
	return require_discovery.getTrustedChannelPluginCatalogEntry(params.channel, {
		cfg: params.cfg,
		workspaceDir: params.workspaceDir
	})?.pluginId ?? resolveUniqueManifestScopedChannelPluginId(params);
}
function resolveUniqueManifestScopedChannelPluginId(params) {
	const matches = require_channel_presence_policy.resolveDiscoverableScopedChannelPluginIds({
		config: params.cfg,
		channelIds: [params.channel],
		workspaceDir: params.workspaceDir,
		env: process.env
	});
	return matches.length === 1 ? matches[0] : void 0;
}
/** Load an inactive setup-plugin registry snapshot for resolving a channel without side effects. */
function loadChannelSetupPluginRegistrySnapshotForChannel(params) {
	const scopedPluginId = resolveScopedChannelPluginId({
		cfg: params.cfg,
		channel: params.channel,
		pluginId: params.pluginId,
		workspaceDir: params.workspaceDir
	});
	return loadChannelSetupPluginRegistry({
		...params,
		...scopedPluginId ? { onlyPluginIds: [scopedPluginId] } : {},
		activate: false
	});
}
//#endregion
//#region src/channels/plugins/setup-group-access-configure.ts
/**
* Applies prompted group access config through channel-specific policy/allowlist hooks.
*/
async function configureChannelAccessWithAllowlist(params) {
	let next = params.cfg;
	const accessConfig = await require_setup_group_access.promptChannelAccessConfig({
		prompter: params.prompter,
		label: params.label,
		currentPolicy: params.currentPolicy,
		currentEntries: params.currentEntries,
		placeholder: params.placeholder,
		updatePrompt: params.updatePrompt,
		skipAllowlistEntries: params.skipAllowlistEntries
	});
	if (!accessConfig) return next;
	if (accessConfig.policy !== "allowlist") return params.setPolicy(next, accessConfig.policy);
	if (params.skipAllowlistEntries || !params.resolveAllowlist || !params.applyAllowlist) return params.setPolicy(next, "allowlist");
	const resolved = await params.resolveAllowlist({
		cfg: next,
		entries: accessConfig.entries
	});
	next = params.setPolicy(next, "allowlist");
	return params.applyAllowlist({
		cfg: next,
		resolved
	});
}
//#endregion
//#region src/channels/plugins/setup-wizard.ts
/**
* Channel setup wizard adapter.
*
* Adapts declarative wizard definitions into imperative setup adapters used by onboarding.
*/
async function buildStatus(plugin, wizard, ctx) {
	const accountId = ctx.accountOverrides[plugin.id];
	const configured = await wizard.status.resolveConfigured({
		cfg: ctx.cfg,
		accountId
	});
	const statusLines = await wizard.status.resolveStatusLines?.({
		cfg: ctx.cfg,
		accountId,
		configured
	}) ?? [`${plugin.meta.label}: ${configured ? wizard.status.configuredLabel : wizard.status.unconfiguredLabel}`];
	const selectionHint = await wizard.status.resolveSelectionHint?.({
		cfg: ctx.cfg,
		accountId,
		configured
	}) ?? (configured ? wizard.status.configuredHint : wizard.status.unconfiguredHint);
	const quickstartScore = await wizard.status.resolveQuickstartScore?.({
		cfg: ctx.cfg,
		accountId,
		configured
	}) ?? (configured ? wizard.status.configuredScore : wizard.status.unconfiguredScore);
	return {
		channel: plugin.id,
		configured,
		statusLines,
		selectionHint,
		quickstartScore
	};
}
function applySetupInput(params) {
	const setup = params.plugin.setup;
	if (!setup?.applyAccountConfig) throw new Error(`${params.plugin.id} does not support setup`);
	const resolvedAccountId = setup.resolveAccountId?.({
		cfg: params.cfg,
		accountId: params.accountId,
		input: params.input
	}) ?? params.accountId;
	const validationError = setup.validateInput?.({
		cfg: params.cfg,
		accountId: resolvedAccountId,
		input: params.input
	});
	if (validationError) throw new Error(validationError);
	let next = setup.applyAccountConfig({
		cfg: params.cfg,
		accountId: resolvedAccountId,
		input: params.input
	});
	if (params.input.name?.trim() && setup.applyAccountName) next = setup.applyAccountName({
		cfg: next,
		accountId: resolvedAccountId,
		name: params.input.name
	});
	return {
		cfg: next,
		accountId: resolvedAccountId
	};
}
function collectCredentialValues(params) {
	const values = {};
	for (const credential of params.wizard.credentials) {
		const resolvedValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(credential.inspect({
			cfg: params.cfg,
			accountId: params.accountId
		}).resolvedValue);
		if (resolvedValue) values[credential.inputKey] = resolvedValue;
	}
	return values;
}
async function applyWizardTextInputValue(params) {
	return params.input.applySet ? await params.input.applySet({
		cfg: params.cfg,
		accountId: params.accountId,
		value: params.value
	}) : applySetupInput({
		plugin: params.plugin,
		cfg: params.cfg,
		accountId: params.accountId,
		input: { [params.input.inputKey]: params.value }
	}).cfg;
}
function buildChannelSetupWizardAdapterFromSetupWizard(params) {
	const { plugin, wizard } = params;
	return {
		channel: plugin.id,
		getStatus: async (ctx) => buildStatus(plugin, wizard, ctx),
		configure: async ({ cfg, runtime, prompter, options, accountOverrides, shouldPromptAccountIds, forceAllowFrom }) => {
			const defaultAccountId = plugin.config.defaultAccountId?.(cfg) ?? plugin.config.listAccountIds(cfg)[0] ?? "default";
			const resolvedShouldPromptAccountIds = wizard.resolveShouldPromptAccountIds?.({
				cfg,
				options,
				shouldPromptAccountIds
			}) ?? shouldPromptAccountIds;
			const accountId = await (wizard.resolveAccountIdForConfigure ? wizard.resolveAccountIdForConfigure({
				cfg,
				prompter,
				options,
				accountOverride: accountOverrides[plugin.id],
				shouldPromptAccountIds: resolvedShouldPromptAccountIds,
				listAccountIds: plugin.config.listAccountIds,
				defaultAccountId
			}) : require_setup_group_access.resolveAccountIdForConfigure({
				cfg,
				prompter,
				label: plugin.meta.label,
				accountOverride: accountOverrides[plugin.id],
				shouldPromptAccountIds: resolvedShouldPromptAccountIds,
				listAccountIds: plugin.config.listAccountIds,
				defaultAccountId
			}));
			let next = cfg;
			let credentialValues = collectCredentialValues({
				wizard,
				cfg: next,
				accountId
			});
			let usedEnvShortcut = false;
			if (wizard.envShortcut?.isAvailable({
				cfg: next,
				accountId
			})) {
				if (await prompter.confirm({
					message: wizard.envShortcut.prompt,
					initialValue: true
				})) {
					next = await wizard.envShortcut.apply({
						cfg: next,
						accountId
					});
					credentialValues = collectCredentialValues({
						wizard,
						cfg: next,
						accountId
					});
					usedEnvShortcut = true;
				}
			}
			if (!usedEnvShortcut && (wizard.introNote?.shouldShow ? await wizard.introNote.shouldShow({
				cfg: next,
				accountId,
				credentialValues
			}) : Boolean(wizard.introNote)) && wizard.introNote) await prompter.note(wizard.introNote.lines.join("\n"), wizard.introNote.title);
			if (wizard.prepare) {
				const prepared = await wizard.prepare({
					cfg: next,
					accountId,
					credentialValues,
					runtime,
					prompter,
					options
				});
				if (prepared?.cfg) next = prepared.cfg;
				if (prepared?.credentialValues) credentialValues = {
					...credentialValues,
					...prepared.credentialValues
				};
			}
			const runCredentialSteps = async () => {
				if (usedEnvShortcut) return;
				for (const credential of wizard.credentials) {
					let credentialState = credential.inspect({
						cfg: next,
						accountId
					});
					let resolvedCredentialValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(credentialState.resolvedValue);
					if (!(credential.shouldPrompt ? await credential.shouldPrompt({
						cfg: next,
						accountId,
						credentialValues,
						currentValue: resolvedCredentialValue,
						state: credentialState
					}) : true)) {
						if (resolvedCredentialValue) credentialValues[credential.inputKey] = resolvedCredentialValue;
						else delete credentialValues[credential.inputKey];
						continue;
					}
					const allowEnv = credential.allowEnv?.({
						cfg: next,
						accountId
					}) ?? false;
					const credentialResult = await require_setup_group_access.runSingleChannelSecretStep({
						cfg: next,
						prompter,
						providerHint: credential.providerHint,
						credentialLabel: credential.credentialLabel,
						secretInputMode: options?.secretInputMode,
						accountConfigured: credentialState.accountConfigured,
						hasConfigToken: credentialState.hasConfiguredValue,
						allowEnv,
						envValue: credentialState.envValue,
						envPrompt: credential.envPrompt,
						keepPrompt: credential.keepPrompt,
						inputPrompt: credential.inputPrompt,
						preferredEnvVar: credential.preferredEnvVar,
						onMissingConfigured: credential.helpLines && credential.helpLines.length > 0 ? async () => {
							await prompter.note(credential.helpLines.join("\n"), credential.helpTitle ?? credential.credentialLabel);
						} : void 0,
						applyUseEnv: async (currentCfg) => credential.applyUseEnv ? await credential.applyUseEnv({
							cfg: currentCfg,
							accountId
						}) : applySetupInput({
							plugin,
							cfg: currentCfg,
							accountId,
							input: {
								[credential.inputKey]: void 0,
								useEnv: true
							}
						}).cfg,
						applySet: async (currentCfg, value, resolvedValue) => {
							resolvedCredentialValue = resolvedValue;
							return credential.applySet ? await credential.applySet({
								cfg: currentCfg,
								accountId,
								credentialValues,
								value,
								resolvedValue
							}) : applySetupInput({
								plugin,
								cfg: currentCfg,
								accountId,
								input: {
									[credential.inputKey]: value,
									useEnv: false
								}
							}).cfg;
						}
					});
					next = credentialResult.cfg;
					credentialState = credential.inspect({
						cfg: next,
						accountId
					});
					resolvedCredentialValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(credentialResult.resolvedValue) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(credentialState.resolvedValue);
					if (resolvedCredentialValue) credentialValues[credential.inputKey] = resolvedCredentialValue;
					else delete credentialValues[credential.inputKey];
				}
			};
			const runTextInputSteps = async () => {
				for (const textInput of wizard.textInputs ?? []) {
					let currentValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typeof credentialValues[textInput.inputKey] === "string" ? credentialValues[textInput.inputKey] : void 0);
					if (!currentValue && textInput.currentValue) currentValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(await textInput.currentValue({
						cfg: next,
						accountId,
						credentialValues
					}));
					if (!(textInput.shouldPrompt ? await textInput.shouldPrompt({
						cfg: next,
						accountId,
						credentialValues,
						currentValue
					}) : true)) {
						if (currentValue) {
							credentialValues[textInput.inputKey] = currentValue;
							if (textInput.applyCurrentValue) next = await applyWizardTextInputValue({
								plugin,
								input: textInput,
								cfg: next,
								accountId,
								value: currentValue
							});
						}
						continue;
					}
					if (textInput.helpLines && textInput.helpLines.length > 0) await prompter.note(textInput.helpLines.join("\n"), textInput.helpTitle ?? textInput.message);
					if (currentValue && textInput.confirmCurrentValue !== false) {
						if (await prompter.confirm({
							message: typeof textInput.keepPrompt === "function" ? textInput.keepPrompt(currentValue) : textInput.keepPrompt ?? `${textInput.message} set (${currentValue}). Keep it?`,
							initialValue: true
						})) {
							credentialValues[textInput.inputKey] = currentValue;
							if (textInput.applyCurrentValue) next = await applyWizardTextInputValue({
								plugin,
								input: textInput,
								cfg: next,
								accountId,
								value: currentValue
							});
							continue;
						}
					}
					const initialValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(await textInput.initialValue?.({
						cfg: next,
						accountId,
						credentialValues
					}) ?? currentValue);
					const trimmedValue = (await prompter.text({
						message: textInput.message,
						initialValue,
						placeholder: textInput.placeholder,
						validate: (value) => {
							const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "";
							if (!trimmed && textInput.required !== false) return "Required";
							return textInput.validate?.({
								value: trimmed,
								cfg: next,
								accountId,
								credentialValues
							});
						}
					})).trim();
					if (!trimmedValue && textInput.required === false) {
						if (textInput.applyEmptyValue) next = await applyWizardTextInputValue({
							plugin,
							input: textInput,
							cfg: next,
							accountId,
							value: ""
						});
						delete credentialValues[textInput.inputKey];
						continue;
					}
					const normalizedValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(textInput.normalizeValue?.({
						value: trimmedValue,
						cfg: next,
						accountId,
						credentialValues
					}) ?? trimmedValue);
					if (!normalizedValue) {
						delete credentialValues[textInput.inputKey];
						continue;
					}
					next = await applyWizardTextInputValue({
						plugin,
						input: textInput,
						cfg: next,
						accountId,
						value: normalizedValue
					});
					credentialValues[textInput.inputKey] = normalizedValue;
				}
			};
			if (wizard.stepOrder === "text-first") {
				await runTextInputSteps();
				await runCredentialSteps();
			} else {
				await runCredentialSteps();
				await runTextInputSteps();
			}
			if (wizard.groupAccess) {
				const access = wizard.groupAccess;
				if (access.helpLines && access.helpLines.length > 0) await prompter.note(access.helpLines.join("\n"), access.helpTitle ?? access.label);
				next = await configureChannelAccessWithAllowlist({
					cfg: next,
					prompter,
					label: access.label,
					currentPolicy: access.currentPolicy({
						cfg: next,
						accountId
					}),
					currentEntries: access.currentEntries({
						cfg: next,
						accountId
					}),
					placeholder: access.placeholder,
					updatePrompt: access.updatePrompt({
						cfg: next,
						accountId
					}),
					skipAllowlistEntries: access.skipAllowlistEntries,
					setPolicy: (currentCfg, policy) => access.setPolicy({
						cfg: currentCfg,
						accountId,
						policy
					}),
					resolveAllowlist: access.resolveAllowlist ? async ({ cfg: currentCfg, entries }) => await access.resolveAllowlist({
						cfg: currentCfg,
						accountId,
						credentialValues,
						entries,
						prompter
					}) : void 0,
					applyAllowlist: access.applyAllowlist ? ({ cfg: currentCfg, resolved }) => access.applyAllowlist({
						cfg: currentCfg,
						accountId,
						resolved
					}) : void 0
				});
			}
			if (forceAllowFrom && wizard.allowFrom) {
				const allowFrom = wizard.allowFrom;
				const credentialInputKey = allowFrom.credentialInputKey ?? wizard.credentials[0]?.inputKey;
				const allowFromCredentialValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(credentialInputKey === void 0 ? void 0 : credentialValues[credentialInputKey]);
				if (allowFrom.helpLines && allowFrom.helpLines.length > 0) await prompter.note(allowFrom.helpLines.join("\n"), allowFrom.helpTitle ?? `${plugin.meta.label} allowlist`);
				const unique = await require_setup_group_access.promptResolvedAllowFrom({
					prompter,
					existing: plugin.config.resolveAllowFrom?.({
						cfg: next,
						accountId
					}) ?? [],
					token: allowFromCredentialValue,
					message: allowFrom.message,
					placeholder: allowFrom.placeholder,
					label: allowFrom.helpTitle ?? `${plugin.meta.label} allowlist`,
					parseInputs: allowFrom.parseInputs ?? require_setup_group_access.splitSetupEntries,
					parseId: allowFrom.parseId,
					invalidWithoutTokenNote: allowFrom.invalidWithoutCredentialNote,
					resolveEntries: async ({ entries }) => allowFrom.resolveEntries({
						cfg: next,
						accountId,
						credentialValues,
						entries
					})
				});
				next = await allowFrom.apply({
					cfg: next,
					accountId,
					allowFrom: unique
				});
			}
			if (wizard.finalize) {
				const finalized = await wizard.finalize({
					cfg: next,
					accountId,
					credentialValues,
					runtime,
					prompter,
					options,
					forceAllowFrom
				});
				if (finalized?.cfg) next = finalized.cfg;
				if (finalized?.credentialValues) credentialValues = {
					...credentialValues,
					...finalized.credentialValues
				};
			}
			if (wizard.completionNote && (wizard.completionNote.shouldShow ? await wizard.completionNote.shouldShow({
				cfg: next,
				accountId,
				credentialValues
			}) : true) && wizard.completionNote) await prompter.note(wizard.completionNote.lines.join("\n"), wizard.completionNote.title);
			return {
				cfg: next,
				accountId
			};
		},
		dmPolicy: wizard.dmPolicy,
		disable: wizard.disable,
		onAccountRecorded: wizard.onAccountRecorded
	};
}
//#endregion
//#region src/commands/channel-setup/registry.ts
const setupWizardAdapters = /* @__PURE__ */ new WeakMap();
function isChannelSetupWizardAdapter(setupWizard) {
	return Boolean(setupWizard && typeof setupWizard === "object" && "getStatus" in setupWizard && typeof setupWizard.getStatus === "function" && "configure" in setupWizard && typeof setupWizard.configure === "function");
}
function isDeclarativeChannelSetupWizard(setupWizard) {
	return Boolean(setupWizard && typeof setupWizard === "object" && "status" in setupWizard && "credentials" in setupWizard);
}
/** Resolve the setup wizard adapter exposed by one channel plugin, caching declarative adapters. */
function resolveChannelSetupWizardAdapterForPlugin(plugin) {
	if (!plugin) return;
	const { setupWizard } = plugin;
	if (isChannelSetupWizardAdapter(setupWizard)) return setupWizard;
	if (isDeclarativeChannelSetupWizard(setupWizard)) {
		const cached = setupWizardAdapters.get(plugin);
		if (cached) return cached;
		const adapter = buildChannelSetupWizardAdapterFromSetupWizard({
			plugin,
			wizard: setupWizard
		});
		setupWizardAdapters.set(plugin, adapter);
		return adapter;
	}
}
//#endregion
//#region src/flows/channel-setup.prompts.ts
/** Formats account ids for channel setup prompts. */
function formatAccountLabel(accountId) {
	return accountId === "default" ? "default (primary)" : accountId;
}
/** Asks what to do with an already-configured channel account. */
async function promptConfiguredAction(params) {
	const { prompter, label, supportsDisable, supportsDelete } = params;
	const options = [
		{
			value: "update",
			label: require_i18n.t("wizard.channels.modifySettings")
		},
		...supportsDisable ? [{
			value: "disable",
			label: require_i18n.t("wizard.channels.disableKeepConfig")
		}] : [],
		...supportsDelete ? [{
			value: "delete",
			label: require_i18n.t("wizard.channels.deleteConfig")
		}] : [],
		{
			value: "skip",
			label: require_i18n.t("wizard.channels.skipLeaveAsIs")
		}
	];
	return await prompter.select({
		message: require_i18n.t("wizard.channels.configuredAction", { label }),
		options,
		initialValue: "update"
	});
}
/** Selects the account to remove/update when a channel supports multiple accounts. */
async function promptRemovalAccountId(params) {
	const { cfg, prompter, label, channel } = params;
	const plugin = params.plugin ?? require_setup_registry.getChannelSetupPlugin(channel);
	if (!plugin) return require_account_id.DEFAULT_ACCOUNT_ID;
	const accountIds = plugin.config.listAccountIds(cfg).filter(Boolean);
	const defaultAccountId = require_helpers.resolveChannelDefaultAccountId({
		plugin,
		cfg,
		accountIds
	});
	if (accountIds.length <= 1) return defaultAccountId;
	return require_account_id.normalizeAccountId(await prompter.select({
		message: require_i18n.t("wizard.channels.account", { label }),
		options: accountIds.map((accountId) => ({
			value: accountId,
			label: formatAccountLabel(accountId)
		})),
		initialValue: defaultAccountId
	})) ?? defaultAccountId;
}
/** Optionally configures DM access policies for selected channel setup adapters. */
async function maybeConfigureDmPolicies(params) {
	const { selection, prompter, accountIdsByChannel } = params;
	const resolve = params.resolveAdapter ?? (() => void 0);
	const dmPolicies = selection.map((channel) => resolve(channel)?.dmPolicy).filter(Boolean);
	if (dmPolicies.length === 0) return params.cfg;
	if (!await prompter.confirm({
		message: require_i18n.t("wizard.channels.configureDmPolicies"),
		initialValue: false
	})) return params.cfg;
	let cfg = params.cfg;
	for (const policy of dmPolicies) {
		const accountId = accountIdsByChannel?.get(policy.channel);
		const { policyKey, allowFromKey } = policy.resolveConfigKeys?.(cfg, accountId) ?? {
			policyKey: policy.policyKey,
			allowFromKey: policy.allowFromKey
		};
		await prompter.note([
			require_i18n.t("wizard.channels.dmPolicyDefault"),
			require_i18n.t("wizard.channels.dmPolicyApprove", { command: require_command_format.formatCliCommand(`operator pairing approve ${policy.channel} <code>`) }),
			require_i18n.t("wizard.channels.dmPolicyAllowlist", {
				allowFromKey,
				policyKey
			}),
			require_i18n.t("wizard.channels.dmPolicyOpen", {
				allowFromKey,
				policyKey
			}),
			require_i18n.t("wizard.channels.dmPolicyMultiUser", { command: require_command_format.formatCliCommand("operator config set session.dmScope \"per-channel-peer\"") }),
			require_i18n.t("wizard.channels.docs", { link: require_setup_group_access.formatDocsLink("/channels/pairing", "channels/pairing") })
		].join("\n"), require_i18n.t("wizard.channels.dmAccessTitle", { label: policy.label }));
		const nextPolicy = await prompter.select({
			message: require_i18n.t("wizard.channels.dmPolicy", { label: policy.label }),
			options: [
				{
					value: "pairing",
					label: require_i18n.t("wizard.channels.dmPolicyPairing")
				},
				{
					value: "allowlist",
					label: require_i18n.t("wizard.channels.dmPolicyAllowlistOption")
				},
				{
					value: "open",
					label: require_i18n.t("wizard.channels.dmPolicyOpenOption")
				},
				{
					value: "disabled",
					label: require_i18n.t("wizard.channels.dmPolicyDisabledOption")
				}
			]
		});
		if (nextPolicy !== policy.getCurrent(cfg, accountId)) cfg = policy.setPolicy(cfg, nextPolicy, accountId);
		if (nextPolicy === "allowlist" && policy.promptAllowFrom) cfg = await policy.promptAllowFrom({
			cfg,
			prompter,
			accountId
		});
	}
	return cfg;
}
//#endregion
//#region src/flows/channel-setup.status.ts
const CHANNEL_PRIMER_BLURB_KEYS = {
	clickclack: "wizard.channelsPrimer.blurbs.clickclack",
	discord: "wizard.channelsPrimer.blurbs.discord",
	feishu: "wizard.channelsPrimer.blurbs.feishu",
	googlechat: "wizard.channelsPrimer.blurbs.googlechat",
	imessage: "wizard.channelsPrimer.blurbs.imessage",
	irc: "wizard.channelsPrimer.blurbs.irc",
	line: "wizard.channelsPrimer.blurbs.line",
	mattermost: "wizard.channelsPrimer.blurbs.mattermost",
	matrix: "wizard.channelsPrimer.blurbs.matrix",
	msteams: "wizard.channelsPrimer.blurbs.msteams",
	"nextcloud-talk": "wizard.channelsPrimer.blurbs.nextcloudTalk",
	nostr: "wizard.channelsPrimer.blurbs.nostr",
	qqbot: "wizard.channelsPrimer.blurbs.qqbot",
	signal: "wizard.channelsPrimer.blurbs.signal",
	slack: "wizard.channelsPrimer.blurbs.slack",
	"synology-chat": "wizard.channelsPrimer.blurbs.synologyChat",
	telegram: "wizard.channelsPrimer.blurbs.telegram",
	tlon: "wizard.channelsPrimer.blurbs.tlon",
	twitch: "wizard.channelsPrimer.blurbs.twitch",
	wecom: "wizard.channelsPrimer.blurbs.wecom",
	whatsapp: "wizard.channelsPrimer.blurbs.whatsapp",
	yuanbao: "wizard.channelsPrimer.blurbs.yuanbao",
	zalo: "wizard.channelsPrimer.blurbs.zalo",
	zalouser: "wizard.channelsPrimer.blurbs.zalouser"
};
function buildChannelSetupSelectionContribution(params) {
	return {
		id: `channel:setup:${params.channel}`,
		kind: "channel",
		surface: "setup",
		channel: params.channel,
		option: {
			value: params.channel,
			label: params.label,
			...params.hint ? { hint: params.hint } : {}
		},
		source: params.source
	};
}
function formatSetupSelectionLabel(label, fallback) {
	return require_safe_text.sanitizeTerminalText(label).trim() || require_safe_text.sanitizeTerminalText(fallback).trim() || "<invalid channel>";
}
function formatSetupSelectionHint(hint) {
	if (!hint) return;
	return require_safe_text.sanitizeTerminalText(hint) || void 0;
}
function formatSetupDisplayText(value, fallback = "") {
	return require_safe_text.sanitizeTerminalText(value ?? "").trim() || require_safe_text.sanitizeTerminalText(fallback).trim() || "<invalid channel>";
}
function formatSetupFreeText(value) {
	return require_safe_text.sanitizeTerminalText(value ?? "").trim();
}
function formatSetupOptionalDisplayText(value) {
	return require_safe_text.sanitizeTerminalText(value ?? "").trim() || void 0;
}
function formatSetupDisplayList(values) {
	const safe = (values ?? []).flatMap((value) => {
		const sanitized = formatSetupOptionalDisplayText(value);
		return sanitized ? [sanitized] : [];
	});
	return safe.length > 0 ? safe : void 0;
}
function formatSetupDisplayMeta(meta) {
	const safeId = formatSetupDisplayText(meta.id, "<invalid channel>");
	const safeLabel = formatSetupDisplayText(meta.label, safeId);
	const safeSelectionDocsPrefix = formatSetupOptionalDisplayText(meta.selectionDocsPrefix);
	const safeSelectionExtras = formatSetupDisplayList(meta.selectionExtras);
	return {
		...meta,
		id: safeId,
		label: safeLabel,
		selectionLabel: formatSetupDisplayText(meta.selectionLabel, safeLabel),
		docsPath: formatSetupDisplayText(meta.docsPath, "/"),
		...meta.docsLabel ? { docsLabel: formatSetupDisplayText(meta.docsLabel, safeId) } : {},
		blurb: formatSetupFreeText(meta.blurb),
		...safeSelectionDocsPrefix ? { selectionDocsPrefix: safeSelectionDocsPrefix } : {},
		...safeSelectionExtras ? { selectionExtras: safeSelectionExtras } : {}
	};
}
function formatChannelPrimerBlurb(channel) {
	const key = CHANNEL_PRIMER_BLURB_KEYS[channel.id];
	if (!key) return channel.blurb;
	const englishBlurb = require_i18n.wizardT(key, void 0, { locale: "en" });
	return channel.blurb === englishBlurb ? require_i18n.t(key) : channel.blurb;
}
function formatChannelSelectionMeta(meta) {
	return formatSetupDisplayMeta({
		...meta,
		blurb: formatChannelPrimerBlurb(meta),
		selectionDocsPrefix: meta.selectionDocsPrefix ?? require_i18n.t("common.docs")
	});
}
function localizeChannelStatusLabel(label) {
	switch (label) {
		case "configured": return require_i18n.t("wizard.channels.statusConfigured");
		case "not configured": return require_i18n.t("wizard.channels.statusNotConfigured");
		case "configured (plugin disabled)": return require_i18n.t("wizard.channels.statusConfiguredPluginDisabled");
		case "installed": return require_i18n.t("wizard.channels.statusInstalled");
		case "installed (plugin disabled)": return require_i18n.t("wizard.channels.statusInstalledPluginDisabled");
		case "bundled · enable to use": return require_i18n.t("wizard.channels.statusBundledEnable");
		case "install plugin to enable": return require_i18n.t("wizard.channels.statusInstallPluginEnable");
		case "needs app credentials": return require_i18n.t("wizard.channels.statusNeedsAppCredentials");
		case "needs app creds": return require_i18n.t("wizard.channels.statusNeedsAppCreds");
		case "needs auth": return require_i18n.t("wizard.channels.statusNeedsAuth");
		case "needs host + nick": return require_i18n.t("wizard.channels.statusNeedsHostNick");
		case "needs private key": return require_i18n.t("wizard.channels.statusNeedsPrivateKey");
		case "needs QR login": return require_i18n.t("wizard.channels.statusNeedsQrLogin");
		case "needs service account": return require_i18n.t("wizard.channels.statusNeedsServiceAccount");
		case "needs setup": return require_i18n.t("wizard.channels.statusNeedsSetup");
		case "needs token": return require_i18n.t("wizard.channels.statusNeedsToken");
		case "needs tokens": return require_i18n.t("wizard.channels.statusNeedsTokens");
		case "needs token + incoming webhook": return require_i18n.t("wizard.channels.statusNeedsTokenIncomingWebhook");
		case "needs token + secret": return require_i18n.t("wizard.channels.statusNeedsTokenSecret");
		case "needs token + url": return require_i18n.t("wizard.channels.statusNeedsTokenUrl");
		case "needs username, token, and clientId": return require_i18n.t("wizard.channels.statusNeedsUsernameTokenClientId");
		case "linked": return require_i18n.t("wizard.channels.statusLinked");
		case "logged in": return require_i18n.t("wizard.channels.statusLoggedIn");
		case "not linked": return require_i18n.t("wizard.channels.statusNotLinked");
		case "recommended · configured": return require_i18n.t("wizard.channels.statusRecommendedConfigured");
		case "recommended · logged in": return require_i18n.t("wizard.channels.statusRecommendedLoggedIn");
		case "recommended · newcomer-friendly": return require_i18n.t("wizard.channels.statusRecommendedNewcomerFriendly");
		case "recommended · QR login": return require_i18n.t("wizard.channels.statusRecommendedQrLogin");
		case "self-hosted chat": return require_i18n.t("wizard.channels.statusSelfHostedChat");
		case "signal-cli found": return require_i18n.t("wizard.channels.statusSignalCliFound");
		case "signal-cli missing": return require_i18n.t("wizard.channels.statusSignalCliMissing");
		case "urbit messenger": return require_i18n.t("wizard.channels.statusUrbitMessenger");
		case "configured (connection not verified)": return require_i18n.t("wizard.channels.statusConfiguredConnectionNotVerified");
		default: break;
	}
	if (label.startsWith("connected as ")) return require_i18n.t("wizard.channels.statusConnectedAs", { name: label.slice(13) });
	return label;
}
function localizeChannelStatusLine(line) {
	const index = line.lastIndexOf(": ");
	if (index < 0) return localizeChannelStatusLabel(line);
	return `${line.slice(0, index + 2)}${localizeChannelStatusLabel(line.slice(index + 2))}`;
}
function localizeChannelSetupStatus(status) {
	return {
		...status,
		statusLines: status.statusLines.map(localizeChannelStatusLine),
		...status.selectionHint ? { selectionHint: localizeChannelStatusLabel(status.selectionHint) } : {}
	};
}
/**
* Hint shown next to an installable channel option in the selection menu when
* we don't yet have a runtime-collected status. Mirrors the "configured" /
* "installed" affordance other channels get so users can see "download from
* <npm-spec>" before committing to install.
*
* Bundled channels (the plugin lives under `extensions/<id>` in the host
* repo, e.g. Signal / Tlon / Twitch / Slack) are NOT downloaded from npm —
* they ship with the host. Even when their `package.json` declares an
* `npmSpec` (or the catalog falls back to the package name), surfacing
* "download from <npm-spec>" misleads users into believing the plugin is
* missing. For bundled channels we suppress the npm hint entirely so the
* menu shows the same neutral "plugin · install" affordance used when no
* npm source is known.
*/
function resolveCatalogChannelSelectionHint(entry, options) {
	const npmSpec = entry.install?.npmSpec?.trim();
	if (npmSpec && !options?.bundledLocalPath) return `download from ${formatSetupSelectionLabel(npmSpec, npmSpec)}`;
	return "";
}
/**
* Look up the bundled-source entry for a catalog channel, regardless of
* whether the catalog refers to it by `pluginId` or `npmSpec`. We use this
* to detect bundled channels in the selection menu so we can suppress the
* misleading "download from <npm-spec>" hint for plugins that already ship
* with the host (Signal / Tlon / Twitch / Slack ...).
*/
function findBundledSourceForCatalogChannel(params) {
	const pluginId = params.entry.pluginId?.trim() || params.entry.id.trim();
	if (pluginId) {
		const byId = require_bundled_sources.findBundledPluginSourceInMap({
			bundled: params.bundled,
			lookup: {
				kind: "pluginId",
				value: pluginId
			}
		});
		if (byId) return byId;
	}
	const npmSpec = params.entry.install?.npmSpec?.trim();
	if (npmSpec) return require_bundled_sources.findBundledPluginSourceInMap({
		bundled: params.bundled,
		lookup: {
			kind: "npmSpec",
			value: npmSpec
		}
	});
}
async function collectChannelStatus(params) {
	const installedPlugins = params.installedPlugins ?? require_setup_registry.listChannelSetupPlugins();
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, require_agent_scope_config.resolveDefaultAgentId(params.cfg));
	const { installedCatalogEntries, installableCatalogEntries } = require_discovery.resolveChannelSetupEntries({
		cfg: params.cfg,
		installedPlugins,
		workspaceDir
	});
	const bundledSources = require_bundled_sources.resolveBundledPluginSources({ workspaceDir });
	const resolveAdapter = params.resolveAdapter ?? ((channel) => resolveChannelSetupWizardAdapterForPlugin(installedPlugins.find((plugin) => plugin.id === channel)));
	const statusEntries = await Promise.all(installedPlugins.flatMap((plugin) => {
		if (!require_discovery.shouldShowChannelInSetup(plugin.meta)) return [];
		const adapter = resolveAdapter(plugin.id);
		if (!adapter) return [];
		return adapter.getStatus({
			cfg: params.cfg,
			options: params.options,
			accountOverrides: params.accountOverrides
		});
	}));
	const statusByChannel = new Map(statusEntries.map((entry) => [entry.channel, entry]));
	const fallbackStatuses = require_registry.listChatChannels().filter((meta) => require_discovery.shouldShowChannelInSetup(meta)).filter((meta) => !statusByChannel.has(meta.id)).map((meta) => {
		const configured = require_channel_configured.isChannelConfigured(params.cfg, meta.id);
		const statusLabel = configured ? "configured (plugin disabled)" : "not configured";
		return {
			channel: meta.id,
			configured,
			statusLines: [`${formatSetupSelectionLabel(meta.label, meta.id)}: ${statusLabel}`],
			selectionHint: configured ? "configured · plugin disabled" : "not configured",
			quickstartScore: 0
		};
	});
	const discoveredPluginStatuses = installedCatalogEntries.filter((entry) => !statusByChannel.has(entry.id)).map((entry) => {
		const configured = require_channel_configured.isChannelConfigured(params.cfg, entry.id);
		const pluginEnabled = params.cfg.plugins?.entries?.[entry.pluginId ?? entry.id]?.enabled !== false;
		const statusLabel = configured ? pluginEnabled ? "configured" : "configured (plugin disabled)" : pluginEnabled ? "installed" : "installed (plugin disabled)";
		return {
			channel: entry.id,
			configured,
			statusLines: [`${formatSetupSelectionLabel(entry.meta.label, entry.id)}: ${statusLabel}`],
			selectionHint: statusLabel,
			quickstartScore: 0
		};
	});
	const catalogStatuses = installableCatalogEntries.map((entry) => {
		const bundledLocalPath = findBundledSourceForCatalogChannel({
			bundled: bundledSources,
			entry
		})?.localPath ?? null;
		const statusLabel = Boolean(bundledLocalPath) ? "bundled · enable to use" : "install plugin to enable";
		return {
			channel: entry.id,
			configured: false,
			statusLines: [`${formatSetupSelectionLabel(entry.meta.label, entry.id)}: ${statusLabel}`],
			selectionHint: resolveCatalogChannelSelectionHint(entry, { bundledLocalPath }),
			quickstartScore: 0
		};
	});
	const combinedStatuses = [
		...statusEntries,
		...fallbackStatuses,
		...discoveredPluginStatuses,
		...catalogStatuses
	].map(localizeChannelSetupStatus);
	return {
		installedPlugins,
		catalogEntries: installableCatalogEntries,
		installedCatalogEntries,
		statusByChannel: new Map(combinedStatuses.map((entry) => [entry.channel, entry])),
		statusLines: combinedStatuses.flatMap((entry) => entry.statusLines)
	};
}
async function noteChannelStatus(params) {
	const { statusLines } = await collectChannelStatus({
		cfg: params.cfg,
		options: params.options,
		accountOverrides: params.accountOverrides ?? {},
		installedPlugins: params.installedPlugins,
		resolveAdapter: params.resolveAdapter
	});
	if (statusLines.length > 0) await params.prompter.note(statusLines.join("\n"), require_i18n.t("wizard.channels.statusTitle"));
}
async function noteChannelPrimer(prompter, channels) {
	const channelLines = channels.map((channel) => require_registry.formatChannelPrimerLine(formatSetupDisplayMeta({
		id: channel.id,
		label: channel.label,
		selectionLabel: channel.label,
		docsPath: "/",
		blurb: formatChannelPrimerBlurb(channel)
	})));
	await prompter.note([
		require_i18n.t("wizard.channelsPrimer.inboundSafety"),
		require_i18n.t("wizard.channelsPrimer.approveWith", { command: require_command_format.formatCliCommand("operator pairing approve <channel> <code>") }),
		require_i18n.t("wizard.channelsPrimer.openDm"),
		require_i18n.t("wizard.channelsPrimer.multiUserDm", { command: require_command_format.formatCliCommand("operator config set session.dmScope \"per-channel-peer\"") }),
		require_i18n.t("wizard.channelsPrimer.docs", { link: require_setup_group_access.formatDocsLink("/channels/pairing", "channels/pairing") }),
		"",
		...channelLines
	].join("\n"), require_i18n.t("wizard.channelsPrimer.title"));
}
function resolveQuickstartDefault(statusByChannel) {
	let best = null;
	for (const [channel, status] of statusByChannel) {
		if (status.quickstartScore == null) continue;
		if (!best || status.quickstartScore > best.score) best = {
			channel,
			score: status.quickstartScore
		};
	}
	return best?.channel;
}
function resolveChannelSelectionNoteLines(params) {
	const { entries } = require_discovery.resolveChannelSetupEntries({
		cfg: params.cfg,
		installedPlugins: params.installedPlugins,
		workspaceDir: require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, require_agent_scope_config.resolveDefaultAgentId(params.cfg))
	});
	const selectionNotes = /* @__PURE__ */ new Map();
	for (const entry of entries) selectionNotes.set(entry.id, require_registry.formatChannelSelectionLine(formatChannelSelectionMeta(entry.meta), require_setup_group_access.formatDocsLink));
	return params.selection.map((channel) => selectionNotes.get(channel)).filter((line) => Boolean(line));
}
function resolveChannelSetupSelectionContributions(params) {
	const bundledChannelIds = new Set(require_registry.listChatChannels().map((channel) => channel.id));
	return params.entries.filter((entry) => require_discovery.shouldShowChannelInSetup(entry.meta)).toSorted((left, right) => compareChannelSetupSelectionEntries(left, right)).map((entry) => {
		const disabledHint = params.resolveDisabledHint(entry.id);
		const hint = [params.statusByChannel.get(entry.id)?.selectionHint, disabledHint].filter(Boolean).join(" · ") || void 0;
		return buildChannelSetupSelectionContribution({
			channel: entry.id,
			label: formatSetupSelectionLabel(entry.meta.selectionLabel ?? entry.meta.label, entry.id),
			hint: formatSetupSelectionHint(hint),
			source: bundledChannelIds.has(entry.id) ? "core" : "plugin"
		});
	});
}
function compareChannelSetupSelectionEntries(left, right) {
	const leftLabel = left.meta.selectionLabel ?? left.meta.label;
	const rightLabel = right.meta.selectionLabel ?? right.meta.label;
	return leftLabel.localeCompare(rightLabel, void 0, {
		numeric: true,
		sensitivity: "base"
	}) || left.id.localeCompare(right.id, void 0, {
		numeric: true,
		sensitivity: "base"
	});
}
//#endregion
//#region src/flows/channel-setup.ts
function createChannelOnboardingPostWriteHookCollector() {
	const hooks = /* @__PURE__ */ new Map();
	return {
		collect(hook) {
			hooks.set(`${hook.channel}:${hook.accountId}`, hook);
		},
		drain() {
			const next = [...hooks.values()];
			hooks.clear();
			return next;
		}
	};
}
async function runCollectedChannelOnboardingPostWriteHooks(params) {
	for (const hook of params.hooks) {
		await params.beforePersistentEffect?.();
		try {
			await hook.run({
				cfg: params.cfg,
				runtime: params.runtime
			});
		} catch (err) {
			const message = require_errors.formatErrorMessage(err);
			params.runtime.error(`Channel ${hook.channel} post-setup warning for "${hook.accountId}": ${message}`);
		}
	}
}
function createChannelOnboardingPostWriteHook(params) {
	if (!params.accountId || !params.adapter?.afterConfigWritten) return;
	return {
		channel: params.channel,
		accountId: params.accountId,
		run: async ({ cfg, runtime }) => await params.adapter?.afterConfigWritten?.({
			previousCfg: params.previousCfg,
			cfg,
			accountId: params.accountId,
			runtime
		})
	};
}
async function setupChannels(cfg, runtime, prompter, options) {
	let next = cfg;
	const deferStatusUntilSelection = options?.deferStatusUntilSelection === true;
	const forceAllowFromChannels = new Set(options?.forceAllowFromChannels ?? []);
	const accountOverrides = { ...options?.accountIds };
	const scopedPluginsById = /* @__PURE__ */ new Map();
	const resolveWorkspaceDir = () => require_agent_scope_config.resolveAgentWorkspaceDir(next, require_agent_scope_config.resolveDefaultAgentId(next));
	const rememberScopedPlugin = (plugin) => {
		const channel = plugin.id;
		scopedPluginsById.set(channel, plugin);
		options?.onResolvedPlugin?.(channel, plugin);
	};
	const activePluginsById = /* @__PURE__ */ new Map();
	const rememberActivePlugin = (plugin) => {
		activePluginsById.set(plugin.id, plugin);
		return plugin;
	};
	const getVisibleChannelPlugin = (channel) => scopedPluginsById.get(channel) ?? activePluginsById.get(channel);
	const listVisibleInstalledPlugins = () => {
		const merged = /* @__PURE__ */ new Map();
		const registryPlugins = require_setup_registry.listActiveChannelSetupPlugins().map(rememberActivePlugin);
		for (const plugin of registryPlugins) if (require_discovery.shouldShowChannelInSetup(plugin.meta)) merged.set(plugin.id, plugin);
		for (const plugin of scopedPluginsById.values()) if (require_discovery.shouldShowChannelInSetup(plugin.meta)) merged.set(plugin.id, plugin);
		return Array.from(merged.values());
	};
	const resolveVisibleChannelEntries = () => require_discovery.resolveChannelSetupEntries({
		cfg: next,
		installedPlugins: listVisibleInstalledPlugins(),
		workspaceDir: resolveWorkspaceDir()
	});
	const loadScopedChannelPlugin = async (channel, pluginId, setup) => {
		const existing = getVisibleChannelPlugin(channel);
		if (existing && setup?.forceReload !== true) return existing;
		const snapshot = loadChannelSetupPluginRegistrySnapshotForChannel({
			cfg: next,
			runtime,
			channel,
			...pluginId ? { pluginId } : {},
			workspaceDir: resolveWorkspaceDir(),
			forceSetupOnlyChannelPlugins: setup?.forceSetupOnlyChannelPlugins ?? true
		});
		const plugin = snapshot.channelSetups.find((entry) => entry.plugin.id === channel)?.plugin ?? snapshot.channels.find((entry) => entry.plugin.id === channel)?.plugin;
		if (plugin) {
			rememberScopedPlugin(plugin);
			return plugin;
		}
		const bundledPlugin = require_bundled.getBundledChannelSetupPlugin(channel);
		if (bundledPlugin) {
			rememberScopedPlugin(bundledPlugin);
			return bundledPlugin;
		}
	};
	const getVisibleSetupFlowAdapter = (channel) => {
		const scopedPlugin = scopedPluginsById.get(channel);
		if (scopedPlugin) return resolveChannelSetupWizardAdapterForPlugin(scopedPlugin);
		return resolveChannelSetupWizardAdapterForPlugin(getVisibleChannelPlugin(channel));
	};
	const preloadConfiguredExternalPlugins = async () => {
		listVisibleInstalledPlugins();
		const workspaceDir = resolveWorkspaceDir();
		const preloadTasks = [];
		for (const entry of require_discovery.listTrustedChannelPluginCatalogEntries({
			cfg: next,
			workspaceDir
		})) {
			const channel = entry.id;
			if (getVisibleChannelPlugin(channel)) continue;
			if (!(next.plugins?.entries?.[entry.pluginId ?? channel]?.enabled === true) && !require_channel_configured.isChannelConfigured(next, channel)) continue;
			preloadTasks.push(loadScopedChannelPlugin(channel, entry.pluginId));
		}
		await Promise.all(preloadTasks);
	};
	if (!deferStatusUntilSelection) await preloadConfiguredExternalPlugins();
	const { statusByChannel, statusLines } = deferStatusUntilSelection ? {
		statusByChannel: /* @__PURE__ */ new Map(),
		statusLines: []
	} : await collectChannelStatus({
		cfg: next,
		options,
		accountOverrides,
		installedPlugins: listVisibleInstalledPlugins(),
		resolveAdapter: getVisibleSetupFlowAdapter
	});
	if (!options?.skipStatusNote && statusLines.length > 0) await prompter.note(statusLines.join("\n"), require_i18n.t("wizard.channels.statusTitle"));
	if (!(options?.skipConfirm ? true : await prompter.confirm({
		message: require_i18n.t("wizard.channels.setupConfirm"),
		initialValue: true
	}))) return cfg;
	await noteChannelPrimer(prompter, resolveVisibleChannelEntries().entries.map((entry) => ({
		id: entry.id,
		label: entry.meta.label,
		blurb: entry.meta.blurb
	})));
	const quickstartDefault = options?.initialSelection?.[0] ?? (deferStatusUntilSelection ? void 0 : resolveQuickstartDefault(statusByChannel));
	const shouldPromptAccountIds = options?.promptAccountIds === true;
	const accountIdsByChannel = /* @__PURE__ */ new Map();
	const recordAccount = (channel, accountId) => {
		options?.onAccountId?.(channel, accountId);
		getVisibleSetupFlowAdapter(channel)?.onAccountRecorded?.(accountId, options);
		accountIdsByChannel.set(channel, accountId);
	};
	const selection = [];
	const addSelection = (channel) => {
		if (!selection.includes(channel)) selection.push(channel);
	};
	const resolveConfigDisabledHint = (channel) => {
		if (next.plugins?.enabled === false) return "plugins disabled";
		if (next.plugins?.entries?.[channel]?.enabled === false) return "plugin disabled";
		if (typeof next.channels?.[channel]?.enabled === "boolean") return next.channels[channel]?.enabled === false ? "disabled" : void 0;
	};
	const resolveDisabledHint = (channel) => {
		const configDisabledHint = resolveConfigDisabledHint(channel);
		if (configDisabledHint || deferStatusUntilSelection) return configDisabledHint;
		const plugin = getVisibleChannelPlugin(channel);
		if (!plugin) return;
		const accountId = require_helpers.resolveChannelDefaultAccountId({
			plugin,
			cfg: next
		});
		const account = plugin.config.resolveAccount(next, accountId);
		let enabled;
		if (plugin.config.isEnabled) enabled = plugin.config.isEnabled(account, next);
		else if (typeof account?.enabled === "boolean") enabled = account.enabled;
		return enabled === false ? "disabled" : void 0;
	};
	const getChannelEntries = () => {
		const resolved = resolveVisibleChannelEntries();
		return {
			entries: resolved.entries,
			catalogById: resolved.installableCatalogById,
			installedCatalogById: resolved.installedCatalogById
		};
	};
	const buildStatusByChannelForSelection = (catalogById) => {
		const decorated = new Map(statusByChannel);
		if (catalogById.size === 0) return decorated;
		const bundledSources = require_bundled_sources.resolveBundledPluginSources({ workspaceDir: resolveWorkspaceDir() });
		for (const [channel, entry] of catalogById) {
			if (decorated.has(channel)) continue;
			const bundledLocalPath = findBundledSourceForCatalogChannel({
				bundled: bundledSources,
				entry
			})?.localPath ?? null;
			decorated.set(channel, {
				channel,
				configured: false,
				statusLines: [],
				selectionHint: resolveCatalogChannelSelectionHint(entry, { bundledLocalPath })
			});
		}
		return decorated;
	};
	const refreshStatus = async (channel) => {
		const adapter = getVisibleSetupFlowAdapter(channel);
		if (!adapter) return;
		const status = await adapter.getStatus({
			cfg: next,
			options,
			accountOverrides
		});
		statusByChannel.set(channel, status);
	};
	const enableBundledPluginForSetup = async (channel) => {
		if (getVisibleChannelPlugin(channel)) {
			await refreshStatus(channel);
			return true;
		}
		const disabledHint = resolveConfigDisabledHint(channel);
		if (disabledHint) {
			await prompter.note(require_i18n.t("wizard.channels.disabledDuringSetup", {
				channel,
				hint: disabledHint,
				command: require_command_format.formatCliCommand("operator channels add")
			}), require_i18n.t("wizard.channels.setupTitle"));
			return false;
		}
		const result = require_enable.enableExplicitlySelectedPluginInConfig(next, channel);
		next = result.config;
		if (!result.enabled) {
			await prompter.note(require_i18n.t("wizard.channels.pluginEnableFailed", {
				channel,
				reason: result.reason ?? "plugin disabled",
				command: require_command_format.formatCliCommand("operator plugins list")
			}), require_i18n.t("wizard.channels.setupTitle"));
			return false;
		}
		const plugin = await loadScopedChannelPlugin(channel);
		const adapter = getVisibleSetupFlowAdapter(channel);
		if (!plugin) {
			if (adapter) {
				await prompter.note(require_i18n.t("wizard.channels.pluginMissingRecoverable", {
					channel,
					listCommand: require_command_format.formatCliCommand("operator plugins list"),
					enableCommand: require_command_format.formatCliCommand(`operator plugins enable ${channel}`)
				}), require_i18n.t("wizard.channels.setupTitle"));
				await refreshStatus(channel);
				return true;
			}
			await prompter.note(require_i18n.t("wizard.channels.pluginNotAvailable", { channel }), require_i18n.t("wizard.channels.setupTitle"));
			return false;
		}
		await refreshStatus(channel);
		return true;
	};
	const applySetupResult = async (channel, result) => {
		const previousCfg = next;
		next = result.cfg;
		const adapter = getVisibleSetupFlowAdapter(channel);
		if (result.accountId) {
			recordAccount(channel, result.accountId);
			const postWriteHook = createChannelOnboardingPostWriteHook({
				accountId: result.accountId,
				adapter,
				channel,
				previousCfg
			});
			if (postWriteHook) options?.onPostWriteHook?.(postWriteHook);
		}
		addSelection(channel);
		await refreshStatus(channel);
	};
	const applyCustomSetupResult = async (channel, result) => {
		if (result === "skip") return false;
		await applySetupResult(channel, result);
		return true;
	};
	const configureChannel = async (channel) => {
		if (scopedPluginsById.has(channel)) await loadScopedChannelPlugin(channel, void 0, {
			forceReload: true,
			forceSetupOnlyChannelPlugins: true
		});
		const adapter = getVisibleSetupFlowAdapter(channel);
		if (!adapter) {
			await prompter.note(require_i18n.t("wizard.channels.noInteractiveSetup", {
				channel,
				command: require_command_format.formatCliCommand(`operator channels add --channel ${channel} --help`)
			}), require_i18n.t("wizard.channels.setupTitle"));
			return;
		}
		const result = await adapter.configure({
			cfg: next,
			runtime,
			prompter,
			options,
			accountOverrides,
			shouldPromptAccountIds,
			forceAllowFrom: forceAllowFromChannels.has(channel)
		});
		await applySetupResult(channel, result);
	};
	const handleConfiguredChannel = async (channel, label) => {
		const plugin = getVisibleChannelPlugin(channel);
		const adapter = getVisibleSetupFlowAdapter(channel);
		if (adapter?.configureWhenConfigured) {
			const custom = await adapter.configureWhenConfigured({
				cfg: next,
				runtime,
				prompter,
				options,
				accountOverrides,
				shouldPromptAccountIds,
				forceAllowFrom: forceAllowFromChannels.has(channel),
				configured: true,
				label
			});
			if (!await applyCustomSetupResult(channel, custom)) return;
			return;
		}
		const supportsDisable = Boolean(options?.allowDisable && (plugin?.config.setAccountEnabled || adapter?.disable));
		const supportsDelete = Boolean(options?.allowDisable && plugin?.config.deleteAccount);
		const action = await promptConfiguredAction({
			prompter,
			label,
			supportsDisable,
			supportsDelete
		});
		if (action === "skip") return;
		if (action === "update") {
			await configureChannel(channel);
			return;
		}
		if (!options?.allowDisable) return;
		if (action === "delete" && !supportsDelete) {
			await prompter.note(require_i18n.t("wizard.channels.configuredDeleteUnsupported", { label }), require_i18n.t("wizard.channels.removeTitle"));
			return;
		}
		const resolvedAccountId = require_account_id.normalizeAccountId((action === "delete" ? Boolean(plugin?.config.deleteAccount) : Boolean(plugin?.config.setAccountEnabled)) ? await promptRemovalAccountId({
			cfg: next,
			prompter,
			label,
			channel,
			plugin
		}) : "default") ?? (plugin ? require_helpers.resolveChannelDefaultAccountId({
			plugin,
			cfg: next
		}) : "default");
		const accountLabel = formatAccountLabel(resolvedAccountId);
		if (action === "delete") {
			if (!await prompter.confirm({
				message: require_i18n.t("wizard.channels.deleteAccount", {
					label,
					account: accountLabel
				}),
				initialValue: false
			})) return;
			if (plugin?.config.deleteAccount) next = plugin.config.deleteAccount({
				cfg: next,
				accountId: resolvedAccountId
			});
			await refreshStatus(channel);
			return;
		}
		if (plugin?.config.setAccountEnabled) next = plugin.config.setAccountEnabled({
			cfg: next,
			accountId: resolvedAccountId,
			enabled: false
		});
		else if (adapter?.disable) next = adapter.disable(next);
		await refreshStatus(channel);
	};
	const handleChannelChoice = async (channel) => {
		const { catalogById, installedCatalogById } = getChannelEntries();
		const catalogEntry = catalogById.get(channel);
		const installedCatalogEntry = installedCatalogById.get(channel);
		const deferredDisabledHint = deferStatusUntilSelection ? resolveConfigDisabledHint(channel) : void 0;
		if (deferredDisabledHint) {
			await prompter.note(require_i18n.t("wizard.channels.disabledBeforeSetup", {
				channel,
				hint: deferredDisabledHint
			}), require_i18n.t("wizard.channels.setupTitle"));
			return "done";
		}
		if (catalogEntry) {
			const workspaceDir = resolveWorkspaceDir();
			const result = await ensureChannelSetupPluginInstalled({
				cfg: next,
				entry: catalogEntry,
				prompter,
				runtime,
				workspaceDir,
				autoConfirmSingleSource: true,
				...options?.beforePersistentEffect ? { beforePersistentEffect: options.beforePersistentEffect } : {}
			});
			next = result.cfg;
			if (!result.installed) return "retry_selection";
			await loadScopedChannelPlugin(channel, result.pluginId ?? catalogEntry.pluginId);
			await refreshStatus(channel);
		} else if (installedCatalogEntry) {
			let plugin = await loadScopedChannelPlugin(channel, installedCatalogEntry.pluginId);
			if (!plugin && installedCatalogEntry.install?.npmSpec) {
				const disabledHint = resolveConfigDisabledHint(channel);
				if (disabledHint) {
					await prompter.note(require_i18n.t("wizard.channels.disabledBeforeSetup", {
						channel,
						hint: disabledHint
					}), require_i18n.t("wizard.channels.setupTitle"));
					return "done";
				}
				const workspaceDir = resolveWorkspaceDir();
				const result = await ensureChannelSetupPluginInstalled({
					cfg: next,
					entry: installedCatalogEntry,
					prompter,
					runtime,
					workspaceDir,
					autoConfirmSingleSource: true,
					...options?.beforePersistentEffect ? { beforePersistentEffect: options.beforePersistentEffect } : {}
				});
				next = result.cfg;
				if (!result.installed) return "retry_selection";
				plugin = await loadScopedChannelPlugin(channel, result.pluginId ?? installedCatalogEntry.pluginId);
			}
			if (!plugin) {
				await prompter.note(require_i18n.t("wizard.channels.pluginNotAvailable", { channel }), require_i18n.t("wizard.channels.setupTitle"));
				return "done";
			}
			await refreshStatus(channel);
		} else {
			const fallbackCatalogEntry = require_discovery.getTrustedChannelPluginCatalogEntry(channel, {
				cfg: next,
				workspaceDir: resolveWorkspaceDir()
			});
			if (fallbackCatalogEntry?.install?.npmSpec) {
				const disabledHint = resolveConfigDisabledHint(channel);
				if (disabledHint) {
					await prompter.note(require_i18n.t("wizard.channels.disabledBeforeSetup", {
						channel,
						hint: disabledHint
					}), require_i18n.t("wizard.channels.setupTitle"));
					return "done";
				}
				const workspaceDir = resolveWorkspaceDir();
				const result = await ensureChannelSetupPluginInstalled({
					cfg: next,
					entry: fallbackCatalogEntry,
					prompter,
					runtime,
					workspaceDir,
					autoConfirmSingleSource: true,
					...options?.beforePersistentEffect ? { beforePersistentEffect: options.beforePersistentEffect } : {}
				});
				next = result.cfg;
				if (!result.installed) return "retry_selection";
				await loadScopedChannelPlugin(channel, result.pluginId ?? fallbackCatalogEntry.pluginId);
				await refreshStatus(channel);
			} else if (!await enableBundledPluginForSetup(channel)) return "done";
		}
		const plugin = getVisibleChannelPlugin(channel);
		const adapter = getVisibleSetupFlowAdapter(channel);
		const label = plugin?.meta.label ?? catalogEntry?.meta.label ?? channel;
		const configured = statusByChannel.get(channel)?.configured ?? false;
		if (adapter?.configureInteractive) {
			const custom = await adapter.configureInteractive({
				cfg: next,
				runtime,
				prompter,
				options,
				accountOverrides,
				shouldPromptAccountIds,
				forceAllowFrom: forceAllowFromChannels.has(channel),
				configured,
				label
			});
			if (!await applyCustomSetupResult(channel, custom)) return "done";
			return "done";
		}
		if (configured) {
			await handleConfiguredChannel(channel, label);
			return "done";
		}
		await configureChannel(channel);
		return "done";
	};
	if (options?.quickstartDefaults) {
		const skipValue = "__skip__";
		const quickstartInitialValue = options?.initialSelection?.[0] ?? skipValue;
		while (true) {
			const { entries, catalogById } = getChannelEntries();
			const choice = await prompter.select({
				message: require_i18n.t("wizard.channels.selectQuickstart"),
				options: [{
					value: skipValue,
					label: require_i18n.t("common.skipForNow"),
					hint: require_i18n.t("wizard.channels.skipLaterHint", { command: require_command_format.formatCliCommand("operator channels add") })
				}, ...resolveChannelSetupSelectionContributions({
					entries,
					statusByChannel: buildStatusByChannelForSelection(catalogById),
					resolveDisabledHint
				}).map((contribution) => contribution.option)],
				initialValue: quickstartInitialValue,
				searchable: true
			});
			if (choice === skipValue) break;
			if (await handleChannelChoice(choice) === "done") break;
		}
	} else {
		const doneValue = "__done__";
		const initialValue = options?.initialSelection?.[0] ?? quickstartDefault;
		while (true) {
			const { entries, catalogById } = getChannelEntries();
			const choice = await prompter.select({
				message: require_i18n.t("wizard.channels.select"),
				options: [...resolveChannelSetupSelectionContributions({
					entries,
					statusByChannel: buildStatusByChannelForSelection(catalogById),
					resolveDisabledHint
				}).map((contribution) => contribution.option), {
					value: doneValue,
					label: require_i18n.t("common.finished"),
					hint: selection.length > 0 ? require_i18n.t("wizard.channels.doneHint") : require_i18n.t("common.skipForNow")
				}],
				initialValue
			});
			if (choice === doneValue) break;
			await handleChannelChoice(choice);
		}
	}
	options?.onSelection?.(selection);
	const selectedLines = resolveChannelSelectionNoteLines({
		cfg: next,
		installedPlugins: listVisibleInstalledPlugins(),
		selection
	});
	if (selectedLines.length > 0) await prompter.note(selectedLines.join("\n"), require_i18n.t("wizard.channels.selectedTitle"));
	if (!options?.skipDmPolicyPrompt) next = await maybeConfigureDmPolicies({
		cfg: next,
		selection,
		prompter,
		accountIdsByChannel,
		resolveAdapter: getVisibleSetupFlowAdapter
	});
	return next;
}
//#endregion
exports.createChannelOnboardingPostWriteHook = createChannelOnboardingPostWriteHook;
exports.createChannelOnboardingPostWriteHookCollector = createChannelOnboardingPostWriteHookCollector;
exports.noteChannelStatus = noteChannelStatus;
exports.runCollectedChannelOnboardingPostWriteHooks = runCollectedChannelOnboardingPostWriteHooks;
exports.setupChannels = setupChannels;
exports.setupChannels$1 = setupChannels;
