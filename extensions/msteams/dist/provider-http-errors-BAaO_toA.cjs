const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./parse-finite-number-BTqU_Omp.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_http_body = require("./http-body-BwUnoq2M.cjs");
require("./boolean-DrgQ-UMw.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/agents/provider-http-errors.ts
/**
* Shared provider HTTP error normalization helpers.
*
* Transport adapters use this module to turn provider-specific response bodies,
* request ids, and binary payload guardrails into stable Operator error shapes.
*/
const ERROR_BODY_METADATA_LIMIT = 500;
const PROVIDER_JSON_RESPONSE_MAX_BYTES = 16 * 1024 * 1024;
/** Returns a plain object view for provider JSON payloads when one exists. */
function asObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
/** Trims provider error details to a log- and prompt-safe preview length. */
function truncateErrorDetail(detail, limit = 220) {
	return detail.length <= limit ? detail : `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(detail, limit - 1)}…`;
}
/** Redacts secrets before preserving a bounded provider error body preview. */
function redactProviderErrorBody(body) {
	return truncateErrorDetail(require_redact.redactSensitiveText(body), ERROR_BODY_METADATA_LIMIT);
}
/** Reads at most `limitBytes` from a response body without buffering provider-sized failures. */
async function readResponseTextLimited(response, limitBytes = 16 * 1024) {
	if (limitBytes <= 0) return "";
	return (await require_http_body.readResponseTextPrefix(response, limitBytes)).text;
}
/** Formats common provider JSON error payload shapes into one readable detail string. */
function formatProviderErrorPayload(payload) {
	const root = asObject(payload);
	const detailObject = asObject(root?.detail);
	const subject = asObject(root?.error) ?? detailObject ?? root;
	if (!subject) return;
	const errorDescription = require_string_coerce.normalizeOptionalString(subject.error_description) ?? require_string_coerce.normalizeOptionalString(root?.error_description);
	const oauthCode = errorDescription ? require_string_coerce.normalizeOptionalString(root?.error) : void 0;
	const message = require_string_coerce.normalizeOptionalString(subject.message) ?? require_string_coerce.normalizeOptionalString(subject.detail) ?? errorDescription ?? require_string_coerce.normalizeOptionalString(root?.message) ?? require_string_coerce.normalizeOptionalString(root?.error) ?? require_string_coerce.normalizeOptionalString(root?.detail);
	const type = require_string_coerce.normalizeOptionalString(subject.type);
	const code = require_string_coerce.normalizeOptionalString(subject.code) ?? require_string_coerce.normalizeOptionalString(subject.status) ?? oauthCode;
	const metadata = [type ? `type=${type}` : void 0, code ? `code=${code}` : void 0].filter((value) => Boolean(value)).join(", ");
	if (message && metadata) return `${truncateErrorDetail(message)} [${metadata}]`;
	if (message) return truncateErrorDetail(message);
	if (metadata) return `[${metadata}]`;
}
function extractProviderErrorPayloadMetadata(payload) {
	const root = asObject(payload);
	const detailObject = asObject(root?.detail);
	const subject = asObject(root?.error) ?? detailObject ?? root;
	if (!subject) return {};
	const detail = formatProviderErrorPayload(payload);
	const type = require_string_coerce.normalizeOptionalString(subject.type);
	const oauthCode = require_string_coerce.normalizeOptionalString(subject.error_description) ?? require_string_coerce.normalizeOptionalString(root?.error_description) ? require_string_coerce.normalizeOptionalString(root?.error) : void 0;
	const code = require_string_coerce.normalizeOptionalString(subject.code) ?? require_string_coerce.normalizeOptionalString(subject.status) ?? oauthCode;
	return {
		...detail ? { detail: require_redact.redactSensitiveText(detail) } : {},
		...code ? { code } : {},
		...type ? { type } : {}
	};
}
/** Extracts normalized provider error metadata while keeping the raw body bounded and redacted. */
async function extractProviderErrorInfo(response) {
	const rawBody = require_string_coerce.normalizeOptionalString(await readResponseTextLimited(response).catch(() => ""));
	const requestId = extractProviderRequestId(response);
	if (!rawBody) return requestId ? { requestId } : {};
	const body = redactProviderErrorBody(rawBody);
	try {
		const metadata = extractProviderErrorPayloadMetadata(JSON.parse(rawBody));
		return {
			...metadata.detail ? { detail: metadata.detail } : { detail: body },
			...metadata.code ? { code: metadata.code } : {},
			...metadata.type ? { type: metadata.type } : {},
			body,
			...requestId ? { requestId } : {}
		};
	} catch {
		return {
			detail: body,
			body,
			...requestId ? { requestId } : {}
		};
	}
}
/** Reads the provider request id header variants used across model and media APIs. */
function extractProviderRequestId(response) {
	return require_string_coerce.normalizeOptionalString(response.headers.get("x-request-id")) ?? require_string_coerce.normalizeOptionalString(response.headers.get("request-id"));
}
/** Error type carrying normalized provider status, request id, code, type, and body metadata. */
var ProviderHttpError = class extends Error {
	constructor(message, params) {
		super(message);
		this.name = "ProviderHttpError";
		this.status = params.status;
		this.statusCode = params.status;
		this.code = params.code;
		this.errorCode = params.code;
		this.errorType = params.type;
		this.errorBody = params.body;
		this.requestId = params.requestId;
	}
};
/** Builds the human-facing provider HTTP error message from normalized metadata. */
function formatProviderHttpErrorMessage(params) {
	const { label, status, detail, requestId, statusPrefix = "" } = params;
	return `${label} (${statusPrefix}${status})` + (detail ? `: ${detail}` : "") + (requestId ? ` [request_id=${requestId}]` : "");
}
/** Creates a normalized provider HTTP error from a failed response. */
async function createProviderHttpError(response, label, options) {
	const info = await extractProviderErrorInfo(response);
	return new ProviderHttpError(formatProviderHttpErrorMessage({
		label,
		status: response.status,
		detail: info.detail,
		requestId: info.requestId,
		statusPrefix: options?.statusPrefix
	}), {
		status: response.status,
		code: info.code,
		type: info.type,
		body: info.body,
		requestId: info.requestId
	});
}
/** Throws a normalized provider error when a fetch response is not OK. */
async function assertOkOrThrowProviderError(response, label) {
	if (response.ok) return;
	throw await createProviderHttpError(response, label);
}
/**
* Parses a provider JSON response under a byte cap and wraps malformed JSON with the caller's label.
*
* The body is read through the same bounded reader as binary responses so a provider that streams an
* unbounded JSON body cannot force the runtime to buffer the whole payload before parsing.
*/
async function readProviderJsonResponse(response, label, opts) {
	const bytes = await require_http_body.readResponseWithLimit(response, opts?.maxBytes ?? PROVIDER_JSON_RESPONSE_MAX_BYTES, { onOverflow: ({ maxBytes: maxBytesLocal }) => /* @__PURE__ */ new Error(`${label}: JSON response exceeds ${maxBytesLocal} bytes`) });
	try {
		return JSON.parse(new TextDecoder().decode(bytes));
	} catch (cause) {
		throw new Error(`${label}: malformed JSON response`, { cause });
	}
}
/** Parses a provider JSON response that must be a top-level object. */
async function readProviderJsonObjectResponse(response, label) {
	const object = asObject(await readProviderJsonResponse(response, label));
	if (!object) throw new Error(`${label}: malformed JSON response`);
	return object;
}
/** Parses a provider JSON object response and returns an array field. */
async function readProviderJsonArrayFieldResponse(response, label, field) {
	const value = (await readProviderJsonObjectResponse(response, label))[field];
	if (!Array.isArray(value)) throw new Error(`${label}: malformed JSON response`);
	return value;
}
//#endregion
Object.defineProperty(exports, "ProviderHttpError", {
	enumerable: true,
	get: function() {
		return ProviderHttpError;
	}
});
Object.defineProperty(exports, "assertOkOrThrowProviderError", {
	enumerable: true,
	get: function() {
		return assertOkOrThrowProviderError;
	}
});
Object.defineProperty(exports, "createProviderHttpError", {
	enumerable: true,
	get: function() {
		return createProviderHttpError;
	}
});
Object.defineProperty(exports, "readProviderJsonArrayFieldResponse", {
	enumerable: true,
	get: function() {
		return readProviderJsonArrayFieldResponse;
	}
});
Object.defineProperty(exports, "readProviderJsonResponse", {
	enumerable: true,
	get: function() {
		return readProviderJsonResponse;
	}
});
Object.defineProperty(exports, "readResponseTextLimited", {
	enumerable: true,
	get: function() {
		return readResponseTextLimited;
	}
});
Object.defineProperty(exports, "truncateErrorDetail", {
	enumerable: true,
	get: function() {
		return truncateErrorDetail;
	}
});
