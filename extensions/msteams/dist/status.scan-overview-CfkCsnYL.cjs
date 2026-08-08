require("./types.secrets-2BFwbY6H.cjs");
require("./parse-finite-number-BTqU_Omp.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
require("./theme-DwRpEiJc.cjs");
const require_tailscale_status = require("./tailscale-status-DgagbaYD.cjs");
const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_state_migrations_cron_run_logs = require("./state-migrations.cron-run-logs-CqPeTbCe.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
require("./net-CakPoh2E.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
require("./config-DT0qiglW.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
const require_connection_details = require("./connection-details-BmUcttti.cjs");
const require_task_registry_summary = require("./task-registry.summary-Cb3XtY1w.cjs");
const require_os_summary = require("./os-summary-DapJiOfZ.cjs");
const require_probe_target = require("./probe-target-COL7xGKv.cjs");
require("./network-discovery-display-CrYyDxeY.cjs");
const require_control_ui_shared = require("./control-ui-shared-ggCalNPl.cjs");
const require_auth_token_source_conflict = require("./auth-token-source-conflict-BlJ44vZc.cjs");
require("./engine-storage-AsKKXUF-.cjs");
const require_task_registry_audit_shared = require("./task-registry.audit.shared-BUJPXBLE.cjs");
require("./auth-surface-resolution-YxOHdovx.cjs");
let node_fs = require("node:fs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_net_policy_ip = require("@gabrielvfonseca/net-policy/ip");
//#region src/commands/gateway-presence.ts
/** Extracts the gateway's self presence entry from status/presence payloads. */
function parseLegacyGatewaySelfText(text) {
	const match = text.match(/^Gateway:\s*([^ (·]+)(?:\s*\(([^)]+)\))?/i);
	if (!match) return {};
	return {
		host: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(match[1]),
		ip: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(match[2])
	};
}
/** Picks host, ip, version, and platform from the gateway self presence record. */
function pickGatewaySelfPresence(presence) {
	if (!Array.isArray(presence)) return null;
	const entries = presence;
	const self = entries.find((e) => e.mode === "gateway" && e.reason === "self") ?? entries.find((e) => typeof e.text === "string" && e.text.startsWith("Gateway:")) ?? null;
	if (!self) return null;
	const legacy = typeof self.text === "string" ? parseLegacyGatewaySelfText(self.text) : {};
	const result = {
		host: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(self.host) ?? legacy.host,
		ip: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(self.ip) ?? legacy.ip,
		version: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(self.version),
		platform: (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(self.platform)
	};
	const deviceId = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(self.deviceId);
	if (deviceId) result.deviceId = deviceId;
	const instanceId = (0, _gabrielvfonseca_normalization_core_string_coerce.readStringValue)(self.instanceId);
	if (instanceId) result.instanceId = instanceId;
	return result;
}
//#endregion
//#region src/commands/gateway-status/helpers.ts
/** Shared helpers for gateway status target selection, auth, summaries, and probe rendering. */
/** Returns true when the probe established any gateway connection. */
function isProbeReachable(probe) {
	return probe.ok || probe.connectLatencyMs != null;
}
//#endregion
//#region src/commands/status.scan.shared.ts
const gatewayProbeModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.gateway-probe-BDleO3Hj.cjs")));
const probeGatewayModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./probe-DBcFqNwO.cjs")).then((n) => n.probe_exports));
const gatewayCallModuleLoader$1 = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports));
const MEMORY_INDEX_META_KEY = "memory_index_meta_v1";
function loadGatewayProbeModule() {
	return gatewayProbeModuleLoader.load();
}
function loadProbeGatewayModule() {
	return probeGatewayModuleLoader.load();
}
function loadGatewayCallModule$1() {
	return gatewayCallModuleLoader$1.load();
}
function hasBuiltInMemoryState(databasePath) {
	if (!databasePath || !(0, node_fs.existsSync)(databasePath)) return false;
	const { DatabaseSync } = require_state_migrations_cron_run_logs.requireNodeSqlite();
	let db;
	try {
		db = new DatabaseSync(databasePath, { readOnly: true });
		const builtInMemoryTableSets = [{
			meta: require_openclaw_agent_db.MEMORY_INDEX_META_TABLE,
			sources: require_openclaw_agent_db.MEMORY_INDEX_SOURCES_TABLE,
			chunks: require_openclaw_agent_db.MEMORY_INDEX_CHUNKS_TABLE
		}, {
			meta: "meta",
			sources: "files",
			chunks: "chunks"
		}];
		const builtInMemoryTables = builtInMemoryTableSets.flatMap(({ meta, sources, chunks }) => [
			meta,
			sources,
			chunks
		]);
		const tableNames = new Set(db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${builtInMemoryTables.map(() => "?").join(", ")})`).all(...builtInMemoryTables).map((row) => row.name).filter((name) => typeof name === "string"));
		for (const tables of builtInMemoryTableSets) {
			if (tableNames.has(tables.meta) && db.prepare(`SELECT 1 AS ok FROM ${tables.meta} WHERE key = ? LIMIT 1`).get(MEMORY_INDEX_META_KEY)) return true;
			for (const tableName of [tables.sources, tables.chunks]) if (tableNames.has(tableName) && db.prepare(`SELECT 1 AS ok FROM ${tableName} LIMIT 1`).get()) return true;
		}
		return false;
	} catch {
		return false;
	} finally {
		try {
			db?.close();
		} catch {}
	}
}
function isLoopbackGatewayUrl(rawUrl) {
	try {
		const hostname = new URL(rawUrl).hostname.toLowerCase();
		const unbracketed = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
		return unbracketed === "localhost" || (0, _gabrielvfonseca_net_policy_ip.isLoopbackIpAddress)(unbracketed);
	} catch {
		return false;
	}
}
function shouldTryLocalStatusRpcFallback(params) {
	if (params.gatewayMode !== "local" || !params.gatewayProbe || params.gatewayProbe.ok || !isLoopbackGatewayUrl(params.gatewayUrl)) return false;
	return (params.gatewayProbe.error?.toLowerCase() ?? "").includes("timeout") || params.gatewayProbe.auth?.capability === "unknown";
}
async function applyLocalStatusRpcFallback(params) {
	if (params.enabled === false) return params.gatewayProbe;
	if (!shouldTryLocalStatusRpcFallback(params)) return params.gatewayProbe;
	const boundedFallbackTimeoutMs = Math.min(2e3, Math.max(1e3, params.timeoutMs));
	const status = await loadGatewayCallModule$1().then(({ callGateway }) => callGateway({
		config: params.cfg,
		method: "status",
		token: params.gatewayProbeAuth.token,
		password: params.gatewayProbeAuth.password,
		timeoutMs: params.timeoutMsExplicit ? boundedFallbackTimeoutMs : Math.max(params.cfg.gateway?.handshakeTimeoutMs ?? 0, boundedFallbackTimeoutMs),
		mode: require_client_info.GATEWAY_CLIENT_MODES.BACKEND,
		clientName: require_client_info.GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT
	})).catch(() => null);
	if (!status) return params.gatewayProbe;
	const auth = params.gatewayProbe.auth;
	return {
		...params.gatewayProbe,
		ok: true,
		status,
		...auth ? { auth: auth.capability === "unknown" ? {
			...auth,
			capability: "read_only"
		} : auth } : {}
	};
}
function hasExplicitMemorySearchConfig(cfg, agentId) {
	if (cfg.agents?.defaults && Object.hasOwn(cfg.agents.defaults, "memorySearch")) return true;
	return (Array.isArray(cfg.agents?.list) ? cfg.agents.list : []).some((agent) => agent?.id === agentId && Object.hasOwn(agent, "memorySearch"));
}
/** Resolves whether memory status should be shown and which slot owns it. */
function resolveMemoryPluginStatus(cfg) {
	if (!(cfg.plugins?.enabled !== false)) return {
		enabled: false,
		slot: null,
		reason: "plugins disabled"
	};
	const raw = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cfg.plugins?.slots?.memory) ?? "";
	if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw) === "none") return {
		enabled: false,
		slot: null,
		reason: "plugins.slots.memory=\"none\""
	};
	return {
		enabled: true,
		slot: raw || require_config_activation_shared.defaultSlotIdForKey("memory")
	};
}
/** Resolves gateway connection details, probe result, auth warnings, and call overrides. */
async function resolveGatewayProbeSnapshot(params) {
	const gatewayConnection = require_connection_details.buildGatewayConnectionDetailsWithResolvers({ config: params.cfg });
	const { gatewayMode, remoteUrlMissing } = require_probe_target.resolveGatewayProbeTarget(params.cfg);
	const shouldResolveAuth = params.opts.skipProbe !== true && (!remoteUrlMissing || params.opts.resolveAuthWhenRemoteUrlMissing === true);
	const shouldProbe = params.opts.skipProbe !== true && (!remoteUrlMissing || params.opts.probeWhenRemoteUrlMissing === true);
	const gatewayProbeAuthResolution = shouldResolveAuth ? await loadGatewayProbeModule().then(({ resolveGatewayProbeAuthResolution }) => resolveGatewayProbeAuthResolution(params.cfg)) : {
		auth: {},
		warning: void 0
	};
	let gatewayProbeAuthWarning = gatewayProbeAuthResolution.warning;
	const defaultProbeTimeoutMs = Math.max(params.opts.all ? 5e3 : 2500, params.cfg.gateway?.handshakeTimeoutMs ?? 0);
	const timeoutMsExplicit = params.opts.timeoutMs !== void 0;
	const probeTimeoutMs = params.opts.timeoutMs ?? defaultProbeTimeoutMs;
	const initialGatewayProbe = shouldProbe ? await loadProbeGatewayModule().then(({ probeGateway }) => probeGateway({
		url: gatewayConnection.url,
		auth: gatewayProbeAuthResolution.auth,
		preauthHandshakeTimeoutMs: params.cfg.gateway?.handshakeTimeoutMs,
		timeoutMs: probeTimeoutMs,
		detailLevel: params.opts.detailLevel ?? "presence"
	})).catch(() => null) : null;
	const gatewayProbe = await applyLocalStatusRpcFallback({
		cfg: params.cfg,
		gatewayMode,
		gatewayUrl: gatewayConnection.url,
		gatewayProbe: initialGatewayProbe,
		gatewayProbeAuth: gatewayProbeAuthResolution.auth,
		timeoutMs: probeTimeoutMs,
		timeoutMsExplicit,
		enabled: params.opts.localStatusRpcFallback !== false
	});
	if ((params.opts.mergeAuthWarningIntoProbeError ?? true) && gatewayProbeAuthWarning && gatewayProbe?.ok === false) {
		gatewayProbe.error = gatewayProbe.error ? `${gatewayProbe.error}; ${gatewayProbeAuthWarning}` : gatewayProbeAuthWarning;
		gatewayProbeAuthWarning = void 0;
	}
	const gatewayReachable = gatewayProbe ? isProbeReachable(gatewayProbe) : false;
	const gatewaySelf = gatewayProbe?.presence ? pickGatewaySelfPresence(gatewayProbe.presence) : null;
	return {
		gatewayConnection,
		remoteUrlMissing,
		gatewayMode,
		gatewayProbeAuth: gatewayProbeAuthResolution.auth,
		gatewayProbeAuthWarning,
		gatewayProbe,
		gatewayReachable,
		gatewaySelf,
		...remoteUrlMissing ? { gatewayCallOverrides: {
			url: gatewayConnection.url,
			token: gatewayProbeAuthResolution.auth.token,
			password: gatewayProbeAuthResolution.auth.password
		} } : {}
	};
}
/** Builds the published Tailscale HTTPS Control UI URL when exposure is enabled. */
function buildTailscaleHttpsUrl(params) {
	const host = require_tailscale_status.resolveTailscalePublishedHost({
		tailscaleMode: params.tailscaleMode,
		tailnetHost: params.tailscaleDns,
		serviceName: params.serviceName
	});
	return params.tailscaleMode !== "off" && host ? `https://${host}${require_control_ui_shared.normalizeControlUiBasePath(params.controlUiBasePath)}` : null;
}
/** Resolves memory provider status without creating default stores just for status output. */
async function resolveSharedMemoryStatusSnapshot(params) {
	const { cfg, agentStatus, memoryPlugin } = params;
	if (!memoryPlugin.enabled || !memoryPlugin.slot) return null;
	const agentId = agentStatus.defaultId ?? "main";
	if (memoryPlugin.slot !== require_config_activation_shared.defaultSlotIdForKey("memory")) return await resolveMemoryManagerStatusSnapshot(params, agentId);
	const hasExplicitConfig = hasExplicitMemorySearchConfig(cfg, agentId);
	const defaultDatabasePath = params.requireDefaultDatabasePath?.(agentId);
	if (defaultDatabasePath && !hasExplicitConfig && !hasBuiltInMemoryState(defaultDatabasePath)) return null;
	const resolvedMemory = params.resolveMemoryConfig(cfg, agentId);
	if (!resolvedMemory) return null;
	if (!(hasExplicitConfig || hasBuiltInMemoryState(resolvedMemory.store.databasePath))) return null;
	return await resolveMemoryManagerStatusSnapshot(params, agentId);
}
async function resolveMemoryManagerStatusSnapshot(params, agentId) {
	const { manager } = await params.getMemorySearchManager({
		cfg: params.cfg,
		agentId,
		purpose: "status"
	});
	if (!manager) return null;
	try {
		try {
			if (manager.status().backend === "builtin" && manager.probeVectorStoreAvailability) await manager.probeVectorStoreAvailability();
			else await manager.probeVectorAvailability();
		} catch {}
		return {
			agentId,
			...manager.status()
		};
	} finally {
		await manager.close?.().catch(() => {});
	}
}
//#endregion
//#region src/commands/status.scan.bootstrap-shared.ts
function buildColdStartUpdateResult() {
	return {
		root: null,
		installKind: "unknown",
		packageManager: "unknown"
	};
}
function buildColdStartAgentLocalStatuses() {
	return {
		defaultId: "main",
		agents: [],
		totalSessions: 0,
		bootstrapPendingCount: 0
	};
}
/** Builds an empty summary for cold-start status paths that skip network and session work. */
function buildColdStartStatusSummary() {
	return {
		runtimeVersion: null,
		heartbeat: {
			defaultAgentId: "main",
			agents: []
		},
		channelSummary: [],
		queuedSystemEvents: [],
		tasks: require_task_registry_summary.createEmptyTaskRegistrySummary(),
		taskAudit: require_task_registry_audit_shared.createEmptyTaskAuditSummary(),
		sessions: {
			paths: [],
			count: 0,
			defaults: {
				model: null,
				contextTokens: null
			},
			recent: [],
			byAgent: []
		}
	};
}
function shouldSkipStatusScanNetworkChecks(params) {
	return params.coldStart && !params.hasConfiguredChannels && params.all !== true;
}
/** Starts the common async probes used by status scans and exposes their promises to callers. */
async function createStatusScanCoreBootstrap(params) {
	const tailscaleMode = params.cfg.gateway?.tailscale?.mode ?? "off";
	const skipColdStartNetworkChecks = shouldSkipStatusScanNetworkChecks({
		coldStart: params.coldStart,
		hasConfiguredChannels: params.hasConfiguredChannels,
		all: params.opts.all
	});
	const statusTimeoutMs = params.opts.timeoutMs ?? 1e4;
	const updateTimeoutMs = Math.min(params.opts.all ? 6500 : 2500, statusTimeoutMs);
	const tailscaleTimeoutMs = Math.min(1200, statusTimeoutMs);
	const tailscaleDnsPromise = tailscaleMode === "off" ? Promise.resolve(null) : params.getTailnetHostname((cmd, args) => require_exec.runExec(cmd, args, {
		timeoutMs: tailscaleTimeoutMs,
		maxBuffer: 2e5
	})).catch(() => null);
	return {
		tailscaleMode,
		tailscaleDnsPromise,
		updatePromise: skipColdStartNetworkChecks || params.skipUpdateCheck === true ? Promise.resolve(buildColdStartUpdateResult()) : params.getUpdateCheckResult({
			timeoutMs: updateTimeoutMs,
			fetchGit: params.fetchGitUpdate ?? true,
			includeRegistry: params.includeRegistryUpdate ?? true,
			updateConfigChannel: params.cfg.update?.channel ?? null
		}),
		agentStatusPromise: skipColdStartNetworkChecks ? Promise.resolve(buildColdStartAgentLocalStatuses()) : params.getAgentLocalStatuses(params.cfg),
		gatewayProbePromise: resolveGatewayProbeSnapshot({
			cfg: params.cfg,
			opts: {
				...params.opts,
				...params.gatewayProbeTimeoutMs !== void 0 ? { timeoutMs: params.gatewayProbeTimeoutMs } : {},
				...skipColdStartNetworkChecks ? { skipProbe: true } : {},
				localStatusRpcFallback: params.includeLocalStatusRpcFallback !== false
			}
		}),
		skipColdStartNetworkChecks,
		resolveTailscaleHttpsUrl: async () => buildTailscaleHttpsUrl({
			tailscaleMode,
			tailscaleDns: await tailscaleDnsPromise,
			serviceName: params.cfg.gateway?.tailscale?.serviceName,
			controlUiBasePath: params.cfg.gateway?.controlUi?.basePath
		})
	};
}
//#endregion
//#region src/commands/status.scan.config-shared.ts
/** Returns true when tests should avoid the missing-config cold-start fast path. */
function shouldSkipStatusScanMissingConfigFastPath(env = process.env) {
	return env.VITEST === "true" || env.VITEST_POOL_ID !== void 0 || env.NODE_ENV === "test";
}
/** Returns whether status should treat this run as a no-config cold start. */
function resolveStatusScanColdStart(params) {
	const env = params?.env ?? process.env;
	return !(params?.allowMissingConfigFastPath === true && shouldSkipStatusScanMissingConfigFastPath(env)) && !(0, node_fs.existsSync)(require_paths.resolveConfigPath(env));
}
/** Loads best-effort config, resolves read-only secrets, and appends status secret diagnostics. */
async function loadStatusScanCommandConfig(params) {
	const env = params.env ?? process.env;
	const coldStart = resolveStatusScanColdStart({
		env,
		allowMissingConfigFastPath: params.allowMissingConfigFastPath
	});
	const configSnapshot = coldStart && params.allowMissingConfigFastPath === true ? {
		config: {},
		sourceConfig: {}
	} : await params.readConfigSnapshot();
	const loadedConfig = configSnapshot.config;
	const sourceConfig = configSnapshot.sourceConfig;
	const { resolvedConfig, diagnostics } = coldStart && params.allowMissingConfigFastPath === true ? {
		resolvedConfig: loadedConfig,
		diagnostics: []
	} : await params.resolveConfig(loadedConfig);
	const tokenConflict = require_auth_token_source_conflict.resolveGatewayAuthTokenSourceConflict({
		cfg: sourceConfig,
		env
	});
	return {
		coldStart,
		sourceConfig,
		resolvedConfig,
		secretDiagnostics: tokenConflict ? [...diagnostics, tokenConflict.diagnostic] : diagnostics
	};
}
//#endregion
//#region src/commands/status.scan-overview.ts
const statusScanDepsRuntimeModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.scan.deps.runtime-BZhRqUCp.cjs")));
const statusAgentLocalModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.agent-local-DRECGz4d.cjs")));
const statusUpdateModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.update-DbYS8XkD.cjs")).then((n) => n.status_update_exports));
const statusScanRuntimeModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.scan.runtime-CKYG9V4e.cjs")));
const gatewayCallModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./call-CphTnsHC.cjs")).then((n) => n.call_exports));
const statusSummaryModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./status.summary-BYUlZfW_.cjs")).then((n) => n.status_summary_exports));
const channelPluginIdsModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./channel-plugin-ids-CD0w6PY3.cjs")).then((n) => n.channel_plugin_ids_exports));
const configModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports));
const controlUiLinksModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./control-ui-links-CSNzE0Jo.cjs")).then((n) => n.control_ui_links_exports));
const commandConfigResolutionModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./command-config-resolution-DGMgjz9o.cjs")));
const commandSecretTargetsModuleLoader = require_lazy_promise.createLazyImportLoader(() => Promise.resolve().then(() => require("./command-secret-targets-CcsWgblx.cjs")).then((n) => n.command_secret_targets_exports));
function loadStatusScanDepsRuntimeModule() {
	return statusScanDepsRuntimeModuleLoader.load();
}
function loadStatusAgentLocalModule() {
	return statusAgentLocalModuleLoader.load();
}
function loadStatusUpdateModule() {
	return statusUpdateModuleLoader.load();
}
function loadStatusScanRuntimeModule() {
	return statusScanRuntimeModuleLoader.load();
}
function loadGatewayCallModule() {
	return gatewayCallModuleLoader.load();
}
function loadStatusSummaryModule() {
	return statusSummaryModuleLoader.load();
}
function loadChannelPluginIdsModule() {
	return channelPluginIdsModuleLoader.load();
}
function loadConfigModule() {
	return configModuleLoader.load();
}
function loadControlUiLinksModule() {
	return controlUiLinksModuleLoader.load();
}
function loadCommandConfigResolutionModule() {
	return commandConfigResolutionModuleLoader.load();
}
function loadCommandSecretTargetsModule() {
	return commandSecretTargetsModuleLoader.load();
}
async function resolveStatusChannelsStatus(params) {
	if (!params.gatewayReachable) return null;
	const { callGateway } = await loadGatewayCallModule();
	return await callGateway({
		config: params.cfg,
		method: "channels.status",
		params: {
			probe: false,
			timeoutMs: Math.min(8e3, params.opts.timeoutMs ?? 1e4)
		},
		timeoutMs: Math.min(params.opts.all ? 5e3 : 2500, params.opts.timeoutMs ?? 1e4),
		...params.useGatewayCallOverrides === true ? params.gatewayCallOverrides ?? {} : {}
	}).catch(() => null);
}
/** Collects the common status scan data shared by text, JSON, and status-all commands. */
async function collectStatusScanOverview(params) {
	if (params.labels?.loadingConfig) params.progress?.setLabel(params.labels.loadingConfig);
	const { coldStart, sourceConfig, resolvedConfig: cfg, secretDiagnostics } = await loadStatusScanCommandConfig({
		commandName: params.commandName,
		allowMissingConfigFastPath: params.allowMissingConfigFastPath,
		readConfigSnapshot: async () => (await loadConfigModule()).readBestEffortConfigSnapshot({
			observe: false,
			skipPluginValidation: params.skipConfigPluginValidation
		}),
		resolveConfig: async (loadedConfig) => await (await loadCommandConfigResolutionModule()).resolveCommandConfigWithSecrets({
			config: loadedConfig,
			commandName: params.commandName,
			targetIds: (await loadCommandSecretTargetsModule()).getStatusCommandSecretTargetIds(loadedConfig, process.env, { includeChannelTargets: params.includeChannelSecretTargets }),
			mode: "read_only_status",
			...params.runtime ? { runtime: params.runtime } : {}
		})
	});
	params.progress?.tick();
	const hasConfiguredChannels = params.resolveHasConfiguredChannels ? await params.resolveHasConfiguredChannels(cfg, sourceConfig) : await loadChannelPluginIdsModule().then(({ hasConfiguredChannelsForReadOnlyScope }) => hasConfiguredChannelsForReadOnlyScope({
		config: cfg,
		activationSourceConfig: sourceConfig
	}));
	const osSummary = require_os_summary.resolveOsSummary();
	const gatewayProbeTimeoutMs = typeof params.gatewayProbeTimeoutMs === "function" ? params.gatewayProbeTimeoutMs(cfg) : params.gatewayProbeTimeoutMs;
	const bootstrap = await createStatusScanCoreBootstrap({
		coldStart,
		cfg,
		hasConfiguredChannels,
		opts: params.opts,
		skipUpdateCheck: params.skipUpdateCheck,
		fetchGitUpdate: params.fetchGitUpdate,
		includeRegistryUpdate: params.includeRegistryUpdate,
		includeLocalStatusRpcFallback: params.includeLocalStatusRpcFallback,
		gatewayProbeTimeoutMs,
		getTailnetHostname: async (runner) => {
			return await loadStatusScanDepsRuntimeModule().then(({ getTailnetHostname }) => getTailnetHostname(runner));
		},
		getUpdateCheckResult: async (updateParams) => await loadStatusUpdateModule().then(({ getUpdateCheckResult }) => getUpdateCheckResult(updateParams)),
		getAgentLocalStatuses: async (bootstrapCfg) => await loadStatusAgentLocalModule().then(({ getAgentLocalStatuses }) => getAgentLocalStatuses(bootstrapCfg))
	});
	if (params.labels?.checkingTailscale) params.progress?.setLabel(params.labels.checkingTailscale);
	const tailscaleDns = await bootstrap.tailscaleDnsPromise;
	params.progress?.tick();
	if (params.labels?.checkingForUpdates) params.progress?.setLabel(params.labels.checkingForUpdates);
	const update = await bootstrap.updatePromise;
	params.progress?.tick();
	if (params.labels?.resolvingAgents) params.progress?.setLabel(params.labels.resolvingAgents);
	const agentStatus = await bootstrap.agentStatusPromise;
	params.progress?.tick();
	if (params.labels?.probingGateway) params.progress?.setLabel(params.labels.probingGateway);
	const gatewaySnapshot = await bootstrap.gatewayProbePromise;
	params.progress?.tick();
	const tailscaleHttpsUrl = await bootstrap.resolveTailscaleHttpsUrl();
	const advertisedControlUiLinks = params.includeAdvertisedControlUiLinks === true && cfg.gateway?.controlUi?.enabled !== false ? await loadControlUiLinksModule().then(async ({ resolveAdvertisedControlUiLinks }) => resolveAdvertisedControlUiLinks({
		port: (await loadConfigModule()).resolveGatewayPort(cfg),
		bind: cfg.gateway?.bind,
		customBindHost: cfg.gateway?.customBindHost,
		basePath: cfg.gateway?.controlUi?.basePath,
		tlsEnabled: cfg.gateway?.tls?.enabled === true
	})) : void 0;
	const includeChannelsData = params.includeChannelsData !== false;
	const includeLiveChannelStatus = params.includeLiveChannelStatus !== false;
	const { channelsStatus, channelIssues, channels } = includeChannelsData ? await (async () => {
		if (params.labels?.queryingChannelStatus) params.progress?.setLabel(params.labels.queryingChannelStatus);
		const channelsStatusLocal = includeLiveChannelStatus ? await resolveStatusChannelsStatus({
			cfg,
			gatewayReachable: gatewaySnapshot.gatewayReachable,
			opts: params.opts,
			gatewayCallOverrides: gatewaySnapshot.gatewayCallOverrides,
			useGatewayCallOverrides: params.useGatewayCallOverridesForChannelsStatus
		}) : null;
		params.progress?.tick();
		const { collectChannelStatusIssues, buildChannelsTable } = await loadStatusScanRuntimeModule().then(({ statusScanRuntime }) => statusScanRuntime);
		const channelIssuesLocal = channelsStatusLocal ? collectChannelStatusIssues(channelsStatusLocal) : [];
		if (params.labels?.summarizingChannels) params.progress?.setLabel(params.labels.summarizingChannels);
		const channelsLocal = await buildChannelsTable(cfg, {
			showSecrets: params.showSecrets,
			sourceConfig,
			includeSetupFallbackPlugins: params.includeChannelSetupRuntimeFallback !== false,
			liveChannelStatus: channelsStatusLocal,
			...params.channelCredentialResolutionSkipped === true ? { credentialResolutionSkipped: true } : {}
		});
		params.progress?.tick();
		return {
			channelsStatus: channelsStatusLocal,
			channelIssues: channelIssuesLocal,
			channels: channelsLocal
		};
	})() : {
		channelsStatus: null,
		channelIssues: [],
		channels: {
			rows: [],
			details: []
		}
	};
	return {
		coldStart,
		hasConfiguredChannels,
		skipColdStartNetworkChecks: bootstrap.skipColdStartNetworkChecks,
		cfg,
		sourceConfig,
		secretDiagnostics,
		osSummary,
		tailscaleMode: bootstrap.tailscaleMode,
		tailscaleDns,
		tailscaleHttpsUrl,
		...advertisedControlUiLinks ? { advertisedControlUiLinks } : {},
		update,
		gatewaySnapshot,
		channelsStatus,
		channelIssues,
		channels,
		agentStatus
	};
}
/** Resolves the summary object from overview data, preserving cold-start fast-path behavior. */
async function resolveStatusSummaryFromOverview(params) {
	if (params.overview.skipColdStartNetworkChecks) return buildColdStartStatusSummary();
	return await loadStatusSummaryModule().then(({ getStatusSummary }) => getStatusSummary({
		config: params.overview.cfg,
		sourceConfig: params.overview.sourceConfig,
		includeChannelSummary: false
	}));
}
//#endregion
Object.defineProperty(exports, "collectStatusScanOverview", {
	enumerable: true,
	get: function() {
		return collectStatusScanOverview;
	}
});
Object.defineProperty(exports, "resolveMemoryPluginStatus", {
	enumerable: true,
	get: function() {
		return resolveMemoryPluginStatus;
	}
});
Object.defineProperty(exports, "resolveSharedMemoryStatusSnapshot", {
	enumerable: true,
	get: function() {
		return resolveSharedMemoryStatusSnapshot;
	}
});
Object.defineProperty(exports, "resolveStatusSummaryFromOverview", {
	enumerable: true,
	get: function() {
		return resolveStatusSummaryFromOverview;
	}
});
