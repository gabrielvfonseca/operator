const require_date_time = require("./date-time-zxjypawc.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/agents/current-time.ts
/**
* Formats cron-style current-time prompt text with local and UTC references.
*/
/** Resolve localized and UTC current-time text for agent prompts. */
function resolveCronStyleNow(cfg, nowMs) {
	const userTimezone = require_date_time.resolveUserTimezone(cfg.agents?.defaults?.userTimezone);
	const userTimeFormat = require_date_time.resolveUserTimeFormat(cfg.agents?.defaults?.timeFormat);
	const timestampMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveDateTimestampMs)(nowMs);
	const date = new Date(timestampMs);
	const formattedTime = require_date_time.formatUserTime(date, userTimezone, userTimeFormat) ?? date.toISOString();
	return {
		userTimezone,
		formattedTime,
		timeLine: `Current time: ${formattedTime} (${userTimezone})\nReference UTC: ${`${date.toISOString().replace("T", " ").slice(0, 16)} UTC`}`
	};
}
/**
* Append a fresh current-time block, or refresh a previously helper-injected one,
* so heartbeat/cron prompts flowing through this helper repeatedly never leak a
* stale `Current time:` value (issue #44993).
*/
const CURRENT_TIME_LINE_RE = /^Current time: .+? \([^)]+\)\nReference UTC: \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/gm;
function appendCronStyleCurrentTimeLine(text, cfg, nowMs) {
	const base = text.trimEnd();
	if (!base) return base;
	const { timeLine } = resolveCronStyleNow(cfg, nowMs);
	if (!CURRENT_TIME_LINE_RE.test(base)) return `${base}\n${timeLine}`;
	CURRENT_TIME_LINE_RE.lastIndex = 0;
	let replaced = false;
	return base.replace(CURRENT_TIME_LINE_RE, () => {
		if (replaced) return "";
		replaced = true;
		return timeLine;
	}).replace(/\n{3,}/g, "\n\n").replace(/\n\n+(?=Current time:)/g, "\n").trimEnd();
}
//#endregion
Object.defineProperty(exports, "appendCronStyleCurrentTimeLine", {
	enumerable: true,
	get: function() {
		return appendCronStyleCurrentTimeLine;
	}
});
Object.defineProperty(exports, "resolveCronStyleNow", {
	enumerable: true,
	get: function() {
		return resolveCronStyleNow;
	}
});
