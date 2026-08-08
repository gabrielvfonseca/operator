require("./rolldown-runtime-u92d-OFm.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_model_pricing_config = require("./model-pricing-config-C6Zdd1-y.cjs");
require("./server-constants-CESgKlPt.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_health = require("./health-oi6Ab5R5.cjs");
require("./status.command-nMAhMIWR.cjs");
const require_status_summary = require("./status.summary-BYUlZfW_.cjs");
require("./server-utils-Cs8RsB0Z.cjs");
//#region src/gateway/server-methods/health.ts
const ADMIN_SCOPE = "operator.admin";
function cachedAccountForRuntimeSnapshot(params) {
	const accountId = params.accountId;
	if (accountId && params.cachedChannel?.accounts?.[accountId]) return params.cachedChannel.accounts[accountId];
}
function cachedLifecycleDiffersFromRuntime(params) {
	for (const key of ["running", "connected"]) {
		const runtimeValue = params.runtimeSnapshot[key];
		if (typeof runtimeValue !== "boolean") continue;
		if (params.cachedAccount?.[key] !== runtimeValue) return true;
	}
	return false;
}
/** Checks whether cached channel health is stale against the live runtime snapshot. */
function cachedHealthDiffersFromRuntime(cached, runtime) {
	for (const [channelId, runtimeSnapshot] of Object.entries(runtime.channels)) {
		if (!runtimeSnapshot) continue;
		const cachedChannel = cached.channels[channelId];
		if (cachedLifecycleDiffersFromRuntime({
			cachedAccount: cachedChannel,
			runtimeSnapshot
		})) return true;
	}
	for (const [channelId, accounts] of Object.entries(runtime.channelAccounts)) {
		if (!accounts) continue;
		const cachedChannel = cached.channels[channelId];
		for (const [accountId, runtimeSnapshot] of Object.entries(accounts)) {
			if (!runtimeSnapshot) continue;
			if (cachedLifecycleDiffersFromRuntime({
				cachedAccount: cachedAccountForRuntimeSnapshot({
					cachedChannel,
					accountId
				}),
				runtimeSnapshot
			})) return true;
		}
	}
	return false;
}
/** Merges cheap live runtime facts into a cached health summary before responding. */
function mergeCachedHealthRuntimeState(params) {
	const { contextEngines: _cachedContextEngines, deliveryQueues: _cachedDeliveryQueues, ...cached } = params.cached;
	const deliveryQueues = require_health.buildDeliveryQueueHealthSummary();
	const quarantinedContextEngines = [];
	for (const entry of require_registry.listContextEngineQuarantines()) {
		const summary = {
			engineId: entry.engineId,
			operation: entry.operation,
			reason: entry.reason,
			failedAt: entry.failedAt.getTime()
		};
		if (entry.owner) summary.owner = entry.owner;
		quarantinedContextEngines.push(summary);
	}
	return {
		...cached,
		...params.eventLoop ? { eventLoop: params.eventLoop } : {},
		...quarantinedContextEngines.length > 0 ? { contextEngines: { quarantined: quarantinedContextEngines } } : {},
		...deliveryQueues ? { deliveryQueues } : {},
		...params.configReloadHotReloadStatus ? { configReload: { hotReloadStatus: params.configReloadHotReloadStatus } } : {},
		modelPricing: require_model_pricing_config.getGatewayModelPricingHealth({ enabled: params.cached.modelPricing?.state !== "disabled" })
	};
}
/** Gateway handlers for health snapshots and status summaries. */
const healthHandlers = {
	health: async ({ respond, context, params, client }) => {
		const { getHealthCache, refreshHealthSnapshot, logHealth } = context;
		const wantsProbe = params?.probe === true;
		const includeSensitive = (Array.isArray(client?.connect?.scopes) ? client.connect.scopes : []).includes(ADMIN_SCOPE);
		const now = Date.now();
		const cached = getHealthCache();
		let cachedDiffersFromRuntime = false;
		if (!wantsProbe && cached) try {
			cachedDiffersFromRuntime = cachedHealthDiffersFromRuntime(cached, context.getRuntimeSnapshot());
		} catch {
			cachedDiffersFromRuntime = false;
		}
		if (!wantsProbe && cached && !cachedDiffersFromRuntime && now - cached.ts < 6e4) {
			respond(true, mergeCachedHealthRuntimeState({
				cached,
				eventLoop: context.getEventLoopHealth?.(),
				configReloadHotReloadStatus: context.getConfigReloaderHotReloadStatus?.()
			}), void 0, { cached: true });
			refreshHealthSnapshot({
				probe: false,
				includeSensitive
			}).catch((err) => logHealth.error(`background health refresh failed: ${require_errors.formatErrorMessage(err)}`));
			return;
		}
		try {
			respond(true, await refreshHealthSnapshot({
				probe: wantsProbe,
				includeSensitive
			}), void 0);
		} catch (err) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(err)));
		}
	},
	status: async ({ respond, client, params, context }) => {
		const status = await require_status_summary.getStatusSummary({
			includeSensitive: (Array.isArray(client?.connect?.scopes) ? client.connect.scopes : []).includes(ADMIN_SCOPE),
			includeChannelSummary: params.includeChannelSummary !== false
		});
		if (context.getEventLoopHealth) status.eventLoop = context.getEventLoopHealth();
		respond(true, status, void 0);
	}
};
//#endregion
exports.healthHandlers = healthHandlers;
