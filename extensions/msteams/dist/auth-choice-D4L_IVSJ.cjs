require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_model_catalog = require("./model-catalog-BFgB2-Jk.cjs");
const require_provider_auth_choices = require("./provider-auth-choices-Dr0zOwrP.cjs");
const require_provider_auth_recovery_hint = require("./provider-auth-recovery-hint-DHhlIrU4.cjs");
const require_model_auth_availability = require("./model-auth-availability-CbaVu2uQ.cjs");
const require_auth_choice_legacy = require("./auth-choice-legacy-BwWjiCjY.cjs");
const require_provider_auth_choice = require("./provider-auth-choice-BDZeLIQ8.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/commands/auth-choice.apply.ts
async function normalizeLegacyChoice(authChoice, params) {
	if (authChoice === "oauth") return "setup-token";
	if (typeof authChoice !== "string") return authChoice;
	const { normalizeLegacyOnboardAuthChoice } = await Promise.resolve().then(() => require("./auth-choice-legacy-BwWjiCjY.cjs")).then((n) => n.auth_choice_legacy_exports);
	return normalizeLegacyOnboardAuthChoice(authChoice, params);
}
async function normalizeTokenProviderChoice(params) {
	if (!params.source.opts?.tokenProvider) return params.authChoice;
	if (params.authChoice !== "apiKey" && params.authChoice !== "token" && params.authChoice !== "setup-token") return params.authChoice;
	const { normalizeApiKeyTokenProviderAuthChoice } = await Promise.resolve().then(() => require("./auth-choice.apply.api-providers-DhmRkQK5.cjs"));
	return normalizeApiKeyTokenProviderAuthChoice({
		authChoice: params.authChoice,
		tokenProvider: params.source.opts.tokenProvider,
		config: params.source.config,
		env: params.source.env
	});
}
async function formatDeprecatedProviderChoiceError(authChoice, params) {
	if (typeof authChoice !== "string") return;
	const { resolveManifestDeprecatedProviderAuthChoice } = await Promise.resolve().then(() => require("./provider-auth-choices-Dr0zOwrP.cjs")).then((n) => n.provider_auth_choices_exports);
	const deprecatedChoice = resolveManifestDeprecatedProviderAuthChoice(authChoice, {
		config: params.config,
		env: params.env
	});
	if (deprecatedChoice) return `Auth choice ${JSON.stringify(authChoice)} is no longer supported. Use ${JSON.stringify(deprecatedChoice.choiceId)} instead, or run ${require_command_format.formatCliCommand("operator onboard")} to choose interactively.`;
	const { resolveDeprecatedProviderInstallCatalogEntry } = await Promise.resolve().then(() => require("./provider-install-catalog-Buj0eWKh.cjs")).then((n) => n.provider_install_catalog_exports);
	const externalDeprecatedChoice = resolveDeprecatedProviderInstallCatalogEntry(authChoice, {
		config: params.config,
		env: params.env,
		includeUntrustedWorkspacePlugins: false
	});
	if (!externalDeprecatedChoice) return;
	return `Auth choice ${JSON.stringify(authChoice)} is no longer supported. Use ${JSON.stringify(externalDeprecatedChoice.choiceId)} instead, or run ${require_command_format.formatCliCommand("operator onboard")} to choose interactively.`;
}
/** Apply a selected auth choice, returning the mutated config or retry/model override signals. */
async function applyAuthChoice(params) {
	const normalizedProviderAuthChoice = await normalizeTokenProviderChoice({
		authChoice: await normalizeLegacyChoice(params.authChoice, {
			config: params.config,
			env: params.env
		}) ?? params.authChoice,
		source: params
	});
	const normalizedParams = normalizedProviderAuthChoice === params.authChoice ? params : {
		...params,
		authChoice: normalizedProviderAuthChoice
	};
	const result = await require_provider_auth_choice.applyAuthChoiceLoadedPluginProvider(normalizedParams);
	if (result) return result;
	const deprecatedProviderChoiceError = await formatDeprecatedProviderChoiceError(normalizedParams.authChoice, {
		config: normalizedParams.config,
		env: normalizedParams.env
	});
	if (deprecatedProviderChoiceError) throw new Error(deprecatedProviderChoiceError);
	if (normalizedParams.authChoice === "token" || normalizedParams.authChoice === "setup-token") throw new Error([`Auth choice "${normalizedParams.authChoice}" was not matched to a provider setup flow.`, `Run ${require_command_format.formatCliCommand("operator models auth login --provider <provider>")} for provider auth, or rerun ${require_command_format.formatCliCommand("operator onboard")} to choose interactively.`].join("\n"));
	if (normalizedParams.authChoice === "oauth") throw new Error(`Auth choice "oauth" is no longer supported directly. Use a provider-specific auth entry, or run ${require_command_format.formatCliCommand("operator models auth login --provider <provider>")}.`);
	return { config: normalizedParams.config };
}
//#endregion
//#region src/commands/auth-choice.model-check.ts
/**
* Resolve the default model ref and its auth readiness. A catalog observation
* makes transport-specific auth exact; absent observations remain
* indeterminate when provider facts cannot choose one route. Shared by the
* onboarding model check and the finalize hatch gating.
*/
function resolveDefaultModelAuthStatus(config, options) {
	const ref = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: config,
		agentId: options?.agentId
	});
	const evaluation = require_model_auth_availability.createModelAuthAvailabilityResolver({
		cfg: config,
		authStore: require_store.ensureAuthProfileStore(options?.agentDir, {
			allowKeychainPrompt: false,
			config,
			...ref.provider === "openai" ? { externalCliProviderIds: ["openai"] } : {},
			readOnly: true
		}),
		...options?.agentDir ? { agentDir: options.agentDir } : {},
		...options?.env ? { env: options.env } : {}
	}).evaluateModelAuth(ref.provider, {
		modelId: ref.model,
		...options?.observedRoutes?.length ? { observedRoutes: options.observedRoutes } : {}
	});
	if (evaluation.routeResolution?.kind === "incompatible") return {
		provider: ref.provider,
		model: ref.model,
		status: "incompatible",
		hasAuth: false,
		code: evaluation.routeResolution.code,
		message: evaluation.routeResolution.message
	};
	const availability = evaluation.availability;
	const authRequirement = evaluation.selectedRoute?.authRequirement;
	if (availability === true) return {
		provider: ref.provider,
		model: ref.model,
		status: "ready",
		hasAuth: true
	};
	if (availability === void 0 && ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderIdForAuth)(ref.provider) === "openai" || evaluation.routeResolution !== null || evaluation.evidence !== void 0)) return {
		provider: ref.provider,
		model: ref.model,
		status: "indeterminate",
		hasAuth: false
	};
	return {
		provider: ref.provider,
		model: ref.model,
		status: "missing",
		hasAuth: false,
		...authRequirement ? { authRequirement } : {}
	};
}
function catalogRouteObservation(entry) {
	if (!entry) return;
	const baseUrl = entry.baseUrl;
	if (entry.api === void 0 && baseUrl === void 0) return;
	return {
		...entry.api !== void 0 ? { api: entry.api } : {},
		...baseUrl !== void 0 ? { baseUrl } : {}
	};
}
/** Resolve logical model identity and every physical route represented by a catalog. */
function resolveDefaultModelCatalogFacts(config, catalog, options) {
	const ref = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: config,
		agentId: options?.agentId
	});
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderIdForAuth)(ref.provider);
	const modelId = require_openai_routing.canonicalizeProviderModelId(provider, ref.model);
	const matches = (entry) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderIdForAuth)(entry.provider) === provider && require_openai_routing.canonicalizeProviderModelId(provider, entry.id) === modelId;
	const routeVariants = options?.routeVariants ?? catalog;
	const observedRoutes = routeVariants.filter(matches).map(catalogRouteObservation).filter((route) => route !== void 0);
	return {
		found: catalog.some(matches) || routeVariants.some(matches),
		...observedRoutes.length > 0 ? { observedRoutes } : {}
	};
}
/** Warn when the selected default model is unknown or has no usable credentials. */
async function warnIfModelConfigLooksOff(config, prompter, options) {
	const ref = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: config,
		agentId: options?.agentId
	});
	const warnings = [];
	const snapshot = options?.validateCatalog === false ? {
		entries: [],
		routeVariants: []
	} : await require_model_catalog.loadModelCatalogSnapshot({
		config,
		useCache: false
	});
	const catalog = snapshot.entries;
	const catalogFacts = resolveDefaultModelCatalogFacts(config, catalog, {
		...options?.agentId ? { agentId: options.agentId } : {},
		routeVariants: snapshot.routeVariants
	});
	const observedRoutes = options?.observedRoutes ?? catalogFacts.observedRoutes;
	if (options?.validateCatalog !== false) {
		if (catalog.length > 0) {
			if (!catalogFacts.found) warnings.push(`Model not found: ${ref.provider}/${ref.model}. Update agents.defaults.model or run /models list.`);
		}
	}
	const authStatus = resolveDefaultModelAuthStatus(config, {
		...options?.agentId ? { agentId: options.agentId } : {},
		...options?.agentDir ? { agentDir: options.agentDir } : {},
		...options?.env ? { env: options.env } : {},
		...observedRoutes ? { observedRoutes } : {}
	});
	if (authStatus.status === "missing") warnings.push(`No auth configured for provider "${ref.provider}". The agent may fail until credentials are added. ${require_provider_auth_recovery_hint.buildProviderAuthRecoveryHint({
		provider: ref.provider,
		config,
		includeEnvVar: authStatus.authRequirement !== "subscription"
	})}`);
	else if (authStatus.status === "incompatible") warnings.push(`Model route is incompatible for "${ref.provider}/${ref.model}": ${authStatus.message}`);
	else if (authStatus.status === "indeterminate") warnings.push(`Auth readiness could not be confirmed for "${ref.provider}/${ref.model}". Verify the selected model route and credential source before continuing.`);
	if (warnings.length > 0) await prompter.note(warnings.join("\n"), "Model check");
}
//#endregion
//#region src/plugins/provider-auth-choice-preference.ts
/** Resolves preferred provider auth choices from config and plugin metadata. */
function normalizeLegacyAuthChoice(choice, env) {
	return require_auth_choice_legacy.normalizeLegacyOnboardAuthChoice(choice, { env }) ?? choice;
}
async function resolvePreferredProviderForAuthChoice(params) {
	const choice = normalizeLegacyAuthChoice(params.choice, params.env) ?? params.choice;
	const manifestResolved = require_provider_auth_choices.resolveManifestProviderAuthChoice(choice, params);
	if (manifestResolved) return manifestResolved.providerId;
	const { resolveProviderPluginChoice, resolvePluginProviders } = await Promise.resolve().then(() => require("./provider-auth-choice.runtime-Vopx4913.cjs"));
	const pluginResolved = resolveProviderPluginChoice({
		providers: resolvePluginProviders({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			mode: "setup",
			includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins
		}),
		choice
	});
	if (pluginResolved) return pluginResolved.provider.id;
	if (choice === "custom-api-key") return "custom";
}
//#endregion
exports.applyAuthChoice = applyAuthChoice;
exports.applyAuthChoice$1 = applyAuthChoice;
exports.resolveDefaultModelAuthStatus = resolveDefaultModelAuthStatus;
exports.resolveDefaultModelCatalogFacts = resolveDefaultModelCatalogFacts;
exports.resolvePreferredProviderForAuthChoice = resolvePreferredProviderForAuthChoice;
exports.warnIfModelConfigLooksOff = warnIfModelConfigLooksOff;
exports.warnIfModelConfigLooksOff$1 = warnIfModelConfigLooksOff;
