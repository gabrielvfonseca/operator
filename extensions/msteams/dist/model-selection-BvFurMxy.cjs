const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_model_thinking_default = require("./model-thinking-default-3L3oHDLO.cjs");
const require_model_selection_cli = require("./model-selection-cli-PCHB2Ve6.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/model-selection.ts
/**
* Public model-selection facade for persisted, configured, and allowed refs.
*/
var model_selection_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildAllowedModelSet: () => buildAllowedModelSet,
	buildConfiguredAllowlistKeys: () => require_model_selection_shared.buildConfiguredAllowlistKeys,
	buildConfiguredModelCatalog: () => require_model_selection_shared.buildConfiguredModelCatalog,
	buildModelAliasIndex: () => require_model_selection_shared.buildModelAliasIndex,
	canonicalizeCaseOnlyCatalogModelRef: () => canonicalizeCaseOnlyCatalogModelRef,
	findNormalizedProviderKey: () => require_model_selection_normalize.findNormalizedProviderKey,
	findNormalizedProviderValue: () => require_model_selection_normalize.findNormalizedProviderValue,
	getModelRefStatus: () => getModelRefStatus,
	inferUniqueProviderFromCatalog: () => require_model_selection_shared.inferUniqueProviderFromCatalog,
	inferUniqueProviderFromConfiguredModels: () => require_model_selection_shared.inferUniqueProviderFromConfiguredModels,
	isCliProvider: () => require_model_selection_cli.isCliProvider,
	legacyModelKey: () => require_model_selection_normalize.legacyModelKey,
	modelKey: () => require_model_selection_normalize.modelKey,
	normalizeModelRef: () => require_model_selection_normalize.normalizeModelRef,
	normalizeModelSelection: () => require_model_selection_shared.normalizeModelSelection,
	normalizeProviderId: () => require_model_selection_normalize.normalizeProviderId,
	normalizeProviderIdForAuth: () => require_model_selection_normalize.normalizeProviderIdForAuth,
	normalizeStoredOverrideModel: () => normalizeStoredOverrideModel,
	parseModelRef: () => require_model_selection_normalize.parseModelRef,
	resolveAllowedModelRef: () => resolveAllowedModelRef,
	resolveAllowlistModelKey: () => resolveAllowlistModelKey,
	resolveBareModelDefaultProvider: () => require_model_selection_shared.resolveBareModelDefaultProvider,
	resolveConfiguredModelRef: () => require_model_selection_shared.resolveConfiguredModelRef,
	resolveConfiguredSubagentSpawnModelSelection: () => resolveConfiguredSubagentSpawnModelSelection,
	resolveDefaultModelForAgent: () => require_codex_plugin_diagnostics.resolveDefaultModelForAgent,
	resolveHooksGmailModel: () => require_model_selection_shared.resolveHooksGmailModel,
	resolveModelRefFromString: () => require_model_selection_shared.resolveModelRefFromString,
	resolvePersistedModelRef: () => resolvePersistedModelRef,
	resolvePersistedOverrideModelRef: () => resolvePersistedOverrideModelRef,
	resolvePersistedSelectedModelRef: () => resolvePersistedSelectedModelRef,
	resolveReasoningDefault: () => resolveReasoningDefault,
	resolveSubagentConfiguredModelSelection: () => require_codex_plugin_diagnostics.resolveSubagentConfiguredModelSelection,
	resolveSubagentSpawnModelSelection: () => resolveSubagentSpawnModelSelection,
	resolveThinkingDefault: () => require_model_thinking_default.resolveThinkingDefault,
	resolveThinkingDefaultWithRuntimeCatalog: () => require_model_thinking_default.resolveThinkingDefaultWithRuntimeCatalog
});
function normalizePersistedDefaultProvider(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) ?? "openrouter";
}
function resolvePersistedOverrideModelRef(params) {
	const defaultProvider = normalizePersistedDefaultProvider(params.defaultProvider);
	const overrideProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.overrideProvider);
	const overrideModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.overrideModel);
	if (!overrideModel) return null;
	return require_model_selection_normalize.parseModelRef(overrideProvider ? `${overrideProvider}/${overrideModel}` : overrideModel, defaultProvider, {
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization
	}) ?? {
		provider: overrideProvider || defaultProvider,
		model: overrideModel
	};
}
/**
* Runtime-first resolver for persisted model metadata.
* Use this when callers intentionally want the last executed model identity.
*/
function resolvePersistedModelRef(params) {
	const defaultProvider = normalizePersistedDefaultProvider(params.defaultProvider);
	const runtimeProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.runtimeProvider);
	const runtimeModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.runtimeModel);
	if (runtimeModel) {
		if (runtimeProvider) return {
			provider: runtimeProvider,
			model: runtimeModel
		};
		return require_model_selection_normalize.parseModelRef(runtimeModel, defaultProvider, {
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization
		}) ?? {
			provider: defaultProvider,
			model: runtimeModel
		};
	}
	return resolvePersistedOverrideModelRef({
		defaultProvider,
		overrideProvider: params.overrideProvider,
		overrideModel: params.overrideModel,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization
	});
}
/**
* Selected-model resolver for persisted model metadata.
* Use this for control/status/UI surfaces that should honor explicit session
* overrides before falling back to runtime identity.
*/
function resolvePersistedSelectedModelRef(params) {
	const override = resolvePersistedOverrideModelRef({
		defaultProvider: params.defaultProvider,
		overrideProvider: params.overrideProvider,
		overrideModel: params.overrideModel,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization
	});
	if (override) return override;
	return resolvePersistedModelRef({
		defaultProvider: params.defaultProvider,
		runtimeProvider: params.runtimeProvider,
		runtimeModel: params.runtimeModel,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization
	});
}
function normalizeStoredOverrideModel(params) {
	const providerOverride = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.providerOverride);
	const modelOverride = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.modelOverride);
	if (!providerOverride || !modelOverride) return {
		providerOverride,
		modelOverride
	};
	const providerPrefix = `${providerOverride.toLowerCase()}/`;
	return {
		providerOverride,
		modelOverride: modelOverride.toLowerCase().startsWith(providerPrefix) ? modelOverride.slice(providerOverride.length + 1).trim() || modelOverride : modelOverride
	};
}
function resolveAllowlistModelKey(raw, defaultProvider, cfg, manifestPlugins) {
	return require_model_selection_shared.resolveAllowlistModelKey({
		cfg,
		raw,
		defaultProvider,
		manifestPlugins
	});
}
async function canonicalizeCaseOnlyCatalogModelRef(params) {
	const rawModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.raw);
	if (!rawModel) return;
	const split = require_model_ref_profile.splitTrailingAuthProfile(rawModel);
	if (shouldKeepProfileQualifiedModelRefRaw(split.profile, params.preserveAuthProfile)) return rawModel;
	if (!isCaseOnlyProviderModelRef(split.model)) return rawModel;
	const resolved = require_model_selection_shared.resolveModelRefFromString({
		cfg: params.cfg,
		raw: split.model,
		defaultProvider: params.defaultProvider,
		aliasIndex: params.aliasIndex,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization
	});
	if (!resolved) return rawModel;
	const entry = require_model_selection_shared.findModelInCatalog(await params.loadCatalog(), resolved.ref.provider, resolved.ref.model);
	return entry ? formatCatalogModelRef(entry, split.profile) : rawModel;
}
function hasExplicitProviderModelRef(raw) {
	const slash = raw.indexOf("/");
	return slash > 0 && slash < raw.length - 1;
}
function isCaseOnlyProviderModelRef(raw) {
	return hasExplicitProviderModelRef(raw) && raw !== raw.toLowerCase();
}
function shouldKeepProfileQualifiedModelRefRaw(profile, preserveAuthProfile) {
	return Boolean(profile && preserveAuthProfile === false);
}
function formatCatalogModelRef(entry, profile) {
	return appendAuthProfileSuffix(`${entry.provider}/${entry.id}`, profile);
}
function appendAuthProfileSuffix(modelRef, profile) {
	return profile ? `${modelRef}@${profile}` : modelRef;
}
function resolveAllowedFallbacks(params) {
	if (params.agentId) {
		const override = require_agent_scope.resolveAgentModelFallbacksOverride(params.cfg, params.agentId);
		if (override !== void 0) return override;
	}
	return require_model_input.resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.model);
}
/**
* Resolve a normalized model string through a pre-built alias index, returning
* a fully qualified `provider/model` string.  If the value is already qualified
* or not a known alias, returns it unchanged.
*/
function resolveModelThroughAliases(value, aliasIndex) {
	if (value.includes("/")) return value;
	const aliasKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
	const aliasMatch = aliasIndex.byAlias.get(aliasKey);
	if (aliasMatch) return `${aliasMatch.ref.provider}/${aliasMatch.ref.model}`;
	return value;
}
function resolveSubagentSpawnModelSelection(params) {
	const runtimeDefault = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId
	});
	const configured = resolveConfiguredSubagentSpawnModelSelection({
		cfg: params.cfg,
		agentId: params.agentId,
		modelOverride: params.modelOverride,
		defaultProvider: runtimeDefault.provider
	});
	if (configured) return configured;
	return resolveModelThroughAliases(require_model_selection_shared.normalizeModelSelection(require_model_input.resolveAgentModelPrimaryValue(params.cfg.agents?.defaults?.model)) ?? `${runtimeDefault.provider}/${runtimeDefault.model}`, require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: runtimeDefault.provider
	}));
}
function resolveConfiguredSubagentSpawnModelSelection(params) {
	const raw = require_model_selection_shared.normalizeModelSelection(params.modelOverride) ?? require_codex_plugin_diagnostics.resolveSubagentConfiguredModelSelection({
		cfg: params.cfg,
		agentId: params.agentId,
		includeAgentPrimary: params.includeAgentPrimary
	});
	if (!raw) return;
	const defaultProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.defaultProvider) ?? require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId
	}).provider;
	return resolveModelThroughAliases(raw, require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider
	}));
}
function buildAllowedModelSet(params) {
	return require_model_selection_shared.buildAllowedModelSetWithFallbacks({
		cfg: params.cfg,
		catalog: params.catalog,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		fallbackModels: resolveAllowedFallbacks({
			cfg: params.cfg,
			agentId: params.agentId
		}),
		manifestPlugins: params.manifestPlugins
	});
}
function getModelRefStatus(params) {
	return require_model_selection_shared.getModelRefStatusWithFallbackModels({
		cfg: params.cfg,
		catalog: params.catalog,
		ref: params.ref,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		fallbackModels: resolveAllowedFallbacks({ cfg: params.cfg }),
		manifestPlugins: params.manifestPlugins
	});
}
function getModelRefStatusForResolve(params, ref) {
	return getModelRefStatus({
		cfg: params.cfg,
		catalog: params.catalog,
		ref,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		manifestPlugins: params.manifestPlugins
	});
}
function resolveAllowedModelRef(params) {
	const trimmed = params.raw.trim();
	if (!trimmed) return { error: "invalid model: empty" };
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		manifestPlugins: params.manifestPlugins
	});
	const openrouterCompatRef = require_model_selection_shared.resolveConfiguredOpenRouterCompatAlias({
		cfg: params.cfg,
		raw: trimmed,
		defaultProvider: params.defaultProvider,
		manifestPlugins: params.manifestPlugins
	});
	if (openrouterCompatRef) {
		const status = getModelRefStatusForResolve(params, openrouterCompatRef);
		if (!status.allowed) return { error: `model not allowed: ${status.key}` };
		return {
			ref: openrouterCompatRef,
			key: status.key
		};
	}
	return require_model_selection_shared.resolveAllowedModelRefFromAliasIndex({
		cfg: params.cfg,
		raw: params.raw,
		defaultProvider: params.defaultProvider,
		aliasIndex,
		manifestPlugins: params.manifestPlugins,
		getStatus: (ref) => getModelRefStatusForResolve(params, ref)
	});
}
/** Default reasoning level when session/directive do not set it: "on" if model supports reasoning, else "off". */
function resolveReasoningDefault(params) {
	const key = require_model_selection_normalize.modelKey(params.provider, params.model);
	return (params.catalog?.find((entry) => entry.provider === params.provider && entry.id === params.model || entry.provider === key && entry.id === params.model))?.reasoning === true ? "on" : "off";
}
//#endregion
Object.defineProperty(exports, "buildAllowedModelSet", {
	enumerable: true,
	get: function() {
		return buildAllowedModelSet;
	}
});
Object.defineProperty(exports, "model_selection_exports", {
	enumerable: true,
	get: function() {
		return model_selection_exports;
	}
});
Object.defineProperty(exports, "normalizeStoredOverrideModel", {
	enumerable: true,
	get: function() {
		return normalizeStoredOverrideModel;
	}
});
Object.defineProperty(exports, "resolveAllowedModelRef", {
	enumerable: true,
	get: function() {
		return resolveAllowedModelRef;
	}
});
Object.defineProperty(exports, "resolveConfiguredSubagentSpawnModelSelection", {
	enumerable: true,
	get: function() {
		return resolveConfiguredSubagentSpawnModelSelection;
	}
});
Object.defineProperty(exports, "resolvePersistedOverrideModelRef", {
	enumerable: true,
	get: function() {
		return resolvePersistedOverrideModelRef;
	}
});
Object.defineProperty(exports, "resolvePersistedSelectedModelRef", {
	enumerable: true,
	get: function() {
		return resolvePersistedSelectedModelRef;
	}
});
Object.defineProperty(exports, "resolveReasoningDefault", {
	enumerable: true,
	get: function() {
		return resolveReasoningDefault;
	}
});
Object.defineProperty(exports, "resolveSubagentSpawnModelSelection", {
	enumerable: true,
	get: function() {
		return resolveSubagentSpawnModelSelection;
	}
});
