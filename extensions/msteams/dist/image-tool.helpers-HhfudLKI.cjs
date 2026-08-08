const require_embedded_agent_utils = require("./embedded-agent-utils-OVBmZgZz.cjs");
const require_minimax_vlm = require("./minimax-vlm-tDIDyu6m.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
require("./model-selection-BvFurMxy.cjs");
const require_model_config_helpers = require("./model-config.helpers-BA8b3n7P.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_base64 = require("@gabrielvfonseca/media-core/base64");
//#region src/agents/tools/image-tool.helpers.ts
/**
* Image/media understanding helper functions.
*
* Handles model config, data URL decoding, provider lookup, and reasoning-only response validation.
*/
const IMAGE_REASONING_FALLBACK_SIGNATURES = /* @__PURE__ */ new Set([
	"reasoning_content",
	"reasoning",
	"reasoning_details",
	"reasoning_text"
]);
const MAX_IMAGE_REASONING_FALLBACK_BLOCKS = 50;
const MAX_IMAGE_REASONING_SIGNATURE_PARSE_CHARS = 2048;
const MAX_IMAGE_REASONING_SIGNATURE_SCAN_CHARS = 65536;
function hasResponsesReasoningSignatureMarkers(value) {
	const scanned = value.slice(0, MAX_IMAGE_REASONING_SIGNATURE_SCAN_CHARS);
	return /"id"\s*:\s*"rs_/.test(scanned) && /"type"\s*:\s*"reasoning(?:[."])/.test(scanned);
}
function isImageReasoningFallbackSignature(value) {
	if (!value) return false;
	if (typeof value === "string") {
		if (IMAGE_REASONING_FALLBACK_SIGNATURES.has(value)) return true;
		const trimmed = value.trim();
		if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
		if (trimmed.length > MAX_IMAGE_REASONING_SIGNATURE_PARSE_CHARS) return hasResponsesReasoningSignatureMarkers(trimmed);
		try {
			return isImageReasoningFallbackSignature(JSON.parse(trimmed));
		} catch {
			return false;
		}
	}
	if (typeof value !== "object") return false;
	const record = value;
	const id = typeof record.id === "string" ? record.id : "";
	const type = typeof record.type === "string" ? record.type : "";
	return id.startsWith("rs_") && (type === "reasoning" || type.startsWith("reasoning."));
}
/** Detects provider responses that contain only reasoning blocks and no usable image text. */
function hasImageReasoningOnlyResponse(message) {
	if (require_embedded_agent_utils.extractAssistantText(message).trim() || !Array.isArray(message.content)) return false;
	let checkedBlocks = 0;
	for (const block of message.content) {
		checkedBlocks += 1;
		if (checkedBlocks > MAX_IMAGE_REASONING_FALLBACK_BLOCKS) break;
		if (!block || typeof block !== "object") continue;
		const record = block;
		if (record.type === "thinking" && typeof record.thinking === "string" && isImageReasoningFallbackSignature(record.thinkingSignature)) return true;
	}
	return false;
}
/** Decodes a base64 image data URL with optional decoded-size protection. */
function decodeDataUrl(dataUrl, opts) {
	const trimmed = dataUrl.trim();
	const match = /^data:([^;,]+);base64,([a-z0-9+/=\r\n]+)$/i.exec(trimmed);
	if (!match) throw new Error("Invalid data URL (expected base64 data: URL).");
	const mimeType = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(match[1]);
	if (!mimeType.startsWith("image/")) throw new Error(`Unsupported data URL type: ${mimeType || "unknown"}`);
	const b64 = (match[2] ?? "").trim();
	if (typeof opts?.maxBytes === "number" && (0, _gabrielvfonseca_media_core_base64.estimateBase64DecodedBytes)(b64) > opts.maxBytes) throw new Error("Invalid data URL: payload exceeds size limit.");
	const buffer = Buffer.from(b64, "base64");
	if (buffer.length === 0) throw new Error("Invalid data URL: empty payload.");
	return {
		buffer,
		mimeType,
		kind: "image"
	};
}
/** Extracts assistant text or throws a provider/model-specific image failure. */
function coerceImageAssistantText(params) {
	const stop = params.message.stopReason;
	const errorMessage = params.message.errorMessage?.trim();
	if (stop === "error" || stop === "aborted") throw new Error(errorMessage ? `Image model failed (${params.provider}/${params.model}): ${errorMessage}` : `Image model failed (${params.provider}/${params.model})`);
	if (errorMessage) throw new Error(`Image model failed (${params.provider}/${params.model}): ${errorMessage}`);
	const text = require_embedded_agent_utils.extractAssistantText(params.message);
	if (text.trim()) return text.trim();
	throw new Error(`Image model returned no text (${params.provider}/${params.model}).`);
}
/** Reads imageModel defaults from config into the shared tool model config shape. */
function coerceImageModelConfig(cfg) {
	return require_model_config_helpers.coerceToolModelConfig(cfg?.agents?.defaults?.imageModel);
}
function formatConfiguredImageModelRef(provider, modelId) {
	const slash = modelId.indexOf("/");
	if (slash > 0 && require_model_selection_normalize.normalizeProviderId(modelId.slice(0, slash)) === provider) return modelId;
	return `${provider}/${modelId}`;
}
function modelIdMatchesProviderlessRef(params) {
	const candidates = /* @__PURE__ */ new Set([params.modelId]);
	const slash = params.modelId.indexOf("/");
	if (slash > 0 && require_model_selection_normalize.normalizeProviderId(params.modelId.slice(0, slash)) === params.provider) candidates.add(params.modelId.slice(slash + 1));
	const normalizedRef = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.ref);
	for (const candidate of candidates) if (candidate === params.ref || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(candidate) === normalizedRef) return true;
	return false;
}
function findConfiguredImageModelMatches(params) {
	const providers = params.cfg?.models?.providers;
	if (!providers || typeof providers !== "object") return [];
	const matches = /* @__PURE__ */ new Set();
	for (const [providerKey, providerConfig] of Object.entries(providers)) {
		const provider = require_model_selection_normalize.normalizeProviderId(providerKey);
		if (!provider || !Array.isArray(providerConfig?.models)) continue;
		for (const entry of providerConfig.models) {
			const modelId = entry?.id?.trim();
			if (!modelId || !Array.isArray(entry?.input) || !entry.input.includes("image")) continue;
			if (!modelIdMatchesProviderlessRef({
				provider,
				modelId,
				ref: params.ref
			})) continue;
			matches.add(formatConfiguredImageModelRef(provider, modelId));
		}
	}
	return [...matches];
}
function resolveProviderlessConfiguredImageModelRef(params) {
	const ref = params.ref.trim();
	if (!ref || ref.includes("/")) return ref;
	const matches = findConfiguredImageModelMatches({
		cfg: params.cfg,
		ref
	});
	if (matches.length === 0) return ref;
	if (matches.length === 1) return matches.at(0) ?? ref;
	throw new Error(`Ambiguous image model "${ref}". Configure a provider-prefixed ref such as ${matches.map((match) => `"${match}"`).join(" or ")}.`);
}
/** Resolves providerless configured image model refs against configured provider models. */
function resolveConfiguredImageModelRefs(params) {
	const primary = params.imageModelConfig.primary?.trim();
	const fallbacks = params.imageModelConfig.fallbacks?.map((ref) => resolveProviderlessConfiguredImageModelRef({
		cfg: params.cfg,
		ref
	})).filter((ref) => ref.length > 0);
	return {
		...params.imageModelConfig.primary !== void 0 ? { primary: primary ? resolveProviderlessConfiguredImageModelRef({
			cfg: params.cfg,
			ref: primary
		}) : primary } : {},
		...fallbacks && fallbacks.length > 0 ? { fallbacks } : {},
		...params.imageModelConfig.timeoutMs !== void 0 ? { timeoutMs: params.imageModelConfig.timeoutMs } : {}
	};
}
/** Returns the configured vision-capable model for a provider, if present. */
function resolveProviderVisionModelFromConfig(params) {
	if (require_minimax_vlm.isMinimaxVlmProvider(params.provider)) return null;
	const id = ((require_model_selection_normalize.findNormalizedProviderValue(params.cfg?.models?.providers, params.provider)?.models ?? []).find((m) => Boolean((m?.id ?? "").trim()) && m.input?.includes("image"))?.id ?? "").trim();
	if (!id) return null;
	const slash = id.indexOf("/");
	const idProvider = slash === -1 ? "" : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(id.slice(0, slash));
	const selectedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.provider);
	return idProvider && idProvider === selectedProvider ? id : `${params.provider}/${id}`;
}
//#endregion
Object.defineProperty(exports, "coerceImageAssistantText", {
	enumerable: true,
	get: function() {
		return coerceImageAssistantText;
	}
});
Object.defineProperty(exports, "coerceImageModelConfig", {
	enumerable: true,
	get: function() {
		return coerceImageModelConfig;
	}
});
Object.defineProperty(exports, "decodeDataUrl", {
	enumerable: true,
	get: function() {
		return decodeDataUrl;
	}
});
Object.defineProperty(exports, "hasImageReasoningOnlyResponse", {
	enumerable: true,
	get: function() {
		return hasImageReasoningOnlyResponse;
	}
});
Object.defineProperty(exports, "resolveConfiguredImageModelRefs", {
	enumerable: true,
	get: function() {
		return resolveConfiguredImageModelRefs;
	}
});
Object.defineProperty(exports, "resolveProviderVisionModelFromConfig", {
	enumerable: true,
	get: function() {
		return resolveProviderVisionModelFromConfig;
	}
});
