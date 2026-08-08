const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
require("./workspace-oX0zfOZq.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_enable = require("./enable-CoHDsLc0.cjs");
const require_profiles = require("./profiles-m8TkqupR.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_provider_auth_helpers = require("./provider-auth-helpers-BccqssEk.cjs");
const require_provider_auth_choices = require("./provider-auth-choices-Dr0zOwrP.cjs");
const require_provider_install_catalog = require("./provider-install-catalog-Buj0eWKh.cjs");
const require_browser_open = require("./browser-open-vi77U5ps.cjs");
const require_remote_env = require("./remote-env-BPhq71Sz.cjs");
const require_provider_auth_choice_helpers = require("./provider-auth-choice-helpers-uTSu1Fwu.cjs");
const require_provider_oauth_flow = require("./provider-oauth-flow-CKK8z-Xp.cjs");
//#region src/plugins/provider-auth-choice.ts
function formatModelRefForDisplay(modelRef, provider) {
	if (!provider.preserveLiteralProviderPrefix) return modelRef;
	return require_model_selection_normalize.formatLiteralProviderPrefixedModelRef(provider.id, modelRef);
}
function restoreConfiguredPrimaryModel(nextConfig, originalConfig) {
	const originalModel = originalConfig.agents?.defaults?.model;
	const nextAgents = nextConfig.agents;
	const nextDefaults = nextAgents?.defaults;
	if (!nextDefaults) return nextConfig;
	if (originalModel !== void 0) return {
		...nextConfig,
		agents: {
			...nextAgents,
			defaults: {
				...nextDefaults,
				model: originalModel
			}
		}
	};
	const { model: _model, ...restDefaults } = nextDefaults;
	return {
		...nextConfig,
		agents: {
			...nextAgents,
			defaults: restDefaults
		}
	};
}
function resolveConfiguredDefaultModelPrimary(cfg) {
	const model = cfg.agents?.defaults?.model;
	if (typeof model === "string") return model;
	if (model && typeof model === "object" && typeof model.primary === "string") return model.primary;
}
async function noteDefaultModelResult(params) {
	const selectedModelDisplay = params.selectedModelDisplay ?? params.selectedModel;
	if (params.preserveExistingDefaultModel === true && params.previousPrimary && params.previousPrimary !== params.selectedModel) {
		await params.prompter.note(require_i18n.t("wizard.model.keptExistingDefault", {
			current: params.previousPrimary,
			selected: selectedModelDisplay
		}), require_i18n.t("wizard.model.configuredTitle"));
		return;
	}
	await params.prompter.note(require_i18n.t("wizard.model.defaultSet", { model: selectedModelDisplay }), require_i18n.t("wizard.model.configuredTitle"));
}
async function applyDefaultModelFromAuthChoice(params) {
	const defaultModelBaseConfig = params.configBeforeProviderAuth ?? params.config;
	const previousPrimary = resolveConfiguredDefaultModelPrimary(defaultModelBaseConfig);
	const preservesDifferentPrimary = params.preserveExistingDefaultModel === true && previousPrimary !== void 0 && previousPrimary !== params.selectedModel;
	let nextConfig = require_provider_auth_choice_helpers.applyDefaultModel(params.preserveExistingDefaultModel === true ? restoreConfiguredPrimaryModel(params.config, defaultModelBaseConfig) : params.config, params.selectedModel, { preserveExistingPrimary: params.preserveExistingDefaultModel === true });
	if (!preservesDifferentPrimary) {
		const { CODEX_RUNTIME_PLUGIN_ID, ensureCodexRuntimePluginForModelSelection } = await Promise.resolve().then(() => require("./codex-runtime-plugin-install-DDX1lxok.cjs"));
		const codexInstall = await ensureCodexRuntimePluginForModelSelection({
			cfg: nextConfig,
			model: params.selectedModel,
			prompter: params.prompter,
			runtime: params.runtime,
			...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
		});
		nextConfig = codexInstall.cfg;
		await params.runSelectedModelHook(nextConfig);
		if (codexInstall.installed) {
			const { offerPostInstallMigrations } = await Promise.resolve().then(() => require("./setup.post-install-migration-C1_Hk2Ej.cjs"));
			nextConfig = (await offerPostInstallMigrations({
				config: nextConfig,
				runtime: params.runtime,
				prompter: params.prompter,
				installedPluginIds: [CODEX_RUNTIME_PLUGIN_ID]
			})).config;
		}
		const { ensureCopilotRuntimePluginForModelSelection } = await Promise.resolve().then(() => require("./copilot-runtime-plugin-install-B8UwS0tB.cjs"));
		nextConfig = (await ensureCopilotRuntimePluginForModelSelection({
			cfg: nextConfig,
			model: params.selectedModel,
			prompter: params.prompter,
			runtime: params.runtime,
			...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
		})).cfg;
	}
	await noteDefaultModelResult({
		previousPrimary,
		selectedModel: params.selectedModel,
		selectedModelDisplay: params.selectedModelDisplay,
		preserveExistingDefaultModel: params.preserveExistingDefaultModel,
		prompter: params.prompter
	});
	return nextConfig;
}
async function loadPluginProviderRuntime() {
	return await Promise.resolve().then(() => require("./provider-auth-choice.runtime-Vopx4913.cjs"));
}
function resolveManifestAuthChoiceScope(params) {
	return require_provider_auth_choices.resolveManifestProviderAuthChoice(params.authChoice, {
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeUntrustedWorkspacePlugins: false
	});
}
function withProviderPluginId(provider, pluginId) {
	return provider.pluginId === pluginId ? provider : {
		...provider,
		pluginId
	};
}
async function runProviderPluginAuthMethodUnpersisted(params) {
	return await params.method.run({
		config: params.config,
		env: params.env,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		prompter: params.prompter,
		runtime: params.runtime,
		...params.signal ? { signal: params.signal } : {},
		opts: params.opts,
		secretInputMode: params.secretInputMode,
		allowSecretRefPrompt: params.allowSecretRefPrompt,
		isRemote: params.isRemote ?? require_remote_env.isRemoteEnvironment(),
		openUrl: async (url) => {
			if (params.isRemote === true) {
				await params.prompter.openUrl?.(url);
				return;
			}
			await require_browser_open.openUrl(url);
		},
		oauth: { createVpsAwareHandlers: (opts) => require_provider_oauth_flow.createVpsAwareOAuthHandlers(opts) }
	});
}
function applyProviderPluginAuthMethodResultConfig(params) {
	const { result } = params;
	let nextConfig = params.config;
	if (result.configPatch) nextConfig = require_provider_auth_choice_helpers.applyProviderAuthConfigPatch(nextConfig, result.configPatch, { replaceDefaultModels: result.replaceDefaultModels });
	for (const profile of result.profiles) nextConfig = require_provider_auth_helpers.applyAuthProfileConfig(nextConfig, {
		profileId: profile.profileId,
		provider: profile.credential.provider,
		mode: profile.credential.type === "token" ? "token" : profile.credential.type,
		..."email" in profile.credential && profile.credential.email ? { email: profile.credential.email } : {},
		..."displayName" in profile.credential && profile.credential.displayName ? { displayName: profile.credential.displayName } : {}
	});
	return nextConfig;
}
async function runProviderPluginAuthMethod(params) {
	const agentId = params.agentId ?? require_agent_scope_config.resolveDefaultAgentId(params.config);
	const agentDir = params.agentDir ?? require_agent_scope_config.resolveAgentDir(params.config, agentId);
	const workspaceDir = params.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(params.config, agentId) ?? require_agent_scope_config.resolveDefaultAgentWorkspaceDir();
	const result = await runProviderPluginAuthMethodUnpersisted({
		config: params.config,
		env: params.env,
		runtime: params.runtime,
		prompter: params.prompter,
		method: params.method,
		agentDir,
		workspaceDir,
		secretInputMode: params.secretInputMode,
		allowSecretRefPrompt: params.allowSecretRefPrompt,
		opts: params.opts
	});
	for (const profile of result.profiles) await upsertAuthProfileWithLockOrThrow({
		profileId: profile.profileId,
		credential: profile.credential,
		agentDir
	});
	const nextConfig = applyProviderPluginAuthMethodResultConfig({
		config: params.config,
		result
	});
	if (params.emitNotes !== false && result.notes && result.notes.length > 0) await params.prompter.note(result.notes.join("\n"), "Provider notes");
	const defaultModel = result.defaultModel ? require_model_input.normalizeAgentModelRefForConfig(result.defaultModel) : void 0;
	return {
		config: nextConfig,
		...defaultModel ? { defaultModel } : {}
	};
}
async function applyAuthChoiceLoadedPluginProvider(params) {
	const agentId = params.agentId ?? require_agent_scope_config.resolveDefaultAgentId(params.config);
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.config, agentId) ?? require_agent_scope_config.resolveDefaultAgentWorkspaceDir();
	let nextConfig = params.config;
	let enabledConfig = params.config;
	const { resolvePluginProviders, resolvePluginSetupProvider, resolveProviderPluginChoice, runProviderModelSelectedHook } = await loadPluginProviderRuntime();
	const manifestAuthChoice = resolveManifestAuthChoiceScope({
		authChoice: params.authChoice,
		config: nextConfig,
		workspaceDir,
		env: params.env
	});
	const installCatalogEntry = require_provider_install_catalog.resolveProviderInstallCatalogEntry(params.authChoice, {
		config: nextConfig,
		workspaceDir,
		env: params.env,
		includeUntrustedWorkspacePlugins: false
	});
	const choicePlugin = manifestAuthChoice ? {
		pluginId: manifestAuthChoice.pluginId,
		label: manifestAuthChoice.choiceLabel
	} : installCatalogEntry ? {
		pluginId: installCatalogEntry.pluginId,
		label: installCatalogEntry.label
	} : void 0;
	if (choicePlugin) {
		const enableResult = require_enable.enablePluginInConfig(nextConfig, choicePlugin.pluginId);
		if (!enableResult.enabled) {
			const safeLabel = require_safe_text.sanitizeTerminalText(choicePlugin.label);
			await params.prompter.note(`${safeLabel} plugin is disabled (${enableResult.reason ?? "blocked"}).`, safeLabel);
			return { config: nextConfig };
		}
		enabledConfig = enableResult.config;
	}
	const resolveScopedRuntimeProviders = (config) => resolvePluginProviders({
		config,
		workspaceDir,
		env: params.env,
		mode: "setup",
		...manifestAuthChoice ? { onlyPluginIds: [manifestAuthChoice.pluginId] } : {}
	});
	const setupProvider = manifestAuthChoice ? resolvePluginSetupProvider({
		provider: manifestAuthChoice.providerId,
		config: enabledConfig,
		workspaceDir,
		env: params.env,
		pluginIds: [manifestAuthChoice.pluginId]
	}) : void 0;
	let providers = setupProvider ? [withProviderPluginId(setupProvider, manifestAuthChoice.pluginId)] : resolveScopedRuntimeProviders(enabledConfig);
	let resolved = resolveProviderPluginChoice({
		providers,
		choice: params.authChoice
	});
	if (!resolved && setupProvider) {
		providers = resolveScopedRuntimeProviders(enabledConfig);
		resolved = resolveProviderPluginChoice({
			providers,
			choice: params.authChoice
		});
	}
	if (!resolved && installCatalogEntry) {
		const { ensureOnboardingPluginInstalled } = await Promise.resolve().then(() => require("./onboarding-plugin-install-BVkG7njW.cjs")).then((n) => n.onboarding_plugin_install_exports);
		const installResult = await ensureOnboardingPluginInstalled({
			cfg: nextConfig,
			entry: {
				pluginId: installCatalogEntry.pluginId,
				label: installCatalogEntry.label,
				install: installCatalogEntry.install,
				...installCatalogEntry.origin === "bundled" ? { trustedSourceLinkedOfficialInstall: true } : {}
			},
			prompter: params.prompter,
			runtime: params.runtime,
			workspaceDir
		});
		if (!installResult.installed) return {
			config: installResult.cfg,
			retrySelection: true
		};
		nextConfig = installResult.cfg;
		providers = resolveScopedRuntimeProviders(nextConfig);
		resolved = resolveProviderPluginChoice({
			providers,
			choice: params.authChoice
		});
	}
	if (!resolved) return nextConfig === params.config ? null : {
		config: nextConfig,
		retrySelection: true
	};
	if (nextConfig === params.config && enabledConfig !== params.config) nextConfig = enabledConfig;
	const configBeforeProviderAuth = nextConfig;
	const applied = await runProviderPluginAuthMethod({
		config: nextConfig,
		env: params.env,
		runtime: params.runtime,
		prompter: params.prompter,
		method: resolved.method,
		agentDir: params.agentDir,
		agentId: params.agentId,
		workspaceDir,
		secretInputMode: params.opts?.secretInputMode,
		allowSecretRefPrompt: false,
		opts: params.opts
	});
	nextConfig = applied.config;
	let agentModelOverride;
	if (applied.defaultModel) {
		const selectedModel = applied.defaultModel;
		const selectedModelDisplay = formatModelRefForDisplay(selectedModel, resolved.provider);
		if (params.setDefaultModel) {
			nextConfig = await applyDefaultModelFromAuthChoice({
				config: nextConfig,
				configBeforeProviderAuth,
				selectedModel,
				selectedModelDisplay,
				preserveExistingDefaultModel: params.preserveExistingDefaultModel,
				prompter: params.prompter,
				runtime: params.runtime,
				workspaceDir,
				runSelectedModelHook: async (config) => {
					await runProviderModelSelectedHook({
						config,
						model: selectedModel,
						prompter: params.prompter,
						agentDir: params.agentDir,
						workspaceDir
					});
				}
			});
			return { config: nextConfig };
		}
		nextConfig = restoreConfiguredPrimaryModel(nextConfig, params.config);
		agentModelOverride = selectedModel;
	}
	return {
		config: nextConfig,
		agentModelOverride
	};
}
async function upsertAuthProfileWithLockOrThrow(params) {
	if (!await require_profiles.upsertAuthProfileWithLock(params)) throw new Error("Failed to update auth profile store; the auth store lock may be busy. Wait a moment and retry.");
}
//#endregion
Object.defineProperty(exports, "applyAuthChoiceLoadedPluginProvider", {
	enumerable: true,
	get: function() {
		return applyAuthChoiceLoadedPluginProvider;
	}
});
Object.defineProperty(exports, "applyProviderPluginAuthMethodResultConfig", {
	enumerable: true,
	get: function() {
		return applyProviderPluginAuthMethodResultConfig;
	}
});
Object.defineProperty(exports, "runProviderPluginAuthMethod", {
	enumerable: true,
	get: function() {
		return runProviderPluginAuthMethod;
	}
});
Object.defineProperty(exports, "runProviderPluginAuthMethodUnpersisted", {
	enumerable: true,
	get: function() {
		return runProviderPluginAuthMethodUnpersisted;
	}
});
