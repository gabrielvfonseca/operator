require("./utils-CXqBhRFw.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_tool_result_error = require("./tool-result-error-CAe0MnLg.cjs");
const require_embedded_agent_messaging = require("./embedded-agent-messaging-cGDfXH3g.cjs");
const require_embedded_agent_message_tool_source_reply = require("./embedded-agent-message-tool-source-reply-l_n9VmGj.cjs");
const require_json_utf8_bytes = require("./json-utf8-bytes-DT-tvSMV.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/agents/harness/tool-result-middleware.ts
/**
* Runs native harness tool-result middleware around tool execution results.
*/
const log = require_subsystem.createSubsystemLogger("agents/harness");
const MAX_MIDDLEWARE_CONTENT_BLOCKS = 200;
const MAX_MIDDLEWARE_TEXT_CHARS = 1e5;
const MAX_MIDDLEWARE_IMAGE_DATA_CHARS = 5e6;
const MAX_MIDDLEWARE_CONTENT_DEPTH = 20;
const MAX_MIDDLEWARE_DETAILS_BYTES = 1e5;
const MAX_MIDDLEWARE_DETAILS_DEPTH = 20;
const MAX_MIDDLEWARE_DETAILS_KEYS = 1e3;
const NESTED_TOOL_RESULT_BLOCK_TYPES = /* @__PURE__ */ new Set(["toolresult", "tool_result"]);
function isValidMiddlewareContentBlock(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || typeof value.type !== "string") return false;
	if (value.type === "text") return typeof value.text === "string" && value.text.length <= MAX_MIDDLEWARE_TEXT_CHARS;
	if (value.type === "image") return typeof value.mimeType === "string" && value.mimeType.trim().length > 0 && typeof value.data === "string" && value.data.length <= MAX_MIDDLEWARE_IMAGE_DATA_CHARS;
	return false;
}
function hasValidMiddlewareDetailsShape(value, state = {
	keys: 0,
	seen: /* @__PURE__ */ new WeakSet()
}, depth = 0) {
	if (value === void 0 || value === null) return true;
	if (depth > MAX_MIDDLEWARE_DETAILS_DEPTH) return false;
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
	if (typeof value !== "object") return false;
	if (state.seen.has(value)) return false;
	state.seen.add(value);
	if (Array.isArray(value)) {
		state.keys += value.length;
		if (state.keys > MAX_MIDDLEWARE_DETAILS_KEYS) return false;
		for (const entry of value) if (!hasValidMiddlewareDetailsShape(entry, state, depth + 1)) return false;
		return true;
	}
	for (const entry of Object.values(value)) {
		state.keys += 1;
		if (state.keys > MAX_MIDDLEWARE_DETAILS_KEYS) return false;
		if (!hasValidMiddlewareDetailsShape(entry, state, depth + 1)) return false;
	}
	return true;
}
function isValidMiddlewareDetails(value) {
	if (value === void 0) return true;
	if (!hasValidMiddlewareDetailsShape(value)) return false;
	const size = require_json_utf8_bytes.boundedJsonUtf8Bytes(value, MAX_MIDDLEWARE_DETAILS_BYTES);
	return size.complete && size.bytes <= MAX_MIDDLEWARE_DETAILS_BYTES;
}
function isValidMiddlewareToolResult(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || !Array.isArray(value.content)) return false;
	if (value.content.length > MAX_MIDDLEWARE_CONTENT_BLOCKS) return false;
	return value.content.every(isValidMiddlewareContentBlock) && isValidMiddlewareDetails(value.details);
}
function createMiddlewareContentCoerceState() {
	return {
		depth: 0,
		seen: /* @__PURE__ */ new Set()
	};
}
function descendMiddlewareContentCoerceState(value, state) {
	if (state.depth >= MAX_MIDDLEWARE_CONTENT_DEPTH) return;
	if (value !== null && typeof value === "object") {
		if (state.seen.has(value)) return;
		const seen = new Set(state.seen);
		seen.add(value);
		return {
			depth: state.depth + 1,
			seen
		};
	}
	return {
		depth: state.depth + 1,
		seen: state.seen
	};
}
function stringifyMiddlewareTextPayload(value) {
	const seen = /* @__PURE__ */ new WeakSet();
	try {
		return JSON.stringify(value, (_key, val) => {
			if (typeof val === "bigint") return val.toString();
			if (typeof val === "function" || typeof val === "symbol" || val === void 0) return;
			if (val !== null && typeof val === "object") {
				if (seen.has(val)) return;
				seen.add(val);
			}
			return val;
		});
	} catch {
		return;
	}
}
function coerceMiddlewareText(value, state = createMiddlewareContentCoerceState(), options = {}) {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const nextState = descendMiddlewareContentCoerceState(value, state);
	if (!nextState) return;
	for (const key of [
		"text",
		"output",
		"result",
		"message"
	]) {
		const text = coerceMiddlewareText(value[key], nextState, options);
		if (text !== void 0) return text;
	}
	const content = value.content;
	if (Array.isArray(content)) {
		const chunks = coerceMiddlewareContentArray(content, nextState, options).filter((block) => block.type === "text").map((block) => block.text).filter((text) => text.length > 0);
		return chunks.length > 0 ? chunks.join("\n") : void 0;
	}
	return stringifyMiddlewareTextPayload(value);
}
function appendMiddlewareContentBlock(blocks, block) {
	if (blocks.length >= MAX_MIDDLEWARE_CONTENT_BLOCKS) return;
	if (block.type !== "text") {
		blocks.push(block);
		return;
	}
	if (!block.text) return;
	const previous = blocks.at(-1);
	if (previous?.type !== "text") {
		blocks.push({
			type: "text",
			text: (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(block.text, MAX_MIDDLEWARE_TEXT_CHARS)
		});
		return;
	}
	const remainingChars = MAX_MIDDLEWARE_TEXT_CHARS - previous.text.length - 1;
	if (remainingChars <= 0) return;
	previous.text = `${previous.text}\n${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(block.text, remainingChars)}`;
}
function coerceMiddlewareContentArray(content, state, options = {}) {
	const blocks = [];
	let inspectedBlocks = 0;
	for (const entry of content) {
		inspectedBlocks += 1;
		if (inspectedBlocks > MAX_MIDDLEWARE_CONTENT_BLOCKS || blocks.length >= MAX_MIDDLEWARE_CONTENT_BLOCKS) break;
		const coercedBlocks = coerceMiddlewareContentBlocks(entry, state, options);
		if (coercedBlocks.length > 0) {
			for (const block of coercedBlocks) {
				appendMiddlewareContentBlock(blocks, block);
				if (blocks.length >= MAX_MIDDLEWARE_CONTENT_BLOCKS) break;
			}
			continue;
		}
		const text = coerceMiddlewareText(entry, state, options);
		if (text) appendMiddlewareContentBlock(blocks, {
			type: "text",
			text: (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, MAX_MIDDLEWARE_TEXT_CHARS)
		});
	}
	return blocks;
}
function coerceMiddlewareContentBlocks(value, state = createMiddlewareContentCoerceState(), options = {}) {
	if (isValidMiddlewareContentBlock(value)) return [value];
	if (options.sanitizeContent === true && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && value.type === "text" && typeof value.text === "string") return [{
		type: "text",
		text: (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value.text, MAX_MIDDLEWARE_TEXT_CHARS)
	}];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || typeof value.type !== "string") return [];
	const normalizedType = value.type.toLowerCase();
	if (!NESTED_TOOL_RESULT_BLOCK_TYPES.has(normalizedType)) return [];
	const content = value.content;
	if (Array.isArray(content) && content.length > 0) {
		const nextState = descendMiddlewareContentCoerceState(value, state);
		return nextState ? coerceMiddlewareContentArray(content, nextState, options) : [];
	}
	const text = coerceMiddlewareText(content, state, options) ?? coerceMiddlewareText(value, state, options);
	if (!text) return [];
	return [{
		type: "text",
		text: (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(text, MAX_MIDDLEWARE_TEXT_CHARS)
	}];
}
function coerceMiddlewareToolResult(value, options = {}) {
	if (isValidMiddlewareToolResult(value)) return value;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || !Array.isArray(value.content)) return;
	const content = [];
	const state = createMiddlewareContentCoerceState();
	let inspectedBlocks = 0;
	for (const block of value.content) {
		inspectedBlocks += 1;
		if (inspectedBlocks > MAX_MIDDLEWARE_CONTENT_BLOCKS) break;
		for (const coerced of coerceMiddlewareContentBlocks(block, state, options)) {
			content.push(coerced);
			if (content.length >= MAX_MIDDLEWARE_CONTENT_BLOCKS) break;
		}
		if (content.length >= MAX_MIDDLEWARE_CONTENT_BLOCKS) break;
	}
	if (content.length === 0) return;
	const details = isValidMiddlewareDetails(value.details) ? value.details : options.sanitizeDetails === true ? sanitizeMiddlewareDetailsValue(value.details) : void 0;
	if (details === void 0 && !isValidMiddlewareDetails(value.details)) return;
	const result = {
		...value,
		content,
		details
	};
	return isValidMiddlewareToolResult(result) ? result : void 0;
}
/**
* Coerce an arbitrary value into a JSON-safe shape that satisfies
* `isValidMiddlewareDetails`. Round-trips through `JSON.stringify` with a
* WeakSet replacer that drops functions, symbols, and `undefined`; coerces
* bigints to their decimal string form; breaks cycles at the offending
* reference; and collapses payloads larger than the validator byte cap to a
* `{ truncated, originalSizeBytes }` marker. Returns `null` for inputs that
* cannot be represented at all (top-level function/symbol/undefined).
*/
function sanitizeMiddlewareDetailsValue(value) {
	const seen = /* @__PURE__ */ new WeakSet();
	try {
		const serialized = JSON.stringify(value, (_key, val) => {
			if (typeof val === "bigint") return val.toString();
			if (val !== null && typeof val === "object") {
				if (seen.has(val)) return;
				seen.add(val);
			}
			return val;
		});
		if (serialized === void 0) return null;
		const serializedBytes = Buffer.byteLength(serialized, "utf8");
		if (serializedBytes > MAX_MIDDLEWARE_DETAILS_BYTES) return {
			truncated: true,
			originalSizeBytes: serializedBytes
		};
		return JSON.parse(serialized);
	} catch {
		return null;
	}
}
/**
* Coerce an incoming tool result into a shape the validator will accept,
* before any middleware runs. Tool emitters legitimately produce raw
* dependency payloads on `details` (channel SDK objects with methods, exec
* traces with cycles back to the runner, large attachment metadata). The
* harness owes a registered middleware a JSON-safe view of that payload;
* subsequent middleware-side mutations are still validated strictly.
*/
function sanitizeToolResultForMiddleware(result) {
	const coerced = coerceMiddlewareToolResult(result, {
		sanitizeContent: true,
		sanitizeDetails: true
	});
	if (coerced) return coerced;
	if (result.details === void 0 || result.details === null) return result;
	if (isValidMiddlewareDetails(result.details)) return result;
	return {
		...result,
		details: sanitizeMiddlewareDetailsValue(result.details)
	};
}
function buildMiddlewareFailureResult() {
	return {
		content: [{
			type: "text",
			text: "Tool output unavailable due to post-processing error."
		}],
		details: {
			status: "error",
			middlewareError: true
		}
	};
}
function buildDeliveredMessagingFailureFallback(event, result) {
	if (event.isError === true || require_tool_result_error.isToolResultError(result) || !require_embedded_agent_messaging.isMessagingToolSendAction(event.toolName, event.args) || !require_embedded_agent_message_tool_source_reply.isDeliveredMessagingToolResult({
		toolName: event.toolName,
		args: event.args,
		result
	}) || !require_embedded_agent_message_tool_source_reply.hasMessagingDeliveryReceipt(result)) return;
	return {
		content: [{
			type: "text",
			text: "Message delivered, but result post-processing failed."
		}],
		details: {
			ok: true,
			deliveryStatus: "sent",
			middlewareWarning: "post-processing failed"
		}
	};
}
function reconcileDeliveredMessagingFailure(result, fallback) {
	return fallback && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(result.details) && result.details.middlewareError === true ? fallback : result;
}
function createAgentToolResultMiddlewareRunner(ctx, handlers) {
	const middlewareContext = {
		...ctx,
		harness: ctx.harness ?? ctx.runtime
	};
	let resolvedHandlers = handlers;
	const resolvedHandlersLoader = require_lazy_promise.createLazyPromiseLoader(async () => {
		const { loadAgentToolResultMiddlewaresForRuntime } = await Promise.resolve().then(() => require("./agent-tool-result-middleware-loader-DTPmEnw3.cjs"));
		return loadAgentToolResultMiddlewaresForRuntime({ runtime: ctx.runtime });
	});
	const resolveHandlers = async () => {
		if (resolvedHandlers) return resolvedHandlers;
		resolvedHandlers = await resolvedHandlersLoader.load();
		return resolvedHandlers;
	};
	return { async applyToolResultMiddleware(event) {
		const handlersForRun = await resolveHandlers();
		if (handlersForRun.length === 0) return event.result;
		const deliveredMessagingFallback = buildDeliveredMessagingFailureFallback(event, event.result);
		let current = sanitizeToolResultForMiddleware(event.result);
		for (const handler of handlersForRun) try {
			const coercedCandidate = coerceMiddlewareToolResult((await handler({
				...event,
				result: current
			}, middlewareContext))?.result ?? current);
			if (coercedCandidate) current = coercedCandidate;
			else {
				log.warn(`[${ctx.runtime}] discarded invalid tool result middleware output for ${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(event.toolName, 120)}`);
				return reconcileDeliveredMessagingFailure(buildMiddlewareFailureResult(), deliveredMessagingFallback);
			}
		} catch {
			log.warn(`[${ctx.runtime}] tool result middleware failed for ${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(event.toolName, 120)}`);
			return reconcileDeliveredMessagingFailure(buildMiddlewareFailureResult(), deliveredMessagingFallback);
		}
		return reconcileDeliveredMessagingFailure(current, deliveredMessagingFallback);
	} };
}
//#endregion
Object.defineProperty(exports, "createAgentToolResultMiddlewareRunner", {
	enumerable: true,
	get: function() {
		return createAgentToolResultMiddlewareRunner;
	}
});
