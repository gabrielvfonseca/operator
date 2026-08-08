require("./registry-BWWaGAnQ.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_message_channel = require("./message-channel-jMzaqV09.cjs");
const require_commands_registry_normalize = require("./commands-registry-normalize-Bo5SeH8X.cjs");
const require_mentions = require("./mentions-xs5giNxG.cjs");
const require_command_auth = require("./command-auth-GSEJNgZd.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/commands-context.ts
/** Builds normalized command context from inbound message and authorization state. */
/** Builds command routing/auth metadata consumed by command handlers. */
function buildCommandContext(params) {
	const { ctx, cfg, agentId, sessionKey, isGroup, triggerBodyNormalized } = params;
	const auth = require_command_auth.resolveCommandAuthorization({
		ctx,
		cfg,
		commandAuthorized: params.commandAuthorized
	});
	const surface = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(ctx.Surface ?? ctx.Provider);
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(ctx.OriginatingChannel ?? ctx.Provider ?? surface);
	const from = auth.from ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.SenderId);
	const to = auth.to ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.OriginatingTo);
	const abortKey = sessionKey ?? from ?? to;
	const channelId = require_registry_normalize.normalizeAnyChannelId(channel) ?? (channel ? channel : void 0);
	const rawBodyNormalized = triggerBodyNormalized;
	const commandBodyNormalized = require_commands_registry_normalize.normalizeCommandBody(isGroup ? require_mentions.stripMentions(rawBodyNormalized, ctx, cfg, agentId) : rawBodyNormalized, { botUsername: ctx.BotUsername });
	return {
		surface,
		channel,
		channelId: channelId ?? auth.providerId,
		accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.AccountId),
		ownerList: auth.ownerList,
		senderIsOwner: auth.senderIsOwner,
		isAuthorizedSender: auth.isAuthorizedSender,
		senderId: auth.senderId,
		abortKey,
		rawBodyNormalized,
		commandBodyNormalized,
		from,
		to
	};
}
//#endregion
//#region src/auto-reply/reply/reset-authorization.ts
function isResetAuthorizedForContext(params) {
	const auth = require_command_auth.resolveCommandAuthorization(params);
	if (!params.commandAuthorized && !auth.isAuthorizedSender) return false;
	const provider = params.ctx.Provider;
	if (!(provider ? require_message_channel.isInternalMessageChannel(provider) : require_message_channel.isInternalMessageChannel(params.ctx.Surface))) return true;
	const scopes = params.ctx.GatewayClientScopes;
	if (!Array.isArray(scopes) || scopes.length === 0) return true;
	return scopes.includes("operator.admin");
}
//#endregion
Object.defineProperty(exports, "buildCommandContext", {
	enumerable: true,
	get: function() {
		return buildCommandContext;
	}
});
Object.defineProperty(exports, "isResetAuthorizedForContext", {
	enumerable: true,
	get: function() {
		return isResetAuthorizedForContext;
	}
});
