const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_deep_merge = require("./deep-merge-DKT_G9Uv.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/tts/tts-auto-mode.ts
/** Accepted TTS auto modes from config, prefs, and session-level overrides. */
const TTS_AUTO_MODES = /* @__PURE__ */ new Set([
	"off",
	"always",
	"inbound",
	"tagged"
]);
/** Normalize an unknown value into a supported TTS auto mode. */
function normalizeTtsAutoMode(value) {
	if (typeof value !== "string") return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (TTS_AUTO_MODES.has(normalized)) return normalized;
}
//#endregion
//#region src/tts/tts-config.ts
function resolveAgentTtsOverride(cfg, agentId) {
	if (!agentId || !Array.isArray(cfg.agents?.list)) return;
	const normalized = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId);
	return cfg.agents.list.find((entry) => (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id) === normalized)?.tts;
}
function resolveTtsConfigContext(contextOrAgentId) {
	return typeof contextOrAgentId === "string" ? { agentId: contextOrAgentId } : contextOrAgentId ?? {};
}
function resolveRecordEntry(entries, id, normalize) {
	const normalizedId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id);
	if (!entries || !normalizedId) return;
	if (Object.hasOwn(entries, normalizedId)) return entries[normalizedId];
	const normalized = normalize(normalizedId);
	const key = Object.keys(entries).find((candidate) => normalize(candidate) === normalized);
	return key ? entries[key] : void 0;
}
function asTtsConfig(value) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) ? value : void 0;
}
function asObjectRecord(value) {
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) ? value : void 0;
}
function resolveChannelConfig(cfg, channelId) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(cfg.channels)) return;
	const normalizedChannelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(channelId);
	if (!normalizedChannelId) return;
	return asObjectRecord(resolveRecordEntry(cfg.channels, normalizedChannelId, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty));
}
function resolveChannelTtsOverride(cfg, context) {
	return asTtsConfig(resolveChannelConfig(cfg, context.channelId)?.tts);
}
function resolveAccountTtsOverride(cfg, context) {
	const channelConfig = resolveChannelConfig(cfg, context.channelId);
	return asTtsConfig(asObjectRecord(resolveRecordEntry((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channelConfig?.accounts) ? channelConfig.accounts : void 0, context.accountId, require_account_id.normalizeAccountId))?.tts);
}
/** Resolve effective TTS config after applying global, agent, channel, and account layers. */
function resolveEffectiveTtsConfig(cfg, contextOrAgentId) {
	const context = resolveTtsConfigContext(contextOrAgentId);
	const base = cfg.messages?.tts ?? {};
	const agentOverride = resolveAgentTtsOverride(cfg, context.agentId);
	const channelOverride = resolveChannelTtsOverride(cfg, context);
	const accountOverride = resolveAccountTtsOverride(cfg, context);
	let merged = base;
	for (const override of [
		agentOverride,
		channelOverride,
		accountOverride
	]) merged = require_deep_merge.mergeDeep(merged, override ?? {});
	return merged;
}
/** Resolve the configured TTS mode, defaulting to final-answer synthesis. */
function resolveConfiguredTtsMode(cfg, contextOrAgentId) {
	return resolveEffectiveTtsConfig(cfg, contextOrAgentId).mode ?? "final";
}
function resolveTtsPrefsPathValue(prefsPath) {
	if (prefsPath?.trim()) return require_home_dir.resolveUserPath(prefsPath.trim());
	const envPath = process.env.OPERATOR_TTS_PREFS?.trim();
	if (envPath) return require_home_dir.resolveUserPath(envPath);
	return node_path.default.join(require_utils.resolveConfigDir(process.env), "settings", "tts.json");
}
function readTtsPrefsAutoMode(prefsPath) {
	try {
		if (!(0, node_fs.existsSync)(prefsPath)) return;
		const prefs = JSON.parse((0, node_fs.readFileSync)(prefsPath, "utf8"));
		const auto = normalizeTtsAutoMode(prefs.tts?.auto);
		if (auto) return auto;
		if (typeof prefs.tts?.enabled === "boolean") return prefs.tts.enabled ? "always" : "off";
	} catch {
		return;
	}
}
/** Return whether this payload should attempt TTS based on session, prefs, and config. */
function shouldAttemptTtsPayload(params) {
	const sessionAuto = normalizeTtsAutoMode(params.ttsAuto);
	if (sessionAuto) return sessionAuto !== "off";
	const raw = resolveEffectiveTtsConfig(params.cfg, params);
	const prefsAuto = readTtsPrefsAutoMode(resolveTtsPrefsPathValue(raw?.prefsPath));
	if (prefsAuto) return prefsAuto !== "off";
	const configuredAuto = normalizeTtsAutoMode(raw?.auto);
	if (configuredAuto) return configuredAuto !== "off";
	return raw?.enabled === true;
}
/** Return whether TTS directive markup should be stripped from user-visible text. */
function shouldCleanTtsDirectiveText(params) {
	if (!shouldAttemptTtsPayload(params)) return false;
	return resolveEffectiveTtsConfig(params.cfg, params).modelOverrides?.enabled !== false;
}
//#endregion
//#region src/plugins/gateway-startup-speech-providers.ts
const TTS_PROVIDER_CONFIG_RESERVED_KEYS = /* @__PURE__ */ new Set([
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
/** Treats missing activation as enabled while honoring explicit false values. */
function isConfigActivationValueEnabled(value) {
	if (value === false) return false;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) && value.enabled === false) return false;
	return true;
}
/** Normalizes configured TTS provider ids for startup plugin selection. */
function normalizeConfiguredSpeechProviderIdForStartup(value) {
	if (typeof value !== "string") return;
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (!normalized) return;
	return normalized === "edge" ? "microsoft" : normalized;
}
/** Resolves provider activation from both canonical providers maps and legacy root keys. */
function resolveProviderConfigActivation(ttsConfig, providerId) {
	let fromProviders;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(ttsConfig.providers)) {
		for (const [key, providerConfig] of Object.entries(ttsConfig.providers)) if (normalizeConfiguredSpeechProviderIdForStartup(key) === providerId) fromProviders = isConfigActivationValueEnabled(providerConfig);
	}
	if (fromProviders !== void 0) return fromProviders;
	for (const [key, providerConfig] of Object.entries(ttsConfig)) {
		if (TTS_PROVIDER_CONFIG_RESERVED_KEYS.has(key) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providerConfig)) continue;
		if (normalizeConfiguredSpeechProviderIdForStartup(key) === providerId) return isConfigActivationValueEnabled(providerConfig);
	}
}
function addProviderIfEnabled(target, ttsConfig, providerId) {
	const normalized = normalizeConfiguredSpeechProviderIdForStartup(providerId);
	if (!normalized) return;
	if (resolveProviderConfigActivation(ttsConfig, normalized) !== false) target.add(normalized);
}
function findActivePersona(ttsConfig) {
	const personaId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(typeof ttsConfig.persona === "string" ? ttsConfig.persona : void 0);
	if (!personaId || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(ttsConfig.personas)) return;
	for (const [id, persona] of Object.entries(ttsConfig.personas)) if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(id) === personaId && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(persona)) return persona;
}
function addActivePersonaProvider(target, ttsConfig) {
	const persona = findActivePersona(ttsConfig);
	if (!persona) return;
	const provider = normalizeConfiguredSpeechProviderIdForStartup(persona.provider);
	if (!provider) return;
	const rootActivation = resolveProviderConfigActivation(ttsConfig, provider);
	if ((resolveProviderConfigActivation(persona, provider) ?? rootActivation) !== false) target.add(provider);
}
function addConfiguredTtsProviderIds(target, value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	addProviderIfEnabled(target, value, value.provider);
	addActivePersonaProvider(target, value);
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.providers)) {
		for (const [providerId, providerConfig] of Object.entries(value.providers)) if (isConfigActivationValueEnabled(providerConfig)) addProviderIfEnabled(target, value, providerId);
	}
	for (const [key, providerConfig] of Object.entries(value)) {
		if (TTS_PROVIDER_CONFIG_RESERVED_KEYS.has(key) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(providerConfig)) continue;
		if (isConfigActivationValueEnabled(providerConfig)) addProviderIfEnabled(target, value, key);
	}
}
/** Collects TTS provider ids referenced by root, agent, channel, account, and plugin config. */
function collectConfiguredSpeechProviderIds(config) {
	const configured = /* @__PURE__ */ new Set();
	addConfiguredTtsProviderIds(configured, resolveEffectiveTtsConfig(config));
	const agents = config.agents;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agents) && Array.isArray(agents.list)) {
		for (const agent of agents.list) if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(agent)) if (typeof agent.id === "string") addConfiguredTtsProviderIds(configured, resolveEffectiveTtsConfig(config, { agentId: agent.id }));
		else addConfiguredTtsProviderIds(configured, agent.tts);
	}
	const channels = config.channels;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channels)) for (const [channelId, channelConfig] of Object.entries(channels)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channelConfig)) continue;
		addConfiguredTtsProviderIds(configured, resolveEffectiveTtsConfig(config, { channelId }));
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channelConfig.voice)) addConfiguredTtsProviderIds(configured, channelConfig.voice.tts);
		if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channelConfig.accounts)) for (const [accountId, accountConfig] of Object.entries(channelConfig.accounts)) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(accountConfig)) continue;
			addConfiguredTtsProviderIds(configured, resolveEffectiveTtsConfig(config, {
				channelId,
				accountId
			}));
			if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(accountConfig.voice)) addConfiguredTtsProviderIds(configured, accountConfig.voice.tts);
		}
	}
	const pluginEntries = config.plugins?.entries;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(pluginEntries)) {
		for (const entry of Object.values(pluginEntries)) if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(entry.config)) addConfiguredTtsProviderIds(configured, entry.config.tts);
	}
	return configured;
}
//#endregion
Object.defineProperty(exports, "collectConfiguredSpeechProviderIds", {
	enumerable: true,
	get: function() {
		return collectConfiguredSpeechProviderIds;
	}
});
Object.defineProperty(exports, "normalizeConfiguredSpeechProviderIdForStartup", {
	enumerable: true,
	get: function() {
		return normalizeConfiguredSpeechProviderIdForStartup;
	}
});
Object.defineProperty(exports, "normalizeTtsAutoMode", {
	enumerable: true,
	get: function() {
		return normalizeTtsAutoMode;
	}
});
Object.defineProperty(exports, "resolveConfiguredTtsMode", {
	enumerable: true,
	get: function() {
		return resolveConfiguredTtsMode;
	}
});
Object.defineProperty(exports, "resolveEffectiveTtsConfig", {
	enumerable: true,
	get: function() {
		return resolveEffectiveTtsConfig;
	}
});
Object.defineProperty(exports, "shouldAttemptTtsPayload", {
	enumerable: true,
	get: function() {
		return shouldAttemptTtsPayload;
	}
});
Object.defineProperty(exports, "shouldCleanTtsDirectiveText", {
	enumerable: true,
	get: function() {
		return shouldCleanTtsDirectiveText;
	}
});
