const require_provider_attribution = require("./provider-attribution-CIUHVFNx.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
//#region src/agents/agent-compaction-constants.ts
/**
* Absolute minimum prompt budget in tokens.  When the context window is
* large enough that `contextTokenBudget * MIN_PROMPT_BUDGET_RATIO` exceeds
* this value, this absolute floor takes precedence.
*/
const MIN_PROMPT_BUDGET_TOKENS = 8e3;
/**
* Minimum share of the context window that must remain available for prompt
* content after reserve tokens are subtracted.
*/
const MIN_PROMPT_BUDGET_RATIO = .5;
//#endregion
//#region src/agents/agent-settings.ts
/** Applies agent compaction settings and small-context overflow guards. */
const DEFAULT_AGENT_COMPACTION_RESERVE_TOKENS_FLOOR = 2e4;
/** Resolves the configured reserve-token floor for agent compaction. */
function resolveCompactionReserveTokensFloor(cfg) {
	const raw = cfg?.agents?.defaults?.compaction?.reserveTokensFloor;
	if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
	return DEFAULT_AGENT_COMPACTION_RESERVE_TOKENS_FLOOR;
}
function toNonNegativeInt(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return;
	return Math.floor(value);
}
function toPositiveInt(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
	return Math.floor(value);
}
/** Applies configured compaction reserve/keep-recent settings to an agent settings manager. */
function applyAgentCompactionSettingsFromConfig(params) {
	const currentReserveTokens = params.settingsManager.getCompactionReserveTokens();
	const currentKeepRecentTokens = params.settingsManager.getCompactionKeepRecentTokens();
	const compactionCfg = params.cfg?.agents?.defaults?.compaction;
	const configuredReserveTokens = toNonNegativeInt(compactionCfg?.reserveTokens);
	const configuredKeepRecentTokens = toPositiveInt(compactionCfg?.keepRecentTokens);
	let reserveTokensFloor = resolveCompactionReserveTokensFloor(params.cfg);
	let maxReserveTokens;
	const contextTokenBudget = toPositiveInt(params.contextTokenBudget);
	if (contextTokenBudget !== void 0) {
		const minPromptBudget = Math.min(MIN_PROMPT_BUDGET_TOKENS, Math.max(1, Math.floor(contextTokenBudget * MIN_PROMPT_BUDGET_RATIO)));
		maxReserveTokens = Math.max(0, contextTokenBudget - minPromptBudget);
		reserveTokensFloor = Math.min(reserveTokensFloor, maxReserveTokens);
	}
	let targetReserveTokens = Math.max(configuredReserveTokens ?? currentReserveTokens, reserveTokensFloor);
	if (maxReserveTokens !== void 0) targetReserveTokens = Math.min(targetReserveTokens, maxReserveTokens);
	const targetKeepRecentTokens = configuredKeepRecentTokens ?? currentKeepRecentTokens;
	const overrides = {};
	if (targetReserveTokens !== currentReserveTokens) overrides.reserveTokens = targetReserveTokens;
	if (targetKeepRecentTokens !== currentKeepRecentTokens) overrides.keepRecentTokens = targetKeepRecentTokens;
	const didOverride = Object.keys(overrides).length > 0;
	if (didOverride) params.settingsManager.applyOverrides({ compaction: overrides });
	return {
		didOverride,
		compaction: {
			reserveTokens: targetReserveTokens,
			keepRecentTokens: targetKeepRecentTokens
		}
	};
}
/** Resolve the compaction mode after provider-backed safeguard promotion. */
function resolveEffectiveCompactionMode(cfg) {
	const compaction = cfg?.agents?.defaults?.compaction;
	if (compaction?.provider) return "safeguard";
	return compaction?.mode === "safeguard" ? "safeguard" : "default";
}
/**
* Detect providers whose shared model runtime `isContextOverflow` Case 2 (silent overflow)
* fires on a successful turn and triggers Operator runtime's `_runAutoCompaction` from
* inside `Session.prompt()`, collapsing `agent.state.messages` before the
* provider call (openclaw#75799).
*
* True on any of: `zai-native` endpoint class, normalized provider id `zai`,
* a `z-ai/` / `openrouter/z-ai/` model-id namespace prefix, or a bare `glm-`
* model id (no namespace prefix) — the latter covers in-house gateways that
* expose Zhipu's GLM family directly without a `z-ai/` qualifier. Intentionally
* narrow: namespaced GLM ids that route through other providers (e.g.
* `ollama/glm-*`, `opencode-go/glm-*`) are NOT included because their hosts
* have their own overflow accounting and may not exhibit the z.ai silent-
* overflow shape. Other providers documented as silently truncating are not
* added without a reproducible repro.
*/
function isSilentOverflowProneModel(model) {
	if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(typeof model.provider === "string" ? model.provider : "") === "zai") return true;
	if (typeof model.baseUrl === "string" && model.baseUrl.length > 0) {
		if (require_provider_attribution.resolveProviderEndpoint(model.baseUrl).endpointClass === "zai-native") return true;
	}
	if (typeof model.modelId === "string" && model.modelId.length > 0) {
		const normalized = model.modelId.toLowerCase();
		if (normalized.startsWith("z-ai/") || normalized.startsWith("openrouter/z-ai/") || normalized.startsWith("glm-")) return true;
	}
	return false;
}
/**
* Disable Operator runtime's `_checkCompaction → _runAutoCompaction` (which would otherwise
* fire from inside `Session.prompt()` and reassign `agent.state.messages`
* before the provider call) when Operator or a plugin owns compaction:
* `contextEngineInfo.ownsCompaction === true`, effective safeguard compaction,
* or an active model that is silent-overflow-prone (openclaw#75799).
* Default-mode runs against ordinary providers keep Operator runtime's auto-compaction as
* the existing baseline.
*/
function shouldDisableAgentAutoCompaction(params) {
	return params.contextEngineInfo?.ownsCompaction === true || params.compactionMode === "safeguard" || params.silentOverflowProneProvider === true;
}
/**
* Apply the auto-compaction guard. Callers that reload a `DefaultResourceLoader`
* MUST call this AGAIN after each `reload()` — `settingsManager.reload()`
* rehydrates `compaction.enabled` from disk and silently restores Operator runtime's
* default-on behavior, undoing the guard. Mirrors the existing
* `applyAgentCompactionSettingsFromConfig` re-call pattern at the same sites.
*/
function applyAgentAutoCompactionGuard(params) {
	const disable = shouldDisableAgentAutoCompaction({
		contextEngineInfo: params.contextEngineInfo,
		compactionMode: params.compactionMode,
		silentOverflowProneProvider: params.silentOverflowProneProvider
	});
	const hasMethod = typeof params.settingsManager.setCompactionEnabled === "function";
	if (!disable || !hasMethod) return {
		supported: hasMethod,
		disabled: false
	};
	params.settingsManager.setCompactionEnabled(false);
	return {
		supported: true,
		disabled: true
	};
}
//#endregion
Object.defineProperty(exports, "MIN_PROMPT_BUDGET_RATIO", {
	enumerable: true,
	get: function() {
		return MIN_PROMPT_BUDGET_RATIO;
	}
});
Object.defineProperty(exports, "MIN_PROMPT_BUDGET_TOKENS", {
	enumerable: true,
	get: function() {
		return MIN_PROMPT_BUDGET_TOKENS;
	}
});
Object.defineProperty(exports, "applyAgentAutoCompactionGuard", {
	enumerable: true,
	get: function() {
		return applyAgentAutoCompactionGuard;
	}
});
Object.defineProperty(exports, "applyAgentCompactionSettingsFromConfig", {
	enumerable: true,
	get: function() {
		return applyAgentCompactionSettingsFromConfig;
	}
});
Object.defineProperty(exports, "isSilentOverflowProneModel", {
	enumerable: true,
	get: function() {
		return isSilentOverflowProneModel;
	}
});
Object.defineProperty(exports, "resolveEffectiveCompactionMode", {
	enumerable: true,
	get: function() {
		return resolveEffectiveCompactionMode;
	}
});
