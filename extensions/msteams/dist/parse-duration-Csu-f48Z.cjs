const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let ms = require("ms");
ms = require_rolldown_runtime.__toESM(ms, 1);
//#region src/cli/parse-duration.ts
function invalidDuration(raw, reason) {
	const value = raw.trim() ? `"${raw}"` : "empty value";
	const prefix = reason ? `Invalid duration (${reason}): ${value}.` : `Invalid duration: ${value}.`;
	return /* @__PURE__ */ new Error(`${prefix} Use values like 500ms, 30s, 5m, 2h, or 1h30m.`);
}
function parseDurationToken(raw, value, unit) {
	const parsed = (0, ms.default)(`${value}${unit}`);
	if (!Number.isFinite(parsed) || parsed < 0) throw invalidDuration(raw);
	return parsed;
}
function roundSafeDurationMs(raw, value) {
	const ms$1 = Math.round(value);
	if (!Number.isSafeInteger(ms$1)) throw invalidDuration(raw);
	return ms$1;
}
/** Parse a non-negative duration into milliseconds, supporting single and composite units. */
function parseDurationMs(raw, opts) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "");
	if (!trimmed) throw invalidDuration(raw, "empty");
	const single = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/.exec(trimmed);
	if (single) return roundSafeDurationMs(raw, parseDurationToken(raw, single[1] ?? "", single[2] ?? opts?.defaultUnit ?? "ms"));
	let totalMs = 0;
	let consumed = 0;
	for (const match of trimmed.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h|d)/g)) {
		const [full, valueRaw, unitRaw] = match;
		const index = match.index ?? -1;
		if (!full || !valueRaw || !unitRaw || index < 0) throw invalidDuration(raw);
		if (index !== consumed) throw invalidDuration(raw, "each composite segment needs a unit");
		totalMs += parseDurationToken(raw, valueRaw, unitRaw);
		consumed += full.length;
	}
	if (consumed !== trimmed.length || consumed === 0) throw invalidDuration(raw);
	return roundSafeDurationMs(raw, totalMs);
}
//#endregion
Object.defineProperty(exports, "parseDurationMs", {
	enumerable: true,
	get: function() {
		return parseDurationMs;
	}
});
