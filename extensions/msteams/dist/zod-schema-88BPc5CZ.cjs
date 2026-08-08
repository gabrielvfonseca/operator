const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
const require_zod_schema_core = require("./zod-schema.core-B7xBEBon.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_host_hook_json = require("./host-hook-json-BhDT-UAu.cjs");
const require_zod_schema_installs = require("./zod-schema.installs-DvUhp0g9.cjs");
const require_parse_duration = require("./parse-duration-Csu-f48Z.cjs");
const require_ed25519_signature = require("./ed25519-signature-B-nQxx1_.cjs");
const require_zod_schema_channels_config = require("./zod-schema.channels-config-DIjSsJKO.cjs");
const require_sensitive_paths = require("./sensitive-paths-JusECImi.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let zod = require("zod");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_url_protocol = require("@gabrielvfonseca/net-policy/url-protocol");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/config/control-ui-css.ts
const CSS_WIDTH_KEYWORDS = /* @__PURE__ */ new Set([
	"none",
	"min-content",
	"max-content"
]);
const CSS_WIDTH_FUNCTIONS = /* @__PURE__ */ new Set([
	"calc",
	"clamp",
	"fit-content",
	"max",
	"min"
]);
const CSS_WIDTH_UNITS = /* @__PURE__ */ new Set([
	"ch",
	"em",
	"rem",
	"vh",
	"vmax",
	"vmin",
	"vw",
	"px"
]);
const CSS_WIDTH_ALLOWED_CHARS = /^[0-9A-Za-z.%+\-*/(),\s]+$/;
const CSS_WIDTH_IDENTIFIER_RE = /[A-Za-z][A-Za-z0-9-]*/g;
const CSS_WIDTH_SIMPLE_RE = /^(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|ch|vw|vh|vmin|vmax|%)$/i;
const CSS_WIDTH_MAX_LENGTH = 96;
function hasBalancedParentheses(value) {
	let depth = 0;
	for (const char of value) if (char === "(") depth++;
	else if (char === ")") {
		depth--;
		if (depth < 0) return false;
	}
	return depth === 0;
}
function hasAllowedIdentifiers(value) {
	for (const match of value.matchAll(CSS_WIDTH_IDENTIFIER_RE)) {
		const identifier = match[0].toLowerCase();
		if (!CSS_WIDTH_FUNCTIONS.has(identifier) && !CSS_WIDTH_KEYWORDS.has(identifier) && !CSS_WIDTH_UNITS.has(identifier)) return false;
	}
	return true;
}
/** Normalizes operator-provided Control UI chat max-width CSS values before validation. */
function normalizeControlUiChatMessageMaxWidth(value) {
	return value.trim().replace(/\s+/g, " ");
}
/** Validates the constrained CSS width grammar accepted by `gateway.controlUi.chatMessageMaxWidth`. */
function isValidControlUiChatMessageMaxWidth(value) {
	const normalized = normalizeControlUiChatMessageMaxWidth(value);
	if (normalized.length === 0 || normalized.length > CSS_WIDTH_MAX_LENGTH) return false;
	if (CSS_WIDTH_KEYWORDS.has(normalized.toLowerCase())) return true;
	if (CSS_WIDTH_SIMPLE_RE.test(normalized)) return true;
	if (!CSS_WIDTH_ALLOWED_CHARS.test(normalized)) return false;
	if (!hasBalancedParentheses(normalized) || !hasAllowedIdentifiers(normalized)) return false;
	return /^(?:calc|clamp|fit-content|max|min)\(.+\)$/i.test(normalized);
}
//#endregion
//#region src/cli/parse-bytes.ts
const UNIT_MULTIPLIERS = {
	b: 1,
	kb: 1024,
	k: 1024,
	mb: 1024 ** 2,
	m: 1024 ** 2,
	gb: 1024 ** 3,
	g: 1024 ** 3,
	tb: 1024 ** 4,
	t: 1024 ** 4
};
function invalidByteSize(raw, reason) {
	const value = raw.trim() ? `"${raw}"` : "empty value";
	const prefix = reason ? `Invalid byte size (${reason}): ${value}.` : `Invalid byte size: ${value}.`;
	return /* @__PURE__ */ new Error(`${prefix} Use values like 512kb, 10mb, 1gb, or 500.`);
}
/** Parse a non-negative byte size with optional binary units like kb, mb, gb, or tb. */
function parseByteSize(raw, opts) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "");
	if (!trimmed) throw invalidByteSize(raw, "empty");
	const m = /^(\d+(?:\.\d+)?)([a-z]+)?$/.exec(trimmed);
	if (!m) throw invalidByteSize(raw);
	const value = Number(m[1]);
	if (!Number.isFinite(value) || value < 0) throw invalidByteSize(raw);
	const unit = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(m[2] ?? opts?.defaultUnit ?? "b");
	const multiplier = UNIT_MULTIPLIERS[unit];
	if (!multiplier) throw invalidByteSize(raw, `unknown unit "${unit}"`);
	const bytes = Math.round(value * multiplier);
	if (!Number.isSafeInteger(bytes)) throw invalidByteSize(raw);
	return bytes;
}
//#endregion
//#region src/config/byte-size.ts
/**
* Parse an optional byte-size value from config.
* Accepts non-negative numbers or strings like "2mb".
*/
function parseNonNegativeByteSize(value) {
	if (typeof value === "number") {
		const int = Math.floor(value);
		return Number.isSafeInteger(int) && int >= 0 ? int : null;
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return null;
		try {
			const bytes = parseByteSize(trimmed, { defaultUnit: "b" });
			return bytes >= 0 ? bytes : null;
		} catch {
			return null;
		}
	}
	return null;
}
/** Validates byte-size strings accepted by agent default byte-threshold config. */
function isValidNonNegativeByteSizeString(value) {
	return parseNonNegativeByteSize(value) !== null;
}
//#endregion
//#region src/config/zod-schema.agent-defaults.ts
const SilentReplyPolicySchema = zod.z.union([zod.z.literal("allow"), zod.z.literal("disallow")]);
const NonNegativeByteSizeSchema = zod.z.union([zod.z.number().int().nonnegative(), zod.z.string().refine(isValidNonNegativeByteSizeString, "Expected byte size string like 2mb")]);
const OptionalBootstrapFileNameSchema = zod.z.enum([
	"SOUL.md",
	"USER.md",
	"HEARTBEAT.md",
	"IDENTITY.md"
]);
const EmbeddedAgentConfigSchema = zod.z.object({
	projectSettingsPolicy: zod.z.union([
		zod.z.literal("trusted"),
		zod.z.literal("sanitize"),
		zod.z.literal("ignore")
	]).optional(),
	executionContract: zod.z.union([zod.z.literal("default"), zod.z.literal("strict-agentic")]).optional()
}).strict();
const SilentReplyPolicyConfigSchema = zod.z.object({
	group: SilentReplyPolicySchema.optional(),
	internal: SilentReplyPolicySchema.optional()
}).strict();
const AgentDefaultsSchema = zod.z.object({
	/** Global default provider params applied to all models before per-model and per-agent overrides. */
	params: zod.z.record(zod.z.string(), zod.z.unknown()).optional(),
	model: require_zod_schema_channels_config.AgentModelSchema.optional(),
	utilityModel: zod.z.string().optional(),
	imageModel: require_zod_schema_channels_config.AgentToolModelSchema.optional(),
	imageGenerationModel: require_zod_schema_channels_config.AgentToolModelSchema.optional(),
	videoGenerationModel: require_zod_schema_channels_config.AgentToolModelSchema.optional(),
	musicGenerationModel: require_zod_schema_channels_config.AgentToolModelSchema.optional(),
	voiceModel: require_zod_schema_channels_config.AgentToolModelSchema.optional(),
	mediaGenerationAutoProviderFallback: zod.z.boolean().optional(),
	pdfModel: require_zod_schema_channels_config.AgentToolModelSchema.optional(),
	pdfMaxBytesMb: zod.z.number().positive().optional(),
	pdfMaxPages: zod.z.number().int().positive().optional(),
	models: zod.z.record(zod.z.string(), require_zod_schema_channels_config.AgentModelRuntimeEntrySchema).optional(),
	workspace: zod.z.string().optional(),
	skills: zod.z.array(zod.z.string()).optional(),
	silentReply: SilentReplyPolicyConfigSchema.optional(),
	repoRoot: zod.z.string().optional(),
	promptOverlays: zod.z.object({ gpt5: zod.z.object({ personality: zod.z.union([
		zod.z.literal("friendly"),
		zod.z.literal("on"),
		zod.z.literal("off")
	]).optional() }).strict().optional() }).strict().optional(),
	skipBootstrap: zod.z.boolean().optional(),
	skipOptionalBootstrapFiles: zod.z.array(OptionalBootstrapFileNameSchema).optional(),
	contextInjection: zod.z.union([
		zod.z.literal("always"),
		zod.z.literal("continuation-skip"),
		zod.z.literal("never")
	]).optional(),
	bootstrapMaxChars: zod.z.number().int().positive().optional(),
	bootstrapTotalMaxChars: zod.z.number().int().positive().optional(),
	experimental: zod.z.object({ localModelLean: zod.z.boolean().optional() }).strict().optional(),
	bootstrapPromptTruncationWarning: zod.z.union([
		zod.z.literal("off"),
		zod.z.literal("once"),
		zod.z.literal("always")
	]).optional(),
	userTimezone: zod.z.string().optional(),
	startupContext: zod.z.object({
		enabled: zod.z.boolean().optional(),
		applyOn: zod.z.array(zod.z.union([zod.z.literal("new"), zod.z.literal("reset")])).optional(),
		dailyMemoryDays: zod.z.number().int().min(1).max(14).optional(),
		maxFileBytes: zod.z.number().int().min(1).max(64 * 1024).optional(),
		maxFileChars: zod.z.number().int().min(1).max(1e4).optional(),
		maxTotalChars: zod.z.number().int().min(1).max(5e4).optional()
	}).strict().optional(),
	contextLimits: require_zod_schema_channels_config.AgentContextLimitsSchema,
	timeFormat: zod.z.union([
		zod.z.literal("auto"),
		zod.z.literal("12"),
		zod.z.literal("24")
	]).optional(),
	envelopeTimezone: zod.z.string().optional(),
	envelopeTimestamp: zod.z.union([zod.z.literal("on"), zod.z.literal("off")]).optional(),
	envelopeElapsed: zod.z.union([zod.z.literal("on"), zod.z.literal("off")]).optional(),
	contextTokens: zod.z.number().int().positive().optional(),
	cliBackends: zod.z.record(zod.z.string(), require_zod_schema_core.CliBackendSchema).optional(),
	memorySearch: require_zod_schema_channels_config.MemorySearchSchema,
	contextPruning: zod.z.object({
		mode: zod.z.union([zod.z.literal("off"), zod.z.literal("cache-ttl")]).optional(),
		ttl: zod.z.string().optional(),
		keepLastAssistants: zod.z.number().int().nonnegative().optional(),
		softTrimRatio: zod.z.number().min(0).max(1).optional(),
		hardClearRatio: zod.z.number().min(0).max(1).optional(),
		minPrunableToolChars: zod.z.number().int().nonnegative().optional(),
		tools: zod.z.object({
			allow: zod.z.array(zod.z.string()).optional(),
			deny: zod.z.array(zod.z.string()).optional()
		}).strict().optional(),
		softTrim: zod.z.object({
			maxChars: zod.z.number().int().nonnegative().optional(),
			headChars: zod.z.number().int().nonnegative().optional(),
			tailChars: zod.z.number().int().nonnegative().optional()
		}).strict().optional(),
		hardClear: zod.z.object({
			enabled: zod.z.boolean().optional(),
			placeholder: zod.z.string().optional()
		}).strict().optional()
	}).strict().optional(),
	compaction: zod.z.object({
		mode: zod.z.union([zod.z.literal("default"), zod.z.literal("safeguard")]).optional(),
		provider: zod.z.string().optional(),
		reserveTokens: zod.z.number().int().nonnegative().optional(),
		keepRecentTokens: zod.z.number().int().positive().optional(),
		reserveTokensFloor: zod.z.number().int().nonnegative().optional(),
		maxHistoryShare: zod.z.number().min(.1).max(.9).optional(),
		customInstructions: zod.z.string().optional(),
		identifierPolicy: zod.z.union([
			zod.z.literal("strict"),
			zod.z.literal("off"),
			zod.z.literal("custom")
		]).optional(),
		identifierInstructions: zod.z.string().optional(),
		recentTurnsPreserve: zod.z.number().int().min(0).max(12).optional(),
		qualityGuard: zod.z.object({
			enabled: zod.z.boolean().optional(),
			maxRetries: zod.z.number().int().nonnegative().optional()
		}).strict().optional(),
		midTurnPrecheck: zod.z.object({ enabled: zod.z.boolean().optional() }).strict().optional(),
		postIndexSync: zod.z.enum([
			"off",
			"async",
			"await"
		]).optional(),
		postCompactionSections: zod.z.array(zod.z.string()).optional(),
		model: zod.z.string().optional(),
		timeoutSeconds: zod.z.number().int().positive().optional(),
		memoryFlush: zod.z.object({
			enabled: zod.z.boolean().optional(),
			model: zod.z.string().optional(),
			softThresholdTokens: zod.z.number().int().nonnegative().optional(),
			forceFlushTranscriptBytes: NonNegativeByteSizeSchema.optional(),
			prompt: zod.z.string().optional(),
			systemPrompt: zod.z.string().optional()
		}).strict().optional(),
		truncateAfterCompaction: zod.z.boolean().optional(),
		maxActiveTranscriptBytes: NonNegativeByteSizeSchema.optional(),
		notifyUser: zod.z.boolean().optional()
	}).strict().optional(),
	runRetries: require_zod_schema_channels_config.AgentRunRetriesConfigSchema.optional(),
	embeddedAgent: EmbeddedAgentConfigSchema.optional(),
	thinkingDefault: zod.z.union([
		zod.z.literal("off"),
		zod.z.literal("minimal"),
		zod.z.literal("low"),
		zod.z.literal("medium"),
		zod.z.literal("high"),
		zod.z.literal("xhigh"),
		zod.z.literal("adaptive"),
		zod.z.literal("max"),
		zod.z.literal("ultra")
	]).optional(),
	verboseDefault: zod.z.union([
		zod.z.literal("off"),
		zod.z.literal("on"),
		zod.z.literal("full")
	]).optional(),
	toolProgressDetail: zod.z.union([zod.z.literal("explain"), zod.z.literal("raw")]).optional(),
	reasoningDefault: zod.z.union([
		zod.z.literal("off"),
		zod.z.literal("on"),
		zod.z.literal("stream")
	]).optional(),
	elevatedDefault: zod.z.union([
		zod.z.literal("off"),
		zod.z.literal("on"),
		zod.z.literal("ask"),
		zod.z.literal("full")
	]).optional(),
	blockStreamingDefault: zod.z.union([zod.z.literal("off"), zod.z.literal("on")]).optional(),
	blockStreamingBreak: zod.z.union([zod.z.literal("text_end"), zod.z.literal("message_end")]).optional(),
	blockStreamingChunk: require_zod_schema_core.BlockStreamingChunkSchema.optional(),
	blockStreamingCoalesce: require_zod_schema_core.BlockStreamingCoalesceSchema.optional(),
	humanDelay: require_zod_schema_core.HumanDelaySchema.optional(),
	timeoutSeconds: zod.z.number().int().nonnegative().optional(),
	mediaMaxMb: zod.z.number().positive().optional(),
	imageMaxDimensionPx: zod.z.number().int().positive().optional(),
	imageQuality: zod.z.enum([
		"auto",
		"efficient",
		"balanced",
		"high"
	]).optional(),
	typingIntervalSeconds: zod.z.number().int().positive().optional(),
	typingMode: require_zod_schema_core.TypingModeSchema.optional(),
	heartbeat: require_zod_schema_channels_config.HeartbeatSchema,
	maxConcurrent: zod.z.number().int().positive().optional(),
	subagents: zod.z.object({
		delegationMode: zod.z.enum(["suggest", "prefer"]).optional(),
		allowAgents: zod.z.array(zod.z.string()).optional(),
		maxConcurrent: zod.z.number().int().positive().optional(),
		maxSpawnDepth: zod.z.number().int().min(1).max(5).optional().describe("Maximum nesting depth for sub-agent spawning. 1 = no nesting (default), 2 = sub-agents can spawn sub-sub-agents."),
		maxChildrenPerAgent: zod.z.number().int().min(1).max(20).optional().describe("Maximum number of active children a single agent session can spawn (default: 5)."),
		archiveAfterMinutes: zod.z.number().int().min(0).optional(),
		model: require_zod_schema_channels_config.AgentModelSchema.optional(),
		thinking: zod.z.string().optional(),
		runTimeoutSeconds: zod.z.number().int().min(0).optional(),
		announceTimeoutMs: zod.z.number().int().positive().optional(),
		requireAgentId: zod.z.boolean().optional()
	}).strict().optional(),
	sandbox: require_zod_schema_channels_config.AgentSandboxSchema
}).strict().optional();
//#endregion
//#region src/config/zod-schema.agents.ts
const AgentsSchema = zod.z.object({
	defaults: zod.z.lazy(() => AgentDefaultsSchema).optional(),
	list: zod.z.array(require_zod_schema_channels_config.AgentEntrySchema).optional()
}).strict().optional();
const BindingMatchSchema = zod.z.object({
	channel: zod.z.string(),
	accountId: zod.z.string().optional(),
	peer: zod.z.object({
		kind: zod.z.union([
			zod.z.literal("direct"),
			zod.z.literal("group"),
			zod.z.literal("channel"),
			zod.z.literal("dm")
		]),
		id: zod.z.string()
	}).strict().optional(),
	guildId: zod.z.string().optional(),
	teamId: zod.z.string().optional(),
	roles: zod.z.array(zod.z.string()).optional()
}).strict();
const BindingSessionSchema = zod.z.object({ dmScope: zod.z.union([
	zod.z.literal("main"),
	zod.z.literal("per-peer"),
	zod.z.literal("per-channel-peer"),
	zod.z.literal("per-account-channel-peer")
]).optional() }).strict();
const RouteBindingSchema = zod.z.object({
	type: zod.z.literal("route").optional(),
	agentId: zod.z.string(),
	comment: zod.z.string().optional(),
	match: BindingMatchSchema,
	session: BindingSessionSchema.optional()
}).strict();
const AcpBindingSchema = zod.z.object({
	type: zod.z.literal("acp"),
	agentId: zod.z.string(),
	comment: zod.z.string().optional(),
	match: BindingMatchSchema,
	acp: zod.z.object({
		mode: zod.z.enum(["persistent", "oneshot"]).optional(),
		label: zod.z.string().optional(),
		cwd: zod.z.string().optional(),
		backend: zod.z.string().optional()
	}).strict().optional()
}).strict().superRefine((value, ctx) => {
	if (!((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.match.peer?.id) ?? "")) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["match", "peer"],
		message: "ACP bindings require match.peer.id to target a concrete conversation."
	});
});
const BindingsSchema = zod.z.array(zod.z.union([RouteBindingSchema, AcpBindingSchema])).optional();
const BroadcastStrategySchema = zod.z.enum(["parallel", "sequential"]);
const BroadcastSchema = zod.z.object({ strategy: BroadcastStrategySchema.optional() }).catchall(zod.z.array(zod.z.string())).optional();
const AudioSchema = zod.z.object({ transcription: require_zod_schema_core.TranscribeAudioSchema }).strict().optional();
//#endregion
//#region src/config/zod-schema.cloud-workers.ts
const CloudWorkerLifetimePolicyShape = {
	idleTimeoutMinutes: zod.z.number().int().positive().optional(),
	maxLifetimeMinutes: zod.z.number().int().positive().optional()
};
const CloudWorkerLifetimePolicySchema = zod.z.object(CloudWorkerLifetimePolicyShape).strict();
function validateCloudWorkerProfileSettings(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value) || !require_host_hook_json.isPluginJsonValue(value)) return "Worker profile settings must be bounded finite JSON";
	const visit = (entry) => {
		if (Array.isArray(entry)) return entry.map(visit).find((error) => error !== void 0);
		if (typeof entry !== "object" || entry === null) return;
		for (const [key, child] of Object.entries(entry)) {
			const baseKey = key.replace(/ref$/i, "");
			if (key.toLowerCase() === "keyref" || require_sensitive_paths.isSensitiveConfigPath(key) || baseKey !== key && require_sensitive_paths.isSensitiveConfigPath(baseKey)) {
				if (!require_types_secrets.isSecretRef(child) || !require_ref_contract.isValidSecretRef(child)) return `Worker profile ${key} must use a SecretRef`;
				continue;
			}
			const error = visit(child);
			if (error) return error;
		}
	};
	return visit(value);
}
const CloudWorkerSettingsSchema = zod.z.record(zod.z.string(), zod.z.unknown()).superRefine((value, ctx) => {
	const message = validateCloudWorkerProfileSettings(value);
	if (message) ctx.addIssue({
		code: "custom",
		message
	});
});
const CloudWorkerProfileShape = {
	provider: zod.z.string().trim().min(1),
	install: zod.z.enum(["bundle", "npm"]).optional().default("bundle"),
	settings: CloudWorkerSettingsSchema.optional(),
	lifetime: CloudWorkerLifetimePolicySchema.optional()
};
const CloudWorkerProfileSchema = zod.z.object(CloudWorkerProfileShape).strict();
const CloudWorkerProfileIdSchema = zod.z.string().min(1).refine((value) => value === value.trim(), "Worker profile ids must not contain outer whitespace");
const CloudWorkersConfigShape = { profiles: zod.z.record(CloudWorkerProfileIdSchema, CloudWorkerProfileSchema).optional() };
const CloudWorkersConfigSchema = zod.z.object(CloudWorkersConfigShape).strict().optional();
//#endregion
//#region src/config/zod-schema.hooks.ts
function isSafeRelativeModulePath(raw) {
	const value = raw.trim();
	if (!value) return false;
	if (node_path.default.isAbsolute(value)) return false;
	if (value.startsWith("~")) return false;
	if (value.includes(":")) return false;
	if (value.split(/[\\/]+/g).some((part) => part === "..")) return false;
	return true;
}
const SafeRelativeModulePathSchema = zod.z.string().refine(isSafeRelativeModulePath, "module must be a safe relative path (no absolute paths)");
const HookMappingSchema = zod.z.object({
	id: zod.z.string().optional(),
	match: zod.z.object({
		path: zod.z.string().optional(),
		source: zod.z.string().optional()
	}).optional(),
	action: zod.z.union([zod.z.literal("wake"), zod.z.literal("agent")]).optional(),
	wakeMode: zod.z.union([zod.z.literal("now"), zod.z.literal("next-heartbeat")]).optional(),
	name: zod.z.string().optional(),
	agentId: zod.z.string().optional(),
	sessionKey: zod.z.string().optional().register(require_zod_schema_core.sensitive),
	messageTemplate: zod.z.string().optional(),
	textTemplate: zod.z.string().optional(),
	deliver: zod.z.boolean().optional(),
	allowUnsafeExternalContent: zod.z.boolean().optional(),
	channel: zod.z.string().trim().min(1).optional(),
	to: zod.z.string().optional(),
	model: zod.z.string().optional(),
	thinking: zod.z.string().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	transform: zod.z.object({
		module: SafeRelativeModulePathSchema,
		export: zod.z.string().optional()
	}).strict().optional()
}).strict().optional();
const InternalHookHandlerSchema = zod.z.object({
	event: zod.z.string(),
	module: SafeRelativeModulePathSchema,
	export: zod.z.string().optional()
}).strict();
const HookConfigSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	env: zod.z.record(zod.z.string(), zod.z.string()).optional()
}).passthrough();
const HookInstallRecordSchema = zod.z.object({
	...require_zod_schema_installs.InstallRecordShape,
	hooks: zod.z.array(zod.z.string()).optional()
}).strict();
const InternalHooksSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	handlers: zod.z.array(InternalHookHandlerSchema).optional(),
	entries: zod.z.record(zod.z.string(), HookConfigSchema).optional(),
	load: zod.z.object({ extraDirs: zod.z.array(zod.z.string()).optional() }).strict().optional(),
	installs: zod.z.record(zod.z.string(), HookInstallRecordSchema).optional()
}).strict().optional();
const HooksGmailSchema = zod.z.object({
	account: zod.z.string().optional(),
	label: zod.z.string().optional(),
	topic: zod.z.string().optional(),
	subscription: zod.z.string().optional(),
	pushToken: zod.z.string().optional().register(require_zod_schema_core.sensitive),
	hookUrl: zod.z.string().optional(),
	includeBody: zod.z.boolean().optional(),
	maxBytes: zod.z.number().int().positive().optional(),
	renewEveryMinutes: zod.z.number().int().positive().optional(),
	allowUnsafeExternalContent: zod.z.boolean().optional(),
	serve: zod.z.object({
		bind: zod.z.string().optional(),
		port: zod.z.number().int().positive().optional(),
		path: zod.z.string().optional()
	}).strict().optional(),
	tailscale: zod.z.object({
		mode: zod.z.union([
			zod.z.literal("off"),
			zod.z.literal("serve"),
			zod.z.literal("funnel")
		]).optional(),
		path: zod.z.string().optional(),
		target: zod.z.string().optional()
	}).strict().optional(),
	model: zod.z.string().optional(),
	thinking: zod.z.union([
		zod.z.literal("off"),
		zod.z.literal("minimal"),
		zod.z.literal("low"),
		zod.z.literal("medium"),
		zod.z.literal("high")
	]).optional()
}).strict().optional();
//#endregion
//#region src/config/zod-schema.node-host.ts
const BrowserSnapshotDefaultsSchema = zod.z.object({ mode: zod.z.literal("efficient").optional() }).strict().optional();
const NodeHostAgentRunsSchema = zod.z.object({ claude: zod.z.object({ enabled: zod.z.boolean().optional() }).strict().optional() }).strict().optional();
//#endregion
//#region src/config/zod-schema.proxy.ts
const ProxyLoopbackModeSchema = zod.z.enum([
	"gateway-only",
	"proxy",
	"block"
]);
const ProxyTlsConfigSchema = zod.z.object({ caFile: zod.z.string().min(1).optional() }).strict().optional();
const ProxyConfigSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	proxyUrl: zod.z.url().refine(_gabrielvfonseca_net_policy_url_protocol.isHttpUrl, { message: "proxyUrl must use http:// or https://" }).register(require_zod_schema_core.sensitive).optional(),
	tls: ProxyTlsConfigSchema,
	loopbackMode: ProxyLoopbackModeSchema.optional()
}).strict().optional();
//#endregion
//#region src/config/zod-schema.session.ts
const SessionResetConfigSchema = zod.z.object({
	mode: zod.z.union([zod.z.literal("daily"), zod.z.literal("idle")]).optional(),
	atHour: zod.z.number().int().min(0).max(23).optional(),
	idleMinutes: zod.z.number().int().positive().optional()
}).strict();
const PositiveDurationSchema = zod.z.union([zod.z.string(), zod.z.number()]).superRefine((value, ctx) => {
	try {
		if (require_parse_duration.parseDurationMs((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(value) ?? "", { defaultUnit: "d" }) <= 0) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			message: "duration must be positive (use ms, s, m, h, d), e.g. 30d"
		});
	} catch {
		ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			message: "invalid duration (use ms, s, m, h, d)"
		});
	}
});
const SessionSendPolicySchema = require_zod_schema_core.createAllowDenyChannelRulesSchema();
const SessionSchema = zod.z.object({
	scope: zod.z.union([zod.z.literal("per-sender"), zod.z.literal("global")]).optional(),
	dmScope: zod.z.union([
		zod.z.literal("main"),
		zod.z.literal("per-peer"),
		zod.z.literal("per-channel-peer"),
		zod.z.literal("per-account-channel-peer")
	]).optional(),
	identityLinks: zod.z.record(zod.z.string(), zod.z.array(zod.z.string())).optional(),
	resetTriggers: zod.z.array(zod.z.string()).optional(),
	idleMinutes: zod.z.number().int().positive().optional(),
	reset: SessionResetConfigSchema.optional(),
	resetByType: zod.z.object({
		direct: SessionResetConfigSchema.optional(),
		/** @deprecated Use `direct` instead. Kept for backward compatibility. */
		dm: SessionResetConfigSchema.optional(),
		group: SessionResetConfigSchema.optional(),
		thread: SessionResetConfigSchema.optional()
	}).strict().optional(),
	resetByChannel: zod.z.record(zod.z.string(), SessionResetConfigSchema).optional(),
	store: zod.z.string().optional(),
	typingIntervalSeconds: zod.z.number().int().positive().optional(),
	typingMode: require_zod_schema_core.TypingModeSchema.optional(),
	mainKey: zod.z.string().optional(),
	sendPolicy: SessionSendPolicySchema.optional(),
	writeLock: zod.z.object({
		acquireTimeoutMs: zod.z.number().int().positive().optional(),
		staleMs: zod.z.number().int().positive().optional(),
		maxHoldMs: zod.z.number().int().positive().optional()
	}).strict().optional(),
	agentToAgent: zod.z.object({ maxPingPongTurns: zod.z.number().int().min(0).max(20).optional() }).strict().optional(),
	threadBindings: zod.z.object({
		enabled: zod.z.boolean().optional(),
		idleHours: zod.z.number().nonnegative().optional(),
		maxAgeHours: zod.z.number().nonnegative().optional(),
		spawnSessions: zod.z.boolean().optional(),
		defaultSpawnContext: zod.z.enum(["isolated", "fork"]).optional()
	}).strict().optional(),
	maintenance: zod.z.object({
		mode: zod.z.enum(["enforce", "warn"]).optional(),
		pruneAfter: PositiveDurationSchema.optional(),
		/** @deprecated Use pruneAfter instead. */
		pruneDays: zod.z.number().int().positive().optional(),
		maxEntries: zod.z.number().int().positive().optional(),
		resetArchiveRetention: zod.z.union([PositiveDurationSchema, zod.z.literal(false)]).optional(),
		maxDiskBytes: zod.z.union([
			zod.z.string(),
			zod.z.number(),
			zod.z.literal(false)
		]).optional(),
		highWaterBytes: zod.z.union([zod.z.string(), zod.z.number()]).optional()
	}).strict().superRefine((val, ctx) => {
		if (val.maxDiskBytes !== void 0 && val.maxDiskBytes !== false) try {
			parseByteSize((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(val.maxDiskBytes) ?? "", { defaultUnit: "b" });
		} catch {
			ctx.addIssue({
				code: zod.z.ZodIssueCode.custom,
				path: ["maxDiskBytes"],
				message: "invalid size (use b, kb, mb, gb, tb)"
			});
		}
		if (val.highWaterBytes !== void 0) try {
			parseByteSize((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(val.highWaterBytes) ?? "", { defaultUnit: "b" });
		} catch {
			ctx.addIssue({
				code: zod.z.ZodIssueCode.custom,
				path: ["highWaterBytes"],
				message: "invalid size (use b, kb, mb, gb, tb)"
			});
		}
	}).optional()
}).strict().optional();
const ResponseUsageModeSchema = zod.z.enum([
	"on",
	"off",
	"tokens",
	"full"
]);
const MessagesSchema = zod.z.object({
	messagePrefix: zod.z.string().optional(),
	visibleReplies: require_zod_schema_core.VisibleRepliesSchema.optional(),
	responsePrefix: zod.z.string().optional(),
	usageTemplate: zod.z.union([zod.z.string(), zod.z.record(zod.z.string(), zod.z.unknown())]).optional(),
	responseUsage: zod.z.union([ResponseUsageModeSchema, zod.z.record(zod.z.string(), ResponseUsageModeSchema)]).optional(),
	groupChat: require_zod_schema_core.GroupChatSchema,
	queue: require_zod_schema_core.QueueSchema,
	inbound: require_zod_schema_core.InboundDebounceSchema,
	ackReaction: zod.z.string().optional(),
	ackReactionScope: zod.z.enum([
		"group-mentions",
		"group-all",
		"direct",
		"all",
		"off",
		"none"
	]).optional(),
	removeAckAfterReply: zod.z.boolean().optional(),
	statusReactions: zod.z.object({
		enabled: zod.z.boolean().optional(),
		emojis: zod.z.object({
			queued: zod.z.string().optional(),
			thinking: zod.z.string().optional(),
			tool: zod.z.string().optional(),
			coding: zod.z.string().optional(),
			web: zod.z.string().optional(),
			deploy: zod.z.string().optional(),
			build: zod.z.string().optional(),
			concierge: zod.z.string().optional(),
			done: zod.z.string().optional(),
			error: zod.z.string().optional(),
			stallSoft: zod.z.string().optional(),
			stallHard: zod.z.string().optional(),
			compacting: zod.z.string().optional()
		}).strict().optional(),
		timing: zod.z.object({
			debounceMs: zod.z.number().int().min(0).optional(),
			stallSoftMs: zod.z.number().int().min(0).optional(),
			stallHardMs: zod.z.number().int().min(0).optional(),
			doneHoldMs: zod.z.number().int().min(0).optional(),
			errorHoldMs: zod.z.number().int().min(0).optional()
		}).strict().optional()
	}).strict().optional(),
	suppressToolErrors: zod.z.boolean().optional(),
	tts: require_zod_schema_core.TtsConfigSchema
}).strict().optional();
const CommandsSchema = zod.z.object({
	native: require_zod_schema_core.NativeCommandsSettingSchema.optional().default("auto"),
	nativeSkills: require_zod_schema_core.NativeCommandsSettingSchema.optional().default("auto"),
	text: zod.z.boolean().optional(),
	bash: zod.z.boolean().optional(),
	bashForegroundMs: zod.z.number().int().min(0).max(3e4).optional(),
	config: zod.z.boolean().optional(),
	mcp: zod.z.boolean().optional(),
	plugins: zod.z.boolean().optional(),
	debug: zod.z.boolean().optional(),
	restart: zod.z.boolean().optional().default(true),
	useAccessGroups: zod.z.boolean().optional(),
	ownerAllowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	ownerDisplay: zod.z.enum(["raw", "hash"]).optional().default("raw"),
	ownerDisplaySecret: zod.z.string().optional().register(require_zod_schema_core.sensitive),
	allowFrom: require_zod_schema_channels_config.ElevatedAllowFromSchema.optional()
}).strict().optional().default(() => ({
	native: "auto",
	nativeSkills: "auto",
	restart: true,
	ownerDisplay: "raw"
}));
//#endregion
//#region src/config/zod-schema.ts
function installZodDefaultLocale() {
	zod.z.config(zod.z.locales.en());
}
installZodDefaultLocale();
const GatewayRemoteSchemaShape = {
	url: zod.z.string().optional(),
	transport: zod.z.union([zod.z.literal("ssh"), zod.z.literal("direct")]).optional(),
	remotePort: zod.z.number().int().min(1).max(65535).optional(),
	token: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	password: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	tlsFingerprint: zod.z.string().optional(),
	sshTarget: zod.z.string().optional(),
	sshIdentity: zod.z.string().optional(),
	sshHostKeyPolicy: zod.z.union([zod.z.literal("strict"), zod.z.literal("openssh")]).optional()
};
const GatewayRemoteConfigSchema = zod.z.strictObject(GatewayRemoteSchemaShape).optional();
const TailscaleServiceNameSchema = zod.z.string().regex(/^svc:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, { message: "Tailscale serviceName must use the \"svc:<dns-label>\" format, for example \"svc:openclaw\"" });
const LegacyCanvasHostSchema = zod.z.strictObject({
	enabled: zod.z.boolean().optional(),
	root: zod.z.string().optional(),
	port: zod.z.number().int().positive().optional(),
	liveReload: zod.z.boolean().optional()
}).optional();
const SecuritySchema = zod.z.strictObject({
	audit: zod.z.strictObject({ suppressions: zod.z.array(zod.z.strictObject({
		checkId: zod.z.string().min(1),
		titleIncludes: zod.z.string().min(1).optional(),
		detailIncludes: zod.z.string().min(1).optional(),
		reason: zod.z.string().min(1).optional()
	})).optional() }).optional(),
	installPolicy: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		targets: zod.z.array(zod.z.union([zod.z.literal("skill"), zod.z.literal("plugin")])).min(1).optional(),
		exec: zod.z.strictObject({
			source: zod.z.literal("exec"),
			command: zod.z.string().min(1),
			args: zod.z.array(zod.z.string()).optional(),
			timeoutMs: zod.z.number().int().min(1).optional(),
			noOutputTimeoutMs: zod.z.number().int().min(1).optional(),
			maxOutputBytes: zod.z.number().int().min(1).optional(),
			env: zod.z.record(zod.z.string(), zod.z.string().register(require_zod_schema_core.sensitive)).optional(),
			passEnv: zod.z.array(zod.z.string()).optional(),
			trustedDirs: zod.z.array(zod.z.string()).optional(),
			allowInsecurePath: zod.z.boolean().optional(),
			allowSymlinkCommand: zod.z.boolean().optional()
		}).optional()
	}).optional()
}).optional();
const AccessGroupsSchema = zod.z.record(zod.z.string().min(1), zod.z.discriminatedUnion("type", [zod.z.strictObject({
	type: zod.z.literal("discord.channelAudience"),
	guildId: zod.z.string().min(1),
	channelId: zod.z.string().min(1),
	membership: zod.z.literal("canViewChannel").optional()
}), zod.z.strictObject({
	type: zod.z.literal("message.senders"),
	members: zod.z.record(zod.z.string().min(1), zod.z.array(zod.z.string().min(1)))
})])).optional();
const MemoryQmdPathSchema = zod.z.strictObject({
	path: zod.z.string(),
	name: zod.z.string().optional(),
	pattern: zod.z.string().optional()
});
const MemoryQmdSessionSchema = zod.z.strictObject({
	enabled: zod.z.boolean().optional(),
	exportDir: zod.z.string().optional(),
	retentionDays: zod.z.number().int().nonnegative().optional()
});
const MemoryQmdUpdateSchema = zod.z.strictObject({
	interval: zod.z.string().optional(),
	debounceMs: zod.z.number().int().nonnegative().optional(),
	onBoot: zod.z.boolean().optional(),
	startup: zod.z.enum([
		"off",
		"idle",
		"immediate"
	]).optional(),
	startupDelayMs: zod.z.number().int().nonnegative().optional(),
	waitForBootSync: zod.z.boolean().optional(),
	embedInterval: zod.z.string().optional(),
	commandTimeoutMs: zod.z.number().int().nonnegative().optional(),
	updateTimeoutMs: zod.z.number().int().nonnegative().optional(),
	embedTimeoutMs: zod.z.number().int().nonnegative().optional()
});
const MemoryQmdLimitsSchema = zod.z.strictObject({
	maxResults: zod.z.number().int().positive().optional(),
	maxSnippetChars: zod.z.number().int().positive().optional(),
	maxInjectedChars: zod.z.number().int().positive().optional(),
	timeoutMs: zod.z.number().int().nonnegative().optional()
});
const MemoryQmdMcporterSchema = zod.z.strictObject({
	enabled: zod.z.boolean().optional(),
	serverName: zod.z.string().optional(),
	startDaemon: zod.z.boolean().optional()
});
const LoggingLevelSchema = zod.z.union([
	zod.z.literal("silent"),
	zod.z.literal("fatal"),
	zod.z.literal("error"),
	zod.z.literal("warn"),
	zod.z.literal("info"),
	zod.z.literal("debug"),
	zod.z.literal("trace")
]);
const MemoryQmdSchema = zod.z.strictObject({
	command: zod.z.string().optional(),
	mcporter: MemoryQmdMcporterSchema.optional(),
	searchMode: zod.z.union([
		zod.z.literal("query"),
		zod.z.literal("search"),
		zod.z.literal("vsearch")
	]).optional(),
	rerank: zod.z.boolean().optional(),
	searchTool: zod.z.string().trim().min(1).optional(),
	includeDefaultMemory: zod.z.boolean().optional(),
	paths: zod.z.array(MemoryQmdPathSchema).optional(),
	sessions: MemoryQmdSessionSchema.optional(),
	update: MemoryQmdUpdateSchema.optional(),
	limits: MemoryQmdLimitsSchema.optional(),
	scope: SessionSendPolicySchema.optional()
});
const MemorySchema = zod.z.strictObject({
	backend: zod.z.union([zod.z.literal("builtin"), zod.z.literal("qmd")]).optional(),
	citations: zod.z.union([
		zod.z.literal("auto"),
		zod.z.literal("on"),
		zod.z.literal("off")
	]).optional(),
	qmd: MemoryQmdSchema.optional()
}).optional();
const HttpUrlSchema = zod.z.string().url().refine(_gabrielvfonseca_net_policy_url_protocol.isHttpUrl, "Expected http:// or https:// URL");
const McpOAuthClientMetadataUrlSchema = zod.z.string().url().refine((value) => {
	const url = new URL(value);
	return (0, _gabrielvfonseca_net_policy_url_protocol.isHttpsUrl)(url) && url.pathname !== "/";
}, "Expected https:// URL with a non-root pathname");
const ResponsesEndpointUrlFetchShape = {
	allowUrl: zod.z.boolean().optional(),
	urlAllowlist: zod.z.array(zod.z.string()).optional(),
	allowedMimes: zod.z.array(zod.z.string()).optional(),
	maxBytes: zod.z.number().int().positive().optional(),
	maxRedirects: zod.z.number().int().nonnegative().optional(),
	timeoutMs: zod.z.number().int().positive().optional()
};
const SkillEntrySchema = zod.z.strictObject({
	enabled: zod.z.boolean().optional(),
	apiKey: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	env: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	config: zod.z.record(zod.z.string(), zod.z.unknown()).optional()
});
const PluginEntrySchema = zod.z.strictObject({
	enabled: zod.z.boolean().optional(),
	hooks: zod.z.strictObject({
		allowPromptInjection: zod.z.boolean().optional(),
		allowConversationAccess: zod.z.boolean().optional(),
		timeoutMs: zod.z.number().int().positive().max(6e5).optional(),
		timeouts: zod.z.record(zod.z.string(), zod.z.number().int().positive().max(6e5)).optional()
	}).optional(),
	subagent: zod.z.strictObject({
		allowModelOverride: zod.z.boolean().optional(),
		allowedModels: zod.z.array(zod.z.string()).optional()
	}).optional(),
	llm: zod.z.strictObject({
		allowModelOverride: zod.z.boolean().optional(),
		allowedModels: zod.z.array(zod.z.string()).optional(),
		allowAgentIdOverride: zod.z.boolean().optional()
	}).optional(),
	config: zod.z.record(zod.z.string(), zod.z.unknown()).optional()
});
const TalkProviderEntrySchema = zod.z.object({ apiKey: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive) }).catchall(zod.z.unknown());
const TalkRealtimeSchema = zod.z.strictObject({
	provider: zod.z.string().optional(),
	providers: zod.z.record(zod.z.string(), TalkProviderEntrySchema).optional(),
	model: zod.z.string().optional(),
	speakerVoice: zod.z.string().optional(),
	speakerVoiceId: zod.z.string().optional(),
	voice: zod.z.string().optional(),
	instructions: zod.z.string().optional(),
	mode: zod.z.enum([
		"realtime",
		"stt-tts",
		"transcription"
	]).optional(),
	transport: zod.z.enum([
		"webrtc",
		"provider-websocket",
		"gateway-relay",
		"managed-room"
	]).optional(),
	vadThreshold: zod.z.number().min(0).max(1).optional(),
	silenceDurationMs: zod.z.number().int().positive().optional(),
	prefixPaddingMs: zod.z.number().int().nonnegative().optional(),
	reasoningEffort: zod.z.string().min(1).optional(),
	brain: zod.z.enum([
		"agent-consult",
		"direct-tools",
		"none"
	]).optional(),
	consultRouting: zod.z.enum(["provider-direct", "force-agent-consult"]).optional()
}).superRefine((realtime, ctx) => {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(realtime.provider ?? "");
	const providers = realtime.providers ? Object.keys(realtime.providers) : [];
	if (provider && providers.length > 0 && !Object.hasOwn(realtime.providers, provider)) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["provider"],
		message: `talk.realtime.provider must match a key in talk.realtime.providers (missing "${provider}")`
	});
	if (!provider && providers.length > 1) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["provider"],
		message: "talk.realtime.provider is required when talk.realtime.providers defines multiple providers"
	});
});
const TalkSchema = zod.z.strictObject({
	provider: zod.z.string().optional(),
	providers: zod.z.record(zod.z.string(), TalkProviderEntrySchema).optional(),
	realtime: TalkRealtimeSchema.optional(),
	consultThinkingLevel: zod.z.enum([
		"off",
		"minimal",
		"low",
		"medium",
		"high",
		"xhigh",
		"adaptive",
		"max",
		"ultra"
	]).optional(),
	consultFastMode: zod.z.boolean().optional(),
	speechLocale: zod.z.string().optional(),
	interruptOnSpeech: zod.z.boolean().optional(),
	silenceTimeoutMs: zod.z.number().int().positive().optional()
}).superRefine((talk, ctx) => {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(talk.provider ?? "");
	const providers = talk.providers ? Object.keys(talk.providers) : [];
	if (provider && providers.length > 0 && !Object.hasOwn(talk.providers, provider)) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["provider"],
		message: `talk.provider must match a key in talk.providers (missing "${provider}")`
	});
	if (!provider && providers.length > 1) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["provider"],
		message: "talk.provider is required when talk.providers defines multiple providers"
	});
});
const McpServerSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	command: zod.z.string().optional(),
	args: zod.z.array(zod.z.string()).optional(),
	env: zod.z.record(zod.z.string(), zod.z.union([
		zod.z.string().register(require_zod_schema_core.sensitive),
		zod.z.number(),
		zod.z.boolean()
	]).register(require_zod_schema_core.sensitive)).optional(),
	cwd: zod.z.string().optional(),
	workingDirectory: zod.z.string().optional(),
	url: HttpUrlSchema.optional(),
	transport: zod.z.union([
		zod.z.literal("stdio"),
		zod.z.literal("sse"),
		zod.z.literal("streamable-http")
	]).optional(),
	headers: zod.z.record(zod.z.string(), zod.z.union([
		zod.z.string().register(require_zod_schema_core.sensitive),
		zod.z.number(),
		zod.z.boolean()
	]).register(require_zod_schema_core.sensitive)).optional(),
	connectionTimeoutMs: zod.z.number().finite().positive().optional(),
	connectTimeout: zod.z.number().finite().positive().optional(),
	connect_timeout: zod.z.number().finite().positive().optional(),
	requestTimeoutMs: zod.z.number().finite().positive().optional(),
	timeout: zod.z.number().finite().positive().optional(),
	supportsParallelToolCalls: zod.z.boolean().optional(),
	supports_parallel_tool_calls: zod.z.boolean().optional(),
	auth: zod.z.literal("oauth").optional(),
	oauth: zod.z.strictObject({
		authProfileId: zod.z.string().trim().min(1).optional(),
		scope: zod.z.string().trim().min(1).optional(),
		redirectUrl: HttpUrlSchema.optional(),
		clientMetadataUrl: McpOAuthClientMetadataUrlSchema.optional()
	}).optional(),
	sslVerify: zod.z.boolean().optional(),
	ssl_verify: zod.z.boolean().optional(),
	clientCert: zod.z.string().optional(),
	client_cert: zod.z.string().optional(),
	clientKey: zod.z.string().optional(),
	client_key: zod.z.string().optional(),
	toolFilter: zod.z.strictObject({
		include: zod.z.array(zod.z.string().trim().min(1)).min(1).optional(),
		exclude: zod.z.array(zod.z.string().trim().min(1)).min(1).optional()
	}).optional(),
	codex: zod.z.strictObject({
		agents: zod.z.array(zod.z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/i)).min(1).optional(),
		defaultToolsApprovalMode: zod.z.enum([
			"auto",
			"prompt",
			"approve"
		]).optional(),
		default_tools_approval_mode: zod.z.enum([
			"auto",
			"prompt",
			"approve"
		]).optional()
	}).optional()
}).superRefine((data, ctx) => {
	if (data.transport === "stdio" && (typeof data.command !== "string" || data.command.trim().length === 0)) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: "\"stdio\" transport requires a non-empty command",
		path: ["transport"]
	});
}).catchall(zod.z.unknown());
const McpConfigSchema = zod.z.strictObject({
	servers: zod.z.record(zod.z.string(), McpServerSchema).optional(),
	apps: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		sandboxOrigin: zod.z.string().url().refine((value) => {
			try {
				const url = new URL(value);
				return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value.replace(/\/$/u, "") && !url.username && !url.password;
			} catch {
				return false;
			}
		}, "sandboxOrigin must be an HTTP(S) origin without a path, query, or credentials").optional(),
		sandboxPort: zod.z.number().int().min(1).max(65535).optional()
	}).optional(),
	sessionIdleTtlMs: zod.z.number().finite().min(0).optional()
}).optional();
const NodeHostMcpServerNameSchema = zod.z.string().refine((value) => value.length > 0 && value === value.trim(), "MCP server name must be non-empty and must not have surrounding whitespace");
const NodeHostSchema = zod.z.strictObject({
	agentRuns: NodeHostAgentRunsSchema,
	browserProxy: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		allowProfiles: zod.z.array(zod.z.string()).optional()
	}).optional(),
	mcp: zod.z.strictObject({ servers: zod.z.record(NodeHostMcpServerNameSchema, McpServerSchema).optional() }).optional(),
	skills: zod.z.strictObject({ enabled: zod.z.boolean().optional() }).optional()
}).optional();
const SystemAgentSchema = zod.z.strictObject({ rescue: zod.z.strictObject({
	enabled: zod.z.union([zod.z.literal("auto"), zod.z.boolean()]).optional(),
	ownerDmOnly: zod.z.boolean().optional(),
	pendingTtlMinutes: zod.z.number().int().positive().optional()
}).optional() }).optional();
function isPlainHttpsUrl(value) {
	try {
		const url = new URL(value);
		return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash;
	} catch {
		return false;
	}
}
function isEd25519PublicKeyConfig(value) {
	if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(value)) return false;
	if (!value.includes("BEGIN") && !/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
	try {
		const normalized = require_ed25519_signature.normalizeEd25519PublicKeyBase64Url(value);
		return normalized ? require_ed25519_signature.base64UrlDecode(normalized).length === 32 : false;
	} catch {
		return false;
	}
}
const MarketplaceFeedTrustedPublicKeySchema = zod.z.strictObject({
	keyId: zod.z.string().trim().min(1),
	publicKey: zod.z.string().trim().min(1).refine((value) => isEd25519PublicKeyConfig(value), "Expected Ed25519 public key as PEM or raw base64url")
});
const MarketplaceVerificationSchema = zod.z.union([zod.z.strictObject({ mode: zod.z.literal("unsigned") }), zod.z.strictObject({
	mode: zod.z.literal("signed"),
	keys: zod.z.array(MarketplaceFeedTrustedPublicKeySchema).min(1),
	threshold: zod.z.number().int().positive().optional()
}).superRefine((value, ctx) => {
	const seenKeyIds = /* @__PURE__ */ new Map();
	const seenPublicKeys = /* @__PURE__ */ new Map();
	value.keys.forEach((key, index) => {
		if (seenKeyIds.get(key.keyId) !== void 0) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [
				"keys",
				index,
				"keyId"
			],
			message: "Signed marketplace feed publisher key IDs must be unique"
		});
		else seenKeyIds.set(key.keyId, index);
		const normalizedPublicKey = require_ed25519_signature.normalizeEd25519PublicKeyBase64Url(key.publicKey);
		if (!normalizedPublicKey) return;
		if (seenPublicKeys.get(normalizedPublicKey) !== void 0) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [
				"keys",
				index,
				"publicKey"
			],
			message: "Signed marketplace feed publisher public keys must be unique"
		});
		else seenPublicKeys.set(normalizedPublicKey, index);
	});
	if (value.threshold !== void 0 && value.threshold > value.keys.length) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["threshold"],
		message: "Signed marketplace feed threshold cannot exceed configured key count"
	});
})]);
const MarketplaceFeedProfileSchema = zod.z.strictObject({
	url: zod.z.string().url().refine((value) => isPlainHttpsUrl(value), "Expected https:// URL without credentials, query, or fragment"),
	verification: MarketplaceVerificationSchema.optional()
});
const MarketplaceSourceProfileSchema = zod.z.union([
	zod.z.strictObject({ type: zod.z.literal("npm") }),
	zod.z.strictObject({ type: zod.z.literal("clawhub") }),
	zod.z.strictObject({ type: zod.z.literal("git") })
]);
const MarketplacesSchema = zod.z.strictObject({
	feeds: zod.z.record(zod.z.string().min(1), MarketplaceFeedProfileSchema).optional(),
	sources: zod.z.record(zod.z.string().min(1), MarketplaceSourceProfileSchema).optional()
}).optional();
const CommitmentsSchema = zod.z.strictObject({
	enabled: zod.z.boolean().optional(),
	maxPerDay: zod.z.number().int().positive().optional()
}).optional();
const OperatorSchema = zod.z.strictObject({
	$schema: zod.z.string().optional(),
	meta: zod.z.strictObject({
		lastTouchedVersion: zod.z.string().optional(),
		lastTouchedAt: zod.z.union([zod.z.string(), zod.z.number().transform((n, ctx) => {
			const d = new Date(n);
			if (Number.isNaN(d.getTime())) {
				ctx.addIssue({
					code: zod.z.ZodIssueCode.custom,
					message: "Invalid timestamp"
				});
				return zod.z.NEVER;
			}
			return d.toISOString();
		}).pipe(zod.z.string())]).optional()
	}).optional(),
	env: zod.z.object({
		shellEnv: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			timeoutMs: zod.z.number().int().nonnegative().optional()
		}).optional(),
		vars: zod.z.record(zod.z.string(), zod.z.string()).optional()
	}).catchall(zod.z.string()).optional(),
	wizard: zod.z.strictObject({
		lastRunAt: zod.z.string().optional(),
		lastRunVersion: zod.z.string().optional(),
		lastRunCommit: zod.z.string().optional(),
		lastRunCommand: zod.z.string().optional(),
		lastRunMode: zod.z.union([zod.z.literal("local"), zod.z.literal("remote")]).optional(),
		securityAcknowledgedAt: zod.z.string().optional()
	}).optional(),
	diagnostics: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		flags: zod.z.array(zod.z.string()).optional(),
		stuckSessionWarnMs: zod.z.number().int().positive().optional(),
		stuckSessionAbortMs: zod.z.number().int().positive().optional(),
		memoryPressureSnapshot: zod.z.boolean().optional(),
		otel: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			endpoint: zod.z.string().optional(),
			tracesEndpoint: zod.z.string().optional(),
			metricsEndpoint: zod.z.string().optional(),
			logsEndpoint: zod.z.string().optional(),
			protocol: zod.z.union([zod.z.literal("http/protobuf"), zod.z.literal("grpc")]).optional(),
			headers: zod.z.record(zod.z.string(), zod.z.string()).optional(),
			serviceName: zod.z.string().optional(),
			traces: zod.z.boolean().optional(),
			metrics: zod.z.boolean().optional(),
			logs: zod.z.boolean().optional(),
			logsExporter: zod.z.union([
				zod.z.literal("otlp"),
				zod.z.literal("stdout"),
				zod.z.literal("both")
			]).optional(),
			sampleRate: zod.z.number().min(0).max(1).optional(),
			flushIntervalMs: zod.z.number().int().nonnegative().optional(),
			captureContent: zod.z.union([zod.z.boolean(), zod.z.strictObject({
				enabled: zod.z.boolean().optional(),
				inputMessages: zod.z.boolean().optional(),
				outputMessages: zod.z.boolean().optional(),
				toolInputs: zod.z.boolean().optional(),
				toolOutputs: zod.z.boolean().optional(),
				systemPrompt: zod.z.boolean().optional(),
				toolDefinitions: zod.z.boolean().optional()
			})]).optional()
		}).optional(),
		cacheTrace: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			filePath: zod.z.string().optional(),
			includeMessages: zod.z.boolean().optional(),
			includePrompt: zod.z.boolean().optional(),
			includeSystem: zod.z.boolean().optional()
		}).optional()
	}).optional(),
	audit: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		messages: zod.z.union([
			zod.z.literal("off"),
			zod.z.literal("direct"),
			zod.z.literal("all")
		]).optional()
	}).optional(),
	logging: zod.z.strictObject({
		level: LoggingLevelSchema.optional(),
		file: zod.z.string().optional(),
		maxFileBytes: zod.z.number().int().positive().optional(),
		consoleLevel: LoggingLevelSchema.optional(),
		consoleStyle: zod.z.union([
			zod.z.literal("pretty"),
			zod.z.literal("compact"),
			zod.z.literal("json")
		]).optional(),
		redactSensitive: zod.z.union([zod.z.literal("off"), zod.z.literal("tools")]).optional(),
		redactPatterns: zod.z.array(zod.z.string()).optional()
	}).optional(),
	cli: zod.z.strictObject({ banner: zod.z.strictObject({ taglineMode: zod.z.union([
		zod.z.literal("random"),
		zod.z.literal("default"),
		zod.z.literal("off")
	]).optional() }).optional() }).optional(),
	systemAgent: SystemAgentSchema,
	update: zod.z.strictObject({
		channel: zod.z.union([
			zod.z.literal("stable"),
			zod.z.literal("extended-stable"),
			zod.z.literal("beta"),
			zod.z.literal("dev")
		]).optional(),
		checkOnStart: zod.z.boolean().optional(),
		auto: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			stableDelayHours: zod.z.number().nonnegative().max(168).optional(),
			stableJitterHours: zod.z.number().nonnegative().max(168).optional(),
			betaCheckIntervalHours: zod.z.number().positive().max(24).optional()
		}).optional()
	}).optional(),
	browser: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		allowSystemProfileImport: zod.z.boolean().optional(),
		evaluateEnabled: zod.z.boolean().optional(),
		cdpUrl: zod.z.string().optional(),
		remoteCdpTimeoutMs: zod.z.number().int().nonnegative().optional(),
		remoteCdpHandshakeTimeoutMs: zod.z.number().int().nonnegative().optional(),
		localLaunchTimeoutMs: zod.z.number().int().positive().max(12e4).optional(),
		localCdpReadyTimeoutMs: zod.z.number().int().positive().max(12e4).optional(),
		actionTimeoutMs: zod.z.number().int().positive().optional(),
		color: zod.z.string().optional(),
		executablePath: zod.z.string().optional(),
		headless: zod.z.boolean().optional(),
		noSandbox: zod.z.boolean().optional(),
		attachOnly: zod.z.boolean().optional(),
		cdpPortRangeStart: zod.z.number().int().min(1).max(65535).optional(),
		defaultProfile: zod.z.string().optional(),
		snapshotDefaults: BrowserSnapshotDefaultsSchema,
		ssrfPolicy: zod.z.strictObject({
			dangerouslyAllowPrivateNetwork: zod.z.boolean().optional(),
			allowedHostnames: zod.z.array(zod.z.string()).optional(),
			hostnameAllowlist: zod.z.array(zod.z.string()).optional()
		}).optional(),
		profiles: zod.z.record(zod.z.string().regex(/^[a-z0-9-]+$/, "Profile names must be alphanumeric with hyphens only"), zod.z.strictObject({
			cdpPort: zod.z.number().int().min(1).max(65535).optional(),
			cdpUrl: zod.z.string().optional(),
			userDataDir: zod.z.string().optional(),
			mcpCommand: zod.z.string().optional(),
			mcpArgs: zod.z.array(zod.z.string()).optional(),
			driver: zod.z.union([
				zod.z.literal("@gabrielvfonseca/operator"),
				zod.z.literal("clawd"),
				zod.z.literal("existing-session"),
				zod.z.literal("extension")
			]).optional(),
			headless: zod.z.boolean().optional(),
			executablePath: zod.z.string().optional(),
			attachOnly: zod.z.boolean().optional(),
			color: require_zod_schema_core.HexColorSchema
		}).refine((value) => value.driver === "existing-session" || value.driver === "extension" || value.cdpPort || value.cdpUrl, { message: "Profile must set cdpPort or cdpUrl" }).refine((value) => value.driver === "existing-session" || !value.userDataDir, { message: "Profile userDataDir is only supported with driver=\"existing-session\"" }).refine((value) => value.driver !== "extension" || !value.cdpUrl, { message: "Profile cdpUrl is not supported with driver=\"extension\" (the relay owns the endpoint)" })).optional(),
		extraArgs: zod.z.array(zod.z.string()).optional(),
		tabCleanup: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			idleMinutes: zod.z.number().int().nonnegative().optional(),
			maxTabsPerSession: zod.z.number().int().nonnegative().optional(),
			sweepMinutes: zod.z.number().int().positive().optional()
		}).optional()
	}).optional(),
	ui: zod.z.strictObject({
		seamColor: require_zod_schema_core.HexColorSchema.optional(),
		assistant: zod.z.strictObject({
			name: zod.z.string().max(50).optional(),
			avatar: zod.z.string().max(2e6).optional()
		}).optional()
	}).optional(),
	tui: zod.z.strictObject({ footer: zod.z.strictObject({ showRemoteHost: zod.z.boolean().optional() }).optional() }).optional(),
	secrets: require_zod_schema_core.SecretsConfigSchema,
	marketplaces: MarketplacesSchema,
	auth: zod.z.strictObject({
		profiles: zod.z.record(zod.z.string(), zod.z.strictObject({
			provider: zod.z.string(),
			mode: zod.z.union([
				zod.z.literal("api_key"),
				zod.z.literal("aws-sdk"),
				zod.z.literal("oauth"),
				zod.z.literal("token")
			]),
			email: zod.z.string().optional(),
			displayName: zod.z.string().optional()
		})).optional(),
		order: zod.z.record(zod.z.string(), zod.z.array(zod.z.string())).optional(),
		cooldowns: zod.z.strictObject({
			billingBackoffHours: zod.z.number().positive().optional(),
			billingBackoffHoursByProvider: zod.z.record(zod.z.string(), zod.z.number().positive()).optional(),
			billingMaxHours: zod.z.number().positive().optional(),
			authPermanentBackoffMinutes: zod.z.number().positive().optional(),
			authPermanentMaxMinutes: zod.z.number().positive().optional(),
			failureWindowHours: zod.z.number().positive().optional(),
			overloadedProfileRotations: zod.z.number().int().nonnegative().optional(),
			overloadedBackoffMs: zod.z.number().int().nonnegative().optional(),
			rateLimitedProfileRotations: zod.z.number().int().nonnegative().optional()
		}).optional()
	}).optional(),
	accessGroups: AccessGroupsSchema,
	acp: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		dispatch: zod.z.strictObject({ enabled: zod.z.boolean().optional() }).optional(),
		backend: zod.z.string().optional(),
		fallbacks: zod.z.array(zod.z.string()).optional(),
		defaultAgent: zod.z.string().optional(),
		allowedAgents: zod.z.array(zod.z.string()).optional(),
		maxConcurrentSessions: zod.z.number().int().positive().optional(),
		stream: zod.z.strictObject({
			coalesceIdleMs: zod.z.number().int().nonnegative().optional(),
			maxChunkChars: zod.z.number().int().positive().optional(),
			repeatSuppression: zod.z.boolean().optional(),
			deliveryMode: zod.z.union([zod.z.literal("live"), zod.z.literal("final_only")]).optional(),
			hiddenBoundarySeparator: zod.z.union([
				zod.z.literal("none"),
				zod.z.literal("space"),
				zod.z.literal("newline"),
				zod.z.literal("paragraph")
			]).optional(),
			maxOutputChars: zod.z.number().int().positive().optional(),
			maxSessionUpdateChars: zod.z.number().int().positive().optional(),
			tagVisibility: zod.z.record(zod.z.string(), zod.z.boolean()).optional()
		}).optional(),
		runtime: zod.z.strictObject({
			ttlMinutes: zod.z.number().int().positive().optional(),
			installCommand: zod.z.string().optional()
		}).optional()
	}).optional(),
	models: require_zod_schema_core.ModelsConfigSchema,
	nodeHost: NodeHostSchema,
	agents: AgentsSchema,
	tools: require_zod_schema_channels_config.ToolsSchema,
	security: SecuritySchema,
	bindings: BindingsSchema,
	broadcast: BroadcastSchema,
	audio: AudioSchema,
	media: zod.z.strictObject({
		preserveFilenames: zod.z.boolean().optional(),
		ttlHours: zod.z.number().int().min(1).max(168).optional()
	}).optional(),
	messages: MessagesSchema,
	commands: CommandsSchema,
	approvals: require_zod_schema_channels_config.ApprovalsSchema,
	session: SessionSchema,
	cron: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		store: zod.z.string().optional(),
		maxConcurrentRuns: zod.z.number().int().positive().optional(),
		triggers: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			minIntervalMs: zod.z.number().int().positive().optional()
		}).optional(),
		retry: zod.z.strictObject({
			maxAttempts: zod.z.number().int().min(0).max(10).optional(),
			backoffMs: zod.z.array(zod.z.number().int().nonnegative()).min(1).max(10).optional(),
			retryOn: zod.z.array(zod.z.enum([
				"rate_limit",
				"overloaded",
				"network",
				"timeout",
				"server_error"
			])).min(1).optional()
		}).optional(),
		webhook: HttpUrlSchema.optional(),
		webhookToken: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
		sessionRetention: zod.z.union([zod.z.string(), zod.z.literal(false)]).optional(),
		failureAlert: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			after: zod.z.number().int().min(1).optional(),
			cooldownMs: zod.z.number().int().min(0).optional(),
			includeSkipped: zod.z.boolean().optional(),
			mode: zod.z.enum(["announce", "webhook"]).optional(),
			accountId: zod.z.string().optional()
		}).optional(),
		failureDestination: zod.z.strictObject({
			channel: zod.z.string().optional(),
			to: zod.z.string().optional(),
			accountId: zod.z.string().optional(),
			mode: zod.z.enum(["announce", "webhook"]).optional()
		}).optional()
	}).superRefine((val, ctx) => {
		if (val.sessionRetention !== void 0 && val.sessionRetention !== false) try {
			require_parse_duration.parseDurationMs((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeStringifiedOptionalString)(val.sessionRetention) ?? "", { defaultUnit: "h" });
		} catch {
			ctx.addIssue({
				code: zod.z.ZodIssueCode.custom,
				path: ["sessionRetention"],
				message: "invalid duration (use ms, s, m, h, d)"
			});
		}
	}).optional(),
	worktrees: zod.z.strictObject({ cleanup: zod.z.strictObject({
		maxCount: zod.z.number().int().min(0).optional(),
		maxTotalSizeGb: zod.z.number().min(0).optional()
	}).optional() }).optional(),
	transcripts: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		maxUtterances: zod.z.number().int().min(1).max(1e4).optional(),
		autoStart: zod.z.array(zod.z.strictObject({
			providerId: zod.z.string().min(1),
			sessionId: zod.z.string().min(1).optional(),
			title: zod.z.string().min(1).optional(),
			accountId: zod.z.string().min(1).optional(),
			guildId: zod.z.string().min(1).optional(),
			channelId: zod.z.string().min(1).optional(),
			meetingUrl: zod.z.string().min(1).optional()
		})).optional()
	}).optional(),
	commitments: CommitmentsSchema,
	hooks: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		path: zod.z.string().optional(),
		token: zod.z.string().optional().register(require_zod_schema_core.sensitive),
		defaultSessionKey: zod.z.string().optional(),
		allowRequestSessionKey: zod.z.boolean().optional(),
		allowedSessionKeyPrefixes: zod.z.array(zod.z.string()).optional(),
		allowedAgentIds: zod.z.array(zod.z.string()).optional(),
		maxBodyBytes: zod.z.number().int().positive().optional(),
		presets: zod.z.array(zod.z.string()).optional(),
		transformsDir: zod.z.string().optional(),
		mappings: zod.z.array(HookMappingSchema).optional(),
		gmail: HooksGmailSchema,
		internal: InternalHooksSchema
	}).optional(),
	web: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		heartbeatSeconds: zod.z.number().int().positive().optional(),
		reconnect: zod.z.strictObject({
			initialMs: zod.z.number().positive().optional(),
			maxMs: zod.z.number().positive().optional(),
			factor: zod.z.number().positive().optional(),
			jitter: zod.z.number().min(0).max(1).optional(),
			maxAttempts: zod.z.number().int().min(0).optional()
		}).optional(),
		whatsapp: zod.z.strictObject({
			keepAliveIntervalMs: zod.z.number().int().positive().optional(),
			connectTimeoutMs: zod.z.number().int().positive().optional(),
			defaultQueryTimeoutMs: zod.z.number().int().positive().optional()
		}).optional()
	}).optional(),
	channels: require_zod_schema_channels_config.ChannelsSchema,
	discovery: zod.z.strictObject({
		wideArea: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			domain: zod.z.string().optional()
		}).optional(),
		mdns: zod.z.strictObject({ mode: zod.z.enum([
			"off",
			"minimal",
			"full"
		]).optional() }).optional()
	}).optional(),
	talk: TalkSchema.optional(),
	gateway: zod.z.strictObject({
		port: zod.z.number().int().positive().optional(),
		mode: zod.z.union([zod.z.literal("local"), zod.z.literal("remote")]).optional(),
		bind: zod.z.union([
			zod.z.literal("auto"),
			zod.z.literal("lan"),
			zod.z.literal("loopback"),
			zod.z.literal("custom"),
			zod.z.literal("tailnet")
		]).optional(),
		customBindHost: zod.z.string().optional(),
		controlUi: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			basePath: zod.z.string().optional(),
			root: zod.z.string().optional(),
			toolTitles: zod.z.boolean().optional(),
			embedSandbox: zod.z.union([
				zod.z.literal("strict"),
				zod.z.literal("scripts"),
				zod.z.literal("trusted")
			]).optional(),
			allowExternalEmbedUrls: zod.z.boolean().optional(),
			chatMessageMaxWidth: zod.z.string().transform((value) => normalizeControlUiChatMessageMaxWidth(value)).refine((value) => isValidControlUiChatMessageMaxWidth(value), { message: "Expected a CSS width value such as 960px, 82%, min(1280px, 82%), or calc(100% - 2rem)" }).optional(),
			allowedOrigins: zod.z.array(zod.z.string()).optional(),
			dangerouslyAllowHostHeaderOriginFallback: zod.z.boolean().optional(),
			allowInsecureAuth: zod.z.boolean().optional(),
			dangerouslyDisableDeviceAuth: zod.z.boolean().optional()
		}).optional(),
		terminal: zod.z.strictObject({
			enabled: zod.z.boolean().optional(),
			shell: zod.z.string().optional(),
			detachedSessionTimeoutSeconds: zod.z.number().int().min(0).optional()
		}).optional(),
		auth: zod.z.strictObject({
			mode: zod.z.union([
				zod.z.literal("none"),
				zod.z.literal("token"),
				zod.z.literal("password"),
				zod.z.literal("trusted-proxy")
			]).optional(),
			token: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
			password: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
			allowTailscale: zod.z.boolean().optional(),
			rateLimit: zod.z.strictObject({
				maxAttempts: zod.z.number().optional(),
				windowMs: zod.z.number().optional(),
				lockoutMs: zod.z.number().optional(),
				exemptLoopback: zod.z.boolean().optional()
			}).optional(),
			trustedProxy: zod.z.strictObject({
				userHeader: zod.z.string().min(1, "userHeader is required for trusted-proxy mode"),
				requiredHeaders: zod.z.array(zod.z.string()).optional(),
				allowUsers: zod.z.array(zod.z.string()).optional(),
				allowLoopback: zod.z.boolean().optional()
			}).optional()
		}).optional(),
		trustedProxies: zod.z.array(zod.z.string()).optional(),
		allowRealIpFallback: zod.z.boolean().optional(),
		tools: zod.z.strictObject({
			deny: zod.z.array(zod.z.string()).optional(),
			allow: zod.z.array(zod.z.string()).optional()
		}).optional(),
		handshakeTimeoutMs: zod.z.number().int().min(1).optional(),
		channelHealthCheckMinutes: zod.z.number().int().min(0).optional(),
		channelStaleEventThresholdMinutes: zod.z.number().int().min(1).optional(),
		channelMaxRestartsPerHour: zod.z.number().int().min(1).optional(),
		tailscale: zod.z.strictObject({
			mode: zod.z.union([
				zod.z.literal("off"),
				zod.z.literal("serve"),
				zod.z.literal("funnel")
			]).optional(),
			resetOnExit: zod.z.boolean().optional(),
			serviceName: TailscaleServiceNameSchema.optional(),
			preserveFunnel: zod.z.boolean().optional()
		}).optional(),
		remote: GatewayRemoteConfigSchema,
		reload: zod.z.strictObject({
			mode: zod.z.union([
				zod.z.literal("off"),
				zod.z.literal("restart"),
				zod.z.literal("hot"),
				zod.z.literal("hybrid")
			]).optional(),
			debounceMs: zod.z.number().int().min(0).optional(),
			deferralTimeoutMs: zod.z.number().int().min(0).optional()
		}).optional(),
		tls: zod.z.object({
			enabled: zod.z.boolean().optional(),
			autoGenerate: zod.z.boolean().optional(),
			certPath: zod.z.string().optional().refine((v) => v === void 0 || v.trim().length > 0, "certPath must not be blank"),
			keyPath: zod.z.string().optional().refine((v) => v === void 0 || v.trim().length > 0, "keyPath must not be blank"),
			caPath: zod.z.string().optional()
		}).optional(),
		http: zod.z.strictObject({
			endpoints: zod.z.strictObject({
				chatCompletions: zod.z.strictObject({
					enabled: zod.z.boolean().optional(),
					maxBodyBytes: zod.z.number().int().positive().optional(),
					maxImageParts: zod.z.number().int().nonnegative().optional(),
					maxTotalImageBytes: zod.z.number().int().positive().optional(),
					images: zod.z.strictObject({ ...ResponsesEndpointUrlFetchShape }).optional()
				}).optional(),
				responses: zod.z.strictObject({
					enabled: zod.z.boolean().optional(),
					maxBodyBytes: zod.z.number().int().positive().optional(),
					maxUrlParts: zod.z.number().int().nonnegative().optional(),
					files: zod.z.strictObject({
						...ResponsesEndpointUrlFetchShape,
						maxChars: zod.z.number().int().positive().optional(),
						pdf: zod.z.strictObject({
							maxPages: zod.z.number().int().positive().optional(),
							maxPixels: zod.z.number().int().positive().optional(),
							minTextChars: zod.z.number().int().nonnegative().optional()
						}).optional()
					}).optional(),
					images: zod.z.strictObject({ ...ResponsesEndpointUrlFetchShape }).optional()
				}).optional()
			}).optional(),
			securityHeaders: zod.z.strictObject({ strictTransportSecurity: zod.z.union([zod.z.string(), zod.z.literal(false)]).optional() }).optional()
		}).optional(),
		push: zod.z.strictObject({ apns: zod.z.strictObject({ relay: zod.z.strictObject({
			baseUrl: zod.z.string().optional(),
			timeoutMs: zod.z.number().int().positive().optional()
		}).optional() }).optional() }).optional(),
		nodes: zod.z.strictObject({
			browser: zod.z.strictObject({
				mode: zod.z.union([
					zod.z.literal("auto"),
					zod.z.literal("manual"),
					zod.z.literal("off")
				]).optional(),
				node: zod.z.string().optional()
			}).optional(),
			pairing: zod.z.strictObject({
				autoApproveCidrs: zod.z.array(zod.z.string()).optional(),
				sshVerify: zod.z.union([zod.z.boolean(), zod.z.strictObject({
					user: zod.z.string().optional(),
					identity: zod.z.string().optional(),
					timeoutMs: zod.z.number().int().positive().optional(),
					cidrs: zod.z.array(zod.z.string()).optional()
				})]).optional()
			}).optional(),
			pluginTools: zod.z.strictObject({ enabled: zod.z.boolean().optional() }).optional(),
			skills: zod.z.strictObject({ enabled: zod.z.boolean().optional() }).optional(),
			allowCommands: zod.z.array(zod.z.string()).optional(),
			denyCommands: zod.z.array(zod.z.string()).optional()
		}).optional()
	}).superRefine((gateway, ctx) => {
		const effectiveHealthCheckMinutes = gateway.channelHealthCheckMinutes ?? 5;
		if (gateway.channelStaleEventThresholdMinutes != null && effectiveHealthCheckMinutes !== 0 && gateway.channelStaleEventThresholdMinutes < effectiveHealthCheckMinutes) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: ["channelStaleEventThresholdMinutes"],
			message: "channelStaleEventThresholdMinutes should be >= channelHealthCheckMinutes to avoid delayed stale detection"
		});
	}).optional(),
	cloudWorkers: CloudWorkersConfigSchema,
	memory: MemorySchema,
	mcp: McpConfigSchema,
	skills: zod.z.strictObject({
		allowBundled: zod.z.array(zod.z.string()).optional(),
		load: zod.z.strictObject({
			extraDirs: zod.z.array(zod.z.string()).optional(),
			allowSymlinkTargets: zod.z.array(zod.z.string()).optional(),
			watch: zod.z.boolean().optional(),
			watchDebounceMs: zod.z.number().int().min(0).optional()
		}).optional(),
		install: zod.z.strictObject({
			preferBrew: zod.z.boolean().optional(),
			nodeManager: zod.z.union([
				zod.z.literal("npm"),
				zod.z.literal("pnpm"),
				zod.z.literal("yarn"),
				zod.z.literal("bun")
			]).optional(),
			allowUploadedArchives: zod.z.boolean().optional()
		}).optional(),
		limits: zod.z.strictObject({
			maxCandidatesPerRoot: zod.z.number().int().min(1).optional(),
			maxSkillsLoadedPerSource: zod.z.number().int().min(1).optional(),
			maxSkillsInPrompt: zod.z.number().int().min(0).optional(),
			maxSkillsPromptChars: zod.z.number().int().min(0).optional(),
			maxSkillFileBytes: zod.z.number().int().min(0).optional()
		}).optional(),
		workshop: zod.z.strictObject({
			autonomous: zod.z.strictObject({ enabled: zod.z.boolean().optional() }).optional(),
			approvalPolicy: zod.z.union([zod.z.literal("pending"), zod.z.literal("auto")]).optional(),
			allowSymlinkTargetWrites: zod.z.boolean().optional(),
			maxPending: zod.z.number().int().min(1).optional(),
			maxSkillBytes: zod.z.number().int().min(1).optional()
		}).optional(),
		entries: zod.z.record(zod.z.string(), SkillEntrySchema).optional()
	}).optional(),
	plugins: zod.z.strictObject({
		enabled: zod.z.boolean().optional(),
		allow: zod.z.array(zod.z.string()).optional(),
		deny: zod.z.array(zod.z.string()).optional(),
		load: zod.z.strictObject({ paths: zod.z.array(zod.z.string()).optional() }).optional(),
		slots: zod.z.strictObject({
			memory: zod.z.string().optional(),
			contextEngine: zod.z.string().optional()
		}).optional(),
		entries: zod.z.record(zod.z.string(), PluginEntrySchema).optional(),
		bundledDiscovery: zod.z.enum(["compat", "allowlist"]).optional()
	}).optional(),
	canvasHost: LegacyCanvasHostSchema,
	surfaces: zod.z.record(zod.z.string(), zod.z.strictObject({ silentReply: SilentReplyPolicyConfigSchema.optional() })).optional(),
	proxy: ProxyConfigSchema
}).superRefine((cfg, ctx) => {
	const agents = cfg.agents?.list ?? [];
	if (agents.length === 0) return;
	const agentIds = new Set(agents.map((agent) => agent.id));
	const effectiveAgentIds = new Set(agents.map((agent) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agent.id)));
	const bindings = cfg.bindings;
	if (Array.isArray(bindings)) for (let idx = 0; idx < bindings.length; idx += 1) {
		const binding = bindings[idx];
		if (!binding || typeof binding !== "object") continue;
		const agentId = binding.agentId;
		if (typeof agentId === "string" && !effectiveAgentIds.has((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId))) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [
				"bindings",
				idx,
				"agentId"
			],
			message: `Unknown agent id "${agentId}" (not in agents.list).`
		});
	}
	const broadcast = cfg.broadcast;
	if (!broadcast) return;
	for (const [peerId, ids] of Object.entries(broadcast)) {
		if (peerId === "strategy") continue;
		if (!Array.isArray(ids)) continue;
		for (const [idx, agentId] of ids.entries()) if (!agentIds.has(agentId)) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [
				"broadcast",
				peerId,
				idx
			],
			message: `Unknown agent id "${agentId}" (not in agents.list).`
		});
	}
});
//#endregion
Object.defineProperty(exports, "OperatorSchema", {
	enumerable: true,
	get: function() {
		return OperatorSchema;
	}
});
Object.defineProperty(exports, "parseByteSize", {
	enumerable: true,
	get: function() {
		return parseByteSize;
	}
});
Object.defineProperty(exports, "parseNonNegativeByteSize", {
	enumerable: true,
	get: function() {
		return parseNonNegativeByteSize;
	}
});
Object.defineProperty(exports, "validateCloudWorkerProfileSettings", {
	enumerable: true,
	get: function() {
		return validateCloudWorkerProfileSettings;
	}
});
