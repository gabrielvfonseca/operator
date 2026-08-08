require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_embedding_provider_config = require("./embedding-provider-config-DNHxXwXH.cjs");
const require_provider_local_service = require("./provider-local-service-BG5N87JZ.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
const require_http_utils = require("./http-utils-C_86u7P2.cjs");
const require_memory_search = require("./memory-search-CB0O7FbP.cjs");
const require_memory_embedding_provider_runtime = require("./memory-embedding-provider-runtime-PB1-qNoK.cjs");
const require_http_endpoint_helpers = require("./http-endpoint-helpers-CGx6Zu7q.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_buffer = require("node:buffer");
//#region src/plugins/embedding-provider-runtime.ts
function resolveConfiguredEmbeddingProviderId(providerId, cfg) {
	return require_embedding_provider_config.resolveConfiguredGenericEmbeddingProviderId(providerId, cfg);
}
function resolveEmbeddingProviderLookupIds(id, cfg) {
	return require_memory_embedding_provider_runtime.resolveRuntimeEmbeddingProviderLookupIds({
		id,
		cfg,
		resolveConfiguredProviderId: resolveConfiguredEmbeddingProviderId
	});
}
/** Resolves one embedding provider adapter by id, including configured API aliases. */
function getEmbeddingProvider(id, cfg) {
	return require_memory_embedding_provider_runtime.getRuntimeEmbeddingProviderAdapter({
		key: "embeddingProviders",
		cfg,
		lookupIds: resolveEmbeddingProviderLookupIds(id, cfg),
		getRegisteredProvider: require_gateway_startup_plugin_ids.getRegisteredEmbeddingProvider
	});
}
//#endregion
//#region src/gateway/embeddings-http.ts
const DEFAULT_EMBEDDINGS_BODY_BYTES = 5 * 1024 * 1024;
const MAX_EMBEDDING_INPUTS = 128;
const MAX_EMBEDDING_INPUT_CHARS = 8192;
const MAX_EMBEDDING_TOTAL_CHARS = 65536;
const DEFAULT_MEMORY_EMBEDDING_PROVIDER = "openai";
function coerceRequest(value) {
	return value && typeof value === "object" ? value : {};
}
function resolveInputTexts(input) {
	if (typeof input === "string") return [input];
	if (!Array.isArray(input)) return null;
	if (input.every((entry) => typeof entry === "string")) return input;
	return null;
}
function encodeEmbeddingBase64(embedding) {
	const float32 = Float32Array.from(embedding);
	return node_buffer.Buffer.from(float32.buffer).toString("base64");
}
function validateInputTexts(texts) {
	if (texts.length > MAX_EMBEDDING_INPUTS) return `Too many inputs (max ${MAX_EMBEDDING_INPUTS}).`;
	let totalChars = 0;
	for (const text of texts) {
		if (text.length > MAX_EMBEDDING_INPUT_CHARS) return `Input too long (max ${MAX_EMBEDDING_INPUT_CHARS} chars).`;
		totalChars += text.length;
		if (totalChars > MAX_EMBEDDING_TOTAL_CHARS) return `Total input too large (max ${MAX_EMBEDDING_TOTAL_CHARS} chars).`;
	}
}
function resolveEmbeddingProviderRemoteConfig(remote) {
	return remote ? {
		baseUrl: remote.baseUrl,
		apiKey: remote.apiKey,
		headers: remote.headers
	} : void 0;
}
async function createConfiguredEmbeddingProvider(params) {
	const acquireLocalService = require_provider_local_service.createConfiguredProviderLocalServiceAcquirer(() => params.cfg);
	const providerId = params.provider === "auto" ? DEFAULT_MEMORY_EMBEDDING_PROVIDER : params.provider;
	const createWithAdapter = async (adapter) => {
		const createOptions = {
			config: params.cfg,
			agentDir: params.agentDir,
			provider: providerId,
			model: params.model || adapter.defaultModel || "",
			local: params.memorySearch?.local,
			remote: resolveEmbeddingProviderRemoteConfig(params.memorySearch?.remote),
			outputDimensionality: params.memorySearch?.outputDimensionality,
			acquireLocalService
		};
		return (await adapter.create(createOptions)).provider;
	};
	const createWithGenericAdapter = async (adapter) => {
		const createOptions = {
			config: params.cfg,
			agentDir: params.agentDir,
			provider: providerId,
			model: params.model || adapter.defaultModel || "",
			local: params.memorySearch?.local,
			remote: resolveEmbeddingProviderRemoteConfig(params.memorySearch?.remote),
			dimensions: params.memorySearch?.outputDimensionality,
			inputType: params.memorySearch?.inputType,
			queryInputType: params.memorySearch?.queryInputType,
			documentInputType: params.memorySearch?.documentInputType,
			acquireLocalService
		};
		const result = await adapter.create(createOptions);
		return result.provider ? adaptGenericEmbeddingProvider(result.provider) : null;
	};
	const adapter = require_memory_embedding_provider_runtime.getMemoryEmbeddingProvider(providerId, params.cfg);
	if (adapter) {
		const provider = await createWithAdapter(adapter);
		if (!provider) throw new Error(`Memory embedding provider ${providerId} is unavailable.`);
		return provider;
	}
	const genericAdapter = getEmbeddingProvider(providerId, params.cfg);
	if (!genericAdapter) throw new Error(`Unknown memory embedding provider: ${providerId}`);
	const provider = await createWithGenericAdapter(genericAdapter);
	if (!provider) throw new Error(`Embedding provider ${providerId} is unavailable.`);
	return provider;
}
function adaptGenericEmbeddingProvider(provider) {
	return {
		id: provider.id,
		model: provider.model,
		...typeof provider.maxInputTokens === "number" ? { maxInputTokens: provider.maxInputTokens } : {},
		embedQuery: async (text, options) => await provider.embed(text, {
			...options,
			inputType: "query"
		}),
		embedBatch: async (texts, options) => await provider.embedBatch(texts, {
			...options,
			inputType: "document"
		}),
		...provider.close ? { close: provider.close } : {}
	};
}
function resolveEmbeddingsTarget(params) {
	const configuredProvider = params.configuredProvider === "auto" ? DEFAULT_MEMORY_EMBEDDING_PROVIDER : params.configuredProvider;
	const raw = params.requestModel.trim();
	const slash = raw.indexOf("/");
	if (slash === -1) return {
		provider: configuredProvider,
		model: raw
	};
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw.slice(0, slash));
	const model = raw.slice(slash + 1).trim();
	if (!model) return { errorMessage: "Unsupported embedding model reference." };
	if (provider !== configuredProvider) return { errorMessage: "This agent does not allow that embedding provider on `/v1/embeddings`." };
	return {
		provider: configuredProvider,
		model
	};
}
/** Handles OpenAI-compatible embeddings requests for the configured agent memory provider. */
async function handleOpenAiEmbeddingsHttpRequest(req, res, opts) {
	const handled = await require_http_endpoint_helpers.handleGatewayPostJsonEndpoint(req, res, {
		pathname: "/v1/embeddings",
		requiredOperatorMethod: "chat.send",
		resolveOperatorScopes: require_http_auth_utils.resolveOpenAiCompatibleHttpOperatorScopes,
		auth: opts.auth,
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: opts.rateLimiter,
		maxBodyBytes: opts.maxBodyBytes ?? DEFAULT_EMBEDDINGS_BODY_BYTES
	});
	if (handled === false) return false;
	if (!handled) return true;
	const modelOverrideAuth = require_http_auth_utils.authorizeOpenAiCompatibleHttpModelOverride(req, handled.requestAuth);
	if (!modelOverrideAuth.allowed) {
		require_http_common.sendMissingScopeForbidden(res, modelOverrideAuth.missingScope);
		return true;
	}
	const payload = coerceRequest(handled.body);
	const requestModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.model) ?? "";
	if (!requestModel) {
		require_http_common.sendJson(res, 400, { error: {
			message: "Missing `model`.",
			type: "invalid_request_error"
		} });
		return true;
	}
	const cfg = require_io.getRuntimeConfig();
	if (requestModel !== "@gabrielvfonseca/operator" && !require_http_utils.resolveAgentIdFromModel(requestModel, cfg)) {
		require_http_common.sendJson(res, 400, { error: {
			message: "Invalid `model`. Use `openclaw` or `openclaw/<agentId>`.",
			type: "invalid_request_error"
		} });
		return true;
	}
	const texts = resolveInputTexts(payload.input);
	if (!texts) {
		require_http_common.sendJson(res, 400, { error: {
			message: "`input` must be a string or an array of strings.",
			type: "invalid_request_error"
		} });
		return true;
	}
	const inputError = validateInputTexts(texts);
	if (inputError) {
		require_http_common.sendJson(res, 400, { error: {
			message: inputError,
			type: "invalid_request_error"
		} });
		return true;
	}
	let agentId;
	try {
		agentId = require_http_utils.resolveAgentIdForRequest({
			req,
			model: requestModel
		});
	} catch (err) {
		if (require_http_utils.isUnknownGatewayAgentError(err)) {
			require_http_common.sendJson(res, 400, { error: {
				message: err.message,
				type: "invalid_request_error"
			} });
			return true;
		}
		throw err;
	}
	const agentDir = require_agent_scope_config.resolveAgentDir(cfg, agentId);
	const memorySearch = require_memory_search.resolveMemorySearchConfig(cfg, agentId);
	const configuredProvider = memorySearch?.provider ?? "openai";
	const target = resolveEmbeddingsTarget({
		requestModel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_http_auth_utils.getHeader(req, "x-operator-model")) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(memorySearch?.model) || "",
		configuredProvider
	});
	if ("errorMessage" in target) {
		require_http_common.sendJson(res, 400, { error: {
			message: target.errorMessage,
			type: "invalid_request_error"
		} });
		return true;
	}
	try {
		const embeddings = await (await createConfiguredEmbeddingProvider({
			cfg,
			agentDir,
			provider: target.provider,
			model: target.model,
			memorySearch: memorySearch ? {
				...memorySearch,
				outputDimensionality: typeof payload.dimensions === "number" && payload.dimensions > 0 ? Math.floor(payload.dimensions) : memorySearch.outputDimensionality
			} : void 0
		})).embedBatch(texts);
		const encodingFormat = payload.encoding_format === "base64" ? "base64" : "float";
		require_http_common.sendJson(res, 200, {
			object: "list",
			data: embeddings.map((embedding, index) => ({
				object: "embedding",
				index,
				embedding: encodingFormat === "base64" ? encodeEmbeddingBase64(embedding) : embedding
			})),
			model: requestModel,
			usage: {
				prompt_tokens: 0,
				total_tokens: 0
			}
		});
	} catch (err) {
		require_logger.logWarn(`openai-compat: embeddings request failed: ${require_errors.formatErrorMessage(err)}`);
		require_http_common.sendJson(res, 500, { error: {
			message: "internal error",
			type: "api_error"
		} });
	}
	return true;
}
//#endregion
exports.handleOpenAiEmbeddingsHttpRequest = handleOpenAiEmbeddingsHttpRequest;
