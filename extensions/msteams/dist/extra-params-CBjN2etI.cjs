require("./parse-finite-number-BTqU_Omp.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_provider_attribution = require("./provider-attribution-CIUHVFNx.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
const require_provider_hook_runtime = require("./provider-hook-runtime-CQSINlxr.cjs");
const require_logger = require("./logger-B-gij7u9.cjs");
const require_session_transcript_repair = require("./session-transcript-repair-vqlcO05-.cjs");
const require_codex_native_web_search_core = require("./codex-native-web-search-core-Ca08HKYE.cjs");
const require_openai_completions_compat = require("./openai-completions-compat-plxocpXB.cjs");
const require_openai_transport_stream = require("./openai-transport-stream-BqxWn1Ig.cjs");
require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
require("@gabrielvfonseca/ai/internal/openai");
let _gabrielvfonseca_ai_internal_runtime = require("@gabrielvfonseca/ai/internal/runtime");
//#region src/llm/providers/stream-wrappers/anthropic-family-cache-semantics.ts
function isAnthropicModelRef(modelId) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId).startsWith("anthropic/");
}
/** Matches Application Inference Profile ARNs across all AWS partitions with Bedrock. */
const BEDROCK_APP_INFERENCE_PROFILE_ARN_RE = /^arn:aws(-cn|-us-gov)?:bedrock:/;
function isAnthropicBedrockModel(modelId) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId);
	if (normalized.includes("anthropic.claude") || normalized.includes("anthropic/claude")) return true;
	if (BEDROCK_APP_INFERENCE_PROFILE_ARN_RE.test(normalized) && normalized.includes(":application-inference-profile/")) return (normalized.split(":application-inference-profile/")[1] ?? "").includes("claude");
	return false;
}
function isAnthropicFamilyCacheTtlEligible(params) {
	const normalizedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.provider);
	if (normalizedProvider === "anthropic" || normalizedProvider === "anthropic-vertex") return true;
	if (normalizedProvider === "amazon-bedrock") return isAnthropicBedrockModel(params.modelId);
	return params.modelApi === "anthropic-messages";
}
function resolveAnthropicCacheRetentionFamily(params) {
	const normalizedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.provider);
	if (normalizedProvider === "anthropic" || normalizedProvider === "anthropic-vertex") return "anthropic-direct";
	if (normalizedProvider === "amazon-bedrock" && params.hasExplicitCacheConfig && typeof params.modelId === "string") {
		if (isAnthropicBedrockModel(params.modelId)) return "anthropic-bedrock";
		if (BEDROCK_APP_INFERENCE_PROFILE_ARN_RE.test((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.modelId)) && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.modelId).includes(":application-inference-profile/")) return "anthropic-bedrock";
	}
	if (normalizedProvider !== "amazon-bedrock" && params.hasExplicitCacheConfig && params.modelApi === "anthropic-messages") return "custom-anthropic-api";
}
//#endregion
//#region src/agents/embedded-agent-runner/prompt-cache-retention.ts
/**
* Resolves provider/model prompt-cache retention behavior.
*/
function parseCacheRetention(value) {
	return value === "none" || value === "short" || value === "long" ? value : void 0;
}
function isGooglePromptCacheEligible(params) {
	if (params.modelApi !== "google-generative-ai") return false;
	const normalizedModelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.modelId);
	return normalizedModelId.startsWith("gemini-2.5") || normalizedModelId.startsWith("gemini-3");
}
function resolveCacheRetention(extraParams, provider, modelApi, modelId, supportsPromptCacheKey) {
	const family = resolveAnthropicCacheRetentionFamily({
		provider,
		modelApi,
		modelId,
		hasExplicitCacheConfig: extraParams?.cacheRetention !== void 0 || extraParams?.cacheControlTtl !== void 0
	});
	const googleEligible = isGooglePromptCacheEligible({
		modelApi,
		modelId
	});
	if (!family && !googleEligible && !(supportsPromptCacheKey === true)) return;
	const newVal = parseCacheRetention(extraParams?.cacheRetention);
	if (newVal) return newVal;
	const legacy = extraParams?.cacheControlTtl;
	if (legacy === "5m" && (family || googleEligible)) return "short";
	if (legacy === "1h" && (family || googleEligible)) return "long";
	return family === "anthropic-direct" ? "short" : void 0;
}
//#endregion
//#region src/agents/openai-text-verbosity.ts
/**
* OpenAI text verbosity normalization for provider-owned stream parameters.
*
* Invalid operator-supplied values are ignored with a warning instead of leaking into API payloads.
*/
function normalizeOpenAITextVerbosity(value) {
	if (typeof value !== "string") return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (normalized === "low" || normalized === "medium" || normalized === "high") return normalized;
}
/** @deprecated OpenAI provider-owned stream helper; do not use from third-party plugins. */
function resolveOpenAITextVerbosity(extraParams) {
	const raw = extraParams?.textVerbosity ?? extraParams?.text_verbosity;
	const normalized = normalizeOpenAITextVerbosity(raw);
	if (raw !== void 0 && normalized === void 0) {
		const rawSummary = typeof raw === "string" ? raw : typeof raw;
		require_logger.log.warn(`ignoring invalid OpenAI text verbosity param: ${rawSummary}`);
	}
	return normalized;
}
//#endregion
//#region src/llm/providers/stream-wrappers/openai.ts
const log = require_subsystem.createSubsystemLogger("llm/providers/stream-wrappers");
function isCodeModeEnabled(config) {
	const tools = config?.tools;
	if (!tools || typeof tools !== "object") return false;
	const codeMode = tools.codeMode;
	if (codeMode === true) return true;
	return Boolean(codeMode && typeof codeMode === "object" && codeMode.enabled === true);
}
function readPayloadToolField(record, field) {
	try {
		return record[field];
	} catch {
		return;
	}
}
function isPromiseLike(value) {
	return value !== null && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
}
function readPayloadToolName(tool) {
	if (!tool || typeof tool !== "object") return;
	const record = tool;
	const name = readPayloadToolField(record, "name");
	if (typeof name === "string") return name;
	const fn = readPayloadToolField(record, "function");
	if (!fn || typeof fn !== "object") return;
	const fnName = readPayloadToolField(fn, "name");
	return typeof fnName === "string" ? fnName : void 0;
}
function isCodeModePayloadToolName(name) {
	return name === "exec" || name === "wait";
}
function filterCodeModeToolDeclarations(declarations) {
	if (!Array.isArray(declarations)) return;
	return declarations.filter((declaration) => isCodeModePayloadToolName(readPayloadToolName(declaration)));
}
function filterCodeModeGroupedToolDeclarations(tool) {
	if (!tool || typeof tool !== "object" || Array.isArray(tool)) return;
	const record = tool;
	const filteredGroups = {};
	for (const key of ["functionDeclarations", "function_declarations"]) {
		const filtered = filterCodeModeToolDeclarations(readPayloadToolField(record, key));
		if (filtered === void 0) continue;
		if (filtered.length > 0) filteredGroups[key] = filtered;
	}
	return Object.keys(filteredGroups).length > 0 ? filteredGroups : void 0;
}
function filterCodeModePayloadTools(payload) {
	if (!payload || typeof payload !== "object") return;
	const record = payload;
	if (!Array.isArray(record.tools)) return;
	record.tools = record.tools.flatMap((tool) => {
		if (isCodeModePayloadToolName(readPayloadToolName(tool))) return [tool];
		const grouped = filterCodeModeGroupedToolDeclarations(tool);
		return grouped ? [grouped] : [];
	});
}
function filterCodeModePayloadHookResult(payload, nextPayload) {
	const finalPayload = nextPayload === void 0 ? payload : nextPayload;
	filterCodeModePayloadTools(finalPayload);
	return nextPayload === void 0 ? void 0 : finalPayload;
}
function hasCodeModeVisibleTools(context) {
	if (!Array.isArray(context.tools)) return false;
	const names = new Set(context.tools.map(readPayloadToolName).filter(Boolean));
	return names.has("exec") && names.has("wait");
}
function shouldFlattenOpenAICompletionMessages(model) {
	const compat = model.compat && typeof model.compat === "object" ? model.compat : void 0;
	return model.api === "openai-completions" && compat?.requiresStringContent === true;
}
function shouldStripOpenAICompletionTools(model) {
	const compat = model.compat && typeof model.compat === "object" ? model.compat : void 0;
	return model.api === "openai-completions" && compat?.supportsTools === false;
}
function shouldStripOpenAICompletionMessageKeys(model) {
	const compat = model.compat && typeof model.compat === "object" ? model.compat : void 0;
	return model.api === "openai-completions" && compat?.strictMessageKeys === true;
}
/** @deprecated OpenAI provider-owned stream helper; do not use from third-party plugins. */
function createOpenAIResponsesContextManagementWrapper(baseStreamFn, extraParams) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		const policy = require_openai_transport_stream.resolveOpenAIResponsesPayloadPolicy(model, {
			extraParams,
			enablePromptCacheStripping: true,
			enableServerCompaction: true,
			storeMode: "provider-policy"
		});
		if (policy.explicitStore === void 0 && !policy.useServerCompaction && !policy.shouldStripStore && !policy.shouldStripPromptCache && !policy.shouldStripDisabledReasoningPayload) return underlying(model, context, options);
		const originalOnPayload = options?.onPayload;
		const replayResponsesItemIds = (policy.shouldStripStore ? false : policy.explicitStore) ?? options?.replayResponsesItemIds;
		const nextOptions = {
			...options,
			...replayResponsesItemIds === void 0 ? {} : { replayResponsesItemIds },
			onPayload: (payload) => {
				if (payload && typeof payload === "object") require_openai_transport_stream.applyOpenAIResponsesPayloadPolicy(payload, policy);
				return originalOnPayload?.(payload, model);
			}
		};
		return underlying(model, context, nextOptions);
	};
}
/** @deprecated OpenAI provider-owned stream helper; do not use from third-party plugins. */
function createOpenAIStringContentWrapper(baseStreamFn) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if (!shouldFlattenOpenAICompletionMessages(model)) return underlying(model, context, options);
		return require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
			if (!Array.isArray(payloadObj.messages)) return;
			payloadObj.messages = require_openai_transport_stream.flattenCompletionMessagesToStringContent(payloadObj.messages);
		});
	};
}
/** @deprecated OpenAI provider-owned stream helper; do not use from third-party plugins. */
function createOpenAICompletionsStrictMessageKeysWrapper(baseStreamFn) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if (!shouldStripOpenAICompletionMessageKeys(model)) return underlying(model, context, options);
		return require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
			if (!Array.isArray(payloadObj.messages)) return;
			payloadObj.messages = require_openai_transport_stream.stripCompletionMessagesToRoleContent(payloadObj.messages);
		});
	};
}
/** @deprecated OpenAI provider-owned stream helper; do not use from third-party plugins. */
function createOpenAICompletionsToolsCompatWrapper(baseStreamFn) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if (!shouldStripOpenAICompletionTools(model)) return underlying(model, context, options);
		return require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
			delete payloadObj.tools;
			delete payloadObj.tool_choice;
			delete payloadObj.parallel_tool_calls;
		});
	};
}
/** @deprecated OpenAI Codex provider-owned stream helper; do not use from third-party plugins. */
function createCodexNativeWebSearchWrapper(baseStreamFn, params) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if ((params.codeModeToolSurfaceEnabled === true || isCodeModeEnabled(params.config)) && hasCodeModeVisibleTools(context)) {
			require_session_transcript_repair.emitModelTransportDebug(log, `skipping Codex native web search because code mode owns the model tool surface for ${model.provider ?? "unknown"}/${model.id ?? "unknown"}`);
			const originalOnPayload = options?.onPayload;
			const codeModeOptions = {
				...options,
				operatorCodeModeToolSurface: true,
				onPayload: (payload) => {
					filterCodeModePayloadTools(payload);
					const nextPayload = originalOnPayload?.(payload, model);
					if (isPromiseLike(nextPayload)) return Promise.resolve(nextPayload).then((resolvedPayload) => filterCodeModePayloadHookResult(payload, resolvedPayload));
					return filterCodeModePayloadHookResult(payload, nextPayload);
				}
			};
			return underlying(model, context, codeModeOptions);
		}
		if (params.nativeWebSearchAllowedByToolPolicy === false) {
			log.debug(`skipping Codex native web search (tool_policy_denied) for ${model.provider ?? "unknown"}/${model.id ?? "unknown"}`);
			return underlying(model, context, options);
		}
		const activation = require_codex_native_web_search_core.resolveCodexNativeSearchActivation({
			config: params.config,
			modelProvider: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(model.provider),
			modelApi: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(model.api),
			modelId: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(model.id),
			agentId: params.agentId,
			sessionKey: params.sessionKey,
			sandboxToolPolicy: params.sandboxToolPolicy,
			messageProvider: params.messageProvider,
			agentAccountId: params.agentAccountId,
			groupId: params.groupId,
			groupChannel: params.groupChannel,
			groupSpace: params.groupSpace,
			spawnedBy: params.spawnedBy,
			senderId: params.senderId,
			senderName: params.senderName,
			senderUsername: params.senderUsername,
			senderE164: params.senderE164,
			agentDir: params.agentDir
		});
		if (activation.state !== "native_active") {
			if (activation.codexNativeEnabled) log.debug(`skipping Codex native web search (${activation.inactiveReason ?? "inactive"}) for ${model.provider ?? "unknown"}/${model.id ?? "unknown"}`);
			return underlying(model, context, options);
		}
		log.debug(`activating Codex native web search (${activation.codexMode}) for ${model.provider ?? "unknown"}/${model.id ?? "unknown"}`);
		const originalOnPayload = options?.onPayload;
		return underlying(model, context, {
			...options,
			onPayload: (payload) => {
				const result = require_codex_native_web_search_core.patchCodexNativeWebSearchPayload({
					payload,
					config: params.config
				});
				if (result.status === "payload_not_object") log.debug("Skipping Codex native web search injection because provider payload is not an object");
				else if (result.status === "native_tool_already_present") log.debug("Codex native web search tool already present in provider payload");
				else if (result.status === "injected") log.debug("Injected Codex native web search tool into provider payload");
				return originalOnPayload?.(payload, model);
			}
		});
	};
}
//#endregion
//#region src/llm/providers/stream-wrappers/minimax.ts
function isMinimaxAnthropicMessagesModel(model) {
	return model.api === "anthropic-messages" && (model.provider === "minimax" || model.provider === "minimax-portal");
}
/**
* MiniMax-M3 (and any forward-compatible MiniMax-M3.x successor) emits proper
* Anthropic-shape thinking blocks (`content_block_start` with `type:"thinking"`
* + `thinking_delta`) and **requires** thinking to be active to produce any
* visible text. Pinning `thinking: { type: "disabled" }` on M3 makes the model
* return an empty content array with `stop_reason: "end_turn"` and 1 output
* token, observed against `https://api.minimax.io/anthropic/v1/messages`.
*
* The legacy MiniMax-M2.x family still needs the disable-thinking shim
* because their Anthropic-compat streams leak `reasoning_content` in
* OpenAI-style deltas (see {@link createMinimaxThinkingDisabledWrapper}).
*/
function isMinimaxModelRequiringThinking(model) {
	const modelId = typeof model.id === "string" ? model.id.trim() : "";
	return /^MiniMax-M3(\b|[-.])/i.test(modelId);
}
function isDisabledThinkingPayload(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) && value.type === "disabled";
}
function isEnabledThinkingPayload(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) && value.type === "enabled";
}
function resolvePositiveMaxTokens(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : void 0;
}
/**
* Legacy MiniMax (M2.x) Anthropic-compatible streaming endpoint returns
* reasoning_content in OpenAI-style delta chunks ({delta: {content: "",
* reasoning_content: "..."}}) rather than the native Anthropic thinking
* block format. The shared Anthropic provider cannot process this format
* and leaks the reasoning text as visible content. Disable thinking in the
* outgoing payload so MiniMax does not produce reasoning_content deltas
* during streaming.
*
* Skipped for MiniMax-M3 and M3.x, which emit proper Anthropic-shape thinking
* blocks and require thinking enabled to produce any visible content.
* The Anthropic transport builds `thinking: { type: "disabled" }` when no
* resolved thinking level exists, so M3 removes that implicit disabled payload.
* See {@link isMinimaxModelRequiringThinking}.
*/
function createMinimaxThinkingDisabledWrapper(baseStreamFn, thinkingLevel) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if (!isMinimaxAnthropicMessagesModel(model)) return underlying(model, context, options);
		const requiresThinking = isMinimaxModelRequiringThinking(model);
		const originalOnPayload = options?.onPayload;
		return underlying(model, context, {
			...options,
			onPayload: (payload) => {
				if (payload && typeof payload === "object") {
					const payloadObj = payload;
					if (requiresThinking) {
						if (thinkingLevel === void 0 && isDisabledThinkingPayload(payloadObj.thinking)) delete payloadObj.thinking;
						else if (thinkingLevel !== "off" && (isEnabledThinkingPayload(payloadObj.thinking) || isDisabledThinkingPayload(payloadObj.thinking))) {
							payloadObj.thinking = { type: "adaptive" };
							const maxTokens = resolvePositiveMaxTokens(options?.maxTokens);
							if (maxTokens !== void 0) payloadObj.max_tokens = maxTokens;
						}
					}
					if (!requiresThinking && payloadObj.thinking === void 0) payloadObj.thinking = { type: "disabled" };
				}
				return originalOnPayload?.(payload, model);
			}
		});
	};
}
//#endregion
//#region src/llm/providers/stream-wrappers/moonshot.ts
/** Detects SiliconFlow Pro models that require thinking=null instead of thinking="off". */
function shouldApplySiliconFlowThinkingOffCompat(params) {
	return params.provider === "siliconflow" && params.thinkingLevel === "off" && params.modelId.startsWith("Pro/");
}
/** Wraps Moonshot-compatible requests to rewrite SiliconFlow thinking-off payloads. */
function createSiliconFlowThinkingWrapper(baseStreamFn) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
		if (payloadObj.thinking === "off") payloadObj.thinking = null;
	});
}
//#endregion
//#region src/llm/providers/stream-wrappers/proxy.ts
/** @deprecated OpenRouter provider-owned stream helper; do not use from third-party plugins. */
function createOpenRouterSystemCacheWrapper(baseStreamFn, extraParams) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(model.provider);
		const modelId = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(model.id);
		const endpointClass = require_provider_attribution.resolveProviderRequestPolicy({
			provider,
			api: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(model.api),
			baseUrl: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(model.baseUrl),
			capability: "llm",
			transport: "stream"
		}).endpointClass;
		if (!modelId || !isAnthropicModelRef(modelId) || !(endpointClass === "openrouter" || endpointClass === "default" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider) === "openrouter")) return underlying(model, context, options);
		const cacheRetention = readCacheRetention(options?.cacheRetention) ?? readCacheRetention(extraParams?.cacheRetention);
		return require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, stripCacheRetentionOption(options), (payloadObj) => {
			require_openai_transport_stream.applyAnthropicEphemeralCacheControlMarkers(payloadObj, require_openai_transport_stream.resolveAnthropicEphemeralCacheControl((0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(model.baseUrl), cacheRetention) ?? null);
		});
	};
}
function readCacheRetention(value) {
	return value === "long" || value === "none" || value === "short" ? value : void 0;
}
function stripCacheRetentionOption(options) {
	if (!options || !Object.hasOwn(options, "cacheRetention")) return options;
	const { cacheRetention: _cacheRetention, ...rest } = options;
	return rest;
}
//#endregion
//#region src/agents/provider-api-families.ts
/**
* Small API-family predicates used when constructing provider payloads. The
* sets here encode transport-level compatibility, not provider identity.
*/
const GPT_PARALLEL_TOOL_CALLS_APIS = /* @__PURE__ */ new Set([
	"openai-completions",
	"openai-responses",
	"openai-chatgpt-responses",
	"azure-openai-responses"
]);
/** True when a provider API accepts GPT parallel-tool-call payload settings. */
function supportsGptParallelToolCallsPayload(api) {
	return typeof api === "string" && GPT_PARALLEL_TOOL_CALLS_APIS.has(api);
}
//#endregion
//#region src/agents/embedded-agent-runner/extra-params.ts
const defaultProviderRuntimeDeps = {
	prepareProviderExtraParams: require_provider_hook_runtime.prepareProviderExtraParams,
	resolveProviderExtraParamsForTransport: require_provider_hook_runtime.resolveProviderExtraParamsForTransport,
	wrapProviderStreamFn: require_provider_hook_runtime.wrapProviderStreamFn
};
const providerRuntimeDeps = { ...defaultProviderRuntimeDeps };
let preparedExtraParamsCache = /* @__PURE__ */ new WeakMap();
const REQUEST_SCOPED_EXTRA_PARAM_KEYS = /* @__PURE__ */ new Set([
	"response_format",
	"responseFormat",
	"stop"
]);
const testing = {
	setProviderRuntimeDepsForTest(deps) {
		providerRuntimeDeps.prepareProviderExtraParams = deps?.prepareProviderExtraParams ?? defaultProviderRuntimeDeps.prepareProviderExtraParams;
		providerRuntimeDeps.resolveProviderExtraParamsForTransport = deps?.resolveProviderExtraParamsForTransport ?? defaultProviderRuntimeDeps.resolveProviderExtraParamsForTransport;
		providerRuntimeDeps.wrapProviderStreamFn = deps?.wrapProviderStreamFn ?? defaultProviderRuntimeDeps.wrapProviderStreamFn;
	},
	resetProviderRuntimeDepsForTest() {
		clearPreparedExtraParamsCache();
		providerRuntimeDeps.prepareProviderExtraParams = defaultProviderRuntimeDeps.prepareProviderExtraParams;
		providerRuntimeDeps.resolveProviderExtraParamsForTransport = defaultProviderRuntimeDeps.resolveProviderExtraParamsForTransport;
		providerRuntimeDeps.wrapProviderStreamFn = defaultProviderRuntimeDeps.wrapProviderStreamFn;
	}
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.extraParamsTestApi")] = testing;
/**
* Resolve provider-specific extra params from model config.
* Used to pass through stream params like temperature/maxTokens.
*
* @internal Exported for testing only
*/
function resolveExtraParams(params) {
	const { defaultParams, modelParams, agentParams } = require_openai_routing.resolveModelExtraParamSources({
		config: params.cfg,
		provider: params.provider,
		modelId: params.modelId,
		agentId: params.agentId
	});
	const globalParams = modelParams ? { ...modelParams } : void 0;
	const merged = Object.assign({}, defaultParams, globalParams, agentParams);
	const resolvedParallelToolCalls = resolveAliasedParamValue([
		defaultParams,
		globalParams,
		agentParams
	], "parallel_tool_calls", "parallelToolCalls");
	if (resolvedParallelToolCalls !== void 0) {
		merged.parallel_tool_calls = resolvedParallelToolCalls;
		delete merged.parallelToolCalls;
	}
	const resolvedTextVerbosity = resolveAliasedParamValue([globalParams, agentParams], "text_verbosity", "textVerbosity");
	if (resolvedTextVerbosity !== void 0) {
		merged.text_verbosity = resolvedTextVerbosity;
		delete merged.textVerbosity;
	}
	const resolvedResponseFormat = resolveAliasedParamValue([
		defaultParams,
		globalParams,
		agentParams
	], "response_format", "responseFormat");
	if (resolvedResponseFormat !== void 0) {
		merged.response_format = resolvedResponseFormat;
		delete merged.responseFormat;
	}
	require_openai_transport_stream.canonicalizeMaxTokensParam({
		merged,
		sources: [
			defaultParams,
			globalParams,
			agentParams
		]
	});
	const resolvedCachedContent = resolveAliasedParamValue([
		defaultParams,
		globalParams,
		agentParams
	], "cached_content", "cachedContent");
	if (resolvedCachedContent !== void 0) {
		merged.cachedContent = resolvedCachedContent;
		delete merged.cached_content;
	}
	if (params.provider === "openrouter") canonicalizeOpenRouterResponseCacheParams(merged, [
		defaultParams,
		globalParams,
		agentParams
	]);
	applyDefaultOpenAIGptRuntimeParams(params, merged);
	return Object.keys(merged).length > 0 ? merged : void 0;
}
function resolveSupportedTransport(value) {
	return value === "sse" || value === "websocket" || value === "auto" ? value : void 0;
}
function hasExplicitTransportSetting(settings) {
	return Object.hasOwn(settings, "transport");
}
function clearPreparedExtraParamsCache() {
	preparedExtraParamsCache = /* @__PURE__ */ new WeakMap();
}
function fingerprintPreparedExtraParamsModel(model) {
	if (!model) return null;
	const record = model;
	return {
		api: model.api,
		provider: model.provider,
		id: model.id,
		name: model.name,
		baseUrl: model.baseUrl,
		reasoning: model.reasoning,
		input: model.input,
		cost: model.cost,
		compat: record.compat ?? null,
		contextWindow: model.contextWindow,
		contextTokens: model.contextTokens ?? null,
		headers: record.headers ?? null,
		maxTokens: model.maxTokens,
		params: model.params ?? null,
		requestTimeoutMs: model.requestTimeoutMs ?? null
	};
}
function resolvePreparedExtraParamsCacheKey(params) {
	return JSON.stringify({
		provider: params.provider,
		modelId: params.modelId,
		agentId: params.agentId ?? "",
		agentDir: params.agentDir ?? "",
		workspaceDir: params.workspaceDir ?? "",
		thinkingLevel: params.thinkingLevel ?? "",
		resolvedTransport: params.resolvedTransport ?? "",
		extraParamsOverride: stripRequestScopedExtraParams(sanitizeExtraParamsRecord(params.extraParamsOverride)) ?? null,
		resolvedExtraParams: params.resolvedExtraParams ?? null,
		model: fingerprintPreparedExtraParamsModel(params.model)
	});
}
function resolvePreparedExtraParams(params) {
	const resolvedExtraParams = params.resolvedExtraParams ?? resolveExtraParams({
		cfg: params.cfg,
		provider: params.provider,
		modelId: params.modelId,
		agentId: params.agentId
	});
	const override = params.extraParamsOverride && Object.keys(params.extraParamsOverride).length > 0 ? stripRequestScopedExtraParams(sanitizeExtraParamsRecord(Object.fromEntries(Object.entries(params.extraParamsOverride).filter(([, value]) => value !== void 0)))) : void 0;
	const merged = {
		...sanitizeExtraParamsRecord(resolvedExtraParams),
		...override
	};
	require_openai_transport_stream.canonicalizeMaxTokensParam({
		merged,
		sources: [resolvedExtraParams, override]
	});
	const resolvedCachedContent = resolveAliasedParamValue([resolvedExtraParams, override], "cached_content", "cachedContent");
	if (resolvedCachedContent !== void 0) {
		merged.cachedContent = resolvedCachedContent;
		delete merged.cached_content;
	}
	if (params.provider === "openrouter") canonicalizeOpenRouterResponseCacheParams(merged, [resolvedExtraParams, override]);
	const cfg = params.cfg;
	const cacheKey = cfg && !hasFunctionExtraParamValue(params.extraParamsOverride) ? resolvePreparedExtraParamsCacheKey(params) : void 0;
	if (cacheKey) {
		const cached = preparedExtraParamsCache.get(cfg)?.get(cacheKey);
		if (cached) return cached;
	}
	const prepared = providerRuntimeDeps.prepareProviderExtraParams({
		provider: params.provider,
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		runtimeHandle: params.providerRuntimeHandle,
		context: {
			config: params.cfg,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			provider: params.provider,
			modelId: params.modelId,
			model: params.model,
			extraParams: merged,
			thinkingLevel: params.thinkingLevel
		}
	}) ?? merged;
	const transportPatch = providerRuntimeDeps.resolveProviderExtraParamsForTransport({
		provider: params.provider,
		config: params.cfg,
		workspaceDir: params.workspaceDir,
		runtimeHandle: params.providerRuntimeHandle,
		context: {
			config: params.cfg,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			provider: params.provider,
			modelId: params.modelId,
			extraParams: prepared,
			thinkingLevel: params.thinkingLevel,
			model: params.model,
			transport: params.resolvedTransport ?? resolveSupportedTransport(prepared.transport)
		}
	})?.patch;
	const result = transportPatch ? {
		...prepared,
		...transportPatch
	} : prepared;
	require_openai_transport_stream.canonicalizeMaxTokensParam({
		merged: result,
		sources: [prepared, transportPatch ?? void 0]
	});
	if (cacheKey) {
		let bucket = preparedExtraParamsCache.get(cfg);
		if (!bucket) {
			bucket = /* @__PURE__ */ new Map();
			preparedExtraParamsCache.set(cfg, bucket);
		}
		bucket.set(cacheKey, result);
	}
	return result;
}
function sanitizeExtraParamsRecord(value) {
	if (!value) return;
	return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "__proto__" && key !== "prototype" && key !== "constructor"));
}
function stripRequestScopedExtraParams(value) {
	if (!value) return;
	const filtered = Object.fromEntries(Object.entries(value).filter(([key]) => !REQUEST_SCOPED_EXTRA_PARAM_KEYS.has(key)));
	return Object.keys(filtered).length > 0 ? filtered : void 0;
}
function hasRequestScopedExtraParams(value) {
	if (!value) return false;
	return [...REQUEST_SCOPED_EXTRA_PARAM_KEYS].some((key) => Object.hasOwn(value, key));
}
function hasFunctionExtraParamValue(value) {
	return Boolean(value && Object.values(value).some((item) => typeof item === "function"));
}
function shouldApplyDefaultOpenAIGptRuntimeParams(params) {
	if (params.provider !== "openai") return false;
	return /^gpt-5(?:[.-]|$)/i.test(params.modelId);
}
function applyDefaultOpenAIGptRuntimeParams(params, merged) {
	if (!shouldApplyDefaultOpenAIGptRuntimeParams(params)) return;
	if (!Object.hasOwn(merged, "parallel_tool_calls") && !Object.hasOwn(merged, "parallelToolCalls")) merged.parallel_tool_calls = true;
	if (!Object.hasOwn(merged, "text_verbosity") && !Object.hasOwn(merged, "textVerbosity")) merged.text_verbosity = "low";
}
function resolveAgentTransportOverride(params) {
	const globalSettings = params.settingsManager.getGlobalSettings();
	const projectSettings = params.settingsManager.getProjectSettings();
	if (hasExplicitTransportSetting(globalSettings) || hasExplicitTransportSetting(projectSettings)) return;
	return resolveSupportedTransport(params.effectiveExtraParams?.transport);
}
function resolveExplicitSettingsTransport(params) {
	const globalSettings = params.settingsManager.getGlobalSettings();
	const projectSettings = params.settingsManager.getProjectSettings();
	if (!hasExplicitTransportSetting(globalSettings) && !hasExplicitTransportSetting(projectSettings)) return;
	return resolveSupportedTransport(params.sessionTransport);
}
function normalizeStopSequences(value) {
	const list = typeof value === "string" ? [value] : Array.isArray(value) ? value : void 0;
	if (!list) return;
	const sequences = list.filter((item) => typeof item === "string" && item.length > 0);
	return sequences.length > 0 ? sequences : void 0;
}
function createStreamFnWithExtraParams(baseStreamFn, extraParams, provider, model) {
	if (!extraParams || Object.keys(extraParams).length === 0) return;
	if (Object.hasOwn(extraParams, "cacheRetention") && parseCacheRetention(extraParams.cacheRetention) === void 0) require_logger.log.warn("ignoring invalid cacheRetention param; expected \"none\", \"short\", or \"long\"");
	const streamParams = {};
	if (typeof extraParams.temperature === "number") streamParams.temperature = extraParams.temperature;
	if (typeof extraParams.topP === "number") streamParams.topP = extraParams.topP;
	const maxTokens = require_openai_transport_stream.resolveMaxTokensParam(extraParams);
	if (maxTokens !== void 0) streamParams.maxTokens = maxTokens;
	const resolvedResponseFormat = resolveAliasedParamValue([extraParams], "response_format", "responseFormat");
	if (resolvedResponseFormat && typeof resolvedResponseFormat === "object" && !Array.isArray(resolvedResponseFormat)) streamParams.responseFormat = resolvedResponseFormat;
	const transport = resolveSupportedTransport(extraParams.transport);
	if (transport) streamParams.transport = transport;
	else if (extraParams.transport != null) {
		const transportSummary = typeof extraParams.transport === "string" ? extraParams.transport : typeof extraParams.transport;
		require_logger.log.warn(`ignoring invalid transport param: ${transportSummary}`);
	}
	const cachedContent = typeof extraParams.cachedContent === "string" ? extraParams.cachedContent : typeof extraParams.cached_content === "string" ? extraParams.cached_content : void 0;
	if (typeof cachedContent === "string" && cachedContent.trim()) streamParams.cachedContent = cachedContent.trim();
	const resolvedFrequencyPenalty = resolveAliasedParamValueFromKeys([extraParams], ["frequencyPenalty", "frequency_penalty"]);
	const resolvedPresencePenalty = resolveAliasedParamValueFromKeys([extraParams], ["presencePenalty", "presence_penalty"]);
	const resolvedSeed = extraParams.seed;
	if (typeof resolvedFrequencyPenalty === "number") streamParams.frequencyPenalty = resolvedFrequencyPenalty;
	if (typeof resolvedPresencePenalty === "number") streamParams.presencePenalty = resolvedPresencePenalty;
	if (typeof resolvedSeed === "number") streamParams.seed = resolvedSeed;
	const resolvedStop = normalizeStopSequences(extraParams.stop);
	if (resolvedStop) streamParams.stop = resolvedStop;
	const readSupportsPromptCacheKey = (m) => {
		const compat = m?.compat;
		if (!compat || typeof compat !== "object") return false;
		return compat.supportsPromptCacheKey === true;
	};
	const initialCacheRetention = resolveCacheRetention(extraParams, provider, typeof model?.api === "string" ? model.api : void 0, typeof model?.id === "string" ? model.id : void 0, readSupportsPromptCacheKey(model));
	if (Object.keys(streamParams).length > 0 || initialCacheRetention) {
		const debugParams = initialCacheRetention ? {
			...streamParams,
			cacheRetention: initialCacheRetention
		} : streamParams;
		require_logger.log.debug(`creating streamFn wrapper with params: ${JSON.stringify(debugParams)}`);
	}
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	const wrappedStreamFn = (callModel, context, options) => {
		const cacheRetention = resolveCacheRetention(extraParams, provider, typeof callModel.api === "string" ? callModel.api : void 0, typeof callModel.id === "string" ? callModel.id : void 0, readSupportsPromptCacheKey(callModel));
		if (Object.keys(streamParams).length === 0 && !cacheRetention) return underlying(callModel, context, options);
		const effectiveCacheRetention = options?.cacheRetention ?? cacheRetention;
		return underlying(callModel, context, {
			...streamParams,
			...options,
			...effectiveCacheRetention ? { cacheRetention: effectiveCacheRetention } : {}
		});
	};
	return wrappedStreamFn;
}
function resolveAliasedParamValue(sources, snakeCaseKey, camelCaseKey) {
	return resolveAliasedParamValueFromKeys(sources, [snakeCaseKey, camelCaseKey]);
}
function resolveAliasedParamValueFromKeys(sources, keys) {
	let resolved;
	let seen = false;
	for (const source of sources) {
		if (!source) continue;
		for (const key of keys) {
			if (!Object.hasOwn(source, key)) continue;
			resolved = source[key];
			seen = true;
			break;
		}
	}
	return seen ? resolved : void 0;
}
function applyCanonicalAliasedParamValue(params) {
	const resolved = resolveAliasedParamValueFromKeys(params.sources, params.keys);
	if (resolved === void 0) return;
	for (const key of params.keys) delete params.merged[key];
	params.merged[params.canonicalKey] = resolved;
}
function canonicalizeOpenRouterResponseCacheParams(merged, sources) {
	applyCanonicalAliasedParamValue({
		merged,
		sources,
		keys: ["responseCache", "response_cache"],
		canonicalKey: "responseCache"
	});
	applyCanonicalAliasedParamValue({
		merged,
		sources,
		keys: [
			"responseCacheTtlSeconds",
			"response_cache_ttl_seconds",
			"responseCacheTtl",
			"response_cache_ttl"
		],
		canonicalKey: "responseCacheTtlSeconds"
	});
	applyCanonicalAliasedParamValue({
		merged,
		sources,
		keys: ["responseCacheClear", "response_cache_clear"],
		canonicalKey: "responseCacheClear"
	});
}
function createParallelToolCallsWrapper(baseStreamFn, enabled) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if (!supportsGptParallelToolCallsPayload(model.api)) return underlying(model, context, options);
		require_logger.log.debug(`applying parallel_tool_calls=${enabled} for ${model.provider ?? "unknown"}/${model.id ?? "unknown"} api=${model.api}`);
		return require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
			payloadObj.parallel_tool_calls = enabled;
		});
	};
}
function shouldStripOpenAICompletionsStore(model) {
	if (model.api !== "openai-completions") return false;
	const compat = model.compat && typeof model.compat === "object" ? model.compat : void 0;
	return !require_provider_request_config.resolveProviderRequestPolicyConfig({
		provider: typeof model.provider === "string" ? model.provider : void 0,
		api: model.api,
		baseUrl: typeof model.baseUrl === "string" ? model.baseUrl : void 0,
		compat,
		capability: "llm",
		transport: "stream"
	}).capabilities.usesKnownNativeOpenAIRoute;
}
function createOpenAICompletionsStoreCompatWrapper(baseStreamFn) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if (!shouldStripOpenAICompletionsStore(model)) return underlying(model, context, options);
		return require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
			delete payloadObj.store;
		});
	};
}
function sanitizeExtraBodyRecord(value) {
	return Object.fromEntries(Object.entries(sanitizeExtraParamsRecord(value) ?? {}).filter(([, entry]) => entry !== void 0));
}
function resolveExtraBodyParam(rawExtraBody) {
	if (rawExtraBody === void 0 || rawExtraBody === null) return;
	if (typeof rawExtraBody !== "object" || Array.isArray(rawExtraBody)) {
		const summary = typeof rawExtraBody === "string" ? rawExtraBody : typeof rawExtraBody;
		require_logger.log.warn(`ignoring invalid extra_body param: ${summary}`);
		return;
	}
	const extraBody = sanitizeExtraBodyRecord(rawExtraBody);
	return Object.keys(extraBody).length > 0 ? extraBody : void 0;
}
function resolveChatTemplateKwargsParam(rawChatTemplateKwargs) {
	if (rawChatTemplateKwargs === void 0 || rawChatTemplateKwargs === null) return;
	if (typeof rawChatTemplateKwargs !== "object" || Array.isArray(rawChatTemplateKwargs)) {
		const summary = typeof rawChatTemplateKwargs === "string" ? rawChatTemplateKwargs : typeof rawChatTemplateKwargs;
		require_logger.log.warn(`ignoring invalid chat_template_kwargs param: ${summary}`);
		return;
	}
	const chatTemplateKwargs = sanitizeExtraBodyRecord(rawChatTemplateKwargs);
	return Object.keys(chatTemplateKwargs).length > 0 ? chatTemplateKwargs : void 0;
}
function createOpenAICompletionsChatTemplateKwargsWrapper(params) {
	const underlying = params.baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if (model.api !== "openai-completions") return underlying(model, context, options);
		return require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
			const existing = payloadObj.chat_template_kwargs;
			if (existing && typeof existing === "object" && !Array.isArray(existing)) {
				payloadObj.chat_template_kwargs = {
					...existing,
					...params.configured
				};
				return;
			}
			payloadObj.chat_template_kwargs = params.configured;
		});
	};
}
function createOpenAICompletionsExtraBodyWrapper(baseStreamFn, extraBody) {
	const underlying = baseStreamFn ?? _gabrielvfonseca_ai_internal_runtime.streamSimple;
	return (model, context, options) => {
		if (model.api !== "openai-completions") return underlying(model, context, options);
		return require_openai_transport_stream.streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
			const collisions = Object.keys(extraBody).filter((key) => Object.hasOwn(payloadObj, key));
			if (collisions.length > 0) require_logger.log.warn(`extra_body overwriting request payload keys: ${collisions.join(", ")}`);
			Object.assign(payloadObj, extraBody);
		});
	};
}
function applyPrePluginStreamWrappers(ctx) {
	const baseExtraParams = ctx.override && hasRequestScopedExtraParams(ctx.override) ? stripRequestScopedExtraParams(ctx.effectiveExtraParams) : ctx.effectiveExtraParams;
	const streamParams = ctx.override ? {
		...baseExtraParams,
		...ctx.override
	} : baseExtraParams;
	const wrappedStreamFn = createStreamFnWithExtraParams(ctx.agent.streamFn, streamParams, ctx.provider, ctx.model);
	if (wrappedStreamFn) {
		require_logger.log.debug(`applying extraParams to agent streamFn for ${ctx.provider}/${ctx.modelId}`);
		ctx.agent.streamFn = wrappedStreamFn;
	}
	if (shouldApplySiliconFlowThinkingOffCompat({
		provider: ctx.provider,
		modelId: ctx.modelId,
		thinkingLevel: ctx.thinkingLevel
	})) {
		require_logger.log.debug(`normalizing thinking=off to thinking=null for SiliconFlow compatibility (${ctx.provider}/${ctx.modelId})`);
		ctx.agent.streamFn = createSiliconFlowThinkingWrapper(ctx.agent.streamFn);
	}
}
function applyPostPluginStreamWrappers(ctx) {
	const streamParams = ctx.override ? {
		...ctx.effectiveExtraParams,
		...ctx.override
	} : ctx.effectiveExtraParams;
	ctx.agent.streamFn = createOpenRouterSystemCacheWrapper(ctx.agent.streamFn, streamParams);
	ctx.agent.streamFn = createOpenAIStringContentWrapper(ctx.agent.streamFn);
	ctx.agent.streamFn = createOpenAICompletionsStrictMessageKeysWrapper(ctx.agent.streamFn);
	ctx.agent.streamFn = createOpenAICompletionsToolsCompatWrapper(ctx.agent.streamFn);
	if (!ctx.providerWrapperHandled) {
		ctx.agent.streamFn = require_openai_transport_stream.createDeepSeekV4OpenAICompatibleThinkingWrapper({
			baseStreamFn: ctx.agent.streamFn,
			thinkingLevel: ctx.thinkingLevel,
			shouldPatchModel: (model) => isDeepSeekV4OpenAICompatibleModel(model) && deepSeekV4NativeThinkingAllowedByCompat(model)
		});
		ctx.agent.streamFn = createDeepSeekV4NonNativeCompatSanitizerWrapper(ctx.agent.streamFn);
		ctx.agent.streamFn = require_openai_transport_stream.createDeepSeekV4OpenAICompatibleThinkingWrapper({
			baseStreamFn: ctx.agent.streamFn,
			thinkingLevel: ctx.thinkingLevel,
			shouldPatchModel: isMiMoReasoningOpenAICompatibleModel
		});
		ctx.agent.streamFn = require_openai_transport_stream.createThinkingOnlyFinalTextWrapper({
			baseStreamFn: ctx.agent.streamFn,
			shouldPatchModel: isMiMoReasoningAsVisibleTextOpenAICompatibleModel
		});
		ctx.agent.streamFn = require_openai_transport_stream.createGoogleThinkingPayloadWrapper(ctx.agent.streamFn, ctx.thinkingLevel);
		ctx.agent.streamFn = createOpenAIResponsesContextManagementWrapper(ctx.agent.streamFn, ctx.effectiveExtraParams);
	}
	ctx.agent.streamFn = createMinimaxThinkingDisabledWrapper(ctx.agent.streamFn, ctx.thinkingLevel);
	const configuredChatTemplateKwargs = resolveChatTemplateKwargsParam(resolveAliasedParamValue([ctx.effectiveExtraParams, ctx.override], "chat_template_kwargs", "chatTemplateKwargs"));
	if (configuredChatTemplateKwargs) ctx.agent.streamFn = createOpenAICompletionsChatTemplateKwargsWrapper({
		baseStreamFn: ctx.agent.streamFn,
		configured: configuredChatTemplateKwargs
	});
	const extraBody = resolveExtraBodyParam(resolveAliasedParamValue([ctx.effectiveExtraParams, ctx.override], "extra_body", "extraBody"));
	if (extraBody) ctx.agent.streamFn = createOpenAICompletionsExtraBodyWrapper(ctx.agent.streamFn, extraBody);
	ctx.agent.streamFn = createOpenAICompletionsStoreCompatWrapper(ctx.agent.streamFn);
	const rawParallelToolCalls = resolveAliasedParamValue([ctx.effectiveExtraParams, ctx.override], "parallel_tool_calls", "parallelToolCalls");
	if (rawParallelToolCalls === void 0) return;
	if (typeof rawParallelToolCalls === "boolean") {
		ctx.agent.streamFn = createParallelToolCallsWrapper(ctx.agent.streamFn, rawParallelToolCalls);
		return;
	}
	if (rawParallelToolCalls === null) {
		require_logger.log.debug("parallel_tool_calls suppressed by null override, skipping injection");
		return;
	}
	const summary = typeof rawParallelToolCalls === "string" ? rawParallelToolCalls : typeof rawParallelToolCalls;
	require_logger.log.warn(`ignoring invalid parallel_tool_calls param: ${summary}`);
}
function normalizeDeepSeekV4CandidateId(modelId) {
	if (typeof modelId !== "string") return;
	const normalized = modelId.trim().toLowerCase();
	const suffixIndex = normalized.indexOf(":");
	return (suffixIndex === -1 ? normalized : normalized.slice(0, suffixIndex)).split("/").pop();
}
function isDeepSeekV4OpenAICompatibleModel(model) {
	return isDeepSeekV4OpenAICompletionsModel(model) && !isMicrosoftFoundryProviderId(model.provider);
}
function isDeepSeekV4OpenAICompletionsModel(model) {
	const normalizedModelId = normalizeDeepSeekV4CandidateId(model.id);
	return model.api === "openai-completions" && (normalizedModelId === "deepseek-v4-flash" || normalizedModelId === "deepseek-v4-pro");
}
function isMicrosoftFoundryProviderId(provider) {
	if (typeof provider !== "string") return false;
	const normalizedProvider = provider.trim().toLowerCase();
	return normalizedProvider === "microsoft-foundry" || normalizedProvider.startsWith("microsoft-foundry-");
}
/**
* The DeepSeek V4 wrapper emits the deepseek-native `thinking: { type }` wire
* format (plus `reasoning_effort`). Honor an explicit `compat.thinkingFormat`
* override that selects a different reasoning format: some OpenAI-compatible
* deployments — notably Azure AI Foundry DeepSeek V4 — reject the `thinking`
* parameter outright, even `thinking: { type: "disabled" }`. When no override
* exists, honor provider-level detection for non-native formats such as
* OpenRouter while keeping id-based fallback for unknown DeepSeek-compatible
* proxy routes.
*/
function deepSeekV4NativeThinkingAllowedByCompat(model) {
	const thinkingFormat = resolveDeepSeekV4ThinkingFormatOverride(model);
	return thinkingFormat === void 0 || thinkingFormat === "deepseek";
}
function resolveDeepSeekV4ThinkingFormatOverride(model) {
	const compat = model.compat;
	const configured = compat && typeof compat === "object" ? compat.thinkingFormat : void 0;
	if (typeof configured === "string") return configured;
	const detected = require_openai_completions_compat.detectOpenAICompletionsCompat(model).defaults.thinkingFormat;
	return detected === "openrouter" || detected === "together" || detected === "zai" ? detected : void 0;
}
function createDeepSeekV4NonNativeCompatSanitizerWrapper(baseStreamFn) {
	if (!baseStreamFn) return;
	return (model, context, options) => {
		if (!shouldSanitizeDeepSeekV4NonNativeFields(model)) return baseStreamFn(model, context, options);
		return require_openai_transport_stream.streamWithPayloadPatch(baseStreamFn, model, context, options, (payload) => {
			delete payload.thinking;
			stripDeepSeekV4ReasoningContent(payload);
		});
	};
}
function shouldSanitizeDeepSeekV4NonNativeFields(model) {
	return isDeepSeekV4OpenAICompletionsModel(model) && (isMicrosoftFoundryProviderId(model.provider) || !deepSeekV4NativeThinkingAllowedByCompat(model));
}
function stripDeepSeekV4ReasoningContent(payload) {
	if (!Array.isArray(payload.messages)) return;
	for (const message of payload.messages) {
		if (!message || typeof message !== "object") continue;
		delete message.reasoning_content;
	}
}
const MIMO_REASONING_OPENAI_COMPATIBLE_MODEL_IDS = /* @__PURE__ */ new Set([
	"mimo-v2-pro",
	"mimo-v2-omni",
	"mimo-v2.5",
	"mimo-v2.5-pro",
	"mimo-v2.6-pro"
]);
const MIMO_REASONING_AS_VISIBLE_TEXT_MODEL_IDS = /* @__PURE__ */ new Set(["mimo-v2-pro", "mimo-v2-omni"]);
function isMiMoReasoningOpenAICompatibleModel(model) {
	const normalizedModelId = normalizeDeepSeekV4CandidateId(model.id);
	return model.api === "openai-completions" && normalizedModelId !== void 0 && MIMO_REASONING_OPENAI_COMPATIBLE_MODEL_IDS.has(normalizedModelId);
}
function isMiMoReasoningAsVisibleTextOpenAICompatibleModel(model) {
	const normalizedModelId = normalizeDeepSeekV4CandidateId(model.id);
	return model.api === "openai-completions" && normalizedModelId !== void 0 && MIMO_REASONING_AS_VISIBLE_TEXT_MODEL_IDS.has(normalizedModelId);
}
/**
* Apply extra params (like temperature) to an agent's streamFn.
* Also applies verified provider-specific request wrappers, such as OpenRouter attribution.
*
* @internal Exported for testing
*/
function applyExtraParamsToAgent(agent, cfg, provider, modelId, extraParamsOverride, thinkingLevel, agentId, workspaceDir, model, agentDir, resolvedTransport, options) {
	const resolvedExtraParams = resolveExtraParams({
		cfg,
		provider,
		modelId,
		agentId
	});
	const override = extraParamsOverride && Object.keys(extraParamsOverride).length > 0 ? sanitizeExtraParamsRecord(Object.fromEntries(Object.entries(extraParamsOverride).filter(([, value]) => value !== void 0))) : void 0;
	const effectiveExtraParams = options?.preparedExtraParams ?? resolvePreparedExtraParams({
		cfg,
		provider,
		modelId,
		extraParamsOverride,
		thinkingLevel,
		agentId,
		agentDir,
		workspaceDir,
		resolvedExtraParams,
		model,
		resolvedTransport
	});
	const wrapperContext = {
		agent,
		cfg,
		provider,
		modelId,
		agentDir,
		workspaceDir,
		thinkingLevel,
		model,
		effectiveExtraParams,
		resolvedExtraParams,
		override
	};
	const providerStreamBase = agent.streamFn;
	const nativeWebSearchAllowedByToolPolicy = options?.nativeWebSearchPolicyContext ? require_codex_native_web_search_core.isNativeWebSearchAllowedByToolPolicy({
		config: cfg,
		modelProvider: model?.provider,
		modelId: model?.id,
		agentId,
		...options.nativeWebSearchPolicyContext
	}) : void 0;
	const pluginWrappedStreamFn = providerRuntimeDeps.wrapProviderStreamFn({
		provider,
		config: cfg,
		workspaceDir,
		context: {
			config: cfg,
			agentDir,
			workspaceDir,
			agentId,
			nativeWebSearchAllowedByToolPolicy,
			provider,
			modelId,
			extraParams: effectiveExtraParams,
			thinkingLevel,
			model,
			streamFn: providerStreamBase
		}
	});
	agent.streamFn = pluginWrappedStreamFn ?? providerStreamBase;
	applyPrePluginStreamWrappers(wrapperContext);
	const providerWrapperHandled = pluginWrappedStreamFn !== void 0 && pluginWrappedStreamFn !== providerStreamBase;
	applyPostPluginStreamWrappers({
		...wrapperContext,
		providerWrapperHandled
	});
	return { effectiveExtraParams };
}
//#endregion
Object.defineProperty(exports, "applyExtraParamsToAgent", {
	enumerable: true,
	get: function() {
		return applyExtraParamsToAgent;
	}
});
Object.defineProperty(exports, "createCodexNativeWebSearchWrapper", {
	enumerable: true,
	get: function() {
		return createCodexNativeWebSearchWrapper;
	}
});
Object.defineProperty(exports, "isAnthropicFamilyCacheTtlEligible", {
	enumerable: true,
	get: function() {
		return isAnthropicFamilyCacheTtlEligible;
	}
});
Object.defineProperty(exports, "isAnthropicModelRef", {
	enumerable: true,
	get: function() {
		return isAnthropicModelRef;
	}
});
Object.defineProperty(exports, "isGooglePromptCacheEligible", {
	enumerable: true,
	get: function() {
		return isGooglePromptCacheEligible;
	}
});
Object.defineProperty(exports, "resolveAgentTransportOverride", {
	enumerable: true,
	get: function() {
		return resolveAgentTransportOverride;
	}
});
Object.defineProperty(exports, "resolveCacheRetention", {
	enumerable: true,
	get: function() {
		return resolveCacheRetention;
	}
});
Object.defineProperty(exports, "resolveExplicitSettingsTransport", {
	enumerable: true,
	get: function() {
		return resolveExplicitSettingsTransport;
	}
});
Object.defineProperty(exports, "resolveExtraParams", {
	enumerable: true,
	get: function() {
		return resolveExtraParams;
	}
});
Object.defineProperty(exports, "resolveOpenAITextVerbosity", {
	enumerable: true,
	get: function() {
		return resolveOpenAITextVerbosity;
	}
});
Object.defineProperty(exports, "resolvePreparedExtraParams", {
	enumerable: true,
	get: function() {
		return resolvePreparedExtraParams;
	}
});
