const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_model_thinking_default = require("./model-thinking-default-3L3oHDLO.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_model_selection = require("./model-selection-BvFurMxy.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_model_overrides = require("./model-overrides-BvSxD3wH.cjs");
const require_model_visibility_policy = require("./model-visibility-policy-BAqBH6Uw.cjs");
const require_context = require("./context-Ddgh80NW.cjs");
const require_stored_model_override = require("./stored-model-override-YObKgg3L.cjs");
const require_session_override = require("./session-override-DHiJK0G6.cjs");
const require_session_snapshot_merge = require("./session-snapshot-merge-BloJoO_g.cjs");
const require_model_selection_directive = require("./model-selection-directive-C1YcJtB9.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/directive-handling.auth-profile.ts
/** Resolves a user-selected auth profile override for the requested provider. */
function resolveProfileOverride(params) {
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.rawProfile);
	if (!raw) return {};
	const persistedProfile = require_store.findPersistedAuthProfileCredential({
		agentDir: params.agentDir,
		profileId: raw
	});
	if (persistedProfile) {
		if (persistedProfile.provider !== params.provider) return { error: `Auth profile "${raw}" is for ${persistedProfile.provider}, not ${params.provider}.` };
		return { profileId: raw };
	}
	const profile = require_store.ensureAuthProfileStore(params.agentDir, { allowKeychainPrompt: false }).profiles[raw];
	if (!profile) return { error: `Auth profile "${raw}" not found.` };
	if (profile.provider !== params.provider) return { error: `Auth profile "${raw}" is for ${profile.provider}, not ${params.provider}.` };
	return { profileId: raw };
}
//#endregion
//#region src/auto-reply/reply/model-selection.ts
/** Model selection state for reply runs, including catalog and override handling. */
function resolveConfiguredModelThinkingDefault(raw) {
	if (raw === false || raw === "disabled" || raw === "none") return "off";
	return typeof raw === "string" ? require_thinking.normalizeThinkLevel(raw) : void 0;
}
/** Creates minimal model-selection state for fast test mode. */
function createFastTestModelSelectionState(params) {
	return {
		provider: params.provider,
		model: params.model,
		allowedModelKeys: /* @__PURE__ */ new Set(),
		allowedModelCatalog: [],
		resetModelOverride: false,
		resetModelOverrideRef: void 0,
		resetModelOverrideReason: void 0,
		resolveThinkingCatalog: async () => [],
		resolveDefaultThinkingLevel: async () => params.agentCfg?.thinkingDefault,
		hasConfiguredThinkingDefault: params.agentCfg?.thinkingDefault !== void 0,
		resolveDefaultReasoningLevel: async () => "off",
		needsModelCatalog: false,
		modelContextWindow: void 0,
		modelContextTokens: void 0
	};
}
function shouldLogModelSelectionTiming() {
	return process.env.OPERATOR_DEBUG_INGRESS_TIMING === "1";
}
const modelCatalogRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./model-catalog.runtime-C5e-Vx4_.cjs")));
const sessionPersistenceRuntimeLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./session-entry-persistence-CBNb94X1.cjs")).then((n) => n.session_entry_persistence_exports));
function normalizeRuntimeModelRef(provider, model) {
	return require_model_selection_normalize.normalizeModelRef(provider, model, require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION);
}
function loadModelCatalogRuntime() {
	return modelCatalogRuntimeLoader.load();
}
function loadSessionPersistenceRuntime() {
	return sessionPersistenceRuntimeLoader.load();
}
function findSelectedCatalogEntry(params) {
	const selectedKey = require_model_selection_normalize.modelKey(require_model_selection_normalize.normalizeProviderId(params.provider), params.model);
	return params.catalog?.find((entry) => require_model_selection_normalize.modelKey(entry.provider, entry.id) === selectedKey);
}
/** Resolves provider/model, allowlist, catalog, and thinking defaults for a reply run. */
async function createModelSelectionState(params) {
	const timingEnabled = shouldLogModelSelectionTiming();
	const startMs = timingEnabled ? Date.now() : 0;
	const logStage = (stage, extra) => {
		if (!timingEnabled) return;
		const suffix = extra ? ` ${extra}` : "";
		console.log(`[model-selection] session=${params.sessionKey ?? "(no-session)"} stage=${stage} elapsedMs=${Date.now() - startMs}${suffix}`);
	};
	const { cfg, agentCfg, sessionEntry, sessionStore, sessionKey, parentSessionKey, storePath, defaultProvider, defaultModel } = params;
	let provider = params.provider;
	let model = params.model;
	const primaryProvider = params.primaryProvider ?? defaultProvider;
	const primaryModel = params.primaryModel ?? defaultModel;
	const hasOneTurnModelOverride = params.hasOneTurnModelOverride === true;
	const hasAllowlist = agentCfg?.models && Object.keys(agentCfg.models).length > 0;
	const visibility = require_model_selection_shared.parseConfiguredModelVisibilityEntries({ cfg });
	const defaultProviderVisibleByWildcard = visibility.providerWildcards.has(require_model_selection_normalize.normalizeProviderId(defaultProvider));
	const configuredModelCatalog = require_model_selection_shared.buildConfiguredModelCatalog({ cfg });
	const needsModelCatalog = params.hasModelDirective || Boolean(hasAllowlist && visibility.providerWildcards.size > 0 && !defaultProviderVisibleByWildcard);
	let allowedModelKeys = /* @__PURE__ */ new Set();
	let allowedModelCatalog = configuredModelCatalog;
	let visibilityPolicy = require_model_visibility_policy.createModelVisibilityPolicy({
		cfg,
		catalog: configuredModelCatalog,
		defaultProvider,
		defaultModel,
		agentId: params.agentId,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	});
	let modelCatalog = null;
	let resetModelOverride = false;
	let resetModelOverrideRef;
	let resetModelOverrideReason;
	const agentEntry = params.agentId ? require_agent_scope_config.resolveAgentConfig(cfg, params.agentId) : void 0;
	const normalizedDirectStoredOverride = require_model_selection.normalizeStoredOverrideModel({
		providerOverride: sessionEntry?.providerOverride,
		modelOverride: sessionEntry?.modelOverride
	});
	const directStoredOverride = require_model_selection.resolvePersistedOverrideModelRef({
		defaultProvider,
		overrideProvider: normalizedDirectStoredOverride.providerOverride,
		overrideModel: normalizedDirectStoredOverride.modelOverride
	});
	const directStoredModelOverride = directStoredOverride ? {
		...directStoredOverride,
		source: "session"
	} : null;
	const staleHeartbeatAutoFallbackOverride = require_stored_model_override.isStaleHeartbeatAutoFallbackOverride({
		isHeartbeat: params.isHeartbeat,
		hasResolvedHeartbeatModelOverride: params.hasResolvedHeartbeatModelOverride,
		sessionEntry,
		storedOverride: directStoredModelOverride,
		defaultProvider,
		defaultModel,
		primaryProvider: params.primaryProvider,
		primaryModel: params.primaryModel
	});
	const primaryHarnessPolicy = require_policy.resolveAgentHarnessPolicy({
		provider: primaryProvider,
		modelId: primaryModel,
		config: cfg,
		agentId: params.agentId,
		sessionKey
	});
	const staleLegacyOpenAICodexAutoOverride = directStoredModelOverride?.source === "session" && sessionEntry?.modelOverrideSource === "auto" && require_model_selection_normalize.normalizeProviderId(directStoredModelOverride.provider ?? "") === "openai" && require_model_selection_normalize.normalizeProviderId(primaryProvider) === "openai" && primaryHarnessPolicy.runtime === "codex" && normalizeRuntimeModelRef("openai", directStoredModelOverride.model).model === normalizeRuntimeModelRef("openai", primaryModel).model;
	const normalizedCurrentSelection = normalizeRuntimeModelRef(provider, model);
	const normalizedDirectOverride = directStoredModelOverride ? normalizeRuntimeModelRef(directStoredModelOverride.provider, directStoredModelOverride.model) : null;
	const staleLegacyAutoFallbackWithoutOrigin = directStoredModelOverride?.source === "session" && require_agent_scope.hasLegacyAutoFallbackWithoutOrigin(sessionEntry) && normalizedDirectOverride !== null && require_model_selection_normalize.modelKey(normalizedCurrentSelection.provider, normalizedCurrentSelection.model) !== require_model_selection_normalize.modelKey(normalizedDirectOverride.provider, normalizedDirectOverride.model);
	const staleDirectStoredOverride = staleHeartbeatAutoFallbackOverride || staleLegacyOpenAICodexAutoOverride || staleLegacyAutoFallbackWithoutOrigin;
	if (needsModelCatalog) {
		modelCatalog = await (await loadModelCatalogRuntime()).loadModelCatalog({ config: cfg });
		logStage("catalog-loaded", `entries=${modelCatalog.length}`);
		visibilityPolicy = require_model_visibility_policy.createModelVisibilityPolicy({
			cfg,
			catalog: modelCatalog,
			defaultProvider,
			defaultModel,
			agentId: params.agentId,
			...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
		});
		allowedModelCatalog = visibilityPolicy.allowedCatalog;
		allowedModelKeys = visibilityPolicy.allowedKeys;
		logStage("allowlist-built", `allowed=${allowedModelCatalog.length} keys=${allowedModelKeys.size}`);
	} else if (hasAllowlist) {
		visibilityPolicy = require_model_visibility_policy.createModelVisibilityPolicy({
			cfg,
			catalog: configuredModelCatalog,
			defaultProvider,
			defaultModel,
			agentId: params.agentId,
			...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
		});
		allowedModelCatalog = visibilityPolicy.allowedCatalog;
		allowedModelKeys = visibilityPolicy.allowedKeys;
		logStage("configured-allowlist-built", `allowed=${allowedModelCatalog.length} keys=${allowedModelKeys.size}`);
	} else if (configuredModelCatalog.length > 0) logStage("configured-catalog-ready", `entries=${configuredModelCatalog.length}`);
	if (sessionEntry && sessionStore && sessionKey && directStoredOverride && !hasOneTurnModelOverride) {
		const normalizedOverride = normalizeRuntimeModelRef(directStoredOverride.provider, directStoredOverride.model);
		const key = require_model_selection_normalize.modelKey(normalizedOverride.provider, normalizedOverride.model);
		if (staleDirectStoredOverride || !visibilityPolicy.allowsKey(key)) {
			const initialSessionEntry = { ...sessionEntry };
			const nextSessionEntry = { ...sessionEntry };
			const { updated } = require_model_overrides.applyModelOverrideToSessionEntry({
				entry: nextSessionEntry,
				selection: {
					provider: primaryProvider,
					model: primaryModel,
					isDefault: true
				},
				preserveAuthProfileOverride: staleDirectStoredOverride
			});
			let resetApplied = updated;
			if (updated) {
				if (storePath) {
					const { persistReplySessionEntry } = await loadSessionPersistenceRuntime();
					const persistence = await persistReplySessionEntry({
						storePath,
						sessionKey,
						initialEntry: initialSessionEntry,
						entry: nextSessionEntry
					});
					if (persistence.status === "lifecycle-invalidated") throw new require_lifecycle.SessionWorkStartInvalidatedError(persistence.error);
					const persistedEntry = persistence.entry;
					resetApplied = require_session_snapshot_merge.sessionModelOverrideChangesApplied({
						initial: initialSessionEntry,
						next: nextSessionEntry,
						current: persistedEntry
					});
					require_session_snapshot_merge.adoptPersistedSessionSnapshot(sessionEntry, persistedEntry);
				} else require_session_snapshot_merge.adoptPersistedSessionSnapshot(sessionEntry, nextSessionEntry);
				sessionStore[sessionKey] = sessionEntry;
			}
			resetModelOverride = resetApplied;
			if (resetApplied) {
				resetModelOverrideRef = key;
				resetModelOverrideReason = staleDirectStoredOverride ? "stale" : "disallowed";
			}
		}
	}
	if (staleDirectStoredOverride) {
		if (require_model_selection_normalize.modelKey(normalizedCurrentSelection.provider, normalizedCurrentSelection.model) === (normalizedDirectOverride ? require_model_selection_normalize.modelKey(normalizedDirectOverride.provider, normalizedDirectOverride.model) : void 0)) {
			provider = primaryProvider;
			model = primaryModel;
		}
	}
	const storedOverride = require_stored_model_override.resolveStoredModelOverride({
		sessionEntry,
		sessionStore,
		sessionKey,
		parentSessionKey,
		defaultProvider
	});
	const skipStoredOverride = params.skipStoredModelOverride === true || hasOneTurnModelOverride || params.hasResolvedHeartbeatModelOverride === true || resetModelOverride && staleDirectStoredOverride && storedOverride?.source === "session";
	if (storedOverride?.model && !skipStoredOverride) {
		const normalizedStoredOverride = normalizeRuntimeModelRef(storedOverride.provider || defaultProvider, storedOverride.model);
		const key = require_model_selection_normalize.modelKey(normalizedStoredOverride.provider, normalizedStoredOverride.model);
		if (visibilityPolicy.allowsKey(key)) {
			provider = normalizedStoredOverride.provider;
			model = normalizedStoredOverride.model;
		}
	}
	if (!params.hasModelDirective && !hasOneTurnModelOverride) {
		const allowedInitialSelection = visibilityPolicy.resolveSelection({
			provider,
			model
		});
		if (!allowedInitialSelection) throw new Error(`Configured default model "${require_model_selection_normalize.modelKey(provider, model)}" is not allowed by agents.defaults.models, and no allowed model is available.`);
		provider = allowedInitialSelection.provider;
		model = allowedInitialSelection.model;
	}
	if (!params.skipStoredModelOverride && sessionEntry && sessionStore && sessionKey && sessionEntry.authProfileOverride) {
		const { ensureAuthProfileStore } = await Promise.resolve().then(() => require("./auth-profiles.runtime-DodZExCU.cjs"));
		const store = ensureAuthProfileStore(void 0, { allowKeychainPrompt: false });
		logStage("auth-profile-store-loaded", `profiles=${Object.keys(store.profiles).length}`);
		const profile = store.profiles[sessionEntry.authProfileOverride];
		const harnessPolicy = require_policy.resolveAgentHarnessPolicy({
			provider,
			modelId: model,
			config: cfg,
			agentId: params.agentId,
			sessionKey
		});
		const acceptedAuthProviders = require_openai_routing.listOpenAIAuthProfileProvidersForAgentRuntime({
			provider,
			harnessRuntime: harnessPolicy.runtime,
			config: cfg
		}).map(require_model_selection_normalize.normalizeProviderId);
		if (!(profile != null && acceptedAuthProviders.some((accepted) => require_order.isStoredCredentialCompatibleWithAuthProvider({
			cfg,
			provider: accepted,
			credential: profile
		})))) await require_session_override.clearSessionAuthProfileOverride({
			sessionEntry,
			sessionStore,
			sessionKey,
			storePath
		});
	}
	let thinkingCatalog;
	let manifestModelCatalog = null;
	const buildThinkingCatalog = (catalog) => require_model_visibility_policy.createModelVisibilityPolicy({
		cfg,
		catalog,
		defaultProvider,
		defaultModel,
		agentId: params.agentId,
		...require_model_visibility_policy.RUNTIME_MODEL_VISIBILITY_NORMALIZATION
	}).allowedCatalog;
	const loadManifestCatalog = async () => {
		if (manifestModelCatalog) return manifestModelCatalog;
		const { loadManifestModelCatalog } = await loadModelCatalogRuntime();
		manifestModelCatalog = loadManifestModelCatalog({
			config: cfg,
			fallbackToMetadataScan: false
		});
		logStage("manifest-catalog-loaded", `entries=${manifestModelCatalog.length}`);
		return manifestModelCatalog;
	};
	const resolveThinkingCatalog = async () => {
		if (thinkingCatalog) return thinkingCatalog;
		let catalogForThinking = allowedModelCatalog.length > 0 ? allowedModelCatalog : modelCatalog && modelCatalog.length > 0 ? buildThinkingCatalog(modelCatalog) : [];
		let selectedCatalogEntry = findSelectedCatalogEntry({
			catalog: catalogForThinking,
			provider,
			model
		});
		if (!modelCatalog && selectedCatalogEntry?.reasoning === void 0) {
			const manifestCatalog = buildThinkingCatalog(await loadManifestCatalog());
			const manifestSelectedEntry = findSelectedCatalogEntry({
				catalog: manifestCatalog,
				provider,
				model
			});
			if (manifestSelectedEntry?.reasoning !== void 0) {
				catalogForThinking = manifestCatalog;
				selectedCatalogEntry = manifestSelectedEntry;
			}
		}
		if (!modelCatalog && (!selectedCatalogEntry || selectedCatalogEntry.reasoning === void 0)) {
			modelCatalog = await (await loadModelCatalogRuntime()).loadModelCatalog({ config: cfg });
			logStage("catalog-loaded-for-thinking", `entries=${modelCatalog.length}`);
			const runtimeCatalog = buildThinkingCatalog(modelCatalog);
			catalogForThinking = findSelectedCatalogEntry({
				catalog: runtimeCatalog,
				provider,
				model
			}) || !catalogForThinking || catalogForThinking.length === 0 ? runtimeCatalog.length > 0 ? runtimeCatalog : allowedModelCatalog : allowedModelCatalog;
		}
		thinkingCatalog = catalogForThinking.length > 0 ? catalogForThinking : void 0;
		return thinkingCatalog;
	};
	const defaultThinkingLevels = /* @__PURE__ */ new Map();
	const resolveDefaultThinkingLevel = async (selection) => {
		const selectedProvider = selection?.provider ?? provider;
		const selectedModel = selection?.model ?? model;
		const cacheKey = `${require_model_selection_normalize.modelKey(selectedProvider, selectedModel)}\0${selection?.agentRuntime ?? ""}`;
		const cached = defaultThinkingLevels.get(cacheKey);
		if (cached) return cached;
		const agentThinkingDefault = agentEntry?.thinkingDefault;
		if (agentThinkingDefault) {
			defaultThinkingLevels.set(cacheKey, agentThinkingDefault);
			return agentThinkingDefault;
		}
		const configuredModels = cfg.agents?.defaults?.models;
		const canonicalKey = require_model_selection_normalize.modelKey(selectedProvider, selectedModel);
		const legacyKey = require_model_selection_normalize.legacyModelKey(selectedProvider, selectedModel);
		const resolvedConfiguredModelThinkingDefault = resolveConfiguredModelThinkingDefault(configuredModels?.[canonicalKey]?.params?.thinking ?? (legacyKey ? configuredModels?.[legacyKey]?.params?.thinking : void 0));
		if (resolvedConfiguredModelThinkingDefault) {
			defaultThinkingLevels.set(cacheKey, resolvedConfiguredModelThinkingDefault);
			return resolvedConfiguredModelThinkingDefault;
		}
		const configuredThinkingDefault = agentCfg?.thinkingDefault;
		if (configuredThinkingDefault) {
			defaultThinkingLevels.set(cacheKey, configuredThinkingDefault);
			return configuredThinkingDefault;
		}
		const catalogForThinking = await resolveThinkingCatalog();
		const defaultThinkingLevel = require_model_thinking_default.resolveThinkingDefault({
			cfg,
			provider: selectedProvider,
			model: selectedModel,
			catalog: catalogForThinking,
			agentRuntime: selection?.agentRuntime
		}) ?? "off";
		defaultThinkingLevels.set(cacheKey, defaultThinkingLevel);
		return defaultThinkingLevel;
	};
	let defaultReasoningLevel;
	const resolveDefaultReasoningLevel = async () => {
		if (defaultReasoningLevel) return defaultReasoningLevel;
		let catalogForReasoning = modelCatalog ?? allowedModelCatalog;
		let selectedReasoningEntry = findSelectedCatalogEntry({
			catalog: catalogForReasoning,
			provider,
			model
		});
		if (!modelCatalog && selectedReasoningEntry?.reasoning === void 0) {
			const manifestCatalog = await loadManifestCatalog();
			const manifestReasoningCatalog = hasAllowlist ? buildThinkingCatalog(manifestCatalog) : manifestCatalog;
			const manifestSelectedEntry = findSelectedCatalogEntry({
				catalog: manifestReasoningCatalog,
				provider,
				model
			});
			if (manifestSelectedEntry?.reasoning !== void 0) {
				catalogForReasoning = manifestReasoningCatalog;
				selectedReasoningEntry = manifestSelectedEntry;
			}
		}
		if ((!catalogForReasoning || catalogForReasoning.length === 0) && selectedReasoningEntry?.reasoning === void 0) {
			modelCatalog = await (await loadModelCatalogRuntime()).loadModelCatalog({ config: cfg });
			logStage("catalog-loaded-for-reasoning", `entries=${modelCatalog.length}`);
			catalogForReasoning = modelCatalog;
		}
		defaultReasoningLevel = require_model_selection.resolveReasoningDefault({
			provider,
			model,
			catalog: catalogForReasoning
		});
		return defaultReasoningLevel;
	};
	const selectedCatalogEntry = findSelectedCatalogEntry({
		catalog: modelCatalog ?? allowedModelCatalog,
		provider,
		model
	});
	const configuredModels = cfg.agents?.defaults?.models;
	const canonicalKey = require_model_selection_normalize.modelKey(provider, model);
	const legacyKey = require_model_selection_normalize.legacyModelKey(provider, model);
	const configuredModelThinkingDefault = configuredModels?.[canonicalKey]?.params?.thinking ?? (legacyKey ? configuredModels?.[legacyKey]?.params?.thinking : void 0);
	const hasConfiguredThinkingDefault = agentEntry?.thinkingDefault !== void 0 || resolveConfiguredModelThinkingDefault(configuredModelThinkingDefault) !== void 0 || agentCfg?.thinkingDefault !== void 0;
	return {
		provider,
		model,
		allowedModelKeys,
		allowedModelCatalog,
		resetModelOverride,
		resetModelOverrideRef,
		resetModelOverrideReason,
		resolveThinkingCatalog,
		resolveDefaultThinkingLevel,
		hasConfiguredThinkingDefault,
		resolveDefaultReasoningLevel,
		needsModelCatalog,
		modelContextWindow: selectedCatalogEntry?.contextWindow,
		modelContextTokens: selectedCatalogEntry?.contextTokens
	};
}
/** Resolves the context window token count for the selected provider/model. */
function resolveContextTokens(params) {
	const modelContextTokens = require_context.resolveContextTokensForModel({
		cfg: params.cfg,
		provider: params.provider,
		model: params.model,
		modelContextWindow: params.modelContextWindow,
		modelContextTokens: params.modelContextTokens,
		allowAsyncLoad: false
	});
	const agentContextTokens = typeof params.agentCfg?.contextTokens === "number" && params.agentCfg.contextTokens > 0 ? Math.floor(params.agentCfg.contextTokens) : void 0;
	if (agentContextTokens !== void 0) return modelContextTokens !== void 0 ? Math.min(agentContextTokens, modelContextTokens) : agentContextTokens;
	return modelContextTokens ?? 2e5;
}
//#endregion
//#region src/auto-reply/reply/directive-handling.model-selection.ts
/** Resolves /model directive selections and auth profile overrides. */
function resolveStoredNumericProfileModelDirective(params) {
	const trimmed = params.raw.trim();
	const lastSlash = trimmed.lastIndexOf("/");
	const profileDelimiter = trimmed.indexOf("@", lastSlash + 1);
	if (profileDelimiter <= 0) return null;
	const profileId = trimmed.slice(profileDelimiter + 1).trim();
	if (!/^\d{8}$/.test(profileId)) return null;
	const modelRaw = trimmed.slice(0, profileDelimiter).trim();
	if (!modelRaw) return null;
	const profile = require_store.ensureAuthProfileStore(params.agentDir, { allowKeychainPrompt: false }).profiles[profileId];
	if (!profile) return null;
	return {
		modelRaw,
		profileId,
		profileProvider: profile.provider
	};
}
/** Resolves the requested model/profile override from parsed inline directives. */
function resolveModelSelectionFromDirective(params) {
	if (!params.directives.hasModelDirective || !params.directives.rawModelDirective) {
		if (params.directives.rawModelProfile) return { errorText: "Auth profile override requires a model selection." };
		return {};
	}
	const raw = params.directives.rawModelDirective.trim();
	if (/^default$/i.test(raw)) return { modelSelection: {
		provider: params.defaultProvider,
		model: params.defaultModel,
		isDefault: true
	} };
	const storedNumericProfile = params.directives.rawModelProfile === void 0 ? resolveStoredNumericProfileModelDirective({
		raw,
		agentDir: params.agentDir
	}) : null;
	const storedNumericProfileSelection = storedNumericProfile ? require_model_selection_directive.resolveModelDirectiveSelection({
		raw: storedNumericProfile.modelRaw,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		aliasIndex: params.aliasIndex,
		allowedModelKeys: params.allowedModelKeys,
		rawRuntime: params.directives.rawModelRuntime
	}) : null;
	const useStoredNumericProfile = Boolean(storedNumericProfileSelection?.selection) && require_provider_auth_aliases.resolveProviderIdForAuth(storedNumericProfileSelection?.selection?.provider ?? "", { config: params.cfg }) === require_provider_auth_aliases.resolveProviderIdForAuth(storedNumericProfile?.profileProvider ?? "", { config: params.cfg });
	const modelRaw = useStoredNumericProfile && storedNumericProfile ? storedNumericProfile.modelRaw : raw;
	let modelSelection;
	if (/^[0-9]+$/.test(raw)) return { errorText: [
		"Numeric model selection is not supported in chat.",
		"",
		"Browse: /models or /models <provider>",
		"Switch: /model <provider/model>"
	].join("\n") };
	const explicit = require_model_selection_shared.resolveModelRefFromString({
		raw: modelRaw,
		defaultProvider: params.defaultProvider,
		aliasIndex: params.aliasIndex
	});
	if (explicit) {
		const explicitKey = require_model_selection_normalize.modelKey(explicit.ref.provider, explicit.ref.model);
		if (params.allowedModelKeys.size === 0 || require_model_selection_shared.isModelKeyAllowedBySet(params.allowedModelKeys, explicitKey)) modelSelection = {
			provider: explicit.ref.provider,
			model: explicit.ref.model,
			isDefault: explicit.ref.provider === params.defaultProvider && explicit.ref.model === params.defaultModel,
			...explicit.alias ? { alias: explicit.alias } : {}
		};
	}
	if (!modelSelection) {
		const resolved = require_model_selection_directive.resolveModelDirectiveSelection({
			raw: modelRaw,
			defaultProvider: params.defaultProvider,
			defaultModel: params.defaultModel,
			aliasIndex: params.aliasIndex,
			allowedModelKeys: params.allowedModelKeys,
			rawRuntime: params.directives.rawModelRuntime
		});
		if (resolved.error) return { errorText: resolved.error };
		if (resolved.selection) modelSelection = resolved.selection;
	}
	let profileOverride;
	const rawProfile = params.directives.rawModelProfile ?? (useStoredNumericProfile ? storedNumericProfile?.profileId : void 0);
	if (modelSelection && rawProfile) {
		const profileResolved = resolveProfileOverride({
			rawProfile,
			provider: modelSelection.provider,
			cfg: params.cfg,
			agentDir: params.agentDir
		});
		if (profileResolved.error) return { errorText: profileResolved.error };
		profileOverride = profileResolved.profileId;
	}
	return {
		modelSelection,
		profileOverride
	};
}
//#endregion
Object.defineProperty(exports, "createFastTestModelSelectionState", {
	enumerable: true,
	get: function() {
		return createFastTestModelSelectionState;
	}
});
Object.defineProperty(exports, "createModelSelectionState", {
	enumerable: true,
	get: function() {
		return createModelSelectionState;
	}
});
Object.defineProperty(exports, "resolveContextTokens", {
	enumerable: true,
	get: function() {
		return resolveContextTokens;
	}
});
Object.defineProperty(exports, "resolveModelSelectionFromDirective", {
	enumerable: true,
	get: function() {
		return resolveModelSelectionFromDirective;
	}
});
