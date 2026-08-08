const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_store = require("./store-DCwJguwr.cjs");
const require_model_selection = require("./model-selection-BvFurMxy.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/stored-model-override.ts
function resolveParentSessionKeyCandidate(params) {
	const explicit = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.parentSessionKey);
	if (explicit && explicit !== params.sessionKey) return explicit;
	const derived = require_store.resolveSessionParentSessionKey(params.sessionKey);
	if (derived && derived !== params.sessionKey) return derived;
	return null;
}
/** Resolves the persisted model override visible to the current session. */
function resolveStoredModelOverride(params) {
	const directOverride = require_model_selection.normalizeStoredOverrideModel({
		providerOverride: params.sessionEntry?.providerOverride,
		modelOverride: params.sessionEntry?.modelOverride
	});
	const direct = require_model_selection.resolvePersistedOverrideModelRef({
		defaultProvider: params.defaultProvider,
		overrideProvider: directOverride.providerOverride,
		overrideModel: directOverride.modelOverride
	});
	if (direct) return {
		...direct,
		source: "session"
	};
	const parentKey = resolveParentSessionKeyCandidate({
		sessionKey: params.sessionKey,
		parentSessionKey: params.parentSessionKey
	});
	if (!parentKey) return null;
	const parentEntry = params.loadSessionEntry?.(parentKey) ?? params.sessionStore?.[parentKey];
	const normalizedParentOverride = require_model_selection.normalizeStoredOverrideModel({
		providerOverride: parentEntry?.providerOverride,
		modelOverride: parentEntry?.modelOverride
	});
	const parentOverride = require_model_selection.resolvePersistedOverrideModelRef({
		defaultProvider: params.defaultProvider,
		overrideProvider: normalizedParentOverride.providerOverride,
		overrideModel: normalizedParentOverride.modelOverride
	});
	if (!parentOverride) return null;
	return {
		...parentOverride,
		source: "parent"
	};
}
function resolveModelRefKey(params) {
	const normalizedOverride = require_model_selection.normalizeStoredOverrideModel({
		providerOverride: params.overrideProvider,
		modelOverride: params.overrideModel
	});
	const ref = require_model_selection.resolvePersistedOverrideModelRef({
		defaultProvider: params.defaultProvider,
		overrideProvider: normalizedOverride.providerOverride,
		overrideModel: normalizedOverride.modelOverride
	});
	if (!ref) return null;
	const normalizedRef = require_model_selection_normalize.normalizeModelRef(ref.provider, ref.model);
	return require_model_selection_normalize.modelKey(normalizedRef.provider, normalizedRef.model);
}
/** Detects heartbeat auto-fallback overrides that no longer match the primary model. */
function isStaleHeartbeatAutoFallbackOverride(params) {
	if (params.isHeartbeat !== true || params.hasResolvedHeartbeatModelOverride === true) return false;
	if (params.storedOverride?.source !== "session") return false;
	const entry = params.sessionEntry;
	const recoveredAutoFallbackOverride = entry !== void 0 && entry.modelOverrideSource === void 0 && require_agent_scope.hasSessionAutoModelFallbackProvenance(entry);
	if (entry?.modelOverrideSource !== "auto" && !recoveredAutoFallbackOverride) return false;
	if (!entry) return false;
	const primaryKey = resolveModelRefKey({
		defaultProvider: params.defaultProvider,
		overrideProvider: params.primaryProvider ?? params.defaultProvider,
		overrideModel: params.primaryModel ?? params.defaultModel
	});
	if (!primaryKey) return false;
	const originKey = resolveModelRefKey({
		defaultProvider: params.defaultProvider,
		overrideProvider: entry.modelOverrideFallbackOriginProvider,
		overrideModel: entry.modelOverrideFallbackOriginModel
	});
	if (originKey) return originKey !== primaryKey;
	const noticeSelectedKey = resolveModelRefKey({
		defaultProvider: params.defaultProvider,
		overrideModel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.fallbackNoticeSelectedModel)
	});
	if (noticeSelectedKey) return noticeSelectedKey !== primaryKey;
	const storedOverrideKey = resolveModelRefKey({
		defaultProvider: params.defaultProvider,
		overrideProvider: params.storedOverride.provider,
		overrideModel: params.storedOverride.model
	});
	return storedOverrideKey !== null && storedOverrideKey !== primaryKey;
}
//#endregion
Object.defineProperty(exports, "isStaleHeartbeatAutoFallbackOverride", {
	enumerable: true,
	get: function() {
		return isStaleHeartbeatAutoFallbackOverride;
	}
});
Object.defineProperty(exports, "resolveStoredModelOverride", {
	enumerable: true,
	get: function() {
		return resolveStoredModelOverride;
	}
});
