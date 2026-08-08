const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_strip_inbound_meta = require("./strip-inbound-meta-CE5-_osk.cjs");
const require_assistant_error_format = require("./assistant-error-format-fNZkoCjs.cjs");
const require_src = require("./src-C56Dr8YU.cjs");
const require_internal_runtime_context = require("./internal-runtime-context-C0HOZ5eF.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/exec-approval-result.ts
/**
* Parses exec approval tool output and formats denial messages for users.
*/
const EXEC_COMPLETED_RE = /^exec completed:\s*([\s\S]*)$/i;
const APPROVAL_METADATA_SOURCE_RE = /^(?:gateway\s+id=|node=)/i;
function parseExecApprovalResultWithMetadata(raw, prefix, bodySeparator) {
	const normalizedRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	const normalizedPrefix = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(prefix);
	if (!normalizedRaw.startsWith(normalizedPrefix)) return null;
	const metadataStart = prefix.length;
	let depth = 1;
	let metadataEnd = -1;
	for (let index = metadataStart; index < raw.length; index += 1) {
		const char = raw[index];
		if (char === "(") {
			depth += 1;
			continue;
		}
		if (char === ")") {
			depth -= 1;
			if (depth === 0) {
				metadataEnd = index;
				break;
			}
		}
	}
	if (metadataEnd < 0) return null;
	const metadata = raw.slice(metadataStart, metadataEnd).trim();
	if (!APPROVAL_METADATA_SOURCE_RE.test(metadata)) return null;
	const remainder = raw.slice(metadataEnd + 1);
	if (bodySeparator === ":") {
		if (!remainder.startsWith(":")) return null;
		return {
			metadata,
			body: remainder.slice(1).trim()
		};
	}
	if (remainder && !remainder.startsWith("\n")) return null;
	return {
		metadata,
		body: remainder.startsWith("\n") ? remainder.slice(1).trim() : ""
	};
}
function parseExecApprovalResultText(resultText) {
	const raw = resultText.trim();
	if (!raw) return {
		kind: "other",
		raw
	};
	const deniedResult = parseExecApprovalResultWithMetadata(raw, "Exec denied (", ":");
	if (deniedResult) return {
		kind: "denied",
		raw,
		metadata: deniedResult.metadata,
		body: deniedResult.body
	};
	const finishedResult = parseExecApprovalResultWithMetadata(raw, "Exec finished (", "\n");
	if (finishedResult) return {
		kind: "finished",
		raw,
		metadata: finishedResult.metadata,
		body: finishedResult.body
	};
	const completedMatch = EXEC_COMPLETED_RE.exec(raw);
	if (completedMatch) return {
		kind: "completed",
		raw,
		body: completedMatch[1]?.trim() ?? ""
	};
	return {
		kind: "other",
		raw
	};
}
function isExecDeniedResultText(resultText) {
	return parseExecApprovalResultText(resultText).kind === "denied";
}
function formatExecDeniedUserMessage(resultText) {
	const parsed = parseExecApprovalResultText(resultText);
	if (parsed.kind !== "denied") return null;
	const metadata = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(parsed.metadata);
	if (metadata.includes("approval-timeout")) return "Command did not run: approval timed out.";
	if (metadata.includes("user-denied")) return "Command did not run: approval was denied.";
	if (metadata.includes("allowlist-miss")) return "Command did not run: approval is required.";
	if (metadata.includes("approval-request-failed")) return "Command did not run: approval request failed.";
	if (metadata.includes("spawn-failed") || metadata.includes("invoke-failed")) return "Command did not run.";
	return "Command did not run.";
}
//#endregion
//#region src/agents/embedded-agent-helpers/failover-matches.ts
/**
* Shared text-pattern matchers for failover, auth, billing, and rate-limit errors.
*/
const PERIODIC_USAGE_LIMIT_RE = /\b(?:daily|weekly|monthly)(?:\/(?:daily|weekly|monthly))* (?:usage )?limit(?:s)?(?: (?:exhausted|reached|exceeded))?\b/i;
const HIGH_CONFIDENCE_AUTH_PERMANENT_PATTERNS = [
	/api[_ ]?key[_ ]?(?:revoked|deactivated|deleted)/i,
	/deactivated[_ ]workspace/i,
	"key has been disabled",
	"key has been revoked",
	"account has been deactivated",
	"not allowed for this organization"
];
const AMBIGUOUS_AUTH_ERROR_PATTERNS = [
	/invalid[_ ]?api[_ ]?key/,
	/could not (?:authenticate|validate).*(?:api[_ ]?key|credentials)/i,
	"permission_error"
];
const COMMON_AUTH_ERROR_PATTERNS = [
	"incorrect api key",
	"invalid token",
	"authentication",
	"re-authenticate",
	"oauth token refresh failed",
	"unauthorized",
	"forbidden",
	"access denied",
	"insufficient permissions",
	"insufficient permission",
	/missing scopes?:/i,
	"expired",
	"token has expired",
	/\b401\b/,
	/\b403\b/,
	"no credentials found",
	"no api key found",
	/\bfailed to (?:extract|parse|validate|decode)\b.*\btoken\b/
];
const CJK_AUTH_ERROR_PATTERNS = [
	"无权访问",
	"认证失败",
	"鉴权失败",
	"密钥无效",
	"apikey 无效",
	/(?:当前\s*ak|ce-011).*?(?:违规请求|禁止访问)|(?:违规请求|禁止访问).*?(?:当前\s*ak|ce-011)/i,
	/\bce-011\b/i
];
const ZAI_BILLING_CODE_1311_RE = /"code"\s*:\s*1311\b/;
const ZAI_AUTH_CODE_1113_RE = /"code"\s*:\s*1113\b/;
const VOLCENGINE_INVALID_SUBSCRIPTION_RE = /"code"\s*:\s*"InvalidSubscription"/i;
const STATUS_INTERNAL_SERVER_ERROR_RE = /\bstatus:\s*internal server error\b/i;
const STATUS_INTERNAL_SERVER_ERROR_WITH_500_RE = /^(?=[\s\S]*\bstatus:\s*internal server error\b)(?=[\s\S]*\bcode["']?\s*[:=]\s*500\b)/i;
const HTTP_5XX_STATUS_RE = /\bHTTP\s+5\d\d\b/i;
const ZAI_AUTH_ERROR_PATTERNS = [ZAI_AUTH_CODE_1113_RE];
const ERROR_PATTERNS = {
	rateLimit: [
		/rate[_ ]limit|too many requests|429/,
		/too many (?:concurrent )?requests/i,
		/throttling(?:exception)?/i,
		"model_cooldown",
		"exceeded your current quota",
		"resource has been exhausted",
		"quota exceeded",
		"resource_exhausted",
		"throttlingexception",
		"throttling_exception",
		"throttled",
		"throttling",
		"usage limit",
		/\btpm\b/i,
		"tokens per minute",
		"tokens per day",
		"请求过于频繁",
		"调用频率",
		"频率限制",
		"配额不足",
		"配额已用尽",
		"额度不足",
		"额度已用尽"
	],
	overloaded: [
		/overloaded_error|"type"\s*:\s*"overloaded_error"/i,
		"overloaded",
		/\b(?:selected\s+)?model\s+(?:is\s+)?at capacity\b/i,
		/service[_ ]unavailable.*(?:overload|capacity|high[_ ]demand)|(?:overload|capacity|high[_ ]demand).*service[_ ]unavailable/i,
		"high demand",
		"high load",
		"服务过载",
		"当前负载过高",
		"访问量过大"
	],
	serverError: [
		"an error occurred while processing",
		"internal server error",
		"internal_error",
		"server_error",
		"service temporarily unavailable",
		"service_unavailable",
		"bad gateway",
		"gateway timeout",
		"upstream error",
		"upstream connect error",
		"connection reset",
		"内部错误",
		"服务器错误",
		"服务器内部错误",
		"系统错误",
		"系统繁忙",
		"系统异常"
	],
	timeout: [
		"timeout",
		"timed out",
		"service unavailable",
		"deadline exceeded",
		"context deadline exceeded",
		/^(?=[\s\S]*\bgot status:\s*internal\b)(?=[\s\S]*\bcode["']?\s*[:=]\s*500\b)/i,
		/^(?=[\s\S]*["']status["']\s*:\s*["']internal["'])(?=[\s\S]*["']code["']\s*:\s*500\b)/i,
		"connection error",
		"network error",
		"network request failed",
		"fetch failed",
		"socket hang up",
		"网络错误",
		"网络异常",
		"服务暂时不可用",
		"服务繁忙",
		"请求超时",
		"连接超时",
		"连接错误",
		/\beconn(?:refused|reset|aborted)\b/i,
		/\benetunreach\b/i,
		/\behostunreach\b/i,
		/\behostdown\b/i,
		/\benetreset\b/i,
		/\betimedout\b/i,
		/\besockettimedout\b/i,
		/\bepipe\b/i,
		/\benotfound\b/i,
		/\beai_again\b/i,
		/without sending (?:any )?chunks?/i,
		/\bstop reason:\s*(?:abort|error|malformed_response|network_error)\b/i,
		/\breason:\s*(?:abort|error|malformed_response|network_error)\b/i,
		/\bunhandled stop reason:\s*(?:abort|error|malformed_response|network_error)\b/i,
		/\bfinish_reason:\s*(?:abort|error|malformed_response|network_error)\b/i,
		/\boperation was aborted\b/i,
		/\bstream (?:was )?(?:closed|aborted)\b/i,
		/^terminated$/i,
		/^stream_read_error$/i,
		/\bund_err_(?:socket|connect|headers?|body|req_content_length_mismatch|aborted|closed)\b/i,
		/^request failed$/i,
		/\brequest failed after repeated internal retries\b/i,
		/^llm request failed\.$/i
	],
	billing: [
		/["']?(?:status|code)["']?\s*[:=]\s*402\b|\bhttp\s*402\b|\berror(?:\s+code)?\s*[:=]?\s*402\b|\b(?:got|returned|received)\s+(?:a\s+)?402\b|^\s*402\s+payment/i,
		"payment required",
		"insufficient credits",
		/used\s+all\s+available\s+credits/i,
		/(?:monthly\s+)?spend(?:ing)?\s+limit/i,
		/insufficient[_ ]quota/i,
		"credit balance",
		"plans & billing",
		/insufficient[_ ]balance/i,
		/\binsufficient\s+\w+\s+balance\b/i,
		"insufficient usd or diem balance",
		/requires?\s+more\s+credits/i,
		/out of extra usage/i,
		/draw from your extra usage/i,
		/extra usage is required(?: for long context requests)?/i,
		"余额不足",
		"账户余额不足",
		"欠费",
		"账户已欠费",
		VOLCENGINE_INVALID_SUBSCRIPTION_RE,
		/\bdoes not have a valid coding\s*plan subscription\b/i,
		ZAI_BILLING_CODE_1311_RE,
		/\bcurrent\s+subscription\s+plan\b.*\b(?:does\s+not|doesn't|not)\b.*\binclude\s+access\b/i,
		/\bmodel\b.*\bnot\s+available\b.*\bcurrent\s+plan\b/i
	],
	authPermanent: HIGH_CONFIDENCE_AUTH_PERMANENT_PATTERNS,
	auth: [
		...AMBIGUOUS_AUTH_ERROR_PATTERNS,
		...COMMON_AUTH_ERROR_PATTERNS,
		...ZAI_AUTH_ERROR_PATTERNS,
		...CJK_AUTH_ERROR_PATTERNS
	],
	format: [
		"string should match pattern",
		"tool_use.id",
		"tool_use_id",
		"messages.1.content.1.tool_use.id",
		"invalid request format",
		/tool call id was.*must be/i,
		"does not support assistant message prefill",
		"conversation must end with a user message",
		/agent harness .* does not support .*provider is not one of/i
	]
};
const BILLING_ERROR_HEAD_RE = /^(?:error[:\s-]+)?billing(?:\s+error)?(?:[:\s-]+|$)|^(?:error[:\s-]+)?(?:credit balance|insufficient credits?|payment required|http\s*402\b)/i;
const BILLING_ERROR_HARD_402_RE = /["']?(?:status|code)["']?\s*[:=]\s*402\b|\bhttp\s*402\b|\berror(?:\s+code)?\s*[:=]?\s*402\b|^\s*402\s+payment/i;
const BILLING_ERROR_MAX_LENGTH = 512;
function matchesErrorPatterns(raw, patterns) {
	if (!raw) return false;
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	return patterns.some((pattern) => pattern instanceof RegExp ? pattern.test(value) : value.includes(pattern));
}
function matchesErrorPatternGroups(raw, groups) {
	return groups.some((patterns) => matchesErrorPatterns(raw, patterns));
}
function matchesFormatErrorPattern(raw) {
	return matchesErrorPatterns(raw, ERROR_PATTERNS.format);
}
function isRateLimitErrorMessage(raw) {
	return matchesErrorPatterns(raw, ERROR_PATTERNS.rateLimit);
}
function isTimeoutErrorMessage(raw) {
	return matchesErrorPatterns(raw, ERROR_PATTERNS.timeout);
}
function isPeriodicUsageLimitErrorMessage(raw) {
	return PERIODIC_USAGE_LIMIT_RE.test(raw);
}
function isBillingErrorMessage(raw) {
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (!value) return false;
	if (raw.length > BILLING_ERROR_MAX_LENGTH) return BILLING_ERROR_HARD_402_RE.test(value) || ZAI_BILLING_CODE_1311_RE.test(value) || VOLCENGINE_INVALID_SUBSCRIPTION_RE.test(value);
	if (matchesErrorPatterns(value, ERROR_PATTERNS.billing)) return true;
	if (!BILLING_ERROR_HEAD_RE.test(raw)) return false;
	return value.includes("upgrade") || value.includes("credits") || value.includes("payment") || value.includes("purchase") || value.includes("subscription") || value.includes("plan");
}
function isAuthPermanentErrorMessage(raw) {
	return matchesErrorPatternGroups(raw, [HIGH_CONFIDENCE_AUTH_PERMANENT_PATTERNS]);
}
function isAuthErrorMessage(raw) {
	return matchesErrorPatternGroups(raw, [
		AMBIGUOUS_AUTH_ERROR_PATTERNS,
		COMMON_AUTH_ERROR_PATTERNS,
		ZAI_AUTH_ERROR_PATTERNS,
		CJK_AUTH_ERROR_PATTERNS
	]);
}
function isOverloadedErrorMessage(raw) {
	return matchesErrorPatterns(raw, ERROR_PATTERNS.overloaded);
}
function isServerErrorMessage(raw) {
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
	if (!value) return false;
	if (STATUS_INTERNAL_SERVER_ERROR_WITH_500_RE.test(value) || HTTP_5XX_STATUS_RE.test(value)) return true;
	const scrubbed = value.replace(STATUS_INTERNAL_SERVER_ERROR_RE, "").trim();
	if (scrubbed === "") return true;
	return matchesErrorPatterns(scrubbed, ERROR_PATTERNS.serverError);
}
//#endregion
//#region src/shared/chat-content.ts
/** Coerces arbitrary provider content values into displayable text without throwing. */
function coerceChatContentText(value) {
	if (typeof value === "string") return value;
	if (value == null) return "";
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint" || typeof value === "symbol") return String(value);
	if (typeof value === "object") try {
		return JSON.stringify(value) ?? "";
	} catch {
		return "";
	}
	return "";
}
/** Extracts normalized plain text from string content or OpenAI-style text blocks. */
function extractTextFromChatContent(content, opts) {
	const normalizeText = opts?.normalizeText ?? ((text) => text.replace(/\s+/g, " ").trim());
	const joinWith = opts?.joinWith ?? " ";
	const sanitize = (text) => {
		const raw = coerceChatContentText(text);
		return coerceChatContentText(opts?.sanitizeText ? opts.sanitizeText(raw) : raw);
	};
	const normalize = (text) => coerceChatContentText(normalizeText(coerceChatContentText(text)));
	if (typeof content === "string") {
		const normalized = normalize(sanitize(content));
		return normalized ? normalized : null;
	}
	if (!Array.isArray(content)) return null;
	const chunks = [];
	for (const block of content) {
		if (!block || typeof block !== "object") continue;
		if (block.type !== "text") continue;
		const text = block.text;
		const value = sanitize(text);
		if (value.trim()) chunks.push(value);
	}
	const joined = normalize(chunks.join(joinWith));
	return joined ? joined : null;
}
//#endregion
//#region src/shared/text/code-regions.ts
/** Finds fenced and inline Markdown code regions so text sanitizers can avoid examples. */
function findCodeRegions(text) {
	const regions = [];
	for (const match of text.matchAll(/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?(?:\n\2|$)/g)) {
		const start = (match.index ?? 0) + (0, _gabrielvfonseca_normalization_core.expectDefined)(match[1], "code regions regex capture 1").length;
		regions.push({
			start,
			end: start + match[0].length - (0, _gabrielvfonseca_normalization_core.expectDefined)(match[1], "code regions regex capture 1").length
		});
	}
	for (const match of text.matchAll(/`+[^`]+`+/g)) {
		const start = match.index ?? 0;
		const end = start + match[0].length;
		if (!regions.some((r) => start >= r.start && end <= r.end)) regions.push({
			start,
			end
		});
	}
	regions.sort((a, b) => a.start - b.start);
	return regions;
}
/** Returns true when a character offset falls inside one of the discovered code regions. */
function isInsideCode(pos, regions) {
	return regions.some((r) => pos >= r.start && pos < r.end);
}
//#endregion
//#region src/shared/text/model-special-tokens.ts
const MODEL_SPECIAL_TOKEN_RE = /<[|｜][^|｜]*[|｜]>/g;
function overlapsCodeRegion(start, end, codeRegions) {
	return codeRegions.some((region) => start < region.end && end > region.start);
}
function shouldInsertSeparator(before, after) {
	return Boolean(before && after && !/\s/.test(before) && !/\s/.test(after));
}
/**
* Strips leaked model control tokens like `<|assistant|>` or full-width pipe variants.
* Code examples are preserved; remove this when providers stop emitting these tokens.
*
* @see https://github.com/operator/operator/issues/40020
*/
function stripModelSpecialTokens(text) {
	if (!text) return text;
	MODEL_SPECIAL_TOKEN_RE.lastIndex = 0;
	if (!MODEL_SPECIAL_TOKEN_RE.test(text)) return text;
	MODEL_SPECIAL_TOKEN_RE.lastIndex = 0;
	const codeRegions = findCodeRegions(text);
	let out = "";
	let cursor = 0;
	for (const match of text.matchAll(MODEL_SPECIAL_TOKEN_RE)) {
		const matched = match[0];
		const start = match.index ?? 0;
		const end = start + matched.length;
		out += text.slice(cursor, start);
		if (isInsideCode(start, codeRegions) || overlapsCodeRegion(start, end, codeRegions)) out += matched;
		else if (shouldInsertSeparator(text[start - 1], text[end])) out += " ";
		cursor = end;
	}
	out += text.slice(cursor);
	return out;
}
//#endregion
//#region src/shared/text/final-tags.ts
const FINAL_TAG_CANDIDATE_RE = /<[^<>]*>/g;
function isWhitespace(char) {
	return /\s/.test(char);
}
function parseAttributeList(text) {
	let index = 0;
	while (index < text.length) {
		while (index < text.length && isWhitespace(text[index] ?? "")) index += 1;
		if (index >= text.length) return true;
		const nameStart = index;
		while (index < text.length) {
			const char = text[index] ?? "";
			if (isWhitespace(char) || char === "=") break;
			if (char === "/" || char === "\"" || char === "'" || char === "<" || char === ">") return false;
			index += 1;
		}
		if (index === nameStart) return false;
		while (index < text.length && isWhitespace(text[index] ?? "")) index += 1;
		if (text[index] !== "=") continue;
		index += 1;
		while (index < text.length && isWhitespace(text[index] ?? "")) index += 1;
		if (index >= text.length) return false;
		const quote = text[index];
		if (quote === "\"" || quote === "'") {
			index += 1;
			const end = text.indexOf(quote, index);
			if (end === -1) return false;
			index = end + 1;
			continue;
		}
		const valueStart = index;
		while (index < text.length && !isWhitespace(text[index] ?? "")) {
			const char = text[index] ?? "";
			if (char === "\"" || char === "'" || char === "<" || char === ">") return false;
			index += 1;
		}
		if (index === valueStart) return false;
	}
	return true;
}
/** Parses a candidate `<final>` tag while rejecting lookalike names and malformed attributes. */
function parseFinalTag(text) {
	if (!text.startsWith("<") || !text.endsWith(">")) return null;
	let body = text.slice(1, -1).trimStart();
	let isClose = false;
	if (body.startsWith("/")) {
		isClose = true;
		body = body.slice(1).trimStart();
	}
	if (!body.toLowerCase().startsWith("final")) return null;
	const boundary = body[5] ?? "";
	if (boundary && !isWhitespace(boundary) && boundary !== "/") return null;
	let rest = body.slice(5);
	if (isClose) return rest.trim().length === 0 ? {
		isClose: true,
		isSelfClosing: false
	} : null;
	const trimmedRest = rest.trimEnd();
	const isSelfClosing = trimmedRest.endsWith("/");
	rest = isSelfClosing ? trimmedRest.slice(0, -1) : rest;
	if (!parseAttributeList(rest)) return null;
	return {
		isClose: false,
		isSelfClosing
	};
}
/** Finds valid `<final>` control tags so callers can strip only actual model markers. */
function findFinalTagMatches(text) {
	const matches = [];
	for (const match of text.matchAll(FINAL_TAG_CANDIDATE_RE)) {
		const tagText = match[0];
		const parsed = parseFinalTag(tagText);
		if (!parsed) continue;
		matches.push({
			index: match.index ?? 0,
			text: tagText,
			...parsed
		});
	}
	return matches;
}
/** Removes valid `<final>` tags while preserving their enclosed visible answer text. */
function stripFinalTags(text) {
	let output = "";
	let lastIndex = 0;
	for (const match of findFinalTagMatches(text)) {
		output += text.slice(lastIndex, match.index);
		lastIndex = match.index + match.text.length;
	}
	output += text.slice(lastIndex);
	return output;
}
//#endregion
//#region src/shared/text/reasoning-tags.ts
const QUICK_TAG_RE = /<\s*\/?\s*(?:(?:antml:|mm:)?(?:think(?:ing)?|thought)|antthinking|final)\b/i;
const THINKING_TAG_RE = /<\s*(\/?)\s*(?:(?:antml:|mm:)?(?:think(?:ing)?|thought)|antthinking)\b[^<>]*>/gi;
function applyTrim(value, mode) {
	if (mode === "none") return value;
	if (mode === "start") return value.trimStart();
	return value.trim();
}
/** Detects whether a stray reasoning close tag separates two visible text regions. */
function hasOrphanReasoningCloseBoundary(params) {
	return params.before.trim().length > 0 && params.after.trim().length > 0;
}
function hasReasoningCloseTagAfter(text, start, codeRegions) {
	for (const match of text.slice(start).matchAll(THINKING_TAG_RE)) {
		if (isInsideCode(start + (match.index ?? 0), codeRegions)) continue;
		if (match[1] === "/") return true;
	}
	THINKING_TAG_RE.lastIndex = 0;
	return false;
}
/** Strips model reasoning/final tags from visible text while preserving literal code examples. */
function stripReasoningTagsFromText(text, options) {
	if (!text) return text;
	if (!QUICK_TAG_RE.test(text)) return text;
	const mode = options?.mode ?? "strict";
	const trimMode = options?.trim ?? "both";
	const scope = options?.scope ?? "all";
	let cleaned = text;
	const matches = findFinalTagMatches(cleaned);
	THINKING_TAG_RE.lastIndex = 0;
	const hasThinkingTag = THINKING_TAG_RE.test(cleaned);
	THINKING_TAG_RE.lastIndex = 0;
	if (matches.length === 0 && !hasThinkingTag) return text;
	if (matches.length > 0) {
		const finalMatches = [];
		const preCodeRegions = findCodeRegions(cleaned);
		for (const match of matches) {
			const start = match.index;
			finalMatches.push({
				start,
				length: match.text.length,
				inCode: isInsideCode(start, preCodeRegions)
			});
		}
		for (let i = finalMatches.length - 1; i >= 0; i--) {
			const m = (0, _gabrielvfonseca_normalization_core.expectDefined)(finalMatches[i], "final matches capture group i");
			if (!m.inCode) cleaned = cleaned.slice(0, m.start) + cleaned.slice(m.start + m.length);
		}
	}
	const codeRegions = findCodeRegions(cleaned);
	THINKING_TAG_RE.lastIndex = 0;
	let result = "";
	let lastIndex = 0;
	let thinkingDepth = 0;
	let firstUnclosedContentIndex;
	for (const match of cleaned.matchAll(THINKING_TAG_RE)) {
		const idx = match.index ?? 0;
		const isClose = match[1] === "/";
		if (isInsideCode(idx, codeRegions)) continue;
		if (thinkingDepth === 0) {
			if (scope === "leading" && !isClose && (result + cleaned.slice(lastIndex, idx)).trim().length > 0 && !hasReasoningCloseTagAfter(cleaned, idx + match[0].length, codeRegions)) return applyTrim(result + cleaned.slice(lastIndex), trimMode);
			if (isClose) {
				const afterIndex = idx + match[0].length;
				const before = cleaned.slice(lastIndex, idx);
				if (hasOrphanReasoningCloseBoundary({
					before,
					after: cleaned.slice(afterIndex)
				})) result = "";
				else result += before;
				lastIndex = afterIndex;
				continue;
			}
			result += cleaned.slice(lastIndex, idx);
			thinkingDepth = 1;
			firstUnclosedContentIndex = idx + match[0].length;
		} else if (isClose) {
			thinkingDepth -= 1;
			if (thinkingDepth === 0) firstUnclosedContentIndex = void 0;
		} else thinkingDepth += 1;
		lastIndex = idx + match[0].length;
	}
	if (thinkingDepth === 0 || mode === "preserve") result += cleaned.slice(lastIndex);
	const trimmedResult = applyTrim(result, trimMode);
	if (mode === "strict" && thinkingDepth > 0 && !trimmedResult && firstUnclosedContentIndex !== void 0 && cleaned.trim()) return applyTrim(cleaned.slice(firstUnclosedContentIndex), trimMode);
	return trimmedResult;
}
//#endregion
//#region src/shared/text/assistant-visible-text.ts
const MEMORY_TAG_RE = /<\s*(\/?)\s*relevant[-_]memories\b[^<>]*>/gi;
const MEMORY_TAG_QUICK_RE = /<\s*\/?\s*relevant[-_]memories\b/i;
const LEGACY_BRACKET_TOOL_BLOCK_QUICK_RE = /\[\s*\/?\s*TOOL_(?:CALL|RESULT)\s*\]/i;
const INTERNAL_TRACE_LINE_QUICK_RE = /(?:📊|🛠️|📖|📝|🔍|🔎|⚙️|tool[-_ ]?call|tool[-_ ]?result|function[-_ ]?call)/i;
const INTERNAL_TRACE_LINE_RE = /^(?:>\s*)?(?:⚠️\s*)?(?:📊|🛠️|📖|📝|🔍|🔎|⚙️)\s*(?:Session Status|Exec|Read|Edit|Write|Patch|Search|Open|Click|Find|Screenshot|Update Plan|Tool Call|Tool Result|Function Call|Shell|Command)\s*:/i;
const INTERNAL_COMPACT_FAILURE_TRACE_LINE_RE = /^(?:>\s*)?⚠️\s*🛠️\s+\S[\s\S]*\s+\(agent\)`{0,2}\s+failed(?:\s*:.*)?\s*$/i;
const INTERNAL_COMPACT_COMMAND_TRACE_LINE_RE = /^(?:>\s*)?🛠️\s*(?:(?:(?:elevated|pty)\b\s*(?:·|,)\s*)+)?(?:`{1,2}\s*\S|(?:run|check|fetch|pull|push|view|show|list|switch|create|merge|rebase|stage|restore|reset|stash|search|find|print|copy|move|remove|install|start|cd|git|pnpm|npm|yarn|bun|node|python|python3|bash|sh)\b)/i;
const INTERNAL_CHANNEL_TRACE_LINE_RE = /^(?:>\s*)?(?:tool[-_ ]?call|tool[-_ ]?result|function[-_ ]?call)\s*[:=]/i;
/**
* Strip XML-style tool call tags that models sometimes emit as plain text.
* This stateful pass hides content from an opening tag through the matching
* closing tag, or to end-of-string if the stream was truncated mid-tag.
*/
const TOOL_CALL_QUICK_RE = /<\s*\/?\s*(?:antml:)?(?:tool_call|tool_result|function_calls?|function_response|function|tool_calls|invoke|parameter)\b/i;
const TOOL_CALL_TAG_NAMES = /* @__PURE__ */ new Set([
	"tool_call",
	"tool_result",
	"function_call",
	"function_calls",
	"function_response",
	"function",
	"tool_calls",
	"antml:invoke",
	"antml:parameter"
]);
const TOOL_CALL_JSON_PAYLOAD_START_RE = /^(?:\s+[A-Za-z_:][-A-Za-z0-9_:.]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))*\s*(?:\r?\n\s*)?[[{]/;
const TOOL_CALL_XML_PAYLOAD_START_RE = /^\s*(?:\r?\n\s*)?<(?:antml:)?(?:function_call|tool_call|function|invoke|parameters?|arguments?)\b/i;
const NESTED_JSON_TOOL_CALL_PAYLOAD_START_RE = /^\s*(?:\r?\n\s*)?<(?:function_call|tool_call)\b/i;
function endsInsideQuotedString(text, start, end) {
	let quoteChar = null;
	let isEscaped = false;
	for (let idx = start; idx < end; idx += 1) {
		const char = text[idx];
		if (quoteChar === null) {
			if (char === "\"" || char === "'") quoteChar = char;
			continue;
		}
		if (isEscaped) {
			isEscaped = false;
			continue;
		}
		if (char === "\\") {
			isEscaped = true;
			continue;
		}
		if (char === quoteChar) quoteChar = null;
	}
	return quoteChar !== null;
}
function parseXmlTagAt(text, start) {
	if (text[start] !== "<") return null;
	let cursor = start + 1;
	while (cursor < text.length && /\s/.test(text.charAt(cursor))) cursor += 1;
	let isClose = false;
	if (text[cursor] === "/") {
		isClose = true;
		cursor += 1;
		while (cursor < text.length && /\s/.test(text.charAt(cursor))) cursor += 1;
	}
	const nameStart = cursor;
	if (!/[A-Za-z_:]/.test(text[cursor] ?? "")) return null;
	cursor += 1;
	while (cursor < text.length && /[A-Za-z0-9_.:-]/.test(text.charAt(cursor))) cursor += 1;
	const tagName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(text.slice(nameStart, cursor));
	if (!isToolCallBoundary(text[cursor])) return null;
	const contentStart = cursor;
	const closeIndex = findTagCloseIndex(text, cursor);
	if (closeIndex === -1) return {
		contentStart,
		end: text.length,
		isClose,
		isSelfClosing: false,
		tagName,
		isTruncated: true
	};
	return {
		contentStart,
		end: closeIndex + 1,
		isClose,
		isSelfClosing: !isClose && /\/\s*$/.test(text.slice(cursor, closeIndex)),
		tagName,
		isTruncated: false
	};
}
function isToolCallBoundary(char) {
	return !char || /\s/.test(char) || char === "/" || char === ">";
}
function findTagCloseIndex(text, start) {
	let quoteChar = null;
	let isEscaped = false;
	for (let idx = start; idx < text.length; idx += 1) {
		const char = text[idx];
		if (quoteChar !== null) {
			if (isEscaped) {
				isEscaped = false;
				continue;
			}
			if (char === "\\") {
				isEscaped = true;
				continue;
			}
			if (char === quoteChar) quoteChar = null;
			continue;
		}
		if (char === "\"" || char === "'") {
			quoteChar = char;
			continue;
		}
		if (char === "<") return -1;
		if (char === ">") return idx;
	}
	return -1;
}
function detectToolCallPayloadKind(text, start) {
	const rest = text.slice(start);
	if (TOOL_CALL_JSON_PAYLOAD_START_RE.test(rest)) return "json";
	if (TOOL_CALL_XML_PAYLOAD_START_RE.test(rest)) return "xml";
	return null;
}
function startsWithNestedJsonToolCallPayload(text, start) {
	if (!NESTED_JSON_TOOL_CALL_PAYLOAD_START_RE.test(text.slice(start))) return false;
	let cursor = start;
	while (cursor < text.length && /\s/.test(text.charAt(cursor))) cursor += 1;
	const nestedTag = parseToolCallTagAt(text, cursor);
	if (!nestedTag || nestedTag.isClose || nestedTag.isSelfClosing || nestedTag.isTruncated || nestedTag.tagName !== "function_call" && nestedTag.tagName !== "tool_call") return false;
	return TOOL_CALL_JSON_PAYLOAD_START_RE.test(text.slice(nestedTag.end));
}
function isLikelyStandaloneFunctionToolCall(text, tagStart, tag) {
	if (tag.tagName !== "function" || tag.isClose || tag.isSelfClosing || tag.isTruncated) return false;
	if (!/\bname\s*=/.test(text.slice(tag.contentStart, tag.end))) return false;
	let idx = tagStart - 1;
	while (idx >= 0 && (text[idx] === " " || text[idx] === "	")) idx -= 1;
	return idx < 0 || text[idx] === "\n" || text[idx] === "\r" || /[.!?:]/.test(text.charAt(idx));
}
function isStandaloneOpeningTagLine(text, tagStart, tag) {
	let idx = tagStart - 1;
	while (idx >= 0 && (text[idx] === " " || text[idx] === "	")) idx -= 1;
	if (!(idx < 0 || text[idx] === "\n" || text[idx] === "\r")) return false;
	let after = tag.end;
	while (after < text.length && (text[after] === " " || text[after] === "	")) after += 1;
	return after >= text.length || text[after] === "\n" || text[after] === "\r";
}
function isOpeningTagFollowedByLineBreak(text, tag) {
	let after = tag.end;
	while (after < text.length && (text[after] === " " || text[after] === "	")) after += 1;
	return after >= text.length || text[after] === "\n" || text[after] === "\r";
}
function hasSameLineContentAfterOpeningTag(text, tag) {
	let after = tag.end;
	while (after < text.length && (text[after] === " " || text[after] === "	")) after += 1;
	return after < text.length && text[after] !== "\n" && text[after] !== "\r";
}
function isVisibleLineStart(text) {
	let idx = text.length - 1;
	while (idx >= 0 && (text[idx] === " " || text[idx] === "	")) idx -= 1;
	return idx < 0 || text[idx] === "\n" || text[idx] === "\r";
}
function isAdjacentToStrippedToolCallBlock(text, tagStart, lastStrippedBlockEnd) {
	if (lastStrippedBlockEnd === null || lastStrippedBlockEnd > tagStart) return false;
	for (let idx = lastStrippedBlockEnd; idx < tagStart; idx += 1) if (text[idx] !== " " && text[idx] !== "	" && text[idx] !== "\n" && text[idx] !== "\r") return false;
	return true;
}
function findMatchingToolCallCloseIndex(text, start, tagName) {
	for (let idx = start; idx < text.length; idx += 1) {
		if (text[idx] !== "<") continue;
		const tag = parseToolCallTagAt(text, idx);
		if (!tag) continue;
		if (tag.isClose && tag.tagName === tagName && !tag.isTruncated) return idx;
		idx = Math.max(idx, tag.end - 1);
	}
	return -1;
}
function findAdjacentOpeningToolCallTag(text, start, tagName) {
	let idx = start;
	while (idx < text.length && /\s/.test(text.charAt(idx))) idx += 1;
	if (text[idx] !== "<") return null;
	const tag = parseToolCallTagAt(text, idx);
	if (!tag || tag.isClose || tag.tagName !== tagName) return null;
	return tag;
}
function parseToolCallTagAt(text, start) {
	const tag = parseXmlTagAt(text, start);
	return tag && TOOL_CALL_TAG_NAMES.has(tag.tagName) ? tag : null;
}
function hasMatchingXmlCloseTag(text, start, tagName) {
	let depth = 1;
	for (let idx = start; idx < text.length; idx += 1) {
		if (text[idx] !== "<") continue;
		const tag = parseXmlTagAt(text, idx);
		if (!tag || tag.tagName !== tagName || tag.isTruncated) continue;
		if (tag.isClose) {
			depth -= 1;
			if (depth === 0) return true;
		} else if (!tag.isSelfClosing) depth += 1;
		idx = Math.max(idx, tag.end - 1);
	}
	return false;
}
function isDanglingFunctionParameterParent(text, tag) {
	if (tag.tagName !== "function" || !/\bname\s*=/.test(text.slice(tag.contentStart, tag.end))) return false;
	let cursor = tag.end;
	while (cursor < text.length && /\s/.test(text.charAt(cursor))) cursor += 1;
	const nextTag = parseXmlTagAt(text, cursor);
	return nextTag?.tagName === "parameter" && !nextTag.isClose;
}
function consumeImmediateLineBreak(text, start) {
	if (text[start] === "\r" && text[start + 1] === "\n") return start + 2;
	return text[start] === "\n" || text[start] === "\r" ? start + 1 : null;
}
function trimImmediateLineBreakBefore(text, start, end) {
	if (end > start && text[end - 1] === "\n") return end - (end - 2 >= start && text[end - 2] === "\r" ? 2 : 1);
	return end > start && text[end - 1] === "\r" ? end - 1 : end;
}
function isLineStartAt(text, start) {
	let cursor = start - 1;
	while (cursor >= 0 && (text[cursor] === " " || text[cursor] === "	")) cursor -= 1;
	return cursor < 0 || text[cursor] === "\n" || text[cursor] === "\r";
}
function isLineEndAfter(text, end) {
	let cursor = end;
	while (cursor < text.length && (text[cursor] === " " || text[cursor] === "	")) cursor += 1;
	return cursor >= text.length || text[cursor] === "\n" || text[cursor] === "\r";
}
function unwrapStandaloneParameterTags(text) {
	if (!/<\s*\/?\s*parameter\b/i.test(text)) return text;
	const codeRegions = findCodeRegions(text);
	const openTags = [];
	let result = "";
	let lastIndex = 0;
	for (let idx = 0; idx < text.length; idx += 1) {
		if (text[idx] !== "<" || isInsideCode(idx, codeRegions)) continue;
		const tag = parseXmlTagAt(text, idx);
		if (!tag || tag.isTruncated) continue;
		if (tag.isClose) {
			const openIndex = openTags.findLastIndex((entry) => entry.name === tag.tagName);
			if (openIndex !== -1) {
				const opening = (0, _gabrielvfonseca_normalization_core.expectDefined)(openTags[openIndex], "open tags entry at open index");
				if (opening.unwrap) {
					const contentEnd = opening.trimBoundaryLineBreaks && isLineStartAt(text, idx) && isLineEndAfter(text, tag.end) ? trimImmediateLineBreakBefore(text, lastIndex, idx) : idx;
					result += text.slice(lastIndex, contentEnd);
					lastIndex = tag.end;
				}
				openTags.splice(openIndex);
			}
		} else if (tag.isSelfClosing) {
			if (tag.tagName === "parameter" && openTags.length === 0) {
				result += text.slice(lastIndex, idx);
				lastIndex = tag.end;
			}
		} else if (hasMatchingXmlCloseTag(text, tag.end, tag.tagName) || isDanglingFunctionParameterParent(text, tag)) {
			const unwrap = tag.tagName === "parameter" && openTags.length === 0;
			let trimBoundaryLineBreaks = false;
			if (unwrap) {
				result += text.slice(lastIndex, idx);
				lastIndex = tag.end;
				const contentStart = isLineStartAt(text, idx) ? consumeImmediateLineBreak(text, lastIndex) : null;
				if (contentStart !== null) {
					lastIndex = contentStart;
					trimBoundaryLineBreaks = true;
				}
			}
			openTags.push({
				name: tag.tagName,
				unwrap,
				trimBoundaryLineBreaks
			});
		}
		idx = Math.max(idx, tag.end - 1);
	}
	return result + text.slice(lastIndex);
}
function stripToolCallXmlTags(input, options = {}) {
	const text = input;
	if (!text || !TOOL_CALL_QUICK_RE.test(text)) return text;
	const codeRegions = findCodeRegions(text);
	let result = "";
	let lastIndex = 0;
	let inToolCallBlock = false;
	let toolCallBlockContentStart = 0;
	let toolCallBlockNeedsQuoteBalance = false;
	let toolCallBlockStart = 0;
	let toolCallBlockTagName = null;
	let lastStrippedToolCallBlockEnd = null;
	const visibleTagBalance = /* @__PURE__ */ new Map();
	for (let idx = 0; idx < text.length; idx += 1) {
		if (text[idx] !== "<") continue;
		if (!inToolCallBlock && isInsideCode(idx, codeRegions)) continue;
		const tag = parseToolCallTagAt(text, idx);
		if (!tag) continue;
		if (!inToolCallBlock) {
			result += text.slice(lastIndex, idx);
			if (tag.isClose) {
				if (tag.isTruncated) {
					const preserveEnd = tag.contentStart;
					result += text.slice(idx, preserveEnd);
					lastIndex = preserveEnd;
					idx = Math.max(idx, preserveEnd - 1);
					continue;
				}
				const balance = visibleTagBalance.get(tag.tagName) ?? 0;
				if (balance > 0) {
					result += text.slice(idx, tag.end);
					visibleTagBalance.set(tag.tagName, balance - 1);
				}
				lastIndex = tag.end;
				idx = Math.max(idx, tag.end - 1);
				continue;
			}
			if (tag.isSelfClosing) {
				lastStrippedToolCallBlockEnd = tag.end;
				lastIndex = tag.end;
				idx = Math.max(idx, tag.end - 1);
				continue;
			}
			const payloadStart = tag.isTruncated ? tag.contentStart : tag.end;
			const isPluralToolCallWrapper = tag.tagName === "function_calls" || tag.tagName === "tool_calls";
			const matchingCloseStart = isPluralToolCallWrapper ? findMatchingToolCallCloseIndex(text, tag.end, tag.tagName) : -1;
			const matchingCloseTag = matchingCloseStart === -1 ? null : parseToolCallTagAt(text, matchingCloseStart);
			const shouldStripPluralWrapperBeforeResponse = options.stripFunctionResponseAfterPluralToolCalls === true && isPluralToolCallWrapper && matchingCloseTag !== null && findAdjacentOpeningToolCallTag(text, matchingCloseTag.end, "function_response") !== null;
			const payloadKind = tag.tagName === "tool_call" || tag.tagName === "function" || tag.tagName === "antml:invoke" || (options.stripFunctionCallsXmlPayloads === true || shouldStripPluralWrapperBeforeResponse) && isPluralToolCallWrapper ? detectToolCallPayloadKind(text, payloadStart) : TOOL_CALL_JSON_PAYLOAD_START_RE.test(text.slice(payloadStart)) ? "json" : null;
			const shouldStripStandaloneFunction = tag.tagName !== "function" || isLikelyStandaloneFunctionToolCall(text, idx, tag);
			const functionResponseCloseStart = tag.tagName === "function_response" ? findMatchingToolCallCloseIndex(text, tag.end, tag.tagName) : -1;
			const shouldStripAdjacentResult = isAdjacentToStrippedToolCallBlock(text, idx, lastStrippedToolCallBlockEnd) && (isOpeningTagFollowedByLineBreak(text, tag) || functionResponseCloseStart !== -1 || hasSameLineContentAfterOpeningTag(text, tag));
			const shouldStripStandaloneResult = tag.tagName === "function_response" && (isStandaloneOpeningTagLine(text, idx, tag) || shouldStripAdjacentResult || functionResponseCloseStart !== -1 && isVisibleLineStart(result) && isOpeningTagFollowedByLineBreak(text, tag));
			if (!tag.isClose && (payloadKind && shouldStripStandaloneFunction || shouldStripStandaloneResult)) {
				inToolCallBlock = true;
				toolCallBlockContentStart = tag.end;
				toolCallBlockNeedsQuoteBalance = payloadKind === "json" || payloadKind === "xml" && startsWithNestedJsonToolCallPayload(text, payloadStart);
				toolCallBlockStart = idx;
				toolCallBlockTagName = tag.tagName;
				if (tag.isTruncated) {
					lastIndex = text.length;
					break;
				}
			} else {
				const preserveEnd = tag.isTruncated ? tag.contentStart : tag.end;
				result += text.slice(idx, preserveEnd);
				if (!tag.isTruncated) visibleTagBalance.set(tag.tagName, (visibleTagBalance.get(tag.tagName) ?? 0) + 1);
				lastIndex = preserveEnd;
				idx = Math.max(idx, preserveEnd - 1);
				continue;
			}
		} else if (tag.isClose && (tag.tagName === toolCallBlockTagName || toolCallBlockTagName === "tool_result" && tag.tagName === "tool_call") && (!toolCallBlockNeedsQuoteBalance || !endsInsideQuotedString(text, toolCallBlockContentStart, idx))) {
			const closedBlockTagName = toolCallBlockTagName;
			inToolCallBlock = false;
			toolCallBlockNeedsQuoteBalance = false;
			toolCallBlockTagName = null;
			if (closedBlockTagName) lastStrippedToolCallBlockEnd = tag.end;
		}
		lastIndex = tag.end;
		idx = Math.max(idx, tag.end - 1);
	}
	if (!inToolCallBlock) result += text.slice(lastIndex);
	else if (toolCallBlockTagName === "function") result += text.slice(toolCallBlockStart);
	return unwrapStandaloneParameterTags(result);
}
/**
* Strip malformed Minimax tool invocations that leak into text content.
* Minimax sometimes embeds tool calls as XML in text blocks instead of
* proper structured tool calls.
*/
function stripMinimaxToolCallXml(text) {
	if (!text || !/minimax:tool_call/i.test(text)) return text;
	const codeRegions = findCodeRegions(text);
	const minimaxToolXmlRe = /<invoke\b[^>]*>[\s\S]*?<\/invoke>|<\/?minimax:tool_call>/gi;
	let result = "";
	let cursor = 0;
	for (const match of text.matchAll(minimaxToolXmlRe)) {
		const start = match.index ?? 0;
		if (isInsideCode(start, codeRegions)) continue;
		result += text.slice(cursor, start);
		cursor = start + match[0].length;
	}
	result += text.slice(cursor);
	return result;
}
function isLegacyBracketToolCallPayload(value) {
	return /\btool\s*=>\s*["'][A-Za-z_][A-Za-z0-9_.:-]{0,119}["']/i.test(value) && /\bargs\s*=>/i.test(value);
}
function isLegacyBracketToolResultPayload(value) {
	return /^\s*[{[]/.test(value) || /\b(?:tool|result|output|content)\s*=>/i.test(value) || /\b(?:tool|result|output|content)\s*:/i.test(value);
}
function stripLegacyBracketToolCallBlocks(text) {
	if (!text || !LEGACY_BRACKET_TOOL_BLOCK_QUICK_RE.test(text)) return text;
	const codeRegions = findCodeRegions(text);
	let result = "";
	let cursor = 0;
	while (cursor < text.length) {
		const openMatch = /\[\s*TOOL_(CALL|RESULT)\s*\]/gi.exec(text.slice(cursor));
		if (!openMatch?.[0]) {
			result += text.slice(cursor);
			break;
		}
		const blockKind = openMatch[1]?.toUpperCase();
		const openStart = cursor + (openMatch.index ?? 0);
		const payloadStart = openStart + openMatch[0].length;
		if (isInsideCode(openStart, codeRegions)) {
			result += text.slice(cursor, payloadStart);
			cursor = payloadStart;
			continue;
		}
		const closeMatch = (blockKind === "RESULT" ? /\[\s*\/\s*TOOL_RESULT\s*\]/gi : /\[\s*\/\s*TOOL_CALL\s*\]/gi).exec(text.slice(payloadStart));
		const closeStart = closeMatch?.[0] && !isInsideCode(payloadStart + (closeMatch.index ?? 0), codeRegions) ? payloadStart + (closeMatch.index ?? 0) : -1;
		const payloadEnd = closeStart >= 0 ? closeStart : text.length;
		const payload = text.slice(payloadStart, payloadEnd);
		if (!(blockKind === "RESULT" ? isLegacyBracketToolResultPayload(payload) : isLegacyBracketToolCallPayload(payload))) {
			result += text.slice(cursor, payloadStart);
			cursor = payloadStart;
			continue;
		}
		result += text.slice(cursor, openStart);
		cursor = closeStart >= 0 ? closeStart + (closeMatch?.[0].length ?? 0) : text.length;
	}
	return result;
}
/**
* Strip downgraded tool call text representations that leak into user-visible
* text content when replaying history across providers.
*/
function stripDowngradedToolCallText(text) {
	if (!text) return text;
	if (!/\[Tool (?:Call|Result)/i.test(text) && !/\[Historical context/i.test(text)) return text;
	const consumeJsonish = (input, start, options) => {
		const { allowLeadingNewlines = false } = options ?? {};
		let index = start;
		while (index < input.length) {
			const ch = input[index];
			if (ch === " " || ch === "	") {
				index += 1;
				continue;
			}
			if (allowLeadingNewlines && (ch === "\n" || ch === "\r")) {
				index += 1;
				continue;
			}
			break;
		}
		if (index >= input.length) return null;
		const startChar = input[index];
		if (startChar === "{" || startChar === "[") {
			let depth = 0;
			let inString = false;
			let escape = false;
			for (let idx = index; idx < input.length; idx += 1) {
				const ch = input[idx];
				if (inString) {
					if (escape) escape = false;
					else if (ch === "\\") escape = true;
					else if (ch === "\"") inString = false;
					continue;
				}
				if (ch === "\"") {
					inString = true;
					continue;
				}
				if (ch === "{" || ch === "[") depth += 1;
				else if (ch === "}" || ch === "]") {
					depth -= 1;
					if (depth === 0) return idx + 1;
				}
			}
			return null;
		}
		if (startChar === "\"") {
			let escape = false;
			for (let idx = index + 1; idx < input.length; idx += 1) {
				const ch = input[idx];
				if (escape) {
					escape = false;
					continue;
				}
				if (ch === "\\") {
					escape = true;
					continue;
				}
				if (ch === "\"") return idx + 1;
			}
			return null;
		}
		let end = index;
		while (end < input.length && input[end] !== "\n" && input[end] !== "\r") end += 1;
		return end;
	};
	const stripToolCalls = (input) => {
		const toolCallRe = /\[Tool Call:[^\]]*\]/gi;
		let result = "";
		let cursor = 0;
		for (const match of input.matchAll(toolCallRe)) {
			const start = match.index ?? 0;
			if (start < cursor) continue;
			result += input.slice(cursor, start);
			let index = start + match[0].length;
			while (index < input.length && (input[index] === " " || input[index] === "	")) index += 1;
			if (input[index] === "\r") {
				index += 1;
				if (input[index] === "\n") index += 1;
			} else if (input[index] === "\n") index += 1;
			while (index < input.length && (input[index] === " " || input[index] === "	")) index += 1;
			if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(input.slice(index, index + 9)) === "arguments") {
				index += 9;
				if (input[index] === ":") index += 1;
				if (input[index] === " ") index += 1;
				const end = consumeJsonish(input, index, { allowLeadingNewlines: true });
				if (end !== null) index = end;
			}
			if ((input[index] === "\n" || input[index] === "\r") && (result.endsWith("\n") || result.endsWith("\r") || result.length === 0)) {
				if (input[index] === "\r") index += 1;
				if (input[index] === "\n") index += 1;
			}
			cursor = index;
		}
		result += input.slice(cursor);
		return result;
	};
	let cleaned = stripToolCalls(text);
	cleaned = cleaned.replace(/\[Tool Result for ID[^\]]*\]\n?[\s\S]*?(?=\n*\[Tool |\n*$)/gi, "");
	cleaned = cleaned.replace(/\[Historical context:[^\]]*\]\n?/gi, "");
	return cleaned.trim();
}
function stripRelevantMemoriesTags(text) {
	if (!text || !MEMORY_TAG_QUICK_RE.test(text)) return text;
	MEMORY_TAG_RE.lastIndex = 0;
	const codeRegions = findCodeRegions(text);
	let result = "";
	let lastIndex = 0;
	let inMemoryBlock = false;
	for (const match of text.matchAll(MEMORY_TAG_RE)) {
		const idx = match.index ?? 0;
		if (isInsideCode(idx, codeRegions)) continue;
		const isClose = match[1] === "/";
		if (!inMemoryBlock) {
			result += text.slice(lastIndex, idx);
			if (!isClose) inMemoryBlock = true;
		} else if (isClose) inMemoryBlock = false;
		lastIndex = idx + match[0].length;
	}
	if (!inMemoryBlock) result += text.slice(lastIndex);
	return result;
}
function stripAssistantInternalTraceLines(text) {
	if (!text || !INTERNAL_TRACE_LINE_QUICK_RE.test(text)) return text;
	const codeRegions = findCodeRegions(text);
	let result = "";
	let lineStart = 0;
	while (lineStart < text.length) {
		const newlineIndex = text.indexOf("\n", lineStart);
		const lineEnd = newlineIndex === -1 ? text.length : newlineIndex + 1;
		const rawLine = text.slice(lineStart, lineEnd);
		const trimmed = (rawLine.endsWith("\n") ? rawLine.slice(0, -1).replace(/\r$/, "") : rawLine).trim();
		if (!(!isInsideCode(lineStart, codeRegions) && (INTERNAL_TRACE_LINE_RE.test(trimmed) || INTERNAL_COMPACT_FAILURE_TRACE_LINE_RE.test(trimmed) || INTERNAL_COMPACT_COMMAND_TRACE_LINE_RE.test(trimmed) || INTERNAL_CHANNEL_TRACE_LINE_RE.test(trimmed)))) result += rawLine;
		lineStart = lineEnd;
	}
	return result;
}
const ASSISTANT_VISIBLE_TEXT_PIPELINE_OPTIONS = {
	delivery: {
		finalTrim: "both",
		stripFunctionResponseAfterPluralToolCalls: true,
		reasoningMode: "strict",
		reasoningTrim: "both",
		stageOrder: "reasoning-last"
	},
	"final-answer-delivery": {
		finalTrim: "both",
		stripFunctionResponseAfterPluralToolCalls: true,
		reasoningMode: "strict",
		reasoningScope: "leading",
		reasoningTrim: "both",
		stageOrder: "reasoning-last"
	},
	history: {
		finalTrim: "none",
		reasoningMode: "strict",
		reasoningTrim: "none",
		stageOrder: "reasoning-last"
	},
	"internal-scaffolding": {
		finalTrim: "start",
		preserveDowngradedToolText: true,
		preserveMinimaxToolXml: true,
		reasoningMode: "preserve",
		reasoningTrim: "start",
		stageOrder: "reasoning-first"
	},
	"tool-progress": {
		finalTrim: "both",
		stripFunctionCallsXmlPayloads: true,
		stripInternalTraceLines: false,
		reasoningMode: "strict",
		reasoningTrim: "both",
		stageOrder: "reasoning-last"
	}
};
function applyAssistantVisibleTextStagePipeline(text, options) {
	if (!text) return text;
	const stripReasoning = (value) => stripReasoningTagsFromText(value, {
		mode: options.reasoningMode,
		scope: options.reasoningScope,
		trim: options.reasoningTrim
	});
	const applyFinalTrim = (value) => {
		if (options.finalTrim === "none") return value;
		if (options.finalTrim === "start") return value.trimStart();
		return value.trim();
	};
	const stripNonReasoningStages = (value) => {
		let cleaned = value;
		if (!options.preserveMinimaxToolXml) cleaned = stripMinimaxToolCallXml(cleaned);
		cleaned = stripModelSpecialTokens(cleaned);
		cleaned = stripRelevantMemoriesTags(cleaned);
		cleaned = stripToolCallXmlTags(cleaned, {
			stripFunctionCallsXmlPayloads: options.stripFunctionCallsXmlPayloads,
			stripFunctionResponseAfterPluralToolCalls: options.stripFunctionResponseAfterPluralToolCalls
		});
		if (options.stripInternalTraceLines !== false) cleaned = stripAssistantInternalTraceLines(cleaned);
		cleaned = stripLegacyBracketToolCallBlocks(cleaned);
		cleaned = require_src.stripPlainTextToolCallBlocks(cleaned);
		if (!options.preserveDowngradedToolText) cleaned = stripDowngradedToolCallText(cleaned);
		return cleaned;
	};
	if (options.stageOrder === "reasoning-first") return applyFinalTrim(stripNonReasoningStages(stripReasoning(text)));
	return applyFinalTrim(stripReasoning(stripNonReasoningStages(text)));
}
function sanitizeAssistantVisibleTextWithProfile(text, profile = "delivery") {
	return applyAssistantVisibleTextStagePipeline(text, ASSISTANT_VISIBLE_TEXT_PIPELINE_OPTIONS[profile]);
}
/**
* Canonical user-visible assistant text sanitizer for delivery and history
* extraction paths. Keeps prose, removes internal scaffolding.
*/
function sanitizeAssistantVisibleText(text) {
	return sanitizeAssistantVisibleTextWithProfile(text, "delivery");
}
/** Sanitizes text already marked as final-answer prose by the agent runtime. */
function sanitizeAssistantFinalAnswerText(text) {
	return sanitizeAssistantVisibleTextWithProfile(text, "final-answer-delivery");
}
//#endregion
//#region src/agents/embedded-agent-helpers/sanitize-user-facing-text.ts
/**
* Converts raw provider/transport errors into concise user-facing copy.
*/
/** Format the billing failure copy with optional provider/model context.
*
* When `authMode` is `"oauth"` or `"token"` (i.e. Anthropic Max or a static
* bearer-token subscription) the user has no API key to top up, so we emit
* neutral copy that directs them to check their account instead (#80877).
*/
function formatBillingErrorMessage(provider, model, authMode) {
	const providerName = provider?.trim();
	const modelName = model?.trim();
	const providerLabel = providerName && modelName ? `${providerName} (${modelName})` : providerName || void 0;
	if (authMode === "oauth" || authMode === "token") {
		if (providerLabel) return `⚠️ ${providerLabel} returned a billing error — check your account for subscription or usage limits, then try again.`;
		return "⚠️ API provider returned a billing error — check your account for subscription or usage limits, then try again.";
	}
	if (providerLabel) return `⚠️ ${providerLabel} returned a billing error — your API key has run out of credits or has an insufficient balance. Check your ${providerName} billing dashboard and top up or switch to a different API key.`;
	return "⚠️ API provider returned a billing error — your API key has run out of credits or has an insufficient balance. Check your provider's billing dashboard and top up or switch to a different API key.";
}
const BILLING_ERROR_USER_MESSAGE = formatBillingErrorMessage();
const RATE_LIMIT_ERROR_USER_MESSAGE = "⚠️ API rate limit reached. Please try again later.";
const MODEL_CAPACITY_ERROR_USER_MESSAGE = "⚠️ Selected model is at capacity. Try a different model, or wait and retry.";
const OVERLOADED_ERROR_USER_MESSAGE = "The AI service is temporarily overloaded. Please try again in a moment.";
const TOOL_CALLS_OMITTED_PLACEHOLDER_LINE_RE = /^[ \t]*\[tool calls omitted\][ \t]*$/i;
const ERROR_PREFIX_RE = /^(?:error|(?:[a-z][\w-]*\s+)?api\s*error|openai\s*error|anthropic\s*error|gateway\s*error|codex\s*error|request failed|failed|exception)(?:\s+\d{3})?[:\s-]+/i;
const CONTEXT_OVERFLOW_ERROR_HEAD_RE = /^(?:context overflow:|request_too_large\b|request size exceeds\b|request exceeds the maximum size\b|context length exceeded\b|maximum context length\b|prompt is too long\b|exceeds model context window\b)/i;
const HTTP_ERROR_HINTS = [
	"error",
	"bad request",
	"not found",
	"unauthorized",
	"forbidden",
	"internal server",
	"service unavailable",
	"gateway",
	"rate limit",
	"overloaded",
	"timeout",
	"timed out",
	"invalid",
	"too many requests",
	"permission"
];
const RATE_LIMIT_SPECIFIC_HINT_RE = /\bmin(ute)?s?\b|\bhours?\b|\bseconds?\b|\btry again in\b|\bresets?\b|\bplan\b|\bquota\b/i;
const MODEL_CAPACITY_ERROR_RE = /\b(?:selected\s+)?model\s+(?:is\s+)?at capacity\b/i;
const NON_ERROR_PROVIDER_PAYLOAD_MAX_LENGTH = 16384;
const NON_ERROR_PROVIDER_PAYLOAD_PREFIX_RE = /^codex\s*error(?:\s+\d{3})?[:\s-]+/i;
function extractProviderRateLimitMessage(raw) {
	const withoutPrefix = raw.replace(ERROR_PREFIX_RE, "").trim();
	const candidate = (require_assistant_error_format.parseApiErrorInfo(raw) ?? require_assistant_error_format.parseApiErrorInfo(withoutPrefix))?.message ?? (require_assistant_error_format.extractLeadingHttpStatus(withoutPrefix)?.rest || withoutPrefix);
	if (!candidate || !RATE_LIMIT_SPECIFIC_HINT_RE.test(candidate)) return;
	if (require_assistant_error_format.isCloudflareOrHtmlErrorPage(withoutPrefix)) return;
	const trimmed = candidate.trim();
	if (trimmed.length > 300 || trimmed.startsWith("{") || /^(?:<!doctype\s+html\b|<html\b)/i.test(trimmed)) return;
	return `⚠️ ${trimmed}`;
}
function formatRateLimitOrOverloadedErrorCopy(raw) {
	if (MODEL_CAPACITY_ERROR_RE.test(raw)) return MODEL_CAPACITY_ERROR_USER_MESSAGE;
	const isRateLimit = isRateLimitErrorMessage(raw);
	if (isRateLimit) {
		const providerMessage = extractProviderRateLimitMessage(raw);
		if (providerMessage) return providerMessage;
	}
	if (isOverloadedErrorMessage(raw)) return OVERLOADED_ERROR_USER_MESSAGE;
	if (isRateLimit) return RATE_LIMIT_ERROR_USER_MESSAGE;
}
function formatTransportErrorCopy(raw) {
	if (!raw) return;
	if (require_assistant_error_format.isCloudflareOrHtmlErrorPage(raw)) return;
	const lower = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	if (/\beconnrefused\b/i.test(raw) || lower.includes("connection refused") || lower.includes("actively refused")) return "LLM request failed: connection refused by the provider endpoint.";
	if (/\beconnreset\b|\beconnaborted\b|\benetreset\b|\bepipe\b/i.test(raw) || lower.includes("socket hang up") || lower.includes("connection reset") || lower.includes("connection aborted")) return "LLM request failed: network connection was interrupted.";
	if (/\benotfound\b|\beai_again\b/i.test(raw) || lower.includes("getaddrinfo") || lower.includes("no such host") || lower.includes("dns")) return "LLM request failed: DNS lookup for the provider endpoint failed.";
	if (/\benetunreach\b|\behostunreach\b|\behostdown\b/i.test(raw) || lower.includes("network is unreachable") || lower.includes("host is unreachable")) return "LLM request failed: the provider endpoint is unreachable from this host.";
	if (lower.includes("fetch failed") || lower.includes("connection error") || lower.includes("network request failed")) return "LLM request failed: network connection error.";
	if (raw.includes("网络错误") || raw.includes("网络异常") || raw.includes("连接错误")) return "LLM request failed: provider reported a network error.";
}
function formatDiskSpaceErrorCopy(raw) {
	if (!raw) return;
	const lower = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	if (/\benospc\b/i.test(raw) || lower.includes("no space left on device") || lower.includes("disk full")) return "Operator could not write local session data because the disk is full. Free some disk space and try again.";
}
function isReasoningConstraintErrorMessage(raw) {
	if (!raw) return false;
	const lower = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	return lower.includes("reasoning is mandatory") || lower.includes("reasoning is required") || lower.includes("requires reasoning") || lower.includes("reasoning") && lower.includes("cannot be disabled");
}
function isInvalidStreamingEventOrderError(raw) {
	if (!raw) return false;
	const lower = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	return lower.includes("unexpected event order") && lower.includes("message_start") && lower.includes("message_stop");
}
function isStreamingJsonParseError(raw) {
	if (!raw) return false;
	if (raw.trim() === "Operator transport error: malformed_streaming_fragment") return true;
	return false;
}
function hasRateLimitTpmHint(raw) {
	const lower = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	return /\btpm\b/i.test(lower) || lower.includes("tokens per minute");
}
function looksLikeGenericContextOverflowError(raw) {
	if (!raw) return false;
	const lower = require_string_coerce.normalizeLowercaseStringOrEmpty(raw);
	const hasRequestSizeExceeds = lower.includes("request size exceeds");
	const hasContextWindow = lower.includes("context window") || lower.includes("context length") || lower.includes("maximum context length");
	return lower.includes("request_too_large") || lower.includes("invalid_argument") && lower.includes("maximum number of tokens") || lower.includes("request exceeds the maximum size") || lower.includes("context length exceeded") || lower.includes("maximum context length") || lower.includes("prompt is too long") || lower.includes("prompt too long") || lower.includes("exceeds model context window") || lower.includes("model token limit") || lower.includes("input exceeds") && lower.includes("maximum number of tokens") || hasRequestSizeExceeds && hasContextWindow || lower.includes("context overflow:") || lower.includes("exceed context limit") || lower.includes("exceeds the model's maximum context") || lower.includes("max_tokens") && lower.includes("exceed") && lower.includes("context") || lower.includes("input length") && lower.includes("exceed") && lower.includes("context") || lower.includes("413") && lower.includes("too large") || lower.includes("context_window_exceeded") || raw.includes("上下文过长") || raw.includes("上下文超出") || raw.includes("上下文长度超") || raw.includes("超出最大上下文") || raw.includes("请压缩上下文");
}
function shouldRewriteContextOverflowText(raw) {
	if (hasRateLimitTpmHint(raw) || isReasoningConstraintErrorMessage(raw)) return false;
	if (!looksLikeGenericContextOverflowError(raw)) return false;
	return isRawApiErrorPayload(raw) || isLikelyHttpErrorText(raw) || ERROR_PREFIX_RE.test(raw) || CONTEXT_OVERFLOW_ERROR_HEAD_RE.test(raw);
}
function getApiErrorPayloadFingerprint(raw) {
	if (!raw) return null;
	const payload = require_assistant_error_format.parseApiErrorPayload(raw);
	if (!payload) return null;
	return require_stable_stringify.stableStringify(payload);
}
function isRawApiErrorPayload(raw) {
	return getApiErrorPayloadFingerprint(raw) !== null;
}
function isLikelyProviderErrorType(type) {
	const normalized = require_string_coerce.normalizeOptionalLowercaseString(type);
	if (!normalized) return false;
	return normalized.endsWith("_error");
}
function shouldRewriteRawPayloadWithoutErrorContext(raw) {
	if (raw.length > NON_ERROR_PROVIDER_PAYLOAD_MAX_LENGTH) return false;
	if (!NON_ERROR_PROVIDER_PAYLOAD_PREFIX_RE.test(raw)) return false;
	const info = require_assistant_error_format.parseApiErrorInfo(raw);
	if (!info) return false;
	if (isLikelyProviderErrorType(info.type)) return true;
	if (info.httpCode) {
		const parsedCode = Number(info.httpCode);
		if (Number.isFinite(parsedCode) && parsedCode >= 400) return true;
	}
	return false;
}
function stripFinalTagsFromText(text) {
	const normalized = coerceChatContentText(text);
	if (!normalized) return normalized;
	return stripFinalTags(normalized);
}
function stripToolCallsOmittedPlaceholderLines(text) {
	let result = "";
	let start = 0;
	while (start < text.length) {
		const newlineIndex = text.indexOf("\n", start);
		const end = newlineIndex === -1 ? text.length : newlineIndex + 1;
		const chunk = text.slice(start, end);
		const line = chunk.endsWith("\n") ? chunk.slice(0, -1).replace(/\r$/, "") : chunk;
		if (!TOOL_CALLS_OMITTED_PLACEHOLDER_LINE_RE.test(line)) result += chunk;
		start = end;
	}
	return result;
}
function collapseConsecutiveDuplicateBlocks(text) {
	const trimmed = text.trim();
	if (!trimmed) return text;
	const blocks = trimmed.split(/\n{2,}/);
	if (blocks.length < 2) return text;
	const normalizeBlock = (value) => value.trim().replace(/\s+/g, " ");
	const result = [];
	let lastNormalized = null;
	for (const block of blocks) {
		const normalized = normalizeBlock(block);
		if (lastNormalized && normalized === lastNormalized) continue;
		result.push(block.trim());
		lastNormalized = normalized;
	}
	if (result.length === blocks.length) return text;
	return result.join("\n\n");
}
function isLikelyHttpErrorText(raw) {
	if (require_assistant_error_format.isCloudflareOrHtmlErrorPage(raw)) return true;
	const status = require_assistant_error_format.extractLeadingHttpStatus(raw);
	if (!status) return false;
	if (status.code < 400) return false;
	const message = require_string_coerce.normalizeLowercaseStringOrEmpty(status.rest);
	return HTTP_ERROR_HINTS.some((hint) => message.includes(hint));
}
function sanitizeUserFacingText(text, opts) {
	const raw = coerceChatContentText(text);
	if (!raw) return raw;
	const errorContext = opts?.errorContext ?? false;
	const withoutPlaceholder = stripToolCallsOmittedPlaceholderLines(stripToolCallXmlTags(stripMinimaxToolCallXml(require_strip_inbound_meta.stripInboundMetadata(require_internal_runtime_context.stripInternalRuntimeContext(stripFinalTagsFromText(raw)))), { stripFunctionCallsXmlPayloads: true }));
	const withoutToolCallBlocks = require_src.stripPlainTextToolCallBlocks(stripLegacyBracketToolCallBlocks(errorContext ? stripAssistantInternalTraceLines(withoutPlaceholder) : withoutPlaceholder));
	const trimmed = withoutToolCallBlocks.trim();
	if (!trimmed) return "";
	if (!errorContext && shouldRewriteRawPayloadWithoutErrorContext(trimmed)) return require_assistant_error_format.formatRawAssistantErrorForUi(trimmed);
	if (errorContext) {
		const execDeniedMessage = formatExecDeniedUserMessage(trimmed);
		if (execDeniedMessage) return execDeniedMessage;
		const diskSpaceCopy = formatDiskSpaceErrorCopy(trimmed);
		if (diskSpaceCopy) return diskSpaceCopy;
		if (/incorrect role information|roles must alternate/i.test(trimmed)) return "Message ordering conflict - please try again. If this persists, use /new to start a fresh session.";
		if (shouldRewriteContextOverflowText(trimmed)) return "Context overflow: prompt too large for the model. Try /reset (or /new) to start a fresh session, or use a larger-context model.";
		if (isBillingErrorMessage(trimmed)) return BILLING_ERROR_USER_MESSAGE;
		if (require_assistant_error_format.isGenericProviderInternalError(trimmed)) return require_assistant_error_format.formatRawAssistantErrorForUi(trimmed);
		if (isInvalidStreamingEventOrderError(trimmed)) return "LLM request failed: provider returned an invalid streaming response. Please try again.";
		if (isRawApiErrorPayload(trimmed) || isLikelyHttpErrorText(trimmed)) return require_assistant_error_format.formatRawAssistantErrorForUi(trimmed);
		if (isStreamingJsonParseError(trimmed)) return "LLM streaming response contained a malformed fragment. Please try again.";
		if (ERROR_PREFIX_RE.test(trimmed)) {
			const prefixedCopy = formatRateLimitOrOverloadedErrorCopy(trimmed);
			if (prefixedCopy) return prefixedCopy;
			const transportCopy = formatTransportErrorCopy(trimmed);
			if (transportCopy) return transportCopy;
			if (isTimeoutErrorMessage(trimmed)) return "LLM request timed out.";
			return require_assistant_error_format.formatRawAssistantErrorForUi(trimmed);
		}
	}
	return collapseConsecutiveDuplicateBlocks(withoutToolCallBlocks.replace(/^(?:[ \t]*\r?\n)+/, ""));
}
//#endregion
Object.defineProperty(exports, "BILLING_ERROR_USER_MESSAGE", {
	enumerable: true,
	get: function() {
		return BILLING_ERROR_USER_MESSAGE;
	}
});
Object.defineProperty(exports, "coerceChatContentText", {
	enumerable: true,
	get: function() {
		return coerceChatContentText;
	}
});
Object.defineProperty(exports, "extractTextFromChatContent", {
	enumerable: true,
	get: function() {
		return extractTextFromChatContent;
	}
});
Object.defineProperty(exports, "findFinalTagMatches", {
	enumerable: true,
	get: function() {
		return findFinalTagMatches;
	}
});
Object.defineProperty(exports, "formatBillingErrorMessage", {
	enumerable: true,
	get: function() {
		return formatBillingErrorMessage;
	}
});
Object.defineProperty(exports, "formatDiskSpaceErrorCopy", {
	enumerable: true,
	get: function() {
		return formatDiskSpaceErrorCopy;
	}
});
Object.defineProperty(exports, "formatExecDeniedUserMessage", {
	enumerable: true,
	get: function() {
		return formatExecDeniedUserMessage;
	}
});
Object.defineProperty(exports, "formatRateLimitOrOverloadedErrorCopy", {
	enumerable: true,
	get: function() {
		return formatRateLimitOrOverloadedErrorCopy;
	}
});
Object.defineProperty(exports, "formatTransportErrorCopy", {
	enumerable: true,
	get: function() {
		return formatTransportErrorCopy;
	}
});
Object.defineProperty(exports, "getApiErrorPayloadFingerprint", {
	enumerable: true,
	get: function() {
		return getApiErrorPayloadFingerprint;
	}
});
Object.defineProperty(exports, "hasOrphanReasoningCloseBoundary", {
	enumerable: true,
	get: function() {
		return hasOrphanReasoningCloseBoundary;
	}
});
Object.defineProperty(exports, "isAuthErrorMessage", {
	enumerable: true,
	get: function() {
		return isAuthErrorMessage;
	}
});
Object.defineProperty(exports, "isAuthPermanentErrorMessage", {
	enumerable: true,
	get: function() {
		return isAuthPermanentErrorMessage;
	}
});
Object.defineProperty(exports, "isBillingErrorMessage", {
	enumerable: true,
	get: function() {
		return isBillingErrorMessage;
	}
});
Object.defineProperty(exports, "isExecDeniedResultText", {
	enumerable: true,
	get: function() {
		return isExecDeniedResultText;
	}
});
Object.defineProperty(exports, "isInvalidStreamingEventOrderError", {
	enumerable: true,
	get: function() {
		return isInvalidStreamingEventOrderError;
	}
});
Object.defineProperty(exports, "isLikelyHttpErrorText", {
	enumerable: true,
	get: function() {
		return isLikelyHttpErrorText;
	}
});
Object.defineProperty(exports, "isOverloadedErrorMessage", {
	enumerable: true,
	get: function() {
		return isOverloadedErrorMessage;
	}
});
Object.defineProperty(exports, "isPeriodicUsageLimitErrorMessage", {
	enumerable: true,
	get: function() {
		return isPeriodicUsageLimitErrorMessage;
	}
});
Object.defineProperty(exports, "isRateLimitErrorMessage", {
	enumerable: true,
	get: function() {
		return isRateLimitErrorMessage;
	}
});
Object.defineProperty(exports, "isRawApiErrorPayload", {
	enumerable: true,
	get: function() {
		return isRawApiErrorPayload;
	}
});
Object.defineProperty(exports, "isServerErrorMessage", {
	enumerable: true,
	get: function() {
		return isServerErrorMessage;
	}
});
Object.defineProperty(exports, "isStreamingJsonParseError", {
	enumerable: true,
	get: function() {
		return isStreamingJsonParseError;
	}
});
Object.defineProperty(exports, "isTimeoutErrorMessage", {
	enumerable: true,
	get: function() {
		return isTimeoutErrorMessage;
	}
});
Object.defineProperty(exports, "matchesFormatErrorPattern", {
	enumerable: true,
	get: function() {
		return matchesFormatErrorPattern;
	}
});
Object.defineProperty(exports, "parseExecApprovalResultText", {
	enumerable: true,
	get: function() {
		return parseExecApprovalResultText;
	}
});
Object.defineProperty(exports, "sanitizeAssistantFinalAnswerText", {
	enumerable: true,
	get: function() {
		return sanitizeAssistantFinalAnswerText;
	}
});
Object.defineProperty(exports, "sanitizeAssistantVisibleText", {
	enumerable: true,
	get: function() {
		return sanitizeAssistantVisibleText;
	}
});
Object.defineProperty(exports, "sanitizeAssistantVisibleTextWithProfile", {
	enumerable: true,
	get: function() {
		return sanitizeAssistantVisibleTextWithProfile;
	}
});
Object.defineProperty(exports, "sanitizeUserFacingText", {
	enumerable: true,
	get: function() {
		return sanitizeUserFacingText;
	}
});
Object.defineProperty(exports, "stripDowngradedToolCallText", {
	enumerable: true,
	get: function() {
		return stripDowngradedToolCallText;
	}
});
Object.defineProperty(exports, "stripLegacyBracketToolCallBlocks", {
	enumerable: true,
	get: function() {
		return stripLegacyBracketToolCallBlocks;
	}
});
Object.defineProperty(exports, "stripReasoningTagsFromText", {
	enumerable: true,
	get: function() {
		return stripReasoningTagsFromText;
	}
});
