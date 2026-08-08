const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_approval_id = require("./approval-id-Nv7Zcdte.cjs");
const require_terminal_upload_constants = require("./terminal-upload-constants-BNmT6J2I.cjs");
const require_worker_admission = require("./worker-admission-DNxVcwiA.cjs");
require("./worker-inference-Dfl4hXJC.cjs");
let typebox_compile = require("typebox/compile");
let typebox = require("typebox");
//#region packages/gateway-protocol/src/protocol-validator.ts
function lazyCompile(schema, precheck) {
	let compiled;
	let errors = null;
	const getCompiled = () => {
		compiled ??= (0, typebox_compile.Compile)(schema);
		return compiled;
	};
	const validate = ((data) => {
		const precheckError = precheck?.(data);
		if (precheckError) {
			errors = [precheckError];
			return false;
		}
		const current = getCompiled();
		const valid = current.Check(data);
		errors = valid ? null : [...current.Errors(data)];
		return valid;
	});
	Object.defineProperties(validate, {
		errors: {
			configurable: true,
			enumerable: true,
			get: () => errors,
			set: (nextErrors) => {
				errors = nextErrors ?? null;
			}
		},
		schema: {
			configurable: true,
			enumerable: true,
			get: () => schema
		}
	});
	return validate;
}
//#endregion
//#region packages/gateway-protocol/src/secret-ref-contract.ts
/** Canonical id for file secret providers that expose exactly one value. */
const SINGLE_VALUE_FILE_REF_ID = "value";
/** Shared alias grammar for env/file/exec secret provider names. */
const SECRET_PROVIDER_ALIAS_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
/** JSON-schema fragment that rejects invalid JSON-pointer escape sequences. */
const FILE_SECRET_REF_ID_INVALID_ESCAPE_JSON_SCHEMA_PATTERN = "~(?:[^01]|$)";
/** JSON-schema pattern for exec secret ref ids, excluding dot-path traversal. */
const EXEC_SECRET_REF_ID_JSON_SCHEMA_PATTERN = "^(?!.*(?:^|/)\\.{1,2}(?:/|$))[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$";
//#endregion
//#region packages/gateway-protocol/src/schema/primitives.ts
/**
* Shared schema primitives reused by gateway protocol request/result schemas.
*
* Keep these schemas small and transport-oriented; feature-specific validation
* belongs in the owning schema module or runtime handler.
*/
const ENV_SECRET_REF_ID_RE = /^[A-Z][A-Z0-9_]{0,127}$/;
const INPUT_PROVENANCE_KIND_VALUES = [
	"external_user",
	"inter_session",
	"internal_system"
];
const SESSION_LABEL_MAX_LENGTH = 512;
/** Non-empty string primitive for protocol fields that reject blank values. */
const NonEmptyString = typebox.Type.String({ minLength: 1 });
/** Chat-send session key string primitive with bounded length. */
const ChatSendSessionKeyString = typebox.Type.String({
	minLength: 1,
	maxLength: 512
});
/** Human-readable session label primitive with bounded display length. */
const SessionLabelString = typebox.Type.String({
	minLength: 1,
	maxLength: SESSION_LABEL_MAX_LENGTH
});
/** Provenance marker for content copied from another user/session/system source. */
const InputProvenanceSchema = require_worker_admission.closedObject({
	kind: typebox.Type.String({ enum: [...INPUT_PROVENANCE_KIND_VALUES] }),
	originSessionId: typebox.Type.Optional(typebox.Type.String()),
	sourceSessionKey: typebox.Type.Optional(typebox.Type.String()),
	sourceChannel: typebox.Type.Optional(typebox.Type.String()),
	sourceTool: typebox.Type.Optional(typebox.Type.String())
});
/** Closed gateway client id schema aligned with `GATEWAY_CLIENT_IDS`. */
const GatewayClientIdSchema = typebox.Type.Enum(require_client_info.GATEWAY_CLIENT_IDS);
/** Closed gateway client mode schema aligned with `GATEWAY_CLIENT_MODES`. */
const GatewayClientModeSchema = typebox.Type.Enum(require_client_info.GATEWAY_CLIENT_MODES);
typebox.Type.Union([
	typebox.Type.Literal("env"),
	typebox.Type.Literal("file"),
	typebox.Type.Literal("exec")
]);
const SecretProviderAliasString = typebox.Type.String({ pattern: SECRET_PROVIDER_ALIAS_PATTERN.source });
const EnvSecretRefSchema = require_worker_admission.closedObject({
	source: typebox.Type.Literal("env"),
	provider: SecretProviderAliasString,
	id: typebox.Type.String({ pattern: ENV_SECRET_REF_ID_RE.source })
});
const FileSecretRefIdSchema = typebox.Type.Unsafe({
	type: "string",
	anyOf: [{ const: SINGLE_VALUE_FILE_REF_ID }, { allOf: [{ pattern: "^/" }, { not: { pattern: FILE_SECRET_REF_ID_INVALID_ESCAPE_JSON_SCHEMA_PATTERN } }] }]
});
const FileSecretRefSchema = require_worker_admission.closedObject({
	source: typebox.Type.Literal("file"),
	provider: SecretProviderAliasString,
	id: FileSecretRefIdSchema
});
const ExecSecretRefSchema = require_worker_admission.closedObject({
	source: typebox.Type.Literal("exec"),
	provider: SecretProviderAliasString,
	id: typebox.Type.String({ pattern: EXEC_SECRET_REF_ID_JSON_SCHEMA_PATTERN })
});
/** Structured secret reference accepted by config and channel protocol payloads. */
const SecretRefSchema = typebox.Type.Union([
	EnvSecretRefSchema,
	FileSecretRefSchema,
	ExecSecretRefSchema
]);
/** Secret input value: either an inline string or a structured SecretRef. */
const SecretInputSchema = typebox.Type.Union([typebox.Type.String(), SecretRefSchema]);
//#endregion
//#region packages/gateway-protocol/src/schema/terminal.ts
const TerminalDimension = typebox.Type.Integer({
	minimum: 1,
	maximum: 2e3
});
/** Opens a shell session; the server picks the shell, cwd, and confinement. */
const TerminalOpenParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	catalog: typebox.Type.Optional(require_worker_admission.closedObject({
		catalogId: NonEmptyString,
		hostId: NonEmptyString,
		threadId: NonEmptyString
	})),
	cols: TerminalDimension,
	rows: TerminalDimension
});
/** Result of a successful open; carries the facts the UI header renders. */
const TerminalOpenResultSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	agentId: NonEmptyString,
	shell: NonEmptyString,
	cwd: NonEmptyString,
	confined: typebox.Type.Boolean(),
	title: typebox.Type.Optional(NonEmptyString)
});
/** Writes client keystrokes to the session stdin. */
const TerminalInputParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	data: typebox.Type.String()
});
/** Stages one file on the host bound to an existing terminal session. */
const TerminalUploadParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	name: typebox.Type.String({
		minLength: 1,
		maxLength: 255
	}),
	contentBase64: typebox.Type.String({ maxLength: require_terminal_upload_constants.MAX_TERMINAL_UPLOAD_BASE64_LENGTH })
});
/** Absolute temporary path pasted into the active terminal after upload. */
const TerminalUploadResultSchema = require_worker_admission.closedObject({
	path: NonEmptyString,
	size: typebox.Type.Integer({
		minimum: 0,
		maximum: require_terminal_upload_constants.MAX_TERMINAL_UPLOAD_BYTES
	})
});
/** Resizes the PTY grid after the client viewport changes. */
const TerminalResizeParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	cols: TerminalDimension,
	rows: TerminalDimension
});
/** Closes a session and kills its process tree. */
const TerminalCloseParamsSchema = require_worker_admission.closedObject({ sessionId: NonEmptyString });
/**
* Rebinds a live-or-detached session to the calling admin connection.
* Attach is take-over (tmux-like): the previous owner, if still connected,
* receives `terminal.exit` with reason "detached".
*/
const TerminalAttachParamsSchema = require_worker_admission.closedObject({ sessionId: NonEmptyString });
/** Result of a successful attach; mirrors open plus the replay buffer. */
const TerminalAttachResultSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	agentId: NonEmptyString,
	shell: NonEmptyString,
	cwd: NonEmptyString,
	confined: typebox.Type.Boolean(),
	buffer: typebox.Type.String(),
	seq: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/** One attachable session, as reported by terminal.list. */
const TerminalSessionInfoSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	agentId: NonEmptyString,
	shell: NonEmptyString,
	cwd: NonEmptyString,
	confined: typebox.Type.Boolean(),
	/** False while the session is detached (no connection owns its stream). */
	attached: typebox.Type.Boolean(),
	createdAtMs: typebox.Type.Integer({ minimum: 0 })
});
/**
* Sessions a reconnecting admin client can attach. All admin connections see
* the same list: the terminal surface is already operator.admin (full host
* access), so cross-connection visibility adds no privilege.
*/
const TerminalListResultSchema = require_worker_admission.closedObject({ sessions: typebox.Type.Array(TerminalSessionInfoSchema) });
/** Reads the current output buffer as plain text without attaching. */
const TerminalTextParamsSchema = require_worker_admission.closedObject({ sessionId: NonEmptyString });
/** Plain-text buffer contents (ANSI stripped); an agent/LLM affordance. */
const TerminalTextResultSchema = require_worker_admission.closedObject({ text: typebox.Type.String() });
/** Shared ok/void result for input, resize, and close. */
const TerminalAckResultSchema = require_worker_admission.closedObject({ ok: typebox.Type.Boolean() });
/** Streamed output chunk; seq is its cumulative UTF-16 end offset within the session. */
const TerminalDataEventSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	seq: typebox.Type.Integer({ minimum: 0 }),
	data: typebox.Type.String()
});
/** Terminal end-of-life notice; the session id is invalid after this event. */
const TerminalExitEventSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	exitCode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Integer(), typebox.Type.Null()])),
	signal: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Integer(), typebox.Type.Null()])),
	reason: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("process_exit"),
		typebox.Type.Literal("closed"),
		typebox.Type.Literal("disconnected"),
		typebox.Type.Literal("detached"),
		typebox.Type.Literal("error")
	])),
	error: typebox.Type.Optional(typebox.Type.String())
});
/** Union of every event a terminal session can emit. */
const TerminalEventSchema = typebox.Type.Union([TerminalDataEventSchema, TerminalExitEventSchema]);
//#endregion
//#region packages/gateway-protocol/src/schema/approvals.ts
const ApprovalIdSchema = typebox.Type.String({
	minLength: 1,
	pattern: require_approval_id.APPROVAL_ID_WELL_FORMED_UNICODE_PATTERN,
	description: "Exact full approval id encoded safely in deep-link paths."
});
/** Approval owner used to select the safe presentation payload. */
const ApprovalKindSchema = typebox.Type.Union([
	typebox.Type.Literal("exec"),
	typebox.Type.Literal("plugin"),
	typebox.Type.Literal("system-agent")
]);
/** Reviewer decisions accepted by the unified approval resolver. */
const ApprovalDecisionSchema = typebox.Type.Union([
	typebox.Type.Literal("allow-once"),
	typebox.Type.Literal("allow-always"),
	typebox.Type.Literal("deny")
]);
/** Reviewer decisions that permit an operation to proceed. */
const ApprovalAllowDecisionSchema = typebox.Type.Union([typebox.Type.Literal("allow-once"), typebox.Type.Literal("allow-always")]);
/** Closed reason recorded for a terminal approval transition. */
const ApprovalTerminalReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("user"),
	typebox.Type.Literal("timeout"),
	typebox.Type.Literal("malformed-verdict"),
	typebox.Type.Literal("no-route"),
	typebox.Type.Literal("run-aborted"),
	typebox.Type.Literal("gateway-restart"),
	typebox.Type.Literal("storage-corrupt")
]);
/** Terminal reason accepted for an allowed approval. */
const ApprovalAllowedReasonSchema = typebox.Type.Union([typebox.Type.Literal("user")]);
/** Terminal reasons accepted for a denied approval. */
const ApprovalDeniedReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("user"),
	typebox.Type.Literal("malformed-verdict"),
	typebox.Type.Literal("no-route"),
	typebox.Type.Literal("storage-corrupt")
]);
/** Terminal reason accepted for an expired approval. */
const ApprovalExpiredReasonSchema = typebox.Type.Union([typebox.Type.Literal("timeout")]);
/** Terminal reasons accepted for a cancelled approval. */
const ApprovalCancelledReasonSchema = typebox.Type.Union([typebox.Type.Literal("run-aborted"), typebox.Type.Literal("gateway-restart")]);
/** Reviewer-facing severity for plugin-owned approval requests. */
const PluginApprovalSeveritySchema = typebox.Type.Union([
	typebox.Type.Literal("info"),
	typebox.Type.Literal("warning"),
	typebox.Type.Literal("critical")
]);
const ApprovalAllowedDecisionsSchema = typebox.Type.Array(ApprovalDecisionSchema, {
	minItems: 1,
	maxItems: 3,
	uniqueItems: true,
	contains: typebox.Type.Literal("deny"),
	description: "Available reviewer decisions. Deny is always available so malformed or unsafe input can fail closed."
});
const SystemAgentApprovalAllowedDecisionsSchema = typebox.Type.Tuple([typebox.Type.Literal("allow-once"), typebox.Type.Literal("deny")]);
/** Redacted exec details safe to persist and render outside the requesting runtime. */
const ExecApprovalPresentationSchema = typebox.Type.Object({
	kind: typebox.Type.Literal("exec"),
	commandText: NonEmptyString,
	commandPreview: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	warningText: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	host: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	nodeId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	agentId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	allowedDecisions: ApprovalAllowedDecisionsSchema
}, {
	additionalProperties: false,
	description: "Reviewer-safe exec presentation. Runtime cwd, environment, system-run binding, and execution plan are intentionally excluded."
});
/** Plugin-supplied reviewer text safe to persist and render across surfaces. */
const PluginApprovalPresentationSchema = require_worker_admission.closedObject({
	kind: typebox.Type.Literal("plugin"),
	title: typebox.Type.String({
		minLength: 1,
		maxLength: 80
	}),
	description: typebox.Type.String({
		minLength: 1,
		maxLength: 512
	}),
	severity: PluginApprovalSeveritySchema,
	pluginId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	toolName: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	agentId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	allowedDecisions: ApprovalAllowedDecisionsSchema
});
/** Reviewer-safe Operator system change. Exact operation stays host-local. */
const SystemAgentApprovalPresentationSchema = require_worker_admission.closedObject({
	kind: typebox.Type.Literal("system-agent"),
	title: typebox.Type.String({
		minLength: 1,
		maxLength: 80
	}),
	description: typebox.Type.String({
		minLength: 1,
		maxLength: 512
	}),
	proposalHash: typebox.Type.String({ pattern: "^[a-f0-9]{64}$" }),
	agentId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	allowedDecisions: SystemAgentApprovalAllowedDecisionsSchema
});
/** Reviewer-safe presentation discriminated by the approval owner. */
const ApprovalPresentationSchema = typebox.Type.Union([
	ExecApprovalPresentationSchema,
	PluginApprovalPresentationSchema,
	SystemAgentApprovalPresentationSchema
]);
const ApprovalRecordCommonFields = {
	id: ApprovalIdSchema,
	urlPath: NonEmptyString,
	createdAtMs: typebox.Type.Integer({ minimum: 0 }),
	expiresAtMs: typebox.Type.Integer({ minimum: 0 }),
	presentation: ApprovalPresentationSchema
};
const ApprovalResolutionFields = { resolvedAtMs: typebox.Type.Integer({ minimum: 0 }) };
/** Approval that has not yet accepted a reviewer decision. */
const PendingApprovalSnapshotSchema = require_worker_admission.closedObject({
	...ApprovalRecordCommonFields,
	status: typebox.Type.Literal("pending")
});
/** Approval whose first recorded reviewer decision allows the operation. */
const AllowedApprovalSnapshotSchema = require_worker_admission.closedObject({
	...ApprovalRecordCommonFields,
	...ApprovalResolutionFields,
	status: typebox.Type.Literal("allowed"),
	decision: ApprovalAllowDecisionSchema,
	reason: ApprovalAllowedReasonSchema
});
/** Approval whose first recorded reviewer decision denies the operation. */
const DeniedApprovalSnapshotSchema = require_worker_admission.closedObject({
	...ApprovalRecordCommonFields,
	...ApprovalResolutionFields,
	status: typebox.Type.Literal("denied"),
	decision: typebox.Type.Literal("deny"),
	reason: ApprovalDeniedReasonSchema
});
/** Approval that reached its deadline and therefore failed closed. */
const ExpiredApprovalSnapshotSchema = require_worker_admission.closedObject({
	...ApprovalRecordCommonFields,
	...ApprovalResolutionFields,
	status: typebox.Type.Literal("expired"),
	reason: ApprovalExpiredReasonSchema
});
/** Approval cancelled by its runtime owner before a reviewer decision. */
const CancelledApprovalSnapshotSchema = require_worker_admission.closedObject({
	...ApprovalRecordCommonFields,
	...ApprovalResolutionFields,
	status: typebox.Type.Literal("cancelled"),
	reason: ApprovalCancelledReasonSchema
});
/** Durable approval projection returned identically to every authorized surface. */
const ApprovalSnapshotSchema = typebox.Type.Union([
	PendingApprovalSnapshotSchema,
	AllowedApprovalSnapshotSchema,
	DeniedApprovalSnapshotSchema,
	ExpiredApprovalSnapshotSchema,
	CancelledApprovalSnapshotSchema
]);
/** Durable terminal approval state returned after a resolution attempt. */
const TerminalApprovalSnapshotSchema = typebox.Type.Union([
	AllowedApprovalSnapshotSchema,
	DeniedApprovalSnapshotSchema,
	ExpiredApprovalSnapshotSchema,
	CancelledApprovalSnapshotSchema
]);
/** Lookup payload for one approval by its exact full id. */
const ApprovalGetParamsSchema = require_worker_admission.closedObject({ id: ApprovalRecordCommonFields.id });
/** Current durable state for one authorized approval lookup. */
const ApprovalGetResultSchema = require_worker_admission.closedObject({ approval: ApprovalSnapshotSchema });
/** Reviewer decision for one approval identified by its exact full id. */
const ApprovalResolveParamsSchema = require_worker_admission.closedObject({
	id: ApprovalRecordCommonFields.id,
	kind: ApprovalKindSchema,
	decision: ApprovalDecisionSchema
});
/** First-answer outcome plus the canonical recorded state returned to all contenders. */
const ApprovalResolveResultSchema = require_worker_admission.closedObject({
	applied: typebox.Type.Boolean(),
	approval: TerminalApprovalSnapshotSchema
});
const SessionApprovalEventCommonFields = {
	sessionKey: NonEmptyString,
	sourceSessionKey: typebox.Type.Optional(NonEmptyString),
	updatedAtMs: typebox.Type.Integer({ minimum: 0 })
};
/** Sanitized pending transition delivered only to an opted-in session audience. */
const PendingSessionApprovalEventSchema = require_worker_admission.closedObject({
	...SessionApprovalEventCommonFields,
	phase: typebox.Type.Literal("pending"),
	approval: PendingApprovalSnapshotSchema
});
/** Sanitized terminal transition delivered only to an opted-in session audience. */
const TerminalSessionApprovalEventSchema = require_worker_admission.closedObject({
	...SessionApprovalEventCommonFields,
	phase: typebox.Type.Literal("terminal"),
	approval: TerminalApprovalSnapshotSchema
});
typebox.Type.Union([PendingSessionApprovalEventSchema, TerminalSessionApprovalEventSchema]);
require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	updatedAtMs: typebox.Type.Integer({ minimum: 0 }),
	approvals: typebox.Type.Array(PendingApprovalSnapshotSchema),
	truncated: typebox.Type.Boolean()
});
//#endregion
//#region packages/gateway-protocol/src/schema/skill-history.ts
const SkillsProposalHistoryStatusParamsSchema = typebox.Type.Object({ agentId: typebox.Type.Optional(NonEmptyString) }, { additionalProperties: false });
const SkillsProposalHistoryScanParamsSchema = typebox.Type.Object({
	agentId: typebox.Type.Optional(NonEmptyString),
	direction: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("older"), typebox.Type.Literal("newer")]))
}, { additionalProperties: false });
const SkillsProposalHistoryScanResultSchema = typebox.Type.Object({
	schema: typebox.Type.Literal("openclaw.skill-workshop.history-scan.v1"),
	hasScanned: typebox.Type.Boolean(),
	reviewedSessions: typebox.Type.Integer({ minimum: 0 }),
	ideasFound: typebox.Type.Integer({ minimum: 0 }),
	hasMore: typebox.Type.Boolean(),
	lastScanReviewed: typebox.Type.Integer({ minimum: 0 }),
	lastScanIdeas: typebox.Type.Integer({ minimum: 0 }),
	lastScanAt: typebox.Type.Optional(NonEmptyString),
	oldestReviewedAt: typebox.Type.Optional(NonEmptyString),
	newestReviewedAt: typebox.Type.Optional(NonEmptyString)
}, { additionalProperties: false });
const validateSkillsProposalHistoryStatusParams = lazyCompile(SkillsProposalHistoryStatusParamsSchema);
const validateSkillsProposalHistoryScanParams = lazyCompile(SkillsProposalHistoryScanParamsSchema);
//#endregion
//#region packages/gateway-protocol/src/schema/migrations.ts
const MAX_MEMORY_MIGRATION_ITEMS = 2e3;
const MemoryMigrationPlanFingerprintSchema = typebox.Type.String({
	minLength: 64,
	maxLength: 64,
	pattern: "^[a-f0-9]{64}$"
});
const MemoryMigrationItemStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("planned"),
	typebox.Type.Literal("migrated"),
	typebox.Type.Literal("skipped"),
	typebox.Type.Literal("warning"),
	typebox.Type.Literal("conflict"),
	typebox.Type.Literal("error")
]);
const MemoryMigrationItemSchema = typebox.Type.Object({
	id: NonEmptyString,
	status: MemoryMigrationItemStatusSchema,
	source: typebox.Type.Optional(NonEmptyString),
	target: typebox.Type.Optional(NonEmptyString),
	message: typebox.Type.Optional(typebox.Type.String()),
	reason: typebox.Type.Optional(typebox.Type.String()),
	details: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), typebox.Type.Unknown()))
}, { additionalProperties: false });
const MemoryMigrationSummarySchema = typebox.Type.Object({
	total: typebox.Type.Integer({ minimum: 0 }),
	planned: typebox.Type.Integer({ minimum: 0 }),
	migrated: typebox.Type.Integer({ minimum: 0 }),
	skipped: typebox.Type.Integer({ minimum: 0 }),
	conflicts: typebox.Type.Integer({ minimum: 0 }),
	errors: typebox.Type.Integer({ minimum: 0 }),
	sensitive: typebox.Type.Integer({ minimum: 0 })
}, { additionalProperties: false });
const MemoryMigrationProviderPlanSchema = typebox.Type.Object({
	providerId: NonEmptyString,
	label: NonEmptyString,
	description: typebox.Type.Optional(typebox.Type.String()),
	planFingerprint: typebox.Type.Optional(MemoryMigrationPlanFingerprintSchema),
	found: typebox.Type.Boolean(),
	source: typebox.Type.Optional(NonEmptyString),
	target: typebox.Type.Optional(NonEmptyString),
	confidence: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("low"),
		typebox.Type.Literal("medium"),
		typebox.Type.Literal("high")
	])),
	message: typebox.Type.Optional(typebox.Type.String()),
	error: typebox.Type.Optional(typebox.Type.String()),
	summary: MemoryMigrationSummarySchema,
	items: typebox.Type.Array(MemoryMigrationItemSchema, { maxItems: MAX_MEMORY_MIGRATION_ITEMS }),
	warnings: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String()))
}, { additionalProperties: false });
const MigrationsMemoryPlanParamsSchema = typebox.Type.Object({
	agentId: NonEmptyString,
	overwrite: typebox.Type.Optional(typebox.Type.Boolean())
}, { additionalProperties: false });
const MigrationsMemoryPlanResultSchema = typebox.Type.Object({
	agentId: NonEmptyString,
	workspace: NonEmptyString,
	providers: typebox.Type.Array(MemoryMigrationProviderPlanSchema)
}, { additionalProperties: false });
const MigrationsMemoryApplyParamsSchema = typebox.Type.Object({
	idempotencyKey: NonEmptyString,
	agentId: NonEmptyString,
	providerId: NonEmptyString,
	planFingerprint: MemoryMigrationPlanFingerprintSchema,
	itemIds: typebox.Type.Array(NonEmptyString, {
		minItems: 1,
		uniqueItems: true,
		maxItems: MAX_MEMORY_MIGRATION_ITEMS
	}),
	overwrite: typebox.Type.Optional(typebox.Type.Boolean())
}, { additionalProperties: false });
const MigrationProtocolSchemas = {
	MemoryMigrationItemStatus: MemoryMigrationItemStatusSchema,
	MemoryMigrationItem: MemoryMigrationItemSchema,
	MemoryMigrationSummary: MemoryMigrationSummarySchema,
	MemoryMigrationProviderPlan: MemoryMigrationProviderPlanSchema,
	MigrationsMemoryPlanParams: MigrationsMemoryPlanParamsSchema,
	MigrationsMemoryPlanResult: MigrationsMemoryPlanResultSchema,
	MigrationsMemoryApplyParams: MigrationsMemoryApplyParamsSchema,
	MigrationsMemoryApplyResult: typebox.Type.Object({
		providerId: NonEmptyString,
		source: NonEmptyString,
		target: typebox.Type.Optional(NonEmptyString),
		summary: MemoryMigrationSummarySchema,
		items: typebox.Type.Array(MemoryMigrationItemSchema, { maxItems: MAX_MEMORY_MIGRATION_ITEMS }),
		warnings: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
		backupPath: typebox.Type.Optional(NonEmptyString),
		reportDir: typebox.Type.Optional(NonEmptyString)
	}, { additionalProperties: false })
};
//#endregion
//#region packages/gateway-protocol/src/schema/agent.ts
/**
* Agent and channel-action gateway schemas.
*
* These payloads sit on the boundary between external channel adapters, gateway
* RPC callers, and the agent runtime. Keep public request fields documented
* because older CLI/channel clients may continue sending them across releases.
*/
const AGENT_INTERNAL_EVENT_TYPE_TASK_COMPLETION = "task_completion";
const AGENT_INTERNAL_EVENT_SOURCES = [
	"subagent",
	"cron",
	"image_generation",
	"video_generation",
	"music_generation"
];
const AGENT_INTERNAL_EVENT_STATUSES = [
	"ok",
	"timeout",
	"error",
	"unknown"
];
/** Generated media/file attachment metadata carried by internal agent events. */
const AgentGeneratedAttachmentSchema = require_worker_admission.closedObject({
	type: typebox.Type.Optional(typebox.Type.String({ enum: [
		"image",
		"audio",
		"video",
		"file"
	] })),
	path: typebox.Type.Optional(typebox.Type.String()),
	url: typebox.Type.Optional(typebox.Type.String()),
	mediaUrl: typebox.Type.Optional(typebox.Type.String()),
	filePath: typebox.Type.Optional(typebox.Type.String()),
	mimeType: typebox.Type.Optional(typebox.Type.String()),
	name: typebox.Type.Optional(typebox.Type.String())
});
/** Internal completion event surfaced when child automation reports back to a parent run. */
const AgentInternalEventSchema = require_worker_admission.closedObject({
	type: typebox.Type.Literal(AGENT_INTERNAL_EVENT_TYPE_TASK_COMPLETION),
	source: typebox.Type.String({ enum: [...AGENT_INTERNAL_EVENT_SOURCES] }),
	childSessionKey: typebox.Type.String(),
	childSessionId: typebox.Type.Optional(typebox.Type.String()),
	announceType: typebox.Type.String(),
	taskLabel: typebox.Type.String(),
	status: typebox.Type.String({ enum: [...AGENT_INTERNAL_EVENT_STATUSES] }),
	statusLabel: typebox.Type.String(),
	result: typebox.Type.String(),
	attachments: typebox.Type.Optional(typebox.Type.Array(AgentGeneratedAttachmentSchema)),
	mediaUrls: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	statsLine: typebox.Type.Optional(typebox.Type.String()),
	replyInstruction: typebox.Type.String()
});
require_worker_admission.closedObject({
	runId: NonEmptyString,
	seq: typebox.Type.Integer({ minimum: 0 }),
	stream: NonEmptyString,
	ts: typebox.Type.Integer({ minimum: 0 }),
	spawnedBy: typebox.Type.Optional(NonEmptyString),
	isHeartbeat: typebox.Type.Optional(typebox.Type.Boolean()),
	data: typebox.Type.Record(typebox.Type.String(), typebox.Type.Unknown())
});
/** Caller-supplied routing hints. Authorization must use trusted runtime context. */
const MessageActionToolContextSchema = require_worker_admission.closedObject({
	currentChannelId: typebox.Type.Optional(typebox.Type.String()),
	currentMessagingTarget: typebox.Type.Optional(typebox.Type.String()),
	currentGraphChannelId: typebox.Type.Optional(typebox.Type.String()),
	currentChannelProvider: typebox.Type.Optional(typebox.Type.String()),
	currentThreadTs: typebox.Type.Optional(typebox.Type.String()),
	currentMessageId: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Number()])),
	replyToMode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("off"),
		typebox.Type.Literal("first"),
		typebox.Type.Literal("all"),
		typebox.Type.Literal("batched")
	])),
	hasRepliedRef: typebox.Type.Optional(require_worker_admission.closedObject({ value: typebox.Type.Boolean() })),
	sameChannelThreadRequired: typebox.Type.Optional(typebox.Type.Boolean()),
	skipCrossContextDecoration: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Request to execute a channel message action through a configured adapter. */
