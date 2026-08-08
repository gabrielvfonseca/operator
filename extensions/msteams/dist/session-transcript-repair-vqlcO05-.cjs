const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_tool_call_id = require("./tool-call-id-Bp1wJF0F.cjs");
const require_tool_call_shared = require("./tool-call-shared-BusxbfAk.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_provider_http_errors = require("./provider-http-errors-BAaO_toA.cjs");
const require_provider_attribution = require("./provider-attribution-CIUHVFNx.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
const require_provider_secret_egress = require("./provider-secret-egress-NB6SfEEF.cjs");
const require_guarded_body_stream = require("./guarded-body-stream-DhRdFzIG.cjs");
const require_env = require("./env-DVKZI9SP.cjs");
const require_provider_local_service = require("./provider-local-service-BG5N87JZ.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_ip = require("@gabrielvfonseca/net-policy/ip");
let _gabrielvfonseca_ai_internal_runtime = require("@gabrielvfonseca/ai/internal/runtime");
let _gabrielvfonseca_ai_providers = require("@gabrielvfonseca/ai/providers");
let _gabrielvfonseca_ai = require("@gabrielvfonseca/ai");
let _gabrielvfonseca_ai_internal_retry_after = require("@gabrielvfonseca/ai/internal/retry-after");
//#region src/agents/openai-strict-tool-setting.ts
/**
* Strict tool-schema default resolution for native OpenAI-compatible routes.
*
* Compatible providers can support strict schemas without inheriting OpenAI's required default.
*/
const optionalString = _gabrielvfonseca_normalization_core_string_coerce.readStringValue;
function resolvesToNativeOpenAIStrictTools(model, transport) {
	const capabilities = require_provider_attribution.resolveProviderRequestCapabilities({
		provider: optionalString(model.provider),
		api: optionalString(model.api),
		baseUrl: optionalString(model.baseUrl),
		capability: "llm",
		transport,
		modelId: optionalString(model.id),
		compat: model.compat
	});
	if (!capabilities.usesKnownNativeOpenAIRoute) return false;
	return capabilities.provider === "openai" || capabilities.provider === "azure-openai" || capabilities.provider === "azure-openai-responses";
}
/** Resolve the strict-tool setting for one OpenAI-compatible model/transport. */
function resolveOpenAIStrictToolSetting(model, options) {
	if (resolvesToNativeOpenAIStrictTools(model, options?.transport ?? "stream")) return true;
	if (options?.supportsStrictMode) return false;
}
//#endregion
//#region src/agents/model-transport-debug.ts
function normalizeEnv(value) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function isTruthyEnv(value) {
	const normalized = normalizeEnv(value);
	return normalized.length > 0 && normalized !== "0" && normalized !== "false" && normalized !== "off" && normalized !== "no";
}
/** Resolves model payload debug verbosity from `OPERATOR_DEBUG_MODEL_PAYLOAD`. */
function resolveModelPayloadDebugMode(env = process.env) {
	const normalized = normalizeEnv(env.OPERATOR_DEBUG_MODEL_PAYLOAD);
	if (normalized === "tools" || normalized === "full-redacted") return normalized;
	if (normalized === "summary") return "summary";
	return "off";
}
/** Resolves SSE stream debug verbosity from `OPERATOR_DEBUG_SSE`. */
function resolveModelSseDebugMode(env = process.env) {
	const normalized = normalizeEnv(env.OPERATOR_DEBUG_SSE);
	if (normalized === "peek") return "peek";
	if (normalized === "events" || isTruthyEnv(normalized)) return "events";
	return "off";
}
/** Returns whether any model transport debug channel is enabled. */
function isModelTransportDebugEnabled(env = process.env) {
	return isTruthyEnv(env.OPERATOR_DEBUG_MODEL_TRANSPORT) || resolveModelPayloadDebugMode(env) !== "off" || resolveModelSseDebugMode(env) !== "off" || isTruthyEnv(env.OPERATOR_DEBUG_CODE_MODE);
}
function isModelFetchMetadataMessage(message) {
	return message.startsWith("[model-fetch]");
}
/** Emits model-fetch metadata at info level by default; other diagnostics require debug env. */
function emitModelTransportDebug(log, message) {
	if (isModelFetchMetadataMessage(message) || isModelTransportDebugEnabled()) {
		log.info(message);
		return;
	}
	log.debug(message);
}
//#endregion
//#region src/agents/model-transport-url.ts
/**
* Debug formatting helpers for model transport endpoints.
* Keeps logs useful without exposing credentials, request params, or fragments.
*/
/** Return a sanitized URL suitable for logs and diagnostics. */
function formatModelTransportDebugUrl(rawUrl) {
	try {
		const parsed = new URL(rawUrl);
		parsed.username = "";
		parsed.password = "";
		parsed.search = "";
		parsed.hash = "";
		return parsed.toString();
	} catch {
		return "<invalid-url>";
	}
}
/** Format a configured base URL for debug output, or the implicit default. */
function formatModelTransportDebugBaseUrl(rawUrl) {
	return rawUrl ? formatModelTransportDebugUrl(rawUrl) : "default";
}
//#endregion
//#region src/agents/provider-transport-fetch.ts
/**
* Guarded provider fetch transport utilities.
*
* Applies request timeouts, proxy/TLS overrides, SSRF policy, local-service leases, retry hints, and SSE normalization.
*/
const DEFAULT_MAX_SDK_RETRY_WAIT_SECONDS = 60;
const OPENAI_SDK_STREAM_CONTENT_SNIFF_BYTES = 2 * 1024;
const log = require_subsystem.createSubsystemLogger("provider-transport-fetch");
/** Max bytes for an entire JSON body synthesized into SSE frames. Prevents OOM
*  when a hostile streaming endpoint returns a never-ending JSON response
*  without Content-Length. */
const SSE_SYNTHESIZE_JSON_MAX_BYTES = 16 * 1024 * 1024;
/** Max bytes read from a non-OK response body before truncation. */
const SSE_NONOK_BODY_MAX_BYTES = 64 * 1024;
/** Max decoded characters buffered while waiting for the next SSE event boundary. */
const SSE_SANITIZE_BUFFER_MAX_CHARS = 16 * 1024 * 1024;
const BLOCKED_EXACT_ORIGIN_TRUST_HOSTNAME_LABELS = /* @__PURE__ */ new Set(["instance-data"]);
const PLAIN_DECIMAL_NUMBER_RE = /^\d+(?:\.\d+)?$/;
function hasReadableSseData(block) {
	const dataLines = block.split(/\r\n|\n|\r/).filter((line) => line === "data" || line.startsWith("data:")).map((line) => {
		if (line === "data") return "";
		const value = line.slice(5);
		return value.startsWith(" ") ? value.slice(1) : value;
	});
	return dataLines.length > 0 && dataLines.join("\n").trim().length > 0;
}
function findSseEventBoundary(buffer) {
	let best;
	for (const delimiter of [
		"\r\n\r\n",
		"\n\n",
		"\r\r"
	]) {
		const index = buffer.indexOf(delimiter);
		if (index === -1) continue;
		if (!best || index < best.index) best = {
			index,
			length: delimiter.length
		};
	}
	return best;
}
function capNonOkResponseBodyLazily(response, maxBytes) {
	const source = response.body;
	if (!source) return response;
	let reader;
	let total = 0;
	const capped = new ReadableStream({
		start() {
			reader = source.getReader();
		},
		async pull(controller) {
			try {
				const chunk = await reader?.read();
				if (!chunk || chunk.done) {
					controller.close();
					return;
				}
				const remaining = maxBytes - total;
				if (chunk.value.byteLength > remaining) {
					if (remaining > 0) controller.enqueue(chunk.value.subarray(0, remaining));
					total = maxBytes;
					controller.close();
					reader?.cancel().catch(() => void 0);
					return;
				}
				total += chunk.value.byteLength;
				controller.enqueue(chunk.value);
			} catch (error) {
				controller.error(error);
				reader?.cancel(error).catch(() => void 0);
			}
		},
		async cancel(reason) {
			await reader?.cancel(reason).catch(() => void 0);
		}
	});
	return new Response(capped, response);
}
function sanitizeOpenAISdkSseResponse(response, options) {
	const contentType = response.headers.get("content-type") ?? "";
	if (!response.body) return response;
	if (!response.ok) return capNonOkResponseBodyLazily(response, SSE_NONOK_BODY_MAX_BYTES);
	if (options?.synthesizeJsonAsSse === true && (/\bapplication\/json\b/i.test(contentType) || /\+json\b/i.test(contentType))) {
		const source = response.body;
		const decoder = new TextDecoder();
		const encoder = new TextEncoder();
		let reader;
		let buffer = "";
		let totalBytes = 0;
		const sseBody = new ReadableStream({
			start() {
				reader = source.getReader();
			},
			async pull(controller) {
				try {
					for (;;) {
						const chunk = await reader?.read();
						if (!chunk || chunk.done) {
							buffer += decoder.decode();
							const data = buffer.trim();
							if (data) controller.enqueue(encoder.encode(`data: ${data}\n\n`));
							controller.enqueue(encoder.encode("data: [DONE]\n\n"));
							controller.close();
							return;
						}
						const nextTotalBytes = totalBytes + chunk.value.byteLength;
						if (nextTotalBytes > SSE_SYNTHESIZE_JSON_MAX_BYTES) throw new Error(`Streaming JSON body exceeded ${SSE_SYNTHESIZE_JSON_MAX_BYTES} bytes while synthesizing SSE frames`);
						totalBytes = nextTotalBytes;
						buffer += decoder.decode(chunk.value, { stream: true });
					}
				} catch (error) {
					await reader?.cancel(error).catch(() => {});
					controller.error(error);
				}
			},
			async cancel(reason) {
				await reader?.cancel(reason);
			}
		});
		const headers = new Headers(response.headers);
		headers.set("content-type", "text/event-stream; charset=utf-8");
		return new Response(sseBody, {
			status: response.status,
			statusText: response.statusText,
			headers
		});
	}
	if (!/\btext\/event-stream\b/i.test(contentType)) return response;
	const source = response.body;
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	let reader;
	let buffer = "";
	const enqueueSanitized = (controller, text) => {
		let enqueued = 0;
		buffer += text;
		for (;;) {
			const boundary = findSseEventBoundary(buffer);
			if (!boundary) {
				if (buffer.length > SSE_SANITIZE_BUFFER_MAX_CHARS) throw new Error(`SSE response exceeded max buffer size (${SSE_SANITIZE_BUFFER_MAX_CHARS} chars) without event boundary`);
				return enqueued;
			}
			const block = buffer.slice(0, boundary.index);
			const separator = buffer.slice(boundary.index, boundary.index + boundary.length);
			buffer = buffer.slice(boundary.index + boundary.length);
			if (hasReadableSseData(block)) {
				controller.enqueue(encoder.encode(`${block}${separator}`));
				enqueued += 1;
				return enqueued;
			}
		}
	};
	const sanitizedBody = new ReadableStream({
		start() {
			reader = source.getReader();
		},
		async pull(controller) {
			try {
				for (;;) {
					if (enqueueSanitized(controller, "") > 0) return;
					const chunk = await reader?.read();
					if (!chunk || chunk.done) {
						const tail = decoder.decode();
						if (tail) enqueueSanitized(controller, tail);
						if (buffer && hasReadableSseData(buffer)) controller.enqueue(encoder.encode(buffer));
						buffer = "";
						controller.close();
						return;
					}
					if (enqueueSanitized(controller, decoder.decode(chunk.value, { stream: true })) > 0) return;
				}
			} catch (error) {
				await reader?.cancel(error).catch(() => {});
				controller.error(error);
			}
		},
		async cancel(reason) {
			await reader?.cancel(reason);
		}
	});
	return new Response(sanitizedBody, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}
function shouldSanitizeOpenAISdkSseResponse(model) {
	if (model.provider !== "openai") return true;
	try {
		return new URL(model.baseUrl).hostname.toLowerCase() !== "api.openai.com";
	} catch {
		return true;
	}
}
function isJsonContentType(contentType) {
	return /\bapplication\/json\b/i.test(contentType) || /\+json\b/i.test(contentType);
}
function classifyOpenAISdkStreamBodyPrefix(text) {
	const trimmed = text.replace(/^\uFEFF/u, "").trimStart();
	if (!trimmed) return "unknown";
	if (trimmed.startsWith("<")) return "html";
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
	if (/^(?::|(?:data|event|id|retry)(?::|\r?\n|\r))/u.test(trimmed)) return "sse";
	const boundary = findSseEventBoundary(text);
	if (boundary && hasReadableSseData(text.slice(0, boundary.index))) return "sse";
	return "unknown";
}
async function classifyOpenAISdkStreamBody(response) {
	const reader = response.clone().body?.getReader();
	if (!reader) return "unknown";
	const decoder = new TextDecoder();
	let total = 0;
	let text = "";
	try {
		while (total < OPENAI_SDK_STREAM_CONTENT_SNIFF_BYTES) {
			const { value, done } = await reader.read();
			if (done) break;
			if (!value || value.byteLength === 0) continue;
			const remaining = OPENAI_SDK_STREAM_CONTENT_SNIFF_BYTES - total;
			const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
			total += chunk.byteLength;
			text += decoder.decode(chunk, { stream: true });
			const kind = classifyOpenAISdkStreamBodyPrefix(text);
			if (kind !== "unknown") return kind;
		}
		text += decoder.decode();
		return classifyOpenAISdkStreamBodyPrefix(text);
	} finally {
		reader.cancel().catch(() => void 0);
	}
}
function withOpenAISdkStreamContentType(response, contentType) {
	const headers = new Headers(response.headers);
	headers.set("content-type", contentType);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
async function normalizeOpenAISdkStreamContentType(params) {
	const contentType = params.response.headers.get("content-type") ?? "";
	if (!params.response.ok || !params.response.body) return params.response;
	if (/\btext\/event-stream\b/i.test(contentType)) return params.response;
	if (isJsonContentType(contentType)) {
		if (await classifyOpenAISdkStreamBody(params.response).catch(() => "unknown") === "sse") return withOpenAISdkStreamContentType(params.response, "text/event-stream; charset=utf-8");
		return params.response;
	}
	if (!contentType.trim()) {
		const kind = await classifyOpenAISdkStreamBody(params.response).catch(() => "unknown");
		if (kind === "sse") return withOpenAISdkStreamContentType(params.response, "text/event-stream; charset=utf-8");
		if (kind === "json") return withOpenAISdkStreamContentType(params.response, "application/json; charset=utf-8");
	}
	const body = await require_provider_http_errors.readResponseTextLimited(params.response).catch(() => "");
	await params.release().catch(() => void 0);
	params.localServiceLease?.release();
	const hint = `OpenAI-compatible streamed responses must be text/event-stream or JSON; got ${contentType || "missing content-type"}. Check the provider baseUrl; OpenAI-compatible APIs commonly require a /v1 path prefix.`;
	throw new require_provider_http_errors.ProviderHttpError(`${params.model.provider}/${params.model.id}: ${hint}`, {
		status: params.response.status,
		code: "invalid_provider_content_type",
		type: "invalid_response",
		body
	});
}
async function requestBodyHasStreamTrue(request, init) {
	const method = request?.method ?? init?.method;
	if (method && method.toUpperCase() !== "POST") return false;
	const contentType = (request?.headers ?? new Headers(init?.headers)).get("content-type") ?? "";
	if (contentType && !/\bapplication\/json\b/i.test(contentType)) return false;
	let text;
	if (typeof init?.body === "string") text = init.body;
	if (!text) return false;
	try {
		return JSON.parse(text).stream === true;
	} catch {
		return false;
	}
}
function parseRetryAfterSeconds(headers) {
	const retryAfterMs = headers.get("retry-after-ms");
	if (retryAfterMs) {
		const trimmedRetryAfterMs = retryAfterMs.trim();
		if (/^\d+(?:\.\d+)?$/.test(trimmedRetryAfterMs)) {
			const milliseconds = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumberInRange)((0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictFiniteNumber)(trimmedRetryAfterMs), {
				min: 0,
				max: Number.MAX_SAFE_INTEGER
			});
			return milliseconds === void 0 ? Number.POSITIVE_INFINITY : milliseconds / 1e3;
		}
	}
	const retryAfter = headers.get("retry-after");
	if (!retryAfter) return;
	const trimmedRetryAfterSeconds = retryAfter.trim();
	if (/^\d+$/.test(trimmedRetryAfterSeconds)) return (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictNonNegativeInteger)(trimmedRetryAfterSeconds) ?? Number.POSITIVE_INFINITY;
	const retryAt = (0, _gabrielvfonseca_ai_internal_retry_after.parseRetryAfterHttpDateMs)(trimmedRetryAfterSeconds);
	if (retryAt === void 0) return;
	return Math.max(0, (retryAt - Date.now()) / 1e3);
}
function resolveMaxSdkRetryWaitSeconds() {
	const raw = process.env.OPERATOR_SDK_RETRY_MAX_WAIT_SECONDS?.trim();
	if (!raw) return DEFAULT_MAX_SDK_RETRY_WAIT_SECONDS;
	if (/^(?:0|false|off|none|disabled)$/i.test(raw)) return;
	if (!PLAIN_DECIMAL_NUMBER_RE.test(raw)) return DEFAULT_MAX_SDK_RETRY_WAIT_SECONDS;
	const seconds = (0, _gabrielvfonseca_normalization_core_number_coercion.asFiniteNumberInRange)((0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictFiniteNumber)(raw), {
		min: 0,
		minExclusive: true,
		max: Number.MAX_SAFE_INTEGER
	});
	if (seconds !== void 0) return seconds;
	return DEFAULT_MAX_SDK_RETRY_WAIT_SECONDS;
}
function shouldBypassLongSdkRetry(response) {
	const maxWaitSeconds = resolveMaxSdkRetryWaitSeconds();
	if (maxWaitSeconds === void 0) return false;
	const status = response.status;
	if (!(status === 408 || status === 409 || status === 429 || status >= 500)) return false;
	const retryAfterSeconds = parseRetryAfterSeconds(response.headers);
	if (retryAfterSeconds !== void 0) return retryAfterSeconds > maxWaitSeconds;
	return status === 429;
}
function buildManagedResponse(response, release, refreshTimeout, localServiceLease) {
	const finalizeLocalServiceLease = () => {
		localServiceLease?.release();
	};
	if (!response.body) {
		release().finally(finalizeLocalServiceLease);
		return response;
	}
	const wrappedBody = require_guarded_body_stream.wrapGuardedBodyStream({
		body: response.body,
		cleanup: async () => {
			try {
				await release().catch(() => void 0);
			} finally {
				finalizeLocalServiceLease();
			}
		},
		refreshTimeout
	});
	return new Response(wrappedBody, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}
function resolveModelRequestPolicy(model) {
	const debugProxy = require_env.resolveDebugProxySettings();
	let explicitDebugProxyUrl;
	if (debugProxy.enabled && debugProxy.proxyUrl) try {
		if (new URL(model.baseUrl).protocol === "https:") explicitDebugProxyUrl = debugProxy.proxyUrl;
	} catch {}
	const request = require_provider_request_config.mergeModelProviderRequestOverrides(require_provider_request_config.getModelProviderRequestTransport(model), { proxy: explicitDebugProxyUrl ? {
		mode: "explicit-proxy",
		url: explicitDebugProxyUrl
	} : void 0 });
	return require_provider_request_config.resolveProviderRequestPolicyConfig({
		provider: model.provider,
		api: model.api,
		baseUrl: model.baseUrl,
		capability: "llm",
		transport: "stream",
		request
	});
}
function resolveModelRequestTimeoutMs(model, timeoutMs) {
	if (timeoutMs !== void 0) return typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs > 0 ? (0, _gabrielvfonseca_normalization_core_number_coercion.clampTimerTimeoutMs)(timeoutMs) : void 0;
	const modelTimeoutMs = model.requestTimeoutMs;
	return typeof modelTimeoutMs === "number" && Number.isFinite(modelTimeoutMs) && modelTimeoutMs > 0 ? (0, _gabrielvfonseca_normalization_core_number_coercion.clampTimerTimeoutMs)(modelTimeoutMs) : void 0;
}
function buildModelRequestSignal(baseSignal, timeoutMs) {
	if (timeoutMs === void 0) return baseSignal;
	const timeoutSignal = AbortSignal.timeout(timeoutMs);
	if (!baseSignal) return timeoutSignal;
	return AbortSignal.any([baseSignal, timeoutSignal]);
}
function resolveHttpOrigin(value) {
	if (typeof value !== "string" || !value.trim()) return;
	try {
		const parsed = new URL(value);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
		parsed.hostname = parsed.hostname.replace(/\.+$/, "");
		return parsed.origin.toLowerCase();
	} catch {
		return;
	}
}
function normalizeProviderOriginHostname(value) {
	if (typeof value !== "string" || !value.trim()) return;
	try {
		const parsed = new URL(value);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
		return parsed.hostname.trim().toLowerCase().replace(/\.+$/, "") || void 0;
	} catch {
		return;
	}
}
function canImplicitlyTrustConfiguredBaseUrlOrigin(value) {
	const hostname = normalizeProviderOriginHostname(value);
	if (!hostname) return false;
	return !hostname.split(".").filter(Boolean).some((label) => label.includes("metadata") || BLOCKED_EXACT_ORIGIN_TRUST_HOSTNAME_LABELS.has(label)) && !(0, _gabrielvfonseca_net_policy_ip.isLinkLocalIpAddress)(hostname) && !(0, _gabrielvfonseca_net_policy_ip.isCloudMetadataIpAddress)(hostname);
}
function canApplyFakeIpHostnamePolicy(value) {
	const hostname = normalizeProviderOriginHostname(value);
	if (!hostname) return false;
	return !hostname.split(".").filter(Boolean).some((label) => label.includes("metadata") || BLOCKED_EXACT_ORIGIN_TRUST_HOSTNAME_LABELS.has(label)) && !(0, _gabrielvfonseca_net_policy_ip.parseCanonicalIpAddress)(hostname);
}
function resolveProviderTransportSsrFPolicy(params) {
	const baseUrl = params.baseUrl;
	const baseOrigin = resolveHttpOrigin(baseUrl);
	const requestOrigin = resolveHttpOrigin(params.url);
	const requestMatchesBaseOrigin = typeof baseUrl === "string" && Boolean(baseOrigin) && requestOrigin === baseOrigin;
	return require_fetch_guard.mergeSsrFPolicies(requestMatchesBaseOrigin && params.trustConfiguredBaseUrlOrigin && canImplicitlyTrustConfiguredBaseUrlOrigin(baseUrl) ? require_fetch_guard.ssrfPolicyFromHttpBaseUrlAllowedOrigin(baseUrl) : void 0, requestMatchesBaseOrigin && canApplyFakeIpHostnamePolicy(baseUrl) ? require_fetch_guard.ssrfPolicyFromHttpBaseUrlFakeIpHostnameAllowlist(baseUrl) : void 0, params.allowPrivateNetwork ? { allowPrivateNetwork: true } : void 0);
}
function headersContainSecretSentinel(headers) {
	if (!headers) return false;
	for (const value of new Headers(headers).values()) if (require_provider_secret_egress.containsSecretSentinel(value)) return true;
	return false;
}
function swapSecretSentinelsInUrl(url) {
	if (!require_provider_secret_egress.containsSecretSentinel(url)) return {
		text: url,
		unknown: []
	};
	const unknown = /* @__PURE__ */ new Set();
	return {
		text: url.replace(new RegExp(require_provider_secret_egress.SECRET_SENTINEL_PATTERN.source, "g"), (sentinel) => {
			const value = require_provider_secret_egress.resolveSecretSentinel(sentinel);
			if (value === void 0) {
				unknown.add(sentinel);
				return sentinel;
			}
			return encodeURIComponent(value);
		}),
		unknown: [...unknown]
	};
}
function swapSecretSentinelsForEgress(params) {
	if (!require_provider_secret_egress.containsSecretSentinel(params.url) && !headersContainSecretSentinel(params.headers)) return { url: params.url };
	const urlSwap = swapSecretSentinelsInUrl(params.url);
	const headers = params.headers ? new Headers(params.headers) : void 0;
	const unknown = new Set(urlSwap.unknown);
	if (headers) for (const [name, value] of headers.entries()) {
		const swapped = require_provider_secret_egress.swapSecretSentinelsInText(value);
		headers.set(name, swapped.text);
		for (const sentinel of swapped.unknown) unknown.add(sentinel);
	}
	const unresolved = unknown.values().next().value;
	if (unresolved) throw new Error(`Secret sentinel ${unresolved} is not registered in this process; refusing to send request`);
	return {
		url: urlSwap.text,
		...headers ? { headers } : {}
	};
}
function buildGuardedModelFetch(model, timeoutMs, options) {
	const requestConfig = resolveModelRequestPolicy(model);
	const dispatcherPolicy = require_provider_request_config.buildProviderRequestDispatcherPolicy(requestConfig);
	const requestTimeoutMs = resolveModelRequestTimeoutMs(model, timeoutMs);
	const summarizeError = (error) => {
		if (!error || typeof error !== "object") return `type=${typeof error}`;
		const record = error;
		const cause = record.cause && typeof record.cause === "object" ? record.cause : void 0;
		const read = (value) => typeof value === "string" ? value : typeof value;
		return [
			`name=${read(record.name)}`,
			`code=${read(record.code)}`,
			`causeName=${read(cause?.name)}`,
			`causeCode=${read(cause?.code)}`,
			`message=${error instanceof Error ? error.message : read(record.message)}`
		].join(" ");
	};
	return async (input, init) => {
		let localServiceLease;
		const request = input instanceof Request ? new Request(input, init) : void 0;
		const rawUrl = request?.url ?? (input instanceof URL ? input.toString() : typeof input === "string" ? input : (() => {
			throw new Error("Unsupported fetch input for transport-aware model request");
		})());
		const rawHeaders = request?.headers ?? init?.headers;
		const swappedEgress = swapSecretSentinelsForEgress({
			url: rawUrl,
			headers: rawHeaders
		});
		const url = swappedEgress.url;
		const policy = resolveProviderTransportSsrFPolicy({
			baseUrl: model.baseUrl,
			url,
			allowPrivateNetwork: requestConfig.allowPrivateNetwork,
			trustConfiguredBaseUrlOrigin: !requestConfig.privateNetworkExplicitlyDenied && (requestConfig.policy?.endpointClass === "custom" || requestConfig.policy?.endpointClass === "local")
		});
		const baseInit = (request && {
			method: request.method,
			headers: swappedEgress.headers ?? request.headers,
			body: request.body ?? void 0,
			redirect: request.redirect,
			signal: request.signal,
			...request.body ? { duplex: "half" } : {}
		}) ?? (swappedEgress.headers && init ? {
			...init,
			headers: swappedEgress.headers
		} : init);
		const synthesizeJsonAsSse = await requestBodyHasStreamTrue(request, baseInit);
		const baseSignal = baseInit?.signal ?? void 0;
		const localServiceSignal = buildModelRequestSignal(baseSignal, requestTimeoutMs);
		const guardedFetchOptions = {
			url,
			init: baseInit,
			capture: { meta: {
				provider: model.provider,
				api: model.api,
				model: model.id
			} },
			dispatcherPolicy,
			timeoutMs: requestTimeoutMs,
			...baseSignal ? { signal: baseSignal } : {},
			allowCrossOriginUnsafeRedirectReplay: false,
			...policy ? { policy } : {}
		};
		let result;
		const fetchStartedAt = Date.now();
		const useEnvProxy = !dispatcherPolicy && require_undici_global_dispatcher.shouldUseEnvHttpProxyForUrl(url);
		emitModelTransportDebug(log, `[model-fetch] start provider=${model.provider} api=${model.api} model=${model.id} method=${baseInit?.method ?? "GET"} url=${formatModelTransportDebugUrl(rawUrl)} timeoutMs=${requestTimeoutMs} proxy=${dispatcherPolicy ? "configured" : useEnvProxy ? "env" : "none"} policy=${policy ? "custom" : "default"}`);
		try {
			localServiceLease = await require_provider_local_service.ensureModelProviderLocalService(model, rawHeaders, localServiceSignal);
			result = await require_fetch_guard.fetchWithSsrFGuard(useEnvProxy ? require_fetch_guard.withTrustedEnvProxyGuardedFetchMode(guardedFetchOptions) : guardedFetchOptions);
		} catch (error) {
			log.warn(`[model-fetch] error provider=${model.provider} api=${model.api} model=${model.id} elapsedMs=${Date.now() - fetchStartedAt} ${summarizeError(error)}`);
			localServiceLease?.release();
			throw error;
		}
		let response = result.response;
		emitModelTransportDebug(log, `[model-fetch] response provider=${model.provider} api=${model.api} model=${model.id} status=${response.status} elapsedMs=${Date.now() - fetchStartedAt} contentType=${response.headers.get("content-type") ?? ""}`);
		if (shouldBypassLongSdkRetry(response)) {
			const headers = new Headers(response.headers);
			headers.set("x-should-retry", "false");
			response = new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers
			});
		}
		if (synthesizeJsonAsSse && options?.sanitizeSse !== false) response = await normalizeOpenAISdkStreamContentType({
			response,
			model,
			release: result.release,
			localServiceLease
		});
		response = buildManagedResponse(response, result.release, result.refreshTimeout, localServiceLease);
		return options?.sanitizeSse === false || !shouldSanitizeOpenAISdkSseResponse(model) ? response : sanitizeOpenAISdkSseResponse(response, { synthesizeJsonAsSse });
	};
}
//#endregion
//#region src/llm/ai-transport-host.ts
const transportLogBySubsystem = /* @__PURE__ */ new Map();
function transportLog(subsystem) {
	let log = transportLogBySubsystem.get(subsystem);
	if (!log) {
		log = require_subsystem.createSubsystemLogger(subsystem);
		transportLogBySubsystem.set(subsystem, log);
	}
	return log;
}
(0, _gabrielvfonseca_ai.configureAiTransportHost)({
	buildModelFetch: buildGuardedModelFetch,
	resolveSecretSentinel: (value) => {
		const swapped = require_provider_secret_egress.swapSecretSentinelsInText(value);
		const unknown = swapped.unknown[0];
		if (unknown) throw new Error(`Secret sentinel ${unknown} is not registered in this process; refusing to construct provider client`);
		return swapped.text;
	},
	redactSecrets: require_redact.redactSecrets,
	redactToolPayloadText: require_redact.redactToolPayloadText,
	resolveOpenAIStrictToolSetting,
	logDebug: (subsystem, build) => {
		const log = transportLog(subsystem);
		if (!log.isEnabled("debug", "any")) return;
		const entry = build();
		if (entry) log.debug(entry.message, entry.data);
	}
});
//#endregion
//#region src/llm/stream.ts
(0, _gabrielvfonseca_ai_providers.registerBuiltInApiProviders)(_gabrielvfonseca_ai_internal_runtime.defaultApiRegistry);
//#endregion
//#region src/llm/utils/event-stream.ts
var event_stream_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({});
require_rolldown_runtime.__reExport(event_stream_exports, require("@gabrielvfonseca/ai/event-stream"));
//#endregion
//#region src/agents/session-transcript-repair.ts
/**
* Transcript repair helpers for tool-call replay.
*
* Normalizes raw tool-call blocks and synthesizes missing tool results without rewriting trusted local payloads.
*/
const RAW_TOOL_CALL_BLOCK_TYPES = /* @__PURE__ */ new Set([
	"toolCall",
	"toolUse",
	"functionCall",
	"tool_call",
	"tool_use",
	"function_call"
]);
function isRawToolCallBlock(block) {
	if (!block || typeof block !== "object") return false;
	const type = block.type;
	return typeof type === "string" && RAW_TOOL_CALL_BLOCK_TYPES.has(type);
}
function hasToolCallInput(block) {
	const hasInput = "input" in block ? block.input !== void 0 && block.input !== null : false;
	const hasArguments = "arguments" in block ? block.arguments !== void 0 && block.arguments !== null : false;
	return hasInput || hasArguments;
}
function hasToolCallId(block) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.hasNonEmptyString)(block.id) || (0, _gabrielvfonseca_normalization_core_string_coerce.hasNonEmptyString)(block.call_id) || (0, _gabrielvfonseca_normalization_core_string_coerce.hasNonEmptyString)(block.toolCallId) || (0, _gabrielvfonseca_normalization_core_string_coerce.hasNonEmptyString)(block.toolUseId) || (0, _gabrielvfonseca_normalization_core_string_coerce.hasNonEmptyString)(block.tool_call_id) || (0, _gabrielvfonseca_normalization_core_string_coerce.hasNonEmptyString)(block.tool_use_id);
}
function hasPartialJson(block) {
	return typeof block.partialJson === "string";
}
function isCompleteJsonObject(value) {
	try {
		const parsed = JSON.parse(value);
		return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
	} catch {
		return false;
	}
}
function isFinalizedOpenAIResponsesToolCall(message, block) {
	if (message.role !== "assistant" || !("stopReason" in message) || message.stopReason !== "toolUse" || !hasPartialJson(block) || typeof block.id !== "string" || "input" in block || !block.arguments || typeof block.arguments !== "object" || Array.isArray(block.arguments) || !isCompleteJsonObject(block.partialJson) && (block.partialJson.trim() !== "" || Object.keys(block.arguments).length > 0)) return false;
	const separator = block.id.indexOf("|");
	return separator > 0 && separator < block.id.length - 1;
}
function sanitizeToolCallBlock(block) {
	const rawName = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(block.name);
	const trimmedName = rawName?.trim();
	const hasTrimmedName = typeof trimmedName === "string" && trimmedName.length > 0;
	const normalizedName = hasTrimmedName ? trimmedName : void 0;
	const nameChanged = hasTrimmedName && rawName !== trimmedName;
	if (!nameChanged) return block;
	const next = { ...block };
	if (nameChanged && normalizedName) next.name = normalizedName;
	return next;
}
function countRawToolCallBlocks(content) {
	let count = 0;
	for (const block of content) if (isRawToolCallBlock(block)) count += 1;
	return count;
}
function isReplaySafeThinkingAssistantTurn(content, allowedToolNames) {
	let sawToolCall = false;
	const seenToolCallIds = /* @__PURE__ */ new Set();
	for (const block of content) {
		if (!isRawToolCallBlock(block)) continue;
		sawToolCall = true;
		const toolCallId = typeof block.id === "string" ? block.id.trim() : "";
		if (!hasToolCallInput(block) || hasPartialJson(block) || !toolCallId || seenToolCallIds.has(toolCallId) || !require_tool_call_shared.isAllowedToolCallName(block.name, allowedToolNames)) return false;
		seenToolCallIds.add(toolCallId);
		if (sanitizeToolCallBlock(block) !== block) return false;
	}
	return sawToolCall;
}
function hasSessionsSpawnAttachmentToolCall(content) {
	for (const block of content) {
		if (!isRawToolCallBlock(block) || block.name !== "sessions_spawn") continue;
		const input = block.input;
		if (!input || typeof input !== "object") continue;
		const attachments = input.attachments;
		if (Array.isArray(attachments) && attachments.length > 0) return true;
	}
	return false;
}
const DEFAULT_MISSING_TOOL_RESULT_TEXT = "[openclaw] missing tool result in session history; inserted synthetic error result for transcript repair.";
const SYNTHETIC_MISSING_TOOL_RESULT_DETAIL_KEY = "openclawSyntheticMissingToolResult";
function makeMissingToolResult(params) {
	return {
		role: "toolResult",
		toolCallId: params.toolCallId,
		toolName: params.toolName ?? "unknown",
		content: [{
			type: "text",
			text: params.text ?? DEFAULT_MISSING_TOOL_RESULT_TEXT
		}],
		details: { [SYNTHETIC_MISSING_TOOL_RESULT_DETAIL_KEY]: true },
		isError: true,
		timestamp: Date.now()
	};
}
function isSyntheticMissingToolResult(msg) {
	if (!msg.isError) return false;
	const details = msg.details;
	if (details && typeof details === "object" && details[SYNTHETIC_MISSING_TOOL_RESULT_DETAIL_KEY] === true) return true;
	const content = msg.content;
	if (!Array.isArray(content)) return false;
	return content.some((block) => typeof block === "object" && block !== null && block.type === "text" && block.text === DEFAULT_MISSING_TOOL_RESULT_TEXT);
}
function normalizeToolResultName(message, fallbackName) {
	const rawToolName = message.toolName;
	const normalizedToolName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawToolName);
	if (normalizedToolName) {
		if (rawToolName === normalizedToolName) return message;
		return {
			...message,
			toolName: normalizedToolName
		};
	}
	const normalizedFallback = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(fallbackName);
	if (normalizedFallback) return {
		...message,
		toolName: normalizedFallback
	};
	if (typeof rawToolName === "string") return {
		...message,
		toolName: "unknown"
	};
	return message;
}
function normalizeLegacyToolResultId(message, toolCalls) {
	if (require_tool_call_id.extractToolResultId(message) || toolCalls.length !== 1) return message;
	const [toolCall] = toolCalls;
	if (!toolCall) return message;
	const toolResultName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(message.toolName);
	const toolCallName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(toolCall.name);
	if (toolResultName && toolCallName && toolResultName !== toolCallName) return message;
	return {
		...message,
		toolCallId: toolCall.id,
		isError: true
	};
}
function stripToolResultDetails(messages) {
	let touched = false;
	const out = [];
	for (const msg of messages) {
		if (!msg || typeof msg !== "object" || msg.role !== "toolResult") {
			out.push(msg);
			continue;
		}
		if (!("details" in msg)) {
			out.push(msg);
			continue;
		}
		const sanitized = { ...msg };
		delete sanitized.details;
		touched = true;
		out.push(sanitized);
	}
	return touched ? out : messages;
}
function collectFollowingToolResults(messages, index) {
	const ids = /* @__PURE__ */ new Set();
	const assistant = messages[index];
	const currentToolCalls = assistant && typeof assistant === "object" && assistant.role === "assistant" ? require_tool_call_id.extractToolCallsFromAssistant(assistant) : [];
	let sawNonToolResult = false;
	let displaced = false;
	for (let nextIndex = index + 1; nextIndex < messages.length; nextIndex += 1) {
		const message = messages[nextIndex];
		if (!message || typeof message !== "object") {
			sawNonToolResult = true;
			continue;
		}
		if (message.role === "assistant" && assistantHasToolCalls(message)) break;
		if (message.role === "toolResult") {
			const resultIds = require_tool_call_id.extractToolResultIds(normalizeLegacyToolResultId(message, currentToolCalls));
			for (const id of resultIds) ids.add(id);
			displaced ||= resultIds.length > 0 && sawNonToolResult;
			continue;
		}
		sawNonToolResult = true;
	}
	return {
		ids,
		displaced
	};
}
function repairToolCallInputs(messages, options) {
	let droppedToolCalls = 0;
	let droppedAssistantMessages = 0;
	let changed = false;
	const out = [];
	const allowedToolNames = require_tool_call_shared.normalizeAllowedToolNames(options?.allowedToolNames);
	const allowProviderOwnedThinkingReplay = options?.allowProviderOwnedThinkingReplay === true;
	const preservedThinkingToolCallIds = /* @__PURE__ */ new Set();
	const priorToolCallIds = /* @__PURE__ */ new Set();
	for (const [index, msg] of messages.entries()) {
		if (!msg || typeof msg !== "object") {
			changed = true;
			continue;
		}
		if (msg.role !== "assistant" || !Array.isArray(msg.content)) {
			out.push(msg);
			continue;
		}
		if (allowProviderOwnedThinkingReplay && msg.content.some((block) => require_tool_call_id.isThinkingLikeBlock(block)) && countRawToolCallBlocks(msg.content) > 0) {
			const replaySafeToolCalls = require_tool_call_id.extractToolCallsFromAssistant(msg);
			const followingToolResults = collectFollowingToolResults(messages, index);
			if (isReplaySafeThinkingAssistantTurn(msg.content, allowedToolNames) && replaySafeToolCalls.every((toolCall) => !preservedThinkingToolCallIds.has(toolCall.id) && (!hasSessionsSpawnAttachmentToolCall(msg.content) || followingToolResults.ids.has(toolCall.id)) && (!followingToolResults.displaced || !priorToolCallIds.has(toolCall.id)))) {
				for (const toolCall of replaySafeToolCalls) {
					preservedThinkingToolCallIds.add(toolCall.id);
					priorToolCallIds.add(toolCall.id);
				}
				changed ||= followingToolResults.displaced;
				out.push(msg);
			} else {
				droppedToolCalls += countRawToolCallBlocks(msg.content);
				droppedAssistantMessages += 1;
				changed = true;
			}
			continue;
		}
		const nextContent = [];
		let droppedInMessage = 0;
		let messageChanged = false;
		for (const block of msg.content) {
			if (isRawToolCallBlock(block)) {
				if (!hasToolCallInput(block) || !hasToolCallId(block) || !require_tool_call_shared.isAllowedToolCallName(block.name, allowedToolNames)) {
					droppedToolCalls += 1;
					droppedInMessage += 1;
					changed = true;
					messageChanged = true;
					continue;
				}
			}
			let workBlock = block;
			if (isRawToolCallBlock(block) && hasPartialJson(block)) {
				if (!isFinalizedOpenAIResponsesToolCall(msg, block)) {
					droppedToolCalls += 1;
					droppedInMessage += 1;
					changed = true;
					messageChanged = true;
					continue;
				}
				const stripped = { ...block };
				delete stripped.partialJson;
				workBlock = stripped;
				changed = true;
				messageChanged = true;
			}
			if (isRawToolCallBlock(workBlock)) {
				if (RAW_TOOL_CALL_BLOCK_TYPES.has(workBlock.type ?? "")) {
					if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(typeof workBlock.name === "string" ? workBlock.name.trim() : void 0) === "sessions_spawn") {
						const sanitized = sanitizeToolCallBlock(workBlock);
						if (sanitized !== workBlock) {
							changed = true;
							messageChanged = true;
						}
						nextContent.push(sanitized);
					} else if (typeof workBlock.name === "string") {
						const rawName = workBlock.name;
						const trimmedName = rawName.trim();
						if (rawName !== trimmedName && trimmedName) {
							const renamed = {
								...workBlock,
								name: trimmedName
							};
							nextContent.push(renamed);
							changed = true;
							messageChanged = true;
						} else nextContent.push(workBlock);
					} else nextContent.push(workBlock);
					continue;
				}
			}
			nextContent.push(workBlock);
		}
		if (droppedInMessage > 0) {
			if (nextContent.length === 0) {
				droppedAssistantMessages += 1;
				changed = true;
				continue;
			}
			const nextMessage = {
				...msg,
				content: nextContent
			};
			for (const toolCall of require_tool_call_id.extractToolCallsFromAssistant(nextMessage)) priorToolCallIds.add(toolCall.id);
			out.push(nextMessage);
			continue;
		}
		if (messageChanged) {
			const nextMessage = {
				...msg,
				content: nextContent
			};
			for (const toolCall of require_tool_call_id.extractToolCallsFromAssistant(nextMessage)) priorToolCallIds.add(toolCall.id);
			out.push(nextMessage);
			continue;
		}
		for (const toolCall of require_tool_call_id.extractToolCallsFromAssistant(msg)) priorToolCallIds.add(toolCall.id);
		out.push(msg);
	}
	return {
		messages: changed ? out : messages,
		droppedToolCalls,
		droppedAssistantMessages
	};
}
function sanitizeToolCallInputs(messages, options) {
	return repairToolCallInputs(messages, options).messages;
}
function sanitizeToolUseResultPairing(messages, options) {
	return repairToolUseResultPairing(messages, options).messages;
}
function shouldDropErroredAssistantResults(options) {
	return options?.erroredAssistantResultPolicy === "drop";
}
function assistantHasToolCalls(message) {
	if (!message || typeof message !== "object" || message.role !== "assistant") return false;
	return require_tool_call_id.extractToolCallsFromAssistant(message).length > 0;
}
function collectLaterMatchingToolResults(params) {
	const resultsById = /* @__PURE__ */ new Map();
	const toolCallIds = new Set(params.toolCalls.map((toolCall) => toolCall.id));
	for (let index = params.startIndex; index < params.messages.length; index += 1) {
		const candidate = params.messages[index];
		if (!candidate || typeof candidate !== "object" || candidate.role !== "toolResult") continue;
		const normalizedLegacyResult = normalizeLegacyToolResultId(candidate, params.toolCalls);
		const id = require_tool_call_id.extractToolResultId(normalizedLegacyResult);
		if (!id || !toolCallIds.has(id) || params.seenToolResultIds.has(id) || resultsById.has(id)) continue;
		resultsById.set(id, normalizeToolResultName(normalizedLegacyResult, params.toolNamesById.get(id)));
	}
	return resultsById;
}
function repairToolUseResultPairing(messages, options) {
	const out = [];
	const added = [];
	const seenToolResultIds = /* @__PURE__ */ new Set();
	const toolResultPositions = /* @__PURE__ */ new Map();
	let droppedDuplicateCount = 0;
	let droppedOrphanCount = 0;
	let moved = false;
	let changed = false;
	const pushToolResult = (msg) => {
		const id = require_tool_call_id.extractToolResultId(msg);
		if (id && seenToolResultIds.has(id)) {
			const existingIdx = toolResultPositions.get(id);
			if (existingIdx !== void 0) {
				const existing = out[existingIdx];
				if (existing && isSyntheticMissingToolResult(existing) && !isSyntheticMissingToolResult(msg)) {
					out[existingIdx] = msg;
					const addedIdx = added.findIndex((a) => require_tool_call_id.extractToolResultId(a) === id);
					if (addedIdx !== -1) added.splice(addedIdx, 1);
					droppedDuplicateCount += 1;
					changed = true;
					return;
				}
			}
			droppedDuplicateCount += 1;
			changed = true;
			return;
		}
		if (id) {
			seenToolResultIds.add(id);
			toolResultPositions.set(id, out.length);
		}
		out.push(msg);
	};
	for (let i = 0; i < messages.length; i += 1) {
		const msg = messages.at(i);
		if (!msg || typeof msg !== "object") {
			changed = true;
			continue;
		}
		const role = msg.role;
		if (role !== "assistant") {
			if (role !== "toolResult") out.push(msg);
			else {
				droppedOrphanCount += 1;
				changed = true;
			}
			continue;
		}
		const assistant = msg;
		const toolCalls = require_tool_call_id.extractToolCallsFromAssistant(assistant);
		if (toolCalls.length === 0) {
			out.push(msg);
			continue;
		}
		const toolCallIds = /* @__PURE__ */ new Set();
		const toolCallNamesById = /* @__PURE__ */ new Map();
		for (const toolCall of toolCalls) {
			toolCallIds.add(toolCall.id);
			if (typeof toolCall.name === "string") toolCallNamesById.set(toolCall.id, toolCall.name);
		}
		const spanResultsById = /* @__PURE__ */ new Map();
		const remainder = [];
		let j = i + 1;
		for (; j < messages.length; j += 1) {
			const next = messages.at(j);
			if (!next || typeof next !== "object") {
				changed = true;
				continue;
			}
			const nextRole = next.role;
			if (nextRole === "assistant") {
				if (assistantHasToolCalls(next)) break;
				remainder.push(next);
				continue;
			}
			if (nextRole === "toolResult") {
				const toolResult = normalizeLegacyToolResultId(next, toolCalls);
				const id = require_tool_call_id.extractToolResultId(toolResult);
				if (id && seenToolResultIds.has(id)) {
					pushToolResult(normalizeToolResultName(toolResult, toolCallNamesById.get(id)));
					continue;
				}
				if (id && toolCallIds.has(id)) {
					if (toolResult !== next) changed = true;
					const normalizedToolResult = normalizeToolResultName(toolResult, toolCallNamesById.get(id));
					if (normalizedToolResult !== toolResult) changed = true;
					const existingSpan = spanResultsById.get(id);
					if (!existingSpan) spanResultsById.set(id, normalizedToolResult);
					else if (isSyntheticMissingToolResult(existingSpan) && !isSyntheticMissingToolResult(normalizedToolResult)) {
						spanResultsById.set(id, normalizedToolResult);
						droppedDuplicateCount += 1;
						changed = true;
					} else {
						droppedDuplicateCount += 1;
						changed = true;
					}
					continue;
				}
			}
			if (nextRole !== "toolResult") remainder.push(next);
			else {
				droppedOrphanCount += 1;
				changed = true;
			}
		}
		const stopReason = assistant.stopReason;
		if (stopReason === "error" || stopReason === "aborted") {
			if (!shouldDropErroredAssistantResults(options)) {
				out.push(msg);
				for (const toolCall of toolCalls) {
					const result = spanResultsById.get(toolCall.id);
					if (!result) continue;
					pushToolResult(result);
				}
			} else if (spanResultsById.size > 0) changed = true;
			else changed = true;
			for (const rem of remainder) out.push(rem);
			i = j - 1;
			continue;
		}
		out.push(msg);
		if (spanResultsById.size > 0 && remainder.length > 0) {
			moved = true;
			changed = true;
		}
		const laterResultsById = collectLaterMatchingToolResults({
			messages,
			startIndex: j,
			toolCalls,
			toolNamesById: toolCallNamesById,
			seenToolResultIds
		});
		for (const call of toolCalls) {
			const existing = spanResultsById.get(call.id);
			if (existing) pushToolResult(existing);
			else {
				const laterResult = laterResultsById.get(call.id);
				if (laterResult) {
					laterResultsById.delete(call.id);
					moved = true;
					changed = true;
					pushToolResult(laterResult);
				} else {
					const missing = makeMissingToolResult({
						toolCallId: call.id,
						toolName: call.name,
						text: options?.missingToolResultText
					});
					added.push(missing);
					changed = true;
					pushToolResult(missing);
				}
			}
		}
		for (const rem of remainder) {
			if (!rem || typeof rem !== "object") {
				out.push(rem);
				continue;
			}
			out.push(rem);
		}
		i = j - 1;
	}
	const changedOrMoved = changed || moved;
	return {
		messages: changedOrMoved ? out : messages,
		added,
		droppedDuplicateCount,
		droppedOrphanCount,
		moved: changedOrMoved
	};
}
//#endregion
Object.defineProperty(exports, "buildGuardedModelFetch", {
	enumerable: true,
	get: function() {
		return buildGuardedModelFetch;
	}
});
Object.defineProperty(exports, "emitModelTransportDebug", {
	enumerable: true,
	get: function() {
		return emitModelTransportDebug;
	}
});
Object.defineProperty(exports, "event_stream_exports", {
	enumerable: true,
	get: function() {
		return event_stream_exports;
	}
});
Object.defineProperty(exports, "formatModelTransportDebugBaseUrl", {
	enumerable: true,
	get: function() {
		return formatModelTransportDebugBaseUrl;
	}
});
Object.defineProperty(exports, "makeMissingToolResult", {
	enumerable: true,
	get: function() {
		return makeMissingToolResult;
	}
});
Object.defineProperty(exports, "repairToolUseResultPairing", {
	enumerable: true,
	get: function() {
		return repairToolUseResultPairing;
	}
});
Object.defineProperty(exports, "resolveModelPayloadDebugMode", {
	enumerable: true,
	get: function() {
		return resolveModelPayloadDebugMode;
	}
});
Object.defineProperty(exports, "resolveModelRequestTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveModelRequestTimeoutMs;
	}
});
Object.defineProperty(exports, "resolveModelSseDebugMode", {
	enumerable: true,
	get: function() {
		return resolveModelSseDebugMode;
	}
});
Object.defineProperty(exports, "resolveOpenAIStrictToolSetting", {
	enumerable: true,
	get: function() {
		return resolveOpenAIStrictToolSetting;
	}
});
Object.defineProperty(exports, "resolveProviderTransportSsrFPolicy", {
	enumerable: true,
	get: function() {
		return resolveProviderTransportSsrFPolicy;
	}
});
Object.defineProperty(exports, "sanitizeToolCallInputs", {
	enumerable: true,
	get: function() {
		return sanitizeToolCallInputs;
	}
});
Object.defineProperty(exports, "sanitizeToolUseResultPairing", {
	enumerable: true,
	get: function() {
		return sanitizeToolUseResultPairing;
	}
});
Object.defineProperty(exports, "stripToolResultDetails", {
	enumerable: true,
	get: function() {
		return stripToolResultDetails;
	}
});
