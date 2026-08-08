const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_model_selection = require("./model-selection-BvFurMxy.cjs");
const require_session_runtime_compat = require("./session-runtime-compat-B8Zu61mN.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/live-model-switch.ts
/**
* Resolves and persists live-session model switch requests.
*/
const OPENAI_PROVIDER_ID = "openai";
const OPENAI_CODEX_PROVIDER_ID = "openai";
function resolveLiveSessionModelSelection(params) {
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	const cfg = params.cfg;
	if (!cfg || !sessionKey) return null;
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.agentId);
	const defaultModelRef = agentId ? require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg,
		agentId
	}) : {
		provider: params.defaultProvider,
		model: params.defaultModel
	};
	const entry = require_session_accessor.loadSessionEntry({
		storePath: require_paths.resolveStorePath(cfg.session?.store, { agentId }),
		sessionKey,
		hydrateSkillPromptRefs: false,
		readConsistency: "latest"
	});
	const normalizedSelection = require_model_selection.normalizeStoredOverrideModel({
		providerOverride: entry?.providerOverride,
		modelOverride: entry?.modelOverride
	});
	const persisted = require_model_selection.resolvePersistedSelectedModelRef({
		defaultProvider: defaultModelRef.provider,
		runtimeProvider: entry?.modelProvider,
		runtimeModel: entry?.model,
		overrideProvider: normalizedSelection.providerOverride,
		overrideModel: normalizedSelection.modelOverride
	});
	const provider = persisted?.provider ?? normalizedSelection.providerOverride ?? entry?.providerOverride?.trim() ?? defaultModelRef.provider;
	const model = persisted?.model ?? defaultModelRef.model;
	const agentRuntimeOverride = require_session_runtime_compat.resolveSessionRuntimeOverrideForProvider({
		provider,
		entry,
		cfg
	});
	const authProfileId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.authProfileOverride);
	return {
		provider,
		model,
		...agentRuntimeOverride ? { agentRuntimeOverride } : {},
		authProfileId,
		authProfileIdSource: authProfileId ? entry?.authProfileOverrideSource : void 0
	};
}
function isAlreadyAppliedOpenAICodexRuntimePromotion(current, next) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(current.provider) === OPENAI_CODEX_PROVIDER_ID && (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(next.provider) === OPENAI_PROVIDER_ID && current.model === next.model;
}
function hasDifferentLiveSessionModelSelection(current, next) {
	if (!next) return false;
	return (current.provider !== next.provider || current.model !== next.model) && !isAlreadyAppliedOpenAICodexRuntimePromotion(current, next) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(current.agentRuntimeOverride) !== next.agentRuntimeOverride || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(current.authProfileId) !== next.authProfileId || ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(current.authProfileId) ? current.authProfileIdSource : void 0) !== next.authProfileIdSource;
}
/**
* Check whether a user-initiated live model switch is pending for the given
* session.  Returns the persisted model selection when the session's
* `liveModelSwitchPending` flag is `true` AND the persisted selection differs
* from the currently running model; otherwise returns `undefined`.
*
* When the flag is set but the current model already matches the persisted
* selection (e.g. the switch was applied as an override and the current
* attempt is already using the new model), the flag is consumed (cleared)
* eagerly to prevent it from persisting as stale state.
*
* **Deferral semantics:** The caller in `run.ts` only acts on the returned
* selection when `canRestartForLiveSwitch` is `true`.  If the run cannot
* restart (e.g. a tool call is in progress), the flag intentionally remains
* set so the switch fires on the next clean retry opportunity — even if that
* falls into a subsequent user turn.
*
* This replaces the previous approach that used an in-memory run-state map,
* which could not distinguish between
* user-initiated `/model` switches and system-initiated fallback rotations.
*/
function shouldSwitchToLiveModel(params) {
	const sessionKey = params.sessionKey?.trim();
	const cfg = params.cfg;
	if (!cfg || !sessionKey) return;
	if (!require_session_accessor.loadSessionEntry({
		storePath: require_paths.resolveStorePath(cfg.session?.store, { agentId: params.agentId?.trim() }),
		sessionKey,
		hydrateSkillPromptRefs: false,
		clone: false,
		readConsistency: "latest"
	})?.liveModelSwitchPending) return;
	const persisted = resolveLiveSessionModelSelection({
		cfg,
		sessionKey,
		agentId: params.agentId,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel
	});
	if (!hasDifferentLiveSessionModelSelection({
		provider: params.currentProvider,
		model: params.currentModel,
		agentRuntimeOverride: params.currentAgentRuntimeOverride,
		authProfileId: params.currentAuthProfileId,
		authProfileIdSource: params.currentAuthProfileIdSource
	}, persisted)) {
		clearLiveModelSwitchPending({
			cfg,
			sessionKey,
			agentId: params.agentId
		}).catch(() => {});
		return;
	}
	return persisted ?? void 0;
}
/**
* Clear the `liveModelSwitchPending` flag from the session entry on disk so
* subsequent retry iterations do not re-trigger the switch.
*/
async function clearLiveModelSwitchPending(params) {
	const sessionKey = params.sessionKey?.trim();
	const cfg = params.cfg;
	if (!cfg || !sessionKey) return;
	const storePath = require_paths.resolveStorePath(cfg.session?.store, { agentId: params.agentId?.trim() });
	if (!storePath) return;
	await require_session_accessor.patchSessionEntry({
		storePath,
		sessionKey
	}, (entry) => {
		const next = { ...entry };
		delete next.liveModelSwitchPending;
		return next;
	}, { replaceEntry: true });
}
//#endregion
Object.defineProperty(exports, "clearLiveModelSwitchPending", {
	enumerable: true,
	get: function() {
		return clearLiveModelSwitchPending;
	}
});
Object.defineProperty(exports, "shouldSwitchToLiveModel", {
	enumerable: true,
	get: function() {
		return shouldSwitchToLiveModel;
	}
});