const MessageActionParamsSchema = require_worker_admission.closedObject({
	channel: NonEmptyString,
	action: NonEmptyString,
	params: typebox.Type.Record(typebox.Type.String(), typebox.Type.Unknown()),
	accountId: typebox.Type.Optional(typebox.Type.String()),
	requesterAccountId: typebox.Type.Optional(typebox.Type.String()),
	requesterSenderId: typebox.Type.Optional(typebox.Type.String()),
	senderIsOwner: typebox.Type.Optional(typebox.Type.Boolean()),
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	sessionId: typebox.Type.Optional(typebox.Type.String()),
	inboundTurnKind: typebox.Type.Optional(typebox.Type.String({ enum: ["user_request", "room_event"] })),
	agentId: typebox.Type.Optional(typebox.Type.String()),
	toolContext: typebox.Type.Optional(MessageActionToolContextSchema),
	/**
	* Explicit operation-local marker for an authenticated direct operator.
	* Missing values remain delegated, and agent runtime identity wins server-side.
	*/
	conversationReadOrigin: typebox.Type.Optional(typebox.Type.Literal("direct-operator")),
	idempotencyKey: NonEmptyString
});
/** Outbound send request shared by channel adapters. */
const SendParamsSchema = require_worker_admission.closedObject({
	to: NonEmptyString,
	message: typebox.Type.Optional(typebox.Type.String()),
	mediaUrl: typebox.Type.Optional(typebox.Type.String()),
	mediaUrls: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	/** Base64 attachment payload for gateway-local media materialization. */
	buffer: typebox.Type.Optional(typebox.Type.String()),
	/** Optional filename for a base64 attachment payload. */
	filename: typebox.Type.Optional(typebox.Type.String()),
	/** Optional MIME type for a base64 attachment payload. */
	contentType: typebox.Type.Optional(typebox.Type.String()),
	asVoice: typebox.Type.Optional(typebox.Type.Boolean()),
	gifPlayback: typebox.Type.Optional(typebox.Type.Boolean()),
	channel: typebox.Type.Optional(typebox.Type.String()),
	accountId: typebox.Type.Optional(typebox.Type.String()),
	/** Optional agent id for per-agent media root resolution on gateway sends. */
	agentId: typebox.Type.Optional(typebox.Type.String()),
	/** Reply target message id for native quoted/threaded sends where supported. */
	replyToId: typebox.Type.Optional(typebox.Type.String()),
	/** Thread id (channel-specific meaning, e.g. Telegram forum topic id). */
	threadId: typebox.Type.Optional(typebox.Type.String()),
	/** Force document-style media sends where supported. */
	forceDocument: typebox.Type.Optional(typebox.Type.Boolean()),
	/** Send silently (no notification) where supported. */
	silent: typebox.Type.Optional(typebox.Type.Boolean()),
	/** Channel-specific parse mode for formatted text. */
	parseMode: typebox.Type.Optional(typebox.Type.Literal("HTML")),
	/** Optional session key for mirroring delivered output back into the transcript. */
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	idempotencyKey: NonEmptyString
});
/** Poll creation request for adapters that support native polls. */
const PollParamsSchema = require_worker_admission.closedObject({
	to: NonEmptyString,
	question: NonEmptyString,
	options: typebox.Type.Array(NonEmptyString, {
		minItems: 2,
		maxItems: 12
	}),
	maxSelections: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 12
	})),
	/** Poll duration in seconds (channel-specific limits may apply). */
	durationSeconds: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 604800
	})),
	durationHours: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	/** Send silently (no notification) where supported. */
	silent: typebox.Type.Optional(typebox.Type.Boolean()),
	/** Poll anonymity where supported (e.g. Telegram polls default to anonymous). */
	isAnonymous: typebox.Type.Optional(typebox.Type.Boolean()),
	/** Thread id (channel-specific meaning, e.g. Telegram forum topic id). */
	threadId: typebox.Type.Optional(typebox.Type.String()),
	channel: typebox.Type.Optional(typebox.Type.String()),
	accountId: typebox.Type.Optional(typebox.Type.String()),
	idempotencyKey: NonEmptyString
});
/** Main agent-run request accepted by the gateway. */
const AgentParamsSchema = require_worker_admission.closedObject({
	message: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	provider: typebox.Type.Optional(typebox.Type.String()),
	model: typebox.Type.Optional(typebox.Type.String()),
	to: typebox.Type.Optional(typebox.Type.String()),
	replyTo: typebox.Type.Optional(typebox.Type.String()),
	sessionId: typebox.Type.Optional(typebox.Type.String()),
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	expectedExistingSessionId: typebox.Type.Optional(NonEmptyString),
	thinking: typebox.Type.Optional(typebox.Type.String()),
	deliver: typebox.Type.Optional(typebox.Type.Boolean()),
	attachments: typebox.Type.Optional(typebox.Type.Array(typebox.Type.Unknown())),
	channel: typebox.Type.Optional(typebox.Type.String()),
	replyChannel: typebox.Type.Optional(typebox.Type.String()),
	accountId: typebox.Type.Optional(typebox.Type.String()),
	replyAccountId: typebox.Type.Optional(typebox.Type.String()),
	threadId: typebox.Type.Optional(typebox.Type.String()),
	groupId: typebox.Type.Optional(typebox.Type.String()),
	groupChannel: typebox.Type.Optional(typebox.Type.String()),
	groupSpace: typebox.Type.Optional(typebox.Type.String()),
	timeout: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	bestEffortDeliver: typebox.Type.Optional(typebox.Type.Boolean()),
	lane: typebox.Type.Optional(typebox.Type.String()),
	cwd: typebox.Type.Optional(NonEmptyString),
	cleanupBundleMcpOnRunEnd: typebox.Type.Optional(typebox.Type.Boolean()),
	modelRun: typebox.Type.Optional(typebox.Type.Boolean()),
	promptMode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("full"),
		typebox.Type.Literal("minimal"),
		typebox.Type.Literal("none")
	])),
	extraSystemPrompt: typebox.Type.Optional(typebox.Type.String()),
	bootstrapContextMode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("full"), typebox.Type.Literal("lightweight")])),
	bootstrapContextRunKind: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("default"),
		typebox.Type.Literal("heartbeat"),
		typebox.Type.Literal("cron")
	])),
	acpTurnSource: typebox.Type.Optional(typebox.Type.Literal("manual_spawn")),
	internalRuntimeHandoffId: typebox.Type.Optional(NonEmptyString),
	execApprovalFollowupExpectedSessionId: typebox.Type.Optional(NonEmptyString),
	internalEvents: typebox.Type.Optional(typebox.Type.Array(AgentInternalEventSchema)),
	inputProvenance: typebox.Type.Optional(InputProvenanceSchema),
	suppressPromptPersistence: typebox.Type.Optional(typebox.Type.Boolean()),
	sessionEffects: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("visible"), typebox.Type.Literal("internal")])),
	sourceReplyDeliveryMode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("automatic"), typebox.Type.Literal("message_tool_only")])),
	disableMessageTool: typebox.Type.Optional(typebox.Type.Boolean()),
	forceRestartSafeTools: typebox.Type.Optional(typebox.Type.Boolean()),
	voiceWakeTrigger: typebox.Type.Optional(typebox.Type.String()),
	idempotencyKey: NonEmptyString,
	label: typebox.Type.Optional(SessionLabelString)
});
/** Identity lookup request for the current or selected agent/session. */
const AgentIdentityParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	agentId: NonEmptyString,
	name: typebox.Type.Optional(NonEmptyString),
	avatar: typebox.Type.Optional(NonEmptyString),
	avatarSource: typebox.Type.Optional(NonEmptyString),
	avatarStatus: typebox.Type.Optional(typebox.Type.String({ enum: [
		"none",
		"local",
		"remote",
		"data"
	] })),
	avatarReason: typebox.Type.Optional(NonEmptyString),
	emoji: typebox.Type.Optional(NonEmptyString)
});
/** Waits for a submitted agent run to complete or time out. */
const AgentWaitParamsSchema = require_worker_admission.closedObject({
	runId: NonEmptyString,
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/** Wake request from external schedulers or devices into an agent session. */
const WakeParamsSchema = typebox.Type.Object({
	mode: typebox.Type.Union([typebox.Type.Literal("now"), typebox.Type.Literal("next-heartbeat")]),
	text: NonEmptyString,
	sessionKey: typebox.Type.Optional(NonEmptyString),
	/**
	* Optional agent id paired with `sessionKey`. Routes multi-agent setups
	* to the agent that owns the targeted session — closes the related half
	* of #46886 ("always routes to default agent").
	*/
	agentId: typebox.Type.Optional(NonEmptyString)
}, { additionalProperties: true });
//#endregion
//#region packages/gateway-protocol/src/schema/agents-models-skills.ts
/**
* Agent, model, skill, and tool catalog schemas.
*
* These contracts back dashboard selectors, agent management, model catalogs,
* skill upload/install flows, skill workshop proposals, and effective tool
* discovery. Keep public request/result schemas documented because they are
* shared by gateway RPC, CLI, and UI clients.
*/
/** Model option shown in selectors and model catalog results. */
const GatewayAgentRuntimeSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	fallback: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("openclaw"), typebox.Type.Literal("none")])),
	source: typebox.Type.Union([
		typebox.Type.Literal("env"),
		typebox.Type.Literal("agent"),
		typebox.Type.Literal("defaults"),
		typebox.Type.Literal("model"),
		typebox.Type.Literal("provider"),
		typebox.Type.Literal("implicit"),
		typebox.Type.Literal("session"),
		typebox.Type.Literal("session-key")
	])
});
const ModelChoiceSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	name: NonEmptyString,
	provider: NonEmptyString,
	alias: typebox.Type.Optional(NonEmptyString),
	available: typebox.Type.Optional(typebox.Type.Boolean()),
	contextWindow: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	reasoning: typebox.Type.Optional(typebox.Type.Boolean()),
	agentRuntime: typebox.Type.Optional(GatewayAgentRuntimeSchema),
	apiKeySupported: typebox.Type.Optional(typebox.Type.Boolean()),
	input: typebox.Type.Optional(typebox.Type.Array(typebox.Type.Union([
		typebox.Type.Literal("text"),
		typebox.Type.Literal("image"),
		typebox.Type.Literal("audio"),
		typebox.Type.Literal("video"),
		typebox.Type.Literal("document")
	])))
});
/** Condensed agent record returned by list APIs. */
const AgentSummarySchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	name: typebox.Type.Optional(NonEmptyString),
	identity: typebox.Type.Optional(require_worker_admission.closedObject({
		name: typebox.Type.Optional(NonEmptyString),
		theme: typebox.Type.Optional(NonEmptyString),
		emoji: typebox.Type.Optional(NonEmptyString),
		avatar: typebox.Type.Optional(NonEmptyString),
		avatarUrl: typebox.Type.Optional(NonEmptyString)
	})),
	workspace: typebox.Type.Optional(NonEmptyString),
	workspaceGit: typebox.Type.Optional(typebox.Type.Boolean()),
	model: typebox.Type.Optional(require_worker_admission.closedObject({
		primary: typebox.Type.Optional(NonEmptyString),
		fallbacks: typebox.Type.Optional(typebox.Type.Array(NonEmptyString))
	})),
	agentRuntime: typebox.Type.Optional(GatewayAgentRuntimeSchema),
	thinkingLevels: typebox.Type.Optional(typebox.Type.Array(require_worker_admission.closedObject({
		id: NonEmptyString,
		label: NonEmptyString
	}))),
	thinkingOptions: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	thinkingDefault: typebox.Type.Optional(NonEmptyString)
});
/** Empty request payload for listing configured agents. */
const AgentsListParamsSchema = require_worker_admission.closedObject({});
require_worker_admission.closedObject({
	defaultId: NonEmptyString,
	mainKey: NonEmptyString,
	scope: typebox.Type.Union([typebox.Type.Literal("per-sender"), typebox.Type.Literal("global")]),
	agents: typebox.Type.Array(AgentSummarySchema)
});
/** Creates a configured agent with workspace, identity, and optional model. */
const AgentsCreateParamsSchema = require_worker_admission.closedObject({
	name: NonEmptyString,
	workspace: NonEmptyString,
	model: typebox.Type.Optional(NonEmptyString),
	emoji: typebox.Type.Optional(typebox.Type.String()),
	avatar: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	agentId: NonEmptyString,
	name: NonEmptyString,
	workspace: NonEmptyString,
	model: typebox.Type.Optional(NonEmptyString)
});
/** Updates mutable agent identity, workspace, and model fields. */
const AgentsUpdateParamsSchema = require_worker_admission.closedObject({
	agentId: NonEmptyString,
	name: typebox.Type.Optional(NonEmptyString),
	workspace: typebox.Type.Optional(NonEmptyString),
	model: typebox.Type.Optional(NonEmptyString),
	emoji: typebox.Type.Optional(typebox.Type.String()),
	avatar: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	agentId: NonEmptyString
});
/** Deletes an agent and optionally its workspace/config files. */
const AgentsDeleteParamsSchema = require_worker_admission.closedObject({
	agentId: NonEmptyString,
	deleteFiles: typebox.Type.Optional(typebox.Type.Boolean())
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	agentId: NonEmptyString,
	removedBindings: typebox.Type.Integer({ minimum: 0 })
});
/** File metadata and optional content for agent-local editable files. */
const AgentsFileEntrySchema = require_worker_admission.closedObject({
	name: NonEmptyString,
	path: NonEmptyString,
	missing: typebox.Type.Boolean(),
	size: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	updatedAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	content: typebox.Type.Optional(typebox.Type.String())
});
/** Lists editable files for one agent. */
const AgentsFilesListParamsSchema = require_worker_admission.closedObject({ agentId: NonEmptyString });
require_worker_admission.closedObject({
	agentId: NonEmptyString,
	workspace: NonEmptyString,
	files: typebox.Type.Array(AgentsFileEntrySchema)
});
/** Reads one editable agent file by name. */
const AgentsFilesGetParamsSchema = require_worker_admission.closedObject({
	agentId: NonEmptyString,
	name: NonEmptyString
});
require_worker_admission.closedObject({
	agentId: NonEmptyString,
	workspace: NonEmptyString,
	file: AgentsFileEntrySchema
});
/** Writes one editable agent file. */
const AgentsFilesSetParamsSchema = require_worker_admission.closedObject({
	agentId: NonEmptyString,
	name: NonEmptyString,
	content: typebox.Type.String()
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	agentId: NonEmptyString,
	workspace: NonEmptyString,
	file: AgentsFileEntrySchema
});
/** Model catalog request with optional visibility scope. */
const ModelsListParamsSchema = require_worker_admission.closedObject({
	includeProviderCapabilities: typebox.Type.Optional(typebox.Type.Boolean()),
	view: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("default"),
		typebox.Type.Literal("configured"),
		typebox.Type.Literal("provider-config"),
		typebox.Type.Literal("all")
	]))
});
require_worker_admission.closedObject({ models: typebox.Type.Array(ModelChoiceSchema) });
/** Runs a bounded live credential probe for one model provider. */
const ModelsProbeParamsSchema = require_worker_admission.closedObject({
	provider: NonEmptyString,
	profileId: typebox.Type.Optional(NonEmptyString),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 }))
});
const AuthProbeStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("ok"),
	typebox.Type.Literal("auth"),
	typebox.Type.Literal("rate_limit"),
	typebox.Type.Literal("billing"),
	typebox.Type.Literal("timeout"),
	typebox.Type.Literal("format"),
	typebox.Type.Literal("unknown"),
	typebox.Type.Literal("no_model")
]);
/** Secret-free result for one provider credential target. */
const ModelsProbeTargetResultSchema = require_worker_admission.closedObject({
	profileId: typebox.Type.Optional(NonEmptyString),
	label: NonEmptyString,
	status: AuthProbeStatusSchema,
	latencyMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	error: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	provider: NonEmptyString,
	status: AuthProbeStatusSchema,
	latencyMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	error: typebox.Type.Optional(typebox.Type.String()),
	results: typebox.Type.Array(ModelsProbeTargetResultSchema)
});
/** Reads installed skill status, optionally for a selected agent. */
const SkillsStatusParamsSchema = require_worker_admission.closedObject({ agentId: typebox.Type.Optional(NonEmptyString) });
/** Empty request payload for listing available skill bins. */
const SkillsBinsParamsSchema = require_worker_admission.closedObject({});
require_worker_admission.closedObject({ bins: typebox.Type.Array(NonEmptyString) });
const Sha256String = typebox.Type.String({
	minLength: 64,
	maxLength: 64,
	pattern: "^[a-fA-F0-9]{64}$"
});
const SkillUploadIdempotencyKeyString = typebox.Type.String({
	minLength: 1,
	maxLength: 2048
});
const SkillUploadDataBase64String = typebox.Type.String({
	minLength: 1,
	maxLength: 5592408
});
/** Starts a chunked skill archive upload. */
const SkillsUploadBeginParamsSchema = require_worker_admission.closedObject({
	kind: typebox.Type.Literal("skill-archive"),
	slug: NonEmptyString,
	sizeBytes: typebox.Type.Integer({ minimum: 1 }),
	sha256: typebox.Type.Optional(Sha256String),
	force: typebox.Type.Optional(typebox.Type.Boolean()),
	idempotencyKey: typebox.Type.Optional(SkillUploadIdempotencyKeyString)
});
/** Uploads one base64-encoded chunk for a skill archive. */
const SkillsUploadChunkParamsSchema = require_worker_admission.closedObject({
	uploadId: NonEmptyString,
	offset: typebox.Type.Integer({ minimum: 0 }),
	dataBase64: SkillUploadDataBase64String
});
/** Commits a completed skill archive upload. */
const SkillsUploadCommitParamsSchema = require_worker_admission.closedObject({
	uploadId: NonEmptyString,
	sha256: typebox.Type.Optional(Sha256String)
});
/** Installs a skill from legacy install id, ClawHub, or uploaded archive. */
const SkillsInstallParamsSchema = typebox.Type.Union([
	require_worker_admission.closedObject({
		agentId: typebox.Type.Optional(NonEmptyString),
		name: NonEmptyString,
		installId: NonEmptyString,
		dangerouslyForceUnsafeInstall: typebox.Type.Optional(typebox.Type.Boolean({
			deprecated: true,
			description: "Deprecated compatibility field. Current servers ignore it; install policy is controlled by security.installPolicy."
		})),
		timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1e3 }))
	}),
	require_worker_admission.closedObject({
		agentId: typebox.Type.Optional(NonEmptyString),
		source: typebox.Type.Literal("clawhub"),
		slug: NonEmptyString,
		version: typebox.Type.Optional(NonEmptyString),
		force: typebox.Type.Optional(typebox.Type.Boolean()),
		acknowledgeClawHubRisk: typebox.Type.Optional(typebox.Type.Boolean()),
		timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1e3 }))
	}),
	require_worker_admission.closedObject({
		agentId: typebox.Type.Optional(NonEmptyString),
		source: typebox.Type.Literal("upload"),
		uploadId: NonEmptyString,
		slug: NonEmptyString,
		force: typebox.Type.Optional(typebox.Type.Boolean()),
		sha256: typebox.Type.Optional(Sha256String),
		timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1e3 }))
	})
]);
/** Updates installed skill settings or refreshes ClawHub-installed skills. */
const SkillsUpdateParamsSchema = typebox.Type.Union([require_worker_admission.closedObject({
	skillKey: NonEmptyString,
	enabled: typebox.Type.Optional(typebox.Type.Boolean()),
	apiKey: typebox.Type.Optional(typebox.Type.String()),
	env: typebox.Type.Optional(typebox.Type.Record(NonEmptyString, typebox.Type.String()))
}), require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	source: typebox.Type.Literal("clawhub"),
	slug: typebox.Type.Optional(NonEmptyString),
	all: typebox.Type.Optional(typebox.Type.Boolean()),
	acknowledgeClawHubRisk: typebox.Type.Optional(typebox.Type.Boolean())
})]);
/** Searches the skill registry. */
const SkillsSearchParamsSchema = require_worker_admission.closedObject({
	query: typebox.Type.Optional(NonEmptyString),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 100
	}))
});
require_worker_admission.closedObject({ results: typebox.Type.Array(require_worker_admission.closedObject({
	score: typebox.Type.Number(),
	slug: NonEmptyString,
	displayName: NonEmptyString,
	summary: typebox.Type.Optional(typebox.Type.String()),
	version: typebox.Type.Optional(NonEmptyString),
	updatedAt: typebox.Type.Optional(typebox.Type.Integer())
})) });
/** Reads registry detail for one skill slug. */
const SkillsDetailParamsSchema = require_worker_admission.closedObject({ slug: NonEmptyString });
/** Reads current security verdicts for configured skills. */
const SkillsSecurityVerdictsParamsSchema = require_worker_admission.closedObject({ agentId: typebox.Type.Optional(NonEmptyString) });
require_worker_admission.closedObject({
	skill: typebox.Type.Union([require_worker_admission.closedObject({
		slug: NonEmptyString,
		displayName: NonEmptyString,
		summary: typebox.Type.Optional(typebox.Type.String()),
		tags: typebox.Type.Optional(typebox.Type.Record(NonEmptyString, typebox.Type.String())),
		channel: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		isOfficial: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Boolean(), typebox.Type.Null()])),
		createdAt: typebox.Type.Integer(),
		updatedAt: typebox.Type.Integer()
	}), typebox.Type.Null()]),
	latestVersion: typebox.Type.Optional(typebox.Type.Union([require_worker_admission.closedObject({
		version: NonEmptyString,
		createdAt: typebox.Type.Integer(),
		changelog: typebox.Type.Optional(typebox.Type.String())
	}), typebox.Type.Null()])),
	metadata: typebox.Type.Optional(typebox.Type.Union([require_worker_admission.closedObject({
		os: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Array(typebox.Type.String()), typebox.Type.Null()])),
		systems: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Array(typebox.Type.String()), typebox.Type.Null()]))
	}), typebox.Type.Null()])),
	owner: typebox.Type.Optional(typebox.Type.Union([require_worker_admission.closedObject({
		handle: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
		displayName: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
		image: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		official: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Boolean(), typebox.Type.Null()])),
		channel: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		isOfficial: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Boolean(), typebox.Type.Null()]))
	}), typebox.Type.Null()]))
});
require_worker_admission.closedObject({
	schema: typebox.Type.Literal("openclaw.skills.security-verdicts.v1"),
	items: typebox.Type.Array(require_worker_admission.closedObject({
		registry: NonEmptyString,
		ok: typebox.Type.Boolean(),
		decision: NonEmptyString,
		reasons: typebox.Type.Array(typebox.Type.String()),
		requestedSlug: NonEmptyString,
		requestedVersion: NonEmptyString,
		slug: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
		version: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
		displayName: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		publisherHandle: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		publisherDisplayName: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		createdAt: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Integer(), typebox.Type.Null()])),
		checkedAt: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Integer(), typebox.Type.Null()])),
		skillUrl: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		securityAuditUrl: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		securityStatus: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		securityPassed: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Boolean(), typebox.Type.Null()])),
		error: typebox.Type.Optional(require_worker_admission.closedObject({
			code: typebox.Type.Optional(typebox.Type.String()),
			message: typebox.Type.Optional(typebox.Type.String())
		}))
	}))
});
/** Reads the rendered skill card for one installed skill. */
const SkillsSkillCardParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	skillKey: NonEmptyString
});
require_worker_admission.closedObject({
	schema: typebox.Type.Literal("openclaw.skills.skill-card.v1"),
	skillKey: NonEmptyString,
	path: NonEmptyString,
	sizeBytes: typebox.Type.Integer({ minimum: 0 }),
	content: typebox.Type.String()
});
const SkillProposalStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("pending"),
	typebox.Type.Literal("applied"),
	typebox.Type.Literal("rejected"),
	typebox.Type.Literal("quarantined"),
	typebox.Type.Literal("stale")
]);
/** Skill proposal operation type: new skill or update to an existing skill. */
const SkillProposalKindSchema = typebox.Type.Union([typebox.Type.Literal("create"), typebox.Type.Literal("update")]);
/** Scan state for proposed skill content before it can be applied. */
const SkillProposalScanStateSchema = typebox.Type.Union([
	typebox.Type.Literal("pending"),
	typebox.Type.Literal("clean"),
	typebox.Type.Literal("failed"),
	typebox.Type.Literal("quarantined")
]);
/** Source that created the skill proposal record. */
const SkillProposalSourceSchema = typebox.Type.Union([
	typebox.Type.Literal("skill-workshop"),
	typebox.Type.Literal("cli"),
	typebox.Type.Literal("gateway")
]);
const SkillProposalContentString = typebox.Type.String({
	minLength: 1,
	maxLength: 1048576
});
/** Support file payload accepted from proposal create/revise requests. */
const SkillProposalSupportFileInputSchema = require_worker_admission.closedObject({
	path: NonEmptyString,
	content: typebox.Type.String({ maxLength: 262144 })
});
/** Stored support file metadata, including target conflict hashes for updates. */
const SkillProposalSupportFileSchema = require_worker_admission.closedObject({
	path: NonEmptyString,
	sizeBytes: typebox.Type.Integer({
		minimum: 0,
		maximum: 262144
	}),
	hash: Sha256String,
	targetExisted: typebox.Type.Optional(typebox.Type.Boolean()),
	targetContentHash: typebox.Type.Optional(Sha256String)
});
/** One static-scan finding against proposed skill content. */
const SkillProposalFindingSchema = require_worker_admission.closedObject({
	ruleId: NonEmptyString,
	severity: typebox.Type.Union([
		typebox.Type.Literal("info"),
		typebox.Type.Literal("warn"),
		typebox.Type.Literal("critical")
	]),
	file: NonEmptyString,
	line: typebox.Type.Integer({ minimum: 1 }),
	message: NonEmptyString,
	evidence: typebox.Type.String()
});
/** Aggregated scan report attached to a proposal record. */
const SkillProposalScanSchema = require_worker_admission.closedObject({
	state: SkillProposalScanStateSchema,
	scannedAt: NonEmptyString,
	critical: typebox.Type.Integer({ minimum: 0 }),
	warn: typebox.Type.Integer({ minimum: 0 }),
	info: typebox.Type.Integer({ minimum: 0 }),
	findings: typebox.Type.Array(SkillProposalFindingSchema)
});
/** Skill file target that a proposal creates or updates. */
const SkillProposalTargetSchema = require_worker_admission.closedObject({
	skillName: NonEmptyString,
	skillKey: NonEmptyString,
	skillDir: NonEmptyString,
	skillFile: NonEmptyString,
	source: typebox.Type.Optional(NonEmptyString),
	currentContentHash: typebox.Type.Optional(NonEmptyString)
});
/** Optional runtime origin tying a proposal back to an agent turn. */
const SkillProposalOriginSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	messageId: typebox.Type.Optional(NonEmptyString)
});
/** Full persisted skill proposal record. */
const SkillProposalRecordSchema = require_worker_admission.closedObject({
	schema: typebox.Type.Literal("openclaw.skill-workshop.proposal.v1"),
	id: NonEmptyString,
	kind: SkillProposalKindSchema,
	status: SkillProposalStatusSchema,
	title: NonEmptyString,
	description: NonEmptyString,
	createdAt: NonEmptyString,
	updatedAt: NonEmptyString,
	createdBy: SkillProposalSourceSchema,
	origin: typebox.Type.Optional(SkillProposalOriginSchema),
	proposedVersion: NonEmptyString,
	draftFile: typebox.Type.Literal("PROPOSAL.md"),
	draftHash: NonEmptyString,
	supportFiles: typebox.Type.Optional(typebox.Type.Array(SkillProposalSupportFileSchema, { maxItems: 64 })),
	target: SkillProposalTargetSchema,
	scan: SkillProposalScanSchema,
	goal: typebox.Type.Optional(typebox.Type.String()),
	evidence: typebox.Type.Optional(typebox.Type.String()),
	appliedAt: typebox.Type.Optional(NonEmptyString),
	rejectedAt: typebox.Type.Optional(NonEmptyString),
	quarantinedAt: typebox.Type.Optional(NonEmptyString),
	staleAt: typebox.Type.Optional(NonEmptyString),
	statusReason: typebox.Type.Optional(typebox.Type.String())
});
/** Condensed proposal manifest entry for list views. */
const SkillProposalManifestEntrySchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	kind: SkillProposalKindSchema,
	status: SkillProposalStatusSchema,
	title: NonEmptyString,
	description: NonEmptyString,
	skillName: NonEmptyString,
	skillKey: NonEmptyString,
	createdAt: NonEmptyString,
	updatedAt: NonEmptyString,
	scanState: SkillProposalScanStateSchema
});
/** Lists skill-workshop proposals for the selected agent scope. */
const SkillsProposalsListParamsSchema = require_worker_admission.closedObject({ agentId: typebox.Type.Optional(NonEmptyString) });
/** Proposal manifest response for dashboard/workshop list views. */
const SkillsProposalsListResultSchema = require_worker_admission.closedObject({
	schema: typebox.Type.Literal("openclaw.skill-workshop.proposals-manifest.v1"),
	updatedAt: NonEmptyString,
	proposals: typebox.Type.Array(SkillProposalManifestEntrySchema)
});
/** Reads a proposal record plus editable draft/support content. */
const SkillsProposalInspectParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	proposalId: NonEmptyString
});
require_worker_admission.closedObject({
	record: SkillProposalRecordSchema,
	content: typebox.Type.String(),
	supportFiles: typebox.Type.Optional(typebox.Type.Array(SkillProposalSupportFileInputSchema, { maxItems: 64 }))
});
/** Creates a proposal for a new skill. */
const SkillsProposalCreateParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	name: NonEmptyString,
	description: NonEmptyString,
	content: SkillProposalContentString,
	supportFiles: typebox.Type.Optional(typebox.Type.Array(SkillProposalSupportFileInputSchema, { maxItems: 64 })),
	goal: typebox.Type.Optional(typebox.Type.String()),
	evidence: typebox.Type.Optional(typebox.Type.String())
});
/** Creates a proposal to update an existing skill. */
const SkillsProposalUpdateParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	skillName: NonEmptyString,
	description: typebox.Type.Optional(NonEmptyString),
	content: SkillProposalContentString,
	supportFiles: typebox.Type.Optional(typebox.Type.Array(SkillProposalSupportFileInputSchema, { maxItems: 64 })),
	goal: typebox.Type.Optional(typebox.Type.String()),
	evidence: typebox.Type.Optional(typebox.Type.String())
});
/** Replaces draft content/support files for an existing proposal. */
const SkillsProposalReviseParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	proposalId: NonEmptyString,
	content: SkillProposalContentString,
	supportFiles: typebox.Type.Optional(typebox.Type.Array(SkillProposalSupportFileInputSchema, { maxItems: 64 })),
	description: typebox.Type.Optional(NonEmptyString),
	goal: typebox.Type.Optional(typebox.Type.String()),
	evidence: typebox.Type.Optional(typebox.Type.String())
});
/** Starts an agent turn that revises a pending proposal from natural-language instructions. */
const SkillsProposalRequestRevisionParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	targetAgentId: typebox.Type.Optional(NonEmptyString),
	proposalId: NonEmptyString,
	instructions: typebox.Type.String({
		minLength: 1,
		maxLength: 32768
	}),
	sessionKey: NonEmptyString,
	sessionId: typebox.Type.Optional(NonEmptyString),
	idempotencyKey: NonEmptyString
});
typebox.Type.Object({
	runId: NonEmptyString,
	status: typebox.Type.Union([
		typebox.Type.Literal("started"),
		typebox.Type.Literal("in_flight"),
		typebox.Type.Literal("ok"),
		typebox.Type.Literal("timeout"),
		typebox.Type.Literal("error")
	])
}, { additionalProperties: true });
/** Shared approve/reject/quarantine action payload for one proposal. */
const SkillsProposalActionParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	proposalId: NonEmptyString,
	reason: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	record: SkillProposalRecordSchema,
	targetSkillFile: NonEmptyString
});
const SkillCuratorEntrySchema = require_worker_admission.closedObject({
	skillFile: NonEmptyString,
	skillKey: NonEmptyString,
	skillName: NonEmptyString,
	state: typebox.Type.Union([
		typebox.Type.Literal("active"),
		typebox.Type.Literal("stale"),
		typebox.Type.Literal("archived")
	]),
	pinned: typebox.Type.Boolean(),
	createdAtMs: typebox.Type.Number(),
	stateChangedAtMs: typebox.Type.Number(),
	lastUsedAtMs: typebox.Type.Union([typebox.Type.Number(), typebox.Type.Null()]),
	useCount: typebox.Type.Number(),
	archivedReason: typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])
});
const SkillOverlapCandidateSchema = require_worker_admission.closedObject({
	left: NonEmptyString,
	right: NonEmptyString,
	score: typebox.Type.Number()
});
/** Reads persisted skill lifecycle curation state. */
const SkillsCuratorStatusParamsSchema = require_worker_admission.closedObject({});
require_worker_admission.closedObject({
	lastAttemptAtMs: typebox.Type.Union([typebox.Type.Number(), typebox.Type.Null()]),
	lastSuccessAtMs: typebox.Type.Union([typebox.Type.Number(), typebox.Type.Null()]),
	lastError: typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()]),
	counts: require_worker_admission.closedObject({
		active: typebox.Type.Number(),
		stale: typebox.Type.Number(),
		archived: typebox.Type.Number()
	}),
	skills: typebox.Type.Array(SkillCuratorEntrySchema),
	overlaps: typebox.Type.Array(SkillOverlapCandidateSchema)
});
/** Pins, unpins, or explicitly restores one curated skill. */
const SkillsCuratorActionParamsSchema = require_worker_admission.closedObject({ skill: NonEmptyString });
/** Reads the configured tool catalog for an agent. */
const ToolsCatalogParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	includePlugins: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Reads the effective tool set for one session. */
const ToolsEffectiveParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKey: NonEmptyString
});
/** Invokes one tool through the gateway tool dispatcher. */
const ToolsInvokeParamsSchema = require_worker_admission.closedObject({
	name: NonEmptyString,
	args: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), typebox.Type.Unknown())),
	sessionKey: typebox.Type.Optional(NonEmptyString),
	agentId: typebox.Type.Optional(NonEmptyString),
	confirm: typebox.Type.Optional(typebox.Type.Boolean()),
	idempotencyKey: typebox.Type.Optional(NonEmptyString),
	/**
	* Explicit operation-local marker for an authenticated direct operator.
	* Missing values remain delegated, and agent runtime identity wins server-side.
	*/
	conversationReadOrigin: typebox.Type.Optional(typebox.Type.Literal("direct-operator"))
});
/** Tool profile shown in catalog views. */
const ToolCatalogProfileSchema = require_worker_admission.closedObject({
	id: typebox.Type.Union([
		typebox.Type.Literal("minimal"),
		typebox.Type.Literal("coding"),
		typebox.Type.Literal("messaging"),
		typebox.Type.Literal("full")
	]),
	label: NonEmptyString
});
/** Tool catalog entry before session-specific filtering is applied. */
const ToolCatalogEntrySchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	label: NonEmptyString,
	description: typebox.Type.String(),
	source: typebox.Type.Union([typebox.Type.Literal("core"), typebox.Type.Literal("plugin")]),
	pluginId: typebox.Type.Optional(NonEmptyString),
	optional: typebox.Type.Optional(typebox.Type.Boolean()),
	risk: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("low"),
		typebox.Type.Literal("medium"),
		typebox.Type.Literal("high")
	])),
	tags: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	defaultProfiles: typebox.Type.Array(typebox.Type.Union([
		typebox.Type.Literal("minimal"),
		typebox.Type.Literal("coding"),
		typebox.Type.Literal("messaging"),
		typebox.Type.Literal("full")
	]))
});
/** Group of related catalog tools from core or a plugin. */
const ToolCatalogGroupSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	label: NonEmptyString,
	source: typebox.Type.Union([typebox.Type.Literal("core"), typebox.Type.Literal("plugin")]),
	pluginId: typebox.Type.Optional(NonEmptyString),
	tools: typebox.Type.Array(ToolCatalogEntrySchema)
});
require_worker_admission.closedObject({
	agentId: NonEmptyString,
	profiles: typebox.Type.Array(ToolCatalogProfileSchema),
	groups: typebox.Type.Array(ToolCatalogGroupSchema)
});
/** Effective tool entry after session/profile/channel/plugin filtering. */
const ToolsEffectiveEntrySchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	label: NonEmptyString,
	description: typebox.Type.String(),
	rawDescription: typebox.Type.String(),
	source: typebox.Type.Union([
		typebox.Type.Literal("core"),
		typebox.Type.Literal("plugin"),
		typebox.Type.Literal("channel"),
		typebox.Type.Literal("mcp")
	]),
	pluginId: typebox.Type.Optional(NonEmptyString),
	channelId: typebox.Type.Optional(NonEmptyString),
	risk: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("low"),
		typebox.Type.Literal("medium"),
		typebox.Type.Literal("high")
	])),
	tags: typebox.Type.Optional(typebox.Type.Array(NonEmptyString))
});
/** Effective tool group shown to runtime/session callers. */
const ToolsEffectiveGroupSchema = require_worker_admission.closedObject({
	id: typebox.Type.Union([
		typebox.Type.Literal("core"),
		typebox.Type.Literal("plugin"),
		typebox.Type.Literal("channel"),
		typebox.Type.Literal("mcp")
	]),
	label: NonEmptyString,
	source: typebox.Type.Union([
		typebox.Type.Literal("core"),
		typebox.Type.Literal("plugin"),
		typebox.Type.Literal("channel"),
		typebox.Type.Literal("mcp")
	]),
	tools: typebox.Type.Array(ToolsEffectiveEntrySchema)
});
/** Notice explaining runtime filtering such as quarantined tool schemas. */
const ToolsEffectiveNoticeSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	severity: typebox.Type.Union([typebox.Type.Literal("info"), typebox.Type.Literal("warning")]),
	message: typebox.Type.String()
});
require_worker_admission.closedObject({
	agentId: NonEmptyString,
	profile: NonEmptyString,
	groups: typebox.Type.Array(ToolsEffectiveGroupSchema),
	notices: typebox.Type.Optional(typebox.Type.Array(ToolsEffectiveNoticeSchema))
});
/** Normalized error shape for tool invocation failures. */
const ToolsInvokeErrorSchema = require_worker_admission.closedObject({
	code: NonEmptyString,
	message: NonEmptyString,
	details: typebox.Type.Optional(typebox.Type.Unknown())
});
require_worker_admission.closedObject({
	ok: typebox.Type.Boolean(),
	toolName: NonEmptyString,
	output: typebox.Type.Optional(typebox.Type.Unknown()),
	requiresApproval: typebox.Type.Optional(typebox.Type.Boolean()),
	approvalId: typebox.Type.Optional(NonEmptyString),
	source: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("core"),
		typebox.Type.Literal("plugin"),
		typebox.Type.Literal("mcp"),
		typebox.Type.Literal("channel"),
		typebox.Type.String()
	])),
	error: typebox.Type.Optional(ToolsInvokeErrorSchema)
});
//#endregion
//#region packages/gateway-protocol/src/schema/agents-workspace.ts
/**
* Read-only agent workspace browsing schemas.
*
* These contracts back the workspace file browser in operator clients
* (mobile apps, Control UI). The surface is intentionally read-only:
* write/delete/upload stay out of this namespace until a separately
* reviewed mutation contract exists.
*/
/** One file or folder in an agent workspace directory listing. */
const AgentsWorkspaceEntrySchema = require_worker_admission.closedObject({
	path: NonEmptyString,
	name: NonEmptyString,
	kind: typebox.Type.Union([typebox.Type.Literal("file"), typebox.Type.Literal("directory")]),
	size: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	updatedAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/** Lists one directory of an agent workspace. */
const AgentsWorkspaceListParamsSchema = require_worker_admission.closedObject({
	agentId: NonEmptyString,
	path: typebox.Type.Optional(typebox.Type.String()),
	offset: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	limit: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 }))
});
require_worker_admission.closedObject({
	agentId: NonEmptyString,
	path: typebox.Type.String(),
	parentPath: typebox.Type.Optional(typebox.Type.String()),
	entries: typebox.Type.Array(AgentsWorkspaceEntrySchema),
	totalEntries: typebox.Type.Integer({ minimum: 0 }),
	offset: typebox.Type.Integer({ minimum: 0 })
});
/** One workspace file preview payload (UTF-8 text or base64 image). */
const AgentsWorkspaceFileSchema = require_worker_admission.closedObject({
	path: NonEmptyString,
	name: NonEmptyString,
	size: typebox.Type.Integer({ minimum: 0 }),
	updatedAtMs: typebox.Type.Integer({ minimum: 0 }),
	mimeType: NonEmptyString,
	encoding: typebox.Type.Union([typebox.Type.Literal("utf8"), typebox.Type.Literal("base64")]),
	content: typebox.Type.String()
});
/** Reads one workspace file by workspace-relative path. */
const AgentsWorkspaceGetParamsSchema = require_worker_admission.closedObject({
	agentId: NonEmptyString,
	path: NonEmptyString
});
require_worker_admission.closedObject({
	agentId: NonEmptyString,
	file: AgentsWorkspaceFileSchema
});
//#endregion
//#region packages/gateway-protocol/src/schema/artifacts.ts
/**
* Artifact lookup and download protocol schemas.
*
* Artifacts are files or payloads produced by sessions, runs, tasks, or agents;
* these schemas keep lookup filters explicit and download results transport-safe.
*/
const ArtifactQueryParamsProperties = {
	sessionKey: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	taskId: typebox.Type.Optional(NonEmptyString),
	agentId: typebox.Type.Optional(NonEmptyString)
};
/** Shared artifact filter payload used by list-style requests. */
const ArtifactQueryParamsSchema = require_worker_admission.closedObject(ArtifactQueryParamsProperties);
/** Artifact lookup payload with a required artifact id plus optional scope filters. */
const ArtifactGetParamsSchema = require_worker_admission.closedObject({
	...ArtifactQueryParamsProperties,
	artifactId: NonEmptyString
});
/** Public artifact metadata returned before or alongside download data. */
const ArtifactSummarySchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	type: NonEmptyString,
	title: NonEmptyString,
	mimeType: typebox.Type.Optional(NonEmptyString),
	sizeBytes: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	sessionKey: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	taskId: typebox.Type.Optional(NonEmptyString),
	messageSeq: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	source: typebox.Type.Optional(NonEmptyString),
	download: require_worker_admission.closedObject({ mode: typebox.Type.Union([
		typebox.Type.Literal("bytes"),
		typebox.Type.Literal("url"),
		typebox.Type.Literal("unsupported")
	]) })
});
/** List request payload for artifacts visible in the selected scope. */
const ArtifactsListParamsSchema = ArtifactQueryParamsSchema;
require_worker_admission.closedObject({ artifacts: typebox.Type.Array(ArtifactSummarySchema) });
/** Get request payload for one artifact summary. */
const ArtifactsGetParamsSchema = ArtifactGetParamsSchema;
require_worker_admission.closedObject({ artifact: ArtifactSummarySchema });
/** Download request payload for one artifact. */
const ArtifactsDownloadParamsSchema = ArtifactGetParamsSchema;
require_worker_admission.closedObject({
	artifact: ArtifactSummarySchema,
	encoding: typebox.Type.Optional(typebox.Type.Literal("base64")),
	data: typebox.Type.Optional(typebox.Type.String()),
	url: typebox.Type.Optional(NonEmptyString)
});
//#endregion
//#region packages/gateway-protocol/src/schema/audit-activity.ts
const AuditActivitySchemaVersionV1Schema = typebox.Type.Integer({
	minimum: 1,
	maximum: 1
});
const AuditActivityStatusV1Schema = typebox.Type.Union([
	typebox.Type.Literal("started"),
	typebox.Type.Literal("succeeded"),
	typebox.Type.Literal("failed"),
	typebox.Type.Literal("cancelled"),
	typebox.Type.Literal("timed_out"),
	typebox.Type.Literal("blocked"),
	typebox.Type.Literal("unknown")
]);
const AuditActivityKindV1Schema = typebox.Type.Union([
	typebox.Type.Literal("agent_run"),
	typebox.Type.Literal("tool_action"),
	typebox.Type.Literal("message")
]);
const AuditActivityDirectionV1Schema = typebox.Type.Union([typebox.Type.Literal("inbound"), typebox.Type.Literal("outbound")]);
const AuditActivityConversationKindV1Schema = typebox.Type.Union([
	typebox.Type.Literal("direct"),
	typebox.Type.Literal("group"),
	typebox.Type.Literal("channel"),
	typebox.Type.Literal("unknown")
]);
const AuditActivityHmacRefV1Schema = typebox.Type.String({ pattern: "^hmac-sha256:v1:[a-f0-9]{32}:[a-f0-9]{64}$" });
const AuditActivityAgentActorV1Schema = require_worker_admission.closedObject({
	type: typebox.Type.Union([typebox.Type.Literal("agent"), typebox.Type.Literal("system")]),
	id: NonEmptyString
});
const AuditActivityInboundActorV1Schema = typebox.Type.Union([require_worker_admission.closedObject({
	type: typebox.Type.Literal("channel_sender"),
	id: AuditActivityHmacRefV1Schema
}), require_worker_admission.closedObject({
	type: typebox.Type.Literal("system"),
	id: NonEmptyString
})]);
const AuditActivityOutboundActorV1Schema = require_worker_admission.closedObject({
	type: typebox.Type.Union([typebox.Type.Literal("agent"), typebox.Type.Literal("system")]),
	id: NonEmptyString
});
const commonProperties = {
	schemaVersion: AuditActivitySchemaVersionV1Schema,
	eventId: NonEmptyString,
	sequence: typebox.Type.Integer({ minimum: 1 }),
	sourceSequence: typebox.Type.Integer({ minimum: 1 }),
	occurredAt: typebox.Type.Integer({ minimum: 0 }),
	redaction: typebox.Type.Literal("metadata_only")
};
const agentProperties = {
	actor: AuditActivityAgentActorV1Schema,
	agentId: NonEmptyString,
	sessionKey: typebox.Type.Optional(NonEmptyString),
	sessionId: typebox.Type.Optional(NonEmptyString),
	runId: NonEmptyString
};
const messageProperties = {
	channel: NonEmptyString,
	conversationKind: AuditActivityConversationKindV1Schema,
	durationMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	resultCount: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	agentId: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	accountRef: typebox.Type.Optional(AuditActivityHmacRefV1Schema),
	conversationRef: typebox.Type.Optional(AuditActivityHmacRefV1Schema),
	messageRef: typebox.Type.Optional(AuditActivityHmacRefV1Schema),
	targetRef: typebox.Type.Optional(AuditActivityHmacRefV1Schema)
};
function correlatedObject(properties, variants) {
	return typebox.Type.Object(properties, {
		additionalProperties: false,
		allOf: [variants]
	});
}
function withoutField(field) {
	return { not: { required: [field] } };
}
const withoutErrorCode = withoutField("errorCode");
const withoutReasonCode = withoutField("reasonCode");
const withoutFailureStage = withoutField("failureStage");
const withoutDeliveryKind = withoutField("deliveryKind");
/** V1 agent-run activity record. */
const AuditActivityAgentRunV1Schema = correlatedObject({
	eventType: typebox.Type.Literal("agent_run"),
	...commonProperties,
	...agentProperties,
	kind: typebox.Type.Literal("agent_run"),
	action: typebox.Type.Union([typebox.Type.Literal("agent.run.started"), typebox.Type.Literal("agent.run.finished")]),
	status: typebox.Type.Union([
		typebox.Type.Literal("started"),
		typebox.Type.Literal("succeeded"),
		typebox.Type.Literal("failed"),
		typebox.Type.Literal("cancelled"),
		typebox.Type.Literal("timed_out"),
		typebox.Type.Literal("blocked")
	]),
	errorCode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("run_failed"),
		typebox.Type.Literal("run_cancelled"),
		typebox.Type.Literal("run_timed_out"),
		typebox.Type.Literal("run_blocked")
	]))
}, typebox.Type.Union([
	typebox.Type.Intersect([typebox.Type.Object({
		action: typebox.Type.Literal("agent.run.started"),
		status: typebox.Type.Literal("started")
	}), withoutErrorCode]),
	typebox.Type.Intersect([typebox.Type.Object({
		action: typebox.Type.Literal("agent.run.finished"),
		status: typebox.Type.Literal("succeeded")
	}), withoutErrorCode]),
	typebox.Type.Object({
		action: typebox.Type.Literal("agent.run.finished"),
		status: typebox.Type.Literal("failed"),
		errorCode: typebox.Type.Literal("run_failed")
	}),
	typebox.Type.Object({
		action: typebox.Type.Literal("agent.run.finished"),
		status: typebox.Type.Literal("cancelled"),
		errorCode: typebox.Type.Literal("run_cancelled")
	}),
	typebox.Type.Object({
		action: typebox.Type.Literal("agent.run.finished"),
		status: typebox.Type.Literal("timed_out"),
		errorCode: typebox.Type.Literal("run_timed_out")
	}),
	typebox.Type.Object({
		action: typebox.Type.Literal("agent.run.finished"),
		status: typebox.Type.Literal("blocked"),
		errorCode: typebox.Type.Literal("run_blocked")
	})
]));
/** V1 tool-action activity record. */
const AuditActivityToolActionV1Schema = correlatedObject({
	eventType: typebox.Type.Literal("tool_action"),
	...commonProperties,
	...agentProperties,
	kind: typebox.Type.Literal("tool_action"),
	toolCallId: typebox.Type.Optional(NonEmptyString),
	toolName: typebox.Type.Optional(NonEmptyString),
	action: typebox.Type.Union([typebox.Type.Literal("tool.action.started"), typebox.Type.Literal("tool.action.finished")]),
	status: AuditActivityStatusV1Schema,
	errorCode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("tool_failed"),
		typebox.Type.Literal("tool_cancelled"),
		typebox.Type.Literal("tool_timed_out"),
		typebox.Type.Literal("tool_blocked"),
		typebox.Type.Literal("tool_outcome_unknown")
	]))
}, typebox.Type.Union([
	typebox.Type.Intersect([typebox.Type.Object({
		action: typebox.Type.Literal("tool.action.started"),
		status: typebox.Type.Literal("started")
	}), withoutErrorCode]),
	typebox.Type.Intersect([typebox.Type.Object({
		action: typebox.Type.Literal("tool.action.finished"),
		status: typebox.Type.Literal("succeeded")
	}), withoutErrorCode]),
	typebox.Type.Object({
		action: typebox.Type.Literal("tool.action.finished"),
		status: typebox.Type.Literal("failed"),
		errorCode: typebox.Type.Literal("tool_failed")
	}),
	typebox.Type.Object({
		action: typebox.Type.Literal("tool.action.finished"),
		status: typebox.Type.Literal("cancelled"),
		errorCode: typebox.Type.Literal("tool_cancelled")
	}),
	typebox.Type.Object({
		action: typebox.Type.Literal("tool.action.finished"),
		status: typebox.Type.Literal("timed_out"),
		errorCode: typebox.Type.Literal("tool_timed_out")
	}),
	typebox.Type.Object({
		action: typebox.Type.Literal("tool.action.finished"),
		status: typebox.Type.Literal("blocked"),
		errorCode: typebox.Type.Literal("tool_blocked")
	}),
	typebox.Type.Object({
		action: typebox.Type.Literal("tool.action.finished"),
		status: typebox.Type.Literal("unknown"),
		errorCode: typebox.Type.Literal("tool_outcome_unknown")
	})
]));
const inboundMessageProperties = {
	eventType: typebox.Type.Literal("inbound_message"),
	...commonProperties,
	...messageProperties,
	kind: typebox.Type.Literal("message"),
	action: typebox.Type.Literal("message.inbound.processed"),
	direction: typebox.Type.Literal("inbound"),
	actor: AuditActivityInboundActorV1Schema
};
const inboundCompletedReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("fast_abort"),
	typebox.Type.Literal("plugin_bound_handled"),
	typebox.Type.Literal("plugin_bound_unavailable"),
	typebox.Type.Literal("plugin_bound_declined"),
	typebox.Type.Literal("before_dispatch_handled"),
	typebox.Type.Literal("acp_dispatch_completed"),
	typebox.Type.Literal("acp_dispatch_empty")
]);
const inboundSkippedReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("duplicate"),
	typebox.Type.Literal("reply_operation_active"),
	typebox.Type.Literal("reply_operation_aborted"),
	typebox.Type.Literal("acp_dispatch_aborted")
]);
/** V1 inbound-message activity record. */
const inboundFailureReasonSchema = typebox.Type.Union([typebox.Type.Literal("acp_dispatch_failed"), typebox.Type.Literal("plugin_bound_error")]);
const AuditActivityInboundMessageV1Schema = correlatedObject({
	...inboundMessageProperties,
	status: typebox.Type.Union([
		typebox.Type.Literal("succeeded"),
		typebox.Type.Literal("blocked"),
		typebox.Type.Literal("failed")
	]),
	outcome: typebox.Type.Union([
		typebox.Type.Literal("completed"),
		typebox.Type.Literal("skipped"),
		typebox.Type.Literal("failed")
	]),
	errorCode: typebox.Type.Optional(typebox.Type.Literal("message_processing_failed")),
	reasonCode: typebox.Type.Optional(typebox.Type.Union([
		...inboundCompletedReasonSchema.anyOf,
		...inboundSkippedReasonSchema.anyOf,
		...inboundFailureReasonSchema.anyOf
	]))
}, typebox.Type.Union([
	typebox.Type.Intersect([typebox.Type.Object({
		status: typebox.Type.Literal("succeeded"),
		outcome: typebox.Type.Literal("completed"),
		reasonCode: typebox.Type.Optional(inboundCompletedReasonSchema)
	}), withoutErrorCode]),
	typebox.Type.Intersect([typebox.Type.Object({
		status: typebox.Type.Literal("blocked"),
		outcome: typebox.Type.Literal("skipped"),
		reasonCode: typebox.Type.Optional(inboundSkippedReasonSchema)
	}), withoutErrorCode]),
	typebox.Type.Object({
		status: typebox.Type.Literal("failed"),
		outcome: typebox.Type.Literal("failed"),
		errorCode: typebox.Type.Literal("message_processing_failed"),
		reasonCode: typebox.Type.Optional(inboundFailureReasonSchema)
	})
]));
const outboundMessageProperties = {
	eventType: typebox.Type.Literal("outbound_message"),
	...commonProperties,
	...messageProperties,
	kind: typebox.Type.Literal("message"),
	action: typebox.Type.Literal("message.outbound.finished"),
	direction: typebox.Type.Literal("outbound"),
	actor: AuditActivityOutboundActorV1Schema,
	deliveryKind: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("text"),
		typebox.Type.Literal("media"),
		typebox.Type.Literal("other")
	]))
};
const outboundSuppressedReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("cancelled_by_message_sending_hook"),
	typebox.Type.Literal("cancelled_by_reply_payload_sending_hook"),
	typebox.Type.Literal("empty_after_message_sending_hook"),
	typebox.Type.Literal("empty_after_reply_payload_sending_hook"),
	typebox.Type.Literal("no_visible_payload")
]);
const outboundFailureStageSchema = typebox.Type.Union([
	typebox.Type.Literal("platform_send"),
	typebox.Type.Literal("queue"),
	typebox.Type.Literal("unknown")
]);
/** V1 outbound-message activity record. */
const outboundFailureErrorSchema = typebox.Type.Union([typebox.Type.Literal("message_delivery_failed"), typebox.Type.Literal("message_delivery_partial_failure")]);
const AuditActivityOutboundMessageV1Schema = correlatedObject({
	...outboundMessageProperties,
	status: typebox.Type.Union([
		typebox.Type.Literal("succeeded"),
		typebox.Type.Literal("blocked"),
		typebox.Type.Literal("failed"),
		typebox.Type.Literal("unknown")
	]),
	outcome: typebox.Type.Union([
		typebox.Type.Literal("sent"),
		typebox.Type.Literal("suppressed"),
		typebox.Type.Literal("failed"),
		typebox.Type.Literal("unknown")
	]),
	errorCode: typebox.Type.Optional(outboundFailureErrorSchema),
	reasonCode: typebox.Type.Optional(outboundSuppressedReasonSchema),
	failureStage: typebox.Type.Optional(outboundFailureStageSchema)
}, typebox.Type.Union([
	typebox.Type.Intersect([
		typebox.Type.Object({
			status: typebox.Type.Literal("succeeded"),
			outcome: typebox.Type.Literal("sent")
		}),
		withoutErrorCode,
		withoutReasonCode,
		withoutFailureStage
	]),
	typebox.Type.Intersect([
		typebox.Type.Object({
			status: typebox.Type.Literal("blocked"),
			outcome: typebox.Type.Literal("suppressed"),
			reasonCode: outboundSuppressedReasonSchema
		}),
		withoutErrorCode,
		withoutFailureStage,
		withoutDeliveryKind
	]),
	typebox.Type.Intersect([typebox.Type.Object({
		status: typebox.Type.Literal("failed"),
		outcome: typebox.Type.Literal("failed"),
		errorCode: outboundFailureErrorSchema,
		failureStage: outboundFailureStageSchema
	}), withoutReasonCode]),
	typebox.Type.Intersect([
		typebox.Type.Object({
			status: typebox.Type.Literal("unknown"),
			outcome: typebox.Type.Literal("unknown"),
			failureStage: outboundFailureStageSchema
		}),
		withoutErrorCode,
		withoutReasonCode,
		withoutDeliveryKind
	])
]));
/** Discriminated V1 activity record union. */
const AuditActivityEventV1Schema = typebox.Type.Union([
	AuditActivityAgentRunV1Schema,
	AuditActivityToolActionV1Schema,
	AuditActivityInboundMessageV1Schema,
	AuditActivityOutboundMessageV1Schema
]);
/** Bounded newest-first V1 activity query filters. */
const AuditActivityListParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	kind: typebox.Type.Optional(AuditActivityKindV1Schema),
	status: typebox.Type.Optional(AuditActivityStatusV1Schema),
	direction: typebox.Type.Optional(AuditActivityDirectionV1Schema),
	channel: typebox.Type.Optional(NonEmptyString),
	after: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	before: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 500
	})),
	cursor: typebox.Type.Optional(NonEmptyString)
});
require_worker_admission.closedObject({
	events: typebox.Type.Array(AuditActivityEventV1Schema),
	nextCursor: typebox.Type.Optional(NonEmptyString)
});
//#endregion
//#region packages/gateway-protocol/src/schema/audit.ts
const AuditEventKindSchema = typebox.Type.Union([typebox.Type.Literal("agent_run"), typebox.Type.Literal("tool_action")]);
const AuditEventActionSchema = typebox.Type.Union([
	typebox.Type.Literal("agent.run.started"),
	typebox.Type.Literal("agent.run.finished"),
	typebox.Type.Literal("tool.action.started"),
	typebox.Type.Literal("tool.action.finished")
]);
const AuditEventStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("started"),
	typebox.Type.Literal("succeeded"),
	typebox.Type.Literal("failed"),
	typebox.Type.Literal("cancelled"),
	typebox.Type.Literal("timed_out"),
	typebox.Type.Literal("blocked"),
	typebox.Type.Literal("unknown")
]);
const AuditEventErrorCodeSchema = typebox.Type.Union([
	typebox.Type.Literal("run_failed"),
	typebox.Type.Literal("run_cancelled"),
	typebox.Type.Literal("run_timed_out"),
	typebox.Type.Literal("run_blocked"),
	typebox.Type.Literal("tool_failed"),
	typebox.Type.Literal("tool_cancelled"),
	typebox.Type.Literal("tool_timed_out"),
	typebox.Type.Literal("tool_blocked"),
	typebox.Type.Literal("tool_outcome_unknown")
]);
/** One content-free run/tool audit record. */
const AuditEventSchema = require_worker_admission.closedObject({
	eventId: NonEmptyString,
	sequence: typebox.Type.Integer({ minimum: 1 }),
	sourceSequence: typebox.Type.Integer({ minimum: 1 }),
	occurredAt: typebox.Type.Integer({ minimum: 0 }),
	kind: AuditEventKindSchema,
	action: AuditEventActionSchema,
	status: AuditEventStatusSchema,
	errorCode: typebox.Type.Optional(AuditEventErrorCodeSchema),
	actor: require_worker_admission.closedObject({
		type: typebox.Type.Union([typebox.Type.Literal("agent"), typebox.Type.Literal("system")]),
		id: NonEmptyString
	}),
	agentId: NonEmptyString,
	sessionKey: typebox.Type.Optional(NonEmptyString),
	sessionId: typebox.Type.Optional(NonEmptyString),
	runId: NonEmptyString,
	toolCallId: typebox.Type.Optional(NonEmptyString),
	toolName: typebox.Type.Optional(NonEmptyString),
	redaction: typebox.Type.Literal("metadata_only")
});
/** Bounded newest-first audit query filters. */
const AuditListParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	kind: typebox.Type.Optional(AuditEventKindSchema),
	status: typebox.Type.Optional(AuditEventStatusSchema),
	after: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	before: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 500
	})),
	cursor: typebox.Type.Optional(NonEmptyString)
});
require_worker_admission.closedObject({
	events: typebox.Type.Array(AuditEventSchema),
	nextCursor: typebox.Type.Optional(NonEmptyString)
});
//#endregion
//#region packages/gateway-protocol/src/schema/channels.ts
/**
* Channel and Talk protocol schemas.
*
* Talk schemas are consumed by browser realtime clients, gateway relay sessions,
* and channel adapters, so the mode/transport/brain unions below are shared
* API vocabulary rather than provider-local implementation details.
*/
/** Toggles Talk mode for the gateway, with an optional rollout phase marker. */
const TalkModeParamsSchema = require_worker_admission.closedObject({
	enabled: typebox.Type.Boolean(),
	phase: typebox.Type.Optional(typebox.Type.String())
});
/** Reads Talk configuration; secrets are included only for trusted callers. */
const TalkConfigParamsSchema = require_worker_admission.closedObject({ includeSecrets: typebox.Type.Optional(typebox.Type.Boolean()) });
/** One-shot text-to-speech request with provider-specific voice tuning knobs. */
const TalkSpeakParamsSchema = require_worker_admission.closedObject({
	text: NonEmptyString,
	voiceId: typebox.Type.Optional(typebox.Type.String()),
	modelId: typebox.Type.Optional(typebox.Type.String()),
	outputFormat: typebox.Type.Optional(typebox.Type.String()),
	speed: typebox.Type.Optional(typebox.Type.Number()),
	rateWpm: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	stability: typebox.Type.Optional(typebox.Type.Number()),
	similarity: typebox.Type.Optional(typebox.Type.Number()),
	style: typebox.Type.Optional(typebox.Type.Number()),
	speakerBoost: typebox.Type.Optional(typebox.Type.Boolean()),
	seed: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	normalize: typebox.Type.Optional(typebox.Type.String()),
	language: typebox.Type.Optional(typebox.Type.String()),
	latencyTier: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/**
* One-shot text-to-speech request rendered with the configured TTS provider
* chain (unlike `talk.speak`, which pins the Talk-mode provider).
*/
const TtsSpeakParamsSchema = require_worker_admission.closedObject({ text: NonEmptyString });
/** Supported Talk session shapes exposed to clients and providers. */
const TalkModeSchema = typebox.Type.Union([
	typebox.Type.Literal("realtime"),
	typebox.Type.Literal("stt-tts"),
	typebox.Type.Literal("transcription")
]);
/** Transport families; browser clients branch on this value to choose setup flow. */
const TalkTransportSchema = typebox.Type.Union([
	typebox.Type.Literal("webrtc"),
	typebox.Type.Literal("provider-websocket"),
	typebox.Type.Literal("gateway-relay"),
	typebox.Type.Literal("managed-room")
]);
/** How a Talk session delegates reasoning/tool use to the agent runtime. */
const TalkBrainSchema = typebox.Type.Union([
	typebox.Type.Literal("agent-consult"),
	typebox.Type.Literal("direct-tools"),
	typebox.Type.Literal("none")
]);
/** Agent control actions accepted from Talk clients and managed rooms. */
const TalkAgentControlModeSchema = typebox.Type.Union([
	typebox.Type.Literal("status"),
	typebox.Type.Literal("steer"),
	typebox.Type.Literal("cancel"),
	typebox.Type.Literal("followup")
]);
/** Stable event names emitted by Talk sessions across providers/transports. */
const TalkEventTypeSchema = typebox.Type.Union([
	typebox.Type.Literal("session.started"),
	typebox.Type.Literal("session.ready"),
	typebox.Type.Literal("session.closed"),
	typebox.Type.Literal("session.error"),
	typebox.Type.Literal("session.replaced"),
	typebox.Type.Literal("turn.started"),
	typebox.Type.Literal("turn.ended"),
	typebox.Type.Literal("turn.cancelled"),
	typebox.Type.Literal("capture.started"),
	typebox.Type.Literal("capture.stopped"),
	typebox.Type.Literal("capture.cancelled"),
	typebox.Type.Literal("capture.once"),
	typebox.Type.Literal("input.audio.delta"),
	typebox.Type.Literal("input.audio.committed"),
	typebox.Type.Literal("transcript.delta"),
	typebox.Type.Literal("transcript.done"),
	typebox.Type.Literal("output.text.delta"),
	typebox.Type.Literal("output.text.done"),
	typebox.Type.Literal("output.audio.started"),
	typebox.Type.Literal("output.audio.delta"),
	typebox.Type.Literal("output.audio.done"),
	typebox.Type.Literal("tool.call"),
	typebox.Type.Literal("tool.progress"),
	typebox.Type.Literal("tool.result"),
	typebox.Type.Literal("tool.error"),
	typebox.Type.Literal("usage.metrics"),
	typebox.Type.Literal("latency.metrics"),
	typebox.Type.Literal("health.changed")
]);
/** Event types that must carry a turn id for client-side stream correlation. */
const TURN_SCOPED_TALK_EVENT_TYPES = [
	"turn.started",
	"turn.ended",
	"turn.cancelled",
	"input.audio.delta",
	"input.audio.committed",
	"transcript.delta",
	"transcript.done",
	"output.text.delta",
	"output.text.done",
	"output.audio.started",
	"output.audio.delta",
	"output.audio.done",
	"tool.call",
	"tool.progress",
	"tool.result",
	"tool.error"
];
/** Capture lifecycle events must include capture id to avoid cross-turn ambiguity. */
const CAPTURE_SCOPED_TALK_EVENT_TYPES = [
	"capture.started",
	"capture.stopped",
	"capture.cancelled",
	"capture.once"
];
/** Builds JSON Schema conditional requirements while avoiding reserved word syntax. */
function requireJsonSchemaProperties(properties) {
	const conditionalRequirementKey = ["th", "en"].join("");
	return Object.fromEntries([[conditionalRequirementKey, { required: properties }]]);
}
/** Canonical Talk event envelope emitted to browser, relay, and channel consumers. */
const TalkEventSchema = typebox.Type.Object({
	id: NonEmptyString,
	type: TalkEventTypeSchema,
	sessionId: NonEmptyString,
	turnId: typebox.Type.Optional(typebox.Type.String()),
	captureId: typebox.Type.Optional(typebox.Type.String()),
	seq: typebox.Type.Integer({ minimum: 1 }),
	timestamp: NonEmptyString,
	mode: TalkModeSchema,
	transport: TalkTransportSchema,
	brain: TalkBrainSchema,
	provider: typebox.Type.Optional(typebox.Type.String()),
	final: typebox.Type.Optional(typebox.Type.Boolean()),
	callId: typebox.Type.Optional(typebox.Type.String()),
	itemId: typebox.Type.Optional(typebox.Type.String()),
	parentId: typebox.Type.Optional(typebox.Type.String()),
	payload: typebox.Type.Unknown()
}, {
	additionalProperties: false,
	allOf: [{
		if: {
			properties: { type: { enum: TURN_SCOPED_TALK_EVENT_TYPES } },
			required: ["type"]
		},
		...requireJsonSchemaProperties(["turnId"])
	}, {
		if: {
			properties: { type: { enum: CAPTURE_SCOPED_TALK_EVENT_TYPES } },
			required: ["type"]
		},
		...requireJsonSchemaProperties(["captureId"])
	}]
});
/** Creates a browser-facing Talk client session. */
const TalkClientCreateParamsSchema = require_worker_admission.closedObject({
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	provider: typebox.Type.Optional(typebox.Type.String()),
	model: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	vadThreshold: typebox.Type.Optional(typebox.Type.Number()),
	silenceDurationMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	prefixPaddingMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	reasoningEffort: typebox.Type.Optional(typebox.Type.String()),
	mode: typebox.Type.Optional(TalkModeSchema),
	transport: typebox.Type.Optional(TalkTransportSchema),
	brain: typebox.Type.Optional(TalkBrainSchema)
});
/** Tool-call request from a browser/client session back into the agent runtime. */
const TalkClientToolCallParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	callId: NonEmptyString,
	name: NonEmptyString,
	args: typebox.Type.Optional(typebox.Type.Unknown()),
	relaySessionId: typebox.Type.Optional(NonEmptyString)
});
/** Agent run identity returned after accepting a Talk client tool call. */
const TalkClientToolCallResultSchema = require_worker_admission.closedObject({
	runId: NonEmptyString,
	idempotencyKey: NonEmptyString
});
/** Text steering request for a Talk session bound to an agent turn. */
const TalkClientSteerParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	text: NonEmptyString,
	mode: typebox.Type.Optional(TalkAgentControlModeSchema)
});
/** Result of applying agent control to an embedded or reply-backed Talk run. */
const TalkAgentControlResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Boolean(),
	mode: TalkAgentControlModeSchema,
	sessionKey: NonEmptyString,
	sessionId: typebox.Type.Optional(NonEmptyString),
	active: typebox.Type.Boolean(),
	queued: typebox.Type.Optional(typebox.Type.Boolean()),
	aborted: typebox.Type.Optional(typebox.Type.Boolean()),
	target: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("embedded_run"), typebox.Type.Literal("reply_run")])),
	reason: typebox.Type.Optional(typebox.Type.String()),
	message: typebox.Type.String(),
	speak: typebox.Type.Boolean(),
	show: typebox.Type.Boolean(),
	suppress: typebox.Type.Boolean(),
	providerResult: typebox.Type.Optional(require_worker_admission.closedObject({
		status: typebox.Type.Literal("cancelled"),
		message: typebox.Type.String()
	})),
	enqueuedAtMs: typebox.Type.Optional(typebox.Type.Number()),
	deliveredAtMs: typebox.Type.Optional(typebox.Type.Number())
});
/** Joins an existing managed-room Talk session. */
const TalkSessionJoinParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	token: NonEmptyString
});
/** Creates a gateway-managed Talk session for realtime, transcription, or relay use. */
const TalkSessionCreateParamsSchema = require_worker_admission.closedObject({
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	spawnedBy: typebox.Type.Optional(NonEmptyString),
	provider: typebox.Type.Optional(typebox.Type.String()),
	model: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	vadThreshold: typebox.Type.Optional(typebox.Type.Number()),
	silenceDurationMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	prefixPaddingMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	reasoningEffort: typebox.Type.Optional(typebox.Type.String()),
	mode: typebox.Type.Optional(TalkModeSchema),
	transport: typebox.Type.Optional(TalkTransportSchema),
	brain: typebox.Type.Optional(TalkBrainSchema),
	ttlMs: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1e3,
		maximum: 36e5
	}))
});
/** Appends base64 audio to an active Talk session. */
const TalkSessionAppendAudioParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	audioBase64: NonEmptyString,
	timestamp: typebox.Type.Optional(typebox.Type.Number())
});
/** Starts or advances a Talk turn within a session. */
const TalkSessionTurnParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	turnId: typebox.Type.Optional(typebox.Type.String())
});
/** Cancels the active or named Talk turn. */
const TalkSessionCancelTurnParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	turnId: typebox.Type.Optional(typebox.Type.String()),
	reason: typebox.Type.Optional(typebox.Type.String())
});
/** Cancels currently streaming Talk output without necessarily ending the turn. */
const TalkSessionCancelOutputParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	turnId: typebox.Type.Optional(typebox.Type.String()),
	reason: typebox.Type.Optional(typebox.Type.String())
});
/** Submits a tool result back to a Talk provider session. */
const TalkSessionSubmitToolResultParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	callId: NonEmptyString,
	result: typebox.Type.Unknown(),
	options: typebox.Type.Optional(require_worker_admission.closedObject({
		suppressResponse: typebox.Type.Optional(typebox.Type.Boolean()),
		willContinue: typebox.Type.Optional(typebox.Type.Boolean())
	}))
});
/** Steers a managed Talk session by session id rather than transcript key. */
const TalkSessionSteerParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	sessionKey: typebox.Type.Optional(NonEmptyString),
	text: NonEmptyString,
	mode: typebox.Type.Optional(TalkAgentControlModeSchema)
});
/** Closes a gateway-managed Talk session. */
const TalkSessionCloseParamsSchema = require_worker_admission.closedObject({ sessionId: NonEmptyString });
/** Mutable room state returned when a client joins a managed Talk room. */
const TalkSessionManagedRoomStateSchema = require_worker_admission.closedObject({
	activeClientId: typebox.Type.Optional(typebox.Type.String()),
	activeTurnId: typebox.Type.Optional(typebox.Type.String()),
	recentTalkEvents: typebox.Type.Array(TalkEventSchema)
});
/** Managed-room session record shared with browser clients. */
const TalkSessionManagedRoomRecordSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	roomId: NonEmptyString,
	roomUrl: NonEmptyString,
	sessionKey: NonEmptyString,
	sessionId: typebox.Type.Optional(typebox.Type.String()),
	channel: typebox.Type.Optional(typebox.Type.String()),
	target: typebox.Type.Optional(typebox.Type.String()),
	provider: typebox.Type.Optional(typebox.Type.String()),
	model: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	mode: TalkModeSchema,
	transport: TalkTransportSchema,
	brain: TalkBrainSchema,
	createdAt: typebox.Type.Number(),
	expiresAt: typebox.Type.Number(),
	room: TalkSessionManagedRoomStateSchema
});
/** Empty request payload for reading configured Talk provider capabilities. */
const TalkCatalogParamsSchema = require_worker_admission.closedObject({});
/** One provider entry in the Talk capability catalog. */
const TalkCatalogProviderSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	label: NonEmptyString,
	configured: typebox.Type.Boolean(),
	aliases: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	models: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	voices: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	defaultModel: typebox.Type.Optional(typebox.Type.String()),
	modes: typebox.Type.Optional(typebox.Type.Array(TalkModeSchema)),
	transports: typebox.Type.Optional(typebox.Type.Array(TalkTransportSchema)),
	brains: typebox.Type.Optional(typebox.Type.Array(TalkBrainSchema)),
	inputAudioFormats: typebox.Type.Optional(typebox.Type.Array(require_worker_admission.closedObject({
		encoding: typebox.Type.Union([typebox.Type.Literal("pcm16"), typebox.Type.Literal("g711_ulaw")]),
		sampleRateHz: typebox.Type.Integer({ minimum: 1 }),
		channels: typebox.Type.Integer({ minimum: 1 })
	}))),
	outputAudioFormats: typebox.Type.Optional(typebox.Type.Array(require_worker_admission.closedObject({
		encoding: typebox.Type.Union([typebox.Type.Literal("pcm16"), typebox.Type.Literal("g711_ulaw")]),
		sampleRateHz: typebox.Type.Integer({ minimum: 1 }),
		channels: typebox.Type.Integer({ minimum: 1 })
	}))),
	supportsBrowserSession: typebox.Type.Optional(typebox.Type.Boolean()),
	supportsBargeIn: typebox.Type.Optional(typebox.Type.Boolean()),
	supportsToolCalls: typebox.Type.Optional(typebox.Type.Boolean()),
	supportsVideoFrames: typebox.Type.Optional(typebox.Type.Boolean()),
	supportsSessionResumption: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Active provider plus all candidates for a Talk capability family. */
