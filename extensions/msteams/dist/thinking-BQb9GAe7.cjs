const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime_state_key = require("./runtime-state-key-DcNuimnV.cjs");
const require_provider_policy_surface = require("./provider-policy-surface-BvfZK2wb.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_llm_core = require("@gabrielvfonseca/llm-core");
[
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"adaptive",
	"max",
	"ultra"
].join("|");
const BASE_THINKING_LEVELS = [
	"off",
	"minimal",
	"low",
	"medium",
	"high"
];
const THINKING_LEVEL_RANKS = {
	off: 0,
	minimal: 10,
	low: 20,
	medium: 30,
	high: 40,
	adaptive: 30,
	xhigh: 60,
	max: 70,
	ultra: 80
};
/** Normalizes user-provided thinking level strings to the canonical enum. */
function normalizeThinkLevel(raw) {
	const key = require_string_coerce.normalizeOptionalLowercaseString(raw);
	if (!key) return;
	const collapsed = key.replace(/[\s_-]+/g, "");
	if (collapsed === "adaptive" || collapsed === "auto") return "adaptive";
	if (collapsed === "max") return "max";
	if (collapsed === "ultra") return "ultra";
	if (collapsed === "xhigh" || collapsed === "extrahigh") return "xhigh";
	if (["off"].includes(key)) return "off";
	if ([
		"on",
		"enable",
		"enabled"
	].includes(key)) return "low";
	if (["min", "minimal"].includes(key)) return "minimal";
	if ([
		"low",
		"thinkhard",
		"think-hard",
		"think_hard"
	].includes(key)) return "low";
	if ([
		"mid",
		"med",
		"medium",
		"thinkharder",
		"think-harder",
		"harder"
	].includes(key)) return "medium";
	if ([
		"high",
		"ultrathink",
		"think-hard",
		"thinkhardest",
		"highest"
	].includes(key)) return "high";
	if (["think"].includes(key)) return "minimal";
}
/** Returns true for command values that clear an inherited session override. */
function isSessionDefaultDirectiveValue(raw) {
	const key = require_string_coerce.normalizeOptionalLowercaseString(raw);
	if (!key) return false;
	return [
		"default",
		"inherit",
		"inherited",
		"clear",
		"reset",
		"unpin"
	].includes(key);
}
/** Chooses the default thinking level for one provider/model catalog entry. */
function resolveThinkingDefaultForModel$1(params) {
	if ((params.catalog?.find((entry) => entry.provider === params.provider && entry.id === params.model))?.reasoning) return "low";
	return "off";
}
function normalizeOnOffFullLevel(raw) {
	const key = require_string_coerce.normalizeOptionalLowercaseString(raw);
	if (!key) return;
	if ([
		"off",
		"false",
		"no",
		"0"
	].includes(key)) return "off";
	if ([
		"full",
		"all",
		"everything"
	].includes(key)) return "full";
	if ([
		"on",
		"minimal",
		"true",
		"yes",
		"1"
	].includes(key)) return "on";
}
/** Normalizes /verbose values. */
function normalizeVerboseLevel(raw) {
	return normalizeOnOffFullLevel(raw);
}
/** Normalizes /trace values. */
function normalizeTraceLevel(raw) {
	const key = require_string_coerce.normalizeOptionalLowercaseString(raw);
	if (!key) return;
	if ([
		"off",
		"false",
		"no",
		"0"
	].includes(key)) return "off";
	if ([
		"on",
		"true",
		"yes",
		"1"
	].includes(key)) return "on";
	if (["raw", "unfiltered"].includes(key)) return "raw";
}
/** Normalizes response usage display values. */
function normalizeUsageDisplay(raw) {
	if (!raw) return;
	const key = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	if ([
		"off",
		"false",
		"no",
		"0",
		"disable",
		"disabled"
	].includes(key)) return "off";
	if ([
		"on",
		"true",
		"yes",
		"1",
		"enable",
		"enabled"
	].includes(key)) return "tokens";
	if ([
		"tokens",
		"token",
		"tok",
		"minimal",
		"min"
	].includes(key)) return "tokens";
	if (["full", "session"].includes(key)) return "full";
}
/** Resolves response usage display mode with the persisted default. */
function resolveResponseUsageMode(raw) {
	return normalizeUsageDisplay(raw) ?? "off";
}
function resolveMessagesResponseUsageDefault(configured, channel) {
	if (typeof configured === "string") return configured;
	if (configured && typeof configured === "object") return (channel ? configured[channel] : void 0) ?? configured.default;
}
function resolveEffectiveResponseUsage(sessionRaw, configured, channel) {
	const sessionNormalized = normalizeUsageDisplay(sessionRaw);
	if (sessionNormalized !== void 0) return sessionNormalized;
	return resolveResponseUsageMode(resolveMessagesResponseUsageDefault(configured, channel));
}
/** Normalizes elevated execution policy values. */
function normalizeElevatedLevel(raw) {
	if (!raw) return;
	const key = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	if ([
		"off",
		"false",
		"no",
		"0"
	].includes(key)) return "off";
	if ([
		"full",
		"auto",
		"auto-approve",
		"autoapprove"
	].includes(key)) return "full";
	if ([
		"ask",
		"prompt",
		"approval",
		"approve"
	].includes(key)) return "ask";
	if ([
		"on",
		"true",
		"yes",
		"1"
	].includes(key)) return "on";
}
/** Normalizes reasoning visibility values. */
function normalizeReasoningLevel(raw) {
	if (!raw) return;
	const key = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	if ([
		"off",
		"false",
		"no",
		"0",
		"hide",
		"hidden",
		"disable",
		"disabled"
	].includes(key)) return "off";
	if ([
		"on",
		"true",
		"yes",
		"1",
		"show",
		"visible",
		"enable",
		"enabled"
	].includes(key)) return "on";
	if ([
		"stream",
		"streaming",
		"draft",
		"live"
	].includes(key)) return "stream";
}
//#endregion
//#region src/plugins/provider-claude-thinking.ts
const BASE_CLAUDE_THINKING_LEVELS = [
	{ id: "off" },
	{ id: "minimal" },
	{ id: "low" },
	{ id: "medium" },
	{ id: "high" }
];
/** @deprecated Anthropic provider-owned model helper; do not use from third-party plugins. */
function isClaudeAdaptiveThinkingDefaultModelId(modelId) {
	const ref = { id: modelId };
	return (0, _gabrielvfonseca_llm_core.supportsClaudeAdaptiveThinking)(ref) && !(0, _gabrielvfonseca_llm_core.supportsClaudeNativeXhighEffort)(ref);
}
/** @deprecated Anthropic provider-owned model helper; do not use from third-party plugins. */
function resolveClaudeThinkingProfile(modelId, params, options) {
	const ref = {
		id: modelId,
		params
	};
	const canonicalModelId = (0, _gabrielvfonseca_llm_core.resolveClaudeModelIdentity)(ref);
	if ((0, _gabrielvfonseca_llm_core.resolveClaudeFable5ModelIdentity)(ref) || (0, _gabrielvfonseca_llm_core.resolveClaudeMythos5ModelIdentity)(ref)) return _gabrielvfonseca_llm_core.CLAUDE_FABLE_5_THINKING_PROFILE;
	if ((0, _gabrielvfonseca_llm_core.resolveClaudeSonnet5ModelIdentity)(ref)) return _gabrielvfonseca_llm_core.CLAUDE_SONNET_5_THINKING_PROFILE;
	if ((0, _gabrielvfonseca_llm_core.supportsClaudeNativeXhighEffort)(ref)) return {
		levels: [
			...BASE_CLAUDE_THINKING_LEVELS,
			{ id: "xhigh" },
			{ id: "adaptive" },
			{ id: "max" }
		],
		defaultLevel: "off"
	};
	if (isClaudeAdaptiveThinkingDefaultModelId(canonicalModelId)) return {
		levels: [
			...BASE_CLAUDE_THINKING_LEVELS,
			{ id: "adaptive" },
			...options?.includeNativeMax ? [{ id: "max" }] : []
		],
		defaultLevel: "adaptive"
	};
	return { levels: BASE_CLAUDE_THINKING_LEVELS };
}
//#endregion
//#region src/plugins/provider-public-artifacts.ts
function resolveBundledProviderPolicyPluginId(providerId, options = {}) {
	const normalizedProviderId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	if (!normalizedProviderId) return null;
	if (!require_bundled_dir.resolveBundledPluginsDir()) return null;
	const registry = options.manifestRegistry ?? require_manifest_registry.loadPluginManifestRegistry();
	for (const plugin of registry.plugins.toSorted((left, right) => left.id.localeCompare(right.id))) {
		if (plugin.origin !== "bundled") continue;
		if (pluginOwnsProviderPolicyRef(plugin, normalizedProviderId)) return plugin.id;
	}
	return null;
}
function pluginOwnsProviderPolicyRef(plugin, normalizedProviderId) {
	const ownedProviders = new Set([...plugin.providers, ...plugin.cliBackends].map((provider) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider)).filter(Boolean));
	if (ownedProviders.has(normalizedProviderId)) return true;
	for (const [rawAlias, rawTarget] of Object.entries(plugin.providerAuthAliases ?? {})) {
		const alias = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(rawAlias);
		const target = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(rawTarget);
		if (alias === normalizedProviderId && ownedProviders.has(target)) return true;
	}
	return false;
}
/** Resolves provider policy hooks for a bundled provider or its owning plugin. */
function resolveBundledProviderPolicySurface(providerId, options = {}) {
	const normalizedProviderId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	if (!normalizedProviderId) return null;
	const directSurface = require_provider_policy_surface.resolveDirectBundledProviderPolicySurface(normalizedProviderId);
	if (directSurface) return directSurface;
	const ownerPluginId = resolveBundledProviderPolicyPluginId(normalizedProviderId, options);
	if (!ownerPluginId || ownerPluginId === normalizedProviderId) return null;
	return require_provider_policy_surface.resolveDirectBundledProviderPolicySurface(ownerPluginId);
}
/** Resolves provider policy hooks from bundled or trusted official plugin artifacts. */
function resolveProviderPolicySurface(providerId, options = {}) {
	const bundledSurface = resolveBundledProviderPolicySurface(providerId, options);
	if (bundledSurface) return bundledSurface;
	const normalizedProviderId = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	if (!normalizedProviderId || !options.manifestRegistry) return null;
	for (const plugin of options.manifestRegistry.plugins.toSorted((left, right) => left.id.localeCompare(right.id))) if (pluginOwnsProviderPolicyRef(plugin, normalizedProviderId) && plugin.trustedOfficialInstall === true) {
		const surface = require_provider_policy_surface.resolveTrustedExternalProviderPolicySurface({
			pluginId: plugin.id,
			pluginRoot: plugin.rootDir,
			trustedOfficialInstall: plugin.trustedOfficialInstall
		});
		if (surface) return surface;
	}
	return null;
}
//#endregion
//#region src/plugins/provider-thinking.ts
function matchesProviderId(provider, providerId) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	if (!normalized) return false;
	if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider.id) === normalized) return true;
	return [...provider.aliases ?? [], ...provider.hookAliases ?? []].some((alias) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(alias) === normalized);
}
function resolveActiveThinkingProvider(providerId) {
	const activeProvider = globalThis[require_runtime_state_key.PLUGIN_REGISTRY_STATE]?.activeRegistry?.providers?.find((entry) => {
		return matchesProviderId(entry.provider, providerId);
	})?.provider;
	if (activeProvider) return activeProvider;
}
function resolveProviderPublicPolicySurface(providerId) {
	return resolveProviderPolicySurface(providerId, { manifestRegistry: require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		allowScopedSnapshot: true,
		allowWorkspaceScopedSnapshot: true
	})?.manifestRegistry });
}
/** Resolves whether a provider treats thinking as binary on/off. */
function resolveProviderBinaryThinking(params) {
	return resolveActiveThinkingProvider(params.provider)?.isBinaryThinking?.(params.context);
}
/** Resolves whether a provider supports xhigh thinking. */
function resolveProviderXHighThinking(params) {
	return resolveActiveThinkingProvider(params.provider)?.supportsXHighThinking?.(params.context);
}
/** Resolves a provider thinking profile from active plugins or bundled policy surface. */
function resolveProviderThinkingProfile(params) {
	const activeProfile = resolveActiveThinkingProvider(params.provider)?.resolveThinkingProfile?.(params.context);
	if (activeProfile !== void 0) return activeProfile;
	return resolveProviderPublicPolicySurface(params.provider)?.resolveThinkingProfile?.(params.context);
}
/** Resolves the provider default thinking level from the active plugin registry. */
function resolveProviderDefaultThinkingLevel(params) {
	return resolveActiveThinkingProvider(params.provider)?.resolveDefaultThinkingLevel?.(params.context);
}
//#endregion
//#region src/auto-reply/thinking.ts
function buildCatalogModelKey(provider, model) {
	const providerId = provider.trim();
	const modelId = model.trim();
	if (!providerId) return modelId;
	if (!modelId) return providerId;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(modelId)?.startsWith(`${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId)}/`) ? modelId : `${providerId}/${modelId}`;
}
function resolveThinkingPolicyContext(params) {
	const providerRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider);
	const normalizedProvider = providerRaw ? (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerRaw) : "";
	const modelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.model) ?? "";
	const modelKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.model) ?? "";
	const selectedCatalogKey = normalizedProvider && modelId ? buildCatalogModelKey(normalizedProvider, modelId) : void 0;
	const candidate = params.catalog?.find((entry) => selectedCatalogKey !== void 0 && buildCatalogModelKey((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider), entry.id) === selectedCatalogKey);
	return {
		normalizedProvider,
		modelId,
		modelKey,
		api: candidate?.api,
		reasoning: candidate?.reasoning,
		...candidate?.params ? { params: candidate.params } : {},
		compat: candidate?.compat
	};
}
function catalogSupportsXHigh(compat) {
	const efforts = compat?.supportedReasoningEfforts;
	if (!Array.isArray(efforts)) return false;
	return efforts.some((effort) => normalizeThinkLevel(effort) === "xhigh");
}
function normalizeProfileLevel(level) {
	const normalized = normalizeThinkLevel(level.id);
	if (!normalized) return;
	return {
		id: normalized,
		label: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(level.label) ?? normalized,
		rank: Number.isFinite(level.rank) ? level.rank : THINKING_LEVEL_RANKS[normalized]
	};
}
function normalizeThinkingProfile(profile) {
	const byId = /* @__PURE__ */ new Map();
	for (const raw of profile.levels) {
		const level = normalizeProfileLevel(raw);
		if (level) byId.set(level.id, level);
	}
	const levels = [...byId.values()].toSorted((a, b) => a.rank - b.rank);
	const rawDefaultLevel = profile.defaultLevel ? normalizeThinkLevel(profile.defaultLevel) : void 0;
	return {
		levels,
		defaultLevel: rawDefaultLevel && byId.has(rawDefaultLevel) ? rawDefaultLevel : void 0
	};
}
function buildBaseThinkingProfile(defaultLevel) {
	return {
		levels: BASE_THINKING_LEVELS.map((id) => ({
			id,
			label: id,
			rank: THINKING_LEVEL_RANKS[id]
		})),
		defaultLevel
	};
}
function buildOffOnlyThinkingProfile() {
	return {
		levels: [{
			id: "off",
			label: "off",
			rank: THINKING_LEVEL_RANKS.off
		}],
		defaultLevel: "off"
	};
}
function buildBinaryThinkingProfile(defaultLevel) {
	return {
		levels: [{
			id: "off",
			label: "off",
			rank: THINKING_LEVEL_RANKS.off
		}, {
			id: "low",
			label: "on",
			rank: THINKING_LEVEL_RANKS.low
		}],
		defaultLevel
	};
}
function appendProfileLevel(profile, id) {
	if (profile.levels.some((level) => level.id === id)) return;
	profile.levels.push({
		id,
		label: id,
		rank: THINKING_LEVEL_RANKS[id]
	});
	profile.levels = profile.levels.toSorted((a, b) => a.rank - b.rank);
}
/** Resolve supported thinking levels and default for a provider/model pair. */
function resolveThinkingProfile(params) {
	const context = resolveThinkingPolicyContext(params);
	if (!context.normalizedProvider) return buildBaseThinkingProfile();
	const providerContext = {
		provider: context.normalizedProvider,
		modelId: context.modelId,
		agentRuntime: params.agentRuntime,
		api: context.api,
		reasoning: context.reasoning,
		...context.params ? { params: context.params } : {},
		compat: context.compat
	};
	const providerProfile = resolveProviderThinkingProfile({
		provider: context.normalizedProvider,
		context: providerContext
	});
	const anthropicMessagesProfile = context.api === "anthropic-messages" ? resolveClaudeThinkingProfile(context.modelId, context.params, { includeNativeMax: true }) : void 0;
	const pluginProfile = providerProfile ?? anthropicMessagesProfile;
	if (pluginProfile) {
		const normalized = normalizeThinkingProfile(pluginProfile);
		if (normalized.levels.length > 0 && (context.reasoning !== false || pluginProfile.preserveWhenCatalogReasoningFalse === true)) return normalized;
	}
	if (context.reasoning === false) return buildOffOnlyThinkingProfile();
	const defaultLevel = resolveProviderDefaultThinkingLevel({
		provider: context.normalizedProvider,
		context: providerContext
	});
	const binaryDecision = resolveProviderBinaryThinking({
		provider: context.normalizedProvider,
		context: {
			provider: context.normalizedProvider,
			modelId: context.modelId
		}
	});
	const profile = binaryDecision === true ? buildBinaryThinkingProfile(defaultLevel) : buildBaseThinkingProfile(defaultLevel);
	if (binaryDecision !== true && catalogSupportsXHigh(context.compat)) appendProfileLevel(profile, "xhigh");
	const policyContext = {
		provider: context.normalizedProvider,
		modelId: context.modelKey || context.modelId
	};
	if (binaryDecision !== true && resolveProviderXHighThinking({
		provider: context.normalizedProvider,
		context: policyContext
	}) === true) appendProfileLevel(profile, "xhigh");
	return profile;
}
function supportsThinkingLevel(provider, model, level, catalog, agentRuntime) {
	return resolveThinkingProfile({
		provider,
		model,
		catalog,
		agentRuntime
	}).levels.some((entry) => entry.id === level);
}
/** List thinking level ids supported by provider/model. */
function listThinkingLevels(provider, model, catalog, agentRuntime) {
	return resolveThinkingProfile({
		provider,
		model,
		catalog,
		agentRuntime
	}).levels.map((level) => level.id);
}
/** List labeled thinking level options supported by provider/model. */
function listThinkingLevelOptions(provider, model, catalog, agentRuntime) {
	return resolveThinkingProfile({
		provider,
		model,
		catalog,
		agentRuntime
	}).levels.map(({ id, label }) => ({
		id,
		label
	}));
}
/** List display labels for thinking levels supported by provider/model. */
function listThinkingLevelLabels(provider, model, catalog, agentRuntime) {
	return listThinkingLevelOptions(provider, model, catalog, agentRuntime).map((level) => level.label);
}
/** Format supported thinking level labels for command/status output. */
function formatThinkingLevels(provider, model, separator = ", ", catalog, agentRuntime) {
	return resolveThinkingProfile({
		provider,
		model,
		catalog,
		agentRuntime
	}).levels.map(({ label }) => label).join(separator);
}
/** Resolve the default thinking level for a provider/model pair. */
function resolveThinkingDefaultForModel(params) {
	const profile = resolveThinkingProfile({
		provider: params.provider,
		model: params.model,
		catalog: params.catalog,
		agentRuntime: params.agentRuntime
	});
	if (profile.defaultLevel) return profile.defaultLevel;
	if (resolveThinkingDefaultForModel$1(params) === "off") return "off";
	return resolveSupportedThinkingLevelFromProfile(profile, "medium");
}
/** Return whether a specific thinking level is supported by provider/model. */
function isThinkingLevelSupported(params) {
	return supportsThinkingLevel(params.provider, params.model, params.level, params.catalog, params.agentRuntime);
}
function resolveSupportedThinkingLevelFromProfile(profile, level) {
	if (profile.levels.some((entry) => entry.id === level)) return level;
	const requestedRank = THINKING_LEVEL_RANKS[level];
	const ranked = profile.levels.toSorted((a, b) => b.rank - a.rank);
	return ranked.find((entry) => entry.id !== "off" && entry.rank <= requestedRank)?.id ?? ranked.findLast((entry) => entry.id !== "off")?.id ?? "off";
}
/** Clamp a requested thinking level to the closest supported provider/model level. */
function resolveSupportedThinkingLevel(params) {
	return resolveSupportedThinkingLevelFromProfile(resolveThinkingProfile({
		provider: params.provider,
		model: params.model,
		catalog: params.catalog,
		agentRuntime: params.agentRuntime
	}), params.level);
}
//#endregion
Object.defineProperty(exports, "BASE_THINKING_LEVELS", {
	enumerable: true,
	get: function() {
		return BASE_THINKING_LEVELS;
	}
});
Object.defineProperty(exports, "formatThinkingLevels", {
	enumerable: true,
	get: function() {
		return formatThinkingLevels;
	}
});
Object.defineProperty(exports, "isSessionDefaultDirectiveValue", {
	enumerable: true,
	get: function() {
		return isSessionDefaultDirectiveValue;
	}
});
Object.defineProperty(exports, "isThinkingLevelSupported", {
	enumerable: true,
	get: function() {
		return isThinkingLevelSupported;
	}
});
Object.defineProperty(exports, "listThinkingLevelLabels", {
	enumerable: true,
	get: function() {
		return listThinkingLevelLabels;
	}
});
Object.defineProperty(exports, "listThinkingLevelOptions", {
	enumerable: true,
	get: function() {
		return listThinkingLevelOptions;
	}
});
Object.defineProperty(exports, "listThinkingLevels", {
	enumerable: true,
	get: function() {
		return listThinkingLevels;
	}
});
Object.defineProperty(exports, "normalizeElevatedLevel", {
	enumerable: true,
	get: function() {
		return normalizeElevatedLevel;
	}
});
Object.defineProperty(exports, "normalizeReasoningLevel", {
	enumerable: true,
	get: function() {
		return normalizeReasoningLevel;
	}
});
Object.defineProperty(exports, "normalizeThinkLevel", {
	enumerable: true,
	get: function() {
		return normalizeThinkLevel;
	}
});
Object.defineProperty(exports, "normalizeTraceLevel", {
	enumerable: true,
	get: function() {
		return normalizeTraceLevel;
	}
});
Object.defineProperty(exports, "normalizeUsageDisplay", {
	enumerable: true,
	get: function() {
		return normalizeUsageDisplay;
	}
});
Object.defineProperty(exports, "normalizeVerboseLevel", {
	enumerable: true,
	get: function() {
		return normalizeVerboseLevel;
	}
});
Object.defineProperty(exports, "resolveBundledProviderPolicySurface", {
	enumerable: true,
	get: function() {
		return resolveBundledProviderPolicySurface;
	}
});
Object.defineProperty(exports, "resolveEffectiveResponseUsage", {
	enumerable: true,
	get: function() {
		return resolveEffectiveResponseUsage;
	}
});
Object.defineProperty(exports, "resolveResponseUsageMode", {
	enumerable: true,
	get: function() {
		return resolveResponseUsageMode;
	}
});
Object.defineProperty(exports, "resolveSupportedThinkingLevel", {
	enumerable: true,
	get: function() {
		return resolveSupportedThinkingLevel;
	}
});
Object.defineProperty(exports, "resolveThinkingDefaultForModel", {
	enumerable: true,
	get: function() {
		return resolveThinkingDefaultForModel;
	}
});
