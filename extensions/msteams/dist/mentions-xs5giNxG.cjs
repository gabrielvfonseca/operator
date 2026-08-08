const require_regexp = require("./regexp-C8Y0xoXY.cjs");
require("./utils-CXqBhRFw.cjs");
require("./registry-BWWaGAnQ.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry_loaded = require("./registry-loaded-BQ6D0fDi.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/mention-pattern-policy.ts
/**
* Mention-pattern policy resolver.
*
* Applies provider and conversation allow/deny rules to mention pattern matching.
*/
function normalizeIdList(values) {
	const normalized = /* @__PURE__ */ new Set();
	for (const value of values ?? []) {
		const next = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
		if (next) normalized.add(next);
	}
	return normalized;
}
function isMentionPatternsPolicyConfig(value) {
	return value != null && typeof value === "object" && !Array.isArray(value);
}
function resolveProviderMentionPatternsPolicy(cfg, provider) {
	if (!cfg || !provider) return;
	const channelConfig = cfg.channels?.[provider];
	const policy = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(channelConfig) ? channelConfig.mentionPatterns : void 0;
	return isMentionPatternsPolicyConfig(policy) ? policy : void 0;
}
/**
* Resolves provider-scoped mention-pattern policy for a single conversation.
*/
function resolveMentionPatternPolicy(params) {
	const conversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.conversationId ?? void 0) ?? void 0;
	const providerPolicy = params.providerPolicy ?? resolveProviderMentionPatternsPolicy(params.cfg, params.provider);
	const effectiveMode = providerPolicy?.mode === "allow" || providerPolicy?.mode === "deny" ? providerPolicy.mode : "allow";
	const allowMatched = conversationId != null && normalizeIdList(providerPolicy?.allowIn).has(conversationId);
	const denyMatched = conversationId != null && normalizeIdList(providerPolicy?.denyIn).has(conversationId);
	return {
		effectiveMode,
		allowMatched,
		denyMatched,
		enabled: effectiveMode === "allow" ? !denyMatched : allowMatched && !denyMatched
	};
}
//#endregion
//#region src/auto-reply/reply/mentions.ts
/** Mention matching, stripping, and explicit mention handling for group triggers. */
function deriveMentionPatterns(identity) {
	const patterns = [];
	const name = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity?.name);
	if (name) {
		const parts = name.split(/\s+/).filter(Boolean).map(require_regexp.escapeRegExp);
		const re = parts.length ? parts.join(String.raw`\s+`) : require_regexp.escapeRegExp(name);
		patterns.push(String.raw`\b@?${re}\b`);
	}
	const emoji = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(identity?.emoji);
	if (emoji) patterns.push(require_regexp.escapeRegExp(emoji));
	return patterns;
}
const BACKSPACE_CHAR = "\b";
const mentionMatchRegexCompileCache = /* @__PURE__ */ new Map();
const mentionStripRegexCompileCache = /* @__PURE__ */ new Map();
const MAX_MENTION_REGEX_COMPILE_CACHE_KEYS = 512;
const mentionPatternWarningCache = /* @__PURE__ */ new Set();
const MAX_MENTION_PATTERN_WARNING_KEYS = 512;
const log = require_subsystem.createSubsystemLogger("mentions");
const CURRENT_MESSAGE_MARKER = "[Current message - respond to this]";
function normalizeMentionPattern(pattern) {
	if (!pattern.includes(BACKSPACE_CHAR)) return pattern;
	return pattern.split(BACKSPACE_CHAR).join("\\b");
}
function normalizeMentionPatterns(patterns) {
	return patterns.map(normalizeMentionPattern);
}
function warnRejectedMentionPattern(pattern, flags, reason) {
	const key = `${flags}::${reason}::${pattern}`;
	if (mentionPatternWarningCache.has(key)) return;
	mentionPatternWarningCache.add(key);
	if (mentionPatternWarningCache.size > MAX_MENTION_PATTERN_WARNING_KEYS) {
		mentionPatternWarningCache.clear();
		mentionPatternWarningCache.add(key);
	}
	log.warn("Ignoring unsupported group mention pattern", {
		pattern,
		flags,
		reason
	});
}
function cacheMentionRegexes(cache, cacheKey, regexes) {
	cache.set(cacheKey, regexes);
	if (cache.size > MAX_MENTION_REGEX_COMPILE_CACHE_KEYS) {
		cache.clear();
		cache.set(cacheKey, regexes);
	}
	return [...regexes];
}
function compileMentionPatternsCached(params) {
	if (params.patterns.length === 0) return [];
	const cacheKey = `${params.flags}\u001e${params.patterns.join("")}`;
	const cached = params.cache.get(cacheKey);
	if (cached) return [...cached];
	const compiled = require_redact.compileConfigRegexes(params.patterns, params.flags);
	if (params.warnRejected) for (const rejected of compiled.rejected) warnRejectedMentionPattern(rejected.pattern, rejected.flags, rejected.reason);
	return cacheMentionRegexes(params.cache, cacheKey, compiled.regexes);
}
function resolveMentionPatterns(cfg, agentId) {
	if (!cfg) return [];
	const agentConfig = agentId ? require_agent_scope_config.resolveAgentConfig(cfg, agentId) : void 0;
	const agentGroupChat = agentConfig?.groupChat;
	if (agentGroupChat && Object.hasOwn(agentGroupChat, "mentionPatterns")) return agentGroupChat.mentionPatterns ?? [];
	const globalGroupChat = cfg.messages?.groupChat;
	if (globalGroupChat && Object.hasOwn(globalGroupChat, "mentionPatterns")) return globalGroupChat.mentionPatterns ?? [];
	const derived = deriveMentionPatterns(agentConfig?.identity);
	return derived.length > 0 ? derived : [];
}
/** Builds mention regexes from config, agent identity, and channel policy. */
function buildMentionRegexes(cfg, agentId, options) {
	if (!resolveMentionPatternPolicy({
		...options,
		cfg,
		agentId
	}).enabled) return [];
	return compileMentionPatternsCached({
		patterns: normalizeMentionPatterns(resolveMentionPatterns(cfg, agentId)),
		flags: "i",
		cache: mentionMatchRegexCompileCache,
		warnRejected: true
	});
}
/** Normalizes text before mention matching. */
function normalizeMentionText(text) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((text ?? "").replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, ""));
}
/** Returns true when text matches one of the configured mention patterns. */
function matchesMentionPatterns(text, mentionRegexes) {
	if (mentionRegexes.length === 0) return false;
	const cleaned = normalizeMentionText(text ?? "");
	return mentionRegexes.some((re) => re.test(cleaned));
}
/** Combines regex mention matching with provider-native explicit mention metadata. */
function matchesMentionWithExplicit(params) {
	const cleaned = normalizeMentionText(params.text ?? "");
	const explicit = params.explicit?.isExplicitlyMentioned === true;
	const transcriptCleaned = params.transcript ? normalizeMentionText(params.transcript) : "";
	const textToCheck = cleaned || transcriptCleaned;
	return explicit || params.mentionRegexes.some((re) => re.test(textToCheck));
}
/** Removes structural prompt prefixes before mention stripping. */
function stripStructuralPrefixes(text) {
	if (!text) return "";
	const afterMarker = text.includes("[Current message - respond to this]") ? text.slice(text.indexOf(CURRENT_MESSAGE_MARKER) + 35).trimStart() : text;
	const afterEnvelope = afterMarker.replace(/\[[^\]]+\]\s*/g, "");
	const senderPrefixPattern = afterEnvelope === afterMarker ? /^[ \t]*(?!\/)[^\n:]{1,120}:\s+/gm : /^[ \t]*[^\n:]{1,120}:\s+/gm;
	const stripped = afterEnvelope.replace(senderPrefixPattern, "").replace(/\\n/g, " ").trim();
	if (stripped.startsWith("/")) return stripped.replace(/[ \t]+/g, " ");
	return stripped.replace(/\s+/g, " ");
}
/** Removes bot mentions from command text before command normalization. */
function stripMentions(text, ctx, cfg, agentId) {
	let result = text;
	const providerId = (ctx.Provider ? require_registry_normalize.normalizeAnyChannelId(ctx.Provider) : null) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(ctx.Provider) ?? null;
	const providerMentions = providerId ? require_registry_loaded.getLoadedChannelPluginById(providerId)?.mentions : void 0;
	const configRegexes = compileMentionPatternsCached({
		patterns: normalizeMentionPatterns(resolveMentionPatterns(cfg, agentId)),
		flags: "gi",
		cache: mentionStripRegexCompileCache,
		warnRejected: true
	});
	const providerRegexes = providerMentions?.stripRegexes?.({
		ctx,
		cfg,
		agentId
	}) ?? compileMentionPatternsCached({
		patterns: normalizeMentionPatterns(providerMentions?.stripPatterns?.({
			ctx,
			cfg,
			agentId
		}) ?? []),
		flags: "gi",
		cache: mentionStripRegexCompileCache,
		warnRejected: false
	});
	for (const re of [...configRegexes, ...providerRegexes]) result = result.replace(re, " ");
	if (providerMentions?.stripMentions) result = providerMentions.stripMentions({
		text: result,
		ctx,
		cfg,
		agentId
	});
	result = result.replace(/@[0-9+]{5,}/g, " ");
	return result.replace(/\s+/g, " ").trim();
}
//#endregion
Object.defineProperty(exports, "CURRENT_MESSAGE_MARKER", {
	enumerable: true,
	get: function() {
		return CURRENT_MESSAGE_MARKER;
	}
});
Object.defineProperty(exports, "buildMentionRegexes", {
	enumerable: true,
	get: function() {
		return buildMentionRegexes;
	}
});
Object.defineProperty(exports, "matchesMentionPatterns", {
	enumerable: true,
	get: function() {
		return matchesMentionPatterns;
	}
});
Object.defineProperty(exports, "matchesMentionWithExplicit", {
	enumerable: true,
	get: function() {
		return matchesMentionWithExplicit;
	}
});
Object.defineProperty(exports, "stripMentions", {
	enumerable: true,
	get: function() {
		return stripMentions;
	}
});
Object.defineProperty(exports, "stripStructuralPrefixes", {
	enumerable: true,
	get: function() {
		return stripStructuralPrefixes;
	}
});
