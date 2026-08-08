const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_exec_safety = require("./exec-safety-BaXScHTe.cjs");
const require_ref_contract = require("./ref-contract-C41UJe85.cjs");
const require_types_models = require("./types.models-BeIsgDJM.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let zod = require("zod");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/config/zod-schema.allowdeny.ts
const AllowDenyActionSchema = zod.z.union([zod.z.literal("allow"), zod.z.literal("deny")]);
const AllowDenyChatTypeSchema = zod.z.union([
	zod.z.literal("direct"),
	zod.z.literal("group"),
	zod.z.literal("channel"),
	zod.z.literal("dm")
]).optional();
function createAllowDenyChannelRulesSchema() {
	return zod.z.object({
		default: AllowDenyActionSchema.optional(),
		rules: zod.z.array(zod.z.object({
			action: AllowDenyActionSchema,
			match: zod.z.object({
				channel: zod.z.string().optional(),
				chatType: AllowDenyChatTypeSchema,
				keyPrefix: zod.z.string().optional(),
				rawKeyPrefix: zod.z.string().optional()
			}).strict().optional()
		}).strict()).optional()
	}).strict().optional();
}
//#endregion
//#region src/config/zod-schema.sensitive.ts
const sensitive = zod.z.registry();
//#endregion
//#region src/config/zod-schema.core.ts
const ENV_SECRET_REF_ID_PATTERN = /^[A-Z][A-Z0-9_]{0,127}$/;
const SECRET_PROVIDER_ALIAS_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const WINDOWS_ABS_PATH_PATTERN = /^[A-Za-z]:[\\/]/;
const WINDOWS_UNC_PATH_PATTERN = /^\\\\[^\\]+\\[^\\]+/;
function isAbsolutePath(value) {
	return node_path.default.isAbsolute(value) || WINDOWS_ABS_PATH_PATTERN.test(value) || WINDOWS_UNC_PATH_PATTERN.test(value);
}
const EnvSecretRefSchema = zod.z.object({
	source: zod.z.literal("env"),
	provider: zod.z.string().regex(SECRET_PROVIDER_ALIAS_PATTERN, "Secret reference provider must match /^[a-z][a-z0-9_-]{0,63}$/ (example: \"default\")."),
	id: zod.z.string().regex(ENV_SECRET_REF_ID_PATTERN, "Env secret reference id must match /^[A-Z][A-Z0-9_]{0,127}$/ (example: \"OPENAI_API_KEY\").")
}).strict();
const FileSecretRefSchema = zod.z.object({
	source: zod.z.literal("file"),
	provider: zod.z.string().regex(SECRET_PROVIDER_ALIAS_PATTERN, "Secret reference provider must match /^[a-z][a-z0-9_-]{0,63}$/ (example: \"default\")."),
	id: zod.z.string().refine(require_ref_contract.isValidFileSecretRefId, "File secret reference id must be an absolute JSON pointer (example: \"/providers/openai/apiKey\"), or \"value\" for singleValue mode.")
}).strict();
const ExecSecretRefSchema = zod.z.object({
	source: zod.z.literal("exec"),
	provider: zod.z.string().regex(SECRET_PROVIDER_ALIAS_PATTERN, "Secret reference provider must match /^[a-z][a-z0-9_-]{0,63}$/ (example: \"default\")."),
	id: zod.z.string().refine(require_ref_contract.isValidExecSecretRefId, require_ref_contract.formatExecSecretRefIdValidationMessage())
}).strict();
/** Config-level secret reference schema shared by model/provider/plugin credential fields. */
const SecretRefSchema = zod.z.discriminatedUnion("source", [
	EnvSecretRefSchema,
	FileSecretRefSchema,
	ExecSecretRefSchema
]);
/** Accepts either legacy inline secret strings or structured secret references. */
const SecretInputSchema = zod.z.union([zod.z.string(), SecretRefSchema]);
const SecretsEnvProviderSchema = zod.z.object({
	source: zod.z.literal("env"),
	allowlist: zod.z.array(zod.z.string().regex(ENV_SECRET_REF_ID_PATTERN)).max(256).optional()
}).strict();
const SecretsFileProviderSchema = zod.z.object({
	source: zod.z.literal("file"),
	path: zod.z.string().min(1),
	mode: zod.z.union([zod.z.literal("singleValue"), zod.z.literal("json")]).optional(),
	timeoutMs: zod.z.number().int().positive().max(12e4).optional(),
	maxBytes: zod.z.number().int().positive().max(20 * 1024 * 1024).optional(),
	allowInsecurePath: zod.z.boolean().optional()
}).strict();
const SecretsManualExecProviderSchema = zod.z.object({
	source: zod.z.literal("exec"),
	command: zod.z.string().min(1).refine((value) => require_exec_safety.isSafeExecutableValue(value), "secrets.providers.*.command is unsafe.").refine((value) => isAbsolutePath(value), "secrets.providers.*.command must be an absolute path."),
	args: zod.z.array(zod.z.string().max(1024)).max(128).optional(),
	timeoutMs: zod.z.number().int().positive().max(12e4).optional(),
	noOutputTimeoutMs: zod.z.number().int().positive().max(12e4).optional(),
	maxOutputBytes: zod.z.number().int().positive().max(20 * 1024 * 1024).optional(),
	jsonOnly: zod.z.boolean().optional(),
	env: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	passEnv: zod.z.array(zod.z.string().regex(ENV_SECRET_REF_ID_PATTERN)).max(128).optional(),
	trustedDirs: zod.z.array(zod.z.string().min(1).refine((value) => isAbsolutePath(value), "trustedDirs entries must be absolute paths.")).max(64).optional(),
	allowInsecurePath: zod.z.boolean().optional(),
	allowSymlinkCommand: zod.z.boolean().optional()
}).strict();
const SecretsPluginIntegrationExecProviderSchema = zod.z.object({
	source: zod.z.literal("exec"),
	pluginIntegration: zod.z.object({
		pluginId: zod.z.string().min(1).max(128),
		integrationId: zod.z.string().min(1).max(128)
	}).strict()
}).strict();
const SecretsExecProviderSchema = zod.z.union([SecretsManualExecProviderSchema, SecretsPluginIntegrationExecProviderSchema]);
/** Schema for one configured env/file/exec secret provider entry. */
const SecretProviderSchema = zod.z.union([
	SecretsEnvProviderSchema,
	SecretsFileProviderSchema,
	SecretsExecProviderSchema
]);
/** Schema for the top-level `secrets` config block. */
const SecretsConfigSchema = zod.z.object({
	providers: zod.z.object({}).catchall(SecretProviderSchema).optional(),
	defaults: zod.z.object({
		env: zod.z.string().regex(SECRET_PROVIDER_ALIAS_PATTERN).optional(),
		file: zod.z.string().regex(SECRET_PROVIDER_ALIAS_PATTERN).optional(),
		exec: zod.z.string().regex(SECRET_PROVIDER_ALIAS_PATTERN).optional()
	}).strict().optional(),
	resolution: zod.z.object({
		maxProviderConcurrency: zod.z.number().int().positive().max(16).optional(),
		maxRefsPerProvider: zod.z.number().int().positive().max(4096).optional(),
		maxBatchBytes: zod.z.number().int().positive().max(5 * 1024 * 1024).optional()
	}).strict().optional()
}).strict().optional();
const LEGACY_OPENAI_CODEX_RESPONSES_API = "openai-codex-responses";
const OPENAI_CHATGPT_RESPONSES_API = "openai-chatgpt-responses";
const ModelApiSchema = zod.z.enum(require_types_models.MODEL_APIS, { error: (issue) => issue.input === LEGACY_OPENAI_CODEX_RESPONSES_API ? `"${LEGACY_OPENAI_CODEX_RESPONSES_API}" is a removed api id; use "${OPENAI_CHATGPT_RESPONSES_API}"` : void 0 });
const ModelCompatSchema = zod.z.object({
	supportsStore: zod.z.boolean().optional(),
	supportsPromptCacheKey: zod.z.boolean().optional(),
	supportsDeveloperRole: zod.z.boolean().optional(),
	supportsReasoningEffort: zod.z.boolean().optional(),
	supportsTemperature: zod.z.boolean().optional(),
	supportsUsageInStreaming: zod.z.boolean().optional(),
	supportsTools: zod.z.boolean().optional(),
	supportsStrictMode: zod.z.boolean().optional(),
	requiresStringContent: zod.z.boolean().optional(),
	strictMessageKeys: zod.z.boolean().optional(),
	visibleReasoningDetailTypes: zod.z.array(zod.z.string().min(1)).optional(),
	supportedReasoningEfforts: zod.z.array(zod.z.string().min(1)).optional(),
	reasoningEffortMap: zod.z.record(zod.z.string().min(1), zod.z.string().min(1)).optional(),
	maxTokensField: zod.z.union([zod.z.literal("max_completion_tokens"), zod.z.literal("max_tokens")]).optional(),
	thinkingFormat: zod.z.enum(require_types_models.MODEL_THINKING_FORMATS).optional(),
	requiresToolResultName: zod.z.boolean().optional(),
	requiresAssistantAfterToolResult: zod.z.boolean().optional(),
	requiresThinkingAsText: zod.z.boolean().optional(),
	requiresReasoningContentOnAssistantMessages: zod.z.boolean().optional(),
	toolSchemaProfile: zod.z.string().optional(),
	unsupportedToolSchemaKeywords: zod.z.array(zod.z.string().min(1)).optional(),
	nativeWebSearchTool: zod.z.boolean().optional(),
	toolCallArgumentsEncoding: zod.z.string().optional(),
	requiresMistralToolIds: zod.z.boolean().optional(),
	requiresOpenAiAnthropicToolPayload: zod.z.boolean().optional()
}).strict().optional();
const ConfiguredProviderRequestTlsSchema = zod.z.object({
	ca: SecretInputSchema.optional().register(sensitive),
	cert: SecretInputSchema.optional().register(sensitive),
	key: SecretInputSchema.optional().register(sensitive),
	passphrase: SecretInputSchema.optional().register(sensitive),
	serverName: zod.z.string().optional(),
	insecureSkipVerify: zod.z.boolean().optional()
}).strict().optional();
const ConfiguredProviderRequestAuthSchema = zod.z.union([
	zod.z.object({ mode: zod.z.literal("provider-default") }).strict(),
	zod.z.object({
		mode: zod.z.literal("authorization-bearer"),
		token: SecretInputSchema.register(sensitive)
	}).strict(),
	zod.z.object({
		mode: zod.z.literal("header"),
		headerName: zod.z.string().min(1),
		value: SecretInputSchema.register(sensitive),
		prefix: zod.z.string().optional()
	}).strict()
]).optional();
const ConfiguredProviderRequestProxySchema = zod.z.union([zod.z.object({
	mode: zod.z.literal("env-proxy"),
	tls: ConfiguredProviderRequestTlsSchema
}).strict(), zod.z.object({
	mode: zod.z.literal("explicit-proxy"),
	url: zod.z.string().min(1),
	tls: ConfiguredProviderRequestTlsSchema
}).strict()]).optional();
const ConfiguredProviderRequestFields = {
	headers: zod.z.record(zod.z.string(), SecretInputSchema.register(sensitive)).optional(),
	auth: ConfiguredProviderRequestAuthSchema,
	proxy: ConfiguredProviderRequestProxySchema,
	tls: ConfiguredProviderRequestTlsSchema
};
const ConfiguredProviderRequestSchema = zod.z.object(ConfiguredProviderRequestFields).strict().optional();
const ConfiguredModelProviderRequestSchema = zod.z.object({
	...ConfiguredProviderRequestFields,
	allowPrivateNetwork: zod.z.boolean().optional()
}).strict().optional();
const ModelAgentRuntimePolicySchema = zod.z.object({ id: zod.z.string().optional() }).strict().optional();
const ModelImageInputSchema = zod.z.object({
	maxBytes: zod.z.number().int().positive().optional(),
	maxPixels: zod.z.number().int().positive().optional(),
	maxSidePx: zod.z.number().int().positive().optional(),
	preferredSidePx: zod.z.number().int().positive().optional(),
	tokenMode: zod.z.union([
		zod.z.literal("tile"),
		zod.z.literal("detail"),
		zod.z.literal("provider")
	]).optional()
}).strict();
const ModelMediaInputSchema = zod.z.object({ image: ModelImageInputSchema.optional() }).strict();
const ThinkingLevelMapValueSchema = zod.z.string().nullable();
const ThinkingLevelMapSchema = zod.z.object({
	off: ThinkingLevelMapValueSchema.optional(),
	minimal: ThinkingLevelMapValueSchema.optional(),
	low: ThinkingLevelMapValueSchema.optional(),
	medium: ThinkingLevelMapValueSchema.optional(),
	high: ThinkingLevelMapValueSchema.optional(),
	xhigh: ThinkingLevelMapValueSchema.optional(),
	max: ThinkingLevelMapValueSchema.optional()
}).strict();
const ModelDefinitionSchema = zod.z.object({
	id: zod.z.string().min(1),
	name: zod.z.string().min(1),
	api: ModelApiSchema.optional(),
	baseUrl: zod.z.string().min(1).optional(),
	reasoning: zod.z.boolean().optional(),
	input: zod.z.array(zod.z.union([
		zod.z.literal("text"),
		zod.z.literal("image"),
		zod.z.literal("video"),
		zod.z.literal("audio")
	])).optional(),
	cost: zod.z.object({
		input: zod.z.number().optional(),
		output: zod.z.number().optional(),
		cacheRead: zod.z.number().optional(),
		cacheWrite: zod.z.number().optional(),
		tieredPricing: zod.z.array(zod.z.object({
			input: zod.z.number(),
			output: zod.z.number(),
			cacheRead: zod.z.number(),
			cacheWrite: zod.z.number(),
			range: zod.z.union([zod.z.tuple([zod.z.number(), zod.z.number()]), zod.z.tuple([zod.z.number()])])
		}).strict()).optional()
	}).strict().optional(),
	contextWindow: zod.z.number().positive().optional(),
	contextTokens: zod.z.number().int().positive().optional(),
	maxTokens: zod.z.number().positive().optional(),
	thinkingLevelMap: ThinkingLevelMapSchema.optional(),
	params: zod.z.record(zod.z.string(), zod.z.unknown()).optional(),
	agentRuntime: ModelAgentRuntimePolicySchema,
	headers: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	compat: ModelCompatSchema,
	mediaInput: ModelMediaInputSchema.optional(),
	metadataSource: zod.z.literal("models-add").optional()
}).strict();
const ModelProviderLocalServiceSchema = zod.z.object({
	command: zod.z.string().min(1),
	args: zod.z.array(zod.z.string()).optional(),
	cwd: zod.z.string().min(1).optional(),
	env: zod.z.record(zod.z.string(), zod.z.string().register(sensitive)).optional(),
	healthUrl: zod.z.string().min(1).optional(),
	readyTimeoutMs: zod.z.number().int().positive().optional(),
	idleStopMs: zod.z.number().int().nonnegative().optional()
}).strict().optional();
const BUILT_IN_MODEL_PROVIDER_OVERLAY_IDS = /* @__PURE__ */ new Set([
	"amazon-bedrock",
	"amazon-bedrock-mantle",
	"anthropic",
	"anthropic-vertex",
	"arcee",
	"azure-openai-responses",
	"byteplus",
	"byteplus-plan",
	"cerebras",
	"chutes",
	"claude-cli",
	"clawrouter",
	"cloudflare-ai-gateway",
	"codex",
	"comfy",
	"copilot-proxy",
	"dashscope",
	"deepinfra",
	"deepseek",
	"fal",
	"fireworks",
	"github-copilot",
	"gmi",
	"gmi-cloud",
	"gmicloud",
	"google",
	"google-antigravity",
	"google-gemini-cli",
	"google-vertex",
	"groq",
	"huggingface",
	"kilocode",
	"kimi",
	"kimi-coding",
	"litellm",
	"lmstudio",
	"meta",
	"microsoft-foundry",
	"minimax",
	"minimax-portal",
	"mistral",
	"modelstudio",
	"moonshot",
	"moonshot-ai",
	"moonshotai",
	"nvidia",
	"novita",
	"novita-ai",
	"novitaai",
	"ollama",
	"ollama-cloud",
	"openai",
	"opencode",
	"opencode-go",
	"openrouter",
	"qianfan",
	"qwen",
	"qwen-cli",
	"qwen-oauth",
	"qwen-portal",
	"qwen-token-plan",
	"qwencloud",
	"sglang",
	"stepfun",
	"stepfun-plan",
	"synthetic",
	"tencent-tokenhub",
	"tencent-tokenplan",
	"together",
	"venice",
	"vercel-ai-gateway",
	"vllm",
	"volcengine",
	"volcengine-plan",
	"vydra",
	"x-ai",
	"xai",
	"xiaomi",
	"xiaomi-token-plan",
	"z.ai",
	"z-ai",
	"zai"
]);
function isBuiltInModelProviderOverlayId(providerId) {
	return BUILT_IN_MODEL_PROVIDER_OVERLAY_IDS.has((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId));
}
const ModelProviderSchema = zod.z.object({
	baseUrl: zod.z.string().min(1).optional(),
	apiKey: SecretInputSchema.optional().register(sensitive),
	auth: zod.z.union([
		zod.z.literal("api-key"),
		zod.z.literal("aws-sdk"),
		zod.z.literal("oauth"),
		zod.z.literal("token")
	]).optional(),
	api: ModelApiSchema.optional(),
	contextWindow: zod.z.number().positive().optional(),
	contextTokens: zod.z.number().int().positive().optional(),
	maxTokens: zod.z.number().positive().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	region: zod.z.string().min(1).optional(),
	injectNumCtxForOpenAICompat: zod.z.boolean().optional(),
	params: zod.z.record(zod.z.string(), zod.z.unknown()).optional(),
	agentRuntime: ModelAgentRuntimePolicySchema,
	localService: ModelProviderLocalServiceSchema,
	headers: zod.z.record(zod.z.string(), SecretInputSchema.register(sensitive)).optional(),
	authHeader: zod.z.boolean().optional(),
	request: ConfiguredModelProviderRequestSchema,
	models: zod.z.array(ModelDefinitionSchema).optional()
}).strict();
const ModelProvidersSchema = zod.z.record(zod.z.string(), ModelProviderSchema).superRefine((providers, ctx) => {
	for (const [providerId, provider] of Object.entries(providers)) {
		if (isBuiltInModelProviderOverlayId(providerId)) continue;
		if (!provider.baseUrl) ctx.addIssue({
			code: "custom",
			path: [providerId, "baseUrl"],
			message: "custom model providers must declare baseUrl; provider overlays without baseUrl are only supported for bundled providers"
		});
		if (!Array.isArray(provider.models)) ctx.addIssue({
			code: "custom",
			path: [providerId, "models"],
			message: "custom model providers must declare models; provider overlays without models are only supported for bundled providers"
		});
	}
});
const ModelPricingConfigSchema = zod.z.object({ enabled: zod.z.boolean().optional() }).strict().optional();
const ModelsConfigSchema = zod.z.object({
	mode: zod.z.union([zod.z.literal("merge"), zod.z.literal("replace")]).optional(),
	providers: ModelProvidersSchema.optional(),
	pricing: ModelPricingConfigSchema
}).strict().optional();
const VisibleRepliesValueSchema = zod.z.enum(["automatic", "message_tool"]);
const AmbientGroupInboundSchema = zod.z.enum(["user_request", "room_event"]);
const VisibleRepliesSchema = zod.z.union([VisibleRepliesValueSchema, zod.z.boolean()]).overwrite((value) => {
	if (value === true) return "automatic";
	if (value === false) return "message_tool";
	return value;
});
const MentionPatternsModeSchema = zod.z.union([zod.z.literal("allow"), zod.z.literal("deny")]);
const MentionPatternsPolicySchema = zod.z.object({
	mode: MentionPatternsModeSchema.optional(),
	allowIn: zod.z.array(zod.z.string()).optional(),
	denyIn: zod.z.array(zod.z.string()).optional()
}).strict();
const GroupChatSchema = zod.z.object({
	mentionPatterns: zod.z.array(zod.z.string()).optional(),
	historyLimit: zod.z.number().int().positive().optional(),
	unmentionedInbound: AmbientGroupInboundSchema.optional(),
	visibleReplies: VisibleRepliesSchema.optional()
}).strict().optional();
const DmConfigSchema = zod.z.object({ historyLimit: zod.z.number().int().min(0).optional() }).strict();
const IdentitySchema = zod.z.object({
	name: zod.z.string().optional(),
	theme: zod.z.string().optional(),
	emoji: zod.z.string().optional(),
	avatar: zod.z.string().optional()
}).strict().optional();
const QueueModeSchema = zod.z.union([
	zod.z.literal("steer"),
	zod.z.literal("followup"),
	zod.z.literal("collect"),
	zod.z.literal("interrupt")
]);
const QueueDropSchema = zod.z.union([
	zod.z.literal("old"),
	zod.z.literal("new"),
	zod.z.literal("summarize")
]);
const ReplyToModeSchema = zod.z.union([
	zod.z.literal("off"),
	zod.z.literal("first"),
	zod.z.literal("all"),
	zod.z.literal("batched")
]);
const TypingModeSchema = zod.z.union([
	zod.z.literal("never"),
	zod.z.literal("instant"),
	zod.z.literal("thinking"),
	zod.z.literal("message")
]);
const GroupPolicySchema = zod.z.enum([
	"open",
	"disabled",
	"allowlist"
]);
const DmPolicySchema = zod.z.enum([
	"pairing",
	"allowlist",
	"open",
	"disabled"
]);
const ContextVisibilityModeSchema = zod.z.enum([
	"all",
	"allowlist",
	"allowlist_quote"
]);
const BlockStreamingCoalesceSchema = zod.z.object({
	minChars: zod.z.number().int().positive().optional(),
	maxChars: zod.z.number().int().positive().optional(),
	idleMs: zod.z.number().int().nonnegative().optional()
}).strict();
const TextChunkModeSchema = zod.z.enum(["length", "newline"]);
const ChannelStreamingBlockSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	coalesce: BlockStreamingCoalesceSchema.optional()
}).strict();
/** Delivery-only nested streaming config for channels without preview modes. */
const ChannelDeliveryStreamingConfigSchema = zod.z.object({
	chunkMode: TextChunkModeSchema.optional(),
	block: ChannelStreamingBlockSchema.optional()
}).strict();
zod.z.number().int().min(0).optional(), zod.z.number().int().min(0).optional(), ContextVisibilityModeSchema.optional(), zod.z.record(zod.z.string(), DmConfigSchema.optional()).optional(), zod.z.number().int().positive().optional(), ChannelDeliveryStreamingConfigSchema.optional(), zod.z.string().optional(), zod.z.number().positive().optional();
const BlockStreamingChunkSchema = zod.z.object({
	minChars: zod.z.number().int().positive().optional(),
	maxChars: zod.z.number().int().positive().optional(),
	breakPreference: zod.z.union([
		zod.z.literal("paragraph"),
		zod.z.literal("newline"),
		zod.z.literal("sentence")
	]).optional()
}).strict();
const MarkdownTableModeSchema = zod.z.enum([
	"off",
	"bullets",
	"code",
	"block"
]);
const MarkdownConfigSchema = zod.z.object({ tables: MarkdownTableModeSchema.optional() }).strict().optional();
const TtsProviderSchema = zod.z.string().min(1);
const TtsModeSchema = zod.z.enum(["final", "all"]);
const TtsAutoSchema = zod.z.enum([
	"off",
	"always",
	"inbound",
	"tagged"
]);
const TtsProviderConfigSchema = zod.z.object({ apiKey: SecretInputSchema.optional().register(sensitive) }).catchall(zod.z.union([
	zod.z.string(),
	zod.z.number(),
	zod.z.boolean(),
	zod.z.null(),
	zod.z.array(zod.z.unknown()),
	zod.z.record(zod.z.string(), zod.z.unknown())
]));
const TtsPersonaPromptSchema = zod.z.object({
	profile: zod.z.string().optional(),
	scene: zod.z.string().optional(),
	sampleContext: zod.z.string().optional(),
	style: zod.z.string().optional(),
	accent: zod.z.string().optional(),
	pacing: zod.z.string().optional(),
	constraints: zod.z.array(zod.z.string()).optional()
}).strict();
const TtsPersonaSchema = zod.z.object({
	label: zod.z.string().optional(),
	description: zod.z.string().optional(),
	provider: TtsProviderSchema.optional(),
	fallbackPolicy: zod.z.union([
		zod.z.literal("preserve-persona"),
		zod.z.literal("provider-defaults"),
		zod.z.literal("fail")
	]).optional(),
	prompt: TtsPersonaPromptSchema.optional(),
	providers: zod.z.record(zod.z.string(), TtsProviderConfigSchema).optional()
}).strict();
const TtsConfigSchema = zod.z.object({
	auto: TtsAutoSchema.optional(),
	enabled: zod.z.boolean().optional(),
	mode: TtsModeSchema.optional(),
	provider: TtsProviderSchema.optional(),
	persona: zod.z.string().optional(),
	personas: zod.z.record(zod.z.string(), TtsPersonaSchema).optional(),
	summaryModel: zod.z.string().optional(),
	modelOverrides: zod.z.object({
		enabled: zod.z.boolean().optional(),
		allowText: zod.z.boolean().optional(),
		allowProvider: zod.z.boolean().optional(),
		allowVoice: zod.z.boolean().optional(),
		allowModelId: zod.z.boolean().optional(),
		allowVoiceSettings: zod.z.boolean().optional(),
		allowNormalization: zod.z.boolean().optional(),
		allowSeed: zod.z.boolean().optional()
	}).strict().optional(),
	providers: zod.z.record(zod.z.string(), TtsProviderConfigSchema).optional(),
	prefsPath: zod.z.string().optional(),
	maxTextLength: zod.z.number().int().min(1).optional(),
	timeoutMs: zod.z.number().int().min(1e3).max(12e4).optional()
}).strict().optional();
const HumanDelaySchema = zod.z.object({
	mode: zod.z.union([
		zod.z.literal("off"),
		zod.z.literal("natural"),
		zod.z.literal("custom")
	]).optional(),
	minMs: zod.z.number().int().nonnegative().optional(),
	maxMs: zod.z.number().int().nonnegative().optional()
}).strict();
const CliBackendWatchdogModeSchema = zod.z.object({
	noOutputTimeoutMs: zod.z.number().int().min(1e3).optional(),
	noOutputTimeoutRatio: zod.z.number().min(.05).max(.95).optional(),
	minMs: zod.z.number().int().min(1e3).optional(),
	maxMs: zod.z.number().int().min(1e3).optional()
}).strict().optional();
const CliBackendOutputLimitsSchema = zod.z.object({
	maxTurnRawChars: zod.z.number().int().min(1024).max(64 * 1024 * 1024).optional(),
	maxTurnLines: zod.z.number().int().min(100).max(1e5).optional()
}).strict().optional();
const CliBackendSchema = zod.z.object({
	command: zod.z.string(),
	args: zod.z.array(zod.z.string()).optional(),
	output: zod.z.union([
		zod.z.literal("json"),
		zod.z.literal("text"),
		zod.z.literal("jsonl")
	]).optional(),
	resumeOutput: zod.z.union([
		zod.z.literal("json"),
		zod.z.literal("text"),
		zod.z.literal("jsonl")
	]).optional(),
	jsonlDialect: zod.z.union([zod.z.literal("claude-stream-json"), zod.z.literal("gemini-stream-json")]).optional(),
	liveSession: zod.z.literal("claude-stdio").optional(),
	input: zod.z.union([zod.z.literal("arg"), zod.z.literal("stdin")]).optional(),
	maxPromptArgChars: zod.z.number().int().positive().optional(),
	env: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	clearEnv: zod.z.array(zod.z.string()).optional(),
	modelArg: zod.z.string().optional(),
	modelAliases: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	sessionArg: zod.z.string().optional(),
	sessionArgs: zod.z.array(zod.z.string()).optional(),
	resumeArgs: zod.z.array(zod.z.string()).optional(),
	forkArg: zod.z.string().optional(),
	sessionMode: zod.z.union([
		zod.z.literal("always"),
		zod.z.literal("existing"),
		zod.z.literal("none")
	]).optional(),
	sessionIdFields: zod.z.array(zod.z.string()).optional(),
	systemPromptArg: zod.z.string().optional(),
	systemPromptFileArg: zod.z.string().optional(),
	systemPromptFileConfigArg: zod.z.string().optional(),
	systemPromptFileConfigKey: zod.z.string().optional(),
	systemPromptMode: zod.z.union([zod.z.literal("append"), zod.z.literal("replace")]).optional(),
	systemPromptWhen: zod.z.union([
		zod.z.literal("first"),
		zod.z.literal("always"),
		zod.z.literal("never")
	]).optional(),
	imageArg: zod.z.string().optional(),
	imageMode: zod.z.union([zod.z.literal("repeat"), zod.z.literal("list")]).optional(),
	imagePathScope: zod.z.union([zod.z.literal("temp"), zod.z.literal("workspace")]).optional(),
	serialize: zod.z.boolean().optional(),
	reseedFromRawTranscriptWhenUncompacted: zod.z.boolean().optional(),
	reliability: zod.z.object({
		outputLimits: CliBackendOutputLimitsSchema,
		watchdog: zod.z.object({
			fresh: CliBackendWatchdogModeSchema,
			resume: CliBackendWatchdogModeSchema
		}).strict().optional()
	}).strict().optional()
}).strict();
const normalizeAllowFrom = (values) => (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(values);
/**
* Canonical cross-field check for dmPolicy vs allowFrom. This is the single
* source of truth shared by the Zod schema refinements and the CLI config
* validator so the rule cannot drift between the two surfaces.
*/
const evaluateDmPolicyAllowFromDependency = (params) => {
	const allow = normalizeAllowFrom(params.allowFrom);
	if (params.policy === "open" && !allow.includes("*")) return "open_requires_wildcard";
	if (params.policy === "allowlist" && allow.length === 0) return "allowlist_requires_entries";
	return null;
};
const requireOpenAllowFrom = (params) => {
	if (evaluateDmPolicyAllowFromDependency({
		policy: params.policy,
		allowFrom: params.allowFrom
	}) !== "open_requires_wildcard") return;
	params.ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: params.path,
		message: params.message
	});
};
/**
* Validate that dmPolicy="allowlist" has a non-empty allowFrom array.
* Without this, all DMs are silently dropped because the allowlist is empty
* and no senders can match.
*/
const requireAllowlistAllowFrom = (params) => {
	if (evaluateDmPolicyAllowFromDependency({
		policy: params.policy,
		allowFrom: params.allowFrom
	}) !== "allowlist_requires_entries") return;
	params.ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: params.path,
		message: params.message
	});
};
const MSTeamsReplyStyleSchema = zod.z.enum(["thread", "top-level"]);
const RetryConfigSchema = zod.z.object({
	attempts: zod.z.number().int().min(1).optional(),
	minDelayMs: zod.z.number().int().min(0).optional(),
	maxDelayMs: zod.z.number().int().min(0).optional(),
	jitter: zod.z.number().min(0).max(1).optional()
}).strict().optional();
const QueueModeBySurfaceSchema = zod.z.object({
	whatsapp: QueueModeSchema.optional(),
	telegram: QueueModeSchema.optional(),
	discord: QueueModeSchema.optional(),
	irc: QueueModeSchema.optional(),
	googlechat: QueueModeSchema.optional(),
	slack: QueueModeSchema.optional(),
	mattermost: QueueModeSchema.optional(),
	signal: QueueModeSchema.optional(),
	imessage: QueueModeSchema.optional(),
	msteams: QueueModeSchema.optional(),
	webchat: QueueModeSchema.optional(),
	matrix: QueueModeSchema.optional()
}).strict().optional();
const DebounceMsBySurfaceSchema = zod.z.record(zod.z.string(), zod.z.number().int().nonnegative()).optional();
const QueueSchema = zod.z.object({
	mode: QueueModeSchema.optional(),
	byChannel: QueueModeBySurfaceSchema,
	debounceMs: zod.z.number().int().nonnegative().optional(),
	debounceMsByChannel: DebounceMsBySurfaceSchema,
	cap: zod.z.number().int().positive().optional(),
	drop: QueueDropSchema.optional()
}).strict().optional();
const InboundDebounceSchema = zod.z.object({
	debounceMs: zod.z.number().int().nonnegative().optional(),
	byChannel: DebounceMsBySurfaceSchema
}).strict().optional();
const TranscribeAudioSchema = zod.z.object({
	command: zod.z.array(zod.z.string()).superRefine((value, ctx) => {
		const executable = value[0];
		if (!require_exec_safety.isSafeExecutableValue(executable)) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [0],
			message: "expected safe executable name or path"
		});
	}),
	timeoutSeconds: zod.z.number().int().positive().optional()
}).strict().optional();
const HexColorSchema = zod.z.string().regex(/^#?[0-9a-fA-F]{6}$/, "expected hex color (RRGGBB)");
const ExecutableTokenSchema = zod.z.string().refine(require_exec_safety.isSafeExecutableValue, "expected safe executable name or path");
const MediaUnderstandingScopeSchema = createAllowDenyChannelRulesSchema();
const MediaUnderstandingCapabilitiesSchema = zod.z.array(zod.z.union([
	zod.z.literal("image"),
	zod.z.literal("audio"),
	zod.z.literal("video")
])).optional();
const MediaUnderstandingAttachmentsSchema = zod.z.object({
	mode: zod.z.union([zod.z.literal("first"), zod.z.literal("all")]).optional(),
	maxAttachments: zod.z.number().int().positive().optional(),
	prefer: zod.z.union([
		zod.z.literal("first"),
		zod.z.literal("last"),
		zod.z.literal("path"),
		zod.z.literal("url")
	]).optional()
}).strict().optional();
const DeepgramAudioSchema = zod.z.object({
	detectLanguage: zod.z.boolean().optional(),
	punctuate: zod.z.boolean().optional(),
	smartFormat: zod.z.boolean().optional()
}).strict().optional();
const ProviderOptionValueSchema = zod.z.union([
	zod.z.string(),
	zod.z.number(),
	zod.z.boolean()
]);
const ProviderOptionsSchema = zod.z.record(zod.z.string(), zod.z.record(zod.z.string(), ProviderOptionValueSchema)).optional();
const MediaUnderstandingRuntimeFields = {
	prompt: zod.z.string().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	language: zod.z.string().optional(),
	providerOptions: ProviderOptionsSchema,
	deepgram: DeepgramAudioSchema,
	baseUrl: zod.z.string().optional(),
	headers: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	request: ConfiguredProviderRequestSchema
};
const MediaUnderstandingModelSchema = zod.z.object({
	provider: zod.z.string().optional(),
	model: zod.z.string().optional(),
	capabilities: MediaUnderstandingCapabilitiesSchema,
	type: zod.z.union([zod.z.literal("provider"), zod.z.literal("cli")]).optional(),
	command: zod.z.string().optional(),
	args: zod.z.array(zod.z.string()).optional(),
	maxChars: zod.z.number().int().positive().optional(),
	maxBytes: zod.z.number().int().positive().optional(),
	...MediaUnderstandingRuntimeFields,
	profile: zod.z.string().optional(),
	preferredProfile: zod.z.string().optional()
}).strict().optional();
const ToolsMediaUnderstandingSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	scope: MediaUnderstandingScopeSchema,
	maxBytes: zod.z.number().int().positive().optional(),
	maxChars: zod.z.number().int().positive().optional(),
	...MediaUnderstandingRuntimeFields,
	attachments: MediaUnderstandingAttachmentsSchema,
	models: zod.z.array(MediaUnderstandingModelSchema).optional(),
	echoTranscript: zod.z.boolean().optional(),
	echoFormat: zod.z.string().optional()
}).strict().optional();
const ToolsMediaSchema = zod.z.object({
	models: zod.z.array(MediaUnderstandingModelSchema).optional(),
	concurrency: zod.z.number().int().positive().optional(),
	asyncCompletion: zod.z.object({ directSend: zod.z.boolean().optional() }).strict().optional(),
	image: ToolsMediaUnderstandingSchema.optional(),
	audio: ToolsMediaUnderstandingSchema.optional(),
	video: ToolsMediaUnderstandingSchema.optional()
}).strict().optional();
const LinkModelSchema = zod.z.object({
	type: zod.z.literal("cli").optional(),
	command: zod.z.string().min(1),
	args: zod.z.array(zod.z.string()).optional(),
	timeoutSeconds: zod.z.number().int().positive().optional()
}).strict();
const ToolsLinksSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	scope: MediaUnderstandingScopeSchema,
	maxLinks: zod.z.number().int().positive().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	models: zod.z.array(LinkModelSchema).optional()
}).strict().optional();
const NativeCommandsSettingSchema = zod.z.union([zod.z.boolean(), zod.z.literal("auto")]);
const ProviderCommandsSchema = zod.z.object({
	native: NativeCommandsSettingSchema.optional(),
	nativeSkills: NativeCommandsSettingSchema.optional()
}).strict().optional();
//#endregion
Object.defineProperty(exports, "BlockStreamingChunkSchema", {
	enumerable: true,
	get: function() {
		return BlockStreamingChunkSchema;
	}
});
Object.defineProperty(exports, "BlockStreamingCoalesceSchema", {
	enumerable: true,
	get: function() {
		return BlockStreamingCoalesceSchema;
	}
});
Object.defineProperty(exports, "ChannelDeliveryStreamingConfigSchema", {
	enumerable: true,
	get: function() {
		return ChannelDeliveryStreamingConfigSchema;
	}
});
Object.defineProperty(exports, "ChannelStreamingBlockSchema", {
	enumerable: true,
	get: function() {
		return ChannelStreamingBlockSchema;
	}
});
Object.defineProperty(exports, "CliBackendSchema", {
	enumerable: true,
	get: function() {
		return CliBackendSchema;
	}
});
Object.defineProperty(exports, "ContextVisibilityModeSchema", {
	enumerable: true,
	get: function() {
		return ContextVisibilityModeSchema;
	}
});
Object.defineProperty(exports, "DmConfigSchema", {
	enumerable: true,
	get: function() {
		return DmConfigSchema;
	}
});
Object.defineProperty(exports, "DmPolicySchema", {
	enumerable: true,
	get: function() {
		return DmPolicySchema;
	}
});
Object.defineProperty(exports, "ExecutableTokenSchema", {
	enumerable: true,
	get: function() {
		return ExecutableTokenSchema;
	}
});
Object.defineProperty(exports, "GroupChatSchema", {
	enumerable: true,
	get: function() {
		return GroupChatSchema;
	}
});
Object.defineProperty(exports, "GroupPolicySchema", {
	enumerable: true,
	get: function() {
		return GroupPolicySchema;
	}
});
Object.defineProperty(exports, "HexColorSchema", {
	enumerable: true,
	get: function() {
		return HexColorSchema;
	}
});
Object.defineProperty(exports, "HumanDelaySchema", {
	enumerable: true,
	get: function() {
		return HumanDelaySchema;
	}
});
Object.defineProperty(exports, "IdentitySchema", {
	enumerable: true,
	get: function() {
		return IdentitySchema;
	}
});
Object.defineProperty(exports, "InboundDebounceSchema", {
	enumerable: true,
	get: function() {
		return InboundDebounceSchema;
	}
});
Object.defineProperty(exports, "MSTeamsReplyStyleSchema", {
	enumerable: true,
	get: function() {
		return MSTeamsReplyStyleSchema;
	}
});
Object.defineProperty(exports, "MarkdownConfigSchema", {
	enumerable: true,
	get: function() {
		return MarkdownConfigSchema;
	}
});
Object.defineProperty(exports, "MentionPatternsPolicySchema", {
	enumerable: true,
	get: function() {
		return MentionPatternsPolicySchema;
	}
});
Object.defineProperty(exports, "ModelsConfigSchema", {
	enumerable: true,
	get: function() {
		return ModelsConfigSchema;
	}
});
Object.defineProperty(exports, "NativeCommandsSettingSchema", {
	enumerable: true,
	get: function() {
		return NativeCommandsSettingSchema;
	}
});
Object.defineProperty(exports, "ProviderCommandsSchema", {
	enumerable: true,
	get: function() {
		return ProviderCommandsSchema;
	}
});
Object.defineProperty(exports, "QueueSchema", {
	enumerable: true,
	get: function() {
		return QueueSchema;
	}
});
Object.defineProperty(exports, "ReplyToModeSchema", {
	enumerable: true,
	get: function() {
		return ReplyToModeSchema;
	}
});
Object.defineProperty(exports, "RetryConfigSchema", {
	enumerable: true,
	get: function() {
		return RetryConfigSchema;
	}
});
Object.defineProperty(exports, "SecretInputSchema", {
	enumerable: true,
	get: function() {
		return SecretInputSchema;
	}
});
Object.defineProperty(exports, "SecretProviderSchema", {
	enumerable: true,
	get: function() {
		return SecretProviderSchema;
	}
});
Object.defineProperty(exports, "SecretRefSchema", {
	enumerable: true,
	get: function() {
		return SecretRefSchema;
	}
});
Object.defineProperty(exports, "SecretsConfigSchema", {
	enumerable: true,
	get: function() {
		return SecretsConfigSchema;
	}
});
Object.defineProperty(exports, "TextChunkModeSchema", {
	enumerable: true,
	get: function() {
		return TextChunkModeSchema;
	}
});
Object.defineProperty(exports, "ToolsLinksSchema", {
	enumerable: true,
	get: function() {
		return ToolsLinksSchema;
	}
});
Object.defineProperty(exports, "ToolsMediaSchema", {
	enumerable: true,
	get: function() {
		return ToolsMediaSchema;
	}
});
Object.defineProperty(exports, "TranscribeAudioSchema", {
	enumerable: true,
	get: function() {
		return TranscribeAudioSchema;
	}
});
Object.defineProperty(exports, "TtsConfigSchema", {
	enumerable: true,
	get: function() {
		return TtsConfigSchema;
	}
});
Object.defineProperty(exports, "TypingModeSchema", {
	enumerable: true,
	get: function() {
		return TypingModeSchema;
	}
});
Object.defineProperty(exports, "VisibleRepliesSchema", {
	enumerable: true,
	get: function() {
		return VisibleRepliesSchema;
	}
});
Object.defineProperty(exports, "createAllowDenyChannelRulesSchema", {
	enumerable: true,
	get: function() {
		return createAllowDenyChannelRulesSchema;
	}
});
Object.defineProperty(exports, "evaluateDmPolicyAllowFromDependency", {
	enumerable: true,
	get: function() {
		return evaluateDmPolicyAllowFromDependency;
	}
});
Object.defineProperty(exports, "isBuiltInModelProviderOverlayId", {
	enumerable: true,
	get: function() {
		return isBuiltInModelProviderOverlayId;
	}
});
Object.defineProperty(exports, "requireAllowlistAllowFrom", {
	enumerable: true,
	get: function() {
		return requireAllowlistAllowFrom;
	}
});
Object.defineProperty(exports, "requireOpenAllowFrom", {
	enumerable: true,
	get: function() {
		return requireOpenAllowFrom;
	}
});
Object.defineProperty(exports, "sensitive", {
	enumerable: true,
	get: function() {
		return sensitive;
	}
});
