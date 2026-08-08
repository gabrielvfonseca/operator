const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_chunk = require("./chunk-qjERm7HU.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_reply_payload = require("./reply-payload-B-1jXr3E.cjs");
const require_directive_tags = require("./directive-tags-8jEdunuA.cjs");
const require_payloads = require("./payloads-MFaWqn01.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
const require_embedded_agent_helpers = require("./embedded-agent-helpers-DJEcJifp.cjs");
const require_assistant_error_format = require("./assistant-error-format-fNZkoCjs.cjs");
const require_sanitize_user_facing_text = require("./sanitize-user-facing-text-B2i4WcAm.cjs");
const require_errors = require("./errors-DsTBGN_q.cjs");
const require_chat_message_content = require("./chat-message-content-B4NfuhB-.cjs");
const require_embedded_agent_utils = require("./embedded-agent-utils-OVBmZgZz.cjs");
const require_heartbeat_tool_response = require("./heartbeat-tool-response-DOTdTtHI.cjs");
const require_delivery_evidence = require("./delivery-evidence-C3rOjggE.cjs");
const require_tool_error_summary = require("./tool-error-summary-CYMfFUz7.cjs");
const require_agent_end_side_effects = require("./agent-end-side-effects-DFCQjPJ-.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/embedded-agent-runner/run/source-reply-payloads.ts
/** Builds transcript mirrors and completion evidence for message-tool source replies. */
function buildSourceReplyPayloadState(params) {
	const sourceReplyPayloads = params.payloads ?? [];
	const replyItems = sourceReplyPayloads.flatMap((payload, index) => {
		const text = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.text) ?? "";
		const media = Array.from(/* @__PURE__ */ new Set([...payload.mediaUrl ? [payload.mediaUrl] : [], ...payload.mediaUrls ?? []])).filter((value) => value.trim().length > 0);
		if (!text && media.length === 0 && !payload.presentation && !payload.interactive && !payload.channelData) return [];
		return [{
			text,
			...payload.mediaUrl ? { mediaUrl: payload.mediaUrl } : {},
			...media.length ? { media } : {},
			...payload.audioAsVoice ? { audioAsVoice: true } : {},
			...payload.presentation ? { presentation: payload.presentation } : {},
			...payload.interactive ? { interactive: payload.interactive } : {},
			...payload.channelData ? { channelData: payload.channelData } : {},
			sourceReplyMirror: { idempotencyKey: payload.idempotencyKey ?? (params.runId ? `${params.runId}:internal-source-reply:${index}` : void 0) }
		}];
	});
	const hasSourceReplyPayload = replyItems.length > 0;
	const deliveredSourceReplyViaMessageTool = params.sourceReplyDeliveryMode === "message_tool_only" && params.didDeliverSourceReplyViaMessageTool === true;
	const explicitFinalSourceReply = require_delivery_evidence.resolveExplicitFinalSourceReplyDeliveryEvidence({
		messagingToolSentTargets: params.sentTargets,
		messagingToolSourceReplyPayloads: sourceReplyPayloads
	});
	return {
		replyItems,
		hasSourceReplyPayload,
		deliveredSourceReplyViaMessageTool,
		explicitFinalSourceReply,
		completedSourceReplyViaMessageTool: explicitFinalSourceReply ?? (hasSourceReplyPayload || deliveredSourceReplyViaMessageTool)
	};
}
//#endregion
//#region src/agents/embedded-agent-runner/run/tool-failure-acknowledgement.ts
const MUTATING_FAILURE_ACTION_PATTERN = "(?:write|edit|update|save|create|delete|remove|modify|change|apply|patch|move|rename|send|reply|message|run|execute|execution|command|script|shell|bash|exec|tool|action|operation)";
const MUTATING_FAILURE_INABILITY_PATTERN = new RegExp(`\\b(?:couldn't|could not|can't|cannot|unable to|am unable to|wasn't able to|was not able to|were unable to)\\b.{0,100}\\b${MUTATING_FAILURE_ACTION_PATTERN}\\b`, "u");
const MUTATING_FAILURE_ACTION_THEN_FAILURE_PATTERN = new RegExp(`\\b${MUTATING_FAILURE_ACTION_PATTERN}\\b.{0,100}\\b(?:failed|failure|errored)\\b`, "u");
const MUTATING_FAILURE_FAILURE_THEN_ACTION_PATTERN = new RegExp(`\\b(?:failed|failure)\\b.{0,100}\\b${MUTATING_FAILURE_ACTION_PATTERN}\\b`, "u");
const MUTATING_FAILURE_ERROR_WHILE_ACTION_PATTERN = new RegExp(`\\b(?:hit|encountered|ran into)\\b.{0,60}\\berror\\b.{0,100}\\b(?:while|trying to|when)\\b.{0,100}\\b${MUTATING_FAILURE_ACTION_PATTERN}\\b`, "u");
const DID_NOT_FAIL_PATTERN = /\b(?:did not|didn't)\s+fail\b/u;
const NEGATED_FAILURE_PATTERN = /\b(?:no|not|without)\s+(?:failures?|errors?)\b/u;
/** Detect a user-visible acknowledgement that a mutating action did not complete. */
function hasExplicitMutatingToolFailureAcknowledgement(text) {
	const normalizedText = require_embedded_agent_helpers.normalizeTextForComparison(text);
	if (!normalizedText || DID_NOT_FAIL_PATTERN.test(normalizedText)) return false;
	if (MUTATING_FAILURE_INABILITY_PATTERN.test(normalizedText)) return true;
	if (NEGATED_FAILURE_PATTERN.test(normalizedText)) return false;
	return MUTATING_FAILURE_ACTION_THEN_FAILURE_PATTERN.test(normalizedText) || MUTATING_FAILURE_FAILURE_THEN_ACTION_PATTERN.test(normalizedText) || MUTATING_FAILURE_ERROR_WHILE_ACTION_PATTERN.test(normalizedText);
}
//#endregion
//#region src/agents/embedded-agent-runner/run/payloads.ts
/**
* Builds embedded-agent payload objects from attempt inputs and outcomes.
*/
const RECOVERABLE_TOOL_ERROR_KEYWORDS = [
	"required",
	"missing",
	"invalid",
	"must be",
	"must have",
	"needs",
	"requires"
];
function isRecoverableToolError(error) {
	const errorLower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(error) ?? "";
	return RECOVERABLE_TOOL_ERROR_KEYWORDS.some((keyword) => errorLower.includes(keyword));
}
function isVerboseToolDetailEnabled(level) {
	return level === "full";
}
function isAssistantTextContentBlockType(value) {
	return value === "text" || value === "input_text" || value === "output_text";
}
function resolveRawAssistantAnswerText(lastAssistant) {
	if (!lastAssistant) return "";
	const finalAnswerText = require_chat_message_content.extractAssistantTextForPhase(lastAssistant, {
		phase: "final_answer",
		sanitizeText: require_sanitize_user_facing_text.sanitizeAssistantFinalAnswerText
	});
	if (finalAnswerText) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(finalAnswerText) ?? "";
	if (Array.isArray(lastAssistant.content)) {
		if (!lastAssistant.content.some((block) => {
			if (!block || typeof block !== "object") return false;
			const record = block;
			return isAssistantTextContentBlockType(record.type) && Boolean(require_chat_message_content.parseAssistantTextSignature(record.textSignature)?.phase);
		})) {
			const signedUnphasedParts = lastAssistant.content.map((block) => {
				if (!block || typeof block !== "object") return null;
				const record = block;
				const signature = require_chat_message_content.parseAssistantTextSignature(record.textSignature);
				if (!isAssistantTextContentBlockType(record.type) || typeof record.text !== "string" || !signature?.id || signature.phase) return null;
				const text = require_sanitize_user_facing_text.sanitizeAssistantFinalAnswerText(record.text);
				return text.trim() ? text : null;
			}).filter((value) => typeof value === "string");
			if (signedUnphasedParts.length) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(signedUnphasedParts.join("\n")) ?? "";
		}
	}
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_chat_message_content.extractAssistantTextForPhase(lastAssistant, { sanitizeText: require_sanitize_user_facing_text.sanitizeAssistantVisibleText })) ?? "";
}
function normalizeReplyTextForComparison(text) {
	return require_embedded_agent_helpers.normalizeTextForComparison(require_payloads.parseReplyDirectives(text).text ?? "");
}
function shouldIncludeToolErrorDetails(params) {
	if (isVerboseToolDetailEnabled(params.verboseLevel)) return true;
	if (!require_tool_error_summary.isExecLikeToolName(params.lastToolError.toolName)) return false;
	if (params.isHeartbeatTrigger === true) return true;
	return params.lastToolError.timedOut === true && (params.isCronTrigger === true || require_session_key.isCronSessionKey(params.sessionKey));
}
function shouldMarkNonTerminalToolErrorWarning(lastToolError) {
	return lastToolError.middlewareError === true;
}
function formatToolErrorWarningText(params) {
	if (require_tool_error_summary.isExecLikeToolName(params.lastToolError.toolName)) {
		const toolLabel = require_chunk.formatToolAggregate(params.lastToolError.toolName, void 0, { markdown: params.useMarkdown });
		const subject = formatExecLikeFailureSubject(params.lastToolError.meta, params.useMarkdown);
		const conciseExitSuffix = params.includeDetails ? "" : formatConciseExecExitSuffix(params.lastToolError.error);
		const errorSuffix = params.includeDetails && params.lastToolError.error ? `: ${params.lastToolError.error}` : "";
		return subject ? `⚠️ ${toolLabel} failed: ${subject}${conciseExitSuffix}${errorSuffix}` : `⚠️ ${toolLabel} failed${conciseExitSuffix}${errorSuffix}`;
	}
	return `⚠️ ${require_chunk.formatToolAggregate(params.lastToolError.toolName, params.lastToolError.meta ? [params.lastToolError.meta] : void 0, { markdown: params.useMarkdown })} failed${params.includeDetails && params.lastToolError.error ? `: ${params.lastToolError.error}` : ""}`;
}
function formatExecLikeFailureSubject(meta, markdown) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(meta);
	if (!normalized) return "";
	const { flags, body } = splitExecLikeFailureMeta(normalized);
	if (!body) return flags.join(" · ");
	const { text, suffix } = splitDisplayContextSuffix(body);
	const subject = `${maybeWrapInlineCode(extractLiteralExecCommand(text) ?? text, markdown)}${suffix}`;
	return flags.length > 0 ? `${flags.join(" · ")} · ${subject}` : subject;
}
function splitExecLikeFailureMeta(meta) {
	const flags = [];
	const bodyParts = [];
	for (const part of meta.split(" · ").map((candidate) => candidate.trim()).filter(Boolean)) {
		if (part === "elevated" || part === "pty") {
			flags.push(part);
			continue;
		}
		bodyParts.push(part);
	}
	return {
		flags,
		body: bodyParts.join(" · ")
	};
}
const SEMANTIC_RUN_SUMMARIES = /* @__PURE__ */ new Set([
	"tests",
	"build",
	"lint",
	"script",
	"command"
]);
const LITERAL_RUN_SUMMARY_PREFIXES = /* @__PURE__ */ new Set([
	"python",
	"python3",
	"ruby",
	"php",
	"git",
	"npm",
	"pnpm",
	"yarn",
	"bun",
	"@gabrielvfonseca/operator",
	"make",
	"cargo",
	"go",
	"docker",
	"npx",
	"uv",
	"poetry",
	"pytest",
	"vitest",
	"jest",
	"deno"
]);
function extractLiteralExecCommand(body) {
	const rawCommand = extractRawExecCommand(body);
	if (rawCommand) return rawCommand;
	const nodeScript = body.match(/^run node script (.+)$/u);
	if (nodeScript?.[1]) return `node ${nodeScript[1]}`;
	const runSubject = body.match(/^run (.+)$/u)?.[1];
	if (runSubject && isKnownLiteralRunSummary(runSubject)) return runSubject;
}
function extractRawExecCommand(body) {
	const codeSpan = extractTrailingMarkdownCodeSpan(body);
	if (!codeSpan) return;
	const context = extractRawExecContext(codeSpan.prefix, codeSpan.value);
	const command = context.trailing.reduce((value, suffix) => `${value} ${suffix}`, codeSpan.value);
	return context.leading.length > 0 ? `${context.leading.join(" · ")} · ${command}` : command;
}
function extractTrailingMarkdownCodeSpan(body) {
	const trimmed = body.trimEnd();
	if (!trimmed.endsWith("`")) return;
	let delimiterLength = 0;
	for (let index = trimmed.length - 1; index >= 0 && trimmed[index] === "`"; index -= 1) delimiterLength += 1;
	const delimiter = "`".repeat(delimiterLength);
	const valueEnd = trimmed.length - delimiterLength;
	let searchIndex = 0;
	while (searchIndex < valueEnd) {
		const openIndex = trimmed.indexOf(delimiter, searchIndex);
		if (openIndex < 0 || openIndex >= valueEnd) return;
		const prefixMatch = trimmed.slice(0, openIndex).match(/^(?:(.*)(?:,\s*| · ))?$/u);
		if (prefixMatch) return {
			prefix: prefixMatch[1],
			value: unwrapMarkdownInlineCodePadding(trimmed.slice(openIndex + delimiterLength, valueEnd))
		};
		searchIndex = openIndex + delimiterLength;
	}
}
function unwrapMarkdownInlineCodePadding(value) {
	if (value.length < 2 || !value.startsWith(" ") || !value.endsWith(" ")) return value;
	const unwrapped = value.slice(1, -1);
	return /\S/u.test(unwrapped) ? unwrapped : value;
}
function extractRawExecContext(prefix, inlineCode) {
	const value = prefix ?? "";
	return {
		leading: [...value.matchAll(/(?:^|,\s*| · )(node:\s*[^,·]+)(?=,\s*| · |$)/gu)].map((match) => match[1]?.trim()).filter((part) => Boolean(part)),
		trailing: [...value.matchAll(/(\((?:agent|repo|sandbox|workspace)\)|\(in [^)\r\n]+\))(?=\s*(?:,\s*| · |$))/gu)].filter((match) => shouldKeepRawExecTrailingContext(value, match, inlineCode)).map((match) => match[1]?.trim()).filter((part) => Boolean(part))
	};
}
function shouldKeepRawExecTrailingContext(prefix, match, inlineCode) {
	const suffix = match[1]?.trim();
	if (!suffix || inlineCode.includes(suffix)) return false;
	const segment = prefix.slice(0, match.index ?? 0).trimEnd().split(/,\s*| · /u).at(-1)?.trim();
	if ((segment ? extractLiteralExecCommand(segment) : void 0) === inlineCode || segment === inlineCode) return true;
	if (isCompactCwdSuffix(suffix)) return true;
	return isPathLikeCwdSuffix(suffix);
}
function isCompactCwdSuffix(suffix) {
	return /^\((?:agent|repo|workspace)\)$/u.test(suffix);
}
function isPathLikeCwdSuffix(suffix) {
	const cwd = suffix.match(/^\(in ([^)\r\n]+)\)$/u)?.[1]?.trim();
	return Boolean(cwd && (/^(?:\/|~|\.{1,2}(?:\/|$)|[A-Za-z]:[\\/]|\\\\)/u.test(cwd) || cwd.includes("/")));
}
function isKnownLiteralRunSummary(subject) {
	if (SEMANTIC_RUN_SUMMARIES.has(subject) || subject.includes("→") || subject.includes("->") || /^(?:node|python3?|ruby|php) inline script(?: \(heredoc\))?$/u.test(subject)) return false;
	const match = subject.match(/^(\S+)\s+(.+)$/u);
	const command = match?.[1];
	const remainder = match?.[2];
	if (!command || !remainder || remainder === "command") return false;
	return LITERAL_RUN_SUMMARY_PREFIXES.has(command);
}
function splitDisplayContextSuffix(value) {
	const match = /^(.*?)( \((?:agent|repo|workspace|sandbox)\))$/u.exec(value);
	if (!match) return {
		text: value,
		suffix: ""
	};
	return {
		text: match[1] ?? value,
		suffix: match[2] ?? ""
	};
}
function formatConciseExecExitSuffix(error) {
	const code = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(error)?.match(/\b(?:command\s+)?(?:failed\s+with\s+exit\s+code|exited\s+with\s+code|exit(?:ed)?\s+code|exit\s+status)\s+(-?\d+)\b/iu)?.[1];
	return code ? ` (exit ${code})` : "";
}
function maybeWrapInlineCode(value, markdown) {
	if (!markdown) return value;
	const delimiter = "`".repeat(longestBacktickRun(value) + 1);
	const padding = value.startsWith("`") || value.endsWith("`") || value.includes("\n") ? " " : "";
	return `${delimiter}${padding}${value}${padding}${delimiter}`;
}
function longestBacktickRun(value) {
	let longest = 0;
	let current = 0;
	for (const char of value) {
		if (char === "`") {
			current += 1;
			longest = Math.max(longest, current);
			continue;
		}
		current = 0;
	}
	return longest;
}
/**
* Chooses whether a tool failure needs a separate user-visible warning and
* whether to include raw details. Mutating failures are stricter because a
* silent failed write/send/delete can make the assistant look successful.
*/
function resolveToolErrorWarningPolicy(params) {
	const normalizedToolName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.lastToolError.toolName) ?? "";
	let toolErrorWarningOverride;
	let dynamicToolErrorWarningsDisabled = false;
	if (typeof params.suppressToolErrorWarnings === "function") {
		toolErrorWarningOverride = params.suppressToolErrorWarnings();
		dynamicToolErrorWarningsDisabled = toolErrorWarningOverride === false;
	} else toolErrorWarningOverride = params.suppressToolErrorWarnings;
	const includeDetails = shouldIncludeToolErrorDetails({
		...params,
		verboseLevel: dynamicToolErrorWarningsDisabled ? "off" : params.verboseLevel
	});
	if (toolErrorWarningOverride === true) return {
		showWarning: false,
		includeDetails
	};
	if (normalizedToolName === "sessions_send") return {
		showWarning: false,
		includeDetails
	};
	if (params.suppressToolErrors) return {
		showWarning: false,
		includeDetails
	};
	if (require_tool_error_summary.isExecLikeToolName(params.lastToolError.toolName)) return {
		showWarning: !params.hasUserFacingReply,
		includeDetails
	};
	if (params.lastToolError.mutatingAction ?? require_agent_end_side_effects.isLikelyMutatingToolName(params.lastToolError.toolName)) return {
		showWarning: !params.hasUserFacingErrorReply && !params.hasUserFacingFailureAcknowledgement,
		includeDetails
	};
	return {
		showWarning: !params.hasUserFacingReply && !isRecoverableToolError(params.lastToolError.error),
		includeDetails
	};
}
/**
* Converts a completed embedded attempt into reply payloads for channels. This
* is the boundary that suppresses duplicate source replies, filters raw API
* errors, preserves directive metadata, and decides when tool failures must be
* surfaced to the user.
*/
function buildEmbeddedRunPayloads(params) {
	const heartbeatTerminalToolFailure = params.isHeartbeatTrigger === true && params.lastToolError && params.lastToolError.mutatingAction === true ? { toolName: params.lastToolError.toolName } : void 0;
	if (params.heartbeatToolResponse && !heartbeatTerminalToolFailure) return [require_heartbeat_tool_response.createHeartbeatToolResponsePayload(params.heartbeatToolResponse)];
	const { replyItems, hasSourceReplyPayload, deliveredSourceReplyViaMessageTool, explicitFinalSourceReply, completedSourceReplyViaMessageTool } = buildSourceReplyPayloadState({
		payloads: params.messagingToolSourceReplyPayloads,
		sentTargets: params.messagingToolSentTargets,
		sourceReplyDeliveryMode: params.sourceReplyDeliveryMode,
		didDeliverSourceReplyViaMessageTool: params.didDeliverSourceReplyViaMessageTool,
		runId: params.runId
	});
	if (params.heartbeatToolResponse) {
		const heartbeatPayload = require_heartbeat_tool_response.createHeartbeatToolResponsePayload(params.heartbeatToolResponse);
		replyItems.push({
			text: heartbeatPayload.text ?? "",
			...heartbeatPayload.channelData ? { channelData: heartbeatPayload.channelData } : {}
		});
	}
	const useMarkdown = params.toolResultFormat === "markdown";
	const suppressAssistantArtifacts = params.heartbeatToolResponse !== void 0 || params.didSendDeterministicApprovalPrompt === true || params.sourceReplyDeliveryMode === "message_tool_only" && hasSourceReplyPayload || deliveredSourceReplyViaMessageTool;
	const suppressFailureArtifacts = params.didSendDeterministicApprovalPrompt === true || params.sourceReplyDeliveryMode === "message_tool_only" && completedSourceReplyViaMessageTool;
	const nonEmptyAssistantTexts = params.assistantTexts.map((text) => require_embedded_agent_utils.sanitizeAssistantVisibleStreamText(text)).filter((text) => text.trim().length > 0);
	const assistantForPayload = params.currentAssistant ?? void 0 ?? (nonEmptyAssistantTexts.length === 1 ? void 0 : params.lastAssistant);
	const lastAssistantStopReason = assistantForPayload?.stopReason;
	const lastAssistantErrored = lastAssistantStopReason === "error";
	const lastAssistantAborted = lastAssistantStopReason === "aborted";
	const runAborted = params.runAborted === true || lastAssistantAborted;
	const lastAssistantNeedsErrorSurface = lastAssistantErrored || lastAssistantAborted;
	const rawErrorMessage = lastAssistantNeedsErrorSurface ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(assistantForPayload?.errorMessage) : void 0;
	const errorText = assistantForPayload && lastAssistantNeedsErrorSurface ? suppressFailureArtifacts ? void 0 : lastAssistantErrored || rawErrorMessage ? require_errors.formatUserFacingAssistantErrorText(assistantForPayload, {
		cfg: params.config,
		sessionKey: params.sessionKey,
		provider: params.provider,
		model: params.model,
		authMode: params.authMode
	}) : require_errors.formatAssistantErrorText(assistantForPayload, {
		cfg: params.config,
		sessionKey: params.sessionKey,
		provider: params.provider,
		model: params.model,
		authMode: params.authMode
	}) : void 0;
	const rawErrorFingerprint = rawErrorMessage ? require_sanitize_user_facing_text.getApiErrorPayloadFingerprint(rawErrorMessage) : null;
	const formattedRawErrorMessage = rawErrorMessage ? require_assistant_error_format.formatRawAssistantErrorForUi(rawErrorMessage) : null;
	const normalizedFormattedRawErrorMessage = formattedRawErrorMessage ? require_embedded_agent_helpers.normalizeTextForComparison(formattedRawErrorMessage) : null;
	const normalizedRawErrorText = rawErrorMessage ? require_embedded_agent_helpers.normalizeTextForComparison(rawErrorMessage) : null;
	const normalizedErrorText = errorText ? require_embedded_agent_helpers.normalizeTextForComparison(errorText) : null;
	const normalizedGenericBillingErrorText = require_embedded_agent_helpers.normalizeTextForComparison(require_sanitize_user_facing_text.BILLING_ERROR_USER_MESSAGE);
	const genericErrorText = "The AI service returned an error. Please try again.";
	if (errorText) replyItems.push({
		text: errorText,
		isError: true
	});
	if (params.inlineToolResultsAllowed && params.verboseLevel !== "off" && params.toolMetas.length > 0) for (const { toolName, meta } of params.toolMetas) {
		const parsedAggregate = require_directive_tags.parseInlineDirectives(require_chunk.formatToolAggregate(toolName, meta ? [meta] : [], { markdown: useMarkdown }), {
			stripAudioTag: true,
			stripReplyTags: true
		});
		const cleanedText = parsedAggregate.text;
		if (cleanedText) replyItems.push({
			text: cleanedText,
			audioAsVoice: parsedAggregate.audioAsVoice,
			replyToId: parsedAggregate.replyToId,
			replyToTag: parsedAggregate.hasReplyTag,
			replyToCurrent: parsedAggregate.replyToCurrent
		});
	}
	const reasoningText = suppressAssistantArtifacts || runAborted ? "" : assistantForPayload && params.reasoningLevel === "on" && params.thinkingLevel !== "off" ? require_embedded_agent_utils.extractAssistantThinking(assistantForPayload) : "";
	if (reasoningText) replyItems.push({
		text: reasoningText,
		isReasoning: true
	});
	const fallbackAnswerText = assistantForPayload ? require_embedded_agent_utils.extractAssistantVisibleText(assistantForPayload) : "";
	const fallbackRawAnswerText = resolveRawAssistantAnswerText(assistantForPayload);
	const shouldSuppressRawErrorText = (text) => {
		if (!lastAssistantNeedsErrorSurface) return false;
		const trimmed = text.trim();
		if (!trimmed) return false;
		if (errorText) {
			const normalized = require_embedded_agent_helpers.normalizeTextForComparison(trimmed);
			if (normalized && normalizedErrorText && normalized === normalizedErrorText) return true;
			if (trimmed === genericErrorText) return true;
			if (normalized && normalizedGenericBillingErrorText && normalized === normalizedGenericBillingErrorText) return true;
		}
		if (rawErrorMessage && trimmed === rawErrorMessage) return true;
		if (formattedRawErrorMessage && trimmed === formattedRawErrorMessage) return true;
		if (normalizedRawErrorText) {
			const normalized = require_embedded_agent_helpers.normalizeTextForComparison(trimmed);
			if (normalized && normalized === normalizedRawErrorText) return true;
		}
		if (normalizedFormattedRawErrorMessage) {
			const normalized = require_embedded_agent_helpers.normalizeTextForComparison(trimmed);
			if (normalized && normalized === normalizedFormattedRawErrorMessage) return true;
		}
		if (rawErrorFingerprint) {
			const fingerprint = require_sanitize_user_facing_text.getApiErrorPayloadFingerprint(trimmed);
			if (fingerprint && fingerprint === rawErrorFingerprint) return true;
		}
		return require_sanitize_user_facing_text.isRawApiErrorPayload(trimmed);
	};
	const rawAnswerDirectiveState = fallbackRawAnswerText ? require_payloads.parseReplyDirectives(fallbackRawAnswerText) : null;
	const rawAnswerHasMedia = (rawAnswerDirectiveState?.mediaUrls?.length ?? 0) > 0 || rawAnswerDirectiveState?.audioAsVoice;
	const assistantTextsHaveMedia = params.assistantTexts.some((text) => {
		const parsed = require_payloads.parseReplyDirectives(text);
		return (parsed.mediaUrls?.length ?? 0) > 0 || parsed.audioAsVoice;
	});
	const normalizedAssistantTexts = require_embedded_agent_helpers.normalizeTextForComparison(nonEmptyAssistantTexts.join("\n\n"));
	const normalizedRawAnswerText = require_embedded_agent_helpers.normalizeTextForComparison(rawAnswerDirectiveState?.text ?? "");
	const shouldPreferRawAnswerText = rawAnswerHasMedia && (!nonEmptyAssistantTexts.length || !assistantTextsHaveMedia && normalizedAssistantTexts.length > 0 && normalizedAssistantTexts === normalizedRawAnswerText);
	const fallbackAnswerSourceText = shouldPreferRawAnswerText && fallbackRawAnswerText ? fallbackRawAnswerText : fallbackAnswerText;
	const normalizedFallbackAnswerSourceText = fallbackAnswerSourceText ? normalizeReplyTextForComparison(fallbackAnswerSourceText) : "";
	const shouldUseCanonicalFinalAnswer = !lastAssistantNeedsErrorSurface && fallbackAnswerSourceText.length > 0 && normalizedFallbackAnswerSourceText.length > 0;
	const hasAssistantTextPayload = nonEmptyAssistantTexts.length > 0;
	const answerTexts = suppressAssistantArtifacts || runAborted ? [] : (shouldUseCanonicalFinalAnswer ? [fallbackAnswerSourceText] : shouldPreferRawAnswerText && fallbackRawAnswerText ? [fallbackRawAnswerText] : hasAssistantTextPayload ? nonEmptyAssistantTexts : fallbackAnswerText ? [fallbackAnswerText] : []).filter((text) => !shouldSuppressRawErrorText(text));
	let hasUserFacingAssistantReply = completedSourceReplyViaMessageTool || params.heartbeatToolResponse?.notify === true;
	const hasUserFacingErrorReply = replyItems.some((item) => item.isError === true);
	let hasUserFacingFailureAcknowledgement = params.heartbeatToolResponse?.notify === true && (params.heartbeatToolResponse.outcome === "blocked" || hasExplicitMutatingToolFailureAcknowledgement(require_heartbeat_tool_response.getHeartbeatToolNotificationText(params.heartbeatToolResponse)));
	for (const text of answerTexts) {
		const { text: cleanedText, mediaUrls, audioAsVoice, replyToId, replyToTag, replyToCurrent } = require_payloads.parseReplyDirectives(text);
		if (!cleanedText && (!mediaUrls || mediaUrls.length === 0) && !audioAsVoice) continue;
		replyItems.push({
			text: cleanedText,
			media: mediaUrls,
			audioAsVoice,
			replyToId,
			replyToTag,
			replyToCurrent
		});
		hasUserFacingAssistantReply = true;
		if (cleanedText && hasExplicitMutatingToolFailureAcknowledgement(cleanedText)) hasUserFacingFailureAcknowledgement = true;
	}
	if (params.lastToolError) {
		const warningPolicy = resolveToolErrorWarningPolicy({
			lastToolError: params.lastToolError,
			hasUserFacingReply: hasUserFacingAssistantReply,
			hasUserFacingErrorReply,
			hasUserFacingFailureAcknowledgement,
			suppressToolErrors: Boolean(params.config?.messages?.suppressToolErrors),
			suppressToolErrorWarnings: params.suppressToolErrorWarnings,
			isCronTrigger: params.isCronTrigger,
			isHeartbeatTrigger: params.isHeartbeatTrigger,
			sessionKey: params.sessionKey,
			verboseLevel: params.verboseLevel
		});
		if (warningPolicy.showWarning) {
			const warningText = formatToolErrorWarningText({
				lastToolError: params.lastToolError,
				includeDetails: warningPolicy.includeDetails,
				useMarkdown
			});
			const normalizedWarning = require_embedded_agent_helpers.normalizeTextForComparison(warningText);
			if (!(normalizedWarning ? replyItems.some((item) => {
				if (!item.text) return false;
				const normalizedExisting = require_embedded_agent_helpers.normalizeTextForComparison(item.text);
				return normalizedExisting.length > 0 && normalizedExisting === normalizedWarning;
			}) : false)) replyItems.push({
				text: warningText,
				isError: true,
				nonTerminalToolErrorWarning: hasUserFacingAssistantReply && shouldMarkNonTerminalToolErrorWarning(params.lastToolError)
			});
		}
	}
	if (heartbeatTerminalToolFailure && !replyItems.some((item) => item.isReasoning !== true)) replyItems.push({ text: require_tokens.HEARTBEAT_TOKEN });
	const hasAudioAsVoiceTag = replyItems.some((item) => item.audioAsVoice);
	return replyItems.map((item) => {
		const payload = { text: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(item.text) };
		const mediaUrl = item.mediaUrl ?? item.media?.[0];
		if (mediaUrl) payload.mediaUrl = mediaUrl;
		if (item.media?.length) payload.mediaUrls = item.media;
		if (item.isError !== void 0) payload.isError = item.isError;
		if (item.isReasoning === true) payload.isReasoning = true;
		if (item.isError === true && params.sourceReplyDeliveryMode === "message_tool_only" && explicitFinalSourceReply === false) require_reply_payload.markReplyPayloadForSourceSuppressionDelivery(payload);
		if (item.nonTerminalToolErrorWarning) require_reply_payload.setReplyPayloadMetadata(payload, { nonTerminalToolErrorWarning: true });
		if (heartbeatTerminalToolFailure) require_reply_payload.setReplyPayloadMetadata(payload, { heartbeatTerminalToolFailure });
		if (!item.isError && !item.isReasoning && (params.assistantMessageIndex !== void 0 || params.assistantTranscriptOwned === true)) require_reply_payload.setReplyPayloadMetadata(payload, {
			...params.assistantMessageIndex !== void 0 ? { assistantMessageIndex: params.assistantMessageIndex } : {},
			...params.assistantTranscriptOwned === true ? { assistantTranscriptOwned: true } : {}
		});
		if (item.replyToId) payload.replyToId = item.replyToId;
		if (item.replyToTag !== void 0) payload.replyToTag = item.replyToTag;
		if (item.replyToCurrent !== void 0) payload.replyToCurrent = item.replyToCurrent;
		if (item.audioAsVoice || hasAudioAsVoiceTag && item.media?.length) payload.audioAsVoice = true;
		if (item.presentation) payload.presentation = item.presentation;
		if (item.interactive) payload.interactive = item.interactive;
		if (item.channelData) payload.channelData = item.channelData;
		if (item.sourceReplyMirror) {
			require_reply_payload.markReplyPayloadForSourceSuppressionDelivery(payload);
			if (params.sessionKey) {
				const sourceReplyTranscriptMirror = { sessionKey: params.sessionKey };
				if (params.agentId) sourceReplyTranscriptMirror.agentId = params.agentId;
				if (payload.text) sourceReplyTranscriptMirror.text = payload.text;
				if (payload.mediaUrls?.length) sourceReplyTranscriptMirror.mediaUrls = payload.mediaUrls;
				if (item.sourceReplyMirror.idempotencyKey) sourceReplyTranscriptMirror.idempotencyKey = item.sourceReplyMirror.idempotencyKey;
				require_reply_payload.setReplyPayloadMetadata(payload, { sourceReplyTranscriptMirror });
			}
		}
		if (payload.text && require_tokens.isSilentReplyPayloadText(payload.text, "NO_REPLY")) {
			const silentText = payload.text;
			payload.text = void 0;
			if (require_payload.hasReplyPayloadContent(payload)) return payload;
			payload.text = silentText;
		}
		return payload;
	}).filter((p) => {
		if (!require_payload.hasReplyPayloadContent(p)) return false;
		if (p.text && require_tokens.isSilentReplyPayloadText(p.text, "NO_REPLY")) return false;
		return true;
	});
}
//#endregion
Object.defineProperty(exports, "buildEmbeddedRunPayloads", {
	enumerable: true,
	get: function() {
		return buildEmbeddedRunPayloads;
	}
});
