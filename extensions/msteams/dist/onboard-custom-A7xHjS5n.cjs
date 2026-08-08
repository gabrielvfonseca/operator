require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_fetch_timeout = require("./fetch-timeout-C6HLIptD.cjs");
const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-BvFurMxy.cjs");
require("./context-window-guard-1fyXlp_c.cjs");
const require_i18n = require("./i18n-DzMW5U-T.cjs");
const require_provider_auth_input = require("./provider-auth-input-BdWiVgmd.cjs");
const require_provider_model_primary = require("./provider-model-primary-QsS3aK4q.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/models/alias-name.ts
/** Validates and normalizes a user-facing model alias. */
function normalizeAlias(alias) {
	const trimmed = alias.trim();
	if (!trimmed) throw new Error("Alias cannot be empty.");
	if (!/^[A-Za-z0-9_.:-]+$/.test(trimmed)) throw new Error("Alias must use letters, numbers, dots, underscores, colons, or dashes.");
	return trimmed;
}
//#endregion
//#region src/commands/onboard-custom-config.ts
/**
* Normalizes and applies custom provider settings captured by onboarding.
*
* Interactive and non-interactive setup share this module so validation,
* endpoint probing, and config mutation stay in one command boundary.
*/
/**
* Wizard default for non-Azure custom APIs when context length is unknown.
* Mirrors the generic persisted custom-model catalog fallback and leaves enough
* room above the default compaction reserve floor in `agent-settings.ts`.
*/
const CUSTOM_PROVIDER_DEFAULT_CONTEXT_WINDOW_TOKENS = 128e3;
const DEFAULT_CONTEXT_WINDOW = CUSTOM_PROVIDER_DEFAULT_CONTEXT_WINDOW_TOKENS;
const DEFAULT_MAX_TOKENS = 4096;
const AZURE_DEFAULT_CONTEXT_WINDOW = 4e5;
const AZURE_DEFAULT_MAX_TOKENS = 16384;
function normalizeContextWindowForCustomModel(value) {
	const parsed = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;
	if (parsed <= 0 || parsed === 4e3) return CUSTOM_PROVIDER_DEFAULT_CONTEXT_WINDOW_TOKENS;
	return parsed >= 4e3 ? parsed : CUSTOM_PROVIDER_DEFAULT_CONTEXT_WINDOW_TOKENS;
}
function customModelInputs(supportsImageInput) {
	return supportsImageInput ? ["text", "image"] : ["text"];
}
/** Infers image-input support from common custom model naming conventions. */
function resolveCustomModelImageInputInference(modelId) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelId);
	if (!normalized) return {
		supportsImageInput: false,
		confidence: "unknown"
	};
	if (/\b(?:gpt-4o|gpt-4\.1|gpt-[5-9]|o[134])\b/.test(normalized) || /\bclaude-(?:3|4|sonnet|opus|haiku)\b/.test(normalized) || /\bgemini\b/.test(normalized) || /\b(?:qwen[\w.-]*-?vl|qwen-vl)\b/.test(normalized) || /\b(?:vision|llava|pixtral|internvl|mllama|minicpm-v|glm-4v)\b/.test(normalized) || /(?:^|[-_/])vl(?:[-_/]|$)/.test(normalized)) return {
		supportsImageInput: true,
		confidence: "known"
	};
	if (/\b(?:llama\d*|deepseek|mistral|mixtral|kimi|moonshot|codestral|devstral|phi|qwq|codellama)\b/.test(normalized) || /\bqwen(?!.*(?:vl|vision))/.test(normalized)) return {
		supportsImageInput: false,
		confidence: "known"
	};
	return {
		supportsImageInput: false,
		confidence: "unknown"
	};
}
function resolveCustomModelSupportsImageInput(params) {
	return params.explicit ?? (() => {
		if (!params.inferKnownModels) return params.fallback;
		const inference = resolveCustomModelImageInputInference(params.modelId);
		return inference.confidence === "known" ? inference.supportsImageInput : params.fallback;
	})();
}
function isAzureFoundryUrl(baseUrl) {
	try {
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(new URL(baseUrl).hostname).endsWith(".services.ai.azure.com");
	} catch {
		return false;
	}
}
function isAzureOpenAiUrl(baseUrl) {
	try {
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(new URL(baseUrl).hostname).endsWith(".openai.azure.com");
	} catch {
		return false;
	}
}
function isAzureUrl(baseUrl) {
	return isAzureFoundryUrl(baseUrl) || isAzureOpenAiUrl(baseUrl);
}
/**
* Transforms an Azure AI Foundry/OpenAI URL to include the deployment path.
* Azure requires: https://host/openai/deployments/<model-id>/chat/completions?api-version=2024-xx-xx-preview
* But we can't add query params here, so we just add the path prefix.
* The api-version will be handled by the Azure OpenAI client or as a query param.
*
* Example:
*   https://my-resource.services.ai.azure.com + gpt-5.4-nano
*   => https://my-resource.services.ai.azure.com/openai/deployments/gpt-5.4-nano
*/
function transformAzureUrl(baseUrl, modelId) {
	const normalizedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
	if (normalizedUrl.includes("/openai/deployments/")) return normalizedUrl;
	return `${normalizedUrl}/openai/deployments/${modelId}`;
}
/**
* Transforms an Azure URL into the base URL stored in config.
*
* Example:
*   https://my-resource.openai.azure.com
*   => https://my-resource.openai.azure.com/openai/v1
*/
function transformAzureConfigUrl(baseUrl) {
	const normalizedUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
	if (normalizedUrl.endsWith("/openai/v1")) return normalizedUrl;
	const deploymentIdx = normalizedUrl.indexOf("/openai/deployments/");
	return `${deploymentIdx !== -1 ? normalizedUrl.slice(0, deploymentIdx) : normalizedUrl}/openai/v1`;
}
function hasSameHost(a, b) {
	try {
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(new URL(a).hostname) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(new URL(b).hostname);
	} catch {
		return false;
	}
}
/** Error class used by callers to turn custom API validation failures into CLI UX. */
var CustomApiError = class extends Error {
	constructor(code, message) {
		super(message);
		this.name = "CustomApiError";
		this.code = code;
	}
};
/** Converts arbitrary endpoint labels into provider-id-safe tokens. */
function normalizeEndpointId(raw) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (!trimmed) return "";
	return trimmed.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}
