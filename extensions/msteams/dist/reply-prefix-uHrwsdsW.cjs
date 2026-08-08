const require_normalize_reply = require("./normalize-reply-DKfUboQ9.cjs");
const require_identity = require("./identity-Dv2mhJl0.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/reply-prefix.ts
/**
* Creates response-prefix options and a live context provider for the selected model.
*/
function createReplyPrefixContext(params) {
	const { cfg, agentId } = params;
	const prefixContext = { identityName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(require_identity.resolveAgentIdentity(cfg, agentId)?.name) };
	const onModelSelected = (ctx) => {
		prefixContext.provider = ctx.provider;
		prefixContext.model = require_normalize_reply.extractShortModelName(ctx.model);
		prefixContext.modelFull = `${ctx.provider}/${ctx.model}`;
		prefixContext.thinkingLevel = ctx.thinkLevel ?? "off";
	};
	return {
		prefixContext,
		responsePrefix: require_identity.resolveEffectiveMessagesConfig(cfg, agentId, {
			channel: params.channel,
			accountId: params.accountId
		}).responsePrefix,
		responsePrefixContextProvider: () => prefixContext,
		onModelSelected
	};
}
/**
* Creates the reply-prefix options object expected by `getReply` call sites.
*/
function createReplyPrefixOptions(params) {
	const { responsePrefix, responsePrefixContextProvider, onModelSelected } = createReplyPrefixContext(params);
	return {
		responsePrefix,
		responsePrefixContextProvider,
		onModelSelected
	};
}
//#endregion
Object.defineProperty(exports, "createReplyPrefixContext", {
	enumerable: true,
	get: function() {
		return createReplyPrefixContext;
	}
});
Object.defineProperty(exports, "createReplyPrefixOptions", {
	enumerable: true,
	get: function() {
		return createReplyPrefixOptions;
	}
});
