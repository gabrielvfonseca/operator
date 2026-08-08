const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_replace_file = require("./replace-file-D77oDPOz.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_sqlite_marker = require("./sqlite-marker-c45e72lc.cjs");
require("./http-body-BwUnoq2M.cjs");
const require_tool_call_id = require("./tool-call-id-Bp1wJF0F.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_transcript_tree = require("./transcript-tree-0YpOJFJQ.cjs");
const require_errors = require("./errors-8CSAqwWV.cjs");
const require_session_transcript_repair = require("./session-transcript-repair-vqlcO05-.cjs");
const require_config = require("./config-Bb4ey1E_.cjs");
const require_stream_message_shared = require("./stream-message-shared-DbVY20ZH.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
require("node:os");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let typebox_compile = require("typebox/compile");
let node_module = require("node:module");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_ai_internal_shared = require("@gabrielvfonseca/ai/internal/shared");
require("@gabrielvfonseca/normalization-core/error-coercion");
require("node:child_process");
let _gabrielvfonseca_ai_internal_runtime = require("@gabrielvfonseca/ai/internal/runtime");
let _gabrielvfonseca_normalization_core_result = require("@gabrielvfonseca/normalization-core/result");
let _gabrielvfonseca_media_core_inline_image_data_url = require("@gabrielvfonseca/media-core/inline-image-data-url");
require("node:readline");
require("@gabrielvfonseca/ai/event-stream");
let _gabrielvfonseca_ai_validation = require("@gabrielvfonseca/ai/validation");
let node_util_types = require("node:util/types");
let p_map = require("p-map");
p_map = require_rolldown_runtime.__toESM(p_map, 1);
//#region packages/llm-core/src/model-contracts/anthropic.ts
function normalizeClaudeModelId(modelId) {
	const normalized = modelId?.trim().toLowerCase() ?? "";
	return (normalized.startsWith("anthropic/") ? normalized.slice(10) : normalized).replace(/[._\s]+/g, "-");
}
/** Resolve the canonical normalized Claude model id for one runtime model ref. */
function resolveClaudeModelIdentity(ref) {
	const normalized = normalizeClaudeModelId((typeof ref.params?.canonicalModelId === "string" ? ref.params.canonicalModelId : void 0) ?? ref.id);
	const match = /(?:^|[-/])claude-/.exec(normalized);
	return match ? normalized.slice((match.index ?? 0) + (match[0].startsWith("claude-") ? 0 : 1)) : normalized;
}
/** Resolve Claude Fable 5 through direct ids, cloud ids, or deployment metadata. */
function resolveClaudeFable5ModelIdentity(ref) {
	const normalized = resolveClaudeModelIdentity(ref);
	const match = /(?:^|-)claude-fable-5(?=$|[^a-z0-9])/.exec(normalized);
	if (!match) return;
	return normalized.slice((match.index ?? 0) + (match[0].startsWith("-") ? 1 : 0));
}
/** Resolve Claude Sonnet 5 through direct ids, cloud ids, or deployment metadata. */
function resolveClaudeSonnet5ModelIdentity(ref) {
	const normalized = resolveClaudeModelIdentity(ref);
	const match = /(?:^|-)claude-sonnet-5(?=$|[^a-z0-9])/.exec(normalized);
	if (!match) return;
	return normalized.slice((match.index ?? 0) + (match[0].startsWith("-") ? 1 : 0));
}
//#endregion
//#region packages/llm-core/src/utils/event-stream.ts
/** Generic async-iterable event stream with a separately awaited final result. */
var EventStream = class {
	constructor(isComplete, extractResult) {
		this.queue = [];
		this.waiting = [];
		this.done = false;
		this.isComplete = isComplete;
		this.extractResult = extractResult;
		const resolvers = [];
		this.finalResultPromise = new Promise((resolve) => {
			resolvers.push(resolve);
		});
		const resolveFinalResult = resolvers.at(0);
		if (!resolveFinalResult) throw new Error("event stream result promise did not initialize its resolver");
		this.resolveFinalResult = resolveFinalResult;
	}
	push(event) {
		if (this.done) return;
		if (this.isComplete(event)) {
			this.done = true;
			this.resolveFinalResult(this.extractResult(event));
		}
		const waiter = this.waiting.shift();
		if (waiter) waiter({
			value: event,
			done: false
		});
		else this.queue.push(event);
	}
	end(result) {
		this.done = true;
		if (result !== void 0) this.resolveFinalResult(result);
		while (this.waiting.length > 0) {
			const waiter = this.waiting.shift();
			if (!waiter) break;
			waiter({
				value: void 0,
				done: true
			});
		}
	}
	async *[Symbol.asyncIterator]() {
		while (true) if (this.queue.length > 0) for (const event of this.queue.splice(0, 1)) yield event;
		else if (this.done) return;
		else {
			const result = await new Promise((resolve) => {
				this.waiting.push(resolve);
			});
			if (result.done) return;
			yield result.value;
		}
	}
	result() {
		return this.finalResultPromise;
	}
};
/** Assistant-message event stream that resolves on done/error terminal events. */
var AssistantMessageEventStream = class extends EventStream {
	constructor() {
		super((event) => event.type === "done" || event.type === "error", (event) => {
			if (event.type === "done") return event.message;
			else if (event.type === "error") return event.error;
			throw new Error("Unexpected event type for final result");
		});
	}
};
/** Creates an assistant-message stream for provider and plugin adapters. */
function createAssistantMessageEventStream() {
	return new AssistantMessageEventStream();
}
//#endregion
//#region packages/llm-core/src/validation.ts
const validatorCache = /* @__PURE__ */ new WeakMap();
/** Maximum string length accepted for schema-gated JSON coercion. */
const MAX_JSON_COERCE_LENGTH = 64 * 1024;
function isRecord(value) {
	return typeof value === "object" && value !== null;
}
function isJsonSchemaObject(value) {
	return isRecord(value);
}
function getSchemaTypes(schema) {
	if (typeof schema.type === "string") return [schema.type];
	if (Array.isArray(schema.type)) return schema.type.filter((type) => typeof type === "string");
	return [];
}
function matchesJsonType(value, type) {
	switch (type) {
		case "number": return typeof value === "number";
		case "integer": return typeof value === "number" && Number.isInteger(value);
		case "boolean": return typeof value === "boolean";
		case "string": return typeof value === "string";
		case "null": return value === null;
		case "array": return Array.isArray(value);
		case "object": return isRecord(value) && !Array.isArray(value);
		default: return false;
	}
}
function isValidatorSchema(value) {
	return isRecord(value);
}
const JSON_NUMBER_TOKEN_RE = /^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/iu;
function parseJsonNumberString(value) {
	const trimmed = value.trim();
	if (!trimmed || !JSON_NUMBER_TOKEN_RE.test(trimmed)) return;
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : void 0;
}
function parseJsonIntegerString(value) {
	const parsed = parseJsonNumberString(value);
	return parsed !== void 0 && Number.isSafeInteger(parsed) ? parsed : void 0;
}
function getSubSchemaValidator(schema) {
	if (!isValidatorSchema(schema)) return;
	try {
		return getValidator(schema);
	} catch {
		return;
	}
}
function coercePrimitiveByType(value, type) {
	switch (type) {
		case "number":
			if (value === null) return 0;
			if (typeof value === "string" && value.trim() !== "") {
				const parsed = parseJsonNumberString(value);
				if (parsed !== void 0) return parsed;
			}
			if (typeof value === "boolean") return value ? 1 : 0;
			return value;
		case "integer":
			if (value === null) return 0;
			if (typeof value === "string" && value.trim() !== "") {
				const parsed = parseJsonIntegerString(value);
				if (parsed !== void 0) return parsed;
			}
			if (typeof value === "boolean") return value ? 1 : 0;
			return value;
		case "boolean":
			if (value === null) return false;
			if (typeof value === "string") {
				if (value === "true") return true;
				if (value === "false") return false;
			}
			if (typeof value === "number") {
				if (value === 1) return true;
				if (value === 0) return false;
			}
			return value;
		case "string":
			if (value === null) return "";
			if (typeof value === "number" || typeof value === "boolean") return String(value);
			return value;
		case "array":
			if (typeof value === "string" && value.trim() !== "" && value.length <= MAX_JSON_COERCE_LENGTH) try {
				const parsed = JSON.parse(value);
				if (Array.isArray(parsed)) return parsed;
			} catch {}
			return value;
		case "object":
			if (typeof value === "string" && value.trim() !== "" && value.length <= MAX_JSON_COERCE_LENGTH) try {
				const parsed = JSON.parse(value);
				if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
			} catch {}
			return value;
		case "null":
			if (value === "" || value === 0 || value === false) return null;
			return value;
		default: return value;
	}
}
function applySchemaObjectCoercion(value, schema) {
	const properties = schema.properties;
	const definedKeys = new Set(properties ? Object.keys(properties) : []);
	if (properties) {
		for (const [key, propertySchema] of Object.entries(properties)) if (key in value) value[key] = coerceWithJsonSchema(value[key], propertySchema);
	}
	if (schema.additionalProperties && isJsonSchemaObject(schema.additionalProperties)) {
		for (const [key, propertyValue] of Object.entries(value)) if (!definedKeys.has(key)) value[key] = coerceWithJsonSchema(propertyValue, schema.additionalProperties);
	}
}
function applySchemaArrayCoercion(value, schema) {
	if (Array.isArray(schema.items)) {
		for (let index = 0; index < value.length; index++) {
			const itemSchema = schema.items[index];
			if (itemSchema) value[index] = coerceWithJsonSchema(value[index], itemSchema);
		}
		return;
	}
	if (isJsonSchemaObject(schema.items)) for (let index = 0; index < value.length; index++) value[index] = coerceWithJsonSchema(value[index], schema.items);
}
function coerceWithUnionSchema(value, schemas) {
	if (value === null) {
		for (const schema of schemas) if (getSchemaTypes(schema).includes("null")) {
			const validator = getSubSchemaValidator(schema);
			if (!validator || validator.Check(value)) return value;
		}
	}
	for (const schema of schemas) {
		const coerced = coerceWithJsonSchema(structuredClone(value), schema);
		if (getSubSchemaValidator(schema)?.Check(coerced)) return coerced;
	}
	return value;
}
function coerceWithJsonSchema(value, schema) {
	let nextValue = value;
	if (Array.isArray(schema.allOf)) for (const nested of schema.allOf) nextValue = coerceWithJsonSchema(nextValue, nested);
	if (Array.isArray(schema.anyOf)) nextValue = coerceWithUnionSchema(nextValue, schema.anyOf);
	if (Array.isArray(schema.oneOf)) nextValue = coerceWithUnionSchema(nextValue, schema.oneOf);
	const schemaTypes = getSchemaTypes(schema);
	const matchesUnionMember = schemaTypes.length > 1 && schemaTypes.some((schemaType) => matchesJsonType(nextValue, schemaType));
	if (schemaTypes.length > 0 && !matchesUnionMember) for (const schemaType of schemaTypes) {
		const candidate = coercePrimitiveByType(nextValue, schemaType);
		if (candidate !== nextValue) {
			nextValue = candidate;
			break;
		}
	}
	if (schemaTypes.includes("object") && isRecord(nextValue) && !Array.isArray(nextValue)) applySchemaObjectCoercion(nextValue, schema);
	if (schemaTypes.includes("array") && Array.isArray(nextValue)) applySchemaArrayCoercion(nextValue, schema);
	return nextValue;
}
function getValidator(schema) {
	const key = schema;
	const cached = validatorCache.get(key);
	if (cached) return cached;
	const validator = (0, typebox_compile.Compile)(schema);
	validatorCache.set(key, validator);
	return validator;
}
function formatValidationPath(error) {
	if (error.keyword === "required") {
		const requiredProperty = error.params.requiredProperties?.[0];
		if (requiredProperty) {
			const basePath = error.instancePath.replace(/^\//, "").replace(/\//g, ".");
			return basePath ? `${basePath}.${requiredProperty}` : requiredProperty;
		}
	}
	return error.instancePath.replace(/^\//, "").replace(/\//g, ".") || "root";
}
/** Finds the target tool and validates/coerces a model-emitted tool call. */
function validateToolCall$1(tools, toolCall) {
	const tool = tools.find((t) => t.name === toolCall.name);
	if (!tool) throw new Error(`Tool "${toolCall.name}" not found`);
	return validateToolArguments$1(tool, toolCall);
}
/** Validates tool arguments against TypeBox or plain JSON-schema parameters. */
function validateToolArguments$1(tool, toolCall) {
	const args = structuredClone(toolCall.arguments);
	const validator = getValidator(tool.parameters);
	validator.Convert(args);
	if (isJsonSchemaObject(tool.parameters)) {
		const coerced = coerceWithJsonSchema(args, tool.parameters);
		if (coerced !== args) if (isRecord(args) && isRecord(coerced)) {
			for (const key of Object.keys(args)) delete args[key];
			Object.assign(args, coerced);
		} else return validator.Check(coerced) ? coerced : args;
	}
	if (validator.Check(args)) return args;
	const errors = validator.Errors(args).map((error) => `  - ${formatValidationPath(error)}: ${error.message}`).join("\n") || "Unknown validation error";
	throw new Error(`Validation failed for tool "${toolCall.name}":\n${errors}\n\nReceived arguments:\n${JSON.stringify(toolCall.arguments, null, 2)}`);
}
//#endregion
//#region packages/agent-core/src/reasoning.ts
const ENABLED_THINKING_LEVELS = /* @__PURE__ */ new Set([
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max"
]);
function isEnabledThinkingLevel(value) {
	return ENABLED_THINKING_LEVELS.has(value);
}
function resolveAgentReasoningOption(model, thinkingLevel) {
	if (thinkingLevel !== "off") return thinkingLevel;
	const offFallback = model.thinkingLevelMap?.off ?? ((model.api === "anthropic-messages" || model.api === "bedrock-converse-stream") && resolveClaudeFable5ModelIdentity(model) ? "low" : void 0);
	if (isEnabledThinkingLevel(offFallback)) return offFallback;
	return model.api === "anthropic-messages" && resolveClaudeSonnet5ModelIdentity(model) ? "off" : void 0;
}
//#endregion
//#region packages/agent-core/src/runtime-deps.ts
function missingRuntimeDep(name) {
	return /* @__PURE__ */ new Error(`@gabrielvfonseca/agent-core runtime dependency "${name}" is not configured. Pass an AgentCoreRuntimeDeps instance or a streamFn explicitly.`);
}
/** Resolve the stream function, preferring an explicit override over injected runtime deps. */
function resolveAgentCoreStreamFn(runtime, streamFn) {
	if (streamFn) return streamFn;
	if (runtime?.streamSimple) return runtime.streamSimple;
	throw missingRuntimeDep("streamSimple");
}
/** Resolve the completion function used by non-streaming helper flows. */
function resolveAgentCoreCompleteFn(runtime) {
	if (runtime?.completeSimple) return runtime.completeSimple;
	throw missingRuntimeDep("completeSimple");
}
//#endregion
//#region packages/agent-core/src/turn-interruption.ts
/** Canonical empty aborted/error assistant recorded when a run ends without output. */
function createFailureMessage(model, error, aborted) {
	return {
		role: "assistant",
		content: [{
			type: "text",
			text: ""
		}],
		api: model.api,
		provider: model.provider,
		model: model.id,
		stopReason: aborted ? "aborted" : "error",
		errorMessage: error instanceof Error ? error.message : String(error),
		timestamp: Date.now(),
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: {
				input: 0,
				output: 0,
				cacheRead: 0,
				cacheWrite: 0,
				total: 0
			}
		}
	};
}
const INTERRUPTED_TURN_GUIDANCE = `<turn_aborted>
The previous turn was interrupted. Any running background processes may still be active. If any tools or commands were aborted, they may have partially executed.
</turn_aborted>`;
/**
* Aborts that end a turn as an intentional handoff (e.g. yield-style tools)
* mark it with an abort reason carrying `turnHandoff: true`. Interruption
* guidance is skipped for them: the next turn would otherwise be told tools
* may have partially executed after a clean, deliberate stop.
*/
function isTurnHandoffAbort(signal) {
	if (!signal?.aborted) return false;
	const reason = signal.reason;
	return typeof reason === "object" && reason !== null && reason.turnHandoff === true;
}
function createInterruptedTurnMessage() {
	return {
		role: "custom",
		customType: "openclaw:turn-aborted",
		content: INTERRUPTED_TURN_GUIDANCE,
		display: false,
		timestamp: Date.now()
	};
}
async function appendInterruptedTurnMessage(messages, emit) {
	const interruption = createInterruptedTurnMessage();
	messages.push(interruption);
	await emit({
		type: "message_start",
		message: interruption
	});
	await emit({
		type: "message_end",
		message: interruption
	});
}
function normalizeCoreContextMessages(messages) {
	return messages.map((message) => {
		if (message.role !== "custom" || message.customType !== "openclaw:turn-aborted") return message;
		return {
			role: "user",
			content: typeof message.content === "string" ? [{
				type: "text",
				text: message.content
			}] : message.content,
			timestamp: message.timestamp
		};
	});
}
//#endregion
//#region packages/agent-core/src/agent-loop.ts
function appendTextDeltaToAssistantMessage(message, contentIndex, delta) {
	const content = [...message.content];
	const currentContent = content[contentIndex];
	content[contentIndex] = currentContent?.type === "text" ? {
		...currentContent,
		text: currentContent.text + delta
	} : {
		type: "text",
		text: delta
	};
	return {
		...message,
		content
	};
}
function resolveAssistantMessageUpdate(event, currentMessage) {
	if ("partial" in event && event.partial) return event.partial;
	if (event.type === "text_delta") return appendTextDeltaToAssistantMessage(currentMessage, event.contentIndex, event.delta);
	return currentMessage;
}
function removeNonExecutableToolCalls(message) {
	if (message.stopReason === "toolUse") return message;
	const content = message.content.filter((item) => item.type !== "toolCall");
	return content.length === message.content.length ? message : {
		...message,
		content
	};
}
/** Run a prompt-started loop and emit events through a caller-owned sink. */
async function runAgentLoop(prompts, context, config, emit, signal, streamFn, runtime) {
	const newMessages = [...prompts];
	const currentContext = {
		...context,
		messages: [...context.messages, ...prompts]
	};
	await emit({ type: "agent_start" });
	await emit({ type: "turn_start" });
	for (const prompt of prompts) {
		await emit({
			type: "message_start",
			message: prompt
		});
		await emit({
			type: "message_end",
			message: prompt
		});
	}
	await runLoop(currentContext, newMessages, config, signal, emit, streamFn, runtime);
	return newMessages;
}
/** Continue an existing loop context and emit only newly produced messages. */
async function runAgentLoopContinue(context, config, emit, signal, streamFn, runtime) {
	const lastMessage = context.messages.at(-1);
	if (!lastMessage) throw new Error("Cannot continue: no messages in context");
	if (lastMessage.role === "assistant") throw new require_errors.TranscriptNotContinuableError(lastMessage.role);
	const newMessages = [];
	const currentContext = { ...context };
	await emit({ type: "agent_start" });
	await emit({ type: "turn_start" });
	await runLoop(currentContext, newMessages, config, signal, emit, streamFn, runtime);
	return newMessages;
}
/**
* Main loop logic shared by agentLoop and agentLoopContinue.
*/
async function runLoop(initialContext, newMessages, initialConfig, signal, emit, streamFn, runtime) {
	let currentContext = initialContext;
	let config = initialConfig;
	let firstTurn = true;
	let turnOpen = true;
	let pendingMessages = await config.getSteeringMessages?.() || [];
	const stopIfAborted = async () => {
		if (!signal?.aborted) return false;
		const abortedMessage = createFailureMessage(config.model, signal.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("Agent run aborted"), true);
		newMessages.push(abortedMessage);
		if (!turnOpen) {
			await emit({ type: "turn_start" });
			turnOpen = true;
		}
		await emit({
			type: "message_start",
			message: abortedMessage
		});
		await emit({
			type: "message_end",
			message: abortedMessage
		});
		await emit({
			type: "turn_end",
			message: abortedMessage,
			toolResults: []
		});
		turnOpen = false;
		if (!isTurnHandoffAbort(signal)) await appendInterruptedTurnMessage(newMessages, emit);
		await emit({
			type: "agent_end",
			messages: newMessages
		});
		return true;
	};
	while (true) {
		let hasMoreToolCalls = true;
		while (hasMoreToolCalls || pendingMessages.length > 0) {
			if (await stopIfAborted()) return;
			if (!firstTurn) {
				await emit({ type: "turn_start" });
				turnOpen = true;
			} else firstTurn = false;
			if (pendingMessages.length > 0) for (const message of pendingMessages) {
				await emit({
					type: "message_start",
					message
				});
				await emit({
					type: "message_end",
					message
				});
				currentContext.messages.push(message);
				newMessages.push(message);
			}
			if (await stopIfAborted()) return;
			const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFn, runtime);
			newMessages.push(message);
			if (message.stopReason === "error" || message.stopReason === "aborted") {
				await emit({
					type: "turn_end",
					message,
					toolResults: []
				});
				if (message.stopReason === "aborted" && signal?.aborted && !isTurnHandoffAbort(signal)) await appendInterruptedTurnMessage(newMessages, emit);
				await emit({
					type: "agent_end",
					messages: newMessages
				});
				return;
			}
			const toolCalls = message.content.filter((c) => c.type === "toolCall");
			const toolResults = [];
			hasMoreToolCalls = false;
			if (message.stopReason === "toolUse" && toolCalls.length > 0) {
				const executedToolBatch = await executeToolCalls(currentContext, message, config, signal, emit);
				toolResults.push(...executedToolBatch.messages);
				hasMoreToolCalls = !executedToolBatch.terminate;
				for (const result of toolResults) {
					currentContext.messages.push(result);
					newMessages.push(result);
				}
			}
			await emit({
				type: "turn_end",
				message,
				toolResults
			});
			turnOpen = false;
			if (await stopIfAborted()) return;
			const nextTurnContext = {
				message,
				toolResults,
				context: currentContext,
				newMessages
			};
			const nextTurnSnapshot = await config.prepareNextTurn?.(nextTurnContext);
			if (nextTurnSnapshot) {
				currentContext = nextTurnSnapshot.context ?? currentContext;
				const nextModel = nextTurnSnapshot.model ?? config.model;
				const nextThinkingLevel = nextTurnSnapshot.thinkingLevel ?? config.thinkingLevel;
				const nextReasoning = (nextTurnSnapshot.thinkingLevel !== void 0 || nextTurnSnapshot.model !== void 0 && nextThinkingLevel !== void 0) && nextThinkingLevel !== void 0 ? resolveAgentReasoningOption(nextModel, nextThinkingLevel) : config.reasoning;
				config = Object.assign({}, config, {
					model: nextModel,
					thinkingLevel: nextThinkingLevel,
					reasoning: nextReasoning
				});
			}
			if (await stopIfAborted()) return;
			if (await config.shouldStopAfterTurn?.({
				message,
				toolResults,
				context: currentContext,
				newMessages
			})) {
				await emit({
					type: "agent_end",
					messages: newMessages
				});
				return;
			}
			pendingMessages = await config.getSteeringMessages?.() || [];
			if (await stopIfAborted()) return;
		}
		const followUpMessages = await config.getFollowUpMessages?.() || [];
		if (followUpMessages.length > 0) {
			pendingMessages = followUpMessages;
			continue;
		}
		break;
	}
	await emit({
		type: "agent_end",
		messages: newMessages
	});
}
/**
* Stream an assistant response from the LLM.
* This is where AgentMessage[] gets transformed to Message[] for the LLM.
*/
async function streamAssistantResponse(context, config, signal, emit, streamFn, runtime) {
	let messages = context.messages;
	if (config.transformContext) messages = await config.transformContext(messages, signal);
	messages = normalizeCoreContextMessages(messages);
	const llmMessages = await config.convertToLlm(messages);
	const llmContext = {
		systemPrompt: context.systemPrompt,
		messages: llmMessages,
		tools: context.tools
	};
	const streamFunction = resolveAgentCoreStreamFn(runtime, streamFn);
	const resolvedApiKey = (config.getApiKey ? await config.getApiKey(config.model.provider) : void 0) || config.apiKey;
	const response = await streamFunction(config.model, llmContext, {
		...config,
		apiKey: resolvedApiKey,
		signal
	});
	let partialMessage = null;
	let addedPartial = false;
	for await (const event of response) switch (event.type) {
		case "start": {
			const message = event.partial;
			partialMessage = message;
			context.messages.push(message);
			addedPartial = true;
			await emit({
				type: "message_start",
				message: { ...message }
			});
			break;
		}
		case "text_start":
		case "text_delta":
		case "text_end":
		case "thinking_start":
		case "thinking_delta":
		case "thinking_end":
		case "toolcall_start":
		case "toolcall_delta":
		case "toolcall_end":
			if (partialMessage) {
				const message = resolveAssistantMessageUpdate(event, partialMessage);
				partialMessage = message;
				context.messages[context.messages.length - 1] = message;
				await emit({
					type: "message_update",
					assistantMessageEvent: event,
					message: { ...message }
				});
			}
			break;
		case "done":
		case "error": {
			const finalMessage = removeNonExecutableToolCalls(await response.result());
			if (addedPartial) context.messages[context.messages.length - 1] = finalMessage;
			else context.messages.push(finalMessage);
			if (!addedPartial) await emit({
				type: "message_start",
				message: { ...finalMessage }
			});
			await emit({
				type: "message_end",
				message: finalMessage
			});
			return finalMessage;
		}
	}
	const finalMessage = removeNonExecutableToolCalls(await response.result());
	if (addedPartial) context.messages[context.messages.length - 1] = finalMessage;
	else {
		context.messages.push(finalMessage);
		await emit({
			type: "message_start",
			message: { ...finalMessage }
		});
	}
	await emit({
		type: "message_end",
		message: finalMessage
	});
	return finalMessage;
}
/**
* Execute tool calls from an assistant message.
*/
async function executeToolCalls(currentContext, assistantMessage, config, signal, emit) {
	const toolCalls = assistantMessage.content.filter((c) => c.type === "toolCall");
	const resolvedToolCalls = /* @__PURE__ */ new Map();
	let hasSequentialToolCall = false;
	if (config.toolExecution !== "sequential") for (const toolCall of toolCalls) {
		const resolution = await resolveToolCallTool(currentContext, assistantMessage, toolCall, config, signal, resolvedToolCalls);
		if (resolution.kind === "resolved" && resolution.tool?.executionMode === "sequential") {
			hasSequentialToolCall = true;
			break;
		}
		if (signal?.aborted) break;
	}
	if (config.toolExecution === "sequential" || hasSequentialToolCall) return executeToolCallsSequential(currentContext, assistantMessage, toolCalls, resolvedToolCalls, config, signal, emit);
	return executeToolCallsParallel(currentContext, assistantMessage, toolCalls, resolvedToolCalls, config, signal, emit);
}
function hidesToolCallFromChannelProgress(context, toolCall, resolvedToolCalls) {
	const resolution = resolvedToolCalls.get(toolCall);
	return (resolution?.kind === "resolved" ? resolution.tool : context.tools?.find((candidate) => candidate.name === toolCall.name))?.hideFromChannelProgress === true;
}
async function executeToolCallsSequential(currentContext, assistantMessage, toolCalls, resolvedToolCalls, config, signal, emit) {
	const finalizedCalls = [];
	const messages = [];
	for (const toolCall of toolCalls) {
		const hideFromChannelProgress = hidesToolCallFromChannelProgress(currentContext, toolCall, resolvedToolCalls);
		await emit({
			type: "tool_execution_start",
			toolCallId: toolCall.id,
			toolName: toolCall.name,
			args: toolCall.arguments,
			...hideFromChannelProgress ? { hideFromChannelProgress: true } : {}
		});
		const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal, resolvedToolCalls);
		let finalized;
		if (preparation.kind === "immediate") finalized = {
			toolCall,
			result: preparation.result,
			isError: preparation.isError,
			executionStarted: false,
			...preparation.errorKind ? { errorKind: preparation.errorKind } : {},
			...hideFromChannelProgress ? { hideFromChannelProgress: true } : {}
		};
		else finalized = await finalizeExecutedToolCall(currentContext, assistantMessage, preparation, await executePreparedToolCall(preparation, signal, emit), config, signal);
		await emitToolExecutionEnd(finalized, emit);
		const toolResultMessage = createToolResultMessage(finalized);
		await emitToolResultMessage(toolResultMessage, emit);
		finalizedCalls.push(finalized);
		messages.push(toolResultMessage);
		if (signal?.aborted) break;
	}
	return {
		messages,
		terminate: shouldTerminateToolBatch(finalizedCalls)
	};
}
async function executeToolCallsParallel(currentContext, assistantMessage, toolCalls, resolvedToolCalls, config, signal, emit) {
	const finalizedCalls = [];
	for (const toolCall of toolCalls) {
		const hideFromChannelProgress = hidesToolCallFromChannelProgress(currentContext, toolCall, resolvedToolCalls);
		await emit({
			type: "tool_execution_start",
			toolCallId: toolCall.id,
			toolName: toolCall.name,
			args: toolCall.arguments,
			...hideFromChannelProgress ? { hideFromChannelProgress: true } : {}
		});
		const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal, resolvedToolCalls);
		if (preparation.kind === "immediate") {
			const finalized = {
				toolCall,
				result: preparation.result,
				isError: preparation.isError,
				executionStarted: false,
				...preparation.errorKind ? { errorKind: preparation.errorKind } : {},
				...hideFromChannelProgress ? { hideFromChannelProgress: true } : {}
			};
			await emitToolExecutionEnd(finalized, emit);
			finalizedCalls.push(finalized);
			if (signal?.aborted) break;
			continue;
		}
		finalizedCalls.push(async () => {
			const executed = await executePreparedToolCall(preparation, signal, emit);
			const finalized = await finalizeExecutedToolCall(currentContext, assistantMessage, preparation, executed, config, signal);
			await emitToolExecutionEnd(finalized, emit);
			return finalized;
		});
		if (signal?.aborted) break;
	}
	const orderedFinalizedCalls = await Promise.all(finalizedCalls.map((entry) => typeof entry === "function" ? entry() : Promise.resolve(entry)));
	const messages = [];
	for (const finalized of orderedFinalizedCalls) {
		const toolResultMessage = createToolResultMessage(finalized);
		await emitToolResultMessage(toolResultMessage, emit);
		messages.push(toolResultMessage);
	}
	return {
		messages,
		terminate: shouldTerminateToolBatch(orderedFinalizedCalls)
	};
}
function shouldTerminateToolBatch(finalizedCalls) {
	return finalizedCalls.length > 0 && finalizedCalls.every((finalized) => finalized.result.terminate === true);
}
function prepareToolCallArguments(tool, toolCall) {
	if (!tool.prepareArguments) return toolCall;
	const preparedArguments = tool.prepareArguments(toolCall.arguments);
	if (preparedArguments === toolCall.arguments) return toolCall;
	return {
		...toolCall,
		arguments: preparedArguments
	};
}
async function resolveToolCallTool(currentContext, assistantMessage, toolCall, config, signal, resolvedToolCalls) {
	const cached = resolvedToolCalls?.get(toolCall);
	if (cached) return cached;
	let resolution;
	try {
		let tool = currentContext.tools?.find((t) => t.name === toolCall.name);
		if (!tool) {
			const resolvedTool = await config.resolveDeferredTool?.({
				assistantMessage,
				toolCall,
				context: currentContext
			}, signal);
			if (resolvedTool && resolvedTool.name !== toolCall.name) throw new Error(`Deferred tool resolver returned "${resolvedTool.name}" for requested "${toolCall.name}"`);
			tool = resolvedTool;
			if (tool) currentContext.tools = [...currentContext.tools ?? [], tool];
		}
		resolution = {
			kind: "resolved",
			...tool ? { tool } : {}
		};
	} catch (error) {
		resolution = {
			kind: "error",
			error
		};
	}
	resolvedToolCalls?.set(toolCall, resolution);
	return resolution;
}
async function prepareToolCall(currentContext, assistantMessage, toolCall, config, signal, resolvedToolCalls) {
	const resolution = await resolveToolCallTool(currentContext, assistantMessage, toolCall, config, signal, resolvedToolCalls);
	if (resolution.kind === "error") return {
		kind: "immediate",
		result: createErrorToolResult(signal?.aborted ? "Operation aborted" : resolution.error instanceof Error ? resolution.error.message : String(resolution.error)),
		isError: true
	};
	const tool = resolution.tool;
	if (!tool) return {
		kind: "immediate",
		result: createErrorToolResult(`Tool ${toolCall.name} not found`),
		isError: true
	};
	let preparedToolCall;
	try {
		preparedToolCall = prepareToolCallArguments(tool, toolCall);
	} catch (error) {
		return {
			kind: "immediate",
			result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
			isError: true
		};
	}
	let validatedArgs;
	try {
		validatedArgs = (0, _gabrielvfonseca_ai_validation.validateToolArguments)(tool, preparedToolCall);
	} catch (error) {
		return {
			kind: "immediate",
			result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
			isError: true,
			errorKind: "argument-validation"
		};
	}
	try {
		if (config.beforeToolCall) {
			const beforeResult = await config.beforeToolCall({
				assistantMessage,
				toolCall,
				args: validatedArgs,
				context: currentContext
			}, signal);
			if (signal?.aborted) return {
				kind: "immediate",
				result: createErrorToolResult("Operation aborted"),
				isError: true
			};
			if (beforeResult?.block) return {
				kind: "immediate",
				result: createErrorToolResult(beforeResult.reason || "Tool execution was blocked"),
				isError: true
			};
		}
		if (signal?.aborted) return {
			kind: "immediate",
			result: createErrorToolResult("Operation aborted"),
			isError: true
		};
		return {
			kind: "prepared",
			toolCall,
			tool,
			args: validatedArgs
		};
	} catch (error) {
		return {
			kind: "immediate",
			result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
			isError: true
		};
	}
}
async function executePreparedToolCall(prepared, signal, emit) {
	if (signal?.aborted) return {
		result: createErrorToolResult("Operation aborted"),
		isError: true,
		executionStarted: false
	};
	const updateEvents = [];
	let acceptingUpdates = true;
	try {
		const result = await prepared.tool.execute(prepared.toolCall.id, prepared.args, signal, (partialResult) => {
			if (!acceptingUpdates) return;
			updateEvents.push(Promise.resolve(emit({
				type: "tool_execution_update",
				toolCallId: prepared.toolCall.id,
				toolName: prepared.toolCall.name,
				args: prepared.toolCall.arguments,
				partialResult,
				...prepared.tool.hideFromChannelProgress === true ? { hideFromChannelProgress: true } : {}
			})));
		});
		acceptingUpdates = false;
		await Promise.all(updateEvents);
		return {
			result,
			isError: false,
			executionStarted: true
		};
	} catch (error) {
		acceptingUpdates = false;
		await Promise.all(updateEvents);
		return {
			result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
			isError: true,
			executionStarted: true
		};
	} finally {
		acceptingUpdates = false;
	}
}
async function finalizeExecutedToolCall(currentContext, assistantMessage, prepared, executed, config, signal) {
	let result = executed.result;
	let isError = executed.isError;
	if (executed.executionStarted && config.afterToolCall) try {
		const afterResult = await config.afterToolCall({
			assistantMessage,
			toolCall: prepared.toolCall,
			args: prepared.args,
			result,
			isError,
			context: currentContext
		}, signal);
		if (afterResult) {
			result = {
				content: afterResult.content ?? result.content,
				details: afterResult.details ?? result.details,
				terminate: afterResult.terminate ?? result.terminate
			};
			isError = afterResult.isError ?? isError;
		}
	} catch (error) {
		result = createErrorToolResult(error instanceof Error ? error.message : String(error));
		isError = true;
	}
	return {
		toolCall: prepared.toolCall,
		result,
		isError,
		executionStarted: executed.executionStarted,
		...prepared.tool.hideFromChannelProgress === true ? { hideFromChannelProgress: true } : {}
	};
}
function createErrorToolResult(message) {
	return {
		content: [{
			type: "text",
			text: message
		}],
		details: {}
	};
}
async function emitToolExecutionEnd(finalized, emit) {
	await emit({
		type: "tool_execution_end",
		toolCallId: finalized.toolCall.id,
		toolName: finalized.toolCall.name,
		result: finalized.result,
		isError: finalized.isError,
		executionStarted: finalized.executionStarted,
		...finalized.errorKind ? { errorKind: finalized.errorKind } : {},
		...finalized.hideFromChannelProgress === true ? { hideFromChannelProgress: true } : {}
	});
}
function createToolResultMessage(finalized) {
	return {
		role: "toolResult",
		toolCallId: finalized.toolCall.id,
		toolName: finalized.toolCall.name,
		content: finalized.result.content,
		details: finalized.result.details,
		isError: finalized.isError,
		timestamp: Date.now()
	};
}
async function emitToolResultMessage(toolResultMessage, emit) {
	await emit({
		type: "message_start",
		message: toolResultMessage
	});
	await emit({
		type: "message_end",
		message: toolResultMessage
	});
}
//#endregion
//#region packages/agent-core/src/agent.ts
function defaultConvertToLlm(messages) {
	return messages.filter((message) => message.role === "user" || message.role === "assistant" || message.role === "toolResult");
}
const DEFAULT_MODEL = {
	id: "unknown",
	name: "unknown",
	api: "unknown",
	provider: "unknown",
	baseUrl: "",
	reasoning: false,
	input: [],
	cost: {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0
	},
	contextWindow: 0,
	maxTokens: 0
};
function createMutableAgentState(initialState) {
	let tools = initialState?.tools?.slice() ?? [];
	let messages = initialState?.messages?.slice() ?? [];
	return {
		systemPrompt: initialState?.systemPrompt ?? "",
		model: initialState?.model ?? DEFAULT_MODEL,
		thinkingLevel: initialState?.thinkingLevel ?? "off",
		get tools() {
			return tools;
		},
		set tools(nextTools) {
			tools = nextTools.slice();
		},
		get messages() {
			return messages;
		},
		set messages(nextMessages) {
			messages = nextMessages.slice();
		},
		isStreaming: false,
		streamingMessage: void 0,
		pendingToolCalls: /* @__PURE__ */ new Set(),
		errorMessage: void 0
	};
}
var PendingMessageQueue = class {
	constructor(mode) {
		this.messages = [];
		this.mode = mode;
	}
	enqueue(message) {
		this.messages.push(message);
	}
	hasItems() {
		return this.messages.length > 0;
	}
	drain() {
		if (this.mode === "all") {
			const drained = this.messages.slice();
			this.messages = [];
			return drained;
		}
		const first = this.messages[0];
		if (!first) return [];
		this.messages = this.messages.slice(1);
		return [first];
	}
	clear() {
		this.messages = [];
	}
};
/**
* Stateful wrapper around the low-level agent loop.
*
* `Agent` owns the current transcript, emits lifecycle events, executes tools,
* and exposes queueing APIs for steering and follow-up messages.
*/
var Agent$1 = class {
	constructor(options = {}) {
		this.listeners = /* @__PURE__ */ new Set();
		this.mutableState = createMutableAgentState(options.initialState);
		this.convertToLlm = options.convertToLlm ?? defaultConvertToLlm;
		this.transformContext = options.transformContext;
		this.runtime = options.runtime;
		this.streamFn = resolveAgentCoreStreamFn(options.runtime, options.streamFn);
		this.getApiKey = options.getApiKey;
		this.onPayload = options.onPayload;
		this.onResponse = options.onResponse;
		this.beforeToolCall = options.beforeToolCall;
		this.resolveDeferredTool = options.resolveDeferredTool;
		this.afterToolCall = options.afterToolCall;
		this.prepareNextTurn = options.prepareNextTurn;
		this.steeringQueue = new PendingMessageQueue(options.steeringMode ?? "one-at-a-time");
		this.followUpQueue = new PendingMessageQueue(options.followUpMode ?? "one-at-a-time");
		this.sessionId = options.sessionId;
		this.thinkingBudgets = options.thinkingBudgets;
		this.transport = options.transport ?? "auto";
		this.maxRetryDelayMs = options.maxRetryDelayMs;
		this.toolExecution = options.toolExecution ?? "parallel";
	}
	/**
	* Subscribe to agent lifecycle events.
	*
	* Listener promises are awaited in subscription order and are included in
	* the current run's settlement. Listeners also receive the active abort
	* signal for the current run.
	*
	* `agent_end` is the final emitted event for a run, but the agent does not
	* become idle until all awaited listeners for that event have settled.
	*/
	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
	/**
	* Current agent state.
	*
	* Assigning `state.tools` or `state.messages` copies the provided top-level array.
	*/
	get state() {
		return this.mutableState;
	}
	/** Controls how queued steering messages are drained. */
	set steeringMode(mode) {
		this.steeringQueue.mode = mode;
	}
	get steeringMode() {
		return this.steeringQueue.mode;
	}
	/** Controls how queued follow-up messages are drained. */
	set followUpMode(mode) {
		this.followUpQueue.mode = mode;
	}
	get followUpMode() {
		return this.followUpQueue.mode;
	}
	/** Queue a message to be injected after the current assistant turn finishes. */
	steer(message) {
		this.steeringQueue.enqueue(message);
	}
	/** Queue a message to run only after the agent would otherwise stop. */
	followUp(message) {
		this.followUpQueue.enqueue(message);
	}
	/** Remove all queued steering messages. */
	clearSteeringQueue() {
		this.steeringQueue.clear();
	}
	/** Remove all queued follow-up messages. */
	clearFollowUpQueue() {
		this.followUpQueue.clear();
	}
	/** Remove all queued steering and follow-up messages. */
	clearAllQueues() {
		this.clearSteeringQueue();
		this.clearFollowUpQueue();
	}
	/** Returns true when either queue still contains pending messages. */
	hasQueuedMessages() {
		return this.steeringQueue.hasItems() || this.followUpQueue.hasItems();
	}
	/** Active abort signal for the current run, if any. */
	get signal() {
		return this.activeRun?.abortController.signal;
	}
	/** Abort the current run, if one is active. */
	abort(reason) {
		this.activeRun?.abortController.abort(reason);
	}
	/**
	* Resolve when the current run and all awaited event listeners have finished.
	*
	* This resolves after `agent_end` listeners settle.
	*/
	waitForIdle() {
		return this.activeRun?.promise ?? Promise.resolve();
	}
	/** Clear transcript state, runtime state, and queued messages. */
	reset() {
		this.mutableState.messages = [];
		this.mutableState.isStreaming = false;
		this.mutableState.streamingMessage = void 0;
		this.mutableState.pendingToolCalls = /* @__PURE__ */ new Set();
		this.mutableState.errorMessage = void 0;
		this.clearFollowUpQueue();
		this.clearSteeringQueue();
	}
	async prompt(input, images) {
		if (this.activeRun) throw new Error("Agent is already processing a prompt. Use steer() or followUp() to queue messages, or wait for completion.");
		const messages = this.normalizePromptInput(input, images);
		await this.runPromptMessages(messages);
	}
	/** Continue from the current transcript. The last message must be a user or tool-result message. */
	async continue() {
		if (this.activeRun) throw new Error("Agent is already processing. Wait for completion before continuing.");
		const lastMessage = this.mutableState.messages[this.mutableState.messages.length - 1];
		if (!lastMessage) throw new Error("No messages to continue from");
		if (lastMessage.role === "assistant") {
			const queuedSteering = this.steeringQueue.drain();
			if (queuedSteering.length > 0) {
				await this.runPromptMessages(queuedSteering, { skipInitialSteeringPoll: true });
				return;
			}
			const queuedFollowUps = this.followUpQueue.drain();
			if (queuedFollowUps.length > 0) {
				await this.runPromptMessages(queuedFollowUps);
				return;
			}
			throw new require_errors.TranscriptNotContinuableError(lastMessage.role);
		}
		await this.runContinuation();
	}
	normalizePromptInput(input, images) {
		if (Array.isArray(input)) return input;
		if (typeof input !== "string") return [input];
		const content = [{
			type: "text",
			text: input
		}];
		if (images && images.length > 0) content.push(...images);
		return [{
			role: "user",
			content,
			timestamp: Date.now()
		}];
	}
	async runPromptMessages(messages, options = {}) {
		await this.runWithLifecycle(async (signal) => {
			await runAgentLoop(messages, this.createContextSnapshot(), this.createLoopConfig(options), (event) => this.processEvents(event), signal, this.streamFn);
		});
	}
	async runContinuation() {
		await this.runWithLifecycle(async (signal) => {
			await runAgentLoopContinue(this.createContextSnapshot(), this.createLoopConfig(), (event) => this.processEvents(event), signal, this.streamFn);
		});
	}
	createContextSnapshot() {
		return {
			systemPrompt: this.mutableState.systemPrompt,
			messages: this.mutableState.messages.slice(),
			tools: this.mutableState.tools.slice()
		};
	}
	createLoopConfig(options = {}) {
		let skipInitialSteeringPoll = options.skipInitialSteeringPoll === true;
		return {
			model: this.mutableState.model,
			thinkingLevel: this.mutableState.thinkingLevel,
			reasoning: resolveAgentReasoningOption(this.mutableState.model, this.mutableState.thinkingLevel),
			sessionId: this.sessionId,
			onPayload: this.onPayload,
			onResponse: this.onResponse,
			transport: this.transport,
			thinkingBudgets: this.thinkingBudgets,
			maxRetryDelayMs: this.maxRetryDelayMs,
			toolExecution: this.toolExecution,
			beforeToolCall: this.beforeToolCall,
			resolveDeferredTool: this.resolveDeferredTool,
			afterToolCall: this.afterToolCall,
			prepareNextTurn: this.prepareNextTurn ? async () => await this.prepareNextTurn?.(this.signal) : void 0,
			convertToLlm: this.convertToLlm,
			transformContext: this.transformContext,
			getApiKey: this.getApiKey,
			getSteeringMessages: async () => {
				if (skipInitialSteeringPoll) {
					skipInitialSteeringPoll = false;
					return [];
				}
				return this.steeringQueue.drain();
			},
			getFollowUpMessages: async () => this.followUpQueue.drain()
		};
	}
	async runWithLifecycle(executor) {
		if (this.activeRun) throw new Error("Agent is already processing.");
		const abortController = new AbortController();
		let resolvePromise = () => {};
		const promise = new Promise((resolve) => {
			resolvePromise = resolve;
		});
		this.activeRun = {
			promise,
			resolve: resolvePromise,
			abortController
		};
		this.mutableState.isStreaming = true;
		this.mutableState.streamingMessage = void 0;
		this.mutableState.errorMessage = void 0;
		try {
			await executor(abortController.signal);
		} catch (error) {
			await this.handleRunFailure(error, abortController.signal.aborted);
		} finally {
			this.finishRun();
		}
	}
	async handleRunFailure(error, aborted) {
		const failureMessage = createFailureMessage(this.mutableState.model, error, aborted);
		await this.processEvents({
			type: "message_start",
			message: failureMessage
		});
		await this.processEvents({
			type: "message_end",
			message: failureMessage
		});
		await this.processEvents({
			type: "turn_end",
			message: failureMessage,
			toolResults: []
		});
		const messages = [failureMessage];
		if (aborted && !isTurnHandoffAbort(this.signal)) await appendInterruptedTurnMessage(messages, (event) => this.processEvents(event));
		await this.processEvents({
			type: "agent_end",
			messages
		});
	}
	finishRun() {
		this.mutableState.isStreaming = false;
		this.mutableState.streamingMessage = void 0;
		this.mutableState.pendingToolCalls = /* @__PURE__ */ new Set();
		this.activeRun?.resolve();
		this.activeRun = void 0;
	}
	/**
	* Reduce internal state for a loop event, then await listeners.
	*
	* `agent_end` only means no further loop events will be emitted. The run is
	* considered idle later, after all awaited listeners for `agent_end` finish
	* and `finishRun()` clears runtime-owned state.
	*/
	async processEvents(event) {
		switch (event.type) {
			case "agent_start":
			case "turn_start":
			case "tool_execution_update": break;
			case "message_start":
				this.mutableState.streamingMessage = event.message;
				break;
			case "message_update":
				this.mutableState.streamingMessage = event.message;
				break;
			case "message_end":
				this.mutableState.streamingMessage = void 0;
				this.mutableState.messages.push(event.message);
				break;
			case "tool_execution_start": {
				const pendingToolCalls = new Set(this.mutableState.pendingToolCalls);
				pendingToolCalls.add(event.toolCallId);
				this.mutableState.pendingToolCalls = pendingToolCalls;
				break;
			}
			case "tool_execution_end": {
				const pendingToolCalls = new Set(this.mutableState.pendingToolCalls);
				pendingToolCalls.delete(event.toolCallId);
				this.mutableState.pendingToolCalls = pendingToolCalls;
				break;
			}
			case "turn_end":
				if (event.message.role === "assistant" && event.message.errorMessage) this.mutableState.errorMessage = event.message.errorMessage;
				break;
			case "agent_end":
				this.mutableState.streamingMessage = void 0;
				break;
		}
		const signal = this.activeRun?.abortController.signal;
		if (!signal) throw new Error("Agent listener invoked outside active run");
		for (const listener of this.listeners) await listener(event, signal);
	}
};
//#endregion
//#region src/infra/net/node-proxy-agent.ts
const UNSUPPORTED_PROXY_PROTOCOL_MESSAGE = "Unsupported proxy protocol. SOCKS and PAC proxy URLs are not supported; use an HTTP or HTTPS proxy URL.";
const require$1 = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
function inferTargetProtocol(targetUrl) {
	const parsed = parseTargetUrl(targetUrl);
	if (parsed === void 0) return;
	if (parsed.protocol === "http:" || parsed.protocol === "ws:") return "http";
	if (parsed.protocol === "https:" || parsed.protocol === "wss:") return "https";
}
function parseTargetUrl(targetUrl) {
	let parsed;
	try {
		parsed = targetUrl instanceof URL ? targetUrl : new URL(targetUrl);
	} catch {
		return;
	}
	return parsed;
}
function formatNoProxyTargetUrl(targetUrl) {
	const target = parseTargetUrl(targetUrl);
	if (target === void 0) return;
	const parsed = new URL(target.href);
	if (parsed.protocol === "ws:") parsed.protocol = "http:";
	else if (parsed.protocol === "wss:") parsed.protocol = "https:";
	return parsed.href;
}
function proxyUrlWithDefaultScheme(proxyUrl, protocol) {
	const withScheme = proxyUrl.includes("://") ? proxyUrl : `${protocol}://${proxyUrl}`;
	let parsed;
	try {
		parsed = new URL(withScheme);
	} catch (error) {
		throw new Error(`Invalid proxy URL ${JSON.stringify(proxyUrl)}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(`${UNSUPPORTED_PROXY_PROTOCOL_MESSAGE} Got ${parsed.protocol}`);
	return parsed;
}
function fixedProxyEnv(proxyUrl) {
	const href = proxyUrl.href;
	return {
		HTTP_PROXY: href,
		HTTPS_PROXY: href,
		ALL_PROXY: void 0,
		NO_PROXY: void 0,
		http_proxy: void 0,
		https_proxy: void 0,
		all_proxy: void 0,
		no_proxy: void 0
	};
}
function loadCreateAmbientNodeProxyAgent() {
	return require$1("@openclaw/proxyline").createAmbientNodeProxyAgent;
}
function applyNodeAgentOptions(agent, options) {
	if (options === void 0) return;
	const agentWithOptions = agent;
	agentWithOptions.options = {
		...agentWithOptions.options,
		...options
	};
	if (typeof options.keepAlive === "boolean") agentWithOptions.keepAlive = options.keepAlive;
	if (typeof options.keepAliveMsecs === "number") agentWithOptions.keepAliveMsecs = options.keepAliveMsecs;
	if (typeof options.maxFreeSockets === "number") agentWithOptions.maxFreeSockets = options.maxFreeSockets;
	if (typeof options.maxSockets === "number") agentWithOptions.maxSockets = options.maxSockets;
	if (typeof options.maxTotalSockets === "number") agentWithOptions.maxTotalSockets = options.maxTotalSockets;
	if (options.scheduling === "fifo" || options.scheduling === "lifo") agentWithOptions.scheduling = options.scheduling;
	if (typeof options.timeout === "number") agentWithOptions.timeout = options.timeout;
}
/** Resolves the env proxy URL that should be used for a specific Node target. */
function resolveEnvNodeProxyUrlForTarget(targetUrl, env = process.env) {
	const protocol = inferTargetProtocol(targetUrl);
	if (protocol === void 0) return;
	const formattedTarget = formatNoProxyTargetUrl(targetUrl);
	if (formattedTarget === void 0) return;
	if (require_undici_global_dispatcher.matchesNoProxy(formattedTarget, env)) return;
	const proxyOptions = require_undici_global_dispatcher.resolveEnvHttpProxyAgentOptions(env);
	const proxyUrl = protocol === "https" ? proxyOptions?.httpsProxy : proxyOptions?.httpProxy;
	return proxyUrl ? proxyUrlWithDefaultScheme(proxyUrl, protocol) : void 0;
}
function createFixedNodeProxyAgent(proxyUrl, options = {}) {
	const parsedProxyUrl = proxyUrl instanceof URL ? proxyUrl : proxyUrlWithDefaultScheme(proxyUrl, options.protocol ?? "https");
	const agent = loadCreateAmbientNodeProxyAgent()({
		env: fixedProxyEnv(parsedProxyUrl),
		protocol: options.protocol ?? "https",
		...options.proxyTls !== void 0 ? { proxyTls: options.proxyTls } : {}
	});
	if (agent === void 0) throw new Error(`${UNSUPPORTED_PROXY_PROTOCOL_MESSAGE} Got ${parsedProxyUrl.protocol}`);
	applyNodeAgentOptions(agent, options.agentOptions);
	return agent;
}
/** Builds paired HTTP and HTTPS agents for libraries that require both slots. */
function createFixedNodeProxyAgentPair(proxyUrl) {
	const parsedProxyUrl = proxyUrl instanceof URL ? proxyUrl : proxyUrlWithDefaultScheme(proxyUrl, "https");
	const proxyTls = require_undici_global_dispatcher.resolveActiveManagedProxyTlsOptions({ proxyUrl: parsedProxyUrl.href });
	return {
		httpAgent: createFixedNodeProxyAgent(parsedProxyUrl, {
			protocol: "http",
			proxyTls
		}),
		httpsAgent: createFixedNodeProxyAgent(parsedProxyUrl, {
			protocol: "https",
			proxyTls
		})
	};
}
//#endregion
//#region src/llm/utils/node-http-proxy.ts
/** Resolves the environment proxy URL that applies to a target URL. */
function resolveHttpProxyUrlForTarget(targetUrl) {
	return resolveEnvNodeProxyUrlForTarget(targetUrl);
}
/** Builds fixed HTTP and HTTPS proxy agents for a target URL, when env proxy config applies. */
function createHttpProxyAgentsForTarget(targetUrl) {
	const proxyUrl = resolveHttpProxyUrlForTarget(targetUrl);
	if (!proxyUrl) return;
	return createFixedNodeProxyAgentPair(proxyUrl);
}
//#endregion
//#region src/plugin-sdk/llm.ts
var llm_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	AssistantMessageEventStream: () => AssistantMessageEventStream,
	adjustMaxTokensForThinking: () => _gabrielvfonseca_ai_internal_shared.adjustMaxTokensForThinking,
	buildBaseOptions: () => _gabrielvfonseca_ai_internal_shared.buildBaseOptions,
	calculateCost: () => _gabrielvfonseca_ai_internal_runtime.calculateCost,
	clampReasoning: () => _gabrielvfonseca_ai_internal_shared.clampReasoning,
	clampThinkingLevel: () => _gabrielvfonseca_ai_internal_runtime.clampThinkingLevel,
	complete: () => _gabrielvfonseca_ai_internal_runtime.complete,
	completeSimple: () => _gabrielvfonseca_ai_internal_runtime.completeSimple,
	createAssistantMessageEventStream: () => createAssistantMessageEventStream,
	createHttpProxyAgentsForTarget: () => createHttpProxyAgentsForTarget,
	getApiProvider: () => _gabrielvfonseca_ai_internal_runtime.getApiProvider,
	getApiProviders: () => _gabrielvfonseca_ai_internal_runtime.getApiProviders,
	getEnvApiKey: () => _gabrielvfonseca_ai_internal_runtime.getEnvApiKey,
	parseStreamingJson: () => _gabrielvfonseca_ai_internal_runtime.parseStreamingJson,
	registerApiProvider: () => _gabrielvfonseca_ai_internal_runtime.registerApiProvider,
	sanitizeSurrogates: () => _gabrielvfonseca_ai_internal_runtime.sanitizeSurrogates,
	stream: () => _gabrielvfonseca_ai_internal_runtime.stream,
	streamSimple: () => _gabrielvfonseca_ai_internal_runtime.streamSimple,
	transformMessages: () => _gabrielvfonseca_ai_internal_shared.transformMessages,
	unregisterApiProviders: () => _gabrielvfonseca_ai_internal_runtime.unregisterApiProviders,
	validateToolArguments: () => validateToolArguments$1,
	validateToolCall: () => validateToolCall$1
});
//#endregion
//#region packages/agent-core/src/harness/types.ts
/** Error returned by compaction helpers. */
var CompactionError = class extends Error {
	constructor(code, message, cause) {
		super(message, cause === void 0 ? void 0 : { cause });
		this.name = "CompactionError";
		this.code = code;
	}
};
/** Error returned by branch summarization helpers. */
var BranchSummaryError = class extends Error {
	constructor(code, message, cause) {
		super(message, cause === void 0 ? void 0 : { cause });
		this.name = "BranchSummaryError";
		this.code = code;
	}
};
//#endregion
//#region packages/agent-core/src/harness/session/timestamps.ts
/** Parse an ISO-like session timestamp to milliseconds. */
function parseSessionTimestampMs(value) {
	if (typeof value !== "string" || !value.trim()) return;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : void 0;
}
/** Parse a required timestamp or throw a labeled validation error. */
function requireSessionTimestampMs(value, label) {
	const parsed = parseSessionTimestampMs(value);
	if (parsed === void 0) throw new Error(`${label} must be a valid timestamp`);
	return parsed;
}
//#endregion
//#region packages/agent-core/src/harness/messages.ts
function asAgentMessage(message) {
	return message;
}
function normalizeCompactionSummaryTimestamp(timestamp) {
	if (typeof timestamp === "number") return timestamp;
	return parseSessionTimestampMs(timestamp) ?? 0;
}
const COMPACTION_SUMMARY_PREFIX = `The conversation history before this point was compacted into the following summary:

<summary>
`;
const COMPACTION_SUMMARY_SUFFIX = `
</summary>`;
const BRANCH_SUMMARY_PREFIX = `The following is a summary of a branch that this conversation came back from:

<summary>
`;
const BRANCH_SUMMARY_SUFFIX = `</summary>`;
/** Render a shell execution record as user-visible context text for the model. */
function bashExecutionToText(msg) {
	let text = `Ran \`${msg.command}\`\n`;
	if (msg.output) text += `\`\`\`\n${msg.output}\n\`\`\``;
	else text += "(no output)";
	if (msg.cancelled) text += "\n\n(command cancelled)";
	else if (msg.exitCode !== null && msg.exitCode !== void 0 && msg.exitCode !== 0) text += `\n\nCommand exited with code ${msg.exitCode}`;
	if (msg.truncated && msg.fullOutputPath) text += `\n\n[Output truncated. Full output: ${msg.fullOutputPath}]`;
	return text;
}
/** Build a persisted branch summary message from the repository timestamp string. */
function createBranchSummaryMessage(summary, fromId, timestamp) {
	return {
		role: "branchSummary",
		summary,
		fromId,
		timestamp: requireSessionTimestampMs(timestamp, "branch summary timestamp")
	};
}
/** Build a persisted compaction summary message from the repository timestamp string. */
function createCompactionSummaryMessage(summary, tokensBefore, timestamp) {
	return {
		role: "compactionSummary",
		summary,
		tokensBefore,
		timestamp: requireSessionTimestampMs(timestamp, "compaction summary timestamp")
	};
}
/** Build a custom transcript message that can be shown and replayed into context. */
function createCustomMessage(customType, content, display, details, timestamp) {
	return {
		role: "custom",
		customType,
		content,
		display,
		details,
		timestamp: requireSessionTimestampMs(timestamp, "custom message timestamp")
	};
}
/** Convert harness transcript messages into the LLM-facing message sequence. */
function convertToLlm(messages) {
	return messages.map((m) => {
		const message = m;
		switch (message.role) {
			case "bashExecution":
				if (message.excludeFromContext) return;
				return {
					role: "user",
					content: [{
						type: "text",
						text: bashExecutionToText(message)
					}],
					timestamp: message.timestamp
				};
			case "custom": {
				const content = typeof message.content === "string" ? [{
					type: "text",
					text: message.content
				}] : message.content;
				const runtimeContextCarrier = message.details?.runtimeContextCarrier === true;
				return {
					role: "user",
					content,
					timestamp: message.timestamp,
					...runtimeContextCarrier ? { runtimeContextCarrier: true } : {}
				};
			}
			case "branchSummary": return {
				role: "user",
				content: [{
					type: "text",
					text: BRANCH_SUMMARY_PREFIX + message.summary + BRANCH_SUMMARY_SUFFIX
				}],
				timestamp: message.timestamp
			};
			case "compactionSummary": return {
				role: "user",
				content: [{
					type: "text",
					text: COMPACTION_SUMMARY_PREFIX + message.summary + COMPACTION_SUMMARY_SUFFIX
				}],
				timestamp: normalizeCompactionSummaryTimestamp(message.timestamp)
			};
			case "user":
			case "assistant":
			case "toolResult": return message;
			default: return;
		}
	}).filter((m) => m !== void 0);
}
//#endregion
//#region packages/agent-core/src/harness/session/session.ts
/** Build model context from the active session branch and its latest state markers. */
function buildSessionContext$1(pathEntries) {
	let thinkingLevel = "off";
	let model = null;
	let compaction = null;
	for (const entry of pathEntries) if (entry.type === "thinking_level_change") thinkingLevel = entry.thinkingLevel;
	else if (entry.type === "model_change") model = {
		provider: entry.provider,
		modelId: entry.modelId
	};
	else if (entry.type === "message" && entry.message.role === "assistant") model = {
		provider: entry.message.provider,
		modelId: entry.message.model
	};
	else if (entry.type === "compaction") compaction = entry;
	const messages = [];
	const appendMessage = (entry) => {
		if (entry.type === "message") messages.push(entry.message);
		else if (entry.type === "custom_message") messages.push(asAgentMessage(createCustomMessage(entry.customType, entry.content, entry.display, entry.details, entry.timestamp)));
		else if (entry.type === "branch_summary" && entry.summary) messages.push(asAgentMessage(createBranchSummaryMessage(entry.summary, entry.fromId, entry.timestamp)));
	};
	if (compaction) {
		messages.push(asAgentMessage(createCompactionSummaryMessage(compaction.summary, compaction.tokensBefore, compaction.timestamp)));
		const compactionIdx = pathEntries.findIndex((e) => e.type === "compaction" && e.id === compaction.id);
		let foundFirstKept = false;
		for (const entry of pathEntries.slice(0, compactionIdx)) {
			if (entry.id === compaction.firstKeptEntryId) foundFirstKept = true;
			if (foundFirstKept) appendMessage(entry);
		}
		for (const entry of pathEntries.slice(compactionIdx + 1)) appendMessage(entry);
	} else for (const entry of pathEntries) appendMessage(entry);
	return {
		messages,
		thinkingLevel,
		model
	};
}
//#endregion
//#region packages/agent-core/src/harness/compaction/utils.ts
/** Create an empty file-operation accumulator. */
function createFileOps() {
	return {
		read: /* @__PURE__ */ new Set(),
		written: /* @__PURE__ */ new Set(),
		edited: /* @__PURE__ */ new Set()
	};
}
/** Add file operations from assistant tool calls to an accumulator. */
function extractFileOpsFromMessage(message, fileOps) {
	if (message.role !== "assistant") return;
	if (!("content" in message) || !Array.isArray(message.content)) return;
	for (const block of message.content) {
		if (typeof block !== "object" || block === null) continue;
		if (!("type" in block) || block.type !== "toolCall") continue;
		if (!("arguments" in block) || !("name" in block)) continue;
		const args = block.arguments;
		if (!args) continue;
		const path = typeof args.path === "string" ? args.path : void 0;
		if (!path) continue;
		switch (block.name) {
			case "read":
				fileOps.read.add(path);
				break;
			case "write":
				fileOps.written.add(path);
				break;
			case "edit":
				fileOps.edited.add(path);
				break;
		}
	}
}
/** Compute sorted read-only and modified file lists from accumulated operations. */
function computeFileLists(fileOps) {
	const modified = /* @__PURE__ */ new Set([...fileOps.edited, ...fileOps.written]);
	return {
		readFiles: [...fileOps.read].filter((f) => !modified.has(f)).toSorted(),
		modifiedFiles: [...modified].toSorted()
	};
}
/** Format file lists as summary metadata tags. */
function formatFileOperations(readFiles, modifiedFiles) {
	const sections = [];
	if (readFiles.length > 0) sections.push(`<read-files>\n${readFiles.join("\n")}\n</read-files>`);
	if (modifiedFiles.length > 0) sections.push(`<modified-files>\n${modifiedFiles.join("\n")}\n</modified-files>`);
	if (sections.length === 0) return "";
	return `\n\n${sections.join("\n\n")}`;
}
const TOOL_RESULT_MAX_CHARS = 2e3;
function safeJsonStringify$1(value) {
	try {
		return JSON.stringify(value) ?? "undefined";
	} catch {
		return "[unserializable]";
	}
}
function truncateForSummary(text, maxChars) {
	if (text.length <= maxChars) return text;
	const sliced = (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, maxChars);
	return `${sliced}\n\n[... ${text.length - sliced.length} more characters truncated]`;
}
/** Extract text that compaction both estimates and includes in summary prompts. */
function getCompactionContentBlockText(block) {
	if (block.type === "text" && block.text) return block.text;
	if (block.type !== "toolResult" && block.type !== "tool_result") return "";
	if (block.text) return block.text;
	return typeof block.content === "string" ? block.content : "";
}
/** Serialize LLM messages to plain text for summarization prompts. */
function serializeConversation(messages) {
	const parts = [];
	for (const msg of messages) if (msg.role === "user") {
		const content = typeof msg.content === "string" ? msg.content : msg.content.filter((c) => c.type === "text").map((c) => c.text).join("");
		if (content) parts.push(`[User]: ${content}`);
	} else if (msg.role === "assistant") {
		const textParts = [];
		const thinkingParts = [];
		const toolCalls = [];
		for (const block of msg.content) if (block.type === "text") textParts.push(block.text);
		else if (block.type === "thinking") thinkingParts.push(block.thinking);
		else if (block.type === "toolCall") {
			const args = block.arguments;
			const argsStr = Object.entries(args).map(([k, v]) => `${k}=${safeJsonStringify$1(v)}`).join(", ");
			toolCalls.push(`${block.name}(${argsStr})`);
		}
		if (thinkingParts.length > 0) parts.push(`[Assistant thinking]: ${thinkingParts.join("\n")}`);
		if (textParts.length > 0) parts.push(`[Assistant]: ${textParts.join("\n")}`);
		if (toolCalls.length > 0) parts.push(`[Assistant tool calls]: ${toolCalls.join("; ")}`);
	} else if (msg.role === "toolResult") {
		const content = msg.content.map(getCompactionContentBlockText).join("");
		if (content) parts.push(`[Tool result]: ${truncateForSummary(content, TOOL_RESULT_MAX_CHARS)}`);
	}
	return parts.join("\n\n");
}
//#endregion
//#region packages/agent-core/src/harness/compaction/compaction.ts
function safeJsonStringify(value) {
	try {
		return JSON.stringify(value) ?? "undefined";
	} catch {
		return "[unserializable]";
	}
}
function extractFileOperations(messages, entries, prevCompactionIndex) {
	const fileOps = createFileOps();
	if (prevCompactionIndex >= 0) {
		const prevCompaction = entries[prevCompactionIndex];
		if (!prevCompaction.fromHook && prevCompaction.details) {
			const details = prevCompaction.details;
			if (Array.isArray(details.readFiles)) for (const f of details.readFiles) fileOps.read.add(f);
			if (Array.isArray(details.modifiedFiles)) for (const f of details.modifiedFiles) fileOps.edited.add(f);
		}
	}
	for (const msg of messages) extractFileOpsFromMessage(msg, fileOps);
	return fileOps;
}
function getMessageFromEntry$1(entry) {
	if (entry.type === "message") return entry.message;
	if (entry.type === "custom_message") return asAgentMessage(createCustomMessage(entry.customType, entry.content, entry.display, entry.details, entry.timestamp));
	if (entry.type === "branch_summary") return asAgentMessage(createBranchSummaryMessage(entry.summary, entry.fromId, entry.timestamp));
	if (entry.type === "compaction") return asAgentMessage(createCompactionSummaryMessage(entry.summary, entry.tokensBefore, entry.timestamp));
}
function getMessageFromEntryForCompaction(entry) {
	if (entry.type === "compaction") return;
	return getMessageFromEntry$1(entry);
}
/** Default compaction settings used by the harness. */
const DEFAULT_COMPACTION_SETTINGS = {
	enabled: true,
	reserveTokens: 16384,
	keepRecentTokens: 2e4
};
/** Calculate total context tokens from provider usage. */
function calculateContextTokens(usage) {
	if (usage.contextUsage?.state === "available") return usage.contextUsage.totalTokens;
	return usage.totalTokens || usage.input + usage.output + usage.cacheRead + usage.cacheWrite;
}
function getAssistantUsage(msg) {
	if (msg.role === "assistant" && "usage" in msg) {
		const assistantMsg = msg;
		if (assistantMsg.stopReason !== "aborted" && assistantMsg.stopReason !== "error" && assistantMsg.usage) return assistantMsg.usage;
	}
}
/** Return usage from the last successful assistant message in session entries. */
function getLastAssistantUsage(entries) {
	for (const entry of entries.toReversed()) if (entry.type === "message") {
		const usage = getAssistantUsage(entry.message);
		if (usage) return usage;
	}
}
function getLastAssistantUsageInfo(messages) {
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages.at(i);
		if (!message) continue;
		const usage = getAssistantUsage(message);
		if (usage && usage.contextUsage?.state !== "unavailable") return {
			usage,
			index: i
		};
	}
}
/** Estimate context tokens for messages using provider usage when available. */
function estimateContextTokens(messages) {
	const usageInfo = getLastAssistantUsageInfo(messages);
	if (!usageInfo) {
		let estimated = 0;
		for (const message of messages) estimated += estimateTokens(message);
		return {
			tokens: estimated,
			usageTokens: 0,
			trailingTokens: estimated,
			lastUsageIndex: null
		};
	}
	const usageTokens = calculateContextTokens(usageInfo.usage);
	let trailingTokens = 0;
	for (const message of messages.slice(usageInfo.index + 1)) trailingTokens += estimateTokens(message);
	return {
		tokens: usageTokens + trailingTokens,
		usageTokens,
		trailingTokens,
		lastUsageIndex: usageInfo.index
	};
}
/** Return whether context usage exceeds the configured compaction threshold. */
function shouldCompact(contextTokens, contextWindow, settings) {
	if (!settings.enabled) return false;
	return contextTokens > contextWindow - settings.reserveTokens;
}
const IMAGE_BLOCK_CHARS = 4800;
function countContentBlockChars(content) {
	let chars = 0;
	for (const block of content) if (block.type === "image") chars += IMAGE_BLOCK_CHARS;
	else chars += getCompactionContentBlockText(block).length;
	return chars;
}
/** Estimate token count for one message using a conservative character heuristic. */
function estimateTokens(message) {
	let chars = 0;
	const harnessMessage = message;
	switch (harnessMessage.role) {
		case "user": {
			const content = harnessMessage.content;
			if (typeof content === "string") chars = content.length;
			else if (Array.isArray(content)) chars = countContentBlockChars(content);
			return Math.ceil(chars / 4);
		}
		case "assistant": {
			const assistant = harnessMessage;
			for (const block of assistant.content) if (block.type === "text") chars += block.text.length;
			else if (block.type === "thinking") chars += block.thinking.length;
			else if (block.type === "toolCall") chars += block.name.length + safeJsonStringify(block.arguments).length;
			return Math.ceil(chars / 4);
		}
		case "custom":
		case "toolResult":
			if (typeof harnessMessage.content === "string") chars = harnessMessage.content.length;
			else chars = countContentBlockChars(harnessMessage.content);
			return Math.ceil(chars / 4);
		case "bashExecution":
			chars = harnessMessage.command.length + harnessMessage.output.length;
			return Math.ceil(chars / 4);
		case "branchSummary":
		case "compactionSummary":
			chars = harnessMessage.summary.length;
			return Math.ceil(chars / 4);
	}
	return 0;
}
function findValidCutPoints(entries, startIndex, endIndex) {
	const cutPoints = [];
	for (let i = startIndex; i < endIndex; i++) {
		const entry = entries[i];
		if (!entry) continue;
		switch (entry.type) {
			case "message":
				switch (entry.message.role) {
					case "bashExecution":
					case "custom":
					case "branchSummary":
					case "compactionSummary":
					case "user":
					case "assistant":
						cutPoints.push(i);
						break;
					case "toolResult": break;
				}
				break;
			case "thinking_level_change":
			case "model_change":
			case "compaction":
			case "branch_summary":
			case "custom":
			case "custom_message":
			case "label":
			case "session_info":
			case "leaf": break;
		}
		if (entry.type === "branch_summary" || entry.type === "custom_message") cutPoints.push(i);
	}
	return cutPoints;
}
/** Find the user-visible message that starts the turn containing an entry. */
function findTurnStartIndex(entries, entryIndex, startIndex) {
	for (let i = entryIndex; i >= startIndex; i--) {
		const entry = entries[i];
		if (!entry) continue;
		if (entry.type === "branch_summary" || entry.type === "custom_message") return i;
		if (entry.type === "message") {
			const role = entry.message.role;
			if (role === "user" || role === "bashExecution") return i;
		}
	}
	return -1;
}
/** Find the compaction cut point that keeps approximately the requested recent-token budget. */
function findCutPoint(entries, startIndex, endIndex, keepRecentTokens) {
	const cutPoints = findValidCutPoints(entries, startIndex, endIndex);
	if (cutPoints.length === 0) return {
		firstKeptEntryIndex: startIndex,
		turnStartIndex: -1,
		isSplitTurn: false
	};
	let accumulatedTokens = 0;
	const firstCutIndex = cutPoints.at(0);
	if (firstCutIndex === void 0) return {
		firstKeptEntryIndex: startIndex,
		turnStartIndex: -1,
		isSplitTurn: false
	};
	let cutIndex = firstCutIndex;
	for (let i = endIndex - 1; i >= startIndex; i--) {
		const entry = entries[i];
		if (entry?.type !== "message") continue;
		const messageTokens = estimateTokens(entry.message);
		accumulatedTokens += messageTokens;
		if (accumulatedTokens >= keepRecentTokens) {
			const lastCutIndex = cutPoints.at(-1);
			if (lastCutIndex === void 0) throw new Error("compaction cut-point list became empty during selection");
			cutIndex = lastCutIndex;
			for (const cutPoint of cutPoints) if (cutPoint >= i) {
				cutIndex = cutPoint;
				break;
			}
			break;
		}
	}
	while (cutIndex > startIndex) {
		const prevEntry = entries[cutIndex - 1];
		if (!prevEntry) break;
		if (prevEntry.type === "compaction") break;
		if (prevEntry.type === "message") break;
		cutIndex--;
	}
	const cutEntry = entries[cutIndex];
	if (!cutEntry) throw new Error("compaction cut point does not reference a session entry");
	const isUserMessage = cutEntry.type === "message" && cutEntry.message.role === "user";
	const turnStartIndex = isUserMessage ? -1 : findTurnStartIndex(entries, cutIndex, startIndex);
	return {
		firstKeptEntryIndex: cutIndex,
		turnStartIndex,
		isSplitTurn: !isUserMessage && turnStartIndex !== -1
	};
}
const SUMMARIZATION_SYSTEM_PROMPT = `You are a context summarization assistant. Your task is to read a conversation between a user and an AI assistant, then produce a structured summary following the exact format specified.

Do NOT continue the conversation. Do NOT respond to any questions in the conversation. ONLY output the structured summary.`;
const SUMMARIZATION_PROMPT = `The messages above are a conversation to summarize. Create a structured context checkpoint summary that another LLM will use to continue the work.

Use this EXACT format:

## Goal
[What is the user trying to accomplish? Can be multiple items if the session covers different tasks.]

## Constraints & Preferences
- [Any constraints, preferences, or requirements mentioned by user]
- [Or "(none)" if none were mentioned]

## Progress
### Done
- [x] [Completed tasks/changes]

### In Progress
- [ ] [Current work]

### Blocked
- [Issues preventing progress, if any]

## Key Decisions
- **[Decision]**: [Brief rationale]

## Next Steps
1. [Ordered list of what should happen next]

## Critical Context
- [Any data, examples, or references needed to continue]
- [Or "(none)" if not applicable]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;
const UPDATE_SUMMARIZATION_PROMPT = `The messages above are NEW conversation messages to incorporate into the existing summary provided in <previous-summary> tags.

Update the existing structured summary with new information. RULES:
- PRESERVE all existing information from the previous summary
- ADD new progress, decisions, and context from the new messages
- UPDATE the Progress section: move items from "In Progress" to "Done" when completed
- UPDATE "Next Steps" based on what was accomplished
- PRESERVE exact file paths, function names, and error messages
- If something is no longer relevant, you may remove it

Use this EXACT format:

## Goal
[Preserve existing goals, add new ones if the task expanded]

## Constraints & Preferences
- [Preserve existing, add new ones discovered]

## Progress
### Done
- [x] [Include previously done items AND newly completed items]

### In Progress
- [ ] [Current work - update based on progress]

### Blocked
- [Current blockers - remove if resolved]

## Key Decisions
- **[Decision]**: [Brief rationale] (preserve all previous, add new)

## Next Steps
1. [Update based on current state]

## Critical Context
- [Preserve important context, add new if needed]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;
function createSummarizationOptions(model, maxTokens, apiKey, headers, signal, thinkingLevel) {
	const options = {
		maxTokens,
		signal,
		apiKey,
		headers
	};
	const fableReasoning = (model.api === "anthropic-messages" || model.api === "bedrock-converse-stream") && resolveClaudeFable5ModelIdentity(model) !== void 0;
	if ((model.reasoning || fableReasoning) && thinkingLevel) options.reasoning = resolveAgentReasoningOption(model, thinkingLevel);
	return options;
}
async function completeSummarization(model, context, options, streamFn, runtime) {
	if (streamFn) return (await streamFn(model, context, options)).result();
	return await resolveAgentCoreCompleteFn(runtime)(model, context, options);
}
/** Runs one summarization completion and maps abort/error stops to CompactionError. */
async function runSummarizationCompletion(params) {
	const summarizationMessages = [{
		role: "user",
		content: [{
			type: "text",
			text: params.promptText
		}],
		timestamp: Date.now()
	}];
	const response = await completeSummarization(params.model, {
		systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
		messages: summarizationMessages
	}, createSummarizationOptions(params.model, params.maxTokens, params.apiKey, params.headers, params.signal, params.thinkingLevel), params.streamFn, params.runtime);
	if (response.stopReason === "aborted") return (0, _gabrielvfonseca_normalization_core_result.err)(new CompactionError("aborted", response.errorMessage || `${params.errorLabel} aborted`));
	if (response.stopReason === "error") return (0, _gabrielvfonseca_normalization_core_result.err)(new CompactionError("summarization_failed", `${params.errorLabel} failed: ${response.errorMessage || "Unknown error"}`));
	return (0, _gabrielvfonseca_normalization_core_result.ok)(response.content.filter((c) => c.type === "text").map((c) => c.text).join("\n"));
}
/** Generate or update a conversation summary for compaction. */
async function generateSummary(currentMessages, model, reserveTokens, apiKey, headers, signal, customInstructions, previousSummary, thinkingLevel, streamFn, runtime) {
	const maxTokens = Math.min(Math.floor(.8 * reserveTokens), model.maxTokens > 0 ? model.maxTokens : Number.POSITIVE_INFINITY);
	let basePrompt = previousSummary ? UPDATE_SUMMARIZATION_PROMPT : SUMMARIZATION_PROMPT;
	if (customInstructions) basePrompt = `${basePrompt}\n\nAdditional focus: ${customInstructions}`;
	let promptText = `<conversation>\n${serializeConversation(convertToLlm(currentMessages))}\n</conversation>\n\n`;
	if (previousSummary) promptText += `<previous-summary>\n${previousSummary}\n</previous-summary>\n\n`;
	promptText += basePrompt;
	return await runSummarizationCompletion({
		promptText,
		model,
		maxTokens,
		apiKey,
		headers,
		signal,
		thinkingLevel,
		streamFn,
		runtime,
		errorLabel: "Summarization"
	});
}
/** Prepare session entries for compaction, or return undefined when compaction is not applicable. */
function prepareCompaction(pathEntries, settings) {
	if (pathEntries.at(-1)?.type === "compaction" || pathEntries.length === 0) return (0, _gabrielvfonseca_normalization_core_result.ok)(void 0);
	let prevCompactionIndex = -1;
	for (let i = pathEntries.length - 1; i >= 0; i--) if (pathEntries.at(i)?.type === "compaction") {
		prevCompactionIndex = i;
		break;
	}
	let previousSummary;
	let boundaryStart = 0;
	if (prevCompactionIndex >= 0) {
		const prevCompaction = pathEntries[prevCompactionIndex];
		previousSummary = prevCompaction.summary;
		const firstKeptEntryIndex = pathEntries.findIndex((entry) => entry.id === prevCompaction.firstKeptEntryId);
		boundaryStart = firstKeptEntryIndex >= 0 ? firstKeptEntryIndex : prevCompactionIndex + 1;
	}
	const boundaryEnd = pathEntries.length;
	const tokensBefore = estimateContextTokens(buildSessionContext$1(pathEntries).messages).tokens;
	const cutPoint = findCutPoint(pathEntries, boundaryStart, boundaryEnd, settings.keepRecentTokens);
	const firstKeptEntry = pathEntries[cutPoint.firstKeptEntryIndex];
	if (!firstKeptEntry?.id) return (0, _gabrielvfonseca_normalization_core_result.err)(new CompactionError("invalid_session", "First kept entry has no UUID - session may need migration"));
	const firstKeptEntryId = firstKeptEntry.id;
	const historyEnd = cutPoint.isSplitTurn ? cutPoint.turnStartIndex : cutPoint.firstKeptEntryIndex;
	const messagesToSummarize = [];
	for (let i = boundaryStart; i < historyEnd; i++) {
		const entry = pathEntries.at(i);
		const msg = entry ? getMessageFromEntryForCompaction(entry) : void 0;
		if (msg) messagesToSummarize.push(msg);
	}
	const turnPrefixMessages = [];
	if (cutPoint.isSplitTurn) for (let i = cutPoint.turnStartIndex; i < cutPoint.firstKeptEntryIndex; i++) {
		const entry = pathEntries.at(i);
		const msg = entry ? getMessageFromEntryForCompaction(entry) : void 0;
		if (msg) turnPrefixMessages.push(msg);
	}
	const fileOps = extractFileOperations(messagesToSummarize, pathEntries, prevCompactionIndex);
	if (cutPoint.isSplitTurn) for (const msg of turnPrefixMessages) extractFileOpsFromMessage(msg, fileOps);
	return (0, _gabrielvfonseca_normalization_core_result.ok)({
		firstKeptEntryId,
		messagesToSummarize,
		turnPrefixMessages,
		isSplitTurn: cutPoint.isSplitTurn,
		tokensBefore,
		previousSummary,
		fileOps,
		settings
	});
}
const TURN_PREFIX_SUMMARIZATION_PROMPT = `This is the PREFIX of a turn that was too large to keep. The SUFFIX (recent work) is retained.

Summarize the prefix to provide context for the retained suffix:

## Original Request
[What did the user ask for in this turn?]

## Early Progress
- [Key decisions and work done in the prefix]

## Context for Suffix
- [Information needed to understand the retained recent work]

Be concise. Focus on what's needed to understand the kept suffix.`;
/** Generate compaction summary data from prepared session history. */
async function compact(preparation, model, apiKey, headers, customInstructions, signal, thinkingLevel, streamFn, runtime) {
	const { firstKeptEntryId, messagesToSummarize, turnPrefixMessages, isSplitTurn, tokensBefore, previousSummary, fileOps, settings } = preparation;
	if (!firstKeptEntryId) return (0, _gabrielvfonseca_normalization_core_result.err)(new CompactionError("invalid_session", "First kept entry has no UUID - session may need migration"));
	let summary;
	if (isSplitTurn && turnPrefixMessages.length > 0) {
		const historyResult = messagesToSummarize.length > 0 ? await generateSummary(messagesToSummarize, model, settings.reserveTokens, apiKey, headers, signal, customInstructions, previousSummary, thinkingLevel, streamFn, runtime) : (0, _gabrielvfonseca_normalization_core_result.ok)("No prior history.");
		if (!historyResult.ok) return (0, _gabrielvfonseca_normalization_core_result.err)(historyResult.error);
		const turnPrefixResult = await generateTurnPrefixSummary(turnPrefixMessages, model, settings.reserveTokens, apiKey, headers, signal, thinkingLevel, streamFn, runtime);
		if (!turnPrefixResult.ok) return (0, _gabrielvfonseca_normalization_core_result.err)(turnPrefixResult.error);
		summary = `${historyResult.value}\n\n---\n\n**Turn Context (split turn):**\n\n${turnPrefixResult.value}`;
	} else {
		const summaryResult = await generateSummary(messagesToSummarize, model, settings.reserveTokens, apiKey, headers, signal, customInstructions, previousSummary, thinkingLevel, streamFn, runtime);
		if (!summaryResult.ok) return (0, _gabrielvfonseca_normalization_core_result.err)(summaryResult.error);
		summary = summaryResult.value;
	}
	const { readFiles, modifiedFiles } = computeFileLists(fileOps);
	summary += formatFileOperations(readFiles, modifiedFiles);
	return (0, _gabrielvfonseca_normalization_core_result.ok)({
		summary,
		firstKeptEntryId,
		tokensBefore,
		details: {
			readFiles,
			modifiedFiles
		}
	});
}
async function generateTurnPrefixSummary(messages, model, reserveTokens, apiKey, headers, signal, thinkingLevel, streamFn, runtime) {
	const maxTokens = Math.min(Math.floor(.5 * reserveTokens), model.maxTokens > 0 ? model.maxTokens : Number.POSITIVE_INFINITY);
	return await runSummarizationCompletion({
		promptText: `<conversation>\n${serializeConversation(convertToLlm(messages))}\n</conversation>\n\n${TURN_PREFIX_SUMMARIZATION_PROMPT}`,
		model,
		maxTokens,
		apiKey,
		headers,
		signal,
		thinkingLevel,
		streamFn,
		runtime,
		errorLabel: "Turn prefix summarization"
	});
}
//#endregion
//#region packages/agent-core/src/harness/compaction/branch-summarization.ts
/** Collect entries that should be summarized before navigating to a different session tree entry. */
function collectEntriesForBranchSummaryFromBranches(oldBranch, targetBranch) {
	const oldPath = new Set(oldBranch.map((entry) => entry.id));
	let commonAncestorId = null;
	for (const targetEntry of targetBranch.toReversed()) if (oldPath.has(targetEntry.id)) {
		commonAncestorId = targetEntry.id;
		break;
	}
	const firstSummarizedIndex = commonAncestorId === null ? 0 : oldBranch.findIndex((entry) => entry.id === commonAncestorId) + 1;
	return {
		entries: oldBranch.slice(firstSummarizedIndex),
		commonAncestorId
	};
}
function getMessageFromEntry(entry) {
	switch (entry.type) {
		case "message":
			if (entry.message.role === "toolResult") return;
			return entry.message;
		case "custom_message": return asAgentMessage(createCustomMessage(entry.customType, entry.content, entry.display, entry.details, entry.timestamp));
		case "branch_summary": return asAgentMessage(createBranchSummaryMessage(entry.summary, entry.fromId, entry.timestamp));
		case "compaction": return asAgentMessage(createCompactionSummaryMessage(entry.summary, entry.tokensBefore, entry.timestamp));
		case "thinking_level_change":
		case "model_change":
		case "custom":
		case "label":
		case "session_info":
		case "leaf": return;
	}
}
/** Prepare branch entries for summarization within an optional token budget. */
function prepareBranchEntries(entries, tokenBudget = 0) {
	const messages = [];
	const fileOps = createFileOps();
	let totalTokens = 0;
	for (const entry of entries) if (entry.type === "branch_summary" && !entry.fromHook && entry.details) {
		const details = entry.details;
		if (Array.isArray(details.readFiles)) for (const f of details.readFiles) fileOps.read.add(f);
		if (Array.isArray(details.modifiedFiles)) for (const f of details.modifiedFiles) fileOps.edited.add(f);
	}
	for (const entry of entries.toReversed()) {
		const message = getMessageFromEntry(entry);
		if (!message) continue;
		extractFileOpsFromMessage(message, fileOps);
		const tokens = estimateTokens(message);
		if (tokenBudget > 0 && totalTokens + tokens > tokenBudget) {
			if (entry.type === "compaction" || entry.type === "branch_summary") {
				if (totalTokens < tokenBudget * .9) {
					messages.unshift(message);
					totalTokens += tokens;
				}
			}
			break;
		}
		messages.unshift(message);
		totalTokens += tokens;
	}
	return {
		messages,
		fileOps,
		totalTokens
	};
}
const BRANCH_SUMMARY_PREAMBLE = `The user explored a different conversation branch before returning here.
Summary of that exploration:

`;
const BRANCH_SUMMARY_PROMPT = `Create a structured summary of this conversation branch for context when returning later.

Use this EXACT format:

## Goal
[What was the user trying to accomplish in this branch?]

## Constraints & Preferences
- [Any constraints, preferences, or requirements mentioned]
- [Or "(none)" if none were mentioned]

## Progress
### Done
- [x] [Completed tasks/changes]

### In Progress
- [ ] [Work that was started but not finished]

### Blocked
- [Issues preventing progress, if any]

## Key Decisions
- **[Decision]**: [Brief rationale]

## Next Steps
1. [What should happen next to continue this work]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;
/** Generate a summary for abandoned branch entries. */
async function generateBranchSummary(entries, options) {
	const { model, apiKey, headers, signal, customInstructions, replaceInstructions, reserveTokens = 16384 } = options;
	const { messages, fileOps } = prepareBranchEntries(entries, (model.contextWindow || 128e3) - reserveTokens);
	if (messages.length === 0) return (0, _gabrielvfonseca_normalization_core_result.ok)({
		summary: "No content to summarize",
		readFiles: [],
		modifiedFiles: []
	});
	const conversationText = serializeConversation(convertToLlm(messages));
	let instructions;
	if (replaceInstructions && customInstructions) instructions = customInstructions;
	else if (customInstructions) instructions = `${BRANCH_SUMMARY_PROMPT}\n\nAdditional focus: ${customInstructions}`;
	else instructions = BRANCH_SUMMARY_PROMPT;
	const context = {
		systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
		messages: [{
			role: "user",
			content: [{
				type: "text",
				text: `<conversation>\n${conversationText}\n</conversation>\n\n${instructions}`
			}],
			timestamp: Date.now()
		}]
	};
	const streamOptions = {
		apiKey,
		headers,
		signal,
		maxTokens: 2048
	};
	const response = options.streamFn ? await (await options.streamFn(model, context, streamOptions)).result() : await resolveAgentCoreCompleteFn(options.runtime)(model, context, streamOptions);
	if (response.stopReason === "aborted") return (0, _gabrielvfonseca_normalization_core_result.err)(new BranchSummaryError("aborted", response.errorMessage || "Branch summary aborted"));
	if (response.stopReason === "error") return (0, _gabrielvfonseca_normalization_core_result.err)(new BranchSummaryError("summarization_failed", `Branch summary failed: ${response.errorMessage || "Unknown error"}`));
	let summary = response.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
	summary = BRANCH_SUMMARY_PREAMBLE + summary;
	const { readFiles, modifiedFiles } = computeFileLists(fileOps);
	summary += formatFileOperations(readFiles, modifiedFiles);
	return (0, _gabrielvfonseca_normalization_core_result.ok)({
		summary: summary || "No summary generated",
		readFiles,
		modifiedFiles
	});
}
//#endregion
//#region packages/agent-core/src/harness/session/uuid.ts
let lastTimestamp = -Infinity;
let sequence = 0;
function fillRandomBytes(bytes) {
	const crypto = globalThis.crypto;
	if (crypto?.getRandomValues) {
		crypto.getRandomValues(bytes);
		return;
	}
	for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
}
/** Generate a monotonic UUIDv7 string. */
function uuidv7() {
	const random = /* @__PURE__ */ new Uint8Array(16);
	fillRandomBytes(random);
	const timestamp = Date.now();
	if (timestamp > lastTimestamp) {
		sequence = new DataView(random.buffer, random.byteOffset + 6, 4).getUint32(0);
		lastTimestamp = timestamp;
	} else {
		sequence = sequence + 1 >>> 0;
		if (sequence === 0) lastTimestamp++;
	}
	const bytes = /* @__PURE__ */ new Uint8Array(16);
	bytes[0] = lastTimestamp / 1099511627776 & 255;
	bytes[1] = lastTimestamp / 4294967296 & 255;
	bytes[2] = lastTimestamp / 16777216 & 255;
	bytes[3] = lastTimestamp / 65536 & 255;
	bytes[4] = lastTimestamp / 256 & 255;
	bytes[5] = lastTimestamp & 255;
	bytes[6] = 112 | sequence >>> 28 & 15;
	bytes[7] = sequence >>> 20 & 255;
	bytes[8] = 128 | sequence >>> 14 & 63;
	bytes[9] = sequence >>> 6 & 255;
	const randomLowBits = random.at(10);
	if (randomLowBits === void 0) throw new Error("UUID random buffer is shorter than 11 bytes");
	bytes[10] = (sequence & 63) << 2 | randomLowBits & 3;
	bytes.set(random.subarray(11), 11);
	return formatUuid(bytes);
}
function formatUuid(bytes) {
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
	return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}
//#endregion
//#region packages/agent-core/src/harness/utils/truncate.ts
const DEFAULT_MAX_LINES = 2e3;
const DEFAULT_MAX_BYTES = 50 * 1024;
const runtimeBuffer = globalThis.Buffer;
function splitLinesForCounting(content) {
	if (content.length === 0) return [];
	const lines = content.split("\n");
	if (content.endsWith("\n")) lines.pop();
	return lines;
}
function findFirstNonAscii(content) {
	for (let index = 0; index < content.length; index++) if (content.charCodeAt(index) > 127) return index;
	return -1;
}
function utf8ByteLength(content) {
	if (runtimeBuffer) return runtimeBuffer.byteLength(content, "utf8");
	const firstNonAscii = findFirstNonAscii(content);
	if (firstNonAscii === -1) return content.length;
	let bytes = firstNonAscii;
	for (let i = firstNonAscii; i < content.length; i++) {
		const code = content.charCodeAt(i);
		if (code <= 127) bytes += 1;
		else if (code <= 2047) bytes += 2;
		else if (code >= 55296 && code <= 56319 && i + 1 < content.length) {
			const next = content.charCodeAt(i + 1);
			if (next >= 56320 && next <= 57343) {
				bytes += 4;
				i++;
			} else bytes += 3;
		} else bytes += 3;
	}
	return bytes;
}
function replaceUnpairedSurrogates(content) {
	let output = "";
	for (let i = 0; i < content.length; i++) {
		const code = content.charCodeAt(i);
		if (code >= 55296 && code <= 56319) {
			if (i + 1 < content.length) {
				const next = content.charCodeAt(i + 1);
				if (next >= 56320 && next <= 57343) {
					output += content.charAt(i) + content.charAt(i + 1);
					i++;
					continue;
				}
			}
			output += "�";
		} else if (code >= 56320 && code <= 57343) output += "�";
		else output += content.charAt(i);
	}
	return output;
}
/**
* Format byte counts for compact tool-output diagnostics.
*/
function formatSize(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
function resolveTruncationInput(content, options) {
	const maxLines = options.maxLines ?? 2e3;
	const maxBytes = options.maxBytes ?? 51200;
	const totalBytes = utf8ByteLength(content);
	const lines = splitLinesForCounting(content);
	return {
		lines,
		totalLines: lines.length,
		totalBytes,
		maxLines,
		maxBytes
	};
}
function buildTruncationResult(input, params) {
	return {
		content: params.content,
		truncated: params.truncated,
		truncatedBy: params.truncatedBy,
		totalLines: input.totalLines,
		totalBytes: input.totalBytes,
		outputLines: params.outputLines,
		outputBytes: params.outputBytes ?? utf8ByteLength(params.content),
		lastLinePartial: params.lastLinePartial ?? false,
		firstLineExceedsLimit: params.firstLineExceedsLimit ?? false,
		maxLines: input.maxLines,
		maxBytes: input.maxBytes
	};
}
/**
* Keep the beginning of content while respecting independent line and byte ceilings.
*
* Head truncation preserves complete lines; a first line that exceeds the byte
* ceiling produces empty output and sets firstLineExceedsLimit.
*/
function truncateHead(content, options = {}) {
	const input = resolveTruncationInput(content, options);
	if (input.totalLines <= input.maxLines && input.totalBytes <= input.maxBytes) return buildTruncationResult(input, {
		content,
		truncated: false,
		truncatedBy: null,
		outputLines: input.totalLines,
		outputBytes: input.totalBytes
	});
	const firstLine = input.lines[0];
	if (firstLine !== void 0 && utf8ByteLength(firstLine) > input.maxBytes) return buildTruncationResult(input, {
		content: "",
		truncated: true,
		truncatedBy: "bytes",
		outputLines: 0,
		outputBytes: 0,
		firstLineExceedsLimit: true
	});
	const outputLinesArr = [];
	let outputBytesCount = 0;
	let truncatedBy = input.totalLines > input.maxLines ? "lines" : "bytes";
	for (const [i, line] of input.lines.slice(0, input.maxLines).entries()) {
		const lineBytes = utf8ByteLength(line) + (i > 0 ? 1 : 0);
		if (outputBytesCount + lineBytes > input.maxBytes) {
			truncatedBy = "bytes";
			break;
		}
		outputLinesArr.push(line);
		outputBytesCount += lineBytes;
	}
	if (input.totalLines > input.maxLines && outputLinesArr.length >= input.maxLines && outputBytesCount <= input.maxBytes) truncatedBy = "lines";
	return buildTruncationResult(input, {
		content: outputLinesArr.join("\n"),
		truncated: true,
		truncatedBy,
		outputLines: outputLinesArr.length
	});
}
/**
* Keep the end of content while respecting independent line and byte ceilings.
*
* Tail truncation preserves recent output for command errors and may keep a
* partial first line when one final line alone exceeds the byte ceiling.
*/
function truncateTail(content, options = {}) {
	const input = resolveTruncationInput(content, options);
	if (input.totalLines <= input.maxLines && input.totalBytes <= input.maxBytes) return buildTruncationResult(input, {
		content,
		truncated: false,
		truncatedBy: null,
		outputLines: input.totalLines,
		outputBytes: input.totalBytes
	});
	const outputLinesArr = [];
	let outputBytesCount = 0;
	let truncatedBy = input.totalLines > input.maxLines ? "lines" : "bytes";
	let lastLinePartial = false;
	for (let i = input.lines.length - 1; i >= 0 && outputLinesArr.length < input.maxLines; i--) {
		const line = input.lines.at(i);
		if (line === void 0) continue;
		const lineBytes = utf8ByteLength(line) + (outputLinesArr.length > 0 ? 1 : 0);
		if (outputBytesCount + lineBytes > input.maxBytes) {
			truncatedBy = "bytes";
			if (outputLinesArr.length === 0) {
				const truncatedLine = truncateStringToBytesFromEnd(line, input.maxBytes);
				outputLinesArr.unshift(truncatedLine);
				outputBytesCount = utf8ByteLength(truncatedLine);
				lastLinePartial = true;
			}
			break;
		}
		outputLinesArr.unshift(line);
		outputBytesCount += lineBytes;
	}
	if (input.totalLines > input.maxLines && outputLinesArr.length >= input.maxLines && outputBytesCount <= input.maxBytes) truncatedBy = "lines";
	return buildTruncationResult(input, {
		content: outputLinesArr.join("\n"),
		truncated: true,
		truncatedBy,
		outputLines: outputLinesArr.length,
		lastLinePartial
	});
}
/**
* Truncate a string to fit within a byte limit (from the end).
* Handles multi-byte UTF-8 characters correctly.
*/
function truncateStringToBytesFromEnd(str, maxBytes) {
	if (maxBytes <= 0) return "";
	let outputBytes = 0;
	let start = str.length;
	let needsReplacement = false;
	for (let i = str.length; i > 0;) {
		let characterStart = i - 1;
		const code = str.charCodeAt(characterStart);
		let characterBytes;
		let unpairedSurrogate = false;
		if (code >= 56320 && code <= 57343 && characterStart > 0) {
			const previous = str.charCodeAt(characterStart - 1);
			if (previous >= 55296 && previous <= 56319) {
				characterStart--;
				characterBytes = 4;
			} else {
				characterBytes = 3;
				unpairedSurrogate = true;
			}
		} else if (code >= 55296 && code <= 57343) {
			characterBytes = 3;
			unpairedSurrogate = true;
		} else characterBytes = code <= 127 ? 1 : code <= 2047 ? 2 : 3;
		if (outputBytes + characterBytes > maxBytes) break;
		outputBytes += characterBytes;
		start = characterStart;
		needsReplacement ||= unpairedSurrogate;
		i = characterStart;
	}
	const output = str.slice(start);
	return needsReplacement ? replaceUnpairedSurrogates(output) : output;
}
/**
* Trim a single display line and mark it with the grep-style truncation suffix.
*
* The cut point is backed off by one code unit when it would otherwise split a
* surrogate pair, so emoji / CJK Extension B characters crossing the boundary
* stay intact instead of rendering as replacement characters.
*/
function truncateLine(line, maxChars = 500) {
	if (line.length <= maxChars) return {
		text: line,
		wasTruncated: false
	};
	let cut = maxChars;
	if (cut < line.length) {
		const lastCode = line.charCodeAt(cut - 1);
		if (lastCode >= 55296 && lastCode <= 56319) {
			const nextCode = line.charCodeAt(cut);
			if (nextCode >= 56320 && nextCode <= 57343) cut -= 1;
		}
	}
	return {
		text: `${line.slice(0, cut)}... [truncated]`,
		wasTruncated: true
	};
}
//#endregion
//#region src/agents/runtime/proxy.ts
/**
* Proxy stream function for apps that route LLM calls through a server.
* The server manages auth and proxies requests to LLM providers.
*/
//#endregion
//#region src/plugin-sdk/agent-core.ts
/** Runtime adapter that lets the package agent-core use Operator LLM helpers. */
const openClawAgentCoreRuntime = {
	completeSimple: _gabrielvfonseca_ai_internal_runtime.completeSimple,
	streamSimple: _gabrielvfonseca_ai_internal_runtime.streamSimple
};
/** Agent-core class preconfigured with Operator runtime dependencies. */
var Agent = class extends Agent$1 {
	constructor(options = {}) {
		super({
			runtime: openClawAgentCoreRuntime,
			...options
		});
	}
};
//#endregion
//#region src/agents/sessions/session-manager-id.ts
function createSessionId() {
	return uuidv7();
}
/** Generates a short collision-checked id, with a full UUID fallback. */
function generateSessionEntryId(existing) {
	for (let attempt = 0; attempt < 100; attempt += 1) {
		const id = (0, node_crypto.randomUUID)().slice(0, 8);
		if (!existing.has(id)) return id;
	}
	return (0, node_crypto.randomUUID)();
}
//#endregion
//#region src/agents/sessions/session-manager-codec.ts
function migrateV1ToV2(entries, entriesByOriginalIndex) {
	const ids = /* @__PURE__ */ new Set();
	let previousId = null;
	for (const entry of entries) {
		if (entry.type === "session") {
			entry.version = 2;
			continue;
		}
		entry.id = generateSessionEntryId(ids);
		ids.add(entry.id);
		entry.parentId = previousId;
		previousId = entry.id;
		if (entry.type === "compaction") {
			const compaction = entry;
			if (typeof compaction.firstKeptEntryIndex === "number") {
				const targetEntry = entriesByOriginalIndex?.[compaction.firstKeptEntryIndex] ?? entries[compaction.firstKeptEntryIndex];
				if (targetEntry && targetEntry.type !== "session") compaction.firstKeptEntryId = targetEntry.id;
				delete compaction.firstKeptEntryIndex;
			}
		}
	}
}
function migrateV2ToV3(entries) {
	for (const entry of entries) {
		if (entry.type === "session") {
			entry.version = 3;
			continue;
		}
		if (entry.type === "message" && entry.message) {
			const message = entry.message;
			if (message.role === "hookMessage") message.role = "custom";
		}
	}
}
function migrateToCurrentVersion(entries, entriesByOriginalIndex) {
	const version = entries.find((entry) => entry.type === "session")?.version ?? 1;
	if (version >= 3) return false;
	if (version < 2) migrateV1ToV2(entries, entriesByOriginalIndex);
	if (version < 3) migrateV2ToV3(entries);
	return true;
}
function migrateSessionEntries(entries) {
	migrateToCurrentVersion(entries);
}
function parseSessionEntries(content) {
	return parseJsonlEntries(content);
}
function getLatestCompactionEntry(entries) {
	for (const entry of entries.toReversed()) if (entry.type === "compaction") return entry;
	return null;
}
function buildSessionContext(entries, leafId, byIdInput) {
	let contextEntries = entries;
	let contextById = byIdInput;
	if (leafId === void 0) {
		const selectedEntries = require_transcript_tree.selectSessionTranscriptLeafControlledPath(entries);
		if (selectedEntries !== void 0) {
			contextEntries = selectedEntries;
			contextById = void 0;
		}
	}
	let byId = contextById;
	if (!byId) {
		byId = /* @__PURE__ */ new Map();
		for (const entry of contextEntries) byId.set(entry.id, entry);
	}
	if (leafId === null) return {
		messages: [],
		thinkingLevel: "off",
		model: null
	};
	let leaf = leafId ? byId.get(leafId) : void 0;
	leaf ??= contextEntries.at(-1);
	if (!leaf) return {
		messages: [],
		thinkingLevel: "off",
		model: null
	};
	const path = [];
	let current = leaf;
	while (current) {
		path.unshift(current);
		current = current.parentId ? byId.get(current.parentId) : void 0;
	}
	return buildSessionContext$1(path);
}
function parseJsonlEntries(content) {
	const entries = [];
	let skipped = 0;
	for (const line of content.trim().split("\n")) {
		if (!line.trim()) continue;
		try {
			entries.push(normalizeLoadedFileEntry(JSON.parse(line)));
		} catch {
			skipped += 1;
		}
	}
	if (skipped > 0) require_logger.logWarn(`parseJsonlEntries: skipped ${skipped} malformed JSONL line(s) — ${entries.length} valid entries were loaded`);
	return entries;
}
function normalizeLoadedFileEntry(entry) {
	if (!isJsonRecord(entry) || entry.type !== "message" || !isJsonRecord(entry.message)) return entry;
	const message = entry.message;
	if ((message.role === "assistant" || message.role === "toolResult") && typeof message.content === "string") message.content = [{
		type: "text",
		text: message.content
	}];
	else if (message.role === "toolResult" && isJsonRecord(message.content)) message.content = [message.content];
	return entry;
}
function hasReadableSessionHeader(entries) {
	const header = entries[0];
	return header?.type === "session" && typeof header.id === "string";
}
function isJsonRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isSessionEntryType(type) {
	switch (type) {
		case "message":
		case "thinking_level_change":
		case "model_change":
		case "compaction":
		case "branch_summary":
		case "custom":
		case "custom_message":
		case "label":
		case "session_info": return true;
		default: return false;
	}
}
function isIndexedSessionEntry(entry) {
	return isJsonRecord(entry) && isSessionEntryType(entry.type) && typeof entry.id === "string" && entry.id.length > 0;
}
function parseParentLinkedOpaqueEntry(record) {
	if (!isJsonRecord(record) || record.type === "session" || record.type === "leaf" || typeof record.id !== "string" || record.id.length === 0 || record.parentId !== null && typeof record.parentId !== "string") return;
	return {
		id: record.id,
		parentId: record.parentId
	};
}
function parseOpaqueLeafEntry(record) {
	if (!isJsonRecord(record) || record.type !== "leaf" || typeof record.id !== "string" || record.id.length === 0 || record.parentId !== null && typeof record.parentId !== "string" || record.targetId !== null && typeof record.targetId !== "string" || record.appendParentId !== void 0 && record.appendParentId !== null && typeof record.appendParentId !== "string" || record.appendMode !== void 0 && record.appendMode !== "side") return;
	return {
		id: record.id,
		parentId: record.parentId,
		targetId: record.targetId,
		...record.appendParentId !== void 0 ? { appendParentId: record.appendParentId } : {},
		...record.appendMode === "side" ? { appendMode: record.appendMode } : {}
	};
}
function partitionSessionFileEntries(entries) {
	const fileEntries = [];
	const opaqueEntries = [];
	const fileEntriesByOriginalIndex = [];
	const acceptsLegacyEntries = (entries.find((entry) => isJsonRecord(entry) && entry.type === "session" && typeof entry.id === "string")?.version ?? 1) < 2;
	let hasHeader = false;
	for (const [originalIndex, entry] of entries.entries()) {
		if (!hasHeader && isJsonRecord(entry) && entry.type === "session" && typeof entry.id === "string") {
			fileEntries.push(entry);
			fileEntriesByOriginalIndex[originalIndex] = entry;
			hasHeader = true;
			continue;
		}
		if (isIndexedSessionEntry(entry) || acceptsLegacyEntries && isJsonRecord(entry) && isSessionEntryType(entry.type)) {
			fileEntries.push(entry);
			fileEntriesByOriginalIndex[originalIndex] = entry;
			continue;
		}
		opaqueEntries.push({
			index: fileEntries.length,
			record: entry
		});
	}
	return {
		fileEntries,
		opaqueEntries,
		fileEntriesByOriginalIndex
	};
}
//#endregion
//#region src/agents/session-file-repair.ts
/**
* Persisted session JSONL repair helpers.
* Drops malformed transcript entries, rewrites unreplayable blank/error turns,
* and inserts missing code-mode tool results before replay.
*/
/**
* Placeholder for blank user messages.
* Preserves the user turn so strict providers that require at least one user
* message do not reject the transcript.
*/
const BLANK_USER_FALLBACK_TEXT = "(continue)";
const CORRUPTED_IMAGE_FALLBACK_TEXT = "[image omitted: corrupted base64 payload]";
const MAX_CACHED_SESSION_REPAIRS = 8;
const MAX_INCREMENTAL_REPAIR_BYTES = 8n * 1024n * 1024n;
const MAX_CACHED_REPAIR_TOOL_RESULT_IDS = 4096;
const MAX_CACHED_REPAIR_TOOL_RESULT_ID_BYTES = 512 * 1024;
const sessionRepairCache = /* @__PURE__ */ new Map();
function invalidateSessionFileRepairCache(sessionFile) {
	const trimmed = sessionFile.trim();
	if (trimmed) {
		if (require_sqlite_marker.parseSqliteSessionFileMarker(trimmed)) {
			sessionRepairCache.delete(trimmed);
			return;
		}
		sessionRepairCache.delete(node_path.default.resolve(trimmed));
	}
}
async function readSessionRepairSnapshot(sessionFile) {
	if (require_sqlite_marker.parseSqliteSessionFileMarker(sessionFile)) return;
	try {
		const stat = await node_fs_promises.default.stat(sessionFile, { bigint: true });
		return {
			dev: stat.dev,
			ino: stat.ino,
			size: stat.size,
			mtimeNs: stat.mtimeNs,
			ctimeNs: stat.ctimeNs
		};
	} catch {
		return;
	}
}
function isSameSessionRepairSnapshot(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;
}
function isSameSessionRepairFile(left, right) {
	return left.dev === right.dev && left.ino === right.ino;
}
function rememberSessionRepair(sessionFile, state) {
	if (state.toolResultIds.size > MAX_CACHED_REPAIR_TOOL_RESULT_IDS || countToolResultIdBytes(state.toolResultIds) > MAX_CACHED_REPAIR_TOOL_RESULT_ID_BYTES) {
		sessionRepairCache.delete(sessionFile);
		return;
	}
	sessionRepairCache.delete(sessionFile);
	sessionRepairCache.set(sessionFile, state);
	while (sessionRepairCache.size > MAX_CACHED_SESSION_REPAIRS) {
		const oldestKey = sessionRepairCache.keys().next().value;
		if (!oldestKey) break;
		sessionRepairCache.delete(oldestKey);
	}
}
function countToolResultIdBytes(ids) {
	let bytes = 0;
	for (const id of ids) {
		bytes += Buffer.byteLength(id, "utf8");
		if (bytes > MAX_CACHED_REPAIR_TOOL_RESULT_ID_BYTES) break;
	}
	return bytes;
}
async function readSessionRepairSuffix(sessionFile, offset, length) {
	if (offset > BigInt(Number.MAX_SAFE_INTEGER) || length > MAX_INCREMENTAL_REPAIR_BYTES || length > BigInt(Number.MAX_SAFE_INTEGER)) return;
	const buffer = Buffer.alloc(Number(length));
	const file = await node_fs_promises.default.open(sessionFile, "r");
	try {
		const { bytesRead } = await file.read(buffer, 0, buffer.length, Number(offset));
		return bytesRead === buffer.length ? buffer.toString("utf8") : void 0;
	} finally {
		await file.close();
	}
}
function isSessionHeader(entry) {
	if (!entry || typeof entry !== "object") return false;
	const record = entry;
	return record.type === "session" && typeof record.id === "string" && record.id.length > 0;
}
/**
* Detect a `type: "message"` entry whose `message.role` is missing, `null`, or
* not a non-empty string. Such entries surface in the wild as "null role"
* JSONL corruption (e.g. #77228 reported transcripts that contained 935+
* entries with null roles after an earlier failure). They cannot be replayed
* to any provider — every provider router branches on `message.role` — and
* preserving them through repair just relocates the corruption from the
* original file into the post-repair file. Treat them as malformed lines:
* drop during repair so the cleaned transcript no longer carries them.
*/
function isStructurallyInvalidMessageEntry(entry) {
	if (!entry || typeof entry !== "object") return false;
	const record = entry;
	if (record.type !== "message") return false;
	if (!record.message || typeof record.message !== "object") return true;
	const role = record.message.role;
	return typeof role !== "string" || role.trim().length === 0;
}
function isAssistantEntryWithEmptyContent(entry) {
	if (!entry || typeof entry !== "object") return false;
	const record = entry;
	if (record.type !== "message" || !record.message || typeof record.message !== "object") return false;
	const message = record.message;
	if (message.role !== "assistant") return false;
	if (!Array.isArray(message.content) || message.content.length !== 0) return false;
	return message.stopReason === "error";
}
function rewriteAssistantEntryWithEmptyContent(entry) {
	return {
		...entry,
		message: {
			...entry.message,
			content: [{
				type: "text",
				text: require_stream_message_shared.STREAM_ERROR_FALLBACK_TEXT
			}]
		}
	};
}
function isImageMimeType(value) {
	return typeof value === "string" && /^image\//iu.test(value.trim());
}
function containsNonAscii(value) {
	for (let index = 0; index < value.length; index += 1) if (value.charCodeAt(index) > 127) return true;
	return false;
}
function isCorruptedImageContentBlock(block) {
	if (!block || typeof block !== "object" || Array.isArray(block)) return false;
	const record = block;
	if (record.type !== "image" || typeof record.data !== "string") return false;
	const mimeType = [
		record.mimeType,
		record.mediaType,
		record.media_type
	].find(isImageMimeType);
	if (!mimeType) return false;
	return containsNonAscii(record.data) || (0, _gabrielvfonseca_media_core_inline_image_data_url.sanitizeInlineImageBase64)({
		base64: record.data,
		mimeType
	}) === void 0;
}
function repairEntryWithCorruptedImageBlocks(entry) {
	const content = entry.message.content;
	if (!Array.isArray(content)) return {
		entry,
		removedCorruptedImageBlocks: 0
	};
	let removedCorruptedImageBlocks = 0;
	const nextContent = content.map((block) => {
		if (!isCorruptedImageContentBlock(block)) return block;
		removedCorruptedImageBlocks += 1;
		return {
			type: "text",
			text: CORRUPTED_IMAGE_FALLBACK_TEXT
		};
	});
	if (removedCorruptedImageBlocks === 0) return {
		entry,
		removedCorruptedImageBlocks: 0
	};
	return {
		entry: {
			...entry,
			message: {
				...entry.message,
				content: nextContent
			}
		},
		removedCorruptedImageBlocks
	};
}
function repairUserEntryWithBlankTextContent(entry) {
	const content = entry.message.content;
	if (typeof content === "string") {
		if (content.trim()) return { kind: "keep" };
		return {
			kind: "rewrite",
			entry: {
				...entry,
				message: {
					...entry.message,
					content: BLANK_USER_FALLBACK_TEXT
				}
			}
		};
	}
	if (!Array.isArray(content)) return { kind: "keep" };
	let touched = false;
	const nextContent = content.filter((block) => {
		if (!block || typeof block !== "object") return true;
		if (block.type !== "text") return true;
		const text = block.text;
		if (typeof text !== "string" || text.trim().length > 0) return true;
		touched = true;
		return false;
	});
	if (nextContent.length === 0) return {
		kind: "rewrite",
		entry: {
			...entry,
			message: {
				...entry.message,
				content: [{
					type: "text",
					text: BLANK_USER_FALLBACK_TEXT
				}]
			}
		}
	};
	if (!touched) return { kind: "keep" };
	return {
		kind: "rewrite",
		entry: {
			...entry,
			message: {
				...entry.message,
				content: nextContent
			}
		}
	};
}
function buildRepairSummaryParts(params) {
	const parts = [];
	if (params.droppedLines > 0) parts.push(`dropped ${params.droppedLines} malformed line(s)`);
	if (params.rewrittenAssistantMessages > 0) parts.push(`rewrote ${params.rewrittenAssistantMessages} assistant message(s)`);
	if (params.droppedBlankUserMessages > 0) parts.push(`dropped ${params.droppedBlankUserMessages} blank user message(s)`);
	if (params.rewrittenUserMessages > 0) parts.push(`rewrote ${params.rewrittenUserMessages} user message(s)`);
	if (params.removedCorruptedImageBlocks > 0) parts.push(`removed ${params.removedCorruptedImageBlocks} corrupted image block(s)`);
	if (params.insertedToolResults > 0) parts.push(`inserted ${params.insertedToolResults} missing tool result(s)`);
	return parts.length > 0 ? parts.join(", ") : "no changes";
}
function isCodeModeToolCallRepairCandidate(entry) {
	if (!entry || typeof entry !== "object") return false;
	const record = entry;
	if (record.type !== "message" || !record.message || typeof record.message !== "object") return false;
	const message = record.message;
	return message.role === "assistant" && message.api === "openai-chatgpt-responses" && message.provider === "openai" && message.stopReason !== "error" && message.stopReason !== "aborted";
}
function normalizeTrimmedString(value) {
	return typeof value === "string" ? value.trim() : "";
}
function isOpenAIResponsesReplayApi(value) {
	const api = normalizeTrimmedString(value);
	return api === "openai-responses" || api === "azure-openai-responses" || api === "openai-codex-responses";
}
function isTranscriptOnlyDeliveryMirrorEntry(entry) {
	if (!entry || typeof entry !== "object") return false;
	const record = entry;
	if (record.type !== "message" || !record.message || typeof record.message !== "object") return false;
	const message = record.message;
	return message.role === "assistant" && normalizeTrimmedString(message.provider) === "@gabrielvfonseca/operator" && (normalizeTrimmedString(message.model) === "delivery-mirror" || normalizeTrimmedString(message.model) === "gateway-injected");
}
function isResponsesMessageToolRepairCandidate(entry) {
	if (!entry || typeof entry !== "object") return false;
	const record = entry;
	if (record.type !== "message" || !record.message || typeof record.message !== "object") return false;
	const message = record.message;
	return message.role === "assistant" && isOpenAIResponsesReplayApi(message.api) && message.stopReason !== "error" && message.stopReason !== "aborted";
}
function isMessageToolCallName(value) {
	return normalizeTrimmedString(value).toLowerCase() === "message";
}
function findNextSessionMessageEntry(entries, startIndex) {
	for (let i = startIndex + 1; i < entries.length; i += 1) {
		const entry = entries[i];
		if (!entry || typeof entry !== "object") continue;
		const record = entry;
		if (record.type === "message" && record.message && typeof record.message === "object") return entry;
	}
}
function collectPersistedToolResultIds(entries) {
	const ids = /* @__PURE__ */ new Set();
	for (const entry of entries) {
		if (!entry || typeof entry !== "object") continue;
		const record = entry;
		if (record.type !== "message" || !record.message || typeof record.message !== "object") continue;
		const message = record.message;
		if (message.role !== "toolResult") continue;
		const id = require_tool_call_id.extractToolResultId(message);
		if (id) ids.add(id);
	}
	return ids;
}
function makeSyntheticToolResultEntry(params) {
	const message = require_session_transcript_repair.makeMissingToolResult({
		toolCallId: params.toolCallId,
		toolName: params.toolName,
		text: "aborted"
	});
	return {
		type: "message",
		id: `repair-${(0, node_crypto.randomUUID)()}`,
		parentId: typeof params.parent.id === "string" ? params.parent.id : void 0,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		message
	};
}
function insertMissingCodeModeToolResults(entries, existingResultIds = /* @__PURE__ */ new Set()) {
	const resultIds = new Set(existingResultIds);
	for (const resultId of collectPersistedToolResultIds(entries)) resultIds.add(resultId);
	let insertedToolResults = 0;
	const out = [];
	for (const entry of entries) {
		out.push(entry);
		if (!isCodeModeToolCallRepairCandidate(entry)) continue;
		const toolCalls = require_tool_call_id.extractToolCallsFromAssistant(entry.message);
		for (const toolCall of toolCalls) {
			if (resultIds.has(toolCall.id)) continue;
			out.push(makeSyntheticToolResultEntry({
				parent: entry,
				toolCallId: toolCall.id,
				toolName: toolCall.name
			}));
			resultIds.add(toolCall.id);
			insertedToolResults += 1;
		}
	}
	return {
		entries: insertedToolResults > 0 ? out : entries,
		insertedToolResults,
		resultIds
	};
}
function insertMissingMessageToolDeliveryMirrorResults(entries, existingResultIds = /* @__PURE__ */ new Set()) {
	const resultIds = new Set(existingResultIds);
	for (const resultId of collectPersistedToolResultIds(entries)) resultIds.add(resultId);
	let insertedToolResults = 0;
	const out = [];
	for (let i = 0; i < entries.length; i += 1) {
		const entry = entries[i];
		out.push(entry);
		if (!isResponsesMessageToolRepairCandidate(entry)) continue;
		if (!isTranscriptOnlyDeliveryMirrorEntry(findNextSessionMessageEntry(entries, i))) continue;
		const toolCalls = require_tool_call_id.extractToolCallsFromAssistant(entry.message);
		for (const toolCall of toolCalls) {
			if (!isMessageToolCallName(toolCall.name) || resultIds.has(toolCall.id)) continue;
			out.push(makeSyntheticToolResultEntry({
				parent: entry,
				toolCallId: toolCall.id,
				toolName: toolCall.name
			}));
			resultIds.add(toolCall.id);
			insertedToolResults += 1;
		}
	}
	return {
		entries: insertedToolResults > 0 ? out : entries,
		insertedToolResults,
		resultIds
	};
}
function repairSessionLines(lines) {
	const entries = [];
	let droppedLines = 0;
	let rewrittenAssistantMessages = 0;
	let droppedBlankUserMessages = 0;
	let rewrittenUserMessages = 0;
	let removedCorruptedImageBlocks = 0;
	for (const line of lines) {
		if (!line.trim()) continue;
		try {
			const entry = JSON.parse(line);
			if (isStructurallyInvalidMessageEntry(entry)) {
				droppedLines += 1;
				continue;
			}
			if (isAssistantEntryWithEmptyContent(entry)) {
				entries.push(rewriteAssistantEntryWithEmptyContent(entry));
				rewrittenAssistantMessages += 1;
				continue;
			}
			let entryForUserRepair = entry;
			if (entry && typeof entry === "object" && entry.type === "message" && typeof entry.message === "object") {
				const imageRepair = repairEntryWithCorruptedImageBlocks(entry);
				entryForUserRepair = imageRepair.entry;
				removedCorruptedImageBlocks += imageRepair.removedCorruptedImageBlocks;
			}
			if (entryForUserRepair && typeof entryForUserRepair === "object" && entryForUserRepair.type === "message" && typeof entryForUserRepair.message === "object" && (entryForUserRepair.message?.role ?? void 0) === "user") {
				const repairedUser = repairUserEntryWithBlankTextContent(entryForUserRepair);
				if (repairedUser.kind === "drop") {
					droppedBlankUserMessages += 1;
					continue;
				}
				if (repairedUser.kind === "rewrite") {
					entries.push(repairedUser.entry);
					rewrittenUserMessages += 1;
					continue;
				}
			}
			entries.push(entryForUserRepair);
		} catch {
			droppedLines += 1;
		}
	}
	return {
		entries,
		droppedLines,
		rewrittenAssistantMessages,
		droppedBlankUserMessages,
		rewrittenUserMessages,
		removedCorruptedImageBlocks
	};
}
function hasEntryRepairs(result) {
	return result.droppedLines > 0 || result.rewrittenAssistantMessages > 0 || result.droppedBlankUserMessages > 0 || result.rewrittenUserMessages > 0 || result.removedCorruptedImageBlocks > 0;
}
async function tryIncrementalSessionRepair(params) {
	if (isSameSessionRepairSnapshot(params.cached.snapshot, params.currentSnapshot)) return {
		repaired: false,
		droppedLines: 0,
		validatedSnapshot: params.currentSnapshot
	};
	if (!params.trustedSnapshot || !isSameSessionRepairSnapshot(params.trustedSnapshot, params.currentSnapshot) || !params.cached.endsWithNewline || !isSameSessionRepairFile(params.cached.snapshot, params.currentSnapshot) || params.currentSnapshot.size <= params.cached.snapshot.size) return;
	const appendedText = await readSessionRepairSuffix(params.sessionFile, params.cached.snapshot.size, params.currentSnapshot.size - params.cached.snapshot.size);
	if (!appendedText?.endsWith("\n")) return;
	const afterReadSnapshot = await readSessionRepairSnapshot(params.sessionFile);
	if (!afterReadSnapshot || !isSameSessionRepairSnapshot(params.currentSnapshot, afterReadSnapshot)) return;
	const repairedEntries = repairSessionLines(appendedText.split(/\r?\n/));
	if (hasEntryRepairs(repairedEntries)) return;
	const codeModeToolResultRepair = insertMissingCodeModeToolResults(repairedEntries.entries, params.cached.toolResultIds);
	if (codeModeToolResultRepair.insertedToolResults > 0) return;
	const messageDeliveryToolResultRepair = insertMissingMessageToolDeliveryMirrorResults(codeModeToolResultRepair.entries, codeModeToolResultRepair.resultIds);
	if (messageDeliveryToolResultRepair.insertedToolResults > 0) return;
	rememberSessionRepair(params.sessionFile, {
		snapshot: afterReadSnapshot,
		toolResultIds: messageDeliveryToolResultRepair.resultIds,
		endsWithNewline: true
	});
	return {
		repaired: false,
		droppedLines: 0,
		validatedSnapshot: afterReadSnapshot
	};
}
/** Repair a persisted session JSONL file in place when replay-breaking corruption is found. */
async function repairSessionFileIfNeeded(params) {
	const sessionFileInput = params.sessionFile.trim();
	if (!sessionFileInput) return {
		repaired: false,
		droppedLines: 0,
		reason: "missing session file"
	};
	if (require_sqlite_marker.parseSqliteSessionFileMarker(sessionFileInput)) return {
		repaired: false,
		droppedLines: 0,
		reason: "sqlite transcript"
	};
	const sessionFile = node_path.default.resolve(sessionFileInput);
	const beforeReadSnapshot = await readSessionRepairSnapshot(sessionFile);
	if (beforeReadSnapshot) {
		const cached = sessionRepairCache.get(sessionFile);
		if (cached) {
			const incremental = await tryIncrementalSessionRepair({
				sessionFile,
				currentSnapshot: beforeReadSnapshot,
				cached,
				trustedSnapshot: params.trustedSnapshot
			});
			if (incremental) return incremental;
		}
	} else sessionRepairCache.delete(sessionFile);
	let content;
	try {
		content = await node_fs_promises.default.readFile(sessionFile, "utf-8");
	} catch (err) {
		sessionRepairCache.delete(sessionFile);
		if (err?.code === "ENOENT") return {
			repaired: false,
			droppedLines: 0,
			reason: "missing session file"
		};
		const reason = `failed to read session file: ${err instanceof Error ? err.message : "unknown error"}`;
		params.warn?.(`session file repair skipped: ${reason} (${node_path.default.basename(sessionFile)})`);
		return {
			repaired: false,
			droppedLines: 0,
			reason
		};
	}
	const repairedEntries = repairSessionLines(content.split(/\r?\n/));
	const { entries, droppedLines, rewrittenAssistantMessages, droppedBlankUserMessages, rewrittenUserMessages, removedCorruptedImageBlocks } = repairedEntries;
	if (entries.length === 0) {
		sessionRepairCache.delete(sessionFile);
		return {
			repaired: false,
			droppedLines,
			reason: "empty session file"
		};
	}
	if (!isSessionHeader(entries[0])) {
		sessionRepairCache.delete(sessionFile);
		params.warn?.(`session file repair skipped: invalid session header (${node_path.default.basename(sessionFile)})`);
		return {
			repaired: false,
			droppedLines,
			reason: "invalid session header"
		};
	}
	const codeModeToolResultRepair = insertMissingCodeModeToolResults(entries);
	let insertedToolResults = codeModeToolResultRepair.insertedToolResults;
	if (codeModeToolResultRepair.insertedToolResults > 0) entries.splice(0, entries.length, ...codeModeToolResultRepair.entries);
	const messageDeliveryToolResultRepair = insertMissingMessageToolDeliveryMirrorResults(entries, codeModeToolResultRepair.resultIds);
	insertedToolResults += messageDeliveryToolResultRepair.insertedToolResults;
	if (messageDeliveryToolResultRepair.insertedToolResults > 0) entries.splice(0, entries.length, ...messageDeliveryToolResultRepair.entries);
	const repairedToolResultIds = messageDeliveryToolResultRepair.resultIds;
	if (!hasEntryRepairs(repairedEntries) && insertedToolResults === 0) {
		const afterReadSnapshot = await readSessionRepairSnapshot(sessionFile);
		const validatedSnapshot = beforeReadSnapshot && afterReadSnapshot && isSameSessionRepairSnapshot(beforeReadSnapshot, afterReadSnapshot) ? afterReadSnapshot : void 0;
		if (validatedSnapshot) rememberSessionRepair(sessionFile, {
			snapshot: validatedSnapshot,
			toolResultIds: repairedToolResultIds,
			endsWithNewline: content.endsWith("\n")
		});
		else sessionRepairCache.delete(sessionFile);
		return {
			repaired: false,
			droppedLines: 0,
			...validatedSnapshot ? { validatedSnapshot } : {}
		};
	}
	const cleaned = `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
	const backupPath = `${sessionFile}.bak-${process.pid}-${Date.now()}`;
	let retainedBackupPath;
	try {
		const stat = await node_fs_promises.default.stat(sessionFile).catch(() => null);
		await node_fs_promises.default.writeFile(backupPath, content, "utf-8");
		if (stat) await node_fs_promises.default.chmod(backupPath, stat.mode);
		await require_replace_file.replaceFileAtomic({
			filePath: sessionFile,
			content: cleaned,
			preserveExistingMode: true,
			tempPrefix: `${node_path.default.basename(sessionFile)}.repair`
		});
		await node_fs_promises.default.unlink(backupPath).catch((cleanupErr) => {
			retainedBackupPath = backupPath;
			params.debug?.(`session file repair backup cleanup failed: ${cleanupErr instanceof Error ? cleanupErr.message : "unknown error"} (${node_path.default.basename(backupPath)})`);
		});
	} catch (err) {
		sessionRepairCache.delete(sessionFile);
		return {
			repaired: false,
			droppedLines,
			rewrittenAssistantMessages,
			droppedBlankUserMessages,
			rewrittenUserMessages,
			removedCorruptedImageBlocks,
			reason: `repair failed: ${err instanceof Error ? err.message : "unknown error"}`
		};
	}
	let repairedSnapshot;
	try {
		const beforeVerifySnapshot = await readSessionRepairSnapshot(sessionFile);
		const persistedContent = await node_fs_promises.default.readFile(sessionFile, "utf8");
		const afterVerifySnapshot = await readSessionRepairSnapshot(sessionFile);
		if (beforeVerifySnapshot && afterVerifySnapshot && persistedContent === cleaned && isSameSessionRepairSnapshot(beforeVerifySnapshot, afterVerifySnapshot)) repairedSnapshot = afterVerifySnapshot;
	} catch {
		repairedSnapshot = void 0;
	}
	if (repairedSnapshot) rememberSessionRepair(sessionFile, {
		snapshot: repairedSnapshot,
		toolResultIds: repairedToolResultIds,
		endsWithNewline: true
	});
	else sessionRepairCache.delete(sessionFile);
	params.debug?.(`session file repaired: ${buildRepairSummaryParts({
		droppedLines,
		rewrittenAssistantMessages,
		droppedBlankUserMessages,
		rewrittenUserMessages,
		removedCorruptedImageBlocks,
		insertedToolResults
	})} (${node_path.default.basename(sessionFile)})`);
	return {
		repaired: true,
		droppedLines,
		...repairedSnapshot ? { validatedSnapshot: repairedSnapshot } : {},
		rewrittenAssistantMessages,
		droppedBlankUserMessages,
		rewrittenUserMessages,
		removedCorruptedImageBlocks,
		insertedToolResults,
		...retainedBackupPath ? { backupPath: retainedBackupPath } : {}
	};
}
//#endregion
//#region src/agents/sessions/session-manager-file.ts
const MAX_CACHED_SESSION_FILES = 8;
const MAX_CACHED_SESSION_BYTES = 32n * 1024n * 1024n;
const sessionEntriesCache = /* @__PURE__ */ new Map();
function getDefaultSessionDir(cwd, agentDir = require_config.getAgentDir()) {
	const sessionDir = (0, node_path.join)(agentDir, "sessions", `--${cwd.replace(/^[/\\]/, "").replace(/[/\\:]/g, "-")}--`);
	if (!(0, node_fs.existsSync)(sessionDir)) (0, node_fs.mkdirSync)(sessionDir, { recursive: true });
	return sessionDir;
}
function loadEntriesFromFile(filePath) {
	if (!(0, node_fs.existsSync)(filePath)) return [];
	const entries = parseJsonlEntries((0, node_fs.readFileSync)(filePath, "utf8"));
	return hasReadableSessionHeader(entries) ? entries : [];
}
function loadEntriesFromFileWithSnapshot(filePath) {
	const resolvedPath = (0, node_path.resolve)(filePath);
	for (let attempt = 0; attempt < 3; attempt += 1) {
		let beforeReadSnapshot;
		try {
			beforeReadSnapshot = readSessionFileSnapshot(resolvedPath);
		} catch {
			sessionEntriesCache.delete(resolvedPath);
			return {
				entries: [],
				snapshot: void 0
			};
		}
		const cached = sessionEntriesCache.get(resolvedPath);
		if (cached && isSameSessionFileSnapshot(cached.snapshot, beforeReadSnapshot)) {
			const afterCacheSnapshot = readSessionFileSnapshotIfExists(resolvedPath);
			if (afterCacheSnapshot && isSameSessionFileSnapshot(beforeReadSnapshot, afterCacheSnapshot)) return {
				entries: copyFileEntries(cached.entries),
				snapshot: afterCacheSnapshot
			};
			continue;
		}
		const content = (0, node_fs.readFileSync)(resolvedPath, "utf8");
		const entries = parseJsonlEntries(content);
		const afterParseSnapshot = readSessionFileSnapshotIfExists(resolvedPath);
		if (afterParseSnapshot && isSameSessionFileSnapshot(beforeReadSnapshot, afterParseSnapshot)) return {
			entries: rememberSessionEntries(resolvedPath, afterParseSnapshot, entries, content.endsWith("\n")),
			snapshot: afterParseSnapshot
		};
	}
	sessionEntriesCache.delete(resolvedPath);
	throw new Error(`session file changed repeatedly while loading: ${resolvedPath}`);
}
function readSessionFileSnapshot(filePath) {
	const fileStat = (0, node_fs.statSync)(filePath, { bigint: true });
	return {
		dev: fileStat.dev,
		ino: fileStat.ino,
		size: fileStat.size,
		mtimeNs: fileStat.mtimeNs,
		ctimeNs: fileStat.ctimeNs
	};
}
function isSameSessionFileSnapshot(left, right) {
	return left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;
}
function rememberSessionEntries(filePath, snapshot, entries, endsWithNewline) {
	if (!hasReadableSessionHeader(entries)) {
		sessionEntriesCache.delete(filePath);
		return entries.length === 0 ? entries : [];
	}
	if (!hasCacheableSessionHeader(entries)) {
		sessionEntriesCache.delete(filePath);
		return entries;
	}
	if (snapshot.size > MAX_CACHED_SESSION_BYTES) {
		sessionEntriesCache.delete(filePath);
		return copyFileEntries(entries.map(freezeFileEntry));
	}
	const cachedEntries = entries.map((entry) => Object.isFrozen(entry) ? entry : freezeFileEntry(entry));
	sessionEntriesCache.delete(filePath);
	sessionEntriesCache.set(filePath, {
		snapshot,
		entries: cachedEntries,
		endsWithNewline
	});
	trimSessionEntriesCache();
	return copyFileEntries(cachedEntries);
}
function trimSessionEntriesCache() {
	let cachedBytes = 0n;
	for (const cached of sessionEntriesCache.values()) cachedBytes += cached.snapshot.size;
	while (sessionEntriesCache.size > MAX_CACHED_SESSION_FILES || cachedBytes > MAX_CACHED_SESSION_BYTES) {
		const oldestKey = sessionEntriesCache.keys().next().value;
		if (!oldestKey) break;
		cachedBytes -= sessionEntriesCache.get(oldestKey)?.snapshot.size ?? 0n;
		sessionEntriesCache.delete(oldestKey);
	}
}
function hasCacheableSessionHeader(entries) {
	if (entries.length === 0) return true;
	const header = entries[0];
	return header?.type === "session" && typeof header.id === "string" && header.version === 3;
}
function rememberWrittenSessionEntries(filePath, expectedContent) {
	const resolvedPath = (0, node_path.resolve)(filePath);
	invalidateSessionFileRepairCache(resolvedPath);
	let beforeReadSnapshot;
	try {
		beforeReadSnapshot = readSessionFileSnapshot(resolvedPath);
	} catch {
		sessionEntriesCache.delete(resolvedPath);
		return {
			snapshot: void 0,
			verifiedWrite: false,
			stableRead: false
		};
	}
	if (beforeReadSnapshot.size > MAX_CACHED_SESSION_BYTES) {
		sessionEntriesCache.delete(resolvedPath);
		return {
			snapshot: beforeReadSnapshot,
			verifiedWrite: false,
			stableRead: false
		};
	}
	let content;
	let afterReadSnapshot;
	try {
		content = (0, node_fs.readFileSync)(resolvedPath, "utf8");
		afterReadSnapshot = readSessionFileSnapshot(resolvedPath);
	} catch {
		sessionEntriesCache.delete(resolvedPath);
		return {
			snapshot: void 0,
			verifiedWrite: false,
			stableRead: false
		};
	}
	if (expectedContent !== void 0 && content !== expectedContent || !isSameSessionFileSnapshot(beforeReadSnapshot, afterReadSnapshot)) {
		sessionEntriesCache.delete(resolvedPath);
		return {
			snapshot: afterReadSnapshot,
			verifiedWrite: false,
			stableRead: false
		};
	}
	rememberSessionEntries(resolvedPath, afterReadSnapshot, parseJsonlEntries(content), content.endsWith("\n"));
	return {
		snapshot: afterReadSnapshot,
		verifiedWrite: expectedContent !== void 0,
		stableRead: true
	};
}
function rememberAppendedSessionEntry(params) {
	const { filePath, previousSnapshot, beforeAppendSnapshot, serializedAppend, cacheOwnedAppend, publishOwnedAppend, invalidateSerializedPrefixCache } = params;
	const resolvedPath = (0, node_path.resolve)(filePath);
	const appendedByteLength = BigInt(Buffer.byteLength(serializedAppend, "utf8"));
	const isVerifiedOwnedAppend = (snapshot) => Boolean(publishOwnedAppend && beforeAppendSnapshot && snapshot && snapshot.dev === beforeAppendSnapshot.dev && snapshot.ino === beforeAppendSnapshot.ino && snapshot.size === beforeAppendSnapshot.size + appendedByteLength);
	if (!cacheOwnedAppend) {
		sessionEntriesCache.delete(resolvedPath);
		invalidateSessionFileRepairCache(resolvedPath);
		const snapshot = readSessionFileSnapshotIfExists(resolvedPath);
		return {
			snapshot,
			cacheAdvanced: false,
			ownedAppendVerified: isVerifiedOwnedAppend(snapshot)
		};
	}
	if (!previousSnapshot || !beforeAppendSnapshot || !isSameSessionFileSnapshot(previousSnapshot, beforeAppendSnapshot)) {
		sessionEntriesCache.delete(resolvedPath);
		invalidateSessionFileRepairCache(resolvedPath);
		return {
			snapshot: readSessionFileSnapshotIfExists(resolvedPath),
			cacheAdvanced: false,
			ownedAppendVerified: false
		};
	}
	const cached = sessionEntriesCache.get(resolvedPath);
	const snapshot = readSessionFileSnapshotIfExists(resolvedPath);
	const expectedSize = beforeAppendSnapshot.size + appendedByteLength;
	if (!snapshot || !cached || cached.snapshot.dev !== previousSnapshot.dev || cached.snapshot.ino !== previousSnapshot.ino || snapshot.dev !== beforeAppendSnapshot.dev || snapshot.ino !== beforeAppendSnapshot.ino || snapshot.size !== expectedSize || !isSameSessionFileSnapshot(cached.snapshot, previousSnapshot)) {
		sessionEntriesCache.delete(resolvedPath);
		invalidateSessionFileRepairCache(resolvedPath);
		return {
			snapshot,
			cacheAdvanced: false,
			ownedAppendVerified: false
		};
	}
	if (invalidateSerializedPrefixCache) {
		sessionEntriesCache.delete(resolvedPath);
		invalidateSessionFileRepairCache(resolvedPath);
		return {
			snapshot,
			cacheAdvanced: false,
			ownedAppendVerified: true
		};
	}
	if (snapshot.size > MAX_CACHED_SESSION_BYTES) {
		sessionEntriesCache.delete(resolvedPath);
		return {
			snapshot,
			cacheAdvanced: false,
			ownedAppendVerified: true
		};
	}
	const persistedEntry = JSON.parse(serializedAppend.startsWith("\n") ? serializedAppend.slice(1) : serializedAppend);
	cached.entries.push(freezeFileEntry(normalizeLoadedFileEntry(persistedEntry)));
	cached.snapshot = snapshot;
	cached.endsWithNewline = true;
	sessionEntriesCache.delete(resolvedPath);
	sessionEntriesCache.set(resolvedPath, cached);
	trimSessionEntriesCache();
	return {
		snapshot,
		cacheAdvanced: true,
		ownedAppendVerified: true
	};
}
function publishRememberedSessionFileSnapshot(filePath, snapshot) {
	if (!snapshot) return;
	if (require_session_accessor.publishOwnedSessionFileSnapshot({
		sessionFile: filePath,
		snapshot
	}) === false) {
		sessionEntriesCache.delete((0, node_path.resolve)(filePath));
		invalidateSessionFileRepairCache(filePath);
	}
}
function jsonSerializationCanRunUserCode(value, ancestors = /* @__PURE__ */ new Set()) {
	if (typeof value === "bigint") return Object.getOwnPropertyDescriptor(BigInt.prototype, "toJSON") !== void 0;
	if (typeof value !== "object" && typeof value !== "function" || value === null) return false;
	try {
		if ((0, node_util_types.isProxy)(value) || ancestors.has(value)) return true;
		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== null) return true;
		const descriptors = Object.getOwnPropertyDescriptors(value);
		if (descriptors.toJSON || prototype !== null && Object.getOwnPropertyDescriptor(prototype, "toJSON") || Object.values(descriptors).some((descriptor) => descriptor.get !== void 0 || descriptor.set !== void 0)) return true;
		ancestors.add(value);
		try {
			if (Array.isArray(value)) {
				for (let index = 0; index < value.length; index += 1) {
					const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
					if (!descriptor || descriptor.get !== void 0 || descriptor.set !== void 0 || "value" in descriptor && jsonSerializationCanRunUserCode(descriptor.value, ancestors)) return true;
				}
				return false;
			}
			return Object.values(descriptors).some((descriptor) => descriptor.enumerable && "value" in descriptor && jsonSerializationCanRunUserCode(descriptor.value, ancestors));
		} finally {
			ancestors.delete(value);
		}
	} catch {
		return true;
	}
}
function hasOwnProperty(value, key) {
	return Object.hasOwn(value, key);
}
function messageSerializesOwnedValues(message) {
	if (message.role === "toolResult") return hasOwnProperty(message, "details");
	if (message.role === "assistant" && Array.isArray(message.content)) return message.content.some((part) => part.type === "toolCall" && hasOwnProperty(part, "arguments"));
	return message.role === "custom" && hasOwnProperty(message, "details");
}
function readSessionFileSnapshotIfExists(filePath) {
	try {
		return readSessionFileSnapshot(filePath);
	} catch {
		return;
	}
}
function sessionFileNeedsAppendSeparator(filePath, snapshot) {
	if (!snapshot || snapshot.size === 0n) return false;
	const resolvedPath = (0, node_path.resolve)(filePath);
	const cached = sessionEntriesCache.get(resolvedPath);
	if (cached && isSameSessionFileSnapshot(cached.snapshot, snapshot)) return !cached.endsWithNewline;
	const fileDescriptor = (0, node_fs.openSync)(resolvedPath, "r");
	try {
		const lastByte = Buffer.allocUnsafe(1);
		return (0, node_fs.readSync)(fileDescriptor, lastByte, 0, 1, snapshot.size - 1n) === 1 && lastByte[0] !== 10;
	} finally {
		(0, node_fs.closeSync)(fileDescriptor);
	}
}
function revalidateLoadedSessionFile(filePath, loaded) {
	const currentSnapshot = readSessionFileSnapshotIfExists((0, node_path.resolve)(filePath));
	if (loaded.snapshot && currentSnapshot && isSameSessionFileSnapshot(loaded.snapshot, currentSnapshot)) return loaded;
	if (!loaded.snapshot && !currentSnapshot) return loaded;
	return loadEntriesFromFileWithSnapshot(filePath);
}
function loadSqliteMarkedSessionFile(sessionFile, loadEvents, options = {}) {
	const sqliteMarker = require_sqlite_marker.parseSqliteSessionFileMarker(sessionFile);
	if (!sqliteMarker) return;
	const sessionKey = require_session_accessor.resolveTranscriptSessionKeyBySessionId(sqliteMarker);
	if (!sessionKey) throw new Error(`Cannot open SQLite session without session entry: ${sqliteMarker.sessionId}`);
	const entries = loadEvents(sqliteMarker);
	const header = entries.find((entry) => isJsonRecord(entry) && entry.type === "session");
	return {
		cwd: options.cwdOverride ?? header?.cwd ?? options.fallbackCwd ?? process.cwd(),
		entries,
		sessionKey,
		sqliteMarker
	};
}
function copyFileEntries(entries) {
	const copy = entries.slice();
	const header = copy.at(0);
	if (header?.type === "session" && Object.isFrozen(header)) copy[0] = structuredClone(header);
	return copy;
}
function freezeFileEntry(entry) {
	freezeJsonLikeValue(entry);
	return entry;
}
function freezeJsonLikeValue(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (typeof value !== "object" || value === null || seen.has(value)) return;
	seen.add(value);
	for (const item of Array.isArray(value) ? value : Object.values(value)) freezeJsonLikeValue(item, seen);
	Object.freeze(value);
}
function recoverCorruptSessionEntries(filePath, cwd) {
	const content = (0, node_fs.readFileSync)(filePath, "utf8");
	if (content.trim().length === 0) return null;
	const parsedEntries = parseJsonlEntries(content);
	const header = parsedEntries.find((entry) => entry.type === "session" && typeof entry.id === "string") ?? {
		type: "session",
		version: 3,
		id: createSessionId(),
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		cwd
	};
	const recoveredEntries = parsedEntries.filter((entry) => entry.type !== "session");
	const backupPath = `${filePath}.corrupt-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}-${(0, node_crypto.randomUUID)().slice(0, 8)}.jsonl`;
	const backupMode = (0, node_fs.statSync)(filePath).mode & 511;
	(0, node_fs.writeFileSync)(backupPath, content, {
		encoding: "utf8",
		mode: backupMode || 384
	});
	(0, node_fs.chmodSync)(backupPath, backupMode || 384);
	return [header, ...recoveredEntries];
}
function canPublishOwnedSessionAppend(sessionFile, snapshot) {
	return Boolean(snapshot && require_session_accessor.canAdvanceOwnedSessionEntryCache({
		sessionFile,
		snapshot
	}));
}
//#endregion
//#region src/agents/sessions/session-manager-core.ts
var SessionManagerCore = class {
	constructor(cwd, sessionDir, sessionFile, persist, loadedSessionFile, sqlitePersistence) {
		this.sessionId = "";
		this.flushed = false;
		this.fileEntries = [];
		this.opaqueFileEntries = [];
		this.byId = /* @__PURE__ */ new Map();
		this.opaqueParentsById = /* @__PURE__ */ new Map();
		this.logicalParentsById = /* @__PURE__ */ new Map();
		this.invalidLeafControlIds = /* @__PURE__ */ new Set();
		this.labelsById = /* @__PURE__ */ new Map();
		this.labelTimestampsById = /* @__PURE__ */ new Map();
		this.leafId = null;
		this.appendParentId = null;
		this.recoveredCorruptHeader = false;
		this.cwd = cwd;
		this.sessionDir = sessionDir;
		this.shouldPersist = persist;
		this.sqlitePersistence = sqlitePersistence;
		if (persist && sessionDir && !(0, node_fs.existsSync)(sessionDir)) (0, node_fs.mkdirSync)(sessionDir, { recursive: true });
		if (sessionFile) if (sqlitePersistence) this.setLoadedSqliteSessionFile(sessionFile, loadedSessionFile ?? {
			entries: [],
			snapshot: void 0
		});
		else this.setLoadedSessionFile(sessionFile, loadedSessionFile ?? loadEntriesFromFileWithSnapshot(sessionFile));
		else this.newSession();
	}
	setSessionFile(sessionFile) {
		const sqliteLoaded = loadSqliteMarkedSessionFile(sessionFile, (marker) => require_session_accessor.loadTranscriptEventsSync(marker), { fallbackCwd: this.cwd });
		if (sqliteLoaded) {
			this.cwd = sqliteLoaded.cwd;
			this.sqlitePersistence = {
				...sqliteLoaded.sqliteMarker,
				sessionKey: sqliteLoaded.sessionKey
			};
			this.setLoadedSqliteSessionFile(sessionFile, {
				entries: sqliteLoaded.entries,
				snapshot: void 0
			});
			return;
		}
		this.sqlitePersistence = void 0;
		this.setLoadedSessionFile(sessionFile, loadEntriesFromFileWithSnapshot(sessionFile));
	}
	setLoadedSessionFile(sessionFile, loaded) {
		this.sessionFile = (0, node_path.resolve)(sessionFile);
		this.sessionFileSnapshot = void 0;
		this.recoveredCorruptHeader = false;
		if (!(0, node_fs.existsSync)(this.sessionFile)) {
			const explicitPath = this.sessionFile;
			this.newSession();
			this.sessionFile = explicitPath;
			return;
		}
		const partitioned = partitionSessionFileEntries(loaded.entries);
		this.fileEntries = partitioned.fileEntries;
		this.opaqueFileEntries = partitioned.opaqueEntries;
		this.sessionFileSnapshot = loaded.snapshot;
		if (this.fileEntries.length === 0) {
			const recoveredEntries = recoverCorruptSessionEntries(this.sessionFile, this.cwd);
			if (recoveredEntries && hasReadableSessionHeader(recoveredEntries)) {
				const recovered = partitionSessionFileEntries(recoveredEntries);
				this.fileEntries = recovered.fileEntries;
				this.opaqueFileEntries = recovered.opaqueEntries;
				const header = this.fileEntries.find((entry) => entry.type === "session");
				this.sessionId = header?.id ?? createSessionId();
				migrateToCurrentVersion(this.fileEntries, recovered.fileEntriesByOriginalIndex);
				this.buildIndex();
				this.replacePersistedTranscript();
				this.recoveredCorruptHeader = true;
				this.flushed = true;
				return;
			}
			const explicitPath = this.sessionFile;
			this.newSession();
			this.sessionFile = explicitPath;
			this.replacePersistedTranscript();
			this.flushed = true;
			return;
		}
		const header = this.fileEntries.find((entry) => entry.type === "session");
		this.sessionId = header?.id ?? createSessionId();
		const migrated = migrateToCurrentVersion(this.fileEntries, partitioned.fileEntriesByOriginalIndex);
		this.buildIndex();
		if (migrated) this.replacePersistedTranscript();
		this.flushed = true;
	}
	setLoadedSqliteSessionFile(sessionFile, loaded) {
		this.sessionFile = sessionFile;
		this.sessionFileSnapshot = void 0;
		this.recoveredCorruptHeader = false;
		const partitioned = partitionSessionFileEntries(loaded.entries);
		if (partitioned.fileEntries.length === 0) {
			this.newSession({ id: this.sqlitePersistence?.sessionId });
			this.sessionFile = sessionFile;
			return;
		}
		this.fileEntries = partitioned.fileEntries;
		this.opaqueFileEntries = partitioned.opaqueEntries;
		const header = this.fileEntries.find((entry) => entry.type === "session");
		this.sessionId = header?.id ?? this.sqlitePersistence?.sessionId ?? createSessionId();
		migrateToCurrentVersion(this.fileEntries, partitioned.fileEntriesByOriginalIndex);
		this.buildIndex();
		this.flushed = true;
	}
	newSession(options) {
		this.recoveredCorruptHeader = false;
		this.sessionFileSnapshot = void 0;
		this.sessionId = options?.id ?? createSessionId();
		const timestamp = (/* @__PURE__ */ new Date()).toISOString();
		const header = {
			type: "session",
			version: 3,
			id: this.sessionId,
			timestamp,
			cwd: this.cwd,
			parentSession: options?.parentSession
		};
		this.fileEntries = [header];
		this.opaqueFileEntries = [];
		this.byId.clear();
		this.opaqueParentsById.clear();
		this.logicalParentsById.clear();
		this.invalidLeafControlIds.clear();
		this.labelsById.clear();
		this.labelTimestampsById.clear();
		this.leafId = null;
		this.appendParentId = null;
		this.promptReleasedSideBranchParentId = void 0;
		this.flushed = false;
		if (this.shouldPersist) {
			const fileTimestamp = timestamp.replace(/[:.]/g, "-");
			this.sessionFile = (0, node_path.join)(this.getSessionDir(), `${fileTimestamp}_${this.sessionId}.jsonl`);
		}
		return this.sessionFile;
	}
	resolveOpaqueLeafTargetId(targetId) {
		if (targetId === null || this.byId.has(targetId)) return targetId;
		return this.resolveCanonicalParentId(targetId);
	}
	resolveOpaqueAppendParentId(parentId) {
		if (parentId === null || this.byId.has(parentId) || this.opaqueParentsById.has(parentId)) return parentId;
		return this.resolveCanonicalParentId(parentId);
	}
	resolveOpaqueLeafControl(leafEntry) {
		if (!leafEntry) return;
		const isKnownReference = (id) => id === null || this.byId.has(id) || this.opaqueParentsById.has(id) && !this.invalidLeafControlIds.has(id);
		if (!isKnownReference(leafEntry.targetId) || leafEntry.appendParentId !== void 0 && !isKnownReference(leafEntry.appendParentId)) return;
		const leafId = this.resolveOpaqueLeafTargetId(leafEntry.targetId);
		return {
			leafId,
			appendParentId: leafEntry.appendParentId === void 0 ? leafId : this.resolveOpaqueAppendParentId(leafEntry.appendParentId),
			...leafEntry.appendMode ? { appendMode: leafEntry.appendMode } : {}
		};
	}
	buildIndex() {
		this.byId.clear();
		this.opaqueParentsById.clear();
		this.logicalParentsById.clear();
		this.invalidLeafControlIds.clear();
		this.labelsById.clear();
		this.labelTimestampsById.clear();
		this.leafId = null;
		this.appendParentId = null;
		this.promptReleasedSideBranchParentId = void 0;
		let opaqueIndex = 0;
		for (let index = 0; index <= this.fileEntries.length; index += 1) {
			while (this.opaqueFileEntries[opaqueIndex]?.index === index) {
				const opaqueRecord = this.opaqueFileEntries[opaqueIndex]?.record;
				const leafEntry = parseOpaqueLeafEntry(opaqueRecord);
				if (leafEntry) {
					const leafState = this.resolveOpaqueLeafControl(leafEntry);
					if (!leafState) {
						this.invalidLeafControlIds.add(leafEntry.id);
						this.opaqueParentsById.set(leafEntry.id, this.resolveOpaqueAppendParentId(leafEntry.parentId));
						opaqueIndex += 1;
						continue;
					}
					this.opaqueParentsById.set(leafEntry.id, leafState.leafId);
					this.leafId = leafState.leafId;
					this.appendParentId = leafState.appendParentId;
					this.promptReleasedSideBranchParentId = leafState.appendMode === "side" ? leafState.appendParentId : void 0;
					opaqueIndex += 1;
					continue;
				}
				const link = parseParentLinkedOpaqueEntry(opaqueRecord);
				if (link) {
					this.opaqueParentsById.set(link.id, link.parentId);
					this.appendParentId = link.id;
					if (this.promptReleasedSideBranchParentId !== void 0) this.promptReleasedSideBranchParentId = link.id;
				}
				opaqueIndex += 1;
			}
			const entry = this.fileEntries[index];
			if (!isIndexedSessionEntry(entry)) continue;
			if (!Object.hasOwn(entry, "parentId") || !require_transcript_tree.isSessionTranscriptSideAppendEntry(entry) && entry.parentId === this.appendParentId && this.leafId !== this.appendParentId) this.logicalParentsById.set(entry.id, this.leafId);
			this.byId.set(entry.id, entry);
			this.appendParentId = entry.id;
			if (require_transcript_tree.isSessionTranscriptSideAppendEntry(entry)) this.promptReleasedSideBranchParentId = entry.id;
			else {
				this.leafId = entry.id;
				this.promptReleasedSideBranchParentId = void 0;
			}
			if (entry.type === "label") if (entry.label) {
				this.labelsById.set(entry.targetId, entry.label);
				this.labelTimestampsById.set(entry.targetId, entry.timestamp);
			} else {
				this.labelsById.delete(entry.targetId);
				this.labelTimestampsById.delete(entry.targetId);
			}
		}
	}
	resolveCanonicalParentId(parentId) {
		const seen = /* @__PURE__ */ new Set();
		let currentId = parentId;
		while (currentId && !this.byId.has(currentId)) {
			if (seen.has(currentId)) return null;
			seen.add(currentId);
			currentId = this.opaqueParentsById.get(currentId) ?? null;
		}
		return currentId;
	}
	normalizeEntryParent(entry) {
		const parentId = this.logicalParentsById.has(entry.id) ? this.logicalParentsById.get(entry.id) ?? null : this.resolveCanonicalParentId(entry.parentId);
		let normalized = parentId === entry.parentId ? entry : {
			...entry,
			parentId
		};
		if (normalized.type === "compaction" && !this.byId.has(normalized.firstKeptEntryId) && this.opaqueParentsById.has(normalized.firstKeptEntryId)) {
			const firstKeptEntryId = this.resolveCanonicalParentId(normalized.firstKeptEntryId) ?? this.findFirstCanonicalDescendantOnBranch(normalized.firstKeptEntryId, normalized.parentId) ?? this.findFirstCanonicalDescendant(normalized.firstKeptEntryId) ?? parentId;
			if (firstKeptEntryId && firstKeptEntryId !== normalized.firstKeptEntryId) normalized = {
				...normalized,
				firstKeptEntryId
			};
		}
		return normalized;
	}
	findFirstCanonicalDescendantOnBranch(opaqueId, leafId) {
		const seen = /* @__PURE__ */ new Set();
		let currentId = leafId;
		let firstCanonicalDescendant;
		while (currentId && !seen.has(currentId)) {
			if (currentId === opaqueId) return firstCanonicalDescendant;
			seen.add(currentId);
			const entry = this.byId.get(currentId);
			if (entry) {
				firstCanonicalDescendant = entry.id;
				currentId = entry.parentId;
			} else currentId = this.opaqueParentsById.get(currentId) ?? null;
		}
	}
	findFirstCanonicalDescendant(opaqueId) {
		for (const entry of this.fileEntries) {
			if (!isIndexedSessionEntry(entry)) continue;
			const seen = /* @__PURE__ */ new Set();
			let parentId = entry.parentId;
			while (parentId && this.opaqueParentsById.has(parentId) && !seen.has(parentId)) {
				if (parentId === opaqueId) return entry.id;
				seen.add(parentId);
				parentId = this.opaqueParentsById.get(parentId) ?? null;
			}
		}
	}
	resolveBranchTargetId(branchFromId) {
		if (this.byId.has(branchFromId)) return branchFromId;
		if (!this.opaqueParentsById.has(branchFromId)) return;
		return this.resolveCanonicalParentId(branchFromId);
	}
	clampOpaqueFileEntryIndexes() {
		let previousOpaqueIndex = 0;
		for (const opaqueEntry of this.opaqueFileEntries) {
			opaqueEntry.index = Math.max(previousOpaqueIndex, Math.min(opaqueEntry.index, this.fileEntries.length));
			previousOpaqueIndex = opaqueEntry.index;
		}
	}
	createLeafControl(parentId, appendParentId = this.appendParentId, appendMode) {
		return {
			type: "leaf",
			id: generateSessionEntryId({ has: (id) => this.byId.has(id) || this.opaqueParentsById.has(id) }),
			parentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			targetId: this.leafId,
			...appendParentId !== this.leafId ? { appendParentId } : {},
			...appendMode ? { appendMode } : {}
		};
	}
	rememberLeafControl(leafEntry) {
		this.opaqueFileEntries.push({
			index: this.fileEntries.length,
			record: leafEntry
		});
		this.opaqueParentsById.set(leafEntry.id, this.leafId);
	}
	getPersistedFileEntries(leafAppendParentId = this.appendParentId, leafAppendMode) {
		this.clampOpaqueFileEntryIndexes();
		const entries = [];
		let opaqueIndex = 0;
		for (let index = 0; index <= this.fileEntries.length; index += 1) {
			while (this.opaqueFileEntries[opaqueIndex]?.index === index) {
				entries.push(this.opaqueFileEntries[opaqueIndex]?.record);
				opaqueIndex += 1;
			}
			const entry = this.fileEntries[index];
			if (entry) entries.push(entry);
		}
		while (opaqueIndex < this.opaqueFileEntries.length) {
			entries.push(this.opaqueFileEntries[opaqueIndex]?.record);
			opaqueIndex += 1;
		}
		let persistedLeafId = null;
		let persistedAppendParentId = null;
		let rawTailId = null;
		for (const entry of entries) {
			const leafEntry = parseOpaqueLeafEntry(entry);
			if (leafEntry) {
				rawTailId = leafEntry.id;
				if (this.invalidLeafControlIds.has(leafEntry.id)) continue;
				const targetId = this.resolveOpaqueLeafTargetId(leafEntry.targetId);
				persistedLeafId = targetId;
				persistedAppendParentId = leafEntry.appendParentId === void 0 ? targetId : this.resolveOpaqueAppendParentId(leafEntry.appendParentId);
				continue;
			}
			if (isIndexedSessionEntry(entry)) {
				persistedLeafId = entry.id;
				persistedAppendParentId = entry.id;
				rawTailId = entry.id;
				continue;
			}
			const opaqueLink = parseParentLinkedOpaqueEntry(entry);
			if (opaqueLink) {
				persistedAppendParentId = opaqueLink.id;
				rawTailId = opaqueLink.id;
			}
		}
		if (persistedLeafId !== this.leafId || persistedAppendParentId !== this.appendParentId) {
			const leafEntry = this.createLeafControl(rawTailId, leafAppendParentId, leafAppendMode);
			this.rememberLeafControl(leafEntry);
			entries.push(leafEntry);
		}
		return entries;
	}
	getSerializedFileLinesForRewrite() {
		return this.getPersistedFileEntries().map(require_session_accessor.serializeJsonlLine);
	}
	clearPreservedOpaqueFileEntries() {
		this.opaqueFileEntries = [];
		this.opaqueParentsById.clear();
		this.invalidLeafControlIds.clear();
		this.appendParentId = null;
		this.promptReleasedSideBranchParentId = void 0;
	}
	writeFullFile(leafAppendParentId = this.appendParentId, leafAppendMode) {
		return this.sessionFile ? require_session_accessor.writeJsonlEntriesSync(this.sessionFile, this.getPersistedFileEntries(leafAppendParentId, leafAppendMode)) : "";
	}
	replacePersistedTranscript(options) {
		if (!this.shouldPersist) return;
		const leafAppendParentId = options?.leafAppendParentId === void 0 ? this.appendParentId : options.leafAppendParentId;
		if (this.sqlitePersistence) {
			require_session_accessor.replaceTranscriptEventsSync({
				agentId: this.sqlitePersistence.agentId,
				sessionId: this.sqlitePersistence.sessionId,
				sessionKey: this.sqlitePersistence.sessionKey,
				storePath: this.sqlitePersistence.storePath
			}, this.getPersistedFileEntries(leafAppendParentId, options?.leafAppendMode));
			this.flushed = true;
			return;
		}
		if (!this.sessionFile) return;
		const content = this.writeFullFile(leafAppendParentId, options?.leafAppendMode);
		const rememberedWrite = rememberWrittenSessionEntries(this.sessionFile, content);
		this.sessionFileSnapshot = rememberedWrite.snapshot;
		if (rememberedWrite.verifiedWrite && options?.publishSnapshot !== false) publishRememberedSessionFileSnapshot(this.sessionFile, rememberedWrite.snapshot);
	}
	isPersisted() {
		return this.shouldPersist;
	}
	getCwd() {
		return this.cwd;
	}
	getSessionDir() {
		return this.sessionDir;
	}
	getSessionId() {
		return this.sessionId;
	}
	wasRecoveredFromCorruptHeader() {
		return this.recoveredCorruptHeader;
	}
	getSessionFile() {
		return this.sessionFile;
	}
};
//#endregion
//#region src/agents/sessions/session-manager-persistence.ts
var SessionManagerPersistence = class extends SessionManagerCore {
	removeTrailingEntries(predicate, options) {
		let preservedStart = this.fileEntries.length;
		while (preservedStart > 1) {
			const entry = this.fileEntries[preservedStart - 1];
			if (!isIndexedSessionEntry(entry) || !options?.preserveTrailing?.(entry)) break;
			preservedStart -= 1;
		}
		let removeStart = preservedStart;
		while (removeStart > 1) {
			const entry = this.fileEntries[removeStart - 1];
			if (!isIndexedSessionEntry(entry) || !predicate(entry)) break;
			removeStart -= 1;
		}
		if (removeStart === preservedStart) return 0;
		const shiftOpaqueIndexesAfterRemoval = (start, count) => {
			for (const opaqueEntry of this.opaqueFileEntries) {
				const removedBeforeOpaque = Math.max(0, Math.min(count, opaqueEntry.index - start));
				opaqueEntry.index -= removedBeforeOpaque;
			}
		};
		const removedCount = preservedStart - removeStart;
		shiftOpaqueIndexesAfterRemoval(removeStart, removedCount);
		const removedEntries = this.fileEntries.splice(removeStart, removedCount);
		const removedParentById = new Map(removedEntries.map((entry) => [entry.id, entry.parentId]));
		for (let index = removeStart; index < this.fileEntries.length;) {
			const entry = this.fileEntries[index];
			if (isIndexedSessionEntry(entry) && entry.type === "label" && removedParentById.has(entry.targetId)) {
				removedParentById.set(entry.id, entry.parentId);
				shiftOpaqueIndexesAfterRemoval(index, 1);
				this.fileEntries.splice(index, 1);
				continue;
			}
			index += 1;
		}
		const resolveRetainedParentId = (parentId) => {
			const seen = /* @__PURE__ */ new Set();
			let currentId = parentId;
			while (currentId && removedParentById.has(currentId) && !seen.has(currentId)) {
				seen.add(currentId);
				currentId = removedParentById.get(currentId) ?? null;
			}
			return currentId;
		};
		const replacementParentId = resolveRetainedParentId(removedEntries[0]?.parentId ?? null);
		this.fileEntries = this.fileEntries.map((entry) => {
			if (!isIndexedSessionEntry(entry)) return entry;
			const parentId = resolveRetainedParentId(entry.parentId);
			return parentId === entry.parentId ? entry : {
				...entry,
				parentId
			};
		});
		this.opaqueFileEntries = this.opaqueFileEntries.map((opaqueEntry) => {
			if (!isJsonRecord(opaqueEntry.record)) return opaqueEntry;
			const record = opaqueEntry.record;
			const parentId = record.parentId === null || typeof record.parentId === "string" ? resolveRetainedParentId(record.parentId) : void 0;
			const leafEntry = parseOpaqueLeafEntry(record);
			const targetId = leafEntry ? resolveRetainedParentId(leafEntry.targetId) : void 0;
			const appendParentId = leafEntry?.appendParentId !== void 0 ? resolveRetainedParentId(leafEntry.appendParentId) : void 0;
			if ((parentId === void 0 || parentId === record.parentId) && (targetId === void 0 || targetId === leafEntry?.targetId) && (appendParentId === void 0 || appendParentId === leafEntry?.appendParentId)) return opaqueEntry;
			return {
				...opaqueEntry,
				record: {
					...record,
					...parentId !== void 0 ? { parentId } : {},
					...targetId !== void 0 ? { targetId } : {},
					...appendParentId !== void 0 ? { appendParentId } : {}
				}
			};
		});
		this.clampOpaqueFileEntryIndexes();
		this.buildIndex();
		this.leafId = this.resolveCanonicalParentId(replacementParentId);
		this.appendParentId = replacementParentId;
		this.replacePersistedTranscript();
		return removedEntries.length;
	}
	persistRecord(entry, options, publishSnapshot = true) {
		if (this.sqlitePersistence) {
			this.persistSqliteRecord(entry, options);
			return;
		}
		if (!this.shouldPersist || !this.sessionFile) return;
		if (!this.fileEntries.some((fileEntry) => fileEntry.type === "message" && fileEntry.message.role === "assistant")) {
			this.flushed = false;
			return;
		}
		if (!this.flushed) {
			const content = this.writeFullFile();
			this.flushed = true;
			const rememberedWrite = rememberWrittenSessionEntries(this.sessionFile, content);
			this.sessionFileSnapshot = rememberedWrite.snapshot;
			if (rememberedWrite.verifiedWrite && publishSnapshot) publishRememberedSessionFileSnapshot(this.sessionFile, rememberedWrite.snapshot);
			return;
		}
		const serializationCanRunUserCode = jsonSerializationCanRunUserCode(entry);
		const serializedEntry = require_session_accessor.serializeJsonlEntry(entry);
		const beforeAppendSnapshot = readSessionFileSnapshotIfExists(this.sessionFile);
		const invalidateSerializedPrefixCache = options?.invalidateSerializedPrefixCache === true || serializationCanRunUserCode;
		const canPublishOwnedAppend = !serializationCanRunUserCode && canPublishOwnedSessionAppend(this.sessionFile, beforeAppendSnapshot);
		const cacheOwnedAppend = canPublishOwnedAppend && !invalidateSerializedPrefixCache;
		const serializedAppend = require_session_accessor.appendSerializedJsonlEntrySync(this.sessionFile, serializedEntry, { prefixNewline: sessionFileNeedsAppendSeparator(this.sessionFile, beforeAppendSnapshot) });
		const rememberedAppend = rememberAppendedSessionEntry({
			filePath: this.sessionFile,
			previousSnapshot: this.sessionFileSnapshot,
			beforeAppendSnapshot,
			serializedAppend,
			cacheOwnedAppend,
			publishOwnedAppend: canPublishOwnedAppend,
			invalidateSerializedPrefixCache
		});
		this.sessionFileSnapshot = rememberedAppend.snapshot;
		if (rememberedAppend.ownedAppendVerified && publishSnapshot) publishRememberedSessionFileSnapshot(this.sessionFile, rememberedAppend.snapshot);
		else if (cacheOwnedAppend) this.setLoadedSessionFile(this.sessionFile, revalidateLoadedSessionFile(this.sessionFile, {
			entries: this.fileEntries,
			snapshot: beforeAppendSnapshot
		}));
	}
	persist(entry, options) {
		this.persistRecord(entry, options);
	}
	persistSqliteRecord(entry, options) {
		if (!isIndexedSessionEntry(entry) || !this.sqlitePersistence) return;
		const scope = {
			agentId: this.sqlitePersistence.agentId,
			sessionId: this.sqlitePersistence.sessionId,
			sessionKey: this.sqlitePersistence.sessionKey,
			storePath: this.sqlitePersistence.storePath
		};
		if (entry.type !== "message") {
			require_session_accessor.appendTranscriptEventSync(scope, entry);
			return;
		}
		const result = require_session_accessor.appendTranscriptMessageSync(scope, {
			cwd: this.cwd,
			eventId: entry.id,
			...options?.config ? { config: options.config } : {},
			...options?.idempotencyLookup ? { idempotencyLookup: options.idempotencyLookup } : {},
			message: entry.message,
			now: Date.parse(entry.timestamp),
			parentId: entry.parentId
		});
		if (options?.idempotencyLookup === "caller-checked" && (!result?.appended || result.messageId !== entry.id)) throw new Error(`Session transcript append was not persisted: ${entry.id}`);
	}
	syncSnapshotAfterHeaderRewrite(expectedContent) {
		if (!this.sessionFile) return;
		const rememberedWrite = rememberWrittenSessionEntries(this.sessionFile, expectedContent);
		this.sessionFileSnapshot = rememberedWrite.snapshot;
		if (rememberedWrite.verifiedWrite) publishRememberedSessionFileSnapshot(this.sessionFile, rememberedWrite.snapshot);
	}
	mergePromptReleasedSessionEntries(entries, options) {
		this.assertPromptReleasedEntriesPreserveActiveLeaf(entries);
		let sideBranchParentId = this.promptReleasedSideBranchParentId === void 0 ? this.leafId : this.promptReleasedSideBranchParentId;
		let persistedLeafId = this.leafId;
		let persistedAppendParentId = this.appendParentId;
		let persistedAppendMode = this.promptReleasedSideBranchParentId === void 0 ? "active" : "side";
		let sawPersistedStateUpdate = false;
		let rawTailId = null;
		for (const sourceEntry of entries) {
			if (sourceEntry.type === "prompt_released_opaque") {
				this.opaqueFileEntries.push({
					index: this.fileEntries.length,
					record: sourceEntry.record
				});
				const leafEntry = parseOpaqueLeafEntry(sourceEntry.record);
				if (leafEntry) {
					rawTailId = leafEntry.id;
					const leafState = this.resolveOpaqueLeafControl(leafEntry);
					if (!leafState) {
						this.invalidLeafControlIds.add(leafEntry.id);
						this.opaqueParentsById.set(leafEntry.id, this.resolveOpaqueAppendParentId(leafEntry.parentId));
						continue;
					}
					this.opaqueParentsById.set(leafEntry.id, leafState.leafId);
					sideBranchParentId = leafState.appendParentId;
					persistedLeafId = leafState.leafId;
					persistedAppendParentId = leafState.appendParentId;
					persistedAppendMode = leafState.appendMode === "side" ? "side" : "active";
					sawPersistedStateUpdate = true;
					continue;
				}
				const link = parseParentLinkedOpaqueEntry(sourceEntry.record);
				if (link) {
					this.opaqueParentsById.set(link.id, link.parentId);
					sideBranchParentId = link.id;
					persistedAppendParentId = link.id;
					sawPersistedStateUpdate = true;
					rawTailId = link.id;
				}
				continue;
			}
			if (this.byId.has(sourceEntry.id)) throw new Error(`Entry ${sourceEntry.id} already exists`);
			if (sourceEntry.type === "label" && !this.byId.has(sourceEntry.targetId)) throw new Error(`Entry ${sourceEntry.targetId} not found`);
			const entry = {
				...sourceEntry,
				parentId: sideBranchParentId
			};
			this.fileEntries.push(entry);
			this.byId.set(entry.id, entry);
			sideBranchParentId = entry.id;
			persistedAppendParentId = entry.id;
			if (require_transcript_tree.isSessionTranscriptSideAppendEntry(entry)) persistedAppendMode = "side";
			else {
				persistedLeafId = entry.id;
				persistedAppendMode = "active";
			}
			sawPersistedStateUpdate = true;
			rawTailId = entry.id;
			if (entry.type === "label") if (entry.label) {
				this.labelsById.set(entry.targetId, entry.label);
				this.labelTimestampsById.set(entry.targetId, entry.timestamp);
			} else {
				this.labelsById.delete(entry.targetId);
				this.labelTimestampsById.delete(entry.targetId);
			}
		}
		this.promptReleasedSideBranchParentId = sideBranchParentId;
		if (this.sessionFile) this.sessionFileSnapshot = readSessionFileSnapshotIfExists(this.sessionFile);
		if (options?.persistLeaf !== true || !this.shouldPersist || !this.sessionFile || !sawPersistedStateUpdate || persistedLeafId === this.leafId && persistedAppendParentId === sideBranchParentId && persistedAppendMode === "side") return;
		const hasAssistant = this.fileEntries.some((entry) => entry.type === "message" && entry.message.role === "assistant");
		if (this.sqlitePersistence) {
			const leafEntry = this.createLeafControl(rawTailId, sideBranchParentId, "side");
			require_session_accessor.appendTranscriptEventSync({
				agentId: this.sqlitePersistence.agentId,
				sessionId: this.sqlitePersistence.sessionId,
				sessionKey: this.sqlitePersistence.sessionKey,
				storePath: this.sqlitePersistence.storePath
			}, leafEntry);
			this.rememberLeafControl(leafEntry);
			this.flushed = true;
			return { publishedEntries: [{
				kind: "id",
				id: leafEntry.id
			}] };
		}
		if (!this.flushed || !hasAssistant) {
			this.replacePersistedTranscript({
				publishSnapshot: false,
				leafAppendParentId: sideBranchParentId,
				leafAppendMode: "side"
			});
			this.flushed = true;
			if (!this.sessionFileSnapshot) throw new Error(`Unable to snapshot restored session file: ${this.sessionFile}`);
			return {
				sessionFileSnapshot: this.sessionFileSnapshot,
				requiresReload: true
			};
		}
		const leafEntry = this.createLeafControl(rawTailId, sideBranchParentId, "side");
		this.persistRecord(leafEntry, void 0, false);
		this.rememberLeafControl(leafEntry);
		if (!this.sessionFileSnapshot) throw new Error(`Unable to snapshot restored session file: ${this.sessionFile}`);
		return {
			sessionFileSnapshot: this.sessionFileSnapshot,
			publishedEntries: [{
				kind: "id",
				id: leafEntry.id
			}]
		};
	}
	assertPromptReleasedEntriesPreserveActiveLeaf(entries) {
		let sideBranchParentId = this.promptReleasedSideBranchParentId === void 0 ? this.leafId : this.promptReleasedSideBranchParentId;
		for (const entry of entries) {
			if (entry.type !== "prompt_released_opaque") {
				sideBranchParentId = entry.id;
				continue;
			}
			const leaf = parseOpaqueLeafEntry(entry.record);
			if (leaf && entry.preserveActiveLeaf) {
				const appendParentId = leaf.appendParentId === void 0 ? leaf.targetId : leaf.appendParentId;
				if (leaf.appendMode !== "side" || leaf.targetId !== this.leafId || leaf.parentId !== sideBranchParentId || appendParentId !== sideBranchParentId) throw new Error("prompt-released side leaf changed the active branch");
				continue;
			}
			const link = parseParentLinkedOpaqueEntry(entry.record);
			if (link) sideBranchParentId = link.id;
		}
	}
};
//#endregion
//#region src/agents/sessions/session-manager-entries.ts
var SessionManagerEntries = class extends SessionManagerPersistence {
	appendEntry(entry, options) {
		if (!require_transcript_tree.isSessionTranscriptSideAppendEntry(entry) && entry.parentId === this.appendParentId && this.leafId !== this.appendParentId) this.logicalParentsById.set(entry.id, this.leafId);
		this.fileEntries.push(entry);
		this.byId.set(entry.id, entry);
		this.leafId = entry.id;
		this.appendParentId = entry.id;
		this.promptReleasedSideBranchParentId = void 0;
		this.persist(entry, options);
	}
	appendMessage(message, options) {
		const invalidateSerializedPrefixCache = options?.invalidateSerializedPrefixCache === true || messageSerializesOwnedValues(message);
		const entry = {
			type: "message",
			id: generateSessionEntryId(this.byId),
			parentId: this.appendParentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			message
		};
		this.appendEntry(entry, {
			...options,
			invalidateSerializedPrefixCache
		});
		return entry.id;
	}
	appendThinkingLevelChange(thinkingLevel) {
		const entry = {
			type: "thinking_level_change",
			id: generateSessionEntryId(this.byId),
			parentId: this.appendParentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			thinkingLevel
		};
		this.appendEntry(entry);
		return entry.id;
	}
	appendModelChange(provider, modelId) {
		const entry = {
			type: "model_change",
			id: generateSessionEntryId(this.byId),
			parentId: this.appendParentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			provider,
			modelId
		};
		this.appendEntry(entry);
		return entry.id;
	}
	appendCompaction(summary, firstKeptEntryId, tokensBefore, details, fromHook) {
		const entry = {
			type: "compaction",
			id: generateSessionEntryId(this.byId),
			parentId: this.appendParentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			summary,
			firstKeptEntryId,
			tokensBefore,
			details,
			fromHook
		};
		this.appendEntry(entry, { invalidateSerializedPrefixCache: fromHook === true || details !== void 0 });
		return entry.id;
	}
	appendCustomEntry(customType, data) {
		const entry = {
			type: "custom",
			customType,
			data,
			id: generateSessionEntryId(this.byId),
			parentId: this.appendParentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		};
		this.appendEntry(entry, { invalidateSerializedPrefixCache: true });
		return entry.id;
	}
	appendSessionInfo(name) {
		const entry = {
			type: "session_info",
			id: generateSessionEntryId(this.byId),
			parentId: this.appendParentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			name: name.trim()
		};
		this.appendEntry(entry);
		return entry.id;
	}
	getSessionName() {
		for (const entry of this.getEntries().toReversed()) if (entry.type === "session_info") return entry.name?.trim() || void 0;
	}
	appendCustomMessageEntry(customType, content, display, details) {
		const entry = {
			type: "custom_message",
			customType,
			content,
			display,
			details,
			id: generateSessionEntryId(this.byId),
			parentId: this.appendParentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		};
		this.appendEntry(entry, { invalidateSerializedPrefixCache: true });
		return entry.id;
	}
	getLeafId() {
		return this.leafId;
	}
	getLeafEntry() {
		return this.leafId ? this.getEntry(this.leafId) : void 0;
	}
	getEntry(id) {
		const entry = this.byId.get(id);
		return entry ? this.normalizeEntryParent(entry) : void 0;
	}
	getChildren(parentId) {
		const children = [];
		for (const entry of this.byId.values()) {
			const normalizedEntry = this.normalizeEntryParent(entry);
			if (normalizedEntry.parentId === parentId) children.push(normalizedEntry);
		}
		return children;
	}
	getLabel(id) {
		return this.labelsById.get(id);
	}
	appendLabelChange(targetId, label) {
		if (!this.byId.has(targetId)) throw new Error(`Entry ${targetId} not found`);
		const entry = {
			type: "label",
			id: generateSessionEntryId(this.byId),
			parentId: this.appendParentId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			targetId,
			label
		};
		this.appendEntry(entry);
		if (label) {
			this.labelsById.set(targetId, label);
			this.labelTimestampsById.set(targetId, entry.timestamp);
		} else {
			this.labelsById.delete(targetId);
			this.labelTimestampsById.delete(targetId);
		}
		return entry.id;
	}
	getBranch(fromId) {
		const path = [];
		const seen = /* @__PURE__ */ new Set();
		let currentId = fromId ?? this.leafId;
		while (currentId && !seen.has(currentId)) {
			seen.add(currentId);
			const current = this.byId.get(currentId);
			if (current) {
				const normalizedCurrent = this.normalizeEntryParent(current);
				path.unshift(normalizedCurrent);
				currentId = normalizedCurrent.parentId;
			} else currentId = this.opaqueParentsById.get(currentId) ?? null;
		}
		return path;
	}
	buildSessionContext() {
		return buildSessionContext$1(this.getBranch());
	}
	getHeader() {
		return this.fileEntries.find((entry) => entry.type === "session") ?? null;
	}
	getEntries() {
		return this.fileEntries.filter((entry) => entry.type !== "session").map((entry) => this.normalizeEntryParent(entry));
	}
	getTree() {
		const entries = this.getEntries();
		const nodeMap = /* @__PURE__ */ new Map();
		const roots = [];
		for (const entry of entries) nodeMap.set(entry.id, {
			entry,
			children: [],
			label: this.labelsById.get(entry.id),
			labelTimestamp: this.labelTimestampsById.get(entry.id)
		});
		for (const entry of entries) {
			const node = nodeMap.get(entry.id);
			const parentId = this.resolveCanonicalParentId(entry.parentId);
			if (parentId === null || parentId === entry.id) roots.push(node);
			else {
				const parent = nodeMap.get(parentId);
				if (parent) parent.children.push(node);
				else roots.push(node);
			}
		}
		const stack = [...roots];
		while (stack.length > 0) {
			const node = stack.pop();
			node.children.sort((left, right) => new Date(left.entry.timestamp).getTime() - new Date(right.entry.timestamp).getTime());
			stack.push(...node.children);
		}
		return roots;
	}
	branch(branchFromId) {
		const branchTargetId = this.resolveBranchTargetId(branchFromId);
		if (branchTargetId === void 0) throw new Error(`Entry ${branchFromId} not found`);
		this.leafId = branchTargetId;
		this.appendParentId = branchTargetId;
		this.promptReleasedSideBranchParentId = void 0;
	}
	resetLeaf() {
		this.leafId = null;
		this.appendParentId = null;
		this.promptReleasedSideBranchParentId = void 0;
	}
	branchWithSummary(branchFromId, summary, details, fromHook) {
		const branchTargetId = branchFromId === null ? null : this.resolveBranchTargetId(branchFromId);
		if (branchTargetId === void 0) throw new Error(`Entry ${branchFromId} not found`);
		this.leafId = branchTargetId;
		this.appendParentId = branchTargetId;
		const entry = {
			type: "branch_summary",
			id: generateSessionEntryId(this.byId),
			parentId: branchTargetId,
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			fromId: branchTargetId ?? "root",
			summary,
			details,
			fromHook
		};
		this.appendEntry(entry, { invalidateSerializedPrefixCache: fromHook === true || details !== void 0 });
		return entry.id;
	}
};
//#endregion
//#region src/agents/sessions/session-manager-branching.ts
var SessionManagerBranching = class extends SessionManagerEntries {
	collectBranchedSessionPath(leafId) {
		const opaqueById = /* @__PURE__ */ new Map();
		for (const opaqueEntry of this.opaqueFileEntries) {
			const link = parseOpaqueLeafEntry(opaqueEntry.record) ?? parseParentLinkedOpaqueEntry(opaqueEntry.record);
			if (link && isJsonRecord(opaqueEntry.record)) opaqueById.set(link.id, opaqueEntry.record);
		}
		const reversedNodes = [];
		const seen = /* @__PURE__ */ new Set();
		let currentId = leafId;
		while (currentId && !seen.has(currentId)) {
			seen.add(currentId);
			const entry = this.byId.get(currentId);
			if (entry) {
				reversedNodes.push({
					type: "entry",
					entry
				});
				if (this.logicalParentsById.has(entry.id)) {
					let physicalId = entry.parentId;
					while (physicalId && !seen.has(physicalId)) {
						const physicalRecord = opaqueById.get(physicalId);
						if (!physicalRecord || !this.opaqueParentsById.has(physicalId)) break;
						seen.add(physicalId);
						reversedNodes.push({
							type: "opaque",
							id: physicalId,
							record: physicalRecord
						});
						physicalId = this.opaqueParentsById.get(physicalId) ?? null;
					}
					currentId = this.logicalParentsById.get(entry.id) ?? null;
				} else currentId = entry.parentId;
				continue;
			}
			const record = opaqueById.get(currentId);
			if (!record || !this.opaqueParentsById.has(currentId)) break;
			reversedNodes.push({
				type: "opaque",
				id: currentId,
				record
			});
			currentId = this.opaqueParentsById.get(currentId) ?? null;
		}
		const entries = [];
		const opaqueEntries = [];
		const usedIds = /* @__PURE__ */ new Set();
		let tailId = null;
		for (const node of reversedNodes.toReversed()) {
			if (node.type === "entry") {
				if (node.entry.type === "label") continue;
				const branchEntry = node.entry.parentId === tailId ? node.entry : {
					...node.entry,
					parentId: tailId
				};
				entries.push(branchEntry);
				usedIds.add(branchEntry.id);
				tailId = branchEntry.id;
				continue;
			}
			if (parseOpaqueLeafEntry(node.record)) continue;
			opaqueEntries.push({
				index: entries.length + 1,
				record: {
					...node.record,
					parentId: tailId
				}
			});
			usedIds.add(node.id);
			tailId = node.id;
		}
		return {
			entries,
			opaqueEntries,
			tailId,
			usedIds
		};
	}
	createBranchedSession(leafId) {
		const previousSessionFile = this.sessionFile;
		const branchPath = this.collectBranchedSessionPath(leafId);
		if (branchPath.entries.length === 0) throw new Error(`Entry ${leafId} not found`);
		const newSessionId = createSessionId();
		const timestamp = (/* @__PURE__ */ new Date()).toISOString();
		const fileTimestamp = timestamp.replace(/[:.]/g, "-");
		const sqlitePersistence = this.sqlitePersistence;
		const newSessionFile = sqlitePersistence ? require_sqlite_marker.formatSqliteSessionFileMarker({
			agentId: sqlitePersistence.agentId,
			sessionId: newSessionId,
			storePath: sqlitePersistence.storePath
		}) : (0, node_path.join)(this.getSessionDir(), `${fileTimestamp}_${newSessionId}.jsonl`);
		const header = {
			type: "session",
			version: 3,
			id: newSessionId,
			timestamp,
			cwd: this.cwd,
			parentSession: this.shouldPersist ? previousSessionFile : void 0
		};
		const pathEntryIds = new Set(branchPath.entries.map((entry) => entry.id));
		const labelsToWrite = [];
		for (const [targetId, label] of this.labelsById) if (pathEntryIds.has(targetId)) labelsToWrite.push({
			targetId,
			label,
			timestamp: this.labelTimestampsById.get(targetId)
		});
		const labelEntries = [];
		let parentId = branchPath.tailId;
		for (const { targetId, label, timestamp: labelTimestamp } of labelsToWrite) {
			const labelEntry = {
				type: "label",
				id: generateSessionEntryId(branchPath.usedIds),
				parentId,
				timestamp: labelTimestamp,
				targetId,
				label
			};
			branchPath.usedIds.add(labelEntry.id);
			labelEntries.push(labelEntry);
			parentId = labelEntry.id;
		}
		this.fileEntries = [
			header,
			...branchPath.entries,
			...labelEntries
		];
		this.opaqueFileEntries = branchPath.opaqueEntries;
		this.sessionId = newSessionId;
		this.sessionFileSnapshot = void 0;
		if (this.shouldPersist) {
			this.sessionFile = newSessionFile;
			if (sqlitePersistence) {
				const updatedAt = Date.now();
				const previousEntry = require_session_accessor.loadSessionEntry({
					agentId: sqlitePersistence.agentId,
					sessionKey: sqlitePersistence.sessionKey,
					storePath: sqlitePersistence.storePath
				});
				this.sqlitePersistence = {
					...sqlitePersistence,
					sessionId: newSessionId
				};
				require_session_accessor.replaceSessionEntrySync({
					agentId: sqlitePersistence.agentId,
					sessionKey: sqlitePersistence.sessionKey,
					storePath: sqlitePersistence.storePath
				}, {
					...previousEntry ?? { updatedAt },
					sessionFile: newSessionFile,
					sessionId: newSessionId,
					updatedAt
				});
			}
			this.buildIndex();
			if (this.fileEntries.some((entry) => entry.type === "message" && entry.message.role === "assistant")) {
				this.replacePersistedTranscript();
				this.flushed = true;
			} else this.flushed = false;
			return newSessionFile;
		}
		this.buildIndex();
	}
};
//#endregion
//#region src/agents/sessions/session-manager-list.ts
const SESSION_HEADER_READ_CHUNK_BYTES = 4096;
const MAX_SESSION_HEADER_BYTES = 64 * 1024;
const MAX_CONCURRENT_SESSION_INFO_LOADS = 10;
function readFirstSessionFileLine(filePath) {
	const fd = (0, node_fs.openSync)(filePath, "r");
	try {
		const chunks = [];
		let totalBytes = 0;
		while (totalBytes < MAX_SESSION_HEADER_BYTES) {
			const buffer = Buffer.alloc(Math.min(SESSION_HEADER_READ_CHUNK_BYTES, MAX_SESSION_HEADER_BYTES - totalBytes));
			const bytesRead = (0, node_fs.readSync)(fd, buffer, 0, buffer.length, totalBytes);
			if (bytesRead === 0) break;
			const newlineIndex = buffer.indexOf(10);
			if (newlineIndex >= 0 && newlineIndex < bytesRead) {
				chunks.push(buffer.subarray(0, newlineIndex));
				return Buffer.concat(chunks).toString("utf8");
			}
			chunks.push(buffer.subarray(0, bytesRead));
			totalBytes += bytesRead;
		}
		return chunks.length > 0 ? Buffer.concat(chunks).toString("utf8") : void 0;
	} finally {
		(0, node_fs.closeSync)(fd);
	}
}
function readSessionHeaderFromFile(filePath) {
	try {
		const firstLine = readFirstSessionFileLine(filePath);
		if (!firstLine) return;
		const header = JSON.parse(firstLine);
		return header.type === "session" && typeof header.id === "string" ? header : void 0;
	} catch {
		return;
	}
}
function findMostRecentSession(sessionDir, cwd) {
	try {
		return (0, node_fs.readdirSync)(sessionDir).filter((file) => file.endsWith(".jsonl")).map((file) => (0, node_path.join)(sessionDir, file)).map((path) => ({
			path,
			header: readSessionHeaderFromFile(path)
		})).filter((candidate) => candidate.header !== void 0 && (cwd === void 0 || candidate.header.cwd === cwd)).map((candidate) => ({
			path: candidate.path,
			mtime: (0, node_fs.statSync)(candidate.path).mtime
		})).toSorted((left, right) => right.mtime.getTime() - left.mtime.getTime())[0]?.path || null;
	} catch {
		return null;
	}
}
function isMessageWithContent(message) {
	return typeof message.role === "string" && "content" in message;
}
function extractTextContent(message) {
	if (typeof message.content === "string") return message.content;
	return message.content.filter((block) => block.type === "text").map((block) => block.text).join(" ");
}
function getLastActivityTime(entries) {
	let lastActivityTime;
	for (const entry of entries) {
		if (entry.type !== "message") continue;
		const message = entry.message;
		if (!isMessageWithContent(message) || message.role !== "user" && message.role !== "assistant") continue;
		const messageTimestamp = message.timestamp;
		if (typeof messageTimestamp === "number") {
			lastActivityTime = Math.max(lastActivityTime ?? 0, messageTimestamp);
			continue;
		}
		const entryTimestamp = entry.timestamp;
		if (typeof entryTimestamp === "string") {
			const timestamp = new Date(entryTimestamp).getTime();
			if (!Number.isNaN(timestamp)) lastActivityTime = Math.max(lastActivityTime ?? 0, timestamp);
		}
	}
	return lastActivityTime;
}
function getSessionModifiedDate(entries, header, statsMtime) {
	const lastActivityTime = getLastActivityTime(entries);
	if (typeof lastActivityTime === "number" && lastActivityTime > 0) return new Date(lastActivityTime);
	const headerTime = typeof header.timestamp === "string" ? new Date(header.timestamp).getTime() : NaN;
	return !Number.isNaN(headerTime) ? new Date(headerTime) : statsMtime;
}
async function buildSessionInfo(filePath) {
	try {
		const content = await (0, node_fs_promises.readFile)(filePath, "utf8");
		const entries = [];
		let skipped = 0;
		for (const line of content.trim().split("\n")) {
			if (!line.trim()) continue;
			try {
				entries.push(JSON.parse(line));
			} catch {
				skipped += 1;
			}
		}
		if (skipped > 0) require_logger.logWarn(`buildSessionInfo: skipped ${skipped} malformed JSONL line(s) in ${filePath} — ${entries.length} valid entries were loaded`);
		const header = entries[0];
		if (header?.type !== "session") return null;
		const stats = await (0, node_fs_promises.stat)(filePath);
		let messageCount = 0;
		let firstMessage = "";
		const allMessages = [];
		let name;
		for (const entry of entries) {
			if (entry.type === "session_info") name = entry.name?.trim() || void 0;
			if (entry.type !== "message") continue;
			messageCount += 1;
			const message = entry.message;
			if (!isMessageWithContent(message) || message.role !== "user" && message.role !== "assistant") continue;
			const textContent = extractTextContent(message);
			if (!textContent) continue;
			allMessages.push(textContent);
			if (!firstMessage && message.role === "user") firstMessage = textContent;
		}
		return {
			path: filePath,
			id: header.id,
			cwd: typeof header.cwd === "string" ? header.cwd : "",
			name,
			parentSessionPath: header.parentSession,
			created: new Date(header.timestamp),
			modified: getSessionModifiedDate(entries, header, stats.mtime),
			messageCount,
			firstMessage: firstMessage || "(no messages)",
			allMessagesText: allMessages.join(" ")
		};
	} catch {
		return null;
	}
}
async function listSessionsFromDir(dir, onProgress, progressOffset = 0, progressTotal, cwd) {
	if (!(0, node_fs.existsSync)(dir)) return [];
	try {
		const files = (await (0, node_fs_promises.readdir)(dir)).filter((file) => file.endsWith(".jsonl")).map((file) => (0, node_path.join)(dir, file));
		const total = progressTotal ?? files.length;
		let loaded = 0;
		return (await (0, p_map.default)(files, async (file) => {
			try {
				return await buildSessionInfo(file) ?? p_map.pMapSkip;
			} catch {
				return p_map.pMapSkip;
			} finally {
				loaded += 1;
				onProgress?.(progressOffset + loaded, total);
			}
		}, {
			concurrency: MAX_CONCURRENT_SESSION_INFO_LOADS,
			stopOnError: false
		})).filter((info) => cwd === void 0 || info.cwd === cwd);
	} catch {
		return [];
	}
}
async function listSessions(cwd, sessionDir, onProgress) {
	const sessions = await listSessionsFromDir(sessionDir, onProgress, 0, void 0, cwd);
	sessions.sort((left, right) => right.modified.getTime() - left.modified.getTime());
	return sessions;
}
async function listAllSessions(onProgress) {
	try {
		const sessionsDir = require_config.getSessionsDir();
		if (!(0, node_fs.existsSync)(sessionsDir)) return [];
		const directories = (await (0, node_fs_promises.readdir)(sessionsDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => (0, node_path.join)(sessionsDir, entry.name));
		const directoryFiles = [];
		let totalFiles = 0;
		for (const directory of directories) try {
			const files = (await (0, node_fs_promises.readdir)(directory)).filter((file) => file.endsWith(".jsonl")).map((file) => (0, node_path.join)(directory, file));
			directoryFiles.push(files);
			totalFiles += files.length;
		} catch {
			directoryFiles.push([]);
		}
		let loaded = 0;
		const sessions = await (0, p_map.default)(directoryFiles.flat(), async (file) => {
			try {
				return await buildSessionInfo(file) ?? p_map.pMapSkip;
			} catch {
				return p_map.pMapSkip;
			} finally {
				loaded += 1;
				onProgress?.(loaded, totalFiles);
			}
		}, {
			concurrency: MAX_CONCURRENT_SESSION_INFO_LOADS,
			stopOnError: false
		});
		sessions.sort((left, right) => right.modified.getTime() - left.modified.getTime());
		return sessions;
	} catch {
		return [];
	}
}
//#endregion
//#region src/agents/sessions/session-manager.ts
/**
* JSONL-backed session tree manager.
*
* The public facade lives here; codec, storage, discovery, persistence, and
* branching behavior are split into focused internal modules.
*/
var SessionManager = class SessionManager extends SessionManagerBranching {
	constructor(cwd, sessionDir, sessionFile, persist, loadedSessionFile, sqlitePersistence) {
		super(cwd, sessionDir, sessionFile, persist, loadedSessionFile, sqlitePersistence);
	}
	setSessionFile(sessionFile) {
		super.setSessionFile(sessionFile);
	}
	newSession(options) {
		return super.newSession(options);
	}
	getSerializedFileLinesForRewrite() {
		return super.getSerializedFileLinesForRewrite();
	}
	clearPreservedOpaqueFileEntries() {
		super.clearPreservedOpaqueFileEntries();
	}
	isPersisted() {
		return super.isPersisted();
	}
	getCwd() {
		return super.getCwd();
	}
	getSessionDir() {
		return super.getSessionDir();
	}
	getSessionId() {
		return super.getSessionId();
	}
	wasRecoveredFromCorruptHeader() {
		return super.wasRecoveredFromCorruptHeader();
	}
	getSessionFile() {
		return super.getSessionFile();
	}
	removeTrailingEntries(predicate, options) {
		return super.removeTrailingEntries(predicate, options);
	}
	persist(entry, options) {
		super.persist(entry, options);
	}
	syncSnapshotAfterHeaderRewrite(expectedContent) {
		super.syncSnapshotAfterHeaderRewrite(expectedContent);
	}
	mergePromptReleasedSessionEntries(entries, options) {
		return super.mergePromptReleasedSessionEntries(entries, options);
	}
	appendMessage(message, options) {
		return super.appendMessage(message, options);
	}
	appendThinkingLevelChange(thinkingLevel) {
		return super.appendThinkingLevelChange(thinkingLevel);
	}
	appendModelChange(provider, modelId) {
		return super.appendModelChange(provider, modelId);
	}
	appendCompaction(summary, firstKeptEntryId, tokensBefore, details, fromHook) {
		return super.appendCompaction(summary, firstKeptEntryId, tokensBefore, details, fromHook);
	}
	appendCustomEntry(customType, data) {
		return super.appendCustomEntry(customType, data);
	}
	appendSessionInfo(name) {
		return super.appendSessionInfo(name);
	}
	getSessionName() {
		return super.getSessionName();
	}
	appendCustomMessageEntry(customType, content, display, details) {
		return super.appendCustomMessageEntry(customType, content, display, details);
	}
	getLeafId() {
		return super.getLeafId();
	}
	getLeafEntry() {
		return super.getLeafEntry();
	}
	getEntry(id) {
		return super.getEntry(id);
	}
	getChildren(parentId) {
		return super.getChildren(parentId);
	}
	getLabel(id) {
		return super.getLabel(id);
	}
	appendLabelChange(targetId, label) {
		return super.appendLabelChange(targetId, label);
	}
	getBranch(fromId) {
		return super.getBranch(fromId);
	}
	buildSessionContext() {
		return super.buildSessionContext();
	}
	getHeader() {
		return super.getHeader();
	}
	getEntries() {
		return super.getEntries();
	}
	getTree() {
		return super.getTree();
	}
	branch(branchFromId) {
		super.branch(branchFromId);
	}
	resetLeaf() {
		super.resetLeaf();
	}
	branchWithSummary(branchFromId, summary, details, fromHook) {
		return super.branchWithSummary(branchFromId, summary, details, fromHook);
	}
	createBranchedSession(leafId) {
		return super.createBranchedSession(leafId);
	}
	static create(cwd, sessionDir) {
		const directory = sessionDir ?? getDefaultSessionDir(cwd);
		return new SessionManager(cwd, directory, void 0, true);
	}
	static open(path, sessionDir, cwdOverride) {
		const sqliteLoaded = loadSqliteMarkedSessionFile(path, (marker) => require_session_accessor.loadTranscriptEventsSync(marker), { cwdOverride });
		if (sqliteLoaded) return new SessionManager(sqliteLoaded.cwd, sessionDir ?? "", path, true, {
			entries: sqliteLoaded.entries,
			snapshot: void 0
		}, {
			...sqliteLoaded.sqliteMarker,
			sessionKey: sqliteLoaded.sessionKey
		});
		const loaded = revalidateLoadedSessionFile(path, loadEntriesFromFileWithSnapshot(path));
		const header = loaded.entries.find((entry) => entry.type === "session");
		const cwd = cwdOverride ?? header?.cwd ?? process.cwd();
		const directory = sessionDir ?? (0, node_path.resolve)(path, "..");
		return new SessionManager(cwd, directory, path, true, loaded);
	}
	static continueRecent(cwd, sessionDir) {
		const directory = sessionDir ?? getDefaultSessionDir(cwd);
		const mostRecent = findMostRecentSession(directory, cwd);
		return mostRecent ? new SessionManager(cwd, directory, mostRecent, true) : new SessionManager(cwd, directory, void 0, true);
	}
	static inMemory(cwd = process.cwd()) {
		return new SessionManager(cwd, "", void 0, false);
	}
	static forkFrom(sourcePath, targetCwd, sessionDir) {
		const sourceEntries = loadEntriesFromFile(sourcePath);
		if (sourceEntries.length === 0) throw new Error(`Cannot fork: source session file is empty or invalid: ${sourcePath}`);
		if (!sourceEntries.some((entry) => entry.type === "session")) throw new Error(`Cannot fork: source session has no header: ${sourcePath}`);
		const directory = sessionDir ?? getDefaultSessionDir(targetCwd);
		if (!(0, node_fs.existsSync)(directory)) (0, node_fs.mkdirSync)(directory, { recursive: true });
		const newSessionId = createSessionId();
		const timestamp = (/* @__PURE__ */ new Date()).toISOString();
		const newSessionFile = (0, node_path.join)(directory, `${timestamp.replace(/[:.]/g, "-")}_${newSessionId}.jsonl`);
		require_session_accessor.appendJsonlEntrySync(newSessionFile, {
			type: "session",
			version: 3,
			id: newSessionId,
			timestamp,
			cwd: targetCwd,
			parentSession: sourcePath
		});
		for (const entry of sourceEntries) if (entry.type !== "session") require_session_accessor.appendJsonlEntrySync(newSessionFile, entry);
		return new SessionManager(targetCwd, directory, newSessionFile, true);
	}
	static async list(cwd, sessionDir, onProgress) {
		return await listSessions(cwd, sessionDir ?? getDefaultSessionDir(cwd), onProgress);
	}
	static async listAll(onProgress) {
		return await listAllSessions(onProgress);
	}
};
//#endregion
Object.defineProperty(exports, "Agent", {
	enumerable: true,
	get: function() {
		return Agent;
	}
});
Object.defineProperty(exports, "BRANCH_SUMMARY_PREFIX", {
	enumerable: true,
	get: function() {
		return BRANCH_SUMMARY_PREFIX;
	}
});
Object.defineProperty(exports, "BRANCH_SUMMARY_SUFFIX", {
	enumerable: true,
	get: function() {
		return BRANCH_SUMMARY_SUFFIX;
	}
});
Object.defineProperty(exports, "COMPACTION_SUMMARY_PREFIX", {
	enumerable: true,
	get: function() {
		return COMPACTION_SUMMARY_PREFIX;
	}
});
Object.defineProperty(exports, "COMPACTION_SUMMARY_SUFFIX", {
	enumerable: true,
	get: function() {
		return COMPACTION_SUMMARY_SUFFIX;
	}
});
Object.defineProperty(exports, "DEFAULT_COMPACTION_SETTINGS", {
	enumerable: true,
	get: function() {
		return DEFAULT_COMPACTION_SETTINGS;
	}
});
Object.defineProperty(exports, "DEFAULT_MAX_BYTES", {
	enumerable: true,
	get: function() {
		return DEFAULT_MAX_BYTES;
	}
});
Object.defineProperty(exports, "DEFAULT_MAX_LINES", {
	enumerable: true,
	get: function() {
		return DEFAULT_MAX_LINES;
	}
});
Object.defineProperty(exports, "SessionManager", {
	enumerable: true,
	get: function() {
		return SessionManager;
	}
});
Object.defineProperty(exports, "bashExecutionToText", {
	enumerable: true,
	get: function() {
		return bashExecutionToText;
	}
});
Object.defineProperty(exports, "buildSessionContext", {
	enumerable: true,
	get: function() {
		return buildSessionContext;
	}
});
Object.defineProperty(exports, "buildSessionContext$1", {
	enumerable: true,
	get: function() {
		return buildSessionContext$1;
	}
});
Object.defineProperty(exports, "calculateContextTokens", {
	enumerable: true,
	get: function() {
		return calculateContextTokens;
	}
});
Object.defineProperty(exports, "collectEntriesForBranchSummaryFromBranches", {
	enumerable: true,
	get: function() {
		return collectEntriesForBranchSummaryFromBranches;
	}
});
Object.defineProperty(exports, "compact", {
	enumerable: true,
	get: function() {
		return compact;
	}
});
Object.defineProperty(exports, "convertToLlm", {
	enumerable: true,
	get: function() {
		return convertToLlm;
	}
});
Object.defineProperty(exports, "estimateContextTokens", {
	enumerable: true,
	get: function() {
		return estimateContextTokens;
	}
});
Object.defineProperty(exports, "estimateTokens", {
	enumerable: true,
	get: function() {
		return estimateTokens;
	}
});
Object.defineProperty(exports, "findCutPoint", {
	enumerable: true,
	get: function() {
		return findCutPoint;
	}
});
Object.defineProperty(exports, "findMostRecentSession", {
	enumerable: true,
	get: function() {
		return findMostRecentSession;
	}
});
Object.defineProperty(exports, "findTurnStartIndex", {
	enumerable: true,
	get: function() {
		return findTurnStartIndex;
	}
});
Object.defineProperty(exports, "formatSize", {
	enumerable: true,
	get: function() {
		return formatSize;
	}
});
Object.defineProperty(exports, "generateBranchSummary", {
	enumerable: true,
	get: function() {
		return generateBranchSummary;
	}
});
Object.defineProperty(exports, "generateSummary", {
	enumerable: true,
	get: function() {
		return generateSummary;
	}
});
Object.defineProperty(exports, "getDefaultSessionDir", {
	enumerable: true,
	get: function() {
		return getDefaultSessionDir;
	}
});
Object.defineProperty(exports, "getLastAssistantUsage", {
	enumerable: true,
	get: function() {
		return getLastAssistantUsage;
	}
});
Object.defineProperty(exports, "getLatestCompactionEntry", {
	enumerable: true,
	get: function() {
		return getLatestCompactionEntry;
	}
});
Object.defineProperty(exports, "invalidateSessionFileRepairCache", {
	enumerable: true,
	get: function() {
		return invalidateSessionFileRepairCache;
	}
});
Object.defineProperty(exports, "llm_exports", {
	enumerable: true,
	get: function() {
		return llm_exports;
	}
});
Object.defineProperty(exports, "loadEntriesFromFile", {
	enumerable: true,
	get: function() {
		return loadEntriesFromFile;
	}
});
Object.defineProperty(exports, "migrateSessionEntries", {
	enumerable: true,
	get: function() {
		return migrateSessionEntries;
	}
});
Object.defineProperty(exports, "normalizeLoadedFileEntry", {
	enumerable: true,
	get: function() {
		return normalizeLoadedFileEntry;
	}
});
Object.defineProperty(exports, "openClawAgentCoreRuntime", {
	enumerable: true,
	get: function() {
		return openClawAgentCoreRuntime;
	}
});
Object.defineProperty(exports, "parseSessionEntries", {
	enumerable: true,
	get: function() {
		return parseSessionEntries;
	}
});
Object.defineProperty(exports, "prepareBranchEntries", {
	enumerable: true,
	get: function() {
		return prepareBranchEntries;
	}
});
Object.defineProperty(exports, "prepareCompaction", {
	enumerable: true,
	get: function() {
		return prepareCompaction;
	}
});
Object.defineProperty(exports, "repairSessionFileIfNeeded", {
	enumerable: true,
	get: function() {
		return repairSessionFileIfNeeded;
	}
});
Object.defineProperty(exports, "runAgentLoop", {
	enumerable: true,
	get: function() {
		return runAgentLoop;
	}
});
Object.defineProperty(exports, "serializeConversation", {
	enumerable: true,
	get: function() {
		return serializeConversation;
	}
});
Object.defineProperty(exports, "shouldCompact", {
	enumerable: true,
	get: function() {
		return shouldCompact;
	}
});
Object.defineProperty(exports, "truncateHead", {
	enumerable: true,
	get: function() {
		return truncateHead;
	}
});
Object.defineProperty(exports, "truncateLine", {
	enumerable: true,
	get: function() {
		return truncateLine;
	}
});
Object.defineProperty(exports, "truncateTail", {
	enumerable: true,
	get: function() {
		return truncateTail;
	}
});
Object.defineProperty(exports, "uuidv7", {
	enumerable: true,
	get: function() {
		return uuidv7;
	}
});