/** Builds a stable custom provider id from an endpoint URL host and port. */
function buildEndpointIdFromUrl(baseUrl) {
	try {
		const url = new URL(baseUrl);
		return normalizeEndpointId(`custom-${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(url.hostname.replace(/[^a-z0-9]+/gi, "-"))}${url.port ? `-${url.port}` : ""}`) || "custom";
	} catch {
		return "custom";
	}
}
function resolveUniqueEndpointId(params) {
	const normalized = normalizeEndpointId(params.requestedId) || "custom";
	const existing = params.providers[normalized];
	if (!existing?.baseUrl || existing.baseUrl === params.baseUrl || isAzureUrl(params.baseUrl) && hasSameHost(existing.baseUrl, params.baseUrl)) return {
		providerId: normalized,
		renamed: false
	};
	let suffix = 2;
	let candidate = `${normalized}-${suffix}`;
	while (params.providers[candidate]) {
		suffix += 1;
		candidate = `${normalized}-${suffix}`;
	}
	return {
		providerId: candidate,
		renamed: true
	};
}
/** Returns a human-readable alias collision error for a custom model ref. */
function resolveCustomModelAliasError(params) {
	const trimmed = params.raw.trim();
	if (!trimmed) return;
	let normalized;
	try {
		normalized = normalizeAlias(trimmed);
	} catch (err) {
		return err instanceof Error ? err.message : "Alias is invalid.";
	}
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: require_defaults.DEFAULT_PROVIDER
	});
	const aliasKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalized);
	const existing = aliasIndex.byAlias.get(aliasKey);
	if (!existing) return;
	const existingKey = require_model_selection_normalize.modelKey(existing.ref.provider, existing.ref.model);
	if (existingKey === params.modelRef) return;
	return `Alias ${normalized} already points to ${existingKey}.`;
}
function buildAzureOpenAiHeaders(apiKey) {
	const headers = {};
	if (apiKey) headers["api-key"] = apiKey;
	return headers;
}
function buildOpenAiHeaders(apiKey) {
	const headers = {};
	if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
	return headers;
}
function buildAnthropicHeaders(apiKey) {
	const headers = { "anthropic-version": "2023-06-01" };
	if (apiKey) headers["x-api-key"] = apiKey;
	return headers;
}
/** Normalizes optional provider API key input while preserving secret refs. */
function normalizeOptionalProviderApiKey(value) {
	if (require_types_secrets.isSecretRef(value)) return value;
	return require_normalize_secret_input.normalizeOptionalSecretInput(value);
}
function resolveVerificationEndpoint(params) {
	const resolvedUrl = isAzureUrl(params.baseUrl) ? transformAzureUrl(params.baseUrl, params.modelId) : params.baseUrl;
	const endpointUrl = new URL(params.endpointPath, resolvedUrl.endsWith("/") ? resolvedUrl : `${resolvedUrl}/`);
	if (isAzureUrl(params.baseUrl)) endpointUrl.searchParams.set("api-version", "2024-10-21");
	return endpointUrl.href;
}
/** Builds a minimal OpenAI-family request used only to verify custom endpoints. */
function buildOpenAiVerificationProbeRequest(params) {
	const isBaseUrlAzureUrl = isAzureUrl(params.baseUrl);
	const headers = isBaseUrlAzureUrl ? buildAzureOpenAiHeaders(params.apiKey) : buildOpenAiHeaders(params.apiKey);
	if (isAzureOpenAiUrl(params.baseUrl) || params.responsesApi === true) return {
		endpoint: new URL("responses", (isBaseUrlAzureUrl ? transformAzureConfigUrl(params.baseUrl) : params.baseUrl).replace(/\/?$/, "/")).href,
		headers,
		body: {
			model: params.modelId,
			input: "Hi",
			max_output_tokens: 16,
			stream: false
		}
	};
	return {
		endpoint: resolveVerificationEndpoint({
			baseUrl: params.baseUrl,
			modelId: params.modelId,
			endpointPath: "chat/completions"
		}),
		headers,
		body: {
			model: params.modelId,
			messages: [{
				role: "user",
				content: "Hi"
			}],
			max_tokens: 16,
			stream: false
		}
	};
}
/** Builds a minimal Anthropic-compatible request used only to verify endpoints. */
function buildAnthropicVerificationProbeRequest(params) {
	return {
		endpoint: resolveVerificationEndpoint({
			baseUrl: /\/v1\/?$/.test(params.baseUrl.trim()) ? params.baseUrl.trim() : `${params.baseUrl.trim().replace(/\/?$/, "")}/v1`,
			modelId: params.modelId,
			endpointPath: "messages"
		}),
		headers: buildAnthropicHeaders(params.apiKey),
		body: {
			model: params.modelId,
			max_tokens: 1,
			messages: [{
				role: "user",
				content: "Hi"
			}],
			stream: false
		}
	};
}
function resolveProviderApi(compatibility) {
	if (compatibility === "anthropic") return "anthropic-messages";
	return compatibility === "openai-responses" ? "openai-responses" : "openai-completions";
}
/** Resolves the provider id that should own a custom endpoint in config. */
function resolveCustomProviderId(params) {
	const providers = params.config.models?.providers ?? {};
	const baseUrl = params.baseUrl.trim();
	const explicitProviderId = params.providerId?.trim();
	if (explicitProviderId && !normalizeEndpointId(explicitProviderId)) throw new CustomApiError("invalid_provider_id", "Custom provider ID must include letters, numbers, or hyphens.");
	const requestedProviderId = explicitProviderId || buildEndpointIdFromUrl(baseUrl);
	const providerIdResult = resolveUniqueEndpointId({
		requestedId: requestedProviderId,
		baseUrl,
		providers
	});
	return {
		providerId: providerIdResult.providerId,
		...providerIdResult.renamed ? { providerIdRenamedFrom: normalizeEndpointId(requestedProviderId) || "custom" } : {}
	};
}
/** Applies custom provider config and makes the custom model the primary model. */
function applyCustomApiConfig(params) {
	const baseUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.baseUrl) ?? "";
	if (!URL.canParse(baseUrl)) throw new CustomApiError("invalid_base_url", "Custom provider base URL must be a valid URL.");
	if (params.compatibility !== "openai" && params.compatibility !== "openai-responses" && params.compatibility !== "anthropic") throw new CustomApiError("invalid_compatibility", "Custom provider compatibility must be \"openai\", \"openai-responses\", or \"anthropic\".");
	const modelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.modelId) ?? "";
	if (!modelId) throw new CustomApiError("invalid_model_id", "Custom provider model ID is required.");
	const isAzure = isAzureUrl(baseUrl);
	const isAzureOpenAi = isAzureOpenAiUrl(baseUrl);
	const resolvedBaseUrl = isAzure ? transformAzureConfigUrl(baseUrl) : baseUrl;
	const providerIdResult = resolveCustomProviderId({
		config: params.config,
		baseUrl: resolvedBaseUrl,
		providerId: params.providerId
	});
	const providerId = providerIdResult.providerId;
	const providers = params.config.models?.providers ?? {};
	const modelRef = require_model_selection_normalize.modelKey(providerId, modelId);
	const alias = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.alias) ?? "";
	const aliasError = resolveCustomModelAliasError({
		raw: alias,
		cfg: params.config,
		modelRef
	});
	if (aliasError) throw new CustomApiError("invalid_alias", aliasError);
	const existingProvider = providers[providerId];
	const existingModels = Array.isArray(existingProvider?.models) ? existingProvider.models : [];
	const hasModel = existingModels.some((model) => model.id === modelId);
	const isLikelyReasoningModel = isAzure && /\b(o[134]|gpt-([5-9]|\d{2,}))\b/i.test(modelId);
	const explicitInput = params.supportsImageInput === void 0 ? void 0 : customModelInputs(params.supportsImageInput);
	const generatedInput = customModelInputs(resolveCustomModelSupportsImageInput({
		modelId,
		explicit: params.supportsImageInput,
		fallback: isAzure && isLikelyReasoningModel,
		inferKnownModels: !isAzure
	}));
	const nextModel = isAzure ? {
		id: modelId,
		name: `${modelId} (Custom Provider)`,
		contextWindow: AZURE_DEFAULT_CONTEXT_WINDOW,
		maxTokens: AZURE_DEFAULT_MAX_TOKENS,
		input: generatedInput,
		cost: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0
		},
		reasoning: isLikelyReasoningModel,
		compat: { supportsStore: false }
	} : {
		id: modelId,
		name: `${modelId} (Custom Provider)`,
		contextWindow: DEFAULT_CONTEXT_WINDOW,
		maxTokens: DEFAULT_MAX_TOKENS,
		input: generatedInput,
		cost: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0
		},
		reasoning: false
	};
	const mergedModels = hasModel ? existingModels.map((model) => model.id === modelId ? {
		...model,
		...isAzure ? nextModel : {},
		...explicitInput ? { input: explicitInput } : {},
		name: model.name ?? nextModel.name,
		cost: model.cost ?? nextModel.cost,
		contextWindow: normalizeContextWindowForCustomModel(model.contextWindow),
		maxTokens: model.maxTokens ?? nextModel.maxTokens
	} : model) : [...existingModels, nextModel];
	const { apiKey: existingApiKey, ...existingProviderRest } = existingProvider ?? {};
	const normalizedApiKey = normalizeOptionalProviderApiKey(params.apiKey) ?? normalizeOptionalProviderApiKey(existingApiKey);
	const providerApi = isAzureOpenAi ? "azure-openai-responses" : resolveProviderApi(params.compatibility);
	const azureHeaders = isAzure && normalizedApiKey ? { "api-key": normalizedApiKey } : void 0;
	let config = {
		...params.config,
		models: {
			...params.config.models,
			mode: params.config.models?.mode ?? "merge",
			providers: {
				...providers,
				[providerId]: {
					...existingProviderRest,
					baseUrl: resolvedBaseUrl,
					api: providerApi,
					...normalizedApiKey ? { apiKey: normalizedApiKey } : {},
					...isAzure ? { authHeader: false } : {},
					...azureHeaders ? { headers: azureHeaders } : {},
					models: mergedModels.length > 0 ? mergedModels : [nextModel]
				}
			}
		}
	};
	config = require_provider_model_primary.applyPrimaryModel(config, modelRef);
	if (isAzure && isLikelyReasoningModel) {
		if (!config.agents?.defaults?.models?.[modelRef]?.params?.thinking) config = {
			...config,
			agents: {
				...config.agents,
				defaults: {
					...config.agents?.defaults,
					models: {
						...config.agents?.defaults?.models,
						[modelRef]: {
							...config.agents?.defaults?.models?.[modelRef],
							params: {
								...config.agents?.defaults?.models?.[modelRef]?.params,
								thinking: "medium"
							}
						}
					}
				}
			}
		};
	}
	if (alias) config = {
		...config,
		agents: {
			...config.agents,
			defaults: {
				...config.agents?.defaults,
				models: {
					...config.agents?.defaults?.models,
					[modelRef]: {
						...config.agents?.defaults?.models?.[modelRef],
						alias
					}
				}
			}
		}
	};
	return {
		config,
		providerId,
		modelId,
		...providerIdResult.providerIdRenamedFrom ? { providerIdRenamedFrom: providerIdResult.providerIdRenamedFrom } : {}
	};
}
//#endregion
//#region src/commands/onboard-custom.ts
/**
* Interactive custom provider onboarding prompts and endpoint verification.
*
* The pure config helpers are re-exported from here because setup and configure
* flows import this command module as their custom API entrypoint.
*/
const VERIFY_TIMEOUT_MS = 3e4;
const COMPATIBILITY_OPTIONS = [
	{
		value: "openai",
		labelKey: "wizard.customProvider.compatibilityOpenAi",
		hintKey: "wizard.customProvider.compatibilityOpenAiHint"
	},
	{
		value: "openai-responses",
		labelKey: "wizard.customProvider.compatibilityOpenAiResponses",
		hintKey: "wizard.customProvider.compatibilityOpenAiResponsesHint"
	},
	{
		value: "anthropic",
		labelKey: "wizard.customProvider.compatibilityAnthropic",
		hintKey: "wizard.customProvider.compatibilityAnthropicHint"
	},
	{
		value: "unknown",
		labelKey: "wizard.customProvider.compatibilityUnknown",
		hintKey: "wizard.customProvider.compatibilityUnknownHint"
	}
];
function formatVerificationError(error) {
	if (!error) return "unknown error";
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	try {
		return JSON.stringify(error);
	} catch {
		return "unknown error";
	}
}
function isJsonVerificationResponse(res) {
	const contentType = typeof res.headers?.get === "function" ? res.headers.get("content-type") ?? "" : "";
	if (!contentType.trim()) return true;
	const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
	return mediaType === "application/json" || !!mediaType?.endsWith("+json");
}
async function requestVerification(params) {
	let res;
	try {
		res = await require_fetch_timeout.fetchWithTimeout(params.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...params.headers
			},
			body: JSON.stringify(params.body)
		}, VERIFY_TIMEOUT_MS);
		if (res.ok && !isJsonVerificationResponse(res)) return {
			ok: false,
			error: `Verification returned ${res.headers.get("content-type") || "missing content-type"} instead of JSON. Check the provider base URL; OpenAI-compatible endpoints usually need a /v1 path prefix.`
		};
		return {
			ok: res.ok,
			status: res.status
		};
	} catch (error) {
		return {
			ok: false,
			error
		};
	} finally {
		await res?.body?.cancel().catch(() => void 0);
	}
}
async function requestOpenAiVerification(params) {
	return await requestVerification(buildOpenAiVerificationProbeRequest(params));
}
async function requestAnthropicVerification(params) {
	return await requestVerification(buildAnthropicVerificationProbeRequest(params));
}
async function promptBaseUrlAndKey(params) {
	const baseUrl = (await params.prompter.text({
		message: require_i18n.t("wizard.customProvider.apiBaseUrl"),
		initialValue: params.initialBaseUrl,
		placeholder: "https://api.example.com/v1",
		validate: (val) => {
			return URL.canParse(val) ? void 0 : require_i18n.t("wizard.customProvider.validUrl");
		}
	})).trim();
	const providerHint = buildEndpointIdFromUrl(baseUrl) || "custom";
	let apiKeyInput;
	const resolvedApiKey = await require_provider_auth_input.ensureApiKeyFromEnvOrPrompt({
		config: params.config,
		provider: providerHint,
		envLabel: "CUSTOM_API_KEY",
		promptMessage: require_i18n.t("wizard.customProvider.apiKeyPrompt"),
		normalize: require_normalize_secret_input.normalizeSecretInput,
		validate: () => void 0,
		prompter: params.prompter,
		secretInputMode: params.secretInputMode,
		setCredential: async (apiKey) => {
			apiKeyInput = apiKey;
		}
	});
	return {
		baseUrl,
		apiKey: normalizeOptionalProviderApiKey(apiKeyInput),
		resolvedApiKey: require_normalize_secret_input.normalizeSecretInput(resolvedApiKey)
	};
}
async function promptCustomApiRetryChoice(prompter) {
	return await prompter.select({
		message: require_i18n.t("wizard.customProvider.retryChoice"),
		options: [
			{
				value: "baseUrl",
				label: require_i18n.t("wizard.customProvider.changeBaseUrl")
			},
			{
				value: "model",
				label: require_i18n.t("wizard.customProvider.changeModel")
			},
			{
				value: "both",
				label: require_i18n.t("wizard.customProvider.changeBaseUrlAndModel")
			}
		]
	});
}
async function promptCustomApiModelId(prompter) {
	return (await prompter.text({
		message: require_i18n.t("wizard.customProvider.modelId"),
		placeholder: require_i18n.t("wizard.customProvider.modelIdPlaceholder"),
		validate: (val) => val.trim() ? void 0 : require_i18n.t("wizard.customProvider.modelIdRequired")
	})).trim();
}
async function applyCustomApiRetryChoice(params) {
	let { baseUrl, apiKey, resolvedApiKey, modelId } = params.current;
	if (params.retryChoice === "baseUrl" || params.retryChoice === "both") {
		const retryInput = await promptBaseUrlAndKey({
			prompter: params.prompter,
			config: params.config,
			secretInputMode: params.secretInputMode,
			initialBaseUrl: baseUrl
		});
		baseUrl = retryInput.baseUrl;
		apiKey = retryInput.apiKey;
		resolvedApiKey = retryInput.resolvedApiKey;
	}
	if (params.retryChoice === "model" || params.retryChoice === "both") modelId = await promptCustomApiModelId(params.prompter);
	return {
		baseUrl,
		apiKey,
		resolvedApiKey,
		modelId
	};
}
/** Prompts for a custom API provider, verifies it, and persists the selected model. */
async function promptCustomApiConfig(params) {
	const { prompter, runtime, config } = params;
	const baseInput = await promptBaseUrlAndKey({
		prompter,
		config,
		secretInputMode: params.secretInputMode
	});
	let baseUrl = baseInput.baseUrl;
	let apiKey = baseInput.apiKey;
	let resolvedApiKey = baseInput.resolvedApiKey;
	const compatibilityChoice = await prompter.select({
		message: require_i18n.t("wizard.customProvider.compatibility"),
		options: COMPATIBILITY_OPTIONS.map((option) => ({
			value: option.value,
			label: require_i18n.t(option.labelKey),
			hint: require_i18n.t(option.hintKey)
		}))
	});
	let modelId = await promptCustomApiModelId(prompter);
	let compatibility = compatibilityChoice === "unknown" ? null : compatibilityChoice;
	while (true) {
		let verifiedFromProbe = false;
		if (!compatibility) {
			const probeSpinner = prompter.progress(require_i18n.t("wizard.customProvider.detectionProgress"));
			if ((await requestOpenAiVerification({
				baseUrl,
				apiKey: resolvedApiKey,
				modelId
			})).ok) {
				probeSpinner.stop(require_i18n.t("wizard.customProvider.detectedOpenAi"));
				compatibility = "openai";
				verifiedFromProbe = true;
			} else if ((await requestOpenAiVerification({
				baseUrl,
				apiKey: resolvedApiKey,
				modelId,
				responsesApi: true
			})).ok) {
				probeSpinner.stop(require_i18n.t("wizard.customProvider.detectedOpenAiResponses"));
				compatibility = "openai-responses";
				verifiedFromProbe = true;
			} else if ((await requestAnthropicVerification({
				baseUrl,
				apiKey: resolvedApiKey,
				modelId
			})).ok) {
				probeSpinner.stop(require_i18n.t("wizard.customProvider.detectedAnthropic"));
				compatibility = "anthropic";
				verifiedFromProbe = true;
			} else {
				probeSpinner.stop(require_i18n.t("wizard.customProvider.detectionFailed"));
				await prompter.note(require_i18n.t("wizard.customProvider.detectionFailedNote"), require_i18n.t("wizard.customProvider.detectionNoteTitle"));
				const retryChoice = await promptCustomApiRetryChoice(prompter);
				({baseUrl, apiKey, resolvedApiKey, modelId} = await applyCustomApiRetryChoice({
					prompter,
					config,
					secretInputMode: params.secretInputMode,
					retryChoice,
					current: {
						baseUrl,
						apiKey,
						resolvedApiKey,
						modelId
					}
				}));
				continue;
			}
		}
		if (verifiedFromProbe) break;
		const verifySpinner = prompter.progress(require_i18n.t("wizard.customProvider.verifying"));
		const result = compatibility === "anthropic" ? await requestAnthropicVerification({
			baseUrl,
			apiKey: resolvedApiKey,
			modelId
		}) : await requestOpenAiVerification({
			baseUrl,
			apiKey: resolvedApiKey,
			modelId,
			responsesApi: compatibility === "openai-responses"
		});
		if (result.ok) {
			verifySpinner.stop(require_i18n.t("wizard.customProvider.verificationSuccessful"));
			break;
		}
		if (result.error !== void 0) verifySpinner.stop(require_i18n.t("wizard.customProvider.verificationFailedError", { error: formatVerificationError(result.error) }));
		else verifySpinner.stop(require_i18n.t("wizard.customProvider.verificationFailedStatus", { status: result.status }));
		const retryChoice = await promptCustomApiRetryChoice(prompter);
		({baseUrl, apiKey, resolvedApiKey, modelId} = await applyCustomApiRetryChoice({
			prompter,
			config,
			secretInputMode: params.secretInputMode,
			retryChoice,
			current: {
				baseUrl,
				apiKey,
				resolvedApiKey,
				modelId
			}
		}));
		if (compatibilityChoice === "unknown") compatibility = null;
	}
	const suggestedId = buildEndpointIdFromUrl(baseUrl);
	const providerIdInput = await prompter.text({
		message: require_i18n.t("wizard.customProvider.endpointId"),
		initialValue: suggestedId,
		placeholder: "custom",
		validate: (value) => {
			if (!normalizeEndpointId(value)) return require_i18n.t("wizard.customProvider.endpointIdRequired");
		}
	});
	const aliasInput = await prompter.text({
		message: require_i18n.t("wizard.customProvider.modelAlias"),
		placeholder: require_i18n.t("wizard.customProvider.modelAliasPlaceholder"),
		initialValue: "",
		validate: (value) => {
			const modelRef = require_model_selection_normalize.modelKey(resolveCustomProviderId({
				config,
				baseUrl,
				providerId: providerIdInput
			}).providerId, modelId);
			return resolveCustomModelAliasError({
				raw: value,
				cfg: config,
				modelRef
			});
		}
	});
	const imageInputInference = resolveCustomModelImageInputInference(modelId);
	const supportsImageInput = imageInputInference.confidence === "known" ? imageInputInference.supportsImageInput : await prompter.confirm({
		message: require_i18n.t("wizard.customProvider.imageInput"),
		initialValue: imageInputInference.supportsImageInput
	});
	const result = applyCustomApiConfig({
		config,
		baseUrl,
		modelId,
		compatibility: compatibility ?? "openai",
		apiKey,
		providerId: providerIdInput,
		alias: aliasInput,
		supportsImageInput
	});
	if (result.providerIdRenamedFrom && result.providerId) await prompter.note(require_i18n.t("wizard.customProvider.endpointIdRenamed", {
		from: result.providerIdRenamedFrom,
		to: result.providerId
	}), require_i18n.t("wizard.customProvider.endpointIdTitle"));
	runtime.log(`Configured custom provider: ${result.providerId}/${result.modelId}`);
	return result;
}
//#endregion
exports.promptCustomApiConfig = promptCustomApiConfig;
