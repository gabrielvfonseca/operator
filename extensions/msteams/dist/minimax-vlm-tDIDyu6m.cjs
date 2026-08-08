const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
require("./utils-CXqBhRFw.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_provider_http_errors = require("./provider-http-errors-BAaO_toA.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/infra/http-error-body.ts
const errorBodyLog = require_subsystem.createSubsystemLogger("http-error-body");
async function readResponseBodySnippet(response, limits) {
	try {
		const body = response.body;
		if (!body || typeof body.getReader !== "function") {
			const text = await response.text();
			const encoded = new TextEncoder().encode(text);
			if (encoded.byteLength > limits.maxBytes) return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)((0, _gabrielvfonseca_normalization_core.decodeTextPrefix)(encoded.subarray(0, limits.maxBytes), { truncated: true }), limits.maxChars);
			return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, limits.maxChars);
		}
		return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)((await require_http_body.readResponseTextPrefix(response, limits.maxBytes)).text, limits.maxChars);
	} catch (err) {
		errorBodyLog.warn(`Failed to read response body snippet: ${require_errors.formatErrorMessage(err)}`);
		return "";
	}
}
//#endregion
//#region src/agents/minimax-vlm.ts
/**
* Adapts MiniMax VLM image-understanding requests for agent image inputs.
*/
const MINIMAX_VLM_ERROR_BODY_MAX_BYTES = 8 * 1024;
const MINIMAX_VLM_ERROR_BODY_MAX_CHARS = 400;
const DEFAULT_MINIMAX_VLM_TIMEOUT_MS = 6e4;
function isMinimaxVlmProvider(provider) {
	const normalized = provider.trim().toLowerCase();
	return normalized === "minimax" || normalized === "minimax-cn" || normalized === "minimax-portal" || normalized === "minimax-portal-cn";
}
function isMinimaxVlmModel(provider, modelId) {
	return isMinimaxVlmProvider(provider) && modelId.trim() === "MiniMax-VL-01";
}
function isMinimaxCnProvider(provider) {
	const normalized = provider?.trim().toLowerCase();
	return normalized === "minimax-cn" || normalized === "minimax-portal-cn";
}
function coerceApiHost(params) {
	const env = params.env ?? process.env;
	const defaultHost = isMinimaxCnProvider(params.provider) ? "https://api.minimaxi.com" : "https://api.minimax.io";
	const raw = params.apiHost?.trim() || env.MINIMAX_API_HOST?.trim() || params.modelBaseUrl?.trim() || defaultHost;
	try {
		return new URL(raw).origin;
	} catch {}
	if (/^[a-z][a-z\d+.-]*:\/\//i.test(raw)) return defaultHost;
	try {
		return new URL(`https://${raw}`).origin;
	} catch {
		return defaultHost;
	}
}
function pickString(rec, key) {
	const v = rec[key];
	return typeof v === "string" ? v : "";
}
async function minimaxUnderstandImage(params) {
	const apiKey = require_normalize_secret_input.normalizeSecretInput(params.apiKey);
	if (!apiKey) throw new Error("MiniMax VLM: apiKey required");
	const prompt = params.prompt.trim();
	if (!prompt) throw new Error("MiniMax VLM: prompt required");
	const imageDataUrl = params.imageDataUrl.trim();
	if (!imageDataUrl) throw new Error("MiniMax VLM: imageDataUrl required");
	if (!/^data:image\/(png|jpeg|webp);base64,/i.test(imageDataUrl)) throw new Error("MiniMax VLM: imageDataUrl must be a base64 data:image/(png|jpeg|webp) URL");
	const host = coerceApiHost({
		apiHost: params.apiHost,
		modelBaseUrl: params.modelBaseUrl,
		provider: params.provider
	});
	const url = new URL("/v1/coding_plan/vlm", host).toString();
	require_undici_global_dispatcher.ensureGlobalUndiciEnvProxyDispatcher();
	const timeoutMs = (0, require_number_coercion.number_coercion_exports.resolvePositiveTimerTimeoutMs)(params.timeoutMs, DEFAULT_MINIMAX_VLM_TIMEOUT_MS);
	const res = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			"MM-API-Source": "Operator"
		},
		signal: AbortSignal.timeout(timeoutMs),
		body: JSON.stringify({
			prompt,
			image_url: imageDataUrl
		})
	});
	const traceId = res.headers.get("Trace-Id") ?? "";
	if (!res.ok) {
		const body = await readResponseBodySnippet(res, {
			maxBytes: MINIMAX_VLM_ERROR_BODY_MAX_BYTES,
			maxChars: MINIMAX_VLM_ERROR_BODY_MAX_CHARS
		});
		const trace = traceId ? ` Trace-Id: ${traceId}` : "";
		throw new Error(`MiniMax VLM request failed (${res.status} ${res.statusText}).${trace}${body ? ` Body: ${body}` : ""}`);
	}
	const json = await require_provider_http_errors.readProviderJsonResponse(res, traceId ? `MiniMax VLM response [Trace-Id=${traceId}]` : "MiniMax VLM response");
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(json)) {
		const trace = traceId ? ` Trace-Id: ${traceId}` : "";
		throw new Error(`MiniMax VLM response was not JSON.${trace}`);
	}
	const baseResp = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(json.base_resp) ? json.base_resp : {};
	const code = typeof baseResp.status_code === "number" ? baseResp.status_code : -1;
	if (code !== 0) {
		const msg = (baseResp.status_msg ?? "").trim();
		const trace = traceId ? ` Trace-Id: ${traceId}` : "";
		throw new Error(`MiniMax VLM API error (${code})${msg ? `: ${msg}` : ""}.${trace}`);
	}
	const content = pickString(json, "content").trim();
	if (!content) {
		const trace = traceId ? ` Trace-Id: ${traceId}` : "";
		throw new Error(`MiniMax VLM returned no content.${trace}`);
	}
	return content;
}
//#endregion
Object.defineProperty(exports, "isMinimaxVlmModel", {
	enumerable: true,
	get: function() {
		return isMinimaxVlmModel;
	}
});
Object.defineProperty(exports, "isMinimaxVlmProvider", {
	enumerable: true,
	get: function() {
		return isMinimaxVlmProvider;
	}
});
Object.defineProperty(exports, "minimaxUnderstandImage", {
	enumerable: true,
	get: function() {
		return minimaxUnderstandImage;
	}
});
Object.defineProperty(exports, "readResponseBodySnippet", {
	enumerable: true,
	get: function() {
		return readResponseBodySnippet;
	}
});
