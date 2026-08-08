const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_prototype_keys = require("./prototype-keys-ByIIRoKv.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_tmp_operator_dir = require("./tmp-operator-dir-Gb2Hpfuq.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _openclaw_fs_safe_advanced = require("@openclaw/fs-safe/advanced");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let tslog = require("tslog");
//#region src/global-state.ts
let globalVerbose = false;
let globalYes = false;
function isVerbose() {
	return globalVerbose;
}
function isYes() {
	return globalYes;
}
//#endregion
//#region src/logging/levels.ts
const ALLOWED_LOG_LEVELS = [
	"silent",
	"fatal",
	"error",
	"warn",
	"info",
	"debug",
	"trace"
];
function tryParseLogLevel(level) {
	if (typeof level !== "string") return;
	const candidate = level.trim();
	return ALLOWED_LOG_LEVELS.includes(candidate) ? candidate : void 0;
}
function normalizeLogLevel(level, fallback = "info") {
	return tryParseLogLevel(level) ?? fallback;
}
function levelToMinLevel(level) {
	return {
		trace: 1,
		debug: 2,
		info: 3,
		warn: 4,
		error: 5,
		fatal: 6,
		silent: Number.POSITIVE_INFINITY
	}[level];
}
//#endregion
//#region src/logging/state.ts
const LOGGING_STATE_KEY = Symbol.for("operator.loggingState");
function createLoggingState() {
	return {
		cachedLogger: null,
		cachedSettings: null,
		cachedConsoleSettings: null,
		overrideSettings: null,
		invalidEnvLogLevelValue: null,
		consolePatched: false,
		forceConsoleToStderr: false,
		consoleTimestampPrefix: false,
		consoleSubsystemFilter: null,
		resolvingConsoleSettings: false,
		streamErrorHandlersInstalled: false,
		rawConsole: null
	};
}
const globalStore = globalThis;
const loggingState = globalStore[LOGGING_STATE_KEY] ?? createLoggingState();
globalStore[LOGGING_STATE_KEY] = loggingState;
//#endregion
//#region src/logging/env-log-level.ts
/** Resolves OPERATOR_LOG_LEVEL once per value, warning only when the invalid value changes. */
function resolveEnvLogLevelOverride() {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(process.env.OPERATOR_LOG_LEVEL) ?? "";
	if (!trimmed) {
		loggingState.invalidEnvLogLevelValue = null;
		return;
	}
	const parsed = tryParseLogLevel(trimmed);
	if (parsed) {
		loggingState.invalidEnvLogLevelValue = null;
		return parsed;
	}
	if (loggingState.invalidEnvLogLevelValue !== trimmed) {
		loggingState.invalidEnvLogLevelValue = trimmed;
		process.stderr.write(`[openclaw] Ignoring invalid OPERATOR_LOG_LEVEL="${trimmed}" (allowed: ${ALLOWED_LOG_LEVELS.join("|")}).\n`);
	}
}
//#endregion
//#region src/logging/log-file-shared.ts
const LOG_PREFIX = "@gabrielvfonseca/operator";
const LOG_SUFFIX = ".log";
function canUseNodeFs() {
	const getBuiltinModule = process.getBuiltinModule;
	if (typeof getBuiltinModule !== "function") return false;
	try {
		return getBuiltinModule("fs") !== void 0;
	} catch {
		return false;
	}
}
function formatLocalDate(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
//#endregion
//#region src/logging/timestamps.ts
const validTimeZoneCache = /* @__PURE__ */ new Map();
const timestampFormatterCache = /* @__PURE__ */ new Map();
let hostTimeZone;
function isValidTimeZone(tz) {
	const cached = validTimeZoneCache.get(tz);
	if (cached !== void 0) return cached;
	let valid;
	try {
		new Intl.DateTimeFormat("en", { timeZone: tz }).format();
		valid = true;
	} catch {
		valid = false;
	}
	validTimeZoneCache.set(tz, valid);
	return valid;
}
function resolveEffectiveTimeZone(timeZone) {
	const explicit = timeZone ?? process.env.TZ;
	return explicit && isValidTimeZone(explicit) ? explicit : hostTimeZone ??= Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function formatOffset(offsetRaw) {
	return offsetRaw === "GMT" ? "+00:00" : offsetRaw.slice(3);
}
function getTimestampParts(date, timeZone) {
	const effectiveTimeZone = resolveEffectiveTimeZone(timeZone);
	let fmt = timestampFormatterCache.get(effectiveTimeZone);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat("en", {
			timeZone: effectiveTimeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
			fractionalSecondDigits: 3,
			timeZoneName: "longOffset"
		});
		timestampFormatterCache.set(effectiveTimeZone, fmt);
	}
	const parts = Object.fromEntries(fmt.formatToParts(date).map((part) => [part.type, part.value]));
	return {
		year: parts.year,
		month: parts.month,
		day: parts.day,
		hour: parts.hour,
		minute: parts.minute,
		second: parts.second,
		fractionalSecond: parts.fractionalSecond,
		offset: formatOffset(parts.timeZoneName ?? "GMT")
	};
}
function formatTimestamp(date, options) {
	const style = options?.style ?? "medium";
	const parts = getTimestampParts(date, options?.timeZone);
	switch (style) {
		case "short": return `${parts.hour}:${parts.minute}:${parts.second}${parts.offset}`;
		case "medium": return `${parts.hour}:${parts.minute}:${parts.second}.${parts.fractionalSecond}${parts.offset}`;
		case "long": return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${parts.fractionalSecond}${parts.offset}`;
	}
	throw new Error("Unsupported timestamp style");
}
//#endregion
//#region src/logging/logger.ts
function resolveDefaultLogDir() {
	return canUseNodeFs() ? require_tmp_operator_dir.resolvePreferredOperatorTmpDir() : require_tmp_operator_dir.POSIX_OPERATOR_TMP_DIR;
}
function resolveDefaultLogFile(defaultLogDir) {
	return canUseNodeFs() ? node_path.default.join(defaultLogDir, "operator.log") : `${require_tmp_operator_dir.POSIX_OPERATOR_TMP_DIR}/operator.log`;
}
const DEFAULT_LOG_DIR = resolveDefaultLogDir();
const DEFAULT_LOG_FILE = resolveDefaultLogFile(DEFAULT_LOG_DIR);
const MAX_LOG_AGE_MS = 1440 * 60 * 1e3;
const DEFAULT_MAX_LOG_FILE_BYTES = 100 * 1024 * 1024;
const MAX_ROTATED_LOG_FILES = 5;
const MAX_DIAGNOSTIC_LOG_BINDINGS_JSON_CHARS = 8 * 1024;
const MAX_DIAGNOSTIC_LOG_MESSAGE_CHARS = 4 * 1024;
const loadLoggerConfigDefault = () => require_redact.readLoggingConfig();
let loadLoggerConfig = loadLoggerConfigDefault;
const MAX_DIAGNOSTIC_LOG_ATTRIBUTE_COUNT = 32;
const MAX_DIAGNOSTIC_LOG_ATTRIBUTE_VALUE_CHARS = 2 * 1024;
const MAX_DIAGNOSTIC_LOG_NAME_CHARS = 120;
const MAX_FILE_LOG_MESSAGE_CHARS = 4 * 1024;
const MAX_FILE_LOG_CONTEXT_VALUE_CHARS = 512;
const DIAGNOSTIC_LOG_ATTRIBUTE_KEY_RE = /^[A-Za-z0-9_.:-]{1,64}$/u;
const defaultHostnameResolver = () => node_os.default.hostname();
let hostnameResolver = defaultHostnameResolver;
let cachedHostname = null;
function clampDiagnosticLogText(value, maxChars) {
	return value.length > maxChars ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, maxChars)}...(truncated)` : value;
}
function sanitizeDiagnosticLogText(value, maxChars) {
	return clampDiagnosticLogText(require_redact.redactSensitiveText(clampDiagnosticLogText(value, maxChars)), maxChars);
}
function normalizeDiagnosticLogName(value) {
	if (!value || value.trim().startsWith("{")) return;
	const sanitized = sanitizeDiagnosticLogText(value.trim(), MAX_DIAGNOSTIC_LOG_NAME_CHARS);
	return DIAGNOSTIC_LOG_ATTRIBUTE_KEY_RE.test(sanitized) ? sanitized : void 0;
}
function assignDiagnosticLogAttribute(attributes, state, key, value) {
	if (state.count >= MAX_DIAGNOSTIC_LOG_ATTRIBUTE_COUNT) return;
	const normalizedKey = key.trim();
	if (require_prototype_keys.isBlockedObjectKey(normalizedKey)) return;
	if (require_redact.redactSensitiveText(normalizedKey) !== normalizedKey) return;
	if (!DIAGNOSTIC_LOG_ATTRIBUTE_KEY_RE.test(normalizedKey)) return;
	if (typeof value === "string") {
		attributes[normalizedKey] = sanitizeDiagnosticLogText(value, MAX_DIAGNOSTIC_LOG_ATTRIBUTE_VALUE_CHARS);
		state.count += 1;
		return;
	}
	if (typeof value === "number" && Number.isFinite(value)) {
		attributes[normalizedKey] = value;
		state.count += 1;
		return;
	}
	if (typeof value === "boolean") {
		attributes[normalizedKey] = value;
		state.count += 1;
	}
}
function addDiagnosticLogAttributesFrom(attributes, state, source) {
	if (!source) return;
	for (const key in source) {
		if (state.count >= MAX_DIAGNOSTIC_LOG_ATTRIBUTE_COUNT) break;
		if (!Object.hasOwn(source, key) || key === "trace") continue;
		assignDiagnosticLogAttribute(attributes, state, key, source[key]);
	}
}
function isPlainLogRecordObject(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
function normalizeTraceContext(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return;
	const candidate = value;
	if (!require_diagnostic_events.isValidDiagnosticTraceId(candidate.traceId)) return;
	if (candidate.spanId !== void 0 && !require_diagnostic_events.isValidDiagnosticSpanId(candidate.spanId)) return;
	if (candidate.parentSpanId !== void 0 && !require_diagnostic_events.isValidDiagnosticSpanId(candidate.parentSpanId)) return;
	if (candidate.traceFlags !== void 0 && !require_diagnostic_events.isValidDiagnosticTraceFlags(candidate.traceFlags)) return;
	return {
		traceId: candidate.traceId,
		...candidate.spanId ? { spanId: candidate.spanId } : {},
		...candidate.parentSpanId ? { parentSpanId: candidate.parentSpanId } : {},
		...candidate.traceFlags ? { traceFlags: candidate.traceFlags } : {}
	};
}
function extractTraceContext(value) {
	const direct = normalizeTraceContext(value);
	if (direct) return direct;
	if (!value || typeof value !== "object" || Array.isArray(value)) return;
	return normalizeTraceContext(value.trace);
}
function getSortedNumericLogArgs(logObj) {
	return Object.entries(logObj).filter(([key]) => /^\d+$/.test(key)).toSorted((a, b) => Number(a[0]) - Number(b[0])).map(([, value]) => value);
}
function clampFileLogText(value, maxChars) {
	return value.length > maxChars ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, maxChars)}...(truncated)` : value;
}
function normalizeFileLogContextValue(value) {
	if (typeof value === "string") {
		const normalized = value.trim();
		return normalized ? clampFileLogText(normalized, MAX_FILE_LOG_CONTEXT_VALUE_CHARS) : void 0;
	}
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "boolean") return String(value);
}
function readFirstContextString(sources, keys) {
	for (const source of sources) {
		if (!source) continue;
		for (const key of keys) {
			const value = normalizeFileLogContextValue(source[key]);
			if (value) return value;
		}
	}
}
function stringifyFileLogMessagePart(value) {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
	if (value instanceof Error) return value.message || value.name;
	if (isPlainLogRecordObject(value) && typeof value.message === "string") return value.message;
	if (value === null || value === void 0) return;
	try {
		return JSON.stringify(value);
	} catch {
		return;
	}
}
function buildFileLogMessage(numericArgs) {
	const parts = numericArgs.map(stringifyFileLogMessagePart).filter((part) => Boolean(part?.trim()));
	if (parts.length === 0) return;
	return clampFileLogText(parts.join(" "), MAX_FILE_LOG_MESSAGE_CHARS);
}
function resolveLogHostname() {
	if (cachedHostname) return cachedHostname;
	const hostname = hostnameResolver().trim();
	if (!hostname) return "unknown";
	cachedHostname = hostname;
	return hostname;
}
function withResolvedLogMetaHostname(meta, hostname) {
	if (!meta || typeof meta !== "object" || Array.isArray(meta)) return meta;
	return {
		...meta,
		hostname
	};
}
function extractLogBindingPrefix(numericArgs) {
	if (typeof numericArgs[0] === "string" && numericArgs[0].length <= MAX_DIAGNOSTIC_LOG_BINDINGS_JSON_CHARS && numericArgs[0].trim().startsWith("{")) try {
		const parsed = JSON.parse(numericArgs[0]);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return {
			bindings: parsed,
			args: numericArgs.slice(1)
		};
	} catch {}
	return { args: numericArgs };
}
function findLogTraceContext(bindings, numericArgs) {
	const fromBindings = extractTraceContext(bindings);
	if (fromBindings) return fromBindings;
	for (const arg of numericArgs) {
		const fromArg = extractTraceContext(arg);
		if (fromArg) return fromArg;
	}
}
function resolveLogTraceContext(bindings, numericArgs) {
	const explicitTrace = findLogTraceContext(bindings, numericArgs);
	if (explicitTrace) return {
		trace: explicitTrace,
		trustedTraceContext: false
	};
	const activeTrace = require_diagnostic_events.getActiveDiagnosticTraceContext();
	return activeTrace ? {
		trace: activeTrace,
		trustedTraceContext: true
	} : { trustedTraceContext: false };
}
function buildTraceFileLogFields(logObj) {
	const { bindings, args } = extractLogBindingPrefix(getSortedNumericLogArgs(logObj));
	const { trace } = resolveLogTraceContext(bindings, args);
	if (!trace) return;
	return {
		traceId: trace.traceId,
		...trace.spanId ? { spanId: trace.spanId } : {},
		...trace.parentSpanId ? { parentSpanId: trace.parentSpanId } : {},
		...trace.traceFlags ? { traceFlags: trace.traceFlags } : {}
	};
}
function buildStructuredFileLogFields(logObj) {
	const { bindings, args } = extractLogBindingPrefix(getSortedNumericLogArgs(logObj));
	const structuredArg = isPlainLogRecordObject(args[0]) ? args[0] : void 0;
	const sources = [
		structuredArg,
		bindings,
		logObj
	];
	const message = buildFileLogMessage(structuredArg && typeof structuredArg.message !== "string" ? args.slice(1) : args);
	const agentId = readFirstContextString(sources, ["agent_id", "agentId"]);
	const sessionId = readFirstContextString(sources, [
		"session_id",
		"sessionId",
		"sessionKey"
	]);
	const channel = readFirstContextString(sources, ["channel", "messageProvider"]);
	return {
		hostname: resolveLogHostname(),
		...message ? { message } : {},
		...agentId ? { agent_id: agentId } : {},
		...sessionId ? { session_id: sessionId } : {},
		...channel ? { channel } : {}
	};
}
function buildDiagnosticLogRecord(logObj) {
	const meta = logObj["_meta"];
	const { bindings, args: numericArgs } = extractLogBindingPrefix(getSortedNumericLogArgs(logObj));
	const { trace, trustedTraceContext } = resolveLogTraceContext(bindings, numericArgs);
	const structuredArg = numericArgs[0];
	const structuredBindings = isPlainLogRecordObject(structuredArg) ? structuredArg : void 0;
	if (structuredBindings) numericArgs.shift();
	let message = "";
	if (numericArgs.length > 0 && typeof numericArgs[numericArgs.length - 1] === "string") message = sanitizeDiagnosticLogText(String(numericArgs.pop()), MAX_DIAGNOSTIC_LOG_MESSAGE_CHARS);
	else if (numericArgs.length === 1 && (typeof numericArgs[0] === "number" || typeof numericArgs[0] === "boolean")) {
		message = String(numericArgs[0]);
		numericArgs.length = 0;
	}
	if (!message) message = "log";
	const attributes = Object.create(null);
	const attributeState = { count: 0 };
	addDiagnosticLogAttributesFrom(attributes, attributeState, bindings);
	addDiagnosticLogAttributesFrom(attributes, attributeState, structuredBindings);
	const code = {};
	if (meta?.path?.fileLine) {
		const line = Number(meta.path.fileLine);
		if (Number.isFinite(line)) code.line = line;
	}
	if (meta?.path?.method) code.functionName = sanitizeDiagnosticLogText(meta.path.method, MAX_DIAGNOSTIC_LOG_NAME_CHARS);
	const loggerName = normalizeDiagnosticLogName(meta?.name);
	const loggerParents = meta?.parentNames?.map(normalizeDiagnosticLogName).filter((name) => Boolean(name));
	return {
		event: {
			type: "log.record",
			level: meta?.logLevelName ?? "INFO",
			message,
			...loggerName ? { loggerName } : {},
			...loggerParents?.length ? { loggerParents } : {},
			...Object.keys(attributes).length > 0 ? { attributes } : {},
			...Object.keys(code).length > 0 ? { code } : {},
			...trace ? { trace } : {}
		},
		trustedTraceContext
	};
}
function isLogRedactionDisabled() {
	return require_redact.readLoggingConfig()?.redactSensitive === "off";
}
function redactLogRecordForTransport(record) {
	return isLogRedactionDisabled() ? record : require_redact.redactSecrets(record);
}
function attachDiagnosticEventTransport(logger) {
	logger.attachTransport((logObj) => {
		try {
			const record = buildDiagnosticLogRecord(redactLogRecordForTransport(logObj));
			(record.trustedTraceContext ? require_diagnostic_events.emitDiagnosticEventWithTrustedTraceContext : require_diagnostic_events.emitDiagnosticEvent)(record.event);
		} catch {}
	});
}
function canUseSilentVitestFileLogFastPath(envLevel) {
	return process.env.VITEST === "true" && process.env.OPERATOR_TEST_FILE_LOG !== "1" && !envLevel && !loggingState.overrideSettings;
}
function resolveDefaultActiveLogFile() {
	if (process.env.VITEST === "true" && process.env.OPERATOR_TEST_FILE_LOG === "1") return node_path.default.join(process.cwd(), ".artifacts", "test-logs", `${LOG_PREFIX}-vitest-${process.pid}-${formatLocalDate(/* @__PURE__ */ new Date())}${LOG_SUFFIX}`);
	return defaultRollingPathForToday();
}
function resolveSettings() {
	if (!canUseNodeFs()) return {
		level: "silent",
		file: DEFAULT_LOG_FILE,
		maxFileBytes: DEFAULT_MAX_LOG_FILE_BYTES
	};
	const envLevel = resolveEnvLogLevelOverride();
	if (canUseSilentVitestFileLogFastPath(envLevel)) return {
		level: "silent",
		file: defaultRollingPathForToday(),
		maxFileBytes: DEFAULT_MAX_LOG_FILE_BYTES
	};
	const cfg = loggingState.overrideSettings ?? loadLoggerConfig();
	const defaultLevel = process.env.VITEST === "true" && process.env.OPERATOR_TEST_FILE_LOG !== "1" ? "silent" : "info";
	const fromConfig = normalizeLogLevel(cfg?.level, defaultLevel);
	return {
		level: envLevel ?? fromConfig,
		file: cfg?.file ?? resolveDefaultActiveLogFile(),
		maxFileBytes: resolveMaxLogFileBytes(cfg?.maxFileBytes)
	};
}
function settingsChanged(a, b) {
	if (!a) return true;
	return a.level !== b.level || a.file !== b.file || a.maxFileBytes !== b.maxFileBytes;
}
function isFileLogLevelEnabled(level) {
	const settings = loggingState.cachedSettings ?? resolveSettings();
	if (!loggingState.cachedSettings) loggingState.cachedSettings = settings;
	if (level === "silent") return false;
	if (settings.level === "silent") return false;
	return levelToMinLevel(level) >= levelToMinLevel(settings.level);
}
function buildLogger(settings) {
	const logger = new tslog.Logger({
		name: "@gabrielvfonseca/operator",
		maskValuesOfKeys: [],
		minLevel: levelToMinLevel(settings.level),
		type: "hidden"
	});
	if (settings.level === "silent") {
		attachDiagnosticEventTransport(logger);
		return logger;
	}
	const rollingFile = isRollingPath(settings.file);
	let activeFile = resolveActiveLogFile(settings.file);
	node_fs.default.mkdirSync(node_path.default.dirname(activeFile), { recursive: true });
	if (rollingFile) pruneOldRollingLogs(node_path.default.dirname(activeFile));
	let currentFileBytes = getCurrentLogFileBytes(activeFile);
	let warnedAboutRotationFailure = false;
	logger.attachTransport((logObj) => {
		try {
			const nextActiveFile = resolveActiveLogFile(settings.file);
			if (nextActiveFile !== activeFile) {
				activeFile = nextActiveFile;
				node_fs.default.mkdirSync(node_path.default.dirname(activeFile), { recursive: true });
				if (rollingFile) pruneOldRollingLogs(node_path.default.dirname(activeFile));
				currentFileBytes = getCurrentLogFileBytes(activeFile);
			}
			const time = formatTimestamp(logObj.date ?? /* @__PURE__ */ new Date(), { style: "long" });
			const traceFields = buildTraceFileLogFields(logObj);
			const structuredFields = buildStructuredFileLogFields(logObj);
			const record = {
				...logObj,
				_meta: withResolvedLogMetaHostname(logObj["_meta"], (0, _gabrielvfonseca_normalization_core.expectDefined)(structuredFields.hostname, "structured log hostname")),
				time,
				...structuredFields,
				...traceFields
			};
			const payload = `${require_redact.redactSensitiveText(JSON.stringify(redactLogRecordForTransport(record)))}\n`;
			const payloadBytes = Buffer.byteLength(payload, "utf8");
			const nextBytes = currentFileBytes + payloadBytes;
			if (currentFileBytes > 0 && nextBytes > settings.maxFileBytes) {
				if (rotateLogFile(activeFile)) {
					currentFileBytes = getCurrentLogFileBytes(activeFile);
					warnedAboutRotationFailure = false;
				} else if (!warnedAboutRotationFailure) {
					warnedAboutRotationFailure = true;
					process.stderr.write(`[openclaw] log file rotation failed; continuing writes file=${activeFile} maxFileBytes=${settings.maxFileBytes}\n`);
				}
			}
			if (appendLogLine(activeFile, payload)) currentFileBytes += payloadBytes;
		} catch {}
	});
	attachDiagnosticEventTransport(logger);
	return logger;
}
function resolveMaxLogFileBytes(raw) {
	if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
	return DEFAULT_MAX_LOG_FILE_BYTES;
}
function getCurrentLogFileBytes(file) {
	try {
		return node_fs.default.statSync(file).size;
	} catch {
		return 0;
	}
}
function appendLogLine(file, line) {
	try {
		(0, _openclaw_fs_safe_advanced.appendRegularFileSync)({
			filePath: file,
			content: line
		});
		return true;
	} catch {
		return false;
	}
}
function getLogger() {
	const settings = resolveSettings();
	const cachedLogger = loggingState.cachedLogger;
	const cachedSettings = loggingState.cachedSettings;
	if (!cachedLogger || settingsChanged(cachedSettings, settings)) {
		loggingState.cachedLogger = buildLogger(settings);
		loggingState.cachedSettings = settings;
	}
	return loggingState.cachedLogger;
}
function getChildLogger(bindings, opts) {
	const base = getLogger();
	const minLevel = opts?.level ? levelToMinLevel(opts.level) : base.settings.minLevel;
	const name = bindings ? JSON.stringify(bindings) : void 0;
	return base.getSubLogger({
		name,
		minLevel,
		prefix: bindings ? [name ?? ""] : []
	});
}
function getResolvedLoggerSettings() {
	return resolveSettings();
}
function defaultRollingPathForToday() {
	return rollingPathForDate(DEFAULT_LOG_DIR, /* @__PURE__ */ new Date());
}
function rollingPathForDate(dir, date) {
	const today = formatLocalDate(date);
	return node_path.default.join(dir, `${LOG_PREFIX}-${today}${LOG_SUFFIX}`);
}
function resolveActiveLogFile(file) {
	const expandedFile = require_home_dir.expandHomePrefix(file);
	if (!isRollingPath(expandedFile)) return expandedFile;
	return rollingPathForDate(node_path.default.dirname(expandedFile), /* @__PURE__ */ new Date());
}
function isRollingPath(file) {
	const base = node_path.default.basename(file);
	return base.startsWith(`@gabrielvfonseca/operator-`) && base.endsWith(".log") && base.length === `@gabrielvfonseca/operator-YYYY-MM-DD.log`.length;
}
function pruneOldRollingLogs(dir) {
	try {
		const entries = node_fs.default.readdirSync(dir, { withFileTypes: true });
		const cutoff = Date.now() - MAX_LOG_AGE_MS;
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			if (!entry.name.startsWith(`@gabrielvfonseca/operator-`) || !entry.name.endsWith(".log")) continue;
			const fullPath = node_path.default.join(dir, entry.name);
			try {
				if (node_fs.default.statSync(fullPath).mtimeMs < cutoff) node_fs.default.rmSync(fullPath, { force: true });
			} catch {}
		}
	} catch {}
}
function rotatedLogPath(file, index) {
	const ext = node_path.default.extname(file);
	return `${file.slice(0, file.length - ext.length)}.${index}${ext}`;
}
function rotateLogFile(file) {
	try {
		node_fs.default.mkdirSync(node_path.default.dirname(file), { recursive: true });
		node_fs.default.rmSync(rotatedLogPath(file, MAX_ROTATED_LOG_FILES), { force: true });
		for (let index = MAX_ROTATED_LOG_FILES - 1; index >= 1; index -= 1) {
			const from = rotatedLogPath(file, index);
			if (!node_fs.default.existsSync(from)) continue;
			node_fs.default.renameSync(from, rotatedLogPath(file, index + 1));
		}
		if (node_fs.default.existsSync(file)) node_fs.default.renameSync(file, rotatedLogPath(file, 1));
		return true;
	} catch {
		return false;
	}
}
//#endregion
Object.defineProperty(exports, "LOG_PREFIX", {
	enumerable: true,
	get: function() {
		return LOG_PREFIX;
	}
});
Object.defineProperty(exports, "LOG_SUFFIX", {
	enumerable: true,
	get: function() {
		return LOG_SUFFIX;
	}
});
Object.defineProperty(exports, "canUseNodeFs", {
	enumerable: true,
	get: function() {
		return canUseNodeFs;
	}
});
Object.defineProperty(exports, "formatLocalDate", {
	enumerable: true,
	get: function() {
		return formatLocalDate;
	}
});
Object.defineProperty(exports, "formatTimestamp", {
	enumerable: true,
	get: function() {
		return formatTimestamp;
	}
});
Object.defineProperty(exports, "getChildLogger", {
	enumerable: true,
	get: function() {
		return getChildLogger;
	}
});
Object.defineProperty(exports, "getLogger", {
	enumerable: true,
	get: function() {
		return getLogger;
	}
});
Object.defineProperty(exports, "getResolvedLoggerSettings", {
	enumerable: true,
	get: function() {
		return getResolvedLoggerSettings;
	}
});
Object.defineProperty(exports, "isFileLogLevelEnabled", {
	enumerable: true,
	get: function() {
		return isFileLogLevelEnabled;
	}
});
Object.defineProperty(exports, "isVerbose", {
	enumerable: true,
	get: function() {
		return isVerbose;
	}
});
Object.defineProperty(exports, "isYes", {
	enumerable: true,
	get: function() {
		return isYes;
	}
});
Object.defineProperty(exports, "levelToMinLevel", {
	enumerable: true,
	get: function() {
		return levelToMinLevel;
	}
});
Object.defineProperty(exports, "loggingState", {
	enumerable: true,
	get: function() {
		return loggingState;
	}
});
Object.defineProperty(exports, "normalizeLogLevel", {
	enumerable: true,
	get: function() {
		return normalizeLogLevel;
	}
});
Object.defineProperty(exports, "resolveEnvLogLevelOverride", {
	enumerable: true,
	get: function() {
		return resolveEnvLogLevelOverride;
	}
});
