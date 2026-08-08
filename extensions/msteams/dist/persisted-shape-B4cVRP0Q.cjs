const require_stagger = require("./stagger-B6F7g8Gn.cjs");
let zod = require("zod");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/cron/delivery-field-schemas.ts
/** Parses user-provided cron delivery fields into narrow runtime values. */
const trimStringPreprocess = (value) => typeof value === "string" ? value.trim() : value;
const trimLowercaseStringPreprocess = (value) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) ?? value;
const DeliveryModeFieldSchema = zod.z.preprocess(trimLowercaseStringPreprocess, zod.z.enum([
	"deliver",
	"announce",
	"none",
	"webhook"
])).transform((value) => value === "deliver" ? "announce" : value);
/** Accepts non-empty string fields after trimming and lowercasing user-provided delivery input. */
const LowercaseNonEmptyStringFieldSchema = zod.z.preprocess(trimLowercaseStringPreprocess, zod.z.string().min(1));
/** Accepts non-empty string fields after trimming delivery input without changing case. */
const TrimmedNonEmptyStringFieldSchema = zod.z.preprocess(trimStringPreprocess, zod.z.string().min(1));
/** Accepts delivery thread identifiers as either trimmed strings or finite numeric ids. */
const DeliveryThreadIdFieldSchema = zod.z.union([TrimmedNonEmptyStringFieldSchema, zod.z.number().finite()]);
/** Accepts non-negative finite timeout seconds from cron delivery payloads. */
const TimeoutSecondsFieldSchema = zod.z.number().finite().nonnegative();
/** Parses optional cron delivery fields while dropping invalid values instead of throwing. */
function parseDeliveryInput(input) {
	return {
		mode: parseOptionalField(DeliveryModeFieldSchema, input.mode),
		channel: parseOptionalField(LowercaseNonEmptyStringFieldSchema, input.channel),
		to: parseOptionalField(TrimmedNonEmptyStringFieldSchema, input.to),
		threadId: parseOptionalField(DeliveryThreadIdFieldSchema, input.threadId),
		accountId: parseOptionalField(TrimmedNonEmptyStringFieldSchema, input.accountId)
	};
}
/** Returns a parsed field value only when the supplied schema accepts it. */
function parseOptionalField(schema, value) {
	const parsed = schema.safeParse(value);
	return parsed.success ? parsed.data : void 0;
}
//#endregion
//#region src/cron/persisted-shape.ts
/** Validates persisted cron job records before loading them from disk/state. */
/** Returns the first structural reason a persisted cron job cannot be loaded safely. */
function getInvalidPersistedCronJobReason(candidate) {
	const id = candidate.id;
	if (typeof id !== "string" || !id.trim()) return "missing-id";
	const schedule = candidate.schedule;
	if (!schedule || Array.isArray(schedule)) return "missing-schedule";
	if (typeof schedule === "string") return null;
	if (typeof schedule !== "object") return "missing-schedule";
	const scheduleRecord = schedule;
	const scheduleKind = scheduleRecord.kind;
	if (scheduleKind !== "at" && scheduleKind !== "every" && scheduleKind !== "cron" && scheduleKind !== "on-exit") return "invalid-schedule";
	if (scheduleKind === "at") {
		const at = scheduleRecord.at;
		if (typeof at !== "string" || require_stagger.parseAbsoluteTimeMs(at) === null) return "invalid-schedule";
	}
	if (scheduleKind === "every") {
		const everyMs = scheduleRecord.everyMs;
		if (typeof everyMs !== "number" || !Number.isFinite(everyMs) || everyMs <= 0) return "invalid-schedule";
	}
	if (scheduleKind === "cron") {
		const expr = scheduleRecord.expr;
		if (typeof expr !== "string" || expr.trim().length === 0) return "invalid-schedule";
	}
	if (scheduleKind === "on-exit") {
		const command = scheduleRecord.command;
		if (typeof command !== "string" || command.trim().length === 0) return "invalid-schedule";
	}
	if ("trigger" in candidate) {
		const trigger = candidate.trigger;
		if (!trigger || typeof trigger !== "object" || Array.isArray(trigger)) return "invalid-trigger";
		const script = trigger.script;
		if (typeof script !== "string" || script.trim().length === 0 || scheduleKind === "at" || scheduleKind === "on-exit") return "invalid-trigger";
	}
	const payload = candidate.payload;
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "missing-payload";
	const payloadRecord = payload;
	const payloadKind = payloadRecord.kind;
	if (payloadKind !== "systemEvent" && payloadKind !== "agentTurn" && payloadKind !== "command") return "invalid-payload";
	if (payloadKind === "systemEvent") {
		if (typeof payloadRecord.text !== "string") return "invalid-payload";
	}
	if (payloadKind === "agentTurn") {
		const message = payloadRecord.message;
		if (typeof message !== "string" || message.trim().length === 0) return "invalid-payload";
	}
	if (payloadKind === "command") {
		const argv = payloadRecord.argv;
		if (!Array.isArray(argv) || argv.length === 0 || argv.some((value) => typeof value !== "string" || value.length === 0)) return "invalid-payload";
	}
	return null;
}
//#endregion
Object.defineProperty(exports, "DeliveryThreadIdFieldSchema", {
	enumerable: true,
	get: function() {
		return DeliveryThreadIdFieldSchema;
	}
});
Object.defineProperty(exports, "LowercaseNonEmptyStringFieldSchema", {
	enumerable: true,
	get: function() {
		return LowercaseNonEmptyStringFieldSchema;
	}
});
Object.defineProperty(exports, "TimeoutSecondsFieldSchema", {
	enumerable: true,
	get: function() {
		return TimeoutSecondsFieldSchema;
	}
});
Object.defineProperty(exports, "TrimmedNonEmptyStringFieldSchema", {
	enumerable: true,
	get: function() {
		return TrimmedNonEmptyStringFieldSchema;
	}
});
Object.defineProperty(exports, "getInvalidPersistedCronJobReason", {
	enumerable: true,
	get: function() {
		return getInvalidPersistedCronJobReason;
	}
});
Object.defineProperty(exports, "parseDeliveryInput", {
	enumerable: true,
	get: function() {
		return parseDeliveryInput;
	}
});
Object.defineProperty(exports, "parseOptionalField", {
	enumerable: true,
	get: function() {
		return parseOptionalField;
	}
});
