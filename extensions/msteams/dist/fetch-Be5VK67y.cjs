const require_redact = require("./redact-Bg-yc44I.cjs");
const require_retry = require("./retry-DXZi6qkk.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
const require_fetch_timeout = require("./fetch-timeout-C6HLIptD.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_unhandled_rejections = require("./unhandled-rejections-BM-J7NGE.cjs");
const require_store = require("./store-BW6t6tIi.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
let _gabrielvfonseca_media_core_file_name = require("@gabrielvfonseca/media-core/file-name");
let _gabrielvfonseca_media_core_content_length = require("@gabrielvfonseca/media-core/content-length");
//#region src/media/fetch.ts
/** Default remote media fetch cap shared by buffer reads and store writes. */
const DEFAULT_FETCH_MEDIA_MAX_BYTES = require("@gabrielvfonseca/media-core/constants").MAX_DOCUMENT_BYTES;
/** Structured fetch error used for retry decisions and caller-facing diagnostics. */
var MediaFetchError = class extends Error {
	constructor(code, message, options) {
		super(message, options);
		this.code = code;
		this.status = options?.status;
		this.name = "MediaFetchError";
	}
};
function stripQuotes(value) {
	return value.replace(/^["']|["']$/g, "");
}
function parseContentDispositionFileName(header) {
	if (!header) return;
	const starMatch = /filename\*\s*=\s*([^;]+)/i.exec(header);
	if (starMatch?.[1]) {
		const cleaned = stripQuotes(starMatch[1].trim());
		const encoded = cleaned.split("''").slice(1).join("''") || cleaned;
		try {
			return (0, _gabrielvfonseca_media_core_file_name.basenameFromAnyPath)(decodeURIComponent(encoded));
		} catch {
			return (0, _gabrielvfonseca_media_core_file_name.basenameFromAnyPath)(encoded);
		}
	}
	const match = /filename\s*=\s*([^;]+)/i.exec(header);
	if (match?.[1]) return (0, _gabrielvfonseca_media_core_file_name.basenameFromAnyPath)(stripQuotes(match[1].trim()));
}
function basenameFromUrlPathname(pathname) {
	const base = (0, _gabrielvfonseca_media_core_file_name.basenameFromAnyPath)(pathname);
	if (!base) return "";
	try {
		return decodeURIComponent(base).replace(/[\\/]/g, "_");
	} catch {
		return base;
	}
}
async function readErrorBodySnippet(res, opts) {
	try {
		return await require_http_body.readResponseTextSnippet(res, {
			maxBytes: 8 * 1024,
			maxChars: opts?.maxChars,
			chunkTimeoutMs: opts?.chunkTimeoutMs
		});
	} catch {
		return;
	}
}
function redactMediaUrl(url) {
	return require_redact.redactSensitiveText(url);
}
async function fetchGuardedMediaResponse(options) {
	const { url, fetchImpl, requestInit, maxRedirects, timeoutMs, responseHeaderTimeoutMs, ssrfPolicy, lookupFn, dispatcherPolicy, dispatcherAttempts, shouldRetryFetchError, trustExplicitProxyDns } = options;
	const sourceUrl = redactMediaUrl(url);
	const attempts = dispatcherAttempts && dispatcherAttempts.length > 0 ? dispatcherAttempts : [{
		dispatcherPolicy,
		lookupFn
	}];
	const responseHeaderDeadline = require_fetch_timeout.buildTimeoutAbortSignal({
		timeoutMs: responseHeaderTimeoutMs,
		signal: requestInit?.signal ?? void 0,
		operation: "media response headers",
		url
	});
	const requestSignal = responseHeaderDeadline.signal;
	const runGuardedFetch = async (attempt) => await require_fetch_guard.fetchWithSsrFGuard((trustExplicitProxyDns && attempt.dispatcherPolicy?.mode === "explicit-proxy" ? require_fetch_guard.withTrustedExplicitProxyGuardedFetchMode : require_fetch_guard.withStrictGuardedFetchMode)({
		url,
		fetchImpl,
		init: requestInit,
		maxRedirects,
		...timeoutMs !== void 0 ? { timeoutMs } : {},
		...requestSignal ? { signal: requestSignal } : {},
		policy: ssrfPolicy,
		lookupFn: attempt.lookupFn ?? lookupFn,
		dispatcherPolicy: attempt.dispatcherPolicy
	}));
	try {
		let result;
		const attemptErrors = [];
		for (let i = 0; i < attempts.length; i += 1) try {
			result = await runGuardedFetch((0, _gabrielvfonseca_normalization_core.expectDefined)(attempts[i], "attempts entry at i"));
			break;
		} catch (err) {
			if (typeof shouldRetryFetchError !== "function" || !shouldRetryFetchError(err) || i === attempts.length - 1) {
				if (attemptErrors.length > 0) {
					const combined = new Error(`Primary fetch failed and fallback fetch also failed for ${sourceUrl}`, { cause: err });
					combined.primaryError = attemptErrors[0];
					combined.attemptErrors = [...attemptErrors, err];
					throw combined;
				}
				throw err;
			}
			attemptErrors.push(err);
		}
		responseHeaderDeadline.cleanup();
		return {
			response: result.response,
			finalUrl: result.finalUrl,
			release: async () => {
				await result.release();
			},
			sourceUrl
		};
	} catch (err) {
		responseHeaderDeadline.cleanup();
		throw new MediaFetchError("fetch_failed", `Failed to fetch media from ${sourceUrl}: ${require_errors.formatErrorMessage(err)}`, { cause: err });
	}
}
async function assertMediaResponseOk(params) {
	const { res, url, finalUrl, sourceUrl, readIdleTimeoutMs } = params;
	if (res.ok) return;
	const statusText = res.statusText ? ` ${res.statusText}` : "";
	const redirected = finalUrl !== url ? ` (redirected to ${redactMediaUrl(finalUrl)})` : "";
	let detail = `HTTP ${res.status}${statusText}`;
	if (!res.body) detail = `HTTP ${res.status}${statusText}; empty response body`;
	else {
		const snippet = await readErrorBodySnippet(res, { chunkTimeoutMs: readIdleTimeoutMs });
		if (snippet) detail += `; body: ${snippet}`;
	}
	throw new MediaFetchError("http_error", `Failed to fetch media from ${sourceUrl}${redirected}: ${require_redact.redactSensitiveText(detail)}`, { status: res.status });
}
async function assertMediaContentLength(params) {
	let length;
	try {
		length = (0, _gabrielvfonseca_media_core_content_length.parseMediaContentLength)(params.res.headers.get("content-length"));
	} catch (err) {
		await discardIgnoredResponseBody(params.res);
		throw new MediaFetchError("http_error", `Failed to fetch media from ${params.sourceUrl}: ${require_errors.formatErrorMessage(err)}`, { cause: err });
	}
	if (length === null) return;
	if (length > params.maxBytes) {
		await discardIgnoredResponseBody(params.res);
		throw new MediaFetchError("max_bytes", `Failed to fetch media from ${params.sourceUrl}: content length ${length} exceeds maxBytes ${params.maxBytes}`);
	}
}
async function discardIgnoredResponseBody(res) {
	const body = res.body;
	if (!body) return;
	try {
		await body.cancel();
	} catch {}
}
function resolveRemoteFileName(params) {
	let fileNameFromUrl;
	try {
		fileNameFromUrl = basenameFromUrlPathname(new URL(params.finalUrl).pathname) || void 0;
	} catch {}
	return parseContentDispositionFileName(params.res.headers.get("content-disposition")) || (params.filePathHint ? (0, _gabrielvfonseca_media_core_file_name.basenameFromAnyPath)(params.filePathHint) : void 0) || fileNameFromUrl;
}
function isGenericResponseContentType(value) {
	const normalized = value?.split(";")[0]?.trim().toLowerCase();
	return !normalized || normalized === "application/octet-stream" || normalized === "binary/octet-stream" || normalized === "application/zip";
}
function resolveResponseContentType(params) {
	if (!params.fallbackContentType) return params.headerContentType ?? void 0;
	if (isGenericResponseContentType(params.headerContentType)) return params.fallbackContentType;
	const headerContentType = params.headerContentType?.split(";")[0]?.trim().toLowerCase();
	const fallbackContentType = params.fallbackContentType.split(";")[0]?.trim().toLowerCase();
	if (headerContentType?.startsWith("video/") && fallbackContentType?.startsWith("audio/") && headerContentType.slice(6) === fallbackContentType.slice(6)) return params.fallbackContentType;
	return params.headerContentType ?? params.fallbackContentType;
}
async function* responseBodyChunks(body, readIdleTimeoutMs) {
	const reader = body.getReader();
	let completed = false;
	try {
		while (true) {
			const { done, value } = readIdleTimeoutMs ? await require_http_body.readChunkWithIdleTimeout(reader, readIdleTimeoutMs) : await reader.read();
			if (done) {
				completed = true;
				return;
			}
			if (value?.byteLength) yield value;
		}
	} finally {
		if (!completed) await reader.cancel().catch(() => void 0);
		try {
			reader.releaseLock();
		} catch {}
	}
}
function isMediaLimitError(err) {
	return err instanceof Error && /Media exceeds .* limit/.test(err.message);
}
async function saveOkMediaResponse(params) {
	await assertMediaContentLength({
		res: params.res,
		sourceUrl: params.sourceUrl,
		maxBytes: params.maxBytes
	});
	const fileName = resolveRemoteFileName({
		res: params.res,
		finalUrl: params.finalUrl,
		filePathHint: params.filePathHint
	});
	const contentType = resolveResponseContentType({
		headerContentType: params.res.headers.get("content-type"),
		fallbackContentType: params.fallbackContentType
	});
	const detectionFilePathHint = isGenericResponseContentType(contentType) ? params.filePathHint : void 0;
	try {
		return {
			...params.res.body ? await require_store.saveMediaStream(responseBodyChunks(params.res.body, params.readIdleTimeoutMs), contentType ?? void 0, params.subdir ?? "inbound", params.maxBytes, params.originalFilename, detectionFilePathHint) : await require_store.saveMediaBuffer(Buffer.alloc(0), contentType ?? void 0, params.subdir ?? "inbound", params.maxBytes, params.originalFilename, detectionFilePathHint),
			...fileName ? { fileName } : {}
		};
	} catch (err) {
		if (err instanceof MediaFetchError) throw err;
		if (isMediaLimitError(err)) throw new MediaFetchError("max_bytes", `Failed to fetch media from ${params.sourceUrl}: payload exceeds maxBytes ${params.maxBytes}`, { cause: err });
		throw new MediaFetchError("fetch_failed", `Failed to fetch media from ${params.sourceUrl}: ${require_errors.formatErrorMessage(err)}`, { cause: err });
	}
}
function shouldRetryMediaFetch(err) {
	if (err instanceof MediaFetchError) {
		if (err.code === "max_bytes") return false;
		if (err.code === "http_error") return typeof err.status === "number" && (err.status === 408 || err.status >= 500);
		if (err.code === "fetch_failed") {
			if (require_abort_signal.isAbortError(err) || require_abort_signal.isAbortError(err.cause)) return false;
			return require_unhandled_rejections.isTransientNetworkError(err.cause ?? err);
		}
		return false;
	}
	return require_unhandled_rejections.isTransientNetworkError(err);
}
async function withMediaFetchRetry(options, fn) {
	const retry = options.retry;
	if (!retry) return await fn();
	const callerShouldRetry = retry.shouldRetry;
	return await require_retry.retryAsync(fn, {
		label: "media:fetch",
		...retry,
		shouldRetry: (err, attempt) => callerShouldRetry ? callerShouldRetry(err, attempt) : shouldRetryMediaFetch(err)
	});
}
/** Validates and saves a caller-provided response without performing a new fetch. */
async function saveResponseMedia(res, options = {}) {
	const sourceUrl = redactMediaUrl((options.sourceUrl ?? res.url) || "response");
	const finalUrl = options.sourceUrl ?? res.url;
	await assertMediaResponseOk({
		res,
		url: options.sourceUrl ?? finalUrl,
		finalUrl,
		sourceUrl,
		readIdleTimeoutMs: options.readIdleTimeoutMs
	});
	return await saveOkMediaResponse({
		res,
		finalUrl,
		sourceUrl,
		filePathHint: options.filePathHint,
		maxBytes: options.maxBytes ?? DEFAULT_FETCH_MEDIA_MAX_BYTES,
		readIdleTimeoutMs: options.readIdleTimeoutMs,
		fallbackContentType: options.fallbackContentType,
		subdir: options.subdir,
		originalFilename: options.originalFilename
	});
}
/** Fetches media through SSRF guards and saves the body into the media store. */
async function saveRemoteMedia(options) {
	return await withMediaFetchRetry(options, () => saveRemoteMediaOnce(options));
}
async function saveRemoteMediaOnce(options) {
	const { response: res, finalUrl, release, sourceUrl } = await fetchGuardedMediaResponse(options);
	try {
		await assertMediaResponseOk({
			res,
			url: options.url,
			finalUrl,
			sourceUrl,
			readIdleTimeoutMs: options.readIdleTimeoutMs
		});
		return await saveOkMediaResponse({
			res,
			finalUrl,
			sourceUrl,
			filePathHint: options.filePathHint,
			maxBytes: options.maxBytes ?? DEFAULT_FETCH_MEDIA_MAX_BYTES,
			readIdleTimeoutMs: options.readIdleTimeoutMs,
			fallbackContentType: options.fallbackContentType,
			subdir: options.subdir,
			originalFilename: options.originalFilename
		});
	} finally {
		if (release) await release();
	}
}
/** Fetches media through SSRF guards and returns the bounded response body as a buffer. */
async function readRemoteMediaBuffer(options) {
	return await withMediaFetchRetry(options, () => readRemoteMediaBufferOnce(options));
}
/** @deprecated Use `readRemoteMediaBuffer` for buffer reads or `saveRemoteMedia` for URL-to-store. */
const fetchRemoteMedia = readRemoteMediaBuffer;
async function readRemoteMediaBufferOnce(options) {
	const { response: res, finalUrl, release, sourceUrl } = await fetchGuardedMediaResponse(options);
	try {
		await assertMediaResponseOk({
			res,
			url: options.url,
			finalUrl,
			sourceUrl,
			readIdleTimeoutMs: options.readIdleTimeoutMs
		});
		const effectiveMaxBytes = options.maxBytes ?? DEFAULT_FETCH_MEDIA_MAX_BYTES;
		await assertMediaContentLength({
			res,
			sourceUrl,
			maxBytes: effectiveMaxBytes
		});
		let buffer;
		try {
			buffer = await require_http_body.readResponseWithLimit(res, effectiveMaxBytes, {
				onOverflow: ({ maxBytes, res: resLocal }) => new MediaFetchError("max_bytes", `Failed to fetch media from ${redactMediaUrl(resLocal.url || options.url)}: payload exceeds maxBytes ${maxBytes}`),
				chunkTimeoutMs: options.readIdleTimeoutMs
			});
		} catch (err) {
			if (err instanceof MediaFetchError) throw err;
			throw new MediaFetchError("fetch_failed", `Failed to fetch media from ${redactMediaUrl(res.url || options.url)}: ${require_errors.formatErrorMessage(err)}`, { cause: err });
		}
		let fileName = resolveRemoteFileName({
			res,
			finalUrl,
			filePathHint: options.filePathHint
		});
		const filePathForMime = fileName && (0, _gabrielvfonseca_media_core_file_name.extnameFromAnyPath)(fileName) ? fileName : options.filePathHint ?? finalUrl;
		const contentType = await (0, _gabrielvfonseca_media_core_mime.detectMime)({
			buffer,
			headerMime: res.headers.get("content-type"),
			filePath: filePathForMime
		});
		if (fileName && !(0, _gabrielvfonseca_media_core_file_name.extnameFromAnyPath)(fileName) && contentType) {
			const ext = (0, _gabrielvfonseca_media_core_mime.extensionForMime)(contentType);
			if (ext) fileName = `${fileName}${ext}`;
		}
		return {
			buffer,
			contentType: contentType ?? void 0,
			fileName
		};
	} finally {
		if (release) await release();
	}
}
//#endregion
Object.defineProperty(exports, "MediaFetchError", {
	enumerable: true,
	get: function() {
		return MediaFetchError;
	}
});
Object.defineProperty(exports, "fetchRemoteMedia", {
	enumerable: true,
	get: function() {
		return fetchRemoteMedia;
	}
});
Object.defineProperty(exports, "readRemoteMediaBuffer", {
	enumerable: true,
	get: function() {
		return readRemoteMediaBuffer;
	}
});
Object.defineProperty(exports, "saveRemoteMedia", {
	enumerable: true,
	get: function() {
		return saveRemoteMedia;
	}
});
Object.defineProperty(exports, "saveResponseMedia", {
	enumerable: true,
	get: function() {
		return saveResponseMedia;
	}
});
