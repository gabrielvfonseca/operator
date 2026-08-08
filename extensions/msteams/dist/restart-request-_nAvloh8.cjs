const require_channel_route = require("./channel-route-BsTxHQuA.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-methods/restart-request.ts
function parseRestartDeliveryContext(params) {
	const raw = params.deliveryContext;
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {
		deliveryContext: void 0,
		threadId: void 0
	};
	const context = raw;
	const deliveryContext = {
		channel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(context.channel),
		to: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(context.to),
		accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(context.accountId)
	};
	return {
		deliveryContext: deliveryContext.channel || deliveryContext.to || deliveryContext.accountId ? deliveryContext : void 0,
		threadId: require_channel_route.stringifyRouteThreadId(context.threadId)
	};
}
function parseRestartRequestParams(params) {
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey);
	const { deliveryContext, threadId } = parseRestartDeliveryContext(params);
	const note = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.note);
	const continuationMessage = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.continuationMessage);
	const restartDelayMsRaw = params.restartDelayMs;
	return {
		sessionKey,
		deliveryContext,
		threadId,
		note,
		continuationMessage,
		restartDelayMs: typeof restartDelayMsRaw === "number" && Number.isFinite(restartDelayMsRaw) ? Math.max(0, Math.floor(restartDelayMsRaw)) : void 0
	};
}
//#endregion
Object.defineProperty(exports, "parseRestartRequestParams", {
	enumerable: true,
	get: function() {
		return parseRestartRequestParams;
	}
});
