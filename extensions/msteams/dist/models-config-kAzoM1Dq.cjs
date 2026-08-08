const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_types_models = require("./types.models-BeIsgDJM.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_keyed_async_queue = require("./keyed-async-queue-BXE4i2mb.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_config_env_vars = require("./config-env-vars-Cp6sSeHJ.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_private_file_store = require("./private-file-store-C0DdQCy-.cjs");
const require_model_auth_markers = require("./model-auth-markers-CW9eHIop.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_sqlite = require("./sqlite-CKOduXJ-.cjs");
const require_provider_runtime = require("./provider-runtime-Blezec6-.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_plugin_model_catalog = require("./plugin-model-catalog-DpQe1nnR.cjs");
const require_provider_discovery = require("./provider-discovery-CAaTQOTf.cjs");
const require_models_config_providers_secrets = require("./models-config.providers.secrets-xIseNfr3.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/agents/models-config-state.ts
const MODELS_JSON_STATE_KEY = Symbol.for("operator.modelsJsonState");
const MODELS_JSON_STATE = (() => {
	const globalState = globalThis;
	if (!globalState[MODELS_JSON_STATE_KEY]) globalState[MODELS_JSON_STATE_KEY] = {
		writeQueue: new require_keyed_async_queue.KeyedAsyncQueue(),
		readyCache: /* @__PURE__ */ new Map()
	};
	return globalState[MODELS_JSON_STATE_KEY];
})();
//#endregion
//#region src/agents/models-config.merge.ts
/**
* Merges generated model-provider config with explicit user config and
* preserved secret fields. Setup and doctor flows use this boundary to update
* model catalogs without discarding existing credentials.
*/
function isPositiveFiniteTokenLimit(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function resolvePreferredTokenLimit(params) {
	if (params.explicitPresent && isPositiveFiniteTokenLimit(params.explicitValue)) return params.explicitValue;
	if (isPositiveFiniteTokenLimit(params.implicitValue)) return params.implicitValue;
	return isPositiveFiniteTokenLimit(params.explicitValue) ? params.explicitValue : void 0;
}
function getProviderModelId$1(model) {
	if (!model || typeof model !== "object") return "";
	const id = model.id;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id) ?? "";
}
/** Merges implicit provider models with explicit config while preserving explicit fields. */
function mergeProviderModels(implicit, explicit) {
	const implicitModels = Array.isArray(implicit.models) ? implicit.models : [];
	const explicitModels = Array.isArray(explicit.models) ? explicit.models : [];
	const implicitHeaders = implicit.headers && typeof implicit.headers === "object" && !Array.isArray(implicit.headers) ? implicit.headers : void 0;
	const explicitHeaders = explicit.headers && typeof explicit.headers === "object" && !Array.isArray(explicit.headers) ? explicit.headers : void 0;
	if (implicitModels.length === 0) return {
		...implicit,
		...explicit,
		...implicitHeaders || explicitHeaders ? { headers: {
			...implicitHeaders,
			...explicitHeaders
		} } : {}
	};
	const implicitById = new Map(implicitModels.map((model) => [getProviderModelId$1(model), model]).filter(([id]) => Boolean(id)));
	const seen = /* @__PURE__ */ new Set();
	const mergedModels = explicitModels.map((explicitModel) => {
		const id = getProviderModelId$1(explicitModel);
		if (!id) return explicitModel;
		seen.add(id);
		const implicitModel = implicitById.get(id);
		if (!implicitModel) return explicitModel;
		const contextWindow = resolvePreferredTokenLimit({
			explicitPresent: "contextWindow" in explicitModel,
			explicitValue: explicitModel.contextWindow,
			implicitValue: implicitModel.contextWindow
		});
		const contextTokens = resolvePreferredTokenLimit({
			explicitPresent: "contextTokens" in explicitModel,
			explicitValue: explicitModel.contextTokens,
			implicitValue: implicitModel.contextTokens
		});
		const maxTokens = resolvePreferredTokenLimit({
			explicitPresent: "maxTokens" in explicitModel,
			explicitValue: explicitModel.maxTokens,
			implicitValue: implicitModel.maxTokens
		});
		return Object.assign({}, explicitModel, {
			input: "input" in explicitModel ? explicitModel.input : implicitModel.input,
			reasoning: `reasoning` in explicitModel ? explicitModel.reasoning : implicitModel.reasoning
		}, contextWindow === void 0 ? {} : { contextWindow }, contextTokens === void 0 ? {} : { contextTokens }, maxTokens === void 0 ? {} : { maxTokens });
	});
	for (const implicitModel of implicitModels) {
		const id = getProviderModelId$1(implicitModel);
		if (!id || seen.has(id)) continue;
		seen.add(id);
		mergedModels.push(implicitModel);
	}
	return {
		...implicit,
		...explicit,
		...implicitHeaders || explicitHeaders ? { headers: {
			...implicitHeaders,
			...explicitHeaders
		} } : {},
		models: mergedModels
	};
}
/** Merges implicit and explicit provider config maps by provider id. */
function mergeProviders(params) {
	const out = params.implicit ? { ...params.implicit } : {};
	for (const [key, explicit] of Object.entries(params.explicit ?? {})) {
		const providerKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(key) ?? "";
		if (!providerKey) continue;
		const implicit = out[providerKey];
		out[providerKey] = implicit ? mergeProviderModels(implicit, explicit) : explicit;
	}
	return out;
}
function resolveProviderApi(entry) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.api);
}
function resolveModelApiSurface(entry) {
	if (!Array.isArray(entry?.models)) return;
	const apis = entry.models.flatMap((model) => {
		if (!model || typeof model !== "object") return [];
		const api = model.api;
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(api);
		return normalized ? [normalized] : [];
	}).toSorted();
	return apis.length > 0 ? JSON.stringify(apis) : void 0;
}
function resolveProviderApiSurface(entry) {
	return resolveProviderApi(entry) ?? resolveModelApiSurface(entry);
}
function shouldPreserveExistingApiKey(params) {
	const { providerKey, existing, nextEntry, secretRefManagedProviders } = params;
	const nextApiKey = typeof nextEntry.apiKey === "string" ? nextEntry.apiKey : "";
	if (nextApiKey && require_model_auth_markers.isNonSecretApiKeyMarker(nextApiKey)) return false;
	return !secretRefManagedProviders.has(providerKey) && typeof existing.apiKey === "string" && existing.apiKey.length > 0 && !require_model_auth_markers.isNonSecretApiKeyMarker(existing.apiKey, { includeEnvVarName: false });
}
function shouldPreserveExistingBaseUrl(params) {
	const { existing, nextEntry } = params;
	if (typeof existing.baseUrl !== "string" || existing.baseUrl.length === 0) return false;
	const existingApi = resolveProviderApiSurface(existing);
	const nextApi = resolveProviderApiSurface(nextEntry);
	return !existingApi || !nextApi || existingApi === nextApi;
}
function isExistingProviderSelfContained(entry) {
	if (!Array.isArray(entry.models) || entry.models.length === 0) return true;
	return Boolean(entry.baseUrl?.trim() && entry.apiKey);
}
/** Merges generated provider config with existing secrets safe to preserve. */
function mergeWithExistingProviderSecrets(params) {
	const { nextProviders, existingProviders, secretRefManagedProviders } = params;
	const mergedProviders = {};
	for (const [key, entry] of Object.entries(existingProviders)) {
		if (!isExistingProviderSelfContained(entry)) continue;
		mergedProviders[key] = entry;
	}
	for (const [key, newEntry] of Object.entries(nextProviders)) {
		const existing = existingProviders[key];
		if (!existing) {
			mergedProviders[key] = newEntry;
			continue;
		}
		const preserved = {};
		if (shouldPreserveExistingApiKey({
			providerKey: key,
			existing,
			nextEntry: newEntry,
			secretRefManagedProviders
		})) preserved.apiKey = existing.apiKey;
		if (shouldPreserveExistingBaseUrl({
			existing,
			nextEntry: newEntry
		})) preserved.baseUrl = existing.baseUrl;
		mergedProviders[key] = {
			...newEntry,
			...preserved
		};
	}
	return mergedProviders;
}
//#endregion
//#region src/agents/models-config.providers.implicit.ts
/**
* Discovers implicit model-provider config from plugin provider catalogs and
* static catalogs. It merges discovered provider models with explicit config
* while preserving user-controlled provider fields.
*/
const log = require_subsystem.createSubsystemLogger("agents/model-providers");
const PROVIDER_IMPLICIT_MERGERS = { ollama: ({ implicit }) => implicit };
const PLUGIN_DISCOVERY_ORDERS = [
	"simple",
	"profile",
	"paired",
	"late"
];
function resolveLiveProviderCatalogTimeoutMs(env) {
	if (!(env.OPERATOR_LIVE_TEST === "1" || env.OPERATOR_LIVE_GATEWAY === "1" || env.LIVE === "1")) return null;
	const raw = env.OPERATOR_LIVE_PROVIDER_DISCOVERY_TIMEOUT_MS?.trim();
	if (!raw) return 15e3;
	const parsed = Number(raw);
	return /^[+]?\d+$/.test(raw) && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 15e3;
}
function resolveProviderDiscoveryFilter(params) {
	const { config, workspaceDir, env } = params;
	const testRaw = env.OPERATOR_TEST_ONLY_PROVIDER_PLUGIN_IDS?.trim();
	if (testRaw) {
		const ids = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(testRaw.split(","));
		return ids.length > 0 ? (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(ids) : void 0;
	}
	const scopedProviderIds = params.providerIds ? (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)([...params.providerIds]) : void 0;
	if (scopedProviderIds) return resolveProviderPluginScopeFromProviderIds({
		providerIds: scopedProviderIds,
		config,
		workspaceDir,
		env,
		resolveOwners: params.resolveOwners
	});
	if (!(env.OPERATOR_LIVE_TEST === "1" || env.OPERATOR_LIVE_GATEWAY === "1" || env.LIVE === "1")) return;
	const rawValues = [env.OPERATOR_LIVE_PROVIDERS?.trim(), env.OPERATOR_LIVE_GATEWAY_PROVIDERS?.trim()].filter((value) => Boolean(value && value !== "all"));
	if (rawValues.length === 0) return;
	const ids = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(rawValues.flatMap((value) => value.split(",")));
	if (ids.length === 0) return;
	return resolveProviderPluginScopeFromProviderIds({
		providerIds: ids,
		config,
		workspaceDir,
		env,
		resolveOwners: params.resolveOwners
	});
}
function resolveProviderPluginScopeFromProviderIds(params) {
	const pluginIds = /* @__PURE__ */ new Set();
	for (const id of params.providerIds) {
		const owners = params.resolveOwners?.(id) ?? require_providers.resolveOwningPluginIdsForProviderRef({
			provider: id,
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env
		}) ?? [];
		if (owners.length > 0) {
			for (const owner of owners) pluginIds.add(owner);
			continue;
		}
		pluginIds.add(id);
	}
	return [...pluginIds].toSorted((left, right) => left.localeCompare(right));
}
function resolvePluginMetadataProviderOwners(pluginMetadataSnapshot, provider) {
	if (!pluginMetadataSnapshot) return;
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	if (!normalizedProvider) return;
	const owners = /* @__PURE__ */ new Set();
	appendNormalizedPluginMetadataOwners(owners, pluginMetadataSnapshot.owners.providers ?? /* @__PURE__ */ new Map(), provider, normalizedProvider);
	appendNormalizedPluginMetadataOwners(owners, pluginMetadataSnapshot.owners.modelCatalogProviders ?? /* @__PURE__ */ new Map(), provider, normalizedProvider);
	appendNormalizedPluginMetadataOwners(owners, pluginMetadataSnapshot.owners.setupProviders ?? /* @__PURE__ */ new Map(), provider, normalizedProvider);
	appendNormalizedPluginMetadataOwners(owners, pluginMetadataSnapshot.owners.cliBackends ?? /* @__PURE__ */ new Map(), provider, normalizedProvider);
	return owners.size > 0 ? [...owners].toSorted((left, right) => left.localeCompare(right)) : void 0;
}
function appendNormalizedPluginMetadataOwners(target, ownerMap, provider, normalizedProvider) {
	for (const owner of ownerMap.get(provider) ?? []) target.add(owner);
	if (normalizedProvider !== provider) for (const owner of ownerMap.get(normalizedProvider) ?? []) target.add(owner);
	for (const [ownedId, owners] of ownerMap.entries()) if (ownedId !== provider && ownedId !== normalizedProvider && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(ownedId) === normalizedProvider) for (const owner of owners) target.add(owner);
}
/** Resolve the plugin discovery filter used by implicit provider discovery tests. */
function resolveProviderDiscoveryFilterForTest(params) {
	return resolveProviderDiscoveryFilter(params);
}
/** Resolve provider owner plugin IDs from a preloaded metadata snapshot for tests. */
function resolvePluginMetadataProviderOwnersForTest(pluginMetadataSnapshot, provider) {
	return resolvePluginMetadataProviderOwners(pluginMetadataSnapshot, provider);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.modelsConfigImplicitProvidersTestApi")] = {
	resolvePluginMetadataProviderOwnersForTest,
	resolveProviderDiscoveryFilterForTest
};
function mergeImplicitProviderSet(target, additions) {
	if (!additions) return;
	for (const [key, value] of Object.entries(additions)) target[key] = value;
}
function mergeImplicitProviderConfig(params) {
	const { providerId, existing, implicit } = params;
	if (!existing) return implicit;
	const merge = PROVIDER_IMPLICIT_MERGERS[providerId];
	if (merge) return merge({
		existing,
		implicit
	});
	if (params.dynamicProviderModels) return mergeProviderModels(implicit, existing);
	return {
		...implicit,
		...existing,
		models: Array.isArray(existing.models) && existing.models.length > 0 ? existing.models : implicit.models
	};
}
function resolveImplicitProviderAuthMarker(params) {
	return require_models_config_providers_secrets.resolveMissingProviderApiKey({
		providerKey: params.providerId,
		provider: params.provider,
		env: params.ctx.env,
		profileApiKey: void 0
	});
}
function resolveConfiguredImplicitProvider(params) {
	for (const providerId of params.providerIds) {
		const configured = (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.configuredProviders ?? void 0, providerId);
		if (configured) return configured;
	}
}
function resolveExistingImplicitProviderFromContext(params) {
	return resolveConfiguredImplicitProvider({
		configuredProviders: params.ctx.explicitProviders,
		providerIds: params.providerIds
	}) ?? resolveConfiguredImplicitProvider({
		configuredProviders: params.ctx.config?.models?.providers,
		providerIds: params.providerIds
	});
}
function hasProviderWildcardVisibility(params) {
	return require_model_selection_shared.parseConfiguredModelVisibilityEntries({ cfg: params.config }).providerWildcards.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.providerId));
}
function hasRuntimeProviderCatalog(provider) {
	return typeof provider.catalog?.run === "function" || typeof provider.discovery?.run === "function";
}
async function resolvePluginImplicitProviders(ctx, providers, order) {
	const byOrder = require_provider_discovery.groupPluginDiscoveryProvidersByOrder(providers);
	const discovered = {};
	const catalogConfig = buildPluginCatalogConfig(ctx);
	for (const provider of byOrder[order]) {
		const resolveCatalogProviderApiKey = (providerId) => {
			const resolvedProviderId = providerId?.trim() || provider.id;
			const resolved = ctx.resolveProviderApiKey(resolvedProviderId);
			if (resolved.apiKey) return resolved;
			if (!(0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)({
				[provider.id]: true,
				...Object.fromEntries((provider.aliases ?? []).map((alias) => [alias, true])),
				...Object.fromEntries((provider.hookAliases ?? []).map((alias) => [alias, true]))
			}, resolvedProviderId)) return resolved;
			const syntheticApiKey = (provider.resolveSyntheticAuth?.({
				config: catalogConfig,
				provider: resolvedProviderId,
				providerConfig: catalogConfig.models?.providers?.[resolvedProviderId]
			}))?.apiKey?.trim();
			if (!syntheticApiKey) return resolved;
			return {
				apiKey: require_model_auth_markers.isNonSecretApiKeyMarker(syntheticApiKey) ? syntheticApiKey : require_model_auth_markers.resolveNonEnvSecretRefApiKeyMarker("file"),
				discoveryApiKey: void 0
			};
		};
		const useStaticCatalog = Boolean(provider.staticCatalog) && (ctx.providerDiscoveryEntriesOnly === true || !hasRuntimeProviderCatalog(provider));
		let result = useStaticCatalog ? await require_provider_discovery.runProviderStaticCatalog({
			provider,
			config: catalogConfig,
			agentDir: ctx.agentDir,
			workspaceDir: ctx.workspaceDir,
			env: ctx.env
		}) : await runProviderCatalogWithTimeout({
			provider,
			config: catalogConfig,
			agentDir: ctx.agentDir,
			workspaceDir: ctx.workspaceDir,
			env: ctx.env,
			resolveProviderApiKey: resolveCatalogProviderApiKey,
			resolveProviderAuth: (providerId, options) => ctx.resolveProviderAuth(providerId?.trim() || provider.id, options),
			timeoutMs: ctx.providerDiscoveryTimeoutMs ?? resolveLiveProviderCatalogTimeoutMs(ctx.env)
		});
		if (!result && !useStaticCatalog && provider.staticCatalog) result = await require_provider_discovery.runProviderStaticCatalog({
			provider,
			config: catalogConfig,
			agentDir: ctx.agentDir,
			workspaceDir: ctx.workspaceDir,
			env: ctx.env
		});
		if (!result) continue;
		const normalizedResult = require_provider_discovery.normalizePluginDiscoveryResult({
			provider,
			result
		});
		for (const [providerId, implicitProvider] of Object.entries(normalizedResult)) discovered[providerId] = resolveImplicitProviderAuthMarker({
			ctx,
			providerId,
			provider: mergeImplicitProviderConfig({
				providerId,
				existing: discovered[providerId] ?? resolveExistingImplicitProviderFromContext({
					ctx,
					providerIds: [
						providerId,
						provider.id,
						...provider.aliases ?? [],
						...provider.hookAliases ?? []
					]
				}),
				implicit: implicitProvider,
				dynamicProviderModels: hasProviderWildcardVisibility({
					config: ctx.config,
					providerId
				})
			})
		});
	}
	return Object.keys(discovered).length > 0 ? discovered : void 0;
}
function buildPluginCatalogConfig(ctx) {
	if (!ctx.explicitProviders || Object.keys(ctx.explicitProviders).length === 0) return ctx.config ?? {};
	return {
		...ctx.config,
		models: {
			...ctx.config?.models,
			providers: {
				...ctx.config?.models?.providers,
				...ctx.explicitProviders
			}
		}
	};
}
async function runProviderCatalogWithTimeout(params) {
	const catalogRun = require_provider_discovery.runProviderCatalog(params);
	const timeoutMs = params.timeoutMs ?? void 0;
	if (!timeoutMs) return await catalogRun;
	let timer;
	try {
		return await Promise.race([catalogRun, new Promise((_, reject) => {
			timer = setTimeout(() => {
				reject(/* @__PURE__ */ new Error(`provider catalog timed out after ${timeoutMs}ms: ${params.provider.id}`));
			}, timeoutMs);
			timer.unref?.();
		})]);
	} catch (error) {
		const message = require_errors.formatErrorMessage(error);
		if (message.includes("provider catalog timed out after")) {
			log.warn(`${message}; skipping provider discovery`);
			return;
		}
		throw error;
	} finally {
		if (timer) clearTimeout(timer);
	}
}
/** Resolve all implicit provider configs contributed by runtime plugin discovery. */
async function resolveImplicitProviders(params) {
	const providers = {};
	const env = params.env ?? process.env;
	let authStore;
	const getAuthStore = () => authStore ??= require_store.ensureAuthProfileStore(params.agentDir, {
		allowKeychainPrompt: false,
		externalCliProviderIds: params.providerDiscoveryProviderIds
	});
	const context = {
		...params,
		get authStore() {
			return getAuthStore();
		},
		env,
		resolveProviderApiKey: require_models_config_providers_secrets.createProviderApiKeyResolver(env, getAuthStore, params.config),
		resolveProviderAuth: require_models_config_providers_secrets.createProviderAuthResolver(env, getAuthStore, params.config)
	};
	const discoveryProviders = await require_provider_discovery.resolveRuntimePluginDiscoveryProviders({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env,
		onlyPluginIds: resolveProviderDiscoveryFilter({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env,
			resolveOwners: params.pluginMetadataSnapshot ? (provider) => resolvePluginMetadataProviderOwners(params.pluginMetadataSnapshot, provider) : void 0,
			providerIds: params.providerDiscoveryProviderIds
		}),
		...params.pluginMetadataSnapshot ? { pluginMetadataSnapshot: params.pluginMetadataSnapshot } : {},
		...params.providerDiscoveryEntriesOnly === true ? { discoveryEntriesOnly: true } : {}
	});
	for (const order of PLUGIN_DISCOVERY_ORDERS) mergeImplicitProviderSet(providers, await resolvePluginImplicitProviders(context, discoveryProviders, order));
	return providers;
}
//#endregion
//#region src/agents/models-config.providers.policy.lookup.ts
/**
* Resolves provider plugin lookup keys from provider config aliases.
*/
const GENERIC_PROVIDER_APIS = /* @__PURE__ */ new Set([
	"openai-completions",
	"openai-responses",
	"anthropic-messages",
	"google-generative-ai"
]);
function resolveProviderPluginLookupKey(providerKey, provider) {
	const api = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(provider?.api) ?? "";
	if (providerKey === "google-antigravity" || providerKey === "google-vertex" || api === "google-generative-ai") return "google";
	if (Array.isArray(provider?.models) && provider.models.some((model) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(model.api) === "google-generative-ai")) return "google";
	if (api && require_types_models.MODEL_APIS.includes(api) && !GENERIC_PROVIDER_APIS.has(api)) return api;
	return providerKey;
}
//#endregion
//#region src/agents/models-config.providers.policy.runtime.ts
/**
* Runtime-policy bridge for provider config normalization. These helpers call
* plugin hooks without triggering runtime plugin loading from config assembly.
*/
/** Apply provider native-streaming usage compatibility policy. */
function applyProviderNativeStreamingUsagePolicy(providerKey, provider) {
	return require_provider_runtime.applyProviderNativeStreamingUsageCompatWithPlugin({
		provider: resolveProviderPluginLookupKey(providerKey, provider),
		allowRuntimePluginLoad: false,
		context: {
			provider: providerKey,
			providerConfig: provider
		}
	}) ?? provider;
}
/** Normalize provider config through any already-available plugin policy hook. */
function normalizeProviderConfigPolicy(providerKey, provider) {
	return require_provider_runtime.normalizeProviderConfigWithPlugin({
		provider: resolveProviderPluginLookupKey(providerKey, provider),
		allowRuntimePluginLoad: false,
		context: {
			provider: providerKey,
			providerConfig: provider
		}
	}) ?? provider;
}
/** Resolve a provider API-key policy function from already-available plugin hooks. */
function resolveProviderConfigApiKeyPolicy(providerKey, provider) {
	const runtimeProviderKey = resolveProviderPluginLookupKey(providerKey, provider).trim();
	return (env) => require_provider_runtime.resolveProviderConfigApiKeyWithPlugin({
		provider: runtimeProviderKey,
		allowRuntimePluginLoad: false,
		context: {
			provider: providerKey,
			env
		}
	});
}
//#endregion
//#region src/agents/models-config.providers.policy.ts
/**
* Applies provider plugin policy to configured model provider settings.
*/
/**
* Provider-specific config policy adapters.
*
* Runtime policy rules live in the sibling runtime module; this file exposes the
* small stable API used by models-config loading and tests.
*/
/** Applies native-streaming usage compatibility policy to the provider map. */
function applyNativeStreamingUsageCompat(providers) {
	let changed = false;
	const nextProviders = {};
	for (const [providerKey, provider] of Object.entries(providers)) {
		const nextProvider = applyProviderNativeStreamingUsagePolicy(providerKey, provider);
		nextProviders[providerKey] = nextProvider;
		changed ||= nextProvider !== provider;
	}
	return changed ? nextProviders : providers;
}
/** Normalizes a provider config according to provider-specific runtime policy. */
function normalizeProviderSpecificConfig(providerKey, provider) {
	const normalized = normalizeProviderConfigPolicy(providerKey, provider);
	if (normalized && normalized !== provider) return normalized;
	return provider;
}
/** Resolves a provider-specific API key env lookup policy when one exists. */
function resolveProviderConfigApiKeyResolver(providerKey, provider) {
	return resolveProviderConfigApiKeyPolicy(providerKey, provider);
}
//#endregion
//#region src/agents/models-config.providers.source-managed.ts
function normalizeSourceProviderLookup(providers) {
	if (!providers) return {};
	const out = {};
	for (const [key, provider] of Object.entries(providers)) {
		const normalizedKey = key.trim();
		if (!normalizedKey || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(provider)) continue;
		out[normalizedKey] = provider;
	}
	return out;
}
function resolveSourceManagedApiKeyMarker(params) {
	const sourceApiKeyRef = require_types_secrets.resolveSecretInputRef({
		value: params.sourceProvider?.apiKey,
		defaults: params.sourceSecretDefaults
	}).ref;
	if (!sourceApiKeyRef?.id.trim()) return;
	return sourceApiKeyRef.source === "env" ? sourceApiKeyRef.id.trim() : require_model_auth_markers.resolveNonEnvSecretRefApiKeyMarker(sourceApiKeyRef.source);
}
function resolveSourceManagedHeaderMarkers(params) {
	const sourceHeaders = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.sourceProvider?.headers) ? params.sourceProvider.headers : void 0;
	if (!sourceHeaders) return {};
	const markers = {};
	for (const [headerName, headerValue] of Object.entries(sourceHeaders)) {
		const sourceHeaderRef = require_types_secrets.resolveSecretInputRef({
			value: headerValue,
			defaults: params.sourceSecretDefaults
		}).ref;
		if (!sourceHeaderRef?.id.trim()) continue;
		markers[headerName] = sourceHeaderRef.source === "env" ? require_model_auth_markers.resolveEnvSecretRefHeaderValueMarker(sourceHeaderRef.id) : require_model_auth_markers.resolveNonEnvSecretRefHeaderValueMarker(sourceHeaderRef.source);
	}
	return markers;
}
/** Preserves source-managed apiKey/header markers from the original provider config. */
function enforceSourceManagedProviderSecrets(params) {
	const { providers } = params;
	if (!providers) return providers;
	const sourceProvidersByKey = normalizeSourceProviderLookup(params.sourceProviders);
	if (Object.keys(sourceProvidersByKey).length === 0) return providers;
	let nextProviders = null;
	for (const [providerKey, provider] of Object.entries(providers)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(provider)) continue;
		const sourceProvider = sourceProvidersByKey[providerKey.trim()];
		if (!sourceProvider) continue;
		let nextProvider = provider;
		let providerMutated = false;
		const sourceApiKeyMarker = resolveSourceManagedApiKeyMarker({
			sourceProvider,
			sourceSecretDefaults: params.sourceSecretDefaults
		});
		if (sourceApiKeyMarker) {
			params.secretRefManagedProviders?.add(providerKey.trim());
			if (nextProvider.apiKey !== sourceApiKeyMarker) {
				providerMutated = true;
				nextProvider = {
					...nextProvider,
					apiKey: sourceApiKeyMarker
				};
			}
		}
		const sourceHeaderMarkers = resolveSourceManagedHeaderMarkers({
			sourceProvider,
			sourceSecretDefaults: params.sourceSecretDefaults
		});
		if (Object.keys(sourceHeaderMarkers).length > 0) {
			const currentHeaders = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(nextProvider.headers) ? nextProvider.headers : void 0;
			const nextHeaders = { ...currentHeaders };
			let headersMutated = !currentHeaders;
			for (const [headerName, marker] of Object.entries(sourceHeaderMarkers)) {
				if (nextHeaders[headerName] === marker) continue;
				headersMutated = true;
				nextHeaders[headerName] = marker;
			}
			if (headersMutated) {
				providerMutated = true;
				nextProvider = {
					...nextProvider,
					headers: nextHeaders
				};
			}
		}
		if (!providerMutated) continue;
		if (!nextProviders) nextProviders = { ...providers };
		nextProviders[providerKey] = nextProvider;
	}
	return nextProviders ?? providers;
}
//#endregion
//#region src/agents/models-config.providers.normalize.ts
function getProviderModelId(model) {
	return typeof model.id === "string" && model.id.trim() ? model.id : void 0;
}
function mergeNormalizedProviderModel(existing, incoming) {
	return {
		...incoming,
		...existing,
		...existing.cost || incoming.cost ? { cost: {
			...incoming.cost,
			...existing.cost
		} } : void 0
	};
}
function normalizeProviderModelsForConfig(providerKey, provider, options = {}) {
	if (!Array.isArray(provider.models) || provider.models.length === 0) return {
		provider,
		mutated: false
	};
	let mutated = false;
	const nextModels = [];
	const seenById = /* @__PURE__ */ new Map();
	for (const model of provider.models) {
		const rawId = getProviderModelId(model);
		const normalizedId = rawId ? require_model_selection_normalize.normalizeConfiguredProviderCatalogModelId(providerKey, rawId, { manifestPlugins: options.manifestPlugins }) : rawId;
		const normalizedModel = normalizedId && normalizedId !== rawId ? {
			...model,
			id: normalizedId
		} : model;
		if (normalizedModel !== model) mutated = true;
		const id = getProviderModelId(normalizedModel);
		if (id) {
			const existingIndex = seenById.get(id);
			if (existingIndex !== void 0) {
				mutated = true;
				const existing = nextModels.at(existingIndex);
				if (existing) nextModels[existingIndex] = mergeNormalizedProviderModel(existing, normalizedModel);
				continue;
			}
			seenById.set(id, nextModels.length);
		}
		nextModels.push(normalizedModel);
	}
	return mutated ? {
		provider: {
			...provider,
			models: nextModels
		},
		mutated
	} : {
		provider,
		mutated
	};
}
function normalizeProviderCatalogModelsForConfig(providers, options = {}) {
	if (!providers) return providers;
	let mutated = false;
	const next = {};
	for (const [providerKey, provider] of Object.entries(providers)) {
		const normalized = normalizeProviderModelsForConfig(providerKey, provider, options);
		if (normalized.mutated) mutated = true;
		next[providerKey] = normalized.provider;
	}
	return mutated ? next : providers;
}
function normalizeProviders(params) {
	const { providers } = params;
	if (!providers) return providers;
	const env = params.env ?? process.env;
	let authStore;
	const resolveProfileApiKey = (providerKey) => {
		authStore ??= require_store.ensureAuthProfileStore(params.agentDir, { allowKeychainPrompt: false });
		return require_models_config_providers_secrets.resolveApiKeyFromProfiles({
			provider: providerKey,
			store: authStore,
			env
		});
	};
	let mutated = false;
	const next = {};
	for (const [key, provider] of Object.entries(providers)) {
		const normalizedKey = key.trim();
		if (!normalizedKey) {
			mutated = true;
			continue;
		}
		if (normalizedKey !== key) mutated = true;
		let normalizedProvider = provider;
		const normalizedHeaders = require_models_config_providers_secrets.normalizeHeaderValues({
			headers: normalizedProvider.headers,
			secretDefaults: params.secretDefaults
		});
		if (normalizedHeaders.mutated) {
			mutated = true;
			normalizedProvider = {
				...normalizedProvider,
				headers: normalizedHeaders.headers
			};
		}
		const providerWithConfiguredApiKey = require_models_config_providers_secrets.normalizeConfiguredProviderApiKey({
			providerKey: normalizedKey,
			provider: normalizedProvider,
			secretDefaults: params.secretDefaults,
			profileApiKey: void 0,
			secretRefManagedProviders: params.secretRefManagedProviders
		});
		if (providerWithConfiguredApiKey !== normalizedProvider) {
			mutated = true;
			normalizedProvider = providerWithConfiguredApiKey;
		}
		const providerWithResolvedEnvApiKey = require_models_config_providers_secrets.normalizeResolvedEnvApiKey({
			providerKey: normalizedKey,
			provider: normalizedProvider,
			env,
			secretRefManagedProviders: params.secretRefManagedProviders
		});
		if (providerWithResolvedEnvApiKey !== normalizedProvider) {
			mutated = true;
			normalizedProvider = providerWithResolvedEnvApiKey;
		}
		const needsProfileApiKey = Array.isArray(normalizedProvider.models) && normalizedProvider.models.length > 0 && !(typeof normalizedProvider.apiKey === "string" && normalizedProvider.apiKey.trim() || normalizedProvider.apiKey);
		const profileApiKey = needsProfileApiKey ? resolveProfileApiKey(normalizedKey) : void 0;
		const providerApiKeyResolver = needsProfileApiKey ? resolveProviderConfigApiKeyResolver(normalizedKey) : void 0;
		const providerWithApiKey = require_models_config_providers_secrets.resolveMissingProviderApiKey({
			providerKey: normalizedKey,
			provider: normalizedProvider,
			env,
			profileApiKey,
			secretRefManagedProviders: params.secretRefManagedProviders,
			providerApiKeyResolver
		});
		if (providerWithApiKey !== normalizedProvider) {
			mutated = true;
			normalizedProvider = providerWithApiKey;
		}
		const providerSpecificNormalized = normalizeProviderSpecificConfig(normalizedKey, normalizedProvider);
		if (providerSpecificNormalized !== normalizedProvider) {
			mutated = true;
			normalizedProvider = providerSpecificNormalized;
		}
		const providerWithNormalizedModels = normalizeProviderModelsForConfig(normalizedKey, normalizedProvider, { manifestPlugins: params.manifestPlugins });
		if (providerWithNormalizedModels.mutated) {
			mutated = true;
			normalizedProvider = providerWithNormalizedModels.provider;
		}
		const existing = next[normalizedKey];
		if (existing) {
			mutated = true;
			next[normalizedKey] = {
				...existing,
				...normalizedProvider,
				models: normalizedProvider.models ?? existing.models
			};
			continue;
		}
		next[normalizedKey] = normalizedProvider;
	}
	return enforceSourceManagedProviderSecrets({
		providers: mutated ? next : providers,
		sourceProviders: params.sourceProviders,
		sourceSecretDefaults: params.sourceSecretDefaults,
		secretRefManagedProviders: params.secretRefManagedProviders
	});
}
//#endregion
//#region src/agents/models-config.plan.ts
function splitProvidersByPluginOwner(params) {
	const rootProviders = {};
	const pluginProviders = {};
	for (const [providerId, provider] of Object.entries(params.providers)) {
		const pluginId = require_plugin_model_catalog.resolvePluginModelCatalogOwnerPluginId({
			providerId,
			pluginMetadataSnapshot: params.pluginMetadataSnapshot
		});
		if (!pluginId) {
			rootProviders[providerId] = provider;
			continue;
		}
		const pluginCatalog = pluginProviders[pluginId] ??= {};
		pluginCatalog[providerId] = provider;
	}
	return {
		rootProviders,
		pluginProviders
	};
}
function buildPluginCatalogWrites(pluginProviders) {
	return Object.fromEntries(Object.entries(pluginProviders).map(([pluginId, providers]) => [require_plugin_model_catalog.encodePluginModelCatalogRelativePath(pluginId), `${JSON.stringify({
		generatedBy: require_plugin_model_catalog.PLUGIN_MODEL_CATALOG_GENERATED_BY,
		providers
	}, null, 2)}\n`]));
}
/** Resolves providers for models.json with injectable implicit-provider discovery. */
async function resolveProvidersForModelsJsonWithDeps(params, deps) {
	const { agentDir, env } = params;
	const explicitProviders = stripBlankProviderBaseUrls(params.cfg.models?.providers ?? {});
	const cfg = params.cfg.models?.providers ? {
		...params.cfg,
		models: {
			...params.cfg.models,
			providers: explicitProviders
		}
	} : params.cfg;
	if (cfg.models?.mode === "replace") return mergeProviders({
		implicit: {},
		explicit: explicitProviders
	});
	return mergeProviders({
		implicit: await (deps?.resolveImplicitProviders ?? resolveImplicitProviders)({
			agentDir,
			config: cfg,
			env,
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
			explicitProviders,
			...params.pluginMetadataSnapshot ? { pluginMetadataSnapshot: params.pluginMetadataSnapshot } : {},
			...params.providerDiscoveryProviderIds ? { providerDiscoveryProviderIds: params.providerDiscoveryProviderIds } : {},
			...params.providerDiscoveryTimeoutMs !== void 0 ? { providerDiscoveryTimeoutMs: params.providerDiscoveryTimeoutMs } : {},
			...params.providerDiscoveryEntriesOnly === true ? { providerDiscoveryEntriesOnly: true } : {}
		}),
		explicit: explicitProviders
	});
}
function stripBlankProviderBaseUrls(providers) {
	let mutated = false;
	const next = {};
	for (const [key, provider] of Object.entries(providers)) {
		if (typeof provider?.baseUrl === "string" && provider.baseUrl.trim() === "") {
			const { baseUrl: _blank, ...rest } = provider;
			next[key] = rest;
			mutated = true;
			continue;
		}
		next[key] = provider;
	}
	return mutated ? next : providers;
}
function resolveProvidersForMode(params) {
	if (params.mode !== "merge") return params.providers;
	const existing = params.existingParsed;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(existing.providers)) return params.providers;
	const existingProviders = existing.providers;
	return mergeWithExistingProviderSecrets({
		nextProviders: params.providers,
		existingProviders,
		secretRefManagedProviders: params.secretRefManagedProviders
	});
}
function isWritableProviderConfig(provider) {
	if (!Array.isArray(provider.models) || provider.models.length === 0) return true;
	return Boolean(provider.baseUrl?.trim() && provider.apiKey);
}
function filterWritableProviders(providers) {
	const next = Object.fromEntries(Object.entries(providers).filter(([, provider]) => isWritableProviderConfig(provider)));
	return Object.keys(next).length === Object.keys(providers).length ? providers : next;
}
/** Plans root and plugin-owned model catalog writes with injectable provider discovery. */
async function planOperatorModelsJsonWithDeps(params, deps) {
	const { cfg, agentDir, env } = params;
	const providers = await resolveProvidersForModelsJsonWithDeps({
		cfg,
		agentDir,
		env,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		...params.pluginMetadataSnapshot ? { pluginMetadataSnapshot: params.pluginMetadataSnapshot } : {},
		...params.providerDiscoveryProviderIds ? { providerDiscoveryProviderIds: params.providerDiscoveryProviderIds } : {},
		...params.providerDiscoveryTimeoutMs !== void 0 ? { providerDiscoveryTimeoutMs: params.providerDiscoveryTimeoutMs } : {},
		...params.providerDiscoveryEntriesOnly === true ? { providerDiscoveryEntriesOnly: true } : {}
	}, deps);
	if (Object.keys(providers).length === 0) {
		if (params.cfg.models?.mode === "replace") return {
			action: "write",
			contents: `${JSON.stringify({ providers: {} }, null, 2)}\n`,
			pluginCatalogWrites: {}
		};
		return { action: "skip" };
	}
	const mode = cfg.models?.mode ?? "merge";
	const secretRefManagedProviders = /* @__PURE__ */ new Set();
	const manifestPlugins = params.pluginMetadataSnapshot?.manifestRegistry.plugins;
	const normalizedProviders = normalizeProviders({
		providers,
		agentDir,
		env,
		secretDefaults: cfg.secrets?.defaults,
		sourceProviders: params.sourceConfigForSecrets?.models?.providers,
		sourceSecretDefaults: params.sourceConfigForSecrets?.secrets?.defaults,
		secretRefManagedProviders,
		manifestPlugins
	}) ?? providers;
	const mergedProviders = resolveProvidersForMode({
		mode,
		existingParsed: params.existingParsed,
		providers: normalizedProviders,
		secretRefManagedProviders
	});
	const normalizedMergedProviders = normalizeProviderCatalogModelsForConfig(mergedProviders, { manifestPlugins }) ?? mergedProviders;
	const splitProviders = splitProvidersByPluginOwner({
		providers: applyNativeStreamingUsageCompat(filterWritableProviders(enforceSourceManagedProviderSecrets({
			providers: normalizedMergedProviders,
			sourceProviders: params.sourceConfigForSecrets?.models?.providers,
			sourceSecretDefaults: params.sourceConfigForSecrets?.secrets?.defaults,
			secretRefManagedProviders
		}) ?? normalizedMergedProviders)),
		pluginMetadataSnapshot: params.pluginMetadataSnapshot
	});
	const pluginCatalogWrites = buildPluginCatalogWrites(splitProviders.pluginProviders);
	const nextContents = `${JSON.stringify({ providers: splitProviders.rootProviders }, null, 2)}\n`;
	if (params.existingRaw === nextContents && Object.keys(pluginCatalogWrites).length === 0) return {
		action: "noop",
		pluginCatalogWrites
	};
	return {
		action: "write",
		contents: nextContents,
		pluginCatalogWrites
	};
}
/** Plans root and plugin-owned model catalog writes for the current runtime. */
async function planOperatorModelsJson(params) {
	return planOperatorModelsJsonWithDeps(params);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.modelsConfigPlanTestApi")] = {
	planOperatorModelsJsonWithDeps,
	resolveProvidersForModelsJsonWithDeps
};
//#endregion
//#region src/agents/models-config.ts
/**
* Ensures the agent-local models.json and plugin model catalog sidecars match
* runtime config, discovered providers, auth-profile state, and generated
* catalog ownership.
*/
var models_config_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildModelsJsonSourceFingerprint: () => buildModelsJsonSourceFingerprint,
	ensureOperatorModelsJson: () => ensureOperatorModelsJson,
	prepareOperatorModelsJsonSource: () => prepareOperatorModelsJsonSource
});
async function readFileMtimeMs(pathname) {
	try {
		const stat = await node_fs_promises.default.stat(pathname);
		return Number.isFinite(stat.mtimeMs) ? stat.mtimeMs : null;
	} catch {
		return null;
	}
}
async function readPluginCatalogMtimes(agentDir) {
	return (await Promise.all(require_plugin_model_catalog.listPluginModelCatalogRelativePaths(agentDir).map(async (relativePath) => {
		return [relativePath, await readFileMtimeMs(node_path.default.join(agentDir, relativePath))];
	}))).toSorted(([left], [right]) => left.localeCompare(right));
}
async function buildModelsJsonFingerprint(params) {
	const authProfilesSqlitePath = require_sqlite.resolveAuthProfileDatabasePath(params.agentDir);
	const authProfilesMtimeMs = await readFileMtimeMs(authProfilesSqlitePath);
	const authProfilesWalMtimeMs = await readFileMtimeMs(`${authProfilesSqlitePath}-wal`);
	const modelsFileMtimeMs = await readFileMtimeMs(node_path.default.join(params.agentDir, "models.json"));
	const pluginCatalogMtimes = await readPluginCatalogMtimes(params.agentDir);
	const envShape = require_config_env_vars.createConfigRuntimeEnv(params.config, {});
	const pluginMetadataSnapshotIndexFingerprint = params.pluginMetadataSnapshot ? require_current_plugin_metadata_snapshot.resolveInstalledManifestRegistryIndexFingerprint(params.pluginMetadataSnapshot.index) : void 0;
	return require_stable_stringify.stableStringify({
		config: params.config,
		sourceConfigForSecrets: params.sourceConfigForSecrets,
		envShape,
		authProfilesMtimeMs,
		authProfilesWalMtimeMs,
		modelsFileMtimeMs,
		pluginCatalogMtimes,
		workspaceDir: params.workspaceDir,
		pluginMetadataSnapshotIndexFingerprint,
		providerDiscoveryProviderIds: params.providerDiscoveryProviderIds,
		providerDiscoveryTimeoutMs: params.providerDiscoveryTimeoutMs,
		providerDiscoveryEntriesOnly: params.providerDiscoveryEntriesOnly === true
	});
}
function modelsJsonReadyCacheKey(targetPath, fingerprint) {
	return `${targetPath}\0${fingerprint}`;
}
async function readExistingModelsFile(pathname) {
	try {
		const raw = await require_private_file_store.privateFileStore(node_path.default.dirname(pathname)).readTextIfExists(node_path.default.basename(pathname));
		if (raw === null) return {
			raw: "",
			parsed: null
		};
		return {
			raw,
			parsed: JSON.parse(raw)
		};
	} catch {
		return {
			raw: "",
			parsed: null
		};
	}
}
/** Best-effort chmod for generated models.json and plugin catalog files. */
async function ensureModelsFileModeForModelsJson(pathname) {
	await node_fs_promises.default.chmod(pathname, 384).catch(() => {});
}
/** Atomic private-file-store write used by models.json generation. */
async function writeModelsFileAtomicForModelsJson(targetPath, contents) {
	await require_private_file_store.privateFileStore(node_path.default.dirname(targetPath)).writeText(node_path.default.basename(targetPath), contents);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.modelsConfigTestApi")] = {
	ensureModelsFileModeForModelsJson,
	writeModelsFileAtomicForModelsJson
};
async function isGeneratedPluginCatalogFile(targetPath) {
	return await readGeneratedPluginCatalog(targetPath) !== void 0;
}
async function readGeneratedPluginCatalog(targetPath) {
	const parsed = (await readExistingModelsFile(targetPath)).parsed;
	return require_plugin_model_catalog.isGeneratedPluginModelCatalog(parsed) ? parsed : void 0;
}
function isRecordLike(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
async function mergeGeneratedPluginCatalogProvidersIntoExistingParsed(params) {
	const root = isRecordLike(params.existingParsed) ? params.existingParsed : {};
	const providers = isRecordLike(root.providers) ? { ...root.providers } : {};
	let changed = false;
	for (const relativePath of require_plugin_model_catalog.listPluginModelCatalogRelativePaths(params.agentDir)) {
		const catalogPluginId = require_plugin_model_catalog.decodePluginModelCatalogRelativePathPluginId(relativePath);
		if (!catalogPluginId) continue;
		const catalog = await readGeneratedPluginCatalog(node_path.default.join(params.agentDir, relativePath));
		if (!isRecordLike(catalog) || !isRecordLike(catalog.providers)) continue;
		for (const [providerId, provider] of Object.entries(catalog.providers)) {
			if (require_plugin_model_catalog.resolvePluginModelCatalogOwnerPluginId({
				providerId,
				pluginMetadataSnapshot: params.pluginMetadataSnapshot
			}) !== catalogPluginId) continue;
			providers[providerId] = provider;
			changed = true;
		}
	}
	if (!changed) return params.existingParsed;
	return {
		...root,
		providers
	};
}
async function removeStalePluginCatalogs(params) {
	let wrote = false;
	for (const relativePath of require_plugin_model_catalog.listPluginModelCatalogRelativePaths(params.agentDir)) {
		if (params.activeRelativePaths.has(node_path.default.normalize(relativePath))) continue;
		const targetPath = node_path.default.join(params.agentDir, relativePath);
		if (!await isGeneratedPluginCatalogFile(targetPath)) continue;
		await node_fs_promises.default.unlink(targetPath).catch((error) => {
			if (error.code === "ENOENT") return;
			throw error;
		});
		wrote = true;
	}
	return wrote;
}
async function writePluginCatalogsForModelsJson(params) {
	if (!params.pluginCatalogWrites) return false;
	let wrote = false;
	const activeRelativePaths = /* @__PURE__ */ new Set();
	for (const [relativePath, contents] of Object.entries(params.pluginCatalogWrites)) {
		if (!require_plugin_model_catalog.isPluginModelCatalogRelativePath(relativePath)) continue;
		activeRelativePaths.add(node_path.default.normalize(relativePath));
		const targetPath = node_path.default.join(params.agentDir, relativePath);
		if ((await readExistingModelsFile(targetPath)).raw === contents) {
			await ensureModelsFileModeForModelsJson(targetPath);
			continue;
		}
		await node_fs_promises.default.mkdir(node_path.default.dirname(targetPath), {
			recursive: true,
			mode: 448
		});
		await writeModelsFileAtomicForModelsJson(targetPath, contents);
		await ensureModelsFileModeForModelsJson(targetPath);
		wrote = true;
	}
	const removedStale = await removeStalePluginCatalogs({
		agentDir: params.agentDir,
		activeRelativePaths
	});
	return wrote || removedStale;
}
function resolveModelsConfigInput(config) {
	const runtimeSource = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
	if (!config) {
		const loaded = require_io.getRuntimeConfig();
		return {
			config: runtimeSource ?? loaded,
			sourceConfigForSecrets: runtimeSource ?? loaded
		};
	}
	if (!runtimeSource) return {
		config,
		sourceConfigForSecrets: config
	};
	const projected = require_io.projectConfigOntoRuntimeSourceSnapshot(config);
	return {
		config: projected,
		sourceConfigForSecrets: projected === config ? runtimeSource : projected
	};
}
/** Builds the canonical source freshness fingerprint for generated model catalogs. */
async function buildModelsJsonSourceFingerprint(config, agentDirOverride, options = {}) {
	const resolved = resolveModelsConfigInput(config);
	const cfg = resolved.config;
	const workspaceDir = options.workspaceDir ?? (agentDirOverride?.trim() ? void 0 : require_agent_scope_config.resolveAgentWorkspaceDir(cfg, require_agent_scope_config.resolveDefaultAgentId(cfg)));
	const providerScopedDiscovery = Boolean(options.providerDiscoveryProviderIds?.length);
	const pluginMetadataSnapshot = options.pluginMetadataSnapshot ?? require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: cfg,
		env: require_config_env_vars.createConfigRuntimeEnv(cfg),
		...workspaceDir ? { workspaceDir } : {},
		...providerScopedDiscovery ? { preferPersisted: false } : {}
	});
	const agentDir = agentDirOverride?.trim() ? agentDirOverride.trim() : require_agent_scope_config.resolveDefaultAgentDir(cfg);
	return {
		agentDir,
		fingerprint: await buildModelsJsonFingerprint({
			config: cfg,
			sourceConfigForSecrets: resolved.sourceConfigForSecrets,
			agentDir,
			...workspaceDir ? { workspaceDir } : {},
			...pluginMetadataSnapshot ? { pluginMetadataSnapshot } : {},
			...options.providerDiscoveryProviderIds ? { providerDiscoveryProviderIds: options.providerDiscoveryProviderIds } : {},
			...options.providerDiscoveryTimeoutMs !== void 0 ? { providerDiscoveryTimeoutMs: options.providerDiscoveryTimeoutMs } : {},
			...options.providerDiscoveryEntriesOnly === true ? { providerDiscoveryEntriesOnly: true } : {}
		}),
		...workspaceDir ? { workspaceDir } : {}
	};
}
async function withModelsJsonWriteLock(targetPath, run) {
	return await MODELS_JSON_STATE.writeQueue.enqueue(targetPath, run);
}
/** Ensures models.json and plugin catalog sidecars are current for an agent. */
async function prepareOperatorModelsJsonSource(config, agentDirOverride, options = {}) {
	const resolved = resolveModelsConfigInput(config);
	const cfg = resolved.config;
	const sourceFingerprint = await buildModelsJsonSourceFingerprint(config, agentDirOverride, options);
	const workspaceDir = sourceFingerprint.workspaceDir;
	const pluginMetadataSnapshot = options.pluginMetadataSnapshot ?? require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: cfg,
		env: require_config_env_vars.createConfigRuntimeEnv(cfg),
		...workspaceDir ? { workspaceDir } : {},
		...options.providerDiscoveryProviderIds?.length ? { preferPersisted: false } : {}
	});
	const agentDir = sourceFingerprint.agentDir;
	const targetPath = node_path.default.join(agentDir, "models.json");
	const fingerprint = sourceFingerprint.fingerprint;
	const cacheKey = modelsJsonReadyCacheKey(targetPath, fingerprint);
	const cached = MODELS_JSON_STATE.readyCache.get(cacheKey);
	if (cached) {
		const settled = await cached;
		await ensureModelsFileModeForModelsJson(targetPath);
		return {
			...settled.result,
			fingerprint: settled.fingerprint,
			...workspaceDir ? { workspaceDir } : {}
		};
	}
	const pending = withModelsJsonWriteLock(targetPath, async () => {
		const env = require_config_env_vars.createConfigRuntimeEnv(cfg);
		const existingModelsFile = await readExistingModelsFile(targetPath);
		const existingParsedForMerge = await mergeGeneratedPluginCatalogProvidersIntoExistingParsed({
			agentDir,
			existingParsed: existingModelsFile.parsed,
			...pluginMetadataSnapshot ? { pluginMetadataSnapshot } : {}
		});
		const plan = await planOperatorModelsJson({
			cfg,
			sourceConfigForSecrets: resolved.sourceConfigForSecrets,
			agentDir,
			env,
			...workspaceDir ? { workspaceDir } : {},
			existingRaw: existingModelsFile.raw,
			existingParsed: existingParsedForMerge,
			...pluginMetadataSnapshot ? { pluginMetadataSnapshot } : {},
			...options.providerDiscoveryProviderIds ? { providerDiscoveryProviderIds: options.providerDiscoveryProviderIds } : {},
			...options.providerDiscoveryTimeoutMs !== void 0 ? { providerDiscoveryTimeoutMs: options.providerDiscoveryTimeoutMs } : {},
			...options.providerDiscoveryEntriesOnly === true ? { providerDiscoveryEntriesOnly: true } : {}
		});
		if (plan.action === "skip") {
			const wrotePluginCatalog = await writePluginCatalogsForModelsJson({
				agentDir,
				pluginCatalogWrites: plan.pluginCatalogWrites
			});
			return {
				fingerprint,
				result: {
					agentDir,
					wrote: wrotePluginCatalog
				}
			};
		}
		if (plan.action === "noop") {
			const wrotePluginCatalog = await writePluginCatalogsForModelsJson({
				agentDir,
				pluginCatalogWrites: plan.pluginCatalogWrites
			});
			await ensureModelsFileModeForModelsJson(targetPath);
			return {
				fingerprint,
				result: {
					agentDir,
					wrote: wrotePluginCatalog
				}
			};
		}
		await node_fs_promises.default.mkdir(agentDir, {
			recursive: true,
			mode: 448
		});
		const wroteRoot = existingModelsFile.raw !== plan.contents;
		if (wroteRoot) await writeModelsFileAtomicForModelsJson(targetPath, plan.contents);
		await ensureModelsFileModeForModelsJson(targetPath);
		const wrotePluginCatalog = await writePluginCatalogsForModelsJson({
			agentDir,
			pluginCatalogWrites: plan.pluginCatalogWrites
		});
		return {
			fingerprint,
			result: {
				agentDir,
				wrote: wroteRoot || wrotePluginCatalog
			}
		};
	});
	MODELS_JSON_STATE.readyCache.set(cacheKey, pending);
	try {
		const settled = await pending;
		const refreshedFingerprint = await buildModelsJsonFingerprint({
			config: cfg,
			sourceConfigForSecrets: resolved.sourceConfigForSecrets,
			agentDir,
			...workspaceDir ? { workspaceDir } : {},
			...pluginMetadataSnapshot ? { pluginMetadataSnapshot } : {},
			...options.providerDiscoveryProviderIds ? { providerDiscoveryProviderIds: options.providerDiscoveryProviderIds } : {},
			...options.providerDiscoveryTimeoutMs !== void 0 ? { providerDiscoveryTimeoutMs: options.providerDiscoveryTimeoutMs } : {},
			...options.providerDiscoveryEntriesOnly === true ? { providerDiscoveryEntriesOnly: true } : {}
		});
		const refreshedCacheKey = modelsJsonReadyCacheKey(targetPath, refreshedFingerprint);
		if (refreshedCacheKey !== cacheKey) {
			MODELS_JSON_STATE.readyCache.delete(cacheKey);
			MODELS_JSON_STATE.readyCache.set(refreshedCacheKey, Promise.resolve({
				fingerprint: refreshedFingerprint,
				result: settled.result
			}));
		}
		return {
			...settled.result,
			fingerprint: refreshedFingerprint,
			...workspaceDir ? { workspaceDir } : {}
		};
	} catch (error) {
		if (MODELS_JSON_STATE.readyCache.get(cacheKey) === pending) MODELS_JSON_STATE.readyCache.delete(cacheKey);
		throw error;
	}
}
/** Ensures models.json and plugin catalog sidecars are current for an agent. */
async function ensureOperatorModelsJson(config, agentDirOverride, options = {}) {
	const prepared = await prepareOperatorModelsJsonSource(config, agentDirOverride, options);
	return {
		agentDir: prepared.agentDir,
		wrote: prepared.wrote
	};
}
//#endregion
Object.defineProperty(exports, "buildModelsJsonSourceFingerprint", {
	enumerable: true,
	get: function() {
		return buildModelsJsonSourceFingerprint;
	}
});
Object.defineProperty(exports, "ensureOperatorModelsJson", {
	enumerable: true,
	get: function() {
		return ensureOperatorModelsJson;
	}
});
Object.defineProperty(exports, "models_config_exports", {
	enumerable: true,
	get: function() {
		return models_config_exports;
	}
});
Object.defineProperty(exports, "prepareOperatorModelsJsonSource", {
	enumerable: true,
	get: function() {
		return prepareOperatorModelsJsonSource;
	}
});
