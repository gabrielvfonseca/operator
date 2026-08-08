const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_tool_images = require("./tool-images-BzMy_EyQ.cjs");
const require_thinking = require("./thinking-BQb9GAe7.cjs");
const require_errors = require("./errors-DsTBGN_q.cjs");
const require_tool_call_id = require("./tool-call-id-Bp1wJF0F.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/shared/google-turn-ordering.ts
const GOOGLE_TURN_ORDER_BOOTSTRAP_TEXT = "(session bootstrap)";
/** Add a synthetic user bootstrap when Google-style providers receive assistant-first turns. */
function sanitizeGoogleAssistantFirstOrdering(messages) {
	const first = messages[0];
	const role = first?.role;
	const content = first?.content;
	if (role === "user" && typeof content === "string" && content.trim() === GOOGLE_TURN_ORDER_BOOTSTRAP_TEXT) return messages;
	if (role !== "assistant") return messages;
	return [{
		role: "user",
		content: GOOGLE_TURN_ORDER_BOOTSTRAP_TEXT,
		timestamp: Date.now()
	}, ...messages];
}
//#endregion
//#region src/agents/embedded-agent-helpers/bootstrap.ts
/**
* Builds and sanitizes bootstrap context inserted into embedded-agent sessions.
*/
function isBase64Signature(value) {
	const trimmed = value.trim();
	if (!trimmed) return false;
	const compact = trimmed.replace(/\s+/g, "");
	if (!/^[A-Za-z0-9+/=_-]+$/.test(compact)) return false;
	const isUrl = compact.includes("-") || compact.includes("_");
	try {
		const buf = Buffer.from(compact, isUrl ? "base64url" : "base64");
		if (buf.length === 0) return false;
		const encoded = buf.toString(isUrl ? "base64url" : "base64");
		const normalize = (input) => input.replace(/=+$/g, "");
		return normalize(encoded) === normalize(compact);
	} catch {
		return false;
	}
}
/**
* Strips Claude-style thought_signature fields from content blocks.
*
* Gemini expects thought signatures as base64-encoded bytes, but Claude stores message ids
* like "msg_abc123...". We only strip "msg_*" to preserve any provider-valid signatures.
*/
function stripThoughtSignatures(content, options) {
	if (!Array.isArray(content)) return content;
	const allowBase64Only = options?.allowBase64Only ?? false;
	const includeCamelCase = options?.includeCamelCase ?? false;
	const shouldStripSignature = (value) => {
		if (!allowBase64Only) return typeof value === "string" && value.startsWith("msg_");
		return typeof value !== "string" || !isBase64Signature(value);
	};
	return content.map((block) => {
		if (!block || typeof block !== "object") return block;
		const rec = block;
		const stripSnake = shouldStripSignature(rec.thought_signature);
		const stripCamel = includeCamelCase ? shouldStripSignature(rec.thoughtSignature) : false;
		if (!stripSnake && !stripCamel) return block;
		const next = { ...rec };
		if (stripSnake) delete next.thought_signature;
		if (stripCamel) delete next.thoughtSignature;
		return next;
	});
}
const DEFAULT_BOOTSTRAP_MAX_CHARS = 2e4;
const DEFAULT_BOOTSTRAP_TOTAL_MAX_CHARS = 6e4;
const DEFAULT_BOOTSTRAP_PROMPT_TRUNCATION_WARNING_MODE = "always";
const MIN_BOOTSTRAP_FILE_BUDGET_CHARS = 64;
const BOOTSTRAP_HEAD_RATIO = .75;
const BOOTSTRAP_TAIL_RATIO = .25;
const MIN_BOOTSTRAP_TRIMMED_CONTENT_CHARS = 16;
const AGENTS_BOOTSTRAP_FILENAME = "AGENTS.md";
const AGENTS_POLICY_DIGEST_RATIO = .35;
const AGENTS_POLICY_HEAD_RATIO = .45;
const AGENTS_POLICY_TAIL_RATIO = .15;
const AGENTS_POLICY_DIGEST_MAX_LINE_CHARS = 240;
function resolveBootstrapMaxChars(cfg, agentId) {
	const raw = cfg && agentId ? require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.bootstrapMaxChars ?? cfg.agents?.defaults?.bootstrapMaxChars : cfg?.agents?.defaults?.bootstrapMaxChars;
	if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
	return DEFAULT_BOOTSTRAP_MAX_CHARS;
}
function resolveBootstrapTotalMaxChars(cfg, agentId) {
	const raw = cfg && agentId ? require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.bootstrapTotalMaxChars ?? cfg.agents?.defaults?.bootstrapTotalMaxChars : cfg?.agents?.defaults?.bootstrapTotalMaxChars;
	if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
	return DEFAULT_BOOTSTRAP_TOTAL_MAX_CHARS;
}
function resolveBootstrapPromptTruncationWarningMode(cfg) {
	const raw = cfg?.agents?.defaults?.bootstrapPromptTruncationWarning;
	if (raw === "off" || raw === "once" || raw === "always") return raw;
	return DEFAULT_BOOTSTRAP_PROMPT_TRUNCATION_WARNING_MODE;
}
function isAgentsBootstrapFile(fileName) {
	return fileName?.toLowerCase() === AGENTS_BOOTSTRAP_FILENAME.toLowerCase();
}
function isPolicyDigestCandidate(line) {
	if (/^(?:#{1,6}|\s*[-*+]|\s*\d+[.)])\s+\S/u.test(line)) return true;
	return /\b(?:AGENTS\.md|scoped|required|must|never|do not|before subtree|read scoped|owner|security|secret|credential|test|validation|command|commit|push|github|pr)\b/iu.test(line);
}
function normalizePolicyDigestLine(line) {
	const normalized = line.trim().replace(/\s+/gu, " ");
	if (normalized.length <= AGENTS_POLICY_DIGEST_MAX_LINE_CHARS) return normalized;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, AGENTS_POLICY_DIGEST_MAX_LINE_CHARS - 1)}…`;
}
function buildAgentsPolicyDigest(content, budget) {
	if (budget <= 0) return {
		text: "",
		omittedLines: 0
	};
	const candidates = content.split(/\r?\n/u).map((line, index) => ({
		index,
		line: normalizePolicyDigestLine(line)
	})).filter(({ line }) => line.length > 0 && isPolicyDigestCandidate(line));
	const highPriorityPattern = /\b(?:AGENTS\.md|scoped|required|must|never|do not|before subtree|read scoped|security|secret|credential)\b/iu;
	const selected = /* @__PURE__ */ new Set();
	let used = 0;
	const trySelect = (candidate) => {
		const separatorChars = selected.size > 0 ? 1 : 0;
		if (used + separatorChars + candidate.line.length > budget) return;
		selected.add(candidate.index);
		used += separatorChars + candidate.line.length;
	};
	for (const candidate of candidates) if (highPriorityPattern.test(candidate.line)) trySelect(candidate);
	for (const candidate of candidates) if (!selected.has(candidate.index)) trySelect(candidate);
	const lines = candidates.filter((candidate) => selected.has(candidate.index)).toSorted((a, b) => a.index - b.index).map((candidate) => candidate.line);
	return {
		text: lines.join("\n"),
		omittedLines: Math.max(0, candidates.length - lines.length)
	};
}
function trimAgentsBootstrapContent(content, maxChars) {
	const trimmed = content.trimEnd();
	if (trimmed.length <= maxChars) return {
		content: trimmed,
		truncated: false,
		maxChars,
		originalLength: trimmed.length
	};
	let headChars = Math.floor(maxChars * AGENTS_POLICY_HEAD_RATIO);
	let tailChars = Math.floor(maxChars * AGENTS_POLICY_TAIL_RATIO);
	let digestBudget = Math.floor(maxChars * AGENTS_POLICY_DIGEST_RATIO);
	let digest = buildAgentsPolicyDigest(trimmed, digestBudget);
	const render = () => [
		(0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, 0, headChars),
		`[...truncated, read ${AGENTS_BOOTSTRAP_FILENAME} for full content...]`,
		digest.text ? "[Policy digest from AGENTS.md]" : "",
		digest.text,
		digest.omittedLines > 0 ? `[...${digest.omittedLines} more policy lines omitted...]` : "",
		`…(truncated ${AGENTS_BOOTSTRAP_FILENAME}: kept ${headChars}+policy ${digest.text.length}+${tailChars} chars of ${trimmed.length})…`,
		tailChars > 0 ? (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, -tailChars) : ""
	].filter((part) => part.length > 0).join("\n");
	let rendered = render();
	while (rendered.length > maxChars && (tailChars > 0 || headChars > 1 || digestBudget > 0)) {
		const overflow = rendered.length - maxChars;
		if (tailChars > 0) tailChars = Math.max(0, tailChars - overflow);
		else if (headChars > 1) headChars = Math.max(1, headChars - overflow);
		else {
			digestBudget = Math.max(0, digestBudget - overflow);
			digest = buildAgentsPolicyDigest(trimmed, digestBudget);
		}
		rendered = render();
	}
	return {
		content: rendered.length > maxChars ? (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(rendered, maxChars) : rendered,
		truncated: true,
		maxChars,
		originalLength: trimmed.length
	};
}
function trimBootstrapContent(content, fileName, maxChars) {
	const trimmed = content.trimEnd();
	if (trimmed.length <= maxChars) return {
		content: trimmed,
		truncated: false,
		maxChars,
		originalLength: trimmed.length
	};
	if (isAgentsBootstrapFile(fileName)) return trimAgentsBootstrapContent(content, maxChars);
	const markerTemplate = (headChars, tailChars) => [
		"",
		`[...truncated, read ${fileName} for full content...]`,
		`…(truncated ${fileName}: kept ${headChars}+${tailChars} chars of ${trimmed.length})…`,
		""
	].join("\n");
	const compactMarkerTemplate = (headChars, tailChars) => `[…truncated ${headChars}+${tailChars}/${trimmed.length}]`;
	const separatorCharsFor = (headCount, tailCount, markerContent) => markerContent.includes("\n") ? Number(headCount > 0) + Number(tailCount > 0) : 0;
	const renderTruncatedContent = (head, markerContent, tail) => [
		head,
		markerContent,
		tail
	].filter((part) => part.length > 0).join(markerContent.includes("\n") ? "\n" : "");
	const resolveMarkerTemplate = () => {
		const fullMarker = markerTemplate(0, 0);
		return maxChars - fullMarker.length - separatorCharsFor(1, 1, fullMarker) >= MIN_BOOTSTRAP_TRIMMED_CONTENT_CHARS ? markerTemplate : compactMarkerTemplate;
	};
	const resolvedMarkerTemplate = resolveMarkerTemplate();
	let headChars = 0;
	let tailChars = 0;
	let marker = resolvedMarkerTemplate(headChars, tailChars);
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const contentBudget = Math.max(0, maxChars - marker.length - separatorCharsFor(headChars, tailChars, marker));
		const nextHeadChars = Math.floor(contentBudget * BOOTSTRAP_HEAD_RATIO);
		const nextTailChars = Math.floor(contentBudget * BOOTSTRAP_TAIL_RATIO);
		const nextMarker = resolvedMarkerTemplate(nextHeadChars, nextTailChars);
		if (nextHeadChars === headChars && nextTailChars === tailChars && nextMarker.length === marker.length) break;
		headChars = nextHeadChars;
		tailChars = nextTailChars;
		marker = nextMarker;
	}
	let renderedLength = headChars + tailChars + marker.length + separatorCharsFor(headChars, tailChars, marker);
	while (renderedLength > maxChars && (tailChars > 0 || headChars > 0)) {
		const overflow = renderedLength - maxChars;
		if (tailChars > 0) tailChars = Math.max(0, tailChars - overflow);
		else headChars = Math.max(0, headChars - overflow);
		marker = resolvedMarkerTemplate(headChars, tailChars);
		renderedLength = headChars + tailChars + marker.length + separatorCharsFor(headChars, tailChars, marker);
	}
	if (headChars === 0 && tailChars === 0 && trimmed.length > 0) {
		const singleHeadMarker = resolvedMarkerTemplate(1, 0);
		if (1 + singleHeadMarker.length + separatorCharsFor(1, 0, singleHeadMarker) <= maxChars) {
			headChars = 1;
			marker = singleHeadMarker;
		}
	}
	const head = (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, 0, headChars);
	const tail = tailChars > 0 ? (0, _gabrielvfonseca_normalization_core_utf16_slice.sliceUtf16Safe)(trimmed, -tailChars) : "";
	const contentWithMarker = renderTruncatedContent(head, marker, tail);
	return {
		content: contentWithMarker.length > maxChars ? (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(contentWithMarker, maxChars) : contentWithMarker,
		truncated: true,
		maxChars,
		originalLength: trimmed.length
	};
}
function clampToBudget(content, budget) {
	if (budget <= 0) return "";
	if (content.length <= budget) return content;
	if (budget <= 3) return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(content, budget);
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(content, budget - 1)}…`;
}
async function ensureSessionHeader(params) {
	const file = params.sessionFile;
	try {
		await node_fs_promises.default.stat(file);
		return;
	} catch {}
	await node_fs_promises.default.mkdir(node_path.default.dirname(file), {
		recursive: true,
		mode: 448
	});
	const entry = {
		type: "session",
		version: 2,
		id: params.sessionId,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		cwd: params.cwd
	};
	await node_fs_promises.default.writeFile(file, `${JSON.stringify(entry)}\n`, {
		encoding: "utf-8",
		mode: 384
	});
}
function buildBootstrapContextFiles(files, opts) {
	const maxChars = opts?.maxChars ?? DEFAULT_BOOTSTRAP_MAX_CHARS;
	let remainingTotalChars = Math.max(1, Math.floor(opts?.totalMaxChars ?? Math.max(maxChars, DEFAULT_BOOTSTRAP_TOTAL_MAX_CHARS)));
	const result = [];
	for (const file of files) {
		if (remainingTotalChars <= 0) break;
		const pathValue = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(file.path) ?? "";
		if (!pathValue) {
			opts?.warn?.(`skipping bootstrap file "${file.name}" — missing or invalid "path" field (hook may have used "filePath" instead)`);
			continue;
		}
		if (file.missing) {
			const cappedMissingText = clampToBudget(`[MISSING] Expected at: ${pathValue}`, remainingTotalChars);
			if (!cappedMissingText) break;
			remainingTotalChars = Math.max(0, remainingTotalChars - cappedMissingText.length);
			result.push({
				path: pathValue,
				content: cappedMissingText
			});
			continue;
		}
		if (remainingTotalChars < MIN_BOOTSTRAP_FILE_BUDGET_CHARS) {
			opts?.warn?.(`remaining bootstrap budget is ${remainingTotalChars} chars (<${MIN_BOOTSTRAP_FILE_BUDGET_CHARS}); skipping additional bootstrap files`);
			break;
		}
		const fileMaxChars = Math.max(1, Math.min(maxChars, remainingTotalChars));
		const trimmed = trimBootstrapContent(file.content ?? "", file.name, fileMaxChars);
		const contentWithinBudget = clampToBudget(trimmed.content, remainingTotalChars);
		if (!contentWithinBudget) continue;
		if (trimmed.truncated || contentWithinBudget.length < trimmed.content.length) opts?.warn?.(`workspace bootstrap file ${file.name} is ${trimmed.originalLength} chars (limit ${trimmed.maxChars}); truncating in injected context`);
		remainingTotalChars = Math.max(0, remainingTotalChars - contentWithinBudget.length);
		result.push({
			path: pathValue,
			content: contentWithinBudget
		});
	}
	return result;
}
function sanitizeGoogleTurnOrdering(messages) {
	return sanitizeGoogleAssistantFirstOrdering(messages);
}
//#endregion
//#region src/agents/embedded-agent-helpers/google.ts
/**
* Google/Gemini-specific embedded-agent runtime helpers.
*/
/** Detects Google-owned embedded runtime APIs. */
function isGoogleModelApi(api) {
	return api === "google-gemini-cli" || api === "google-generative-ai";
}
//#endregion
//#region src/agents/embedded-agent-helpers/images.ts
const EMPTY_CONTENT_PLACEHOLDER = "[empty content omitted]";
function dropEmptyTextBlocks(content) {
	return content.filter((block) => {
		if (!block || typeof block !== "object") return true;
		const rec = block;
		if (rec.type !== "text" || typeof rec.text !== "string") return true;
		return rec.text.trim().length > 0;
	});
}
function ensureNonEmptyContent(content) {
	if (content.length > 0) return content;
	return [{
		type: "text",
		text: EMPTY_CONTENT_PLACEHOLDER
	}];
}
/** Resize/remove unsafe image payloads while keeping transcript turns valid. */
async function sanitizeSessionMessagesImages(messages, label, options) {
	const allowNonImageSanitization = (options?.sanitizeMode ?? "full") === "full";
	const imageSanitization = {
		maxDimensionPx: options?.maxDimensionPx,
		maxBytes: options?.maxBytes
	};
	const sanitizedIds = options?.sanitizeToolCallIds === true ? require_tool_call_id.sanitizeToolCallIdsForCloudCodeAssist(messages, options.toolCallIdMode, {
		preserveNativeAnthropicToolUseIds: options?.preserveNativeAnthropicToolUseIds,
		duplicateToolCallIdStyle: options?.duplicateToolCallIdStyle
	}) : messages;
	const out = [];
	for (const msg of sanitizedIds) {
		if (!msg || typeof msg !== "object") {
			out.push(msg);
			continue;
		}
		const role = msg.role;
		if (role === "toolResult") {
			const toolMsg = msg;
			const nextContent = await require_tool_images.sanitizeContentBlocksImages(Array.isArray(toolMsg.content) ? toolMsg.content : [], label, imageSanitization);
			out.push({
				...toolMsg,
				content: ensureNonEmptyContent(dropEmptyTextBlocks(nextContent))
			});
			continue;
		}
		if (role === "user") {
			const userMsg = msg;
			const content = userMsg.content;
			if (Array.isArray(content)) {
				const nextContent = await require_tool_images.sanitizeContentBlocksImages(content, label, imageSanitization);
				out.push({
					...userMsg,
					content: ensureNonEmptyContent(dropEmptyTextBlocks(nextContent))
				});
				continue;
			}
		}
		if (role === "assistant") {
			const assistantMsg = msg;
			if (assistantMsg.stopReason === "error") {
				const content = assistantMsg.content;
				if (Array.isArray(content)) {
					const finalContent = dropEmptyTextBlocks(await require_tool_images.sanitizeContentBlocksImages(content, label, imageSanitization));
					if (finalContent.length > 0) out.push({
						...assistantMsg,
						content: finalContent
					});
				} else out.push(assistantMsg);
				continue;
			}
			const content = assistantMsg.content;
			if (Array.isArray(content)) {
				const strippedContent = options?.preserveSignatures ? content : stripThoughtSignatures(content, options?.sanitizeThoughtSignatures);
				if (!allowNonImageSanitization) {
					const nextContent = await require_tool_images.sanitizeContentBlocksImages(dropEmptyTextBlocks(strippedContent), label, imageSanitization);
					if (nextContent.length > 0) out.push({
						...assistantMsg,
						content: nextContent
					});
					continue;
				}
				const finalContent = await require_tool_images.sanitizeContentBlocksImages(dropEmptyTextBlocks(strippedContent), label, imageSanitization);
				if (finalContent.length === 0) continue;
				out.push({
					...assistantMsg,
					content: finalContent
				});
				continue;
			}
		}
		out.push(msg);
	}
	return out;
}
//#endregion
//#region src/agents/embedded-agent-helpers/messaging-dedupe.ts
/**
* Normalizes outbound message text to suppress duplicate send actions.
*/
const MIN_DUPLICATE_TEXT_LENGTH = 10;
const MIN_REVERSE_SUBSTRING_DUPLICATE_RATIO = .5;
/**
* Normalize text for duplicate comparison.
* - Trims whitespace
* - Lowercases
* - Strips emoji (Emoji_Presentation and Extended_Pictographic)
* - Collapses multiple spaces to single space
*/
function normalizeTextForComparison(text) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(text).replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
}
/** Compare already-normalized message text against prior sends. */
function isMessagingToolDuplicateNormalized(normalized, normalizedSentTexts) {
	if (normalizedSentTexts.length === 0) return false;
	if (!normalized || normalized.length < MIN_DUPLICATE_TEXT_LENGTH) return false;
	return normalizedSentTexts.some((normalizedSent) => {
		if (!normalizedSent || normalizedSent.length < MIN_DUPLICATE_TEXT_LENGTH) return false;
		if (normalized.includes(normalizedSent)) return true;
		return normalizedSent.includes(normalized) && normalized.length >= normalizedSent.length * MIN_REVERSE_SUBSTRING_DUPLICATE_RATIO;
	});
}
/** Return true when raw message text duplicates a prior sent message. */
function isMessagingToolDuplicate(text, sentTexts) {
	if (sentTexts.length === 0) return false;
	const normalized = normalizeTextForComparison(text);
	if (!normalized || normalized.length < MIN_DUPLICATE_TEXT_LENGTH) return false;
	return isMessagingToolDuplicateNormalized(normalized, sentTexts.map(normalizeTextForComparison));
}
//#endregion
//#region src/agents/embedded-agent-helpers/thinking.ts
/**
* Resolves fallback thinking levels for providers that require reasoning.
*/
function extractSupportedValues(raw) {
	const match = raw.match(/supported values are:\s*([^\n.]+)/i) ?? raw.match(/supported values:\s*([^\n.]+)/i);
	if (!match?.[1]) return [];
	const fragment = match[1];
	const quoted = Array.from(fragment.matchAll(/['"]([^'"]+)['"]/g)).map((entry) => entry[1]?.trim());
	if (quoted.length > 0) return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(quoted.filter((entry) => Boolean(entry)));
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(fragment.split(/,|\band\b/gi).map((entry) => entry.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "")));
}
/** Pick a configured or provider-safe reasoning level for fallback attempts. */
function pickFallbackThinkingLevel(params) {
	const raw = params.message?.trim();
	if (!raw) return;
	if (require_errors.isReasoningConstraintErrorMessage(raw) && !params.attempted.has("minimal")) return "minimal";
	const supported = extractSupportedValues(raw);
	if (supported.length === 0) {
		if (/not supported/i.test(raw) && !params.attempted.has("off")) return "off";
		return;
	}
	for (const entry of supported) {
		const normalized = require_thinking.normalizeThinkLevel(entry);
		if (!normalized) continue;
		if (params.attempted.has(normalized)) continue;
		return normalized;
	}
}
//#endregion
//#region src/agents/embedded-agent-helpers/turns.ts
/**
* Normalizes embedded-agent conversation turn ordering for provider contracts.
*/
function isToolCallBlock(block) {
	return block.type === "toolUse" || block.type === "toolCall" || block.type === "functionCall";
}
function isAbortedAssistantTurn(message) {
	const stopReason = message.stopReason;
	return stopReason === "aborted" || stopReason === "error";
}
function extractToolResultMatchIds(record) {
	const ids = /* @__PURE__ */ new Set();
	for (const value of [
		record.toolUseId,
		record.toolCallId,
		record.tool_use_id,
		record.tool_call_id,
		record.callId,
		record.call_id
	]) {
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
		if (id) ids.add(id);
	}
	return ids;
}
function extractToolResultMatchName(record) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.toolName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.name) ?? null;
}
function collectAnyToolResultIds(message) {
	const ids = /* @__PURE__ */ new Set();
	const role = message.role;
	if (role === "toolResult") {
		const toolResultId = require_tool_call_id.extractToolResultId(message);
		if (toolResultId) ids.add(toolResultId);
	} else if (role === "tool") {
		const record = message;
		for (const id of extractToolResultMatchIds(record)) ids.add(id);
	}
	const content = message.content;
	if (!Array.isArray(content)) return ids;
	for (const block of content) {
		if (!block || typeof block !== "object") continue;
		const record = block;
		if (record.type !== "toolResult" && record.type !== "tool") continue;
		for (const id of extractToolResultMatchIds(record)) ids.add(id);
	}
	return ids;
}
function collectTrustedToolResultMatches(message) {
	const matches = /* @__PURE__ */ new Map();
	const role = message.role;
	const addMatch = (ids, toolName) => {
		for (const id of ids) {
			const bucket = matches.get(id) ?? /* @__PURE__ */ new Set();
			if (toolName) bucket.add(toolName);
			matches.set(id, bucket);
		}
	};
	if (role === "toolResult") {
		const record = message;
		addMatch([...extractToolResultMatchIds(record), ...(() => {
			const canonicalId = require_tool_call_id.extractToolResultId(message);
			return canonicalId ? [canonicalId] : [];
		})()], extractToolResultMatchName(record));
	} else if (role === "tool") {
		const record = message;
		addMatch(extractToolResultMatchIds(record), extractToolResultMatchName(record));
	}
	return matches;
}
function collectFutureToolResultMatches(messages, startIndex) {
	const matches = /* @__PURE__ */ new Map();
	for (let index = startIndex + 1; index < messages.length; index += 1) {
		const candidate = messages[index];
		if (!candidate || typeof candidate !== "object") continue;
		if (candidate.role === "assistant") break;
		for (const [id, toolNames] of collectTrustedToolResultMatches(candidate)) {
			const bucket = matches.get(id) ?? /* @__PURE__ */ new Set();
			for (const toolName of toolNames) bucket.add(toolName);
			matches.set(id, bucket);
		}
	}
	return matches;
}
function collectFutureToolResultIds(messages, startIndex) {
	const ids = /* @__PURE__ */ new Set();
	for (let index = startIndex + 1; index < messages.length; index += 1) {
		const candidate = messages[index];
		if (!candidate || typeof candidate !== "object") continue;
		if (candidate.role === "assistant") break;
		for (const id of collectAnyToolResultIds(candidate)) ids.add(id);
	}
	return ids;
}
/**
* Strips dangling tool-call blocks from assistant messages when no later
* tool-result span before the next assistant turn resolves them.
* This fixes the "tool_use ids found without tool_result blocks" error from Anthropic.
*/
function stripDanglingAnthropicToolUses(messages) {
	const result = [];
	for (const [i, msg] of messages.entries()) {
		if (!msg) continue;
		if (typeof msg !== "object") {
			result.push(msg);
			continue;
		}
		if (msg.role !== "assistant") {
			result.push(msg);
			continue;
		}
		const assistantMsg = msg;
		const originalContent = Array.isArray(assistantMsg.content) ? assistantMsg.content : [];
		if (originalContent.length === 0) {
			result.push(msg);
			continue;
		}
		if (require_tool_call_id.extractToolCallsFromAssistant(msg).length === 0) {
			result.push(msg);
			continue;
		}
		const hasThinking = originalContent.some((block) => require_tool_call_id.isThinkingLikeBlock(block));
		const validToolResultMatches = collectFutureToolResultMatches(messages, i);
		const validToolUseIds = collectFutureToolResultIds(messages, i);
		if (hasThinking) {
			if (originalContent.every((block) => {
				if (!block || !isToolCallBlock(block)) return true;
				const blockId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.id);
				const blockName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.name);
				if (!blockId || !blockName) return false;
				const matchingToolNames = validToolResultMatches.get(blockId);
				if (!matchingToolNames) return false;
				return matchingToolNames.size === 0 || matchingToolNames.has(blockName);
			})) result.push(msg);
			else result.push({
				...assistantMsg,
				content: isAbortedAssistantTurn(msg) ? [] : [{
					type: "text",
					text: "[tool calls omitted]"
				}]
			});
			continue;
		}
		const filteredContent = originalContent.filter((block) => {
			if (!block) return false;
			if (!isToolCallBlock(block)) return true;
			const blockId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.id);
			return blockId ? validToolUseIds.has(blockId) : false;
		});
		if (filteredContent.length === originalContent.length) {
			result.push(msg);
			continue;
		}
		if (originalContent.length > 0 && filteredContent.length === 0) result.push({
			...assistantMsg,
			content: isAbortedAssistantTurn(msg) ? [] : [{
				type: "text",
				text: "[tool calls omitted]"
			}]
		});
		else result.push({
			...assistantMsg,
			content: filteredContent
		});
	}
	return result;
}
function validateTurnsWithConsecutiveMerge(params) {
	const { messages, role, merge } = params;
	if (!Array.isArray(messages) || messages.length === 0) return messages;
	const result = [];
	let lastRole;
	for (const msg of messages) {
		if (!msg || typeof msg !== "object") {
			result.push(msg);
			continue;
		}
		const msgRole = msg.role;
		if (!msgRole) {
			result.push(msg);
			continue;
		}
		if (msgRole === lastRole && lastRole === role) {
			const lastMsg = result[result.length - 1];
			const currentMsg = msg;
			if (lastMsg && typeof lastMsg === "object") {
				const lastTyped = lastMsg;
				result[result.length - 1] = merge(lastTyped, currentMsg);
				continue;
			}
		}
		result.push(msg);
		lastRole = msgRole;
	}
	return result;
}
function mergeConsecutiveAssistantTurns(previous, current) {
	const mergedContent = [...Array.isArray(previous.content) ? previous.content : [], ...Array.isArray(current.content) ? current.content : []];
	return {
		...previous,
		content: mergedContent,
		...current.usage && { usage: current.usage },
		...current.stopReason && { stopReason: current.stopReason },
		...current.errorMessage && { errorMessage: current.errorMessage }
	};
}
/**
* Validates and fixes conversation turn sequences for Gemini API.
* Gemini requires strict alternating user→assistant→tool→user pattern.
* Merges consecutive assistant messages together.
*/
function validateGeminiTurns(messages) {
	return validateTurnsWithConsecutiveMerge({
		messages,
		role: "assistant",
		merge: mergeConsecutiveAssistantTurns
	});
}
/** Merge adjacent user turns into a single provider-compatible user message. */
function mergeConsecutiveUserTurns(previous, current) {
	const mergedContent = [...normalizeUserContentForMerge(previous.content), ...normalizeUserContentForMerge(current.content)];
	return {
		...current,
		content: mergedContent,
		timestamp: current.timestamp ?? previous.timestamp
	};
}
function normalizeUserContentForMerge(content) {
	if (Array.isArray(content)) return content;
	if (typeof content === "string") return [{
		type: "text",
		text: content
	}];
	return [];
}
/**
* Validates and fixes conversation turn sequences for Anthropic API.
* Anthropic requires strict alternating user→assistant pattern.
* Merges consecutive user messages together.
* Also strips dangling tool_use blocks that lack corresponding tool_result blocks.
*/
function validateAnthropicTurns(messages) {
	return validateTurnsWithConsecutiveMerge({
		messages: stripDanglingAnthropicToolUses(validateTurnsWithConsecutiveMerge({
			messages,
			role: "assistant",
			merge: mergeConsecutiveAssistantTurns
		})),
		role: "user",
		merge: mergeConsecutiveUserTurns
	});
}
//#endregion
//#region src/agents/embedded-agent-helpers.ts
var embedded_agent_helpers_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	GENERIC_ASSISTANT_ERROR_TEXT: () => require_errors.GENERIC_ASSISTANT_ERROR_TEXT,
	resolveBootstrapMaxChars: () => resolveBootstrapMaxChars,
	resolveBootstrapTotalMaxChars: () => resolveBootstrapTotalMaxChars
});
//#endregion
Object.defineProperty(exports, "buildBootstrapContextFiles", {
	enumerable: true,
	get: function() {
		return buildBootstrapContextFiles;
	}
});
Object.defineProperty(exports, "embedded_agent_helpers_exports", {
	enumerable: true,
	get: function() {
		return embedded_agent_helpers_exports;
	}
});
Object.defineProperty(exports, "ensureSessionHeader", {
	enumerable: true,
	get: function() {
		return ensureSessionHeader;
	}
});
Object.defineProperty(exports, "isGoogleModelApi", {
	enumerable: true,
	get: function() {
		return isGoogleModelApi;
	}
});
Object.defineProperty(exports, "isMessagingToolDuplicate", {
	enumerable: true,
	get: function() {
		return isMessagingToolDuplicate;
	}
});
Object.defineProperty(exports, "isMessagingToolDuplicateNormalized", {
	enumerable: true,
	get: function() {
		return isMessagingToolDuplicateNormalized;
	}
});
Object.defineProperty(exports, "normalizeTextForComparison", {
	enumerable: true,
	get: function() {
		return normalizeTextForComparison;
	}
});
Object.defineProperty(exports, "pickFallbackThinkingLevel", {
	enumerable: true,
	get: function() {
		return pickFallbackThinkingLevel;
	}
});
Object.defineProperty(exports, "resolveBootstrapMaxChars", {
	enumerable: true,
	get: function() {
		return resolveBootstrapMaxChars;
	}
});
Object.defineProperty(exports, "resolveBootstrapPromptTruncationWarningMode", {
	enumerable: true,
	get: function() {
		return resolveBootstrapPromptTruncationWarningMode;
	}
});
Object.defineProperty(exports, "resolveBootstrapTotalMaxChars", {
	enumerable: true,
	get: function() {
		return resolveBootstrapTotalMaxChars;
	}
});
Object.defineProperty(exports, "sanitizeGoogleTurnOrdering", {
	enumerable: true,
	get: function() {
		return sanitizeGoogleTurnOrdering;
	}
});
Object.defineProperty(exports, "sanitizeSessionMessagesImages", {
	enumerable: true,
	get: function() {
		return sanitizeSessionMessagesImages;
	}
});
Object.defineProperty(exports, "validateAnthropicTurns", {
	enumerable: true,
	get: function() {
		return validateAnthropicTurns;
	}
});
Object.defineProperty(exports, "validateGeminiTurns", {
	enumerable: true,
	get: function() {
		return validateGeminiTurns;
	}
});
