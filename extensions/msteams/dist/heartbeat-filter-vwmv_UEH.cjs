const require_strip_inbound_meta = require("./strip-inbound-meta-CE5-_osk.cjs");
require("./heartbeat-tool-response-DOTdTtHI.cjs");
const require_heartbeat = require("./heartbeat-B6M3DHWg.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/heartbeat-filter.ts
const HEARTBEAT_TASK_PROMPT_PREFIX = "Run the following periodic tasks (only those due based on their intervals):";
const HEARTBEAT_TASK_PROMPT_ACK = "After completing all due tasks, reply HEARTBEAT_OK.";
const TOOL_CALL_BLOCK_TYPES = /* @__PURE__ */ new Set([
	"toolCall",
	"functionCall",
	"toolUse",
	"tool_call",
	"function_call",
	"tool_use"
]);
const TOOL_RESULT_BLOCK_TYPES = /* @__PURE__ */ new Set([
	"toolResult",
	"tool_result",
	"tool_result_error",
	"function_call_output"
]);
function readNestedString(record, key) {
	const value = record[key];
	const direct = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (direct) return direct;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.name);
}
function collectToolCallBlocks(content) {
	if (!Array.isArray(content)) return [];
	return content.filter((block) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(block) && TOOL_CALL_BLOCK_TYPES.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.type) ?? ""));
}
function collectToolResultBlocks(content) {
	if (!Array.isArray(content)) return [];
	return content.filter((block) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(block) && TOOL_RESULT_BLOCK_TYPES.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.type) ?? ""));
}
function readToolCallName(block) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.name) ?? readNestedString(block, "function");
}
function collectToolCallIds(block) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([
		(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.call_id),
		(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.tool_call_id),
		(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.toolCallId),
		(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.tool_use_id),
		(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.toolUseId),
		(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.id)
	].filter((id) => Boolean(id)));
}
function readNestedToolCallArguments(record) {
	const value = record.function;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	return value.arguments ?? value.args ?? value.input;
}
function readToolCallArguments(block) {
	return block.arguments ?? block.args ?? block.input ?? readNestedToolCallArguments(block);
}
function parseToolCallArguments(value) {
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return value;
	if (typeof value !== "string" || !value.trim()) return;
	try {
		const parsed = JSON.parse(value);
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function isVisibleHeartbeatResponseToolCall(block) {
	const args = parseToolCallArguments(readToolCallArguments(block));
	if (!args) return false;
	return args.notify === true || args.notify === "true";
}
function collectVisibleHeartbeatResponseToolCalls(message) {
	if (message.role !== "assistant") return [];
	return [...collectMessageToolCalls(message), ...collectToolCallBlocks(message.content)].filter((block) => readToolCallName(block) === "heartbeat_respond" && isVisibleHeartbeatResponseToolCall(block));
}
function collectMessageToolCalls(message) {
	const toolCalls = message.tool_calls;
	if (!Array.isArray(toolCalls)) return [];
	return toolCalls.filter((call) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(call));
}
function hasAssistantToolCall(message) {
	return message.role === "assistant" && (collectMessageToolCalls(message).length > 0 || collectToolCallBlocks(message.content).length > 0);
}
function isRemovableHeartbeatResponseToolCall(message) {
	if (message.role !== "assistant") return false;
	for (const call of collectMessageToolCalls(message)) if (readToolCallName(call) === "heartbeat_respond" && !isVisibleHeartbeatResponseToolCall(call)) return true;
	return collectToolCallBlocks(message.content).some((block) => readToolCallName(block) === "heartbeat_respond" && !isVisibleHeartbeatResponseToolCall(block));
}
function hasVisibleHeartbeatResponseToolCall(message) {
	return collectVisibleHeartbeatResponseToolCalls(message).length > 0;
}
function isEmbeddedToolResultOnlyContent(content) {
	return Array.isArray(content) && content.length > 0 && content.every((block) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(block) && TOOL_RESULT_BLOCK_TYPES.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(block.type) ?? ""));
}
function isToolResultMessage(message) {
	return message.role === "toolResult" || message.role === "tool" || message.role === "user" && isEmbeddedToolResultOnlyContent(message.content);
}
function isFailedToolResultRecord(record) {
	return record.isError === true || record.is_error === true || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.type) === "tool_result_error";
}
function hasSuccessfulToolResultMessage(message) {
	const resultBlocks = collectToolResultBlocks(message.content);
	if (resultBlocks.length > 0) return resultBlocks.some((block) => !isFailedToolResultRecord(block));
	if (!isToolResultMessage(message)) return false;
	return !isFailedToolResultRecord(message);
}
function collectSuccessfulToolResultCallIds(message) {
	const record = message;
	const resultBlocks = collectToolResultBlocks(message.content);
	const ids = [];
	if (resultBlocks.length === 0) {
		if (!isFailedToolResultRecord(record)) ids.push(...[
			(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.toolCallId),
			(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.tool_call_id),
			(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.toolUseId),
			(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.tool_use_id),
			(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.call_id),
			(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record.id)
		].filter((id) => Boolean(id)));
	} else for (const block of resultBlocks) {
		if (isFailedToolResultRecord(block)) continue;
		ids.push(...collectToolCallIds(block));
	}
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(ids);
}
function isRealNonHeartbeatUserMessage(message, heartbeatPrompt) {
	return message.role === "user" && !isEmbeddedToolResultOnlyContent(message.content) && !isHeartbeatUserMessage(message, heartbeatPrompt);
}
function matchesHeartbeatPromptText(text, prompt) {
	const normalized = prompt?.trim();
	return Boolean(normalized) && (text === normalized || text.startsWith(`${normalized}\n`));
}
function resolveMessageText(content) {
	if (typeof content === "string") return {
		text: content,
		hasNonTextContent: false
	};
	if (!Array.isArray(content)) return {
		text: "",
		hasNonTextContent: content != null
	};
	let hasNonTextContent = false;
	let text = "";
	for (const block of content) {
		if (typeof block !== "object" || block === null || !("type" in block)) {
			hasNonTextContent = true;
			continue;
		}
		if (block.type !== "text" && block.type !== "input_text" && block.type !== "output_text") {
			hasNonTextContent = true;
			continue;
		}
		const blockText = block.text;
		if (typeof blockText !== "string") {
			hasNonTextContent = true;
			continue;
		}
		text += blockText;
	}
	return {
		text,
		hasNonTextContent
	};
}
/** Return whether a user message is an internal heartbeat prompt. */
function isHeartbeatUserMessage(message, heartbeatPrompt) {
	if (message.role !== "user") return false;
	const { text } = resolveMessageText(message.content);
	const trimmed = text.trim();
	if (!trimmed) return false;
	const normalizedHeartbeatPrompt = heartbeatPrompt?.trim();
	if (trimmed === "[Operator heartbeat poll]") return true;
	if (require_strip_inbound_meta.MESSAGE_TOOL_DELIVERY_HINTS.some((prefix) => trimmed.startsWith(prefix)) && trimmed.endsWith("[Operator heartbeat poll]")) return true;
	if (matchesHeartbeatPromptText(trimmed, normalizedHeartbeatPrompt)) return true;
	if (matchesHeartbeatPromptText(trimmed, require_heartbeat.HEARTBEAT_RESPONSE_TOOL_PROMPT)) return true;
	if (normalizedHeartbeatPrompt && matchesHeartbeatPromptText(trimmed, require_heartbeat.resolveHeartbeatPromptForResponseTool(normalizedHeartbeatPrompt))) return true;
	return trimmed.startsWith(HEARTBEAT_TASK_PROMPT_PREFIX) && trimmed.includes(HEARTBEAT_TASK_PROMPT_ACK);
}
/** Return whether an assistant message is only a heartbeat acknowledgement. */
function isHeartbeatOkResponse(message, ackMaxChars) {
	if (message.role !== "assistant") return false;
	if (hasAssistantToolCall(message)) return false;
	const { text, hasNonTextContent } = resolveMessageText(message.content);
	if (hasNonTextContent) return false;
	return require_heartbeat.stripHeartbeatToken(text, {
		mode: "heartbeat",
		maxAckChars: ackMaxChars
	}).shouldSkip;
}
function advancePastAdjacentToolResults(messages, startIndex) {
	let index = startIndex;
	while (index < messages.length) {
		const message = messages.at(index);
		if (!message || !isToolResultMessage(message)) break;
		index++;
	}
	return index;
}
function isToolResultCompletionCandidate(message) {
	return isToolResultMessage(message) || collectToolResultBlocks(message.content).length > 0;
}
function hasCompletedVisibleHeartbeatResponseToolCall(messages, index) {
	const message = messages.at(index);
	if (!message) return false;
	const visibleCalls = collectVisibleHeartbeatResponseToolCalls(message);
	if (visibleCalls.length === 0) return false;
	const callIds = new Set(visibleCalls.flatMap((call) => collectToolCallIds(call)));
	for (const result of messages.slice(index + 1)) {
		if (!isToolResultCompletionCandidate(result)) break;
		if (!hasSuccessfulToolResultMessage(result)) continue;
		if (callIds.size === 0) return true;
		for (const resultId of collectSuccessfulToolResultCallIds(result)) if (callIds.has(resultId)) return true;
	}
	return false;
}
function resolveHeartbeatArtifactSpanEnd(messages, startIndex, ackMaxChars, heartbeatPrompt) {
	let index = startIndex + 1;
	let sawTerminalHeartbeatArtifact = false;
	let sawNonTerminalAssistantOutput = false;
	while (index < messages.length) {
		const message = messages.at(index);
		if (!message) break;
		if (isRealNonHeartbeatUserMessage(message, heartbeatPrompt)) break;
		if (isHeartbeatUserMessage(message, heartbeatPrompt)) break;
		if (isHeartbeatOkResponse(message, ackMaxChars)) {
			sawTerminalHeartbeatArtifact = true;
			index = advancePastAdjacentToolResults(messages, index + 1);
			continue;
		}
		if (hasVisibleHeartbeatResponseToolCall(message)) {
			if (hasCompletedVisibleHeartbeatResponseToolCall(messages, index)) return;
			index++;
			continue;
		}
		if (isRemovableHeartbeatResponseToolCall(message)) {
			sawTerminalHeartbeatArtifact = true;
			index = advancePastAdjacentToolResults(messages, index + 1);
			continue;
		}
		if (sawTerminalHeartbeatArtifact) {
			index++;
			continue;
		}
		if (isToolResultMessage(message) || hasAssistantToolCall(message)) {
			index++;
			continue;
		}
		if (message.role === "assistant") {
			sawNonTerminalAssistantOutput = true;
			index++;
			continue;
		}
		return;
	}
	if (sawNonTerminalAssistantOutput && !sawTerminalHeartbeatArtifact) return;
	return index;
}
/** Remove heartbeat-only prompt, ack, and silent tool artifacts from a transcript. */
function filterHeartbeatTranscriptArtifacts(messages, ackMaxChars, heartbeatPrompt) {
	if (messages.length === 0) return messages;
	const result = [];
	let i = 0;
	while (i < messages.length) {
		if (!isHeartbeatUserMessage((0, _gabrielvfonseca_normalization_core.expectDefined)(messages[i], "messages entry at i"), heartbeatPrompt)) {
			result.push((0, _gabrielvfonseca_normalization_core.expectDefined)(messages[i], "messages entry at i"));
			i++;
			continue;
		}
		const next = resolveHeartbeatArtifactSpanEnd(messages, i, ackMaxChars, heartbeatPrompt);
		if (next === void 0) {
			result.push((0, _gabrielvfonseca_normalization_core.expectDefined)(messages[i], "messages entry at i"));
			i++;
			continue;
		}
		i = next;
	}
	return result;
}
//#endregion
Object.defineProperty(exports, "filterHeartbeatTranscriptArtifacts", {
	enumerable: true,
	get: function() {
		return filterHeartbeatTranscriptArtifacts;
	}
});
Object.defineProperty(exports, "isHeartbeatOkResponse", {
	enumerable: true,
	get: function() {
		return isHeartbeatOkResponse;
	}
});
Object.defineProperty(exports, "isHeartbeatUserMessage", {
	enumerable: true,
	get: function() {
		return isHeartbeatUserMessage;
	}
});
Object.defineProperty(exports, "isRealNonHeartbeatUserMessage", {
	enumerable: true,
	get: function() {
		return isRealNonHeartbeatUserMessage;
	}
});
