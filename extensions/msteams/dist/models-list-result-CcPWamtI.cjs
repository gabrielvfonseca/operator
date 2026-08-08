require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
require("./workspace-oX0zfOZq.cjs");
require("./config-DT0qiglW.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_model_visibility_policy = require("./model-visibility-policy-BAqBH6Uw.cjs");
const require_provider_auth_choices = require("./provider-auth-choices-Dr0zOwrP.cjs");
const require_model_auth_availability = require("./model-auth-availability-CbaVu2uQ.cjs");
const require_model_catalog_browse = require("./model-catalog-browse-CLWkIZaN.cjs");
const require_model_catalog_visibility = require("./model-catalog-visibility-DGu1_zhC.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/gateway/server-methods/models-list-result.ts
let loggedSlowModelsListCatalog = false;
function resolveModelsListView(params) {
	const view = params.view;
	return view === "configured" || view === "provider-config" || view === "all" ? view : "default";
}
function resolvePositiveSafeInteger(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : void 0;
}
function buildPublicModelProjection(entry) {
	const contextWindow = resolvePositiveSafeInteger(entry.contextWindow);
	return {
		id: entry.id,
		name: entry.name,
		provider: entry.provider,
		...entry.alias ? { alias: entry.alias } : {},
		...contextWindow ? { contextWindow } : {},
		...typeof entry.reasoning === "boolean" ? { reasoning: entry.reasoning } : {}
	};
}
function resolveModelChoiceAgentRuntime(params) {
	const harnessPolicy = require_policy.resolveAgentHarnessPolicy({
		provider: params.entry.provider,
		modelId: params.entry.id,
		modelApi: params.entry.api,
		modelBaseUrl: params.entry.baseUrl,
		config: params.cfg,
		agentId: params.agentId
	});
	if (harnessPolicy.runtime === "auto") return;
	return {
		id: harnessPolicy.runtime,
		source: harnessPolicy.runtimeSource ?? "implicit"
	};
}
function listEnabledSyntheticAuthProviderRefs(params) {
	const result = require_plugin_registry.loadPluginRegistrySnapshotWithMetadata({
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env: process.env
	});
	if (result.source !== "persisted" && result.source !== "provided") return [];
	return result.snapshot.plugins.filter((plugin) => plugin.enabled).flatMap((plugin) => plugin.syntheticAuthRefs ?? []);
}
function createModelsListAuthResolver(params) {
	const agentDir = require_agent_scope_config.resolveAgentDir(params.cfg, params.agentId);
	const authStore = require_store.loadAuthProfileStoreWithoutExternalProfiles(agentDir, { allowKeychainPrompt: false });
	return require_model_auth_availability.createModelAuthAvailabilityResolver({
		cfg: params.cfg,
		authStore,
		agentDir,
		workspaceDir: params.workspaceDir,
		env: process.env,
		skipSetupProviderFallback: true,
		syntheticAuthProviderRefs: listEnabledSyntheticAuthProviderRefs(params),
		externalCliProviderIds: params.includeOpenAIExternalProfiles ? ["openai"] : [],
		routeResolverFactory: params.routeResolverFactory
	});
}
function resolveLegacyEntryAvailability(params) {
	if (params.primaryAvailability === true) return true;
	let available = params.primaryAvailability;
	const runtimeProvider = require_model_runtime_aliases.resolveCliRuntimeExecutionProvider({
		provider: params.entry.provider,
		cfg: params.cfg,
		agentId: params.agentId,
		modelId: params.entry.id
	});
	if (runtimeProvider && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(runtimeProvider) !== (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.entry.provider)) {
		const runtimeAvailable = params.authResolver.resolveProviderAuthAvailability(runtimeProvider);
		if (runtimeAvailable === true) return true;
		if (available === false && runtimeAvailable === void 0) available = void 0;
	}
	return available;
}
function createModelsListEntryEvaluator(params) {
	const pending = /* @__PURE__ */ new Map();
	return (entry, routeVariants = [entry]) => {
		const identity = require_openai_routing.openAIModelCatalogRoutePolicy.resolveIdentity(entry);
		const cacheKey = resolveGatewayModelCatalogRouteKey(entry);
		const cached = pending.get(cacheKey);
		if (cached) return cached;
		const next = Promise.resolve().then(() => {
			const evaluation = params.authResolver.evaluateModelAuth(entry.provider, {
				modelId: identity?.id ?? entry.id,
				...params.preferredProfileId ? { preferredProfileId: params.preferredProfileId } : {},
				...params.lockedProfileId ? { lockedProfileId: params.lockedProfileId } : {},
				observedRoutes: routeVariants.map((variant) => ({
					api: variant.api,
					baseUrl: variant.baseUrl
				}))
			});
			return evaluation.routeResolution === null && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) !== "openai" ? {
				...evaluation,
				availability: resolveLegacyEntryAvailability({
					authResolver: params.authResolver,
					entry,
					primaryAvailability: evaluation.availability,
					cfg: params.cfg,
					agentId: params.agentId
				})
			} : evaluation;
		});
		pending.set(cacheKey, next);
		return next;
	};
}
function resolveGatewayModelCatalogRouteKey(entry) {
	return require_openai_routing.openAIModelCatalogRoutePolicy.resolveIdentity(entry)?.key ?? `${(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider)}/${entry.id}`;
}
function resolveProviderConfigInventoryEntries(params) {
	const canonicalByKey = /* @__PURE__ */ new Map();
	for (const entry of params.canonicalEntries) {
		const key = resolveGatewayModelCatalogRouteKey(entry);
		if (!canonicalByKey.has(key)) canonicalByKey.set(key, entry);
	}
	const seen = /* @__PURE__ */ new Set();
	const inventory = [];
	for (const authoredEntry of params.authoredEntries) {
		const key = resolveGatewayModelCatalogRouteKey(authoredEntry);
		if (seen.has(key)) continue;
		seen.add(key);
		inventory.push(canonicalByKey.get(key) ?? authoredEntry);
	}
	return inventory;
}
/** Builds one per-agent, snapshot-scoped route projection for Gateway thinking metadata. */
function createGatewayAgentModelCatalogProjector(params) {
	const defaultModel = require_agent_scope.resolveAgentEffectiveModelPrimary(params.cfg, params.agentId);
	const visibilityPolicy = require_model_visibility_policy.createModelVisibilityPolicy({
		cfg: params.cfg,
		catalog: params.snapshot.entries,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel,
		agentId: params.agentId,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.cfg, params.agentId) ?? require_agent_scope_config.resolveDefaultAgentWorkspaceDir();
	const projectionCatalog = params.snapshot.routeVariants.length > 0 ? params.snapshot.routeVariants : params.snapshot.entries;
	const routeVariantsByKey = /* @__PURE__ */ new Map();
	for (const entry of projectionCatalog) {
		const key = resolveGatewayModelCatalogRouteKey(entry);
		const variants = routeVariantsByKey.get(key) ?? [];
		variants.push(entry);
		routeVariantsByKey.set(key, variants);
	}
	const resolveRouteVariants = (entry) => routeVariantsByKey.get(resolveGatewayModelCatalogRouteKey(entry)) ?? [entry];
	const logicalEntries = [];
	const logicalEntryKeys = /* @__PURE__ */ new Set();
	for (const entry of params.snapshot.entries) {
		const key = resolveGatewayModelCatalogRouteKey(entry);
		if (!logicalEntryKeys.has(key)) {
			logicalEntryKeys.add(key);
			logicalEntries.push(entry);
		}
	}
	const authResolver = createModelsListAuthResolver({
		cfg: params.cfg,
		agentId: params.agentId,
		includeOpenAIExternalProfiles: projectionCatalog.some((entry) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) === "openai") || [...visibilityPolicy.configuredKeys].some((key) => key.startsWith("openai/")),
		workspaceDir,
		routeResolverFactory: params.routeResolverFactory
	});
	const evaluateEntry = createModelsListEntryEvaluator({
		cfg: params.cfg,
		agentId: params.agentId,
		authResolver,
		...params.preferredProfileId ? { preferredProfileId: params.preferredProfileId } : {},
		...params.lockedProfileId ? { lockedProfileId: params.lockedProfileId } : {}
	});
	let projectedCatalog;
	return {
		evaluateEntry,
		projectCatalog: () => projectedCatalog ??= Promise.all(logicalEntries.map(async (entry) => {
			const routeVariants = resolveRouteVariants(entry);
			const state = require_model_catalog_visibility.resolveLogicalModelCatalogEntryState({
				entry,
				evaluation: await evaluateEntry(entry, routeVariants),
				routePolicy: require_openai_routing.openAIModelCatalogRoutePolicy
			});
			const overrides = require_model_catalog_visibility.resolveConfiguredModelCatalogOverrides({
				cfg: params.cfg,
				entry,
				policy: require_openai_routing.openAIModelCatalogRoutePolicy
			});
			const projected = require_model_catalog_visibility.projectModelCatalogEntryForRoute({
				entry,
				projection: state.routeProjection,
				catalog: routeVariants,
				...overrides ? { overrides } : {}
			});
			if (state.routeProjection.kind !== "selected") return projected;
			const donor = require_model_catalog_visibility.findModelCatalogRouteDonor({
				entry,
				route: state.routeProjection.route,
				policy: require_openai_routing.openAIModelCatalogRoutePolicy,
				catalog: routeVariants
			});
			if (donor && Object.hasOwn(donor, "compat")) projected.compat = donor.compat;
			if (donor && Object.hasOwn(donor, "params")) projected.params = donor.params;
			return projected;
		}))
	};
}
async function buildPublicModelsListEntries(params) {
	return await Promise.all(params.catalog.map(async (entry) => {
		const evaluation = await params.evaluateEntry(entry);
		const publicEntry = buildPublicModelProjection(entry);
		const syntheticLocalAvailable = evaluation.availability === void 0 && evaluation.routeResolution === null && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) !== "openai" && require_model_auth.hasSyntheticLocalProviderAuthConfig({
			cfg: params.cfg,
			provider: entry.provider
		});
		const available = evaluation.availability ?? (syntheticLocalAvailable ? true : void 0);
		const capabilityProvider = params.apiKeyCapabilities?.resolveProvider(entry.provider);
		const agentRuntime = resolveModelChoiceAgentRuntime({
			cfg: params.cfg,
			agentId: params.agentId,
			entry
		});
		return {
			...publicEntry,
			...agentRuntime ? { agentRuntime } : {},
			...capabilityProvider && params.apiKeyCapabilities?.providers.has(capabilityProvider) ? { apiKeySupported: params.apiKeyCapabilities.providers.get(capabilityProvider) === true } : {},
			...params.includeInput && entry.input?.length ? { input: entry.input } : {},
			...params.preserveUnknownAvailability && available === void 0 ? {} : { available: available ?? false }
		};
	}));
}
function apiKeyProviderCapabilities(params) {
	const capabilities = /* @__PURE__ */ new Map();
	const resolveProvider = (provider) => require_provider_auth_aliases.resolveProviderIdForAuth(provider, {
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env: process.env,
		includeUntrustedWorkspacePlugins: false
	});
	for (const choice of require_provider_auth_choices.resolveManifestProviderAuthChoices({
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		env: process.env,
		includeUntrustedWorkspacePlugins: false
	})) {
		const provider = resolveProvider(choice.providerId);
		capabilities.set(provider, capabilities.get(provider) === true || choice.methodId === "api-key");
	}
	return {
		providers: capabilities,
		resolveProvider
	};
}
async function buildModelsListResult(params) {
	const cfg = params.context.getRuntimeConfig();
	const agentId = params.agentId ?? require_agent_scope_config.resolveDefaultAgentId(cfg);
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(cfg, agentId) ?? require_agent_scope_config.resolveDefaultAgentWorkspaceDir();
	const view = resolveModelsListView(params.params);
	const snapshot = await require_model_catalog_browse.loadModelCatalogSnapshotForBrowse({
		cfg,
		view,
		loadCatalog: async (loadParams) => {
			const readOnlyLoad = loadParams.readOnly ?? true;
			if (params.preloadedCatalog && readOnlyLoad) return params.preloadedCatalog;
			return await params.context.loadGatewayModelCatalogSnapshot(loadParams);
		},
		onTimeout: (timeoutMs) => {
			if (loggedSlowModelsListCatalog) return;
			loggedSlowModelsListCatalog = true;
			params.context.logGateway.debug(`models.list continuing without model catalog after ${timeoutMs}ms`);
		}
	});
	const catalog = snapshot.entries;
	const routeVariants = snapshot.routeVariants;
	const capableProviders = params.params.includeProviderCapabilities === true ? apiKeyProviderCapabilities({
		cfg,
		workspaceDir
	}) : void 0;
	if (view === "provider-config") {
		const inventoryProjector = createGatewayAgentModelCatalogProjector({
			cfg,
			agentId,
			snapshot: {
				entries: resolveProviderConfigInventoryEntries({
					authoredEntries: require_model_catalog_browse.buildProviderConfigModelCatalogForBrowse({
						cfg: require_runtime_snapshot.getRuntimeConfigSourceSnapshot() ?? cfg,
						workspaceDir
					}),
					canonicalEntries: catalog
				}),
				routeVariants
			},
			...params.routeResolverFactory ? { routeResolverFactory: params.routeResolverFactory } : {}
		});
		return { models: await buildPublicModelsListEntries({
			catalog: await inventoryProjector.projectCatalog(),
			cfg,
			agentId,
			evaluateEntry: inventoryProjector.evaluateEntry,
			includeInput: true,
			preserveUnknownAvailability: true,
			...capableProviders ? { apiKeyCapabilities: capableProviders } : {}
		}) };
	}
	const defaultModel = require_agent_scope.resolveAgentEffectiveModelPrimary(cfg, agentId);
	const visibilityPolicy = require_model_visibility_policy.createModelVisibilityPolicy({
		cfg,
		catalog,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel,
		agentId,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	const evaluateEntry = params.catalogProjector?.evaluateEntry ?? createModelsListEntryEvaluator({
		cfg,
		agentId,
		authResolver: createModelsListAuthResolver({
			cfg,
			agentId,
			includeOpenAIExternalProfiles: catalog.some((entry) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) === "openai") || [...visibilityPolicy.configuredKeys].some((key) => key.startsWith("openai/")),
			workspaceDir,
			routeResolverFactory: params.routeResolverFactory
		})
	});
	return { models: await buildPublicModelsListEntries({
		catalog: await require_model_catalog_visibility.resolveLogicalVisibleModelCatalog({
			cfg,
			catalog,
			defaultProvider: require_defaults.DEFAULT_PROVIDER,
			defaultModel,
			agentId,
			workspaceDir,
			view,
			policy: visibilityPolicy,
			routePolicy: require_openai_routing.openAIModelCatalogRoutePolicy,
			routeVariants,
			evaluateEntry: async (entry, variants) => {
				const evaluation = await evaluateEntry(entry, variants);
				const syntheticLocal = !(evaluation.routeResolution !== null) && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) !== "openai" && evaluation.availability === void 0 && evaluation.evidence === "synthetic";
				return require_model_catalog_visibility.resolveLogicalModelCatalogEntryState({
					entry,
					evaluation,
					authBacked: evaluation.availability === true || syntheticLocal,
					routePolicy: require_openai_routing.openAIModelCatalogRoutePolicy
				});
			}
		}),
		cfg,
		agentId,
		evaluateEntry,
		...capableProviders ? { apiKeyCapabilities: capableProviders } : {}
	}) };
}
//#endregion
exports.buildModelsListResult = buildModelsListResult;
exports.createGatewayAgentModelCatalogProjector = createGatewayAgentModelCatalogProjector;
