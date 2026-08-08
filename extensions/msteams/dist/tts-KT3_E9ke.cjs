const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./zod-schema.core-B7xBEBon.cjs");
const require_voice_models = require("./voice-models-inHjkMDc.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let openclaw_plugin_sdk_channel_targets = require("openclaw/plugin-sdk/channel-targets");
let openclaw_plugin_sdk_error_runtime = require("openclaw/plugin-sdk/error-runtime");
let openclaw_plugin_sdk_logging_core = require("openclaw/plugin-sdk/logging-core");
let openclaw_plugin_sdk_media_runtime = require("openclaw/plugin-sdk/media-runtime");
let openclaw_plugin_sdk_number_runtime = require("openclaw/plugin-sdk/number-runtime");
let openclaw_plugin_sdk_reply_payload = require("openclaw/plugin-sdk/reply-payload");
let openclaw_plugin_sdk_runtime_config_snapshot = require("openclaw/plugin-sdk/runtime-config-snapshot");
let openclaw_plugin_sdk_runtime_env = require("openclaw/plugin-sdk/runtime-env");
let openclaw_plugin_sdk_sandbox = require("openclaw/plugin-sdk/sandbox");
let openclaw_plugin_sdk_security_runtime = require("openclaw/plugin-sdk/security-runtime");
let openclaw_plugin_sdk_speech_core = require("openclaw/plugin-sdk/speech-core");
let openclaw_plugin_sdk_string_coerce_runtime = require("openclaw/plugin-sdk/string-coerce-runtime");
let openclaw_plugin_sdk_text_chunking = require("openclaw/plugin-sdk/text-chunking");
let openclaw_plugin_sdk_text_utility_runtime = require("openclaw/plugin-sdk/text-utility-runtime");
//#region packages/speech-core/speaker.ts
function readString(value) {
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
/** Populate canonical and legacy speaker voice fields together. */
function withSpeakerSelectionCompat(config) {
	const next = config ? { ...config } : {};
	const speakerVoice = readString(next.speakerVoice);
	const speakerVoiceId = readString(next.speakerVoiceId);
	const voice = readString(next.voice);
	const voiceName = readString(next.voiceName);
	const voiceId = readString(next.voiceId);
	const canonicalVoice = speakerVoice ?? voice ?? voiceName;
	const canonicalVoiceId = speakerVoiceId ?? voiceId;
	if (canonicalVoice) {
		next.speakerVoice = canonicalVoice;
		next.voice = canonicalVoice;
		next.voiceName = canonicalVoice;
	}
	if (canonicalVoiceId) {
		next.speakerVoiceId = canonicalVoiceId;
		next.voiceId = canonicalVoiceId;
	}
	return next;
}
/** Fill legacy speaker fields only when callers have not set them explicitly. */
function withSpeakerSelectionFallbackCompat(config) {
	const next = config ? { ...config } : {};
	const speakerVoice = readString(next.speakerVoice);
	const speakerVoiceId = readString(next.speakerVoiceId);
	if (speakerVoice) {
		next.voice ??= speakerVoice;
		next.voiceName ??= speakerVoice;
	}
	if (speakerVoiceId) next.voiceId ??= speakerVoiceId;
	return next;
}
//#endregion
//#region packages/speech-core/src/tts.ts
const DEFAULT_TIMEOUT_MS = 3e4;
const DEFAULT_TTS_MAX_LENGTH = 1500;
const DEFAULT_TTS_SUMMARIZE = true;
const DEFAULT_MAX_TEXT_LENGTH = 4096;
function resolvePositiveTimeoutMs(timeoutMs) {
	return typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs > 0 ? (0, openclaw_plugin_sdk_number_runtime.clampTimerTimeoutMs)(timeoutMs) : void 0;
}
function resolveSpeechProviderTimeoutMs(params) {
	if (params.timeoutMs !== void 0) return resolvePositiveTimeoutMs(params.timeoutMs) ?? params.config.timeoutMs;
	if (params.config.timeoutMsSource !== "default") return resolvePositiveTimeoutMs(params.config.timeoutMs) ?? DEFAULT_TIMEOUT_MS;
	return resolvePositiveTimeoutMs(params.provider.defaultTimeoutMs) ?? params.config.timeoutMs;
}
let lastTtsAttempt;
function resolveConfiguredTtsAutoMode(raw) {
	return (0, openclaw_plugin_sdk_speech_core.normalizeTtsAutoMode)(raw.auto) ?? (raw.enabled ? "always" : "off");
}
function normalizeConfiguredSpeechProviderId(providerId) {
	const normalized = (0, openclaw_plugin_sdk_speech_core.normalizeSpeechProviderId)(providerId);
	if (!normalized) return;
	return normalized === "edge" ? "microsoft" : normalized;
}
function normalizeTtsPersonaId(personaId) {
	return (0, openclaw_plugin_sdk_string_coerce_runtime.normalizeOptionalLowercaseString)(personaId ?? void 0);
}
function resolveTtsPrefsPathValue(prefsPath) {
	if (prefsPath?.trim()) return (0, openclaw_plugin_sdk_text_utility_runtime.resolveUserPath)(prefsPath.trim());
	const envPath = process.env.OPERATOR_TTS_PREFS?.trim();
	if (envPath) return (0, openclaw_plugin_sdk_text_utility_runtime.resolveUserPath)(envPath);
	return node_path.default.join((0, openclaw_plugin_sdk_text_utility_runtime.resolveConfigDir)(process.env), "settings", "tts.json");
}
function resolveModelOverridePolicy(overrides) {
	if (!(overrides?.enabled ?? true)) return {
		enabled: false,
		allowText: false,
		allowProvider: false,
		allowVoice: false,
		allowModelId: false,
		allowVoiceSettings: false,
		allowNormalization: false,
		allowSeed: false
	};
	const allow = (value, defaultValue = true) => value ?? defaultValue;
	return {
		enabled: true,
		allowText: allow(overrides?.allowText),
		allowProvider: allow(overrides?.allowProvider, false),
		allowVoice: allow(overrides?.allowVoice),
		allowModelId: allow(overrides?.allowModelId),
		allowVoiceSettings: allow(overrides?.allowVoiceSettings),
		allowNormalization: allow(overrides?.allowNormalization),
		allowSeed: allow(overrides?.allowSeed)
	};
}
function resolveConfiguredSpeechVoiceModelRefs(cfg) {
	const effectiveCfg = cfg ? resolveTtsRuntimeConfig(cfg) : void 0;
	return require_voice_models.resolveSupportedVoiceModelRefs({
		config: effectiveCfg?.agents?.defaults?.voiceModel,
		providers: sortSpeechProvidersForAutoSelection(effectiveCfg)
	});
}
function resolveConfiguredSpeechVoiceModelForProvider(params) {
	const provider = params.provider ?? (0, openclaw_plugin_sdk_speech_core.getSpeechProvider)(params.providerId, params.cfg);
	if (params.voiceModel) return require_voice_models.voiceProviderSupportsModel(provider, params.voiceModel.model) ? params.voiceModel : void 0;
	return require_voice_models.resolveSupportedVoiceModelRefs({
		config: params.cfg?.agents?.defaults?.voiceModel,
		providers: provider ? [provider] : [],
		providerId: params.providerId
	})[0];
}
function applyVoiceModelToSpeechProviderConfig(params) {
	const voiceModel = resolveConfiguredSpeechVoiceModelForProvider({
		cfg: params.cfg,
		providerId: params.providerId,
		provider: params.provider,
		voiceModel: params.voiceModel
	});
	if (!voiceModel) return params.providerConfig;
	if ((0, openclaw_plugin_sdk_string_coerce_runtime.normalizeOptionalString)(params.providerConfig.model) || (0, openclaw_plugin_sdk_string_coerce_runtime.normalizeOptionalString)(params.providerConfig.modelId)) return params.providerConfig;
	return {
		...params.providerConfig,
		model: voiceModel.model,
		modelId: voiceModel.model
	};
}
function sortSpeechProvidersForAutoSelection(cfg) {
	return (0, openclaw_plugin_sdk_speech_core.listSpeechProviders)(cfg).toSorted((left, right) => {
		const leftOrder = left.autoSelectOrder ?? Number.MAX_SAFE_INTEGER;
		const rightOrder = right.autoSelectOrder ?? Number.MAX_SAFE_INTEGER;
		if (leftOrder !== rightOrder) return leftOrder - rightOrder;
		return left.id.localeCompare(right.id);
	});
}
function resolveTtsRuntimeConfig(cfg) {
	return (0, openclaw_plugin_sdk_runtime_config_snapshot.selectApplicableRuntimeConfig)({
		inputConfig: cfg,
		runtimeConfig: (0, openclaw_plugin_sdk_runtime_config_snapshot.getRuntimeConfigSnapshot)(),
		runtimeSourceConfig: (0, openclaw_plugin_sdk_runtime_config_snapshot.getRuntimeConfigSourceSnapshot)()
	}) ?? cfg;
}
function asProviderConfig(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
function asProviderConfigMap(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
function hasOwnProperty(value, key) {
	return Object.hasOwn(value, key);
}
function normalizeProviderConfigMap(value) {
	const rawMap = asProviderConfigMap(value);
	if (Object.keys(rawMap).length === 0) return;
	const next = {};
	for (const [providerId, providerConfig] of Object.entries(rawMap)) {
		const normalized = normalizeConfiguredSpeechProviderId(providerId) ?? providerId;
		next[normalized] = withSpeakerSelectionCompat(asProviderConfig(providerConfig));
	}
	return next;
}
function collectTtsPersonas(raw) {
	const rawPersonas = asProviderConfigMap(raw.personas);
	const personas = {};
	for (const [id, value] of Object.entries(rawPersonas)) {
		const normalizedId = normalizeTtsPersonaId(id);
		if (!normalizedId || typeof value !== "object" || value === null || Array.isArray(value)) continue;
		const persona = value;
		personas[normalizedId] = {
			...persona,
			id: normalizedId,
			provider: normalizeConfiguredSpeechProviderId(persona.provider) ?? persona.provider,
			providers: normalizeProviderConfigMap(persona.providers)
		};
	}
	return personas;
}
function resolvePersonaProviderConfig(persona, providerId) {
	if (!persona?.providers) return;
	const normalized = normalizeConfiguredSpeechProviderId(providerId) ?? providerId;
	if (hasOwnProperty(persona.providers, normalized)) return persona.providers[normalized];
	if (hasOwnProperty(persona.providers, providerId)) return persona.providers[providerId];
}
function mergeProviderConfigWithPersona(params) {
	if (!params.persona) return {
		providerConfig: params.providerConfig,
		personaBinding: "none"
	};
	const personaProviderConfig = resolvePersonaProviderConfig(params.persona, params.providerId);
	if (!personaProviderConfig) return {
		providerConfig: params.providerConfig,
		personaBinding: "missing"
	};
	return {
		providerConfig: {
			...params.providerConfig,
			...personaProviderConfig
		},
		personaProviderConfig,
		personaBinding: "applied"
	};
}
function resolveRawProviderConfig(raw, providerId) {
	if (!raw) return {};
	return withSpeakerSelectionCompat(asProviderConfig(asProviderConfigMap(raw.providers)[providerId] ?? raw[providerId]));
}
function resolveLazyProviderConfig(config, providerId, cfg, voiceModel) {
	const canonical = normalizeConfiguredSpeechProviderId(providerId) ?? (0, openclaw_plugin_sdk_string_coerce_runtime.normalizeLowercaseStringOrEmpty)(providerId);
	const existing = voiceModel ? void 0 : config.providerConfigs[canonical];
	const effectiveCfg = cfg ? resolveTtsRuntimeConfig(cfg) : config.sourceConfig;
	if (existing && !effectiveCfg) return existing;
	const rawConfig = resolveRawProviderConfig(config.rawConfig, canonical);
	const rawBaseConfig = config.rawConfig;
	const rawProviders = asProviderConfigMap(config.rawConfig?.providers);
	const resolvedProvider = (0, openclaw_plugin_sdk_speech_core.getSpeechProvider)(canonical, effectiveCfg);
	let hasRawProviderConfig = Object.hasOwn(rawProviders, canonical) || (rawBaseConfig ? Object.hasOwn(rawBaseConfig, canonical) : false);
	let rawProviderConfig = rawProviders[canonical] ?? rawBaseConfig?.[canonical];
	if (!hasRawProviderConfig) for (const alias of resolvedProvider?.aliases ?? []) {
		const normalizedAlias = (0, openclaw_plugin_sdk_speech_core.normalizeSpeechProviderId)(alias);
		if (!normalizedAlias) continue;
		if (Object.hasOwn(rawProviders, normalizedAlias)) {
			hasRawProviderConfig = true;
			rawProviderConfig = rawProviders[normalizedAlias];
			break;
		}
		if (rawBaseConfig && Object.hasOwn(rawBaseConfig, normalizedAlias)) {
			hasRawProviderConfig = true;
			rawProviderConfig = rawBaseConfig[normalizedAlias];
			break;
		}
	}
	const compatRawProviderConfig = applyVoiceModelToSpeechProviderConfig({
		cfg: effectiveCfg,
		providerId: canonical,
		providerConfig: withSpeakerSelectionCompat(asProviderConfig(rawProviderConfig)),
		provider: resolvedProvider,
		voiceModel
	});
	const shouldInjectCanonicalProviderConfig = hasRawProviderConfig || Boolean(voiceModel) || Object.keys(rawProviders).length === 0;
	const rawConfigForProvider = {
		...rawBaseConfig,
		providers: shouldInjectCanonicalProviderConfig ? {
			...rawProviders,
			[canonical]: compatRawProviderConfig
		} : rawProviders,
		...shouldInjectCanonicalProviderConfig ? { [canonical]: compatRawProviderConfig } : {}
	};
	const next = withSpeakerSelectionCompat(effectiveCfg && resolvedProvider?.resolveConfig ? resolvedProvider.resolveConfig({
		cfg: effectiveCfg,
		rawConfig: rawConfigForProvider,
		timeoutMs: resolveSpeechProviderTimeoutMs({
			config,
			provider: resolvedProvider
		})
	}) : applyVoiceModelToSpeechProviderConfig({
		cfg: effectiveCfg,
		providerId: canonical,
		providerConfig: rawConfig,
		provider: resolvedProvider,
		voiceModel
	}));
	if (!voiceModel) config.providerConfigs[canonical] = next;
	return next;
}
function collectDirectProviderConfigEntries(raw) {
	const entries = {};
	const rawProviders = asProviderConfigMap(raw.providers);
	for (const [providerId, value] of Object.entries(rawProviders)) {
		const normalized = normalizeConfiguredSpeechProviderId(providerId) ?? providerId;
		entries[normalized] = withSpeakerSelectionCompat(asProviderConfig(value));
	}
	const reservedKeys = /* @__PURE__ */ new Set([
		"auto",
		"enabled",
		"maxTextLength",
		"mode",
		"modelOverrides",
		"persona",
		"personas",
		"prefsPath",
		"provider",
		"providers",
		"summaryModel",
		"timeoutMs"
	]);
	for (const [key, value] of Object.entries(raw)) {
		if (reservedKeys.has(key)) continue;
		if (typeof value !== "object" || value === null || Array.isArray(value)) continue;
		const normalized = normalizeConfiguredSpeechProviderId(key) ?? key;
		entries[normalized] ??= withSpeakerSelectionCompat(asProviderConfig(value));
	}
	return entries;
}
function getResolvedSpeechProviderConfig(config, providerId, cfg) {
	const effectiveCfg = cfg ? resolveTtsRuntimeConfig(cfg) : config.sourceConfig;
	return resolveLazyProviderConfig(config, (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(providerId, effectiveCfg) ?? normalizeConfiguredSpeechProviderId(providerId) ?? (0, openclaw_plugin_sdk_string_coerce_runtime.normalizeLowercaseStringOrEmpty)(providerId), effectiveCfg);
}
function getResolvedSpeechProviderConfigForVoiceModel(params) {
	if (!params.voiceModel) return getResolvedSpeechProviderConfig(params.config, params.providerId, params.cfg);
	const effectiveCfg = resolveTtsRuntimeConfig(params.cfg);
	const canonical = (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(params.providerId, effectiveCfg) ?? normalizeConfiguredSpeechProviderId(params.providerId) ?? (0, openclaw_plugin_sdk_string_coerce_runtime.normalizeLowercaseStringOrEmpty)(params.providerId);
	return resolveLazyProviderConfig(params.config, canonical, effectiveCfg, params.voiceModel);
}
function resolveTtsConfig(cfgInput, contextOrAgentId) {
	let cfg = cfgInput;
	cfg = resolveTtsRuntimeConfig(cfg);
	const raw = (0, openclaw_plugin_sdk_speech_core.resolveEffectiveTtsConfig)(cfg, contextOrAgentId);
	const providerSource = raw.provider ? "config" : "default";
	const timeoutMs = raw.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const timeoutMsSource = raw.timeoutMs === void 0 ? "default" : "config";
	const auto = resolveConfiguredTtsAutoMode(raw);
	const persona = normalizeTtsPersonaId(raw.persona);
	return {
		auto,
		mode: raw.mode ?? "final",
		provider: normalizeConfiguredSpeechProviderId(raw.provider) ?? (providerSource === "config" ? (0, openclaw_plugin_sdk_string_coerce_runtime.normalizeOptionalLowercaseString)(raw.provider) ?? "" : ""),
		providerSource,
		persona,
		personas: collectTtsPersonas(raw),
		summaryModel: (0, openclaw_plugin_sdk_string_coerce_runtime.normalizeOptionalString)(raw.summaryModel),
		modelOverrides: resolveModelOverridePolicy(raw.modelOverrides),
		providerConfigs: collectDirectProviderConfigEntries(raw),
		prefsPath: raw.prefsPath,
		maxTextLength: raw.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH,
		timeoutMs,
		timeoutMsSource,
		rawConfig: raw,
		sourceConfig: cfg
	};
}
function resolveTtsPrefsPath(config) {
	return resolveTtsPrefsPathValue(config.prefsPath);
}
function resolveTtsAutoModeFromPrefs(prefs) {
	const auto = (0, openclaw_plugin_sdk_speech_core.normalizeTtsAutoMode)(prefs.tts?.auto);
	if (auto) return auto;
	if (typeof prefs.tts?.enabled === "boolean") return prefs.tts.enabled ? "always" : "off";
}
function resolveTtsAutoMode(params) {
	const sessionAuto = (0, openclaw_plugin_sdk_speech_core.normalizeTtsAutoMode)(params.sessionAuto);
	if (sessionAuto) return sessionAuto;
	const prefsAuto = resolveTtsAutoModeFromPrefs(readPrefs(params.prefsPath));
	if (prefsAuto) return prefsAuto;
	return params.config.auto;
}
function resolveEffectiveTtsAutoState(params) {
	const raw = (0, openclaw_plugin_sdk_speech_core.resolveEffectiveTtsConfig)(params.cfg, {
		agentId: params.agentId,
		channelId: params.channelId,
		accountId: params.accountId
	});
	const prefsPath = resolveTtsPrefsPathValue(raw.prefsPath);
	const sessionAuto = (0, openclaw_plugin_sdk_speech_core.normalizeTtsAutoMode)(params.sessionAuto);
	if (sessionAuto) return {
		autoMode: sessionAuto,
		prefsPath
	};
	const prefsAuto = resolveTtsAutoModeFromPrefs(readPrefs(prefsPath));
	if (prefsAuto) return {
		autoMode: prefsAuto,
		prefsPath
	};
	return {
		autoMode: resolveConfiguredTtsAutoMode(raw),
		prefsPath
	};
}
function buildTtsSystemPromptHint(cfgInput, agentId) {
	let cfg = cfgInput;
	cfg = resolveTtsRuntimeConfig(cfg);
	const { autoMode, prefsPath } = resolveEffectiveTtsAutoState({
		cfg,
		agentId
	});
	if (autoMode === "off") return;
	const persona = getTtsPersona(resolveTtsConfig(cfg, agentId), prefsPath);
	const maxLength = getTtsMaxLength(prefsPath);
	const summarize = isSummarizationEnabled(prefsPath) ? "on" : "off";
	return [
		"Voice (TTS) is enabled.",
		autoMode === "inbound" ? "Only use TTS when the user's last message includes audio/voice." : autoMode === "tagged" ? "Only use TTS when you include [[tts:key=value]] directives or a [[tts:text]]...[[/tts:text]] block." : void 0,
		persona ? `Active TTS persona: ${persona.label ?? persona.id}${persona.description ? ` - ${persona.description}` : ""}.` : void 0,
		`Keep spoken text ≤${maxLength} chars to avoid auto-summary (summary ${summarize}).`,
		"If workspace context (especially MEMORY.md) tells you not to use [[tts:...]] or to use a local/non-tagged voice workflow, follow that workspace instruction instead.",
		"Use [[tts:...]] and optional [[tts:text]]...[[/tts:text]] to control voice/expressiveness."
	].filter(Boolean).join("\n");
}
function readPrefs(prefsPath) {
	try {
		if (!(0, node_fs.existsSync)(prefsPath)) return {};
		return JSON.parse((0, node_fs.readFileSync)(prefsPath, "utf8"));
	} catch {
		return {};
	}
}
function atomicWriteFileSync(filePath, content) {
	(0, openclaw_plugin_sdk_security_runtime.privateFileStoreSync)(node_path.default.dirname(filePath)).writeText(node_path.default.basename(filePath), content);
}
function updatePrefs(prefsPath, update) {
	const prefs = readPrefs(prefsPath);
	update(prefs);
	atomicWriteFileSync(prefsPath, JSON.stringify(prefs, null, 2));
}
function isTtsEnabled(config, prefsPath, sessionAuto) {
	return resolveTtsAutoMode({
		config,
		prefsPath,
		sessionAuto
	}) !== "off";
}
function setTtsAutoMode(prefsPath, mode) {
	updatePrefs(prefsPath, (prefs) => {
		const next = { ...prefs.tts };
		delete next.enabled;
		next.auto = mode;
		prefs.tts = next;
	});
}
function setTtsEnabled(prefsPath, enabled) {
	setTtsAutoMode(prefsPath, enabled ? "always" : "off");
}
function getTtsProvider(config, prefsPath) {
	const prefs = readPrefs(prefsPath);
	const prefsProvider = (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(prefs.tts?.provider) ?? normalizeConfiguredSpeechProviderId(prefs.tts?.provider);
	if (prefsProvider) return prefsProvider;
	const activePersona = resolveTtsPersonaFromPrefs(config, prefs);
	const personaProvider = (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(activePersona?.provider, config.sourceConfig) ?? normalizeConfiguredSpeechProviderId(activePersona?.provider);
	if (personaProvider && (0, openclaw_plugin_sdk_speech_core.getSpeechProvider)(personaProvider, config.sourceConfig)) return personaProvider;
	if (config.providerSource === "config") return normalizeConfiguredSpeechProviderId(config.provider) ?? config.provider;
	const configuredVoiceProvider = resolveConfiguredSpeechVoiceModelRefs(config.sourceConfig)[0]?.provider;
	if (configuredVoiceProvider && (0, openclaw_plugin_sdk_speech_core.getSpeechProvider)(configuredVoiceProvider, config.sourceConfig)) return configuredVoiceProvider;
	const effectiveCfg = config.sourceConfig;
	for (const provider of sortSpeechProvidersForAutoSelection(effectiveCfg)) if (provider.isConfigured({
		cfg: effectiveCfg,
		providerConfig: config.providerConfigs[provider.id] ?? {},
		timeoutMs: resolveSpeechProviderTimeoutMs({
			config,
			provider
		})
	})) return provider.id;
	return config.provider;
}
function resolveTtsPersonaFromPrefs(config, prefs) {
	if (prefs.tts && hasOwnProperty(prefs.tts, "persona")) {
		const prefsPersona = normalizeTtsPersonaId(prefs.tts.persona);
		return prefsPersona ? config.personas[prefsPersona] : void 0;
	}
	const configPersona = normalizeTtsPersonaId(config.persona);
	return configPersona ? config.personas[configPersona] : void 0;
}
function getTtsPersona(config, prefsPath) {
	return resolveTtsPersonaFromPrefs(config, readPrefs(prefsPath));
}
function listTtsPersonas(config) {
	return Object.values(config.personas).toSorted((left, right) => left.id.localeCompare(right.id));
}
function setTtsPersona(prefsPath, persona) {
	updatePrefs(prefsPath, (prefs) => {
		const next = { ...prefs.tts };
		next.persona = normalizeTtsPersonaId(persona) ?? null;
		prefs.tts = next;
	});
}
function setTtsProvider(prefsPath, provider) {
	updatePrefs(prefsPath, (prefs) => {
		prefs.tts = {
			...prefs.tts,
			provider: (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(provider) ?? provider
		};
	});
}
function resolveExplicitTtsOverrides(params) {
	const cfg = resolveTtsRuntimeConfig(params.cfg);
	const providerInput = params.provider?.trim();
	const modelId = params.modelId?.trim();
	const voiceId = params.voiceId?.trim();
	const config = resolveTtsConfig(cfg, {
		agentId: params.agentId,
		channelId: params.channelId,
		accountId: params.accountId
	});
	const prefsPath = params.prefsPath ?? resolveTtsPrefsPath(config);
	const selectedProvider = (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(providerInput, cfg) ?? (modelId || voiceId ? getTtsProvider(config, prefsPath) : void 0);
	if (providerInput && !selectedProvider) throw new Error(`Unknown TTS provider "${providerInput}".`);
	if (!modelId && !voiceId) return selectedProvider ? { provider: selectedProvider } : {};
	if (!selectedProvider) throw new Error("TTS model or voice overrides require a resolved provider.");
	const provider = (0, openclaw_plugin_sdk_speech_core.getSpeechProvider)(selectedProvider, cfg);
	if (!provider) throw new Error(`speech provider ${selectedProvider} is not registered`);
	if (!provider.resolveTalkOverrides) throw new Error(`TTS provider "${selectedProvider}" does not support model or voice overrides.`);
	const providerOverrides = provider.resolveTalkOverrides({
		talkProviderConfig: {},
		params: {
			...voiceId ? { voiceId } : {},
			...modelId ? { modelId } : {}
		}
	});
	if ((voiceId || modelId) && (!providerOverrides || Object.keys(providerOverrides).length === 0)) throw new Error(`TTS provider "${selectedProvider}" ignored the requested model or voice overrides.`);
	const overridesRecord = providerOverrides;
	return {
		provider: selectedProvider,
		providerOverrides: { [provider.id]: overridesRecord }
	};
}
function getTtsMaxLength(prefsPath) {
	return readPrefs(prefsPath).tts?.maxLength ?? DEFAULT_TTS_MAX_LENGTH;
}
function setTtsMaxLength(prefsPath, maxLength) {
	updatePrefs(prefsPath, (prefs) => {
		prefs.tts = {
			...prefs.tts,
			maxLength
		};
	});
}
function isSummarizationEnabled(prefsPath) {
	return readPrefs(prefsPath).tts?.summarize ?? DEFAULT_TTS_SUMMARIZE;
}
function setSummarizationEnabled(prefsPath, enabled) {
	updatePrefs(prefsPath, (prefs) => {
		prefs.tts = {
			...prefs.tts,
			summarize: enabled
		};
	});
}
function getLastTtsAttempt() {
	return lastTtsAttempt;
}
function setLastTtsAttempt(entry) {
	lastTtsAttempt = entry;
}
function resolveTtsSynthesisTarget(channel) {
	return (0, openclaw_plugin_sdk_channel_targets.resolveChannelTtsVoiceDelivery)(channel)?.synthesisTarget ?? "audio-file";
}
function supportsAudioFileVoiceMemoOutput(params) {
	const formats = new Set(params.audioFileFormats?.map((format) => format.trim().toLowerCase()));
	if (formats.size === 0) return false;
	const extension = params.fileExtension?.trim().toLowerCase();
	if (extension && formats.has(extension.replace(/^\./, ""))) return true;
	const outputFormat = params.outputFormat?.trim().toLowerCase();
	return outputFormat ? formats.has(outputFormat) : false;
}
function shouldDeliverTtsAsVoice(params) {
	const delivery = (0, openclaw_plugin_sdk_channel_targets.resolveChannelTtsVoiceDelivery)(params.channel);
	if (!delivery) return false;
	if (delivery.synthesisTarget === "audio-file") return params.target === "audio-file" && supportsAudioFileVoiceMemoOutput({
		fileExtension: params.fileExtension,
		outputFormat: params.outputFormat,
		audioFileFormats: delivery.audioFileFormats
	});
	if (params.target !== "voice-note") return false;
	return params.voiceCompatible === true || delivery.transcodesAudio === true;
}
function resolveTtsProviderOrder(primary, cfg) {
	const effectiveCfg = cfg ? resolveTtsRuntimeConfig(cfg) : void 0;
	const normalizedPrimary = (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(primary, effectiveCfg) ?? primary;
	const ordered = /* @__PURE__ */ new Set([normalizedPrimary]);
	for (const ref of require_voice_models.resolveVoiceModelRefs(effectiveCfg?.agents?.defaults?.voiceModel)) {
		const provider = (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(ref.provider, effectiveCfg) ?? ref.provider;
		if (provider !== normalizedPrimary) ordered.add(provider);
	}
	for (const provider of sortSpeechProvidersForAutoSelection(effectiveCfg)) {
		const normalized = provider.id;
		if (normalized !== normalizedPrimary) ordered.add(normalized);
	}
	return [...ordered];
}
function resolveTtsProviderCandidates(primary, cfg) {
	const effectiveCfg = cfg ? resolveTtsRuntimeConfig(cfg) : void 0;
	return require_voice_models.resolveVoiceProviderCandidates({
		primaryProvider: (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(primary, effectiveCfg) ?? primary,
		providers: sortSpeechProvidersForAutoSelection(effectiveCfg),
		voiceModelConfig: effectiveCfg?.agents?.defaults?.voiceModel
	});
}
function resolvePrimaryTtsProviderCandidate(primary, cfg) {
	const effectiveCfg = cfg ? resolveTtsRuntimeConfig(cfg) : void 0;
	return require_voice_models.resolvePrimaryVoiceProviderCandidate({
		primaryProvider: (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(primary, effectiveCfg) ?? primary,
		providers: sortSpeechProvidersForAutoSelection(effectiveCfg),
		voiceModelConfig: effectiveCfg?.agents?.defaults?.voiceModel
	});
}
function isTtsProviderConfigured(config, provider, cfg) {
	const effectiveCfg = cfg ? resolveTtsRuntimeConfig(cfg) : config.sourceConfig;
	const resolvedProvider = (0, openclaw_plugin_sdk_speech_core.getSpeechProvider)(provider, effectiveCfg);
	if (!resolvedProvider) return false;
	return resolvedProvider.isConfigured({
		cfg: effectiveCfg,
		providerConfig: getResolvedSpeechProviderConfig(config, resolvedProvider.id, effectiveCfg),
		timeoutMs: resolveSpeechProviderTimeoutMs({
			config,
			provider: resolvedProvider
		})
	}) ?? false;
}
function formatTtsProviderError(provider, err) {
	const error = err instanceof Error ? err : new Error(String(err));
	if (error.name === "AbortError") return `${provider}: request timed out`;
	return `${provider}: ${(0, openclaw_plugin_sdk_logging_core.redactSensitiveText)(error.message)}`;
}
function sanitizeTtsErrorForLog(err) {
	return (0, openclaw_plugin_sdk_logging_core.redactSensitiveText)((0, openclaw_plugin_sdk_error_runtime.formatErrorMessage)(err)).replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
}
function buildTtsFailureResult(errors, attemptedProviders, attempts, persona) {
	return {
		success: false,
		error: `TTS conversion failed: ${errors.join("; ") || "no providers available"}`,
		attemptedProviders,
		attempts,
		persona
	};
}
function resolveReadySpeechProvider(params) {
	const resolvedProvider = (0, openclaw_plugin_sdk_speech_core.getSpeechProvider)(params.provider, params.cfg);
	if (!resolvedProvider) return {
		kind: "skip",
		reasonCode: "no_provider_registered",
		message: `${params.provider}: no provider registered`
	};
	const merged = mergeProviderConfigWithPersona({
		providerConfig: getResolvedSpeechProviderConfigForVoiceModel({
			config: params.config,
			providerId: resolvedProvider.id,
			cfg: params.cfg,
			voiceModel: params.voiceModel
		}),
		persona: params.persona,
		providerId: resolvedProvider.id
	});
	if (params.persona?.fallbackPolicy === "fail" && merged.personaBinding === "missing") return {
		kind: "skip",
		reasonCode: "not_configured",
		message: `${params.provider}: persona ${params.persona.id} has no provider binding`,
		personaBinding: "missing"
	};
	if (!resolvedProvider.isConfigured({
		cfg: params.cfg,
		providerConfig: merged.providerConfig,
		timeoutMs: resolveSpeechProviderTimeoutMs({
			config: params.config,
			provider: resolvedProvider
		})
	})) return {
		kind: "skip",
		reasonCode: "not_configured",
		message: `${params.provider}: not configured`
	};
	if (params.requireTelephony && !resolvedProvider.synthesizeTelephony) return {
		kind: "skip",
		reasonCode: "unsupported_for_telephony",
		message: `${params.provider}: unsupported for telephony`
	};
	return {
		kind: "ready",
		provider: resolvedProvider,
		providerConfig: merged.providerConfig,
		personaProviderConfig: merged.personaProviderConfig,
		synthesisPersona: params.persona?.fallbackPolicy === "provider-defaults" && merged.personaBinding === "missing" ? void 0 : params.persona,
		personaBinding: merged.personaBinding
	};
}
async function prepareSpeechSynthesis(params) {
	if (!params.provider.prepareSynthesis) return {
		text: params.text,
		providerConfig: params.providerConfig,
		providerOverrides: params.providerOverrides
	};
	const prepared = await params.provider.prepareSynthesis({
		text: params.text,
		cfg: params.cfg,
		providerConfig: params.providerConfig,
		providerOverrides: params.providerOverrides,
		persona: params.persona,
		personaProviderConfig: params.personaProviderConfig,
		target: params.target,
		timeoutMs: params.timeoutMs
	});
	return {
		text: prepared?.text ?? params.text,
		providerConfig: prepared?.providerConfig ? {
			...params.providerConfig,
			...prepared.providerConfig
		} : params.providerConfig,
		providerOverrides: prepared?.providerOverrides ? {
			...params.providerOverrides,
			...prepared.providerOverrides
		} : params.providerOverrides
	};
}
function resolveTtsRequestSetup(params) {
	const cfg = resolveTtsRuntimeConfig(params.cfg);
	const config = resolveTtsConfig(cfg, {
		agentId: params.agentId,
		channelId: params.channelId,
		accountId: params.accountId
	});
	const prefsPath = params.prefsPath ?? resolveTtsPrefsPath(config);
	if (params.text.length > config.maxTextLength) return { error: `Text too long (${params.text.length} chars, max ${config.maxTextLength})` };
	const userProvider = getTtsProvider(config, prefsPath);
	const provider = (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(params.providerOverride, cfg) ?? userProvider;
	return {
		cfg,
		config,
		persona: getTtsPersona(config, prefsPath),
		providers: params.disableFallback ? [resolvePrimaryTtsProviderCandidate(provider, cfg)] : resolveTtsProviderCandidates(provider, cfg)
	};
}
function readTtsResultString(value) {
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function resolveTtsResultModel(providerConfig, providerOverrides) {
	return readTtsResultString(providerOverrides?.modelId) ?? readTtsResultString(providerOverrides?.model) ?? readTtsResultString(providerConfig.modelId) ?? readTtsResultString(providerConfig.model);
}
function resolveTtsResultVoice(providerConfig, providerOverrides) {
	return readTtsResultString(providerOverrides?.speakerVoiceId) ?? readTtsResultString(providerOverrides?.speakerVoice) ?? readTtsResultString(providerOverrides?.voiceId) ?? readTtsResultString(providerOverrides?.voiceName) ?? readTtsResultString(providerOverrides?.voice) ?? readTtsResultString(providerConfig.speakerVoiceId) ?? readTtsResultString(providerConfig.speakerVoice) ?? readTtsResultString(providerConfig.voiceId) ?? readTtsResultString(providerConfig.voiceName) ?? readTtsResultString(providerConfig.voice);
}
async function textToSpeech(params) {
	const synthesis = await synthesizeSpeech(params);
	if (!synthesis.success || !synthesis.audioBuffer || !synthesis.fileExtension) return {
		success: false,
		error: synthesis.error ?? "TTS conversion failed",
		persona: synthesis.persona,
		attemptedProviders: synthesis.attemptedProviders,
		attempts: synthesis.attempts
	};
	let audioBuffer = synthesis.audioBuffer;
	let fileExtension = synthesis.fileExtension;
	let outputFormat = synthesis.outputFormat;
	const transcoded = await maybePreTranscodeForVoiceDelivery({
		channel: params.channel,
		target: synthesis.target,
		audioBuffer,
		fileExtension,
		outputFormat
	});
	if (transcoded) {
		audioBuffer = transcoded.audioBuffer;
		fileExtension = transcoded.fileExtension;
		outputFormat = transcoded.outputFormat;
	}
	const temp = (0, openclaw_plugin_sdk_sandbox.tempWorkspaceSync)({
		rootDir: (0, openclaw_plugin_sdk_sandbox.resolvePreferredOperatorTmpDir)(),
		prefix: "tts-"
	});
	const audioPath = temp.write(`voice-${Date.now()}${fileExtension}`, audioBuffer);
	(0, openclaw_plugin_sdk_speech_core.scheduleCleanup)(temp.dir);
	return {
		success: true,
		audioPath,
		latencyMs: synthesis.latencyMs,
		provider: synthesis.provider,
		persona: synthesis.persona,
		fallbackFrom: synthesis.fallbackFrom,
		attemptedProviders: synthesis.attemptedProviders,
		attempts: synthesis.attempts,
		outputFormat,
		voiceCompatible: synthesis.voiceCompatible,
		audioAsVoice: shouldDeliverTtsAsVoice({
			channel: params.channel,
			target: synthesis.target,
			voiceCompatible: synthesis.voiceCompatible,
			fileExtension,
			outputFormat
		}),
		target: synthesis.target
	};
}
async function maybePreTranscodeForVoiceDelivery(params) {
	if (params.target !== "audio-file") return;
	const preferred = (0, openclaw_plugin_sdk_channel_targets.resolveChannelTtsVoiceDelivery)(params.channel)?.preferAudioFileFormat?.trim().toLowerCase();
	if (!preferred) return;
	const sourceExt = params.fileExtension.trim().toLowerCase().replace(/^\./, "");
	if (sourceExt === preferred) return;
	const outcome = await (0, openclaw_plugin_sdk_media_runtime.transcodeAudioBuffer)({
		audioBuffer: params.audioBuffer,
		sourceExtension: sourceExt,
		targetExtension: preferred
	});
	if (!outcome.ok) {
		if (outcome.reason === "transcoder-failed") (0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: pre-transcode ${sourceExt}->${preferred} for channel=${params.channel ?? "?"} failed: ${outcome.detail ?? "unknown"}`);
		return;
	}
	return {
		audioBuffer: outcome.buffer,
		fileExtension: `.${preferred}`,
		outputFormat: preferred
	};
}
async function synthesizeSpeech(params) {
	const setup = resolveTtsRequestSetup({
		text: params.text,
		cfg: params.cfg,
		prefsPath: params.prefsPath,
		providerOverride: params.overrides?.provider,
		disableFallback: params.disableFallback,
		agentId: params.agentId,
		channelId: params.channel,
		accountId: params.accountId
	});
	if ("error" in setup) return {
		success: false,
		error: setup.error
	};
	const { cfg, config, persona, providers } = setup;
	const target = resolveTtsSynthesisTarget(params.channel);
	const errors = [];
	const attemptedProviders = [];
	const attempts = [];
	const primaryProvider = providers[0]?.provider;
	(0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: starting with provider ${primaryProvider}, fallbacks: ${providers.slice(1).map((entry) => entry.provider).join(", ") || "none"}`);
	for (const { provider, voiceModel } of providers) {
		attemptedProviders.push(provider);
		const providerStart = Date.now();
		try {
			const resolvedProvider = resolveReadySpeechProvider({
				provider,
				cfg,
				config,
				persona,
				voiceModel
			});
			if (resolvedProvider.kind === "skip") {
				errors.push(resolvedProvider.message);
				attempts.push({
					provider,
					outcome: "skipped",
					reasonCode: resolvedProvider.reasonCode,
					persona: persona?.id,
					...resolvedProvider.personaBinding ? { personaBinding: resolvedProvider.personaBinding } : {},
					error: resolvedProvider.message
				});
				(0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: provider ${provider} skipped (${resolvedProvider.message})`);
				continue;
			}
			const timeoutMs = resolveSpeechProviderTimeoutMs({
				timeoutMs: params.timeoutMs ?? voiceModel?.timeoutMs,
				config,
				provider: resolvedProvider.provider
			});
			const prepared = await prepareSpeechSynthesis({
				provider: resolvedProvider.provider,
				text: params.text,
				cfg,
				providerConfig: resolvedProvider.providerConfig,
				providerOverrides: params.overrides?.providerOverrides?.[resolvedProvider.provider.id],
				persona: resolvedProvider.synthesisPersona,
				personaProviderConfig: resolvedProvider.personaProviderConfig,
				target,
				timeoutMs
			});
			const synthesis = await resolvedProvider.provider.synthesize({
				text: prepared.text,
				cfg,
				providerConfig: prepared.providerConfig,
				target,
				providerOverrides: prepared.providerOverrides,
				timeoutMs
			});
			const latencyMs = Date.now() - providerStart;
			attempts.push({
				provider,
				outcome: "success",
				reasonCode: "success",
				persona: persona?.id,
				personaBinding: resolvedProvider.personaBinding,
				latencyMs
			});
			return {
				success: true,
				audioBuffer: synthesis.audioBuffer,
				latencyMs,
				provider,
				providerModel: resolveTtsResultModel(prepared.providerConfig, prepared.providerOverrides),
				providerVoice: resolveTtsResultVoice(prepared.providerConfig, prepared.providerOverrides),
				persona: persona?.id,
				fallbackFrom: provider !== primaryProvider ? primaryProvider : void 0,
				attemptedProviders,
				attempts,
				outputFormat: synthesis.outputFormat,
				voiceCompatible: synthesis.voiceCompatible,
				fileExtension: synthesis.fileExtension,
				target
			};
		} catch (err) {
			const errorMsg = formatTtsProviderError(provider, err);
			const latencyMs = Date.now() - providerStart;
			errors.push(errorMsg);
			attempts.push({
				provider,
				outcome: "failed",
				reasonCode: err instanceof Error && err.name === "AbortError" ? "timeout" : "provider_error",
				latencyMs,
				persona: persona?.id,
				personaBinding: resolvePersonaProviderConfig(persona, provider) != null ? "applied" : persona ? "missing" : "none",
				error: errorMsg
			});
			const rawError = sanitizeTtsErrorForLog(err);
			if (provider === primaryProvider) (0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: primary provider ${provider} failed (${rawError})${providers.length > 1 ? "; trying fallback providers." : "; no fallback providers configured."}`);
			else (0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: ${provider} failed (${rawError}); trying next provider.`);
		}
	}
	return buildTtsFailureResult(errors, attemptedProviders, attempts, persona?.id);
}
function hasLegacyFinalMediaDirective(text) {
	return /(?:^|\n)\s*MEDIA\s*:/i.test(text);
}
async function maybeApplyTtsToPayload(params) {
	if (params.payload.isCompactionNotice) return params.payload;
	const cfg = resolveTtsRuntimeConfig(params.cfg);
	const { autoMode, prefsPath } = resolveEffectiveTtsAutoState({
		cfg,
		sessionAuto: params.ttsAuto,
		agentId: params.agentId,
		channelId: params.channel,
		accountId: params.accountId
	});
	if (autoMode === "off") return params.payload;
	const config = resolveTtsConfig(cfg, {
		agentId: params.agentId,
		channelId: params.channel,
		accountId: params.accountId
	});
	const activeProvider = getTtsProvider(config, prefsPath);
	const reply = (0, openclaw_plugin_sdk_reply_payload.resolveSendableOutboundReplyParts)(params.payload);
	const text = reply.text;
	const directives = (0, openclaw_plugin_sdk_speech_core.parseTtsDirectives)(text, config.modelOverrides, {
		cfg,
		providerConfigs: config.providerConfigs,
		preferredProviderId: activeProvider
	});
	if (directives.warnings.length > 0) (0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: ignored directive overrides (${directives.warnings.join("; ")})`);
	if ((0, openclaw_plugin_sdk_runtime_env.isVerbose)()) {
		const effectiveProvider = directives.overrides?.provider ? (0, openclaw_plugin_sdk_speech_core.canonicalizeSpeechProviderId)(directives.overrides.provider, cfg) ?? activeProvider : activeProvider;
		(0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: auto mode enabled (${autoMode}), channel=${params.channel}, selected provider=${effectiveProvider}, config.provider=${config.provider}, config.providerSource=${config.providerSource}`);
	}
	const trimmedCleaned = directives.cleanedText.trim();
	const visibleText = trimmedCleaned.length > 0 ? trimmedCleaned : "";
	const explicitTtsText = directives.ttsText?.trim() || "";
	const ttsText = explicitTtsText || visibleText;
	const nextPayload = visibleText === text.trim() ? params.payload : {
		...params.payload,
		text: visibleText.length > 0 ? visibleText : void 0
	};
	if (autoMode === "tagged" && !directives.hasDirective) return nextPayload;
	if (autoMode === "inbound" && params.inboundAudio !== true) return nextPayload;
	if ((config.mode ?? "final") === "final" && params.kind && params.kind !== "final") return nextPayload;
	if (!ttsText.trim()) return nextPayload;
	if (reply.hasMedia || hasLegacyFinalMediaDirective(text)) return nextPayload;
	if (!explicitTtsText && ttsText.trim().length < 10) return nextPayload;
	const maxLength = getTtsMaxLength(prefsPath);
	let textForAudio = ttsText.trim();
	let wasSummarized = false;
	if (textForAudio.length > maxLength) if (!isSummarizationEnabled(prefsPath)) {
		(0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: truncating long text (${textForAudio.length} > ${maxLength}), summarization disabled.`);
		textForAudio = `${(0, openclaw_plugin_sdk_text_utility_runtime.truncateUtf16Safe)(textForAudio, maxLength - 3)}...`;
	} else try {
		textForAudio = (await (0, openclaw_plugin_sdk_speech_core.summarizeText)({
			text: textForAudio,
			targetLength: maxLength,
			cfg,
			config,
			timeoutMs: config.timeoutMs
		})).summary;
		wasSummarized = true;
		if (textForAudio.length > config.maxTextLength) {
			(0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: summary exceeded hard limit (${textForAudio.length} > ${config.maxTextLength}); truncating.`);
			textForAudio = `${(0, openclaw_plugin_sdk_text_utility_runtime.truncateUtf16Safe)(textForAudio, config.maxTextLength - 3)}...`;
		}
	} catch (err) {
		(0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: summarization failed, truncating instead: ${err.message}`);
		textForAudio = `${(0, openclaw_plugin_sdk_text_utility_runtime.truncateUtf16Safe)(textForAudio, maxLength - 3)}...`;
	}
	textForAudio = (0, openclaw_plugin_sdk_text_chunking.stripMarkdown)(textForAudio).trim();
	if (!textForAudio) return nextPayload;
	if (!explicitTtsText && textForAudio.length < 10) return nextPayload;
	const ttsStart = Date.now();
	const result = await textToSpeech({
		text: textForAudio,
		cfg,
		prefsPath,
		channel: params.channel,
		overrides: directives.overrides,
		agentId: params.agentId,
		accountId: params.accountId
	});
	if (result.success && result.audioPath) {
		lastTtsAttempt = {
			timestamp: Date.now(),
			success: true,
			textLength: text.length,
			summarized: wasSummarized,
			provider: result.provider,
			persona: result.persona,
			fallbackFrom: result.fallbackFrom,
			attemptedProviders: result.attemptedProviders,
			attempts: result.attempts,
			latencyMs: result.latencyMs
		};
		const payloadWithAudio = {
			...nextPayload,
			mediaUrl: result.audioPath,
			audioAsVoice: result.audioAsVoice || params.payload.audioAsVoice,
			spokenText: textForAudio,
			trustedLocalMedia: true
		};
		return nextPayload.text?.trim() ? (0, openclaw_plugin_sdk_reply_payload.markReplyPayloadAsTtsSupplement)(payloadWithAudio) : payloadWithAudio;
	}
	lastTtsAttempt = {
		timestamp: Date.now(),
		success: false,
		textLength: text.length,
		summarized: wasSummarized,
		persona: result.persona,
		attemptedProviders: result.attemptedProviders,
		attempts: result.attempts,
		error: result.error
	};
	(0, openclaw_plugin_sdk_runtime_env.logVerbose)(`TTS: conversion failed after ${Date.now() - ttsStart}ms (${result.error ?? "unknown"}).`);
	return nextPayload;
}
//#endregion
Object.defineProperty(exports, "buildTtsSystemPromptHint", {
	enumerable: true,
	get: function() {
		return buildTtsSystemPromptHint;
	}
});
Object.defineProperty(exports, "getLastTtsAttempt", {
	enumerable: true,
	get: function() {
		return getLastTtsAttempt;
	}
});
Object.defineProperty(exports, "getResolvedSpeechProviderConfig", {
	enumerable: true,
	get: function() {
		return getResolvedSpeechProviderConfig;
	}
});
Object.defineProperty(exports, "getTtsMaxLength", {
	enumerable: true,
	get: function() {
		return getTtsMaxLength;
	}
});
Object.defineProperty(exports, "getTtsPersona", {
	enumerable: true,
	get: function() {
		return getTtsPersona;
	}
});
Object.defineProperty(exports, "getTtsProvider", {
	enumerable: true,
	get: function() {
		return getTtsProvider;
	}
});
Object.defineProperty(exports, "isSummarizationEnabled", {
	enumerable: true,
	get: function() {
		return isSummarizationEnabled;
	}
});
Object.defineProperty(exports, "isTtsEnabled", {
	enumerable: true,
	get: function() {
		return isTtsEnabled;
	}
});
Object.defineProperty(exports, "isTtsProviderConfigured", {
	enumerable: true,
	get: function() {
		return isTtsProviderConfigured;
	}
});
Object.defineProperty(exports, "listTtsPersonas", {
	enumerable: true,
	get: function() {
		return listTtsPersonas;
	}
});
Object.defineProperty(exports, "maybeApplyTtsToPayload", {
	enumerable: true,
	get: function() {
		return maybeApplyTtsToPayload;
	}
});
Object.defineProperty(exports, "resolveExplicitTtsOverrides", {
	enumerable: true,
	get: function() {
		return resolveExplicitTtsOverrides;
	}
});
Object.defineProperty(exports, "resolveTtsAutoMode", {
	enumerable: true,
	get: function() {
		return resolveTtsAutoMode;
	}
});
Object.defineProperty(exports, "resolveTtsConfig", {
	enumerable: true,
	get: function() {
		return resolveTtsConfig;
	}
});
Object.defineProperty(exports, "resolveTtsPrefsPath", {
	enumerable: true,
	get: function() {
		return resolveTtsPrefsPath;
	}
});
Object.defineProperty(exports, "resolveTtsProviderOrder", {
	enumerable: true,
	get: function() {
		return resolveTtsProviderOrder;
	}
});
Object.defineProperty(exports, "setLastTtsAttempt", {
	enumerable: true,
	get: function() {
		return setLastTtsAttempt;
	}
});
Object.defineProperty(exports, "setSummarizationEnabled", {
	enumerable: true,
	get: function() {
		return setSummarizationEnabled;
	}
});
Object.defineProperty(exports, "setTtsEnabled", {
	enumerable: true,
	get: function() {
		return setTtsEnabled;
	}
});
Object.defineProperty(exports, "setTtsMaxLength", {
	enumerable: true,
	get: function() {
		return setTtsMaxLength;
	}
});
Object.defineProperty(exports, "setTtsPersona", {
	enumerable: true,
	get: function() {
		return setTtsPersona;
	}
});
Object.defineProperty(exports, "setTtsProvider", {
	enumerable: true,
	get: function() {
		return setTtsProvider;
	}
});
Object.defineProperty(exports, "synthesizeSpeech", {
	enumerable: true,
	get: function() {
		return synthesizeSpeech;
	}
});
Object.defineProperty(exports, "textToSpeech", {
	enumerable: true,
	get: function() {
		return textToSpeech;
	}
});
Object.defineProperty(exports, "withSpeakerSelectionCompat", {
	enumerable: true,
	get: function() {
		return withSpeakerSelectionCompat;
	}
});
Object.defineProperty(exports, "withSpeakerSelectionFallbackCompat", {
	enumerable: true,
	get: function() {
		return withSpeakerSelectionFallbackCompat;
	}
});