const TalkCatalogProviderGroupSchema = require_worker_admission.closedObject({
	ready: typebox.Type.Optional(typebox.Type.Boolean()),
	activeProvider: typebox.Type.Optional(typebox.Type.String()),
	providers: typebox.Type.Array(TalkCatalogProviderSchema)
});
/** Provider, mode, transport, and audio-format catalog returned to clients. */
const TalkCatalogResultSchema = require_worker_admission.closedObject({
	modes: typebox.Type.Array(TalkModeSchema),
	transports: typebox.Type.Array(TalkTransportSchema),
	brains: typebox.Type.Array(TalkBrainSchema),
	speech: TalkCatalogProviderGroupSchema,
	transcription: TalkCatalogProviderGroupSchema,
	realtime: TalkCatalogProviderGroupSchema
});
/** Audio format contract for realtime browser sessions. */
const BrowserRealtimeAudioContractSchema = require_worker_admission.closedObject({
	inputEncoding: typebox.Type.Union([typebox.Type.Literal("pcm16"), typebox.Type.Literal("g711_ulaw")]),
	inputSampleRateHz: typebox.Type.Integer({ minimum: 1 }),
	outputEncoding: typebox.Type.Union([typebox.Type.Literal("pcm16"), typebox.Type.Literal("g711_ulaw")]),
	outputSampleRateHz: typebox.Type.Integer({ minimum: 1 })
});
/** Session creation result with transport-specific ids and credentials. */
const TalkSessionCreateResultSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	provider: typebox.Type.Optional(typebox.Type.String()),
	mode: TalkModeSchema,
	transport: TalkTransportSchema,
	brain: TalkBrainSchema,
	relaySessionId: typebox.Type.Optional(NonEmptyString),
	transcriptionSessionId: typebox.Type.Optional(NonEmptyString),
	handoffId: typebox.Type.Optional(NonEmptyString),
	roomId: typebox.Type.Optional(NonEmptyString),
	roomUrl: typebox.Type.Optional(NonEmptyString),
	token: typebox.Type.Optional(NonEmptyString),
	audio: typebox.Type.Optional(typebox.Type.Unknown()),
	model: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	expiresAt: typebox.Type.Optional(typebox.Type.Number())
});
/** Result for a Talk turn request, optionally including emitted events. */
const TalkSessionTurnResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Boolean(),
	turnId: typebox.Type.Optional(typebox.Type.String()),
	events: typebox.Type.Optional(typebox.Type.Array(TalkEventSchema))
});
/** Managed-room record returned to clients after joining an existing Talk session. */
const TalkSessionJoinResultSchema = TalkSessionManagedRoomRecordSchema;
/** Generic success result for Talk session lifecycle calls. */
const TalkSessionOkResultSchema = require_worker_admission.closedObject({ ok: typebox.Type.Boolean() });
/** Browser WebRTC setup payload using provider SDP exchange. */
const BrowserRealtimeWebRtcSdpSessionSchema = require_worker_admission.closedObject({
	provider: NonEmptyString,
	transport: typebox.Type.Literal("webrtc"),
	clientSecret: NonEmptyString,
	offerUrl: typebox.Type.Optional(typebox.Type.String()),
	offerHeaders: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), typebox.Type.String())),
	model: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	expiresAt: typebox.Type.Optional(typebox.Type.Number())
});
/** Browser websocket setup payload with JSON/PCM audio contract. */
const BrowserRealtimeJsonPcmWebSocketSessionSchema = require_worker_admission.closedObject({
	provider: NonEmptyString,
	transport: typebox.Type.Literal("provider-websocket"),
	protocol: NonEmptyString,
	clientSecret: NonEmptyString,
	websocketUrl: NonEmptyString,
	audio: BrowserRealtimeAudioContractSchema,
	initialMessage: typebox.Type.Optional(typebox.Type.Unknown()),
	model: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	expiresAt: typebox.Type.Optional(typebox.Type.Number())
});
/** Browser setup payload for gateway-relayed realtime audio. */
const BrowserRealtimeGatewayRelaySessionSchema = require_worker_admission.closedObject({
	provider: NonEmptyString,
	transport: typebox.Type.Literal("gateway-relay"),
	relaySessionId: NonEmptyString,
	audio: BrowserRealtimeAudioContractSchema,
	model: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	expiresAt: typebox.Type.Optional(typebox.Type.Number())
});
/** Browser setup payload for managed-room Talk sessions. */
const BrowserRealtimeManagedRoomSessionSchema = require_worker_admission.closedObject({
	provider: NonEmptyString,
	transport: typebox.Type.Literal("managed-room"),
	roomUrl: NonEmptyString,
	token: typebox.Type.Optional(typebox.Type.String()),
	model: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	expiresAt: typebox.Type.Optional(typebox.Type.Number())
});
/** Union of all browser Talk session setup payloads. */
const TalkClientCreateResultSchema = typebox.Type.Union([
	BrowserRealtimeWebRtcSdpSessionSchema,
	BrowserRealtimeJsonPcmWebSocketSessionSchema,
	BrowserRealtimeGatewayRelaySessionSchema,
	BrowserRealtimeManagedRoomSessionSchema
]);
/** Secret-bearing provider fields; extra provider options remain provider-owned. */
const talkProviderFieldSchemas = { apiKey: typebox.Type.Optional(SecretInputSchema) };
/** Per-provider Talk config bag. */
const TalkProviderConfigSchema = typebox.Type.Object(talkProviderFieldSchemas, { additionalProperties: true });
/** Realtime Talk defaults and provider selection stored in config. */
const TalkRealtimeConfigSchema = require_worker_admission.closedObject({
	provider: typebox.Type.Optional(typebox.Type.String()),
	providers: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), TalkProviderConfigSchema)),
	model: typebox.Type.Optional(typebox.Type.String()),
	speakerVoice: typebox.Type.Optional(typebox.Type.String()),
	speakerVoiceId: typebox.Type.Optional(typebox.Type.String()),
	voice: typebox.Type.Optional(typebox.Type.String()),
	instructions: typebox.Type.Optional(typebox.Type.String()),
	mode: typebox.Type.Optional(TalkModeSchema),
	transport: typebox.Type.Optional(TalkTransportSchema),
	vadThreshold: typebox.Type.Optional(typebox.Type.Number({
		minimum: 0,
		maximum: 1
	})),
	silenceDurationMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	prefixPaddingMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	reasoningEffort: typebox.Type.Optional(typebox.Type.String({ minLength: 1 })),
	brain: typebox.Type.Optional(TalkBrainSchema),
	consultRouting: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("provider-direct"), typebox.Type.Literal("force-agent-consult")]))
});
/** Resolved active Talk provider plus its normalized provider config. */
const ResolvedTalkConfigSchema = require_worker_admission.closedObject({
	provider: typebox.Type.String(),
	config: TalkProviderConfigSchema
});
/** Talk config subtree returned through gateway config APIs. */
const TalkConfigSchema = require_worker_admission.closedObject({
	provider: typebox.Type.Optional(typebox.Type.String()),
	providers: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), TalkProviderConfigSchema)),
	realtime: typebox.Type.Optional(TalkRealtimeConfigSchema),
	resolved: typebox.Type.Optional(ResolvedTalkConfigSchema),
	consultThinkingLevel: typebox.Type.Optional(typebox.Type.String()),
	consultFastMode: typebox.Type.Optional(typebox.Type.Boolean()),
	speechLocale: typebox.Type.Optional(typebox.Type.String()),
	interruptOnSpeech: typebox.Type.Optional(typebox.Type.Boolean()),
	silenceTimeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 }))
});
/** Full Talk config read result, including related session/UI context. */
const TalkConfigResultSchema = require_worker_admission.closedObject({ config: require_worker_admission.closedObject({
	talk: typebox.Type.Optional(TalkConfigSchema),
	session: typebox.Type.Optional(require_worker_admission.closedObject({ mainKey: typebox.Type.Optional(typebox.Type.String()) })),
	ui: typebox.Type.Optional(require_worker_admission.closedObject({ seamColor: typebox.Type.Optional(typebox.Type.String()) }))
}) });
/** Text-to-speech result with encoded audio and provider output metadata. */
const TalkSpeakResultSchema = require_worker_admission.closedObject({
	audioBase64: NonEmptyString,
	provider: NonEmptyString,
	outputFormat: typebox.Type.Optional(typebox.Type.String()),
	voiceCompatible: typebox.Type.Optional(typebox.Type.Boolean()),
	mimeType: typebox.Type.Optional(typebox.Type.String()),
	fileExtension: typebox.Type.Optional(typebox.Type.String())
});
/** Text-to-speech result for `tts.speak` with encoded audio and provider metadata. */
const TtsSpeakResultSchema = require_worker_admission.closedObject({
	audioBase64: NonEmptyString,
	provider: NonEmptyString,
	outputFormat: typebox.Type.Optional(typebox.Type.String()),
	mimeType: typebox.Type.Optional(typebox.Type.String()),
	fileExtension: typebox.Type.Optional(typebox.Type.String())
});
/** Channel status request, optionally probing one channel before returning. */
const ChannelsStatusParamsSchema = require_worker_admission.closedObject({
	probe: typebox.Type.Optional(typebox.Type.Boolean()),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	channel: typebox.Type.Optional(NonEmptyString)
});
/**
* Per-account status snapshot for channel docking.
*
* This is intentionally schema-light so new channel-specific metadata can ship
* without a gateway protocol update; known fields stay documented for UI use.
*/
const ChannelAccountSnapshotSchema = typebox.Type.Object({
	accountId: NonEmptyString,
	name: typebox.Type.Optional(typebox.Type.String()),
	enabled: typebox.Type.Optional(typebox.Type.Boolean()),
	configured: typebox.Type.Optional(typebox.Type.Boolean()),
	linked: typebox.Type.Optional(typebox.Type.Boolean()),
	running: typebox.Type.Optional(typebox.Type.Boolean()),
	connected: typebox.Type.Optional(typebox.Type.Boolean()),
	reconnectAttempts: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastConnectedAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastError: typebox.Type.Optional(typebox.Type.String()),
	healthState: typebox.Type.Optional(typebox.Type.String()),
	lastStartAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastStopAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastInboundAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastOutboundAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastTransportActivityAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	busy: typebox.Type.Optional(typebox.Type.Boolean()),
	activeRuns: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastRunActivityAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastProbeAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	mode: typebox.Type.Optional(typebox.Type.String()),
	dmPolicy: typebox.Type.Optional(typebox.Type.String()),
	allowFrom: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	tokenSource: typebox.Type.Optional(typebox.Type.String()),
	botTokenSource: typebox.Type.Optional(typebox.Type.String()),
	appTokenSource: typebox.Type.Optional(typebox.Type.String()),
	baseUrl: typebox.Type.Optional(typebox.Type.String()),
	allowUnmentionedGroups: typebox.Type.Optional(typebox.Type.Boolean()),
	cliPath: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	dbPath: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	port: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Integer({ minimum: 0 }), typebox.Type.Null()])),
	probe: typebox.Type.Optional(typebox.Type.Unknown()),
	audit: typebox.Type.Optional(typebox.Type.Unknown()),
	application: typebox.Type.Optional(typebox.Type.Unknown())
}, { additionalProperties: true });
/** UI label and icon metadata for one channel. */
const ChannelUiMetaSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	label: NonEmptyString,
	detailLabel: NonEmptyString,
	systemImage: typebox.Type.Optional(typebox.Type.String())
});
/** Event-loop health snapshot included with channel status responses. */
const ChannelEventLoopHealthSchema = require_worker_admission.closedObject({
	degraded: typebox.Type.Boolean(),
	reasons: typebox.Type.Array(typebox.Type.Union([
		typebox.Type.Literal("event_loop_delay"),
		typebox.Type.Literal("event_loop_utilization"),
		typebox.Type.Literal("cpu")
	])),
	intervalMs: typebox.Type.Integer({ minimum: 0 }),
	delayP99Ms: typebox.Type.Number({ minimum: 0 }),
	delayMaxMs: typebox.Type.Number({ minimum: 0 }),
	utilization: typebox.Type.Number({ minimum: 0 }),
	cpuCoreRatio: typebox.Type.Number({ minimum: 0 })
});
require_worker_admission.closedObject({
	ts: typebox.Type.Integer({ minimum: 0 }),
	channelOrder: typebox.Type.Array(NonEmptyString),
	channelLabels: typebox.Type.Record(NonEmptyString, NonEmptyString),
	channelDetailLabels: typebox.Type.Optional(typebox.Type.Record(NonEmptyString, NonEmptyString)),
	channelSystemImages: typebox.Type.Optional(typebox.Type.Record(NonEmptyString, NonEmptyString)),
	channelMeta: typebox.Type.Optional(typebox.Type.Array(ChannelUiMetaSchema)),
	channels: typebox.Type.Record(NonEmptyString, typebox.Type.Unknown()),
	channelAccounts: typebox.Type.Record(NonEmptyString, typebox.Type.Array(ChannelAccountSnapshotSchema)),
	channelDefaultAccountId: typebox.Type.Record(NonEmptyString, NonEmptyString),
	eventLoop: typebox.Type.Optional(ChannelEventLoopHealthSchema),
	partial: typebox.Type.Optional(typebox.Type.Boolean()),
	warnings: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String()))
});
/** Logs out one channel account. */
const ChannelsLogoutParamsSchema = require_worker_admission.closedObject({
	channel: NonEmptyString,
	accountId: typebox.Type.Optional(typebox.Type.String())
});
/** Stops one channel account runtime. */
const ChannelsStopParamsSchema = require_worker_admission.closedObject({
	channel: NonEmptyString,
	accountId: typebox.Type.Optional(typebox.Type.String())
});
/** Starts one channel account runtime. */
const ChannelsStartParamsSchema = require_worker_admission.closedObject({
	channel: NonEmptyString,
	accountId: typebox.Type.Optional(typebox.Type.String())
});
/** Starts browser/web login for a channel account. */
const WebLoginStartParamsSchema = require_worker_admission.closedObject({
	force: typebox.Type.Optional(typebox.Type.Boolean()),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	verbose: typebox.Type.Optional(typebox.Type.Boolean()),
	accountId: typebox.Type.Optional(typebox.Type.String())
});
const QrDataUrlSchema = typebox.Type.String({
	maxLength: 16384,
	pattern: "^data:image/png;base64,"
});
/** Waits for web login completion or the next QR code. */
const WebLoginWaitParamsSchema = require_worker_admission.closedObject({
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	accountId: typebox.Type.Optional(typebox.Type.String()),
	currentQrDataUrl: typebox.Type.Optional(QrDataUrlSchema)
});
//#endregion
//#region packages/gateway-protocol/src/schema/talk-marks.ts
/** Acknowledges playback through a named realtime provider mark. */
const TalkSessionAcknowledgeMarkParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	markName: NonEmptyString
});
/** Maximum command description length accepted in catalog entries. */
const COMMAND_DESCRIPTION_MAX_LENGTH = 2e3;
const BoundedNonEmptyString = (maxLength) => typebox.Type.String({
	minLength: 1,
	maxLength
});
/** Source system that contributed a command. */
const CommandSourceSchema = typebox.Type.Union([
	typebox.Type.Literal("native"),
	typebox.Type.Literal("skill"),
	typebox.Type.Literal("plugin")
]);
/** Surfaces where a command may be invoked. */
const CommandScopeSchema = typebox.Type.Union([
	typebox.Type.Literal("text"),
	typebox.Type.Literal("native"),
	typebox.Type.Literal("both")
]);
/** Coarse UI grouping for command catalog display. */
const CommandCategorySchema = typebox.Type.Union([
	typebox.Type.Literal("session"),
	typebox.Type.Literal("options"),
	typebox.Type.Literal("status"),
	typebox.Type.Literal("management"),
	typebox.Type.Literal("media"),
	typebox.Type.Literal("tools"),
	typebox.Type.Literal("docks")
]);
/** Static argument choice shown to clients. */
const CommandArgChoiceSchema = require_worker_admission.closedObject({
	value: typebox.Type.String({ maxLength: 200 }),
	label: typebox.Type.String({ maxLength: 200 })
});
/** One typed argument advertised for a command. */
const CommandArgSchema = require_worker_admission.closedObject({
	name: BoundedNonEmptyString(200),
	description: typebox.Type.String({ maxLength: 500 }),
	type: typebox.Type.Union([
		typebox.Type.Literal("string"),
		typebox.Type.Literal("number"),
		typebox.Type.Literal("boolean")
	]),
	required: typebox.Type.Optional(typebox.Type.Boolean()),
	choices: typebox.Type.Optional(typebox.Type.Array(CommandArgChoiceSchema, { maxItems: 50 })),
	dynamic: typebox.Type.Optional(typebox.Type.Boolean())
});
/** One command catalog entry visible to clients. */
const CommandEntrySchema = require_worker_admission.closedObject({
	name: BoundedNonEmptyString(200),
	nativeName: typebox.Type.Optional(BoundedNonEmptyString(200)),
	textAliases: typebox.Type.Optional(typebox.Type.Array(BoundedNonEmptyString(200), { maxItems: 20 })),
	description: typebox.Type.String({ maxLength: COMMAND_DESCRIPTION_MAX_LENGTH }),
	category: typebox.Type.Optional(CommandCategorySchema),
	source: CommandSourceSchema,
	scope: CommandScopeSchema,
	acceptsArgs: typebox.Type.Boolean(),
	args: typebox.Type.Optional(typebox.Type.Array(CommandArgSchema, { maxItems: 20 }))
});
/** Command catalog request filters. */
const CommandsListParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	provider: typebox.Type.Optional(NonEmptyString),
	scope: typebox.Type.Optional(CommandScopeSchema),
	includeArgs: typebox.Type.Optional(typebox.Type.Boolean())
});
require_worker_admission.closedObject({ commands: typebox.Type.Array(CommandEntrySchema, { maxItems: 500 }) });
//#endregion
//#region packages/gateway-protocol/src/schema/config.ts
/**
* Gateway config and update protocol schemas.
*
* These payloads carry raw config text plus optional delivery context so the
* gateway can report edits/restarts back to the originating channel.
*/
const ConfigSchemaLookupPathString = typebox.Type.String({
	minLength: 1,
	maxLength: 1024,
	pattern: "^[A-Za-z0-9_./\\[\\]\\-*]+$"
});
const ConfigDeliveryContextSchema = require_worker_admission.closedObject({
	channel: typebox.Type.Optional(typebox.Type.String()),
	to: typebox.Type.Optional(typebox.Type.String()),
	accountId: typebox.Type.Optional(typebox.Type.String()),
	threadId: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Number()]))
});
/** Empty request payload for reading the current raw config. */
const ConfigGetParamsSchema = require_worker_admission.closedObject({});
/** Full raw config replacement request with optional base hash guard. */
const ConfigSetParamsSchema = require_worker_admission.closedObject({
	raw: NonEmptyString,
	baseHash: typebox.Type.Optional(NonEmptyString)
});
/** Shared config apply/patch payload with optional restart notification context. */
const ConfigApplyLikeParamProperties = {
	raw: NonEmptyString,
	baseHash: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	deliveryContext: typebox.Type.Optional(ConfigDeliveryContextSchema),
	note: typebox.Type.Optional(typebox.Type.String()),
	restartDelayMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
};
/** Raw config apply request that may schedule a restart. */
const ConfigApplyParamsSchema = require_worker_admission.closedObject(ConfigApplyLikeParamProperties);
/** Raw config patch request that may schedule a restart. */
const ConfigPatchParamsSchema = require_worker_admission.closedObject({
	...ConfigApplyLikeParamProperties,
	replacePaths: typebox.Type.Optional(typebox.Type.Array(NonEmptyString, { maxItems: 256 }))
});
/** Empty request payload for fetching the generated config schema. */
const ConfigSchemaParamsSchema = require_worker_admission.closedObject({});
/** Schema lookup request for one config path. */
const ConfigSchemaLookupParamsSchema = require_worker_admission.closedObject({ path: ConfigSchemaLookupPathString });
/** Empty request payload for checking update/restart status. */
const UpdateStatusParamsSchema = require_worker_admission.closedObject({});
/** Request payload for running an update/restart flow with optional channel delivery context. */
const UpdateRunParamsSchema = require_worker_admission.closedObject({
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	deliveryContext: typebox.Type.Optional(ConfigDeliveryContextSchema),
	note: typebox.Type.Optional(typebox.Type.String()),
	continuationMessage: typebox.Type.Optional(typebox.Type.String()),
	restartDelayMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 }))
});
/** UI metadata attached to config schema paths. */
const ConfigUiHintSchema = require_worker_admission.closedObject({
	label: typebox.Type.Optional(typebox.Type.String()),
	help: typebox.Type.Optional(typebox.Type.String()),
	tags: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	group: typebox.Type.Optional(typebox.Type.String()),
	order: typebox.Type.Optional(typebox.Type.Integer()),
	advanced: typebox.Type.Optional(typebox.Type.Boolean()),
	sensitive: typebox.Type.Optional(typebox.Type.Boolean()),
	placeholder: typebox.Type.Optional(typebox.Type.String()),
	itemTemplate: typebox.Type.Optional(typebox.Type.Unknown())
});
require_worker_admission.closedObject({
	schema: typebox.Type.Unknown(),
	uiHints: typebox.Type.Record(typebox.Type.String(), ConfigUiHintSchema),
	version: NonEmptyString,
	generatedAt: NonEmptyString
});
/** Child entry returned when looking up a config schema path. */
const ConfigSchemaLookupChildSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	path: NonEmptyString,
	type: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Array(typebox.Type.String())])),
	required: typebox.Type.Boolean(),
	hasChildren: typebox.Type.Boolean(),
	reloadKind: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("restart"),
		typebox.Type.Literal("hot"),
		typebox.Type.Literal("none")
	])),
	hint: typebox.Type.Optional(ConfigUiHintSchema),
	hintPath: typebox.Type.Optional(typebox.Type.String())
});
/** Schema lookup response for one config path and its immediate children. */
const ConfigSchemaLookupResultSchema = require_worker_admission.closedObject({
	path: NonEmptyString,
	schema: typebox.Type.Unknown(),
	reloadKind: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("restart"),
		typebox.Type.Literal("hot"),
		typebox.Type.Literal("none")
	])),
	hint: typebox.Type.Optional(ConfigUiHintSchema),
	hintPath: typebox.Type.Optional(typebox.Type.String()),
	children: typebox.Type.Array(ConfigSchemaLookupChildSchema)
});
//#endregion
//#region packages/gateway-protocol/src/schema/wizard.ts
/** Runtime state reported for gateway-driven setup wizard sessions. */
const WizardRunStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("running"),
	typebox.Type.Literal("done"),
	typebox.Type.Literal("cancelled"),
	typebox.Type.Literal("error")
]);
/** Starts a setup wizard, optionally scoped to a local or remote workspace. */
const WizardStartParamsSchema = require_worker_admission.closedObject({
	mode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("local"), typebox.Type.Literal("remote")])),
	workspace: typebox.Type.Optional(typebox.Type.String()),
	flow: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("setup"), typebox.Type.Literal("channels")])),
	channel: typebox.Type.Optional(NonEmptyString)
});
/** Client answer payload for the current wizard step. */
const WizardAnswerSchema = require_worker_admission.closedObject({
	stepId: NonEmptyString,
	value: typebox.Type.Optional(typebox.Type.Unknown())
});
/** Advances a wizard session, with an answer when the previous step requested input. */
const WizardNextParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	answer: typebox.Type.Optional(WizardAnswerSchema)
});
/** Shared session-id-only params for cancel and status requests. */
const WizardSessionIdParamsSchema = require_worker_admission.closedObject({ sessionId: NonEmptyString });
/** Cancels an active wizard session. */
const WizardCancelParamsSchema = WizardSessionIdParamsSchema;
/** Reads status for an active or recently completed wizard session. */
const WizardStatusParamsSchema = WizardSessionIdParamsSchema;
/** Selectable value shown in a choice-based wizard step. */
const WizardStepOptionSchema = require_worker_admission.closedObject({
	value: typebox.Type.Unknown(),
	label: NonEmptyString,
	hint: typebox.Type.Optional(typebox.Type.String())
});
const WizardDeviceCodeSchema = require_worker_admission.closedObject({
	code: NonEmptyString,
	expiresInMinutes: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 1440
	})),
	message: typebox.Type.Optional(typebox.Type.String())
});
/** UI contract for one wizard step rendered by gateway clients. */
const WizardStepSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	type: typebox.Type.Union([
		typebox.Type.Literal("note"),
		typebox.Type.Literal("select"),
		typebox.Type.Literal("text"),
		typebox.Type.Literal("confirm"),
		typebox.Type.Literal("multiselect"),
		typebox.Type.Literal("progress"),
		typebox.Type.Literal("action")
	]),
	title: typebox.Type.Optional(typebox.Type.String()),
	message: typebox.Type.Optional(typebox.Type.String()),
	format: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("plain")])),
	options: typebox.Type.Optional(typebox.Type.Array(WizardStepOptionSchema)),
	initialValue: typebox.Type.Optional(typebox.Type.Unknown()),
	placeholder: typebox.Type.Optional(typebox.Type.String()),
	sensitive: typebox.Type.Optional(typebox.Type.Boolean()),
	executor: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("gateway"), typebox.Type.Literal("client")])),
	externalUrl: typebox.Type.Optional(typebox.Type.String()),
	deviceCode: typebox.Type.Optional(WizardDeviceCodeSchema)
});
/** Channel/account pair the channels flow actually configured. */
const WizardConfiguredAccountSchema = require_worker_admission.closedObject({
	channel: NonEmptyString,
	accountId: NonEmptyString
});
/** Common response fields for start and next calls. */
const WizardResultFields = {
	done: typebox.Type.Boolean(),
	step: typebox.Type.Optional(WizardStepSchema),
	status: typebox.Type.Optional(WizardRunStatusSchema),
	error: typebox.Type.Optional(typebox.Type.String()),
	channels: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	accounts: typebox.Type.Optional(typebox.Type.Array(WizardConfiguredAccountSchema))
};
require_worker_admission.closedObject(WizardResultFields);
require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	...WizardResultFields
});
require_worker_admission.closedObject({
	status: WizardRunStatusSchema,
	error: typebox.Type.Optional(typebox.Type.String())
});
//#endregion
//#region packages/gateway-protocol/src/schema/openclaw.ts
/**
* Operator chat lets clients (macOS app onboarding, future UIs) hold the
* setup/repair conversation over the gateway. The gateway live-tests the
* configured inference route before creating a session. Omitting `message`
* returns the welcome/greeting for a verified fresh session without input.
*/
const SystemAgentChatParamsSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	message: typebox.Type.Optional(typebox.Type.String()),
	/** "onboarding" seeds the first-run setup proposal in the greeting. */
	welcomeVariant: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("onboarding")])),
	/** Drop any in-flight approval/wizard state and start the session over. */
	reset: typebox.Type.Optional(typebox.Type.Boolean()),
	/** Host-only regular-agent delegation context. Never model-authored. */
	delegation: typebox.Type.Optional(require_worker_admission.closedObject({
		agentId: typebox.Type.Optional(NonEmptyString),
		sessionKey: typebox.Type.Optional(NonEmptyString),
		turnSourceChannel: typebox.Type.Optional(NonEmptyString),
		turnSourceTo: typebox.Type.Optional(NonEmptyString),
		turnSourceAccountId: typebox.Type.Optional(NonEmptyString),
		turnSourceThreadId: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Number()]))
	}))
});
require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	reply: NonEmptyString,
	/** The next reply is a hosted-wizard secret and clients must mask its input/echo. */
	sensitive: typebox.Type.Optional(typebox.Type.Boolean()),
	action: typebox.Type.Union([
		typebox.Type.Literal("none"),
		typebox.Type.Literal("open-agent"),
		typebox.Type.Literal("exit")
	]),
	needsApproval: typebox.Type.Optional(typebox.Type.Boolean()),
	proposalId: typebox.Type.Optional(NonEmptyString)
});
/**
* Structured first-run inference setup for GUI clients: detect reusable AI
* access (CLI logins, env keys, existing config), then activate one choice.
* Activation live-tests the candidate and persists it only on success, so a
* client can walk the ladder candidate-by-candidate without ever leaving a
* broken default model behind.
*/
const SystemAgentSetupDetectParamsSchema = require_worker_admission.closedObject({});
const ProviderAutoSetupInferenceKind = typebox.Type.TemplateLiteral("provider-auto:${string}", { pattern: "^provider-auto:.+$" });
const SetupInferenceKind = typebox.Type.Union([
	typebox.Type.Literal("existing-model"),
	typebox.Type.Literal("openai-api-key"),
	typebox.Type.Literal("anthropic-api-key"),
	typebox.Type.Literal("claude-cli"),
	typebox.Type.Literal("codex-cli"),
	typebox.Type.Literal("gemini-cli"),
	ProviderAutoSetupInferenceKind
]);
const SetupInferenceStatus = typebox.Type.Union([
	typebox.Type.Literal("ok"),
	typebox.Type.Literal("auth"),
	typebox.Type.Literal("rate_limit"),
	typebox.Type.Literal("billing"),
	typebox.Type.Literal("timeout"),
	typebox.Type.Literal("format"),
	typebox.Type.Literal("unavailable"),
	typebox.Type.Literal("unknown")
]);
const SetupInferenceFailureStatus = typebox.Type.Union([
	typebox.Type.Literal("auth"),
	typebox.Type.Literal("rate_limit"),
	typebox.Type.Literal("billing"),
	typebox.Type.Literal("timeout"),
	typebox.Type.Literal("format"),
	typebox.Type.Literal("unavailable"),
	typebox.Type.Literal("unknown")
]);
require_worker_admission.closedObject({
	candidates: typebox.Type.Array(require_worker_admission.closedObject({
		kind: SetupInferenceKind,
		label: NonEmptyString,
		detail: typebox.Type.String(),
		modelRef: NonEmptyString,
		recommended: typebox.Type.Boolean(),
		/** true: verified; false: definitively logged out; absent: unknown. */
		credentials: typebox.Type.Optional(typebox.Type.Boolean())
	})),
	unavailableCandidates: typebox.Type.Optional(typebox.Type.Array(require_worker_admission.closedObject({
		id: NonEmptyString,
		label: NonEmptyString,
		detail: typebox.Type.String(),
		reason: NonEmptyString
	}))),
	/** Text-inference key/token methods exposed by the Gateway provider registry. */
	manualProviders: typebox.Type.Array(require_worker_admission.closedObject({
		/** Opaque provider-auth choice sent back during activation. */
		id: NonEmptyString,
		label: NonEmptyString,
		hint: typebox.Type.Optional(typebox.Type.String())
	})),
	/** Provider-owned browser and device-code login methods. */
	authOptions: typebox.Type.Optional(typebox.Type.Array(require_worker_admission.closedObject({
		id: NonEmptyString,
		label: NonEmptyString,
		hint: typebox.Type.Optional(typebox.Type.String()),
		groupLabel: typebox.Type.Optional(typebox.Type.String()),
		kind: typebox.Type.Union([typebox.Type.Literal("oauth"), typebox.Type.Literal("device-code")]),
		featured: typebox.Type.Boolean()
	}))),
	workspace: NonEmptyString,
	codexAppServerDetected: typebox.Type.Optional(typebox.Type.Boolean()),
	configuredModel: typebox.Type.Optional(typebox.Type.String()),
	setupComplete: typebox.Type.Boolean()
});
/** Live verification of the Gateway's current default-agent inference route. */
const SystemAgentSetupVerifyParamsSchema = require_worker_admission.closedObject({});
typebox.Type.Union([require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	modelRef: NonEmptyString,
	latencyMs: typebox.Type.Number()
}), require_worker_admission.closedObject({
	ok: typebox.Type.Literal(false),
	status: SetupInferenceFailureStatus,
	error: NonEmptyString
})]);
const SystemAgentSetupActivateParamsSchema = require_worker_admission.closedObject({
	kind: typebox.Type.Union([
		typebox.Type.Literal("existing-model"),
		typebox.Type.Literal("openai-api-key"),
		typebox.Type.Literal("anthropic-api-key"),
		typebox.Type.Literal("claude-cli"),
		typebox.Type.Literal("codex-cli"),
		typebox.Type.Literal("gemini-cli"),
		ProviderAutoSetupInferenceKind,
		typebox.Type.Literal("api-key")
	]),
	/** Exact detected model for this route; prevents detect/activate drift. */
	modelRef: typebox.Type.Optional(NonEmptyString),
	/** Manual step only: opaque provider-auth choice returned by detection. */
	authChoice: typebox.Type.Optional(typebox.Type.String()),
	/** Manual step only: the pasted API key or token; masked by clients, never echoed. */
	apiKey: typebox.Type.Optional(typebox.Type.String()),
	workspace: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	ok: typebox.Type.Boolean(),
	/** Present on success: the model ref that answered the live test. */
	modelRef: typebox.Type.Optional(typebox.Type.String()),
	latencyMs: typebox.Type.Optional(typebox.Type.Number()),
	/** Human-readable setup summary lines (workspace, model, gateway). */
	lines: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	/** Present on failure: coarse bucket for client copy + docs links. */
	status: typebox.Type.Optional(SetupInferenceStatus),
	error: typebox.Type.Optional(typebox.Type.String())
});
/** Starts one provider-owned interactive login as a gateway wizard session. */
const SystemAgentSetupAuthStartParamsSchema = require_worker_admission.closedObject({
	/** Client-generated so cancellation remains possible if the start reply is lost. */
	sessionId: NonEmptyString,
	authChoice: NonEmptyString,
	workspace: typebox.Type.Optional(typebox.Type.String())
});
//#endregion
//#region packages/gateway-protocol/src/schema/cron.ts
/**
* Cron scheduler protocol schemas.
*
* These contracts describe scheduled agent turns, system events, delivery
* routing, run history, and mutable job state shared by gateway RPC clients.
*/
/** Builds create/patch payload variants while preserving per-call field optionality. */
function cronAgentTurnPayloadSchema(params) {
	return require_worker_admission.closedObject({
		kind: typebox.Type.Literal("agentTurn"),
		message: params.message,
		model: typebox.Type.Optional(params.model),
		fallbacks: typebox.Type.Optional(params.fallbacks),
		thinking: typebox.Type.Optional(params.thinking),
		timeoutSeconds: typebox.Type.Optional(typebox.Type.Number({ minimum: 0 })),
		allowUnsafeExternalContent: typebox.Type.Optional(typebox.Type.Boolean()),
		lightContext: typebox.Type.Optional(typebox.Type.Boolean()),
		toolsAllow: typebox.Type.Optional(params.toolsAllow),
		toolsAllowIsDefault: typebox.Type.Optional(typebox.Type.Boolean())
	});
}
/** Builds command payload variants while preserving create/patch argv optionality. */
function cronCommandPayloadSchema(params) {
	return require_worker_admission.closedObject({
		kind: typebox.Type.Literal("command"),
		argv: params.argv,
		cwd: typebox.Type.Optional(typebox.Type.String({ minLength: 1 })),
		env: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String({ minLength: 1 }), typebox.Type.String())),
		input: typebox.Type.Optional(typebox.Type.String()),
		timeoutSeconds: typebox.Type.Optional(typebox.Type.Number({ minimum: 0 })),
		noOutputTimeoutSeconds: typebox.Type.Optional(typebox.Type.Number({ minimum: 0 })),
		outputMaxBytes: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
		toolsAllow: typebox.Type.Optional(params.toolsAllow),
		toolsAllowIsDefault: typebox.Type.Optional(typebox.Type.Boolean())
	});
}
/** Session target accepted by cron jobs. */
const CronSessionTargetSchema = typebox.Type.Union([
	typebox.Type.Literal("main"),
	typebox.Type.Literal("isolated"),
	typebox.Type.Literal("current"),
	typebox.Type.String({ pattern: "^session:.+" })
]);
/** Whether a cron job waits for heartbeat processing or wakes immediately. */
const CronWakeModeSchema = typebox.Type.Union([typebox.Type.Literal("next-heartbeat"), typebox.Type.Literal("now")]);
/** Run status factory reused for the active field and deprecated alias metadata. */
function cronRunStatusSchema(options = {}) {
	return typebox.Type.Union([
		typebox.Type.Literal("ok"),
		typebox.Type.Literal("error"),
		typebox.Type.Literal("skipped")
	], options);
}
const CronRunStatusSchema = cronRunStatusSchema();
const CronConfigRevisionSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 128
});
const DeprecatedCronRunStatusSchema = cronRunStatusSchema({
	deprecated: true,
	description: "Deprecated alias for lastRunStatus."
});
const CronSortDirSchema = typebox.Type.Union([typebox.Type.Literal("asc"), typebox.Type.Literal("desc")]);
const CronJobsEnabledFilterSchema = typebox.Type.Union([
	typebox.Type.Literal("all"),
	typebox.Type.Literal("enabled"),
	typebox.Type.Literal("disabled")
]);
const CronJobsScheduleKindFilterSchema = typebox.Type.Union([
	typebox.Type.Literal("all"),
	typebox.Type.Literal("at"),
	typebox.Type.Literal("every"),
	typebox.Type.Literal("cron"),
	typebox.Type.Literal("on-exit")
]);
const CronJobsLastRunStatusFilterSchema = typebox.Type.Union([
	typebox.Type.Literal("all"),
	typebox.Type.Literal("ok"),
	typebox.Type.Literal("error"),
	typebox.Type.Literal("skipped"),
	typebox.Type.Literal("unknown")
]);
const CronJobsSortBySchema = typebox.Type.Union([
	typebox.Type.Literal("nextRunAtMs"),
	typebox.Type.Literal("updatedAtMs"),
	typebox.Type.Literal("name")
]);
const CronRunsStatusFilterSchema = typebox.Type.Union([
	typebox.Type.Literal("all"),
	typebox.Type.Literal("ok"),
	typebox.Type.Literal("error"),
	typebox.Type.Literal("skipped")
]);
const CronRunsStatusValueSchema = typebox.Type.Union([
	typebox.Type.Literal("ok"),
	typebox.Type.Literal("error"),
	typebox.Type.Literal("skipped")
]);
const CronDeliveryStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("delivered"),
	typebox.Type.Literal("not-delivered"),
	typebox.Type.Literal("unknown"),
	typebox.Type.Literal("not-requested")
]);
const NonBlankString = typebox.Type.String({
	minLength: 1,
	pattern: "\\S"
});
const CronDeclarationKeySchema = typebox.Type.String({
	minLength: 1,
	maxLength: 200,
	pattern: "\\S"
});
const CronDisplayNameSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 200,
	pattern: "\\S"
});
const CronOwnerSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(NonEmptyString)
});
const CronAnnounceChannelSchema = typebox.Type.Union([typebox.Type.Literal("last"), NonBlankString]);
const CronFailoverReasonSchema = typebox.Type.Union([
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
const CronRunDiagnosticSeveritySchema = typebox.Type.Union([
	typebox.Type.Literal("info"),
	typebox.Type.Literal("warn"),
	typebox.Type.Literal("error")
]);
const CronRunDiagnosticSourceSchema = typebox.Type.Union([
	typebox.Type.Literal("cron-preflight"),
	typebox.Type.Literal("cron-setup"),
	typebox.Type.Literal("model-preflight"),
	typebox.Type.Literal("agent-run"),
	typebox.Type.Literal("tool"),
	typebox.Type.Literal("exec"),
	typebox.Type.Literal("delivery")
]);
const CronRunDiagnosticSchema = require_worker_admission.closedObject({
	ts: typebox.Type.Integer({ minimum: 0 }),
	source: CronRunDiagnosticSourceSchema,
	severity: CronRunDiagnosticSeveritySchema,
	message: typebox.Type.String(),
	toolName: typebox.Type.Optional(typebox.Type.String()),
	exitCode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Number(), typebox.Type.Null()])),
	truncated: typebox.Type.Optional(typebox.Type.Boolean())
});
const CronRunDiagnosticsSchema = require_worker_admission.closedObject({
	summary: typebox.Type.Optional(typebox.Type.String()),
	entries: typebox.Type.Array(CronRunDiagnosticSchema)
});
const CronCommonOptionalFields = {
	agentId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	sessionKey: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	description: typebox.Type.Optional(typebox.Type.String()),
	enabled: typebox.Type.Optional(typebox.Type.Boolean()),
	deleteAfterRun: typebox.Type.Optional(typebox.Type.Boolean())
};
function cronIdOrJobIdParams(extraFields) {
	return typebox.Type.Union([require_worker_admission.closedObject({
		id: NonEmptyString,
		...extraFields
	}), require_worker_admission.closedObject({
		jobId: NonEmptyString,
		...extraFields
	})]);
}
const CronRunLogJobIdSchema = typebox.Type.String({
	minLength: 1,
	pattern: "^[^/\\\\]+$"
});
/** Schedule expression for one-time, interval, or cron-expression jobs. */
const CronScheduleSchema = typebox.Type.Union([
	require_worker_admission.closedObject({
		kind: typebox.Type.Literal("at"),
		at: NonEmptyString
	}),
	require_worker_admission.closedObject({
		kind: typebox.Type.Literal("every"),
		everyMs: typebox.Type.Integer({
			minimum: 1,
			maximum: Number.MAX_SAFE_INTEGER
		}),
		anchorMs: typebox.Type.Optional(typebox.Type.Integer({
			minimum: 0,
			maximum: Number.MAX_SAFE_INTEGER
		}))
	}),
	require_worker_admission.closedObject({
		kind: typebox.Type.Literal("cron"),
		expr: NonEmptyString,
		tz: typebox.Type.Optional(typebox.Type.String()),
		staggerMs: typebox.Type.Optional(typebox.Type.Integer({
			minimum: 0,
			maximum: Number.MAX_SAFE_INTEGER
		}))
	}),
	require_worker_admission.closedObject({
		kind: typebox.Type.Literal("on-exit"),
		command: NonEmptyString,
		cwd: typebox.Type.Optional(NonEmptyString)
	})
]);
/** Headless condition script evaluated before a recurring cron payload runs. */
const CronTriggerSchema = require_worker_admission.closedObject({
	script: typebox.Type.String({
		minLength: 1,
		maxLength: 65536
	}),
	once: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Full cron payload for new jobs. */
const CronPayloadSchema = typebox.Type.Union([
	require_worker_admission.closedObject({
		kind: typebox.Type.Literal("systemEvent"),
		text: NonEmptyString,
		toolsAllow: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
		toolsAllowIsDefault: typebox.Type.Optional(typebox.Type.Boolean())
	}),
	cronAgentTurnPayloadSchema({
		message: NonEmptyString,
		model: typebox.Type.String(),
		fallbacks: typebox.Type.Array(typebox.Type.String()),
		toolsAllow: typebox.Type.Array(typebox.Type.String()),
		thinking: typebox.Type.String()
	}),
	cronCommandPayloadSchema({
		argv: typebox.Type.Array(NonEmptyString, { minItems: 1 }),
		toolsAllow: typebox.Type.Array(typebox.Type.String())
	})
]);
/** Partial cron payload for job updates. */
const CronPayloadPatchSchema = typebox.Type.Union([
	require_worker_admission.closedObject({
		kind: typebox.Type.Literal("systemEvent"),
		text: typebox.Type.Optional(NonEmptyString),
		toolsAllow: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Array(typebox.Type.String()), typebox.Type.Null()])),
		toolsAllowIsDefault: typebox.Type.Optional(typebox.Type.Boolean())
	}),
	cronAgentTurnPayloadSchema({
		message: typebox.Type.Optional(NonEmptyString),
		model: typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()]),
		fallbacks: typebox.Type.Union([typebox.Type.Array(typebox.Type.String()), typebox.Type.Null()]),
		toolsAllow: typebox.Type.Union([typebox.Type.Array(typebox.Type.String()), typebox.Type.Null()]),
		thinking: typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])
	}),
	cronCommandPayloadSchema({
		argv: typebox.Type.Optional(typebox.Type.Array(NonEmptyString, { minItems: 1 })),
		toolsAllow: typebox.Type.Union([typebox.Type.Array(typebox.Type.String()), typebox.Type.Null()])
	})
]);
/** Failure alert policy for repeated cron run failures. */
const CronFailureAlertSchema = require_worker_admission.closedObject({
	after: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	channel: typebox.Type.Optional(CronAnnounceChannelSchema),
	to: typebox.Type.Optional(NonBlankString),
	cooldownMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	includeSkipped: typebox.Type.Optional(typebox.Type.Boolean()),
	mode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("announce"), typebox.Type.Literal("webhook")])),
	accountId: typebox.Type.Optional(NonEmptyString)
});
/** Delivery destination used when failure alerts need a separate target. */
const CronFailureDestinationSchema = require_worker_admission.closedObject({
	channel: typebox.Type.Optional(CronAnnounceChannelSchema),
	to: typebox.Type.Optional(NonBlankString),
	accountId: typebox.Type.Optional(NonEmptyString),
	mode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("announce"), typebox.Type.Literal("webhook")]))
});
const CronFailureDestinationPatchSchema = require_worker_admission.closedObject({
	channel: typebox.Type.Optional(typebox.Type.Union([CronAnnounceChannelSchema, typebox.Type.Null()])),
	to: typebox.Type.Optional(typebox.Type.Union([NonBlankString, typebox.Type.Null()])),
	accountId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	mode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("announce"),
		typebox.Type.Literal("webhook"),
		typebox.Type.Null()
	]))
});
const CronCompletionDestinationSchema = require_worker_admission.closedObject({
	mode: typebox.Type.Literal("webhook"),
	to: NonBlankString
});
const CronDeliverySharedProperties = {
	channel: typebox.Type.Optional(CronAnnounceChannelSchema),
	threadId: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Number()])),
	accountId: typebox.Type.Optional(NonEmptyString),
	bestEffort: typebox.Type.Optional(typebox.Type.Boolean()),
	failureDestination: typebox.Type.Optional(CronFailureDestinationSchema)
};
const CronDeliveryPatchSharedProperties = {
	channel: typebox.Type.Optional(typebox.Type.Union([CronAnnounceChannelSchema, typebox.Type.Null()])),
	threadId: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.String(),
		typebox.Type.Number(),
		typebox.Type.Null()
	])),
	accountId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	bestEffort: typebox.Type.Optional(typebox.Type.Boolean()),
	failureDestination: typebox.Type.Optional(typebox.Type.Union([CronFailureDestinationPatchSchema, typebox.Type.Null()]))
};
const CronDeliveryNoopSchema = require_worker_admission.closedObject({
	mode: typebox.Type.Literal("none"),
	...CronDeliverySharedProperties,
	to: typebox.Type.Optional(NonBlankString)
});
const CronDeliveryAnnounceSchema = require_worker_admission.closedObject({
	mode: typebox.Type.Literal("announce"),
	...CronDeliverySharedProperties,
	completionDestination: typebox.Type.Optional(CronCompletionDestinationSchema),
	to: typebox.Type.Optional(NonBlankString)
});
const CronDeliveryWebhookSchema = require_worker_admission.closedObject({
	mode: typebox.Type.Literal("webhook"),
	...CronDeliverySharedProperties,
	to: NonBlankString
});
/** Delivery policy for cron run output. */
const CronDeliverySchema = typebox.Type.Union([
	CronDeliveryNoopSchema,
	CronDeliveryAnnounceSchema,
	CronDeliveryWebhookSchema
]);
/** Patch shape for cron delivery policy updates. */
const CronDeliveryPatchSchema = require_worker_admission.closedObject({
	mode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("none"),
		typebox.Type.Literal("announce"),
		typebox.Type.Literal("webhook")
	])),
	...CronDeliveryPatchSharedProperties,
	completionDestination: typebox.Type.Optional(typebox.Type.Union([CronCompletionDestinationSchema, typebox.Type.Null()])),
	to: typebox.Type.Optional(typebox.Type.Union([NonBlankString, typebox.Type.Null()]))
});
const CronFailureNotificationDeliverySchema = require_worker_admission.closedObject({
	delivered: typebox.Type.Optional(typebox.Type.Boolean()),
	status: CronDeliveryStatusSchema,
	error: typebox.Type.Optional(typebox.Type.String())
});
/** Scheduler-maintained state for the latest run/delivery outcome. */
const CronJobStateSchema = require_worker_admission.closedObject({
	nextRunAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	runningAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastRunAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastRunStatus: typebox.Type.Optional(CronRunStatusSchema),
	lastStatus: typebox.Type.Optional(DeprecatedCronRunStatusSchema),
	lastError: typebox.Type.Optional(typebox.Type.String()),
	lastDiagnostics: typebox.Type.Optional(CronRunDiagnosticsSchema),
	lastDiagnosticSummary: typebox.Type.Optional(typebox.Type.String()),
	lastErrorReason: typebox.Type.Optional(CronFailoverReasonSchema),
	lastDurationMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	consecutiveErrors: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	consecutiveSkipped: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastDelivered: typebox.Type.Optional(typebox.Type.Boolean()),
	lastDeliveryStatus: typebox.Type.Optional(CronDeliveryStatusSchema),
	lastDeliveryError: typebox.Type.Optional(typebox.Type.String()),
	lastFailureNotificationDelivered: typebox.Type.Optional(typebox.Type.Boolean()),
	lastFailureNotificationDeliveryStatus: typebox.Type.Optional(CronDeliveryStatusSchema),
	lastFailureNotificationDeliveryError: typebox.Type.Optional(typebox.Type.String()),
	lastFailureAlertAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastTriggerEvalAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	triggerEvalCount: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastTriggerFireAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	triggerState: typebox.Type.Optional(typebox.Type.Unknown())
});
const CronJobStatePatchSchema = require_worker_admission.closedObject({
	nextRunAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	runningAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastRunAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastRunStatus: typebox.Type.Optional(CronRunStatusSchema),
	lastStatus: typebox.Type.Optional(DeprecatedCronRunStatusSchema),
	lastError: typebox.Type.Optional(typebox.Type.String()),
	lastErrorReason: typebox.Type.Optional(CronFailoverReasonSchema),
	lastDurationMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	consecutiveErrors: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	consecutiveSkipped: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastDelivered: typebox.Type.Optional(typebox.Type.Boolean()),
	lastDeliveryStatus: typebox.Type.Optional(CronDeliveryStatusSchema),
	lastDeliveryError: typebox.Type.Optional(typebox.Type.String()),
	lastFailureNotificationDelivered: typebox.Type.Optional(typebox.Type.Boolean()),
	lastFailureNotificationDeliveryStatus: typebox.Type.Optional(CronDeliveryStatusSchema),
	lastFailureNotificationDeliveryError: typebox.Type.Optional(typebox.Type.String()),
	lastFailureAlertAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastTriggerEvalAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	triggerEvalCount: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastTriggerFireAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	triggerState: typebox.Type.Optional(typebox.Type.Unknown())
});
/** Persisted cron job definition returned by scheduler list/get APIs. */
const CronJobSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	declarationKey: typebox.Type.Optional(CronDeclarationKeySchema),
	displayName: typebox.Type.Optional(CronDisplayNameSchema),
	owner: typebox.Type.Optional(CronOwnerSchema),
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(NonEmptyString),
	name: NonEmptyString,
	description: typebox.Type.Optional(typebox.Type.String()),
	enabled: typebox.Type.Boolean(),
	deleteAfterRun: typebox.Type.Optional(typebox.Type.Boolean()),
	createdAtMs: typebox.Type.Integer({ minimum: 0 }),
	updatedAtMs: typebox.Type.Integer({ minimum: 0 }),
	/** Opaque Gateway-computed token for the job definition, excluding scheduler state. */
	configRevision: typebox.Type.Optional(CronConfigRevisionSchema),
	schedule: CronScheduleSchema,
	trigger: typebox.Type.Optional(CronTriggerSchema),
	sessionTarget: CronSessionTargetSchema,
	wakeMode: CronWakeModeSchema,
	payload: CronPayloadSchema,
	delivery: typebox.Type.Optional(CronDeliverySchema),
	failureAlert: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal(false), CronFailureAlertSchema])),
	state: CronJobStateSchema,
	nextRunAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastRunAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastRunStatus: typebox.Type.Optional(CronRunStatusSchema),
	lastRunError: typebox.Type.Optional(typebox.Type.String()),
	lastDelivered: typebox.Type.Optional(typebox.Type.Boolean()),
	lastDeliveryStatus: typebox.Type.Optional(CronDeliveryStatusSchema),
	lastDeliveryError: typebox.Type.Optional(typebox.Type.String()),
	lastFailureNotificationDelivered: typebox.Type.Optional(typebox.Type.Boolean()),
	lastFailureNotificationDeliveryStatus: typebox.Type.Optional(CronDeliveryStatusSchema),
	lastFailureNotificationDeliveryError: typebox.Type.Optional(typebox.Type.String())
});
/** Query params for listing cron jobs with filters and pagination. */
const CronListParamsSchema = require_worker_admission.closedObject({
	includeDisabled: typebox.Type.Optional(typebox.Type.Boolean()),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 200
	})),
	offset: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	query: typebox.Type.Optional(typebox.Type.String()),
	enabled: typebox.Type.Optional(CronJobsEnabledFilterSchema),
	scheduleKind: typebox.Type.Optional(CronJobsScheduleKindFilterSchema),
	lastRunStatus: typebox.Type.Optional(CronJobsLastRunStatusFilterSchema),
	sortBy: typebox.Type.Optional(CronJobsSortBySchema),
	sortDir: typebox.Type.Optional(CronSortDirSchema),
	agentId: typebox.Type.Optional(NonEmptyString),
	compact: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Empty request payload for scheduler status. */
