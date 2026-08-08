require("./utils-CXqBhRFw.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/cron/parse.ts
/** Parses cron schedule timestamps from user-facing absolute time strings. */
const ISO_TZ_RE = /(Z|[+-]\d{2}:?\d{2})$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}[Tt]/;
const ISO_ABSOLUTE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[Tt](\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?(?:[Zz]|[+-]\d{2}:?\d{2})?)?$/;
function normalizeUtcIso(raw) {
	if (ISO_TZ_RE.test(raw)) return raw;
	if (ISO_DATE_RE.test(raw)) return `${raw}T00:00:00Z`;
	if (ISO_DATE_TIME_RE.test(raw)) return `${raw}Z`;
	return raw;
}
function isValidIsoAbsolute(raw) {
	const match = ISO_ABSOLUTE_RE.exec(raw);
	if (!match) return false;
	const [, yearRaw, monthRaw, dayRaw, hourRaw = "0", minuteRaw = "0", secondRaw = "0", fractionRaw] = match;
	const year = Number(yearRaw);
	const month = Number(monthRaw);
	const day = Number(dayRaw);
	const hour = Number(hourRaw);
	const minute = Number(minuteRaw);
	const second = Number(secondRaw);
	const millisecond = fractionRaw ? Number(fractionRaw.slice(1, 4).padEnd(3, "0")) : 0;
	const isEndOfDay = hour === 24 && minute === 0 && second === 0 && millisecond === 0;
	const probe = /* @__PURE__ */ new Date(0);
	probe.setUTCFullYear(year, month - 1, day);
	probe.setUTCHours(isEndOfDay ? 0 : hour, minute, second, millisecond);
	return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day && probe.getUTCHours() === (isEndOfDay ? 0 : hour) && probe.getUTCMinutes() === minute && probe.getUTCSeconds() === second && probe.getUTCMilliseconds() === millisecond;
}
/** Parses absolute cron timestamps from epoch milliseconds or ISO-like strings normalized to UTC. */
function parseAbsoluteTimeMs(input) {
	const raw = input.trim();
	if (!raw) return null;
	if (/^\d+$/.test(raw)) {
		const n = require_parse_finite_number.parseStrictPositiveInteger(raw);
		if (n !== void 0 && Number.isFinite(new Date(n).getTime())) return n;
		return null;
	}
	if (!isValidIsoAbsolute(raw)) return null;
	const parsed = Date.parse(normalizeUtcIso(raw));
	return Number.isFinite(parsed) ? parsed : null;
}
//#endregion
//#region src/cron/schedule-number.ts
/** Coerces cron schedule number fields with strict safe-range parsing. */
/** Coerces schedule numeric fields without accepting partial, non-finite, or unsafe values. */
function coerceFiniteScheduleNumber(value) {
	const parsed = (0, _gabrielvfonseca_normalization_core_number_coercion.parseStrictFiniteNumber)(value);
	return parsed !== void 0 && Math.abs(parsed) <= Number.MAX_SAFE_INTEGER ? parsed : void 0;
}
//#endregion
//#region src/cron/service/normalize.ts
/** Name, agent id, and payload text normalization helpers for cron service ops. */
/** Normalizes a required cron job name and throws the public validation error when absent. */
function normalizeRequiredName(raw) {
	if (typeof raw !== "string") throw new Error("cron job name is required");
	const name = raw.trim();
	if (!name) throw new Error("cron job name is required");
	return name;
}
function truncateText(input, maxLen) {
	if (input.length <= maxLen) return input;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(input, Math.max(0, maxLen - 1)).trimEnd()}…`;
}
/** Infers a compact cron job name from payload text first, then schedule shape. */
function inferCronJobName(job) {
	const firstLine = (job?.payload?.kind === "systemEvent" && typeof job.payload.text === "string" ? job.payload.text : job?.payload?.kind === "agentTurn" && typeof job.payload.message === "string" ? job.payload.message : job?.payload?.kind === "command" && Array.isArray(job.payload.argv) ? job.payload.argv.join(" ") : "").split("\n").map((l) => l.trim()).find(Boolean) ?? "";
	if (firstLine) return truncateText(firstLine, 60);
	const kind = typeof job?.schedule?.kind === "string" ? job.schedule.kind : "";
	if (kind === "cron" && typeof job?.schedule?.expr === "string") return `Cron: ${truncateText(job.schedule.expr, 52)}`;
	if (kind === "every" && typeof job?.schedule?.everyMs === "number") return `Every: ${job.schedule.everyMs}ms`;
	if (kind === "at") return "One-shot";
	return "Cron job";
}
/** Extracts the executable text from cron payload variants for main-session queueing. */
function normalizePayloadToSystemText(payload) {
	if (payload.kind === "systemEvent") return typeof payload.text === "string" ? payload.text.trim() : "";
	return payload.kind === "agentTurn" && typeof payload.message === "string" ? payload.message.trim() : "";
}
//#endregion
//#region src/cron/stagger.ts
/** Resolves deterministic cron stagger windows for recurring schedules. */
/** Default jitter window applied to recurring top-of-hour cron schedules. */
const DEFAULT_TOP_OF_HOUR_STAGGER_MS = 300 * 1e3;
function parseCronFields(expr) {
	return expr.trim().split(/\s+/).filter(Boolean);
}
const HOUR_LIST_PART = /^(?:\d+|\d+-\d+)(?:\/\d+)?$|^[*?](?:\/\d+)?$/;
function hasRecurringWildcardHour(field) {
	const parts = field.split(",");
	return parts.every((part) => HOUR_LIST_PART.test(part)) && parts.some((part) => part.startsWith("*") || part.startsWith("?"));
}
/** Returns whether a cron expression fires recurring jobs exactly at the top of an hour. */
function isRecurringTopOfHourCronExpr(expr) {
	const fields = parseCronFields(expr);
	if (fields.length === 5) {
		const [minuteField, hourField] = fields;
		return minuteField === "0" && hasRecurringWildcardHour((0, _gabrielvfonseca_normalization_core.expectDefined)(hourField, "stagger hour field"));
	}
	if (fields.length === 6) {
		const [secondField, minuteField, hourField] = fields;
		return secondField === "0" && minuteField === "0" && hasRecurringWildcardHour((0, _gabrielvfonseca_normalization_core.expectDefined)(hourField, "stagger hour field"));
	}
	return false;
}
/** Normalizes explicit stagger values from config, preserving zero as "run exactly on schedule". */
function normalizeCronStaggerMs(raw) {
	const numeric = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? require_parse_finite_number.parseStrictNonNegativeInteger(raw) ?? NaN : NaN;
	if (!Number.isFinite(numeric)) return;
	const normalized = Math.max(0, Math.floor(numeric));
	return Number.isSafeInteger(normalized) ? normalized : void 0;
}
/** Returns the default anti-thundering-herd stagger for top-of-hour recurring schedules. */
function resolveDefaultCronStaggerMs(expr) {
	return isRecurringTopOfHourCronExpr(expr) ? DEFAULT_TOP_OF_HOUR_STAGGER_MS : void 0;
}
/** Resolves the effective stagger for a cron schedule, preferring explicit values over defaults. */
function resolveCronStaggerMs(schedule) {
	const explicit = normalizeCronStaggerMs(schedule.staggerMs);
	if (explicit !== void 0) return explicit;
	const expr = schedule.expr;
	return resolveDefaultCronStaggerMs(typeof expr === "string" ? expr : "") ?? 0;
}
//#endregion
Object.defineProperty(exports, "coerceFiniteScheduleNumber", {
	enumerable: true,
	get: function() {
		return coerceFiniteScheduleNumber;
	}
});
Object.defineProperty(exports, "inferCronJobName", {
	enumerable: true,
	get: function() {
		return inferCronJobName;
	}
});
Object.defineProperty(exports, "normalizeCronStaggerMs", {
	enumerable: true,
	get: function() {
		return normalizeCronStaggerMs;
	}
});
Object.defineProperty(exports, "normalizePayloadToSystemText", {
	enumerable: true,
	get: function() {
		return normalizePayloadToSystemText;
	}
});
Object.defineProperty(exports, "normalizeRequiredName", {
	enumerable: true,
	get: function() {
		return normalizeRequiredName;
	}
});
Object.defineProperty(exports, "parseAbsoluteTimeMs", {
	enumerable: true,
	get: function() {
		return parseAbsoluteTimeMs;
	}
});
Object.defineProperty(exports, "resolveCronStaggerMs", {
	enumerable: true,
	get: function() {
		return resolveCronStaggerMs;
	}
});
Object.defineProperty(exports, "resolveDefaultCronStaggerMs", {
	enumerable: true,
	get: function() {
		return resolveDefaultCronStaggerMs;
	}
});
