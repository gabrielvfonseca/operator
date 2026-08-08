const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_read_only = require("./read-only-MDrE_ZGP.cjs");
const require_helpers = require("./helpers-Dw37GavQ.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_runtime = require("./runtime-BOSfFY3R.cjs");
const require_bindings = require("./bindings-CBZZdnb1.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_runtime$1 = require("./runtime-DUfj3X7c.cjs");
const require_account_snapshot_fields = require("./account-snapshot-fields-B_iADxHC.cjs");
const require_env = require("./env-C7Oxn-fY.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_delivery_queue_sqlite = require("./delivery-queue-sqlite-g1mFGVTq.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_credentials = require("./credentials-CNHX5M4G.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_model_pricing_config = require("./model-pricing-config-C6Zdd1-y.cjs");
const require_heartbeat_summary = require("./heartbeat-summary-BL-oe7t6.cjs");
require("./string-BE2jlabG.cjs");
const require_account_inspection = require("./account-inspection-Dw_dnkQD.cjs");
const require_progress = require("./progress-JkW4pQSo.cjs");
const require_probe = require("./probe-ABDDskKE.cjs");
const require_health_format = require("./health-format-Cxf7oLqH.cjs");
const require_status = require("./status-NOtD-t8C.cjs");
const require_channel_health_policy = require("./channel-health-policy-CnTbAPao.cjs");
const require_gateway_health_auth_diagnostic = require("./gateway-health-auth-diagnostic-DWXqAwbP.cjs");
const require_status_gateway_connection = require("./status.gateway-connection-qfCMWvtt.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region packages/terminal-core/src/health-style.ts
/** Highlight known health status prefixes in a "label: detail" line. */
function styleHealthChannelLine(line, rich) {
	if (!rich) return line;
	const colon = line.indexOf(":");
	if (colon === -1) return line;
	const label = line.slice(0, colon + 1);
	const detail = line.slice(colon + 1).trimStart();
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(detail);
	const applyPrefix = (prefix, color) => `${label} ${color(detail.slice(0, prefix.length))}${detail.slice(prefix.length)}`;
	if (normalized.startsWith("failed")) return applyPrefix("failed", require_theme.theme.error);
	if (normalized.startsWith("ok")) return applyPrefix("ok", require_theme.theme.success);
	if (normalized.startsWith("linked")) return applyPrefix("linked", require_theme.theme.success);
	if (normalized.startsWith("configured")) return applyPrefix("configured", require_theme.theme.success);
	if (normalized.startsWith("not linked")) return applyPrefix("not linked", require_theme.theme.warn);
	if (normalized.startsWith("not configured")) return applyPrefix("not configured", require_theme.theme.muted);
	if (normalized.startsWith("unknown")) return applyPrefix("unknown", require_theme.theme.warn);
	return line;
}
//#endregion
//#region src/commands/health.ts
/** Collects and renders gateway health for channels, agents, plugins, and sessions. */
var health_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	buildDeliveryQueueHealthSummary: () => buildDeliveryQueueHealthSummary,
	emitReachableGatewayAuthDiagnostic: () => emitReachableGatewayAuthDiagnostic,
	formatConfigReloadHealthLine: () => formatConfigReloadHealthLine,
	formatContextEngineHealthLine: () => formatContextEngineHealthLine,
	formatDeliveryQueueHealthLine: () => formatDeliveryQueueHealthLine,
	formatModelPricingHealthLine: () => formatModelPricingHealthLine,
	getHealthSnapshot: () => getHealthSnapshot,
	healthCommand: () => healthCommand
});
const DEFAULT_TIMEOUT_MS = 1e4;
const debugHealth = (...args) => {
	if (require_env.isTruthyEnvValue(process.env.OPERATOR_DEBUG_HEALTH)) console.warn("[health:debug]", ...args);
};
function isGatewayHealthAuthUnavailableError(error) {
	return require_call.isGatewayCredentialsRequiredError(error) || require_credentials.isGatewaySecretRefUnavailableError(error);
}
async function emitReachableGatewayAuthDiagnostic(params) {
	if (!isGatewayHealthAuthUnavailableError(params.error)) return false;
	const details = await require_call.buildGatewayProbeConnectionDetails({
		config: params.config,
		token: params.token,
		password: params.password,
		localPortOverride: params.localPortOverride
	});
	if (!require_gateway_health_auth_diagnostic.gatewayProbeResultSawGateway(await require_probe.probeGatewayStatus({
		url: details.url,
		token: params.token,
		password: params.password,
		tlsFingerprint: details.tlsFingerprint,
		preauthHandshakeTimeoutMs: details.preauthHandshakeTimeoutMs,
		timeoutMs: params.timeoutMs ?? DEFAULT_TIMEOUT_MS,
		config: params.config,
		json: params.json
	}))) return false;
	const diagnostic = require_gateway_health_auth_diagnostic.buildCredentialsRequiredHealthDiagnostic();
	if (params.json) {
		require_runtime.writeRuntimeJson(params.runtime, diagnostic);
		params.runtime.exit(1);
		return true;
	}
	params.runtime.log(require_gateway_health_auth_diagnostic.GATEWAY_HEALTH_REACHABLE_LINE);
	params.runtime.log(diagnostic.error.message);
	params.runtime.exit(1);
	return true;
}
const loadConfigRuntime = async () => await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
const PUBLIC_IMESSAGE_FULL_DISK_ACCESS_ERROR = "imsg cannot access ~/Library/Messages/chat.db. Grant Full Disk Access to the Gateway/launcher process and restart Gateway.";
const redactIMessageProbeErrorMessage = (message) => {
	const trimmed = message.trim();
	if (!trimmed) return "";
	return trimmed.replaceAll(/\/Users\/[^/\s]+\/Library\/Messages\/chat\.db/g, "~/Library/Messages/chat.db");
};
const buildNonSensitiveProbeFailure = (channelId, probe) => {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(probe);
	if (channelId !== "imessage" || !record || record.ok !== false) return;
	if (typeof record.error !== "string") return;
	const error = redactIMessageProbeErrorMessage(record.error);
	if (!/\bimsg\b/i.test(error) || !error.includes("~/Library/Messages/chat.db") || !/\bFull Disk Access\b/i.test(error)) return;
	return {
		ok: false,
		error: PUBLIC_IMESSAGE_FULL_DISK_ACCESS_ERROR
	};
};
const formatDurationParts = (ms) => {
	if (!Number.isFinite(ms)) return "unknown";
	if (ms < 1e3) return `${Math.max(0, Math.round(ms))}ms`;
	const units = [
		{
			label: "w",
			size: 10080 * 60 * 1e3
		},
		{
			label: "d",
			size: 1440 * 60 * 1e3
		},
		{
			label: "h",
			size: 3600 * 1e3
		},
		{
			label: "m",
			size: 60 * 1e3
		},
		{
			label: "s",
			size: 1e3
		}
	];
	let remaining = Math.max(0, Math.floor(ms));
	const parts = [];
	for (const unit of units) {
		const value = Math.floor(remaining / unit.size);
		if (value > 0) {
			parts.push(`${value}${unit.label}`);
			remaining -= value * unit.size;
		}
	}
	if (parts.length === 0) return "0s";
	return parts.join(" ");
};
function formatEventLoopHealthLine(summary) {
	const eventLoop = summary.eventLoop;
	if (!eventLoop) return null;
	return `Gateway event loop: ${eventLoop.degraded ? "degraded" : "ok"}${eventLoop.reasons.length > 0 ? ` reasons=${eventLoop.reasons.join(",")}` : ""} max=${Math.round(eventLoop.delayMaxMs)}ms p99=${Math.round(eventLoop.delayP99Ms)}ms util=${eventLoop.utilization} cpu=${eventLoop.cpuCoreRatio}`;
}
/** Formats optional model-pricing cache degradation for text health output. */
function formatModelPricingHealthLine(summary) {
	const modelPricing = summary.modelPricing;
	if (!modelPricing || modelPricing.state === "disabled") return null;
	if (modelPricing.state === "ok") return null;
	return `Model pricing: warning (optional pricing refresh degraded)${modelPricing.detail ? ` (${modelPricing.detail})` : ""}`;
}
function buildContextEngineHealthSummary() {
	const quarantined = [];
	for (const entry of require_registry.listContextEngineQuarantines()) {
		const summary = {
			engineId: entry.engineId,
			operation: entry.operation,
			reason: entry.reason,
			failedAt: entry.failedAt.getTime()
		};
		if (entry.owner) summary.owner = entry.owner;
		quarantined.push(summary);
	}
	return quarantined.length > 0 ? { quarantined } : void 0;
}
/** Formats context engine quarantine state for text health output. */
function formatContextEngineHealthLine(summary) {
	const quarantined = summary.contextEngines?.quarantined ?? [];
	if (quarantined.length === 0) return null;
	const engines = quarantined.map((entry) => entry.engineId).join(", ");
	return `Context engine: warning (${quarantined.length} quarantined; downgraded to legacy: ${engines})`;
}
/** Builds dead-lettered delivery queue health; shared with cached gateway responses. */
function buildDeliveryQueueHealthSummary() {
	try {
		const failed = require_delivery_queue_sqlite.countFailedDeliveryQueueEntries().map((queue) => {
			const entry = {
				queueName: queue.queueName,
				count: queue.count
			};
			if (queue.oldestFailedAt != null) entry.oldestFailedAt = queue.oldestFailedAt;
			return entry;
		});
		return failed.length > 0 ? { failed } : void 0;
	} catch (error) {
		debugHealth("delivery queue health read failed", error);
		return;
	}
}
/** Formats dead-lettered delivery queue entries for text health output. */
function formatDeliveryQueueHealthLine(summary, now = Date.now()) {
	const failed = summary.deliveryQueues?.failed ?? [];
	if (failed.length === 0) return null;
	const counts = failed.map((queue) => `${queue.queueName}: ${queue.count}`).join(", ");
	const oldest = failed.map((queue) => queue.oldestFailedAt).filter((value) => typeof value === "number");
	return `Delivery queue: warning (dead-lettered entries — ${counts}${oldest.length > 0 ? `; oldest ${require_format_duration.formatDurationHuman(now - Math.min(...oldest))} ago` : ""})`;
}
/** Formats config hot-reload watcher degradation for text health output. */
function formatConfigReloadHealthLine(summary) {
	if (summary.configReload?.hotReloadStatus !== "disabled") return null;
	return "Config hot reload: disabled (watcher retries exhausted; restart the gateway to restore it)";
}
const resolveHeartbeatSummary = (cfg, agentId) => require_heartbeat_summary.resolveHeartbeatSummaryForAgent(cfg, agentId);
const resolveAgentOrder = (cfg) => {
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(cfg);
	const entries = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	const seen = /* @__PURE__ */ new Set();
	const ordered = [];
	for (const entry of entries) {
		if (!entry || typeof entry !== "object") continue;
		if (typeof entry.id !== "string" || !entry.id.trim()) continue;
		const id = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(entry.id);
		if (!id || seen.has(id)) continue;
		seen.add(id);
		ordered.push({
			id,
			name: typeof entry.name === "string" ? entry.name : void 0
		});
	}
	if (!seen.has(defaultAgentId)) ordered.unshift({ id: defaultAgentId });
	if (ordered.length === 0) ordered.push({ id: defaultAgentId });
	return {
		defaultAgentId,
		ordered
	};
};
const buildSessionSummary = async (storePath, agentId) => {
	const { listSessionEntries } = await Promise.resolve().then(() => require("./session-accessor-D_W4fZCX.cjs")).then((n) => n.session_accessor_exports);
	const sessions = listSessionEntries({
		...agentId ? { agentId } : {},
		storePath
	}).filter(({ sessionKey }) => sessionKey !== "global" && sessionKey !== "unknown").map(({ sessionKey, entry }) => ({
		key: sessionKey,
		updatedAt: entry?.updatedAt ?? 0
	})).toSorted((a, b) => b.updatedAt - a.updatedAt);
	const recent = sessions.slice(0, 5).map((s) => ({
		key: s.key,
		updatedAt: s.updatedAt || null,
		age: s.updatedAt ? Date.now() - s.updatedAt : null
	}));
	return {
		path: storePath,
		count: sessions.length,
		recent
	};
};
function buildPluginHealthSummary() {
	const registry = require_runtime$1.getActivePluginRegistry();
	if (!registry) return;
	const loaded = registry.plugins.filter((plugin) => plugin.status === "loaded").map((plugin) => plugin.id).toSorted((left, right) => left.localeCompare(right));
	const errors = registry.plugins.filter((plugin) => plugin.status === "error").map((plugin) => {
		const error = {
			id: plugin.id,
			origin: plugin.origin,
			activated: plugin.activated === true,
			error: plugin.error ?? "unknown plugin load error"
		};
		if (plugin.activationSource) error.activationSource = plugin.activationSource;
		if (plugin.activationReason) error.activationReason = plugin.activationReason;
		if (plugin.failurePhase) error.failurePhase = plugin.failurePhase;
		return error;
	}).toSorted((left, right) => left.id.localeCompare(right.id));
	if (loaded.length === 0 && errors.length === 0) return;
	return {
		loaded,
		errors
	};
}
function readBooleanField(value, key) {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(value);
	if (!record) return;
	return typeof record[key] === "boolean" ? record[key] : void 0;
}
const hasAccountValue = (account) => account !== null && account !== void 0;
function resolveProbeAccountEnabled(params) {
	const fallback = readBooleanField(params.account, "enabled") ?? true;
	try {
		return require_account_inspection.resolveChannelAccountEnabled({
			plugin: params.plugin,
			account: params.account,
			cfg: params.cfg
		});
	} catch (error) {
		params.diagnostics.push(`${params.plugin.id}:${params.accountId}: failed to evaluate enabled state (${require_errors.formatErrorMessage(error)}).`);
		return fallback;
	}
}
async function resolveProbeAccountConfigured(params) {
	const fallback = readBooleanField(params.account, "configured") ?? true;
	try {
		return await require_account_inspection.resolveChannelAccountConfigured({
			plugin: params.plugin,
			account: params.account,
			cfg: params.cfg,
			readAccountConfiguredField: true
		});
	} catch (error) {
		params.diagnostics.push(`${params.plugin.id}:${params.accountId}: failed to evaluate configured state (${require_errors.formatErrorMessage(error)}).`);
		return fallback;
	}
}
async function resolveHealthAccountContext(params) {
	const diagnostics = [];
	let account;
	try {
		account = params.plugin.config.resolveAccount(params.cfg, params.accountId);
	} catch (error) {
		diagnostics.push(`${params.plugin.id}:${params.accountId}: failed to resolve account (${require_errors.formatErrorMessage(error)}).`);
	}
	let inspectedAccount;
	try {
		inspectedAccount = await require_account_inspection.inspectChannelAccount(params);
	} catch (error) {
		diagnostics.push(`${params.plugin.id}:${params.accountId}: failed to inspect account (${require_errors.formatErrorMessage(error)}).`);
	}
	const probeAccount = hasAccountValue(account) ? account : inspectedAccount;
	if (!hasAccountValue(probeAccount)) return {
		probeAccount: {},
		snapshotAccount: {},
		enabled: false,
		configured: false,
		diagnostics
	};
	return {
		probeAccount,
		snapshotAccount: hasAccountValue(inspectedAccount) ? inspectedAccount : probeAccount,
		enabled: resolveProbeAccountEnabled({
			plugin: params.plugin,
			cfg: params.cfg,
			accountId: params.accountId,
			account: probeAccount,
			diagnostics
		}),
		configured: await resolveProbeAccountConfigured({
			plugin: params.plugin,
			cfg: params.cfg,
			accountId: params.accountId,
			account: probeAccount,
			diagnostics
		}),
		diagnostics
	};
}
/** Builds the gateway-side health snapshot for channels, agents, plugins, and sessions. */
async function getHealthSnapshot(params) {
	const timeoutMs = params?.timeoutMs;
	const cfg = await readRuntimeHealthConfig();
	const { defaultAgentId, ordered } = resolveAgentOrder(cfg);
	const channelBindings = require_bindings.buildChannelAccountBindings(cfg);
	const sessionCache = /* @__PURE__ */ new Map();
	const agents = [];
	for (const entry of ordered) {
		const storePath = require_paths.resolveStorePath(cfg.session?.store, { agentId: entry.id });
		const sessionCacheKey = `${storePath}\0${entry.id}`;
		const sessions = sessionCache.get(sessionCacheKey) ?? await buildSessionSummary(storePath, entry.id);
		sessionCache.set(sessionCacheKey, sessions);
		agents.push({
			agentId: entry.id,
			name: entry.name,
			isDefault: entry.id === defaultAgentId,
			heartbeat: resolveHeartbeatSummary(cfg, entry.id),
			sessions
		});
	}
	const defaultAgent = agents.find((agent) => agent.isDefault) ?? agents[0];
	const heartbeatSeconds = defaultAgent?.heartbeat.everyMs ? Math.round(defaultAgent.heartbeat.everyMs / 1e3) : 0;
	const sessions = defaultAgent?.sessions ?? await buildSessionSummary(require_paths.resolveStorePath(cfg.session?.store, { agentId: defaultAgentId }), defaultAgentId);
	const start = Date.now();
	const cappedTimeout = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(timeoutMs, DEFAULT_TIMEOUT_MS, 50);
	const doProbe = params?.probe !== false;
	const includeSensitive = params?.includeSensitive !== false;
	const channels = {};
	const plugins = require_read_only.listReadOnlyChannelPluginsForConfig(cfg, { includeSetupFallbackPlugins: false });
	const channelOrder = plugins.map((plugin) => plugin.id);
	const channelLabels = {};
	for (const plugin of plugins) {
		channelLabels[plugin.id] = plugin.meta.label ?? plugin.id;
		const accountIds = plugin.config.listAccountIds(cfg);
		const defaultAccountId = require_helpers.resolveChannelDefaultAccountId({
			plugin,
			cfg,
			accountIds
		});
		const boundAccounts = channelBindings.get(plugin.id)?.get(defaultAgentId) ?? [];
		const preferredAccountId = require_bindings.resolvePreferredAccountId({
			accountIds,
			defaultAccountId,
			boundAccounts
		});
		const boundAccountIdsAll = Array.from(new Set(Array.from(channelBindings.get(plugin.id)?.values() ?? []).flat()));
		const accountIdsToProbe = Array.from(new Set([
			preferredAccountId,
			defaultAccountId,
			...accountIds,
			...boundAccountIdsAll
		].filter((value) => value?.trim())));
		debugHealth("channel", {
			id: plugin.id,
			accountIds,
			defaultAccountId,
			boundAccounts,
			preferredAccountId,
			accountIdsToProbe
		});
		const accountSummaries = {};
		for (const accountId of accountIdsToProbe) {
			const { probeAccount, snapshotAccount, enabled, configured, diagnostics } = await resolveHealthAccountContext({
				plugin,
				cfg,
				accountId
			});
			if (diagnostics.length > 0) debugHealth("account.diagnostics", {
				channel: plugin.id,
				accountId,
				diagnostics
			});
			let probe;
			let lastProbeAt = null;
			if (enabled && configured && doProbe && plugin.status?.probeAccount) try {
				probe = await plugin.status.probeAccount({
					account: probeAccount,
					timeoutMs: cappedTimeout,
					cfg
				});
				lastProbeAt = Date.now();
			} catch (err) {
				probe = {
					ok: false,
					error: require_errors.formatErrorMessage(err)
				};
				lastProbeAt = Date.now();
			}
			const probeRecord = probe && typeof probe === "object" ? probe : null;
			const bot = probeRecord && typeof probeRecord.bot === "object" ? probeRecord.bot : null;
			if (bot?.username) debugHealth("probe.bot", {
				channel: plugin.id,
				accountId,
				username: bot.username
			});
			const runtimeSnapshot = params?.runtimeSnapshot?.channelAccounts[plugin.id]?.[accountId] ?? (accountId === defaultAccountId ? params?.runtimeSnapshot?.channels[plugin.id] : void 0);
			const nonSensitiveProbeFailure = buildNonSensitiveProbeFailure(plugin.id, probe);
			const snapshot = await require_status.buildChannelAccountSnapshotFromAccount({
				plugin,
				cfg,
				accountId,
				account: snapshotAccount,
				runtime: runtimeSnapshot,
				probe: includeSensitive ? probe : nonSensitiveProbeFailure,
				enabledFallback: enabled,
				configuredFallback: configured
			});
			if (lastProbeAt) snapshot.lastProbeAt = lastProbeAt;
			const health = require_channel_health_policy.evaluateChannelHealth(snapshot, {
				channelId: plugin.id,
				now: Date.now(),
				staleEventThresholdMs: require_channel_health_policy.DEFAULT_CHANNEL_STALE_EVENT_THRESHOLD_MS,
				channelConnectGraceMs: require_channel_health_policy.DEFAULT_CHANNEL_CONNECT_GRACE_MS
			});
			if (!health.healthy) snapshot.healthState = health.reason;
			const summary = plugin.status?.buildChannelSummary ? await plugin.status.buildChannelSummary({
				account: probeAccount,
				cfg,
				defaultAccountId: accountId,
				snapshot
			}) : void 0;
			const record = require_account_snapshot_fields.redactChannelStatusSummaryBaseUrl(summary && typeof summary === "object" ? {
				...snapshot,
				...summary
			} : {
				...snapshot,
				accountId,
				configured
			});
			if (record.configured === void 0) record.configured = configured;
			if (includeSensitive && record.probe === void 0 && probe !== void 0) record.probe = probe;
			if (!includeSensitive) {
				const safeProbeFailure = buildNonSensitiveProbeFailure(plugin.id, record.probe) ?? nonSensitiveProbeFailure;
				if (safeProbeFailure) record.probe = safeProbeFailure;
				else delete record.probe;
			}
			if (record.lastProbeAt === void 0 && lastProbeAt) record.lastProbeAt = lastProbeAt;
			record.accountId = accountId;
			accountSummaries[accountId] = record;
		}
		const fallbackSummary = accountSummaries[preferredAccountId] ?? accountSummaries[defaultAccountId] ?? accountSummaries[accountIdsToProbe[0] ?? preferredAccountId] ?? accountSummaries[(0, _gabrielvfonseca_normalization_core.expectDefined)(Object.keys(accountSummaries)[0], "object.keys(account summaries) entry at 0")];
		if (fallbackSummary) channels[plugin.id] = {
			...fallbackSummary,
			accounts: accountSummaries
		};
	}
	const pluginHealth = buildPluginHealthSummary();
	const contextEngineHealth = buildContextEngineHealthSummary();
	const deliveryQueueHealth = buildDeliveryQueueHealthSummary();
	return {
		ok: true,
		ts: Date.now(),
		durationMs: Date.now() - start,
		...params?.eventLoop ? { eventLoop: params.eventLoop } : {},
		...pluginHealth ? { plugins: pluginHealth } : {},
		...contextEngineHealth ? { contextEngines: contextEngineHealth } : {},
		...deliveryQueueHealth ? { deliveryQueues: deliveryQueueHealth } : {},
		...params?.configReloadHotReloadStatus ? { configReload: { hotReloadStatus: params.configReloadHotReloadStatus } } : {},
		modelPricing: require_model_pricing_config.getGatewayModelPricingHealth({ enabled: require_model_pricing_config.isGatewayModelPricingEnabled(cfg) }),
		channels,
		channelOrder,
		channelLabels,
		heartbeatSeconds,
		defaultAgentId,
		agents,
		sessions: {
			path: sessions.path,
			count: sessions.count,
			recent: sessions.recent
		}
	};
}
/** Runs the `openclaw health` command against the gateway and renders JSON or text. */
async function healthCommand(opts, runtime) {
	const cfg = opts.config ?? await readBestEffortHealthConfig();
	let summary;
	try {
		summary = await require_progress.withProgress({
			label: "Checking gateway health…",
			indeterminate: true,
			enabled: opts.json !== true
		}, async () => await require_call.callGateway({
			method: "health",
			params: opts.verbose ? { probe: true } : void 0,
			timeoutMs: opts.timeoutMs,
			config: cfg,
			token: opts.token,
			password: opts.password,
			localPortOverride: opts.localPortOverride
		}));
	} catch (error) {
		if (await emitReachableGatewayAuthDiagnostic({
			error,
			config: cfg,
			runtime,
			timeoutMs: opts.timeoutMs,
			token: opts.token,
			password: opts.password,
			localPortOverride: opts.localPortOverride,
			json: opts.json
		})) return;
		if (isGatewayHealthAuthUnavailableError(error)) throw error;
		if (opts.json) {
			const payload = require_call.formatGatewayTransportErrorJson(error);
			if (payload) {
				require_runtime.writeRuntimeJson(runtime, payload);
				runtime.exit(1);
				return;
			}
		}
		throw error;
	}
	if (opts.json) require_runtime.writeRuntimeJson(runtime, summary);
	else {
		const debugEnabled = require_env.isTruthyEnvValue(process.env.OPERATOR_DEBUG_HEALTH);
		const rich = require_theme.isRich();
		if (opts.verbose) require_status_gateway_connection.logGatewayConnectionDetails({
			runtime,
			info: require_globals.info,
			message: require_call.buildGatewayConnectionDetails({
				config: cfg,
				localPortOverride: opts.localPortOverride
			}).message
		});
		const localAgents = resolveAgentOrder(cfg);
		const defaultAgentId = summary.defaultAgentId ?? localAgents.defaultAgentId;
		const agents = Array.isArray(summary.agents) ? summary.agents : [];
		const resolvedAgents = agents.length > 0 ? agents : await Promise.all(localAgents.ordered.map(async (entry) => {
			const storePath = require_paths.resolveStorePath(cfg.session?.store, { agentId: entry.id });
			return {
				agentId: entry.id,
				name: entry.name,
				isDefault: entry.id === localAgents.defaultAgentId,
				heartbeat: resolveHeartbeatSummary(cfg, entry.id),
				sessions: await buildSessionSummary(storePath, entry.id)
			};
		}));
		const displayAgents = opts.verbose ? resolvedAgents : resolvedAgents.filter((agent) => agent.agentId === defaultAgentId);
		const channelBindings = require_bindings.buildChannelAccountBindings(cfg);
		const displayPlugins = require_read_only.listReadOnlyChannelPluginsForConfig(cfg, { includeSetupFallbackPlugins: false });
		if (debugEnabled) {
			runtime.log(require_globals.info("[debug] local channel accounts"));
			for (const plugin of displayPlugins) {
				const accountIds = plugin.config.listAccountIds(cfg);
				const defaultAccountId = require_helpers.resolveChannelDefaultAccountId({
					plugin,
					cfg,
					accountIds
				});
				runtime.log(`  ${plugin.id}: accounts=${accountIds.join(", ") || "(none)"} default=${defaultAccountId}`);
				for (const accountId of accountIds) {
					const { snapshotAccount, configured, diagnostics } = await resolveHealthAccountContext({
						plugin,
						cfg,
						accountId
					});
					const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(snapshotAccount);
					const tokenSource = record && typeof record.tokenSource === "string" ? record.tokenSource : void 0;
					runtime.log(`    - ${accountId}: configured=${configured}${tokenSource ? ` tokenSource=${tokenSource}` : ""}`);
					for (const diagnostic of diagnostics) runtime.log(`      ! ${diagnostic}`);
				}
			}
			runtime.log(require_globals.info("[debug] bindings map"));
			for (const [channelId, byAgent] of channelBindings.entries()) {
				const entries = Array.from(byAgent.entries()).map(([agentId, ids]) => `${agentId}=[${ids.join(", ")}]`);
				runtime.log(`  ${channelId}: ${entries.join(" ")}`);
			}
			runtime.log(require_globals.info("[debug] gateway channel probes"));
			for (const [channelId, channelSummary] of Object.entries(summary.channels ?? {})) {
				const accounts = channelSummary.accounts ?? {};
				const probes = Object.entries(accounts).map(([accountId, accountSummary]) => {
					const probe = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(accountSummary.probe);
					const bot = probe ? (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(probe.bot) : null;
					return `${accountId}=${(bot && typeof bot.username === "string" ? bot.username : null) ?? "(no bot)"}`;
				});
				runtime.log(`  ${channelId}: ${probes.join(", ") || "(none)"}`);
			}
		}
		const channelAccountFallbacks = Object.fromEntries(displayPlugins.map((plugin) => {
			const accountIds = plugin.config.listAccountIds(cfg);
			const preferred = require_bindings.resolvePreferredAccountId({
				accountIds,
				defaultAccountId: require_helpers.resolveChannelDefaultAccountId({
					plugin,
					cfg,
					accountIds
				}),
				boundAccounts: channelBindings.get(plugin.id)?.get(defaultAgentId) ?? []
			});
			return [plugin.id, [preferred]];
		}));
		const accountIdsByChannel = (() => {
			const entries = displayAgents.length > 0 ? displayAgents : resolvedAgents;
			const byChannel = {};
			for (const [channelId, byAgent] of channelBindings.entries()) {
				const accountIds = [];
				for (const agent of entries) {
					const ids = byAgent.get(agent.agentId) ?? [];
					for (const id of ids) if (!accountIds.includes(id)) accountIds.push(id);
				}
				if (accountIds.length > 0) byChannel[channelId] = accountIds;
			}
			for (const [channelId, fallbackIds] of Object.entries(channelAccountFallbacks)) if (!byChannel[channelId] || byChannel[channelId].length === 0) byChannel[channelId] = fallbackIds;
			return byChannel;
		})();
		const channelLines = Object.keys(accountIdsByChannel).length > 0 ? require_health_format.formatHealthChannelLines(summary, {
			accountMode: opts.verbose ? "all" : "default",
			accountIdsByChannel
		}) : require_health_format.formatHealthChannelLines(summary, { accountMode: opts.verbose ? "all" : "default" });
		for (const line of channelLines) runtime.log(styleHealthChannelLine(line, rich));
		const eventLoopLine = formatEventLoopHealthLine(summary);
		if (eventLoopLine) runtime.log(styleHealthChannelLine(eventLoopLine, rich));
		const modelPricingLine = formatModelPricingHealthLine(summary);
		if (modelPricingLine) runtime.log(styleHealthChannelLine(modelPricingLine, rich));
		const contextEngineLine = formatContextEngineHealthLine(summary);
		if (contextEngineLine) runtime.log(styleHealthChannelLine(contextEngineLine, rich));
		const deliveryQueueLine = formatDeliveryQueueHealthLine(summary);
		if (deliveryQueueLine) runtime.log(styleHealthChannelLine(deliveryQueueLine, rich));
		const configReloadLine = formatConfigReloadHealthLine(summary);
		if (configReloadLine) runtime.log(styleHealthChannelLine(configReloadLine, rich));
		for (const plugin of displayPlugins) {
			if ((summary.channels?.[plugin.id])?.linked !== true) continue;
			if (!plugin.status?.logSelfId) continue;
			const boundAccounts = channelBindings.get(plugin.id)?.get(defaultAgentId) ?? [];
			const accountIds = plugin.config.listAccountIds(cfg);
			const accountId = require_bindings.resolvePreferredAccountId({
				accountIds,
				defaultAccountId: require_helpers.resolveChannelDefaultAccountId({
					plugin,
					cfg,
					accountIds
				}),
				boundAccounts
			});
			const accountContext = await resolveHealthAccountContext({
				plugin,
				cfg,
				accountId
			});
			if (!accountContext.enabled || !accountContext.configured) continue;
			if (accountContext.diagnostics.length > 0) continue;
			try {
				plugin.status.logSelfId({
					account: accountContext.probeAccount,
					cfg,
					runtime,
					includeChannelPrefix: true
				});
			} catch (error) {
				debugHealth("logSelfId.failed", {
					channel: plugin.id,
					accountId,
					error: require_errors.formatErrorMessage(error)
				});
			}
		}
		if (resolvedAgents.length > 0) {
			const agentLabels = resolvedAgents.map((agent) => agent.isDefault ? `${agent.agentId} (default)` : agent.agentId);
			runtime.log(require_globals.info(`Agents: ${agentLabels.join(", ")}`));
		}
		const heartbeatParts = displayAgents.map((agent) => {
			const everyMs = agent.heartbeat?.everyMs;
			return `${everyMs ? formatDurationParts(everyMs) : "disabled"} (${agent.agentId})`;
		}).filter(Boolean);
		if (heartbeatParts.length > 0) runtime.log(require_globals.info(`Heartbeat interval: ${heartbeatParts.join(", ")}`));
		if (displayAgents.length === 0) {
			runtime.log(require_globals.info(`Session store: ${summary.sessions.path} (${summary.sessions.count} entries)`));
			if (summary.sessions.recent.length > 0) for (const r of summary.sessions.recent) runtime.log(`- ${r.key} (${r.updatedAt ? `${Math.round((Date.now() - r.updatedAt) / 6e4)}m ago` : "no activity"})`);
		} else for (const agent of displayAgents) {
			runtime.log(require_globals.info(`Session store (${agent.agentId}): ${agent.sessions.path} (${agent.sessions.count} entries)`));
			if (agent.sessions.recent.length > 0) for (const r of agent.sessions.recent) runtime.log(`- ${r.key} (${r.updatedAt ? `${Math.round((Date.now() - r.updatedAt) / 6e4)}m ago` : "no activity"})`);
		}
	}
}
async function readBestEffortHealthConfig() {
	const { readBestEffortConfig } = await loadConfigRuntime();
	return await readBestEffortConfig();
}
async function readRuntimeHealthConfig() {
	const { getRuntimeConfig } = await loadConfigRuntime();
	return getRuntimeConfig();
}
//#endregion
Object.defineProperty(exports, "buildDeliveryQueueHealthSummary", {
	enumerable: true,
	get: function() {
		return buildDeliveryQueueHealthSummary;
	}
});
Object.defineProperty(exports, "getHealthSnapshot", {
	enumerable: true,
	get: function() {
		return getHealthSnapshot;
	}
});
Object.defineProperty(exports, "healthCommand", {
	enumerable: true,
	get: function() {
		return healthCommand;
	}
});
Object.defineProperty(exports, "health_exports", {
	enumerable: true,
	get: function() {
		return health_exports;
	}
});
