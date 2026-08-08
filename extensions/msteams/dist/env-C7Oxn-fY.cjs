const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/env.ts
let log = null;
const loadLog = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./subsystem-DVRgVNGQ.cjs")).then((n) => n.subsystem_exports).then(({ createSubsystemLogger }) => createSubsystemLogger("env")), { cacheRejections: true });
const loggedEnv = /* @__PURE__ */ new Set();
const ENV_NORMALIZATION_KEY_GROUPS = [["ZAI_API_KEY", "Z_AI_API_KEY"]];
async function getLog() {
	if (!log) log = await loadLog();
	return log;
}
function formatEnvValue(value, redact) {
	if (redact) return "<redacted>";
	const singleLine = value.replace(/\s+/g, " ").trim();
	if (singleLine.length <= 160) return singleLine;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(singleLine, 160)}…`;
}
/** Logs an accepted env option once, with optional redaction for sensitive values. */
function logAcceptedEnvOption(option) {
	if (process.env.VITEST || false) return;
	if (loggedEnv.has(option.key)) return;
	const rawValue = option.value ?? process.env[option.key];
	if (!rawValue?.trim()) return;
	loggedEnv.add(option.key);
	getLog().then((logger) => {
		logger.info(`env: ${option.key}=${formatEnvValue(rawValue, option.redact)} (${option.description})`);
	}).catch(() => {});
}
/** Normalizes the legacy Z_AI_API_KEY spelling into the canonical ZAI_API_KEY env var. */
function normalizeZaiEnv(env = process.env) {
	if (!env.ZAI_API_KEY?.trim() && env.Z_AI_API_KEY?.trim()) env.ZAI_API_KEY = env.Z_AI_API_KEY;
}
/** Expands env keys to include aliases that process-wide normalization treats as equivalent. */
function expandEnvNormalizationKeys(keys) {
	const expanded = /* @__PURE__ */ new Set();
	for (const key of keys) for (const normalizedKey of resolveEnvNormalizationKeys(key)) expanded.add(normalizedKey);
	return expanded;
}
/** Resolves one env key to its canonical-first runtime normalization group. */
function resolveEnvNormalizationKeys(key) {
	const normalizedKey = process.platform === "win32" ? key.toUpperCase() : key;
	return ENV_NORMALIZATION_KEY_GROUPS.find((group) => group.some((candidate) => candidate === normalizedKey)) ?? [normalizedKey];
}
/** Interprets common human/operator truthy env strings. */
function isTruthyEnvValue(value) {
	if (typeof value !== "string") return false;
	switch ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value)) {
		case "1":
		case "on":
		case "true":
		case "yes": return true;
		default: return false;
	}
}
/** Detects Vitest/test execution from the env shape used by local and worker processes. */
function isVitestRuntimeEnv(env = process.env) {
	return env.VITEST === "true" || env.VITEST === "1" || env.VITEST_POOL_ID !== void 0 || env.VITEST_WORKER_ID !== void 0 || env.NODE_ENV === "test";
}
//#endregion
Object.defineProperty(exports, "expandEnvNormalizationKeys", {
	enumerable: true,
	get: function() {
		return expandEnvNormalizationKeys;
	}
});
Object.defineProperty(exports, "isTruthyEnvValue", {
	enumerable: true,
	get: function() {
		return isTruthyEnvValue;
	}
});
Object.defineProperty(exports, "isVitestRuntimeEnv", {
	enumerable: true,
	get: function() {
		return isVitestRuntimeEnv;
	}
});
Object.defineProperty(exports, "logAcceptedEnvOption", {
	enumerable: true,
	get: function() {
		return logAcceptedEnvOption;
	}
});
Object.defineProperty(exports, "normalizeZaiEnv", {
	enumerable: true,
	get: function() {
		return normalizeZaiEnv;
	}
});
Object.defineProperty(exports, "resolveEnvNormalizationKeys", {
	enumerable: true,
	get: function() {
		return resolveEnvNormalizationKeys;
	}
});
