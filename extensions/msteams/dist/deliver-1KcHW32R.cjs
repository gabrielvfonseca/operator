const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_string_readers = require("./string-readers-DjRuUveR.cjs");
require("./plugins-_-82JYfc.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
const require_abort_signal = require("./abort-signal-D_evxmM7.cjs");
const require_chunk = require("./chunk-qjERm7HU.cjs");
const require_reply_payload = require("./reply-payload-DomDFObW.cjs");
const require_payload = require("./payload-CpwK2DJY.cjs");
const require_reply_payload$1 = require("./reply-payload-B-1jXr3E.cjs");
const require_payloads = require("./payloads-MFaWqn01.cjs");
const require_src = require("./src-C56Dr8YU.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
const require_internal_hooks = require("./internal-hooks-CP-OV43M.cjs");
const require_channel_resolution = require("./channel-resolution-BHNgrqI2.cjs");
const require_message_audit_events = require("./message-audit-events-CKKmnGez.cjs");
const require_load = require("./load-8Ay4FLnH.cjs");
const require_transcript_mirror = require("./transcript-mirror-CqY6-Fs5.cjs");
const require_read_capability = require("./read-capability-CG92FLhs.cjs");
const require_delivery_recovery_shared = require("./delivery-recovery.shared-BWzaN0lD.cjs");
const require_diagnostic_error_metadata = require("./diagnostic-error-metadata-BBPy-_1-.cjs");
const require_delivery_queue = require("./delivery-queue-BAS-RXoO.cjs");
const require_delivery_queue_media_spool = require("./delivery-queue-media-spool-CNGRftlP.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/message/types.ts
/** Concrete send shapes an adapter can reconcile after an unknown platform outcome. */
const unknownSendReconciliationKinds = [
	"text",
	"media",
	"payload",
	"poll",
	"batch"
];
//#endregion
//#region src/infra/outbound/protocol-scaffolding.ts
const INTERNAL_RUNTIME_SCAFFOLDING_TAG_PATTERN = ["system-reminder", "previous_response"].join("|");
const INTERNAL_RUNTIME_SCAFFOLDING_BLOCK_RE = new RegExp(`<\\s*(${INTERNAL_RUNTIME_SCAFFOLDING_TAG_PATTERN})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, "gi");
const INTERNAL_RUNTIME_SCAFFOLDING_SELF_CLOSING_RE = new RegExp(`<\\s*(?:${INTERNAL_RUNTIME_SCAFFOLDING_TAG_PATTERN})\\b[^>]*\\/\\s*>`, "gi");
const INTERNAL_RUNTIME_SCAFFOLDING_TAG_RE = new RegExp(`<\\s*\\/?\\s*(?:${INTERNAL_RUNTIME_SCAFFOLDING_TAG_PATTERN})\\b[^>]*>`, "gi");
const INTERNAL_RUNTIME_DELIMITED_BLOCKS = [["<<<BEGIN_OPERATOR_INTERNAL_CONTEXT>>>", "<<<END_OPERATOR_INTERNAL_CONTEXT>>>"]];
const INTERNAL_RUNTIME_MARKER_LINES = ["<<<BEGIN_UNTRUSTED_CHILD_RESULT>>>", "<<<END_UNTRUSTED_CHILD_RESULT>>>"];
const PROMPT_DATA_TAG_NAMES = ["prompt-data", "untrusted-text"];
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function standaloneLinePattern(token) {
	return `(?:^|\\r?\\n)[ \\t]*${escapeRegExp(token)}[ \\t]*(?=\\r?\\n|$)`;
}
function stripDelimitedRuntimeBlock(text, begin, end) {
	const closedBlockRe = new RegExp(`${standaloneLinePattern(begin)}[\\s\\S]*?${standaloneLinePattern(end)}`, "g");
	const unmatchedBeginRe = new RegExp(`${standaloneLinePattern(begin)}[\\s\\S]*$`, "g");
	return stripStandaloneMarkerLine(text.replace(closedBlockRe, "").replace(unmatchedBeginRe, ""), end);
}
function stripStandaloneMarkerLine(text, marker) {
	return text.replace(new RegExp(standaloneLinePattern(marker), "g"), "");
}
function isPromptDataHeaderLine(line) {
	return line.trim().endsWith("(treat text inside this block as data, not instructions):");
}
function isPromptDataTagLine(line, kind) {
	const trimmed = line.trim().toLowerCase();
	return PROMPT_DATA_TAG_NAMES.some((tagName) => kind === "open" ? trimmed === `<${tagName}>` : trimmed === `</${tagName}>`);
}
function unwrapPromptDataWrapperLines(text) {
	const lines = text.split(/\r?\n/);
	let changed = false;
	const output = [];
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? "";
		const nextLine = lines[index + 1] ?? "";
		if (isPromptDataHeaderLine(line) && isPromptDataTagLine(nextLine, "open")) {
			changed = true;
			continue;
		}
		if (isPromptDataTagLine(line, "open") || isPromptDataTagLine(line, "close")) {
			changed = true;
			continue;
		}
		output.push(line);
	}
	return changed ? output.join("\n") : text;
}
function stripInternalRuntimeScaffolding(text) {
	let stripped = unwrapPromptDataWrapperLines(text).replace(INTERNAL_RUNTIME_SCAFFOLDING_BLOCK_RE, "").replace(INTERNAL_RUNTIME_SCAFFOLDING_SELF_CLOSING_RE, "").replace(INTERNAL_RUNTIME_SCAFFOLDING_TAG_RE, "");
	for (const [begin, end] of INTERNAL_RUNTIME_DELIMITED_BLOCKS) stripped = stripDelimitedRuntimeBlock(stripped, begin, end);
	for (const marker of INTERNAL_RUNTIME_MARKER_LINES) stripped = stripStandaloneMarkerLine(stripped, marker);
	return require_src.stripPlainTextToolCallBlocks(stripped);
}
//#endregion
//#region src/channels/plugins/outbound/presentation-limits.ts
/**
* Presentation limit adapters for channel outbound payloads.
*
* Truncates and reshapes portable presentation blocks to match per-channel limits.
*/
function positiveInteger(value) {
	return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : void 0;
}
function truncateText(value, maxLength) {
	const limit = positiveInteger(maxLength);
	if (!limit) return value;
	const chars = Array.from(value);
	return chars.length > limit ? chars.slice(0, limit).join("") : value;
}
function truncateUtf8Bytes(value, limit) {
	let bytes = 0;
	let result = "";
	for (const char of value) {
		const nextBytes = utf8ByteLength(char);
		if (bytes + nextBytes > limit) break;
		bytes += nextBytes;
		result += char;
	}
	return result;
}
function truncatePresentationText(value, limits) {
	const limit = positiveInteger(limits?.maxLength);
	if (!limit) return value;
	if (limits?.encoding === "utf8-bytes") return truncateUtf8Bytes(value, limit);
	if (limits?.encoding === "utf16-units") return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, limit);
	const chars = Array.from(value);
	return chars.length > limit ? chars.slice(0, limit).join("") : value;
}
function splitPresentationText(value, limits) {
	if (!positiveInteger(limits?.maxLength) || truncatePresentationText(value, limits) === value) return [value];
	const chunks = [];
	let remaining = value;
	while (remaining) {
		const prefix = truncatePresentationText(remaining, limits);
		if (!prefix || prefix === remaining) {
			chunks.push(remaining);
			break;
		}
		const newlineIndex = prefix.lastIndexOf("\n");
		const splitIndex = newlineIndex > 0 ? newlineIndex + 1 : prefix.length;
		chunks.push(remaining.slice(0, splitIndex));
		remaining = remaining.slice(splitIndex);
	}
	return chunks;
}
function fallbackTextBlocks(params) {
	return splitPresentationText(params.text, params.limits).map((text) => ({
		type: params.blockType,
		text
	}));
}
function utf8ByteLength(value) {
	return Buffer.byteLength(value, "utf8");
}
function fitsByteLimit(value, maxBytes) {
	const limit = positiveInteger(maxBytes);
	return !value || !limit || utf8ByteLength(value) <= limit;
}
function fallbackListBlock(params) {
	const labels = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(params.labels.map((label) => truncateText(label, params.maxLabelLength)));
	return labels.length > 0 ? {
		type: params.blockType,
		text: `${params.heading}:\n${labels.map((label) => `- ${label}`).join("\n")}`
	} : void 0;
}
function buttonFallbackLabel(button, maxLabelLength) {
	const label = truncateText(button.label, maxLabelLength);
	if (button.disabled) return label;
	const action = require_payload.resolveMessagePresentationButtonAction(button);
	return action?.type === "url" || action?.type === "web-app" ? `${label}: ${action.url}` : label;
}
function buttonCapacityAfterReservedSelects(limits, reservedSelects) {
	const maxActions = positiveInteger(limits?.maxActions);
	const maxRows = positiveInteger(limits?.maxRows);
	const maxActionsPerRow = positiveInteger(limits?.maxActionsPerRow);
	const remainingActions = maxActions === void 0 ? void 0 : Math.max(0, maxActions - reservedSelects);
	const remainingRows = maxRows === void 0 ? void 0 : Math.max(0, maxRows - reservedSelects);
	const rowCapacity = remainingRows !== void 0 && maxActionsPerRow !== void 0 ? remainingRows * maxActionsPerRow : void 0;
	if (remainingActions !== void 0 && rowCapacity !== void 0) return Math.min(remainingActions, rowCapacity);
	return remainingActions ?? rowCapacity;
}
function createActionBudget(limits) {
	return {
		remainingActions: positiveInteger(limits?.maxActions),
		remainingRows: positiveInteger(limits?.maxRows),
		maxActionsPerRow: positiveInteger(limits?.maxActionsPerRow)
	};
}
function buttonCapacity(budget) {
	if (budget.remainingActions === 0 || budget.remainingRows === 0) return 0;
	const rowCapacity = budget.remainingRows && budget.maxActionsPerRow ? budget.remainingRows * budget.maxActionsPerRow : void 0;
	if (budget.remainingActions !== void 0 && rowCapacity !== void 0) return Math.min(budget.remainingActions, rowCapacity);
	return budget.remainingActions ?? rowCapacity;
}
function consumeButtonBudget(budget, count) {
	if (count <= 0) return;
	if (budget.remainingActions !== void 0) budget.remainingActions = Math.max(0, budget.remainingActions - count);
	if (budget.remainingRows !== void 0) {
		const perRow = budget.maxActionsPerRow ?? count;
		budget.remainingRows = Math.max(0, budget.remainingRows - Math.ceil(count / perRow));
	}
}
function chunkButtons(buttons, maxActionsPerRow) {
	const rowSize = positiveInteger(maxActionsPerRow);
	if (!rowSize) return buttons.length > 0 ? [[...buttons]] : [];
	const rows = [];
	for (let index = 0; index < buttons.length; index += rowSize) rows.push(buttons.slice(index, index + rowSize));
	return rows;
}
function hasActionSlotBudget(budget) {
	return budget.remainingActions !== 0 && budget.remainingRows !== 0;
}
function consumeSelectBudget(budget) {
	if (budget.remainingActions !== void 0) budget.remainingActions = Math.max(0, budget.remainingActions - 1);
	if (budget.remainingRows !== void 0) budget.remainingRows = Math.max(0, budget.remainingRows - 1);
}
function adaptButton(button, limits) {
	const hasExplicitAction = button.action !== void 0;
	const action = require_payload.resolveMessagePresentationButtonAction(button);
	if (!action) return;
	const actionValue = require_payload.resolveMessagePresentationActionValue(action);
	const actionFits = actionValue === void 0 || fitsByteLimit(actionValue, limits?.maxValueBytes);
	const legacyValueFits = fitsByteLimit(button.value, limits?.maxValueBytes);
	if ((hasExplicitAction ? !actionFits : action.type === "callback" && !legacyValueFits) || button.disabled === true && limits?.supportsDisabled !== true) return;
	const adapted = {
		...button,
		label: truncateText(button.label, limits?.maxLabelLength)
	};
	if (!legacyValueFits) delete adapted.value;
	if (limits?.supportsStyles === false) delete adapted.style;
	return adapted;
}
function adaptButtonsBlock(block, limits, budget, fallbackBlockType, buttonSelection) {
	const capacity = buttonCapacity(budget);
	const candidates = block.buttons.map((button) => ({
		original: button,
		adapted: adaptButton(button, limits)
	}));
	const renderableCandidates = candidates.filter((candidate) => Boolean(candidate.adapted));
	const eligibleCandidates = buttonSelection ? renderableCandidates.filter((candidate) => buttonSelection.has(candidate.original)) : renderableCandidates;
	const selectedCandidates = capacity !== void 0 && eligibleCandidates.length > capacity ? eligibleCandidates.map((candidate, index) => ({
		candidate,
		index
	})).toSorted((left, right) => {
		return (right.candidate.adapted.priority ?? 0) - (left.candidate.adapted.priority ?? 0) || left.index - right.index;
	}).slice(0, capacity).map((entry) => entry.candidate) : eligibleCandidates;
	const selected = new Set(selectedCandidates);
	const buttons = selectedCandidates.map((candidate) => candidate.adapted);
	const droppedLabels = candidates.filter((candidate) => !candidate.adapted || !selected.has(candidate)).map((candidate) => buttonFallbackLabel(candidate.original, limits?.maxLabelLength));
	consumeButtonBudget(budget, buttons.length);
	const fallback = fallbackListBlock({
		blockType: fallbackBlockType,
		heading: "Actions",
		labels: droppedLabels
	});
	if (buttons.length === 0) return fallback ? [fallback] : [];
	const blocks = chunkButtons(buttons, limits?.maxActionsPerRow).map((row) => ({
		type: "buttons",
		buttons: row
	}));
	if (fallback) blocks.push(fallback);
	return blocks;
}
function appendAdaptedButtonsBlock(blocks, block, limits, budget, fallbackBlockType, buttonSelection) {
	blocks.push(...adaptButtonsBlock(block, limits, budget, fallbackBlockType, buttonSelection));
}
function adaptOption(option, limits) {
	const hasExplicitAction = option.action !== void 0;
	const action = require_payload.resolveMessagePresentationOptionAction(option);
	if (!action) return;
	const actionValue = require_payload.resolveMessagePresentationActionValue(action);
	const actionFits = actionValue === void 0 || fitsByteLimit(actionValue, limits?.maxValueBytes);
	const legacyValueFits = fitsByteLimit(option.value, limits?.maxValueBytes);
	if (hasExplicitAction ? !actionFits : !legacyValueFits) return;
	const adapted = {
		...option,
		label: truncateText(option.label, limits?.maxLabelLength)
	};
	if (!legacyValueFits) delete adapted.value;
	return adapted;
}
function adaptSelectBlock(block, limits, budget, fallbackBlockType) {
	const candidates = block.options.map((option) => ({
		original: option,
		adapted: adaptOption(option, limits)
	}));
	const renderableCandidates = candidates.filter((candidate) => Boolean(candidate.adapted));
	const maxOptions = positiveInteger(limits?.maxOptions);
	const selectedCandidates = maxOptions ? renderableCandidates.slice(0, maxOptions) : renderableCandidates;
	const selected = new Set(selectedCandidates);
	const options = selectedCandidates.map((candidate) => candidate.adapted);
	const canRenderSelect = options.length > 0 && hasActionSlotBudget(budget);
	const fallback = fallbackListBlock({
		blockType: fallbackBlockType,
		heading: block.placeholder ?? "Options",
		labels: (canRenderSelect ? candidates.filter((candidate) => !candidate.adapted || !selected.has(candidate)) : candidates).map((candidate) => candidate.original.label),
		maxLabelLength: limits?.maxLabelLength
	});
	if (!canRenderSelect) return fallback ? [fallback] : [];
	consumeSelectBudget(budget);
	const blocks = [{
		type: "select",
		...block.placeholder ? { placeholder: truncateText(block.placeholder, limits?.maxLabelLength) } : {},
		options
	}];
	if (fallback) blocks.push(fallback);
	return blocks;
}
function countRenderableSelectBlocks(blocks, capabilities, limits) {
	if (capabilities?.selects === false) return 0;
	return blocks.filter((block) => {
		if (block.type !== "select") return false;
		const maxOptions = positiveInteger(limits?.maxOptions);
		return block.options.map((option) => adaptOption(option, limits)).filter(Boolean).slice(0, maxOptions ?? void 0).length > 0;
	}).length;
}
function createGlobalButtonSelection(params) {
	if (params.capabilities?.buttons === false) return;
	const reservedSelectSlots = countRenderableSelectBlocks(params.presentation.blocks, params.capabilities, params.selectLimits);
	const capacity = buttonCapacityAfterReservedSelects(params.limits, reservedSelectSlots);
	if (capacity === void 0) return;
	const candidates = params.presentation.blocks.flatMap((block) => {
		if (block.type !== "buttons") return [];
		return block.buttons.map((button) => ({
			original: button,
			adapted: adaptButton(button, params.limits)
		})).filter((candidate) => Boolean(candidate.adapted));
	});
	if (candidates.length <= capacity) return;
	return new Set(candidates.map((candidate, index) => ({
		candidate,
		index
	})).toSorted((left, right) => {
		return (right.candidate.adapted.priority ?? 0) - (left.candidate.adapted.priority ?? 0) || left.index - right.index;
	}).slice(0, capacity).map((entry) => entry.candidate.original));
}
function adaptTextBlock(block, limits) {
	if (block.type === "text" || block.type === "context") return {
		...block,
		text: truncatePresentationText(block.text, limits)
	};
	return block;
}
/**
* Adapt a portable presentation to the target channel's advertised capabilities.
*
* Unsupported controls are downgraded to text/context fallback blocks where possible, and
* labels, values, rows, options, styles, disabled state, and text are clipped to channel limits.
*/
function adaptMessagePresentationForChannel(params) {
	const capabilities = params.capabilities;
	const limits = params.capabilities?.limits;
	const actionBudget = createActionBudget(limits?.actions);
	const fallbackBlockType = capabilities?.context === false ? "text" : "context";
	const buttonSelection = createGlobalButtonSelection({
		presentation: params.presentation,
		capabilities,
		limits: limits?.actions,
		selectLimits: limits?.selects
	});
	const blocks = [];
	for (const block of params.presentation.blocks) {
		if (block.type === "chart" && capabilities?.charts !== true) {
			blocks.push(...fallbackTextBlocks({
				blockType: fallbackBlockType,
				text: require_payload.renderMessagePresentationChartFallbackText(block),
				limits: limits?.text
			}));
			continue;
		}
		if (block.type === "table" && capabilities?.tables !== true) {
			blocks.push(...fallbackTextBlocks({
				blockType: fallbackBlockType,
				text: require_payload.renderMessagePresentationTableFallbackText(block),
				limits: limits?.text
			}));
			continue;
		}
		if (block.type === "buttons") {
			if (capabilities?.buttons === false) {
				const fallback = fallbackListBlock({
					blockType: fallbackBlockType,
					heading: "Actions",
					labels: block.buttons.map((button) => buttonFallbackLabel(button, limits?.actions?.maxLabelLength))
				});
				if (fallback) blocks.push(fallback);
				continue;
			}
			appendAdaptedButtonsBlock(blocks, block, limits?.actions, actionBudget, fallbackBlockType, buttonSelection);
			continue;
		}
		if (block.type === "select") {
			if (capabilities?.selects === false) {
				const fallback = fallbackListBlock({
					blockType: fallbackBlockType,
					heading: block.placeholder ?? "Options",
					labels: block.options.map((option) => option.label),
					maxLabelLength: limits?.selects?.maxLabelLength
				});
				if (fallback) blocks.push(fallback);
				continue;
			}
			blocks.push(...adaptSelectBlock(block, limits?.selects, actionBudget, fallbackBlockType));
			continue;
		}
		if (block.type === "context" && capabilities?.context === false) {
			blocks.push({
				type: "text",
				text: block.text
			});
			continue;
		}
		if (block.type === "divider" && capabilities?.divider === false) continue;
		blocks.push(block);
	}
	return {
		...params.presentation,
		...params.presentation.title ? { title: truncatePresentationText(params.presentation.title, limits?.text) } : {},
		blocks: blocks.map((block) => adaptTextBlock(block, limits?.text))
	};
}
//#endregion
//#region src/auto-reply/reply/reply-payload-sending-hook.ts
/** Runs plugin hooks that may rewrite or cancel an outbound reply payload. */
async function runReplyPayloadSendingHook(params) {
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("reply_payload_sending")) return params.payload;
	const result = await hookRunner.runReplyPayloadSending({
		payload: params.payload,
		kind: params.kind,
		channel: params.channel,
		sessionKey: params.sessionKey,
		runId: params.runId,
		usageState: params.usageState
	}, params.context);
	if (result?.cancel) return null;
	const payload = result?.payload ?? params.payload;
	return require_reply_payload$1.copyReplyPayloadMetadata(params.payload, payload);
}
//#endregion
//#region src/channels/message/rendered-batch.ts
function countMedia(payload) {
	return (payload.mediaUrls?.filter(Boolean).length ?? 0) + (payload.mediaUrl ? 1 : 0);
}
function collectMediaUrls(payload) {
	return [payload.mediaUrl, ...payload.mediaUrls ?? []].map((url) => url?.trim()).filter((url) => Boolean(url));
}
function createRenderedMessageBatchPlanItem(payload, index) {
	const text = payload.text?.trim();
	const mediaUrls = collectMediaUrls(payload);
	const presentationBlockCount = payload.presentation?.blocks?.length ?? 0;
	const kinds = [];
	if (text) kinds.push("text");
	if (mediaUrls.length > 0) kinds.push(payload.audioAsVoice ? "voice" : "media");
	if (presentationBlockCount > 0) kinds.push("presentation");
	if (payload.interactive) kinds.push("interactive");
	if (payload.channelData || payload.location) kinds.push("channelData");
	return {
		index,
		kinds: kinds.length > 0 ? kinds : ["empty"],
		...text ? { text } : {},
		mediaUrls,
		...payload.audioAsVoice && mediaUrls.length > 0 ? { audioAsVoice: true } : {},
		...presentationBlockCount > 0 ? { presentationBlockCount } : {},
		...payload.interactive ? { hasInteractive: true } : {},
		...payload.channelData || payload.location ? { hasChannelData: true } : {}
	};
}
/** Summarizes rendered reply payloads so delivery can choose adapter paths and recovery metadata. */
function createRenderedMessageBatchPlan(payloads) {
	const items = payloads.map(createRenderedMessageBatchPlanItem);
	return payloads.reduce((plan, payload) => {
		const text = payload.text?.trim();
		const mediaCount = countMedia(payload);
		return {
			payloadCount: plan.payloadCount + 1,
			textCount: plan.textCount + (text ? 1 : 0),
			mediaCount: plan.mediaCount + mediaCount,
			voiceCount: plan.voiceCount + (payload.audioAsVoice && mediaCount > 0 ? 1 : 0),
			presentationCount: plan.presentationCount + (payload.presentation?.blocks?.length ? 1 : 0),
			interactiveCount: plan.interactiveCount + (payload.interactive ? 1 : 0),
			channelDataCount: plan.channelDataCount + (payload.channelData || payload.location ? 1 : 0),
			items: plan.items
		};
	}, {
		payloadCount: 0,
		textCount: 0,
		mediaCount: 0,
		voiceCount: 0,
		presentationCount: 0,
		interactiveCount: 0,
		channelDataCount: 0,
		items
	});
}
/** Pairs reply payloads with their render plan for durable send and live-preview flows. */
function createRenderedMessageBatch(payloads) {
	return {
		payloads,
		plan: createRenderedMessageBatchPlan(payloads)
	};
}
//#endregion
//#region src/hooks/message-hook-mappers.ts
function readNonBlankString(value) {
	return typeof value === "string" && value.trim().length > 0 ? value : void 0;
}
function assignRemoteMediaStagingMetadata(target, canonical) {
	const metadata = {
		mediaRemoteHost: canonical.mediaRemoteHost,
		mediaStagingPending: canonical.mediaStagingPending,
		originalMediaPath: canonical.originalMediaPath,
		originalMediaUrl: canonical.originalMediaUrl,
		originalMediaType: canonical.originalMediaType,
		originalMediaPaths: canonical.originalMediaPaths,
		originalMediaUrls: canonical.originalMediaUrls,
		originalMediaTypes: canonical.originalMediaTypes
	};
	for (const [key, value] of Object.entries(metadata)) if (value !== void 0) target[key] = value;
}
function deriveInboundMessageHookContext(ctx, overrides) {
	const content = overrides?.content ?? readNonBlankString(ctx.BodyForCommands) ?? readNonBlankString(ctx.RawBody) ?? readNonBlankString(ctx.Body) ?? "";
	const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(ctx.OriginatingChannel ?? ctx.Surface ?? ctx.Provider ?? "");
	const conversationId = ctx.OriginatingTo ?? ctx.To ?? ctx.From ?? require_message_channel_core.internalSessionConversationId(channelId, ctx.SessionKey);
	const isGroup = Boolean(ctx.GroupSubject || ctx.GroupChannel);
	const mediaPaths = Array.isArray(ctx.MediaPaths) ? ctx.MediaPaths.filter((value) => typeof value === "string" && value.length > 0) : void 0;
	const mediaTypes = Array.isArray(ctx.MediaTypes) ? ctx.MediaTypes.filter((value) => typeof value === "string" && value.length > 0) : void 0;
	const mediaUrls = Array.isArray(ctx.MediaUrls) ? ctx.MediaUrls.filter((value) => typeof value === "string" && value.length > 0) : void 0;
	return {
		from: ctx.From ?? "",
		to: ctx.To,
		content,
		body: ctx.Body,
		bodyForAgent: ctx.BodyForAgent,
		transcript: ctx.Transcript,
		timestamp: typeof ctx.Timestamp === "number" && Number.isFinite(ctx.Timestamp) ? ctx.Timestamp : void 0,
		channelId,
		accountId: ctx.AccountId,
		conversationId,
		sessionKey: ctx.SessionKey,
		agentId: ctx.AgentId,
		messageId: overrides?.messageId ?? ctx.MessageSidFull ?? ctx.MessageSid ?? ctx.MessageSidFirst ?? ctx.MessageSidLast,
		senderId: ctx.SenderId,
		senderName: ctx.SenderName,
		senderUsername: ctx.SenderUsername,
		senderE164: ctx.SenderE164,
		replyToId: ctx.ReplyToId,
		replyToIdFull: ctx.ReplyToIdFull,
		replyToBody: ctx.ReplyToBody,
		replyToSender: ctx.ReplyToSender,
		replyToIsQuote: ctx.ReplyToIsQuote,
		provider: ctx.Provider,
		surface: ctx.Surface,
		threadId: ctx.MessageThreadId,
		threadParentId: ctx.ThreadParentId,
		mediaPath: ctx.MediaPath ?? mediaPaths?.[0],
		mediaUrl: ctx.MediaUrl ?? mediaUrls?.[0],
		mediaType: ctx.MediaType ?? mediaTypes?.[0],
		mediaPaths,
		mediaUrls,
		mediaTypes,
		originatingChannel: ctx.OriginatingChannel,
		originatingTo: ctx.OriginatingTo,
		guildId: ctx.GroupSpace,
		channelName: ctx.GroupChannel,
		isGroup,
		groupId: isGroup ? conversationId : void 0,
		topicName: ctx.TopicName
	};
}
function buildCanonicalSentMessageHookContext(params) {
	return {
		to: params.to,
		content: params.content,
		success: params.success,
		error: params.error,
		channelId: params.channelId,
		accountId: params.accountId,
		conversationId: params.conversationId ?? params.to,
		sessionKey: params.sessionKey,
		runId: params.runId,
		messageId: params.messageId,
		trace: params.trace,
		callDepth: params.callDepth,
		isGroup: params.isGroup,
		groupId: params.groupId
	};
}
function assignTraceFields(target, trace) {
	if (!trace) return;
	const safeTrace = require_diagnostic_events.freezeDiagnosticTraceContext(trace);
	target.trace = safeTrace;
	target.traceId = safeTrace.traceId;
	if (safeTrace.spanId) target.spanId = safeTrace.spanId;
	if (safeTrace.parentSpanId) target.parentSpanId = safeTrace.parentSpanId;
}
function toPluginMessageContext(canonical) {
	const context = {
		channelId: canonical.channelId,
		accountId: canonical.accountId,
		conversationId: canonical.conversationId
	};
	if (canonical.sessionKey) context.sessionKey = canonical.sessionKey;
	if (canonical.runId) context.runId = canonical.runId;
	if (canonical.messageId) context.messageId = canonical.messageId;
	if ("senderId" in canonical && canonical.senderId) context.senderId = canonical.senderId;
	if ("replyToId" in canonical && canonical.replyToId !== void 0) context.replyToId = canonical.replyToId;
	if ("replyToIdFull" in canonical && canonical.replyToIdFull !== void 0) context.replyToIdFull = canonical.replyToIdFull;
	if ("replyToBody" in canonical && canonical.replyToBody !== void 0) context.replyToBody = canonical.replyToBody;
	if ("replyToSender" in canonical && canonical.replyToSender !== void 0) context.replyToSender = canonical.replyToSender;
	if ("replyToIsQuote" in canonical && canonical.replyToIsQuote !== void 0) context.replyToIsQuote = canonical.replyToIsQuote;
	assignTraceFields(context, canonical.trace);
	if (canonical.callDepth != null) context.callDepth = canonical.callDepth;
	return context;
}
function resolveInboundConversation(canonical) {
	const channelId = require_registry.normalizeChannelId(canonical.channelId);
	const pluginResolved = channelId ? require_registry.getChannelPlugin(channelId)?.messaging?.resolveInboundConversation?.({
		from: canonical.from,
		to: canonical.to ?? canonical.originatingTo,
		conversationId: canonical.conversationId,
		threadId: canonical.threadId,
		threadParentId: canonical.threadParentId,
		isGroup: canonical.isGroup
	}) : null;
	if (pluginResolved) return {
		conversationId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(pluginResolved.conversationId),
		parentConversationId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(pluginResolved.parentConversationId)
	};
	return { conversationId: require_string_readers.stripChannelPrefix(canonical.to ?? canonical.originatingTo ?? canonical.conversationId, canonical.channelId) };
}
function toPluginInboundClaimContext(canonical) {
	const conversation = resolveInboundConversation(canonical);
	const context = {
		channelId: canonical.channelId,
		accountId: canonical.accountId,
		conversationId: conversation.conversationId,
		sessionKey: canonical.sessionKey,
		agentId: canonical.agentId,
		parentConversationId: conversation.parentConversationId,
		senderId: canonical.senderId,
		messageId: canonical.messageId,
		runId: canonical.runId,
		callDepth: canonical.callDepth
	};
	if (canonical.replyToId !== void 0) context.replyToId = canonical.replyToId;
	if (canonical.replyToIdFull !== void 0) context.replyToIdFull = canonical.replyToIdFull;
	if (canonical.replyToBody !== void 0) context.replyToBody = canonical.replyToBody;
	if (canonical.replyToSender !== void 0) context.replyToSender = canonical.replyToSender;
	if (canonical.replyToIsQuote !== void 0) context.replyToIsQuote = canonical.replyToIsQuote;
	assignTraceFields(context, canonical.trace);
	return context;
}
function toPluginInboundClaimEvent(canonical, extras) {
	const context = toPluginInboundClaimContext(canonical);
	const event = {
		content: canonical.content,
		body: canonical.body,
		bodyForAgent: canonical.bodyForAgent,
		transcript: canonical.transcript,
		timestamp: canonical.timestamp,
		channel: canonical.channelId,
		accountId: canonical.accountId,
		conversationId: context.conversationId,
		parentConversationId: context.parentConversationId,
		senderId: canonical.senderId,
		senderName: canonical.senderName,
		senderUsername: canonical.senderUsername,
		...canonical.replyToId !== void 0 ? { replyToId: canonical.replyToId } : {},
		...canonical.replyToIdFull !== void 0 ? { replyToIdFull: canonical.replyToIdFull } : {},
		...canonical.replyToBody !== void 0 ? { replyToBody: canonical.replyToBody } : {},
		...canonical.replyToSender !== void 0 ? { replyToSender: canonical.replyToSender } : {},
		...canonical.replyToIsQuote !== void 0 ? { replyToIsQuote: canonical.replyToIsQuote } : {},
		threadId: canonical.threadId,
		messageId: canonical.messageId,
		sessionKey: canonical.sessionKey,
		runId: canonical.runId,
		isGroup: canonical.isGroup,
		commandAuthorized: extras?.commandAuthorized,
		wasMentioned: extras?.wasMentioned,
		metadata: {
			from: canonical.from,
			to: canonical.to,
			provider: canonical.provider,
			surface: canonical.surface,
			originatingChannel: canonical.originatingChannel,
			originatingTo: canonical.originatingTo,
			senderE164: canonical.senderE164,
			replyToId: canonical.replyToId,
			replyToIdFull: canonical.replyToIdFull,
			replyToBody: canonical.replyToBody,
			replyToSender: canonical.replyToSender,
			replyToIsQuote: canonical.replyToIsQuote,
			mediaPath: canonical.mediaPath,
			mediaUrl: canonical.mediaUrl,
			mediaType: canonical.mediaType,
			mediaPaths: canonical.mediaPaths,
			mediaUrls: canonical.mediaUrls,
			mediaTypes: canonical.mediaTypes,
			guildId: canonical.guildId,
			channelName: canonical.channelName,
			groupId: canonical.groupId,
			topicName: canonical.topicName
		}
	};
	if (event.metadata) assignRemoteMediaStagingMetadata(event.metadata, canonical);
	assignTraceFields(event, canonical.trace);
	return event;
}
function toPluginMessageReceivedEvent(canonical) {
	const event = {
		from: canonical.from,
		content: canonical.content,
		timestamp: canonical.timestamp,
		threadId: canonical.threadId,
		messageId: canonical.messageId,
		senderId: canonical.senderId,
		...canonical.replyToId !== void 0 ? { replyToId: canonical.replyToId } : {},
		...canonical.replyToIdFull !== void 0 ? { replyToIdFull: canonical.replyToIdFull } : {},
		...canonical.replyToBody !== void 0 ? { replyToBody: canonical.replyToBody } : {},
		...canonical.replyToSender !== void 0 ? { replyToSender: canonical.replyToSender } : {},
		...canonical.replyToIsQuote !== void 0 ? { replyToIsQuote: canonical.replyToIsQuote } : {},
		sessionKey: canonical.sessionKey,
		runId: canonical.runId,
		metadata: {
			to: canonical.to,
			provider: canonical.provider,
			surface: canonical.surface,
			threadId: canonical.threadId,
			originatingChannel: canonical.originatingChannel,
			originatingTo: canonical.originatingTo,
			messageId: canonical.messageId,
			senderId: canonical.senderId,
			senderName: canonical.senderName,
			senderUsername: canonical.senderUsername,
			senderE164: canonical.senderE164,
			replyToId: canonical.replyToId,
			replyToIdFull: canonical.replyToIdFull,
			replyToBody: canonical.replyToBody,
			replyToSender: canonical.replyToSender,
			replyToIsQuote: canonical.replyToIsQuote,
			mediaPath: canonical.mediaPath,
			mediaUrl: canonical.mediaUrl,
			mediaType: canonical.mediaType,
			mediaPaths: canonical.mediaPaths,
			mediaUrls: canonical.mediaUrls,
			mediaTypes: canonical.mediaTypes,
			guildId: canonical.guildId,
			channelName: canonical.channelName,
			topicName: canonical.topicName
		}
	};
	if (event.metadata) assignRemoteMediaStagingMetadata(event.metadata, canonical);
	assignTraceFields(event, canonical.trace);
	return event;
}
function toPluginMessageSentEvent(canonical) {
	const event = {
		to: canonical.to,
		content: canonical.content,
		success: canonical.success,
		...canonical.messageId ? { messageId: canonical.messageId } : {},
		...canonical.sessionKey ? { sessionKey: canonical.sessionKey } : {},
		...canonical.runId ? { runId: canonical.runId } : {},
		...canonical.error ? { error: canonical.error } : {}
	};
	assignTraceFields(event, canonical.trace);
	return event;
}
function toInternalMessageReceivedContext(canonical) {
	const context = {
		from: canonical.from,
		content: canonical.content,
		timestamp: canonical.timestamp,
		channelId: canonical.channelId,
		accountId: canonical.accountId,
		conversationId: canonical.conversationId,
		messageId: canonical.messageId,
		metadata: {
			to: canonical.to,
			provider: canonical.provider,
			surface: canonical.surface,
			threadId: canonical.threadId,
			senderId: canonical.senderId,
			senderName: canonical.senderName,
			senderUsername: canonical.senderUsername,
			senderE164: canonical.senderE164,
			mediaPath: canonical.mediaPath,
			mediaUrl: canonical.mediaUrl,
			mediaType: canonical.mediaType,
			mediaPaths: canonical.mediaPaths,
			mediaUrls: canonical.mediaUrls,
			mediaTypes: canonical.mediaTypes,
			guildId: canonical.guildId,
			channelName: canonical.channelName,
			topicName: canonical.topicName
		}
	};
	if (context.metadata) assignRemoteMediaStagingMetadata(context.metadata, canonical);
	return context;
}
function toInternalMessageTranscribedContext(canonical, cfg) {
	return {
		...toInternalInboundMessageHookContextBase(canonical),
		transcript: canonical.transcript ?? "",
		cfg
	};
}
function toInternalMessagePreprocessedContext(canonical, cfg) {
	return {
		...toInternalInboundMessageHookContextBase(canonical),
		transcript: canonical.transcript,
		isGroup: canonical.isGroup,
		groupId: canonical.groupId,
		cfg
	};
}
function toInternalInboundMessageHookContextBase(canonical) {
	return {
		from: canonical.from,
		to: canonical.to,
		body: canonical.body,
		bodyForAgent: canonical.bodyForAgent,
		timestamp: canonical.timestamp,
		channelId: canonical.channelId,
		conversationId: canonical.conversationId,
		messageId: canonical.messageId,
		senderId: canonical.senderId,
		senderName: canonical.senderName,
		senderUsername: canonical.senderUsername,
		provider: canonical.provider,
		surface: canonical.surface,
		mediaPath: canonical.mediaPath,
		mediaType: canonical.mediaType
	};
}
function toInternalMessageSentContext(canonical) {
	return {
		to: canonical.to,
		content: canonical.content,
		success: canonical.success,
		...canonical.error ? { error: canonical.error } : {},
		channelId: canonical.channelId,
		accountId: canonical.accountId,
		conversationId: canonical.conversationId,
		messageId: canonical.messageId,
		...canonical.isGroup != null ? { isGroup: canonical.isGroup } : {},
		...canonical.groupId ? { groupId: canonical.groupId } : {}
	};
}
//#endregion
//#region src/infra/outbound/abort.ts
/**
* Throws an AbortError if the given signal has been aborted.
* Use at async checkpoints to support cancellation.
*/
function throwIfAborted(abortSignal) {
	if (abortSignal?.aborted) throw require_abort_signal.createAbortError("Operation aborted");
}
//#endregion
//#region src/infra/outbound/message-plan.ts
function assertStableMediaFanout(params, payloadIndex, originalMediaCount, effective) {
	if (!params.requiredUnknownSendReconciliation) return;
	if ((params.renderedBatchPlan?.items[payloadIndex]?.mediaUrls.length ?? originalMediaCount) !== effective.mediaUrls.length) throw new Error(`Required durable message send changed platform fan-out after outbound transforms for ${params.channel}`);
}
function withPlannedReplyTo(overrides, consumeReplyTo) {
	return consumeReplyTo ? consumeReplyTo({ ...overrides }) : { ...overrides };
}
function withChunkedTextFormatting(overrides, formatting) {
	return formatting ? {
		...overrides,
		formatting: {
			...overrides.formatting,
			...formatting
		}
	} : overrides;
}
function chunkTextForPlan(params) {
	return params.formatting ? params.chunker(params.text, params.limit, { formatting: params.formatting }) : params.chunker(params.text, params.limit);
}
/**
* Plans text sends, preserving reply-to policy across chunked delivery units.
*/
function planOutboundTextMessageUnits(params) {
	const planTextUnit = (text, deliveryPartIndex) => ({
		kind: "text",
		text,
		overrides: {
			...withPlannedReplyTo(params.overrides, params.consumeReplyTo),
			deliveryPartIndex
		}
	});
	const planChunkedTextUnit = (text, deliveryPartIndex) => {
		const unit = planTextUnit(text, deliveryPartIndex);
		return {
			...unit,
			overrides: withChunkedTextFormatting(unit.overrides, params.chunkedTextFormatting)
		};
	};
	if (!params.chunker || params.textLimit === void 0) return [planTextUnit(params.text, 0)];
	if (params.chunkMode === "newline") {
		const blockChunks = (params.chunkerMode ?? "text") === "markdown" ? require_chunk.chunkMarkdownTextWithMode(params.text, params.textLimit, "newline") : require_chunk.chunkByParagraph(params.text, params.textLimit);
		if (!blockChunks.length && params.text) blockChunks.push(params.text);
		const units = [];
		for (const blockChunk of blockChunks) {
			const chunks = chunkTextForPlan({
				text: blockChunk,
				limit: params.textLimit,
				chunker: params.chunker,
				formatting: params.formatting
			});
			if (!chunks.length && blockChunk) chunks.push(blockChunk);
			for (const chunk of chunks) units.push(planChunkedTextUnit(chunk, units.length));
		}
		return units;
	}
	return chunkTextForPlan({
		text: params.text,
		limit: params.textLimit,
		chunker: params.chunker,
		formatting: params.formatting
	}).map(planChunkedTextUnit);
}
/**
* Plans media sends with a caption only on the leading media unit.
*/
function planOutboundMediaMessageUnits(params) {
	return params.mediaUrls.map((mediaUrl, index) => ({
		kind: "media",
		mediaUrl,
		...index === 0 ? { caption: params.caption } : {},
		overrides: {
			...withPlannedReplyTo(params.overrides, params.consumeReplyTo),
			deliveryPartIndex: index
		}
	}));
}
//#endregion
//#region src/infra/outbound/deliver.ts
var deliver_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	deliverOutboundPayloadsInternal: () => deliverOutboundPayloadsInternal,
	resolveOutboundDurableFinalDeliverySupport: () => resolveOutboundDurableFinalDeliverySupport
});
const log = require_subsystem.createSubsystemLogger("outbound/deliver");
const loadTranscriptRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./transcript.runtime-BDEfQFcw.cjs")));
const loadChannelBootstrapRuntime = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./channel-bootstrap.runtime-CaYhF0j4.cjs")).then((n) => n.channel_bootstrap_runtime_exports));
async function resolveChannelOutboundDirectiveOptions(params) {
	return { extractMarkdownImages: (await loadBootstrappedOutboundAdapter(params))?.extractMarkdownImages === true ? true : void 0 };
}
async function createChannelHandler(params) {
	const outbound = await loadBootstrappedOutboundAdapter(params);
	const message = require_channel_resolution.resolveOutboundChannelMessageAdapter(params);
	const handler = createPluginHandler({
		...params,
		outbound,
		message
	});
	if (!handler) throw new Error(`Outbound not configured for channel: ${params.channel}`);
	return handler;
}
async function loadBootstrappedOutboundAdapter(params) {
	let outbound = await require_load.loadChannelOutboundAdapter(params.channel);
	if (!outbound) {
		const { bootstrapOutboundChannelPlugin } = await loadChannelBootstrapRuntime();
		bootstrapOutboundChannelPlugin({
			channel: params.channel,
			cfg: params.cfg
		});
		outbound = await require_load.loadChannelOutboundAdapter(params.channel);
	}
	return outbound;
}
async function runChannelMessageSendWithLifecycle(params) {
	if (!params.lifecycle) return { result: await params.send() };
	let attemptToken;
	try {
		attemptToken = await params.lifecycle.beforeSendAttempt?.(params.ctx);
		const result = await params.send();
		const successCtx = {
			...params.ctx,
			result,
			...attemptToken !== void 0 ? { attemptToken } : {}
		};
		try {
			await params.lifecycle.afterSendSuccess?.(successCtx);
		} catch (successHookError) {
			log.warn(`channel message send success hook failed after platform send; preserving send result: ${require_errors.formatErrorMessage(successHookError)}`);
		}
		return {
			result,
			...params.lifecycle.afterCommit ? { afterCommit: async () => {
				await params.lifecycle?.afterCommit?.(successCtx);
			} } : {}
		};
	} catch (error) {
		try {
			await params.lifecycle.afterSendFailure?.({
				...params.ctx,
				error,
				...attemptToken !== void 0 ? { attemptToken } : {}
			});
		} catch (cleanupError) {
			log.warn(`channel message send failure cleanup failed; preserving original send error: ${require_errors.formatErrorMessage(cleanupError)}`);
		}
		throw error;
	}
}
async function resolveOutboundDurableFinalDeliverySupport(params) {
	const outbound = await loadBootstrappedOutboundAdapter(params);
	const message = require_channel_resolution.resolveOutboundChannelMessageAdapter(params);
	if (!message?.send?.text && !outbound?.sendText) return {
		ok: false,
		reason: "missing_outbound_handler"
	};
	const messageDurableFinal = message?.durableFinal;
	const durableFinal = messageDurableFinal?.capabilities ?? outbound?.deliveryCapabilities?.durableFinal;
	for (const [capability, required] of Object.entries(params.requirements ?? {})) {
		if (required === true && durableFinal?.[capability] !== true) return {
			ok: false,
			reason: "capability_mismatch",
			capability
		};
		if (required === true && capability === "reconcileUnknownSend" && typeof messageDurableFinal?.reconcileUnknownSend !== "function") return {
			ok: false,
			reason: "capability_mismatch",
			capability
		};
	}
	if (params.requirements?.reconcileUnknownSend === true) {
		const supportedKinds = messageDurableFinal?.reconcileUnknownSendKinds;
		for (const kind of unknownSendReconciliationKinds) if (supportedKinds !== void 0 && params.requirements[kind] === true && supportedKinds[kind] !== true) return {
			ok: false,
			reason: "capability_mismatch",
			capability: "reconcileUnknownSend"
		};
	}
	return { ok: true };
}
function createPluginHandler(params) {
	const outbound = params.outbound;
	const messageText = params.message?.send?.text;
	const messageMedia = params.message?.send?.media;
	const messagePayload = params.message?.send?.payload;
	const messageLifecycle = params.message?.send?.lifecycle;
	const assertUnknownSendReconciliationKind = (kind) => {
		const durableFinal = params.message?.durableFinal;
		if (!params.requiredUnknownSendReconciliation || durableFinal?.capabilities?.reconcileUnknownSend !== true) return;
		if (durableFinal.reconcileUnknownSendKinds !== void 0 && durableFinal.reconcileUnknownSendKinds[kind] !== true) throw new Error(`Required durable message send became unsupported after outbound transforms: ${kind} unknown-send reconciliation is unavailable for ${params.channel}`);
	};
	if (!messageText && !outbound?.sendText) return null;
	const baseCtx = createChannelOutboundContextBase(params);
	const sendText = outbound?.sendText;
	const sendMedia = outbound?.sendMedia;
	const chunker = outbound?.chunker ?? null;
	const chunkerMode = outbound?.chunkerMode;
	const onMessageDeliveryResult = params.onDeliveryResult ? async (result) => {
		await params.onDeliveryResult?.(normalizeChannelMessageSendResult(params.channel, result));
	} : void 0;
	const resolveCtx = (overrides) => ({
		...baseCtx,
		replyToId: overrides && "replyToId" in overrides ? overrides.replyToId : baseCtx.replyToId,
		replyToIdSource: overrides && "replyToIdSource" in overrides ? overrides.replyToIdSource : baseCtx.replyToIdSource,
		threadId: overrides && "threadId" in overrides ? overrides.threadId : baseCtx.threadId,
		audioAsVoice: overrides?.audioAsVoice,
		deliveryPartIndex: overrides?.deliveryPartIndex,
		formatting: overrides && "formatting" in overrides ? {
			...baseCtx.formatting,
			...overrides.formatting
		} : baseCtx.formatting
	});
	const buildTargetRef = (overrides) => ({
		channel: params.channel,
		to: params.to,
		accountId: params.accountId ?? void 0,
		threadId: overrides?.threadId ?? baseCtx.threadId
	});
	return {
		chunker,
		chunkerMode,
		chunkedTextFormatting: outbound?.chunkedTextFormatting,
		textChunkLimit: outbound?.textChunkLimit,
		supportsMedia: Boolean(messageMedia ?? sendMedia),
		sanitizeText: outbound?.sanitizeText ? (payload) => outbound.sanitizeText({
			text: payload.text ?? "",
			payload,
			cfg: params.cfg,
			accountId: params.accountId
		}) : void 0,
		normalizePayload: outbound?.normalizePayload ? (payload) => outbound.normalizePayload({
			payload,
			cfg: params.cfg,
			accountId: params.accountId
		}) : void 0,
		sendTextOnlyErrorPayloads: outbound?.sendTextOnlyErrorPayloads === true,
		presentationCapabilities: outbound?.presentationCapabilities,
		renderPresentation: outbound?.renderPresentation ? async (payload) => {
			const presentation = require_payload.normalizeMessagePresentation(payload.presentation);
			if (!presentation) return payload;
			const ctx = {
				...resolveCtx({
					replyToId: payload.replyToId ?? baseCtx.replyToId,
					threadId: baseCtx.threadId,
					audioAsVoice: payload.audioAsVoice
				}),
				text: payload.text ?? "",
				mediaUrl: payload.mediaUrl,
				payload
			};
			return await outbound.renderPresentation({
				payload,
				presentation,
				ctx
			});
		} : void 0,
		pinDeliveredMessage: outbound?.pinDeliveredMessage ? async ({ target, messageId, pin, gatewayClientScopes }) => outbound.pinDeliveredMessage({
			cfg: params.cfg,
			target,
			messageId,
			pin,
			gatewayClientScopes
		}) : void 0,
		afterDeliverPayload: outbound?.afterDeliverPayload ? async ({ target, payload, results }) => outbound.afterDeliverPayload({
			cfg: params.cfg,
			target,
			payload,
			results
		}) : void 0,
		shouldSkipPlainTextSanitization: outbound?.shouldSkipPlainTextSanitization ? (payload) => outbound.shouldSkipPlainTextSanitization({ payload }) : void 0,
		resolveEffectiveTextChunkLimit: outbound?.resolveEffectiveTextChunkLimit ? (fallbackLimit) => outbound.resolveEffectiveTextChunkLimit({
			cfg: params.cfg,
			accountId: params.accountId ?? void 0,
			fallbackLimit
		}) : void 0,
		sendPayload: messagePayload || outbound?.sendPayload ? async (payload, overrides) => {
			const payloadCtx = {
				...resolveCtx(overrides),
				kind: "payload",
				text: payload.text ?? "",
				mediaUrl: payload.mediaUrl,
				payload
			};
			assertUnknownSendReconciliationKind("payload");
			if (messagePayload) {
				const messagePayloadCtx = {
					...payloadCtx,
					onDeliveryResult: onMessageDeliveryResult
				};
				const sent = await runChannelMessageSendWithLifecycle({
					lifecycle: messageLifecycle,
					ctx: messagePayloadCtx,
					send: async () => {
						await params.onPlatformSendStart?.(messagePayloadCtx);
						return await messagePayload(messagePayloadCtx);
					}
				});
				return require_delivery_queue.attachOutboundDeliveryCommitHook(normalizeChannelMessageSendResult(params.channel, sent.result), sent.afterCommit);
			}
			await params.onPlatformSendStart?.(payloadCtx);
			return outbound.sendPayload(payloadCtx);
		} : void 0,
		sendFormattedText: outbound?.sendFormattedText ? async (text, overrides) => {
			const formattedCtx = {
				...resolveCtx(overrides),
				text
			};
			assertUnknownSendReconciliationKind("text");
			await params.onPlatformSendStart?.(formattedCtx);
			return await outbound.sendFormattedText(formattedCtx);
		} : void 0,
		sendFormattedMedia: outbound?.sendFormattedMedia ? async (caption, mediaUrl, overrides) => {
			const formattedCtx = {
				...resolveCtx(overrides),
				text: caption,
				mediaUrl
			};
			assertUnknownSendReconciliationKind("media");
			await params.onPlatformSendStart?.(formattedCtx);
			return await outbound.sendFormattedMedia(formattedCtx);
		} : void 0,
		sendText: async (text, overrides) => {
			const textCtx = {
				...resolveCtx(overrides),
				kind: "text",
				text
			};
			assertUnknownSendReconciliationKind("text");
			if (messageText) {
				const messageTextCtx = {
					...textCtx,
					onDeliveryResult: onMessageDeliveryResult
				};
				const sent = await runChannelMessageSendWithLifecycle({
					lifecycle: messageLifecycle,
					ctx: messageTextCtx,
					send: async () => {
						await params.onPlatformSendStart?.(messageTextCtx);
						return await messageText(messageTextCtx);
					}
				});
				return require_delivery_queue.attachOutboundDeliveryCommitHook(normalizeChannelMessageSendResult(params.channel, sent.result), sent.afterCommit);
			}
			await params.onPlatformSendStart?.(textCtx);
			return sendText(textCtx);
		},
		buildTargetRef,
		sendMedia: async (caption, mediaUrl, overrides) => {
			const mediaCtx = {
				...resolveCtx(overrides),
				kind: "media",
				text: caption,
				mediaUrl
			};
			assertUnknownSendReconciliationKind("media");
			if (messageMedia) {
				const messageMediaCtx = {
					...mediaCtx,
					onDeliveryResult: onMessageDeliveryResult
				};
				const sent = await runChannelMessageSendWithLifecycle({
					lifecycle: messageLifecycle,
					ctx: messageMediaCtx,
					send: async () => {
						await params.onPlatformSendStart?.(messageMediaCtx);
						return await messageMedia(messageMediaCtx);
					}
				});
				return require_delivery_queue.attachOutboundDeliveryCommitHook(normalizeChannelMessageSendResult(params.channel, sent.result), sent.afterCommit);
			}
			if (sendMedia) {
				await params.onPlatformSendStart?.(mediaCtx);
				return sendMedia(mediaCtx);
			}
			await params.onPlatformSendStart?.(mediaCtx);
			return sendText(mediaCtx);
		}
	};
}
function normalizeChannelMessageSendResult(channel, result) {
	const source = result;
	return {
		...source,
		channel,
		messageId: source.messageId ?? source.receipt.primaryPlatformMessageId ?? source.receipt.platformMessageIds[0] ?? "",
		receipt: source.receipt
	};
}
const createChannelOutboundContextBase = (params) => ({
	cfg: params.cfg,
	to: params.to,
	accountId: params.accountId,
	replyToId: params.replyToId,
	replyToIdSource: void 0,
	replyToMode: params.replyToMode,
	formatting: params.formatting,
	threadId: params.threadId,
	identity: params.identity,
	gifPlayback: params.gifPlayback,
	forceDocument: params.forceDocument,
	deps: params.deps,
	silent: params.silent,
	mediaAccess: params.mediaAccess,
	mediaLocalRoots: params.mediaAccess?.localRoots,
	mediaReadFile: params.mediaAccess?.readFile,
	gatewayClientScopes: params.gatewayClientScopes,
	conversationReadOrigin: params.conversationReadOrigin,
	deliveryQueueId: params.deliveryQueueId,
	onPlatformSendDispatch: params.onPlatformSendDispatch,
	onDeliveryResult: params.onDeliveryResult
});
const isAbortError = (err) => err instanceof Error && err.name === "AbortError";
const isDeliveryAbortError = (err) => isAbortError(err) || err instanceof require_delivery_recovery_shared.OutboundDeliveryError && isAbortError(err.cause);
async function persistQueuedPreSendState(params) {
	try {
		await require_delivery_queue.markDeliveryPlatformSendAttemptStarted(params.queueId, params.stateDir, { replyToId: params.route.replyToId ?? null });
		return "marked";
	} catch (markErr) {
		if (params.queuePolicy === "required") throw markErr;
		log.warn(`failed to mark queued delivery ${params.queueId} as platform-send-attempt-started; removing replay intent before best-effort send: ${require_errors.formatErrorMessage(markErr)}`);
		if (params.retainSpoolArtifacts) await require_delivery_queue.ackDelivery(params.queueId, params.stateDir, { retainSpoolArtifacts: true });
		else await require_delivery_queue.ackDelivery(params.queueId, params.stateDir);
		return "acked";
	}
}
async function persistQueuedPostSendState(params) {
	try {
		await require_delivery_queue.markDeliveryPlatformOutcomeUnknown(params.queueId);
		return "marked";
	} catch (markErr) {
		log.warn(`failed to mark queued delivery ${params.queueId} as platform-outcome-unknown; falling back to direct ack (${params.queuePolicy}): ${require_errors.formatErrorMessage(markErr)}`);
		try {
			await require_delivery_queue.ackDelivery(params.queueId);
			return "acked";
		} catch (ackErr) {
			const error = `post-send state persistence failed: marker=${require_errors.formatErrorMessage(markErr)}; ack=${require_errors.formatErrorMessage(ackErr)}`;
			await require_delivery_queue.failDeliveryAfterPlatformSend(params.queueId, error);
			return "failed";
		}
	}
}
/**
* Best-effort session identifier for delivery telemetry only. Falls back to
* `policyKey` as a last resort so diagnostic emission still has a stable
* string when neither mirror nor canonical key are available. **Do not use
* this value for hook-context correlation** — use `sessionKeyForInternalHooks`
* (mirror.sessionKey ?? session.key, no policyKey fallback) instead, so we
* never accidentally hand the policy key to plugins that expect the canonical
* session key.
*/
function sessionKeyForDeliveryDiagnostics(params) {
	return params.mirror?.sessionKey ?? params.session?.key ?? params.session?.policyKey;
}
function deliveryKindForPayload(payload, payloadSummary) {
	if (payloadSummary.mediaUrls.length > 0 || payload.mediaUrl || payload.mediaUrls?.length) return "media";
	if (payload.presentation || payload.interactive || payload.channelData || payload.audioAsVoice) return "other";
	return "text";
}
function emitMessageDeliveryStarted(params) {
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "message.delivery.started",
		channel: params.channel,
		deliveryKind: params.deliveryKind,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
}
function emitMessageDeliveryCompleted(params) {
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "message.delivery.completed",
		channel: params.channel,
		deliveryKind: params.deliveryKind,
		durationMs: params.durationMs,
		resultCount: params.resultCount,
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
}
function emitMessageDeliveryError(params) {
	require_diagnostic_events.emitInternalDiagnosticEvent({
		type: "message.delivery.error",
		channel: params.channel,
		deliveryKind: params.deliveryKind,
		durationMs: params.durationMs,
		errorCategory: require_diagnostic_error_metadata.diagnosticErrorCategory(params.error),
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
}
function normalizeEmptyPayloadForDelivery(payload) {
	const text = typeof payload.text === "string" ? payload.text : "";
	if (!text.trim()) {
		if (!require_payload.hasReplyPayloadContent({
			...payload,
			text
		}, { extraContent: payload.location != null })) return null;
		if (text) return {
			...payload,
			text: ""
		};
	}
	return payload;
}
function normalizePayloadsForChannelDelivery(plan, handler) {
	const normalizedPayloads = [];
	for (const entry of plan) {
		let sanitizedPayload = stripInternalRuntimeScaffoldingFromPayload(entry.payload);
		if (handler.sanitizeText && sanitizedPayload.text) {
			if (!handler.shouldSkipPlainTextSanitization?.(sanitizedPayload)) sanitizedPayload = {
				...sanitizedPayload,
				text: handler.sanitizeText(sanitizedPayload)
			};
		}
		const normalizedPayload = handler.normalizePayload ? handler.normalizePayload(sanitizedPayload) : sanitizedPayload;
		const normalized = normalizedPayload ? normalizeEmptyPayloadForDelivery(stripInternalRuntimeScaffoldingFromPayload(normalizedPayload)) : null;
		if (normalized) normalizedPayloads.push({
			index: entry.sourceIndex,
			payload: normalized
		});
	}
	return normalizedPayloads;
}
function stripInternalRuntimeScaffoldingFromValue(value) {
	if (typeof value === "string") return stripInternalRuntimeScaffolding(value);
	if (Array.isArray(value)) {
		let changed = false;
		const next = value.map((entry) => {
			const stripped = stripInternalRuntimeScaffoldingFromValue(entry);
			changed ||= stripped !== entry;
			return stripped;
		});
		return changed ? next : value;
	}
	if (!value || typeof value !== "object") return value;
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) return value;
	let changed = false;
	const next = {};
	for (const [key, entry] of Object.entries(value)) {
		const stripped = stripInternalRuntimeScaffoldingFromValue(entry);
		changed ||= stripped !== entry;
		next[key] = stripped;
	}
	return changed ? next : value;
}
/** Every media reference a payload set carries, in payload order. */
function collectPayloadMediaSources(payloads) {
	return payloads.flatMap((payload) => [...typeof payload.mediaUrl === "string" && payload.mediaUrl.trim() ? [payload.mediaUrl] : [], ...(payload.mediaUrls ?? []).filter((url) => typeof url === "string" && url.trim())]);
}
/**
* Resolves the media read capability for one send. Queue staging and the live
* send must resolve it identically: staging copies exactly the bytes the send is
* already allowed to read, so a narrower gate here would reject media the send
* would have delivered, and a wider one would widen read authority.
*/
function resolveOutboundMediaAccessForSend(params, channel, mediaSources) {
	if (mediaSources.length === 0) return params.mediaAccess ?? {};
	return require_read_capability.resolveAgentScopedOutboundMediaAccess({
		cfg: params.cfg,
		agentId: params.session?.agentId ?? params.mirror?.agentId,
		mediaSources,
		mediaAccess: params.mediaAccess,
		sessionKey: params.session?.policyKey ?? params.session?.key,
		messageProvider: params.session?.key ? void 0 : channel,
		accountId: params.session?.requesterAccountId ?? params.accountId,
		requesterSenderId: params.session?.requesterSenderId,
		requesterSenderName: params.session?.requesterSenderName,
		requesterSenderUsername: params.session?.requesterSenderUsername,
		requesterSenderE164: params.session?.requesterSenderE164
	});
}
function stripInternalRuntimeScaffoldingFromPayload(payload) {
	const stripped = stripInternalRuntimeScaffoldingFromValue(payload);
	return stripped && typeof stripped === "object" && !Array.isArray(stripped) ? stripped : payload;
}
function buildPayloadSummary(payload) {
	return require_payloads.summarizeOutboundPayloadForTransport(payload);
}
function hasDeliveryResultIdentity(result) {
	return Boolean(result.messageId || result.chatId || result.channelId || result.roomId || result.conversationId || result.toJid || result.pollId);
}
function normalizeDeliveryPin(payload) {
	const pin = payload.delivery?.pin;
	if (pin === true) return { enabled: true };
	if (!pin || typeof pin !== "object" || Array.isArray(pin)) return;
	if (!pin.enabled) return;
	const normalized = { enabled: true };
	if (pin.notify === true) normalized.notify = true;
	if (pin.required === true) normalized.required = true;
	return normalized;
}
async function maybePinDeliveredMessage(params) {
	const pin = normalizeDeliveryPin(params.payload);
	if (!pin) return;
	if (!params.messageId) {
		if (pin.required) throw new Error("Delivery pin requested, but no delivered message id was returned.");
		log.warn("Delivery pin requested, but no delivered message id was returned.", {
			channel: params.target.channel,
			to: params.target.to
		});
		return;
	}
	if (!params.handler.pinDeliveredMessage) {
		if (pin.required) throw new Error(`Delivery pin is not supported by channel: ${params.target.channel}`);
		log.warn("Delivery pin requested, but channel does not support pinning delivered messages.", {
			channel: params.target.channel,
			to: params.target.to
		});
		return;
	}
	try {
		await params.handler.pinDeliveredMessage({
			target: params.target,
			messageId: params.messageId,
			pin,
			gatewayClientScopes: params.gatewayClientScopes
		});
	} catch (err) {
		if (pin.required) throw err;
		log.warn("Delivery pin requested, but channel failed to pin delivered message.", {
			channel: params.target.channel,
			to: params.target.to,
			messageId: params.messageId,
			error: require_errors.formatErrorMessage(err)
		});
	}
}
async function maybeNotifyAfterDeliveredPayload(params) {
	if (!params.handler.afterDeliverPayload || params.results.length === 0) return;
	try {
		await params.handler.afterDeliverPayload({
			target: params.target,
			payload: params.payload,
			results: params.results
		});
	} catch (err) {
		log.warn("Plugin outbound adapter after-delivery hook failed.", {
			channel: params.target.channel,
			to: params.target.to,
			error: require_errors.formatErrorMessage(err)
		});
	}
}
async function renderPresentationForDelivery(handler, payload) {
	const presentation = require_payload.normalizeMessagePresentation(payload.presentation);
	if (!presentation) return payload;
	const adaptedPresentation = adaptMessagePresentationForChannel({
		presentation,
		capabilities: handler.presentationCapabilities
	});
	const adaptedPayload = {
		...payload,
		presentation: adaptedPresentation
	};
	const rendered = handler.renderPresentation ? await handler.renderPresentation(adaptedPayload) : null;
	if (rendered) {
		const { presentation: _presentation, ...withoutPresentation } = rendered;
		return withoutPresentation;
	}
	const { presentation: _presentation, ...withoutPresentation } = payload;
	return {
		...withoutPresentation,
		text: require_payload.renderMessagePresentationFallbackText({
			text: payload.text,
			presentation: adaptedPresentation
		})
	};
}
function createMessageSentEmitter(params) {
	const hasMessageSentHooks = params.hookRunner?.hasHooks("message_sent") ?? false;
	const canEmitInternalHook = Boolean(params.sessionKeyForInternalHooks);
	const emitMessageSent = (event) => {
		if (!hasMessageSentHooks && !canEmitInternalHook) return;
		const canonical = buildCanonicalSentMessageHookContext({
			to: params.to,
			content: event.content,
			success: event.success,
			error: event.error,
			channelId: params.channel,
			accountId: params.accountId ?? void 0,
			conversationId: params.to,
			sessionKey: params.sessionKeyForInternalHooks,
			messageId: event.messageId,
			isGroup: params.mirrorIsGroup,
			groupId: params.mirrorGroupId
		});
		if (hasMessageSentHooks) require_hook_runner_global.fireAndForgetHook(params.hookRunner.runMessageSent(toPluginMessageSentEvent(canonical), toPluginMessageContext(canonical)), "deliverOutboundPayloads: message_sent plugin hook failed", (message) => {
			log.warn(message);
		});
		if (!canEmitInternalHook) return;
		require_hook_runner_global.fireAndForgetHook(require_internal_hooks.triggerInternalHook(require_internal_hooks.createInternalHookEvent("message", "sent", params.sessionKeyForInternalHooks, toInternalMessageSentContext(canonical))), "deliverOutboundPayloads: message:sent internal hook failed", (message) => {
			log.warn(message);
		});
	};
	return {
		emitMessageSent,
		hasMessageSentHooks
	};
}
async function applyMessageSendingHook(params) {
	if (!params.enabled) return {
		cancelled: false,
		contentRewritten: false,
		payload: params.payload,
		payloadSummary: params.payloadSummary
	};
	try {
		const sendingResult = await params.hookRunner.runMessageSending({
			to: params.to,
			content: params.payloadSummary.hookContent ?? params.payloadSummary.text,
			replyToId: params.replyToId ?? void 0,
			threadId: params.threadId ?? void 0,
			metadata: {
				channel: params.channel,
				accountId: params.accountId,
				mediaUrls: params.payloadSummary.mediaUrls
			}
		}, {
			channelId: params.channel,
			accountId: params.accountId ?? void 0,
			conversationId: params.to,
			...params.sessionKey ? { sessionKey: params.sessionKey } : {}
		});
		if (sendingResult?.cancel) return {
			cancelled: true,
			...sendingResult.cancelReason ? { cancelReason: sendingResult.cancelReason } : {},
			...sendingResult.metadata ? { hookMetadata: sendingResult.metadata } : {},
			contentRewritten: false,
			payload: params.payload,
			payloadSummary: params.payloadSummary
		};
		if (sendingResult?.content == null) return {
			cancelled: false,
			contentRewritten: false,
			payload: params.payload,
			payloadSummary: params.payloadSummary
		};
		if (params.payloadSummary.hookContent && !params.payloadSummary.text) {
			const spokenText = sendingResult.content;
			return {
				cancelled: false,
				contentRewritten: true,
				payload: {
					...params.payload,
					spokenText
				},
				payloadSummary: {
					...params.payloadSummary,
					hookContent: spokenText
				}
			};
		}
		return {
			cancelled: false,
			contentRewritten: true,
			payload: {
				...params.payload,
				text: sendingResult.content
			},
			payloadSummary: {
				...params.payloadSummary,
				text: sendingResult.content
			}
		};
	} catch {
		return {
			cancelled: false,
			contentRewritten: false,
			payload: params.payload,
			payloadSummary: params.payloadSummary
		};
	}
}
async function applyReplyPayloadSendingHook(params) {
	if (!params.hook) return {
		cancelled: false,
		payload: params.payload,
		changed: false
	};
	const nextPayload = await runReplyPayloadSendingHook({
		payload: params.payload,
		kind: params.hook.kind,
		...params.hook.channel ? { channel: params.hook.channel } : {},
		...params.hook.sessionKey ? { sessionKey: params.hook.sessionKey } : {},
		...params.hook.runId ? { runId: params.hook.runId } : {},
		context: params.hook.context
	});
	if (!nextPayload) return {
		cancelled: true,
		payload: params.payload,
		changed: false
	};
	return {
		cancelled: false,
		payload: nextPayload,
		changed: nextPayload !== params.payload
	};
}
function toOutboundDeliveryError(params) {
	if (params.error instanceof require_delivery_recovery_shared.OutboundDeliveryError) return params.error;
	return new require_delivery_recovery_shared.OutboundDeliveryError(require_errors.formatErrorMessage(params.error), {
		cause: params.error,
		results: params.results,
		payloadOutcomes: params.payloadOutcomes,
		stage: params.stage
	});
}
function suppressedPayloadOutcome(params) {
	return {
		index: params.index,
		status: "suppressed",
		reason: params.reason,
		...params.hookEffect ? { hookEffect: params.hookEffect } : {}
	};
}
async function deliverOutboundPayloadsInternal(params) {
	const auditStartedAt = Date.now();
	const { channel, to, payloads } = params;
	const emitPreQueueFailure = () => {
		if (params.deliveryQueueId !== void 0) return;
		require_delivery_queue.emitOutboundAuditTerminals({
			context: params,
			terminals: () => require_delivery_queue.uniformOutboundAuditTerminals(params.payloads.length, {
				outcome: "failed",
				failureStage: "queue"
			}),
			startedAt: auditStartedAt
		});
	};
	if (params.requireUnknownSendReconciliation === true && payloads.length !== 1) {
		emitPreQueueFailure();
		throw new Error(`Required durable message send is unsupported for ${channel}: unknown-send reconciliation requires exactly one payload`);
	}
	if (params.deferredDeliveryAdmissionPassed !== true) {
		const admission = require_delivery_queue.resolveDeferredDeliveryAdmission({
			cfg: params.cfg,
			channel,
			to,
			accountId: params.accountId,
			phase: "live"
		});
		if (admission.status === "permanent_rejection") {
			emitPreQueueFailure();
			throw new Error(admission.reason);
		}
	}
	const queuePolicy = params.queuePolicy ?? "best_effort";
	const strippedQueuePayloads = payloads.map(stripInternalRuntimeScaffoldingFromPayload);
	const queuePayloadsChanged = strippedQueuePayloads.some((payload, index) => payload !== payloads[index]);
	const renderedBatchPlan = params.renderedBatchPlan ?? createRenderedMessageBatchPlan(params.payloads);
	const queueRenderedBatchPlan = queuePayloadsChanged ? createRenderedMessageBatchPlan(strippedQueuePayloads) : renderedBatchPlan;
	const stageAndEnqueueDelivery = async () => {
		const staged = await require_delivery_queue_media_spool.stageQueuePayloadMedia({
			payloads: strippedQueuePayloads,
			mediaAccess: resolveOutboundMediaAccessForSend(params, channel, collectPayloadMediaSources(strippedQueuePayloads)),
			maxBytes: require_read_capability.resolveOutboundMediaMaxBytes({
				cfg: params.cfg,
				channel,
				accountId: params.accountId
			})
		});
		if (staged.status !== "staged") {
			if (queuePolicy === "required") throw new Error(`Required durable message send is unsupported for ${channel}: ${staged.reason} cannot be persisted`);
			return null;
		}
		try {
			const delivery = {
				channel,
				to,
				accountId: params.accountId,
				queuePolicy,
				requireUnknownSendReconciliation: params.requireUnknownSendReconciliation,
				payloads: staged.payloads,
				renderedBatchPlan: queueRenderedBatchPlan,
				threadId: params.threadId,
				replyToId: params.replyToId,
				replyToMode: params.replyToMode,
				formatting: params.formatting,
				identity: params.identity,
				bestEffort: params.bestEffort,
				gifPlayback: params.gifPlayback,
				forceDocument: params.forceDocument,
				replyPayloadSendingHook: params.replyPayloadSendingHook,
				silent: params.silent,
				mirror: params.mirror,
				session: params.session,
				gatewayClientScopes: params.gatewayClientScopes
			};
			return staged.mediaStageId ? await require_delivery_queue.enqueueDelivery(delivery, void 0, staged.mediaStageId) : await require_delivery_queue.enqueueDelivery(delivery);
		} catch (err) {
			require_delivery_queue_media_spool.cancelDeliveryQueueMediaStage(staged.mediaStageId);
			await require_delivery_queue_media_spool.releaseSpoolArtifacts(staged.artifacts);
			throw err;
		}
	};
	const queueId = params.skipQueue ? null : await stageAndEnqueueDelivery().catch((err) => {
		if (queuePolicy === "required") {
			emitPreQueueFailure();
			throw err;
		}
		return null;
	});
	if (queueId) params.onDeliveryIntent?.({
		id: queueId,
		channel,
		to,
		...params.accountId ? { accountId: params.accountId } : {},
		queuePolicy
	});
	if (!queueId) return await deliverOutboundPayloadsWithQueueCleanup(params, null, auditStartedAt);
	const claimResult = await require_delivery_queue.withActiveDeliveryClaim(queueId, () => deliverOutboundPayloadsWithQueueCleanup(params, queueId, auditStartedAt));
	if (claimResult.status === "claimed-by-other-owner") return [];
	return claimResult.value;
}
async function deliverOutboundPayloadsWithQueueCleanup(params, queueId, auditStartedAt) {
	let hadPartialFailure = false;
	let lastPayloadError;
	let partialFailuresAreProvenNotSent = true;
	const ownsAuditTerminal = params.deliveryQueueId === void 0;
	const auditPayloadOutcomes = ownsAuditTerminal && require_message_audit_events.hasTrustedMessageAuditListeners() ? [] : void 0;
	const queuePolicy = params.queuePolicy ?? "best_effort";
	const platformQueueId = queueId ?? params.deliveryQueueId;
	const platformQueuePolicy = queueId ? queuePolicy : params.queuePolicy ?? "required";
	const platformQueueStateDir = queueId ? void 0 : params.deliveryQueueStateDir;
	const exactReconciliationRequired = params.requireUnknownSendReconciliation === true && platformQueueId !== void 0;
	let queuedPreSendState;
	let queuedPostSendState;
	let platformSendRoute;
	let deliveredResults = [];
	let commitHooksRun = false;
	const emitTerminals = (terminals) => {
		if (!ownsAuditTerminal) return;
		require_delivery_queue.emitOutboundAuditTerminals({
			context: params,
			terminals,
			startedAt: auditStartedAt,
			...queueId ? { queueId } : {}
		});
	};
	const runCommitHooksAfterAck = async () => {
		if (queuedPostSendState !== "acked" || params.deferCommitHooks || commitHooksRun || deliveredResults.length === 0) return;
		commitHooksRun = true;
		await require_delivery_queue.runOutboundDeliveryCommitHooks(deliveredResults);
	};
	const wrappedParams = {
		...params,
		...exactReconciliationRequired && params.payloads.length === 1 ? { deliveryQueueId: platformQueueId } : { deliveryQueueId: void 0 },
		requiredUnknownSendReconciliation: exactReconciliationRequired,
		onPlatformSendStart: async (route) => {
			platformSendRoute = route;
			if (platformQueueId && !exactReconciliationRequired && queuedPreSendState === void 0) {
				queuedPreSendState = await persistQueuedPreSendState({
					queueId: platformQueueId,
					queuePolicy: platformQueuePolicy,
					stateDir: platformQueueStateDir,
					route,
					retainSpoolArtifacts: queueId === null && params.deliveryQueueId !== void 0
				});
				if (queueId && queuedPreSendState === "acked") queuedPostSendState = "acked";
			}
			await params.onPlatformSendStart?.(route);
		},
		onPlatformSendDispatch: async () => {
			if (platformQueueId && queuedPreSendState !== "acked") try {
				await require_delivery_queue.markDeliveryPlatformSendDispatched(platformQueueId, platformQueueStateDir, platformSendRoute);
				queuedPreSendState ??= "marked";
			} catch (dispatchMarkError) {
				if (exactReconciliationRequired) throw dispatchMarkError;
				log.warn(`failed to refresh queued delivery ${platformQueueId} at platform dispatch; continuing best-effort send: ${require_errors.formatErrorMessage(dispatchMarkError)}`);
			}
			await params.onPlatformSendDispatch?.();
		},
		onError: (err, payload) => {
			hadPartialFailure = true;
			lastPayloadError = err;
			partialFailuresAreProvenNotSent &&= require_delivery_recovery_shared.isProvenDeliveryNotSentError(err);
			params.onError?.(err, payload);
		},
		...auditPayloadOutcomes ? { onPayloadDeliveryOutcome: (outcome) => {
			auditPayloadOutcomes.push(outcome);
			params.onPayloadDeliveryOutcome?.(outcome);
		} } : {},
		onDeliveryResult: async (result) => {
			deliveredResults.push(result);
			if (queueId && queuedPostSendState === void 0) queuedPostSendState = await persistQueuedPostSendState({
				queueId,
				queuePolicy
			});
			await params.onDeliveryResult?.(result);
		}
	};
	let platformResultsReturned = false;
	try {
		const results = await deliverOutboundPayloadsCore(wrappedParams);
		deliveredResults = results;
		platformResultsReturned = true;
		if (!queueId) {
			if (!params.deferCommitHooks) await require_delivery_queue.runOutboundDeliveryCommitHooks(results);
			emitTerminals(() => hadPartialFailure ? require_delivery_queue.failedOutboundAuditTerminals({
				payloadCount: params.payloads.length,
				results,
				payloadOutcomes: auditPayloadOutcomes ?? [],
				failureStage: "platform_send"
			}) : require_delivery_queue.completedOutboundAuditTerminals({
				payloadCount: params.payloads.length,
				results,
				payloadOutcomes: auditPayloadOutcomes ?? []
			}));
			return results;
		}
		if (queueId) if (hadPartialFailure) {
			const partialSendEvidence = results.length > 0 || lastPayloadError instanceof require_delivery_recovery_shared.OutboundDeliveryError && lastPayloadError.sentBeforeError;
			const postSendState = queuedPostSendState ?? (partialSendEvidence ? await persistQueuedPostSendState({
				queueId,
				queuePolicy
			}) : void 0);
			const error = "partial delivery failure (bestEffort)";
			if (postSendState === void 0 || postSendState === "marked") await (!partialSendEvidence && partialFailuresAreProvenNotSent ? require_delivery_queue.failDeliveryBeforePlatformSend : require_delivery_queue.failDelivery)(queueId, error).catch((err) => {
				log.warn(`failed to mark queued delivery ${queueId} as failed after partial failure; continuing best-effort delivery: ${require_errors.formatErrorMessage(err)}`);
			});
			else if (postSendState === "acked") {
				await runCommitHooksAfterAck();
				emitTerminals(() => require_delivery_queue.failedOutboundAuditTerminals({
					payloadCount: params.payloads.length,
					results,
					payloadOutcomes: auditPayloadOutcomes ?? [],
					failureStage: "platform_send"
				}));
			}
		} else {
			const postSendState = queuedPostSendState ?? (results.length > 0 || queuedPreSendState === "marked" ? await persistQueuedPostSendState({
				queueId,
				queuePolicy
			}) : queuedPreSendState === "acked" ? "acked" : void 0);
			if (postSendState === "acked" ? true : postSendState === "failed" ? false : await require_delivery_queue.ackDelivery(queueId).then(() => true).catch(async (err) => {
				const hasSendEvidence = deliveredResults.length > 0 || queuedPreSendState !== void 0;
				try {
					if (hasSendEvidence) {
						await require_delivery_queue.failDeliveryAfterPlatformSend(queueId, `failed to ack sent delivery: ${require_errors.formatErrorMessage(err)}`);
						queuedPostSendState = "failed";
					} else await require_delivery_queue.failDelivery(queueId, `failed to ack unsent delivery: ${require_errors.formatErrorMessage(err)}`);
				} catch (persistErr) {
					log.warn(`failed to preserve queued delivery ${queueId} after ack failure: ${require_errors.formatErrorMessage(persistErr)}`);
				}
				if (queuePolicy === "required") throw err;
				log.warn(hasSendEvidence ? `failed to ack queued delivery ${queueId}; preserved unknown-after-send state: ${require_errors.formatErrorMessage(err)}` : `failed to ack unsent queued delivery ${queueId}; retained it for retry: ${require_errors.formatErrorMessage(err)}`);
				return false;
			})) {
				queuedPostSendState = "acked";
				await runCommitHooksAfterAck();
				emitTerminals(() => require_delivery_queue.completedOutboundAuditTerminals({
					payloadCount: params.payloads.length,
					results,
					payloadOutcomes: auditPayloadOutcomes ?? []
				}));
			}
		}
		return results;
	} catch (err) {
		if (err instanceof require_delivery_recovery_shared.OutboundDeliveryError && err.results.length > 0) deliveredResults = err.results;
		if (queueId) {
			if (isDeliveryAbortError(err)) {
				if (await require_delivery_queue.ackDelivery(queueId).then(() => true).catch(() => false)) emitTerminals(() => require_delivery_queue.failedOutboundAuditTerminals({
					payloadCount: params.payloads.length,
					results: deliveredResults,
					payloadOutcomes: auditPayloadOutcomes ?? [],
					failureStage: "queue"
				}));
			} else if (!platformResultsReturned) if (deliveredResults.length > 0 || err instanceof require_delivery_recovery_shared.OutboundDeliveryError && err.sentBeforeError) {
				try {
					queuedPostSendState ??= await persistQueuedPostSendState({
						queueId,
						queuePolicy
					});
					if (queuedPostSendState === "marked") {
						await require_delivery_queue.failDeliveryAfterPlatformSend(queueId, require_errors.formatErrorMessage(err));
						queuedPostSendState = "failed";
					}
				} catch (persistErr) {
					log.warn(`failed to preserve queued delivery ${queueId} post-send evidence: ${require_errors.formatErrorMessage(persistErr)}`);
				}
				await runCommitHooksAfterAck();
				if (queuedPostSendState === "acked") emitTerminals(() => require_delivery_queue.failedOutboundAuditTerminals({
					payloadCount: params.payloads.length,
					results: deliveredResults,
					payloadOutcomes: auditPayloadOutcomes ?? [],
					failureStage: err instanceof require_delivery_recovery_shared.OutboundDeliveryError ? err.stage : "platform_send"
				}));
			} else if (queuedPreSendState === "acked") emitTerminals(() => require_delivery_queue.failedOutboundAuditTerminals({
				payloadCount: params.payloads.length,
				results: deliveredResults,
				payloadOutcomes: auditPayloadOutcomes ?? [],
				failureStage: err instanceof require_delivery_recovery_shared.OutboundDeliveryError ? err.stage : "platform_send"
			}));
			else await (require_delivery_recovery_shared.isProvenDeliveryNotSentError(err) ? require_delivery_queue.failDeliveryBeforePlatformSend : require_delivery_queue.failDelivery)(queueId, require_errors.formatErrorMessage(err)).catch((failErr) => {
				log.warn(`failed to mark queued delivery ${queueId} as failed: ${require_errors.formatErrorMessage(failErr)}`);
			});
		} else emitTerminals(() => require_delivery_queue.failedOutboundAuditTerminals({
			payloadCount: params.payloads.length,
			results: deliveredResults,
			payloadOutcomes: auditPayloadOutcomes ?? [],
			failureStage: err instanceof require_delivery_recovery_shared.OutboundDeliveryError ? err.stage : "platform_send"
		}));
		throw err;
	}
}
/** Core delivery logic (extracted for queue wrapper). */
async function deliverOutboundPayloadsCore(params) {
	const { cfg, channel, to, payloads } = params;
	const directiveOptions = await resolveChannelOutboundDirectiveOptions({
		cfg,
		channel
	});
	const outboundPayloadPlan = require_payloads.createOutboundPayloadPlan(payloads, {
		cfg,
		sessionKey: params.session?.policyKey ?? params.session?.key,
		surface: channel,
		conversationType: params.session?.conversationType,
		extractMarkdownImages: directiveOptions.extractMarkdownImages
	});
	const accountId = params.accountId;
	const deps = params.deps;
	const abortSignal = params.abortSignal;
	const results = [];
	let reportedResults = [];
	const resultIdentityKey = (delivery) => JSON.stringify([
		delivery.channel,
		delivery.messageId,
		delivery.chatId,
		delivery.channelId,
		delivery.roomId,
		delivery.conversationId,
		delivery.timestamp,
		delivery.toJid,
		delivery.pollId
	]);
	const resultPlatformIds = (delivery, options) => {
		const ids = /* @__PURE__ */ new Set();
		const add = (value) => {
			const id = value?.trim();
			if (id && id !== "unknown" && id !== "suppressed") ids.add(id);
		};
		if (!options?.receiptOnly) add(delivery.messageId);
		add(delivery.receipt?.primaryPlatformMessageId);
		for (const id of delivery.receipt?.platformMessageIds ?? []) add(id);
		for (const part of delivery.receipt?.parts ?? []) add(part.platformMessageId);
		return ids;
	};
	const reportIdentifiedDeliveryResult = async (delivery) => {
		if (!hasDeliveryResultIdentity(delivery)) return;
		const resultIndex = results.length;
		results.push(delivery);
		reportedResults.push({
			identityKey: resultIdentityKey(delivery),
			resultIndex
		});
		await params.onDeliveryResult?.(delivery);
	};
	const recordIdentifiedDeliveryResults = async (deliveries, options) => {
		const reportedByIdentity = /* @__PURE__ */ new Map();
		for (const reported of reportedResults) {
			const matches = reportedByIdentity.get(reported.identityKey) ?? [];
			matches.push(reported.resultIndex);
			reportedByIdentity.set(reported.identityKey, matches);
		}
		try {
			const recorded = [];
			const availableReportedIndices = new Set(reportedResults.map((reported) => reported.resultIndex));
			const replacements = /* @__PURE__ */ new Map();
			const removals = /* @__PURE__ */ new Set();
			const appendResults = [];
			for (const delivery of deliveries) {
				if (!hasDeliveryResultIdentity(delivery)) {
					recorded.push(false);
					continue;
				}
				const receiptPartIds = (delivery.receipt?.parts ?? []).map((part) => part.platformMessageId?.trim()).filter((id) => Boolean(id && id !== "unknown" && id !== "suppressed"));
				const receiptIds = receiptPartIds.length > 0 ? receiptPartIds : [...resultPlatformIds(delivery, { receiptOnly: true })];
				const coveredIndices = [];
				for (const receiptId of receiptIds) {
					const matchingIndices = reportedResults.filter((reported) => availableReportedIndices.has(reported.resultIndex) && !coveredIndices.includes(reported.resultIndex) && results[reported.resultIndex]?.channel === delivery.channel && resultPlatformIds((0, _gabrielvfonseca_normalization_core.expectDefined)(results[reported.resultIndex], "results entry at reported.result index")).has(receiptId)).map((reported) => reported.resultIndex);
					const matchingIndex = options?.finalResultIsLastReported ? matchingIndices.at(-1) : matchingIndices[0];
					if (matchingIndex !== void 0 && !coveredIndices.includes(matchingIndex)) coveredIndices.push(matchingIndex);
				}
				let reportedIndex;
				if (coveredIndices.length > 0) {
					reportedIndex = Math.min(...coveredIndices);
					for (const coveredIndex of coveredIndices) {
						availableReportedIndices.delete(coveredIndex);
						if (coveredIndex !== reportedIndex) removals.add(coveredIndex);
					}
				} else {
					const reportedMatches = (reportedByIdentity.get(resultIdentityKey(delivery)) ?? []).filter((index) => availableReportedIndices.has(index));
					reportedIndex = options?.finalResultIsLastReported ? reportedMatches.at(-1) : reportedMatches[0];
					if (reportedIndex !== void 0) availableReportedIndices.delete(reportedIndex);
				}
				if (reportedIndex !== void 0) replacements.set(reportedIndex, delivery);
				else appendResults.push(delivery);
				recorded.push(true);
			}
			if (replacements.size > 0 || removals.size > 0) {
				const reconciled = results.flatMap((result, index) => {
					if (removals.has(index)) return [];
					return [replacements.get(index) ?? result];
				});
				results.splice(0, results.length, ...reconciled);
			}
			for (const delivery of appendResults) {
				results.push(delivery);
				await params.onDeliveryResult?.(delivery);
			}
			return recorded;
		} finally {
			reportedResults = [];
		}
	};
	const recordIdentifiedDeliveryResult = async (delivery) => (await recordIdentifiedDeliveryResults([delivery], { finalResultIsLastReported: true }))[0] ?? false;
	const resolveMediaAccess = (mediaSources) => resolveOutboundMediaAccessForSend(params, channel, mediaSources);
	const createHandler = (mediaSources) => createChannelHandler({
		cfg,
		channel,
		to,
		deps,
		accountId,
		replyToId: params.replyToId,
		replyToMode: params.replyToMode,
		formatting: params.formatting,
		threadId: params.threadId,
		identity: params.identity,
		gifPlayback: params.gifPlayback,
		forceDocument: params.forceDocument,
		silent: params.silent,
		mediaAccess: resolveMediaAccess(mediaSources),
		gatewayClientScopes: params.gatewayClientScopes,
		conversationReadOrigin: params.conversationReadOrigin,
		deliveryQueueId: params.deliveryQueueId,
		requiredUnknownSendReconciliation: params.requiredUnknownSendReconciliation,
		onPlatformSendStart: params.onPlatformSendStart,
		onPlatformSendDispatch: params.onPlatformSendDispatch,
		onDeliveryResult: reportIdentifiedDeliveryResult
	});
	const baseHandler = await createHandler([]);
	const handlerByMediaSources = /* @__PURE__ */ new Map();
	const getDeliveryHandler = (mediaSources) => {
		if (mediaSources.length === 0) return Promise.resolve(baseHandler);
		const key = JSON.stringify(mediaSources);
		const cached = handlerByMediaSources.get(key);
		if (cached) return cached;
		const created = createHandler(mediaSources);
		handlerByMediaSources.set(key, created);
		return created;
	};
	const handler = baseHandler;
	const configuredTextLimit = handler.chunker ? require_chunk.resolveTextChunkLimit(cfg, channel, accountId, { fallbackLimit: handler.textChunkLimit }) : void 0;
	const textLimit = params.formatting?.textLimit ?? (handler.resolveEffectiveTextChunkLimit ? handler.resolveEffectiveTextChunkLimit(configuredTextLimit) : configuredTextLimit);
	const chunkMode = handler.chunker ? params.formatting?.chunkMode ?? require_chunk.resolveChunkMode(cfg, channel, accountId) : "length";
	const { resolveCurrentReplyTo, applyReplyToConsumption } = require_reply_payload.createReplyToDeliveryPolicy({
		replyToId: params.replyToId,
		replyToMode: params.replyToMode
	});
	const sendTextChunks = async (sendHandler, text, overrides = {}) => {
		const units = planOutboundTextMessageUnits({
			text,
			overrides,
			chunker: sendHandler.chunker,
			chunkerMode: sendHandler.chunkerMode,
			chunkedTextFormatting: sendHandler.chunkedTextFormatting,
			textLimit,
			chunkMode,
			formatting: params.formatting,
			consumeReplyTo: (value) => applyReplyToConsumption(value, { consumeImplicitReply: value.replyToIdSource === "implicit" })
		});
		for (const unit of units) {
			if (unit.kind !== "text") continue;
			throwIfAborted(abortSignal);
			await recordIdentifiedDeliveryResult(await sendHandler.sendText(unit.text, unit.overrides));
		}
	};
	const normalizedPayloads = normalizePayloadsForChannelDelivery(outboundPayloadPlan, handler);
	const payloadOutcomes = [];
	const effectiveDeliveryKinds = /* @__PURE__ */ new Map();
	const recordPayloadOutcome = (outcome) => {
		const deliveryKind = effectiveDeliveryKinds.get(outcome.index);
		const recordedOutcome = deliveryKind && outcome.status !== "suppressed" ? {
			...outcome,
			deliveryKind
		} : outcome;
		payloadOutcomes.push(recordedOutcome);
		params.onPayloadDeliveryOutcome?.(recordedOutcome);
	};
	if (normalizedPayloads.length === 0) for (const [index] of payloads.entries()) recordPayloadOutcome(suppressedPayloadOutcome({
		index,
		reason: "no_visible_payload"
	}));
	else {
		const normalizedPayloadIndexes = new Set(normalizedPayloads.map((entry) => entry.index));
		for (const [index] of payloads.entries()) if (!normalizedPayloadIndexes.has(index)) recordPayloadOutcome(suppressedPayloadOutcome({
			index,
			reason: "no_visible_payload"
		}));
	}
	const deliveredMirrorPayloads = [];
	const recordDeliveredMirrorPayload = (payloadSummary, deliveredResults) => {
		if (!params.mirror || deliveredResults.length === 0) return;
		deliveredMirrorPayloads.push(payloadSummary);
	};
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	const sessionKeyForInternalHooks = params.mirror?.sessionKey ?? params.session?.key;
	const mirrorIsGroup = params.mirror?.isGroup;
	const mirrorGroupId = params.mirror?.groupId;
	const { emitMessageSent, hasMessageSentHooks } = createMessageSentEmitter({
		hookRunner,
		channel,
		to,
		accountId,
		sessionKeyForInternalHooks,
		mirrorIsGroup,
		mirrorGroupId
	});
	const hasMessageSendingHooks = hookRunner?.hasHooks("message_sending") ?? false;
	const diagnosticSessionKey = sessionKeyForDeliveryDiagnostics(params);
	if (hasMessageSentHooks && params.session?.agentId && !sessionKeyForInternalHooks) log.warn("deliverOutboundPayloads: session.agentId present without session key; internal message:sent hook will be skipped", {
		channel,
		to,
		agentId: params.session.agentId
	});
	for (const { index: payloadIndex, payload } of normalizedPayloads) {
		const payloadResultStartIndex = results.length;
		let payloadSummary = buildPayloadSummary(payload);
		const originalMediaCount = payloadSummary.mediaUrls.length;
		let deliveryKind = "other";
		let deliveryStartedAt = 0;
		let deliveryStarted = false;
		let deliveryFinished = false;
		const startDeliveryDiagnostics = (kind) => {
			deliveryKind = kind;
			deliveryStartedAt = Date.now();
			deliveryStarted = true;
			deliveryFinished = false;
			emitMessageDeliveryStarted({
				channel,
				deliveryKind,
				sessionKey: diagnosticSessionKey
			});
		};
		const completeDeliveryDiagnostics = (resultCount) => {
			if (!deliveryStarted) return;
			deliveryFinished = true;
			emitMessageDeliveryCompleted({
				channel,
				deliveryKind,
				durationMs: Date.now() - deliveryStartedAt,
				resultCount,
				sessionKey: diagnosticSessionKey
			});
		};
		const errorDeliveryDiagnostics = (err) => {
			if (!deliveryStarted || deliveryFinished) return;
			deliveryFinished = true;
			emitMessageDeliveryError({
				channel,
				deliveryKind,
				durationMs: Date.now() - deliveryStartedAt,
				error: err,
				sessionKey: diagnosticSessionKey
			});
		};
		try {
			throwIfAborted(abortSignal);
			const replyHookResult = await applyReplyPayloadSendingHook({
				hook: params.replyPayloadSendingHook,
				payload
			});
			if (replyHookResult.cancelled) {
				recordPayloadOutcome(suppressedPayloadOutcome({
					index: payloadIndex,
					reason: "cancelled_by_reply_payload_sending_hook"
				}));
				continue;
			}
			let deliveryPayload = replyHookResult.payload;
			payloadSummary = buildPayloadSummary(deliveryPayload);
			const hookResult = await applyMessageSendingHook({
				hookRunner,
				enabled: hasMessageSendingHooks,
				payload: deliveryPayload,
				payloadSummary,
				to,
				channel,
				accountId,
				replyToId: resolveCurrentReplyTo(deliveryPayload).replyToId,
				threadId: params.threadId,
				sessionKey: sessionKeyForInternalHooks
			});
			if (hookResult.cancelled) {
				const hookEffect = hookResult.cancelReason || hookResult.hookMetadata ? {
					...hookResult.cancelReason ? { cancelReason: hookResult.cancelReason } : {},
					...hookResult.hookMetadata ? { metadata: hookResult.hookMetadata } : {}
				} : void 0;
				recordPayloadOutcome(suppressedPayloadOutcome({
					index: payloadIndex,
					reason: "cancelled_by_message_sending_hook",
					...hookEffect ? { hookEffect } : {}
				}));
				continue;
			}
			deliveryPayload = hookResult.payload;
			const renderedPayload = stripInternalRuntimeScaffoldingFromPayload(await renderPresentationForDelivery(await getDeliveryHandler(buildPayloadSummary(deliveryPayload).mediaUrls), deliveryPayload));
			const renderedHandler = await getDeliveryHandler(buildPayloadSummary(renderedPayload).mediaUrls);
			const normalizedEffectivePayload = renderedHandler.normalizePayload ? renderedHandler.normalizePayload(renderedPayload) : renderedPayload;
			const effectivePayload = normalizedEffectivePayload ? normalizeEmptyPayloadForDelivery(stripInternalRuntimeScaffoldingFromPayload(normalizedEffectivePayload)) : null;
			if (!effectivePayload) {
				recordPayloadOutcome(suppressedPayloadOutcome({
					index: payloadIndex,
					reason: hookResult.contentRewritten ? "empty_after_message_sending_hook" : replyHookResult.changed ? "empty_after_reply_payload_sending_hook" : "no_visible_payload"
				}));
				continue;
			}
			const effectivePayloadSummary = buildPayloadSummary(effectivePayload);
			assertStableMediaFanout(params, payloadIndex, originalMediaCount, effectivePayloadSummary);
			payloadSummary = effectivePayloadSummary;
			const deliveryHandler = await getDeliveryHandler(payloadSummary.mediaUrls);
			const effectiveDeliveryKind = deliveryKindForPayload(effectivePayload, payloadSummary);
			effectiveDeliveryKinds.set(payloadIndex, effectiveDeliveryKind);
			startDeliveryDiagnostics(effectiveDeliveryKind);
			params.onPayload?.(payloadSummary);
			const replyToResolution = resolveCurrentReplyTo(effectivePayload);
			const sendOverrides = {
				replyToId: replyToResolution.replyToId,
				replyToIdSource: replyToResolution.source,
				...params.threadId !== void 0 ? { threadId: params.threadId } : {},
				...effectivePayload.audioAsVoice === true ? { audioAsVoice: true } : {},
				...params.forceDocument !== void 0 ? { forceDocument: params.forceDocument } : {}
			};
			const applySendReplyToConsumption = (overrides) => applyReplyToConsumption(overrides, { consumeImplicitReply: replyToResolution.source === "implicit" });
			const deliveryTarget = deliveryHandler.buildTargetRef({ threadId: sendOverrides.threadId });
			if (deliveryHandler.sendPayload && (effectivePayload.isError === true && deliveryHandler.sendTextOnlyErrorPayloads === true || require_payload.hasReplyPayloadContent({
				presentation: effectivePayload.presentation,
				interactive: effectivePayload.interactive,
				channelData: effectivePayload.channelData,
				location: effectivePayload.location
			}, { extraContent: effectivePayload.location != null }) || effectivePayload.audioAsVoice === true || effectivePayload.videoAsNote === true)) {
				const beforeCount = results.length;
				await recordIdentifiedDeliveryResult(await deliveryHandler.sendPayload(effectivePayload, applySendReplyToConsumption(sendOverrides)));
				const deliveredResults = results.slice(beforeCount);
				if (deliveredResults.length === 0) {
					completeDeliveryDiagnostics(0);
					recordPayloadOutcome(suppressedPayloadOutcome({
						index: payloadIndex,
						reason: "adapter_returned_no_identity"
					}));
					continue;
				}
				recordPayloadOutcome({
					index: payloadIndex,
					status: "sent",
					results: deliveredResults
				});
				recordDeliveredMirrorPayload(payloadSummary, deliveredResults);
				await maybePinDeliveredMessage({
					handler: deliveryHandler,
					payload: effectivePayload,
					target: deliveryTarget,
					messageId: deliveredResults.find((entry) => entry.messageId)?.messageId,
					gatewayClientScopes: params.gatewayClientScopes
				});
				await maybeNotifyAfterDeliveredPayload({
					handler: deliveryHandler,
					payload: effectivePayload,
					target: deliveryTarget,
					results: deliveredResults
				});
				completeDeliveryDiagnostics(deliveredResults.length);
				emitMessageSent({
					success: true,
					content: payloadSummary.hookContent ?? payloadSummary.text,
					messageId: deliveredResults.at(-1)?.messageId
				});
				continue;
			}
			if (payloadSummary.mediaUrls.length === 0) {
				const beforeCount = results.length;
				if (deliveryHandler.sendFormattedText) await recordIdentifiedDeliveryResults(await deliveryHandler.sendFormattedText(payloadSummary.text, applySendReplyToConsumption(sendOverrides)));
				else await sendTextChunks(deliveryHandler, payloadSummary.text, sendOverrides);
				const deliveredResults = results.slice(beforeCount);
				if (deliveredResults.length > 0) {
					recordPayloadOutcome({
						index: payloadIndex,
						status: "sent",
						results: deliveredResults
					});
					recordDeliveredMirrorPayload(payloadSummary, deliveredResults);
				} else recordPayloadOutcome(suppressedPayloadOutcome({
					index: payloadIndex,
					reason: "adapter_returned_no_identity"
				}));
				const messageId = deliveredResults.at(-1)?.messageId;
				const pinMessageId = deliveredResults.find((entry) => entry.messageId)?.messageId;
				await maybePinDeliveredMessage({
					handler: deliveryHandler,
					payload: effectivePayload,
					target: deliveryTarget,
					messageId: pinMessageId,
					gatewayClientScopes: params.gatewayClientScopes
				});
				await maybeNotifyAfterDeliveredPayload({
					handler: deliveryHandler,
					payload: effectivePayload,
					target: deliveryTarget,
					results: deliveredResults
				});
				completeDeliveryDiagnostics(deliveredResults.length);
				emitMessageSent({
					success: deliveredResults.length > 0,
					content: payloadSummary.hookContent ?? payloadSummary.text,
					messageId
				});
				continue;
			}
			if (!deliveryHandler.supportsMedia) {
				log.warn("Plugin outbound adapter does not implement sendMedia; media URLs will be dropped and text fallback will be used", {
					channel,
					to,
					mediaCount: payloadSummary.mediaUrls.length
				});
				const fallbackText = payloadSummary.text.trim();
				if (!fallbackText) throw new Error("Plugin outbound adapter does not implement sendMedia and no text fallback is available for media payload");
				const beforeCount = results.length;
				await sendTextChunks(deliveryHandler, fallbackText, sendOverrides);
				const deliveredResults = results.slice(beforeCount);
				if (deliveredResults.length > 0) {
					recordPayloadOutcome({
						index: payloadIndex,
						status: "sent",
						results: deliveredResults
					});
					recordDeliveredMirrorPayload(payloadSummary, deliveredResults);
				} else recordPayloadOutcome(suppressedPayloadOutcome({
					index: payloadIndex,
					reason: "adapter_returned_no_identity"
				}));
				const messageId = deliveredResults.at(-1)?.messageId;
				const pinMessageId = deliveredResults.find((entry) => entry.messageId)?.messageId;
				await maybePinDeliveredMessage({
					handler: deliveryHandler,
					payload: effectivePayload,
					target: deliveryTarget,
					messageId: pinMessageId,
					gatewayClientScopes: params.gatewayClientScopes
				});
				await maybeNotifyAfterDeliveredPayload({
					handler: deliveryHandler,
					payload: effectivePayload,
					target: deliveryTarget,
					results: deliveredResults
				});
				completeDeliveryDiagnostics(deliveredResults.length);
				emitMessageSent({
					success: deliveredResults.length > 0,
					content: payloadSummary.hookContent ?? payloadSummary.text,
					messageId
				});
				continue;
			}
			let firstMessageId;
			let lastMessageId;
			const beforeCount = results.length;
			const mediaUnits = planOutboundMediaMessageUnits({
				mediaUrls: payloadSummary.mediaUrls,
				caption: payloadSummary.text,
				overrides: sendOverrides,
				consumeReplyTo: applySendReplyToConsumption
			});
			for (const unit of mediaUnits) {
				if (unit.kind !== "media") continue;
				throwIfAborted(abortSignal);
				const delivery = deliveryHandler.sendFormattedMedia ? await deliveryHandler.sendFormattedMedia(unit.caption ?? "", unit.mediaUrl, unit.overrides) : await deliveryHandler.sendMedia(unit.caption ?? "", unit.mediaUrl, unit.overrides);
				if (await recordIdentifiedDeliveryResult(delivery)) {
					firstMessageId ??= delivery.messageId;
					lastMessageId = delivery.messageId;
				}
			}
			const deliveredResults = results.slice(beforeCount);
			if (deliveredResults.length > 0) {
				recordPayloadOutcome({
					index: payloadIndex,
					status: "sent",
					results: deliveredResults
				});
				recordDeliveredMirrorPayload(payloadSummary, deliveredResults);
			} else recordPayloadOutcome(suppressedPayloadOutcome({
				index: payloadIndex,
				reason: "adapter_returned_no_identity"
			}));
			await maybePinDeliveredMessage({
				handler: deliveryHandler,
				payload: effectivePayload,
				target: deliveryTarget,
				messageId: firstMessageId,
				gatewayClientScopes: params.gatewayClientScopes
			});
			await maybeNotifyAfterDeliveredPayload({
				handler: deliveryHandler,
				payload: effectivePayload,
				target: deliveryTarget,
				results: deliveredResults
			});
			completeDeliveryDiagnostics(results.length - beforeCount);
			emitMessageSent({
				success: results.length > beforeCount,
				content: payloadSummary.hookContent ?? payloadSummary.text,
				messageId: lastMessageId
			});
		} catch (err) {
			reportedResults = [];
			const failedPayloadResults = results.slice(payloadResultStartIndex);
			recordPayloadOutcome({
				index: payloadIndex,
				status: "failed",
				error: err,
				sentBeforeError: failedPayloadResults.length > 0,
				stage: "platform_send",
				results: failedPayloadResults
			});
			errorDeliveryDiagnostics(err);
			emitMessageSent({
				success: false,
				content: payloadSummary.hookContent ?? payloadSummary.text,
				error: require_errors.formatErrorMessage(err)
			});
			if (!params.bestEffort) throw toOutboundDeliveryError({
				error: err,
				results,
				payloadOutcomes,
				stage: "platform_send"
			});
			params.onError?.(err, payloadSummary);
		}
	}
	if (params.mirror && deliveredMirrorPayloads.length > 0) {
		const deliveredMirror = {
			text: deliveredMirrorPayloads.map((payload) => payload.hookContent ?? payload.text).filter((text) => text.trim()).join("\n"),
			mediaUrls: deliveredMirrorPayloads.flatMap((payload) => payload.mediaUrls)
		};
		const mirrorText = require_transcript_mirror.resolveMirroredTranscriptText({
			text: deliveredMirror.text,
			mediaUrls: deliveredMirror.mediaUrls
		});
		if (mirrorText) try {
			const { appendAssistantMessageToSessionTranscript } = await loadTranscriptRuntime();
			const mirrorResult = await appendAssistantMessageToSessionTranscript({
				agentId: params.mirror.agentId,
				sessionKey: params.mirror.sessionKey,
				text: mirrorText,
				idempotencyKey: params.mirror.idempotencyKey,
				config: params.cfg
			});
			if (!mirrorResult.ok) log.warn(`failed to mirror outbound delivery into session transcript; channel send already succeeded: ${mirrorResult.reason}`, {
				channel,
				to,
				sessionKey: params.mirror.sessionKey
			});
		} catch (err) {
			log.warn(`failed to mirror outbound delivery into session transcript; channel send already succeeded: ${require_errors.formatErrorMessage(err)}`, {
				channel,
				to,
				sessionKey: params.mirror.sessionKey
			});
		}
	}
	return results;
}
//#endregion
Object.defineProperty(exports, "adaptMessagePresentationForChannel", {
	enumerable: true,
	get: function() {
		return adaptMessagePresentationForChannel;
	}
});
Object.defineProperty(exports, "createRenderedMessageBatch", {
	enumerable: true,
	get: function() {
		return createRenderedMessageBatch;
	}
});
Object.defineProperty(exports, "deliverOutboundPayloadsInternal", {
	enumerable: true,
	get: function() {
		return deliverOutboundPayloadsInternal;
	}
});
Object.defineProperty(exports, "deliver_exports", {
	enumerable: true,
	get: function() {
		return deliver_exports;
	}
});
Object.defineProperty(exports, "deriveInboundMessageHookContext", {
	enumerable: true,
	get: function() {
		return deriveInboundMessageHookContext;
	}
});
Object.defineProperty(exports, "resolveOutboundDurableFinalDeliverySupport", {
	enumerable: true,
	get: function() {
		return resolveOutboundDurableFinalDeliverySupport;
	}
});
Object.defineProperty(exports, "runReplyPayloadSendingHook", {
	enumerable: true,
	get: function() {
		return runReplyPayloadSendingHook;
	}
});
Object.defineProperty(exports, "throwIfAborted", {
	enumerable: true,
	get: function() {
		return throwIfAborted;
	}
});
Object.defineProperty(exports, "toInternalMessagePreprocessedContext", {
	enumerable: true,
	get: function() {
		return toInternalMessagePreprocessedContext;
	}
});
Object.defineProperty(exports, "toInternalMessageReceivedContext", {
	enumerable: true,
	get: function() {
		return toInternalMessageReceivedContext;
	}
});
Object.defineProperty(exports, "toInternalMessageTranscribedContext", {
	enumerable: true,
	get: function() {
		return toInternalMessageTranscribedContext;
	}
});
Object.defineProperty(exports, "toPluginInboundClaimContext", {
	enumerable: true,
	get: function() {
		return toPluginInboundClaimContext;
	}
});
Object.defineProperty(exports, "toPluginInboundClaimEvent", {
	enumerable: true,
	get: function() {
		return toPluginInboundClaimEvent;
	}
});
Object.defineProperty(exports, "toPluginMessageContext", {
	enumerable: true,
	get: function() {
		return toPluginMessageContext;
	}
});
Object.defineProperty(exports, "toPluginMessageReceivedEvent", {
	enumerable: true,
	get: function() {
		return toPluginMessageReceivedEvent;
	}
});
