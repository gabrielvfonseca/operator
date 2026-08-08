const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_model_selection = require("./model-selection-BvFurMxy.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/session-model-ref.ts
function resolveSessionModelRef(cfg, entry, agentId, options) {
	const normalizedOverride = require_model_selection.normalizeStoredOverrideModel({
		providerOverride: entry?.providerOverride,
		modelOverride: entry?.modelOverride
	});
	if (normalizedOverride.providerOverride && normalizedOverride.modelOverride) return require_model_selection.resolvePersistedSelectedModelRef({
		defaultProvider: normalizedOverride.providerOverride,
		overrideProvider: normalizedOverride.providerOverride,
		overrideModel: normalizedOverride.modelOverride,
		allowPluginNormalization: options?.allowPluginNormalization
	});
	const runtimeProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.modelProvider);
	const runtimeModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.model);
	const resolved = agentId ? require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg,
		agentId,
		allowPluginNormalization: options?.allowPluginNormalization
	}) : require_model_selection_shared.resolveConfiguredModelRef({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL,
		allowPluginNormalization: options?.allowPluginNormalization
	});
	return require_model_selection.resolvePersistedSelectedModelRef({
		defaultProvider: resolved.provider || "openrouter",
		runtimeProvider: agentId ? void 0 : runtimeProvider,
		runtimeModel: agentId ? void 0 : runtimeModel,
		overrideProvider: normalizedOverride.providerOverride,
		overrideModel: normalizedOverride.modelOverride,
		allowPluginNormalization: options?.allowPluginNormalization
	}) ?? resolved;
}
function resolveSessionModelIdentityRef(cfg, entry, agentId, fallbackModelRef, options) {
	const runtimeModel = entry?.model?.trim();
	const runtimeProvider = entry?.modelProvider?.trim();
	if (runtimeModel) {
		if (runtimeProvider) return {
			provider: runtimeProvider,
			model: runtimeModel
		};
		const inferredProvider = require_model_selection_shared.inferUniqueProviderFromConfiguredModels({
			cfg,
			model: runtimeModel
		});
		if (inferredProvider) return {
			provider: inferredProvider,
			model: runtimeModel
		};
		if (runtimeModel.includes("/")) {
			const parsedRuntime = require_model_selection_normalize.parseModelRef(runtimeModel, require_defaults.DEFAULT_PROVIDER, { allowPluginNormalization: options?.allowPluginNormalization });
			if (parsedRuntime) return {
				provider: parsedRuntime.provider,
				model: parsedRuntime.model
			};
			return { model: runtimeModel };
		}
		return { model: runtimeModel };
	}
	const fallbackRef = fallbackModelRef?.trim();
	if (fallbackRef) {
		const parsedFallback = require_model_selection_normalize.parseModelRef(fallbackRef, require_defaults.DEFAULT_PROVIDER, { allowPluginNormalization: options?.allowPluginNormalization });
		if (parsedFallback) return {
			provider: parsedFallback.provider,
			model: parsedFallback.model
		};
		const inferredProvider = require_model_selection_shared.inferUniqueProviderFromConfiguredModels({
			cfg,
			model: fallbackRef
		});
		if (inferredProvider) return {
			provider: inferredProvider,
			model: fallbackRef
		};
		return { model: fallbackRef };
	}
	const resolved = resolveSessionModelRef(cfg, entry, agentId, { allowPluginNormalization: options?.allowPluginNormalization });
	return {
		provider: resolved.provider,
		model: resolved.model
	};
}
//#endregion
Object.defineProperty(exports, "resolveSessionModelIdentityRef", {
	enumerable: true,
	get: function() {
		return resolveSessionModelIdentityRef;
	}
});
Object.defineProperty(exports, "resolveSessionModelRef", {
	enumerable: true,
	get: function() {
		return resolveSessionModelRef;
	}
});
