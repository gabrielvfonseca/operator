const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_zod_schema_core = require("./zod-schema.core-B7xBEBon.cjs");
const require_config_schema = require("./config-schema-DHVbD0xQ.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
const require_zod_schema_channels_config = require("./zod-schema.channels-config-DIjSsJKO.cjs");
const require_scp_host = require("./scp-host-CIGWtgvr.cjs");
let zod = require("zod");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_media_core_inbound_path_policy = require("@gabrielvfonseca/media-core/inbound-path-policy");
//#region src/shared/custom-command-config.ts
const DEFAULT_PREFIX = "/";
/** Normalize a slash command name to the internal lowercase underscore form. */
function normalizeSlashCommandName(value) {
	const trimmed = value.trim();
	if (!trimmed) return "";
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed.startsWith(DEFAULT_PREFIX) ? trimmed.slice(1) : trimmed).replace(/-/g, "_");
}
/** Normalize command descriptions without changing user-authored wording. */
function normalizeCommandDescription(value) {
	return value.trim();
}
/** Validate and normalize custom command config entries. */
function resolveCustomCommands(params) {
	const entries = Array.isArray(params.commands) ? params.commands : [];
	const reserved = params.reservedCommands ?? /* @__PURE__ */ new Set();
	const checkReserved = params.checkReserved !== false;
	const checkDuplicates = params.checkDuplicates !== false;
	const seen = /* @__PURE__ */ new Set();
	const resolved = [];
	const issues = [];
	const label = params.config.label;
	const prefix = params.config.prefix ?? DEFAULT_PREFIX;
	for (let index = 0; index < entries.length; index += 1) {
		const entry = entries[index];
		const normalized = normalizeSlashCommandName(entry?.command ?? "");
		if (!normalized) {
			issues.push({
				index,
				field: "command",
				message: `${label} custom command is missing a command name.`
			});
			continue;
		}
		if (!params.config.pattern.test(normalized)) {
			issues.push({
				index,
				field: "command",
				message: `${label} custom command "${prefix}${normalized}" is invalid (${params.config.patternDescription}).`
			});
			continue;
		}
		if (checkReserved && reserved.has(normalized)) {
			issues.push({
				index,
				field: "command",
				message: `${label} custom command "${prefix}${normalized}" conflicts with a native command.`
			});
			continue;
		}
		if (checkDuplicates && seen.has(normalized)) {
			issues.push({
				index,
				field: "command",
				message: `${label} custom command "${prefix}${normalized}" is duplicated.`
			});
			continue;
		}
		const description = normalizeCommandDescription(entry?.description ?? "");
		if (!description) {
			issues.push({
				index,
				field: "description",
				message: `${label} custom command "${prefix}${normalized}" is missing a description.`
			});
			continue;
		}
		if (checkDuplicates) seen.add(normalized);
		resolved.push({
			command: normalized,
			description
		});
	}
	return {
		commands: resolved,
		issues
	};
}
//#endregion
//#region src/config/zod-schema.discord.ts
const DiscordIdSchema = zod.z.union([zod.z.string(), zod.z.number()]).transform((value, ctx) => {
	if (typeof value === "number") {
		if (!Number.isSafeInteger(value) || value < 0) {
			ctx.addIssue({
				code: zod.z.ZodIssueCode.custom,
				message: `Discord ID "${String(value)}" is not a valid non-negative safe integer. Wrap it in quotes in your config file.`
			});
			return zod.z.NEVER;
		}
		return String(value);
	}
	return value;
}).pipe(zod.z.string());
const DiscordIdListSchema = zod.z.array(DiscordIdSchema);
const DiscordSnowflakeStringSchema = zod.z.string().regex(/^\d+$/, "Discord user ID must be numeric");
const DiscordDmSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	policy: require_zod_schema_core.DmPolicySchema.optional(),
	allowFrom: DiscordIdListSchema.optional(),
	groupEnabled: zod.z.boolean().optional(),
	groupChannels: DiscordIdListSchema.optional()
}).strict();
const DiscordPresenceEventsSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	channelId: DiscordSnowflakeStringSchema,
	users: zod.z.array(DiscordSnowflakeStringSchema).optional(),
	reconnectSuppressSeconds: zod.z.number().int().min(0).optional(),
	burstLimit: zod.z.number().int().positive().optional(),
	burstWindowSeconds: zod.z.number().int().positive().optional()
}).strict();
//#endregion
//#region src/config/zod-schema.secret-input-validation.ts
function forEachEnabledAccount(accounts, run) {
	if (!accounts) return;
	for (const [accountId, account] of Object.entries(accounts)) {
		if (!account || account.enabled === false) continue;
		run(accountId, account);
	}
}
/** Validates Telegram webhook URLs have a usable shared or account webhook secret. */
function validateTelegramWebhookSecretRequirements(value, ctx) {
	const baseWebhookUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.webhookUrl) ?? "";
	const hasBaseWebhookSecret = require_types_secrets.hasConfiguredSecretInput(value.webhookSecret);
	if (baseWebhookUrl && !hasBaseWebhookSecret) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: "channels.telegram.webhookUrl requires channels.telegram.webhookSecret",
		path: ["webhookSecret"]
	});
	forEachEnabledAccount(value.accounts, (accountId, account) => {
		if (!((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(account.webhookUrl) ?? "")) return;
		if (!require_types_secrets.hasConfiguredSecretInput(account.webhookSecret) && !hasBaseWebhookSecret) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			message: "channels.telegram.accounts.*.webhookUrl requires channels.telegram.webhookSecret or channels.telegram.accounts.*.webhookSecret",
			path: [
				"accounts",
				accountId,
				"webhookSecret"
			]
		});
	});
}
function validateSlackSigningSecretRequirements(value, ctx) {
	const resolveMode = (mode) => mode === "http" || mode === "socket" || mode === "relay" ? mode : void 0;
	const baseMode = resolveMode(value.mode) ?? "socket";
	if (baseMode === "http" && !require_types_secrets.hasConfiguredSecretInput(value.signingSecret)) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: "channels.slack.mode=\"http\" requires channels.slack.signingSecret",
		path: ["signingSecret"]
	});
	forEachEnabledAccount(value.accounts, (accountId, account) => {
		if ((resolveMode(account.mode) ?? baseMode) !== "http") return;
		if (!require_types_secrets.hasConfiguredSecretInput(account.signingSecret ?? value.signingSecret)) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			message: "channels.slack.accounts.*.mode=\"http\" requires channels.slack.signingSecret or channels.slack.accounts.*.signingSecret",
			path: [
				"accounts",
				accountId,
				"signingSecret"
			]
		});
	});
}
//#endregion
//#region src/config/zod-schema.providers-core.ts
const ToolPolicyBySenderSchema$1 = zod.z.record(zod.z.string(), require_zod_schema_channels_config.ToolPolicySchema).optional();
const TelegramInlineButtonsScopeSchema = zod.z.enum([
	"off",
	"dm",
	"group",
	"all",
	"allowlist"
]);
const TelegramIdListSchema = zod.z.array(zod.z.union([zod.z.string(), zod.z.number()]));
const TelegramCapabilitiesSchema = zod.z.union([zod.z.array(zod.z.string()), zod.z.object({ inlineButtons: TelegramInlineButtonsScopeSchema.optional() }).strict()]);
const UnifiedStreamingModeSchema = zod.z.enum([
	"off",
	"partial",
	"block",
	"progress"
]);
const ChannelStreamingPreviewSchema = zod.z.object({
	chunk: require_zod_schema_core.BlockStreamingChunkSchema.optional(),
	toolProgress: zod.z.boolean().optional(),
	commandText: zod.z.enum(["raw", "status"]).optional()
}).strict();
const ChannelStreamingProgressSchema = zod.z.object({
	label: zod.z.union([zod.z.string(), zod.z.literal(false)]).optional(),
	labels: zod.z.array(zod.z.string()).optional(),
	maxLines: zod.z.number().int().positive().optional(),
	maxLineChars: zod.z.number().int().positive().optional(),
	render: zod.z.enum(["text", "rich"]).optional(),
	toolProgress: zod.z.boolean().optional(),
	commandText: zod.z.enum(["raw", "status"]).optional(),
	commentary: zod.z.boolean().optional(),
	narration: zod.z.boolean().optional()
}).strict();
const DiscordStreamingProgressSchema = ChannelStreamingProgressSchema;
const SlackStreamingProgressSchema = ChannelStreamingProgressSchema.extend({ nativeTaskCards: zod.z.boolean().optional() }).strict();
const ChannelPreviewStreamingConfigSchema = zod.z.object({
	mode: UnifiedStreamingModeSchema.optional(),
	chunkMode: require_zod_schema_core.TextChunkModeSchema.optional(),
	preview: ChannelStreamingPreviewSchema.optional(),
	progress: ChannelStreamingProgressSchema.optional(),
	block: require_zod_schema_core.ChannelStreamingBlockSchema.optional()
}).strict();
const TelegramPreviewStreamingConfigSchema = ChannelPreviewStreamingConfigSchema.extend({ preview: ChannelStreamingPreviewSchema.optional() }).strict();
const DiscordPreviewStreamingConfigSchema = ChannelPreviewStreamingConfigSchema.extend({ progress: DiscordStreamingProgressSchema.optional() }).strict();
const SlackStreamingConfigSchema = ChannelPreviewStreamingConfigSchema.extend({
	nativeTransport: zod.z.boolean().optional(),
	progress: SlackStreamingProgressSchema.optional()
}).strict();
const SlackCapabilitiesSchema = zod.z.union([zod.z.array(zod.z.string()), zod.z.object({ interactiveReplies: zod.z.boolean().optional() }).strict()]);
const BotLoopProtectionSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	maxEventsPerWindow: zod.z.number().int().positive().optional(),
	windowSeconds: zod.z.number().int().positive().optional(),
	cooldownSeconds: zod.z.number().int().positive().optional()
}).strict();
const TelegramErrorPolicySchema = zod.z.enum([
	"always",
	"once",
	"silent"
]).optional();
const TelegramCustomCommandConfig = {
	label: "Telegram",
	pattern: /^[a-z0-9_]{1,32}$/,
	patternDescription: "use a-z, 0-9, underscore; max 32 chars"
};
const TelegramTopicSchema = zod.z.object({
	requireMention: zod.z.boolean().optional(),
	ingest: zod.z.boolean().optional(),
	disableAudioPreflight: zod.z.boolean().optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional(),
	skills: zod.z.array(zod.z.string()).optional(),
	enabled: zod.z.boolean().optional(),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	systemPrompt: zod.z.string().optional(),
	agentId: zod.z.string().optional(),
	errorPolicy: TelegramErrorPolicySchema,
	errorCooldownMs: zod.z.number().int().nonnegative().optional()
}).strict();
const TelegramGroupSchema = zod.z.object({
	requireMention: zod.z.boolean().optional(),
	ingest: zod.z.boolean().optional(),
	disableAudioPreflight: zod.z.boolean().optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema$1,
	skills: zod.z.array(zod.z.string()).optional(),
	enabled: zod.z.boolean().optional(),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	systemPrompt: zod.z.string().optional(),
	topics: zod.z.record(zod.z.string(), TelegramTopicSchema.optional()).optional(),
	errorPolicy: TelegramErrorPolicySchema,
	errorCooldownMs: zod.z.number().int().nonnegative().optional()
}).strict();
const AutoTopicLabelSchema = zod.z.union([zod.z.boolean(), zod.z.object({
	enabled: zod.z.boolean().optional(),
	prompt: zod.z.string().optional()
}).strict()]).optional();
const TelegramDirectSchema = zod.z.object({
	dmPolicy: require_zod_schema_core.DmPolicySchema.optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema$1,
	skills: zod.z.array(zod.z.string()).optional(),
	enabled: zod.z.boolean().optional(),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	systemPrompt: zod.z.string().optional(),
	topics: zod.z.record(zod.z.string(), TelegramTopicSchema.optional()).optional(),
	errorPolicy: TelegramErrorPolicySchema,
	errorCooldownMs: zod.z.number().int().nonnegative().optional(),
	requireTopic: zod.z.boolean().optional(),
	autoTopicLabel: AutoTopicLabelSchema
}).strict();
const TelegramCustomCommandSchema = zod.z.object({
	command: zod.z.string().overwrite(normalizeSlashCommandName),
	description: zod.z.string().overwrite(normalizeCommandDescription)
}).strict();
const validateTelegramCustomCommands = (value, ctx) => {
	if (!value.customCommands || value.customCommands.length === 0) return;
	const { issues } = resolveCustomCommands({
		commands: value.customCommands,
		checkReserved: false,
		checkDuplicates: false,
		config: TelegramCustomCommandConfig
	});
	for (const issue of issues) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: [
			"customCommands",
			issue.index,
			issue.field
		],
		message: issue.message
	});
};
const TelegramAccountSchemaBase = zod.z.object({
	name: zod.z.string().optional(),
	capabilities: TelegramCapabilitiesSchema.optional(),
	execApprovals: zod.z.object({
		enabled: require_zod_schema_channels_config.NativeExecApprovalEnableModeSchema.optional(),
		approvers: TelegramIdListSchema.optional(),
		agentFilter: zod.z.array(zod.z.string()).optional(),
		sessionFilter: zod.z.array(zod.z.string()).optional(),
		target: zod.z.enum([
			"dm",
			"channel",
			"both"
		]).optional()
	}).strict().optional(),
	markdown: require_zod_schema_core.MarkdownConfigSchema,
	enabled: zod.z.boolean().optional(),
	commands: require_zod_schema_core.ProviderCommandsSchema,
	customCommands: zod.z.array(TelegramCustomCommandSchema).optional(),
	configWrites: zod.z.boolean().optional(),
	dmPolicy: require_zod_schema_core.DmPolicySchema.optional().default("pairing"),
	botToken: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	tokenFile: zod.z.string().optional(),
	replyToMode: require_zod_schema_core.ReplyToModeSchema.optional(),
	groups: zod.z.record(zod.z.string(), TelegramGroupSchema.optional()).optional(),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	defaultTo: zod.z.union([zod.z.string(), zod.z.number()]).optional(),
	groupAllowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional().default("allowlist"),
	mentionPatterns: require_zod_schema_core.MentionPatternsPolicySchema.optional(),
	contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
	historyLimit: zod.z.number().int().min(0).optional(),
	dmHistoryLimit: zod.z.number().int().min(0).optional(),
	dms: zod.z.record(zod.z.string(), require_zod_schema_core.DmConfigSchema.optional()).optional(),
	direct: zod.z.record(zod.z.string(), TelegramDirectSchema.optional()).optional(),
	textChunkLimit: zod.z.number().int().positive().optional(),
	richMessages: zod.z.boolean().optional(),
	streaming: TelegramPreviewStreamingConfigSchema.optional(),
	mediaMaxMb: zod.z.number().positive().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	mediaGroupFlushMs: zod.z.number().int().min(10).max(6e4).optional().describe("Buffer window in milliseconds for Telegram media groups/albums before dispatching them as one inbound message. Default: 500."),
	pollingStallThresholdMs: zod.z.number().int().min(3e4).max(6e5).optional(),
	retry: require_zod_schema_core.RetryConfigSchema,
	network: zod.z.object({
		autoSelectFamily: zod.z.boolean().optional(),
		dnsResultOrder: zod.z.enum(["ipv4first", "verbatim"]).optional(),
		dangerouslyAllowPrivateNetwork: zod.z.boolean().optional().describe("Dangerous opt-in for trusted Telegram fake-IP or transparent-proxy environments where api.telegram.org resolves to private/internal/special-use addresses during media downloads.")
	}).strict().optional(),
	proxy: zod.z.string().optional(),
	webhookUrl: zod.z.string().optional().describe("Public HTTPS webhook URL registered with Telegram for inbound updates. This must be internet-reachable and requires channels.telegram.webhookSecret."),
	webhookSecret: require_zod_schema_core.SecretInputSchema.optional().describe("Secret token sent to Telegram during webhook registration and verified on inbound webhook requests. Telegram returns this value for verification; this is not the gateway auth token and not the bot token.").register(require_zod_schema_core.sensitive),
	webhookPath: zod.z.string().optional().describe("Local webhook route path served by the gateway listener. Defaults to /telegram-webhook."),
	webhookHost: zod.z.string().optional().describe("Local bind host for the webhook listener. Defaults to 127.0.0.1; keep loopback unless you intentionally expose direct ingress."),
	webhookPort: zod.z.number().int().nonnegative().optional().describe("Local bind port for the webhook listener. Defaults to 8787; set to 0 to let the OS assign an ephemeral port."),
	webhookCertPath: zod.z.string().optional().describe("Path to the self-signed certificate (PEM) to upload to Telegram during webhook registration. Required for self-signed certs (direct IP or no domain)."),
	actions: zod.z.object({
		reactions: zod.z.boolean().optional(),
		sendMessage: zod.z.boolean().optional(),
		poll: zod.z.boolean().optional(),
		deleteMessage: zod.z.boolean().optional(),
		editMessage: zod.z.boolean().optional(),
		sticker: zod.z.boolean().optional(),
		createForumTopic: zod.z.boolean().optional(),
		editForumTopic: zod.z.boolean().optional()
	}).strict().optional(),
	threadBindings: zod.z.object({
		enabled: zod.z.boolean().optional(),
		idleHours: zod.z.number().nonnegative().optional(),
		maxAgeHours: zod.z.number().nonnegative().optional(),
		spawnSessions: zod.z.boolean().optional(),
		defaultSpawnContext: zod.z.enum(["isolated", "fork"]).optional(),
		spawnSubagentSessions: zod.z.boolean().optional(),
		spawnAcpSessions: zod.z.boolean().optional()
	}).strict().optional(),
	reactionNotifications: zod.z.enum([
		"off",
		"own",
		"all"
	]).optional(),
	reactionLevel: zod.z.enum([
		"off",
		"ack",
		"minimal",
		"extensive"
	]).optional(),
	heartbeat: require_zod_schema_channels_config.ChannelHeartbeatVisibilitySchema,
	healthMonitor: require_zod_schema_channels_config.ChannelHealthMonitorSchema,
	linkPreview: zod.z.boolean().optional(),
	silentErrorReplies: zod.z.boolean().optional(),
	responsePrefix: zod.z.string().optional(),
	ackReaction: zod.z.string().optional(),
	errorPolicy: TelegramErrorPolicySchema,
	errorCooldownMs: zod.z.number().int().nonnegative().optional(),
	apiRoot: zod.z.string().url().optional(),
	trustedLocalFileRoots: zod.z.array(zod.z.string()).optional().describe("Trusted local filesystem roots for self-hosted Telegram Bot API absolute file_path values. Only absolute paths under these roots are read directly; all other absolute paths are rejected."),
	autoTopicLabel: AutoTopicLabelSchema
}).strict();
const TelegramAccountSchema = TelegramAccountSchemaBase.superRefine((value, ctx) => {
	validateTelegramCustomCommands(value, ctx);
});
TelegramAccountSchemaBase.extend({
	accounts: zod.z.record(zod.z.string(), TelegramAccountSchema.optional()).optional(),
	defaultAccount: zod.z.string().optional()
}).superRefine((value, ctx) => {
	require_zod_schema_core.requireOpenAllowFrom({
		policy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.telegram.dmPolicy=\"open\" requires channels.telegram.allowFrom to include \"*\""
	});
	require_zod_schema_core.requireAllowlistAllowFrom({
		policy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.telegram.dmPolicy=\"allowlist\" requires channels.telegram.allowFrom to contain at least one sender ID"
	});
	validateTelegramCustomCommands(value, ctx);
	if (value.accounts) for (const [accountId, account] of Object.entries(value.accounts)) {
		if (!account) continue;
		const effectivePolicy = account.dmPolicy ?? value.dmPolicy;
		const effectiveAllowFrom = account.allowFrom ?? value.allowFrom;
		require_zod_schema_core.requireOpenAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.telegram.accounts.*.dmPolicy=\"open\" requires channels.telegram.accounts.*.allowFrom (or channels.telegram.allowFrom) to include \"*\""
		});
		require_zod_schema_core.requireAllowlistAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.telegram.accounts.*.dmPolicy=\"allowlist\" requires channels.telegram.accounts.*.allowFrom (or channels.telegram.allowFrom) to contain at least one sender ID"
		});
	}
	if (!value.accounts) {
		validateTelegramWebhookSecretRequirements(value, ctx);
		return;
	}
	for (const [accountId, account] of Object.entries(value.accounts)) {
		if (!account) continue;
		if (account.enabled === false) continue;
		const effectiveDmPolicy = account.dmPolicy ?? value.dmPolicy;
		const effectiveAllowFrom = Array.isArray(account.allowFrom) ? account.allowFrom : value.allowFrom;
		require_zod_schema_core.requireOpenAllowFrom({
			policy: effectiveDmPolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.telegram.accounts.*.dmPolicy=\"open\" requires channels.telegram.allowFrom or channels.telegram.accounts.*.allowFrom to include \"*\""
		});
		require_zod_schema_core.requireAllowlistAllowFrom({
			policy: effectiveDmPolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.telegram.accounts.*.dmPolicy=\"allowlist\" requires channels.telegram.allowFrom or channels.telegram.accounts.*.allowFrom to contain at least one sender ID"
		});
	}
	validateTelegramWebhookSecretRequirements(value, ctx);
});
const DiscordThreadSchema = zod.z.object({ inheritParent: zod.z.boolean().optional() }).strict();
const DiscordGuildChannelSchema = zod.z.object({
	requireMention: zod.z.boolean().optional(),
	ignoreOtherMentions: zod.z.boolean().optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema$1,
	skills: zod.z.array(zod.z.string()).optional(),
	enabled: zod.z.boolean().optional(),
	users: DiscordIdListSchema.optional(),
	roles: DiscordIdListSchema.optional(),
	systemPrompt: zod.z.string().optional(),
	includeThreadStarter: zod.z.boolean().optional(),
	autoThread: zod.z.boolean().optional(),
	/** Naming strategy for auto-created threads. "message" uses message text; "generated" creates an LLM title after thread creation. */
	autoThreadName: zod.z.enum(["message", "generated"]).optional(),
	/** Archive duration for auto-created threads in minutes. Discord supports 60, 1440 (1 day), 4320 (3 days), 10080 (1 week). Default: 60. */
	autoArchiveDuration: zod.z.union([
		zod.z.enum([
			"60",
			"1440",
			"4320",
			"10080"
		]),
		zod.z.literal(60),
		zod.z.literal(1440),
		zod.z.literal(4320),
		zod.z.literal(10080)
	]).optional()
}).strict();
const DiscordGuildSchema = zod.z.object({
	slug: zod.z.string().optional(),
	requireMention: zod.z.boolean().optional(),
	ignoreOtherMentions: zod.z.boolean().optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema$1,
	reactionNotifications: zod.z.enum([
		"off",
		"own",
		"all",
		"allowlist"
	]).optional(),
	users: DiscordIdListSchema.optional(),
	roles: DiscordIdListSchema.optional(),
	presenceEvents: DiscordPresenceEventsSchema.optional(),
	channels: zod.z.record(zod.z.string(), DiscordGuildChannelSchema.optional()).optional()
}).strict();
const DiscordUiSchema = zod.z.object({ components: zod.z.object({ accentColor: require_zod_schema_core.HexColorSchema.optional() }).strict().optional() }).strict().optional();
const DiscordVoiceAutoJoinSchema = zod.z.object({
	guildId: zod.z.string().min(1),
	channelId: zod.z.string().min(1)
}).strict();
const DiscordVoiceAllowedChannelSchema = zod.z.object({
	guildId: zod.z.string().min(1),
	channelId: zod.z.string().min(1)
}).strict();
const DiscordVoiceRealtimeToolPolicySchema = zod.z.enum([
	"safe-read-only",
	"owner",
	"none"
]);
const DiscordVoiceRealtimeConsultPolicySchema = zod.z.enum(["auto", "always"]);
const DiscordVoiceRealtimeBootstrapContextFileSchema = zod.z.enum([
	"IDENTITY.md",
	"USER.md",
	"SOUL.md"
]);
const DiscordVoiceRealtimeWakeNameSchema = zod.z.string().min(1).regex(/^\s*[^a-z0-9]*[a-z0-9]+(?:[^a-z0-9]+[a-z0-9]+)?[^a-z0-9]*\s*$/i, { message: "Discord realtime wake names must be one or two words." });
const DiscordVoiceRealtimeSchema = zod.z.object({
	provider: zod.z.string().min(1).optional(),
	model: zod.z.string().min(1).optional(),
	speakerVoice: zod.z.string().min(1).optional(),
	speakerVoiceId: zod.z.string().min(1).optional(),
	voice: zod.z.string().min(1).optional(),
	instructions: zod.z.string().min(1).optional(),
	toolPolicy: DiscordVoiceRealtimeToolPolicySchema.optional(),
	consultPolicy: DiscordVoiceRealtimeConsultPolicySchema.optional(),
	requireWakeName: zod.z.boolean().optional(),
	wakeNames: zod.z.array(DiscordVoiceRealtimeWakeNameSchema).min(1).optional(),
	bootstrapContextFiles: zod.z.array(DiscordVoiceRealtimeBootstrapContextFileSchema).optional(),
	bargeIn: zod.z.boolean().optional(),
	minBargeInAudioEndMs: zod.z.number().int().min(0).max(1e4).optional(),
	debounceMs: zod.z.number().int().positive().max(1e4).optional(),
	providers: zod.z.record(zod.z.string(), zod.z.record(zod.z.string(), zod.z.unknown()).optional()).optional()
}).strict();
const DiscordVoiceAgentSessionSchema = zod.z.object({
	mode: zod.z.enum(["voice", "target"]).optional(),
	target: zod.z.string().min(1).optional()
}).strict().superRefine((value, ctx) => {
	if (value.mode === "target" && !value.target) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["target"],
		message: "voice.agentSession.target is required when mode is \"target\""
	});
});
const DiscordVoiceSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	mode: zod.z.enum([
		"stt-tts",
		"agent-proxy",
		"bidi"
	]).optional(),
	agentSession: DiscordVoiceAgentSessionSchema.optional(),
	model: zod.z.string().min(1).optional(),
	realtime: DiscordVoiceRealtimeSchema.optional(),
	autoJoin: zod.z.array(DiscordVoiceAutoJoinSchema).optional(),
	followUsersEnabled: zod.z.boolean().optional(),
	followUsers: zod.z.array(zod.z.string().min(1)).optional(),
	allowedChannels: zod.z.array(DiscordVoiceAllowedChannelSchema).optional(),
	daveEncryption: zod.z.boolean().optional(),
	decryptionFailureTolerance: zod.z.number().int().min(0).optional(),
	connectTimeoutMs: zod.z.number().int().positive().max(12e4).optional(),
	reconnectGraceMs: zod.z.number().int().positive().max(12e4).optional(),
	captureSilenceGraceMs: zod.z.number().int().positive().max(3e4).optional(),
	tts: require_zod_schema_core.TtsConfigSchema.optional()
}).strict().optional();
const DiscordAccountSchema = zod.z.object({
	name: zod.z.string().optional(),
	capabilities: zod.z.array(zod.z.string()).optional(),
	markdown: require_zod_schema_core.MarkdownConfigSchema,
	enabled: zod.z.boolean().optional(),
	commands: require_zod_schema_core.ProviderCommandsSchema,
	configWrites: zod.z.boolean().optional(),
	token: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	applicationId: DiscordIdSchema.optional(),
	activities: zod.z.object({
		clientSecret: zod.z.string().min(1).optional().register(require_zod_schema_core.sensitive),
		applicationId: DiscordSnowflakeStringSchema.optional()
	}).strict().optional(),
	proxy: zod.z.string().optional(),
	gatewayInfoTimeoutMs: zod.z.number().int().positive().max(12e4).optional(),
	gatewayReadyTimeoutMs: zod.z.number().int().positive().max(12e4).optional(),
	gatewayRuntimeReadyTimeoutMs: zod.z.number().int().positive().max(12e4).optional(),
	allowBots: zod.z.union([zod.z.boolean(), zod.z.literal("mentions")]).optional(),
	botLoopProtection: BotLoopProtectionSchema.optional(),
	dangerouslyAllowNameMatching: zod.z.boolean().optional(),
	mentionAliases: zod.z.record(zod.z.string(), DiscordSnowflakeStringSchema).optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional().default("allowlist"),
	mentionPatterns: require_zod_schema_core.MentionPatternsPolicySchema.optional(),
	contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
	historyLimit: zod.z.number().int().min(0).optional(),
	dmHistoryLimit: zod.z.number().int().min(0).optional(),
	dms: zod.z.record(zod.z.string(), require_zod_schema_core.DmConfigSchema.optional()).optional(),
	textChunkLimit: zod.z.number().int().positive().optional(),
	suppressEmbeds: zod.z.boolean().optional(),
	streaming: DiscordPreviewStreamingConfigSchema.optional(),
	maxLinesPerMessage: zod.z.number().int().positive().optional(),
	mediaMaxMb: zod.z.number().positive().optional(),
	retry: require_zod_schema_core.RetryConfigSchema,
	actions: zod.z.object({
		reactions: zod.z.boolean().optional(),
		stickers: zod.z.boolean().optional(),
		emojiUploads: zod.z.boolean().optional(),
		stickerUploads: zod.z.boolean().optional(),
		polls: zod.z.boolean().optional(),
		permissions: zod.z.boolean().optional(),
		messages: zod.z.boolean().optional(),
		threads: zod.z.boolean().optional(),
		pins: zod.z.boolean().optional(),
		search: zod.z.boolean().optional(),
		memberInfo: zod.z.boolean().optional(),
		roleInfo: zod.z.boolean().optional(),
		roles: zod.z.boolean().optional(),
		channelInfo: zod.z.boolean().optional(),
		voiceStatus: zod.z.boolean().optional(),
		events: zod.z.boolean().optional(),
		moderation: zod.z.boolean().optional(),
		channels: zod.z.boolean().optional(),
		presence: zod.z.boolean().optional()
	}).strict().optional(),
	replyToMode: require_zod_schema_core.ReplyToModeSchema.optional(),
	thread: DiscordThreadSchema.optional(),
	dmPolicy: require_zod_schema_core.DmPolicySchema.optional(),
	allowFrom: DiscordIdListSchema.optional(),
	defaultTo: zod.z.string().optional(),
	dm: DiscordDmSchema.optional(),
	guilds: zod.z.record(zod.z.string(), DiscordGuildSchema.optional()).optional(),
	heartbeat: require_zod_schema_channels_config.ChannelHeartbeatVisibilitySchema,
	healthMonitor: require_zod_schema_channels_config.ChannelHealthMonitorSchema,
	execApprovals: zod.z.object({
		enabled: require_zod_schema_channels_config.NativeExecApprovalEnableModeSchema.optional(),
		approvers: DiscordIdListSchema.optional(),
		agentFilter: zod.z.array(zod.z.string()).optional(),
		sessionFilter: zod.z.array(zod.z.string()).optional(),
		cleanupAfterResolve: zod.z.boolean().optional(),
		target: zod.z.enum([
			"dm",
			"channel",
			"both"
		]).optional()
	}).strict().optional(),
	agentComponents: zod.z.object({
		enabled: zod.z.boolean().optional(),
		ttlMs: zod.z.number().int().positive().max(1440 * 60 * 1e3).optional()
	}).strict().optional(),
	ui: DiscordUiSchema,
	slashCommand: zod.z.object({ ephemeral: zod.z.boolean().optional() }).strict().optional(),
	threadBindings: zod.z.object({
		enabled: zod.z.boolean().optional(),
		idleHours: zod.z.number().nonnegative().optional(),
		maxAgeHours: zod.z.number().nonnegative().optional(),
		spawnSessions: zod.z.boolean().optional(),
		defaultSpawnContext: zod.z.enum(["isolated", "fork"]).optional(),
		spawnSubagentSessions: zod.z.boolean().optional(),
		spawnAcpSessions: zod.z.boolean().optional()
	}).strict().optional(),
	intents: zod.z.object({
		presence: zod.z.boolean().optional(),
		guildMembers: zod.z.boolean().optional(),
		voiceStates: zod.z.boolean().optional()
	}).strict().optional(),
	voice: DiscordVoiceSchema,
	pluralkit: zod.z.object({
		enabled: zod.z.boolean().optional(),
		token: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive)
	}).strict().optional(),
	responsePrefix: zod.z.string().optional(),
	ackReaction: zod.z.string().optional(),
	ackReactionScope: zod.z.enum([
		"group-mentions",
		"group-all",
		"direct",
		"all",
		"off",
		"none"
	]).optional(),
	activity: zod.z.string().optional(),
	status: zod.z.enum([
		"online",
		"dnd",
		"idle",
		"invisible"
	]).optional(),
	autoPresence: zod.z.object({
		enabled: zod.z.boolean().optional(),
		intervalMs: zod.z.number().int().positive().optional(),
		minUpdateIntervalMs: zod.z.number().int().positive().optional(),
		healthyText: zod.z.string().optional(),
		degradedText: zod.z.string().optional(),
		exhaustedText: zod.z.string().optional()
	}).strict().optional(),
	activityType: zod.z.union([
		zod.z.literal(0),
		zod.z.literal(1),
		zod.z.literal(2),
		zod.z.literal(3),
		zod.z.literal(4),
		zod.z.literal(5)
	]).optional(),
	activityUrl: zod.z.string().url().optional(),
	inboundWorker: zod.z.object({ runTimeoutMs: zod.z.number().int().nonnegative().optional() }).strict().optional(),
	eventQueue: zod.z.object({
		listenerTimeout: zod.z.number().int().positive().optional(),
		maxQueueSize: zod.z.number().int().positive().optional(),
		maxConcurrency: zod.z.number().int().positive().optional()
	}).strict().optional()
}).strict().superRefine((value, ctx) => {
	const activityText = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.activity) ?? "";
	const hasActivity = Boolean(activityText);
	const hasActivityType = value.activityType !== void 0;
	const activityUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.activityUrl) ?? "";
	const hasActivityUrl = Boolean(activityUrl);
	if ((hasActivityType || hasActivityUrl) && !hasActivity) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: "channels.discord.activity is required when activityType or activityUrl is set",
		path: ["activity"]
	});
	if (value.activityType === 1 && !hasActivityUrl) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: "channels.discord.activityUrl is required when activityType is 1 (Streaming)",
		path: ["activityUrl"]
	});
	if (hasActivityUrl && value.activityType !== 1) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: "channels.discord.activityType must be 1 (Streaming) when activityUrl is set",
		path: ["activityType"]
	});
	const autoPresenceInterval = value.autoPresence?.intervalMs;
	const autoPresenceMinUpdate = value.autoPresence?.minUpdateIntervalMs;
	if (typeof autoPresenceInterval === "number" && typeof autoPresenceMinUpdate === "number" && autoPresenceMinUpdate > autoPresenceInterval) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: "channels.discord.autoPresence.minUpdateIntervalMs must be less than or equal to channels.discord.autoPresence.intervalMs",
		path: ["autoPresence", "minUpdateIntervalMs"]
	});
});
DiscordAccountSchema.extend({
	accounts: zod.z.record(zod.z.string(), DiscordAccountSchema.optional()).optional(),
	defaultAccount: zod.z.string().optional()
}).superRefine((value, ctx) => {
	const dmPolicy = value.dmPolicy ?? value.dm?.policy ?? "pairing";
	const allowFrom = value.allowFrom ?? value.dm?.allowFrom;
	const allowFromPath = value.allowFrom !== void 0 ? ["allowFrom"] : ["dm", "allowFrom"];
	require_zod_schema_core.requireOpenAllowFrom({
		policy: dmPolicy,
		allowFrom,
		ctx,
		path: [...allowFromPath],
		message: "channels.discord.dmPolicy=\"open\" requires channels.discord.allowFrom (or channels.discord.dm.allowFrom) to include \"*\""
	});
	require_zod_schema_core.requireAllowlistAllowFrom({
		policy: dmPolicy,
		allowFrom,
		ctx,
		path: [...allowFromPath],
		message: "channels.discord.dmPolicy=\"allowlist\" requires channels.discord.allowFrom (or channels.discord.dm.allowFrom) to contain at least one sender ID"
	});
	if (!value.accounts) return;
	for (const [accountId, account] of Object.entries(value.accounts)) {
		if (!account) continue;
		const effectivePolicy = account.dmPolicy ?? account.dm?.policy ?? value.dmPolicy ?? value.dm?.policy ?? "pairing";
		const effectiveAllowFrom = account.allowFrom ?? account.dm?.allowFrom ?? value.allowFrom ?? value.dm?.allowFrom;
		require_zod_schema_core.requireOpenAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.discord.accounts.*.dmPolicy=\"open\" requires channels.discord.accounts.*.allowFrom (or channels.discord.allowFrom) to include \"*\""
		});
		require_zod_schema_core.requireAllowlistAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.discord.accounts.*.dmPolicy=\"allowlist\" requires channels.discord.accounts.*.allowFrom (or channels.discord.allowFrom) to contain at least one sender ID"
		});
	}
});
const SlackDmSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	policy: require_zod_schema_core.DmPolicySchema.optional(),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	groupEnabled: zod.z.boolean().optional(),
	groupChannels: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	replyToMode: require_zod_schema_core.ReplyToModeSchema.optional()
}).strict();
const SlackPresenceEventsSchema = zod.z.object({ mode: zod.z.enum([
	"off",
	"auto",
	"on"
]).optional() }).strict();
const SlackChannelSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	requireMention: zod.z.boolean().optional(),
	ignoreOtherMentions: zod.z.boolean().optional(),
	replyToMode: require_zod_schema_core.ReplyToModeSchema.optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema$1,
	allowBots: zod.z.union([zod.z.boolean(), zod.z.literal("mentions")]).optional(),
	botLoopProtection: BotLoopProtectionSchema.optional(),
	users: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	skills: zod.z.array(zod.z.string()).optional(),
	systemPrompt: zod.z.string().optional(),
	presenceEvents: SlackPresenceEventsSchema.optional()
}).strict();
const SlackThreadSchema = zod.z.object({
	historyScope: zod.z.enum(["thread", "channel"]).optional(),
	inheritParent: zod.z.boolean().optional(),
	initialHistoryLimit: zod.z.number().int().min(0).optional(),
	requireExplicitMention: zod.z.boolean().optional()
}).strict();
const ReplyToModeByChatTypeSchema = zod.z.object({
	direct: require_zod_schema_core.ReplyToModeSchema.optional(),
	group: require_zod_schema_core.ReplyToModeSchema.optional(),
	channel: require_zod_schema_core.ReplyToModeSchema.optional()
}).strict();
const DirectGroupReplyToModeByChatTypeSchema = zod.z.object({
	direct: require_zod_schema_core.ReplyToModeSchema.optional(),
	group: require_zod_schema_core.ReplyToModeSchema.optional()
}).strict();
const SlackSocketModeSchema = zod.z.object({
	clientPingTimeout: zod.z.number().int().positive().optional(),
	serverPingTimeout: zod.z.number().int().positive().optional(),
	pingPongLoggingEnabled: zod.z.boolean().optional()
}).strict();
const SlackRelaySchema = zod.z.object({
	url: zod.z.string().optional(),
	authToken: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	gatewayId: zod.z.string().optional()
}).strict();
const SlackAccountSchema = zod.z.object({
	name: zod.z.string().optional(),
	mode: zod.z.enum([
		"socket",
		"http",
		"relay"
	]).optional(),
	enterpriseOrgInstall: zod.z.boolean().optional(),
	socketMode: SlackSocketModeSchema.optional(),
	relay: SlackRelaySchema.optional(),
	signingSecret: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	webhookPath: zod.z.string().optional(),
	capabilities: SlackCapabilitiesSchema.optional(),
	execApprovals: zod.z.object({
		enabled: require_zod_schema_channels_config.NativeExecApprovalEnableModeSchema.optional(),
		approvers: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
		agentFilter: zod.z.array(zod.z.string()).optional(),
		sessionFilter: zod.z.array(zod.z.string()).optional(),
		target: zod.z.enum([
			"dm",
			"channel",
			"both"
		]).optional()
	}).strict().optional(),
	markdown: require_zod_schema_core.MarkdownConfigSchema,
	enabled: zod.z.boolean().optional(),
	commands: require_zod_schema_core.ProviderCommandsSchema,
	configWrites: zod.z.boolean().optional(),
	botToken: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	appToken: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	userToken: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	userTokenReadOnly: zod.z.boolean().optional().default(true),
	allowBots: zod.z.union([zod.z.boolean(), zod.z.literal("mentions")]).optional(),
	botLoopProtection: BotLoopProtectionSchema.optional(),
	dangerouslyAllowNameMatching: zod.z.boolean().optional(),
	requireMention: zod.z.boolean().optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional(),
	mentionPatterns: require_zod_schema_core.MentionPatternsPolicySchema.optional(),
	contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
	historyLimit: zod.z.number().int().min(0).optional(),
	dmHistoryLimit: zod.z.number().int().min(0).optional(),
	dms: zod.z.record(zod.z.string(), require_zod_schema_core.DmConfigSchema.optional()).optional(),
	textChunkLimit: zod.z.number().int().positive().optional(),
	unfurlLinks: zod.z.boolean().optional(),
	unfurlMedia: zod.z.boolean().optional(),
	streaming: SlackStreamingConfigSchema.optional(),
	mediaMaxMb: zod.z.number().positive().optional(),
	reactionNotifications: zod.z.enum([
		"off",
		"own",
		"all",
		"allowlist"
	]).optional(),
	reactionAllowlist: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	replyToMode: require_zod_schema_core.ReplyToModeSchema.optional(),
	replyToModeByChatType: ReplyToModeByChatTypeSchema.optional(),
	thread: SlackThreadSchema.optional(),
	presenceEvents: SlackPresenceEventsSchema.optional(),
	actions: zod.z.object({
		reactions: zod.z.boolean().optional(),
		messages: zod.z.boolean().optional(),
		pins: zod.z.boolean().optional(),
		search: zod.z.boolean().optional(),
		permissions: zod.z.boolean().optional(),
		memberInfo: zod.z.boolean().optional(),
		channelInfo: zod.z.boolean().optional(),
		emojiList: zod.z.boolean().optional()
	}).strict().optional(),
	slashCommand: zod.z.object({
		enabled: zod.z.boolean().optional(),
		name: zod.z.string().optional(),
		sessionPrefix: zod.z.string().optional(),
		ephemeral: zod.z.boolean().optional()
	}).strict().optional(),
	dmPolicy: require_zod_schema_core.DmPolicySchema.optional(),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	defaultTo: zod.z.string().optional(),
	dm: SlackDmSchema.optional(),
	channels: zod.z.record(zod.z.string(), SlackChannelSchema.optional()).optional(),
	heartbeat: require_zod_schema_channels_config.ChannelHeartbeatVisibilitySchema,
	healthMonitor: require_zod_schema_channels_config.ChannelHealthMonitorSchema,
	responsePrefix: zod.z.string().optional(),
	ackReaction: zod.z.string().optional(),
	typingReaction: zod.z.string().optional()
}).strict().superRefine(() => {});
SlackAccountSchema.safeExtend({
	mode: zod.z.enum([
		"socket",
		"http",
		"relay"
	]).optional().default("socket"),
	signingSecret: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	webhookPath: zod.z.string().optional().default("/slack/events"),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional().default("allowlist"),
	mentionPatterns: require_zod_schema_core.MentionPatternsPolicySchema.optional(),
	contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
	accounts: zod.z.record(zod.z.string(), SlackAccountSchema.optional()).optional(),
	defaultAccount: zod.z.string().optional()
}).superRefine((value, ctx) => {
	const dmPolicy = value.dmPolicy ?? value.dm?.policy ?? "pairing";
	const allowFrom = value.allowFrom ?? value.dm?.allowFrom;
	const allowFromPath = value.allowFrom !== void 0 ? ["allowFrom"] : ["dm", "allowFrom"];
	require_zod_schema_core.requireOpenAllowFrom({
		policy: dmPolicy,
		allowFrom,
		ctx,
		path: [...allowFromPath],
		message: "channels.slack.dmPolicy=\"open\" requires channels.slack.allowFrom (or channels.slack.dm.allowFrom) to include \"*\""
	});
	require_zod_schema_core.requireAllowlistAllowFrom({
		policy: dmPolicy,
		allowFrom,
		ctx,
		path: [...allowFromPath],
		message: "channels.slack.dmPolicy=\"allowlist\" requires channels.slack.allowFrom (or channels.slack.dm.allowFrom) to contain at least one sender ID"
	});
	const requireRelayConfig = (relay, path) => {
		if (typeof relay?.url !== "string" || !relay.url.trim()) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			message: "channels.slack.mode=\"relay\" requires relay.url",
			path: [...path, "url"]
		});
		if (!require_types_secrets.hasConfiguredSecretInput(relay?.authToken)) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			message: "channels.slack.mode=\"relay\" requires relay.authToken",
			path: [...path, "authToken"]
		});
		if (typeof relay?.gatewayId !== "string" || !relay.gatewayId.trim()) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			message: "channels.slack.mode=\"relay\" requires relay.gatewayId",
			path: [...path, "gatewayId"]
		});
	};
	const baseMode = value.mode ?? "socket";
	if (!value.accounts) {
		if (baseMode === "relay") requireRelayConfig(value.relay, ["relay"]);
		validateSlackSigningSecretRequirements(value, ctx);
		return;
	}
	for (const [accountId, account] of Object.entries(value.accounts)) {
		if (!account) continue;
		if (account.enabled === false) continue;
		const accountMode = account.mode ?? baseMode;
		const effectiveRelay = {
			...value.relay,
			...account.relay
		};
		const effectivePolicy = account.dmPolicy ?? account.dm?.policy ?? value.dmPolicy ?? value.dm?.policy ?? "pairing";
		const effectiveAllowFrom = account.allowFrom ?? account.dm?.allowFrom ?? value.allowFrom ?? value.dm?.allowFrom;
		require_zod_schema_core.requireOpenAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.slack.accounts.*.dmPolicy=\"open\" requires channels.slack.accounts.*.allowFrom (or channels.slack.allowFrom) to include \"*\""
		});
		require_zod_schema_core.requireAllowlistAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.slack.accounts.*.dmPolicy=\"allowlist\" requires channels.slack.accounts.*.allowFrom (or channels.slack.allowFrom) to contain at least one sender ID"
		});
		if (accountMode !== "http") {
			if (accountMode === "relay") requireRelayConfig(effectiveRelay, [
				"accounts",
				accountId,
				"relay"
			]);
		}
	}
	validateSlackSigningSecretRequirements(value, ctx);
});
const SignalGroupEntrySchema = zod.z.object({
	requireMention: zod.z.boolean().optional(),
	ingest: zod.z.boolean().optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema$1
}).strict();
const SignalGroupsSchema = zod.z.record(zod.z.string(), SignalGroupEntrySchema.optional()).optional();
const SignalAccountSchemaBase = zod.z.object({
	name: zod.z.string().optional(),
	capabilities: zod.z.array(zod.z.string()).optional(),
	markdown: require_zod_schema_core.MarkdownConfigSchema,
	enabled: zod.z.boolean().optional(),
	configWrites: zod.z.boolean().optional(),
	account: zod.z.string().optional(),
	accountUuid: zod.z.string().optional(),
	configPath: zod.z.string().optional(),
	httpUrl: zod.z.string().optional(),
	httpHost: zod.z.string().optional(),
	httpPort: zod.z.number().int().positive().optional(),
	cliPath: require_zod_schema_core.ExecutableTokenSchema.optional(),
	autoStart: zod.z.boolean().optional(),
	startupTimeoutMs: zod.z.number().int().min(1e3).max(12e4).optional(),
	receiveMode: zod.z.union([zod.z.literal("on-start"), zod.z.literal("manual")]).optional(),
	ignoreAttachments: zod.z.boolean().optional(),
	ignoreStories: zod.z.boolean().optional(),
	sendReadReceipts: zod.z.boolean().optional(),
	aliases: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	dmPolicy: require_zod_schema_core.DmPolicySchema.optional().default("pairing"),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	defaultTo: zod.z.string().optional(),
	groupAllowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional().default("allowlist"),
	contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
	groups: SignalGroupsSchema,
	historyLimit: zod.z.number().int().min(0).optional(),
	dmHistoryLimit: zod.z.number().int().min(0).optional(),
	dms: zod.z.record(zod.z.string(), require_zod_schema_core.DmConfigSchema.optional()).optional(),
	textChunkLimit: zod.z.number().int().positive().optional(),
	streaming: require_zod_schema_core.ChannelDeliveryStreamingConfigSchema.optional(),
	mediaMaxMb: zod.z.number().int().positive().optional(),
	replyToMode: require_zod_schema_core.ReplyToModeSchema.optional(),
	replyToModeByChatType: DirectGroupReplyToModeByChatTypeSchema.optional(),
	reactionNotifications: zod.z.enum([
		"off",
		"own",
		"all",
		"allowlist"
	]).optional(),
	reactionAllowlist: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	actions: zod.z.object({ reactions: zod.z.boolean().optional() }).strict().optional(),
	reactionLevel: zod.z.enum([
		"off",
		"ack",
		"minimal",
		"extensive"
	]).optional(),
	heartbeat: require_zod_schema_channels_config.ChannelHeartbeatVisibilitySchema,
	healthMonitor: require_zod_schema_channels_config.ChannelHealthMonitorSchema,
	responsePrefix: zod.z.string().optional()
}).strict();
SignalAccountSchemaBase.extend({
	apiMode: zod.z.enum([
		"auto",
		"native",
		"container"
	]).optional(),
	accounts: zod.z.record(zod.z.string(), SignalAccountSchemaBase.optional()).optional(),
	defaultAccount: zod.z.string().optional()
}).superRefine((value, ctx) => {
	require_zod_schema_core.requireOpenAllowFrom({
		policy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.signal.dmPolicy=\"open\" requires channels.signal.allowFrom to include \"*\""
	});
	require_zod_schema_core.requireAllowlistAllowFrom({
		policy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.signal.dmPolicy=\"allowlist\" requires channels.signal.allowFrom to contain at least one sender ID"
	});
	if (!value.accounts) return;
	for (const [accountId, account] of Object.entries(value.accounts)) {
		if (!account) continue;
		const effectivePolicy = account.dmPolicy ?? value.dmPolicy;
		const effectiveAllowFrom = account.allowFrom ?? value.allowFrom;
		require_zod_schema_core.requireOpenAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.signal.accounts.*.dmPolicy=\"open\" requires channels.signal.accounts.*.allowFrom (or channels.signal.allowFrom) to include \"*\""
		});
		require_zod_schema_core.requireAllowlistAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.signal.accounts.*.dmPolicy=\"allowlist\" requires channels.signal.accounts.*.allowFrom (or channels.signal.allowFrom) to contain at least one sender ID"
		});
	}
});
const IMessageActionSchema = zod.z.object({
	reactions: zod.z.boolean().optional(),
	edit: zod.z.boolean().optional(),
	unsend: zod.z.boolean().optional(),
	reply: zod.z.boolean().optional(),
	sendWithEffect: zod.z.boolean().optional(),
	renameGroup: zod.z.boolean().optional(),
	setGroupIcon: zod.z.boolean().optional(),
	addParticipant: zod.z.boolean().optional(),
	removeParticipant: zod.z.boolean().optional(),
	leaveGroup: zod.z.boolean().optional(),
	sendAttachment: zod.z.boolean().optional(),
	polls: zod.z.boolean().optional()
}).strict().optional();
const IMessageAccountSchemaBase = zod.z.object({
	name: zod.z.string().optional(),
	capabilities: zod.z.array(zod.z.string()).optional(),
	markdown: require_zod_schema_core.MarkdownConfigSchema,
	enabled: zod.z.boolean().optional(),
	configWrites: zod.z.boolean().optional(),
	cliPath: require_zod_schema_core.ExecutableTokenSchema.optional(),
	dbPath: zod.z.string().optional(),
	remoteHost: zod.z.string().refine(require_scp_host.isSafeScpRemoteHost, "expected SSH host or user@host (no spaces/options)").optional(),
	actions: IMessageActionSchema,
	service: zod.z.union([
		zod.z.literal("imessage"),
		zod.z.literal("sms"),
		zod.z.literal("auto")
	]).optional(),
	sendTransport: zod.z.enum([
		"auto",
		"bridge",
		"applescript"
	]).optional(),
	region: zod.z.string().optional(),
	dmPolicy: require_zod_schema_core.DmPolicySchema.optional().default("pairing"),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	defaultTo: zod.z.string().optional(),
	groupAllowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional().default("allowlist"),
	contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
	historyLimit: zod.z.number().int().min(0).optional(),
	dmHistoryLimit: zod.z.number().int().min(0).optional(),
	dms: zod.z.record(zod.z.string(), require_zod_schema_core.DmConfigSchema.optional()).optional(),
	includeAttachments: zod.z.boolean().optional(),
	attachmentRoots: zod.z.array(zod.z.string().refine(_gabrielvfonseca_media_core_inbound_path_policy.isValidInboundPathRootPattern, "expected absolute path root")).optional(),
	remoteAttachmentRoots: zod.z.array(zod.z.string().refine(_gabrielvfonseca_media_core_inbound_path_policy.isValidInboundPathRootPattern, "expected absolute path root")).optional(),
	mediaMaxMb: zod.z.number().int().positive().optional(),
	probeTimeoutMs: zod.z.number().int().positive().optional(),
	textChunkLimit: zod.z.number().int().positive().optional(),
	streaming: require_zod_schema_core.ChannelDeliveryStreamingConfigSchema.optional(),
	sendReadReceipts: zod.z.boolean().optional(),
	reactionNotifications: zod.z.enum([
		"off",
		"own",
		"all"
	]).optional(),
	coalesceSameSenderDms: zod.z.boolean().optional(),
	catchup: zod.z.object({
		enabled: zod.z.boolean().optional(),
		maxAgeMinutes: zod.z.number().int().min(1).max(720).optional(),
		perRunLimit: zod.z.number().int().min(1).max(500).optional(),
		firstRunLookbackMinutes: zod.z.number().int().min(1).max(720).optional(),
		maxFailureRetries: zod.z.number().int().min(1).max(1e3).optional()
	}).strict().optional(),
	groups: zod.z.record(zod.z.string(), zod.z.object({
		requireMention: zod.z.boolean().optional(),
		tools: require_zod_schema_channels_config.ToolPolicySchema,
		toolsBySender: ToolPolicyBySenderSchema$1,
		systemPrompt: zod.z.string().optional()
	}).strict().optional()).optional(),
	heartbeat: require_zod_schema_channels_config.ChannelHeartbeatVisibilitySchema,
	healthMonitor: require_zod_schema_channels_config.ChannelHealthMonitorSchema,
	responsePrefix: zod.z.string().optional()
}).strict();
IMessageAccountSchemaBase.extend({
	accounts: zod.z.record(zod.z.string(), IMessageAccountSchemaBase.optional()).optional(),
	defaultAccount: zod.z.string().optional()
}).superRefine((value, ctx) => {
	require_zod_schema_core.requireOpenAllowFrom({
		policy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.imessage.dmPolicy=\"open\" requires channels.imessage.allowFrom to include \"*\""
	});
	require_zod_schema_core.requireAllowlistAllowFrom({
		policy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.imessage.dmPolicy=\"allowlist\" requires channels.imessage.allowFrom to contain at least one sender ID"
	});
	if (!value.accounts) return;
	for (const [accountId, account] of Object.entries(value.accounts)) {
		if (!account) continue;
		const effectivePolicy = account.dmPolicy ?? value.dmPolicy;
		const effectiveAllowFrom = account.allowFrom ?? value.allowFrom;
		require_zod_schema_core.requireOpenAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.imessage.accounts.*.dmPolicy=\"open\" requires channels.imessage.accounts.*.allowFrom (or channels.imessage.allowFrom) to include \"*\""
		});
		require_zod_schema_core.requireAllowlistAllowFrom({
			policy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.imessage.accounts.*.dmPolicy=\"allowlist\" requires channels.imessage.accounts.*.allowFrom (or channels.imessage.allowFrom) to contain at least one sender ID"
		});
	}
});
const MSTeamsChannelSchema = zod.z.object({
	requireMention: zod.z.boolean().optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema$1,
	replyStyle: require_zod_schema_core.MSTeamsReplyStyleSchema.optional()
}).strict();
const MSTeamsTeamSchema = zod.z.object({
	requireMention: zod.z.boolean().optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema$1,
	replyStyle: require_zod_schema_core.MSTeamsReplyStyleSchema.optional(),
	channels: zod.z.record(zod.z.string(), MSTeamsChannelSchema.optional()).optional()
}).strict();
const MSTEAMS_SERVICE_URL_HOST_ALLOWLIST = [
	"smba.trafficmanager.net",
	"smba.infra.gcc.teams.microsoft.com",
	"smba.infra.gov.teams.microsoft.us",
	"smba.infra.dod.teams.microsoft.us",
	"botframework.azure.cn"
];
function isAllowedMSTeamsServiceUrl(value) {
	try {
		const parsed = new URL(value.trim());
		if (parsed.protocol !== "https:") return false;
		const host = parsed.hostname.toLowerCase();
		return MSTEAMS_SERVICE_URL_HOST_ALLOWLIST.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
	} catch {
		return false;
	}
}
function isAzureChinaBotFrameworkServiceUrl(value) {
	try {
		const parsed = new URL(value.trim());
		if (parsed.protocol !== "https:") return false;
		const host = parsed.hostname.toLowerCase();
		return host === "botframework.azure.cn" || host.endsWith(".botframework.azure.cn");
	} catch {
		return false;
	}
}
const MSTeamsConfigSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	capabilities: zod.z.array(zod.z.string()).optional(),
	dangerouslyAllowNameMatching: zod.z.boolean().optional(),
	markdown: require_zod_schema_core.MarkdownConfigSchema,
	configWrites: zod.z.boolean().optional(),
	appId: zod.z.string().optional(),
	appPassword: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	tenantId: zod.z.string().optional(),
	cloud: zod.z.enum([
		"Public",
		"USGov",
		"USGovDoD",
		"China"
	]).optional(),
	serviceUrl: zod.z.string().url().refine(isAllowedMSTeamsServiceUrl, { message: "channels.msteams.serviceUrl must use a supported Microsoft Teams Bot Connector host" }).optional(),
	authType: zod.z.enum(["secret", "federated"]).optional(),
	certificatePath: zod.z.string().optional(),
	certificateThumbprint: zod.z.string().optional(),
	useManagedIdentity: zod.z.boolean().optional(),
	managedIdentityClientId: zod.z.string().optional(),
	webhook: zod.z.object({
		port: zod.z.number().int().positive().optional(),
		path: zod.z.string().optional()
	}).strict().optional(),
	dmPolicy: require_zod_schema_core.DmPolicySchema.optional().default("pairing"),
	allowFrom: zod.z.array(zod.z.string()).optional(),
	defaultTo: zod.z.string().optional(),
	groupAllowFrom: zod.z.array(zod.z.string()).optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional().default("allowlist"),
	contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
	textChunkLimit: zod.z.number().int().positive().optional(),
	streaming: ChannelPreviewStreamingConfigSchema.optional(),
	typingIndicator: zod.z.boolean().optional(),
	mediaAllowHosts: zod.z.array(zod.z.string()).optional(),
	mediaAuthAllowHosts: zod.z.array(zod.z.string()).optional(),
	graphMediaFallback: zod.z.boolean().optional(),
	requireMention: zod.z.boolean().optional(),
	historyLimit: zod.z.number().int().min(0).optional(),
	dmHistoryLimit: zod.z.number().int().min(0).optional(),
	dms: zod.z.record(zod.z.string(), require_zod_schema_core.DmConfigSchema.optional()).optional(),
	replyStyle: require_zod_schema_core.MSTeamsReplyStyleSchema.optional(),
	teams: zod.z.record(zod.z.string(), MSTeamsTeamSchema.optional()).optional(),
	/** Max inbound and outbound media size in MB (default: 100MB). */
	mediaMaxMb: zod.z.number().positive().optional(),
	/** SharePoint site ID for file uploads in group chats/channels (e.g., "contoso.sharepoint.com,guid1,guid2") */
	sharePointSiteId: zod.z.string().optional(),
	heartbeat: require_zod_schema_channels_config.ChannelHeartbeatVisibilitySchema,
	healthMonitor: require_zod_schema_channels_config.ChannelHealthMonitorSchema,
	responsePrefix: zod.z.string().optional(),
	welcomeCard: zod.z.boolean().optional(),
	promptStarters: zod.z.array(zod.z.string()).optional(),
	groupWelcomeCard: zod.z.boolean().optional(),
	feedbackEnabled: zod.z.boolean().optional(),
	feedbackReflection: zod.z.boolean().optional(),
	feedbackReflectionCooldownMs: zod.z.number().int().min(0).optional(),
	delegatedAuth: zod.z.object({
		enabled: zod.z.boolean().optional(),
		scopes: zod.z.array(zod.z.string()).optional()
	}).strict().optional(),
	sso: zod.z.object({
		enabled: zod.z.boolean().optional(),
		connectionName: zod.z.string().optional()
	}).strict().optional()
}).strict().superRefine((value, ctx) => {
	require_zod_schema_core.requireOpenAllowFrom({
		policy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.msteams.dmPolicy=\"open\" requires channels.msteams.allowFrom to include \"*\""
	});
	require_zod_schema_core.requireAllowlistAllowFrom({
		policy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.msteams.dmPolicy=\"allowlist\" requires channels.msteams.allowFrom to contain at least one sender ID"
	});
	if (value.sso?.enabled === true && !value.sso.connectionName?.trim()) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["sso", "connectionName"],
		message: "channels.msteams.sso.enabled=true requires channels.msteams.sso.connectionName to identify the Bot Framework OAuth connection"
	});
	if (value.cloud && value.cloud !== "Public" && value.cloud !== "China" && !value.serviceUrl?.trim()) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["serviceUrl"],
		message: "channels.msteams.cloud requires channels.msteams.serviceUrl for non-public Teams clouds"
	});
	if (value.cloud === "China" && value.serviceUrl?.trim() && !isAzureChinaBotFrameworkServiceUrl(value.serviceUrl)) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["serviceUrl"],
		message: "channels.msteams.cloud=China requires channels.msteams.serviceUrl to use an Azure China Bot Framework channel host"
	});
	if (value.cloud !== "China" && value.serviceUrl?.trim() && isAzureChinaBotFrameworkServiceUrl(value.serviceUrl)) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["cloud"],
		message: "Azure China Bot Framework serviceUrl hosts require channels.msteams.cloud=China"
	});
});
//#endregion
//#region src/config/zod-schema.providers-googlechat.ts
/** DM policy schema for Google Chat accounts. */
const GoogleChatDmSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	policy: require_zod_schema_core.DmPolicySchema.optional().default("pairing"),
	allowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional()
}).strict().superRefine((value, ctx) => {
	require_zod_schema_core.requireOpenAllowFrom({
		policy: value.policy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.googlechat.dm.policy=\"open\" requires channels.googlechat.dm.allowFrom to include \"*\""
	});
	require_zod_schema_core.requireAllowlistAllowFrom({
		policy: value.policy,
		allowFrom: value.allowFrom,
		ctx,
		path: ["allowFrom"],
		message: "channels.googlechat.dm.policy=\"allowlist\" requires channels.googlechat.dm.allowFrom to contain at least one sender ID"
	});
});
const GoogleChatGroupSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	requireMention: zod.z.boolean().optional(),
	botLoopProtection: require_zod_schema_channels_config.ChannelBotLoopProtectionSchema.optional(),
	users: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	systemPrompt: zod.z.string().optional()
}).strict();
const GoogleChatAccountSchema = zod.z.object({
	name: zod.z.string().optional(),
	capabilities: zod.z.array(zod.z.string()).optional(),
	enabled: zod.z.boolean().optional(),
	configWrites: zod.z.boolean().optional(),
	allowBots: zod.z.boolean().optional(),
	botLoopProtection: require_zod_schema_channels_config.ChannelBotLoopProtectionSchema.optional(),
	dangerouslyAllowNameMatching: zod.z.boolean().optional(),
	requireMention: zod.z.boolean().optional(),
	groupPolicy: require_zod_schema_core.GroupPolicySchema.optional().default("allowlist"),
	groupAllowFrom: zod.z.array(zod.z.union([zod.z.string(), zod.z.number()])).optional(),
	groups: zod.z.record(zod.z.string(), GoogleChatGroupSchema.optional()).optional(),
	defaultTo: zod.z.string().optional(),
	serviceAccount: zod.z.union([
		zod.z.string(),
		zod.z.record(zod.z.string(), zod.z.unknown()),
		require_zod_schema_core.SecretRefSchema
	]).optional().register(require_zod_schema_core.sensitive),
	serviceAccountRef: require_zod_schema_core.SecretRefSchema.optional().register(require_zod_schema_core.sensitive),
	serviceAccountFile: zod.z.string().optional(),
	audienceType: zod.z.enum(["app-url", "project-number"]).optional(),
	audience: zod.z.string().optional(),
	appPrincipal: zod.z.string().optional(),
	webhookPath: zod.z.string().optional(),
	webhookUrl: zod.z.string().optional(),
	botUser: zod.z.string().optional(),
	historyLimit: zod.z.number().int().min(0).optional(),
	dmHistoryLimit: zod.z.number().int().min(0).optional(),
	dms: zod.z.record(zod.z.string(), require_zod_schema_core.DmConfigSchema.optional()).optional(),
	textChunkLimit: zod.z.number().int().positive().optional(),
	streaming: require_zod_schema_core.ChannelDeliveryStreamingConfigSchema.optional(),
	mediaMaxMb: zod.z.number().positive().optional(),
	replyToMode: require_zod_schema_core.ReplyToModeSchema.optional(),
	actions: zod.z.object({ reactions: zod.z.boolean().optional() }).strict().optional(),
	dm: GoogleChatDmSchema.optional(),
	healthMonitor: require_zod_schema_channels_config.ChannelHealthMonitorSchema,
	typingIndicator: zod.z.enum([
		"none",
		"message",
		"reaction"
	]).optional(),
	responsePrefix: zod.z.string().optional()
}).strict();
GoogleChatAccountSchema.extend({
	accounts: zod.z.record(zod.z.string(), GoogleChatAccountSchema.optional()).optional(),
	defaultAccount: zod.z.string().optional()
});
//#endregion
//#region src/config/zod-schema.providers-whatsapp.ts
const ToolPolicyBySenderSchema = zod.z.record(zod.z.string(), require_zod_schema_channels_config.ToolPolicySchema).optional();
const WhatsAppGroupEntrySchema = zod.z.object({
	requireMention: zod.z.boolean().optional(),
	tools: require_zod_schema_channels_config.ToolPolicySchema,
	toolsBySender: ToolPolicyBySenderSchema,
	systemPrompt: zod.z.string().optional()
}).strict().optional();
const WhatsAppGroupsSchema = zod.z.record(zod.z.string(), WhatsAppGroupEntrySchema).optional();
const WhatsAppDirectEntrySchema = zod.z.object({ systemPrompt: zod.z.string().optional() }).strict().optional();
const WhatsAppDirectSchema = zod.z.record(zod.z.string(), WhatsAppDirectEntrySchema).optional();
const WhatsAppAckReactionSchema = zod.z.object({
	emoji: zod.z.string().optional(),
	direct: zod.z.boolean().optional().default(true),
	group: zod.z.enum([
		"always",
		"mentions",
		"never"
	]).optional().default("mentions")
}).strict().optional();
const WhatsAppPluginHooksSchema = zod.z.object({ messageReceived: zod.z.boolean().optional() }).strict().optional();
function stripDeprecatedWhatsAppNoopKeys(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return value;
	if (!Object.hasOwn(value, "exposeErrorText")) return value;
	const next = { ...value };
	delete next.exposeErrorText;
	return next;
}
function buildWhatsAppCommonShape(params) {
	return {
		enabled: zod.z.boolean().optional(),
		capabilities: zod.z.array(zod.z.string()).optional(),
		markdown: require_zod_schema_core.MarkdownConfigSchema,
		configWrites: zod.z.boolean().optional(),
		sendReadReceipts: zod.z.boolean().optional(),
		messagePrefix: zod.z.string().optional(),
		responsePrefix: zod.z.string().optional(),
		dmPolicy: params.useDefaults ? require_zod_schema_core.DmPolicySchema.optional().default("pairing") : require_zod_schema_core.DmPolicySchema.optional(),
		selfChatMode: zod.z.boolean().optional(),
		allowFrom: zod.z.array(zod.z.string()).optional(),
		defaultTo: zod.z.string().optional(),
		groupAllowFrom: zod.z.array(zod.z.string()).optional(),
		groupPolicy: params.useDefaults ? require_zod_schema_core.GroupPolicySchema.optional().default("allowlist") : require_zod_schema_core.GroupPolicySchema.optional(),
		mentionPatterns: require_zod_schema_core.MentionPatternsPolicySchema.optional(),
		contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
		historyLimit: zod.z.number().int().min(0).optional(),
		dmHistoryLimit: zod.z.number().int().min(0).optional(),
		dms: zod.z.record(zod.z.string(), require_zod_schema_core.DmConfigSchema.optional()).optional(),
		textChunkLimit: zod.z.number().int().positive().optional(),
		streaming: require_zod_schema_core.ChannelDeliveryStreamingConfigSchema.optional(),
		groups: WhatsAppGroupsSchema,
		direct: WhatsAppDirectSchema,
		ackReaction: WhatsAppAckReactionSchema,
		reactionLevel: zod.z.enum([
			"off",
			"ack",
			"minimal",
			"extensive"
		]).optional(),
		debounceMs: params.useDefaults ? zod.z.number().int().nonnegative().optional().default(0) : zod.z.number().int().nonnegative().optional(),
		replyToMode: require_zod_schema_core.ReplyToModeSchema.optional(),
		heartbeat: require_zod_schema_channels_config.ChannelHeartbeatVisibilitySchema,
		healthMonitor: require_zod_schema_channels_config.ChannelHealthMonitorSchema,
		pluginHooks: WhatsAppPluginHooksSchema
	};
}
function enforceOpenDmPolicyAllowFromStar(params) {
	if (params.dmPolicy !== "open") return;
	if ((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(Array.isArray(params.allowFrom) ? params.allowFrom : []).includes("*")) return;
	params.ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: params.path ?? ["allowFrom"],
		message: params.message
	});
}
function enforceAllowlistDmPolicyAllowFrom(params) {
	if (params.dmPolicy !== "allowlist") return;
	if ((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(Array.isArray(params.allowFrom) ? params.allowFrom : []).length > 0) return;
	params.ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: params.path ?? ["allowFrom"],
		message: params.message
	});
}
const WhatsAppAccountObjectSchema = zod.z.object({
	...buildWhatsAppCommonShape({ useDefaults: false }),
	name: zod.z.string().optional(),
	enabled: zod.z.boolean().optional(),
	/** Override auth directory for this WhatsApp account (Baileys multi-file auth state). */
	authDir: zod.z.string().optional(),
	mediaMaxMb: zod.z.number().int().positive().optional()
}).strict();
const WhatsAppAccountSchema = zod.z.preprocess(stripDeprecatedWhatsAppNoopKeys, WhatsAppAccountObjectSchema);
const WhatsAppConfigObjectSchema = zod.z.object({
	...buildWhatsAppCommonShape({ useDefaults: true }),
	accounts: zod.z.record(zod.z.string(), WhatsAppAccountSchema.optional()).optional(),
	defaultAccount: zod.z.string().optional(),
	mediaMaxMb: zod.z.number().int().positive().optional().default(50),
	actions: zod.z.object({
		reactions: zod.z.boolean().optional(),
		sendMessage: zod.z.boolean().optional(),
		polls: zod.z.boolean().optional(),
		calls: zod.z.boolean().optional()
	}).strict().optional()
}).strict().superRefine((value, ctx) => {
	const defaultAccount = require_account_lookup.resolveAccountEntry(value.accounts, "default");
	enforceOpenDmPolicyAllowFromStar({
		dmPolicy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		message: "channels.whatsapp.dmPolicy=\"open\" requires channels.whatsapp.allowFrom to include \"*\""
	});
	enforceAllowlistDmPolicyAllowFrom({
		dmPolicy: value.dmPolicy,
		allowFrom: value.allowFrom,
		ctx,
		message: "channels.whatsapp.dmPolicy=\"allowlist\" requires channels.whatsapp.allowFrom to contain at least one sender ID"
	});
	if (!value.accounts) return;
	for (const [accountId, account] of Object.entries(value.accounts)) {
		if (!account) continue;
		const effectivePolicy = account.dmPolicy ?? (accountId === "default" ? void 0 : defaultAccount?.dmPolicy) ?? value.dmPolicy;
		const effectiveAllowFrom = account.allowFrom ?? (accountId === "default" ? void 0 : defaultAccount?.allowFrom) ?? value.allowFrom;
		enforceOpenDmPolicyAllowFromStar({
			dmPolicy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.whatsapp.accounts.*.dmPolicy=\"open\" requires channels.whatsapp.accounts.*.allowFrom (or channels.whatsapp.allowFrom) to include \"*\""
		});
		enforceAllowlistDmPolicyAllowFrom({
			dmPolicy: effectivePolicy,
			allowFrom: effectiveAllowFrom,
			ctx,
			path: [
				"accounts",
				accountId,
				"allowFrom"
			],
			message: "channels.whatsapp.accounts.*.dmPolicy=\"allowlist\" requires channels.whatsapp.accounts.*.allowFrom (or channels.whatsapp.allowFrom) to contain at least one sender ID"
		});
	}
});
zod.z.preprocess(stripDeprecatedWhatsAppNoopKeys, WhatsAppConfigObjectSchema);
//#endregion
//#region extensions/msteams/src/config-schema.ts
const MSTeamsChannelConfigSchema = require_config_schema.buildChannelConfigSchema(MSTeamsConfigSchema, { uiHints: {
	"": {
		label: "MS Teams",
		help: "Microsoft Teams channel provider configuration and provider-specific policy toggles. Use this section to isolate Teams behavior from other enterprise chat providers."
	},
	configWrites: {
		label: "MS Teams Config Writes",
		help: "Allow Microsoft Teams to write config in response to channel events/commands (default: true)."
	},
	cloud: {
		label: "MS Teams Cloud",
		help: "Teams SDK cloud environment for auth, token validation, and token services: \"Public\", \"USGov\", \"USGovDoD\", or \"China\" (default: Public)."
	},
	serviceUrl: {
		label: "MS Teams Service URL",
		help: "Bot Connector service URL for SDK proactive sends/edits/deletes. Set with cloud for USGov/DoD; set alone for GCC."
	},
	graphMediaFallback: {
		label: "MS Teams Graph Media Fallback",
		help: "Query Microsoft Graph for unresolved channel or group-chat HTML media. Adds one lookup per matching message when enabled (default: false)."
	},
	streaming: {
		label: "MS Teams Streaming",
		help: "Microsoft Teams preview/progress streaming mode: \"off\" | \"partial\" | \"block\" | \"progress\". Personal chats use Teams native streaminfo progress when available."
	},
	"streaming.progress.label": {
		label: "MS Teams Progress Label",
		help: "Initial progress title. Use \"auto\" for built-in single-word labels, a custom string, or false to hide the title."
	},
	"streaming.progress.labels": {
		label: "MS Teams Progress Label Pool",
		help: "Candidate labels for streaming.progress.label=\"auto\". Leave unset to use Operator built-in progress labels."
	},
	"streaming.progress.maxLines": {
		label: "MS Teams Progress Max Lines",
		help: "Maximum number of compact progress lines to keep below the progress title (default: 8)."
	},
	"streaming.progress.maxLineChars": {
		label: "MS Teams Progress Max Line Chars",
		help: "Maximum characters per compact progress line before truncation (default: 120). Prose cuts at word boundaries; commands and paths keep useful suffixes."
	},
	"streaming.progress.toolProgress": {
		label: "MS Teams Progress Tool Lines",
		help: "Show compact tool/progress lines in progress mode (default: true). Set false to keep only the title until final delivery."
	},
	"streaming.progress.commandText": {
		label: "MS Teams Progress Command Text",
		help: "Command/exec detail in progress lines: \"raw\" preserves released behavior; \"status\" shows only the tool label."
	}
} });
//#endregion
Object.defineProperty(exports, "MSTeamsChannelConfigSchema", {
	enumerable: true,
	get: function() {
		return MSTeamsChannelConfigSchema;
	}
});
