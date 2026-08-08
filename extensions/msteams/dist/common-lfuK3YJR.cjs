require("./fs-safe-BptZQDa1.cjs");
require("./tool-images-BzMy_EyQ.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
require("@gabrielvfonseca/media-core/mime");
//#region src/param-key.ts
function toSnakeCaseKey(key) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.lowercasePreservingWhitespace)(key.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z0-9])([A-Z])/g, "$1_$2"));
}
function resolveSnakeCaseParamKey(params, key) {
	if (Object.hasOwn(params, key)) return key;
	const snakeKey = toSnakeCaseKey(key);
	if (snakeKey !== key && Object.hasOwn(params, snakeKey)) return snakeKey;
}
function readSnakeCaseParamRaw(params, key) {
	const resolvedKey = resolveSnakeCaseParamKey(params, key);
	if (resolvedKey) return params[resolvedKey];
}
//#endregion
//#region src/agents/tools/tool-results.ts
function textResult(text, details) {
	return {
		content: [{
			type: "text",
			text
		}],
		details
	};
}
function jsonResult(payload) {
	return textResult(JSON.stringify(payload, null, 2), payload);
}
//#endregion
//#region src/agents/tools/common.ts
/**
* Shared built-in tool contracts and helpers.
*
* Defines erased tool types, parameter readers, JSON results, progress blocks, and media sanitization.
*/
function asToolParamsRecord(params) {
	return params && typeof params === "object" && !Array.isArray(params) ? params : {};
}
var ToolInputError = class extends Error {
	constructor(message) {
		super(message);
		this.status = 400;
		this.name = "ToolInputError";
	}
};
var ToolAuthorizationError = class extends ToolInputError {
	constructor(message) {
		super(message);
		this.status = 403;
		this.name = "ToolAuthorizationError";
	}
};
function readParamRaw(params, key) {
	return readSnakeCaseParamRaw(params, key);
}
function isBlankParamValue(raw) {
	return typeof raw === "string" && raw.trim() === "";
}
function readStringParam(params, key, options = {}) {
	const { required = false, trim = true, label = key, allowEmpty = false } = options;
	const raw = readParamRaw(params, key);
	if (typeof raw !== "string") {
		if (required) throw new ToolInputError(`${label} required`);
		return;
	}
	const value = trim ? raw.trim() : raw;
	if (!value && !allowEmpty) {
		if (required) throw new ToolInputError(`${label} required`);
		return;
	}
	return value;
}
/**
* Normalize tool model override input.
* - empty/whitespace => undefined
* - "default" (case-insensitive) => undefined (sentinel: reset/fallback)
* - otherwise returns trimmed explicit model string
*/
function normalizeToolModelOverride(value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	if (!trimmed || trimmed.toLowerCase() === "default") return;
	return trimmed;
}
function readNumberParam(params, key, options = {}) {
	const { required = false, label = key, integer = false, strict = false, positiveInteger = false, nonNegativeInteger = false } = options;
	const raw = readParamRaw(params, key);
	let value;
	if (typeof raw === "number" && Number.isFinite(raw)) value = raw;
	else if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (trimmed) {
			const parsed = strict ? (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictFiniteNumber)(trimmed) : Number.parseFloat(trimmed);
			if (parsed !== void 0 && Number.isFinite(parsed)) value = parsed;
		}
	}
	if (value === void 0) {
		if (required) throw new ToolInputError(`${label} required`);
		return;
	}
	if (positiveInteger) return (0, _gabrielvfonseca_normalization_core_number_coercion.asPositiveSafeInteger)(value);
	if (nonNegativeInteger) return (0, _gabrielvfonseca_normalization_core_number_coercion.asSafeIntegerInRange)(value, { min: 0 });
	return integer ? Math.trunc(value) : value;
}
function readPositiveIntegerParam(params, key, options = {}) {
	const value = readNumberParam(params, key, {
		positiveInteger: true,
		strict: true
	});
	if (value === void 0) {
		const raw = readParamRaw(params, key);
		if (raw != null && !isBlankParamValue(raw)) throw new ToolInputError(options.message ?? `${key} must be a positive integer`);
	}
	if (value !== void 0 && options.max !== void 0 && value > options.max) throw new ToolInputError(options.message ?? `${key} must be a positive integer`);
	return value;
}
function readNonNegativeIntegerParam(params, key, options = {}) {
	const value = readNumberParam(params, key, {
		nonNegativeInteger: true,
		strict: true
	});
	if (value === void 0) {
		const raw = readParamRaw(params, key);
		if (raw != null && !isBlankParamValue(raw)) throw new ToolInputError(options.message ?? `${key} must be a non-negative integer`);
	}
	if (value !== void 0 && options.max !== void 0 && value > options.max) throw new ToolInputError(options.message ?? `${key} must be a non-negative integer`);
	return value;
}
function readFiniteNumberParam(params, key, options = {}) {
	const value = readNumberParam(params, key, { strict: true });
	if (value === void 0) {
		const raw = readParamRaw(params, key);
		if (raw != null && !isBlankParamValue(raw)) throw new ToolInputError(options.message ?? `${key} must be a finite number`);
		return;
	}
	if (options.min !== void 0) {
		if (options.minExclusive ? value <= options.min : value < options.min) throw new ToolInputError(options.message ?? `${key} must be a finite number`);
	}
	if (options.max !== void 0) {
		if (options.maxExclusive ? value >= options.max : value > options.max) throw new ToolInputError(options.message ?? `${key} must be a finite number`);
	}
	return value;
}
function readStringArrayParam(params, key, options = {}) {
	const { required = false, label = key } = options;
	const raw = readParamRaw(params, key);
	if (Array.isArray(raw)) {
		const values = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(raw.filter((entry) => typeof entry === "string"));
		if (values.length === 0) {
			if (required) throw new ToolInputError(`${label} required`);
			return;
		}
		return values;
	}
	if (typeof raw === "string") {
		const value = raw.trim();
		if (!value) {
			if (required) throw new ToolInputError(`${label} required`);
			return;
		}
		return [value];
	}
	if (required) throw new ToolInputError(`${label} required`);
}
function stringifyToolPayload(payload) {
	if (typeof payload === "string") return payload;
	try {
		const encoded = JSON.stringify(payload, null, 2);
		if (typeof encoded === "string") return encoded;
	} catch {}
	return String(payload);
}
function failedTextResult(text, details) {
	return textResult(text, details);
}
function payloadTextResult(payload) {
	return textResult(stringifyToolPayload(payload), payload);
}
function toolProgressResult(progress) {
	return {
		content: [],
		details: void 0,
		progress: {
			text: progress.text,
			visibility: "channel",
			privacy: "public",
			...progress.id ? { id: progress.id } : {}
		}
	};
}
function emitToolProgress(onUpdate, progress) {
	const text = progress.text.trim();
	if (!onUpdate || !text) return;
	try {
		onUpdate(toolProgressResult({
			...progress,
			text
		}));
	} catch {}
}
function scheduleToolProgress(onUpdate, progress, delayMs, options = {}) {
	if (!onUpdate || options.signal?.aborted) return () => {};
	let cleared = false;
	const clear = () => {
		if (cleared) return;
		cleared = true;
		clearTimeout(timer);
		options.signal?.removeEventListener("abort", clear);
	};
	const timer = setTimeout(() => {
		clear();
		emitToolProgress(onUpdate, progress);
	}, delayMs);
	options.signal?.addEventListener("abort", clear, { once: true });
	return clear;
}
//#endregion
Object.defineProperty(exports, "ToolAuthorizationError", {
	enumerable: true,
	get: function() {
		return ToolAuthorizationError;
	}
});
Object.defineProperty(exports, "ToolInputError", {
	enumerable: true,
	get: function() {
		return ToolInputError;
	}
});
Object.defineProperty(exports, "asToolParamsRecord", {
	enumerable: true,
	get: function() {
		return asToolParamsRecord;
	}
});
Object.defineProperty(exports, "failedTextResult", {
	enumerable: true,
	get: function() {
		return failedTextResult;
	}
});
Object.defineProperty(exports, "jsonResult", {
	enumerable: true,
	get: function() {
		return jsonResult;
	}
});
Object.defineProperty(exports, "normalizeToolModelOverride", {
	enumerable: true,
	get: function() {
		return normalizeToolModelOverride;
	}
});
Object.defineProperty(exports, "payloadTextResult", {
	enumerable: true,
	get: function() {
		return payloadTextResult;
	}
});
Object.defineProperty(exports, "readFiniteNumberParam", {
	enumerable: true,
	get: function() {
		return readFiniteNumberParam;
	}
});
Object.defineProperty(exports, "readNonNegativeIntegerParam", {
	enumerable: true,
	get: function() {
		return readNonNegativeIntegerParam;
	}
});
Object.defineProperty(exports, "readNumberParam", {
	enumerable: true,
	get: function() {
		return readNumberParam;
	}
});
Object.defineProperty(exports, "readPositiveIntegerParam", {
	enumerable: true,
	get: function() {
		return readPositiveIntegerParam;
	}
});
Object.defineProperty(exports, "readSnakeCaseParamRaw", {
	enumerable: true,
	get: function() {
		return readSnakeCaseParamRaw;
	}
});
Object.defineProperty(exports, "readStringArrayParam", {
	enumerable: true,
	get: function() {
		return readStringArrayParam;
	}
});
Object.defineProperty(exports, "readStringParam", {
	enumerable: true,
	get: function() {
		return readStringParam;
	}
});
Object.defineProperty(exports, "resolveSnakeCaseParamKey", {
	enumerable: true,
	get: function() {
		return resolveSnakeCaseParamKey;
	}
});
Object.defineProperty(exports, "scheduleToolProgress", {
	enumerable: true,
	get: function() {
		return scheduleToolProgress;
	}
});
Object.defineProperty(exports, "textResult", {
	enumerable: true,
	get: function() {
		return textResult;
	}
});