const CronStatusParamsSchema = require_worker_admission.closedObject({});
/** Looks up a job by stable id or legacy jobId alias. */
const CronGetParamsSchema = cronIdOrJobIdParams({});
/** Creates a scheduled job with schedule, target, payload, and delivery policy. */
const CronAddParamsSchema = require_worker_admission.closedObject({
	name: NonEmptyString,
	declarationKey: typebox.Type.Optional(CronDeclarationKeySchema),
	displayName: typebox.Type.Optional(CronDisplayNameSchema),
	owner: typebox.Type.Optional(CronOwnerSchema),
	...CronCommonOptionalFields,
	schedule: CronScheduleSchema,
	trigger: typebox.Type.Optional(CronTriggerSchema),
	sessionTarget: CronSessionTargetSchema,
	wakeMode: CronWakeModeSchema,
	payload: CronPayloadSchema,
	delivery: typebox.Type.Optional(CronDeliverySchema),
	failureAlert: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal(false), CronFailureAlertSchema]))
});
/** Successful declaration-key convergence result. */
const CronDeclarativeAddResultSchema = require_worker_admission.closedObject({
	created: typebox.Type.Boolean(),
	updated: typebox.Type.Optional(typebox.Type.Boolean()),
	job: CronJobSchema
});
typebox.Type.Union([CronJobSchema, CronDeclarativeAddResultSchema]);
/** Updates a cron job by id or legacy jobId alias. */
const CronUpdateParamsSchema = cronIdOrJobIdParams({
	patch: require_worker_admission.closedObject({
		name: typebox.Type.Optional(NonEmptyString),
		displayName: typebox.Type.Optional(typebox.Type.Union([CronDisplayNameSchema, typebox.Type.Null()])),
		...CronCommonOptionalFields,
		schedule: typebox.Type.Optional(CronScheduleSchema),
		trigger: typebox.Type.Optional(typebox.Type.Union([CronTriggerSchema, typebox.Type.Null()])),
		sessionTarget: typebox.Type.Optional(CronSessionTargetSchema),
		wakeMode: typebox.Type.Optional(CronWakeModeSchema),
		payload: typebox.Type.Optional(CronPayloadPatchSchema),
		delivery: typebox.Type.Optional(CronDeliveryPatchSchema),
		failureAlert: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal(false), CronFailureAlertSchema])),
		state: typebox.Type.Optional(CronJobStatePatchSchema)
	}),
	/** Rejects the patch when the current definition does not match the caller's token. */
	expectedConfigRevision: typebox.Type.Optional(CronConfigRevisionSchema)
});
/** Removes a cron job by id or legacy jobId alias. */
const CronRemoveParamsSchema = cronIdOrJobIdParams({});
/** Runs a cron job immediately or only if due. */
const CronRunParamsSchema = cronIdOrJobIdParams({
	mode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("due"), typebox.Type.Literal("force")])),
	/** Rejects the mutation if the Gateway restarted after the caller's preflight. */
	expectedProcessInstanceId: typebox.Type.Optional(NonEmptyString)
});
/** Query params for cron run history. */
const CronRunsParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	scope: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("job"), typebox.Type.Literal("all")])),
	id: typebox.Type.Optional(CronRunLogJobIdSchema),
	jobId: typebox.Type.Optional(CronRunLogJobIdSchema),
	runId: typebox.Type.Optional(NonEmptyString),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 200
	})),
	offset: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	statuses: typebox.Type.Optional(typebox.Type.Array(CronRunsStatusValueSchema, {
		minItems: 1,
		maxItems: 3
	})),
	status: typebox.Type.Optional(CronRunsStatusFilterSchema),
	deliveryStatuses: typebox.Type.Optional(typebox.Type.Array(CronDeliveryStatusSchema, {
		minItems: 1,
		maxItems: 4
	})),
	deliveryStatus: typebox.Type.Optional(CronDeliveryStatusSchema),
	query: typebox.Type.Optional(typebox.Type.String()),
	sortDir: typebox.Type.Optional(CronSortDirSchema)
});
require_worker_admission.closedObject({
	ts: typebox.Type.Integer({ minimum: 0 }),
	jobId: NonEmptyString,
	action: typebox.Type.Literal("finished"),
	status: typebox.Type.Optional(CronRunStatusSchema),
	error: typebox.Type.Optional(typebox.Type.String()),
	errorReason: typebox.Type.Optional(CronFailoverReasonSchema),
	summary: typebox.Type.Optional(typebox.Type.String()),
	diagnostics: typebox.Type.Optional(CronRunDiagnosticsSchema),
	delivered: typebox.Type.Optional(typebox.Type.Boolean()),
	deliveryStatus: typebox.Type.Optional(CronDeliveryStatusSchema),
	deliveryError: typebox.Type.Optional(typebox.Type.String()),
	failureNotificationDelivery: typebox.Type.Optional(CronFailureNotificationDeliverySchema),
	sessionId: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	runAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	durationMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	nextRunAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	triggerFired: typebox.Type.Optional(typebox.Type.Boolean()),
	model: typebox.Type.Optional(typebox.Type.String()),
	provider: typebox.Type.Optional(typebox.Type.String()),
	usage: typebox.Type.Optional(require_worker_admission.closedObject({
		input_tokens: typebox.Type.Optional(typebox.Type.Number()),
		output_tokens: typebox.Type.Optional(typebox.Type.Number()),
		total_tokens: typebox.Type.Optional(typebox.Type.Number()),
		cache_read_tokens: typebox.Type.Optional(typebox.Type.Number()),
		cache_write_tokens: typebox.Type.Optional(typebox.Type.Number())
	})),
	jobName: typebox.Type.Optional(typebox.Type.String())
});
//#endregion
//#region packages/gateway-protocol/src/schema/environments.ts
/**
* Environment inventory protocol schemas.
*
* Environments are runtime targets such as local hosts, VMs, or remote workers;
* this schema layer only describes their gateway-visible status summary.
*/
/** Runtime availability state for an environment target. */
const EnvironmentStatusSchema = typebox.Type.String({ enum: [
	"available",
	"unavailable",
	"starting",
	"stopping",
	"error"
] });
/** Durable lifecycle states for plugin-provisioned worker environments. */
const WorkerEnvironmentStateSchema = typebox.Type.Union([
	typebox.Type.Literal("requested"),
	typebox.Type.Literal("provisioning"),
	typebox.Type.Literal("bootstrapping"),
	typebox.Type.Literal("ready"),
	typebox.Type.Literal("attached"),
	typebox.Type.Literal("idle"),
	typebox.Type.Literal("draining"),
	typebox.Type.Literal("destroying"),
	typebox.Type.Literal("destroyed"),
	typebox.Type.Literal("failed"),
	typebox.Type.Literal("orphaned")
]);
/** Process-local SSH tunnel connectivity for a worker environment. */
const WorkerTunnelStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("stopped"),
	typebox.Type.Literal("connecting"),
	typebox.Type.Literal("connected"),
	typebox.Type.Literal("reconnecting")
]);
/** Worker-only lifecycle metadata layered onto the existing environment projection. */
const WorkerEnvironmentMetadataSchema = require_worker_admission.closedObject({
	providerId: NonEmptyString,
	leaseId: typebox.Type.Optional(NonEmptyString),
	state: WorkerEnvironmentStateSchema,
	ageMs: typebox.Type.Integer({ minimum: 0 }),
	idleMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	attachedSessionIds: typebox.Type.Array(NonEmptyString),
	tunnelStatus: WorkerTunnelStatusSchema
});
function createEnvironmentSummarySchema() {
	return require_worker_admission.closedObject({
		id: NonEmptyString,
		type: NonEmptyString,
		label: typebox.Type.Optional(NonEmptyString),
		status: EnvironmentStatusSchema,
		capabilities: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
		worker: typebox.Type.Optional(WorkerEnvironmentMetadataSchema)
	});
}
/** Public environment summary shown in listings and status responses. */
const EnvironmentSummarySchema = createEnvironmentSummarySchema();
/** Empty request payload for listing known environments. */
const EnvironmentsListParamsSchema = require_worker_admission.closedObject({});
/** Configured worker target exposed without provider settings or credentials. */
const WorkerEnvironmentProfileSummarySchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	providerId: NonEmptyString
});
require_worker_admission.closedObject({
	environments: typebox.Type.Array(EnvironmentSummarySchema),
	profiles: typebox.Type.Optional(typebox.Type.Array(WorkerEnvironmentProfileSummarySchema))
});
/** Status lookup request for one environment id. */
const EnvironmentsStatusParamsSchema = require_worker_admission.closedObject({ environmentId: NonEmptyString });
createEnvironmentSummarySchema();
/** Creates a worker environment from one configured provider profile. */
const EnvironmentsCreateParamsSchema = require_worker_admission.closedObject({
	profileId: NonEmptyString,
	idempotencyKey: NonEmptyString
});
createEnvironmentSummarySchema();
/** Destroys one durable worker environment by its gateway-owned id. */
const EnvironmentsDestroyParamsSchema = require_worker_admission.closedObject({
	environmentId: NonEmptyString,
	force: typebox.Type.Optional(typebox.Type.Boolean())
});
createEnvironmentSummarySchema();
//#endregion
//#region packages/gateway-protocol/src/schema/exec-approvals.ts
/**
* Exec approval protocol schemas.
*
* These payloads cross the security-review boundary for command execution, so
* persisted policy, request snapshots, and resolve decisions stay explicit.
*/
/** One persisted allowlist entry for a command pattern or resolved executable. */
const ExecApprovalsAllowlistEntrySchema = require_worker_admission.closedObject({
	id: typebox.Type.Optional(NonEmptyString),
	pattern: typebox.Type.String(),
	source: typebox.Type.Optional(typebox.Type.Literal("allow-always")),
	commandText: typebox.Type.Optional(typebox.Type.String()),
	argPattern: typebox.Type.Optional(typebox.Type.String()),
	lastUsedAt: typebox.Type.Optional(typebox.Type.Number({ minimum: 0 })),
	lastUsedCommand: typebox.Type.Optional(typebox.Type.String()),
	lastResolvedPath: typebox.Type.Optional(typebox.Type.String())
});
const ExecApprovalsPolicyFields = {
	security: typebox.Type.Optional(typebox.Type.String()),
	ask: typebox.Type.Optional(typebox.Type.String()),
	askFallback: typebox.Type.Optional(typebox.Type.String()),
	autoAllowSkills: typebox.Type.Optional(typebox.Type.Boolean())
};
const ExecSecuritySchema = typebox.Type.Union([
	typebox.Type.Literal("deny"),
	typebox.Type.Literal("allowlist"),
	typebox.Type.Literal("full")
]);
/** Host-resolved default policy after applying persisted defaults and runtime fallbacks. */
const ExecApprovalsResolvedDefaultsSchema = require_worker_admission.closedObject({
	security: ExecSecuritySchema,
	ask: typebox.Type.Union([
		typebox.Type.Literal("off"),
		typebox.Type.Literal("on-miss"),
		typebox.Type.Literal("always")
	]),
	askFallback: ExecSecuritySchema,
	autoAllowSkills: typebox.Type.Boolean()
});
/** Default exec approval policy shared by all agents unless overridden. */
const ExecApprovalsDefaultsSchema = require_worker_admission.closedObject(ExecApprovalsPolicyFields);
/** Agent-specific exec approval policy and allowlist. */
const ExecApprovalsAgentSchema = require_worker_admission.closedObject({
	...ExecApprovalsPolicyFields,
	allowlist: typebox.Type.Optional(typebox.Type.Array(ExecApprovalsAllowlistEntrySchema))
});
/** Versioned exec approvals config file edited through gateway APIs. */
const ExecApprovalsFileSchema = require_worker_admission.closedObject({
	version: typebox.Type.Literal(1),
	socket: typebox.Type.Optional(require_worker_admission.closedObject({
		path: typebox.Type.Optional(typebox.Type.String()),
		token: typebox.Type.Optional(typebox.Type.String())
	})),
	defaults: typebox.Type.Optional(ExecApprovalsDefaultsSchema),
	agents: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), ExecApprovalsAgentSchema))
});
require_worker_admission.closedObject({
	path: NonEmptyString,
	exists: typebox.Type.Boolean(),
	hash: NonEmptyString,
	file: ExecApprovalsFileSchema
});
const NativeExecApprovalActionSchema = typebox.Type.Union([
	typebox.Type.Literal("allow"),
	typebox.Type.Literal("deny"),
	typebox.Type.Literal("prompt")
]);
/** One rule owned and enforced by a host-native exec policy implementation. */
const NativeExecApprovalRuleSchema = require_worker_admission.closedObject({
	pattern: NonEmptyString,
	action: NativeExecApprovalActionSchema,
	shells: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	description: typebox.Type.Optional(typebox.Type.String()),
	enabled: typebox.Type.Optional(typebox.Type.Boolean())
});
const NativeExecApprovalConstraintsSchema = require_worker_admission.closedObject({
	baseHashRequired: typebox.Type.Optional(typebox.Type.Boolean()),
	defaultAllowAllowed: typebox.Type.Optional(typebox.Type.Boolean()),
	broadAllowRulesAllowed: typebox.Type.Optional(typebox.Type.Boolean()),
	dangerousAllowRulesAllowed: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Node read snapshot supporting file-backed and host-native approval owners. */
const ExecApprovalsNodeSnapshotSchema = typebox.Type.Object({
	path: typebox.Type.Optional(typebox.Type.String()),
	exists: typebox.Type.Optional(typebox.Type.Boolean()),
	hash: typebox.Type.Optional(typebox.Type.String()),
	file: typebox.Type.Optional(ExecApprovalsFileSchema),
	resolvedDefaults: typebox.Type.Optional(ExecApprovalsResolvedDefaultsSchema),
	enabled: typebox.Type.Optional(typebox.Type.Boolean()),
	baseHash: typebox.Type.Optional(NonEmptyString),
	defaultAction: typebox.Type.Optional(NativeExecApprovalActionSchema),
	rules: typebox.Type.Optional(typebox.Type.Array(NativeExecApprovalRuleSchema)),
	constraints: typebox.Type.Optional(NativeExecApprovalConstraintsSchema),
	message: typebox.Type.Optional(typebox.Type.String())
}, {
	additionalProperties: false,
	oneOf: [
		{
			required: [
				"path",
				"exists",
				"hash",
				"file"
			],
			not: { anyOf: [
				{ required: ["enabled"] },
				{ required: ["baseHash"] },
				{ required: ["defaultAction"] },
				{ required: ["rules"] },
				{ required: ["constraints"] },
				{ required: ["message"] }
			] }
		},
		{
			properties: {
				enabled: { const: true },
				hash: { minLength: 1 }
			},
			required: [
				"enabled",
				"hash",
				"defaultAction",
				"rules"
			],
			not: { anyOf: [
				{ required: ["path"] },
				{ required: ["exists"] },
				{ required: ["file"] },
				{ required: ["resolvedDefaults"] },
				{ required: ["message"] }
			] }
		},
		{
			properties: { enabled: { const: false } },
			required: ["enabled"],
			not: { anyOf: [
				{ required: ["path"] },
				{ required: ["exists"] },
				{ required: ["hash"] },
				{ required: ["file"] },
				{ required: ["resolvedDefaults"] },
				{ required: ["baseHash"] },
				{ required: ["defaultAction"] },
				{ required: ["rules"] },
				{ required: ["constraints"] }
			] }
		}
	]
});
/** Empty request payload for reading local exec approval policy. */
const ExecApprovalsGetParamsSchema = require_worker_admission.closedObject({});
/** Local exec approval policy write request with optional base hash guard. */
const ExecApprovalsSetParamsSchema = require_worker_admission.closedObject({
	file: ExecApprovalsFileSchema,
	baseHash: typebox.Type.Optional(NonEmptyString)
});
/** Node-scoped request payload for reading exec approval policy. */
const ExecApprovalsNodeGetParamsSchema = require_worker_admission.closedObject({ nodeId: NonEmptyString });
/** Writable host-native policy fields; the node remains the validation authority. */
const NativeExecApprovalPolicySchema = require_worker_admission.closedObject({
	defaultAction: typebox.Type.Optional(NativeExecApprovalActionSchema),
	rules: typebox.Type.Array(NativeExecApprovalRuleSchema)
});
/** Node-scoped write for exactly one file-backed or host-native approval owner. */
const ExecApprovalsNodeSetParamsSchema = typebox.Type.Object({
	nodeId: NonEmptyString,
	file: typebox.Type.Optional(ExecApprovalsFileSchema),
	native: typebox.Type.Optional(NativeExecApprovalPolicySchema),
	baseHash: typebox.Type.Optional(NonEmptyString)
}, {
	additionalProperties: false,
	oneOf: [{
		required: ["file"],
		not: { required: ["native"] }
	}, {
		required: ["native", "baseHash"],
		not: { required: ["file"] }
	}]
});
/** Lookup request for one pending exec approval by id. */
const ExecApprovalGetParamsSchema = require_worker_admission.closedObject({ id: NonEmptyString });
const ExecApprovalPolicySecuritySchema = typebox.Type.Union([
	typebox.Type.Literal("deny"),
	typebox.Type.Literal("allowlist"),
	typebox.Type.Literal("full")
]);
const ExecApprovalPolicySnapshotSchema = require_worker_admission.closedObject({
	security: ExecApprovalPolicySecuritySchema,
	ask: typebox.Type.Union([
		typebox.Type.Literal("off"),
		typebox.Type.Literal("on-miss"),
		typebox.Type.Literal("always")
	]),
	askFallback: ExecApprovalPolicySecuritySchema,
	autoAllowSkills: typebox.Type.Boolean(),
	allowlistRules: typebox.Type.Array(require_worker_admission.closedObject({
		pattern: typebox.Type.String(),
		argPattern: typebox.Type.Optional(typebox.Type.String()),
		source: typebox.Type.Optional(typebox.Type.Literal("allow-always"))
	}))
});
/** Pending command execution approval request shown to reviewers. */
const ExecApprovalRequestParamsSchema = require_worker_admission.closedObject({
	id: typebox.Type.Optional(NonEmptyString),
	command: typebox.Type.Optional(NonEmptyString),
	commandArgv: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	systemRunPlan: typebox.Type.Optional(require_worker_admission.closedObject({
		argv: typebox.Type.Array(typebox.Type.String()),
		cwd: typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()]),
		commandText: typebox.Type.String(),
		commandPreview: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
		agentId: typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()]),
		sessionKey: typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()]),
		policySnapshot: typebox.Type.Optional(ExecApprovalPolicySnapshotSchema),
		mutableFileOperand: typebox.Type.Optional(typebox.Type.Union([require_worker_admission.closedObject({
			argvIndex: typebox.Type.Integer({ minimum: 0 }),
			path: typebox.Type.String(),
			sha256: typebox.Type.String()
		}), typebox.Type.Null()]))
	})),
	env: typebox.Type.Optional(typebox.Type.Record(NonEmptyString, typebox.Type.String())),
	cwd: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	nodeId: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	host: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	security: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	ask: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	warningText: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	unavailableDecisions: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String({ enum: ["allow-always"] }), {
		minItems: 1,
		maxItems: 1
	})),
	commandSpans: typebox.Type.Optional(typebox.Type.Array(require_worker_admission.closedObject({
		startIndex: typebox.Type.Integer({
			minimum: 0,
			description: "Inclusive UTF-16 code unit offset into command."
		}),
		endIndex: typebox.Type.Integer({
			minimum: 1,
			description: "Exclusive UTF-16 code unit offset into command; must be greater than startIndex and no greater than command.length."
		})
	}))),
	agentId: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	resolvedPath: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	sessionKey: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	turnSourceChannel: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	turnSourceTo: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	turnSourceAccountId: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Null()])),
	turnSourceThreadId: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.String(),
		typebox.Type.Number(),
		typebox.Type.Null()
	])),
	approvalReviewerDeviceIds: typebox.Type.Optional(typebox.Type.Array(NonEmptyString, { description: "Trusted approval-runtime metadata naming operator devices that may review this approval; ordinary Gateway clients may send the field, but the Gateway only binds it for internal approval-runtime requests." })),
	requireDeliveryRoute: typebox.Type.Optional(typebox.Type.Boolean()),
	suppressDelivery: typebox.Type.Optional(typebox.Type.Boolean()),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	twoPhase: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Reviewer decision payload for one pending exec approval. */
const ExecApprovalResolveParamsSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	decision: NonEmptyString
});
//#endregion
//#region packages/gateway-protocol/src/schema/devices.ts
/**
* Device pairing and token-management protocol schemas.
*
* These payloads cross the gateway approval boundary, so request ids and device
* ids stay explicit and feature handlers own the authorization checks.
*/
/** Lists pending and approved device pairing records. */
const DevicePairListParamsSchema = require_worker_admission.closedObject({});
/** Approves a pending pairing request by request id. */
const DevicePairApproveParamsSchema = require_worker_admission.closedObject({ requestId: NonEmptyString });
/** Rejects a pending pairing request by request id. */
const DevicePairRejectParamsSchema = require_worker_admission.closedObject({ requestId: NonEmptyString });
/** Removes an approved or remembered device by device id. */
const DevicePairRemoveParamsSchema = require_worker_admission.closedObject({ deviceId: NonEmptyString });
/** Operator-assigned label for a paired device (max 64 chars after protocol bound). */
const DevicePairLabelString = typebox.Type.String({
	minLength: 1,
	maxLength: 64
});
/** Renames a paired device while preserving its stable device id. */
const DevicePairRenameParamsSchema = require_worker_admission.closedObject({
	deviceId: NonEmptyString,
	label: DevicePairLabelString
});
/** Rotates or issues a device token for a specific role/scope grant. */
const DeviceTokenRotateParamsSchema = require_worker_admission.closedObject({
	deviceId: NonEmptyString,
	role: NonEmptyString,
	scopes: typebox.Type.Optional(typebox.Type.Array(NonEmptyString))
});
/** Revokes one role-bound device token grant. */
const DeviceTokenRevokeParamsSchema = require_worker_admission.closedObject({
	deviceId: NonEmptyString,
	role: NonEmptyString
});
require_worker_admission.closedObject({
	requestId: NonEmptyString,
	deviceId: NonEmptyString,
	publicKey: NonEmptyString,
	displayName: typebox.Type.Optional(NonEmptyString),
	platform: typebox.Type.Optional(NonEmptyString),
	deviceFamily: typebox.Type.Optional(NonEmptyString),
	clientId: typebox.Type.Optional(NonEmptyString),
	clientMode: typebox.Type.Optional(NonEmptyString),
	role: typebox.Type.Optional(NonEmptyString),
	roles: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	scopes: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	remoteIp: typebox.Type.Optional(NonEmptyString),
	silent: typebox.Type.Optional(typebox.Type.Boolean()),
	isRepair: typebox.Type.Optional(typebox.Type.Boolean()),
	ts: typebox.Type.Integer({ minimum: 0 })
});
require_worker_admission.closedObject({
	requestId: NonEmptyString,
	deviceId: NonEmptyString,
	decision: NonEmptyString,
	ts: typebox.Type.Integer({ minimum: 0 })
});
const SetupCodeQrDataUrlSchema = typebox.Type.String({
	maxLength: 16384,
	pattern: "^data:image/png;base64,"
});
/**
* Generates a device-pairing setup code (and optional QR) so a mobile/companion
* client can scan it and connect to this gateway. The embedded setup code mints
* a short-lived bootstrap token that defaults to full native-mobile operator
* access, so this method requires operator.admin
* (enforced by the core method descriptor's method-scope policy, not the handler)
* and is not advertised. `bootstrapProfile: "limited"` omits operator.admin;
* `bootstrapProfile: "node"` narrows the handoff to a node role with no operator
* scopes for companion devices such as watchOS.
*/
const DevicePairSetupCodeParamsSchema = require_worker_admission.closedObject({
	publicUrl: typebox.Type.Optional(NonEmptyString),
	preferRemoteUrl: typebox.Type.Optional(typebox.Type.Boolean()),
	includeQr: typebox.Type.Optional(typebox.Type.Boolean()),
	bootstrapProfile: typebox.Type.Optional(typebox.Type.String({ enum: ["limited", "node"] }))
});
require_worker_admission.closedObject({
	setupCode: NonEmptyString,
	qrDataUrl: typebox.Type.Optional(SetupCodeQrDataUrlSchema),
	gatewayUrl: NonEmptyString,
	gatewayUrls: typebox.Type.Optional(typebox.Type.Array(NonEmptyString, {
		minItems: 2,
		maxItems: 8,
		uniqueItems: true
	})),
	auth: typebox.Type.Union([typebox.Type.Literal("token"), typebox.Type.Literal("password")]),
	urlSource: NonEmptyString,
	access: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("full"),
		typebox.Type.Literal("limited"),
		typebox.Type.Literal("node")
	])),
	accessDowngraded: typebox.Type.Optional(typebox.Type.Boolean())
});
//#endregion
//#region packages/gateway-protocol/src/schema/snapshot.ts
/**
* Gateway state snapshot schemas.
*
* Snapshots are sent during hello and later event streams; they summarize node
* presence, health, session defaults, and version counters for clients.
*/
/** One gateway-visible presence record for a node/client/runtime. */
const PresenceEntrySchema = require_worker_admission.closedObject({
	host: typebox.Type.Optional(NonEmptyString),
	ip: typebox.Type.Optional(NonEmptyString),
	version: typebox.Type.Optional(NonEmptyString),
	platform: typebox.Type.Optional(NonEmptyString),
	deviceFamily: typebox.Type.Optional(NonEmptyString),
	modelIdentifier: typebox.Type.Optional(NonEmptyString),
	mode: typebox.Type.Optional(NonEmptyString),
	lastInputSeconds: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	reason: typebox.Type.Optional(NonEmptyString),
	tags: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	text: typebox.Type.Optional(typebox.Type.String()),
	ts: typebox.Type.Integer({ minimum: 0 }),
	deviceId: typebox.Type.Optional(NonEmptyString),
	roles: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	scopes: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	instanceId: typebox.Type.Optional(NonEmptyString)
});
/** Health snapshot is intentionally opaque because providers contribute nested shapes. */
const HealthSnapshotSchema = typebox.Type.Any();
/** Default session routing keys included in initial gateway snapshots. */
const SessionDefaultsSchema = require_worker_admission.closedObject({
	defaultAgentId: NonEmptyString,
	mainKey: NonEmptyString,
	mainSessionKey: NonEmptyString,
	scope: typebox.Type.Optional(NonEmptyString)
});
/** Monotonic version counters for snapshot subtrees. */
const StateVersionSchema = require_worker_admission.closedObject({
	presence: typebox.Type.Integer({ minimum: 0 }),
	health: typebox.Type.Integer({ minimum: 0 })
});
/** Initial and incremental gateway state snapshot payload. */
const SnapshotSchema = require_worker_admission.closedObject({
	presence: typebox.Type.Array(PresenceEntrySchema),
	health: HealthSnapshotSchema,
	stateVersion: StateVersionSchema,
	uptimeMs: typebox.Type.Integer({ minimum: 0 }),
	/** Resolved source-config revision accepted by the active Gateway runtime. */
	appliedConfigHash: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	configPath: typebox.Type.Optional(NonEmptyString),
	stateDir: typebox.Type.Optional(NonEmptyString),
	sessionDefaults: typebox.Type.Optional(SessionDefaultsSchema),
	authMode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("none"),
		typebox.Type.Literal("token"),
		typebox.Type.Literal("password"),
		typebox.Type.Literal("trusted-proxy")
	])),
	updateAvailable: typebox.Type.Optional(typebox.Type.Object({
		currentVersion: NonEmptyString,
		latestVersion: NonEmptyString,
		channel: NonEmptyString
	}))
});
//#endregion
//#region packages/gateway-protocol/src/schema/frames.ts
const GATEWAY_SERVER_CAPS = {
	CHAT_SEND_ROUTING_CONTRACT: "chat-send-routing-contract",
	SYSTEM_AGENT_SETUP_MODEL_REF: "openclaw-setup-model-ref"
};
require_worker_admission.closedObject({ ts: typebox.Type.Integer({ minimum: 0 }) });
require_worker_admission.closedObject({
	reason: NonEmptyString,
	restartExpectedMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/** Initial client hello/connect payload sent before the gateway accepts frames. */
const ConnectParamsSchema = require_worker_admission.closedObject({
	minProtocol: typebox.Type.Integer({ minimum: 1 }),
	maxProtocol: typebox.Type.Integer({ minimum: 1 }),
	client: require_worker_admission.closedObject({
		id: GatewayClientIdSchema,
		displayName: typebox.Type.Optional(NonEmptyString),
		version: NonEmptyString,
		platform: NonEmptyString,
		deviceFamily: typebox.Type.Optional(NonEmptyString),
		modelIdentifier: typebox.Type.Optional(NonEmptyString),
		mode: GatewayClientModeSchema,
		instanceId: typebox.Type.Optional(NonEmptyString)
	}),
	caps: typebox.Type.Optional(typebox.Type.Array(NonEmptyString, { default: [] })),
	commands: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	permissions: typebox.Type.Optional(typebox.Type.Record(NonEmptyString, typebox.Type.Boolean())),
	pathEnv: typebox.Type.Optional(typebox.Type.String()),
	role: typebox.Type.Optional(NonEmptyString),
	scopes: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	device: typebox.Type.Optional(require_worker_admission.closedObject({
		id: NonEmptyString,
		publicKey: NonEmptyString,
		signature: NonEmptyString,
		signedAt: typebox.Type.Integer({ minimum: 0 }),
		nonce: NonEmptyString
	})),
	auth: typebox.Type.Optional(require_worker_admission.closedObject({
		token: typebox.Type.Optional(typebox.Type.String()),
		bootstrapToken: typebox.Type.Optional(typebox.Type.String()),
		deviceToken: typebox.Type.Optional(typebox.Type.String()),
		password: typebox.Type.Optional(typebox.Type.String()),
		approvalRuntimeToken: typebox.Type.Optional(typebox.Type.String()),
		agentRuntimeIdentityToken: typebox.Type.Optional(typebox.Type.String())
	})),
	locale: typebox.Type.Optional(typebox.Type.String()),
	userAgent: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	type: typebox.Type.Literal("hello-ok"),
	protocol: typebox.Type.Integer({ minimum: 1 }),
	server: require_worker_admission.closedObject({
		version: NonEmptyString,
		connId: NonEmptyString
	}),
	features: require_worker_admission.closedObject({
		methods: typebox.Type.Array(NonEmptyString),
		events: typebox.Type.Array(NonEmptyString),
		capabilities: typebox.Type.Optional(typebox.Type.Array(NonEmptyString))
	}),
	snapshot: SnapshotSchema,
	controlUiTabs: typebox.Type.Optional(typebox.Type.Array(require_worker_admission.closedObject({
		pluginId: NonEmptyString,
		id: NonEmptyString,
		label: NonEmptyString,
		description: typebox.Type.Optional(typebox.Type.String()),
		icon: typebox.Type.Optional(typebox.Type.String()),
		path: typebox.Type.Optional(typebox.Type.String()),
		group: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("control"), typebox.Type.Literal("agent")])),
		order: typebox.Type.Optional(typebox.Type.Number())
	}))),
	pluginSurfaceUrls: typebox.Type.Optional(typebox.Type.Record(NonEmptyString, NonEmptyString)),
	auth: require_worker_admission.closedObject({
		deviceToken: typebox.Type.Optional(NonEmptyString),
		role: NonEmptyString,
		scopes: typebox.Type.Array(NonEmptyString),
		issuedAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
		deviceTokens: typebox.Type.Optional(typebox.Type.Array(require_worker_admission.closedObject({
			deviceToken: NonEmptyString,
			role: NonEmptyString,
			scopes: typebox.Type.Array(NonEmptyString),
			issuedAtMs: typebox.Type.Integer({ minimum: 0 })
		})))
	}),
	policy: require_worker_admission.closedObject({
		maxPayload: typebox.Type.Integer({ minimum: 1 }),
		maxBufferedBytes: typebox.Type.Integer({ minimum: 1 }),
		tickIntervalMs: typebox.Type.Integer({ minimum: 1 })
	})
});
/** Standard structured error shape used in response frames and connect failures. */
const ErrorShapeSchema = require_worker_admission.closedObject({
	code: NonEmptyString,
	message: NonEmptyString,
	details: typebox.Type.Optional(typebox.Type.Unknown()),
	retryable: typebox.Type.Optional(typebox.Type.Boolean()),
	retryAfterMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/** Client request frame envelope; `method` selects the payload validator. */
const RequestFrameSchema = require_worker_admission.closedObject({
	type: typebox.Type.Literal("req"),
	id: NonEmptyString,
	method: NonEmptyString,
	params: typebox.Type.Optional(typebox.Type.Unknown())
});
/** Server response frame envelope paired with a prior request id. */
const ResponseFrameSchema = require_worker_admission.closedObject({
	type: typebox.Type.Literal("res"),
	id: NonEmptyString,
	ok: typebox.Type.Boolean(),
	payload: typebox.Type.Optional(typebox.Type.Unknown()),
	error: typebox.Type.Optional(ErrorShapeSchema)
});
/** Server event frame envelope; `event` selects the payload validator. */
const EventFrameSchema = require_worker_admission.closedObject({
	type: typebox.Type.Literal("event"),
	event: NonEmptyString,
	payload: typebox.Type.Optional(typebox.Type.Unknown()),
	seq: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	stateVersion: typebox.Type.Optional(StateVersionSchema)
});
typebox.Type.Union([
	RequestFrameSchema,
	ResponseFrameSchema,
	EventFrameSchema
], { discriminator: "type" });
//#endregion
//#region packages/gateway-protocol/src/schema/fs.ts
const FsListDirParamsSchema = require_worker_admission.closedObject({
	/** Absolute directory to list; omitted means the selected host's home directory. */
	path: typebox.Type.Optional(NonEmptyString),
	/** Connected node host to browse; omitted means the Gateway host. */
	nodeId: typebox.Type.Optional(NonEmptyString)
});
const FsDirEntrySchema = require_worker_admission.closedObject({
	name: NonEmptyString,
	path: NonEmptyString,
	/** Dot-prefixed directories; clients render them dimmed after visible ones. */
	hidden: typebox.Type.Optional(typebox.Type.Boolean())
});
const FsListDirResultSchema = require_worker_admission.closedObject({
	/** Resolved absolute path that was listed. */
	path: NonEmptyString,
	/** Absent at the filesystem root. */
	parent: typebox.Type.Optional(NonEmptyString),
	/** Selected host's home directory, for the picker's "home" shortcut. */
	home: NonEmptyString,
	entries: typebox.Type.Array(FsDirEntrySchema)
});
//#endregion
//#region packages/gateway-protocol/src/schema/gateway-suspend.ts
const SuspensionTokenSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 128,
	pattern: "\\S"
});
const CountSchema = typebox.Type.Integer({ minimum: 0 });
const GatewaySuspendTaskBlockerSchema = require_worker_admission.closedObject({
	taskId: typebox.Type.String(),
	status: typebox.Type.Literal("running"),
	runtime: typebox.Type.Union([
		typebox.Type.Literal("subagent"),
		typebox.Type.Literal("acp"),
		typebox.Type.Literal("cli"),
		typebox.Type.Literal("cron")
	]),
	runId: typebox.Type.Optional(typebox.Type.String()),
	label: typebox.Type.Optional(typebox.Type.String()),
	title: typebox.Type.Optional(typebox.Type.String())
});
const GatewaySuspendBlockerSchema = require_worker_admission.closedObject({
	kind: typebox.Type.Union([
		typebox.Type.Literal("queue"),
		typebox.Type.Literal("reply"),
		typebox.Type.Literal("embedded-run"),
		typebox.Type.Literal("background-exec"),
		typebox.Type.Literal("cron-run"),
		typebox.Type.Literal("task"),
		typebox.Type.Literal("root-request"),
		typebox.Type.Literal("session-admission"),
		typebox.Type.Literal("session-mutation"),
		typebox.Type.Literal("chat-run"),
		typebox.Type.Literal("queued-turn"),
		typebox.Type.Literal("terminal-persistence"),
		typebox.Type.Literal("terminal-session")
	]),
	count: CountSchema,
	message: typebox.Type.String(),
	task: typebox.Type.Optional(GatewaySuspendTaskBlockerSchema)
});
const GatewaySuspendPrepareParamsSchema = require_worker_admission.closedObject({ requestId: SuspensionTokenSchema });
const GatewaySuspendPrepareBusyResultSchema = require_worker_admission.closedObject({
	status: typebox.Type.Literal("busy"),
	reason: typebox.Type.Union([typebox.Type.Literal("active-work"), typebox.Type.Literal("gateway-draining")]),
	retryAfterMs: CountSchema,
	activeCount: CountSchema,
	blockers: typebox.Type.Array(GatewaySuspendBlockerSchema)
});
const GatewaySuspendPrepareReadyResultSchema = require_worker_admission.closedObject({
	status: typebox.Type.Literal("ready"),
	suspensionId: SuspensionTokenSchema,
	expiresAtMs: CountSchema,
	activeCount: CountSchema,
	blockers: typebox.Type.Array(GatewaySuspendBlockerSchema)
});
const GatewaySuspendPrepareResultSchema = typebox.Type.Union([GatewaySuspendPrepareBusyResultSchema, GatewaySuspendPrepareReadyResultSchema]);
const GatewaySuspendStatusParamsSchema = require_worker_admission.closedObject({ suspensionId: SuspensionTokenSchema });
const GatewaySuspendStatusRunningResultSchema = require_worker_admission.closedObject({ status: typebox.Type.Literal("running") });
const GatewaySuspendStatusReadyResultSchema = require_worker_admission.closedObject({
	status: typebox.Type.Literal("ready"),
	expiresAtMs: CountSchema
});
const GatewaySuspendStatusResultSchema = typebox.Type.Union([GatewaySuspendStatusRunningResultSchema, GatewaySuspendStatusReadyResultSchema]);
const GatewaySuspendResumeParamsSchema = GatewaySuspendStatusParamsSchema;
const GatewaySuspendResumeResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	status: typebox.Type.Literal("running"),
	resumed: typebox.Type.Boolean()
});
//#endregion
//#region packages/gateway-protocol/src/schema/logs-chat.ts
/** Cursor-based request for the gateway log tail endpoint. */
const LogsTailParamsSchema = require_worker_admission.closedObject({
	cursor: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 5e3
	})),
	maxBytes: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 1e6
	}))
});
/** Gateway log tail payload returned to dashboard clients. */
const LogsTailResultSchema = require_worker_admission.closedObject({
	file: NonEmptyString,
	cursor: typebox.Type.Integer({ minimum: 0 }),
	size: typebox.Type.Integer({ minimum: 0 }),
	lines: typebox.Type.Array(typebox.Type.String()),
	truncated: typebox.Type.Optional(typebox.Type.Boolean()),
	reset: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Session-scoped history request used by WebChat and native WebSocket clients. */
const ChatHistoryParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 1e3
	})),
	offset: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	messageId: typebox.Type.Optional(NonEmptyString),
	sessionId: typebox.Type.Optional(NonEmptyString),
	maxChars: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 5e5
	}))
});
/** Lightweight chat metadata request; optional agent scope keeps selector state explicit. */
const ChatMetadataParamsSchema = require_worker_admission.closedObject({ agentId: typebox.Type.Optional(NonEmptyString) });
/** Batched purpose-title request for tool calls rendered in the Control UI. */
const ChatToolTitlesParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	items: typebox.Type.Array(require_worker_admission.closedObject({
		id: typebox.Type.String({
			minLength: 1,
			maxLength: 64
		}),
		name: typebox.Type.String({
			minLength: 1,
			maxLength: 200
		}),
		input: typebox.Type.String({
			minLength: 1,
			maxLength: 4e3
		})
	}), {
		minItems: 1,
		maxItems: 24
	})
});
require_worker_admission.closedObject({
	titles: typebox.Type.Record(typebox.Type.String(), typebox.Type.String()),
	disabled: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Fetches one stored chat message without forcing history callers to request huge payloads. */
const ChatMessageGetParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	messageId: NonEmptyString,
	maxChars: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 2e6
	}))
});
/** Result envelope for single-message lookup, including the stable miss/visibility reason. */
const ChatMessageGetResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Boolean(),
	message: typebox.Type.Optional(typebox.Type.Unknown()),
	unavailableReason: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("not_found"),
		typebox.Type.Literal("oversized"),
		typebox.Type.Literal("not_visible")
	]))
});
/** Attachment envelope shared by chat.send and session creation's initial turn. */
const ChatAttachmentsSchema = typebox.Type.Array(typebox.Type.Unknown());
/** User-to-agent send request; idempotency key lets clients safely retry transport failures. */
const ChatSendParamsSchema = require_worker_admission.closedObject({
	sessionKey: ChatSendSessionKeyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionId: typebox.Type.Optional(NonEmptyString),
	message: typebox.Type.String(),
	thinking: typebox.Type.Optional(typebox.Type.String()),
	fastMode: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Boolean(), typebox.Type.Literal("auto")])),
	fastAutoOnSeconds: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	queueMode: typebox.Type.Optional(typebox.Type.String({ enum: [
		"steer",
		"followup",
		"collect",
		"interrupt"
	] })),
	deliver: typebox.Type.Optional(typebox.Type.Boolean()),
	originatingChannel: typebox.Type.Optional(typebox.Type.String()),
	originatingTo: typebox.Type.Optional(typebox.Type.String()),
	originatingAccountId: typebox.Type.Optional(typebox.Type.String()),
	originatingThreadId: typebox.Type.Optional(typebox.Type.String()),
	attachments: typebox.Type.Optional(ChatAttachmentsSchema),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	systemInputProvenance: typebox.Type.Optional(InputProvenanceSchema),
	systemProvenanceReceipt: typebox.Type.Optional(typebox.Type.String()),
	suppressCommandInterpretation: typebox.Type.Optional(typebox.Type.Boolean()),
	expectedSessionRoutingContract: typebox.Type.Optional(NonEmptyString),
	idempotencyKey: NonEmptyString
});
/** Cancels the active or named run for a chat session. */
const ChatAbortParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	preserveSideRuns: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Inserts an operator-visible synthetic message into an existing chat transcript. */
const ChatInjectParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	message: NonEmptyString,
	label: typebox.Type.Optional(typebox.Type.String({ maxLength: 100 }))
});
/** Shared event fields preserve stream ordering and route events to the right session. */
const ChatEventBaseSchema = {
	runId: NonEmptyString,
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	spawnedBy: typebox.Type.Optional(NonEmptyString),
	seq: typebox.Type.Integer({ minimum: 0 })
};
/** Stable error categories exposed over the chat stream. */
const ChatEventErrorKindSchema = typebox.Type.Union([
	typebox.Type.Literal("refusal"),
	typebox.Type.Literal("timeout"),
	typebox.Type.Literal("rate_limit"),
	typebox.Type.Literal("context_length"),
	typebox.Type.Literal("unknown")
]);
/** Incremental assistant output event; `replace` marks full-content refresh deltas. */
const ChatDeltaEventSchema = require_worker_admission.closedObject({
	...ChatEventBaseSchema,
	state: typebox.Type.Literal("delta"),
	message: typebox.Type.Optional(typebox.Type.Unknown()),
	deltaText: typebox.Type.String(),
	replace: typebox.Type.Optional(typebox.Type.Boolean()),
	usage: typebox.Type.Optional(typebox.Type.Unknown())
});
/** Successful terminal event for a completed chat run. */
const ChatFinalEventSchema = require_worker_admission.closedObject({
	...ChatEventBaseSchema,
	state: typebox.Type.Literal("final"),
	message: typebox.Type.Optional(typebox.Type.Unknown()),
	usage: typebox.Type.Optional(typebox.Type.Unknown()),
	stopReason: typebox.Type.Optional(typebox.Type.String()),
	yielded: typebox.Type.Optional(typebox.Type.Literal(true))
});
/** Terminal event for user-initiated or coordinator-initiated cancellation. */
const ChatAbortedEventSchema = require_worker_admission.closedObject({
	...ChatEventBaseSchema,
	state: typebox.Type.Literal("aborted"),
	message: typebox.Type.Optional(typebox.Type.Unknown()),
	errorMessage: typebox.Type.Optional(typebox.Type.String()),
	stopReason: typebox.Type.Optional(typebox.Type.String())
});
/** Terminal event for failed chat runs with an optional normalized failure kind. */
const ChatErrorEventSchema = require_worker_admission.closedObject({
	...ChatEventBaseSchema,
	state: typebox.Type.Literal("error"),
	message: typebox.Type.Optional(typebox.Type.Unknown()),
	errorMessage: typebox.Type.Optional(typebox.Type.String()),
	errorKind: typebox.Type.Optional(ChatEventErrorKindSchema),
	usage: typebox.Type.Optional(typebox.Type.Unknown()),
	stopReason: typebox.Type.Optional(typebox.Type.String())
});
/** Public chat stream event union consumed by gateway protocol validators. */
const ChatEventSchema = typebox.Type.Union([
	ChatDeltaEventSchema,
	ChatFinalEventSchema,
	ChatAbortedEventSchema,
	ChatErrorEventSchema
]);
//#endregion
//#region packages/gateway-protocol/src/schema/nodes.ts
const NodePluginToolNameSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 64,
	pattern: "^[A-Za-z][A-Za-z0-9_-]{0,63}$"
});
const NodeSkillNameSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 64,
	pattern: "^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$"
});
/** Pending node work classes that the gateway may queue for paired devices. */
const NodePendingWorkTypeSchema = typebox.Type.String({ enum: ["status.request", "location.request"] });
/** Queue priority accepted when operators enqueue node work. */
const NodePendingWorkPrioritySchema = typebox.Type.String({ enum: ["normal", "high"] });
/** Reasons a node can report itself alive without implying an operator action. */
const NodePresenceAliveReasonSchema = typebox.Type.String({ enum: [
	"background",
	"silent_push",
	"bg_app_refresh",
	"significant_location",
	"manual",
	"connect"
] });
/** Presence heartbeat payload sent by remote nodes to refresh gateway state. */
const NodePresenceAlivePayloadSchema = require_worker_admission.closedObject({
	trigger: NodePresenceAliveReasonSchema,
	sentAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	displayName: typebox.Type.Optional(NonEmptyString),
	version: typebox.Type.Optional(NonEmptyString),
	platform: typebox.Type.Optional(NonEmptyString),
	deviceFamily: typebox.Type.Optional(NonEmptyString),
	modelIdentifier: typebox.Type.Optional(NonEmptyString),
	pushTransport: typebox.Type.Optional(NonEmptyString)
});
/** Recent operator input activity reported by an interactive node. */
const NodePresenceActivityPayloadSchema = require_worker_admission.closedObject({
	idleSeconds: typebox.Type.Integer({
		minimum: 0,
		maximum: 2592e3
	}),
	saturated: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Normalized result for node-originated events after gateway dispatch. */
const NodeEventResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Boolean(),
	event: NonEmptyString,
	handled: typebox.Type.Boolean(),
	reason: typebox.Type.Optional(NonEmptyString)
});
/** Lists pending node-pairing requests. */
const NodePairListParamsSchema = require_worker_admission.closedObject({});
/** Approves a pending node-pairing request by request id. */
const NodePairApproveParamsSchema = require_worker_admission.closedObject({ requestId: NonEmptyString });
/** Rejects a pending node-pairing request by request id. */
const NodePairRejectParamsSchema = require_worker_admission.closedObject({ requestId: NonEmptyString });
/** Removes an already paired node from the gateway trust set. */
const NodePairRemoveParamsSchema = require_worker_admission.closedObject({ nodeId: NonEmptyString });
/** Renames a paired node while preserving its stable node id. */
const NodeRenameParamsSchema = require_worker_admission.closedObject({
	nodeId: NonEmptyString,
	displayName: NonEmptyString
});
/** Lists paired nodes known to the gateway. */
const NodeListParamsSchema = require_worker_admission.closedObject({});
/** Agent-visible tool descriptor advertised by a connected node. */
const NodePluginToolDescriptorSchema = require_worker_admission.closedObject({
	pluginId: NonEmptyString,
	name: NodePluginToolNameSchema,
	description: NonEmptyString,
	parameters: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), typebox.Type.Unknown())),
	command: typebox.Type.Optional(NonEmptyString),
	mcp: typebox.Type.Optional(require_worker_admission.closedObject({
		server: NonEmptyString,
		tool: NonEmptyString
	}))
});
/** Replaces the connected node's dynamic agent-visible plugin/MCP tool catalog. */
const NodePluginToolsUpdateParamsSchema = require_worker_admission.closedObject({ tools: typebox.Type.Array(NodePluginToolDescriptorSchema) });
/** Agent-visible skill descriptor advertised by a connected node. */
const NodeSkillDescriptorSchema = require_worker_admission.closedObject({
	name: NodeSkillNameSchema,
	description: typebox.Type.String({
		minLength: 1,
		maxLength: 1024
	}),
	content: typebox.Type.String({
		minLength: 1,
		maxLength: 64 * 1024
	})
});
/** Replaces the connected node's agent-visible skill catalog. */
const NodeSkillsUpdateParamsSchema = require_worker_admission.closedObject({ skills: typebox.Type.Array(NodeSkillDescriptorSchema, { maxItems: 64 }) });
/** Acknowledges queued node work that the node has consumed. */
const NodePendingAckParamsSchema = require_worker_admission.closedObject({ ids: typebox.Type.Array(NonEmptyString, { minItems: 1 }) });
/** Requests detailed metadata for one paired node. */
const NodeDescribeParamsSchema = require_worker_admission.closedObject({ nodeId: NonEmptyString });
/** Invokes a command on a paired node; idempotency allows safe retries. */
const NodeInvokeParamsSchema = require_worker_admission.closedObject({
	nodeId: NonEmptyString,
	command: NonEmptyString,
	params: typebox.Type.Optional(typebox.Type.Unknown()),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	idempotencyKey: NonEmptyString,
	sessionKey: typebox.Type.Optional(NonEmptyString),
	turnSourceChannel: typebox.Type.Optional(typebox.Type.String()),
	turnSourceTo: typebox.Type.Optional(typebox.Type.String()),
	turnSourceAccountId: typebox.Type.Optional(typebox.Type.String()),
	turnSourceThreadId: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Number()]))
});
/** Result callback payload for a node command invocation. */
const NodeInvokeResultParamsSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	nodeId: NonEmptyString,
	ok: typebox.Type.Boolean(),
	payload: typebox.Type.Optional(typebox.Type.Unknown()),
	payloadJSON: typebox.Type.Optional(typebox.Type.String()),
	error: typebox.Type.Optional(require_worker_admission.closedObject({
		code: typebox.Type.Optional(NonEmptyString),
		message: typebox.Type.Optional(NonEmptyString)
	}))
});
/** Ordered UTF-8 output emitted while a node command invocation is running. */
const NodeInvokeProgressParamsSchema = typebox.Type.Object({
	invokeId: NonEmptyString,
	nodeId: NonEmptyString,
	seq: typebox.Type.Integer({ minimum: 0 }),
	chunk: typebox.Type.String({ maxLength: 16 * 1024 })
}, { additionalProperties: false });
/** Generic node event envelope accepted by the gateway. */
const NodeEventParamsSchema = require_worker_admission.closedObject({
	event: NonEmptyString,
	payload: typebox.Type.Optional(typebox.Type.Unknown()),
	payloadJSON: typebox.Type.Optional(typebox.Type.String())
});
/** Request for a bounded batch of queued work assigned to the calling node. */
const NodePendingDrainParamsSchema = require_worker_admission.closedObject({ maxItems: typebox.Type.Optional(typebox.Type.Integer({
	minimum: 1,
	maximum: 10
})) });
/** One queued node-work item returned by pending-work drain calls. */
const NodePendingDrainItemSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	type: NodePendingWorkTypeSchema,
	priority: typebox.Type.String({ enum: [
		"default",
		"normal",
		"high"
	] }),
	createdAtMs: typebox.Type.Integer({ minimum: 0 }),
	expiresAtMs: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Integer({ minimum: 0 }), typebox.Type.Null()])),
	payload: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), typebox.Type.Unknown()))
});
require_worker_admission.closedObject({
	nodeId: NonEmptyString,
	revision: typebox.Type.Integer({ minimum: 0 }),
	items: typebox.Type.Array(NodePendingDrainItemSchema),
	hasMore: typebox.Type.Boolean()
});
/** Enqueues gateway-initiated work for a paired node. */
const NodePendingEnqueueParamsSchema = require_worker_admission.closedObject({
	nodeId: NonEmptyString,
	type: NodePendingWorkTypeSchema,
	priority: typebox.Type.Optional(NodePendingWorkPrioritySchema),
	expiresInMs: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1e3,
		maximum: 864e5
	})),
	wake: typebox.Type.Optional(typebox.Type.Boolean())
});
require_worker_admission.closedObject({
	nodeId: NonEmptyString,
	revision: typebox.Type.Integer({ minimum: 0 }),
	queued: NodePendingDrainItemSchema,
	wakeTriggered: typebox.Type.Boolean()
});
/** Event payload used by the gateway to ask a node to run a command. */
const NodeInvokeRequestEventSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	nodeId: NonEmptyString,
	command: NonEmptyString,
	paramsJSON: typebox.Type.Optional(typebox.Type.String()),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	idempotencyKey: typebox.Type.Optional(NonEmptyString)
});
/** Ordered input frame sent by the gateway to one long-lived node invoke. */
const NodeInvokeInputEventSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	nodeId: NonEmptyString,
	seq: typebox.Type.Integer({ minimum: 0 }),
	payloadJSON: typebox.Type.String({ maxLength: 16 * 1024 })
});
//#endregion
//#region packages/gateway-protocol/src/schema/log-migration-protocol-schemas.ts
const LogMigrationProtocolSchemas = {
	LogsTailParams: LogsTailParamsSchema,
	LogsTailResult: LogsTailResultSchema,
	...MigrationProtocolSchemas
};
/** Approval request raised by a plugin before a sensitive tool action proceeds. */
const PluginApprovalRequestParamsSchema = require_worker_admission.closedObject({
	pluginId: typebox.Type.Optional(NonEmptyString),
	title: typebox.Type.String({
		minLength: 1,
		maxLength: 80
	}),
	description: typebox.Type.String({
		minLength: 1,
		maxLength: 512
	}),
	severity: typebox.Type.Optional(typebox.Type.String({ enum: [
		"info",
		"warning",
		"critical"
	] })),
	toolName: typebox.Type.Optional(typebox.Type.String()),
	toolCallId: typebox.Type.Optional(typebox.Type.String()),
	allowedDecisions: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String({ enum: [
		"allow-once",
		"allow-always",
		"deny"
	] }), {
		minItems: 1,
		maxItems: 3
	})),
	agentId: typebox.Type.Optional(typebox.Type.String()),
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	approvalReviewerDeviceIds: typebox.Type.Optional(typebox.Type.Array(NonEmptyString, { description: "Trusted approval-runtime metadata naming operator devices that may review this approval; ordinary Gateway clients may send the field, but the Gateway only binds it for internal approval-runtime requests." })),
	turnSourceChannel: typebox.Type.Optional(typebox.Type.String()),
	turnSourceTo: typebox.Type.Optional(typebox.Type.String()),
	turnSourceAccountId: typebox.Type.Optional(typebox.Type.String()),
	turnSourceThreadId: typebox.Type.Optional(typebox.Type.Union([typebox.Type.String(), typebox.Type.Number()])),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 6e5
	})),
	twoPhase: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Reviewer decision payload resolving one pending plugin approval request. */
const PluginApprovalResolveParamsSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	decision: NonEmptyString
});
//#endregion
//#region packages/gateway-protocol/src/schema/plugins.ts
/**
* Plugin control-surface protocol schemas.
*
* These payloads let the gateway expose plugin-provided UI actions without
* baking plugin-specific payload shapes into the core protocol.
*/
/** Arbitrary plugin-owned JSON payload carried opaquely through the gateway. */
const PluginJsonValueSchema = typebox.Type.Unknown();
/** Descriptor for one plugin-provided control UI action or surface. */
const PluginControlUiDescriptorSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	pluginId: NonEmptyString,
	pluginName: typebox.Type.Optional(NonEmptyString),
	surface: typebox.Type.Union([
		typebox.Type.Literal("session"),
		typebox.Type.Literal("tool"),
		typebox.Type.Literal("run"),
		typebox.Type.Literal("settings")
	]),
	label: NonEmptyString,
	description: typebox.Type.Optional(typebox.Type.String()),
	placement: typebox.Type.Optional(typebox.Type.String()),
	schema: typebox.Type.Optional(PluginJsonValueSchema),
	requiredScopes: typebox.Type.Optional(typebox.Type.Array(NonEmptyString))
});
/** Empty request payload for listing plugin UI descriptors. */
const PluginsUiDescriptorsParamsSchema = require_worker_admission.closedObject({});
/** Response payload containing all plugin UI descriptors visible to the client. */
const PluginsUiDescriptorsResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	descriptors: typebox.Type.Array(PluginControlUiDescriptorSchema)
});
/** Request payload for invoking one plugin-owned session action. */
const PluginsSessionActionParamsSchema = require_worker_admission.closedObject({
	pluginId: NonEmptyString,
	actionId: NonEmptyString,
	sessionKey: typebox.Type.Optional(NonEmptyString),
	payload: typebox.Type.Optional(PluginJsonValueSchema)
});
/** Successful plugin action result, optionally continuing the agent turn. */
const PluginsSessionActionSuccessResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	result: typebox.Type.Optional(PluginJsonValueSchema),
	continueAgent: typebox.Type.Optional(typebox.Type.Boolean()),
	reply: typebox.Type.Optional(PluginJsonValueSchema)
});
/** Failed plugin action result with plugin-owned detail payload. */
const PluginsSessionActionFailureResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Literal(false),
	error: typebox.Type.String(),
	code: typebox.Type.Optional(typebox.Type.String()),
	details: typebox.Type.Optional(PluginJsonValueSchema)
});
/** Discriminated plugin action result returned to gateway clients. */
const PluginsSessionActionResultSchema = typebox.Type.Union([PluginsSessionActionSuccessResultSchema, PluginsSessionActionFailureResultSchema]);
/** ClawHub-backed install action for one catalog entry. */
const PluginCatalogClawHubInstallSchema = require_worker_admission.closedObject({
	source: typebox.Type.Literal("clawhub"),
	packageName: NonEmptyString
});
/** Official-catalog install action for one catalog entry. */
const PluginCatalogOfficialInstallSchema = require_worker_admission.closedObject({
	source: typebox.Type.Literal("official"),
	pluginId: NonEmptyString
});
const PluginCatalogInstallActionSchema = typebox.Type.Union([PluginCatalogClawHubInstallSchema, PluginCatalogOfficialInstallSchema]);
/** Cold control-plane representation of an installed or available plugin. */
const PluginCatalogEntrySchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	name: NonEmptyString,
	packageName: typebox.Type.Optional(NonEmptyString),
	description: typebox.Type.Optional(typebox.Type.String()),
	version: typebox.Type.Optional(NonEmptyString),
	kind: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	origin: typebox.Type.Optional(NonEmptyString),
	installed: typebox.Type.Boolean(),
	enabled: typebox.Type.Boolean(),
	state: typebox.Type.Union([
		typebox.Type.Literal("enabled"),
		typebox.Type.Literal("disabled"),
		typebox.Type.Literal("not-installed"),
		typebox.Type.Literal("error")
	]),
	featured: typebox.Type.Optional(typebox.Type.Boolean()),
	order: typebox.Type.Optional(typebox.Type.Number()),
	install: typebox.Type.Optional(PluginCatalogInstallActionSchema),
	error: typebox.Type.Optional(typebox.Type.String()),
	/** Coarse manifest-derived grouping (channel, provider, memory, ...) for catalog UIs. */
	category: typebox.Type.Optional(NonEmptyString),
	/** True when the plugin has an install record and can be removed via plugins.uninstall. */
	removable: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Empty request payload for the cold plugin catalog. */
const PluginsListParamsSchema = require_worker_admission.closedObject({});
/** Installed and curated plugin catalog visible to the current gateway client. */
const PluginsListResultSchema = require_worker_admission.closedObject({
	plugins: typebox.Type.Array(PluginCatalogEntrySchema),
	diagnostics: typebox.Type.Array(typebox.Type.Unknown()),
	mutationAllowed: typebox.Type.Boolean()
});
/** Request payload for searching installable ClawHub plugin families. */
const PluginsSearchParamsSchema = require_worker_admission.closedObject({
	query: NonEmptyString,
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 100
	}))
});
/** ClawHub package fields exposed by plugin search. */
const PluginSearchPackageSchema = require_worker_admission.closedObject({
	name: NonEmptyString,
	displayName: NonEmptyString,
	family: typebox.Type.Union([typebox.Type.Literal("code-plugin"), typebox.Type.Literal("bundle-plugin")]),
	channel: typebox.Type.Union([
		typebox.Type.Literal("official"),
		typebox.Type.Literal("community"),
		typebox.Type.Literal("private")
	]),
	isOfficial: typebox.Type.Boolean(),
	summary: typebox.Type.Optional(typebox.Type.String()),
	latestVersion: typebox.Type.Optional(NonEmptyString),
	runtimeId: typebox.Type.Optional(NonEmptyString),
	downloads: typebox.Type.Optional(typebox.Type.Number({ minimum: 0 })),
	verificationTier: typebox.Type.Optional(NonEmptyString)
});
/** Ranked ClawHub plugin search hit. */
const PluginSearchResultEntrySchema = require_worker_admission.closedObject({
	score: typebox.Type.Number(),
	package: PluginSearchPackageSchema
});
/** Ranked installable plugin packages matching the query. */
const PluginsSearchResultSchema = require_worker_admission.closedObject({ results: typebox.Type.Array(PluginSearchResultEntrySchema) });
/** Trusted official-catalog or acknowledged ClawHub install request. */
const PluginsInstallParamsSchema = typebox.Type.Union([require_worker_admission.closedObject({
	source: typebox.Type.Literal("clawhub"),
	packageName: NonEmptyString,
	version: typebox.Type.Optional(NonEmptyString),
	acknowledgeClawHubRisk: typebox.Type.Optional(typebox.Type.Boolean())
}), require_worker_admission.closedObject({
	source: typebox.Type.Literal("official"),
	pluginId: NonEmptyString
})]);
/** Successful plugin installation result. */
const PluginsInstallResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	plugin: PluginCatalogEntrySchema,
	restartRequired: typebox.Type.Literal(true),
	warnings: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String()))
});
/** Request payload for removing one installed plugin and its managed files. */
const PluginsUninstallParamsSchema = require_worker_admission.closedObject({ pluginId: NonEmptyString });
/** Successful plugin removal result listing the cleanup actions that ran. */
const PluginsUninstallResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	pluginId: NonEmptyString,
	restartRequired: typebox.Type.Literal(true),
	removed: typebox.Type.Array(typebox.Type.String()),
	warnings: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String()))
});
/** Request payload for changing one installed plugin's policy state. */
const PluginsSetEnabledParamsSchema = require_worker_admission.closedObject({
	pluginId: NonEmptyString,
	enabled: typebox.Type.Boolean()
});
/** Successful plugin enablement policy update. */
const PluginsSetEnabledResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	plugin: PluginCatalogEntrySchema,
	restartRequired: typebox.Type.Boolean(),
	warnings: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String()))
});
//#endregion
//#region packages/gateway-protocol/src/schema/protocol-schemas-node-invoke.ts
const NodeInvokeProtocolSchemas = {
	NodeInvokeParams: NodeInvokeParamsSchema,
	NodeInvokeInputEvent: NodeInvokeInputEventSchema,
	NodeInvokeProgressParams: NodeInvokeProgressParamsSchema,
	NodeInvokeResultParams: NodeInvokeResultParamsSchema,
	NodeInvokeRequestEvent: NodeInvokeRequestEventSchema
};
//#endregion
//#region packages/gateway-protocol/src/schema/protocol-schemas-node-presence.ts
const NodePresenceProtocolSchemas = {
	NodePresenceAliveReason: NodePresenceAliveReasonSchema,
	NodePresenceActivityPayload: NodePresenceActivityPayloadSchema
};
//#endregion
//#region packages/gateway-protocol/src/schema/push.ts
/**
* Push-notification protocol schemas.
*
* APNS test schemas exercise native push routing; Web Push schemas describe the
* browser subscription lifecycle exposed by the gateway.
*/
const ApnsEnvironmentSchema = typebox.Type.String({ enum: ["sandbox", "production"] });
/** Request payload for sending a test APNS notification to one node. */
const PushTestParamsSchema = require_worker_admission.closedObject({
	nodeId: NonEmptyString,
	title: typebox.Type.Optional(typebox.Type.String()),
	body: typebox.Type.Optional(typebox.Type.String()),
	environment: typebox.Type.Optional(ApnsEnvironmentSchema)
});
require_worker_admission.closedObject({
	ok: typebox.Type.Boolean(),
	status: typebox.Type.Integer(),
	apnsId: typebox.Type.Optional(typebox.Type.String()),
	reason: typebox.Type.Optional(typebox.Type.String()),
	tokenSuffix: typebox.Type.String(),
	topic: typebox.Type.String(),
	environment: ApnsEnvironmentSchema,
	transport: typebox.Type.String({ enum: ["direct", "relay"] })
});
const WebPushKeysSchema = require_worker_admission.closedObject({
	p256dh: typebox.Type.String({
		minLength: 1,
		maxLength: 512
	}),
	auth: typebox.Type.String({
		minLength: 1,
		maxLength: 512
	})
});
/** Empty request payload for fetching the Web Push VAPID public key. */
const WebPushVapidPublicKeyParamsSchema = require_worker_admission.closedObject({});
/** Browser Web Push subscription payload registered with the gateway. */
const WebPushSubscribeParamsSchema = require_worker_admission.closedObject({
	endpoint: typebox.Type.String({
		minLength: 1,
		maxLength: 2048,
		pattern: "^https://"
	}),
	keys: WebPushKeysSchema
});
/** Browser Web Push endpoint removal payload. */
const WebPushUnsubscribeParamsSchema = require_worker_admission.closedObject({ endpoint: typebox.Type.String({
	minLength: 1,
	maxLength: 2048,
	pattern: "^https://"
}) });
/** Request payload for sending a test Web Push notification to current subscriptions. */
const WebPushTestParamsSchema = require_worker_admission.closedObject({
	title: typebox.Type.Optional(typebox.Type.String()),
	body: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({});
/** Request payload for resolving the secrets needed by one command invocation. */
const SecretsResolveParamsSchema = require_worker_admission.closedObject({
	commandName: NonEmptyString,
	targetIds: typebox.Type.Array(NonEmptyString),
	allowedPaths: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	forcedActivePaths: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	optionalActivePaths: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	providerOverrides: typebox.Type.Optional(require_worker_admission.closedObject({
		webSearch: typebox.Type.Optional(NonEmptyString),
		webFetch: typebox.Type.Optional(NonEmptyString)
	}))
});
/** One resolved secret assignment path plus its provider-owned value. */
const SecretsResolveAssignmentSchema = require_worker_admission.closedObject({
	path: typebox.Type.Optional(NonEmptyString),
	pathSegments: typebox.Type.Array(NonEmptyString),
	value: typebox.Type.Unknown()
});
/** Secret resolution response with assignments and safe diagnostics. */
const SecretsResolveResultSchema = require_worker_admission.closedObject({
	ok: typebox.Type.Optional(typebox.Type.Boolean()),
	assignments: typebox.Type.Optional(typebox.Type.Array(SecretsResolveAssignmentSchema)),
	diagnostics: typebox.Type.Optional(typebox.Type.Array(NonEmptyString)),
	inactiveRefPaths: typebox.Type.Optional(typebox.Type.Array(NonEmptyString))
});
//#endregion
//#region packages/gateway-protocol/src/schema/session-placement.ts
/** Durable gateway ownership states for one session execution placement. */
const SessionPlacementStateSchema = typebox.Type.Union([
	typebox.Type.Literal("local"),
	typebox.Type.Literal("requested"),
	typebox.Type.Literal("provisioning"),
	typebox.Type.Literal("syncing"),
	typebox.Type.Literal("starting"),
	typebox.Type.Literal("active"),
	typebox.Type.Literal("draining"),
	typebox.Type.Literal("reconciling"),
	typebox.Type.Literal("reclaimed"),
	typebox.Type.Literal("failed")
]);
const SessionPlacementTimingProperties = {
	generation: typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	createdAtMs: typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	updatedAtMs: typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	}),
	stateChangedAtMs: typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	})
};
const SessionPlacementOwnerEpochSchema = typebox.Type.Integer({
	minimum: 1,
	maximum: Number.MAX_SAFE_INTEGER
});
const WorkerBundleHashSchema = typebox.Type.String({
	minLength: 64,
	maxLength: 64,
	pattern: "^[a-f0-9]{64}$"
});
const SessionPlacementWorkspaceProperties = {
	workspaceBaseManifestRef: NonEmptyString,
	remoteWorkspaceDir: NonEmptyString
};
const SessionPlacementAckProperties = {
	lastTranscriptAckCursor: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	})),
	lastLiveEventAckCursor: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 0,
		maximum: Number.MAX_SAFE_INTEGER
	}))
};
const TerminalSessionPlacementProperties = {
	environmentId: typebox.Type.Optional(NonEmptyString),
	activeOwnerEpoch: typebox.Type.Optional(SessionPlacementOwnerEpochSchema),
	workspaceBaseManifestRef: typebox.Type.Optional(NonEmptyString),
	remoteWorkspaceDir: typebox.Type.Optional(NonEmptyString),
	workerBundleHash: typebox.Type.Optional(WorkerBundleHashSchema),
	...SessionPlacementAckProperties
};
function createUnownedSessionPlacementSchema(state) {
	return typebox.Type.Object({
		state: typebox.Type.Literal(state),
		...SessionPlacementTimingProperties
	}, { additionalProperties: false });
}
function createWorkerOwnedSessionPlacementSchema(state) {
	return typebox.Type.Object({
		state: typebox.Type.Literal(state),
		...SessionPlacementTimingProperties,
		environmentId: NonEmptyString,
		activeOwnerEpoch: SessionPlacementOwnerEpochSchema,
		workerBundleHash: WorkerBundleHashSchema,
		...SessionPlacementWorkspaceProperties,
		...SessionPlacementAckProperties
	}, { additionalProperties: false });
}
const LocalSessionPlacementSchema = createUnownedSessionPlacementSchema("local");
const RequestedSessionPlacementSchema = createUnownedSessionPlacementSchema("requested");
const ProvisioningSessionPlacementSchema = typebox.Type.Object({
	state: typebox.Type.Literal("provisioning"),
	...SessionPlacementTimingProperties,
	environmentId: typebox.Type.Optional(NonEmptyString)
}, { additionalProperties: false });
const SyncingSessionPlacementSchema = typebox.Type.Object({
	state: typebox.Type.Literal("syncing"),
	...SessionPlacementTimingProperties,
	environmentId: NonEmptyString,
	workerBundleHash: WorkerBundleHashSchema
}, { additionalProperties: false });
const StartingSessionPlacementSchema = typebox.Type.Object({
	state: typebox.Type.Literal("starting"),
	...SessionPlacementTimingProperties,
	environmentId: NonEmptyString,
	workerBundleHash: WorkerBundleHashSchema,
	...SessionPlacementWorkspaceProperties
}, { additionalProperties: false });
const ActiveWorkerSessionPlacementSchema = createWorkerOwnedSessionPlacementSchema("active");
const DrainingSessionPlacementSchema = createWorkerOwnedSessionPlacementSchema("draining");
const ReconcilingSessionPlacementSchema = createWorkerOwnedSessionPlacementSchema("reconciling");
const ReclaimedSessionPlacementSchema = typebox.Type.Object({
	state: typebox.Type.Literal("reclaimed"),
	...SessionPlacementTimingProperties,
	...TerminalSessionPlacementProperties
}, { additionalProperties: false });
const FailedSessionPlacementSchema = typebox.Type.Object({
	state: typebox.Type.Literal("failed"),
	...SessionPlacementTimingProperties,
	...TerminalSessionPlacementProperties,
	recoveryError: NonEmptyString
}, { additionalProperties: false });
/** Gateway-visible placement projection; `state` remains the closed discriminator. */
const SessionPlacementSchema = typebox.Type.Union([
	LocalSessionPlacementSchema,
	RequestedSessionPlacementSchema,
	ProvisioningSessionPlacementSchema,
	SyncingSessionPlacementSchema,
	StartingSessionPlacementSchema,
	ActiveWorkerSessionPlacementSchema,
	DrainingSessionPlacementSchema,
	ReconcilingSessionPlacementSchema,
	ReclaimedSessionPlacementSchema,
	FailedSessionPlacementSchema
]);
/** Requests one-way dispatch of an existing local session to a configured worker profile. */
const SessionsDispatchParamsSchema = typebox.Type.Object({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	profileId: NonEmptyString
}, { additionalProperties: false });
/** Result returned once session dispatch reaches durable worker ownership. */
const SessionsDispatchResultSchema = typebox.Type.Object({
	ok: typebox.Type.Literal(true),
	key: NonEmptyString,
	sessionId: NonEmptyString,
	placement: ActiveWorkerSessionPlacementSchema
}, { additionalProperties: false });
/** Requests safe workspace reconciliation and teardown of an active cloud worker. */
const SessionsReclaimParamsSchema = typebox.Type.Object({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString)
}, { additionalProperties: false });
/** Result returned once worker ownership has been destroyed and reclaimed. */
const SessionsReclaimResultSchema = typebox.Type.Object({
	ok: typebox.Type.Literal(true),
	key: NonEmptyString,
	sessionId: NonEmptyString,
	placement: ReclaimedSessionPlacementSchema
}, { additionalProperties: false });
const SessionPlacementProtocolSchemas = {
	SessionPlacementState: SessionPlacementStateSchema,
	LocalSessionPlacement: LocalSessionPlacementSchema,
	RequestedSessionPlacement: RequestedSessionPlacementSchema,
	ProvisioningSessionPlacement: ProvisioningSessionPlacementSchema,
	SyncingSessionPlacement: SyncingSessionPlacementSchema,
	StartingSessionPlacement: StartingSessionPlacementSchema,
	ActiveWorkerSessionPlacement: ActiveWorkerSessionPlacementSchema,
	DrainingSessionPlacement: DrainingSessionPlacementSchema,
	ReconcilingSessionPlacement: ReconcilingSessionPlacementSchema,
	ReclaimedSessionPlacement: ReclaimedSessionPlacementSchema,
	FailedSessionPlacement: FailedSessionPlacementSchema,
	SessionPlacement: SessionPlacementSchema,
	SessionsDispatchParams: SessionsDispatchParamsSchema,
	SessionsDispatchResult: SessionsDispatchResultSchema,
	SessionsReclaimParams: SessionsReclaimParamsSchema,
	SessionsReclaimResult: SessionsReclaimResultSchema
};
//#endregion
//#region packages/gateway-protocol/src/schema/sessions-catalog.ts
const SessionCatalogErrorSchema = require_worker_admission.closedObject({
	code: NonEmptyString,
	message: NonEmptyString
});
const SessionCatalogCapabilitiesSchema = require_worker_admission.closedObject({
	continueSession: typebox.Type.Boolean(),
	archive: typebox.Type.Boolean(),
	createSession: typebox.Type.Optional(require_worker_admission.closedObject({ model: NonEmptyString })),
	openTerminal: typebox.Type.Optional(typebox.Type.Boolean())
});
require_worker_admission.closedObject({
	id: NonEmptyString,
	label: NonEmptyString,
	capabilities: SessionCatalogCapabilitiesSchema
});
const SessionCatalogSessionSchema = require_worker_admission.closedObject({
	threadId: NonEmptyString,
	name: typebox.Type.Optional(typebox.Type.String()),
	cwd: typebox.Type.Optional(typebox.Type.String()),
	status: NonEmptyString,
	createdAt: typebox.Type.Optional(typebox.Type.Number()),
	updatedAt: typebox.Type.Optional(typebox.Type.Number()),
	recencyAt: typebox.Type.Optional(typebox.Type.Number()),
	source: typebox.Type.Optional(typebox.Type.String()),
	modelProvider: typebox.Type.Optional(typebox.Type.String()),
	cliVersion: typebox.Type.Optional(typebox.Type.String()),
	gitBranch: typebox.Type.Optional(typebox.Type.String()),
	archived: typebox.Type.Boolean(),
	openClawSessionKey: typebox.Type.Optional(NonEmptyString),
	canContinue: typebox.Type.Boolean(),
	canArchive: typebox.Type.Boolean(),
	canOpenTerminal: typebox.Type.Optional(typebox.Type.Boolean())
});
const SessionCatalogHostSchema = require_worker_admission.closedObject({
	hostId: NonEmptyString,
	label: NonEmptyString,
	kind: typebox.Type.Union([typebox.Type.Literal("gateway"), typebox.Type.Literal("node")]),
	connected: typebox.Type.Boolean(),
	nodeId: typebox.Type.Optional(NonEmptyString),
	sessions: typebox.Type.Array(SessionCatalogSessionSchema),
	nextCursor: typebox.Type.Optional(typebox.Type.String()),
	error: typebox.Type.Optional(SessionCatalogErrorSchema)
});
const SessionCatalogSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	label: NonEmptyString,
	capabilities: SessionCatalogCapabilitiesSchema,
	hosts: typebox.Type.Array(SessionCatalogHostSchema),
	error: typebox.Type.Optional(SessionCatalogErrorSchema)
});
const SessionsCatalogListCommonProperties = {
	agentId: typebox.Type.Optional(NonEmptyString),
	search: typebox.Type.Optional(typebox.Type.String()),
	limitPerHost: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	hostIds: typebox.Type.Optional(typebox.Type.Array(NonEmptyString))
};
const SessionsCatalogListParamsSchema = typebox.Type.Union([require_worker_admission.closedObject({
	catalogId: typebox.Type.Optional(NonEmptyString),
	...SessionsCatalogListCommonProperties
}), require_worker_admission.closedObject({
	catalogId: NonEmptyString,
	cursors: typebox.Type.Record(NonEmptyString, typebox.Type.String()),
	...SessionsCatalogListCommonProperties
})]);
require_worker_admission.closedObject({ catalogs: typebox.Type.Array(SessionCatalogSchema) });
const SessionCatalogTranscriptItemSchema = require_worker_admission.closedObject({
	id: typebox.Type.Optional(typebox.Type.String()),
	type: typebox.Type.Union([
		typebox.Type.Literal("userMessage"),
		typebox.Type.Literal("agentMessage"),
		typebox.Type.Literal("reasoning"),
		typebox.Type.Literal("toolCall"),
		typebox.Type.Literal("toolResult"),
		typebox.Type.Literal("other")
	]),
	text: typebox.Type.Optional(typebox.Type.String()),
	timestamp: typebox.Type.Optional(typebox.Type.String()),
	model: typebox.Type.Optional(typebox.Type.String()),
	truncated: typebox.Type.Optional(typebox.Type.Boolean()),
	raw: typebox.Type.Optional(PluginJsonValueSchema)
});
const SessionsCatalogReadParamsSchema = require_worker_admission.closedObject({
	catalogId: NonEmptyString,
	hostId: NonEmptyString,
	threadId: NonEmptyString,
	limit: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	cursor: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	hostId: NonEmptyString,
	label: typebox.Type.Optional(typebox.Type.String()),
	threadId: NonEmptyString,
	items: typebox.Type.Array(SessionCatalogTranscriptItemSchema),
	nextCursor: typebox.Type.Optional(typebox.Type.String())
});
const SessionsCatalogContinueParamsSchema = require_worker_admission.closedObject({
	catalogId: NonEmptyString,
	hostId: NonEmptyString,
	threadId: NonEmptyString
});
require_worker_admission.closedObject({ sessionKey: NonEmptyString });
const SessionsCatalogArchiveParamsSchema = require_worker_admission.closedObject({
	catalogId: NonEmptyString,
	hostId: NonEmptyString,
	threadId: NonEmptyString,
	confirmNoOtherRunner: typebox.Type.Literal(true)
});
require_worker_admission.closedObject({ ok: typebox.Type.Literal(true) });
//#endregion
//#region packages/gateway-protocol/src/schema/sessions-create.ts
/** Creates or adopts a session with optional model, thinking, label, and parent linkage. */
const SessionsCreateParamsSchema = require_worker_admission.closedObject({
	key: typebox.Type.Optional(NonEmptyString),
	agentId: typebox.Type.Optional(NonEmptyString),
	label: typebox.Type.Optional(SessionLabelString),
	model: typebox.Type.Optional(NonEmptyString),
	thinkingLevel: typebox.Type.Optional(NonEmptyString),
	catalogId: typebox.Type.Optional(NonEmptyString),
	parentSessionKey: typebox.Type.Optional(NonEmptyString),
	fork: typebox.Type.Optional(typebox.Type.Boolean({ description: "Fork the parent transcript; requires parentSessionKey." })),
	emitCommandHooks: typebox.Type.Optional(typebox.Type.Boolean()),
	task: typebox.Type.Optional(typebox.Type.String()),
	message: typebox.Type.Optional(typebox.Type.String()),
	attachments: typebox.Type.Optional(ChatAttachmentsSchema),
	worktree: typebox.Type.Optional(typebox.Type.Boolean()),
	worktreeBaseRef: typebox.Type.Optional(typebox.Type.String({
		minLength: 1,
		description: "Base ref for the new managed worktree branch. Requires worktree=true."
	})),
	worktreeName: typebox.Type.Optional(typebox.Type.String({
		pattern: "^[a-z0-9][a-z0-9-]{0,63}$",
		description: "Managed worktree name; becomes branch openclaw/<name>. Requires worktree=true."
	})),
	execNode: typebox.Type.Optional(typebox.Type.String({
		minLength: 1,
		description: "Bind session exec to host=node with this node id/name. Requires operator.admin."
	})),
	cwd: typebox.Type.Optional(typebox.Type.String({
		minLength: 1,
		description: "Absolute source directory for a managed worktree, or the working directory on execNode. Requires operator.admin."
	}))
});
//#endregion
//#region packages/gateway-protocol/src/schema/sessions.ts
/**
* Session protocol schemas.
*
* These requests and results cover transcript discovery, lifecycle control,
* compaction checkpoints, per-session plugin state, and usage reporting. The
* schemas are shared by dashboard, CLI, ACP, and gateway RPC callers.
*/
/** Reason a compaction checkpoint was created. */
const SessionCompactionCheckpointReasonSchema = typebox.Type.Union([
	typebox.Type.Literal("manual"),
	typebox.Type.Literal("auto-threshold"),
	typebox.Type.Literal("overflow-retry"),
	typebox.Type.Literal("timeout-retry")
]);
require_worker_admission.closedObject({
	operationId: NonEmptyString,
	operation: typebox.Type.Literal("compact"),
	phase: typebox.Type.Union([typebox.Type.Literal("start"), typebox.Type.Literal("end")]),
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	ts: typebox.Type.Integer({ minimum: 0 }),
	completed: typebox.Type.Optional(typebox.Type.Boolean()),
	reason: typebox.Type.Optional(typebox.Type.String())
});
/** Reference to the transcript location before or after compaction. */
const SessionCompactionTranscriptReferenceSchema = require_worker_admission.closedObject({
	sessionId: NonEmptyString,
	sessionFile: typebox.Type.Optional(NonEmptyString),
	leafId: typebox.Type.Optional(NonEmptyString),
	entryId: typebox.Type.Optional(NonEmptyString)
});
/** Stored compaction checkpoint metadata for branching or restoring a session. */
const SessionCompactionCheckpointSchema = require_worker_admission.closedObject({
	checkpointId: NonEmptyString,
	sessionKey: NonEmptyString,
	sessionId: NonEmptyString,
	createdAt: typebox.Type.Integer({ minimum: 0 }),
	reason: SessionCompactionCheckpointReasonSchema,
	tokensBefore: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	tokensAfter: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	summary: typebox.Type.Optional(typebox.Type.String()),
	firstKeptEntryId: typebox.Type.Optional(NonEmptyString),
	preCompaction: SessionCompactionTranscriptReferenceSchema,
	postCompaction: SessionCompactionTranscriptReferenceSchema
});
/** Session file grouping used by the Control UI session workspace rail. */
const SessionFileKindSchema = typebox.Type.Union([typebox.Type.Literal("modified"), typebox.Type.Literal("read")]);
/** Session relevance marker for browser entries. */
const SessionFileRelevanceSchema = typebox.Type.Union([
	typebox.Type.Literal("modified"),
	typebox.Type.Literal("read"),
	typebox.Type.Literal("mixed")
]);
const SessionFileHashSchema = typebox.Type.String({
	minLength: 64,
	maxLength: 64,
	pattern: "^[a-f0-9]{64}$"
});
/** One file path referenced by a session transcript. */
const SessionFileEntrySchema = require_worker_admission.closedObject({
	path: NonEmptyString,
	workspacePath: typebox.Type.Optional(NonEmptyString),
	name: NonEmptyString,
	kind: SessionFileKindSchema,
	missing: typebox.Type.Boolean(),
	size: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	updatedAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	content: typebox.Type.Optional(typebox.Type.String()),
	hash: typebox.Type.Optional(SessionFileHashSchema)
});
/** One file or folder in the session-rooted browser. */
const SessionFileBrowserEntrySchema = require_worker_admission.closedObject({
	path: typebox.Type.String(),
	name: NonEmptyString,
	kind: typebox.Type.Union([typebox.Type.Literal("file"), typebox.Type.Literal("directory")]),
	sessionKind: typebox.Type.Optional(SessionFileRelevanceSchema),
	size: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	updatedAtMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/** Folder listing or search result rooted at the session workspace. */
const SessionFileBrowserResultSchema = require_worker_admission.closedObject({
	path: typebox.Type.String(),
	parentPath: typebox.Type.Optional(typebox.Type.String()),
	search: typebox.Type.Optional(typebox.Type.String()),
	entries: typebox.Type.Array(SessionFileBrowserEntrySchema),
	truncated: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Lists files touched by a session transcript. */
const SessionsFilesListParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	path: typebox.Type.Optional(typebox.Type.String()),
	search: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	root: typebox.Type.Optional(NonEmptyString),
	files: typebox.Type.Array(SessionFileEntrySchema),
	browser: typebox.Type.Optional(SessionFileBrowserResultSchema)
});
/** Reads one session-referenced file by path. */
const SessionsFilesGetParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	path: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString)
});
require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	root: typebox.Type.Optional(NonEmptyString),
	file: SessionFileEntrySchema
});
/** Overwrites one existing session workspace file with hash-based CAS. */
const SessionsFilesSetParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	path: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	content: typebox.Type.String(),
	expectedHash: SessionFileHashSchema
});
require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	root: typebox.Type.Optional(NonEmptyString),
	file: SessionFileEntrySchema
});
/** Change status for one file in a session checkout diff. */
const SessionDiffFileStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("added"),
	typebox.Type.Literal("modified"),
	typebox.Type.Literal("deleted"),
	typebox.Type.Literal("renamed")
]);
/** One changed file in a session checkout diff. */
const SessionDiffFileSchema = require_worker_admission.closedObject({
	path: NonEmptyString,
	oldPath: typebox.Type.Optional(NonEmptyString),
	status: SessionDiffFileStatusSchema,
	additions: typebox.Type.Integer({ minimum: 0 }),
	deletions: typebox.Type.Integer({ minimum: 0 }),
	binary: typebox.Type.Optional(typebox.Type.Boolean()),
	untracked: typebox.Type.Optional(typebox.Type.Boolean()),
	/** Per-file unified patch text; absent for binary or oversized files. */
	patch: typebox.Type.Optional(typebox.Type.String()),
	truncated: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Reads the git diff of a session checkout against its base branch. */
const SessionsDiffParamsSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString)
});
require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	root: typebox.Type.Optional(NonEmptyString),
	branch: typebox.Type.Optional(NonEmptyString),
	/** Display label of the diff base: the default branch name or "HEAD". */
	baseRef: typebox.Type.Optional(NonEmptyString),
	files: typebox.Type.Array(SessionDiffFileSchema),
	additions: typebox.Type.Integer({ minimum: 0 }),
	deletions: typebox.Type.Integer({ minimum: 0 }),
	truncated: typebox.Type.Optional(typebox.Type.Boolean()),
	unavailableReason: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("unknown_session"), typebox.Type.Literal("not_git")]))
});
/** Lists sessions with optional scope, activity, label, and preview filters. */
const SessionsListParamsSchema = require_worker_admission.closedObject({
	/** Maximum rows to return; omitted Gateway RPC calls use a bounded default. */
	limit: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	offset: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	activeMinutes: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	/** Require a real user/channel interaction; excludes synthetic isolated heartbeat rows. */
	requireLastInteraction: typebox.Type.Optional(typebox.Type.Boolean()),
	sortBy: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("updatedAt"), typebox.Type.Literal("lastInteractionAt")])),
	includeGlobal: typebox.Type.Optional(typebox.Type.Boolean()),
	includeUnknown: typebox.Type.Optional(typebox.Type.Boolean()),
	/** Limit agent-scoped rows to agents currently present in config. */
	configuredAgentsOnly: typebox.Type.Optional(typebox.Type.Boolean()),
	/**
	* Read first 8KB of each session transcript to derive title from first user message.
	* Performs a file read per session - use `limit` to bound result set on large stores.
	*/
	includeDerivedTitles: typebox.Type.Optional(typebox.Type.Boolean()),
	/**
	* Read last 16KB of each session transcript to extract most recent message preview.
	* Performs a file read per session - use `limit` to bound result set on large stores.
	*/
	includeLastMessage: typebox.Type.Optional(typebox.Type.Boolean()),
	label: typebox.Type.Optional(SessionLabelString),
	spawnedBy: typebox.Type.Optional(NonEmptyString),
	agentId: typebox.Type.Optional(NonEmptyString),
	search: typebox.Type.Optional(typebox.Type.String()),
	/** True lists archived sessions; false or omitted lists active sessions. */
	archived: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Searches one agent's indexed session transcripts, optionally within selected sessions. */
