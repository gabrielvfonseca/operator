const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
require("./plugins-_-82JYfc.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_tool_result_error = require("./tool-result-error-CAe0MnLg.cjs");
const require_target_normalization = require("./target-normalization-CHxcE9Mj.cjs");
const require_embedded_agent_messaging = require("./embedded-agent-messaging-cGDfXH3g.cjs");
const require_content_blocks = require("./content-blocks-lnxKTfA5.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_base64 = require("@gabrielvfonseca/media-core/base64");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/agents/embedded-agent-subscribe.tools.ts
/** Sanitizes, extracts, and classifies embedded-agent tool execution results. */
var embedded_agent_subscribe_tools_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildToolLifecycleErrorResult: () => buildToolLifecycleErrorResult,
	capLiveExecResult: () => capLiveExecResult,
	collectMessagingMediaUrlsFromRecord: () => collectMessagingMediaUrlsFromRecord,
	collectMessagingMediaUrlsFromToolResult: () => collectMessagingMediaUrlsFromToolResult,
	extractMessagingToolSend: () => extractMessagingToolSend,
	extractMessagingToolSendResult: () => extractMessagingToolSendResult,
	extractMessagingToolSourceReplyPayload: () => extractMessagingToolSourceReplyPayload,
	extractToolErrorCode: () => extractToolErrorCode,
	extractToolErrorMessage: () => extractToolErrorMessage,
	extractToolResultMediaArtifact: () => extractToolResultMediaArtifact,
	extractToolResultText: () => extractToolResultText,
	filterToolResultMediaUrls: () => filterToolResultMediaUrls,
	isToolResultError: () => require_tool_result_error.isToolResultError,
	isToolResultTimedOut: () => isToolResultTimedOut,
	sanitizeToolArgs: () => sanitizeToolArgs,
	sanitizeToolResult: () => sanitizeToolResult,
	truncateLiveExecOutput: () => truncateLiveExecOutput
});
const TOOL_RESULT_MAX_CHARS = 8e3;
const TOOL_ERROR_MAX_CHARS = 400;
const LIVE_EXEC_OUTPUT_MAX_CHARS = 8e3;
const TOOL_DENIAL_ERROR_CODES = ["SYSTEM_RUN_DENIED", "INVALID_REQUEST"];
const OPAQUE_STRUCTURED_RESULT_FIELDS = /* @__PURE__ */ new Set(["encrypted_content", "encrypted_stdout"]);
const SENSITIVE_STRUCTURED_HEADER_FIELDS = /* @__PURE__ */ new Set([
	"authorization",
	"proxy-authorization",
	"cookie",
	"set-cookie",
	"x-api-key",
	"x-auth-token"
]);
function truncateToolText(text) {
	if (text.length <= TOOL_RESULT_MAX_CHARS) return text;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, TOOL_RESULT_MAX_CHARS)}\n…(truncated)…`;
}
function truncateLiveExecOutput(text) {
	if (text.length <= LIVE_EXEC_OUTPUT_MAX_CHARS) return text;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, LIVE_EXEC_OUTPUT_MAX_CHARS)}\n...(live output truncated)...`;
}
function capLiveExecResult(result) {
	const details = require_tool_result_error.readToolResultDetails(result);
	if (!details || typeof details.status !== "string" || typeof details.aggregated !== "string") return result;
	const aggregated = truncateLiveExecOutput(details.aggregated);
	if (aggregated === details.aggregated) return result;
	if (!result || typeof result !== "object" || Array.isArray(result)) return result;
	return {
		...result,
		details: {
			...details,
			aggregated
		}
	};
}
function normalizeToolErrorText(text) {
	const trimmed = text.trim();
	if (!trimmed) return;
	const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? "";
	if (!firstLine) return;
	return firstLine.length > TOOL_ERROR_MAX_CHARS ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(firstLine, TOOL_ERROR_MAX_CHARS)}…` : firstLine;
}
function isErrorLikeStatus(status) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(status);
	if (!normalized) return false;
	if (normalized === "0" || normalized === "ok" || normalized === "success" || normalized === "completed" || normalized === "running") return false;
	return /error|fail|timeout|timed[_\s-]?out|denied|cancel|invalid|forbidden/.test(normalized);
}
function readErrorCandidate(value) {
	if (typeof value === "string") return normalizeToolErrorText(value);
	if (!value || typeof value !== "object") return;
	const record = value;
	if (typeof record.message === "string") return normalizeToolErrorText(record.message);
	if (typeof record.error === "string") return normalizeToolErrorText(record.error);
}
function extractErrorField(value) {
	if (!value || typeof value !== "object") return;
	const record = value;
	const direct = extractDirectErrorField(record);
	if (direct) return direct;
	const status = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.status) ?? "";
	if (!status || !isErrorLikeStatus(status)) return;
	return normalizeToolErrorText(status);
}
function extractDirectErrorField(value) {
	if (!value || typeof value !== "object") return;
	const record = value;
	return readErrorCandidate(record.error) ?? readErrorCandidate(record.message) ?? readErrorCandidate(record.reason);
}
function readErrorCodeField(value) {
	return typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) : void 0;
}
function readDenialErrorCodeFromMessage(value) {
	const message = typeof value === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value) : void 0;
	if (!message) return;
	for (const code of TOOL_DENIAL_ERROR_CODES) if (message === code || message.startsWith(`${code}:`)) return code;
}
function readNestedErrorCodeField(value) {
	if (!value || typeof value !== "object") return;
	const record = value;
	return readDenialErrorCodeFromMessage(record.message) ?? readDenialErrorCodeFromMessage(record.error) ?? readErrorCodeField(record.code) ?? readErrorCodeField(record.gatewayCode);
}
function extractDirectErrorCodeField(value) {
	if (!value || typeof value !== "object") return;
	const record = value;
	return readNestedErrorCodeField(record.error) ?? readNestedErrorCodeField(record.nodeError) ?? readErrorCodeField(record.code) ?? readErrorCodeField(record.gatewayCode);
}
function buildToolLifecycleErrorResult(error) {
	const errorRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(error);
	const nodeError = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(errorRecord?.details)?.nodeError);
	const gatewayCode = readErrorCodeField(errorRecord?.gatewayCode) ?? readErrorCodeField(errorRecord?.code);
	return { details: {
		status: "error",
		error: error instanceof Error ? error.message : String(error),
		...gatewayCode ? { gatewayCode } : {},
		...nodeError ? { nodeError } : {}
	} };
}
function extractAggregatedErrorField(value) {
	if (!value || typeof value !== "object") return;
	return readErrorCandidate(value.aggregated);
}
function redactStringsDeep(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (typeof value === "string") return require_redact.redactToolPayloadText(value);
	if (Array.isArray(value)) {
		if (seen.has(value)) return "[Circular]";
		seen.add(value);
		return value.map((item) => redactStringsDeep(item, seen));
	}
	if (value && typeof value === "object") {
		if (seen.has(value)) return "[Circular]";
		seen.add(value);
		const out = {};
		for (const [key, child] of Object.entries(value)) out[key] = typeof child === "string" ? require_redact.redactSensitiveFieldValue(key, child) : redactStringsDeep(child, seen);
		return out;
	}
	return value;
}
function sanitizeToolArgs(args) {
	return redactStringsDeep(args);
}
function sanitizeToolResult(result) {
	if (typeof result === "string") return require_redact.redactToolPayloadText(result);
	if (Array.isArray(result)) return require_redact.redactSecrets(result);
	if (!result || typeof result !== "object") return result;
	const record = result;
	const preCleaned = { ...record };
	const originalContent = Array.isArray(record.content) ? record.content : null;
	if (originalContent) preCleaned.content = originalContent.map((item) => {
		if (!item || typeof item !== "object") return item;
		const entry = item;
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(entry.type) === "image") {
			const data = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(entry.data);
			const existingBytes = typeof entry.bytes === "number" ? entry.bytes : void 0;
			const bytes = data === void 0 ? existingBytes : (0, _gabrielvfonseca_media_core_base64.estimateBase64DecodedBytes)(data);
			const cleaned = { ...entry };
			delete cleaned.data;
			return Object.assign({}, cleaned, {
				bytes,
				omitted: true
			});
		}
		return entry;
	});
	const baseline = require_redact.redactSecrets(preCleaned);
	const out = { ...baseline };
	const content = Array.isArray(baseline.content) ? baseline.content : null;
	if (content) out.content = content.map((item) => {
		if (!item || typeof item !== "object") return item;
		const entry = item;
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(entry.type) === "text" && typeof entry.text === "string") return Object.assign({}, entry, { text: truncateToolText(entry.text) });
		return entry;
	});
	return out;
}
const INLINE_DATA_URI_VALUE_PATTERN = /^data:(?:[a-z][a-z0-9.+-]*\/[a-z0-9.+-]+)?(?:;[a-z0-9.+-]+(?:=[^,;"'\s]+)?)*,/i;
function redactInlineDataUriValue(value) {
	const trimmed = value.trimStart();
	if (!INLINE_DATA_URI_VALUE_PATTERN.test(trimmed)) return value;
	return `[inline data URI: ${value.length} chars]`;
}
function carriesBinaryData(record) {
	const type = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(record.type);
	if (type === "audio" || type === "image" || type === "base64") return true;
	const mediaType = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(record.media_type ?? record.mimeType);
	return mediaType?.startsWith("image/") === true || mediaType?.startsWith("audio/") === true || mediaType?.startsWith("video/") === true || mediaType === "application/pdf";
}
function sanitizeStructuredToolResultValue(value, key = "", parentCarriesBinaryData = false, seen = /* @__PURE__ */ new WeakSet()) {
	if (typeof value === "string") {
		if (SENSITIVE_STRUCTURED_HEADER_FIELDS.has(key.toLowerCase())) return "***";
		if (key === "blob" || key === "data" && parentCarriesBinaryData) return `[binary omitted: ${value.length} chars]`;
		if (OPAQUE_STRUCTURED_RESULT_FIELDS.has(key)) return `[opaque data omitted: ${value.length} chars]`;
		return truncateToolText(redactInlineDataUriValue(require_redact.redactSensitiveFieldValue(key, value)));
	}
	if (typeof value === "bigint") return value.toString();
	if (!value || typeof value !== "object") return value;
	if (seen.has(value)) return "[Circular]";
	seen.add(value);
	if (Array.isArray(value)) return value.map((item) => sanitizeStructuredToolResultValue(item, key, parentCarriesBinaryData, seen));
	const record = value;
	const hasBinaryData = carriesBinaryData(record);
	return Object.fromEntries(Object.entries(record).map(([childKey, child]) => [childKey, sanitizeStructuredToolResultValue(child, childKey, hasBinaryData, seen)]));
}
function stringifyStructuredToolResultContent(block) {
	if (!block || typeof block !== "object") return;
	const record = block;
	const type = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(record.type);
	if (type === "text" || type === "image" || type === "image_url" || type === "audio") return;
	try {
		const serialized = JSON.stringify(sanitizeStructuredToolResultValue(record));
		const redacted = serialized ? require_redact.redactToolPayloadText(serialized) : serialized;
		return redacted && redacted !== "{}" ? redacted : void 0;
	} catch {
		return;
	}
}
function resolveToolResultContentBlocks(result) {
	if (Array.isArray(result)) return result;
	const record = result;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(record.type)) return [record];
	if (Array.isArray(record.content)) return record.content;
	if (record.content && typeof record.content === "object") return [record.content];
	return [record];
}
function extractToolResultText(result) {
	if (typeof result === "string") {
		const trimmed = require_redact.redactToolPayloadText(redactInlineDataUriValue(result)).trim();
		return trimmed ? truncateToolText(trimmed) : void 0;
	}
	if (!result || typeof result !== "object") return;
	const content = resolveToolResultContentBlocks(result);
	const texts = require_content_blocks.collectTextContentBlocks(content).map((item) => {
		const trimmed = item.trim();
		return trimmed ? trimmed : void 0;
	}).filter((value) => Boolean(value));
	if (texts.length > 0) return truncateToolText(texts.join("\n"));
	const structuredTexts = [];
	for (const item of content) {
		const structured = stringifyStructuredToolResultContent(item);
		if (structured) structuredTexts.push(structured);
	}
	if (structuredTexts.length === 0) return;
	return truncateToolText(structuredTexts.join("\n"));
}
function pushUniqueMessagingMediaUrl(urls, seen, value) {
	if (typeof value !== "string") return;
	const normalized = value.trim();
	if (!normalized || seen.has(normalized)) return;
	seen.add(normalized);
	urls.push(normalized);
}
/** Collects messaging attachment references from tool-call arguments or result records. */
function collectMessagingMediaUrlsFromRecord(record) {
	const urls = [];
	const seen = /* @__PURE__ */ new Set();
	const pushAttachment = (value) => {
		if (!value || typeof value !== "object" || Array.isArray(value)) return;
		const attachment = value;
		for (const candidate of [
			attachment.media,
			attachment.mediaUrl,
			attachment.path,
			attachment.filePath,
			attachment.fileUrl,
			attachment.url
		]) pushUniqueMessagingMediaUrl(urls, seen, candidate);
	};
	for (const candidate of [
		record.media,
		record.mediaUrl,
		record.path,
		record.filePath,
		record.fileUrl
	]) pushUniqueMessagingMediaUrl(urls, seen, candidate);
	if (Array.isArray(record.mediaUrls)) for (const mediaUrl of record.mediaUrls) pushUniqueMessagingMediaUrl(urls, seen, mediaUrl);
	if (Array.isArray(record.attachments)) for (const attachment of record.attachments) pushAttachment(attachment);
	return urls;
}
/** Collects messaging attachment references from a completed tool result. */
function collectMessagingMediaUrlsFromToolResult(result) {
	const urls = [];
	const seen = /* @__PURE__ */ new Set();
	const appendFromRecord = (value) => {
		if (!value || typeof value !== "object") return;
		for (const url of collectMessagingMediaUrlsFromRecord(value)) if (!seen.has(url)) {
			seen.add(url);
			urls.push(url);
		}
	};
	appendFromRecord(result);
	if (result && typeof result === "object") appendFromRecord(result.details);
	const outputText = extractToolResultText(result);
	if (outputText) try {
		appendFromRecord(JSON.parse(outputText));
	} catch {}
	return urls;
}
/** Extract an internal source-reply payload from a completed message tool result. */
function extractMessagingToolSourceReplyPayload(result) {
	const details = require_tool_result_error.readToolResultDetails(result);
	if (details?.sourceReplySink !== "internal-ui") return;
	const status = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(details.deliveryStatus);
	if (status && status !== "sent") return;
	const sourceReply = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(details.sourceReply) ?? details;
	const payload = {};
	const text = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(sourceReply.text) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(details.message);
	if (text) payload.text = text;
	const mediaUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(sourceReply.mediaUrl) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(details.mediaUrl);
	if (mediaUrl) payload.mediaUrl = mediaUrl;
	const mediaUrls = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)((Array.isArray(sourceReply.mediaUrls) ? sourceReply.mediaUrls : Array.isArray(details.mediaUrls) ? details.mediaUrls : []).filter((value) => typeof value === "string"));
	if (mediaUrls.length > 0) payload.mediaUrls = mediaUrls;
	if (sourceReply.audioAsVoice === true || details.audioAsVoice === true) payload.audioAsVoice = true;
	const presentation = require_payload.normalizeMessagePresentation(sourceReply.presentation);
	if (presentation) payload.presentation = presentation;
	const interactive = require_payload.normalizeInteractiveReply(sourceReply.interactive);
	if (interactive) payload.interactive = interactive;
	const channelData = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalRecord)(sourceReply.channelData);
	if (channelData) payload.channelData = { ...channelData };
	const idempotencyKey = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(sourceReply.idempotencyKey) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(details.idempotencyKey);
	if (idempotencyKey) payload.idempotencyKey = idempotencyKey;
	return Object.keys(payload).length > 0 ? payload : void 0;
}
const TRUSTED_TOOL_RESULT_MEDIA = /* @__PURE__ */ new Set([
	"agents_list",
	"apply_patch",
	"browser",
	"canvas",
	"cron",
	"edit",
	"exec",
	"gateway",
	"image",
	"image_generate",
	"memory_get",
	"memory_search",
	"message",
	"music_generate",
	"nodes",
	"process",
	"read",
	"session_status",
	"sessions_history",
	"sessions_list",
	"sessions_search",
	"sessions_send",
	"sessions_spawn",
	"subagents",
	"tts",
	"video_generate",
	"web_fetch",
	"web_search",
	"x_search",
	"write"
]);
const HTTP_URL_RE = /^https?:\/\//i;
function isCoreToolResultMediaTrustedName(toolName) {
	if (!toolName) return false;
	return TRUSTED_TOOL_RESULT_MEDIA.has(require_tool_policy.normalizeToolName(toolName));
}
function isExternalToolResult(result) {
	const details = require_tool_result_error.readToolResultDetails(result);
	if (!details) return false;
	return typeof details.mcpServer === "string" || typeof details.mcpTool === "string";
}
function isToolResultMediaTrusted(toolName, result, trustedLocalMediaToolNames) {
	if (!toolName || isExternalToolResult(result)) return false;
	const registeredName = toolName.trim();
	if (registeredName && trustedLocalMediaToolNames?.has(registeredName) === true) return true;
	return isCoreToolResultMediaTrustedName(toolName);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.embeddedSubscribeToolsTestApi")] = { isToolResultMediaTrusted };
function isTrustedOwnedTtsLocalMedia(toolName, result, trustedLocalMediaToolNames) {
	if (!toolName || !isToolResultMediaTrusted(toolName, result, trustedLocalMediaToolNames) || require_tool_policy.normalizeToolName(toolName) !== "tts") return false;
	const media = require_tool_result_error.readToolResultDetails(result)?.media;
	if (!media || typeof media !== "object" || Array.isArray(media)) return false;
	return media.trustedLocalMedia === true;
}
function filterToolResultMediaUrls(toolName, mediaUrls, result, trustedLocalMediaToolNames) {
	if (mediaUrls.length === 0) return mediaUrls;
	const trustedOwnedTtsLocalMedia = isTrustedOwnedTtsLocalMedia(toolName, result, trustedLocalMediaToolNames);
	if (isToolResultMediaTrusted(toolName, result, trustedLocalMediaToolNames)) {
		if (trustedLocalMediaToolNames !== void 0) {
			if (!trustedOwnedTtsLocalMedia) {
				const registeredName = toolName?.trim();
				if (!registeredName || !trustedLocalMediaToolNames.has(registeredName)) return mediaUrls.filter((url) => HTTP_URL_RE.test(url.trim()));
			}
		}
		return mediaUrls;
	}
	return mediaUrls.filter((url) => HTTP_URL_RE.test(url.trim()));
}
function readToolResultDetailsMedia(result) {
	const details = require_tool_result_error.readToolResultDetails(result);
	return details?.media && typeof details.media === "object" && !Array.isArray(details.media) ? details.media : void 0;
}
function collectStructuredMediaUrls(media) {
	const urls = [];
	const pushString = (value) => {
		if (typeof value !== "string") return;
		const normalized = value.trim();
		if (normalized) urls.push(normalized);
	};
	const pushAttachment = (value) => {
		if (!value || typeof value !== "object" || Array.isArray(value)) return;
		const attachment = value;
		pushString(attachment.media);
		pushString(attachment.path);
		pushString(attachment.url);
		pushString(attachment.mediaUrl);
		pushString(attachment.filePath);
		pushString(attachment.fileUrl);
	};
	pushString(media.media);
	pushString(media.path);
	pushString(media.url);
	pushString(media.mediaUrl);
	pushString(media.filePath);
	pushString(media.fileUrl);
	if (Array.isArray(media.mediaUrls)) for (const value of media.mediaUrls) pushString(value);
	if (Array.isArray(media.attachments)) for (const attachment of media.attachments) pushAttachment(attachment);
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(urls);
}
function isNonOutboundToolResultMedia(media) {
	return media.outbound === false;
}
function hasImageContentBlock(content) {
	for (const item of content) {
		if (!item || typeof item !== "object") continue;
		if (item.type === "image") return true;
	}
	return false;
}
function extractToolResultMediaArtifact(result) {
	if (!result || typeof result !== "object") return;
	const record = result;
	const detailsMedia = readToolResultDetailsMedia(record);
	if (detailsMedia) {
		if (isNonOutboundToolResultMedia(detailsMedia)) return;
		const mediaUrls = collectStructuredMediaUrls(detailsMedia);
		if (mediaUrls.length > 0) return {
			mediaUrls,
			...detailsMedia.audioAsVoice === true ? { audioAsVoice: true } : {},
			...detailsMedia.trustedLocalMedia === true ? { trustedLocalMedia: true } : {}
		};
	}
	const content = Array.isArray(record.content) ? record.content : null;
	if (!content) return;
	if (hasImageContentBlock(content)) {
		const details = record.details;
		const p = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(details?.path) ?? "";
		if (p) return { mediaUrls: [p] };
	}
}
function extractToolErrorCode(result) {
	if (!result || typeof result !== "object") return;
	const record = result;
	return extractDirectErrorCodeField(record.details) ?? extractDirectErrorCodeField(record);
}
function isToolResultTimedOut(result) {
	if (require_tool_result_error.readToolResultStatus(result) === "timeout") return true;
	return require_tool_result_error.readToolResultDetails(result)?.timedOut === true;
}
function extractToolErrorMessage(result) {
	if (!result || typeof result !== "object") return;
	const record = result;
	const fromDetails = extractDirectErrorField(record.details);
	if (fromDetails) return fromDetails;
	const fromDetailsAggregated = extractAggregatedErrorField(record.details);
	if (fromDetailsAggregated) return fromDetailsAggregated;
	const fromRoot = extractDirectErrorField(record);
	if (fromRoot) return fromRoot;
	const text = extractToolResultText(result);
	if (text) try {
		const fromJson = extractErrorField(JSON.parse(text));
		if (fromJson) return fromJson;
	} catch {}
	const fromDetailsStatus = extractErrorField(record.details);
	if (fromDetailsStatus) return fromDetailsStatus;
	const fromRootStatus = extractErrorField(record);
	if (fromRootStatus) return fromRootStatus;
	if (require_tool_result_error.readToolResultStatus(result) && !require_tool_result_error.isToolResultError(result)) return;
	return text ? normalizeToolErrorText(text) : void 0;
}
function resolveMessageToolTarget(params) {
	const directTarget = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.args.target) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.args.to) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.args.channelId);
	if (directTarget) return directTarget;
	const aliases = params.providerId ? require_registry.getChannelPlugin(params.providerId)?.actions?.messageActionTargetAliases?.[params.action]?.deliveryTargetAliases : void 0;
	for (const alias of aliases ?? []) {
		const aliasTarget = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalStringifiedId)(params.args[alias]);
		if (aliasTarget) return aliasTarget;
	}
	return params.currentMessagingTarget ?? params.currentChannelId;
}
function resolveMessagingToolThreadEvidence(params) {
	const threading = require_registry.getChannelPlugin(params.providerId)?.threading;
	const autoThreadResolver = params.allowImplicitThread ? threading?.resolveAutoThreadId : void 0;
	const replyTransport = params.replyToId ? threading?.resolveReplyTransport?.({
		cfg: params.options?.config ?? {},
		accountId: params.accountId,
		threadId: params.threadId,
		replyToId: params.replyToId
	}) : void 0;
	const transportThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalStringifiedId)(replyTransport?.threadId);
	const replyToThreadId = replyTransport?.threadId === null ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(replyTransport.replyToId) : void 0;
	const explicitThreadId = transportThreadId ?? replyToThreadId ?? params.threadId;
	const currentChannelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.options?.currentChannelId);
	const currentMessagingTarget = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.options?.currentMessagingTarget);
	const currentThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.options?.currentThreadId);
	const replyToMode = params.options?.replyToMode ?? (currentThreadId ? "all" : void 0);
	const canResolveCurrentThread = Boolean((currentChannelId || currentMessagingTarget) && currentThreadId);
	const resolvedCurrentThreadId = !explicitThreadId && !params.threadSuppressed && autoThreadResolver && canResolveCurrentThread ? autoThreadResolver({
		cfg: params.options?.config ?? {},
		accountId: params.accountId,
		to: params.to,
		replyToId: params.replyToId,
		toolContext: {
			currentChannelId,
			currentMessagingTarget,
			currentThreadTs: currentThreadId,
			currentMessageId: params.options?.currentMessageId,
			replyToMode,
			hasRepliedRef: params.options?.hasRepliedRef
		}
	}) : void 0;
	const threadImplicit = !explicitThreadId && !params.threadSuppressed && Boolean(autoThreadResolver) && (!canResolveCurrentThread || Boolean(resolvedCurrentThreadId));
	return {
		...explicitThreadId ?? resolvedCurrentThreadId ? { threadId: explicitThreadId ?? resolvedCurrentThreadId } : {},
		...threadImplicit ? { threadImplicit: true } : {},
		...params.threadSuppressed ? { threadSuppressed: true } : {}
	};
}
function extractMessagingToolSend(toolName, args, options) {
	const action = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.action) ?? "";
	const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.accountId);
	if (toolName === "message") {
		if (!require_embedded_agent_messaging.isMessagingToolTargetEvidenceAction(toolName, args)) return;
		const providerRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.provider) ?? "";
		const channelRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.channel) ?? "";
		const providerHint = providerRaw || channelRaw;
		const providerId = providerHint ? require_registry.normalizeChannelId(providerHint) : null;
		const toRaw = resolveMessageToolTarget({
			action,
			args,
			providerId,
			currentChannelId: options?.currentChannelId,
			currentMessagingTarget: options?.currentMessagingTarget
		});
		if (!toRaw) return;
		const provider = providerId ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerHint) ?? "message";
		const to = require_target_normalization.normalizeTargetForProvider(provider, toRaw);
		const pluginExtractionArgs = {
			...args,
			to: toRaw
		};
		const pluginExtracted = providerId ? require_registry.getChannelPlugin(providerId)?.actions?.extractToolSend?.({ args: pluginExtractionArgs }) : null;
		const resolvedAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(pluginExtracted?.accountId) ?? accountId;
		const threadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(pluginExtracted?.threadId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.threadId);
		const replyToId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.replyTo);
		const outboundReplyToId = action === "send" ? replyToId : void 0;
		const threadSuppressed = pluginExtracted?.threadSuppressed === true || args.topLevel === true || args.threadId === null;
		return to ? {
			tool: toolName,
			provider,
			accountId: resolvedAccountId,
			to,
			...providerId ? resolveMessagingToolThreadEvidence({
				providerId,
				to,
				accountId: resolvedAccountId,
				threadId,
				replyToId: outboundReplyToId,
				allowImplicitThread: pluginExtracted ? pluginExtracted.threadImplicit === true : true,
				threadSuppressed,
				options
			}) : {
				...threadId ? { threadId } : {},
				...threadSuppressed ? { threadSuppressed: true } : {}
			}
		} : void 0;
	}
	const providerId = require_registry.normalizeChannelId(toolName);
	if (!providerId) return;
	const extracted = require_registry.getChannelPlugin(providerId)?.actions?.extractToolSend?.({ args });
	if (!extracted?.to) return;
	const to = require_target_normalization.normalizeTargetForProvider(providerId, extracted.to);
	const threadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(extracted.threadId);
	const threadSuppressed = extracted.threadSuppressed === true;
	const extractedAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(extracted.accountId) ?? accountId;
	const nativeReplyToMode = options?.replyToMode;
	const nativeSingleUseMode = nativeReplyToMode === "first" || nativeReplyToMode === "batched";
	const canResolveNativeImplicitThread = extracted.threadImplicit === true && nativeReplyToMode !== void 0 && (!nativeSingleUseMode || options?.hasRepliedRef !== void 0);
	return to ? {
		tool: toolName,
		provider: providerId,
		accountId: extractedAccountId,
		to,
		...resolveMessagingToolThreadEvidence({
			providerId,
			to,
			accountId: extractedAccountId,
			threadId,
			allowImplicitThread: canResolveNativeImplicitThread,
			threadSuppressed,
			options
		})
	} : void 0;
}
/** Reconciles pending send evidence with the provider's successful action result. */
function extractMessagingToolSendResult(pending, result) {
	const providerId = require_registry.normalizeChannelId(pending.provider);
	const extracted = providerId ? require_registry.getChannelPlugin(providerId)?.actions?.extractToolSendResult?.({
		result,
		send: {
			to: pending.to ?? "",
			accountId: pending.accountId,
			threadId: pending.threadId,
			threadImplicit: pending.threadImplicit,
			threadSuppressed: pending.threadSuppressed
		}
	}) : null;
	if (!extracted?.to) return pending;
	const threadEvidence = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(extracted.threadId) != null || extracted.threadImplicit === true || extracted.threadSuppressed === true ? extracted : pending;
	return {
		...pending,
		...extracted,
		accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(extracted.accountId) ?? pending.accountId,
		to: require_target_normalization.normalizeTargetForProvider(providerId ?? pending.provider, extracted.to),
		threadId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(threadEvidence.threadId),
		threadImplicit: threadEvidence.threadImplicit === true ? true : void 0,
		threadSuppressed: threadEvidence.threadSuppressed === true ? true : void 0
	};
}
//#endregion
Object.defineProperty(exports, "buildToolLifecycleErrorResult", {
	enumerable: true,
	get: function() {
		return buildToolLifecycleErrorResult;
	}
});
Object.defineProperty(exports, "capLiveExecResult", {
	enumerable: true,
	get: function() {
		return capLiveExecResult;
	}
});
Object.defineProperty(exports, "collectMessagingMediaUrlsFromRecord", {
	enumerable: true,
	get: function() {
		return collectMessagingMediaUrlsFromRecord;
	}
});
Object.defineProperty(exports, "collectMessagingMediaUrlsFromToolResult", {
	enumerable: true,
	get: function() {
		return collectMessagingMediaUrlsFromToolResult;
	}
});
Object.defineProperty(exports, "embedded_agent_subscribe_tools_exports", {
	enumerable: true,
	get: function() {
		return embedded_agent_subscribe_tools_exports;
	}
});
Object.defineProperty(exports, "extractMessagingToolSend", {
	enumerable: true,
	get: function() {
		return extractMessagingToolSend;
	}
});
Object.defineProperty(exports, "extractMessagingToolSendResult", {
	enumerable: true,
	get: function() {
		return extractMessagingToolSendResult;
	}
});
Object.defineProperty(exports, "extractMessagingToolSourceReplyPayload", {
	enumerable: true,
	get: function() {
		return extractMessagingToolSourceReplyPayload;
	}
});
Object.defineProperty(exports, "extractToolErrorCode", {
	enumerable: true,
	get: function() {
		return extractToolErrorCode;
	}
});
Object.defineProperty(exports, "extractToolErrorMessage", {
	enumerable: true,
	get: function() {
		return extractToolErrorMessage;
	}
});
Object.defineProperty(exports, "extractToolResultMediaArtifact", {
	enumerable: true,
	get: function() {
		return extractToolResultMediaArtifact;
	}
});
Object.defineProperty(exports, "extractToolResultText", {
	enumerable: true,
	get: function() {
		return extractToolResultText;
	}
});
Object.defineProperty(exports, "filterToolResultMediaUrls", {
	enumerable: true,
	get: function() {
		return filterToolResultMediaUrls;
	}
});
Object.defineProperty(exports, "isToolResultTimedOut", {
	enumerable: true,
	get: function() {
		return isToolResultTimedOut;
	}
});
Object.defineProperty(exports, "sanitizeToolArgs", {
	enumerable: true,
	get: function() {
		return sanitizeToolArgs;
	}
});
Object.defineProperty(exports, "sanitizeToolResult", {
	enumerable: true,
	get: function() {
		return sanitizeToolResult;
	}
});
Object.defineProperty(exports, "truncateLiveExecOutput", {
	enumerable: true,
	get: function() {
		return truncateLiveExecOutput;
	}
});
