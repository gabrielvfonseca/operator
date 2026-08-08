const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime_workspace_state = require("./runtime-workspace-state-C4MmR84x.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_module = require("node:module");
let _gabrielvfonseca_model_catalog_core_provider_model_id_normalization = require("@gabrielvfonseca/model-catalog-core/provider-model-id-normalization");
//#region src/plugins/manifest-model-id-normalization.ts
/** Applies manifest-declared model-id normalization policies to provider model refs. */
let cachedPolicies;
function resolveMetadataSnapshotForPolicies(params = {}) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? require_runtime_workspace_state.getActivePluginRegistryWorkspaceDirFromState();
	if (params.config === void 0) {
		const currentSnapshot = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
			env,
			workspaceDir,
			allowWorkspaceScopedSnapshot: true,
			requireDefaultDiscoveryContext: true
		});
		if (currentSnapshot) return {
			plugins: currentSnapshot.plugins,
			configFingerprint: currentSnapshot.configFingerprint,
			cacheable: true
		};
	}
	const snapshot = require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: params.config ?? {},
		env,
		workspaceDir,
		allowWorkspaceScopedCurrent: true
	});
	return {
		plugins: snapshot.plugins,
		configFingerprint: snapshot.configFingerprint,
		cacheable: false
	};
}
function loadManifestModelIdNormalizationPolicies(params = {}) {
	if (params.plugins) return (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.collectManifestModelIdNormalizationPolicies)(params.plugins);
	const { plugins, configFingerprint, cacheable } = resolveMetadataSnapshotForPolicies(params);
	if (cacheable && configFingerprint && cachedPolicies?.configFingerprint === configFingerprint) return cachedPolicies.policies;
	const policies = (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.collectManifestModelIdNormalizationPolicies)(plugins);
	if (cacheable && configFingerprint) cachedPolicies = {
		configFingerprint,
		policies
	};
	return policies;
}
/** Normalizes a provider model id using plugin manifest-declared model-id policies. */
function normalizeProviderModelIdWithManifest(params) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.normalizeProviderModelIdWithPolicies)({
		provider: params.provider,
		policies: loadManifestModelIdNormalizationPolicies(params),
		context: { modelId: params.context.modelId }
	});
}
//#endregion
//#region src/agents/model-ref-shared.ts
/**
* Shared provider/model reference normalization for static catalogs,
* allowlists, and display paths. Manifest policies are optional so tests can
* isolate built-in normalization behavior.
*/
/** Normalize a static provider model ID with built-in and optional manifest policy. */
function normalizeStaticProviderModelId(provider, model, options = {}) {
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	if (options.allowManifestNormalization === false) return (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.normalizeBuiltInProviderModelId)(normalizedProvider, model);
	if (options.manifestPlugins) return (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.normalizeStaticProviderModelIdWithPolicies)(normalizedProvider, model, (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.collectManifestModelIdNormalizationPolicies)(options.manifestPlugins));
	return (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.normalizeBuiltInProviderModelId)(normalizedProvider, normalizeProviderModelIdWithManifest({
		provider: normalizedProvider,
		context: {
			provider: normalizedProvider,
			modelId: model
		}
	}) ?? model);
}
/** Normalize a configured catalog model ID for comparisons against provider catalogs. */
function normalizeConfiguredProviderCatalogModelId(provider, model, options = {}) {
	if (options.allowManifestNormalization === false) return (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.normalizeConfiguredProviderCatalogModelId)(provider, model, /* @__PURE__ */ new Map());
	if (options.manifestPlugins) return (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.normalizeConfiguredProviderCatalogModelId)(provider, model, (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.collectManifestModelIdNormalizationPolicies)(options.manifestPlugins));
	return (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.normalizeConfiguredProviderCatalogModelRef)(normalizeStaticProviderModelId(provider, model, options));
}
/** Preserve literal provider/model refs that already include a provider prefix twice. */
function formatLiteralProviderPrefixedModelRef(provider, modelRef) {
	const providerId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	const trimmedRef = modelRef.trim();
	if (!providerId || !trimmedRef) return trimmedRef;
	const normalizedRef = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmedRef);
	const literalPrefix = `${providerId}/${providerId}/`;
	if (normalizedRef.startsWith(literalPrefix)) return trimmedRef;
	return normalizedRef.startsWith(`${providerId}/`) ? `${providerId}/${trimmedRef}` : trimmedRef;
}
//#endregion
//#region src/agents/provider-model-normalization.runtime.ts
/**
* Runtime bridge for provider-owned model id normalization hooks. Source and
* built artifacts can resolve different extensions, so this module probes both
* once and caches the result.
*/
const require$1 = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
const PROVIDER_RUNTIME_CANDIDATES = ["../plugins/provider-runtime.js", "../plugins/provider-runtime.ts"];
let providerRuntimeModule;
let providerRuntimeLoadAttempted = false;
function loadProviderRuntime() {
	if (providerRuntimeModule) return providerRuntimeModule;
	if (providerRuntimeLoadAttempted) return null;
	providerRuntimeLoadAttempted = true;
	for (const candidate of PROVIDER_RUNTIME_CANDIDATES) try {
		providerRuntimeModule = require$1(candidate);
		return providerRuntimeModule;
	} catch {}
	return null;
}
/** Normalizes provider model ids through plugin runtime hooks when available. */
function normalizeProviderModelIdWithRuntime(params) {
	return loadProviderRuntime()?.normalizeProviderModelIdWithPlugin(params);
}
//#endregion
//#region src/agents/model-selection-normalize.ts
/**
* Normalizes provider/model references and configured model ids.
*/
/** Build the canonical provider/model key for model selection. */
function modelKey(provider, model) {
	return require_model_input.modelKey(provider, model);
}
/** Return the legacy raw key when it differs from the canonical key. */
function legacyModelKey(provider, model) {
	const providerId = provider.trim();
	const modelId = model.trim();
	if (!providerId || !modelId) return null;
	const rawKey = `${providerId}/${modelId}`;
	return rawKey === modelKey(providerId, modelId) ? null : rawKey;
}
/** Normalize a provider ID using the shared catalog rules. */
function normalizeProviderId(provider) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
}
/** Normalize a provider ID for auth lookup. */
function normalizeProviderIdForAuth(provider) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderIdForAuth)(provider);
}
/** Find a provider value by normalized provider ID. */
function findNormalizedProviderValue(entries, provider) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(entries, provider);
}
/** Find the original provider key matching a normalized provider ID. */
function findNormalizedProviderKey(entries, provider) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderKey)(entries, provider);
}
function normalizeProviderModelId(provider, model, options) {
	const staticModelId = normalizeStaticProviderModelId(provider, (0, _gabrielvfonseca_model_catalog_core_provider_model_id_normalization.stripSelfProviderModelPrefix)(provider, model), {
		allowManifestNormalization: options?.allowManifestNormalization,
		manifestPlugins: options?.manifestPlugins
	});
	if (options?.allowPluginNormalization === false) return staticModelId;
	return normalizeProviderModelIdWithRuntime({
		provider,
		...options?.manifestPlugins ? { plugins: options.manifestPlugins } : {},
		context: {
			provider,
			modelId: staticModelId
		}
	}) ?? staticModelId;
}
/** Normalize a provider/model pair into a canonical model reference. */
function normalizeModelRef(provider, model, options) {
	const normalizedProvider = normalizeProviderId(provider);
	return {
		provider: normalizedProvider,
		model: normalizeProviderModelId(normalizedProvider, model.trim(), options)
	};
}
const OPENROUTER_AUTO_COMPAT_ALIAS = "openrouter:auto";
/** Parse `provider/model` or bare model text using a default provider. */
function parseModelRef(raw, defaultProvider, options) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed) === OPENROUTER_AUTO_COMPAT_ALIAS) return normalizeModelRef("openrouter", "auto", options);
	const slash = trimmed.indexOf("/");
	if (slash === -1) return normalizeModelRef(defaultProvider, trimmed, options);
	const providerRaw = trimmed.slice(0, slash).trim();
	const model = trimmed.slice(slash + 1).trim();
	if (!providerRaw || !model) return null;
	return normalizeModelRef(providerRaw, model, options);
}
//#endregion
Object.defineProperty(exports, "findNormalizedProviderKey", {
	enumerable: true,
	get: function() {
		return findNormalizedProviderKey;
	}
});
Object.defineProperty(exports, "findNormalizedProviderValue", {
	enumerable: true,
	get: function() {
		return findNormalizedProviderValue;
	}
});
Object.defineProperty(exports, "formatLiteralProviderPrefixedModelRef", {
	enumerable: true,
	get: function() {
		return formatLiteralProviderPrefixedModelRef;
	}
});
Object.defineProperty(exports, "legacyModelKey", {
	enumerable: true,
	get: function() {
		return legacyModelKey;
	}
});
Object.defineProperty(exports, "modelKey", {
	enumerable: true,
	get: function() {
		return modelKey;
	}
});
Object.defineProperty(exports, "normalizeConfiguredProviderCatalogModelId", {
	enumerable: true,
	get: function() {
		return normalizeConfiguredProviderCatalogModelId;
	}
});
Object.defineProperty(exports, "normalizeModelRef", {
	enumerable: true,
	get: function() {
		return normalizeModelRef;
	}
});
Object.defineProperty(exports, "normalizeProviderId", {
	enumerable: true,
	get: function() {
		return normalizeProviderId;
	}
});
Object.defineProperty(exports, "normalizeProviderIdForAuth", {
	enumerable: true,
	get: function() {
		return normalizeProviderIdForAuth;
	}
});
Object.defineProperty(exports, "normalizeProviderModelIdWithManifest", {
	enumerable: true,
	get: function() {
		return normalizeProviderModelIdWithManifest;
	}
});
Object.defineProperty(exports, "normalizeStaticProviderModelId", {
	enumerable: true,
	get: function() {
		return normalizeStaticProviderModelId;
	}
});
Object.defineProperty(exports, "parseModelRef", {
	enumerable: true,
	get: function() {
		return parseModelRef;
	}
});
