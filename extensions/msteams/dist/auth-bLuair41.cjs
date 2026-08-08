require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
require("./workspace-oX0zfOZq.cjs");
const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_parse_duration = require("./parse-duration-Csu-f48Z.cjs");
const require_setup_registry = require("./setup-registry-bM3fH6vu.cjs");
const require_providers_runtime = require("./providers.runtime-C5KyGi_O.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profiles = require("./profiles-m8TkqupR.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_usage = require("./usage-BS7X-z0p.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_provider_auth_token = require("./provider-auth-token-CD9fGMD0.cjs");
const require_provider_auth_helpers = require("./provider-auth-helpers-BccqssEk.cjs");
const require_prompt_style = require("./prompt-style-DDurS--q.cjs");
const require_logging = require("./logging-r9lZv9sT.cjs");
const require_prompt_select_styled_params = require("./prompt-select-styled-params-D3WyR__7.cjs");
const require_clack_prompter = require("./clack-prompter-ClUICF-g.cjs");
const require_remote_env = require("./remote-env-BPhq71Sz.cjs");
const require_provider_auth_choice_helpers = require("./provider-auth-choice-helpers-uTSu1Fwu.cjs");
const require_provider_oauth_flow = require("./provider-oauth-flow-CKK8z-Xp.cjs");
const require_codex_runtime_plugin_install = require("./codex-runtime-plugin-install-DDX1lxok.cjs");
const require_shared = require("./shared-DHbcE08y.cjs");
const require_copilot_runtime_plugin_install = require("./copilot-runtime-plugin-install-B8UwS0tB.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _clack_prompts = require("@clack/prompts");
//#region src/commands/models/auth.ts
/** Commands for adding, pasting, and logging into provider model auth profiles. */
async function refreshRunningGatewayAuthState() {
	try {
		await require_call.callGateway({
			method: "models.authStatus",
			params: { refresh: true },
			timeoutMs: 3e3
		});
	} catch {}
}
function resolveManualTokenExpiryMs(expiresIn) {
	const normalizedExpiresIn = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(expiresIn);
	if (!normalizedExpiresIn) return;
	const expires = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(require_parse_duration.parseDurationMs(normalizedExpiresIn, { defaultUnit: "d" }));
	if (expires === void 0) throw new Error("Invalid expiry duration: resulting token expiry is outside Date range.");
	return expires;
}
function guardCancel(value) {
	if (typeof value === "symbol" || (0, _clack_prompts.isCancel)(value)) {
		(0, _clack_prompts.cancel)("Cancelled.");
		process.exit(0);
	}
	return value;
}
const confirm = async (params) => guardCancel(await (0, _clack_prompts.confirm)({
	...params,
	message: require_prompt_style.stylePromptMessage(params.message)
}));
const text = async (params) => guardCancel(await (0, _clack_prompts.text)({
	...params,
	message: require_prompt_style.stylePromptMessage(params.message)
}));
const password = async (params) => guardCancel(await (0, _clack_prompts.password)({
	...params,
	message: require_prompt_style.stylePromptMessage(params.message)
}));
const select = async (params) => guardCancel(await (0, _clack_prompts.select)(require_prompt_select_styled_params.styleSelectParams(params)));
async function readPipedStdin() {
	process.stdin.setEncoding("utf8");
	let input = "";
	for await (const chunk of process.stdin) input += String(chunk);
	return input;
}
async function readPastedSecret(params) {
	const promptParams = {
		message: params.message,
		validate: params.validate
	};
	const normalized = require_normalize_secret_input.normalizeSecretInput(process.stdin.isTTY ? await (params.masked ? password(promptParams) : text(promptParams)) : await readPipedStdin());
	const validationMessage = params.validate?.(normalized);
	if (validationMessage) throw new Error(validationMessage);
	return normalized;
}
function resolveDefaultTokenProfileId(provider) {
	return `${require_model_selection_normalize.normalizeProviderId(provider)}:manual`;
}
function normalizeManualAuthProvider(provider) {
	const normalized = require_model_selection_normalize.normalizeProviderId(provider);
	return normalized === "openai" || normalized === "codex" || normalized === "openai-codex" ? "openai" : normalized;
}
function isOpenAIProvider(provider) {
	return normalizeManualAuthProvider(provider) === "openai";
}
function stripBearerPrefix(value) {
	return value.trim().replace(/^Bearer\s+/i, "").trim();
}
function looksLikeOpenAIApiKey(value) {
	return /^sk-[A-Za-z0-9_-]{8,}$/.test(value.trim());
}
function looksLikeJwtToken(value) {
	const parts = stripBearerPrefix(value).split(".");
	return parts.length === 3 && parts.every((part) => /^[A-Za-z0-9_-]{8,}$/.test(part));
}
function looksLikeStructuredCredential(value) {
	const trimmed = value.trim();
	return trimmed.startsWith("{") || trimmed.startsWith("[");
}
function validateOpenAICodexApiKeyInput(value) {
	const trimmed = value.trim();
	if (!trimmed) return "Required";
	if (looksLikeOpenAIApiKey(trimmed)) return;
	if (looksLikeJwtToken(trimmed) || looksLikeStructuredCredential(trimmed)) return `That looks like token or OAuth material, not an OpenAI API key. Use ${require_command_format.formatCliCommand("operator models auth paste-token --provider openai")} for token auth material.`;
	return "That does not look like an OpenAI API key.";
}
function listProvidersWithAuthMethods(providers) {
	return providers.filter((provider) => provider.auth.length > 0);
}
function listTokenAuthMethods(provider) {
	return provider.auth.filter((method) => method.kind === "token");
}
function listProvidersWithTokenMethods(providers) {
	return providers.filter((provider) => listTokenAuthMethods(provider).length > 0);
}
function mergeSetupProviders(providers, setupProviders) {
	if (setupProviders.length === 0) return [...providers];
	const setupById = new Map(setupProviders.map((provider) => [require_model_selection_normalize.normalizeProviderId(provider.id), provider]));
	const merged = providers.map((provider) => setupById.get(require_model_selection_normalize.normalizeProviderId(provider.id)) ?? provider);
	const existing = new Set(merged.map((provider) => require_model_selection_normalize.normalizeProviderId(provider.id)));
	for (const provider of setupProviders) if (!existing.has(require_model_selection_normalize.normalizeProviderId(provider.id))) merged.push(provider);
	return merged;
}
function preferSetupAuthProviders(params) {
	const requestedProvider = params.requestedProvider ? normalizeManualAuthProvider(params.requestedProvider) : void 0;
	if (requestedProvider) {
		const setupProvider = require_setup_registry.resolvePluginSetupProvider({
			provider: requestedProvider,
			config: params.config,
			workspaceDir: params.workspaceDir
		});
		return setupProvider ? [setupProvider] : [...params.providers];
	}
	const setupProviders = require_setup_registry.resolvePluginSetupRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir
	}).providers.map((entry) => entry.provider);
	return mergeSetupProviders(params.providers, setupProviders);
}
async function resolveModelsAuthContext(params) {
	const config = params?.config ?? await require_shared.loadValidConfigOrThrow();
	const agentId = require_shared.resolveKnownAgentId({
		cfg: config,
		rawAgentId: params?.rawAgentId
	}) ?? require_agent_scope_config.resolveDefaultAgentId(config);
	const agentDir = require_agent_scope_config.resolveAgentDir(config, agentId);
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(config, agentId) ?? require_agent_scope_config.resolveDefaultAgentWorkspaceDir();
	const requestedProvider = params?.requestedProvider?.trim();
	const providerRef = requestedProvider ? normalizeManualAuthProvider(requestedProvider) : void 0;
	return {
		config,
		agentDir,
		workspaceDir,
		providers: preferSetupAuthProviders({
			providers: require_providers_runtime.resolvePluginProviders({
				config,
				workspaceDir,
				mode: "setup",
				includeUntrustedWorkspacePlugins: false,
				bundledProviderVitestCompat: true,
				...providerRef ? {
					providerRefs: [providerRef],
					activate: true
				} : {}
			}),
			config,
			workspaceDir,
			requestedProvider: providerRef
		})
	};
}
async function resolveModelsAuthAgentDir(rawAgentId) {
	const config = await require_shared.loadValidConfigOrThrow();
	return require_agent_scope_config.resolveAgentDir(config, require_shared.resolveKnownAgentId({
		cfg: config,
		rawAgentId
	}) ?? require_agent_scope_config.resolveDefaultAgentId(config));
}
function resolveRequestedProviderOrThrow(providers, rawProvider) {
	const requested = rawProvider?.trim();
	if (!requested) return null;
	const matched = require_provider_auth_choice_helpers.resolveProviderMatch(providers, requested);
	if (matched) return matched;
	const available = providers.map((provider) => provider.id).filter(Boolean).toSorted((a, b) => a.localeCompare(b));
	const availableText = available.length > 0 ? available.join(", ") : "(none)";
	throw new Error(`Unknown provider "${requested}". Loaded providers: ${availableText}. Verify plugins via \`${require_command_format.formatCliCommand("operator plugins list --json")}\`.`);
}
function resolveTokenMethodOrThrow(provider, rawMethod) {
	const tokenMethods = listTokenAuthMethods(provider);
	if (rawMethod?.trim()) {
		const matched = require_provider_auth_choice_helpers.pickAuthMethod(provider, rawMethod);
		if (matched && matched.kind === "token") return matched;
		const available = tokenMethods.map((method) => method.id).join(", ") || "(none)";
		throw new Error(`Unknown token auth method "${rawMethod}" for provider "${provider.id}". Available token methods: ${available}.`);
	}
	return null;
}
async function pickProviderAuthMethod(params) {
	const rawRequestedMethod = params.requestedMethod?.trim();
	if (rawRequestedMethod) return require_provider_auth_choice_helpers.pickAuthMethod(params.provider, rawRequestedMethod);
	const oauthMethod = params.provider.auth.find((method) => method.kind === "oauth");
	if (oauthMethod) return oauthMethod;
	if (params.provider.auth.length === 1) return params.provider.auth[0] ?? null;
	return await params.prompter.select({
		message: `Auth method for ${params.provider.label}`,
		options: params.provider.auth.map((method) => ({
			value: method.id,
			label: method.label,
			hint: method.hint
		}))
	}).then((id) => params.provider.auth.find((method) => method.id === id) ?? null);
}
async function pickProviderTokenMethod(params) {
	const explicitTokenMethod = resolveTokenMethodOrThrow(params.provider, params.requestedMethod);
	if (explicitTokenMethod) return explicitTokenMethod;
	const tokenMethods = listTokenAuthMethods(params.provider);
	if (tokenMethods.length === 0) return null;
	const setupTokenMethod = tokenMethods.find((method) => method.id === "setup-token");
	if (setupTokenMethod) return setupTokenMethod;
	if (tokenMethods.length === 1) return tokenMethods[0] ?? null;
	return await params.prompter.select({
		message: `Token method for ${params.provider.label}`,
		options: tokenMethods.map((method) => ({
			value: method.id,
			label: method.label,
			hint: method.hint
		}))
	}).then((id) => tokenMethods.find((method) => method.id === id) ?? null);
}
async function persistProviderAuthResult(params) {
	const defaultModel = params.result.defaultModel ? require_model_input.normalizeAgentModelRefForConfig(params.result.defaultModel) : void 0;
	const profiles = params.profiles ?? params.result.profiles;
	const shouldUpdateConfig = Boolean(params.result.configPatch || params.setDefault && defaultModel);
	for (const profile of profiles) {
		const configuredSelection = resolveConfiguredAuthSelectionForProvider(params.config, profile.credential.provider);
		await upsertAuthProfileWithLockOrThrow({
			profileId: profile.profileId,
			credential: profile.credential,
			agentDir: params.agentDir
		});
		await require_profiles.promoteAuthProfileInOrder({
			agentDir: params.agentDir,
			provider: profile.credential.provider,
			profileId: profile.profileId,
			createIfMissing: configuredSelection.createIfMissing,
			...configuredSelection.order ? { createFromOrder: configuredSelection.order } : {}
		});
	}
	if (shouldUpdateConfig) {
		const updated = await require_shared.updateConfig((cfg) => {
			const priorAgentsDefaultsModel = cfg.agents?.defaults?.model;
			let next = cfg;
			if (params.result.configPatch) next = require_provider_auth_choice_helpers.applyProviderAuthConfigPatch(next, params.result.configPatch, { replaceDefaultModels: params.result.replaceDefaultModels });
			next = require_provider_auth_choice_helpers.restorePriorAgentsDefaultsModelUnlessOptIn({
				cfg: next,
				priorAgentsDefaultsModel,
				setDefault: params.setDefault
			});
			if (params.setDefault && defaultModel) next = require_provider_auth_choice_helpers.applyDefaultModel(next, defaultModel);
			return next;
		});
		if (defaultModel) {
			const repaired = await require_codex_runtime_plugin_install.repairCodexRuntimePluginInstallForModelSelection({
				cfg: updated,
				model: defaultModel
			});
			const copilotRepaired = await require_copilot_runtime_plugin_install.repairCopilotRuntimePluginInstallForModelSelection({
				cfg: updated,
				model: defaultModel
			});
			for (const warning of [...repaired.warnings, ...copilotRepaired.warnings]) params.runtime.error?.(warning);
		}
		require_logging.logConfigUpdated(params.runtime);
	}
	await refreshRunningGatewayAuthState();
	for (const profile of profiles) params.runtime.log(`Auth profile: ${profile.profileId} (${profile.credential.provider}/${credentialMode(profile.credential)})`);
	if (defaultModel) params.runtime.log(params.setDefault ? `Default model set to ${defaultModel}` : `Default model available: ${defaultModel} (use --set-default to apply)`);
	if (params.result.notes && params.result.notes.length > 0) await params.prompter.note(params.result.notes.join("\n"), "Provider notes");
}
function resolveConfiguredAuthSelectionForProvider(cfg, provider) {
	const providerAuthKey = require_provider_auth_aliases.resolveProviderIdForAuth(provider, { config: cfg });
	for (const [orderProvider, profileIds] of Object.entries(cfg.auth?.order ?? {})) if (profileIds.length > 0 && require_provider_auth_aliases.resolveProviderIdForAuth(orderProvider, { config: cfg }) === providerAuthKey) return {
		createIfMissing: true,
		order: profileIds
	};
	const profileIds = Object.entries(cfg.auth?.profiles ?? {}).filter(([, profile]) => require_provider_auth_aliases.resolveProviderIdForAuth(profile.provider, { config: cfg }) === providerAuthKey).map(([profileId]) => profileId);
	return profileIds.length > 0 ? {
		createIfMissing: true,
		order: profileIds
	} : { createIfMissing: false };
}
async function runProviderAuthMethod(params) {
	const selectedProviderId = require_model_selection_normalize.normalizeProviderId(params.provider.id);
	await clearStaleProfileLockouts(selectedProviderId, params.agentDir);
	const result = await params.method.run({
		config: params.config,
		env: params.env ?? process.env,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		prompter: params.prompter,
		runtime: params.runtime,
		allowSecretRefPrompt: false,
		isRemote: params.isRemote ?? require_remote_env.isRemoteEnvironment(),
		openUrl: params.openUrl ?? (async (url) => {
			const { openUrl } = await Promise.resolve().then(() => require("./onboard-helpers-B8YMO226.cjs"));
			await openUrl(url);
		}),
		oauth: { createVpsAwareHandlers: (runtimeParams) => require_provider_oauth_flow.createVpsAwareOAuthHandlers(runtimeParams) }
	});
	const resultProviderIds = new Set(result.profiles.map((profile) => require_model_selection_normalize.normalizeProviderId(profile.credential.provider)));
	for (const providerId of resultProviderIds) if (providerId && providerId !== selectedProviderId) await clearStaleProfileLockouts(providerId, params.agentDir);
	const profiles = resolveLoginProfiles({
		result,
		requestedProfileId: params.profileId
	});
	await persistProviderAuthResult({
		result,
		profiles,
		config: params.config,
		agentDir: params.agentDir,
		runtime: params.runtime,
		prompter: params.prompter,
		setDefault: params.setDefault
	});
	return {
		result,
		profiles
	};
}
/** Runs an interactive provider setup-token auth flow. */
async function modelsAuthSetupTokenCommand(opts, runtime) {
	if (!process.stdin.isTTY) throw new Error(`setup-token requires an interactive TTY. In automation, use ${require_command_format.formatCliCommand("operator models auth paste-token --provider <provider>")} instead.`);
	const { config, agentDir, workspaceDir, providers } = await resolveModelsAuthContext({
		requestedProvider: opts.provider,
		rawAgentId: opts.agent
	});
	const tokenProviders = listProvidersWithTokenMethods(providers);
	if (tokenProviders.length === 0) throw new Error(`No provider token-auth plugins found. Install one via \`${require_command_format.formatCliCommand("operator plugins install")}\`.`);
	const provider = resolveRequestedProviderOrThrow(tokenProviders, opts.provider) ?? tokenProviders[0] ?? null;
	if (!provider) throw new Error(`No token-capable provider is available. Run ${require_command_format.formatCliCommand("operator plugins list")} to verify provider plugins are installed.`);
	if (!opts.yes) {
		if (!await confirm({
			message: `Continue with ${provider.label} token auth?`,
			initialValue: true
		})) return;
	}
	const prompter = require_clack_prompter.createClackPrompter();
	const method = await pickProviderTokenMethod({
		provider,
		prompter
	});
	if (!method) throw new Error(`Provider "${provider.id}" does not expose a token auth method.`);
	await runProviderAuthMethod({
		config,
		agentDir,
		workspaceDir,
		provider,
		method,
		runtime,
		prompter
	});
}
/** Reads a pasted bearer/setup token and stores it as an auth profile. */
async function modelsAuthPasteTokenCommand(opts, runtime) {
	const agentDir = await resolveModelsAuthAgentDir(opts.agent);
	const rawProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.provider);
	if (!rawProvider) throw new Error(`Missing --provider. Run ${require_command_format.formatCliCommand("operator models status")} or ${require_command_format.formatCliCommand("operator plugins list")} to choose a provider.`);
	const provider = normalizeManualAuthProvider(rawProvider);
	const profileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.profileId) || resolveDefaultTokenProfileId(provider);
	const validateTokenInput = (value) => {
		const trimmed = value?.trim();
		if (!trimmed) return "Required";
		if (provider === "anthropic") return require_provider_auth_token.validateAnthropicSetupToken(trimmed.replaceAll(/\s+/g, ""));
		if (isOpenAIProvider(provider) && looksLikeOpenAIApiKey(trimmed)) return `That looks like an OpenAI API key. Use ${require_command_format.formatCliCommand("operator models auth paste-api-key --provider openai")} for API-key auth.`;
	};
	const tokenInput = await readPastedSecret({
		message: `Paste token for ${provider}`,
		masked: true,
		validate: validateTokenInput
	});
	const token = provider === "anthropic" ? tokenInput.replaceAll(/\s+/g, "").trim() : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(tokenInput) ?? "";
	const expires = resolveManualTokenExpiryMs(opts.expiresIn);
	await upsertAuthProfileWithLockOrThrow({
		profileId,
		credential: {
			type: "token",
			provider,
			token,
			...expires ? { expires } : {}
		},
		agentDir
	});
	await require_shared.updateConfig((cfg) => require_provider_auth_helpers.applyAuthProfileConfig(cfg, {
		profileId,
		provider,
		mode: "token"
	}));
	await refreshRunningGatewayAuthState();
	require_logging.logConfigUpdated(runtime);
	runtime.log(`Auth profile: ${profileId} (${provider}/token)`);
	if (provider === "anthropic") {
		runtime.log("Anthropic setup-token auth is supported in Operator.");
		runtime.log("Operator prefers Claude CLI reuse when it is available on the host.");
		runtime.log("Anthropic staff told us this Operator path is allowed again.");
	}
}
/** Reads a pasted API key and stores it as an auth profile. */
async function modelsAuthPasteApiKeyCommand(opts, runtime) {
	const agentDir = await resolveModelsAuthAgentDir(opts.agent);
	const rawProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.provider);
	if (!rawProvider) throw new Error(`Missing --provider. Run ${require_command_format.formatCliCommand("operator models status")} or ${require_command_format.formatCliCommand("operator plugins list")} to choose a provider.`);
	const provider = normalizeManualAuthProvider(rawProvider);
	const profileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(opts.profileId) || resolveDefaultTokenProfileId(provider);
	await upsertAuthProfileWithLockOrThrow({
		profileId,
		credential: {
			type: "api_key",
			provider,
			key: await readPastedSecret({
				message: `Paste API key for ${provider}`,
				masked: true,
				validate: (value) => {
					const trimmed = value?.trim();
					if (!trimmed) return "Required";
					if (isOpenAIProvider(provider)) return validateOpenAICodexApiKeyInput(trimmed);
				}
			})
		},
		agentDir
	});
	await require_shared.updateConfig((cfg) => require_provider_auth_helpers.applyAuthProfileConfig(cfg, {
		profileId,
		provider,
		mode: "api_key"
	}));
	await refreshRunningGatewayAuthState();
	require_logging.logConfigUpdated(runtime);
	runtime.log(`Auth profile: ${profileId} (${provider}/api_key)`);
}
async function upsertAuthProfileWithLockOrThrow(params) {
	if (!await require_profiles.upsertAuthProfileWithLock(params)) throw new Error("Failed to update auth profile store; the auth store lock may be busy. Wait a moment and retry.");
}
/** Interactive helper for adding token auth profiles, with provider/method prompts. */
async function modelsAuthAddCommand(opts, runtime) {
	const { config, agentDir, workspaceDir, providers } = await resolveModelsAuthContext({ rawAgentId: opts.agent });
	const tokenProviders = listProvidersWithTokenMethods(providers);
	const provider = await select({
		message: "Token provider",
		options: [...tokenProviders.map((providerPlugin) => ({
			value: providerPlugin.id,
			label: providerPlugin.id,
			hint: providerPlugin.docsPath ? `Docs: ${providerPlugin.docsPath}` : void 0
		})), {
			value: "custom",
			label: "custom (type provider id)"
		}]
	});
	const providerId = provider === "custom" ? require_model_selection_normalize.normalizeProviderId(await text({
		message: "Provider id",
		validate: (value) => value?.trim() ? void 0 : "Required"
	})) : provider;
	const providerPlugin = provider === "custom" ? null : resolveRequestedProviderOrThrow(tokenProviders, providerId);
	if (providerPlugin) {
		const tokenMethods = listTokenAuthMethods(providerPlugin);
		const methodId = tokenMethods.length > 0 ? await select({
			message: "Token method",
			options: [...tokenMethods.map((method) => ({
				value: method.id,
				label: method.label,
				hint: method.hint
			})), {
				value: "paste",
				label: "paste token"
			}]
		}) : "paste";
		if (methodId !== "paste") {
			const prompter = require_clack_prompter.createClackPrompter();
			const method = tokenMethods.find((candidate) => candidate.id === methodId);
			if (!method) throw new Error(`Unknown token auth method "${methodId}". Run ${require_command_format.formatCliCommand(`operator models auth login --provider ${providerPlugin.id}`)} to choose interactively.`);
			await runProviderAuthMethod({
				config,
				agentDir,
				workspaceDir,
				provider: providerPlugin,
				method,
				runtime,
				prompter
			});
			return;
		}
	}
	const profileIdDefault = resolveDefaultTokenProfileId(providerId);
	await modelsAuthPasteTokenCommand({
		provider: providerId,
		profileId: (await text({
			message: "Profile id",
			initialValue: profileIdDefault,
			validate: (value) => value?.trim() ? void 0 : "Required"
		})).trim(),
		expiresIn: await confirm({
			message: "Does this token expire?",
			initialValue: false
		}) ? (await text({
			message: "Expires in (duration)",
			initialValue: "365d",
			validate: (value) => {
				try {
					require_parse_duration.parseDurationMs(value ?? "", { defaultUnit: "d" });
					return;
				} catch {
					return "Invalid duration (e.g. 365d, 12h, 30m)";
				}
			}
		})).trim() : void 0,
		agent: opts.agent
	}, runtime);
}
/**
* Clear stale cooldown/disabled state for all profiles matching a provider.
* When a user explicitly runs `models auth login`, they intend to fix auth —
* stale `auth_permanent` / `billing` lockouts should not persist across
* a deliberate re-authentication attempt.
*/
async function clearStaleProfileLockouts(provider, agentDir) {
	try {
		const store = require_store.loadAuthProfileStoreForRuntime(agentDir, { externalCli: require_external_cli_discovery.externalCliDiscoveryForProviderAuth({ provider }) });
		const profileIds = require_profile_list.listProfilesForProvider(store, provider);
		for (const profileId of profileIds) await require_usage.clearAuthProfileCooldown({
			store,
			profileId,
			agentDir
		});
	} catch {}
}
/** Resolves a requested login provider or throws with available provider details. */
function resolveRequestedLoginProviderOrThrow(providers, rawProvider) {
	return resolveRequestedProviderOrThrow(providers, rawProvider);
}
function credentialMode(credential) {
	if (credential.type === "api_key") return "api_key";
	if (credential.type === "token") return "token";
	return "oauth";
}
/** Applies an optional profile-id override to a single returned login profile. */
function resolveLoginProfiles(params) {
	const requestedProfileId = params.requestedProfileId?.trim();
	if (!requestedProfileId) return params.result.profiles;
	if (params.result.profiles.length !== 1) throw new Error("--profile-id requires exactly one returned auth profile from the selected auth method.");
	const [profile] = params.result.profiles;
	return [{
		...(0, _gabrielvfonseca_normalization_core.expectDefined)(profile, "auth profile"),
		profileId: requestedProfileId
	}];
}
function maybeLogOpenAICodexNativeSearchTip(runtime, providerId) {
	if (providerId !== "openai") return;
	runtime.log("Tip: Codex-capable models can use native Codex web search. Enable it with operator configure --section web (recommended mode: cached). Docs: https://docs.operator.ai/tools/web");
}
async function runModelsAuthLoginFlow(opts) {
	const { config, agentDir, workspaceDir, providers } = await resolveModelsAuthContext({
		requestedProvider: opts.provider,
		rawAgentId: opts.agent,
		config: opts.config
	});
	const prompter = opts.prompter;
	const authProviders = listProvidersWithAuthMethods(providers);
	if (authProviders.length === 0) throw new Error(`No provider plugins found. Install one via \`${require_command_format.formatCliCommand("operator plugins install")}\`.`);
	const selectedProvider = resolveRequestedLoginProviderOrThrow(authProviders, opts.provider ? normalizeManualAuthProvider(opts.provider) : void 0) ?? await prompter.select({
		message: "Select a provider",
		options: authProviders.map((provider) => ({
			value: provider.id,
			label: provider.label,
			hint: provider.docsPath ? `Docs: ${provider.docsPath}` : void 0
		}))
	}).then((id) => require_provider_auth_choice_helpers.resolveProviderMatch(authProviders, id));
	if (!selectedProvider) throw new Error(`Unknown provider. Run ${require_command_format.formatCliCommand("operator models status")} or ${require_command_format.formatCliCommand("operator plugins list")} to see available provider plugins.`);
	const chosenMethod = await pickProviderAuthMethod({
		provider: selectedProvider,
		requestedMethod: opts.method,
		prompter
	});
	if (!chosenMethod) throw new Error(`Unknown auth method. Run ${require_command_format.formatCliCommand(`operator models auth login --provider ${selectedProvider.id}`)} without --method to choose interactively.`);
	if (opts.force) try {
		if (!await require_profiles.removeProviderAuthProfilesWithLock({
			provider: selectedProvider.id,
			agentDir
		})) throw new Error("profile store update failed");
		opts.runtime.log(`Removed cached auth profiles for provider "${selectedProvider.id}" (--force). Running fresh auth flow.`);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`Could not clear cached profiles for "${selectedProvider.id}" before re-login: ${message}. Re-login was not started because --force must remove cached profiles first.`, { cause: err });
	}
	const { result, profiles } = await runProviderAuthMethod({
		config,
		agentDir,
		workspaceDir,
		provider: selectedProvider,
		method: chosenMethod,
		runtime: opts.runtime,
		prompter,
		profileId: opts.profileId,
		setDefault: opts.setDefault,
		env: opts.env,
		isRemote: opts.isRemote,
		openUrl: opts.openUrl
	});
	maybeLogOpenAICodexNativeSearchTip(opts.runtime, selectedProvider.id);
	return {
		providerId: selectedProvider.id,
		methodId: chosenMethod.id,
		...result.defaultModel ? { defaultModel: result.defaultModel } : {},
		profiles: profiles.map((profile) => ({
			profileId: profile.profileId,
			provider: profile.credential.provider,
			mode: credentialMode(profile.credential)
		}))
	};
}
async function modelsAuthLoginCommand(opts, runtime) {
	if (!process.stdin.isTTY) throw new Error(`models auth login requires an interactive TTY. In automation, use ${require_command_format.formatCliCommand("operator models auth paste-token --provider <provider>")} when token auth is available.`);
	await runModelsAuthLoginFlow({
		...opts,
		runtime,
		prompter: require_clack_prompter.createClackPrompter()
	});
}
//#endregion
exports.modelsAuthAddCommand = modelsAuthAddCommand;
exports.modelsAuthLoginCommand = modelsAuthLoginCommand;
exports.modelsAuthPasteApiKeyCommand = modelsAuthPasteApiKeyCommand;
exports.modelsAuthPasteTokenCommand = modelsAuthPasteTokenCommand;
exports.modelsAuthSetupTokenCommand = modelsAuthSetupTokenCommand;
exports.resolveLoginProfiles = resolveLoginProfiles;
exports.resolveRequestedLoginProviderOrThrow = resolveRequestedLoginProviderOrThrow;
exports.runModelsAuthLoginFlow = runModelsAuthLoginFlow;