const SessionsSearchParamsSchema = require_worker_admission.closedObject({
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKeys: typebox.Type.Optional(typebox.Type.Array(NonEmptyString, {
		minItems: 1,
		maxItems: 200
	})),
	query: typebox.Type.String({
		minLength: 1,
		maxLength: 4096
	}),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 25
	}))
});
/** One full-text session transcript match with follow-up provenance. */
const SessionsSearchHitSchema = require_worker_admission.closedObject({
	sessionKey: NonEmptyString,
	sessionId: NonEmptyString,
	messageId: NonEmptyString,
	role: typebox.Type.Union([typebox.Type.Literal("user"), typebox.Type.Literal("assistant")]),
	timestamp: typebox.Type.Integer({ minimum: 0 }),
	snippet: typebox.Type.String(),
	score: typebox.Type.Number()
});
/** Full-text search response; indexing marks a still-running first-use reconcile. */
const SessionsSearchResultSchema = require_worker_admission.closedObject({
	results: typebox.Type.Array(SessionsSearchHitSchema),
	indexing: typebox.Type.Optional(typebox.Type.Boolean()),
	truncated: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Repairs or removes invalid session records from the selected agent scope. */
const SessionsCleanupParamsSchema = require_worker_admission.closedObject({
	agent: typebox.Type.Optional(NonEmptyString),
	allAgents: typebox.Type.Optional(typebox.Type.Boolean()),
	enforce: typebox.Type.Optional(typebox.Type.Boolean()),
	activeKey: typebox.Type.Optional(NonEmptyString),
	fixMissing: typebox.Type.Optional(typebox.Type.Boolean()),
	fixDmScope: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Reads short previews for selected session keys. */
const SessionsPreviewParamsSchema = require_worker_admission.closedObject({
	keys: typebox.Type.Array(NonEmptyString, { minItems: 1 }),
	limit: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	maxChars: typebox.Type.Optional(typebox.Type.Integer({ minimum: 20 }))
});
/** Describes one session and optional derived title/last-message previews. */
const SessionsDescribeParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	includeDerivedTitles: typebox.Type.Optional(typebox.Type.Boolean()),
	includeLastMessage: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Resolves a session by key, raw session id, label, or parent/agent scope. */
const SessionsResolveParamsSchema = require_worker_admission.closedObject({
	key: typebox.Type.Optional(NonEmptyString),
	sessionId: typebox.Type.Optional(NonEmptyString),
	label: typebox.Type.Optional(SessionLabelString),
	agentId: typebox.Type.Optional(NonEmptyString),
	spawnedBy: typebox.Type.Optional(NonEmptyString),
	includeGlobal: typebox.Type.Optional(typebox.Type.Boolean()),
	includeUnknown: typebox.Type.Optional(typebox.Type.Boolean()),
	/** Return a successful `{ ok: false }` response when the selector does not match a session. */
	allowMissing: typebox.Type.Optional(typebox.Type.Boolean())
});
const SessionWorktreeInfoSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	path: NonEmptyString,
	branch: NonEmptyString
});
typebox.Type.Object({
	ok: typebox.Type.Literal(true),
	key: NonEmptyString,
	sessionId: typebox.Type.Optional(NonEmptyString),
	entry: typebox.Type.Optional(typebox.Type.Record(typebox.Type.String(), typebox.Type.Unknown())),
	runStarted: typebox.Type.Optional(typebox.Type.Boolean()),
	runError: typebox.Type.Optional(ErrorShapeSchema),
	worktree: typebox.Type.Optional(SessionWorktreeInfoSchema)
}, { additionalProperties: true });
/** Sends one message into an existing session. */
const SessionsSendParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	message: typebox.Type.String(),
	thinking: typebox.Type.Optional(typebox.Type.String()),
	attachments: typebox.Type.Optional(typebox.Type.Array(typebox.Type.Unknown())),
	timeoutMs: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	idempotencyKey: typebox.Type.Optional(NonEmptyString)
});
/** Subscribes a client to live message updates for one session. */
const SessionsMessagesSubscribeParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	/** Opt in to sanitized durable approval events for this session and its descendants. */
	includeApprovals: typebox.Type.Optional(typebox.Type.Literal(true))
});
/** Removes a live message subscription for one session. */
const SessionsMessagesUnsubscribeParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString)
});
/** Aborts the active or named run for a session. */
const SessionsAbortParamsSchema = require_worker_admission.closedObject({
	key: typebox.Type.Optional(NonEmptyString),
	runId: typebox.Type.Optional(NonEmptyString),
	agentId: typebox.Type.Optional(NonEmptyString)
});
/** Mutable per-session preferences and routing metadata. */
const SessionsPatchParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	label: typebox.Type.Optional(typebox.Type.Union([SessionLabelString, typebox.Type.Null()])),
	/** User-defined organization bucket ("category", not chat-group); null clears it. */
	category: typebox.Type.Optional(typebox.Type.Union([SessionLabelString, typebox.Type.Null()])),
	archived: typebox.Type.Optional(typebox.Type.Boolean()),
	pinned: typebox.Type.Optional(typebox.Type.Boolean()),
	unread: typebox.Type.Optional(typebox.Type.Boolean({ description: "Set true to mark unread; false records the session as read." })),
	thinkingLevel: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	fastMode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Boolean(),
		typebox.Type.Literal("auto"),
		typebox.Type.Null()
	])),
	verboseLevel: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	traceLevel: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	reasoningLevel: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	responseUsage: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("off"),
		typebox.Type.Literal("tokens"),
		typebox.Type.Literal("full"),
		typebox.Type.Literal("on"),
		typebox.Type.Null()
	])),
	elevatedLevel: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	execHost: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	execSecurity: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	execAsk: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	execNode: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	model: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	spawnedBy: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	spawnedWorkspaceDir: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	spawnedCwd: typebox.Type.Optional(typebox.Type.Union([NonEmptyString, typebox.Type.Null()])),
	spawnDepth: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Integer({ minimum: 0 }), typebox.Type.Null()])),
	subagentRole: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("orchestrator"),
		typebox.Type.Literal("leaf"),
		typebox.Type.Null()
	])),
	subagentControlScope: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("children"),
		typebox.Type.Literal("none"),
		typebox.Type.Null()
	])),
	inheritedToolAllow: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Array(NonEmptyString), typebox.Type.Null()])),
	inheritedToolDeny: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Array(NonEmptyString), typebox.Type.Null()])),
	sendPolicy: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("allow"),
		typebox.Type.Literal("deny"),
		typebox.Type.Null()
	])),
	groupActivation: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("mention"),
		typebox.Type.Literal("always"),
		typebox.Type.Null()
	]))
});
/** Updates or clears one plugin namespace value on a session record. */
const SessionsPluginPatchParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	pluginId: NonEmptyString,
	namespace: NonEmptyString,
	value: typebox.Type.Optional(PluginJsonValueSchema),
	unset: typebox.Type.Optional(typebox.Type.Boolean())
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	key: NonEmptyString,
	value: typebox.Type.Optional(PluginJsonValueSchema)
});
/** Resets a session to a new or reset transcript state. */
const SessionsResetParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	reason: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("new"), typebox.Type.Literal("reset")]))
});
/** Deletes a session record and optionally its transcript. */
const SessionsDeleteParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	deleteTranscript: typebox.Type.Optional(typebox.Type.Boolean()),
	expectedSessionId: typebox.Type.Optional(NonEmptyString),
	expectedLifecycleRevision: typebox.Type.Optional(NonEmptyString),
	expectedSessionUpdatedAt: typebox.Type.Optional(typebox.Type.Number({ minimum: 0 })),
	emitLifecycleHooks: typebox.Type.Optional(typebox.Type.Boolean()),
	/**
	* Restricts the delete to already-archived sessions (archive-then-delete).
	* operator.write callers must set this; deletes without it require
	* operator.admin.
	*/
	archivedOnly: typebox.Type.Optional(typebox.Type.Boolean())
});
/** Lists the gateway-owned custom session group catalog (names + order). */
const SessionsGroupsListParamsSchema = require_worker_admission.closedObject({});
/** One custom session group catalog entry. */
const SessionGroupSchema = require_worker_admission.closedObject({
	name: SessionLabelString,
	position: typebox.Type.Integer({ minimum: 0 })
});
require_worker_admission.closedObject({ groups: typebox.Type.Array(SessionGroupSchema) });
/** Replaces the ordered group catalog; creates listed names, keeps member categories untouched. */
const SessionsGroupsPutParamsSchema = require_worker_admission.closedObject({ names: typebox.Type.Array(SessionLabelString, { maxItems: 200 }) });
/** Renames a group and repoints every member session's category. */
const SessionsGroupsRenameParamsSchema = require_worker_admission.closedObject({
	name: SessionLabelString,
	to: SessionLabelString
});
/** Deletes a group and clears every member session's category. */
const SessionsGroupsDeleteParamsSchema = require_worker_admission.closedObject({ name: SessionLabelString });
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	groups: typebox.Type.Array(SessionGroupSchema),
	updatedSessions: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
