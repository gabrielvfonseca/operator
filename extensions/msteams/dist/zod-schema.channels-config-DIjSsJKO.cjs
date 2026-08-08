const require_zod_schema_core = require("./zod-schema.core-B7xBEBon.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_parse_duration = require("./parse-duration-Csu-f48Z.cjs");
const require_network_mode = require("./network-mode-DcJhB8iN.cjs");
let zod = require("zod");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/config/web-search-legacy-provider-keys.ts
/** Legacy config keys that used to live under web search provider config. */
const LEGACY_WEB_SEARCH_PROVIDER_CONFIG_KEYS = /* @__PURE__ */ new Set([
	"brave",
	"duckduckgo",
	"exa",
	"firecrawl",
	"gemini",
	"grok",
	"kimi",
	"minimax",
	"ollama",
	"perplexity",
	"searxng",
	"tavily"
]);
//#endregion
//#region src/config/zod-schema.agent-model.ts
/** Schema for agent model config accepting a string or fallback object. */
const AgentModelSchema = zod.z.union([zod.z.string(), zod.z.object({
	primary: zod.z.string().optional(),
	fallbacks: zod.z.array(zod.z.string()).optional()
}).strict()]);
const AgentToolModelSchema = zod.z.union([zod.z.string(), zod.z.object({
	primary: zod.z.string().optional(),
	fallbacks: zod.z.array(zod.z.string()).optional(),
	timeoutMs: zod.z.number().int().positive().optional()
}).strict()]);
//#endregion
//#region src/config/zod-schema.agent-runtime.ts
function validateSandboxBindEntries(binds, ctx) {
	if (!binds) return;
	for (let i = 0; i < binds.length; i += 1) {
		const bind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(binds[i]) ?? "";
		if (!bind) {
			ctx.addIssue({
				code: zod.z.ZodIssueCode.custom,
				path: ["binds", i],
				message: "Sandbox security: bind mount entry must be a non-empty string."
			});
			continue;
		}
		const parsed = require_network_mode.splitSandboxBindSpec(bind);
		const source = (parsed ? parsed.host : bind).trim();
		if (!require_network_mode.isSandboxHostPathAbsolute(source)) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: ["binds", i],
			message: `Sandbox security: bind mount "${bind}" uses a non-absolute source path "${source}". Only absolute POSIX or Windows drive-letter paths are supported for sandbox binds.`
		});
	}
}
const AgentRunRetriesConfigSchema = zod.z.object({
	base: zod.z.number().int().positive().optional(),
	perProfile: zod.z.number().int().nonnegative().optional(),
	min: zod.z.number().int().positive().optional(),
	max: zod.z.number().int().positive().optional()
}).strict().refine((data) => {
	if (data.min !== void 0 && data.max !== void 0) return data.max >= data.min;
	return true;
}, {
	message: "max must be greater than or equal to min",
	path: ["max"]
});
const AgentEntryEmbeddedAgentConfigSchema = zod.z.object({ executionContract: zod.z.union([zod.z.literal("default"), zod.z.literal("strict-agentic")]).optional() }).strict();
const HeartbeatSchema = zod.z.object({
	every: zod.z.string().optional(),
	activeHours: zod.z.object({
		start: zod.z.string().optional(),
		end: zod.z.string().optional(),
		timezone: zod.z.string().optional()
	}).strict().optional(),
	model: zod.z.string().optional(),
	session: zod.z.string().optional(),
	includeReasoning: zod.z.boolean().optional(),
	target: zod.z.string().optional(),
	directPolicy: zod.z.union([zod.z.literal("allow"), zod.z.literal("block")]).optional(),
	to: zod.z.string().optional(),
	accountId: zod.z.string().optional(),
	prompt: zod.z.string().optional(),
	includeSystemPromptSection: zod.z.boolean().optional(),
	ackMaxChars: zod.z.number().int().nonnegative().optional(),
	suppressToolErrorWarnings: zod.z.boolean().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	lightContext: zod.z.boolean().optional(),
	isolatedSession: zod.z.boolean().optional(),
	skipWhenBusy: zod.z.boolean().optional()
}).strict().superRefine((val, ctx) => {
	if (!val.every) return;
	try {
		require_parse_duration.parseDurationMs(val.every, { defaultUnit: "m" });
	} catch {
		ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: ["every"],
			message: "invalid duration (use ms, s, m, h)"
		});
	}
	const active = val.activeHours;
	if (!active) return;
	const timePattern = /^([01]\d|2[0-3]|24):([0-5]\d)$/;
	const validateTime = (raw, opts, path) => {
		if (!raw) return;
		if (!timePattern.test(raw)) {
			ctx.addIssue({
				code: zod.z.ZodIssueCode.custom,
				path: ["activeHours", path],
				message: "invalid time (use \"HH:MM\" 24h format)"
			});
			return;
		}
		const [hourStr, minuteStr] = raw.split(":");
		const hour = Number(hourStr);
		const minute = Number(minuteStr);
		if (hour === 24 && minute !== 0) {
			ctx.addIssue({
				code: zod.z.ZodIssueCode.custom,
				path: ["activeHours", path],
				message: "invalid time (24:00 is the only allowed 24:xx value)"
			});
			return;
		}
		if (hour === 24 && !opts.allow24) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: ["activeHours", path],
			message: "invalid time (start cannot be 24:00)"
		});
	};
	validateTime(active.start, { allow24: false }, "start");
	validateTime(active.end, { allow24: true }, "end");
}).optional();
const SandboxDockerSchema = zod.z.object({
	image: zod.z.string().optional(),
	containerPrefix: zod.z.string().optional(),
	workdir: zod.z.string().optional(),
	readOnlyRoot: zod.z.boolean().optional(),
	tmpfs: zod.z.array(zod.z.string()).optional(),
	network: zod.z.string().optional(),
	user: zod.z.string().optional(),
	capDrop: zod.z.array(zod.z.string()).optional(),
	env: zod.z.record(zod.z.string(), zod.z.string()).optional(),
	setupCommand: zod.z.union([zod.z.string(), zod.z.array(zod.z.string())]).transform((value) => Array.isArray(value) ? value.join("\n") : value).pipe(zod.z.string()).optional(),
	pidsLimit: zod.z.number().int().positive().optional(),
	memory: zod.z.union([zod.z.string(), zod.z.number()]).optional(),
	memorySwap: zod.z.union([zod.z.string(), zod.z.number()]).optional(),
	cpus: zod.z.number().positive().optional(),
	gpus: zod.z.string().min(1).optional(),
	ulimits: zod.z.record(zod.z.string(), zod.z.union([
		zod.z.string(),
		zod.z.number(),
		zod.z.object({
			soft: zod.z.number().int().nonnegative().optional(),
			hard: zod.z.number().int().nonnegative().optional()
		}).strict()
	])).optional(),
	seccompProfile: zod.z.string().optional(),
	apparmorProfile: zod.z.string().optional(),
	dns: zod.z.array(zod.z.string()).optional(),
	extraHosts: zod.z.array(zod.z.string()).optional(),
	binds: zod.z.array(zod.z.string()).optional(),
	dangerouslyAllowReservedContainerTargets: zod.z.boolean().optional(),
	dangerouslyAllowExternalBindSources: zod.z.boolean().optional(),
	dangerouslyAllowContainerNamespaceJoin: zod.z.boolean().optional()
}).strict().superRefine((data, ctx) => {
	validateSandboxBindEntries(data.binds, ctx);
	const blockedNetworkReason = require_network_mode.getBlockedNetworkModeReason({
		network: data.network,
		allowContainerNamespaceJoin: data.dangerouslyAllowContainerNamespaceJoin === true
	});
	if (blockedNetworkReason === "host") ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["network"],
		message: "Sandbox security: network mode \"host\" is blocked. Use \"bridge\" or \"none\" instead."
	});
	if (blockedNetworkReason === "container_namespace_join") ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["network"],
		message: "Sandbox security: network mode \"container:*\" is blocked by default. Use a custom bridge network, or set dangerouslyAllowContainerNamespaceJoin=true only when you fully trust this runtime."
	});
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(data.seccompProfile ?? "") === "unconfined") ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["seccompProfile"],
		message: "Sandbox security: seccomp profile \"unconfined\" is blocked. Use a custom seccomp profile file or omit this setting."
	});
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(data.apparmorProfile ?? "") === "unconfined") ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["apparmorProfile"],
		message: "Sandbox security: apparmor profile \"unconfined\" is blocked. Use a named AppArmor profile or omit this setting."
	});
}).optional();
const SandboxBrowserSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	image: zod.z.string().optional(),
	containerPrefix: zod.z.string().optional(),
	network: zod.z.string().optional(),
	cdpPort: zod.z.number().int().positive().optional(),
	cdpSourceRange: zod.z.string().optional(),
	vncPort: zod.z.number().int().positive().optional(),
	noVncPort: zod.z.number().int().positive().optional(),
	headless: zod.z.boolean().optional(),
	enableNoVnc: zod.z.boolean().optional(),
	allowHostControl: zod.z.boolean().optional(),
	autoStart: zod.z.boolean().optional(),
	autoStartTimeoutMs: zod.z.number().int().positive().optional(),
	binds: zod.z.array(zod.z.string()).optional()
}).superRefine((data, ctx) => {
	validateSandboxBindEntries(data.binds, ctx);
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(data.network ?? "") === "host") ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["network"],
		message: "Sandbox security: browser network mode \"host\" is blocked. Use \"bridge\" or a custom bridge network instead."
	});
}).strict().optional();
const SandboxPruneSchema = zod.z.object({
	idleHours: zod.z.number().int().nonnegative().optional(),
	maxAgeDays: zod.z.number().int().nonnegative().optional()
}).strict().optional();
const AgentContextLimitsSchema = zod.z.object({
	memoryGetMaxChars: zod.z.number().int().min(1).max(25e4).optional(),
	memoryGetDefaultLines: zod.z.number().int().min(1).max(5e3).optional(),
	toolResultMaxChars: zod.z.number().int().min(1).max(1e6).optional(),
	postCompactionMaxChars: zod.z.number().int().min(1).max(5e4).optional()
}).strict().optional();
const AgentSkillsLimitsSchema = zod.z.object({ maxSkillsPromptChars: zod.z.number().int().min(0).optional() }).strict().optional();
const ToolPolicySchema = zod.z.object({
	allow: zod.z.array(zod.z.string()).optional(),
	alsoAllow: zod.z.array(zod.z.string()).optional(),
	deny: zod.z.array(zod.z.string()).optional()
}).strict().superRefine((value, ctx) => {
	if (value.allow && value.allow.length > 0 && value.alsoAllow && value.alsoAllow.length > 0) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message: "tools policy cannot set both allow and alsoAllow in the same scope (merge alsoAllow into allow, or remove allow and use profile + alsoAllow)"
	});
}).optional();
const ToolPolicyBySenderSchema = zod.z.record(zod.z.string(), ToolPolicySchema).optional();
const TrimmedOptionalConfigStringSchema = zod.z.string().transform((value) => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : void 0;
}).optional();
const CodexAllowedDomainsSchema = zod.z.array(zod.z.string()).transform((values) => {
	const deduped = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(values.map((value) => value.trim()).filter((value) => value.length > 0));
	return deduped.length > 0 ? deduped : void 0;
}).optional();
const CodexUserLocationSchema = zod.z.object({
	country: TrimmedOptionalConfigStringSchema,
	region: TrimmedOptionalConfigStringSchema,
	city: TrimmedOptionalConfigStringSchema,
	timezone: TrimmedOptionalConfigStringSchema
}).strict().transform((value) => {
	return value.country || value.region || value.city || value.timezone ? value : void 0;
}).optional();
const BLOCKED_WEB_SEARCH_KEYS_ISSUE_FIELD = "__openclawBlockedWebSearchKeys";
const ToolsWebSearchSchema = zod.z.preprocess((value) => {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return value;
	const blockedKeys = Object.getOwnPropertyNames(value).filter((key) => require_prototype_keys.isBlockedObjectKey(key));
	if (blockedKeys.length === 0) return value;
	return {
		...value,
		[BLOCKED_WEB_SEARCH_KEYS_ISSUE_FIELD]: blockedKeys
	};
}, zod.z.object({
	enabled: zod.z.boolean().optional(),
	provider: zod.z.string().optional(),
	maxResults: zod.z.number().int().positive().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	cacheTtlMinutes: zod.z.number().nonnegative().optional(),
	apiKey: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	openaiCodex: zod.z.object({
		enabled: zod.z.boolean().optional(),
		mode: zod.z.union([zod.z.literal("cached"), zod.z.literal("live")]).optional(),
		allowedDomains: CodexAllowedDomainsSchema,
		contextSize: zod.z.union([
			zod.z.literal("low"),
			zod.z.literal("medium"),
			zod.z.literal("high")
		]).optional(),
		userLocation: CodexUserLocationSchema
	}).strict().optional()
}).catchall(zod.z.unknown()).superRefine((value, ctx) => {
	const blockedKeys = value[BLOCKED_WEB_SEARCH_KEYS_ISSUE_FIELD];
	if (Array.isArray(blockedKeys)) for (const key of blockedKeys) {
		if (typeof key !== "string") continue;
		ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [key],
			message: "tools.web.search must not contain blocked object keys"
		});
	}
	for (const [key, entry] of Object.entries(value)) {
		if (key === BLOCKED_WEB_SEARCH_KEYS_ISSUE_FIELD || require_prototype_keys.isBlockedObjectKey(key)) continue;
		if (LEGACY_WEB_SEARCH_PROVIDER_CONFIG_KEYS.has(key) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry)) ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [key],
			message: "legacy web_search provider config must use plugins.entries.<plugin>.config.webSearch"
		});
	}
})).optional();
const ToolsWebFetchSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	provider: zod.z.string().optional(),
	maxChars: zod.z.number().int().positive().optional(),
	maxCharsCap: zod.z.number().int().positive().optional(),
	maxResponseBytes: zod.z.number().int().positive().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	cacheTtlMinutes: zod.z.number().nonnegative().optional(),
	maxRedirects: zod.z.number().int().nonnegative().optional(),
	userAgent: zod.z.string().optional(),
	readability: zod.z.boolean().optional(),
	useTrustedEnvProxy: zod.z.boolean().optional(),
	ssrfPolicy: zod.z.object({
		allowRfc2544BenchmarkRange: zod.z.boolean().optional(),
		allowIpv6UniqueLocalRange: zod.z.boolean().optional()
	}).strict().optional(),
	firecrawl: zod.z.object({
		enabled: zod.z.boolean().optional(),
		apiKey: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
		baseUrl: zod.z.string().optional(),
		onlyMainContent: zod.z.boolean().optional(),
		maxAgeMs: zod.z.number().int().nonnegative().optional(),
		timeoutSeconds: zod.z.number().int().positive().optional()
	}).strict().optional()
}).strict().optional();
const ToolsWebXSearchSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	model: zod.z.string().optional(),
	inlineCitations: zod.z.boolean().optional(),
	maxTurns: zod.z.number().int().optional(),
	timeoutSeconds: zod.z.number().int().positive().optional(),
	cacheTtlMinutes: zod.z.number().nonnegative().optional()
}).strict().optional();
const ToolsWebSchema = zod.z.object({
	search: ToolsWebSearchSchema,
	fetch: ToolsWebFetchSchema,
	x_search: ToolsWebXSearchSchema
}).strict().optional();
const ToolProfileSchema = zod.z.union([
	zod.z.literal("minimal"),
	zod.z.literal("coding"),
	zod.z.literal("messaging"),
	zod.z.literal("full")
]).optional();
function addAllowAlsoAllowConflictIssue(value, ctx, message) {
	if (value.allow && value.allow.length > 0 && value.alsoAllow && value.alsoAllow.length > 0) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		message
	});
}
const ToolPolicyWithProfileSchema = zod.z.object({
	allow: zod.z.array(zod.z.string()).optional(),
	alsoAllow: zod.z.array(zod.z.string()).optional(),
	deny: zod.z.array(zod.z.string()).optional(),
	profile: ToolProfileSchema
}).strict().superRefine((value, ctx) => {
	addAllowAlsoAllowConflictIssue(value, ctx, "tools.byProvider policy cannot set both allow and alsoAllow in the same scope (merge alsoAllow into allow, or remove allow and use profile + alsoAllow)");
});
const ElevatedAllowFromSchema = zod.z.record(zod.z.string(), zod.z.array(zod.z.union([zod.z.string(), zod.z.number()]))).optional();
const ToolExecApplyPatchSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	workspaceOnly: zod.z.boolean().optional(),
	allowModels: zod.z.array(zod.z.string()).optional()
}).strict().optional();
const ToolExecSafeBinProfileSchema = zod.z.object({
	minPositional: zod.z.number().int().nonnegative().optional(),
	maxPositional: zod.z.number().int().nonnegative().optional(),
	allowedValueFlags: zod.z.array(zod.z.string()).optional(),
	deniedFlags: zod.z.array(zod.z.string()).optional()
}).strict();
const ToolExecBaseShape = {
	host: zod.z.enum([
		"auto",
		"sandbox",
		"gateway",
		"node"
	]).optional(),
	mode: zod.z.enum([
		"deny",
		"allowlist",
		"ask",
		"auto",
		"full"
	]).optional(),
	security: zod.z.enum([
		"deny",
		"allowlist",
		"full"
	]).optional(),
	ask: zod.z.enum([
		"off",
		"on-miss",
		"always"
	]).optional(),
	node: zod.z.string().optional(),
	pathPrepend: zod.z.array(zod.z.string()).optional(),
	safeBins: zod.z.array(zod.z.string()).optional(),
	strictInlineEval: zod.z.boolean().optional(),
	commandHighlighting: zod.z.boolean().optional(),
	safeBinTrustedDirs: zod.z.array(zod.z.string()).optional(),
	safeBinProfiles: zod.z.record(zod.z.string(), ToolExecSafeBinProfileSchema).optional(),
	reviewer: zod.z.object({
		model: AgentModelSchema.optional(),
		timeoutMs: zod.z.number().int().positive().optional()
	}).strict().optional(),
	backgroundMs: zod.z.number().int().positive().optional(),
	timeoutSec: zod.z.number().int().positive().optional(),
	cleanupMs: zod.z.number().int().positive().optional(),
	notifyOnExit: zod.z.boolean().optional(),
	notifyOnExitEmptySuccess: zod.z.boolean().optional(),
	applyPatch: ToolExecApplyPatchSchema
};
function addExecPolicyModeConflictIssue(value, ctx) {
	if (value.mode === void 0 || value.security === void 0 && value.ask === void 0) return;
	ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["mode"],
		message: "tools.exec.mode cannot be combined with tools.exec.security or tools.exec.ask"
	});
}
const AgentToolExecSchema = zod.z.object({
	...ToolExecBaseShape,
	approvalRunningNoticeMs: zod.z.number().int().nonnegative().optional()
}).strict().superRefine(addExecPolicyModeConflictIssue).optional();
const ToolExecSchema = zod.z.object(ToolExecBaseShape).strict().superRefine(addExecPolicyModeConflictIssue).optional();
const ToolFsSchema = zod.z.object({ workspaceOnly: zod.z.boolean().optional() }).strict().optional();
const ToolLoopDetectionDetectorSchema = zod.z.object({
	genericRepeat: zod.z.boolean().optional(),
	knownPollNoProgress: zod.z.boolean().optional(),
	pingPong: zod.z.boolean().optional()
}).strict().optional();
const ToolLoopPostCompactionGuardSchema = zod.z.object({ windowSize: zod.z.number().int().positive().optional() }).strict().optional();
const ToolLoopDetectionSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	historySize: zod.z.number().int().positive().optional(),
	warningThreshold: zod.z.number().int().positive().optional(),
	unknownToolThreshold: zod.z.number().int().positive().optional(),
	criticalThreshold: zod.z.number().int().positive().optional(),
	globalCircuitBreakerThreshold: zod.z.number().int().positive().optional(),
	detectors: ToolLoopDetectionDetectorSchema,
	postCompactionGuard: ToolLoopPostCompactionGuardSchema
}).strict().superRefine((value, ctx) => {
	if (value.warningThreshold !== void 0 && value.criticalThreshold !== void 0 && value.warningThreshold >= value.criticalThreshold) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["criticalThreshold"],
		message: "tools.loopDetection.warningThreshold must be lower than criticalThreshold."
	});
	if (value.criticalThreshold !== void 0 && value.globalCircuitBreakerThreshold !== void 0 && value.criticalThreshold >= value.globalCircuitBreakerThreshold) ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["globalCircuitBreakerThreshold"],
		message: "tools.loopDetection.criticalThreshold must be lower than globalCircuitBreakerThreshold."
	});
}).optional();
const ToolSearchSchema = zod.z.union([zod.z.boolean(), zod.z.object({
	enabled: zod.z.boolean().optional(),
	mode: zod.z.enum([
		"code",
		"tools",
		"directory"
	]).optional(),
	codeTimeoutMs: zod.z.number().int().positive().optional(),
	searchDefaultLimit: zod.z.number().int().positive().optional(),
	maxSearchLimit: zod.z.number().int().positive().optional()
}).strict()]).optional();
const CodeModeSchema = zod.z.union([zod.z.boolean(), zod.z.object({
	enabled: zod.z.boolean().optional(),
	runtime: zod.z.literal("quickjs-wasi").optional(),
	mode: zod.z.literal("only").optional(),
	languages: zod.z.array(zod.z.enum(["javascript", "typescript"])).optional(),
	timeoutMs: zod.z.number().int().positive().optional(),
	memoryLimitBytes: zod.z.number().int().positive().optional(),
	maxOutputBytes: zod.z.number().int().positive().optional(),
	maxSnapshotBytes: zod.z.number().int().positive().optional(),
	maxPendingToolCalls: zod.z.number().int().positive().optional(),
	snapshotTtlSeconds: zod.z.number().int().positive().optional(),
	searchDefaultLimit: zod.z.number().int().positive().optional(),
	maxSearchLimit: zod.z.number().int().positive().optional()
}).strict()]).optional();
const SandboxSshSchema = zod.z.object({
	target: zod.z.string().min(1).optional(),
	command: zod.z.string().min(1).optional(),
	workspaceRoot: zod.z.string().min(1).optional(),
	strictHostKeyChecking: zod.z.boolean().optional(),
	updateHostKeys: zod.z.boolean().optional(),
	identityFile: zod.z.string().min(1).optional(),
	certificateFile: zod.z.string().min(1).optional(),
	knownHostsFile: zod.z.string().min(1).optional(),
	identityData: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	certificateData: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
	knownHostsData: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive)
}).strict().optional();
const AgentSandboxSchema = zod.z.object({
	mode: zod.z.union([
		zod.z.literal("off"),
		zod.z.literal("non-main"),
		zod.z.literal("all")
	]).optional(),
	backend: zod.z.string().min(1).optional(),
	workspaceAccess: zod.z.union([
		zod.z.literal("none"),
		zod.z.literal("ro"),
		zod.z.literal("rw")
	]).optional(),
	sessionToolsVisibility: zod.z.union([zod.z.literal("spawned"), zod.z.literal("all")]).optional(),
	scope: zod.z.union([
		zod.z.literal("session"),
		zod.z.literal("agent"),
		zod.z.literal("shared")
	]).optional(),
	workspaceRoot: zod.z.string().optional(),
	docker: SandboxDockerSchema,
	ssh: SandboxSshSchema,
	browser: SandboxBrowserSchema,
	prune: SandboxPruneSchema
}).strict().superRefine((data, ctx) => {
	if (require_network_mode.getBlockedNetworkModeReason({
		network: data.browser?.network,
		allowContainerNamespaceJoin: data.docker?.dangerouslyAllowContainerNamespaceJoin === true
	}) === "container_namespace_join") ctx.addIssue({
		code: zod.z.ZodIssueCode.custom,
		path: ["browser", "network"],
		message: "Sandbox security: browser network mode \"container:*\" is blocked by default. Set sandbox.docker.dangerouslyAllowContainerNamespaceJoin=true only when you fully trust this runtime."
	});
}).optional();
const CommonToolPolicyFields = {
	profile: ToolProfileSchema,
	allow: zod.z.array(zod.z.string()).optional(),
	alsoAllow: zod.z.array(zod.z.string()).optional(),
	deny: zod.z.array(zod.z.string()).optional(),
	byProvider: zod.z.record(zod.z.string(), ToolPolicyWithProfileSchema).optional(),
	toolsBySender: ToolPolicyBySenderSchema
};
const MessageToolConfigSchema = zod.z.object({
	allowCrossContextSend: zod.z.boolean().optional(),
	crossContext: zod.z.object({
		allowWithinProvider: zod.z.boolean().optional(),
		allowAcrossProviders: zod.z.boolean().optional(),
		marker: zod.z.object({
			enabled: zod.z.boolean().optional(),
			prefix: zod.z.string().optional(),
			suffix: zod.z.string().optional()
		}).strict().optional()
	}).strict().optional(),
	actions: zod.z.object({ allow: zod.z.array(zod.z.string()).optional() }).strict().optional(),
	broadcast: zod.z.object({ enabled: zod.z.boolean().optional() }).strict().optional()
}).strict().optional();
const AgentToolsSchema = zod.z.object({
	...CommonToolPolicyFields,
	codeMode: CodeModeSchema,
	elevated: zod.z.object({
		enabled: zod.z.boolean().optional(),
		allowFrom: ElevatedAllowFromSchema
	}).strict().optional(),
	exec: AgentToolExecSchema,
	fs: ToolFsSchema,
	loopDetection: ToolLoopDetectionSchema,
	message: MessageToolConfigSchema,
	sandbox: zod.z.object({ tools: ToolPolicySchema }).strict().optional()
}).strict().superRefine((value, ctx) => {
	addAllowAlsoAllowConflictIssue(value, ctx, "agent tools cannot set both allow and alsoAllow in the same scope (merge alsoAllow into allow, or remove allow and use profile + alsoAllow)");
}).optional();
const MemorySearchSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	sources: zod.z.array(zod.z.union([zod.z.literal("memory"), zod.z.literal("sessions")])).optional(),
	extraPaths: zod.z.array(zod.z.string()).optional(),
	qmd: zod.z.object({ extraCollections: zod.z.array(zod.z.object({
		path: zod.z.string(),
		name: zod.z.string().optional(),
		pattern: zod.z.string().optional()
	}).strict()).optional() }).strict().optional(),
	multimodal: zod.z.object({
		enabled: zod.z.boolean().optional(),
		modalities: zod.z.array(zod.z.union([
			zod.z.literal("image"),
			zod.z.literal("audio"),
			zod.z.literal("all")
		])).optional(),
		maxFileBytes: zod.z.number().int().positive().optional()
	}).strict().optional(),
	experimental: zod.z.object({ sessionMemory: zod.z.boolean().optional() }).strict().optional(),
	provider: zod.z.string().optional(),
	remote: zod.z.object({
		baseUrl: zod.z.string().optional(),
		apiKey: require_zod_schema_core.SecretInputSchema.optional().register(require_zod_schema_core.sensitive),
		headers: zod.z.record(zod.z.string(), zod.z.string()).optional(),
		nonBatchConcurrency: zod.z.number().int().positive().optional(),
		batch: zod.z.object({
			enabled: zod.z.boolean().optional(),
			wait: zod.z.boolean().optional(),
			concurrency: zod.z.number().int().positive().optional(),
			pollIntervalMs: zod.z.number().int().nonnegative().optional(),
			timeoutMinutes: zod.z.number().int().positive().optional()
		}).strict().optional()
	}).strict().optional(),
	fallback: zod.z.string().optional(),
	model: zod.z.string().optional(),
	inputType: zod.z.string().min(1).optional(),
	queryInputType: zod.z.string().min(1).optional(),
	documentInputType: zod.z.string().min(1).optional(),
	outputDimensionality: zod.z.number().int().positive().optional(),
	local: zod.z.object({
		modelPath: zod.z.string().optional(),
		modelCacheDir: zod.z.string().optional(),
		contextSize: zod.z.union([zod.z.number().int().positive(), zod.z.literal("auto")]).optional()
	}).strict().optional(),
	store: zod.z.object({
		driver: zod.z.literal("sqlite").optional(),
		fts: zod.z.object({ tokenizer: zod.z.union([zod.z.literal("unicode61"), zod.z.literal("trigram")]).optional() }).strict().optional(),
		vector: zod.z.object({
			enabled: zod.z.boolean().optional(),
			extensionPath: zod.z.string().optional()
		}).strict().optional()
	}).strict().optional(),
	chunking: zod.z.object({
		tokens: zod.z.number().int().positive().optional(),
		overlap: zod.z.number().int().nonnegative().optional()
	}).strict().optional(),
	sync: zod.z.object({
		onSessionStart: zod.z.boolean().optional(),
		onSearch: zod.z.boolean().optional(),
		watch: zod.z.boolean().optional(),
		watchDebounceMs: zod.z.number().int().nonnegative().optional(),
		intervalMinutes: zod.z.number().int().nonnegative().optional(),
		embeddingBatchTimeoutSeconds: zod.z.number().int().positive().optional(),
		sessions: zod.z.object({
			deltaBytes: zod.z.number().int().nonnegative().optional(),
			deltaMessages: zod.z.number().int().nonnegative().optional(),
			postCompactionForce: zod.z.boolean().optional()
		}).strict().optional()
	}).strict().optional(),
	query: zod.z.object({
		maxResults: zod.z.number().int().positive().optional(),
		minScore: zod.z.number().min(0).max(1).optional(),
		hybrid: zod.z.object({
			enabled: zod.z.boolean().optional(),
			vectorWeight: zod.z.number().min(0).max(1).optional(),
			textWeight: zod.z.number().min(0).max(1).optional(),
			candidateMultiplier: zod.z.number().int().positive().optional(),
			mmr: zod.z.object({
				enabled: zod.z.boolean().optional(),
				lambda: zod.z.number().min(0).max(1).optional()
			}).strict().optional(),
			temporalDecay: zod.z.object({
				enabled: zod.z.boolean().optional(),
				halfLifeDays: zod.z.number().int().positive().optional()
			}).strict().optional()
		}).strict().optional()
	}).strict().optional(),
	cache: zod.z.object({
		enabled: zod.z.boolean().optional(),
		maxEntries: zod.z.number().int().positive().optional()
	}).strict().optional()
}).strict().optional();
const AgentRuntimeAcpSchema = zod.z.object({
	agent: zod.z.string().optional(),
	backend: zod.z.string().optional(),
	mode: zod.z.enum(["persistent", "oneshot"]).optional(),
	cwd: zod.z.string().optional()
}).strict().optional();
const AgentRuntimeSchema = zod.z.union([zod.z.object({ type: zod.z.literal("embedded") }).strict(), zod.z.object({
	type: zod.z.literal("acp"),
	acp: AgentRuntimeAcpSchema
}).strict()]).optional();
const AgentRuntimePolicySchema = zod.z.object({ id: zod.z.string().optional() }).strict().optional();
const AgentModelRuntimeEntrySchema = zod.z.object({
	alias: zod.z.string().optional(),
	params: zod.z.record(zod.z.string(), zod.z.unknown()).optional(),
	agentRuntime: AgentRuntimePolicySchema,
	streaming: zod.z.boolean().optional()
}).strict();
const AgentEntrySchema = zod.z.object({
	id: zod.z.string(),
	default: zod.z.boolean().optional(),
	name: zod.z.string().optional(),
	description: zod.z.string().optional(),
	workspace: zod.z.string().optional(),
	agentDir: zod.z.string().optional(),
	model: AgentModelSchema.optional(),
	utilityModel: zod.z.string().optional(),
	models: zod.z.record(zod.z.string(), AgentModelRuntimeEntrySchema).optional(),
	thinkingDefault: zod.z.enum([
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
	verboseDefault: zod.z.enum([
		"off",
		"on",
		"full"
	]).optional(),
	toolProgressDetail: zod.z.enum(["explain", "raw"]).optional(),
	reasoningDefault: zod.z.enum([
		"on",
		"off",
		"stream"
	]).optional(),
	fastModeDefault: zod.z.union([zod.z.boolean(), zod.z.literal("auto")]).optional(),
	contextInjection: zod.z.union([
		zod.z.literal("always"),
		zod.z.literal("continuation-skip"),
		zod.z.literal("never")
	]).optional(),
	bootstrapMaxChars: zod.z.number().int().positive().optional(),
	bootstrapTotalMaxChars: zod.z.number().int().positive().optional(),
	experimental: zod.z.object({ localModelLean: zod.z.boolean().optional() }).strict().optional(),
	skills: zod.z.array(zod.z.string()).optional(),
	memorySearch: MemorySearchSchema,
	humanDelay: require_zod_schema_core.HumanDelaySchema.optional(),
	tts: require_zod_schema_core.TtsConfigSchema,
	skillsLimits: AgentSkillsLimitsSchema,
	contextLimits: AgentContextLimitsSchema,
	contextTokens: zod.z.number().int().positive().optional(),
	heartbeat: HeartbeatSchema,
	identity: require_zod_schema_core.IdentitySchema,
	groupChat: require_zod_schema_core.GroupChatSchema,
	subagents: zod.z.object({
		delegationMode: zod.z.enum(["suggest", "prefer"]).optional(),
		allowAgents: zod.z.array(zod.z.string()).optional(),
		model: AgentModelSchema.optional(),
		thinking: zod.z.string().optional(),
		requireAgentId: zod.z.boolean().optional()
	}).strict().optional(),
	runRetries: AgentRunRetriesConfigSchema.optional(),
	embeddedAgent: AgentEntryEmbeddedAgentConfigSchema.optional(),
	sandbox: AgentSandboxSchema,
	params: zod.z.record(zod.z.string(), zod.z.unknown()).optional(),
	tools: AgentToolsSchema,
	runtime: AgentRuntimeSchema
}).strict();
const ToolsSchema = zod.z.object({
	...CommonToolPolicyFields,
	web: ToolsWebSchema,
	media: require_zod_schema_core.ToolsMediaSchema,
	links: require_zod_schema_core.ToolsLinksSchema,
	sessions: zod.z.object({ visibility: zod.z.enum([
		"self",
		"tree",
		"agent",
		"all"
	]).optional() }).strict().optional(),
	loopDetection: ToolLoopDetectionSchema,
	toolSearch: ToolSearchSchema,
	codeMode: CodeModeSchema,
	message: MessageToolConfigSchema,
	agentToAgent: zod.z.object({
		enabled: zod.z.boolean().optional(),
		allow: zod.z.array(zod.z.string()).optional()
	}).strict().optional(),
	elevated: zod.z.object({
		enabled: zod.z.boolean().optional(),
		allowFrom: ElevatedAllowFromSchema
	}).strict().optional(),
	exec: ToolExecSchema,
	fs: ToolFsSchema,
	subagents: zod.z.object({ tools: ToolPolicySchema }).strict().optional(),
	sandbox: zod.z.object({ tools: ToolPolicySchema }).strict().optional(),
	sessions_spawn: zod.z.object({ attachments: zod.z.object({
		enabled: zod.z.boolean().optional(),
		maxTotalBytes: zod.z.number().optional(),
		maxFiles: zod.z.number().optional(),
		maxFileBytes: zod.z.number().optional(),
		retainOnSessionKeep: zod.z.boolean().optional()
	}).strict().optional() }).strict().optional(),
	experimental: zod.z.object({ planTool: zod.z.boolean().optional() }).strict().optional()
}).strict().superRefine((value, ctx) => {
	addAllowAlsoAllowConflictIssue(value, ctx, "tools cannot set both allow and alsoAllow in the same scope (merge alsoAllow into allow, or remove allow and use profile + alsoAllow)");
}).optional();
//#endregion
//#region src/config/zod-schema.approvals.ts
/** Native exec approval mode accepted by config. */
const NativeExecApprovalEnableModeSchema = zod.z.union([zod.z.boolean(), zod.z.literal("auto")]);
const ExecApprovalForwardTargetSchema = zod.z.object({
	channel: zod.z.string().min(1),
	to: zod.z.string().min(1),
	accountId: zod.z.string().optional(),
	threadId: zod.z.union([zod.z.string(), zod.z.number()]).optional()
}).strict();
const ExecApprovalForwardingSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	mode: zod.z.union([
		zod.z.literal("session"),
		zod.z.literal("targets"),
		zod.z.literal("both")
	]).optional(),
	agentFilter: zod.z.array(zod.z.string()).optional(),
	sessionFilter: zod.z.array(zod.z.string()).optional(),
	targets: zod.z.array(ExecApprovalForwardTargetSchema).optional()
}).strict().optional();
const ApprovalsSchema = zod.z.object({
	exec: ExecApprovalForwardingSchema,
	plugin: ExecApprovalForwardingSchema
}).strict().optional();
//#endregion
//#region src/config/zod-schema.channels.ts
/** Optional heartbeat visibility controls shared by channel schemas. */
const ChannelHeartbeatVisibilitySchema = zod.z.object({
	showOk: zod.z.boolean().optional(),
	showAlerts: zod.z.boolean().optional(),
	useIndicator: zod.z.boolean().optional()
}).strict().optional();
const ChannelHealthMonitorSchema = zod.z.object({ enabled: zod.z.boolean().optional() }).strict().optional();
//#endregion
//#region src/config/zod-schema.channels-config.ts
const ChannelModelByChannelSchema = zod.z.record(zod.z.string(), zod.z.record(zod.z.string(), zod.z.string())).optional();
const ChannelBotLoopProtectionSchema = zod.z.object({
	enabled: zod.z.boolean().optional(),
	maxEventsPerWindow: zod.z.number().int().positive().optional(),
	windowSeconds: zod.z.number().int().positive().optional(),
	cooldownSeconds: zod.z.number().int().positive().optional()
}).strict();
function addLegacyChannelAcpBindingIssues(value, ctx, path = []) {
	if (!value || typeof value !== "object") return;
	if (Array.isArray(value)) {
		value.forEach((entry, index) => addLegacyChannelAcpBindingIssues(entry, ctx, [...path, index]));
		return;
	}
	const record = value;
	const bindings = record.bindings;
	if (bindings && typeof bindings === "object" && !Array.isArray(bindings)) {
		const acp = bindings.acp;
		if (acp && typeof acp === "object") ctx.addIssue({
			code: zod.z.ZodIssueCode.custom,
			path: [
				...path,
				"bindings",
				"acp"
			],
			message: "Legacy channel-local ACP bindings were removed; use top-level bindings[] entries."
		});
	}
	for (const [key, entry] of Object.entries(record)) addLegacyChannelAcpBindingIssues(entry, ctx, [...path, key]);
}
const ChannelsSchema = zod.z.object({
	defaults: zod.z.object({
		groupPolicy: require_zod_schema_core.GroupPolicySchema.optional(),
		contextVisibility: require_zod_schema_core.ContextVisibilityModeSchema.optional(),
		heartbeat: ChannelHeartbeatVisibilitySchema,
		botLoopProtection: ChannelBotLoopProtectionSchema.optional()
	}).strict().optional(),
	modelByChannel: ChannelModelByChannelSchema
}).passthrough().superRefine((value, ctx) => {
	addLegacyChannelAcpBindingIssues(value, ctx);
}).optional();
//#endregion
Object.defineProperty(exports, "AgentContextLimitsSchema", {
	enumerable: true,
	get: function() {
		return AgentContextLimitsSchema;
	}
});
Object.defineProperty(exports, "AgentEntrySchema", {
	enumerable: true,
	get: function() {
		return AgentEntrySchema;
	}
});
Object.defineProperty(exports, "AgentModelRuntimeEntrySchema", {
	enumerable: true,
	get: function() {
		return AgentModelRuntimeEntrySchema;
	}
});
Object.defineProperty(exports, "AgentModelSchema", {
	enumerable: true,
	get: function() {
		return AgentModelSchema;
	}
});
Object.defineProperty(exports, "AgentRunRetriesConfigSchema", {
	enumerable: true,
	get: function() {
		return AgentRunRetriesConfigSchema;
	}
});
Object.defineProperty(exports, "AgentSandboxSchema", {
	enumerable: true,
	get: function() {
		return AgentSandboxSchema;
	}
});
Object.defineProperty(exports, "AgentToolModelSchema", {
	enumerable: true,
	get: function() {
		return AgentToolModelSchema;
	}
});
Object.defineProperty(exports, "ApprovalsSchema", {
	enumerable: true,
	get: function() {
		return ApprovalsSchema;
	}
});
Object.defineProperty(exports, "ChannelBotLoopProtectionSchema", {
	enumerable: true,
	get: function() {
		return ChannelBotLoopProtectionSchema;
	}
});
Object.defineProperty(exports, "ChannelHealthMonitorSchema", {
	enumerable: true,
	get: function() {
		return ChannelHealthMonitorSchema;
	}
});
Object.defineProperty(exports, "ChannelHeartbeatVisibilitySchema", {
	enumerable: true,
	get: function() {
		return ChannelHeartbeatVisibilitySchema;
	}
});
Object.defineProperty(exports, "ChannelsSchema", {
	enumerable: true,
	get: function() {
		return ChannelsSchema;
	}
});
Object.defineProperty(exports, "ElevatedAllowFromSchema", {
	enumerable: true,
	get: function() {
		return ElevatedAllowFromSchema;
	}
});
Object.defineProperty(exports, "HeartbeatSchema", {
	enumerable: true,
	get: function() {
		return HeartbeatSchema;
	}
});
Object.defineProperty(exports, "MemorySearchSchema", {
	enumerable: true,
	get: function() {
		return MemorySearchSchema;
	}
});
Object.defineProperty(exports, "NativeExecApprovalEnableModeSchema", {
	enumerable: true,
	get: function() {
		return NativeExecApprovalEnableModeSchema;
	}
});
Object.defineProperty(exports, "ToolPolicySchema", {
	enumerable: true,
	get: function() {
		return ToolPolicySchema;
	}
});
Object.defineProperty(exports, "ToolsSchema", {
	enumerable: true,
	get: function() {
		return ToolsSchema;
	}
});
