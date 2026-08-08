const require_utils = require("./utils-CXqBhRFw.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
require("./message-channel-core-CeN5z1gK.cjs");
const require_fences = require("./fences-gMBrlOwF.cjs");
const require_markdown_code = require("./markdown-code-XePB7Ipf.cjs");
const require_tool_display = require("./tool-display-DDHJnndq.cjs");
const require_boolean = require("./boolean-DrgQ-UMw.cjs");
const require_text_chunking = require("./text-chunking-T7WdRIQ1.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/auto-reply/tool-meta.ts
/** Formats compact tool metadata labels for auto-reply progress/status messages. */
/** Formats one grouped tool-progress label from a tool name and metadata entries. */
function formatToolAggregate(toolName, metas, options) {
	const filtered = (metas ?? []).filter(Boolean).map(require_utils.shortenHomeInString);
	const display = require_tool_display.resolveToolDisplay({ name: toolName });
	const normalizedToolName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(toolName);
	const compactCommandSummary = filtered.length > 0 && (normalizedToolName === "exec" || normalizedToolName === "bash");
	const prefix = compactCommandSummary ? display.emoji : `${display.emoji} ${display.label}`;
	if (!filtered.length) return `${display.emoji} ${display.label}`;
	const rawSegments = [];
	const grouped = {};
	for (const m of filtered) {
		if (!isPathLike(m)) {
			rawSegments.push(m);
			continue;
		}
		if (m.includes("→")) {
			rawSegments.push(m);
			continue;
		}
		const parts = m.split("/");
		if (parts.length > 1) {
			const dir = parts.slice(0, -1).join("/");
			const base = parts.at(-1) ?? m;
			if (!grouped[dir]) grouped[dir] = [];
			grouped[dir].push(base);
		} else {
			if (!grouped["."]) grouped["."] = [];
			grouped["."].push(m);
		}
	}
	const segments = Object.entries(grouped).map(([dir, files]) => {
		const brace = files.length > 1 ? `{${files.join(", ")}}` : files[0];
		if (dir === ".") return brace;
		return `${dir}/${brace}`;
	});
	const formattedMeta = formatMetaForDisplay(toolName, [...rawSegments, ...segments].join("; "), options?.markdown);
	return compactCommandSummary ? `${prefix} ${formattedMeta}` : `${prefix}: ${formattedMeta}`;
}
function formatMetaForDisplay(toolName, meta, markdown) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(toolName);
	if (normalized === "exec" || normalized === "bash") {
		const { flags, body } = splitExecFlags(meta);
		if (flags.length > 0) {
			if (!body) return flags.join(" · ");
			return `${flags.join(" · ")} · ${maybeWrapMarkdown(body, markdown)}`;
		}
	}
	return maybeWrapMarkdown(meta, markdown);
}
function splitExecFlags(meta) {
	const parts = meta.split(" · ").map((part) => part.trim()).filter(Boolean);
	if (parts.length === 0) return {
		flags: [],
		body: ""
	};
	const flags = [];
	const bodyParts = [];
	for (const part of parts) {
		if (part === "elevated" || part === "pty") {
			flags.push(part);
			continue;
		}
		bodyParts.push(part);
	}
	return {
		flags,
		body: bodyParts.join(" · ")
	};
}
function isPathLike(value) {
	if (!value) return false;
	if (value.includes(" ")) return false;
	if (value.includes("://")) return false;
	if (value.includes("·")) return false;
	if (value.includes("&&") || value.includes("||")) return false;
	return /^~?(\/[^\s]+)+$/.test(value);
}
function maybeWrapMarkdown(value, markdown) {
	return markdown ? require_markdown_code.formatInlineCodeSpan(value) : value;
}
//#endregion
//#region src/shared/progress-labels.ts
const DEFAULT_PROGRESS_DRAFT_LABELS$1 = ["Working"];
function hashProgressSeed(seed) {
	let hash = 2166136261;
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}
function selectProgressLabel(params) {
	const labels = params.labels ?? DEFAULT_PROGRESS_DRAFT_LABELS$1;
	if (labels.length === 0) return;
	return labels[typeof params.seed === "string" && params.seed.length > 0 ? hashProgressSeed(params.seed) % labels.length : Math.floor(Math.max(0, Math.min(.999999, params.random?.() ?? 0)) * labels.length)] ?? labels[0];
}
//#endregion
//#region src/channels/streaming-flat-key-deprecation.ts
const log = require_subsystem.createSubsystemLogger("channels/streaming");
const warnedFlatStreamingKeys = /* @__PURE__ */ new Set();
/** Warns once per process per flat key when a resolver used the flat fallback. */
function warnFlatStreamingKeyFallback(flatKey, nestedPath) {
	if (warnedFlatStreamingKeys.has(flatKey)) return;
	warnedFlatStreamingKeys.add(flatKey);
	log.warn(`Flat channel streaming key "${flatKey}" is deprecated; move it to streaming.${nestedPath}. The flat fallback is removed after the next release train.`);
}
function asObjectRecord$1(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function asTextChunkMode(value) {
	return value === "length" || value === "newline" ? value : void 0;
}
function asBlockStreamingCoalesceConfig(value) {
	return asObjectRecord$1(value) ?? void 0;
}
function getNestedStreamingConfig(entry) {
	const streaming = asObjectRecord$1(entry?.streaming);
	return streaming ? streaming : void 0;
}
function resolveWithFlatFallback(params) {
	if (params.nested !== void 0) return params.nested;
	if (params.flat !== void 0) warnFlatStreamingKeyFallback(params.flatKey, params.nestedPath);
	return params.flat;
}
function resolveChannelStreamingChunkMode(entry) {
	return resolveWithFlatFallback({
		nested: asTextChunkMode(getNestedStreamingConfig(entry)?.chunkMode),
		flat: asTextChunkMode(entry?.chunkMode),
		flatKey: "chunkMode",
		nestedPath: "chunkMode"
	});
}
function resolveChannelStreamingBlockEnabled(entry) {
	return resolveWithFlatFallback({
		nested: require_boolean.asBoolean(getNestedStreamingConfig(entry)?.block?.enabled),
		flat: require_boolean.asBoolean(entry?.blockStreaming),
		flatKey: "blockStreaming",
		nestedPath: "block.enabled"
	});
}
function resolveChannelStreamingBlockCoalesce(entry) {
	return resolveWithFlatFallback({
		nested: asBlockStreamingCoalesceConfig(getNestedStreamingConfig(entry)?.block?.coalesce),
		flat: asBlockStreamingCoalesceConfig(entry?.blockStreamingCoalesce),
		flatKey: "blockStreamingCoalesce",
		nestedPath: "block.coalesce"
	});
}
//#endregion
//#region src/channels/streaming.ts
function asObjectRecord(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function asInteger(value) {
	return typeof value === "number" && Number.isInteger(value) ? value : void 0;
}
function normalizeStreamingMode(value) {
	if (typeof value !== "string") return null;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value) || null;
}
function parsePreviewStreamingMode(value) {
	const normalized = normalizeStreamingMode(value);
	if (normalized === "off" || normalized === "partial" || normalized === "block" || normalized === "progress") return normalized;
	return null;
}
function asProgressConfig(value) {
	return asObjectRecord(value) ?? void 0;
}
function asCommandTextMode(value) {
	return value === "raw" || value === "status" ? value : void 0;
}
const DEFAULT_PROGRESS_DRAFT_LABELS = DEFAULT_PROGRESS_DRAFT_LABELS$1;
const DEFAULT_PROGRESS_DRAFT_MAX_LINE_CHARS = 120;
const PROGRESS_DRAFT_NARRATION_MAX_CHARS = 280;
const NON_WORK_PROGRESS_TOOL_NAMES = /* @__PURE__ */ new Set([
	"message",
	"messages",
	"reply",
	"send",
	"reaction",
	"react",
	"typing",
	"update_plan"
]);
function isChannelProgressDraftWorkToolName(name) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(name);
	return Boolean(normalized && !NON_WORK_PROGRESS_TOOL_NAMES.has(normalized));
}
function isAgentPlanStepStatus(value) {
	return value === "pending" || value === "in_progress" || value === "completed";
}
/**
* Normalizes plan-event steps at public ingress boundaries. Legacy string
* steps become pending typed steps; malformed entries are dropped.
*/
/**
* Builds both plan-step payload fields for `onPlanUpdate` during the SDK
* deprecation window: canonical `planSteps` plus the shipped pre-2026.8
* `steps: string[]` form. Collapse to `planSteps` when the window closes.
*/
function buildPlanUpdateStepFields(value) {
	const planSteps = normalizeAgentPlanSteps(value);
	if (!planSteps) return {};
	return {
		steps: planSteps.map((entry) => entry.step),
		planSteps
	};
}
function normalizeAgentPlanSteps(value) {
	if (!Array.isArray(value)) return;
	return value.flatMap((entry) => {
		if (typeof entry === "string") {
			const step = entry.trim();
			return step ? [{
				step,
				status: "pending"
			}] : [];
		}
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
		const rawStep = entry.step;
		const status = entry.status;
		const step = typeof rawStep === "string" ? rawStep.trim() : "";
		return step && isAgentPlanStepStatus(status) ? [{
			step,
			status
		}] : [];
	});
}
const EMOJI_PREFIX_RE = /^\p{Extended_Pictographic}/u;
const progressDraftLineCorrelationKeys = /* @__PURE__ */ new WeakMap();
function compactStrings(values) {
	return values.map((value) => value?.replace(/\s+/g, " ").trim()).filter(Boolean);
}
function inferToolMeta(name, args, detailMode = "explain") {
	if (!name || !args) return;
	return require_tool_display.formatToolDetail(require_tool_display.resolveToolDisplay({
		name,
		args,
		detailMode
	}));
}
function buildNamedProgressLine(kind, name, metas, options, fields) {
	const normalizedName = name?.trim() || "tool_call";
	const compactMetas = compactStrings(metas ?? []);
	const text = formatToolAggregate(normalizedName, compactMetas.length ? compactMetas : void 0, { markdown: options?.markdown });
	const display = require_tool_display.resolveToolDisplay({ name: normalizedName });
	const prefix = `${display.emoji} ${display.label}`;
	const compactCommandDetail = (display.name === "exec" || display.name === "bash") && text.startsWith(`${display.emoji} `) ? text.slice(display.emoji.length + 1).trim() : void 0;
	const compactCommandPrefix = compactCommandDetail && compactCommandDetail !== display.label ? compactCommandDetail : void 0;
	const detail = text.startsWith(`${prefix}: `) ? text.slice(prefix.length + 2).trim() : compactCommandPrefix;
	const line = {
		...fields?.id ? { id: fields.id } : {},
		kind,
		text,
		label: display.label,
		icon: display.emoji,
		...detail ? { detail } : {},
		...fields?.status ? { status: fields.status } : {},
		toolName: display.name
	};
	setProgressDraftLineCorrelationKey(line, fields?.correlationKey);
	return line;
}
function setProgressDraftLineCorrelationKey(line, correlationKey) {
	const normalized = correlationKey?.trim();
	if (normalized) progressDraftLineCorrelationKeys.set(line, normalized);
}
function itemKindToToolName(kind) {
	switch ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(kind)) {
		case "command": return "exec";
		case "patch": return "apply_patch";
		case "search": return "web_search";
		case "api": return "api";
		case "tool": return "tool_call";
		default: return;
	}
}
/** Tools whose detail is raw command text; commandText policy applies to these. */
function isCommandToolName(name) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(name);
	return normalized === "exec" || normalized === "shell" || normalized === "bash";
}
function isCommandProgressItem(input) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(input.itemKind) === "command" || isCommandToolName(input.name);
}
function resolveProgressDraftLineId(input, params) {
	const itemId = input.itemId?.trim();
	const toolCallId = input.toolCallId?.trim();
	if (itemId) return itemId;
	return params?.useToolCallIdFallback === true ? toolCallId : void 0;
}
function resolveCommandProgressCorrelationKey(input) {
	const toolCallId = input.toolCallId?.trim();
	return toolCallId ? `command:${toolCallId}` : void 0;
}
function isTerminalProgressStatus(status) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(status);
	return normalized === "completed" || normalized === "failed" || normalized?.startsWith("exit ") === true;
}
function isEmptyReasoningProgressItem(input, meta) {
	return !meta && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(input.itemKind) === "analysis" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(input.title) === "reasoning";
}
function patchMetas(input) {
	const fileMetas = [
		...input.added ?? [],
		...input.modified ?? [],
		...input.deleted ?? []
	];
	return compactStrings([
		input.summary,
		...fileMetas,
		input.title
	]);
}
function buildCommandOutputProgressLine(input, status, options) {
	const name = input.name ?? "exec";
	const correlationKey = resolveCommandProgressCorrelationKey(input);
	const detail = options?.commandText === "status" ? [] : compactStrings([input.title]);
	const line = buildNamedProgressLine(input.event, name, detail, options, {
		correlationKey,
		id: resolveProgressDraftLineId(input, { useToolCallIdFallback: true }),
		status
	});
	if (!line || !status) return line;
	if (status === "completed") return line;
	if (!line.detail || line.detail === status) {
		const statusLine = {
			...line,
			detail: status,
			text: formatToolAggregate(name, [status], { markdown: options?.markdown })
		};
		setProgressDraftLineCorrelationKey(statusLine, correlationKey);
		return statusLine;
	}
	const statusLine = {
		...line,
		text: formatToolAggregate(name, [status, line.detail], { markdown: options?.markdown })
	};
	setProgressDraftLineCorrelationKey(statusLine, correlationKey);
	return statusLine;
}
function shouldPrefixProgressLine(line) {
	return !EMOJI_PREFIX_RE.test(line);
}
function resolveChannelProgressDraftLineOptions(entry, options) {
	return {
		...options,
		commandText: options?.commandText ?? resolveChannelStreamingPreviewCommandText(entry)
	};
}
function buildChannelProgressDraftLineForEntry(entry, input, options) {
	return buildChannelProgressDraftLine(input, resolveChannelProgressDraftLineOptions(entry, options));
}
function buildChannelProgressDraftLine(input, options) {
	switch (input.event) {
		case "tool": {
			const itemId = input.itemId ?? (input.toolCallId ? `tool:${input.toolCallId}` : void 0);
			return buildNamedProgressLine(input.event, input.name, [options?.commandText === "status" && isCommandToolName(input.name) ? void 0 : inferToolMeta(input.name, input.args, options?.detailMode), input.phase && !input.name ? input.phase : void 0], options, {
				correlationKey: isCommandToolName(input.name) ? resolveCommandProgressCorrelationKey(input) : void 0,
				id: itemId
			});
		}
		case "item": {
			const name = input.name ?? itemKindToToolName(input.itemKind);
			const meta = input.meta ?? input.summary ?? (options?.commandText === "status" && isCommandProgressItem(input) ? void 0 : input.progressText);
			if (isEmptyReasoningProgressItem(input, meta)) return;
			if (name) return buildNamedProgressLine(input.event, name, [meta], options, {
				correlationKey: isCommandProgressItem(input) ? resolveCommandProgressCorrelationKey(input) : void 0,
				id: resolveProgressDraftLineId(input),
				status: input.status
			});
			const text = compactStrings([meta, input.title]).at(0);
			const id = resolveProgressDraftLineId(input);
			const correlationKey = isCommandProgressItem(input) ? resolveCommandProgressCorrelationKey(input) : void 0;
			if (!text) return;
			const line = {
				...id ? { id } : {},
				kind: input.event,
				text,
				label: input.title?.trim() || input.itemKind?.trim() || "Update",
				...input.status ? { status: input.status } : {}
			};
			setProgressDraftLineCorrelationKey(line, correlationKey);
			return line;
		}
		case "plan":
			if (input.phase !== void 0 && input.phase !== "update") return;
			return buildNamedProgressLine(input.event, "update_plan", [
				input.explanation,
				normalizeAgentPlanSteps(input.steps)?.[0]?.step,
				input.title ?? "planning"
			], options);
		case "approval":
			if (input.phase !== void 0 && input.phase !== "requested") return;
			return buildNamedProgressLine(input.event, "approval", [
				input.command,
				input.message,
				input.reason,
				input.title ?? "approval requested"
			], options, { status: "requested" });
		case "command-output":
			if (input.phase !== void 0 && input.phase !== "end") return;
			return buildCommandOutputProgressLine(input, input.exitCode === 0 ? "completed" : input.exitCode != null ? `exit ${input.exitCode}` : input.status, options);
		case "patch":
			if (input.phase !== void 0 && input.phase !== "end") return;
			return buildNamedProgressLine(input.event, input.name ?? "apply_patch", patchMetas(input), options, { id: input.itemId ?? input.toolCallId });
	}
}
function createChannelProgressDraftGate(params) {
	const initialDelayMs = params.initialDelayMs ?? 5e3;
	const setTimeoutFn = params.setTimeoutFn ?? setTimeout;
	const clearTimeoutFn = params.clearTimeoutFn ?? clearTimeout;
	const reportStartError = params.onStartError ?? ((error) => {
		console.warn(`[progress-draft] channel progress draft failed to start: ${String(error)}`);
	});
	let started = false;
	let disposed = false;
	let workEvents = 0;
	let timer;
	let startPromise;
	const clearTimer = () => {
		if (timer) {
			clearTimeoutFn(timer);
			timer = void 0;
		}
	};
	const start = () => {
		if (disposed || started) return startPromise ?? Promise.resolve();
		if (startPromise) return startPromise;
		clearTimer();
		started = true;
		const nextStart = Promise.resolve().then(params.onStart).then(() => {
			if (disposed) started = false;
			if (startPromise === nextStart) startPromise = void 0;
		}).catch((error) => {
			if (startPromise === nextStart) startPromise = void 0;
			started = false;
			throw error;
		});
		startPromise = nextStart;
		return startPromise;
	};
	const schedule = () => {
		if (timer || started || disposed || initialDelayMs < 0) return;
		timer = setTimeoutFn(() => {
			timer = void 0;
			start().catch((error) => {
				reportStartError(error);
			});
		}, initialDelayMs);
	};
	return {
		get hasStarted() {
			return started;
		},
		get workEvents() {
			return workEvents;
		},
		async noteWork() {
			if (disposed) return false;
			workEvents += 1;
			if (startPromise) {
				await startPromise;
				return started;
			}
			if (started) return true;
			schedule();
			return false;
		},
		async startNow() {
			await start();
		},
		cancel() {
			disposed = true;
			started = false;
			clearTimer();
		},
		reset() {
			clearTimer();
			started = false;
			disposed = false;
			workEvents = 0;
			startPromise = void 0;
		}
	};
}
function getChannelStreamingConfigObject(entry) {
	const streaming = asObjectRecord(entry?.streaming);
	return streaming ? streaming : void 0;
}
function resolveChannelStreamingPreviewToolProgress(entry, defaultValue = true) {
	const config = getChannelStreamingConfigObject(entry);
	if (resolveChannelPreviewStreamMode(entry, "partial") === "progress") return require_boolean.asBoolean(config?.progress?.toolProgress) ?? require_boolean.asBoolean(config?.preview?.toolProgress) ?? defaultValue;
	return require_boolean.asBoolean(config?.preview?.toolProgress) ?? defaultValue;
}
function resolveChannelStreamingProgressCommentary(entry, defaultValue = false) {
	const config = getChannelStreamingConfigObject(entry);
	if (resolveChannelPreviewStreamMode(entry, "partial") !== "progress") return false;
	return require_boolean.asBoolean(asObjectRecord(config?.progress)?.commentary) ?? defaultValue;
}
function resolveChannelStreamingPreviewCommandText(entry, defaultValue = "raw") {
	const config = getChannelStreamingConfigObject(entry);
	return asCommandTextMode(config?.progress?.commandText) ?? asCommandTextMode(config?.preview?.commandText) ?? defaultValue;
}
function resolveChannelStreamingSuppressDefaultToolProgressMessages(entry, options) {
	if (options?.draftStreamActive === false || options?.previewStreamingEnabled === false) return false;
	const mode = resolveChannelPreviewStreamMode(entry, "off");
	if (mode === "off") return false;
	if (mode === "progress") return true;
	if (options?.draftStreamActive === true) return true;
	return options?.previewToolProgressEnabled ?? resolveChannelStreamingPreviewToolProgress(entry);
}
function resolveChannelPreviewStreamMode(entry, defaultMode) {
	const streamingConfig = getChannelStreamingConfigObject(entry);
	const parsedStreaming = parsePreviewStreamingMode(streamingConfig?.mode ?? entry?.streaming);
	if (parsedStreaming) {
		if (!streamingConfig) warnFlatStreamingKeyFallback("streaming", "mode");
		return parsedStreaming;
	}
	if (typeof entry?.streaming === "boolean") {
		warnFlatStreamingKeyFallback("streaming", "mode");
		return entry.streaming ? "partial" : "off";
	}
	return defaultMode;
}
function resolveChannelProgressDraftConfig(entry) {
	return asProgressConfig(getChannelStreamingConfigObject(entry)?.progress) ?? {};
}
function normalizeProgressLabels(labels) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeTrimmedStringList)(labels);
	if (normalized.length === 0) return [...DEFAULT_PROGRESS_DRAFT_LABELS];
	return normalized;
}
function resolveChannelProgressDraftLabel(params) {
	const progress = resolveChannelProgressDraftConfig(params.entry);
	if (progress.label === false) return;
	const normalizedLabel = typeof progress.label === "string" ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(progress.label) : null;
	if (typeof progress.label === "string" && progress.label.trim() && normalizedLabel !== "auto") return progress.label.trim();
	return selectProgressLabel({
		labels: normalizeProgressLabels(progress.labels),
		seed: params.seed,
		random: params.random
	});
}
function resolveChannelProgressDraftMaxLines(entry, defaultValue = 8) {
	const configured = asInteger(resolveChannelProgressDraftConfig(entry).maxLines);
	return configured && configured > 0 ? configured : defaultValue;
}
function resolveChannelProgressDraftMaxLineChars(entry, defaultValue = DEFAULT_PROGRESS_DRAFT_MAX_LINE_CHARS) {
	const configured = asInteger(resolveChannelProgressDraftConfig(entry).maxLineChars);
	return configured && configured > 0 ? configured : defaultValue;
}
function sliceCodePoints(value, start, end) {
	return Array.from(value).slice(start, end).join("");
}
function compactProgressLineDetail(detail, maxChars) {
	const chars = Array.from(detail);
	if (chars.length <= maxChars) return detail;
	if (maxChars <= 1) return "…";
	const keepStart = Math.max(1, Math.ceil((maxChars - 1) * .45));
	const keepEnd = Math.max(1, maxChars - keepStart - 1);
	const rawStart = chars.slice(0, keepStart).join("").trimEnd();
	return `${rawStart.length > 8 && /\s+\S+$/.test(rawStart) ? rawStart.replace(/\s+\S+$/, "") : rawStart}…${chars.slice(-keepEnd).join("").trimStart()}`;
}
function removeUnbalancedInlineBackticks(value) {
	if (Array.from(value).filter((char) => char === "`").length % 2 === 0) return value;
	return value.trimStart().startsWith("`") ? value.replaceAll("`", "'") : value.replaceAll("`", "");
}
function repairCompactedProgressMarkdown(value) {
	const withoutDanglingBackticks = removeUnbalancedInlineBackticks(value);
	const trimmedStart = withoutDanglingBackticks.trimStart();
	if (!trimmedStart.startsWith("_") || trimmedStart.endsWith("_")) return withoutDanglingBackticks;
	if (Array.from(trimmedStart).filter((char) => char === "_").length % 2 === 0) return withoutDanglingBackticks;
	return `${withoutDanglingBackticks.slice(0, withoutDanglingBackticks.length - trimmedStart.length)}${trimmedStart.slice(1)}`;
}
function compactChannelProgressDraftNarration(text) {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (Array.from(normalized).length <= PROGRESS_DRAFT_NARRATION_MAX_CHARS) return normalized;
	return compactPlainProgressLine(normalized, PROGRESS_DRAFT_NARRATION_MAX_CHARS);
}
function compactPlainProgressLine(line, maxChars) {
	const head = sliceCodePoints(line, 0, maxChars - 1).trimEnd();
	const boundary = head.search(/\s+\S*$/u);
	if (boundary > Math.floor(maxChars * .6)) return `${head.slice(0, boundary).trimEnd()}…`;
	return `${head}…`;
}
function compactChannelProgressDraftLine(line, maxChars) {
	const normalized = line.replace(/\s+/g, " ").trim();
	if (!normalized) return "";
	if (Array.from(normalized).length <= maxChars) return normalized;
	if (maxChars <= 1) return "…";
	const compactWithPrefix = (prefix, detail) => {
		const detailLimit = maxChars - Array.from(prefix).length;
		if (detailLimit < 8) return;
		return repairCompactedProgressMarkdown(`${prefix}${compactProgressLineDetail(detail, detailLimit)}`);
	};
	const splitIndex = normalized.indexOf(": ");
	if (splitIndex > 0) {
		const compact = compactWithPrefix(normalized.slice(0, splitIndex + 2), normalized.slice(splitIndex + 2));
		if (compact) return compact;
	}
	const compactCommandPrefixMatch = normalized.match(/^🛠️\s+/u);
	if (compactCommandPrefixMatch) {
		const prefix = compactCommandPrefixMatch[0];
		const compact = compactWithPrefix(prefix, normalized.slice(prefix.length));
		if (compact) return compact;
	}
	return repairCompactedProgressMarkdown(compactPlainProgressLine(normalized, maxChars));
}
function formatPlanChecklistLines(steps, options) {
	const normalizedSteps = steps.map((entry, index) => ({
		...entry,
		step: entry.step.replace(/\s+/g, " ").trim(),
		index
	})).filter((entry) => entry.step);
	if (normalizedSteps.length === 0 || options.maxLines <= 0) return [];
	const maxLines = Math.max(1, options.maxLines);
	const marker = (status) => status === "completed" ? "✅" : status === "in_progress" ? "▸" : "▢";
	const formatStep = (entry) => compactChannelProgressDraftLine(`${marker(entry.status)} ${entry.step}`, options.maxLineChars);
	if (normalizedSteps.length <= maxLines) return normalizedSteps.map(formatStep);
	const availableSteps = maxLines - 1;
	if (availableSteps === 0) {
		const completedCount = normalizedSteps.filter((entry) => entry.status === "completed").length;
		return [compactChannelProgressDraftLine(`✅ ${completedCount}/${normalizedSteps.length} done`, options.maxLineChars)];
	}
	const pendingSteps = normalizedSteps.filter((entry) => entry.status !== "completed");
	const activeStep = pendingSteps.find((entry) => entry.status === "in_progress");
	const pendingSlots = Math.max(0, availableSteps - (activeStep ? 1 : 0));
	const pendingTail = pendingSlots === 0 ? [] : pendingSteps.filter((entry) => entry !== activeStep).slice(-pendingSlots);
	const visiblePending = [...activeStep ? [activeStep] : [], ...pendingTail];
	const completedSlots = Math.max(0, availableSteps - visiblePending.length);
	const visibleSteps = [...completedSlots > 0 ? normalizedSteps.filter((entry) => entry.status === "completed").slice(-completedSlots) : [], ...visiblePending].toSorted((a, b) => a.index - b.index);
	return [compactChannelProgressDraftLine(`✅ ${normalizedSteps.length - pendingSteps.length}/${normalizedSteps.length} done`, options.maxLineChars), ...visibleSteps.map(formatStep)];
}
function getProgressDraftLineText(line) {
	if (typeof line === "string") return line;
	const icon = line.icon?.trim();
	const prefix = icon ? `${icon} ` : "";
	const label = line.label.trim();
	const detail = line.detail?.trim();
	const status = line.status?.trim();
	const displayStatus = status === "completed" ? void 0 : status;
	if (detail) {
		const compactCommandLine = line.toolName === "exec" || line.toolName === "bash" || line.toolName === "shell";
		if (line.kind === "command-output" && displayStatus && detail !== displayStatus) {
			const outputDetail = detail.startsWith(`${displayStatus};`) ? detail : `${displayStatus}; ${detail}`;
			if (compactCommandLine) return `${prefix}${outputDetail}`;
			return label ? `${prefix}${label}: ${outputDetail}` : `${prefix}${outputDetail}`;
		}
		if (line.kind !== "patch" && label && !compactCommandLine) return `${prefix}${label}: ${detail}`;
		return `${prefix}${detail}`;
	}
	if (displayStatus) {
		if (label) return `${prefix}${label}: ${displayStatus}`;
		return `${prefix}${displayStatus}`;
	}
	const text = line.text.trim();
	if (!icon && text && text !== label) return text;
	return `${prefix}${label}`.trim();
}
function normalizeChannelProgressDraftLineIdentity(line) {
	return (typeof line === "string" ? line : line ? getProgressDraftLineText(line) : void 0)?.replace(/`([^`]+)`/gu, "$1").replace(/\s+/g, " ").trim() ?? "";
}
function mergeChannelProgressDraftLine(lines, line, params) {
	const normalized = normalizeChannelProgressDraftLineIdentity(line);
	if (!normalized) return lines;
	const maxLines = Math.max(1, params.maxLines);
	const lineKeys = resolveProgressDraftLineMergeKeys(line);
	if (lineKeys.length > 0) {
		const existingIndex = lines.findIndex((entry) => resolveProgressDraftLineMergeKeys(entry).some((entryKey) => lineKeys.includes(entryKey)));
		if (existingIndex >= 0) {
			const replacement = mergeProgressDraftLineUpdate((0, _gabrielvfonseca_normalization_core.expectDefined)(lines[existingIndex], "lines entry at existing index"), line);
			if (replacement === lines[existingIndex]) return lines;
			const next = [...lines];
			next[existingIndex] = replacement;
			return next.slice(-maxLines);
		}
	}
	const previous = lines.at(-1);
	if (previous && normalizeChannelProgressDraftLineIdentity(previous) === normalized) return lines;
	return [...lines, line].slice(-maxLines);
}
function mergeProgressDraftLineUpdate(previous, line) {
	if (typeof previous !== "object" || typeof line !== "object") return line;
	if (line.kind !== "command-output" || !line.status || line.detail && line.detail !== line.status) return line;
	const previousDetail = previous.detail?.trim();
	if (!previousDetail || previousDetail === previous.status || isTerminalProgressStatus(previous.status)) return line;
	const replacement = {
		...line,
		detail: previousDetail
	};
	replacement.text = getProgressDraftLineText(replacement);
	setProgressDraftLineCorrelationKey(replacement, progressDraftLineCorrelationKeys.get(line) ?? progressDraftLineCorrelationKeys.get(previous));
	return replacement;
}
function resolveProgressDraftLineMergeKeys(line) {
	if (typeof line !== "object") return [];
	const keys = [progressDraftLineCorrelationKeys.get(line), line.id].map((key) => key?.trim()).filter((key) => Boolean(key));
	return [...new Set(keys)];
}
function formatChannelProgressDraftText(params) {
	const narration = params.narration ? compactChannelProgressDraftNarration(params.narration) : "";
	const progress = resolveChannelProgressDraftConfig(params.entry);
	const maxLines = resolveChannelProgressDraftMaxLines(params.entry);
	const maxLineChars = resolveChannelProgressDraftMaxLineChars(params.entry);
	const formatLine = params.formatLine ?? ((line) => line);
	const planLines = formatPlanChecklistLines(params.plan ?? [], {
		maxLines,
		maxLineChars
	}).map(formatLine);
	const hasConfiguredLabel = progress.label !== void 0 || progress.labels !== void 0;
	const resolvedLabel = narration && !hasConfiguredLabel ? void 0 : resolveChannelProgressDraftLabel({
		entry: params.entry,
		seed: params.seed,
		random: params.random
	});
	if (narration) {
		const formatted = formatLine(narration);
		const status = resolvedLabel ? `${resolvedLabel}\n\n${formatted}` : formatted;
		return planLines.length > 0 ? `${status}\n\n${planLines.join("\n")}` : status;
	}
	const bullet = params.bullet ?? "•";
	const toolLineBudget = planLines.length > 0 ? Math.max(0, maxLines - planLines.length) : maxLines;
	const visibleToolLines = planLines.length === 0 ? params.lines : toolLineBudget === 0 ? [] : params.lines.slice(-toolLineBudget);
	const rawLines = resolvedLabel ? [{ draftLabel: resolvedLabel }, ...visibleToolLines] : visibleToolLines;
	const rollingLineLimit = planLines.length > 0 ? toolLineBudget + (resolvedLabel ? 1 : 0) : maxLines;
	const lines = rawLines.map((line) => {
		const isLabelLine = typeof line === "object" && line !== null && "draftLabel" in line;
		const prefix = !isLabelLine && typeof line === "object" && line !== null ? line.prefix !== false : true;
		const text = compactChannelProgressDraftLine(isLabelLine ? line.draftLabel : typeof line === "string" ? line : getProgressDraftLineText(line), maxLineChars);
		return text ? {
			text,
			isLabelLine,
			prefix
		} : void 0;
	}).filter((line) => Boolean(line)).slice(-rollingLineLimit).map(({ text, isLabelLine, prefix }) => {
		const formatted = isLabelLine ? text : formatLine(text);
		return {
			text: !isLabelLine && prefix && shouldPrefixProgressLine(text) ? `${bullet} ${formatted}` : formatted,
			isLabelLine
		};
	});
	const renderedLines = lines.map((line) => line.text).filter((line) => Boolean(line));
	if (planLines.length > 0) renderedLines.push(...planLines);
	if (renderedLines.length > 1 && lines[0]?.isLabelLine) return `${renderedLines[0]}\n\n${renderedLines.slice(1).join("\n")}`;
	return renderedLines.join("\n");
}
//#endregion
//#region src/auto-reply/chunk.ts
const DEFAULT_CHUNK_LIMIT = 4e3;
const DEFAULT_CHUNK_MODE = "length";
function resolveChunkLimitForProvider(cfgSection, accountId) {
	if (!cfgSection) return;
	const normalizedAccountId = require_account_id.normalizeAccountId(accountId);
	const accounts = cfgSection.accounts;
	if (accounts && typeof accounts === "object") {
		const direct = require_account_lookup.resolveAccountEntry(accounts, normalizedAccountId);
		if (typeof direct?.textChunkLimit === "number") return direct.textChunkLimit;
	}
	return cfgSection.textChunkLimit;
}
function resolveTextChunkLimit(cfg, provider, accountId, opts) {
	const fallback = typeof opts?.fallbackLimit === "number" && opts.fallbackLimit > 0 ? opts.fallbackLimit : DEFAULT_CHUNK_LIMIT;
	const providerOverride = (() => {
		if (!provider || provider === "webchat") return;
		return resolveChunkLimitForProvider((cfg?.channels)?.[provider] ?? cfg?.[provider], accountId);
	})();
	if (typeof providerOverride === "number" && providerOverride > 0) return providerOverride;
	return fallback;
}
function resolveChunkModeForProvider(cfgSection, accountId) {
	if (!cfgSection) return;
	const normalizedAccountId = require_account_id.normalizeAccountId(accountId);
	const accounts = cfgSection.accounts;
	if (accounts && typeof accounts === "object") {
		const directMode = resolveChannelStreamingChunkMode(require_account_lookup.resolveAccountEntry(accounts, normalizedAccountId));
		if (directMode) return directMode;
	}
	return resolveChannelStreamingChunkMode(cfgSection);
}
function resolveChunkMode(cfg, provider, accountId) {
	if (!provider || provider === "webchat") return DEFAULT_CHUNK_MODE;
	return resolveChunkModeForProvider((cfg?.channels)?.[provider] ?? cfg?.[provider], accountId) ?? DEFAULT_CHUNK_MODE;
}
/**
* Split text on newlines, trimming line whitespace.
* Blank lines are folded into the next non-empty line as leading "\n" prefixes.
* Long lines can be split by length (default) or kept intact via splitLongLines:false.
*/
function chunkByNewline(text, maxLineLength, opts) {
	if (!text) return [];
	if (maxLineLength <= 0) return text.trim() ? [text] : [];
	const splitLongLines = opts?.splitLongLines !== false;
	const trimLines = opts?.trimLines !== false;
	const lines = splitByNewline(text, opts?.isSafeBreak);
	const chunks = [];
	let pendingBlankLines = 0;
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) {
			pendingBlankLines += 1;
			continue;
		}
		const maxPrefix = Math.max(0, maxLineLength - 1);
		const cappedBlankLines = pendingBlankLines > 0 ? Math.min(pendingBlankLines, maxPrefix) : 0;
		const prefix = cappedBlankLines > 0 ? "\n".repeat(cappedBlankLines) : "";
		pendingBlankLines = 0;
		const lineValue = trimLines ? trimmed : line;
		if (!splitLongLines || lineValue.length + prefix.length <= maxLineLength) {
			chunks.push(prefix + lineValue);
			continue;
		}
		const firstLimit = (0, _gabrielvfonseca_normalization_core_utf16_slice.avoidTrailingHighSurrogateBreak)(lineValue, 0, Math.max(1, maxLineLength - prefix.length));
		const first = lineValue.slice(0, firstLimit);
		chunks.push(prefix + first);
		const remaining = lineValue.slice(firstLimit);
		if (remaining) chunks.push(...chunkText(remaining, maxLineLength));
	}
	if (pendingBlankLines > 0 && chunks.length > 0) chunks[chunks.length - 1] += "\n".repeat(pendingBlankLines);
	return chunks;
}
/**
* Split text into chunks on paragraph boundaries (blank lines), preserving lists and
* single-newline line wraps inside paragraphs.
*
* - Only breaks at paragraph separators ("\n\n" or more, allowing whitespace on blank lines)
* - Packs multiple paragraphs into a single chunk up to `limit`
* - Falls back to length-based splitting when a single paragraph exceeds `limit`
*   (unless `splitLongParagraphs` is disabled)
*/
function chunkByParagraph(text, limit, opts) {
	if (!text) return [];
	if (limit <= 0) return [text];
	const splitLongParagraphs = opts?.splitLongParagraphs !== false;
	const normalized = text.replace(/\r\n?/g, "\n");
	if (!/\n[\t ]*\n+/.test(normalized)) {
		if (normalized.length <= limit) return [normalized];
		if (!splitLongParagraphs) return [normalized];
		return chunkText(normalized, limit);
	}
	const spans = require_fences.parseFenceSpans(normalized);
	const parts = [];
	const separators = [];
	const re = /\n[\t ]*\n+/g;
	let lastIndex = 0;
	for (const match of normalized.matchAll(re)) {
		const idx = match.index ?? 0;
		if (!require_fences.isSafeFenceBreak(spans, idx)) continue;
		parts.push(normalized.slice(lastIndex, idx));
		separators.push(match[0]);
		lastIndex = idx + match[0].length;
	}
	parts.push(normalized.slice(lastIndex));
	const chunks = [];
	let currentChunk = "";
	const pushParagraph = (paragraph, separatorBefore) => {
		if (!currentChunk) {
			if (paragraph.length <= limit) {
				currentChunk = paragraph;
				return;
			}
			if (!splitLongParagraphs) {
				chunks.push(paragraph);
				return;
			}
			chunks.push(...chunkText(paragraph, limit));
			return;
		}
		const candidate = `${currentChunk}${separatorBefore ?? "\n\n"}${paragraph}`;
		if (candidate.length <= limit) {
			currentChunk = candidate;
			return;
		}
		chunks.push(currentChunk);
		currentChunk = "";
		pushParagraph(paragraph);
	};
	for (const [index, part] of parts.entries()) {
		const paragraph = part.replace(/\s+$/g, "");
		if (!paragraph.trim()) continue;
		pushParagraph(paragraph, separators[index - 1]);
	}
	if (currentChunk) chunks.push(currentChunk);
	return chunks;
}
/**
* Unified chunking function that dispatches based on mode.
*/
function chunkTextWithMode(text, limit, mode) {
	if (mode === "newline") return chunkByParagraph(text, limit);
	return chunkText(text, limit);
}
function chunkMarkdownTextWithMode(text, limit, mode) {
	if (mode === "newline") {
		const paragraphChunks = chunkByParagraph(text, limit, { splitLongParagraphs: false });
		const out = [];
		for (const chunk of paragraphChunks.flatMap((paragraphChunk) => paragraphChunk.length > limit ? splitPackedFenceParagraphChunk(paragraphChunk) : paragraphChunk)) out.push(...chunkMarkdownText(chunk, limit));
		return out;
	}
	return chunkMarkdownText(text, limit);
}
function splitByNewline(text, isSafeBreak = () => true) {
	const lines = [];
	let start = 0;
	for (let i = 0; i < text.length; i++) if (text[i] === "\n" && isSafeBreak(i)) {
		lines.push(text.slice(start, i));
		start = i + 1;
	}
	lines.push(text.slice(start));
	return lines;
}
function splitPackedFenceParagraphChunk(chunk) {
	const chunks = [];
	let start = 0;
	for (const span of require_fences.parseFenceSpans(chunk)) {
		if (span.end <= start) continue;
		const separator = chunk.slice(span.end).match(/^\n[\t ]*\n+/)?.[0];
		if (!separator) continue;
		if (!chunk.slice(span.end + separator.length).trim()) continue;
		chunks.push(chunk.slice(start, span.end));
		start = span.end + separator.length;
	}
	if (chunks.length === 0) return [chunk];
	const tail = chunk.slice(start);
	if (tail) chunks.push(tail);
	return chunks;
}
function resolveChunkEarlyReturn(text, limit) {
	if (!text) return [];
	if (limit <= 0) return [text];
	if (text.length <= limit) return [text];
}
function chunkText(text, limit) {
	const early = resolveChunkEarlyReturn(text, limit);
	if (early) return early;
	return require_text_chunking.chunkTextByBreakResolver(text, limit, (window) => {
		const { lastNewline, lastWhitespace } = scanParenAwareBreakpoints(window, 0, window.length);
		return lastNewline > 0 ? lastNewline : lastWhitespace;
	});
}
function chunkMarkdownText(text, limit) {
	const early = resolveChunkEarlyReturn(text, limit);
	if (early) return early;
	const chunks = [];
	const spans = require_fences.parseFenceSpans(text);
	let start = 0;
	let reopenFence;
	while (start < text.length) {
		const reopenPrefix = reopenFence ? `${reopenFence.openLine}\n` : "";
		const contentLimit = Math.max(1, limit - reopenPrefix.length);
		if (text.length - start <= contentLimit) {
			const finalChunk = `${reopenPrefix}${text.slice(start)}`;
			if (finalChunk.length > 0) chunks.push(finalChunk);
			break;
		}
		const windowEnd = Math.min(text.length, start + contentLimit);
		const softBreak = pickSafeBreakIndex(text, start, windowEnd, spans);
		let breakIdx = softBreak > start ? softBreak : windowEnd;
		const initialFence = require_fences.isSafeFenceBreak(spans, breakIdx) ? void 0 : require_fences.findFenceSpanAt(spans, breakIdx);
		let fenceToSplit = initialFence;
		if (initialFence) {
			const closeLine = `${initialFence.indent}${initialFence.marker}`;
			const maxIdxIfNeedNewline = start + (contentLimit - (closeLine.length + 1));
			if (maxIdxIfNeedNewline <= start) breakIdx = windowEnd;
			else {
				const minProgressIdx = Math.min(text.length, Math.max(start + 1, initialFence.start + initialFence.openLine.length + 2));
				const maxIdxIfAlreadyNewline = start + (contentLimit - closeLine.length);
				let pickedNewline = false;
				let lastNewline = text.lastIndexOf("\n", Math.max(start, maxIdxIfAlreadyNewline - 1));
				while (lastNewline >= start) {
					const candidateBreak = lastNewline + 1;
					if (candidateBreak < minProgressIdx) break;
					const candidateFence = require_fences.findFenceSpanAt(spans, candidateBreak);
					if (candidateFence && candidateFence.start === initialFence.start) {
						breakIdx = candidateBreak;
						pickedNewline = true;
						break;
					}
					lastNewline = text.lastIndexOf("\n", lastNewline - 1);
				}
				if (!pickedNewline) if (minProgressIdx > maxIdxIfAlreadyNewline) breakIdx = windowEnd;
				else breakIdx = Math.max(minProgressIdx, maxIdxIfNeedNewline);
			}
			const fenceAtBreak = require_fences.findFenceSpanAt(spans, breakIdx);
			fenceToSplit = fenceAtBreak && fenceAtBreak.start === initialFence.start ? fenceAtBreak : void 0;
		}
		const safeBreakIdx = (0, _gabrielvfonseca_normalization_core_utf16_slice.avoidTrailingHighSurrogateBreak)(text, start, breakIdx);
		if (safeBreakIdx !== breakIdx) {
			breakIdx = safeBreakIdx;
			if (fenceToSplit) {
				const fenceAtBreak = require_fences.findFenceSpanAt(spans, breakIdx);
				fenceToSplit = fenceAtBreak && fenceAtBreak.start === fenceToSplit.start ? fenceAtBreak : void 0;
			}
		}
		const rawContent = text.slice(start, breakIdx);
		if (!rawContent) break;
		let rawChunk = `${reopenPrefix}${rawContent}`;
		const brokeOnSeparator = breakIdx < text.length && /\s/.test(text.charAt(breakIdx));
		let nextStart = Math.min(text.length, breakIdx + (brokeOnSeparator ? 1 : 0));
		if (fenceToSplit) {
			const closeLine = `${fenceToSplit.indent}${fenceToSplit.marker}`;
			rawChunk = rawChunk.endsWith("\n") ? `${rawChunk}${closeLine}` : `${rawChunk}\n${closeLine}`;
			reopenFence = fenceToSplit;
		} else {
			nextStart = skipLeadingNewlines(text, nextStart);
			reopenFence = void 0;
		}
		chunks.push(rawChunk);
		start = nextStart;
	}
	return chunks;
}
function skipLeadingNewlines(value, start = 0) {
	let i = start;
	while (i < value.length && value[i] === "\n") i++;
	return i;
}
function pickSafeBreakIndex(text, start, end, spans) {
	const { lastNewline, lastWhitespace } = scanParenAwareBreakpoints(text, start, end, (index) => require_fences.isSafeFenceBreak(spans, index));
	if (lastNewline > start) return lastNewline;
	if (lastWhitespace > start) return lastWhitespace;
	return -1;
}
function scanParenAwareBreakpoints(text, start, end, isAllowed = () => true) {
	let lastNewline = -1;
	let lastWhitespace = -1;
	let depth = 0;
	for (let i = start; i < end; i++) {
		if (!isAllowed(i)) continue;
		const char = text.charAt(i);
		if (char === "(") {
			depth += 1;
			continue;
		}
		if (char === ")" && depth > 0) {
			depth -= 1;
			continue;
		}
		if (depth !== 0) continue;
		if (char === "\n") lastNewline = i;
		else if (/\s/.test(char)) lastWhitespace = i;
	}
	return {
		lastNewline,
		lastWhitespace
	};
}
//#endregion
Object.defineProperty(exports, "buildChannelProgressDraftLine", {
	enumerable: true,
	get: function() {
		return buildChannelProgressDraftLine;
	}
});
Object.defineProperty(exports, "buildChannelProgressDraftLineForEntry", {
	enumerable: true,
	get: function() {
		return buildChannelProgressDraftLineForEntry;
	}
});
Object.defineProperty(exports, "buildPlanUpdateStepFields", {
	enumerable: true,
	get: function() {
		return buildPlanUpdateStepFields;
	}
});
Object.defineProperty(exports, "chunkByNewline", {
	enumerable: true,
	get: function() {
		return chunkByNewline;
	}
});
Object.defineProperty(exports, "chunkByParagraph", {
	enumerable: true,
	get: function() {
		return chunkByParagraph;
	}
});
Object.defineProperty(exports, "chunkMarkdownText", {
	enumerable: true,
	get: function() {
		return chunkMarkdownText;
	}
});
Object.defineProperty(exports, "chunkMarkdownTextWithMode", {
	enumerable: true,
	get: function() {
		return chunkMarkdownTextWithMode;
	}
});
Object.defineProperty(exports, "chunkText", {
	enumerable: true,
	get: function() {
		return chunkText;
	}
});
Object.defineProperty(exports, "chunkTextWithMode", {
	enumerable: true,
	get: function() {
		return chunkTextWithMode;
	}
});
Object.defineProperty(exports, "createChannelProgressDraftGate", {
	enumerable: true,
	get: function() {
		return createChannelProgressDraftGate;
	}
});
Object.defineProperty(exports, "formatChannelProgressDraftText", {
	enumerable: true,
	get: function() {
		return formatChannelProgressDraftText;
	}
});
Object.defineProperty(exports, "formatPlanChecklistLines", {
	enumerable: true,
	get: function() {
		return formatPlanChecklistLines;
	}
});
Object.defineProperty(exports, "formatToolAggregate", {
	enumerable: true,
	get: function() {
		return formatToolAggregate;
	}
});
Object.defineProperty(exports, "isChannelProgressDraftWorkToolName", {
	enumerable: true,
	get: function() {
		return isChannelProgressDraftWorkToolName;
	}
});
Object.defineProperty(exports, "isCommandToolName", {
	enumerable: true,
	get: function() {
		return isCommandToolName;
	}
});
Object.defineProperty(exports, "mergeChannelProgressDraftLine", {
	enumerable: true,
	get: function() {
		return mergeChannelProgressDraftLine;
	}
});
Object.defineProperty(exports, "normalizeAgentPlanSteps", {
	enumerable: true,
	get: function() {
		return normalizeAgentPlanSteps;
	}
});
Object.defineProperty(exports, "normalizeChannelProgressDraftLineIdentity", {
	enumerable: true,
	get: function() {
		return normalizeChannelProgressDraftLineIdentity;
	}
});
Object.defineProperty(exports, "resolveChannelPreviewStreamMode", {
	enumerable: true,
	get: function() {
		return resolveChannelPreviewStreamMode;
	}
});
Object.defineProperty(exports, "resolveChannelProgressDraftMaxLines", {
	enumerable: true,
	get: function() {
		return resolveChannelProgressDraftMaxLines;
	}
});
Object.defineProperty(exports, "resolveChannelStreamingBlockCoalesce", {
	enumerable: true,
	get: function() {
		return resolveChannelStreamingBlockCoalesce;
	}
});
Object.defineProperty(exports, "resolveChannelStreamingBlockEnabled", {
	enumerable: true,
	get: function() {
		return resolveChannelStreamingBlockEnabled;
	}
});
Object.defineProperty(exports, "resolveChannelStreamingPreviewToolProgress", {
	enumerable: true,
	get: function() {
		return resolveChannelStreamingPreviewToolProgress;
	}
});
Object.defineProperty(exports, "resolveChannelStreamingProgressCommentary", {
	enumerable: true,
	get: function() {
		return resolveChannelStreamingProgressCommentary;
	}
});
Object.defineProperty(exports, "resolveChannelStreamingSuppressDefaultToolProgressMessages", {
	enumerable: true,
	get: function() {
		return resolveChannelStreamingSuppressDefaultToolProgressMessages;
	}
});
Object.defineProperty(exports, "resolveChunkMode", {
	enumerable: true,
	get: function() {
		return resolveChunkMode;
	}
});
Object.defineProperty(exports, "resolveTextChunkLimit", {
	enumerable: true,
	get: function() {
		return resolveTextChunkLimit;
	}
});