/** Requests manual compaction for a session transcript. */
const SessionsCompactParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	maxLines: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 }))
});
/** Lists compaction checkpoints for one session. */
const SessionsCompactionListParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString)
});
/** Reads one compaction checkpoint by id. */
const SessionsCompactionGetParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	checkpointId: NonEmptyString
});
/** Creates a new branch from a compaction checkpoint. */
const SessionsCompactionBranchParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	checkpointId: NonEmptyString
});
/** Restores an existing session to a compaction checkpoint. */
const SessionsCompactionRestoreParamsSchema = require_worker_admission.closedObject({
	key: NonEmptyString,
	agentId: typebox.Type.Optional(NonEmptyString),
	checkpointId: NonEmptyString
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	key: NonEmptyString,
	checkpoints: typebox.Type.Array(SessionCompactionCheckpointSchema)
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	key: NonEmptyString,
	checkpoint: SessionCompactionCheckpointSchema
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	sourceKey: NonEmptyString,
	key: NonEmptyString,
	sessionId: NonEmptyString,
	checkpoint: SessionCompactionCheckpointSchema,
	entry: typebox.Type.Object({
		sessionId: NonEmptyString,
		updatedAt: typebox.Type.Integer({ minimum: 0 })
	}, { additionalProperties: true })
});
require_worker_admission.closedObject({
	ok: typebox.Type.Literal(true),
	key: NonEmptyString,
	sessionId: NonEmptyString,
	checkpoint: SessionCompactionCheckpointSchema,
	entry: typebox.Type.Object({
		sessionId: NonEmptyString,
		updatedAt: typebox.Type.Integer({ minimum: 0 })
	}, { additionalProperties: true })
});
/** Usage report query across one session, one agent, or all agent sessions. */
const SessionsUsageParamsSchema = require_worker_admission.closedObject({
	/** Specific session key to analyze; if omitted returns sessions for the effective agent. */
	key: typebox.Type.Optional(NonEmptyString),
	/** Agent scope for list-style usage queries. */
	agentId: typebox.Type.Optional(NonEmptyString),
	/** Explicit all-agent scope for list-style usage queries. */
	agentScope: typebox.Type.Optional(typebox.Type.Literal("all")),
	/** Start date for range filter (YYYY-MM-DD). */
	startDate: typebox.Type.Optional(typebox.Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
	/** End date for range filter (YYYY-MM-DD). */
	endDate: typebox.Type.Optional(typebox.Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
	/** How start/end dates should be interpreted. Defaults to UTC when omitted. */
	mode: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("utc"),
		typebox.Type.Literal("gateway"),
		typebox.Type.Literal("specific")
	])),
	/** Preset range for usage queries when explicit start/end dates are omitted. */
	range: typebox.Type.Optional(typebox.Type.Union([
		typebox.Type.Literal("7d"),
		typebox.Type.Literal("30d"),
		typebox.Type.Literal("90d"),
		typebox.Type.Literal("1y"),
		typebox.Type.Literal("all")
	])),
	/** Usage row grouping. `family` rolls up known rotated session ids for a logical key. */
	groupBy: typebox.Type.Optional(typebox.Type.Union([typebox.Type.Literal("instance"), typebox.Type.Literal("family")])),
	/** Backward-compatible alias for requesting family grouping. */
	includeHistorical: typebox.Type.Optional(typebox.Type.Boolean()),
	/** UTC offset to use when mode is `specific` (for example, UTC-4 or UTC+5:30). */
	utcOffset: typebox.Type.Optional(typebox.Type.String({ pattern: "^UTC[+-]\\d{1,2}(?::[0-5]\\d)?$" })),
	/** IANA time zone for `specific`; preferred over `utcOffset`, which remains a compatibility fallback. */
	timeZone: typebox.Type.Optional(NonEmptyString),
	/** Maximum sessions to return (default 50). */
	limit: typebox.Type.Optional(typebox.Type.Integer({ minimum: 1 })),
	/** Include context weight breakdown (systemPromptReport). */
	includeContextWeight: typebox.Type.Optional(typebox.Type.Boolean())
});
//#endregion
//#region packages/gateway-protocol/src/schema/skill-protocol-schemas.ts
const SkillWorkshopProtocolSchemas = {
	SkillsProposalsListParams: SkillsProposalsListParamsSchema,
	SkillsProposalsListResult: SkillsProposalsListResultSchema,
	SkillsProposalHistoryStatusParams: SkillsProposalHistoryStatusParamsSchema,
	SkillsProposalHistoryScanParams: SkillsProposalHistoryScanParamsSchema,
	SkillsProposalHistoryScanResult: SkillsProposalHistoryScanResultSchema
};
//#endregion
//#region packages/gateway-protocol/src/schema/system-info.ts
/** Empty request payload for Gateway host system information. */
const SystemInfoParamsSchema = require_worker_admission.closedObject({});
/** Gateway host identity and resource snapshot. */
const SystemInfoResultSchema = require_worker_admission.closedObject({
	machineName: typebox.Type.String(),
	hostname: typebox.Type.String(),
	platform: typebox.Type.String(),
	release: typebox.Type.String(),
	arch: typebox.Type.String(),
	osLabel: typebox.Type.String(),
	lanAddress: typebox.Type.Optional(typebox.Type.String()),
	port: typebox.Type.Optional(typebox.Type.Integer()),
	nodeVersion: typebox.Type.String(),
	pid: typebox.Type.Integer(),
	/** Process-start identity for invalidating work that cannot survive a Gateway restart. */
	processInstanceId: typebox.Type.Optional(typebox.Type.String({ minLength: 1 })),
	uptimeMs: typebox.Type.Integer(),
	cpuCount: typebox.Type.Integer(),
	cpuModel: typebox.Type.Optional(typebox.Type.String()),
	loadAverage: typebox.Type.Optional(typebox.Type.Tuple([
		typebox.Type.Number(),
		typebox.Type.Number(),
		typebox.Type.Number()
	])),
	memoryTotalBytes: typebox.Type.Integer(),
	memoryFreeBytes: typebox.Type.Integer(),
	diskTotalBytes: typebox.Type.Optional(typebox.Type.Integer()),
	diskAvailableBytes: typebox.Type.Optional(typebox.Type.Integer()),
	diskPath: typebox.Type.Optional(typebox.Type.String())
});
//#endregion
//#region packages/gateway-protocol/src/schema/task-suggestions.ts
const TaskIdSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 128
});
const TaskTitleSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 60
});
const TaskPromptSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 32768
});
const TaskTldrSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 1024
});
const TaskCwdSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 4096
});
const TaskSessionKeySchema = typebox.Type.String({
	minLength: 1,
	maxLength: 512
});
const TaskAgentIdSchema = typebox.Type.String({
	minLength: 1,
	maxLength: 128
});
/** One model-proposed follow-up task waiting for operator action. */
const TaskSuggestionSchema = require_worker_admission.closedObject({
	id: TaskIdSchema,
	title: TaskTitleSchema,
	prompt: TaskPromptSchema,
	tldr: TaskTldrSchema,
	cwd: TaskCwdSchema,
	sessionKey: TaskSessionKeySchema,
	agentId: typebox.Type.Optional(TaskAgentIdSchema),
	createdAt: typebox.Type.Integer({ minimum: 0 })
});
/** Lists pending suggestions, optionally narrowed to one source session. */
const TaskSuggestionsListParamsSchema = require_worker_admission.closedObject({
	sessionKey: typebox.Type.Optional(TaskSessionKeySchema),
	agentId: typebox.Type.Optional(TaskAgentIdSchema)
});
require_worker_admission.closedObject({ suggestions: typebox.Type.Array(TaskSuggestionSchema) });
/** Creates a pending suggestion without starting any work. */
const TaskSuggestionsCreateParamsSchema = require_worker_admission.closedObject({
	title: TaskTitleSchema,
	prompt: TaskPromptSchema,
	tldr: TaskTldrSchema,
	cwd: TaskCwdSchema,
	sessionKey: TaskSessionKeySchema,
	agentId: typebox.Type.Optional(TaskAgentIdSchema)
});
require_worker_admission.closedObject({
	taskId: TaskIdSchema,
	suggestion: TaskSuggestionSchema
});
const TaskSuggestionResolutionSchema = typebox.Type.Union([
	typebox.Type.Literal("dismissed"),
	typebox.Type.Literal("accepted"),
	typebox.Type.Literal("expired")
]);
/** Atomically claims a pending suggestion and starts its server-owned worktree session. */
const TaskSuggestionsAcceptParamsSchema = require_worker_admission.closedObject({ taskId: TaskIdSchema });
require_worker_admission.closedObject({
	taskId: TaskIdSchema,
	key: TaskSessionKeySchema
});
/** Removes a pending suggestion without starting work. */
const TaskSuggestionsDismissParamsSchema = require_worker_admission.closedObject({
	taskId: TaskIdSchema,
	reason: typebox.Type.Optional(typebox.Type.String({ maxLength: 1024 }))
});
require_worker_admission.closedObject({
	taskId: TaskIdSchema,
	dismissed: typebox.Type.Boolean()
});
typebox.Type.Union([require_worker_admission.closedObject({
	action: typebox.Type.Literal("created"),
	suggestion: TaskSuggestionSchema
}), require_worker_admission.closedObject({
	action: typebox.Type.Literal("resolved"),
	taskId: TaskIdSchema,
	resolution: TaskSuggestionResolutionSchema
})]);
//#endregion
//#region packages/gateway-protocol/src/schema/tasks.ts
/**
* Task ledger protocol schemas.
*
* Tasks represent long-running SDK/agent operations exposed through the gateway;
* these schemas keep list/get/cancel payloads bounded and status values closed.
*/
/** Closed task lifecycle statuses visible in the gateway task ledger. */
const TaskLedgerStatusSchema = typebox.Type.Union([
	typebox.Type.Literal("queued"),
	typebox.Type.Literal("running"),
	typebox.Type.Literal("completed"),
	typebox.Type.Literal("failed"),
	typebox.Type.Literal("cancelled"),
	typebox.Type.Literal("timed_out")
]);
const TimestampSchema = typebox.Type.Union([typebox.Type.String(), typebox.Type.Integer({ minimum: 0 })]);
/** Public task summary returned by task list/get/cancel responses. */
const TaskSummarySchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	kind: typebox.Type.Optional(typebox.Type.String()),
	runtime: typebox.Type.Optional(typebox.Type.String()),
	status: TaskLedgerStatusSchema,
	title: typebox.Type.Optional(typebox.Type.String()),
	agentId: typebox.Type.Optional(typebox.Type.String()),
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	childSessionKey: typebox.Type.Optional(typebox.Type.String()),
	ownerKey: typebox.Type.Optional(typebox.Type.String()),
	runId: typebox.Type.Optional(typebox.Type.String()),
	taskId: typebox.Type.Optional(typebox.Type.String()),
	flowId: typebox.Type.Optional(typebox.Type.String()),
	parentTaskId: typebox.Type.Optional(typebox.Type.String()),
	sourceId: typebox.Type.Optional(typebox.Type.String()),
	createdAt: typebox.Type.Optional(TimestampSchema),
	updatedAt: typebox.Type.Optional(TimestampSchema),
	startedAt: typebox.Type.Optional(TimestampSchema),
	endedAt: typebox.Type.Optional(TimestampSchema),
	toolUseCount: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 })),
	lastToolName: typebox.Type.Optional(typebox.Type.String()),
	progressSummary: typebox.Type.Optional(typebox.Type.String()),
	terminalSummary: typebox.Type.Optional(typebox.Type.String()),
	error: typebox.Type.Optional(typebox.Type.String())
});
/** Task list filters with bounded pagination. */
const TasksListParamsSchema = require_worker_admission.closedObject({
	status: typebox.Type.Optional(typebox.Type.Union([TaskLedgerStatusSchema, typebox.Type.Array(TaskLedgerStatusSchema)])),
	agentId: typebox.Type.Optional(NonEmptyString),
	sessionKey: typebox.Type.Optional(NonEmptyString),
	limit: typebox.Type.Optional(typebox.Type.Integer({
		minimum: 1,
		maximum: 500
	})),
	cursor: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	tasks: typebox.Type.Array(TaskSummarySchema),
	nextCursor: typebox.Type.Optional(typebox.Type.String())
});
/** Lookup request for one task id. */
const TasksGetParamsSchema = require_worker_admission.closedObject({ taskId: NonEmptyString });
require_worker_admission.closedObject({ task: TaskSummarySchema });
/** Cancel request for one task id with optional operator reason. */
const TasksCancelParamsSchema = require_worker_admission.closedObject({
	taskId: NonEmptyString,
	reason: typebox.Type.Optional(typebox.Type.String())
});
require_worker_admission.closedObject({
	found: typebox.Type.Boolean(),
	cancelled: typebox.Type.Boolean(),
	reason: typebox.Type.Optional(typebox.Type.String()),
	task: typebox.Type.Optional(TaskSummarySchema)
});
//#endregion
//#region packages/gateway-protocol/src/schema/terminal-protocol-schemas.ts
const TerminalProtocolSchemas = {
	TerminalOpenParams: TerminalOpenParamsSchema,
	TerminalOpenResult: TerminalOpenResultSchema,
	TerminalInputParams: TerminalInputParamsSchema,
	TerminalResizeParams: TerminalResizeParamsSchema,
	TerminalCloseParams: TerminalCloseParamsSchema,
	TerminalAttachParams: TerminalAttachParamsSchema,
	TerminalAttachResult: TerminalAttachResultSchema,
	TerminalSessionInfo: TerminalSessionInfoSchema,
	TerminalListResult: TerminalListResultSchema,
	TerminalTextParams: TerminalTextParamsSchema,
	TerminalTextResult: TerminalTextResultSchema,
	TerminalUploadParams: TerminalUploadParamsSchema,
	TerminalUploadResult: TerminalUploadResultSchema,
	TerminalAckResult: TerminalAckResultSchema,
	TerminalDataEvent: TerminalDataEventSchema,
	TerminalExitEvent: TerminalExitEventSchema,
	TerminalEvent: TerminalEventSchema
};
//#endregion
//#region packages/gateway-protocol/src/schema/worktrees.ts
const WorktreeNameSchema = typebox.Type.String({ pattern: "^[a-z0-9][a-z0-9-]{0,63}$" });
const WorktreeRecordSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	name: WorktreeNameSchema,
	repoFingerprint: typebox.Type.String({ pattern: "^[a-f0-9]{16}$" }),
	repoRoot: NonEmptyString,
	path: NonEmptyString,
	branch: NonEmptyString,
	baseRef: NonEmptyString,
	ownerKind: typebox.Type.String({ enum: [
		"manual",
		"workboard",
		"session"
	] }),
	ownerId: typebox.Type.Optional(NonEmptyString),
	snapshotRef: typebox.Type.Optional(NonEmptyString),
	createdAt: typebox.Type.Integer({ minimum: 0 }),
	lastActiveAt: typebox.Type.Integer({ minimum: 0 }),
	removedAt: typebox.Type.Optional(typebox.Type.Integer({ minimum: 0 }))
});
const WorktreesListParamsSchema = require_worker_admission.closedObject({});
require_worker_admission.closedObject({ worktrees: typebox.Type.Array(WorktreeRecordSchema) });
const WorktreesCreateParamsSchema = require_worker_admission.closedObject({
	repoRoot: NonEmptyString,
	name: typebox.Type.Optional(WorktreeNameSchema),
	baseRef: typebox.Type.Optional(NonEmptyString)
});
const WorktreesRemoveParamsSchema = require_worker_admission.closedObject({
	id: NonEmptyString,
	force: typebox.Type.Optional(typebox.Type.Boolean())
});
require_worker_admission.closedObject({
	removed: typebox.Type.Boolean(),
	snapshotRef: typebox.Type.Optional(NonEmptyString),
	/** Why the pre-removal snapshot failed; present only on forced removals that continued without one. */
	snapshotError: typebox.Type.Optional(NonEmptyString)
});
const WorktreesBranchesParamsSchema = require_worker_admission.closedObject({ repoRoot: NonEmptyString });
const WorktreeBranchSchema = require_worker_admission.closedObject({
	name: NonEmptyString,
	kind: typebox.Type.Union([typebox.Type.Literal("local"), typebox.Type.Literal("remote")])
});
require_worker_admission.closedObject({
	branches: typebox.Type.Array(WorktreeBranchSchema),
	defaultBranch: typebox.Type.Optional(NonEmptyString),
	headBranch: typebox.Type.Optional(NonEmptyString)
});
const WorktreesRestoreParamsSchema = require_worker_admission.closedObject({ id: NonEmptyString });
const WorktreesGcParamsSchema = require_worker_admission.closedObject({});
require_worker_admission.closedObject({
	removed: typebox.Type.Array(NonEmptyString),
	orphansDeleted: typebox.Type.Integer({ minimum: 0 }),
	snapshotsPruned: typebox.Type.Integer({ minimum: 0 })
});
require_worker_admission.WorkerAdmissionHandshakeSchema, { ...NodeInvokeProtocolSchemas }, { ...NodePresenceProtocolSchemas }, { ...SessionPlacementProtocolSchemas }, { ...SkillWorkshopProtocolSchemas }, {
	...LogMigrationProtocolSchemas,
	...TerminalProtocolSchemas
};
const validateSystemEventParams = lazyCompile(require_worker_admission.closedObject({
	text: typebox.Type.String(),
	idempotencyKey: typebox.Type.Optional(typebox.Type.String({ minLength: 1 })),
	sessionKey: typebox.Type.Optional(typebox.Type.String()),
	wake: typebox.Type.Optional(typebox.Type.Boolean()),
	deviceId: typebox.Type.Optional(typebox.Type.String()),
	instanceId: typebox.Type.Optional(typebox.Type.String()),
	host: typebox.Type.Optional(typebox.Type.String()),
	ip: typebox.Type.Optional(typebox.Type.String()),
	mode: typebox.Type.Optional(typebox.Type.String()),
	version: typebox.Type.Optional(typebox.Type.String()),
	platform: typebox.Type.Optional(typebox.Type.String()),
	deviceFamily: typebox.Type.Optional(typebox.Type.String()),
	modelIdentifier: typebox.Type.Optional(typebox.Type.String()),
	lastInputSeconds: typebox.Type.Optional(typebox.Type.Number()),
	reason: typebox.Type.Optional(typebox.Type.String()),
	roles: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	scopes: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String())),
	tags: typebox.Type.Optional(typebox.Type.Array(typebox.Type.String()))
}));
//#endregion
Object.defineProperty(exports, "AgentIdentityParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentIdentityParamsSchema;
	}
});
Object.defineProperty(exports, "AgentParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentParamsSchema;
	}
});
Object.defineProperty(exports, "AgentWaitParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentWaitParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsCreateParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsCreateParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsDeleteParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsDeleteParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsFilesGetParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsFilesGetParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsFilesListParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsFilesListParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsFilesSetParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsFilesSetParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsListParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsListParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsUpdateParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsUpdateParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsWorkspaceGetParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsWorkspaceGetParamsSchema;
	}
});
Object.defineProperty(exports, "AgentsWorkspaceListParamsSchema", {
	enumerable: true,
	get: function() {
		return AgentsWorkspaceListParamsSchema;
	}
});
Object.defineProperty(exports, "AllowedApprovalSnapshotSchema", {
	enumerable: true,
	get: function() {
		return AllowedApprovalSnapshotSchema;
	}
});
Object.defineProperty(exports, "ApprovalAllowDecisionSchema", {
	enumerable: true,
	get: function() {
		return ApprovalAllowDecisionSchema;
	}
});
Object.defineProperty(exports, "ApprovalDecisionSchema", {
	enumerable: true,
	get: function() {
		return ApprovalDecisionSchema;
	}
});
Object.defineProperty(exports, "ApprovalGetParamsSchema", {
	enumerable: true,
	get: function() {
		return ApprovalGetParamsSchema;
	}
});
Object.defineProperty(exports, "ApprovalGetResultSchema", {
	enumerable: true,
	get: function() {
		return ApprovalGetResultSchema;
	}
});
Object.defineProperty(exports, "ApprovalKindSchema", {
	enumerable: true,
	get: function() {
		return ApprovalKindSchema;
	}
});
Object.defineProperty(exports, "ApprovalPresentationSchema", {
	enumerable: true,
	get: function() {
		return ApprovalPresentationSchema;
	}
});
Object.defineProperty(exports, "ApprovalResolveParamsSchema", {
	enumerable: true,
	get: function() {
		return ApprovalResolveParamsSchema;
	}
});
Object.defineProperty(exports, "ApprovalResolveResultSchema", {
	enumerable: true,
	get: function() {
		return ApprovalResolveResultSchema;
	}
});
Object.defineProperty(exports, "ApprovalSnapshotSchema", {
	enumerable: true,
	get: function() {
		return ApprovalSnapshotSchema;
	}
});
Object.defineProperty(exports, "ApprovalTerminalReasonSchema", {
	enumerable: true,
	get: function() {
		return ApprovalTerminalReasonSchema;
	}
});
Object.defineProperty(exports, "ArtifactsDownloadParamsSchema", {
	enumerable: true,
	get: function() {
		return ArtifactsDownloadParamsSchema;
	}
});
Object.defineProperty(exports, "ArtifactsGetParamsSchema", {
	enumerable: true,
	get: function() {
		return ArtifactsGetParamsSchema;
	}
});
Object.defineProperty(exports, "ArtifactsListParamsSchema", {
	enumerable: true,
	get: function() {
		return ArtifactsListParamsSchema;
	}
});
Object.defineProperty(exports, "AuditActivityListParamsSchema", {
	enumerable: true,
	get: function() {
		return AuditActivityListParamsSchema;
	}
});
Object.defineProperty(exports, "AuditListParamsSchema", {
	enumerable: true,
	get: function() {
		return AuditListParamsSchema;
	}
});
Object.defineProperty(exports, "COMMAND_DESCRIPTION_MAX_LENGTH", {
	enumerable: true,
	get: function() {
		return COMMAND_DESCRIPTION_MAX_LENGTH;
	}
});
Object.defineProperty(exports, "CancelledApprovalSnapshotSchema", {
	enumerable: true,
	get: function() {
		return CancelledApprovalSnapshotSchema;
	}
});
Object.defineProperty(exports, "ChannelsLogoutParamsSchema", {
	enumerable: true,
	get: function() {
		return ChannelsLogoutParamsSchema;
	}
});
Object.defineProperty(exports, "ChannelsStartParamsSchema", {
	enumerable: true,
	get: function() {
		return ChannelsStartParamsSchema;
	}
});
Object.defineProperty(exports, "ChannelsStatusParamsSchema", {
	enumerable: true,
	get: function() {
		return ChannelsStatusParamsSchema;
	}
});
Object.defineProperty(exports, "ChannelsStopParamsSchema", {
	enumerable: true,
	get: function() {
		return ChannelsStopParamsSchema;
	}
});
Object.defineProperty(exports, "ChatAbortParamsSchema", {
	enumerable: true,
	get: function() {
		return ChatAbortParamsSchema;
	}
});
Object.defineProperty(exports, "ChatEventSchema", {
	enumerable: true,
	get: function() {
		return ChatEventSchema;
	}
});
Object.defineProperty(exports, "ChatHistoryParamsSchema", {
	enumerable: true,
	get: function() {
		return ChatHistoryParamsSchema;
	}
});
Object.defineProperty(exports, "ChatInjectParamsSchema", {
	enumerable: true,
	get: function() {
		return ChatInjectParamsSchema;
	}
});
Object.defineProperty(exports, "ChatMessageGetParamsSchema", {
	enumerable: true,
	get: function() {
		return ChatMessageGetParamsSchema;
	}
});
Object.defineProperty(exports, "ChatMessageGetResultSchema", {
	enumerable: true,
	get: function() {
		return ChatMessageGetResultSchema;
	}
});
Object.defineProperty(exports, "ChatMetadataParamsSchema", {
	enumerable: true,
	get: function() {
		return ChatMetadataParamsSchema;
	}
});
Object.defineProperty(exports, "ChatSendParamsSchema", {
	enumerable: true,
	get: function() {
		return ChatSendParamsSchema;
	}
});
Object.defineProperty(exports, "ChatToolTitlesParamsSchema", {
	enumerable: true,
	get: function() {
		return ChatToolTitlesParamsSchema;
	}
});
Object.defineProperty(exports, "CommandsListParamsSchema", {
	enumerable: true,
	get: function() {
		return CommandsListParamsSchema;
	}
});
Object.defineProperty(exports, "ConfigApplyParamsSchema", {
	enumerable: true,
	get: function() {
		return ConfigApplyParamsSchema;
	}
});
Object.defineProperty(exports, "ConfigGetParamsSchema", {
	enumerable: true,
	get: function() {
		return ConfigGetParamsSchema;
	}
});
Object.defineProperty(exports, "ConfigPatchParamsSchema", {
	enumerable: true,
	get: function() {
		return ConfigPatchParamsSchema;
	}
});
Object.defineProperty(exports, "ConfigSchemaLookupParamsSchema", {
	enumerable: true,
	get: function() {
		return ConfigSchemaLookupParamsSchema;
	}
});
Object.defineProperty(exports, "ConfigSchemaLookupResultSchema", {
	enumerable: true,
	get: function() {
		return ConfigSchemaLookupResultSchema;
	}
});
Object.defineProperty(exports, "ConfigSchemaParamsSchema", {
	enumerable: true,
	get: function() {
		return ConfigSchemaParamsSchema;
	}
});
Object.defineProperty(exports, "ConfigSetParamsSchema", {
	enumerable: true,
	get: function() {
		return ConfigSetParamsSchema;
	}
});
Object.defineProperty(exports, "ConnectParamsSchema", {
	enumerable: true,
	get: function() {
		return ConnectParamsSchema;
	}
});
Object.defineProperty(exports, "CronAddParamsSchema", {
	enumerable: true,
	get: function() {
		return CronAddParamsSchema;
	}
});
Object.defineProperty(exports, "CronGetParamsSchema", {
	enumerable: true,
	get: function() {
		return CronGetParamsSchema;
	}
});
Object.defineProperty(exports, "CronListParamsSchema", {
	enumerable: true,
	get: function() {
		return CronListParamsSchema;
	}
});
Object.defineProperty(exports, "CronRemoveParamsSchema", {
	enumerable: true,
	get: function() {
		return CronRemoveParamsSchema;
	}
});
Object.defineProperty(exports, "CronRunParamsSchema", {
	enumerable: true,
	get: function() {
		return CronRunParamsSchema;
	}
});
Object.defineProperty(exports, "CronRunsParamsSchema", {
	enumerable: true,
	get: function() {
		return CronRunsParamsSchema;
	}
});
Object.defineProperty(exports, "CronStatusParamsSchema", {
	enumerable: true,
	get: function() {
		return CronStatusParamsSchema;
	}
});
Object.defineProperty(exports, "CronUpdateParamsSchema", {
	enumerable: true,
	get: function() {
		return CronUpdateParamsSchema;
	}
});
Object.defineProperty(exports, "DeniedApprovalSnapshotSchema", {
	enumerable: true,
	get: function() {
		return DeniedApprovalSnapshotSchema;
	}
});
Object.defineProperty(exports, "DevicePairApproveParamsSchema", {
	enumerable: true,
	get: function() {
		return DevicePairApproveParamsSchema;
	}
});
Object.defineProperty(exports, "DevicePairListParamsSchema", {
	enumerable: true,
	get: function() {
		return DevicePairListParamsSchema;
	}
});
Object.defineProperty(exports, "DevicePairRejectParamsSchema", {
	enumerable: true,
	get: function() {
		return DevicePairRejectParamsSchema;
	}
});
Object.defineProperty(exports, "DevicePairRemoveParamsSchema", {
	enumerable: true,
	get: function() {
		return DevicePairRemoveParamsSchema;
	}
});
Object.defineProperty(exports, "DevicePairRenameParamsSchema", {
	enumerable: true,
	get: function() {
		return DevicePairRenameParamsSchema;
	}
});
Object.defineProperty(exports, "DevicePairSetupCodeParamsSchema", {
	enumerable: true,
	get: function() {
		return DevicePairSetupCodeParamsSchema;
	}
});
Object.defineProperty(exports, "DeviceTokenRevokeParamsSchema", {
	enumerable: true,
	get: function() {
		return DeviceTokenRevokeParamsSchema;
	}
});
Object.defineProperty(exports, "DeviceTokenRotateParamsSchema", {
	enumerable: true,
	get: function() {
		return DeviceTokenRotateParamsSchema;
	}
});
Object.defineProperty(exports, "EnvironmentsCreateParamsSchema", {
	enumerable: true,
	get: function() {
		return EnvironmentsCreateParamsSchema;
	}
});
Object.defineProperty(exports, "EnvironmentsDestroyParamsSchema", {
	enumerable: true,
	get: function() {
		return EnvironmentsDestroyParamsSchema;
	}
});
Object.defineProperty(exports, "EnvironmentsListParamsSchema", {
	enumerable: true,
	get: function() {
		return EnvironmentsListParamsSchema;
	}
});
Object.defineProperty(exports, "EnvironmentsStatusParamsSchema", {
	enumerable: true,
	get: function() {
		return EnvironmentsStatusParamsSchema;
	}
});
Object.defineProperty(exports, "EventFrameSchema", {
	enumerable: true,
	get: function() {
		return EventFrameSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalGetParamsSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalGetParamsSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalPresentationSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalPresentationSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalRequestParamsSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalRequestParamsSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalResolveParamsSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalResolveParamsSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalsGetParamsSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalsGetParamsSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalsNodeGetParamsSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalsNodeGetParamsSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalsNodeSetParamsSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalsNodeSetParamsSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalsNodeSnapshotSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalsNodeSnapshotSchema;
	}
});
Object.defineProperty(exports, "ExecApprovalsSetParamsSchema", {
	enumerable: true,
	get: function() {
		return ExecApprovalsSetParamsSchema;
	}
});
Object.defineProperty(exports, "ExpiredApprovalSnapshotSchema", {
	enumerable: true,
	get: function() {
		return ExpiredApprovalSnapshotSchema;
	}
});
Object.defineProperty(exports, "FsListDirParamsSchema", {
	enumerable: true,
	get: function() {
		return FsListDirParamsSchema;
	}
});
Object.defineProperty(exports, "FsListDirResultSchema", {
	enumerable: true,
	get: function() {
		return FsListDirResultSchema;
	}
});
Object.defineProperty(exports, "GATEWAY_SERVER_CAPS", {
	enumerable: true,
	get: function() {
		return GATEWAY_SERVER_CAPS;
	}
});
Object.defineProperty(exports, "GatewaySuspendPrepareParamsSchema", {
	enumerable: true,
	get: function() {
		return GatewaySuspendPrepareParamsSchema;
	}
});
Object.defineProperty(exports, "GatewaySuspendPrepareResultSchema", {
	enumerable: true,
	get: function() {
		return GatewaySuspendPrepareResultSchema;
	}
});
Object.defineProperty(exports, "GatewaySuspendResumeParamsSchema", {
	enumerable: true,
	get: function() {
		return GatewaySuspendResumeParamsSchema;
	}
});
Object.defineProperty(exports, "GatewaySuspendResumeResultSchema", {
	enumerable: true,
	get: function() {
		return GatewaySuspendResumeResultSchema;
	}
});
Object.defineProperty(exports, "GatewaySuspendStatusParamsSchema", {
	enumerable: true,
	get: function() {
		return GatewaySuspendStatusParamsSchema;
	}
});
Object.defineProperty(exports, "GatewaySuspendStatusResultSchema", {
	enumerable: true,
	get: function() {
		return GatewaySuspendStatusResultSchema;
	}
});
Object.defineProperty(exports, "LogsTailParamsSchema", {
	enumerable: true,
	get: function() {
		return LogsTailParamsSchema;
	}
});
Object.defineProperty(exports, "MAX_MEMORY_MIGRATION_ITEMS", {
	enumerable: true,
	get: function() {
		return MAX_MEMORY_MIGRATION_ITEMS;
	}
});
Object.defineProperty(exports, "MessageActionParamsSchema", {
	enumerable: true,
	get: function() {
		return MessageActionParamsSchema;
	}
});
Object.defineProperty(exports, "MigrationsMemoryApplyParamsSchema", {
	enumerable: true,
	get: function() {
		return MigrationsMemoryApplyParamsSchema;
	}
});
Object.defineProperty(exports, "MigrationsMemoryPlanParamsSchema", {
	enumerable: true,
	get: function() {
		return MigrationsMemoryPlanParamsSchema;
	}
});
Object.defineProperty(exports, "ModelsListParamsSchema", {
	enumerable: true,
	get: function() {
		return ModelsListParamsSchema;
	}
});
Object.defineProperty(exports, "ModelsProbeParamsSchema", {
	enumerable: true,
	get: function() {
		return ModelsProbeParamsSchema;
	}
});
Object.defineProperty(exports, "NodeDescribeParamsSchema", {
	enumerable: true,
	get: function() {
		return NodeDescribeParamsSchema;
	}
});
Object.defineProperty(exports, "NodeEventParamsSchema", {
	enumerable: true,
	get: function() {
		return NodeEventParamsSchema;
	}
});
Object.defineProperty(exports, "NodeEventResultSchema", {
	enumerable: true,
	get: function() {
		return NodeEventResultSchema;
	}
});
Object.defineProperty(exports, "NodeInvokeInputEventSchema", {
	enumerable: true,
	get: function() {
		return NodeInvokeInputEventSchema;
	}
});
Object.defineProperty(exports, "NodeInvokeParamsSchema", {
	enumerable: true,
	get: function() {
		return NodeInvokeParamsSchema;
	}
});
Object.defineProperty(exports, "NodeInvokeProgressParamsSchema", {
	enumerable: true,
	get: function() {
		return NodeInvokeProgressParamsSchema;
	}
});
Object.defineProperty(exports, "NodeInvokeResultParamsSchema", {
	enumerable: true,
	get: function() {
		return NodeInvokeResultParamsSchema;
	}
});
Object.defineProperty(exports, "NodeListParamsSchema", {
	enumerable: true,
	get: function() {
		return NodeListParamsSchema;
	}
});
Object.defineProperty(exports, "NodePairApproveParamsSchema", {
	enumerable: true,
	get: function() {
		return NodePairApproveParamsSchema;
	}
});
Object.defineProperty(exports, "NodePairListParamsSchema", {
	enumerable: true,
	get: function() {
		return NodePairListParamsSchema;
	}
});
Object.defineProperty(exports, "NodePairRejectParamsSchema", {
	enumerable: true,
	get: function() {
		return NodePairRejectParamsSchema;
	}
});
Object.defineProperty(exports, "NodePairRemoveParamsSchema", {
	enumerable: true,
	get: function() {
		return NodePairRemoveParamsSchema;
	}
});
Object.defineProperty(exports, "NodePendingAckParamsSchema", {
	enumerable: true,
	get: function() {
		return NodePendingAckParamsSchema;
	}
});
Object.defineProperty(exports, "NodePendingDrainParamsSchema", {
	enumerable: true,
	get: function() {
		return NodePendingDrainParamsSchema;
	}
});
Object.defineProperty(exports, "NodePendingEnqueueParamsSchema", {
	enumerable: true,
	get: function() {
		return NodePendingEnqueueParamsSchema;
	}
});
Object.defineProperty(exports, "NodePluginToolsUpdateParamsSchema", {
	enumerable: true,
	get: function() {
		return NodePluginToolsUpdateParamsSchema;
	}
});
Object.defineProperty(exports, "NodePresenceActivityPayloadSchema", {
	enumerable: true,
	get: function() {
		return NodePresenceActivityPayloadSchema;
	}
});
Object.defineProperty(exports, "NodePresenceAlivePayloadSchema", {
	enumerable: true,
	get: function() {
		return NodePresenceAlivePayloadSchema;
	}
});
Object.defineProperty(exports, "NodeRenameParamsSchema", {
	enumerable: true,
	get: function() {
		return NodeRenameParamsSchema;
	}
});
Object.defineProperty(exports, "NodeSkillsUpdateParamsSchema", {
	enumerable: true,
	get: function() {
		return NodeSkillsUpdateParamsSchema;
	}
});
Object.defineProperty(exports, "PendingApprovalSnapshotSchema", {
	enumerable: true,
	get: function() {
		return PendingApprovalSnapshotSchema;
	}
});
Object.defineProperty(exports, "PluginApprovalPresentationSchema", {
	enumerable: true,
	get: function() {
		return PluginApprovalPresentationSchema;
	}
});
Object.defineProperty(exports, "PluginApprovalRequestParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginApprovalRequestParamsSchema;
	}
});
Object.defineProperty(exports, "PluginApprovalResolveParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginApprovalResolveParamsSchema;
	}
});
Object.defineProperty(exports, "PluginApprovalSeveritySchema", {
	enumerable: true,
	get: function() {
		return PluginApprovalSeveritySchema;
	}
});
Object.defineProperty(exports, "PluginsInstallParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginsInstallParamsSchema;
	}
});
Object.defineProperty(exports, "PluginsInstallResultSchema", {
	enumerable: true,
	get: function() {
		return PluginsInstallResultSchema;
	}
});
Object.defineProperty(exports, "PluginsListParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginsListParamsSchema;
	}
});
Object.defineProperty(exports, "PluginsListResultSchema", {
	enumerable: true,
	get: function() {
		return PluginsListResultSchema;
	}
});
Object.defineProperty(exports, "PluginsSearchParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginsSearchParamsSchema;
	}
});
Object.defineProperty(exports, "PluginsSearchResultSchema", {
	enumerable: true,
	get: function() {
		return PluginsSearchResultSchema;
	}
});
Object.defineProperty(exports, "PluginsSessionActionParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginsSessionActionParamsSchema;
	}
});
Object.defineProperty(exports, "PluginsSessionActionResultSchema", {
	enumerable: true,
	get: function() {
		return PluginsSessionActionResultSchema;
	}
});
Object.defineProperty(exports, "PluginsSetEnabledParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginsSetEnabledParamsSchema;
	}
});
Object.defineProperty(exports, "PluginsSetEnabledResultSchema", {
	enumerable: true,
	get: function() {
		return PluginsSetEnabledResultSchema;
	}
});
Object.defineProperty(exports, "PluginsUiDescriptorsParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginsUiDescriptorsParamsSchema;
	}
});
Object.defineProperty(exports, "PluginsUiDescriptorsResultSchema", {
	enumerable: true,
	get: function() {
		return PluginsUiDescriptorsResultSchema;
	}
});
Object.defineProperty(exports, "PluginsUninstallParamsSchema", {
	enumerable: true,
	get: function() {
		return PluginsUninstallParamsSchema;
	}
});
Object.defineProperty(exports, "PluginsUninstallResultSchema", {
	enumerable: true,
	get: function() {
		return PluginsUninstallResultSchema;
	}
});
Object.defineProperty(exports, "PollParamsSchema", {
	enumerable: true,
	get: function() {
		return PollParamsSchema;
	}
});
Object.defineProperty(exports, "PushTestParamsSchema", {
	enumerable: true,
	get: function() {
		return PushTestParamsSchema;
	}
});
Object.defineProperty(exports, "RequestFrameSchema", {
	enumerable: true,
	get: function() {
		return RequestFrameSchema;
	}
});
Object.defineProperty(exports, "ResponseFrameSchema", {
	enumerable: true,
	get: function() {
		return ResponseFrameSchema;
	}
});
Object.defineProperty(exports, "SecretsResolveParamsSchema", {
	enumerable: true,
	get: function() {
		return SecretsResolveParamsSchema;
	}
});
Object.defineProperty(exports, "SecretsResolveResultSchema", {
	enumerable: true,
	get: function() {
		return SecretsResolveResultSchema;
	}
});
Object.defineProperty(exports, "SendParamsSchema", {
	enumerable: true,
	get: function() {
		return SendParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsAbortParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsAbortParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCatalogArchiveParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCatalogArchiveParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCatalogContinueParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCatalogContinueParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCatalogListParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCatalogListParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCatalogReadParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCatalogReadParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCleanupParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCleanupParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCompactParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCompactParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCompactionBranchParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCompactionBranchParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCompactionGetParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCompactionGetParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCompactionListParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCompactionListParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCompactionRestoreParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCompactionRestoreParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsCreateParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsCreateParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsDeleteParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsDeleteParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsDescribeParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsDescribeParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsDiffParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsDiffParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsDispatchParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsDispatchParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsDispatchResultSchema", {
	enumerable: true,
	get: function() {
		return SessionsDispatchResultSchema;
	}
});
Object.defineProperty(exports, "SessionsFilesGetParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsFilesGetParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsFilesListParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsFilesListParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsFilesSetParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsFilesSetParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsGroupsDeleteParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsGroupsDeleteParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsGroupsListParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsGroupsListParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsGroupsPutParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsGroupsPutParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsGroupsRenameParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsGroupsRenameParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsListParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsListParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsMessagesSubscribeParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsMessagesSubscribeParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsMessagesUnsubscribeParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsMessagesUnsubscribeParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsPatchParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsPatchParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsPluginPatchParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsPluginPatchParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsPreviewParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsPreviewParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsReclaimParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsReclaimParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsReclaimResultSchema", {
	enumerable: true,
	get: function() {
		return SessionsReclaimResultSchema;
	}
});
Object.defineProperty(exports, "SessionsResetParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsResetParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsResolveParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsResolveParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsSearchParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsSearchParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsSearchResultSchema", {
	enumerable: true,
	get: function() {
		return SessionsSearchResultSchema;
	}
});
Object.defineProperty(exports, "SessionsSendParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsSendParamsSchema;
	}
});
Object.defineProperty(exports, "SessionsUsageParamsSchema", {
	enumerable: true,
	get: function() {
		return SessionsUsageParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsBinsParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsBinsParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsCuratorActionParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsCuratorActionParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsCuratorStatusParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsCuratorStatusParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsDetailParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsDetailParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsInstallParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsInstallParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsProposalActionParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsProposalActionParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsProposalCreateParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsProposalCreateParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsProposalInspectParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsProposalInspectParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsProposalRequestRevisionParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsProposalRequestRevisionParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsProposalReviseParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsProposalReviseParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsProposalUpdateParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsProposalUpdateParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsProposalsListParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsProposalsListParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsSearchParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsSearchParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsSecurityVerdictsParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsSecurityVerdictsParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsSkillCardParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsSkillCardParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsStatusParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsStatusParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsUpdateParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsUpdateParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsUploadBeginParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsUploadBeginParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsUploadChunkParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsUploadChunkParamsSchema;
	}
});
Object.defineProperty(exports, "SkillsUploadCommitParamsSchema", {
	enumerable: true,
	get: function() {
		return SkillsUploadCommitParamsSchema;
	}
});
Object.defineProperty(exports, "SystemAgentChatParamsSchema", {
	enumerable: true,
	get: function() {
		return SystemAgentChatParamsSchema;
	}
});
Object.defineProperty(exports, "SystemAgentSetupActivateParamsSchema", {
	enumerable: true,
	get: function() {
		return SystemAgentSetupActivateParamsSchema;
	}
});
Object.defineProperty(exports, "SystemAgentSetupAuthStartParamsSchema", {
	enumerable: true,
	get: function() {
		return SystemAgentSetupAuthStartParamsSchema;
	}
});
Object.defineProperty(exports, "SystemAgentSetupDetectParamsSchema", {
	enumerable: true,
	get: function() {
		return SystemAgentSetupDetectParamsSchema;
	}
});
Object.defineProperty(exports, "SystemAgentSetupVerifyParamsSchema", {
	enumerable: true,
	get: function() {
		return SystemAgentSetupVerifyParamsSchema;
	}
});
Object.defineProperty(exports, "SystemInfoParamsSchema", {
	enumerable: true,
	get: function() {
		return SystemInfoParamsSchema;
	}
});
Object.defineProperty(exports, "SystemInfoResultSchema", {
	enumerable: true,
	get: function() {
		return SystemInfoResultSchema;
	}
});
Object.defineProperty(exports, "TalkAgentControlResultSchema", {
	enumerable: true,
	get: function() {
		return TalkAgentControlResultSchema;
	}
});
Object.defineProperty(exports, "TalkCatalogParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkCatalogParamsSchema;
	}
});
Object.defineProperty(exports, "TalkCatalogResultSchema", {
	enumerable: true,
	get: function() {
		return TalkCatalogResultSchema;
	}
});
Object.defineProperty(exports, "TalkClientCreateParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkClientCreateParamsSchema;
	}
});
Object.defineProperty(exports, "TalkClientCreateResultSchema", {
	enumerable: true,
	get: function() {
		return TalkClientCreateResultSchema;
	}
});
Object.defineProperty(exports, "TalkClientSteerParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkClientSteerParamsSchema;
	}
});
Object.defineProperty(exports, "TalkClientToolCallParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkClientToolCallParamsSchema;
	}
});
Object.defineProperty(exports, "TalkClientToolCallResultSchema", {
	enumerable: true,
	get: function() {
		return TalkClientToolCallResultSchema;
	}
});
Object.defineProperty(exports, "TalkConfigParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkConfigParamsSchema;
	}
});
Object.defineProperty(exports, "TalkConfigResultSchema", {
	enumerable: true,
	get: function() {
		return TalkConfigResultSchema;
	}
});
Object.defineProperty(exports, "TalkEventSchema", {
	enumerable: true,
	get: function() {
		return TalkEventSchema;
	}
});
Object.defineProperty(exports, "TalkModeParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkModeParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionAcknowledgeMarkParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionAcknowledgeMarkParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionAppendAudioParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionAppendAudioParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionCancelOutputParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionCancelOutputParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionCancelTurnParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionCancelTurnParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionCloseParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionCloseParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionCreateParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionCreateParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionCreateResultSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionCreateResultSchema;
	}
});
Object.defineProperty(exports, "TalkSessionJoinParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionJoinParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionJoinResultSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionJoinResultSchema;
	}
});
Object.defineProperty(exports, "TalkSessionOkResultSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionOkResultSchema;
	}
});
Object.defineProperty(exports, "TalkSessionSteerParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionSteerParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionSubmitToolResultParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionSubmitToolResultParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionTurnParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionTurnParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSessionTurnResultSchema", {
	enumerable: true,
	get: function() {
		return TalkSessionTurnResultSchema;
	}
});
Object.defineProperty(exports, "TalkSpeakParamsSchema", {
	enumerable: true,
	get: function() {
		return TalkSpeakParamsSchema;
	}
});
Object.defineProperty(exports, "TalkSpeakResultSchema", {
	enumerable: true,
	get: function() {
		return TalkSpeakResultSchema;
	}
});
Object.defineProperty(exports, "TaskSuggestionsAcceptParamsSchema", {
	enumerable: true,
	get: function() {
		return TaskSuggestionsAcceptParamsSchema;
	}
});
Object.defineProperty(exports, "TaskSuggestionsCreateParamsSchema", {
	enumerable: true,
	get: function() {
		return TaskSuggestionsCreateParamsSchema;
	}
});
Object.defineProperty(exports, "TaskSuggestionsDismissParamsSchema", {
	enumerable: true,
	get: function() {
		return TaskSuggestionsDismissParamsSchema;
	}
});
Object.defineProperty(exports, "TaskSuggestionsListParamsSchema", {
	enumerable: true,
	get: function() {
		return TaskSuggestionsListParamsSchema;
	}
});
Object.defineProperty(exports, "TasksCancelParamsSchema", {
	enumerable: true,
	get: function() {
		return TasksCancelParamsSchema;
	}
});
Object.defineProperty(exports, "TasksGetParamsSchema", {
	enumerable: true,
	get: function() {
		return TasksGetParamsSchema;
	}
});
Object.defineProperty(exports, "TasksListParamsSchema", {
	enumerable: true,
	get: function() {
		return TasksListParamsSchema;
	}
});
Object.defineProperty(exports, "TerminalApprovalSnapshotSchema", {
	enumerable: true,
	get: function() {
		return TerminalApprovalSnapshotSchema;
	}
});
Object.defineProperty(exports, "TerminalAttachParamsSchema", {
	enumerable: true,
	get: function() {
		return TerminalAttachParamsSchema;
	}
});
Object.defineProperty(exports, "TerminalCloseParamsSchema", {
	enumerable: true,
	get: function() {
		return TerminalCloseParamsSchema;
	}
});
Object.defineProperty(exports, "TerminalEventSchema", {
	enumerable: true,
	get: function() {
		return TerminalEventSchema;
	}
});
Object.defineProperty(exports, "TerminalInputParamsSchema", {
	enumerable: true,
	get: function() {
		return TerminalInputParamsSchema;
	}
});
Object.defineProperty(exports, "TerminalOpenParamsSchema", {
	enumerable: true,
	get: function() {
		return TerminalOpenParamsSchema;
	}
});
Object.defineProperty(exports, "TerminalResizeParamsSchema", {
	enumerable: true,
	get: function() {
		return TerminalResizeParamsSchema;
	}
});
Object.defineProperty(exports, "TerminalTextParamsSchema", {
	enumerable: true,
	get: function() {
		return TerminalTextParamsSchema;
	}
});
Object.defineProperty(exports, "TerminalUploadParamsSchema", {
	enumerable: true,
	get: function() {
		return TerminalUploadParamsSchema;
	}
});
Object.defineProperty(exports, "TerminalUploadResultSchema", {
	enumerable: true,
	get: function() {
		return TerminalUploadResultSchema;
	}
});
Object.defineProperty(exports, "ToolsCatalogParamsSchema", {
	enumerable: true,
	get: function() {
		return ToolsCatalogParamsSchema;
	}
});
Object.defineProperty(exports, "ToolsEffectiveParamsSchema", {
	enumerable: true,
	get: function() {
		return ToolsEffectiveParamsSchema;
	}
});
Object.defineProperty(exports, "ToolsInvokeParamsSchema", {
	enumerable: true,
	get: function() {
		return ToolsInvokeParamsSchema;
	}
});
Object.defineProperty(exports, "TtsSpeakParamsSchema", {
	enumerable: true,
	get: function() {
		return TtsSpeakParamsSchema;
	}
});
Object.defineProperty(exports, "TtsSpeakResultSchema", {
	enumerable: true,
	get: function() {
		return TtsSpeakResultSchema;
	}
});
Object.defineProperty(exports, "UpdateRunParamsSchema", {
	enumerable: true,
	get: function() {
		return UpdateRunParamsSchema;
	}
});
Object.defineProperty(exports, "UpdateStatusParamsSchema", {
	enumerable: true,
	get: function() {
		return UpdateStatusParamsSchema;
	}
});
Object.defineProperty(exports, "WakeParamsSchema", {
	enumerable: true,
	get: function() {
		return WakeParamsSchema;
	}
});
Object.defineProperty(exports, "WebLoginStartParamsSchema", {
	enumerable: true,
	get: function() {
		return WebLoginStartParamsSchema;
	}
});
Object.defineProperty(exports, "WebLoginWaitParamsSchema", {
	enumerable: true,
	get: function() {
		return WebLoginWaitParamsSchema;
	}
});
Object.defineProperty(exports, "WebPushSubscribeParamsSchema", {
	enumerable: true,
	get: function() {
		return WebPushSubscribeParamsSchema;
	}
});
Object.defineProperty(exports, "WebPushTestParamsSchema", {
	enumerable: true,
	get: function() {
		return WebPushTestParamsSchema;
	}
});
Object.defineProperty(exports, "WebPushUnsubscribeParamsSchema", {
	enumerable: true,
	get: function() {
		return WebPushUnsubscribeParamsSchema;
	}
});
Object.defineProperty(exports, "WebPushVapidPublicKeyParamsSchema", {
	enumerable: true,
	get: function() {
		return WebPushVapidPublicKeyParamsSchema;
	}
});
Object.defineProperty(exports, "WizardCancelParamsSchema", {
	enumerable: true,
	get: function() {
		return WizardCancelParamsSchema;
	}
});
Object.defineProperty(exports, "WizardNextParamsSchema", {
	enumerable: true,
	get: function() {
		return WizardNextParamsSchema;
	}
});
Object.defineProperty(exports, "WizardStartParamsSchema", {
	enumerable: true,
	get: function() {
		return WizardStartParamsSchema;
	}
});
Object.defineProperty(exports, "WizardStatusParamsSchema", {
	enumerable: true,
	get: function() {
		return WizardStatusParamsSchema;
	}
});
Object.defineProperty(exports, "WorktreesBranchesParamsSchema", {
	enumerable: true,
	get: function() {
		return WorktreesBranchesParamsSchema;
	}
});
Object.defineProperty(exports, "WorktreesCreateParamsSchema", {
	enumerable: true,
	get: function() {
		return WorktreesCreateParamsSchema;
	}
});
Object.defineProperty(exports, "WorktreesGcParamsSchema", {
	enumerable: true,
	get: function() {
		return WorktreesGcParamsSchema;
	}
});
Object.defineProperty(exports, "WorktreesListParamsSchema", {
	enumerable: true,
	get: function() {
		return WorktreesListParamsSchema;
	}
});
Object.defineProperty(exports, "WorktreesRemoveParamsSchema", {
	enumerable: true,
	get: function() {
		return WorktreesRemoveParamsSchema;
	}
});
Object.defineProperty(exports, "WorktreesRestoreParamsSchema", {
	enumerable: true,
	get: function() {
		return WorktreesRestoreParamsSchema;
	}
});
Object.defineProperty(exports, "lazyCompile", {
	enumerable: true,
	get: function() {
		return lazyCompile;
	}
});
Object.defineProperty(exports, "validateSkillsProposalHistoryScanParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalHistoryScanParams;
	}
});
Object.defineProperty(exports, "validateSkillsProposalHistoryStatusParams", {
	enumerable: true,
	get: function() {
		return validateSkillsProposalHistoryStatusParams;
	}
});
Object.defineProperty(exports, "validateSystemEventParams", {
	enumerable: true,
	get: function() {
		return validateSystemEventParams;
	}
});
