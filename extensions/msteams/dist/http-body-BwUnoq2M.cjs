const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
let node_timers = require("node:timers");
//#region src/infra/http-response-body-timeout.ts
async function withCancellableTimeout(params) {
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(params.timeoutMs, 1);
	let timeoutId;
	let timedOut = false;
	return await new Promise((resolve, reject) => {
		const clear = () => {
			if (timeoutId !== void 0) {
				clearTimeout(timeoutId);
				timeoutId = void 0;
			}
		};
		timeoutId = setTimeout(() => {
			timedOut = true;
			const error = params.onTimeout({ timeoutMs });
			clear();
			params.cancel(error).catch(() => void 0);
			reject(error);
		}, timeoutMs);
		if (typeof timeoutId === "object" && "unref" in timeoutId) timeoutId.unref();
		Promise.resolve().then(params.read).then((value) => {
			clear();
			if (!timedOut) resolve(value);
		}, (error) => {
			clear();
			if (!timedOut) reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(error, "Non-Error rejection"));
		});
	});
}
/** Reads one chunk, rejecting and cancelling the reader after an idle timeout. */
async function readChunkWithIdleTimeout(reader, chunkTimeoutMs, onIdleTimeout) {
	return await withCancellableTimeout({
		timeoutMs: chunkTimeoutMs,
		onTimeout: ({ timeoutMs }) => onIdleTimeout?.({ chunkTimeoutMs: timeoutMs }) ?? /* @__PURE__ */ new Error(`Media download stalled: no data received for ${timeoutMs}ms`),
		cancel: async (error) => await reader.cancel(error),
		read: async () => await reader.read()
	});
}
async function withResponseBodyTimeout(params) {
	if (params.timeoutMs === void 0) return await params.read();
	return await withCancellableTimeout({
		timeoutMs: params.timeoutMs,
		onTimeout: ({ timeoutMs }) => params.onTimeout?.({ timeoutMs }) ?? /* @__PURE__ */ new Error(`Response body timed out after ${timeoutMs}ms`),
		cancel: params.cancel,
		read: params.read
	});
}
//#endregion
//#region src/infra/http-body.ts
const DEFAULT_WEBHOOK_MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_WEBHOOK_BODY_TIMEOUT_MS = 3e4;
const DEFAULT_ERROR_MESSAGE = {
	PAYLOAD_TOO_LARGE: "PayloadTooLarge",
	REQUEST_BODY_TIMEOUT: "RequestBodyTimeout",
	CONNECTION_CLOSED: "RequestBodyConnectionClosed"
};
const DEFAULT_ERROR_STATUS_CODE = {
	PAYLOAD_TOO_LARGE: 413,
	REQUEST_BODY_TIMEOUT: 408,
	CONNECTION_CLOSED: 400
};
const DEFAULT_RESPONSE_MESSAGE = {
	PAYLOAD_TOO_LARGE: "Payload too large",
	REQUEST_BODY_TIMEOUT: "Request body timeout",
	CONNECTION_CLOSED: "Connection closed"
};
var RequestBodyLimitError = class extends Error {
	constructor(init) {
		super(init.message ?? DEFAULT_ERROR_MESSAGE[init.code]);
		this.name = "RequestBodyLimitError";
		this.code = init.code;
		this.statusCode = DEFAULT_ERROR_STATUS_CODE[init.code];
	}
};
function isRequestBodyLimitError(error, code) {
	if (!(error instanceof RequestBodyLimitError)) return false;
	if (!code) return true;
	return error.code === code;
}
function requestBodyErrorToText(code) {
	return DEFAULT_RESPONSE_MESSAGE[code];
}
function parseContentLengthHeader(req) {
	const header = req.headers["content-length"];
	const raw = Array.isArray(header) ? header[0] : header;
	if (typeof raw !== "string") return null;
	const parsed = require_parse_finite_number.parseStrictNonNegativeInteger(raw);
	if (parsed === void 0) return null;
	return parsed;
}
function resolveRequestBodyLimitValues(options) {
	return {
		maxBytes: Number.isFinite(options.maxBytes) ? Math.max(1, Math.floor(options.maxBytes)) : 1,
		timeoutMs: options.timeoutMs === void 0 ? DEFAULT_WEBHOOK_BODY_TIMEOUT_MS : (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(options.timeoutMs, DEFAULT_WEBHOOK_BODY_TIMEOUT_MS)
	};
}
function advanceRequestBodyChunk(chunk, totalBytes, maxBytes) {
	const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
	const nextTotalBytes = totalBytes + buffer.length;
	return {
		buffer,
		totalBytes: nextTotalBytes,
		exceeded: nextTotalBytes > maxBytes
	};
}
function validateMaxBytes(maxBytes) {
	if (!Number.isFinite(maxBytes) || maxBytes < 0) throw new RangeError(`maxBytes must be a non-negative finite number: ${maxBytes}`);
}
async function readResponsePrefixFromReader(reader, maxBytes, options) {
	const chunks = [];
	let total = 0;
	let size = 0;
	let truncated = false;
	try {
		while (true) {
			const { done, value } = options?.chunkTimeoutMs ? await readChunkWithIdleTimeout(reader, options.chunkTimeoutMs, options.onIdleTimeout) : await reader.read();
			if (done) {
				size = total;
				break;
			}
			if (!value?.length) continue;
			const nextTotal = total + value.length;
			if (nextTotal > maxBytes || options?.stopAtLimit && nextTotal === maxBytes) {
				const remaining = maxBytes - total;
				if (remaining > 0) {
					chunks.push(value.subarray(0, remaining));
					total += remaining;
				}
				size = nextTotal;
				truncated = true;
				try {
					await reader.cancel();
				} catch {}
				break;
			}
			chunks.push(value);
			total = nextTotal;
			size = total;
		}
	} finally {
		try {
			reader.releaseLock();
		} catch {}
	}
	return {
		buffer: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total),
		size,
		truncated
	};
}
async function readResponsePrefix(response, maxBytes, options) {
	validateMaxBytes(maxBytes);
	const body = response.body;
	if (!body || typeof body.getReader !== "function") return await withResponseBodyTimeout({
		timeoutMs: options?.timeoutMs,
		onTimeout: options?.onTimeout,
		cancel: async (error) => await body?.cancel(error),
		read: async () => {
			const fallback = Buffer.from(await response.arrayBuffer());
			if (fallback.length > maxBytes) return {
				buffer: fallback.subarray(0, maxBytes),
				size: fallback.length,
				truncated: true
			};
			return {
				buffer: fallback,
				size: fallback.length,
				truncated: false
			};
		}
	});
	const reader = body.getReader();
	return await withResponseBodyTimeout({
		timeoutMs: options?.timeoutMs,
		onTimeout: options?.onTimeout,
		cancel: async (error) => await reader.cancel(error),
		read: async () => await readResponsePrefixFromReader(reader, maxBytes, options)
	});
}
/** Reads and decodes a bounded text prefix while cancelling unread overflow. */
async function readResponseTextPrefix(response, maxBytes, options) {
	const prefix = await readResponsePrefix(response, maxBytes, {
		...options,
		stopAtLimit: true
	});
	return {
		text: (0, _gabrielvfonseca_normalization_core.decodeTextPrefix)(prefix.buffer, { truncated: prefix.truncated }),
		size: prefix.size,
		truncated: prefix.truncated
	};
}
/** Reads a response body under byte, idle, and overall timeout bounds. */
async function readResponseWithLimit(response, maxBytes, options) {
	const onOverflow = options?.onOverflow ?? ((params) => /* @__PURE__ */ new Error(`Content too large: ${params.size} bytes (limit: ${params.maxBytes} bytes)`));
	const prefix = await readResponsePrefix(response, maxBytes, {
		chunkTimeoutMs: options?.chunkTimeoutMs,
		onIdleTimeout: options?.onIdleTimeout,
		timeoutMs: options?.timeoutMs,
		onTimeout: options?.onTimeout
	});
	if (prefix.truncated) throw onOverflow({
		size: prefix.size,
		maxBytes,
		res: response
	});
	return prefix.buffer;
}
/** Reads a small collapsed text prefix from a response body for diagnostics/errors. */
async function readResponseTextSnippet(response, options) {
	const maxBytes = options?.maxBytes ?? 8 * 1024;
	const maxChars = options?.maxChars ?? 200;
	const prefix = await readResponseTextPrefix(response, maxBytes, {
		chunkTimeoutMs: options?.chunkTimeoutMs,
		onIdleTimeout: options?.onIdleTimeout,
		timeoutMs: options?.timeoutMs,
		onTimeout: options?.onTimeout
	});
	if (!prefix.text) return;
	const collapsed = prefix.text.replace(/\s+/g, " ").trim();
	if (!collapsed) return;
	if (collapsed.length > maxChars) return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(collapsed, maxChars)}…`;
	return prefix.truncated ? `${collapsed}…` : collapsed;
}
async function readRequestBodyWithLimit(req, options) {
	const { maxBytes, timeoutMs } = resolveRequestBodyLimitValues(options);
	const encoding = options.encoding ?? "utf-8";
	const declaredLength = parseContentLengthHeader(req);
	if (declaredLength !== null && declaredLength > maxBytes) {
		const error = new RequestBodyLimitError({ code: "PAYLOAD_TOO_LARGE" });
		if (!req.destroyed) req.destroy();
		throw error;
	}
	return await new Promise((resolve, reject) => {
		let done = false;
		let ended = false;
		let totalBytes = 0;
		const chunks = [];
		const cleanup = () => {
			req.removeListener("data", onData);
			req.removeListener("end", onEnd);
			req.removeListener("error", onError);
			req.removeListener("close", onClose);
			(0, node_timers.clearTimeout)(timer);
		};
		const finish = (cb) => {
			if (done) return;
			done = true;
			cleanup();
			cb();
		};
		const fail = (error) => {
			finish(() => reject(error));
		};
		const timer = (0, node_timers.setTimeout)(() => {
			const error = new RequestBodyLimitError({ code: "REQUEST_BODY_TIMEOUT" });
			if (!req.destroyed) req.destroy();
			fail(error);
		}, timeoutMs);
		const onData = (chunk) => {
			if (done) return;
			const progress = advanceRequestBodyChunk(chunk, totalBytes, maxBytes);
			totalBytes = progress.totalBytes;
			if (progress.exceeded) {
				const error = new RequestBodyLimitError({ code: "PAYLOAD_TOO_LARGE" });
				if (!req.destroyed) req.destroy();
				fail(error);
				return;
			}
			chunks.push(progress.buffer);
		};
		const onEnd = () => {
			ended = true;
			finish(() => resolve(Buffer.concat(chunks).toString(encoding)));
		};
		const onError = (error) => {
			if (done) return;
			fail(error);
		};
		const onClose = () => {
			if (done || ended) return;
			fail(new RequestBodyLimitError({ code: "CONNECTION_CLOSED" }));
		};
		req.on("data", onData);
		req.on("end", onEnd);
		req.on("error", onError);
		req.on("close", onClose);
	});
}
async function readJsonBodyWithLimit(req, options) {
	try {
		const trimmed = (await readRequestBodyWithLimit(req, options)).trim();
		if (!trimmed) {
			if (options.emptyObjectOnEmpty === false) return {
				ok: false,
				code: "INVALID_JSON",
				error: "empty payload"
			};
			return {
				ok: true,
				value: {}
			};
		}
		try {
			return {
				ok: true,
				value: JSON.parse(trimmed)
			};
		} catch (error) {
			return {
				ok: false,
				code: "INVALID_JSON",
				error: require_errors.formatErrorMessage(error)
			};
		}
	} catch (error) {
		if (isRequestBodyLimitError(error)) return {
			ok: false,
			code: error.code,
			error: requestBodyErrorToText(error.code)
		};
		return {
			ok: false,
			code: "INVALID_JSON",
			error: require_errors.formatErrorMessage(error)
		};
	}
}
//#endregion
Object.defineProperty(exports, "DEFAULT_WEBHOOK_MAX_BODY_BYTES", {
	enumerable: true,
	get: function() {
		return DEFAULT_WEBHOOK_MAX_BODY_BYTES;
	}
});
Object.defineProperty(exports, "readChunkWithIdleTimeout", {
	enumerable: true,
	get: function() {
		return readChunkWithIdleTimeout;
	}
});
Object.defineProperty(exports, "readJsonBodyWithLimit", {
	enumerable: true,
	get: function() {
		return readJsonBodyWithLimit;
	}
});
Object.defineProperty(exports, "readResponseTextPrefix", {
	enumerable: true,
	get: function() {
		return readResponseTextPrefix;
	}
});
Object.defineProperty(exports, "readResponseTextSnippet", {
	enumerable: true,
	get: function() {
		return readResponseTextSnippet;
	}
});
Object.defineProperty(exports, "readResponseWithLimit", {
	enumerable: true,
	get: function() {
		return readResponseWithLimit;
	}
});
Object.defineProperty(exports, "requestBodyErrorToText", {
	enumerable: true,
	get: function() {
		return requestBodyErrorToText;
	}
});
