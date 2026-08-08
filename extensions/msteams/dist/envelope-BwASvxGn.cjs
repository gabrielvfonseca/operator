const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_format_datetime = require("./format-datetime-BoCLKf0d.cjs");
const require_date_time = require("./date-time-zxjypawc.cjs");
const require_format_relative = require("./format-relative-DEaTzxP-.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/sender-label.ts
function normalizeSenderLabelParams(params) {
	return {
		name: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.name),
		username: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.username),
		tag: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.tag),
		e164: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.e164),
		id: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.id)
	};
}
/** Resolves the best one-line sender label from available identity fields. */
function resolveSenderLabel(params) {
	const { name, username, tag, e164, id } = normalizeSenderLabelParams(params);
	const display = name ?? username ?? tag ?? "";
	const idPart = e164 ?? id ?? "";
	if (display && idPart && display !== idPart) return `${display} (${idPart})`;
	return display || idPart || null;
}
//#endregion
//#region src/auto-reply/envelope.ts
/** Formats inbound message envelopes with sender, timing, and channel metadata for agent prompts. */
function sanitizeEnvelopeHeaderPart(value) {
	return value.replace(/\r\n|\r|\n/g, " ").replaceAll("[", "(").replaceAll("]", ")").replace(/\s+/g, " ").trim();
}
/** Resolves envelope formatting defaults from agent config. */
function resolveEnvelopeFormatOptions(cfg) {
	const defaults = cfg?.agents?.defaults;
	return {
		timezone: defaults?.envelopeTimezone,
		includeTimestamp: defaults?.envelopeTimestamp !== "off",
		includeElapsed: defaults?.envelopeElapsed !== "off",
		userTimezone: defaults?.userTimezone
	};
}
function normalizeEnvelopeOptions(options) {
	const includeTimestamp = options?.includeTimestamp !== false;
	const includeElapsed = options?.includeElapsed !== false;
	return {
		timezone: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(options?.timezone) || "local",
		includeTimestamp,
		includeElapsed,
		userTimezone: options?.userTimezone
	};
}
function resolveEnvelopeTimezone(options) {
	const trimmed = options.timezone?.trim();
	if (!trimmed) return { mode: "local" };
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	if (lowered === "utc" || lowered === "gmt") return { mode: "utc" };
	if (lowered === "local" || lowered === "host") return { mode: "local" };
	if (lowered === "user") return {
		mode: "iana",
		timeZone: require_date_time.resolveUserTimezone(options.userTimezone)
	};
	const explicit = require_format_datetime.resolveTimezone(trimmed);
	return explicit ? {
		mode: "iana",
		timeZone: explicit
	} : { mode: "utc" };
}
/** Formats an envelope timestamp using local, UTC, user, or explicit IANA timezone rules. */
function formatEnvelopeTimestamp(ts, options) {
	if (ts === void 0) return;
	const resolved = normalizeEnvelopeOptions(options);
	if (!resolved.includeTimestamp) return;
	const date = ts instanceof Date ? ts : new Date(ts);
	if (Number.isNaN(date.getTime())) return;
	const zone = resolveEnvelopeTimezone(resolved);
	const weekday = (() => {
		try {
			if (zone.mode === "utc") return new Intl.DateTimeFormat("en-US", {
				timeZone: "UTC",
				weekday: "short"
			}).format(date);
			if (zone.mode === "local") return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
			return new Intl.DateTimeFormat("en-US", {
				timeZone: zone.timeZone,
				weekday: "short"
			}).format(date);
		} catch {
			return;
		}
	})();
	const formatted = zone.mode === "utc" ? require_format_datetime.formatUtcTimestamp(date, { displaySeconds: true }) : zone.mode === "local" ? require_format_datetime.formatZonedTimestamp(date, { displaySeconds: true }) : require_format_datetime.formatZonedTimestamp(date, {
		timeZone: zone.timeZone,
		displaySeconds: true
	});
	if (!formatted) return;
	return weekday ? `${weekday} ${formatted}` : formatted;
}
function resolveDirectEnvelopeBodyLabel(from) {
	const label = sanitizeEnvelopeHeaderPart(from || "");
	const idMarkerIndex = label.search(/\s+id:/i);
	if (idMarkerIndex > 0) {
		const displayLabel = label.slice(0, idMarkerIndex).trim();
		return displayLabel.includes(":") ? "(sender)" : displayLabel;
	}
	return label.includes(":") ? "(sender)" : label;
}
/** Formats the generic bracketed envelope prepended to agent-visible messages. */
function formatAgentEnvelope(params) {
	const parts = [sanitizeEnvelopeHeaderPart((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channel) || "Channel")];
	const resolved = normalizeEnvelopeOptions(params.envelope);
	let elapsed;
	if (resolved.includeElapsed && params.timestamp && params.previousTimestamp) {
		const elapsedMs = (params.timestamp instanceof Date ? params.timestamp.getTime() : params.timestamp) - (params.previousTimestamp instanceof Date ? params.previousTimestamp.getTime() : params.previousTimestamp);
		elapsed = Number.isFinite(elapsedMs) && elapsedMs >= 0 ? require_format_relative.formatTimeAgo(elapsedMs, { suffix: false }) : void 0;
	}
	const from = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.from);
	if (from) {
		const fromLabel = sanitizeEnvelopeHeaderPart(from);
		parts.push(elapsed ? `${fromLabel} +${elapsed}` : fromLabel);
	} else if (elapsed) parts.push(`+${elapsed}`);
	const host = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.host);
	if (host) parts.push(sanitizeEnvelopeHeaderPart(host));
	const ip = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ip);
	if (ip) parts.push(sanitizeEnvelopeHeaderPart(ip));
	const ts = formatEnvelopeTimestamp(params.timestamp, resolved);
	if (ts) parts.push(ts);
	return `${`[${parts.join(" ")}]`} ${params.body}`;
}
/** Formats an inbound message body with sender attribution appropriate for direct/group chats. */
function formatInboundEnvelope(params) {
	const chatType = require_chat_type.normalizeChatType(params.chatType);
	const isDirect = !chatType || chatType === "direct";
	const resolvedSenderRaw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.senderLabel) || resolveSenderLabel(params.sender ?? {});
	const resolvedSender = resolvedSenderRaw ? sanitizeEnvelopeHeaderPart(resolvedSenderRaw) : "";
	const directSender = resolveDirectEnvelopeBodyLabel((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.from));
	const body = isDirect && params.fromMe ? `(self): ${params.body}` : isDirect && directSender ? `${directSender}: ${params.body}` : !isDirect && resolvedSender ? `${resolvedSender}: ${params.body}` : params.body;
	return formatAgentEnvelope({
		channel: params.channel,
		from: params.from,
		timestamp: params.timestamp,
		previousTimestamp: params.previousTimestamp,
		envelope: params.envelope,
		body
	});
}
//#endregion
Object.defineProperty(exports, "formatAgentEnvelope", {
	enumerable: true,
	get: function() {
		return formatAgentEnvelope;
	}
});
Object.defineProperty(exports, "formatEnvelopeTimestamp", {
	enumerable: true,
	get: function() {
		return formatEnvelopeTimestamp;
	}
});
Object.defineProperty(exports, "formatInboundEnvelope", {
	enumerable: true,
	get: function() {
		return formatInboundEnvelope;
	}
});
Object.defineProperty(exports, "resolveEnvelopeFormatOptions", {
	enumerable: true,
	get: function() {
		return resolveEnvelopeFormatOptions;
	}
});
