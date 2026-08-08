const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_command_turn_context = require("./command-turn-context-DgIVffox.cjs");
const require_selection = require("./selection-BpqUSi0C.cjs");
const require_system_tags = require("./system-tags-DnXAcM7s.cjs");
const require_inbound_text = require("./inbound-text-D035K7Ad.cjs");
const require_inbound_context = require("./inbound-context-DRXGR9Cr.cjs");
const require_kernel = require("./kernel-BQTSZWlX.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
//#region src/pairing/pairing-messages.ts
function buildPairingReply(params) {
	const { channel, idLine, code } = params;
	return [
		"Operator: access not configured.",
		"",
		idLine,
		"Pairing code:",
		"```",
		code,
		"```",
		"",
		"Ask the bot owner to approve with:",
		"```",
		require_command_format.formatCliCommand(`operator pairing approve ${channel} ${code}`),
		"```"
	].join("\n");
}
//#endregion
//#region src/security/context-visibility.ts
/** Evaluates one supplemental context item against mode, kind, and sender allowlist state. */
function evaluateSupplementalContextVisibility(params) {
	if (params.mode === "all") return {
		include: true,
		reason: "mode_all"
	};
	if (params.senderAllowed) return {
		include: true,
		reason: "sender_allowed"
	};
	if (params.mode === "allowlist_quote" && params.kind === "quote") return {
		include: true,
		reason: "quote_override"
	};
	return {
		include: false,
		reason: "blocked"
	};
}
/** Boolean shorthand for callers that do not need the audit reason. */
function shouldIncludeSupplementalContext(params) {
	return evaluateSupplementalContextVisibility(params).include;
}
/** Filters supplemental context items and reports how many were omitted by visibility policy. */
function filterSupplementalContextItems(params) {
	const items = params.items.filter((item) => shouldIncludeSupplementalContext({
		mode: params.mode,
		kind: params.kind,
		senderAllowed: params.isSenderAllowed(item)
	}));
	return {
		items,
		omitted: params.items.length - items.length
	};
}
//#endregion
//#region src/channels/inbound-event/context.ts
/**
* Channel inbound event context builder.
*
* Converts route, sender, command, media, and supplemental facts into finalized message context.
*/
function keepSupplementalContext(params) {
	if (!params.mode || params.mode === "all") return true;
	if (params.senderAllowed === void 0) return false;
	return shouldIncludeSupplementalContext({
		mode: params.mode,
		kind: params.kind,
		senderAllowed: params.senderAllowed
	});
}
function filterChannelInboundSupplementalContext(params) {
	const supplemental = params.supplemental;
	if (!supplemental) return;
	const quote = keepSupplementalContext({
		mode: params.contextVisibility,
		kind: "quote",
		senderAllowed: supplemental.quote?.senderAllowed
	}) ? supplemental.quote : void 0;
	const forwarded = keepSupplementalContext({
		mode: params.contextVisibility,
		kind: "forwarded",
		senderAllowed: supplemental.forwarded?.senderAllowed
	}) ? supplemental.forwarded : void 0;
	const thread = keepSupplementalContext({
		mode: params.contextVisibility,
		kind: "thread",
		senderAllowed: supplemental.thread?.senderAllowed
	}) ? supplemental.thread : void 0;
	return {
		...supplemental,
		quote,
		forwarded,
		thread
	};
}
function definedFields(fields) {
	return Object.fromEntries(Object.entries(fields).filter((entry) => entry[1] !== void 0));
}
function isPromiseLike(value) {
	return Boolean(value) && typeof value.then === "function";
}
function stripQuoteRuntimeFields(quote) {
	const { media: _media, isSelf: _isSelf, ...stripped } = quote;
	return stripped;
}
function resolveChannelInboundSupplementalForFinalizer(params) {
	const rawSupplemental = params.supplemental;
	const filtered = filterChannelInboundSupplementalContext({
		supplemental: rawSupplemental,
		contextVisibility: params.contextVisibility
	});
	const media = [...params.media ?? []];
	if (!rawSupplemental?.quote || !filtered?.quote) return {
		rawSupplemental,
		supplemental: filtered,
		media
	};
	const quote = filtered.quote;
	const selfQuote = quote.isSelf === true;
	const suppressSelfQuoteBody = params.suppressSelfQuoteBody ?? true;
	const suppressSelfQuoteMedia = params.suppressSelfQuoteMedia ?? true;
	const finalizeQuote = (quoteMedia) => {
		if (!(selfQuote && suppressSelfQuoteMedia)) media.push(...quoteMedia ?? []);
		const stripped = stripQuoteRuntimeFields(quote);
		const visibleQuote = selfQuote && suppressSelfQuoteBody ? (({ body: _body, ...withoutBody }) => withoutBody)(stripped) : stripped;
		return {
			rawSupplemental,
			supplemental: {
				...filtered,
				quote: visibleQuote
			},
			media
		};
	};
	if (selfQuote && suppressSelfQuoteMedia) return finalizeQuote(void 0);
	if (!params.resolveSupplementalMedia) return finalizeQuote(Array.isArray(quote.media) ? quote.media : void 0);
	if (typeof quote.media !== "function") return finalizeQuote(quote.media);
	const resolved = quote.media();
	return isPromiseLike(resolved) ? resolved.then(finalizeQuote) : finalizeQuote(resolved);
}
function finalizePreparedChannelInboundContext(params) {
	const mediaPayload = params.media ? definedFields(require_kernel.buildChannelInboundMediaPayload([...params.media])) : {};
	const baseContext = {
		...params.originalContext,
		SupplementalContext: params.supplemental,
		...mediaPayload
	};
	const untrustedStructuredContext = resolveUntrustedStructuredContext({
		supplemental: params.supplemental,
		extra: baseContext
	});
	return {
		context: (params.finalize ?? require_inbound_context.finalizeInboundContext)({
			...baseContext,
			UntrustedStructuredContext: untrustedStructuredContext
		}, params.finalizeOptions),
		supplemental: params.supplemental,
		quoteHidden: Boolean(params.rawSupplemental?.quote && !params.supplemental?.quote),
		forwardedHidden: Boolean(params.rawSupplemental?.forwarded && !params.supplemental?.forwarded),
		threadHidden: Boolean(params.rawSupplemental?.thread && !params.supplemental?.thread)
	};
}
function finalizeChannelInboundContext(params) {
	const contextSupplemental = params.context.SupplementalContext;
	const prepared = resolveChannelInboundSupplementalForFinalizer({
		supplemental: params.supplemental ?? contextSupplemental,
		contextVisibility: params.contextVisibility,
		media: params.media,
		resolveSupplementalMedia: params.resolveSupplementalMedia,
		suppressSelfQuoteBody: params.suppressSelfQuoteBody,
		suppressSelfQuoteMedia: params.suppressSelfQuoteMedia
	});
	const finish = (result) => finalizePreparedChannelInboundContext({
		originalContext: params.context,
		finalize: params.finalize,
		finalizeOptions: params.finalizeOptions,
		...result
	});
	if (params.resolveSupplementalMedia) return Promise.resolve(prepared).then(finish);
	return isPromiseLike(prepared) ? prepared.then(finish) : finish(prepared);
}
function resolveIngressCommandAuthorized(access) {
	return access?.commands?.authorized;
}
function normalizeUntrustedGroupPrompt(value) {
	if (typeof value !== "string") return;
	const normalized = require_system_tags.sanitizeInboundSystemTags(require_inbound_text.normalizeInboundTextNewlines(value));
	return normalized.trim().length > 0 ? normalized : void 0;
}
function resolveUntrustedStructuredContext(params) {
	const entries = [];
	const extraEntries = params.extra?.UntrustedStructuredContext;
	if (Array.isArray(extraEntries)) entries.push(...extraEntries);
	entries.push(...params.supplemental?.untrustedContext ?? []);
	const groupPrompt = normalizeUntrustedGroupPrompt(params.supplemental?.untrustedGroupSystemPrompt);
	if (groupPrompt) entries.push({
		label: "Group prompt context",
		type: "group_prompt_context",
		payload: { text: groupPrompt }
	});
	return entries.length > 0 ? entries : void 0;
}
function resolveChannelCommandContext(params) {
	if (params.commandTurn) return params.commandTurn;
	const command = params.command;
	if (!command) return;
	const body = command.body ?? params.message.commandBody ?? params.message.rawBody;
	return require_command_turn_context.createCommandTurnContext(require_command_turn_context.commandTurnKindToSource(command.kind), {
		authorized: command.kind === "normal" ? false : command.authorized ?? resolveIngressCommandAuthorized(params.access) === true,
		commandName: command.name,
		body
	});
}
function buildChannelInboundEventContext(params) {
	const body = params.message.body ?? params.message.rawBody;
	const commandTurn = resolveChannelCommandContext({
		command: params.command,
		commandTurn: params.commandTurn,
		message: params.message,
		access: params.access
	});
	const context = {
		Body: body,
		InboundEventKind: params.message.inboundEventKind ?? "user_request",
		BodyForAgent: params.message.bodyForAgent ?? params.message.rawBody,
		InboundHistory: params.message.inboundHistory,
		SourceModality: params.message.sourceModality,
		RawBody: params.message.rawBody,
		CommandBody: params.message.commandBody ?? params.message.rawBody,
		BodyForCommands: params.message.commandBody ?? params.message.rawBody,
		From: params.from,
		To: params.reply.to,
		SessionKey: params.route.dispatchSessionKey ?? params.route.routeSessionKey,
		AgentId: params.route.agentId,
		AccountId: params.route.accountId ?? params.accountId,
		ParentSessionKey: params.route.parentSessionKey,
		ModelParentSessionKey: params.route.modelParentSessionKey,
		MessageSid: params.messageId,
		MessageSidFull: params.messageIdFull,
		ReplyToId: params.reply.replyToId,
		ReplyToIdFull: params.reply.replyToIdFull,
		ChatType: params.conversation.kind,
		ChatId: params.conversation.id,
		ConversationLabel: params.conversation.label,
		GroupSubject: params.conversation.kind !== "direct" ? params.conversation.label : void 0,
		GroupSpace: params.conversation.spaceId,
		SenderName: params.sender.name ?? params.sender.displayLabel,
		SenderId: params.sender.id,
		SenderUsername: params.sender.username,
		SenderTag: params.sender.tag,
		SenderIsBot: params.sender.isBot,
		MemberRoleIds: params.sender.roles,
		Timestamp: params.timestamp,
		Provider: params.provider ?? params.channel,
		Surface: params.surface ?? params.provider ?? params.channel,
		WasMentioned: params.access?.mentions?.wasMentioned,
		GroupRequireMention: params.access?.mentions?.requireMention,
		ExplicitlyMentionedBot: params.access?.mentions?.explicitlyMentionedBot,
		MentionedUserIds: params.access?.mentions?.mentionedUserIds,
		MentionedSubteamIds: params.access?.mentions?.mentionedSubteamIds,
		ImplicitMentionKinds: params.access?.mentions?.implicitMentionKinds,
		MentionSource: params.access?.mentions?.mentionSource,
		CommandAuthorized: resolveIngressCommandAuthorized(params.access) === true,
		CommandTurn: commandTurn,
		MessageThreadId: params.reply.messageThreadId ?? params.conversation.threadId,
		NativeChannelId: params.reply.nativeChannelId ?? params.conversation.nativeChannelId,
		ChannelContext: params.channelContext,
		OriginatingChannel: params.channel,
		OriginatingTo: params.reply.originatingTo ?? params.reply.to,
		ThreadParentId: params.reply.threadParentId ?? params.conversation.parentId,
		...params.extra
	};
	const finalizeParams = {
		finalize: params.finalize,
		finalizeOptions: params.finalizeOptions,
		supplemental: params.supplemental,
		contextVisibility: params.contextVisibility,
		media: params.media,
		context
	};
	const result = params.resolveSupplementalMedia ? finalizeChannelInboundContext({
		...finalizeParams,
		resolveSupplementalMedia: true,
		suppressSelfQuoteBody: params.suppressSelfQuoteBody,
		suppressSelfQuoteMedia: params.suppressSelfQuoteMedia
	}) : finalizeChannelInboundContext(finalizeParams);
	return isPromiseLike(result) ? result.then((finalized) => finalized.context) : result.context;
}
//#endregion
//#region src/auto-reply/inbound-debounce.ts
const resolveMs = (value) => (0, _gabrielvfonseca_normalization_core_number_coercion.resolveOptionalIntegerOption)(value, { min: 0 });
const resolveChannelOverride = (params) => {
	if (!params.byChannel) return;
	return resolveMs(params.byChannel[params.channel]);
};
/** Resolve effective inbound debounce milliseconds from explicit, channel, and global config. */
function resolveInboundDebounceMs(params) {
	const inbound = params.cfg.messages?.inbound;
	const override = resolveMs(params.overrideMs);
	const byChannel = resolveChannelOverride({
		byChannel: inbound?.byChannel,
		channel: params.channel
	});
	const base = resolveMs(inbound?.debounceMs);
	return override ?? byChannel ?? base ?? 0;
}
const DEFAULT_MAX_TRACKED_KEYS = 2048;
/** Create a keyed debouncer with flush/cancel controls and same-key serialization. */
function createInboundDebouncer(params) {
	const buffers = /* @__PURE__ */ new Map();
	const keyChains = /* @__PURE__ */ new Map();
	const keyGenerations = /* @__PURE__ */ new Map();
	const defaultDebounceMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveNonNegativeIntegerOption)(params.debounceMs, 0);
	const maxTrackedKeys = Math.max(1, Math.trunc(params.maxTrackedKeys ?? DEFAULT_MAX_TRACKED_KEYS));
	const resolveDebounceMs = (item) => {
		const resolved = params.resolveDebounceMs?.(item);
		return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveNonNegativeIntegerOption)(resolved, defaultDebounceMs);
	};
	const runFlush = async (items) => {
		try {
			await params.onFlush(items);
		} catch (err) {
			try {
				params.onError?.(err, items);
			} catch {}
		}
	};
	const cancelItems = (items) => {
		try {
			params.onCancel?.(items);
		} catch {}
	};
	const resolveKeyGeneration = (key) => keyGenerations.get(key) ?? 0;
	const runQueuedFlush = async (key, generation, items) => {
		if (resolveKeyGeneration(key) !== generation) {
			cancelItems(items);
			return;
		}
		await runFlush(items);
	};
	const enqueueKeyTask = (key, task) => {
		const next = (keyChains.get(key) ?? Promise.resolve()).catch(() => void 0).then(task);
		const settled = next.catch(() => void 0);
		keyChains.set(key, settled);
		const cleanup = () => {
			if (keyChains.get(key) === settled) {
				keyChains.delete(key);
				if (!buffers.has(key)) keyGenerations.delete(key);
			}
		};
		settled.then(cleanup, cleanup);
		return next;
	};
	const runKeyTaskNow = (key, task) => {
		let resolveSettled;
		const settled = new Promise((resolve) => {
			resolveSettled = resolve;
		});
		keyChains.set(key, settled);
		const cleanup = () => {
			resolveSettled();
			if (keyChains.get(key) === settled) {
				keyChains.delete(key);
				if (!buffers.has(key)) keyGenerations.delete(key);
			}
		};
		let next;
		try {
			next = task();
		} catch (err) {
			cleanup();
			throw err;
		}
		next.then(cleanup, cleanup);
		return next;
	};
	const enqueueReservedKeyTask = (key, task) => {
		let readyReleased = false;
		let releaseReady;
		const ready = new Promise((resolve) => {
			releaseReady = resolve;
		});
		return {
			task: enqueueKeyTask(key, async () => {
				await ready;
				await task();
			}),
			release: () => {
				if (readyReleased) return;
				readyReleased = true;
				releaseReady();
			}
		};
	};
	const releaseBuffer = (buffer) => {
		if (buffer.readyReleased) return;
		buffer.readyReleased = true;
		buffer.releaseReady();
	};
	const flushBuffer = async (key, buffer) => {
		if (buffers.get(key) === buffer) buffers.delete(key);
		if (buffer.timeout) {
			clearTimeout(buffer.timeout);
			buffer.timeout = null;
		}
		releaseBuffer(buffer);
		await buffer.task;
	};
	const flushKey = async (key) => {
		const buffer = buffers.get(key);
		if (!buffer) return;
		await flushBuffer(key, buffer);
	};
	const cancelKey = (key) => {
		const buffer = buffers.get(key);
		if (!buffer && !keyChains.has(key)) return false;
		keyGenerations.set(key, resolveKeyGeneration(key) + 1);
		if (!buffer) return true;
		if (buffers.get(key) === buffer) buffers.delete(key);
		if (buffer.timeout) {
			clearTimeout(buffer.timeout);
			buffer.timeout = null;
		}
		const canceledItems = buffer.items;
		buffer.items = [];
		cancelItems(canceledItems);
		releaseBuffer(buffer);
		return true;
	};
	const scheduleFlush = (key, buffer) => {
		if (buffer.timeout) clearTimeout(buffer.timeout);
		buffer.timeout = setTimeout(() => {
			flushBuffer(key, buffer);
		}, buffer.debounceMs);
		buffer.timeout.unref?.();
	};
	const canTrackKey = (key) => {
		if (buffers.has(key) || keyChains.has(key)) return true;
		return (/* @__PURE__ */ new Set([...buffers.keys(), ...keyChains.keys()])).size < maxTrackedKeys;
	};
	const enqueue = async (item) => {
		const key = params.buildKey(item);
		const debounceMs = resolveDebounceMs(item);
		if (!(debounceMs > 0 && (params.shouldDebounce?.(item) ?? true)) || !key) {
			if (key) {
				if (buffers.has(key)) {
					const generation = resolveKeyGeneration(key);
					const reservedTask = enqueueReservedKeyTask(key, async () => {
						await runQueuedFlush(key, generation, [item]);
					});
					try {
						await flushKey(key);
					} finally {
						reservedTask.release();
					}
					await reservedTask.task;
					return;
				}
				if (keyChains.has(key)) {
					const generation = resolveKeyGeneration(key);
					await enqueueKeyTask(key, async () => {
						await runQueuedFlush(key, generation, [item]);
					});
					return;
				}
				if (params.serializeImmediate) {
					await runKeyTaskNow(key, async () => {
						await runFlush([item]);
					});
					return;
				}
				await runFlush([item]);
			} else await runFlush([item]);
			return;
		}
		const existing = buffers.get(key);
		if (existing) {
			existing.items.push(item);
			existing.debounceMs = debounceMs;
			scheduleFlush(key, existing);
			return;
		}
		if (!canTrackKey(key)) {
			const generation = resolveKeyGeneration(key);
			await enqueueKeyTask(key, async () => {
				await runQueuedFlush(key, generation, [item]);
			});
			return;
		}
		const generation = resolveKeyGeneration(key);
		const reservedTask = enqueueReservedKeyTask(key, async () => {
			if (buffer.items.length === 0) return;
			const items = buffer.items;
			if (resolveKeyGeneration(key) !== generation) buffer.items = [];
			await runQueuedFlush(key, generation, items);
		});
		const buffer = {
			items: [item],
			timeout: null,
			debounceMs,
			releaseReady: reservedTask.release,
			readyReleased: false,
			task: reservedTask.task
		};
		buffers.set(key, buffer);
		scheduleFlush(key, buffer);
	};
	return {
		enqueue,
		flushKey,
		cancelKey
	};
}
//#endregion
//#region packages/markdown-core/src/render.ts
const STYLE_RANK = new Map([
	"blockquote",
	"code_block",
	"code",
	"heading_1",
	"heading_2",
	"heading_3",
	"heading_4",
	"heading_5",
	"heading_6",
	"bold",
	"italic",
	"strikethrough",
	"spoiler"
].map((style, index) => [style, index]));
const STRUCTURAL_STYLES = /* @__PURE__ */ new Set([
	"blockquote",
	"heading_1",
	"heading_2",
	"heading_3",
	"heading_4",
	"heading_5",
	"heading_6"
]);
function sortStyleSpans(spans) {
	return [...spans].toSorted((a, b) => {
		if (a.start !== b.start) return a.start - b.start;
		if (a.end !== b.end) return b.end - a.end;
		return (STYLE_RANK.get(a.style) ?? 0) - (STYLE_RANK.get(b.style) ?? 0);
	});
}
function mergeRanges(ranges) {
	const merged = [];
	for (const range of [...ranges].toSorted((a, b) => a.start - b.start || a.end - b.end)) {
		const previous = merged.at(-1);
		if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
		else merged.push({ ...range });
	}
	return merged;
}
function firstOverlappingRangeIndex(ranges, start) {
	let low = 0;
	let high = ranges.length;
	while (low < high) {
		const middle = low + Math.floor((high - low) / 2);
		const range = ranges[middle];
		if (range && range.end <= start) low = middle + 1;
		else high = middle;
	}
	return low;
}
function subtractRanges(span, ranges) {
	const firstOverlap = firstOverlappingRangeIndex(ranges, span.start);
	const firstRange = ranges[firstOverlap];
	if (!firstRange || firstRange.start >= span.end) return [span];
	const pieces = [];
	let cursor = span.start;
	for (let index = firstOverlap; index < ranges.length; index += 1) {
		const range = ranges[index];
		if (!range || range.start >= span.end) break;
		const rangeStart = Math.max(span.start, range.start);
		const rangeEnd = Math.min(span.end, range.end);
		if (rangeStart > cursor) pieces.push({
			...span,
			start: cursor,
			end: rangeStart
		});
		cursor = Math.max(cursor, rangeEnd);
	}
	if (cursor < span.end) pieces.push({
		...span,
		start: cursor,
		end: span.end
	});
	return pieces;
}
function splitAtBoundaries(span, boundaries) {
	let low = 0;
	let high = boundaries.length;
	while (low < high) {
		const middle = low + Math.floor((high - low) / 2);
		if ((boundaries[middle] ?? Number.POSITIVE_INFINITY) <= span.start) low = middle + 1;
		else high = middle;
	}
	if ((boundaries[low] ?? Number.POSITIVE_INFINITY) >= span.end) return [span];
	const pieces = [];
	let cursor = span.start;
	for (let index = low; index < boundaries.length; index += 1) {
		const boundary = boundaries[index];
		if (boundary === void 0 || boundary >= span.end) break;
		pieces.push({
			...span,
			start: cursor,
			end: boundary
		});
		cursor = boundary;
	}
	pieces.push({
		...span,
		start: cursor,
		end: span.end
	});
	return pieces;
}
function sortAnnotationSpans(spans) {
	return [...spans].toSorted((a, b) => a.start - b.start || b.end - a.end);
}
/** Renders Markdown IR by nesting configured style markers and optional link markers. */
function renderMarkdownWithMarkers(ir, options) {
	const text = ir.text ?? "";
	if (!text) return "";
	const styleMarkers = options.styleMarkers;
	const annotationMarkers = options.annotationMarkers ?? {};
	const annotated = sortAnnotationSpans((ir.annotations ?? []).filter((span) => Boolean(annotationMarkers[span.type])));
	const dominantAnnotationRanges = mergeRanges(annotated.filter((span) => annotationMarkers[span.type]?.suppressNestedFormatting === true));
	const annotationBoundaries = [...new Set(annotated.flatMap((span) => [span.start, span.end]))].toSorted((a, b) => a - b);
	const styled = sortStyleSpans(ir.styles.filter((span) => Boolean(styleMarkers[span.style])).flatMap((span) => {
		if (STRUCTURAL_STYLES.has(span.style)) return [span];
		return subtractRanges(span, dominantAnnotationRanges).flatMap((piece) => splitAtBoundaries(piece, annotationBoundaries));
	}));
	const boundaries = /* @__PURE__ */ new Set();
	boundaries.add(0);
	boundaries.add(text.length);
	const startsAt = /* @__PURE__ */ new Map();
	for (const span of styled) {
		if (span.start === span.end) continue;
		boundaries.add(span.start);
		boundaries.add(span.end);
		const bucket = startsAt.get(span.start);
		if (bucket) bucket.push(span);
		else startsAt.set(span.start, [span]);
	}
	for (const spans of startsAt.values()) spans.sort((a, b) => {
		if (a.end !== b.end) return b.end - a.end;
		return (STYLE_RANK.get(a.style) ?? 0) - (STYLE_RANK.get(b.style) ?? 0);
	});
	const annotationStarts = /* @__PURE__ */ new Map();
	for (const span of annotated) {
		if (span.start === span.end) continue;
		boundaries.add(span.start);
		boundaries.add(span.end);
		const bucket = annotationStarts.get(span.start);
		if (bucket) bucket.push(span);
		else annotationStarts.set(span.start, [span]);
	}
	const linkStarts = /* @__PURE__ */ new Map();
	if (options.buildLink) {
		const links = ir.links.flatMap((span) => subtractRanges(span, dominantAnnotationRanges).flatMap((piece) => splitAtBoundaries(piece, annotationBoundaries)));
		for (const link of links) {
			if (link.start === link.end) continue;
			const rendered = options.buildLink(link, text);
			if (!rendered) continue;
			boundaries.add(rendered.start);
			boundaries.add(rendered.end);
			const openBucket = linkStarts.get(rendered.start);
			if (openBucket) openBucket.push(rendered);
			else linkStarts.set(rendered.start, [rendered]);
		}
	}
	const points = [...boundaries].toSorted((a, b) => a - b);
	const stack = [];
	let out = "";
	for (const [i, pos] of points.entries()) {
		while (stack.length && stack[stack.length - 1]?.end === pos) {
			const item = stack.pop();
			if (item) out += item.close;
		}
		const openingItems = [];
		const openingAnnotations = annotationStarts.get(pos);
		if (openingAnnotations) for (const [index, span] of openingAnnotations.entries()) {
			const marker = annotationMarkers[span.type];
			if (!marker) continue;
			openingItems.push({
				end: span.end,
				open: typeof marker.open === "function" ? marker.open(span) : marker.open,
				close: marker.close,
				kind: "annotation",
				index
			});
		}
		const openingLinks = linkStarts.get(pos);
		if (openingLinks && openingLinks.length > 0) for (const [index, link] of openingLinks.entries()) openingItems.push({
			end: link.end,
			open: link.open,
			close: link.close,
			kind: "link",
			index
		});
		const openingStyles = startsAt.get(pos);
		if (openingStyles) for (const [index, span] of openingStyles.entries()) {
			const marker = styleMarkers[span.style];
			if (!marker) continue;
			openingItems.push({
				end: span.end,
				open: typeof marker.open === "function" ? marker.open(span) : marker.open,
				close: marker.close,
				kind: "style",
				style: span.style,
				index
			});
		}
		if (openingItems.length > 0) {
			openingItems.sort((a, b) => {
				if (a.end !== b.end) return b.end - a.end;
				const aStructural = a.kind === "style" && STRUCTURAL_STYLES.has(a.style);
				const bStructural = b.kind === "style" && STRUCTURAL_STYLES.has(b.style);
				if (aStructural !== bStructural || a.kind !== b.kind) {
					const kindRank = {
						annotation: 0,
						link: 1,
						style: 2
					};
					return (aStructural ? -1 : kindRank[a.kind]) - (bStructural ? -1 : kindRank[b.kind]);
				}
				if (a.kind === "style" && b.kind === "style") return (STYLE_RANK.get(a.style) ?? 0) - (STYLE_RANK.get(b.style) ?? 0);
				return a.index - b.index;
			});
			for (const item of openingItems) {
				out += item.open;
				stack.push({
					close: item.close,
					end: item.end
				});
			}
		}
		const next = points.at(i + 1);
		if (next === void 0) break;
		if (next > pos) out += options.escapeText(text.slice(pos, next));
	}
	return out;
}
//#endregion
//#region packages/markdown-core/src/tables.ts
const MARKDOWN_STYLE_MARKERS = {
	bold: {
		open: "**",
		close: "**"
	},
	italic: {
		open: "_",
		close: "_"
	},
	strikethrough: {
		open: "~~",
		close: "~~"
	},
	code: {
		open: "`",
		close: "`"
	},
	code_block: {
		open: "```\n",
		close: "```"
	}
};
/** Converts markdown tables into the configured plaintext/code rendering mode. */
function convertMarkdownTables(markdown, mode) {
	if (!markdown || mode === "off") return markdown;
	const { ir, hasTables } = require_selection.markdownToIRWithMeta(markdown, {
		linkify: false,
		autolink: false,
		headingStyle: "none",
		blockquotePrefix: "",
		tableMode: mode === "block" ? "code" : mode
	});
	if (!hasTables) return markdown;
	return renderMarkdownWithMarkers(ir, {
		styleMarkers: MARKDOWN_STYLE_MARKERS,
		escapeText: (text) => text,
		buildLink: (link, text) => {
			const href = link.href.trim();
			if (!href) return null;
			if (!text.slice(link.start, link.end)) return null;
			return {
				start: link.start,
				end: link.end,
				open: "[",
				close: `](${href})`
			};
		}
	});
}
//#endregion
Object.defineProperty(exports, "buildChannelInboundEventContext", {
	enumerable: true,
	get: function() {
		return buildChannelInboundEventContext;
	}
});
Object.defineProperty(exports, "buildPairingReply", {
	enumerable: true,
	get: function() {
		return buildPairingReply;
	}
});
Object.defineProperty(exports, "convertMarkdownTables", {
	enumerable: true,
	get: function() {
		return convertMarkdownTables;
	}
});
Object.defineProperty(exports, "createInboundDebouncer", {
	enumerable: true,
	get: function() {
		return createInboundDebouncer;
	}
});
Object.defineProperty(exports, "filterSupplementalContextItems", {
	enumerable: true,
	get: function() {
		return filterSupplementalContextItems;
	}
});
Object.defineProperty(exports, "resolveInboundDebounceMs", {
	enumerable: true,
	get: function() {
		return resolveInboundDebounceMs;
	}
});
