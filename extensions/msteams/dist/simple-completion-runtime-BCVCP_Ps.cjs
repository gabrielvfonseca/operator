const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_ref_profile = require("./model-ref-profile-zWPYIfmj.cjs");
const require_codex_plugin_diagnostics = require("./codex-plugin-diagnostics-DuedamAL.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
const require_provider_secret_egress = require("./provider-secret-egress-NB6SfEEF.cjs");
const require_provider_runtime_runtime = require("./provider-runtime.runtime-BdpKDfCD.cjs");
const require_provider_hook_runtime = require("./provider-hook-runtime-CQSINlxr.cjs");
require("./provider-runtime-Blezec6-.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
require("./session-transcript-repair-vqlcO05-.cjs");
const require_model_auth_runtime_shared = require("./model-auth-runtime-shared-UOjMKX1E.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_provider_stream = require("./provider-stream-DRQnPAya.cjs");
const require_openai_transport_stream = require("./openai-transport-stream-BqxWn1Ig.cjs");
const require_anthropic_vertex_stream = require("./anthropic-vertex-stream-CeWYOXji.cjs");
const require_model = require("./model-Don1-Go6.cjs");
const require_execution_auth_binding = require("./execution-auth-binding-DbwshiTD.cjs");
let _gabrielvfonseca_llm_core = require("@gabrielvfonseca/llm-core");
let _gabrielvfonseca_ai_internal_runtime = require("@gabrielvfonseca/ai/internal/runtime");
let _gabrielvfonseca_ai_internal_openai = require("@gabrielvfonseca/ai/internal/openai");
//#region src/agents/simple-completion-scope.ts
const workspaceByResolver = /* @__PURE__ */ new WeakMap();
/** Keep request-local workspace scope without growing the public completion SDK signature. */
function bindSimpleCompletionModelResolverWorkspace(resolver, workspaceDir) {
	const scopedResolver = (provider, modelId, agentDir, cfg, options) => resolver(provider, modelId, agentDir, cfg, options);
	workspaceByResolver.set(scopedResolver, workspaceDir);
	return scopedResolver;
}
function resolveSimpleCompletionModelResolverWorkspace(resolver) {
	return resolver ? workspaceByResolver.get(resolver) : void 0;
}
//#endregion
//#region src/agents/google-simple-completion-stream.ts
/**
* Google simple-completion stream adapter.
*
* This registers a patched Google stream API that keeps the normal Google
* backend but sanitizes unsupported thinking payload options for simple models.
*/
/** Custom API id for the Google simple-completion stream adapter. */
const GOOGLE_SIMPLE_COMPLETION_API = "operator-google-generative-ai-simple";
const SOURCE_API = "google-generative-ai";
function resolveGoogleSimpleThinkingLevel(model, reasoning) {
	switch (reasoning) {
		case "adaptive": return reasoning;
		case "off":
		case "minimal":
		case "low":
		case "medium":
		case "high":
		case "max":
		case "xhigh": return (0, _gabrielvfonseca_ai_internal_runtime.clampThinkingLevel)(model, reasoning);
		default: return;
	}
}
function buildGoogleSimpleCompletionStreamFn() {
	return (model, context, options) => {
		const googleModel = {
			...model,
			api: SOURCE_API
		};
		return require_openai_transport_stream.streamWithPayloadPatch(_gabrielvfonseca_ai_internal_runtime.streamSimple, googleModel, context, options, (payload) => {
			require_openai_transport_stream.sanitizeGoogleThinkingPayload({
				payload,
				modelId: model.id,
				thinkingLevel: resolveGoogleSimpleThinkingLevel(googleModel, options?.reasoning)
			});
		});
	};
}
/** Rewrites Google generative-ai models to the simple-completion adapter when needed. */
function prepareGoogleSimpleCompletionModel(model) {
	if (model.api !== SOURCE_API) return model;
	require_provider_stream.ensureCustomApiRegistered(GOOGLE_SIMPLE_COMPLETION_API, buildGoogleSimpleCompletionStreamFn());
	return {
		...model,
		api: GOOGLE_SIMPLE_COMPLETION_API
	};
}
//#endregion
//#region src/agents/simple-completion-transport.ts
const PROVIDER_SIMPLE_COMPLETION_API_PREFIX = "operator-provider-simple:";
function resolveAnthropicVertexSimpleApi(baseUrl) {
	return `operator-anthropic-vertex-simple:${baseUrl?.trim() ? encodeURIComponent(baseUrl.trim()) : "default"}`;
}
function normalizeCodexResponsesBaseUrlForOpenAISdk(baseUrl) {
	const normalized = baseUrl?.trim().replace(/\/+$/u, "") || "https://chatgpt.com/backend-api";
	try {
		const parsed = new URL(normalized);
		const path = parsed.pathname.replace(/\/+$/u, "").toLowerCase();
		if (parsed.hostname.toLowerCase() === "chatgpt.com" && [
			"/backend-api",
			"/backend-api/v1",
			"/backend-api/codex",
			"/backend-api/codex/v1",
			"/backend-api/codex/responses"
		].includes(path)) {
			parsed.pathname = "/backend-api/codex";
			parsed.search = "";
			parsed.hash = "";
			return parsed.toString().replace(/\/$/u, "");
		}
	} catch {}
	if (normalized.endsWith("/codex/responses")) return normalized.slice(0, -10);
	if (normalized.endsWith("/codex")) return normalized;
	return `${normalized}/codex`;
}
function resolveProviderSimpleCompletionApi(model) {
	const parts = [
		model.provider,
		model.id,
		model.api,
		model.baseUrl || "default"
	];
	return `${PROVIDER_SIMPLE_COMPLETION_API_PREFIX}${parts.map((part) => encodeURIComponent(part)).join(":")}`;
}
function applyProviderSimpleCompletionWrapper(model, cfg) {
	if (model.api.startsWith(PROVIDER_SIMPLE_COMPLETION_API_PREFIX)) return model;
	const sourceProvider = (0, _gabrielvfonseca_ai_internal_runtime.getApiProvider)(model.api);
	if (!sourceProvider) return model;
	const sourceApi = model.api;
	const sourceStreamFn = (runtimeModel, context, options) => sourceProvider.streamSimple({
		...runtimeModel,
		api: sourceApi
	}, context, options);
	const streamFn = require_provider_hook_runtime.wrapProviderSimpleCompletionStreamFn({
		provider: model.provider,
		config: cfg,
		context: {
			config: cfg,
			provider: model.provider,
			modelId: model.id,
			model,
			streamFn: sourceStreamFn
		}
	});
	if (!streamFn) return model;
	const api = resolveProviderSimpleCompletionApi(model);
	require_provider_stream.ensureCustomApiRegistered(api, streamFn);
	return {
		...model,
		api
	};
}
function prepareCodexSimpleTransportModel(model, cfg) {
	if (model.provider !== "openai" || model.api !== "openai-chatgpt-responses") return;
	const transportModel = {
		...model,
		baseUrl: normalizeCodexResponsesBaseUrlForOpenAISdk(model.baseUrl)
	};
	const api = require_provider_stream.resolveTransportAwareSimpleApi(model.api);
	const streamFn = require_provider_stream.createOperatorTransportStreamFnForModel(transportModel, { cfg });
	if (!api || !streamFn) return;
	require_provider_stream.ensureCustomApiRegistered(api, streamFn);
	return {
		...transportModel,
		api
	};
}
function prepareModelForSimpleCompletion(params) {
	const { model, cfg } = params;
	if (!(0, _gabrielvfonseca_ai_internal_runtime.getApiProvider)(model.api) && require_provider_stream.registerProviderStreamForModel({
		model,
		cfg
	})) return applyProviderSimpleCompletionWrapper(model, cfg);
	const codexTransportModel = prepareCodexSimpleTransportModel(model, cfg);
	if (codexTransportModel) return applyProviderSimpleCompletionWrapper(codexTransportModel, cfg);
	const transportAwareModel = require_provider_stream.prepareTransportAwareSimpleModel(model, { cfg });
	if (transportAwareModel !== model) {
		const streamFn = require_provider_stream.buildTransportAwareSimpleStreamFn(model, { cfg });
		if (streamFn) {
			require_provider_stream.ensureCustomApiRegistered(transportAwareModel.api, streamFn);
			return applyProviderSimpleCompletionWrapper(transportAwareModel, cfg);
		}
	}
	if (model.api === "google-generative-ai") return applyProviderSimpleCompletionWrapper(prepareGoogleSimpleCompletionModel(model), cfg);
	if (model.provider === "anthropic-vertex") {
		const api = resolveAnthropicVertexSimpleApi(model.baseUrl);
		require_provider_stream.ensureCustomApiRegistered(api, require_anthropic_vertex_stream.createAnthropicVertexStreamFnForModel(model));
		return applyProviderSimpleCompletionWrapper({
			...model,
			api
		}, cfg);
	}
	return applyProviderSimpleCompletionWrapper(model, cfg);
}
//#endregion
//#region src/agents/utility-model.ts
/**
* Reads the configured utility-model setting. A defined-but-empty value is an
* explicit opt-out ("disabled"), distinct from unset ("auto"); the agent-level
* value wins over defaults even when it is the empty string.
*/
function readUtilityModelSetting(cfg, agentId) {
	const value = require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.utilityModel ?? cfg.agents?.defaults?.utilityModel;
	if (value === void 0) return { kind: "auto" };
	const trimmed = value.trim();
	return trimmed ? {
		kind: "explicit",
		modelRef: trimmed
	} : { kind: "disabled" };
}
/**
* Provider-declared default utility model (manifest
* `modelCatalog.providers.<id>.defaultUtilityModel`), or undefined when the
* provider does not declare one. Reads only the process-current plugin
* metadata snapshot, so the lookup stays synchronous and cheap; contexts
* without a snapshot simply get no derived default.
*/
function resolveProviderDefaultUtilityModelRef(params) {
	const provider = params.provider.trim().toLowerCase();
	if (!provider) return;
	const snapshot = params.metadataSnapshot ?? require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.cfg,
		allowWorkspaceScopedSnapshot: true
	});
	if (!snapshot) return;
	for (const plugin of snapshot.plugins) {
		const modelId = (plugin.modelCatalog?.providers?.[provider]?.defaultUtilityModel)?.trim();
		if (modelId) return `${provider}/${modelId}`;
	}
}
/**
* The utility model ref to use for the agent, or undefined when utility
* routing is disabled or no default exists. Derivation uses the agent's
* primary provider, so usable auth is already established by construction.
*/
function resolveUtilityModelRefForAgent(params) {
	const setting = readUtilityModelSetting(params.cfg, params.agentId);
	if (setting.kind === "explicit") return setting.modelRef;
	if (setting.kind === "disabled") return;
	const provider = params.primaryProvider?.trim() || require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId
	}).provider;
	if (!provider) return;
	const derived = resolveProviderDefaultUtilityModelRef({
		cfg: params.cfg,
		provider,
		metadataSnapshot: params.metadataSnapshot
	});
	if (!derived) return;
	const primaryRef = require_agent_scope.resolveAgentEffectiveModelPrimary(params.cfg, params.agentId) ?? "";
	const primaryProfile = primaryRef ? require_model_ref_profile.splitTrailingAuthProfile(primaryRef)?.profile : void 0;
	return primaryProfile ? `${derived}@${primaryProfile}` : derived;
}
//#endregion
//#region src/agents/simple-completion-runtime.ts
var simple_completion_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	completeWithPreparedSimpleCompletionModel: () => completeWithPreparedSimpleCompletionModel,
	prepareSimpleCompletionModel: () => prepareSimpleCompletionModel,
	prepareSimpleCompletionModelForAgent: () => prepareSimpleCompletionModelForAgent,
	resolveSimpleCompletionSelectionForAgent: () => resolveSimpleCompletionSelectionForAgent
});
function resolveSimpleCompletionSelectionForAgent(params) {
	const fallbackRef = require_codex_plugin_diagnostics.resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId
	});
	const modelRef = params.modelRef?.trim() || (params.useUtilityModel ? resolveUtilityModelRefForAgent({
		cfg: params.cfg,
		agentId: params.agentId,
		primaryProvider: fallbackRef.provider
	}) : void 0) || require_agent_scope.resolveAgentEffectiveModelPrimary(params.cfg, params.agentId);
	const split = modelRef ? require_model_ref_profile.splitTrailingAuthProfile(modelRef) : null;
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: fallbackRef.provider || "openrouter"
	});
	const resolved = split ? require_model_selection_shared.resolveModelRefFromString({
		raw: split.model,
		defaultProvider: fallbackRef.provider || "openrouter",
		aliasIndex
	}) : null;
	const provider = resolved?.ref.provider ?? fallbackRef.provider;
	const modelId = resolved?.ref.model ?? fallbackRef.model;
	if (!provider || !modelId) return null;
	return {
		provider,
		modelId,
		...resolveSimpleCompletionRuntimeProvider({
			cfg: params.cfg,
			agentId: params.agentId,
			provider,
			modelId
		}),
		profileId: split?.profile || void 0,
		agentDir: params.agentDir?.trim() || require_agent_scope_config.resolveAgentDir(params.cfg, params.agentId)
	};
}
function resolveSimpleCompletionRuntimeProvider(params) {
	if (!require_openai_routing.isOpenAIProvider(params.provider)) return {};
	return require_policy.resolveAgentHarnessPolicy({
		provider: params.provider,
		modelId: params.modelId,
		config: params.cfg,
		agentId: params.agentId
	}).runtime === "codex" ? { runtimeProvider: require_openai_routing.OPENAI_PROVIDER_ID } : {};
}
async function setRuntimeApiKeyForCompletion(params) {
	const preparedAuth = require_provider_secret_egress.protectPreparedProviderRuntimeAuth({
		provider: params.model.provider,
		preparedAuth: await require_provider_runtime_runtime.prepareProviderRuntimeAuth({
			provider: params.model.provider,
			config: params.cfg,
			workspaceDir: params.workspaceDir,
			env: process.env,
			context: {
				config: params.cfg,
				workspaceDir: params.workspaceDir,
				env: process.env,
				provider: params.model.provider,
				modelId: params.model.id,
				model: params.model,
				apiKey: params.apiKey,
				authMode: params.authMode,
				profileId: params.profileId
			}
		})
	});
	const runtimeApiKey = preparedAuth?.apiKey?.trim() || params.apiKey;
	params.authStorage.setRuntimeApiKey(params.model.provider, runtimeApiKey);
	return {
		apiKey: runtimeApiKey,
		model: require_provider_request_config.applyPreparedRuntimeAuthToModel(params.model, preparedAuth)
	};
}
function hasMissingApiKeyAllowance(params) {
	return Boolean(params.allowMissingApiKeyModes?.includes(params.mode));
}
async function prepareSimpleCompletionModel(params) {
	const workspaceDir = resolveSimpleCompletionModelResolverWorkspace(params.modelResolver);
	const resolved = params.useAsyncModelResolution || params.skipAgentDiscovery ? await (params.modelResolver ?? require_model.resolveModelAsync)(params.provider, params.modelId, params.agentDir, params.cfg, {
		...params.allowBundledStaticCatalogFallback !== void 0 ? { allowBundledStaticCatalogFallback: params.allowBundledStaticCatalogFallback } : {},
		...params.skipAgentDiscovery ? { skipAgentDiscovery: true } : {},
		workspaceDir,
		authProfileId: params.profileId,
		preferredProfile: params.preferredProfile
	}) : require_model.resolveModel(params.provider, params.modelId, params.agentDir, params.cfg, {
		workspaceDir,
		authProfileId: params.profileId,
		preferredProfile: params.preferredProfile
	});
	if (!resolved.model) return { error: resolved.error ?? `Unknown model: ${params.provider}/${params.modelId}` };
	let auth;
	const authStore = params.bindAuthOwner ? require_store.ensureAuthProfileStore(params.agentDir, {
		readOnly: true,
		allowKeychainPrompt: false,
		config: params.cfg
	}) : void 0;
	try {
		auth = await require_model_auth.getApiKeyForModel({
			model: resolved.model,
			cfg: params.cfg,
			agentDir: params.agentDir,
			workspaceDir,
			profileId: params.profileId,
			preferredProfile: params.preferredProfile,
			...authStore ? { store: authStore } : {},
			...params.bindAuthOwner && params.profileId ? { lockedProfile: true } : {},
			secretSentinels: true
		});
	} catch (err) {
		return { error: `Auth lookup failed for provider "${resolved.model.provider}": ${require_errors.formatErrorMessage(err)}` };
	}
	const rawApiKey = auth.apiKey?.trim();
	if (!rawApiKey && !hasMissingApiKeyAllowance({
		mode: auth.mode,
		allowMissingApiKeyModes: params.allowMissingApiKeyModes
	})) return {
		error: require_model_auth_runtime_shared.formatMissingAuthError(auth, resolved.model.provider),
		auth
	};
	let authValue = rawApiKey;
	let resolvedModel = resolved.model;
	if (rawApiKey) {
		const runtimeCredential = await setRuntimeApiKeyForCompletion({
			authStorage: resolved.authStorage,
			model: resolved.model,
			apiKey: rawApiKey,
			authMode: auth.mode,
			cfg: params.cfg,
			workspaceDir: workspaceDir ?? params.agentDir,
			profileId: auth.profileId
		});
		authValue = runtimeCredential.apiKey;
		resolvedModel = runtimeCredential.model;
	}
	const resolvedAuth = {
		...auth,
		apiKey: authValue
	};
	const profileCredential = params.profileId ? authStore?.profiles[params.profileId] : void 0;
	const sourceAuthFingerprint = params.bindAuthOwner ? profileCredential?.type === "oauth" && params.profileId ? require_execution_auth_binding.fingerprintAuthProfileCredential({
		profileId: params.profileId,
		credential: profileCredential
	}) : require_execution_auth_binding.fingerprintResolvedProviderAuth(auth) : void 0;
	return {
		model: require_model_auth.applySecretRefHeaderSentinels(require_model_auth.applyLocalNoAuthHeaderOverride(resolvedModel, resolvedAuth), params.cfg),
		auth: resolvedAuth,
		...sourceAuthFingerprint ? { sourceAuthFingerprint } : {}
	};
}
async function prepareSimpleCompletionModelForAgent(params) {
	const selection = resolveSimpleCompletionSelectionForAgent({
		cfg: params.cfg,
		agentId: params.agentId,
		agentDir: params.agentDir,
		modelRef: params.modelRef,
		useUtilityModel: params.useUtilityModel
	});
	if (!selection) return { error: `No model configured for agent ${params.agentId}.` };
	const prepared = await prepareSimpleCompletionModel({
		cfg: params.cfg,
		provider: selection.runtimeProvider ?? selection.provider,
		modelId: selection.modelId,
		agentDir: selection.agentDir,
		profileId: selection.profileId,
		preferredProfile: params.preferredProfile,
		allowMissingApiKeyModes: params.allowMissingApiKeyModes,
		...params.allowBundledStaticCatalogFallback !== void 0 ? { allowBundledStaticCatalogFallback: params.allowBundledStaticCatalogFallback } : {},
		useAsyncModelResolution: params.useAsyncModelResolution,
		skipAgentDiscovery: params.skipAgentDiscovery,
		bindAuthOwner: params.bindAuthOwner,
		modelResolver: params.modelResolver
	});
	if ("error" in prepared) return {
		...prepared,
		selection
	};
	return {
		selection,
		model: prepared.model,
		auth: prepared.auth,
		...prepared.sourceAuthFingerprint ? { sourceAuthFingerprint: prepared.sourceAuthFingerprint } : {}
	};
}
async function completeWithPreparedSimpleCompletionModel(params) {
	const completionModel = prepareModelForSimpleCompletion({
		model: params.model,
		cfg: params.cfg
	});
	const { reasoning: rawReasoning, ...options } = params.options ?? {};
	const reasoning = normalizeSimpleCompletionReasoning(rawReasoning, completionModel);
	return await (0, _gabrielvfonseca_ai_internal_runtime.completeSimple)(completionModel, params.context, {
		...options,
		...reasoning ? { reasoning } : {},
		apiKey: params.auth.apiKey
	});
}
function normalizeSimpleCompletionReasoning(reasoning, model) {
	switch (reasoning) {
		case void 0: return;
		case "off": return (0, _gabrielvfonseca_llm_core.resolveClaudeSonnet5ModelIdentity)(model) ? "off" : void 0;
		case "adaptive": return "medium";
		case "ultra":
		case "max": return require_openai_routing.isOpenAIProvider(model.provider) && (0, _gabrielvfonseca_ai_internal_openai.supportsOpenAIReasoningEffort)(model, "max") ? "max" : "xhigh";
		default: return reasoning;
	}
}
//#endregion
Object.defineProperty(exports, "bindSimpleCompletionModelResolverWorkspace", {
	enumerable: true,
	get: function() {
		return bindSimpleCompletionModelResolverWorkspace;
	}
});
Object.defineProperty(exports, "completeWithPreparedSimpleCompletionModel", {
	enumerable: true,
	get: function() {
		return completeWithPreparedSimpleCompletionModel;
	}
});
Object.defineProperty(exports, "normalizeCodexResponsesBaseUrlForOpenAISdk", {
	enumerable: true,
	get: function() {
		return normalizeCodexResponsesBaseUrlForOpenAISdk;
	}
});
Object.defineProperty(exports, "prepareSimpleCompletionModel", {
	enumerable: true,
	get: function() {
		return prepareSimpleCompletionModel;
	}
});
Object.defineProperty(exports, "prepareSimpleCompletionModelForAgent", {
	enumerable: true,
	get: function() {
		return prepareSimpleCompletionModelForAgent;
	}
});
Object.defineProperty(exports, "resolveUtilityModelRefForAgent", {
	enumerable: true,
	get: function() {
		return resolveUtilityModelRefForAgent;
	}
});
Object.defineProperty(exports, "simple_completion_runtime_exports", {
	enumerable: true,
	get: function() {
		return simple_completion_runtime_exports;
	}
});
