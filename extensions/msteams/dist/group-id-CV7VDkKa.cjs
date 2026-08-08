const require_command_format = require("./command-format-C4ZW2nwK.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry_loaded = require("./registry-loaded-BQ6D0fDi.cjs");
const require_channel_target_prefix = require("./channel-target-prefix-HjpWN9Zt.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/elevated-unavailable.ts
function formatElevatedUnavailableMessage(params) {
	const lines = [];
	lines.push(`elevated is not available right now (runtime=${params.runtimeSandboxed ? "sandboxed" : "direct"}).`);
	if (params.failures.length > 0) lines.push(`Failing gates: ${params.failures.map((f) => `${f.gate} (${f.key})`).join(", ")}`);
	else lines.push("Failing gates: enabled (tools.elevated.enabled / agents.list[].tools.elevated.enabled), allowFrom (tools.elevated.allowFrom.<provider>).");
	lines.push("Fix-it keys:");
	lines.push("- tools.elevated.enabled");
	lines.push("- tools.elevated.allowFrom.<provider>");
	lines.push("- agents.list[].tools.elevated.enabled");
	lines.push("- agents.list[].tools.elevated.allowFrom.<provider>");
	if (params.sessionKey) lines.push(`See: ${require_command_format.formatCliCommand(`operator sandbox explain --session ${params.sessionKey}`)}`);
	return lines.join("\n");
}
//#endregion
//#region src/auto-reply/reply/group-id-simple.ts
/** Extracts a simple group/channel id from stable group-like source ids. */
function extractSimpleExplicitGroupId(raw) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
	if (!trimmed) return;
	const parts = trimmed.split(":").filter(Boolean);
	if (parts.length >= 3 && (parts[1] === "group" || parts[1] === "channel")) return parts.slice(2).join(":").replace(/:topic:.*$/, "") || void 0;
	if (parts.length >= 2 && (parts[0] === "group" || parts[0] === "channel")) return parts.slice(1).join(":").replace(/:topic:.*$/, "") || void 0;
}
//#endregion
//#region src/auto-reply/reply/group-id.ts
/** Extracts group/channel ids from explicit message targets. */
function extractInferredGroupTargetId(params) {
	const normalized = params.messaging?.normalizeTarget?.(params.raw);
	const candidates = (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([normalized, params.raw].filter((candidate) => Boolean(candidate)));
	for (const candidate of candidates) {
		const chatType = params.messaging?.inferTargetChatType?.({ to: candidate });
		if (chatType === "direct" || chatType == null) continue;
		const target = require_channel_target_prefix.stripTargetTopicSuffix(require_channel_target_prefix.stripTargetKindPrefix(require_channel_target_prefix.stripTargetProviderPrefix(candidate, params.channelId), [
			"group",
			"channel",
			"conversation",
			"room",
			"thread"
		]), { allowNumericShorthand: params.messaging?.numericTopicShorthand === true });
		if (target) return target;
	}
}
function extractLegacyParsedGroupTargetId(params) {
	const parsed = params.messaging?.parseExplicitTarget?.({ raw: params.raw });
	if (parsed?.chatType === "direct" || parsed?.chatType == null) return;
	return require_channel_target_prefix.stripTargetTopicSuffix(require_channel_target_prefix.stripTargetKindPrefix(require_channel_target_prefix.stripTargetProviderPrefix(parsed.to, params.channelId), [
		"group",
		"channel",
		"conversation",
		"room",
		"thread"
	]), { allowNumericShorthand: params.messaging?.numericTopicShorthand === true }) || void 0;
}
/** Extracts a group/channel target id from explicit channel target syntax. */
function extractExplicitGroupId(raw) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(raw) ?? "";
	if (!trimmed) return;
	const simple = extractSimpleExplicitGroupId(trimmed);
	if (simple) return simple;
	const firstPart = trimmed.split(":").find(Boolean);
	const channelId = require_registry_normalize.normalizeAnyChannelId(firstPart ?? "") ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(firstPart);
	const messaging = channelId ? require_registry_loaded.getLoadedChannelPluginForRead(channelId)?.messaging : void 0;
	if (!channelId) return;
	return extractInferredGroupTargetId({
		raw: trimmed,
		channelId,
		messaging
	}) ?? extractLegacyParsedGroupTargetId({
		raw: trimmed,
		channelId,
		messaging
	});
}
//#endregion
Object.defineProperty(exports, "extractExplicitGroupId", {
	enumerable: true,
	get: function() {
		return extractExplicitGroupId;
	}
});
Object.defineProperty(exports, "formatElevatedUnavailableMessage", {
	enumerable: true,
	get: function() {
		return formatElevatedUnavailableMessage;
	}
});
