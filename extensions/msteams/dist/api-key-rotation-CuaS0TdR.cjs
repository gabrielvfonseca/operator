const require_errors = require("./errors-BqS4bzom.cjs");
const require_src = require("./src-BcOJL8NE.cjs");
const require_model_selection_normalize = require("./model-selection-normalize-BrB-lt0o.cjs");
const require_provider_env_vars = require("./provider-env-vars-D_wXMNA1.cjs");
require("./model-selection-BvFurMxy.cjs");
require("./backoff-Dw8FZM0b.cjs");
const require_operation_retry = require("./operation-retry-DQKBakBo.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/live-auth-keys.ts
/**
* Live-test provider API-key discovery.
* Reads provider-specific and manifest-declared env names without logging or
* exposing secret values, with explicit single-key pins for flaky live lanes.
*/
const KEY_SPLIT_RE = /[\s,;]+/g;
const GOOGLE_LIVE_SINGLE_KEY = "OPERATOR_LIVE_GEMINI_KEY";
const PROVIDER_PREFIX_OVERRIDES = {
	google: "GEMINI",
	"google-vertex": "GEMINI"
};
const PROVIDER_API_KEY_CONFIG = {
	anthropic: {
		liveSingle: "OPERATOR_LIVE_ANTHROPIC_KEY",
		listVar: "OPERATOR_LIVE_ANTHROPIC_KEYS",
		primaryVar: "ANTHROPIC_API_KEY",
		prefixedVar: "ANTHROPIC_API_KEY_"
	},
	google: {
		liveSingle: GOOGLE_LIVE_SINGLE_KEY,
		listVar: "GEMINI_API_KEYS",
		primaryVar: "GEMINI_API_KEY",
		prefixedVar: "GEMINI_API_KEY_"
	},
	"google-vertex": {
		liveSingle: GOOGLE_LIVE_SINGLE_KEY,
		listVar: "GEMINI_API_KEYS",
		primaryVar: "GEMINI_API_KEY",
		prefixedVar: "GEMINI_API_KEY_"
	},
	openai: {
		liveSingle: "OPERATOR_LIVE_OPENAI_KEY",
		listVar: "OPENAI_API_KEYS",
		primaryVar: "OPENAI_API_KEY",
		prefixedVar: "OPENAI_API_KEY_"
	}
};
function parseKeyList(raw) {
	if (!raw) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(raw.split(KEY_SPLIT_RE));
}
function collectEnvPrefixedKeys(prefix, env) {
	const keys = [];
	for (const [name, value] of Object.entries(env)) {
		if (!name.startsWith(prefix)) continue;
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
		if (!trimmed) continue;
		keys.push(trimmed);
	}
	return keys;
}
function resolveProviderApiKeyConfig(provider) {
	const normalized = require_model_selection_normalize.normalizeProviderId(provider);
	const custom = PROVIDER_API_KEY_CONFIG[normalized];
	const base = PROVIDER_PREFIX_OVERRIDES[normalized] ?? normalized.toUpperCase().replace(/-/g, "_");
	const liveSingle = custom?.liveSingle ?? `OPERATOR_LIVE_${base}_KEY`;
	const listVar = custom?.listVar ?? `${base}_API_KEYS`;
	const primaryVar = custom?.primaryVar ?? `${base}_API_KEY`;
	const prefixedVar = custom?.prefixedVar ?? `${base}_API_KEY_`;
	if (normalized === "google" || normalized === "google-vertex") return {
		liveSingle,
		listVar,
		primaryVar,
		prefixedVar,
		fallbackVars: ["GOOGLE_API_KEY"]
	};
	return {
		liveSingle,
		listVar,
		primaryVar,
		prefixedVar,
		fallbackVars: []
	};
}
/** Collect configured API keys for live provider tests without exposing values. */
function collectProviderApiKeys(provider, options = {}) {
	const env = options.env ?? process.env;
	const normalizedProvider = require_model_selection_normalize.normalizeProviderId(provider);
	const config = resolveProviderApiKeyConfig(normalizedProvider);
	const forcedSingle = config.liveSingle ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env[config.liveSingle]) : void 0;
	if (forcedSingle) return [forcedSingle];
	const fromList = parseKeyList(config.listVar ? env[config.listVar] : void 0);
	const primary = config.primaryVar ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env[config.primaryVar]) : void 0;
	const fromPrefixed = config.prefixedVar ? collectEnvPrefixedKeys(config.prefixedVar, env) : [];
	const fallback = config.fallbackVars.map((envVar) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env[envVar])).filter(Boolean);
	const manifestFallback = (options.providerEnvVars ?? require_provider_env_vars.getProviderEnvVars(normalizedProvider)).map((envVar) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(env[envVar])).filter(Boolean);
	const seen = /* @__PURE__ */ new Set();
	const add = (value) => {
		if (!value) return;
		if (seen.has(value)) return;
		seen.add(value);
	};
	for (const value of fromList) add(value);
	add(primary);
	for (const value of fromPrefixed) add(value);
	for (const value of fallback) add(value);
	for (const value of manifestFallback) add(value);
	return Array.from(seen);
}
/** Return whether a provider error message indicates API-key rate limiting. */
function isApiKeyRateLimitError(message) {
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(message);
	if (lower.includes("rate_limit")) return true;
	if (lower.includes("rate limit")) return true;
	if (lower.includes("429")) return true;
	if (lower.includes("quota exceeded") || lower.includes("quota_exceeded")) return true;
	if (lower.includes("resource exhausted") || lower.includes("resource_exhausted")) return true;
	if (lower.includes("too many requests")) return true;
	return false;
}
//#endregion
//#region src/agents/api-key-rotation.ts
/**
* Provider API-key rotation wrapper.
* Runs provider calls across configured keys on rate-limit failures and keeps
* same-key transient retries separate from key rotation.
*/
/** Collect primary and live-discovered provider keys in stable de-duped order. */
function collectProviderApiKeysForExecution(params) {
	const { primaryApiKey, provider } = params;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)([primaryApiKey?.trim() ?? "", ...collectProviderApiKeys(provider)]);
}
/**
* Execute a provider operation with key rotation and optional same-key transient
* retries.
*/
async function executeWithApiKeyRotation(params) {
	const keys = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(params.apiKeys);
	if (keys.length === 0) throw new Error(`No API keys configured for provider "${params.provider}".`);
	let lastError;
	const transientRetry = require_operation_retry.resolveTransientProviderRetryOptions(params.transientRetry);
	keyLoop: for (const [apiKeyIndex, apiKey] of keys.entries()) {
		const maxOperationAttempts = require_operation_retry.resolveTransientProviderAttempts(transientRetry);
		for (let attemptNumber = 1; attemptNumber <= maxOperationAttempts; attemptNumber += 1) try {
			return await params.execute(apiKey);
		} catch (error) {
			lastError = error;
			const message = require_errors.formatErrorMessage(error);
			if (params.shouldRetry ? params.shouldRetry({
				apiKey,
				error,
				attempt: apiKeyIndex,
				message
			}) : isApiKeyRateLimitError(message)) {
				if (apiKeyIndex + 1 >= keys.length) break;
				params.onRetry?.({
					apiKey,
					error,
					attempt: apiKeyIndex,
					message
				});
				break;
			}
			if (!transientRetry || !require_operation_retry.shouldRetrySameKeyProviderOperation({
				options: transientRetry,
				error,
				message,
				provider: params.provider,
				apiKeyIndex,
				attemptNumber,
				maxAttempts: maxOperationAttempts
			})) break keyLoop;
			const delayMs = require_operation_retry.resolveTransientProviderDelayMs(transientRetry, attemptNumber);
			await (transientRetry.sleep ?? require_src.sleepWithAbort)(delayMs, transientRetry.signal);
		}
	}
	if (lastError === void 0) throw new Error(`Failed to run API request for ${params.provider}.`);
	throw toLintErrorObject(lastError, "Non-Error thrown");
}
function toLintErrorObject(value, fallbackMessage) {
	if (value instanceof Error) return value;
	if (typeof value === "string") return new Error(value);
	const error = new Error(fallbackMessage, { cause: value });
	if (typeof value === "object" && value !== null || typeof value === "function") Object.assign(error, value);
	return error;
}
//#endregion
Object.defineProperty(exports, "collectProviderApiKeysForExecution", {
	enumerable: true,
	get: function() {
		return collectProviderApiKeysForExecution;
	}
});
Object.defineProperty(exports, "executeWithApiKeyRotation", {
	enumerable: true,
	get: function() {
		return executeWithApiKeyRotation;
	}
});
