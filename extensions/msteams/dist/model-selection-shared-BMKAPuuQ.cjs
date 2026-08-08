const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_model_input = require("./model-input-DO-er-Kk.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime_state = require("./runtime-state-DbA1_jkE.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_manifest_contract_eligibility = require("./manifest-contract-eligibility-UBDnmddY.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/model-catalog-lookup.ts
/**
* Looks up model catalog entries and input capability support.
*/
/** Returns whether a catalog entry declares support for an input modality. */
function modelSupportsInput(entry, input) {
	return entry?.input?.includes(input) ?? false;
}
/** Finds a provider-qualified model entry in a catalog. */
function findModelInCatalog(catalog, provider, modelId) {
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider);
	const normalizedModelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId);
	return catalog.find((entry) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(entry.provider) === normalizedProvider && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry.id) === normalizedModelId);
}
/** Finds a model entry, requiring uniqueness when provider is omitted. */
function findModelCatalogEntry(catalog, params) {
	const modelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.modelId) ?? "";
	if (!modelId) return;
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.provider);
	if (provider) return findModelInCatalog(catalog, provider, modelId);
	const normalizedModelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId);
	const matches = catalog.filter((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry.id) === normalizedModelId);
	return matches.length === 1 ? matches[0] : void 0;
}
//#endregion
//#region src/agents/configured-provider-fallback.ts
/** Resolve the first configured provider/model that can replace a missing default. */
function resolveConfiguredProviderFallback(params) {
	const configuredProviders = params.cfg.models?.providers;
	if (!configuredProviders || typeof configuredProviders !== "object") return null;
	const defaultProviderConfig = configuredProviders[params.defaultProvider];
	const defaultModel = params.defaultModel?.trim();
	const defaultProviderHasDefaultModel = defaultProviderConfig !== void 0 && defaultModel !== void 0 && Array.isArray(defaultProviderConfig.models) && defaultProviderConfig.models.some((model) => model?.id === defaultModel);
	if (defaultProviderConfig && (!defaultModel || defaultProviderHasDefaultModel)) return null;
	const availableProvider = Object.entries(configuredProviders).find(([, providerCfg]) => providerCfg && Array.isArray(providerCfg.models) && providerCfg.models.length > 0 && providerCfg.models[0]?.id);
	if (!availableProvider) return null;
	const [provider, providerCfg] = availableProvider;
	const models = providerCfg.models;
	if (!Array.isArray(models) || !models[0]?.id) return null;
	return {
		provider,
		model: models[0].id
	};
}
//#endregion
//#region src/agents/model-selection-shared.ts
/**
* Shared model-selection resolution, alias, allowlist, and visibility logic.
*/
let log = null;
function getLog() {
	log ??= require_subsystem.createSubsystemLogger("model-selection");
	return log;
}
const OPENROUTER_COMPAT_FREE_ALIAS = "openrouter:free";
function providerAliasKey(provider, alias) {
	return `${require_model_selection_normalize.normalizeProviderId(provider)}/${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias)}`;
}
function hasSlashFormModelRef(raw) {
	const trimmed = raw.trim();
	const slash = trimmed.indexOf("/");
	return slash > 0 && slash < trimmed.length - 1;
}
function resolveManifestPluginsForModelIdNormalization(params) {
	if (params.allowManifestNormalization === false || params.manifestPlugins !== void 0) return params.manifestPlugins;
	const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	if (!workspaceDir) {
		const currentManifestPlugins = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
			config: params.cfg,
			env: process.env
		})?.plugins;
		if (currentManifestPlugins) return currentManifestPlugins;
		return require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
			config: params.cfg,
			env: process.env
		}).plugins;
	}
	return require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.cfg,
		workspaceDir,
		env: process.env
	}).plugins;
}
function createModelManifestPluginContext(params) {
	let manifestPlugins = params.manifestPlugins;
	let resolved = params.allowManifestNormalization === false || params.manifestPlugins !== void 0;
	return {
		peek: () => manifestPlugins,
		get: () => {
			if (!resolved) {
				manifestPlugins = resolveManifestPluginsForModelIdNormalization(params);
				resolved = true;
			}
			return manifestPlugins;
		}
	};
}
function listModelAliasCandidates(cfg) {
	return Object.entries(cfg.agents?.defaults?.models ?? {}).flatMap(([keyRaw, entryRaw]) => {
		if (parseProviderWildcardModelRef(keyRaw)) return [];
		const alias = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entryRaw?.alias) ?? "";
		return alias ? [{
			keyRaw,
			alias
		}] : [];
	});
}
function findModelAliasCandidate(cfg, raw) {
	const aliasKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	let match;
	for (const candidate of listModelAliasCandidates(cfg)) if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(candidate.alias) === aliasKey) match = candidate;
	return match;
}
function sanitizeModelWarningValue(value) {
	const stripped = value ? require_ansi.stripAnsi(value) : "";
	let controlBoundary = -1;
	for (let index = 0; index < stripped.length; index += 1) {
		const code = stripped.charCodeAt(index);
		if (code <= 31 || code === 127) {
			controlBoundary = index;
			break;
		}
	}
	if (controlBoundary === -1) return require_ansi.sanitizeForLog(stripped);
	return require_ansi.sanitizeForLog(stripped.slice(0, controlBoundary));
}
function mergeModelCatalogEntries(params) {
	const merged = [...params.primary];
	const seen = new Set(merged.map((entry) => require_model_selection_normalize.modelKey(entry.provider, entry.id)));
	for (const entry of params.secondary) {
		const key = require_model_selection_normalize.modelKey(entry.provider, entry.id);
		if (seen.has(key)) continue;
		merged.push(entry);
		seen.add(key);
	}
	return merged;
}
/** Infer a unique provider for a bare model from configured model rows. */
function inferUniqueProviderFromConfiguredModels(params) {
	const model = params.model.trim();
	if (!model) return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(model);
	const providers = /* @__PURE__ */ new Set();
	const addProvider = (provider) => {
		const normalizedProvider = require_model_selection_normalize.normalizeProviderId(provider);
		if (!normalizedProvider) return;
		providers.add(normalizedProvider);
	};
	const configuredModels = params.cfg.agents?.defaults?.models;
	if (configuredModels) for (const key of Object.keys(configuredModels)) {
		const ref = key.trim();
		if (!ref?.includes("/") || ref.endsWith("/*")) continue;
		const parsed = require_model_selection_normalize.parseModelRef(ref, require_defaults.DEFAULT_PROVIDER, {
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: false,
			manifestPlugins: params.manifestPlugins
		});
		if (!parsed) continue;
		if (parsed.model === model || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsed.model) === normalized) {
			addProvider(parsed.provider);
			if (providers.size > 1) return;
		}
	}
	const configuredProviders = params.cfg.models?.providers;
	if (configuredProviders) for (const [providerId, providerConfig] of Object.entries(configuredProviders)) {
		const models = providerConfig?.models;
		if (!Array.isArray(models)) continue;
		for (const entry of models) {
			const modelId = entry?.id?.trim();
			if (!modelId) continue;
			const normalizedModelId = require_model_selection_normalize.normalizeConfiguredProviderCatalogModelId(providerId, modelId, {
				allowManifestNormalization: params.allowManifestNormalization,
				manifestPlugins: params.manifestPlugins
			});
			if (modelId === model || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId) === normalized || normalizedModelId === model || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizedModelId) === normalized) addProvider(providerId);
		}
		if (providers.size > 1) return;
	}
	if (providers.size !== 1) return;
	return providers.values().next().value;
}
/** Infer a unique provider for a bare model from a provider catalog. */
function inferUniqueProviderFromCatalog(params) {
	const model = params.model.trim();
	if (!model) return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(model);
	const providers = /* @__PURE__ */ new Set();
	for (const entry of params.catalog) {
		const entryId = entry.id.trim();
		if (!entryId) continue;
		if (entryId !== model && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entryId) !== normalized) continue;
		const provider = require_model_selection_normalize.normalizeProviderId(entry.provider);
		if (provider) providers.add(provider);
		if (providers.size > 1) return;
	}
	return providers.size === 1 ? providers.values().next().value : void 0;
}
/** Resolve the provider used when a model string omits provider/id syntax. */
function resolveBareModelDefaultProvider(params) {
	return inferUniqueProviderFromConfiguredModels({
		cfg: params.cfg,
		model: params.model,
		manifestPlugins: params.manifestPlugins
	}) ?? inferUniqueProviderFromCatalog({
		catalog: params.catalog,
		model: params.model
	}) ?? params.defaultProvider;
}
function isConcreteOpenRouterFreeModelRef(ref) {
	return ref.provider === "openrouter" && ref.model.includes("/") && ref.model.endsWith(":free");
}
function resolveConfiguredOpenRouterCompatFreeRef(params) {
	const configuredModels = params.cfg.agents?.defaults?.models ?? {};
	for (const raw of Object.keys(configuredModels)) {
		if (!raw.includes("/")) continue;
		const parsed = require_model_selection_normalize.parseModelRef(raw, params.defaultProvider, {
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: params.manifestPlugins
		});
		if (parsed && isConcreteOpenRouterFreeModelRef(parsed)) return parsed;
	}
	const openrouterProviderConfig = require_model_selection_normalize.findNormalizedProviderValue(params.cfg.models?.providers, "openrouter");
	for (const entry of openrouterProviderConfig?.models ?? []) {
		const modelId = entry?.id?.trim();
		if (!modelId?.includes("/") || !modelId.endsWith(":free")) continue;
		return require_model_selection_normalize.normalizeModelRef("openrouter", modelId, {
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: params.manifestPlugins
		});
	}
	return null;
}
/** Resolve OpenRouter compatibility aliases such as openrouter:auto/free. */
function resolveConfiguredOpenRouterCompatAlias(params) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.raw);
	if (normalized === "openrouter:auto") return require_model_selection_normalize.normalizeModelRef("openrouter", "auto", {
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
	if (normalized !== OPENROUTER_COMPAT_FREE_ALIAS || !params.cfg) return null;
	return resolveConfiguredOpenRouterCompatFreeRef({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
}
function parseModelRefWithCompatAlias(params) {
	const exactConfiguredProviderRef = resolveExactConfiguredProviderRef(params);
	const exactDefaultProviderRef = hasSlashFormModelRef(params.raw) ? null : resolveExactConfiguredProviderRef({
		...params,
		raw: `${params.defaultProvider}/${params.raw}`
	});
	return resolveConfiguredOpenRouterCompatAlias(params) ?? exactConfiguredProviderRef ?? exactDefaultProviderRef ?? require_model_selection_normalize.parseModelRef(params.raw, params.defaultProvider, {
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
}
function findExactConfiguredProviderRefParts(params) {
	const slash = params.raw.indexOf("/");
	if (slash <= 0 || !params.cfg?.models?.providers) return null;
	const providerRaw = params.raw.slice(0, slash).trim();
	const modelRaw = params.raw.slice(slash + 1).trim();
	if (!providerRaw || !modelRaw) return null;
	const providerKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(providerRaw);
	const exactConfigured = Object.entries(params.cfg.models.providers).find(([key]) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key) === providerKey);
	if (!exactConfigured) return null;
	const [configuredProvider, providerConfig] = exactConfigured;
	const normalizedConfiguredProvider = require_model_selection_normalize.normalizeProviderId(configuredProvider);
	const apiOwner = typeof providerConfig?.api === "string" ? require_model_selection_normalize.normalizeProviderId(providerConfig.api) : "";
	if (!apiOwner || apiOwner === normalizedConfiguredProvider) return null;
	return {
		configuredProvider,
		modelRaw
	};
}
function normalizeExactConfiguredProviderRef(parts, params) {
	const { configuredProvider, modelRaw } = parts;
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(configuredProvider);
	return {
		provider,
		model: require_model_selection_normalize.normalizeConfiguredProviderCatalogModelId(provider, require_model_selection_normalize.normalizeStaticProviderModelId(provider, modelRaw.trim(), {
			allowManifestNormalization: params.allowManifestNormalization,
			manifestPlugins: params.manifestPlugins
		}), {
			allowManifestNormalization: params.allowManifestNormalization,
			manifestPlugins: params.manifestPlugins
		})
	};
}
function resolveExactConfiguredProviderRef(params) {
	const exactConfigured = findExactConfiguredProviderRefParts({
		cfg: params.cfg,
		raw: params.raw
	});
	if (!exactConfigured) return null;
	return normalizeExactConfiguredProviderRef(exactConfigured, params);
}
/** Normalize a configured allowlist entry into the canonical provider/model key. */
function resolveAllowlistModelKey(params) {
	const parsed = parseModelRefWithCompatAlias({
		cfg: params.cfg,
		raw: params.raw,
		defaultProvider: params.defaultProvider,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
	if (!parsed) return null;
	return require_model_selection_normalize.modelKey(parsed.provider, parsed.model);
}
/** Build the exact configured model keys that constrain model visibility. */
function buildConfiguredAllowlistKeys(params) {
	const visibility = parseConfiguredModelVisibilityEntries({ cfg: params.cfg });
	if (visibility.exactModelRefs.length === 0) return null;
	const keys = /* @__PURE__ */ new Set();
	for (const raw of visibility.exactModelRefs) {
		const key = resolveAllowlistModelKey({
			cfg: params.cfg,
			raw,
			defaultProvider: params.defaultProvider,
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: params.manifestPlugins
		});
		if (key) keys.add(key);
	}
	return keys.size > 0 ? keys : null;
}
function buildModelAliasIndexWithManifestContext(params) {
	const byAlias = /* @__PURE__ */ new Map();
	const byProviderAlias = /* @__PURE__ */ new Map();
	const byKey = /* @__PURE__ */ new Map();
	const aliasCandidates = listModelAliasCandidates(params.cfg);
	if (aliasCandidates.length === 0) return {
		byAlias,
		byProviderAlias,
		byKey
	};
	const manifestPlugins = params.manifestPluginContext.get();
	for (const { keyRaw, alias } of aliasCandidates) {
		const parsed = parseModelRefWithCompatAlias({
			cfg: params.cfg,
			raw: keyRaw,
			defaultProvider: params.defaultProvider,
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins
		});
		if (!parsed) continue;
		const aliasKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias);
		const match = {
			alias,
			ref: parsed
		};
		byAlias.set(aliasKey, match);
		byProviderAlias.set(providerAliasKey(parsed.provider, alias), match);
		const key = require_model_selection_normalize.modelKey(parsed.provider, parsed.model);
		const existing = byKey.get(key) ?? [];
		existing.push(alias);
		byKey.set(key, existing);
	}
	return {
		byAlias,
		byProviderAlias,
		byKey
	};
}
/** Build lookup maps from user-facing aliases to normalized model refs. */
function buildModelAliasIndex(params) {
	return buildModelAliasIndexWithManifestContext({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPluginContext: createModelManifestPluginContext(params)
	});
}
function buildModelCatalogMetadata(params) {
	const configuredByKey = /* @__PURE__ */ new Map();
	for (const entry of buildConfiguredModelCatalog({
		cfg: params.cfg,
		manifestPlugins: params.manifestPlugins
	})) configuredByKey.set(require_model_selection_normalize.modelKey(entry.provider, entry.id), entry);
	const aliasByKey = /* @__PURE__ */ new Map();
	const configuredModels = params.cfg.agents?.defaults?.models ?? {};
	for (const [rawKey, entryRaw] of Object.entries(configuredModels)) {
		if (parseProviderWildcardModelRef(rawKey)) continue;
		const key = resolveAllowlistModelKey({
			cfg: params.cfg,
			raw: rawKey,
			defaultProvider: params.defaultProvider,
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: params.manifestPlugins
		});
		if (!key) continue;
		const alias = (entryRaw?.alias ?? "").trim();
		if (alias) aliasByKey.set(key, alias);
	}
	return {
		configuredByKey,
		aliasByKey
	};
}
function applyModelCatalogMetadata(params) {
	const key = require_model_selection_normalize.modelKey(params.entry.provider, params.entry.id);
	const configuredEntry = params.metadata.configuredByKey.get(key);
	const alias = params.metadata.aliasByKey.get(key);
	if (!configuredEntry && !alias) return params.entry;
	const nextAlias = alias ?? params.entry.alias;
	const nextContextWindow = configuredEntry?.contextWindow ?? params.entry.contextWindow;
	const nextContextTokens = configuredEntry?.contextTokens ?? params.entry.contextTokens;
	const nextReasoning = configuredEntry?.reasoning ?? params.entry.reasoning;
	const nextInput = configuredEntry?.input ?? params.entry.input;
	const nextParams = params.entry.params || configuredEntry?.params ? {
		...params.entry.params,
		...configuredEntry?.params
	} : void 0;
	const nextCompat = params.entry.compat || configuredEntry?.compat ? {
		...params.entry.compat,
		...configuredEntry?.compat
	} : void 0;
	return {
		...params.entry,
		name: configuredEntry?.name ?? params.entry.name,
		...nextAlias ? { alias: nextAlias } : {},
		...nextContextWindow !== void 0 ? { contextWindow: nextContextWindow } : {},
		...nextContextTokens !== void 0 ? { contextTokens: nextContextTokens } : {},
		...nextReasoning !== void 0 ? { reasoning: nextReasoning } : {},
		...nextInput ? { input: nextInput } : {},
		...nextParams ? { params: nextParams } : {},
		...nextCompat ? { compat: nextCompat } : {}
	};
}
function buildSyntheticAllowedCatalogEntry(params) {
	const key = require_model_selection_normalize.modelKey(params.parsed.provider, params.parsed.model);
	const configuredEntry = params.metadata.configuredByKey.get(key);
	const alias = params.metadata.aliasByKey.get(key);
	const nextContextWindow = configuredEntry?.contextWindow;
	const nextContextTokens = configuredEntry?.contextTokens;
	const nextReasoning = configuredEntry?.reasoning;
	const nextInput = configuredEntry?.input;
	const nextParams = configuredEntry?.params;
	const nextCompat = configuredEntry?.compat;
	return {
		id: params.parsed.model,
		name: configuredEntry?.name ?? params.parsed.model,
		provider: params.parsed.provider,
		...alias ? { alias } : {},
		...nextContextWindow !== void 0 ? { contextWindow: nextContextWindow } : {},
		...nextContextTokens !== void 0 ? { contextTokens: nextContextTokens } : {},
		...nextReasoning !== void 0 ? { reasoning: nextReasoning } : {},
		...nextInput ? { input: nextInput } : {},
		...nextParams ? { params: nextParams } : {},
		...nextCompat ? { compat: nextCompat } : {}
	};
}
function resolveModelRefFromString(params) {
	const { model } = require_model_ref_profile.splitTrailingAuthProfile(params.raw);
	if (!model) return null;
	const aliasKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(model);
	const aliasMatch = params.aliasIndex?.byAlias.get(aliasKey);
	if (aliasMatch) return {
		ref: aliasMatch.ref,
		alias: aliasMatch.alias
	};
	const slash = model.indexOf("/");
	if (slash > 0) {
		const providerAliasMatch = params.aliasIndex?.byProviderAlias?.get(providerAliasKey(model.slice(0, slash), model.slice(slash + 1)));
		if (providerAliasMatch) return {
			ref: providerAliasMatch.ref,
			alias: providerAliasMatch.alias
		};
	}
	const parsed = parseModelRefWithCompatAlias({
		cfg: params.cfg,
		raw: model,
		defaultProvider: params.defaultProvider,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
	if (!parsed) return null;
	return { ref: parsed };
}
/** Resolve the default configured model ref, including aliases and fallback provider rows. */
function resolveConfiguredModelRef(params) {
	const rawModel = require_model_input.resolveAgentModelPrimaryValue(params.cfg.agents?.defaults?.model) ?? "";
	if (rawModel) {
		const trimmed = rawModel.trim();
		const { model: modelWithoutProfile } = require_model_ref_profile.splitTrailingAuthProfile(trimmed);
		const manifestPluginContext = createModelManifestPluginContext(params);
		const profileStripped = Boolean(modelWithoutProfile && modelWithoutProfile !== trimmed);
		const exactAliasCandidate = findModelAliasCandidate(params.cfg, trimmed);
		const strippedAliasCandidate = profileStripped ? findModelAliasCandidate(params.cfg, modelWithoutProfile) : void 0;
		const profileAliasCandidate = profileStripped ? exactAliasCandidate ?? strippedAliasCandidate : void 0;
		if (profileAliasCandidate) {
			const aliasRef = parseModelRefWithCompatAlias({
				cfg: params.cfg,
				raw: profileAliasCandidate.keyRaw,
				defaultProvider: params.defaultProvider,
				allowManifestNormalization: params.allowManifestNormalization,
				allowPluginNormalization: params.allowPluginNormalization,
				manifestPlugins: manifestPluginContext.get()
			});
			if (aliasRef) return aliasRef;
		}
		const primaryWithoutProfile = modelWithoutProfile || trimmed;
		const exactConfiguredPrimary = findExactConfiguredProviderRefParts({
			cfg: params.cfg,
			raw: primaryWithoutProfile
		});
		if (exactConfiguredPrimary) return normalizeExactConfiguredProviderRef(exactConfiguredPrimary, {
			allowManifestNormalization: params.allowManifestNormalization,
			manifestPlugins: manifestPluginContext.get()
		});
		const aliasCandidate = profileStripped ? void 0 : exactAliasCandidate;
		const manifestPlugins = manifestPluginContext.peek();
		if (aliasCandidate && hasSlashFormModelRef(primaryWithoutProfile) && !hasSlashFormModelRef(aliasCandidate.keyRaw)) {
			const primaryRef = parseModelRefWithCompatAlias({
				cfg: params.cfg,
				raw: primaryWithoutProfile,
				defaultProvider: params.defaultProvider,
				allowManifestNormalization: params.allowManifestNormalization,
				allowPluginNormalization: params.allowPluginNormalization,
				manifestPlugins: manifestPluginContext.get()
			});
			if (primaryRef) return primaryRef;
		}
		if (aliasCandidate) {
			const aliasRef = parseModelRefWithCompatAlias({
				cfg: params.cfg,
				raw: aliasCandidate.keyRaw,
				defaultProvider: params.defaultProvider,
				allowManifestNormalization: params.allowManifestNormalization,
				allowPluginNormalization: params.allowPluginNormalization,
				manifestPlugins: manifestPluginContext.get()
			});
			if (aliasRef) return aliasRef;
		}
		if (!trimmed.includes("/")) {
			const normalizedTrimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
			const needsOpenRouterCompatManifestPlugins = normalizedTrimmed === "openrouter:auto" || normalizedTrimmed === OPENROUTER_COMPAT_FREE_ALIAS;
			const openrouterCompatRef = resolveConfiguredOpenRouterCompatAlias({
				cfg: params.cfg,
				raw: trimmed,
				defaultProvider: params.defaultProvider,
				allowManifestNormalization: params.allowManifestNormalization,
				allowPluginNormalization: params.allowPluginNormalization,
				manifestPlugins: needsOpenRouterCompatManifestPlugins ? manifestPluginContext.get() : manifestPlugins
			});
			if (openrouterCompatRef) return openrouterCompatRef;
			let inferredProvider = inferUniqueProviderFromConfiguredModels({
				cfg: params.cfg,
				model: trimmed,
				allowManifestNormalization: false,
				manifestPlugins
			});
			let inferredProviderManifestPlugins = manifestPlugins;
			if ((!inferredProvider || inferredProvider !== "openai") && hasConfiguredRowsNeedingManifestLookup(params.cfg, params.defaultProvider)) {
				inferredProviderManifestPlugins = manifestPluginContext.get();
				inferredProvider = inferUniqueProviderFromConfiguredModels({
					cfg: params.cfg,
					model: trimmed,
					allowManifestNormalization: params.allowManifestNormalization,
					manifestPlugins: inferredProviderManifestPlugins
				}) ?? inferredProvider;
			}
			if (inferredProvider) return require_model_selection_normalize.normalizeModelRef(inferredProvider, trimmed, {
				allowManifestNormalization: inferredProviderManifestPlugins ? params.allowManifestNormalization : false,
				allowPluginNormalization: params.allowPluginNormalization,
				manifestPlugins: inferredProviderManifestPlugins
			});
			const safeTrimmed = sanitizeModelWarningValue(trimmed);
			const safeResolved = require_ansi.sanitizeForLog(`${params.defaultProvider}/${safeTrimmed}`);
			getLog().warn(`Model "${safeTrimmed}" specified without provider. Falling back to "${safeResolved}". Please use "${safeResolved}" in your config.`);
			return {
				provider: params.defaultProvider,
				model: trimmed
			};
		}
		const resolved = resolveModelRefFromString({
			cfg: params.cfg,
			raw: trimmed,
			defaultProvider: params.defaultProvider,
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: manifestPluginContext.get()
		});
		if (resolved) return resolved.ref;
		const safe = require_ansi.sanitizeForLog(trimmed);
		const safeFallback = require_ansi.sanitizeForLog(`${params.defaultProvider}/${params.defaultModel}`);
		getLog().warn(`Model "${safe}" could not be resolved. Falling back to default "${safeFallback}".`);
	}
	const fallbackProvider = resolveConfiguredProviderFallback({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider
	});
	if (fallbackProvider) return fallbackProvider;
	return {
		provider: params.defaultProvider,
		model: params.defaultModel
	};
}
/** Build allowed model keys/catalog entries after provider wildcards and fallbacks. */
function buildAllowedModelSetWithFallbacks(params) {
	const metadata = buildModelCatalogMetadata({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
	const configuredCatalog = buildConfiguredModelCatalog({
		cfg: params.cfg,
		manifestPlugins: params.manifestPlugins
	});
	const catalog = mergeModelCatalogEntries({
		primary: params.catalog,
		secondary: configuredCatalog
	}).map((entry) => applyModelCatalogMetadata({
		entry,
		metadata
	}));
	const visibility = parseConfiguredModelVisibilityEntries({ cfg: params.cfg });
	const allowAny = !visibility.hasEntries;
	const defaultModelNormalization = allowAny ? {
		allowManifestNormalization: false,
		allowPluginNormalization: false,
		manifestPlugins: params.manifestPlugins
	} : {
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	};
	const defaultModel = params.defaultModel?.trim();
	const defaultRef = defaultModel && params.defaultProvider ? parseModelRefWithCompatAlias({
		cfg: params.cfg,
		raw: defaultModel,
		defaultProvider: params.defaultProvider,
		...defaultModelNormalization
	}) : null;
	const defaultKey = defaultRef ? require_model_selection_normalize.modelKey(defaultRef.provider, defaultRef.model) : void 0;
	const catalogKeys = /* @__PURE__ */ new Set();
	for (const entry of catalog) catalogKeys.add(require_model_selection_normalize.modelKey(entry.provider, entry.id));
	if (allowAny) {
		if (defaultKey) catalogKeys.add(defaultKey);
		return {
			allowAny: true,
			allowedCatalog: catalog,
			allowedKeys: catalogKeys,
			configuredCatalog
		};
	}
	const allowedKeys = /* @__PURE__ */ new Set();
	const allowedRefs = [];
	const syntheticCatalogEntries = /* @__PURE__ */ new Map();
	for (const provider of visibility.providerWildcards) allowedKeys.add(providerWildcardModelKey(provider));
	const addAllowedCatalogRef = (ref) => {
		if (!allowedRefs.some((existing) => require_model_selection_normalize.modelKey(existing.provider, existing.model) === require_model_selection_normalize.modelKey(ref.provider, ref.model))) allowedRefs.push(ref);
	};
	for (const entry of catalog) {
		if (!visibility.providerWildcards.has(require_model_selection_normalize.normalizeProviderId(entry.provider))) continue;
		allowedKeys.add(require_model_selection_normalize.modelKey(entry.provider, entry.id));
		addAllowedCatalogRef({
			provider: entry.provider,
			model: entry.id
		});
	}
	const addAllowedModelRef = (raw) => {
		const trimmed = raw.trim();
		const defaultProvider = !trimmed.includes("/") ? resolveBareModelDefaultProvider({
			cfg: params.cfg,
			catalog,
			model: trimmed,
			defaultProvider: params.defaultProvider,
			manifestPlugins: params.manifestPlugins
		}) : params.defaultProvider;
		const parsed = parseModelRefWithCompatAlias({
			cfg: params.cfg,
			raw,
			defaultProvider,
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: params.manifestPlugins
		});
		if (!parsed) return;
		const key = require_model_selection_normalize.modelKey(parsed.provider, parsed.model);
		allowedKeys.add(key);
		addAllowedCatalogRef(parsed);
		if (!findModelCatalogEntry(catalog, {
			provider: parsed.provider,
			modelId: parsed.model
		}) && !syntheticCatalogEntries.has(key)) syntheticCatalogEntries.set(key, buildSyntheticAllowedCatalogEntry({
			parsed,
			metadata
		}));
	};
	for (const raw of visibility.exactModelRefs) addAllowedModelRef(raw);
	if (visibility.exactModelRefs.length > 0) for (const fallback of params.fallbackModels) addAllowedModelRef(fallback);
	if (defaultKey && (visibility.exactModelRefs.length > 0 && visibility.providerWildcards.size === 0 || defaultRef && visibility.providerWildcards.has(require_model_selection_normalize.normalizeProviderId(defaultRef.provider)))) {
		allowedKeys.add(defaultKey);
		if (defaultRef) addAllowedCatalogRef(defaultRef);
	}
	const allowedCatalog = [...catalog.filter((entry) => allowedRefs.some((ref) => findModelCatalogEntry([entry], {
		provider: ref.provider,
		modelId: ref.model
	}) === entry)), ...syntheticCatalogEntries.values()];
	if (allowedCatalog.length === 0 && allowedKeys.size === 0 && visibility.providerWildcards.size === 0) {
		if (defaultKey) catalogKeys.add(defaultKey);
		return {
			allowAny: true,
			allowedCatalog: catalog,
			allowedKeys: catalogKeys,
			configuredCatalog
		};
	}
	return {
		allowAny: false,
		allowedCatalog,
		allowedKeys,
		configuredCatalog
	};
}
function getModelRefStatusFromAllowedSet(params) {
	const key = require_model_selection_normalize.modelKey(params.ref.provider, params.ref.model);
	return {
		key,
		inCatalog: Boolean(findModelCatalogEntry(params.catalog, {
			provider: params.ref.provider,
			modelId: params.ref.model
		})),
		allowAny: params.allowed.allowAny,
		allowed: params.allowed.allowAny || isModelKeyAllowedBySet(params.allowed.allowedKeys, key)
	};
}
function getModelRefStatusWithFallbackModels(params) {
	const allowed = buildAllowedModelSetWithFallbacks({
		cfg: params.cfg,
		catalog: params.catalog,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		fallbackModels: params.fallbackModels,
		manifestPlugins: params.manifestPlugins
	});
	return getModelRefStatusFromAllowedSet({
		catalog: params.catalog,
		ref: params.ref,
		allowed
	});
}
/** Resolve a requested model string only if it is allowed by the supplied status check. */
function resolveAllowedModelRefFromAliasIndex(params) {
	const trimmed = params.raw.trim();
	if (!trimmed) return { error: "invalid model: empty" };
	const effectiveDefaultProvider = !trimmed.includes("/") ? inferUniqueProviderFromConfiguredModels({
		cfg: params.cfg,
		model: trimmed,
		manifestPlugins: params.manifestPlugins
	}) ?? params.defaultProvider : params.defaultProvider;
	const resolved = resolveModelRefFromString({
		cfg: params.cfg,
		raw: trimmed,
		defaultProvider: effectiveDefaultProvider,
		aliasIndex: params.aliasIndex,
		manifestPlugins: params.manifestPlugins
	});
	if (!resolved) return { error: `invalid model: ${trimmed}` };
	const status = params.getStatus(resolved.ref);
	if (!status.allowed) return { error: `model not allowed: ${status.key}` };
	return {
		ref: resolved.ref,
		key: status.key
	};
}
/** True when config contains provider model rows that should seed catalogs. */
function hasConfiguredProviderModelRows(cfg) {
	const providers = cfg.models?.providers;
	if (!providers || typeof providers !== "object") return false;
	return Object.values(providers).some((provider) => Array.isArray(provider?.models));
}
function hasConfiguredProviderRowsNeedingManifestLookup(cfg) {
	const providers = cfg.models?.providers;
	if (!providers || typeof providers !== "object") return false;
	return Object.entries(providers).some(([providerRaw, provider]) => Array.isArray(provider?.models) && require_model_selection_normalize.normalizeProviderId(providerRaw) !== "openai");
}
function hasConfiguredModelRefsNeedingManifestLookup(cfg, defaultProvider) {
	const configuredModels = cfg.agents?.defaults?.models;
	if (!configuredModels || typeof configuredModels !== "object") return false;
	const normalizedDefaultProvider = require_model_selection_normalize.normalizeProviderId(defaultProvider);
	return Object.keys(configuredModels).some((keyRaw) => {
		const key = keyRaw.trim();
		if (!key || key.endsWith("/*")) return false;
		const slashIndex = key.indexOf("/");
		if (slashIndex <= 0) return false;
		const provider = require_model_selection_normalize.normalizeProviderId(key.slice(0, slashIndex));
		return Boolean(provider && provider !== normalizedDefaultProvider);
	});
}
function hasConfiguredRowsNeedingManifestLookup(cfg, defaultProvider) {
	return hasConfiguredProviderRowsNeedingManifestLookup(cfg) || hasConfiguredModelRefsNeedingManifestLookup(cfg, defaultProvider);
}
function resolveConfiguredModelManifestPlugins(params) {
	if (params.manifestPlugins) return params.manifestPlugins;
	if (!hasConfiguredProviderModelRows(params.cfg)) return;
	const workspaceDir = params.workspaceDir ?? require_runtime_state.getActivePluginRegistryWorkspaceDirFromState();
	if (!workspaceDir) return require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.cfg,
		env: process.env
	})?.plugins ?? [];
	return require_manifest_contract_eligibility.loadManifestMetadataSnapshot({
		config: params.cfg,
		workspaceDir,
		env: process.env
	}).plugins;
}
/** Build catalog entries from configured provider model rows. */
function buildConfiguredModelCatalog(params) {
	const providers = params.cfg.models?.providers;
	if (!providers || typeof providers !== "object") return [];
	const manifestPlugins = resolveConfiguredModelManifestPlugins(params);
	const catalog = [];
	for (const [providerRaw, provider] of Object.entries(providers)) {
		const providerId = require_model_selection_normalize.normalizeProviderId(providerRaw);
		if (!providerId || !Array.isArray(provider?.models)) continue;
		for (const model of provider.models) {
			const rawId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(model?.id) ?? "";
			const id = rawId ? require_model_selection_normalize.normalizeConfiguredProviderCatalogModelId(providerId, rawId, { manifestPlugins }) : "";
			if (!id) continue;
			const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(model?.name) || id;
			const contextWindow = typeof model?.contextWindow === "number" && model.contextWindow > 0 ? model.contextWindow : void 0;
			const contextTokens = typeof model?.contextTokens === "number" && model.contextTokens > 0 ? model.contextTokens : void 0;
			const input = Array.isArray(model?.input) ? model.input : void 0;
			const modelParams = model?.params && typeof model.params === "object" ? model.params : void 0;
			const compat = model?.compat && typeof model.compat === "object" ? model.compat : void 0;
			const reasoning = typeof model?.reasoning === "boolean" ? model.reasoning : isVllmQwenThinkingCompat(providerId, compat) ? true : void 0;
			catalog.push({
				provider: providerId,
				id,
				name,
				api: model.api ?? provider.api,
				...model.baseUrl ?? provider.baseUrl ? { baseUrl: model.baseUrl ?? provider.baseUrl } : {},
				contextWindow,
				contextTokens,
				reasoning,
				input,
				...modelParams ? { params: modelParams } : {},
				compat
			});
		}
	}
	return catalog;
}
function isVllmQwenThinkingCompat(providerId, compat) {
	return providerId === "vllm" && (compat?.thinkingFormat === "qwen" || compat?.thinkingFormat === "qwen-chat-template");
}
function resolveHooksGmailModel(params) {
	const hooksModel = params.cfg.hooks?.gmail?.model;
	if (!hooksModel?.trim()) return null;
	const aliasIndex = buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		manifestPlugins: params.manifestPlugins
	});
	return resolveModelRefFromString({
		cfg: params.cfg,
		raw: hooksModel,
		defaultProvider: params.defaultProvider,
		aliasIndex,
		manifestPlugins: params.manifestPlugins
	})?.ref ?? null;
}
function normalizeModelSelection(value) {
	if (typeof value === "string") return value.trim() || void 0;
	if (!value || typeof value !== "object") return;
	const primary = value.primary;
	if (typeof primary === "string" && primary.trim()) return primary.trim();
}
function parseProviderWildcardModelRef(raw) {
	const trimmed = raw.trim();
	if (!trimmed.endsWith("/*")) return null;
	return require_model_selection_normalize.normalizeProviderId(trimmed.slice(0, -2)) || null;
}
function parseConfiguredModelVisibilityEntries(params) {
	const rawModels = Object.keys(params.cfg?.agents?.defaults?.models ?? {});
	const exactModelRefs = [];
	const providerWildcards = /* @__PURE__ */ new Set();
	for (const raw of rawModels) {
		const trimmed = raw.trim();
		if (!trimmed) continue;
		const wildcardProvider = parseProviderWildcardModelRef(trimmed);
		if (wildcardProvider) {
			providerWildcards.add(wildcardProvider);
			continue;
		}
		exactModelRefs.push(raw);
	}
	return {
		exactModelRefs,
		providerWildcards,
		hasEntries: rawModels.length > 0
	};
}
function providerWildcardModelKey(provider) {
	return require_model_selection_normalize.modelKey(require_model_selection_normalize.normalizeProviderId(provider), "*");
}
function isModelKeyAllowedBySet(allowedKeys, key) {
	if (allowedKeys.has(key)) return true;
	const separator = key.indexOf("/");
	if (separator <= 0) return false;
	return allowedKeys.has(providerWildcardModelKey(key.slice(0, separator)));
}
function resolveAllowedModelSelection(params) {
	const normalizeSelectionRef = (provider, model) => resolveExactConfiguredProviderRef({
		cfg: params.cfg,
		raw: `${provider}/${model}`,
		allowManifestNormalization: params.allowManifestNormalization,
		manifestPlugins: params.manifestPlugins
	}) ?? require_model_selection_normalize.normalizeModelRef(provider, model, {
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
	const current = normalizeSelectionRef(params.provider, params.model);
	if (params.allowAny || isModelKeyAllowedBySet(params.allowedKeys, require_model_selection_normalize.modelKey(current.provider, current.model))) return current;
	const fallback = params.allowedCatalog[0];
	if (!fallback) return null;
	return normalizeSelectionRef(fallback.provider, fallback.id);
}
/** Canonical logical identity shared by visibility and physical route rows. */
function modelCatalogLogicalKey(entry) {
	const provider = require_model_selection_normalize.normalizeProviderId(entry.provider);
	const model = require_model_ref_profile.splitTrailingAuthProfile(entry.id).model;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(require_model_selection_normalize.modelKey(provider, model));
}
function dedupeModelCatalogEntries(entries) {
	const seen = /* @__PURE__ */ new Set();
	const next = [];
	for (const entry of entries) {
		const key = require_model_selection_normalize.modelKey(entry.provider, entry.id);
		if (seen.has(key)) continue;
		seen.add(key);
		next.push(entry);
	}
	return next;
}
function createModelVisibilityPolicyWithFallbacks(params) {
	const visibility = parseConfiguredModelVisibilityEntries({ cfg: params.cfg });
	const allowed = buildAllowedModelSetWithFallbacks(params);
	const aliasIndex = buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		allowManifestNormalization: params.allowManifestNormalization,
		allowPluginNormalization: params.allowPluginNormalization,
		manifestPlugins: params.manifestPlugins
	});
	const configuredKeys = new Set(allowed.configuredCatalog.map(modelCatalogLogicalKey));
	const retainedKeys = /* @__PURE__ */ new Set();
	const addConfiguredRef = (raw, retained) => {
		if (!raw?.trim() || parseProviderWildcardModelRef(raw)) return;
		const resolved = resolveModelRefFromString({
			cfg: params.cfg,
			raw,
			defaultProvider: params.defaultProvider,
			aliasIndex,
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: params.manifestPlugins
		});
		if (!resolved) return;
		const key = modelCatalogLogicalKey({
			provider: resolved.ref.provider,
			id: resolved.ref.model
		});
		configuredKeys.add(key);
		if (retained) retainedKeys.add(key);
	};
	for (const raw of [...visibility.exactModelRefs, ...params.additionalConfiguredModelRefs ?? []]) addConfiguredRef(raw, false);
	addConfiguredRef(params.defaultModel, true);
	for (const fallback of params.fallbackModels) addConfiguredRef(fallback, true);
	const allowsKey = (key) => allowed.allowAny || isModelKeyAllowedBySet(allowed.allowedKeys, key);
	const exactConfiguredKeys = /* @__PURE__ */ new Set();
	for (const raw of visibility.exactModelRefs) {
		const key = resolveAllowlistModelKey({
			cfg: params.cfg,
			raw,
			defaultProvider: params.defaultProvider,
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: params.manifestPlugins
		});
		if (key) exactConfiguredKeys.add(key);
	}
	return {
		allowAny: allowed.allowAny,
		allowedCatalog: allowed.allowedCatalog,
		allowedKeys: allowed.allowedKeys,
		configuredKeys,
		retainedKeys,
		exactModelRefs: visibility.exactModelRefs,
		providerWildcards: visibility.providerWildcards,
		hasConfiguredEntries: visibility.hasEntries,
		hasProviderWildcards: visibility.providerWildcards.size > 0,
		allowsKey,
		allows: (ref) => allowsKey(require_model_selection_normalize.modelKey(ref.provider, ref.model)),
		resolveSelection: (ref) => resolveAllowedModelSelection({
			provider: ref.provider,
			model: ref.model,
			cfg: params.cfg,
			allowAny: allowed.allowAny,
			allowedKeys: allowed.allowedKeys,
			allowedCatalog: allowed.allowedCatalog,
			allowManifestNormalization: params.allowManifestNormalization,
			allowPluginNormalization: params.allowPluginNormalization,
			manifestPlugins: params.manifestPlugins
		}),
		visibleCatalog: ({ catalog, defaultVisibleCatalog, view }) => {
			if (view === "all") return [...catalog];
			if (allowed.allowAny) return [...defaultVisibleCatalog];
			if (visibility.providerWildcards.size === 0) return [...allowed.allowedCatalog];
			return dedupeModelCatalogEntries([...defaultVisibleCatalog.filter((entry) => visibility.providerWildcards.has(require_model_selection_normalize.normalizeProviderId(entry.provider))), ...allowed.allowedCatalog.filter((entry) => !visibility.providerWildcards.has(require_model_selection_normalize.normalizeProviderId(entry.provider)) || exactConfiguredKeys.has(require_model_selection_normalize.modelKey(entry.provider, entry.id)))]);
		}
	};
}
//#endregion
Object.defineProperty(exports, "buildAllowedModelSetWithFallbacks", {
	enumerable: true,
	get: function() {
		return buildAllowedModelSetWithFallbacks;
	}
});
Object.defineProperty(exports, "buildConfiguredAllowlistKeys", {
	enumerable: true,
	get: function() {
		return buildConfiguredAllowlistKeys;
	}
});
Object.defineProperty(exports, "buildConfiguredModelCatalog", {
	enumerable: true,
	get: function() {
		return buildConfiguredModelCatalog;
	}
});
Object.defineProperty(exports, "buildModelAliasIndex", {
	enumerable: true,
	get: function() {
		return buildModelAliasIndex;
	}
});
Object.defineProperty(exports, "createModelVisibilityPolicyWithFallbacks", {
	enumerable: true,
	get: function() {
		return createModelVisibilityPolicyWithFallbacks;
	}
});
Object.defineProperty(exports, "dedupeModelCatalogEntries", {
	enumerable: true,
	get: function() {
		return dedupeModelCatalogEntries;
	}
});
Object.defineProperty(exports, "findModelCatalogEntry", {
	enumerable: true,
	get: function() {
		return findModelCatalogEntry;
	}
});
Object.defineProperty(exports, "findModelInCatalog", {
	enumerable: true,
	get: function() {
		return findModelInCatalog;
	}
});
Object.defineProperty(exports, "getModelRefStatusWithFallbackModels", {
	enumerable: true,
	get: function() {
		return getModelRefStatusWithFallbackModels;
	}
});
Object.defineProperty(exports, "hasConfiguredProviderModelRows", {
	enumerable: true,
	get: function() {
		return hasConfiguredProviderModelRows;
	}
});
Object.defineProperty(exports, "inferUniqueProviderFromCatalog", {
	enumerable: true,
	get: function() {
		return inferUniqueProviderFromCatalog;
	}
});
Object.defineProperty(exports, "inferUniqueProviderFromConfiguredModels", {
	enumerable: true,
	get: function() {
		return inferUniqueProviderFromConfiguredModels;
	}
});
Object.defineProperty(exports, "isModelKeyAllowedBySet", {
	enumerable: true,
	get: function() {
		return isModelKeyAllowedBySet;
	}
});
Object.defineProperty(exports, "modelCatalogLogicalKey", {
	enumerable: true,
	get: function() {
		return modelCatalogLogicalKey;
	}
});
Object.defineProperty(exports, "modelSupportsInput", {
	enumerable: true,
	get: function() {
		return modelSupportsInput;
	}
});
Object.defineProperty(exports, "normalizeModelSelection", {
	enumerable: true,
	get: function() {
		return normalizeModelSelection;
	}
});
Object.defineProperty(exports, "parseConfiguredModelVisibilityEntries", {
	enumerable: true,
	get: function() {
		return parseConfiguredModelVisibilityEntries;
	}
});
Object.defineProperty(exports, "resolveAllowedModelRefFromAliasIndex", {
	enumerable: true,
	get: function() {
		return resolveAllowedModelRefFromAliasIndex;
	}
});
Object.defineProperty(exports, "resolveAllowlistModelKey", {
	enumerable: true,
	get: function() {
		return resolveAllowlistModelKey;
	}
});
Object.defineProperty(exports, "resolveBareModelDefaultProvider", {
	enumerable: true,
	get: function() {
		return resolveBareModelDefaultProvider;
	}
});
Object.defineProperty(exports, "resolveConfiguredModelRef", {
	enumerable: true,
	get: function() {
		return resolveConfiguredModelRef;
	}
});
Object.defineProperty(exports, "resolveConfiguredOpenRouterCompatAlias", {
	enumerable: true,
	get: function() {
		return resolveConfiguredOpenRouterCompatAlias;
	}
});
Object.defineProperty(exports, "resolveConfiguredProviderFallback", {
	enumerable: true,
	get: function() {
		return resolveConfiguredProviderFallback;
	}
});
Object.defineProperty(exports, "resolveHooksGmailModel", {
	enumerable: true,
	get: function() {
		return resolveHooksGmailModel;
	}
});
Object.defineProperty(exports, "resolveModelRefFromString", {
	enumerable: true,
	get: function() {
		return resolveModelRefFromString;
	}
});
