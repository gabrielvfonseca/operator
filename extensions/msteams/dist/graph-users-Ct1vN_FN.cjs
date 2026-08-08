const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
const require_zod_schema_core = require("./zod-schema.core-B7xBEBon.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
require("./runtime-api-CfjFtGFK.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
require("./security-runtime-DuzdER7a.cjs");
require("./fetch-timeout-C6HLIptD.cjs");
const require_fetch_guard = require("./fetch-guard-D5DTj23w.cjs");
const require_provider_http_errors = require("./provider-http-errors-BAaO_toA.cjs");
const require_private_file_store = require("./private-file-store-C0DdQCy-.cjs");
const require_runtime = require("./runtime-B6pBPYCa.cjs");
const require_shared = require("./shared-BAXHm3k7.cjs");
const require_ssrf_runtime = require("./ssrf-runtime-xKtaXpSS.cjs");
const require_oauth_token = require("./oauth.token-CfaE5UGx.cjs");
require("./number-runtime-B0wUrKOM.cjs");
require("./with-timeout-C8BTMfK3.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let zod = require("zod");
let node_module = require("node:module");
let node_buffer = require("node:buffer");
let node_dns_promises = require("node:dns/promises");
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region extensions/msteams/src/request-timeout.ts
const MSTEAMS_REQUEST_TIMEOUT_MS = 3e4;
const MSTEAMS_SHAREPOINT_UPLOAD_BASE_TIMEOUT_MS = 5 * 6e4;
const MSTEAMS_SHAREPOINT_UPLOAD_MIN_BYTES_PER_SECOND = 256 * 1024;
const MSTEAMS_INBOUND_PREPROCESS_TIMEOUT_MS = 1e4;
function createMSTeamsInboundDeadline() {
	return require_shared.createProviderOperationDeadline({
		label: "MS Teams inbound preprocessing",
		timeoutMs: MSTEAMS_INBOUND_PREPROCESS_TIMEOUT_MS
	});
}
function resolveMSTeamsRequestTimeoutMs(deadline) {
	return deadline ? require_shared.resolveProviderOperationTimeoutMs({
		deadline,
		defaultTimeoutMs: MSTEAMS_REQUEST_TIMEOUT_MS
	}) : MSTEAMS_REQUEST_TIMEOUT_MS;
}
/** Bound non-abortable SDK and credential work to the same operation deadline as fetches. */
async function withMSTeamsRequestDeadline(params) {
	const timeoutMs = resolveMSTeamsRequestTimeoutMs(params.deadline);
	return await (0, _openclaw_fs_safe_advanced.withTimeout)(params.work(), timeoutMs, params.label);
}
function resolveMSTeamsSharePointUploadTimeoutMs(sizeInBytes) {
	const transferBudgetMs = Math.ceil((Number.isFinite(sizeInBytes) && sizeInBytes > 0 ? Math.ceil(sizeInBytes) : 0) / MSTEAMS_SHAREPOINT_UPLOAD_MIN_BYTES_PER_SECOND * 1e3);
	return require_parse_finite_number.resolveTimerTimeoutMs(MSTEAMS_SHAREPOINT_UPLOAD_BASE_TIMEOUT_MS + transferBudgetMs, MSTEAMS_SHAREPOINT_UPLOAD_BASE_TIMEOUT_MS, 1);
}
function createMSTeamsRequestTimeoutError(label, timeoutMs) {
	const error = /* @__PURE__ */ new Error(`${label} timed out after ${timeoutMs}ms`);
	error.name = "TimeoutError";
	return error;
}
async function withMSTeamsAbortableRequestTimeout(params) {
	const controller = new AbortController();
	const timeoutMs = require_parse_finite_number.resolveTimerTimeoutMs(params.timeoutMs, MSTEAMS_REQUEST_TIMEOUT_MS, 1);
	const work = Promise.resolve().then(() => params.work(controller.signal));
	try {
		return await (0, _openclaw_fs_safe_advanced.withTimeout)(work, timeoutMs, { createError: () => createMSTeamsRequestTimeoutError(params.label, timeoutMs) });
	} catch (error) {
		controller.abort(error);
		throw error;
	}
}
//#endregion
//#region extensions/msteams/src/response-with-release.ts
const NULL_BODY_STATUSES = /* @__PURE__ */ new Set([
	101,
	204,
	205,
	304
]);
function responseWithRelease(response, release) {
	let released = false;
	const releaseOnce = async () => {
		if (released) return;
		released = true;
		await release();
	};
	if (!response.body || NULL_BODY_STATUSES.has(response.status)) {
		releaseOnce();
		return response;
	}
	const reader = response.body.getReader();
	const body = new ReadableStream({
		async pull(controller) {
			try {
				const next = await reader.read();
				if (next.done) {
					controller.close();
					await releaseOnce();
					return;
				}
				controller.enqueue(next.value);
			} catch (error) {
				await releaseOnce();
				throw error;
			}
		},
		async cancel(reason) {
			reader.cancel(reason).catch(() => void 0);
			await releaseOnce();
		}
	});
	return new Response(body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}
//#endregion
//#region extensions/msteams/src/attachments/shared.ts
const IMAGE_EXT_RE = /\.(avif|bmp|gif|heic|heif|jpe?g|png|tiff?|webp)$/i;
const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
const ATTACHMENT_TAG_RE = /<attachment[^>]+id=["']([^"']+)["'][^>]*>/gi;
const DEFAULT_MEDIA_HOST_ALLOWLIST = [
	"graph.microsoft.com",
	"graph.microsoft.us",
	"graph.microsoft.de",
	"graph.microsoft.cn",
	"sharepoint.com",
	"sharepoint.us",
	"sharepoint.de",
	"sharepoint.cn",
	"sharepoint-df.com",
	"1drv.ms",
	"onedrive.com",
	"teams.microsoft.com",
	"teams.cdn.office.net",
	"statics.teams.cdn.office.net",
	"office.com",
	"office.net",
	"asm.skype.com",
	"ams.skype.com",
	"media.ams.skype.com",
	"trafficmanager.net",
	"botframework.azure.cn",
	"blob.core.windows.net",
	"azureedge.net",
	"microsoft.com"
];
const DEFAULT_MEDIA_AUTH_HOST_ALLOWLIST = [
	"api.botframework.com",
	"botframework.com",
	"smba.trafficmanager.net",
	"botframework.azure.cn",
	"graph.microsoft.com",
	"graph.microsoft.us",
	"graph.microsoft.de",
	"graph.microsoft.cn"
];
const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";
function estimateBase64DecodedBytes(base64) {
	let effectiveLen = 0;
	for (let i = 0; i < base64.length; i += 1) {
		if (base64.charCodeAt(i) <= 32) continue;
		effectiveLen += 1;
	}
	if (effectiveLen === 0) return 0;
	let padding = 0;
	let end = base64.length - 1;
	while (end >= 0 && base64.charCodeAt(end) <= 32) end -= 1;
	if (end >= 0 && base64[end] === "=") {
		padding = 1;
		end -= 1;
		while (end >= 0 && base64.charCodeAt(end) <= 32) end -= 1;
		if (end >= 0 && base64[end] === "=") padding = 2;
	}
	const estimated = Math.floor(effectiveLen * 3 / 4) - padding;
	return Math.max(0, estimated);
}
/**
* Host suffixes for SharePoint/OneDrive shared links that must be fetched via
* the Graph `/shares/{shareId}/driveItem/content` endpoint instead of directly.
*
* Direct fetches of SharePoint/OneDrive shared URLs return empty/HTML landing
* pages unless encoded as a Graph share id. See
* https://learn.microsoft.com/en-us/graph/api/shares-get for the encoding.
*/
const GRAPH_SHARED_LINK_HOST_SUFFIXES = [
	".sharepoint.com",
	".sharepoint.us",
	".sharepoint.de",
	".sharepoint.cn",
	".sharepoint-df.com",
	"1drv.ms",
	"onedrive.live.com",
	"onedrive.com"
];
/**
* Returns true when the URL points at a SharePoint or OneDrive host whose
* shared-link content must be fetched through the Graph shares API rather
* than directly.
*/
function isGraphSharedLinkUrl(url) {
	let host;
	try {
		host = require_string_coerce.normalizeLowercaseStringOrEmpty(new URL(url).hostname);
	} catch {
		return false;
	}
	if (!host) return false;
	return GRAPH_SHARED_LINK_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(suffix));
}
/**
* Encode a SharePoint/OneDrive URL as a Graph shareId using the documented
* `u!` + base64url (no padding) scheme:
* https://learn.microsoft.com/en-us/graph/api/shares-get#encoding-sharing-urls
*/
function encodeGraphShareId(url) {
	return `u!${node_buffer.Buffer.from(url, "utf8").toString("base64url")}`;
}
/**
* When `url` is a SharePoint/OneDrive shared link, return the matching
* `GET /shares/{shareId}/driveItem/content` URL that actually yields the file
* bytes. Returns `undefined` for non-shared-link URLs so callers can fall
* through to the existing fetch path.
*/
function tryBuildGraphSharesUrlForSharedLink(url) {
	if (!isGraphSharedLinkUrl(url)) return;
	return `${GRAPH_ROOT}/shares/${encodeGraphShareId(url)}/driveItem/content`;
}
function resolveRequestUrl(input) {
	if (typeof input === "string") return input;
	if (input instanceof URL) return input.toString();
	if (typeof input === "object" && input && "url" in input && typeof input.url === "string") return input.url;
	try {
		return JSON.stringify(input);
	} catch {
		return "";
	}
}
function normalizeContentType(value) {
	const trimmed = require_string_coerce.normalizeOptionalString(value);
	if (!trimmed) return;
	const parameterIndex = trimmed.indexOf(";");
	if (parameterIndex === -1) return trimmed.toLowerCase();
	return `${trimmed.slice(0, parameterIndex).trim().toLowerCase()}${trimmed.slice(parameterIndex)}`;
}
function inferPlaceholder(params) {
	const mime = require_string_coerce.normalizeLowercaseStringOrEmpty(params.contentType ?? "");
	const name = require_string_coerce.normalizeLowercaseStringOrEmpty(params.fileName ?? "");
	const fileType = require_string_coerce.normalizeLowercaseStringOrEmpty(params.fileType ?? "");
	return mime.startsWith("image/") || IMAGE_EXT_RE.test(name) || IMAGE_EXT_RE.test(`x.${fileType}`) ? "<media:image>" : "<media:document>";
}
function isLikelyImageAttachment(att) {
	const contentType = normalizeContentType(att.contentType) ?? "";
	const name = typeof att.name === "string" ? att.name : "";
	if (contentType.startsWith("image/")) return true;
	if (IMAGE_EXT_RE.test(name)) return true;
	if (contentType === "application/vnd.microsoft.teams.file.download.info" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(att.content)) {
		const fileType = typeof att.content.fileType === "string" ? att.content.fileType : "";
		if (fileType && IMAGE_EXT_RE.test(`x.${fileType}`)) return true;
		const fileName = typeof att.content.fileName === "string" ? att.content.fileName : "";
		if (fileName && IMAGE_EXT_RE.test(fileName)) return true;
	}
	return false;
}
/**
* Returns true if the attachment can be downloaded (any file type).
* Used when downloading all files, not just images.
*/
function isDownloadableAttachment(att) {
	if ((normalizeContentType(att.contentType) ?? "") === "application/vnd.microsoft.teams.file.download.info" && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(att.content) && typeof att.content.downloadUrl === "string") return true;
	if (typeof att.contentUrl === "string" && att.contentUrl.trim()) return true;
	return false;
}
function isHtmlAttachment(att) {
	return (normalizeContentType(att.contentType) ?? "").startsWith("text/html");
}
function extractHtmlFromAttachment(att) {
	if (!isHtmlAttachment(att)) return;
	if (typeof att.content === "string") return att.content;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(att.content)) return;
	return typeof att.content.text === "string" ? att.content.text : typeof att.content.body === "string" ? att.content.body : typeof att.content.content === "string" ? att.content.content : void 0;
}
function canonicalizeInlineBase64Payload(value) {
	let cleaned = "";
	let padding = 0;
	let sawPadding = false;
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code <= 32) continue;
		if (code === 61) {
			padding += 1;
			if (padding > 2) return;
			sawPadding = true;
			cleaned += "=";
			continue;
		}
		if (sawPadding || !(code >= 65 && code <= 90 || code >= 97 && code <= 122 || code >= 48 && code <= 57 || code === 43 || code === 47)) return;
		cleaned += value[index];
	}
	return cleaned && cleaned.length % 4 === 0 ? cleaned : void 0;
}
function decodeDataImageWithLimits(src, opts) {
	const match = /^data:(image\/[a-z0-9.+-]+)?(;base64)?,(.*)$/i.exec(src);
	if (!match) return {
		candidate: null,
		estimatedBytes: 0
	};
	const contentType = require_string_coerce.normalizeLowercaseStringOrEmpty(match[1] ?? "");
	if (!Boolean(match[2])) return {
		candidate: null,
		estimatedBytes: 0
	};
	const canonicalPayload = canonicalizeInlineBase64Payload(match[3] ?? "");
	if (!canonicalPayload) return {
		candidate: null,
		estimatedBytes: 0
	};
	const estimatedBytes = estimateBase64DecodedBytes(canonicalPayload);
	if (estimatedBytes <= 0) return {
		candidate: null,
		estimatedBytes: 0
	};
	if (typeof opts.maxInlineBytes === "number" && estimatedBytes > opts.maxInlineBytes) return {
		candidate: null,
		estimatedBytes
	};
	try {
		return {
			candidate: {
				kind: "data",
				data: node_buffer.Buffer.from(canonicalPayload, "base64"),
				contentType,
				placeholder: "<media:image>"
			},
			estimatedBytes
		};
	} catch {
		return {
			candidate: null,
			estimatedBytes: 0
		};
	}
}
function fileHintFromUrl(src) {
	try {
		return new URL(src).pathname.split("/").pop() || void 0;
	} catch {
		return;
	}
}
function extractInlineImageCandidates(attachments, limits) {
	const out = [];
	let totalEstimatedInlineBytes = 0;
	outerLoop: for (const att of attachments) {
		const html = extractHtmlFromAttachment(att);
		if (!html) continue;
		IMG_SRC_RE.lastIndex = 0;
		let match = IMG_SRC_RE.exec(html);
		while (match) {
			const src = match[1]?.trim();
			if (src && !src.startsWith("cid:")) if (src.startsWith("data:")) {
				const { candidate: decoded, estimatedBytes } = decodeDataImageWithLimits(src, { maxInlineBytes: limits?.maxInlineBytes });
				if (decoded) {
					const nextTotal = totalEstimatedInlineBytes + estimatedBytes;
					if (typeof limits?.maxInlineTotalBytes === "number" && nextTotal > limits.maxInlineTotalBytes) break outerLoop;
					totalEstimatedInlineBytes = nextTotal;
					out.push(decoded);
				}
			} else out.push({
				kind: "url",
				url: src,
				fileHint: fileHintFromUrl(src),
				placeholder: "<media:image>"
			});
			match = IMG_SRC_RE.exec(html);
		}
	}
	return out;
}
function safeHostForUrl(url) {
	try {
		return require_string_coerce.normalizeLowercaseStringOrEmpty(new URL(url).hostname);
	} catch {
		return "invalid-url";
	}
}
function resolveAllowedHosts(input) {
	return require_ssrf_runtime.normalizeHostnameSuffixAllowlist(input, DEFAULT_MEDIA_HOST_ALLOWLIST);
}
function resolveAuthAllowedHosts(input) {
	return require_ssrf_runtime.normalizeHostnameSuffixAllowlist(input, DEFAULT_MEDIA_AUTH_HOST_ALLOWLIST);
}
function isMockFetchFn(fetchFn) {
	const candidate = fetchFn;
	return Boolean(candidate.mock || Object.hasOwn(candidate, "_isMockFunction"));
}
function resolveGuardedFetchImpl(params) {
	if (!params.fetchFn) return;
	if (params.fetchFnSupportsDispatcher === true || params.fetchFn === fetch || params.fetchFn === globalThis.fetch || isMockFetchFn(params.fetchFn)) return params.fetchFn;
	throw new Error("MSTeams attachment fetchFn must set fetchFnSupportsDispatcher to use guarded DNS pinning");
}
function resolveRetainedAuthorizationRedirectHostnameAllowlist(input) {
	if (!input) return;
	if (input.includes("*")) return ["*"];
	return resolveMediaSsrfPolicy(input)?.hostnameAllowlist;
}
function resolveAttachmentFetchPolicy(params) {
	return {
		allowHosts: resolveAllowedHosts(params?.allowHosts),
		authAllowHosts: resolveAuthAllowedHosts(params?.authAllowHosts)
	};
}
function isUrlAllowed(url, allowlist) {
	return require_ssrf_runtime.isHttpsUrlAllowedByHostnameSuffixAllowlist(url, allowlist);
}
function applyAuthorizationHeaderForUrl(params) {
	if (!params.bearerToken) {
		params.headers.delete("Authorization");
		return;
	}
	if (isUrlAllowed(params.url, params.authAllowHosts)) {
		params.headers.set("Authorization", `Bearer ${params.bearerToken}`);
		return;
	}
	params.headers.delete("Authorization");
}
function resolveMediaSsrfPolicy(allowHosts) {
	return require_ssrf_runtime.buildHostnameAllowlistPolicyFromSuffixAllowlist(allowHosts);
}
/**
* Returns true if the given IPv4 or IPv6 address is in a private, loopback,
* or link-local range that must never be reached from media downloads.
*
* Delegates to the SDK's `isPrivateIpAddress` which handles IPv4-mapped IPv6,
* expanded notation, NAT64, 6to4, Teredo, octal IPv4, and fails closed on
* parse errors.
*/
const isPrivateOrReservedIP = require_fetch_guard.isPrivateIpAddress;
/**
* Resolve a hostname via DNS and reject private/reserved IPs.
* Throws if the resolved IP is private or resolution fails.
*/
async function resolveAndValidateIP(hostname, resolveFn) {
	const resolve = resolveFn ?? node_dns_promises.lookup;
	let resolved;
	try {
		resolved = await resolve(hostname);
	} catch {
		throw new Error(`DNS resolution failed for "${hostname}"`);
	}
	if (isPrivateOrReservedIP(resolved.address)) throw new Error(`Hostname "${hostname}" resolves to private/reserved IP (${resolved.address})`);
	return resolved.address;
}
/** Maximum number of redirects to follow in safeFetch. */
const MAX_SAFE_REDIRECTS = 5;
/**
* Fetch a URL with redirect: "manual", validating each redirect target
* against the hostname allowlist and optional DNS-resolved IP (anti-SSRF).
*
* This prevents:
* - Auto-following redirects to non-allowlisted hosts
* - DNS rebinding attacks when a lookup function is provided
*/
async function safeFetch(params) {
	const resolveFn = params.resolveFn ?? node_dns_promises.lookup;
	const hasDispatcher = Boolean(params.requestInit && typeof params.requestInit === "object" && "dispatcher" in params.requestInit);
	const currentHeaders = new Headers(params.requestInit?.headers);
	let currentUrl = params.url;
	if (!isUrlAllowed(currentUrl, params.allowHosts)) throw new Error(`Initial download URL blocked: ${currentUrl}`);
	if (currentHeaders.has("authorization") && params.authorizationAllowHosts && !isUrlAllowed(currentUrl, params.authorizationAllowHosts)) currentHeaders.delete("authorization");
	if (!hasDispatcher) {
		const guarded = await require_fetch_guard.fetchWithSsrFGuard({
			url: currentUrl,
			fetchImpl: resolveGuardedFetchImpl({
				fetchFn: params.fetchFn,
				fetchFnSupportsDispatcher: params.fetchFnSupportsDispatcher
			}),
			init: {
				...params.requestInit,
				headers: currentHeaders
			},
			maxRedirects: MAX_SAFE_REDIRECTS,
			requireHttps: true,
			policy: resolveMediaSsrfPolicy(params.allowHosts),
			lookupFn: resolveFn,
			retainAuthorizationRedirectHostnameAllowlist: resolveRetainedAuthorizationRedirectHostnameAllowlist(params.authorizationAllowHosts),
			auditContext: "msteams.attachment",
			timeoutMs: params.timeoutMs ?? 3e4
		});
		return responseWithRelease(guarded.response, guarded.release);
	}
	if (resolveFn) try {
		const initialHost = new URL(currentUrl).hostname;
		await resolveAndValidateIP(initialHost, resolveFn);
	} catch {
		throw new Error(`Initial download URL blocked: ${currentUrl}`);
	}
	for (let i = 0; i <= MAX_SAFE_REDIRECTS; i++) {
		const res = await (params.fetchFn ?? fetch)(currentUrl, {
			...params.requestInit,
			headers: currentHeaders,
			redirect: "manual"
		});
		if (![
			301,
			302,
			303,
			307,
			308
		].includes(res.status)) return res;
		const location = res.headers.get("location");
		if (!location) return res;
		let redirectUrl;
		try {
			redirectUrl = new URL(location, currentUrl).toString();
		} catch {
			throw new Error(`Invalid redirect URL: ${location}`);
		}
		if (!isUrlAllowed(redirectUrl, params.allowHosts)) throw new Error(`Media redirect target blocked by allowlist: ${redirectUrl}`);
		if (currentHeaders.has("authorization") && params.authorizationAllowHosts && !isUrlAllowed(redirectUrl, params.authorizationAllowHosts)) currentHeaders.delete("authorization");
		if (hasDispatcher) return res;
		if (resolveFn) {
			const redirectHost = new URL(redirectUrl).hostname;
			await resolveAndValidateIP(redirectHost, resolveFn);
		}
		currentUrl = redirectUrl;
	}
	throw new Error(`Too many redirects (>${MAX_SAFE_REDIRECTS})`);
}
async function safeFetchWithPolicy(params) {
	return await safeFetch({
		url: params.url,
		allowHosts: params.policy.allowHosts,
		authorizationAllowHosts: params.policy.authAllowHosts,
		fetchFn: params.fetchFn,
		fetchFnSupportsDispatcher: params.fetchFnSupportsDispatcher,
		requestInit: params.requestInit,
		resolveFn: params.resolveFn,
		timeoutMs: params.timeoutMs
	});
}
//#endregion
//#region extensions/msteams/src/cloud.ts
const DEFAULT_MSTEAMS_CLOUD = "Public";
const PUBLIC_MSTEAMS_SERVICE_HOST = "smba.trafficmanager.net";
const CHINA_BOT_FRAMEWORK_SERVICE_HOST = "botframework.azure.cn";
function normalizeOptionalServiceUrl(value) {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	try {
		const parsed = new URL(trimmed);
		parsed.hash = "";
		parsed.search = "";
		parsed.pathname = parsed.pathname.replace(/\/+$/, "");
		return {
			value: parsed.toString().replace(/\/+$/, ""),
			host: parsed.hostname.toLowerCase()
		};
	} catch {
		return null;
	}
}
function resolveMSTeamsSdkCloudOptions(cfg) {
	const cloud = cfg?.cloud ?? DEFAULT_MSTEAMS_CLOUD;
	const serviceUrl = cfg?.serviceUrl?.trim();
	if (cloud !== "Public" && cloud !== "China" && !serviceUrl) throw new Error(`channels.msteams.cloud=${cloud} requires channels.msteams.serviceUrl so SDK proactive operations use the matching Teams Bot Connector endpoint.`);
	return {
		cloud,
		...serviceUrl ? { serviceUrl } : {}
	};
}
function isChinaBotFrameworkServiceHost(host) {
	return host === CHINA_BOT_FRAMEWORK_SERVICE_HOST || host.endsWith(`.${CHINA_BOT_FRAMEWORK_SERVICE_HOST}`);
}
function isChinaBotFrameworkServiceUrl(value) {
	const parsed = normalizeOptionalServiceUrl(value);
	return Boolean(parsed && isChinaBotFrameworkServiceHost(parsed.host));
}
function validateMSTeamsProactiveServiceUrlBoundary(params) {
	const configured = normalizeOptionalServiceUrl(params.configuredServiceUrl);
	if (params.cloud !== "Public" && params.cloud !== "China" && !configured) throw new Error(`msteams proactive send blocked for ${params.conversationId}: channels.msteams.cloud=${params.cloud} requires channels.msteams.serviceUrl so SDK proactive operations use the matching Teams Bot Connector endpoint.`);
	if (params.cloud === "China" && configured && !isChinaBotFrameworkServiceHost(configured.host)) throw new Error(`msteams proactive send blocked for ${params.conversationId}: configured Teams serviceUrl (${configured.value}) is not a Microsoft Teams China Bot Framework channel endpoint.`);
	if (params.cloud !== "China" && configured && isChinaBotFrameworkServiceHost(configured.host)) throw new Error(`msteams proactive send blocked for ${params.conversationId}: configured Teams serviceUrl (${configured.value}) requires channels.msteams.cloud=China.`);
	if (configured) {
		const stored = normalizeOptionalServiceUrl(params.storedServiceUrl);
		if (!stored) throw new Error(`msteams proactive send blocked for ${params.conversationId}: stored conversation reference is missing a valid serviceUrl. Ask the bot to receive a new Teams message in this conversation, then retry.`);
		if (stored.host !== configured.host) throw new Error(`msteams proactive send blocked for ${params.conversationId}: stored conversation serviceUrl (${stored.value}) does not match configured Teams SDK serviceUrl host (${configured.host}). Set channels.msteams.cloud/channels.msteams.serviceUrl for the Teams cloud that owns this conversation, or refresh the stored conversation by receiving a new message.`);
		return;
	}
	const stored = normalizeOptionalServiceUrl(params.storedServiceUrl);
	if (!stored) throw new Error(`msteams proactive send blocked for ${params.conversationId}: stored conversation reference is missing a valid serviceUrl. Ask the bot to receive a new Teams message in this conversation, then retry.`);
	if (params.cloud === "China") {
		if (!isChinaBotFrameworkServiceHost(stored.host)) throw new Error(`msteams proactive send blocked for ${params.conversationId}: stored conversation serviceUrl (${stored.value}) is not a Microsoft Teams China Bot Framework channel endpoint. Use a conversation reference received from the China/21Vianet Teams cloud.`);
		return;
	}
	if (isChinaBotFrameworkServiceUrl(stored.value)) throw new Error(`msteams proactive send blocked for ${params.conversationId}: stored conversation serviceUrl (${stored.value}) requires channels.msteams.cloud=China.`);
	if (stored.host !== PUBLIC_MSTEAMS_SERVICE_HOST) throw new Error(`msteams proactive send blocked for ${params.conversationId}: stored conversation serviceUrl (${stored.value}) is not a Microsoft Teams public-cloud Bot Connector endpoint. Set channels.msteams.cloud and channels.msteams.serviceUrl for the supported Teams cloud that owns this conversation.`);
}
//#endregion
//#region extensions/msteams/src/bot-framework-service-url.ts
const BOT_FRAMEWORK_SERVICE_URL_HOST_ALLOWLIST = require_ssrf_runtime.normalizeHostnameSuffixAllowlist([
	"smba.trafficmanager.net",
	"smba.infra.gcc.teams.microsoft.com",
	"smba.infra.gov.teams.microsoft.us",
	"smba.infra.dod.teams.microsoft.us",
	"botframework.azure.cn"
]);
function describeBotFrameworkServiceUrlHost(serviceUrl) {
	try {
		return new URL(serviceUrl.trim()).hostname || "invalid-url";
	} catch {
		return "invalid-url";
	}
}
function isAllowedBotFrameworkServiceUrl(serviceUrl) {
	if (typeof serviceUrl !== "string") return false;
	const trimmed = serviceUrl.trim();
	return Boolean(trimmed && require_ssrf_runtime.isHttpsUrlAllowedByHostnameSuffixAllowlist(trimmed, BOT_FRAMEWORK_SERVICE_URL_HOST_ALLOWLIST));
}
function tryNormalizeBotFrameworkServiceUrl(serviceUrl) {
	if (!isAllowedBotFrameworkServiceUrl(serviceUrl)) return;
	return serviceUrl.trim().replace(/\/+$/, "");
}
function normalizeBotFrameworkServiceUrl(serviceUrl) {
	const normalized = tryNormalizeBotFrameworkServiceUrl(serviceUrl);
	if (normalized) return normalized;
	throw new Error(`Blocked Microsoft Teams serviceUrl host: ${describeBotFrameworkServiceUrlHost(serviceUrl)}`);
}
//#endregion
//#region extensions/msteams/src/user-agent.ts
let cachedUserAgent;
function resolveTeamsSdkVersion() {
	try {
		return (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href)("@microsoft/teams.apps/package.json").version ?? "unknown";
	} catch {
		return "unknown";
	}
}
function resolveOperatorVersion() {
	try {
		return require_runtime.getMSTeamsRuntime().version;
	} catch {
		return "unknown";
	}
}
/**
* Build a combined User-Agent string that preserves the Teams SDK identity
* and appends the Operator version.
*
* Format: "teams.ts[apps]/<sdk-version> Operator/<operator-version>"
* Example: "teams.ts[apps]/2.0.5 Operator/2026.3.22"
*
* This lets the Teams backend track SDK usage while also identifying the
* host application.
*/
function buildUserAgent() {
	if (cachedUserAgent) return cachedUserAgent;
	cachedUserAgent = `teams.ts[apps]/${resolveTeamsSdkVersion()} Operator/${resolveOperatorVersion()}`;
	return cachedUserAgent;
}
/**
* User-Agent fragment for the Teams SDK App's client. The SDK's Client.clone
* merges this with its own `teams.ts[apps]/<sdk-version>` identifier, so we
* only contribute the Operator piece — passing the full `buildUserAgent()`
* would double-print the SDK token.
*
* Format: "Operator/<operator-version>"
*/
function buildOperatorUserAgentFragment() {
	return `Operator/${resolveOperatorVersion()}`;
}
function ensureUserAgentHeader(headers) {
	const nextHeaders = new Headers(headers);
	if (!nextHeaders.has("User-Agent")) nextHeaders.set("User-Agent", buildUserAgent());
	return nextHeaders;
}
//#endregion
//#region extensions/msteams/src/sdk.ts
const AZURE_IDENTITY_MODULE = "@azure/identity";
const loadAzureIdentity = require_lazy_runtime.createLazyRuntimeModule(() => import(AZURE_IDENTITY_MODULE));
const loadSdkModules = require_lazy_runtime.createLazyRuntimeModule(() => Promise.all([import("@microsoft/teams.apps"), import("@microsoft/teams.api")]).then(([apps, api]) => ({
	App: apps.App,
	ExpressAdapter: apps.ExpressAdapter,
	cloudFromName: api.cloudFromName
})));
/**
* Lazily construct an ExpressAdapter that the Teams SDK App can register its
* routes on. The dynamic import keeps the SDK bundle off the hot startup path
* when msteams is disabled; the structural return type matches what
* `loadMSTeamsSdkWithAuth` accepts as its `httpServerAdapter` option.
*/
async function createMSTeamsExpressAdapter(serverOrApp) {
	const { ExpressAdapter } = await loadSdkModules();
	return new ExpressAdapter(serverOrApp);
}
/**
* Create a Teams SDK App instance from credentials. The App manages token
* acquisition, JWT validation, and the HTTP server lifecycle.
*
* Auth modes:
* - Secret: clientId + clientSecret → MSAL client credential flow (SDK built-in)
* - Managed identity: clientId + managedIdentityClientId → SDK built-in MI support
* - Certificate: clientId + custom token provider via @azure/identity
*/
async function createMSTeamsApp(creds, options) {
	const { App, cloudFromName } = await loadSdkModules();
	const cloud = options?.cloud ?? "Public";
	const serviceUrl = options?.serviceUrl ? normalizeBotFrameworkServiceUrl(options.serviceUrl) : void 0;
	const appOptions = {
		client: options?.httpClient ?? {
			headers: { "User-Agent": buildOperatorUserAgentFragment() },
			timeout: 3e4
		},
		...options?.httpServerAdapter ? { httpServerAdapter: options.httpServerAdapter } : {},
		...options?.messagingEndpoint ? { messagingEndpoint: options.messagingEndpoint } : {},
		cloud: cloudFromName(cloud),
		...serviceUrl ? { serviceUrl } : {},
		...options?.oauthDefaultConnectionName ? { oauth: { defaultConnectionName: options.oauthDefaultConnectionName } } : {}
	};
	if (creds.type === "federated") return createFederatedApp(creds, App, appOptions);
	return new App({
		clientId: creds.appId,
		clientSecret: creds.appPassword,
		tenantId: creds.tenantId,
		...appOptions
	});
}
function createFederatedApp(creds, App, appOptions) {
	if (creds.useManagedIdentity) return new App({
		clientId: creds.appId,
		tenantId: creds.tenantId,
		managedIdentityClientId: creds.managedIdentityClientId ?? "system",
		...appOptions
	});
	if (!creds.certificatePath) throw new Error("Federated credentials require either a certificate path or managed identity.");
	let privateKey;
	try {
		privateKey = node_fs.readFileSync(creds.certificatePath, "utf-8");
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		throw new Error(`Failed to read certificate file at '${creds.certificatePath}': ${msg}`, { cause: err });
	}
	return createCertificateApp(creds, privateKey, App, appOptions);
}
function createCertificateApp(creds, privateKey, App, appOptions) {
	let credentialPromise = null;
	const getCredential = async () => {
		if (!credentialPromise) credentialPromise = loadAzureIdentity().then((az) => new az.ClientCertificateCredential(creds.tenantId, creds.appId, { certificate: privateKey }));
		return credentialPromise;
	};
	const tokenProvider = async (scope) => {
		const token = await (await getCredential()).getToken(scope);
		if (!token?.token) throw new Error("Failed to acquire token via certificate credential.");
		return token.token;
	};
	return new App({
		clientId: creds.appId,
		tenantId: creds.tenantId,
		token: tokenProvider,
		...appOptions
	});
}
/**
* Build a token provider that uses the Teams SDK App's public tokenManager
* for token acquisition.
*/
function createMSTeamsTokenProvider(app) {
	const tokenToString = (token) => {
		if (token == null) return "";
		return token.toString();
	};
	return { async getAccessToken(scope) {
		if (scope.includes("graph.microsoft.com") || scope.includes("graph.microsoft.us") || scope.includes("microsoftgraph.chinacloudapi.cn")) {
			if (app.cloud?.graphScope?.includes("microsoftgraph.chinacloudapi.cn")) throw new Error("Microsoft Teams Graph operations are not supported for channels.msteams.cloud=China until Graph requests are routed through the Azure China Graph endpoint.");
			return tokenToString(await app.tokenManager.getGraphToken());
		}
		return tokenToString(await app.tokenManager.getBotToken());
	} };
}
async function loadMSTeamsSdkWithAuth(creds, options) {
	return { app: await createMSTeamsApp(creds, options) };
}
//#endregion
//#region extensions/msteams/src/token-response.ts
function readAccessToken(value) {
	if (typeof value === "string") return value;
	if (value && typeof value === "object") {
		const token = value.accessToken ?? value.token;
		return typeof token === "string" ? token : null;
	}
	return null;
}
//#endregion
//#region src/plugin-sdk/secret-input-schema.ts
const providerSchema = zod.z.string().regex(require_ref_contract.SECRET_PROVIDER_ALIAS_PATTERN, "Secret reference provider must match /^[a-z][a-z0-9_-]{0,63}$/ (example: \"default\").");
zod.z.union([zod.z.string(), zod.z.discriminatedUnion("source", [
	zod.z.object({
		source: zod.z.literal("env"),
		provider: providerSchema,
		id: zod.z.string().regex(require_types_secrets.ENV_SECRET_REF_ID_RE, "Env secret reference id must match /^[A-Z][A-Z0-9_]{0,127}$/ (example: \"OPENAI_API_KEY\").")
	}).strict(),
	zod.z.object({
		source: zod.z.literal("file"),
		provider: providerSchema,
		id: zod.z.string().refine(require_ref_contract.isValidFileSecretRefId, "File secret reference id must be an absolute JSON pointer (example: \"/providers/openai/apiKey\"), or \"value\" for singleValue mode.")
	}).strict(),
	zod.z.object({
		source: zod.z.literal("exec"),
		provider: providerSchema,
		id: zod.z.string().refine(require_ref_contract.isValidExecSecretRefId, require_ref_contract.formatExecSecretRefIdValidationMessage())
	}).strict()
])]).register(require_zod_schema_core.sensitive);
//#endregion
//#region extensions/msteams/src/storage.ts
function resolveMSTeamsStorePath(params) {
	if (params.storePath) return params.storePath;
	if (params.stateDir) return node_path.default.join(params.stateDir, params.filename);
	const env = params.env ?? process.env;
	const stateDir = params.homedir ? require_runtime.getMSTeamsRuntime().state.resolveStateDir(env, params.homedir) : require_runtime.getMSTeamsRuntime().state.resolveStateDir(env);
	return node_path.default.join(stateDir, params.filename);
}
//#endregion
//#region extensions/msteams/src/token.ts
function resolveAuthType(cfg) {
	const fromCfg = cfg?.authType;
	if (fromCfg === "secret" || fromCfg === "federated") return fromCfg;
	if (process.env.MSTEAMS_AUTH_TYPE === "federated") return "federated";
	return "secret";
}
function hasConfiguredMSTeamsCredentials(cfg) {
	const authType = resolveAuthType(cfg);
	const hasAppId = Boolean(require_types_secrets.normalizeSecretInputString(cfg?.appId) || require_types_secrets.normalizeSecretInputString(process.env.MSTEAMS_APP_ID));
	const hasTenantId = Boolean(require_types_secrets.normalizeSecretInputString(cfg?.tenantId) || require_types_secrets.normalizeSecretInputString(process.env.MSTEAMS_TENANT_ID));
	if (authType === "federated") {
		const hasCert = Boolean(cfg?.certificatePath || process.env.MSTEAMS_CERTIFICATE_PATH);
		const hasManagedIdentity = cfg?.useManagedIdentity ?? process.env.MSTEAMS_USE_MANAGED_IDENTITY === "true";
		return hasAppId && hasTenantId && (hasCert || hasManagedIdentity);
	}
	return Boolean(require_types_secrets.normalizeSecretInputString(cfg?.appId) && require_types_secrets.hasConfiguredSecretInput(cfg?.appPassword) && require_types_secrets.normalizeSecretInputString(cfg?.tenantId));
}
function resolveMSTeamsCredentials(cfg) {
	const authType = resolveAuthType(cfg);
	const appId = require_types_secrets.normalizeSecretInputString(cfg?.appId) || require_types_secrets.normalizeSecretInputString(process.env.MSTEAMS_APP_ID);
	const tenantId = require_types_secrets.normalizeSecretInputString(cfg?.tenantId) || require_types_secrets.normalizeSecretInputString(process.env.MSTEAMS_TENANT_ID);
	if (!appId || !tenantId) return;
	if (authType === "federated") {
		const certificatePath = cfg?.certificatePath || process.env.MSTEAMS_CERTIFICATE_PATH || void 0;
		const certificateThumbprint = cfg?.certificateThumbprint || process.env.MSTEAMS_CERTIFICATE_THUMBPRINT || void 0;
		const useManagedIdentity = cfg?.useManagedIdentity ?? process.env.MSTEAMS_USE_MANAGED_IDENTITY === "true";
		const managedIdentityClientId = cfg?.managedIdentityClientId || process.env.MSTEAMS_MANAGED_IDENTITY_CLIENT_ID || void 0;
		if (!certificatePath && !useManagedIdentity) return;
		return {
			type: "federated",
			appId,
			tenantId,
			certificatePath,
			certificateThumbprint,
			useManagedIdentity: useManagedIdentity || void 0,
			managedIdentityClientId
		};
	}
	const appPassword = require_types_secrets.normalizeResolvedSecretInputString({
		value: cfg?.appPassword,
		path: "channels.msteams.appPassword"
	}) || require_types_secrets.normalizeSecretInputString(process.env.MSTEAMS_APP_PASSWORD);
	if (!appPassword) return;
	return {
		type: "secret",
		appId,
		appPassword,
		tenantId
	};
}
const DELEGATED_TOKEN_FILENAME = "msteams-delegated.json";
function resolveDelegatedTokenPath() {
	return resolveMSTeamsStorePath({ filename: DELEGATED_TOKEN_FILENAME });
}
function loadDelegatedTokens() {
	try {
		const content = (0, node_fs.readFileSync)(resolveDelegatedTokenPath(), "utf8");
		return JSON.parse(content);
	} catch {
		return;
	}
}
function saveDelegatedTokens(tokens) {
	const tokenPath = resolveDelegatedTokenPath();
	require_private_file_store.privateFileStoreSync((0, node_path.dirname)(tokenPath)).writeJson((0, node_path.basename)(tokenPath), tokens);
}
async function resolveDelegatedAccessToken(params) {
	const tokens = loadDelegatedTokens();
	if (!tokens) return;
	if (require_parse_finite_number.isFutureDateTimestampMs(tokens.expiresAt)) return tokens.accessToken;
	try {
		const refreshed = await require_oauth_token.refreshMSTeamsDelegatedTokens({
			tenantId: params.tenantId,
			clientId: params.clientId,
			clientSecret: params.clientSecret,
			refreshToken: tokens.refreshToken,
			scopes: tokens.scopes
		});
		saveDelegatedTokens(refreshed);
		return refreshed.accessToken;
	} catch {
		return;
	}
}
//#endregion
//#region extensions/msteams/src/graph.ts
const GRAPH_BETA = "https://graph.microsoft.com/beta";
function normalizeQuery(value) {
	return value?.trim() ?? "";
}
function escapeOData(value) {
	return value.replace(/'/g, "''");
}
async function requestGraph(params) {
	const hasBody = params.body !== void 0;
	const { response, release } = await require_fetch_guard.fetchWithSsrFGuard({
		url: `${params.root ?? "https://graph.microsoft.com/v1.0"}${params.path}`,
		init: {
			method: params.method,
			headers: {
				"User-Agent": buildUserAgent(),
				Authorization: `Bearer ${params.token}`,
				...hasBody ? { "Content-Type": "application/json" } : {},
				...params.headers
			},
			body: hasBody ? JSON.stringify(params.body) : void 0
		},
		auditContext: "msteams.graph",
		timeoutMs: resolveMSTeamsRequestTimeoutMs(params.deadline)
	});
	let releaseInFinally = true;
	try {
		if (!response.ok) throw await require_oauth_token.createMSTeamsHttpError(response, `${params.errorPrefix ?? "Graph"} ${params.path} failed`);
		releaseInFinally = false;
		return responseWithRelease(response, release);
	} finally {
		if (releaseInFinally) await release();
	}
}
async function readOptionalGraphJson(res, label) {
	if (res.status === 204 || res.headers?.get?.("content-length") === "0") return;
	return await require_provider_http_errors.readProviderJsonResponse(res, label);
}
async function fetchGraphJson(params) {
	return await readOptionalGraphJson(await requestGraph({
		token: params.token,
		path: params.path,
		method: params.method,
		body: params.body,
		headers: params.headers,
		deadline: params.deadline
	}), `Graph ${params.path} failed`);
}
/**
* Fetch JSON from an absolute Graph API URL (for example @odata.nextLink
* pagination URLs) without prepending GRAPH_ROOT.
*/
async function fetchGraphAbsoluteUrl(params) {
	const { response, release } = await require_fetch_guard.fetchWithSsrFGuard({
		url: params.url,
		init: { headers: {
			"User-Agent": buildUserAgent(),
			Authorization: `Bearer ${params.token}`,
			...params.headers
		} },
		auditContext: "msteams.graph.absolute",
		timeoutMs: MSTEAMS_REQUEST_TIMEOUT_MS
	});
	try {
		if (!response.ok) throw await require_oauth_token.createMSTeamsHttpError(response, `Graph ${params.url} failed`);
		return await require_provider_http_errors.readProviderJsonResponse(response, `Graph ${params.url} failed`);
	} finally {
		await release();
	}
}
/**
* Fetch all pages of a Graph API collection, following @odata.nextLink.
* Optionally stop early when `findOne` matches an item.
*/
async function fetchAllGraphPages(params) {
	const maxPages = params.maxPages ?? 50;
	const items = [];
	let nextPath = params.path;
	for (let page = 0; page < maxPages && nextPath; page++) {
		const res = await fetchGraphJson({
			token: params.token,
			path: nextPath,
			headers: params.headers
		});
		const pageItems = res.value ?? [];
		if (params.findOne) {
			const match = pageItems.find(params.findOne);
			if (match) {
				items.push(...pageItems);
				return {
					items,
					truncated: false,
					found: match
				};
			}
		}
		items.push(...pageItems);
		const rawNext = res["@odata.nextLink"];
		if (rawNext) nextPath = rawNext.replace("https://graph.microsoft.com/v1.0", "").replace("https://graph.microsoft.com/beta", "");
		else nextPath = void 0;
	}
	return {
		items,
		truncated: Boolean(nextPath)
	};
}
async function resolveGraphToken(cfg, options) {
	const msteamsCfg = cfg?.channels?.msteams;
	const creds = resolveMSTeamsCredentials(msteamsCfg);
	if (!creds) throw new Error("MS Teams credentials missing");
	if (msteamsCfg?.cloud === "China") throw new Error("Microsoft Teams Graph operations are not supported for channels.msteams.cloud=China until Graph requests are routed through the Azure China Graph endpoint.");
	if (options?.preferDelegated && msteamsCfg?.delegatedAuth?.enabled && creds.type === "secret") {
		const delegated = await resolveDelegatedAccessToken({
			tenantId: creds.tenantId,
			clientId: creds.appId,
			clientSecret: creds.appPassword
		});
		if (delegated) return delegated;
	}
	const { app } = await loadMSTeamsSdkWithAuth(creds, resolveMSTeamsSdkCloudOptions(msteamsCfg));
	const accessToken = readAccessToken(await createMSTeamsTokenProvider(app).getAccessToken("https://graph.microsoft.com"));
	if (!accessToken) throw new Error("MS Teams graph token unavailable");
	return accessToken;
}
async function listTeamsByName(token, query) {
	return (await listTeamsByNameWithPageInfo(token, query)).items;
}
async function listTeamsByNameWithPageInfo(token, query) {
	const filter = `resourceProvisioningOptions/Any(x:x eq 'Team') and startsWith(displayName,'${escapeOData(query)}')`;
	return await fetchAllGraphPages({
		token,
		path: `/groups?$filter=${encodeURIComponent(filter)}&$select=id,displayName`
	});
}
async function postGraphJson(params) {
	return readOptionalGraphJson(await requestGraph({
		token: params.token,
		path: params.path,
		method: "POST",
		body: params.body,
		errorPrefix: "Graph POST"
	}), `Graph POST ${params.path} failed`);
}
async function postGraphBetaJson(params) {
	return readOptionalGraphJson(await requestGraph({
		token: params.token,
		path: params.path,
		method: "POST",
		root: GRAPH_BETA,
		body: params.body,
		errorPrefix: "Graph beta POST"
	}), `Graph beta POST ${params.path} failed`);
}
async function deleteGraphRequest(params) {
	await requestGraph({
		token: params.token,
		path: params.path,
		method: "DELETE",
		errorPrefix: "Graph DELETE"
	});
}
async function patchGraphJson(params) {
	return readOptionalGraphJson(await requestGraph({
		token: params.token,
		path: params.path,
		method: "PATCH",
		body: params.body,
		errorPrefix: "Graph PATCH"
	}), `Graph PATCH ${params.path} failed`);
}
async function listChannelsForTeam(token, teamId) {
	return (await listChannelsForTeamWithPageInfo(token, teamId)).items;
}
async function listChannelsForTeamWithPageInfo(token, teamId) {
	return await fetchAllGraphPages({
		token,
		path: `/teams/${encodeURIComponent(teamId)}/channels?$select=id,displayName`
	});
}
//#endregion
//#region extensions/msteams/src/graph-users.ts
async function searchGraphUsers(params) {
	const query = params.query.trim();
	if (!query) return [];
	if (query.includes("@")) {
		const escaped = escapeOData(query);
		const filter = `(mail eq '${escaped}' or userPrincipalName eq '${escaped}')`;
		const path = `/users?$filter=${encodeURIComponent(filter)}&$select=id,displayName,mail,userPrincipalName`;
		return (await fetchGraphJson({
			token: params.token,
			path
		})).value ?? [];
	}
	const top = typeof params.top === "number" && params.top > 0 ? params.top : 10;
	const path = `/users?$search=${encodeURIComponent(`"displayName:${query}"`)}&$select=id,displayName,mail,userPrincipalName&$top=${top}`;
	return (await fetchGraphJson({
		token: params.token,
		path,
		headers: { ConsistencyLevel: "eventual" }
	})).value ?? [];
}
async function findGraphUsersByExactIdentity(params) {
	const query = params.query.trim();
	if (!query) return {
		items: [],
		truncated: false
	};
	const escaped = escapeOData(query);
	const filter = `(displayName eq '${escaped}' or mail eq '${escaped}' or userPrincipalName eq '${escaped}')`;
	const path = `/users?$filter=${encodeURIComponent(filter)}&\$select=id,displayName,mail,userPrincipalName`;
	return await fetchAllGraphPages({
		token: params.token,
		path
	});
}
//#endregion
Object.defineProperty(exports, "ATTACHMENT_TAG_RE", {
	enumerable: true,
	get: function() {
		return ATTACHMENT_TAG_RE;
	}
});
Object.defineProperty(exports, "GRAPH_ROOT", {
	enumerable: true,
	get: function() {
		return GRAPH_ROOT;
	}
});
Object.defineProperty(exports, "IMG_SRC_RE", {
	enumerable: true,
	get: function() {
		return IMG_SRC_RE;
	}
});
Object.defineProperty(exports, "applyAuthorizationHeaderForUrl", {
	enumerable: true,
	get: function() {
		return applyAuthorizationHeaderForUrl;
	}
});
Object.defineProperty(exports, "buildUserAgent", {
	enumerable: true,
	get: function() {
		return buildUserAgent;
	}
});
Object.defineProperty(exports, "createMSTeamsExpressAdapter", {
	enumerable: true,
	get: function() {
		return createMSTeamsExpressAdapter;
	}
});
Object.defineProperty(exports, "createMSTeamsInboundDeadline", {
	enumerable: true,
	get: function() {
		return createMSTeamsInboundDeadline;
	}
});
Object.defineProperty(exports, "createMSTeamsTokenProvider", {
	enumerable: true,
	get: function() {
		return createMSTeamsTokenProvider;
	}
});
Object.defineProperty(exports, "deleteGraphRequest", {
	enumerable: true,
	get: function() {
		return deleteGraphRequest;
	}
});
Object.defineProperty(exports, "describeBotFrameworkServiceUrlHost", {
	enumerable: true,
	get: function() {
		return describeBotFrameworkServiceUrlHost;
	}
});
Object.defineProperty(exports, "encodeGraphShareId", {
	enumerable: true,
	get: function() {
		return encodeGraphShareId;
	}
});
Object.defineProperty(exports, "ensureUserAgentHeader", {
	enumerable: true,
	get: function() {
		return ensureUserAgentHeader;
	}
});
Object.defineProperty(exports, "escapeOData", {
	enumerable: true,
	get: function() {
		return escapeOData;
	}
});
Object.defineProperty(exports, "extractHtmlFromAttachment", {
	enumerable: true,
	get: function() {
		return extractHtmlFromAttachment;
	}
});
Object.defineProperty(exports, "extractInlineImageCandidates", {
	enumerable: true,
	get: function() {
		return extractInlineImageCandidates;
	}
});
Object.defineProperty(exports, "fetchGraphAbsoluteUrl", {
	enumerable: true,
	get: function() {
		return fetchGraphAbsoluteUrl;
	}
});
Object.defineProperty(exports, "fetchGraphJson", {
	enumerable: true,
	get: function() {
		return fetchGraphJson;
	}
});
Object.defineProperty(exports, "findGraphUsersByExactIdentity", {
	enumerable: true,
	get: function() {
		return findGraphUsersByExactIdentity;
	}
});
Object.defineProperty(exports, "hasConfiguredMSTeamsCredentials", {
	enumerable: true,
	get: function() {
		return hasConfiguredMSTeamsCredentials;
	}
});
Object.defineProperty(exports, "inferPlaceholder", {
	enumerable: true,
	get: function() {
		return inferPlaceholder;
	}
});
Object.defineProperty(exports, "isAllowedBotFrameworkServiceUrl", {
	enumerable: true,
	get: function() {
		return isAllowedBotFrameworkServiceUrl;
	}
});
Object.defineProperty(exports, "isDownloadableAttachment", {
	enumerable: true,
	get: function() {
		return isDownloadableAttachment;
	}
});
Object.defineProperty(exports, "isLikelyImageAttachment", {
	enumerable: true,
	get: function() {
		return isLikelyImageAttachment;
	}
});
Object.defineProperty(exports, "isUrlAllowed", {
	enumerable: true,
	get: function() {
		return isUrlAllowed;
	}
});
Object.defineProperty(exports, "listChannelsForTeam", {
	enumerable: true,
	get: function() {
		return listChannelsForTeam;
	}
});
Object.defineProperty(exports, "listChannelsForTeamWithPageInfo", {
	enumerable: true,
	get: function() {
		return listChannelsForTeamWithPageInfo;
	}
});
Object.defineProperty(exports, "listTeamsByName", {
	enumerable: true,
	get: function() {
		return listTeamsByName;
	}
});
Object.defineProperty(exports, "listTeamsByNameWithPageInfo", {
	enumerable: true,
	get: function() {
		return listTeamsByNameWithPageInfo;
	}
});
Object.defineProperty(exports, "loadDelegatedTokens", {
	enumerable: true,
	get: function() {
		return loadDelegatedTokens;
	}
});
Object.defineProperty(exports, "loadMSTeamsSdkWithAuth", {
	enumerable: true,
	get: function() {
		return loadMSTeamsSdkWithAuth;
	}
});
Object.defineProperty(exports, "normalizeBotFrameworkServiceUrl", {
	enumerable: true,
	get: function() {
		return normalizeBotFrameworkServiceUrl;
	}
});
Object.defineProperty(exports, "normalizeContentType", {
	enumerable: true,
	get: function() {
		return normalizeContentType;
	}
});
Object.defineProperty(exports, "normalizeQuery", {
	enumerable: true,
	get: function() {
		return normalizeQuery;
	}
});
Object.defineProperty(exports, "patchGraphJson", {
	enumerable: true,
	get: function() {
		return patchGraphJson;
	}
});
Object.defineProperty(exports, "postGraphBetaJson", {
	enumerable: true,
	get: function() {
		return postGraphBetaJson;
	}
});
Object.defineProperty(exports, "postGraphJson", {
	enumerable: true,
	get: function() {
		return postGraphJson;
	}
});
Object.defineProperty(exports, "readAccessToken", {
	enumerable: true,
	get: function() {
		return readAccessToken;
	}
});
Object.defineProperty(exports, "resolveAttachmentFetchPolicy", {
	enumerable: true,
	get: function() {
		return resolveAttachmentFetchPolicy;
	}
});
Object.defineProperty(exports, "resolveGraphToken", {
	enumerable: true,
	get: function() {
		return resolveGraphToken;
	}
});
Object.defineProperty(exports, "resolveMSTeamsCredentials", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsCredentials;
	}
});
Object.defineProperty(exports, "resolveMSTeamsRequestTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsRequestTimeoutMs;
	}
});
Object.defineProperty(exports, "resolveMSTeamsSdkCloudOptions", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsSdkCloudOptions;
	}
});
Object.defineProperty(exports, "resolveMSTeamsSharePointUploadTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveMSTeamsSharePointUploadTimeoutMs;
	}
});
Object.defineProperty(exports, "resolveMediaSsrfPolicy", {
	enumerable: true,
	get: function() {
		return resolveMediaSsrfPolicy;
	}
});
Object.defineProperty(exports, "resolveRequestUrl", {
	enumerable: true,
	get: function() {
		return resolveRequestUrl;
	}
});
Object.defineProperty(exports, "safeFetchWithPolicy", {
	enumerable: true,
	get: function() {
		return safeFetchWithPolicy;
	}
});
Object.defineProperty(exports, "safeHostForUrl", {
	enumerable: true,
	get: function() {
		return safeHostForUrl;
	}
});
Object.defineProperty(exports, "saveDelegatedTokens", {
	enumerable: true,
	get: function() {
		return saveDelegatedTokens;
	}
});
Object.defineProperty(exports, "searchGraphUsers", {
	enumerable: true,
	get: function() {
		return searchGraphUsers;
	}
});
Object.defineProperty(exports, "tryBuildGraphSharesUrlForSharedLink", {
	enumerable: true,
	get: function() {
		return tryBuildGraphSharesUrlForSharedLink;
	}
});
Object.defineProperty(exports, "tryNormalizeBotFrameworkServiceUrl", {
	enumerable: true,
	get: function() {
		return tryNormalizeBotFrameworkServiceUrl;
	}
});
Object.defineProperty(exports, "validateMSTeamsProactiveServiceUrlBoundary", {
	enumerable: true,
	get: function() {
		return validateMSTeamsProactiveServiceUrlBoundary;
	}
});
Object.defineProperty(exports, "withMSTeamsAbortableRequestTimeout", {
	enumerable: true,
	get: function() {
		return withMSTeamsAbortableRequestTimeout;
	}
});
Object.defineProperty(exports, "withMSTeamsRequestDeadline", {
	enumerable: true,
	get: function() {
		return withMSTeamsRequestDeadline;
	}
});
