const require_commands_registry_normalize = require("./commands-registry-normalize-Bo5SeH8X.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/abort-primitives.ts
const ABORT_TRIGGERS = /* @__PURE__ */ new Set([
	"stop",
	"esc",
	"abort",
	"exit",
	"interrupt",
	"detente",
	"deten",
	"detén",
	"arrete",
	"arrête",
	"停止",
	"停下来",
	"暂停",
	"やめて",
	"止めて",
	"रुको",
	"توقف",
	"стоп",
	"остановись",
	"останови",
	"остановить",
	"прекрати",
	"halt",
	"anhalten",
	"aufhören",
	"hoer auf",
	"stopp",
	"pare",
	"stop openclaw",
	"openclaw stop",
	"stop action",
	"stop current action",
	"stop run",
	"stop current run",
	"stop agent",
	"stop the agent",
	"stop don't do anything",
	"stop dont do anything",
	"stop do not do anything",
	"stop doing anything",
	"do not do that",
	"please stop",
	"stop please"
]);
const ABORT_MEMORY = /* @__PURE__ */ new Map();
const ABORT_MEMORY_MAX = 2e3;
const TRAILING_ABORT_PUNCTUATION_RE = /[.!?！？…,，。;；:：'"’”)\]}]+$/u;
function normalizeAbortTriggerText(text) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(text).replace(/[’`]/g, "'").replace(/\s+/g, " ").replace(TRAILING_ABORT_PUNCTUATION_RE, "").trim();
}
function isAbortTrigger(text) {
	if (!text) return false;
	const normalized = normalizeAbortTriggerText(text);
	return ABORT_TRIGGERS.has(normalized);
}
function isAbortRequestText(text, options) {
	if (!text) return false;
	const normalized = require_commands_registry_normalize.normalizeCommandBody(text, options).trim();
	if (!normalized) return false;
	const normalizedLower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalized);
	return normalizedLower === "/stop" || normalizeAbortTriggerText(normalizedLower) === "/stop" || isAbortTrigger(normalizedLower);
}
function getAbortMemory(key) {
	const normalized = key.trim();
	if (!normalized) return;
	return ABORT_MEMORY.get(normalized);
}
function pruneAbortMemory() {
	if (ABORT_MEMORY.size <= ABORT_MEMORY_MAX) return;
	const excess = ABORT_MEMORY.size - ABORT_MEMORY_MAX;
	let removed = 0;
	for (const entryKey of ABORT_MEMORY.keys()) {
		ABORT_MEMORY.delete(entryKey);
		removed += 1;
		if (removed >= excess) break;
	}
}
function setAbortMemory(key, value) {
	const normalized = key.trim();
	if (!normalized) return;
	if (!value) {
		ABORT_MEMORY.delete(normalized);
		return;
	}
	if (ABORT_MEMORY.has(normalized)) ABORT_MEMORY.delete(normalized);
	ABORT_MEMORY.set(normalized, true);
	pruneAbortMemory();
}
//#endregion
Object.defineProperty(exports, "getAbortMemory", {
	enumerable: true,
	get: function() {
		return getAbortMemory;
	}
});
Object.defineProperty(exports, "isAbortRequestText", {
	enumerable: true,
	get: function() {
		return isAbortRequestText;
	}
});
Object.defineProperty(exports, "isAbortTrigger", {
	enumerable: true,
	get: function() {
		return isAbortTrigger;
	}
});
Object.defineProperty(exports, "setAbortMemory", {
	enumerable: true,
	get: function() {
		return setAbortMemory;
	}
});
