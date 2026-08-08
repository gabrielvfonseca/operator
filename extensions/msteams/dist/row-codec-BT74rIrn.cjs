const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_persisted_shape = require("./persisted-shape-B4cVRP0Q.cjs");
const require_stagger = require("./stagger-B6F7g8Gn.cjs");
const require_session_target = require("./session-target-DT_L-Jst.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_boolean_coercion = require("@gabrielvfonseca/normalization-core/boolean-coercion");
//#region src/cron/store/key.ts
/** Cron store key normalization for SQLite partitions. */
/** Returns the canonical per-file SQLite partition key for cron store rows. */
function cronStoreKey(storePath) {
	return node_path.default.resolve(storePath);
}
//#endregion
//#region src/cron/normalize-job-identity.ts
/** Repairs legacy cron job identity fields into the canonical id shape. */
/** Normalizes mutable cron job rows from old `jobId` storage into the canonical `id` field. */
function normalizeCronJobIdentityFields(raw) {
	const rawId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.id) ?? "";
	const legacyJobId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw.jobId) ?? "";
	const hadJobIdKey = "jobId" in raw;
	const normalizedId = rawId || legacyJobId;
	const idChanged = Boolean(normalizedId && raw.id !== normalizedId);
	if (idChanged) raw.id = normalizedId;
	if (hadJobIdKey) delete raw.jobId;
	return {
		mutated: idChanged || hadJobIdKey,
		legacyJobIdIssue: hadJobIdKey
	};
}
//#endregion
//#region src/cron/normalize.ts
/** Normalizes cron create/patch payloads before validation and persistence. */
const DEFAULT_OPTIONS = { applyDefaults: false };
function normalizeTrimmedStringArray(value, options) {
	if (Array.isArray(value)) {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(value);
		if (normalized.length === 0 && value.length > 0) return;
		return normalized;
	}
	if (options?.allowNull && value === null) return null;
}
function normalizeCommandEnv(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) throw new Error("command env must be an object with non-blank keys and string values");
	const entries = [];
	for (const [rawKey, rawValue] of Object.entries(value)) {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawKey);
		if (!key || typeof rawValue !== "string") throw new Error("command env must be an object with non-blank keys and string values");
		entries.push([key, rawValue]);
	}
	return Object.fromEntries(entries);
}
function normalizeCommandArgv(value) {
	if (!Array.isArray(value) || value.length === 0) return;
	if (value.some((entry) => typeof entry !== "string" || entry.length === 0)) return;
	return [...value];
}
function hasAgentTurnOnlyPayloadHint(payload) {
	return "model" in payload || "fallbacks" in payload || "thinking" in payload || "timeoutSeconds" in payload || typeof payload.lightContext === "boolean" || typeof payload.allowUnsafeExternalContent === "boolean";
}
function coerceSchedule(schedule) {
	const next = { ...schedule };
	const rawKind = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(schedule.kind);
	const kind = rawKind === "at" || rawKind === "every" || rawKind === "cron" || rawKind === "on-exit" ? rawKind : void 0;
	const exprRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(schedule.expr) ?? "";
	const timezone = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(schedule.tz);
	const commandRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(schedule.command) ?? "";
	const cwdRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(schedule.cwd) ?? "";
	const everyMs = require_stagger.coerceFiniteScheduleNumber(schedule.everyMs);
	const anchorMs = require_stagger.coerceFiniteScheduleNumber(schedule.anchorMs);
	const atString = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(schedule.at) ?? "";
	const parsedAtMs = atString ? require_stagger.parseAbsoluteTimeMs(atString) : null;
	if (kind) next.kind = kind;
	const parsedAtIso = parsedAtMs !== null ? (0, _gabrielvfonseca_normalization_core_number_coercion.timestampMsToIsoString)(parsedAtMs) : void 0;
	if (atString) next.at = parsedAtIso ?? atString;
	else if (parsedAtIso !== void 0) next.at = parsedAtIso;
	if (exprRaw) next.expr = exprRaw;
	else if ("expr" in next) delete next.expr;
	if (timezone) next.tz = timezone;
	else if ("tz" in next) delete next.tz;
	if (everyMs !== void 0 && everyMs >= 1) next.everyMs = Math.floor(everyMs);
	if (anchorMs !== void 0 && anchorMs >= 0) next.anchorMs = Math.floor(anchorMs);
	if (commandRaw) next.command = commandRaw;
	else if ("command" in next) delete next.command;
	if (cwdRaw) next.cwd = cwdRaw;
	else if ("cwd" in next) delete next.cwd;
	const staggerMs = require_stagger.normalizeCronStaggerMs(schedule.staggerMs);
	if (staggerMs !== void 0) next.staggerMs = staggerMs;
	else if ("staggerMs" in next) delete next.staggerMs;
	if (next.kind === "at") {
		delete next.everyMs;
		delete next.anchorMs;
		delete next.expr;
		delete next.tz;
		delete next.staggerMs;
	} else if (next.kind === "every") {
		delete next.at;
		delete next.expr;
		delete next.tz;
		delete next.staggerMs;
	} else if (next.kind === "cron") {
		delete next.at;
		delete next.everyMs;
		delete next.anchorMs;
		delete next.command;
		delete next.cwd;
	} else if (next.kind === "on-exit") {
		delete next.at;
		delete next.everyMs;
		delete next.anchorMs;
		delete next.expr;
		delete next.tz;
		delete next.staggerMs;
	}
	if (next.kind !== "on-exit") {
		delete next.command;
		delete next.cwd;
	}
	return next;
}
function coercePayload(payload) {
	const next = { ...payload };
	const kindRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(next.kind);
	if (kindRaw === "agentturn") next.kind = "agentTurn";
	else if (kindRaw === "systemevent") next.kind = "systemEvent";
	else if (kindRaw === "command") next.kind = "command";
	else if (kindRaw) next.kind = kindRaw;
	if (typeof next.message === "string") {
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.message) ?? "";
		if (trimmed) next.message = trimmed;
		else next.message = "";
	}
	if (typeof next.text === "string") {
		const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.text) ?? "";
		if (trimmed) next.text = trimmed;
		else next.text = "";
	}
	if ("model" in next) if (next.model === null) next.model = null;
	else {
		const model = require_persisted_shape.parseOptionalField(require_persisted_shape.TrimmedNonEmptyStringFieldSchema, next.model);
		if (model !== void 0) next.model = model;
		else delete next.model;
	}
	if ("thinking" in next) if (next.thinking === null) next.thinking = null;
	else {
		const thinking = require_persisted_shape.parseOptionalField(require_persisted_shape.TrimmedNonEmptyStringFieldSchema, next.thinking);
		if (thinking !== void 0) next.thinking = thinking;
		else delete next.thinking;
	}
	if ("timeoutSeconds" in next) {
		const timeoutSeconds = require_persisted_shape.parseOptionalField(require_persisted_shape.TimeoutSecondsFieldSchema, next.timeoutSeconds);
		if (timeoutSeconds !== void 0) next.timeoutSeconds = timeoutSeconds;
		else delete next.timeoutSeconds;
	}
	if ("fallbacks" in next) {
		const fallbacks = normalizeTrimmedStringArray(next.fallbacks, { allowNull: true });
		if (fallbacks !== void 0) next.fallbacks = fallbacks;
		else delete next.fallbacks;
	}
	if ("toolsAllow" in next) {
		const toolsAllow = normalizeTrimmedStringArray(next.toolsAllow, { allowNull: true });
		if (toolsAllow !== void 0) next.toolsAllow = toolsAllow;
		else delete next.toolsAllow;
	}
	if ("argv" in next) {
		const argv = normalizeCommandArgv(next.argv);
		if (Array.isArray(argv) && argv.length > 0) next.argv = argv;
		else delete next.argv;
	}
	if ("cwd" in next) {
		const cwd = require_persisted_shape.parseOptionalField(require_persisted_shape.TrimmedNonEmptyStringFieldSchema, next.cwd);
		if (cwd !== void 0) next.cwd = cwd;
		else delete next.cwd;
	}
	if ("env" in next) next.env = normalizeCommandEnv(next.env);
	if ("input" in next && typeof next.input !== "string") delete next.input;
	if ("noOutputTimeoutSeconds" in next) {
		const noOutputTimeoutSeconds = require_persisted_shape.parseOptionalField(require_persisted_shape.TimeoutSecondsFieldSchema, next.noOutputTimeoutSeconds);
		if (noOutputTimeoutSeconds !== void 0) next.noOutputTimeoutSeconds = noOutputTimeoutSeconds;
		else delete next.noOutputTimeoutSeconds;
	}
	if ("outputMaxBytes" in next) {
		const outputMaxBytes = require_persisted_shape.parseOptionalField(require_persisted_shape.TimeoutSecondsFieldSchema, next.outputMaxBytes);
		if (outputMaxBytes !== void 0 && outputMaxBytes > 0) next.outputMaxBytes = Math.floor(outputMaxBytes);
		else delete next.outputMaxBytes;
	}
	if ("allowUnsafeExternalContent" in next && typeof next.allowUnsafeExternalContent !== "boolean") delete next.allowUnsafeExternalContent;
	if (!("kind" in next) && typeof next.text === "string" && hasAgentTurnOnlyPayloadHint(next)) {
		next.kind = "agentTurn";
		next.message = next.text;
	}
	if (next.kind === "systemEvent") {
		delete next.message;
		delete next.model;
		delete next.fallbacks;
		delete next.thinking;
		delete next.timeoutSeconds;
		delete next.lightContext;
		delete next.allowUnsafeExternalContent;
		delete next.argv;
		delete next.cwd;
		delete next.env;
		delete next.input;
		delete next.noOutputTimeoutSeconds;
		delete next.outputMaxBytes;
	} else if (next.kind === "agentTurn") {
		delete next.text;
		delete next.argv;
		delete next.cwd;
		delete next.env;
		delete next.input;
		delete next.noOutputTimeoutSeconds;
		delete next.outputMaxBytes;
	} else if (next.kind === "command") {
		delete next.text;
		delete next.message;
		delete next.model;
		delete next.fallbacks;
		delete next.thinking;
		delete next.lightContext;
		delete next.allowUnsafeExternalContent;
	}
	return next;
}
function coerceTrigger(trigger) {
	const script = typeof trigger.script === "string" ? trigger.script.trim() : "";
	const once = (0, _gabrielvfonseca_normalization_core_boolean_coercion.parseBoolean)(trigger.once);
	return {
		script,
		...once !== void 0 ? { once } : {}
	};
}
function coerceDelivery(delivery) {
	const next = { ...delivery };
	const parsed = require_persisted_shape.parseDeliveryInput(delivery);
	if (parsed.mode !== void 0) next.mode = parsed.mode;
	else if ("mode" in next) delete next.mode;
	if ("channel" in delivery && delivery.channel === null) next.channel = null;
	else if (parsed.channel !== void 0) next.channel = parsed.channel;
	else if ("channel" in next) delete next.channel;
	if ("to" in delivery && delivery.to === null) next.to = null;
	else if (parsed.to !== void 0) next.to = parsed.to;
	else if ("to" in next) delete next.to;
	if ("threadId" in delivery && delivery.threadId === null) next.threadId = null;
	else if (parsed.threadId !== void 0) next.threadId = parsed.threadId;
	else if ("threadId" in next) delete next.threadId;
	if ("accountId" in delivery && delivery.accountId === null) next.accountId = null;
	else if (parsed.accountId !== void 0) next.accountId = parsed.accountId;
	else if ("accountId" in next) delete next.accountId;
	if ("failureDestination" in next) if (next.failureDestination === null) next.failureDestination = null;
	else if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.failureDestination)) next.failureDestination = coerceFailureDestination(next.failureDestination);
	else delete next.failureDestination;
	if ("completionDestination" in next) if (next.completionDestination === null) next.completionDestination = null;
	else {
		const completionDestination = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.completionDestination) ? coerceCompletionDestination(next.completionDestination) : null;
		if (completionDestination) next.completionDestination = completionDestination;
		else delete next.completionDestination;
	}
	return next;
}
function coerceCompletionDestination(value) {
	const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value.mode);
	const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.to);
	if (mode !== "webhook") return null;
	return {
		mode,
		...to ? { to } : {}
	};
}
function coerceFailureDestination(value) {
	const next = { ...value };
	if ("channel" in next) if (next.channel === null) next.channel = null;
	else if (next.channel === void 0) next.channel = void 0;
	else {
		const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(next.channel);
		if (channel) next.channel = channel;
		else delete next.channel;
	}
	if ("to" in next) if (next.to === null) next.to = null;
	else if (next.to === void 0) next.to = void 0;
	else {
		const to = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.to);
		if (to) next.to = to;
		else delete next.to;
	}
	if ("accountId" in next) if (next.accountId === null) next.accountId = null;
	else if (next.accountId === void 0) next.accountId = void 0;
	else {
		const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(next.accountId);
		if (accountId) next.accountId = accountId;
		else delete next.accountId;
	}
	if ("mode" in next) if (next.mode === null) next.mode = null;
	else if (next.mode === void 0) next.mode = void 0;
	else {
		const mode = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(next.mode);
		if (mode === "announce" || mode === "webhook") next.mode = mode;
		else delete next.mode;
	}
	return next;
}
function normalizeSessionTarget(raw) {
	if (typeof raw !== "string") return;
	const trimmed = raw.trim();
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	if (lower === "main" || lower === "isolated" || lower === "current") return lower;
	if (lower.startsWith("session:")) return `session:${require_session_target.assertSafeCronSessionTargetId(trimmed.slice(8))}`;
}
function normalizeWakeMode(raw) {
	if (typeof raw !== "string") return;
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (trimmed === "now" || trimmed === "next-heartbeat") return trimmed;
}
/** Normalizes raw cron job input without deciding whether create-time defaults apply. */
function normalizeCronJobInput(raw, options = DEFAULT_OPTIONS) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw)) return null;
	const base = raw;
	const next = { ...base };
	for (const field of ["declarationKey", "displayName"]) if (field in base && typeof base[field] === "string") {
		const trimmed = base[field].trim();
		if (trimmed) next[field] = trimmed;
		else delete next[field];
	}
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(base.owner)) {
		const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(base.owner.agentId);
		const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(base.owner.sessionKey);
		if (agentId || sessionKey) next.owner = {
			...agentId ? { agentId: require_session_key.sanitizeAgentId(agentId) } : {},
			...sessionKey ? { sessionKey } : {}
		};
		else delete next.owner;
	}
	if ("agentId" in base) {
		const agentId = base.agentId;
		if (agentId === null) next.agentId = null;
		else if (typeof agentId === "string") {
			const trimmed = agentId.trim();
			if (trimmed) next.agentId = require_session_key.sanitizeAgentId(trimmed);
			else delete next.agentId;
		}
	}
	if ("sessionKey" in base) {
		const sessionKey = base.sessionKey;
		if (sessionKey === null) next.sessionKey = null;
		else if (typeof sessionKey === "string") {
			const trimmed = sessionKey.trim();
			if (trimmed) next.sessionKey = trimmed;
			else delete next.sessionKey;
		}
	}
	if ("enabled" in base) {
		const enabled = (0, _gabrielvfonseca_normalization_core_boolean_coercion.parseBoolean)(base.enabled);
		if (enabled !== void 0) next.enabled = enabled;
	}
	if ("sessionTarget" in base) {
		const normalized = normalizeSessionTarget(base.sessionTarget);
		if (normalized) next.sessionTarget = normalized;
		else delete next.sessionTarget;
	}
	if ("wakeMode" in base) {
		const normalized = normalizeWakeMode(base.wakeMode);
		if (normalized) next.wakeMode = normalized;
		else delete next.wakeMode;
	}
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(base.schedule)) next.schedule = coerceSchedule(base.schedule);
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(base.payload)) next.payload = coercePayload(base.payload);
	if ("trigger" in base) if (base.trigger === null) next.trigger = null;
	else if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(base.trigger)) next.trigger = coerceTrigger(base.trigger);
	else delete next.trigger;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(base.delivery)) next.delivery = coerceDelivery(base.delivery);
	if (options.applyDefaults) {
		if (!next.wakeMode) next.wakeMode = "now";
		if (typeof next.enabled !== "boolean") next.enabled = true;
		if ((typeof next.name !== "string" || !next.name.trim()) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.schedule) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.payload)) next.name = require_stagger.inferCronJobName({
			schedule: next.schedule,
			payload: next.payload
		});
		else if (typeof next.name === "string") {
			const trimmed = next.name.trim();
			if (trimmed) next.name = trimmed;
		}
		if (!next.sessionTarget && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.payload)) {
			const kind = typeof next.payload.kind === "string" ? next.payload.kind : "";
			if (kind === "systemEvent") next.sessionTarget = "main";
			else if (kind === "agentTurn" || kind === "command") next.sessionTarget = "isolated";
		}
		const normalizedSessionTarget = typeof next.sessionTarget === "string" ? next.sessionTarget : void 0;
		const resolvedCurrentSessionKey = options.sessionContext?.sessionKey ?? (typeof next.sessionKey === "string" ? next.sessionKey : void 0);
		const resolvedSessionTarget = require_session_target.resolveCronCurrentSessionTarget({
			sessionTarget: normalizedSessionTarget,
			sessionKey: resolvedCurrentSessionKey
		});
		if (resolvedSessionTarget !== void 0) {
			next.sessionTarget = resolvedSessionTarget;
			if (next.sessionTarget !== "isolated" && normalizedSessionTarget === "current" && resolvedCurrentSessionKey?.trim()) next.sessionKey = require_session_target.assertSafeCronSessionTargetId(resolvedCurrentSessionKey);
		} else delete next.sessionTarget;
		if ("schedule" in next && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.schedule) && next.schedule.kind === "at" && !("deleteAfterRun" in next)) next.deleteAfterRun = true;
		if ("schedule" in next && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.schedule) && next.schedule.kind === "cron") {
			const schedule = next.schedule;
			const explicit = require_stagger.normalizeCronStaggerMs(schedule.staggerMs);
			if (explicit !== void 0) schedule.staggerMs = explicit;
			else {
				const defaultStaggerMs = require_stagger.resolveDefaultCronStaggerMs(typeof schedule.expr === "string" ? schedule.expr : "");
				if (defaultStaggerMs !== void 0) schedule.staggerMs = defaultStaggerMs;
			}
		}
		const payload = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(next.payload) ? next.payload : null;
		const payloadKind = payload && typeof payload.kind === "string" ? payload.kind : "";
		const sessionTarget = typeof next.sessionTarget === "string" ? next.sessionTarget : "";
		const isDetachedDeliveryJob = sessionTarget === "isolated" || sessionTarget === "current" || sessionTarget.startsWith("session:") || sessionTarget === "" && (payloadKind === "agentTurn" || payloadKind === "command");
		if (!("delivery" in next && next.delivery !== void 0) && isDetachedDeliveryJob && (payloadKind === "agentTurn" || payloadKind === "command")) next.delivery = { mode: "announce" };
	}
	return next;
}
/** Normalizes a raw cron create request and applies create-time defaults. */
function normalizeCronJobCreate(raw, options) {
	return normalizeCronJobInput(raw, {
		applyDefaults: true,
		...options
	});
}
/** Normalizes a raw cron patch request without filling omitted fields. */
function normalizeCronJobPatch(raw, options) {
	return normalizeCronJobInput(raw, {
		applyDefaults: false,
		...options
	});
}
//#endregion
//#region src/cron/schedule-identity.ts
/** Builds stable identities for cron scheduling inputs. */
function readString(record, key) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(record[key]);
}
function readNumber(record, key) {
	return require_stagger.coerceFiniteScheduleNumber(record[key]);
}
function readStaggerMs(record) {
	return require_stagger.normalizeCronStaggerMs(record.staggerMs);
}
function schedulePayloadFromRecord(schedule) {
	const rawKind = readString(schedule, "kind")?.toLowerCase();
	const expr = readString(schedule, "expr");
	const at = readString(schedule, "at");
	const everyMs = readNumber(schedule, "everyMs");
	const anchorMs = readNumber(schedule, "anchorMs");
	const tz = readString(schedule, "tz");
	const staggerMs = readStaggerMs(schedule);
	const kind = rawKind === "at" || rawKind === "every" || rawKind === "cron" ? rawKind : at ? "at" : everyMs !== void 0 ? "every" : expr ? "cron" : void 0;
	if (kind === "at") return at ? {
		kind: "at",
		at
	} : void 0;
	if (kind === "every" && everyMs !== void 0) return {
		kind: "every",
		everyMs,
		anchorMs
	};
	if (kind === "cron" && expr) return {
		kind: "cron",
		expr,
		tz,
		staggerMs
	};
}
function resolveSchedulePayload(job) {
	if (job.schedule && typeof job.schedule === "object" && !Array.isArray(job.schedule)) return schedulePayloadFromRecord(job.schedule);
}
/** Builds a stable scheduling identity for deciding whether stored timer state is still valid. */
function tryCronScheduleIdentity(job) {
	const schedule = resolveSchedulePayload(job);
	if (!schedule) return;
	return JSON.stringify({
		version: 1,
		enabled: typeof job.enabled === "boolean" ? job.enabled : true,
		schedule
	});
}
/** Compares two cron jobs by the normalized inputs that affect next-run computation. */
function cronSchedulingInputsEqual(previous, next) {
	const previousIdentity = tryCronScheduleIdentity(previous);
	const nextIdentity = tryCronScheduleIdentity(next);
	return previousIdentity !== void 0 && nextIdentity !== void 0 && previousIdentity === nextIdentity;
}
//#endregion
//#region src/cron/store/scalar-codec.ts
/** Parses a JSON object column, returning the fallback for malformed or non-object values. */
function parseJsonObject(raw, fallback) {
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : fallback;
	} catch {
		return fallback;
	}
}
/** Parses a JSON column without shape validation, returning the fallback only on parse failure. */
function parseJsonValue(raw, fallback) {
	try {
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
/** Converts optional booleans into nullable SQLite integer flags. */
function booleanToInteger(value) {
	return typeof value === "boolean" ? value ? 1 : 0 : null;
}
/** Converts SQLite integer flags into booleans while preserving missing columns as undefined. */
function integerToBoolean(value) {
	const normalized = require_state_migrations_cron_run_logs.normalizeSqliteNumber(value);
	return normalized == null ? void 0 : normalized !== 0;
}
/** Serializes optional structured values for JSON columns. */
function serializeJson(value) {
	return value == null ? null : JSON.stringify(value);
}
/** Parses a JSON string-array column and drops non-string entries from legacy data. */
function parseJsonArray(raw) {
	if (!raw) return;
	const parsed = parseJsonObject(raw, void 0);
	return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : void 0;
}
//#endregion
//#region src/cron/store/delivery-codec.ts
/** Maps cron delivery config into normalized SQLite columns. */
function bindDeliveryColumns(delivery) {
	const failureDestination = delivery?.failureDestination;
	return {
		delivery_mode: delivery?.mode ?? null,
		delivery_channel: delivery?.channel ?? null,
		delivery_to: delivery?.to ?? null,
		delivery_thread_id: delivery?.threadId === void 0 || delivery.threadId === null ? null : String(delivery.threadId),
		delivery_thread_id_type: delivery?.threadId === void 0 || delivery.threadId === null ? null : typeof delivery.threadId,
		delivery_account_id: delivery?.accountId ?? null,
		delivery_best_effort: booleanToInteger(delivery?.bestEffort),
		delivery_completion_mode: delivery?.completionDestination?.mode ?? null,
		delivery_completion_to: delivery?.completionDestination?.to ?? null,
		failure_delivery_mode: bindFailureDestinationField(failureDestination, "mode"),
		failure_delivery_channel: bindFailureDestinationField(failureDestination, "channel"),
		failure_delivery_to: bindFailureDestinationField(failureDestination, "to"),
		failure_delivery_account_id: bindFailureDestinationField(failureDestination, "accountId")
	};
}
function bindFailureDestinationField(failureDestination, key) {
	if (!failureDestination || !Object.hasOwn(failureDestination, key)) return null;
	return failureDestination[key] ?? "";
}
function readFailureDestinationField(value) {
	return value === "" || value == null ? void 0 : value;
}
function cronDeliveryModeFromValue(value) {
	return value === "none" || value === "announce" || value === "webhook" ? value : void 0;
}
function threadIdFromRow(row) {
	const value = row.delivery_thread_id;
	if (!value) return;
	if (row.delivery_thread_id_type === "number") {
		const numeric = Number(value);
		return Number.isFinite(numeric) ? numeric : value;
	}
	return value;
}
/** Reconstructs delivery config from split SQLite columns, preserving legacy partial rows. */
function deliveryFromRow(row) {
	const rowMode = cronDeliveryModeFromValue(row.delivery_mode);
	const threadId = threadIdFromRow(row);
	const hasDeliveryColumns = Boolean(row.delivery_channel || row.delivery_to || threadId !== void 0 || row.delivery_account_id || row.delivery_completion_mode || row.delivery_completion_to || row.failure_delivery_channel != null || row.failure_delivery_to != null || row.failure_delivery_mode != null || row.failure_delivery_account_id != null) || row.delivery_best_effort != null;
	const completionDestination = rowMode === "announce" && row.delivery_completion_mode === "webhook" ? {
		mode: "webhook",
		...row.delivery_completion_to ? { to: row.delivery_completion_to } : {}
	} : void 0;
	const failureDestination = row.failure_delivery_channel != null || row.failure_delivery_to != null || row.failure_delivery_mode != null || row.failure_delivery_account_id != null ? {
		...row.failure_delivery_channel != null ? { channel: readFailureDestinationField(row.failure_delivery_channel) } : {},
		...row.failure_delivery_to != null ? { to: readFailureDestinationField(row.failure_delivery_to) } : {},
		...row.failure_delivery_mode != null ? { mode: readFailureDestinationField(row.failure_delivery_mode) } : {},
		...row.failure_delivery_account_id != null ? { accountId: readFailureDestinationField(row.failure_delivery_account_id) } : {}
	} : void 0;
	if (!rowMode && !hasDeliveryColumns) return;
	return {
		mode: rowMode ?? "announce",
		...row.delivery_channel ? { channel: row.delivery_channel } : {},
		...row.delivery_to ? { to: row.delivery_to } : {},
		...threadId !== void 0 ? { threadId } : {},
		...row.delivery_account_id ? { accountId: row.delivery_account_id } : {},
		...row.delivery_best_effort != null ? { bestEffort: integerToBoolean(row.delivery_best_effort) } : {},
		...completionDestination ? { completionDestination } : {},
		...failureDestination ? { failureDestination } : {}
	};
}
//#endregion
//#region src/cron/store/failure-alert-codec.ts
/** Maps cron failure-alert config into normalized SQLite columns. */
function bindFailureAlertColumns(failureAlert) {
	if (failureAlert === false) return {
		failure_alert_disabled: 1,
		failure_alert_after: null,
		failure_alert_channel: null,
		failure_alert_to: null,
		failure_alert_cooldown_ms: null,
		failure_alert_include_skipped: null,
		failure_alert_mode: null,
		failure_alert_account_id: null
	};
	return {
		failure_alert_disabled: failureAlert ? 0 : null,
		failure_alert_after: failureAlert?.after ?? null,
		failure_alert_channel: failureAlert?.channel ?? null,
		failure_alert_to: failureAlert?.to ?? null,
		failure_alert_cooldown_ms: failureAlert?.cooldownMs ?? null,
		failure_alert_include_skipped: booleanToInteger(failureAlert?.includeSkipped),
		failure_alert_mode: failureAlert?.mode ?? null,
		failure_alert_account_id: failureAlert?.accountId ?? null
	};
}
/** Reconstructs failure-alert config, distinguishing disabled from omitted config. */
function failureAlertFromRow(row) {
	if (row.failure_alert_disabled === 1) return false;
	const failureAlertExplicitlyEnabled = row.failure_alert_disabled === 0;
	if (row.failure_alert_after == null && !row.failure_alert_channel && !row.failure_alert_to && row.failure_alert_cooldown_ms == null && row.failure_alert_include_skipped == null && !row.failure_alert_mode && !row.failure_alert_account_id && !failureAlertExplicitlyEnabled) return;
	return {
		...row.failure_alert_after != null ? { after: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.failure_alert_after) } : {},
		...row.failure_alert_channel ? { channel: row.failure_alert_channel } : {},
		...row.failure_alert_to ? { to: row.failure_alert_to } : {},
		...row.failure_alert_cooldown_ms != null ? { cooldownMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.failure_alert_cooldown_ms) } : {},
		...row.failure_alert_include_skipped != null ? { includeSkipped: integerToBoolean(row.failure_alert_include_skipped) } : {},
		...row.failure_alert_mode ? { mode: row.failure_alert_mode } : {},
		...row.failure_alert_account_id ? { accountId: row.failure_alert_account_id } : {}
	};
}
//#endregion
//#region src/cron/store/payload-codec.ts
function bindPayloadToolAllowColumns(payload) {
	return {
		payload_tools_allow_json: serializeJson(payload.toolsAllow),
		payload_tools_allow_is_default: payload.toolsAllow ? booleanToInteger(payload.toolsAllowIsDefault) : null
	};
}
function payloadToolAllowFromRow(row) {
	const toolsAllow = parseJsonArray(row.payload_tools_allow_json);
	if (!toolsAllow) return {};
	return {
		toolsAllow,
		...integerToBoolean(row.payload_tools_allow_is_default) ? { toolsAllowIsDefault: true } : {}
	};
}
function parseExternalContentSource(raw) {
	const parsed = raw ? parseJsonValue(raw, void 0) : void 0;
	return parsed === "gmail" || parsed === "webhook" ? parsed : void 0;
}
function parseCommandPayloadMessage(raw) {
	const parsed = raw ? parseJsonValue(raw, void 0) : void 0;
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
	const record = parsed;
	if (!Array.isArray(record.argv) || record.argv.length === 0 || record.argv.some((value) => typeof value !== "string" || value.length === 0)) return null;
	const argv = record.argv.map((value) => String(value));
	const env = record.env && typeof record.env === "object" && !Array.isArray(record.env) ? Object.fromEntries(Object.entries(record.env).filter((entry) => typeof entry[1] === "string")) : void 0;
	const rawNoOutputTimeoutSeconds = typeof record.noOutputTimeoutSeconds === "number" || typeof record.noOutputTimeoutSeconds === "bigint" ? record.noOutputTimeoutSeconds : null;
	const rawOutputMaxBytes = typeof record.outputMaxBytes === "number" || typeof record.outputMaxBytes === "bigint" ? record.outputMaxBytes : null;
	const noOutputTimeoutSeconds = require_state_migrations_cron_run_logs.normalizeSqliteNumber(rawNoOutputTimeoutSeconds);
	const outputMaxBytes = require_state_migrations_cron_run_logs.normalizeSqliteNumber(rawOutputMaxBytes);
	return {
		argv,
		...typeof record.cwd === "string" && record.cwd.trim() ? { cwd: record.cwd } : {},
		...env && Object.keys(env).length > 0 ? { env } : {},
		...typeof record.input === "string" ? { input: record.input } : {},
		...noOutputTimeoutSeconds != null ? { noOutputTimeoutSeconds } : {},
		...outputMaxBytes != null && outputMaxBytes > 0 ? { outputMaxBytes } : {}
	};
}
/** Maps cron payload variants into normalized SQLite columns. */
function bindPayloadColumns(payload) {
	if (payload.kind === "systemEvent") return {
		payload_kind: "systemEvent",
		payload_message: payload.text,
		payload_model: null,
		payload_fallbacks_json: null,
		payload_thinking: null,
		payload_timeout_seconds: null,
		payload_allow_unsafe_external_content: null,
		payload_external_content_source_json: null,
		payload_light_context: null,
		...bindPayloadToolAllowColumns(payload)
	};
	if (payload.kind === "command") {
		const { timeoutSeconds: _timeoutSeconds, toolsAllow: _toolsAllow, toolsAllowIsDefault: _toolsAllowIsDefault, ...payloadMessage } = payload;
		return {
			payload_kind: "command",
			payload_message: serializeJson(payloadMessage),
			payload_model: null,
			payload_fallbacks_json: null,
			payload_thinking: null,
			payload_timeout_seconds: payload.timeoutSeconds ?? null,
			payload_allow_unsafe_external_content: null,
			payload_external_content_source_json: null,
			payload_light_context: null,
			...bindPayloadToolAllowColumns(payload)
		};
	}
	return {
		payload_kind: "agentTurn",
		payload_message: payload.message,
		payload_model: payload.model ?? null,
		payload_fallbacks_json: serializeJson(payload.fallbacks),
		payload_thinking: payload.thinking ?? null,
		payload_timeout_seconds: payload.timeoutSeconds ?? null,
		payload_allow_unsafe_external_content: booleanToInteger(payload.allowUnsafeExternalContent),
		payload_external_content_source_json: serializeJson(payload.externalContentSource),
		payload_light_context: booleanToInteger(payload.lightContext),
		...bindPayloadToolAllowColumns(payload)
	};
}
/** Reconstructs cron payload variants from SQLite columns, returning null for invalid rows. */
function payloadFromRow(row) {
	if (row.payload_kind === "systemEvent") {
		if (row.payload_message == null) return null;
		return {
			kind: "systemEvent",
			text: row.payload_message,
			...payloadToolAllowFromRow(row)
		};
	}
	if (row.payload_kind === "agentTurn") {
		if (row.payload_message == null) return null;
		const fallbacks = row.payload_fallbacks_json ? parseJsonArray(row.payload_fallbacks_json) : void 0;
		const timeoutSeconds = require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.payload_timeout_seconds);
		const allowUnsafeExternalContent = row.payload_allow_unsafe_external_content != null ? integerToBoolean(row.payload_allow_unsafe_external_content) : void 0;
		const externalContentSource = parseExternalContentSource(row.payload_external_content_source_json);
		const lightContext = row.payload_light_context != null ? integerToBoolean(row.payload_light_context) : void 0;
		return {
			kind: "agentTurn",
			message: row.payload_message,
			...row.payload_model ? { model: row.payload_model } : {},
			...fallbacks ? { fallbacks } : {},
			...row.payload_thinking ? { thinking: row.payload_thinking } : {},
			...timeoutSeconds != null ? { timeoutSeconds } : {},
			...allowUnsafeExternalContent != null ? { allowUnsafeExternalContent } : {},
			...externalContentSource ? { externalContentSource } : {},
			...lightContext != null ? { lightContext } : {},
			...payloadToolAllowFromRow(row)
		};
	}
	if (row.payload_kind === "command") {
		const command = parseCommandPayloadMessage(row.payload_message);
		if (!command) return null;
		const timeoutSeconds = require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.payload_timeout_seconds);
		return {
			kind: "command",
			...command,
			...timeoutSeconds != null ? { timeoutSeconds } : {},
			...payloadToolAllowFromRow(row)
		};
	}
	return null;
}
//#endregion
//#region src/cron/store/schema.ts
/** Creates the Kysely facade scoped to cron_jobs for synchronous SQLite access. */
function getCronStoreKysely(db) {
	return require_state_migrations_cron_run_logs.getNodeSqliteKysely(db);
}
//#endregion
//#region src/cron/store/state-codec.ts
/** Maps mutable cron runtime state into normalized SQLite columns. */
function bindStateColumns(state) {
	return {
		next_run_at_ms: state.nextRunAtMs ?? null,
		running_at_ms: state.runningAtMs ?? null,
		last_run_at_ms: state.lastRunAtMs ?? null,
		last_run_status: state.lastRunStatus ?? state.lastStatus ?? null,
		last_error: state.lastError ?? null,
		last_duration_ms: state.lastDurationMs ?? null,
		consecutive_errors: state.consecutiveErrors ?? null,
		consecutive_skipped: state.consecutiveSkipped ?? null,
		schedule_error_count: state.scheduleErrorCount ?? null,
		last_delivery_status: state.lastDeliveryStatus ?? null,
		last_delivery_error: state.lastDeliveryError ?? null,
		last_delivered: booleanToInteger(state.lastDelivered),
		last_failure_alert_at_ms: state.lastFailureAlertAtMs ?? null
	};
}
/** Reconstructs cron runtime state from JSON plus split indexed columns. */
function stateFromRow(row) {
	return {
		...parseJsonObject(row.state_json, {}),
		...row.next_run_at_ms != null ? { nextRunAtMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.next_run_at_ms) } : {},
		...row.running_at_ms != null ? { runningAtMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.running_at_ms) } : {},
		...row.last_run_at_ms != null ? { lastRunAtMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.last_run_at_ms) } : {},
		...row.last_run_status ? { lastRunStatus: row.last_run_status } : {},
		...row.last_error ? { lastError: row.last_error } : {},
		...row.last_duration_ms != null ? { lastDurationMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.last_duration_ms) } : {},
		...row.consecutive_errors != null ? { consecutiveErrors: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.consecutive_errors) } : {},
		...row.consecutive_skipped != null ? { consecutiveSkipped: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.consecutive_skipped) } : {},
		...row.schedule_error_count != null ? { scheduleErrorCount: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.schedule_error_count) } : {},
		...row.last_delivery_status ? { lastDeliveryStatus: row.last_delivery_status } : {},
		...row.last_delivery_error ? { lastDeliveryError: row.last_delivery_error } : {},
		...row.last_delivered != null ? { lastDelivered: integerToBoolean(row.last_delivered) } : {},
		...row.last_failure_alert_at_ms != null ? { lastFailureAlertAtMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.last_failure_alert_at_ms) } : {}
	};
}
//#endregion
//#region src/cron/store/trigger-codec.ts
/** Maps cron trigger config into normalized SQLite columns. */
function bindTriggerColumns(trigger) {
	return {
		trigger_script: trigger?.script ?? null,
		trigger_once: booleanToInteger(trigger?.once)
	};
}
/** Reconstructs trigger config from normalized SQLite columns. */
function triggerFromRow(row) {
	if (!row.trigger_script) return;
	return {
		script: row.trigger_script,
		...row.trigger_once != null ? { once: integerToBoolean(row.trigger_once) } : {}
	};
}
//#endregion
//#region src/cron/store/row-codec.ts
function bindScheduleColumns(schedule) {
	if (schedule.kind === "at") return {
		schedule_kind: "at",
		at: schedule.at,
		every_ms: null,
		anchor_ms: null,
		schedule_expr: null,
		schedule_tz: null,
		stagger_ms: null
	};
	if (schedule.kind === "every") return {
		schedule_kind: "every",
		at: null,
		every_ms: schedule.everyMs,
		anchor_ms: schedule.anchorMs ?? null,
		schedule_expr: null,
		schedule_tz: null,
		stagger_ms: null
	};
	if (schedule.kind === "on-exit") return {
		schedule_kind: "on-exit",
		at: null,
		every_ms: null,
		anchor_ms: null,
		schedule_expr: schedule.command,
		schedule_tz: schedule.cwd ?? null,
		stagger_ms: null
	};
	return {
		schedule_kind: "cron",
		at: null,
		every_ms: null,
		anchor_ms: null,
		schedule_expr: schedule.expr,
		schedule_tz: schedule.tz ?? null,
		stagger_ms: schedule.staggerMs ?? null
	};
}
function stripJobRuntimeFields(job) {
	const { state: _state, updatedAtMs: _updatedAtMs, ...rest } = job;
	return {
		...rest,
		state: {}
	};
}
function mergeFailureDestinationProjection(configJob, projectedJob) {
	const failureDestination = projectedJob?.delivery?.failureDestination;
	if (!failureDestination) return configJob;
	const delivery = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(configJob.delivery) && !Array.isArray(configJob.delivery) ? { ...configJob.delivery } : projectedJob?.delivery ? {
		mode: projectedJob.delivery.mode,
		...projectedJob.delivery.channel ? { channel: projectedJob.delivery.channel } : {},
		...projectedJob.delivery.to ? { to: projectedJob.delivery.to } : {},
		...projectedJob.delivery.threadId !== void 0 ? { threadId: projectedJob.delivery.threadId } : {},
		...projectedJob.delivery.accountId ? { accountId: projectedJob.delivery.accountId } : {},
		...projectedJob.delivery.bestEffort !== void 0 ? { bestEffort: projectedJob.delivery.bestEffort } : {},
		...projectedJob.delivery.completionDestination ? { completionDestination: projectedJob.delivery.completionDestination } : {}
	} : {};
	const nextFailureDestination = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(delivery.failureDestination) ? { ...delivery.failureDestination } : {};
	if (Object.hasOwn(failureDestination, "channel")) nextFailureDestination.channel = failureDestination.channel;
	if (Object.hasOwn(failureDestination, "to")) nextFailureDestination.to = failureDestination.to;
	if (Object.hasOwn(failureDestination, "accountId")) nextFailureDestination.accountId = failureDestination.accountId;
	if (Object.hasOwn(failureDestination, "mode")) nextFailureDestination.mode = failureDestination.mode;
	delivery.failureDestination = nextFailureDestination;
	return {
		...configJob,
		delivery
	};
}
function bindCronJobRow(storeKey, job, sortOrder) {
	return {
		store_key: storeKey,
		job_id: job.id,
		declaration_key: job.declarationKey ?? null,
		display_name: job.displayName ?? null,
		owner_agent_id: job.owner?.agentId ?? null,
		owner_session_key: job.owner?.sessionKey ?? null,
		name: job.name,
		description: job.description ?? null,
		enabled: job.enabled ? 1 : 0,
		delete_after_run: booleanToInteger(job.deleteAfterRun),
		created_at_ms: job.createdAtMs,
		updated_at: job.updatedAtMs,
		agent_id: job.agentId ?? null,
		session_key: job.sessionKey ?? null,
		session_target: job.sessionTarget,
		wake_mode: job.wakeMode,
		...bindTriggerColumns(job.trigger),
		...bindScheduleColumns(job.schedule),
		...bindPayloadColumns(job.payload),
		...bindDeliveryColumns(job.delivery),
		...bindFailureAlertColumns(job.failureAlert),
		...bindStateColumns(job.state ?? {}),
		job_json: JSON.stringify(stripJobRuntimeFields(job)),
		state_json: JSON.stringify(job.state ?? {}),
		runtime_updated_at_ms: job.updatedAtMs,
		schedule_identity: tryCronScheduleIdentity(job) ?? null,
		sort_order: sortOrder
	};
}
function normalizeCronJobForSqlite(job) {
	const raw = structuredClone(job);
	const hadDeleteAfterRun = Object.hasOwn(raw, "deleteAfterRun");
	normalizeCronJobIdentityFields(raw);
	const normalized = normalizeCronJobInput(raw, { applyDefaults: true });
	if (!normalized || require_persisted_shape.getInvalidPersistedCronJobReason(normalized)) return null;
	if (!hadDeleteAfterRun) delete normalized.deleteAfterRun;
	const createdAtMs = typeof normalized.createdAtMs === "number" && Number.isFinite(normalized.createdAtMs) ? normalized.createdAtMs : Date.now();
	const updatedAtMs = typeof normalized.updatedAtMs === "number" && Number.isFinite(normalized.updatedAtMs) ? normalized.updatedAtMs : createdAtMs;
	return {
		...normalized,
		createdAtMs,
		updatedAtMs,
		state: (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(normalized.state) ? normalized.state : {}
	};
}
function countUnpersistableCronJobs(store) {
	return store.jobs.reduce((count, job) => count + (normalizeCronJobForSqlite(job) ? 0 : 1), 0);
}
/** Fails before replacing SQLite rows when any config job cannot round-trip. */
function assertCronStoreCanPersist(store) {
	const invalidJobs = countUnpersistableCronJobs(store);
	if (invalidJobs > 0) throw new Error(`Cannot persist cron store with ${invalidJobs} invalid job(s)`);
}
function scheduleFromRow(row) {
	if (row.schedule_kind === "at" && row.at) return {
		kind: "at",
		at: row.at
	};
	if (row.schedule_kind === "every" && row.every_ms != null) return {
		kind: "every",
		everyMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.every_ms) ?? 0,
		...row.anchor_ms != null ? { anchorMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.anchor_ms) } : {}
	};
	if (row.schedule_kind === "cron" && row.schedule_expr) return {
		kind: "cron",
		expr: row.schedule_expr,
		...row.schedule_tz ? { tz: row.schedule_tz } : {},
		...row.stagger_ms != null ? { staggerMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.stagger_ms) } : {}
	};
	if (row.schedule_kind === "on-exit" && row.schedule_expr) return {
		kind: "on-exit",
		command: row.schedule_expr,
		...row.schedule_tz ? { cwd: row.schedule_tz } : {}
	};
	return null;
}
function rowToCronJob(row) {
	const schedule = scheduleFromRow(row);
	const payload = payloadFromRow(row);
	const delivery = deliveryFromRow(row);
	const failureAlert = failureAlertFromRow(row);
	const trigger = triggerFromRow(row);
	if (!schedule || !payload) return null;
	const createdAtMs = require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.created_at_ms) ?? Date.now();
	return {
		id: row.job_id,
		...row.declaration_key ? { declarationKey: row.declaration_key } : {},
		...row.display_name ? { displayName: row.display_name } : {},
		...row.owner_agent_id || row.owner_session_key ? { owner: {
			...row.owner_agent_id ? { agentId: row.owner_agent_id } : {},
			...row.owner_session_key ? { sessionKey: row.owner_session_key } : {}
		} } : {},
		name: row.name,
		...row.description ? { description: row.description } : {},
		enabled: row.enabled !== 0,
		...row.delete_after_run != null ? { deleteAfterRun: integerToBoolean(row.delete_after_run) } : {},
		createdAtMs,
		updatedAtMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.runtime_updated_at_ms) ?? require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.updated_at) ?? createdAtMs,
		...row.agent_id ? { agentId: row.agent_id } : {},
		...row.session_key ? { sessionKey: row.session_key } : {},
		schedule,
		sessionTarget: row.session_target,
		wakeMode: row.wake_mode,
		...trigger ? { trigger } : {},
		payload,
		...delivery ? { delivery } : {},
		...failureAlert !== void 0 ? { failureAlert } : {},
		state: stateFromRow(row)
	};
}
/** Projects a live job through the same normalization/codecs used by SQLite persistence. */
function projectCronJobThroughStorageCodec(job) {
	const normalized = normalizeCronJobForSqlite(job);
	if (!normalized) throw new Error(`cannot project invalid cron job ${job.id}`);
	const projected = rowToCronJob(bindCronJobRow("config-revision", normalized, 0));
	if (!projected) throw new Error(`cannot project cron job ${job.id} through storage codecs`);
	return projected;
}
/** Loads cron rows in config order with deterministic fallbacks for old rows. */
function loadCronRows(db, storeKey) {
	return require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getCronStoreKysely(db).selectFrom("cron_jobs").selectAll().where("store_key", "=", storeKey).orderBy("sort_order", "asc").orderBy("updated_at", "asc").orderBy("job_id", "asc")).rows;
}
/** Replaces all persisted cron rows for one store key from the config store snapshot. */
function replaceCronRows(db, storeKey, store) {
	require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getCronStoreKysely(db).deleteFrom("cron_jobs").where("store_key", "=", storeKey));
	for (const [index, job] of store.jobs.entries()) {
		const normalized = normalizeCronJobForSqlite(job);
		if (!normalized) continue;
		require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getCronStoreKysely(db).insertInto("cron_jobs").values(bindCronJobRow(storeKey, normalized, index)));
	}
}
/** Updates only mutable runtime columns without rewriting full job config JSON. */
function updateCronRuntimeRows(db, storeKey, store) {
	for (const job of store.jobs) require_state_migrations_cron_run_logs.executeSqliteQuerySync(db, getCronStoreKysely(db).updateTable("cron_jobs").set({
		...bindStateColumns(job.state ?? {}),
		state_json: JSON.stringify(job.state ?? {}),
		runtime_updated_at_ms: job.updatedAtMs,
		schedule_identity: tryCronScheduleIdentity(job)
	}).where("store_key", "=", storeKey).where("job_id", "=", job.id));
}
/** Reconstructs loaded cron store data and config-runtime sidecars from SQLite rows. */
function loadedCronStoreFromRows(rows) {
	const parsedJobs = rows.map(rowToCronJob);
	const jobs = parsedJobs.filter((job) => job !== null);
	const configJobs = rows.map((row, index) => mergeFailureDestinationProjection(parseJsonObject(row.job_json, stripJobRuntimeFields(parsedJobs[index] ?? {})), parsedJobs[index] ?? null));
	const configJobRuntimeEntries = rows.map((row) => ({
		updatedAtMs: require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.runtime_updated_at_ms) ?? require_state_migrations_cron_run_logs.normalizeSqliteNumber(row.updated_at),
		scheduleIdentity: row.schedule_identity ?? void 0,
		state: stateFromRow(row)
	}));
	return {
		store: {
			version: 1,
			jobs
		},
		configJobs,
		configJobIndexes: rows.map((_row, index) => index),
		configJobRuntimeEntries,
		invalidConfigRows: []
	};
}
//#endregion
Object.defineProperty(exports, "assertCronStoreCanPersist", {
	enumerable: true,
	get: function() {
		return assertCronStoreCanPersist;
	}
});
Object.defineProperty(exports, "cronSchedulingInputsEqual", {
	enumerable: true,
	get: function() {
		return cronSchedulingInputsEqual;
	}
});
Object.defineProperty(exports, "cronStoreKey", {
	enumerable: true,
	get: function() {
		return cronStoreKey;
	}
});
Object.defineProperty(exports, "loadCronRows", {
	enumerable: true,
	get: function() {
		return loadCronRows;
	}
});
Object.defineProperty(exports, "loadedCronStoreFromRows", {
	enumerable: true,
	get: function() {
		return loadedCronStoreFromRows;
	}
});
Object.defineProperty(exports, "normalizeCronJobCreate", {
	enumerable: true,
	get: function() {
		return normalizeCronJobCreate;
	}
});
Object.defineProperty(exports, "normalizeCronJobIdentityFields", {
	enumerable: true,
	get: function() {
		return normalizeCronJobIdentityFields;
	}
});
Object.defineProperty(exports, "normalizeCronJobInput", {
	enumerable: true,
	get: function() {
		return normalizeCronJobInput;
	}
});
Object.defineProperty(exports, "normalizeCronJobPatch", {
	enumerable: true,
	get: function() {
		return normalizeCronJobPatch;
	}
});
Object.defineProperty(exports, "projectCronJobThroughStorageCodec", {
	enumerable: true,
	get: function() {
		return projectCronJobThroughStorageCodec;
	}
});
Object.defineProperty(exports, "replaceCronRows", {
	enumerable: true,
	get: function() {
		return replaceCronRows;
	}
});
Object.defineProperty(exports, "updateCronRuntimeRows", {
	enumerable: true,
	get: function() {
		return updateCronRuntimeRows;
	}
});
