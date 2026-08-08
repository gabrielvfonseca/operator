const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
let typebox = require("typebox");
//#region packages/gateway-protocol/src/schema/closed-object.ts
function closedObject(properties) {
	return typebox.Type.Object(properties, { additionalProperties: false });
}
//#endregion
//#region packages/gateway-protocol/src/schema/worker-admission.ts
var worker_admission_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	WORKER_HEARTBEAT_INTERVAL_MS: () => WORKER_HEARTBEAT_INTERVAL_MS,
	WORKER_LIVE_EVENT_PROTOCOL_FEATURE: () => WORKER_LIVE_EVENT_PROTOCOL_FEATURE,
	WORKER_PROTOCOL_FEATURES: () => WORKER_PROTOCOL_FEATURES,
	WORKER_PROTOCOL_MAX_FEATURES: () => 64,
	WORKER_PROTOCOL_MAX_FEATURE_LENGTH: () => 128,
	WORKER_PROTOCOL_MAX_FRAME_ID_LENGTH: () => 128,
	WORKER_PROTOCOL_MAX_IDENTIFIER_LENGTH: () => 256,
	WORKER_PROTOCOL_MAX_METHOD_LENGTH: () => 64,
	WORKER_PROTOCOL_MAX_PAYLOAD_BYTES: () => WORKER_PROTOCOL_MAX_PAYLOAD_BYTES,
	WORKER_PROTOCOL_METHODS: () => WORKER_PROTOCOL_METHODS,
	WORKER_RPC_SET_VERSION: () => 1,
	WORKER_TRANSCRIPT_COMMIT_PROTOCOL_FEATURE: () => WORKER_TRANSCRIPT_COMMIT_PROTOCOL_FEATURE,
	WORKER_TRANSCRIPT_MAX_BATCH_MESSAGES: () => 64,
	WORKER_TRANSCRIPT_MAX_CONTENT_PARTS: () => 128,
	WORKER_TRANSCRIPT_MAX_JSON_DEPTH: () => 32,
	WorkerAdmissionFailureReasonSchema: () => WorkerAdmissionFailureReasonSchema,
	WorkerAdmissionHandshakeSchema: () => WorkerAdmissionHandshakeSchema,
	WorkerAdmissionResponseFrameSchema: () => WorkerAdmissionResponseFrameSchema,
	WorkerConnectParamsSchema: () => WorkerConnectParamsSchema,
	WorkerConnectRequestFrameSchema: () => WorkerConnectRequestFrameSchema,
	WorkerErrorShapeSchema: () => WorkerErrorShapeSchema,
	WorkerHeartbeatParamsSchema: () => WorkerHeartbeatParamsSchema,
	WorkerHeartbeatRequestFrameSchema: () => WorkerHeartbeatRequestFrameSchema,
	WorkerHeartbeatResponseFrameSchema: () => WorkerHeartbeatResponseFrameSchema,
	WorkerHeartbeatResultSchema: () => WorkerHeartbeatResultSchema,
	WorkerHelloOkSchema: () => WorkerHelloOkSchema,
	WorkerLiveEventErrorDetailsSchema: () => WorkerLiveEventErrorDetailsSchema,
	WorkerLiveEventErrorShapeSchema: () => WorkerLiveEventErrorShapeSchema,
	WorkerLiveEventParamsSchema: () => WorkerLiveEventParamsSchema,
	WorkerLiveEventRequestFrameSchema: () => WorkerLiveEventRequestFrameSchema,
	WorkerLiveEventResponseFrameSchema: () => WorkerLiveEventResponseFrameSchema,
	WorkerLiveEventResultSchema: () => WorkerLiveEventResultSchema,
	WorkerLiveEventSchema: () => WorkerLiveEventSchema,
	WorkerProtocolCloseReasonSchema: () => WorkerProtocolCloseReasonSchema,
	WorkerTranscriptCommitErrorReasonSchema: () => WorkerTranscriptCommitErrorReasonSchema,
	WorkerTranscriptCommitErrorShapeSchema: () => WorkerTranscriptCommitErrorShapeSchema,
	WorkerTranscriptCommitParamsSchema: () => WorkerTranscriptCommitParamsSchema,
	WorkerTranscriptCommitRequestFrameSchema: () => WorkerTranscriptCommitRequestFrameSchema,
	WorkerTranscriptCommitResponseFrameSchema: () => WorkerTranscriptCommitResponseFrameSchema,
	WorkerTranscriptCommitResultSchema: () => WorkerTranscriptCommitResultSchema,
	WorkerTranscriptMessageSchema: () => WorkerTranscriptMessageSchema
});
const WORKER_RPC_SET_VERSION = 1;
const WORKER_HEARTBEAT_INTERVAL_MS = 15e3;
const WORKER_PROTOCOL_METHODS = [
	"worker.heartbeat",
	"worker.transcript.commit",
	"worker.live-event"
];
const WORKER_TRANSCRIPT_COMMIT_PROTOCOL_FEATURE = "worker-transcript-commit-v1";
const WORKER_LIVE_EVENT_PROTOCOL_FEATURE = "worker-live-event-v1";
const WORKER_PROTOCOL_FEATURES = [
	"worker-heartbeat-v1",
	WORKER_TRANSCRIPT_COMMIT_PROTOCOL_FEATURE,
	WORKER_LIVE_EVENT_PROTOCOL_FEATURE,
	"worker-inference-v1"
];
const WORKER_PROTOCOL_MAX_IDENTIFIER_LENGTH = 256;
const WORKER_PROTOCOL_MAX_FRAME_ID_LENGTH = 128;
const WORKER_PROTOCOL_MAX_METHOD_LENGTH = 64;
const WORKER_PROTOCOL_MAX_PAYLOAD_BYTES = 64 * 1024;
const WORKER_PROTOCOL_MAX_FEATURES = 64;
const WORKER_PROTOCOL_MAX_FEATURE_LENGTH = 128;
const WORKER_TRANSCRIPT_MAX_CONTENT_PARTS = 128;
const WORKER_TRANSCRIPT_MAX_JSON_DEPTH = 32;
const WorkerIdentifierSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 256,
	pattern: "^\\S(?:.*\\S)?$"
});
const WorkerCredentialSchema = typebox.Type.String({
	minLength: 16,
	maxLength: 256
});
const WorkerFrameIdSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 128
});
const WorkerProtocolFeatureSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 128
});
/** Build identity presented by a worker before the gateway admits it. */
const WorkerAdmissionHandshakeSchema = closedObject({
	bundleHash: typebox.Type.String({
		minLength: 64,
		maxLength: 64,
		pattern: "^[a-f0-9]{64}$"
	}),
	operatorVersion: typebox.Type.String({
		minLength: 1,
		maxLength: 128
	}),
	protocolFeatures: typebox.Type.Array(WorkerProtocolFeatureSchema, {
		maxItems: 64,
		uniqueItems: true
	})
});
const WorkerConnectAdmissionCommonProperties = {
	environmentId: WorkerIdentifierSchema,
	credential: WorkerCredentialSchema,
	ownerEpoch: typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	rpcSetVersion: typebox.Type.Integer({
		minimum: 1,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	handshake: WorkerAdmissionHandshakeSchema
};
const WorkerConnectAdmissionSchema = typebox.Type.Union([closedObject({
	...WorkerConnectAdmissionCommonProperties,
	sessionId: typebox.Type.Null(),
	runId: typebox.Type.Null()
}), closedObject({
	...WorkerConnectAdmissionCommonProperties,
	sessionId: WorkerIdentifierSchema,
	runId: WorkerIdentifierSchema
})]);
/** Dedicated first-frame payload accepted only on the worker ingress. */
const WorkerConnectParamsSchema = closedObject({
	minProtocol: typebox.Type.Integer({ minimum: 1 }),
	maxProtocol: typebox.Type.Integer({ minimum: 1 }),
	client: closedObject({
		id: typebox.Type.Literal(require_client_info.GATEWAY_CLIENT_IDS.WORKER),
		version: typebox.Type.String({
			minLength: 1,
			maxLength: 128
		}),
		platform: typebox.Type.String({
			minLength: 1,
			maxLength: 128
		}),
		mode: typebox.Type.Literal(require_client_info.GATEWAY_CLIENT_MODES.WORKER)
	}),
	role: typebox.Type.Literal("worker"),
	admission: WorkerConnectAdmissionSchema
});
const WorkerConnectRequestFrameSchema = closedObject({
	type: typebox.Type.Literal("req"),
	id: WorkerFrameIdSchema,
	method: typebox.Type.Literal("connect"),
	params: WorkerConnectParamsSchema
});
const WorkerAdmissionFailureReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("invalid-credential"),
	typebox.Type.Literal("credential-expired"),
	typebox.Type.Literal("environment-mismatch"),
	typebox.Type.Literal("environment-unavailable"),
	typebox.Type.Literal("bundle-mismatch"),
	typebox.Type.Literal("version-mismatch"),
	typebox.Type.Literal("session-mismatch"),
	typebox.Type.Literal("placement-mismatch"),
	typebox.Type.Literal("owner-epoch-mismatch"),
	typebox.Type.Literal("rpc-set-mismatch"),
	typebox.Type.Literal("protocol-features-mismatch")
]);
const WorkerProtocolCloseReasonSchema = typebox.Type.Union([
	WorkerAdmissionFailureReasonSchema,
	typebox.Type.Literal("invalid-handshake"),
	typebox.Type.Literal("protocol-mismatch"),
	typebox.Type.Literal("gateway-unavailable"),
	typebox.Type.Literal("invalid-frame"),
	typebox.Type.Literal("slow-consumer"),
	typebox.Type.Literal("method-not-allowed"),
	typebox.Type.Literal("invalid-heartbeat"),
	typebox.Type.Literal("credential-replaced"),
	typebox.Type.Literal("gateway-shutdown")
]);
const WorkerErrorCodeSchema = typebox.Type.Union([typebox.Type.Literal("INVALID_REQUEST"), typebox.Type.Literal("UNAVAILABLE")]);
const WorkerErrorDetailsSchema = closedObject({ reason: WorkerProtocolCloseReasonSchema });
const WorkerErrorShapeSchema = closedObject({
	code: WorkerErrorCodeSchema,
	message: typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}),
	details: WorkerErrorDetailsSchema,
	retryable: typebox.Type.Optional(typebox.Type.Boolean()),
	retryAfterMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/** Minimal admission response; workers never receive the general gateway snapshot. */
