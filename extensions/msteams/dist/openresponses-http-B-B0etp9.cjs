require("./rolldown-runtime-u92d-OFm.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_agent_events = require("./agent-events-r-aTyyWf.cjs");
const require_selection = require("./selection-BpqUSi0C.cjs");
const require_input_files = require("./input-files-CRcwDUo1.cjs");
const require_external_content = require("./external-content-CaAq9ND8.cjs");
const require_http_common = require("./http-common-DeY7J8eb.cjs");
const require_http_auth_utils = require("./http-auth-utils-D-0od5yP.cjs");
const require_http_utils = require("./http-utils-C_86u7P2.cjs");
const require_file_context = require("./file-context-CmMuyUoh.cjs");
const require_deps = require("./deps-D7dP6ttG.cjs");
const require_agent_command = require("./agent-command-B5kZ42yg.cjs");
require("./agent-0qZjihEI.cjs");
const require_http_endpoint_helpers = require("./http-endpoint-helpers-CGx6Zu7q.cjs");
const require_openai_tool_choice = require("./openai-tool-choice-PrCJ-Xhp.cjs");
let zod = require("zod");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let node_crypto = require("node:crypto");
//#region src/gateway/open-responses.schema.ts
/**
* OpenResponses API Zod Schemas
*
* Zod schemas for the OpenResponses `/v1/responses` endpoint.
* This module is isolated from gateway imports to enable future codegen and prevent drift.
*
* @see https://www.open-responses.com/
*/
const InputTextContentPartSchema = zod.z.object({
	type: zod.z.literal("input_text"),
	text: zod.z.string()
}).strict();
const OutputTextContentPartSchema = zod.z.object({
	type: zod.z.literal("output_text"),
	text: zod.z.string()
}).strict();
const InputImageSourceSchema = zod.z.discriminatedUnion("type", [zod.z.object({
	type: zod.z.literal("url"),
	url: zod.z.string().url()
}), zod.z.object({
	type: zod.z.literal("base64"),
	media_type: zod.z.enum([
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/heic",
		"image/heif"
	]),
	data: zod.z.string().min(1)
})]);
const InputImageContentPartSchema = zod.z.object({
	type: zod.z.literal("input_image"),
	source: InputImageSourceSchema
}).strict();
const InputFileSourceSchema = zod.z.discriminatedUnion("type", [zod.z.object({
	type: zod.z.literal("url"),
	url: zod.z.string().url()
}), zod.z.object({
	type: zod.z.literal("base64"),
	media_type: zod.z.string().min(1),
	data: zod.z.string().min(1),
	filename: zod.z.string().optional()
})]);
const InputFileContentPartSchema = zod.z.object({
	type: zod.z.literal("input_file"),
	source: InputFileSourceSchema
}).strict();
const ContentPartSchema = zod.z.discriminatedUnion("type", [
	InputTextContentPartSchema,
	OutputTextContentPartSchema,
	InputImageContentPartSchema,
	InputFileContentPartSchema
]);
const MessageItemRoleSchema = zod.z.enum([
	"system",
	"developer",
	"user",
	"assistant"
]);
const AssistantPhaseSchema = zod.z.enum(["commentary", "final_answer"]);
const MessageItemSchema = zod.z.object({
	type: zod.z.literal("message"),
	role: MessageItemRoleSchema,
	content: zod.z.union([zod.z.string(), zod.z.array(ContentPartSchema)]),
	phase: AssistantPhaseSchema.optional()
}).strict().superRefine((value, ctx) => {
	if (value.phase !== void 0 && value.role !== "assistant") ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["phase"],
		message: "`phase` is only valid on assistant messages."
	});
});
const FunctionCallItemSchema = zod.z.object({
	type: zod.z.literal("function_call"),
	id: zod.z.string().optional(),
	call_id: zod.z.string().optional(),
	name: zod.z.string(),
	arguments: zod.z.string()
}).strict();
const FunctionCallOutputItemSchema = zod.z.object({
	type: zod.z.literal("function_call_output"),
	call_id: zod.z.string(),
	output: zod.z.string()
}).strict();
const ReasoningItemSchema = zod.z.object({
	type: zod.z.literal("reasoning"),
	content: zod.z.string().optional(),
	encrypted_content: zod.z.string().optional(),
	summary: zod.z.string().optional()
}).strict();
const ItemReferenceItemSchema = zod.z.object({
	type: zod.z.literal("item_reference"),
	id: zod.z.string()
}).strict();
const ItemParamSchema = zod.z.discriminatedUnion("type", [
	MessageItemSchema,
	FunctionCallItemSchema,
	FunctionCallOutputItemSchema,
	ReasoningItemSchema,
	ItemReferenceItemSchema
]);
const ToolDefinitionSchema = zod.z.object({
	type: zod.z.literal("function"),
	name: zod.z.string().min(1, "Tool name cannot be empty"),
	description: zod.z.string().optional(),
	parameters: zod.z.record(zod.z.string(), zod.z.unknown()).optional(),
	strict: zod.z.boolean().optional()
}).strict();
const ToolChoiceSchema = zod.z.union([
	zod.z.literal("auto"),
	zod.z.literal("none"),
	zod.z.literal("required"),
	zod.z.object({
		type: zod.z.literal("function"),
		name: zod.z.string().min(1)
	}).strict(),
	zod.z.object({
		type: zod.z.literal("function"),
		function: zod.z.object({ name: zod.z.string().min(1) })
	}).strict()
]);
const CreateResponseBodySchema = zod.z.object({
	model: zod.z.string(),
	input: zod.z.union([zod.z.string(), zod.z.array(ItemParamSchema)]),
	instructions: zod.z.string().optional(),
	tools: zod.z.array(ToolDefinitionSchema).optional(),
	tool_choice: ToolChoiceSchema.optional(),
	stream: zod.z.boolean().optional(),
	max_output_tokens: zod.z.number().int().positive().optional(),
	max_tool_calls: zod.z.number().int().positive().optional(),
	user: zod.z.string().optional(),
	temperature: zod.z.number().min(0).max(2).optional(),
	top_p: zod.z.number().min(0).max(1).optional(),
	metadata: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	store: zod.z.boolean().optional(),
	previous_response_id: zod.z.string().optional(),
	reasoning: zod.z.object({
		effort: zod.z.enum([
			"low",
			"medium",
			"high"
		]).optional(),
		summary: zod.z.enum([
			"auto",
			"concise",
			"detailed"
		]).optional()
	}).optional(),
	truncation: zod.z.enum(["auto", "disabled"]).optional()
}).strict();
const ResponseStatusSchema = zod.z.enum([
	"in_progress",
	"completed",
	"failed",
	"cancelled",
	"incomplete"
]);
const OutputItemSchema = zod.z.discriminatedUnion("type", [
	zod.z.object({
		type: zod.z.literal("message"),
		id: zod.z.string(),
		role: zod.z.literal("assistant"),
		content: zod.z.array(OutputTextContentPartSchema),
		phase: AssistantPhaseSchema.optional(),
		status: zod.z.enum(["in_progress", "completed"]).optional()
	}).strict(),
	zod.z.object({
		type: zod.z.literal("function_call"),
		id: zod.z.string(),
		call_id: zod.z.string(),
		name: zod.z.string(),
		arguments: zod.z.string(),
		status: zod.z.enum(["in_progress", "completed"]).optional()
	}).strict(),
	zod.z.object({
		type: zod.z.literal("reasoning"),
		id: zod.z.string(),
		content: zod.z.string().optional(),
		summary: zod.z.string().optional()
	}).strict()
]);
const UsageSchema = zod.z.object({
	input_tokens: zod.z.number().int().nonnegative(),
	output_tokens: zod.z.number().int().nonnegative(),
	total_tokens: zod.z.number().int().nonnegative()
});
const ResponseResourceSchema = zod.z.object({
	id: zod.z.string(),
	object: zod.z.literal("response"),
	created_at: zod.z.number().int(),
	status: ResponseStatusSchema,
	model: zod.z.string(),
	output: zod.z.array(OutputItemSchema),
	usage: UsageSchema,
	error: zod.z.object({
		code: zod.z.string(),
		message: zod.z.string()
	}).optional()
});
zod.z.object({
	type: zod.z.literal("response.created"),
	response: ResponseResourceSchema
});
zod.z.object({
	type: zod.z.literal("response.in_progress"),
	response: ResponseResourceSchema
});
zod.z.object({
	type: zod.z.literal("response.completed"),
	response: ResponseResourceSchema
});
zod.z.object({
	type: zod.z.literal("response.failed"),
	response: ResponseResourceSchema
});
zod.z.object({
	type: zod.z.literal("response.output_item.added"),
	output_index: zod.z.number().int().nonnegative(),
	item: OutputItemSchema
});
zod.z.object({
	type: zod.z.literal("response.output_item.done"),
	output_index: zod.z.number().int().nonnegative(),
	item: OutputItemSchema
});
zod.z.object({
	type: zod.z.literal("response.content_part.added"),
	item_id: zod.z.string(),
	output_index: zod.z.number().int().nonnegative(),
	content_index: zod.z.number().int().nonnegative(),
	part: OutputTextContentPartSchema
});
zod.z.object({
	type: zod.z.literal("response.content_part.done"),
	item_id: zod.z.string(),
	output_index: zod.z.number().int().nonnegative(),
	content_index: zod.z.number().int().nonnegative(),
	part: OutputTextContentPartSchema
});
zod.z.object({
	type: zod.z.literal("response.output_text.delta"),
	item_id: zod.z.string(),
	output_index: zod.z.number().int().nonnegative(),
	content_index: zod.z.number().int().nonnegative(),
	delta: zod.z.string()
});
zod.z.object({
	type: zod.z.literal("response.output_text.done"),
	item_id: zod.z.string(),
	output_index: zod.z.number().int().nonnegative(),
	content_index: zod.z.number().int().nonnegative(),
	text: zod.z.string()
});
//#endregion
//#region src/gateway/openresponses-file-content.ts
/** Wraps untrusted file content for OpenResponses input blocks. */
function wrapUntrustedFileContent(content) {
	return require_external_content.wrapExternalContent(content, {
		source: "unknown",
		includeWarning: false
	});
}
//#endregion
//#region src/gateway/openresponses-prompt.ts
const FILE_ONLY_USER_MESSAGE = "User sent file(s) with no text.";
function extractTextContent(content) {
	if (typeof content === "string") return content;
	return content.map((part) => {
		if (part.type === "input_text") return part.text;
		if (part.type === "output_text") return part.text;
		return "";
	}).filter(Boolean).join("\n");
}
function hasImageContent(content) {
	return typeof content !== "string" && content.some((part) => part.type === "input_image");
}
function hasFileContent(content) {
	return typeof content !== "string" && content.some((part) => part.type === "input_file");
}
function placeholderForActiveTurn(content) {
	if (hasImageContent(content)) return require_openai_tool_choice.IMAGE_ONLY_USER_MESSAGE;
	if (hasFileContent(content)) return FILE_ONLY_USER_MESSAGE;
	return "";
}
/** Index of the last user message item, or -1 when there is none. */
function findActiveUserMessageIndex(input) {
	for (let i = input.length - 1; i >= 0; i -= 1) {
		const item = input[i];
		if (item?.type === "message" && item.role === "user") return i;
	}
	return -1;
}
/** Build the user message and optional system prompt from Responses API input. */
function buildAgentPrompt(input) {
	if (typeof input === "string") return { message: input };
	const systemParts = [];
	const conversationEntries = [];
	const activeUserMessageIndex = findActiveUserMessageIndex(input);
	for (const [i, item] of input.entries()) if (item.type === "message") {
		const body = extractTextContent(item.content).trim() || (item.role === "user" && i === activeUserMessageIndex ? placeholderForActiveTurn(item.content) : "");
		if (!body) continue;
		if (item.role === "system" || item.role === "developer") {
			systemParts.push(body);
			continue;
		}
		const normalizedRole = item.role === "assistant" ? "assistant" : "user";
		const sender = normalizedRole === "assistant" ? "Assistant" : "User";
		conversationEntries.push({
			role: normalizedRole,
			entry: {
				sender,
				body
			}
		});
	} else if (item.type === "function_call_output") conversationEntries.push({
		role: "tool",
		entry: {
			sender: `Tool:${item.call_id}`,
			body: item.output
		}
	});
	return {
		message: require_openai_tool_choice.buildAgentMessageFromConversationEntries(conversationEntries),
		extraSystemPrompt: systemParts.length > 0 ? systemParts.join("\n\n") : void 0
	};
}
//#endregion
//#region src/gateway/openresponses-shape.ts
/** Creates an assistant output message item for OpenResponses-compatible responses. */
function createAssistantOutputItem(params) {
	return {
		type: "message",
		id: params.id,
		role: "assistant",
		content: [{
			type: "output_text",
			text: params.text
		}],
		...params.phase ? { phase: params.phase } : {},
		status: params.status
	};
}
/** Creates a function-call output item for OpenResponses-compatible responses. */
function createFunctionCallOutputItem(params) {
	return {
		type: "function_call",
		id: params.id,
		call_id: params.callId,
		name: params.name,
		arguments: params.arguments,
		status: params.status
	};
}
//#endregion
//#region src/gateway/openresponses-http.ts
/**
* OpenResponses HTTP Handler
*
* Implements the OpenResponses `/v1/responses` endpoint for Operator Gateway.
*
* @see https://www.open-responses.com/
*/
const DEFAULT_BODY_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_URL_PARTS = 8;
const RESPONSE_SESSION_TTL_MS = 1800 * 1e3;
const MAX_RESPONSE_SESSION_ENTRIES = 500;
const responseSessionMap = /* @__PURE__ */ new Map();
function normalizeResponseSessionScope(scope) {
	const authSubject = scope.authSubject.trim();
	const requestedSessionKey = scope.requestedSessionKey?.trim();
	return {
		authSubject,
		agentId: scope.agentId,
		requestedSessionKey: requestedSessionKey || void 0
	};
}
function resolveResponseSessionAuthSubject(params) {
	const bearer = require_http_auth_utils.getBearerToken(params.req);
	if (bearer) return `bearer:${(0, node_crypto.createHash)("sha256").update(bearer).digest("hex")}`;
	if (params.auth.mode === "trusted-proxy" && params.auth.trustedProxy?.userHeader) {
		const user = require_http_auth_utils.getHeader(params.req, params.auth.trustedProxy.userHeader)?.trim();
		if (user) return `trusted-proxy:${user}`;
	}
	return `gateway-auth:${params.auth.mode}`;
}
function createResponseSessionScope(params) {
	return normalizeResponseSessionScope({
		authSubject: resolveResponseSessionAuthSubject({
			req: params.req,
			auth: params.auth
		}),
		agentId: params.agentId,
		requestedSessionKey: require_http_auth_utils.getHeader(params.req, "x-operator-session-key")
	});
}
function matchesResponseSessionScope(entry, scope) {
	return entry.authSubject === scope.authSubject && entry.agentId === scope.agentId && entry.requestedSessionKey === scope.requestedSessionKey;
}
function pruneExpiredResponseSessions(now) {
	while (responseSessionMap.size > 0) {
		const oldest = responseSessionMap.entries().next().value;
		if (!oldest) return;
		const [oldestKey, oldestValue] = oldest;
		if (now - oldestValue.ts <= RESPONSE_SESSION_TTL_MS) return;
		responseSessionMap.delete(oldestKey);
	}
}
function evictOverflowResponseSessions() {
	while (responseSessionMap.size > MAX_RESPONSE_SESSION_ENTRIES) {
		const oldestKey = responseSessionMap.keys().next().value;
		if (!oldestKey) return;
		responseSessionMap.delete(oldestKey);
	}
}
function storeResponseSession(responseId, sessionKey, scope, now = Date.now()) {
	responseSessionMap.delete(responseId);
	responseSessionMap.set(responseId, {
		...scope,
		sessionKey,
		ts: now
	});
	pruneExpiredResponseSessions(now);
	evictOverflowResponseSessions();
}
function lookupResponseSession(responseId, scope, now = Date.now()) {
	if (!responseId) return;
	const entry = responseSessionMap.get(responseId);
	if (!entry) return;
	if (now - entry.ts > RESPONSE_SESSION_TTL_MS) {
		responseSessionMap.delete(responseId);
		return;
	}
	if (!matchesResponseSessionScope(entry, scope)) return;
	return entry.sessionKey;
}
const testing = {
	resetResponseSessionState() {
		responseSessionMap.clear();
	},
	wrapUntrustedFileContent,
	storeResponseSessionAt(responseId, sessionKey, now, scope = {
		authSubject: "test",
		agentId: "main"
	}) {
		storeResponseSession(responseId, sessionKey, normalizeResponseSessionScope(scope), now);
	},
	lookupResponseSessionAt(responseId, now, scope = {
		authSubject: "test",
		agentId: "main"
	}) {
		return lookupResponseSession(responseId, normalizeResponseSessionScope(scope), now);
	},
	getResponseSessionIds() {
		return [...responseSessionMap.keys()];
	},
	resolveResponsesLimits
};
function writeSseEvent(res, event) {
	res.write(`event: ${event.type}\n`);
	res.write(`data: ${JSON.stringify(event)}\n\n`);
}
function resolveResponsesLimits(config) {
	const files = config?.files;
	const images = config?.images;
	const fileLimits = require_input_files.resolveInputFileLimits(files);
	return {
		maxBodyBytes: config?.maxBodyBytes ?? DEFAULT_BODY_BYTES,
		maxUrlParts: (0, _gabrielvfonseca_normalization_core_number_coercion.resolveIntegerOption)(config?.maxUrlParts, DEFAULT_MAX_URL_PARTS, { min: 0 }),
		files: {
			...fileLimits,
			urlAllowlist: require_openai_tool_choice.normalizeInputHostnameAllowlist(files?.urlAllowlist)
		},
		images: {
			allowUrl: images?.allowUrl ?? true,
			urlAllowlist: require_openai_tool_choice.normalizeInputHostnameAllowlist(images?.urlAllowlist),
			allowedMimes: require_input_files.normalizeMimeList(images?.allowedMimes, require_input_files.DEFAULT_INPUT_IMAGE_MIMES),
			maxBytes: images?.maxBytes ?? 10485760,
			maxRedirects: images?.maxRedirects ?? 3,
			timeoutMs: images?.timeoutMs ?? 1e4
		}
	};
}
function extractClientTools(body) {
	return (body.tools ?? []).map((tool) => ({
		type: "function",
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.parameters,
			strict: tool.strict
		}
	}));
}
function applyToolChoice(params) {
	const { tools, toolChoice } = params;
	if (!toolChoice) return { tools };
	if (toolChoice === "none") return { tools: [] };
	if (toolChoice === "required") {
		if (tools.length === 0) throw new Error("tool_choice=required but no tools were provided");
		const constraint = { type: "required" };
		return {
			tools,
			extraSystemPrompt: require_openai_tool_choice.toolChoiceConstraintPrompt(constraint),
			constraint
		};
	}
	if (typeof toolChoice === "object" && toolChoice.type === "function") {
		const targetName = ("name" in toolChoice ? toolChoice.name : toolChoice.function.name).trim();
		if (!targetName) throw new Error("tool_choice.name is required");
		const matched = tools.filter((tool) => tool.function?.name === targetName);
		if (matched.length === 0) throw new Error(`tool_choice requested unknown tool: ${targetName}`);
		const constraint = {
			type: "function",
			name: targetName
		};
		return {
			tools: matched,
			extraSystemPrompt: require_openai_tool_choice.toolChoiceConstraintPrompt(constraint),
			constraint
		};
	}
	return { tools };
}
function createEmptyUsage() {
	return {
		input_tokens: 0,
		output_tokens: 0,
		total_tokens: 0
	};
}
function toUsage(value) {
	if (!value) return createEmptyUsage();
	const input = value.input ?? 0;
	const output = value.output ?? 0;
	const cacheRead = value.cacheRead ?? 0;
	const cacheWrite = value.cacheWrite ?? 0;
	const total = value.total ?? input + output + cacheRead + cacheWrite;
	return {
		input_tokens: Math.max(0, input),
		output_tokens: Math.max(0, output),
		total_tokens: Math.max(0, total)
	};
}
function extractUsageFromResult(result) {
	const meta = result?.meta;
	return toUsage(meta && typeof meta === "object" ? meta.agentMeta?.usage : void 0);
}
function resolveStopReasonAndPendingToolCalls(meta) {
	if (!meta || typeof meta !== "object") return {
		stopReason: void 0,
		pendingToolCalls: void 0
	};
	const record = meta;
	return {
		stopReason: record.stopReason,
		pendingToolCalls: record.pendingToolCalls
	};
}
function createResponseResource(params) {
	return {
		id: params.id,
		object: "response",
		created_at: Math.floor(Date.now() / 1e3),
		status: params.status,
		model: params.model,
		output: params.output,
		usage: params.usage ?? createEmptyUsage(),
		error: params.error
	};
}
async function runResponsesAgentCommand(params) {
	return require_agent_command.agentCommandFromIngress({
		message: params.message,
		images: params.images.length > 0 ? params.images : void 0,
		clientTools: params.clientTools.length > 0 ? params.clientTools : void 0,
		extraSystemPrompt: params.extraSystemPrompt || void 0,
		model: params.modelOverride,
		streamParams: params.streamParams ?? void 0,
		sessionKey: params.sessionKey,
		runId: params.runId,
		deliver: false,
		messageChannel: params.messageChannel,
		bestEffortDeliver: false,
		allowModelOverride: params.modelOverride !== void 0,
		abortSignal: params.abortSignal
	}, require_runtime.defaultRuntime, params.deps);
}
async function handleOpenResponsesHttpRequest(req, res, opts) {
	const limits = resolveResponsesLimits(opts.config);
	const maxBodyBytes = opts.maxBodyBytes ?? (opts.config?.maxBodyBytes ? limits.maxBodyBytes : Math.max(limits.maxBodyBytes, limits.files.maxBytes * 2, limits.images.maxBytes * 2));
	const handled = await require_http_endpoint_helpers.handleGatewayPostJsonEndpoint(req, res, {
		pathname: "/v1/responses",
		requiredOperatorMethod: "chat.send",
		resolveOperatorScopes: require_http_auth_utils.resolveOpenAiCompatibleHttpOperatorScopes,
		auth: opts.auth,
		trustedProxies: opts.trustedProxies,
		allowRealIpFallback: opts.allowRealIpFallback,
		rateLimiter: opts.rateLimiter,
		maxBodyBytes
	});
	if (handled === false) return false;
	if (!handled) return true;
	const modelOverrideAuth = require_http_auth_utils.authorizeOpenAiCompatibleHttpModelOverride(req, handled.requestAuth);
	if (!modelOverrideAuth.allowed) {
		require_http_common.sendMissingScopeForbidden(res, modelOverrideAuth.missingScope);
		return true;
	}
	const parseResult = CreateResponseBodySchema.safeParse(handled.body);
	if (!parseResult.success) {
		const issue = parseResult.error.issues[0];
		require_http_common.sendJson(res, 400, { error: {
			message: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid request body",
			type: "invalid_request_error"
		} });
		return true;
	}
	const payload = parseResult.data;
	const stream = Boolean(payload.stream);
	const model = payload.model;
	const user = payload.user;
	let agentId;
	try {
		agentId = require_http_utils.resolveAgentIdForRequest({
			req,
			model
		});
	} catch (err) {
		if (require_http_utils.isUnknownGatewayAgentError(err)) {
			require_http_common.sendJson(res, 400, { error: {
				message: err.message,
				type: "invalid_request_error"
			} });
			return true;
		}
		throw err;
	}
	const { modelOverride, errorMessage: modelError } = await require_http_utils.resolveOpenAiCompatModelOverride({
		req,
		agentId,
		model
	});
	if (modelError) {
		require_http_common.sendJson(res, 400, { error: {
			message: modelError,
			type: "invalid_request_error"
		} });
		return true;
	}
	let images = [];
	const fileContexts = [];
	let urlParts = 0;
	const markUrlPart = () => {
		urlParts += 1;
		if (urlParts > limits.maxUrlParts) throw new Error(`Too many URL-based input sources: ${urlParts} (limit: ${limits.maxUrlParts})`);
	};
	try {
		if (Array.isArray(payload.input)) {
			for (const item of payload.input) if (item.type === "message" && typeof item.content !== "string") for (const part of item.content) {
				if (part.type === "input_image") {
					const source = part.source;
					const sourceType = source.type === "base64" || source.type === "url" ? source.type : void 0;
					if (!sourceType) throw new Error("input_image must have 'source.url' or 'source.data'");
					if (sourceType === "url") markUrlPart();
					const image = await require_input_files.extractImageContentFromSource(sourceType === "url" ? {
						type: "url",
						url: source.url ?? "",
						mediaType: source.media_type
					} : {
						type: "base64",
						data: source.data ?? "",
						mediaType: source.media_type
					}, limits.images);
					images.push(image);
					continue;
				}
				if (part.type === "input_file") {
					const source = part.source;
					const sourceType = source.type === "base64" || source.type === "url" ? source.type : void 0;
					if (!sourceType) throw new Error("input_file must have 'source.url' or 'source.data'");
					if (sourceType === "url") markUrlPart();
					const file = await require_input_files.extractFileContentFromSource({
						source: sourceType === "url" ? {
							type: "url",
							url: source.url ?? "",
							mediaType: source.media_type,
							filename: source.filename
						} : {
							type: "base64",
							data: source.data ?? "",
							mediaType: source.media_type,
							filename: source.filename
						},
						limits: limits.files
					});
					const rawText = file.text;
					if (rawText?.trim()) fileContexts.push(require_file_context.renderFileContextBlock({
						filename: file.filename,
						content: wrapUntrustedFileContent(rawText)
					}));
					else if (file.images && file.images.length > 0) fileContexts.push(require_file_context.renderFileContextBlock({
						filename: file.filename,
						content: "[PDF content rendered to images]",
						surroundContentWithNewlines: false
					}));
					else fileContexts.push(require_file_context.renderFileContextBlock({
						filename: file.filename,
						content: "[No extractable text]",
						surroundContentWithNewlines: false
					}));
					if (file.images && file.images.length > 0) images = images.concat(file.images);
				}
			}
		}
	} catch (err) {
		require_logger.logWarn(`openresponses: request parsing failed: ${String(err)}`);
		require_http_common.sendJson(res, 400, { error: {
			message: "invalid request",
			type: "invalid_request_error"
		} });
		return true;
	}
	const clientTools = extractClientTools(payload);
	let toolChoicePrompt;
	let toolChoiceConstraint;
	let resolvedClientTools = clientTools;
	try {
		const toolChoiceResult = applyToolChoice({
			tools: clientTools,
			toolChoice: payload.tool_choice
		});
		resolvedClientTools = toolChoiceResult.tools;
		toolChoicePrompt = toolChoiceResult.extraSystemPrompt;
		toolChoiceConstraint = toolChoiceResult.constraint;
	} catch (err) {
		require_logger.logWarn(`openresponses: tool configuration failed: ${String(err)}`);
		require_http_common.sendJson(res, 400, { error: {
			message: "invalid tool configuration",
			type: "invalid_request_error"
		} });
		return true;
	}
	let resolved;
	try {
		resolved = require_http_utils.resolveGatewayRequestContext({
			req,
			model,
			user,
			sessionPrefix: "openresponses",
			defaultMessageChannel: "webchat",
			useMessageChannelHeader: true
		});
	} catch (err) {
		if (require_http_utils.isUnknownGatewayAgentError(err) || require_http_utils.isGatewaySessionKeyOverrideError(err)) {
			require_http_common.sendJson(res, 400, { error: {
				message: err.message,
				type: "invalid_request_error"
			} });
			return true;
		}
		throw err;
	}
	const responseSessionScope = createResponseSessionScope({
		req,
		auth: opts.auth,
		agentId: resolved.agentId
	});
	const sessionKey = lookupResponseSession(payload.previous_response_id, responseSessionScope) ?? resolved.sessionKey;
	const messageChannel = resolved.messageChannel;
	const prompt = buildAgentPrompt(payload.input);
	const fileContext = fileContexts.length > 0 ? fileContexts.join("\n\n") : void 0;
	const toolChoiceContext = toolChoicePrompt?.trim();
	const extraSystemPrompt = [
		payload.instructions,
		prompt.extraSystemPrompt,
		toolChoiceContext,
		fileContext
	].filter(Boolean).join("\n\n");
	if (!prompt.message) {
		require_http_common.sendJson(res, 400, { error: {
			message: "Missing user message in `input`.",
			type: "invalid_request_error"
		} });
		return true;
	}
	const responseId = `resp_${(0, node_crypto.randomUUID)()}`;
	const rememberResponseSession = () => storeResponseSession(responseId, sessionKey, responseSessionScope);
	const outputItemId = `msg_${(0, node_crypto.randomUUID)()}`;
	const deps = require_deps.createDefaultDeps();
	const abortController = new AbortController();
	const streamMaxTokens = typeof payload.max_output_tokens === "number" ? payload.max_output_tokens : void 0;
	const streamTemperature = typeof payload.temperature === "number" ? payload.temperature : void 0;
	const streamTopP = typeof payload.top_p === "number" ? payload.top_p : void 0;
	const streamParams = streamMaxTokens !== void 0 || streamTemperature !== void 0 || streamTopP !== void 0 ? {
		...streamMaxTokens !== void 0 ? { maxTokens: streamMaxTokens } : {},
		...streamTemperature !== void 0 ? { temperature: streamTemperature } : {},
		...streamTopP !== void 0 ? { topP: streamTopP } : {}
	} : void 0;
	if (!stream) {
		const stopWatchingDisconnect = require_http_common.watchClientDisconnect(req, res, abortController);
		try {
			const result = await runResponsesAgentCommand({
				message: prompt.message,
				images,
				clientTools: resolvedClientTools,
				extraSystemPrompt,
				modelOverride,
				streamParams,
				sessionKey,
				runId: responseId,
				messageChannel,
				deps,
				abortSignal: abortController.signal
			});
			if (abortController.signal.aborted) return true;
			const payloads = result?.payloads;
			const usage = extractUsageFromResult(result);
			const meta = result?.meta;
			const { stopReason, pendingToolCalls } = resolveStopReasonAndPendingToolCalls(meta);
			if (toolChoiceConstraint && !require_openai_tool_choice.isToolChoiceConstraintSatisfied({
				constraint: toolChoiceConstraint,
				pendingToolCalls
			})) {
				const failed = createResponseResource({
					id: responseId,
					model,
					status: "failed",
					output: [],
					error: {
						code: "api_error",
						message: require_openai_tool_choice.resolveUnsatisfiedToolChoiceMessage(toolChoiceConstraint)
					},
					usage
				});
				rememberResponseSession();
				require_http_common.sendJson(res, 502, failed);
				return true;
			}
			if (stopReason === "tool_calls" && pendingToolCalls && pendingToolCalls.length > 0) {
				const assistantText = Array.isArray(payloads) && payloads.length > 0 ? payloads.map((p) => typeof p.text === "string" ? p.text : "").filter(Boolean).join("\n\n") : "";
				const output = [];
				if (assistantText) output.push(createAssistantOutputItem({
					id: outputItemId,
					text: assistantText,
					phase: "commentary",
					status: "completed"
				}));
				for (const functionCall of pendingToolCalls) output.push(createFunctionCallOutputItem({
					id: `call_${(0, node_crypto.randomUUID)()}`,
					callId: functionCall.id,
					name: functionCall.name,
					arguments: functionCall.arguments
				}));
				const response = createResponseResource({
					id: responseId,
					model,
					status: "incomplete",
					output,
					usage
				});
				rememberResponseSession();
				require_http_common.sendJson(res, 200, response);
				return true;
			}
			const response = createResponseResource({
				id: responseId,
				model,
				status: "completed",
				output: [createAssistantOutputItem({
					id: outputItemId,
					text: Array.isArray(payloads) && payloads.length > 0 ? payloads.map((p) => typeof p.text === "string" ? p.text : "").filter(Boolean).join("\n\n") : "No response from Operator.",
					phase: "final_answer",
					status: "completed"
				})],
				usage
			});
			rememberResponseSession();
			require_http_common.sendJson(res, 200, response);
		} catch (err) {
			if (abortController.signal.aborted) return true;
			require_logger.logWarn(`openresponses: non-stream response failed: ${String(err)}`);
			if (require_selection.isClientToolNameConflictError(err)) {
				require_http_common.sendJson(res, 400, createResponseResource({
					id: responseId,
					model,
					status: "failed",
					output: [],
					error: {
						code: "invalid_request_error",
						message: "invalid tool configuration"
					}
				}));
				return true;
			}
			const response = createResponseResource({
				id: responseId,
				model,
				status: "failed",
				output: [],
				error: {
					code: "api_error",
					message: "internal error"
				}
			});
			const mapped = require_openai_tool_choice.resolveOpenAiCompatError(err);
			if (mapped) {
				const mappedResponse = createResponseResource({
					id: responseId,
					model,
					status: "failed",
					output: [],
					error: {
						code: mapped.error.type,
						message: mapped.error.message
					}
				});
				rememberResponseSession();
				require_http_common.sendJson(res, mapped.status, mappedResponse);
				return true;
			}
			rememberResponseSession();
			require_http_common.sendJson(res, 500, response);
		} finally {
			stopWatchingDisconnect();
		}
		return true;
	}
	require_http_common.setSseHeaders(res);
	let accumulatedText = "";
	let bufferedReplaceableAssistantContent = "";
	let sawAssistantDelta = false;
	let closed = false;
	let unsubscribe = () => {};
	let stopWatchingDisconnect = () => {};
	let finalUsage;
	let finalizeStatus = null;
	let finalizeRequested = null;
	const maybeFinalize = () => {
		if (closed) return;
		if (!finalizeRequested) return;
		if (!finalUsage) return;
		const usage = finalUsage;
		closed = true;
		stopWatchingDisconnect();
		unsubscribe();
		writeSseEvent(res, {
			type: "response.output_text.done",
			item_id: outputItemId,
			output_index: 0,
			content_index: 0,
			text: finalizeRequested.text
		});
		writeSseEvent(res, {
			type: "response.content_part.done",
			item_id: outputItemId,
			output_index: 0,
			content_index: 0,
			part: {
				type: "output_text",
				text: finalizeRequested.text
			}
		});
		const completedItem = createAssistantOutputItem({
			id: outputItemId,
			text: finalizeRequested.text,
			phase: finalizeRequested.status === "completed" ? "final_answer" : "commentary",
			status: "completed"
		});
		writeSseEvent(res, {
			type: "response.output_item.done",
			output_index: 0,
			item: completedItem
		});
		const finalResponse = createResponseResource({
			id: responseId,
			model,
			status: finalizeRequested.status,
			output: [completedItem],
			usage
		});
		rememberResponseSession();
		writeSseEvent(res, {
			type: "response.completed",
			response: finalResponse
		});
		require_http_common.writeDone(res);
		res.end();
	};
	const requestFinalize = (status, text) => {
		if (finalizeRequested) return;
		finalizeStatus = status;
		finalizeRequested = {
			status,
			text
		};
		maybeFinalize();
	};
	const initialResponse = createResponseResource({
		id: responseId,
		model,
		status: "in_progress",
		output: []
	});
	writeSseEvent(res, {
		type: "response.created",
		response: initialResponse
	});
	writeSseEvent(res, {
		type: "response.in_progress",
		response: initialResponse
	});
	writeSseEvent(res, {
		type: "response.output_item.added",
		output_index: 0,
		item: createAssistantOutputItem({
			id: outputItemId,
			text: "",
			status: "in_progress"
		})
	});
	writeSseEvent(res, {
		type: "response.content_part.added",
		item_id: outputItemId,
		output_index: 0,
		content_index: 0,
		part: {
			type: "output_text",
			text: ""
		}
	});
	unsubscribe = require_agent_events.onAgentEvent((evt) => {
		if (evt.runId !== responseId) return;
		if (closed) return;
		if (evt.stream === "assistant") {
			if (require_openai_tool_choice.isReplaceableAssistantStreamEvent(evt)) {
				const snapshot = require_openai_tool_choice.resolveAssistantStreamSnapshotText(evt);
				if (snapshot) bufferedReplaceableAssistantContent = snapshot;
				return;
			}
			const text = evt.data?.text;
			const replace = evt.data?.replace === true;
			const hadAssistantDelta = sawAssistantDelta;
			if (replace && typeof text === "string") accumulatedText = text;
			const content = require_openai_tool_choice.resolveAssistantStreamDeltaText(evt);
			if (!content) {
				if (replace && typeof text === "string" && text && !toolChoiceConstraint && !hadAssistantDelta) {
					sawAssistantDelta = true;
					writeSseEvent(res, {
						type: "response.output_text.delta",
						item_id: outputItemId,
						output_index: 0,
						content_index: 0,
						delta: text
					});
				}
				return;
			}
			if (toolChoiceConstraint) {
				accumulatedText += content;
				return;
			}
			sawAssistantDelta = true;
			accumulatedText += content;
			writeSseEvent(res, {
				type: "response.output_text.delta",
				item_id: outputItemId,
				output_index: 0,
				content_index: 0,
				delta: content
			});
			return;
		}
		if (evt.stream === "lifecycle") {
			const phase = evt.data?.phase;
			if (phase === "end" || phase === "error") requestFinalize(phase === "error" ? "failed" : "completed", accumulatedText || bufferedReplaceableAssistantContent || "No response from Operator.");
		}
	});
	stopWatchingDisconnect = require_http_common.watchClientDisconnect(req, res, abortController, () => {
		closed = true;
		unsubscribe();
	});
	(async () => {
		try {
			const result = await runResponsesAgentCommand({
				message: prompt.message,
				images,
				clientTools: resolvedClientTools,
				extraSystemPrompt,
				modelOverride,
				streamParams,
				sessionKey,
				runId: responseId,
				messageChannel,
				deps,
				abortSignal: abortController.signal
			});
			finalUsage = extractUsageFromResult(result);
			const resultAny = result;
			const resultPayloadText = Array.isArray(resultAny.payloads) ? resultAny.payloads.map((p) => typeof p.text === "string" ? p.text : "").filter(Boolean).join("\n\n") : "";
			const meta = resultAny.meta;
			const { stopReason, pendingToolCalls } = resolveStopReasonAndPendingToolCalls(meta);
			if (!closed && toolChoiceConstraint && !require_openai_tool_choice.isToolChoiceConstraintSatisfied({
				constraint: toolChoiceConstraint,
				pendingToolCalls
			})) {
				const failed = createResponseResource({
					id: responseId,
					model,
					status: "failed",
					output: [],
					error: {
						code: "api_error",
						message: require_openai_tool_choice.resolveUnsatisfiedToolChoiceMessage(toolChoiceConstraint)
					},
					usage: finalUsage ?? createEmptyUsage()
				});
				closed = true;
				stopWatchingDisconnect();
				unsubscribe();
				rememberResponseSession();
				writeSseEvent(res, {
					type: "response.failed",
					response: failed
				});
				require_http_common.writeDone(res);
				res.end();
				return;
			}
			if (!closed && stopReason === "tool_calls" && pendingToolCalls && pendingToolCalls.length > 0) {
				const usage = finalUsage ?? createEmptyUsage();
				const finalText = accumulatedText || resultPayloadText || bufferedReplaceableAssistantContent;
				if (toolChoiceConstraint && finalText && !sawAssistantDelta) {
					sawAssistantDelta = true;
					writeSseEvent(res, {
						type: "response.output_text.delta",
						item_id: outputItemId,
						output_index: 0,
						content_index: 0,
						delta: finalText
					});
				}
				writeSseEvent(res, {
					type: "response.output_text.done",
					item_id: outputItemId,
					output_index: 0,
					content_index: 0,
					text: finalText
				});
				writeSseEvent(res, {
					type: "response.content_part.done",
					item_id: outputItemId,
					output_index: 0,
					content_index: 0,
					part: {
						type: "output_text",
						text: finalText
					}
				});
				const completedItem = createAssistantOutputItem({
					id: outputItemId,
					text: finalText,
					phase: "commentary",
					status: "completed"
				});
				writeSseEvent(res, {
					type: "response.output_item.done",
					output_index: 0,
					item: completedItem
				});
				const functionCallItems = [];
				let nextStreamOutputIndex = 1;
				for (const functionCall of pendingToolCalls) {
					const functionCallItemId = `call_${(0, node_crypto.randomUUID)()}`;
					const functionCallItem = createFunctionCallOutputItem({
						id: functionCallItemId,
						callId: functionCall.id,
						name: functionCall.name,
						arguments: functionCall.arguments
					});
					writeSseEvent(res, {
						type: "response.output_item.added",
						output_index: nextStreamOutputIndex,
						item: functionCallItem
					});
					const completedFunctionCallItem = createFunctionCallOutputItem({
						id: functionCallItemId,
						callId: functionCall.id,
						name: functionCall.name,
						arguments: functionCall.arguments,
						status: "completed"
					});
					writeSseEvent(res, {
						type: "response.output_item.done",
						output_index: nextStreamOutputIndex,
						item: completedFunctionCallItem
					});
					functionCallItems.push(functionCallItem);
					nextStreamOutputIndex += 1;
				}
				const incompleteResponse = createResponseResource({
					id: responseId,
					model,
					status: "incomplete",
					output: [completedItem, ...functionCallItems],
					usage
				});
				closed = true;
				stopWatchingDisconnect();
				unsubscribe();
				rememberResponseSession();
				writeSseEvent(res, {
					type: "response.completed",
					response: incompleteResponse
				});
				require_http_common.writeDone(res);
				res.end();
				return;
			}
			if (!sawAssistantDelta) {
				const content = resultPayloadText || bufferedReplaceableAssistantContent || "No response from Operator.";
				accumulatedText = content;
				sawAssistantDelta = true;
				if (finalizeStatus !== null) finalizeRequested = {
					status: finalizeStatus,
					text: content
				};
				writeSseEvent(res, {
					type: "response.output_text.delta",
					item_id: outputItemId,
					output_index: 0,
					content_index: 0,
					delta: content
				});
			}
			maybeFinalize();
		} catch (err) {
			if (closed || abortController.signal.aborted) return;
			require_logger.logWarn(`openresponses: streaming response failed: ${String(err)}`);
			finalUsage = finalUsage ?? createEmptyUsage();
			if (require_selection.isClientToolNameConflictError(err)) {
				writeSseEvent(res, {
					type: "response.failed",
					response: createResponseResource({
						id: responseId,
						model,
						status: "failed",
						output: [],
						error: {
							code: "invalid_request_error",
							message: "invalid tool configuration"
						},
						usage: finalUsage
					})
				});
				require_agent_events.emitAgentEvent({
					runId: responseId,
					stream: "lifecycle",
					data: { phase: "error" }
				});
				return;
			}
			const errorResponse = createResponseResource({
				id: responseId,
				model,
				status: "failed",
				output: [],
				error: {
					code: "api_error",
					message: "internal error"
				},
				usage: finalUsage
			});
			const mapped = require_openai_tool_choice.resolveOpenAiCompatError(err);
			if (mapped) {
				const mappedResponse = createResponseResource({
					id: responseId,
					model,
					status: "failed",
					output: [],
					error: {
						code: mapped.error.type,
						message: mapped.error.message
					},
					usage: finalUsage
				});
				rememberResponseSession();
				writeSseEvent(res, {
					type: "response.failed",
					response: mappedResponse
				});
				require_agent_events.emitAgentEvent({
					runId: responseId,
					stream: "lifecycle",
					data: { phase: "error" }
				});
				return;
			}
			rememberResponseSession();
			writeSseEvent(res, {
				type: "response.failed",
				response: errorResponse
			});
			require_agent_events.emitAgentEvent({
				runId: responseId,
				stream: "lifecycle",
				data: { phase: "error" }
			});
		} finally {
			if (!closed) require_agent_events.emitAgentEvent({
				runId: responseId,
				stream: "lifecycle",
				data: { phase: "end" }
			});
		}
	})();
	return true;
}
//#endregion
exports.__testing = testing;
exports.testing = testing;
exports.buildAgentPrompt = buildAgentPrompt;
exports.handleOpenResponsesHttpRequest = handleOpenResponsesHttpRequest;
