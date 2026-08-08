const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./json-files-Bp0Z4DKb.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_fast_mode = require("./fast-mode-BD9s0nxq.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_runtime_status = require("./runtime-status-BGIjp9Ys.cjs");
const require_runner_entries = require("./runner.entries-C2SCXSy-.cjs");
const require_defaults = require("./defaults-BplP0QgT.cjs");
const require_model_selection_shared = require("./model-selection-shared-BMKAPuuQ.cjs");
const require_gateway_startup_speech_providers = require("./gateway-startup-speech-providers-DjyFgDFT.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_store = require("./store-DCwJguwr.cjs");
require("./model-selection-BvFurMxy.cjs");
require("./sessions-BOjfaI9B.cjs");
const require_token_format = require("./token-format-CytezBZb.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_format_relative = require("./format-relative-DEaTzxP-.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_model_auth = require("./model-auth-D9ZnqE0T.cjs");
const require_session_transcript_readers = require("./session-transcript-readers-B_YkR8f3.cjs");
const require_context = require("./context-Ddgh80NW.cjs");
const require_fast_mode$1 = require("./fast-mode-0YvHCt-K.cjs");
const require_usage_format = require("./usage-format-Ed9eVdJX.cjs");
const require_extra_params = require("./extra-params-CBjN2etI.cjs");
const require_git_commit = require("./git-commit-BccRuFJV.cjs");
const require_current_time = require("./current-time-oRtkR6fH.cjs");
require("./sandbox-CjshBxRn.cjs");
const require_model_overrides = require("./model-overrides-TK4Mzjpb.cjs");
const require_model_runtime = require("./model-runtime-CROqjzrf.cjs");
const require_fallback_notice_state = require("./fallback-notice-state-BYWmnLoR.cjs");
const require_agent_runtime_label = require("./agent-runtime-label-UoVo0nrE.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _openclaw_fs_safe_json = require("@openclaw/fs-safe/json");
//#region src/tts/status-config.ts
const DEFAULT_TTS_MAX_LENGTH = 1500;
const DEFAULT_TTS_SUMMARIZE = true;
const DEFAULT_OPENAI_TTS_BASE_URL = "https://api.openai.com/v1";
const MAX_STATUS_DETAIL_LENGTH = 96;
function resolveConfiguredTtsAutoMode(raw) {
	return require_gateway_startup_speech_providers.normalizeTtsAutoMode(raw.auto) ?? (raw.enabled ? "always" : "off");
}
function normalizeConfiguredSpeechProviderId(providerId) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(providerId);
	if (!normalized) return;
	return normalized === "edge" ? "microsoft" : normalized;
}
function normalizeTtsPersonaId(personaId) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(personaId ?? void 0);
}
function resolvePersonaPreferredProvider(raw, personaId) {
	if (!personaId || !raw.personas) return;
	for (const [id, persona] of Object.entries(raw.personas)) {
		if (normalizeTtsPersonaId(id) !== personaId) continue;
		return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(normalizeConfiguredSpeechProviderId(persona.provider) ?? persona.provider);
	}
}
function resolveTtsPrefsPathValue(prefsPath) {
	const configuredPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(prefsPath);
	if (configuredPath) return require_home_dir.resolveUserPath(configuredPath);
	const envPath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.OPERATOR_TTS_PREFS);
	if (envPath) return require_home_dir.resolveUserPath(envPath);
	return node_path.default.join(require_utils.resolveConfigDir(process.env), "settings", "tts.json");
}
function readPrefs(prefsPath) {
	return (0, _openclaw_fs_safe_json.tryReadJsonSync)(prefsPath) ?? {};
}
function resolveTtsAutoModeFromPrefs(prefs) {
	const auto = require_gateway_startup_speech_providers.normalizeTtsAutoMode(prefs.tts?.auto);
	if (auto) return auto;
	if (typeof prefs.tts?.enabled === "boolean") return prefs.tts.enabled ? "always" : "off";
}
function normalizeStatusDetail(value, maxLength = MAX_STATUS_DETAIL_LENGTH) {
	if (typeof value !== "string") return;
	const normalized = value.trim().replace(/\s+/g, " ");
	if (!normalized) return;
	return normalized.length > maxLength ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(normalized, maxLength - 3)}...` : normalized;
}
function sanitizeBaseUrlForStatus(value) {
	const raw = normalizeStatusDetail(value, 180);
	if (!raw) return;
	try {
		const parsed = new URL(raw);
		parsed.username = "";
		parsed.password = "";
		parsed.search = "";
		parsed.hash = "";
		return normalizeStatusDetail(parsed.toString().replace(/\/+$/, ""), 120);
	} catch {
		return "[invalid-url]";
	}
}
function isCustomOpenAiTtsBaseUrl(baseUrl) {
	return baseUrl ? baseUrl.replace(/\/+$/, "") !== DEFAULT_OPENAI_TTS_BASE_URL : false;
}
function firstStatusDetail(record, keys) {
	if (!record) return;
	for (const key of keys) {
		const value = normalizeStatusDetail(record[key]);
		if (value) return value;
	}
}
function resolveProviderConfigRecord(raw, provider) {
	const rawRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw) ? raw : {};
	const providers = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.providers) ? raw.providers : {};
	if (provider === "microsoft") return {
		...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawRecord.edge) ? rawRecord.edge : {},
		...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawRecord.microsoft) ? rawRecord.microsoft : {},
		...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providers.edge) ? providers.edge : {},
		...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providers.microsoft) ? providers.microsoft : {}
	};
	const direct = rawRecord[provider];
	const providerScoped = providers[provider];
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providerScoped)) return providerScoped;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(direct)) return direct;
	return rawRecord;
}
function resolveStatusProviderDetails(raw, provider) {
	if (provider === "auto") return {};
	const record = resolveProviderConfigRecord(raw, provider);
	const sanitizedBaseUrl = sanitizeBaseUrlForStatus(record?.baseUrl);
	const customBaseUrl = provider === "openai" && isCustomOpenAiTtsBaseUrl(sanitizedBaseUrl);
	const details = {};
	const displayName = firstStatusDetail(record, ["displayName"]);
	if (displayName) details.displayName = displayName;
	const model = firstStatusDetail(record, ["model", "modelId"]);
	if (model) details.model = model;
	const voice = firstStatusDetail(record, [
		"speakerVoice",
		"speakerVoiceId",
		"voice",
		"voiceId",
		"voiceName"
	]);
	if (voice) details.voice = voice;
	if (sanitizedBaseUrl && (provider !== "openai" || customBaseUrl)) {
		details.baseUrl = sanitizedBaseUrl;
		details.customBaseUrl = customBaseUrl;
	}
	return details;
}
function resolveStatusTtsSnapshot(params) {
	const context = {
		agentId: params.agentId,
		channelId: params.channelId,
		accountId: params.accountId
	};
	const raw = require_gateway_startup_speech_providers.resolveEffectiveTtsConfig(params.cfg, context);
	const prefs = readPrefs(resolveTtsPrefsPathValue(raw.prefsPath));
	const autoMode = require_gateway_startup_speech_providers.normalizeTtsAutoMode(params.sessionAuto) ?? resolveTtsAutoModeFromPrefs(prefs) ?? resolveConfiguredTtsAutoMode(raw);
	if (autoMode === "off") return null;
	const persona = prefs.tts && Object.hasOwn(prefs.tts, "persona") ? normalizeTtsPersonaId(prefs.tts.persona) : normalizeTtsPersonaId(raw.persona);
	const provider = normalizeConfiguredSpeechProviderId(prefs.tts?.provider) ?? resolvePersonaPreferredProvider(raw, persona) ?? normalizeConfiguredSpeechProviderId(raw.provider) ?? "auto";
	return {
		autoMode,
		provider,
		...resolveStatusProviderDetails(raw, provider),
		...persona ? { persona } : {},
		maxLength: prefs.tts?.maxLength ?? DEFAULT_TTS_MAX_LENGTH,
		summarize: prefs.tts?.summarize ?? DEFAULT_TTS_SUMMARIZE
	};
}
//#endregion
//#region src/status/status-message.ts
function normalizeAuthMode(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (!normalized) return;
	if (normalized === "api-key" || normalized.startsWith("api-key ")) return "api-key";
	if (normalized === "oauth" || normalized.startsWith("oauth ")) return "oauth";
	if (normalized === "token" || normalized.startsWith("token ")) return "token";
	if (normalized === "aws-sdk" || normalized.startsWith("aws-sdk ")) return "aws-sdk";
	if (normalized === "mixed" || normalized.startsWith("mixed ")) return "mixed";
	if (normalized === "unknown") return "unknown";
}
function resolveConfiguredTextVerbosity(params) {
	const provider = params.provider?.trim();
	const model = params.model?.trim();
	if (!provider || !model || provider !== "openai") return;
	return require_extra_params.resolveOpenAITextVerbosity(require_extra_params.resolveExtraParams({
		cfg: params.config,
		provider,
		modelId: model,
		agentId: params.agentId
	}));
}
function resolveExecutionLabel(args) {
	const sessionKey = args.sessionKey?.trim();
	if (args.config && sessionKey) {
		const runtimeStatus = require_runtime_status.resolveSandboxRuntimeStatus({
			cfg: args.config,
			sessionKey
		});
		const sandboxMode = runtimeStatus.mode ?? "off";
		if (sandboxMode === "off") return "direct";
		return `${runtimeStatus.sandboxed ? "docker" : sessionKey ? "direct" : "unknown"}/${sandboxMode}`;
	}
	const sandboxMode = args.agent?.sandbox?.mode ?? "off";
	if (sandboxMode === "off") return "direct";
	return `${(() => {
		if (!sessionKey) return false;
		if (sandboxMode === "all") return true;
		if (args.config) return require_runtime_status.resolveSandboxRuntimeStatus({
			cfg: args.config,
			sessionKey
		}).sandboxed;
		const mainKey = require_main_session.resolveMainSessionKey({ session: { scope: args.sessionScope ?? "per-sender" } });
		return sessionKey !== mainKey.trim();
	})() ? "docker" : sessionKey ? "direct" : "unknown"}/${sandboxMode}`;
}
const formatTokens = (total, contextTokens) => {
	const ctx = contextTokens ?? null;
	if (total == null) return `?/${ctx ? require_token_format.formatTokenCount(ctx) : "?"}`;
	const pct = ctx ? Math.min(999, Math.round(total / ctx * 100)) : null;
	return `${require_token_format.formatTokenCount(total)}/${ctx ? require_token_format.formatTokenCount(ctx) : "?"}${pct !== null ? ` (${pct}%)` : ""}`;
};
const formatEstimatedContextBudgetTokens = (status, contextTokens) => {
	if (status?.source !== "pre-prompt-estimate") return null;
	const estimatedPromptTokens = typeof status.estimatedPromptTokens === "number" && Number.isFinite(status.estimatedPromptTokens) && status.estimatedPromptTokens >= 0 ? Math.floor(status.estimatedPromptTokens) : void 0;
	if (estimatedPromptTokens === void 0) return null;
	const ctx = typeof contextTokens === "number" && Number.isFinite(contextTokens) && contextTokens > 0 ? contextTokens : typeof status.contextTokenBudget === "number" && Number.isFinite(status.contextTokenBudget) && status.contextTokenBudget > 0 ? status.contextTokenBudget : void 0;
	const pct = ctx ? Math.min(999, Math.round(estimatedPromptTokens / ctx * 100)) : null;
	return `~${require_token_format.formatTokenCount(estimatedPromptTokens)}/${ctx ? require_token_format.formatTokenCount(ctx) : "?"}${pct !== null ? ` (${pct}% est)` : " (est)"}`;
};
const formatContextUsageShort = (total, contextTokens) => `Context ${formatTokens(total, contextTokens ?? null)}`;
const formatQueueDetails = (queue) => {
	if (!queue) return "";
	const depth = typeof queue.depth === "number" ? `depth ${queue.depth}` : null;
	if (!queue.showDetails) return depth ? ` (${depth})` : "";
	const detailParts = [];
	if (depth) detailParts.push(depth);
	if (typeof queue.debounceMs === "number") {
		const ms = Math.max(0, Math.round(queue.debounceMs));
		const label = ms >= 1e3 ? `${ms % 1e3 === 0 ? ms / 1e3 : (ms / 1e3).toFixed(1)}s` : `${ms}ms`;
		detailParts.push(`debounce ${label}`);
	}
	if (typeof queue.cap === "number") detailParts.push(`cap ${queue.cap}`);
	if (queue.dropPolicy) detailParts.push(`drop ${queue.dropPolicy}`);
	return detailParts.length ? ` (${detailParts.join(" · ")})` : "";
};
const readUsageFromSessionLog = (sessionId, sessionEntry, agentId, sessionKey, storePath) => {
	if (!sessionId) return;
	let logPath;
	try {
		logPath = require_paths.resolveSessionFilePath(sessionId, sessionEntry, require_paths.resolveSessionFilePathOptions({
			agentId: agentId ?? (sessionKey ? require_session_key.resolveAgentIdFromSessionKey(sessionKey) : void 0),
			storePath
		}));
	} catch {
		return;
	}
	if (!node_fs.default.existsSync(logPath)) return;
	try {
		const snapshot = require_session_transcript_readers.readRecentSessionUsageFromTranscript({
			agentId: agentId ?? (sessionKey ? require_session_key.resolveAgentIdFromSessionKey(sessionKey) : void 0),
			sessionEntry,
			sessionFile: logPath,
			sessionId,
			sessionKey,
			storePath
		}, 256 * 1024);
		if (!snapshot) return;
		const input = snapshot.inputTokens ?? 0;
		const output = snapshot.outputTokens ?? 0;
		const cacheRead = snapshot.cacheRead ?? 0;
		const cacheWrite = snapshot.cacheWrite ?? 0;
		const promptTokens = snapshot.totalTokens ?? input + cacheRead + cacheWrite;
		const total = promptTokens + output;
		if (promptTokens === 0 && total === 0) return;
		const model = snapshot.modelProvider ? snapshot.model ? `${snapshot.modelProvider}/${snapshot.model}` : snapshot.modelProvider : snapshot.model;
		return {
			input,
			output,
			cacheRead,
			cacheWrite,
			promptTokens,
			total,
			totalTokensFresh: snapshot.totalTokensFresh === true,
			model
		};
	} catch {
		return;
	}
};
const formatUsagePair = (input, output) => {
	if (input == null && output == null) return null;
	return `🧮 Tokens: ${typeof input === "number" ? require_token_format.formatTokenCount(input) : "?"} in / ${typeof output === "number" ? require_token_format.formatTokenCount(output) : "?"} out`;
};
const formatCacheLine = (input, cacheRead, cacheWrite) => {
	if (!cacheRead && !cacheWrite) return null;
	if ((typeof cacheRead !== "number" || cacheRead <= 0) && (typeof cacheWrite !== "number" || cacheWrite <= 0)) return null;
	const cachedLabel = typeof cacheRead === "number" ? require_token_format.formatTokenCount(cacheRead) : "0";
	const newLabel = typeof cacheWrite === "number" ? require_token_format.formatTokenCount(cacheWrite) : "0";
	const totalInput = (typeof cacheRead === "number" ? cacheRead : 0) + (typeof cacheWrite === "number" ? cacheWrite : 0) + (typeof input === "number" ? input : 0);
	return `🗄️ Cache: ${totalInput > 0 && typeof cacheRead === "number" ? Math.round(cacheRead / totalInput * 100) : 0}% hit · ${cachedLabel} cached, ${newLabel} new`;
};
const formatMediaUnderstandingLine = (decisions) => {
	if (!decisions || decisions.length === 0) return null;
	const parts = decisions.map((decision) => {
		const count = decision.attachments.length;
		const countLabel = count > 1 ? ` x${count}` : "";
		if (decision.outcome === "success") {
			const chosen = decision.attachments.find((entry) => entry.chosen)?.chosen;
			const provider = chosen?.provider?.trim();
			const model = chosen?.model?.trim();
			const modelLabel = provider ? model && model !== provider ? `${provider}/${model}` : provider : null;
			const backendLabel = chosen?.observedBackend ? ` observed=${chosen.observedBackend}` : chosen?.requestedBackend ? ` requested=${chosen.requestedBackend}` : "";
			return `${decision.capability}${countLabel} ok${modelLabel ? ` (${modelLabel}${backendLabel})` : ""}`;
		}
		if (decision.outcome === "no-attachment") return `${decision.capability} none`;
		if (decision.outcome === "disabled") return `${decision.capability} off`;
		if (decision.outcome === "scope-deny") return `${decision.capability} denied`;
		if (decision.outcome === "skipped") {
			const shortReason = require_runner_entries.summarizeDecisionReason(require_runner_entries.findDecisionReason(decision));
			return `${decision.capability} skipped${shortReason ? ` (${shortReason})` : ""}`;
		}
		if (decision.outcome === "failed") {
			const shortReason = require_runner_entries.summarizeDecisionReason(require_runner_entries.findDecisionReason(decision, "failed"));
			return `${decision.capability} failed${shortReason ? ` (${shortReason})` : ""}`;
		}
		return null;
	}).filter((part) => part != null);
	if (parts.length === 0) return null;
	if (parts.every((part) => part.endsWith(" none"))) return null;
	return `📎 Media: ${parts.join(" · ")}`;
};
const formatVoiceModeLine = (config, sessionEntry, agentId) => {
	if (!config) return null;
	const snapshot = resolveStatusTtsSnapshot({
		cfg: config,
		sessionAuto: sessionEntry?.ttsAuto,
		agentId
	});
	if (!snapshot) return null;
	const parts = [`🔊 Voice: ${snapshot.autoMode}`, `provider=${snapshot.provider}`];
	if (snapshot.persona) parts.push(`persona=${snapshot.persona}`);
	if (snapshot.displayName) parts.push(`name=${snapshot.displayName}`);
	if (snapshot.model) parts.push(`model=${snapshot.model}`);
	if (snapshot.voice) parts.push(`voice=${snapshot.voice}`);
	if (snapshot.baseUrl) parts.push(snapshot.customBaseUrl ? `endpoint=custom(${snapshot.baseUrl})` : `endpoint=${snapshot.baseUrl}`);
	parts.push(`limit=${snapshot.maxLength}`, `summary=${snapshot.summarize ? "on" : "off"}`);
	return parts.join(" · ");
};
function resolveChannelModelNote(params) {
	if (!params.config || !params.entry) return;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.modelOverride) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.entry.providerOverride)) return;
	const channelOverride = require_model_overrides.resolveChannelModelOverride({
		cfg: params.config,
		channel: params.entry.channel ?? params.entry.origin?.provider,
		groupId: params.entry.groupId,
		groupChatType: params.entry.chatType ?? params.entry.origin?.chatType,
		groupChannel: params.entry.groupChannel,
		groupSubject: params.entry.subject,
		parentSessionKey: params.parentSessionKey,
		directUserIds: [
			params.entry.origin?.nativeDirectUserId,
			params.entry.origin?.from,
			params.entry.origin?.to
		]
	});
	if (!channelOverride) return;
	const aliasIndex = require_model_selection_shared.buildModelAliasIndex({
		cfg: params.config,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		allowPluginNormalization: false
	});
	const resolvedOverride = require_model_selection_shared.resolveModelRefFromString({
		raw: channelOverride.model,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		aliasIndex,
		allowPluginNormalization: false
	});
	if (!resolvedOverride) return;
	if (resolvedOverride.ref.provider !== params.selectedProvider || resolvedOverride.ref.model !== params.selectedModel) return;
	return "channel override";
}
function hasUserPinnedModelSelection(entry) {
	if (!entry?.modelOverride) return false;
	if (entry.modelOverrideSource === "user") return true;
	if (entry.modelOverrideSource === "auto") return false;
	return !require_agent_scope.hasSessionAutoModelFallbackProvenance(entry);
}
function buildStatusMessage(args) {
	const now = args.now ?? Date.now();
	const timeLine = args.timeLine ?? (args.config ? require_current_time.resolveCronStyleNow(args.config, now).timeLine : void 0);
	const entry = args.sessionEntry;
	const selectionConfig = { agents: { defaults: args.agent ?? {} } };
	const contextConfig = args.config ? {
		...args.config,
		agents: {
			...args.config.agents,
			defaults: {
				...args.config.agents?.defaults,
				...args.agent
			}
		}
	} : { agents: { defaults: args.agent ?? {} } };
	const resolved = require_model_selection_shared.resolveConfiguredModelRef({
		cfg: selectionConfig,
		defaultProvider: require_defaults.DEFAULT_PROVIDER,
		defaultModel: require_defaults.DEFAULT_MODEL,
		allowPluginNormalization: false
	});
	const selectedProvider = entry?.providerOverride ?? resolved.provider ?? "openrouter";
	const selectedModel = entry?.modelOverride ?? resolved.model ?? "openrouter/auto";
	const modelRefs = require_model_runtime.resolveSelectedAndActiveModel({
		selectedProvider,
		selectedModel,
		sessionEntry: entry,
		parseSelectedProvider: Boolean(entry?.modelOverride?.trim() && !entry?.providerOverride?.trim())
	});
	const selectedLookupProvider = modelRefs.selected.provider || selectedProvider;
	const selectedLookupModel = modelRefs.selected.model || selectedModel;
	const initialFallbackState = require_fallback_notice_state.resolveActiveFallbackState({
		selectedModelRef: modelRefs.selected.label || "unknown",
		activeModelRef: modelRefs.active.label || "unknown",
		config: args.config,
		state: entry
	});
	let activeProvider = modelRefs.active.provider;
	let activeModel = modelRefs.active.model;
	let contextLookupProvider = activeProvider;
	let contextLookupModel = activeModel;
	const runtimeModelRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.model) ?? "";
	const runtimeProviderRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.modelProvider) ?? "";
	if (runtimeModelRaw && !runtimeProviderRaw && runtimeModelRaw.includes("/")) {
		const slashIndex = runtimeModelRaw.indexOf("/");
		const embeddedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(runtimeModelRaw.slice(0, slashIndex)) ?? "";
		const fallbackMatchesRuntimeModel = initialFallbackState.active && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(runtimeModelRaw) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry?.fallbackNoticeActiveModel ?? "") ?? "");
		const runtimeMatchesSelectedModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(runtimeModelRaw) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(modelRefs.selected.label || "unknown");
		if ((fallbackMatchesRuntimeModel || runtimeMatchesSelectedModel) && embeddedProvider === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(activeProvider)) {
			contextLookupProvider = activeProvider;
			contextLookupModel = activeModel;
		} else {
			contextLookupProvider = void 0;
			contextLookupModel = runtimeModelRaw;
		}
	}
	let inputTokens = entry?.inputTokens;
	let outputTokens = entry?.outputTokens;
	let cacheRead = entry?.cacheRead;
	let cacheWrite = entry?.cacheWrite;
	const freshTotalTokens = require_store.resolveFreshSessionTotalTokens(entry);
	const allowTranscriptContextUsage = entry?.totalTokensFresh !== false;
	let totalTokens = freshTotalTokens;
	if (args.includeTranscriptUsage) {
		const logUsage = readUsageFromSessionLog(entry?.sessionId, entry, args.agentId, args.sessionKey, args.sessionStorePath);
		if (logUsage) {
			const candidate = logUsage.totalTokensFresh ? logUsage.promptTokens || logUsage.total : void 0;
			if (allowTranscriptContextUsage && candidate !== void 0 && candidate > 0 && (entry?.totalTokensFresh !== true || !totalTokens || totalTokens === 0 || candidate > totalTokens)) totalTokens = candidate;
			if (!entry?.model && logUsage.model) {
				const slashIndex = logUsage.model.indexOf("/");
				if (slashIndex > 0) {
					const provider = logUsage.model.slice(0, slashIndex).trim();
					const model = logUsage.model.slice(slashIndex + 1).trim();
					if (provider && model) {
						activeProvider = provider;
						activeModel = model;
						contextLookupProvider = void 0;
						contextLookupModel = logUsage.model;
					}
				} else {
					activeModel = logUsage.model;
					contextLookupProvider = activeProvider;
					contextLookupModel = logUsage.model;
				}
			}
			if (!inputTokens || inputTokens === 0) inputTokens = logUsage.input;
			if (!outputTokens || outputTokens === 0) outputTokens = logUsage.output;
			if (typeof cacheRead !== "number" || cacheRead <= 0) cacheRead = logUsage.cacheRead;
			if (typeof cacheWrite !== "number" || cacheWrite <= 0) cacheWrite = logUsage.cacheWrite;
		}
	}
	const activeModelLabel = require_model_runtime.formatProviderModelRef(activeProvider, activeModel) || "unknown";
	const runtimeDiffersFromSelected = activeModelLabel !== (modelRefs.selected.label || "unknown");
	const selectedContextTokens = require_context.resolveContextTokensForModel({
		cfg: contextConfig,
		provider: selectedLookupProvider,
		model: selectedLookupModel,
		allowAsyncLoad: false
	});
	const explicitRuntimeContextTokens = typeof args.runtimeContextTokens === "number" && args.runtimeContextTokens > 0 ? args.runtimeContextTokens : void 0;
	const resolvedActiveContextTokens = require_context.resolveContextTokensForModel({
		cfg: contextConfig,
		...contextLookupProvider ? { provider: contextLookupProvider } : {},
		model: contextLookupModel,
		allowAsyncLoad: false
	});
	const activeContextTokens = typeof explicitRuntimeContextTokens === "number" && typeof resolvedActiveContextTokens === "number" ? Math.min(explicitRuntimeContextTokens, resolvedActiveContextTokens) : explicitRuntimeContextTokens ?? resolvedActiveContextTokens;
	const channelModelNote = resolveChannelModelNote({
		config: args.config,
		entry,
		selectedProvider: selectedLookupProvider,
		selectedModel: selectedLookupModel,
		parentSessionKey: args.parentSessionKey
	});
	const persistedContextTokens = typeof entry?.contextTokens === "number" && entry.contextTokens > 0 ? entry.contextTokens : void 0;
	const persistedContextMatchesActiveModel = (() => {
		if (persistedContextTokens === void 0) return false;
		const entryProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry?.modelProvider);
		const entryModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(entry?.model);
		const lookupProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(contextLookupProvider);
		const lookupModel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(contextLookupModel);
		if (!entryModel || !lookupModel || entryModel !== lookupModel) return false;
		if (entryProvider && lookupProvider && entryProvider !== lookupProvider) return false;
		return !runtimeDiffersFromSelected || initialFallbackState.active;
	})();
	const cappedPersistedContextTokens = typeof persistedContextTokens === "number" && typeof activeContextTokens === "number" ? Math.min(persistedContextTokens, activeContextTokens) : persistedContextMatchesActiveModel ? persistedContextTokens : void 0;
	const agentContextTokens = typeof args.agent?.contextTokens === "number" && args.agent.contextTokens > 0 ? args.agent.contextTokens : void 0;
	const explicitConfiguredContextTokens = typeof args.explicitConfiguredContextTokens === "number" && args.explicitConfiguredContextTokens > 0 ? args.explicitConfiguredContextTokens : void 0;
	const cappedConfiguredContextTokens = typeof explicitConfiguredContextTokens === "number" ? typeof activeContextTokens === "number" ? Math.min(explicitConfiguredContextTokens, activeContextTokens) : explicitConfiguredContextTokens : void 0;
	const cappedAgentContextTokens = typeof agentContextTokens === "number" ? typeof activeContextTokens === "number" ? Math.min(agentContextTokens, activeContextTokens) : agentContextTokens : void 0;
	const channelOverrideContextTokens = channelModelNote ? explicitRuntimeContextTokens ?? cappedConfiguredContextTokens ?? (typeof activeContextTokens === "number" ? cappedAgentContextTokens ?? activeContextTokens : cappedAgentContextTokens) : void 0;
	const runtimeSnapshotHasFallbackProvenance = initialFallbackState.active || require_agent_scope.hasSessionAutoModelFallbackProvenance(entry) || require_model_runtime_aliases.areRuntimeModelRefsEquivalent(activeModelLabel, modelRefs.selected.label || "unknown", { config: args.config });
	const contextTokens = runtimeDiffersFromSelected ? (() => {
		if (!runtimeSnapshotHasFallbackProvenance) {
			if (typeof selectedContextTokens === "number") {
				if (explicitConfiguredContextTokens !== void 0) return Math.min(explicitConfiguredContextTokens, selectedContextTokens);
				if (agentContextTokens !== void 0) return Math.min(agentContextTokens, selectedContextTokens);
				return selectedContextTokens;
			}
			if (explicitConfiguredContextTokens !== void 0) return explicitConfiguredContextTokens;
			if (agentContextTokens !== void 0) return agentContextTokens;
			return require_defaults.DEFAULT_CONTEXT_TOKENS;
		}
		if (explicitRuntimeContextTokens !== void 0) return explicitRuntimeContextTokens;
		if (cappedPersistedContextTokens !== void 0) {
			const trustedPersistedContextTokens = cappedPersistedContextTokens;
			if (typeof selectedContextTokens === "number" && trustedPersistedContextTokens === selectedContextTokens && typeof selectedContextTokens === "number" && typeof activeContextTokens === "number" && activeContextTokens !== selectedContextTokens && !(typeof explicitConfiguredContextTokens === "number" && explicitConfiguredContextTokens === trustedPersistedContextTokens)) return activeContextTokens;
			if (typeof activeContextTokens === "number") return Math.min(trustedPersistedContextTokens, activeContextTokens);
			return trustedPersistedContextTokens;
		}
		if (cappedConfiguredContextTokens !== void 0) return cappedConfiguredContextTokens;
		if (typeof activeContextTokens === "number") return activeContextTokens;
		return require_defaults.DEFAULT_CONTEXT_TOKENS;
	})() : require_context.resolveContextTokensForModel({
		cfg: contextConfig,
		...contextLookupProvider ? { provider: contextLookupProvider } : {},
		model: contextLookupModel,
		contextTokensOverride: channelOverrideContextTokens ?? cappedPersistedContextTokens ?? cappedConfiguredContextTokens ?? cappedAgentContextTokens ?? explicitRuntimeContextTokens,
		fallbackContextTokens: 2e5,
		allowAsyncLoad: false
	}) ?? 2e5;
	const thinkLevel = args.resolvedThink ?? args.sessionEntry?.thinkingLevel ?? args.agent?.thinkingDefault ?? "off";
	const verboseLevel = args.resolvedVerbose ?? args.sessionEntry?.verboseLevel ?? args.agent?.verboseDefault ?? "off";
	const fastMode = args.resolvedFast ?? args.sessionEntry?.fastMode ?? false;
	const fastModeState = require_fast_mode$1.resolveFastModeState({
		cfg: args.config,
		provider: activeProvider,
		model: activeModel,
		agentId: args.agentId,
		sessionEntry: args.sessionEntry
	});
	const reasoningLevel = args.resolvedReasoning ?? args.sessionEntry?.reasoningLevel ?? args.agent?.reasoningDefault ?? "off";
	const elevatedLevel = args.resolvedElevated ?? args.sessionEntry?.elevatedLevel ?? args.agent?.elevatedDefault ?? "on";
	const execution = { label: resolveExecutionLabel(args) };
	const agentRuntimeLabel = require_agent_runtime_label.resolveAgentRuntimeLabel({
		config: args.config,
		sessionEntry: args.sessionEntry,
		resolvedHarness: args.resolvedHarness,
		fallbackProvider: activeProvider
	});
	const updatedAt = entry?.updatedAt;
	const sessionStartedAt = require_lifecycle.resolveSessionLifecycleTimestamps({
		entry,
		agentId: args.agentId,
		storePath: args.sessionStorePath
	}).sessionStartedAt;
	const sessionDuration = typeof sessionStartedAt === "number" ? require_format_duration.formatDurationCompact(now - sessionStartedAt, { spaced: true }) : void 0;
	const sessionLine = [
		`Session: ${args.sessionKey ?? "unknown"}`,
		sessionDuration ? `duration ${sessionDuration}` : null,
		typeof updatedAt === "number" ? `updated ${require_format_relative.formatTimeAgo(now - updatedAt)}` : "no activity"
	].filter(Boolean).join(" • ");
	const groupActivationValue = entry?.chatType === "group" || entry?.chatType === "channel" || Boolean(args.sessionKey?.includes(":group:")) || Boolean(args.sessionKey?.includes(":channel:")) ? args.groupActivation ?? entry?.groupActivation ?? "mention" : void 0;
	const contextLine = [`Context: ${totalTokens == null || totalTokens === 0 ? formatEstimatedContextBudgetTokens(entry?.contextBudgetStatus, contextTokens) ?? formatTokens(totalTokens, contextTokens ?? null) : formatTokens(totalTokens, contextTokens ?? null)}`, `🧹 Compactions: ${entry?.compactionCount ?? 0}`].filter((line) => Boolean(line)).join(" · ");
	const queueMode = args.queue?.mode ?? "unknown";
	const queueDetails = formatQueueDetails(args.queue);
	const verboseLabel = verboseLevel === "full" ? "verbose:full" : verboseLevel === "on" ? "verbose" : null;
	const traceLevel = entry?.traceLevel === "raw" ? "raw" : entry?.traceLevel === "on" ? "on" : "off";
	const traceLabel = traceLevel === "raw" ? "trace:raw" : traceLevel === "on" ? "trace" : null;
	const pluginStatusLines = verboseLevel !== "off" ? require_store.resolveSessionPluginStatusLines(entry) : [];
	const pluginTraceLines = traceLevel === "on" || traceLevel === "raw" ? require_store.resolveSessionPluginTraceLines(entry) : [];
	const pluginStatusLine = pluginStatusLines.length > 0 || pluginTraceLines.length > 0 ? [...pluginStatusLines, ...pluginTraceLines].join(" · ") : null;
	const elevatedLabel = elevatedLevel && elevatedLevel !== "off" ? elevatedLevel === "on" ? "elevated" : `elevated:${elevatedLevel}` : null;
	const textVerbosity = resolveConfiguredTextVerbosity({
		config: args.config,
		agentId: args.agentId,
		provider: activeProvider,
		model: activeModel
	});
	const optionsLine = [
		`Execution: ${execution.label}`,
		`Runtime: ${agentRuntimeLabel}`,
		`Think: ${thinkLevel}`,
		`Fast: ${require_fast_mode.formatFastModeStatusValue({
			mode: fastMode,
			fastAutoOnSeconds: fastModeState.fastAutoOnSeconds
		})}`,
		textVerbosity ? `Text: ${textVerbosity}` : null,
		verboseLabel,
		traceLabel,
		reasoningLevel !== "off" ? `Reasoning: ${reasoningLevel}` : null,
		elevatedLabel
	].filter(Boolean).join(" · ");
	const activationLine = [groupActivationValue ? `👥 Activation: ${groupActivationValue}` : null, `🪢 Queue: ${queueMode}${queueDetails}`].filter(Boolean).join(" · ");
	const selectedModelLabel = modelRefs.selected.label || "unknown";
	const runtimeAliasModelEquivalent = require_model_runtime_aliases.areRuntimeModelRefsEquivalent(selectedModelLabel, activeModelLabel, { config: args.config });
	const selectedAuthMode = normalizeAuthMode(args.modelAuth) ?? require_model_auth.resolveModelAuthMode(selectedLookupProvider, args.config);
	const rawSelectedAuthLabelValue = selectedAuthMode && selectedAuthMode !== "unknown" ? args.modelAuth ?? selectedAuthMode : void 0;
	const activeAuthMode = normalizeAuthMode(args.activeModelAuth) ?? require_model_auth.resolveModelAuthMode(activeProvider, args.config);
	const activeAuthLabelValue = activeAuthMode && activeAuthMode !== "unknown" ? args.activeModelAuth ?? activeAuthMode : void 0;
	const selectedAuthLabelValue = require_model_runtime_aliases.shouldPreferActiveRuntimeAliasAuthLabel({
		runtimeAliasModelEquivalent,
		selectedAuthLabel: rawSelectedAuthLabelValue,
		activeAuthLabel: activeAuthLabelValue
	}) ? activeAuthLabelValue : rawSelectedAuthLabelValue ?? (runtimeAliasModelEquivalent ? activeAuthLabelValue : void 0);
	const fallbackState = require_fallback_notice_state.resolveActiveFallbackState({
		selectedModelRef: selectedModelLabel,
		activeModelRef: activeModelLabel,
		config: args.config,
		state: entry
	});
	const hasUsage = typeof inputTokens === "number" || typeof outputTokens === "number" || typeof cacheRead === "number" || typeof cacheWrite === "number";
	const costConfig = hasUsage ? require_usage_format.resolveModelCostConfig({
		provider: activeProvider,
		model: activeModel,
		config: args.config,
		allowPluginNormalization: false
	}) : void 0;
	const cost = hasUsage ? require_usage_format.estimateUsageCost({
		usage: {
			input: inputTokens ?? void 0,
			output: outputTokens ?? void 0,
			cacheRead: cacheRead ?? void 0,
			cacheWrite: cacheWrite ?? void 0
		},
		cost: costConfig
	}) : void 0;
	const costLabel = hasUsage ? require_usage_format.formatUsd(cost) : void 0;
	const selectedAuthLabel = selectedAuthLabelValue ? ` · 🔑 ${selectedAuthLabelValue}` : "";
	const modelNote = channelModelNote ? ` · ${channelModelNote}` : "";
	const configuredDefaultModelLabel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.configuredDefaultModelLabel);
	const sessionHasPersistedModelSelection = hasUserPinnedModelSelection(entry);
	const sessionHasAutoFallback = require_agent_scope.hasSessionActiveAutoModelFallback(entry);
	const modelLines = [`🧠 Model: ${selectedModelLabel}${selectedAuthLabel}${modelNote}${(sessionHasPersistedModelSelection || sessionHasAutoFallback) && configuredDefaultModelLabel && selectedModelLabel !== configuredDefaultModelLabel && !require_model_runtime_aliases.areRuntimeModelRefsEquivalent(selectedModelLabel, configuredDefaultModelLabel, { config: args.config }) ? sessionHasPersistedModelSelection ? ` · pinned session; config primary ${configuredDefaultModelLabel} · clear /model default` : ` · auto fallback; config primary ${configuredDefaultModelLabel} · check provider` : ""}`];
	const configuredFallbacks = (() => {
		const modelConfig = args.agent?.model;
		if (typeof modelConfig === "object" && modelConfig && Array.isArray(modelConfig.fallbacks)) return sessionHasPersistedModelSelection ? void 0 : modelConfig.fallbacks;
	})();
	const configuredFallbacksLine = configuredFallbacks?.length ? `🔄 Fallbacks: ${configuredFallbacks.join(", ")}` : null;
	const showFallbackAuth = activeAuthLabelValue && activeAuthLabelValue !== selectedAuthLabelValue;
	const fallbackLine = fallbackState.active ? `↪️ Fallback: ${activeModelLabel}${showFallbackAuth ? ` · 🔑 ${activeAuthLabelValue}` : ""} (${fallbackState.reason ?? "selected model unavailable"})` : null;
	const commit = require_git_commit.resolveCommitHash({ moduleUrl: require("url").pathToFileURL(__filename).href });
	const versionLine = `🦞 Operator ${require_version.VERSION}${commit ? ` (${commit})` : ""}`;
	const usagePair = formatUsagePair(inputTokens, outputTokens);
	const cacheLine = formatCacheLine(inputTokens, cacheRead, cacheWrite);
	const costLine = costLabel ? `💵 Cost: ${costLabel}` : null;
	const usageCostLine = usagePair && costLine ? `${usagePair} · ${costLine}` : usagePair ?? costLine;
	const mediaLine = formatMediaUnderstandingLine(args.mediaDecisions);
	const voiceLine = formatVoiceModeLine(args.config, args.sessionEntry, args.agentId);
	return [
		versionLine,
		timeLine,
		args.uptimeLine,
		...modelLines,
		configuredFallbacksLine,
		fallbackLine,
		usageCostLine,
		cacheLine,
		`📚 ${contextLine}`,
		mediaLine,
		args.usageLine,
		`🧵 ${sessionLine}`,
		args.subagentsLine,
		args.taskLine,
		args.channelFeatureLine,
		`⚙️ ${optionsLine}`,
		args.pluginHealthLine,
		pluginStatusLine ? `🧩 ${pluginStatusLine}` : null,
		voiceLine,
		activationLine
	].filter((line) => Boolean(line)).join("\n");
}
//#endregion
Object.defineProperty(exports, "buildStatusMessage", {
	enumerable: true,
	get: function() {
		return buildStatusMessage;
	}
});
Object.defineProperty(exports, "formatContextUsageShort", {
	enumerable: true,
	get: function() {
		return formatContextUsageShort;
	}
});
