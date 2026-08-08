const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_text_transforms_runtime = require("./text-transforms.runtime-B0pRaBUe.cjs");
const require_provider_secret_egress = require("./provider-secret-egress-NB6SfEEF.cjs");
const require_gpt5_prompt_overlay = require("./gpt5-prompt-overlay-D6AhPsDX.cjs");
const require_provider_discovery_runtime = require("./provider-discovery.runtime-Dnt-tftf.cjs");
const require_provider_hook_runtime = require("./provider-hook-runtime-CQSINlxr.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/plugins/provider-runtime.ts
var provider_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	applyProviderConfigDefaultsWithPlugin: () => applyProviderConfigDefaultsWithPlugin,
	applyProviderNativeStreamingUsageCompatWithPlugin: () => applyProviderNativeStreamingUsageCompatWithPlugin,
	applyProviderResolvedTransportWithPlugin: () => applyProviderResolvedTransportWithPlugin,
	augmentModelCatalogWithProviderPlugins: () => augmentModelCatalogWithProviderPlugins,
	buildProviderAuthDoctorHintWithPlugin: () => buildProviderAuthDoctorHintWithPlugin,
	buildProviderMissingAuthMessageWithPlugin: () => buildProviderMissingAuthMessageWithPlugin,
	buildProviderUnknownModelHintWithPlugin: () => buildProviderUnknownModelHintWithPlugin,
	classifyProviderFailoverReasonWithPlugin: () => classifyProviderFailoverReasonWithPlugin,
	createProviderEmbeddingProvider: () => createProviderEmbeddingProvider,
	formatProviderAuthProfileApiKeyWithPlugin: () => formatProviderAuthProfileApiKeyWithPlugin,
	inspectProviderToolSchemasWithPlugin: () => inspectProviderToolSchemasWithPlugin,
	listProviderUsagePluginDescriptors: () => listProviderUsagePluginDescriptors,
	matchesProviderContextOverflowWithPlugin: () => matchesProviderContextOverflowWithPlugin,
	normalizeProviderConfigWithPlugin: () => normalizeProviderConfigWithPlugin,
	normalizeProviderModelIdWithPlugin: () => normalizeProviderModelIdWithPlugin,
	normalizeProviderResolvedModelWithPlugin: () => normalizeProviderResolvedModelWithPlugin,
	normalizeProviderToolSchemasWithPlugin: () => normalizeProviderToolSchemasWithPlugin,
	normalizeProviderTransportWithPlugin: () => normalizeProviderTransportWithPlugin,
	prepareProviderDynamicModel: () => prepareProviderDynamicModel,
	prepareProviderExtraParams: () => require_provider_hook_runtime.prepareProviderExtraParams,
	prepareProviderRuntimeAuth: () => prepareProviderRuntimeAuth,
	refreshProviderOAuthCredentialWithPlugin: () => refreshProviderOAuthCredentialWithPlugin,
	resolveExternalAuthProfilesWithPlugins: () => resolveExternalAuthProfilesWithPlugins,
	resolveProviderAuthProfileId: () => require_provider_hook_runtime.resolveProviderAuthProfileId,
	resolveProviderBinaryThinking: () => resolveProviderBinaryThinking,
	resolveProviderCacheTtlEligibility: () => resolveProviderCacheTtlEligibility,
	resolveProviderConfigApiKeyWithPlugin: () => resolveProviderConfigApiKeyWithPlugin,
	resolveProviderDefaultThinkingLevel: () => resolveProviderDefaultThinkingLevel,
	resolveProviderExtraParamsForTransport: () => require_provider_hook_runtime.resolveProviderExtraParamsForTransport,
	resolveProviderFollowupFallbackRoute: () => require_provider_hook_runtime.resolveProviderFollowupFallbackRoute,
	resolveProviderModernModelRef: () => resolveProviderModernModelRef,
	resolveProviderReasoningOutputModeWithPlugin: () => resolveProviderReasoningOutputModeWithPlugin,
	resolveProviderReplayPolicyWithPlugin: () => resolveProviderReplayPolicyWithPlugin,
	resolveProviderRuntimePlugin: () => require_provider_hook_runtime.resolveProviderRuntimePlugin,
	resolveProviderStreamFn: () => resolveProviderStreamFn,
	resolveProviderSyntheticAuthWithPlugin: () => resolveProviderSyntheticAuthWithPlugin,
	resolveProviderSystemPromptContribution: () => resolveProviderSystemPromptContribution,
	resolveProviderTextTransforms: () => resolveProviderTextTransforms,
	resolveProviderThinkingProfile: () => resolveProviderThinkingProfile,
	resolveProviderTransportTurnStateWithPlugin: () => resolveProviderTransportTurnStateWithPlugin,
	resolveProviderUsageAuthWithPlugin: () => resolveProviderUsageAuthWithPlugin,
	resolveProviderUsageSnapshotWithPlugin: () => resolveProviderUsageSnapshotWithPlugin,
	resolveProviderXHighThinking: () => resolveProviderXHighThinking,
	runProviderDynamicModel: () => runProviderDynamicModel,
	sanitizeProviderReplayHistoryWithPlugin: () => sanitizeProviderReplayHistoryWithPlugin,
	shouldDeferProviderSyntheticProfileAuthWithPlugin: () => shouldDeferProviderSyntheticProfileAuthWithPlugin,
	shouldPreferProviderRuntimeResolvedModel: () => shouldPreferProviderRuntimeResolvedModel,
	testing: () => testing,
	transformProviderSystemPrompt: () => transformProviderSystemPrompt,
	validateProviderReplayTurnsWithPlugin: () => validateProviderReplayTurnsWithPlugin,
	wrapProviderSimpleCompletionStreamFn: () => require_provider_hook_runtime.wrapProviderSimpleCompletionStreamFn,
	wrapProviderStreamFn: () => require_provider_hook_runtime.wrapProviderStreamFn
});
const log = require_subsystem.createSubsystemLogger("plugins/provider-runtime");
const warnedExternalAuthFallbackPluginIds = /* @__PURE__ */ new Set();
function matchesProviderPluginRef(provider, providerId) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	if (!normalized) return false;
	if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider.id) === normalized) return true;
	return [...provider.aliases ?? [], ...provider.hookAliases ?? []].some((alias) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(alias) === normalized);
}
function resolveProviderHookRefs(provider, providerConfig, modelApi) {
	const refs = [provider];
	const apiRef = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(modelApi ?? providerConfig?.api);
	if (apiRef && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(apiRef) !== (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider)) refs.push(apiRef);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(refs);
}
function matchesAnyProviderPluginRef(provider, providerRefs) {
	return providerRefs.some((providerRef) => matchesProviderPluginRef(provider, providerRef));
}
function hasExplicitProviderRuntimePluginActivation(params) {
	if (!params.config) return true;
	const ownerPluginIds = require_providers.resolveOwningPluginIdsForProvider({
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) ?? [];
	if (ownerPluginIds.length === 0) return false;
	const allow = new Set(params.config.plugins?.allow ?? []);
	const entries = params.config.plugins?.entries ?? {};
	return ownerPluginIds.some((pluginId) => allow.has(pluginId) || entries[pluginId] !== void 0);
}
function hasConfiguredModelProvider(params) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderValue)(params.config?.models?.providers, params.provider) !== void 0;
}
function resetExternalAuthFallbackWarningCacheForTest() {
	warnedExternalAuthFallbackPluginIds.clear();
}
const testing = {
	clearProviderRuntimePluginCacheForTest: require_provider_hook_runtime.clearProviderRuntimePluginCacheForTest,
	resetExternalAuthFallbackWarningCacheForTest
};
function resolveProviderPluginsForCatalogHooks(params) {
	const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	const env = params.env ?? process.env;
	const onlyPluginIds = require_providers.resolveCatalogHookProviderPluginIds({
		config: params.config,
		workspaceDir,
		env
	});
	if (onlyPluginIds.length === 0) return [];
	return require_provider_hook_runtime.resolveProviderPluginsForHooks({
		...params,
		workspaceDir,
		env,
		onlyPluginIds
	});
}
function runProviderDynamicModel(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.resolveDynamicModel?.(params.context) ?? void 0;
}
function resolveProviderSystemPromptContribution(params) {
	const plugin = require_provider_hook_runtime.ensureProviderRuntimePluginHandle(params).plugin;
	const baseOverlay = require_gpt5_prompt_overlay.resolveGpt5SystemPromptContribution({
		config: params.context.config ?? params.config,
		providerId: params.context.provider ?? params.provider,
		modelId: params.context.modelId,
		trigger: params.context.trigger
	});
	return mergeProviderSystemPromptContributions(mergeProviderSystemPromptContributions(baseOverlay, plugin?.resolvePromptOverlay?.({
		...params.context,
		baseOverlay
	}) ?? void 0), plugin?.resolveSystemPromptContribution?.(params.context) ?? void 0);
}
function mergeProviderSystemPromptContributions(base, override) {
	if (!base) return override;
	if (!override) return base;
	const stablePrefix = mergeUniquePromptSections(base.stablePrefix, override.stablePrefix);
	const dynamicSuffix = mergeUniquePromptSections(base.dynamicSuffix, override.dynamicSuffix);
	return {
		...stablePrefix ? { stablePrefix } : {},
		...dynamicSuffix ? { dynamicSuffix } : {},
		sectionOverrides: {
			...base.sectionOverrides,
			...override.sectionOverrides
		}
	};
}
function mergeUniquePromptSections(...sections) {
	const uniqueSections = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(sections.filter((section) => Boolean(section?.trim())));
	return uniqueSections.length > 0 ? uniqueSections.join("\n\n") : void 0;
}
function transformProviderSystemPrompt(params) {
	const plugin = require_provider_hook_runtime.ensureProviderRuntimePluginHandle(params).plugin;
	const textTransforms = require_text_transforms_runtime.mergePluginTextTransforms(require_text_transforms_runtime.resolveRuntimeTextTransforms(), plugin?.textTransforms);
	return require_text_transforms_runtime.applyPluginTextReplacements(plugin?.transformSystemPrompt?.(params.context) ?? params.context.systemPrompt, textTransforms?.input);
}
function resolveProviderTextTransforms(params) {
	return require_text_transforms_runtime.mergePluginTextTransforms(require_text_transforms_runtime.resolveRuntimeTextTransforms(), require_provider_hook_runtime.ensureProviderRuntimePluginHandle(params).plugin?.textTransforms);
}
async function prepareProviderDynamicModel(params) {
	await require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.prepareDynamicModel?.(params.context);
}
function shouldPreferProviderRuntimeResolvedModel(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.preferRuntimeResolvedModel?.(params.context) ?? false;
}
function normalizeProviderResolvedModelWithPlugin(params) {
	const context = {
		...params.context,
		...params.context.config === void 0 && params.config !== void 0 ? { config: params.config } : {},
		...params.context.workspaceDir === void 0 && params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
	};
	return require_provider_hook_runtime.resolveProviderRuntimePlugin({
		...params,
		modelId: params.context.modelId
	})?.normalizeResolvedModel?.(context) ?? void 0;
}
function applyProviderResolvedTransportWithPlugin(params) {
	const config = params.context.config ?? params.config;
	const workspaceDir = params.context.workspaceDir ?? params.workspaceDir;
	const normalized = normalizeProviderTransportWithPlugin({
		provider: params.provider,
		config,
		workspaceDir,
		env: params.env,
		modelId: params.context.modelId,
		context: {
			...config !== void 0 ? { config } : {},
			...workspaceDir !== void 0 ? { workspaceDir } : {},
			provider: params.context.provider,
			modelId: params.context.modelId,
			api: params.context.model.api,
			baseUrl: params.context.model.baseUrl
		}
	});
	if (!normalized) return;
	const nextApi = normalized.api ?? params.context.model.api;
	const nextBaseUrl = normalized.baseUrl ?? params.context.model.baseUrl;
	if (nextApi === params.context.model.api && nextBaseUrl === params.context.model.baseUrl) return;
	return {
		...params.context.model,
		api: nextApi,
		baseUrl: nextBaseUrl
	};
}
function normalizeProviderModelIdWithPlugin(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_provider_hook_runtime.resolveProviderHookPlugin(params)?.normalizeModelId?.(params.context)) ?? require_model_selection_normalize.normalizeProviderModelIdWithManifest(params);
}
function normalizeProviderTransportWithPlugin(params) {
	const hasTransportChange = (normalized) => (normalized.api ?? params.context.api) !== params.context.api || (normalized.baseUrl ?? params.context.baseUrl) !== params.context.baseUrl;
	const context = {
		...params.context,
		...params.context.config === void 0 && params.config !== void 0 ? { config: params.config } : {},
		...params.context.workspaceDir === void 0 && params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {}
	};
	const matchedPlugin = require_provider_hook_runtime.resolveProviderHookPlugin(params);
	const normalizedMatched = matchedPlugin?.normalizeTransport?.(context);
	if (normalizedMatched && hasTransportChange(normalizedMatched)) return normalizedMatched;
	if (hasConfiguredModelProvider(params)) return;
	for (const candidate of require_provider_hook_runtime.resolveProviderPluginsForHooks(params)) {
		if (!candidate.normalizeTransport || candidate === matchedPlugin) continue;
		const normalized = candidate.normalizeTransport(context);
		if (normalized && hasTransportChange(normalized)) return normalized;
	}
}
function normalizeProviderConfigWithPlugin(params) {
	const hasConfigChange = (normalized) => normalized !== params.context.providerConfig;
	const bundledSurface = require_thinking.resolveBundledProviderPolicySurface(params.provider);
	if (bundledSurface?.normalizeConfig) {
		const normalized = bundledSurface.normalizeConfig(params.context);
		return normalized && hasConfigChange(normalized) ? normalized : void 0;
	}
	if (!hasExplicitProviderRuntimePluginActivation(params)) return;
	if (params.allowRuntimePluginLoad === false) return;
	const normalizedMatched = require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.normalizeConfig?.(params.context);
	return normalizedMatched && hasConfigChange(normalizedMatched) ? normalizedMatched : void 0;
}
function applyProviderNativeStreamingUsageCompatWithPlugin(params) {
	if (params.allowRuntimePluginLoad === false) return;
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.applyNativeStreamingUsageCompat?.(params.context) ?? void 0;
}
function resolveProviderConfigApiKeyWithPlugin(params) {
	const bundledSurface = require_thinking.resolveBundledProviderPolicySurface(params.provider);
	if (bundledSurface?.resolveConfigApiKey) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(bundledSurface.resolveConfigApiKey(params.context));
	if (params.allowRuntimePluginLoad === false) return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.resolveConfigApiKey?.(params.context));
}
function resolveProviderReplayPolicyWithPlugin(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.buildReplayPolicy?.(params.context) ?? void 0;
}
async function sanitizeProviderReplayHistoryWithPlugin(params) {
	return await require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.sanitizeReplayHistory?.(params.context);
}
async function validateProviderReplayTurnsWithPlugin(params) {
	return await require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.validateReplayTurns?.(params.context);
}
function normalizeProviderToolSchemasWithPlugin(params) {
	return (params.allowRuntimePluginLoad === false ? params.runtimeHandle?.plugin ?? require_provider_hook_runtime.resolveLoadedProviderRuntimePlugin(params) : require_provider_hook_runtime.ensureProviderRuntimePluginHandle(params).plugin)?.normalizeToolSchemas?.(params.context) ?? void 0;
}
function inspectProviderToolSchemasWithPlugin(params) {
	return (params.allowRuntimePluginLoad === false ? params.runtimeHandle?.plugin ?? require_provider_hook_runtime.resolveLoadedProviderRuntimePlugin(params) : require_provider_hook_runtime.ensureProviderRuntimePluginHandle(params).plugin)?.inspectToolSchemas?.(params.context) ?? void 0;
}
function resolveProviderReasoningOutputModeWithPlugin(params) {
	const mode = require_provider_hook_runtime.ensureProviderRuntimePluginHandle({
		provider: params.provider,
		modelId: params.context.modelId,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		runtimeHandle: params.runtimeHandle
	}).plugin?.resolveReasoningOutputMode?.(params.context);
	return mode === "native" || mode === "tagged" ? mode : void 0;
}
function resolveProviderStreamFn(params) {
	return (params.allowRuntimePluginLoad === false ? require_provider_hook_runtime.resolveLoadedProviderRuntimePlugin(params) : require_provider_hook_runtime.resolveProviderRuntimePlugin(params))?.createStreamFn?.(params.context) ?? void 0;
}
function resolveProviderTransportTurnStateWithPlugin(params) {
	return (params.allowRuntimePluginLoad === false ? require_provider_hook_runtime.resolveLoadedProviderRuntimePlugin(params) : require_provider_hook_runtime.resolveProviderRuntimePlugin(params))?.resolveTransportTurnState?.(params.context) ?? void 0;
}
async function createProviderEmbeddingProvider(params) {
	return await require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.createEmbeddingProvider?.(params.context);
}
async function prepareProviderRuntimeAuth(params) {
	const prepareRuntimeAuth = require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.prepareRuntimeAuth;
	if (!prepareRuntimeAuth) return;
	const preparedInput = require_provider_secret_egress.unwrapSecretSentinelsForProviderEgress(params.context.apiKey, "provider runtime auth exchange");
	return await prepareRuntimeAuth({
		...params.context,
		apiKey: preparedInput
	});
}
async function resolveProviderUsageAuthWithPlugin(params) {
	const plugin = require_provider_hook_runtime.resolveProviderRuntimePlugin(params);
	if (!plugin?.resolveUsageAuth) return;
	const result = await plugin.resolveUsageAuth(params.context);
	if (!result) return;
	return result;
}
async function resolveProviderUsageSnapshotWithPlugin(params) {
	const providerHook = require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.fetchUsageSnapshot;
	if (providerHook) {
		const snapshot = await providerHook(params.context);
		if (snapshot != null) return snapshot;
	}
	if (params.provider === params.context.provider) return;
	let harness = require_registry.getRegisteredAgentHarness(params.provider)?.harness;
	if (!harness) {
		const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState() ?? process.cwd();
		const { ensureSelectedAgentHarnessPlugin } = await Promise.resolve().then(() => require("./runtime-plugin-9QTLb6UB.cjs")).then((n) => n.runtime_plugin_exports);
		await ensureSelectedAgentHarnessPlugin({
			provider: params.context.provider,
			modelId: "",
			config: params.config,
			agentHarnessId: params.provider,
			workspaceDir
		});
		harness = require_registry.getRegisteredAgentHarness(params.provider)?.harness;
	}
	return await harness?.fetchUsageSnapshot?.(params.context);
}
/** Lists provider plugins that own the complete usage auth + fetch lifecycle. */
function listProviderUsagePluginDescriptors(params) {
	const pluginContracts = require_providers.resolveUsageHookProviderPluginContracts(params);
	if (pluginContracts.length === 0) return [];
	const descriptors = /* @__PURE__ */ new Map();
	for (const contract of pluginContracts) {
		const declaredProviderIds = new Set(contract.providerIds);
		for (const plugin of require_provider_hook_runtime.resolveProviderPluginsForHooks({
			...params,
			onlyPluginIds: [contract.pluginId]
		})) {
			if (!plugin.resolveUsageAuth || !plugin.fetchUsageSnapshot) continue;
			const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(plugin.id);
			if (!provider || !declaredProviderIds.has(provider) || descriptors.has(provider)) continue;
			descriptors.set(provider, {
				provider,
				displayName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin.label) ?? provider
			});
		}
	}
	return [...descriptors.values()].toSorted((a, b) => a.provider.localeCompare(b.provider));
}
function matchesProviderContextOverflowWithPlugin(params) {
	const plugins = resolveProviderPluginsForScopedHook(params);
	for (const plugin of plugins) if (plugin.matchesContextOverflowError?.(params.context)) return true;
	return false;
}
function classifyProviderFailoverReasonWithPlugin(params) {
	const plugins = resolveProviderPluginsForScopedHook(params);
	for (const plugin of plugins) {
		const reason = plugin.classifyFailoverReason?.(params.context);
		if (reason) return reason;
	}
}
function resolveProviderPluginsForScopedHook(params) {
	if (!params.provider) return require_provider_hook_runtime.resolveProviderPluginsForHooks(params);
	const plugin = require_provider_hook_runtime.resolveProviderHookPlugin({
		...params,
		provider: params.provider
	});
	if (plugin) return [plugin];
	if (hasStructuredFailoverDescriptor(params.context)) return [];
	return require_provider_hook_runtime.resolveProviderPluginsForHooks(params);
}
function hasStructuredFailoverDescriptor(context) {
	return context.status !== void 0 || context.code !== void 0 || context.errorType !== void 0;
}
function formatProviderAuthProfileApiKeyWithPlugin(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.formatApiKey?.(params.context);
}
async function refreshProviderOAuthCredentialWithPlugin(params) {
	return await require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.refreshOAuth?.(params.context);
}
async function buildProviderAuthDoctorHintWithPlugin(params) {
	return await require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.buildAuthDoctorHint?.(params.context);
}
function resolveProviderCacheTtlEligibility(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.isCacheTtlEligible?.(params.context);
}
function resolveProviderBinaryThinking(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.isBinaryThinking?.(params.context);
}
function resolveProviderXHighThinking(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.supportsXHighThinking?.(params.context);
}
function resolveProviderThinkingProfile(params) {
	const bundledSurface = require_thinking.resolveBundledProviderPolicySurface(params.provider);
	if (bundledSurface?.resolveThinkingProfile) return bundledSurface.resolveThinkingProfile(params.context) ?? void 0;
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.resolveThinkingProfile?.(params.context);
}
function resolveProviderDefaultThinkingLevel(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.resolveDefaultThinkingLevel?.(params.context);
}
function applyProviderConfigDefaultsWithPlugin(params) {
	const bundledSurface = require_thinking.resolveBundledProviderPolicySurface(params.provider);
	if (bundledSurface?.applyConfigDefaults) return bundledSurface.applyConfigDefaults(params.context) ?? void 0;
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.applyConfigDefaults?.(params.context) ?? void 0;
}
function resolveProviderModernModelRef(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.isModernModelRef?.(params.context);
}
function buildProviderMissingAuthMessageWithPlugin(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.buildMissingAuthMessage?.(params.context) ?? void 0;
}
function buildProviderUnknownModelHintWithPlugin(params) {
	return require_provider_hook_runtime.resolveProviderRuntimePlugin(params)?.buildUnknownModelHint?.(params.context) ?? void 0;
}
function resolveProviderSyntheticAuthWithPlugin(params) {
	const providerRefs = resolveProviderHookRefs(params.provider, params.context.providerConfig, params.modelApi);
	const discoveryPluginIds = [...new Set(providerRefs.flatMap((provider) => require_providers.resolveOwningPluginIdsForProviderRef({
		provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}) ?? []))];
	const discoveryProvider = (discoveryPluginIds.length > 0 ? require_provider_discovery_runtime.resolvePluginDiscoveryProvidersRuntime({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: discoveryPluginIds,
		discoveryEntriesOnly: true
	}) : []).find((provider) => matchesAnyProviderPluginRef(provider, providerRefs));
	if (typeof discoveryProvider?.resolveSyntheticAuth === "function") return discoveryProvider.resolveSyntheticAuth(params.context) ?? void 0;
	const runtimeResolved = require_provider_hook_runtime.resolveProviderRuntimePlugin({
		...params,
		applyAutoEnable: false,
		bundledProviderVitestCompat: false
	})?.resolveSyntheticAuth?.(params.context);
	if (runtimeResolved) return runtimeResolved;
	for (const providerRef of providerRefs) {
		if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerRef) === (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider)) continue;
		const runtimeProviderResolved = require_provider_hook_runtime.resolveProviderRuntimePlugin({
			...params,
			provider: providerRef,
			applyAutoEnable: false,
			bundledProviderVitestCompat: false
		})?.resolveSyntheticAuth?.(params.context);
		if (runtimeProviderResolved) return runtimeProviderResolved;
	}
	if (providerRefs.length === 1) return require_provider_discovery_runtime.resolvePluginDiscoveryProvidersRuntime({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	}).find((provider) => matchesAnyProviderPluginRef(provider, providerRefs))?.resolveSyntheticAuth?.(params.context);
}
function resolveExternalAuthProfilesWithPlugins(params) {
	const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	const env = params.env ?? process.env;
	const { manifestRegistry } = require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: params.config ?? {},
		workspaceDir,
		env
	});
	const externalAuthPluginIds = require_providers.resolveExternalAuthProfileProviderPluginIds({
		config: params.config,
		workspaceDir,
		env,
		manifestRegistry
	});
	const declaredPluginIds = new Set(externalAuthPluginIds);
	const fallbackPluginIds = require_providers.resolveExternalAuthProfileCompatFallbackPluginIds({
		config: params.config,
		workspaceDir,
		env,
		declaredPluginIds,
		manifestRegistry
	});
	const pluginIds = (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([...externalAuthPluginIds, ...fallbackPluginIds]);
	if (pluginIds.length === 0) return [];
	const matches = [];
	for (const plugin of require_provider_hook_runtime.resolveProviderPluginsForHooks({
		...params,
		workspaceDir,
		env,
		onlyPluginIds: pluginIds
	})) {
		const profiles = plugin.resolveExternalAuthProfiles?.(params.context) ?? plugin.resolveExternalOAuthProfiles?.(params.context);
		if (!profiles || profiles.length === 0) continue;
		const pluginId = plugin.pluginId ?? plugin.id;
		if (!declaredPluginIds.has(pluginId) && !warnedExternalAuthFallbackPluginIds.has(pluginId)) {
			warnedExternalAuthFallbackPluginIds.add(pluginId);
			log.warn(`Provider plugin "${require_ansi.sanitizeForLog(pluginId)}" uses external auth hooks without declaring contracts.externalAuthProviders. This compatibility fallback is deprecated and will be removed in a future release.`);
		}
		matches.push(...profiles);
	}
	return matches;
}
function shouldDeferProviderSyntheticProfileAuthWithPlugin(params) {
	const providerRefs = resolveProviderHookRefs(params.provider, params.context.providerConfig, params.modelApi);
	for (const providerRef of providerRefs) {
		const resolved = require_provider_hook_runtime.resolveProviderRuntimePlugin({
			...params,
			provider: providerRef
		})?.shouldDeferSyntheticProfileAuth?.(params.context);
		if (resolved !== void 0) return resolved;
	}
}
async function augmentModelCatalogWithProviderPlugins(params) {
	const supplemental = [];
	for (const plugin of resolveProviderPluginsForCatalogHooks(params)) {
		const next = await plugin.augmentModelCatalog?.(params.context);
		if (!next || next.length === 0) continue;
		supplemental.push(...next);
	}
	return supplemental;
}
//#endregion
Object.defineProperty(exports, "applyProviderNativeStreamingUsageCompatWithPlugin", {
	enumerable: true,
	get: function() {
		return applyProviderNativeStreamingUsageCompatWithPlugin;
	}
});
Object.defineProperty(exports, "applyProviderResolvedTransportWithPlugin", {
	enumerable: true,
	get: function() {
		return applyProviderResolvedTransportWithPlugin;
	}
});
Object.defineProperty(exports, "buildProviderMissingAuthMessageWithPlugin", {
	enumerable: true,
	get: function() {
		return buildProviderMissingAuthMessageWithPlugin;
	}
});
Object.defineProperty(exports, "buildProviderUnknownModelHintWithPlugin", {
	enumerable: true,
	get: function() {
		return buildProviderUnknownModelHintWithPlugin;
	}
});
Object.defineProperty(exports, "inspectProviderToolSchemasWithPlugin", {
	enumerable: true,
	get: function() {
		return inspectProviderToolSchemasWithPlugin;
	}
});
Object.defineProperty(exports, "listProviderUsagePluginDescriptors", {
	enumerable: true,
	get: function() {
		return listProviderUsagePluginDescriptors;
	}
});
Object.defineProperty(exports, "normalizeProviderConfigWithPlugin", {
	enumerable: true,
	get: function() {
		return normalizeProviderConfigWithPlugin;
	}
});
Object.defineProperty(exports, "normalizeProviderResolvedModelWithPlugin", {
	enumerable: true,
	get: function() {
		return normalizeProviderResolvedModelWithPlugin;
	}
});
Object.defineProperty(exports, "normalizeProviderToolSchemasWithPlugin", {
	enumerable: true,
	get: function() {
		return normalizeProviderToolSchemasWithPlugin;
	}
});
Object.defineProperty(exports, "normalizeProviderTransportWithPlugin", {
	enumerable: true,
	get: function() {
		return normalizeProviderTransportWithPlugin;
	}
});
Object.defineProperty(exports, "prepareProviderDynamicModel", {
	enumerable: true,
	get: function() {
		return prepareProviderDynamicModel;
	}
});
Object.defineProperty(exports, "prepareProviderRuntimeAuth", {
	enumerable: true,
	get: function() {
		return prepareProviderRuntimeAuth;
	}
});
Object.defineProperty(exports, "provider_runtime_exports", {
	enumerable: true,
	get: function() {
		return provider_runtime_exports;
	}
});
Object.defineProperty(exports, "resolveExternalAuthProfilesWithPlugins", {
	enumerable: true,
	get: function() {
		return resolveExternalAuthProfilesWithPlugins;
	}
});
Object.defineProperty(exports, "resolveProviderCacheTtlEligibility", {
	enumerable: true,
	get: function() {
		return resolveProviderCacheTtlEligibility;
	}
});
Object.defineProperty(exports, "resolveProviderConfigApiKeyWithPlugin", {
	enumerable: true,
	get: function() {
		return resolveProviderConfigApiKeyWithPlugin;
	}
});
Object.defineProperty(exports, "resolveProviderReasoningOutputModeWithPlugin", {
	enumerable: true,
	get: function() {
		return resolveProviderReasoningOutputModeWithPlugin;
	}
});
Object.defineProperty(exports, "resolveProviderStreamFn", {
	enumerable: true,
	get: function() {
		return resolveProviderStreamFn;
	}
});
Object.defineProperty(exports, "resolveProviderSyntheticAuthWithPlugin", {
	enumerable: true,
	get: function() {
		return resolveProviderSyntheticAuthWithPlugin;
	}
});
Object.defineProperty(exports, "resolveProviderSystemPromptContribution", {
	enumerable: true,
	get: function() {
		return resolveProviderSystemPromptContribution;
	}
});
Object.defineProperty(exports, "resolveProviderTextTransforms", {
	enumerable: true,
	get: function() {
		return resolveProviderTextTransforms;
	}
});
Object.defineProperty(exports, "resolveProviderTransportTurnStateWithPlugin", {
	enumerable: true,
	get: function() {
		return resolveProviderTransportTurnStateWithPlugin;
	}
});
Object.defineProperty(exports, "resolveProviderUsageAuthWithPlugin", {
	enumerable: true,
	get: function() {
		return resolveProviderUsageAuthWithPlugin;
	}
});
Object.defineProperty(exports, "resolveProviderUsageSnapshotWithPlugin", {
	enumerable: true,
	get: function() {
		return resolveProviderUsageSnapshotWithPlugin;
	}
});
Object.defineProperty(exports, "runProviderDynamicModel", {
	enumerable: true,
	get: function() {
		return runProviderDynamicModel;
	}
});
Object.defineProperty(exports, "sanitizeProviderReplayHistoryWithPlugin", {
	enumerable: true,
	get: function() {
		return sanitizeProviderReplayHistoryWithPlugin;
	}
});
Object.defineProperty(exports, "shouldDeferProviderSyntheticProfileAuthWithPlugin", {
	enumerable: true,
	get: function() {
		return shouldDeferProviderSyntheticProfileAuthWithPlugin;
	}
});
Object.defineProperty(exports, "shouldPreferProviderRuntimeResolvedModel", {
	enumerable: true,
	get: function() {
		return shouldPreferProviderRuntimeResolvedModel;
	}
});
Object.defineProperty(exports, "transformProviderSystemPrompt", {
	enumerable: true,
	get: function() {
		return transformProviderSystemPrompt;
	}
});
Object.defineProperty(exports, "validateProviderReplayTurnsWithPlugin", {
	enumerable: true,
	get: function() {
		return validateProviderReplayTurnsWithPlugin;
	}
});