const WorkerHelloOkSchema = closedObject({
	type: typebox.Type.Literal("worker-hello-ok"),
	environmentId: WorkerIdentifierSchema,
	sessionId: typebox.Type.Union([WorkerIdentifierSchema, typebox.Type.Null()]),
	ownerEpoch: typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	rpcSetVersion: typebox.Type.Integer({
		minimum: 1,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	protocolFeatures: typebox.Type.Array(WorkerProtocolFeatureSchema, {
		maxItems: 64,
		uniqueItems: true
	}),
	credentialExpiresAtMs: typebox.Type.Integer({ minimum: 0 }),
	policy: closedObject({
		heartbeatIntervalMs: typebox.Type.Integer({ minimum: 1 }),
		maxPayload: typebox.Type.Integer({ minimum: 1 })
	})
});
const WorkerErrorResponseFrameSchema = closedObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(false),
	error: WorkerErrorShapeSchema
});
const WorkerAdmissionSuccessResponseFrameSchema = closedObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(true),
	payload: WorkerHelloOkSchema
});
const WorkerAdmissionResponseFrameSchema = typebox.Type.Union([WorkerAdmissionSuccessResponseFrameSchema, WorkerErrorResponseFrameSchema]);
const WorkerStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("ready"),
	typebox.Type.Literal("busy"),
	typebox.Type.Literal("draining")
]);
const WorkerHeartbeatParamsSchema = closedObject({
	sentAtMs: typebox.Type.Integer({ minimum: 0 }),
	status: WorkerStatusSchema
});
const WorkerHeartbeatResultSchema = closedObject({
	receivedAtMs: typebox.Type.Integer({ minimum: 0 }),
	status: typebox.Type.Literal("ok"),
	ownerEpoch: typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	})
});
const WorkerHeartbeatRequestFrameSchema = closedObject({
	type: typebox.Type.Literal("req"),
	id: WorkerFrameIdSchema,
	method: typebox.Type.Literal(WORKER_PROTOCOL_METHODS[0]),
	params: WorkerHeartbeatParamsSchema
});
const WorkerHeartbeatSuccessResponseFrameSchema = closedObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(true),
	payload: WorkerHeartbeatResultSchema
});
const WorkerHeartbeatResponseFrameSchema = typebox.Type.Union([WorkerHeartbeatSuccessResponseFrameSchema, WorkerErrorResponseFrameSchema]);
const WorkerTranscriptTextContentSchema = closedObject({
	type: typebox.Type.Literal("text"),
	text: typebox.Type.String({ maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES }),
	textSignature: typebox.Type.Optional(typebox.Type.String({
		minLength: 1,
		maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES
	}))
});
const WorkerTranscriptThinkingContentSchema = closedObject({
	type: typebox.Type.Literal("thinking"),
	thinking: typebox.Type.String({ maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES }),
	thinkingSignature: typebox.Type.Optional(typebox.Type.String({
		minLength: 1,
		maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES
	})),
	redacted: typebox.Type.Optional(typebox.Type.Boolean())
});
const WorkerTranscriptImageContentSchema = closedObject({
	type: typebox.Type.Literal("image"),
	data: typebox.Type.String({
		minLength: 1,
		maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES
	}),
	mimeType: typebox.Type.String({
		minLength: 1,
		maxLength: 256
	})
});
const WorkerTranscriptToolCallSchema = closedObject({
	type: typebox.Type.Literal("toolCall"),
	id: WorkerIdentifierSchema,
	name: WorkerIdentifierSchema,
	arguments: typebox.Type.Record(typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}), typebox.Type.Unknown()),
	thoughtSignature: typebox.Type.Optional(typebox.Type.String({
		minLength: 1,
		maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES
	})),
	executionMode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("sequential"), typebox.Type.Literal("parallel")]))
});
const WorkerTranscriptUsageSchema = closedObject({
	input: typebox.Type.Number({ minimum: 0 }),
	output: typebox.Type.Number({ minimum: 0 }),
	cacheRead: typebox.Type.Number({ minimum: 0 }),
	cacheWrite: typebox.Type.Number({ minimum: 0 }),
	contextUsage: typebox.Type.Optional(typebox.Type.Union([closedObject({
		state: typebox.Type.Literal("available"),
		promptTokens: typebox.Type.Number({ minimum: 0 }),
		totalTokens: typebox.Type.Number({ minimum: 0 })
	}), closedObject({ state: typebox.Type.Literal("unavailable") })])),
	totalTokens: typebox.Type.Number({ minimum: 0 }),
	cost: closedObject({
		input: typebox.Type.Number({ minimum: 0 }),
		output: typebox.Type.Number({ minimum: 0 }),
		cacheRead: typebox.Type.Number({ minimum: 0 }),
		cacheWrite: typebox.Type.Number({ minimum: 0 }),
		total: typebox.Type.Number({ minimum: 0 }),
		totalOrigin: typebox.Type.Optional(typebox.Type.Literal("provider-billed"))
	})
});
const WorkerTranscriptAssistantDiagnosticSchema = closedObject({
	type: WorkerIdentifierSchema,
	timestamp: typebox.Type.Integer({ minimum: 0 }),
	error: typebox.Type.Optional(closedObject({
		name: typebox.Type.Optional(typebox.Type.String({ maxLength: 256 })),
		message: typebox.Type.String({ maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES }),
		stack: typebox.Type.Optional(typebox.Type.String({ maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES })),
		code: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String({ maxLength: 256 }), typebox.Type.Number()]))
	})),
	details: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}), typebox.Type.Unknown()))
});
const WorkerTranscriptUserMessageSchema = closedObject({
	role: typebox.Type.Literal("user"),
	content: typebox.Type.Array(typebox.Type.Union([WorkerTranscriptTextContentSchema, WorkerTranscriptImageContentSchema]), {
		minItems: 1,
		maxItems: 128
	}),
	timestamp: typebox.Type.Integer({ minimum: 0 })
});
const WorkerTranscriptAssistantMessageSchema = closedObject({
	role: typebox.Type.Literal("assistant"),
	content: typebox.Type.Array(typebox.Type.Union([
		WorkerTranscriptTextContentSchema,
		WorkerTranscriptThinkingContentSchema,
		WorkerTranscriptToolCallSchema
	]), { maxItems: 128 }),
	api: WorkerIdentifierSchema,
	provider: WorkerIdentifierSchema,
	model: WorkerIdentifierSchema,
	responseModel: typebox.Type.Optional(WorkerIdentifierSchema),
	responseId: typebox.Type.Optional(WorkerIdentifierSchema),
	diagnostics: typebox.Type.Optional(typebox.Type.Array(WorkerTranscriptAssistantDiagnosticSchema, { maxItems: 128 })),
	usage: WorkerTranscriptUsageSchema,
	stopReason: typebox.Type.Union([
		typebox.Type.Literal("stop"),
		typebox.Type.Literal("length"),
		typebox.Type.Literal("toolUse"),
		typebox.Type.Literal("error"),
		typebox.Type.Literal("aborted")
	]),
	errorMessage: typebox.Type.Optional(typebox.Type.String({ maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES })),
	errorCode: typebox.Type.Optional(typebox.Type.String({ maxLength: 256 })),
	errorType: typebox.Type.Optional(typebox.Type.String({ maxLength: 256 })),
	errorBody: typebox.Type.Optional(typebox.Type.String({ maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES })),
	timestamp: typebox.Type.Integer({ minimum: 0 })
});
const WorkerTranscriptToolResultMessageSchema = closedObject({
	role: typebox.Type.Literal("toolResult"),
	toolCallId: WorkerIdentifierSchema,
	toolName: WorkerIdentifierSchema,
	content: typebox.Type.Array(typebox.Type.Union([WorkerTranscriptTextContentSchema, WorkerTranscriptImageContentSchema]), { maxItems: 128 }),
	details: typebox.Type.Optional(typebox.Type.Unknown()),
	isError: typebox.Type.Boolean(),
	timestamp: typebox.Type.Integer({ minimum: 0 })
});
const WorkerTranscriptMessageSchema = typebox.Type.Union([
	WorkerTranscriptUserMessageSchema,
	WorkerTranscriptAssistantMessageSchema,
	WorkerTranscriptToolResultMessageSchema
]);
const WorkerTranscriptCommitParamsSchema = closedObject({
	runEpoch: typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	seq: typebox.Type.Integer({
		minimum: 1,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	baseLeafId: typebox.Type.Union([WorkerIdentifierSchema, typebox.Type.Null()]),
	messages: typebox.Type.Array(WorkerTranscriptMessageSchema, {
		minItems: 1,
		maxItems: 64
	})
});
const WorkerTranscriptCommitResultSchema = closedObject({
	entryIds: typebox.Type.Array(WorkerIdentifierSchema, {
		minItems: 1,
		maxItems: 64
	}),
	newLeafId: WorkerIdentifierSchema
});
const WorkerTranscriptCommitErrorReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("stale-base-leaf"),
	typebox.Type.Literal("epoch-mismatch"),
	typebox.Type.Literal("invalid-batch"),
	typebox.Type.Literal("session-not-attached")
]);
const WorkerTranscriptCommitErrorShapeSchema = closedObject({
	code: typebox.Type.Literal("INVALID_REQUEST"),
	message: typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}),
	details: closedObject({ reason: WorkerTranscriptCommitErrorReasonSchema })
});
const WorkerTranscriptCommitRequestFrameSchema = closedObject({
	type: typebox.Type.Literal("req"),
	id: WorkerFrameIdSchema,
	method: typebox.Type.Literal(WORKER_PROTOCOL_METHODS[1]),
	params: WorkerTranscriptCommitParamsSchema
});
const WorkerTranscriptCommitSuccessResponseFrameSchema = closedObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(true),
	payload: WorkerTranscriptCommitResultSchema
});
const WorkerTranscriptCommitErrorResponseFrameSchema = closedObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(false),
	error: WorkerTranscriptCommitErrorShapeSchema
});
const WorkerTranscriptCommitResponseFrameSchema = typebox.Type.Union([
	WorkerTranscriptCommitSuccessResponseFrameSchema,
	WorkerTranscriptCommitErrorResponseFrameSchema,
	WorkerErrorResponseFrameSchema
]);
function workerLiveObject(properties) {
	return closedObject(properties);
}
const LiveTextSchema = typebox.Type.String({ maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES });
const OptionalLiveTextSchema = typebox.Type.Optional(LiveTextSchema);
const LiveIntegerSchema = typebox.Type.Integer({
	minimum: 0,
	maximum: Number.MAX_SAFE_INTEGER
});
const OptionalLiveIntegerSchema = typebox.Type.Optional(LiveIntegerSchema);
const LiveSequenceSchema = typebox.Type.Integer({
	minimum: 1,
	maximum: Number.MAX_SAFE_INTEGER
});
const LiveIdentifierSchema = typebox.Type.String({
	minLength: 1,
	maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES,
	pattern: "^\\S(?:.*\\S)?$"
});
const WorkerLiveAssistantPayloadSchema = workerLiveObject({
	text: LiveTextSchema,
	delta: LiveTextSchema,
	replace: typebox.Type.Optional(typebox.Type.Literal(true)),
	mediaUrls: typebox.Type.Optional(typebox.Type.Array(LiveIdentifierSchema, { maxItems: 128 })),
	phase: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("commentary"), typebox.Type.Literal("final_answer")])),
	itemId: typebox.Type.Optional(WorkerIdentifierSchema)
});
const WorkerLiveThinkingPayloadSchema = workerLiveObject({
	text: LiveTextSchema,
	delta: LiveTextSchema
});
const WorkerLiveToolCommonProperties = {
	name: WorkerIdentifierSchema,
	toolCallId: WorkerIdentifierSchema,
	hideFromChannelProgress: typebox.Type.Optional(typebox.Type.Literal(true))
};
const WorkerLiveToolPayloadSchema = typebox.Type.Union([
	workerLiveObject({
		...WorkerLiveToolCommonProperties,
		phase: typebox.Type.Literal("start"),
		args: typebox.Type.Unknown()
	}),
	workerLiveObject({
		...WorkerLiveToolCommonProperties,
		phase: typebox.Type.Literal("update"),
		partialResult: typebox.Type.Unknown()
	}),
	workerLiveObject({
		...WorkerLiveToolCommonProperties,
		phase: typebox.Type.Literal("result"),
		meta: OptionalLiveTextSchema,
		isError: typebox.Type.Boolean(),
		result: typebox.Type.Unknown(),
		toolErrorSummary: OptionalLiveTextSchema
	})
]);
const WorkerLiveApprovalCommonProperties = {
	kind: typebox.Type.Union([
		typebox.Type.Literal("exec"),
		typebox.Type.Literal("plugin"),
		typebox.Type.Literal("unknown")
	]),
	title: LiveTextSchema,
	itemId: typebox.Type.Optional(WorkerIdentifierSchema),
	toolCallId: typebox.Type.Optional(WorkerIdentifierSchema),
	approvalId: typebox.Type.Optional(WorkerIdentifierSchema),
	approvalSlug: typebox.Type.Optional(WorkerIdentifierSchema),
	command: OptionalLiveTextSchema,
	host: OptionalLiveTextSchema,
	reason: OptionalLiveTextSchema,
	scope: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("turn"), typebox.Type.Literal("session")])),
	message: OptionalLiveTextSchema
};
const WorkerLiveApprovalPayloadSchema = typebox.Type.Union([workerLiveObject({
	...WorkerLiveApprovalCommonProperties,
	phase: typebox.Type.Literal("requested"),
	status: typebox.Type.Union([typebox.Type.Literal("pending"), typebox.Type.Literal("unavailable")])
}), workerLiveObject({
	...WorkerLiveApprovalCommonProperties,
	phase: typebox.Type.Literal("resolved"),
	status: typebox.Type.Union([
		typebox.Type.Literal("approved"),
		typebox.Type.Literal("denied"),
		typebox.Type.Literal("failed")
	])
})]);
const WorkerLiveLifecycleStartPayloadSchema = workerLiveObject({
	phase: typebox.Type.Literal("start"),
	startedAt: LiveIntegerSchema
});
const WorkerLiveFallbackReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("auth"),
	typebox.Type.Literal("auth_permanent"),
	typebox.Type.Literal("format"),
	typebox.Type.Literal("rate_limit"),
	typebox.Type.Literal("overloaded"),
	typebox.Type.Literal("billing"),
	typebox.Type.Literal("server_error"),
	typebox.Type.Literal("timeout"),
	typebox.Type.Literal("context_overflow"),
	typebox.Type.Literal("model_not_found"),
	typebox.Type.Literal("session_expired"),
	typebox.Type.Literal("empty_response"),
	typebox.Type.Literal("no_error_details"),
	typebox.Type.Literal("unclassified"),
	typebox.Type.Literal("unknown")
]);
const WorkerLiveFallbackAttemptSchema = workerLiveObject({
	provider: LiveIdentifierSchema,
	model: LiveIdentifierSchema,
	error: LiveTextSchema,
	reason: typebox.Type.Optional(WorkerLiveFallbackReasonSchema),
	authMode: typebox.Type.Optional(LiveIdentifierSchema),
	status: OptionalLiveIntegerSchema,
	code: typebox.Type.Optional(typebox.Type.String({
		minLength: 1,
		maxLength: WORKER_PROTOCOL_MAX_PAYLOAD_BYTES
	}))
});
const WorkerLiveFallbackCommonProperties = {
	selectedProvider: LiveIdentifierSchema,
	selectedModel: LiveIdentifierSchema,
	activeProvider: LiveIdentifierSchema,
	activeModel: LiveIdentifierSchema
};
const WorkerLiveLifecycleFallbackPayloadSchema = workerLiveObject({
	...WorkerLiveFallbackCommonProperties,
	phase: typebox.Type.Literal("fallback"),
	reasonSummary: LiveTextSchema,
	attemptSummaries: typebox.Type.Array(LiveTextSchema, { maxItems: 128 }),
	attempts: typebox.Type.Array(WorkerLiveFallbackAttemptSchema, { maxItems: 128 })
});
const WorkerLiveLifecycleFallbackClearedPayloadSchema = workerLiveObject({
	...WorkerLiveFallbackCommonProperties,
	phase: typebox.Type.Literal("fallback_cleared"),
	previousActiveModel: typebox.Type.Optional(LiveIdentifierSchema)
});
const WorkerLiveLifecycleFallbackStepPayloadSchema = workerLiveObject({
	phase: typebox.Type.Literal("fallback_step"),
	fallbackStepType: typebox.Type.Literal("fallback_step"),
	fallbackStepFromModel: LiveIdentifierSchema,
	fallbackStepToModel: typebox.Type.Optional(LiveIdentifierSchema),
	fallbackStepFromFailureReason: typebox.Type.Optional(WorkerLiveFallbackReasonSchema),
	fallbackStepFromFailureDetail: OptionalLiveTextSchema,
	fallbackStepChainPosition: OptionalLiveIntegerSchema,
	fallbackStepFinalOutcome: typebox.Type.Union([
		typebox.Type.Literal("next_fallback"),
		typebox.Type.Literal("succeeded"),
		typebox.Type.Literal("chain_exhausted")
	])
});
const WorkerLiveLifecycleTerminalCommonProperties = {
	startedAt: OptionalLiveIntegerSchema,
	endedAt: LiveIntegerSchema,
	stopReason: typebox.Type.Optional(WorkerIdentifierSchema),
	yielded: typebox.Type.Optional(typebox.Type.Literal(true)),
	timeoutPhase: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("queue"),
		typebox.Type.Literal("preflight"),
		typebox.Type.Literal("provider"),
		typebox.Type.Literal("post_turn"),
		typebox.Type.Literal("gateway_draining")
	])),
	providerStarted: typebox.Type.Optional(typebox.Type.Boolean()),
	aborted: typebox.Type.Optional(typebox.Type.Boolean()),
	toolErrorSummary: OptionalLiveTextSchema,
	livenessState: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("working"),
		typebox.Type.Literal("paused"),
		typebox.Type.Literal("blocked"),
		typebox.Type.Literal("abandoned")
	])),
	replayInvalid: typebox.Type.Optional(typebox.Type.Literal(true))
};
const WorkerLiveLifecycleTerminalPayloadSchema = typebox.Type.Union([
	workerLiveObject({
		...WorkerLiveLifecycleTerminalCommonProperties,
		phase: typebox.Type.Literal("finishing"),
		error: OptionalLiveTextSchema
	}),
	workerLiveObject({
		...WorkerLiveLifecycleTerminalCommonProperties,
		phase: typebox.Type.Literal("end")
	}),
	workerLiveObject({
		...WorkerLiveLifecycleTerminalCommonProperties,
		phase: typebox.Type.Literal("error"),
		error: LiveTextSchema,
		fallbackExhaustedFailure: typebox.Type.Optional(typebox.Type.Literal(true))
	})
]);
const WorkerLiveLifecyclePayloadSchema = typebox.Type.Union([
	WorkerLiveLifecycleStartPayloadSchema,
	WorkerLiveLifecycleFallbackPayloadSchema,
	WorkerLiveLifecycleFallbackClearedPayloadSchema,
	WorkerLiveLifecycleFallbackStepPayloadSchema,
	WorkerLiveLifecycleTerminalPayloadSchema
]);
const WorkerLiveEventSchema = typebox.Type.Union([
	workerLiveObject({
		kind: typebox.Type.Literal("assistant"),
		payload: WorkerLiveAssistantPayloadSchema
	}),
	workerLiveObject({
		kind: typebox.Type.Literal("thinking"),
		payload: WorkerLiveThinkingPayloadSchema
	}),
	workerLiveObject({
		kind: typebox.Type.Literal("tool"),
		payload: WorkerLiveToolPayloadSchema
	}),
	workerLiveObject({
		kind: typebox.Type.Literal("approval"),
		payload: WorkerLiveApprovalPayloadSchema
	}),
	workerLiveObject({
		kind: typebox.Type.Literal("lifecycle"),
		payload: WorkerLiveLifecyclePayloadSchema
	})
]);
const WorkerLiveEventParamsSchema = workerLiveObject({
	runEpoch: LiveIntegerSchema,
	lastAckedSeq: LiveIntegerSchema,
	seq: LiveSequenceSchema,
	runId: WorkerIdentifierSchema,
	event: WorkerLiveEventSchema
});
const WorkerLiveEventResultSchema = workerLiveObject({ ackedSeq: LiveIntegerSchema });
const WorkerLiveEventErrorDetailsSchema = typebox.Type.Union([workerLiveObject({ reason: typebox.Type.Union([
	typebox.Type.Literal("epoch-mismatch"),
	typebox.Type.Literal("session-not-attached"),
	typebox.Type.Literal("invalid-event"),
	typebox.Type.Literal("capacity-exceeded")
]) }), workerLiveObject({
	reason: typebox.Type.Literal("resync-required"),
	ackedSeq: LiveIntegerSchema,
	expectedSeq: LiveSequenceSchema
})]);
const WorkerLiveEventErrorShapeSchema = workerLiveObject({
	code: typebox.Type.Literal("INVALID_REQUEST"),
	message: typebox.Type.String({
		minLength: 1,
		maxLength: 256
	}),
	details: WorkerLiveEventErrorDetailsSchema
});
const WorkerLiveEventRequestFrameSchema = workerLiveObject({
	type: typebox.Type.Literal("req"),
	id: WorkerFrameIdSchema,
	method: typebox.Type.Literal(WORKER_PROTOCOL_METHODS[2]),
	params: WorkerLiveEventParamsSchema
});
const WorkerLiveEventSuccessResponseFrameSchema = workerLiveObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(true),
	payload: WorkerLiveEventResultSchema
});
const WorkerLiveEventErrorResponseFrameSchema = workerLiveObject({
	type: typebox.Type.Literal("res"),
	id: WorkerFrameIdSchema,
	ok: typebox.Type.Literal(false),
	error: WorkerLiveEventErrorShapeSchema
});
const WorkerLiveEventResponseFrameSchema = typebox.Type.Union([
	WorkerLiveEventSuccessResponseFrameSchema,
	WorkerLiveEventErrorResponseFrameSchema,
	WorkerErrorResponseFrameSchema
]);
//#endregion
Object.defineProperty(exports, "WORKER_HEARTBEAT_INTERVAL_MS", {
	enumerable: true,
	get: function() {
		return WORKER_HEARTBEAT_INTERVAL_MS;
	}
});
Object.defineProperty(exports, "WORKER_LIVE_EVENT_PROTOCOL_FEATURE", {
	enumerable: true,
	get: function() {
		return WORKER_LIVE_EVENT_PROTOCOL_FEATURE;
	}
});
Object.defineProperty(exports, "WORKER_PROTOCOL_MAX_FEATURES", {
	enumerable: true,
	get: function() {
		return WORKER_PROTOCOL_MAX_FEATURES;
	}
});
Object.defineProperty(exports, "WORKER_PROTOCOL_MAX_FEATURE_LENGTH", {
	enumerable: true,
	get: function() {
		return WORKER_PROTOCOL_MAX_FEATURE_LENGTH;
	}
});
Object.defineProperty(exports, "WORKER_PROTOCOL_MAX_FRAME_ID_LENGTH", {
	enumerable: true,
	get: function() {
		return WORKER_PROTOCOL_MAX_FRAME_ID_LENGTH;
	}
});
Object.defineProperty(exports, "WORKER_PROTOCOL_MAX_IDENTIFIER_LENGTH", {
	enumerable: true,
	get: function() {
		return WORKER_PROTOCOL_MAX_IDENTIFIER_LENGTH;
	}
});
Object.defineProperty(exports, "WORKER_PROTOCOL_MAX_METHOD_LENGTH", {
	enumerable: true,
	get: function() {
		return WORKER_PROTOCOL_MAX_METHOD_LENGTH;
	}
});
Object.defineProperty(exports, "WORKER_PROTOCOL_MAX_PAYLOAD_BYTES", {
	enumerable: true,
	get: function() {
		return WORKER_PROTOCOL_MAX_PAYLOAD_BYTES;
	}
});
Object.defineProperty(exports, "WORKER_PROTOCOL_METHODS", {
	enumerable: true,
	get: function() {
		return WORKER_PROTOCOL_METHODS;
	}
});
Object.defineProperty(exports, "WORKER_RPC_SET_VERSION", {
	enumerable: true,
	get: function() {
		return WORKER_RPC_SET_VERSION;
	}
});
Object.defineProperty(exports, "WORKER_TRANSCRIPT_COMMIT_PROTOCOL_FEATURE", {
	enumerable: true,
	get: function() {
		return WORKER_TRANSCRIPT_COMMIT_PROTOCOL_FEATURE;
	}
});
Object.defineProperty(exports, "WORKER_TRANSCRIPT_MAX_CONTENT_PARTS", {
	enumerable: true,
	get: function() {
		return WORKER_TRANSCRIPT_MAX_CONTENT_PARTS;
	}
});
Object.defineProperty(exports, "WORKER_TRANSCRIPT_MAX_JSON_DEPTH", {
	enumerable: true,
	get: function() {
		return WORKER_TRANSCRIPT_MAX_JSON_DEPTH;
	}
});
Object.defineProperty(exports, "WorkerAdmissionHandshakeSchema", {
	enumerable: true,
	get: function() {
		return WorkerAdmissionHandshakeSchema;
	}
});
Object.defineProperty(exports, "WorkerConnectRequestFrameSchema", {
	enumerable: true,
	get: function() {
		return WorkerConnectRequestFrameSchema;
	}
});
Object.defineProperty(exports, "WorkerErrorShapeSchema", {
	enumerable: true,
	get: function() {
		return WorkerErrorShapeSchema;
	}
});
Object.defineProperty(exports, "WorkerHeartbeatParamsSchema", {
	enumerable: true,
	get: function() {
		return WorkerHeartbeatParamsSchema;
	}
});
Object.defineProperty(exports, "WorkerLiveEventParamsSchema", {
	enumerable: true,
	get: function() {
		return WorkerLiveEventParamsSchema;
	}
});
Object.defineProperty(exports, "WorkerTranscriptCommitParamsSchema", {
	enumerable: true,
	get: function() {
		return WorkerTranscriptCommitParamsSchema;
	}
});
Object.defineProperty(exports, "WorkerTranscriptMessageSchema", {
	enumerable: true,
	get: function() {
		return WorkerTranscriptMessageSchema;
	}
});
Object.defineProperty(exports, "closedObject", {
	enumerable: true,
	get: function() {
		return closedObject;
	}
});
Object.defineProperty(exports, "worker_admission_exports", {
	enumerable: true,
	get: function() {
		return worker_admission_exports;
	}
});
