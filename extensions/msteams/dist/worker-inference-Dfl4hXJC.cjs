const require_worker_admission = require("./worker-admission-DNxVcwiA.cjs");
let typebox = require("typebox");
let typebox_value = require("typebox/value");
//#region packages/gateway-protocol/src/schema/worker-inference.ts
const WORKER_INFERENCE_PROTOCOL_FEATURE = "worker-inference-v1";
const WORKER_INFERENCE_METHODS = ["worker.inference.start", "worker.inference.cancel"];
const WORKER_PROTOCOL_MAX_INFERENCE_PAYLOAD_BYTES = 25 * 1024 * 1024;
const WORKER_INFERENCE_MAX_CONTEXT_MESSAGES = 1024;
const WORKER_INFERENCE_MAX_OUTPUT_TOKENS = 1e6;
const WorkerIdentifierSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 256,
	pattern: "^\\S(?:.*\\S)?$"
});
const WorkerFrameIdSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 128
});
const WorkerErrorResponseFrameSchema = require_worker_admission.closedObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(false),
	error: require_worker_admission.WorkerErrorShapeSchema
});
function workerInferenceObject(properties) {
	return require_worker_admission.closedObject(properties);
}
const LiveTextSchema = typebox.Type.String({ maxLength: require_worker_admission.WORKER_PROTOCOL_MAX_PAYLOAD_BYTES });
const InferenceTextSchema = typebox.Type.String({ maxLength: WORKER_PROTOCOL_MAX_INFERENCE_PAYLOAD_BYTES });
const OptionalInferenceTextSchema = typebox.Type.Optional(InferenceTextSchema);
const LiveIntegerSchema = typebox.Type.Integer({
	minimum: 0,
	maximum: Number.MAX_SAFE_INTEGER
});
const LiveSequenceSchema = typebox.Type.Integer({
	minimum: 1,
	maximum: Number.MAX_SAFE_INTEGER
});
const WorkerTranscriptUsageSchema = require_worker_admission.closedObject({
	input: typebox.Type.Number({ minimum: 0 }),
	output: typebox.Type.Number({ minimum: 0 }),
	cacheRead: typebox.Type.Number({ minimum: 0 }),
	cacheWrite: typebox.Type.Number({ minimum: 0 }),
	contextUsage: typebox.Type.Optional(typebox.Type.Union([require_worker_admission.closedObject({
		state: typebox.Type.Literal("available"),
		promptTokens: typebox.Type.Number({ minimum: 0 }),
		totalTokens: typebox.Type.Number({ minimum: 0 })
	}), require_worker_admission.closedObject({ state: typebox.Type.Literal("unavailable") })])),
	totalTokens: typebox.Type.Number({ minimum: 0 }),
	cost: require_worker_admission.closedObject({
		input: typebox.Type.Number({ minimum: 0 }),
		output: typebox.Type.Number({ minimum: 0 }),
		cacheRead: typebox.Type.Number({ minimum: 0 }),
		cacheWrite: typebox.Type.Number({ minimum: 0 }),
		total: typebox.Type.Number({ minimum: 0 }),
		totalOrigin: typebox.Type.Optional(typebox.Type.Literal("provider-billed"))
	})
});
const WorkerTranscriptAssistantDiagnosticSchema = require_worker_admission.closedObject({
	type: WorkerIdentifierSchema,
	timestamp: typebox.Type.Integer({ minimum: 0 }),
	error: typebox.Type.Optional(require_worker_admission.closedObject({
		name: typebox.Type.Optional(typebox.Type.String({ maxLength: 256 })),
		message: typebox.Type.String({ maxLength: require_worker_admission.WORKER_PROTOCOL_MAX_PAYLOAD_BYTES }),
		stack: typebox.Type.Optional(typebox.Type.String({ maxLength: require_worker_admission.WORKER_PROTOCOL_MAX_PAYLOAD_BYTES })),
		code: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String({ maxLength: 256 }), typebox.Type.Number()]))
	})),
	details: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}), typebox.Type.Unknown()))
});
const WorkerInferenceTextContentSchema = workerInferenceObject({
	type: typebox.Type.Literal("text"),
	text: InferenceTextSchema,
	textSignature: OptionalInferenceTextSchema
});
const WorkerInferenceImageContentSchema = workerInferenceObject({
	type: typebox.Type.Literal("image"),
	data: typebox.Type.String({
		minLength: 1,
		maxLength: WORKER_PROTOCOL_MAX_INFERENCE_PAYLOAD_BYTES
	}),
	mimeType: typebox.Type.String({
		minLength: 1,
		maxLength: 256
	})
});
const WorkerInferenceThinkingContentSchema = workerInferenceObject({
	type: typebox.Type.Literal("thinking"),
	thinking: InferenceTextSchema,
	thinkingSignature: OptionalInferenceTextSchema,
	redacted: typebox.Type.Optional(typebox.Type.Boolean())
});
const WorkerInferenceToolCallSchema = workerInferenceObject({
	type: typebox.Type.Literal("toolCall"),
	id: WorkerIdentifierSchema,
	name: WorkerIdentifierSchema,
	arguments: typebox.Type.Record(typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}), typebox.Type.Unknown()),
	thoughtSignature: OptionalInferenceTextSchema,
	executionMode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("sequential"), typebox.Type.Literal("parallel")]))
});
const WorkerInferenceUserMessageSchema = workerInferenceObject({
	role: typebox.Type.Literal("user"),
	content: typebox.Type.Union([InferenceTextSchema, typebox.Type.Array(typebox.Type.Union([WorkerInferenceTextContentSchema, WorkerInferenceImageContentSchema]), {
		minItems: 1,
		maxItems: 128
	})]),
	timestamp: LiveIntegerSchema,
	runtimeContextCarrier: typebox.Type.Optional(typebox.Type.Boolean())
});
const WorkerInferenceAssistantMessageProperties = {
	role: typebox.Type.Literal("assistant"),
	content: typebox.Type.Array(typebox.Type.Union([
		WorkerInferenceTextContentSchema,
		WorkerInferenceThinkingContentSchema,
		WorkerInferenceToolCallSchema
	]), { maxItems: 128 }),
	api: WorkerIdentifierSchema,
	provider: WorkerIdentifierSchema,
	model: WorkerIdentifierSchema,
	responseModel: typebox.Type.Optional(WorkerIdentifierSchema),
	responseId: typebox.Type.Optional(WorkerIdentifierSchema),
	usage: WorkerTranscriptUsageSchema,
	timestamp: LiveIntegerSchema
};
const WorkerInferenceAssistantMessageSchema = workerInferenceObject({
	...WorkerInferenceAssistantMessageProperties,
	stopReason: typebox.Type.Union([
		typebox.Type.Literal("stop"),
		typebox.Type.Literal("length"),
		typebox.Type.Literal("toolUse")
	])
});
const WorkerInferenceContextAssistantMessageSchema = workerInferenceObject({
	...WorkerInferenceAssistantMessageProperties,
	diagnostics: typebox.Type.Optional(typebox.Type.Array(WorkerTranscriptAssistantDiagnosticSchema, { maxItems: 128 })),
	stopReason: typebox.Type.Union([
		typebox.Type.Literal("stop"),
		typebox.Type.Literal("length"),
		typebox.Type.Literal("toolUse"),
		typebox.Type.Literal("error"),
		typebox.Type.Literal("aborted")
	]),
	errorMessage: OptionalInferenceTextSchema,
	errorCode: typebox.Type.Optional(typebox.Type.String({ maxLength: 256 })),
	errorType: typebox.Type.Optional(typebox.Type.String({ maxLength: 256 })),
	errorBody: OptionalInferenceTextSchema
});
const WorkerInferenceMessageSchema = typebox.Type.Union([
	WorkerInferenceUserMessageSchema,
	WorkerInferenceContextAssistantMessageSchema,
	workerInferenceObject({
		role: typebox.Type.Literal("toolResult"),
		toolCallId: WorkerIdentifierSchema,
		toolName: WorkerIdentifierSchema,
		content: typebox.Type.Array(typebox.Type.Union([WorkerInferenceTextContentSchema, WorkerInferenceImageContentSchema]), { maxItems: 128 }),
		details: typebox.Type.Optional(typebox.Type.Unknown()),
		isError: typebox.Type.Boolean(),
		timestamp: LiveIntegerSchema
	})
]);
const WorkerInferenceToolSchema = workerInferenceObject({
	name: WorkerIdentifierSchema,
	description: LiveTextSchema,
	parameters: typebox.Type.Unknown()
});
const WorkerInferenceModelRefSchema = workerInferenceObject({
	provider: WorkerIdentifierSchema,
	model: WorkerIdentifierSchema
});
const WorkerInferenceContextSchema = workerInferenceObject({
	systemPrompt: typebox.Type.Optional(InferenceTextSchema),
	messages: typebox.Type.Array(WorkerInferenceMessageSchema, { maxItems: WORKER_INFERENCE_MAX_CONTEXT_MESSAGES }),
	tools: typebox.Type.Optional(typebox.Type.Array(WorkerInferenceToolSchema, { maxItems: 256 }))
});
const WorkerInferenceReasoningSchema = typebox.Type.Union([
	typebox.Type.Literal("off"),
	typebox.Type.Literal("minimal"),
	typebox.Type.Literal("low"),
	typebox.Type.Literal("medium"),
	typebox.Type.Literal("high"),
	typebox.Type.Literal("xhigh"),
	typebox.Type.Literal("adaptive"),
	typebox.Type.Literal("max")
]);
const WorkerInferenceThinkingBudgetSchema = typebox.Type.Integer({
	minimum: 0,
	maximum: WORKER_INFERENCE_MAX_OUTPUT_TOKENS
});
const WorkerInferenceThinkingBudgetsSchema = workerInferenceObject({
	minimal: typebox.Type.Optional(WorkerInferenceThinkingBudgetSchema),
	low: typebox.Type.Optional(WorkerInferenceThinkingBudgetSchema),
	medium: typebox.Type.Optional(WorkerInferenceThinkingBudgetSchema),
	high: typebox.Type.Optional(WorkerInferenceThinkingBudgetSchema),
	max: typebox.Type.Optional(WorkerInferenceThinkingBudgetSchema)
});
const WorkerInferenceOptionsSchema = workerInferenceObject({
	temperature: typebox.Type.Optional(typebox.Type.Number({
		minimum: 0,
		maximum: 2
	})),
	maxTokens: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: WORKER_INFERENCE_MAX_OUTPUT_TOKENS
	})),
	reasoning: typebox.Type.Optional(WorkerInferenceReasoningSchema),
	thinkingBudgets: typebox.Type.Optional(WorkerInferenceThinkingBudgetsSchema)
});
const WorkerInferenceIdentityProperties = {
	runEpoch: LiveIntegerSchema,
	sessionId: WorkerIdentifierSchema,
	runId: WorkerIdentifierSchema,
	turnId: WorkerIdentifierSchema
};
const WorkerInferenceStartParamsSchema = workerInferenceObject({
	...WorkerInferenceIdentityProperties,
	modelRef: WorkerInferenceModelRefSchema,
	context: WorkerInferenceContextSchema,
	options: WorkerInferenceOptionsSchema
});
const WorkerInferenceStartResultSchema = workerInferenceObject({ status: typebox.Type.Union([typebox.Type.Literal("accepted"), typebox.Type.Literal("replayed")]) });
const WorkerInferenceErrorReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("model-not-approved"),
	typebox.Type.Literal("invalid-context"),
	typebox.Type.Literal("epoch-mismatch"),
	typebox.Type.Literal("session-not-attached"),
	typebox.Type.Literal("provider-error"),
	typebox.Type.Literal("cancelled")
]);
const WorkerInferenceErrorShapeSchema = workerInferenceObject({
	code: typebox.Type.Union([typebox.Type.Literal("INVALID_REQUEST"), typebox.Type.Literal("UNAVAILABLE")]),
	message: typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}),
	details: workerInferenceObject({ reason: WorkerInferenceErrorReasonSchema })
});
workerInferenceObject({
	type: typebox.Type.Literal("req"),
	id: WorkerFrameIdSchema,
	method: typebox.Type.Literal(WORKER_INFERENCE_METHODS[0]),
	params: WorkerInferenceStartParamsSchema
});
const WorkerInferenceStartSuccessResponseFrameSchema = workerInferenceObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(true),
	payload: WorkerInferenceStartResultSchema
});
const WorkerInferenceErrorResponseFrameSchema = workerInferenceObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(false),
	error: WorkerInferenceErrorShapeSchema
});
typebox.Type.Union([
	WorkerInferenceStartSuccessResponseFrameSchema,
	WorkerInferenceErrorResponseFrameSchema,
	WorkerErrorResponseFrameSchema
]);
const WorkerInferenceCancelParamsSchema = workerInferenceObject({ ...WorkerInferenceIdentityProperties });
const WorkerInferenceCancelResultSchema = workerInferenceObject({ status: typebox.Type.Literal("cancelled") });
workerInferenceObject({
	type: typebox.Type.Literal("req"),
	id: WorkerFrameIdSchema,
	method: typebox.Type.Literal(WORKER_INFERENCE_METHODS[1]),
	params: WorkerInferenceCancelParamsSchema
});
const WorkerInferenceCancelSuccessResponseFrameSchema = workerInferenceObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(true),
	payload: WorkerInferenceCancelResultSchema
});
typebox.Type.Union([
	WorkerInferenceCancelSuccessResponseFrameSchema,
	WorkerInferenceErrorResponseFrameSchema,
	WorkerErrorResponseFrameSchema
]);
const WorkerInferenceResolvedModelSchema = workerInferenceObject({
	api: WorkerIdentifierSchema,
	provider: WorkerIdentifierSchema,
	model: WorkerIdentifierSchema
});
const WorkerInferenceStreamEventSchema = typebox.Type.Union([
	workerInferenceObject({
		type: typebox.Type.Literal("start"),
		resolvedModel: WorkerInferenceResolvedModelSchema,
		timestamp: LiveIntegerSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("text_start"),
		contentIndex: LiveIntegerSchema,
		contentSignature: OptionalInferenceTextSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("text_delta"),
		contentIndex: LiveIntegerSchema,
		delta: InferenceTextSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("text_end"),
		contentIndex: LiveIntegerSchema,
		contentSignature: OptionalInferenceTextSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("thinking_start"),
		contentIndex: LiveIntegerSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("thinking_delta"),
		contentIndex: LiveIntegerSchema,
		delta: InferenceTextSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("thinking_end"),
		contentIndex: LiveIntegerSchema,
		contentSignature: OptionalInferenceTextSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("toolcall_start"),
		contentIndex: LiveIntegerSchema,
		id: WorkerIdentifierSchema,
		toolName: WorkerIdentifierSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("toolcall_delta"),
		contentIndex: LiveIntegerSchema,
		delta: InferenceTextSchema
	}),
	workerInferenceObject({
		type: typebox.Type.Literal("toolcall_end"),
		contentIndex: LiveIntegerSchema
	})
]);
const WorkerInferenceEventParamsSchema = workerInferenceObject({
	...WorkerInferenceIdentityProperties,
	seq: LiveSequenceSchema,
	event: WorkerInferenceStreamEventSchema
});
const WorkerInferenceEventFrameSchema = workerInferenceObject({
	type: typebox.Type.Literal("event"),
	event: typebox.Type.Literal("worker.inference.event"),
	payload: WorkerInferenceEventParamsSchema
});
const WorkerInferenceTerminalDoneSchema = workerInferenceObject({
	type: typebox.Type.Literal("done"),
	message: WorkerInferenceAssistantMessageSchema
});
const WorkerInferenceTerminalErrorSchema = workerInferenceObject({
	type: typebox.Type.Literal("error"),
	reason: WorkerInferenceErrorReasonSchema,
	message: typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}),
	usage: typebox.Type.Optional(WorkerTranscriptUsageSchema)
});
const WorkerInferenceTerminalOutcomeSchema = typebox.Type.Union([WorkerInferenceTerminalDoneSchema, WorkerInferenceTerminalErrorSchema]);
const WorkerInferenceTerminalParamsSchema = workerInferenceObject({
	...WorkerInferenceIdentityProperties,
	seq: LiveSequenceSchema,
	outcome: WorkerInferenceTerminalOutcomeSchema
});
const WorkerInferenceTerminalFrameSchema = workerInferenceObject({
	type: typebox.Type.Literal("event"),
	event: typebox.Type.Literal("worker.inference.terminal"),
	payload: WorkerInferenceTerminalParamsSchema
});
function isSafeWorkerInferenceJson(data) {
	const stack = [{
		depth: 0,
		value: data
	}];
	const seen = /* @__PURE__ */ new WeakSet();
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current || current.depth > 32) return false;
		if (current.value === null || typeof current.value === "string" || typeof current.value === "boolean") continue;
		if (typeof current.value === "number") {
			if (!Number.isFinite(current.value)) return false;
			continue;
		}
		if (typeof current.value !== "object" || seen.has(current.value)) return false;
		seen.add(current.value);
		const values = Array.isArray(current.value) ? current.value : Object.values(current.value);
		for (const value of values) stack.push({
			depth: current.depth + 1,
			value
		});
	}
	return true;
}
function validateWorkerInferenceStartParams(data) {
	return isSafeWorkerInferenceJson(data) && typebox_value.Value.Check(WorkerInferenceStartParamsSchema, data);
}
function validateWorkerInferenceCancelParams(data) {
	return isSafeWorkerInferenceJson(data) && typebox_value.Value.Check(WorkerInferenceCancelParamsSchema, data);
}
function validateWorkerInferenceTerminalOutcome(data) {
	return isSafeWorkerInferenceJson(data) && typebox_value.Value.Check(WorkerInferenceTerminalOutcomeSchema, data);
}
function validateWorkerInferenceEventFrame(data) {
	return isSafeWorkerInferenceJson(data) && typebox_value.Value.Check(WorkerInferenceEventFrameSchema, data);
}
function validateWorkerInferenceTerminalFrame(data) {
	return isSafeWorkerInferenceJson(data) && typebox_value.Value.Check(WorkerInferenceTerminalFrameSchema, data);
}
//#endregion
Object.defineProperty(exports, "WORKER_INFERENCE_MAX_CONTEXT_MESSAGES", {
	enumerable: true,
	get: function() {
		return WORKER_INFERENCE_MAX_CONTEXT_MESSAGES;
	}
});
Object.defineProperty(exports, "WORKER_INFERENCE_METHODS", {
	enumerable: true,
	get: function() {
		return WORKER_INFERENCE_METHODS;
	}
});
Object.defineProperty(exports, "WORKER_INFERENCE_PROTOCOL_FEATURE", {
	enumerable: true,
	get: function() {
		return WORKER_INFERENCE_PROTOCOL_FEATURE;
	}
});
Object.defineProperty(exports, "WORKER_PROTOCOL_MAX_INFERENCE_PAYLOAD_BYTES", {
	enumerable: true,
	get: function() {
		return WORKER_PROTOCOL_MAX_INFERENCE_PAYLOAD_BYTES;
	}
});
Object.defineProperty(exports, "WorkerInferenceModelRefSchema", {
	enumerable: true,
	get: function() {
		return WorkerInferenceModelRefSchema;
	}
});
Object.defineProperty(exports, "WorkerInferenceOptionsSchema", {
	enumerable: true,
	get: function() {
		return WorkerInferenceOptionsSchema;
	}
});
Object.defineProperty(exports, "validateWorkerInferenceCancelParams", {
	enumerable: true,
	get: function() {
		return validateWorkerInferenceCancelParams;
	}
});
Object.defineProperty(exports, "validateWorkerInferenceEventFrame", {
	enumerable: true,
	get: function() {
		return validateWorkerInferenceEventFrame;
	}
});
Object.defineProperty(exports, "validateWorkerInferenceStartParams", {
	enumerable: true,
	get: function() {
		return validateWorkerInferenceStartParams;
	}
});
Object.defineProperty(exports, "validateWorkerInferenceTerminalFrame", {
	enumerable: true,
	get: function() {
		return validateWorkerInferenceTerminalFrame;
	}
});
Object.defineProperty(exports, "validateWorkerInferenceTerminalOutcome", {
	enumerable: true,
	get: function() {
		return validateWorkerInferenceTerminalOutcome;
	}
});
