const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_retry = require("./retry-DXZi6qkk.cjs");
const require_chat_message_content = require("./chat-message-content-B4NfuhB-.cjs");
const require_embedded_agent_utils = require("./embedded-agent-utils-OVBmZgZz.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
//#region src/agents/embedded-agent-runner/usage-accumulator.ts
const createUsageAccumulator = () => ({
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0,
	reasoningTokens: 0,
	total: 0,
	lastInput: 0,
	lastOutput: 0,
	lastCacheRead: 0,
	lastCacheWrite: 0,
	lastReasoningTokens: 0,
	lastTotal: 0
});
const hasUsageValues = (usage) => {
	if (!usage) return false;
	return [
		usage.input,
		usage.output,
		usage.cacheRead,
		usage.cacheWrite,
		usage.contextUsage?.state === "available" ? usage.contextUsage.promptTokens : void 0,
		usage.contextUsage?.state === "available" ? usage.contextUsage.totalTokens : void 0,
		usage.reasoningTokens,
		usage.total
	].some((value) => typeof value === "number" && Number.isFinite(value) && value > 0) || usage.contextUsage?.state === "unavailable";
};
const mergeUsageIntoAccumulator = (target, usage) => {
	if (!hasUsageValues(usage)) return;
	const callTotal = usage.total ?? (usage.input ?? 0) + (usage.output ?? 0) + (usage.cacheRead ?? 0) + (usage.cacheWrite ?? 0);
	target.input += usage.input ?? 0;
	target.output += usage.output ?? 0;
	target.cacheRead += usage.cacheRead ?? 0;
	target.cacheWrite += usage.cacheWrite ?? 0;
	target.reasoningTokens += usage.reasoningTokens ?? 0;
	target.total += callTotal;
	target.lastInput = usage.input ?? 0;
	target.lastOutput = usage.output ?? 0;
	target.lastCacheRead = usage.cacheRead ?? 0;
	target.lastCacheWrite = usage.cacheWrite ?? 0;
	target.lastContextUsage = usage.contextUsage ? { ...usage.contextUsage } : void 0;
	target.lastReasoningTokens = usage.reasoningTokens ?? 0;
	target.lastTotal = callTotal;
};
const toNormalizedUsage = (usage) => {
	if (!(usage.input > 0 || usage.output > 0 || usage.cacheRead > 0 || usage.cacheWrite > 0 || usage.reasoningTokens > 0 || usage.total > 0)) return;
	return {
		input: usage.input || void 0,
		output: usage.output || void 0,
		cacheRead: usage.cacheRead || void 0,
		cacheWrite: usage.cacheWrite || void 0,
		...usage.reasoningTokens > 0 ? { reasoningTokens: usage.reasoningTokens } : {},
		total: usage.total || void 0
	};
};
const toLastCallUsage = (usage) => {
	if (!(usage.lastInput > 0 || usage.lastOutput > 0 || usage.lastCacheRead > 0 || usage.lastCacheWrite > 0 || usage.lastContextUsage !== void 0 || usage.lastReasoningTokens > 0 || usage.lastTotal > 0)) return;
	return {
		input: usage.lastInput || void 0,
		output: usage.lastOutput || void 0,
		cacheRead: usage.lastCacheRead || void 0,
		cacheWrite: usage.lastCacheWrite || void 0,
		...usage.lastContextUsage ? { contextUsage: { ...usage.lastContextUsage } } : {},
		...usage.lastReasoningTokens > 0 ? { reasoningTokens: usage.lastReasoningTokens } : {},
		total: usage.lastTotal || void 0
	};
};
//#endregion
//#region src/agents/embedded-agent-runner/run/helpers.ts
const RUNTIME_AUTH_REFRESH_MARGIN_MS = 300 * 1e3;
const RUNTIME_AUTH_REFRESH_RETRY_MS = 60 * 1e3;
const RUNTIME_AUTH_REFRESH_MIN_DELAY_MS = 5 * 1e3;
const DEFAULT_OVERLOAD_FAILOVER_BACKOFF_MS = 0;
const DEFAULT_MAX_OVERLOAD_PROFILE_ROTATIONS = 1;
const DEFAULT_MAX_RATE_LIMIT_PROFILE_ROTATIONS = 1;
const SAME_MODEL_RATE_LIMIT_BACKOFF_STEP_MS = 1e4;
const SAME_MODEL_RATE_LIMIT_MAX_BACKOFF_MS = 6e4;
function resolveOverloadFailoverBackoffMs(cfg) {
	return cfg?.auth?.cooldowns?.overloadedBackoffMs ?? DEFAULT_OVERLOAD_FAILOVER_BACKOFF_MS;
}
function resolveOverloadProfileRotationLimit(cfg) {
	return cfg?.auth?.cooldowns?.overloadedProfileRotations ?? DEFAULT_MAX_OVERLOAD_PROFILE_ROTATIONS;
}
function resolveRateLimitProfileRotationLimit(cfg) {
	return cfg?.auth?.cooldowns?.rateLimitedProfileRotations ?? DEFAULT_MAX_RATE_LIMIT_PROFILE_ROTATIONS;
}
/**
* Backoff before the next same-model rate_limit retry, given how many such
* retries already happened. Linear and deterministic (no jitter) so RPM
* windows clear predictably and tests can assert exact values.
*/
function resolveSameModelRateLimitRetryDelayMs(params) {
	const backoffDelayMs = SAME_MODEL_RATE_LIMIT_BACKOFF_STEP_MS * (Math.max(0, params.retriesSoFar) + 1);
	const backoffMs = Math.min(SAME_MODEL_RATE_LIMIT_MAX_BACKOFF_MS, backoffDelayMs);
	const retryAfterMs = Number.isFinite(params.retryAfterSeconds) ? Math.ceil(Math.max(0, params.retryAfterSeconds ?? 0) * 1e3) : 0;
	return Math.max(backoffMs, Math.min(SAME_MODEL_RATE_LIMIT_MAX_BACKOFF_MS, retryAfterMs));
}
function resolveNextSameModelRateLimitRetryCount(params) {
	return params.retriedSameModelRateLimit ? Math.max(0, params.retriesSoFar) + 1 : 0;
}
const ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL = "ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL";
const ANTHROPIC_MAGIC_STRING_REPLACEMENT = "ANTHROPIC MAGIC STRING TRIGGER REFUSAL (redacted)";
function scrubAnthropicRefusalMagic(prompt) {
	if (!prompt.includes(ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL)) return prompt;
	return prompt.replaceAll(ANTHROPIC_MAGIC_STRING_TRIGGER_REFUSAL, ANTHROPIC_MAGIC_STRING_REPLACEMENT);
}
/** Applies only outer-transport prompt rewrites; native model owners receive the prompt verbatim. */
function resolveEmbeddedAttemptBasePrompt(params) {
	if (params.nativeModelOwned || params.provider !== "anthropic") return params.prompt;
	return scrubAnthropicRefusalMagic(params.prompt);
}
function createCompactionDiagId() {
	return `ovf-${Date.now().toString(36)}-${require_retry.generateSecureToken(4)}`;
}
const BASE_RUN_RETRY_ITERATIONS = 24;
const RUN_RETRY_ITERATIONS_PER_PROFILE = 8;
const MIN_RUN_RETRY_ITERATIONS = 32;
const MAX_RUN_RETRY_ITERATIONS = 160;
function resolveMaxRunRetryIterations(profileCandidateCount, cfg, agentId) {
	const configRetries = (cfg && agentId ? require_agent_scope_config.resolveAgentConfig(cfg, agentId)?.runRetries : void 0) ?? cfg?.agents?.defaults?.runRetries;
	const base = Math.max(1, configRetries?.base ?? BASE_RUN_RETRY_ITERATIONS);
	const perProfile = Math.max(0, configRetries?.perProfile ?? RUN_RETRY_ITERATIONS_PER_PROFILE);
	const minLimit = Math.max(1, configRetries?.min ?? MIN_RUN_RETRY_ITERATIONS);
	const maxLimit = Math.max(minLimit, configRetries?.max ?? MAX_RUN_RETRY_ITERATIONS);
	const scaled = base + Math.max(1, profileCandidateCount) * perProfile;
	return Math.min(maxLimit, Math.max(minLimit, scaled));
}
function resolveActiveErrorContext(params) {
	return resolveReportedModelRef(params);
}
function isAssistantForModelRef(assistant, ref) {
	if (!assistant) return false;
	const resolved = resolveReportedModelRef({
		...ref,
		assistant
	});
	return resolved.provider === ref.provider && resolved.model === ref.model;
}
function isEmbeddedHarnessProvider(provider) {
	return provider.trim().toLowerCase() === "@gabrielvfonseca/operator";
}
function resolveReportedModelRef(params) {
	const assistantProvider = params.assistant?.provider?.trim();
	const assistantModel = params.assistant?.model?.trim();
	if (!assistantProvider) return {
		provider: params.provider,
		model: assistantModel || params.model
	};
	if (isEmbeddedHarnessProvider(assistantProvider)) return {
		provider: params.provider,
		model: params.model
	};
	return {
		provider: assistantProvider,
		model: assistantModel || params.model
	};
}
function resolveLatestCallUsage(params) {
	const currentAttempt = params.currentAttemptCandidates.find(require_session_accessor.hasNonzeroUsage);
	return {
		currentAttempt,
		latest: currentAttempt ?? params.carriedCandidates.find(require_session_accessor.hasNonzeroUsage)
	};
}
function buildUsageAgentMetaFields(params) {
	const usage = toNormalizedUsage(params.usageAccumulator);
	if (usage && params.lastTurnTotal && params.lastTurnTotal > 0) usage.total = params.lastTurnTotal;
	const lastAssistantUsage = require_session_accessor.normalizeUsage(params.lastAssistantUsage);
	return {
		usage,
		lastCallUsage: require_session_accessor.hasNonzeroUsage(lastAssistantUsage) ? lastAssistantUsage : require_session_accessor.hasNonzeroUsage(params.lastRunPromptUsage) ? params.lastRunPromptUsage : toLastCallUsage(params.usageAccumulator),
		promptTokens: require_session_accessor.deriveContextPromptTokens({ lastCallUsage: params.lastRunPromptUsage })
	};
}
/**
* Build agentMeta for error return paths, preserving accumulated usage so that
* session totalTokens reflects the actual context size rather than going stale.
* Without this, error returns omit usage and the session keeps whatever
* totalTokens was set by the previous successful run.
*/
function buildErrorAgentMeta(params) {
	const usageMeta = buildUsageAgentMetaFields({
		usageAccumulator: params.usageAccumulator,
		lastAssistantUsage: params.lastAssistant?.usage,
		lastRunPromptUsage: params.lastRunPromptUsage,
		lastTurnTotal: params.lastTurnTotal
	});
	return {
		sessionId: params.sessionId,
		...params.sessionFile ? { sessionFile: params.sessionFile } : {},
		provider: params.provider,
		model: params.model,
		...params.contextTokens ? { contextTokens: params.contextTokens } : {},
		...usageMeta.usage ? { usage: usageMeta.usage } : {},
		...usageMeta.lastCallUsage ? { lastCallUsage: usageMeta.lastCallUsage } : {},
		...usageMeta.promptTokens ? { promptTokens: usageMeta.promptTokens } : {}
	};
}
function resolveFinalAssistantVisibleText(lastAssistant) {
	if (!lastAssistant) return;
	return require_embedded_agent_utils.extractAssistantVisibleText(lastAssistant).trim() || void 0;
}
function resolveFinalAssistantRawText(lastAssistant) {
	if (!lastAssistant) return;
	return (require_chat_message_content.extractAssistantTextForPhase(lastAssistant, { phase: "final_answer" }) ?? require_chat_message_content.extractAssistantTextForPhase(lastAssistant) ?? "").trim() || void 0;
}
//#endregion
Object.defineProperty(exports, "RUNTIME_AUTH_REFRESH_MARGIN_MS", {
	enumerable: true,
	get: function() {
		return RUNTIME_AUTH_REFRESH_MARGIN_MS;
	}
});
Object.defineProperty(exports, "RUNTIME_AUTH_REFRESH_MIN_DELAY_MS", {
	enumerable: true,
	get: function() {
		return RUNTIME_AUTH_REFRESH_MIN_DELAY_MS;
	}
});
Object.defineProperty(exports, "RUNTIME_AUTH_REFRESH_RETRY_MS", {
	enumerable: true,
	get: function() {
		return RUNTIME_AUTH_REFRESH_RETRY_MS;
	}
});
Object.defineProperty(exports, "buildErrorAgentMeta", {
	enumerable: true,
	get: function() {
		return buildErrorAgentMeta;
	}
});
Object.defineProperty(exports, "buildUsageAgentMetaFields", {
	enumerable: true,
	get: function() {
		return buildUsageAgentMetaFields;
	}
});
Object.defineProperty(exports, "createCompactionDiagId", {
	enumerable: true,
	get: function() {
		return createCompactionDiagId;
	}
});
Object.defineProperty(exports, "createUsageAccumulator", {
	enumerable: true,
	get: function() {
		return createUsageAccumulator;
	}
});
Object.defineProperty(exports, "isAssistantForModelRef", {
	enumerable: true,
	get: function() {
		return isAssistantForModelRef;
	}
});
Object.defineProperty(exports, "mergeUsageIntoAccumulator", {
	enumerable: true,
	get: function() {
		return mergeUsageIntoAccumulator;
	}
});
Object.defineProperty(exports, "resolveActiveErrorContext", {
	enumerable: true,
	get: function() {
		return resolveActiveErrorContext;
	}
});
Object.defineProperty(exports, "resolveEmbeddedAttemptBasePrompt", {
	enumerable: true,
	get: function() {
		return resolveEmbeddedAttemptBasePrompt;
	}
});
Object.defineProperty(exports, "resolveFinalAssistantRawText", {
	enumerable: true,
	get: function() {
		return resolveFinalAssistantRawText;
	}
});
Object.defineProperty(exports, "resolveFinalAssistantVisibleText", {
	enumerable: true,
	get: function() {
		return resolveFinalAssistantVisibleText;
	}
});
Object.defineProperty(exports, "resolveLatestCallUsage", {
	enumerable: true,
	get: function() {
		return resolveLatestCallUsage;
	}
});
Object.defineProperty(exports, "resolveMaxRunRetryIterations", {
	enumerable: true,
	get: function() {
		return resolveMaxRunRetryIterations;
	}
});
Object.defineProperty(exports, "resolveNextSameModelRateLimitRetryCount", {
	enumerable: true,
	get: function() {
		return resolveNextSameModelRateLimitRetryCount;
	}
});
Object.defineProperty(exports, "resolveOverloadFailoverBackoffMs", {
	enumerable: true,
	get: function() {
		return resolveOverloadFailoverBackoffMs;
	}
});
Object.defineProperty(exports, "resolveOverloadProfileRotationLimit", {
	enumerable: true,
	get: function() {
		return resolveOverloadProfileRotationLimit;
	}
});
Object.defineProperty(exports, "resolveRateLimitProfileRotationLimit", {
	enumerable: true,
	get: function() {
		return resolveRateLimitProfileRotationLimit;
	}
});
Object.defineProperty(exports, "resolveReportedModelRef", {
	enumerable: true,
	get: function() {
		return resolveReportedModelRef;
	}
});
Object.defineProperty(exports, "resolveSameModelRateLimitRetryDelayMs", {
	enumerable: true,
	get: function() {
		return resolveSameModelRateLimitRetryDelayMs;
	}
});
