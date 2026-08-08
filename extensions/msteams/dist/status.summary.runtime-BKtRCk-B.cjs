require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_model_selection = require("./model-selection-BvFurMxy.cjs");
const require_session_meta = require("./session-meta-BKZldXXC.cjs");
const require_agent_runtime_metadata = require("./agent-runtime-metadata-DAHq7Kgy.cjs");
const require_context = require("./context-Ddgh80NW.cjs");
const require_agent_runtime_label = require("./agent-runtime-label-UoVo0nrE.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/sessions/classify-session-kind.ts
/**
* Classify a session key + entry into a display kind.
*
* Evaluation order matters — more-specific signals take priority:
*   1. sentinel keys ("global", "unknown")
*   2. cron key shape
*   3. spawn-child (entry has `spawnedBy`) — checked before key-shape so ACP
*      spawn-child sessions with opaque keys are not misclassified as "direct"
*   4. group/channel chatType or key-shape substring
*   5. fallback: "direct"
*/
function classifySessionKind(key, entry) {
	if (key === "global") return "global";
	if (key === "unknown") return "unknown";
	if (require_session_key.isCronSessionKey(key)) return "cron";
	if (entry?.spawnedBy) return "spawn-child";
	if (entry?.chatType === "group" || entry?.chatType === "channel") return "group";
	if (key.includes(":group:") || key.includes(":channel:")) return "group";
	return "direct";
}
//#endregion
//#region src/commands/status.summary.runtime.ts
function resolveStatusModelRefFromRaw(params) {
	const trimmed = params.rawModel.trim();
	if (!trimmed) return null;
	const configuredModels = params.cfg.agents?.defaults?.models ?? {};
	if (!trimmed.includes("/")) {
		const aliasKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
		for (const [modelKey, entry] of Object.entries(configuredModels)) {
			const aliasValue = entry?.alias;
			const alias = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(aliasValue) ?? "";
			if (!alias || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(alias) !== aliasKey) continue;
			const parsed = require_model_selection_normalize.parseModelRef(modelKey, params.defaultProvider, {
				allowManifestNormalization: false,
				allowPluginNormalization: false
			});
			if (parsed) return parsed;
		}
		return {
			provider: params.defaultProvider,
			model: trimmed
		};
	}
	return require_model_selection_normalize.parseModelRef(trimmed, params.defaultProvider, {
		allowManifestNormalization: false,
		allowPluginNormalization: false
	});
}
function resolveConfiguredStatusModelRef(params) {
	const agentRawModel = params.agentId ? require_model_input.resolveAgentModelPrimaryValue(params.cfg.agents?.list?.find((entry) => entry?.id === params.agentId)?.model) : void 0;
	if (agentRawModel) {
		const parsed = resolveStatusModelRefFromRaw({
			cfg: params.cfg,
			rawModel: agentRawModel,
			defaultProvider: params.defaultProvider
		});
		if (parsed) return parsed;
	}
	const defaultsRawModel = require_model_input.resolveAgentModelPrimaryValue(params.cfg.agents?.defaults?.model);
	if (defaultsRawModel) {
		const parsed = resolveStatusModelRefFromRaw({
			cfg: params.cfg,
			rawModel: defaultsRawModel,
			defaultProvider: params.defaultProvider
		});
		if (parsed) return parsed;
	}
	const fallbackProvider = require_model_selection_shared.resolveConfiguredProviderFallback({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider
	});
	if (fallbackProvider) return fallbackProvider;
	return {
		provider: params.defaultProvider,
		model: params.defaultModel
	};
}
function resolveProviderlessPersistedStatusModelRef(params) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider);
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model);
	if (!model || provider || model.includes("/") || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(model) === "openrouter:auto") return null;
	return {
		provider: params.defaultProvider,
		model
	};
}
function resolveStatusModelLookupRef(params) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider);
	const model = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model);
	if (!model) return null;
	const defaultProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.defaultProvider) ?? provider ?? "openrouter";
	return require_model_selection_normalize.parseModelRef(provider ? `${provider}/${model}` : model, defaultProvider, {
		allowManifestNormalization: false,
		allowPluginNormalization: false
	}) ?? {
		provider: provider ?? defaultProvider,
		model
	};
}
function resolveStatusModelComparisonLabel(params) {
	const ref = resolveStatusModelLookupRef(params);
	return ref ? `${ref.provider}/${ref.model}` : null;
}
function resolveSessionModelRef(cfg, entry, agentId) {
	const resolved = resolveConfiguredStatusModelRef({
		cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL,
		agentId
	});
	const defaultProvider = resolved.provider || "openrouter";
	const providerlessPersisted = resolveProviderlessPersistedStatusModelRef({
		defaultProvider,
		provider: entry?.providerOverride,
		model: entry?.modelOverride
	}) ?? resolveProviderlessPersistedStatusModelRef({
		defaultProvider,
		provider: entry?.modelProvider,
		model: entry?.model
	});
	if (providerlessPersisted) return providerlessPersisted;
	return require_model_selection.resolvePersistedSelectedModelRef({
		defaultProvider,
		runtimeProvider: entry?.modelProvider,
		runtimeModel: entry?.model,
		overrideProvider: entry?.providerOverride,
		overrideModel: entry?.modelOverride,
		allowManifestNormalization: false,
		allowPluginNormalization: false
	}) ?? resolved;
}
function resolveSessionRuntimeLabel(params) {
	const acpSessionKey = params.agentId ? require_session_accessor.resolveStoredSessionKeyForAgentStore({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	}) : params.sessionKey;
	const acpMeta = require_session_meta.readAcpSessionMeta({ sessionKey: acpSessionKey });
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(require_agent_runtime_metadata.resolveModelAgentRuntimeMetadata({
		cfg: params.cfg,
		agentId: params.agentId ?? "",
		sessionEntry: params.entry,
		provider: params.provider,
		model: params.model,
		sessionKey: acpSessionKey,
		acpRuntime: acpMeta != null,
		acpBackend: acpMeta?.backend
	}).id);
	const resolvedHarness = id && id !== "@gabrielvfonseca/operator" && id !== "auto" ? id : void 0;
	return require_agent_runtime_label.resolveAgentRuntimeLabel({
		config: params.cfg,
		sessionEntry: params.entry,
		resolvedHarness,
		fallbackProvider: params.provider
	});
}
const statusSummaryRuntime = {
	waitForContextWindowCacheLoad: require_context.waitForContextWindowCacheLoad,
	resolveContextTokensForModel: require_context.resolveContextTokensForModelFromCache,
	classifySessionKey: classifySessionKind,
	resolveSessionModelRef,
	resolveSessionRuntimeLabel,
	resolveConfiguredStatusModelRef,
	resolveStatusModelLookupRef,
	resolveStatusModelComparisonLabel
};
//#endregion
exports.statusSummaryRuntime = statusSummaryRuntime;
