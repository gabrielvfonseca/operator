const require_runtime_channel_state = require("./runtime-channel-state-DwppoOsY.cjs");
const require_message_channel_core = require("./message-channel-core-CeN5z1gK.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/channel-target-prefix.ts
const TARGET_KIND_PREFIXES = /* @__PURE__ */ new Set([
	"channel",
	"conversation",
	"dm",
	"group",
	"room",
	"thread",
	"user"
]);
/** Removes a selected channel/provider prefix from an outbound target string. */
function stripTargetProviderPrefix(raw, ...providers) {
	const trimmed = raw.trim();
	const lower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(trimmed) ?? "";
	for (const provider of providers) {
		const normalizedProvider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(provider);
		if (normalizedProvider && lower.startsWith(`${normalizedProvider}:`)) return trimmed.slice(normalizedProvider.length + 1).trim();
	}
	return trimmed;
}
/** Removes generic target-kind prefixes such as room:, thread:, or user:. */
function stripTargetKindPrefix(raw, kinds = [
	"channel",
	"conversation",
	"dm",
	"group",
	"room",
	"thread",
	"user"
]) {
	const kindPattern = kinds.map((kind) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(kind)).filter((kind) => Boolean(kind)).join("|");
	return kindPattern ? raw.replace(new RegExp(`^(${kindPattern}):`, "i"), "").trim() : raw.trim();
}
/** Strips plugin topic suffixes while preserving ordinary colon-containing targets. */
function stripTargetTopicSuffix(raw, options = {}) {
	const trimmed = raw.trim();
	const numericTopicMatch = options.allowNumericShorthand ? /^(-?\d+):(\d+)$/.exec(trimmed) : null;
	if (numericTopicMatch?.[1]) return numericTopicMatch[1];
	return trimmed.replace(/:topic:.*$/i, "").trim();
}
function resolvePluginTargetPrefix(prefix) {
	const normalizedPrefix = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(prefix);
	if (!normalizedPrefix) return;
	const registry = require_runtime_channel_state.getActivePluginChannelRegistryFromState();
	for (const entry of registry?.channels ?? []) {
		const plugin = entry.plugin;
		const channelId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(plugin.id);
		const candidates = plugin.messaging?.targetPrefixes ?? [];
		if (channelId && candidates.some((candidate) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(candidate) === normalizedPrefix)) return channelId;
	}
}
function resolveChannelTargetProviderPrefix(raw) {
	const prefix = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(/^\s*([a-z][a-z0-9_-]*):/i.exec(raw ?? "")?.[1]);
	if (!prefix || TARGET_KIND_PREFIXES.has(prefix)) return;
	const channel = resolvePluginTargetPrefix(prefix);
	return channel ? {
		prefix,
		channel
	} : void 0;
}
/** Resolves the channel implied by a plugin-owned target prefix, if any. */
function resolveTargetPrefixedChannel(raw) {
	return resolveChannelTargetProviderPrefix(raw)?.channel;
}
/** Rejects targets whose plugin-owned prefix belongs to a different selected channel. */
function validateTargetProviderPrefix(params) {
	const selectedChannel = require_message_channel_core.normalizeMessageChannel(params.channel) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	if (!selectedChannel || selectedChannel === "last") return;
	const prefixed = resolveChannelTargetProviderPrefix(params.to);
	if (!prefixed || prefixed.channel === selectedChannel) return;
	return /* @__PURE__ */ new Error(`Target prefix "${prefixed.prefix}:" belongs to ${prefixed.channel}, not ${selectedChannel}.`);
}
//#endregion
Object.defineProperty(exports, "resolveTargetPrefixedChannel", {
	enumerable: true,
	get: function() {
		return resolveTargetPrefixedChannel;
	}
});
Object.defineProperty(exports, "stripTargetKindPrefix", {
	enumerable: true,
	get: function() {
		return stripTargetKindPrefix;
	}
});
Object.defineProperty(exports, "stripTargetProviderPrefix", {
	enumerable: true,
	get: function() {
		return stripTargetProviderPrefix;
	}
});
Object.defineProperty(exports, "stripTargetTopicSuffix", {
	enumerable: true,
	get: function() {
		return stripTargetTopicSuffix;
	}
});
Object.defineProperty(exports, "validateTargetProviderPrefix", {
	enumerable: true,
	get: function() {
		return validateTargetProviderPrefix;
	}
});
