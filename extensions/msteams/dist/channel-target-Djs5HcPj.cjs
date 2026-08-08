const require_string_coerce = require("./string-coerce-DZiVVAdw.cjs");
const require_bootstrap_registry = require("./bootstrap-registry-C2aRGF1a.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/message-action-param-keys.ts
const STANDARD_MESSAGE_ACTION_PARAM_KEYS = /* @__PURE__ */ new Set([
	"accountId",
	"action",
	"asDocument",
	"attachments",
	"base64",
	"bestEffort",
	"buffer",
	"caption",
	"channel",
	"channelId",
	"contentType",
	"delivery",
	"dryRun",
	"filePath",
	"fileUrl",
	"filename",
	"forceDocument",
	"gifPlayback",
	"gatewayToken",
	"gatewayUrl",
	"image",
	"idempotencyKey",
	"interactive",
	"json",
	"media",
	"mediaUrl",
	"mediaUrls",
	"media_urls",
	"message",
	"mimeType",
	"path",
	"pollAnonymous",
	"pollDurationHours",
	"pollMulti",
	"pollOption",
	"pollPublic",
	"pollQuestion",
	"pin",
	"presentation",
	"replyTo",
	"silent",
	"senderIsOwner",
	"target",
	"targets",
	"text",
	"threadId",
	"timeoutMs",
	"topLevel",
	"to"
]);
/**
* Detects non-standard message action params that may need plugin-owned handling.
*/
function hasPotentialPluginActionParam(params) {
	return Object.entries(params).some(([key, value]) => {
		if (STANDARD_MESSAGE_ACTION_PARAM_KEYS.has(key)) return false;
		if (typeof value === "string") return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value));
		if (typeof value === "number") return Number.isFinite(value);
		return value !== void 0;
	});
}
//#endregion
//#region src/infra/outbound/message-action-spec.ts
/**
* Target-parameter policy for each supported channel message action.
*/
const MESSAGE_ACTION_TARGET_MODE = {
	send: "to",
	broadcast: "none",
	poll: "to",
	"poll-vote": "to",
	react: "to",
	reactions: "to",
	read: "to",
	edit: "to",
	unsend: "to",
	reply: "to",
	sendWithEffect: "to",
	renameGroup: "to",
	setGroupIcon: "to",
	addParticipant: "to",
	removeParticipant: "to",
	leaveGroup: "to",
	sendAttachment: "to",
	delete: "to",
	pin: "to",
	unpin: "to",
	"list-pins": "to",
	permissions: "to",
	"thread-create": "to",
	"thread-list": "none",
	"thread-reply": "to",
	search: "none",
	sticker: "to",
	"sticker-search": "none",
	"member-info": "none",
	"role-info": "none",
	"emoji-list": "none",
	"emoji-upload": "none",
	"sticker-upload": "none",
	"role-add": "none",
	"role-remove": "none",
	"channel-info": "channelId",
	"channel-list": "none",
	"channel-create": "none",
	"channel-edit": "channelId",
	"channel-delete": "channelId",
	"channel-move": "channelId",
	"category-create": "none",
	"category-edit": "none",
	"category-delete": "none",
	"topic-create": "to",
	"topic-edit": "to",
	"voice-status": "none",
	"event-list": "none",
	"event-create": "none",
	timeout: "none",
	kick: "none",
	ban: "none",
	"set-profile": "none",
	"set-presence": "none",
	"download-file": "none",
	"upload-file": "to"
};
const ACTION_TARGET_ALIASES = {
	unsend: { aliases: ["messageId"] },
	edit: { aliases: ["messageId"] },
	react: { aliases: [
		"chatGuid",
		"chatIdentifier",
		"chatId"
	] },
	renameGroup: { aliases: [
		"chatGuid",
		"chatIdentifier",
		"chatId"
	] },
	setGroupIcon: { aliases: [
		"chatGuid",
		"chatIdentifier",
		"chatId"
	] },
	addParticipant: { aliases: [
		"chatGuid",
		"chatIdentifier",
		"chatId"
	] },
	removeParticipant: { aliases: [
		"chatGuid",
		"chatIdentifier",
		"chatId"
	] },
	leaveGroup: { aliases: [
		"chatGuid",
		"chatIdentifier",
		"chatId"
	] }
};
function listActionTargetAliasSpecs(action, params, channel) {
	const specs = [];
	const coreSpec = ACTION_TARGET_ALIASES[action];
	if (coreSpec) specs.push(coreSpec);
	const normalizedChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(channel);
	if (!normalizedChannel || !hasPotentialPluginActionParam(params)) return specs;
	const channelSpec = require_bootstrap_registry.getBootstrapChannelPlugin(normalizedChannel)?.actions?.messageActionTargetAliases?.[action];
	if (channelSpec) specs.push(channelSpec);
	return specs;
}
/** Resolves a plugin-declared delivery alias into the shared target contract. */
function resolveActionDeliveryTargetAlias(action, params, options) {
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(options?.channel);
	if (!channel || !hasPotentialPluginActionParam(params)) return;
	const aliases = options?.aliasSpec ?? require_bootstrap_registry.getBootstrapChannelPlugin(channel)?.actions?.messageActionTargetAliases?.[action];
	const resolved = aliases?.resolveDeliveryTarget?.({ args: params });
	if (resolved !== void 0) return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(resolved);
	const targets = (aliases?.deliveryTargetAliases ?? []).map((alias) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalStringifiedId)(params[alias])).filter((value) => Boolean(value));
	if (new Set(targets).size > 1) throw new Error(`Action ${action} received conflicting delivery target aliases.`);
	return targets[0];
}
/** Reports whether a plugin alias identifies an existing resource rather than a conversation. */
function actionHasResourceReference(action, params, options) {
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(options?.channel);
	if (!channel || !hasPotentialPluginActionParam(params)) return false;
	const aliases = options?.aliasSpec ?? require_bootstrap_registry.getBootstrapChannelPlugin(channel)?.actions?.messageActionTargetAliases?.[action];
	if (!aliases?.deliveryTargetAliases) return false;
	const deliveryAliases = new Set(aliases.deliveryTargetAliases);
	return aliases.aliases.some((alias) => {
		if (deliveryAliases.has(alias)) return false;
		const value = params[alias];
		if (typeof value === "string") return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value));
		return typeof value === "number" && Number.isFinite(value);
	});
}
/**
* Reports whether an action normally needs a destination target.
*/
function actionRequiresTarget(action) {
	return MESSAGE_ACTION_TARGET_MODE[action] !== "none";
}
/**
* Detects whether an action invocation already carries a usable target.
*/
function actionHasTarget(action, params, options) {
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.to) ?? "") return true;
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.channelId) ?? "") return true;
	const specs = listActionTargetAliasSpecs(action, params, options?.channel);
	if (specs.length === 0) return false;
	return specs.some((spec) => spec.aliases.some((alias) => {
		const value = params[alias];
		if (typeof value === "string") return Boolean((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value));
		if (typeof value === "number") return Number.isFinite(value);
		return false;
	}));
}
//#endregion
//#region src/infra/outbound/channel-target.ts
/** Shared non-empty string guard for message-action target params. */
const hasNonEmptyString = require_string_coerce.hasNonEmptyString;
/** Human-readable description for a single message-action destination. */
const CHANNEL_TARGET_DESCRIPTION = "Recipient/channel: E.164 for WhatsApp/Signal, Telegram chat id/@username, Discord/Slack/Mattermost <channelId|user:ID|channel:ID>, or iMessage handle/chat_id";
/** Human-readable description for repeated message-action destinations. */
const CHANNEL_TARGETS_DESCRIPTION = "Recipient/channel targets (same format as --target); accepts ids or names when the directory is available.";
/** Maps canonical `target` into the legacy field required by the action implementation. */
function applyTargetToParams(params) {
	const target = require_string_coerce.normalizeOptionalString(params.args.target) ?? "";
	const hasLegacyTo = hasNonEmptyString(params.args.to);
	const hasLegacyChannelId = hasNonEmptyString(params.args.channelId);
	const mode = MESSAGE_ACTION_TARGET_MODE[params.action] ?? "none";
	if (mode !== "none") {
		if (hasLegacyTo || hasLegacyChannelId) throw new Error("Use `target` instead of `to`/`channelId`.");
	} else if (hasLegacyTo) throw new Error("Use `target` for actions that accept a destination.");
	if (!target) return;
	if (mode === "channelId") {
		params.args.channelId = target;
		return;
	}
	if (mode === "to") {
		params.args.to = target;
		return;
	}
	throw new Error(`Action ${params.action} does not accept a target.`);
}
//#endregion
Object.defineProperty(exports, "CHANNEL_TARGETS_DESCRIPTION", {
	enumerable: true,
	get: function() {
		return CHANNEL_TARGETS_DESCRIPTION;
	}
});
Object.defineProperty(exports, "CHANNEL_TARGET_DESCRIPTION", {
	enumerable: true,
	get: function() {
		return CHANNEL_TARGET_DESCRIPTION;
	}
});
Object.defineProperty(exports, "actionHasResourceReference", {
	enumerable: true,
	get: function() {
		return actionHasResourceReference;
	}
});
Object.defineProperty(exports, "actionHasTarget", {
	enumerable: true,
	get: function() {
		return actionHasTarget;
	}
});
Object.defineProperty(exports, "actionRequiresTarget", {
	enumerable: true,
	get: function() {
		return actionRequiresTarget;
	}
});
Object.defineProperty(exports, "applyTargetToParams", {
	enumerable: true,
	get: function() {
		return applyTargetToParams;
	}
});
Object.defineProperty(exports, "hasNonEmptyString", {
	enumerable: true,
	get: function() {
		return hasNonEmptyString;
	}
});
Object.defineProperty(exports, "hasPotentialPluginActionParam", {
	enumerable: true,
	get: function() {
		return hasPotentialPluginActionParam;
	}
});
Object.defineProperty(exports, "resolveActionDeliveryTargetAlias", {
	enumerable: true,
	get: function() {
		return resolveActionDeliveryTargetAlias;
	}
});
