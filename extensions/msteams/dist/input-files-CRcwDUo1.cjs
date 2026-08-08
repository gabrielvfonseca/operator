const require_number_coercion = require("./number-coercion-C9Yx-dRY.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
const require_media_services = require("./media-services-CA_NM3C2.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_pdf_extract = require("./pdf-extract-BIHpyD0_.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_mime = require("@gabrielvfonseca/media-core/mime");
let _gabrielvfonseca_media_core_base64 = require("@gabrielvfonseca/media-core/base64");
let _gabrielvfonseca_media_core_content_length = require("@gabrielvfonseca/media-core/content-length");
//#region src/media/input-files.ts
/** Default MIME allowlist for input_image sources. */
const DEFAULT_INPUT_IMAGE_MIMES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/heic",
	"image/heif"
];
/** Default MIME allowlist for input_file text/PDF extraction. */
const DEFAULT_INPUT_FILE_MIMES = [
	"text/plain",
	"text/markdown",
	"text/html",
	"text/csv",
	"application/json",
	"application/pdf"
];
/** Default decoded-byte cap for input_image payloads. */
const DEFAULT_INPUT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
/** Default decoded-byte cap for input_file payloads. */
const DEFAULT_INPUT_FILE_MAX_BYTES = 5 * 1024 * 1024;
/** Default maximum model-visible characters emitted from input_file text. */
const DEFAULT_INPUT_FILE_MAX_CHARS = 6e4;
/** Default timeout for guarded input source URL fetches. */
const DEFAULT_INPUT_TIMEOUT_MS = 1e4;
/** Default PDF page cap for input_file extraction. */
const DEFAULT_INPUT_PDF_MAX_PAGES = 4;
/** Default PDF raster pixel cap for extracted input_file images. */
const DEFAULT_INPUT_PDF_MAX_PIXELS = 4e6;
/** Default text threshold before PDF extraction keeps text-only output. */
const DEFAULT_INPUT_PDF_MIN_TEXT_CHARS = 200;
const NORMALIZED_INPUT_IMAGE_MIME = "image/jpeg";
const HEIC_INPUT_IMAGE_MIMES = /* @__PURE__ */ new Set(["image/heic", "image/heif"]);
function rejectOversizedBase64Payload(params) {
	const estimated = (0, _gabrielvfonseca_media_core_base64.estimateBase64DecodedBytes)(params.data);
	if (estimated > params.maxBytes) throw new Error(`${params.label} too large: ${estimated} bytes (limit: ${params.maxBytes} bytes)`);
}
/** Normalizes a MIME value by stripping parameters and lowercasing the media type. */
function normalizeMimeType(value) {
	const [raw] = value?.split(";") ?? [];
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
}
/** Parses a Content-Type header into normalized MIME and optional charset values. */
function parseContentType(value) {
	if (!value) return {};
	const parts = value.split(";").map((part) => part.trim());
	return {
		mimeType: normalizeMimeType(parts[0]),
		charset: parts.map((part) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(part.match(/^charset=(.+)$/i)?.[1])).find((part) => part && part.length > 0)
	};
}
/** Converts configured MIME lists into a normalized allowlist, using fallback defaults when empty. */
function normalizeMimeList(values, fallback) {
	const input = values && values.length > 0 ? values : fallback;
	return new Set(input.flatMap((value) => normalizeMimeType(value) ?? []));
}
/** Resolves input_file extraction limits from partial config and stable defaults. */
function resolveInputFileLimits(config) {
	return {
		allowUrl: config?.allowUrl ?? true,
		allowedMimes: normalizeMimeList(config?.allowedMimes, DEFAULT_INPUT_FILE_MIMES),
		maxBytes: config?.maxBytes ?? DEFAULT_INPUT_FILE_MAX_BYTES,
		maxChars: config?.maxChars ?? DEFAULT_INPUT_FILE_MAX_CHARS,
		maxRedirects: config?.maxRedirects ?? 3,
		timeoutMs: config?.timeoutMs ?? 1e4,
		pdf: {
			maxPages: config?.pdf?.maxPages ?? DEFAULT_INPUT_PDF_MAX_PAGES,
			maxPixels: config?.pdf?.maxPixels ?? DEFAULT_INPUT_PDF_MAX_PIXELS,
			minTextChars: config?.pdf?.minTextChars ?? DEFAULT_INPUT_PDF_MIN_TEXT_CHARS
		}
	};
}
/** Fetches an input source URL through SSRF, redirect, timeout, and byte-limit guards. */
async function fetchWithGuard(params) {
	const { response, release } = await require_fetch_guard.fetchWithSsrFGuard({
		url: params.url,
		maxRedirects: params.maxRedirects,
		timeoutMs: params.timeoutMs,
		policy: params.policy,
		auditContext: params.auditContext,
		init: { headers: { "User-Agent": "Operator-Gateway/1.0" } }
	});
	try {
		if (!response.ok) {
			await discardIgnoredResponseBody(response);
			throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
		}
		let contentLength;
		try {
			contentLength = (0, _gabrielvfonseca_media_core_content_length.parseMediaContentLength)(response.headers.get("content-length"));
		} catch (err) {
			await discardIgnoredResponseBody(response);
			throw err;
		}
		if (contentLength !== null && contentLength > params.maxBytes) {
			await discardIgnoredResponseBody(response);
			throw new Error(`Content too large: ${contentLength} bytes (limit: ${params.maxBytes} bytes)`);
		}
		const buffer = await require_http_body.readResponseWithLimit(response, params.maxBytes);
		const contentType = response.headers.get("content-type") || void 0;
		return {
			buffer,
			mimeType: parseContentType(contentType).mimeType ?? "application/octet-stream",
			contentType
		};
	} finally {
		await release();
	}
}
async function discardIgnoredResponseBody(response) {
	const body = response.body;
	if (!body) return;
	try {
		await body.cancel();
	} catch {}
}
function decodeTextContent(buffer, charset) {
	const encoding = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(charset) || "utf-8";
	try {
		return new TextDecoder(encoding).decode(buffer);
	} catch {
		return new TextDecoder("utf-8").decode(buffer);
	}
}
function clampText(text, maxChars) {
	if (text.length <= maxChars) return text;
	return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, maxChars);
}
function withInputFileTimeout(params) {
	const timeoutMs = (0, require_number_coercion.number_coercion_exports.resolveTimerTimeoutMs)(params.timeoutMs, 1);
	let timeout;
	const timedOut = new Promise((_, reject) => {
		timeout = setTimeout(() => {
			reject(/* @__PURE__ */ new Error(`${params.label} timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});
	return Promise.race([params.task, timedOut]).finally(() => {
		if (timeout) clearTimeout(timeout);
	});
}
async function normalizeInputImage(params) {
	const declaredMime = normalizeMimeType(params.mimeType) ?? "application/octet-stream";
	const detectedMime = normalizeMimeType(await (0, _gabrielvfonseca_media_core_mime.detectMime)({
		buffer: params.buffer,
		headerMime: params.mimeType
	}));
	if (declaredMime.startsWith("image/") && detectedMime && !detectedMime.startsWith("image/")) throw new Error(`Unsupported image MIME type: ${detectedMime}`);
	const sourceMime = detectedMime && HEIC_INPUT_IMAGE_MIMES.has(detectedMime) || HEIC_INPUT_IMAGE_MIMES.has(declaredMime) && !detectedMime ? detectedMime ?? declaredMime : declaredMime;
	if (!params.limits.allowedMimes.has(sourceMime)) throw new Error(`Unsupported image MIME type: ${sourceMime}`);
	if (!HEIC_INPUT_IMAGE_MIMES.has(sourceMime)) return {
		type: "image",
		data: params.buffer.toString("base64"),
		mimeType: sourceMime
	};
	const normalizedBuffer = await require_media_services.convertHeicToJpeg(params.buffer);
	if (normalizedBuffer.byteLength > params.limits.maxBytes) throw new Error(`Image too large after HEIC conversion: ${normalizedBuffer.byteLength} bytes (limit: ${params.limits.maxBytes} bytes)`);
	return {
		type: "image",
		data: normalizedBuffer.toString("base64"),
		mimeType: NORMALIZED_INPUT_IMAGE_MIME
	};
}
async function resolveInputFileMime(params) {
	const sniffedMime = normalizeMimeType(await (0, _gabrielvfonseca_media_core_mime.detectMime)({ buffer: params.buffer }));
	if (!sniffedMime) return params.declaredMime;
	if (sniffedMime === "application/octet-stream") return params.declaredMime ?? sniffedMime;
	return sniffedMime;
}
/** Extracts and normalizes an input_image source from base64 or guarded URL input. */
async function extractImageContentFromSource(source, limits) {
	if (source.type === "base64") {
		rejectOversizedBase64Payload({
			data: source.data,
			maxBytes: limits.maxBytes,
			label: "Image"
		});
		const canonicalData = (0, _gabrielvfonseca_media_core_base64.canonicalizeBase64)(source.data);
		if (!canonicalData) throw new Error("input_image base64 source has invalid 'data' field");
		const buffer = Buffer.from(canonicalData, "base64");
		if (buffer.byteLength > limits.maxBytes) throw new Error(`Image too large: ${buffer.byteLength} bytes (limit: ${limits.maxBytes} bytes)`);
		return await normalizeInputImage({
			buffer,
			mimeType: normalizeMimeType(source.mediaType) ?? "image/png",
			limits
		});
	}
	if (source.type === "url") {
		if (!limits.allowUrl) throw new Error("input_image URL sources are disabled by config");
		const result = await fetchWithGuard({
			url: source.url,
			maxBytes: limits.maxBytes,
			timeoutMs: limits.timeoutMs,
			maxRedirects: limits.maxRedirects,
			policy: {
				allowPrivateNetwork: false,
				hostnameAllowlist: limits.urlAllowlist
			},
			auditContext: "openresponses.input_image"
		});
		return await normalizeInputImage({
			buffer: result.buffer,
			mimeType: result.mimeType,
			limits
		});
	}
	throw new Error(`Unsupported input_image source type: ${source.type}`);
}
/** Extracts model-visible text and images from an input_file source after MIME validation. */
async function extractFileContentFromSource(params) {
	const { source, limits } = params;
	const filename = source.filename || "file";
	let buffer;
	let mimeType;
	let charset;
	if (source.type === "base64") {
		rejectOversizedBase64Payload({
			data: source.data,
			maxBytes: limits.maxBytes,
			label: "File"
		});
		const canonicalData = (0, _gabrielvfonseca_media_core_base64.canonicalizeBase64)(source.data);
		if (!canonicalData) throw new Error("input_file base64 source has invalid 'data' field");
		const parsed = parseContentType(source.mediaType);
		mimeType = parsed.mimeType;
		charset = parsed.charset;
		buffer = Buffer.from(canonicalData, "base64");
	} else {
		if (!limits.allowUrl) throw new Error("input_file URL sources are disabled by config");
		const result = await fetchWithGuard({
			url: source.url,
			maxBytes: limits.maxBytes,
			timeoutMs: limits.timeoutMs,
			maxRedirects: limits.maxRedirects,
			policy: {
				allowPrivateNetwork: false,
				hostnameAllowlist: limits.urlAllowlist
			},
			auditContext: "openresponses.input_file"
		});
		const parsed = parseContentType(result.contentType);
		mimeType = parsed.mimeType ?? normalizeMimeType(result.mimeType);
		charset = parsed.charset;
		buffer = result.buffer;
	}
	if (buffer.byteLength > limits.maxBytes) throw new Error(`File too large: ${buffer.byteLength} bytes (limit: ${limits.maxBytes} bytes)`);
	mimeType = await resolveInputFileMime({
		buffer,
		declaredMime: mimeType
	});
	if (!mimeType) throw new Error("input_file missing media type");
	if (!limits.allowedMimes.has(mimeType)) throw new Error(`Unsupported file MIME type: ${mimeType}`);
	if (mimeType === "application/pdf") {
		const extracted = await withInputFileTimeout({
			label: "PDF extraction",
			timeoutMs: limits.timeoutMs,
			task: require_pdf_extract.extractPdfContent({
				buffer,
				maxPages: limits.pdf.maxPages,
				maxPixels: limits.pdf.maxPixels,
				minTextChars: limits.pdf.minTextChars,
				...params.config ? { config: params.config } : {},
				onImageExtractionError: (err) => {
					require_logger.logWarn(`media: PDF image extraction skipped, ${String(err)}`);
				}
			})
		});
		return {
			filename,
			text: extracted.text ? clampText(extracted.text, limits.maxChars) : "",
			images: extracted.images.length > 0 ? extracted.images : void 0
		};
	}
	return {
		filename,
		text: clampText(decodeTextContent(buffer, charset), limits.maxChars)
	};
}
//#endregion
Object.defineProperty(exports, "DEFAULT_INPUT_IMAGE_MAX_BYTES", {
	enumerable: true,
	get: function() {
		return DEFAULT_INPUT_IMAGE_MAX_BYTES;
	}
});
Object.defineProperty(exports, "DEFAULT_INPUT_IMAGE_MIMES", {
	enumerable: true,
	get: function() {
		return DEFAULT_INPUT_IMAGE_MIMES;
	}
});
Object.defineProperty(exports, "DEFAULT_INPUT_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return DEFAULT_INPUT_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "extractFileContentFromSource", {
	enumerable: true,
	get: function() {
		return extractFileContentFromSource;
	}
});
Object.defineProperty(exports, "extractImageContentFromSource", {
	enumerable: true,
	get: function() {
		return extractImageContentFromSource;
	}
});
Object.defineProperty(exports, "normalizeMimeList", {
	enumerable: true,
	get: function() {
		return normalizeMimeList;
	}
});
Object.defineProperty(exports, "normalizeMimeType", {
	enumerable: true,
	get: function() {
		return normalizeMimeType;
	}
});
Object.defineProperty(exports, "resolveInputFileLimits", {
	enumerable: true,
	get: function() {
		return resolveInputFileLimits;
	}
});
