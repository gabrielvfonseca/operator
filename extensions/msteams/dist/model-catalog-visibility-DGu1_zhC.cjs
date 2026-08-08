const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_model_visibility_policy = require("./model-visibility-policy-BAqBH6Uw.cjs");
const require_model_provider_auth = require("./model-provider-auth-Bk7aSJ7D.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/agents/model-catalog-route.ts
/** Projects physical catalog rows for browse/presentation; never runtime execution. */
function normalizeExactModelId(value) {
	return require_model_ref_profile.splitTrailingAuthProfile(value).model.trim().toLowerCase();
}
/** Reads explicit logical capability overrides without re-resolving auth. */
function resolveConfiguredModelCatalogOverrides(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.entry.provider);
	const providerConfig = require_openai_routing.resolveMergedModelProviderConfig(params.cfg, provider);
	if (!providerConfig) return;
	const configuredIdentity = params.policy?.resolveIdentity(params.entry);
	const normalizeConfiguredModelId = (modelId) => params.policy?.resolveIdentity({
		provider: params.entry.provider,
		id: modelId
	})?.key ?? normalizeExactModelId(modelId);
	const model = require_openai_routing.resolveMergedModelProviderModels({
		models: providerConfig.models,
		normalizeModelId: normalizeConfiguredModelId
	}).get(configuredIdentity?.key ?? normalizeExactModelId(params.entry.id));
	const overrides = {
		...model?.name ? { name: model.name } : {},
		...model?.contextWindow !== void 0 ? { contextWindow: model.contextWindow } : providerConfig.contextWindow !== void 0 ? { contextWindow: providerConfig.contextWindow } : {},
		...model?.contextTokens !== void 0 ? { contextTokens: model.contextTokens } : providerConfig.contextTokens !== void 0 ? { contextTokens: providerConfig.contextTokens } : {},
		...model?.reasoning !== void 0 ? { reasoning: model.reasoning } : {},
		...model?.input !== void 0 ? { input: model.input } : {}
	};
	return Object.keys(overrides).length > 0 ? overrides : void 0;
}
function sameLogicalModel(a, identity, policy) {
	return policy.resolveIdentity(a)?.key === identity.key;
}
function logicalIdentity(entry, id, name) {
	return {
		id,
		name: name ?? id,
		provider: entry.provider,
		...entry.alias ? { alias: entry.alias } : {}
	};
}
function applyLogicalOverrides(entry, overrides) {
	return overrides ? {
		...entry,
		...overrides
	} : entry;
}
/** Finds the exact physical row that supplied a selected provider route. */
function findModelCatalogRouteDonor(params) {
	const identity = params.policy.resolveIdentity(params.entry);
	const physicalDonor = identity ? params.catalog?.find((candidate) => sameLogicalModel(candidate, identity, params.policy) && params.policy.matchesRoute(candidate, params.route)) : void 0;
	if (physicalDonor) return physicalDonor;
	return params.policy.matchesRoute(params.entry, params.route) ? params.entry : void 0;
}
/**
* Builds one allowlisted logical catalog row.
*
* Selected-route capabilities come only from a physical row accepted by the
* provider-owned matcher. Unresolved managed routes expose identity only.
* Auth, runtime, request overrides, and other private transport facts never
* enter the returned catalog shape.
*/
function projectModelCatalogEntryForRoute(params) {
	if (params.projection.kind === "unmanaged") return params.entry;
	const identity = params.projection.policy.resolveIdentity(params.entry) ?? {
		id: require_model_ref_profile.splitTrailingAuthProfile(params.entry.id).model,
		key: `${(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.entry.provider)}/${normalizeExactModelId(params.entry.id)}`
	};
	if (params.projection.kind === "unresolved") return applyLogicalOverrides(logicalIdentity(params.entry, identity.id, params.entry.name), params.overrides);
	const { policy, route } = params.projection;
	const donor = findModelCatalogRouteDonor({
		entry: params.entry,
		route,
		policy,
		catalog: params.catalog
	});
	return applyLogicalOverrides({
		...logicalIdentity(params.entry, identity.id, donor?.name ?? params.entry.name),
		api: route.api,
		baseUrl: route.baseUrl,
		...donor?.contextWindow !== void 0 ? { contextWindow: donor.contextWindow } : {},
		...donor?.contextTokens !== void 0 ? { contextTokens: donor.contextTokens } : {},
		...donor?.reasoning !== void 0 ? { reasoning: donor.reasoning } : {},
		...donor?.input !== void 0 ? { input: donor.input } : {}
	}, params.overrides);
}
//#endregion
//#region src/agents/model-catalog-visibility.ts
/**
* Resolves model catalog entries visible to browse/UI surfaces. Visibility
* combines explicit policy, configured models, defaults, and runtime
* auth-backed availability.
*/
/** Maps one shared auth evaluation into logical catalog selection state. */
function resolveLogicalModelCatalogEntryState(params) {
	const routeManaged = params.evaluation.routeResolution !== null;
	const selectedRoute = params.evaluation.selectedRoute;
	const routeProjection = !routeManaged ? { kind: "unmanaged" } : selectedRoute ? {
		kind: "selected",
		route: selectedRoute,
		policy: params.routePolicy
	} : {
		kind: "unresolved",
		policy: params.routePolicy
	};
	return {
		authBacked: params.authBacked ?? params.evaluation.availability === true,
		compatible: params.evaluation.routeResolution?.kind !== "incompatible",
		preferred: selectedRoute ? params.routePolicy.matchesRoute(params.entry, selectedRoute) : false,
		routeManaged,
		routeProjection
	};
}
async function modelCatalogEntryHasProviderAuth(providerAuthChecker, entry) {
	return await providerAuthChecker(entry.provider, {
		modelId: entry.id,
		api: entry.api,
		baseUrl: entry.baseUrl
	});
}
function sortModelCatalogEntries(entries) {
	return entries.toSorted((a, b) => a.provider.localeCompare(b.provider) || a.id.localeCompare(b.id));
}
function resolveLogicalKey(entry, routePolicy) {
	return routePolicy.resolveIdentity(entry)?.key ?? require_model_selection_shared.modelCatalogLogicalKey(entry);
}
function dedupeLogicalModelCatalogEntries(entries, routePolicy) {
	const seen = /* @__PURE__ */ new Set();
	return entries.filter((entry) => {
		const key = resolveLogicalKey(entry, routePolicy);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
async function resolveVisibleModelCatalogWithPolicy(params, policy) {
	if (params.view === "all") return params.catalog;
	const buildDefaultVisibleCatalog = async () => {
		const configuredCatalog = sortModelCatalogEntries(require_model_selection_shared.buildConfiguredModelCatalog({ cfg: params.cfg }));
		let checkEntryAuth = params.entryAuthChecker;
		if (!checkEntryAuth) {
			const providerAuthChecker = params.providerAuthChecker ?? require_model_provider_auth.createProviderAuthChecker({
				cfg: params.cfg,
				workspaceDir: params.workspaceDir,
				agentDir: params.agentDir,
				agentId: params.agentId,
				env: params.env,
				allowPluginSyntheticAuth: params.runtimeAuthDiscovery,
				discoverExternalCliAuth: params.runtimeAuthDiscovery
			});
			checkEntryAuth = (entry) => modelCatalogEntryHasProviderAuth(providerAuthChecker, entry);
		}
		const authBackedCatalog = [];
		for (const entry of params.catalog) if (await checkEntryAuth(entry)) authBackedCatalog.push(entry);
		return sortModelCatalogEntries(require_model_selection_shared.dedupeModelCatalogEntries([...configuredCatalog, ...authBackedCatalog]));
	};
	const defaultVisibleCatalog = policy.allowAny || policy.hasProviderWildcards ? await buildDefaultVisibleCatalog() : [];
	return sortModelCatalogEntries(require_model_selection_shared.dedupeModelCatalogEntries(policy.visibleCatalog({
		catalog: params.catalog,
		defaultVisibleCatalog,
		view: params.view
	})));
}
/** Resolves logical rows while keeping provider-owned physical route precedence. */
async function resolveLogicalVisibleModelCatalog(params) {
	const policy = params.policy ?? require_model_visibility_policy.createModelVisibilityPolicy({
		cfg: params.cfg,
		catalog: params.catalog,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		agentId: params.agentId,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	const projectionCatalog = params.routeVariants && params.routeVariants.length > 0 ? params.routeVariants : params.catalog;
	const routeVariantsByKey = /* @__PURE__ */ new Map();
	for (const entry of projectionCatalog) {
		const key = resolveLogicalKey(entry, params.routePolicy);
		const variants = routeVariantsByKey.get(key) ?? [];
		variants.push(entry);
		routeVariantsByKey.set(key, variants);
	}
	const resolveEntryRouteVariants = (entry) => routeVariantsByKey.get(resolveLogicalKey(entry, params.routePolicy)) ?? [entry];
	const stateByKey = /* @__PURE__ */ new Map();
	const evaluateEntry = async (entry) => {
		const key = resolveLogicalKey(entry, params.routePolicy);
		let pending = stateByKey.get(key);
		if (!pending) {
			const variants = resolveEntryRouteVariants(entry);
			pending = params.evaluateEntry(variants[0] ?? entry, variants);
			stateByKey.set(key, pending);
		}
		const state = await pending;
		const selectedRoute = state.routeProjection.kind === "selected" ? state.routeProjection.route : void 0;
		return {
			...state,
			preferred: selectedRoute ? params.routePolicy.matchesRoute(entry, selectedRoute) : false
		};
	};
	const normalizePolicyKey = (key) => {
		const slashIndex = key.indexOf("/");
		return slashIndex > 0 ? resolveLogicalKey({
			provider: key.slice(0, slashIndex),
			id: key.slice(slashIndex + 1)
		}, params.routePolicy) : key;
	};
	const configuredKeys = new Set([...policy.configuredKeys].map(normalizePolicyKey));
	const retainedKeys = new Set([...policy.retainedKeys].map(normalizePolicyKey));
	const projectEntries = async (entries) => {
		return sortModelCatalogEntries(dedupeLogicalModelCatalogEntries(await Promise.all(entries.map(async (entry) => {
			const state = await evaluateEntry(entry);
			const overrides = resolveConfiguredModelCatalogOverrides({
				cfg: params.cfg,
				entry,
				policy: params.routePolicy
			});
			return projectModelCatalogEntryForRoute({
				entry,
				projection: state.routeProjection,
				catalog: resolveEntryRouteVariants(entry),
				...overrides ? { overrides } : {}
			});
		})), params.routePolicy));
	};
	if (params.view === "all") return await projectEntries(params.catalog);
	const catalogKeys = new Set(params.catalog.map((entry) => resolveLogicalKey(entry, params.routePolicy)));
	const visible = (await resolveVisibleModelCatalogWithPolicy({
		cfg: params.cfg,
		catalog: params.catalog,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		agentId: params.agentId,
		workspaceDir: params.workspaceDir,
		view: params.view,
		runtimeAuthDiscovery: false,
		entryAuthChecker: async (entry) => (await evaluateEntry(entry)).authBacked
	}, policy)).filter((entry) => {
		const key = resolveLogicalKey(entry, params.routePolicy);
		return catalogKeys.has(key) || configuredKeys.has(key);
	});
	const retained = params.catalog.filter((entry) => retainedKeys.has(resolveLogicalKey(entry, params.routePolicy)));
	const preferredKeys = new Set([...visible, ...retained].map((entry) => resolveLogicalKey(entry, params.routePolicy)));
	const preferred = [];
	const routeBacked = /* @__PURE__ */ new Set();
	for (const entry of params.catalog) {
		const key = resolveLogicalKey(entry, params.routePolicy);
		const preferredKey = preferredKeys.has(key);
		const wildcardRoute = policy.allowAny || policy.providerWildcards.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider));
		if (!preferredKey && !wildcardRoute) continue;
		const state = await evaluateEntry(entry);
		if (!state.compatible && !configuredKeys.has(key)) continue;
		if (state.preferred && preferredKey) preferred.push(entry);
		if (wildcardRoute && state.routeManaged && state.authBacked) routeBacked.add(entry);
	}
	const kept = [];
	for (const entry of visible) {
		const key = resolveLogicalKey(entry, params.routePolicy);
		const state = await evaluateEntry(entry);
		const configured = configuredKeys.has(key);
		if ((state.compatible || configured) && (!state.routeManaged || configured || routeBacked.has(entry))) kept.push(entry);
	}
	return await projectEntries([
		...preferred,
		...kept,
		...retained,
		...routeBacked
	]);
}
//#endregion
Object.defineProperty(exports, "findModelCatalogRouteDonor", {
	enumerable: true,
	get: function() {
		return findModelCatalogRouteDonor;
	}
});
Object.defineProperty(exports, "projectModelCatalogEntryForRoute", {
	enumerable: true,
	get: function() {
		return projectModelCatalogEntryForRoute;
	}
});
Object.defineProperty(exports, "resolveConfiguredModelCatalogOverrides", {
	enumerable: true,
	get: function() {
		return resolveConfiguredModelCatalogOverrides;
	}
});
Object.defineProperty(exports, "resolveLogicalModelCatalogEntryState", {
	enumerable: true,
	get: function() {
		return resolveLogicalModelCatalogEntryState;
	}
});
Object.defineProperty(exports, "resolveLogicalVisibleModelCatalog", {
	enumerable: true,
	get: function() {
		return resolveLogicalVisibleModelCatalog;
	}
});
