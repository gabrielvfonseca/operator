require("./rolldown-runtime-u92d-OFm.cjs");
const require_channel_config_helpers = require("./channel-config-helpers-B5LadJVY.cjs");
const require_outbound_session = require("./outbound-session-ca-y9vpw.cjs");
const require_registry_loaded = require("./registry-loaded-BQ6D0fDi.cjs");
const require_channel_resolution = require("./channel-resolution-BHNgrqI2.cjs");
const require_target_resolver = require("./target-resolver-Bn46QRpp.cjs");
const require_bound_account_read = require("./bound-account-read-BwQG9bVB.cjs");
//#region src/cron/isolated-agent/delivery-target.runtime.ts
/** Resolves a cron delivery target through channel plugins with bootstrap allowed. */
async function resolveChannelTargetForDelivery(params) {
	require_channel_resolution.resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	});
	try {
		return await require_target_resolver.resolveChannelTarget({
			cfg: params.cfg,
			channel: params.channel,
			input: params.input,
			accountId: params.accountId,
			unknownTargetMode: "normalized"
		});
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err : new Error(String(err))
		};
	}
}
/** Resolves the outbound session route used for cron delivery threading and mirrors. */
async function resolveOutboundSessionRouteForDelivery(params) {
	require_channel_resolution.resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	});
	return await require_outbound_session.resolveOutboundSessionRoute(params);
}
/** Returns whether a channel can canonicalize outbound cron delivery sessions. */
function channelCanResolveOutboundSessionRoute(params) {
	return Boolean(require_channel_resolution.resolveOutboundChannelPlugin({
		channel: params.channel,
		cfg: params.cfg,
		allowBootstrap: true
	})?.messaging?.resolveOutboundSessionRoute);
}
//#endregion
exports.channelCanResolveOutboundSessionRoute = channelCanResolveOutboundSessionRoute;
exports.getLoadedChannelPluginForRead = require_registry_loaded.getLoadedChannelPluginForRead;
exports.mapAllowFromEntries = require_channel_config_helpers.mapAllowFromEntries;
exports.resolveChannelTargetForDelivery = resolveChannelTargetForDelivery;
exports.resolveFirstBoundAccountId = require_bound_account_read.resolveFirstBoundAccountId;
exports.resolveOutboundSessionRouteForDelivery = resolveOutboundSessionRouteForDelivery;
