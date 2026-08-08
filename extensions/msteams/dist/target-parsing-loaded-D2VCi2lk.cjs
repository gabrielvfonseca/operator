require("./plugins-_-82JYfc.cjs");
const require_registry_loaded = require("./registry-loaded-BQ6D0fDi.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
require("./channel-route-BsTxHQuA.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/target-parsing-loaded.ts
/**
* Loaded-channel target parsing helpers.
*
* Bridges deprecated explicit target parsing with modern channel route target helpers.
*/
function resolveCompatParsedRouteTarget(params) {
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.channel);
	const rawTo = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.rawTarget);
	if (!channel || !rawTo) return null;
	const parsed = params.parseTarget(channel, rawTo);
	const fallbackThreadId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalThreadValue)(params.fallbackThreadId);
	return {
		channel,
		rawTo,
		to: parsed?.to ?? rawTo,
		threadId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalThreadValue)(parsed?.threadId ?? fallbackThreadId),
		chatType: parsed?.chatType
	};
}
/** @deprecated Use `messaging.targetResolver` and `messaging.resolveOutboundSessionRoute`. */
function parseExplicitTargetForLoadedChannel(channel, rawTarget) {
	const resolvedChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(channel);
	if (!resolvedChannel) return null;
	const normalizedChannel = require_registry.normalizeChannelId(resolvedChannel) ?? resolvedChannel;
	return require_registry_loaded.getLoadedChannelPluginForRead(normalizedChannel)?.messaging?.parseExplicitTarget?.({ raw: rawTarget }) ?? require_registry.getChannelPlugin(normalizedChannel)?.messaging?.parseExplicitTarget?.({ raw: rawTarget }) ?? null;
}
/** @deprecated Use `messaging.resolveOutboundSessionRoute` for provider-specific target grammar. */
function resolveRouteTargetForLoadedChannel(params) {
	return resolveCompatParsedRouteTarget({
		...params,
		parseTarget: parseExplicitTargetForLoadedChannel
	});
}
function resolveExplicitDeliveryTargetCompat(params) {
	return resolveRouteTargetForLoadedChannel(params);
}
//#endregion
Object.defineProperty(exports, "resolveExplicitDeliveryTargetCompat", {
	enumerable: true,
	get: function() {
		return resolveExplicitDeliveryTargetCompat;
	}
});
