const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_process = require("node:process");
node_process = require_rolldown_runtime.__toESM(node_process, 1);
//#region src/infra/unhandled-rejections.ts
const HANDLERS_GLOBAL_KEY = Symbol.for("operator.unhandledRejection.handlers");
const EXCEPTION_HANDLERS_GLOBAL_KEY = Symbol.for("operator.uncaughtException.handlers");
(() => {
	const g = globalThis;
	const existing = g[HANDLERS_GLOBAL_KEY];
	if (existing instanceof Set) return existing;
	const created = /* @__PURE__ */ new Set();
	g[HANDLERS_GLOBAL_KEY] = created;
	return created;
})();
const exceptionHandlers = (() => {
	const g = globalThis;
	const existing = g[EXCEPTION_HANDLERS_GLOBAL_KEY];
	if (existing instanceof Set) return existing;
	const created = /* @__PURE__ */ new Set();
	g[EXCEPTION_HANDLERS_GLOBAL_KEY] = created;
	return created;
})();
const TRANSIENT_NETWORK_CODES = /* @__PURE__ */ new Set([
	"ECONNRESET",
	"ECONNREFUSED",
	"ENOTFOUND",
	"ETIMEDOUT",
	"ESOCKETTIMEDOUT",
	"ECONNABORTED",
	"EPIPE",
	"ENETDOWN",
	"EHOSTUNREACH",
	"ENETUNREACH",
	"EADDRNOTAVAIL",
	"EAI_AGAIN",
	"UND_ERR_CONNECT_TIMEOUT",
	"UND_ERR_DNS_RESOLVE_FAILED",
	"UND_ERR_CONNECT",
	"UND_ERR_SOCKET",
	"UND_ERR_HEADERS_TIMEOUT",
	"UND_ERR_BODY_TIMEOUT",
	"ERR_HTTP2_INVALID_SESSION",
	"EPROTO",
	"ERR_SSL_WRONG_VERSION_NUMBER",
	"ERR_SSL_PROTOCOL_RETURNED_AN_ERROR"
]);
const TRANSIENT_NETWORK_ERROR_NAMES = /* @__PURE__ */ new Set([
	"AbortError",
	"ConnectTimeoutError",
	"HeadersTimeoutError",
	"BodyTimeoutError",
	"TimeoutError"
]);
const TRANSIENT_NETWORK_MESSAGE_CODE_RE = /\b(ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ESOCKETTIMEDOUT|ECONNABORTED|EPIPE|ENETDOWN|EHOSTUNREACH|ENETUNREACH|EADDRNOTAVAIL|EAI_AGAIN|EPROTO|UND_ERR_CONNECT_TIMEOUT|UND_ERR_DNS_RESOLVE_FAILED|UND_ERR_CONNECT|UND_ERR_SOCKET|UND_ERR_HEADERS_TIMEOUT|UND_ERR_BODY_TIMEOUT|ERR_HTTP2_INVALID_SESSION)\b/i;
const TRANSIENT_NETWORK_MESSAGE_SNIPPETS = [
	"getaddrinfo",
	"socket hang up",
	"client network socket disconnected before secure tls connection was established",
	"network error",
	"network is unreachable",
	"temporary failure in name resolution",
	"upstream connect error",
	"disconnect/reset before headers",
	"tlsv1 alert",
	"ssl routines",
	"packet length too long",
	"write eproto"
];
function isWrappedFetchFailedMessage(message) {
	if (message === "fetch failed") return true;
	return /:\s*fetch failed$/.test(message);
}
function extractErrorCodeOrErrno(err) {
	const code = require_errors.extractErrorCode(err);
	if (code) return code.trim().toUpperCase();
	if (!err || typeof err !== "object") return;
	const errno = err.errno;
	if (typeof errno === "string" && errno.trim()) return errno.trim().toUpperCase();
	if (typeof errno === "number" && Number.isFinite(errno)) return String(errno);
}
function collectNestedUnhandledErrorCandidates(err) {
	return require_errors.collectErrorGraphCandidates(err, (current) => {
		const nested = [
			current.cause,
			current.reason,
			current.original,
			current.error,
			current.data
		];
		if (Array.isArray(current.errors)) nested.push(...current.errors);
		return nested;
	});
}
/**
* Checks if an error is a transient network error that shouldn't crash the gateway.
* These are typically temporary connectivity issues that will resolve on their own.
*/
function isTransientNetworkError(err) {
	if (!err) return false;
	for (const candidate of collectNestedUnhandledErrorCandidates(err)) {
		const code = extractErrorCodeOrErrno(candidate);
		if (code && TRANSIENT_NETWORK_CODES.has(code)) return true;
		const name = require_errors.readErrorName(candidate);
		if (name && TRANSIENT_NETWORK_ERROR_NAMES.has(name)) return true;
		if (!candidate || typeof candidate !== "object") continue;
		const rawMessage = candidate.message;
		const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rawMessage);
		if (!message) continue;
		if (TRANSIENT_NETWORK_MESSAGE_CODE_RE.test(message)) return true;
		if (isWrappedFetchFailedMessage(message)) return true;
		if (TRANSIENT_NETWORK_MESSAGE_SNIPPETS.some((snippet) => message.includes(snippet))) return true;
	}
	return false;
}
function registerUncaughtExceptionHandler(handler) {
	exceptionHandlers.add(handler);
	return () => {
		exceptionHandlers.delete(handler);
	};
}
//#endregion
Object.defineProperty(exports, "isTransientNetworkError", {
	enumerable: true,
	get: function() {
		return isTransientNetworkError;
	}
});
Object.defineProperty(exports, "registerUncaughtExceptionHandler", {
	enumerable: true,
	get: function() {
		return registerUncaughtExceptionHandler;
	}
});
