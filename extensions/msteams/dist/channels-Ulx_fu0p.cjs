require("./rolldown-runtime-u92d-OFm.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_account_snapshot_fields = require("./account-snapshot-fields-B_iADxHC.cjs");
const require_resolve = require("./resolve-B9vhODuI.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_validation_errors = require("./validation-errors-BYsca8xS.cjs");
const require_ws_log = require("./ws-log-DT9Vwq1X.cjs");
const require_catalog = require("./catalog-B1bu3qBh.cjs");
const require_status = require("./status-NOtD-t8C.cjs");
const require_channel_health_policy = require("./channel-health-policy-CnTbAPao.cjs");
const require_validation = require("./validation-D0IXEhQ1.cjs");
const require_channel_activity = require("./channel-activity-qBdJwD4s.cjs");
const require_runtime_plugin_config = require("./runtime-plugin-config-DtQM8a1u.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-methods/channels.ts
function resolveChannelOperationParams(params) {
	const rawParams = params.rawParams;
	if (!require_validation.assertValidParams(rawParams, params.validate, params.method, params.respond)) return null;
	const rawChannel = rawParams.channel;
	const channelId = typeof rawChannel === "string" ? require_registry.normalizeChannelId(rawChannel) : null;
	if (!channelId) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid ${params.method} channel`));
		return null;
	}
	return {
		params: rawParams,
		rawChannel,
		channelId
	};
}
async function respondWithChannelOperationPayload(params) {
	try {
		params.respond(true, await params.run(), void 0);
	} catch (error) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, require_ws_log.formatForLog(error)));
	}
}
const CHANNEL_STATUS_MAX_TIMEOUT_MS = 3e4;
const CHANNEL_STATUS_PROBE_CONCURRENCY = 5;
function channelStatusTimeoutPayload(step, timeoutMs) {
	return {
		ok: false,
		timedOut: true,
		error: `${step} timed out after ${timeoutMs}ms`
	};
}
async function raceWithTimeout(params) {
	const timeoutMs = params.timeoutMs;
	let timer = null;
	const timeout = new Promise((resolve) => {
		timer = setTimeout(() => resolve({ kind: "timeout" }), timeoutMs);
		if (typeof timer === "object" && "unref" in timer) timer.unref();
	});
	const result = await Promise.race([Promise.resolve().then(params.run).then((value) => ({
		kind: "value",
		value
	}), (error) => ({
		kind: "error",
		error
	})), timeout]);
	if (timer) clearTimeout(timer);
	return result;
}
async function runChannelStatusHook(params) {
	const timeoutMs = Math.max(1, params.timeoutMs);
	const result = await raceWithTimeout({
		timeoutMs,
		run: params.run
	});
	if (result.kind === "value") return result.value;
	const warningPrefix = `${params.channelId}:${params.accountId} ${params.step}`;
	if (result.kind === "timeout") {
		params.warnings.push(`${warningPrefix} timed out after ${timeoutMs}ms`);
		return channelStatusTimeoutPayload(params.step, timeoutMs);
	}
	const message = require_ws_log.formatForLog(result.error);
	params.warnings.push(`${warningPrefix} failed: ${message}`);
	return {
		ok: false,
		error: message
	};
}
async function runChannelStatusSummary(params) {
	const timeoutMs = Math.max(1, params.timeoutMs);
	const result = await raceWithTimeout({
		timeoutMs,
		run: params.run
	});
	const warningPrefix = `${params.channelId} summary`;
	if (result.kind === "value") return {
		ok: true,
		value: require_account_snapshot_fields.redactChannelStatusSummaryBaseUrl(result.value)
	};
	if (result.kind === "timeout") {
		const error = `summary timed out after ${timeoutMs}ms`;
		params.warnings.push(`${warningPrefix} timed out after ${timeoutMs}ms`);
		return {
			ok: false,
			timedOut: true,
			error
		};
	}
	const message = require_ws_log.formatForLog(result.error);
	params.warnings.push(`${warningPrefix} failed: ${message}`);
	return {
		ok: false,
		error: message
	};
}
function channelStatusFailureMessage(value) {
	if (!value || typeof value !== "object") return null;
	const record = value;
	if (record.ok !== false || typeof record.error !== "string" || record.error.length === 0) return null;
	return record.error;
}
function resolveChannelsStatusTimeoutMs(params) {
	const fallback = params.probe ? CHANNEL_STATUS_MAX_TIMEOUT_MS : 1e4;
	if (typeof params.timeoutMsRaw !== "number" || !Number.isFinite(params.timeoutMsRaw)) return fallback;
	return Math.min(Math.max(1e3, params.timeoutMsRaw), CHANNEL_STATUS_MAX_TIMEOUT_MS);
}
function resolveRuntimeAccountSnapshot(params) {
	const direct = params.runtime.channelAccounts[params.channelId]?.[params.accountId];
	if (direct) return direct;
	const fallback = params.runtime.channels[params.channelId];
	return fallback?.accountId === params.accountId ? fallback : void 0;
}
function resolveChannelGatewayAccountId(params) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.accountId) || params.plugin.config.defaultAccountId?.(params.cfg) || params.plugin.config.listAccountIds(params.cfg)[0] || "default";
}
/** Log out one channel account through its owning channel plugin. */
async function logoutChannelAccount(params) {
	const resolvedAccountId = resolveChannelGatewayAccountId(params);
	const account = params.plugin.config.resolveAccount(params.cfg, resolvedAccountId);
	await params.context.stopChannel(params.channelId, resolvedAccountId);
	const result = await params.plugin.gateway?.logoutAccount?.({
		cfg: params.cfg,
		accountId: resolvedAccountId,
		account,
		runtime: require_runtime.defaultRuntime
	});
	if (!result) throw new Error(`Channel ${params.channelId} does not support logout`);
	const cleared = result.cleared;
	if (typeof result.loggedOut === "boolean" ? result.loggedOut : cleared) params.context.markChannelLoggedOut(params.channelId, true, resolvedAccountId);
	return {
		channel: params.channelId,
		accountId: resolvedAccountId,
		...result,
		cleared
	};
}
/** Start one channel account through its owning channel plugin. */
async function startChannelAccount(params) {
	if (!params.plugin.gateway?.startAccount) throw new Error(`Channel ${params.channelId} does not support runtime start`);
	const resolvedAccountId = resolveChannelGatewayAccountId(params);
	await params.context.startChannel(params.channelId, resolvedAccountId, { manual: true });
	const started = resolveRuntimeAccountSnapshot({
		runtime: params.context.getRuntimeSnapshot(),
		channelId: params.channelId,
		accountId: resolvedAccountId
	})?.running === true;
	return {
		channel: params.channelId,
		accountId: resolvedAccountId,
		started
	};
}
/** Stop one channel account through its owning channel plugin. */
async function stopChannelAccount(params) {
	const resolvedAccountId = resolveChannelGatewayAccountId(params);
	await params.context.stopChannel(params.channelId, resolvedAccountId);
	const stopped = resolveRuntimeAccountSnapshot({
		runtime: params.context.getRuntimeSnapshot(),
		channelId: params.channelId,
		accountId: resolvedAccountId
	})?.running !== true;
	return {
		channel: params.channelId,
		accountId: resolvedAccountId,
		stopped
	};
}
/** Gateway request handlers for channel list, status, start, stop, and logout. */
const channelsHandlers = {
	"channels.status": async ({ params, respond, context }) => {
		if (!require_src.validateChannelsStatusParams(params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `invalid channels.status params: ${require_validation_errors.formatValidationErrors(require_src.validateChannelsStatusParams.errors)}`));
			return;
		}
		const probe = params.probe === true;
		const timeoutMsRaw = params.timeoutMs;
		const timeoutMs = resolveChannelsStatusTimeoutMs({
			probe,
			timeoutMsRaw
		});
		const rawChannel = params.channel;
		const requestedChannel = typeof rawChannel === "string" ? require_registry.normalizeChannelId(rawChannel) : void 0;
		const cfg = require_runtime_plugin_config.resolveGatewayPluginConfig({ config: context.getRuntimeConfig() });
		const runtime = context.getRuntimeSnapshot();
		const plugins = require_registry.listChannelPlugins();
		const selectedPlugins = requestedChannel ? plugins.filter((plugin) => plugin.id === requestedChannel) : plugins;
		if (rawChannel !== void 0 && !requestedChannel) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown channel: ${require_ws_log.formatForLog(rawChannel)}`));
			return;
		}
		const pluginMap = new Map(selectedPlugins.map((plugin) => [plugin.id, plugin]));
		const statusWarnings = [];
		const resolveRuntimeSnapshot = (channelId, accountId, defaultAccountId) => {
			const accounts = runtime.channelAccounts[channelId];
			const defaultRuntimeLocal = runtime.channels[channelId];
			const raw = accounts?.[accountId] ?? (accountId === defaultAccountId ? defaultRuntimeLocal : void 0);
			if (!raw) return;
			return raw;
		};
		const isAccountEnabled = (plugin, account) => plugin.config.isEnabled ? plugin.config.isEnabled(account, cfg) : !account || typeof account !== "object" || account.enabled !== false;
		const buildAccountSnapshot = async (channelId, plugin, accountId, defaultAccountId) => {
			const account = plugin.config.resolveAccount(cfg, accountId);
			const enabled = isAccountEnabled(plugin, account);
			let probeResult;
			let lastProbeAt = null;
			if (probe && enabled && plugin.status?.probeAccount) {
				let configured = true;
				if (plugin.config.isConfigured) configured = await plugin.config.isConfigured(account, cfg);
				if (configured) {
					probeResult = await runChannelStatusHook({
						channelId,
						accountId,
						step: "probe",
						timeoutMs,
						warnings: statusWarnings,
						run: () => plugin.status.probeAccount({
							account,
							timeoutMs,
							cfg
						})
					});
					lastProbeAt = Date.now();
				}
			}
			let auditResult;
			if (probe && enabled && plugin.status?.auditAccount) {
				let configured = true;
				if (plugin.config.isConfigured) configured = await plugin.config.isConfigured(account, cfg);
				if (configured) auditResult = await runChannelStatusHook({
					channelId,
					accountId,
					step: "audit",
					timeoutMs,
					warnings: statusWarnings,
					run: () => plugin.status.auditAccount({
						account,
						timeoutMs,
						cfg,
						probe: probeResult
					})
				});
			}
			const runtimeSnapshot = resolveRuntimeSnapshot(channelId, accountId, defaultAccountId);
			const snapshot = await require_status.buildChannelAccountSnapshot({
				plugin,
				cfg,
				accountId,
				runtime: runtimeSnapshot,
				probe: probeResult,
				audit: auditResult
			});
			const hookError = channelStatusFailureMessage(auditResult) ?? channelStatusFailureMessage(probeResult);
			if (hookError && !snapshot.lastError) snapshot.lastError = hookError;
			if (lastProbeAt) snapshot.lastProbeAt = lastProbeAt;
			const activity = require_channel_activity.getChannelActivity({
				channel: channelId,
				accountId
			});
			if (snapshot.lastInboundAt == null) snapshot.lastInboundAt = activity.inboundAt;
			if (snapshot.lastOutboundAt == null) snapshot.lastOutboundAt = activity.outboundAt;
			const health = require_channel_health_policy.evaluateChannelHealth(snapshot, {
				channelId,
				now: Date.now(),
				staleEventThresholdMs: require_channel_health_policy.DEFAULT_CHANNEL_STALE_EVENT_THRESHOLD_MS,
				channelConnectGraceMs: require_channel_health_policy.DEFAULT_CHANNEL_CONNECT_GRACE_MS
			});
			if (!health.healthy) snapshot.healthState = health.reason;
			return {
				accountId,
				account,
				snapshot
			};
		};
		const buildChannelAccounts = async (channelId) => {
			const plugin = pluginMap.get(channelId);
			if (!plugin) return {
				accounts: [],
				defaultAccountId: require_account_id.DEFAULT_ACCOUNT_ID,
				defaultAccount: void 0,
				resolvedAccounts: {}
			};
			const accountIds = plugin.config.listAccountIds(cfg);
			const defaultAccountId = require_helpers.resolveChannelDefaultAccountId({
				plugin,
				cfg,
				accountIds
			});
			const resolvedAccounts = {};
			const { results } = await require_resolve.runTasksWithConcurrency({
				tasks: accountIds.map((accountId) => async () => await buildAccountSnapshot(channelId, plugin, accountId, defaultAccountId)),
				limit: probe ? CHANNEL_STATUS_PROBE_CONCURRENCY : accountIds.length || 1
			});
			const accounts = [];
			for (const result of results) if (result) {
				resolvedAccounts[result.accountId] = result.account;
				accounts.push(result.snapshot);
			}
			return {
				accounts,
				defaultAccountId,
				defaultAccount: accounts.find((entry) => entry.accountId === defaultAccountId) ?? accounts[0],
				resolvedAccounts
			};
		};
		const uiCatalog = require_catalog.buildChannelUiCatalog(selectedPlugins);
		const payload = {
			ts: Date.now(),
			channelOrder: uiCatalog.order,
			channelLabels: uiCatalog.labels,
			channelDetailLabels: uiCatalog.detailLabels,
			channelSystemImages: uiCatalog.systemImages,
			channelMeta: uiCatalog.entries,
			...context.getEventLoopHealth ? { eventLoop: context.getEventLoopHealth() } : {},
			channels: {},
			channelAccounts: {},
			channelDefaultAccountId: {}
		};
		const channelsMap = payload.channels;
		const accountsMap = payload.channelAccounts;
		const defaultAccountIdMap = payload.channelDefaultAccountId;
		const { results: channelResults } = await require_resolve.runTasksWithConcurrency({
			tasks: selectedPlugins.map((plugin) => async () => {
				const { accounts, defaultAccountId, defaultAccount, resolvedAccounts } = await buildChannelAccounts(plugin.id);
				const fallbackAccount = resolvedAccounts[defaultAccountId] ?? plugin.config.resolveAccount(cfg, defaultAccountId);
				const fallbackSummary = (lastError) => ({
					configured: defaultAccount?.configured ?? false,
					...lastError ? { lastError } : {}
				});
				let summary = fallbackSummary();
				if (plugin.status?.buildChannelSummary) {
					const summaryResult = await runChannelStatusSummary({
						channelId: plugin.id,
						timeoutMs,
						warnings: statusWarnings,
						run: () => plugin.status.buildChannelSummary({
							account: fallbackAccount,
							cfg,
							defaultAccountId,
							snapshot: defaultAccount ?? { accountId: defaultAccountId }
						})
					});
					summary = summaryResult.ok ? summaryResult.value : fallbackSummary(summaryResult.error);
				}
				return {
					pluginId: plugin.id,
					summary,
					accounts,
					defaultAccountId
				};
			}),
			limit: probe ? CHANNEL_STATUS_PROBE_CONCURRENCY : selectedPlugins.length || 1
		});
		for (const result of channelResults) if (result) {
			channelsMap[result.pluginId] = result.summary;
			accountsMap[result.pluginId] = result.accounts;
			defaultAccountIdMap[result.pluginId] = result.defaultAccountId;
		}
		if (statusWarnings.length > 0) {
			payload.partial = true;
			payload.warnings = statusWarnings.slice(0, 50);
		}
		respond(true, payload, void 0);
	},
	"channels.start": async ({ params, respond, context }) => {
		const resolved = resolveChannelOperationParams({
			method: "channels.start",
			rawParams: params,
			respond,
			validate: require_src.validateChannelsStartParams
		});
		if (!resolved) return;
		const { params: parsedParams, rawChannel, channelId } = resolved;
		const plugin = require_registry.getChannelPlugin(channelId);
		if (!plugin) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown channel: ${require_ws_log.formatForLog(rawChannel)}`));
			return;
		}
		if (!plugin.gateway?.startAccount) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `channel ${channelId} does not support start`));
			return;
		}
		await respondWithChannelOperationPayload({
			respond,
			run: () => startChannelAccount({
				channelId,
				accountId: parsedParams.accountId,
				cfg: require_runtime_plugin_config.resolveGatewayPluginConfig({ config: context.getRuntimeConfig() }),
				context,
				plugin
			})
		});
	},
	"channels.stop": async ({ params, respond, context }) => {
		const resolved = resolveChannelOperationParams({
			method: "channels.stop",
			rawParams: params,
			respond,
			validate: require_src.validateChannelsStopParams
		});
		if (!resolved) return;
		const { params: parsedParams, channelId } = resolved;
		const plugin = require_registry.getChannelPlugin(channelId);
		if (!plugin) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `unknown channel ${channelId}`));
			return;
		}
		const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parsedParams.accountId);
		await respondWithChannelOperationPayload({
			respond,
			run: () => stopChannelAccount({
				channelId,
				accountId,
				cfg: context.getRuntimeConfig(),
				context,
				plugin
			})
		});
	},
	"channels.logout": async ({ params, respond, context }) => {
		const resolved = resolveChannelOperationParams({
			method: "channels.logout",
			rawParams: params,
			respond,
			validate: require_src.validateChannelsLogoutParams
		});
		if (!resolved) return;
		const { params: parsedParams, channelId } = resolved;
		const plugin = require_registry.getChannelPlugin(channelId);
		if (!plugin?.gateway?.logoutAccount) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `channel ${channelId} does not support logout`));
			return;
		}
		const accountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(parsedParams.accountId);
		if (!(await require_io.readConfigFileSnapshot()).valid) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "config invalid; fix it before logging out"));
			return;
		}
		await respondWithChannelOperationPayload({
			respond,
			run: () => logoutChannelAccount({
				channelId,
				accountId,
				cfg: context.getRuntimeConfig(),
				context,
				plugin
			})
		});
	}
};
//#endregion
exports.channelsHandlers = channelsHandlers;
