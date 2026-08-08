const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_provider_policy_surface = require("./provider-policy-surface-BvfZK2wb.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_model_runtime_policy = require("./model-runtime-policy-CHKLCuJi.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/agents/agent-runtime-id.ts
const OPERATOR_AGENT_RUNTIME_ID = "@gabrielvfonseca/operator";
const AUTO_AGENT_RUNTIME_ID = "auto";
/** Normalizes configured runtime aliases to the current embedded-agent runtime id vocabulary. */
function normalizeEmbeddedAgentRuntime(raw) {
	const value = raw?.trim();
	if (!value) return OPERATOR_AGENT_RUNTIME_ID;
	if (value === "@gabrielvfonseca/operator" || value === "pi") return OPERATOR_AGENT_RUNTIME_ID;
	if (value === "auto") return AUTO_AGENT_RUNTIME_ID;
	if (value === "codex-app-server") return "codex";
	return value;
}
/** Normalizes an optional unknown runtime id value, returning undefined when absent/invalid. */
function normalizeOptionalAgentRuntimeId(raw) {
	if (typeof raw !== "string") return;
	const value = raw.trim().toLowerCase();
	return value ? normalizeEmbeddedAgentRuntime(value) : void 0;
}
/** Resolves the deprecated explicit whole-agent runtime override, when present. */
function resolveAgentScopedRuntimeOverride(params) {
	const agentId = params.agentId ? (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId) : void 0;
	return normalizeOptionalAgentRuntimeId((agentId ? params.config?.agents?.list?.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === agentId)?.agentRuntime?.id : void 0) ?? params.config?.agents?.defaults?.agentRuntime?.id);
}
/** Returns whether a runtime id should be treated as the default runtime selection. */
function isDefaultAgentRuntimeId(runtime) {
	return runtime === void 0 || runtime === "auto" || runtime === "default";
}
//#endregion
//#region src/agents/model-extra-params.ts
function legacyModelKey(provider, modelId) {
	const rawKey = `${provider.trim()}/${modelId.trim()}`;
	return rawKey === require_model_input.modelKey(provider, modelId) ? void 0 : rawKey;
}
/** Resolves the config records merged into one model request. */
function resolveModelExtraParamSources(params) {
	const defaultParams = params.config?.agents?.defaults?.params;
	const configuredModels = params.config?.agents?.defaults?.models;
	const canonicalKey = params.modelId ? require_model_input.modelKey(params.provider, params.modelId) : void 0;
	const legacyKey = params.modelId ? legacyModelKey(params.provider, params.modelId) : void 0;
	return {
		defaultParams,
		modelParams: canonicalKey ? configuredModels?.[canonicalKey]?.params ?? (legacyKey ? configuredModels?.[legacyKey]?.params : void 0) : void 0,
		agentParams: params.agentId ? params.config?.agents?.list?.find((agent) => agent.id === params.agentId)?.params : void 0
	};
}
/** Returns whether embedded Operator would apply authored request parameters. */
function hasModelExtraParams(params) {
	const sources = resolveModelExtraParamSources(params);
	return [
		sources.defaultParams,
		sources.modelParams,
		sources.agentParams
	].some((source) => source !== void 0 && Object.keys(source).length > 0);
}
//#endregion
//#region src/config/model-provider-config.ts
/** Indexes configured model rows after caller-owned model-id normalization. */
function resolveMergedModelProviderModels(params) {
	const models = /* @__PURE__ */ new Map();
	for (const model of params.models ?? []) {
		const modelId = params.normalizeModelId(model.id);
		if (!modelId) continue;
		const existing = models.get(modelId);
		models.set(modelId, existing ? {
			...model,
			...existing
		} : model);
	}
	return models;
}
function normalizeModelId$1(provider, modelId) {
	const trimmed = modelId.trim();
	const slashIndex = trimmed.indexOf("/");
	return slashIndex > 0 && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(trimmed.slice(0, slashIndex)) === (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider) ? trimmed.slice(slashIndex + 1).trim() : trimmed;
}
function readRecord(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function hasNonEmptyRecord(value) {
	const record = readRecord(value);
	return record !== void 0 && Object.keys(record).length > 0;
}
/** Projects authored request behavior without exposing values or local commands. */
function resolveModelProviderRouteOverridePresence(params) {
	const providerConfig = resolveMergedModelProviderConfig(params.config, params.provider);
	if (!providerConfig) return "none";
	if (readRecord(providerConfig.localService) !== void 0 || hasNonEmptyRecord(providerConfig.headers) || hasNonEmptyRecord(providerConfig.request) || hasNonEmptyRecord(providerConfig.params) || typeof providerConfig.authHeader === "boolean" || typeof providerConfig.timeoutSeconds === "number") return "present";
	if (!params.modelId) return "none";
	const canonicalize = (modelId) => {
		const normalized = normalizeModelId$1(params.provider, modelId);
		return params.canonicalizeModelId?.(normalized).trim() || normalized;
	};
	const modelId = canonicalize(params.modelId);
	const configuredModel = resolveMergedModelProviderModels({
		models: providerConfig.models,
		normalizeModelId: canonicalize
	}).get(modelId);
	return configuredModel && (hasNonEmptyRecord(configuredModel.headers) || hasNonEmptyRecord(configuredModel.params) || hasNonEmptyRecord(configuredModel.compat)) ? "present" : "none";
}
/** Resolves the provider entry produced by models-config key normalization. */
function resolveMergedModelProviderEntry(config, provider) {
	const requestedProvider = provider.trim();
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(requestedProvider);
	if (!normalizedProvider) return;
	const providers = Object.entries(config?.models?.providers ?? {});
	const exactKey = providers.find(([providerId]) => providerId.trim() === requestedProvider)?.[0];
	const fallbackKey = providers.find(([providerId]) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId) === normalizedProvider)?.[0];
	const providerKey = (exactKey ?? fallbackKey)?.trim();
	if (!providerKey) return;
	let matched;
	for (const [providerId, providerConfig] of providers) {
		if (providerId.trim() !== providerKey) continue;
		matched = matched ? {
			...matched,
			...providerConfig,
			models: providerConfig.models ?? matched.models
		} : providerConfig;
	}
	return matched ? {
		providerKey,
		providerConfig: matched
	} : void 0;
}
/** Resolves only the merged provider config when its canonical key is not needed. */
function resolveMergedModelProviderConfig(config, provider) {
	return resolveMergedModelProviderEntry(config, provider)?.providerConfig;
}
//#endregion
//#region src/plugins/provider-model-routes.ts
/** Generic adapter for provider-owned model route public artifacts. */
/** Resolves provider-owned catalog id equivalence without loading its runtime. */
function resolveProviderModelCatalogId(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	const normalized = (params.surface === void 0 ? require_provider_policy_surface.resolveDirectBundledProviderPolicySurface(provider) : params.surface)?.normalizeModelCatalogId?.({
		provider,
		modelId: params.modelId
	});
	return typeof normalized === "string" && normalized.trim() ? normalized.trim() : null;
}
function normalizeModelId(provider, modelId, surface) {
	const trimmed = modelId?.trim();
	if (!trimmed) return;
	const canonical = surface?.normalizeModelCatalogId?.({
		provider,
		modelId: trimmed
	});
	return typeof canonical === "string" && canonical.trim() ? canonical.trim() : trimmed;
}
function projectConfiguredModelRoute(model) {
	return {
		...Object.hasOwn(model, "api") ? { api: model.api } : {},
		...Object.hasOwn(model, "baseUrl") ? { baseUrl: model.baseUrl } : {}
	};
}
/** Captures one provider artifact and config view for repeated row resolution. */
function createProviderModelRoutesResolver(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	if (!provider) return () => null;
	const surface = params.surface === void 0 ? require_provider_policy_surface.resolveDirectBundledProviderPolicySurface(provider) : params.surface;
	const resolveModelRoutes = surface?.resolveModelRoutes;
	const providerConfig = resolveMergedModelProviderConfig(params.config, provider);
	const configuredProvider = providerConfig ? {
		api: providerConfig.api,
		baseUrl: providerConfig.baseUrl
	} : void 0;
	const normalizeConfiguredModelId = (modelId) => normalizeModelId(provider, modelId, surface);
	const canonicalizeModelId = (modelId) => normalizeConfiguredModelId(modelId) ?? modelId.trim();
	const configuredModels = new Map(Array.from(resolveMergedModelProviderModels({
		models: providerConfig?.models,
		normalizeModelId: normalizeConfiguredModelId
	}), ([modelId, model]) => [modelId, projectConfiguredModelRoute(model)]));
	const providerRouteOverridePresence = params.requestTransportOverrides === "present" ? "present" : resolveModelProviderRouteOverridePresence({
		provider,
		config: params.config
	});
	const routeOverridePresenceByModel = new Map([...configuredModels.keys()].map((modelId) => [modelId, params.requestTransportOverrides === "present" ? "present" : resolveModelProviderRouteOverridePresence({
		provider,
		modelId,
		config: params.config,
		canonicalizeModelId
	})]));
	const env = params.env ?? process.env;
	return (observed) => {
		if (!resolveModelRoutes) return null;
		const modelId = normalizeModelId(provider, observed?.modelId, surface);
		const configuredModel = modelId ? configuredModels.get(modelId) : void 0;
		const requestTransportOverrides = modelId ? routeOverridePresenceByModel.get(modelId) ?? providerRouteOverridePresence : providerRouteOverridePresence;
		const observedRoutes = observed?.observedRoutes?.filter((route) => route.api != null || route.baseUrl !== void 0 && route.baseUrl !== null);
		return resolveModelRoutes({
			provider,
			...modelId ? { modelId } : {},
			requestTransportOverrides,
			...configuredModel ? { configuredModel } : {},
			...configuredProvider ? { configuredProvider } : {},
			env,
			...observedRoutes && observedRoutes.length > 0 ? { observedRoutes } : {}
		}) ?? null;
	};
}
/** Resolves one model route through its bundled provider public artifact. */
function resolveProviderModelRoutes(params) {
	return createProviderModelRoutesResolver(params)({
		modelId: params.modelId,
		observedRoutes: params.api != null || params.baseUrl !== void 0 && params.baseUrl !== null ? [{
			api: params.api,
			baseUrl: params.baseUrl
		}] : void 0
	});
}
//#endregion
//#region src/agents/provider-model-auth-source-plan.ts
function toProviderModelAuthReadiness(availability) {
	return availability === true ? "ready" : availability === false ? "unavailable" : "unknown";
}
function fromProviderModelAuthReadiness(readiness) {
	return readiness === "ready" ? true : readiness === "unavailable" ? false : void 0;
}
/** Creates a source fact without retaining credential material. */
function buildProviderModelAuthDirectSource(params) {
	return {
		kind: "direct",
		mode: params.mode,
		readiness: toProviderModelAuthReadiness(params.availability),
		evidence: params.evidence
	};
}
function reorderPreferredProfile(profiles, preferredProfileId) {
	if (!preferredProfileId) return [...profiles];
	const preferred = profiles.find((profile) => profile.profileId === preferredProfileId);
	return preferred ? [preferred, ...profiles.filter((profile) => profile.profileId !== preferredProfileId)] : [...profiles];
}
/** Applies source precedence and automatic-tier readiness/cooldown policy once. */
function buildProviderModelAuthSourcePlan(params) {
	if (params.ownership) return {
		kind: "required",
		...params.ownership
	};
	const explicitOrder = params.explicitOrder === true;
	const ordered = reorderPreferredProfile(params.profiles, params.preferredProfileId);
	let profiles;
	if (ordered.length === 0) profiles = {
		kind: "empty",
		explicitOrder
	};
	else {
		const available = ordered.filter((profile) => profile.readiness !== "unavailable");
		if (available.length === 0) {
			const [firstOrdered] = ordered;
			profiles = firstOrdered ? {
				kind: "all-unavailable",
				explicitOrder,
				first: firstOrdered
			} : {
				kind: "empty",
				explicitOrder
			};
		} else {
			const outsideCooldown = available.filter((profile) => profile.cooldown === "clear");
			if (outsideCooldown.length > 0) profiles = {
				kind: "usable",
				explicitOrder,
				profiles: outsideCooldown
			};
			else if (params.allowCooldown) profiles = {
				kind: "usable",
				explicitOrder,
				profiles: available.slice(0, 1)
			};
			else {
				const [firstAvailable] = available;
				profiles = firstAvailable ? {
					kind: "all-cooldown",
					explicitOrder,
					first: firstAvailable
				} : {
					kind: "empty",
					explicitOrder
				};
			}
		}
	}
	return {
		kind: "automatic",
		profiles,
		orderedProfiles: ordered,
		allowCooldown: params.allowCooldown === true,
		...params.fallback ? { fallback: params.fallback } : {}
	};
}
//#endregion
//#region src/agents/provider-model-route-auth.ts
/** Normalizes stored/runtime auth syntax for profile-scoped model lookup. */
function resolveProviderModelMaterializationAuthMode(mode) {
	switch (mode) {
		case "api-key":
		case "api_key": return "api_key";
		case "aws-sdk":
		case "oauth":
		case "token": return mode;
		default: return;
	}
}
/** Maps runtime/stored credential modes onto the provider route contract. */
function resolveProviderModelRouteAuthRequirement(mode) {
	switch (mode) {
		case "api-key":
		case "api_key":
		case "aws-sdk": return "api-key";
		case "oauth":
		case "token": return "subscription";
		default: return;
	}
}
function providerModelRouteAcceptsAuthMode(params) {
	return resolveProviderModelRouteAuthRequirement(params.mode) === params.requirement;
}
/** Preserves an exact credential mode while normalizing authored api-key syntax. */
function resolveProviderModelRouteMaterializationAuthMode(params) {
	return resolveProviderModelMaterializationAuthMode(params.mode) ?? (params.requirement === "api-key" ? "api_key" : "oauth");
}
function directAttempt(source) {
	return {
		kind: "direct",
		source,
		allowAuthProfileFallback: false
	};
}
function selectReadyProfile(profiles) {
	const first = profiles[0];
	if (first?.readiness !== "unknown") return first;
	return profiles.find((profile) => profile.readiness === "ready") ?? first;
}
/** Selects logical auth sources without resolving a provider-owned route. */
function selectProviderModelAuthSources(params) {
	if (params.plan.kind === "required") {
		const source = params.plan.source;
		return {
			kind: "selected",
			selection: {
				kind: "selected",
				source
			},
			attempts: [source.kind === "profile" ? {
				kind: "profile",
				source
			} : directAttempt(source)]
		};
	}
	const { fallback, profiles } = params.plan;
	if (profiles.kind === "all-cooldown") return {
		kind: "rejected",
		reason: "all-cooldown",
		message: `Auth profile "${profiles.first.profileId}" is temporarily unavailable for ${params.provider}.`,
		source: profiles.first
	};
	if (profiles.explicitOrder && (profiles.kind === "empty" || profiles.kind === "all-unavailable")) return {
		kind: "rejected",
		reason: "explicit-order",
		message: `Explicit auth order for ${params.provider} has no usable profiles.`,
		...profiles.kind === "all-unavailable" ? { source: profiles.first } : {}
	};
	if (profiles.kind === "usable") {
		const winner = selectReadyProfile(profiles.profiles);
		return {
			kind: "selected",
			selection: winner ? {
				kind: "selected",
				source: winner
			} : { kind: "none" },
			attempts: [...profiles.profiles.map((source) => ({
				kind: "profile",
				source
			})), ...fallback ? [directAttempt(fallback)] : []]
		};
	}
	if (fallback) return {
		kind: "selected",
		selection: {
			kind: "selected",
			source: fallback
		},
		attempts: [directAttempt(fallback)]
	};
	return {
		kind: "selected",
		selection: profiles.kind === "all-unavailable" ? {
			kind: "unavailable",
			source: profiles.first
		} : { kind: "none" },
		attempts: []
	};
}
function reject(reason, message, source, route) {
	return {
		kind: "rejected",
		reason,
		message,
		...source ? { source } : {},
		...route ? { route } : {}
	};
}
function routeForMode(resolution, mode) {
	const requirement = resolveProviderModelRouteAuthRequirement(mode);
	return requirement ? resolution.routes.find((candidate) => candidate.authRequirement === requirement) : void 0;
}
function resolveDeferredRouteSupport(resolution) {
	const seenRuntimeIds = /* @__PURE__ */ new Set();
	const compatibleIds = (resolution.routes[0].runtimePolicy?.compatibleIds ?? []).flatMap((id) => {
		const normalizedId = id.trim().toLowerCase();
		if (!normalizedId || seenRuntimeIds.has(normalizedId) || !resolution.routes.every((route) => route.runtimePolicy?.compatibleIds.some((candidateId) => candidateId.trim().toLowerCase() === normalizedId))) return [];
		seenRuntimeIds.add(normalizedId);
		return [normalizedId];
	});
	return {
		requestTransportOverrides: resolution.routes.some((route) => route.requestTransportOverrides === "present") ? "present" : "none",
		runtimePolicy: { compatibleIds }
	};
}
/** Selects one route and emits source-distinct, exact-route physical attempts. */
function selectProviderModelRouteAuth(params) {
	const requiredProfile = params.sourcePlan.kind === "required" && params.sourcePlan.source.kind === "profile" ? params.sourcePlan.source : void 0;
	const configuredMode = params.sourcePlan.kind === "required" ? params.sourcePlan.source.kind === "direct" ? params.sourcePlan.source.mode : void 0 : params.configuredAuthMode;
	const configuredRoute = routeForMode(params.resolution, configuredMode);
	if (configuredMode && resolveProviderModelRouteAuthRequirement(configuredMode) && !configuredRoute) return reject("configured-auth", `Configured ${params.provider} authentication is not compatible with the selected model route.`);
	const configuredRequirement = configuredRoute?.authRequirement ?? (params.resolution.routes.length === 1 ? params.resolution.routes[0]?.authRequirement : void 0);
	const effectiveSourcePlan = params.sourcePlan.kind === "automatic" && configuredRequirement ? buildProviderModelAuthSourcePlan({
		profiles: params.sourcePlan.orderedProfiles.filter((profile) => resolveProviderModelRouteAuthRequirement(profile.mode) === configuredRequirement),
		explicitOrder: params.sourcePlan.profiles.explicitOrder,
		allowCooldown: params.sourcePlan.allowCooldown,
		...params.sourcePlan.fallback ? { fallback: params.sourcePlan.fallback } : {}
	}) : params.sourcePlan;
	const sourceDecision = selectProviderModelAuthSources({
		provider: params.provider,
		plan: effectiveSourcePlan
	});
	if (sourceDecision.kind === "rejected") return reject(sourceDecision.reason, sourceDecision.message, sourceDecision.source, configuredRoute);
	const logicalProfiles = sourceDecision.attempts.flatMap((attempt) => attempt.kind === "profile" ? [attempt.source] : []);
	const routeProfileAttempts = logicalProfiles.flatMap((source) => {
		const route = routeForMode(params.resolution, source.mode);
		if (!route || configuredRequirement && route.authRequirement !== configuredRequirement) return [];
		return [{
			source,
			route
		}];
	});
	if (requiredProfile && routeProfileAttempts.length === 0) {
		const accepted = params.resolution.routes.map((candidate) => candidate.authRequirement).filter((value, index, values) => values.indexOf(value) === index).join(" or ");
		return reject("required-profile", `Auth profile "${requiredProfile.profileId}" is not compatible with ${params.provider}; the selected model route requires ${accepted} authentication.`, requiredProfile);
	}
	if (effectiveSourcePlan.kind === "automatic" && effectiveSourcePlan.profiles.explicitOrder && logicalProfiles.length > 0 && routeProfileAttempts.length === 0) return reject("explicit-order", `Explicit auth order has no route-compatible profiles for ${params.provider}.`);
	const winner = routeProfileAttempts[0];
	const directSource = sourceDecision.attempts.find((attempt) => attempt.kind === "direct")?.source;
	const directSourceRoute = directSource ? routeForMode(params.resolution, directSource.mode) : void 0;
	const directRoute = directSourceRoute && (!configuredRequirement || directSourceRoute.authRequirement === configuredRequirement) ? directSourceRoute : void 0;
	if (directSource?.mode && !directRoute && !winner) return reject("configured-auth", `Configured ${params.provider} authentication is not compatible with the selected model route.`);
	let rejectedProfile;
	if (sourceDecision.selection.kind === "unavailable") rejectedProfile = sourceDecision.selection.source;
	else if (sourceDecision.selection.kind === "selected" && sourceDecision.selection.source.kind === "profile") rejectedProfile = sourceDecision.selection.source;
	else if (effectiveSourcePlan !== params.sourcePlan && params.sourcePlan.kind === "automatic") rejectedProfile = params.sourcePlan.orderedProfiles[0];
	if (!Boolean(winner || directSource && directRoute)) {
		const routeSupport = resolveDeferredRouteSupport(params.resolution);
		const normalizedRuntimeAuthOwner = params.runtimeAuthOwner?.id.trim().toLowerCase();
		const runtimeAuthOwnerIsCompatible = Boolean(normalizedRuntimeAuthOwner) && routeSupport.runtimePolicy.compatibleIds.includes(normalizedRuntimeAuthOwner ?? "");
		if (params.resolution.routes.length > 1 && runtimeAuthOwnerIsCompatible && !configuredRoute) return {
			kind: "deferred",
			reason: "runtime-auth-owner",
			routeSupport
		};
		return reject("configured-auth", configuredRoute ? `Configured ${params.provider} authentication has no compatible credential source for the selected model route.` : `No route-compatible authentication source is configured for ${params.provider}.`, rejectedProfile, configuredRoute);
	}
	const selectedRoute = winner?.route ?? directRoute;
	if (!selectedRoute) return reject("configured-auth", `No route-compatible authentication source is configured for ${params.provider}.`);
	const sameRouteAttempts = winner ? routeProfileAttempts.filter((attempt) => attempt.route.authRequirement === winner.route.authRequirement) : [];
	const crossRouteAttempts = winner ? routeProfileAttempts.filter((attempt) => attempt.route.authRequirement !== winner.route.authRequirement) : routeProfileAttempts;
	const orderedProfileAttempts = [...sameRouteAttempts, ...crossRouteAttempts];
	const attempts = orderedProfileAttempts.map((attempt, index) => ({
		kind: "profile",
		source: attempt.source,
		route: attempt.route,
		sameRouteProfileIds: orderedProfileAttempts.slice(index).filter((candidate) => candidate.route.authRequirement === attempt.route.authRequirement).map((candidate) => candidate.source.profileId)
	}));
	if (directSource && directRoute) attempts.push({
		kind: "direct",
		source: directSource,
		route: directRoute,
		allowAuthProfileFallback: false
	});
	return {
		kind: "selected",
		selection: {
			...winner ? {
				kind: "selected",
				source: winner.source
			} : directSource ? {
				kind: "selected",
				source: directSource
			} : sourceDecision.selection.kind === "unavailable" ? sourceDecision.selection : { kind: "none" },
			route: selectedRoute
		},
		attempts
	};
}
//#endregion
//#region src/agents/provider-model-route.ts
/** Generic core consumers for provider-owned model route facts. */
/** Canonicalizes a model id only when its provider owns catalog equivalence. */
function canonicalizeProviderModelId(providerId, modelId) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	return provider && resolveProviderModelCatalogId({
		provider,
		modelId
	}) || modelId;
}
function normalizeRouteBaseUrl(value) {
	try {
		const url = new URL(value);
		url.pathname = url.pathname.replace(/\/+$/u, "") || "/";
		return url.toString();
	} catch {
		return value.replace(/\/+$/u, "");
	}
}
function routeTupleMatches(source, route) {
	return source.api === route.api && typeof source.baseUrl === "string" && normalizeRouteBaseUrl(source.baseUrl) === normalizeRouteBaseUrl(route.baseUrl);
}
/** True when materialized model metadata belongs to the selected provider route. */
function modelMatchesProviderModelRoute(params) {
	if (routeTupleMatches(params, params.route)) return true;
	if (typeof params.api !== "string" || !params.api.trim() || params.api !== params.route.api || typeof params.baseUrl !== "string" || !params.baseUrl.trim()) return false;
	const configuredProvider = {
		api: params.api,
		baseUrl: params.baseUrl,
		models: []
	};
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	const resolution = resolveProviderModelRoutes({
		provider,
		config: { models: { providers: { [provider]: configuredProvider } } }
	});
	return resolution?.kind === "routes" && resolution.routes.some((candidate) => candidate.authRequirement === params.route.authRequirement && routeTupleMatches(candidate, params.route));
}
/** Creates catalog equivalence and physical-route matching from provider facts. */
function createProviderModelCatalogRoutePolicy(providerId) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	return {
		resolveIdentity: (entry) => {
			if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) !== provider) return null;
			const id = resolveProviderModelCatalogId({
				provider,
				modelId: require_model_ref_profile.splitTrailingAuthProfile(entry.id).model
			});
			return id ? {
				id,
				key: `${provider}/${id}`
			} : null;
		},
		matchesRoute: (entry, route) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) === provider && modelMatchesProviderModelRoute({
			provider,
			api: entry.api,
			baseUrl: entry.baseUrl,
			route
		})
	};
}
/** Projects a selected route onto transient config used only for model materialization. */
function projectProviderModelRouteConfig(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	const providers = params.config?.models?.providers ?? {};
	const providerEntry = resolveMergedModelProviderEntry(params.config, provider);
	const providerKey = providerEntry?.providerKey ?? provider;
	const providerConfig = providerEntry?.providerConfig ?? { models: [] };
	const routeProviders = Object.fromEntries(Object.entries(providers).filter(([candidate]) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(candidate) !== provider || candidate === providerKey));
	return {
		...params.config,
		models: {
			...params.config?.models,
			providers: {
				...routeProviders,
				[providerKey]: {
					...providerConfig,
					auth: params.route.authRequirement === "subscription" ? "oauth" : "api-key",
					api: params.route.api,
					baseUrl: params.route.baseUrl
				}
			}
		}
	};
}
//#endregion
//#region src/agents/openai-model-routes.ts
/** Cold adapter for provider-owned OpenAI model route facts. */
const OPENAI_PROVIDER_ID$1 = "openai";
function createOpenAIModelRoutesResolver(params) {
	const resolveRoutes = createProviderModelRoutesResolver({
		provider: OPENAI_PROVIDER_ID$1,
		config: params.config,
		env: params.env,
		requestTransportOverrides: params.requestTransportOverrides
	});
	return (observed) => resolveRoutes({
		modelId: observed.modelId ? require_model_ref_profile.splitTrailingAuthProfile(observed.modelId).model : void 0,
		observedRoutes: observed.observedRoutes ?? (observed.api != null || observed.baseUrl !== void 0 && observed.baseUrl !== null ? [{
			api: observed.api,
			baseUrl: observed.baseUrl
		}] : void 0)
	});
}
/** Returns the authored OpenAI provider auth mode, if one exists. */
function resolveConfiguredOpenAIAuthMode(config) {
	return resolveMergedModelProviderConfig(config, OPENAI_PROVIDER_ID$1)?.auth;
}
function selectOpenAIModelRouteAuth(params) {
	return selectProviderModelRouteAuth({
		provider: OPENAI_PROVIDER_ID$1,
		...params
	});
}
const openAIModelCatalogRoutePolicy = createProviderModelCatalogRoutePolicy(OPENAI_PROVIDER_ID$1);
/** Resolves provider-owned OpenAI route state without loading the full provider runtime. */
function resolveOpenAIModelRoutes(params) {
	if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider ?? "") !== OPENAI_PROVIDER_ID$1) return null;
	return createOpenAIModelRoutesResolver({
		config: params.config,
		env: params.env,
		requestTransportOverrides: params.requestTransportOverrides
	})({
		modelId: params.modelId,
		api: params.api,
		baseUrl: params.baseUrl
	});
}
//#endregion
//#region src/agents/openai-routing.ts
/**
* OpenAI provider routing decisions shared by model selection, auth profiles, and runtime setup.
*
* Custom OpenAI-compatible base URLs intentionally bypass Codex-runtime defaults.
*/
/** Canonical provider id for OpenAI-hosted model routes. */
const OPENAI_PROVIDER_ID = "openai";
const OPENAI_CODEX_PROVIDER_ID = OPENAI_PROVIDER_ID;
/** Returns true for provider ids that normalize to OpenAI. */
function isOpenAIProvider(provider) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider ?? "") === OPENAI_PROVIDER_ID;
}
/** Canonicalizes shipped OpenAI model aliases at runtime boundaries. */
function canonicalizeOpenAIModelId(provider, modelId) {
	return isOpenAIProvider(provider) ? canonicalizeProviderModelId(OPENAI_PROVIDER_ID, modelId) : modelId;
}
/** Resolves the provider-owned implicit runtime for one concrete OpenAI route. */
function resolveOpenAIImplicitAgentRuntime(params) {
	if (!isOpenAIProvider(params.provider)) return null;
	const modelId = params.modelId;
	const agentId = params.agentId ?? (params.sessionKey ? require_session_key.resolveAgentIdFromSessionKey(params.sessionKey) : void 0);
	const hasConfiguredParams = hasModelExtraParams({
		config: params.config,
		provider: params.provider ?? "openai",
		modelId,
		agentId
	});
	const requestTransportOverrides = params.requestTransportOverrides === "present" || hasConfiguredParams ? "present" : "none";
	const resolution = resolveOpenAIModelRoutes({
		provider: params.provider,
		modelId,
		api: params.api,
		baseUrl: params.baseUrl,
		config: params.config,
		env: params.env,
		requestTransportOverrides
	});
	if (!resolution) return "@gabrielvfonseca/operator";
	return resolution.kind !== "incompatible" && resolution.defaultRuntimeId === "codex" ? "codex" : "@gabrielvfonseca/operator";
}
/** Parses the provider portion from a provider/model ref. */
function parseModelRefProvider(value) {
	if (typeof value !== "string") return;
	const slashIndex = value.trim().indexOf("/");
	if (slashIndex <= 0) return;
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(value.trim().slice(0, slashIndex));
}
/** Returns true when selected model config should ensure the Codex plugin exists. */
function modelSelectionShouldEnsureCodexPlugin(params) {
	const provider = parseModelRefProvider(params.model);
	if (provider !== "openai") return false;
	const modelRef = params.model?.trim();
	const slashIndex = modelRef?.indexOf("/") ?? -1;
	const modelId = slashIndex >= 0 ? modelRef?.slice(slashIndex + 1) : void 0;
	const configuredPolicy = require_model_runtime_policy.resolveModelRuntimePolicy({
		config: params.config,
		provider,
		modelId,
		agentId: params.agentId
	}).policy;
	const configuredRuntime = normalizeOptionalAgentRuntimeId(configuredPolicy?.id);
	if (configuredRuntime && !isDefaultAgentRuntimeId(configuredRuntime)) return configuredRuntime === "codex";
	if (!configuredPolicy) {
		const agentRuntime = resolveAgentScopedRuntimeOverride({
			config: params.config,
			agentId: params.agentId
		});
		if (agentRuntime && !isDefaultAgentRuntimeId(agentRuntime)) return agentRuntime === "codex";
	}
	return resolveOpenAIImplicitAgentRuntime({
		provider,
		modelId,
		config: params.config,
		agentId: params.agentId
	}) === "codex";
}
/** Lists auth-profile providers for an OpenAI runtime route. */
function listOpenAIAuthProfileProvidersForAgentRuntime(params) {
	if (!isOpenAIProvider(params.provider)) return [params.provider];
	return [OPENAI_PROVIDER_ID];
}
/** Resolves the provider id passed to OpenAI runtime auth/execution paths. */
function resolveOpenAIRuntimeProvider(params) {
	return isOpenAIProvider(params.provider) ? OPENAI_PROVIDER_ID : params.provider;
}
/** Resolves the selected provider id displayed for OpenAI runtime routes. */
function resolveSelectedOpenAIRuntimeProvider(params) {
	return isOpenAIProvider(params.provider) ? OPENAI_PROVIDER_ID : params.provider;
}
/** Resolves the config provider used for context-window lookup. */
function resolveContextConfigProviderForRuntime(params) {
	return isOpenAIProvider(params.provider) ? OPENAI_PROVIDER_ID : params.provider;
}
//#endregion
Object.defineProperty(exports, "AUTO_AGENT_RUNTIME_ID", {
	enumerable: true,
	get: function() {
		return AUTO_AGENT_RUNTIME_ID;
	}
});
Object.defineProperty(exports, "OPENAI_CODEX_PROVIDER_ID", {
	enumerable: true,
	get: function() {
		return OPENAI_CODEX_PROVIDER_ID;
	}
});
Object.defineProperty(exports, "OPENAI_PROVIDER_ID", {
	enumerable: true,
	get: function() {
		return OPENAI_PROVIDER_ID;
	}
});
Object.defineProperty(exports, "OPERATOR_AGENT_RUNTIME_ID", {
	enumerable: true,
	get: function() {
		return OPERATOR_AGENT_RUNTIME_ID;
	}
});
Object.defineProperty(exports, "buildProviderModelAuthDirectSource", {
	enumerable: true,
	get: function() {
		return buildProviderModelAuthDirectSource;
	}
});
Object.defineProperty(exports, "buildProviderModelAuthSourcePlan", {
	enumerable: true,
	get: function() {
		return buildProviderModelAuthSourcePlan;
	}
});
Object.defineProperty(exports, "canonicalizeOpenAIModelId", {
	enumerable: true,
	get: function() {
		return canonicalizeOpenAIModelId;
	}
});
Object.defineProperty(exports, "canonicalizeProviderModelId", {
	enumerable: true,
	get: function() {
		return canonicalizeProviderModelId;
	}
});
Object.defineProperty(exports, "createOpenAIModelRoutesResolver", {
	enumerable: true,
	get: function() {
		return createOpenAIModelRoutesResolver;
	}
});
Object.defineProperty(exports, "fromProviderModelAuthReadiness", {
	enumerable: true,
	get: function() {
		return fromProviderModelAuthReadiness;
	}
});
Object.defineProperty(exports, "hasModelExtraParams", {
	enumerable: true,
	get: function() {
		return hasModelExtraParams;
	}
});
Object.defineProperty(exports, "isDefaultAgentRuntimeId", {
	enumerable: true,
	get: function() {
		return isDefaultAgentRuntimeId;
	}
});
Object.defineProperty(exports, "isOpenAIProvider", {
	enumerable: true,
	get: function() {
		return isOpenAIProvider;
	}
});
Object.defineProperty(exports, "listOpenAIAuthProfileProvidersForAgentRuntime", {
	enumerable: true,
	get: function() {
		return listOpenAIAuthProfileProvidersForAgentRuntime;
	}
});
Object.defineProperty(exports, "modelMatchesProviderModelRoute", {
	enumerable: true,
	get: function() {
		return modelMatchesProviderModelRoute;
	}
});
Object.defineProperty(exports, "modelSelectionShouldEnsureCodexPlugin", {
	enumerable: true,
	get: function() {
		return modelSelectionShouldEnsureCodexPlugin;
	}
});
Object.defineProperty(exports, "normalizeEmbeddedAgentRuntime", {
	enumerable: true,
	get: function() {
		return normalizeEmbeddedAgentRuntime;
	}
});
Object.defineProperty(exports, "normalizeOptionalAgentRuntimeId", {
	enumerable: true,
	get: function() {
		return normalizeOptionalAgentRuntimeId;
	}
});
Object.defineProperty(exports, "openAIModelCatalogRoutePolicy", {
	enumerable: true,
	get: function() {
		return openAIModelCatalogRoutePolicy;
	}
});
Object.defineProperty(exports, "parseModelRefProvider", {
	enumerable: true,
	get: function() {
		return parseModelRefProvider;
	}
});
Object.defineProperty(exports, "projectProviderModelRouteConfig", {
	enumerable: true,
	get: function() {
		return projectProviderModelRouteConfig;
	}
});
Object.defineProperty(exports, "providerModelRouteAcceptsAuthMode", {
	enumerable: true,
	get: function() {
		return providerModelRouteAcceptsAuthMode;
	}
});
Object.defineProperty(exports, "resolveConfiguredOpenAIAuthMode", {
	enumerable: true,
	get: function() {
		return resolveConfiguredOpenAIAuthMode;
	}
});
Object.defineProperty(exports, "resolveContextConfigProviderForRuntime", {
	enumerable: true,
	get: function() {
		return resolveContextConfigProviderForRuntime;
	}
});
Object.defineProperty(exports, "resolveMergedModelProviderConfig", {
	enumerable: true,
	get: function() {
		return resolveMergedModelProviderConfig;
	}
});
Object.defineProperty(exports, "resolveMergedModelProviderModels", {
	enumerable: true,
	get: function() {
		return resolveMergedModelProviderModels;
	}
});
Object.defineProperty(exports, "resolveModelExtraParamSources", {
	enumerable: true,
	get: function() {
		return resolveModelExtraParamSources;
	}
});
Object.defineProperty(exports, "resolveModelProviderRouteOverridePresence", {
	enumerable: true,
	get: function() {
		return resolveModelProviderRouteOverridePresence;
	}
});
Object.defineProperty(exports, "resolveOpenAIImplicitAgentRuntime", {
	enumerable: true,
	get: function() {
		return resolveOpenAIImplicitAgentRuntime;
	}
});
Object.defineProperty(exports, "resolveOpenAIModelRoutes", {
	enumerable: true,
	get: function() {
		return resolveOpenAIModelRoutes;
	}
});
Object.defineProperty(exports, "resolveOpenAIRuntimeProvider", {
	enumerable: true,
	get: function() {
		return resolveOpenAIRuntimeProvider;
	}
});
Object.defineProperty(exports, "resolveProviderModelMaterializationAuthMode", {
	enumerable: true,
	get: function() {
		return resolveProviderModelMaterializationAuthMode;
	}
});
Object.defineProperty(exports, "resolveProviderModelRouteAuthRequirement", {
	enumerable: true,
	get: function() {
		return resolveProviderModelRouteAuthRequirement;
	}
});
Object.defineProperty(exports, "resolveProviderModelRouteMaterializationAuthMode", {
	enumerable: true,
	get: function() {
		return resolveProviderModelRouteMaterializationAuthMode;
	}
});
Object.defineProperty(exports, "resolveProviderModelRoutes", {
	enumerable: true,
	get: function() {
		return resolveProviderModelRoutes;
	}
});
Object.defineProperty(exports, "resolveSelectedOpenAIRuntimeProvider", {
	enumerable: true,
	get: function() {
		return resolveSelectedOpenAIRuntimeProvider;
	}
});
Object.defineProperty(exports, "selectOpenAIModelRouteAuth", {
	enumerable: true,
	get: function() {
		return selectOpenAIModelRouteAuth;
	}
});
Object.defineProperty(exports, "selectProviderModelAuthSources", {
	enumerable: true,
	get: function() {
		return selectProviderModelAuthSources;
	}
});
Object.defineProperty(exports, "toProviderModelAuthReadiness", {
	enumerable: true,
	get: function() {
		return toProviderModelAuthReadiness;
	}
});
