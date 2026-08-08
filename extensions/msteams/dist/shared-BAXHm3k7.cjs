const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fetch-timeout-C6HLIptD.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_provider_http_errors = require("./provider-http-errors-BAaO_toA.cjs");
const require_operation_retry = require("./operation-retry-DQKBakBo.cjs");
const require_provider_request_config = require("./provider-request-config-BmGl8zwP.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/media-understanding/shared.ts
const DEFAULT_GUARDED_HTTP_TIMEOUT_MS = 6e4;
const MAX_AUDIT_CONTEXT_CHARS = 80;
/** Creates a timer-safe absolute operation deadline from an optional total timeout. */
function createProviderOperationDeadline(params) {
	if (typeof params.timeoutMs !== "number" || !Number.isFinite(params.timeoutMs) || params.timeoutMs <= 0) return { label: params.label };
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(params.timeoutMs, 1);
	return {
		deadlineAtMs: (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(timeoutMs) ?? (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(Date.now()),
		label: params.label,
		timeoutMs
	};
}
/** Resolves a per-request timeout without exceeding the remaining operation deadline. */
function resolveProviderOperationTimeoutMs(params) {
	const defaultTimeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(params.defaultTimeoutMs, 1);
	const deadlineAtMs = params.deadline.deadlineAtMs;
	if (typeof deadlineAtMs !== "number") return defaultTimeoutMs;
	const remainingMs = deadlineAtMs - Date.now();
	if (remainingMs <= 0) throw new Error(`${params.deadline.label} timed out after ${params.deadline.timeoutMs}ms`);
	return Math.max(1, Math.min(defaultTimeoutMs, remainingMs));
}
function resolveGuardedHttpTimeoutMs(timeoutMs) {
	if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0) return DEFAULT_GUARDED_HTTP_TIMEOUT_MS;
	return timeoutMs;
}
function sanitizeAuditContext(auditContext) {
	const cleaned = auditContext?.replace(/\p{Cc}+/gu, " ").replace(/\s+/g, " ").trim();
	if (!cleaned) return;
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(cleaned, MAX_AUDIT_CONTEXT_CHARS);
}
function resolveProviderHttpRequestConfigWithOriginTrustInternal(params) {
	const requestConfig = require_provider_request_config.resolveProviderRequestPolicyConfig({
		provider: params.provider ?? "",
		baseUrl: params.baseUrl,
		defaultBaseUrl: params.defaultBaseUrl,
		capability: params.capability ?? "other",
		transport: params.transport ?? "http",
		callerHeaders: params.headers ? Object.fromEntries(new Headers(params.headers).entries()) : void 0,
		providerHeaders: params.defaultHeaders,
		precedence: "caller-wins",
		allowPrivateNetwork: params.allowPrivateNetwork,
		api: params.api,
		request: params.request
	});
	const headers = new Headers(requestConfig.headers);
	if (!requestConfig.baseUrl) throw new Error("Missing baseUrl: provide baseUrl or defaultBaseUrl");
	return {
		baseUrl: requestConfig.baseUrl,
		allowPrivateNetwork: requestConfig.allowPrivateNetwork,
		headers,
		dispatcherPolicy: require_provider_request_config.buildProviderRequestDispatcherPolicy(requestConfig),
		requestConfig,
		trustConfiguredBaseUrlOrigin: !requestConfig.privateNetworkExplicitlyDenied && (requestConfig.policy.endpointClass === "custom" || requestConfig.policy.endpointClass === "local")
	};
}
function resolveProviderHttpRequestConfigWithOriginTrust(params) {
	return resolveProviderHttpRequestConfigWithOriginTrustInternal(params);
}
/**
* Decide whether to auto-upgrade a provider HTTP request into
* `TRUSTED_ENV_PROXY` mode based on the runtime environment.
*
* This is gated conservatively to avoid the SSRF bypasses the initial
* auto-upgrade path exposed (see openclaw#64974 review threads):
*
* 1. If the caller supplied an explicit `dispatcherPolicy` — custom proxy URL,
*    `proxyTls`, or `connect` options — do NOT override it. Trusted-env mode
*    builds an `EnvHttpProxyAgent` that would silently drop those overrides,
*    breaking enterprise proxy/mTLS configs.
*
* 2. Only auto-upgrade when `HTTP_PROXY` or `HTTPS_PROXY` (lower- or
*    upper-case) is configured for the target protocol. `ALL_PROXY` is
*    explicitly ignored by `EnvHttpProxyAgent`, so counting it would
*    auto-upgrade requests that then make direct connections while skipping
*    pinned-DNS/SSRF hostname checks.
*
* 3. If `NO_PROXY` would bypass the proxy for this target, do NOT auto-upgrade.
*    `EnvHttpProxyAgent` makes direct connections for `NO_PROXY` matches, but
*    in `TRUSTED_ENV_PROXY` mode `fetchWithSsrFGuard` skips
*    `resolvePinnedHostnameWithPolicy` — so those direct connections would
*    bypass SSRF protection. Keep strict mode for `NO_PROXY` matches.
*/
function shouldAutoUpgradeToTrustedEnvProxy(params) {
	if (params.dispatcherPolicy) return false;
	return require_undici_global_dispatcher.shouldUseEnvHttpProxyForUrl(params.url);
}
async function fetchWithTimeoutGuarded(url, init, timeoutMs, fetchFn, options) {
	const resolvedMode = options?.mode ?? (shouldAutoUpgradeToTrustedEnvProxy({
		url,
		dispatcherPolicy: options?.dispatcherPolicy
	}) ? require_fetch_guard.GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY : void 0);
	return await require_fetch_guard.fetchWithSsrFGuard({
		url,
		fetchImpl: fetchFn,
		init,
		timeoutMs: resolveGuardedHttpTimeoutMs(timeoutMs),
		policy: options?.ssrfPolicy,
		lookupFn: options?.lookupFn,
		pinDns: options?.pinDns,
		dispatcherPolicy: options?.dispatcherPolicy,
		auditContext: sanitizeAuditContext(options?.auditContext),
		...resolvedMode ? { mode: resolvedMode } : {}
	});
}
function mergeGuardedRequestSsrfPolicy(params) {
	if (!params.ssrfPolicy) return params.allowPrivateNetwork ? { allowPrivateNetwork: true } : void 0;
	if (!params.allowPrivateNetwork) return params.ssrfPolicy;
	return {
		...params.ssrfPolicy,
		allowPrivateNetwork: true
	};
}
function resolveGuardedRequestOptions(params) {
	if (!params.allowPrivateNetwork && !params.ssrfPolicy && !params.dispatcherPolicy && params.pinDns === void 0 && !params.auditContext && params.mode === void 0) return;
	const ssrfPolicy = mergeGuardedRequestSsrfPolicy(params);
	return {
		...ssrfPolicy ? { ssrfPolicy } : {},
		...params.pinDns !== void 0 ? { pinDns: params.pinDns } : {},
		...params.dispatcherPolicy ? { dispatcherPolicy: params.dispatcherPolicy } : {},
		...params.auditContext ? { auditContext: params.auditContext } : {},
		...params.mode !== void 0 ? { mode: params.mode } : {}
	};
}
async function postGuardedRequest(params) {
	const operation = async () => {
		const result = await fetchWithTimeoutGuarded(params.url, params.init, params.timeoutMs, params.fetchFn, params.guardedOptions);
		if (params.retryStage && isTransientProviderHttpStatus(result.response.status)) try {
			throw await require_provider_http_errors.createProviderHttpError(result.response, "provider POST request failed", { statusPrefix: "HTTP " });
		} finally {
			await result.release();
		}
		return result;
	};
	if (!params.retryStage) return await operation();
	return await require_operation_retry.executeProviderOperationWithRetry({
		provider: "provider-http",
		stage: params.retryStage,
		retry: params.retry,
		operation
	});
}
function isTransientProviderHttpStatus(status) {
	return status === 500 || status === 502 || status === 503 || status === 504;
}
async function postJsonRequest(params) {
	return await postGuardedRequest({
		url: params.url,
		init: {
			method: "POST",
			headers: params.headers,
			body: JSON.stringify(params.body)
		},
		timeoutMs: params.timeoutMs,
		fetchFn: params.fetchFn,
		guardedOptions: resolveGuardedRequestOptions(params),
		retryStage: params.retryStage,
		retry: params.retry
	});
}
//#endregion
Object.defineProperty(exports, "createProviderOperationDeadline", {
	enumerable: true,
	get: function() {
		return createProviderOperationDeadline;
	}
});
Object.defineProperty(exports, "postJsonRequest", {
	enumerable: true,
	get: function() {
		return postJsonRequest;
	}
});
Object.defineProperty(exports, "resolveProviderHttpRequestConfigWithOriginTrust", {
	enumerable: true,
	get: function() {
		return resolveProviderHttpRequestConfigWithOriginTrust;
	}
});
Object.defineProperty(exports, "resolveProviderOperationTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveProviderOperationTimeoutMs;
	}
});
