const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_plugin_metadata_lifecycle = require("./plugin-metadata-lifecycle-L5oN3AE5.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_manifest_planner = require("./manifest-planner-Bss2KTsa.cjs");
require("./model-catalog-BgqTA2hC.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_model_catalog_core_model_catalog_refs = require("@gabrielvfonseca/model-catalog-core/model-catalog-refs");
//#region src/plugins/manifest-model-suppression.ts
function listManifestModelCatalogSuppressions(params) {
	const snapshot = require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	return require_manifest_planner.planManifestModelCatalogSuppressions({ registry: {
		diagnostics: snapshot.diagnostics,
		plugins: snapshot.plugins.filter((plugin) => require_manifest_contract_eligibility.isManifestPluginAvailableForControlPlane({
			snapshot,
			plugin,
			config: params.config
		}))
	} }).suppressions;
}
function buildManifestSuppressionError(params) {
	const ref = `${params.provider}/${params.modelId}`;
	return params.reason ? `Unknown model: ${ref}. ${params.reason}` : `Unknown model: ${ref}.`;
}
function normalizeBaseUrlHost(baseUrl) {
	const trimmed = baseUrl?.trim();
	if (!trimmed) return "";
	try {
		return normalizeSuppressionHost(new URL(trimmed).hostname);
	} catch {
		return "";
	}
}
function normalizeSuppressionHost(host) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(host).replace(/\.+$/, "");
}
function resolveConfiguredProviderValue(params) {
	const providers = params.config?.models?.providers;
	if (!providers) return;
	for (const [providerId, entry] of Object.entries(providers)) {
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerId) !== params.provider) continue;
		return {
			api: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry?.api),
			baseUrl: typeof entry?.baseUrl === "string" ? entry.baseUrl : void 0
		};
	}
}
function manifestSuppressionMatchesConditions(params) {
	const when = params.suppression.when;
	if (!when) return true;
	const configuredProvider = resolveConfiguredProviderValue({
		provider: params.provider,
		config: params.config
	});
	if (when.providerConfigApiIn?.length) {
		const allowedApis = new Set(when.providerConfigApiIn.map(_gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty));
		const effectiveApi = configuredProvider ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(configuredProvider.api) : params.provider;
		if (!effectiveApi || !allowedApis.has(effectiveApi)) return false;
	}
	if (when.baseUrlHosts?.length) {
		const baseUrlHost = normalizeBaseUrlHost(params.baseUrl ?? configuredProvider?.baseUrl);
		if (!baseUrlHost && !params.baseUrl && !configuredProvider?.baseUrl) return true;
		if (!baseUrlHost) return false;
		if (!new Set(when.baseUrlHosts.map(normalizeSuppressionHost)).has(baseUrlHost)) return false;
	}
	return true;
}
function buildManifestBuiltInModelSuppressionResolver(params) {
	const suppressions = listManifestModelCatalogSuppressions({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env
	});
	return (input) => {
		const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(input.provider);
		const modelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(input.id);
		if (!provider || !modelId) return;
		const mergeKey = (0, _gabrielvfonseca_model_catalog_core_model_catalog_refs.buildModelCatalogMergeKey)(provider, modelId);
		const suppression = suppressions.find((entry) => entry.mergeKey === mergeKey && (!input.unconditionalOnly || !entry.when) && manifestSuppressionMatchesConditions({
			suppression: entry,
			provider,
			baseUrl: input.baseUrl,
			config: params.config
		}));
		if (!suppression) return;
		return {
			suppress: true,
			errorMessage: buildManifestSuppressionError({
				provider,
				modelId,
				reason: suppression.reason
			})
		};
	};
}
//#endregion
//#region src/agents/model-suppression.ts
/**
* Built-in model suppression helpers.
* Resolves plugin manifest suppression rules with process-local caching so
* built-in catalog entries can be hidden or blocked consistently.
*/
let cachedManifestSuppressionResolver;
/** Clear cached manifest suppression resolver state for tests and metadata lifecycle resets. */
function clearModelSuppressionResolverCache() {
	cachedManifestSuppressionResolver = void 0;
}
require_plugin_metadata_lifecycle.registerPluginMetadataProcessMemoLifecycleClear(clearModelSuppressionResolverCache);
function resolveCachedManifestSuppressionResolver(params) {
	const cached = cachedManifestSuppressionResolver;
	const controlPlaneFingerprint = require_current_plugin_metadata_snapshot.resolvePluginControlPlaneFingerprint({
		...params.config ? { config: params.config } : {},
		env: params.env,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	});
	const cwd = process.cwd();
	const envFingerprint = require_plugin_metadata_snapshot.resolvePluginMetadataSnapshotMemoEnvFingerprint(params.env);
	const metadataSnapshot = require_plugin_metadata_lifecycle.getCurrentPluginMetadataSnapshotState().snapshot;
	if (cached !== void 0 && cached.config === params.config && cached.controlPlaneFingerprint === controlPlaneFingerprint && cached.cwd === cwd && cached.envFingerprint === envFingerprint && cached.metadataSnapshot === metadataSnapshot && cached.workspaceDir === params.workspaceDir) return cached.resolver;
	const resolver = buildManifestBuiltInModelSuppressionResolver({
		env: params.env,
		...params.config ? { config: params.config } : {},
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	});
	cachedManifestSuppressionResolver = {
		config: params.config,
		controlPlaneFingerprint,
		cwd,
		envFingerprint,
		metadataSnapshot,
		resolver,
		workspaceDir: params.workspaceDir
	};
	return resolver;
}
function resolveBuiltInModelSuppressionFromManifest(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider ?? "");
	const modelId = require_string_coerce.normalizeLowercaseStringOrEmpty(params.id);
	if (!provider || !modelId) return;
	return resolveCachedManifestSuppressionResolver({
		env: process.env,
		...params.config ? { config: params.config } : {},
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	})({
		provider,
		id: modelId,
		...params.baseUrl ? { baseUrl: params.baseUrl } : {},
		...params.unconditionalOnly !== void 0 ? { unconditionalOnly: params.unconditionalOnly } : {}
	});
}
function resolveBuiltInModelSuppression(params) {
	const manifestResult = resolveBuiltInModelSuppressionFromManifest(params);
	if (manifestResult?.suppress) return manifestResult;
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider ?? "");
	const modelId = require_string_coerce.normalizeLowercaseStringOrEmpty(params.id);
	if (!provider || !modelId) return;
}
/** Return true when any built-in suppression rule applies to a model entry. */
function shouldSuppressBuiltInModel(params) {
	return resolveBuiltInModelSuppression(params)?.suppress ?? false;
}
/**
* Return true only for unconditional manifest suppressions.
* Inline model entries may override conditional suppressions, but not absolute
* provider capability blocks.
*/
function shouldUnconditionallySuppress(params) {
	return resolveBuiltInModelSuppressionFromManifest({
		...params,
		unconditionalOnly: true
	})?.suppress ?? false;
}
/** Resolve the user-facing suppression error message for a built-in model. */
function buildSuppressedBuiltInModelError(params) {
	return resolveBuiltInModelSuppression(params)?.errorMessage;
}
/** Build a reusable suppression predicate for repeated catalog filtering. */
function buildShouldSuppressBuiltInModel(params) {
	const resolver = buildManifestBuiltInModelSuppressionResolver({
		env: process.env,
		...params.config ? { config: params.config } : {},
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	});
	return (input) => {
		const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(input.provider ?? "");
		const id = require_string_coerce.normalizeLowercaseStringOrEmpty(input.id);
		if (!provider || !id) return false;
		return resolver({
			provider,
			id,
			...input.baseUrl ? { baseUrl: input.baseUrl } : {}
		})?.suppress ?? false;
	};
}
//#endregion
Object.defineProperty(exports, "buildShouldSuppressBuiltInModel", {
	enumerable: true,
	get: function() {
		return buildShouldSuppressBuiltInModel;
	}
});
Object.defineProperty(exports, "buildSuppressedBuiltInModelError", {
	enumerable: true,
	get: function() {
		return buildSuppressedBuiltInModelError;
	}
});
Object.defineProperty(exports, "shouldSuppressBuiltInModel", {
	enumerable: true,
	get: function() {
		return shouldSuppressBuiltInModel;
	}
});
Object.defineProperty(exports, "shouldUnconditionallySuppress", {
	enumerable: true,
	get: function() {
		return shouldUnconditionallySuppress;
	}
});
