const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./ansi-DY9p-M6m.cjs");
const require_logger = require("./logger-Bw1L7SVe.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_progress_line = require("./progress-line-CDI8nBBL.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let chalk = require("chalk");
let node_util = require("node:util");
node_util = require_rolldown_runtime.__toESM(node_util, 1);
//#region src/logging/console.ts
const loadConfigFallbackDefault = () => void 0;
let loadConfigFallback = loadConfigFallbackDefault;
function normalizeConsoleLevel(level) {
	if (require_logger.isVerbose()) return "debug";
	if (!level && process.env.VITEST === "true" && process.env.OPERATOR_TEST_CONSOLE !== "1") return "silent";
	return require_logger.normalizeLogLevel(level, "info");
}
function normalizeConsoleStyle(style) {
	if (style === "compact" || style === "json" || style === "pretty") return style;
	if (!process.stdout.isTTY) return "compact";
	return "pretty";
}
function resolveConsoleSettings() {
	const envLevel = require_logger.resolveEnvLogLevelOverride();
	if (process.env.VITEST === "true" && process.env.OPERATOR_TEST_CONSOLE !== "1" && !require_logger.isVerbose() && !envLevel && !require_logger.loggingState.overrideSettings) return {
		level: "silent",
		style: normalizeConsoleStyle(void 0)
	};
	let cfg = require_logger.loggingState.overrideSettings ?? require_redact.readLoggingConfig();
	if (!cfg && !require_redact.shouldSkipMutatingLoggingConfigRead()) if (require_logger.loggingState.resolvingConsoleSettings) cfg = void 0;
	else {
		require_logger.loggingState.resolvingConsoleSettings = true;
		try {
			cfg = loadConfigFallback();
		} finally {
			require_logger.loggingState.resolvingConsoleSettings = false;
		}
	}
	return {
		level: envLevel ?? normalizeConsoleLevel(cfg?.consoleLevel),
		style: normalizeConsoleStyle(cfg?.consoleStyle)
	};
}
function consoleSettingsChanged(a, b) {
	if (!a) return true;
	return a.level !== b.level || a.style !== b.style;
}
function getConsoleSettings() {
	const settings = resolveConsoleSettings();
	const cached = require_logger.loggingState.cachedConsoleSettings;
	if (!cached || consoleSettingsChanged(cached, settings)) require_logger.loggingState.cachedConsoleSettings = settings;
	return require_logger.loggingState.cachedConsoleSettings;
}
function setConsoleSubsystemFilter(filters) {
	if (!filters || filters.length === 0) {
		require_logger.loggingState.consoleSubsystemFilter = null;
		return;
	}
	const normalized = filters.map((value) => value.trim()).filter((value) => value.length > 0);
	require_logger.loggingState.consoleSubsystemFilter = normalized.length > 0 ? normalized : null;
}
/** Hides subsystem console lines for TTY-owned work while preserving file logging. */
async function withConsoleSubsystemsSuppressed(work) {
	const previousFilter = require_logger.loggingState.consoleSubsystemFilter ? [...require_logger.loggingState.consoleSubsystemFilter] : null;
	setConsoleSubsystemFilter(["__operator_tui_quiet__"]);
	try {
		return await work();
	} finally {
		setConsoleSubsystemFilter(previousFilter);
	}
}
function normalizeConsoleSubsystem(subsystem) {
	if (typeof subsystem !== "string") return null;
	const normalized = subsystem.trim();
	return normalized.length > 0 ? normalized : null;
}
function shouldLogSubsystemToConsole(subsystem) {
	const filter = require_logger.loggingState.consoleSubsystemFilter;
	if (!filter || filter.length === 0) return true;
	const normalizedSubsystem = normalizeConsoleSubsystem(subsystem);
	if (!normalizedSubsystem) return false;
	return filter.some((prefix) => normalizedSubsystem === prefix || normalizedSubsystem.startsWith(`${prefix}/`));
}
function formatConsoleTimestamp(style) {
	const now = /* @__PURE__ */ new Date();
	if (style === "pretty") return require_logger.formatTimestamp(now, { style: "short" }).replace(/[+-]\d{2}:\d{2}$/, "");
	return require_logger.formatTimestamp(now, { style: "long" });
}
//#endregion
//#region src/logging/subsystem.ts
var subsystem_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	createSubsystemLogger: () => createSubsystemLogger,
	runtimeForLogger: () => runtimeForLogger,
	stripRedundantSubsystemPrefixForConsole: () => stripRedundantSubsystemPrefixForConsole
});
function normalizeSubsystemLabel(subsystem) {
	if (typeof subsystem !== "string") return "unknown";
	const normalized = subsystem.trim();
	return normalized.length > 0 ? normalized : "unknown";
}
function shouldLogToConsole(level, settings) {
	if (level === "silent") return false;
	if (settings.level === "silent") return false;
	return require_logger.levelToMinLevel(level) >= require_logger.levelToMinLevel(settings.level);
}
const inspectValue = (() => {
	const getBuiltinModule = process.getBuiltinModule;
	if (typeof getBuiltinModule !== "function") return null;
	try {
		const utilNamespace = getBuiltinModule("util");
		return typeof utilNamespace.inspect === "function" ? utilNamespace.inspect : null;
	} catch {
		return null;
	}
})();
function formatRuntimeArg(arg) {
	if (typeof arg === "string") return arg;
	if (inspectValue) return inspectValue(arg);
	try {
		return JSON.stringify(arg);
	} catch {
		return String(arg);
	}
}
function isRichConsoleEnv() {
	const term = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(process.env.TERM);
	if (process.env.COLORTERM || process.env.TERM_PROGRAM) return true;
	return term.length > 0 && term !== "dumb";
}
function getColorForConsole() {
	const hasForceColor = typeof process.env.FORCE_COLOR === "string" && process.env.FORCE_COLOR.trim().length > 0 && process.env.FORCE_COLOR.trim() !== "0";
	if (hasForceColor) return new chalk.Chalk({ level: 1 });
	if (process.env.NO_COLOR && !hasForceColor) return new chalk.Chalk({ level: 0 });
	return process.stdout.isTTY || process.stderr.isTTY || isRichConsoleEnv() ? new chalk.Chalk({ level: 1 }) : new chalk.Chalk({ level: 0 });
}
const SUBSYSTEM_COLORS = [
	"cyan",
	"green",
	"yellow",
	"blue",
	"magenta",
	"red"
];
const SUBSYSTEM_COLOR_OVERRIDES = { "gmail-watcher": "blue" };
const SUBSYSTEM_PREFIXES_TO_DROP = [
	"gateway",
	"channels",
	"providers"
];
const SUBSYSTEM_MAX_SEGMENTS = 2;
const CHANNEL_SUBSYSTEM_PREFIXES = /* @__PURE__ */ new Set([
	"clickclack",
	"discord",
	"feishu",
	"googlechat",
	"imessage",
	"irc",
	"line",
	"matrix",
	"mattermost",
	"msteams",
	"nextcloud-talk",
	"nostr",
	"operator-weixin",
	"qqbot",
	"signal",
	"slack",
	"synology-chat",
	"telegram",
	"tlon",
	"twitch",
	"webchat",
	"wecom",
	"whatsapp",
	"yuanbao",
	"zalo",
	"zalouser"
]);
function isChannelSubsystemPrefix(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(value);
	if (!normalized) return false;
	return CHANNEL_SUBSYSTEM_PREFIXES.has(normalized);
}
function pickSubsystemColor(color, subsystem) {
	const override = SUBSYSTEM_COLOR_OVERRIDES[subsystem];
	if (override) return color[override];
	let hash = 0;
	for (let i = 0; i < subsystem.length; i += 1) hash = hash * 31 + subsystem.charCodeAt(i) | 0;
	const idx = Math.abs(hash) % SUBSYSTEM_COLORS.length;
	return color[(0, _gabrielvfonseca_normalization_core.expectDefined)(SUBSYSTEM_COLORS[idx], "subsystem colors entry at idx")];
}
function formatSubsystemForConsole(subsystem) {
	const parts = subsystem.split("/").filter(Boolean);
	const original = parts.join("/") || subsystem;
	while (parts.length > 0) {
		const first = parts.at(0);
		if (first === void 0 || !SUBSYSTEM_PREFIXES_TO_DROP.includes(first)) break;
		parts.shift();
	}
	const first = parts.at(0);
	if (first === void 0) return original;
	if (isChannelSubsystemPrefix(first)) return first;
	if (parts.length > SUBSYSTEM_MAX_SEGMENTS) return parts.slice(-2).join("/");
	return parts.join("/");
}
function stripRedundantSubsystemPrefixForConsole(message, displaySubsystem) {
	if (!displaySubsystem) return message;
	if (message.startsWith("[")) {
		const closeIdx = message.indexOf("]");
		if (closeIdx > 1) {
			if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(message.slice(1, closeIdx)) === (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(displaySubsystem)) {
				let i = closeIdx + 1;
				while (message[i] === " ") i += 1;
				return message.slice(i);
			}
		}
	}
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(message.slice(0, displaySubsystem.length)) !== (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(displaySubsystem)) return message;
	const next = message.slice(displaySubsystem.length, displaySubsystem.length + 1);
	if (next !== ":" && next !== " ") return message;
	let i = displaySubsystem.length;
	while (message[i] === " ") i += 1;
	if (message[i] === ":") i += 1;
	while (message[i] === " ") i += 1;
	return message.slice(i);
}
function formatConsoleLine(opts) {
	const displaySubsystem = opts.style === "json" ? opts.subsystem : formatSubsystemForConsole(opts.subsystem);
	if (opts.style === "json") return require_redact.redactSensitiveText(JSON.stringify({
		time: formatConsoleTimestamp("json"),
		level: opts.level,
		subsystem: displaySubsystem,
		message: opts.message,
		...opts.meta
	}));
	const color = getColorForConsole();
	const prefix = `[${displaySubsystem}]`;
	const prefixColor = pickSubsystemColor(color, displaySubsystem);
	const levelColor = opts.level === "error" || opts.level === "fatal" ? color.red : opts.level === "warn" ? color.yellow : opts.level === "debug" || opts.level === "trace" ? color.gray : color.cyan;
	const displayMessage = stripRedundantSubsystemPrefixForConsole(require_redact.redactSensitiveText(opts.message), displaySubsystem);
	return `${[(() => {
		if (opts.style === "pretty") return color.gray(formatConsoleTimestamp("pretty"));
		if (require_logger.loggingState.consoleTimestampPrefix) return color.gray(formatConsoleTimestamp(opts.style));
		return "";
	})(), prefixColor(prefix)].filter(Boolean).join(" ")} ${levelColor(displayMessage)}`;
}
function writeConsoleLine(level, line, opts = {}) {
	require_progress_line.clearActiveProgressLine();
	const sanitized = process.platform === "win32" && process.env.GITHUB_ACTIONS === "true" ? line.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "?").replace(/[\uD800-\uDFFF]/g, "?") : line;
	const redacted = opts.redacted ? sanitized : require_redact.redactSensitiveText(sanitized);
	const sink = require_logger.loggingState.rawConsole ?? console;
	if (require_logger.loggingState.forceConsoleToStderr || level === "error" || level === "fatal") (sink.error ?? console.error)(redacted);
	else if (level === "warn") (sink.warn ?? console.warn)(redacted);
	else (sink.log ?? console.log)(redacted);
}
function shouldSuppressProbeConsoleLine(params) {
	if (require_logger.isVerbose()) return false;
	if (params.level === "error" || params.level === "fatal") return false;
	const subsystem = normalizeSubsystemLabel(params.subsystem);
	const message = typeof params.message === "string" ? params.message : "";
	if (!(subsystem === "agent/embedded" || subsystem.startsWith("agent/embedded/") || subsystem === "model-fallback" || subsystem.startsWith("model-fallback/"))) return false;
	if ((typeof params.meta?.runId === "string" ? params.meta.runId : typeof params.meta?.sessionId === "string" ? params.meta.sessionId : void 0)?.startsWith("probe-")) return true;
	return /(sessionId|runId)=probe-/.test(message);
}
function logToFile(fileLogger, level, message, meta) {
	if (level === "silent") return;
	const method = fileLogger[level];
	if (typeof method !== "function") return;
	if (meta && Object.keys(meta).length > 0) method.call(fileLogger, meta, message);
	else method.call(fileLogger, message);
}
function createSubsystemLogger(subsystem) {
	const resolvedSubsystem = normalizeSubsystemLabel(subsystem);
	const emitLog = (level, message, meta) => {
		const consoleSettings = getConsoleSettings();
		const consoleEnabled = shouldLogToConsole(level, { level: consoleSettings.level }) && shouldLogSubsystemToConsole(resolvedSubsystem);
		const fileEnabled = require_logger.isFileLogLevelEnabled(level);
		if (!consoleEnabled && !fileEnabled) return;
		let consoleMessageOverride;
		let fileMeta = meta;
		if (meta && Object.keys(meta).length > 0) {
			const { consoleMessage, ...rest } = meta;
			if (typeof consoleMessage === "string") consoleMessageOverride = consoleMessage;
			fileMeta = Object.keys(rest).length > 0 ? rest : void 0;
		}
		if (fileEnabled) logToFile(require_logger.getChildLogger({ subsystem: resolvedSubsystem }), level, message, fileMeta);
		if (!consoleEnabled) return;
		const consoleMessage = consoleMessageOverride ?? message;
		if (shouldSuppressProbeConsoleLine({
			level,
			subsystem: resolvedSubsystem,
			message: consoleMessage,
			meta: fileMeta
		})) return;
		writeConsoleLine(level, formatConsoleLine({
			level,
			subsystem: resolvedSubsystem,
			message: consoleSettings.style === "json" ? message : consoleMessage,
			style: consoleSettings.style,
			meta: fileMeta
		}), { redacted: true });
	};
	return {
		subsystem: resolvedSubsystem,
		isEnabled(level, target = "any") {
			const isConsoleEnabled = shouldLogToConsole(level, { level: getConsoleSettings().level }) && shouldLogSubsystemToConsole(resolvedSubsystem);
			const isFileEnabled = require_logger.isFileLogLevelEnabled(level);
			if (target === "console") return isConsoleEnabled;
			if (target === "file") return isFileEnabled;
			return isConsoleEnabled || isFileEnabled;
		},
		trace(message, meta) {
			emitLog("trace", message, meta);
		},
		debug(message, meta) {
			emitLog("debug", message, meta);
		},
		info(message, meta) {
			emitLog("info", message, meta);
		},
		warn(message, meta) {
			emitLog("warn", message, meta);
		},
		error(message, meta) {
			emitLog("error", message, meta);
		},
		fatal(message, meta) {
			emitLog("fatal", message, meta);
		},
		raw(message) {
			if (require_logger.isFileLogLevelEnabled("info")) logToFile(require_logger.getChildLogger({ subsystem: resolvedSubsystem }), "info", message, { raw: true });
			if (shouldLogToConsole("info", { level: getConsoleSettings().level }) && shouldLogSubsystemToConsole(resolvedSubsystem)) {
				if (shouldSuppressProbeConsoleLine({
					level: "info",
					subsystem: resolvedSubsystem,
					message
				})) return;
				writeConsoleLine("info", message);
			}
		},
		child(name) {
			return createSubsystemLogger(`${resolvedSubsystem}/${name}`);
		}
	};
}
function runtimeForLogger(logger, exit = require_runtime.defaultRuntime.exit) {
	return {
		log(...args) {
			logger.info(args.map((arg) => formatRuntimeArg(arg)).join(" ").trim());
		},
		error(...args) {
			logger.error(args.map((arg) => formatRuntimeArg(arg)).join(" ").trim());
		},
		writeStdout(value) {
			logger.info(value);
		},
		writeJson(value, space = 2) {
			logger.info(JSON.stringify(value, null, space > 0 ? space : void 0));
		},
		exit
	};
}
//#endregion
Object.defineProperty(exports, "createSubsystemLogger", {
	enumerable: true,
	get: function() {
		return createSubsystemLogger;
	}
});
Object.defineProperty(exports, "runtimeForLogger", {
	enumerable: true,
	get: function() {
		return runtimeForLogger;
	}
});
Object.defineProperty(exports, "setConsoleSubsystemFilter", {
	enumerable: true,
	get: function() {
		return setConsoleSubsystemFilter;
	}
});
Object.defineProperty(exports, "shouldLogSubsystemToConsole", {
	enumerable: true,
	get: function() {
		return shouldLogSubsystemToConsole;
	}
});
Object.defineProperty(exports, "subsystem_exports", {
	enumerable: true,
	get: function() {
		return subsystem_exports;
	}
});
Object.defineProperty(exports, "withConsoleSubsystemsSuppressed", {
	enumerable: true,
	get: function() {
		return withConsoleSubsystemsSuppressed;
	}
});
