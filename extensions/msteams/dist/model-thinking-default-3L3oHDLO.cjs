const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-resolve-DIIpxg9p.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/model-thinking-default.ts
/**
* Resolves default thinking levels for provider/model pairs. It combines
* explicit per-model config, global defaults, catalog metadata, and model
* family fallbacks.
*/
/** Resolves the default thinking level for a provider/model pair. */
function resolveThinkingDefault(params) {
	const normalizedProvider = require_model_selection_normalize.normalizeProviderId(params.provider);
	const normalizedModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.model).replace(/\./g, "-");
	const catalog = Array.isArray(params.catalog) ? params.catalog : require_model_selection_shared.buildConfiguredModelCatalog({ cfg: params.cfg });
	const catalogCandidate = catalog.find((entry) => entry.provider === params.provider && entry.id === params.model);
	const configuredModels = params.cfg.agents?.defaults?.models;
	const canonicalKey = require_model_selection_normalize.modelKey(params.provider, params.model);
	const legacyKey = require_model_selection_normalize.legacyModelKey(params.provider, params.model);
	const normalizedCanonicalKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(canonicalKey);
	const normalizedLegacyKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(legacyKey);
	const normalizedPrimarySelection = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(require_model_selection_shared.normalizeModelSelection(params.cfg.agents?.defaults?.model));
	const explicitModelConfigured = (configuredModels ? canonicalKey in configuredModels : false) || Boolean(legacyKey && configuredModels && legacyKey in configuredModels) || normalizedPrimarySelection === normalizedCanonicalKey || Boolean(normalizedLegacyKey && normalizedPrimarySelection === normalizedLegacyKey) || normalizedPrimarySelection === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.model);
	const perModelThinking = configuredModels?.[canonicalKey]?.params?.thinking ?? (legacyKey ? configuredModels?.[legacyKey]?.params?.thinking : void 0);
	if (perModelThinking === false || perModelThinking === "disabled" || perModelThinking === "none") return "off";
	if (perModelThinking === "off" || perModelThinking === "minimal" || perModelThinking === "low" || perModelThinking === "medium" || perModelThinking === "high" || perModelThinking === "xhigh" || perModelThinking === "adaptive" || perModelThinking === "max" || perModelThinking === "ultra") return perModelThinking;
	const configured = params.cfg.agents?.defaults?.thinkingDefault;
	if (configured) return configured;
	const isClaudeProvider = normalizedProvider === "anthropic" || normalizedProvider === "anthropic-vertex" || normalizedProvider === "claude-cli";
	if (isClaudeProvider && (normalizedModel.startsWith("claude-opus-4-8") || normalizedModel.startsWith("claude-opus-4.8"))) return "off";
	if (isClaudeProvider && (normalizedModel.startsWith("claude-opus-4-7") || normalizedModel.startsWith("claude-opus-4.7"))) return "off";
	if (normalizedProvider === "anthropic" && explicitModelConfigured && typeof catalogCandidate?.name === "string" && /4\.6\b/.test(catalogCandidate.name) && (normalizedModel.startsWith("claude-opus-4-6") || normalizedModel.startsWith("claude-sonnet-4-6"))) return "adaptive";
	return require_thinking.resolveThinkingDefaultForModel({
		provider: params.provider,
		model: params.model,
		catalog,
		agentRuntime: params.agentRuntime
	});
}
/** Resolves thinking default after loading runtime catalog only when needed. */
async function resolveThinkingDefaultWithRuntimeCatalog(params) {
	const configuredCatalog = require_model_selection_shared.buildConfiguredModelCatalog({ cfg: params.cfg });
	const configuredSelectedEntry = configuredCatalog.find((entry) => entry.provider === params.provider && entry.id === params.model);
	const runtimeCatalog = configuredCatalog.length === 0 || !configuredSelectedEntry || configuredSelectedEntry.reasoning === void 0 ? await params.loadModelCatalog() : void 0;
	const catalog = runtimeCatalog?.find((entry) => entry.provider === params.provider && entry.id === params.model) || configuredCatalog.length === 0 ? runtimeCatalog ?? configuredCatalog : configuredCatalog;
	return resolveThinkingDefault({
		cfg: params.cfg,
		provider: params.provider,
		model: params.model,
		catalog,
		agentRuntime: params.agentRuntime
	});
}
//#endregion
Object.defineProperty(exports, "resolveThinkingDefault", {
	enumerable: true,
	get: function() {
		return resolveThinkingDefault;
	}
});
Object.defineProperty(exports, "resolveThinkingDefaultWithRuntimeCatalog", {
	enumerable: true,
	get: function() {
		return resolveThinkingDefaultWithRuntimeCatalog;
	}
});
