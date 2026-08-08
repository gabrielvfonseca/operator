require("./rolldown-runtime-u92d-OFm.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
const require_manifest_planner = require("./manifest-planner-Bss2KTsa.cjs");
require("./model-catalog-BgqTA2hC.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
require("./models-config-kAzoM1Dq.cjs");
const require_provider_discovery = require("./provider-discovery-CAaTQOTf.cjs");
const require_models_config_providers_secrets = require("./models-config.providers.secrets-xIseNfr3.cjs");
const require_model_catalog$1 = require("./model-catalog-BFgB2-Jk.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_model_provider_auth = require("./model-provider-auth-Bk7aSJ7D.cjs");
const require_model_catalog_visibility = require("./model-catalog-visibility-DGu1_zhC.cjs");
const require_model_picker_visibility = require("./model-picker-visibility-DXXEYKgU.cjs");
const require_shared = require("./shared-DHbcE08y.cjs");
const require_provider_model_primary = require("./provider-model-primary-QsS3aK4q.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
require("node:crypto");
//#region src/commands/models/list.manifest-catalog.ts
/** Manifest-backed model catalog row loaders for `openclaw models list`. */
function loadManifestCatalogRowsForPluginIds(params) {
	if (params.pluginIds && params.pluginIds.length === 0) return [];
	const pluginIdSet = params.pluginIds ? new Set(params.pluginIds) : void 0;
	const plan = require_manifest_planner.planManifestModelCatalogRows({
		registry: pluginIdSet ? {
			...params.registry,
			plugins: params.registry.plugins.filter((plugin) => pluginIdSet.has(plugin.id))
		} : params.registry,
		...params.providerFilter ? { providerFilter: params.providerFilter } : {}
	});
	const eligibleProviders = new Set(plan.entries.filter((entry) => params.mode === "static-authoritative" ? entry.discovery === "static" : entry.discovery !== "runtime").map((entry) => entry.provider));
	if (eligibleProviders.size === 0) return [];
	return plan.rows.filter((row) => eligibleProviders.has(row.provider));
}
function resolveConventionModelCatalogPluginIds(params) {
	const record = require_plugin_registry.getPluginRecord({
		index: params.index,
		pluginId: params.providerFilter
	});
	if (!record || !require_plugin_registry.isPluginEnabled({
		index: params.index,
		pluginId: record.pluginId,
		config: params.cfg
	})) return [];
	return [record.pluginId];
}
function resolveDeclaredModelCatalogPluginIds(params) {
	return require_plugin_registry.resolvePluginContributionOwners({
		index: params.index,
		config: params.cfg,
		contribution: "modelCatalogProviders",
		matches: params.providerFilter
	});
}
function loadManifestCatalogRowsForList(params) {
	const providerFilter = params.providerFilter ? (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.normalizeModelCatalogProviderId)(params.providerFilter) : void 0;
	const mode = params.mode ?? "static-authoritative";
	const snapshot = params.metadataSnapshot ?? require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.cfg,
		env: params.env ?? process.env
	});
	const index = snapshot.index;
	if (!providerFilter) return loadManifestCatalogRowsForPluginIds({
		cfg: params.cfg,
		env: params.env,
		index,
		registry: snapshot.manifestRegistry,
		mode
	});
	const conventionRows = loadManifestCatalogRowsForPluginIds({
		cfg: params.cfg,
		env: params.env,
		index,
		registry: snapshot.manifestRegistry,
		mode,
		pluginIds: resolveConventionModelCatalogPluginIds({
			cfg: params.cfg,
			index,
			providerFilter
		}),
		providerFilter
	});
	if (conventionRows.length > 0) return conventionRows;
	return loadManifestCatalogRowsForPluginIds({
		cfg: params.cfg,
		env: params.env,
		index,
		registry: snapshot.manifestRegistry,
		mode,
		pluginIds: resolveDeclaredModelCatalogPluginIds({
			cfg: params.cfg,
			index,
			providerFilter
		}),
		providerFilter
	});
}
/** Loads authoritative static manifest catalog rows for model-list output. */
function loadStaticManifestCatalogRowsForList(params) {
	return loadManifestCatalogRowsForList({
		...params,
		mode: "static-authoritative"
	});
}
require_subsystem.createSubsystemLogger("models/list-provider-catalog");
function collectMatchingContributionOwners(index, contribution, providerFilter, cfg, options = {}) {
	if (contribution === "providers") return [...require_plugin_registry.resolveProviderOwners({
		index,
		providerId: providerFilter,
		includeDisabled: options.includeDisabled,
		config: cfg
	})];
	return [...require_plugin_registry.resolvePluginContributionOwners({
		index,
		contribution: "cliBackends",
		matches: (contributionId) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(contributionId) === providerFilter,
		includeDisabled: options.includeDisabled,
		config: cfg
	})];
}
function resolveInstalledIndexPluginIdsForProviderFilter(params) {
	const snapshot = require_plugin_registry.loadPluginRegistrySnapshotWithMetadata({
		config: params.cfg,
		env: params.env,
		index: params.registryIndex
	});
	if (snapshot.source !== "persisted" && snapshot.source !== "provided") return;
	const index = snapshot.snapshot;
	const pluginIds = [...collectMatchingContributionOwners(index, "providers", params.providerFilter, params.cfg), ...collectMatchingContributionOwners(index, "cliBackends", params.providerFilter, params.cfg)];
	if (pluginIds.length > 0) return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(pluginIds);
	return [...collectMatchingContributionOwners(index, "providers", params.providerFilter, params.cfg, { includeDisabled: true }), ...collectMatchingContributionOwners(index, "cliBackends", params.providerFilter, params.cfg, { includeDisabled: true })].length > 0 ? [] : void 0;
}
/** Resolves plugin ids that can provide catalog rows for a provider filter. */
async function resolveProviderCatalogPluginIdsForFilter(params) {
	const providerFilter = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.providerFilter);
	if (!providerFilter) return;
	const installedIndexPluginIds = resolveInstalledIndexPluginIdsForProviderFilter({
		cfg: params.cfg,
		env: params.env,
		providerFilter,
		registryIndex: params.metadataSnapshot?.index ?? params.registryIndex
	});
	if (installedIndexPluginIds) return installedIndexPluginIds;
	const manifestPluginIds = require_providers.resolveOwningPluginIdsForProviderRef({
		provider: providerFilter,
		config: params.cfg,
		env: params.env,
		manifestRegistry: params.metadataSnapshot?.manifestRegistry
	});
	if (manifestPluginIds) return manifestPluginIds;
	const { resolveProviderContractPluginIdsForProviderAlias } = await Promise.resolve().then(() => require("./registry-DHg4ycKz.cjs"));
	const bundledAliasPluginIds = resolveProviderContractPluginIdsForProviderAlias(providerFilter);
	if (bundledAliasPluginIds) return bundledAliasPluginIds;
}
//#endregion
//#region src/flows/model-picker.provider-catalog.ts
const log = require_subsystem.createSubsystemLogger("model-picker-provider-catalog");
const DISCOVERY_ORDERS = [
	"simple",
	"profile",
	"paired",
	"late"
];
function positiveNumber(value) {
	return typeof value === "number" && value > 0 ? value : void 0;
}
function providerAuthIds(provider) {
	return [
		provider.id,
		...provider.aliases ?? [],
		...provider.hookAliases ?? []
	].map(_gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId).filter(Boolean);
}
function hasLiveProviderCatalog(provider) {
	return typeof provider.catalog?.run === "function" || typeof provider.discovery?.run === "function";
}
async function resolvePreferredProviderLiveCatalogProviders(params) {
	const liveProviders = (await require_provider_discovery.resolveRuntimePluginDiscoveryProviders({
		config: params.cfg,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds,
		includeUntrustedWorkspacePlugins: false,
		...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
	})).filter((provider) => require_provider_discovery.providerMatchesFilter({
		provider,
		providerFilter: params.providerFilter
	})).filter(hasLiveProviderCatalog);
	if (liveProviders.length > 0) return liveProviders;
	const { resolvePluginProviders } = await Promise.resolve().then(() => require("./providers.runtime-C5KyGi_O.cjs")).then((n) => n.providers_runtime_exports);
	return resolvePluginProviders({
		config: params.cfg,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds,
		includeUntrustedWorkspacePlugins: false,
		mode: "setup",
		activate: false,
		cache: false,
		...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
	}).filter((provider) => require_provider_discovery.providerMatchesFilter({
		provider,
		providerFilter: params.providerFilter
	}) && hasLiveProviderCatalog(provider));
}
function resolveProviderEnvApiKey(provider, env) {
	for (const envVar of provider.envVars ?? []) {
		const normalized = envVar.trim();
		const value = env[normalized]?.trim();
		if (normalized && value) return {
			apiKey: value,
			discoveryApiKey: value
		};
	}
}
function modelFromProviderCatalog(params) {
	const id = require_model_selection_normalize.normalizeConfiguredProviderCatalogModelId(params.provider, params.model.id);
	const contextWindow = positiveNumber(params.model.contextWindow) ?? positiveNumber(params.providerConfig.contextWindow);
	const contextTokens = positiveNumber(params.model.contextTokens) ?? positiveNumber(params.providerConfig.contextTokens);
	const api = params.model.api ?? params.providerConfig.api;
	const baseUrl = params.model.baseUrl ?? params.providerConfig.baseUrl;
	return {
		id,
		name: params.model.name || id,
		provider: params.provider,
		...api !== void 0 ? { api } : {},
		...baseUrl !== void 0 ? { baseUrl } : {},
		...contextWindow !== void 0 ? { contextWindow } : {},
		...contextTokens !== void 0 ? { contextTokens } : {},
		reasoning: params.model.reasoning,
		input: params.model.input,
		...params.model.compat ? { compat: params.model.compat } : {}
	};
}
/** Loads live catalog models for the user's preferred provider, ordered by discovery priority. */
async function loadPreferredProviderPickerCatalog(params) {
	const env = params.env ?? process.env;
	const agentDir = params.agentDir ?? require_agent_scope_config.resolveDefaultAgentDir(params.cfg, env);
	const providerFilter = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.preferredProvider);
	if (!providerFilter) return [];
	const onlyPluginIds = await resolveProviderCatalogPluginIdsForFilter({
		cfg: params.cfg,
		env,
		providerFilter
	});
	if (!onlyPluginIds || onlyPluginIds.length === 0) return [];
	const providers = await resolvePreferredProviderLiveCatalogProviders({
		cfg: params.cfg,
		env,
		onlyPluginIds,
		providerFilter,
		...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
	});
	if (providers.length === 0) return [];
	let authStore;
	const getAuthStore = () => authStore ??= require_store.ensureAuthProfileStoreWithoutExternalProfiles(agentDir, { allowKeychainPrompt: false });
	const resolveProviderApiKey = require_models_config_providers_secrets.createProviderApiKeyResolver(env, getAuthStore, params.cfg);
	const resolveProviderAuth = require_models_config_providers_secrets.createProviderAuthResolver(env, getAuthStore, params.cfg);
	const resolveFastProviderApiKey = (provider, providerId = provider.id) => {
		const normalizedProviderId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
		if (providerAuthIds(provider).includes(normalizedProviderId)) {
			const fromEnv = resolveProviderEnvApiKey(provider, env);
			if (fromEnv) return fromEnv;
		}
		return resolveProviderApiKey(providerId);
	};
	const byOrder = require_provider_discovery.groupPluginDiscoveryProvidersByOrder(providers);
	const rows = [];
	const seen = /* @__PURE__ */ new Set();
	for (const order of DISCOVERY_ORDERS) for (const provider of byOrder[order]) {
		let result;
		const resolveCatalogProviderApiKey = (providerId) => resolveFastProviderApiKey(provider, providerId?.trim() || provider.id);
		const resolveCatalogProviderAuth = (providerId, options) => resolveProviderAuth(providerId?.trim() || provider.id, options);
		try {
			result = await require_provider_discovery.runProviderCatalog({
				provider,
				config: params.cfg,
				env,
				resolveProviderApiKey: resolveCatalogProviderApiKey,
				resolveProviderAuth: resolveCatalogProviderAuth,
				agentDir,
				...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
			});
		} catch (error) {
			log.warn(`provider catalog failed for ${provider.id}: ${require_errors.formatErrorMessage(error)}`);
			continue;
		}
		const normalized = require_provider_discovery.normalizePluginDiscoveryResult({
			provider,
			result
		});
		for (const [providerIdRaw, providerConfig] of Object.entries(normalized)) {
			const providerId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerIdRaw);
			if (providerId !== providerFilter || !Array.isArray(providerConfig.models)) continue;
			for (const model of providerConfig.models) {
				const entry = modelFromProviderCatalog({
					provider: providerId,
					providerConfig,
					model
				});
				const key = `${entry.provider}/${entry.id}`;
				if (seen.has(key)) continue;
				seen.add(key);
				rows.push(entry);
			}
		}
	}
	return rows;
}
//#endregion
//#region src/flows/model-picker.ts
const KEEP_VALUE = "__keep__";
const MANUAL_VALUE = "__manual__";
const BROWSE_VALUE = "__browse__";
const PROVIDER_FILTER_THRESHOLD = 30;
const EMPTY_LITERAL_PREFIX_PROVIDERS = /* @__PURE__ */ new Set();
const HIDDEN_ROUTER_MODELS = /* @__PURE__ */ new Set(["openrouter/auto"]);
function formatKeepCurrentModelLabel(params) {
	return params.configuredRaw ? require_i18n.t("wizard.model.keepCurrent", { value: params.configuredLabel }) : require_i18n.t("wizard.model.keepCurrentDefault", { value: params.resolvedKey });
}
function formatModelRefLabel(params) {
	const providerId = require_model_selection_normalize.normalizeProviderId(params.provider);
	const modelId = params.model.trim().toLowerCase();
	return providerId && params.literalPrefixProviders.has(providerId) && modelId.startsWith(`${providerId}/`) ? require_model_selection_normalize.formatLiteralProviderPrefixedModelRef(params.provider, params.key) : params.key;
}
function resolvePickerAgentDir(params) {
	return params.agentDir ?? require_agent_scope_config.resolveDefaultAgentDir(params.cfg, params.env ?? process.env);
}
async function loadModelPickerRuntime() {
	return Promise.resolve().then(() => require("./model-picker.runtime-D3VkBtWr.cjs"));
}
const loadResolvedModelPickerRuntime = require_lazy_runtime.createLazyRuntimeSurface(loadModelPickerRuntime, ({ modelPickerRuntime }) => modelPickerRuntime);
function resolveConfiguredModelRaw(cfg) {
	return require_model_input.resolveAgentModelPrimaryValue(cfg.agents?.defaults?.model) ?? "";
}
function resolveConfiguredModelKeys(cfg) {
	const models = cfg.agents?.defaults?.models ?? {};
	return Object.keys(models).map((key) => key.trim()).filter((key) => key.length > 0);
}
function toPickerCatalogEntry(row) {
	return {
		id: row.id,
		name: row.name,
		provider: row.provider,
		...row.api !== void 0 ? { api: row.api } : {},
		...row.baseUrl !== void 0 ? { baseUrl: row.baseUrl } : {},
		...row.contextWindow !== void 0 ? { contextWindow: row.contextWindow } : {},
		reasoning: row.reasoning,
		input: row.input
	};
}
function loadPickerModelCatalog(cfg, opts = {}) {
	const snapshot = (entries) => ({
		entries,
		routeVariants: entries
	});
	if (cfg.models?.mode === "replace") return Promise.resolve(snapshot(require_model_selection_shared.buildConfiguredModelCatalog({ cfg })));
	if (opts.preferredProvider) {
		if (opts.preferLiveProviderCatalog) return loadPreferredProviderPickerCatalog({
			cfg,
			preferredProvider: opts.preferredProvider,
			...opts.agentDir !== void 0 ? { agentDir: opts.agentDir } : {},
			...opts.workspaceDir !== void 0 ? { workspaceDir: opts.workspaceDir } : {},
			...opts.env !== void 0 ? { env: opts.env } : {}
		}).then((providerCatalog) => {
			if (providerCatalog.length > 0) return snapshot(providerCatalog);
			if (opts.allowStaticFallbackCatalog !== false) {
				const manifestRows = loadStaticManifestCatalogRowsForList({
					cfg,
					providerFilter: opts.preferredProvider,
					...opts.env !== void 0 ? { env: opts.env } : {}
				});
				if (manifestRows.length > 0) return snapshot(manifestRows.map(toPickerCatalogEntry));
			}
			return opts.providerScoped ? snapshot([]) : require_model_catalog$1.loadModelCatalogSnapshot({ config: cfg });
		});
		const manifestRows = loadStaticManifestCatalogRowsForList({
			cfg,
			providerFilter: opts.preferredProvider,
			...opts.env !== void 0 ? { env: opts.env } : {}
		});
		if (manifestRows.length > 0) return Promise.resolve(snapshot(manifestRows.map(toPickerCatalogEntry)));
		if (opts.providerScoped) return Promise.resolve(snapshot([]));
	}
	return require_model_catalog$1.loadModelCatalogSnapshot({ config: cfg });
}
async function resolvePickerLogicalCatalog(params) {
	const sourceOrder = /* @__PURE__ */ new Map();
	for (const entry of params.catalog) {
		const key = require_openai_routing.openAIModelCatalogRoutePolicy.resolveIdentity(entry)?.key ?? modelCatalogEntryKey(entry);
		if (!sourceOrder.has(key)) sourceOrder.set(key, sourceOrder.size);
	}
	return (await require_model_catalog_visibility.resolveLogicalVisibleModelCatalog({
		cfg: params.cfg,
		catalog: params.catalog,
		defaultProvider: params.defaultProvider,
		...params.defaultModel ? { defaultModel: params.defaultModel } : {},
		...params.agentId ? { agentId: params.agentId } : {},
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		...params.view ? { view: params.view } : {},
		routePolicy: require_openai_routing.openAIModelCatalogRoutePolicy,
		routeVariants: params.routeVariants,
		evaluateEntry: async (entry, routeVariants) => {
			const identity = require_openai_routing.openAIModelCatalogRoutePolicy.resolveIdentity(entry);
			return require_model_catalog_visibility.resolveLogicalModelCatalogEntryState({
				entry,
				evaluation: await params.hasAuth.evaluateModelAuth(entry.provider, {
					modelId: identity?.id ?? entry.id,
					observedRoutes: routeVariants.map((variant) => ({
						api: variant.api,
						baseUrl: variant.baseUrl
					}))
				}),
				routePolicy: require_openai_routing.openAIModelCatalogRoutePolicy
			});
		}
	})).toSorted((left, right) => {
		const leftKey = require_openai_routing.openAIModelCatalogRoutePolicy.resolveIdentity(left)?.key ?? modelCatalogEntryKey(left);
		const rightKey = require_openai_routing.openAIModelCatalogRoutePolicy.resolveIdentity(right)?.key ?? modelCatalogEntryKey(right);
		return (sourceOrder.get(leftKey) ?? Number.MAX_SAFE_INTEGER) - (sourceOrder.get(rightKey) ?? Number.MAX_SAFE_INTEGER);
	});
}
function normalizeModelKeys(values) {
	const seen = /* @__PURE__ */ new Set();
	const next = [];
	for (const raw of values) {
		const value = require_model_input.normalizeAgentModelRefForConfig(raw);
		if (!value || seen.has(value)) continue;
		seen.add(value);
		next.push(value);
	}
	return next;
}
function resolveFallbackModelKey(params) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.raw);
	if (!raw) return;
	const resolved = require_model_selection_shared.resolveModelRefFromString({
		cfg: params.cfg,
		raw,
		defaultProvider: params.defaultProvider,
		aliasIndex: params.aliasIndex
	});
	if (!resolved) return;
	return require_model_selection_normalize.modelKey(resolved.ref.provider, resolved.ref.model);
}
function resolveFallbackModelKeys(params) {
	return normalizeModelKeys(params.rawFallbacks.map((raw) => resolveFallbackModelKey({
		cfg: params.cfg,
		raw,
		defaultProvider: params.defaultProvider,
		aliasIndex: params.aliasIndex
	})).filter((key) => Boolean(key)));
}
function createModelRouteRuntimeResolver(params) {
	const cache = /* @__PURE__ */ new Map();
	return (route) => {
		const baseUrlKey = typeof route.baseUrl === "string" ? route.baseUrl : route.baseUrl == null ? "" : typeof route.baseUrl;
		const key = [
			route.provider,
			route.modelId,
			route.api ?? "",
			baseUrlKey
		].join("\0");
		if (cache.has(key)) return cache.get(key);
		const policy = require_policy.resolveAgentHarnessPolicy({
			provider: route.provider,
			modelId: route.modelId,
			modelApi: route.api,
			modelBaseUrl: route.baseUrl,
			config: params.config,
			env: params.env
		});
		const runtime = policy.runtime === "codex" ? "codex" : policy.runtime === "@gabrielvfonseca/operator" ? "@gabrielvfonseca/operator" : void 0;
		cache.set(key, runtime);
		return runtime;
	};
}
function resolveModelRouteHint(params) {
	if (require_model_selection_normalize.normalizeProviderId(params.provider) !== "openai") return;
	const runtime = params.resolveModelRouteRuntime({
		provider: params.provider,
		modelId: params.modelId,
		api: params.api,
		baseUrl: params.baseUrl
	});
	return runtime === "codex" ? "Codex runtime route" : runtime === "@gabrielvfonseca/operator" ? "Operator runtime route" : void 0;
}
async function resolveLiteralPrefixProviderIds(params) {
	const { resolvePluginProviders } = await loadResolvedModelPickerRuntime();
	const providers = resolvePluginProviders({
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env: params.env,
		activate: false,
		cache: false,
		includeUntrustedWorkspacePlugins: false
	});
	const ids = /* @__PURE__ */ new Set();
	for (const provider of providers) {
		if (!provider.preserveLiteralProviderPrefix) continue;
		const id = require_model_selection_normalize.normalizeProviderId(provider.id);
		if (id) ids.add(id);
		for (const alias of provider.aliases ?? []) {
			const aliasId = require_model_selection_normalize.normalizeProviderId(alias);
			if (aliasId) ids.add(aliasId);
		}
	}
	return ids;
}
function modelCatalogEntryKey(entry) {
	const normalizedRef = require_model_selection_normalize.normalizeModelRef(entry.provider, entry.id);
	return require_model_selection_normalize.modelKey(normalizedRef.provider, normalizedRef.model);
}
async function addModelSelectOption(params) {
	const normalizedRef = require_model_selection_normalize.normalizeModelRef(params.entry.provider, params.entry.id);
	const key = modelCatalogEntryKey(params.entry);
	if (params.seen.has(key) || HIDDEN_ROUTER_MODELS.has(key) || !params.isVisibleProvider(normalizedRef.provider)) return;
	const hints = [];
	if (params.entry.name && params.entry.name !== params.entry.id) hints.push(params.entry.name);
	if (params.entry.contextWindow) hints.push(`ctx ${require_shared.formatTokenK(params.entry.contextWindow)}`);
	if (params.entry.reasoning) hints.push("reasoning");
	const aliases = params.aliasIndex.byKey.get(key);
	if (aliases?.length) hints.push(`alias: ${aliases.join(", ")}`);
	const routeHint = resolveModelRouteHint({
		provider: normalizedRef.provider,
		modelId: normalizedRef.model,
		api: params.entry.api,
		baseUrl: params.entry.baseUrl,
		resolveModelRouteRuntime: params.resolveModelRouteRuntime
	});
	if (routeHint) hints.push(routeHint);
	if (!await params.hasAuth(normalizedRef.provider, {
		modelId: normalizedRef.model,
		api: params.entry.api,
		baseUrl: params.entry.baseUrl
	})) return;
	const label = formatModelRefLabel({
		provider: normalizedRef.provider,
		model: normalizedRef.model,
		key,
		literalPrefixProviders: params.literalPrefixProviders
	});
	params.options.push({
		value: key,
		label,
		hint: hints.length > 0 ? hints.join(" · ") : void 0
	});
	params.seen.add(key);
}
function splitModelKey(key) {
	const slashIndex = key.indexOf("/");
	if (slashIndex <= 0 || slashIndex >= key.length - 1) return;
	return {
		provider: key.slice(0, slashIndex),
		id: key.slice(slashIndex + 1)
	};
}
async function addModelKeySelectOption(params) {
	const entry = splitModelKey(params.key);
	if (!entry) return;
	const before = params.seen.size;
	await addModelSelectOption({
		entry,
		options: params.options,
		seen: params.seen,
		aliasIndex: params.aliasIndex,
		hasAuth: params.hasAuth,
		literalPrefixProviders: params.literalPrefixProviders ?? EMPTY_LITERAL_PREFIX_PROVIDERS,
		isVisibleProvider: params.isVisibleProvider,
		resolveModelRouteRuntime: params.resolveModelRouteRuntime
	});
	if (params.seen.size > before) {
		const option = params.options.at(-1);
		if (option && !option.hint) option.hint = params.fallbackHint;
	}
}
function createPreferredProviderMatcher(params) {
	const normalizedPreferredProvider = require_model_selection_normalize.normalizeProviderId(params.preferredProvider);
	const preferredOwnerPluginIds = require_providers.resolveOwningPluginIdsForProviderRef({
		provider: normalizedPreferredProvider,
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	const preferredOwnerPluginIdSet = preferredOwnerPluginIds ? new Set(preferredOwnerPluginIds) : void 0;
	const entryProviderCache = /* @__PURE__ */ new Map();
	return (entryProvider) => {
		const normalizedEntryProvider = require_model_selection_normalize.normalizeProviderId(entryProvider);
		if (normalizedEntryProvider === normalizedPreferredProvider) return true;
		const cached = entryProviderCache.get(normalizedEntryProvider);
		if (cached !== void 0) return cached;
		if (!preferredOwnerPluginIdSet) {
			entryProviderCache.set(normalizedEntryProvider, false);
			return false;
		}
		const value = require_providers.resolveOwningPluginIdsForProviderRef({
			provider: normalizedEntryProvider,
			config: params.cfg,
			workspaceDir: params.workspaceDir,
			env: params.env
		})?.some((pluginId) => preferredOwnerPluginIdSet.has(pluginId)) ?? false;
		entryProviderCache.set(normalizedEntryProvider, value);
		return value;
	};
}
async function promptManualModel(params) {
	const model = (await params.prompter.text({
		message: params.allowBlank ? require_i18n.t("wizard.model.defaultModelBlankToKeep") : require_i18n.t("wizard.model.defaultModel"),
		initialValue: params.initialValue,
		placeholder: "provider/model",
		validate: params.allowBlank ? void 0 : (value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ? void 0 : require_i18n.t("common.required")
	}) ?? "").trim();
	if (!model) return {};
	return { model: require_model_input.normalizeAgentModelRefForConfig(model) };
}
function buildModelProviderFilterOptions(models) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(models.map((entry) => entry.provider)).map((provider) => {
		const count = models.filter((entry) => entry.provider === provider).length;
		return {
			value: provider,
			label: provider,
			hint: require_i18n.t("wizard.model.modelCount", {
				count,
				plural: count === 1 ? "" : "s"
			})
		};
	});
}
async function maybeFilterModelsByProvider(params) {
	let next = params.models.filter((entry) => params.isVisibleProvider(entry.provider));
	const providerIds = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(next.map((entry) => entry.provider));
	const hasPreferredProvider = Boolean(params.preferredProvider);
	const shouldPromptProvider = !hasPreferredProvider && providerIds.length > 1 && next.length > PROVIDER_FILTER_THRESHOLD;
	const matchesPreferredProvider = params.preferredProvider ? createPreferredProviderMatcher({
		preferredProvider: params.preferredProvider,
		cfg: params.cfg,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) : void 0;
	if (shouldPromptProvider) {
		const selection = await params.prompter.select({
			message: require_i18n.t("wizard.model.filterByProvider"),
			options: [{
				value: "*",
				label: require_i18n.t("wizard.model.allProviders")
			}, ...buildModelProviderFilterOptions(next)],
			searchable: true
		});
		if (selection !== "*") next = next.filter((entry) => entry.provider === selection);
	}
	if (hasPreferredProvider && params.preferredProvider) {
		const filtered = next.filter((entry) => matchesPreferredProvider?.(entry.provider));
		if (filtered.length > 0) next = filtered;
	}
	return next;
}
async function resolveProviderPluginSetupOptions(params) {
	const runtime = await loadResolvedModelPickerRuntime();
	return ("resolveProviderModelPickerContributions" in runtime && typeof runtime.resolveProviderModelPickerContributions === "function" ? runtime.resolveProviderModelPickerContributions({
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env: params.env
	}).map((contribution) => contribution.option) : runtime.resolveProviderModelPickerEntries({
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env: params.env
	})).map((entry) => Object.assign({
		value: entry.value,
		label: entry.label
	}, entry.hint ? { hint: entry.hint } : {}));
}
async function maybeHandleProviderPluginSelection(params) {
	let pluginResolution = null;
	let pluginProviders = [];
	if (params.selection.startsWith("provider-plugin:")) pluginResolution = params.selection;
	else if (!params.selection.includes("/")) {
		const { resolvePluginProviders } = await loadResolvedModelPickerRuntime();
		pluginProviders = resolvePluginProviders({
			config: params.cfg,
			workspaceDir: params.workspaceDir,
			env: params.env,
			mode: "setup"
		});
		pluginResolution = pluginProviders.some((provider) => require_model_selection_normalize.normalizeProviderId(provider.id) === require_model_selection_normalize.normalizeProviderId(params.selection)) ? params.selection : null;
	}
	if (!pluginResolution) return null;
	if (!params.agentDir || !params.runtime) {
		await params.prompter.note(require_i18n.t("wizard.model.providerSetupUnavailable"), require_i18n.t("wizard.model.providerSetupUnavailableTitle"));
		return {};
	}
	const { resolvePluginProviders, resolveProviderPluginChoice, runProviderModelSelectedHook, runProviderPluginAuthMethod } = await loadResolvedModelPickerRuntime();
	if (pluginProviders.length === 0) pluginProviders = resolvePluginProviders({
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env: params.env,
		mode: "setup"
	});
	const resolved = resolveProviderPluginChoice({
		providers: pluginProviders,
		choice: pluginResolution
	});
	if (!resolved) return {};
	const applied = await runProviderPluginAuthMethod({
		config: params.cfg,
		runtime: params.runtime,
		prompter: params.prompter,
		method: resolved.method,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	});
	if (applied.defaultModel) await runProviderModelSelectedHook({
		config: applied.config,
		model: applied.defaultModel,
		prompter: params.prompter,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	return {
		model: applied.defaultModel,
		config: applied.config
	};
}
async function promptDefaultModel(params) {
	const cfg = params.config;
	const pickerAgentDir = resolvePickerAgentDir({
		cfg,
		...params.agentDir !== void 0 ? { agentDir: params.agentDir } : {},
		...params.env !== void 0 ? { env: params.env } : {}
	});
	const allowKeep = params.allowKeep ?? true;
	const includeManual = params.includeManual ?? true;
	const includeProviderPluginSetups = params.includeProviderPluginSetups ?? false;
	const loadCatalog = params.loadCatalog ?? true;
	const browseCatalogOnDemand = params.browseCatalogOnDemand ?? false;
	const ignoreAllowlist = params.ignoreAllowlist ?? false;
	const preferredProviderRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.preferredProvider);
	const preferredProvider = preferredProviderRaw ? require_model_selection_normalize.normalizeProviderId(preferredProviderRaw) : void 0;
	const configuredRaw = resolveConfiguredModelRaw(cfg);
	const resolved = require_model_selection_shared.resolveConfiguredModelRef({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL,
		allowPluginNormalization: !loadCatalog || browseCatalogOnDemand ? false : void 0
	});
	const resolvedKey = require_model_selection_normalize.modelKey(resolved.provider, resolved.model);
	const configuredKey = configuredRaw ? resolvedKey : "";
	let literalPrefixProvidersCache;
	const resolveCachedLiteralPrefixProviders = async () => {
		if (!literalPrefixProvidersCache) literalPrefixProvidersCache = await resolveLiteralPrefixProviderIds({
			cfg,
			workspaceDir: params.workspaceDir,
			env: params.env
		});
		return literalPrefixProvidersCache;
	};
	const resolveConfiguredDisplayLabel = async () => {
		if (!require_model_selection_normalize.normalizeProviderId(resolved.provider)) return configuredRaw || resolvedKey;
		const literalPrefixProviders = await resolveCachedLiteralPrefixProviders();
		return formatModelRefLabel({
			provider: resolved.provider,
			model: resolved.model,
			key: configuredRaw || resolvedKey,
			literalPrefixProviders
		});
	};
	if (loadCatalog && browseCatalogOnDemand && allowKeep && (!preferredProvider || require_model_selection_normalize.normalizeProviderId(resolved.provider) === preferredProvider)) {
		const configuredLabel = await resolveConfiguredDisplayLabel();
		const options = [{
			value: KEEP_VALUE,
			label: formatKeepCurrentModelLabel({
				configuredRaw,
				configuredLabel,
				resolvedKey
			}),
			hint: configuredRaw && configuredRaw !== resolvedKey ? require_i18n.t("wizard.model.resolvesTo", { value: resolvedKey }) : void 0
		}];
		if (includeManual) options.push({
			value: MANUAL_VALUE,
			label: require_i18n.t("wizard.model.enterManually")
		});
		options.push({
			value: BROWSE_VALUE,
			label: require_i18n.t("wizard.model.browseAll"),
			hint: require_i18n.t("wizard.model.loadsProviderCatalogs")
		});
		const selection = await params.prompter.select({
			message: params.message ?? require_i18n.t("wizard.model.defaultModel"),
			options,
			initialValue: KEEP_VALUE,
			searchable: false
		});
		if (selection === KEEP_VALUE) return {};
		if (selection === MANUAL_VALUE) return promptManualModel({
			prompter: params.prompter,
			allowBlank: false,
			initialValue: configuredRaw || resolvedKey || void 0
		});
		if (selection !== BROWSE_VALUE) return { model: selection };
	}
	if (!loadCatalog) {
		const configuredLabel = await resolveConfiguredDisplayLabel();
		const options = [];
		if (allowKeep) options.push({
			value: KEEP_VALUE,
			label: formatKeepCurrentModelLabel({
				configuredRaw,
				configuredLabel,
				resolvedKey
			}),
			hint: configuredRaw && configuredRaw !== resolvedKey ? require_i18n.t("wizard.model.resolvesTo", { value: resolvedKey }) : void 0
		});
		if (includeManual) options.push({
			value: MANUAL_VALUE,
			label: require_i18n.t("wizard.model.enterManually")
		});
		if (configuredKey && !options.some((option) => option.value === configuredKey)) options.push({
			value: configuredKey,
			label: configuredKey,
			hint: require_i18n.t("wizard.model.current")
		});
		if (options.length === 0) return promptManualModel({
			prompter: params.prompter,
			allowBlank: allowKeep,
			initialValue: configuredRaw || resolvedKey || void 0
		});
		const selection = await params.prompter.select({
			message: params.message ?? require_i18n.t("wizard.model.defaultModel"),
			options,
			initialValue: allowKeep ? KEEP_VALUE : configuredKey || MANUAL_VALUE,
			searchable: false
		});
		if (selection === KEEP_VALUE) return {};
		if (selection === MANUAL_VALUE) return promptManualModel({
			prompter: params.prompter,
			allowBlank: false,
			initialValue: configuredRaw || resolvedKey || void 0
		});
		return { model: selection };
	}
	const catalogProgress = params.prompter.progress(require_i18n.t("wizard.model.loadingModels"));
	let catalogSnapshot;
	try {
		const providerScopedCatalog = browseCatalogOnDemand && preferredProvider;
		catalogSnapshot = await loadPickerModelCatalog(cfg, {
			preferredProvider: providerScopedCatalog ? preferredProvider : void 0,
			preferLiveProviderCatalog: Boolean(providerScopedCatalog),
			providerScoped: Boolean(providerScopedCatalog),
			agentDir: pickerAgentDir,
			...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
			...params.env !== void 0 ? { env: params.env } : {}
		});
	} finally {
		catalogProgress.stop();
	}
	const catalog = catalogSnapshot.entries;
	if (catalog.length === 0) return promptManualModel({
		prompter: params.prompter,
		allowBlank: allowKeep,
		initialValue: configuredRaw || resolvedKey || void 0
	});
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER
	});
	const hasAuth = require_model_provider_auth.createProviderAuthChecker({
		cfg,
		workspaceDir: params.workspaceDir,
		agentDir: pickerAgentDir,
		env: params.env
	});
	const resolveModelRouteRuntime = createModelRouteRuntimeResolver({
		config: cfg,
		env: params.env
	});
	const models = await resolvePickerLogicalCatalog({
		cfg,
		catalog,
		routeVariants: catalogSnapshot.routeVariants,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: resolved.model,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		...ignoreAllowlist ? { view: "all" } : {},
		hasAuth
	});
	if (models.length === 0) return promptManualModel({
		prompter: params.prompter,
		allowBlank: allowKeep,
		initialValue: configuredRaw || resolvedKey || void 0
	});
	const isVisibleProvider = require_model_picker_visibility.createModelPickerVisibleProviderPredicate({
		config: cfg,
		env: params.env,
		includeSetupRegistry: true
	});
	const filteredModels = await maybeFilterModelsByProvider({
		models,
		preferredProvider,
		prompter: params.prompter,
		cfg,
		workspaceDir: params.workspaceDir,
		env: params.env,
		isVisibleProvider
	});
	if (filteredModels.length === 0) return promptManualModel({
		prompter: params.prompter,
		allowBlank: allowKeep,
		initialValue: configuredRaw || resolvedKey || void 0
	});
	const matchesPreferredProvider = preferredProvider ? createPreferredProviderMatcher({
		preferredProvider,
		cfg,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) : void 0;
	const hasPreferredProvider = preferredProvider ? filteredModels.some((entry) => matchesPreferredProvider?.(entry.provider)) : false;
	const literalPrefixProviders = await resolveCachedLiteralPrefixProviders();
	const configuredLabel = formatModelRefLabel({
		provider: resolved.provider,
		model: resolved.model,
		key: configuredRaw || resolvedKey,
		literalPrefixProviders
	});
	const options = [];
	if (allowKeep) options.push({
		value: KEEP_VALUE,
		label: formatKeepCurrentModelLabel({
			configuredRaw,
			configuredLabel,
			resolvedKey
		})
	});
	if (includeManual) options.push({
		value: MANUAL_VALUE,
		label: require_i18n.t("wizard.model.enterManually")
	});
	if (includeProviderPluginSetups && params.agentDir) options.push(...await resolveProviderPluginSetupOptions({
		cfg,
		workspaceDir: params.workspaceDir,
		env: params.env
	}));
	const seen = /* @__PURE__ */ new Set();
	for (const entry of filteredModels) await addModelSelectOption({
		entry,
		options,
		seen,
		aliasIndex,
		hasAuth,
		literalPrefixProviders,
		isVisibleProvider,
		resolveModelRouteRuntime
	});
	if (configuredKey && !seen.has(configuredKey)) options.push({
		value: configuredKey,
		label: configuredLabel,
		hint: require_i18n.t("wizard.model.currentNotInCatalog")
	});
	const firstPreferredModel = preferredProvider && hasPreferredProvider ? filteredModels.find((entry) => matchesPreferredProvider?.(entry.provider)) : void 0;
	const firstPreferredModelKey = firstPreferredModel ? modelCatalogEntryKey(firstPreferredModel) : void 0;
	let initialValue = allowKeep ? KEEP_VALUE : configuredKey || void 0;
	if (!allowKeep && firstPreferredModelKey) initialValue = firstPreferredModelKey;
	else if (allowKeep && firstPreferredModelKey && preferredProvider && !matchesPreferredProvider?.(resolved.provider)) initialValue = firstPreferredModelKey;
	const selectedValue = await params.prompter.select({
		message: params.message ?? require_i18n.t("wizard.model.defaultModel"),
		options,
		initialValue,
		searchable: true
	}) ?? "";
	if (selectedValue === KEEP_VALUE) return {};
	if (selectedValue === MANUAL_VALUE) return promptManualModel({
		prompter: params.prompter,
		allowBlank: false,
		initialValue: configuredRaw || resolvedKey || void 0
	});
	const providerPluginResult = await maybeHandleProviderPluginSelection({
		selection: selectedValue,
		cfg,
		prompter: params.prompter,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		env: params.env,
		runtime: params.runtime
	});
	if (providerPluginResult) return providerPluginResult;
	const model = require_model_input.normalizeAgentModelRefForConfig(selectedValue);
	const { runProviderModelSelectedHook } = await loadResolvedModelPickerRuntime();
	await runProviderModelSelectedHook({
		config: cfg,
		model,
		prompter: params.prompter,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	return { model };
}
async function promptModelAllowlist(params) {
	const cfg = params.config;
	const pickerAgentDir = resolvePickerAgentDir({
		cfg,
		...params.agentDir !== void 0 ? { agentDir: params.agentDir } : {},
		...params.env !== void 0 ? { env: params.env } : {}
	});
	const existingKeys = resolveConfiguredModelKeys(cfg);
	const configuredRaw = resolveConfiguredModelRaw(cfg);
	const allowedKeys = normalizeModelKeys(params.allowedKeys ?? []);
	const allowedKeySet = allowedKeys.length > 0 ? new Set(allowedKeys) : null;
	const preferredProviderRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.preferredProvider);
	const preferredProvider = preferredProviderRaw ? require_model_selection_normalize.normalizeProviderId(preferredProviderRaw) : void 0;
	const resolved = require_model_selection_shared.resolveConfiguredModelRef({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL
	});
	const resolvedKey = require_model_selection_normalize.modelKey(resolved.provider, resolved.model);
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER
	});
	const fallbackAliasIndex = resolved.provider === "openrouter" ? aliasIndex : require_model_selection_shared.buildModelAliasIndex({
		cfg,
		defaultProvider: resolved.provider
	});
	const fallbackKeys = resolveFallbackModelKeys({
		cfg,
		rawFallbacks: require_model_input.resolveAgentModelFallbackValues(cfg.agents?.defaults?.model),
		defaultProvider: resolved.provider,
		aliasIndex: fallbackAliasIndex
	});
	const initialSeeds = normalizeModelKeys([
		...existingKeys,
		resolvedKey,
		...fallbackKeys,
		...params.initialSelections ?? []
	]);
	const hasRealSeed = existingKeys.length > 0 || fallbackKeys.length > 0 || (params.initialSelections?.length ?? 0) > 0 || configuredRaw.length > 0;
	const hasAuth = require_model_provider_auth.createProviderAuthChecker({
		cfg,
		workspaceDir: params.workspaceDir,
		agentDir: pickerAgentDir,
		env: params.env
	});
	const resolveModelRouteRuntime = createModelRouteRuntimeResolver({
		config: cfg,
		env: params.env
	});
	const matchesPreferredProvider = preferredProvider ? createPreferredProviderMatcher({
		preferredProvider,
		cfg,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) : void 0;
	const loadCatalog = params.loadCatalog ?? true;
	const scopedFastKeys = allowedKeys.length > 0 ? allowedKeys : !loadCatalog && preferredProvider && hasRealSeed ? initialSeeds.filter((key) => {
		const entry = splitModelKey(key);
		return entry ? matchesPreferredProvider?.(entry.provider) === true : false;
	}) : [];
	if (scopedFastKeys.length > 0) {
		const isVisibleProvider = require_model_picker_visibility.createModelPickerVisibleProviderPredicate({
			config: cfg,
			env: params.env,
			includeSetupRegistry: true
		});
		const scopeKeys = allowedKeys.length > 0 ? allowedKeys : scopedFastKeys;
		const scopeKeySet = new Set(scopeKeys);
		const initialKeys = normalizeModelKeys(initialSeeds.filter((key) => scopeKeySet.has(key)));
		const options = [];
		const seen = /* @__PURE__ */ new Set();
		for (const key of scopeKeys) await addModelKeySelectOption({
			key,
			options,
			seen,
			aliasIndex,
			hasAuth,
			isVisibleProvider,
			resolveModelRouteRuntime,
			fallbackHint: allowedKeys.length > 0 ? require_i18n.t("wizard.model.allowed") : require_i18n.t("wizard.model.configured")
		});
		if (options.length === 0) return {};
		const selected = normalizeModelKeys(await params.prompter.multiselect({
			message: params.message ?? require_i18n.t("wizard.model.allowlistPicker"),
			options,
			initialValues: initialKeys.length > 0 ? initialKeys : void 0,
			searchable: true
		}));
		if (selected.length > 0) return {
			models: selected,
			scopeKeys
		};
		if (!await params.prompter.confirm({
			message: require_i18n.t("wizard.model.removeProviderModels"),
			initialValue: false
		})) return {};
		return {
			models: [],
			scopeKeys
		};
	}
	if (!loadCatalog) return {};
	const allowlistProgress = params.prompter.progress(require_i18n.t("wizard.model.loadingModels"));
	let catalogSnapshot;
	try {
		catalogSnapshot = await loadPickerModelCatalog(cfg, {
			preferredProvider,
			preferLiveProviderCatalog: Boolean(preferredProvider),
			providerScoped: Boolean(preferredProvider && params.providerScopedCatalog),
			allowStaticFallbackCatalog: !params.providerScopedCatalog,
			agentDir: pickerAgentDir,
			...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
			...params.env !== void 0 ? { env: params.env } : {}
		});
	} finally {
		allowlistProgress.stop();
	}
	let catalog = catalogSnapshot.entries;
	let providerStaticCatalogRows;
	const loadProviderStaticCatalogRows = () => providerStaticCatalogRows ??= preferredProvider ? loadStaticManifestCatalogRowsForList({
		cfg,
		providerFilter: preferredProvider,
		...params.env !== void 0 ? { env: params.env } : {}
	}) : [];
	const providerScopedCatalogLoaded = Boolean(preferredProvider && params.providerScopedCatalog && catalog.length > 0);
	if (providerScopedCatalogLoaded) {
		const deprecatedStaticKeys = new Set(loadProviderStaticCatalogRows().filter((entry) => entry.status === "deprecated").map((entry) => require_model_selection_normalize.modelKey(entry.provider, entry.id)));
		if (deprecatedStaticKeys.size > 0) catalog = catalog.filter((entry) => !deprecatedStaticKeys.has(require_model_selection_normalize.modelKey(entry.provider, entry.id)));
	}
	if (preferredProvider) {
		let configuredCatalog = require_model_selection_shared.buildConfiguredModelCatalog({ cfg }).filter((entry) => matchesPreferredProvider?.(entry.provider) === true);
		if (providerScopedCatalogLoaded && configuredCatalog.length > 0) {
			const staticKeys = new Set(loadProviderStaticCatalogRows().map((entry) => require_model_selection_normalize.modelKey(entry.provider, entry.id)));
			configuredCatalog = configuredCatalog.filter((entry) => !staticKeys.has(require_model_selection_normalize.modelKey(entry.provider, entry.id)));
		}
		const catalogKeys = new Set(catalog.map((entry) => require_model_selection_normalize.modelKey(entry.provider, entry.id)));
		const mergedCatalog = [...catalog];
		for (const entry of configuredCatalog) {
			const key = require_model_selection_normalize.modelKey(entry.provider, entry.id);
			if (catalogKeys.has(key)) continue;
			catalogKeys.add(key);
			mergedCatalog.push(entry);
		}
		catalog = mergedCatalog;
	}
	catalog = await resolvePickerLogicalCatalog({
		cfg,
		catalog,
		routeVariants: catalogSnapshot.routeVariants,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: resolved.model,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		view: "all",
		hasAuth
	});
	if (catalog.length === 0 && allowedKeys.length === 0) {
		const noCatalogInitialKeys = existingKeys.length > 0 ? normalizeModelKeys([...existingKeys, ...fallbackKeys]) : [];
		const parsed = (await params.prompter.text({
			message: params.message ?? require_i18n.t("wizard.model.allowlistText"),
			initialValue: noCatalogInitialKeys.join(", "),
			placeholder: "provider/model, other-provider/model"
		}) ?? "").split(",").map((value) => value.trim()).filter((value) => value.length > 0);
		if (parsed.length === 0) return {};
		return { models: normalizeModelKeys(parsed) };
	}
	const literalPrefixProviders = await resolveLiteralPrefixProviderIds({
		cfg,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	const isVisibleProvider = require_model_picker_visibility.createModelPickerVisibleProviderPredicate({
		config: cfg,
		env: params.env,
		includeSetupRegistry: true
	});
	const isVisibleModelRef = (ref) => {
		const separatorIndex = ref.indexOf("/");
		return separatorIndex <= 0 || isVisibleProvider(ref.slice(0, separatorIndex));
	};
	const options = [];
	const seen = /* @__PURE__ */ new Set();
	const allowedCatalog = (allowedKeySet ? catalog.filter((entry) => allowedKeySet.has(require_model_selection_normalize.modelKey(entry.provider, entry.id))) : catalog).filter((entry) => isVisibleProvider(entry.provider));
	const filteredCatalog = preferredProvider && allowedCatalog.some((entry) => matchesPreferredProvider?.(entry.provider)) ? allowedCatalog.filter((entry) => matchesPreferredProvider?.(entry.provider)) : allowedCatalog;
	const scopedConfiguredKeys = preferredProvider && !allowedKeySet ? existingKeys.filter((key) => {
		if (!isVisibleModelRef(key)) return false;
		const entry = splitModelKey(key);
		return entry ? matchesPreferredProvider?.(entry.provider) === true : false;
	}) : [];
	const scopeKeys = allowedKeySet ? allowedKeys : preferredProvider ? normalizeModelKeys([...filteredCatalog.map((entry) => require_model_selection_normalize.modelKey(entry.provider, entry.id)), ...scopedConfiguredKeys]) : void 0;
	const scopeKeySet = scopeKeys ? new Set(scopeKeys) : null;
	const selectableInitialSeeds = scopeKeySet && !allowedKeySet ? initialSeeds.filter((key) => scopeKeySet.has(key)) : initialSeeds;
	const initialKeys = allowedKeySet ? initialSeeds.filter((key) => allowedKeySet.has(key)) : selectableInitialSeeds.filter(isVisibleModelRef);
	for (const entry of filteredCatalog) await addModelSelectOption({
		entry,
		options,
		seen,
		aliasIndex,
		hasAuth,
		literalPrefixProviders,
		isVisibleProvider,
		resolveModelRouteRuntime
	});
	const supplementalKeys = (allowedKeySet ? allowedKeys : selectableInitialSeeds).filter(isVisibleModelRef);
	for (const key of supplementalKeys) {
		if (seen.has(key)) continue;
		options.push({
			value: key,
			label: key,
			hint: allowedKeySet ? require_i18n.t("wizard.model.allowedNotInCatalog") : require_i18n.t("wizard.model.configuredNotInCatalog")
		});
		seen.add(key);
	}
	if (options.length === 0) return {};
	const selected = normalizeModelKeys(await params.prompter.multiselect({
		message: params.message ?? require_i18n.t("wizard.model.allowlistPicker"),
		options,
		initialValues: initialKeys.length > 0 ? initialKeys : void 0,
		searchable: true
	}));
	if (selected.length > 0) return {
		models: selected,
		...scopeKeys ? { scopeKeys } : {}
	};
	if (scopeKeys) {
		if (!await params.prompter.confirm({
			message: require_i18n.t("wizard.model.removeProviderModels"),
			initialValue: false
		})) return {};
		return {
			models: [],
			scopeKeys
		};
	}
	if (existingKeys.length === 0) return { models: [] };
	if (!await params.prompter.confirm({
		message: require_i18n.t("wizard.model.clearAllowlist"),
		initialValue: false
	})) return {};
	return { models: [] };
}
function applyModelAllowlist(cfg, models, opts = {}) {
	const defaults = cfg.agents?.defaults;
	const normalized = normalizeModelKeys(models);
	const scopeKeys = opts.scopeKeys ? normalizeModelKeys(opts.scopeKeys) : [];
	const scopeKeySet = scopeKeys.length > 0 ? new Set(scopeKeys) : null;
	if (normalized.length === 0) {
		if (!defaults?.models) return cfg;
		if (scopeKeySet) {
			const nextModels = { ...defaults.models };
			for (const key of scopeKeySet) delete nextModels[key];
			const { models: _ignored, ...restDefaults } = defaults;
			return {
				...cfg,
				agents: {
					...cfg.agents,
					defaults: Object.keys(nextModels).length > 0 ? {
						...defaults,
						models: nextModels
					} : restDefaults
				}
			};
		}
		const { models: _ignored, ...restDefaults } = defaults;
		return {
			...cfg,
			agents: {
				...cfg.agents,
				defaults: restDefaults
			}
		};
	}
	const existingModels = require_model_input.normalizeAgentModelMapForConfig(defaults?.models ?? {});
	if (scopeKeySet) {
		const nextModels = { ...existingModels };
		for (const key of scopeKeySet) delete nextModels[key];
		for (const key of normalized) nextModels[key] = existingModels[key] ?? {};
		return {
			...cfg,
			agents: {
				...cfg.agents,
				defaults: {
					...defaults,
					models: nextModels
				}
			}
		};
	}
	const nextModels = {};
	for (const key of normalized) nextModels[key] = existingModels[key] ?? {};
	return {
		...cfg,
		agents: {
			...cfg.agents,
			defaults: {
				...defaults,
				models: nextModels
			}
		}
	};
}
function applyModelFallbacksFromSelection(cfg, selection, opts = {}) {
	const normalized = normalizeModelKeys(selection);
	const scopeKeys = opts.scopeKeys ? normalizeModelKeys(opts.scopeKeys) : [];
	const scopeKeySet = scopeKeys.length > 0 ? new Set(scopeKeys) : null;
	if (normalized.length === 0 && !scopeKeySet) return cfg;
	const resolved = require_model_selection_shared.resolveConfiguredModelRef({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL
	});
	const resolvedKey = require_model_selection_normalize.modelKey(resolved.provider, resolved.model);
	const includesResolvedPrimary = normalized.includes(resolvedKey);
	if (!includesResolvedPrimary && !scopeKeySet) return cfg;
	const defaults = cfg.agents?.defaults;
	const existingModel = defaults?.model;
	const existingPrimary = typeof existingModel === "string" ? existingModel : existingModel && typeof existingModel === "object" ? existingModel.primary : void 0;
	const normalizedExistingPrimary = existingPrimary != null ? require_model_input.normalizeAgentModelRefForConfig(existingPrimary) : void 0;
	const preservedModelFields = existingModel && typeof existingModel === "object" ? (({ fallbacks: _oldFallbacks, ...rest }) => rest)(existingModel) : {};
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg,
		defaultProvider: resolved.provider
	});
	const existingFallbacks = existingModel && typeof existingModel === "object" && Array.isArray(existingModel.fallbacks) ? resolveFallbackModelKeys({
		cfg,
		rawFallbacks: existingModel.fallbacks,
		defaultProvider: resolved.provider,
		aliasIndex
	}) : [];
	const existingFallbackSet = new Set(existingFallbacks);
	const rawSelectedFallbacks = normalized.filter((key) => key !== resolvedKey);
	const selectedFallbacks = scopeKeySet && !includesResolvedPrimary ? rawSelectedFallbacks.filter((key) => existingFallbackSet.has(key)) : rawSelectedFallbacks;
	const isVisibleProvider = require_model_picker_visibility.createModelPickerVisibleProviderPredicate({
		config: cfg,
		includeSetupRegistry: true
	});
	const isVisibleModelRef = (ref) => {
		const separatorIndex = ref.indexOf("/");
		return separatorIndex <= 0 || isVisibleProvider(ref.slice(0, separatorIndex));
	};
	const fallbacks = mergeFallbackSelection({
		existingFallbacks,
		selectedFallbacks,
		preserveExistingFallback: scopeKeySet ? (fallback) => !scopeKeySet.has(fallback) : (fallback) => !isVisibleModelRef(fallback)
	});
	const nextModel = {
		...preservedModelFields,
		...normalizedExistingPrimary != null ? { primary: normalizedExistingPrimary } : {},
		...fallbacks.length > 0 ? { fallbacks } : {}
	};
	if (Object.keys(nextModel).length === 0) {
		if (!defaults || !Object.hasOwn(defaults, "model")) return cfg;
		const { model: _ignoredModel, ...restDefaults } = defaults;
		return {
			...cfg,
			agents: {
				...cfg.agents,
				defaults: restDefaults
			}
		};
	}
	return {
		...cfg,
		agents: {
			...cfg.agents,
			defaults: {
				...defaults,
				model: nextModel
			}
		}
	};
}
function mergeFallbackSelection(params) {
	const selected = new Set(params.selectedFallbacks);
	const fallbacks = [];
	for (const fallback of params.existingFallbacks) {
		if (params.preserveExistingFallback(fallback)) {
			fallbacks.push(fallback);
			continue;
		}
		if (selected.delete(fallback)) fallbacks.push(fallback);
	}
	for (const fallback of params.selectedFallbacks) if (selected.has(fallback)) fallbacks.push(fallback);
	return fallbacks;
}
//#endregion
exports.applyModelAllowlist = applyModelAllowlist;
exports.applyModelFallbacksFromSelection = applyModelFallbacksFromSelection;
exports.applyPrimaryModel = require_provider_model_primary.applyPrimaryModel;
exports.promptDefaultModel = promptDefaultModel;
exports.promptModelAllowlist = promptModelAllowlist;
