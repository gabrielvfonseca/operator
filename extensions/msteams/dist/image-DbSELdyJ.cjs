require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_minimax_vlm = require("./minimax-vlm-tDIDyu6m.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_provider_attribution = require("./provider-attribution-CIUHVFNx.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_provider_id = require("./provider-id-DSr5QyVH.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
const require_provider_secret_egress = require("./provider-secret-egress-NB6SfEEF.cjs");
const require_provider_runtime_runtime = require("./provider-runtime.runtime-BdpKDfCD.cjs");
require("./session-transcript-repair-vqlcO05-.cjs");
const require_model_auth_runtime_shared = require("./model-auth-runtime-shared-UOjMKX1E.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_models_config = require("./models-config-kAzoM1Dq.cjs");
const require_image_tool_helpers = require("./image-tool.helpers-HhfudLKI.cjs");
const require_provider_stream = require("./provider-stream-DRQnPAya.cjs");
require("./provider-auth-PPVVNb8y.cjs");
const require_model = require("./model-Don1-Go6.cjs");
const require_credential_scoped_model = require("./credential-scoped-model-D1XdNupI.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_ai_internal_runtime = require("@gabrielvfonseca/ai/internal/runtime");
//#region src/media-understanding/image-model-runtime.ts
function formatModelInputCapabilities(input) {
	return input && input.length > 0 ? input.join(", ") : "none";
}
function requireImageCapableModel(params) {
	if (!params.model) throw new Error(`Unknown model: ${params.resolvedProvider}/${params.resolvedModel}`);
	if (params.model.input?.includes("image")) return params.model;
	if (require_minimax_vlm.isMinimaxVlmModel(params.resolvedProvider, params.resolvedModel)) throw new Error(`Unknown model: ${params.resolvedProvider}/${params.resolvedModel}`);
	throw new Error(`Model does not support images: ${params.requestedProvider}/${params.requestedModel} (resolved ${params.model.provider}/${params.model.id} input: ${formatModelInputCapabilities(params.model.input)})`);
}
async function prepareResolvedImageRuntime(params, resolvedModel, authStorage, modelRegistry) {
	let model = resolvedModel;
	const apiKeyInfo = await require_model_auth.getApiKeyForModel({
		model,
		cfg: params.cfg,
		agentDir: params.agentDir,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		profileId: params.profile,
		preferredProfile: params.preferredProfile,
		store: params.authStore,
		secretSentinels: true
	});
	if (require_credential_scoped_model.providerUsesCredentialScopedModelMetadata({
		provider: model.provider,
		modelId: model.id,
		config: params.cfg,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	})) {
		const authProfileMode = require_openai_routing.resolveProviderModelMaterializationAuthMode(apiKeyInfo.mode);
		model = requireImageCapableModel({
			model: (await require_model.resolveModelAsync(model.provider, model.id, params.agentDir, params.cfg, {
				authStorage,
				modelRegistry,
				skipAgentDiscovery: true,
				allowBundledStaticCatalogFallback: true,
				...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
				...apiKeyInfo.profileId ? { authProfileId: apiKeyInfo.profileId } : authProfileMode ? { authProfileMode } : {}
			})).model,
			resolvedProvider: model.provider,
			resolvedModel: model.id,
			requestedProvider: params.provider,
			requestedModel: params.model
		});
	}
	if (!apiKeyInfo.apiKey?.trim() && apiKeyInfo.mode === "aws-sdk" && model.api === "bedrock-converse-stream") return {
		apiKey: "",
		model: require_model_auth.applySecretRefHeaderSentinels(model, params.cfg)
	};
	let apiKey = require_model_auth_runtime_shared.requireApiKey(apiKeyInfo, model.provider);
	const preparedAuth = require_provider_secret_egress.protectPreparedProviderRuntimeAuth({
		provider: model.provider,
		preparedAuth: await require_provider_runtime_runtime.prepareProviderRuntimeAuth({
			provider: model.provider,
			config: params.cfg,
			workspaceDir: params.workspaceDir,
			env: process.env,
			context: {
				config: params.cfg,
				workspaceDir: params.workspaceDir,
				env: process.env,
				provider: model.provider,
				modelId: model.id,
				model,
				apiKey,
				authMode: apiKeyInfo.mode,
				profileId: apiKeyInfo.profileId
			}
		})
	});
	apiKey = preparedAuth?.apiKey?.trim() || apiKey;
	const runtimeBaseUrl = preparedAuth?.baseUrl?.trim();
	if (runtimeBaseUrl) model = {
		...model,
		baseUrl: runtimeBaseUrl
	};
	authStorage.setRuntimeApiKey(model.provider, apiKey);
	return {
		apiKey,
		model: require_model_auth.applySecretRefHeaderSentinels(model, params.cfg)
	};
}
async function resolveImageRuntime(params) {
	const resolvedRef = require_model_selection_normalize.normalizeModelRef(params.provider, params.model);
	const authProfileOptions = {
		...params.profile ? { authProfileId: params.profile } : {},
		...params.preferredProfile ? { preferredProfile: params.preferredProfile } : {}
	};
	if ((await require_model.resolveModelAsync(resolvedRef.provider, resolvedRef.model, params.agentDir, params.cfg, {
		allowBundledStaticCatalogFallback: true,
		skipAgentDiscovery: true,
		skipProviderRuntimeHooks: true,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		...authProfileOptions
	})).model?.input?.includes("image")) {
		const normalizedResolved = await require_model.resolveModelAsync(resolvedRef.provider, resolvedRef.model, params.agentDir, params.cfg, {
			allowBundledStaticCatalogFallback: true,
			skipAgentDiscovery: true,
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
			...authProfileOptions
		});
		if (normalizedResolved.model?.input?.includes("image")) return await prepareResolvedImageRuntime(params, normalizedResolved.model, normalizedResolved.authStorage, normalizedResolved.modelRegistry);
	}
	const modelsOptions = params.workspaceDir ? { workspaceDir: params.workspaceDir } : void 0;
	await require_models_config.ensureOperatorModelsJson(params.cfg, params.agentDir, modelsOptions);
	const resolved = await require_model.resolveModelAsync(resolvedRef.provider, resolvedRef.model, params.agentDir, params.cfg, {
		allowBundledStaticCatalogFallback: true,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		...authProfileOptions
	});
	return await prepareResolvedImageRuntime(params, requireImageCapableModel({
		model: resolved.model,
		resolvedProvider: resolvedRef.provider,
		resolvedModel: resolvedRef.model,
		requestedProvider: params.provider,
		requestedModel: params.model
	}), resolved.authStorage, resolved.modelRegistry);
}
//#endregion
//#region src/media-understanding/image.ts
function resolveImageToolMaxTokens(modelMaxTokens, requestedMaxTokens = 4096) {
	if (typeof modelMaxTokens !== "number" || !Number.isFinite(modelMaxTokens) || modelMaxTokens <= 0) return requestedMaxTokens;
	return Math.min(requestedMaxTokens, modelMaxTokens);
}
function isNativeResponsesReasoningPayload(model) {
	if (model.api !== "openai-responses" && model.api !== "azure-openai-responses" && model.api !== "openai-chatgpt-responses") return false;
	return require_provider_attribution.resolveProviderRequestCapabilities({
		provider: model.provider,
		api: model.api,
		baseUrl: model.baseUrl,
		capability: "image",
		transport: "media-understanding"
	}).usesKnownNativeOpenAIRoute;
}
function removeReasoningInclude(value) {
	if (!Array.isArray(value)) return value;
	const next = value.filter((entry) => entry !== "reasoning.encrypted_content");
	return next.length > 0 ? next : void 0;
}
function disableReasoningForImageRetryPayload(payload, model) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(payload)) return;
	const next = { ...payload };
	delete next.reasoning;
	delete next.reasoning_effort;
	const include = removeReasoningInclude(next.include);
	if (include === void 0) delete next.include;
	else next.include = include;
	if (isNativeResponsesReasoningPayload(model)) next.reasoning = { effort: "none" };
	return next;
}
function isImageModelNoTextError(err) {
	return err instanceof Error && /^Image model returned no text\b/.test(err.message);
}
function isPromiseLike(value) {
	return Boolean(value) && typeof value.then === "function";
}
function composeImageDescriptionPayloadHandlers(first, second) {
	if (!first) return second;
	if (!second) return first;
	return (payload, payloadModel) => {
		const runSecond = (firstResult) => {
			const secondResult = second(firstResult === void 0 ? payload : firstResult, payloadModel);
			const coerceResult = (resolvedSecond) => resolvedSecond === void 0 ? firstResult : resolvedSecond;
			return isPromiseLike(secondResult) ? Promise.resolve(secondResult).then(coerceResult) : coerceResult(secondResult);
		};
		const firstResult = first(payload, payloadModel);
		if (isPromiseLike(firstResult)) return Promise.resolve(firstResult).then(runSecond);
		return runSecond(firstResult);
	};
}
function buildImageContext(prompt, images, opts) {
	const imageContent = images.map((image) => ({
		type: "image",
		data: image.buffer.toString("base64"),
		mimeType: image.mime ?? "image/jpeg"
	}));
	const content = opts?.promptInUserContent ? [{
		type: "text",
		text: prompt
	}, ...imageContent] : imageContent;
	return {
		...opts?.promptInUserContent ? {} : { systemPrompt: prompt },
		messages: [{
			role: "user",
			content,
			timestamp: Date.now()
		}]
	};
}
function shouldPlaceImagePromptInUserContent(model) {
	if (model.provider === "github-copilot") return true;
	const capabilities = require_provider_attribution.resolveProviderRequestCapabilities({
		provider: model.provider,
		api: model.api,
		baseUrl: model.baseUrl,
		capability: "image",
		transport: "media-understanding"
	});
	return capabilities.endpointClass === "openrouter" || capabilities.endpointClass === "modelstudio-native" || model.provider.toLowerCase() === "openrouter" && capabilities.endpointClass === "default";
}
function buildImageRequestHeaders(model) {
	if (model.provider !== "github-copilot") return;
	return {
		...require_provider_request_config.buildCopilotIdeHeaders(),
		"Copilot-Integration-Id": require_provider_request_config.COPILOT_INTEGRATION_ID,
		"Openai-Organization": "github-copilot",
		"x-initiator": "user",
		"Copilot-Vision-Request": "true"
	};
}
async function describeImagesWithMinimax(params) {
	const responses = [];
	const apiKey = require_provider_secret_egress.unwrapSecretSentinelsForProviderEgress(params.apiKey, "MiniMax VLM request");
	for (const [index, image] of params.images.entries()) {
		const prompt = params.images.length > 1 ? `${params.prompt}\n\nDescribe image ${index + 1} of ${params.images.length} independently.` : params.prompt;
		const text = await require_minimax_vlm.minimaxUnderstandImage({
			apiKey,
			provider: params.provider,
			prompt,
			imageDataUrl: `data:${image.mime ?? "image/jpeg"};base64,${image.buffer.toString("base64")}`,
			modelBaseUrl: params.modelBaseUrl,
			timeoutMs: params.timeoutMs
		});
		responses.push(params.images.length > 1 ? `Image ${index + 1}:\n${text.trim()}` : text.trim());
	}
	return {
		text: responses.join("\n\n").trim(),
		model: params.modelId
	};
}
function isUnknownModelError(err) {
	return err instanceof Error && /^Unknown model:/i.test(err.message);
}
function resolveConfiguredProviderBaseUrl(cfg, provider) {
	const direct = cfg.models?.providers?.[provider];
	if (typeof direct?.baseUrl === "string" && direct.baseUrl.trim()) return direct.baseUrl.trim();
	const normalizedProvider = require_provider_id.normalizeMediaProviderId(provider);
	const normalized = cfg.models?.providers?.[normalizedProvider];
	if (typeof normalized?.baseUrl === "string" && normalized.baseUrl.trim()) {
		if (isMinimaxCnAlias(provider) && !isMinimaxCnBaseUrl(normalized.baseUrl)) return;
		return normalized.baseUrl.trim();
	}
}
function isMinimaxCnAlias(provider) {
	const normalized = provider.trim().toLowerCase();
	return normalized === "minimax-cn" || normalized === "minimax-portal-cn";
}
function isMinimaxCnBaseUrl(baseUrl) {
	const trimmed = baseUrl.trim();
	if (!trimmed) return false;
	try {
		return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).hostname.toLowerCase() === "api.minimaxi.com";
	} catch {
		return false;
	}
}
function hasConfiguredProviderApiKey(cfg, provider) {
	const apiKey = cfg.models?.providers?.[provider]?.apiKey;
	return typeof apiKey === "string" && apiKey.trim().length > 0 || require_types_secrets.isSecretRef(apiKey);
}
function resolveMinimaxVlmAuthProvider(cfg, provider) {
	if (!isMinimaxCnAlias(provider) || hasConfiguredProviderApiKey(cfg, provider)) return provider;
	return require_provider_id.normalizeMediaProviderId(provider);
}
async function resolveMinimaxVlmFallbackRuntime(params) {
	const authProvider = resolveMinimaxVlmAuthProvider(params.cfg, params.provider);
	return {
		apiKey: require_model_auth_runtime_shared.requireApiKey(await require_model_auth.resolveApiKeyForProvider({
			provider: authProvider,
			cfg: params.cfg,
			secretSentinels: true,
			profileId: params.profile,
			preferredProfile: params.preferredProfile,
			agentDir: params.agentDir,
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
		}), authProvider),
		modelBaseUrl: resolveConfiguredProviderBaseUrl(params.cfg, params.provider)
	};
}
function resolveImageDescriptionTimeoutMs(timeoutMs) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.clampPositiveTimerTimeoutMs)(timeoutMs);
}
function buildImageDescriptionTimeoutError(params) {
	if (params.phase === "setup") return /* @__PURE__ */ new Error(`image description setup timed out after ${params.timeoutMs}ms before provider request started`);
	const setupDurationMs = typeof params.setupDurationMs === "number" && Number.isFinite(params.setupDurationMs) ? Math.max(0, Math.floor(params.setupDurationMs)) : 0;
	return /* @__PURE__ */ new Error(setupDurationMs > 0 ? `image description request timed out after ${params.timeoutMs}ms (setup took ${setupDurationMs}ms before provider request started)` : `image description request timed out after ${params.timeoutMs}ms`);
}
async function withImageDescriptionTimeout(params) {
	if (params.timeoutMs === void 0) return await params.task;
	let timeout;
	try {
		return await Promise.race([params.task, new Promise((_, reject) => {
			timeout = setTimeout(() => {
				params.controller.abort();
				reject(params.createTimeoutError(params.timeoutMs));
			}, params.timeoutMs);
		})]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
async function describeImagesWithModelInternal(params, options = {}) {
	const prompt = params.prompt ?? "Describe the image.";
	const startedAtMs = Date.now();
	const controller = new AbortController();
	const configuredTimeoutMs = resolveImageDescriptionTimeoutMs(params.timeoutMs);
	let apiKey;
	let model;
	try {
		const resolved = await withImageDescriptionTimeout({
			controller,
			timeoutMs: configuredTimeoutMs,
			createTimeoutError: (timeoutMs) => buildImageDescriptionTimeoutError({
				phase: "setup",
				timeoutMs
			}),
			task: resolveImageRuntime(params)
		});
		apiKey = resolved.apiKey;
		model = resolved.model;
	} catch (err) {
		if (!require_minimax_vlm.isMinimaxVlmModel(params.provider, params.model) || !isUnknownModelError(err)) throw err;
		const fallback = await withImageDescriptionTimeout({
			controller,
			timeoutMs: configuredTimeoutMs,
			createTimeoutError: (timeoutMs) => buildImageDescriptionTimeoutError({
				phase: "setup",
				timeoutMs
			}),
			task: resolveMinimaxVlmFallbackRuntime(params)
		});
		return await describeImagesWithMinimax({
			apiKey: fallback.apiKey,
			provider: params.provider,
			modelId: params.model,
			modelBaseUrl: fallback.modelBaseUrl,
			prompt,
			timeoutMs: params.timeoutMs,
			images: params.images
		});
	}
	const setupDurationMs = Date.now() - startedAtMs;
	if (require_minimax_vlm.isMinimaxVlmModel(model.provider, model.id)) return await describeImagesWithMinimax({
		apiKey,
		provider: model.provider,
		modelId: model.id,
		modelBaseUrl: model.baseUrl,
		prompt,
		timeoutMs: params.timeoutMs,
		images: params.images
	});
	const providerStreamFn = require_provider_stream.registerProviderStreamForModel({
		model,
		cfg: params.cfg,
		agentDir: params.agentDir,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {}
	});
	const context = buildImageContext(prompt, params.images, { promptInUserContent: shouldPlaceImagePromptInUserContent(model) });
	const maxTokens = resolveImageToolMaxTokens(model.maxTokens, params.maxTokens);
	const completeImage = async (onPayload) => {
		const payloadHandler = composeImageDescriptionPayloadHandlers(onPayload, options.onPayload);
		const timeoutMs = configuredTimeoutMs;
		const headers = buildImageRequestHeaders(model);
		const streamOptions = {
			apiKey,
			maxTokens,
			signal: controller.signal,
			...timeoutMs !== void 0 ? { timeoutMs } : {},
			...headers ? { headers } : {},
			...payloadHandler ? { onPayload: payloadHandler } : {}
		};
		const task = providerStreamFn ? (async () => await (await providerStreamFn(model, context, streamOptions)).result())() : (0, _gabrielvfonseca_ai_internal_runtime.complete)(model, context, streamOptions);
		return await withImageDescriptionTimeout({
			controller,
			timeoutMs,
			createTimeoutError: (requestTimeoutMs) => buildImageDescriptionTimeoutError({
				phase: "request",
				timeoutMs: requestTimeoutMs,
				setupDurationMs
			}),
			task
		});
	};
	const message = await completeImage();
	try {
		return {
			text: require_image_tool_helpers.coerceImageAssistantText({
				message,
				provider: model.provider,
				model: model.id
			}),
			model: model.id
		};
	} catch (err) {
		if (!isImageModelNoTextError(err) || !require_image_tool_helpers.hasImageReasoningOnlyResponse(message)) throw err;
	}
	return {
		text: require_image_tool_helpers.coerceImageAssistantText({
			message: await completeImage(disableReasoningForImageRetryPayload),
			provider: model.provider,
			model: model.id
		}),
		model: model.id
	};
}
function toImagesDescriptionRequest(params) {
	return {
		images: [{
			buffer: params.buffer,
			fileName: params.fileName,
			mime: params.mime
		}],
		model: params.model,
		provider: params.provider,
		prompt: params.prompt,
		maxTokens: params.maxTokens,
		timeoutMs: params.timeoutMs,
		profile: params.profile,
		preferredProfile: params.preferredProfile,
		authStore: params.authStore,
		agentDir: params.agentDir,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		cfg: params.cfg
	};
}
async function describeImagesWithModel(params) {
	return await describeImagesWithModelInternal(params);
}
async function describeImagesWithModelPayloadTransform(params, onPayload) {
	return await describeImagesWithModelInternal(params, { onPayload });
}
async function describeImageWithModel(params) {
	return await describeImagesWithModel(toImagesDescriptionRequest(params));
}
async function describeImageWithModelPayloadTransform(params, onPayload) {
	return await describeImagesWithModelPayloadTransform(toImagesDescriptionRequest(params), onPayload);
}
//#endregion
exports.describeImageWithModel = describeImageWithModel;
exports.describeImageWithModelPayloadTransform = describeImageWithModelPayloadTransform;
exports.describeImagesWithModel = describeImagesWithModel;
exports.describeImagesWithModelPayloadTransform = describeImagesWithModelPayloadTransform;
