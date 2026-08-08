const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_errors = require("./errors-rYeQaZRQ.cjs");
const require_timeout = require("./timeout-CEvCWJvo.cjs");
let node_path = require("node:path");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_acp_core_normalize_text = require("@gabrielvfonseca/acp-core/normalize-text");
//#region src/acp/control-plane/runtime-options.ts
/** Validation and normalization for ACP session runtime options and config controls. */
const MAX_RUNTIME_MODE_LENGTH = 64;
const MAX_MODEL_LENGTH = 200;
const MAX_THINKING_LENGTH = 32;
const MAX_PERMISSION_PROFILE_LENGTH = 80;
const MAX_CWD_LENGTH = 4096;
const MIN_TIMEOUT_SECONDS = 1;
const MAX_TIMEOUT_SECONDS = 1440 * 60;
const MAX_BACKEND_OPTION_KEY_LENGTH = 64;
const MAX_BACKEND_OPTION_VALUE_LENGTH = 512;
const MAX_BACKEND_EXTRAS = 32;
const SAFE_OPTION_KEY_RE = /^[a-z0-9][a-z0-9._:-]*$/i;
const RUNTIME_CONFIG_OPTION_ALIASES = {
	model: ["model"],
	thinking: [
		"thinking",
		"effort",
		"reasoning_effort",
		"thought_level"
	],
	permissionProfile: [
		"approval_policy",
		"permission_profile",
		"permissions",
		"permission_mode"
	],
	timeoutSeconds: ["timeout", "timeout_seconds"]
};
function failInvalidOption(message) {
	throw new require_errors.errors_exports.AcpRuntimeError("ACP_INVALID_RUNTIME_OPTION", message);
}
function validateNoControlChars(value, field) {
	for (let i = 0; i < value.length; i += 1) {
		const code = value.charCodeAt(i);
		if (code < 32 || code === 127) failInvalidOption(`${field} must not include control characters.`);
	}
	return value;
}
function validateBoundedText(params) {
	const normalized = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(params.value);
	if (!normalized) failInvalidOption(`${params.field} must not be empty.`);
	if (normalized.length > params.maxLength) failInvalidOption(`${params.field} must be at most ${params.maxLength} characters.`);
	return validateNoControlChars(normalized, params.field);
}
function validateBackendOptionKey(rawKey) {
	const key = validateBoundedText({
		value: rawKey,
		field: "ACP config key",
		maxLength: MAX_BACKEND_OPTION_KEY_LENGTH
	});
	if (!SAFE_OPTION_KEY_RE.test(key)) failInvalidOption("ACP config key must use letters, numbers, dots, colons, underscores, or dashes.");
	return key;
}
function validateBackendOptionValue(rawValue) {
	return validateBoundedText({
		value: rawValue,
		field: "ACP config value",
		maxLength: MAX_BACKEND_OPTION_VALUE_LENGTH
	});
}
function validateRuntimeModeInput(rawMode) {
	return validateBoundedText({
		value: rawMode,
		field: "Runtime mode",
		maxLength: MAX_RUNTIME_MODE_LENGTH
	});
}
function validateRuntimeModelInput(rawModel) {
	return validateBoundedText({
		value: rawModel,
		field: "Model id",
		maxLength: MAX_MODEL_LENGTH
	});
}
function validateRuntimeThinkingInput(rawThinking) {
	return validateBoundedText({
		value: rawThinking,
		field: "Thinking level",
		maxLength: MAX_THINKING_LENGTH
	});
}
function validateRuntimePermissionProfileInput(rawProfile) {
	return validateBoundedText({
		value: rawProfile,
		field: "Permission profile",
		maxLength: MAX_PERMISSION_PROFILE_LENGTH
	});
}
function validateRuntimeCwdInput(rawCwd) {
	const cwd = validateBoundedText({
		value: rawCwd,
		field: "Working directory",
		maxLength: MAX_CWD_LENGTH
	});
	if (!(0, node_path.isAbsolute)(cwd)) failInvalidOption(`Working directory must be an absolute path. Received "${cwd}".`);
	return cwd;
}
function validateRuntimeTimeoutSecondsInput(rawTimeout) {
	if (typeof rawTimeout !== "number" || !Number.isFinite(rawTimeout)) failInvalidOption("Timeout must be a positive integer in seconds.");
	const timeout = Math.round(rawTimeout);
	if (timeout < MIN_TIMEOUT_SECONDS || timeout > MAX_TIMEOUT_SECONDS) failInvalidOption(`Timeout must be between ${MIN_TIMEOUT_SECONDS} and ${MAX_TIMEOUT_SECONDS} seconds.`);
	return timeout;
}
function parseRuntimeTimeoutSecondsInput(rawTimeout) {
	const normalized = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(rawTimeout);
	if (!normalized || !/^\d+$/.test(normalized)) failInvalidOption("Timeout must be a positive integer in seconds.");
	return validateRuntimeTimeoutSecondsInput(require_parse_finite_number.parseStrictPositiveInteger(normalized) ?? 0);
}
function validateRuntimeConfigOptionInput(rawKey, rawValue) {
	return {
		key: validateBackendOptionKey(rawKey),
		value: validateBackendOptionValue(rawValue)
	};
}
function validateRuntimeOptionPatch(patch) {
	if (!patch) return {};
	const rawPatch = patch;
	const allowedKeys = /* @__PURE__ */ new Set([
		"runtimeMode",
		"model",
		"thinking",
		"cwd",
		"permissionProfile",
		"timeoutSeconds",
		"backendExtras"
	]);
	for (const key of Object.keys(rawPatch)) if (!allowedKeys.has(key)) failInvalidOption(`Unknown runtime option "${key}".`);
	const next = {};
	if (Object.hasOwn(rawPatch, "runtimeMode")) if (rawPatch.runtimeMode === void 0) next.runtimeMode = void 0;
	else next.runtimeMode = validateRuntimeModeInput(rawPatch.runtimeMode);
	if (Object.hasOwn(rawPatch, "model")) if (rawPatch.model === void 0) next.model = void 0;
	else next.model = validateRuntimeModelInput(rawPatch.model);
	if (Object.hasOwn(rawPatch, "thinking")) if (rawPatch.thinking === void 0) next.thinking = void 0;
	else next.thinking = validateRuntimeThinkingInput(rawPatch.thinking);
	if (Object.hasOwn(rawPatch, "cwd")) if (rawPatch.cwd === void 0) next.cwd = void 0;
	else next.cwd = validateRuntimeCwdInput(rawPatch.cwd);
	if (Object.hasOwn(rawPatch, "permissionProfile")) if (rawPatch.permissionProfile === void 0) next.permissionProfile = void 0;
	else next.permissionProfile = validateRuntimePermissionProfileInput(rawPatch.permissionProfile);
	if (Object.hasOwn(rawPatch, "timeoutSeconds")) if (rawPatch.timeoutSeconds === void 0) next.timeoutSeconds = void 0;
	else next.timeoutSeconds = validateRuntimeTimeoutSecondsInput(rawPatch.timeoutSeconds);
	if (Object.hasOwn(rawPatch, "backendExtras")) {
		const rawExtras = rawPatch.backendExtras;
		if (rawExtras === void 0) next.backendExtras = void 0;
		else if (!rawExtras || typeof rawExtras !== "object" || Array.isArray(rawExtras)) failInvalidOption("Backend extras must be a key/value object.");
		else {
			const entries = Object.entries(rawExtras);
			if (entries.length > MAX_BACKEND_EXTRAS) failInvalidOption(`Backend extras must include at most ${MAX_BACKEND_EXTRAS} entries.`);
			const extras = {};
			for (const [entryKey, entryValue] of entries) {
				const { key, value } = validateRuntimeConfigOptionInput(entryKey, entryValue);
				extras[key] = value;
			}
			next.backendExtras = Object.keys(extras).length > 0 ? extras : void 0;
		}
	}
	return next;
}
function normalizeRuntimeOptions(options) {
	const runtimeMode = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(options?.runtimeMode);
	const model = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(options?.model);
	const thinking = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(options?.thinking);
	const cwd = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(options?.cwd);
	const permissionProfile = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(options?.permissionProfile);
	let timeoutSeconds;
	if (typeof options?.timeoutSeconds === "number" && Number.isFinite(options.timeoutSeconds)) {
		const rounded = Math.round(options.timeoutSeconds);
		if (rounded > 0) timeoutSeconds = rounded;
	}
	const backendExtrasEntries = Object.entries(options?.backendExtras ?? {}).map(([key, value]) => [(0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(key), (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(value)]).filter(([key, value]) => Boolean(key && value));
	const backendExtras = backendExtrasEntries.length > 0 ? Object.fromEntries(backendExtrasEntries) : void 0;
	return {
		...runtimeMode ? { runtimeMode } : {},
		...model ? { model } : {},
		...thinking ? { thinking } : {},
		...cwd ? { cwd } : {},
		...permissionProfile ? { permissionProfile } : {},
		...typeof timeoutSeconds === "number" ? { timeoutSeconds } : {},
		...backendExtras ? { backendExtras } : {}
	};
}
function mergeRuntimeOptions(params) {
	const current = normalizeRuntimeOptions(params.current);
	const patch = validateRuntimeOptionPatch(params.patch);
	return normalizeRuntimeOptions({
		...current,
		...patch,
		...patch.backendExtras ? { backendExtras: {
			...current.backendExtras,
			...patch.backendExtras
		} } : {}
	});
}
function resolveRuntimeOptionsFromMeta(meta) {
	const normalized = normalizeRuntimeOptions(meta.runtimeOptions);
	if (normalized.cwd || !meta.cwd) return normalized;
	return normalizeRuntimeOptions({
		...normalized,
		cwd: meta.cwd
	});
}
function runtimeOptionsEqual(a, b) {
	return JSON.stringify(normalizeRuntimeOptions(a)) === JSON.stringify(normalizeRuntimeOptions(b));
}
function buildRuntimeControlSignature(options) {
	const normalized = normalizeRuntimeOptions(options);
	const extras = Object.entries(normalized.backendExtras ?? {}).toSorted(([a], [b]) => a.localeCompare(b));
	return JSON.stringify({
		runtimeMode: normalized.runtimeMode ?? null,
		model: normalized.model ?? null,
		thinking: normalized.thinking ?? null,
		permissionProfile: normalized.permissionProfile ?? null,
		timeoutSeconds: normalized.timeoutSeconds ?? null,
		backendExtras: extras
	});
}
function buildRuntimeConfigOptionPairs(options, advertisedConfigOptionKeys) {
	const normalized = normalizeRuntimeOptions(options);
	const pairs = /* @__PURE__ */ new Map();
	if (normalized.model) pairs.set(resolveRuntimeConfigOptionKey("model", advertisedConfigOptionKeys), normalized.model);
	if (normalized.thinking) pairs.set(resolveRuntimeConfigOptionKey("thinking", advertisedConfigOptionKeys), normalized.thinking);
	if (normalized.permissionProfile) pairs.set(resolveRuntimeConfigOptionKey("approval_policy", advertisedConfigOptionKeys), normalized.permissionProfile);
	if (typeof normalized.timeoutSeconds === "number" && shouldEmitTimeoutConfigOption(advertisedConfigOptionKeys)) pairs.set(resolveRuntimeConfigOptionKey("timeout", advertisedConfigOptionKeys), String(normalized.timeoutSeconds));
	for (const [key, value] of Object.entries(normalized.backendExtras ?? {})) {
		const wireKey = resolveRuntimeConfigOptionKey(key, advertisedConfigOptionKeys);
		if (!pairs.has(wireKey)) pairs.set(wireKey, value);
	}
	return [...pairs.entries()];
}
function shouldEmitTimeoutConfigOption(advertisedConfigOptionKeys) {
	const advertisedKeys = buildAdvertisedConfigOptionKeyMap(advertisedConfigOptionKeys);
	return advertisedKeys.size === 0 || RUNTIME_CONFIG_OPTION_ALIASES.timeoutSeconds.some((alias) => advertisedKeys.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias)));
}
function buildAdvertisedConfigOptionKeyMap(advertisedConfigOptionKeys) {
	const advertisedKeys = /* @__PURE__ */ new Map();
	for (const rawKey of advertisedConfigOptionKeys ?? []) {
		const key = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(rawKey);
		const normalizedKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key);
		if (key && normalizedKey && !advertisedKeys.has(normalizedKey)) advertisedKeys.set(normalizedKey, key);
	}
	return advertisedKeys;
}
function resolveRuntimeConfigOptionAliases(key) {
	const normalizedKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(key);
	for (const aliases of Object.values(RUNTIME_CONFIG_OPTION_ALIASES)) if (aliases.some((alias) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias) === normalizedKey)) return aliases;
	return [key];
}
function resolveRuntimeConfigOptionKey(key, advertisedConfigOptionKeys) {
	const normalizedKey = (0, _gabrielvfonseca_acp_core_normalize_text.normalizeText)(key) ?? "";
	const normalizedLookupKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalizedKey);
	const advertisedKeys = buildAdvertisedConfigOptionKeyMap(advertisedConfigOptionKeys);
	if (!normalizedKey || advertisedKeys.size === 0) return normalizedKey;
	const exactAdvertisedKey = advertisedKeys.get(normalizedLookupKey);
	if (exactAdvertisedKey) return exactAdvertisedKey;
	for (const alias of resolveRuntimeConfigOptionAliases(normalizedKey)) {
		const advertisedAlias = advertisedKeys.get((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias));
		if (advertisedAlias) return advertisedAlias;
	}
	return normalizedKey;
}
function inferRuntimeOptionPatchFromConfigOption(key, value) {
	const validated = validateRuntimeConfigOptionInput(key, value);
	const normalizedKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(validated.key);
	if (normalizedKey === "model") return { model: validateRuntimeModelInput(validated.value) };
	if (normalizedKey === "thinking" || normalizedKey === "effort" || normalizedKey === "thought_level" || normalizedKey === "reasoning_effort") return { thinking: validateRuntimeThinkingInput(validated.value) };
	if (normalizedKey === "approval_policy" || normalizedKey === "permission_profile" || normalizedKey === "permissions" || normalizedKey === "permission_mode") return { permissionProfile: validateRuntimePermissionProfileInput(validated.value) };
	if (normalizedKey === "timeout" || normalizedKey === "timeout_seconds") return { timeoutSeconds: parseRuntimeTimeoutSecondsInput(validated.value) };
	if (normalizedKey === "cwd") return { cwd: validateRuntimeCwdInput(validated.value) };
	return { backendExtras: { [validated.key]: validated.value } };
}
//#endregion
//#region src/acp/control-plane/manager.turn-timeout.ts
const ACP_TURN_TIMEOUT_CLEANUP_GRACE_MS = 2e3;
const ACP_TURN_TIMEOUT_REASON = "turn-timeout";
const ACP_TURN_TIMEOUT_DETAIL_CODE = "TURN_TIMEOUT";
/** Resolves the effective ACP turn timeout from session runtime options or agent defaults. */
function resolveTurnTimeoutMs(params) {
	const runtimeTimeoutSeconds = resolveRuntimeOptionsFromMeta(params.meta).timeoutSeconds;
	if (typeof runtimeTimeoutSeconds === "number" && Number.isFinite(runtimeTimeoutSeconds) && runtimeTimeoutSeconds > 0) return (0, _gabrielvfonseca_normalization_core_number_coercion.clampTimerTimeoutMs)(Math.round(runtimeTimeoutSeconds * 1e3), 1e3) ?? 1e3;
	return require_timeout.resolveAgentTimeoutMs({
		cfg: params.cfg,
		minMs: 1e3
	});
}
/** Awaits a turn promise with bounded timeout handling and late-error logging. */
async function awaitTurnWithTimeout(params) {
	const observedTurnPromise = params.turnPromise.then((value) => ({
		kind: "value",
		value
	}), (error) => ({
		kind: "error",
		error
	}));
	if (params.timeoutMs <= 0) {
		const outcome = await observedTurnPromise;
		if (outcome.kind === "error") throw outcome.error;
		return outcome.value;
	}
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.clampTimerTimeoutMs)(params.timeoutMs, 1);
	if (timeoutMs === void 0) {
		const outcome = await observedTurnPromise;
		if (outcome.kind === "error") throw outcome.error;
		return outcome.value;
	}
	const timeoutToken = Symbol("acp-turn-timeout");
	let timer;
	const timeoutPromise = new Promise((resolve) => {
		timer = setTimeout(() => resolve(timeoutToken), timeoutMs);
		timer.unref?.();
	});
	try {
		const outcome = await Promise.race([observedTurnPromise, timeoutPromise]);
		if (outcome === timeoutToken) {
			observedTurnPromise.then((lateOutcome) => {
				if (lateOutcome.kind === "error") require_globals.logVerbose(`acp-manager: detached late turn error after timeout for ${params.sessionKey}: ${String(lateOutcome.error)}`);
			});
			await params.onTimeout();
			throw new require_errors.errors_exports.AcpRuntimeError("ACP_TURN_FAILED", `ACP turn timed out after ${Math.max(1, Math.round(params.timeoutLabelMs / 1e3))}s.`, { detailCode: ACP_TURN_TIMEOUT_DETAIL_CODE });
		}
		if (outcome.kind === "error") throw outcome.error;
		return outcome.value;
	} finally {
		if (timer) clearTimeout(timer);
	}
}
/** Cancels a timed-out turn and clears non-persistent cached runtime state. */
async function cleanupTimedOutTurn(params) {
	params.activeTurn.abortController.abort();
	if (!params.activeTurn.cancelPromise) params.activeTurn.cancelPromise = params.activeTurn.runtime.cancel({
		handle: params.activeTurn.handle,
		reason: ACP_TURN_TIMEOUT_REASON
	});
	const cancelFinished = await awaitCleanupWithGrace({
		sessionKey: params.sessionKey,
		label: "cancel",
		promise: params.activeTurn.cancelPromise
	});
	if (params.mode !== "oneshot") return;
	const closePromise = params.activeTurn.runtime.close({
		handle: params.activeTurn.handle,
		reason: ACP_TURN_TIMEOUT_REASON
	});
	const closeFinished = await awaitCleanupWithGrace({
		sessionKey: params.sessionKey,
		label: "close",
		promise: closePromise
	});
	if (cancelFinished && closeFinished) {
		params.clearCachedRuntimeStateIfHandleMatches(params.activeTurn);
		return;
	}
	Promise.allSettled([params.activeTurn.cancelPromise, closePromise]).then(() => {
		params.clearCachedRuntimeStateIfHandleMatches(params.activeTurn);
	});
}
async function awaitCleanupWithGrace(params) {
	const observedCleanupPromise = params.promise.then(() => ({ kind: "done" }), (error) => ({
		kind: "error",
		error
	}));
	const timeoutToken = Symbol(`acp-timeout-${params.label}`);
	let timer;
	const timeoutPromise = new Promise((resolve) => {
		timer = setTimeout(() => resolve(timeoutToken), ACP_TURN_TIMEOUT_CLEANUP_GRACE_MS);
		timer.unref?.();
	});
	try {
		const outcome = await Promise.race([observedCleanupPromise, timeoutPromise]);
		if (outcome === timeoutToken) {
			observedCleanupPromise.then((lateOutcome) => {
				if (lateOutcome.kind === "error") require_globals.logVerbose(`acp-manager: detached timed-out turn ${params.label} cleanup failed for ${params.sessionKey}: ${String(lateOutcome.error)}`);
			});
			require_globals.logVerbose(`acp-manager: timed-out turn ${params.label} cleanup exceeded ${ACP_TURN_TIMEOUT_CLEANUP_GRACE_MS}ms for ${params.sessionKey}`);
			return false;
		}
		if (outcome.kind === "error") require_globals.logVerbose(`acp-manager: timed-out turn ${params.label} cleanup failed for ${params.sessionKey}: ${String(outcome.error)}`);
		return true;
	} finally {
		if (timer) clearTimeout(timer);
	}
}
//#endregion
Object.defineProperty(exports, "ACP_TURN_TIMEOUT_DETAIL_CODE", {
	enumerable: true,
	get: function() {
		return ACP_TURN_TIMEOUT_DETAIL_CODE;
	}
});
Object.defineProperty(exports, "awaitTurnWithTimeout", {
	enumerable: true,
	get: function() {
		return awaitTurnWithTimeout;
	}
});
Object.defineProperty(exports, "buildRuntimeConfigOptionPairs", {
	enumerable: true,
	get: function() {
		return buildRuntimeConfigOptionPairs;
	}
});
Object.defineProperty(exports, "buildRuntimeControlSignature", {
	enumerable: true,
	get: function() {
		return buildRuntimeControlSignature;
	}
});
Object.defineProperty(exports, "cleanupTimedOutTurn", {
	enumerable: true,
	get: function() {
		return cleanupTimedOutTurn;
	}
});
Object.defineProperty(exports, "inferRuntimeOptionPatchFromConfigOption", {
	enumerable: true,
	get: function() {
		return inferRuntimeOptionPatchFromConfigOption;
	}
});
Object.defineProperty(exports, "mergeRuntimeOptions", {
	enumerable: true,
	get: function() {
		return mergeRuntimeOptions;
	}
});
Object.defineProperty(exports, "normalizeRuntimeOptions", {
	enumerable: true,
	get: function() {
		return normalizeRuntimeOptions;
	}
});
Object.defineProperty(exports, "parseRuntimeTimeoutSecondsInput", {
	enumerable: true,
	get: function() {
		return parseRuntimeTimeoutSecondsInput;
	}
});
Object.defineProperty(exports, "resolveRuntimeConfigOptionKey", {
	enumerable: true,
	get: function() {
		return resolveRuntimeConfigOptionKey;
	}
});
Object.defineProperty(exports, "resolveRuntimeOptionsFromMeta", {
	enumerable: true,
	get: function() {
		return resolveRuntimeOptionsFromMeta;
	}
});
Object.defineProperty(exports, "resolveTurnTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveTurnTimeoutMs;
	}
});
Object.defineProperty(exports, "runtimeOptionsEqual", {
	enumerable: true,
	get: function() {
		return runtimeOptionsEqual;
	}
});
Object.defineProperty(exports, "validateRuntimeConfigOptionInput", {
	enumerable: true,
	get: function() {
		return validateRuntimeConfigOptionInput;
	}
});
Object.defineProperty(exports, "validateRuntimeCwdInput", {
	enumerable: true,
	get: function() {
		return validateRuntimeCwdInput;
	}
});
Object.defineProperty(exports, "validateRuntimeModeInput", {
	enumerable: true,
	get: function() {
		return validateRuntimeModeInput;
	}
});
Object.defineProperty(exports, "validateRuntimeModelInput", {
	enumerable: true,
	get: function() {
		return validateRuntimeModelInput;
	}
});
Object.defineProperty(exports, "validateRuntimeOptionPatch", {
	enumerable: true,
	get: function() {
		return validateRuntimeOptionPatch;
	}
});
Object.defineProperty(exports, "validateRuntimePermissionProfileInput", {
	enumerable: true,
	get: function() {
		return validateRuntimePermissionProfileInput;
	}
});
